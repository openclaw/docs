---
read_when:
    - Configurando bins seguros ou perfis personalizados de safe-bin
    - Encaminhamento de aprovações para Slack/Discord/Telegram ou outros canais de chat
    - Implementação de um cliente de aprovação nativo para um canal
summary: 'Aprovações avançadas de execução: bins seguros, associação de interpretador, encaminhamento de aprovação, entrega nativa'
title: Aprovações de execução — avançado
x-i18n:
    generated_at: "2026-04-25T13:56:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5fab4a65d2d14f0d15cbe750d718b2a4e8f781a218debdb24b41be570a22d87
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

Tópicos avançados de aprovação de exec: o fast-path de `safeBins`, vínculo de interpretador/runtime e encaminhamento de aprovação para canais de chat (incluindo entrega nativa).
Para a política principal e o fluxo de aprovação, consulte [Aprovações de exec](/pt-BR/tools/exec-approvals).

## Bins seguros (somente stdin)

`tools.exec.safeBins` define uma pequena lista de binários **somente stdin** (por
exemplo `cut`) que podem ser executados no modo de allowlist **sem** entradas
explícitas na allowlist. Os bins seguros rejeitam args posicionais de arquivo e tokens semelhantes a caminhos, portanto
só podem operar no fluxo de entrada. Trate isso como um fast-path restrito para
filtros de fluxo, não como uma lista geral de confiança.

<Warning>
**Não** adicione binários de interpretador ou runtime (por exemplo `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) a `safeBins`. Se um comando puder avaliar código,
executar subcomandos ou ler arquivos por definição, prefira entradas explícitas na allowlist
e mantenha os prompts de aprovação ativados. Bins seguros personalizados devem definir um perfil
explícito em `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Bins seguros padrão:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` e `sort` não estão na lista padrão. Se você optar por incluí-los, mantenha entradas
explícitas na allowlist para seus fluxos de trabalho que não usam stdin. Para `grep` no modo safe-bin,
forneça o padrão com `-e`/`--regexp`; a forma posicional de padrão é rejeitada
para que operandos de arquivo não possam ser ocultados como posicionais ambíguos.

### Validação de argv e flags negadas

A validação é determinística apenas a partir do formato de argv (sem verificações de existência
no sistema de arquivos do host), o que impede o comportamento de oráculo de existência de arquivos a partir de diferenças
entre permitir/negar. Opções orientadas a arquivos são negadas para bins seguros padrão; opções longas
são validadas em fail-closed (flags desconhecidas e abreviações ambíguas são
rejeitadas).

Flags negadas por perfil de safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Bins seguros também forçam que tokens de argv sejam tratados como **texto literal** no momento
da execução (sem globbing e sem expansão de `$VARS`) para segmentos somente stdin, de modo que padrões
como `*` ou `$HOME/...` não possam ser usados para ocultar leituras de arquivos.

### Diretórios de binários confiáveis

Bins seguros devem ser resolvidos a partir de diretórios de binários confiáveis (padrões do sistema mais
`tools.exec.safeBinTrustedDirs` opcional). Entradas de `PATH` nunca são confiáveis automaticamente.
Os diretórios confiáveis padrão são intencionalmente mínimos: `/bin`, `/usr/bin`. Se
o executável do seu safe-bin estiver em caminhos de usuário ou de gerenciador de pacotes (por exemplo
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), adicione-os
explicitamente a `tools.exec.safeBinTrustedDirs`.

### Encadeamento de shell, wrappers e multiplexadores

O encadeamento de shell (`&&`, `||`, `;`) é permitido quando cada segmento de nível superior
satisfaz a allowlist (incluindo safe bins ou auto-allow de Skills). Redirecionamentos
continuam sem suporte no modo allowlist. Substituição de comando (`$()` / crases) é
rejeitada durante o parsing da allowlist, inclusive dentro de aspas duplas; use aspas simples se
precisar de texto literal `$()`.

Em aprovações do app companion no macOS, texto shell bruto contendo sintaxe de controle ou
expansão de shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) é
tratado como um miss da allowlist, a menos que o próprio binário do shell esteja na allowlist.

Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), substituições de env no escopo da solicitação são
reduzidas a uma pequena allowlist explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Para decisões `allow-always` no modo allowlist, wrappers de despacho conhecidos (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) persistem o caminho do executável interno em vez
do caminho do wrapper. Multiplexadores de shell (`busybox`, `toybox`) são desempacotados para
applets de shell (`sh`, `ash` etc.) da mesma forma. Se um wrapper ou multiplexador não puder
ser desempacotado com segurança, nenhuma entrada de allowlist será persistida automaticamente.

Se você colocar interpretadores na allowlist, como `python3` ou `node`, prefira
`tools.exec.strictInlineEval=true` para que eval inline ainda exija uma aprovação explícita.
No modo estrito, `allow-always` ainda pode persistir invocações benignas de
interpretador/script, mas portadores de eval inline não são persistidos automaticamente.

### Safe bins versus allowlist

| Tópico           | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Objetivo         | Permitir automaticamente filtros restritos de stdin    | Confiar explicitamente em executáveis específicos                                  |
| Tipo de correspondência | Nome do executável + política de argv do safe-bin | Glob do caminho do executável resolvido, ou glob de nome de comando simples para comandos invocados por PATH |
| Escopo dos argumentos | Restrito pelo perfil do safe-bin e pelas regras de token literal | Apenas correspondência de caminho; os argumentos ficam sob sua responsabilidade    |
| Exemplos típicos | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLIs personalizados                             |
| Melhor uso       | Transformações de texto de baixo risco em pipelines    | Qualquer ferramenta com comportamento mais amplo ou efeitos colaterais             |

Local de configuração:

- `safeBins` vem da configuração (`tools.exec.safeBins` ou por agente em `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` vem da configuração (`tools.exec.safeBinTrustedDirs` ou por agente em `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` vem da configuração (`tools.exec.safeBinProfiles` ou por agente em `agents.list[].tools.exec.safeBinProfiles`). Chaves de perfil por agente sobrescrevem chaves globais.
- entradas da allowlist ficam em `~/.openclaw/exec-approvals.json` local ao host em `agents.<id>.allowlist` (ou via Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` emite o aviso `tools.exec.safe_bins_interpreter_unprofiled` quando bins de interpretador/runtime aparecem em `safeBins` sem perfis explícitos.
- `openclaw doctor --fix` pode gerar entradas ausentes de `safeBinProfiles.<bin>` como `{}` (revise e restrinja depois). Bins de interpretador/runtime não são gerados automaticamente.

Exemplo de perfil personalizado:
__OC_I18N_900000__
Se você optar explicitamente por incluir `jq` em `safeBins`, o OpenClaw ainda rejeita o builtin `env` no modo safe-bin
para que `jq -n env` não possa despejar o ambiente do processo do host sem um caminho explicitamente colocado na allowlist
ou um prompt de aprovação.

## Comandos de interpretador/runtime

Execuções de interpretador/runtime com suporte a aprovação são intencionalmente conservadoras:

- O contexto exato de argv/cwd/env é sempre vinculado.
- Formas diretas de script de shell e formas diretas de arquivo de runtime são vinculadas, quando possível, a um único snapshot concreto de arquivo local.
- Formas comuns de wrapper de gerenciador de pacotes que ainda resolvem para um único arquivo local direto (por exemplo
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) são desembrulhadas antes do vínculo.
- Se o OpenClaw não conseguir identificar exatamente um arquivo local concreto para um comando de interpretador/runtime
  (por exemplo scripts de pacote, formas eval, cadeias de loader específicas de runtime ou
  formas ambíguas com múltiplos arquivos), a execução com suporte a aprovação é negada em vez de alegar cobertura
  semântica que ele não pode fornecer.
- Para esses fluxos de trabalho, prefira sandboxing, um limite separado de host ou um fluxo explícito
  de allowlist/confiável completo em que o operador aceite a semântica mais ampla do runtime.

Quando aprovações forem necessárias, a ferramenta exec retorna imediatamente com um id de aprovação. Use esse id para
correlacionar eventos posteriores do sistema (`Exec finished` / `Exec denied`). Se nenhuma decisão chegar antes do
timeout, a solicitação será tratada como timeout de aprovação e exposta como motivo da negação.

### Comportamento de entrega de followup

Depois que um exec assíncrono aprovado termina, o OpenClaw envia um turno `agent` de followup para a mesma sessão.

- Se existir um destino externo válido para entrega (canal entregável mais destino `to`), a entrega do followup usa esse canal.
- Em fluxos somente de webchat ou de sessão interna sem destino externo, a entrega do followup permanece apenas na sessão (`deliver: false`).
- Se um chamador solicitar explicitamente entrega externa estrita sem um canal externo resolvível, a solicitação falhará com `INVALID_REQUEST`.
- Se `bestEffortDeliver` estiver habilitado e nenhum canal externo puder ser resolvido, a entrega será reduzida para apenas a sessão em vez de falhar.

## Encaminhamento de aprovação para canais de chat

Você pode encaminhar prompts de aprovação de exec para qualquer canal de chat (incluindo canais de Plugin) e aprová-los
com `/approve`. Isso usa o pipeline normal de entrega de saída.

Configuração:
__OC_I18N_900001__
Responda no chat:
__OC_I18N_900002__
O comando `/approve` processa tanto aprovações de exec quanto aprovações de Plugin. Se o ID não corresponder a uma aprovação de exec pendente, ele verificará automaticamente aprovações de Plugin.

### Encaminhamento de aprovação de Plugin

O encaminhamento de aprovação de Plugin usa o mesmo pipeline de entrega que as aprovações de exec, mas tem sua própria
configuração independente em `approvals.plugin`. Habilitar ou desabilitar um não afeta o outro.
__OC_I18N_900003__
O formato da configuração é idêntico ao de `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` e `targets` funcionam da mesma forma.

Canais que oferecem suporte a respostas interativas compartilhadas exibem os mesmos botões de aprovação para aprovações de exec e
de Plugin. Canais sem UI interativa compartilhada recorrem a texto simples com instruções de `/approve`.

### Aprovações no mesmo chat em qualquer canal

Quando uma solicitação de aprovação de exec ou de Plugin se origina de uma superfície de chat entregável, o mesmo chat
agora pode aprová-la com `/approve` por padrão. Isso se aplica a canais como Slack, Matrix e
Microsoft Teams, além dos fluxos já existentes da Web UI e da terminal UI.

Esse caminho compartilhado de comando de texto usa o modelo normal de autenticação do canal para aquela conversa. Se o
chat de origem já puder enviar comandos e receber respostas, as solicitações de aprovação não precisam mais de um
adaptador de entrega nativo separado apenas para permanecerem pendentes.

Discord e Telegram também oferecem suporte a `/approve` no mesmo chat, mas esses canais ainda usam sua
lista resolvida de aprovadores para autorização, mesmo quando a entrega nativa de aprovação está desativada.

Para Telegram e outros clientes de aprovação nativos que chamam o Gateway diretamente,
esse fallback é intencionalmente limitado a falhas de "approval not found". Uma negação/erro real de
aprovação de exec não tenta novamente silenciosamente como uma aprovação de Plugin.

### Entrega nativa de aprovação

Alguns canais também podem atuar como clientes nativos de aprovação. Clientes nativos adicionam DMs de aprovadores, fanout no chat de origem
e UX interativa de aprovação específica do canal sobre o fluxo compartilhado de `/approve` no mesmo chat.

Quando cards/botões nativos de aprovação estão disponíveis, essa UI nativa é o caminho principal voltado ao agente. O agente não deve também ecoar um comando simples de chat `/approve` duplicado, a menos que o resultado da ferramenta informe que aprovações por chat não estão disponíveis ou que a aprovação manual seja o único caminho restante.

Modelo genérico:

- a política de exec do host ainda decide se a aprovação de exec é necessária
- `approvals.exec` controla o encaminhamento de prompts de aprovação para outros destinos de chat
- `channels.<channel>.execApprovals` controla se esse canal atua como cliente nativo de aprovação

Clientes nativos de aprovação ativam automaticamente a entrega priorizando DMs quando tudo isso é verdadeiro:

- o canal oferece suporte à entrega nativa de aprovação
- os aprovadores podem ser resolvidos a partir de `execApprovals.approvers` explícito ou das fontes de fallback documentadas desse canal
- `channels.<channel>.execApprovals.enabled` não está definido ou está como `"auto"`

Defina `enabled: false` para desabilitar explicitamente um cliente nativo de aprovação. Defina `enabled: true` para
forçá-lo a ficar ativo quando os aprovadores forem resolvidos. A entrega pública no chat de origem continua explícita por meio de
`channels.<channel>.execApprovals.target`.

FAQ: [Por que há duas configurações de aprovação de exec para aprovações por chat?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Esses clientes nativos de aprovação adicionam roteamento por DM e fanout opcional no canal sobre o fluxo compartilhado de
`/approve` no mesmo chat e os botões compartilhados de aprovação.

Comportamento compartilhado:

- Slack, Matrix, Microsoft Teams e chats entregáveis semelhantes usam o modelo normal de autenticação do canal
  para `/approve` no mesmo chat
- quando um cliente nativo de aprovação é ativado automaticamente, o destino nativo padrão de entrega são as DMs dos aprovadores
- para Discord e Telegram, apenas aprovadores resolvidos podem aprovar ou negar
- aprovadores do Discord podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- aprovadores do Telegram podem ser explícitos (`execApprovals.approvers`) ou inferidos da configuração de owner existente (`allowFrom`, mais `defaultTo` de mensagem direta quando houver suporte)
- aprovadores do Slack podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- botões nativos do Slack preservam o tipo do id de aprovação, então ids `plugin:` podem resolver aprovações de Plugin
  sem uma segunda camada local de fallback do Slack
- roteamento nativo de DM/canal do Matrix e atalhos por reação lidam com aprovações de exec e de Plugin;
  a autorização de Plugin ainda vem de `channels.matrix.dm.allowFrom`
- o solicitante não precisa ser um aprovador
- o chat de origem pode aprovar diretamente com `/approve` quando esse chat já oferece suporte a comandos e respostas
- botões nativos de aprovação do Discord roteiam pelo tipo do id de aprovação: ids `plugin:` vão
  diretamente para aprovações de Plugin, todo o restante vai para aprovações de exec
- botões nativos de aprovação do Telegram seguem o mesmo fallback limitado de exec para Plugin que `/approve`
- quando `target` nativo habilita entrega no chat de origem, os prompts de aprovação incluem o texto do comando
- aprovações de exec pendentes expiram após 30 minutos por padrão
- se nenhuma UI de operador ou cliente de aprovação configurado puder aceitar a solicitação, o prompt recorre a `askFallback`

O Telegram usa por padrão as DMs dos aprovadores (`target: "dm"`). Você pode mudar para `channel` ou `both` quando
quiser que prompts de aprovação também apareçam no chat/tópico de origem do Telegram. Para tópicos de fórum do Telegram,
o OpenClaw preserva o tópico no prompt de aprovação e no follow-up após a aprovação.

Consulte:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Fluxo IPC do macOS
__OC_I18N_900004__
Notas de segurança:

- Modo do socket Unix `0600`, token armazenado em `exec-approvals.json`.
- Verificação de peer com o mesmo UID.
- Challenge/response (nonce + token HMAC + hash da solicitação) + TTL curto.

## Relacionado

- [Aprovações de exec](/pt-BR/tools/exec-approvals) — política principal e fluxo de aprovação
- [Ferramenta exec](/pt-BR/tools/exec)
- [Modo elevado](/pt-BR/tools/elevated)
- [Skills](/pt-BR/tools/skills) — comportamento de auto-allow com suporte de skill
