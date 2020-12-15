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
        ].map(propName => {
            const prop = props.get(propName);

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
            // Ideally we would typehint this as <color># but there's a bug in Chrome that
            // makes that useless. Therefore we don't allow to typehint it and manually split
            // and convert the string.
            // @see https://bugs.chromium.org/p/chromium/issues/detail?id=1017421
            if (propName === '--voronoi-cell-colors') {
                if (!(prop instanceof CSSUnparsedValue)) {
                    console.warn('It seems that you have typehinted `--voronoi-cell-colors` as "<color>#" but unfortunately that\'s not working properly in Chrome until https://bugs.chromium.org/p/chromium/issues/detail?id=1017421 is fixed.\n\nPlease remove the @property declaration for --voronoi-cell-colors to fix this.\n\nFalling back to the default values for now.');
                    return undefined;
                }

                return prop.toString().split(',').map(color => color.trim());
            }

            // All others
            //~> Return the string
            return prop.toString();
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
        const [
            numberOfCells = 25,
            margin = 0,
            lineColor = '#000',
            lineWidth = 1,
            dotColor = 'transparent',
            dotSize = 2,
            cellColors = ["#66ccff", "#99ffcc", "#00ffcc", "#33ccff", "#99ff99", "#66ff99", "#00ffff"],
            seed = 123456,
        ] = this.parseProps(properties);

        ctx.clearRect(-geom.width, -geom.height, 2*geom.width, 2*geom.height);
                    
        const tau = 2 * Math.PI;
        const bbox = { xl: -lineWidth, xr: geom.width + lineWidth, yt: -lineWidth, yb: geom.height + lineWidth };
        this.sites = this.randomSites(geom.width, geom.height, margin/100, cellColors, numberOfCells, seed);
        this.voronoi.recycle(this.diagram);
        this.diagram = this.voronoi.compute(this.sites, bbox);

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

                    ctx.fillStyle = cell.site.cellColor;
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