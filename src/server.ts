import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express, { Request, Response } from 'express'
import crypto from 'crypto'
import { generateCustomSAMLResponse, generateDefaultSAMLResponse, generateSpInitiatedSAMLResponse, parseSpInitiatedLoginRequest } from "./saml";
import { ENTITY_ID } from "./types/enums";

export const registerMiddleware = (app: express.Express) => {
	app.use(bodyParser.json())
	app.use(cookieParser())
}

export const registerEndpoints = (app: express.Express) => {
	app.get('/sso/iamshowcase/login', async (_req: Request, res: Response) => {
		const resp = await generateDefaultSAMLResponse(ENTITY_ID.I_AM_SHOWCASE)
		res.send(resp)
	})

	app.get('/sso/iamshowcase/custom/login', async (_req: Request, res: Response) => {
		const resp = await generateCustomSAMLResponse(ENTITY_ID.I_AM_SHOWCASE)
		res.send(resp)
	})

	app.get('/saml/auth', async (req: Request, res: Response) => {
		const {issuer, id} = await parseSpInitiatedLoginRequest(req, ENTITY_ID.I_AM_SHOWCASE)
		const signature = generateSignature(issuer, id)
		res.cookie('signature', signature, {sameSite: 'strict', httpOnly: true})
		res.cookie('issuer', issuer, {sameSite: 'strict', httpOnly: true})
		res.cookie('id', id, {sameSite: 'strict', httpOnly: true})
		res.redirect('/login')
	})

	app.get('/login', async (_req: Request, res: Response) => {
		res.sendFile(`${__dirname}/html/login.html`)
	})

	app.post('/login', async (req: Request, res: Response) => {
		const email = req.body.email
		const issuer = req.cookies.issuer
		const id = req.cookies.id
		const signature = req.cookies.signature
		const expectedSignature = generateSignature(issuer, id)
		if (signature !== expectedSignature) {
			res.status(403).send()
			return
		}
		const resp = await generateSpInitiatedSAMLResponse(email, issuer, id)
		res.send(resp)

	})

	app.get('/error', async (_req: Request, res: Response) => {
		res.sendFile(`${__dirname}/html/error.html`)
	})

	app.get('/', async (_req: Request, res: Response) => {
		res.sendFile(`${__dirname}/html/index.html`)
	})
}

const generateSignature = (...fields: string[]) => {
	const payload = JSON.stringify(fields);
	const signature = crypto.createHmac('sha256', 'secret').update(payload).digest('hex');
	return signature
}

