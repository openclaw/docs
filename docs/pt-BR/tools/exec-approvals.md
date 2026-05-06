---
read_when:
    - Configurando aprovações de execução ou listas de permissões
    - Implementando a UX de aprovação de exec no app para macOS
    - Analisando instruções de escape da sandbox e suas implicações
sidebarTitle: Exec approvals
summary: 'Aprovações de execução no host: controles de política, listas de permissão e o fluxo de trabalho YOLO/estrito'
title: Aprovações de execução
x-i18n:
    generated_at: "2026-05-06T09:16:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: c404fbc80624e31603cfc3f9ca6318534d53e0277af107600c726f97e11b223b
    source_path: tools/exec-approvals.md
    workflow: 16
---

As aprovações de exec são a **proteção do aplicativo complementar / host de Node** para permitir que
um agente em sandbox execute comandos em um host real (`gateway` ou `node`). Um
intertravamento de segurança: comandos só são permitidos quando política + lista de permissão +
aprovação do usuário (opcional) concordam. As aprovações de exec são aplicadas **por cima da**
política de ferramentas e do bloqueio elevado (a menos que elevado esteja definido como `full`, o que
ignora aprovações).

<Note>
A política efetiva é a **mais restritiva** entre os padrões de `tools.exec.*` e aprovações;
se um campo de aprovações for omitido, o valor de `tools.exec` será
usado. Execução no host também usa o estado local de aprovações nessa máquina - um
`ask: "always"` local do host em `~/.openclaw/exec-approvals.json` continua
solicitando confirmação mesmo que a sessão ou os padrões de configuração peçam `ask: "on-miss"`.
</Note>

## Inspecionando a política efetiva

| Comando                                                          | O que mostra                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Política solicitada, fontes da política do host e o resultado efetivo.                       |
| `openclaw exec-policy show`                                      | Visão mesclada da máquina local.                                                             |
| `openclaw exec-policy set` / `preset`                            | Sincroniza a política local solicitada com o arquivo local de aprovações do host em uma etapa. |

Quando um escopo local solicita `host=node`, `exec-policy show` informa esse
escopo como gerenciado por Node em tempo de execução, em vez de fingir que o arquivo local de
aprovações é a fonte da verdade.

Se a UI do aplicativo complementar **não estiver disponível**, qualquer solicitação que
normalmente exibiria um prompt será resolvida pelo **fallback de solicitação** (padrão: `deny`).

<Tip>
Clientes nativos de aprovação por chat podem preparar recursos específicos do canal na
mensagem de aprovação pendente. Por exemplo, Matrix prepara atalhos de reação
(`✅` permitir uma vez, `❌` negar, `♾️` permitir sempre), enquanto ainda deixa
comandos `/approve ...` na mensagem como fallback.
</Tip>

## Onde se aplica

As aprovações de exec são aplicadas localmente no host de execução:

- **Host do Gateway** → processo `openclaw` na máquina do Gateway.
- **Host de Node** → executor de Node (aplicativo complementar do macOS ou host de Node headless).

### Modelo de confiança

- Chamadores autenticados pelo Gateway são operadores confiáveis para esse Gateway.
- Nodes pareados estendem essa capacidade de operador confiável para o host de Node.
- Aprovações de exec reduzem o risco de execução acidental, mas **não** são um limite de autenticação por usuário.
- Execuções aprovadas no host de Node vinculam o contexto canônico de execução: cwd canônico, argv exato, vínculo de env quando presente e caminho fixado do executável quando aplicável.
- Para scripts de shell e invocações diretas de arquivos de interpretador/runtime, o OpenClaw também tenta vincular um operando de arquivo local concreto. Se esse arquivo vinculado mudar após a aprovação, mas antes da execução, a execução será negada em vez de executar conteúdo alterado.
- A vinculação de arquivos é intencionalmente de melhor esforço, **não** um modelo semântico completo de todos os caminhos de carregamento de cada interpretador/runtime. Se o modo de aprovação não conseguir identificar exatamente um arquivo local concreto para vincular, ele se recusará a emitir uma execução respaldada por aprovação em vez de fingir cobertura total.

### Divisão no macOS

- O **serviço de host de Node** encaminha `system.run` para o **app macOS** por IPC local.
- O **app macOS** aplica aprovações e executa o comando no contexto da UI.

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

## Ajustes de política

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - bloqueia todas as solicitações de exec no host.
  - `allowlist` - permite apenas comandos na lista de permissão.
  - `full` - permite tudo (equivalente a elevado).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - nunca solicita confirmação.
  - `on-miss` - solicita confirmação apenas quando a lista de permissão não corresponde.
  - `always` - solicita confirmação em todos os comandos. A confiança durável `allow-always` **não** suprime prompts quando o modo efetivo de solicitação é `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Resolução quando um prompt é obrigatório, mas nenhuma UI está acessível.

- `deny` - bloqueia.
- `allowlist` - permite apenas se a lista de permissão corresponder.
- `full` - permite.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Quando `true`, o OpenClaw trata formas de avaliação de código inline como somente por aprovação,
  mesmo que o binário do interpretador em si esteja na lista de permissão. Defesa em profundidade
  para carregadores de interpretador que não mapeiam claramente para um único operando
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
`allow-always` não persiste novas entradas de lista de permissão para eles
automaticamente.

## Modo YOLO (sem aprovação)

Se você quiser que exec no host rode sem prompts de aprovação, deverá abrir
**ambas** as camadas de política - a política de exec solicitada na configuração do OpenClaw
(`tools.exec.*`) **e** a política local de aprovações do host em
`~/.openclaw/exec-approvals.json`.

YOLO é o comportamento padrão do host, a menos que você o restrinja explicitamente:

| Camada                 | Configuração YOLO               |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` em `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Distinções importantes:**

- `tools.exec.host=auto` escolhe **onde** exec roda: sandbox quando disponível, caso contrário Gateway.
- YOLO escolhe **como** exec no host é aprovado: `security=full` mais `ask=off`.
- No modo YOLO, o OpenClaw **não** adiciona um bloqueio heurístico separado de aprovação por ofuscação de comando nem uma camada de rejeição de pré-verificação de script por cima da política configurada de exec no host.
- `auto` não torna o roteamento para Gateway uma substituição livre a partir de uma sessão em sandbox. Uma solicitação por chamada `host=node` é permitida a partir de `auto`; `host=gateway` só é permitido a partir de `auto` quando nenhum runtime de sandbox está ativo. Para um padrão estável não automático, defina `tools.exec.host` ou use `/exec host=...` explicitamente.

</Warning>

Provedores baseados em CLI que expõem seu próprio modo de permissão não interativo
podem seguir essa política. A Claude CLI adiciona
`--permission-mode bypassPermissions` quando a política de exec solicitada pelo OpenClaw
é YOLO. Substitua esse comportamento de backend com argumentos explícitos da Claude
em `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` -
por exemplo `--permission-mode default`, `acceptEdits` ou
`bypassPermissions`.

Se quiser uma configuração mais conservadora, restrinja qualquer uma das camadas de volta para
`allowlist` / `on-miss` ou `deny`.

### Configuração persistente de "nunca solicitar confirmação" no host do Gateway

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

Ele é intencionalmente apenas local. Para alterar aprovações de host do Gateway ou host de Node
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
- Aprovações de exec de Node são buscadas do Node em tempo de execução, portanto atualizações direcionadas a Node devem usar `openclaw approvals --node ...`.

</Note>

### Atalho somente de sessão

- `/exec security=full ask=off` altera apenas a sessão atual.
- `/elevated full` é um atalho de emergência que também ignora aprovações de exec para essa sessão.

Se o arquivo de aprovações do host permanecer mais restritivo que a configuração, a política mais restritiva do host
ainda prevalecerá.

## Lista de permissão (por agente)

Listas de permissão são **por agente**. Se existirem vários agentes, alterne qual agente
você está editando no app macOS. Padrões são correspondências glob.

Os padrões podem ser globs de caminho de binário resolvido ou globs de nome de comando simples.
Nomes simples correspondem apenas a comandos invocados por `PATH`, então `rg` pode corresponder a
`/opt/homebrew/bin/rg` quando o comando é `rg`, mas **não** a `./rg` ou
`/tmp/rg`. Use um glob de caminho quando quiser confiar em uma localização específica de binário.

Entradas legadas `agents.default` são migradas para `agents.main` no carregamento.
Cadeias de shell como `echo ok && pwd` ainda precisam que cada segmento de nível superior
satisfaça as regras da lista de permissão.

Exemplos:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Restringindo argumentos com argPattern

Adicione `argPattern` quando uma entrada de lista de permissão deve corresponder a um binário e a
um formato específico de argumentos. O OpenClaw avalia a expressão regular
contra os argumentos de comando analisados, excluindo o token executável
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

Essa entrada permite `python3 safe.py`; `python3 other.py` é uma falha de correspondência da lista de permissão. Se uma entrada somente de caminho para o mesmo binário também estiver presente, argumentos sem correspondência ainda podem voltar para essa entrada somente de caminho. Omita a entrada somente de caminho quando o objetivo for restringir o binário aos argumentos declarados.

Entradas salvas por fluxos de aprovação podem usar um formato de separador interno para
correspondência exata de argv. Prefira a UI ou o fluxo de aprovação para regenerar essas
entradas em vez de editar manualmente o valor codificado. Se o OpenClaw não conseguir
analisar argv para um segmento de comando, entradas com `argPattern` não correspondem.

Cada entrada de lista de permissão oferece suporte a:

| Campo              | Significado                                                       |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Glob do caminho binário resolvido ou glob do nome de comando simples           |
| `argPattern`       | Regex argv opcional; entradas omitidas são somente de caminho            |
| `id`               | UUID estável usado para identidade na UI                              |
| `source`           | Origem da entrada, como `allow-always`                          |
| `commandText`      | Texto do comando capturado quando um fluxo de aprovação criou a entrada |
| `lastUsedAt`       | Timestamp do último uso                                           |
| `lastUsedCommand`  | Último comando que correspondeu                                     |
| `lastResolvedPath` | Último caminho binário resolvido                                     |

## CLIs de Skills com permissão automática

Quando **CLIs de Skills com permissão automática** está habilitado, executáveis referenciados por
Skills conhecidas são tratados como incluídos na lista de permissões em nodes (node macOS ou host de
node headless). Isso usa `skills.bins` sobre o RPC do Gateway para buscar a
lista de bins de Skills. Desabilite isso se quiser listas de permissões manuais estritas.

<Warning>
- Esta é uma **lista de permissões implícita por conveniência**, separada das entradas manuais de lista de permissões de caminho.
- Ela é destinada a ambientes de operador confiáveis em que o Gateway e o node estão no mesmo limite de confiança.
- Se você exigir confiança explícita estrita, mantenha `autoAllowSkills: false` e use apenas entradas manuais de lista de permissões de caminho.

</Warning>

## Bins seguros e encaminhamento de aprovação

Para bins seguros (o caminho rápido somente por stdin), detalhes de vinculação de interpretador e
como encaminhar prompts de aprovação para Slack/Discord/Telegram (ou executá-los como
clientes de aprovação nativos), consulte
[Aprovações de exec - avançado](/pt-BR/tools/exec-approvals-advanced).

## Edição na Control UI

Use o cartão **Control UI → Nodes → Aprovações de exec** para editar padrões,
substituições por agente e listas de permissões. Escolha um escopo (Padrões ou um agente),
ajuste a política, adicione/remova padrões da lista de permissões e então **Salve**. A UI
mostra metadados de último uso por padrão para que você possa manter a lista organizada.

O seletor de destino escolhe **Gateway** (aprovações locais) ou um **Node**.
Nodes devem anunciar `system.execApprovals.get/set` (app macOS ou
host de node headless). Se um node ainda não anunciar aprovações de exec,
edite diretamente o `~/.openclaw/exec-approvals.json` local dele.

CLI: `openclaw approvals` oferece suporte à edição de Gateway ou node - consulte
[CLI de aprovações](/pt-BR/cli/approvals).

## Fluxo de aprovação

Quando um prompt é necessário, o gateway transmite
`exec.approval.requested` para clientes operadores. A Control UI e o app macOS
resolvem isso via `exec.approval.resolve`; então o gateway encaminha a
solicitação aprovada para o host do node.

Para `host=node`, as solicitações de aprovação incluem um payload `systemRunPlan`
canônico. O gateway usa esse plano como o contexto autoritativo de
comando/cwd/sessão ao encaminhar solicitações `system.run` aprovadas.

Isso importa para a latência de aprovação assíncrona:

- O caminho de exec do node prepara um plano canônico antecipadamente.
- O registro de aprovação armazena esse plano e seus metadados de vinculação.
- Depois de aprovado, a chamada `system.run` final encaminhada reutiliza o plano armazenado em vez de confiar em edições posteriores do chamador.
- Se o chamador alterar `command`, `rawCommand`, `cwd`, `agentId` ou `sessionKey` depois que a solicitação de aprovação foi criada, o gateway rejeita a execução encaminhada como uma incompatibilidade de aprovação.

## Eventos do sistema

O ciclo de vida de exec é exposto como mensagens do sistema:

- `Exec running` (somente se o comando exceder o limite de aviso de execução).
- `Exec finished`.
- `Exec denied`.

Elas são publicadas na sessão do agente depois que o node relata o evento.
Aprovações de exec hospedadas no Gateway emitem os mesmos eventos de ciclo de vida quando o
comando termina (e opcionalmente quando fica em execução por mais tempo que o limite).
Execs controlados por aprovação reutilizam o ID de aprovação como o `runId` nessas
mensagens para facilitar a correlação.

## Comportamento de aprovação negada

Quando uma aprovação de exec assíncrona é negada, o OpenClaw impede que o agente
reutilize a saída de qualquer execução anterior do mesmo comando na sessão.
O motivo da negação é passado com orientação explícita de que nenhuma saída de comando
está disponível, o que impede o agente de afirmar que há uma nova saída ou
repetir o comando negado com resultados obsoletos de uma execução bem-sucedida
anterior.

## Implicações

- **`full`** é poderoso; prefira listas de permissões quando possível.
- **`ask`** mantém você no loop, mas ainda permite aprovações rápidas.
- Listas de permissões por agente impedem que as aprovações de um agente vazem para outros.
- Aprovações só se aplicam a solicitações de exec de host de **remetentes autorizados**. Remetentes não autorizados não podem emitir `/exec`.
- `/exec security=full` é uma conveniência em nível de sessão para operadores autorizados e ignora aprovações intencionalmente. Para bloquear rigidamente exec de host, defina a segurança de aprovações como `deny` ou negue a ferramenta `exec` via política de ferramentas.

## Relacionados

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/pt-BR/tools/exec-approvals-advanced" icon="gear">
    Bins seguros, vinculação de interpretador e encaminhamento de aprovação para chat.
  </Card>
  <Card title="Exec tool" href="/pt-BR/tools/exec" icon="terminal">
    Ferramenta de execução de comando shell.
  </Card>
  <Card title="Elevated mode" href="/pt-BR/tools/elevated" icon="shield-exclamation">
    Caminho de emergência que também ignora aprovações.
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
