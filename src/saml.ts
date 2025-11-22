import { randomUUID } from "crypto"
import { addMinutes } from "date-fns"
import { XMLParser } from "fast-xml-parser"
import { readFileSync } from "fs"
import { Constants, IdentityProvider, SamlLib, ServiceProvider } from "samlify"
import zlib from 'zlib'

export const generateResponse = async () => {
	const idp = IdentityProvider({
		metadata: readFileSync(`${__dirname}/idp/metadata.xml`),
		privateKey: readFileSync(`${__dirname}/idp/private-key.pem`)
	})

	const sp = ServiceProvider({
		metadata: readFileSync(`${__dirname}/sp/IAMShowcase/metadata.xml`),
	})

	const request = {
		extract: {
			request: {
				id: undefined
			}
		}
	}

	const { context, entityEndpoint } = await idp.createLoginResponse(sp, request, 'post', {email: 'jack.gitter@gmail.com'})

	return { context, entityEndpoint, relayState: 'light-blue' }

}


export const generateCustomResponse = async () => {

	const template = readFileSync(`${__dirname}/idp/templates/response.xml`).toString()
	const idp = IdentityProvider({
		metadata: readFileSync(`${__dirname}/idp/metadata.xml`),
		privateKey: readFileSync(`${__dirname}/idp/private-key.pem`),
		loginResponseTemplate: {
			context: template,
			attributes: []
		}
	})

	const sp = ServiceProvider({
		metadata: readFileSync(`${__dirname}/sp/IAMShowcase/metadata.xml`),
		wantMessageSigned: true
	})

	const request = {
		extract: {
			request: {
				id: undefined
			}
		}
	}

	const user = {
		email: 'jack.gitter@gmail.com',
		name: 'jack',
	}

	const { context, entityEndpoint } = await idp.createLoginResponse(sp, request, Constants.wording.binding.post, user, (template: string) => {
		return createTemplateCallback(idp, sp, user, template)
	})

	return { context, entityEndpoint, relayState: 'light-blue' }

}


export const generateSpInitiatedResponse  = async (email: string, issuer: string, id: string) => {
	const idp = IdentityProvider({
		metadata: readFileSync(`${__dirname}/idp/metadata.xml`),
		privateKey: readFileSync(`${__dirname}/idp/private-key.pem`)
	})

	const sp = ServiceProvider({
		metadata: readFileSync(`${__dirname}/sp/${issuer}/metadata.xml`),
	})

	const request = {
		extract: {
			request: {
				id
			}
		}
	}

	const { context, entityEndpoint } = await idp.createLoginResponse(sp, request, 'post', {email})

	return { context, entityEndpoint, relayState: 'light-blue' }

}

export const parseSpInitiatedRequest = async (samlRequestb64: string) => {
	const compressed = Buffer.from(samlRequestb64, 'base64');
	const xml = zlib.inflateRawSync(compressed).toString('utf-8');
	const parser = new XMLParser({
	  ignoreAttributes: false, 
	});
	const jsonObj = parser.parse(xml);
	const authnRequest = jsonObj['samlp:AuthnRequest'];
	const issuer = authnRequest['saml:Issuer'];
	const id = authnRequest['@_ID']; 
	return {issuer, id}
}


const createTemplateCallback = (idp: any, sp: any, user: any, template: string) => {
    const acsUrl = sp.entityMeta.getAssertionConsumerService(Constants.wording.binding.post)

    const nameIDFormat = idp.entitySetting.nameIDFormat
    const selectedNameIDFormat = Array.isArray(nameIDFormat) ? nameIDFormat[0] : nameIDFormat

    const id = `_${randomUUID()}`
    const now = new Date()
    const fiveMinutesLater = addMinutes(now, 5)

    const assertionId = `_${randomUUID()}`
	const sessionIndex = randomUUID()

    const tagValues = {
		ID: id,
		IssueInstant: now.toISOString(),
		Destination: acsUrl,
		Issuer: idp.entityMeta.getEntityID(),
		AssertionID: assertionId,
		NameIDFormat: selectedNameIDFormat,
		NameID: user.email,
		Recipient: acsUrl,
		NotBefore: now.toISOString(),
		NotOnOrAfter: fiveMinutesLater.toISOString(),
		AuthnInstant: now.toISOString(),
		SessionIndex: sessionIndex,
		Name: user.name,
		Email: user.email,
    }

    return {
        id,
        context: SamlLib.replaceTagsByValue(template, tagValues)
    }
}
