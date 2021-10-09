# voilkGraphQL
GraphQL endpoint for voilk blockchain, an image hosting service and a backend for real time chat using socket.io

```
git clone https://github.com/voilknetwork/voilkGraphQL
cd voilkGraphQL
yarn install
yarn start
```

If you want to deploy it on a server
set nginx record like so

```
server {
	listen 80;
	listen [::]:80;

	server_name graphql.voilk.com;
	location / {
	    proxy_set_header   X-Forwarded-For $remote_addr;
	    proxy_set_header   Host $http_host;
	    proxy_pass         "http://127.0.0.1:4000";
	    proxy_http_version 1.1;
	    proxy_set_header   Upgrade $http_upgrade;
	    proxy_set_header   Connection "upgrade";           
	}
}
```
