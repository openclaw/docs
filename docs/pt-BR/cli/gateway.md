---
read_when:
    - Executando o Gateway a partir da CLI (dev ou servidores)
    - Depurando autenticação, modos de bind e conectividade do Gateway
    - Descobrindo gateways via Bonjour (local + DNS-SD de longa distância)
summary: CLI do Gateway OpenClaw (`openclaw gateway`) — executar, consultar e descobrir gateways
title: Gateway
x-i18n:
    generated_at: "2026-04-24T05:45:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 011b8c8f86de6ecafbf17357a458956357ebe8285fe86e2bf875a4e2d87b5126
    source_path: cli/gateway.md
    workflow: 15
---

# CLI do Gateway

O Gateway é o servidor WebSocket do OpenClaw (canais, nodes, sessões, hooks).

Os subcomandos desta página ficam em `openclaw gateway …`.

Documentação relacionada:

- [/gateway/bonjour](/pt-BR/gateway/bonjour)
- [/gateway/discovery](/pt-BR/gateway/discovery)
- [/gateway/configuration](/pt-BR/gateway/configuration)

## Executar o Gateway

Execute um processo local do Gateway:

```bash
openclaw gateway
```

Alias de primeiro plano:

```bash
openclaw gateway run
```

Observações:

- Por padrão, o Gateway se recusa a iniciar a menos que `gateway.mode=local` esteja definido em `~/.openclaw/openclaw.json`. Use `--allow-unconfigured` para execuções ad hoc/dev.
- É esperado que `openclaw onboard --mode local` e `openclaw setup` gravem `gateway.mode=local`. Se o arquivo existir, mas `gateway.mode` estiver ausente, trate isso como uma configuração corrompida ou sobrescrita e repare-a em vez de presumir implicitamente o modo local.
- Se o arquivo existir e `gateway.mode` estiver ausente, o Gateway trata isso como um dano suspeito na configuração e se recusa a “presumir local” para você.
- Fazer bind além de local loopback sem autenticação é bloqueado (proteção de segurança).
- `SIGUSR1` aciona uma reinicialização em processo quando autorizado (`commands.restart` é ativado por padrão; defina `commands.restart: false` para bloquear reinicialização manual, enquanto aplicação/atualização de ferramenta/configuração do gateway continuam permitidas).
- Os manipuladores de `SIGINT`/`SIGTERM` interrompem o processo do gateway, mas não restauram nenhum estado personalizado do terminal. Se você encapsular a CLI com uma TUI ou entrada em modo raw, restaure o terminal antes de sair.

### Opções

- `--port <port>`: porta WebSocket (o padrão vem de config/env; normalmente `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: modo de bind do listener.
- `--auth <token|password>`: substituição do modo de autenticação.
- `--token <token>`: substituição do token (também define `OPENCLAW_GATEWAY_TOKEN` para o processo).
- `--password <password>`: substituição da senha. Aviso: senhas inline podem ficar expostas em listagens locais de processos.
- `--password-file <path>`: lê a senha do gateway de um arquivo.
- `--tailscale <off|serve|funnel>`: expõe o Gateway via Tailscale.
- `--tailscale-reset-on-exit`: redefine a configuração do Tailscale serve/funnel ao encerrar.
- `--allow-unconfigured`: permite iniciar o gateway sem `gateway.mode=local` na configuração. Isso ignora a proteção de inicialização apenas para bootstrap ad hoc/dev; não grava nem repara o arquivo de configuração.
- `--dev`: cria uma configuração + workspace de dev se estiverem ausentes (ignora `BOOTSTRAP.md`).
- `--reset`: redefine config de dev + credenciais + sessões + workspace (requer `--dev`).
- `--force`: encerra qualquer listener existente na porta selecionada antes de iniciar.
- `--verbose`: logs detalhados.
- `--cli-backend-logs`: mostra apenas os logs de backend da CLI no console (e ativa stdout/stderr).
- `--ws-log <auto|full|compact>`: estilo de log do websocket (padrão `auto`).
- `--compact`: alias para `--ws-log compact`.
- `--raw-stream`: registra eventos brutos de stream do modelo em jsonl.
- `--raw-stream-path <path>`: caminho do jsonl de stream bruto.

Perfil de inicialização:

- Defina `OPENCLAW_GATEWAY_STARTUP_TRACE=1` para registrar tempos de fase durante a inicialização do Gateway.
- Execute `pnpm test:startup:gateway -- --runs 5 --warmup 1` para medir a inicialização do Gateway. O benchmark registra a primeira saída do processo, `/healthz`, `/readyz` e os tempos do trace de inicialização.

## Consultar um Gateway em execução

Todos os comandos de consulta usam RPC por WebSocket.

Modos de saída:

- Padrão: legível por humanos (colorido em TTY).
- `--json`: JSON legível por máquina (sem estilo/spinner).
- `--no-color` (ou `NO_COLOR=1`): desativa ANSI mantendo o layout legível por humanos.

Opções compartilhadas (onde compatíveis):

- `--url <url>`: URL WebSocket do Gateway.
- `--token <token>`: token do Gateway.
- `--password <password>`: senha do Gateway.
- `--timeout <ms>`: timeout/orçamento (varia por comando).
- `--expect-final`: aguarda uma resposta “final” (chamadas de agente).

Observação: quando você define `--url`, a CLI não usa fallback para credenciais de configuração ou ambiente.
Passe `--token` ou `--password` explicitamente. A ausência de credenciais explícitas é um erro.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

O endpoint HTTP `/healthz` é uma probe de liveness: ele retorna assim que o servidor consegue responder por HTTP. O endpoint HTTP `/readyz` é mais rigoroso e permanece indisponível enquanto sidecars de inicialização, canais ou hooks configurados ainda estão se estabilizando.

### `gateway usage-cost`

Busca resumos de custo de uso a partir de logs de sessão.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Opções:

- `--days <days>`: número de dias a incluir (padrão `30`).

### `gateway stability`

Busca o registrador recente de estabilidade diagnóstica de um Gateway em execução.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

Opções:

- `--limit <limit>`: número máximo de eventos recentes a incluir (padrão `25`, máximo `1000`).
- `--type <type>`: filtra por tipo de evento diagnóstico, como `payload.large` ou `diagnostic.memory.pressure`.
- `--since-seq <seq>`: inclui apenas eventos após um número de sequência diagnóstica.
- `--bundle [path]`: lê um bundle de estabilidade persistido em vez de chamar o Gateway em execução. Use `--bundle latest` (ou apenas `--bundle`) para o bundle mais novo no diretório de estado, ou passe diretamente o caminho de um bundle JSON.
- `--export`: grava um zip compartilhável de diagnósticos de suporte em vez de imprimir detalhes de estabilidade.
- `--output <path>`: caminho de saída para `--export`.

Observações:

- Os registros mantêm metadados operacionais: nomes de eventos, contagens, tamanhos em bytes, leituras de memória, estado de fila/sessão, nomes de canal/Plugin e resumos de sessão com redação. Eles não mantêm texto de chat, corpos de Webhook, saídas de ferramenta, corpos brutos de requisição ou resposta, tokens, cookies, valores secretos, nomes de host nem IDs brutos de sessão. Defina `diagnostics.enabled: false` para desativar totalmente o registrador.
- Em saídas fatais do Gateway, timeouts de desligamento e falhas de inicialização após reinício, o OpenClaw grava o mesmo snapshot diagnóstico em `~/.openclaw/logs/stability/openclaw-stability-*.json` quando o registrador tem eventos. Inspecione o bundle mais recente com `openclaw gateway stability --bundle latest`; `--limit`, `--type` e `--since-seq` também se aplicam à saída de bundle.

### `gateway diagnostics export`

Grava um zip local de diagnósticos projetado para ser anexado a relatórios de bug.
Para o modelo de privacidade e o conteúdo do bundle, consulte [Diagnostics Export](/pt-BR/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

Opções:

- `--output <path>`: caminho do zip de saída. O padrão é uma exportação de suporte no diretório de estado.
- `--log-lines <count>`: número máximo de linhas de log sanitizadas a incluir (padrão `5000`).
- `--log-bytes <bytes>`: número máximo de bytes de log a inspecionar (padrão `1000000`).
- `--url <url>`: URL WebSocket do Gateway para o snapshot de saúde.
- `--token <token>`: token do Gateway para o snapshot de saúde.
- `--password <password>`: senha do Gateway para o snapshot de saúde.
- `--timeout <ms>`: timeout do snapshot de status/saúde (padrão `3000`).
- `--no-stability-bundle`: ignora a busca por bundle de estabilidade persistido.
- `--json`: imprime como JSON o caminho gravado, o tamanho e o manifesto.

A exportação contém um manifesto, um resumo em Markdown, a forma da configuração, detalhes sanitizados da configuração, resumos sanitizados de logs, snapshots sanitizados de status/saúde do Gateway e o bundle de estabilidade mais recente quando existir.

Ela foi feita para ser compartilhada. Mantém detalhes operacionais que ajudam na depuração, como campos seguros de log do OpenClaw, nomes de subsistemas, códigos de status, durações, modos configurados, portas, IDs de Plugin, IDs de provedor, configurações de recursos não secretas e mensagens operacionais de log com redação. Omite ou redige texto de chat, corpos de Webhook, saídas de ferramenta, credenciais, cookies, identificadores de conta/mensagem, texto de prompt/instrução, nomes de host e valores secretos. Quando uma mensagem no estilo LogTape parece conter texto de carga de usuário/chat/ferramenta, a exportação mantém apenas a informação de que uma mensagem foi omitida e sua contagem de bytes.

### `gateway status`

`gateway status` mostra o serviço Gateway (launchd/systemd/schtasks) mais uma probe opcional de conectividade/capacidade de autenticação.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Opções:

- `--url <url>`: adiciona um alvo explícito de probe. O gateway remoto configurado + localhost ainda são verificados.
- `--token <token>`: autenticação por token para a probe.
- `--password <password>`: autenticação por senha para a probe.
- `--timeout <ms>`: timeout da probe (padrão `10000`).
- `--no-probe`: ignora a probe de conectividade (visão apenas do serviço).
- `--deep`: também varre serviços em nível de sistema.
- `--require-rpc`: eleva a probe padrão de conectividade para uma probe de leitura e sai com código diferente de zero quando essa probe de leitura falha. Não pode ser combinado com `--no-probe`.

Observações:

- `gateway status` continua disponível para diagnósticos mesmo quando a configuração local da CLI está ausente ou inválida.
- O `gateway status` padrão comprova estado do serviço, conexão WebSocket e a capacidade de autenticação visível no momento do handshake. Ele não comprova operações de leitura/escrita/administração.
- `gateway status` resolve SecretRefs de autenticação configurados para autenticação da probe quando possível.
- Se um SecretRef de autenticação necessário não for resolvido neste caminho de comando, `gateway status --json` reporta `rpc.authWarning` quando a conectividade/autenticação da probe falha; passe `--token`/`--password` explicitamente ou resolva primeiro a origem do segredo.
- Se a probe for bem-sucedida, avisos de auth-ref não resolvidos são suprimidos para evitar falsos positivos.
- Use `--require-rpc` em scripts e automações quando um serviço escutando não for suficiente e você também precisar que chamadas RPC com escopo de leitura estejam saudáveis.
- `--deep` adiciona uma varredura com melhor esforço para instalações extras de launchd/systemd/schtasks. Quando vários serviços semelhantes ao gateway são detectados, a saída legível por humanos imprime dicas de limpeza e avisa que a maioria das instalações deve executar um gateway por máquina.
- A saída legível por humanos inclui o caminho resolvido do log em arquivo mais um snapshot dos caminhos/validade de configuração da CLI versus serviço para ajudar a diagnosticar divergência de perfil ou diretório de estado.
- Em instalações Linux com systemd, as verificações de divergência de autenticação do serviço leem tanto valores `Environment=` quanto `EnvironmentFile=` da unit (incluindo `%h`, caminhos entre aspas, vários arquivos e arquivos opcionais `-`).
- As verificações de divergência resolvem SecretRefs de `gateway.auth.token` usando env de runtime mesclado (env do comando de serviço primeiro, depois fallback para env do processo).
- Se a autenticação por token não estiver efetivamente ativa (modo explícito `gateway.auth.mode` como `password`/`none`/`trusted-proxy`, ou modo não definido em que password pode prevalecer e nenhum candidato de token pode prevalecer), as verificações de divergência de token ignoram a resolução do token da configuração.

### `gateway probe`

`gateway probe` é o comando “depurar tudo”. Ele sempre verifica:

- seu gateway remoto configurado (se definido), e
- localhost (local loopback) **mesmo se um remoto estiver configurado**.

Se você passar `--url`, esse alvo explícito é adicionado antes de ambos. A saída legível por humanos rotula os
alvos como:

- `URL (explicit)`
- `Remote (configured)` ou `Remote (configured, inactive)`
- `Local loopback`

Se vários gateways estiverem acessíveis, ele imprime todos. Vários gateways são compatíveis quando você usa perfis/portas isolados (por exemplo, um bot de resgate), mas a maioria das instalações ainda executa um único gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Interpretação:

- `Reachable: yes` significa que pelo menos um alvo aceitou uma conexão WebSocket.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` informa o que a probe conseguiu comprovar sobre a autenticação. Isso é separado da acessibilidade.
- `Read probe: ok` significa que chamadas RPC detalhadas com escopo de leitura (`health`/`status`/`system-presence`/`config.get`) também foram bem-sucedidas.
- `Read probe: limited - missing scope: operator.read` significa que a conexão funcionou, mas o RPC com escopo de leitura está limitado. Isso é reportado como acessibilidade **degradada**, não falha total.
- O código de saída é diferente de zero apenas quando nenhum alvo verificado está acessível.

Observações sobre JSON (`--json`):

- Nível superior:
  - `ok`: pelo menos um alvo está acessível.
  - `degraded`: pelo menos um alvo teve RPC detalhado limitado por escopo.
  - `capability`: melhor capacidade observada entre os alvos acessíveis (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` ou `unknown`).
  - `primaryTargetId`: melhor alvo a ser tratado como vencedor ativo nesta ordem: URL explícita, túnel SSH, remoto configurado e depois local loopback.
  - `warnings[]`: registros de aviso de melhor esforço com `code`, `message` e `targetIds` opcionais.
  - `network`: dicas de URL de local loopback/tailnet derivadas da configuração atual e da rede do host.
  - `discovery.timeoutMs` e `discovery.count`: orçamento/contagem de resultados de descoberta efetivamente usados nesta passagem de probe.
- Por alvo (`targets[].connect`):
  - `ok`: acessibilidade após conexão + classificação degradada.
  - `rpcOk`: sucesso completo do RPC detalhado.
  - `scopeLimited`: o RPC detalhado falhou devido à ausência de escopo de operador.
- Por alvo (`targets[].auth`):
  - `role`: papel de autenticação informado em `hello-ok` quando disponível.
  - `scopes`: escopos concedidos informados em `hello-ok` quando disponíveis.
  - `capability`: a classificação de capacidade de autenticação exposta para esse alvo.

Códigos de aviso comuns:

- `ssh_tunnel_failed`: a configuração do túnel SSH falhou; o comando recorreu a probes diretas.
- `multiple_gateways`: mais de um alvo estava acessível; isso é incomum, a menos que você execute intencionalmente perfis isolados, como um bot de resgate.
- `auth_secretref_unresolved`: um SecretRef de autenticação configurado não pôde ser resolvido para um alvo com falha.
- `probe_scope_limited`: a conexão WebSocket foi bem-sucedida, mas a probe de leitura foi limitada pela ausência de `operator.read`.

#### Remoto via SSH (paridade com o app Mac)

O modo “Remote over SSH” do app macOS usa um encaminhamento de porta local para que o gateway remoto (que pode estar vinculado apenas a loopback) fique acessível em `ws://127.0.0.1:<port>`.

Equivalente na CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Opções:

- `--ssh <target>`: `user@host` ou `user@host:port` (a porta padrão é `22`).
- `--ssh-identity <path>`: arquivo de identidade.
- `--ssh-auto`: escolhe o primeiro host de gateway descoberto como alvo SSH a partir do endpoint de descoberta resolvido (`local.` mais o domínio de longa distância configurado, se houver). Dicas somente em TXT são ignoradas.

Configuração (opcional, usada como padrão):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Auxiliar RPC de baixo nível.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

Opções:

- `--params <json>`: string de objeto JSON para params (padrão `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

Observações:

- `--params` precisa ser um JSON válido.
- `--expect-final` é voltado principalmente para RPCs no estilo de agente que transmitem eventos intermediários antes de uma carga final.

## Gerenciar o serviço Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

Opções de comando:

- `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `gateway uninstall|start|stop|restart`: `--json`

Observações:

- `gateway install` aceita `--port`, `--runtime`, `--token`, `--force`, `--json`.
- Quando a autenticação por token exige um token e `gateway.auth.token` é gerenciado por SecretRef, `gateway install` valida se o SecretRef pode ser resolvido, mas não persiste o token resolvido nos metadados de ambiente do serviço.
- Se a autenticação por token exigir um token e o SecretRef de token configurado não puder ser resolvido, a instalação falha de forma fechada em vez de persistir fallback em texto simples.
- Para autenticação por senha em `gateway run`, prefira `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` ou um `gateway.auth.password` respaldado por SecretRef em vez de `--password` inline.
- No modo de autenticação inferido, `OPENCLAW_GATEWAY_PASSWORD` apenas no shell não flexibiliza os requisitos de token da instalação; use configuração durável (`gateway.auth.password` ou `env` da configuração) ao instalar um serviço gerenciado.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem ambos configurados e `gateway.auth.mode` não estiver definido, a instalação será bloqueada até que o modo seja definido explicitamente.
- Os comandos de ciclo de vida aceitam `--json` para uso em scripts.

## Descobrir gateways (Bonjour)

`gateway discover` faz uma varredura por beacons do Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour de longa distância): escolha um domínio (exemplo: `openclaw.internal.`) e configure split DNS + um servidor DNS; consulte [/gateway/bonjour](/pt-BR/gateway/bonjour)

Somente gateways com descoberta Bonjour ativada (padrão) anunciam o beacon.

Registros de descoberta de longa distância incluem (TXT):

- `role` (dica de papel do gateway)
- `transport` (dica de transporte, por exemplo `gateway`)
- `gatewayPort` (porta WebSocket, geralmente `18789`)
- `sshPort` (opcional; clientes usam `22` como padrão para alvos SSH quando ele está ausente)
- `tailnetDns` (nome de host MagicDNS, quando disponível)
- `gatewayTls` / `gatewayTlsSha256` (TLS ativado + fingerprint do certificado)
- `cliPath` (dica de instalação remota gravada na zona de longa distância)

### `gateway discover`

```bash
openclaw gateway discover
```

Opções:

- `--timeout <ms>`: timeout por comando (browse/resolve); padrão `2000`.
- `--json`: saída legível por máquina (também desativa estilo/spinner).

Exemplos:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Observações:

- A CLI faz varredura em `local.` mais o domínio de longa distância configurado quando houver um ativado.
- `wsUrl` na saída JSON é derivado do endpoint de serviço resolvido, não de dicas somente em TXT como `lanHost` ou `tailnetDns`.
- Em mDNS `local.`, `sshPort` e `cliPath` só são transmitidos quando `discovery.mdns.mode` é `full`. DNS-SD de longa distância ainda grava `cliPath`; `sshPort` continua opcional ali também.

## Relacionado

- [Referência de CLI](/pt-BR/cli)
- [Runbook do Gateway](/pt-BR/gateway)
