---
read_when:
    - Configurando aprovações de execução ou listas de permissões
    - Implementando a UX de aprovação de exec no app macOS
    - Analisando prompts de escape de sandbox e suas implicações
sidebarTitle: Exec approvals
summary: 'Aprovações de execução no host: controles de política, listas de permissões e o fluxo de trabalho YOLO/strict'
title: Aprovações de execução
x-i18n:
    generated_at: "2026-06-27T18:15:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a4a5c9c56da458fdb25d5fe698df305af17188695d8befc1d4cfd8e8333e96
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec approvals são a **proteção do app complementar / host de nó** para permitir que
um agente em sandbox execute comandos em um host real (`gateway` ou `node`). Um
intertravamento de segurança: comandos são permitidos somente quando política + lista de permissões +
aprovação do usuário (opcional) concordam. Exec approvals ficam **acima de**
política de ferramentas e bloqueio elevado (a menos que elevated esteja definido como `full`, o que
pula aprovações).

Para uma visão geral baseada em modos de `deny`, `allowlist`, `ask`, `auto`, `full`,
mapeamento do Codex Guardian e permissões do harness ACPX, veja
[Modos de permissão](/pt-BR/tools/permission-modes).

<Note>
A política efetiva é a **mais restritiva** entre `tools.exec.*` e os padrões de approvals;
se um campo de approvals for omitido, o valor de `tools.exec` será
usado. Exec no host também usa o estado local de approvals nessa máquina - um
`ask: "always"` local do host no arquivo de approvals do host de execução continua
solicitando mesmo que os padrões de sessão ou configuração solicitem `ask: "on-miss"`.
</Note>

## Inspecionando a política efetiva

| Comando                                                          | O que ele mostra                                                                        |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Política solicitada, origens da política do host e o resultado efetivo.                |
| `openclaw exec-policy show`                                      | Visão mesclada da máquina local.                                                       |
| `openclaw exec-policy set` / `preset`                            | Sincroniza a política solicitada local com o arquivo local de approvals do host em uma etapa. |

Quando um escopo local solicita `host=node`, `exec-policy show` relata esse
escopo como gerenciado por nó em tempo de execução, em vez de fingir que o arquivo local de
approvals é a fonte da verdade.

Se a UI do app complementar **não estiver disponível**, qualquer solicitação que
normalmente exibiria um prompt é resolvida pelo **fallback de ask** (padrão: `deny`).

<Tip>
Clientes nativos de aprovação por chat podem inserir affordances específicas do canal na
mensagem de aprovação pendente. Por exemplo, Matrix insere atalhos de reação
(`✅` permitir uma vez, `❌` negar, `♾️` permitir sempre), mantendo ainda
comandos `/approve ...` na mensagem como fallback.
</Tip>

## Onde se aplica

Exec approvals são aplicadas localmente no host de execução:

- **Host Gateway** → processo `openclaw` na máquina do gateway.
- **Host de nó** → executor de nó (app complementar do macOS ou host de nó headless).

### Modelo de confiança

- Chamadores autenticados pelo Gateway são operadores confiáveis para esse Gateway.
- Nós pareados estendem essa capacidade de operador confiável ao host de nó.
- Exec approvals reduzem o risco de execução acidental, mas **não** são uma fronteira de autenticação por usuário nem uma política de sistema de arquivos somente leitura.
- Depois de aprovado, um comando pode alterar arquivos de acordo com as permissões selecionadas do host ou do sistema de arquivos em sandbox.
- Execuções aprovadas em host de nó vinculam o contexto de execução canônico: cwd canônico, argv exato, vínculo de env quando presente e caminho de executável fixado quando aplicável.
- Para scripts de shell e invocações diretas de arquivos de interpretador/runtime, o OpenClaw também tenta vincular um operando de arquivo local concreto. Se esse arquivo vinculado mudar após a aprovação, mas antes da execução, a execução é negada em vez de executar conteúdo divergente.
- O vínculo de arquivo é intencionalmente de melhor esforço, **não** um modelo semântico completo de todos os caminhos de carregador de interpretador/runtime. Se o modo de aprovação não conseguir identificar exatamente um arquivo local concreto para vincular, ele se recusa a emitir uma execução apoiada por aprovação em vez de fingir cobertura total.

### Divisão no macOS

- O **serviço de host de nó** encaminha `system.run` para o **app macOS** por IPC local.
- O **app macOS** aplica approvals e executa o comando no contexto da UI.

## Configurações e armazenamento

Approvals ficam em um arquivo JSON local no host de execução. Quando
`OPENCLAW_STATE_DIR` está definido, o arquivo segue esse diretório de estado;
caso contrário, usa o diretório de estado padrão do OpenClaw:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# otherwise
~/.openclaw/exec-approvals.json
```

O socket de aprovação padrão segue a mesma raiz:
`$OPENCLAW_STATE_DIR/exec-approvals.sock`, ou
`~/.openclaw/exec-approvals.sock` quando a variável não está definida.

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

### `tools.exec.mode`

`tools.exec.mode` é a superfície de política normalizada preferencial para exec no host.
Os valores são:

- `deny` - bloqueia exec no host.
- `allowlist` - executa somente comandos na lista de permissões sem perguntar.
- `ask` - usa a política de lista de permissões e pergunta em ausências.
- `auto` - usa a política de lista de permissões, executa correspondências determinísticas diretamente e envia ausências de aprovação pelo revisor automático nativo do OpenClaw antes de recorrer a uma rota de aprovação humana.
- `full` - executa exec no host sem prompts de aprovação.

`tools.exec.security` / `tools.exec.ask` legados continuam compatíveis e ainda prevalecem
quando definidos no escopo mais estreito de sessão ou agente.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - bloqueia todas as solicitações de exec no host.
  - `allowlist` - permite somente comandos na lista de permissões.
  - `full` - permite tudo (equivalente a elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Política de ask configurada para exec no host. Controla o comportamento de prompt de aprovação
  de base a partir de `tools.exec.ask` e dos padrões de approvals do host. O
  parâmetro de ferramenta `ask` por chamada (veja [Ferramenta Exec](/pt-BR/tools/exec#parameters))
  só pode endurecer essa base, e chamadas de modelo originadas em canal o ignoram
  quando o ask efetivo do host é `off`.

- `off` - nunca solicita.
- `on-miss` - solicita somente quando a lista de permissões não corresponde.
- `always` - solicita em todo comando. A confiança durável `allow-always` **não** suprime prompts quando o modo ask efetivo é `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Resolução quando um prompt é necessário, mas nenhuma UI está acessível. Se este
  campo for omitido, o OpenClaw usa `deny` por padrão.

- `deny` - bloqueia.
- `allowlist` - permite somente se a lista de permissões corresponder.
- `full` - permite.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Quando `true`, o OpenClaw trata formas inline de avaliação de código como dependentes de aprovação
  mesmo que o binário do interpretador em si esteja na lista de permissões. Defesa em profundidade
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
`allow-always` não persiste novas entradas de lista de permissões para eles
automaticamente.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Controla apenas a apresentação em prompts de aprovação de exec. Quando habilitado,
  o OpenClaw pode anexar trechos de comando derivados do parser para que prompts de aprovação
  Web possam realçar tokens de comando. Defina como `true` para habilitar
  realce de texto de comando.
</ParamField>

Essa configuração **não** altera `security`, `ask`, correspondência da lista de permissões,
comportamento de eval inline estrito, encaminhamento de aprovação ou execução de comandos.
Ela pode ser definida globalmente em `tools.exec.commandHighlighting` ou por
agente em `agents.list[].tools.exec.commandHighlighting`.

## Modo YOLO (sem aprovação)

Se você quiser que exec no host execute sem prompts de aprovação, precisa abrir
**ambas** as camadas de política - política de exec solicitada na configuração do OpenClaw
(`tools.exec.*`) **e** política de approvals local do host no
arquivo de approvals do host de execução.

O OpenClaw usa `deny` como padrão para `askFallback` omitido. Defina
`askFallback` do host como `full` explicitamente quando um prompt de aprovação sem UI deve
recorrer a permitir.

| Camada                | Configuração YOLO         |
| --------------------- | ------------------------- |
| `tools.exec.security` | `full` em `gateway`/`node` |
| `tools.exec.ask`      | `off`                     |
| Host `askFallback`    | `full`                    |

<Warning>
**Distinções importantes:**

- `tools.exec.host=auto` escolhe **onde** exec é executado: sandbox quando disponível, caso contrário gateway.
- YOLO escolhe **como** exec no host é aprovado: `security=full` mais `ask=off`.
- No modo YOLO, o OpenClaw **não** adiciona um gate heurístico separado de aprovação de ofuscação de comando nem uma camada de rejeição de pré-verificação de script acima da política de exec no host configurada.
- `auto` não torna o roteamento para gateway uma substituição livre a partir de uma sessão em sandbox. Uma solicitação por chamada `host=node` é permitida a partir de `auto`; `host=gateway` só é permitida a partir de `auto` quando nenhum runtime de sandbox está ativo. Para um padrão estável não automático, defina `tools.exec.host` ou use `/exec host=...` explicitamente.

</Warning>

Provedores baseados em CLI que expõem seu próprio modo de permissão não interativo
podem seguir essa política. A Claude CLI adiciona
`--permission-mode bypassPermissions` quando a política de exec efetiva do OpenClaw
é YOLO. Para sessões live Claude gerenciadas pelo OpenClaw, a política de exec
efetiva do OpenClaw tem autoridade sobre o modo de permissão nativo da Claude:
YOLO normaliza inicializações live para `--permission-mode bypassPermissions`, e
política de exec efetiva restritiva normaliza inicializações live para
`--permission-mode default`, mesmo que args brutos do backend Claude especifiquem outro
modo.

Se você quiser uma configuração mais conservadora, restrinja a política de exec do OpenClaw de volta para
`allowlist` / `on-miss` ou `deny`.

### Configuração persistente "nunca solicitar" no host Gateway

<Steps>
  <Step title="Defina a política de configuração solicitada">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Faça o arquivo de approvals do host corresponder">
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
- Padrões do arquivo local de approvals, incluindo `askFallback: "full"`.

Ele é intencionalmente apenas local. Para alterar approvals de host Gateway ou host de nó
remotamente, use `openclaw approvals set --gateway` ou
`openclaw approvals set --node <id|name|ip>`.

### Host de nó

Para um host de nó, aplique o mesmo arquivo de approvals nesse nó:

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

- `openclaw exec-policy` não sincroniza approvals de nó.
- `openclaw exec-policy set --host node` é rejeitado.
- Exec approvals de nó são buscadas do nó em tempo de execução, portanto atualizações direcionadas ao nó devem usar `openclaw approvals --node ...`.

</Note>

### Atalho apenas de sessão

- `/exec security=full ask=off` altera apenas a sessão atual.
- `/elevated full` é um atalho de emergência que ignora aprovações de exec apenas quando
  tanto a política solicitada quanto o arquivo de aprovações do host resolvem para
  `security: "full"` e `ask: "off"`. Um arquivo de host mais restritivo, como
  `ask: "always"`, ainda solicita confirmação.

Se o arquivo de aprovações do host permanecer mais restritivo que a configuração, a política
mais restritiva do host ainda prevalece.

## Allowlist (por agente)

Allowlists são **por agente**. Se houver vários agentes, alterne qual agente
você está editando no app macOS. Os padrões são correspondências glob.

Os padrões podem ser globs de caminho binário resolvido ou globs de nome de comando simples.
Nomes simples correspondem apenas a comandos invocados por meio de `PATH`, portanto `rg` pode corresponder a
`/opt/homebrew/bin/rg` quando o comando é `rg`, mas **não** a `./rg` ou
`/tmp/rg`. Use um glob de caminho quando quiser confiar em uma localização
binária específica.

Entradas legadas de `agents.default` são migradas para `agents.main` ao carregar.
Cadeias de shell como `echo ok && pwd` ainda precisam que cada segmento de nível superior
satisfaça as regras da allowlist.

Exemplos:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Restringindo argumentos com argPattern

Adicione `argPattern` quando uma entrada de allowlist deve corresponder a um binário e a um
formato específico de argumentos. O OpenClaw avalia a expressão regular
contra os argumentos do comando analisados, excluindo o token do executável
(`argv[0]`). Para entradas escritas manualmente, os argumentos são unidos por um
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

Essa entrada permite `python3 safe.py`; `python3 other.py` é uma falha de correspondência
da allowlist. Se uma entrada somente de caminho para o mesmo binário também estiver presente, argumentos
sem correspondência ainda podem recorrer a essa entrada somente de caminho. Omita a entrada somente de caminho
quando o objetivo for restringir o binário aos argumentos declarados.

Entradas salvas por fluxos de aprovação podem usar um formato separador interno para
correspondência exata de argv. Prefira a UI ou o fluxo de aprovação para regenerar essas
entradas em vez de editar manualmente o valor codificado. Se o OpenClaw não conseguir
analisar argv para um segmento de comando, entradas com `argPattern` não correspondem.

Cada entrada de allowlist aceita:

| Campo              | Significado                                                     |
| ------------------ | --------------------------------------------------------------- |
| `pattern`          | Glob de caminho binário resolvido ou glob de nome de comando simples |
| `argPattern`       | Regex opcional de argv; entradas omitidas são somente de caminho |
| `id`               | UUID estável usado para identidade da UI                        |
| `source`           | Origem da entrada, como `allow-always`                          |
| `commandText`      | Texto do comando capturado quando um fluxo de aprovação criou a entrada |
| `lastUsedAt`       | Carimbo de data/hora do último uso                              |
| `lastUsedCommand`  | Último comando que correspondeu                                 |
| `lastResolvedPath` | Último caminho binário resolvido                                |

## Permitir automaticamente CLIs de Skills

Quando **Permitir automaticamente CLIs de Skills** está ativado, executáveis referenciados por
Skills conhecidas são tratados como incluídos na allowlist em nós (nó macOS ou host de nó
headless). Isso usa `skills.bins` pelo RPC do Gateway para buscar a
lista de binários de Skills. Desative isso se quiser allowlists manuais estritas.

<Warning>
- Esta é uma **allowlist implícita de conveniência**, separada das entradas manuais de allowlist de caminho.
- Ela é destinada a ambientes de operador confiáveis em que Gateway e nó estão no mesmo limite de confiança.
- Se você exigir confiança estritamente explícita, mantenha `autoAllowSkills: false` e use apenas entradas manuais de allowlist de caminho.

</Warning>

## Binários seguros e encaminhamento de aprovação

Para binários seguros (o caminho rápido somente stdin), detalhes de vinculação de interpretador e
como encaminhar solicitações de aprovação para Slack/Discord/Telegram (ou executá-las como
clientes nativos de aprovação), consulte
[Aprovações de exec - avançado](/pt-BR/tools/exec-approvals-advanced).

## Edição da Control UI

Use o cartão **Control UI → Nós → Aprovações de exec** para editar padrões,
substituições por agente e allowlists. Escolha um escopo (Padrões ou um agente),
ajuste a política, adicione/remova padrões da allowlist e depois **Salve**. A UI
mostra metadados de último uso por padrão para que você possa manter a lista organizada.

O seletor de destino escolhe **Gateway** (aprovações locais) ou um **Nó**.
Os nós devem anunciar `system.execApprovals.get/set` (app macOS ou
host de nó headless). Se um nó ainda não anunciar aprovações de exec,
edite diretamente o arquivo de aprovações local dele.

CLI: `openclaw approvals` aceita edição de gateway ou nó - consulte
[CLI de aprovações](/pt-BR/cli/approvals).

## Fluxo de aprovação

Quando uma solicitação é necessária, o gateway transmite
`exec.approval.requested` para clientes operadores. A Control UI e o app macOS
resolvem isso via `exec.approval.resolve`; em seguida, o gateway encaminha a
solicitação aprovada para o host do nó.

Para `host=node`, solicitações de aprovação incluem uma carga `systemRunPlan`
canônica. O gateway usa esse plano como o contexto autoritativo de
comando/cwd/sessão ao encaminhar solicitações aprovadas de `system.run`.

Isso importa para a latência de aprovação assíncrona:

- O caminho de exec do nó prepara um plano canônico antecipadamente.
- O registro de aprovação armazena esse plano e seus metadados de vinculação.
- Uma vez aprovado, a chamada final encaminhada de `system.run` reutiliza o plano armazenado em vez de confiar em edições posteriores do chamador.
- Se o chamador alterar `command`, `rawCommand`, `cwd`, `agentId` ou `sessionKey` após a criação da solicitação de aprovação, o gateway rejeita a execução encaminhada como uma incompatibilidade de aprovação.

## Eventos do sistema

O ciclo de vida de exec é exposto como mensagens do sistema:

- `Exec running` (somente se o comando exceder o limite de aviso de execução).
- `Exec finished`.

Elas são publicadas na sessão do agente depois que o nó relata o evento.
Aprovações de exec negadas são terminais para o próprio comando do host: o comando
não é executado. Para aprovações assíncronas do agente principal com uma sessão de origem,
o OpenClaw publica a negação de volta nessa sessão como um acompanhamento interno, para que o
agente possa parar de aguardar o comando assíncrono e evitar um reparo por resultado ausente.
Se não houver sessão ou se a sessão não puder ser retomada, o OpenClaw ainda pode
relatar uma negação concisa ao operador ou à rota de chat direta. Negações para
sessões de subagente não são publicadas de volta no subagente.
Aprovações de exec hospedadas no Gateway emitem os mesmos eventos de ciclo de vida quando o
comando termina (e opcionalmente quando fica em execução por mais tempo que o limite).
Execs protegidos por aprovação reutilizam o id de aprovação como `runId` nessas
mensagens para facilitar a correlação.

## Comportamento de aprovação negada

Quando uma aprovação de exec assíncrona é negada, o OpenClaw trata o comando do host como
terminal e fail-closed. Para sessões do agente principal, a negação é entregue como um
acompanhamento interno da sessão que informa ao agente que o comando assíncrono não foi executado.
Isso preserva a continuidade da transcrição sem expor saída obsoleta do comando. Se
a entrega da sessão não estiver disponível, o OpenClaw recorre a uma negação concisa ao operador ou
ao chat direto quando existe uma rota segura.

## Implicações

- **`full`** é poderoso; prefira allowlists quando possível.
- **`ask`** mantém você no controle, ao mesmo tempo em que permite aprovações rápidas.
- Allowlists por agente impedem que aprovações de um agente vazem para outros.
- Aprovações só se aplicam a solicitações de exec do host de **remetentes autorizados**. Remetentes não autorizados não podem emitir `/exec`.
- `/exec security=full` é uma conveniência no nível da sessão para operadores autorizados e ignora aprovações por design. Para bloquear rigidamente exec do host, defina a segurança de aprovações como `deny` ou negue a ferramenta `exec` via política de ferramentas.

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
    Modelo de segurança e hardening.
  </Card>
  <Card title="Sandbox vs política de ferramentas vs elevado" href="/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Quando recorrer a cada controle.
  </Card>
  <Card title="Skills" href="/pt-BR/tools/skills" icon="sparkles">
    Comportamento de permissão automática baseado em Skills.
  </Card>
</CardGroup>
