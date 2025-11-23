import { registerXMLSchemaValidator } from './saml';
import { app, registerEndpoints, registerMiddleware } from './server';

const main = async () => {
	registerMiddleware()
	registerEndpoints()
	registerXMLSchemaValidator()
	const port = 3000
	app.listen(port, () => { console.log(`listening on ${port}`) })
}

main()
