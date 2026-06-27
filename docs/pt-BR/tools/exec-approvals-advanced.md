---
read_when:
    - Configurando bins seguros ou perfis personalizados de bins seguros
    - Encaminhando aprovações para Slack/Discord/Telegram ou outros canais de chat
    - Implementando um cliente de aprovação nativo para um canal
summary: 'Aprovações avançadas de execução: binários seguros, vinculação de interpretador, encaminhamento de aprovações, entrega nativa'
title: Aprovações de execução — avançado
x-i18n:
    generated_at: "2026-06-27T18:15:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d936e1a1567d204981eec7c3262cf11f2af8fc1ed6213182954c2324718a270
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Tópicos avançados de aprovação de exec: o caminho rápido `safeBins`, vinculação de interpretador/runtime
e encaminhamento de aprovações para canais de chat (incluindo entrega nativa).
Para a política central e o fluxo de aprovação, consulte [Aprovações de exec](/pt-BR/tools/exec-approvals).

## Safe bins (somente stdin)

`tools.exec.safeBins` define uma pequena lista de binários **somente stdin** (por
exemplo `cut`) que podem executar em modo de lista de permissões **sem** entradas
explícitas na lista de permissões. Safe bins rejeitam argumentos posicionais de arquivo e tokens
com aparência de caminho, portanto só podem operar no fluxo de entrada. Trate isso como um caminho
rápido estreito para filtros de fluxo, não como uma lista geral de confiança.

<Warning>
**Não** adicione binários de interpretador ou runtime (por exemplo `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) a `safeBins`. Se um comando puder avaliar código,
executar subcomandos ou ler arquivos por design, prefira entradas explícitas na lista de permissões
e mantenha os prompts de aprovação habilitados. Safe bins personalizados devem definir um perfil
explícito em `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Safe bins padrão:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` e `sort` não estão na lista padrão. Se você optar por incluí-los, mantenha entradas
explícitas na lista de permissões para seus fluxos que não usam stdin. Para `grep` em modo safe-bin,
forneça o padrão com `-e`/`--regexp`; a forma posicional do padrão é rejeitada
para que operandos de arquivo não possam ser infiltrados como posicionais ambíguos.

### Validação de argv e flags negadas

A validação é determinística apenas a partir da forma de argv (sem verificações de existência no
sistema de arquivos do host), o que impede comportamento de oráculo de existência de arquivo por
diferenças entre permitir/negar. Opções orientadas a arquivos são negadas para safe bins padrão; opções
longas são validadas em modo fail-closed (flags desconhecidas e abreviações ambíguas são
rejeitadas).

Flags negadas por perfil safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins também forçam tokens de argv a serem tratados como **texto literal** no momento da execução
(sem globbing e sem expansão de `$VARS`) para segmentos somente stdin, então padrões
como `*` ou `$HOME/...` não podem ser usados para infiltrar leituras de arquivo.

### Diretórios de binários confiáveis

Safe bins devem resolver a partir de diretórios de binários confiáveis (padrões do sistema mais
`tools.exec.safeBinTrustedDirs` opcional). Entradas de `PATH` nunca são automaticamente confiáveis.
Os diretórios confiáveis padrão são intencionalmente mínimos: `/bin`, `/usr/bin`. Se
seu executável safe-bin estiver em caminhos de gerenciador de pacotes/usuário (por exemplo
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), adicione-os
explicitamente a `tools.exec.safeBinTrustedDirs`.

### Encadeamento de shell, wrappers e multiplexadores

Encadeamento de shell (`&&`, `||`, `;`) é permitido quando cada segmento de nível superior
satisfaz a lista de permissões (incluindo safe bins ou permissão automática de skill). Redirecionamentos
continuam sem suporte em modo de lista de permissões. Substituição de comando (`$()` / crases) é
rejeitada durante a análise da lista de permissões, inclusive dentro de aspas duplas; use aspas
simples se precisar de texto literal `$()`.

Em aprovações do app companheiro no macOS, texto bruto de shell contendo sintaxe de controle ou
expansão de shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) é
tratado como ausência na lista de permissões, a menos que o próprio binário de shell esteja na lista de permissões.

Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), substituições de env com escopo de solicitação são
reduzidas a uma pequena lista de permissões explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Para decisões `allow-always` em modo de lista de permissões, wrappers de despacho conhecidos (`env`,
`flock`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem o caminho do executável interno
em vez do caminho do wrapper. Multiplexadores de shell (`busybox`, `toybox`) são
desembrulhados para applets de shell (`sh`, `ash` etc.) da mesma forma. Se um wrapper ou
multiplexador não puder ser desembrulhado com segurança, nenhuma entrada da lista de permissões é persistida
automaticamente.

Se você colocar interpretadores como `python3` ou `node` na lista de permissões, prefira
`tools.exec.strictInlineEval=true` para que eval inline ainda exija uma aprovação
explícita. No modo estrito, `allow-always` ainda pode persistir invocações benignas de
interpretador/script, mas transportadores de eval inline não são persistidos
automaticamente.

### Safe bins versus lista de permissões

| Tópico           | `tools.exec.safeBins`                                  | Lista de permissões (`exec-approvals.json`)                                        |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Objetivo         | Permitir automaticamente filtros stdin estreitos       | Confiar explicitamente em executáveis específicos                                  |
| Tipo de correspondência | Nome do executável + política de argv safe-bin  | Glob de caminho de executável resolvido, ou glob de nome de comando simples para comandos invocados por PATH |
| Escopo de argumentos | Restrito pelo perfil safe-bin e regras de token literal | Correspondência de caminho por padrão; `argPattern` opcional pode restringir argv analisado |
| Exemplos típicos | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLIs personalizadas                             |
| Melhor uso       | Transformações de texto de baixo risco em pipelines    | Qualquer ferramenta com comportamento mais amplo ou efeitos colaterais             |

Local da configuração:

- `safeBins` vem da configuração (`tools.exec.safeBins` ou `agents.list[].tools.exec.safeBins` por agente).
- `safeBinTrustedDirs` vem da configuração (`tools.exec.safeBinTrustedDirs` ou `agents.list[].tools.exec.safeBinTrustedDirs` por agente).
- `safeBinProfiles` vem da configuração (`tools.exec.safeBinProfiles` ou `agents.list[].tools.exec.safeBinProfiles` por agente). Chaves de perfil por agente substituem chaves globais.
- Entradas da lista de permissões ficam no arquivo de aprovações local do host em `agents.<id>.allowlist` (ou via Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` avisa com `tools.exec.safe_bins_interpreter_unprofiled` quando bins de interpretador/runtime aparecem em `safeBins` sem perfis explícitos.
- `openclaw doctor --fix` pode criar entradas personalizadas `safeBinProfiles.<bin>` ausentes como `{}` (revise e restrinja depois). Bins de interpretador/runtime não são criados automaticamente.

Exemplo de perfil personalizado:
__OC_I18N_900000__
Se você optar explicitamente por incluir `jq` em `safeBins`, o OpenClaw ainda rejeita o builtin `env` em modo safe-bin
para que `jq -n env` não possa despejar o ambiente do processo do host sem um caminho explícito na lista de permissões
ou prompt de aprovação.

## Comandos de interpretador/runtime

Execuções de interpretador/runtime respaldadas por aprovação são intencionalmente conservadoras:

- O contexto exato de argv/cwd/env é sempre vinculado.
- Formas diretas de script de shell e arquivo direto de runtime são vinculadas, em melhor esforço, a um snapshot de um arquivo local concreto.
- Formas comuns de wrapper de gerenciador de pacotes que ainda resolvem para um arquivo local direto (por exemplo
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) são desembrulhadas antes da vinculação.
- Se o OpenClaw não conseguir identificar exatamente um arquivo local concreto para um comando de interpretador/runtime
  (por exemplo scripts de pacote, formas eval, cadeias de loader específicas de runtime ou formas ambíguas com vários arquivos),
  a execução respaldada por aprovação é negada em vez de alegar cobertura semântica que ela não tem.
- Para esses fluxos, prefira sandboxing, um limite de host separado ou um fluxo completo/lista de permissões explicitamente confiável em que o operador aceite a semântica mais ampla do runtime.

Quando aprovações são obrigatórias, a ferramenta exec retorna imediatamente com um id de aprovação. Use esse id para
correlacionar eventos de sistema posteriores da execução aprovada (`Exec finished` e `Exec running` quando configurado).
Se nenhuma decisão chegar antes do timeout, a solicitação é tratada como um timeout de aprovação e
exibida como uma negação terminal de comando do host. Para aprovações assíncronas do agente principal com uma sessão de origem,
o OpenClaw também retoma essa sessão com um followup interno para que o agente observe que
o comando não executou em vez de reparar posteriormente um resultado ausente.

### Comportamento de entrega de followup

Depois que um exec assíncrono aprovado termina, o OpenClaw envia um turno `agent` de followup para a mesma sessão.
Aprovações assíncronas negadas usam o mesmo caminho de followup da sessão principal para o status de negação, mas não
registram handoffs elevados de runtime e não executam o comando. Negações sem uma sessão principal retomável
são suprimidas ou relatadas por uma rota direta segura quando uma existe.

- Se existir um destino de entrega externo válido (canal entregável mais alvo `to`), a entrega de followup usa esse canal.
- Em fluxos somente webchat ou de sessão interna sem alvo externo, a entrega de followup permanece apenas na sessão (`deliver: false`).
- Se um chamador solicitar explicitamente entrega externa estrita sem canal externo resolvível, a solicitação falha com `INVALID_REQUEST`.
- Se `bestEffortDeliver` estiver habilitado e nenhum canal externo puder ser resolvido, a entrega é rebaixada para apenas sessão em vez de falhar.

## Encaminhamento de aprovação para canais de chat

Você pode encaminhar prompts de aprovação de exec para qualquer canal de chat (incluindo canais de Plugin) e aprová-los
com `/approve`. Isso usa o pipeline normal de entrega de saída.

Configuração:
__OC_I18N_900001__
Responda no chat:
__OC_I18N_900002__
O comando `/approve` lida tanto com aprovações de exec quanto com aprovações de Plugin. Se o ID não corresponder a uma aprovação de exec pendente, ele verifica automaticamente as aprovações de Plugin em seguida.

### Encaminhamento de aprovação de Plugin

O encaminhamento de aprovação de Plugin usa o mesmo pipeline de entrega das aprovações de exec, mas tem sua própria
configuração independente em `approvals.plugin`. Habilitar ou desabilitar uma não afeta a outra.
Para comportamento de autoria de Plugin, campos de solicitação e semântica de decisão, consulte
[Solicitações de permissão de Plugin](/plugins/plugin-permission-requests).
__OC_I18N_900003__
O formato da configuração é idêntico a `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` e `targets` funcionam da mesma forma.

Canais compatíveis com respostas interativas compartilhadas renderizam os mesmos botões de aprovação para aprovações de exec e
Plugin. Canais sem UI interativa compartilhada recorrem a texto simples com instruções de `/approve`.
Solicitações de aprovação de Plugin podem restringir as decisões disponíveis. Superfícies de aprovação usam o conjunto de decisões
declarado pela solicitação, e o Gateway rejeita tentativas de enviar uma decisão que não foi oferecida.

### Aprovações no mesmo chat em qualquer canal

Quando uma solicitação de aprovação de exec ou Plugin se origina de uma superfície de chat entregável, o mesmo chat
agora pode aprová-la com `/approve` por padrão. Isso se aplica a canais como Slack, Matrix e
Microsoft Teams, além dos fluxos existentes da Web UI e da UI de terminal.

Esse caminho compartilhado de comando de texto usa o modelo normal de autenticação de canal para essa conversa. Se o
chat de origem já puder enviar comandos e receber respostas, as solicitações de aprovação não precisarão mais de um
adaptador separado de entrega nativa apenas para permanecerem pendentes.

Discord e Telegram também aceitam `/approve` no mesmo chat, mas esses canais ainda usam sua
lista resolvida de aprovadores para autorização, mesmo quando a entrega nativa de aprovação está desativada.

Para Telegram e outros clientes de aprovação nativos que chamam o Gateway diretamente,
esse fallback é intencionalmente limitado a falhas de "aprovação não encontrada". Uma negação/erro real
de aprovação de exec não tenta novamente silenciosamente como uma aprovação de plugin.

### Entrega nativa de aprovações

Alguns canais também podem atuar como clientes de aprovação nativos. Clientes nativos adicionam DMs de aprovadores, distribuição para o chat de origem
e UX interativa de aprovação específica do canal sobre o fluxo compartilhado de `/approve`
no mesmo chat.

Quando cartões/botões nativos de aprovação estão disponíveis, essa UI nativa é o caminho principal
voltado ao agente. O agente não deve também ecoar um comando `/approve` duplicado em texto simples no chat,
a menos que o resultado da ferramenta diga que aprovações por chat não estão disponíveis ou que
a aprovação manual é o único caminho restante.

Se um cliente de aprovação nativo estiver configurado, mas nenhum runtime nativo estiver ativo para
o canal de origem, o OpenClaw mantém visível o prompt determinístico local de `/approve`.
Se o runtime nativo estiver ativo e tentar a entrega, mas nenhum destino receber o cartão,
o OpenClaw envia um aviso de fallback no mesmo chat com o comando exato
`/approve <id> <decision>` para que a solicitação ainda possa ser resolvida.

Modelo genérico:

- a política de exec do host ainda decide se a aprovação de exec é necessária
- `approvals.exec` controla o encaminhamento de prompts de aprovação para outros destinos de chat
- `channels.<channel>.execApprovals` controla se Discord, Slack, Telegram e clientes nativos semelhantes
  específicos do canal estão habilitados
- aprovações de plugin do Slack podem usar o cliente de aprovação nativo do Slack quando a solicitação vem do Slack
  e os aprovadores de plugin do Slack são resolvidos; `approvals.plugin` também pode rotear aprovações de plugin para sessões
  ou destinos do Slack mesmo quando aprovações de exec do Slack estão desativadas
- cartões nativos de aprovação do Google Chat lidam com aprovações de exec e de plugin originadas de espaços ou threads do Google
  Chat quando aprovadores estáveis `users/<id>` são resolvidos a partir de `dm.allowFrom` ou
  `defaultTo`; eles não usam eventos de reação para decisões
- a entrega de aprovações por reação no WhatsApp e Signal é protegida por `approvals.exec` e
  `approvals.plugin`; eles não têm blocos `channels.<channel>.execApprovals`

Clientes nativos de aprovação habilitam automaticamente a entrega com DMs primeiro quando tudo isto é verdadeiro:

- o canal aceita entrega nativa de aprovação
- os aprovadores podem ser resolvidos a partir de `execApprovals.approvers` explícito ou da identidade
  do proprietário, como `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` não está definido ou é `"auto"`

Defina `enabled: false` para desativar explicitamente um cliente de aprovação nativo. Defina `enabled: true` para forçá-lo
quando aprovadores forem resolvidos. A entrega pública para o chat de origem permanece explícita por meio de
`channels.<channel>.execApprovals.target`.

Perguntas frequentes: [Por que há duas configurações de aprovação de exec para aprovações por chat?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- Google Chat: configure aprovadores estáveis com `channels.googlechat.dm.allowFrom` ou
  `channels.googlechat.defaultTo`; nenhum bloco `execApprovals` é necessário
- WhatsApp: use `approvals.exec` e `approvals.plugin` para rotear prompts de aprovação para o WhatsApp
- Signal: use `approvals.exec` e `approvals.plugin` para rotear prompts de aprovação para o Signal

Esses clientes nativos de aprovação adicionam roteamento por DM e distribuição opcional por canal sobre o fluxo compartilhado
de `/approve` no mesmo chat e os botões de aprovação compartilhados.

Comportamento compartilhado:

- Slack, Matrix, Microsoft Teams e chats entregáveis semelhantes usam o modelo normal de autenticação de canal
  para `/approve` no mesmo chat
- quando um cliente de aprovação nativo é habilitado automaticamente, o destino padrão da entrega nativa são DMs de aprovadores
- para Discord e Telegram, somente aprovadores resolvidos podem aprovar ou negar
- aprovadores do Discord podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- aprovadores do Telegram podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- aprovadores do Slack podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- DMs de aprovação de plugin do Slack usam aprovadores de plugin do Slack de `allowFrom` e roteamento padrão
  da conta, não aprovadores de exec do Slack
- botões nativos do Slack preservam o tipo do id de aprovação, então ids `plugin:` podem resolver aprovações de plugin
  sem uma segunda camada de fallback local do Slack
- cartões nativos do Google Chat preservam o fallback manual de `/approve` no texto da mensagem, mas callbacks de botões
  de cartão carregam apenas tokens de ação opacos; o id de aprovação e a decisão são recuperados do estado pendente
  no servidor
- aprovações por emoji do WhatsApp lidam com prompts de exec e de plugin somente quando a família de encaminhamento
  de nível superior correspondente está habilitada e roteia para o WhatsApp; o encaminhamento apenas por destino para o WhatsApp permanece no
  caminho compartilhado de encaminhamento, a menos que corresponda ao mesmo destino nativo de origem
- aprovações por reação do Signal lidam com prompts de exec e de plugin somente quando a família de encaminhamento
  de nível superior correspondente está habilitada e roteia para o Signal. Aprovações diretas de exec no mesmo chat do Signal podem
  suprimir o fallback local de `/approve` sem aprovadores explícitos; a resolução por reação do Signal
  ainda exige aprovadores explícitos do Signal de `channels.signal.allowFrom` ou `defaultTo`.
- roteamento nativo por DM/canal e atalhos de reação do Matrix lidam com aprovações de exec e de plugin;
  a autorização de plugin ainda vem de `channels.matrix.dm.allowFrom`
- prompts nativos do Matrix incluem conteúdo de evento personalizado `com.openclaw.approval` no primeiro evento
  de prompt para que clientes Matrix compatíveis com OpenClaw possam ler o estado estruturado da aprovação enquanto clientes padrão
  mantêm o fallback em texto simples de `/approve`
- o solicitante não precisa ser um aprovador
- o chat de origem pode aprovar diretamente com `/approve` quando esse chat já aceita comandos e respostas
- botões nativos de aprovação do Discord roteiam pelo tipo do id de aprovação: ids `plugin:` vão
  direto para aprovações de plugin, todo o restante vai para aprovações de exec
- botões nativos de aprovação do Telegram seguem o mesmo fallback limitado de exec para plugin que `/approve`
- quando `target` nativo habilita entrega para o chat de origem, os prompts de aprovação incluem o texto do comando
- aprovações pendentes de exec expiram após 30 minutos por padrão
- se nenhuma UI de operador ou cliente de aprovação configurado puder aceitar a solicitação, o prompt recorre a `askFallback`

Comandos confidenciais de grupo apenas para proprietário, como `/diagnostics` e `/export-trajectory`, usam roteamento privado
do proprietário para prompts de aprovação e resultados finais. O OpenClaw primeiro tenta uma rota privada na
mesma superfície em que o proprietário executou o comando. Se essa superfície não tiver rota privada para proprietário, ele
recorre à primeira rota de proprietário disponível em `commands.ownerAllowFrom`, então um comando de grupo do Discord
ainda pode enviar a aprovação e o resultado para a DM do Telegram do proprietário quando o Telegram é a interface
privada principal configurada. O chat de grupo recebe apenas uma confirmação curta.

O Telegram usa DMs de aprovadores por padrão (`target: "dm"`). Você pode alternar para `channel` ou `both` quando
quiser que prompts de aprovação também apareçam no chat/tópico de origem do Telegram. Para tópicos de fórum do Telegram,
o OpenClaw preserva o tópico para o prompt de aprovação e o acompanhamento pós-aprovação.

Veja:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Fluxo IPC do macOS
__OC_I18N_900004__
Notas de segurança:

- Modo do soquete Unix `0600`, token armazenado em `exec-approvals.json`.
- Verificação de par com o mesmo UID.
- Desafio/resposta (nonce + token HMAC + hash da solicitação) + TTL curto.

## Perguntas frequentes

### Quando `accountId` e `threadId` seriam usados em um destino de aprovação?

Use `accountId` quando o canal tiver várias identidades configuradas e o prompt de aprovação precisar
sair por uma conta específica. Use `threadId` quando o destino aceitar tópicos ou
threads e o prompt dever permanecer dentro dessa thread em vez do chat de nível superior.

Um caso concreto no Telegram é um supergrupo de operações com tópicos de fórum e duas contas de bot do Telegram.
O valor `to` nomeia o supergrupo, `accountId` seleciona a conta do bot e `threadId`
seleciona o tópico do fórum:
__OC_I18N_900005__
Com essa configuração, aprovações de exec encaminhadas são publicadas pela conta `ops-bot` do Telegram no tópico
`77` do chat `-1001234567890`. Um destino sem `accountId` usa a conta padrão do canal, e
um destino sem `threadId` publica no destino de nível superior.

### Quando aprovações são enviadas para uma sessão, qualquer pessoa nessa sessão pode aprová-las?

Não. A entrega para sessão controla apenas onde o prompt aparece. Ela não autoriza por si só todos
os participantes desse chat a aprovar.

Para `/approve` genérico no mesmo chat, o remetente já precisa estar autorizado para comandos nessa
sessão do canal. Se o canal expõe aprovadores de aprovação explícitos, esses aprovadores podem autorizar
a ação `/approve` mesmo quando não têm autorização para comandos nessa sessão.

Alguns canais são mais restritos. Discord, Telegram, Matrix, DMs nativas de aprovação do Slack e clientes
nativos de aprovação semelhantes usam suas listas resolvidas de aprovadores para autorização de aprovação. Por exemplo,
um prompt de aprovação em tópico de fórum do Telegram pode ficar visível para todos no tópico, mas somente IDs
numéricos de usuário do Telegram resolvidos de `channels.telegram.execApprovals.approvers` ou
`commands.ownerAllowFrom` podem aprová-lo ou negá-lo.

## Relacionado

- [Aprovações de exec](/pt-BR/tools/exec-approvals) — política central e fluxo de aprovação
- [Ferramenta exec](/pt-BR/tools/exec)
- [Modo elevado](/pt-BR/tools/elevated)
- [Skills](/pt-BR/tools/skills) — comportamento de permissão automática com suporte de skill
