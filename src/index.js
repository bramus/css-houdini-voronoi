function mulberry32(a) {
    return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

class VoronoiHoudini {
    constructor() {
        this.voronoi = new Voronoi();
        this.sites = [];
        this.diagram = null;
        this.drawSites = false;
        this.drawVertices = false;
    }

    static get inputProperties() {
        return [
            '--voronoi-number-of-cells',
            '--voronoi-margin',
            '--voronoi-line-color',
            '--voronoi-line-width',
            '--voronoi-dot-color',
            '--voronoi-dot-size',
            '--voronoi-cell-colors',
            '--voronoi-seed',
            '--mouse-x',
            '--mouse-y',
            '--voronoi-highlight-color',
        ]
    }

    parseProps(props) {
        return [
            '--voronoi-number-of-cells',
            '--voronoi-margin',
            '--voronoi-line-color',
            '--voronoi-line-width',
            '--voronoi-dot-color',
            '--voronoi-dot-size',
            '--voronoi-cell-colors',
            '--voronoi-seed',
            '--mouse-x',
            '--mouse-y',
            '--voronoi-highlight-color',
        ].map(propName => {
            const prop = props.get(propName);

            // Cater for browsers that don't speak CSS Typed OM and
            // for browsers that do speak it, but haven't registered the props
            if ((typeof CSSUnparsedValue === 'undefined') || (prop instanceof CSSUnparsedValue)) {
                if (!prop.length || prop === '') {
                    return undefined;
                }

                switch (propName) {
                    case '--voronoi-number-of-cells':
                        if (prop.toString().trim() === 'auto') {
                            return 'auto';
                        }
                    case '--voronoi-margin':
                    case '--voronoi-line-width':
                    case '--voronoi-dot-size':
                    case '--voronoi-seed':
                    case '--mouse-x':
                    case '--mouse-y':
                        return parseInt(prop.toString());
                    
                    case '--voronoi-cell-colors':
                        return prop.toString().split(',').map(color => color.trim());

                    default:
                        return prop.toString().trim();
                }
            }

            // Prop is not typed using @property (UnparsedValue) and not set either
            // ~> Return undefined so that we can fall back to the default value during destructuring
            if (prop instanceof CSSUnparsedValue && !prop.length) {
                return undefined;
            }

            // Prop is a UnitValue (Number, Percentage, Integer, …)
            // ~> Return the value
            if (prop instanceof CSSUnitValue) {
                return prop.value;
            }

            // Special case: cell colors
            // We need to get each value using props.getAll();
            if (propName === '--voronoi-cell-colors') {
                return props.getAll(propName).map(prop => prop.toString().trim());
            }

            // All others (such as CSSKeywordValue)
            //~> Return the string
            return prop.toString().trim();
        });
    }

    randomSites(width, height, margin, cellColors, n, seed) {
        const rand = mulberry32(seed);

        // create vertices
        var xmargin = width * margin,
            ymargin = height * margin,
            xo = xmargin,
            dx = width - xmargin * 2,
            yo = ymargin,
            dy = height - ymargin * 2,
            sites = [];

        for (var i = 0; i < n; i++) {
            sites.push({
                x: xo + rand() * dx + rand() / dx,
                y: yo + rand() * dy + rand() / dy,
                cellColor: cellColors[i%cellColors.length],
            });
        }

        // this.voronoi.recycle(this.diagram);
        return sites;
    }

    paint(ctx, geom, properties) {

        // Parse the props, with fallback to default values
        let [
            numberOfCells = 25,
            margin = 0,
            lineColor = '#000',
            lineWidth = 1,
            dotColor = 'transparent',
            dotSize = 2,
            cellColors = ["#66ccff", "#99ffcc", "#00ffcc", "#33ccff", "#99ff99", "#66ff99", "#00ffff"],
            seed = 123456,
            mouseX = -1,
            mouseY = -1,
            highlightColor = 'yellow',
        ] = this.parseProps(properties);

        if (numberOfCells === 'auto') {
            numberOfCells = Math.max(2, Math.floor(geom.width / 30 + geom.height / 30));
        }

        // Clear Canvas
        ctx.clearRect(-geom.width, -geom.height, 2*geom.width, 2*geom.height);
                 
        const tau = 2 * Math.PI;
        const bbox = { xl: -lineWidth, xr: geom.width + lineWidth, yt: -lineWidth, yb: geom.height + lineWidth };
        this.sites = this.randomSites(geom.width, geom.height, margin/100, cellColors, numberOfCells, seed);
        
        // Adjust Active Cell Position
        this.sites[0].x = parseInt(mouseX);
        this.sites[0].y = parseInt(mouseY);
        this.sites[0].cellColor = highlightColor;

        this.voronoi.recycle(this.diagram);
        try {
            this.diagram = this.voronoi.compute(this.sites, bbox);
        } catch (e) {
            return;
        }

        // Draw Active Cell
        var cell = this.diagram.cells[this.sites[0].voronoiId];
        if (cell) {
			var halfedges = cell.halfedges,
                nHalfedges = halfedges.length;
            if (nHalfedges > 2) {
                var v = halfedges[0].getStartpoint();
                ctx.beginPath();
                ctx.moveTo(v.x,v.y);
                for (var iHalfedge=0; iHalfedge<nHalfedges; iHalfedge++) {
                    v = halfedges[iHalfedge].getEndpoint();
                    ctx.lineTo(v.x,v.y);
                }
                ctx.fillStyle = '#faa';
                ctx.fill();
            }
        }

        // Draw Cells
        let cells = this.diagram.cells;
        for (let i=0; i<cells.length; i++) {				
            let cell = cells[i];
            if (cell) {
                let halfedges = cell.halfedges;
                let nHalfedges = halfedges.length;

                // Draw Cell
                if (nHalfedges > 2) {
                    let vertex = halfedges[0].getStartpoint();

                    ctx.beginPath();
                    ctx.moveTo(vertex.x, vertex.y);
                    for (let j=0; j<nHalfedges; j++) {					
                        vertex = halfedges[j].getEndpoint();
                        ctx.lineTo(vertex.x,vertex.y);	
                    }

                    ctx.fillStyle = cell.site.cellColor || 'transparent';
                    ctx.fill();

                    ctx.lineWidth = lineWidth;
                    ctx.strokeStyle = lineColor;
                    ctx.stroke();
                }

                // Draw Site Location (dot)
                if (dotColor && (dotColor != 'transparent')) {
                    ctx.beginPath();
                    ctx.fillStyle = dotColor;
                    ctx.arc(cell.site.x, cell.site.y, dotSize, 0, tau);
                    ctx.fill();
                }
            }								
        }
    }
}

registerPaint("voronoi", VoronoiHoudini);