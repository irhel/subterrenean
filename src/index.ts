import express, { NextFunction, Request, Response } from 'express';

const app = express();

const PORT = 3000;
app.get('/api/users', (request: Request, response:Response, next:NextFunction)=> {
  response.send('<h1>Welcome to blue apex</h1>')
});
app.listen(PORT, () => {
  console.log(`Running in port ${PORT}`)
})

