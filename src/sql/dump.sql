-- Tabelas
create database dindin;

CREATE TABLE usuarios
(
    id serial PRIMARY KEY,
    nome text,
    email text UNIQUE,
    senha text
);

CREATE TABLE categorias
(
    id serial PRIMARY KEY,
    descricao text
);

CREATE TABLE transacoes
(
    id serial PRIMARY KEY,
    tipo text,
    descricao text,
    valor integer,
    data date,
    categoria_id serial REFERENCES categorias(id),
    usuario_id serial REFERENCES usuarios(id),
);

INSERT INTO categorias
    (descricao)
VALUES
    ('Alimentação'),
    ('Assinaturas e Serviços'),
    ('Casa'),
    ('Mercado'),
    ('Cuidados Pessoais'),
    ('Educação'),
    ('Família'),
    ('Lazer'),
    ('Pets'),
    ('Presentes'),
    ('Roupas'),
    ('Saúde'),
    ('Transporte'),
    ('Salário'),
    ('Vendas'),
    ('Outras receitas'),
    ('Outras despesas');