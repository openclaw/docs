---
read_when:
    - O hub de solução de problemas apontou você para cá para um diagnóstico mais aprofundado
    - Você precisa de seções estáveis do runbook baseadas em sintomas com comandos exatos
sidebarTitle: Troubleshooting
summary: Runbook aprofundado de solução de problemas para Gateway, canais, automação, Nodes e navegador
title: Solução de problemas
x-i18n:
    generated_at: "2026-04-26T11:30:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc6b2a0e8522a761dcee0a3b9bc024eefbd7a5ab4118fc090401868a571bcf
    source_path: gateway/troubleshooting.md
    workflow: 15
---

Esta página é o runbook aprofundado. Comece em [/help/troubleshooting](/pt-BR/help/troubleshooting) se quiser primeiro o fluxo rápido de triagem.

## Escada de comandos

Execute estes primeiro, nesta ordem:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sinais esperados de integridade:

- `openclaw gateway status` mostra `Runtime: running`, `Connectivity probe: ok` e uma linha `Capability: ...`.
- `openclaw doctor` não relata problemas bloqueantes de config/serviço.
- `openclaw channels status --probe` mostra status de transporte por conta em tempo real e, onde houver suporte, resultados de probe/auditoria como `works` ou `audit ok`.

## Instalações com split brain e proteção contra config mais nova

Use isto quando um serviço do Gateway parar inesperadamente após uma atualização, ou quando os logs mostrarem que um binário `openclaw` é mais antigo que a versão que gravou `openclaw.json` pela última vez.

O OpenClaw marca gravações de config com `meta.lastTouchedVersion`. Comandos somente leitura ainda podem inspecionar uma config gravada por um OpenClaw mais novo, mas mutações de processo e serviço se recusam a continuar a partir de um binário mais antigo. Ações bloqueadas incluem iniciar, parar, reiniciar e desinstalar o serviço do Gateway, reinstalação forçada do serviço, inicialização do Gateway em modo de serviço e limpeza de porta com `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Corrigir PATH">
    Corrija o `PATH` para que `openclaw` resolva para a instalação mais nova e execute a ação novamente.
  </Step>
  <Step title="Reinstalar o serviço do Gateway">
    Reinstale o serviço correto do Gateway a partir da instalação mais nova:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remover wrappers obsoletos">
    Remova entradas obsoletas de pacote do sistema ou wrappers antigos que ainda apontam para um binário `openclaw` antigo.
  </Step>
</Steps>

<Warning>
Apenas para downgrade intencional ou recuperação emergencial, defina `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` para um único comando. Deixe sem definir para operação normal.
</Warning>

## Anthropic 429: uso extra exigido para contexto longo

Use isto quando logs/erros incluírem: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Procure por:

- O model Opus/Sonnet selecionado da Anthropic tem `params.context1m: true`.
- A credencial atual da Anthropic não é elegível para uso de contexto longo.
- As requisições falham apenas em sessões longas/execuções de model que precisam do caminho beta de 1M.

Opções de correção:

<Steps>
  <Step title="Desativar context1m">
    Desative `context1m` para esse model para voltar à janela de contexto normal.
  </Step>
  <Step title="Usar uma credencial elegível">
    Use uma credencial Anthropic elegível para requisições de contexto longo ou troque para uma API key da Anthropic.
  </Step>
  <Step title="Configurar models de fallback">
    Configure models de fallback para que as execuções continuem quando as requisições de contexto longo da Anthropic forem rejeitadas.
  </Step>
</Steps>

Relacionado:

- [Anthropic](/pt-BR/providers/anthropic)
- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Por que estou vendo HTTP 429 da Anthropic?](/pt-BR/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Backend local compatível com OpenAI passa probes diretos, mas execuções do agente falham

Use isto quando:

- `curl ... /v1/models` funciona
- chamadas diretas pequenas para `/v1/chat/completions` funcionam
- execuções de model no OpenClaw falham apenas em turnos normais do agente

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Procure por:

- chamadas diretas pequenas funcionam, mas execuções do OpenClaw falham apenas em prompts maiores
- erros do backend dizendo que `messages[].content` deveria ser uma string
- falhas do backend que só aparecem com contagens maiores de tokens no prompt ou com prompts completos do runtime do agente

<AccordionGroup>
  <Accordion title="Assinaturas comuns">
    - `messages[...].content: invalid type: sequence, expected a string` → o backend rejeita partes estruturadas de conteúdo de Chat Completions. Correção: defina `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - requisições diretas pequenas funcionam, mas execuções do agente OpenClaw falham com travamentos do backend/model (por exemplo Gemma em algumas compilações `inferrs`) → o transporte do OpenClaw provavelmente já está correto; o backend está falhando com o formato maior do prompt do runtime do agente.
    - as falhas diminuem após desativar ferramentas, mas não desaparecem → os esquemas de ferramenta faziam parte da pressão, mas o problema restante ainda é limitação do model/servidor upstream ou um bug do backend.

  </Accordion>
  <Accordion title="Opções de correção">
    1. Defina `compat.requiresStringContent: true` para backends de Chat Completions que aceitam apenas string.
    2. Defina `compat.supportsTools: false` para models/backends que não conseguem lidar de forma confiável com a superfície de esquema de ferramentas do OpenClaw.
    3. Reduza a pressão do prompt quando possível: bootstrap de workspace menor, histórico de sessão mais curto, model local mais leve ou um backend com suporte melhor a contexto longo.
    4. Se requisições diretas pequenas continuarem funcionando enquanto os turnos do agente OpenClaw ainda travam dentro do backend, trate isso como uma limitação do servidor/model upstream e abra um repro lá com o formato de carga aceito.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Configuration](/pt-BR/gateway/configuration)
- [Models locais](/pt-BR/gateway/local-models)
- [Endpoints compatíveis com OpenAI](/pt-BR/gateway/configuration-reference#openai-compatible-endpoints)

## Sem respostas

Se os canais estiverem ativos mas nada responder, verifique roteamento e política antes de reconectar qualquer coisa.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Procure por:

- Pareamento pendente para remetentes de DM.
- Bloqueio por menção em grupo (`requireMention`, `mentionPatterns`).
- Incompatibilidades de lista de permissões de canal/grupo.

Assinaturas comuns:

- `drop guild message (mention required` → mensagem de grupo ignorada até haver menção.
- `pairing request` → o remetente precisa de aprovação.
- `blocked` / `allowlist` → o remetente/canal foi filtrado pela política.

Relacionado:

- [Solução de problemas de canal](/pt-BR/channels/troubleshooting)
- [Grupos](/pt-BR/channels/groups)
- [Pareamento](/pt-BR/channels/pairing)

## Conectividade da dashboard Control UI

Quando a dashboard/Control UI não conecta, valide URL, modo de auth e suposições de contexto seguro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Procure por:

- URL de probe e URL de dashboard corretas.
- Incompatibilidade de modo/token de auth entre cliente e Gateway.
- Uso de HTTP quando a identidade do dispositivo é obrigatória.

<AccordionGroup>
  <Accordion title="Assinaturas de conexão / auth">
    - `device identity required` → contexto não seguro ou auth de dispositivo ausente.
    - `origin not allowed` → o `Origin` do navegador não está em `gateway.controlUi.allowedOrigins` (ou você está conectando a partir de uma origem de navegador não-loopback sem uma lista de permissões explícita).
    - `device nonce required` / `device nonce mismatch` → o cliente não está concluindo o fluxo de auth de dispositivo baseado em desafio (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → o cliente assinou a carga errada (ou timestamp obsoleto) para o handshake atual.
    - `AUTH_TOKEN_MISMATCH` com `canRetryWithDeviceToken=true` → o cliente pode fazer uma tentativa confiável com o token de dispositivo em cache.
    - Essa tentativa com token em cache reutiliza o conjunto de escopos em cache armazenado com o token do dispositivo pareado. Chamadores com `deviceToken` explícito / `scopes` explícitos mantêm seu conjunto solicitado de escopos.
    - Fora desse caminho de nova tentativa, a precedência de auth de conexão é primeiro token/senha compartilhado explícito, depois `deviceToken` explícito, depois token de dispositivo armazenado e por fim token bootstrap.
    - No caminho assíncrono da Control UI com Tailscale Serve, tentativas com falha para o mesmo `{scope, ip}` são serializadas antes de o limitador registrar a falha. Duas novas tentativas ruins concorrentes do mesmo cliente podem, portanto, mostrar `retry later` na segunda tentativa em vez de duas incompatibilidades simples.
    - `too many failed authentication attempts (retry later)` a partir de um cliente loopback com origem de navegador → falhas repetidas da mesma `Origin` normalizada são bloqueadas temporariamente; outra origem localhost usa um bucket separado.
    - `unauthorized` repetido após essa nova tentativa → desvio entre token compartilhado e token de dispositivo; atualize a config do token e reaprove/gire o token de dispositivo se necessário.
    - `gateway connect failed:` → host/porta/alvo de URL incorreto.

  </Accordion>
</AccordionGroup>

### Mapa rápido de códigos de detalhe de auth

Use `error.details.code` da resposta `connect` com falha para escolher a próxima ação:

| Código de detalhe            | Significado                                                                                                                                                                                   | Ação recomendada                                                                                                                                                                                                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | O cliente não enviou um token compartilhado obrigatório.                                                                                                                                      | Cole/defina o token no cliente e tente novamente. Para caminhos de dashboard: `openclaw config get gateway.auth.token` e depois cole em Control UI settings.                                                                                                                            |
| `AUTH_TOKEN_MISMATCH`        | O token compartilhado não corresponde ao token de auth do Gateway.                                                                                                                            | Se `canRetryWithDeviceToken=true`, permita uma nova tentativa confiável. Novas tentativas com token em cache reutilizam escopos aprovados armazenados; chamadores com `deviceToken` / `scopes` explícitos mantêm os escopos solicitados. Se ainda falhar, execute a [checklist de recuperação de desvio de token](/pt-BR/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | O token por dispositivo em cache está obsoleto ou foi revogado.                                                                                                                               | Gire/reaprove o token do dispositivo usando a [CLI de devices](/pt-BR/cli/devices) e depois reconecte.                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | A identidade do dispositivo precisa de aprovação. Verifique `error.details.reason` para `not-paired`, `scope-upgrade`, `role-upgrade` ou `metadata-upgrade`, e use `requestId` / `remediationHint` quando presentes. | Aprove a solicitação pendente: `openclaw devices list` e depois `openclaw devices approve <requestId>`. Upgrades de escopo/papel usam o mesmo fluxo depois que você revisar o acesso solicitado.                                                                                         |

<Note>
RPCs diretos de backend via loopback autenticados com o token/senha compartilhado do Gateway não devem depender da linha de base de escopo de dispositivo pareado da CLI. Se subagentes ou outras chamadas internas ainda falharem com `scope-upgrade`, verifique se o chamador está usando `client.id: "gateway-client"` e `client.mode: "backend"` e se não está forçando `deviceIdentity` explícito nem token de dispositivo.
</Note>

Verificação de migração do auth de dispositivo v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Se os logs mostrarem erros de nonce/assinatura, atualize o cliente de conexão e valide-o:

<Steps>
  <Step title="Aguardar connect.challenge">
    O cliente aguarda o `connect.challenge` emitido pelo Gateway.
  </Step>
  <Step title="Assinar a carga">
    O cliente assina a carga vinculada ao desafio.
  </Step>
  <Step title="Enviar o nonce do dispositivo">
    O cliente envia `connect.params.device.nonce` com o mesmo nonce do desafio.
  </Step>
</Steps>

Se `openclaw devices rotate` / `revoke` / `remove` for negado inesperadamente:

- sessões com token de dispositivo pareado só podem gerenciar **o próprio** dispositivo, a menos que o chamador também tenha `operator.admin`
- `openclaw devices rotate --scope ...` só pode solicitar escopos de operator que a sessão chamadora já possua

Relacionado:

- [Configuration](/pt-BR/gateway/configuration) (modos de auth do Gateway)
- [Control UI](/pt-BR/web/control-ui)
- [Devices](/pt-BR/cli/devices)
- [Acesso remoto](/pt-BR/gateway/remote)
- [Auth de proxy confiável](/pt-BR/gateway/trusted-proxy-auth)

## Serviço do Gateway não está em execução

Use isto quando o serviço está instalado, mas o processo não permanece ativo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # também verifica serviços no nível do sistema
```

Procure por:

- `Runtime: stopped` com dicas de saída.
- Incompatibilidade de config do serviço (`Config (cli)` vs `Config (service)`).
- Conflitos de porta/listener.
- Instalações extras de launchd/systemd/schtasks quando `--deep` é usado.
- Dicas de limpeza em `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Assinaturas comuns">
    - `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → o modo local do Gateway não está ativado, ou o arquivo de config foi sobrescrito e perdeu `gateway.mode`. Correção: defina `gateway.mode="local"` na sua config, ou execute novamente `openclaw onboard --mode local` / `openclaw setup` para remarcar a config esperada de modo local. Se você estiver executando OpenClaw via Podman, o caminho padrão da config é `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → bind não-loopback sem um caminho válido de auth do Gateway (token/senha ou trusted-proxy quando configurado).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflito de porta.
    - `Other gateway-like services detected (best effort)` → existem unidades stale ou paralelas de launchd/systemd/schtasks. A maioria das configurações deve manter um Gateway por máquina; se você realmente precisar de mais de um, isole portas + config/estado/workspace. Veja [/gateway#multiple-gateways-same-host](/pt-BR/gateway#multiple-gateways-same-host).

  </Accordion>
</AccordionGroup>

Relacionado:

- [Exec em segundo plano e ferramenta de processo](/pt-BR/gateway/background-process)
- [Configuration](/pt-BR/gateway/configuration)
- [Doctor](/pt-BR/gateway/doctor)

## Gateway restaurou a última config válida conhecida

Use isto quando o Gateway inicia, mas os logs dizem que `openclaw.json` foi restaurado.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Procure por:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Um arquivo com timestamp `openclaw.json.clobbered.*` ao lado da config ativa
- Um evento de sistema do agente principal que começa com `Config recovery warning`

<AccordionGroup>
  <Accordion title="O que aconteceu">
    - A config rejeitada não passou na validação durante a inicialização ou recarga a quente.
    - O OpenClaw preservou a carga rejeitada como `.clobbered.*`.
    - A config ativa foi restaurada a partir da última cópia validada e válida conhecida.
    - O próximo turno do agente principal recebe um aviso para não regravar cegamente a config rejeitada.
    - Se todos os problemas de validação estivessem em `plugins.entries.<id>...`, o OpenClaw não restauraria o arquivo inteiro. Falhas locais de Plugin continuam visíveis, enquanto configurações do usuário sem relação permanecem na config ativa.

  </Accordion>
  <Accordion title="Inspecionar e reparar">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Assinaturas comuns">
    - `.clobbered.*` existe → uma edição direta externa ou leitura de inicialização foi restaurada.
    - `.rejected.*` existe → uma gravação de config controlada pelo OpenClaw falhou nas verificações de esquema ou sobrescrita antes do commit.
    - `Config write rejected:` → a gravação tentou remover formato obrigatório, reduzir muito o arquivo ou persistir uma config inválida.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` ou `size-drop-vs-last-good:*` → a inicialização tratou o arquivo atual como sobrescrito porque ele perdeu campos ou tamanho em comparação com o backup válido conhecido.
    - `Config last-known-good promotion skipped` → o candidato continha placeholders redigidos de segredo, como `***`.

  </Accordion>
  <Accordion title="Opções de correção">
    1. Mantenha a config ativa restaurada se ela estiver correta.
    2. Copie apenas as chaves desejadas de `.clobbered.*` ou `.rejected.*` e aplique-as com `openclaw config set` ou `config.patch`.
    3. Execute `openclaw config validate` antes de reiniciar.
    4. Se editar manualmente, mantenha a config JSON5 completa, não apenas o objeto parcial que você queria alterar.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Config](/pt-BR/cli/config)
- [Configuration: hot reload](/pt-BR/gateway/configuration#config-hot-reload)
- [Configuration: strict validation](/pt-BR/gateway/configuration#strict-validation)
- [Doctor](/pt-BR/gateway/doctor)

## Avisos de probe do Gateway

Use isto quando `openclaw gateway probe` alcança algo, mas ainda imprime um bloco de aviso.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Procure por:

- `warnings[].code` e `primaryTargetId` na saída JSON.
- Se o aviso é sobre fallback SSH, vários Gateways, escopos ausentes ou refs de auth não resolvidas.

Assinaturas comuns:

- `SSH tunnel failed to start; falling back to direct probes.` → a configuração SSH falhou, mas o comando ainda tentou alvos diretos configurados/loopback.
- `multiple reachable gateways detected` → mais de um alvo respondeu. Normalmente isso significa uma configuração intencional com múltiplos Gateways ou listeners stale/duplicados.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → a conexão funcionou, mas o RPC de detalhe está limitado por escopo; pareie a identidade do dispositivo ou use credenciais com `operator.read`.
- `Capability: pairing-pending` ou `gateway closed (1008): pairing required` → o Gateway respondeu, mas este cliente ainda precisa de pareamento/aprovação antes do acesso normal de operator.
- texto de aviso de SecretRef não resolvida em `gateway.auth.*` / `gateway.remote.*` → o material de auth não estava disponível nesse caminho de comando para o alvo com falha.

Relacionado:

- [Gateway](/pt-BR/cli/gateway)
- [Vários Gateways no mesmo host](/pt-BR/gateway#multiple-gateways-same-host)
- [Acesso remoto](/pt-BR/gateway/remote)

## Canal conectado, mas mensagens não fluem

Se o estado do canal está conectado, mas o fluxo de mensagens está parado, foque em política, permissões e regras de entrega específicas do canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Procure por:

- Política de DM (`pairing`, `allowlist`, `open`, `disabled`).
- Lista de permissões de grupo e exigências de menção.
- Permissões/escopos ausentes da API do canal.

Assinaturas comuns:

- `mention required` → mensagem ignorada pela política de menção em grupo.
- rastros de `pairing` / aprovação pendente → o remetente não foi aprovado.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema de auth/permissões do canal.

Relacionado:

- [Solução de problemas de canal](/pt-BR/channels/troubleshooting)
- [Discord](/pt-BR/channels/discord)
- [Telegram](/pt-BR/channels/telegram)
- [WhatsApp](/pt-BR/channels/whatsapp)

## Entrega de Cron e Heartbeat

Se o Cron ou o Heartbeat não executou ou não entregou, verifique primeiro o estado do agendador e depois o alvo de entrega.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Procure por:

- Cron ativado e próximo despertar presente.
- Status do histórico de execução da tarefa (`ok`, `skipped`, `error`).
- Motivos de ignorar Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Assinaturas comuns">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron desativado.
    - `cron: timer tick failed` → falha no tick do agendador; verifique erros de arquivo/log/runtime.
    - `heartbeat skipped` com `reason=quiet-hours` → fora da janela de horas ativas.
    - `heartbeat skipped` com `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe, mas contém apenas linhas em branco / cabeçalhos Markdown, então o OpenClaw ignora a chamada ao model.
    - `heartbeat skipped` com `reason=no-tasks-due` → `HEARTBEAT.md` contém um bloco `tasks:`, mas nenhuma tarefa vence nesse tick.
    - `heartbeat: unknown accountId` → id de conta inválido para o alvo de entrega do heartbeat.
    - `heartbeat skipped` com `reason=dm-blocked` → o alvo do heartbeat foi resolvido para um destino no estilo DM enquanto `agents.defaults.heartbeat.directPolicy` (ou substituição por agente) está definido como `block`.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Heartbeat](/pt-BR/gateway/heartbeat)
- [Tarefas agendadas](/pt-BR/automation/cron-jobs)
- [Tarefas agendadas: solução de problemas](/pt-BR/automation/cron-jobs#troubleshooting)

## Node pareado, ferramenta falha

Se um Node está pareado, mas as ferramentas falham, isole o estado de foreground, permissões e aprovações.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Procure por:

- Node online com as capacidades esperadas.
- Permissões do sistema operacional para câmera/microfone/localização/tela.
- Estado de aprovações exec e lista de permissões.

Assinaturas comuns:

- `NODE_BACKGROUND_UNAVAILABLE` → o app do Node precisa estar em foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permissão do sistema operacional ausente.
- `SYSTEM_RUN_DENIED: approval required` → aprovação exec pendente.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado pela lista de permissões.

Relacionado:

- [Aprovações de exec](/pt-BR/tools/exec-approvals)
- [Solução de problemas de Node](/pt-BR/nodes/troubleshooting)
- [Nodes](/pt-BR/nodes/index)

## Ferramenta de navegador falha

Use isto quando ações da ferramenta de navegador falham, mesmo com o Gateway íntegro.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Procure por:

- Se `plugins.allow` está definido e inclui `browser`.
- Caminho válido do executável do navegador.
- Alcance do perfil CDP.
- Disponibilidade local do Chrome para perfis `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Assinaturas de Plugin / executável">
    - `unknown command "browser"` ou `unknown command 'browser'` → o Plugin de navegador incluído foi excluído por `plugins.allow`.
    - ferramenta de navegador ausente / indisponível enquanto `browser.enabled=true` → `plugins.allow` exclui `browser`, então o Plugin nunca foi carregado.
    - `Failed to start Chrome CDP on port` → o processo do navegador não conseguiu iniciar.
    - `browser.executablePath not found` → o caminho configurado é inválido.
    - `browser.cdpUrl must be http(s) or ws(s)` → a URL CDP configurada usa um esquema não suportado, como `file:` ou `ftp:`.
    - `browser.cdpUrl has invalid port` → a URL CDP configurada tem uma porta inválida ou fora do intervalo.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → a instalação atual do Gateway não tem a dependência de runtime `playwright-core` do Plugin de navegador incluído; execute `openclaw doctor --fix` e depois reinicie o Gateway. Snapshots ARIA e capturas de tela básicas de página ainda podem funcionar, mas navegação, snapshots com IA, capturas de tela de elementos por seletor CSS e exportação PDF permanecem indisponíveis.

  </Accordion>
  <Accordion title="Assinaturas de Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → o existing-session do Chrome MCP ainda não conseguiu se anexar ao diretório de dados do navegador selecionado. Abra a página de inspeção do navegador, ative depuração remota, mantenha o navegador aberto, aprove o primeiro prompt de anexo e depois tente novamente. Se o estado autenticado não for necessário, prefira o perfil gerenciado `openclaw`.
    - `No Chrome tabs found for profile="user"` → o perfil de anexo do Chrome MCP não tem abas locais do Chrome abertas.
    - `Remote CDP for profile "<name>" is not reachable` → o endpoint CDP remoto configurado não pode ser alcançado a partir do host do Gateway.
    - `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → o perfil somente-anexo não tem alvo alcançável, ou o endpoint HTTP respondeu, mas o WebSocket CDP ainda não pôde ser aberto.

  </Accordion>
  <Accordion title="Assinaturas de elemento / captura de tela / upload">
    - `fullPage is not supported for element screenshots` → a solicitação de captura misturou `--full-page` com `--ref` ou `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → chamadas de captura de tela do Chrome MCP / `existing-session` devem usar captura de página ou um `--ref` de snapshot, não `--element` via CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooks de upload do Chrome MCP exigem refs de snapshot, não seletores CSS.
    - `existing-session file uploads currently support one file at a time.` → envie um upload por chamada em perfis Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → hooks de diálogo em perfis Chrome MCP não oferecem suporte a substituições de timeout.
    - `existing-session type does not support timeoutMs overrides.` → omita `timeoutMs` para `act:type` em perfis `profile="user"` / Chrome MCP existing-session, ou use um perfil de navegador gerenciado/CDP quando for necessário um timeout personalizado.
    - `existing-session evaluate does not support timeoutMs overrides.` → omita `timeoutMs` para `act:evaluate` em perfis `profile="user"` / Chrome MCP existing-session, ou use um perfil de navegador gerenciado/CDP quando for necessário um timeout personalizado.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` ainda exige um navegador gerenciado ou perfil CDP bruto.
    - substituições stale de viewport / modo escuro / localidade / offline em perfis attach-only ou CDP remoto → execute `openclaw browser stop --browser-profile <name>` para fechar a sessão ativa de controle e liberar o estado de emulação Playwright/CDP sem reiniciar todo o Gateway.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Browser (gerenciado pelo OpenClaw)](/pt-BR/tools/browser)
- [Solução de problemas do Browser](/pt-BR/tools/browser-linux-troubleshooting)

## Se você atualizou e algo quebrou de repente

A maioria das falhas após atualização é desvio de config ou aplicação de padrões mais rígidos.

<AccordionGroup>
  <Accordion title="1. O comportamento de auth e substituição de URL mudou">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    O que verificar:

    - Se `gateway.mode=remote`, chamadas da CLI podem estar mirando o remoto enquanto seu serviço local está íntegro.
    - Chamadas explícitas com `--url` não recorrem às credenciais armazenadas.

    Assinaturas comuns:

    - `gateway connect failed:` → alvo de URL incorreto.
    - `unauthorized` → endpoint alcançável, mas auth incorreto.

  </Accordion>
  <Accordion title="2. As proteções de bind e auth ficaram mais rígidas">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    O que verificar:

    - Binds não-loopback (`lan`, `tailnet`, `custom`) precisam de um caminho válido de auth do Gateway: auth compartilhada por token/senha ou uma implantação `trusted-proxy` não-loopback corretamente configurada.
    - Chaves antigas como `gateway.token` não substituem `gateway.auth.token`.

    Assinaturas comuns:

    - `refusing to bind gateway ... without auth` → bind não-loopback sem um caminho válido de auth do Gateway.
    - `Connectivity probe: failed` enquanto o runtime está em execução → Gateway vivo, mas inacessível com o auth/url atual.

  </Accordion>
  <Accordion title="3. O estado de pareamento e identidade de dispositivo mudou">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    O que verificar:

    - Aprovações pendentes de dispositivo para dashboard/nodes.
    - Aprovações pendentes de pareamento de DM após mudanças de política ou identidade.

    Assinaturas comuns:

    - `device identity required` → auth de dispositivo não foi satisfeita.
    - `pairing required` → remetente/dispositivo precisa ser aprovado.

  </Accordion>
</AccordionGroup>

Se a config do serviço e o runtime ainda divergirem após as verificações, reinstale os metadados do serviço a partir do mesmo diretório de perfil/estado:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Relacionado:

- [Authentication](/pt-BR/gateway/authentication)
- [Exec em segundo plano e ferramenta de processo](/pt-BR/gateway/background-process)
- [Pareamento controlado pelo Gateway](/pt-BR/gateway/pairing)

## Relacionado

- [Doctor](/pt-BR/gateway/doctor)
- [FAQ](/pt-BR/help/faq)
- [Runbook do Gateway](/pt-BR/gateway)
