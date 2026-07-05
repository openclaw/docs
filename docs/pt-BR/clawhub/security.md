---
read_when:
    - Relatando um problema de segurança no ClawHub
    - Entendendo a divulgação de vulnerabilidades do ClawHub
    - Distinguindo problemas da plataforma ClawHub de problemas de Skills ou plugins de terceiros
sidebarTitle: Security
summary: Como relatar problemas de segurança do ClawHub e quando vulnerabilidades são divulgadas publicamente.
title: Segurança
x-i18n:
    generated_at: "2026-07-05T05:25:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Segurança

Problemas de segurança do ClawHub podem ser reportados por meio dos Avisos de Segurança do GitHub para
`openclaw/clawhub`.

Use os Avisos de Segurança do GitHub para vulnerabilidades no próprio ClawHub. Bons
relatórios de aviso do ClawHub incluem bugs em:

- o site, a API ou a CLI do ClawHub
- publicação no registro, downloads, instalações ou integridade de artefatos
- autenticação, autorização ou tokens de API
- varredura, moderação ou tratamento de relatórios

Não use os avisos do ClawHub para vulnerabilidades no código-fonte próprio de uma Skill ou
Plugin de terceiros. Reporte-as diretamente ao publicador ou ao repositório-fonte
vinculado na listagem do ClawHub.

## Divulgação de vulnerabilidades

Como o ClawHub é uma aplicação de nuvem hospedada, as vulnerabilidades do serviço ClawHub
não são divulgadas publicamente por padrão. Elas são divulgadas publicamente quando há
evidência de impacto real sobre usuários ou quando os usuários precisam tomar alguma ação.

Exemplos de impacto real sobre usuários incluem exploração confirmada, exposição de dados
ou segredos de usuários, conteúdo malicioso chegando aos usuários por causa de uma falha da plataforma
ou qualquer problema que exija que os usuários rotacionem credenciais, atualizem software local ou
tomem outra ação protetiva.

Vulnerabilidades em software instalado pelo usuário são divulgadas publicamente, como
pacotes, binários, bibliotecas ou outros artefatos de lançamento da CLI do ClawHub que os usuários
precisam atualizar localmente.

## Páginas relacionadas

Para rótulos de auditoria no momento da instalação, níveis de risco, achados e interpretação, consulte
[Auditorias de Segurança](/clawhub/security-audits).

Para relatórios do marketplace, retenções de moderação, listagens ocultas, banimentos e situação da conta,
consulte [Moderação e Segurança da Conta](/pt-BR/clawhub/moderation).
