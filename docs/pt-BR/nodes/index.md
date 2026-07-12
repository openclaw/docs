---
read_when:
    - Pareamento de nodes iOS/watchOS/Android com um Gateway
    - Usando o canvas/a câmera do Node para o contexto do agente
    - Adicionando novos comandos de Node ou auxiliares de CLI
summary: 'Nodes: emparelhamento, recursos, permissões e auxiliares da CLI para canvas/câmera/tela/dispositivo/notificações/sistema'
title: Nodes
x-i18n:
    generated_at: "2026-07-12T21:32:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c3a13a2b879bef2356a7b28fe207842d64061ba5333f14a1435cc65ae6da85f1
    source_path: nodes/index.md
    workflow: 16
---

Um **node** é um dispositivo complementar (macOS/iOS/watchOS/Android/headless) que se conecta ao Gateway com `role: "node"` e expõe uma superfície de comandos (por exemplo, `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) por meio de `node.invoke`. A maioria dos nodes usa o WebSocket do Gateway na porta do operador. O node direto opcional do Apple Watch usa sondagem HTTPS assinada nessa mesma porta porque o watchOS bloqueia redes genéricas de baixo nível para aplicativos comuns. Detalhes do protocolo: [Protocolo do Gateway](/pt-BR/gateway/protocol).

Transporte legado: [Protocolo Bridge](/pt-BR/gateway/bridge-protocol) (TCP JSONL; apenas histórico para os nodes atuais).

O macOS também pode ser executado no **modo node**: o aplicativo da barra de menus se conecta ao servidor
WS do Gateway como um node (portanto, `openclaw nodes …` funciona com esse Mac). O aplicativo
adiciona comandos nativos de Canvas, câmera, tela, notificações e controle do computador
à mesma superfície de comandos do host de node usada por `openclaw node run`. Não inicie um
segundo node da CLI nesse Mac; o aplicativo executa o runtime correspondente do host de node da CLI como
um worker interno e permanece como a única conexão com o Gateway e a única identidade de node.

Nodes são **periféricos**, não gateways: eles não executam o serviço de gateway, e as mensagens dos canais (Telegram, WhatsApp etc.) chegam ao gateway, não aos nodes.

Guia de solução de problemas: [/nodes/troubleshooting](/pt-BR/nodes/troubleshooting)

## Pareamento + status

Os nodes usam **pareamento de dispositivo**. Um node apresenta uma identidade de dispositivo assinada durante a conexão; o Gateway cria uma solicitação de pareamento de dispositivo para `role: node`. Aprove pela CLI de dispositivos (ou pela interface). A configuração direta do Apple Watch usa um código de configuração de curta duração, exclusivo para node e emitido por um administrador, para aprovar sua superfície fixa de comandos de baixo risco; expansões posteriores de recursos ainda exigem aprovação normal.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

As solicitações de pareamento pendentes expiram 5 minutos após a última tentativa do dispositivo — um dispositivo que continua se reconectando mantém ativa sua única solicitação pendente (e o `requestId`), em vez de gerar uma nova solicitação a cada poucos minutos; consulte [Pareamento de node](/pt-BR/gateway/pairing) para ver o ciclo completo de solicitação/aprovação. Se um node tentar novamente com detalhes de autenticação alterados (função/escopos/chave pública), a solicitação pendente anterior será substituída e um novo `requestId` será criado — os clientes recebem um evento `device.pair.resolved` para a solicitação substituída, e você deve executar novamente `openclaw devices list` antes de aprovar.

- `nodes status` marca um node como **pareado** quando sua função de pareamento de dispositivo inclui `node`.
- Um Mac nativo conectado com permissão de Acessibilidade pode relatar atividade
  agregada de entrada física. O Gateway marca o Mac qualificado com atividade mais recente como
  `active`, fornece ao agente uma indicação estável do ID do node e encaminha para ele os alertas de conexão
  de nodes antes de recorrer a uma alternativa após um atraso. Consulte
  [Presença ativa do computador](/pt-BR/nodes/presence) para configuração, privacidade, temporização e
  solução de problemas.
- O registro de pareamento do dispositivo é o contrato durável das funções aprovadas. A rotação de tokens permanece dentro desse contrato; ela não pode promover um node pareado a uma função que a aprovação de pareamento nunca concedeu.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) é um armazenamento separado de pareamento de nodes, pertencente ao gateway, que acompanha a superfície aprovada de comandos/recursos do node entre reconexões. Ele **não** controla a autenticação do transporte — o pareamento de dispositivo faz isso.
- `openclaw nodes remove --node <id|name|ip>` remove um pareamento de node. Para um node vinculado a um dispositivo, ele revoga a função `node` do dispositivo no armazenamento de dispositivos pareados e desconecta as sessões desse dispositivo com função de node: um dispositivo com múltiplas funções mantém sua linha e perde apenas a função `node`, enquanto a linha de um dispositivo exclusivo para node é excluída. Ele também remove qualquer entrada correspondente do armazenamento separado de pareamento de nodes. `operator.pairing` pode remover linhas de nodes que não sejam de operador em outros dispositivos; um chamador com token de dispositivo que revoga sua própria função de node em um dispositivo com múltiplas funções também precisa de `operator.admin`.
- O escopo da aprovação segue os comandos declarados pela solicitação pendente:
  - solicitação sem comandos: `operator.pairing`
  - comandos de node que não sejam de execução: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Divergência de versões e ordem de atualização

O WebSocket do Gateway aceita clientes node autenticados dentro de uma janela de protocolo N-1.
Portanto, o Gateway v4 atual aceita nodes v3 quando a conexão declara
tanto `role: "node"` quanto `client.mode: "node"`. As sessões de operador e da interface
ainda devem usar o protocolo atual.

Para atualizações graduais da frota, atualize primeiro o Gateway e depois cada node.
Um node N-1 permanece visível e gerenciável enquanto é atualizado; o Gateway
registra `legacy node protocol accepted` com uma recomendação de atualização. Pareamento,
autenticação do dispositivo, listas de comandos permitidos e aprovações de execução continuam válidos.
Os recursos e comandos pertencentes a Plugins permanecem ocultos até que o node seja atualizado para
o protocolo atual. Nodes anteriores a N-1 exigem uma atualização fora de banda antes de
se reconectarem.

O transporte HTTPS direto do watchOS exige a versão atual do protocolo; atualize
o aplicativo do relógio junto com o Gateway antes de ativar o modo direto.

## Host de node remoto (system.run)

Use um **host de node** quando seu Gateway for executado em uma máquina e você quiser que os comandos sejam executados em outra. O modelo ainda se comunica com o **gateway**; o gateway encaminha chamadas de `exec` para o **host de node** quando `host=node` está selecionado.

| Função          | Responsabilidade                                                        |
| --------------- | ----------------------------------------------------------------------- |
| Host do Gateway | Recebe mensagens, executa o modelo e encaminha chamadas de ferramentas. |
| Host de node    | Executa `system.run`/`system.which` na máquina do node.                  |
| Aprovações      | Aplicadas no host de node por meio de `~/.openclaw/exec-approvals.json`. |

Observação sobre aprovações:

- As execuções de node respaldadas por aprovação vinculam o contexto exato da solicitação. O caminho de execução prepara um `systemRunPlan` canônico antes da aprovação; depois de concedida, o gateway encaminha esse plano armazenado, e não campos de comando/cwd/sessão editados posteriormente pelo chamador, e revalida o diretório de trabalho antes da execução.
- Para execuções diretas de arquivos de shell/runtime, o OpenClaw também tenta vincular um operando concreto de arquivo local e recusa a execução se esse arquivo mudar antes da execução.
- Se o OpenClaw não conseguir identificar exatamente um arquivo local concreto para um comando de interpretador/runtime, a execução respaldada por aprovação será recusada, em vez de simular cobertura completa do runtime. Use isolamento, hosts separados ou uma lista explícita de permissões confiáveis/um fluxo de trabalho completo para uma semântica mais ampla do interpretador.

### Iniciar um host de node (primeiro plano)

Na máquina do node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` também aceita `--context-path` (caminho de contexto do WS do Gateway), `--tls`, `--tls-fingerprint <sha256>` e `--node-id` (substitui o ID legado da instância do cliente; isso não redefine o pareamento).

### Gateway remoto por túnel SSH (vinculação ao loopback)

Se o Gateway estiver vinculado ao loopback (`gateway.bind=loopback`, padrão no modo local), hosts de node remotos não poderão se conectar diretamente. Crie um túnel SSH e aponte o host de node para a extremidade local do túnel.

Exemplo (host de node -> host do gateway):

```bash
# Terminal A (mantenha em execução): encaminhe a porta local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: exporte o token do gateway e conecte-se pelo túnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Observações:

- `openclaw node run` aceita autenticação por token ou senha.
- Variáveis de ambiente são preferenciais: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- A configuração alternativa é `gateway.auth.token` / `gateway.auth.password`.
- No modo local, o host de node ignora intencionalmente `gateway.remote.token` / `gateway.remote.password`.
- No modo remoto, `gateway.remote.token` / `gateway.remote.password` podem ser usados conforme as regras de precedência remota.
- Se SecretRefs locais ativos de `gateway.auth.*` estiverem configurados, mas não resolvidos, a autenticação do host de node falhará de forma segura.
- A resolução da autenticação do host de node considera apenas variáveis de ambiente `OPENCLAW_GATEWAY_*`.

### Iniciar um host de node (serviço)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` também aceita `--context-path`, `--tls`, `--tls-fingerprint`, `--node-id` (apenas o ID legado da instância do cliente), `--runtime <node|bun>` (padrão: node) e `--force` para reinstalar. `node status`, `node stop` e `node uninstall` também estão disponíveis.

### Parear + nomear

No host do gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Se o node tentar novamente com detalhes de autenticação alterados, execute novamente `openclaw devices list` e aprove o `requestId` atual.

Opções de nomeação:

- `--display-name` em `openclaw node run` / `openclaw node install` (persiste em `~/.openclaw/node.json` no node, junto com o ID da instância do cliente e os metadados da conexão com o Gateway).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (substituição no gateway).

### Servidores MCP hospedados em nodes

Configure os servidores MCP em `openclaw.json` na máquina do node, não no
Gateway:

```json5
{
  nodeHost: {
    mcp: {
      servers: {
        localDocs: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/srv/docs"],
          toolFilter: {
            include: ["read_*", "search"],
          },
        },
        internalApi: {
          url: "https://mcp.internal.example/mcp",
          transport: "streamable-http",
          headers: {
            Authorization: "Bearer ${INTERNAL_MCP_TOKEN}",
          },
        },
      },
    },
  },
}
```

O host de node headless inicia esses servidores, lista suas ferramentas e publica
os descritores depois de se conectar. As chamadas de ferramentas retornam a esse node por meio de
`mcp.tools.call.v1`; o Gateway não precisa de uma configuração MCP correspondente nem de um
Plugin JS. Servidores MCP com OAuth não são compatíveis com esse caminho v1 hospedado em node.

Os hosts de node atuais declaram a família de comandos integrada `mcp.tools.call.v1` durante
o pareamento inicial, mesmo quando nenhum servidor MCP está configurado. Um node pareado em uma
versão mais antiga do OpenClaw pode solicitar uma atualização única da superfície de comandos depois que o
host de node for atualizado. Adicionar, remover ou filtrar servidores depois disso não
exige novo pareamento, pois a família de comandos aprovada permanece a mesma. Reinicie
`openclaw node run` ou `openclaw node restart` para aplicar alterações à configuração MCP do node;
o host de node não monitora essa configuração.

Os operadores do Gateway podem ignorar todas as ferramentas visíveis para agentes publicadas por nodes pareados,
incluindo ferramentas MCP hospedadas em nodes, com
`gateway.nodes.pluginTools.enabled: false`. Bloqueios exatos de comandos, como
`gateway.nodes.denyCommands: ["mcp.tools.call.v1"]`, também impedem a execução.

### Skills hospedadas em nodes

Instale Skills no diretório ativo de Skills do OpenClaw na máquina do node,
`~/.openclaw/skills` por padrão. `OPENCLAW_HOME`, `OPENCLAW_STATE_DIR` e
`OPENCLAW_CONFIG_PATH` movem esse perfil ativo. `OPENCLAW_STATE_DIR` tem
precedência para Skills; caso contrário, `skills/` fica ao lado do caminho exibido por
`openclaw config file`. O host de node headless publica arquivos `SKILL.md` válidos
depois de se conectar, e o Gateway os adiciona aos snapshots de Skills do agente apenas enquanto
esse node permanecer conectado. O nome de cada diretório de Skill deve corresponder ao campo `name`
do frontmatter para que o localizador abstrato de node seja mapeado para uma única entrada sem adicionar
outro campo ao protocolo.

O pareamento inicial da função de node aprova a publicação de Skills. Adicionar, remover ou
alterar Skills não exige outro pareamento nem alteração na configuração do Gateway.
Reinicie `openclaw node run` ou `openclaw node restart` depois de alterar os
arquivos de Skills do node; o host de node não monitora o diretório de Skills.

As entradas de skill hospedadas no Node identificam seu Node e incluem seu local
de execução. Os arquivos da skill, os caminhos relativos referenciados e os
binários permanecem nesse Node. O agente lê o local anunciado
`node://.../SKILL.md` com a ferramenta `read` normal. `file_fetch` aceita caminhos
absolutos do Node aprovados pelo operador, não localizadores de skills do Node;
runtimes sem a ferramenta de leitura normal podem executar `cat SKILL.md` por
meio de `exec host=node node=<node-id>`, usando o diretório
`node://.../skills/<name>` anunciado como `workdir`. Os arquivos e binários
referenciados usam o mesmo destino de exec e workdir. O host do Node resolve esse
localizador em relação ao diretório de estado ativo do OpenClaw, portanto os
caminhos relativos são resolvidos no Node, e não na máquina do Gateway. O Node
publicador deve ter `system.run` aprovado, e a política de exec do agente deve
permitir `host=node`; caso contrário, a skill fica fora do snapshot desse agente.

Defina `nodeHost.skills.enabled: false` no Node para interromper a publicação. Os
operadores do Gateway podem ignorar skills de todos os Nodes emparelhados com
`gateway.nodes.skills.enabled: false`.

### Estado da identidade headless

O Node headless mantém três arquivos de estado separados:

- `~/.openclaw/node.json`: o ID legado da instância do cliente (armazenado como `nodeId`), o nome de exibição e os metadados de conexão do Gateway.
- `~/.openclaw/identity/device.json`: o par de chaves assinado do dispositivo e o ID criptográfico derivado do dispositivo.
- `~/.openclaw/identity/device-auth.json`: tokens de autenticação de dispositivos emparelhados, indexados pelo ID criptográfico do dispositivo e pela função.

Para um Node assinado, o Gateway usa o ID criptográfico do dispositivo para o
emparelhamento e o roteamento do Node. O ID da instância do cliente é apenas um
metadado de conexão. Portanto, alterar `--node-id` ou excluir apenas `node.json`
não redefine o emparelhamento. Consulte
[Estado de identidade e emparelhamento](/pt-BR/cli/node#identity-and-pairing-state)
para ver o fluxo compatível de revogação e novo emparelhamento, além das
observações sobre atualização.

### Adicione os comandos à lista de permissões

As aprovações de exec são **específicas de cada host do Node**. Adicione entradas
à lista de permissões pelo Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

As aprovações ficam no host do Node em `~/.openclaw/exec-approvals.json`.

### Direcione o exec para o Node

Configure os padrões (configuração do Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Ou por sessão:

```text
/exec host=node security=allowlist node=<id-or-name>
```

Após a configuração, qualquer chamada de `exec` com `host=node` é executada no host Node (sujeita à lista de permissões/aprovações do Node).

`host=auto` não escolherá implicitamente o Node por conta própria, mas uma solicitação explícita de `host=node` por chamada é permitida a partir de `auto`. Se quiser que a execução no Node seja o padrão da sessão, defina explicitamente `tools.exec.host=node` ou `/exec host=node ...`.

Relacionado:

- [CLI do host Node](/pt-BR/cli/node)
- [Ferramenta Exec](/pt-BR/tools/exec)
- [Aprovações de Exec](/pt-BR/tools/exec-approvals)

### Inferência de modelo local

Um Node de desktop ou servidor pode disponibilizar modelos compatíveis com chat de um servidor Ollama em execução nesse Node. Os agentes usam a ferramenta `node_inference` do Plugin Ollama para descobrir os modelos instalados e executar remotamente um prompt limitado; o Gateway não precisa de acesso direto ao Ollama pela rede. Consulte [Inferência local no Node com Ollama](/pt-BR/providers/ollama#node-local-inference) para ver a configuração, a filtragem de modelos e os comandos de verificação direta.

### Sessões e transcrições do Codex

O plugin oficial `codex` pode expor sessões não arquivadas do Codex em um host Node sem interface gráfica ou em um Node macOS nativo. O registro no catálogo não depende mais de `supervision.enabled`; essa opção controla as ferramentas de supervisão voltadas ao agente. O plugin ainda deve estar ativo nos dois computadores, e a configuração do Node continua sendo um consentimento local: habilitar apenas o Gateway não permite ler o estado do Codex de outro computador.

O Node anuncia os comandos versionados somente leitura
`codex.appServer.threads.list.v1` e
`codex.appServer.thread.turns.list.v1`. Aprove a atualização do pareamento do Node
quando esses comandos aparecerem pela primeira vez. O Gateway os invoca por meio da
política normal de Node do plugin e isola as falhas por host.

As linhas de Nodes pareados aparecem como um grupo **Codex** na barra lateral normal de sessões.
Selecionar uma linha abre o painel normal de Chat e lê a transcrição persistida
por meio de chamadas limitadas e paginadas por cursor a
`thread/turns/list`, com projeção completa dos itens. O transporte de invocação do Node funciona apenas por solicitação/resposta e não pode
transportar os turnos em streaming, eventos em tempo real ou aprovações necessários para continuar uma
thread nativa pelo harness do Codex. Portanto, **Continuar** e **Arquivar** ficam
indisponíveis para linhas remotas. No computador do Gateway, linhas armazenadas e ociosas
podem iniciar uma ramificação distinta do Chat bloqueada ao modelo. Qualquer uma delas só pode ser arquivada
depois que o operador confirmar que nenhum outro cliente Codex a está usando; a atividade em tempo real
de uma linha armazenada permanece desconhecida. Linhas ativas não podem criar ramificações nem ser arquivadas.

Consulte [Supervisionar sessões do Codex](/pt-BR/plugins/codex-supervision) para ver a configuração,
paginação, continuação local e o limite de segurança dos metadados.

### Sessões e transcrições do Claude

O plugin `anthropic` incluído descobre sessões não arquivadas do Claude CLI e do Claude
Desktop no Gateway e nos Nodes pareados. Diferentemente da supervisão do Codex,
isso não exige uma habilitação separada: um Node remoto do aplicativo macOS anuncia
`anthropic.claude.sessions.list.v1` e `anthropic.claude.sessions.read.v1`
quando o plugin Anthropic está habilitado e `~/.claude/projects/` existe. Aprove
a atualização do pareamento do Node quando esses comandos aparecerem pela primeira vez.

O catálogo combina registros válidos do índice de projetos do Claude CLI com um prefixo limitado
de metadados dos arquivos JSONL `sdk-cli` atuais. Os metadados locais do Claude Desktop
fornecem os títulos e o estado de arquivamento do Desktop. Os metadados do Desktop prevalecem quando
ambas as fontes se referem ao mesmo ID de sessão do Claude Code; transcrições exclusivas da CLI
continuam visíveis porque a CLI não tem um sinalizador de arquivamento. As leituras de transcrições usam cursores opacos
de deslocamento em bytes e leituras retroativas limitadas do arquivo; assim, selecionar uma sessão grande
ou carregar uma página mais antiga não lê todo o histórico JSONL em uma única
resposta do Gateway.

Os dois comandos do Node são somente leitura. Eles expõem os metadados do catálogo e o conteúdo das transcrições
apenas por meio dos métodos genéricos `sessions.catalog.list` e
`sessions.catalog.read` para uma conexão autenticada de operador com
`operator.write`. As linhas de Nodes pareados permanecem somente para visualização. Uma linha do Claude CLI
local ao Gateway pode ser adotada pelo compositor normal do Chat: o OpenClaw importa um histórico visível
limitado, retoma com `--fork-session` no primeiro turno e mantém a
transcrição de origem intacta. As linhas do Claude Desktop permanecem somente para visualização.

Consulte [Anthropic: sessões do Claude entre computadores](/pt-BR/providers/anthropic#claude-sessions-across-computers)
para conhecer o comportamento da Control UI e as fontes de armazenamento.

## Invocação de comandos

Baixo nível (RPC bruto):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` bloqueia `system.run` e `system.run.prepare`; esses comandos são executados apenas por meio da ferramenta `exec` com `host=node` (veja acima). Existem auxiliares de nível mais alto para os fluxos de trabalho comuns de "fornecer ao agente um anexo MEDIA" (canvas, câmera, tela, localização, abaixo).

## Política de comandos

Os comandos do Node devem passar por duas verificações antes de poderem ser invocados:

1. O Node deve declarar o comando nos metadados autenticados de conexão (`connect.commands`).
2. A lista de permissões do Gateway derivada da plataforma e da aprovação deve incluir o comando declarado.

Listas de permissões padrão por plataforma (antes dos padrões do plugin e das substituições de `allowCommands`/`denyCommands`):

| Plataforma | Comandos permitidos por padrão                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify` (comandos do host do Node, como `system.run`, exigem aprovação; veja abaixo)                                                                                                                                                                                                                                  |

Essas linhas descrevem o limite máximo da política do Gateway, não os comandos implementados por todos os aplicativos de Node. Um comando só pode ser usado quando o Node conectado também o declara. Em particular, o aplicativo macOS atual não declara as famílias de dados pessoais e do dispositivo listadas na linha da política do macOS.

Os comandos `canvas.*` (`canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`) são um padrão do plugin no iOS, Android, macOS, Windows e em plataformas desconhecidas (mas não no Linux); todos eles são restritos ao primeiro plano no iOS.

`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` e `talk.ptt.once` são permitidos por padrão para qualquer Node que anuncie o recurso `talk` ou declare comandos `talk.*`, independentemente do rótulo da plataforma.

Os comandos de host para desktop (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `mcp.tools.call.v1` e `screen.snapshot` no macOS/Windows) não fazem parte da tabela estática de padrões da plataforma acima. Eles se tornam disponíveis quando o operador aprova uma solicitação de pareamento que os declara, após o que o conjunto de comandos aprovados do Node os mantém nas reconexões.

Comandos perigosos ou com grande impacto sobre a privacidade ainda exigem habilitação explícita com `gateway.nodes.allowCommands`, mesmo que um Node os declare: `camera.snap`, `camera.clip`, `screen.record`, `computer.act`, `contacts.add`, `calendar.add`, `reminders.add`, `sms.send`, `sms.search`. `gateway.nodes.denyCommands` sempre prevalece sobre os padrões e as entradas adicionais da lista de permissões. Consulte [Uso do computador](/pt-BR/nodes/computer-use) para conhecer as verificações adicionais de macOS, política de ferramentas e ativação relacionadas à entrada no desktop.

Os comandos de Node pertencentes a Plugins podem adicionar uma política de invocação de Node do Gateway. Essa política é executada após a verificação da lista de permissões e antes do encaminhamento ao Node, portanto, `node.invoke` bruto, auxiliares da CLI e ferramentas dedicadas do agente compartilham o mesmo limite de permissões do Plugin. Comandos perigosos de Node do Plugin ainda exigem adesão explícita em `gateway.nodes.allowCommands`.

Depois que um Node alterar sua lista de comandos declarada, rejeite o pareamento antigo do dispositivo e aprove a nova solicitação para que o Gateway armazene o snapshot atualizado dos comandos.

## Configuração (`openclaw.json`)

As configurações relacionadas a Nodes ficam em `gateway.nodes` e `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Aprova automaticamente o primeiro pareamento de um Node em redes confiáveis (lista CIDR).
      // Desativado quando não definido. Aplica-se apenas às primeiras solicitações role:node
      // sem escopos solicitados; não aprova atualizações automaticamente.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // Aprovação automática verificada por SSH (padrão: ativada). Aprova o primeiro
        // pareamento do Node quando há correspondência exata da chave do dispositivo lida novamente via SSH.
        sshVerify: true,
      },
      // Confia nas ferramentas de Plugin visíveis ao agente publicadas por Nodes pareados (padrão: true).
      pluginTools: {
        enabled: true,
      },
      // Adere a comandos de Node perigosos ou com grande impacto na privacidade (camera.snap etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Bloqueia nomes exatos de comandos, mesmo que os padrões ou allowCommands os incluam.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Host padrão de execução: "node" encaminha todas as chamadas de execução para um Node pareado.
      host: "node",
      // Modo de segurança para execução no Node: permite apenas comandos aprovados ou na lista de permissões.
      security: "allowlist",
      // Fixa a execução em um Node específico (ID ou nome). Omita para permitir qualquer Node.
      node: "build-node",
    },
  },
}
```

Use os nomes exatos dos comandos de Node. `denyCommands` remove um comando mesmo quando um padrão da plataforma ou uma entrada de `allowCommands` o permitiria. Por padrão, Nodes pareados podem publicar descritores de ferramentas de Plugin visíveis ao agente, mas o comando de cada descritor ainda precisa fazer parte da superfície de comandos aprovada do Node. Defina `gateway.nodes.pluginTools.enabled: false` para ignorar todos esses descritores. Consulte a [referência de configuração do Gateway](/pt-BR/gateway/configuration-reference#gateway) para obter detalhes sobre os campos de pareamento de Nodes e política de comandos do Gateway.

Substituição do Node de execução por agente:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## Capturas de tela (snapshots do Canvas)

Se o Node estiver exibindo o Canvas (WebView), `canvas.snapshot` retornará `{ format, base64 }`.

Auxiliar da CLI (grava em um arquivo temporário e exibe o caminho salvo):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Controles do Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Observações:

- `canvas present` aceita URLs ou caminhos de arquivos locais (`--target`), além de `--x/--y/--width/--height` opcionais para posicionamento.
- `canvas eval` aceita JS embutido (`--js`) ou um argumento posicional.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Observações:

- Nodes móveis usam uma página A2UI incluída e pertencente ao aplicativo para renderização com suporte a ações.
- Apenas JSONL do A2UI v0.8 é compatível (v0.9/createSurface é rejeitado).
- iOS e Android renderizam páginas remotas do Canvas do Gateway, mas as ações de botões do A2UI são despachadas somente pela página A2UI incluída e pertencente ao aplicativo. As páginas A2UI HTTP/HTTPS hospedadas pelo Gateway são somente para renderização nesses clientes móveis.
- O macOS pode despachar ações pela página A2UI exata do Gateway, com escopo de capacidade, selecionada pelo aplicativo. Outras páginas HTTP/HTTPS permanecem somente para renderização.

## Fotos e vídeos (câmera do Node)

Fotos (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # padrão: ambas as câmeras (2 linhas MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

Clipes de vídeo (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Observações:

- O Node precisa estar **em primeiro plano** para `canvas.*` e `camera.*` (chamadas em segundo plano retornam `NODE_BACKGROUND_UNAVAILABLE`).
- Os Nodes limitam a duração do clipe para manter a carga útil base64 gerenciável (consulte [Captura da câmera](/pt-BR/nodes/camera) para ver os limites exatos por plataforma). A ferramenta de agente `nodes` também limita o `durationMs` solicitado a 300000 (5 minutos) antes de encaminhar a chamada; o próprio Node aplica o limite mais restritivo.
- O Android solicitará as permissões `CAMERA`/`RECORD_AUDIO` quando possível; permissões negadas causam falha com `*_PERMISSION_REQUIRED`.

## Gravações de tela (Nodes)

Os Nodes compatíveis expõem `screen.record` (mp4). Exemplo:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Observações:

- A disponibilidade de `screen.record` depende da plataforma do Node.
- A ferramenta de agente `nodes` limita o `durationMs` solicitado a 300000 (5 minutos); o Node pode aplicar um limite mais restritivo para limitar a carga útil retornada.
- `--no-audio` desativa a captura do microfone nas plataformas compatíveis.
- Use `--screen <index>` para selecionar uma tela quando houver várias disponíveis (0 = principal).

## Localização (Nodes)

Os Nodes expõem `location.get` quando a Localização está ativada nas configurações.

Auxiliar da CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Observações:

- A Localização fica **desativada por padrão**.
- "Always" exige permissão do sistema; a obtenção em segundo plano é feita em caráter de melhor esforço.
- A resposta inclui latitude/longitude, precisão (metros) e timestamp.
- Formato completo dos parâmetros/da resposta e códigos de erro: [Comando de localização](/pt-BR/nodes/location-command).

## SMS (Nodes Android)

Os Nodes Android podem expor `sms.send` e `sms.search` quando o usuário concede a permissão **SMS** e o dispositivo oferece suporte a telefonia. Ambos os comandos são perigosos por padrão: o operador do Gateway também precisa adicioná-los a `gateway.nodes.allowCommands` antes que possam ser invocados (consulte [Política de comandos](#command-policy)).

Para pesquisa de SMS somente leitura, faça a adesão explicitamente em `openclaw.json`:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["sms.search"],
    },
  },
}
```

Adicione `sms.send` separadamente somente quando o Node também precisar enviar mensagens. A permissão do Android e a autorização de comandos do Gateway são independentes; conceder a permissão no telefone não altera a política do Gateway.

Invocação de baixo nível:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Observações:

- `sms.search` pode ser declarado antes da concessão de `READ_SMS`, para que uma invocação possa retornar um diagnóstico de permissão; a leitura das mensagens ainda exige essa permissão do Android.
- Dispositivos somente com Wi-Fi e sem telefonia não anunciarão `sms.send`.
- Um erro `requires explicit gateway.nodes.allowCommands opt-in` significa que o telefone declarou o comando, mas o operador do Gateway não o autorizou.

## Comandos de dados pessoais e do dispositivo

Por padrão, os Nodes iOS e Android anunciam vários comandos de dados somente leitura (consulte a tabela de [Política de comandos](#command-policy)); o Android também expõe uma família maior, controlada por suas próprias configurações no aplicativo.

Famílias disponíveis:

- `device.status`, `device.info` — iOS, Android, Windows.
- `device.permissions`, `device.health`, `device.apps` — somente Android; `device.apps` exige que o compartilhamento de Aplicativos Instalados esteja ativado nas Configurações do Android e retorna, por padrão, os aplicativos visíveis no inicializador.
- `notifications.list`, `notifications.actions` — somente Android.
- `photos.latest` — iOS, Android.
- `contacts.search` — iOS, Android (somente leitura por padrão); `contacts.add` é perigoso e exige `gateway.nodes.allowCommands`.
- `calendar.events` — iOS, Android (somente leitura por padrão); `calendar.add` é perigoso e exige `gateway.nodes.allowCommands`.
- `reminders.list` — iOS, Android (somente leitura por padrão); `reminders.add` é perigoso e exige `gateway.nodes.allowCommands`.
- `callLog.search` — somente Android.
- `motion.activity`, `motion.pedometer` — iOS, Android; sujeitos às capacidades dos sensores disponíveis.

Exemplos de invocação:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## Comandos do sistema (host do Node / Node Mac)

O Node macOS expõe `system.run`, `system.which`, `system.notify` e `system.execApprovals.get/set`. O host de Node sem interface gráfica expõe `system.run.prepare`, `system.run`, `system.which` e `system.execApprovals.get/set`.

Exemplos:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

Observações:

- `system.run` retorna stdout/stderr/código de saída no payload.
- A execução no shell agora ocorre por meio da ferramenta `exec` com `host=node`; `nodes` continua sendo a superfície de RPC direto para comandos explícitos do Node.
- `nodes invoke` não expõe `system.run` nem `system.run.prepare`; eles permanecem disponíveis somente pelo caminho de exec.
- O caminho de exec prepara um `systemRunPlan` canônico antes da aprovação. Após a concessão de uma aprovação, o Gateway encaminha esse plano armazenado, e não quaisquer campos de comando/cwd/sessão editados posteriormente pelo chamador.
- `system.notify` respeita o estado da permissão de notificações no aplicativo para macOS; oferece suporte a `--priority <passive|active|timeSensitive>` e `--delivery <system|overlay|auto>`.
- Metadados `platform` / `deviceFamily` não reconhecidos do Node usam uma lista de permissões padrão conservadora que exclui `system.run` e `system.which`. Se você precisar intencionalmente desses comandos para uma plataforma desconhecida, adicione-os explicitamente por meio de `gateway.nodes.allowCommands`.
- `system.run` oferece suporte a `--cwd`, `--env KEY=VAL`, `--command-timeout` e `--needs-screen-recording`.
- Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), os valores de `--env` com escopo da solicitação são reduzidos a uma lista de permissões explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisões de permitir sempre no modo de lista de permissões, wrappers de despacho conhecidos (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem os caminhos dos executáveis internos em vez dos caminhos dos wrappers. Se não for seguro remover o wrapper, nenhuma entrada será persistida automaticamente na lista de permissões.
- Em hosts Node no Windows no modo de lista de permissões, execuções de wrapper de shell por meio de `cmd.exe /c` exigem aprovação (uma entrada na lista de permissões, por si só, não permite automaticamente a forma com wrapper).
- Os hosts Node ignoram substituições de `PATH` em `--env` e removem um conjunto amplo e mantido de variáveis de inicialização de interpretadores/shells (por exemplo, `NODE_OPTIONS`, `PYTHONPATH`, `BASH_ENV`, `DYLD_*`, `LD_*`) antes de executar um comando. Se você precisar de entradas adicionais no PATH, configure o ambiente do serviço do host Node (ou instale as ferramentas em locais padrão) em vez de passar `PATH` por meio de `--env`.
- No modo Node do macOS, `system.run` é controlado pelas aprovações de exec no aplicativo para macOS (Settings → Exec approvals). Os modos de solicitar/lista de permissões/completo se comportam da mesma forma que no host Node sem interface; solicitações negadas retornam `SYSTEM_RUN_DENIED`.
- No host Node sem interface, `system.run` é controlado pelas aprovações de exec (`~/.openclaw/exec-approvals.json`); especificamente no macOS, consulte abaixo as variáveis de ambiente de roteamento do host de exec em [Host Node sem interface](#headless-node-host-cross-platform).

## Vinculação do Node de exec

Quando vários Nodes estão disponíveis, você pode vincular o exec a um Node específico. Isso define o Node padrão para `exec host=node` (e pode ser substituído por agente).

Padrão global:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Substituição por agente:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Remova a definição para permitir qualquer Node:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Mapa de permissões

Os Nodes podem incluir um mapa `permissions` em `node.list` / `node.describe`, indexado pelo nome da permissão (por exemplo, `screenRecording`, `accessibility`, `location`) e com valores booleanos (`true` = concedida).

## Host Node sem interface (multiplataforma)

O OpenClaw pode executar um **host Node sem interface** (sem UI) que se conecta ao WebSocket do Gateway e expõe `system.run` / `system.which`. Isso é útil no Linux/Windows ou para executar um Node mínimo junto a um servidor.

Inicie-o:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Observações:

- O pareamento ainda é obrigatório (o Gateway exibirá uma solicitação de pareamento de dispositivo).
- Os metadados da instância do cliente, a identidade assinada do dispositivo e a autenticação de pareamento usam arquivos separados; consulte [Estado da identidade sem interface](#headless-identity-state).
- As aprovações de exec são aplicadas localmente por meio de `~/.openclaw/exec-approvals.json` (consulte [Aprovações de exec](/pt-BR/tools/exec-approvals)).
- No macOS, o host Node sem interface executa `system.run` localmente por padrão. Defina `OPENCLAW_NODE_EXEC_HOST=app` para rotear `system.run` pelo host de exec do aplicativo complementar; adicione `OPENCLAW_NODE_EXEC_FALLBACK=0` para exigir o host do aplicativo e falhar de forma fechada caso ele não esteja disponível.
- Adicione `--tls` / `--tls-fingerprint` quando o WS do Gateway usar TLS.

## Modo Node no Mac

- O aplicativo da barra de menus do macOS se conecta ao servidor WS do Gateway como um Node (portanto, `openclaw nodes …` funciona com este Mac).
- No modo remoto, o aplicativo abre um túnel SSH para a porta do Gateway e se conecta a `localhost`.
