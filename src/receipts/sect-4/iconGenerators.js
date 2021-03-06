import { select } from 'd3-selection';
import colors from '../../colors.scss';

const d3 = { select };

export function addButtonIcon(svg) {
    svg.append('circle')
        .attr('r', 9)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .attr('fill', 'none')
        .attr('cx', 10)
        .attr('cy', 10)

    svg.append('line')
        .attr('x1', 5)
        .attr('x2', 15)
        .attr('y1', 10)
        .attr('y2', 10)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)

    svg.append('line')
        .attr('x1', 10)
        .attr('x2', 10)
        .attr('y1', 5)
        .attr('y2', 15)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
}

export function addXIcon(svg) {
    svg.attr('width', 10)
        .attr('height', 10)

    svg.append('line')
        .attr('x1', 0)
        .attr('x2', 10)
        .attr('y1', 0)
        .attr('y2', 10)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)

    svg.append('line')
        .attr('x1', 0)
        .attr('x2', 10)
        .attr('y1', 10)
        .attr('y2', 0)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
}

export function addSearchIcon(svg) {
    const lineColor = '#555';

    svg.attr('width', 20)
        .attr('height', 20)

    svg.append('circle')
        .attr('r', 7)
        .attr('stroke', lineColor)
        .attr('stroke-width', 1)
        .attr('fill', 'none')
        .attr('cx', 8)
        .attr('cy', 8)

    svg.append('line')
        .attr('x1', 13)
        .attr('x2', 19)
        .attr('y1', 13)
        .attr('y2', 19)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
}

export function addCaretIcon(svg, direction){
    const caretYOffset = 6;
    const caretWidth = 18;
    const caretHeight = 8;
    const caretDown = `M0,${caretYOffset} l${caretWidth / 2},${caretHeight} l${caretWidth / 2},-${caretHeight}`;
    const caretUp = `M0,${caretHeight + caretYOffset} l${caretWidth / 2},-${caretHeight} l${caretWidth / 2},${caretHeight}`;
    const caretD = direction === 'up' ? caretUp : caretDown;
    const existing = svg.selectAll('path');

    if(existing.size()){
        existing.transition()
        .duration(500)
        .attr('d', caretD);
    } else {
        svg.append('path')
        .attr('d', caretD)
        .attr('fill','none')
        .attr('stroke', colors.colorPrimaryAltDarkest);
    }
}