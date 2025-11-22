import { readFileSync } from "fs"
import { Constants, IdentityProvider, ServiceProvider } from "samlify"

const main = async () => {
	const idp = IdentityProvider({
		metadata: readFileSync(`${__dirname}/idp/metadata.xml`),
		privateKey: readFileSync(`${__dirname}/idp/private-key.pem`)
	})

	const sp = ServiceProvider({
		metadata: readFileSync(`${__dirname}/sp/metadata.xml`)
	})

	const request = {
		extract: {
			request: {
				id: undefined
			}
		}
	}

	const response = await idp.createLoginResponse(sp, request, 'post', {})

	console.log(response)

	console.log('hello')
}

main()
