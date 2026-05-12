---
read_when:
    - Executando o Gateway pela CLI (desenvolvimento ou servidores)
    - Depuração da autenticação do Gateway, modos de bind e conectividade
    - Descobrindo Gateways via Bonjour (DNS-SD local + de área ampla)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — execute, consulte e descubra gateways
title: Gateway
x-i18n:
    generated_at: "2026-05-12T12:50:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b19babe545895b8a5fc4b49bef5a0f9103091795f3e3c9bbcdf9ba9d7784538
    source_path: cli/gateway.md
    workflow: 16
---

O Gateway é o servidor WebSocket do OpenClaw (canais, nós, sessões, hooks). Os subcomandos nesta página ficam em `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Descoberta Bonjour" href="/pt-BR/gateway/bonjour">
    Configuração de mDNS local + DNS-SD de área ampla.
  </Card>
  <Card title="Visão geral da descoberta" href="/pt-BR/gateway/discovery">
    Como o OpenClaw anuncia e encontra gateways.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration">
    Chaves de configuração de Gateway de nível superior.
  </Card>
</CardGroup>

## Executar o Gateway

Execute um processo Gateway local:

```bash
openclaw gateway
```

Alias em primeiro plano:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Comportamento de inicialização">
    - Por padrão, o Gateway se recusa a iniciar a menos que `gateway.mode=local` esteja definido em `~/.openclaw/openclaw.json`. Use `--allow-unconfigured` para execuções ad-hoc/dev.
    - Espera-se que `openclaw onboard --mode local` e `openclaw setup` gravem `gateway.mode=local`. Se o arquivo existir, mas `gateway.mode` estiver ausente, trate isso como uma configuração quebrada ou sobrescrita e repare-a, em vez de assumir implicitamente o modo local.
    - Se o arquivo existir e `gateway.mode` estiver ausente, o Gateway trata isso como dano suspeito à configuração e se recusa a "adivinhar local" para você.
    - Vincular além de loopback sem autenticação é bloqueado (proteção de segurança).
    - `SIGUSR1` aciona uma reinicialização dentro do processo quando autorizada (`commands.restart` é habilitado por padrão; defina `commands.restart: false` para bloquear a reinicialização manual, enquanto aplicação/atualização da ferramenta/configuração do Gateway permanecem permitidas).
    - Os manipuladores de `SIGINT`/`SIGTERM` interrompem o processo do Gateway, mas não restauram nenhum estado personalizado do terminal. Se você encapsular a CLI com uma TUI ou entrada em modo bruto, restaure o terminal antes de sair.

  </Accordion>
</AccordionGroup>

### Opções

<ParamField path="--port <port>" type="number">
  Porta WebSocket (o padrão vem da configuração/env; geralmente `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Modo de vinculação do listener.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Substituição do modo de autenticação.
</ParamField>
<ParamField path="--token <token>" type="string">
  Substituição do token (também define `OPENCLAW_GATEWAY_TOKEN` para o processo).
</ParamField>
<ParamField path="--password <password>" type="string">
  Substituição da senha.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Lê a senha do Gateway de um arquivo.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Expõe o Gateway via Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Redefine a configuração serve/funnel do Tailscale no desligamento.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Permite iniciar o Gateway sem `gateway.mode=local` na configuração. Ignora a proteção de inicialização apenas para bootstrap ad-hoc/dev; não grava nem repara o arquivo de configuração.
</ParamField>
<ParamField path="--dev" type="boolean">
  Cria uma configuração dev + workspace se estiverem ausentes (ignora BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Redefine configuração dev + credenciais + sessões + workspace (exige `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Encerra qualquer listener existente na porta selecionada antes de iniciar.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Logs detalhados.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Mostra apenas logs do backend da CLI no console (e habilita stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Estilo de log do WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias para `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Registra eventos brutos de stream do modelo em jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Caminho jsonl do stream bruto.
</ParamField>

## Reiniciar o Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` solicita ao Gateway em execução que faça uma pré-verificação do trabalho ativo do OpenClaw antes de reiniciar. Se operações em fila, entrega de respostas, execuções incorporadas ou execuções de tarefas estiverem ativas, o Gateway relata os bloqueadores, consolida solicitações duplicadas de reinicialização segura e reinicia quando o trabalho ativo esvazia. `restart` simples mantém o comportamento existente do gerenciador de serviço para compatibilidade. Use `--force` apenas quando você quiser explicitamente o caminho de substituição imediata.

`openclaw gateway restart --safe --skip-deferral` executa a mesma reinicialização coordenada e ciente do OpenClaw que `--safe`, mas ignora a barreira de adiamento por trabalho ativo, de modo que o Gateway emite a reinicialização imediatamente mesmo quando bloqueadores são relatados. Use-o como saída operacional quando um adiamento ficar preso por uma execução de tarefa travada e `--safe` sozinho aguardaria indefinidamente. `--skip-deferral` exige `--safe`.

<Warning>
`--password` inline pode ser exposto em listagens de processos locais. Prefira `--password-file`, env ou um `gateway.auth.password` apoiado por SecretRef.
</Warning>

### Perfilamento de inicialização

- Defina `OPENCLAW_GATEWAY_STARTUP_TRACE=1` para registrar tempos de fases durante a inicialização do Gateway, incluindo atraso `eventLoopMax` por fase e tempos de tabelas de consulta de plugins para índice instalado, registro de manifesto, planejamento de inicialização e trabalho de mapa de proprietários.
- Defina `OPENCLAW_DIAGNOSTICS=timeline` com `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` para gravar uma linha do tempo de diagnósticos de inicialização em JSONL de melhor esforço para harnesses externos de QA. Você também pode habilitar a flag com `diagnostics.flags: ["timeline"]` na configuração; o caminho ainda é fornecido por env. Adicione `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` para incluir amostras do loop de eventos.
- Execute `pnpm test:startup:gateway -- --runs 5 --warmup 1` para medir o benchmark de inicialização do Gateway. O benchmark registra a primeira saída do processo, `/healthz`, `/readyz`, tempos do trace de inicialização, atraso do loop de eventos e detalhes de tempo das tabelas de consulta de plugins.

## Consultar um Gateway em execução

Todos os comandos de consulta usam RPC por WebSocket.

<Tabs>
  <Tab title="Modos de saída">
    - Padrão: legível por humanos (colorido em TTY).
    - `--json`: JSON legível por máquina (sem estilo/spinner).
    - `--no-color` (ou `NO_COLOR=1`): desabilita ANSI mantendo o layout humano.

  </Tab>
  <Tab title="Opções compartilhadas">
    - `--url <url>`: URL WebSocket do Gateway.
    - `--token <token>`: token do Gateway.
    - `--password <password>`: senha do Gateway.
    - `--timeout <ms>`: tempo limite/orçamento (varia por comando).
    - `--expect-final`: aguarda uma resposta "final" (chamadas de agente).

  </Tab>
</Tabs>

<Note>
Quando você define `--url`, a CLI não recorre a credenciais de configuração ou ambiente. Passe `--token` ou `--password` explicitamente. A ausência de credenciais explícitas é um erro.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

O endpoint HTTP `/healthz` é uma sonda de vivacidade: ele retorna assim que o servidor consegue responder HTTP. O endpoint HTTP `/readyz` é mais rigoroso e permanece vermelho enquanto sidecars de plugins de inicialização, canais ou hooks configurados ainda estão se acomodando. Respostas detalhadas de prontidão locais ou autenticadas incluem um bloco de diagnóstico `eventLoop` com atraso do loop de eventos, utilização do loop de eventos, proporção de núcleos de CPU e uma flag `degraded`.

### `gateway usage-cost`

Busca resumos de custo de uso nos logs de sessão.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Número de dias a incluir.
</ParamField>

### `gateway stability`

Busca o gravador recente de estabilidade diagnóstica de um Gateway em execução.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Número máximo de eventos recentes a incluir (máx. `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filtra por tipo de evento de diagnóstico, como `payload.large` ou `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Inclui apenas eventos após um número de sequência de diagnóstico.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lê um pacote de estabilidade persistido em vez de chamar o Gateway em execução. Use `--bundle latest` (ou apenas `--bundle`) para o pacote mais novo no diretório de estado, ou passe diretamente um caminho JSON de pacote.
</ParamField>
<ParamField path="--export" type="boolean">
  Grava um zip compartilhável de diagnósticos de suporte em vez de imprimir detalhes de estabilidade.
</ParamField>
<ParamField path="--output <path>" type="string">
  Caminho de saída para `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacidade e comportamento do pacote">
    - Os registros mantêm metadados operacionais: nomes de eventos, contagens, tamanhos em bytes, leituras de memória, estado de filas/sessões, nomes de canais/plugins e resumos de sessão redigidos. Eles não mantêm texto de chat, corpos de webhook, saídas de ferramentas, corpos brutos de solicitação ou resposta, tokens, cookies, valores secretos, nomes de host ou ids brutos de sessão. Defina `diagnostics.enabled: false` para desabilitar totalmente o gravador.
    - Em saídas fatais do Gateway, tempos limite de desligamento e falhas de inicialização após reinicialização, o OpenClaw grava o mesmo snapshot de diagnóstico em `~/.openclaw/logs/stability/openclaw-stability-*.json` quando o gravador tem eventos. Inspecione o pacote mais novo com `openclaw gateway stability --bundle latest`; `--limit`, `--type` e `--since-seq` também se aplicam à saída de pacotes.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Grava um zip local de diagnósticos projetado para ser anexado a relatórios de bugs. Para o modelo de privacidade e o conteúdo do pacote, consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Caminho do zip de saída. O padrão é uma exportação de suporte no diretório de estado.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Máximo de linhas de log sanitizadas a incluir.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Máximo de bytes de log a inspecionar.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket do Gateway para o snapshot de saúde.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token do Gateway para o snapshot de saúde.
</ParamField>
<ParamField path="--password <password>" type="string">
  Senha do Gateway para o snapshot de saúde.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Tempo limite do snapshot de status/saúde.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Ignora a busca de pacote de estabilidade persistido.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprime o caminho gravado, o tamanho e o manifesto como JSON.
</ParamField>

A exportação contém um manifesto, um resumo em Markdown, formato da configuração, detalhes sanitizados da configuração, resumos sanitizados de logs, snapshots sanitizados de status/saúde do Gateway e o pacote de estabilidade mais novo quando houver um.

Ela foi feita para ser compartilhada. Mantém detalhes operacionais que ajudam na depuração, como campos seguros de log do OpenClaw, nomes de subsistemas, códigos de status, durações, modos configurados, portas, ids de plugins, ids de provedores, configurações de recursos não secretas e mensagens de log operacionais redigidas. Ela omite ou redige texto de chat, corpos de webhook, saídas de ferramentas, credenciais, cookies, identificadores de conta/mensagem, texto de prompt/instrução, nomes de host e valores secretos. Quando uma mensagem no estilo LogTape parece texto de payload de usuário/chat/ferramenta, a exportação mantém apenas que uma mensagem foi omitida mais sua contagem de bytes.

### `gateway status`

`gateway status` mostra o serviço do Gateway (launchd/systemd/schtasks) mais uma sonda opcional de capacidade de conectividade/autenticação.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Adiciona um destino de sondagem explícito. O remoto configurado + localhost ainda são sondados.
</ParamField>
<ParamField path="--token <token>" type="string">
  Autenticação por token para a sondagem.
</ParamField>
<ParamField path="--password <password>" type="string">
  Autenticação por senha para a sondagem.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Tempo limite da sondagem.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Ignora a sondagem de conectividade (visualização apenas do serviço).
</ParamField>
<ParamField path="--deep" type="boolean">
  Varre também serviços em nível de sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Promove a sondagem de conectividade padrão para uma sondagem de leitura e sai com código diferente de zero quando essa sondagem de leitura falha. Não pode ser combinado com `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semântica de status">
    - `gateway status` permanece disponível para diagnóstico mesmo quando a configuração da CLI local está ausente ou inválida.
    - O `gateway status` padrão comprova o estado do serviço, a conexão WebSocket e a capacidade de autenticação visível no momento do handshake. Ele não comprova operações de leitura/gravação/administração.
    - Sondagens de diagnóstico não fazem mutações para autenticação de dispositivo pela primeira vez: elas reutilizam um token de dispositivo existente em cache quando há um, mas não criam uma nova identidade de dispositivo da CLI nem um registro de pareamento de dispositivo somente leitura apenas para verificar o status.
    - `gateway status` resolve SecretRefs de autenticação configurados para autenticação da sondagem quando possível.
    - Se uma SecretRef de autenticação obrigatória não for resolvida nesse caminho de comando, `gateway status --json` relata `rpc.authWarning` quando a conectividade/autenticação da sondagem falha; passe `--token`/`--password` explicitamente ou resolva primeiro a origem do segredo.
    - Se a sondagem for bem-sucedida, avisos de referência de autenticação não resolvida são suprimidos para evitar falsos positivos.
    - Use `--require-rpc` em scripts e automação quando um serviço em escuta não for suficiente e você também precisar que chamadas RPC de escopo de leitura estejam íntegras.
    - `--deep` adiciona uma varredura de melhor esforço por instalações extras de launchd/systemd/schtasks. Quando vários serviços semelhantes ao Gateway são detectados, a saída humana imprime dicas de limpeza e avisa que a maioria das configurações deve executar um Gateway por máquina.
    - `--deep` também relata uma transferência recente de reinício do supervisor do Gateway quando o processo do serviço saiu corretamente para um reinício por supervisor externo.
    - `--deep` executa a validação de configuração em modo ciente de plugins (`pluginValidation: "full"`) e expõe avisos de manifestos de plugins configurados (por exemplo, metadados ausentes de configuração de canal) para que verificações de fumaça de instalação e atualização os detectem. O `gateway status` padrão mantém o caminho rápido somente leitura que ignora a validação de plugins.
    - A saída humana inclui o caminho resolvido do log em arquivo mais o instantâneo de caminhos/validade da configuração da CLI versus serviço para ajudar a diagnosticar desvios de perfil ou diretório de estado.

  </Accordion>
  <Accordion title="Verificações de desvio de autenticação do Linux systemd">
    - Em instalações Linux systemd, as verificações de desvio de autenticação de serviço leem valores de `Environment=` e `EnvironmentFile=` da unit (incluindo `%h`, caminhos entre aspas, vários arquivos e arquivos opcionais com `-`).
    - Verificações de desvio resolvem SecretRefs de `gateway.auth.token` usando o env de runtime mesclado (primeiro o env do comando do serviço, depois o fallback do env do processo).
    - Se a autenticação por token não estiver efetivamente ativa (`gateway.auth.mode` explícito como `password`/`none`/`trusted-proxy`, ou modo não definido quando a senha pode vencer e nenhum candidato de token pode vencer), as verificações de desvio de token ignoram a resolução do token de configuração.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` é o comando de "depurar tudo". Ele sempre sonda:

- seu gateway remoto configurado (se definido), e
- localhost (loopback) **mesmo que o remoto esteja configurado**.

Se você passar `--url`, esse destino explícito será adicionado antes de ambos. A saída humana rotula os destinos como:

- `URL (explicit)`
- `Remote (configured)` ou `Remote (configured, inactive)`
- `Local loopback`

<Note>
Se vários gateways estiverem acessíveis, ele imprime todos eles. Vários gateways são compatíveis quando você usa perfis/portas isolados (por exemplo, um bot de resgate), mas a maioria das instalações ainda executa um único Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretação">
    - `Reachable: yes` significa que pelo menos um destino aceitou uma conexão WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` relata o que a sondagem conseguiu comprovar sobre autenticação. É separado da acessibilidade.
    - `Read probe: ok` significa que chamadas RPC detalhadas de escopo de leitura (`health`/`status`/`system-presence`/`config.get`) também foram bem-sucedidas.
    - `Read probe: limited - missing scope: operator.read` significa que a conexão foi bem-sucedida, mas o RPC de escopo de leitura está limitado. Isso é relatado como acessibilidade **degradada**, não falha completa.
    - `Read probe: failed` após `Connect: ok` significa que o Gateway aceitou a conexão WebSocket, mas os diagnósticos de leitura seguintes atingiram o tempo limite ou falharam. Isso também é acessibilidade **degradada**, não um Gateway inacessível.
    - Como `gateway status`, a sondagem reutiliza a autenticação de dispositivo existente em cache, mas não cria identidade de dispositivo pela primeira vez nem estado de pareamento.
    - O código de saída só é diferente de zero quando nenhum destino sondado está acessível.

  </Accordion>
  <Accordion title="Saída JSON">
    Nível superior:

    - `ok`: pelo menos um destino está acessível.
    - `degraded`: pelo menos um destino aceitou uma conexão, mas não concluiu diagnósticos RPC detalhados completos.
    - `capability`: melhor capacidade observada entre os destinos acessíveis (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` ou `unknown`).
    - `primaryTargetId`: melhor destino a tratar como o vencedor ativo nesta ordem: URL explícita, túnel SSH, remoto configurado e então local loopback.
    - `warnings[]`: registros de aviso de melhor esforço com `code`, `message` e `targetIds` opcional.
    - `network`: dicas de URL de local loopback/tailnet derivadas da configuração atual e da rede do host.
    - `discovery.timeoutMs` e `discovery.count`: o orçamento/contagem de resultados de descoberta reais usados nesta passagem de sondagem.

    Por destino (`targets[].connect`):

    - `ok`: acessibilidade após conexão + classificação degradada.
    - `rpcOk`: sucesso completo do RPC detalhado.
    - `scopeLimited`: RPC detalhado falhou por falta de escopo de operador.

    Por destino (`targets[].auth`):

    - `role`: função de autenticação relatada em `hello-ok` quando disponível.
    - `scopes`: escopos concedidos relatados em `hello-ok` quando disponíveis.
    - `capability`: a classificação de capacidade de autenticação exposta para esse destino.

  </Accordion>
  <Accordion title="Códigos de aviso comuns">
    - `ssh_tunnel_failed`: a configuração do túnel SSH falhou; o comando recorreu a sondagens diretas.
    - `multiple_gateways`: mais de um destino estava acessível; isso é incomum, a menos que você execute intencionalmente perfis isolados, como um bot de resgate.
    - `auth_secretref_unresolved`: uma SecretRef de autenticação configurada não pôde ser resolvida para um destino com falha.
    - `probe_scope_limited`: a conexão WebSocket foi bem-sucedida, mas a sondagem de leitura foi limitada pela ausência de `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remoto por SSH (paridade com o app para Mac)

O modo "Remote over SSH" do app macOS usa um encaminhamento de porta local para que o gateway remoto (que pode estar vinculado apenas ao loopback) fique acessível em `ws://127.0.0.1:<port>`.

Equivalente na CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` ou `user@host:port` (a porta padrão é `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Arquivo de identidade.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Escolhe o primeiro host de gateway descoberto como destino SSH a partir do endpoint de descoberta resolvido (`local.` mais o domínio de longa distância configurado, se houver). Dicas somente TXT são ignoradas.
</ParamField>

Configuração (opcional, usada como padrão):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Auxiliar RPC de baixo nível.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  String de objeto JSON para parâmetros.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket do Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token do Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  Senha do Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  Orçamento de tempo limite.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Principalmente para RPCs no estilo de agente que transmitem eventos intermediários antes de uma carga útil final.
</ParamField>
<ParamField path="--json" type="boolean">
  Saída JSON legível por máquina.
</ParamField>

<Note>
`--params` deve ser JSON válido.
</Note>

## Gerenciar o serviço Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Instalar com um wrapper

Use `--wrapper` quando o serviço gerenciado precisar iniciar por meio de outro executável, por exemplo um
shim de gerenciador de segredos ou um auxiliar run-as. O wrapper recebe os argumentos normais do Gateway e é
responsável por, eventualmente, executar `openclaw` ou Node com esses argumentos.

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

Você também pode definir o wrapper pelo ambiente. `gateway install` valida que o caminho é
um arquivo executável, grava o wrapper em `ProgramArguments` do serviço e persiste
`OPENCLAW_WRAPPER` no ambiente do serviço para reinstalações forçadas, atualizações e reparos do doctor
posteriores.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Para remover um wrapper persistido, limpe `OPENCLAW_WRAPPER` ao reinstalar:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Opções de comando">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Comportamento do ciclo de vida">
    - Use `gateway restart` para reiniciar um serviço gerenciado. Não encadeie `gateway stop` e `gateway start` como substituto de reinicialização.
    - No macOS, `gateway stop` usa `launchctl bootout` por padrão, o que remove o LaunchAgent da sessão de inicialização atual sem persistir uma desativação — a recuperação automática do KeepAlive permanece ativa para falhas futuras, e `gateway start` reativa de forma limpa sem um `launchctl enable` manual. Passe `--disable` para suprimir persistentemente KeepAlive e RunAtLoad, de modo que o gateway não seja reiniciado até o próximo `gateway start` explícito; use isso quando uma parada manual deve sobreviver a reinicializações ou reinícios do sistema.
    - `gateway restart --safe` solicita ao Gateway em execução que faça uma pré-verificação do trabalho ativo do OpenClaw e adie a reinicialização até que a entrega de respostas, execuções incorporadas e execuções de tarefas sejam drenadas. `--safe` não pode ser combinado com `--force` ou `--wait`.
    - `gateway restart --wait 30s` substitui o orçamento configurado de drenagem de reinicialização para essa reinicialização. Números sem unidade são milissegundos; unidades como `s`, `m` e `h` são aceitas. `--wait 0` aguarda indefinidamente.
    - `gateway restart --safe --skip-deferral` executa a reinicialização segura ciente do OpenClaw, mas ignora a barreira de adiamento, para que o Gateway emita a reinicialização imediatamente mesmo quando bloqueadores forem relatados. Escape operacional para adiamentos de execuções de tarefas travadas; requer `--safe`.
    - `gateway restart --force` ignora a drenagem de trabalho ativo e reinicia imediatamente. Use quando um operador já tiver inspecionado os bloqueadores de tarefas listados e quiser o gateway de volta agora.
    - Comandos de ciclo de vida aceitam `--json` para scripting.

  </Accordion>
  <Accordion title="Autenticação e SecretRefs no momento da instalação">
    - Quando a autenticação por token exige um token e `gateway.auth.token` é gerenciado por SecretRef, `gateway install` valida que o SecretRef pode ser resolvido, mas não persiste o token resolvido nos metadados de ambiente do serviço.
    - Se a autenticação por token exige um token e o SecretRef de token configurado não é resolvido, a instalação falha de forma fechada em vez de persistir texto simples de fallback.
    - Para autenticação por senha em `gateway run`, prefira `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` ou um `gateway.auth.password` baseado em SecretRef em vez de `--password` inline.
    - No modo de autenticação inferida, `OPENCLAW_GATEWAY_PASSWORD` disponível apenas no shell não relaxa os requisitos de token de instalação; use configuração durável (`gateway.auth.password` ou `env` de configuração) ao instalar um serviço gerenciado.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação é bloqueada até que o modo seja definido explicitamente.

  </Accordion>
</AccordionGroup>

## Descobrir Gateways (Bonjour)

`gateway discover` verifica beacons de Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour de área ampla): escolha um domínio (exemplo: `openclaw.internal.`) e configure DNS dividido + um servidor DNS; consulte [Bonjour](/pt-BR/gateway/bonjour).

Somente Gateways com descoberta Bonjour ativada (padrão) anunciam o beacon.

Registros de descoberta de área ampla podem incluir estas dicas TXT:

- `role` (dica de função do gateway)
- `transport` (dica de transporte, por exemplo, `gateway`)
- `gatewayPort` (porta WebSocket, geralmente `18789`)
- `sshPort` (somente modo de descoberta completo; clientes usam `22` como destino SSH padrão quando ausente)
- `tailnetDns` (nome de host MagicDNS, quando disponível)
- `gatewayTls` / `gatewayTlsSha256` (TLS ativado + impressão digital do certificado)
- `cliPath` (somente modo de descoberta completo)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Tempo limite por comando (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Saída legível por máquina (também desativa estilo/spinner).
</ParamField>

Exemplos:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- A CLI verifica `local.` mais o domínio de área ampla configurado quando um está ativado.
- `wsUrl` na saída JSON é derivado do endpoint de serviço resolvido, não de dicas apenas TXT, como `lanHost` ou `tailnetDns`.
- Em mDNS `local.` e DNS-SD de área ampla, `sshPort` e `cliPath` são publicados somente quando `discovery.mdns.mode` é `full`.

</Note>

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Runbook do Gateway](/pt-BR/gateway)
