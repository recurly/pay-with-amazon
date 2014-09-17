BIN = node_modules/.bin
DUO = $(BIN)/duo
MINIFY = $(BIN)/uglifyjs

pay-with-amazon.js: node_modules
	@$(DUO) --global PayWithAmazon --out . index.js > pay-with-amazon.js
	@$(MINIFY) pay-with-amazon.js --output pay-with-amazon.min.js

node_modules: package.json
	@npm install --silent

clean:
	@rm -rf node_modules pay-with-amazon.js pay-with-amazon.min.js

.PHONY: pay-with-amazon.js
.PHONY: clean
