---
read_when:
    - Reivindicação de uma organização, marca, escopo de pacote, identificador de proprietário, slug de skill ou namespace de pacote
    - Resolução de um namespace que já foi reivindicado ou reservado
    - Decidir entre usar uma denúncia, uma apelação ou uma reivindicação de namespace
sidebarTitle: Org and Namespace Claims
summary: Como solicitar uma análise do ClawHub para disputas de propriedade de organização, marca, identificador de proprietário, escopo de pacote, slug de Skill ou namespace.
title: Reivindicações de organização e namespace
x-i18n:
    generated_at: "2026-07-11T23:47:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Reivindicações de organização e namespace

O ClawHub usa identificadores de proprietários, identificadores de organizações, slugs de Skills, nomes de pacotes de plugins e
escopos de pacotes como namespaces públicos. Se um namespace parecer pertencer a um
projeto, uma marca, um ecossistema de pacotes ou uma organização do mundo real, mas já estiver
reivindicado, reservado, for enganoso ou estiver em disputa no ClawHub, solicite à equipe que o analise
usando o
[formulário de issue para reivindicação de organização/namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Use este canal para análises públicas e não confidenciais de propriedade. Não use denúncias
no produto nem o formulário de recurso de conta para reivindicações de namespace.

## Quando abrir uma reivindicação

Abra uma reivindicação de namespace quando acreditar que a equipe do ClawHub deve analisar se um
namespace deve ser reservado, transferido, renomeado, ocultado, colocado em quarentena, associado a um alias
ou alterado de outra forma devido à propriedade no mundo real.

Alguns exemplos:

- um identificador de organização que corresponda à sua organização, projeto, empresa ou comunidade no GitHub
- um escopo de pacote, como `@example-org/*`, que só deva ser publicado pelo
  proprietário correspondente no ClawHub
- um slug de Skill ou nome de pacote de plugin que pareça se passar por um projeto
- uma disputa envolvendo marca, marca registrada, renomeação de projeto ou histórico de pacote
- um proprietário excluído, inativo ou inacessível que impeça o legítimo proprietário do namespace
  de usá-lo

Se a listagem for insegura, maliciosa ou enganosa para além da disputa de propriedade,
siga também as orientações pertinentes de moderação ou segurança. O formulário de reivindicação de
namespace destina-se à análise de propriedade, não à divulgação emergencial de vulnerabilidades.

## Antes de enviar

Primeiro, confirme se você está publicando com o proprietário correspondente ao namespace.
Para pacotes de plugins, nomes com escopo, como `@example-org/example-plugin`, devem ser
publicados pelo proprietário correspondente `example-org`.

Se você puder gerenciar o proprietário atual, corrija o namespace diretamente publicando,
renomeando, transferindo, ocultando ou excluindo o recurso afetado. Use uma reivindicação
quando não puder gerenciar o proprietário atual ou quando a equipe precisar resolver uma
disputa.

## Evidências a incluir

Use evidências públicas e não confidenciais. Entre as comprovações úteis estão:

- histórico da organização, do repositório, das versões ou dos mantenedores no GitHub
- documentação oficial do projeto que mencione o namespace
- comprovação por domínio ou domínio de e-mail oficial
- controle do escopo no npm, PyPI, crates.io ou outro registro de pacotes
- evidências de propriedade de marca registrada, marca ou projeto que possam ser discutidas
  publicamente com segurança
- histórico do repositório de código-fonte, histórico do pacote ou avisos públicos de renomeação
- links para o proprietário, a Skill, o plugin, o pacote ou a issue em disputa no ClawHub

Explique o que cada link comprova. A equipe deve conseguir entender a
relação sem precisar de credenciais privadas nem segredos.

## O que não incluir

Não coloque segredos nem comprovações privadas em uma issue pública do GitHub. Não inclua:

- tokens de API, chaves de assinatura ou credenciais
- tokens de desafio DNS
- documentos jurídicos ou contratos privados
- documentos pessoais de identidade
- e-mails privados, relatórios de segurança privados ou dados confidenciais de clientes

O formulário de reivindicação pergunta se evidências confidenciais precisam ser enviadas por um canal privado da equipe.
Use essa opção em vez de publicar material confidencial.

## Possíveis resultados

Dependendo das evidências e do risco, a equipe do ClawHub pode reservar um namespace,
transferir a propriedade, renomear um recurso, ocultar ou colocar uma listagem existente em quarentena,
adicionar um alias ou redirecionamento, solicitar mais comprovações ou recusar a solicitação.

A análise de namespace não garante que todos os nomes correspondentes serão transferidos.
A equipe considera as evidências públicas, o uso existente, o risco de segurança e o impacto para os usuários.

## Documentação relacionada

- [Publicação](/pt-BR/clawhub/publishing)
- [Solução de problemas](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderação e segurança da conta](/clawhub/moderation)
- [Segurança](/clawhub/security)
