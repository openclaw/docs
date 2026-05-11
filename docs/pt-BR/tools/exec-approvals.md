---
read_when:
    - Configurando aprovações de execução ou listas de permissões
    - Implementando a UX de aprovação de exec no aplicativo macOS
    - Revisando prompts de escape de sandbox e suas implicações
sidebarTitle: Exec approvals
summary: 'Aprovações de execução no host: controles de política, listas de permissões e o fluxo de trabalho YOLO/estrito'
title: Aprovações de execução
x-i18n:
    generated_at: "2026-05-11T20:37:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2966a6f4633046941a9ef3267bad10f3a153956361b9f088fb3e29fcd3fcb99d
    source_path: tools/exec-approvals.md
    workflow: 16
---

As aprovações de execução são o **mecanismo de proteção do aplicativo complementar / host Node** para permitir que
um agente em sandbox execute comandos em um host real (`gateway` ou `node`). Um
intertravamento de segurança: os comandos são permitidos somente quando política + lista de permissões +
aprovação do usuário (opcional) estão todas de acordo. As aprovações de execução são aplicadas **além da**
política de ferramentas e do controle elevado (a menos que elevado esteja definido como `full`, o que
ignora as aprovações).

<Note>
A política efetiva é a **mais restritiva** entre os padrões de `tools.exec.*` e de aprovações;
se um campo de aprovações for omitido, o valor de `tools.exec` será
usado. A execução no host também usa o estado local de aprovações nessa máquina - um
`ask: "always"` local do host em `~/.openclaw/exec-approvals.json` continua
solicitando confirmação mesmo que os padrões da sessão ou da configuração peçam `ask: "on-miss"`.
</Note>

## Inspecionando a política efetiva

| Comando                                                          | O que ele mostra                                                                       |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Política solicitada, fontes de política do host e o resultado efetivo.                 |
| `openclaw exec-policy show`                                      | Visão mesclada da máquina local.                                                       |
| `openclaw exec-policy set` / `preset`                            | Sincroniza a política local solicitada com o arquivo local de aprovações do host em uma etapa. |

Quando um escopo local solicita `host=node`, `exec-policy show` relata esse
escopo como gerenciado pelo Node em tempo de execução, em vez de fingir que o arquivo local de
aprovações é a fonte da verdade.

Se a interface do aplicativo complementar **não estiver disponível**, qualquer solicitação que
normalmente exibiria um prompt será resolvida pelo **fallback de solicitação** (padrão: `deny`).

<Tip>
Clientes nativos de aprovação por chat podem preparar affordances específicas do canal na
mensagem de aprovação pendente. Por exemplo, o Matrix prepara atalhos de reação
(`✅` permitir uma vez, `❌` negar, `♾️` permitir sempre), enquanto ainda mantém
comandos `/approve ...` na mensagem como fallback.
</Tip>

## Onde se aplica

As aprovações de execução são aplicadas localmente no host de execução:

- **Host Gateway** → processo `openclaw` na máquina Gateway.
- **Host Node** → executor de Node (aplicativo complementar do macOS ou host Node sem interface).

### Modelo de confiança

- Chamadores autenticados pelo Gateway são operadores confiáveis para esse Gateway.
- Nodes pareados estendem essa capacidade de operador confiável ao host Node.
- As aprovações de execução reduzem o risco de execução acidental, mas **não** são um limite de autenticação por usuário nem uma política de sistema de arquivos somente leitura.
- Depois de aprovado, um comando pode modificar arquivos de acordo com o host ou as permissões de sistema de arquivos do sandbox selecionados.
- Execuções aprovadas no host Node vinculam o contexto canônico de execução: cwd canônico, argv exato, vinculação de env quando presente e caminho fixado do executável quando aplicável.
- Para scripts de shell e invocações diretas de arquivo por interpretador/runtime, o OpenClaw também tenta vincular um operando de arquivo local concreto. Se esse arquivo vinculado mudar depois da aprovação, mas antes da execução, a execução será negada em vez de executar conteúdo divergente.
- A vinculação de arquivo é intencionalmente de melhor esforço, **não** um modelo semântico completo de todos os caminhos de carregador de interpretador/runtime. Se o modo de aprovação não conseguir identificar exatamente um arquivo local concreto para vincular, ele se recusa a emitir uma execução respaldada por aprovação em vez de fingir cobertura total.

### Separação no macOS

- O **serviço do host Node** encaminha `system.run` para o **aplicativo macOS** via IPC local.
- O **aplicativo macOS** aplica aprovações e executa o comando no contexto da interface.

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
  - `deny` - bloqueia todas as solicitações de execução no host.
  - `allowlist` - permite somente comandos na lista de permissões.
  - `full` - permite tudo (equivalente a elevado).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - nunca solicita confirmação.
  - `on-miss` - solicita confirmação somente quando a lista de permissões não corresponde.
  - `always` - solicita confirmação em todos os comandos. A confiança durável `allow-always` **não** suprime prompts quando o modo efetivo de solicitação é `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Resolução quando um prompt é necessário, mas nenhuma interface está acessível.

- `deny` - bloqueia.
- `allowlist` - permite somente se a lista de permissões corresponder.
- `full` - permite.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Quando `true`, o OpenClaw trata formas de avaliação de código inline como exigindo somente aprovação,
  mesmo que o binário do interpretador em si esteja na lista de permissões. Defesa em profundidade
  para carregadores de interpretador que não mapeiam claramente para um operando de arquivo
  estável.
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
`allow-always` não persiste novas entradas de lista de permissões para eles
automaticamente.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Controla apenas a apresentação em prompts de aprovação de execução. Quando habilitado,
  o OpenClaw pode anexar intervalos de comando derivados do analisador para que prompts de aprovação
  na Web possam destacar tokens de comando. Defina como `true` para habilitar
  o realce de texto de comando.
</ParamField>

Essa configuração **não** altera `security`, `ask`, correspondência de lista de permissões,
comportamento estrito de avaliação inline, encaminhamento de aprovação nem execução de comandos.
Ela pode ser definida globalmente em `tools.exec.commandHighlighting` ou por
agente em `agents.list[].tools.exec.commandHighlighting`.

## Modo YOLO (sem aprovação)

Se você quiser que a execução no host rode sem prompts de aprovação, deverá abrir
**as duas** camadas de política - a política de execução solicitada na configuração do OpenClaw
(`tools.exec.*`) **e** a política de aprovações local do host em
`~/.openclaw/exec-approvals.json`.

YOLO é o comportamento padrão do host, a menos que você o restrinja explicitamente:

| Camada                | Configuração YOLO         |
| --------------------- | ------------------------- |
| `tools.exec.security` | `full` em `gateway`/`node` |
| `tools.exec.ask`      | `off`                     |
| Host `askFallback`    | `full`                    |

<Warning>
**Distinções importantes:**

- `tools.exec.host=auto` escolhe **onde** a execução ocorre: sandbox quando disponível, caso contrário Gateway.
- YOLO escolhe **como** a execução no host é aprovada: `security=full` mais `ask=off`.
- No modo YOLO, o OpenClaw **não** adiciona uma porta separada de aprovação heurística de ofuscação de comando nem uma camada de rejeição de pré-verificação de script além da política configurada de execução no host.
- `auto` não transforma o roteamento para Gateway em uma substituição livre a partir de uma sessão em sandbox. Uma solicitação por chamada `host=node` é permitida a partir de `auto`; `host=gateway` só é permitida a partir de `auto` quando nenhum runtime de sandbox está ativo. Para um padrão estável não automático, defina `tools.exec.host` ou use `/exec host=...` explicitamente.

</Warning>

Provedores baseados em CLI que expõem seu próprio modo de permissão não interativo
podem seguir essa política. A Claude CLI adiciona
`--permission-mode bypassPermissions` quando a política de execução solicitada do OpenClaw
é YOLO. Substitua esse comportamento de backend com argumentos explícitos da Claude
em `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` -
por exemplo, `--permission-mode default`, `acceptEdits` ou
`bypassPermissions`.

Se quiser uma configuração mais conservadora, restrinja qualquer uma das camadas de volta para
`allowlist` / `on-miss` ou `deny`.

### Configuração persistente de "nunca solicitar confirmação" no host Gateway

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

Ele é intencionalmente apenas local. Para alterar remotamente aprovações do host Gateway ou do host Node,
use `openclaw approvals set --gateway` ou
`openclaw approvals set --node <id|name|ip>`.

### Host Node

Para um host Node, aplique o mesmo arquivo de aprovações nesse Node:

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
- As aprovações de execução de Node são buscadas no Node em tempo de execução, portanto atualizações direcionadas a Node devem usar `openclaw approvals --node ...`.

</Note>

### Atalho somente da sessão

- `/exec security=full ask=off` altera somente a sessão atual.
- `/elevated full` é um atalho de emergência que também ignora aprovações de execução nessa sessão.

Se o arquivo de aprovações do host permanecer mais restritivo que a configuração, a política mais restritiva do host
ainda prevalecerá.

## Lista de permissões (por agente)

Listas de permissões são **por agente**. Se houver vários agentes, alterne qual agente
você está editando no aplicativo macOS. Padrões são correspondências glob.

Os padrões podem ser globs de caminho de binário resolvido ou globs de nome de comando simples.
Nomes simples correspondem apenas a comandos invocados por meio de `PATH`, então `rg` pode corresponder
a `/opt/homebrew/bin/rg` quando o comando é `rg`, mas **não** a `./rg` ou
`/tmp/rg`. Use um glob de caminho quando quiser confiar em um local específico de binário.

Entradas legadas de `agents.default` são migradas para `agents.main` no carregamento.
Cadeias de shell como `echo ok && pwd` ainda precisam que cada segmento de nível superior
satisfaça as regras da lista de permissões.

Exemplos:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Restringindo argumentos com argPattern

Adicione `argPattern` quando uma entrada de lista de permissões deve corresponder a um binário e a
um formato específico de argumentos. O OpenClaw avalia a expressão regular
contra os argumentos de comando analisados, excluindo o token do executável
(`argv[0]`). Para entradas escritas manualmente, os argumentos são unidos com um
único espaço, então ancore o padrão quando precisar de uma correspondência exata.

```json
{
  "version": 1,
  "agents": {
    "main": {
      "allowlist": [
        {
          "pattern": "python3",
          "argPattern": "^safe\\.py$"
        }
      ]
    }
  }
}
```

Essa entrada permite `python3 safe.py`; `python3 other.py` é uma ausência de correspondência na lista de permissões. Se uma entrada somente de caminho para o mesmo binário também estiver presente, argumentos sem correspondência
ainda poderão voltar para essa entrada somente de caminho. Omita a entrada somente de caminho
quando o objetivo for restringir o binário aos argumentos declarados.

Entradas salvas por fluxos de aprovação podem usar um formato de separador interno para
correspondência exata de argv. Prefira usar a UI ou o fluxo de aprovação para regenerar essas
entradas em vez de editar manualmente o valor codificado. Se o OpenClaw não conseguir
analisar o argv de um segmento de comando, entradas com `argPattern` não correspondem.

Cada entrada da lista de permissões aceita:

| Campo              | Significado                                                   |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Glob do caminho resolvido do binário ou glob do nome simples do comando |
| `argPattern`       | Regex opcional de argv; entradas omitidas usam apenas o caminho |
| `id`               | UUID estável usado para identidade na UI                      |
| `source`           | Fonte da entrada, como `allow-always`                         |
| `commandText`      | Texto do comando capturado quando um fluxo de aprovação criou a entrada |
| `lastUsedAt`       | Carimbo de data/hora do último uso                            |
| `lastUsedCommand`  | Último comando que correspondeu                              |
| `lastResolvedPath` | Último caminho de binário resolvido                           |

## Permitir automaticamente CLIs de Skills

Quando **Permitir automaticamente CLIs de Skills** está ativado, executáveis referenciados por
Skills conhecidas são tratados como permitidos em nodes (node macOS ou host de node
headless). Isso usa `skills.bins` pelo RPC do Gateway para buscar a
lista de binários de Skills. Desative isso se quiser listas de permissões manuais estritas.

<Warning>
- Esta é uma **lista de permissões implícita por conveniência**, separada das entradas manuais de lista de permissões por caminho.
- Ela é destinada a ambientes de operadores confiáveis em que Gateway e node estão no mesmo limite de confiança.
- Se você exigir confiança explícita estrita, mantenha `autoAllowSkills: false` e use apenas entradas manuais de lista de permissões por caminho.

</Warning>

## Binários seguros e encaminhamento de aprovação

Para binários seguros (o caminho rápido somente via stdin), detalhes de vinculação de interpretador e
como encaminhar prompts de aprovação para Slack/Discord/Telegram (ou executá-los como
clientes de aprovação nativos), consulte
[Aprovações de Exec - avançado](/pt-BR/tools/exec-approvals-advanced).

## Edição na UI de controle

Use o cartão **UI de controle → Nodes → Aprovações de Exec** para editar padrões,
substituições por agente e listas de permissões. Escolha um escopo (Padrões ou um agente),
ajuste a política, adicione/remova padrões de lista de permissões e então **Salvar**. A UI
mostra metadados de último uso por padrão para que você possa manter a lista organizada.

O seletor de destino escolhe **Gateway** (aprovações locais) ou um **Node**.
Nodes precisam anunciar `system.execApprovals.get/set` (app macOS ou
host de node headless). Se um node ainda não anunciar aprovações de exec,
edite diretamente seu `~/.openclaw/exec-approvals.json` local.

CLI: `openclaw approvals` aceita edição de gateway ou node - consulte
[CLI de aprovações](/pt-BR/cli/approvals).

## Fluxo de aprovação

Quando um prompt é necessário, o gateway transmite
`exec.approval.requested` para clientes operadores. A UI de controle e o app macOS
resolvem isso via `exec.approval.resolve`, então o gateway encaminha a
solicitação aprovada para o host de node.

Para `host=node`, as solicitações de aprovação incluem uma carga útil canônica `systemRunPlan`.
O gateway usa esse plano como o contexto autoritativo de
comando/cwd/sessão ao encaminhar solicitações `system.run` aprovadas.

Isso importa para a latência de aprovação assíncrona:

- O caminho de exec do node prepara um plano canônico antecipadamente.
- O registro de aprovação armazena esse plano e seus metadados de vinculação.
- Depois de aprovado, a chamada `system.run` final encaminhada reutiliza o plano armazenado em vez de confiar em edições posteriores do chamador.
- Se o chamador alterar `command`, `rawCommand`, `cwd`, `agentId` ou `sessionKey` após a solicitação de aprovação ser criada, o gateway rejeita a execução encaminhada como uma incompatibilidade de aprovação.

## Eventos do sistema

O ciclo de vida de exec é exposto como mensagens do sistema:

- `Exec running` (somente se o comando exceder o limite de aviso de execução).
- `Exec finished`.
- `Exec denied`.

Elas são publicadas na sessão do agente depois que o node relata o evento.
Aprovações de exec hospedadas no Gateway emitem os mesmos eventos de ciclo de vida quando o
comando termina (e, opcionalmente, quando fica em execução por mais tempo que o limite).
Execs protegidos por aprovação reutilizam o id da aprovação como o `runId` nessas
mensagens para facilitar a correlação.

## Comportamento de aprovação negada

Quando uma aprovação de exec assíncrona é negada, o OpenClaw impede que o agente
reutilize a saída de qualquer execução anterior do mesmo comando na sessão.
O motivo da negação é passado com orientação explícita de que nenhuma saída de comando
está disponível, o que impede o agente de afirmar que há nova saída ou
repetir o comando negado com resultados obsoletos de uma execução bem-sucedida
anterior.

## Implicações

- **`full`** é poderoso; prefira listas de permissões quando possível.
- **`ask`** mantém você no circuito e ainda permite aprovações rápidas.
- Listas de permissões por agente impedem que as aprovações de um agente vazem para outros.
- Aprovações só se aplicam a solicitações de exec de host feitas por **remetentes autorizados**. Remetentes não autorizados não podem emitir `/exec`.
- `/exec security=full` é uma conveniência em nível de sessão para operadores autorizados e ignora aprovações por design. Para bloquear exec de host rigidamente, defina a segurança de aprovações como `deny` ou negue a ferramenta `exec` via política de ferramentas.

## Relacionados

<CardGroup cols={2}>
  <Card title="Aprovações de Exec - avançado" href="/pt-BR/tools/exec-approvals-advanced" icon="gear">
    Binários seguros, vinculação de interpretador e encaminhamento de aprovação para chat.
  </Card>
  <Card title="Ferramenta Exec" href="/pt-BR/tools/exec" icon="terminal">
    Ferramenta de execução de comandos shell.
  </Card>
  <Card title="Modo elevado" href="/pt-BR/tools/elevated" icon="shield-exclamation">
    Caminho de emergência que também ignora aprovações.
  </Card>
  <Card title="Sandboxing" href="/pt-BR/gateway/sandboxing" icon="box">
    Modos de sandbox e acesso ao workspace.
  </Card>
  <Card title="Segurança" href="/pt-BR/gateway/security" icon="lock">
    Modelo de segurança e hardening.
  </Card>
  <Card title="Sandbox vs política de ferramentas vs elevado" href="/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Quando usar cada controle.
  </Card>
  <Card title="Skills" href="/pt-BR/tools/skills" icon="sparkles">
    Comportamento de permissão automática baseado em Skills.
  </Card>
</CardGroup>
