---
read_when:
    - Configurando bins seguros ou perfis personalizados de bin seguro
    - Encaminhamento de aprovações para Slack/Discord/Telegram ou outros canais de conversa
    - Implementando um cliente de aprovação nativo para um canal
summary: 'Aprovações avançadas de exec: bins seguros, vinculação de interpretador, encaminhamento de aprovações, entrega nativa'
title: Aprovações de execução — avançado
x-i18n:
    generated_at: "2026-04-30T10:11:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: de8a72ca1d23e55dc198ae3c5ad55a57660c2111feebfb89f08d8fa9584e4337
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Tópicos avançados de aprovação de exec: o caminho rápido `safeBins`, vinculação de intérprete/runtime
e encaminhamento de aprovação para canais de chat (incluindo entrega nativa).
Para a política central e o fluxo de aprovação, consulte [Aprovações de exec](/pt-BR/tools/exec-approvals).

## Bins seguros (somente stdin)

`tools.exec.safeBins` define uma pequena lista de binários **somente stdin** (por
exemplo `cut`) que podem ser executados em modo de lista de permissões **sem** entradas
explícitas de lista de permissões. Bins seguros rejeitam argumentos posicionais de arquivo e tokens parecidos com caminhos, de modo que
só podem operar sobre o fluxo de entrada. Trate isso como um caminho rápido restrito para
filtros de fluxo, não como uma lista geral de confiança.

<Warning>
**Não** adicione binários de intérprete ou runtime (por exemplo `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) a `safeBins`. Se um comando pode avaliar código,
executar subcomandos ou ler arquivos por design, prefira entradas explícitas de lista de permissões
e mantenha as solicitações de aprovação ativadas. Bins seguros personalizados devem definir um
perfil explícito em `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Bins seguros padrão:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` e `sort` não estão na lista padrão. Se você optar por incluí-los, mantenha entradas
explícitas de lista de permissões para seus fluxos de trabalho que não usam stdin. Para `grep` no modo de bin seguro,
forneça o padrão com `-e`/`--regexp`; a forma de padrão posicional é rejeitada
para que operandos de arquivo não possam ser introduzidos como posicionais ambíguos.

### Validação de argv e flags negadas

A validação é determinística apenas a partir do formato de argv (sem verificações de existência no sistema de arquivos do host),
o que impede comportamento de oráculo de existência de arquivo a partir de diferenças
entre permitir/negar. Opções orientadas a arquivo são negadas para bins seguros padrão; opções
longas são validadas em modo fail-closed (flags desconhecidas e abreviações ambíguas são
rejeitadas).

Flags negadas por perfil de bin seguro:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Bins seguros também forçam tokens de argv a serem tratados como **texto literal** no momento da execução
(sem globbing e sem expansão de `$VARS`) para segmentos somente stdin, de modo que padrões
como `*` ou `$HOME/...` não possam ser usados para introduzir leituras de arquivo.

### Diretórios de binários confiáveis

Bins seguros devem ser resolvidos a partir de diretórios de binários confiáveis (padrões do sistema mais
`tools.exec.safeBinTrustedDirs` opcional). Entradas de `PATH` nunca são automaticamente confiáveis.
Os diretórios confiáveis padrão são intencionalmente mínimos: `/bin`, `/usr/bin`. Se
seu executável de bin seguro estiver em caminhos de gerenciador de pacotes/usuário (por exemplo
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), adicione-os
explicitamente a `tools.exec.safeBinTrustedDirs`.

### Encadeamento de shell, wrappers e multiplexadores

Encadeamento de shell (`&&`, `||`, `;`) é permitido quando todo segmento de nível superior
satisfaz a lista de permissões (incluindo bins seguros ou permissão automática de skill). Redirecionamentos
permanecem sem suporte no modo de lista de permissões. Substituição de comando (`$()` / crases) é
rejeitada durante a análise da lista de permissões, inclusive dentro de aspas duplas; use aspas simples
se você precisar de texto literal `$()`.

Em aprovações do app complementar no macOS, texto bruto de shell contendo controle de shell ou
sintaxe de expansão (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) é
tratado como uma falha de lista de permissões, a menos que o próprio binário de shell esteja na lista de permissões.

Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), sobrescritas de env com escopo de solicitação são
reduzidas a uma pequena lista de permissões explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Para decisões `allow-always` no modo de lista de permissões, wrappers de despacho conhecidos (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) persistem o caminho do executável interno em vez
do caminho do wrapper. Multiplexadores de shell (`busybox`, `toybox`) são desempacotados para
applets de shell (`sh`, `ash` etc.) da mesma forma. Se um wrapper ou multiplexador
não puder ser desempacotado com segurança, nenhuma entrada de lista de permissões será persistida automaticamente.

Se você colocar intérpretes como `python3` ou `node` na lista de permissões, prefira
`tools.exec.strictInlineEval=true` para que eval inline ainda exija uma aprovação
explícita. No modo estrito, `allow-always` ainda pode persistir invocações benignas de
intérprete/script, mas transportadores de eval inline não são persistidos
automaticamente.

### Bins seguros versus lista de permissões

| Tópico           | `tools.exec.safeBins`                                  | Lista de permissões (`exec-approvals.json`)                                        |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Objetivo         | Permitir automaticamente filtros stdin restritos       | Confiar explicitamente em executáveis específicos                                  |
| Tipo de correspondência | Nome do executável + política de argv de bin seguro | Glob de caminho de executável resolvido, ou glob de nome de comando simples para comandos invocados via PATH |
| Escopo de argumentos | Restrito pelo perfil de bin seguro e regras de token literal | Apenas correspondência de caminho; os argumentos são sua responsabilidade caso contrário |
| Exemplos típicos | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLIs personalizadas                             |
| Melhor uso       | Transformações de texto de baixo risco em pipelines   | Qualquer ferramenta com comportamento ou efeitos colaterais mais amplos            |

Local da configuração:

- `safeBins` vem da configuração (`tools.exec.safeBins` ou `agents.list[].tools.exec.safeBins` por agente).
- `safeBinTrustedDirs` vem da configuração (`tools.exec.safeBinTrustedDirs` ou `agents.list[].tools.exec.safeBinTrustedDirs` por agente).
- `safeBinProfiles` vem da configuração (`tools.exec.safeBinProfiles` ou `agents.list[].tools.exec.safeBinProfiles` por agente). Chaves de perfil por agente sobrescrevem chaves globais.
- entradas de lista de permissões ficam em `~/.openclaw/exec-approvals.json` local do host sob `agents.<id>.allowlist` (ou via Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` avisa com `tools.exec.safe_bins_interpreter_unprofiled` quando bins de intérprete/runtime aparecem em `safeBins` sem perfis explícitos.
- `openclaw doctor --fix` pode criar entradas ausentes personalizadas de `safeBinProfiles.<bin>` como `{}` (revise e restrinja depois). Bins de intérprete/runtime não são criados automaticamente.

Exemplo de perfil personalizado:
__OC_I18N_900000__
Se você optar explicitamente por incluir `jq` em `safeBins`, o OpenClaw ainda rejeita o builtin `env` no modo de bin seguro
para que `jq -n env` não possa despejar o ambiente do processo host sem um caminho explícito de lista de permissões
ou solicitação de aprovação.

## Comandos de intérprete/runtime

Execuções de intérprete/runtime respaldadas por aprovação são intencionalmente conservadoras:

- O contexto exato de argv/cwd/env é sempre vinculado.
- Formas diretas de script de shell e de arquivo de runtime direto são vinculadas, em melhor esforço, a um snapshot concreto de um arquivo local.
- Formas comuns de wrapper de gerenciador de pacotes que ainda resolvem para um arquivo local direto (por exemplo
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) são desempacotadas antes da vinculação.
- Se o OpenClaw não conseguir identificar exatamente um arquivo local concreto para um comando de intérprete/runtime
  (por exemplo scripts de pacote, formas eval, cadeias de loader específicas de runtime ou formas multiarquivo ambíguas),
  a execução respaldada por aprovação é negada em vez de alegar uma cobertura semântica que ela não tem.
- Para esses fluxos de trabalho, prefira sandboxing, um limite de host separado ou uma lista de permissões/fluxo de trabalho completo explicitamente confiável em que o operador aceite a semântica mais ampla do runtime.

Quando aprovações são exigidas, a ferramenta exec retorna imediatamente com um id de aprovação. Use esse id para
correlacionar eventos de sistema posteriores (`Exec finished` / `Exec denied`). Se nenhuma decisão chegar antes do
timeout, a solicitação é tratada como um timeout de aprovação e exposta como um motivo de negação.

### Comportamento de entrega de follow-up

Depois que uma execução assíncrona aprovada termina, o OpenClaw envia um turno `agent` de follow-up para a mesma sessão.

- Se existir um alvo de entrega externo válido (canal entregável mais alvo `to`), a entrega de follow-up usa esse canal.
- Em fluxos somente de webchat ou de sessão interna sem alvo externo, a entrega de follow-up permanece somente na sessão (`deliver: false`).
- Se um chamador solicitar explicitamente entrega externa estrita sem canal externo resolvível, a solicitação falha com `INVALID_REQUEST`.
- Se `bestEffortDeliver` estiver ativado e nenhum canal externo puder ser resolvido, a entrega é rebaixada para somente sessão em vez de falhar.

## Encaminhamento de aprovação para canais de chat

Você pode encaminhar solicitações de aprovação de exec para qualquer canal de chat (incluindo canais de plugin) e aprová-las
com `/approve`. Isso usa o pipeline normal de entrega de saída.

Configuração:
__OC_I18N_900001__
Responda no chat:
__OC_I18N_900002__
O comando `/approve` lida tanto com aprovações de exec quanto com aprovações de plugin. Se o ID não corresponder a uma aprovação de exec pendente, ele verifica automaticamente aprovações de plugin em seguida.

### Encaminhamento de aprovação de plugin

O encaminhamento de aprovação de plugin usa o mesmo pipeline de entrega que as aprovações de exec, mas tem sua própria
configuração independente em `approvals.plugin`. Ativar ou desativar um não afeta o outro.
__OC_I18N_900003__
O formato da configuração é idêntico a `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` e `targets` funcionam da mesma forma.

Canais compatíveis com respostas interativas compartilhadas renderizam os mesmos botões de aprovação para aprovações de exec e
plugin. Canais sem UI interativa compartilhada recorrem a texto simples com instruções de `/approve`.

### Aprovações no mesmo chat em qualquer canal

Quando uma solicitação de aprovação de exec ou plugin se origina de uma superfície de chat entregável, o mesmo chat
agora pode aprová-la com `/approve` por padrão. Isso se aplica a canais como Slack, Matrix e
Microsoft Teams, além dos fluxos existentes de Web UI e UI de terminal.

Esse caminho de comando de texto compartilhado usa o modelo normal de autenticação do canal para essa conversa. Se o
chat de origem já puder enviar comandos e receber respostas, solicitações de aprovação não precisam mais de um
adaptador de entrega nativa separado apenas para permanecerem pendentes.

Discord e Telegram também oferecem suporte a `/approve` no mesmo chat, mas esses canais ainda usam sua
lista de aprovadores resolvida para autorização, mesmo quando a entrega nativa de aprovação está desativada.

Para Telegram e outros clientes nativos de aprovação que chamam o Gateway diretamente,
esse fallback é intencionalmente limitado a falhas de "aprovação não encontrada". Uma negação/erro real
de aprovação de exec não tenta novamente silenciosamente como uma aprovação de plugin.

### Entrega nativa de aprovação

Alguns canais também podem atuar como clientes nativos de aprovação. Clientes nativos adicionam DMs para aprovadores, fanout para o chat de origem
e UX de aprovação interativa específica do canal sobre o fluxo compartilhado de `/approve` no mesmo chat.

Quando cartões/botões de aprovação nativos estão disponíveis, essa UI nativa é o caminho principal voltado ao agente. O agente também não deve repetir um comando simples duplicado de chat `/approve`, a menos que o resultado da ferramenta diga que aprovações por chat estão indisponíveis ou que a aprovação manual é o único caminho restante.

Se um cliente de aprovação nativo estiver configurado, mas nenhum runtime nativo estiver ativo para o canal de origem, o OpenClaw mantém o prompt local determinístico `/approve` visível. Se o runtime nativo estiver ativo e tentar a entrega, mas nenhum destino receber o cartão, o OpenClaw enviará um aviso de fallback no mesmo chat com o comando exato `/approve <id> <decision>` para que a solicitação ainda possa ser resolvida.

Modelo genérico:

- a política de execução do host ainda decide se a aprovação de exec é obrigatória
- `approvals.exec` controla o encaminhamento de prompts de aprovação para outros destinos de chat
- `channels.<channel>.execApprovals` controla se esse canal atua como um cliente de aprovação nativo

Clientes de aprovação nativos habilitam automaticamente a entrega primeiro por DM quando todos estes itens são verdadeiros:

- o canal é compatível com entrega de aprovação nativa
- os aprovadores podem ser resolvidos a partir de `execApprovals.approvers` explícito ou de identidade do proprietário, como `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` não está definido ou é `"auto"`

Defina `enabled: false` para desabilitar explicitamente um cliente de aprovação nativo. Defina `enabled: true` para forçá-lo a ficar ativo quando os aprovadores forem resolvidos. A entrega no chat público de origem continua explícita por meio de `channels.<channel>.execApprovals.target`.

FAQ: [Por que há duas configurações de aprovação de exec para aprovações por chat?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Esses clientes de aprovação nativos adicionam roteamento por DM e fanout opcional de canal sobre o fluxo compartilhado `/approve` no mesmo chat e os botões de aprovação compartilhados.

Comportamento compartilhado:

- Slack, Matrix, Microsoft Teams e chats entregáveis similares usam o modelo normal de autenticação do canal para `/approve` no mesmo chat
- quando um cliente de aprovação nativo é habilitado automaticamente, o destino padrão de entrega nativa são DMs dos aprovadores
- para Discord e Telegram, somente aprovadores resolvidos podem aprovar ou negar
- aprovadores do Discord podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- aprovadores do Telegram podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- aprovadores do Slack podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- os botões nativos do Slack preservam o tipo de id da aprovação, então ids `plugin:` podem resolver aprovações de plugin sem uma segunda camada de fallback local do Slack
- o roteamento nativo por DM/canal do Matrix e os atalhos por reação lidam com aprovações de exec e de plugin; a autorização de plugin ainda vem de `channels.matrix.dm.allowFrom`
- prompts nativos do Matrix incluem conteúdo de evento personalizado `com.openclaw.approval` no primeiro evento de prompt, para que clientes Matrix cientes do OpenClaw possam ler o estado estruturado da aprovação enquanto clientes padrão mantêm o fallback em texto simples `/approve`
- o solicitante não precisa ser um aprovador
- o chat de origem pode aprovar diretamente com `/approve` quando esse chat já é compatível com comandos e respostas
- botões nativos de aprovação do Discord roteiam pelo tipo de id da aprovação: ids `plugin:` vão direto para aprovações de plugin, todo o restante vai para aprovações de exec
- botões nativos de aprovação do Telegram seguem o mesmo fallback delimitado de exec para plugin que `/approve`
- quando `target` nativo habilita a entrega no chat de origem, os prompts de aprovação incluem o texto do comando
- aprovações de exec pendentes expiram após 30 minutos por padrão
- se nenhuma UI de operador ou cliente de aprovação configurado puder aceitar a solicitação, o prompt recorre a `askFallback`

Comandos sensíveis de grupo exclusivos do proprietário, como `/diagnostics` e `/export-trajectory`, usam roteamento privado do proprietário para prompts de aprovação e resultados finais. O OpenClaw primeiro tenta uma rota privada na mesma superfície em que o proprietário executou o comando. Se essa superfície não tiver uma rota privada do proprietário, ele recorre à primeira rota de proprietário disponível em `commands.ownerAllowFrom`, para que um comando de grupo no Discord ainda possa enviar a aprovação e o resultado para a DM do Telegram do proprietário quando o Telegram for a interface privada principal configurada. O chat de grupo recebe apenas um breve reconhecimento.

O Telegram usa DMs de aprovadores por padrão (`target: "dm"`). Você pode mudar para `channel` ou `both` quando quiser que os prompts de aprovação também apareçam no chat/tópico de origem do Telegram. Para tópicos de fórum do Telegram, o OpenClaw preserva o tópico para o prompt de aprovação e o acompanhamento pós-aprovação.

Consulte:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Fluxo IPC do macOS
__OC_I18N_900004__
Notas de segurança:

- modo de socket Unix `0600`, token armazenado em `exec-approvals.json`.
- Verificação de par com o mesmo UID.
- Desafio/resposta (nonce + token HMAC + hash da solicitação) + TTL curto.

## Relacionado

- [Aprovações de exec](/pt-BR/tools/exec-approvals) — política principal e fluxo de aprovação
- [Ferramenta Exec](/pt-BR/tools/exec)
- [Modo elevado](/pt-BR/tools/elevated)
- [Skills](/pt-BR/tools/skills) — comportamento de permissão automática baseado em skill
