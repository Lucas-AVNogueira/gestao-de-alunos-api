import request from 'supertest'
import app from '../src/app.js'
import { expect } from 'chai';
import { login } from '../src/services/auth.service.js';

describe('Login', () => {
    it('deve retornar 200 quando o usuário e senha forem corretos', async () => {
        const loginResposta = await request(app)
            .post('/api/auth/login')
            .set('Content-Type', 'application/json')
            .send({
                email: 'admin@escola.com',
                senha: 'admin123'
            });
        expect(loginResposta.status).to.equal(200);
    });

    it('deve retornar 400 quando a senha não foi informada', async () => {
        const loginResposta = await request(app)
            .post('/api/auth/login')
            .set('Content-Type', 'application/json')
            .send({
                email: 'admin@escola.com',
                senha: ''
            });

        expect(loginResposta.status).to.equal(400);
        expect(loginResposta.body.error).to.equal('Os campos "email" e "senha" são obrigatórios.');
        
    });

    it('deve retornar 401 quando o usuário estiver correto mas a senha for incoreta ', async () => {
        const loginResposta = await request(app)
            .post('/api/auth/login')
            .set('Content-Type', 'application/json')
            .send({
                email: 'admin@escola.com',
                senha: 'admin124'
            });
        expect(loginResposta.status).to.equal(401);

    });

});