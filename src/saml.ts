import { randomUUID } from "crypto"
import { addMinutes } from "date-fns"
import { readFileSync } from "fs"
import { Constants, IdentityProvider, SamlLib, ServiceProvider } from "samlify"
import { BindingContext } from "samlify/types/src/entity"

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

	return { context, entityEndpoint, relayState: 'light-blue' }

}


export const generateCustomResponse = async () => {

	const template = readFileSync(`${__dirname}/templates/response-template.xml`).toString()
	console.log(template)
	const idp = IdentityProvider({
		metadata: readFileSync(`${__dirname}/idp/metadata.xml`),
		privateKey: readFileSync(`${__dirname}/idp/private-key.pem`),
		loginResponseTemplate: {
			context: template,
		}
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

	const user = {
		email: 'jack.gitter@gmail.com',
		name: 'jack',
	}

	const { context, entityEndpoint } = await idp.createLoginResponse(sp, request, Constants.wording.binding.post, user, (template: string) => {
		return createTemplateCallback(idp, sp, user, template)
	})

	return { context, entityEndpoint, relayState: 'light-blue' }

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
