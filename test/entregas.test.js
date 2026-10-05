import fs from 'node:fs';
import request from 'supertest';
import { expect } from 'chai';
import app from '../src/app.js';
import db from '../src/database/db.js';
import { loginAdmin, loginUsuario } from './helpers/login.js';

const dados = JSON.parse(fs.readFileSync(new URL('./data/entregas.json', import.meta.url), 'utf8'));

describe('Fluxo de entrega de trabalhos (Data-Driven Testing)', function () {
  for (const cenario of dados.cenarios) {
    describe(cenario.nome, function () {
      let estadoInicial;

      beforeEach(function () {
        estadoInicial = structuredClone(db.store);
      });

      afterEach(function () {
        for (const colecao of Object.keys(db.store)) {
          db.store[colecao] = estadoInicial[colecao];
        }
      });

      it('loga como admin, cadastra e matricula aluno, loga como aluno e entrega trabalho', async function () {
        const admin = await loginAdmin(dados.admin);

        const cadastro = await request(app)
          .post('/api/admin/alunos')
          .auth(admin.token, { type: 'bearer' })
          .send(cenario.aluno)
          .expect(201);

        expect(cadastro.body).to.include({
          nome: cenario.aluno.nome,
          email: cenario.aluno.email,
          matricula: cenario.aluno.matricula,
          role: 'aluno',
        });
        expect(cadastro.body.id).to.be.a('string').and.not.be.empty;
        expect(cadastro.body).not.to.have.property('senha');

        const alunoId = cadastro.body.id;
        const matricula = await request(app)
          .post(`/api/admin/disciplinas/${cenario.trabalho.disciplinaId}/matriculas`)
          .auth(admin.token, { type: 'bearer' })
          .send({ alunoId })
          .expect(201);

        expect(matricula.body).to.include({ alunoId, disciplinaId: cenario.trabalho.disciplinaId });

        const aluno = await loginUsuario({ email: cenario.aluno.email, senha: cenario.aluno.senha });
        expect(aluno.usuario.id).to.equal(alunoId);

        const entrega = await request(app)
          .post(`/api/alunos/${alunoId}/trabalhos`)
          .auth(aluno.token, { type: 'bearer' })
          .send(cenario.trabalho)
          .expect(201);

        expect(entrega.body).to.include({ ...cenario.trabalho, alunoId, status: 'entregue' });
        expect(entrega.body.id).to.be.a('string').and.not.be.empty;

        const consulta = await request(app)
          .get(`/api/alunos/${alunoId}/trabalhos`)
          .auth(aluno.token, { type: 'bearer' })
          .expect(200);

        expect(consulta.body).to.deep.include(entrega.body);
      });
    });
  }
});