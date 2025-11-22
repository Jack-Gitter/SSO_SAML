import { readFileSync } from "fs"
import { IdentityProvider, ServiceProvider } from "samlify"

export const generateResponse = async () => {
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

	const { context, entityEndpoint } = await idp.createLoginResponse(sp, request, 'post', {email: 'jack.gitter@gmail.com'})

	return { context, entityEndpoint }

}

