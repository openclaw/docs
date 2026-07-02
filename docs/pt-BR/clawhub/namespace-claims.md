---
read_when:
    - Reivindicar uma organização, marca, escopo de pacote, identificador de proprietário, slug de skill ou namespace de pacote
    - Resolvendo um namespace que já está reivindicado ou reservado
    - Decidindo se deve usar uma denúncia, uma contestação ou uma reivindicação de namespace
sidebarTitle: Org and Namespace Claims
summary: Como solicitar revisão do ClawHub para disputas de propriedade de organização, marca, identificador do proprietário, escopo de pacote, slug de skill ou namespace.
title: Reivindicações de organização e namespace
x-i18n:
    generated_at: "2026-07-02T17:33:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Reivindicações de organização e espaço de nomes

ClawHub usa identificadores de proprietário, identificadores de organização, slugs de Skill, nomes de pacote de Plugin e
escopos de pacote como espaços de nomes públicos. Se um espaço de nomes parecer pertencer a um
projeto, marca, ecossistema de pacotes ou organização do mundo real, mas já estiver
reivindicado, reservado, enganoso ou em disputa no ClawHub, peça à equipe para analisá-lo
com o
[formulário de issue de reivindicação de organização / espaço de nomes](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Use este caminho para análise pública e não sensível de propriedade. Não use relatórios
dentro do produto nem o formulário de recurso de conta para reivindicações de espaço de nomes.

## Quando abrir uma reivindicação

Abra uma reivindicação de espaço de nomes quando você acreditar que a equipe do ClawHub deve analisar se um
espaço de nomes deve ser reservado, transferido, renomeado, ocultado, colocado em quarentena, receber um alias
ou ser alterado de outra forma por causa de propriedade do mundo real.

Exemplos incluem:

- um identificador de organização que corresponde à sua organização, projeto, empresa ou comunidade no GitHub
- um escopo de pacote como `@example-org/*` que deve publicar somente sob o
  proprietário correspondente no ClawHub
- um slug de Skill ou nome de pacote de Plugin que pareça se passar por um projeto
- uma disputa envolvendo marca, marca registrada, renomeação de projeto ou histórico de pacote
- um proprietário excluído, inativo ou inalcançável que bloqueia o proprietário legítimo do espaço de nomes

Se a listagem for insegura, maliciosa ou enganosa além da disputa de propriedade,
também siga as orientações relevantes de moderação ou segurança. O formulário de reivindicação de espaço de nomes
é para análise de propriedade, não para divulgação emergencial de vulnerabilidades.

## Antes de registrar

Primeiro confirme que você está publicando com o proprietário que corresponde ao espaço de nomes.
Para pacotes de Plugin, nomes com escopo como `@example-org/example-plugin` devem ser
publicados como o proprietário `example-org` correspondente.

Se você puder gerenciar o proprietário atual, corrija o espaço de nomes diretamente publicando,
renomeando, transferindo, ocultando ou excluindo o recurso afetado. Use uma reivindicação
quando não puder gerenciar o proprietário atual ou quando a equipe precisar resolver uma
disputa.

## Evidências a incluir

Use evidências públicas e não sensíveis. Provas úteis incluem:

- histórico de organização, repositório, release ou mantenedor no GitHub
- documentação oficial do projeto que nomeia o espaço de nomes
- prova de domínio ou domínio de e-mail oficial
- controle de escopo em npm, PyPI, crates.io ou outro registro de pacotes
- evidência de marca registrada, marca ou propriedade de projeto que seja segura para discutir
  publicamente
- histórico do repositório de origem, histórico de pacote ou avisos públicos de renomeação
- links para o proprietário, Skill, Plugin, pacote ou issue do ClawHub em disputa

Explique o que cada link comprova. A equipe deve conseguir entender a
relação sem precisar de credenciais privadas ou segredos.

## O que não incluir

Não coloque segredos nem provas privadas em uma issue pública do GitHub. Não inclua:

- tokens de API, chaves de assinatura ou credenciais
- tokens de desafio de DNS
- arquivos jurídicos ou contratos privados
- documentos pessoais de identidade
- e-mails privados, relatórios de segurança privados ou dados confidenciais de clientes

O formulário de reivindicação pergunta se evidências sensíveis precisam de um canal privado com a equipe.
Use essa opção em vez de publicar material sensível publicamente.

## Possíveis resultados

Dependendo das evidências e do risco, a equipe do ClawHub pode reservar um espaço de nomes,
transferir a propriedade, renomear um recurso, ocultar ou colocar em quarentena uma listagem existente,
adicionar um alias ou redirecionamento, pedir mais provas ou recusar a solicitação.

A análise de espaço de nomes não garante que todo nome correspondente será transferido.
A equipe pondera evidências públicas, uso existente, risco de segurança e impacto para usuários.

## Documentação relacionada

- [Publicação](/pt-BR/clawhub/publishing)
- [Solução de problemas](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderação e segurança da conta](/clawhub/moderation)
- [Segurança](/clawhub/security)
