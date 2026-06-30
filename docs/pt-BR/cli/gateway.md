---
read_when:
    - Executando o Gateway pela CLI (desenvolvimento ou servidores)
    - Depuração de autenticação do Gateway, modos de vinculação e conectividade
    - Descobrindo Gateways via Bonjour (DNS-SD local + de área ampla)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — execute, consulte e descubra gateways
title: Gateway
x-i18n:
    generated_at: "2026-06-30T13:53:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c33900a9bdc61c1e922e424dbfce139c6591a7a5071ed8263b172e19bdf653b
    source_path: cli/gateway.md
    workflow: 16
---

O Gateway é o servidor WebSocket do OpenClaw (canais, nós, sessões, hooks). Os subcomandos nesta página ficam em `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Descoberta Bonjour" href="/pt-BR/gateway/bonjour">
    Configuração de mDNS local + DNS-SD de área ampla.
  </Card>
  <Card title="Visão geral de descoberta" href="/pt-BR/gateway/discovery">
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
    - Por padrão, o Gateway se recusa a iniciar, a menos que `gateway.mode=local` esteja definido em `~/.openclaw/openclaw.json`. Use `--allow-unconfigured` para execuções ad-hoc/de desenvolvimento.
    - Espera-se que `openclaw onboard --mode local` e `openclaw setup` gravem `gateway.mode=local`. Se o arquivo existir, mas `gateway.mode` estiver ausente, trate isso como uma configuração quebrada ou sobrescrita e repare-a em vez de assumir implicitamente o modo local.
    - Se o arquivo existir e `gateway.mode` estiver ausente, o Gateway trata isso como dano suspeito à configuração e se recusa a "adivinhar local" por você.
    - Vincular além do loopback sem autenticação é bloqueado (medida de segurança).
    - `lan`, `tailnet` e `custom` atualmente resolvem por caminhos BYOH somente IPv4.
    - BYOH somente IPv6 não é compatível nativamente neste caminho hoje. Use um sidecar ou proxy IPv4 se o próprio host for somente IPv6.
    - `SIGUSR1` aciona uma reinicialização em processo quando autorizado (`commands.restart` é habilitado por padrão; defina `commands.restart: false` para bloquear a reinicialização manual, enquanto aplicar/atualizar ferramenta/configuração do gateway permanece permitido).
    - Os handlers de `SIGINT`/`SIGTERM` param o processo do gateway, mas não restauram nenhum estado personalizado do terminal. Se você encapsular a CLI com uma TUI ou entrada em modo raw, restaure o terminal antes de sair.

  </Accordion>
</AccordionGroup>

### Opções

<ParamField path="--port <port>" type="number">
  Porta WebSocket (o padrão vem da configuração/env; normalmente `18789`).
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
  Espera um endereço IPv4 hoje. Para BYOH somente IPv6, coloque um sidecar ou proxy IPv4 na frente do Gateway e aponte o OpenClaw para esse endpoint IPv4.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Permitir que o gateway inicie sem `gateway.mode=local` na configuração. Ignora a proteção de inicialização apenas para bootstrap ad-hoc/de desenvolvimento; não grava nem repara o arquivo de configuração.
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
  Mostrar apenas logs de backend da CLI no console (e habilitar stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Estilo de log WebSocket.
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

`openclaw gateway restart --safe` solicita ao Gateway em execução que faça o preflight do trabalho ativo e agende uma reinicialização coalescida depois que o trabalho ativo esvaziar. A reinicialização segura padrão espera pelo trabalho ativo até o `gateway.reload.deferralTimeoutMs` configurado (padrão de 5 minutos); quando esse orçamento expira, a reinicialização é forçada. Defina `gateway.reload.deferralTimeoutMs` como `0` para uma espera segura indefinida que nunca força. `restart` simples mantém o comportamento existente do gerenciador de serviço; `--force` continua sendo o caminho de substituição imediata.

`openclaw gateway restart --safe --skip-deferral` executa a mesma reinicialização coordenada ciente do OpenClaw que `--safe`, mas ignora a barreira de adiamento de trabalho ativo para que o Gateway emita a reinicialização imediatamente, mesmo quando bloqueadores são relatados. Use-o como a saída de emergência do operador quando um adiamento tiver sido travado por uma execução de tarefa presa e `--safe` sozinho puder ficar limitado por `gateway.reload.deferralTimeoutMs`. `--skip-deferral` requer `--safe`.

<Warning>
`--password` inline pode ser exposto em listagens de processos locais. Prefira `--password-file`, env ou um `gateway.auth.password` apoiado por SecretRef.
</Warning>

### Perfilamento do Gateway

- Defina `OPENCLAW_GATEWAY_STARTUP_TRACE=1` para registrar temporizações de fases durante a inicialização do Gateway, incluindo atraso `eventLoopMax` por fase e temporizações da tabela de consulta de Plugins para índice instalado, registro de manifesto, planejamento de inicialização e trabalho de mapa de proprietário.
- Defina `OPENCLAW_GATEWAY_RESTART_TRACE=1` para registrar linhas `restart trace:` com escopo de reinicialização para tratamento de sinal de reinicialização, esvaziamento de trabalho ativo, fases de desligamento, próxima inicialização, temporização de prontidão e métricas de memória.
- Defina `OPENCLAW_DIAGNOSTICS=timeline` com `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` para gravar uma linha do tempo de diagnósticos de inicialização JSONL de melhor esforço para harnesses externos de QA. Você também pode habilitar a flag com `diagnostics.flags: ["timeline"]` na configuração; o caminho ainda é fornecido por env. Adicione `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` para incluir amostras do loop de eventos.
- Execute `pnpm build` primeiro, depois `pnpm test:startup:gateway -- --runs 5 --warmup 1` para medir a inicialização do Gateway em relação à entrada da CLI compilada. O benchmark registra a primeira saída do processo, `/healthz`, `/readyz`, temporizações de rastreamento de inicialização, atraso do loop de eventos e detalhes de temporização da tabela de consulta de Plugins.
- Execute `pnpm build` primeiro, depois `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` para medir a reinicialização em processo do Gateway em relação à entrada da CLI compilada no macOS ou Linux. O benchmark de reinicialização usa SIGUSR1, habilita rastreamentos de inicialização e reinicialização no processo filho e registra próximo `/healthz`, próximo `/readyz`, tempo de inatividade, temporização de prontidão, CPU, RSS e métricas de rastreamento de reinicialização.
- Trate `/healthz` como vivacidade e `/readyz` como prontidão utilizável. Linhas de rastreamento e saída de benchmark servem para atribuição de proprietário; não trate um intervalo de rastreamento ou uma amostra como uma conclusão completa de desempenho.

## Consultar um Gateway em execução

Todos os comandos de consulta usam RPC WebSocket.

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
    - `--expect-final`: esperar uma resposta "final" (chamadas de agente).

  </Tab>
</Tabs>

<Note>
Quando você define `--url`, a CLI não recorre a credenciais da configuração ou do ambiente. Passe `--token` ou `--password` explicitamente. Credenciais explícitas ausentes são um erro.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

O endpoint HTTP `/healthz` é uma sondagem de vivacidade: ele retorna assim que o servidor consegue responder HTTP. O endpoint HTTP `/readyz` é mais rigoroso e permanece vermelho enquanto sidecars de Plugins de inicialização, canais ou hooks configurados ainda estão se estabilizando. Respostas detalhadas de prontidão locais ou autenticadas incluem um bloco de diagnóstico `eventLoop` com atraso do loop de eventos, utilização do loop de eventos, proporção de núcleos de CPU e uma flag `degraded`.

<ParamField path="--port <port>" type="number">
  Apontar para um Gateway local loopback nesta porta. Isso substitui `OPENCLAW_GATEWAY_URL` e `OPENCLAW_GATEWAY_PORT` para a chamada de saúde.
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
  Restringir o resumo de custos a um id de agente configurado.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Agregar o resumo de custos em todos os agentes configurados. Não pode ser combinado com `--agent`.
</ParamField>

### `gateway stability`

Buscar o gravador de estabilidade diagnóstica recente de um Gateway em execução.

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
  Filtrar por tipo de evento diagnóstico, como `payload.large` ou `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Incluir apenas eventos após um número de sequência diagnóstica.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Ler um pacote de estabilidade persistido em vez de chamar o Gateway em execução. Use `--bundle latest` (ou apenas `--bundle`) para o pacote mais novo no diretório de estado, ou passe diretamente um caminho de JSON de pacote.
</ParamField>
<ParamField path="--export" type="boolean">
  Gravar um zip compartilhável de diagnósticos de suporte em vez de imprimir detalhes de estabilidade.
</ParamField>
<ParamField path="--output <path>" type="string">
  Caminho de saída para `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacidade e comportamento de pacote">
    - Os registros mantêm metadados operacionais: nomes de eventos, contagens, tamanhos em bytes, leituras de memória, estado de fila/sessão, nomes de canal/Plugin e resumos de sessão redigidos. Eles não mantêm texto de chat, corpos de Webhook, saídas de ferramentas, corpos brutos de solicitação ou resposta, tokens, cookies, valores secretos, nomes de host ou ids brutos de sessão. Defina `diagnostics.enabled: false` para desabilitar totalmente o gravador.
    - Em saídas fatais do Gateway, timeouts de desligamento e falhas de inicialização de reinicialização, o OpenClaw grava o mesmo snapshot diagnóstico em `~/.openclaw/logs/stability/openclaw-stability-*.json` quando o gravador tem eventos. Inspecione o pacote mais novo com `openclaw gateway stability --bundle latest`; `--limit`, `--type` e `--since-seq` também se aplicam à saída de pacote.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Gravar um zip local de diagnósticos projetado para anexar a relatórios de bug. Para o modelo de privacidade e o conteúdo do pacote, consulte [Exportação de Diagnósticos](/pt-BR/gateway/diagnostics).

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
  URL WebSocket do Gateway para o instantâneo de integridade.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token do Gateway para o instantâneo de integridade.
</ParamField>
<ParamField path="--password <password>" type="string">
  Senha do Gateway para o instantâneo de integridade.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Tempo limite do instantâneo de status/integridade.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Ignorar a busca pelo pacote de estabilidade persistido.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprimir o caminho gravado, o tamanho e o manifesto como JSON.
</ParamField>

A exportação contém um manifesto, um resumo em Markdown, o formato da configuração, detalhes de configuração sanitizados, resumos de log sanitizados, instantâneos sanitizados de status/integridade do Gateway e o pacote de estabilidade mais recente quando existir.

Ela foi feita para ser compartilhada. Mantém detalhes operacionais que ajudam na depuração, como campos seguros de log do OpenClaw, nomes de subsistemas, códigos de status, durações, modos configurados, portas, ids de plugin, ids de provedores, configurações de recursos não secretas e mensagens de log operacional redigidas. Ela omite ou redige texto de chat, corpos de Webhook, saídas de ferramentas, credenciais, cookies, identificadores de conta/mensagem, texto de prompt/instruções, nomes de host e valores secretos. Quando uma mensagem no estilo LogTape parece texto de payload de usuário/chat/ferramenta, a exportação mantém apenas que uma mensagem foi omitida e sua contagem de bytes.

### `gateway status`

`gateway status` mostra o serviço Gateway (launchd/systemd/schtasks) mais uma sondagem opcional de conectividade/capacidade de autenticação.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Adicionar um alvo de sondagem explícito. O remoto configurado + localhost ainda são sondados.
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
  Ignorar a sondagem de conectividade (visão somente do serviço).
</ParamField>
<ParamField path="--deep" type="boolean">
  Verificar também serviços em nível de sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Promover a sondagem de conectividade padrão para uma sondagem de leitura e sair com código diferente de zero quando essa sondagem de leitura falhar. Não pode ser combinado com `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semântica de status">
    - `gateway status` continua disponível para diagnósticos mesmo quando a configuração local da CLI está ausente ou inválida.
    - O `gateway status` padrão comprova o estado do serviço, a conexão WebSocket e a capacidade de autenticação visível no momento do handshake. Ele não comprova operações de leitura/gravação/administração.
    - As sondagens de diagnóstico não fazem mutações para autenticação de dispositivo pela primeira vez: elas reutilizam um token de dispositivo em cache existente quando houver um, mas não criam uma nova identidade de dispositivo da CLI nem um registro de pareamento de dispositivo somente leitura apenas para verificar o status.
    - `gateway status` resolve SecretRefs de autenticação configuradas para autenticação da sondagem quando possível.
    - Se uma SecretRef de autenticação obrigatória não for resolvida neste caminho de comando, `gateway status --json` relata `rpc.authWarning` quando a conectividade/autenticação da sondagem falha; passe `--token`/`--password` explicitamente ou resolva primeiro a fonte do segredo.
    - Se a sondagem tiver sucesso, avisos de referência de autenticação não resolvida são suprimidos para evitar falsos positivos.
    - Quando a sondagem está habilitada, a saída JSON inclui `gateway.version` quando o Gateway em execução a informa; `--require-rpc` pode recorrer ao payload RPC `status.runtimeVersion` se a sondagem de handshake seguinte não puder fornecer metadados de versão.
    - Use `--require-rpc` em scripts e automação quando um serviço escutando não for suficiente e você também precisar que chamadas RPC com escopo de leitura estejam saudáveis.
    - `--deep` adiciona uma verificação de melhor esforço para instalações extras de launchd/systemd/schtasks. Quando vários serviços semelhantes ao gateway são detectados, a saída humana imprime dicas de limpeza e avisa que a maioria das configurações deve executar um gateway por máquina.
    - `--deep` também relata uma transferência recente de reinicialização do supervisor do Gateway quando o processo do serviço saiu de forma limpa para uma reinicialização de supervisor externo.
    - `--deep` executa validação de configuração em modo ciente de plugin (`pluginValidation: "full"`) e expõe avisos de manifesto de plugin configurado (por exemplo, metadados de configuração de canal ausentes) para que verificações de instalação e atualização os capturem. O `gateway status` padrão mantém o caminho rápido somente leitura que ignora a validação de plugin.
    - A saída humana inclui o caminho resolvido do arquivo de log, além do instantâneo de caminhos/validade da configuração da CLI versus serviço, para ajudar a diagnosticar desvios de perfil ou diretório de estado.

  </Accordion>
  <Accordion title="Verificações de desvio de autenticação do systemd no Linux">
    - Em instalações Linux systemd, as verificações de desvio de autenticação do serviço leem os valores `Environment=` e `EnvironmentFile=` da unidade (incluindo `%h`, caminhos entre aspas, vários arquivos e arquivos opcionais com `-`).
    - As verificações de desvio resolvem SecretRefs de `gateway.auth.token` usando o ambiente de runtime mesclado (primeiro o ambiente do comando de serviço, depois fallback para o ambiente do processo).
    - Se a autenticação por token não estiver efetivamente ativa (`gateway.auth.mode` explícito de `password`/`none`/`trusted-proxy`, ou modo não definido em que a senha pode vencer e nenhum candidato a token pode vencer), as verificações de desvio de token ignoram a resolução do token de configuração.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` é o comando de "depurar tudo". Ele sempre sonda:

- seu gateway remoto configurado (se definido), e
- localhost (loopback) **mesmo que o remoto esteja configurado**.

Se você passar `--url`, esse alvo explícito será adicionado antes dos dois. A saída humana rotula os alvos como:

- `URL (explicit)`
- `Remote (configured)` ou `Remote (configured, inactive)`
- `Local loopback`

<Note>
Se vários alvos de sondagem estiverem acessíveis, ele imprime todos. Um túnel SSH, URL TLS/proxy e URL remota configurada podem apontar para o mesmo gateway mesmo quando suas portas de transporte diferem; `multiple_gateways` é reservado para gateways acessíveis distintos ou com identidade ambígua. Múltiplos gateways são compatíveis quando você usa perfis isolados (por exemplo, um bot de resgate), mas a maioria das instalações ainda executa um único gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Usar esta porta para o alvo de sondagem local loopback e a porta remota do túnel SSH. Sem `--url`, isto seleciona o alvo local loopback em vez da URL de ambiente do gateway configurado, da porta de ambiente ou de alvos remotos.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretação">
    - `Reachable: yes` significa que pelo menos um alvo aceitou uma conexão WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` relata o que a sondagem conseguiu comprovar sobre autenticação. Isso é separado da acessibilidade.
    - `Read probe: ok` significa que chamadas RPC detalhadas com escopo de leitura (`health`/`status`/`system-presence`/`config.get`) também tiveram sucesso.
    - `Read probe: limited - missing scope: operator.read` significa que a conexão teve sucesso, mas o RPC com escopo de leitura está limitado. Isso é relatado como acessibilidade **degradada**, não falha total.
    - `Read probe: failed` depois de `Connect: ok` significa que o Gateway aceitou a conexão WebSocket, mas os diagnósticos de leitura seguintes expiraram ou falharam. Isso também é acessibilidade **degradada**, não um Gateway inacessível.
    - Assim como `gateway status`, a sondagem reutiliza autenticação de dispositivo em cache existente, mas não cria identidade de dispositivo pela primeira vez nem estado de pareamento.
    - O código de saída só é diferente de zero quando nenhum alvo sondado está acessível.

  </Accordion>
  <Accordion title="Saída JSON">
    Nível superior:

    - `ok`: pelo menos um alvo está acessível.
    - `degraded`: pelo menos um alvo aceitou uma conexão, mas não concluiu diagnósticos RPC detalhados completos.
    - `capability`: melhor capacidade vista entre alvos acessíveis (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` ou `unknown`).
    - `primaryTargetId`: melhor alvo a tratar como o vencedor ativo nesta ordem: URL explícita, túnel SSH, remoto configurado, depois local loopback.
    - `warnings[]`: registros de aviso de melhor esforço com `code`, `message` e `targetIds` opcionais.
    - `network`: dicas de URL local loopback/tailnet derivadas da configuração atual e da rede do host.
    - `discovery.timeoutMs` e `discovery.count`: o orçamento real de descoberta/contagem de resultados usado para esta passagem de sondagem.

    Por alvo (`targets[].connect`):

    - `ok`: acessibilidade após conexão + classificação degradada.
    - `rpcOk`: sucesso total do RPC detalhado.
    - `scopeLimited`: o RPC detalhado falhou devido à ausência de escopo de operador.

    Por alvo (`targets[].auth`):

    - `role`: papel de autenticação relatado em `hello-ok` quando disponível.
    - `scopes`: escopos concedidos relatados em `hello-ok` quando disponíveis.
    - `capability`: a classificação de capacidade de autenticação exposta para esse alvo.

  </Accordion>
  <Accordion title="Códigos de aviso comuns">
    - `ssh_tunnel_failed`: a configuração do túnel SSH falhou; o comando recorreu a sondagens diretas.
    - `multiple_gateways`: identidades de gateway distintas estavam acessíveis, ou o OpenClaw não conseguiu comprovar que os alvos acessíveis são o mesmo gateway. Um túnel SSH, URL de proxy ou URL remota configurada para o mesmo gateway não dispara este aviso.
    - `auth_secretref_unresolved`: uma SecretRef de autenticação configurada não pôde ser resolvida para um alvo com falha.
    - `probe_scope_limited`: a conexão WebSocket teve sucesso, mas a sondagem de leitura foi limitada pela ausência de `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remoto via SSH (paridade com o app para Mac)

O modo "Remote over SSH" do app macOS usa um encaminhamento de porta local para que o gateway remoto (que pode estar vinculado apenas a loopback) fique acessível em `ws://127.0.0.1:<port>`.

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
  Escolher o primeiro host de gateway descoberto como alvo SSH a partir do endpoint de descoberta resolvido (`local.` mais o domínio de longa distância configurado, se houver). Dicas somente TXT são ignoradas.
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

Use `--wrapper` quando o serviço gerenciado precisar iniciar por meio de outro executável, por exemplo, um
shim de gerenciador de segredos ou um auxiliar de execução como outro usuário. O wrapper recebe os argumentos normais do Gateway e é
responsável por eventualmente executar via exec o `openclaw` ou o Node com esses argumentos.

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
    - No macOS, `gateway stop` usa `launchctl bootout` por padrão, o que remove o LaunchAgent da sessão de inicialização atual sem persistir uma desativação — a recuperação automática do KeepAlive permanece ativa para falhas futuras, e `gateway start` reabilita tudo corretamente sem um `launchctl enable` manual. Passe `--disable` para suprimir persistentemente o KeepAlive e o RunAtLoad, de modo que o Gateway não reinicie até o próximo `gateway start` explícito; use isso quando uma parada manual precisar sobreviver a reinicializações ou reinícios do sistema.
    - `gateway restart --safe` solicita ao Gateway em execução que faça uma pré-verificação do trabalho ativo e agende uma reinicialização consolidada após a drenagem do trabalho ativo. A reinicialização segura padrão aguarda o trabalho ativo até o `gateway.reload.deferralTimeoutMs` configurado (padrão de 5 minutos); quando esse orçamento expira, a reinicialização é forçada. Defina `gateway.reload.deferralTimeoutMs` como `0` para uma espera segura indefinida que nunca força. `--safe` não pode ser combinado com `--force` ou `--wait`.
    - `gateway restart --wait 30s` substitui o orçamento configurado de drenagem de reinicialização para essa reinicialização. Números sem unidade são milissegundos; unidades como `s`, `m` e `h` são aceitas. `--wait 0` aguarda indefinidamente.
    - `gateway restart --safe --skip-deferral` executa a reinicialização segura ciente do OpenClaw, mas ignora o gate de adiamento para que o Gateway emita a reinicialização imediatamente, mesmo quando bloqueadores forem informados. É uma saída de emergência para operadores em adiamentos de execuções de tarefas travadas; requer `--safe`.
    - `gateway restart --force` ignora a drenagem de trabalho ativo e reinicia imediatamente. Use quando um operador já tiver inspecionado os bloqueadores de tarefa listados e quiser o gateway de volta agora.
    - Comandos de ciclo de vida aceitam `--json` para scripts.

  </Accordion>
  <Accordion title="Autenticação e SecretRefs no momento da instalação">
    - Quando a autenticação por token exige um token e `gateway.auth.token` é gerenciado por SecretRef, `gateway install` valida que a SecretRef pode ser resolvida, mas não persiste o token resolvido nos metadados de ambiente do serviço.
    - Se a autenticação por token exigir um token e a SecretRef de token configurada não for resolvida, a instalação falha de forma fechada em vez de persistir texto simples de fallback.
    - Para autenticação por senha em `gateway run`, prefira `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` ou `gateway.auth.password` com SecretRef em vez de `--password` inline.
    - No modo de autenticação inferido, `OPENCLAW_GATEWAY_PASSWORD` definido apenas no shell não relaxa os requisitos de token da instalação; use configuração durável (`gateway.auth.password` ou `env` da configuração) ao instalar um serviço gerenciado.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação será bloqueada até que o modo seja definido explicitamente.

  </Accordion>
</AccordionGroup>

## Descobrir gateways (Bonjour)

`gateway discover` procura beacons de Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour de área ampla): escolha um domínio (exemplo: `openclaw.internal.`) e configure DNS dividido + um servidor DNS; consulte [Bonjour](/pt-BR/gateway/bonjour).

Somente gateways com descoberta Bonjour habilitada (padrão) anunciam o beacon.

Registros de descoberta de área ampla podem incluir estas dicas TXT:

- `role` (dica de função do gateway)
- `transport` (dica de transporte, por exemplo, `gateway`)
- `gatewayPort` (porta WebSocket, geralmente `18789`)
- `sshPort` (somente modo de descoberta completo; clientes usam `22` como destino SSH padrão quando ausente)
- `tailnetDns` (hostname MagicDNS, quando disponível)
- `gatewayTls` / `gatewayTlsSha256` (TLS habilitado + impressão digital do certificado)
- `cliPath` (somente modo de descoberta completo)

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
- A CLI varre `local.` mais o domínio de área ampla configurado quando algum está habilitado.
- `wsUrl` na saída JSON é derivado do endpoint de serviço resolvido, não de dicas somente TXT como `lanHost` ou `tailnetDns`.
- Em mDNS `local.` e DNS-SD de área ampla, `sshPort` e `cliPath` só são publicados quando `discovery.mdns.mode` é `full`.

</Note>

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Runbook do Gateway](/pt-BR/gateway)
