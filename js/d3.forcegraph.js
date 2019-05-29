// JSON API
const data = {
  nodes: [{
    id: "数学",
    fn: "csv",
    handler: "handler"
  }, {
    id: "英语",
    fn: "csv",
    handler: "handler"
  }, {
    id: "化学",
    fn: "csv",
    handler: "handler"
  }, {
    id: "生物",
    fn: "csv",
    handler: "handler"
  }],
  mLinks: [{
    id: 1,
    source: "数学",
    target: "英语",
    label: "数学到英语",
  }, {
    id: 2,
    source: "英语",
    target: "化学",
    label: "英语到化学",
  }, {
    id: 3,
    source: "化学",
    target: "生物",
    label: "化学到生物"
  }]
}

let currentNodeId = null;

let nodes = data.nodes;
let links = data.mLinks.map(l => {
  l.source = getNodeByid(l.source);
  l.target = getNodeByid(l.target);
  return l;
});

function getNodeByid(id) {
  for (let node of nodes) {
    if (node.id === id) {
      return node;
    }
  }
  throw new Error("can find node in nodes");
}

// set up SVG for D3
let cnt = 0;
const width = 1000;
const height = 1000;
const colors = d3.scaleOrdinal(d3.schemeCategory10);

const svg = d3.select('body')
  .append('svg')
  .on('contextmenu', () => {
    d3.event.preventDefault();
  })
  .attr('width', width)
  .attr('height', height);

/**
d3.forceSimulation([nodes]):創造一個新的simulation。這個模型包含著一個nodes的數組，如果沒有指定，就會定義一個空的數組在裏頭，之後可以通過 simulation.nodes([nodes]) 再把nodes array 放入 。不同于之前的d3版本，這裏的simulator是自動開啓的。如果你希望能夠手動控制simulation，需要呼叫simulation.stop()來進行終止simulation 的運作，之後可以通過simulation.tick()再次呼叫。等同于給力進行了初始化。
simulation.tick()：一個持續性刷新的 function 。對現在的圖表進行屬性的設定，繪圖的時候會從這裏得到預期的設定。沒有任何傳遞參數！它不會觸發 events，events 衹會在 simulation.restart() 的時候啓動。The natural number of ticks ⌈ log([alphaMin] / log(1 - [alphaDecay] ⌉; by default, this is 300
**/
// init D3 force layout
const force = d3.forceSimulation()
  .force('link', d3.forceLink().id((d) => d.id).distance(150))
  .force('charge', d3.forceManyBody().strength(-500))
  .force('x', d3.forceX(width / 2))
  .force('y', d3.forceY(height / 2))
  .on('tick', tick);

// init D3 drag support
const drag = d3.drag()
  // Mac Firefox doesn't distinguish between left/right click when Ctrl is held... 
  .filter(() => d3.event.button === 0 || d3.event.button === 2)
  .on('start', (d) => {
    if (!d3.event.active) force.alphaTarget(0.3).restart();

    d.fx = d.x;
    d.fy = d.y;
  })
  .on('drag', (d) => {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  })
  .on('end', (d) => {
    if (!d3.event.active) force.alphaTarget(0);

    d.fx = null;
    d.fy = null;
  });

// define arrow markers for graph links, SVG 用来画线条
svg.append('svg:defs').append('svg:marker')
  .attr('id', 'end-arrow')
  .attr('viewBox', '0 -5 10 10')
  .attr('refX', 6)
  .attr('markerWidth', 3)
  .attr('markerHeight', 3)
  .attr('orient', 'auto')
  .append('svg:path')
  .attr('d', 'M0,-5L10,0L0,5')
  .attr('fill', '#000');

svg.append('svg:defs').append('svg:marker')
  .attr('id', 'start-arrow')
  .attr('viewBox', '0 -5 10 10')
  .attr('refX', 4)
  .attr('markerWidth', 3)
  .attr('markerHeight', 3)
  .attr('orient', 'auto')
  .append('svg:path')
  .attr('d', 'M10,-5L0,0L10,5')
  .attr('fill', '#000');

// line displayed when dragging new nodes
const dragLine = svg.append('svg:path')
  .attr('class', 'link dragline hidden')
  .attr('d', 'M0,0L0,0');

// handles to link and node element groups
let path = svg.append('svg:g').selectAll('path');
let circle = svg.append('svg:g').selectAll('g');

// mouse event vars
let selectedNode = null;
let selectedLink = null;
let mousedownLink = null;
let mousedownNode = null;
let mouseupNode = null;

function resetMouseVars() {
  mousedownNode = null;
  mouseupNode = null;
  mousedownLink = null;
}

// update force layout (called automatically each iteration)
function tick() {
  // draw directed edges with proper padding from node centers
  path.attr('d', (d) => {
    const deltaX = d.target.x - d.source.x;
    const deltaY = d.target.y - d.source.y;
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const normX = deltaX / dist;
    const normY = deltaY / dist;
    const sourcePadding = 24;
    const targetPadding = 27;
    const sourceX = d.source.x + (sourcePadding * normX);
    const sourceY = d.source.y + (sourcePadding * normY);
    const targetX = d.target.x - (targetPadding * normX);
    const targetY = d.target.y - (targetPadding * normY);

    return `M${sourceX},${sourceY}L${targetX},${targetY}`;
  });
  circle.attr('transform', (d) => `translate(${d.x},${d.y})`);
}

// update graph (called when needed)
function restart() {
  // path (link) group
  path = path.data(links);

  // update existing links
  path.classed('selected', (d) => d === selectedLink)
    .style('marker-start', (d) => '')
    .style('marker-end', (d) => 'url(#end-arrow)');

  // remove old links
  path.exit().remove();

  const p = path.enter().append('svg:g');

  // add new links
  path = path.enter().append('svg:path')
    .attr('class', function(d) {
      return 'link ' + d.id;
    })
    .attr('id', (d) => "path" + d.id)
    .classed('selected', (d) => d === selectedLink)
    .style('marker-start', (d) => '')
    .style('marker-end', (d) => 'url(#end-arrow)')
    .on('mousedown', (d) => {
      if (d3.event.ctrlKey) return;
      // select link
      mousedownLink = d;
      selectedLink = (mousedownLink === selectedLink) ? null : mousedownLink;
      selectedNode = null;
      restart();
    })
    .merge(path);

  // add lbel on line
  p.append('text').append('textPath')
    .attr("dx", "30")
    .attr("dy", "-5")
    .attr("text-anchor", "start")
    .style("fill", "#000")
    .style("text-anchor", "middle")
    .attr("startOffset", "50%")
    .attr("xlink:href", function(d) {
      return "#path" + d.id;
    })
    .text(function(d) {
      return d.label;
    });

  console.log(nodes);
  console.log(links);
  // circle (node) group
  // NB: the function arg is crucial here! nodes are known by id, not by index!
  circle = circle.data(nodes, (d) => d.id);

  // update existing nodes (reflexive & selected visual states)
  circle.selectAll('circle')
    .style('fill', (d) => (d === selectedNode) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id))
  // .classed('reflexive', (d) => d.reflexive);

  // remove old nodes
  circle.exit().remove();

  // add new nodes
  const g = circle.enter().append('svg:g');

  g.append('svg:circle')
    .attr('class', 'node')
    .attr('r', 24)
    .style('fill', (d) => (d === selectedNode) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id))
    .style('stroke', (d) => d3.rgb(colors(d.id)).toString())
    // .classed('reflexive', (d) => d.reflexive)
    .on("dblclick", function(d) {
      console.log("双击了", d);
      $("#myModal").modal();
      $("#txt_node_id").val(d.id);
      currentNodeId = d.id;
    })
    .on('mouseover', function(d) {
      if (!mousedownNode || d === mousedownNode) return;
      // enlarge target node
      d3.select(this).attr('transform', 'scale(1.1)');
    })
    .on('mouseout', function(d) {
      if (!mousedownNode || d === mousedownNode) return;
      // unenlarge target node
      d3.select(this).attr('transform', '');
    })
    .on('mousedown', (d) => {
      if (d3.event.ctrlKey) return;

      // select node
      mousedownNode = d;
      selectedNode = (mousedownNode === selectedNode) ? null : mousedownNode;
      selectedLink = null;

      // reposition drag line
      dragLine
        .style('marker-end', 'url(#end-arrow)')
        .classed('hidden', false)
        .attr('d', `M${mousedownNode.x},${mousedownNode.y}L${mousedownNode.x},${mousedownNode.y}`);

      restart();
    })
    .on('mouseup', function(d) {
      if (!mousedownNode) return;

      // needed by FF
      dragLine
        .classed('hidden', true)
        .style('marker-end', '');

      // check for drag-to-self
      mouseupNode = d;
      if (mouseupNode === mousedownNode) {
        resetMouseVars();
        return;
      }

      // unenlarge target node
      d3.select(this).attr('transform', '');

      // add link to graph (update if exists)
      // NB: links are strictly source < target; arrows separately specified by booleans
      const source = mousedownNode;
      const target = mouseupNode;

      const link = links.filter((l) => l.source === source && l.target === target)[0];
      if (link) {
        link[isRight ? 'right' : 'left'] = true;
      } else {
        links.push({
          source,
          target
        });
      }
      // select new link
      selectedLink = link;
      selectedNode = null;
      restart();
    });

  // show node ids
  g.append('svg:text')
    .attr('x', 0)
    .attr('y', 4)
    .attr('class', 'id')
    .attr('id', (d) => d.id)
    .text((d) => d.id);

  circle = g.merge(circle);

  // set the graph in motion
  force.nodes(nodes)
    .force('link').links(links);

  force.alphaTarget(0.3).restart();
}

function mousedown() {
  // because :active only works in WebKit?
  svg.classed('active', true);

  if (d3.event.ctrlKey || mousedownNode || mousedownLink) return;

  // insert new node at point
  const point = d3.mouse(this);
  const node = {
    // id: "节点",
    id: cnt++,
    x: point[0],
    y: point[1]
  };
  // 如果之前的节点存在， 那么不创建节点
  for (let n of nodes) {
    if (n.id === node.id) {
      alert("此节点已存在， 不可以重复添加");
      return;
    }
  }
  nodes.push(node);
  restart();
}

function mousemove() {
  if (!mousedownNode) return;

  // update drag line
  dragLine.attr('d', `M${mousedownNode.x},${mousedownNode.y}L${d3.mouse(this)[0]},${d3.mouse(this)[1]}`);
}

function mouseup() {
  if (mousedownNode) {
    // hide drag line
    dragLine
      .classed('hidden', true)
      .style('marker-end', '');
  }

  // because :active only works in WebKit?
  svg.classed('active', false);

  // clear mouse event vars
  resetMouseVars();
}

function spliceLinksForNode(node) {
  const toSplice = links.filter((l) => l.source === node || l.target === node);
  for (const l of toSplice) {
    links.splice(links.indexOf(l), 1);
  }
}

// only respond once per keydown
let lastKeyDown = -1;

function keydown() {
  d3.event.preventDefault();

  if (lastKeyDown !== -1) return;
  lastKeyDown = d3.event.keyCode;

  // ctrl
  if (d3.event.keyCode === 17) {
    circle.call(drag);
    svg.classed('ctrl', true);
    return;
  }

  if (!selectedNode && !selectedLink) return;

  switch (d3.event.keyCode) {
    case 8: // backspace
    case 46: // delete
      if (selectedNode) {
        nodes.splice(nodes.indexOf(selectedNode), 1);
        spliceLinksForNode(selectedNode);
      } else if (selectedLink) {
        links.splice(links.indexOf(selectedLink), 1);
      }
      selectedLink = null;
      selectedNode = null;
      restart();
      break;
  }
}

function keyup() {
  lastKeyDown = -1;

  // ctrl
  if (d3.event.keyCode === 17) {
    circle.on('.drag', null);
    svg.classed('ctrl', false);
  }
}

$('#myModal').on('show.bs.modal', function(event) {
  console.log("modal显示事件");
});

$('#myModal').on('hidden.bs.modal', function(event) {
  console.log("modal隐藏事件");
  restart();
});

$('#myModal').on('shown.bs.modal', function () {
  $('#txt_node_id').trigger('focus')
})

// modal save data
$('#btn_submit').click(function() {
  let nodeId = $("input[name='txt_node_id']").val();
  console.log(currentNodeId, nodeId);
  let node = getNodeByid(currentNodeId);
  node.id = nodeId;
  updateNodeDisplay(node, currentNodeId);
});

function updateNodeDisplay(node, curr) {
  $('#' + curr).val(node.id);
  $('#' + curr).text(node.id);
  $('#' + curr).html(node.id);
  $('text#' + curr).attr('id', node.id);
  restart();
}

// app starts here
svg.on('mousedown', mousedown)
  .on('mousemove', mousemove)
  .on('mouseup', mouseup);
d3.select(window)
  .on('keydown', keydown)
  .on('keyup', keyup);
restart();