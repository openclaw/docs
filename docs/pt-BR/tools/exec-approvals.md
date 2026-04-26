---
read_when:
    - Configurando aprovações de execução ou listas de permissões
    - Implementando a UX de aprovação de execução no app para macOS
    - Revisando prompts de escape do sandbox e suas implicações
sidebarTitle: Exec approvals
summary: 'Aprovações de execução no host: opções de política, listas de permissões e o fluxo YOLO/strict'
title: Aprovações de execução
x-i18n:
    generated_at: "2026-04-26T11:38:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 868cee97882f7298a092bdcb9ec8fd058a5d7cb8745fad2edd712fabfb512e52
    source_path: tools/exec-approvals.md
    workflow: 15
---

As aprovações de execução são a **proteção do app complementar / host Node** para permitir que um agente em sandbox execute comandos em um host real (`gateway` ou `node`). É um intertravamento de segurança: os comandos só são permitidos quando política + lista de permissões + aprovação do usuário (opcional) concordam. As aprovações de execução se acumulam **por cima de** da política de ferramentas e do controle elevated (a menos que elevated esteja definido como `full`, o que ignora as aprovações).

<Note>
A política efetiva é a **mais restritiva** entre `tools.exec.*` e os padrões de aprovações; se um campo de aprovações for omitido, o valor de `tools.exec` será usado. A execução no host também usa o estado local de aprovações naquela máquina — um `ask: "always"` definido localmente no host em `~/.openclaw/exec-approvals.json` continuará pedindo aprovação mesmo se a sessão ou os padrões de configuração solicitarem `ask: "on-miss"`.
</Note>

## Inspecionando a política efetiva

| Command                                                          | O que mostra                                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Política solicitada, fontes de política do host e o resultado efetivo.               |
| `openclaw exec-policy show`                                      | Visão mesclada da máquina local.                                                      |
| `openclaw exec-policy set` / `preset`                            | Sincroniza a política local solicitada com o arquivo local de aprovações do host em uma única etapa. |

Quando um escopo local solicita `host=node`, `exec-policy show` relata esse escopo como gerenciado pelo Node em tempo de execução em vez de fingir que o arquivo local de aprovações é a fonte da verdade.

Se a UI do app complementar **não estiver disponível**, qualquer solicitação que normalmente exibiria um prompt será resolvida pelo **fallback de ask** (padrão: `deny`).

<Tip>
Clientes nativos de aprovação por chat podem semear affordances específicas do canal na mensagem de aprovação pendente. Por exemplo, o Matrix semeia atalhos de reação (`✅` permitir uma vez, `❌` negar, `♾️` permitir sempre) enquanto ainda deixa comandos `/approve ...` na mensagem como fallback.
</Tip>

## Onde isso se aplica

As aprovações de execução são aplicadas localmente no host de execução:

- **Host Gateway** → processo `openclaw` na máquina do gateway.
- **Host Node** → executor do node (app complementar do macOS ou host Node sem interface).

### Modelo de confiança

- Chamadores autenticados pelo Gateway são operadores confiáveis para aquele Gateway.
- Nodes pareados estendem essa capacidade de operador confiável para o host Node.
- As aprovações de execução reduzem o risco de execução acidental, mas **não** são um limite de autenticação por usuário.
- Execuções aprovadas no host Node vinculam o contexto canônico de execução: `cwd` canônico, `argv` exato, vínculo de ambiente quando presente e caminho fixado do executável quando aplicável.
- Para scripts de shell e invocações diretas de arquivos de interpretador/runtime, o OpenClaw também tenta vincular um operando de arquivo local concreto. Se esse arquivo vinculado mudar após a aprovação, mas antes da execução, a execução é negada em vez de executar conteúdo alterado.
- A vinculação de arquivos é intencionalmente por melhor esforço, **não** um modelo semântico completo de todos os caminhos de carregamento de interpretadores/runtimes. Se o modo de aprovação não conseguir identificar exatamente um arquivo local concreto para vincular, ele se recusa a emitir uma execução respaldada por aprovação em vez de fingir cobertura total.

### Divisão no macOS

- O **serviço host Node** encaminha `system.run` para o **app do macOS** por IPC local.
- O **app do macOS** aplica as aprovações e executa o comando no contexto da UI.

## Configurações e armazenamento

As aprovações ficam em um arquivo JSON local no host de execução:

```text
~/.openclaw/exec-approvals.json
```

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

## Opções de política

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` — bloqueia todas as solicitações de execução no host.
  - `allowlist` — permite apenas comandos na lista de permissões.
  - `full` — permite tudo (equivalente a elevated).
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — nunca pede aprovação.
  - `on-miss` — pede aprovação apenas quando a lista de permissões não corresponde.
  - `always` — pede aprovação para todo comando. A confiança durável `allow-always` **não** suprime prompts quando o modo efetivo de ask é `always`.
</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Resolução quando uma aprovação é necessária, mas nenhuma UI está acessível.

- `deny` — bloqueia.
- `allowlist` — permite apenas se corresponder à lista de permissões.
- `full` — permite.
  </ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Quando `true`, o OpenClaw trata formas inline de avaliação de código como
  exigindo aprovação mesmo que o binário do interpretador em si esteja na lista de permissões. Defesa em profundidade
  para carregadores de interpretador que não se mapeiam claramente para um único
  operando de arquivo estável.
</ParamField>

Exemplos que o modo estrito detecta:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

No modo estrito, esses comandos ainda exigem aprovação explícita, e
`allow-always` não persiste automaticamente novas entradas na lista de permissões para eles.

## Modo YOLO (sem aprovação)

Se você quiser que a execução no host ocorra sem prompts de aprovação, deverá abrir
**ambas** as camadas de política — a política de execução solicitada na configuração do OpenClaw
(`tools.exec.*`) **e** a política local de aprovações do host em
`~/.openclaw/exec-approvals.json`.

YOLO é o comportamento padrão do host, a menos que você o restrinja explicitamente:

| Layer                 | Configuração YOLO           |
| --------------------- | --------------------------- |
| `tools.exec.security` | `full` em `gateway`/`node`  |
| `tools.exec.ask`      | `off`                       |
| Host `askFallback`    | `full`                      |

<Warning>
**Distinções importantes:**

- `tools.exec.host=auto` escolhe **onde** a execução ocorre: sandbox quando disponível, caso contrário gateway.
- YOLO escolhe **como** a execução no host é aprovada: `security=full` mais `ask=off`.
- No modo YOLO, o OpenClaw **não** adiciona uma porta de aprovação heurística separada para ofuscação de comandos nem uma camada de rejeição prévia de scripts por cima da política configurada de execução no host.
- `auto` não transforma o roteamento para gateway em uma substituição livre a partir de uma sessão em sandbox. Uma solicitação por chamada `host=node` é permitida a partir de `auto`; `host=gateway` só é permitido a partir de `auto` quando nenhum runtime de sandbox está ativo. Para um padrão estável diferente de auto, defina `tools.exec.host` ou use `/exec host=...` explicitamente.
  </Warning>

Provedores baseados em CLI que expõem seu próprio modo de permissão não interativo
podem seguir essa política. O Claude CLI adiciona
`--permission-mode bypassPermissions` quando a política de execução solicitada pelo OpenClaw
é YOLO. Substitua esse comportamento do backend com argumentos explícitos do Claude
em `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` —
por exemplo `--permission-mode default`, `acceptEdits` ou
`bypassPermissions`.

Se você quiser uma configuração mais conservadora, restrinja qualquer uma das camadas de volta para
`allowlist` / `on-miss` ou `deny`.

### Configuração persistente de "nunca pedir aprovação" no host Gateway

<Steps>
  <Step title="Defina a política de configuração solicitada">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Faça corresponder o arquivo de aprovações do host">
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

- `tools.exec.host/security/ask` locais.
- Padrões locais em `~/.openclaw/exec-approvals.json`.

Ele é intencionalmente apenas local. Para alterar aprovações do host Gateway ou do host Node
remotamente, use `openclaw approvals set --gateway` ou
`openclaw approvals set --node <id|name|ip>`.

### Host Node

Para um host Node, aplique o mesmo arquivo de aprovações naquele Node:

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
**Limitações apenas locais:**

- `openclaw exec-policy` não sincroniza aprovações de Node.
- `openclaw exec-policy set --host node` é rejeitado.
- As aprovações de execução do Node são buscadas do Node em tempo de execução, portanto atualizações direcionadas a Node devem usar `openclaw approvals --node ...`.
  </Note>

### Atalho somente para a sessão

- `/exec security=full ask=off` altera apenas a sessão atual.
- `/elevated full` é um atalho de emergência que também ignora aprovações de execução para aquela sessão.

Se o arquivo de aprovações do host permanecer mais restritivo que a configuração, a política mais restritiva do host
ainda prevalece.

## Lista de permissões (por agente)

As listas de permissões são **por agente**. Se existirem vários agentes, troque qual agente
você está editando no app do macOS. Os padrões são correspondências glob.

Os padrões podem ser globs de caminhos resolvidos de binários ou globs simples de nomes de comando.
Nomes simples correspondem apenas a comandos invocados por `PATH`, então `rg` pode corresponder a
`/opt/homebrew/bin/rg` quando o comando é `rg`, mas **não** `./rg` nem
`/tmp/rg`. Use um glob de caminho quando quiser confiar em um local específico de binário.

Entradas legadas `agents.default` são migradas para `agents.main` ao carregar.
Cadeias de shell como `echo ok && pwd` ainda exigem que cada segmento de nível superior
satisfaça as regras da lista de permissões.

Exemplos:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Cada entrada da lista de permissões rastreia:

| Field              | Significado                       |
| ------------------ | --------------------------------- |
| `id`               | UUID estável usado para identidade na UI |
| `lastUsedAt`       | Carimbo de data/hora do último uso |
| `lastUsedCommand`  | Último comando que correspondeu   |
| `lastResolvedPath` | Último caminho resolvido do binário |

## Permitir automaticamente CLIs de Skills

Quando **Auto-allow skill CLIs** está habilitado, executáveis referenciados por
Skills conhecidos são tratados como incluídos na lista de permissões em nodes (Node do macOS ou host
Node sem interface). Isso usa `skills.bins` pela RPC do Gateway para buscar a
lista de binários de Skills. Desabilite isso se quiser listas de permissões manuais estritas.

<Warning>
- Esta é uma **lista de permissões implícita de conveniência**, separada das entradas manuais de lista de permissões por caminho.
- Ela foi pensada para ambientes de operador confiável em que Gateway e Node estão no mesmo limite de confiança.
- Se você exigir confiança explícita estrita, mantenha `autoAllowSkills: false` e use apenas entradas manuais de lista de permissões por caminho.
</Warning>

## Binários seguros e encaminhamento de aprovações

Para binários seguros (o caminho rápido somente com stdin), detalhes de vinculação de interpretador e
como encaminhar prompts de aprovação para Slack/Discord/Telegram (ou executá-los como clientes nativos de aprovação), veja
[Aprovações de execução — avançado](/pt-BR/tools/exec-approvals-advanced).

## Edição no Control UI

Use o cartão **Control UI → Nodes → Exec approvals** para editar padrões,
substituições por agente e listas de permissões. Escolha um escopo (Defaults ou um agente),
ajuste a política, adicione/remova padrões da lista de permissões e depois clique em **Save**. A UI
mostra metadados de último uso por padrão para que você possa manter a lista organizada.

O seletor de destino escolhe **Gateway** (aprovações locais) ou um **Node**.
Os Nodes precisam anunciar `system.execApprovals.get/set` (app do macOS ou
host Node sem interface). Se um Node ainda não anunciar aprovações de execução,
edite diretamente o arquivo local `~/.openclaw/exec-approvals.json`.

CLI: `openclaw approvals` oferece suporte a edição de gateway ou node — veja
[CLI de aprovações](/pt-BR/cli/approvals).

## Fluxo de aprovação

Quando uma aprovação é necessária, o gateway transmite
`exec.approval.requested` para clientes operadores. O Control UI e o app do macOS
resolvem isso por meio de `exec.approval.resolve`, e então o gateway encaminha a
solicitação aprovada para o host Node.

Para `host=node`, as solicitações de aprovação incluem uma carga canônica
`systemRunPlan`. O gateway usa esse plano como o contexto autoritativo
de comando/cwd/sessão ao encaminhar solicitações aprovadas de `system.run`.

Isso importa para a latência de aprovações assíncronas:

- O caminho de execução do Node prepara um plano canônico logo no início.
- O registro de aprovação armazena esse plano e seus metadados de vinculação.
- Uma vez aprovado, a chamada final encaminhada de `system.run` reutiliza o plano armazenado em vez de confiar em edições posteriores do chamador.
- Se o chamador alterar `command`, `rawCommand`, `cwd`, `agentId` ou `sessionKey` depois que a solicitação de aprovação foi criada, o gateway rejeita a execução encaminhada como incompatibilidade de aprovação.

## Eventos do sistema

O ciclo de vida da execução aparece como mensagens do sistema:

- `Exec running` (somente se o comando exceder o limite para aviso de execução em andamento).
- `Exec finished`.
- `Exec denied`.

Essas mensagens são publicadas na sessão do agente depois que o Node relata o evento.
As aprovações de execução no host Gateway emitem os mesmos eventos de ciclo de vida quando o
comando termina (e opcionalmente quando fica em execução além do limite).
Execuções controladas por aprovação reutilizam o id de aprovação como `runId` nessas
mensagens para facilitar a correlação.

## Comportamento em caso de aprovação negada

Quando uma aprovação assíncrona de execução é negada, o OpenClaw impede que o agente
reutilize a saída de qualquer execução anterior do mesmo comando na sessão.
O motivo da negação é passado com orientação explícita de que nenhuma saída do comando
está disponível, o que impede o agente de alegar que há nova saída ou
de repetir o comando negado com resultados obsoletos de uma execução bem-sucedida anterior.

## Implicações

- **`full`** é poderoso; prefira listas de permissões quando possível.
- **`ask`** mantém você no circuito enquanto ainda permite aprovações rápidas.
- Listas de permissões por agente evitam que aprovações de um agente vazem para outros.
- As aprovações se aplicam apenas a solicitações de execução no host de **remetentes autorizados**. Remetentes não autorizados não podem emitir `/exec`.
- `/exec security=full` é uma conveniência no nível da sessão para operadores autorizados e ignora aprovações por definição. Para bloquear rigidamente a execução no host, defina a segurança das aprovações como `deny` ou negue a ferramenta `exec` via política de ferramentas.

## Relacionado

<CardGroup cols={2}>
  <Card title="Aprovações de execução — avançado" href="/pt-BR/tools/exec-approvals-advanced" icon="gear">
    Binários seguros, vinculação de interpretador e encaminhamento de aprovações para o chat.
  </Card>
  <Card title="Ferramenta exec" href="/pt-BR/tools/exec" icon="terminal">
    Ferramenta de execução de comandos de shell.
  </Card>
  <Card title="Modo elevated" href="/pt-BR/tools/elevated" icon="shield-exclamation">
    Caminho de emergência que também ignora aprovações.
  </Card>
  <Card title="Sandboxing" href="/pt-BR/gateway/sandboxing" icon="box">
    Modos de sandbox e acesso ao workspace.
  </Card>
  <Card title="Segurança" href="/pt-BR/gateway/security" icon="lock">
    Modelo de segurança e reforço.
  </Card>
  <Card title="Sandbox vs política de ferramentas vs elevated" href="/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Quando recorrer a cada controle.
  </Card>
  <Card title="Skills" href="/pt-BR/tools/skills" icon="sparkles">
    Comportamento de permissão automática com suporte de Skill.
  </Card>
</CardGroup>
