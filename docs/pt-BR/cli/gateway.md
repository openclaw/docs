---
read_when:
    - Executando o Gateway pela CLI (desenvolvimento ou servidores)
    - Depuração da autenticação do Gateway, dos modos de vinculação e da conectividade
    - Descoberta de Gateways via Bonjour (local + DNS-SD de área ampla)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — executar, consultar e descobrir gateways
title: Gateway
x-i18n:
    generated_at: "2026-05-02T05:43:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f204b58e03c9dd1b75a7ddb2be0634ee70b42aa317a2668ab86cb33a0570b01
    source_path: cli/gateway.md
    workflow: 16
---

O Gateway é o servidor WebSocket do OpenClaw (canais, nodes, sessões, hooks). Os subcomandos nesta página ficam em `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/pt-BR/gateway/bonjour">
    Configuração de mDNS local + DNS-SD de área ampla.
  </Card>
  <Card title="Discovery overview" href="/pt-BR/gateway/discovery">
    Como o OpenClaw anuncia e encontra gateways.
  </Card>
  <Card title="Configuration" href="/pt-BR/gateway/configuration">
    Chaves de configuração de gateway de nível superior.
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
  <Accordion title="Startup behavior">
    - Por padrão, o Gateway se recusa a iniciar a menos que `gateway.mode=local` esteja definido em `~/.openclaw/openclaw.json`. Use `--allow-unconfigured` para execuções ad hoc/dev.
    - Espera-se que `openclaw onboard --mode local` e `openclaw setup` gravem `gateway.mode=local`. Se o arquivo existir, mas `gateway.mode` estiver ausente, trate isso como uma configuração quebrada ou sobrescrita e repare-a em vez de presumir implicitamente o modo local.
    - Se o arquivo existir e `gateway.mode` estiver ausente, o Gateway trata isso como dano suspeito na configuração e se recusa a "adivinhar local" para você.
    - A vinculação além de loopback sem autenticação é bloqueada (barreira de segurança).
    - `SIGUSR1` aciona uma reinicialização dentro do processo quando autorizado (`commands.restart` fica habilitado por padrão; defina `commands.restart: false` para bloquear a reinicialização manual, enquanto aplicação/atualização de ferramenta/configuração do gateway continuam permitidas).
    - Os handlers de `SIGINT`/`SIGTERM` param o processo do gateway, mas não restauram nenhum estado personalizado do terminal. Se você encapsular a CLI com uma TUI ou entrada em modo bruto, restaure o terminal antes de sair.

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
  Sobrescrita do modo de autenticação.
</ParamField>
<ParamField path="--token <token>" type="string">
  Sobrescrita do token (também define `OPENCLAW_GATEWAY_TOKEN` para o processo).
</ParamField>
<ParamField path="--password <password>" type="string">
  Sobrescrita da senha.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Ler a senha do gateway de um arquivo.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Expor o Gateway via Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Redefinir a configuração serve/funnel do Tailscale no desligamento.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Permitir que o gateway inicie sem `gateway.mode=local` na configuração. Ignora a proteção de inicialização apenas para bootstrap ad hoc/dev; não grava nem repara o arquivo de configuração.
</ParamField>
<ParamField path="--dev" type="boolean">
  Criar uma configuração dev + workspace se estiverem ausentes (ignora BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Redefinir configuração dev + credenciais + sessões + workspace (requer `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Encerrar qualquer listener existente na porta selecionada antes de iniciar.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Logs detalhados.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Mostrar apenas logs do backend da CLI no console (e habilitar stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Estilo de log do WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias para `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Registrar eventos brutos de stream do modelo em jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Caminho jsonl do stream bruto.
</ParamField>

<Warning>
`--password` inline pode ser exposto em listagens locais de processos. Prefira `--password-file`, env ou um `gateway.auth.password` baseado em SecretRef.
</Warning>

### Perfilamento de inicialização

- Defina `OPENCLAW_GATEWAY_STARTUP_TRACE=1` para registrar tempos de fases durante a inicialização do Gateway, incluindo atraso `eventLoopMax` por fase e tempos de tabelas de consulta de plugins para índice instalado, registro de manifestos, planejamento de inicialização e trabalho do mapa de proprietários.
- Defina `OPENCLAW_DIAGNOSTICS=timeline` com `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` para gravar uma linha do tempo de diagnósticos de inicialização em JSONL por melhor esforço para harnesses externos de QA. Você também pode habilitar a flag com `diagnostics.flags: ["timeline"]` na configuração; o caminho ainda é fornecido por env. Adicione `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` para incluir amostras do event-loop.
- Execute `pnpm test:startup:gateway -- --runs 5 --warmup 1` para medir a inicialização do Gateway. O benchmark registra a primeira saída do processo, `/healthz`, `/readyz`, tempos de trace de inicialização, atraso do event-loop e detalhes de tempo das tabelas de consulta de plugins.

## Consultar um Gateway em execução

Todos os comandos de consulta usam RPC via WebSocket.

<Tabs>
  <Tab title="Output modes">
    - Padrão: legível para humanos (colorido em TTY).
    - `--json`: JSON legível por máquina (sem estilo/spinner).
    - `--no-color` (ou `NO_COLOR=1`): desabilita ANSI mantendo o layout humano.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: URL WebSocket do Gateway.
    - `--token <token>`: token do Gateway.
    - `--password <password>`: senha do Gateway.
    - `--timeout <ms>`: timeout/orçamento (varia por comando).
    - `--expect-final`: aguarda uma resposta "final" (chamadas de agente).

  </Tab>
</Tabs>

<Note>
Quando você define `--url`, a CLI não recorre às credenciais de configuração ou ambiente. Passe `--token` ou `--password` explicitamente. Credenciais explícitas ausentes são um erro.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

O endpoint HTTP `/healthz` é uma sonda de vivacidade: ele retorna assim que o servidor consegue responder HTTP. O endpoint HTTP `/readyz` é mais rigoroso e permanece vermelho enquanto sidecars de plugins de inicialização, canais ou hooks configurados ainda estão se estabilizando. Respostas detalhadas de prontidão locais ou autenticadas incluem um bloco de diagnóstico `eventLoop` com atraso do event-loop, utilização do event-loop, proporção de núcleos de CPU e uma flag `degraded`.

### `gateway usage-cost`

Busca resumos de custo de uso a partir dos logs de sessão.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Número de dias a incluir.
</ParamField>

### `gateway stability`

Busca o registrador recente de estabilidade diagnóstica de um Gateway em execução.

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
  Filtrar por tipo de evento de diagnóstico, como `payload.large` ou `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Incluir apenas eventos após um número de sequência de diagnóstico.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Ler um bundle de estabilidade persistido em vez de chamar o Gateway em execução. Use `--bundle latest` (ou apenas `--bundle`) para o bundle mais recente no diretório de estado, ou passe diretamente um caminho JSON do bundle.
</ParamField>
<ParamField path="--export" type="boolean">
  Gravar um zip de diagnósticos de suporte compartilhável em vez de imprimir detalhes de estabilidade.
</ParamField>
<ParamField path="--output <path>" type="string">
  Caminho de saída para `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - Os registros mantêm metadados operacionais: nomes de eventos, contagens, tamanhos em bytes, leituras de memória, estado de filas/sessões, nomes de canais/plugins e resumos de sessões redigidos. Eles não mantêm texto de chat, corpos de Webhook, saídas de ferramentas, corpos brutos de requisição ou resposta, tokens, cookies, valores secretos, hostnames nem ids brutos de sessão. Defina `diagnostics.enabled: false` para desabilitar completamente o registrador.
    - Em saídas fatais do Gateway, timeouts de desligamento e falhas de inicialização de reinício, o OpenClaw grava o mesmo snapshot de diagnóstico em `~/.openclaw/logs/stability/openclaw-stability-*.json` quando o registrador tem eventos. Inspecione o bundle mais recente com `openclaw gateway stability --bundle latest`; `--limit`, `--type` e `--since-seq` também se aplicam à saída do bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Grava um zip local de diagnósticos projetado para anexar a relatórios de bug. Para o modelo de privacidade e o conteúdo do bundle, consulte [Exportação de Diagnósticos](/pt-BR/gateway/diagnostics).

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
  Timeout do snapshot de status/saúde.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Ignorar a busca de bundle de estabilidade persistido.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprimir o caminho gravado, tamanho e manifesto como JSON.
</ParamField>

A exportação contém um manifesto, um resumo em Markdown, formato da configuração, detalhes de configuração sanitizados, resumos de logs sanitizados, snapshots sanitizados de status/saúde do Gateway e o bundle de estabilidade mais recente quando existir.

Ela deve ser compartilhada. Ela mantém detalhes operacionais que ajudam na depuração, como campos seguros de log do OpenClaw, nomes de subsistemas, códigos de status, durações, modos configurados, portas, ids de plugins, ids de provedores, configurações de recursos não secretas e mensagens de log operacional redigidas. Ela omite ou redige texto de chat, corpos de Webhook, saídas de ferramentas, credenciais, cookies, identificadores de conta/mensagem, texto de prompts/instruções, hostnames e valores secretos. Quando uma mensagem no estilo LogTape parece texto de payload de usuário/chat/ferramenta, a exportação mantém apenas que uma mensagem foi omitida, além de sua contagem de bytes.

### `gateway status`

`gateway status` mostra o serviço do Gateway (launchd/systemd/schtasks) mais uma sonda opcional de conectividade/capacidade de autenticação.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Adicionar um alvo explícito de sonda. Remoto configurado + localhost ainda são sondados.
</ParamField>
<ParamField path="--token <token>" type="string">
  Autenticação por token para a sonda.
</ParamField>
<ParamField path="--password <password>" type="string">
  Autenticação por senha para a sonda.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Timeout da sonda.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Ignorar a sonda de conectividade (visualização somente de serviço).
</ParamField>
<ParamField path="--deep" type="boolean">
  Verificar também serviços em nível de sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Promover a sonda de conectividade padrão para uma sonda de leitura e sair com código diferente de zero quando essa sonda de leitura falhar. Não pode ser combinado com `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semântica de status">
    - `gateway status` permanece disponível para diagnósticos mesmo quando a configuração local da CLI está ausente ou inválida.
    - O `gateway status` padrão comprova o estado do serviço, a conexão WebSocket e o recurso de autenticação visível no momento do handshake. Ele não comprova operações de leitura/gravação/admin.
    - Sondagens de diagnóstico não fazem mutações para autenticação de dispositivo pela primeira vez: elas reutilizam um token de dispositivo em cache existente quando houver um, mas não criam uma nova identidade de dispositivo da CLI nem um registro de pareamento de dispositivo somente leitura apenas para verificar o status.
    - `gateway status` resolve SecretRefs de autenticação configuradas para autenticação da sondagem quando possível.
    - Se uma SecretRef de autenticação obrigatória não for resolvida neste caminho de comando, `gateway status --json` relata `rpc.authWarning` quando a conectividade/autenticação da sondagem falha; passe `--token`/`--password` explicitamente ou resolva primeiro a origem do segredo.
    - Se a sondagem for bem-sucedida, os avisos de referência de autenticação não resolvida serão suprimidos para evitar falsos positivos.
    - Use `--require-rpc` em scripts e automação quando um serviço escutando não for suficiente e você também precisar que chamadas RPC com escopo de leitura estejam íntegras.
    - `--deep` adiciona uma varredura de melhor esforço por instalações extras launchd/systemd/schtasks. Quando vários serviços semelhantes ao Gateway são detectados, a saída para humanos imprime dicas de limpeza e avisa que a maioria das configurações deve executar um Gateway por máquina.
    - A saída para humanos inclui o caminho resolvido do arquivo de log mais um snapshot dos caminhos/validade da configuração CLI versus serviço para ajudar a diagnosticar divergência de perfil ou diretório de estado.

  </Accordion>
  <Accordion title="Verificações de divergência de autenticação do systemd no Linux">
    - Em instalações systemd no Linux, as verificações de divergência de autenticação do serviço leem valores `Environment=` e `EnvironmentFile=` da unidade (incluindo `%h`, caminhos entre aspas, vários arquivos e arquivos opcionais `-`).
    - As verificações de divergência resolvem SecretRefs de `gateway.auth.token` usando o env de runtime mesclado (primeiro o env do comando de serviço, depois o fallback do env do processo).
    - Se a autenticação por token não estiver efetivamente ativa (`gateway.auth.mode` explícito de `password`/`none`/`trusted-proxy`, ou modo não definido em que a senha pode vencer e nenhum candidato de token pode vencer), as verificações de divergência de token ignoram a resolução do token de configuração.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` é o comando de "depurar tudo". Ele sempre sonda:

- seu Gateway remoto configurado (se definido), e
- localhost (loopback) **mesmo que remoto esteja configurado**.

Se você passar `--url`, esse alvo explícito será adicionado antes de ambos. A saída para humanos rotula os alvos como:

- `URL (explicit)`
- `Remote (configured)` ou `Remote (configured, inactive)`
- `Local loopback`

<Note>
Se vários Gateways estiverem acessíveis, ele imprime todos. Vários Gateways são compatíveis quando você usa perfis/portas isolados (por exemplo, um bot de resgate), mas a maioria das instalações ainda executa um único Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretação">
    - `Reachable: yes` significa que pelo menos um alvo aceitou uma conexão WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` relata o que a sondagem conseguiu comprovar sobre autenticação. Isso é separado da acessibilidade.
    - `Read probe: ok` significa que chamadas RPC de detalhe com escopo de leitura (`health`/`status`/`system-presence`/`config.get`) também tiveram êxito.
    - `Read probe: limited - missing scope: operator.read` significa que a conexão teve êxito, mas o RPC com escopo de leitura está limitado. Isso é relatado como acessibilidade **degradada**, não como falha total.
    - `Read probe: failed` após `Connect: ok` significa que o Gateway aceitou a conexão WebSocket, mas os diagnósticos de leitura seguintes excederam o tempo limite ou falharam. Isso também é acessibilidade **degradada**, não um Gateway inacessível.
    - Assim como `gateway status`, a sondagem reutiliza a autenticação de dispositivo em cache existente, mas não cria identidade de dispositivo pela primeira vez nem estado de pareamento.
    - O código de saída só é diferente de zero quando nenhum alvo sondado está acessível.

  </Accordion>
  <Accordion title="Saída JSON">
    Nível superior:

    - `ok`: pelo menos um alvo está acessível.
    - `degraded`: pelo menos um alvo aceitou uma conexão, mas não concluiu todos os diagnósticos RPC detalhados.
    - `capability`: melhor recurso visto entre alvos acessíveis (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` ou `unknown`).
    - `primaryTargetId`: melhor alvo para tratar como vencedor ativo nesta ordem: URL explícita, túnel SSH, remoto configurado e então local loopback.
    - `warnings[]`: registros de aviso de melhor esforço com `code`, `message` e `targetIds` opcionais.
    - `network`: dicas de URL de local loopback/tailnet derivadas da configuração atual e da rede do host.
    - `discovery.timeoutMs` e `discovery.count`: o orçamento/contagem de resultados de descoberta real usado para esta passagem de sondagem.

    Por alvo (`targets[].connect`):

    - `ok`: acessibilidade após conexão + classificação degradada.
    - `rpcOk`: sucesso completo de RPC detalhado.
    - `scopeLimited`: RPC detalhado falhou devido à ausência de escopo de operador.

    Por alvo (`targets[].auth`):

    - `role`: função de autenticação relatada em `hello-ok` quando disponível.
    - `scopes`: escopos concedidos relatados em `hello-ok` quando disponíveis.
    - `capability`: a classificação de recurso de autenticação exibida para esse alvo.

  </Accordion>
  <Accordion title="Códigos de aviso comuns">
    - `ssh_tunnel_failed`: a configuração do túnel SSH falhou; o comando recorreu a sondagens diretas.
    - `multiple_gateways`: mais de um alvo estava acessível; isso é incomum, a menos que você execute perfis isolados intencionalmente, como um bot de resgate.
    - `auth_secretref_unresolved`: uma SecretRef de autenticação configurada não pôde ser resolvida para um alvo com falha.
    - `probe_scope_limited`: a conexão WebSocket teve êxito, mas a sondagem de leitura foi limitada pela ausência de `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remoto por SSH (paridade com o app Mac)

O modo "Remote over SSH" do app macOS usa um encaminhamento de porta local para que o Gateway remoto (que pode estar vinculado apenas ao loopback) fique acessível em `ws://127.0.0.1:<port>`.

Equivalente na CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` ou `user@host:port` (a porta usa `22` por padrão).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Arquivo de identidade.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Escolha o primeiro host de Gateway descoberto como alvo SSH a partir do endpoint de descoberta resolvido (`local.` mais o domínio de área ampla configurado, se houver). Dicas somente TXT são ignoradas.
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
  Principalmente para RPCs no estilo de agente que transmitem eventos intermediários antes de um payload final.
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

Use `--wrapper` quando o serviço gerenciado precisar iniciar por outro executável, por exemplo um
shim de gerenciador de segredos ou um auxiliar de execução como outro usuário. O wrapper recebe os argumentos normais do Gateway e é
responsável por eventualmente executar `openclaw` ou Node com esses argumentos.

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

Você também pode definir o wrapper por meio do ambiente. `gateway install` valida que o caminho é
um arquivo executável, grava o wrapper em `ProgramArguments` do serviço e persiste
`OPENCLAW_WRAPPER` no ambiente do serviço para futuras reinstalações forçadas, atualizações e reparos do doctor.

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
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="Comportamento de ciclo de vida">
    - Use `gateway restart` para reiniciar um serviço gerenciado. Não encadeie `gateway stop` e `gateway start` como substituto de reinicialização; no macOS, `gateway stop` desativa intencionalmente o LaunchAgent antes de pará-lo.
    - Comandos de ciclo de vida aceitam `--json` para scripting.

  </Accordion>
  <Accordion title="Autenticação e SecretRefs no momento da instalação">
    - Quando a autenticação por token exige um token e `gateway.auth.token` é gerenciado por SecretRef, `gateway install` valida que a SecretRef é resolvível, mas não persiste o token resolvido nos metadados do ambiente do serviço.
    - Se a autenticação por token exigir um token e a SecretRef de token configurada não for resolvida, a instalação falha de modo fechado em vez de persistir texto simples de fallback.
    - Para autenticação por senha em `gateway run`, prefira `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` ou um `gateway.auth.password` apoiado por SecretRef em vez de `--password` inline.
    - No modo de autenticação inferido, `OPENCLAW_GATEWAY_PASSWORD` somente no shell não relaxa os requisitos de token da instalação; use configuração durável (`gateway.auth.password` ou `env` de configuração) ao instalar um serviço gerenciado.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação será bloqueada até que o modo seja definido explicitamente.

  </Accordion>
</AccordionGroup>

## Descobrir Gateways (Bonjour)

`gateway discover` procura beacons de Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour de área ampla): escolha um domínio (exemplo: `openclaw.internal.`) e configure DNS dividido + um servidor DNS; consulte [Bonjour](/pt-BR/gateway/bonjour).

Somente Gateways com descoberta Bonjour habilitada (padrão) anunciam o beacon.

Registros de descoberta de área ampla incluem (TXT):

- `role` (dica de função do Gateway)
- `transport` (dica de transporte, por exemplo, `gateway`)
- `gatewayPort` (porta WebSocket, geralmente `18789`)
- `sshPort` (opcional; clientes usam alvos SSH padrão para `22` quando ausente)
- `tailnetDns` (nome de host MagicDNS, quando disponível)
- `gatewayTls` / `gatewayTlsSha256` (TLS habilitado + impressão digital do certificado)
- `cliPath` (dica de instalação remota gravada na zona de área ampla)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Tempo limite por comando (navegar/resolver).
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
- A CLI verifica `local.` mais o domínio de área ampla configurado quando um está habilitado.
- `wsUrl` na saída JSON é derivado do endpoint de serviço resolvido, não de dicas somente TXT, como `lanHost` ou `tailnetDns`.
- No mDNS `local.`, `sshPort` e `cliPath` só são anunciados quando `discovery.mdns.mode` é `full`. O DNS-SD de área ampla ainda grava `cliPath`; `sshPort` também permanece opcional ali.

</Note>

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Runbook do Gateway](/pt-BR/gateway)
