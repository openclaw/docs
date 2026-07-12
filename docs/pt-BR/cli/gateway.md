---
read_when:
    - Executando o Gateway pela CLI (desenvolvimento ou servidores)
    - Depuração da autenticação do Gateway, dos modos de vinculação e da conectividade
    - Descoberta de gateways via Bonjour (DNS-SD local + de longa distância)
sidebarTitle: Gateway
summary: CLI do Gateway do OpenClaw (`openclaw gateway`) — execute, consulte e descubra gateways
title: Gateway
x-i18n:
    generated_at: "2026-07-11T23:50:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75f8f4bebe585b213f486f08bf20015aeb89ca4d179f6d96c1008ec9d1cd00ea
    source_path: cli/gateway.md
    workflow: 16
---

O Gateway é o servidor WebSocket do OpenClaw (canais, Nodes, sessões, hooks). Todos os subcomandos abaixo ficam em `openclaw gateway ...`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/pt-BR/gateway/bonjour">
    Configuração de mDNS local + DNS-SD de longa distância.
  </Card>
  <Card title="Discovery overview" href="/pt-BR/gateway/discovery">
    Como o OpenClaw anuncia e encontra gateways.
  </Card>
  <Card title="Configuration" href="/pt-BR/gateway/configuration">
    Chaves de configuração de nível superior do Gateway.
  </Card>
</CardGroup>

## Executar o Gateway

```bash
openclaw gateway
openclaw gateway run   # equivalent, explicit form
```

<AccordionGroup>
  <Accordion title="Startup behavior">
    - Recusa-se a iniciar, a menos que `gateway.mode=local` esteja definido em `~/.openclaw/openclaw.json`. Use `--allow-unconfigured` para execuções avulsas/de desenvolvimento; isso ignora a proteção sem gravar nem reparar a configuração.
    - `openclaw onboard --mode local` e `openclaw setup` gravam `gateway.mode=local`. Se o arquivo de configuração existir, mas `gateway.mode` estiver ausente, isso será tratado como uma configuração danificada/sobrescrita, e o Gateway se recusará a presumir `local` — execute a integração inicial novamente, defina a chave manualmente ou passe `--allow-unconfigured`.
    - A vinculação além da interface de loopback sem autenticação é bloqueada.
    - Atualmente, os valores `lan`, `tailnet` e `custom` de `--bind` são resolvidos somente por caminhos IPv4; configurações com host próprio apenas IPv6 precisam de um serviço auxiliar IPv4 ou proxy à frente do Gateway.
    - `SIGUSR1` aciona uma reinicialização no processo quando autorizado. `commands.restart` (padrão: ativado) controla o `SIGUSR1` enviado externamente; defina-o como `false` para bloquear reinicializações manuais por sinal do sistema operacional, mantendo permitidas as reinicializações pelo comando `gateway restart`, pela ferramenta do Gateway e pela aplicação/atualização da configuração.
    - `SIGINT`/`SIGTERM` interrompem o processo, mas não restauram o estado personalizado do terminal — se você encapsular a CLI em uma TUI ou entrada em modo bruto, restaure o terminal por conta própria antes de sair.

  </Accordion>
</AccordionGroup>

### Opções

<ParamField path="--port <port>" type="number">
  Porta WebSocket (padrão obtido da configuração/variável de ambiente; geralmente `18789`).
</ParamField>
<ParamField path="--bind <mode>" type="string">
  Modo de vinculação: `loopback` (padrão), `lan`, `tailnet`, `auto`, `custom`.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token compartilhado para `connect.params.auth.token`. O padrão é `OPENCLAW_GATEWAY_TOKEN` quando definido.
</ParamField>
<ParamField path="--auth <mode>" type="string">
  Modo de autenticação: `none`, `token`, `password`, `trusted-proxy`.
</ParamField>
<ParamField path="--password <password>" type="string">
  Senha para `--auth password`.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Lê a senha do Gateway de um arquivo.
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Exposição pelo Tailscale: `off`, `serve`, `funnel`.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Redefine a configuração serve/funnel do Tailscale ao encerrar.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Inicia sem exigir `gateway.mode=local`. Somente para inicialização avulsa/de desenvolvimento; não persiste nem repara a configuração.
</ParamField>
<ParamField path="--dev" type="boolean">
  Cria uma configuração + espaço de trabalho de desenvolvimento caso estejam ausentes (ignora `BOOTSTRAP.md`).
</ParamField>
<ParamField path="--reset" type="boolean">
  Redefine a configuração de desenvolvimento, as credenciais, as sessões e o espaço de trabalho. Requer `--dev`.
</ParamField>
<ParamField path="--force" type="boolean">
  Encerra qualquer processo existente que esteja escutando na porta de destino antes de iniciar.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Registro detalhado em stdout/stderr.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Exibe somente os registros do backend da CLI no console (também ativa stdout/stderr).
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  Estilo do registro WebSocket: `auto`, `full`, `compact`.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias para `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Registra eventos brutos do fluxo do modelo em JSONL.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Caminho do JSONL do fluxo bruto.
</ParamField>

`--claude-cli-logs` é um alias obsoleto para `--cli-backend-logs`.

Para `--bind custom`, defina `gateway.customBindHost` como um endereço IPv4. Qualquer endereço diferente de `127.0.0.1` ou `0.0.0.0` também exige `127.0.0.1` na mesma porta para clientes no mesmo host; a inicialização falhará se qualquer um dos processos de escuta não puder se vincular. O curinga `0.0.0.0` não adiciona um alias obrigatório separado. Configurações com host próprio apenas IPv6 precisam de um serviço auxiliar IPv4 ou proxy à frente do Gateway.

## Reiniciar o Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` solicita ao Gateway em execução que faça uma verificação prévia do trabalho ativo e agende uma única reinicialização consolidada depois que esse trabalho terminar. A espera é limitada por `gateway.reload.deferralTimeoutMs` (padrão: 5 minutos/`300000`); quando o limite expira, a reinicialização é forçada. Defina `deferralTimeoutMs: 0` para esperar indefinidamente (com avisos periódicos de pendência) em vez de forçar. `--safe` não pode ser combinado com `--force` nem `--wait`.

`--skip-deferral` ignora a etapa de adiamento por trabalho ativo em uma reinicialização segura, portanto o Gateway reinicia imediatamente mesmo que haja bloqueios relatados. Requer `--safe` — use quando um adiamento estiver travado em uma tarefa descontrolada.

`--wait <duration>` substitui o limite de espera pela conclusão do trabalho em uma reinicialização comum (não segura). Aceita milissegundos sem unidade ou os sufixos `ms`, `s`, `m`, `h`, `d` (por exemplo, `30s`, `5m`, `1h30m`); `--wait 0` espera indefinidamente. Não é compatível com `--force` nem `--safe`.

`--force` ignora a espera pela conclusão do trabalho ativo e reinicia imediatamente. O comando `restart` comum (sem flags) mantém o comportamento existente de reinicialização pelo gerenciador de serviços.

<Warning>
O uso de `--password` diretamente na linha de comando pode expor a senha nas listagens locais de processos. Prefira `--password-file`, uma variável de ambiente ou um `gateway.auth.password` respaldado por SecretRef.
</Warning>

### Criação de perfil do Gateway

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` registra os tempos das fases durante a inicialização, incluindo o atraso `eventLoopMax` de cada fase e os tempos das tabelas de consulta de plugins (índice de instalados, registro de manifestos, planejamento da inicialização e processamento do mapa de proprietários).
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` registra linhas `restart trace:` referentes à reinicialização: tratamento de sinais, espera pela conclusão do trabalho ativo, fases de encerramento, próxima inicialização, tempo até ficar pronto e métricas de memória.
- `OPENCLAW_DIAGNOSTICS=timeline` com `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` grava, em caráter de melhor esforço, uma linha do tempo de diagnóstico da inicialização em JSONL para sistemas externos de QA (equivalente à configuração `diagnostics.flags: ["timeline"]`; o caminho continua disponível somente por variável de ambiente). Adicione `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` para incluir amostras do loop de eventos.
- Execute `pnpm build` e depois `pnpm test:startup:gateway -- --runs 5 --warmup 1` para medir o desempenho da inicialização do Gateway usando o ponto de entrada compilado da CLI: primeira saída do processo, `/healthz`, `/readyz`, tempos de rastreamento da inicialização, atraso do loop de eventos e tempo das tabelas de consulta de plugins.
- Execute `pnpm build` e depois `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` para medir o desempenho da reinicialização no processo no macOS ou Linux (não há suporte no Windows; a reinicialização requer `SIGUSR1`). Usa `SIGUSR1`, ativa ambos os rastreamentos no processo filho e registra o próximo `/healthz`, o próximo `/readyz`, o período de indisponibilidade, o tempo até ficar pronto, CPU, RSS e métricas do rastreamento da reinicialização.
- `/healthz` indica atividade; `/readyz` indica prontidão para uso. Trate as linhas de rastreamento e a saída da medição de desempenho como sinais para atribuição ao componente responsável, não como uma conclusão completa de desempenho baseada em um único intervalo ou amostra.

## Consultar um Gateway em execução

Todos os comandos de consulta usam RPC via WebSocket.

<Tabs>
  <Tab title="Output modes">
    - Padrão: legível por pessoas (colorido em TTY).
    - `--json`: JSON legível por máquina (sem estilo/indicador de progresso).
    - `--no-color` (ou `NO_COLOR=1`): desativa ANSI mantendo a disposição legível por pessoas.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: URL WebSocket do Gateway.
    - `--token <token>`: token do Gateway.
    - `--password <password>`: senha do Gateway.
    - `--timeout <ms>`: tempo limite/orçamento (o padrão varia por comando; consulte cada comando abaixo).
    - `--expect-final`: aguarda uma resposta "final" (chamadas de agente).

  </Tab>
</Tabs>

<Note>
Quando você define `--url`, a CLI não recorre às credenciais da configuração nem das variáveis de ambiente. Passe `--token` ou `--password` explicitamente. A ausência de credenciais explícitas é um erro.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` é uma sondagem de atividade: retorna assim que o servidor consegue responder via HTTP. `/readyz` é mais rigoroso e permanece indicando indisponibilidade enquanto os processos auxiliares de plugins, canais ou hooks configurados ainda estiverem sendo preparados durante a inicialização. Respostas detalhadas locais ou autenticadas de `/readyz` incluem um bloco de diagnóstico `eventLoop` (atraso, utilização, proporção de núcleos de CPU e flag `degraded`).

<ParamField path="--port <port>" type="number">
  Direciona a chamada a um Gateway local loopback nesta porta. Substitui `OPENCLAW_GATEWAY_URL` e `OPENCLAW_GATEWAY_PORT` nesta chamada.
</ParamField>

### `gateway usage-cost`

Obtém resumos de custo de uso dos registros de sessão.

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
  Restringe o resumo a um único identificador de agente configurado.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Agrega todos os agentes configurados. Não pode ser combinado com `--agent`.
</ParamField>

### `gateway stability`

Obtém o registrador recente de estabilidade de diagnóstico de um Gateway em execução.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Número máximo de eventos recentes a incluir (máximo de `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filtra pelo tipo de evento de diagnóstico, por exemplo, `payload.large` ou `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Inclui somente eventos posteriores a um número de sequência de diagnóstico.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lê um pacote de estabilidade persistido em vez de chamar o Gateway em execução. `--bundle latest` (ou apenas `--bundle`) seleciona o pacote mais recente no diretório de estado; também é possível passar diretamente o caminho de um pacote JSON.
</ParamField>
<ParamField path="--export" type="boolean">
  Grava um arquivo ZIP compartilhável de diagnósticos de suporte em vez de imprimir os detalhes de estabilidade.
</ParamField>
<ParamField path="--output <path>" type="string">
  Caminho de saída para `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - Os registros mantêm metadados operacionais: nomes de eventos, contagens, tamanhos em bytes, leituras de memória, estado de filas/sessões, identificadores de aprovação, nomes de canais/plugins e resumos de sessão com dados sensíveis ocultados. Eles excluem texto de conversas, corpos de Webhooks, saídas de ferramentas, corpos brutos de solicitações/respostas, tokens, cookies, valores secretos, nomes de host e identificadores brutos de sessão. Defina `diagnostics.enabled: false` para desativar completamente o registrador.
    - Encerramentos fatais do Gateway, tempos limite de encerramento e falhas de inicialização após reinicializações gravam o mesmo instantâneo de diagnóstico em `~/.openclaw/logs/stability/openclaw-stability-*.json` quando o registrador contém eventos. Inspecione o pacote mais recente com `openclaw gateway stability --bundle latest`; `--limit`, `--type` e `--since-seq` também se aplicam à saída do pacote.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Grava um arquivo ZIP local de diagnósticos destinado a relatórios de erros. Para conhecer o modelo de privacidade e o conteúdo do pacote, consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Caminho do arquivo zip de saída. O padrão é uma exportação para suporte no diretório de estado.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Número máximo de linhas de log sanitizadas a incluir.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Número máximo de bytes de log a inspecionar.
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
  Ignora a busca pelo pacote de estabilidade persistido.
</ParamField>
<ParamField path="--json" type="boolean">
  Exibe o caminho gravado, o tamanho e o manifesto como JSON.
</ParamField>

A exportação reúne: `manifest.json` (inventário de arquivos), `summary.md` (resumo em Markdown), `diagnostics.json` (resumo de nível superior de configuração/logs/descoberta/estabilidade/status/integridade), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` e `stability/latest.json` quando existe um pacote.

Ela foi projetada para ser compartilhada. Mantém detalhes operacionais úteis para depuração — campos de log seguros, nomes de subsistemas, códigos de status, durações, modos configurados, portas, identificadores de plugins/provedores, configurações não secretas de recursos e mensagens operacionais de log com dados ocultados — e omite ou oculta texto de conversas, corpos de Webhooks, saídas de ferramentas, credenciais, cookies, identificadores de contas/mensagens, texto de prompts/instruções, nomes de hosts e valores secretos. Quando uma mensagem de log parece conter texto de carga útil de usuário/conversa/ferramenta (por exemplo, "o usuário disse", "texto da conversa", "saída da ferramenta", "corpo do Webhook"), a exportação mantém apenas a informação de que uma mensagem foi omitida e sua contagem de bytes.

### `gateway status`

Mostra o serviço do Gateway (launchd/systemd/schtasks), além de uma sondagem opcional de conectividade/autenticação.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Adiciona um destino explícito de sondagem. O remoto configurado e o localhost ainda são sondados.
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
  Ignora a sondagem de conectividade (exibição apenas do serviço).
</ParamField>
<ParamField path="--deep" type="boolean">
  Também verifica serviços no nível do sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Eleva a sondagem de conectividade para uma sondagem de leitura e encerra com código diferente de zero em caso de falha. Não pode ser combinado com `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semântica do status">
    - Permanece disponível para diagnóstico mesmo quando a configuração local da CLI está ausente ou é inválida.
    - A saída padrão comprova o estado do serviço, a conexão WebSocket e a capacidade de autenticação visível no momento do handshake — não operações de leitura/gravação/administração.
    - As sondagens não fazem alterações na autenticação inicial do dispositivo: reutilizam um token de dispositivo existente em cache quando disponível, mas nunca criam uma nova identidade de dispositivo da CLI nem um registro de pareamento somente leitura apenas para verificar o status.
    - Resolve SecretRefs de autenticação configuradas para a autenticação da sondagem quando possível. Se uma SecretRef obrigatória não for resolvida, `--json` relata `rpc.authWarning` quando a conectividade/autenticação da sondagem falha; passe `--token`/`--password` explicitamente ou corrija a origem do segredo. Os avisos de autenticação não resolvida são suprimidos assim que a sondagem é bem-sucedida.
    - A saída JSON inclui `gateway.version` quando o Gateway em execução a informa; `--require-rpc` pode recorrer à carga útil RPC `status.runtimeVersion` se a sondagem de handshake não puder fornecer metadados da versão.
    - Use `--require-rpc` em scripts/automações quando um serviço em escuta não for suficiente e você também precisar que a RPC com escopo de leitura esteja íntegra.
    - `--deep` procura instalações adicionais de launchd/systemd/schtasks; quando vários serviços semelhantes a gateways são encontrados, a saída para leitura humana exibe dicas de limpeza (normalmente, execute um gateway por máquina) e informa uma transferência recente de reinicialização do supervisor quando pertinente.
    - `--deep` também executa a validação da configuração no modo com reconhecimento de plugins (`pluginValidation: "full"`) e apresenta avisos do manifesto do plugin (por exemplo, metadados ausentes de configuração do canal). O `gateway status` padrão mantém o caminho rápido e somente leitura que ignora a validação de plugins.
    - A saída para leitura humana inclui o caminho resolvido do arquivo de log, além dos caminhos e da validade das configurações da CLI e do serviço, para ajudar a diagnosticar divergências de perfil ou diretório de estado.

  </Accordion>
  <Accordion title="Verificações de divergência de autenticação do systemd no Linux">
    - As verificações de divergência da autenticação do serviço leem `Environment=` e `EnvironmentFile=` da unidade (incluindo `%h`, caminhos entre aspas, vários arquivos e arquivos opcionais com `-`).
    - Resolve SecretRefs de `gateway.auth.token` usando o ambiente de execução mesclado (primeiro o ambiente do comando do serviço e, depois, o ambiente do processo como alternativa).
    - As verificações de divergência de token ignoram a resolução do token da configuração quando a autenticação por token não está efetivamente ativa (`gateway.auth.mode` definido explicitamente como `password`/`none`/`trusted-proxy`, ou modo não definido quando a senha pode prevalecer e nenhum token candidato pode prevalecer).

  </Accordion>
</AccordionGroup>

### `gateway probe`

O comando para "depurar tudo". Ele sempre sonda:

- seu gateway remoto configurado (se definido); e
- localhost (local loopback), **mesmo que um remoto esteja configurado**.

Passar `--url` adiciona esse destino explícito antes dos outros dois. A saída para leitura humana identifica os destinos como `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)` e `Local loopback`.

<Note>
Se vários destinos de sondagem estiverem acessíveis, todos serão exibidos. Um túnel SSH, uma URL TLS/proxy e uma URL remota configurada podem apontar para o mesmo gateway, mesmo usando portas de transporte diferentes; `multiple_gateways` é reservado para gateways acessíveis distintos ou com identidade ambígua. A execução de vários gateways é compatível com perfis isolados (por exemplo, um bot de recuperação), mas a maioria das instalações executa um único gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Usa esta porta para o destino de sondagem local loopback e para a porta remota do túnel SSH. Sem `--url`, isso seleciona apenas o destino local loopback, em vez da URL do ambiente do gateway configurado, da porta do ambiente ou dos destinos remotos.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretação">
    - `Reachable: yes` significa que pelo menos um destino aceitou uma conexão WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` informa o que a sondagem conseguiu comprovar sobre a autenticação, separadamente da acessibilidade.
    - `Read probe: ok` significa que as chamadas RPC detalhadas com escopo de leitura (`health`/`status`/`system-presence`/`config.get`) também foram bem-sucedidas.
    - `Read probe: limited - missing scope: operator.read` significa que a conexão foi bem-sucedida, mas a RPC com escopo de leitura está limitada. É relatada como acessibilidade **degradada**, não como falha completa.
    - `Read probe: failed` após `Connect: ok` significa que o WebSocket foi conectado, mas o diagnóstico de leitura subsequente atingiu o tempo limite ou falhou — também **degradado**, não inacessível.
    - Assim como `gateway status`, a sondagem reutiliza a autenticação de dispositivo existente em cache, mas não cria uma identidade inicial de dispositivo nem um estado de pareamento.
    - O código de saída só é diferente de zero quando nenhum destino sondado está acessível.

  </Accordion>
  <Accordion title="Saída JSON">
    Nível superior:

    - `ok`: pelo menos um destino está acessível.
    - `degraded`: pelo menos um destino aceitou uma conexão, mas não concluiu o diagnóstico completo de RPC detalhada.
    - `capability`: melhor capacidade observada entre os destinos acessíveis (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` ou `unknown`).
    - `primaryTargetId`: melhor destino a ser considerado como o vencedor ativo, nesta ordem: URL explícita, túnel SSH, remoto configurado, local loopback.
    - `warnings[]`: registros de aviso de melhor esforço com `code`, `message` e `targetIds` opcionais.
    - `network`: sugestões de URL de local loopback/tailnet derivadas da configuração atual e da rede do host.
    - `discovery.timeoutMs` / `discovery.count`: o orçamento real de descoberta e a contagem de resultados usados nesta passagem da sondagem.

    Por destino (`targets[].connect`): `ok` (classificação de acessibilidade + degradação), `rpcOk` (sucesso completo da RPC detalhada), `scopeLimited` (a RPC detalhada falhou por ausência do escopo de operador).

    Por destino (`targets[].auth`): `role` e `scopes` informados em `hello-ok` quando disponíveis, além da classificação `capability` apresentada.

  </Accordion>
  <Accordion title="Códigos de aviso comuns">
    - `ssh_tunnel_failed`: a configuração do túnel SSH falhou; o comando recorreu a sondagens diretas.
    - `multiple_gateways`: identidades distintas de gateways estavam acessíveis, ou o OpenClaw não conseguiu comprovar que os destinos acessíveis são o mesmo gateway. Um túnel SSH, uma URL de proxy ou uma URL remota configurada para o mesmo gateway não aciona esse aviso.
    - `auth_secretref_unresolved`: não foi possível resolver uma SecretRef de autenticação configurada para um destino com falha.
    - `probe_scope_limited`: a conexão WebSocket foi bem-sucedida, mas a sondagem de leitura foi limitada pela ausência de `operator.read`.
    - `local_tls_runtime_unavailable`: o TLS do Gateway local está ativado, mas o OpenClaw não conseguiu carregar a impressão digital do certificado local.

  </Accordion>
</AccordionGroup>

#### Remoto por SSH (paridade com o aplicativo para Mac)

O modo "Remote over SSH" do aplicativo para macOS usa um encaminhamento de porta local para que um gateway remoto restrito a loopback fique acessível em `ws://127.0.0.1:<port>`.

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
  Seleciona o primeiro host de gateway descoberto como destino SSH a partir do endpoint de descoberta resolvido (`local.` mais o domínio de longa distância configurado, se houver). Sugestões somente TXT são ignoradas.
</ParamField>

Padrões de configuração (opcionais): `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`.

### `gateway call <method>`

Auxiliar RPC de baixo nível.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
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
<ParamField path="--timeout <ms>" type="number" default="10000">
  Orçamento de tempo limite.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Principalmente para RPCs no estilo de agente que transmitem eventos intermediários antes de uma carga útil final.
</ParamField>
<ParamField path="--json" type="boolean">
  Saída JSON legível por máquina.
</ParamField>

<Note>
`--params` deve ser um JSON válido, e cada método valida o formato dos próprios parâmetros (campos extras ou com nomes incorretos são rejeitados).
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

Use `--wrapper` quando o serviço gerenciado precisar ser iniciado por meio de outro executável, por exemplo, uma camada de compatibilidade de gerenciador de segredos ou um auxiliar de execução como outro usuário. O wrapper recebe os argumentos normais do Gateway e é responsável por, por fim, executar via `exec` o `openclaw` ou o Node com esses argumentos.

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

Você também pode definir o wrapper por meio do ambiente. `gateway install` valida se o caminho é um arquivo executável, grava o wrapper nos `ProgramArguments` do serviço e mantém `OPENCLAW_WRAPPER` no ambiente do serviço para posteriores reinstalações forçadas, atualizações e reparos do doctor.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Para remover um wrapper mantido, limpe `OPENCLAW_WRAPPER` durante a reinstalação:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Opções de comando">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>` (padrão: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Comportamento do ciclo de vida">
    - Use `gateway restart` para reiniciar um serviço gerenciado. Não encadeie `gateway stop` e `gateway start` como substituto para uma reinicialização.
    - No macOS, `gateway stop` usa `launchctl bootout` por padrão, o que remove o LaunchAgent da sessão de inicialização atual sem manter uma desativação — a recuperação automática do KeepAlive permanece ativa para falhas futuras, e `gateway start` reativa corretamente sem exigir um `launchctl enable` manual. Passe `--disable` para suprimir de modo persistente o KeepAlive e o RunAtLoad, impedindo que o Gateway seja recriado até o próximo `gateway start` explícito; use essa opção quando uma interrupção manual precisar persistir após reinicializações.
    - Os comandos de ciclo de vida aceitam `--json` para automação por scripts.

  </Accordion>
  <Accordion title="Autenticação e SecretRefs durante a instalação">
    - Quando a autenticação por token exige um token e `gateway.auth.token` é gerenciado por SecretRef, `gateway install` valida se o SecretRef pode ser resolvido, mas não mantém o token resolvido nos metadados do ambiente do serviço.
    - Se a autenticação por token exigir um token e o SecretRef de token configurado não puder ser resolvido, a instalação falhará de modo seguro em vez de manter texto simples como alternativa.
    - Para autenticação por senha em `gateway run`, prefira `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` ou um `gateway.auth.password` baseado em SecretRef em vez de `--password` em linha.
    - No modo de autenticação inferido, `OPENCLAW_GATEWAY_PASSWORD` definido apenas no shell não flexibiliza os requisitos de token da instalação; use uma configuração durável (`gateway.auth.password` ou `env` da configuração) ao instalar um serviço gerenciado.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação será bloqueada até que o modo seja definido explicitamente.

  </Accordion>
</AccordionGroup>

## Descobrir Gateways (Bonjour)

`gateway discover` procura beacons de Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour de longa distância): escolha um domínio (exemplo: `openclaw.internal.`) e configure DNS dividido + um servidor DNS; consulte [Bonjour](/pt-BR/gateway/bonjour).

Somente Gateways com a descoberta Bonjour ativada (padrão) anunciam o beacon.

Dicas TXT em cada beacon: `role` (indicação da função do Gateway), `transport` (indicação do transporte, por exemplo, `gateway`), `gatewayPort` (porta WebSocket, geralmente `18789`), `tailnetDns` (nome de host MagicDNS, quando disponível), `gatewayTls` / `gatewayTlsSha256` (TLS ativado + impressão digital do certificado). `sshPort` e `cliPath` são publicados somente no modo de descoberta completa (`discovery.mdns.mode: "full"`; o padrão é `"minimal"`, que os omite — nesse caso, os clientes usam a porta `22` como padrão para os destinos SSH).

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Tempo limite por comando (navegação/resolução).
</ParamField>
<ParamField path="--json" type="boolean">
  Saída legível por máquina (também desativa a estilização e o indicador de atividade).
</ParamField>

Exemplos:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- Verifica `local.`, além do domínio de longa distância configurado, quando houver um ativado.
- `wsUrl` na saída JSON é derivada do endpoint de serviço resolvido, não de dicas presentes somente no TXT, como `lanHost` ou `tailnetDns`.
- `discovery.mdns.mode` controla a publicação de `sshPort`/`cliPath` tanto no mDNS `local.` quanto no DNS-SD de longa distância (consulte acima).

</Note>

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Guia operacional do Gateway](/pt-BR/gateway)
