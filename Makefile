bin = node_modules/.bin
webpack = $(bin)/webpack
server = $(bin)/webpack-dev-server --inline --hot --port 8101

server: build
	@$(server)

build: build/pay-with-amazon.min.js
build/pay-with-amazon.min.js: build/pay-with-amazon.js
	@$(webpack) -p
build/pay-with-amazon.js: index.js node_modules
	@mkdir -p $(@D)
	@$(webpack) --display-reasons --display-chunks

node_modules: package.json
	@npm install --silent

clean:
	@rm -rf node_modules build

.PHONY: clean
