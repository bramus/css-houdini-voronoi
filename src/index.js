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
        ]
    }

    parseProps(props) {
        return [
            '--voronoi-number-of-cells',
            '--voronoi-margin',
            '--voronoi-line-color',
            '--voronoi-line-width',
        ].map(prop => {
            const value = props.get(prop).toString();
            
            switch (prop) {
                case '--voronoi-number-of-cells':
                case '--voronoi-line-width':
                case '--voronoi-margin':	
                    return parseInt(value);

                default:
                    return value;
            }
        });
    }

    randomSites(width, height, margin, bbox, n) {
        const rand = mulberry32(123456);

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
                y: yo + rand() * dy + rand() / dy
            });
        }
        // this.voronoi.recycle(this.diagram);
        return sites;
    }

    paint(ctx, geom, properties) {				
        const [
            numberOfCells,
            margin,
            strokeStyle,
            lineWidth,
        ] = this.parseProps(properties);
                    
        const bbox = { xl: -lineWidth, xr: geom.width + lineWidth, yt: -lineWidth, yb: geom.height + lineWidth };
        this.sites = this.randomSites(geom.width, geom.height, margin/100, bbox, numberOfCells);
        this.voronoi.recycle(this.diagram);
        this.diagram = this.voronoi.compute(this.sites, bbox);

        ctx.beginPath();
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        var edges = this.diagram.edges,
            iEdge = edges.length,
            edge,
            v;
        while (iEdge--) {
            edge = edges[iEdge];
            v = edge.va;
            ctx.moveTo(v.x, v.y);
            v = edge.vb;
            ctx.lineTo(v.x, v.y);
        }
        ctx.stroke();
    }
}

registerPaint("voronoi", VoronoiHoudini);