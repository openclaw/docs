---
read_when:
    - Executando o Gateway pela CLI (desenvolvimento ou servidores)
    - Depuração da autenticação do Gateway, dos modos de vinculação e da conectividade
    - Descobrindo Gateways via Bonjour (DNS-SD local + de área ampla)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — executar, consultar e descobrir gateways
title: Gateway
x-i18n:
    generated_at: "2026-05-11T20:26:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 774753c844909d1ec9257f2035b10c2561432ec2161351e9a6438cd12f7f2ecc
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
    Chaves de configuração de gateway de nível superior.
  </Card>
</CardGroup>

## Execute o Gateway

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
    - Espera-se que `openclaw onboard --mode local` e `openclaw setup` gravem `gateway.mode=local`. Se o arquivo existir, mas `gateway.mode` estiver ausente, trate isso como uma configuração quebrada ou sobrescrita e repare-a, em vez de assumir implicitamente o modo local.
    - Se o arquivo existir e `gateway.mode` estiver ausente, o Gateway trata isso como dano suspeito na configuração e se recusa a "adivinhar local" para você.
    - A vinculação além de loopback sem autenticação é bloqueada (proteção de segurança).
    - `SIGUSR1` aciona uma reinicialização em processo quando autorizada (`commands.restart` é habilitado por padrão; defina `commands.restart: false` para bloquear reinicialização manual, enquanto aplicação/atualização via ferramenta/configuração do gateway continua permitida).
    - Os handlers de `SIGINT`/`SIGTERM` param o processo do gateway, mas não restauram nenhum estado de terminal personalizado. Se você encapsular a CLI com uma TUI ou entrada em modo bruto, restaure o terminal antes de sair.

  </Accordion>
</AccordionGroup>

### Opções

<ParamField path="--port <port>" type="number">
  Porta WebSocket (o padrão vem da configuração/env; normalmente `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Modo de vinculação do listener.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Sobrescrita do modo de autenticação.
</ParamField>
<ParamField path="--token <token>" type="string">
  Sobrescrita de token (também define `OPENCLAW_GATEWAY_TOKEN` para o processo).
</ParamField>
<ParamField path="--password <password>" type="string">
  Sobrescrita de senha.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Leia a senha do gateway a partir de um arquivo.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Exponha o Gateway via Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Redefina a configuração serve/funnel do Tailscale no desligamento.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Permita iniciar o gateway sem `gateway.mode=local` na configuração. Ignora a proteção de inicialização apenas para bootstrap ad-hoc/de desenvolvimento; não grava nem repara o arquivo de configuração.
</ParamField>
<ParamField path="--dev" type="boolean">
  Crie uma configuração + workspace de desenvolvimento se estiverem ausentes (ignora BOOTSTRAP.md).
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
  Estilo de log WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias para `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Registre eventos brutos do fluxo do modelo em jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Caminho jsonl do fluxo bruto.
</ParamField>

## Reinicie o Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` pede ao Gateway em execução que faça uma pré-verificação do trabalho ativo do OpenClaw antes de reiniciar. Se operações em fila, entrega de respostas, execuções incorporadas ou execuções de tarefas estiverem ativas, o Gateway relata os bloqueadores, agrupa solicitações duplicadas de reinicialização segura e reinicia quando o trabalho ativo esvaziar. `restart` simples mantém o comportamento existente do gerenciador de serviço por compatibilidade. Use `--force` apenas quando você quiser explicitamente o caminho de sobrescrita imediata.

`openclaw gateway restart --safe --skip-deferral` executa a mesma reinicialização coordenada ciente do OpenClaw que `--safe`, mas ignora a barreira de adiamento por trabalho ativo para que o Gateway emita a reinicialização imediatamente mesmo quando bloqueadores forem relatados. Use-o como a saída operacional quando um adiamento tiver ficado preso por uma execução de tarefa travada e apenas `--safe` aguardaria indefinidamente. `--skip-deferral` requer `--safe`.

<Warning>
`--password` inline pode ser exposto em listagens de processos locais. Prefira `--password-file`, env ou um `gateway.auth.password` baseado em SecretRef.
</Warning>

### Perfilamento da inicialização

- Defina `OPENCLAW_GATEWAY_STARTUP_TRACE=1` para registrar tempos de fase durante a inicialização do Gateway, incluindo atraso `eventLoopMax` por fase e tempos de tabela de consulta de Plugin para índice instalado, registro de manifesto, planejamento de inicialização e trabalho de mapa de proprietários.
- Defina `OPENCLAW_DIAGNOSTICS=timeline` com `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` para gravar uma linha do tempo de diagnósticos de inicialização JSONL de melhor esforço para harnesses externos de QA. Você também pode habilitar a flag com `diagnostics.flags: ["timeline"]` na configuração; o caminho ainda é fornecido por env. Adicione `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` para incluir amostras do event loop.
- Execute `pnpm test:startup:gateway -- --runs 5 --warmup 1` para benchmark da inicialização do Gateway. O benchmark registra a primeira saída do processo, `/healthz`, `/readyz`, tempos de trace de inicialização, atraso do event loop e detalhes de tempo da tabela de consulta de Plugin.

## Consulte um Gateway em execução

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

O endpoint HTTP `/healthz` é uma sonda de vivacidade: ele retorna assim que o servidor consegue responder HTTP. O endpoint HTTP `/readyz` é mais rigoroso e permanece vermelho enquanto sidecars de Plugin de inicialização, canais ou hooks configurados ainda estão estabilizando. Respostas detalhadas de prontidão locais ou autenticadas incluem um bloco de diagnóstico `eventLoop` com atraso do event loop, utilização do event loop, proporção de núcleos de CPU e uma flag `degraded`.

### `gateway usage-cost`

Busque resumos de custo de uso nos logs de sessão.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Número de dias a incluir.
</ParamField>

### `gateway stability`

Busque o registrador recente de estabilidade diagnóstica de um Gateway em execução.

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
  Filtre por tipo de evento diagnóstico, como `payload.large` ou `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Inclua apenas eventos após um número de sequência diagnóstica.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Leia um pacote de estabilidade persistido em vez de chamar o Gateway em execução. Use `--bundle latest` (ou apenas `--bundle`) para o pacote mais recente no diretório de estado, ou passe diretamente um caminho JSON de pacote.
</ParamField>
<ParamField path="--export" type="boolean">
  Grave um zip compartilhável de diagnósticos de suporte em vez de imprimir detalhes de estabilidade.
</ParamField>
<ParamField path="--output <path>" type="string">
  Caminho de saída para `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacidade e comportamento de pacotes">
    - Os registros mantêm metadados operacionais: nomes de eventos, contagens, tamanhos em bytes, leituras de memória, estado de fila/sessão, nomes de canais/Plugins e resumos de sessão com redação. Eles não mantêm texto de chat, corpos de webhook, saídas de ferramentas, corpos brutos de solicitação ou resposta, tokens, cookies, valores secretos, nomes de host nem ids brutos de sessão. Defina `diagnostics.enabled: false` para desabilitar totalmente o registrador.
    - Em saídas fatais do Gateway, timeouts de desligamento e falhas de inicialização após reinicialização, o OpenClaw grava o mesmo snapshot diagnóstico em `~/.openclaw/logs/stability/openclaw-stability-*.json` quando o registrador tem eventos. Inspecione o pacote mais recente com `openclaw gateway stability --bundle latest`; `--limit`, `--type` e `--since-seq` também se aplicam à saída de pacote.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Grave um zip local de diagnósticos projetado para anexar a relatórios de bug. Para o modelo de privacidade e o conteúdo do pacote, consulte [Exportação de Diagnósticos](/pt-BR/gateway/diagnostics).

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
  Pule a busca de pacote de estabilidade persistido.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprima o caminho gravado, o tamanho e o manifesto como JSON.
</ParamField>

A exportação contém um manifesto, um resumo em Markdown, formato da configuração, detalhes de configuração sanitizados, resumos de log sanitizados, snapshots sanitizados de status/saúde do Gateway e o pacote de estabilidade mais recente quando houver.

Ela foi feita para ser compartilhada. Mantém detalhes operacionais que ajudam na depuração, como campos seguros de log do OpenClaw, nomes de subsistemas, códigos de status, durações, modos configurados, portas, ids de Plugin, ids de provedor, configurações de recursos não secretas e mensagens de log operacionais com redação. Ela omite ou redige texto de chat, corpos de webhook, saídas de ferramentas, credenciais, cookies, identificadores de conta/mensagem, texto de prompt/instrução, nomes de host e valores secretos. Quando uma mensagem no estilo LogTape parece texto de payload de usuário/chat/ferramenta, a exportação mantém apenas que uma mensagem foi omitida mais sua contagem de bytes.

### `gateway status`

`gateway status` mostra o serviço do Gateway (launchd/systemd/schtasks) mais uma sonda opcional de conectividade/capacidade de autenticação.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Adiciona um alvo de sondagem explícito. O remoto configurado + localhost ainda são sondados.
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
  Ignora a sondagem de conectividade (visualização somente do serviço).
</ParamField>
<ParamField path="--deep" type="boolean">
  Examina também serviços em nível de sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Eleva a sondagem de conectividade padrão para uma sondagem de leitura e sai com código diferente de zero quando essa sondagem de leitura falha. Não pode ser combinado com `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semântica de status">
    - `gateway status` continua disponível para diagnóstico mesmo quando a configuração local da CLI está ausente ou inválida.
    - O `gateway status` padrão comprova o estado do serviço, a conexão WebSocket e a capacidade de autenticação visível no momento do handshake. Ele não comprova operações de leitura/escrita/administração.
    - Sondagens de diagnóstico não fazem mutações para autenticação de dispositivo pela primeira vez: elas reutilizam um token de dispositivo em cache existente quando ele existe, mas não criam uma nova identidade de dispositivo da CLI nem um registro de pareamento de dispositivo somente leitura apenas para verificar o status.
    - `gateway status` resolve SecretRefs de autenticação configuradas para autenticação da sondagem quando possível.
    - Se uma SecretRef de autenticação obrigatória não for resolvida neste caminho de comando, `gateway status --json` relatará `rpc.authWarning` quando a conectividade/autenticação da sondagem falhar; passe `--token`/`--password` explicitamente ou resolva a origem do segredo primeiro.
    - Se a sondagem for bem-sucedida, os avisos de referência de autenticação não resolvida são suprimidos para evitar falsos positivos.
    - Use `--require-rpc` em scripts e automação quando um serviço em escuta não for suficiente e você também precisar que chamadas RPC com escopo de leitura estejam saudáveis.
    - `--deep` adiciona uma varredura de melhor esforço por instalações launchd/systemd/schtasks extras. Quando vários serviços semelhantes ao Gateway são detectados, a saída para humanos imprime dicas de limpeza e avisa que a maioria das configurações deve executar um Gateway por máquina.
    - `--deep` também relata uma transferência recente de reinicialização do supervisor do Gateway quando o processo do serviço saiu corretamente para uma reinicialização por supervisor externo.
    - `--deep` executa validação de configuração em modo ciente de Plugin (`pluginValidation: "full"`) e expõe avisos configurados de manifesto de Plugin (por exemplo, metadados de configuração de canal ausentes) para que verificações rápidas de instalação e atualização os capturem. O `gateway status` padrão mantém o caminho rápido somente leitura que ignora a validação de Plugin.
    - A saída para humanos inclui o caminho resolvido do arquivo de log, além do instantâneo de caminhos/validade da configuração da CLI versus serviço, para ajudar a diagnosticar desvios de perfil ou diretório de estado.

  </Accordion>
  <Accordion title="Verificações de divergência de autenticação do systemd no Linux">
    - Em instalações systemd no Linux, as verificações de divergência de autenticação do serviço leem valores `Environment=` e `EnvironmentFile=` da unidade (incluindo `%h`, caminhos entre aspas, vários arquivos e arquivos opcionais `-`).
    - As verificações de divergência resolvem SecretRefs de `gateway.auth.token` usando o ambiente de runtime mesclado (primeiro o ambiente de comando do serviço, depois o fallback do ambiente do processo).
    - Se a autenticação por token não estiver efetivamente ativa (`gateway.auth.mode` explícito de `password`/`none`/`trusted-proxy`, ou modo não definido em que a senha pode vencer e nenhum candidato a token pode vencer), as verificações de divergência de token ignoram a resolução do token de configuração.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` é o comando de "depurar tudo". Ele sempre sonda:

- seu gateway remoto configurado (se definido), e
- localhost (loopback) **mesmo se o remoto estiver configurado**.

Se você passar `--url`, esse alvo explícito será adicionado antes dos dois. A saída para humanos rotula os alvos como:

- `URL (explicit)`
- `Remote (configured)` ou `Remote (configured, inactive)`
- `Local loopback`

<Note>
Se vários gateways estiverem acessíveis, ele imprime todos eles. Vários gateways têm suporte quando você usa perfis/portas isolados (por exemplo, um bot de resgate), mas a maioria das instalações ainda executa um único Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretação">
    - `Reachable: yes` significa que pelo menos um alvo aceitou uma conexão WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` relata o que a sondagem conseguiu comprovar sobre autenticação. Isso é separado da acessibilidade.
    - `Read probe: ok` significa que chamadas RPC de detalhe com escopo de leitura (`health`/`status`/`system-presence`/`config.get`) também foram bem-sucedidas.
    - `Read probe: limited - missing scope: operator.read` significa que a conexão foi bem-sucedida, mas o RPC com escopo de leitura está limitado. Isso é relatado como acessibilidade **degradada**, não como falha completa.
    - `Read probe: failed` após `Connect: ok` significa que o Gateway aceitou a conexão WebSocket, mas os diagnósticos de leitura subsequentes atingiram o tempo limite ou falharam. Isso também é acessibilidade **degradada**, não um Gateway inacessível.
    - Como `gateway status`, a sondagem reutiliza a autenticação de dispositivo em cache existente, mas não cria identidade de dispositivo pela primeira vez nem estado de pareamento.
    - O código de saída só é diferente de zero quando nenhum alvo sondado está acessível.

  </Accordion>
  <Accordion title="Saída JSON">
    Nível superior:

    - `ok`: pelo menos um alvo está acessível.
    - `degraded`: pelo menos um alvo aceitou uma conexão, mas não concluiu diagnósticos RPC completos de detalhe.
    - `capability`: melhor capacidade vista entre alvos acessíveis (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` ou `unknown`).
    - `primaryTargetId`: melhor alvo a tratar como o vencedor ativo nesta ordem: URL explícita, túnel SSH, remoto configurado e depois local loopback.
    - `warnings[]`: registros de aviso de melhor esforço com `code`, `message` e `targetIds` opcionais.
    - `network`: dicas de URL de local loopback/tailnet derivadas da configuração atual e da rede do host.
    - `discovery.timeoutMs` e `discovery.count`: o orçamento/contagem de resultados de descoberta real usado para esta passagem de sondagem.

    Por alvo (`targets[].connect`):

    - `ok`: acessibilidade após conexão + classificação degradada.
    - `rpcOk`: sucesso completo de RPC de detalhe.
    - `scopeLimited`: RPC de detalhe falhou devido a escopo de operador ausente.

    Por alvo (`targets[].auth`):

    - `role`: função de autenticação relatada em `hello-ok` quando disponível.
    - `scopes`: escopos concedidos relatados em `hello-ok` quando disponíveis.
    - `capability`: a classificação de capacidade de autenticação exposta para esse alvo.

  </Accordion>
  <Accordion title="Códigos de aviso comuns">
    - `ssh_tunnel_failed`: a configuração do túnel SSH falhou; o comando voltou para sondagens diretas.
    - `multiple_gateways`: mais de um alvo estava acessível; isso é incomum, a menos que você execute intencionalmente perfis isolados, como um bot de resgate.
    - `auth_secretref_unresolved`: uma SecretRef de autenticação configurada não pôde ser resolvida para um alvo com falha.
    - `probe_scope_limited`: a conexão WebSocket foi bem-sucedida, mas a sondagem de leitura foi limitada pela ausência de `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remoto via SSH (paridade com app para Mac)

O modo "Remoto via SSH" do app macOS usa um encaminhamento de porta local para que o gateway remoto (que pode estar vinculado apenas a loopback) fique acessível em `ws://127.0.0.1:<port>`.

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
  Escolhe o primeiro host de gateway descoberto como alvo SSH a partir do endpoint de descoberta resolvido (`local.` mais o domínio de longa distância configurado, se houver). Dicas somente TXT são ignoradas.
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
  Principalmente para RPCs no estilo de agentes que transmitem eventos intermediários antes de uma carga final.
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

Use `--wrapper` quando o serviço gerenciado precisar iniciar por meio de outro executável, por exemplo, um shim de gerenciador de segredos ou um auxiliar de execução como outro usuário. O wrapper recebe os argumentos normais do Gateway e é responsável por eventualmente executar `openclaw` ou Node com esses argumentos.

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

Você também pode definir o wrapper pelo ambiente. `gateway install` valida que o caminho é um arquivo executável, grava o wrapper em `ProgramArguments` do serviço e persiste `OPENCLAW_WRAPPER` no ambiente do serviço para reinstalações forçadas, atualizações e reparos do doctor posteriores.

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
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - Use `gateway restart` para reiniciar um serviço gerenciado. Não encadeie `gateway stop` e `gateway start` como substituto de reinicialização.
    - No macOS, `gateway stop` usa `launchctl bootout` por padrão, o que remove o LaunchAgent da sessão de inicialização atual sem persistir uma desativação — a recuperação automática KeepAlive continua ativa para falhas futuras e `gateway start` reativa tudo corretamente sem um `launchctl enable` manual. Passe `--disable` para suprimir persistentemente KeepAlive e RunAtLoad para que o Gateway não reinicie até o próximo `gateway start` explícito; use isso quando uma parada manual deve sobreviver a reinicializações ou reinícios do sistema.
    - `gateway restart --safe` solicita ao Gateway em execução que faça uma pré-verificação do trabalho ativo do OpenClaw e adie a reinicialização até que a entrega de respostas, execuções incorporadas e execuções de tarefas sejam drenadas. `--safe` não pode ser combinado com `--force` ou `--wait`.
    - `gateway restart --wait 30s` substitui o orçamento configurado de drenagem de reinicialização para essa reinicialização. Números sem unidade são milissegundos; unidades como `s`, `m` e `h` são aceitas. `--wait 0` aguarda indefinidamente.
    - `gateway restart --safe --skip-deferral` executa a reinicialização segura ciente do OpenClaw, mas ignora o portão de adiamento para que o Gateway emita a reinicialização imediatamente mesmo quando bloqueadores forem relatados. Escape operacional para adiamentos de execuções de tarefas travadas; requer `--safe`.
    - `gateway restart --force` ignora a drenagem de trabalho ativo e reinicia imediatamente. Use quando um operador já tiver inspecionado os bloqueadores de tarefa listados e quiser o Gateway de volta agora.
    - Comandos de ciclo de vida aceitam `--json` para scripts.

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - Quando a autenticação por token exige um token e `gateway.auth.token` é gerenciado por SecretRef, `gateway install` valida que o SecretRef pode ser resolvido, mas não persiste o token resolvido nos metadados de ambiente do serviço.
    - Se a autenticação por token exige um token e o SecretRef de token configurado não pode ser resolvido, a instalação falha de forma fechada em vez de persistir texto simples de fallback.
    - Para autenticação por senha em `gateway run`, prefira `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` ou um `gateway.auth.password` baseado em SecretRef em vez de `--password` inline.
    - No modo de autenticação inferida, `OPENCLAW_GATEWAY_PASSWORD` somente no shell não relaxa os requisitos de token de instalação; use configuração durável (`gateway.auth.password` ou `env` de configuração) ao instalar um serviço gerenciado.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação será bloqueada até que o modo seja definido explicitamente.

  </Accordion>
</AccordionGroup>

## Descobrir Gateways (Bonjour)

`gateway discover` verifica beacons de Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour de área ampla): escolha um domínio (exemplo: `openclaw.internal.`) e configure split DNS + um servidor DNS; consulte [Bonjour](/pt-BR/gateway/bonjour).

Somente Gateways com descoberta Bonjour habilitada (padrão) anunciam o beacon.

Registros de descoberta de área ampla incluem (TXT):

- `role` (dica de função do Gateway)
- `transport` (dica de transporte, por exemplo, `gateway`)
- `gatewayPort` (porta WebSocket, geralmente `18789`)
- `sshPort` (opcional; clientes usam `22` como padrão para destinos SSH quando ausente)
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
  Saída legível por máquina (também desativa estilização/spinner).
</ParamField>

Exemplos:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- A CLI verifica `local.` mais o domínio de área ampla configurado quando um está habilitado.
- `wsUrl` na saída JSON é derivado do endpoint de serviço resolvido, não de dicas somente TXT como `lanHost` ou `tailnetDns`.
- Em mDNS `local.`, `sshPort` e `cliPath` só são transmitidos quando `discovery.mdns.mode` é `full`. O DNS-SD de área ampla ainda grava `cliPath`; `sshPort` também permanece opcional ali.

</Note>

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Runbook do Gateway](/pt-BR/gateway)
