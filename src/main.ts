import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import { generateCustomResponse, generateResponse, generateSpInitiatedResponse, parseSpInitiatedRequest } from './saml'


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
	res.cookie('issuer', issuer, {sameSite: 'strict', httpOnly: true})
	res.cookie('id', id, {sameSite: 'strict', httpOnly: true})
	res.redirect('/login')
})

app.get('/login', async (req, res) => {
	res.sendFile(`${__dirname}/html/login.html`)
})

app.post('/login', async (req, res) => {
	const username = req.body.username
	const issuer = req.cookies.issuer
	const id = req.cookies.id
	const resp = await generateSpInitiatedResponse(username, issuer, id)
	res.send(resp)

})

app.get('/', async (req, res) => {
	res.sendFile(`${__dirname}/html/index.html`)
})


app.listen(port, () => { console.log(`listening on ${port}`) })
