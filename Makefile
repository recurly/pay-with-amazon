BIN = node_modules/.bin
COMPONENT = $(BIN)/component
MINIFY = $(BIN)/uglifyjs

pay-with-amazon.js: node_modules components $(SRC)
	@$(COMPONENT) build --standalone payWithAmazon --name pay-with-amazon --out .
	@$(MINIFY) pay-with-amazon.js --output pay-with-amazon.min.js

components: component.json
	@$(COMPONENT) install

node_modules: package.json
	@npm install --silent

clean:
	@rm -rf node_modules pay-with-amazon.js pay-with-amazon.min.js

.PHONY: pay-with-amazon.js
.PHONY: clean
