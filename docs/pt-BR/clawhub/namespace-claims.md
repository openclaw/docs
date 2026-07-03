---
read_when:
    - Reivindicar uma organização, marca, escopo de pacote, identificador de proprietário, slug de skill ou namespace de pacote
    - Resolvendo um namespace que já foi reivindicado ou reservado
    - Decidindo se deve usar um relatório, uma apelação ou uma reivindicação de namespace
sidebarTitle: Org and Namespace Claims
summary: Como solicitar uma revisão do ClawHub para disputas de propriedade de org, marca, handle de proprietário, escopo de pacote, slug de skill ou namespace.
title: Reivindicações de organização e namespace
x-i18n:
    generated_at: "2026-07-03T17:15:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Reivindicações de Organização e Espaço de Nomes

O ClawHub usa identificadores de proprietários, identificadores de organizações, slugs de Skills, nomes de pacotes de Plugin e
escopos de pacotes como espaços de nomes públicos. Se um espaço de nomes parece pertencer a um
projeto do mundo real, marca, ecossistema de pacotes ou organização, mas já está
reivindicado, reservado, é enganoso ou está em disputa no ClawHub, peça à equipe para revisá-lo
com o
[formulário de questão de Reivindicação de Organização / Espaço de Nomes](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Use este caminho para revisão pública e não sensível de propriedade. Não use relatórios
no produto nem o formulário de recurso de conta para reivindicações de espaço de nomes.

## Quando Abrir uma Reivindicação

Abra uma reivindicação de espaço de nomes quando você acreditar que a equipe do ClawHub deve revisar se um
espaço de nomes deve ser reservado, transferido, renomeado, ocultado, colocado em quarentena, receber um alias
ou ser alterado de outra forma por causa de propriedade no mundo real.

Exemplos incluem:

- um identificador de organização que corresponde à sua organização, projeto, empresa ou comunidade no GitHub
- um escopo de pacote como `@example-org/*` que só deve publicar sob o
  proprietário correspondente no ClawHub
- um slug de Skills ou nome de pacote de Plugin que parece se passar por um projeto
- uma disputa envolvendo marca, marca registrada, renomeação de projeto ou histórico de pacote
- um proprietário excluído, inativo ou inacessível que bloqueia o proprietário legítimo do
  espaço de nomes

Se a listagem for insegura, maliciosa ou enganosa além da disputa de propriedade,
também siga a orientação relevante de moderação ou segurança. O formulário de reivindicação de espaço de nomes
é para revisão de propriedade, não para divulgação emergencial de vulnerabilidades.

## Antes de Enviar

Primeiro confirme que você está publicando com o proprietário que corresponde ao espaço de nomes.
Para pacotes de Plugin, nomes com escopo como `@example-org/example-plugin` devem ser
publicados como o proprietário `example-org` correspondente.

Se você consegue gerenciar o proprietário atual, corrija o espaço de nomes diretamente publicando,
renomeando, transferindo, ocultando ou excluindo o recurso afetado. Use uma reivindicação
quando você não consegue gerenciar o proprietário atual ou quando a equipe precisa resolver uma
disputa.

## Evidências a Incluir

Use evidências públicas e não sensíveis. Provas úteis incluem:

- histórico de organização, repositório, lançamento ou mantenedor no GitHub
- documentação oficial do projeto que nomeia o espaço de nomes
- prova de domínio ou domínio de e-mail oficial
- controle de escopo no npm, PyPI, crates.io ou outro registro de pacotes
- evidências de marca registrada, marca ou propriedade de projeto que sejam seguras para discutir
  publicamente
- histórico do repositório-fonte, histórico de pacote ou avisos públicos de renomeação
- links para o proprietário, Skills, Plugin, pacote ou questão em disputa no ClawHub

Explique o que cada link comprova. A equipe deve conseguir entender a
relação sem precisar de credenciais privadas ou segredos.

## O Que Não Incluir

Não coloque segredos ou provas privadas em uma questão pública do GitHub. Não inclua:

- tokens de API, chaves de assinatura ou credenciais
- tokens de desafio DNS
- arquivos jurídicos ou contratos privados
- documentos pessoais de identidade
- e-mails privados, relatórios privados de segurança ou dados confidenciais de clientes

O formulário de reivindicação pergunta se evidências sensíveis precisam de um canal privado com a equipe.
Use essa opção em vez de publicar material sensível publicamente.

## Possíveis Resultados

Dependendo das evidências e do risco, a equipe do ClawHub pode reservar um espaço de nomes,
transferir a propriedade, renomear um recurso, ocultar ou colocar uma listagem existente em quarentena,
adicionar um alias ou redirecionamento, pedir mais provas ou recusar a solicitação.

A revisão de espaço de nomes não garante que todo nome correspondente será transferido.
A equipe pondera evidências públicas, uso existente, risco de segurança e impacto nos usuários.

## Documentação Relacionada

- [Publicação](/pt-BR/clawhub/publishing)
- [Solução de problemas](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderação e Segurança da Conta](/clawhub/moderation)
- [Segurança](/clawhub/security)
