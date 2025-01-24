# Proxy server with analytics

1) A TCP proxy implemented on top of sockets in less than 150 LOC

3) Relays HTTP and HTTPS traffic through port 8080

2) Shows analytics like banwidth and top visited sites

Works with basic authentication with credentials read from `.env` file

## Example Usage

* `curl -x http://proxy_server:proxy_port --proxy-user username:password -L <http://url>`
* `/metrics` endpoint spits out analytics in JSON format e.g. `curl http://proxy_server/analytics`


## How to run

* npm install
* npm run build
* npm run start


