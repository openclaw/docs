---
read_when:
    - Configurando aprovações de exec ou listas de permissões
    - Implementando a experiência de aprovação de execução no aplicativo para macOS
    - Analisando prompts de escape de sandbox e suas implicações
sidebarTitle: Exec approvals
summary: 'Aprovações de execução no host: controles de política, listas de permissões e o fluxo de trabalho YOLO/estrito'
title: Aprovações de execução
x-i18n:
    generated_at: "2026-05-10T19:51:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b1a9649161440bca445e318654b9a48a54ae1dbbca42349ac94b13ecc9fbfbd
    source_path: tools/exec-approvals.md
    workflow: 16
---

As aprovações de execução são a **barreira de segurança do app companion / host do nó** para permitir que
um agente em sandbox execute comandos em um host real (`gateway` ou `node`). Um
intertravamento de segurança: comandos são permitidos somente quando política + allowlist +
aprovação do usuário (opcional) estão todas de acordo. As aprovações de execução são aplicadas **em cima de**
política de ferramentas e gating elevado (a menos que elevado esteja definido como `full`, o que
ignora aprovações).

<Note>
A política efetiva é a **mais estrita** entre `tools.exec.*` e os padrões de aprovações;
se um campo de aprovações for omitido, o valor de `tools.exec` é
usado. A execução no host também usa o estado local de aprovações nessa máquina - um
`ask: "always"` local do host em `~/.openclaw/exec-approvals.json` continua
solicitando confirmação mesmo que a sessão ou os padrões de configuração solicitem `ask: "on-miss"`.
</Note>

## Inspecionando a política efetiva

| Comando                                                          | O que mostra                                                                           |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Política solicitada, fontes da política do host e o resultado efetivo.                 |
| `openclaw exec-policy show`                                      | Visão mesclada da máquina local.                                                       |
| `openclaw exec-policy set` / `preset`                            | Sincroniza a política local solicitada com o arquivo local de aprovações do host em uma etapa. |

Quando um escopo local solicita `host=node`, `exec-policy show` relata esse
escopo como gerenciado pelo nó em tempo de execução, em vez de fingir que o arquivo local
de aprovações é a fonte da verdade.

Se a interface do app companion **não estiver disponível**, qualquer solicitação que
normalmente pediria confirmação é resolvida pelo **fallback de ask** (padrão: `deny`).

<Tip>
Clientes nativos de aprovação por chat podem semear facilidades específicas do canal na
mensagem de aprovação pendente. Por exemplo, Matrix semeia atalhos de reação
(`✅` permitir uma vez, `❌` negar, `♾️` permitir sempre), mas ainda deixa
comandos `/approve ...` na mensagem como fallback.
</Tip>

## Onde se aplica

As aprovações de execução são aplicadas localmente no host de execução:

- **Host do Gateway** → processo `openclaw` na máquina Gateway.
- **Host do nó** → executor do nó (app companion do macOS ou host do nó headless).

### Modelo de confiança

- Chamadores autenticados pelo Gateway são operadores confiáveis para esse Gateway.
- Nós pareados estendem essa capacidade de operador confiável para o host do nó.
- As aprovações de execução reduzem o risco de execução acidental, mas **não** são uma fronteira de autenticação por usuário nem uma política somente leitura de sistema de arquivos.
- Depois de aprovado, um comando pode alterar arquivos de acordo com o host selecionado ou as permissões de sistema de arquivos do sandbox.
- Execuções aprovadas no host do nó vinculam o contexto canônico de execução: cwd canônico, argv exato, vinculação de env quando presente e caminho fixado do executável quando aplicável.
- Para scripts shell e invocações diretas de arquivos de interpretador/runtime, o OpenClaw também tenta vincular um operando de arquivo local concreto. Se esse arquivo vinculado mudar após a aprovação, mas antes da execução, a execução será negada em vez de executar conteúdo divergente.
- A vinculação de arquivo é intencionalmente de melhor esforço, **não** um modelo semântico completo de todos os caminhos de carregador de interpretador/runtime. Se o modo de aprovação não conseguir identificar exatamente um arquivo local concreto para vincular, ele se recusa a emitir uma execução respaldada por aprovação em vez de fingir cobertura completa.

### Divisão no macOS

- O **serviço de host do nó** encaminha `system.run` para o **app macOS** por IPC local.
- O **app macOS** aplica aprovações e executa o comando no contexto da interface.

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
  - `deny` - bloqueia todas as solicitações de execução no host.
  - `allowlist` - permite somente comandos na allowlist.
  - `full` - permite tudo (equivalente a elevado).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - nunca solicita confirmação.
  - `on-miss` - solicita confirmação somente quando a allowlist não corresponde.
  - `always` - solicita confirmação em todos os comandos. A confiança durável `allow-always` **não** suprime prompts quando o modo efetivo de ask é `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Resolução quando um prompt é necessário, mas nenhuma interface está acessível.

- `deny` - bloqueia.
- `allowlist` - permite somente se a allowlist corresponder.
- `full` - permite.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Quando `true`, o OpenClaw trata formas inline de avaliação de código como somente por aprovação,
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
`allow-always` não persiste novas entradas de allowlist para eles
automaticamente.

## Modo YOLO (sem aprovação)

Se você quiser que a execução no host rode sem prompts de aprovação, precisa abrir
**ambas** as camadas de política - a política de execução solicitada na configuração do OpenClaw
(`tools.exec.*`) **e** a política local de aprovações do host em
`~/.openclaw/exec-approvals.json`.

YOLO é o comportamento padrão do host, a menos que você o restrinja explicitamente:

| Camada                | Configuração YOLO         |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` em `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| `askFallback` do host | `full`                     |

<Warning>
**Distinções importantes:**

- `tools.exec.host=auto` escolhe **onde** a execução roda: sandbox quando disponível, caso contrário Gateway.
- YOLO escolhe **como** a execução no host é aprovada: `security=full` mais `ask=off`.
- No modo YOLO, o OpenClaw **não** adiciona uma barreira separada de aprovação heurística de ofuscação de comandos nem uma camada de rejeição de preflight de script em cima da política configurada de execução no host.
- `auto` não torna o roteamento para Gateway uma substituição livre a partir de uma sessão em sandbox. Uma solicitação por chamada `host=node` é permitida a partir de `auto`; `host=gateway` só é permitido a partir de `auto` quando nenhum runtime de sandbox está ativo. Para um padrão não automático estável, defina `tools.exec.host` ou use `/exec host=...` explicitamente.

</Warning>

Provedores baseados em CLI que expõem seu próprio modo de permissão não interativo
podem seguir esta política. A Claude CLI adiciona
`--permission-mode bypassPermissions` quando a política de execução solicitada do OpenClaw
é YOLO. Substitua esse comportamento de backend com argumentos explícitos da Claude
em `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` -
por exemplo `--permission-mode default`, `acceptEdits` ou
`bypassPermissions`.

Se você quiser uma configuração mais conservadora, restrinja qualquer uma das camadas de volta para
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

Ele é intencionalmente apenas local. Para alterar aprovações remotamente no host Gateway ou no host do nó,
use `openclaw approvals set --gateway` ou
`openclaw approvals set --node <id|name|ip>`.

### Host do nó

Para um host do nó, aplique o mesmo arquivo de aprovações nesse nó:

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

- `openclaw exec-policy` não sincroniza aprovações do nó.
- `openclaw exec-policy set --host node` é rejeitado.
- As aprovações de execução do nó são buscadas no nó em tempo de execução, então atualizações direcionadas ao nó devem usar `openclaw approvals --node ...`.

</Note>

### Atalho apenas da sessão

- `/exec security=full ask=off` altera somente a sessão atual.
- `/elevated full` é um atalho de emergência que também ignora aprovações de execução nessa sessão.

Se o arquivo de aprovações do host permanecer mais estrito que a configuração, a política mais estrita do host
ainda prevalece.

## Allowlist (por agente)

Allowlists são **por agente**. Se houver vários agentes, alterne qual agente
você está editando no app macOS. Padrões são correspondências glob.

Padrões podem ser globs de caminhos de binário resolvidos ou globs de nome de comando simples.
Nomes simples correspondem somente a comandos invocados por `PATH`, então `rg` pode corresponder a
`/opt/homebrew/bin/rg` quando o comando é `rg`, mas **não** a `./rg` ou
`/tmp/rg`. Use um glob de caminho quando quiser confiar em um local específico
de binário.

Entradas legadas `agents.default` são migradas para `agents.main` no carregamento.
Cadeias shell como `echo ok && pwd` ainda precisam que cada segmento de nível superior
satisfaça as regras de allowlist.

Exemplos:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Restringindo argumentos com argPattern

Adicione `argPattern` quando uma entrada de allowlist deve corresponder a um binário e a
um formato específico de argumentos. O OpenClaw avalia a expressão regular
contra os argumentos de comando analisados, excluindo o token do executável
(`argv[0]`). Para entradas escritas manualmente, argumentos são unidos com um
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

Essa entrada permite `python3 safe.py`; `python3 other.py` é uma falha de allowlist.
Se uma entrada somente de caminho para o mesmo binário também estiver presente, argumentos sem correspondência
ainda podem cair para essa entrada somente de caminho. Omita a entrada somente de caminho
quando o objetivo for restringir o binário aos argumentos declarados.

Entradas salvas por fluxos de aprovação podem usar um formato interno de separador para
correspondência exata de argv. Prefira a interface ou o fluxo de aprovação para regenerar essas
entradas em vez de editar manualmente o valor codificado. Se o OpenClaw não puder
analisar argv para um segmento de comando, entradas com `argPattern` não correspondem.

Cada entrada de allowlist aceita:

| Campo              | Significado                                                   |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Glob de caminho de binário resolvido ou glob de nome de comando simples |
| `argPattern`       | Regex argv opcional; entradas omitidas são apenas por caminho |
| `id`               | UUID estável usado para identidade da UI                      |
| `source`           | Fonte da entrada, como `allow-always`                         |
| `commandText`      | Texto do comando capturado quando um fluxo de aprovação criou a entrada |
| `lastUsedAt`       | Carimbo de data/hora do último uso                            |
| `lastUsedCommand`  | Último comando correspondente                                 |
| `lastResolvedPath` | Último caminho de binário resolvido                           |

## CLIs de Skills com permissão automática

Quando **CLIs de Skills com permissão automática** está habilitado, executáveis referenciados por
Skills conhecidas são tratados como permitidos em Nodes (Node do macOS ou host de
Node headless). Isso usa `skills.bins` sobre o RPC do Gateway para buscar a
lista de binários de Skills. Desabilite isso se você quiser listas de permissões manuais estritas.

<Warning>
- Esta é uma **lista de permissões implícita por conveniência**, separada das entradas manuais da lista de permissões por caminho.
- Ela é destinada a ambientes de operadores confiáveis em que Gateway e Node estão no mesmo limite de confiança.
- Se você exigir confiança explícita estrita, mantenha `autoAllowSkills: false` e use apenas entradas manuais da lista de permissões por caminho.

</Warning>

## Binários seguros e encaminhamento de aprovação

Para binários seguros (o caminho rápido apenas por stdin), detalhes de vinculação de interpretador e
como encaminhar prompts de aprovação para Slack/Discord/Telegram (ou executá-los como
clientes de aprovação nativos), consulte
[Aprovações de exec - avançado](/pt-BR/tools/exec-approvals-advanced).

## Edição pela UI de controle

Use o cartão **UI de controle → Nodes → Aprovações de exec** para editar padrões,
sobrescritas por agente e listas de permissões. Escolha um escopo (Padrões ou um agente),
ajuste a política, adicione/remova padrões da lista de permissões e então **Salvar**. A UI
mostra metadados de último uso por padrão para que você mantenha a lista organizada.

O seletor de destino escolhe **Gateway** (aprovações locais) ou um **Node**.
Nodes devem anunciar `system.execApprovals.get/set` (app do macOS ou
host de Node headless). Se um Node ainda não anunciar aprovações de exec,
edite diretamente seu `~/.openclaw/exec-approvals.json` local.

CLI: `openclaw approvals` oferece suporte à edição de gateway ou Node - consulte
[CLI de aprovações](/pt-BR/cli/approvals).

## Fluxo de aprovação

Quando um prompt é necessário, o gateway transmite
`exec.approval.requested` para clientes operadores. A UI de controle e o app do macOS
o resolvem via `exec.approval.resolve`, então o gateway encaminha a
solicitação aprovada ao host do Node.

Para `host=node`, solicitações de aprovação incluem uma carga útil `systemRunPlan`
canônica. O gateway usa esse plano como o contexto autoritativo de
comando/cwd/sessão ao encaminhar solicitações `system.run`
aprovadas.

Isso importa para a latência de aprovação assíncrona:

- O caminho de exec do Node prepara um plano canônico antecipadamente.
- O registro de aprovação armazena esse plano e seus metadados de vinculação.
- Depois de aprovado, a chamada final encaminhada de `system.run` reutiliza o plano armazenado em vez de confiar em edições posteriores do chamador.
- Se o chamador alterar `command`, `rawCommand`, `cwd`, `agentId` ou `sessionKey` depois que a solicitação de aprovação foi criada, o gateway rejeita a execução encaminhada como uma incompatibilidade de aprovação.

## Eventos do sistema

O ciclo de vida de exec é exposto como mensagens do sistema:

- `Exec running` (somente se o comando exceder o limite de aviso de execução).
- `Exec finished`.
- `Exec denied`.

Elas são postadas na sessão do agente depois que o Node relata o evento.
Aprovações de exec hospedadas no Gateway emitem os mesmos eventos de ciclo de vida quando o
comando termina (e, opcionalmente, quando fica em execução por mais tempo que o limite).
Execs protegidos por aprovação reutilizam o id de aprovação como `runId` nessas
mensagens para facilitar a correlação.

## Comportamento de aprovação negada

Quando uma aprovação de exec assíncrona é negada, OpenClaw impede que o agente
reutilize a saída de qualquer execução anterior do mesmo comando na sessão.
O motivo da negação é passado com orientação explícita de que nenhuma saída de comando
está disponível, o que impede o agente de alegar que há nova saída ou
repetir o comando negado com resultados obsoletos de uma execução bem-sucedida
anterior.

## Implicações

- **`full`** é poderoso; prefira listas de permissões quando possível.
- **`ask`** mantém você no ciclo, enquanto ainda permite aprovações rápidas.
- Listas de permissões por agente impedem que as aprovações de um agente vazem para outros.
- Aprovações se aplicam apenas a solicitações de exec do host de **remetentes autorizados**. Remetentes não autorizados não podem emitir `/exec`.
- `/exec security=full` é uma conveniência em nível de sessão para operadores autorizados e ignora aprovações por design. Para bloquear rigidamente exec do host, defina a segurança de aprovações como `deny` ou negue a ferramenta `exec` via política de ferramentas.

## Relacionados

<CardGroup cols={2}>
  <Card title="Aprovações de exec - avançado" href="/pt-BR/tools/exec-approvals-advanced" icon="gear">
    Binários seguros, vinculação de interpretador e encaminhamento de aprovação para chat.
  </Card>
  <Card title="Ferramenta exec" href="/pt-BR/tools/exec" icon="terminal">
    Ferramenta de execução de comandos de shell.
  </Card>
  <Card title="Modo elevado" href="/pt-BR/tools/elevated" icon="shield-exclamation">
    Caminho de emergência que também ignora aprovações.
  </Card>
  <Card title="Sandboxing" href="/pt-BR/gateway/sandboxing" icon="box">
    Modos de sandbox e acesso ao workspace.
  </Card>
  <Card title="Segurança" href="/pt-BR/gateway/security" icon="lock">
    Modelo de segurança e reforço.
  </Card>
  <Card title="Sandbox vs política de ferramentas vs elevado" href="/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Quando usar cada controle.
  </Card>
  <Card title="Skills" href="/pt-BR/tools/skills" icon="sparkles">
    Comportamento de permissão automática baseado em Skills.
  </Card>
</CardGroup>
