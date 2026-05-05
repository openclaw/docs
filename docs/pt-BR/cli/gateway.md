---
read_when:
    - Executando o Gateway pela CLI (desenvolvimento ou servidores)
    - Depuração da autenticação do Gateway, dos modos de vinculação e da conectividade
    - Descoberta de Gateways via Bonjour (DNS-SD local + de área ampla)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — execute, consulte e descubra gateways
title: Gateway
x-i18n:
    generated_at: "2026-05-05T08:25:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89f798724971151cdd297fcdbbc1fe79dedc19f57521f2ad2c1fff0f9acf9b24
    source_path: cli/gateway.md
    workflow: 16
---

O Gateway é o servidor WebSocket do OpenClaw (canais, nós, sessões, ganchos). Os subcomandos nesta página ficam em `openclaw gateway …`.

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

Execute um processo local do Gateway:

```bash
openclaw gateway
```

Alias de primeiro plano:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Startup behavior">
    - Por padrão, o Gateway se recusa a iniciar a menos que `gateway.mode=local` esteja definido em `~/.openclaw/openclaw.json`. Use `--allow-unconfigured` para execuções ad hoc/de desenvolvimento.
    - Espera-se que `openclaw onboard --mode local` e `openclaw setup` gravem `gateway.mode=local`. Se o arquivo existir, mas `gateway.mode` estiver ausente, trate isso como uma configuração quebrada ou sobrescrita e repare-a, em vez de presumir implicitamente o modo local.
    - Se o arquivo existir e `gateway.mode` estiver ausente, o Gateway trata isso como dano suspeito à configuração e se recusa a "adivinhar local" por você.
    - Vincular além de loopback sem autenticação é bloqueado (proteção de segurança).
    - `SIGUSR1` aciona uma reinicialização dentro do processo quando autorizada (`commands.restart` é habilitado por padrão; defina `commands.restart: false` para bloquear reinicialização manual, enquanto aplicação/atualização de ferramenta/configuração do gateway continuam permitidas).
    - Os manipuladores de `SIGINT`/`SIGTERM` interrompem o processo do gateway, mas não restauram nenhum estado personalizado do terminal. Se você envolver a CLI com uma TUI ou entrada em modo bruto, restaure o terminal antes de sair.

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
  Ler a senha do gateway de um arquivo.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Expor o Gateway via Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Redefinir a configuração serve/funnel do Tailscale no desligamento.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Permitir início do gateway sem `gateway.mode=local` na configuração. Ignora a proteção de inicialização apenas para bootstrap ad hoc/de desenvolvimento; não grava nem repara o arquivo de configuração.
</ParamField>
<ParamField path="--dev" type="boolean">
  Criar uma configuração de desenvolvimento + workspace se ausentes (ignora BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Redefinir configuração de desenvolvimento + credenciais + sessões + workspace (requer `--dev`).
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
  Estilo de log do Websocket.
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

## Reiniciar o Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` pede ao Gateway em execução para pré-verificar trabalho ativo do OpenClaw antes de reiniciar. Se operações enfileiradas, entrega de respostas, execuções incorporadas ou execuções de tarefas estiverem ativas, o Gateway relata os bloqueadores, mescla solicitações duplicadas de reinicialização segura e reinicia quando o trabalho ativo for drenado. `restart` simples mantém o comportamento existente do gerenciador de serviço para compatibilidade. Use `--force` apenas quando você quiser explicitamente o caminho de substituição imediata.

<Warning>
`--password` inline pode ser exposto em listagens de processos locais. Prefira `--password-file`, env ou um `gateway.auth.password` baseado em SecretRef.
</Warning>

### Perfil de inicialização

- Defina `OPENCLAW_GATEWAY_STARTUP_TRACE=1` para registrar tempos de fases durante a inicialização do Gateway, incluindo atraso `eventLoopMax` por fase e tempos de tabela de consulta de plugins para índice instalado, registro de manifesto, planejamento de inicialização e trabalho de mapa de proprietários.
- Defina `OPENCLAW_DIAGNOSTICS=timeline` com `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` para gravar uma linha do tempo de diagnósticos de inicialização JSONL de melhor esforço para harnesses externos de QA. Você também pode habilitar a flag com `diagnostics.flags: ["timeline"]` na configuração; o caminho ainda é fornecido por env. Adicione `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` para incluir amostras de event-loop.
- Execute `pnpm test:startup:gateway -- --runs 5 --warmup 1` para medir a inicialização do Gateway. O benchmark registra a primeira saída do processo, `/healthz`, `/readyz`, tempos do trace de inicialização, atraso do event-loop e detalhes de tempo da tabela de consulta de plugins.

## Consultar um Gateway em execução

Todos os comandos de consulta usam RPC WebSocket.

<Tabs>
  <Tab title="Output modes">
    - Padrão: legível por humanos (colorido em TTY).
    - `--json`: JSON legível por máquina (sem estilo/spinner).
    - `--no-color` (ou `NO_COLOR=1`): desabilita ANSI mantendo o layout humano.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: URL WebSocket do Gateway.
    - `--token <token>`: token do Gateway.
    - `--password <password>`: senha do Gateway.
    - `--timeout <ms>`: timeout/orçamento (varia por comando).
    - `--expect-final`: aguardar uma resposta "final" (chamadas de agente).

  </Tab>
</Tabs>

<Note>
Quando você define `--url`, a CLI não recorre a credenciais de configuração ou ambiente. Passe `--token` ou `--password` explicitamente. Credenciais explícitas ausentes são um erro.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

O endpoint HTTP `/healthz` é uma sonda de vivacidade: ele retorna assim que o servidor consegue responder HTTP. O endpoint HTTP `/readyz` é mais rigoroso e permanece vermelho enquanto sidecars de plugins de inicialização, canais ou ganchos configurados ainda estão se estabilizando. Respostas detalhadas de prontidão locais ou autenticadas incluem um bloco de diagnóstico `eventLoop` com atraso do event-loop, utilização do event-loop, proporção de núcleos de CPU e uma flag `degraded`.

### `gateway usage-cost`

Buscar resumos de custo de uso nos logs de sessão.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Número de dias a incluir.
</ParamField>

### `gateway stability`

Buscar o gravador recente de estabilidade de diagnósticos de um Gateway em execução.

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
  Ler um pacote de estabilidade persistido em vez de chamar o Gateway em execução. Use `--bundle latest` (ou apenas `--bundle`) para o pacote mais recente sob o diretório de estado, ou passe diretamente um caminho JSON de pacote.
</ParamField>
<ParamField path="--export" type="boolean">
  Gravar um zip compartilhável de diagnósticos de suporte em vez de imprimir detalhes de estabilidade.
</ParamField>
<ParamField path="--output <path>" type="string">
  Caminho de saída para `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - Os registros mantêm metadados operacionais: nomes de eventos, contagens, tamanhos em bytes, leituras de memória, estado de fila/sessão, nomes de canais/plugins e resumos de sessão redigidos. Eles não mantêm texto de chat, corpos de webhook, saídas de ferramentas, corpos brutos de solicitação ou resposta, tokens, cookies, valores secretos, nomes de host nem ids brutos de sessão. Defina `diagnostics.enabled: false` para desabilitar totalmente o gravador.
    - Em saídas fatais do Gateway, timeouts de desligamento e falhas de inicialização de reinicialização, o OpenClaw grava o mesmo snapshot de diagnóstico em `~/.openclaw/logs/stability/openclaw-stability-*.json` quando o gravador tem eventos. Inspecione o pacote mais recente com `openclaw gateway stability --bundle latest`; `--limit`, `--type` e `--since-seq` também se aplicam à saída do pacote.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Grava um zip local de diagnósticos projetado para ser anexado a relatórios de bug. Para o modelo de privacidade e o conteúdo do pacote, consulte [Exportação de Diagnósticos](/pt-BR/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Caminho do zip de saída. O padrão é uma exportação de suporte sob o diretório de estado.
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
  Ignorar busca de pacote de estabilidade persistido.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprimir o caminho gravado, tamanho e manifesto como JSON.
</ParamField>

A exportação contém um manifesto, um resumo em Markdown, formato da configuração, detalhes sanitizados da configuração, resumos sanitizados de logs, snapshots sanitizados de status/saúde do Gateway e o pacote de estabilidade mais recente quando existir.

Ela foi feita para ser compartilhada. Mantém detalhes operacionais que ajudam na depuração, como campos seguros de log do OpenClaw, nomes de subsistemas, códigos de status, durações, modos configurados, portas, ids de plugins, ids de provedores, configurações de recursos não secretas e mensagens de log operacional redigidas. Ela omite ou redige texto de chat, corpos de webhook, saídas de ferramentas, credenciais, cookies, identificadores de conta/mensagem, texto de prompt/instrução, nomes de host e valores secretos. Quando uma mensagem no estilo LogTape parece texto de payload de usuário/chat/ferramenta, a exportação mantém apenas que uma mensagem foi omitida mais sua contagem de bytes.

### `gateway status`

`gateway status` mostra o serviço Gateway (launchd/systemd/schtasks) mais uma sonda opcional de capacidade de conectividade/autenticação.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Adicione um alvo de sondagem explícito. O remoto configurado + localhost ainda são sondados.
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
  Ignore a sondagem de conectividade (visualização apenas do serviço).
</ParamField>
<ParamField path="--deep" type="boolean">
  Examine também serviços em nível de sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Atualize a sondagem de conectividade padrão para uma sondagem de leitura e saia com código diferente de zero quando essa sondagem de leitura falhar. Não pode ser combinado com `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semântica de status">
    - `gateway status` permanece disponível para diagnósticos mesmo quando a configuração local da CLI está ausente ou inválida.
    - O `gateway status` padrão comprova o estado do serviço, a conexão WebSocket e a capacidade de autenticação visível no momento do handshake. Ele não comprova operações de leitura/escrita/administração.
    - As sondagens de diagnóstico não fazem mutações para autenticação inicial de dispositivo: elas reutilizam um token de dispositivo em cache existente quando houver um, mas não criam uma nova identidade de dispositivo da CLI nem um registro de pareamento de dispositivo somente leitura apenas para verificar o status.
    - `gateway status` resolve SecretRefs de autenticação configuradas para autenticação da sondagem quando possível.
    - Se uma SecretRef de autenticação obrigatória não for resolvida neste caminho de comando, `gateway status --json` reportará `rpc.authWarning` quando a conectividade/autenticação da sondagem falhar; passe `--token`/`--password` explicitamente ou resolva a origem do segredo primeiro.
    - Se a sondagem for bem-sucedida, avisos de auth-ref não resolvida serão suprimidos para evitar falsos positivos.
    - Use `--require-rpc` em scripts e automação quando um serviço ouvindo não for suficiente e você também precisar que chamadas RPC com escopo de leitura estejam íntegras.
    - `--deep` adiciona uma varredura de melhor esforço em busca de instalações extras de launchd/systemd/schtasks. Quando vários serviços semelhantes ao Gateway são detectados, a saída humana imprime dicas de limpeza e avisa que a maioria das configurações deve executar um Gateway por máquina.
    - `--deep` também informa uma transferência recente de reinício do supervisor do Gateway quando o processo do serviço saiu corretamente para um reinício por supervisor externo.
    - A saída humana inclui o caminho resolvido do arquivo de log mais o instantâneo de caminhos/validade da configuração da CLI versus serviço para ajudar a diagnosticar divergência de perfil ou diretório de estado.

  </Accordion>
  <Accordion title="Verificações de divergência de autenticação no Linux systemd">
    - Em instalações Linux systemd, as verificações de divergência de autenticação do serviço leem valores de `Environment=` e `EnvironmentFile=` da unidade (incluindo `%h`, caminhos entre aspas, vários arquivos e arquivos opcionais com `-`).
    - As verificações de divergência resolvem SecretRefs de `gateway.auth.token` usando o env de runtime mesclado (primeiro o env de comando do serviço, depois o fallback do env do processo).
    - Se a autenticação por token não estiver efetivamente ativa (`gateway.auth.mode` explícito de `password`/`none`/`trusted-proxy`, ou modo não definido em que a senha pode vencer e nenhum candidato a token pode vencer), as verificações de divergência de token ignoram a resolução do token de configuração.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` é o comando de "depurar tudo". Ele sempre sonda:

- seu gateway remoto configurado (se definido), e
- localhost (loopback) **mesmo se o remoto estiver configurado**.

Se você passar `--url`, esse alvo explícito será adicionado antes de ambos. A saída humana rotula os alvos como:

- `URL (explicit)`
- `Remote (configured)` ou `Remote (configured, inactive)`
- `Local loopback`

<Note>
Se vários gateways estiverem alcançáveis, ele imprimirá todos. Vários gateways são compatíveis quando você usa perfis/portas isolados (por exemplo, um bot de resgate), mas a maioria das instalações ainda executa um único gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretação">
    - `Reachable: yes` significa que pelo menos um alvo aceitou uma conexão WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` informa o que a sondagem conseguiu comprovar sobre autenticação. É separado da alcançabilidade.
    - `Read probe: ok` significa que chamadas RPC de detalhe com escopo de leitura (`health`/`status`/`system-presence`/`config.get`) também foram bem-sucedidas.
    - `Read probe: limited - missing scope: operator.read` significa que a conexão foi bem-sucedida, mas o RPC com escopo de leitura está limitado. Isso é relatado como alcançabilidade **degradada**, não falha completa.
    - `Read probe: failed` depois de `Connect: ok` significa que o Gateway aceitou a conexão WebSocket, mas os diagnósticos de leitura posteriores atingiram tempo limite ou falharam. Isso também é alcançabilidade **degradada**, não um Gateway inalcançável.
    - Assim como `gateway status`, a sondagem reutiliza a autenticação de dispositivo em cache existente, mas não cria identidade de dispositivo inicial nem estado de pareamento.
    - O código de saída é diferente de zero apenas quando nenhum alvo sondado está alcançável.

  </Accordion>
  <Accordion title="Saída JSON">
    Nível superior:

    - `ok`: pelo menos um alvo está alcançável.
    - `degraded`: pelo menos um alvo aceitou uma conexão, mas não concluiu os diagnósticos RPC de detalhe completos.
    - `capability`: melhor capacidade vista entre alvos alcançáveis (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` ou `unknown`).
    - `primaryTargetId`: melhor alvo para tratar como o vencedor ativo nesta ordem: URL explícita, túnel SSH, remoto configurado e, por fim, local loopback.
    - `warnings[]`: registros de aviso de melhor esforço com `code`, `message` e `targetIds` opcionais.
    - `network`: dicas de URL de local loopback/tailnet derivadas da configuração atual e da rede do host.
    - `discovery.timeoutMs` e `discovery.count`: o orçamento/contagem de resultados real de descoberta usado para esta passagem de sondagem.

    Por alvo (`targets[].connect`):

    - `ok`: alcançabilidade após conexão + classificação degradada.
    - `rpcOk`: sucesso completo do RPC de detalhe.
    - `scopeLimited`: RPC de detalhe falhou por falta de escopo de operador.

    Por alvo (`targets[].auth`):

    - `role`: função de autenticação reportada em `hello-ok` quando disponível.
    - `scopes`: escopos concedidos reportados em `hello-ok` quando disponíveis.
    - `capability`: a classificação de capacidade de autenticação exposta para esse alvo.

  </Accordion>
  <Accordion title="Códigos de aviso comuns">
    - `ssh_tunnel_failed`: a configuração do túnel SSH falhou; o comando voltou para sondagens diretas.
    - `multiple_gateways`: mais de um alvo estava alcançável; isso é incomum, a menos que você execute intencionalmente perfis isolados, como um bot de resgate.
    - `auth_secretref_unresolved`: uma SecretRef de autenticação configurada não pôde ser resolvida para um alvo com falha.
    - `probe_scope_limited`: a conexão WebSocket foi bem-sucedida, mas a sondagem de leitura foi limitada pela ausência de `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remoto via SSH (paridade com app Mac)

O modo "Remoto via SSH" do app macOS usa um encaminhamento de porta local para que o gateway remoto (que pode estar vinculado apenas ao loopback) fique alcançável em `ws://127.0.0.1:<port>`.

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
  Escolha o primeiro host de gateway descoberto como alvo SSH a partir do endpoint de descoberta resolvido (`local.` mais o domínio de área ampla configurado, se houver). Dicas somente TXT são ignoradas.
</ParamField>

Configuração (opcional, usada como padrões):

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
  Principalmente para RPCs no estilo de agente que transmitem eventos intermediários antes de uma carga útil final.
</ParamField>
<ParamField path="--json" type="boolean">
  Saída JSON legível por máquina.
</ParamField>

<Note>
`--params` deve ser JSON válido.
</Note>

## Gerenciar o serviço do Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Instalar com um wrapper

Use `--wrapper` quando o serviço gerenciado precisar iniciar por meio de outro executável, por exemplo, um
shim de gerenciador de segredos ou um auxiliar run-as. O wrapper recebe os argumentos normais do Gateway e é
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
    - `gateway restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="Comportamento do ciclo de vida">
    - Use `gateway restart` para reiniciar um serviço gerenciado. Não encadeie `gateway stop` e `gateway start` como substituto de reinício; no macOS, `gateway stop` desativa intencionalmente o LaunchAgent antes de pará-lo.
    - `gateway restart --safe` solicita que o Gateway em execução faça uma pré-verificação do trabalho ativo do OpenClaw e adie o reinício até que a entrega de respostas, execuções embutidas e execuções de tarefas sejam drenadas. `--safe` não pode ser combinado com `--force` nem `--wait`.
    - `gateway restart --wait 30s` substitui o orçamento configurado de drenagem de reinício para esse reinício. Números sem unidade são milissegundos; unidades como `s`, `m` e `h` são aceitas. `--wait 0` espera indefinidamente.
    - `gateway restart --force` ignora a drenagem de trabalho ativo e reinicia imediatamente. Use quando um operador já tiver inspecionado os bloqueadores de tarefa listados e quiser o gateway de volta agora.
    - Comandos de ciclo de vida aceitam `--json` para scripting.

  </Accordion>
  <Accordion title="Autenticação e SecretRefs no momento da instalação">
    - Quando a autenticação por token exige um token e `gateway.auth.token` é gerenciado por SecretRef, `gateway install` valida que o SecretRef pode ser resolvido, mas não persiste o token resolvido nos metadados do ambiente do serviço.
    - Se a autenticação por token exige um token e o SecretRef de token configurado não pode ser resolvido, a instalação falha de forma fechada em vez de persistir texto simples de fallback.
    - Para autenticação por senha em `gateway run`, prefira `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` ou um `gateway.auth.password` apoiado por SecretRef em vez de `--password` inline.
    - No modo de autenticação inferida, `OPENCLAW_GATEWAY_PASSWORD` apenas no shell não flexibiliza os requisitos de token de instalação; use configuração durável (`gateway.auth.password` ou `env` de configuração) ao instalar um serviço gerenciado.
    - Se tanto `gateway.auth.token` quanto `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação será bloqueada até que o modo seja definido explicitamente.

  </Accordion>
</AccordionGroup>

## Descobrir gateways (Bonjour)

`gateway discover` verifica beacons de Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour de área ampla): escolha um domínio (exemplo: `openclaw.internal.`) e configure DNS dividido + um servidor DNS; consulte [Bonjour](/pt-BR/gateway/bonjour).

Somente gateways com descoberta Bonjour habilitada (padrão) anunciam o beacon.

Registros de descoberta de área ampla incluem (TXT):

- `role` (dica de função do gateway)
- `transport` (dica de transporte, por exemplo, `gateway`)
- `gatewayPort` (porta WebSocket, geralmente `18789`)
- `sshPort` (opcional; clientes usam `22` como destino SSH padrão quando ela está ausente)
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
- `wsUrl` na saída JSON é derivado do endpoint de serviço resolvido, não de dicas apenas em TXT, como `lanHost` ou `tailnetDns`.
- No mDNS `local.`, `sshPort` e `cliPath` só são transmitidos quando `discovery.mdns.mode` é `full`. O DNS-SD de área ampla ainda grava `cliPath`; `sshPort` também continua opcional ali.

</Note>

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Runbook do Gateway](/pt-BR/gateway)
