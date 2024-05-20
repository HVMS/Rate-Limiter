const http = require('http');
const url = require('url');
const { parse } = require('querystring');
const RateLimiter = require('./ratelimiter');

const rateLimiter = new RateLimiter(60, 10);
let users = [];

const server = http.createServer((req, res) => {

    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method.toUpperCase();

    if (!rateLimiter.limit(req, res)) {
        return;
    }

    if (path === '/users' && method === 'POST'){
        createUser(req, res);
    } else if (path === '/users' && method === 'GET'){
        getAllUsers(req, res);
    } else if (path.startsWith('/users/') && method === 'DELETE'){
        deleteUser(req, res, path);
    } else if (path.startsWith('/users/') && method === 'PUT'){
        updateUser(req, res, path);
    } else if (path.startsWith('/users/') && method === 'GET'){
        getUser(req, res, path);
    } else {
        res.statusCode = 404;
        res.end();
    }

});

function createUser(req, res){
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        const user = JSON.parse(body);
        user.id = users.length + 1;
        users.push(user);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(user));
    });
}

function getAllUsers(req, res){
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(users));
}

function getUser(req, res, path){
    const id = parseInt(path.split('/')[2]);
    const user = users.find(u => u.id === id);
    if (user) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(user));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'User not found' }));
    }
}

function updateUser(req, res, path) {
    const id = parseInt(path.split('/')[2]);
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        const updatedUser = JSON.parse(body);
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            users[index] = { ...users[index], ...updatedUser };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(users[index]));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'User not found' }));
        }
    });
}

function deleteUser(req, res, path) {
    const id = parseInt(path.split('/')[2]);
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
        users.splice(index, 1);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'User deleted' }));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'User not found' }));
    }
}

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});