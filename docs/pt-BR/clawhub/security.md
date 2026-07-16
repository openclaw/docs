---
read_when:
    - Relatar um problema de segurança do ClawHub
    - Entendendo a divulgação de vulnerabilidades do ClawHub
    - Como distinguir problemas da plataforma ClawHub de problemas de Skills ou Plugins de terceiros
sidebarTitle: Security
summary: Como relatar problemas de segurança do ClawHub e quando as vulnerabilidades são divulgadas publicamente.
title: Segurança
x-i18n:
    generated_at: "2026-07-16T12:18:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
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

- o site, a API ou a CLI do ClawHub
- publicação no registro, downloads, instalações ou integridade de artefatos
- autenticação, autorização ou tokens de API
- verificação, moderação ou tratamento de denúncias

Não use os avisos do ClawHub para vulnerabilidades no código-fonte de uma skill
ou de um plugin de terceiros. Relate-as diretamente ao publicador ou ao
repositório de origem vinculado na listagem do ClawHub.

## Divulgação de vulnerabilidades

Como o ClawHub é um aplicativo de nuvem hospedado, as vulnerabilidades do serviço
ClawHub não são divulgadas publicamente por padrão. Elas são divulgadas
publicamente quando há evidências de impacto real aos usuários ou quando eles
precisam tomar alguma medida.

Exemplos de impacto real aos usuários incluem exploração confirmada, exposição
de dados ou segredos de usuários, conteúdo malicioso que chega aos usuários
devido a uma falha da plataforma ou qualquer problema que exija que os usuários
troquem credenciais, atualizem software local ou adotem outra medida de proteção.

Vulnerabilidades em software instalado pelos usuários são divulgadas
publicamente, como pacotes da CLI do ClawHub, binários, bibliotecas ou outros
artefatos de versão que os usuários precisam atualizar localmente.

## Páginas relacionadas

Para rótulos de auditoria no momento da instalação, níveis de risco, constatações
e interpretação, consulte [Auditorias de segurança](/clawhub/security-audits).

Para denúncias no marketplace, retenções de moderação, listagens ocultas,
banimentos e situação da conta, consulte [Moderação e segurança da conta](/clawhub/moderation).
