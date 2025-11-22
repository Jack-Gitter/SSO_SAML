import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import { generateCustomResponse, generateResponse, generateSpInitiatedResponse, parseSpInitiatedRequest } from './saml'
import crypto, { sign } from 'crypto'

const logins = {}

const app = express()
app.use(bodyParser.json())
app.use(cookieParser())
const port = 3000

app.get('/saml', async (req, res) => {
	const resp = await generateResponse()
	res.send(resp)
})

app.get('/saml-custom', async (req, res) => {
	const resp = await generateCustomResponse()
	res.send(resp)
})

app.get('/saml/auth', async (req, res) => {
	const {issuer, id} = await parseSpInitiatedRequest(req.query.SAMLRequest as string)
	const payload = JSON.stringify({ issuer, id });
	const signature = crypto.createHmac('sha256', 'secret').update(payload).digest('hex');
	res.cookie('signature', signature, {sameSite: 'strict', httpOnly: true})
	res.cookie('issuer', issuer, {sameSite: 'strict', httpOnly: true})
	res.cookie('id', id, {sameSite: 'strict', httpOnly: true})
	res.redirect('/login')
})

app.get('/login', async (req, res) => {
	res.sendFile(`${__dirname}/html/login.html`)
})

app.post('/login', async (req, res) => {
	const email = req.body.email
	const issuer = req.cookies.issuer
	const id = req.cookies.id
	const signature = req.cookies.signature
	const payload = JSON.stringify({ issuer, id });
	const expectedSignature = crypto.createHmac('sha256', 'secret').update(payload).digest('hex');
	console.log('sig')
	console.log(signature)
	console.log('exp')
	console.log(expectedSignature)
	if (signature !== expectedSignature) {
		console.log('here')
		res.status(403).send()
		return
	}
	const resp = await generateSpInitiatedResponse(email, issuer, id)
	res.send(resp)

})

app.get('/error', async (req, res) => {
	res.sendFile(`${__dirname}/html/error.html`)
})
app.get('/', async (req, res) => {
	res.sendFile(`${__dirname}/html/index.html`)
})


app.listen(port, () => { console.log(`listening on ${port}`) })
