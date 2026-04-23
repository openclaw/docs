---
read_when:
    - Executando o Gateway pela CLI (desenvolvimento ou servidores)
    - Depurando autenticação do Gateway, modos de bind e conectividade
    - Descobrindo Gateways via Bonjour (local + DNS-SD de área ampla)
summary: CLI do Gateway OpenClaw (`openclaw gateway`) — executar, consultar e descobrir Gateways
title: gateway
x-i18n:
    generated_at: "2026-04-23T14:00:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9160017a4d1326819f6b4d067bd99aa02ee37689b96c185defedef6200c19cf
    source_path: cli/gateway.md
    workflow: 15
---

# CLI do Gateway

O Gateway é o servidor WebSocket do OpenClaw (canais, Nodes, sessões, hooks).

Os subcomandos nesta página ficam em `openclaw gateway …`.

Documentação relacionada:

- [/gateway/bonjour](/pt-BR/gateway/bonjour)
- [/gateway/discovery](/pt-BR/gateway/discovery)
- [/gateway/configuration](/pt-BR/gateway/configuration)

## Executar o Gateway

Execute um processo local do Gateway:

```bash
openclaw gateway
```

Alias em primeiro plano:

```bash
openclaw gateway run
```

Observações:

- Por padrão, o Gateway se recusa a iniciar a menos que `gateway.mode=local` esteja definido em `~/.openclaw/openclaw.json`. Use `--allow-unconfigured` para execuções ad hoc/de desenvolvimento.
- Espera-se que `openclaw onboard --mode local` e `openclaw setup` gravem `gateway.mode=local`. Se o arquivo existir, mas `gateway.mode` estiver ausente, trate isso como uma configuração quebrada ou sobrescrita e repare-a em vez de presumir implicitamente o modo local.
- Se o arquivo existir e `gateway.mode` estiver ausente, o Gateway trata isso como dano suspeito na configuração e se recusa a “presumir local” para você.
- Fazer bind além do loopback sem autenticação é bloqueado (proteção de segurança).
- `SIGUSR1` dispara uma reinicialização no processo quando autorizado (`commands.restart` fica ativado por padrão; defina `commands.restart: false` para bloquear reinicialização manual, enquanto as ações de ferramenta/configuração `apply/update` do gateway continuam permitidas).
- Handlers de `SIGINT`/`SIGTERM` param o processo do gateway, mas não restauram nenhum estado personalizado do terminal. Se você encapsular a CLI com uma TUI ou entrada em modo raw, restaure o terminal antes de sair.

### Opções

- `--port <port>`: porta do WebSocket (o padrão vem da configuração/env; normalmente `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: modo de bind do listener.
- `--auth <token|password>`: substituição do modo de autenticação.
- `--token <token>`: substituição do token (também define `OPENCLAW_GATEWAY_TOKEN` para o processo).
- `--password <password>`: substituição da senha. Aviso: senhas inline podem ficar expostas em listagens locais de processos.
- `--password-file <path>`: lê a senha do gateway de um arquivo.
- `--tailscale <off|serve|funnel>`: expõe o Gateway via Tailscale.
- `--tailscale-reset-on-exit`: redefine a configuração serve/funnel do Tailscale no encerramento.
- `--allow-unconfigured`: permite iniciar o gateway sem `gateway.mode=local` na configuração. Isso ignora a proteção de inicialização somente para bootstrap ad hoc/de desenvolvimento; não grava nem repara o arquivo de configuração.
- `--dev`: cria uma configuração + workspace de desenvolvimento se estiverem ausentes (ignora `BOOTSTRAP.md`).
- `--reset`: redefine configuração de desenvolvimento + credenciais + sessões + workspace (exige `--dev`).
- `--force`: encerra qualquer listener existente na porta selecionada antes de iniciar.
- `--verbose`: logs detalhados.
- `--cli-backend-logs`: mostra apenas logs de backend da CLI no console (e ativa stdout/stderr).
- `--ws-log <auto|full|compact>`: estilo de log do websocket (padrão `auto`).
- `--compact`: alias para `--ws-log compact`.
- `--raw-stream`: registra eventos brutos de stream do modelo em jsonl.
- `--raw-stream-path <path>`: caminho do jsonl de stream bruto.

Criação de perfil de inicialização:

- Defina `OPENCLAW_GATEWAY_STARTUP_TRACE=1` para registrar tempos por fase durante a inicialização do Gateway.
- Execute `pnpm test:startup:gateway -- --runs 5 --warmup 1` para medir a inicialização do Gateway. O benchmark registra a primeira saída do processo, `/healthz`, `/readyz` e os tempos do trace de inicialização.

## Consultar um Gateway em execução

Todos os comandos de consulta usam RPC sobre WebSocket.

Modos de saída:

- Padrão: legível por humanos (colorido em TTY).
- `--json`: JSON legível por máquina (sem estilo/spinner).
- `--no-color` (ou `NO_COLOR=1`): desativa ANSI mantendo o layout humano.

Opções compartilhadas (onde houver suporte):

- `--url <url>`: URL do WebSocket do Gateway.
- `--token <token>`: token do Gateway.
- `--password <password>`: senha do Gateway.
- `--timeout <ms>`: tempo limite/orçamento (varia por comando).
- `--expect-final`: aguarda uma resposta “final” (chamadas de agente).

Observação: quando você define `--url`, a CLI não usa fallback para credenciais da configuração ou do ambiente.
Passe `--token` ou `--password` explicitamente. A ausência de credenciais explícitas é um erro.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

O endpoint HTTP `/healthz` é uma sonda de vivacidade: ele responde assim que o servidor consegue responder por HTTP. O endpoint HTTP `/readyz` é mais rigoroso e permanece indisponível enquanto sidecars de inicialização, canais ou hooks configurados ainda estão se estabilizando.

### `gateway usage-cost`

Busca resumos de custo de uso nos logs de sessão.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Opções:

- `--days <days>`: número de dias a incluir (padrão `30`).

### `gateway stability`

Busca o registrador recente de estabilidade de diagnóstico de um Gateway em execução.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

Opções:

- `--limit <limit>`: número máximo de eventos recentes a incluir (padrão `25`, máximo `1000`).
- `--type <type>`: filtra por tipo de evento de diagnóstico, como `payload.large` ou `diagnostic.memory.pressure`.
- `--since-seq <seq>`: inclui apenas eventos após um número de sequência de diagnóstico.
- `--bundle [path]`: lê um bundle de estabilidade persistido em vez de chamar o Gateway em execução. Use `--bundle latest` (ou apenas `--bundle`) para o bundle mais recente no diretório de estado, ou passe diretamente um caminho para um JSON de bundle.
- `--export`: grava um zip compartilhável de diagnósticos de suporte em vez de imprimir detalhes de estabilidade.
- `--output <path>`: caminho de saída para `--export`.

Observações:

- Os registros mantêm metadados operacionais: nomes de eventos, contagens, tamanhos em bytes, leituras de memória, estado de fila/sessão, nomes de canal/plugin e resumos de sessão com redação. Eles não mantêm texto de chat, corpos de Webhook, saídas de ferramentas, corpos brutos de requisição ou resposta, tokens, cookies, valores secretos, hostnames nem ids brutos de sessão. Defina `diagnostics.enabled: false` para desativar totalmente o registrador.
- Em saídas fatais do Gateway, timeouts de encerramento e falhas de inicialização de reinício, o OpenClaw grava o mesmo snapshot de diagnóstico em `~/.openclaw/logs/stability/openclaw-stability-*.json` quando o registrador tem eventos. Inspecione o bundle mais recente com `openclaw gateway stability --bundle latest`; `--limit`, `--type` e `--since-seq` também se aplicam à saída de bundle.

### `gateway diagnostics export`

Grava um zip local de diagnósticos projetado para ser anexado a relatórios de bug.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

Opções:

- `--output <path>`: caminho do zip de saída. O padrão é uma exportação de suporte no diretório de estado.
- `--log-lines <count>`: número máximo de linhas de log sanitizadas a incluir (padrão `5000`).
- `--log-bytes <bytes>`: máximo de bytes de log a inspecionar (padrão `1000000`).
- `--url <url>`: URL do WebSocket do Gateway para o snapshot de integridade.
- `--token <token>`: token do Gateway para o snapshot de integridade.
- `--password <password>`: senha do Gateway para o snapshot de integridade.
- `--timeout <ms>`: tempo limite do snapshot de status/integridade (padrão `3000`).
- `--no-stability-bundle`: ignora a busca por bundle de estabilidade persistido.
- `--json`: imprime o caminho gravado, tamanho e manifesto como JSON.

A exportação contém um manifesto, um resumo em Markdown, forma da configuração, detalhes de configuração sanitizados, resumos de log sanitizados, snapshots sanitizados de status/integridade do Gateway e o bundle de estabilidade mais recente quando existir.

Ela foi feita para ser compartilhada. Mantém detalhes operacionais que ajudam na depuração, como campos seguros de log do OpenClaw, nomes de subsistemas, códigos de status, durações, modos configurados, portas, ids de plugins, ids de provedores, configurações de recursos não secretas e mensagens de log operacionais com redação. Omite ou redige texto de chat, corpos de Webhook, saídas de ferramentas, credenciais, cookies, identificadores de conta/mensagem, texto de prompt/instrução, hostnames e valores secretos. Quando uma mensagem no estilo LogTape parece conter texto de carga útil de usuário/chat/ferramenta, a exportação mantém apenas que uma mensagem foi omitida e sua contagem de bytes.

### `gateway status`

`gateway status` mostra o serviço do Gateway (launchd/systemd/schtasks) mais uma sonda opcional de conectividade/capacidade de autenticação.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Opções:

- `--url <url>`: adiciona um destino de sonda explícito. O remoto configurado + localhost ainda são sondados.
- `--token <token>`: autenticação por token para a sonda.
- `--password <password>`: autenticação por senha para a sonda.
- `--timeout <ms>`: tempo limite da sonda (padrão `10000`).
- `--no-probe`: ignora a sonda de conectividade (visualização somente do serviço).
- `--deep`: varre também serviços em nível de sistema.
- `--require-rpc`: eleva a sonda padrão de conectividade para uma sonda de leitura e sai com código diferente de zero quando essa sonda de leitura falha. Não pode ser combinado com `--no-probe`.

Observações:

- `gateway status` permanece disponível para diagnósticos mesmo quando a configuração local da CLI está ausente ou inválida.
- `gateway status` padrão comprova o estado do serviço, conexão WebSocket e a capacidade de autenticação visível no momento do handshake. Ele não comprova operações de leitura/escrita/administração.
- `gateway status` resolve SecretRefs de autenticação configurados para autenticação da sonda quando possível.
- Se um SecretRef de autenticação obrigatório não puder ser resolvido nesse caminho de comando, `gateway status --json` relata `rpc.authWarning` quando a conectividade/autenticação da sonda falhar; passe `--token`/`--password` explicitamente ou resolva a fonte do segredo primeiro.
- Se a sonda for bem-sucedida, avisos de auth-ref não resolvidos são suprimidos para evitar falsos positivos.
- Use `--require-rpc` em scripts e automações quando um serviço escutando não for suficiente e você também precisar que chamadas RPC de escopo de leitura estejam saudáveis.
- `--deep` adiciona uma varredura best-effort por instalações extras em launchd/systemd/schtasks. Quando vários serviços do tipo gateway são detectados, a saída humana imprime dicas de limpeza e avisa que a maioria das instalações deve executar um gateway por máquina.
- A saída humana inclui o caminho resolvido do log em arquivo mais um snapshot dos caminhos/validade de configuração CLI-vs-serviço para ajudar a diagnosticar desvio de perfil ou diretório de estado.
- Em instalações Linux com systemd, as verificações de desvio de autenticação do serviço leem valores `Environment=` e `EnvironmentFile=` da unit (incluindo `%h`, caminhos entre aspas, vários arquivos e arquivos opcionais com `-`).
- As verificações de desvio resolvem SecretRefs de `gateway.auth.token` usando env mesclado de runtime (env do comando de serviço primeiro, depois fallback para env do processo).
- Se a autenticação por token não estiver efetivamente ativa (modo explícito `gateway.auth.mode` como `password`/`none`/`trusted-proxy`, ou modo não definido em que a senha pode vencer e nenhum candidato a token pode vencer), as verificações de desvio de token ignoram a resolução do token de configuração.

### `gateway probe`

`gateway probe` é o comando “depure tudo”. Ele sempre sonda:

- seu gateway remoto configurado (se estiver definido), e
- localhost (loopback) **mesmo se remoto estiver configurado**.

Se você passar `--url`, esse destino explícito é adicionado antes de ambos. A saída humana rotula os
destinos como:

- `URL (explícita)`
- `Remote (configured)` ou `Remote (configured, inactive)`
- `local loopback`

Se vários Gateways estiverem acessíveis, ele imprime todos. Vários Gateways são compatíveis quando você usa perfis/portas isolados (por exemplo, um bot de resgate), mas a maioria das instalações ainda executa um único gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Interpretação:

- `Reachable: yes` significa que pelo menos um destino aceitou uma conexão WebSocket.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` informa o que a sonda conseguiu comprovar sobre a autenticação. Isso é separado da acessibilidade.
- `Read probe: ok` significa que chamadas RPC detalhadas de escopo de leitura (`health`/`status`/`system-presence`/`config.get`) também foram bem-sucedidas.
- `Read probe: limited - missing scope: operator.read` significa que a conexão foi bem-sucedida, mas o RPC de escopo de leitura está limitado. Isso é relatado como acessibilidade **degradada**, não falha total.
- O código de saída é diferente de zero apenas quando nenhum destino sondado está acessível.

Observações sobre JSON (`--json`):

- Nível superior:
  - `ok`: pelo menos um destino está acessível.
  - `degraded`: pelo menos um destino teve RPC detalhado limitado por escopo.
  - `capability`: melhor capacidade observada entre os destinos acessíveis (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` ou `unknown`).
  - `primaryTargetId`: melhor destino a ser tratado como vencedor ativo nesta ordem: URL explícita, túnel SSH, remoto configurado e depois local loopback.
  - `warnings[]`: registros de aviso best-effort com `code`, `message` e `targetIds` opcionais.
  - `network`: dicas de URL de local loopback/tailnet derivadas da configuração atual e da rede do host.
  - `discovery.timeoutMs` e `discovery.count`: o orçamento/contagem de resultados de descoberta efetivamente usado nesta passagem de sondagem.
- Por destino (`targets[].connect`):
  - `ok`: acessibilidade após conexão + classificação degradada.
  - `rpcOk`: sucesso completo do RPC detalhado.
  - `scopeLimited`: o RPC detalhado falhou devido à ausência do escopo de operador.
- Por destino (`targets[].auth`):
  - `role`: função de autenticação informada em `hello-ok`, quando disponível.
  - `scopes`: escopos concedidos informados em `hello-ok`, quando disponíveis.
  - `capability`: a classificação de capacidade de autenticação exposta para esse destino.

Códigos de aviso comuns:

- `ssh_tunnel_failed`: a configuração do túnel SSH falhou; o comando usou fallback para sondagens diretas.
- `multiple_gateways`: mais de um destino estava acessível; isso é incomum, a menos que você execute intencionalmente perfis isolados, como um bot de resgate.
- `auth_secretref_unresolved`: não foi possível resolver um SecretRef de autenticação configurado para um destino com falha.
- `probe_scope_limited`: a conexão WebSocket foi bem-sucedida, mas a sonda de leitura foi limitada pela ausência de `operator.read`.

#### Remoto por SSH (paridade com app Mac)

O modo “Remote over SSH” do app macOS usa um encaminhamento de porta local para que o gateway remoto (que pode estar vinculado apenas ao loopback) fique acessível em `ws://127.0.0.1:<port>`.

Equivalente na CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Opções:

- `--ssh <target>`: `user@host` ou `user@host:port` (a porta padrão é `22`).
- `--ssh-identity <path>`: arquivo de identidade.
- `--ssh-auto`: escolhe o primeiro host de gateway descoberto como destino SSH a partir do endpoint de descoberta resolvido (`local.` mais o domínio de área ampla configurado, se houver). Dicas somente-TXT são ignoradas.

Configuração (opcional, usada como padrão):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Helper de RPC de baixo nível.

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
- `--expect-final` serve principalmente para RPCs no estilo de agente que transmitem eventos intermediários antes de uma carga final.

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

- `gateway install` oferece suporte a `--port`, `--runtime`, `--token`, `--force`, `--json`.
- Quando a autenticação por token exige um token e `gateway.auth.token` é gerenciado por SecretRef, `gateway install` valida que o SecretRef pode ser resolvido, mas não persiste o token resolvido nos metadados de ambiente do serviço.
- Se a autenticação por token exigir um token e o SecretRef de token configurado não puder ser resolvido, a instalação falha de forma fechada em vez de persistir fallback em texto simples.
- Para autenticação por senha em `gateway run`, prefira `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` ou um `gateway.auth.password` respaldado por SecretRef em vez de `--password` inline.
- No modo de autenticação inferido, `OPENCLAW_GATEWAY_PASSWORD` apenas no shell não relaxa os requisitos de token da instalação; use configuração durável (`gateway.auth.password` ou `env` na configuração) ao instalar um serviço gerenciado.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem ambos configurados e `gateway.auth.mode` não estiver definido, a instalação será bloqueada até que o modo seja definido explicitamente.
- Comandos de ciclo de vida aceitam `--json` para scripting.

## Descobrir Gateways (Bonjour)

`gateway discover` faz varredura por beacons de Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour de área ampla): escolha um domínio (exemplo: `openclaw.internal.`) e configure split DNS + um servidor DNS; veja [/gateway/bonjour](/pt-BR/gateway/bonjour)

Somente Gateways com descoberta Bonjour ativada (padrão) anunciam o beacon.

Registros de descoberta de área ampla incluem (TXT):

- `role` (dica de função do gateway)
- `transport` (dica de transporte, por exemplo `gateway`)
- `gatewayPort` (porta do WebSocket, geralmente `18789`)
- `sshPort` (opcional; clientes usam `22` como padrão para destinos SSH quando estiver ausente)
- `tailnetDns` (hostname MagicDNS, quando disponível)
- `gatewayTls` / `gatewayTlsSha256` (TLS ativado + impressão digital do certificado)
- `cliPath` (dica de instalação remota gravada na zona de área ampla)

### `gateway discover`

```bash
openclaw gateway discover
```

Opções:

- `--timeout <ms>`: tempo limite por comando (browse/resolve); padrão `2000`.
- `--json`: saída legível por máquina (também desativa estilo/spinner).

Exemplos:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Observações:

- A CLI examina `local.` mais o domínio de área ampla configurado quando um estiver ativado.
- `wsUrl` na saída JSON é derivado do endpoint de serviço resolvido, não de dicas somente-TXT
  como `lanHost` ou `tailnetDns`.
- Em mDNS `local.`, `sshPort` e `cliPath` só são anunciados quando
  `discovery.mdns.mode` é `full`. O DNS-SD de área ampla ainda grava `cliPath`; `sshPort`
  continua opcional ali também.
