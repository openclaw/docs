---
read_when:
    - Configurando aprovações de exec ou allowlists
    - Implementando a UX de aprovação de exec no app do macOS
    - Analisando prompts de escape de sandbox e suas implicações
summary: Aprovações de exec, allowlists e prompts de escape de sandbox
title: Aprovações de exec
x-i18n:
    generated_at: "2026-04-08T02:19:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6041929185bab051ad873cc4822288cb7d6f0470e19e7ae7a16b70f76dfc2cd9
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Aprovações de exec

As aprovações de exec são a **proteção do app complementar / host de nó** para permitir que um agente em sandbox execute
comandos em um host real (`gateway` ou `node`). Pense nisso como um intertravamento de segurança:
os comandos só são permitidos quando política + allowlist + (aprovação opcional do) usuário concordam.
As aprovações de exec existem **além** da política de ferramentas e do controle elevado (a menos que elevated esteja definido como `full`, o que ignora as aprovações).
A política efetiva é a **mais restritiva** entre os padrões de `tools.exec.*` e das aprovações; se um campo de aprovações for omitido, será usado o valor de `tools.exec`.
O exec no host também usa o estado local de aprovações nessa máquina. Um
`ask: "always"` local ao host em `~/.openclaw/exec-approvals.json` continua exibindo prompts mesmo se
os padrões de sessão ou de config solicitarem `ask: "on-miss"`.
Use `openclaw approvals get`, `openclaw approvals get --gateway` ou
`openclaw approvals get --node <id|name|ip>` para inspecionar a política solicitada,
as origens da política do host e o resultado efetivo.

Se a UI do app complementar **não estiver disponível**, qualquer solicitação que exija prompt será
resolvida pelo **fallback de ask** (padrão: deny).

Clientes nativos de aprovação em chat também podem expor recursos específicos do canal na
mensagem de aprovação pendente. Por exemplo, o Matrix pode preparar atalhos de reação no
prompt de aprovação (`✅` permitir uma vez, `❌` negar e `♾️` permitir sempre quando disponível),
enquanto mantém os comandos `/approve ...` na mensagem como fallback.

## Onde se aplica

As aprovações de exec são aplicadas localmente no host de execução:

- **host gateway** → processo `openclaw` na máquina do gateway
- **host node** → executor do nó (app complementar do macOS ou host de nó headless)

Observação sobre o modelo de confiança:

- Chamadores autenticados no gateway são operadores confiáveis para esse Gateway.
- Nós emparelhados estendem essa capacidade de operador confiável ao host do nó.
- As aprovações de exec reduzem o risco de execução acidental, mas não são um limite de auth por usuário.
- Execuções aprovadas no host do nó vinculam um contexto canônico de execução: cwd canônico, argv exato, vínculo
  de env quando presente e caminho fixado do executável quando aplicável.
- Para scripts shell e invocações diretas de arquivos por interpretador/runtime, o OpenClaw também tenta vincular
  um operando de arquivo local concreto.
  Se esse arquivo vinculado mudar após a aprovação, mas antes da execução,
  a execução será negada em vez de executar conteúdo alterado.
- Esse vínculo de arquivo é intencionalmente por melhor esforço, não um modelo semântico completo de todos os
  caminhos de carregamento de interpretador/runtime. Se o modo de aprovação não conseguir identificar exatamente um arquivo local concreto
  para vincular, ele se recusa a emitir uma execução respaldada por aprovação em vez de fingir cobertura total.

Separação no macOS:

- O **serviço do host node** encaminha `system.run` para o **app do macOS** por IPC local.
- O **app do macOS** aplica as aprovações + executa o comando no contexto da UI.

## Configurações e armazenamento

As aprovações ficam em um arquivo JSON local no host de execução:

`~/.openclaw/exec-approvals.json`

Exemplo de esquema:

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

Se você quiser que o exec no host seja executado sem prompts de aprovação, deverá abrir **ambas** as camadas de política:

- política de exec solicitada na config do OpenClaw (`tools.exec.*`)
- política local de aprovações do host em `~/.openclaw/exec-approvals.json`

Esse agora é o comportamento padrão do host, a menos que você o restrinja explicitamente:

- `tools.exec.security`: `full` em `gateway`/`node`
- `tools.exec.ask`: `off`
- `host askFallback`: `full`

Distinção importante:

- `tools.exec.host=auto` escolhe onde o exec é executado: sandbox quando disponível, caso contrário gateway.
- YOLO escolhe como o exec no host é aprovado: `security=full` mais `ask=off`.
- No modo YOLO, o OpenClaw não adiciona um controle separado de aprovação heurística por ofuscação de comando por cima da política configurada de exec no host.
- `auto` não transforma o roteamento para gateway em uma substituição livre a partir de uma sessão em sandbox. Uma solicitação por chamada `host=node` é permitida a partir de `auto`, e `host=gateway` só é permitido a partir de `auto` quando não há runtime de sandbox ativo. Se você quiser um padrão estável que não seja auto, defina `tools.exec.host` ou use `/exec host=...` explicitamente.

Se quiser uma configuração mais conservadora, restrinja qualquer uma das camadas de volta para `allowlist` / `on-miss`
ou `deny`.

Configuração persistente de host gateway "nunca pedir":

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Depois, defina o arquivo de aprovações do host para corresponder:

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

Para um host node, aplique o mesmo arquivo de aprovações nesse nó:

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

Atalho somente para sessão:

- `/exec security=full ask=off` altera apenas a sessão atual.
- `/elevated full` é um atalho break-glass que também ignora aprovações de exec para essa sessão.

Se o arquivo de aprovações do host continuar mais restritivo do que a config, a política mais restritiva do host ainda prevalece.

## Controles de política

### Segurança (`exec.security`)

- **deny**: bloqueia todas as solicitações de exec no host.
- **allowlist**: permite apenas comandos na allowlist.
- **full**: permite tudo (equivalente a elevated).

### Ask (`exec.ask`)

- **off**: nunca exibe prompt.
- **on-miss**: exibe prompt somente quando não há correspondência na allowlist.
- **always**: exibe prompt para todo comando.
- confiança durável `allow-always` não suprime prompts quando o modo efetivo de ask é `always`

### Ask fallback (`askFallback`)

Se um prompt for necessário, mas nenhuma UI puder ser acessada, o fallback decide:

- **deny**: bloqueia.
- **allowlist**: permite somente se houver correspondência na allowlist.
- **full**: permite.

### Hardening de eval inline em interpretadores (`tools.exec.strictInlineEval`)

Quando `tools.exec.strictInlineEval=true`, o OpenClaw trata formas inline de avaliação de código como dependentes apenas de aprovação, mesmo se o binário do interpretador em si estiver na allowlist.

Exemplos:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Isso é defesa em profundidade para carregadores de interpretador que não se mapeiam de forma limpa para um único operando de arquivo estável. No modo estrito:

- esses comandos ainda precisam de aprovação explícita;
- `allow-always` não persiste automaticamente novas entradas de allowlist para eles.

## Allowlist (por agente)

Allowlists são **por agente**. Se existirem vários agentes, troque qual agente você está
editando no app do macOS. Os padrões são **correspondências glob sem diferenciação entre maiúsculas e minúsculas**.
Os padrões devem resolver para **caminhos de binários** (entradas apenas com basename são ignoradas).
Entradas legadas `agents.default` são migradas para `agents.main` no carregamento.
Encadeamentos de shell como `echo ok && pwd` ainda exigem que todo segmento de topo satisfaça as regras da allowlist.

Exemplos:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Cada entrada da allowlist rastreia:

- **id** UUID estável usado para identidade na UI (opcional)
- **último uso** timestamp
- **último comando usado**
- **último caminho resolvido**

## Permitir automaticamente CLIs de Skills

Quando **Auto-allow skill CLIs** está ativado, executáveis referenciados por Skills conhecidas
são tratados como permitidos por allowlist em nós (nó macOS ou host de nó headless). Isso usa
`skills.bins` no Gateway RPC para buscar a lista de bins da skill. Desative isso se quiser allowlists manuais estritas.

Observações importantes sobre confiança:

- Esta é uma **allowlist implícita de conveniência**, separada das entradas manuais de allowlist por caminho.
- Ela se destina a ambientes de operador confiáveis em que Gateway e nó estão no mesmo limite de confiança.
- Se você exige confiança estritamente explícita, mantenha `autoAllowSkills: false` e use apenas entradas manuais de allowlist por caminho.

## Bins seguros (somente stdin)

`tools.exec.safeBins` define uma pequena lista de binários **somente stdin** (por exemplo `cut`)
que podem ser executados no modo allowlist **sem** entradas explícitas de allowlist. Bins seguros rejeitam
args posicionais de arquivo e tokens semelhantes a caminhos, então eles só podem operar no fluxo de entrada.
Trate isso como um caminho rápido e restrito para filtros de stream, não como uma lista geral de confiança.
**Não** adicione binários de interpretador ou runtime (por exemplo `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) a `safeBins`.
Se um comando puder avaliar código, executar subcomandos ou ler arquivos por definição, prefira entradas explícitas de allowlist e mantenha os prompts de aprovação ativados.
Bins seguros personalizados devem definir um perfil explícito em `tools.exec.safeBinProfiles.<bin>`.
A validação é determinística apenas com base no formato do argv (sem verificações de existência no filesystem do host), o que
evita comportamento de oráculo de existência de arquivos por diferenças entre permitir/negar.
Opções orientadas a arquivo são negadas para bins seguros padrão (por exemplo `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Bins seguros também aplicam política explícita por binário para opções que quebram o comportamento
somente stdin (por exemplo `sort -o/--output/--compress-program` e flags recursivas do grep).
Opções longas são validadas com falha fechada no modo safe-bin: flags desconhecidas e
abreviações ambíguas são rejeitadas.
Flags negadas por perfil de safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Bins seguros também forçam tokens argv a serem tratados como **texto literal** no momento da execução (sem globbing
e sem expansão de `$VARS`) para segmentos somente stdin, então padrões como `*` ou `$HOME/...` não podem ser
usados para introduzir leituras de arquivo.
Bins seguros também devem resolver a partir de diretórios confiáveis de binários (padrões do sistema mais
`tools.exec.safeBinTrustedDirs` opcionais). Entradas de `PATH` nunca recebem confiança automática.
Os diretórios confiáveis padrão de safe-bin são intencionalmente mínimos: `/bin`, `/usr/bin`.
Se o executável safe-bin estiver em caminhos de gerenciador de pacotes/usuário (por exemplo
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), adicione-os explicitamente
a `tools.exec.safeBinTrustedDirs`.
Encadeamentos de shell e redirecionamentos não são permitidos automaticamente no modo allowlist.

Encadeamentos de shell (`&&`, `||`, `;`) são permitidos quando todo segmento de topo satisfaz a allowlist
(incluindo safe bins ou auto-allow de Skills). Redirecionamentos continuam sem suporte no modo allowlist.
Substituição de comando (`$()` / crases) é rejeitada durante o parsing da allowlist, inclusive dentro de
aspas duplas; use aspas simples se precisar de texto literal `$()`.
Em aprovações do app complementar do macOS, texto bruto de shell contendo sintaxe de controle ou expansão de shell
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) é tratado como ausência de correspondência na allowlist, a menos que
o próprio binário do shell esteja na allowlist.
Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), substituições de env no escopo da solicitação são reduzidas a
uma pequena allowlist explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Para decisões de allow-always no modo allowlist, wrappers de despacho conhecidos
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem os caminhos do executável interno em vez dos caminhos do wrapper. Multiplexadores de shell (`busybox`, `toybox`) também são desembrulhados para applets de shell (`sh`, `ash`,
etc.), de modo que os executáveis internos sejam persistidos em vez dos binários do multiplexador. Se um wrapper ou
multiplexador não puder ser desembrulhado com segurança, nenhuma entrada de allowlist será persistida automaticamente.
Se você colocar interpretadores como `python3` ou `node` na allowlist, prefira `tools.exec.strictInlineEval=true` para que eval inline ainda exija aprovação explícita. No modo estrito, `allow-always` ainda pode persistir invocações benignas de interpretador/script, mas portadores de eval inline não são persistidos automaticamente.

Bins seguros padrão:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` e `sort` não estão na lista padrão. Se você optar por incluí-los, mantenha entradas explícitas de allowlist para
fluxos de trabalho que não sejam somente stdin.
Para `grep` no modo safe-bin, forneça o padrão com `-e`/`--regexp`; a forma posicional de padrão é
rejeitada para que operandos de arquivo não possam ser introduzidos como posicionais ambíguos.

### Safe bins versus allowlist

| Tópico            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                            |
| ----------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Objetivo          | Permitir automaticamente filtros restritos de stdin    | Confiar explicitamente em executáveis específicos            |
| Tipo de correspondência | Nome do executável + política argv de safe-bin    | Padrão glob do caminho resolvido do executável               |
| Escopo de argumento   | Restrito pelo perfil do safe-bin e regras de token literal | Somente correspondência de caminho; argumentos são sua responsabilidade |
| Exemplos típicos  | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLIs personalizados       |
| Melhor uso        | Transformações de texto de baixo risco em pipelines    | Qualquer ferramenta com comportamento mais amplo ou efeitos colaterais |

Local da configuração:

- `safeBins` vem da config (`tools.exec.safeBins` ou por agente em `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` vem da config (`tools.exec.safeBinTrustedDirs` ou por agente em `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` vem da config (`tools.exec.safeBinProfiles` ou por agente em `agents.list[].tools.exec.safeBinProfiles`). Chaves por agente substituem chaves globais.
- entradas de allowlist ficam no arquivo local do host `~/.openclaw/exec-approvals.json` em `agents.<id>.allowlist` (ou pela Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` avisa com `tools.exec.safe_bins_interpreter_unprofiled` quando bins de interpretador/runtime aparecem em `safeBins` sem perfis explícitos.
- `openclaw doctor --fix` pode gerar entradas ausentes de `safeBinProfiles.<bin>` como `{}` (revise e restrinja depois). Bins de interpretador/runtime não são gerados automaticamente.

Exemplo de perfil personalizado:
__OC_I18N_900004__
Se você optar explicitamente por colocar `jq` em `safeBins`, o OpenClaw ainda rejeita o builtin `env` no modo safe-bin,
então `jq -n env` não pode despejar o ambiente do processo do host sem um caminho explícito de allowlist
ou prompt de aprovação.

## Edição na Control UI

Use o cartão **Control UI → Nodes → Exec approvals** para editar padrões, substituições
por agente e allowlists. Escolha um escopo (Defaults ou um agente), ajuste a política,
adicione/remova padrões da allowlist e clique em **Save**. A UI mostra metadados de **último uso**
por padrão para que você mantenha a lista organizada.

O seletor de alvo escolhe **Gateway** (aprovações locais) ou um **Node**. Nós
devem anunciar `system.execApprovals.get/set` (app do macOS ou host de nó headless).
Se um nó ainda não anunciar aprovações de exec, edite o arquivo local
`~/.openclaw/exec-approvals.json` diretamente.

CLI: `openclaw approvals` oferece suporte à edição de gateway ou node (consulte [CLI de aprovações](/cli/approvals)).

## Fluxo de aprovação

Quando um prompt é necessário, o gateway transmite `exec.approval.requested` para clientes operator.
A Control UI e o app do macOS o resolvem via `exec.approval.resolve`, então o gateway encaminha a
solicitação aprovada para o host do nó.

Para `host=node`, solicitações de aprovação incluem um payload canônico `systemRunPlan`. O gateway usa
esse plano como contexto autoritativo de comando/cwd/sessão ao encaminhar solicitações aprovadas de `system.run`.

Isso importa para a latência de aprovação assíncrona:

- o caminho de exec do nó prepara um plano canônico adiantado
- o registro de aprovação armazena esse plano e seus metadados de vínculo
- uma vez aprovado, a chamada final encaminhada de `system.run` reutiliza o plano armazenado
  em vez de confiar em edições posteriores do chamador
- se o chamador alterar `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` depois que a solicitação de aprovação foi criada, o gateway rejeita a
  execução encaminhada por incompatibilidade de aprovação

## Comandos de interpretador/runtime

Execuções de interpretador/runtime respaldadas por aprovação são intencionalmente conservadoras:

- O contexto exato de argv/cwd/env é sempre vinculado.
- Formas diretas de script shell e arquivo de runtime direto são vinculadas, por melhor esforço, a um snapshot de um arquivo local concreto.
- Formas comuns de wrapper de gerenciador de pacotes que ainda resolvem para um arquivo local direto (por exemplo
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) são desembrulhadas antes do vínculo.
- Se o OpenClaw não conseguir identificar exatamente um arquivo local concreto para um comando de interpretador/runtime
  (por exemplo scripts de pacote, formas eval, cadeias de carregamento específicas de runtime ou formas
  ambíguas com vários arquivos), a execução respaldada por aprovação é negada em vez de afirmar cobertura semântica que
  não possui.
- Para esses fluxos de trabalho, prefira sandboxing, um limite de host separado ou um fluxo explícito
  confiável de allowlist/full em que o operador aceite a semântica mais ampla do runtime.

Quando aprovações são necessárias, a ferramenta exec retorna imediatamente com um id de aprovação. Use esse id para
correlacionar eventos posteriores do sistema (`Exec finished` / `Exec denied`). Se nenhuma decisão chegar antes do
timeout, a solicitação será tratada como timeout de aprovação e exibida como motivo de negação.

### Comportamento de entrega de followup

Depois que um exec assíncrono aprovado termina, o OpenClaw envia um turno `agent` de followup para a mesma sessão.

- Se existir um destino externo válido de entrega (canal entregável mais alvo `to`), a entrega do followup usa esse canal.
- Em fluxos somente webchat ou sessão interna sem alvo externo, a entrega do followup permanece somente na sessão (`deliver: false`).
- Se um chamador solicitar explicitamente entrega externa estrita sem um canal externo resolvível, a solicitação falha com `INVALID_REQUEST`.
- Se `bestEffortDeliver` estiver ativado e nenhum canal externo puder ser resolvido, a entrega é rebaixada para somente sessão em vez de falhar.

A caixa de diálogo de confirmação inclui:

- comando + args
- cwd
- id do agente
- caminho resolvido do executável
- host + metadados da política

Ações:

- **Allow once** → executa agora
- **Always allow** → adiciona à allowlist + executa
- **Deny** → bloqueia

## Encaminhamento de aprovações para canais de chat

Você pode encaminhar prompts de aprovação de exec para qualquer canal de chat (incluindo canais de plugin) e aprová-los
com `/approve`. Isso usa o pipeline normal de entrega de saída.

Config:
__OC_I18N_900005__
Responder no chat:
__OC_I18N_900006__
O comando `/approve` lida tanto com aprovações de exec quanto com aprovações de plugin. Se o ID não corresponder a uma aprovação pendente de exec, ele verifica automaticamente aprovações de plugin.

### Encaminhamento de aprovações de plugin

O encaminhamento de aprovações de plugin usa o mesmo pipeline de entrega das aprovações de exec, mas tem sua própria
config independente em `approvals.plugin`. Ativar ou desativar uma não afeta a outra.
__OC_I18N_900007__
O formato da config é idêntico a `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` e `targets` funcionam da mesma forma.

Canais que oferecem suporte a respostas interativas compartilhadas exibem os mesmos botões de aprovação tanto para aprovações de exec quanto de plugin. Canais sem UI interativa compartilhada usam texto simples com instruções de `/approve` como fallback.

### Aprovações no mesmo chat em qualquer canal

Quando uma solicitação de aprovação de exec ou plugin se origina de uma superfície entregável de chat, o mesmo chat
agora pode aprová-la com `/approve` por padrão. Isso se aplica a canais como Slack, Matrix e
Microsoft Teams, além dos fluxos já existentes de UI web e UI de terminal.

Esse caminho compartilhado por comando de texto usa o modelo normal de auth do canal para essa conversa. Se o
chat de origem já consegue enviar comandos e receber respostas, as solicitações de aprovação não precisam mais de um
adaptador nativo separado de entrega apenas para permanecerem pendentes.

Discord e Telegram também oferecem suporte a `/approve` no mesmo chat, mas esses canais ainda usam sua
lista resolvida de aprovadores para autorização, mesmo quando a entrega nativa de aprovação está desativada.

Para Telegram e outros clientes nativos de aprovação que chamam o Gateway diretamente,
esse fallback é intencionalmente limitado a falhas "approval not found". Uma negação/erro real
de aprovação de exec não tenta silenciosamente novamente como aprovação de plugin.

### Entrega nativa de aprovação

Alguns canais também podem atuar como clientes nativos de aprovação. Clientes nativos adicionam DMs para aprovadores, fanout
para chat de origem e UX interativa de aprovação específica do canal por cima do fluxo compartilhado de
`/approve` no mesmo chat.

Quando cartões/botões nativos de aprovação estão disponíveis, essa UI nativa é o caminho principal
voltado ao agente. O agente não deve também reproduzir um comando simples duplicado de chat
`/approve`, a menos que o resultado da ferramenta diga que aprovações por chat não estão disponíveis ou
que a aprovação manual seja o único caminho restante.

Modelo genérico:

- a política de exec no host ainda decide se a aprovação de exec é necessária
- `approvals.exec` controla o encaminhamento de prompts de aprovação para outros destinos de chat
- `channels.<channel>.execApprovals` controla se esse canal atua como cliente nativo de aprovação

Clientes nativos de aprovação ativam automaticamente a entrega primeiro por DM quando todas as condições abaixo são verdadeiras:

- o canal oferece suporte à entrega nativa de aprovação
- os aprovadores podem ser resolvidos a partir de `execApprovals.approvers` explícito ou das fontes de fallback documentadas desse
  canal
- `channels.<channel>.execApprovals.enabled` está indefinido ou `"auto"`

Defina `enabled: false` para desativar explicitamente um cliente nativo de aprovação. Defina `enabled: true` para
forçá-lo quando aprovadores puderem ser resolvidos. A entrega pública ao chat de origem continua explícita por meio de
`channels.<channel>.execApprovals.target`.

FAQ: [Por que existem duas configs de aprovação de exec para aprovações por chat?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Esses clientes nativos de aprovação adicionam roteamento por DM e fanout opcional de canal por cima do fluxo compartilhado
de `/approve` no mesmo chat e dos botões compartilhados de aprovação.

Comportamento compartilhado:

- Slack, Matrix, Microsoft Teams e chats entregáveis semelhantes usam o modelo normal de auth do canal
  para `/approve` no mesmo chat
- quando um cliente nativo de aprovação é ativado automaticamente, o alvo padrão de entrega nativa são DMs dos aprovadores
- para Discord e Telegram, apenas aprovadores resolvidos podem aprovar ou negar
- aprovadores do Discord podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- aprovadores do Telegram podem ser explícitos (`execApprovals.approvers`) ou inferidos da config existente de owner (`allowFrom`, além de `defaultTo` para mensagem direta quando compatível)
- aprovadores do Slack podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- botões nativos do Slack preservam o tipo do id de aprovação, então ids `plugin:` podem resolver aprovações de plugin
  sem uma segunda camada local de fallback do Slack
- roteamento nativo por DM/canal e atalhos de reação do Matrix lidam tanto com aprovações de exec quanto de plugin;
  a autorização de plugin ainda vem de `channels.matrix.dm.allowFrom`
- o solicitante não precisa ser um aprovador
- o chat de origem pode aprovar diretamente com `/approve` quando esse chat já oferecer suporte a comandos e respostas
- botões nativos de aprovação do Discord roteiam por tipo de id de aprovação: ids `plugin:` vão
  direto para aprovações de plugin, todo o resto vai para aprovações de exec
- botões nativos de aprovação do Telegram seguem o mesmo fallback limitado de exec para plugin que `/approve`
- quando `target` nativo ativa entrega ao chat de origem, prompts de aprovação incluem o texto do comando
- aprovações pendentes de exec expiram após 30 minutos por padrão
- se nenhuma UI de operador ou cliente de aprovação configurado puder aceitar a solicitação, o prompt recorre a `askFallback`

O Telegram usa por padrão DMs de aprovadores (`target: "dm"`). Você pode mudar para `channel` ou `both` quando
quiser que prompts de aprovação apareçam também no chat/tópico de origem do Telegram. Para tópicos de fórum do Telegram, o OpenClaw preserva o tópico para o prompt de aprovação e para o followup pós-aprovação.

Consulte:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Fluxo IPC do macOS
__OC_I18N_900008__
Observações de segurança:

- Modo de socket Unix `0600`, token armazenado em `exec-approvals.json`.
- Verificação de peer com o mesmo UID.
- Desafio/resposta (nonce + token HMAC + hash da solicitação) + TTL curto.

## Eventos do sistema

O ciclo de vida do exec aparece como mensagens do sistema:

- `Exec running` (somente se o comando ultrapassar o limite para aviso de execução)
- `Exec finished`
- `Exec denied`

Essas mensagens são publicadas na sessão do agente depois que o nó reporta o evento.
Aprovações de exec no host gateway emitem os mesmos eventos de ciclo de vida quando o comando termina (e opcionalmente quando está executando além do limite).
Execs controlados por aprovação reutilizam o id de aprovação como `runId` nessas mensagens para facilitar a correlação.

## Comportamento de aprovação negada

Quando uma aprovação assíncrona de exec é negada, o OpenClaw impede que o agente reutilize
a saída de qualquer execução anterior do mesmo comando na sessão. O motivo da negação
é passado com orientação explícita de que nenhuma saída do comando está disponível, o que impede
o agente de afirmar que existe uma nova saída ou de repetir o comando negado com
resultados obsoletos de uma execução anterior bem-sucedida.

## Implicações

- **full** é poderoso; prefira allowlists quando possível.
- **ask** mantém você no controle, ao mesmo tempo em que permite aprovações rápidas.
- Allowlists por agente evitam que aprovações de um agente vazem para outros.
- Aprovações se aplicam apenas a solicitações de exec no host de **remetentes autorizados**. Remetentes não autorizados não podem emitir `/exec`.
- `/exec security=full` é uma conveniência no nível da sessão para operadores autorizados e ignora aprovações por definição.
  Para bloquear completamente o exec no host, defina a segurança das aprovações como `deny` ou negue a ferramenta `exec` por meio da política de ferramentas.

Relacionado:

- [Ferramenta exec](/pt-BR/tools/exec)
- [Modo elevated](/pt-BR/tools/elevated)
- [Skills](/pt-BR/tools/skills)

## Relacionado

- [Exec](/pt-BR/tools/exec) — ferramenta de execução de comandos shell
- [Sandboxing](/pt-BR/gateway/sandboxing) — modos de sandbox e acesso ao workspace
- [Security](/pt-BR/gateway/security) — modelo de segurança e hardening
- [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) — quando usar cada um
