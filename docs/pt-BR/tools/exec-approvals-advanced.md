---
read_when:
    - Configuração de bins seguros ou perfis personalizados de bins seguros
    - Encaminhamento de aprovações para Slack/Discord/Telegram ou outros canais de chat
    - Implementando um cliente de aprovação nativo para um canal
summary: 'Aprovações avançadas de exec: binários seguros, vinculação de intérprete, encaminhamento de aprovação, entrega nativa'
title: Aprovações de execução — avançadas
x-i18n:
    generated_at: "2026-05-06T09:16:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ffef41ccb6018c5d38e153d015e979d43a6fafbe37a4377c3fcb7c6f212186c
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Tópicos avançados de aprovação de exec: o caminho rápido `safeBins`, vinculação de interpretador/runtime
e encaminhamento de aprovações para canais de chat (incluindo entrega nativa).
Para a política principal e o fluxo de aprovação, consulte [Aprovações de exec](/pt-BR/tools/exec-approvals).

## Bins seguros (somente stdin)

`tools.exec.safeBins` define uma pequena lista de binários **somente stdin** (por
exemplo, `cut`) que podem ser executados no modo de allowlist **sem** entradas
explícitas de allowlist. Bins seguros rejeitam argumentos posicionais de arquivo
e tokens semelhantes a caminhos, portanto só podem operar sobre o fluxo de entrada.
Trate isso como um caminho rápido restrito para filtros de fluxo, não como uma
lista geral de confiança.

<Warning>
**Não** adicione binários de interpretador ou runtime (por exemplo, `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) a `safeBins`. Se um comando pode avaliar código,
executar subcomandos ou ler arquivos por design, prefira entradas explícitas de
allowlist e mantenha os prompts de aprovação habilitados. Bins seguros customizados
devem definir um perfil explícito em `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Bins seguros padrão:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` e `sort` não estão na lista padrão. Se você optar por incluí-los, mantenha
entradas explícitas de allowlist para seus fluxos de trabalho que não usam stdin.
Para `grep` no modo de bin seguro, forneça o padrão com `-e`/`--regexp`; a forma
de padrão posicional é rejeitada para que operandos de arquivo não possam ser
contrabandeados como posicionais ambíguos.

### Validação de argv e flags negadas

A validação é determinística apenas a partir do formato do argv (sem verificações
de existência no sistema de arquivos do host), o que impede comportamento de
oráculo de existência de arquivo a partir de diferenças entre permitir/negar.
Opções orientadas a arquivos são negadas para bins seguros padrão; opções longas
são validadas em fail-closed (flags desconhecidas e abreviações ambíguas são
rejeitadas).

Flags negadas por perfil de bin seguro:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Bins seguros também forçam tokens argv a serem tratados como **texto literal** no
momento da execução (sem globbing e sem expansão de `$VARS`) para segmentos
somente stdin, de modo que padrões como `*` ou `$HOME/...` não possam ser usados
para contrabandear leituras de arquivo.

### Diretórios de binários confiáveis

Bins seguros devem resolver a partir de diretórios de binários confiáveis (padrões
do sistema mais `tools.exec.safeBinTrustedDirs` opcional). Entradas de `PATH` nunca
são confiáveis automaticamente. Os diretórios confiáveis padrão são intencionalmente
mínimos: `/bin`, `/usr/bin`. Se o executável de bin seguro estiver em caminhos de
gerenciador de pacotes/usuário (por exemplo, `/opt/homebrew/bin`, `/usr/local/bin`,
`/opt/local/bin`, `/snap/bin`), adicione-os explicitamente a
`tools.exec.safeBinTrustedDirs`.

### Encadeamento de shell, wrappers e multiplexadores

Encadeamento de shell (`&&`, `||`, `;`) é permitido quando cada segmento de nível
superior satisfaz a allowlist (incluindo bins seguros ou permissão automática de
Skills). Redirecionamentos continuam sem suporte no modo de allowlist. Substituição
de comando (`$()` / crases) é rejeitada durante a análise da allowlist, inclusive
dentro de aspas duplas; use aspas simples se precisar de texto literal `$()`.

Em aprovações do app companheiro no macOS, texto shell bruto que contém sintaxe de
controle ou expansão de shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`)
é tratado como uma falha de allowlist, a menos que o próprio binário do shell esteja
na allowlist.

Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), substituições de env com escopo
de requisição são reduzidas a uma pequena allowlist explícita (`TERM`, `LANG`,
`LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

Para decisões `allow-always` no modo de allowlist, wrappers de despacho conhecidos
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem o caminho do executável
interno em vez do caminho do wrapper. Multiplexadores de shell (`busybox`, `toybox`)
são desembrulhados para applets de shell (`sh`, `ash` etc.) da mesma forma. Se um
wrapper ou multiplexador não puder ser desembrulhado com segurança, nenhuma entrada
de allowlist será persistida automaticamente.

Se você colocar interpretadores como `python3` ou `node` na allowlist, prefira
`tools.exec.strictInlineEval=true` para que eval inline ainda exija uma aprovação
explícita. No modo estrito, `allow-always` ainda pode persistir invocações benignas
de interpretador/script, mas transportadores de eval inline não são persistidos
automaticamente.

### Bins seguros versus allowlist

| Tópico           | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Objetivo         | Permitir automaticamente filtros stdin restritos       | Confiar explicitamente em executáveis específicos                                  |
| Tipo de correspondência | Nome do executável + política argv de bin seguro | Glob de caminho resolvido do executável, ou glob de nome de comando simples para comandos invocados por PATH |
| Escopo de argumentos | Restrito pelo perfil de bin seguro e regras de token literal | Correspondência de caminho por padrão; `argPattern` opcional pode restringir argv analisado |
| Exemplos típicos | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLIs customizadas                               |
| Melhor uso       | Transformações de texto de baixo risco em pipelines   | Qualquer ferramenta com comportamento mais amplo ou efeitos colaterais             |

Local da configuração:

- `safeBins` vem da configuração (`tools.exec.safeBins` ou `agents.list[].tools.exec.safeBins` por agente).
- `safeBinTrustedDirs` vem da configuração (`tools.exec.safeBinTrustedDirs` ou `agents.list[].tools.exec.safeBinTrustedDirs` por agente).
- `safeBinProfiles` vem da configuração (`tools.exec.safeBinProfiles` ou `agents.list[].tools.exec.safeBinProfiles` por agente). Chaves de perfil por agente substituem chaves globais.
- Entradas de allowlist ficam em `~/.openclaw/exec-approvals.json` local do host, em `agents.<id>.allowlist` (ou via Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` avisa com `tools.exec.safe_bins_interpreter_unprofiled` quando bins de interpretador/runtime aparecem em `safeBins` sem perfis explícitos.
- `openclaw doctor --fix` pode criar o esqueleto de entradas customizadas ausentes de `safeBinProfiles.<bin>` como `{}` (revise e restrinja depois). Bins de interpretador/runtime não são criados automaticamente.

Exemplo de perfil customizado:
__OC_I18N_900000__
Se você optar explicitamente por incluir `jq` em `safeBins`, o OpenClaw ainda rejeita o builtin `env` no modo de bin seguro, de modo que `jq -n env` não possa despejar o ambiente do processo host sem um caminho explícito de allowlist ou prompt de aprovação.

## Comandos de interpretador/runtime

Execuções de interpretador/runtime respaldadas por aprovação são intencionalmente conservadoras:

- O contexto exato de argv/cwd/env sempre é vinculado.
- Formas diretas de script shell e arquivo direto de runtime são vinculadas, em melhor esforço, a um snapshot concreto de um arquivo local.
- Formas comuns de wrapper de gerenciador de pacotes que ainda resolvem para um arquivo local direto (por exemplo, `pnpm exec`, `pnpm node`, `npm exec`, `npx`) são desembrulhadas antes da vinculação.
- Se o OpenClaw não puder identificar exatamente um arquivo local concreto para um comando de interpretador/runtime (por exemplo, scripts de pacote, formas eval, cadeias de loader específicas de runtime ou formas ambíguas de múltiplos arquivos), a execução respaldada por aprovação é negada em vez de alegar cobertura semântica que ela não tem.
- Para esses fluxos de trabalho, prefira sandboxing, um limite de host separado ou uma allowlist/fluxo de trabalho completo explicitamente confiável em que o operador aceite a semântica de runtime mais ampla.

Quando aprovações são necessárias, a ferramenta exec retorna imediatamente com um ID de aprovação. Use esse ID para correlacionar eventos posteriores do sistema (`Exec finished` / `Exec denied`). Se nenhuma decisão chegar antes do timeout, a requisição é tratada como timeout de aprovação e exibida como motivo de negação.

### Comportamento de entrega de follow-up

Depois que um exec assíncrono aprovado termina, o OpenClaw envia um turno `agent` de follow-up para a mesma sessão.

- Se existir um alvo externo válido de entrega (canal entregável mais alvo `to`), a entrega de follow-up usa esse canal.
- Em fluxos somente webchat ou de sessão interna sem alvo externo, a entrega de follow-up permanece apenas na sessão (`deliver: false`).
- Se um chamador solicitar explicitamente entrega externa estrita sem nenhum canal externo resolvível, a requisição falha com `INVALID_REQUEST`.
- Se `bestEffortDeliver` estiver habilitado e nenhum canal externo puder ser resolvido, a entrega é rebaixada para apenas sessão em vez de falhar.

## Encaminhamento de aprovações para canais de chat

Você pode encaminhar prompts de aprovação de exec para qualquer canal de chat (incluindo canais de plugin) e aprová-los com `/approve`. Isso usa o pipeline normal de entrega de saída.

Configuração:
__OC_I18N_900001__
Responda no chat:
__OC_I18N_900002__
O comando `/approve` trata aprovações de exec e aprovações de plugin. Se o ID não corresponder a uma aprovação de exec pendente, ele verifica automaticamente as aprovações de plugin em seguida.

### Encaminhamento de aprovação de Plugin

O encaminhamento de aprovação de Plugin usa o mesmo pipeline de entrega que aprovações de exec, mas tem sua própria configuração independente em `approvals.plugin`. Habilitar ou desabilitar um não afeta o outro.
__OC_I18N_900003__
O formato da configuração é idêntico a `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` e `targets` funcionam da mesma forma.

Canais compatíveis com respostas interativas compartilhadas renderizam os mesmos botões de aprovação para aprovações de exec e de plugin. Canais sem UI interativa compartilhada recorrem a texto simples com instruções de `/approve`.

### Aprovações no mesmo chat em qualquer canal

Quando uma requisição de aprovação de exec ou plugin se origina de uma superfície de chat entregável, o mesmo chat agora pode aprová-la com `/approve` por padrão. Isso se aplica a canais como Slack, Matrix e Microsoft Teams, além dos fluxos existentes de Web UI e UI de terminal.

Esse caminho compartilhado de comando de texto usa o modelo normal de autenticação do canal para essa conversa. Se o chat de origem já pode enviar comandos e receber respostas, as requisições de aprovação não precisam mais de um adaptador separado de entrega nativa apenas para permanecerem pendentes.

Discord e Telegram também são compatíveis com `/approve` no mesmo chat, mas esses canais ainda usam sua lista resolvida de aprovadores para autorização mesmo quando a entrega nativa de aprovação está desabilitada.

Para Telegram e outros clientes nativos de aprovação que chamam o Gateway diretamente,
esse fallback é intencionalmente limitado a falhas de "aprovação não encontrada". Uma
negação/erro real de aprovação de exec não tenta novamente silenciosamente como uma aprovação de plugin.

### Entrega nativa de aprovação

Alguns canais também podem atuar como clientes nativos de aprovação. Clientes nativos adicionam DMs para aprovadores, distribuição para o chat de origem e UX interativa de aprovação específica do canal sobre o fluxo compartilhado de `/approve` no mesmo chat.

Quando cartões/botões de aprovação nativos estão disponíveis, essa interface nativa é o caminho principal voltado ao agente. O agente também não deve repetir um comando `/approve` simples duplicado no bate-papo, a menos que o resultado da ferramenta diga que aprovações por bate-papo estão indisponíveis ou que a aprovação manual é o único caminho restante.

Se um cliente de aprovação nativo estiver configurado, mas nenhum ambiente de execução nativo estiver ativo para o canal de origem, o OpenClaw mantém o prompt local determinístico `/approve` visível. Se o ambiente de execução nativo estiver ativo e tentar a entrega, mas nenhum destino receber o cartão, o OpenClaw envia um aviso de fallback no mesmo bate-papo com o comando exato `/approve <id> <decision>` para que a solicitação ainda possa ser resolvida.

Modelo genérico:

- a política de execução do host ainda decide se a aprovação de execução é necessária
- `approvals.exec` controla o encaminhamento de prompts de aprovação para outros destinos de bate-papo
- `channels.<channel>.execApprovals` controla se esse canal atua como um cliente de aprovação nativo

Clientes de aprovação nativos habilitam automaticamente a entrega por mensagem direta primeiro quando tudo isto é verdadeiro:

- o canal oferece suporte à entrega de aprovação nativa
- os aprovadores podem ser resolvidos a partir de `execApprovals.approvers` explícitos ou da identidade do proprietário, como `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` não está definido ou é `"auto"`

Defina `enabled: false` para desabilitar explicitamente um cliente de aprovação nativo. Defina `enabled: true` para forçá-lo a ficar ativo quando os aprovadores forem resolvidos. A entrega no bate-papo público de origem permanece explícita por meio de `channels.<channel>.execApprovals.target`.

Perguntas frequentes: [Por que há duas configurações de aprovação de execução para aprovações por bate-papo?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Esses clientes de aprovação nativos adicionam roteamento por mensagem direta e distribuição opcional para canal sobre o fluxo compartilhado `/approve` no mesmo bate-papo e os botões de aprovação compartilhados.

Comportamento compartilhado:

- Slack, Matrix, Microsoft Teams e bate-papos entregáveis semelhantes usam o modelo normal de autenticação do canal para `/approve` no mesmo bate-papo
- quando um cliente de aprovação nativo é habilitado automaticamente, o destino padrão da entrega nativa são as mensagens diretas dos aprovadores
- para Discord e Telegram, somente aprovadores resolvidos podem aprovar ou negar
- aprovadores do Discord podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- aprovadores do Telegram podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- aprovadores do Slack podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- botões nativos do Slack preservam o tipo de id de aprovação, portanto ids `plugin:` podem resolver aprovações de Plugin sem uma segunda camada de fallback local do Slack
- roteamento nativo de mensagem direta/canal do Matrix e atalhos de reação lidam com aprovações de execução e de Plugin; a autorização de Plugin ainda vem de `channels.matrix.dm.allowFrom`
- prompts nativos do Matrix incluem conteúdo de evento personalizado `com.openclaw.approval` no primeiro evento de prompt para que clientes Matrix cientes do OpenClaw possam ler o estado estruturado de aprovação, enquanto clientes padrão mantêm o fallback `/approve` em texto simples
- o solicitante não precisa ser um aprovador
- o bate-papo de origem pode aprovar diretamente com `/approve` quando esse bate-papo já oferece suporte a comandos e respostas
- botões de aprovação nativos do Discord roteiam pelo tipo de id de aprovação: ids `plugin:` vão direto para aprovações de Plugin, todo o restante vai para aprovações de execução
- botões de aprovação nativos do Telegram seguem o mesmo fallback limitado de execução para Plugin que `/approve`
- quando `target` nativo habilita a entrega no bate-papo de origem, os prompts de aprovação incluem o texto do comando
- aprovações de execução pendentes expiram após 30 minutos por padrão
- se nenhuma interface de operador ou cliente de aprovação configurado puder aceitar a solicitação, o prompt recorre a `askFallback`

Comandos confidenciais de grupo somente para o proprietário, como `/diagnostics` e `/export-trajectory`, usam roteamento privado do proprietário para prompts de aprovação e resultados finais. O OpenClaw primeiro tenta uma rota privada na mesma superfície em que o proprietário executou o comando. Se essa superfície não tiver nenhuma rota privada do proprietário, ele recorre à primeira rota de proprietário disponível em `commands.ownerAllowFrom`, de modo que um comando de grupo no Discord ainda possa enviar a aprovação e o resultado para a mensagem direta do proprietário no Telegram quando o Telegram for a interface privada primária configurada. O bate-papo em grupo recebe apenas um breve reconhecimento.

O Telegram usa mensagens diretas dos aprovadores por padrão (`target: "dm"`). Você pode mudar para `channel` ou `both` quando quiser que os prompts de aprovação também apareçam no bate-papo/tópico de origem do Telegram. Para tópicos de fórum do Telegram, o OpenClaw preserva o tópico para o prompt de aprovação e o acompanhamento pós-aprovação.

Veja:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Fluxo de IPC no macOS
__OC_I18N_900004__
Notas de segurança:

- Modo de soquete Unix `0600`, token armazenado em `exec-approvals.json`.
- Verificação de par com o mesmo UID.
- Desafio/resposta (nonce + token HMAC + hash da solicitação) + TTL curto.

## Relacionados

- [Aprovações de execução](/pt-BR/tools/exec-approvals) — política central e fluxo de aprovação
- [Ferramenta Exec](/pt-BR/tools/exec)
- [Modo elevado](/pt-BR/tools/elevated)
- [Skills](/pt-BR/tools/skills) — comportamento de permissão automática respaldado por Skills
