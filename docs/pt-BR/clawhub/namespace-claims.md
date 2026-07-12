---
read_when:
    - Reivindicação de uma organização, marca, escopo de pacote, identificador do proprietário, slug de skill ou namespace de pacote
    - Resolução de um namespace que já está reivindicado ou reservado
    - Como decidir entre usar uma denúncia, uma apelação ou uma reivindicação de namespace
sidebarTitle: Org and Namespace Claims
summary: Como solicitar uma análise do ClawHub para disputas de propriedade de organização, marca, identificador do proprietário, escopo de pacote, slug de Skill ou namespace.
title: Reivindicações de organização e namespace
x-i18n:
    generated_at: "2026-07-12T14:57:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Reivindicações de organizações e namespaces

O ClawHub usa identificadores de proprietários, identificadores de organizações, slugs de Skills, nomes de pacotes de plugins e
escopos de pacotes como namespaces públicos. Se um namespace parecer pertencer a um
projeto, uma marca, um ecossistema de pacotes ou uma organização do mundo real, mas já estiver
reivindicado, reservado, for enganoso ou estiver em disputa no ClawHub, peça à equipe que o analise
usando o
[formulário de issue para reivindicação de organização/namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Use este caminho para análises públicas e não confidenciais de propriedade. Não use denúncias
no produto nem o formulário de recurso de conta para reivindicações de namespaces.

## Quando abrir uma reivindicação

Abra uma reivindicação de namespace quando acreditar que a equipe do ClawHub deve analisar se um
namespace deve ser reservado, transferido, renomeado, ocultado, colocado em quarentena, associado a um alias
ou alterado de outra forma por causa de propriedade no mundo real.

Alguns exemplos:

- um identificador de organização que corresponda à sua organização, ao seu projeto, à sua empresa ou à sua comunidade no GitHub
- um escopo de pacote, como `@example-org/*`, que só deva ser publicado pelo
  proprietário correspondente no ClawHub
- um slug de Skill ou nome de pacote de plugin que pareça se passar por um projeto
- uma disputa sobre marca, marca registrada, renomeação de projeto ou histórico de pacote
- um proprietário excluído, inativo ou inacessível que impeça o legítimo proprietário do namespace

Se a listagem for insegura, maliciosa ou enganosa além da disputa de propriedade,
siga também as orientações relevantes de moderação ou segurança. O formulário de reivindicação de
namespace destina-se à análise de propriedade, não à divulgação emergencial de vulnerabilidades.

## Antes de enviar

Primeiro, confirme que você está publicando com o proprietário que corresponde ao namespace.
Para pacotes de plugins, nomes com escopo, como `@example-org/example-plugin`, devem ser
publicados pelo proprietário correspondente `example-org`.

Se você puder gerenciar o proprietário atual, corrija o namespace diretamente publicando,
renomeando, transferindo, ocultando ou excluindo o recurso afetado. Use uma reivindicação
quando não puder gerenciar o proprietário atual ou quando a equipe precisar resolver uma
disputa.

## Evidências a incluir

Use evidências públicas e não confidenciais. Entre as comprovações úteis estão:

- histórico de organização, repositório, versão ou mantenedor no GitHub
- documentação oficial do projeto que mencione o namespace
- comprovação por domínio ou domínio de e-mail oficial
- controle do escopo no npm, PyPI, crates.io ou em outro registro de pacotes
- evidências de propriedade de marca registrada, marca ou projeto que possam ser discutidas
  publicamente com segurança
- histórico do repositório de origem, histórico do pacote ou avisos públicos de renomeação
- links para o proprietário, a Skill, o plugin, o pacote ou a issue em disputa no ClawHub

Explique o que cada link comprova. A equipe deve conseguir entender a
relação sem precisar de credenciais privadas ou segredos.

## O que não incluir

Não coloque segredos nem comprovações privadas em uma issue pública do GitHub. Não inclua:

- tokens de API, chaves de assinatura ou credenciais
- tokens de desafio DNS
- arquivos jurídicos ou contratos privados
- documentos pessoais de identidade
- e-mails privados, relatórios privados de segurança ou dados confidenciais de clientes

O formulário de reivindicação pergunta se evidências confidenciais precisam de um canal privado com a equipe.
Use essa opção em vez de publicar material confidencial.

## Possíveis resultados

Dependendo das evidências e do risco, a equipe do ClawHub pode reservar um namespace,
transferir a propriedade, renomear um recurso, ocultar ou colocar uma listagem existente em quarentena,
adicionar um alias ou redirecionamento, solicitar mais comprovações ou recusar a solicitação.

A análise de namespace não garante que todos os nomes correspondentes serão transferidos.
A equipe pondera as evidências públicas, o uso existente, o risco de segurança e o impacto sobre os usuários.

## Documentação relacionada

- [Publicação](/pt-BR/clawhub/publishing)
- [Solução de problemas](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderação e segurança da conta](/clawhub/moderation)
- [Segurança](/clawhub/security)
