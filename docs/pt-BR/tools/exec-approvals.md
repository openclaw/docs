---
read_when:
    - Configurando aprovações de exec ou allowlists
    - Implementando UX de aprovação de exec no app macOS
    - Revisando prompts de escape do sandbox e suas implicações
summary: Aprovações de exec, allowlists e prompts de escape do sandbox
title: Aprovações de Exec
x-i18n:
    generated_at: "2026-04-06T03:13:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39e91cd5c7615bdb9a6b201a85bde7514327910f6f12da5a4b0532bceb229c22
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Aprovações de exec

As aprovações de exec são a **proteção do app complementar / host de nó** para permitir que um agente em sandbox execute
comandos em um host real (`gateway` ou `node`). Pense nisso como um intertravamento de segurança:
os comandos só são permitidos quando política + allowlist + (opcionalmente) aprovação do usuário concordam.
As aprovações de exec são **adicionais** à política de ferramentas e ao gating de elevated (a menos que elevated esteja definido como `full`, o que ignora aprovações).
A política efetiva é a **mais restritiva** entre `tools.exec.*` e os padrões de aprovações; se um campo de aprovações for omitido, o valor de `tools.exec` será usado.
A execução no host também usa o estado local de aprovações nessa máquina. Um
`ask: "always"` local do host em `~/.openclaw/exec-approvals.json` continua exibindo prompts mesmo que
os padrões da sessão ou da configuração solicitem `ask: "on-miss"`.
Use `openclaw approvals get`, `openclaw approvals get --gateway` ou
`openclaw approvals get --node <id|name|ip>` para inspecionar a política solicitada,
as fontes de política do host e o resultado efetivo.

Se a UI do app complementar **não estiver disponível**, qualquer solicitação que exija prompt será
resolvida pelo **ask fallback** (padrão: negar).

Clientes nativos de aprovação em chat também podem expor affordances específicas do canal na
mensagem de aprovação pendente. Por exemplo, o Matrix pode semear atalhos de reação no
prompt de aprovação (`✅` permitir uma vez, `❌` negar e `♾️` permitir sempre quando disponível),
mantendo ainda os comandos `/approve ...` na mensagem como fallback.

## Onde isso se aplica

As aprovações de exec são aplicadas localmente no host de execução:

- **host do gateway** → processo `openclaw` na máquina do gateway
- **host do nó** → executor do nó (app complementar macOS ou host de nó headless)

Observação sobre o modelo de confiança:

- Chamadores autenticados no gateway são operadores confiáveis para esse Gateway.
- Nós pareados estendem essa capacidade de operador confiável ao host do nó.
- As aprovações de exec reduzem o risco de execução acidental, mas não são um limite de autenticação por usuário.
- Execuções aprovadas no host do nó vinculam o contexto canônico de execução: cwd canônico, argv exato, vínculo de env
  quando presente e caminho fixado do executável quando aplicável.
- Para scripts de shell e invocações diretas de arquivo por interpretador/runtime, o OpenClaw também tenta vincular
  um único operando de arquivo local concreto. Se esse arquivo vinculado mudar após a aprovação, mas antes da execução,
  a execução será negada em vez de executar conteúdo alterado.
- Esse vínculo de arquivo é intencionalmente best-effort, não um modelo semântico completo de todo
  caminho de carregamento de interpretador/runtime. Se o modo de aprovação não conseguir identificar exatamente
  um arquivo local concreto para vincular, ele se recusará a emitir uma execução com suporte de aprovação em vez de fingir cobertura total.

Separação no macOS:

- **serviço de host do nó** encaminha `system.run` para o **app macOS** por IPC local.
- **app macOS** aplica aprovações + executa o comando no contexto da UI.

## Configurações e armazenamento

As aprovações ficam em um arquivo JSON local no host de execução:

`~/.openclaw/exec-approvals.json`

Exemplo de schema:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Modo "YOLO" sem aprovação

Se você quiser que a execução no host rode sem prompts de aprovação, é preciso abrir **as duas** camadas de política:

- a política de exec solicitada na configuração do OpenClaw (`tools.exec.*`)
- a política local de aprovações do host em `~/.openclaw/exec-approvals.json`

Este agora é o comportamento padrão no host, a menos que você o restrinja explicitamente:

- `tools.exec.security`: `full` em `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Distinção importante:

- `tools.exec.host=auto` escolhe onde o exec roda: sandbox quando disponível, caso contrário gateway.
- YOLO escolhe como o exec no host é aprovado: `security=full` mais `ask=off`.
- No modo YOLO, o OpenClaw não adiciona uma proteção separada de aprovação por heurística de ofuscação de comando sobre a política configurada de exec no host.
- `auto` não transforma o roteamento para gateway em uma sobrescrita gratuita a partir de uma sessão em sandbox. Uma solicitação por chamada `host=node` é permitida a partir de `auto`, e `host=gateway` só é permitido a partir de `auto` quando nenhum runtime de sandbox está ativo. Se você quiser um padrão estável diferente de auto, defina `tools.exec.host` ou use `/exec host=...` explicitamente.

Se quiser uma configuração mais conservadora, restrinja novamente qualquer camada para `allowlist` / `on-miss`
ou `deny`.

Configuração persistente no host do gateway de "nunca perguntar":

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Depois defina o arquivo de aprovações do host para corresponder:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Para um host de nó, aplique o mesmo arquivo de aprovações nesse nó em vez disso:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Atalho apenas para a sessão:

- `/exec security=full ask=off` altera apenas a sessão atual.
- `/elevated full` é um atalho break-glass que também ignora aprovações de exec nessa sessão.

Se o arquivo de aprovações do host permanecer mais restritivo do que a configuração, a política mais restritiva do host ainda prevalece.

## Controles de política

### Segurança (`exec.security`)

- **deny**: bloqueia todas as solicitações de exec no host.
- **allowlist**: permite apenas comandos na allowlist.
- **full**: permite tudo (equivalente a elevated).

### Ask (`exec.ask`)

- **off**: nunca exibe prompt.
- **on-miss**: exibe prompt apenas quando a allowlist não corresponder.
- **always**: exibe prompt em todo comando.
- a confiança durável `allow-always` não suprime prompts quando o modo ask efetivo é `always`

### Ask fallback (`askFallback`)

Se um prompt for necessário, mas nenhuma UI estiver acessível, o fallback decide:

- **deny**: bloqueia.
- **allowlist**: permite apenas se a allowlist corresponder.
- **full**: permite.

### Endurecimento de eval inline em interpretador (`tools.exec.strictInlineEval`)

Quando `tools.exec.strictInlineEval=true`, o OpenClaw trata formas inline de code-eval como somente aprovação, mesmo se o binário do interpretador em si estiver na allowlist.

Exemplos:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Isso é defense-in-depth para carregadores de interpretador que não mapeiam bem para um único operando de arquivo estável. No modo estrito:

- esses comandos ainda precisam de aprovação explícita;
- `allow-always` não persiste automaticamente novas entradas de allowlist para eles.

## Allowlist (por agente)

As allowlists são **por agente**. Se existirem vários agentes, troque qual agente você está
editando no app macOS. Os padrões são **correspondências glob case-insensitive**.
Os padrões devem resolver para **caminhos de binário** (entradas apenas com basename são ignoradas).
Entradas legadas `agents.default` são migradas para `agents.main` no carregamento.
Encadeamentos de shell como `echo ok && pwd` ainda exigem que cada segmento de nível superior satisfaça as regras da allowlist.

Exemplos:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Cada entrada da allowlist rastreia:

- **id** UUID estável usado para identidade na UI (opcional)
- **last used** timestamp
- **last used command**
- **last resolved path**

## Auto-allow de CLIs de Skills

Quando **Auto-allow skill CLIs** está ativado, executáveis referenciados por Skills conhecidas
são tratados como allowlisted em nós (nó macOS ou host de nó headless). Isso usa
`skills.bins` pela RPC do Gateway para buscar a lista de bins da Skill. Desative isso se quiser allowlists manuais estritas.

Observações importantes sobre confiança:

- Esta é uma **allowlist implícita de conveniência**, separada das entradas manuais de allowlist por caminho.
- Ela se destina a ambientes de operador confiável em que Gateway e nó estão no mesmo limite de confiança.
- Se você exigir confiança explícita estrita, mantenha `autoAllowSkills: false` e use apenas entradas manuais de allowlist por caminho.

## Safe bins (somente stdin)

`tools.exec.safeBins` define uma pequena lista de binários **somente stdin** (por exemplo `cut`)
que podem rodar em modo allowlist **sem** entradas explícitas na allowlist. Safe bins rejeitam
args posicionais de arquivo e tokens parecidos com caminho, então eles só podem operar sobre o stream de entrada.
Trate isso como um caminho rápido estreito para filtros de stream, não como uma lista geral de confiança.
**Não** adicione binários de interpretador ou runtime (por exemplo `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) a `safeBins`.
Se um comando pode avaliar código, executar subcomandos ou ler arquivos por definição, prefira entradas explícitas de allowlist e mantenha prompts de aprovação ativados.
Safe bins personalizados devem definir um perfil explícito em `tools.exec.safeBinProfiles.<bin>`.
A validação é determinística apenas a partir do formato de argv (sem verificações de existência no sistema de arquivos do host), o que
evita comportamento de oráculo de existência de arquivo por diferenças entre permitir/negar.
Opções orientadas a arquivo são negadas para safe bins padrão (por exemplo `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Safe bins também impõem política explícita de flags por binário para opções que quebram o comportamento
somente stdin (por exemplo `sort -o/--output/--compress-program` e flags recursivas do grep).
Opções longas são validadas em fail-closed no modo safe-bin: flags desconhecidas e abreviações ambíguas são rejeitadas.
Flags negadas por perfil de safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins também forçam tokens argv a serem tratados como **texto literal** no momento da execução (sem globbing
e sem expansão de `$VARS`) para segmentos somente stdin, então padrões como `*` ou `$HOME/...` não podem ser
usados para contrabandear leituras de arquivos.
Safe bins também precisam resolver a partir de diretórios de binário confiáveis (padrões do sistema mais
`tools.exec.safeBinTrustedDirs` opcionais). Entradas de `PATH` nunca são automaticamente confiáveis.
Os diretórios confiáveis padrão para safe-bin são intencionalmente mínimos: `/bin`, `/usr/bin`.
Se o executável safe-bin estiver em caminhos de gerenciador de pacotes/usuário (por exemplo
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), adicione-os explicitamente
a `tools.exec.safeBinTrustedDirs`.
Encadeamento de shell e redirecionamentos não são automaticamente permitidos em modo allowlist.

Encadeamento de shell (`&&`, `||`, `;`) é permitido quando cada segmento de nível superior satisfaz a allowlist
(incluindo safe bins ou auto-allow de Skill). Redirecionamentos continuam sem suporte em modo allowlist.
Substituição de comando (`$()` / crases) é rejeitada durante o parsing da allowlist, inclusive dentro de
aspas duplas; use aspas simples se precisar de texto literal `$()`.
Em aprovações do app complementar macOS, texto bruto de shell contendo sintaxe de controle ou expansão de shell
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) é tratado como falta de correspondência na allowlist, a menos que
o próprio binário do shell esteja na allowlist.
Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), sobrescritas de env no escopo da solicitação são reduzidas a uma
pequena allowlist explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Para decisões de allow-always em modo allowlist, wrappers de despacho conhecidos
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem caminhos do executável interno em vez de caminhos do wrapper.
Multiplexadores de shell (`busybox`, `toybox`) também são desembrulhados para applets de shell (`sh`, `ash`,
etc.) para que executáveis internos sejam persistidos em vez de binários multiplexadores. Se um wrapper ou
multiplexador não puder ser desembrulhado com segurança, nenhuma entrada de allowlist será persistida automaticamente.
Se você colocar interpretadores como `python3` ou `node` na allowlist, prefira `tools.exec.strictInlineEval=true` para que eval inline ainda exija aprovação explícita. No modo estrito, `allow-always` ainda pode persistir invocações benignas de interpretador/script, mas carregadores de eval inline não são persistidos automaticamente.

Safe bins padrão:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` e `sort` não estão na lista padrão. Se você optar por incluí-los, mantenha entradas explícitas de allowlist para
seus fluxos não somente stdin.
Para `grep` no modo safe-bin, forneça o padrão com `-e`/`--regexp`; a forma posicional de padrão é
rejeitada para que operandos de arquivo não possam ser contrabandeados como posicionais ambíguos.

### Safe bins versus allowlist

| Topic            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                            |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Goal             | Permitir automaticamente filtros estreitos de stdin                        | Confiar explicitamente em executáveis específicos                        |
| Match type       | Nome do executável + política argv de safe-bin                 | Padrão glob do caminho resolvido do executável                        |
| Argument scope   | Restringido pelo perfil de safe-bin e regras de token literal | Apenas correspondência de caminho; args continuam sendo sua responsabilidade |
| Typical examples | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLIs personalizadas               |
| Best use         | Transformações de texto de baixo risco em pipelines                  | Qualquer ferramenta com comportamento mais amplo ou efeitos colaterais               |

Local da configuração:

- `safeBins` vem da configuração (`tools.exec.safeBins` ou por agente em `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` vem da configuração (`tools.exec.safeBinTrustedDirs` ou por agente em `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` vem da configuração (`tools.exec.safeBinProfiles` ou por agente em `agents.list[].tools.exec.safeBinProfiles`). Chaves de perfil por agente sobrescrevem chaves globais.
- entradas da allowlist ficam no `~/.openclaw/exec-approvals.json` local do host, em `agents.<id>.allowlist` (ou via Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` alerta com `tools.exec.safe_bins_interpreter_unprofiled` quando bins de interpretador/runtime aparecem em `safeBins` sem perfis explícitos.
- `openclaw doctor --fix` pode criar entradas ausentes em `safeBinProfiles.<bin>` como `{}` (revise e restrinja depois). Bins de interpretador/runtime não são criados automaticamente.

Exemplo de perfil personalizado:
__OC_I18N_900004__
Se você optar explicitamente por incluir `jq` em `safeBins`, o OpenClaw ainda rejeita o builtin `env` no modo safe-bin
para que `jq -n env` não possa despejar o ambiente do processo do host sem um caminho explícito na allowlist
ou prompt de aprovação.

## Edição no Control UI

Use o cartão **Control UI → Nodes → Exec approvals** para editar padrões, sobrescritas
por agente e allowlists. Escolha um escopo (Padrões ou um agente), ajuste a política,
adicione/remova padrões da allowlist e depois **Save**. A UI mostra metadados de **last used**
por padrão para que você possa manter a lista organizada.

O seletor de alvo escolhe **Gateway** (aprovações locais) ou um **Node**. Os nós
precisam anunciar `system.execApprovals.get/set` (app macOS ou host de nó headless).
Se um nó ainda não anunciar aprovações de exec, edite seu
`~/.openclaw/exec-approvals.json` local diretamente.

CLI: `openclaw approvals` oferece suporte a edição de gateway ou nó (consulte [Approvals CLI](/cli/approvals)).

## Fluxo de aprovação

Quando um prompt é necessário, o gateway transmite `exec.approval.requested` para clientes operadores.
O Control UI e o app macOS resolvem isso via `exec.approval.resolve`, depois o gateway encaminha a
solicitação aprovada para o host do nó.

Para `host=node`, solicitações de aprovação incluem um payload canônico `systemRunPlan`. O gateway usa
esse plano como contexto autoritativo de comando/cwd/sessão ao encaminhar solicitações aprovadas de `system.run`.

Isso importa para a latência de aprovação assíncrona:

- o caminho de exec do nó prepara um plano canônico antecipadamente
- o registro de aprovação armazena esse plano e seus metadados de vínculo
- depois de aprovado, a chamada final encaminhada de `system.run` reutiliza o plano armazenado
  em vez de confiar em edições posteriores do chamador
- se o chamador alterar `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` depois que a solicitação de aprovação for criada, o gateway rejeitará a
  execução encaminhada como incompatibilidade de aprovação

## Comandos de interpretador/runtime

Execuções por interpretador/runtime com suporte de aprovação são intencionalmente conservadoras:

- O contexto exato de argv/cwd/env é sempre vinculado.
- Formas diretas de script de shell e arquivo de runtime direto são vinculadas em best-effort a um snapshot de arquivo local concreto.
- Formas comuns de wrapper de gerenciador de pacotes que ainda resolvem para um único arquivo local direto (por exemplo
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) são desembrulhadas antes do vínculo.
- Se o OpenClaw não conseguir identificar exatamente um arquivo local concreto para um comando de interpretador/runtime
  (por exemplo scripts de pacote, formas eval, cadeias de carregador específicas do runtime ou formas ambíguas de vários arquivos),
  a execução com suporte de aprovação será negada em vez de alegar cobertura semântica que não
  possui.
- Para esses fluxos, prefira sandboxing, um limite de host separado ou um fluxo explícito trusted
  de allowlist/full em que o operador aceite a semântica mais ampla do runtime.

Quando aprovações são necessárias, a ferramenta exec retorna imediatamente com um id de aprovação. Use esse id para
correlacionar eventos posteriores do sistema (`Exec finished` / `Exec denied`). Se nenhuma decisão chegar antes do
tempo limite, a solicitação será tratada como timeout de aprovação e exibida como motivo de negação.

### Comportamento de entrega de followup

Depois que um exec assíncrono aprovado termina, o OpenClaw envia um turno `agent` de followup para a mesma sessão.

- Se existir um alvo externo de entrega válido (canal entregável mais alvo `to`), a entrega do followup usa esse canal.
- Em fluxos somente de webchat ou de sessão interna sem alvo externo, a entrega do followup permanece apenas na sessão (`deliver: false`).
- Se um chamador solicitar explicitamente entrega externa estrita sem um canal externo resolvível, a solicitação falhará com `INVALID_REQUEST`.
- Se `bestEffortDeliver` estiver ativado e nenhum canal externo puder ser resolvido, a entrega será rebaixada para apenas sessão em vez de falhar.

A caixa de diálogo de confirmação inclui:

- comando + args
- cwd
- id do agente
- caminho resolvido do executável
- host + metadados de política

Ações:

- **Allow once** → executa agora
- **Always allow** → adiciona à allowlist + executa
- **Deny** → bloqueia

## Encaminhamento de aprovação para canais de chat

Você pode encaminhar prompts de aprovação de exec para qualquer canal de chat (incluindo canais de plugin) e aprová-los
com `/approve`. Isso usa o pipeline normal de entrega de saída.

Configuração:
__OC_I18N_900005__
Responda no chat:
__OC_I18N_900006__
O comando `/approve` lida tanto com aprovações de exec quanto com aprovações de plugin. Se o ID não corresponder a uma aprovação pendente de exec, ele verificará automaticamente aprovações de plugin.

### Encaminhamento de aprovação de plugin

O encaminhamento de aprovação de plugin usa o mesmo pipeline de entrega que aprovações de exec, mas tem sua própria
configuração independente em `approvals.plugin`. Ativar ou desativar um deles não afeta o outro.
__OC_I18N_900007__
O formato da configuração é idêntico a `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` e `targets` funcionam da mesma forma.

Canais com suporte a respostas interativas compartilhadas exibem os mesmos botões de aprovação para aprovações de exec e
de plugin. Canais sem UI interativa compartilhada fazem fallback para texto simples com instruções de `/approve`.

### Aprovações no mesmo chat em qualquer canal

Quando uma solicitação de aprovação de exec ou plugin se origina de uma superfície de chat entregável, o mesmo chat
agora pode aprová-la com `/approve` por padrão. Isso se aplica a canais como Slack, Matrix e
Microsoft Teams, além dos fluxos existentes da Web UI e da UI de terminal.

Esse caminho compartilhado de comando de texto usa o modelo normal de autenticação do canal para essa conversa. Se o
chat de origem já pode enviar comandos e receber respostas, as solicitações de aprovação não precisam mais de um
adaptador de entrega nativo separado apenas para continuar pendentes.

Discord e Telegram também oferecem suporte a `/approve` no mesmo chat, mas esses canais ainda usam sua
lista resolvida de aprovadores para autorização, mesmo quando a entrega nativa de aprovações está desativada.

Para o Telegram e outros clientes nativos de aprovação que chamam o Gateway diretamente,
esse fallback é intencionalmente limitado a falhas de "aprovação não encontrada". Um erro/negação real de
aprovação de exec não tenta silenciosamente novamente como aprovação de plugin.

### Entrega nativa de aprovação

Alguns canais também podem atuar como clientes nativos de aprovação. Clientes nativos adicionam DMs de aprovadores, fanout para chat de origem
e UX interativa de aprovação específica do canal sobre o fluxo compartilhado de `/approve` no mesmo chat.

Quando cartões/botões nativos de aprovação estiverem disponíveis, essa UI nativa será o caminho principal
voltado ao agente. O agente não deve também repetir um comando simples de chat
`/approve`, a menos que o resultado da ferramenta informe que aprovações via chat estão indisponíveis ou que
aprovação manual é o único caminho restante.

Modelo genérico:

- a política de exec no host ainda decide se a aprovação de exec é necessária
- `approvals.exec` controla o encaminhamento de prompts de aprovação para outros destinos de chat
- `channels.<channel>.execApprovals` controla se esse canal atua como cliente nativo de aprovação

Clientes nativos de aprovação ativam automaticamente entrega DM-first quando todas estas condições são verdadeiras:

- o canal oferece suporte a entrega nativa de aprovação
- aprovadores podem ser resolvidos a partir de `execApprovals.approvers` explícito ou das fontes de fallback documentadas
  para esse canal
- `channels.<channel>.execApprovals.enabled` está indefinido ou é `"auto"`

Defina `enabled: false` para desativar explicitamente um cliente nativo de aprovação. Defina `enabled: true` para forçá-lo
quando os aprovadores forem resolvidos. A entrega pública no chat de origem continua explícita por meio de
`channels.<channel>.execApprovals.target`.

FAQ: [Why are there two exec approval configs for chat approvals?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Esses clientes nativos de aprovação adicionam roteamento por DM e fanout opcional de canal sobre o fluxo compartilhado
de `/approve` no mesmo chat e botões compartilhados de aprovação.

Comportamento compartilhado:

- Slack, Matrix, Microsoft Teams e chats entregáveis semelhantes usam o modelo normal de autenticação do canal
  para `/approve` no mesmo chat
- quando um cliente nativo de aprovação é ativado automaticamente, o alvo nativo padrão de entrega são DMs dos aprovadores
- para Discord e Telegram, apenas aprovadores resolvidos podem aprovar ou negar
- aprovadores do Discord podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- aprovadores do Telegram podem ser explícitos (`execApprovals.approvers`) ou inferidos da configuração existente de owner (`allowFrom`, além de `defaultTo` em mensagem direta quando compatível)
- aprovadores do Slack podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- botões nativos do Slack preservam o tipo do id de aprovação, então ids `plugin:` podem resolver aprovações de plugin
  sem uma segunda camada local de fallback do Slack
- o roteamento nativo de DM/canal do Matrix é apenas para exec; aprovações de plugin no Matrix ficam no fluxo compartilhado
  de `/approve` no mesmo chat e nos caminhos opcionais de encaminhamento `approvals.plugin`
- o solicitante não precisa ser um aprovador
- o chat de origem pode aprovar diretamente com `/approve` quando esse chat já oferece suporte a comandos e respostas
- botões nativos de aprovação do Discord roteiam por tipo de id de aprovação: ids `plugin:` vão
  diretamente para aprovações de plugin, todo o resto vai para aprovações de exec
- botões nativos de aprovação do Telegram seguem o mesmo fallback limitado de exec para plugin que `/approve`
- quando `target` nativo ativa entrega para chat de origem, prompts de aprovação incluem o texto do comando
- aprovações pendentes de exec expiram após 30 minutos por padrão
- se nenhuma UI de operador ou cliente configurado de aprovação puder aceitar a solicitação, o prompt faz fallback para `askFallback`

O Telegram usa por padrão DMs de aprovadores (`target: "dm"`). Você pode mudar para `channel` ou `both` quando
quiser que prompts de aprovação também apareçam no chat/tópico de origem do Telegram. Para tópicos de fórum do Telegram, o OpenClaw preserva o tópico para o prompt de aprovação e para o follow-up pós-aprovação.

Consulte:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Fluxo IPC no macOS
__OC_I18N_900008__
Observações de segurança:

- Modo do socket Unix `0600`, token armazenado em `exec-approvals.json`.
- Verificação de peer com o mesmo UID.
- Challenge/response (nonce + token HMAC + hash da solicitação) + TTL curto.

## Eventos do sistema

O ciclo de vida de exec é exposto como mensagens do sistema:

- `Exec running` (somente se o comando exceder o limite de aviso de execução)
- `Exec finished`
- `Exec denied`

Essas mensagens são publicadas na sessão do agente depois que o nó informa o evento.
Aprovações de exec no host do gateway emitem os mesmos eventos de ciclo de vida quando o comando termina (e opcionalmente quando fica executando além do limite).
Execs protegidos por aprovação reutilizam o id de aprovação como `runId` nessas mensagens para facilitar a correlação.

## Comportamento de aprovação negada

Quando uma aprovação assíncrona de exec é negada, o OpenClaw impede que o agente reutilize
saída de qualquer execução anterior do mesmo comando na sessão. O motivo da negação
é transmitido com orientação explícita de que nenhuma saída de comando está disponível, o que impede
o agente de alegar que existe nova saída ou repetir o comando negado com
resultados antigos de uma execução anterior bem-sucedida.

## Implicações

- **full** é poderoso; prefira allowlists quando possível.
- **ask** mantém você no circuito e ainda permite aprovações rápidas.
- Allowlists por agente evitam que aprovações de um agente vazem para outros.
- Aprovações só se aplicam a solicitações de exec no host vindas de **remetentes autorizados**. Remetentes não autorizados não podem emitir `/exec`.
- `/exec security=full` é uma conveniência no nível da sessão para operadores autorizados e ignora aprovações por definição.
  Para bloquear rigidamente exec no host, defina a segurança de aprovações como `deny` ou negue a ferramenta `exec` via política de ferramentas.

Relacionado:

- [Exec tool](/pt-BR/tools/exec)
- [Elevated mode](/pt-BR/tools/elevated)
- [Skills](/pt-BR/tools/skills)

## Relacionados

- [Exec](/pt-BR/tools/exec) — ferramenta de execução de comando de shell
- [Sandboxing](/pt-BR/gateway/sandboxing) — modos de sandbox e acesso ao workspace
- [Security](/pt-BR/gateway/security) — modelo de segurança e endurecimento
- [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) — quando usar cada um
