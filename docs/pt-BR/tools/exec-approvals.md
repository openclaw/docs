---
read_when:
    - Configuração de aprovações de execução ou listas de permissões
    - Implementando a experiência de aprovação de execução no aplicativo para macOS
    - Análise de prompts de escape do sandbox e suas implicações
sidebarTitle: Exec approvals
summary: 'Aprovações de execução no host: opções de política, listas de permissões e o fluxo de trabalho YOLO/estrito'
title: Aprovações de execução
x-i18n:
    generated_at: "2026-07-12T00:25:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b44efdfe5a6c9f3cc978baef91d80d1f75d39627d3a16f5971800809a642a72c
    source_path: tools/exec-approvals.md
    workflow: 16
---

As aprovações de execução são a **proteção do aplicativo complementar / host Node** para permitir que um agente
em sandbox execute comandos em um host real (`gateway` ou `node`). Os comandos
são executados somente quando a política + a lista de permissões + a aprovação
(opcional) do usuário estão todas de acordo. As aprovações são aplicadas **além da**
política de ferramentas e do controle de elevação (o modo elevado `full` as ignora).

Para uma visão geral centrada nos modos `deny`, `allowlist`, `ask`, `auto`, `full`,
no mapeamento do Codex Guardian e nas permissões do ambiente de execução ACPX, consulte
[Modos de permissão](/pt-BR/tools/permission-modes).

<Note>
A política efetiva é a **mais restritiva** entre `tools.exec.*` e os padrões
de aprovação: as aprovações só podem tornar mais rígidas as configurações de
segurança/consulta derivadas da configuração, nunca torná-las menos rígidas.
Se um campo de aprovação for omitido, será usado o valor de `tools.exec`.
A execução no host também usa o estado local de aprovações nessa máquina — um
`ask: "always"` local do host no arquivo de aprovações do host de execução
continuará solicitando confirmação mesmo que os padrões da sessão ou da
configuração solicitem `ask: "on-miss"`.
</Note>

## Onde se aplica

As aprovações de execução são impostas localmente no host de execução:

- **Host do Gateway** -> processo `openclaw` na máquina do Gateway.
- **Host Node** -> executor Node (aplicativo complementar para macOS ou host Node sem interface gráfica).

### Modelo de confiança

- Chamadores autenticados pelo Gateway são operadores confiáveis desse Gateway.
- Nodes pareados estendem essa capacidade de operador confiável ao host Node.
- As aprovações reduzem o risco de execução acidental, mas **não** são um limite de autenticação por usuário nem uma política de sistema de arquivos somente leitura.
- Depois de aprovado, um comando pode modificar arquivos de acordo com as permissões do sistema de arquivos do host ou da sandbox selecionada.
- Execuções aprovadas no host Node vinculam o contexto de execução canônico: cwd, argv exato, vinculação de ambiente quando presente e caminho fixado do executável quando aplicável.
- Para scripts de shell e invocações diretas de arquivos por interpretadores/ambientes de execução, o OpenClaw também tenta vincular um operando de arquivo local concreto. Se esse arquivo for alterado depois da aprovação, mas antes da execução, a execução será negada em vez de executar conteúdo divergente.
- A vinculação de arquivos é feita com o melhor esforço possível, não sendo um modelo completo de todos os caminhos de carregamento de interpretadores/ambientes de execução. Se não for possível identificar exatamente um arquivo local concreto, o OpenClaw se recusará a emitir uma execução respaldada por aprovação, em vez de simular cobertura completa.

### Divisão no macOS

- O **serviço do host Node** encaminha `system.run` ao **aplicativo para macOS** por IPC local.
- O **aplicativo para macOS** impõe as aprovações e executa o comando no contexto da interface.

## Inspeção da política efetiva

| Comando                                                          | O que ele mostra                                                                        |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Política solicitada, fontes de política do host e resultado efetivo.                    |
| `openclaw exec-policy show`                                      | Visão mesclada da máquina local.                                                        |
| `openclaw exec-policy set` / `preset`                            | Sincroniza, em uma etapa, a política local solicitada com o arquivo local de aprovações do host. |

<Note>
As substituições de `/exec` por sessão não são incluídas. Execute `/exec` na sessão relevante para inspecionar os padrões atuais dela. Consulte [substituições de sessão](/pt-BR/tools/exec#session-overrides-exec).
</Note>

Referência completa da CLI (flags, saída JSON, adição/remoção da lista de permissões): [CLI de aprovações](/pt-BR/cli/approvals).

Quando um escopo local solicita `host=node`, `exec-policy show` informa que
esse escopo é gerenciado pelo Node em tempo de execução, em vez de tratar o
arquivo local de aprovações como a fonte da verdade.

Se a interface do aplicativo complementar **não estiver disponível**, qualquer
solicitação que normalmente exibiria uma confirmação será resolvida pelo
**fallback de consulta** (padrão: `deny`).

<Tip>
Clientes nativos de aprovação por chat podem fornecer recursos específicos do
canal na mensagem de aprovação pendente. O Matrix fornece atalhos por reações
(`✅` permitir uma vez, `♾️` permitir sempre, `❌` negar), mantendo
`/approve ...` na mensagem como fallback.
</Tip>

## Configurações e armazenamento

As aprovações ficam em um arquivo JSON local no host de execução. Quando
`OPENCLAW_STATE_DIR` está definido, o arquivo acompanha esse diretório de estado;
caso contrário, usa o diretório de estado padrão do OpenClaw:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# caso contrário
~/.openclaw/exec-approvals.json
```

O socket de aprovação padrão segue a mesma raiz:
`$OPENCLAW_STATE_DIR/exec-approvals.sock`, ou
`~/.openclaw/exec-approvals.sock` quando a variável não está definida.

Versões anteriores à 2026.6.6 sempre mantinham o arquivo em `~/.openclaw`. Se
`OPENCLAW_STATE_DIR` apontar para outro local e ainda existir um arquivo de
aprovações no diretório padrão, execute `openclaw doctor --fix` diretamente
uma vez para importá-lo para o diretório de estado (o original será arquivado
com o sufixo `.migrated`). O doctor interativo também pode visualizar e
confirmar a importação. As execuções automatizadas de atualização e reparo de
monitoramento do Gateway nunca importam dados entre diretórios de estado: um
diretório de estado temporário ou de preparação não deve capturar as aprovações
da instalação padrão. O mesmo limite se aplica às importações legadas de
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

| Valor       | Comportamento                                                                                                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | Bloqueia a execução no host.                                                                                                                                                           |
| `allowlist` | Executa somente comandos da lista de permissões sem solicitar confirmação.                                                                                                             |
| `ask`       | Usa a política da lista de permissões e solicita confirmação quando não há correspondência.                                                                                            |
| `auto`      | Usa a política da lista de permissões, executa diretamente correspondências determinísticas e envia as demais solicitações ao revisor automático nativo do OpenClaw antes de recorrer a uma rota de aprovação humana. |
| `full`      | Executa no host sem solicitações de aprovação.                                                                                                                                         |

Os campos legados `tools.exec.security` / `tools.exec.ask` continuam compatíveis
e ainda se aplicam sempre que `mode` não estiver definido nesse escopo.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - bloqueia todas as solicitações de execução no host.
  - `allowlist` - permite somente comandos da lista de permissões.
  - `full` - permite tudo (equivalente ao modo elevado).

O padrão é `full` para hosts Gateway/Node; um host `sandbox` usa `deny`
como padrão.
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Política de consulta configurada para execução no host. Controla o
  comportamento básico das solicitações de aprovação de `tools.exec.ask` e
  dos padrões de aprovação do host. O padrão é `off`. O parâmetro `ask` da
  ferramenta por chamada (consulte [Ferramenta Exec](/pt-BR/tools/exec#parameters))
  só pode tornar essa base mais rígida, e chamadas de modelo originadas em
  canais o ignoram quando a consulta efetiva do host é `off`.

- `off` - nunca solicita confirmação.
- `on-miss` - solicita confirmação somente quando a lista de permissões não corresponde.
- `always` - solicita confirmação em todos os comandos. A confiança persistente de `allow-always` **não** suprime as solicitações quando o modo efetivo de consulta é `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Resolução quando uma solicitação de confirmação é necessária, mas nenhuma
  interface está acessível (ou o tempo da solicitação se esgota). O padrão é
  `deny` quando omitido.

- `deny` - bloqueia.
- `allowlist` - permite somente se houver correspondência na lista de permissões.
- `full` - permite.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Quando `true`, trata formas de avaliação de código em linha como sujeitas
  exclusivamente a aprovação, mesmo que o binário do interpretador esteja na
  lista de permissões. É uma defesa em profundidade para carregadores de
  interpretadores que não podem ser associados claramente a um único operando
  de arquivo estável.
</ParamField>

Exemplos detectados pelo modo estrito: `python -c`, `node -e`/`--eval`/`-p`,
`ruby -e`, `perl -e`/`-E`, `php -r`, `lua -e`, `osascript -e` (também formas
em linha de `awk`, `sed`, `make`, `find -exec` e `xargs`).

No modo estrito, esses comandos precisam de aprovação do revisor ou de uma
aprovação explícita. Com `tools.exec.mode: "auto"`, o revisor pode conceder
uma execução única de baixo risco quando o comando tiver um plano aplicável;
caso contrário, o OpenClaw solicitará aprovação humana.
As aprovações de comandos do `Codex app-server` que chegam ao fallback do revisor
solicitam aprovação humana porque suas solicitações de aprovação não expõem um
executável resolvido que possa ser imposto.
`allow-always` não persiste novas entradas na lista de permissões para comandos
de avaliação em linha.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Apenas apresentação: quando habilitado, o OpenClaw pode anexar trechos de
  comando derivados do analisador para que as solicitações de aprovação na
  Web possam destacar tokens de comando. Isso **não** altera `security`, `ask`,
  a correspondência da lista de permissões, o comportamento estrito de
  avaliação em linha, o encaminhamento de aprovações nem a execução de comandos.
</ParamField>

Defina globalmente em `tools.exec.commandHighlighting` ou por agente em
`agents.list[].tools.exec.commandHighlighting`.

## Modo YOLO (sem aprovação)

Para executar no host sem solicitações de aprovação, abra **ambas** as camadas
de política: a política de execução solicitada na configuração do OpenClaw
(`tools.exec.*`) **e** a política local de aprovações do host no arquivo de
aprovações do host de execução.

Quando omitido, `askFallback` usa `deny` como padrão. Defina explicitamente
`askFallback` do host como `full` quando uma solicitação de aprovação sem
interface deva recorrer à permissão.

| Camada                | Configuração YOLO          |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` em `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| `askFallback` do host | `full`                     |

<Warning>
**Distinções importantes:**

- `tools.exec.host=auto` escolhe **onde** a execução ocorre: na sandbox quando disponível; caso contrário, no Gateway.
- YOLO escolhe **como** a execução no host é aprovada: `security=full` mais `ask=off`.
- YOLO **não** adiciona um controle heurístico separado de aprovação por ofuscação de comandos nem uma camada de rejeição de pré-verificação de scripts sobre a política configurada de execução no host.
- `auto` não transforma o roteamento para o Gateway em uma substituição irrestrita a partir de uma sessão em sandbox. Uma solicitação `host=node` por chamada é permitida a partir de `auto`; `host=gateway` só é permitido a partir de `auto` quando nenhum ambiente de execução de sandbox está ativo. Para um padrão estável que não seja automático, defina `tools.exec.host` ou use `/exec host=...` explicitamente.

</Warning>

Provedores baseados em CLI que expõem seu próprio modo de permissão não interativo
podem seguir esta política. A CLI do Claude adiciona
`--permission-mode bypassPermissions` quando a política efetiva de execução do
OpenClaw é YOLO. Para sessões ativas do Claude gerenciadas pelo OpenClaw, a
política efetiva de execução do OpenClaw prevalece sobre o modo de permissão nativo do Claude:
YOLO normaliza as inicializações de sessões ativas para `--permission-mode bypassPermissions`, e
uma política efetiva de execução restritiva normaliza as inicializações de sessões ativas para
`--permission-mode default`, mesmo que os argumentos brutos do backend do Claude especifiquem outro
modo.

Se você quiser uma configuração mais conservadora, restrinja novamente a política de execução do OpenClaw para
`allowlist` / `on-miss` ou `deny`.

### Configuração persistente de "nunca solicitar" no host do Gateway

<Steps>
  <Step title="Defina a política de configuração desejada">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Ajuste o arquivo de aprovações do host">
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

Atualiza tanto `tools.exec.host/security/ask` localmente quanto os padrões do arquivo
local de aprovações (incluindo `askFallback: "full"`). Ele é intencionalmente
exclusivo para uso local. Para alterar remotamente as aprovações do host do Gateway ou do host do Node, use
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
**Limitações exclusivas do uso local:**

- `openclaw exec-policy` não sincroniza as aprovações do Node.
- `openclaw exec-policy set --host node` é rejeitado.
- As aprovações de execução do Node são obtidas do Node durante a execução, portanto as atualizações destinadas ao Node devem usar `openclaw approvals --node ...`.

</Note>

### Atalho exclusivo da sessão

- `/exec security=full ask=off` altera apenas a sessão atual.
- `/elevated full` é um atalho de emergência que ignora as aprovações de execução somente
  quando tanto a política solicitada quanto o arquivo de aprovações do host resultam em
  `security: "full"` e `ask: "off"`. Um arquivo de host mais restritivo, como `ask:
"always"`, ainda solicita aprovação.

Se o arquivo de aprovações do host permanecer mais restritivo que a configuração, a política mais
restritiva do host ainda prevalecerá.

## Lista de permissões (por agente)

As listas de permissões são **por agente**. Se houver vários agentes, alterne o agente
que você está editando no aplicativo para macOS. Os padrões usam correspondência glob.

Os padrões podem ser globs de caminhos resolvidos de binários ou globs de nomes simples de comandos.
Nomes simples correspondem apenas a comandos invocados por meio de `PATH`, portanto `rg` pode corresponder a
`/opt/homebrew/bin/rg` quando o comando é `rg`, mas **não** a `./rg` ou
`/tmp/rg`. Use um glob de caminho para confiar em um local específico do binário.

Entradas legadas em `agents.default` são migradas para `agents.main` durante o carregamento.
Encadeamentos de shell, como `echo ok && pwd`, ainda exigem que cada segmento de nível superior
atenda às regras da lista de permissões.

Exemplos:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Restrição de argumentos com argPattern

Adicione `argPattern` quando uma entrada da lista de permissões precisar corresponder a um binário e a um
formato específico de argumentos. O OpenClaw usa a semântica de expressões regulares
ECMAScript (JavaScript) em todos os hosts e avalia a expressão em relação aos
argumentos analisados do comando, excluindo o token do executável (`argv[0]`).
Para entradas criadas manualmente, os argumentos são unidos com um único espaço; portanto,
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
permissões. Se também houver uma entrada baseada somente no caminho para o mesmo binário, argumentos
sem correspondência ainda poderão recorrer a essa entrada baseada somente no caminho. Omita a entrada baseada somente no
caminho quando o objetivo for restringir o binário aos argumentos declarados.

As entradas salvas pelos fluxos de aprovação usam um formato interno de separador para a correspondência
exata de argv. Prefira usar a interface ou o fluxo de aprovação para gerar novamente essas entradas,
em vez de editar manualmente o valor codificado. Se o OpenClaw não conseguir analisar argv
para um segmento de comando, as entradas com `argPattern` não corresponderão.

Cada entrada da lista de permissões oferece suporte a:

| Campo              | Significado                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `pattern`          | Glob do caminho resolvido do binário ou glob do nome simples do comando |
| `argPattern`       | Expressão regular ECMAScript opcional para argv; quando omitida, usa somente o caminho |
| `id`               | ID opaco estável; gerado como UUID quando ausente                  |
| `source`           | Origem da entrada, como `allow-always`                             |
| `commandText`      | Entrada legada em texto simples; descartada durante o carregamento |
| `lastUsedAt`       | Carimbo de data e hora do último uso                               |
| `lastUsedCommand`  | Último comando que correspondeu                                    |
| `lastResolvedPath` | Último caminho resolvido do binário                                |

## Permissão automática de CLIs de Skills

Quando **Permitir automaticamente CLIs de Skills** (`autoAllowSkills`) está habilitado, os executáveis
referenciados por Skills conhecidas são tratados como permitidos nos Nodes (Node do macOS
ou host de Node sem interface gráfica). Isso usa `skills.bins` por meio do RPC do Gateway para
obter a lista de binários das Skills. Desabilite essa opção se quiser listas de permissões
manuais estritas.

<Warning>
- Esta é uma **lista de permissões implícita por conveniência**, separada das entradas manuais de caminhos na lista de permissões.
- Ela se destina a ambientes de operadores confiáveis nos quais o Gateway e o Node estejam no mesmo limite de confiança.
- Se você exigir confiança explícita estrita, mantenha `autoAllowSkills: false` e use somente entradas manuais de caminhos na lista de permissões.

</Warning>

## Binários seguros e encaminhamento de aprovações

Para binários seguros (o caminho rápido exclusivo para stdin), detalhes da vinculação de interpretadores e
como encaminhar solicitações de aprovação para Slack/Discord/Telegram (ou executá-las como
clientes nativos de aprovação), consulte
[Aprovações de execução — avançado](/pt-BR/tools/exec-approvals-advanced).

## Edição na interface de controle

Use o cartão **Interface de controle -> Nodes -> Aprovações de execução** para editar os padrões,
as substituições por agente e as listas de permissões. Escolha um escopo (Padrões ou um agente),
ajuste a política, adicione/remova padrões da lista de permissões e clique em **Salvar**. A interface
mostra os metadados do último uso por padrão para ajudar você a manter a lista organizada.

O seletor de destino escolhe **Gateway** (aprovações locais) ou um **Node**.
Os Nodes devem anunciar `system.execApprovals.get/set` (aplicativo para macOS ou
host de Node sem interface gráfica). Se um Node ainda não anunciar aprovações de execução, edite diretamente
seu arquivo local de aprovações.

Alguns hosts de Node, incluindo o aplicativo complementar para Windows, usam um formato diferente de política
de aprovação. A interface de controle mostra essas políticas nativas do host como somente leitura. Use o
aplicativo complementar ou `openclaw approvals set --node <id|name|ip>` com o formato
nativo da política para editá-las; consulte [CLI de aprovações](/pt-BR/cli/approvals).

CLI: `openclaw approvals` oferece suporte à edição no Gateway ou no Node — consulte
[CLI de aprovações](/pt-BR/cli/approvals).

## Fluxo de aprovação

Quando uma solicitação é necessária, o Gateway transmite
`exec.approval.requested` aos clientes dos operadores. A interface de controle e o aplicativo para macOS
a resolvem por meio de `exec.approval.resolve`; em seguida, o Gateway encaminha a
solicitação aprovada ao host do Node.

Para `host=node`, as solicitações de aprovação incluem uma carga útil canônica `systemRunPlan`.
O Gateway usa esse plano como contexto autoritativo de comando/cwd/sessão
ao encaminhar solicitações `system.run` aprovadas:

- O caminho de execução do Node prepara antecipadamente um único plano canônico.
- O registro de aprovação armazena esse plano e seus metadados de vinculação.
- Após a aprovação, a chamada `system.run` final encaminhada reutiliza o plano armazenado, em vez de confiar em alterações posteriores do chamador.
- Se o chamador alterar `command`, `rawCommand`, `cwd`, `agentId` ou `sessionKey` após a criação da solicitação de aprovação, o Gateway rejeitará a execução encaminhada por incompatibilidade de aprovação.

## Eventos do sistema e recusas

O ciclo de vida da execução publica uma mensagem de sistema `Exec finished` na sessão do
agente depois que o Node informa a conclusão. O OpenClaw também pode emitir um
aviso de execução em andamento após a concessão de uma aprovação, depois que
`tools.exec.approvalRunningNoticeMs` decorrer (o padrão é `10000`; `0` o desabilita).
A recusa de uma aprovação de execução é terminal para o comando no host: o comando
não é executado.

- Para aprovações assíncronas do agente principal com uma sessão de origem, o OpenClaw
  publica a recusa novamente nessa sessão como um acompanhamento interno, para que o
  agente possa parar de aguardar o comando assíncrono e evitar uma correção por
  resultado ausente.
- Se não houver uma sessão ou não for possível retomá-la, o OpenClaw ainda poderá
  informar uma recusa concisa ao operador ou à rota direta de conversa.
- As recusas de sessões de subagentes e Cron não são publicadas novamente nessas
  sessões.

As aprovações de execução no host do Gateway emitem o mesmo evento de conclusão do ciclo de vida.
Execuções sujeitas a aprovação reutilizam o ID da aprovação para correlacionar a solicitação
pendente com sua mensagem de conclusão/recusa (`Exec finished (gateway
id=...)` / `Exec denied (gateway id=...)`).

## Implicações

- **`full`** é poderoso; prefira listas de permissões quando possível.
- **`ask`** mantém você informado e ainda permite aprovações rápidas.
- Listas de permissões por agente impedem que as aprovações de um agente sejam aplicadas a outros.
- As aprovações se aplicam somente a solicitações de execução no host provenientes de **remetentes autorizados**. Remetentes não autorizados não podem emitir `/exec`.
- `/exec security=full` é uma conveniência no nível da sessão para operadores autorizados e ignora aprovações por definição. Para bloquear integralmente a execução no host, defina a segurança das aprovações como `deny` ou negue a ferramenta `exec` por meio da política de ferramentas.

## Relacionados

<CardGroup cols={2}>
  <Card title="Aprovações de execução — avançado" href="/pt-BR/tools/exec-approvals-advanced" icon="gear">
    Binários seguros, vinculação de interpretadores e encaminhamento de aprovações para conversas.
  </Card>
  <Card title="Ferramenta de execução" href="/pt-BR/tools/exec" icon="terminal">
    Ferramenta de execução de comandos do shell.
  </Card>
  <Card title="Modo elevado" href="/pt-BR/tools/elevated" icon="shield-exclamation">
    Caminho de emergência que também ignora aprovações.
  </Card>
  <Card title="Isolamento" href="/pt-BR/gateway/sandboxing" icon="box">
    Modos de isolamento e acesso ao espaço de trabalho.
  </Card>
  <Card title="Segurança" href="/pt-BR/gateway/security" icon="lock">
    Modelo de segurança e proteção.
  </Card>
  <Card title="Isolamento versus política de ferramentas versus modo elevado" href="/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Quando usar cada controle.
  </Card>
  <Card title="Skills" href="/pt-BR/tools/skills" icon="sparkles">
    Comportamento de permissão automática baseado em Skills.
  </Card>
</CardGroup>
