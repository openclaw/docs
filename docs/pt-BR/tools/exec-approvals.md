---
read_when:
    - Configurando aprovações de execução ou listas de permissões
    - Implementando a UX de aprovação de execução no app para macOS
    - Revisando prompts de escape do sandbox e implicações
summary: Aprovações de execução, listas de permissões e prompts de escape do sandbox
title: Aprovações de execução
x-i18n:
    generated_at: "2026-04-11T02:47:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f4a2e2f1f3c13a1d1926c9de0720513ea8a74d1ca571dbe74b188d8c560c14c
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Aprovações de execução

As aprovações de execução são a **proteção do app complementar / host de nó** para permitir que um agente em sandbox execute
comandos em um host real (`gateway` ou `node`). Pense nisso como um intertravamento de segurança:
os comandos só são permitidos quando política + lista de permissões + (opcionalmente) aprovação do usuário concordam.
As aprovações de execução são **adicionais** à política de ferramentas e ao controle elevado (a menos que elevated esteja definido como `full`, o que ignora as aprovações).
A política efetiva é a **mais restritiva** entre os padrões de `tools.exec.*` e de aprovações; se um campo de aprovações for omitido, será usado o valor de `tools.exec`.
A execução no host também usa o estado local de aprovações naquela máquina. Um
`ask: "always"` local do host em `~/.openclaw/exec-approvals.json` continua exibindo prompts mesmo se
os padrões da sessão ou da configuração solicitarem `ask: "on-miss"`.
Use `openclaw approvals get`, `openclaw approvals get --gateway` ou
`openclaw approvals get --node <id|name|ip>` para inspecionar a política solicitada,
as origens da política do host e o resultado efetivo.
Para a máquina local, `openclaw exec-policy show` expõe a mesma visão mesclada e
`openclaw exec-policy set|preset` pode sincronizar a política local solicitada com o
arquivo local de aprovações do host em uma única etapa. Quando um escopo local solicita `host=node`,
`openclaw exec-policy show` informa esse escopo em runtime como gerenciado por nó, em vez de
fingir que o arquivo local de aprovações é a fonte efetiva da verdade.

Se a interface do app complementar **não estiver disponível**, qualquer solicitação que exija um prompt será
resolvida pelo **fallback de ask** (padrão: negar).

Clientes nativos de aprovação em chat também podem expor affordances específicas de canal na
mensagem de aprovação pendente. Por exemplo, o Matrix pode semear atalhos por reação no
prompt de aprovação (`✅` permitir uma vez, `❌` negar e `♾️` permitir sempre quando disponível),
mantendo ainda os comandos `/approve ...` na mensagem como fallback.

## Onde se aplica

As aprovações de execução são aplicadas localmente no host de execução:

- **host do gateway** → processo `openclaw` na máquina do gateway
- **host do nó** → executor do nó (app complementar do macOS ou host de nó headless)

Observação sobre o modelo de confiança:

- Chamadores autenticados no gateway são operadores confiáveis desse Gateway.
- Nós emparelhados estendem essa capacidade de operador confiável ao host do nó.
- Aprovações de execução reduzem o risco de execução acidental, mas não são um limite de autenticação por usuário.
- Execuções aprovadas no host do nó vinculam um contexto de execução canônico: cwd canônico, argv exato, vínculo de env
  quando presente e caminho do executável fixado quando aplicável.
- Para scripts shell e invocações diretas de arquivos de interpretador/runtime, o OpenClaw também tenta vincular
  um operando de arquivo local concreto. Se esse arquivo vinculado mudar após a aprovação, mas antes da execução,
  a execução será negada em vez de executar conteúdo divergente.
- Esse vínculo de arquivo é intencionalmente uma tentativa de melhor esforço, não um modelo semântico completo de todo
  caminho de carregador de interpretador/runtime. Se o modo de aprovação não conseguir identificar exatamente um arquivo
  local concreto para vincular, ele se recusa a emitir uma execução respaldada por aprovação em vez de fingir cobertura completa.

Separação no macOS:

- **serviço do host do nó** encaminha `system.run` para o **app do macOS** por IPC local.
- **app do macOS** aplica aprovações + executa o comando no contexto da interface.

## Configurações e armazenamento

As aprovações vivem em um arquivo JSON local no host de execução:

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

Se você quiser que a execução no host rode sem prompts de aprovação, precisa abrir **ambas** as camadas de política:

- política de execução solicitada na configuração do OpenClaw (`tools.exec.*`)
- política local de aprovações do host em `~/.openclaw/exec-approvals.json`

Esse agora é o comportamento padrão do host, a menos que você o restrinja explicitamente:

- `tools.exec.security`: `full` em `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Distinção importante:

- `tools.exec.host=auto` escolhe onde a execução acontece: sandbox quando disponível, caso contrário gateway.
- YOLO escolhe como a execução no host é aprovada: `security=full` mais `ask=off`.
- No modo YOLO, o OpenClaw não adiciona um controle de aprovação heurístico separado para ofuscação de comando sobre a política configurada de execução no host.
- `auto` não transforma o roteamento para gateway em uma substituição livre a partir de uma sessão em sandbox. Uma solicitação por chamada com `host=node` é permitida a partir de `auto`, e `host=gateway` só é permitido a partir de `auto` quando nenhum runtime de sandbox está ativo. Se você quiser um padrão estável não automático, defina `tools.exec.host` ou use `/exec host=...` explicitamente.

Se quiser uma configuração mais conservadora, restrinja qualquer uma das camadas de volta para `allowlist` / `on-miss`
ou `deny`.

Configuração persistente de host do gateway para "nunca perguntar":

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

Atalho local para a mesma política de host do gateway na máquina atual:

```bash
openclaw exec-policy preset yolo
```

Esse atalho local atualiza ambos:

- `tools.exec.host/security/ask` locais
- padrões locais de `~/.openclaw/exec-approvals.json`

Ele é intencionalmente apenas local. Se você precisar alterar aprovações do host do gateway ou do host do nó
remotamente, continue usando `openclaw approvals set --gateway` ou
`openclaw approvals set --node <id|name|ip>`.

Para um host de nó, aplique o mesmo arquivo de aprovações nesse nó:

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

Limitação importante apenas local:

- `openclaw exec-policy` não sincroniza aprovações de nó
- `openclaw exec-policy set --host node` é rejeitado
- aprovações de execução em nó são obtidas do nó em runtime, então atualizações direcionadas a nó precisam usar `openclaw approvals --node ...`

Atalho apenas de sessão:

- `/exec security=full ask=off` altera apenas a sessão atual.
- `/elevated full` é um atalho de emergência que também ignora aprovações de execução para essa sessão.

Se o arquivo de aprovações do host permanecer mais restritivo do que a configuração, a política mais restritiva do host continua prevalecendo.

## Controles de política

### Segurança (`exec.security`)

- **deny**: bloqueia todas as solicitações de execução no host.
- **allowlist**: permite apenas comandos na lista de permissões.
- **full**: permite tudo (equivalente a elevated).

### Ask (`exec.ask`)

- **off**: nunca exibe prompt.
- **on-miss**: exibe prompt apenas quando a lista de permissões não corresponde.
- **always**: exibe prompt em todo comando.
- confiança durável `allow-always` não suprime prompts quando o modo efetivo de ask é `always`

### Fallback de ask (`askFallback`)

Se um prompt for necessário, mas nenhuma interface estiver acessível, o fallback decide:

- **deny**: bloqueia.
- **allowlist**: permite apenas se a lista de permissões corresponder.
- **full**: permite.

### Endurecimento de eval inline de interpretador (`tools.exec.strictInlineEval`)

Quando `tools.exec.strictInlineEval=true`, o OpenClaw trata formas inline de avaliação de código como apenas por aprovação, mesmo que o binário do interpretador em si esteja na lista de permissões.

Exemplos:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Isso é defesa em profundidade para carregadores de interpretador que não mapeiam de forma limpa
para um único operando de arquivo estável. No modo estrito:

- esses comandos ainda precisam de aprovação explícita;
- `allow-always` não persiste automaticamente novas entradas de lista de permissões para eles.

## Lista de permissões (por agente)

As listas de permissões são **por agente**. Se existirem vários agentes, alterne qual agente você está
editando no app para macOS. Os padrões são **correspondências glob sem distinção entre maiúsculas e minúsculas**.
Os padrões devem resolver para **caminhos de binários** (entradas apenas com basename são ignoradas).
Entradas legadas `agents.default` são migradas para `agents.main` no carregamento.
Encadeamentos de shell, como `echo ok && pwd`, ainda exigem que todo segmento de nível superior satisfaça as regras da lista de permissões.

Exemplos:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Cada entrada de lista de permissões rastreia:

- **id** UUID estável usado para identidade na interface (opcional)
- **último uso** timestamp
- **último comando usado**
- **último caminho resolvido**

## Auto-permitir CLIs de Skills

Quando **Auto-allow skill CLIs** está ativado, executáveis referenciados por Skills conhecidos
são tratados como estando na lista de permissões em nós (nó macOS ou host de nó headless). Isso usa
`skills.bins` via Gateway RPC para buscar a lista de binários de Skills. Desative isso se quiser listas de permissões manuais estritas.

Observações importantes sobre confiança:

- Esta é uma **lista de permissões implícita por conveniência**, separada das entradas manuais de lista de permissões por caminho.
- Ela se destina a ambientes de operador confiável em que Gateway e nó estão no mesmo limite de confiança.
- Se você exige confiança estrita e explícita, mantenha `autoAllowSkills: false` e use apenas entradas manuais de lista de permissões por caminho.

## Bins seguros (somente stdin)

`tools.exec.safeBins` define uma pequena lista de binários **somente stdin** (por exemplo `cut`)
que podem ser executados no modo de lista de permissões **sem** entradas explícitas na lista de permissões. Bins seguros rejeitam
argumentos posicionais de arquivo e tokens semelhantes a caminho, então só podem operar no fluxo de entrada.
Trate isso como um caminho rápido e estreito para filtros de fluxo, não como uma lista geral de confiança.
**Não** adicione binários de interpretador ou runtime (por exemplo `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) a `safeBins`.
Se um comando puder avaliar código, executar subcomandos ou ler arquivos por definição, prefira entradas explícitas de lista de permissões e mantenha prompts de aprovação ativados.
Bins seguros personalizados precisam definir um perfil explícito em `tools.exec.safeBinProfiles.<bin>`.
A validação é determinística apenas pela forma do argv (sem verificações de existência no sistema de arquivos do host), o que
evita comportamento de oráculo de existência de arquivo por diferenças entre permitir/negar.
Opções orientadas a arquivo são negadas para bins seguros padrão (por exemplo `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Bins seguros também aplicam política explícita por binário para flags que quebram o comportamento
somente stdin (por exemplo `sort -o/--output/--compress-program` e flags recursivas do grep).
Opções longas são validadas em modo fail-closed no modo de bin seguro: flags desconhecidas e abreviações ambíguas são rejeitadas.
Flags negadas por perfil de bin seguro:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Bins seguros também forçam tokens do argv a serem tratados como **texto literal** no momento da execução (sem expansão de glob
e sem expansão de `$VARS`) para segmentos somente stdin, então padrões como `*` ou `$HOME/...` não podem
ser usados para contrabandear leituras de arquivo.
Bins seguros também precisam ser resolvidos a partir de diretórios de binários confiáveis (padrões do sistema mais
`tools.exec.safeBinTrustedDirs` opcionais). Entradas de `PATH` nunca são confiáveis automaticamente.
Os diretórios padrão confiáveis para bins seguros são intencionalmente mínimos: `/bin`, `/usr/bin`.
Se o executável do seu bin seguro estiver em caminhos de gerenciador de pacotes/usuário (por exemplo
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), adicione-os explicitamente
a `tools.exec.safeBinTrustedDirs`.
Encadeamento de shell e redirecionamentos não são permitidos automaticamente no modo de lista de permissões.

Encadeamento de shell (`&&`, `||`, `;`) é permitido quando todo segmento de nível superior satisfaz a lista de permissões
(incluindo bins seguros ou auto-permitir de Skills). Redirecionamentos continuam sem suporte no modo de lista de permissões.
Substituição de comando (`$()` / crases) é rejeitada durante a análise da lista de permissões, inclusive dentro de
aspas duplas; use aspas simples se precisar de texto literal `$()`.
Em aprovações do app complementar do macOS, texto bruto de shell contendo sintaxe de controle ou expansão de shell
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) é tratado como falha na lista de permissões, a menos que
o próprio binário do shell esteja na lista de permissões.
Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), substituições de env com escopo de solicitação são reduzidas a uma
pequena lista de permissões explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Para decisões `allow-always` no modo de lista de permissões, wrappers de despacho conhecidos
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem caminhos de executáveis internos em vez de caminhos
do wrapper. Multiplexadores de shell (`busybox`, `toybox`) também são desembrulhados para applets de shell (`sh`, `ash`,
etc.), de modo que executáveis internos sejam persistidos em vez de binários do multiplexador. Se um wrapper ou
multiplexador não puder ser desembrulhado com segurança, nenhuma entrada de lista de permissões será persistida automaticamente.
Se você colocar interpretadores como `python3` ou `node` na lista de permissões, prefira `tools.exec.strictInlineEval=true` para que eval inline ainda exija aprovação explícita. No modo estrito, `allow-always` ainda pode persistir invocações benignas de interpretador/script, mas portadores de eval inline não são persistidos automaticamente.

Bins seguros padrão:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` e `sort` não estão na lista padrão. Se você optar por incluí-los, mantenha entradas explícitas de lista de permissões para
seus fluxos de trabalho que não sejam de stdin.
Para `grep` no modo de bin seguro, forneça o padrão com `-e`/`--regexp`; a forma posicional do padrão é
rejeitada para que operandos de arquivo não possam ser contrabandeados como posicionais ambíguos.

### Bins seguros versus lista de permissões

| Tópico           | `tools.exec.safeBins`                                  | Lista de permissões (`exec-approvals.json`)                  |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Objetivo         | Permitir automaticamente filtros estreitos de stdin    | Confiar explicitamente em executáveis específicos            |
| Tipo de correspondência | Nome do executável + política de argv de bin seguro | Padrão glob do caminho resolvido do executável               |
| Escopo dos argumentos | Restrito pelo perfil do bin seguro e regras de token literal | Apenas correspondência de caminho; os argumentos são sua responsabilidade |
| Exemplos típicos | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLIs personalizadas       |
| Melhor uso       | Transformações de texto de baixo risco em pipelines    | Qualquer ferramenta com comportamento mais amplo ou efeitos colaterais |

Local da configuração:

- `safeBins` vem da configuração (`tools.exec.safeBins` ou `agents.list[].tools.exec.safeBins` por agente).
- `safeBinTrustedDirs` vem da configuração (`tools.exec.safeBinTrustedDirs` ou `agents.list[].tools.exec.safeBinTrustedDirs` por agente).
- `safeBinProfiles` vem da configuração (`tools.exec.safeBinProfiles` ou `agents.list[].tools.exec.safeBinProfiles` por agente). Chaves de perfil por agente substituem as globais.
- entradas de lista de permissões ficam no `~/.openclaw/exec-approvals.json` local do host em `agents.<id>.allowlist` (ou via Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` emite aviso com `tools.exec.safe_bins_interpreter_unprofiled` quando bins de interpretador/runtime aparecem em `safeBins` sem perfis explícitos.
- `openclaw doctor --fix` pode gerar entradas ausentes de `safeBinProfiles.<bin>` como `{}` (revise e restrinja depois). Bins de interpretador/runtime não são gerados automaticamente.

Exemplo de perfil personalizado:
__OC_I18N_900005__
Se você optar explicitamente por incluir `jq` em `safeBins`, o OpenClaw ainda rejeita o builtin `env` no modo de bin seguro,
para que `jq -n env` não possa despejar o ambiente do processo do host sem um caminho explícito na lista de permissões
ou um prompt de aprovação.

## Edição na Control UI

Use o cartão **Control UI → Nodes → Exec approvals** para editar padrões, substituições
por agente e listas de permissões. Escolha um escopo (Defaults ou um agente), ajuste a política,
adicione/remova padrões da lista de permissões e clique em **Save**. A interface mostra metadados de **último uso**
por padrão para que você possa manter a lista organizada.

O seletor de destino escolhe **Gateway** (aprovações locais) ou um **Node**. Nós
precisam anunciar `system.execApprovals.get/set` (app do macOS ou host de nó headless).
Se um nó ainda não anunciar aprovações de execução, edite seu
`~/.openclaw/exec-approvals.json` local diretamente.

CLI: `openclaw approvals` oferece suporte à edição de gateway ou nó (consulte [Approvals CLI](/cli/approvals)).

## Fluxo de aprovação

Quando um prompt é necessário, o gateway transmite `exec.approval.requested` para clientes operadores.
A Control UI e o app do macOS o resolvem via `exec.approval.resolve`, então o gateway encaminha a
solicitação aprovada para o host do nó.

Para `host=node`, as solicitações de aprovação incluem um payload canônico `systemRunPlan`. O gateway usa
esse plano como contexto autoritativo de comando/cwd/sessão ao encaminhar solicitações aprovadas de `system.run`.

Isso importa para a latência de aprovação assíncrona:

- o caminho de execução no nó prepara um plano canônico antecipadamente
- o registro de aprovação armazena esse plano e seus metadados de vínculo
- uma vez aprovado, a chamada final encaminhada de `system.run` reutiliza o plano armazenado
  em vez de confiar em edições posteriores do chamador
- se o chamador alterar `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` após a criação da solicitação de aprovação, o gateway rejeita a
  execução encaminhada como incompatibilidade de aprovação

## Comandos de interpretador/runtime

Execuções de interpretador/runtime respaldadas por aprovação são intencionalmente conservadoras:

- O contexto exato de argv/cwd/env é sempre vinculado.
- Formas diretas de script shell e de arquivo de runtime direto são vinculadas por melhor esforço a um único snapshot de arquivo local concreto.
- Formas comuns de wrapper de gerenciador de pacotes que ainda resolvem para um único arquivo local direto (por exemplo
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) são desembrulhadas antes do vínculo.
- Se o OpenClaw não conseguir identificar exatamente um único arquivo local concreto para um comando de interpretador/runtime
  (por exemplo scripts de pacote, formas eval, cadeias de carregador específicas de runtime ou
  formas ambíguas com vários arquivos), a execução respaldada por aprovação é negada em vez de alegar cobertura semântica
  que ela não tem.
- Para esses fluxos de trabalho, prefira sandbox, um limite de host separado ou um fluxo explícito de
  lista de permissões/full confiável em que o operador aceite a semântica mais ampla de runtime.

Quando aprovações são necessárias, a ferramenta de execução retorna imediatamente com um ID de aprovação. Use esse ID para
correlacionar eventos posteriores do sistema (`Exec finished` / `Exec denied`). Se nenhuma decisão chegar antes do
tempo limite, a solicitação é tratada como tempo limite de aprovação e exibida como motivo de negação.

### Comportamento de entrega de acompanhamento

Após a conclusão de uma execução assíncrona aprovada, o OpenClaw envia um turno de `agent` de acompanhamento para a mesma sessão.

- Se existir um destino externo de entrega válido (canal entregável mais destino `to`), a entrega de acompanhamento usa esse canal.
- Em fluxos somente de webchat ou de sessão interna sem destino externo, a entrega de acompanhamento permanece apenas na sessão (`deliver: false`).
- Se um chamador solicitar explicitamente entrega externa estrita sem canal externo resolvível, a solicitação falha com `INVALID_REQUEST`.
- Se `bestEffortDeliver` estiver ativado e nenhum canal externo puder ser resolvido, a entrega é rebaixada para apenas sessão em vez de falhar.

A caixa de diálogo de confirmação inclui:

- comando + argumentos
- cwd
- ID do agente
- caminho resolvido do executável
- metadados de host + política

Ações:

- **Allow once** → executa agora
- **Always allow** → adiciona à lista de permissões + executa
- **Deny** → bloqueia

## Encaminhamento de aprovação para canais de chat

Você pode encaminhar prompts de aprovação de execução para qualquer canal de chat (incluindo canais de plugin) e aprová-los
com `/approve`. Isso usa o pipeline normal de entrega de saída.

Configuração:
__OC_I18N_900006__
Responder no chat:
__OC_I18N_900007__
O comando `/approve` lida tanto com aprovações de execução quanto com aprovações de plugin. Se o ID não corresponder a uma aprovação de execução pendente, ele automaticamente verifica aprovações de plugin.

### Encaminhamento de aprovação de plugin

O encaminhamento de aprovação de plugin usa o mesmo pipeline de entrega das aprovações de execução, mas tem sua própria
configuração independente em `approvals.plugin`. Ativar ou desativar um não afeta o outro.
__OC_I18N_900008__
A forma da configuração é idêntica à de `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` e `targets` funcionam da mesma maneira.

Canais que oferecem suporte a respostas interativas compartilhadas exibem os mesmos botões de aprovação tanto para aprovações de execução quanto para aprovações de plugin. Canais sem interface interativa compartilhada recorrem a texto simples com instruções de `/approve`.

### Aprovações no mesmo chat em qualquer canal

Quando uma solicitação de aprovação de execução ou plugin se origina em uma superfície de chat entregável, esse mesmo chat
agora pode aprová-la com `/approve` por padrão. Isso se aplica a canais como Slack, Matrix e
Microsoft Teams, além dos fluxos já existentes da Web UI e da interface de terminal.

Esse caminho compartilhado de comando de texto usa o modelo normal de autenticação do canal para essa conversa. Se o
chat de origem já consegue enviar comandos e receber respostas, as solicitações de aprovação não precisam mais de um
adaptador de entrega nativo separado apenas para permanecerem pendentes.

Discord e Telegram também oferecem suporte a `/approve` no mesmo chat, mas esses canais ainda usam sua
lista resolvida de aprovadores para autorização mesmo quando a entrega nativa de aprovação está desativada.

Para Telegram e outros clientes nativos de aprovação que chamam o Gateway diretamente,
esse fallback é intencionalmente limitado a falhas de "aprovação não encontrada". Uma negação/erro real de
aprovação de execução não tenta silenciosamente novamente como aprovação de plugin.

### Entrega nativa de aprovação

Alguns canais também podem atuar como clientes nativos de aprovação. Clientes nativos adicionam mensagens diretas para aprovadores, fanout para o chat de origem e UX interativa de aprovação específica do canal sobre o fluxo compartilhado de `/approve` no mesmo chat.

Quando cartões/botões nativos de aprovação estiverem disponíveis, essa interface nativa será o caminho principal
voltado ao agente. O agente não deve também ecoar um comando de chat simples `/approve`
duplicado, a menos que o resultado da ferramenta diga que aprovações por chat não estão disponíveis ou que
a aprovação manual é o único caminho restante.

Modelo genérico:

- a política de execução no host ainda decide se a aprovação de execução é necessária
- `approvals.exec` controla o encaminhamento de prompts de aprovação para outros destinos de chat
- `channels.<channel>.execApprovals` controla se esse canal atua como cliente nativo de aprovação

Clientes nativos de aprovação ativam automaticamente a entrega primeiro por DM quando todas estas condições são verdadeiras:

- o canal oferece suporte à entrega nativa de aprovação
- aprovadores podem ser resolvidos a partir de `execApprovals.approvers` explícito ou das
  fontes de fallback documentadas desse canal
- `channels.<channel>.execApprovals.enabled` está indefinido ou é `"auto"`

Defina `enabled: false` para desativar explicitamente um cliente nativo de aprovação. Defina `enabled: true` para forçá-lo
quando os aprovadores forem resolvidos. A entrega pública no chat de origem continua explícita por meio de
`channels.<channel>.execApprovals.target`.

FAQ: [Por que existem duas configurações de aprovação de execução para aprovações por chat?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Esses clientes nativos de aprovação adicionam roteamento por DM e fanout opcional por canal sobre o fluxo compartilhado
de `/approve` no mesmo chat e os botões compartilhados de aprovação.

Comportamento compartilhado:

- Slack, Matrix, Microsoft Teams e chats entregáveis semelhantes usam o modelo normal de autenticação do canal
  para `/approve` no mesmo chat
- quando um cliente nativo de aprovação é ativado automaticamente, o alvo padrão de entrega nativa são as DMs dos aprovadores
- para Discord e Telegram, somente aprovadores resolvidos podem aprovar ou negar
- aprovadores do Discord podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- aprovadores do Telegram podem ser explícitos (`execApprovals.approvers`) ou inferidos da configuração de proprietário existente (`allowFrom`, mais `defaultTo` de mensagem direta quando compatível)
- aprovadores do Slack podem ser explícitos (`execApprovals.approvers`) ou inferidos de `commands.ownerAllowFrom`
- botões nativos do Slack preservam o tipo do ID de aprovação, então IDs `plugin:` podem resolver aprovações de plugin
  sem uma segunda camada de fallback local do Slack
- roteamento nativo de DM/canal do Matrix e atalhos por reação tratam aprovações de execução e de plugin;
  a autorização de plugin ainda vem de `channels.matrix.dm.allowFrom`
- o solicitante não precisa ser um aprovador
- o chat de origem pode aprovar diretamente com `/approve` quando esse chat já oferece suporte a comandos e respostas
- botões nativos de aprovação do Discord fazem o roteamento pelo tipo do ID de aprovação: IDs `plugin:` vão
  diretamente para aprovações de plugin, todo o restante vai para aprovações de execução
- botões nativos de aprovação do Telegram seguem o mesmo fallback limitado de execução para plugin que `/approve`
- quando `target` nativo ativa a entrega no chat de origem, os prompts de aprovação incluem o texto do comando
- aprovações de execução pendentes expiram após 30 minutos por padrão
- se nenhuma interface de operador ou cliente de aprovação configurado puder aceitar a solicitação, o prompt recorre a `askFallback`

O Telegram usa por padrão DMs de aprovador (`target: "dm"`). Você pode mudar para `channel` ou `both` quando
quiser que prompts de aprovação também apareçam no chat/tópico de origem do Telegram. Para tópicos de fórum do Telegram, o OpenClaw preserva o tópico para o prompt de aprovação e para o acompanhamento após a aprovação.

Consulte:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Fluxo IPC no macOS
__OC_I18N_900009__
Observações de segurança:

- Modo do socket Unix `0600`, token armazenado em `exec-approvals.json`.
- Verificação de peer com mesmo UID.
- Desafio/resposta (nonce + token HMAC + hash da solicitação) + TTL curto.

## Eventos do sistema

O ciclo de vida de execução é exposto como mensagens do sistema:

- `Exec running` (somente se o comando exceder o limite de aviso de execução)
- `Exec finished`
- `Exec denied`

Essas mensagens são publicadas na sessão do agente depois que o nó informa o evento.
Aprovações de execução no host do gateway emitem os mesmos eventos de ciclo de vida quando o comando termina (e opcionalmente quando fica em execução além do limite).
Execuções controladas por aprovação reutilizam o ID da aprovação como `runId` nessas mensagens para facilitar a correlação.

## Comportamento de aprovação negada

Quando uma aprovação de execução assíncrona é negada, o OpenClaw impede que o agente reutilize
saída de qualquer execução anterior do mesmo comando na sessão. O motivo da negação
é passado com orientação explícita de que nenhuma saída do comando está disponível, o que impede
o agente de alegar que há nova saída ou repetir o comando negado com
resultados desatualizados de uma execução anterior bem-sucedida.

## Implicações

- **full** é poderoso; prefira listas de permissões quando possível.
- **ask** mantém você no circuito e ainda permite aprovações rápidas.
- Listas de permissões por agente impedem que aprovações de um agente vazem para outros.
- Aprovações só se aplicam a solicitações de execução no host de **remetentes autorizados**. Remetentes não autorizados não podem emitir `/exec`.
- `/exec security=full` é uma conveniência em nível de sessão para operadores autorizados e ignora aprovações por definição.
  Para bloquear rigidamente a execução no host, defina a segurança das aprovações como `deny` ou negue a ferramenta `exec` via política de ferramentas.

Relacionado:

- [Exec tool](/pt-BR/tools/exec)
- [Elevated mode](/pt-BR/tools/elevated)
- [Skills](/pt-BR/tools/skills)

## Relacionado

- [Exec](/pt-BR/tools/exec) — ferramenta de execução de comandos de shell
- [Sandboxing](/pt-BR/gateway/sandboxing) — modos de sandbox e acesso ao workspace
- [Security](/pt-BR/gateway/security) — modelo de segurança e endurecimento
- [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) — quando usar cada um
