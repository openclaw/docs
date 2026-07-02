---
read_when:
    - Relatando um problema de segurança do ClawHub
    - Entendendo a divulgação de vulnerabilidades do ClawHub
    - Diferenciando problemas da plataforma ClawHub de problemas de Skills ou Plugins de terceiros
sidebarTitle: Security
summary: Como relatar problemas de segurança do ClawHub e quando vulnerabilidades são divulgadas publicamente.
title: Segurança
x-i18n:
    generated_at: "2026-07-02T17:33:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Segurança

Problemas de segurança do ClawHub podem ser relatados por meio do GitHub Security Advisories para
`openclaw/clawhub`.

Use o GitHub Security Advisories para vulnerabilidades no próprio ClawHub. Bons
relatórios de advisories do ClawHub incluem bugs em:

- o site, a API ou a CLI do ClawHub
- publicação no registro, downloads, instalações ou integridade de artefatos
- autenticação, autorização ou tokens de API
- varredura, moderação ou tratamento de relatórios

Não use advisories do ClawHub para vulnerabilidades no código-fonte próprio de uma skill ou
Plugin de terceiros. Relate esses problemas diretamente ao publicador ou ao repositório de
origem vinculado na listagem do ClawHub.

## Divulgação de vulnerabilidades

Como o ClawHub é uma aplicação hospedada na nuvem, vulnerabilidades do serviço ClawHub
não são divulgadas publicamente por padrão. Elas são divulgadas publicamente quando há
evidências de impacto real aos usuários ou quando os usuários precisam tomar alguma ação.

Exemplos de impacto real aos usuários incluem exploração confirmada, exposição de dados
ou segredos de usuários, conteúdo malicioso chegando aos usuários devido a uma falha da plataforma
ou qualquer problema que exija que os usuários rotacionem credenciais, atualizem software local ou
tomem outra ação de proteção.

Vulnerabilidades em software instalado pelos usuários são divulgadas publicamente, como
pacotes da CLI do ClawHub, binários, bibliotecas ou outros artefatos de lançamento que os usuários
precisam atualizar localmente.

## Páginas relacionadas

Para rótulos de auditoria no momento da instalação, níveis de risco, descobertas e interpretação, consulte
[Auditorias de segurança](/clawhub/security-audits).

Para relatórios do marketplace, retenções de moderação, listagens ocultas, banimentos e status da conta,
consulte [Moderação e segurança da conta](/clawhub/moderation).
