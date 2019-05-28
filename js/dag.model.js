function VNode(name, reflexive=false) {
	this.name = name; // 节点名称
	// this.id = id;
	this.index = 0; // 当前节点的位置
	this.in = 0; // 入度
	this.out = 0; // 出度
	this.pre = []; // 单链表 - 存放指向本节点的节点的: index
	this.next = []; // 单链表 - 存放邻接节点的: index
	this.func = null; // 指向节点的函数
	this.reflexive;
}

function ENode(v, w) {
	this.startNode = v; // 边的开始节点
	this.endNode = w; // 边的结束节点
}

function DAG() {
	this.vSet = new Set();

	this.vertices = []; // 图节点数组, 邻接表表示
	this.vexNum = 0; // 节点数
	this.edgNum = 0; // 边数
	this.graphType = 'DAG';

	// function 
	this.addVNode = addVNode.bind(this);
	this.addENode = addENode.bind(this);
	this.isHasVNode = isHasVNode.bind(this);
	this.getVNodeByName = getVNodeByName.bind(this);
	this.addRelation = addRelation.bind(this);
	this.build = build.bind(this);
	this.topologicalSort = topologicalSort.bind(this);
	this.travel = travel.bind(this);
	this.createNodes = createNodes.bind(this);
	this.createLinks = createLinks.bind(this);
}

function addVNode(vNode) {
	if (this.isHasVNode(vNode.name)) {
		return;
	}
	this.vexNum++;
	vNode.index = this.vertices.length;
	this.vertices.push(vNode);
	this.vSet.add(vNode);
}

function isHasVNode(name) {
	for (let node of this.vSet) {
		if (node.name === name)
			return true;
	}
	return false;
}

function getVNodeByName(name) {
	for (let node of this.vSet) {
		if (name === node.name)
			return node;
	}
	return new Error('Graph do not has eNode:' + name);
}

function addENode(eNode) {
	this.edgNum++;

	this.vertices[eNode.startNode.index].next.push(eNode.endNode.index);
	this.vertices[eNode.endNode.index].pre.push(eNode.startNode.index);

	this.vertices[eNode.startNode.index].out++;
	this.vertices[eNode.endNode.index].in++;
}

function addRelation(source, taget) {

	let eNode = new ENode(this.getVNodeByName(source), this.getVNodeByName(taget));

	this.edgNum++;

	this.vertices[eNode.startNode.index].next.push(eNode.endNode.index);
	this.vertices[eNode.endNode.index].pre.push(eNode.startNode.index);

	this.vertices[eNode.startNode.index].out++;
	this.vertices[eNode.endNode.index].in++;
}

function createNodes(options) {
	options.map(opt=>this.addVNode(new VNode(opt.id, opt.reflexive)));
}

function createLinks(options) {
	options.map(opt=>this.addRelation(opt.source.id, opt.target.id));
}

/**
 * {[source:'a', target:'b']}
 **/
function build(options) {
	options.forEach(it => {
		for (let key in it) {
			this.addVNode(new VNode(it[key]));
		}
		this.addENode(new ENode(this.getVNodeByName(it.source), this.getVNodeByName(it.target)));
	});
}

/** 拓扑排序算法: 必须是有向无环图 **/
function topologicalSort() {
	let queue = []; // 辅助队列

	for (let i = 0; i < this.vertices.length; ++i) {
		if (this.vertices[i].in === 0) { // 入度为0加入队列
			queue.push(this.vertices[i]);
		}
	}

	// 删除入度为 0 的边.
	while (queue.length) {
		for (let cur = 0; cur < queue.length; ++cur) {
			if (queue[cur].in === 0) {
				this.travel(queue[cur]);
				queue[cur].next.forEach(i => {
					if (queue.indexOf(this.vertices[i]) === -1) {
						queue.push(this.vertices[i]);
					}
					queue[cur].out--;
					this.vertices[i].in--;
				});
				queue.splice(cur, 1);
			}
		}
	}
}

function travel(vNode) {
	alert(`${vNode.name}(${vNode.pre.map(i=>this.vertices[i].name).join()})`);
}