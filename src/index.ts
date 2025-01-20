import * as net from 'net';
import * as dotenv from 'dotenv';
import * as http from 'http'
import { Socket } from 'net';
import { MetricsTracker } from './metricsTracker';

interface TargetRequest {
  host: string,
  port: number
}

dotenv.config();

const checkAuth = (buffer: Buffer) => {
  let authLine = buffer.toString('utf8').split('\r\n').filter(line => line.includes("Proxy-Authorization"));
  if (authLine.length == 0) {
    return false;
  }
  const [, , authValue] = authLine[0].split(" ")
  const [username, password] = Buffer.from(authValue, 'base64').toString('utf8').split(":")
  if (username === process.env.username && password === process.env.password) {
    return true;
  }
  return false;
}

let proxyMetricsTracker: MetricsTracker = new MetricsTracker(process.env.topK);
let server = net.createServer((clientSocket: Socket) => {
  clientSocket.once('data', (buffer: Buffer) => {
    if (checkAuth(buffer)) {
      const firstHeader = buffer.toString('utf8').split('\r\n')[0];
      const [method, target] = firstHeader.split(' ');
      let obj:TargetRequest;
      if (method === 'CONNECT') {
        const [host, port] = target.split(":");
        obj = {
          host,
          port: parseInt(port)
        }
      } else {
        obj  = {
          // To retrieve the host from format like: http://www.google.com/ in case of HTTP request
          host: target.substring(7, target.length - 1),
          port: 80
        }
      }
      relayRequest(buffer, obj, clientSocket);
    } else {
      clientSocket.write('HTTP/1.1 403 Forbidden\r\n\r\n')
      clientSocket.end()
    }
  });
});

const relayRequest = (originalRequest: Buffer, {host, port}:TargetRequest, clientSocket: Socket) => {

  const serverSocket: Socket = net.connect(port, host, () => {
    proxyMetricsTracker.updateVisit(host)
    if (port === 80) {
      serverSocket.write(originalRequest)
    } else {
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    }
    clientSocket.pipe(serverSocket);
    serverSocket.pipe(clientSocket);
  });

  serverSocket.on('error', (err: Error) => {
    clientSocket.end('HTTP/1.1 502 Bad Gateway\r\n\r\n');
  });

  clientSocket.on('data', (chunk:Buffer) => {
    proxyMetricsTracker.updateBandwidth(chunk.length)
  });

  serverSocket.on('data', (chunk:Buffer) => {
    proxyMetricsTracker.updateBandwidth(chunk.length)
  });
};

const apiEndpoint = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
  if (req.method === 'GET' && req.url == '/metrics') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(proxyMetricsTracker.getMetrics()))
  } else {
    res.writeHead(501, {"Content-Type": "text/html"});
    res.end("Error: not implemented");
  }
});

server.listen(8080);
apiEndpoint.listen(80);
