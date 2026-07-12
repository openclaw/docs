---
read_when:
    - Configuração de aprovações de execução ou listas de permissões
    - Implementando a experiência de aprovação de execução no aplicativo para macOS
    - Análise de prompts de escape do sandbox e suas implicações
sidebarTitle: Exec approvals
summary: 'Aprovações de execução no host: opções de política, listas de permissões e o fluxo de trabalho YOLO/estrito'
title: Aprovações de execução
x-i18n:
    generated_at: "2026-07-12T15:41:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b44efdfe5a6c9f3cc978baef91d80d1f75d39627d3a16f5971800809a642a72c
    source_path: tools/exec-approvals.md
    workflow: 16
---

As aprovações de execução são a **proteção do aplicativo complementar / host do Node** para permitir que um agente
em sandbox execute comandos em um host real (`gateway` ou `node`). Os comandos
são executados somente quando a política + lista de permissões + aprovação (opcional) do usuário estão todas de acordo.
As aprovações são aplicadas **além da** política de ferramentas e do controle de privilégios elevados (o modo elevado
`full` as ignora).

Para uma visão geral centrada nos modos `deny`, `allowlist`, `ask`, `auto`, `full`,
no mapeamento do Codex Guardian e nas permissões do ambiente ACPX, consulte
[Modos de permissão](/pt-BR/tools/permission-modes).

<Note>
A política efetiva é a **mais restritiva** entre `tools.exec.*` e os padrões
de aprovação: as aprovações só podem tornar mais rígidas as configurações de segurança/solicitação derivadas da configuração, nunca
torná-las menos rígidas. Se um campo de aprovação for omitido, o valor de `tools.exec` será
usado. A execução no host também usa o estado local de aprovações nessa máquina — um
`ask: "always"` local do host no arquivo de aprovações do host de execução continuará
solicitando aprovação mesmo se os padrões da sessão ou da configuração solicitarem `ask: "on-miss"`.
</Note>

## Onde se aplica

As aprovações de execução são impostas localmente no host de execução:

- **Host do Gateway** -> processo `openclaw` na máquina do Gateway.
- **Host do Node** -> executor do Node (aplicativo complementar para macOS ou host do Node sem interface gráfica).

### Modelo de confiança

- Chamadores autenticados pelo Gateway são operadores confiáveis desse Gateway.
- Nodes pareados estendem essa capacidade de operador confiável ao host do Node.
- As aprovações reduzem o risco de execução acidental, mas **não** constituem um limite de autenticação por usuário nem uma política de sistema de arquivos somente leitura.
- Depois de aprovado, um comando pode modificar arquivos de acordo com as permissões do sistema de arquivos do host ou sandbox selecionado.
- Execuções aprovadas no host do Node vinculam o contexto de execução canônico: diretório de trabalho, argv exato, vínculo de ambiente quando presente e caminho fixado do executável quando aplicável.
- Para scripts de shell e invocações diretas de arquivos por interpretador/runtime, o OpenClaw também tenta vincular um operando de arquivo local específico. Se esse arquivo for alterado após a aprovação, mas antes da execução, a execução será negada em vez de executar conteúdo divergente.
- A vinculação de arquivos é feita na medida do possível e não representa um modelo completo de todos os caminhos de carregamento de interpretadores/runtimes. Se não for possível identificar exatamente um arquivo local específico, o OpenClaw se recusará a criar uma execução respaldada por aprovação em vez de simular cobertura completa.

### Separação no macOS

- O **serviço do host do Node** encaminha `system.run` para o **aplicativo para macOS** por IPC local.
- O **aplicativo para macOS** impõe as aprovações e executa o comando no contexto da interface.

## Inspeção da política efetiva

| Comando                                                           | O que mostra                                                                                 |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Política solicitada, fontes da política do host e resultado efetivo.                         |
| `openclaw exec-policy show`                                      | Visão mesclada da máquina local.                                                             |
| `openclaw exec-policy set` / `preset`                            | Sincroniza, em uma única etapa, a política local solicitada com o arquivo local de aprovações do host. |

<Note>
As substituições de `/exec` por sessão não estão incluídas. Execute `/exec` na sessão relevante para inspecionar seus padrões atuais. Consulte [substituições de sessão](/pt-BR/tools/exec#session-overrides-exec).
</Note>

Referência completa da CLI (flags, saída JSON, adição/remoção da lista de permissões): [CLI de aprovações](/pt-BR/cli/approvals).

Quando um escopo local solicita `host=node`, `exec-policy show` informa que
esse escopo é gerenciado pelo Node durante a execução, em vez de tratar o arquivo local de aprovações
como fonte da verdade.

Se a interface do aplicativo complementar **não estiver disponível**, qualquer solicitação que
normalmente exibiria uma confirmação será resolvida pelo **fallback de solicitação** (padrão: `deny`).

<Tip>
Clientes nativos de aprovação por chat podem adicionar recursos específicos do canal à
mensagem de aprovação pendente. O Matrix adiciona atalhos de reação (`✅` permitir uma vez,
`♾️` permitir sempre, `❌` negar), mantendo `/approve ...` na
mensagem como fallback.
</Tip>

## Configurações e armazenamento

As aprovações ficam em um arquivo JSON local no host de execução. Quando
`OPENCLAW_STATE_DIR` está definido, o arquivo usa esse diretório de estado;
caso contrário, usa o diretório de estado padrão do OpenClaw:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# caso contrário
~/.openclaw/exec-approvals.json
```

O soquete de aprovação padrão usa a mesma raiz:
`$OPENCLAW_STATE_DIR/exec-approvals.sock` ou
`~/.openclaw/exec-approvals.sock` quando a variável não está definida.

Versões anteriores à 2026.6.6 sempre mantinham o arquivo em `~/.openclaw`. Se
`OPENCLAW_STATE_DIR` apontar para outro local e ainda houver um arquivo de aprovações
no diretório padrão, execute diretamente `openclaw doctor --fix` uma vez para importá-lo
para o diretório de estado (o original será arquivado com o sufixo `.migrated`).
O doctor interativo também pode visualizar e confirmar a importação. Execuções automatizadas
de atualização e reparo pelo observador do Gateway nunca importam entre diretórios de estado: um
diretório de estado temporário ou de preparação não deve capturar as aprovações da
instalação padrão. O mesmo limite se aplica às importações legadas de
`plugin-binding-approvals.json` para o estado SQLite compartilhado.

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

`tools.exec.mode` é a superfície de política normalizada preferencial para execução no host:

| Valor       | Comportamento                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | Bloqueia a execução no host.                                                                                                                                                                     |
| `allowlist` | Executa somente comandos presentes na lista de permissões, sem solicitar aprovação.                                                                                                              |
| `ask`       | Usa a política de lista de permissões e solicita aprovação quando não houver correspondência.                                                                                                    |
| `auto`      | Usa a política de lista de permissões, executa diretamente correspondências determinísticas e envia os casos sem aprovação ao revisor automático nativo do OpenClaw antes de recorrer à aprovação humana. |
| `full`      | Executa no host sem solicitações de aprovação.                                                                                                                                                   |

As opções legadas `tools.exec.security` / `tools.exec.ask` continuam sendo compatíveis e ainda
se aplicam sempre que `mode` não estiver definido nesse escopo.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` — bloqueia todas as solicitações de execução no host.
  - `allowlist` — permite somente comandos presentes na lista de permissões.
  - `full` — permite tudo (equivalente ao modo elevado).

O padrão é `full` para hosts de Gateway/Node; um host `sandbox` usa
`deny` como padrão.
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Política de solicitação configurada para execução no host. Controla o comportamento básico das
  solicitações de aprovação de `tools.exec.ask` e dos padrões de aprovação do host.
  O padrão é `off`. O parâmetro de ferramenta `ask` por chamada (consulte
  [Ferramenta de execução](/pt-BR/tools/exec#parameters)) só pode tornar essa base mais rígida, e
  chamadas de modelo originadas em canais o ignoram quando a solicitação efetiva do host é `off`.

- `off` — nunca solicita aprovação.
- `on-miss` — solicita aprovação somente quando a lista de permissões não corresponde.
- `always` — solicita aprovação para todos os comandos. A confiança persistente de `allow-always` **não** suprime solicitações quando o modo efetivo de solicitação é `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Resolução quando uma solicitação é obrigatória, mas nenhuma interface está acessível (ou a
  solicitação expira). O padrão é `deny` quando omitido.

- `deny` — bloqueia.
- `allowlist` — permite somente se houver correspondência na lista de permissões.
- `full` — permite.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Quando `true`, trata formas de avaliação de código em linha como sujeitas exclusivamente a aprovação, mesmo que o
  próprio binário do interpretador esteja na lista de permissões. Defesa em profundidade para
  carregadores de interpretador que não podem ser associados claramente a um único operando de arquivo estável.
</ParamField>

Exemplos detectados pelo modo estrito: `python -c`, `node -e`/`--eval`/`-p`,
`ruby -e`, `perl -e`/`-E`, `php -r`, `lua -e`, `osascript -e` (incluindo também formas em linha de `awk`,
`sed`, `make`, `find -exec` e `xargs`).

No modo estrito, esses comandos precisam de aprovação do revisor ou de aprovação explícita. Com
`tools.exec.mode: "auto"`, o revisor pode conceder uma única execução de baixo risco quando
o comando tiver um plano aplicável; caso contrário, o OpenClaw solicita aprovação humana.
As aprovações de comando do `Codex app-server` que chegam ao fallback do revisor solicitam aprovação
humana porque suas solicitações de aprovação não expõem um executável resolvido cuja aplicação possa ser garantida.
`allow-always` não persiste novas entradas na lista de permissões para comandos de avaliação em linha.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Somente apresentação: quando ativado, o OpenClaw pode anexar
  intervalos de comandos derivados do analisador para que as solicitações de aprovação na Web possam destacar tokens de comando. Isso
  **não** altera `security`, `ask`, a correspondência da lista de permissões, o comportamento estrito de avaliação em linha,
  o encaminhamento de aprovações nem a execução de comandos.
</ParamField>

Defina globalmente em `tools.exec.commandHighlighting` ou por agente em
`agents.list[].tools.exec.commandHighlighting`.

## Modo YOLO (sem aprovação)

Para executar no host sem solicitações de aprovação, abra **ambas** as camadas de política:
a política de execução solicitada na configuração do OpenClaw (`tools.exec.*`) **e**
a política de aprovações local do host no arquivo de aprovações do host de execução.

Quando omitido, `askFallback` usa `deny` como padrão. Defina explicitamente `askFallback` do host como `full`
quando uma solicitação de aprovação sem interface precisar recorrer à permissão.

| Camada                | Configuração YOLO          |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` em `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| `askFallback` do host | `full`                     |

<Warning>
**Distinções importantes:**

- `tools.exec.host=auto` escolhe **onde** a execução ocorre: na sandbox quando disponível; caso contrário, no Gateway.
- YOLO escolhe **como** a execução no host é aprovada: `security=full` mais `ask=off`.
- YOLO **não** adiciona um controle heurístico separado de aprovação por ofuscação de comandos nem uma camada de rejeição de pré-verificação de scripts além da política de execução no host configurada.
- `auto` não transforma o roteamento para o Gateway em uma substituição livre a partir de uma sessão em sandbox. Uma solicitação por chamada de `host=node` é permitida a partir de `auto`; `host=gateway` só é permitido a partir de `auto` quando nenhum runtime de sandbox está ativo. Para um padrão estável que não seja automático, defina `tools.exec.host` ou use explicitamente `/exec host=...`.

</Warning>

Provedores baseados em CLI que expõem seu próprio modo de permissão não interativo
podem seguir esta política. A CLI do Claude adiciona
`--permission-mode bypassPermissions` quando a política efetiva de execução
do OpenClaw é YOLO. Para sessões ativas do Claude gerenciadas pelo OpenClaw, a
política efetiva de execução do OpenClaw prevalece sobre o modo de permissão nativo do Claude:
YOLO normaliza inicializações de sessões ativas para `--permission-mode bypassPermissions`, e
uma política efetiva de execução restritiva normaliza inicializações de sessões ativas para
`--permission-mode default`, mesmo que os argumentos brutos do backend do Claude especifiquem outro
modo.

Se você quiser uma configuração mais conservadora, torne a política de execução do OpenClaw novamente
mais restritiva com `allowlist` / `on-miss` ou `deny`.

### Configuração persistente de "nunca solicitar" no host do Gateway

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

Atualiza tanto `tools.exec.host/security/ask` locais quanto os padrões do arquivo
local de aprovações (incluindo `askFallback: "full"`). Ele é intencionalmente
somente local. Para alterar remotamente as aprovações do host do Gateway ou do host do Node, use
`openclaw approvals set --gateway` ou `openclaw approvals set --node
<id|name|ip>`.

Outras predefinições integradas: `cautious` (`host=gateway`, `security=allowlist`,
`ask=on-miss`, `askFallback=deny`) e `deny-all` (`host=gateway`,
`security=deny`, `ask=off`, `askFallback=deny`). Aplique da mesma forma:
`openclaw exec-policy preset cautious`.

Para definir campos individuais em vez de uma predefinição completa, use
`openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>` com qualquer subconjunto dessas opções.

### Host do Node

Em vez disso, aplique o mesmo arquivo de aprovações no Node:

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

- `openclaw exec-policy` não sincroniza aprovações do Node.
- `openclaw exec-policy set --host node` é rejeitado.
- As aprovações de execução do Node são obtidas do Node em tempo de execução; portanto, atualizações destinadas ao Node devem usar `openclaw approvals --node ...`.

</Note>

### Atalho somente para a sessão

- `/exec security=full ask=off` altera somente a sessão atual.
- `/elevated full` é um atalho emergencial que ignora as aprovações de execução somente
  quando tanto a política solicitada quanto o arquivo de aprovações do host resultam em
  `security: "full"` e `ask: "off"`. Um arquivo do host mais restritivo, como `ask:
"always"`, ainda solicita aprovação.

Se o arquivo de aprovações do host permanecer mais restritivo que a configuração, a política mais
restritiva do host ainda prevalecerá.

## Lista de permissões (por agente)

As listas de permissões são **por agente**. Se houver vários agentes, alterne o agente
que você está editando no aplicativo para macOS. Os padrões usam correspondência glob.

Os padrões podem ser globs de caminhos resolvidos de binários ou globs apenas com o nome do comando.
Nomes simples correspondem somente a comandos invocados por meio de `PATH`; portanto, `rg` pode corresponder a
`/opt/homebrew/bin/rg` quando o comando é `rg`, mas **não** a `./rg` nem a
`/tmp/rg`. Use um glob de caminho para confiar em um local específico do binário.

Entradas legadas de `agents.default` são migradas para `agents.main` durante o carregamento.
Cadeias de shell como `echo ok && pwd` ainda exigem que cada segmento de nível superior
satisfaça as regras da lista de permissões.

Exemplos:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Restrição de argumentos com argPattern

Adicione `argPattern` quando uma entrada da lista de permissões precisar corresponder a um binário e a um
formato específico de argumentos. O OpenClaw usa a semântica de expressões regulares
ECMAScript (JavaScript) em todos os hosts e avalia a expressão em relação
aos argumentos analisados do comando, excluindo o token do executável (`argv[0]`).
Para entradas criadas manualmente, os argumentos são unidos por um único espaço; portanto,
ancore o padrão quando precisar de uma correspondência exata.

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

Essa entrada permite `python3 safe.py`; `python3 other.py` não corresponde à lista de
permissões. Se também houver uma entrada somente de caminho para o mesmo binário, argumentos
não correspondentes ainda poderão recorrer a essa entrada somente de caminho. Omita a entrada
somente de caminho quando o objetivo for restringir o binário aos argumentos declarados.

Entradas salvas por fluxos de aprovação usam um formato interno com separadores para correspondência
exata de argv. Prefira a interface ou o fluxo de aprovação para regenerar essas entradas
em vez de editar manualmente o valor codificado. Se o OpenClaw não conseguir analisar argv
para um segmento de comando, entradas com `argPattern` não corresponderão.

Cada entrada da lista de permissões aceita:

| Campo              | Significado                                                       |
| ------------------ | ----------------------------------------------------------------- |
| `pattern`          | Glob de caminho resolvido do binário ou glob simples do nome do comando |
| `argPattern`       | Regex ECMAScript opcional para argv; omitido significa somente caminho |
| `id`               | ID opaco estável; gerado como UUID quando ausente                 |
| `source`           | Origem da entrada, como `allow-always`                            |
| `commandText`      | Entrada legada em texto simples; descartada durante o carregamento |
| `lastUsedAt`       | Carimbo de data e hora do último uso                              |
| `lastUsedCommand`  | Último comando correspondente                                     |
| `lastResolvedPath` | Último caminho resolvido do binário                               |

## Permissão automática de CLIs de Skills

Quando **Permitir automaticamente CLIs de Skills** (`autoAllowSkills`) está ativado, os executáveis
referenciados por Skills conhecidas são tratados como permitidos nos Nodes (Node do macOS
ou host de Node sem interface gráfica). Isso usa `skills.bins` por meio do RPC do Gateway para
obter a lista de binários das Skills. Desative essa opção se quiser listas de permissões
manuais estritas.

<Warning>
- Esta é uma **lista de permissões implícita por conveniência**, separada das entradas manuais da lista de permissões por caminho.
- Destina-se a ambientes de operadores confiáveis nos quais o Gateway e o Node estão no mesmo limite de confiança.
- Se você exigir confiança explícita estrita, mantenha `autoAllowSkills: false` e use somente entradas manuais da lista de permissões por caminho.

</Warning>

## Binários seguros e encaminhamento de aprovações

Para binários seguros (o caminho rápido somente por stdin), detalhes da vinculação de interpretadores e
como encaminhar solicitações de aprovação para Slack/Discord/Telegram (ou executá-las como
clientes nativos de aprovação), consulte
[Aprovações de execução — avançado](/pt-BR/tools/exec-approvals-advanced).

## Edição na interface de controle

Use o cartão **Control UI -> Nodes -> Exec approvals** para editar padrões,
substituições por agente e listas de permissões. Escolha um escopo (Defaults ou um agente),
ajuste a política, adicione/remova padrões da lista de permissões e depois clique em **Save**. A interface
mostra os metadados do último uso por padrão para que você possa manter a lista organizada.

O seletor de destino escolhe **Gateway** (aprovações locais) ou um **Node**.
Os Nodes precisam anunciar `system.execApprovals.get/set` (aplicativo para macOS ou host de
Node sem interface gráfica). Se um Node ainda não anunciar aprovações de execução, edite diretamente seu
arquivo local de aprovações.

Alguns hosts de Node, incluindo o aplicativo complementar para Windows, possuem outro formato de política
de aprovação. A interface de controle exibe essas políticas nativas do host somente para leitura. Use o
aplicativo complementar ou `openclaw approvals set --node <id|name|ip>` com o formato
nativo da política para editá-las; consulte [CLI de aprovações](/pt-BR/cli/approvals).

CLI: `openclaw approvals` permite editar o Gateway ou o Node — consulte
[CLI de aprovações](/pt-BR/cli/approvals).

## Fluxo de aprovação

Quando uma solicitação é necessária, o Gateway transmite
`exec.approval.requested` aos clientes operadores. A interface de controle e o aplicativo para macOS
a resolvem por meio de `exec.approval.resolve`; então, o Gateway encaminha a
solicitação aprovada ao host do Node.

Para `host=node`, as solicitações de aprovação incluem uma carga útil canônica `systemRunPlan`.
O Gateway usa esse plano como o contexto autoritativo de comando/cwd/sessão
ao encaminhar solicitações `system.run` aprovadas:

- O caminho de execução do Node prepara antecipadamente um único plano canônico.
- O registro de aprovação armazena esse plano e seus metadados de vinculação.
- Após a aprovação, a chamada `system.run` final encaminhada reutiliza o plano armazenado em vez de confiar em edições posteriores do chamador.
- Se o chamador alterar `command`, `rawCommand`, `cwd`, `agentId` ou `sessionKey` depois que a solicitação de aprovação for criada, o Gateway rejeitará a execução encaminhada por incompatibilidade de aprovação.

## Eventos do sistema e recusas

O ciclo de vida da execução publica uma mensagem de sistema `Exec finished` na sessão do agente
depois que o Node informa a conclusão. O OpenClaw também pode emitir um aviso
de execução em andamento após uma aprovação ser concedida, quando
`tools.exec.approvalRunningNoticeMs` transcorrer (o padrão é `10000`; `0` o desativa).
Aprovações de execução recusadas são terminais para o comando do host: o comando
não é executado.

- Para aprovações assíncronas do agente principal com uma sessão de origem, o OpenClaw
  publica a recusa de volta nessa sessão como um acompanhamento interno, para que o
  agente possa parar de aguardar o comando assíncrono e evitar um reparo por resultado
  ausente.
- Se não houver sessão ou não for possível retomá-la, o OpenClaw ainda poderá
  informar uma recusa concisa ao operador ou à rota de chat direto.
- Recusas em sessões de subagentes e Cron não são publicadas de volta nessa
  sessão.

As aprovações de execução no host do Gateway emitem o mesmo evento de conclusão do ciclo de vida.
Execuções sujeitas a aprovação reutilizam o ID da aprovação para correlacionar a solicitação
pendente com sua mensagem de conclusão/recusa (`Exec finished (gateway
id=...)` / `Exec denied (gateway id=...)`).

## Implicações

- **`full`** é poderoso; prefira listas de permissões quando possível.
- **`ask`** mantém você informado e ainda permite aprovações rápidas.
- Listas de permissões por agente impedem que as aprovações de um agente vazem para outros.
- As aprovações se aplicam somente a solicitações de execução no host feitas por **remetentes autorizados**. Remetentes não autorizados não podem emitir `/exec`.
- `/exec security=full` é uma conveniência no nível da sessão para operadores autorizados e ignora aprovações por design. Para bloquear totalmente a execução no host, defina a segurança das aprovações como `deny` ou negue a ferramenta `exec` por meio da política de ferramentas.

## Relacionados

<CardGroup cols={2}>
  <Card title="Aprovações de execução — avançado" href="/pt-BR/tools/exec-approvals-advanced" icon="gear">
    Binários seguros, vinculação de interpretadores e encaminhamento de aprovações para o chat.
  </Card>
  <Card title="Ferramenta de execução" href="/pt-BR/tools/exec" icon="terminal">
    Ferramenta de execução de comandos do shell.
  </Card>
  <Card title="Modo elevado" href="/pt-BR/tools/elevated" icon="shield-exclamation">
    Caminho emergencial que também ignora aprovações.
  </Card>
  <Card title="Sandboxing" href="/pt-BR/gateway/sandboxing" icon="box">
    Modos de sandbox e acesso ao workspace.
  </Card>
  <Card title="Segurança" href="/pt-BR/gateway/security" icon="lock">
    Modelo de segurança e reforço de proteção.
  </Card>
  <Card title="Sandbox versus política de ferramentas versus modo elevado" href="/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Quando usar cada controle.
  </Card>
  <Card title="Skills" href="/pt-BR/tools/skills" icon="sparkles">
    Comportamento de permissão automática baseado em Skills.
  </Card>
</CardGroup>
