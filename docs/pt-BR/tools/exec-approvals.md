---
read_when:
    - Configurando aprovações de execução ou listas de permissões
    - Implementando a UX de aprovação de exec no aplicativo macOS
    - Analisando prompts de escape de sandbox e suas implicações
sidebarTitle: Exec approvals
summary: 'Aprovações de execução no host: controles de política, listas de permissões e o fluxo de trabalho YOLO/estrito'
title: Aprovações de execução
x-i18n:
    generated_at: "2026-04-30T10:11:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71c16d0e547c4dd42a351d37e37e97b681a062cd496d5e0cba923b54c8f5b0e9
    source_path: tools/exec-approvals.md
    workflow: 16
---

As aprovações de execução são o **guardrail do app complementar / host de Node** para permitir que
um agente em sandbox execute comandos em um host real (`gateway` ou `node`). Um
intertravamento de segurança: comandos são permitidos somente quando a política + allowlist +
aprovação do usuário (opcional) concordam. As aprovações de execução ficam **sobrepostas**
à política de ferramentas e ao gate elevado (a menos que elevado esteja definido como `full`, o que
ignora as aprovações).

<Note>
A política efetiva é a **mais restrita** entre `tools.exec.*` e os padrões de aprovações;
se um campo de aprovações for omitido, o valor de `tools.exec` será usado. A execução no host também usa o estado local de aprovações nessa máquina — um
`ask: "always"` local ao host em `~/.openclaw/exec-approvals.json` continua
solicitando confirmação mesmo que a sessão ou os padrões de configuração solicitem `ask: "on-miss"`.
</Note>

## Inspecionando a política efetiva

| Comando                                                          | O que ele mostra                                                                        |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Política solicitada, origens de política do host e o resultado efetivo.                |
| `openclaw exec-policy show`                                      | Visão mesclada da máquina local.                                                       |
| `openclaw exec-policy set` / `preset`                            | Sincroniza a política local solicitada com o arquivo local de aprovações do host em uma etapa. |

Quando um escopo local solicita `host=node`, `exec-policy show` informa esse
escopo como gerenciado pelo Node em runtime, em vez de fingir que o arquivo local
de aprovações é a fonte da verdade.

Se a UI do app complementar **não estiver disponível**, qualquer solicitação que
normalmente exibiria um prompt será resolvida pelo **fallback de ask** (padrão: `deny`).

<Tip>
Clientes nativos de aprovação por chat podem semear affordances específicas do canal na
mensagem de aprovação pendente. Por exemplo, Matrix semeia atalhos de reação
(`✅` permitir uma vez, `❌` negar, `♾️` sempre permitir) enquanto ainda deixa
comandos `/approve ...` na mensagem como fallback.
</Tip>

## Onde se aplica

As aprovações de execução são aplicadas localmente no host de execução:

- **Host do Gateway** → processo `openclaw` na máquina Gateway.
- **Host de Node** → executor de Node (app complementar do macOS ou host de Node headless).

### Modelo de confiança

- Chamadores autenticados pelo Gateway são operadores confiáveis para esse Gateway.
- Nodes pareados estendem essa capacidade de operador confiável para o host de Node.
- As aprovações de execução reduzem o risco de execução acidental, mas **não** são um limite de autenticação por usuário.
- Execuções aprovadas em host de Node vinculam o contexto de execução canônico: cwd canônico, argv exato, vínculo de env quando presente e caminho fixado do executável quando aplicável.
- Para scripts shell e invocações diretas de arquivos de interpretador/runtime, o OpenClaw também tenta vincular um operando de arquivo local concreto. Se esse arquivo vinculado mudar após a aprovação, mas antes da execução, a execução será negada em vez de executar conteúdo divergente.
- O vínculo de arquivo é intencionalmente de melhor esforço, **não** um modelo semântico completo de todo caminho de carregador de interpretador/runtime. Se o modo de aprovação não conseguir identificar exatamente um arquivo local concreto para vincular, ele se recusa a emitir uma execução respaldada por aprovação em vez de fingir cobertura completa.

### Divisão no macOS

- O **serviço de host de Node** encaminha `system.run` para o **app macOS** por IPC local.
- O **app macOS** aplica aprovações e executa o comando no contexto da UI.

## Configurações e armazenamento

As aprovações ficam em um arquivo JSON local no host de execução:

```text
~/.openclaw/exec-approvals.json
```

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
          "source": "allow-always",
          "commandText": "rg -n TODO",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Controles de política

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` — bloqueia todas as solicitações de execução no host.
  - `allowlist` — permite somente comandos na allowlist.
  - `full` — permite tudo (equivalente a elevado).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — nunca solicita confirmação.
  - `on-miss` — solicita confirmação somente quando a allowlist não corresponde.
  - `always` — solicita confirmação em todos os comandos. A confiança durável de `allow-always` **não** suprime prompts quando o modo ask efetivo é `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Resolução quando um prompt é necessário, mas nenhuma UI está acessível.

- `deny` — bloqueia.
- `allowlist` — permite somente se a allowlist corresponder.
- `full` — permite.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Quando `true`, o OpenClaw trata formas inline de avaliação de código como somente por aprovação
  mesmo que o binário do interpretador em si esteja na allowlist. Defesa em profundidade
  para carregadores de interpretador que não mapeiam de forma limpa para um operando
  de arquivo estável.
</ParamField>

Exemplos que o modo estrito captura:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

No modo estrito, esses comandos ainda precisam de aprovação explícita, e
`allow-always` não persiste automaticamente novas entradas de allowlist para eles.

## Modo YOLO (sem aprovação)

Se você quiser que a execução no host rode sem prompts de aprovação, deverá abrir
**ambas** as camadas de política — a política de execução solicitada na configuração do OpenClaw
(`tools.exec.*`) **e** a política de aprovações local ao host em
`~/.openclaw/exec-approvals.json`.

YOLO é o comportamento padrão do host, a menos que você o restrinja explicitamente:

| Camada                | Configuração YOLO         |
| --------------------- | ------------------------- |
| `tools.exec.security` | `full` em `gateway`/`node` |
| `tools.exec.ask`      | `off`                     |
| Host `askFallback`    | `full`                    |

<Warning>
**Distinções importantes:**

- `tools.exec.host=auto` escolhe **onde** a execução roda: sandbox quando disponível, caso contrário Gateway.
- YOLO escolhe **como** a execução no host é aprovada: `security=full` mais `ask=off`.
- No modo YOLO, o OpenClaw **não** adiciona um gate heurístico separado de aprovação de ofuscação de comando nem uma camada de rejeição de preflight de script sobre a política configurada de execução no host.
- `auto` não torna o roteamento para Gateway uma substituição livre a partir de uma sessão em sandbox. Uma solicitação por chamada `host=node` é permitida a partir de `auto`; `host=gateway` só é permitido a partir de `auto` quando nenhum runtime de sandbox está ativo. Para um padrão não automático estável, defina `tools.exec.host` ou use `/exec host=...` explicitamente.

</Warning>

Provedores baseados em CLI que expõem seu próprio modo de permissão não interativo
podem seguir essa política. O Claude CLI adiciona
`--permission-mode bypassPermissions` quando a política de execução solicitada do OpenClaw
é YOLO. Substitua esse comportamento de backend com argumentos explícitos do Claude
em `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` —
por exemplo `--permission-mode default`, `acceptEdits` ou
`bypassPermissions`.

Se você quiser uma configuração mais conservadora, restrinja qualquer uma das camadas de volta para
`allowlist` / `on-miss` ou `deny`.

### Configuração persistente "nunca solicitar confirmação" do host Gateway

<Steps>
  <Step title="Defina a política de configuração solicitada">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Faça o arquivo de aprovações do host corresponder">
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
  </Step>
</Steps>

### Atalho local

```bash
openclaw exec-policy preset yolo
```

Esse atalho local atualiza ambos:

- `tools.exec.host/security/ask` local.
- Padrões locais de `~/.openclaw/exec-approvals.json`.

Ele é intencionalmente somente local. Para alterar aprovações de host Gateway ou host de Node
remotamente, use `openclaw approvals set --gateway` ou
`openclaw approvals set --node <id|name|ip>`.

### Host de Node

Para um host de Node, aplique o mesmo arquivo de aprovações nesse Node:

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

<Note>
**Limitações somente locais:**

- `openclaw exec-policy` não sincroniza aprovações de Node.
- `openclaw exec-policy set --host node` é rejeitado.
- Aprovações de execução de Node são buscadas do Node em runtime, portanto atualizações direcionadas ao Node devem usar `openclaw approvals --node ...`.

</Note>

### Atalho somente de sessão

- `/exec security=full ask=off` altera somente a sessão atual.
- `/elevated full` é um atalho de emergência que também ignora aprovações de execução nessa sessão.

Se o arquivo de aprovações do host permanecer mais restrito que a configuração, a política
mais restritiva do host ainda prevalece.

## Allowlist (por agente)

Allowlists são **por agente**. Se houver múltiplos agentes, alterne qual agente
você está editando no app macOS. Os padrões são correspondências glob.

Os padrões podem ser globs de caminho de binário resolvido ou globs de nome de comando simples.
Nomes simples correspondem somente a comandos invocados por meio de `PATH`, então `rg` pode corresponder a
`/opt/homebrew/bin/rg` quando o comando é `rg`, mas **não** a `./rg` ou
`/tmp/rg`. Use um glob de caminho quando quiser confiar em um local específico
de binário.

Entradas legadas de `agents.default` são migradas para `agents.main` ao carregar.
Cadeias shell como `echo ok && pwd` ainda precisam que cada segmento de nível superior
satisfaça as regras de allowlist.

Exemplos:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Cada entrada de allowlist rastreia:

| Campo              | Significado                              |
| ------------------ | ---------------------------------------- |
| `id`               | UUID estável usado para identidade na UI |
| `lastUsedAt`       | Timestamp do último uso                  |
| `lastUsedCommand`  | Último comando correspondente            |
| `lastResolvedPath` | Último caminho de binário resolvido      |

## Permissão automática para CLIs de Skills

Quando **Permissão automática para CLIs de Skills** está habilitada, executáveis referenciados por
Skills conhecidas são tratados como presentes na allowlist em Nodes (Node macOS ou host de
Node headless). Isso usa `skills.bins` sobre o RPC do Gateway para buscar a
lista de bins da Skill. Desabilite isto se quiser allowlists manuais estritas.

<Warning>
- Esta é uma **allowlist implícita de conveniência**, separada de entradas manuais de allowlist por caminho.
- Ela se destina a ambientes de operadores confiáveis em que Gateway e Node estão no mesmo limite de confiança.
- Se você exigir confiança explícita estrita, mantenha `autoAllowSkills: false` e use somente entradas manuais de allowlist por caminho.

</Warning>

## Bins seguros e encaminhamento de aprovações

Para bins seguros (o caminho rápido somente por stdin), detalhes de vínculo de interpretador e
como encaminhar prompts de aprovação para Slack/Discord/Telegram (ou executá-los como
clientes nativos de aprovação), consulte
[Aprovações de execução — avançado](/pt-BR/tools/exec-approvals-advanced).

## Edição na UI de Controle

Use o cartão **UI de Controle → Nodes → Aprovações de execução** para editar padrões,
substituições por agente e allowlists. Escolha um escopo (Padrões ou um agente),
ajuste a política, adicione/remova padrões de allowlist e então **Salvar**. A UI
mostra metadados de último uso por padrão para que você possa manter a lista organizada.

O seletor de destino escolhe **Gateway** (aprovações locais) ou um **Node**.
Nodes precisam anunciar `system.execApprovals.get/set` (app macOS ou
host de Node headless). Se um Node ainda não anunciar aprovações de exec,
edite diretamente seu `~/.openclaw/exec-approvals.json` local.

CLI: `openclaw approvals` oferece suporte à edição de Gateway ou Node — consulte
[CLI de aprovações](/pt-BR/cli/approvals).

## Fluxo de aprovação

Quando um prompt é necessário, o Gateway transmite
`exec.approval.requested` para clientes operadores. A Interface de Controle e o app macOS
o resolvem via `exec.approval.resolve`; então o Gateway encaminha a
solicitação aprovada ao host do Node.

Para `host=node`, as solicitações de aprovação incluem uma carga `systemRunPlan`
canônica. O Gateway usa esse plano como o contexto autoritativo de
comando/cwd/sessão ao encaminhar solicitações `system.run`
aprovadas.

Isso importa para a latência de aprovação assíncrona:

- O caminho de exec do Node prepara um plano canônico antecipadamente.
- O registro de aprovação armazena esse plano e seus metadados de vinculação.
- Após a aprovação, a chamada `system.run` final encaminhada reutiliza o plano armazenado em vez de confiar em edições posteriores do chamador.
- Se o chamador alterar `command`, `rawCommand`, `cwd`, `agentId` ou `sessionKey` depois que a solicitação de aprovação foi criada, o Gateway rejeita a execução encaminhada como uma incompatibilidade de aprovação.

## Eventos do sistema

O ciclo de vida de exec é exposto como mensagens do sistema:

- `Exec running` (somente se o comando exceder o limite de aviso de execução).
- `Exec finished`.
- `Exec denied`.

Elas são publicadas na sessão do agente depois que o Node relata o evento.
Aprovações de exec hospedadas no Gateway emitem os mesmos eventos de ciclo de vida quando o
comando termina (e, opcionalmente, quando fica em execução por mais tempo que o limite).
Execs protegidos por aprovação reutilizam o ID de aprovação como `runId` nessas
mensagens para facilitar a correlação.

## Comportamento de aprovação negada

Quando uma aprovação de exec assíncrona é negada, o OpenClaw impede que o agente
reutilize a saída de qualquer execução anterior do mesmo comando na sessão.
O motivo da negação é passado com orientação explícita de que nenhuma saída de comando
está disponível, o que impede o agente de afirmar que há nova saída ou
repetir o comando negado com resultados obsoletos de uma execução bem-sucedida
anterior.

## Implicações

- **`full`** é poderoso; prefira listas de permissão quando possível.
- **`ask`** mantém você no processo, ainda permitindo aprovações rápidas.
- Listas de permissão por agente impedem que as aprovações de um agente vazem para outros.
- Aprovações se aplicam apenas a solicitações de exec do host feitas por **remetentes autorizados**. Remetentes não autorizados não podem emitir `/exec`.
- `/exec security=full` é uma conveniência no nível da sessão para operadores autorizados e ignora aprovações por design. Para bloquear exec do host de forma rígida, defina a segurança de aprovações como `deny` ou negue a ferramenta `exec` via política de ferramentas.

## Relacionado

<CardGroup cols={2}>
  <Card title="Exec approvals — advanced" href="/pt-BR/tools/exec-approvals-advanced" icon="gear">
    Bins seguros, vinculação de interpretador e encaminhamento de aprovação para chat.
  </Card>
  <Card title="Exec tool" href="/pt-BR/tools/exec" icon="terminal">
    Ferramenta de execução de comandos shell.
  </Card>
  <Card title="Elevated mode" href="/pt-BR/tools/elevated" icon="shield-exclamation">
    Caminho emergencial que também ignora aprovações.
  </Card>
  <Card title="Sandboxing" href="/pt-BR/gateway/sandboxing" icon="box">
    Modos de sandbox e acesso ao workspace.
  </Card>
  <Card title="Security" href="/pt-BR/gateway/security" icon="lock">
    Modelo de segurança e hardening.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Quando usar cada controle.
  </Card>
  <Card title="Skills" href="/pt-BR/tools/skills" icon="sparkles">
    Comportamento de permissão automática baseado em Skills.
  </Card>
</CardGroup>
