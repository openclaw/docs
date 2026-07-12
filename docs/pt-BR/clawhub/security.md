---
read_when:
    - Relatando um problema de segurança do ClawHub
    - Entendendo a divulgação de vulnerabilidades do ClawHub
    - Distinguindo problemas da plataforma ClawHub de problemas de Skills ou plugins de terceiros
sidebarTitle: Security
summary: Como relatar problemas de segurança do ClawHub e quando as vulnerabilidades são divulgadas publicamente.
title: Segurança
x-i18n:
    generated_at: "2026-07-12T15:03:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Segurança

Problemas de segurança do ClawHub podem ser relatados por meio dos GitHub Security Advisories para
`openclaw/clawhub`.

Use os GitHub Security Advisories para vulnerabilidades no próprio ClawHub. Bons
relatórios de avisos do ClawHub incluem bugs em:

- site, API ou CLI do ClawHub
- publicação no registro, downloads, instalações ou integridade de artefatos
- autenticação, autorização ou tokens de API
- verificação, moderação ou tratamento de denúncias

Não use avisos do ClawHub para vulnerabilidades no código-fonte de uma Skill ou
de um Plugin de terceiros. Relate-as diretamente ao editor ou ao repositório de
origem vinculado no anúncio do ClawHub.

## Divulgação de vulnerabilidades

Como o ClawHub é uma aplicação de nuvem hospedada, as vulnerabilidades do serviço
ClawHub não são divulgadas publicamente por padrão. Elas são divulgadas publicamente
quando há evidências de impacto real para os usuários ou quando os usuários precisam
tomar alguma medida.

Exemplos de impacto real para os usuários incluem exploração confirmada, exposição
de dados ou segredos de usuários, conteúdo malicioso chegando aos usuários devido a
uma falha da plataforma ou qualquer problema que exija que os usuários substituam
credenciais, atualizem software local ou tomem outra medida de proteção.

Vulnerabilidades em software instalado pelos usuários são divulgadas publicamente,
como pacotes, binários e bibliotecas da CLI do ClawHub ou outros artefatos de versão
que os usuários precisem atualizar localmente.

## Páginas relacionadas

Para rótulos de auditoria durante a instalação, níveis de risco, constatações e
interpretação, consulte [Auditorias de segurança](/clawhub/security-audits).

Para denúncias do marketplace, retenções para moderação, anúncios ocultos, banimentos
e situação da conta, consulte [Moderação e segurança da conta](/clawhub/moderation).
