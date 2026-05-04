---
read_when:
    - Executando o Gateway pela CLI (desenvolvimento ou servidores)
    - Depuração de autenticação do Gateway, modos de vinculação e conectividade
    - Descoberta de Gateways via Bonjour (DNS-SD local + de área ampla)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — execute, consulte e descubra Gateways
title: Gateway
x-i18n:
    generated_at: "2026-05-04T18:23:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 310867c59148577f2e8ce6f708da6bce936e09243ce7fbe5daeb453c6b3b370d
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
    Chaves de configuração de nível superior do gateway.
  </Card>
</CardGroup>

## Executar o Gateway

Execute um processo local do Gateway:

```bash
openclaw gateway
```

Alias em primeiro plano:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Comportamento de inicialização">
    - Por padrão, o Gateway se recusa a iniciar a menos que `gateway.mode=local` esteja definido em `~/.openclaw/openclaw.json`. Use `--allow-unconfigured` para execuções ad-hoc/de desenvolvimento.
    - Espera-se que `openclaw onboard --mode local` e `openclaw setup` gravem `gateway.mode=local`. Se o arquivo existir, mas `gateway.mode` estiver ausente, trate isso como uma configuração quebrada ou sobrescrita e repare-a em vez de assumir implicitamente o modo local.
    - Se o arquivo existir e `gateway.mode` estiver ausente, o Gateway trata isso como dano suspeito na configuração e se recusa a "adivinhar local" para você.
    - Vincular além do loopback sem autenticação é bloqueado (barreira de segurança).
    - `SIGUSR1` aciona uma reinicialização dentro do processo quando autorizado (`commands.restart` é habilitado por padrão; defina `commands.restart: false` para bloquear a reinicialização manual, enquanto aplicação/atualização da ferramenta/configuração do gateway continuam permitidas).
    - Os manipuladores de `SIGINT`/`SIGTERM` interrompem o processo do gateway, mas não restauram nenhum estado personalizado do terminal. Se você encapsular a CLI com uma TUI ou entrada em modo bruto, restaure o terminal antes de sair.

  </Accordion>
</AccordionGroup>

### Opções

<ParamField path="--port <port>" type="number">
  Porta WebSocket (o padrão vem da configuração/env; geralmente `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Modo de bind do listener.
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
  Leia a senha do gateway de um arquivo.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Exponha o Gateway via Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Redefina a configuração serve/funnel do Tailscale ao encerrar.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Permita que o gateway inicie sem `gateway.mode=local` na configuração. Ignora a proteção de inicialização apenas para bootstrap ad-hoc/de desenvolvimento; não grava nem repara o arquivo de configuração.
</ParamField>
<ParamField path="--dev" type="boolean">
  Crie uma configuração de desenvolvimento + workspace se ausentes (ignora BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Redefina configuração de desenvolvimento + credenciais + sessões + workspace (requer `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Encerre qualquer listener existente na porta selecionada antes de iniciar.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Logs detalhados.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Mostre apenas logs do backend da CLI no console (e habilite stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Estilo de log do WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias para `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Registre eventos brutos de stream do modelo em jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Caminho jsonl do stream bruto.
</ParamField>

## Reiniciar o Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` pede ao Gateway em execução que faça uma pré-verificação do trabalho ativo do OpenClaw antes de reiniciar. Se operações em fila, entrega de respostas, execuções incorporadas ou execuções de tarefas estiverem ativas, o Gateway relata os bloqueadores, agrupa solicitações duplicadas de reinicialização segura e reinicia quando o trabalho ativo é escoado. `restart` simples mantém o comportamento existente do gerenciador de serviço para compatibilidade. Use `--force` somente quando você quiser explicitamente o caminho de substituição imediata.

<Warning>
`--password` inline pode ser exposto em listagens de processos locais. Prefira `--password-file`, env ou um `gateway.auth.password` baseado em SecretRef.
</Warning>

### Perfilamento da inicialização

- Defina `OPENCLAW_GATEWAY_STARTUP_TRACE=1` para registrar tempos de fases durante a inicialização do Gateway, incluindo atraso `eventLoopMax` por fase e tempos de tabelas de consulta de plugins para índice instalado, registro de manifestos, planejamento de inicialização e trabalho de mapa de proprietários.
- Defina `OPENCLAW_DIAGNOSTICS=timeline` com `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` para gravar uma timeline de diagnósticos de inicialização JSONL de melhor esforço para harnesses externos de QA. Você também pode habilitar a flag com `diagnostics.flags: ["timeline"]` na configuração; o caminho ainda é fornecido por env. Adicione `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` para incluir amostras do loop de eventos.
- Execute `pnpm test:startup:gateway -- --runs 5 --warmup 1` para medir a inicialização do Gateway. O benchmark registra a primeira saída do processo, `/healthz`, `/readyz`, tempos do trace de inicialização, atraso do loop de eventos e detalhes de tempo das tabelas de consulta de plugins.

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
    - `--timeout <ms>`: timeout/orçamento (varia por comando).
    - `--expect-final`: aguarda uma resposta "final" (chamadas de agente).

  </Tab>
</Tabs>

<Note>
Quando você define `--url`, a CLI não recorre a credenciais da configuração ou do ambiente. Passe `--token` ou `--password` explicitamente. Credenciais explícitas ausentes são um erro.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

O endpoint HTTP `/healthz` é uma sonda de vitalidade: ele retorna quando o servidor consegue responder por HTTP. O endpoint HTTP `/readyz` é mais rigoroso e permanece vermelho enquanto sidecars de plugins de inicialização, canais ou hooks configurados ainda estão se acomodando. Respostas detalhadas de prontidão locais ou autenticadas incluem um bloco de diagnóstico `eventLoop` com atraso do loop de eventos, utilização do loop de eventos, proporção de núcleos de CPU e uma flag `degraded`.

### `gateway usage-cost`

Busca resumos de custo de uso dos logs de sessão.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Número de dias a incluir.
</ParamField>

### `gateway stability`

Busca o gravador recente de estabilidade de diagnóstico de um Gateway em execução.

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
  Filtre por tipo de evento de diagnóstico, como `payload.large` ou `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Inclua apenas eventos após um número de sequência de diagnóstico.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Leia um pacote de estabilidade persistido em vez de chamar o Gateway em execução. Use `--bundle latest` (ou apenas `--bundle`) para o pacote mais novo no diretório de estado, ou passe diretamente um caminho JSON do pacote.
</ParamField>
<ParamField path="--export" type="boolean">
  Grave um zip de diagnósticos de suporte compartilhável em vez de imprimir detalhes de estabilidade.
</ParamField>
<ParamField path="--output <path>" type="string">
  Caminho de saída para `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacidade e comportamento do pacote">
    - Os registros mantêm metadados operacionais: nomes de eventos, contagens, tamanhos em bytes, leituras de memória, estado de filas/sessões, nomes de canais/plugins e resumos de sessão redigidos. Eles não mantêm texto de chat, corpos de webhook, saídas de ferramentas, corpos brutos de solicitação ou resposta, tokens, cookies, valores secretos, nomes de host ou ids brutos de sessão. Defina `diagnostics.enabled: false` para desabilitar o gravador totalmente.
    - Em encerramentos fatais do Gateway, timeouts de desligamento e falhas de inicialização após reinicialização, o OpenClaw grava o mesmo snapshot de diagnóstico em `~/.openclaw/logs/stability/openclaw-stability-*.json` quando o gravador tem eventos. Inspecione o pacote mais novo com `openclaw gateway stability --bundle latest`; `--limit`, `--type` e `--since-seq` também se aplicam à saída do pacote.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Grava um zip de diagnósticos local projetado para anexar a relatórios de bugs. Para o modelo de privacidade e o conteúdo do pacote, consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics).

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
  URL WebSocket do Gateway para o snapshot de integridade.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token do Gateway para o snapshot de integridade.
</ParamField>
<ParamField path="--password <password>" type="string">
  Senha do Gateway para o snapshot de integridade.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Timeout do snapshot de status/integridade.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Ignore a busca de pacote de estabilidade persistido.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprima o caminho gravado, o tamanho e o manifesto como JSON.
</ParamField>

A exportação contém um manifesto, um resumo em Markdown, formato da configuração, detalhes sanitizados da configuração, resumos sanitizados de logs, snapshots sanitizados de status/integridade do Gateway e o pacote de estabilidade mais novo quando existir.

Ela foi feita para ser compartilhada. Mantém detalhes operacionais que ajudam na depuração, como campos seguros de log do OpenClaw, nomes de subsistemas, códigos de status, durações, modos configurados, portas, ids de plugins, ids de provedores, configurações de recursos não secretas e mensagens de log operacional redigidas. Omite ou redige texto de chat, corpos de webhook, saídas de ferramentas, credenciais, cookies, identificadores de contas/mensagens, texto de prompts/instruções, nomes de host e valores secretos. Quando uma mensagem no estilo LogTape parece texto de payload de usuário/chat/ferramenta, a exportação mantém apenas que uma mensagem foi omitida, além de sua contagem de bytes.

### `gateway status`

`gateway status` mostra o serviço do Gateway (launchd/systemd/schtasks) mais uma sonda opcional de capacidade de conectividade/autenticação.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Adicione um destino de sondagem explícito. O remoto configurado + localhost ainda são sondados.
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
  Pule a sondagem de conectividade (visão apenas do serviço).
</ParamField>
<ParamField path="--deep" type="boolean">
  Examine também serviços em nível de sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Atualize a sondagem de conectividade padrão para uma sondagem de leitura e saia com código diferente de zero quando essa sondagem de leitura falhar. Não pode ser combinado com `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semântica de status">
    - `gateway status` permanece disponível para diagnósticos mesmo quando a configuração local da CLI está ausente ou é inválida.
    - O `gateway status` padrão comprova o estado do serviço, a conexão WebSocket e a capacidade de autenticação visível no momento do handshake. Ele não comprova operações de leitura/gravação/administração.
    - As sondagens de diagnóstico não fazem mutações para autenticação de dispositivo de primeira vez: elas reutilizam um token de dispositivo existente em cache quando ele existe, mas não criam uma nova identidade de dispositivo da CLI nem um registro de pareamento de dispositivo somente leitura apenas para verificar o status.
    - `gateway status` resolve SecretRefs de autenticação configurados para autenticação da sondagem quando possível.
    - Se um SecretRef de autenticação obrigatório não for resolvido nesse caminho de comando, `gateway status --json` relatará `rpc.authWarning` quando a conectividade/autenticação da sondagem falhar; passe `--token`/`--password` explicitamente ou resolva a origem do segredo primeiro.
    - Se a sondagem for bem-sucedida, avisos de referências de autenticação não resolvidas serão suprimidos para evitar falsos positivos.
    - Use `--require-rpc` em scripts e automação quando um serviço em escuta não for suficiente e você também precisar que chamadas RPC com escopo de leitura estejam íntegras.
    - `--deep` adiciona uma verificação de melhor esforço por instalações extras de launchd/systemd/schtasks. Quando vários serviços semelhantes ao Gateway são detectados, a saída humana imprime dicas de limpeza e avisa que a maioria das configurações deve executar um Gateway por máquina.
    - A saída humana inclui o caminho resolvido do log em arquivo mais um instantâneo dos caminhos/validade da configuração CLI-vs-serviço para ajudar a diagnosticar desvios de perfil ou diretório de estado.

  </Accordion>
  <Accordion title="Verificações de desvio de autenticação do systemd no Linux">
    - Em instalações Linux systemd, as verificações de desvio de autenticação do serviço leem valores `Environment=` e `EnvironmentFile=` da unidade (incluindo `%h`, caminhos entre aspas, múltiplos arquivos e arquivos opcionais com `-`).
    - As verificações de desvio resolvem SecretRefs de `gateway.auth.token` usando o ambiente de runtime mesclado (primeiro o ambiente do comando do serviço, depois fallback para o ambiente do processo).
    - Se a autenticação por token não estiver efetivamente ativa (`gateway.auth.mode` explícito de `password`/`none`/`trusted-proxy`, ou modo não definido em que a senha pode prevalecer e nenhum candidato a token pode prevalecer), as verificações de desvio de token pulam a resolução do token de configuração.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` é o comando de "depurar tudo". Ele sempre sonda:

- seu Gateway remoto configurado (se definido), e
- localhost (loopback) **mesmo se o remoto estiver configurado**.

Se você passar `--url`, esse destino explícito será adicionado antes de ambos. A saída humana rotula os destinos como:

- `URL (explicit)`
- `Remote (configured)` ou `Remote (configured, inactive)`
- `Local loopback`

<Note>
Se vários Gateways estiverem acessíveis, ele imprime todos. Múltiplos Gateways têm suporte quando você usa perfis/portas isolados (por exemplo, um bot de resgate), mas a maioria das instalações ainda executa um único Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretação">
    - `Reachable: yes` significa que pelo menos um destino aceitou uma conexão WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` relata o que a sondagem conseguiu comprovar sobre autenticação. Isso é separado da alcançabilidade.
    - `Read probe: ok` significa que chamadas RPC detalhadas com escopo de leitura (`health`/`status`/`system-presence`/`config.get`) também foram bem-sucedidas.
    - `Read probe: limited - missing scope: operator.read` significa que a conexão foi bem-sucedida, mas o RPC com escopo de leitura está limitado. Isso é relatado como alcançabilidade **degradada**, não falha total.
    - `Read probe: failed` após `Connect: ok` significa que o Gateway aceitou a conexão WebSocket, mas os diagnósticos de leitura subsequentes atingiram o tempo limite ou falharam. Isso também é alcançabilidade **degradada**, não um Gateway inalcançável.
    - Assim como `gateway status`, a sondagem reutiliza a autenticação de dispositivo em cache existente, mas não cria identidade de dispositivo de primeira vez nem estado de pareamento.
    - O código de saída é diferente de zero apenas quando nenhum destino sondado está acessível.

  </Accordion>
  <Accordion title="Saída JSON">
    Nível superior:

    - `ok`: pelo menos um destino está acessível.
    - `degraded`: pelo menos um destino aceitou uma conexão, mas não concluiu todos os diagnósticos RPC detalhados.
    - `capability`: melhor capacidade vista entre destinos acessíveis (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` ou `unknown`).
    - `primaryTargetId`: melhor destino a tratar como vencedor ativo nesta ordem: URL explícita, túnel SSH, remoto configurado e depois local loopback.
    - `warnings[]`: registros de aviso de melhor esforço com `code`, `message` e `targetIds` opcionais.
    - `network`: dicas de URL de local loopback/tailnet derivadas da configuração atual e da rede do host.
    - `discovery.timeoutMs` e `discovery.count`: o orçamento/contagem de resultados de descoberta reais usados nesta passagem de sondagem.

    Por destino (`targets[].connect`):

    - `ok`: alcançabilidade após conexão + classificação degradada.
    - `rpcOk`: sucesso total do RPC detalhado.
    - `scopeLimited`: RPC detalhado falhou devido à ausência de escopo de operador.

    Por destino (`targets[].auth`):

    - `role`: função de autenticação relatada em `hello-ok` quando disponível.
    - `scopes`: escopos concedidos relatados em `hello-ok` quando disponíveis.
    - `capability`: a classificação de capacidade de autenticação exposta para esse destino.

  </Accordion>
  <Accordion title="Códigos de aviso comuns">
    - `ssh_tunnel_failed`: a configuração do túnel SSH falhou; o comando recorreu a sondagens diretas.
    - `multiple_gateways`: mais de um destino estava acessível; isso é incomum, a menos que você execute intencionalmente perfis isolados, como um bot de resgate.
    - `auth_secretref_unresolved`: um SecretRef de autenticação configurado não pôde ser resolvido para um destino com falha.
    - `probe_scope_limited`: a conexão WebSocket foi bem-sucedida, mas a sondagem de leitura foi limitada pela ausência de `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remoto via SSH (paridade com o app para Mac)

O modo "Remote over SSH" do app macOS usa um encaminhamento de porta local para que o Gateway remoto (que pode estar vinculado apenas ao loopback) fique acessível em `ws://127.0.0.1:<port>`.

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
  Escolha o primeiro host de Gateway descoberto como destino SSH a partir do endpoint de descoberta resolvido (`local.` mais o domínio de longa distância configurado, se houver). Dicas somente TXT são ignoradas.
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
  String de objeto JSON para params.
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
  Principalmente para RPCs no estilo agente que transmitem eventos intermediários antes de um payload final.
</ParamField>
<ParamField path="--json" type="boolean">
  Saída JSON legível por máquina.
</ParamField>

<Note>
`--params` deve ser JSON válido.
</Note>

## Gerencie o serviço Gateway

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
responsável por eventualmente executar `openclaw` ou Node com esses argumentos via exec.

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

Para remover um wrapper persistido, limpe `OPENCLAW_WRAPPER` durante a reinstalação:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Opções de comando">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="Comportamento do ciclo de vida">
    - Use `gateway restart` para reiniciar um serviço gerenciado. Não encadeie `gateway stop` e `gateway start` como substituto de reinicialização; no macOS, `gateway stop` desativa intencionalmente o LaunchAgent antes de pará-lo.
    - `gateway restart --wait 30s` substitui o orçamento configurado de drenagem de reinicialização para essa reinicialização. Números sem unidade são milissegundos; unidades como `s`, `m` e `h` são aceitas. `--wait 0` aguarda indefinidamente.
    - `gateway restart --force` pula a drenagem de trabalho ativo e reinicia imediatamente. Use quando um operador já tiver inspecionado os bloqueadores de tarefas listados e quiser o Gateway de volta agora.
    - Comandos de ciclo de vida aceitam `--json` para scripts.

  </Accordion>
  <Accordion title="Autenticação e SecretRefs no momento da instalação">
    - Quando a autenticação por token requer um token e `gateway.auth.token` é gerenciado por SecretRef, `gateway install` valida que o SecretRef pode ser resolvido, mas não persiste o token resolvido nos metadados de ambiente do serviço.
    - Se a autenticação por token requer um token e o SecretRef de token configurado não é resolvido, a instalação falha de forma fechada em vez de persistir fallback em texto claro.
    - Para autenticação por senha em `gateway run`, prefira `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` ou um `gateway.auth.password` com suporte de SecretRef em vez de `--password` inline.
    - No modo de autenticação inferido, `OPENCLAW_GATEWAY_PASSWORD` apenas no shell não relaxa os requisitos de token de instalação; use configuração durável (`gateway.auth.password` ou `env` de configuração) ao instalar um serviço gerenciado.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação será bloqueada até que o modo seja definido explicitamente.

  </Accordion>
</AccordionGroup>

## Descobrir Gateways (Bonjour)

`gateway discover` verifica beacons do Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Bonjour de área ampla): escolha um domínio (exemplo: `openclaw.internal.`) e configure DNS dividido + um servidor DNS; consulte [Bonjour](/pt-BR/gateway/bonjour).

Somente gateways com descoberta Bonjour habilitada (padrão) anunciam o sinalizador.

Registros de descoberta de área ampla incluem (TXT):

- `role` (dica de função do gateway)
- `transport` (dica de transporte, por exemplo, `gateway`)
- `gatewayPort` (porta WebSocket, geralmente `18789`)
- `sshPort` (opcional; clientes usam `22` como destino SSH padrão quando ausente)
- `tailnetDns` (nome de host MagicDNS, quando disponível)
- `gatewayTls` / `gatewayTlsSha256` (TLS habilitado + impressão digital do certificado)
- `cliPath` (dica de instalação remota gravada na zona de área ampla)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Tempo limite por comando (busca/resolução).
</ParamField>
<ParamField path="--json" type="boolean">
  Saída legível por máquina (também desabilita estilo/spinner).
</ParamField>

Exemplos:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- A CLI examina `local.` mais o domínio de área ampla configurado quando um está habilitado.
- `wsUrl` na saída JSON é derivado do endpoint de serviço resolvido, não de dicas apenas em TXT, como `lanHost` ou `tailnetDns`.
- Em mDNS `local.`, `sshPort` e `cliPath` só são transmitidos quando `discovery.mdns.mode` é `full`. DNS-SD de área ampla ainda grava `cliPath`; `sshPort` também permanece opcional lá.

</Note>

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Runbook do Gateway](/pt-BR/gateway)
