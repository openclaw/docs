---
read_when:
    - Configurando categorias seguras ou perfis personalizados de categorias seguras
    - Encaminhamento de aprovações para Slack/Discord/Telegram ou outros canais de chat
    - Implementando um cliente de aprovação nativo para um canal
summary: 'Aprovações avançadas de exec: binários seguros, vinculação de interpretador, encaminhamento de aprovação, entrega nativa'
title: Aprovações de execução — avançado
x-i18n:
    generated_at: "2026-05-07T01:54:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: d876efbfa34ef951b47cbfec9cc6a6a69a69f5b84365165d423d251163373040
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Tópicos avançados de aprovação de exec: o caminho rápido `safeBins`, vinculação de interpretador/runtime
e encaminhamento de aprovações para canais de chat (incluindo entrega nativa).
Para a política central e o fluxo de aprovação, consulte [Aprovações de exec](/pt-BR/tools/exec-approvals).

## Bins seguros (somente stdin)

`tools.exec.safeBins` define uma pequena lista de binários **somente stdin** (por
exemplo `cut`) que podem ser executados no modo de lista de permissões **sem** entradas
explícitas na lista de permissões. Bins seguros rejeitam argumentos posicionais de arquivo e tokens
com aparência de caminho, então só podem operar no fluxo de entrada. Trate isso como um caminho rápido
restrito para filtros de fluxo, não como uma lista de confiança geral.

<Warning>
**Não** adicione binários de interpretador ou runtime (por exemplo `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) a `safeBins`. Se um comando pode avaliar código,
executar subcomandos ou ler arquivos por projeto, prefira entradas explícitas na lista de permissões
e mantenha prompts de aprovação habilitados. Bins seguros personalizados devem definir um perfil
explícito em `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Bins seguros padrão:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` e `sort` não estão na lista padrão. Se você optar por incluí-los, mantenha entradas
explícitas na lista de permissões para os fluxos de trabalho que não usam stdin. Para `grep` no modo de bin seguro,
forneça o padrão com `-e`/`--regexp`; a forma de padrão posicional é rejeitada
para que operandos de arquivo não possam ser disfarçados como posicionais ambíguos.

### Validação de argv e flags negadas

A validação é determinística apenas a partir do formato de argv (sem verificações de existência
no sistema de arquivos do host), o que impede comportamento de oráculo de existência de arquivos a partir de diferenças
entre permitir/negar. Opções orientadas a arquivo são negadas para bins seguros padrão; opções
longas são validadas com falha fechada (flags desconhecidas e abreviações ambíguas são
rejeitadas).

Flags negadas por perfil de bin seguro:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Bins seguros também forçam tokens de argv a serem tratados como **texto literal** no momento da execução
(sem globbing e sem expansão de `$VARS`) para segmentos somente stdin, então padrões
como `*` ou `$HOME/...` não podem ser usados para disfarçar leituras de arquivo.

### Diretórios de binários confiáveis

Bins seguros devem ser resolvidos a partir de diretórios de binários confiáveis (padrões do sistema mais
`tools.exec.safeBinTrustedDirs` opcional). Entradas de `PATH` nunca são confiáveis automaticamente.
Os diretórios confiáveis padrão são intencionalmente mínimos: `/bin`, `/usr/bin`. Se
o executável do seu bin seguro estiver em caminhos de gerenciador de pacotes/usuário (por exemplo
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), adicione-os
explicitamente a `tools.exec.safeBinTrustedDirs`.

### Encadeamento de shell, wrappers e multiplexadores

Encadeamento de shell (`&&`, `||`, `;`) é permitido quando cada segmento de nível superior
satisfaz a lista de permissões (incluindo bins seguros ou permissão automática de Skills). Redirecionamentos
continuam sem suporte no modo de lista de permissões. Substituição de comando (`$()` / crases) é
rejeitada durante a análise da lista de permissões, inclusive dentro de aspas duplas; use aspas
simples se precisar de texto literal `$()`.

Em aprovações do app complementar no macOS, texto shell bruto contendo sintaxe de controle ou
expansão de shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) é
tratado como ausência na lista de permissões, a menos que o próprio binário do shell esteja na lista de permissões.

Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), substituições de env com escopo de solicitação são
reduzidas a uma pequena lista de permissões explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Para decisões `allow-always` no modo de lista de permissões, wrappers de despacho conhecidos (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) persistem o caminho do executável interno em vez
do caminho do wrapper. Multiplexadores de shell (`busybox`, `toybox`) são desembrulhados para
applets de shell (`sh`, `ash`, etc.) da mesma forma. Se um wrapper ou multiplexador
não puder ser desembrulhado com segurança, nenhuma entrada de lista de permissões será persistida automaticamente.

Se você colocar interpretadores como `python3` ou `node` na lista de permissões, prefira
`tools.exec.strictInlineEval=true` para que avaliação inline ainda exija uma aprovação
explícita. Em modo estrito, `allow-always` ainda pode persistir invocações benignas de
interpretador/script, mas portadores de avaliação inline não são persistidos
automaticamente.

### Bins seguros versus lista de permissões

| Tópico           | `tools.exec.safeBins`                                  | Lista de permissões (`exec-approvals.json`)                                        |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Objetivo         | Permitir automaticamente filtros stdin restritos        | Confiar explicitamente em executáveis específicos                                  |
| Tipo de correspondência | Nome do executável + política de argv de bin seguro | Glob do caminho do executável resolvido, ou glob de nome de comando simples para comandos invocados por PATH |
| Escopo de argumentos | Restrito pelo perfil de bin seguro e regras de token literal | Correspondência de caminho por padrão; `argPattern` opcional pode restringir argv analisado |
| Exemplos típicos | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLIs personalizadas                             |
| Melhor uso       | Transformações de texto de baixo risco em pipelines    | Qualquer ferramenta com comportamento mais amplo ou efeitos colaterais             |

Local da configuração:

- `safeBins` vem da configuração (`tools.exec.safeBins` ou `agents.list[].tools.exec.safeBins` por agente).
- `safeBinTrustedDirs` vem da configuração (`tools.exec.safeBinTrustedDirs` ou `agents.list[].tools.exec.safeBinTrustedDirs` por agente).
- `safeBinProfiles` vem da configuração (`tools.exec.safeBinProfiles` ou `agents.list[].tools.exec.safeBinProfiles` por agente). Chaves de perfil por agente substituem chaves globais.
- Entradas de lista de permissões ficam em `~/.openclaw/exec-approvals.json` local ao host, em `agents.<id>.allowlist` (ou via UI de Controle / `openclaw approvals allowlist ...`).
- `openclaw security audit` avisa com `tools.exec.safe_bins_interpreter_unprofiled` quando bins de interpretador/runtime aparecem em `safeBins` sem perfis explícitos.
- `openclaw doctor --fix` pode criar entradas ausentes de `safeBinProfiles.<bin>` personalizadas como `{}` (revise e restrinja depois). Bins de interpretador/runtime não são criados automaticamente.

Exemplo de perfil personalizado:
__OC_I18N_900000__
Se você incluir explicitamente `jq` em `safeBins`, o OpenClaw ainda rejeita o builtin `env` no modo de bin seguro
para que `jq -n env` não consiga despejar o ambiente do processo host sem um caminho explícito de lista de permissões
ou prompt de aprovação.

## Comandos de interpretador/runtime

Execuções de interpretador/runtime apoiadas por aprovação são intencionalmente conservadoras:

- O contexto exato de argv/cwd/env é sempre vinculado.
- Formas diretas de script shell e arquivo direto de runtime são vinculadas, no melhor esforço, a um snapshot concreto de arquivo local.
- Formas comuns de wrapper de gerenciador de pacotes que ainda resolvem para um arquivo local direto (por exemplo
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) são desembrulhadas antes da vinculação.
- Se o OpenClaw não consegue identificar exatamente um arquivo local concreto para um comando de interpretador/runtime
  (por exemplo scripts de pacote, formas de eval, cadeias de loader específicas de runtime ou formas ambíguas com múltiplos arquivos),
  a execução apoiada por aprovação é negada em vez de alegar cobertura semântica que ela não tem.
- Para esses fluxos de trabalho, prefira sandboxing, um limite de host separado ou uma lista de permissões/fluxo de trabalho completo explicitamente confiável em que o operador aceite a semântica de runtime mais ampla.

Quando aprovações são exigidas, a ferramenta exec retorna imediatamente com um id de aprovação. Use esse id para
correlacionar eventos posteriores do sistema (`Exec finished` / `Exec denied`). Se nenhuma decisão chegar antes do
timeout, a solicitação é tratada como timeout de aprovação e apresentada como motivo de negação.

### Comportamento de entrega de followup

Depois que uma execução assíncrona aprovada termina, o OpenClaw envia um turno de `agent` de followup para a mesma sessão.

- Se existir um alvo de entrega externo válido (canal entregável mais alvo `to`), a entrega de followup usa esse canal.
- Em fluxos somente de webchat ou sessão interna sem alvo externo, a entrega de followup permanece somente na sessão (`deliver: false`).
- Se um chamador solicitar explicitamente entrega externa estrita sem canal externo resolvível, a solicitação falha com `INVALID_REQUEST`.
- Se `bestEffortDeliver` estiver habilitado e nenhum canal externo puder ser resolvido, a entrega é rebaixada para somente sessão em vez de falhar.

## Encaminhamento de aprovações para canais de chat

Você pode encaminhar prompts de aprovação de exec para qualquer canal de chat (incluindo canais de Plugin) e aprová-los
com `/approve`. Isso usa o pipeline normal de entrega de saída.

Configuração:
__OC_I18N_900001__
Responda no chat:
__OC_I18N_900002__
O comando `/approve` lida tanto com aprovações de exec quanto com aprovações de Plugin. Se o ID não corresponder a uma aprovação de exec pendente, ele verifica automaticamente aprovações de Plugin em seguida.

### Encaminhamento de aprovações de Plugin

O encaminhamento de aprovações de Plugin usa o mesmo pipeline de entrega que aprovações de exec, mas tem sua própria
configuração independente em `approvals.plugin`. Habilitar ou desabilitar um não afeta o outro.
__OC_I18N_900003__
O formato da configuração é idêntico a `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` e `targets` funcionam da mesma forma.

Canais que oferecem suporte a respostas interativas compartilhadas renderizam os mesmos botões de aprovação para aprovações de exec e
Plugin. Canais sem UI interativa compartilhada recorrem a texto simples com instruções de `/approve`.
Solicitações de aprovação de Plugin podem restringir as decisões disponíveis. Superfícies de aprovação usam o conjunto de decisões
declarado pela solicitação, e o Gateway rejeita tentativas de enviar uma decisão que não foi oferecida.

### Aprovações no mesmo chat em qualquer canal

Quando uma solicitação de aprovação de exec ou Plugin se origina de uma superfície de chat entregável, o mesmo chat
agora pode aprová-la com `/approve` por padrão. Isso se aplica a canais como Slack, Matrix e
Microsoft Teams, além dos fluxos existentes de UI Web e UI de terminal.

Esse caminho compartilhado de comando de texto usa o modelo normal de autenticação do canal para essa conversa. Se o
chat de origem já consegue enviar comandos e receber respostas, as solicitações de aprovação não precisam mais de um
adaptador separado de entrega nativa apenas para permanecerem pendentes.

Discord e Telegram também oferecem suporte a `/approve` no mesmo chat, mas esses canais ainda usam sua
lista resolvida de aprovadores para autorização mesmo quando a entrega nativa de aprovação está desabilitada.

Para Telegram e outros clientes de aprovação nativa que chamam o Gateway diretamente,
esse fallback é intencionalmente limitado a falhas de "aprovação não encontrada". Uma negação/erro real
de aprovação de exec não tenta novamente silenciosamente como uma aprovação de Plugin.

### Entrega nativa de aprovação

Alguns canais também podem atuar como clientes de aprovação nativos. Clientes nativos adicionam DMs de aprovadores, fanout do chat de origem e UX de aprovação interativa específica do canal sobre o fluxo compartilhado `/approve` no mesmo chat.

Quando cartões/botões de aprovação nativos estiverem disponíveis, essa UI nativa é o caminho principal voltado ao agente. O agente também não deve ecoar um comando simples duplicado de chat `/approve`, a menos que o resultado da ferramenta diga que aprovações por chat estão indisponíveis ou que a aprovação manual é o único caminho restante.

Se um cliente de aprovação nativo estiver configurado, mas nenhum runtime nativo estiver ativo para o canal de origem, o OpenClaw mantém visível o prompt determinístico local `/approve`. Se o runtime nativo estiver ativo e tentar a entrega, mas nenhum alvo receber o cartão, o OpenClaw envia um aviso de fallback no mesmo chat com o comando exato `/approve <id> <decision>` para que a solicitação ainda possa ser resolvida.

Modelo genérico:

- a política de exec do host ainda decide se a aprovação de exec é necessária
- `approvals.exec` controla o encaminhamento de prompts de aprovação para outros destinos de chat
- `channels.<channel>.execApprovals` controla se esse canal atua como um cliente de aprovação nativo

Clientes de aprovação nativos habilitam automaticamente a entrega primeiro por DM quando todas estas condições são verdadeiras:

- o canal oferece suporte à entrega de aprovação nativa
- aprovadores podem ser resolvidos a partir de `execApprovals.approvers` explícito ou da identidade do proprietário, como `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` não está definido ou é `"auto"`

Defina `enabled: false` para desabilitar explicitamente um cliente de aprovação nativo. Defina `enabled: true` para forçá-lo quando aprovadores forem resolvidos. A entrega pública no chat de origem permanece explícita por meio de `channels.<channel>.execApprovals.target`.

FAQ: [Por que há duas configurações de aprovação de exec para aprovações por chat?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Esses clientes de aprovação nativos adicionam roteamento por DM e fanout opcional de canal sobre o fluxo compartilhado `/approve` no mesmo chat e os botões de aprovação compartilhados.

Comportamento compartilhado:

- Slack, Matrix, Microsoft Teams e chats entregáveis semelhantes usam o modelo normal de autenticação do canal para `/approve` no mesmo chat
- quando um cliente de aprovação nativo é habilitado automaticamente, o alvo padrão de entrega nativa são DMs de aprovadores
- para Discord e Telegram, somente aprovadores resolvidos podem aprovar ou negar
- aprovadores do Discord podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- aprovadores do Telegram podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- aprovadores do Slack podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- botões nativos do Slack preservam o tipo do id de aprovação, então ids `plugin:` podem resolver aprovações de Plugin sem uma segunda camada de fallback local ao Slack
- roteamento nativo por DM/canal e atalhos de reação do Matrix lidam com aprovações de exec e de Plugin; a autorização de Plugin ainda vem de `channels.matrix.dm.allowFrom`
- prompts nativos do Matrix incluem conteúdo de evento personalizado `com.openclaw.approval` no primeiro evento de prompt, para que clientes Matrix compatíveis com OpenClaw possam ler o estado estruturado de aprovação enquanto clientes padrão mantêm o fallback em texto simples `/approve`
- o solicitante não precisa ser um aprovador
- o chat de origem pode aprovar diretamente com `/approve` quando esse chat já oferece suporte a comandos e respostas
- botões de aprovação nativos do Discord roteiam pelo tipo do id de aprovação: ids `plugin:` vão direto para aprovações de Plugin, todo o restante vai para aprovações de exec
- botões de aprovação nativos do Telegram seguem o mesmo fallback delimitado de exec para Plugin que `/approve`
- quando `target` nativo habilita a entrega no chat de origem, os prompts de aprovação incluem o texto do comando
- aprovações de exec pendentes expiram após 30 minutos por padrão
- se nenhuma UI de operador ou cliente de aprovação configurado puder aceitar a solicitação, o prompt recorre a `askFallback`

Comandos sensíveis de grupo somente para proprietários, como `/diagnostics` e `/export-trajectory`, usam roteamento privado do proprietário para prompts de aprovação e resultados finais. O OpenClaw primeiro tenta uma rota privada na mesma superfície em que o proprietário executou o comando. Se essa superfície não tiver uma rota privada do proprietário, ele recorre à primeira rota disponível do proprietário em `commands.ownerAllowFrom`, de modo que um comando de grupo do Discord ainda possa enviar a aprovação e o resultado para a DM do Telegram do proprietário quando o Telegram for a interface privada primária configurada. O chat de grupo recebe apenas uma breve confirmação.

O Telegram usa DMs de aprovadores por padrão (`target: "dm"`). Você pode mudar para `channel` ou `both` quando quiser que os prompts de aprovação também apareçam no chat/tópico de origem do Telegram. Para tópicos de fórum do Telegram, o OpenClaw preserva o tópico para o prompt de aprovação e o acompanhamento pós-aprovação.

Veja:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### fluxo IPC do macOS
__OC_I18N_900004__
Observações de segurança:

- Modo do socket Unix `0600`, token armazenado em `exec-approvals.json`.
- Verificação de par com o mesmo UID.
- Desafio/resposta (nonce + token HMAC + hash da solicitação) + TTL curto.

## Relacionado

- [Aprovações de exec](/pt-BR/tools/exec-approvals) — política principal e fluxo de aprovação
- [Ferramenta exec](/pt-BR/tools/exec)
- [Modo elevado](/pt-BR/tools/elevated)
- [Skills](/pt-BR/tools/skills) — comportamento de permissão automática respaldado por Skills
