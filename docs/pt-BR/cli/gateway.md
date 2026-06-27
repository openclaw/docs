---
read_when:
    - Executando o Gateway pela CLI (desenvolvimento ou servidores)
    - Depuração da autenticação do Gateway, modos de vinculação e conectividade
    - Descobrindo gateways via Bonjour (DNS-SD local + de área ampla)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — execute, consulte e descubra gateways
title: Gateway
x-i18n:
    generated_at: "2026-06-27T17:19:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de9aaeff1b592e867ffadf49a076e6e0f7069b966244b19d4eed91993c3ad738
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
    - Espera-se que `openclaw onboard --mode local` e `openclaw setup` gravem `gateway.mode=local`. Se o arquivo existir, mas `gateway.mode` estiver ausente, trate isso como uma configuração quebrada ou sobrescrita e repare-a em vez de presumir implicitamente o modo local.
    - Se o arquivo existir e `gateway.mode` estiver ausente, o Gateway trata isso como dano suspeito à configuração e se recusa a "adivinhar local" para você.
    - Vincular além de loopback sem autenticação é bloqueado (barreira de segurança).
    - `lan`, `tailnet` e `custom` atualmente resolvem por caminhos BYOH somente IPv4.
    - BYOH somente IPv6 não tem suporte nativo neste caminho hoje. Use um sidecar IPv4 ou proxy se o próprio host for somente IPv6.
    - `SIGUSR1` aciona uma reinicialização em processo quando autorizada (`commands.restart` é habilitado por padrão; defina `commands.restart: false` para bloquear a reinicialização manual, enquanto aplicação/atualização por ferramenta/configuração do gateway continuam permitidas).
    - Manipuladores de `SIGINT`/`SIGTERM` interrompem o processo do gateway, mas não restauram nenhum estado personalizado do terminal. Se você encapsular a CLI com uma TUI ou entrada em modo bruto, restaure o terminal antes de sair.

  </Accordion>
</AccordionGroup>

### Opções

<ParamField path="--port <port>" type="number">
  Porta WebSocket (o padrão vem da configuração/env; geralmente `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Modo de vinculação do listener. `lan`, `tailnet` e `custom` atualmente resolvem por caminhos somente IPv4.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Substituição do modo de autenticação.
</ParamField>
<ParamField path="--token <token>" type="string">
  Substituição de token (também define `OPENCLAW_GATEWAY_TOKEN` para o processo).
</ParamField>
<ParamField path="--password <password>" type="string">
  Substituição de senha.
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
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  Espera um endereço IPv4 hoje. Para BYOH somente IPv6, coloque um sidecar IPv4 ou proxy na frente do Gateway e aponte o OpenClaw para esse endpoint IPv4.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Permitir iniciar o gateway sem `gateway.mode=local` na configuração. Ignora a proteção de inicialização apenas para bootstrap ad hoc/de desenvolvimento; não grava nem repara o arquivo de configuração.
</ParamField>
<ParamField path="--dev" type="boolean">
  Criar uma configuração + workspace de desenvolvimento se ausentes (ignora BOOTSTRAP.md).
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

## Reiniciar o Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` pede ao Gateway em execução para fazer uma pré-verificação do trabalho ativo do OpenClaw antes de reiniciar. Se operações em fila, entrega de respostas, execuções incorporadas ou execuções de tarefas estiverem ativas, o Gateway relata os bloqueadores, combina solicitações duplicadas de reinicialização segura e reinicia quando o trabalho ativo esvazia. `restart` simples mantém o comportamento existente do gerenciador de serviço por compatibilidade. Use `--force` apenas quando você quiser explicitamente o caminho de substituição imediata.

`openclaw gateway restart --safe --skip-deferral` executa a mesma reinicialização coordenada ciente do OpenClaw que `--safe`, mas ignora o gate de adiamento por trabalho ativo para que o Gateway emita a reinicialização imediatamente, mesmo quando bloqueadores forem relatados. Use-o como a saída de emergência do operador quando um adiamento tiver ficado preso por uma execução de tarefa travada e `--safe` sozinho aguardaria indefinidamente. `--skip-deferral` requer `--safe`.

<Warning>
`--password` inline pode ser exposto em listagens de processos locais. Prefira `--password-file`, env ou um `gateway.auth.password` baseado em SecretRef.
</Warning>

### Profiling do Gateway

- Defina `OPENCLAW_GATEWAY_STARTUP_TRACE=1` para registrar tempos de fases durante a inicialização do Gateway, incluindo atraso `eventLoopMax` por fase e tempos de tabelas de pesquisa de plugins para índice instalado, registro de manifestos, planejamento de inicialização e trabalho de mapa de proprietários.
- Defina `OPENCLAW_GATEWAY_RESTART_TRACE=1` para registrar linhas `restart trace:` no escopo da reinicialização para tratamento de sinal de reinicialização, esvaziamento de trabalho ativo, fases de desligamento, próxima inicialização, tempo até pronto e métricas de memória.
- Defina `OPENCLAW_DIAGNOSTICS=timeline` com `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` para gravar uma linha do tempo de diagnósticos de inicialização JSONL best-effort para harnesses externos de QA. Você também pode habilitar a flag com `diagnostics.flags: ["timeline"]` na configuração; o caminho ainda é fornecido por env. Adicione `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` para incluir amostras do event loop.
- Execute `pnpm build` primeiro, depois `pnpm test:startup:gateway -- --runs 5 --warmup 1` para fazer benchmark da inicialização do Gateway contra a entrada da CLI compilada. O benchmark registra a primeira saída do processo, `/healthz`, `/readyz`, tempos do trace de inicialização, atraso do event loop e detalhes de tempo da tabela de pesquisa de plugins.
- Execute `pnpm build` primeiro, depois `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` para fazer benchmark da reinicialização em processo do Gateway contra a entrada da CLI compilada no macOS ou Linux. O benchmark de reinicialização usa SIGUSR1, habilita traces de inicialização e reinicialização no processo filho e registra próximo `/healthz`, próximo `/readyz`, downtime, tempo até pronto, CPU, RSS e métricas do trace de reinicialização.
- Trate `/healthz` como liveness e `/readyz` como readiness utilizável. Linhas de trace e saída de benchmark servem para atribuição de proprietário; não trate um único intervalo de trace ou uma única amostra como uma conclusão completa de desempenho.

## Consultar um Gateway em execução

Todos os comandos de consulta usam RPC por WebSocket.

<Tabs>
  <Tab title="Modos de saída">
    - Padrão: legível por humanos (colorido em TTY).
    - `--json`: JSON legível por máquina (sem estilo/spinner).
    - `--no-color` (ou `NO_COLOR=1`): desabilitar ANSI mantendo o layout humano.

  </Tab>
  <Tab title="Opções compartilhadas">
    - `--url <url>`: URL WebSocket do Gateway.
    - `--token <token>`: token do Gateway.
    - `--password <password>`: senha do Gateway.
    - `--timeout <ms>`: timeout/orçamento (varia por comando).
    - `--expect-final`: aguardar uma resposta "final" (chamadas de agente).

  </Tab>
</Tabs>

<Note>
Quando você define `--url`, a CLI não faz fallback para credenciais de configuração ou ambiente. Passe `--token` ou `--password` explicitamente. Credenciais explícitas ausentes são um erro.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

O endpoint HTTP `/healthz` é uma probe de liveness: ele retorna quando o servidor consegue responder HTTP. O endpoint HTTP `/readyz` é mais rigoroso e permanece vermelho enquanto sidecars de plugins de inicialização, canais ou hooks configurados ainda estão se estabilizando. Respostas detalhadas locais ou autenticadas de readiness incluem um bloco de diagnóstico `eventLoop` com atraso do event loop, utilização do event loop, proporção de núcleos de CPU e uma flag `degraded`.

<ParamField path="--port <port>" type="number">
  Direcionar para um Gateway local loopback nesta porta. Isso substitui `OPENCLAW_GATEWAY_URL` e `OPENCLAW_GATEWAY_PORT` para a chamada de integridade.
</ParamField>

### `gateway usage-cost`

Buscar resumos de custo de uso dos logs de sessão.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Número de dias a incluir.
</ParamField>
<ParamField path="--agent <id>" type="string">
  Restringir o resumo de custo a um id de agente configurado.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Agregar o resumo de custo entre todos os agentes configurados. Não pode ser combinado com `--agent`.
</ParamField>

### `gateway stability`

Buscar o gravador recente de estabilidade diagnóstica de um Gateway em execução.

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
  Ler um bundle de estabilidade persistido em vez de chamar o Gateway em execução. Use `--bundle latest` (ou apenas `--bundle`) para o bundle mais recente no diretório de estado, ou passe diretamente um caminho JSON de bundle.
</ParamField>
<ParamField path="--export" type="boolean">
  Gravar um zip de diagnósticos de suporte compartilhável em vez de imprimir detalhes de estabilidade.
</ParamField>
<ParamField path="--output <path>" type="string">
  Caminho de saída para `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacidade e comportamento do bundle">
    - Os registros mantêm metadados operacionais: nomes de eventos, contagens, tamanhos em bytes, leituras de memória, estado de fila/sessão, nomes de canais/plugins e resumos de sessão redigidos. Eles não mantêm texto de chat, corpos de webhook, saídas de ferramentas, corpos brutos de solicitação ou resposta, tokens, cookies, valores secretos, nomes de host ou ids brutos de sessão. Defina `diagnostics.enabled: false` para desabilitar completamente o gravador.
    - Em saídas fatais do Gateway, timeouts de desligamento e falhas de inicialização de reinicialização, o OpenClaw grava o mesmo snapshot de diagnóstico em `~/.openclaw/logs/stability/openclaw-stability-*.json` quando o gravador tem eventos. Inspecione o bundle mais recente com `openclaw gateway stability --bundle latest`; `--limit`, `--type` e `--since-seq` também se aplicam à saída de bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Gravar um zip local de diagnósticos projetado para anexar a relatórios de bugs. Para o modelo de privacidade e o conteúdo do bundle, consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics).

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
  Tempo limite do snapshot de status/integridade.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Ignorar a busca do pacote de estabilidade persistido.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprimir o caminho gravado, o tamanho e o manifesto como JSON.
</ParamField>

A exportação contém um manifesto, um resumo em Markdown, formato da configuração, detalhes sanitizados da configuração, resumos de logs sanitizados, snapshots sanitizados de status/integridade do Gateway e o pacote de estabilidade mais recente quando houver um.

Ela foi feita para ser compartilhada. Ela mantém detalhes operacionais que ajudam na depuração, como campos seguros de log do OpenClaw, nomes de subsistemas, códigos de status, durações, modos configurados, portas, IDs de plugins, IDs de provedores, configurações de recursos não secretas e mensagens operacionais de log censuradas. Ela omite ou censura texto de chat, corpos de Webhook, saídas de ferramentas, credenciais, cookies, identificadores de conta/mensagem, texto de prompts/instruções, nomes de host e valores secretos. Quando uma mensagem no estilo LogTape parece texto de payload de usuário/chat/ferramenta, a exportação mantém apenas a informação de que uma mensagem foi omitida, mais sua contagem de bytes.

### `gateway status`

`gateway status` mostra o serviço Gateway (launchd/systemd/schtasks), além de uma sondagem opcional de conectividade/capacidade de autenticação.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Adicionar um alvo explícito de sondagem. O remoto configurado + localhost ainda são sondados.
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
  Ignorar a sondagem de conectividade (visualização apenas do serviço).
</ParamField>
<ParamField path="--deep" type="boolean">
  Examinar também serviços em nível de sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Atualizar a sondagem de conectividade padrão para uma sondagem de leitura e sair com código diferente de zero quando essa sondagem de leitura falhar. Não pode ser combinado com `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semântica de status">
    - `gateway status` permanece disponível para diagnóstico mesmo quando a configuração local da CLI está ausente ou é inválida.
    - O `gateway status` padrão comprova o estado do serviço, conexão WebSocket e a capacidade de autenticação visível no momento do handshake. Ele não comprova operações de leitura/gravação/administração.
    - Sondagens de diagnóstico não fazem mutações na autenticação de dispositivos de primeiro uso: elas reutilizam um token de dispositivo existente em cache quando houver um, mas não criam uma nova identidade de dispositivo da CLI nem um registro de pareamento de dispositivo somente leitura apenas para verificar o status.
    - `gateway status` resolve SecretRefs de autenticação configurados para autenticação da sondagem quando possível.
    - Se uma SecretRef de autenticação obrigatória não for resolvida neste caminho de comando, `gateway status --json` relata `rpc.authWarning` quando a conectividade/autenticação da sondagem falha; passe `--token`/`--password` explicitamente ou resolva a origem do segredo primeiro.
    - Se a sondagem tiver sucesso, avisos de referência de autenticação não resolvida são suprimidos para evitar falsos positivos.
    - Quando a sondagem está habilitada, a saída JSON inclui `gateway.version` quando o Gateway em execução a informa; `--require-rpc` pode recorrer ao payload RPC `status.runtimeVersion` se a sondagem de handshake subsequente não puder fornecer metadados de versão.
    - Use `--require-rpc` em scripts e automação quando um serviço em escuta não for suficiente e você também precisar que chamadas RPC com escopo de leitura estejam íntegras.
    - `--deep` adiciona uma verificação de melhor esforço por instalações extras de launchd/systemd/schtasks. Quando vários serviços semelhantes a gateway são detectados, a saída para humanos imprime dicas de limpeza e avisa que a maioria das configurações deve executar um gateway por máquina.
    - `--deep` também relata uma passagem recente de reinicialização do supervisor do Gateway quando o processo do serviço saiu de forma limpa para uma reinicialização por supervisor externo.
    - `--deep` executa validação de configuração em modo ciente de plugins (`pluginValidation: "full"`) e expõe avisos de manifestos de plugins configurados (por exemplo, metadados ausentes de configuração de canal), para que verificações smoke de instalação e atualização os capturem. O `gateway status` padrão mantém o caminho rápido somente leitura que ignora a validação de plugins.
    - A saída para humanos inclui o caminho resolvido do arquivo de log, além do snapshot dos caminhos/validade da configuração da CLI versus serviço, para ajudar a diagnosticar divergências de perfil ou diretório de estado.

  </Accordion>
  <Accordion title="Verificações de divergência de autenticação no systemd do Linux">
    - Em instalações Linux systemd, as verificações de divergência de autenticação do serviço leem valores `Environment=` e `EnvironmentFile=` da unidade (incluindo `%h`, caminhos entre aspas, vários arquivos e arquivos opcionais com `-`).
    - As verificações de divergência resolvem SecretRefs de `gateway.auth.token` usando o ambiente de runtime mesclado (primeiro o ambiente do comando do serviço, depois fallback para o ambiente do processo).
    - Se a autenticação por token não estiver efetivamente ativa (`gateway.auth.mode` explícito de `password`/`none`/`trusted-proxy`, ou modo não definido em que a senha pode prevalecer e nenhum candidato de token pode prevalecer), as verificações de divergência de token ignoram a resolução do token de configuração.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` é o comando para "depurar tudo". Ele sempre sonda:

- seu gateway remoto configurado (se definido), e
- localhost (loopback) **mesmo que o remoto esteja configurado**.

Se você passar `--url`, esse alvo explícito será adicionado antes de ambos. A saída para humanos rotula os alvos como:

- `URL (explicit)`
- `Remote (configured)` ou `Remote (configured, inactive)`
- `Local loopback`

<Note>
Se vários alvos de sondagem estiverem acessíveis, ele imprime todos eles. Um túnel SSH, uma URL TLS/proxy e uma URL remota configurada podem apontar para o mesmo gateway mesmo quando suas portas de transporte forem diferentes; `multiple_gateways` é reservado para gateways acessíveis distintos ou com identidade ambígua. Vários gateways são compatíveis quando você usa perfis isolados (por exemplo, um bot de resgate), mas a maioria das instalações ainda executa um único gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Use esta porta para o alvo de sondagem de local loopback e a porta remota do túnel SSH. Sem `--url`, isto seleciona o alvo de local loopback em vez da URL de ambiente do gateway configurado, da porta de ambiente ou dos alvos remotos.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretação">
    - `Reachable: yes` significa que pelo menos um alvo aceitou uma conexão WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` relata o que a sondagem conseguiu comprovar sobre autenticação. Isso é separado da acessibilidade.
    - `Read probe: ok` significa que chamadas RPC de detalhes com escopo de leitura (`health`/`status`/`system-presence`/`config.get`) também tiveram sucesso.
    - `Read probe: limited - missing scope: operator.read` significa que a conexão teve sucesso, mas a RPC com escopo de leitura está limitada. Isso é relatado como acessibilidade **degradada**, não como falha total.
    - `Read probe: failed` após `Connect: ok` significa que o Gateway aceitou a conexão WebSocket, mas os diagnósticos de leitura subsequentes excederam o tempo limite ou falharam. Isso também é acessibilidade **degradada**, não um Gateway inacessível.
    - Assim como `gateway status`, a sondagem reutiliza autenticação de dispositivo existente em cache, mas não cria identidade de dispositivo de primeiro uso nem estado de pareamento.
    - O código de saída é diferente de zero apenas quando nenhum alvo sondado está acessível.

  </Accordion>
  <Accordion title="Saída JSON">
    Nível superior:

    - `ok`: pelo menos um alvo está acessível.
    - `degraded`: pelo menos um alvo aceitou uma conexão, mas não concluiu todos os diagnósticos RPC de detalhes.
    - `capability`: melhor capacidade vista entre os alvos acessíveis (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` ou `unknown`).
    - `primaryTargetId`: melhor alvo a tratar como vencedor ativo nesta ordem: URL explícita, túnel SSH, remoto configurado e então local loopback.
    - `warnings[]`: registros de aviso de melhor esforço com `code`, `message` e `targetIds` opcional.
    - `network`: dicas de URL de local loopback/tailnet derivadas da configuração atual e da rede do host.
    - `discovery.timeoutMs` e `discovery.count`: o orçamento/contagem de resultados de descoberta reais usados nesta passagem de sondagem.

    Por alvo (`targets[].connect`):

    - `ok`: acessibilidade após conexão + classificação degradada.
    - `rpcOk`: sucesso completo da RPC de detalhes.
    - `scopeLimited`: a RPC de detalhes falhou devido à ausência de escopo de operador.

    Por alvo (`targets[].auth`):

    - `role`: função de autenticação relatada em `hello-ok` quando disponível.
    - `scopes`: escopos concedidos relatados em `hello-ok` quando disponíveis.
    - `capability`: a classificação de capacidade de autenticação exposta para esse alvo.

  </Accordion>
  <Accordion title="Códigos de aviso comuns">
    - `ssh_tunnel_failed`: a configuração do túnel SSH falhou; o comando voltou para sondagens diretas.
    - `multiple_gateways`: identidades de gateway distintas estavam acessíveis, ou o OpenClaw não conseguiu comprovar que os alvos acessíveis são o mesmo gateway. Um túnel SSH, URL de proxy ou URL remota configurada para o mesmo gateway não aciona este aviso.
    - `auth_secretref_unresolved`: uma SecretRef de autenticação configurada não pôde ser resolvida para um alvo com falha.
    - `probe_scope_limited`: a conexão WebSocket teve sucesso, mas a sondagem de leitura foi limitada pela ausência de `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remoto via SSH (paridade com o app para Mac)

O modo "Remote over SSH" do app macOS usa encaminhamento de porta local para que o gateway remoto (que pode estar vinculado apenas ao loopback) fique acessível em `ws://127.0.0.1:<port>`.

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
  Escolher o primeiro host de gateway descoberto como alvo SSH a partir do endpoint de descoberta resolvido (`local.` mais o domínio de longa distância configurado, se houver). Dicas apenas TXT são ignoradas.
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

Você também pode definir o wrapper pelo ambiente. `gateway install` valida que o caminho é
um arquivo executável, grava o wrapper em `ProgramArguments` do serviço e persiste
`OPENCLAW_WRAPPER` no ambiente do serviço para reinstalações forçadas, atualizações e reparos do doctor posteriores.

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
  <Accordion title="Comportamento do ciclo de vida">
    - Use `gateway restart` para reiniciar um serviço gerenciado. Não encadeie `gateway stop` e `gateway start` como substituto de reinicialização.
    - No macOS, `gateway stop` usa `launchctl bootout` por padrão, o que remove o LaunchAgent da sessão de inicialização atual sem persistir uma desativação — a recuperação automática KeepAlive permanece ativa para falhas futuras e `gateway start` reabilita corretamente sem um `launchctl enable` manual. Passe `--disable` para suprimir persistentemente KeepAlive e RunAtLoad, para que o gateway não renasça até o próximo `gateway start` explícito; use isso quando uma parada manual precisar sobreviver a reinicializações ou reinícios do sistema.
    - `gateway restart --safe` solicita ao Gateway em execução que faça uma pré-verificação do trabalho ativo do OpenClaw e adie a reinicialização até que a entrega de respostas, execuções incorporadas e execuções de tarefas sejam drenadas. `--safe` não pode ser combinado com `--force` ou `--wait`.
    - `gateway restart --wait 30s` substitui o orçamento configurado de drenagem de reinicialização para essa reinicialização. Números sem unidade são milissegundos; unidades como `s`, `m` e `h` são aceitas. `--wait 0` aguarda indefinidamente.
    - `gateway restart --safe --skip-deferral` executa a reinicialização segura ciente do OpenClaw, mas ignora o gate de adiamento para que o Gateway emita a reinicialização imediatamente mesmo quando bloqueadores forem relatados. Escotilha de escape do operador para adiamentos de execução de tarefa travados; requer `--safe`.
    - `gateway restart --force` ignora a drenagem de trabalho ativo e reinicia imediatamente. Use quando um operador já tiver inspecionado os bloqueadores de tarefa listados e quiser o gateway de volta agora.
    - Comandos de ciclo de vida aceitam `--json` para scripting.

  </Accordion>
  <Accordion title="Auth e SecretRefs no momento da instalação">
    - Quando a autenticação por token exige um token e `gateway.auth.token` é gerenciado por SecretRef, `gateway install` valida que o SecretRef pode ser resolvido, mas não persiste o token resolvido nos metadados de ambiente do serviço.
    - Se a autenticação por token exigir um token e o SecretRef de token configurado não puder ser resolvido, a instalação falha de modo fechado em vez de persistir texto simples de fallback.
    - Para autenticação por senha em `gateway run`, prefira `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` ou um `gateway.auth.password` apoiado por SecretRef em vez de `--password` inline.
    - No modo de autenticação inferido, `OPENCLAW_GATEWAY_PASSWORD` somente no shell não relaxa os requisitos de token na instalação; use configuração durável (`gateway.auth.password` ou config `env`) ao instalar um serviço gerenciado.
    - Se tanto `gateway.auth.token` quanto `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação será bloqueada até que o modo seja definido explicitamente.

  </Accordion>
</AccordionGroup>

## Descobrir gateways (Bonjour)

`gateway discover` procura beacons do Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour de área ampla): escolha um domínio (exemplo: `openclaw.internal.`) e configure DNS dividido + um servidor DNS; veja [Bonjour](/pt-BR/gateway/bonjour).

Somente gateways com descoberta Bonjour habilitada (padrão) anunciam o beacon.

Registros de descoberta de área ampla podem incluir estas dicas TXT:

- `role` (dica de função do gateway)
- `transport` (dica de transporte, por exemplo `gateway`)
- `gatewayPort` (porta WebSocket, geralmente `18789`)
- `sshPort` (somente modo de descoberta completo; clientes usam alvos SSH padrão em `22` quando ausente)
- `tailnetDns` (nome de host MagicDNS, quando disponível)
- `gatewayTls` / `gatewayTlsSha256` (TLS habilitado + impressão digital do certificado)
- `cliPath` (somente modo de descoberta completo)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Tempo limite por comando (navegação/resolução).
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
- A CLI verifica `local.` mais o domínio de área ampla configurado quando um está habilitado.
- `wsUrl` na saída JSON é derivado do endpoint de serviço resolvido, não de dicas somente TXT como `lanHost` ou `tailnetDns`.
- Em mDNS `local.` e DNS-SD de área ampla, `sshPort` e `cliPath` só são publicados quando `discovery.mdns.mode` é `full`.

</Note>

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Runbook do Gateway](/pt-BR/gateway)
