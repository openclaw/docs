---
read_when:
    - Reivindicação de uma organização, marca, escopo de pacote, identificador de proprietário, slug de skill ou namespace de pacote
    - Resolvendo um namespace que já foi reivindicado ou reservado
    - Decidindo se deve usar uma denúncia, uma contestação ou uma reivindicação de namespace
sidebarTitle: Org and Namespace Claims
summary: Como solicitar uma revisão do ClawHub para disputas de propriedade de organização, marca, identificador do proprietário, escopo de pacote, slug de skill ou namespace.
title: Declarações de organização e namespace
x-i18n:
    generated_at: "2026-07-04T03:38:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Reivindicações de organização e namespace

O ClawHub usa identificadores de proprietários, identificadores de organizações, slugs de Skills, nomes de pacotes de Plugin e escopos de pacote como namespaces públicos. Se um namespace parece pertencer a um projeto, marca, ecossistema de pacotes ou organização do mundo real, mas já está reivindicado, reservado, é enganoso ou está em disputa no ClawHub, peça que a equipe o revise com o
[formulário de issue de reivindicação de organização / namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Use este caminho para revisão pública e não sensível de propriedade. Não use relatórios no produto nem o formulário de contestação de conta para reivindicações de namespace.

## Quando Abrir uma Reivindicação

Abra uma reivindicação de namespace quando você acreditar que a equipe do ClawHub deve revisar se um namespace deve ser reservado, transferido, renomeado, ocultado, colocado em quarentena, receber um alias ou ser alterado de outra forma por causa de propriedade no mundo real.

Exemplos incluem:

- um identificador de organização que corresponde à sua organização, projeto, empresa ou comunidade no GitHub
- um escopo de pacote como `@example-org/*` que só deve publicar sob o proprietário correspondente do ClawHub
- um slug de Skills ou nome de pacote de Plugin que parece se passar por um projeto
- uma disputa sobre marca, marca registrada, renomeação de projeto ou histórico de pacote
- um proprietário excluído, inativo ou inacessível que bloqueia o proprietário legítimo do namespace

Se a listagem for insegura, maliciosa ou enganosa além da disputa de propriedade, siga também as orientações relevantes de moderação ou segurança. O formulário de reivindicação de namespace é para revisão de propriedade, não para divulgação emergencial de vulnerabilidades.

## Antes de Enviar

Primeiro confirme que você está publicando com o proprietário que corresponde ao namespace. Para pacotes de Plugin, nomes com escopo como `@example-org/example-plugin` devem ser publicados como o proprietário `example-org` correspondente.

Se você puder gerenciar o proprietário atual, corrija o namespace diretamente publicando, renomeando, transferindo, ocultando ou excluindo o recurso afetado. Use uma reivindicação quando você não puder gerenciar o proprietário atual ou quando a equipe precisar resolver uma disputa.

## Evidências a Incluir

Use evidências públicas e não sensíveis. Provas úteis incluem:

- histórico de organização, repositório, lançamento ou mantenedor no GitHub
- documentação oficial do projeto que nomeia o namespace
- prova de domínio ou domínio de e-mail oficial
- controle de escopo no npm, PyPI, crates.io ou outro registro de pacotes
- evidência de marca registrada, marca ou propriedade do projeto que seja segura para discutir publicamente
- histórico do repositório de origem, histórico de pacote ou avisos públicos de renomeação
- links para o proprietário, Skills, Plugin, pacote ou issue do ClawHub em disputa

Explique o que cada link prova. A equipe deve conseguir entender a relação sem precisar de credenciais privadas ou segredos.

## O Que Não Incluir

Não coloque segredos nem provas privadas em uma issue pública do GitHub. Não inclua:

- tokens de API, chaves de assinatura ou credenciais
- tokens de desafio DNS
- arquivos jurídicos privados ou contratos
- documentos pessoais de identidade
- e-mails privados, relatórios de segurança privados ou dados confidenciais de clientes

O formulário de reivindicação pergunta se evidências sensíveis precisam de um canal privado com a equipe. Use essa opção em vez de publicar material sensível publicamente.

## Possíveis Resultados

Dependendo das evidências e do risco, a equipe do ClawHub pode reservar um namespace, transferir a propriedade, renomear um recurso, ocultar ou colocar em quarentena uma listagem existente, adicionar um alias ou redirecionamento, pedir mais provas ou recusar a solicitação.

A revisão de namespace não garante que todos os nomes correspondentes serão transferidos. A equipe pondera evidências públicas, uso existente, risco de segurança e impacto para usuários.

## Documentos Relacionados

- [Publicação](/pt-BR/clawhub/publishing)
- [Solução de problemas](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderação e Segurança de Conta](/clawhub/moderation)
- [Segurança](/clawhub/security)
