---
read_when:
    - Relatar uma skill, Plugin ou pacote
    - Recuperando-se de uma listagem retida, oculta ou bloqueada
    - Entendendo a moderação, os banimentos ou a situação da conta no ClawHub
sidebarTitle: Moderation and Account Safety
summary: Como funcionam os relatórios do ClawHub, retenções de moderação, listagens ocultas, banimentos e situação da conta.
title: Moderação e Segurança da Conta
x-i18n:
    generated_at: "2026-07-04T15:10:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderação e segurança da conta

ClawHub está aberto para publicação, mas as superfícies públicas de descoberta e instalação ainda
precisam de proteções. Relatos, retenções de moderação, listagens ocultas e ações de conta
ajudam a proteger usuários quando uma versão ou conta parece insegura, enganosa ou fora
da política.

Esta página aborda moderação e situação da conta. Para rótulos de auditoria como
`Pass`, `Review`, `Warn`, `Malicious` e nível de risco, consulte
[Auditorias de segurança](/clawhub/security-audits).

Veja também [Segurança](/clawhub/security) e
[Uso aceitável](/clawhub/acceptable-usage). Para preocupações sobre direitos autorais ou outros
direitos de conteúdo, use [Solicitações de direitos de conteúdo](/clawhub/content-rights).

## Relatos

Usuários conectados podem relatar skills, plugins e pacotes.

Use os relatos do ClawHub apenas para conteúdo inseguro do marketplace, como:

- listagens maliciosas
- metadados enganosos
- credenciais ou requisitos de permissão não declarados
- instruções de instalação suspeitas
- falsificação de identidade
- registros de má-fé ou uso indevido de marca registrada
- conteúdo que viole o [Uso aceitável](/clawhub/acceptable-usage)

Use o botão **Relatar skill** em uma página de skill, ou o comando/API de relato
de pacotes.

Não use os relatos do ClawHub para vulnerabilidades no código-fonte próprio de uma skill ou
plugin de terceiros. Relate-as diretamente ao publicador ou ao repositório de origem
vinculado na listagem. O ClawHub não mantém nem corrige código de skills ou plugins
de terceiros.

GitHub Security Advisories para `openclaw/clawhub` são para vulnerabilidades no
próprio ClawHub. Exemplos incluem bugs no site, API, CLI, registro, autenticação,
varredura, moderação ou limites de confiança de download/instalação. Não use advisories do ClawHub
para vulnerabilidades em skills ou plugins de terceiros.

Bons relatos são específicos e acionáveis. O abuso dos relatos pode, por si só, levar a
ação na conta.

## Reivindicações de organização e namespace

Disputas de propriedade de organização, marca, escopo de pacote, identificador de proprietário ou namespace devem
usar o processo de [Reivindicações de organização e namespace](/clawhub/namespace-claims), não o
fluxo de relato no produto nem o formulário de recurso da conta.

Use esse processo quando precisar que a equipe do ClawHub revise uma prova não sensível de que um
namespace deve ser reservado, transferido, renomeado, ocultado, colocado em quarentena, associado a um alias
ou revisado de outra forma. Não inclua segredos, documentos privados, arquivos jurídicos privados,
documentos pessoais de identidade, tokens de API ou tokens de desafio de DNS em uma
issue pública.

## Retenções de moderação

Alguns achados graves ou problemas de política podem colocar um publicador ou uma listagem sob
retenção de moderação. Quando isso acontece, o conteúdo afetado pode ser ocultado da
descoberta pública ou publicações futuras podem começar ocultas até que o problema seja revisado.

As retenções de moderação têm o objetivo de proteger usuários enquanto o ClawHub resolve casos
de alto risco. Elas também podem ser suspensas quando um falso positivo é confirmado.

## Listagens ocultas ou bloqueadas

Uma listagem pode ser retida, ocultada, colocada em quarentena, revogada ou ficar indisponível de outra forma nas
superfícies públicas de instalação.

Se você vir um desses estados, não instale a versão a menos que o proprietário
resolva o problema ou a moderação a restaure.

Proprietários ainda podem ver diagnósticos para suas próprias listagens retidas ou ocultas. Esses
diagnósticos ajudam a explicar o que aconteceu e o que precisa mudar antes que a
listagem possa retornar às superfícies públicas.

## Banimentos e situação da conta

Contas que violam a política do ClawHub podem perder acesso de publicação. Abusos graves podem
resultar em banimentos de conta, revogação de token, conteúdo oculto ou listagens removidas.
Sinais de pressão de abuso do publicador são verificados diariamente. Sinais que atingem
o limite de possível banimento do ClawHub podem acionar um aviso automático. Se a próxima
varredura elegível após o prazo do aviso ainda colocar o publicador no
limite de possível banimento, o ClawHub poderá aplicar a ação na conta automaticamente.
Sinais de menor confiança e sinais de revisão temporal limitada ficam fora da aplicação
automática.

Contas excluídas, banidas ou desabilitadas não podem usar tokens de API do ClawHub. Se a autenticação da CLI
começar a falhar após uma ação na conta, entre na interface web para revisar o estado da conta.
Se o login ou o acesso normal pela CLI estiver bloqueado por um banimento ou conta desabilitada,
use o [formulário de recurso do ClawHub](https://appeals.openclaw.ai/) para revisão de recuperação.

Se um e-mail acionado por scanner nomear uma versão de skill ou plugin como maliciosa,
baixe os resultados de varredura armazenados para a versão enviada bloqueada:
`clawhub scan download <slug> --version <version>`. Para plugins, adicione
`--kind plugin`. Revise a saída da varredura, corrija a listagem, incremente o número da versão
e envie a versão corrigida.

## Orientação para publicadores

Para reduzir falsos positivos e melhorar a confiança dos usuários:

- mantenha nomes, resumos, tags e changelogs precisos
- declare variáveis de ambiente e permissões necessárias
- evite comandos de instalação ofuscados
- vincule ao código-fonte quando possível
- use simulações antes de publicar plugins
- responda com clareza se usuários ou moderadores perguntarem sobre o comportamento da versão
