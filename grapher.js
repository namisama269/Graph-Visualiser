const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");
const INF = 1e9;
const nodeRad = 30;
const headlen = 20;
var nodes = [];
var edges = [];
var adj = [];
var d = [];
var txtarea;
var validData = [];
var maxDist = 0;
var n = -1;
var oldN = 0;
var scale;
var physics = false;
var directed = false;
var indexed = false;


class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    drawRad() {
        c.strokeStyle = "grey";
        c.beginPath();
        c.arc(this.x, this.y, nodeRad, 0, Math.PI * 2, true);
        c.stroke();
    }

    draw(idx) {
        if (indexed) idx++;
        c.fillStyle = "grey";
        c.beginPath();
        c.arc(this.x, this.y, nodeRad / 2, 0, Math.PI * 2, true);
        c.fill();
        c.fillStyle = "white";
        c.font = "20px Arial";
        c.fillText(idx, this.x - 5, this.y + 7);
    };
}

canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;
document.getElementById("force").checked = true;

setInterval(function() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    scale = window.devicePixelRatio || 1;
    canvas.width *= scale;
    canvas.height *= scale;
    c.scale(scale, scale);
    
    txtarea = document.getElementById("input");
    directed = document.getElementById("directed").checked;
    indexed = document.getElementById("indexed").checked;
    physics = document.getElementById("force").checked;
    graphStatus = document.getElementById("graph-status");



    if (updateIfValid()) {
        if (oldN != n) fillNodes();
        fillEdges();
        graphStatus.textContent = "Valid Graph";
        graphStatus.style.color = "greenyellow";
    }
    else {
        if (txtarea == undefined || !txtarea.value.length) {
            graphStatus.textContent = "Empty Graph";
            graphStatus.style.color = "white";
        }
        else {
            graphStatus.textContent = "Invalid Graph";
            graphStatus.style.color = "orange";
        }
    }
    if (physics) force();
    clear();
    drawAll();
}, 15);


function clear() {
    c.beginPath();
    c.fillStyle = "white";
    c.fillRect(0, 0, canvas.width, canvas.height);
}

function updateIfValid() {
    var text = txtarea.value;
    if (text == undefined || !text.length) {
        return false;
    }
    var lines = text.split('\n').filter(Boolean);
    var data = [];
    lines.forEach(element => {
        data.push(element.split(' ').filter(Boolean).map(Number));
    });

    if (data[0].length != 1) return false;
    oldN = n;
    n = data[0][0];
    if (!indexed) for (let i = 1; i < data.length; ++i) if (data[i].length != 2 || Math.max(data[i][0], data[i][1]) >= n || Math.min(data[i][0], data[i][1]) < 0) return false;
    if (indexed) for (let i = 1; i < data.length; ++i) if (data[i].length != 2 || Math.max(data[i][0], data[i][1]) > n || Math.min(data[i][0], data[i][1]) <= 0) return false;
    validData = data;
    return true;
}

function fillNodes() {
    nodes = [];

    for (let i = 0; i < n; ++i) {
        nodes.push(new Node(Math.random() * canvas.width / scale, Math.random() * canvas.height / scale));
    }

}

function fillEdges() {
    edges = [];
    adj = [];
    for (let i = 0; i < n; ++i) adj.push(Array(0));
    for (let i = 1; i < validData.length; ++i) edges.push([validData[i][0], validData[i][1]]);
    edges.forEach((edge) => {
        if (edge[0] == edge[1]) return;
        let fromNode = edge[0];
        let toNode = edge[1];
        if (indexed) {
            --fromNode;
            --toNode;
        }
        adj[fromNode].push(toNode);
        adj[toNode].push(fromNode);
    })
}


function drawAll() {
    c.lineWidth = 3;
    for (let i = 0; i < n; ++i) {
        nodes[i].drawRad();
    }

    edges.forEach((edge) => {
        // if indexed, get nodes - 1
        // if not indxed, get regular nodes
        let fromNode = edge[0];
        let toNode = edge[1];
        if (fromNode == toNode) return;
        if (indexed) {
            --fromNode;
            --toNode;
        }
        if (directed) drawArrow(nodes[fromNode].x, nodes[fromNode].y, nodes[toNode].x, nodes[toNode].y);
        else drawLine(nodes[fromNode].x, nodes[fromNode].y, nodes[toNode].x, nodes[toNode].y);
    });

    for (let i = 0; i < n; ++i) {
        nodes[i].draw(i);
    }

}

function drawLine(x, y, w, z) {
    c.lineWidth = 3;
    c.strokeStyle = "black";
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(w, z);
    c.stroke();
}

function drawArrow(fromx, fromy, tox, toy) {
    c.lineWidth = 3;
    c.strokeStyle = "black";
    var dx = tox - fromx;
    var dy = toy - fromy;
    var angle = Math.atan2(dy, dx);
    tox -= nodeRad * Math.cos(angle) / 2;
    toy -= nodeRad * Math.sin(angle) / 2;
    c.beginPath();
    c.moveTo(fromx, fromy);
    c.lineTo(tox, toy);
    c.moveTo(tox, toy);
    c.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    c.moveTo(tox, toy);
    c.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    c.stroke();
}

function isOn(a, b, x, y) {
    let dist = (x - a) * (x - a) + (y - b) * (y - b);
    return dist <= nodeRad * nodeRad;
}

var currNode = -1;
canvas.addEventListener('mousedown', function(e) {
    let x = e.offsetX;
    let y = e.offsetY;
    for (let i = 0; i < n; ++i) {
        if (isOn(x, y, nodes[i].x, nodes[i].y)) {
            currNode = i;
            break;
        }
    }
});

canvas.addEventListener('mousemove', function(e) {
    if (currNode == -1) return;
    let x = e.offsetX;
    let y = e.offsetY;
    nodes[currNode].x = x;
    nodes[currNode].y = y;
})

window.addEventListener('mouseup', function(e) {
    currNode = -1;
})

function bfs(u) {
    let q = [];
    let front = 0;
    let vis = [];
    for (let i = 0; i < n; ++i) vis.push(false);

    q.push(u);
    vis[u] = true;
    d[u][u] = 0;
    
    while (front != q.length) {
        let node = q[front];

        adj[node].forEach((neighbour) => {
            if (!vis[neighbour]) {
                vis[neighbour] = true;
                d[u][neighbour] = d[u][node] + 1;
                q.push(neighbour);
                maxDist = Math.max(maxDist, d[u][neighbour]);
            }
        });
        ++front;
    }
}

function idealLength() {
    return Math.min(canvas.width, canvas.height) / (maxDist + 1);
}

function force() {
    d = [];
    maxDist = 0;
    for (let i = 0; i < n; ++i) {
        d.push(Array(0));
        for (let j = 0; j < n; ++j) {
            d[i].push(INF);
        }
        bfs(i);
    }

    for (let i = 0; i < n; ++i) {
        if (i == currNode) continue;
        for (let j = 0; j < n; ++j) {
            if (i == j || d[i][j] == INF) continue;
            dx = nodes[i].x - nodes[j].x;
            dy = nodes[i].y - nodes[j].y;
            dist = Math.sqrt(dx * dx + dy * dy);
            xMove = (dx / dist * d[i][j] * idealLength() - dx) / nodeRad;
            yMove = (dy / dist * d[i][j] * idealLength() - dy) / nodeRad;
            nodes[i].x += xMove;
            nodes[i].y += yMove;
        }
    }

    let maxX = -INF;
    let maxY = -INF;
    let minX = INF;
    let minY = INF;

    for (let i = 0; i < n; ++i) {
        maxX = Math.max(maxX, nodes[i].x);
        maxY = Math.max(maxY, nodes[i].y);
        minX = Math.min(minX, nodes[i].x);
        minY = Math.min(minY, nodes[i].y);
    }

    for (let i = 0; i < n; ++i) {
        if (i == currNode) continue;
        nodes[i].x += (canvas.width / 2 - (maxX + minX) / 2) / nodeRad;
        nodes[i].y += (canvas.height / 2 - (maxY + minY) / 2) / nodeRad;
    }

}

