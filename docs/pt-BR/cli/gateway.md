---
read_when:
    - Executando o Gateway pela CLI (desenvolvimento ou servidores)
    - Depurando autenticação, modos de bind e conectividade
    - Descobrindo gateways via Bonjour (DNS-SD local + wide-area)
sidebarTitle: Gateway
summary: CLI do Gateway do OpenClaw (`openclaw gateway`) — executar, consultar e descobrir gateways
title: Gateway
x-i18n:
    generated_at: "2026-04-26T11:25:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8cdca95676f0b098e2dd79ff4245a32eaae82711ed6c2b7e39522331872cfd9
    source_path: cli/gateway.md
    workflow: 15
---

O Gateway é o servidor WebSocket do OpenClaw (canais, nodes, sessões, hooks). Os subcomandos desta página ficam em `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Descoberta Bonjour" href="/pt-BR/gateway/bonjour">
    Configuração de mDNS local + DNS-SD wide-area.
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
    - Por padrão, o Gateway se recusa a iniciar a menos que `gateway.mode=local` esteja definido em `~/.openclaw/openclaw.json`. Use `--allow-unconfigured` para execuções ad hoc/de desenvolvimento.
    - Espera-se que `openclaw onboard --mode local` e `openclaw setup` gravem `gateway.mode=local`. Se o arquivo existir mas `gateway.mode` estiver ausente, trate isso como uma configuração corrompida ou sobrescrita e repare-a, em vez de presumir implicitamente o modo local.
    - Se o arquivo existir e `gateway.mode` estiver ausente, o Gateway trata isso como dano suspeito na configuração e se recusa a “presumir local” para você.
    - Bind além de loopback sem autenticação é bloqueado (barreira de segurança).
    - `SIGUSR1` aciona uma reinicialização no processo quando autorizado (`commands.restart` vem ativado por padrão; defina `commands.restart: false` para bloquear reinicialização manual, enquanto apply/update da ferramenta/configuração do gateway continuam permitidos).
    - Handlers de `SIGINT`/`SIGTERM` param o processo do gateway, mas não restauram qualquer estado personalizado do terminal. Se você encapsular a CLI com uma TUI ou entrada em modo raw, restaure o terminal antes de sair.
  </Accordion>
</AccordionGroup>

### Opções

<ParamField path="--port <port>" type="number">
  Porta do WebSocket (o padrão vem da configuração/env; normalmente `18789`).
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
  Lê a senha do gateway de um arquivo.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Expõe o Gateway via Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Redefine a configuração de serve/funnel do Tailscale ao encerrar.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Permite iniciar o gateway sem `gateway.mode=local` na configuração. Ignora a proteção de inicialização somente para bootstrap ad hoc/de desenvolvimento; não grava nem repara o arquivo de configuração.
</ParamField>
<ParamField path="--dev" type="boolean">
  Cria uma configuração + workspace de desenvolvimento se estiver ausente (ignora `BOOTSTRAP.md`).
</ParamField>
<ParamField path="--reset" type="boolean">
  Redefine configuração de desenvolvimento + credenciais + sessões + workspace (requer `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Encerra qualquer listener existente na porta selecionada antes de iniciar.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Logs detalhados.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Mostra apenas logs do backend da CLI no console (e ativa stdout/stderr).
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
  Caminho do jsonl do stream bruto.
</ParamField>

<Warning>
`--password` inline pode ficar exposto em listagens locais de processos. Prefira `--password-file`, env ou `gateway.auth.password` com suporte a SecretRef.
</Warning>

### Criação de perfil de inicialização

- Defina `OPENCLAW_GATEWAY_STARTUP_TRACE=1` para registrar tempos das fases durante a inicialização do Gateway.
- Execute `pnpm test:startup:gateway -- --runs 5 --warmup 1` para fazer benchmark da inicialização do Gateway. O benchmark registra a primeira saída do processo, `/healthz`, `/readyz` e os tempos do rastreamento de inicialização.

## Consultar um Gateway em execução

Todos os comandos de consulta usam RPC por WebSocket.

<Tabs>
  <Tab title="Modos de saída">
    - Padrão: legível para humanos (colorido em TTY).
    - `--json`: JSON legível por máquina (sem estilo/spinner).
    - `--no-color` (ou `NO_COLOR=1`): desativa ANSI, mantendo o layout humano.
  </Tab>
  <Tab title="Opções compartilhadas">
    - `--url <url>`: URL WebSocket do Gateway.
    - `--token <token>`: token do Gateway.
    - `--password <password>`: senha do Gateway.
    - `--timeout <ms>`: timeout/orçamento (varia por comando).
    - `--expect-final`: aguarda uma resposta “final” (chamadas de agente).
  </Tab>
</Tabs>

<Note>
Quando você define `--url`, a CLI não usa credenciais da configuração nem do ambiente como fallback. Passe `--token` ou `--password` explicitamente. A ausência de credenciais explícitas é um erro.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

O endpoint HTTP `/healthz` é uma sonda de vivacidade: ele retorna assim que o servidor consegue responder a HTTP. O endpoint HTTP `/readyz` é mais rigoroso e permanece indisponível enquanto sidecars de inicialização, canais ou hooks configurados ainda estiverem estabilizando.

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

Busca o registrador de estabilidade diagnóstica recente de um Gateway em execução.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Número máximo de eventos recentes a incluir (máximo `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filtra por tipo de evento diagnóstico, como `payload.large` ou `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Inclui apenas eventos após um número de sequência diagnóstica.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lê um bundle de estabilidade persistido em vez de chamar o Gateway em execução. Use `--bundle latest` (ou apenas `--bundle`) para o bundle mais recente no diretório de estado, ou passe diretamente um caminho de JSON do bundle.
</ParamField>
<ParamField path="--export" type="boolean">
  Grava um zip compartilhável de diagnósticos de suporte em vez de imprimir os detalhes de estabilidade.
</ParamField>
<ParamField path="--output <path>" type="string">
  Caminho de saída para `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacidade e comportamento do bundle">
    - Os registros mantêm metadados operacionais: nomes de eventos, contagens, tamanhos em bytes, leituras de memória, estado de fila/sessão, nomes de canal/Plugin e resumos de sessão com dados redigidos. Eles não mantêm texto de chat, corpos de Webhook, saídas de ferramentas, corpos brutos de requisição ou resposta, tokens, cookies, valores secretos, nomes de host ou ids brutos de sessão. Defina `diagnostics.enabled: false` para desativar completamente o registrador.
    - Em saídas fatais do Gateway, timeouts de encerramento e falhas de inicialização após reinício, o OpenClaw grava o mesmo snapshot diagnóstico em `~/.openclaw/logs/stability/openclaw-stability-*.json` quando o registrador tiver eventos. Inspecione o bundle mais recente com `openclaw gateway stability --bundle latest`; `--limit`, `--type` e `--since-seq` também se aplicam à saída do bundle.
  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Grava um zip local de diagnósticos projetado para ser anexado a relatórios de bugs. Para o modelo de privacidade e o conteúdo do bundle, consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Caminho do zip de saída. O padrão é uma exportação de suporte no diretório de estado.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Número máximo de linhas de log sanitizadas a incluir.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Número máximo de bytes de log a inspecionar.
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
  Ignora a busca por bundle de estabilidade persistido.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprime o caminho gravado, tamanho e manifesto como JSON.
</ParamField>

A exportação contém um manifesto, um resumo em Markdown, formato de configuração, detalhes sanitizados da configuração, resumos sanitizados de logs, snapshots sanitizados de status/saúde do Gateway e o bundle de estabilidade mais recente quando existir.

Ela foi feita para ser compartilhada. Mantém detalhes operacionais que ajudam na depuração, como campos seguros de log do OpenClaw, nomes de subsistemas, códigos de status, durações, modos configurados, portas, ids de Plugin, ids de provider, configurações de recursos não secretos e mensagens operacionais de log com dados redigidos. Omite ou redige texto de chat, corpos de Webhook, saídas de ferramentas, credenciais, cookies, identificadores de conta/mensagem, texto de prompt/instrução, nomes de host e valores secretos. Quando uma mensagem no estilo LogTape parece texto de payload de usuário/chat/ferramenta, a exportação mantém apenas que uma mensagem foi omitida e sua contagem de bytes.

### `gateway status`

`gateway status` mostra o serviço Gateway (launchd/systemd/schtasks) mais uma sonda opcional de conectividade/capacidade de autenticação.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Adiciona um alvo explícito de sonda. O remoto configurado + localhost ainda são sondados.
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
  Ignora a sonda de conectividade (visão apenas do serviço).
</ParamField>
<ParamField path="--deep" type="boolean">
  Examina também serviços no nível do sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Eleva a sonda padrão de conectividade para uma sonda de leitura e sai com código diferente de zero quando essa sonda de leitura falha. Não pode ser combinada com `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semântica de status">
    - `gateway status` continua disponível para diagnósticos mesmo quando a configuração local da CLI está ausente ou inválida.
    - O `gateway status` padrão comprova o estado do serviço, a conexão WebSocket e a capacidade de autenticação visível no momento do handshake. Ele não comprova operações de leitura/gravação/administração.
    - Sondas de diagnóstico não alteram o estado para autenticação de dispositivo pela primeira vez: elas reutilizam um token de dispositivo em cache quando existir, mas não criam uma nova identidade de dispositivo da CLI nem um registro de pareamento de dispositivo somente leitura apenas para verificar o status.
    - `gateway status` resolve SecretRefs de autenticação configurados para autenticação da sonda quando possível.
    - Se um SecretRef de autenticação obrigatório não for resolvido neste caminho de comando, `gateway status --json` relata `rpc.authWarning` quando a conectividade/autenticação da sonda falha; passe `--token`/`--password` explicitamente ou resolva primeiro a origem do segredo.
    - Se a sonda for bem-sucedida, avisos de auth-ref não resolvidos são suprimidos para evitar falsos positivos.
    - Use `--require-rpc` em scripts e automação quando um serviço em escuta não for suficiente e você também precisar que chamadas RPC com escopo de leitura estejam saudáveis.
    - `--deep` adiciona uma varredura em melhor esforço para instalações adicionais de launchd/systemd/schtasks. Quando vários serviços parecidos com gateway são detectados, a saída legível para humanos imprime dicas de limpeza e avisa que a maioria das configurações deve executar um gateway por máquina.
    - A saída legível para humanos inclui o caminho resolvido do arquivo de log mais o snapshot dos caminhos/validade da configuração da CLI versus do serviço para ajudar a diagnosticar divergência de perfil ou state-dir.
  </Accordion>
  <Accordion title="Verificações de desvio de autenticação do systemd no Linux">
    - Em instalações Linux com systemd, as verificações de desvio de autenticação do serviço leem valores `Environment=` e `EnvironmentFile=` da unit (incluindo `%h`, caminhos entre aspas, múltiplos arquivos e arquivos opcionais com `-`).
    - As verificações de desvio resolvem SecretRefs de `gateway.auth.token` usando o env de runtime mesclado (env do comando do serviço primeiro, depois fallback para env do processo).
    - Se a autenticação por token não estiver efetivamente ativa (modo explícito `gateway.auth.mode` igual a `password`/`none`/`trusted-proxy`, ou modo não definido em que senha pode prevalecer e nenhum candidato a token pode prevalecer), as verificações de desvio de token ignoram a resolução do token de configuração.
  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` é o comando “depure tudo”. Ele sempre sonda:

- seu gateway remoto configurado (se definido), e
- localhost (loopback) **mesmo se o remoto estiver configurado**.

Se você passar `--url`, esse alvo explícito é adicionado antes de ambos. A saída legível para humanos rotula os alvos como:

- `URL (explicit)`
- `Remote (configured)` ou `Remote (configured, inactive)`
- `Local loopback`

<Note>
Se vários gateways estiverem acessíveis, ele imprimirá todos eles. Vários gateways são compatíveis quando você usa perfis/portas isolados (por exemplo, um bot de resgate), mas a maioria das instalações ainda executa um único gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretação">
    - `Reachable: yes` significa que pelo menos um alvo aceitou uma conexão WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` relata o que a sonda conseguiu comprovar sobre a autenticação. Isso é separado da acessibilidade.
    - `Read probe: ok` significa que chamadas RPC detalhadas com escopo de leitura (`health`/`status`/`system-presence`/`config.get`) também foram bem-sucedidas.
    - `Read probe: limited - missing scope: operator.read` significa que a conexão foi bem-sucedida, mas o RPC com escopo de leitura está limitado. Isso é relatado como acessibilidade **degradada**, não como falha total.
    - Assim como `gateway status`, a sonda reutiliza autenticação de dispositivo em cache existente, mas não cria identidade de dispositivo nem estado de pareamento na primeira vez.
    - O código de saída é diferente de zero apenas quando nenhum alvo sondado está acessível.
  </Accordion>
  <Accordion title="Saída JSON">
    Nível superior:

    - `ok`: pelo menos um alvo está acessível.
    - `degraded`: pelo menos um alvo teve RPC detalhado limitado por escopo.
    - `capability`: melhor capacidade observada entre os alvos acessíveis (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` ou `unknown`).
    - `primaryTargetId`: melhor alvo a tratar como vencedor ativo nesta ordem: URL explícita, túnel SSH, remoto configurado e, por fim, loopback local.
    - `warnings[]`: registros de aviso em melhor esforço com `code`, `message` e `targetIds` opcionais.
    - `network`: dicas de URL de loopback local/tailnet derivadas da configuração atual e da rede do host.
    - `discovery.timeoutMs` e `discovery.count`: orçamento/contagem de resultados efetivamente usados nesta passagem da sonda.

    Por alvo (`targets[].connect`):

    - `ok`: acessibilidade após conexão + classificação degradada.
    - `rpcOk`: sucesso completo do RPC detalhado.
    - `scopeLimited`: o RPC detalhado falhou devido à falta de escopo de operador.

    Por alvo (`targets[].auth`):

    - `role`: função de autenticação relatada em `hello-ok` quando disponível.
    - `scopes`: escopos concedidos relatados em `hello-ok` quando disponíveis.
    - `capability`: a classificação de capacidade de autenticação exposta para aquele alvo.

  </Accordion>
  <Accordion title="Códigos de aviso comuns">
    - `ssh_tunnel_failed`: a configuração do túnel SSH falhou; o comando recorreu a sondas diretas.
    - `multiple_gateways`: mais de um alvo estava acessível; isso é incomum, a menos que você execute intencionalmente perfis isolados, como um bot de resgate.
    - `auth_secretref_unresolved`: um SecretRef de autenticação configurado não pôde ser resolvido para um alvo que falhou.
    - `probe_scope_limited`: a conexão WebSocket foi bem-sucedida, mas a sonda de leitura ficou limitada pela falta de `operator.read`.
  </Accordion>
</AccordionGroup>

#### Remoto por SSH (paridade com o app Mac)

O modo “Remote over SSH” do app macOS usa um encaminhamento de porta local para que o gateway remoto (que pode estar vinculado apenas a loopback) fique acessível em `ws://127.0.0.1:<port>`.

Equivalente na CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` ou `user@host:port` (a porta tem padrão `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Arquivo de identidade.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Escolhe o primeiro host de gateway descoberto como alvo SSH a partir do endpoint de descoberta resolvido (`local.` mais o domínio wide-area configurado, se houver). Dicas somente TXT são ignoradas.
</ParamField>

Configuração (opcional, usada como padrão):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Helper RPC de baixo nível.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  String de objeto JSON para os parâmetros.
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
  Orçamento de timeout.
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

## Gerenciar o serviço Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

<AccordionGroup>
  <Accordion title="Opções de comando">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`
  </Accordion>
  <Accordion title="Observações sobre instalação e ciclo de vida do serviço">
    - `gateway install` oferece suporte a `--port`, `--runtime`, `--token`, `--force`, `--json`.
    - Use `gateway restart` para reiniciar um serviço gerenciado. Não encadeie `gateway stop` e `gateway start` como substituto de reinicialização; no macOS, `gateway stop` desativa intencionalmente o LaunchAgent antes de pará-lo.
    - Quando a autenticação por token exige um token e `gateway.auth.token` é gerenciado por SecretRef, `gateway install` valida se o SecretRef é resolvível, mas não persiste o token resolvido nos metadados de ambiente do serviço.
    - Se a autenticação por token exigir um token e o SecretRef do token configurado não for resolvido, a instalação falha de forma segura em vez de persistir fallback em texto simples.
    - Para autenticação por senha em `gateway run`, prefira `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` ou `gateway.auth.password` com suporte a SecretRef em vez de `--password` inline.
    - No modo de autenticação inferido, `OPENCLAW_GATEWAY_PASSWORD` apenas no shell não flexibiliza os requisitos de token de instalação; use configuração durável (`gateway.auth.password` ou `env` de configuração) ao instalar um serviço gerenciado.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem ambos configurados e `gateway.auth.mode` não estiver definido, a instalação será bloqueada até que o modo seja definido explicitamente.
    - Comandos de ciclo de vida aceitam `--json` para scripting.
  </Accordion>
</AccordionGroup>

## Descobrir gateways (Bonjour)

`gateway discover` procura beacons do Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Wide-Area Bonjour): escolha um domínio (exemplo: `openclaw.internal.`) e configure split DNS + um servidor DNS; consulte [Bonjour](/pt-BR/gateway/bonjour).

Apenas gateways com descoberta Bonjour ativada (padrão) anunciam o beacon.

Registros de descoberta wide-area incluem (TXT):

- `role` (dica de função do gateway)
- `transport` (dica de transporte, por exemplo `gateway`)
- `gatewayPort` (porta do WebSocket, normalmente `18789`)
- `sshPort` (opcional; clientes usam `22` como padrão para alvos SSH quando ele está ausente)
- `tailnetDns` (hostname MagicDNS, quando disponível)
- `gatewayTls` / `gatewayTlsSha256` (TLS ativado + fingerprint do certificado)
- `cliPath` (dica de instalação remota gravada na zona wide-area)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Timeout por comando (browse/resolve).
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
- A CLI procura em `local.` mais o domínio wide-area configurado quando houver um ativado.
- `wsUrl` na saída JSON é derivado do endpoint de serviço resolvido, não de dicas somente TXT como `lanHost` ou `tailnetDns`.
- Em mDNS `local.`, `sshPort` e `cliPath` só são anunciados quando `discovery.mdns.mode` é `full`. O DNS-SD wide-area ainda grava `cliPath`; `sshPort` continua opcional ali também.
</Note>

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Guia operacional do Gateway](/pt-BR/gateway)
