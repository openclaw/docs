---
read_when:
    - Configurando bins seguros ou perfis personalizados de safe-bin
    - Encaminhando aprovações para Slack/Discord/Telegram ou outros canais de chat
    - Implementando um cliente nativo de aprovação para um canal
summary: 'Aprovações avançadas de exec: bins seguros, binding de interpretador, encaminhamento de aprovação, entrega nativa'
title: Aprovações de exec — avançado
x-i18n:
    generated_at: "2026-04-24T06:16:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7834a8ebfb623b38e4c2676f0e24285d5b44e2dce45c55a33db842d1bbf81be
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

Tópicos avançados de aprovação de exec: o fast-path de `safeBins`, binding de interpretador/runtime e encaminhamento de aprovações para canais de chat (incluindo entrega nativa).
Para a política principal e o fluxo de aprovação, consulte [Exec approvals](/pt-BR/tools/exec-approvals).

## Safe bins (somente stdin)

`tools.exec.safeBins` define uma pequena lista de binários **somente stdin** (por
exemplo `cut`) que podem ser executados em modo allowlist **sem** entradas explícitas
na allowlist. Safe bins rejeitam args posicionais de arquivo e tokens parecidos com caminho, então
só podem operar sobre o fluxo de entrada. Trate isso como um fast-path estreito para
filtros de stream, não como uma lista geral de confiança.

<Warning>
**Não** adicione binários de interpretador ou runtime (por exemplo `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) a `safeBins`. Se um comando pode avaliar código,
executar subcomandos ou ler arquivos por definição, prefira entradas explícitas de allowlist
e mantenha os prompts de aprovação ativados. Safe bins personalizados devem definir um perfil explícito em `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Safe bins padrão:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` e `sort` não estão na lista padrão. Se você optar por incluí-los, mantenha entradas explícitas
de allowlist para os fluxos deles que não usam stdin. Para `grep` no modo safe-bin,
forneça o padrão com `-e`/`--regexp`; a forma de padrão posicional é rejeitada
para que operandos de arquivo não possam ser disfarçados como posicionais ambíguos.

### Validação de argv e flags negadas

A validação é determinística apenas a partir do formato de argv (sem verificações de existência do sistema de arquivos do host),
o que evita comportamento de oráculo de existência de arquivo devido a diferenças de allow/deny.
Opções orientadas a arquivo são negadas para safe bins padrão; opções longas são validadas com falha fechada (flags desconhecidas e abreviações ambíguas são
rejeitadas).

Flags negadas por perfil de safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins também forçam os tokens de argv a serem tratados como **texto literal** no momento da execução
(sem globbing e sem expansão de `$VARS`) para segmentos somente stdin, então padrões
como `*` ou `$HOME/...` não podem ser usados para esconder leituras de arquivo.

### Diretórios confiáveis de binários

Safe bins devem ser resolvidos a partir de diretórios confiáveis de binários (padrões do sistema mais
`tools.exec.safeBinTrustedDirs` opcional). Entradas de `PATH` nunca são confiáveis automaticamente.
Os diretórios padrão confiáveis são intencionalmente mínimos: `/bin`, `/usr/bin`. Se
seu executável safe-bin estiver em caminhos de gerenciador de pacotes/usuário (por exemplo
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), adicione-os
explicitamente a `tools.exec.safeBinTrustedDirs`.

### Encadeamento de shell, wrappers e multiplexadores

Encadeamento de shell (`&&`, `||`, `;`) é permitido quando todo segmento de nível superior
satisfaz a allowlist (incluindo safe bins ou auto-allow de skill). Redirecionamentos continuam não suportados em modo allowlist. Substituição de comando (`$()` / crases) é
rejeitada durante a análise da allowlist, inclusive dentro de aspas duplas; use aspas simples se
precisar de texto literal `$()`.

Em aprovações do app complementar no macOS, texto shell bruto contendo sintaxe de controle ou
expansão de shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) é
tratado como falha de allowlist, a menos que o próprio binário de shell esteja na allowlist.

Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), substituições de env com escopo de solicitação são
reduzidas a uma pequena allowlist explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Para decisões `allow-always` em modo allowlist, wrappers conhecidos de despacho (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) persistem o caminho do executável interno em vez
do caminho do wrapper. Multiplexadores de shell (`busybox`, `toybox`) são desembrulhados para
applets de shell (`sh`, `ash` etc.) da mesma forma. Se um wrapper ou multiplexador não
puder ser desembrulhado com segurança, nenhuma entrada de allowlist é persistida automaticamente.

Se você colocar intérpretes como `python3` ou `node` na allowlist, prefira
`tools.exec.strictInlineEval=true` para que avaliação inline ainda exija aprovação explícita.
No modo estrito, `allow-always` ainda pode persistir invocações benignas de
interpretador/script, mas carriers de eval inline não são persistidos
automaticamente.

### Safe bins versus allowlist

| Tópico           | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                           |
| ---------------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| Objetivo         | Auto-allow para filtros estreitos de stdin             | Confiar explicitamente em executáveis específicos           |
| Tipo de correspondência | Nome do executável + política argv de safe-bin  | Padrão glob do caminho resolvido do executável              |
| Escopo de argumentos | Restrito pelo perfil do safe-bin e regras de token literal | Apenas correspondência de caminho; os argumentos continuam sob sua responsabilidade |
| Exemplos típicos | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLIs personalizadas      |
| Melhor uso       | Transformações de texto de baixo risco em pipelines    | Qualquer ferramenta com comportamento mais amplo ou efeitos colaterais |

Local de configuração:

- `safeBins` vem da configuração (`tools.exec.safeBins` ou por agente em `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` vem da configuração (`tools.exec.safeBinTrustedDirs` ou por agente em `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` vem da configuração (`tools.exec.safeBinProfiles` ou por agente em `agents.list[].tools.exec.safeBinProfiles`). Chaves de perfil por agente substituem as globais.
- Entradas de allowlist ficam no arquivo local do host `~/.openclaw/exec-approvals.json` em `agents.<id>.allowlist` (ou via Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` emite o aviso `tools.exec.safe_bins_interpreter_unprofiled` quando bins de interpretador/runtime aparecem em `safeBins` sem perfis explícitos.
- `openclaw doctor --fix` pode criar entradas ausentes de `safeBinProfiles.<bin>` como `{}` (revise e restrinja depois). Bins de interpretador/runtime não são auto-criados.

Exemplo de perfil personalizado:
__OC_I18N_900000__
Se você optar explicitamente por incluir `jq` em `safeBins`, o OpenClaw ainda rejeita o builtin `env` no modo safe-bin para que `jq -n env` não possa despejar o ambiente do processo do host sem um caminho explícito de allowlist
ou prompt de aprovação.

## Comandos de interpretador/runtime

Execuções de interpretador/runtime respaldadas por aprovação são intencionalmente conservadoras:

- O contexto exato de argv/cwd/env é sempre vinculado.
- Formas diretas de script de shell e formas diretas de arquivo de runtime são vinculadas, quando possível, a um único snapshot concreto de arquivo local.
- Formas comuns de wrapper de gerenciador de pacotes que ainda resolvem para um único arquivo local direto (por exemplo
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) são desembrulhadas antes do binding.
- Se o OpenClaw não conseguir identificar exatamente um único arquivo local concreto para um comando de interpretador/runtime
  (por exemplo scripts de pacote, formas de eval, cadeias de loader específicas de runtime ou formas ambíguas
  com vários arquivos), a execução respaldada por aprovação é negada em vez de alegar uma cobertura semântica que
  ele não possui.
- Para esses fluxos, prefira sandboxing, um limite separado de host ou um fluxo explícito de
  allowlist/full confiável em que o operador aceita a semântica mais ampla do runtime.

Quando aprovações são exigidas, a ferramenta exec retorna imediatamente com um ID de aprovação. Use esse ID para
correlacionar eventos posteriores do sistema (`Exec finished` / `Exec denied`). Se nenhuma decisão chegar antes do
timeout, a solicitação é tratada como timeout de aprovação e aparece como motivo de negação.

### Comportamento de entrega de acompanhamento

Depois que um exec assíncrono aprovado termina, o OpenClaw envia um turno de `agent` de acompanhamento para a mesma sessão.

- Se existir um destino externo válido de entrega (canal entregável mais target `to`), a entrega de acompanhamento usa esse canal.
- Em fluxos apenas de webchat ou de sessão interna sem destino externo, a entrega de acompanhamento permanece apenas na sessão (`deliver: false`).
- Se um chamador solicitar explicitamente entrega externa estrita sem um canal externo resolvível, a solicitação falha com `INVALID_REQUEST`.
- Se `bestEffortDeliver` estiver ativado e nenhum canal externo puder ser resolvido, a entrega é rebaixada para somente sessão em vez de falhar.

## Encaminhamento de aprovação para canais de chat

Você pode encaminhar prompts de aprovação de exec para qualquer canal de chat (incluindo canais de Plugin) e aprová-los
com `/approve`. Isso usa o pipeline normal de entrega de saída.

Configuração:
__OC_I18N_900001__
Responder no chat:
__OC_I18N_900002__
O comando `/approve` trata aprovações de exec e de Plugin. Se o ID não corresponder a uma aprovação de exec pendente, ele automaticamente verifica aprovações de Plugin.

### Encaminhamento de aprovação de Plugin

O encaminhamento de aprovação de Plugin usa o mesmo pipeline de entrega das aprovações de exec, mas tem sua própria
configuração independente em `approvals.plugin`. Ativar ou desativar um não afeta o outro.
__OC_I18N_900003__
O formato da configuração é idêntico ao de `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` e `targets` funcionam da mesma forma.

Canais que oferecem suporte a respostas interativas compartilhadas exibem os mesmos botões de aprovação para aprovações de exec e de Plugin. Canais sem UI interativa compartilhada recorrem a texto simples com instruções `/approve`.

### Aprovações no mesmo chat em qualquer canal

Quando uma solicitação de aprovação de exec ou de Plugin se origina de uma superfície de chat entregável, o mesmo chat
agora pode aprová-la com `/approve` por padrão. Isso se aplica a canais como Slack, Matrix e
Microsoft Teams, além dos fluxos existentes de Web UI e UI de terminal.

Esse caminho compartilhado por comando de texto usa o modelo normal de autenticação do canal para aquela conversa. Se o
chat de origem já puder enviar comandos e receber respostas, as solicitações de aprovação não precisam mais de um adaptador nativo separado de entrega apenas para permanecerem pendentes.

Discord e Telegram também oferecem suporte a `/approve` no mesmo chat, mas esses canais ainda usam sua
lista resolvida de aprovadores para autorização, mesmo quando a entrega nativa de aprovação está desativada.

Para Telegram e outros clientes nativos de aprovação que chamam o Gateway diretamente,
esse fallback é intencionalmente limitado a falhas de “aprovação não encontrada”. Uma negação/erro real de aprovação de exec não tenta novamente silenciosamente como aprovação de Plugin.

### Entrega nativa de aprovação

Alguns canais também podem atuar como clientes nativos de aprovação. Clientes nativos adicionam DMs de aprovadores, fanout para o chat de origem e UX interativa de aprovação específica do canal sobre o fluxo compartilhado de `/approve` no mesmo chat.

Quando cartões/botões nativos de aprovação estão disponíveis, essa UI nativa é o caminho principal
voltado ao agente. O agente não deve também ecoar um comando simples duplicado
`/approve`, a menos que o resultado da ferramenta diga que aprovações por chat estão indisponíveis ou
que a aprovação manual é o único caminho restante.

Modelo genérico:

- a política de exec do host ainda decide se a aprovação de exec é exigida
- `approvals.exec` controla o encaminhamento de prompts de aprovação para outros destinos de chat
- `channels.<channel>.execApprovals` controla se aquele canal atua como cliente nativo de aprovação

Clientes nativos de aprovação ativam automaticamente entrega com prioridade para DM quando todas estas condições são verdadeiras:

- o canal oferece suporte a entrega nativa de aprovação
- os aprovadores podem ser resolvidos a partir de `execApprovals.approvers` explícito ou das fontes de fallback documentadas daquele canal
- `channels.<channel>.execApprovals.enabled` está indefinido ou é `"auto"`

Defina `enabled: false` para desativar explicitamente um cliente nativo de aprovação. Defina `enabled: true` para forçá-lo
quando os aprovadores puderem ser resolvidos. A entrega pública ao chat de origem continua explícita por
`channels.<channel>.execApprovals.target`.

FAQ: [Why are there two exec approval configs for chat approvals?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Esses clientes nativos de aprovação adicionam roteamento por DM e fanout opcional para canal sobre o fluxo compartilhado de `/approve` no mesmo chat e sobre os botões compartilhados de aprovação.

Comportamento compartilhado:

- Slack, Matrix, Microsoft Teams e chats entregáveis semelhantes usam o modelo normal de autenticação do canal
  para `/approve` no mesmo chat
- quando um cliente nativo de aprovação é ativado automaticamente, o destino nativo padrão de entrega são DMs de aprovadores
- para Discord e Telegram, apenas aprovadores resolvidos podem aprovar ou negar
- aprovadores do Discord podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- aprovadores do Telegram podem ser explícitos (`execApprovals.approvers`) ou inferidos da configuração existente do proprietário (`allowFrom`, mais `defaultTo` de mensagem direta quando compatível)
- aprovadores do Slack podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- botões nativos do Slack preservam o tipo do ID de aprovação, então IDs `plugin:` podem resolver aprovações de Plugin
  sem uma segunda camada local de fallback do Slack
- roteamento nativo de DM/canal e atalhos por reação do Matrix tratam aprovações de exec e de Plugin;
  a autorização de Plugin ainda vem de `channels.matrix.dm.allowFrom`
- o solicitante não precisa ser um aprovador
- o chat de origem pode aprovar diretamente com `/approve` quando esse chat já oferece suporte a comandos e respostas
- botões nativos de aprovação do Discord roteiam por tipo de ID de aprovação: IDs `plugin:` vão
  diretamente para aprovações de Plugin, todo o restante vai para aprovações de exec
- botões nativos de aprovação do Telegram seguem o mesmo fallback limitado de exec para Plugin que `/approve`
- quando `target` nativo ativa entrega no chat de origem, os prompts de aprovação incluem o texto do comando
- aprovações pendentes de exec expiram após 30 minutos por padrão
- se nenhuma UI de operador ou cliente de aprovação configurado puder aceitar a solicitação, o prompt recorre a `askFallback`

O Telegram usa por padrão DMs de aprovadores (`target: "dm"`). Você pode mudar para `channel` ou `both` quando
quiser que prompts de aprovação apareçam também no chat/tópico original do Telegram. Para
tópicos de fórum do Telegram, o OpenClaw preserva o tópico no prompt de aprovação e no acompanhamento pós-aprovação.

Consulte:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Fluxo IPC do macOS
__OC_I18N_900004__
Observações de segurança:

- Modo de socket Unix `0600`, token armazenado em `exec-approvals.json`.
- Verificação de peer com o mesmo UID.
- Desafio/resposta (nonce + token HMAC + hash da solicitação) + TTL curto.

## Relacionado

- [Exec approvals](/pt-BR/tools/exec-approvals) — política principal e fluxo de aprovação
- [Ferramenta exec](/pt-BR/tools/exec)
- [Modo elevado](/pt-BR/tools/elevated)
- [Skills](/pt-BR/tools/skills) — comportamento de auto-allow apoiado por skill
