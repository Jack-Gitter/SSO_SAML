import { registerXMLSchemaValidator } from './saml';
import { registerEndpoints, registerMiddleware } from './server';
import express from 'express'

const main = async () => {
	const app = express()
	const port = 3000
	registerMiddleware(app)
	registerEndpoints(app)
	registerXMLSchemaValidator()
	app.listen(port, () => { console.log(`listening on ${port}`) })
}

main()
