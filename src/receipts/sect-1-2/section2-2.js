import 'babel-polyfill';
import { select, selectAll } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import { min } from 'd3-array';
import { easeCubicOut as connectorEase } from 'd3-ease';
import { dotFactory, receiptsConstants } from './receipts-utils';
import { getElementBox, translator, getTransform, establishContainer, simplifyNumber } from '../../utils';
import { getData } from './section2-data';
import colors from '../../colors.scss';
import { addTextElements } from './section2-textElements';

const d3 = { select, selectAll, scaleLinear, line, connectorEase, min },
    svg = establishContainer(),
    sourceBox = {},
    subCategoryBoxWidths = [],
    detailBoxHeight = 100;

let resolver,
    baseContainer,
    textContainer,
    detailContainer,
    currentDetailIndex,
    data,
    x,
    x0,
    connectors,
    clearance,
    yOffset,
    parentRect,
    baseContainerBox;

function printCoords(coords, shift) {
    const y = shift || coords[1];

    return coords[0] + ',' + y;
}

function setDomain() {
    const domain = [0, 0];

    data.forEach(row => {
        if (row.percent_total < 0) {
            domain[0] += row.percent_total;
        } else {
            domain[1] += row.percent_total;
        }
    })

    return domain;
}

function setScales() {
    const xOffset = getTransform(baseContainer).x,
        domain = setDomain();

    sourceBox.left = Number(parentRect.attr('x')) + xOffset;
    sourceBox.right = sourceBox.left + Number(parentRect.attr('width'));

    x = d3.scaleLinear()
        .domain(domain)
        .range([0, 1190]);

    x0 = d3.scaleLinear()
        .domain(domain)
        .range([sourceBox.left, sourceBox.right]);
}

function setBezier(d) {
    const x0 = (x(d.start) - 600) * .9 + 600,
        x1 = (x(d.end) - 600) * .9 + 600;

    return [x0, x1];
}

function fancyShape(d, i) {
    const coords = {},
        y0 = 0,
        y1 = 150,
        bezier = setBezier(d);

    coords.topLeft = [x0(d.start), y0];
    coords.bottomLeft = [x(d.start), y1];
    coords.bottomRight = [x(d.end), y1];
    coords.topRight = [x0(d.end), y0];

    return `M ${printCoords(coords.topLeft)} C ${printCoords(coords.topLeft, 50)} ${bezier[0]},${y1 * 0.6} ${printCoords(coords.bottomLeft)} L ${printCoords(coords.bottomRight)} C ${bezier[1]},${y1 * 0.6} ${printCoords(coords.topRight, 50)} ${printCoords(coords.topRight)} Z`;
}

function widthCalculator(d) {
    return baseContainerBox.width * d[0] / 100;
}

function offsetText(d, w, textSelection) {
    textSelection.attr('y', function () {
        if (d.mid < 600) {
            // deal with left side
            if (d.mid < clearance) {
                yOffset += 70;
            } else {
                yOffset = 100;
            }

            clearance += w;
        } else {
            // deal with right side
            if (d.mid - w < clearance) {
                yOffset += 70;
            } else {
                yOffset = 100;
            }

            clearance = d.mid;
        }

        return yOffset;
    })
        .attr('style', 'fill:black')
        .attr('text-anchor', function () {
            return (d.mid < 600) ? 'start' : 'end';
        })

    textSelection.selectAll('tspan')
        .attr('dx', function () {
            return (d.mid < 600) ? '5' : '-5';
        })
}

function drawTextConnector(d, i, textSelection) {
    textContainer.append('path')
        .attr('stroke', colors.textColorParagraph)
        .attr('stroke-width', 1)
        .attr('d', function () {
            const textY = Number(textSelection.attr('y'));

            let lineX = d.mid;

            // adjust for collisions
            const compareToIndex = (lineX < 600) ? i - 1 : i + 1,
                compareTo = (compareToIndex >= 0 && compareToIndex < data.length) ? data[compareToIndex].mid : null;

            if (compareTo && Math.abs(compareTo - lineX) < 3) {
                lineX = (lineX < 600) ? compareTo + 3 : compareTo - 3;
            }

            const points = [
                [lineX, 100],
                [lineX, textY + 20]
            ];

            return d3.line()(points);
        })
}

function addText() {
    const dimensions = {height: 100, width: 1200};
    
    textContainer = detailContainer.append('g');

    addTextElements(data, textContainer, x, dimensions, 'details');
}

function renderDetailBoxes() {
    let opacityTracker = 0;
    
    detailContainer.append('g').attr('transform', translator(0, 150)).selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('height', detailBoxHeight)
        .attr('fill', function (d) {
            return (d.percent_total < 0) ? colors.colorGrayDark : colors.colorPrimaryDarker;
        })
        .attr('opacity', function(d){
            if (d.percent_total < 0) {
                return 1;
            } else {
                const o = (opacityTracker) ? 1 - opacityTracker / 7 : 1;
                opacityTracker += 1;
                return o;
            }
        })
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .attr('x', function (d) {
            d.xStart = x(d.start);
            return d.xStart;
        })
        .attr('width', function (d) {
            const w = x(d.end) - x(d.start);

            d.width = w;

            return w;
        })
}

function renderConnectors() {
    const connectorContainer = detailContainer.append('g');

    connectors = connectorContainer.selectAll('path')
        .data(data)
        .enter()
        .append('path')
        .attr('d', fancyShape)
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .attr('fill', 'rgba(100,100,100,0.1)')


    x0.range([sourceBox.left, sourceBox.right])

    connectors.transition()
        .duration(1000)
        .call(transition => {
            transition
                .attr('d', fancyShape)
        })
        .ease(d3.connectorEase)
}

function renderDetailContainer() {
    if (detailContainer) {
        detailContainer.remove();
    }

    baseContainerBox = getElementBox(baseContainer);

    x0.range([0, 1200]);

    // render invisible container first at 100% scale for accurate rendering of child elements
    detailContainer = svg.append('g')
        .classed('detail-container', true)
        .lower()
        .attr('opacity', 0);
}

function transitionDetailContainer() {
    const yPos = 270,
        width = sourceBox.right - sourceBox.left,
        initialSubcategoryScaleFactor = width / 1200;

    detailContainer.attr('opacity', 0.2)
        .attr('transform', `${translator(sourceBox.left, yPos)} scale(${initialSubcategoryScaleFactor}, 0)`);

    detailContainer.transition()
        .duration(1000)
        .attr('opacity', 1)
        .attr('transform', translator(0, yPos) + ' scale(1)')
        .ease();
}

function renderDetail() {
    clearance = 0;
    yOffset = 100;

    setScales();
    renderDetailContainer();
    renderDetailBoxes();
    addText();
    renderConnectors();
    transitionDetailContainer();
}

let waitForReady = new Promise(resolve => {
    resolver = resolve;
})

export function clearDetails() {
    if (detailContainer) {
        detailContainer.remove();
    }
}

export function section2_2_init(_baseContainer) {
    baseContainer = _baseContainer;

    resolver();
}

export function showDetail(d) {
    data = d.subcategories;
    parentRect = d3.select(this);

    if (baseContainer) {
        renderDetail()
    } else {
        waitForReady.then(function(){
            renderDetail();
        })
    }
};