---
read_when:
    - Relatando um skill, plugin ou pacote
    - Recuperando-se de uma listagem retida, oculta ou bloqueada
    - Entendendo a moderação, os banimentos ou a situação da conta no ClawHub
sidebarTitle: Moderation and Account Safety
summary: Como funcionam denúncias do ClawHub, retenções de moderação, listagens ocultas, banimentos e a situação da conta.
title: Moderação e Segurança da Conta
x-i18n:
    generated_at: "2026-07-01T20:14:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderação e segurança da conta

ClawHub está aberto para publicação, mas as superfícies públicas de descoberta e instalação ainda
precisam de salvaguardas. Denúncias, retenções de moderação, listagens ocultas e ações de conta
ajudam a proteger usuários quando uma versão ou conta parece insegura, enganosa ou fora
da política.

Esta página aborda moderação e situação da conta. Para rótulos de auditoria como
`Pass`, `Review`, `Warn`, `Malicious` e nível de risco, consulte
[Auditorias de segurança](/clawhub/security-audits).

Veja também [Segurança](/clawhub/security) e
[Uso aceitável](/clawhub/acceptable-usage). Para questões de direitos autorais ou outros
direitos de conteúdo, use [Solicitações de direitos de conteúdo](/clawhub/content-rights).

## Denúncias

Usuários conectados podem denunciar Skills, plugins e pacotes.

Use denúncias do ClawHub somente para conteúdo inseguro do marketplace, como:

- listagens maliciosas
- metadados enganosos
- credenciais ou requisitos de permissão não declarados
- instruções de instalação suspeitas
- falsificação de identidade
- registros de má-fé ou uso indevido de marca registrada
- conteúdo que viola o [Uso aceitável](/clawhub/acceptable-usage)

Use o botão **Denunciar Skill** em uma página de Skill, ou o comando/API de denúncia
de pacotes.

Não use denúncias do ClawHub para vulnerabilidades no código-fonte próprio de uma Skill
ou plugin de terceiros. Denuncie-as diretamente ao publicador ou ao repositório-fonte
vinculado na listagem. ClawHub não mantém nem corrige código de Skill ou plugin
de terceiros.

Os GitHub Security Advisories para `openclaw/clawhub` são para vulnerabilidades no
próprio ClawHub. Exemplos incluem bugs no site, API, CLI, registro, autenticação,
varredura, moderação ou limites de confiança de download/instalação. Não use advisories
do ClawHub para vulnerabilidades em Skills ou plugins de terceiros.

Boas denúncias são específicas e acionáveis. Abuso do sistema de denúncias pode, por si só, levar a
ação de conta.

## Reivindicações de organização e namespace

Disputas de propriedade de organização, marca, escopo de pacote, identificador de proprietário ou namespace devem
usar o processo de [Reivindicações de organização e namespace](/clawhub/namespace-claims), não o
fluxo de denúncia no produto nem o formulário de recurso de conta.

Use esse processo quando precisar que a equipe do ClawHub analise provas não sensíveis de que um
namespace deve ser reservado, transferido, renomeado, ocultado, colocado em quarentena, receber alias
ou ser analisado de outra forma. Não inclua segredos, documentos privados, arquivos jurídicos privados,
documentos pessoais de identidade, tokens de API ou tokens de desafio de DNS em uma
issue pública.

## Retenções de moderação

Algumas constatações graves ou questões de política podem colocar um publicador ou listagem sob uma
retenção de moderação. Quando isso acontece, o conteúdo afetado pode ser ocultado da descoberta
pública ou publicações futuras podem começar ocultas até que a questão seja analisada.

Retenções de moderação têm o objetivo de proteger usuários enquanto o ClawHub resolve casos
de alto risco. Elas também podem ser removidas quando um falso positivo é confirmado.

## Listagens ocultas ou bloqueadas

Uma listagem pode ser retida, ocultada, colocada em quarentena, revogada ou ficar indisponível de outra forma nas
superfícies públicas de instalação.

Se você vir um desses estados, não instale a versão, a menos que o proprietário
resolva o problema ou a moderação a restaure.

Proprietários ainda podem ver diagnósticos para suas próprias listagens retidas ou ocultas. Esses
diagnósticos ajudam a explicar o que aconteceu e o que precisa mudar antes que a
listagem possa retornar às superfícies públicas.

## Banimentos e situação da conta

Contas que violam a política do ClawHub podem perder acesso de publicação. Abuso grave pode
resultar em banimentos de conta, revogação de token, conteúdo oculto ou listagens removidas.
Sinais de pressão de abuso de publicador são verificados diariamente. Sinais que alcançam
o limite de possível banimento do ClawHub podem acionar um aviso automático. Se a próxima
varredura elegível após o prazo do aviso ainda colocar o publicador no
limite de possível banimento, ClawHub poderá aplicar a ação de conta automaticamente.
Sinais de análise temporal delimitados e de menor confiança ficam fora da aplicação automática.

Contas excluídas, banidas ou desativadas não podem usar tokens de API do ClawHub. Se a autenticação da CLI
começar a falhar após uma ação de conta, entre na interface web para revisar o estado da conta.
Se o login ou o acesso normal pela CLI estiver bloqueado por um banimento ou conta desativada,
use o [formulário de recurso do ClawHub](https://appeals.openclaw.ai/) para análise de recuperação.

Se um e-mail acionado por scanner nomear uma versão de Skill ou plugin como maliciosa,
baixe os resultados de varredura armazenados para a versão enviada bloqueada:
`clawhub scan download <slug> --version <version>`. Para plugins, adicione
`--kind plugin`. Revise a saída da varredura, corrija a listagem, incremente o número
da versão e envie a versão corrigida.

## Orientação para publicadores

Para reduzir falsos positivos e melhorar a confiança dos usuários:

- mantenha nomes, resumos, tags e changelogs precisos
- declare variáveis de ambiente e permissões necessárias
- evite comandos de instalação ofuscados
- vincule ao código-fonte quando possível
- use execuções de teste antes de publicar plugins
- responda claramente se usuários ou moderadores perguntarem sobre o comportamento da versão
