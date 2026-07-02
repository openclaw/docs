---
read_when:
    - Reivindicação de uma organização, marca, escopo de pacote, identificador de proprietário, slug de skill ou namespace de pacote
    - Resolvendo um namespace que já foi reivindicado ou reservado
    - Decidindo se deve usar uma denúncia, uma contestação ou uma reivindicação de namespace
sidebarTitle: Org and Namespace Claims
summary: Como solicitar revisão do ClawHub para disputas de propriedade de organização, marca, identificador do proprietário, escopo de pacote, slug de skill ou namespace.
title: Reivindicações de organização e namespace
x-i18n:
    generated_at: "2026-07-02T08:01:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Reivindicações de Organização e Namespace

ClawHub usa identificadores de proprietário, identificadores de organização, slugs de skill, nomes de pacotes de Plugin e
escopos de pacote como namespaces públicos. Se um namespace parecer pertencer a um
projeto, marca, ecossistema de pacotes ou organização do mundo real, mas já estiver
reivindicado, reservado, for enganoso ou disputado no ClawHub, peça à equipe para analisá-lo
com o
[formulário de issue para Reivindicação de Organização / Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Use este caminho para análise pública e não sensível de titularidade. Não use relatórios
dentro do produto nem o formulário de recurso de conta para reivindicações de namespace.

## Quando Abrir uma Reivindicação

Abra uma reivindicação de namespace quando você acreditar que a equipe do ClawHub deve analisar se um
namespace deve ser reservado, transferido, renomeado, ocultado, colocado em quarentena, receber alias
ou ser alterado de outra forma por causa de titularidade no mundo real.

Exemplos incluem:

- um identificador de organização que corresponde à sua organização, projeto, empresa ou comunidade no GitHub
- um escopo de pacote, como `@example-org/*`, que deveria publicar somente sob o
  proprietário correspondente no ClawHub
- um slug de skill ou nome de pacote de Plugin que parece se passar por um projeto
- uma disputa de marca, marca registrada, renomeação de projeto ou histórico de pacote
- um proprietário excluído, inativo ou inacessível que bloqueia o proprietário legítimo
  do namespace

Se a listagem for insegura, maliciosa ou enganosa além da disputa de titularidade,
também siga as orientações relevantes de moderação ou segurança. O formulário de reivindicação de namespace
é para análise de titularidade, não para divulgação emergencial de vulnerabilidades.

## Antes de Enviar

Primeiro confirme que você está publicando com o proprietário que corresponde ao namespace.
Para pacotes de Plugin, nomes com escopo, como `@example-org/example-plugin`, devem ser
publicados como o proprietário `example-org` correspondente.

Se você puder gerenciar o proprietário atual, corrija o namespace diretamente publicando,
renomeando, transferindo, ocultando ou excluindo o recurso afetado. Use uma reivindicação
quando não puder gerenciar o proprietário atual ou quando a equipe precisar resolver uma
disputa.

## Evidências a Incluir

Use evidências públicas e não sensíveis. Provas úteis incluem:

- histórico de organização, repositório, release ou mantenedor no GitHub
- documentação oficial do projeto que nomeie o namespace
- prova de domínio ou domínio de e-mail oficial
- controle de escopo em npm, PyPI, crates.io ou outro registro de pacotes
- evidência de marca registrada, marca ou titularidade do projeto que seja segura para discutir
  publicamente
- histórico do repositório de origem, histórico do pacote ou avisos públicos de renomeação
- links para o proprietário, skill, Plugin, pacote ou issue em disputa no ClawHub

Explique o que cada link comprova. A equipe deve conseguir entender o
relacionamento sem precisar de credenciais privadas ou segredos.

## O Que Não Incluir

Não coloque segredos ou provas privadas em uma issue pública do GitHub. Não inclua:

- tokens de API, chaves de assinatura ou credenciais
- tokens de desafio DNS
- arquivos legais ou contratos privados
- documentos de identidade pessoal
- e-mails privados, relatórios de segurança privados ou dados confidenciais de clientes

O formulário de reivindicação pergunta se evidências sensíveis precisam de um canal privado com a equipe.
Use essa opção em vez de publicar material sensível publicamente.

## Possíveis Resultados

Dependendo das evidências e do risco, a equipe do ClawHub pode reservar um namespace,
transferir a titularidade, renomear um recurso, ocultar ou colocar em quarentena uma listagem existente,
adicionar um alias ou redirecionamento, pedir mais provas ou recusar a solicitação.

A análise de namespace não garante que todo nome correspondente será transferido.
A equipe pondera evidências públicas, uso existente, risco de segurança e impacto aos usuários.

## Documentação Relacionada

- [Publicação](/pt-BR/clawhub/publishing)
- [Solução de problemas](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderação e Segurança da Conta](/clawhub/moderation)
- [Segurança](/clawhub/security)
