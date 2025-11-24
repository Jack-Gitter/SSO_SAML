import { randomUUID } from "crypto"
import { addMinutes } from "date-fns"
import { readFileSync } from "fs"
import { Constants, IdentityProvider, SamlLib, ServiceProvider } from "samlify"
import * as samlify from 'samlify';
import * as validator from '@authenio/samlify-xsd-schema-validator';

export const registerXMLSchemaValidator = () => {
	samlify.setSchemaValidator(validator);
}

export const generateDefaultSAMLResponse = async (entityId: string) => {
	const idp = IdentityProvider({
		metadata: readFileSync(`${__dirname}/idp/metadata.xml`),
		privateKey: readFileSync(`${__dirname}/idp/private-key.pem`)
	})

	const sp = ServiceProvider({
		metadata: readFileSync(`${__dirname}/sp/${entityId}/metadata.xml`),
	})

	const request = {
		extract: {
			request: {
				id: undefined
			}
		}
	}

	const { context, entityEndpoint } = await idp.createLoginResponse(sp, request, Constants.wording.binding.post, {email: 'jack.a.gitter@gmail.com'})

	return { context, entityEndpoint, relayState: 'light-blue' }

}


export const generateCustomSAMLResponse = async (entityId: string) => {

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
		metadata: readFileSync(`${__dirname}/sp/${entityId}/metadata.xml`),
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
		email: 'jack.a.gitter@gmail.com',
		name: 'jack',
	}

	const { context, entityEndpoint } = await idp.createLoginResponse(sp, request, Constants.wording.binding.post, user, (template: string) => {
		return createTemplateCallback(idp, sp, user, template)
	})

	return { context, entityEndpoint, relayState: 'light-blue' }

}


export const generateSpInitiatedSAMLResponse  = async (email: string, issuer: string, id: string) => {
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

	const { context, entityEndpoint } = await idp.createLoginResponse(sp, request, Constants.wording.binding.post, {email})

	return { context, entityEndpoint, relayState: 'light-blue' }

}

export const parseSpInitiatedLoginRequest = async (req: any, entityId: string) => {
	const idp = IdentityProvider({
		metadata: readFileSync(`${__dirname}/idp/metadata.xml`),
		privateKey: readFileSync(`${__dirname}/idp/private-key.pem`),
        wantAuthnRequestsSigned: false,
	})

	const sp = ServiceProvider({
		metadata: readFileSync(`${__dirname}/sp/${entityId}/metadata.xml`),
        authnRequestsSigned: false
	})

	const {extract} = await idp.parseLoginRequest(sp, 'redirect', req)
	return {issuer: extract.issuer, id: extract.request.id}
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
		AudienceURI: acsUrl
    }

    return {
        id,
        context: SamlLib.replaceTagsByValue(template, tagValues)
    }
}
