import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express, { Request, Response } from 'express'
import crypto from 'crypto'
import { generateCustomSAMLResponse, generateDefaultSAMLResponse, generateSpInitiatedSAMLResponse, parseSpInitiatedLoginRequest } from "./saml";

export const app = express()

export const registerMiddleware = () => {
	app.use(bodyParser.json())
	app.use(cookieParser())
}

export const registerEndpoints = () => {
	app.get('/sso/iamshowcase/login', async (_req: Request, res: Response) => {
		const resp = await generateDefaultSAMLResponse()
		res.send(resp)
	})

	app.get('/sso/iamshowcase/custom/login', async (_req: Request, res: Response) => {
		const resp = await generateCustomSAMLResponse()
		res.send(resp)
	})

	app.get('/saml/auth', async (req: Request, res: Response) => {
		const {issuer, id} = await parseSpInitiatedLoginRequest(req)
		const payload = JSON.stringify({ issuer, id });
		const signature = crypto.createHmac('sha256', 'secret').update(payload).digest('hex');
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
		const payload = JSON.stringify({ issuer, id });
		const expectedSignature = crypto.createHmac('sha256', 'secret').update(payload).digest('hex');
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
