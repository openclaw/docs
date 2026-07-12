---
read_when:
    - Denunciar uma skill, um plugin ou um pacote
    - Recuperação de uma listagem retida, oculta ou bloqueada
    - Como entender a moderação, os banimentos ou a situação da conta no ClawHub
sidebarTitle: Moderation and Account Safety
summary: Como funcionam as denúncias, retenções para moderação, listagens ocultas, banimentos e a situação da conta no ClawHub.
title: Moderação e segurança da conta
x-i18n:
    generated_at: "2026-07-12T21:29:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderação e segurança da conta

O ClawHub é aberto a publicações, mas as superfícies públicas de descoberta e instalação ainda
precisam de proteções. Denúncias, retenções de moderação, listagens ocultas e ações sobre contas
ajudam a proteger os usuários quando uma versão ou conta parece insegura, enganosa ou fora
das políticas.

Esta página aborda moderação e situação da conta. Para rótulos de auditoria como
`Pass`, `Review`, `Warn`, `Malicious` e nível de risco, consulte
[Auditorias de segurança](/clawhub/security-audits).

Consulte também [Segurança](/clawhub/security) e
[Uso aceitável](/clawhub/acceptable-usage). Para questões de direitos autorais ou outros direitos
sobre conteúdo, use [Solicitações de direitos sobre conteúdo](/clawhub/content-rights).

## Denúncias

Usuários autenticados podem denunciar Skills, plugins e pacotes.

Use as denúncias do ClawHub apenas para conteúdo inseguro no marketplace, como:

- listagens maliciosas
- metadados enganosos
- credenciais ou requisitos de permissão não declarados
- instruções de instalação suspeitas
- falsificação de identidade
- registros de má-fé ou uso indevido de marcas registradas
- conteúdo que viola o [Uso aceitável](/clawhub/acceptable-usage)

Use o botão **Report skill** na página de uma Skill ou o comando/API de denúncia
de pacotes.

Não use as denúncias do ClawHub para vulnerabilidades no código-fonte próprio de uma Skill ou
Plugin de terceiros. Denuncie-as diretamente ao publicador ou ao repositório de origem
vinculado na listagem. O ClawHub não mantém nem corrige
código de Skills ou plugins de terceiros.

Os GitHub Security Advisories de `openclaw/clawhub` destinam-se a vulnerabilidades no
próprio ClawHub. Exemplos incluem bugs no site, na API, na CLI, no registro, na autenticação,
na verificação, na moderação ou nos limites de confiança de download/instalação. Não use os avisos
do ClawHub para vulnerabilidades em Skills ou plugins de terceiros.

Boas denúncias são específicas e acionáveis. O abuso do sistema de denúncias pode, por si só, levar a
ações sobre a conta.

## Reivindicações de organização e namespace

Disputas sobre propriedade de organização, marca, escopo de pacote, identificador de proprietário ou namespace devem
usar o processo de [Reivindicações de organização e namespace](/clawhub/namespace-claims), não o
fluxo de denúncias no produto nem o formulário de recurso da conta.

Use esse processo quando precisar que a equipe do ClawHub analise provas não confidenciais de que um
namespace deve ser reservado, transferido, renomeado, ocultado, colocado em quarentena, associado a um alias
ou analisado de outra forma. Não inclua segredos, documentos privados, arquivos jurídicos
privados, documentos pessoais de identidade, tokens de API ou tokens de desafio DNS em uma
issue pública.

## Retenções de moderação

Algumas constatações graves ou problemas de política podem colocar um publicador ou uma listagem sob
retenção de moderação. Quando isso acontece, o conteúdo afetado pode ser ocultado da
descoberta pública ou futuras publicações podem começar ocultas até que o problema seja analisado.

As retenções de moderação têm o objetivo de proteger os usuários enquanto o ClawHub resolve casos
de alto risco. Elas também podem ser suspensas quando um falso positivo é confirmado.

## Listagens ocultas ou bloqueadas

Uma listagem pode ser retida, ocultada, colocada em quarentena, revogada ou ficar indisponível de outra forma nas
superfícies públicas de instalação.

Se você encontrar um desses estados, não instale a versão, a menos que o proprietário
resolva o problema ou a moderação a restaure.

Os proprietários ainda podem ver diagnósticos das próprias listagens retidas ou ocultas. Esses
diagnósticos ajudam a explicar o que aconteceu e o que precisa mudar antes que a
listagem possa retornar às superfícies públicas.

## Banimentos e situação da conta

Contas que violam a política do ClawHub podem perder o acesso à publicação. Abusos graves podem
resultar em banimento da conta, revogação de tokens, conteúdo oculto ou remoção de listagens.
Os sinais de pressão por abuso de publicadores são verificados diariamente. Sinais que atingem
o limite de possível banimento do ClawHub podem acionar um aviso automático. Se a próxima
verificação elegível após o prazo do aviso ainda colocar o publicador no
limite de possível banimento, o ClawHub poderá aplicar automaticamente a ação sobre a conta.
Sinais de menor confiança e de análise temporal limitada ficam fora da aplicação
automática de medidas.

Contas excluídas, banidas ou desativadas não podem usar tokens de API do ClawHub. Se a autenticação da CLI
começar a falhar após uma ação sobre a conta, entre na interface web para verificar o estado da
conta. Se o login ou o acesso normal pela CLI estiver bloqueado por um banimento ou por uma conta desativada,
use o [formulário de recurso do ClawHub](https://appeals.openclaw.ai/) para solicitar uma análise de recuperação.

Se um e-mail acionado pelo verificador identificar uma versão de Skill ou Plugin como maliciosa,
baixe os resultados armazenados da verificação da versão enviada que foi bloqueada:
`clawhub scan download <slug> --version <version>`. Para plugins, adicione
`--kind plugin`. Analise a saída da verificação, corrija a listagem, incremente o número da
versão e envie a versão corrigida.

## Orientações para publicadores

Para reduzir falsos positivos e aumentar a confiança dos usuários:

- mantenha nomes, resumos, tags e changelogs precisos
- declare as variáveis de ambiente e permissões necessárias
- evite comandos de instalação ofuscados
- inclua um link para o código-fonte quando possível
- use execuções de teste antes de publicar plugins
- responda com clareza se usuários ou moderadores perguntarem sobre o comportamento da versão
