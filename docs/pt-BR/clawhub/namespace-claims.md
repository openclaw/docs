---
read_when:
    - Reivindicar uma organização, marca, escopo de pacote, identificador de proprietário, slug de skill ou namespace de pacote
    - Resolvendo um namespace que já foi reivindicado ou reservado
    - Decidindo se deve usar uma denúncia, apelação ou reivindicação de namespace
sidebarTitle: Org and Namespace Claims
summary: Como solicitar a revisão do ClawHub para disputas de propriedade de org, marca, identificador do proprietário, escopo de pacote, slug de skill ou namespace.
title: Reivindicações de organização e namespace
x-i18n:
    generated_at: "2026-06-28T20:41:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Reivindicações de organização e namespace

ClawHub usa identificadores de proprietário, identificadores de org, slugs de Skills, nomes de pacotes de Plugin e
escopos de pacote como namespaces públicos. Se um namespace parecer pertencer a um
projeto, marca, ecossistema de pacotes ou organização do mundo real, mas já estiver
reivindicado, reservado, enganoso ou em disputa no ClawHub, peça para a equipe revisá-lo
com o
[formulário de issue de reivindicação de organização / namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Use este caminho para revisão pública e não sensível de propriedade. Não use relatórios
no produto nem o formulário de apelação de conta para reivindicações de namespace.

## Quando abrir uma reivindicação

Abra uma reivindicação de namespace quando você acreditar que a equipe do ClawHub deve revisar se um
namespace deve ser reservado, transferido, renomeado, ocultado, colocado em quarentena, receber um alias
ou ser alterado de outra forma por causa de propriedade no mundo real.

Exemplos incluem:

- um identificador de org que corresponde à sua org, projeto, empresa ou comunidade no GitHub
- um escopo de pacote como `@example-org/*` que deve publicar somente sob o
  proprietário correspondente no ClawHub
- um slug de Skill ou nome de pacote de Plugin que parece se passar por um projeto
- uma disputa de marca, marca registrada, renomeação de projeto ou histórico de pacote
- um proprietário excluído, inativo ou inacessível que bloqueia o proprietário legítimo do namespace

Se a listagem for insegura, maliciosa ou enganosa além da disputa de propriedade,
também siga as orientações relevantes de moderação ou segurança. O formulário de reivindicação de namespace
é para revisão de propriedade, não para divulgação emergencial de vulnerabilidades.

## Antes de enviar

Primeiro confirme que você está publicando com o proprietário que corresponde ao namespace.
Para pacotes de Plugin, nomes com escopo como `@example-org/example-plugin` devem ser
publicados como o proprietário `example-org` correspondente.

Se você puder gerenciar o proprietário atual, corrija o namespace diretamente publicando,
renomeando, transferindo, ocultando ou excluindo o recurso afetado. Use uma reivindicação
quando você não puder gerenciar o proprietário atual ou quando a equipe precisar resolver uma
disputa.

## Evidências a incluir

Use evidências públicas e não sensíveis. Provas úteis incluem:

- histórico de org, repositório, release ou mantenedor no GitHub
- documentação oficial do projeto que nomeia o namespace
- prova de domínio ou domínio de email oficial
- controle de escopo em npm, PyPI, crates.io ou outro registro de pacotes
- evidência de marca registrada, marca ou propriedade do projeto que seja segura para discutir
  publicamente
- histórico do repositório de origem, histórico de pacote ou avisos públicos de renomeação
- links para o proprietário, Skill, Plugin, pacote ou issue do ClawHub em disputa

Explique o que cada link prova. A equipe deve conseguir entender a
relação sem precisar de credenciais privadas ou segredos.

## O que não incluir

Não coloque segredos ou provas privadas em uma issue pública do GitHub. Não inclua:

- tokens de API, chaves de assinatura ou credenciais
- tokens de desafio DNS
- arquivos jurídicos ou contratos privados
- documentos de identidade pessoais
- emails privados, relatórios de segurança privados ou dados confidenciais de clientes

O formulário de reivindicação pergunta se evidências sensíveis precisam de um canal privado com a equipe.
Use essa opção em vez de publicar material sensível publicamente.

## Possíveis resultados

Dependendo das evidências e do risco, a equipe do ClawHub pode reservar um namespace,
transferir a propriedade, renomear um recurso, ocultar ou colocar em quarentena uma listagem existente,
adicionar um alias ou redirecionamento, solicitar mais provas ou recusar a solicitação.

A revisão de namespace não garante que todo nome correspondente será transferido.
A equipe considera evidências públicas, uso existente, risco de segurança e impacto sobre usuários.

## Documentos relacionados

- [Publicação](/pt-BR/clawhub/publishing)
- [Solução de problemas](/pt-BR/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderação e segurança de conta](/pt-BR/clawhub/moderation)
- [Segurança](/pt-BR/clawhub/security)
