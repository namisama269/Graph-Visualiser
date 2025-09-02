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
var weighted = false;

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

        // Center the node label
        c.fillStyle = "white";
        c.font = "20px Arial";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText(idx, this.x, this.y);
    };
}

canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;
document.getElementById("force").checked = true;

setInterval(function () {
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
    weighted = document.getElementById("weighted").checked;
    let graphStatus = document.getElementById("graph-status");

    if (updateIfValid()) {
        if (oldN != n) fillNodes();
        fillEdges();
        graphStatus.textContent = "Valid Graph";
        graphStatus.style.color = "greenyellow";
    } else {
        if (!txtarea.value.length) {
            graphStatus.textContent = "Empty Graph";
            graphStatus.style.color = "white";
        } else {
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
    if (!text.length) return false;

    var lines = text.split('\n').filter(Boolean);
    var data = [];
    lines.forEach(element => {
        data.push(element.split(' ').filter(Boolean).map(Number));
    });

    if (data[0].length != 1 && data[0].length != 2) return false;

    oldN = n;
    n = data[0][0];
    let m = data[0].length == 2 ? data[0][1] : -1; // optional number of edges

    // Check edge count if m is provided
    if (m != -1 && lines.length - 1 != m) return false;

    for (let i = 1; i < data.length; ++i) {
        if (data[i].length < 2) return false;  // At least two numbers per edge
        let u = data[i][0], v = data[i][1];
        if (!indexed && (u < 0 || v < 0 || u >= n || v >= n)) return false;
        if (indexed && (u <= 0 || v <= 0 || u > n || v > n)) return false;
    }

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
    for (let i = 0; i < n; ++i) adj.push([]);
    for (let i = 1; i < validData.length; ++i) {
        let fromNode = validData[i][0];
        let toNode = validData[i][1];
        let w = 1; 
        if (weighted && validData[i].length >= 3) w = validData[i][2];
        edges.push([fromNode, toNode, w]);
        if (indexed) {
            --fromNode;
            --toNode;
        }
        adj[fromNode].push(toNode);
        adj[toNode].push(fromNode);
    }
}

function drawAll() {
    c.lineWidth = 3;
    for (let i = 0; i < n; ++i) {
        nodes[i].drawRad();
    }

    edges.forEach((edge) => {
        let fromNode = edge[0];
        let toNode = edge[1];
        let w = edge[2];
        if (fromNode == toNode) return;
        if (indexed) {
            --fromNode;
            --toNode;
        }

        let midX = (nodes[fromNode].x + nodes[toNode].x) / 2;
        let midY = (nodes[fromNode].y + nodes[toNode].y) / 2;

        if (weighted) {
            let dx = nodes[toNode].x - nodes[fromNode].x;
            let dy = nodes[toNode].y - nodes[fromNode].y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            let ux = dx / dist;
            let uy = dy / dist;

            // Dynamic radius for weight circle
            c.font = "24px Arial";
            const textWidth = c.measureText(w).width;
            const radius = Math.max(15, textWidth/2 + 5);

            // Compute offset so edge avoids circle
            let offset = radius + 5;

            // Draw two edge segments (before and after circle)
            drawLine(nodes[fromNode].x, nodes[fromNode].y, midX - ux*offset, midY - uy*offset);
            drawLine(midX + ux*offset, midY + uy*offset, nodes[toNode].x, nodes[toNode].y);

            // Draw weight circle
            c.beginPath();
            c.fillStyle = "white";
            c.arc(midX, midY, radius, 0, Math.PI*2);
            c.fill();

            // Draw weight text
            c.fillStyle = "black";
            c.textAlign = "center";
            c.textBaseline = "middle";
            c.fillText(w, midX, midY);

            // Draw arrowhead only on the second segment
            if (directed) {
                const arrowStartX = midX + ux*offset;
                const arrowStartY = midY + uy*offset;
                drawArrow(arrowStartX, arrowStartY, nodes[toNode].x, nodes[toNode].y);
            }
        } else {
            if (directed) drawArrow(nodes[fromNode].x, nodes[fromNode].y, nodes[toNode].x, nodes[toNode].y);
            else drawLine(nodes[fromNode].x, nodes[fromNode].y, nodes[toNode].x, nodes[toNode].y);
        }
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
canvas.addEventListener('mousedown', function (e) {
    let x = e.offsetX;
    let y = e.offsetY;
    for (let i = 0; i < n; ++i) {
        if (isOn(x, y, nodes[i].x, nodes[i].y)) {
            currNode = i;
            break;
        }
    }
});

canvas.addEventListener('mousemove', function (e) {
    if (currNode == -1) return;
    nodes[currNode].x = e.offsetX;
    nodes[currNode].y = e.offsetY;
})

window.addEventListener('mouseup', function (e) {
    currNode = -1;
})

function bfs(u) {
    let q = [];
    let front = 0;
    let vis = Array(n).fill(false);
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
        d.push(Array(n).fill(INF));
        bfs(i);
    }

    for (let i = 0; i < n; ++i) {
        if (i == currNode) continue;
        for (let j = 0; j < n; ++j) {
            if (i == j || d[i][j] == INF) continue;
            let dx = nodes[i].x - nodes[j].x;
            let dy = nodes[i].y - nodes[j].y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            let xMove = (dx / dist * d[i][j] * idealLength() - dx) / nodeRad;
            let yMove = (dy / dist * d[i][j] * idealLength() - dy) / nodeRad;
            nodes[i].x += xMove;
            nodes[i].y += yMove;
        }
    }

    let maxX = -INF, maxY = -INF, minX = INF, minY = INF;
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
