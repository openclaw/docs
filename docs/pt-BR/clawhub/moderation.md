---
read_when:
    - Relatando uma skill, Plugin ou pacote
    - Recuperando-se de uma listagem retida, oculta ou bloqueada
    - Entendendo a moderação do ClawHub, banimentos ou situação da conta
sidebarTitle: Moderation and Account Safety
summary: Como funcionam denúncias do ClawHub, retenções de moderação, listagens ocultas, banimentos e situação da conta.
title: Moderação e segurança da conta
x-i18n:
    generated_at: "2026-07-03T23:28:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderação e segurança da conta

ClawHub é aberto à publicação, mas as superfícies públicas de descoberta e instalação ainda
precisam de proteções. Denúncias, retenções de moderação, listagens ocultas e ações de conta
ajudam a proteger os usuários quando uma versão ou conta parece insegura, enganosa ou fora
da política.

Esta página aborda moderação e situação da conta. Para rótulos de auditoria como
`Pass`, `Review`, `Warn`, `Malicious` e nível de risco, consulte
[Auditorias de segurança](/clawhub/security-audits).

Veja também [Segurança](/clawhub/security) e
[Uso aceitável](/clawhub/acceptable-usage). Para questões de direitos autorais ou outros
direitos de conteúdo, use [Solicitações de direitos de conteúdo](/clawhub/content-rights).

## Denúncias

Usuários conectados podem denunciar habilidades, plugins e pacotes.

Use denúncias do ClawHub apenas para conteúdo inseguro do marketplace, como:

- listagens maliciosas
- metadados enganosos
- credenciais ou requisitos de permissão não declarados
- instruções de instalação suspeitas
- falsificação de identidade
- registros de má-fé ou uso indevido de marca registrada
- conteúdo que viola [Uso aceitável](/clawhub/acceptable-usage)

Use o botão **Denunciar habilidade** em uma página de habilidade, ou o comando/API de denúncia
de pacote para pacotes.

Não use denúncias do ClawHub para vulnerabilidades no código-fonte próprio de uma habilidade
ou plugin de terceiros. Denuncie-as diretamente ao publicador ou ao repositório-fonte
vinculado na listagem. ClawHub não mantém nem corrige código de habilidades ou plugins
de terceiros.

GitHub Security Advisories para `openclaw/clawhub` são para vulnerabilidades no próprio
ClawHub. Exemplos incluem bugs no site, API, CLI, registro, autenticação, varredura,
moderação ou limites de confiança de download/instalação. Não use advisories do ClawHub
para vulnerabilidades em habilidades ou plugins de terceiros.

Boas denúncias são específicas e acionáveis. Abuso de denúncias pode, por si só, levar a
ação de conta.

## Reivindicações de organizações e namespaces

Disputas de propriedade de organizações, marcas, escopos de pacote, identificadores de proprietário
ou namespaces devem usar o processo de [Reivindicações de organizações e namespaces](/clawhub/namespace-claims), não o fluxo de denúncia no produto nem o formulário de apelação de conta.

Use esse processo quando precisar que a equipe do ClawHub revise provas não sensíveis de que um
namespace deve ser reservado, transferido, renomeado, ocultado, colocado em quarentena, receber alias
ou ser revisado de outra forma. Não inclua segredos, documentos privados, arquivos jurídicos privados,
documentos pessoais de identidade, tokens de API ou tokens de desafio DNS em uma issue pública.

## Retenções de moderação

Algumas constatações graves ou problemas de política podem colocar um publicador ou uma listagem sob
retenção de moderação. Quando isso acontece, o conteúdo afetado pode ser ocultado da descoberta pública
ou publicações futuras podem começar ocultas até que o problema seja revisado.

Retenções de moderação existem para proteger os usuários enquanto o ClawHub resolve casos de alto risco.
Elas também podem ser removidas quando um falso positivo é confirmado.

## Listagens ocultas ou bloqueadas

Uma listagem pode ser retida, ocultada, colocada em quarentena, revogada ou ficar indisponível de outra
forma em superfícies públicas de instalação.

Se você vir um desses estados, não instale a versão a menos que o proprietário resolva o problema ou a
moderação a restaure.

Proprietários ainda podem ver diagnósticos das suas próprias listagens retidas ou ocultas. Esses
diagnósticos ajudam a explicar o que aconteceu e o que precisa mudar antes que a listagem possa voltar
às superfícies públicas.

## Banimentos e situação da conta

Contas que violam a política do ClawHub podem perder acesso de publicação. Abusos graves podem
resultar em banimentos de conta, revogação de tokens, conteúdo oculto ou listagens removidas.
Sinais de pressão de abuso de publicadores são verificados diariamente. Sinais que atingem o
limite de possível banimento do ClawHub podem acionar um aviso automático. Se a próxima varredura
elegível após o prazo do aviso ainda colocar o publicador no limite de possível banimento, o ClawHub
poderá aplicar a ação de conta automaticamente. Sinais de revisão de menor confiança e temporalmente
limitados ficam fora da aplicação automática.

Contas excluídas, banidas ou desabilitadas não podem usar tokens de API do ClawHub. Se a autenticação
da CLI começar a falhar após uma ação de conta, entre na interface web para revisar o estado da conta.
Se o login ou o acesso normal pela CLI estiver bloqueado por um banimento ou conta desabilitada,
use o [formulário de apelação do ClawHub](https://appeals.openclaw.ai/) para revisão de recuperação.

Se um e-mail acionado por scanner nomear uma versão de habilidade ou plugin como maliciosa,
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
- use dry runs antes de publicar plugins
- responda com clareza se usuários ou moderadores perguntarem sobre o comportamento da versão
