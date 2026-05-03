---
read_when:
    - O hub de solução de problemas direcionou você para cá para um diagnóstico mais aprofundado
    - Você precisa de seções estáveis de runbook baseadas em sintomas com comandos exatos
sidebarTitle: Troubleshooting
summary: Manual operacional aprofundado de solução de problemas para Gateway, canais, automação, nós e navegador
title: Solução de problemas
x-i18n:
    generated_at: "2026-05-03T21:33:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19422615706ca09124b19dd3e21b2c13391d6daf2b1807e01b4ce2047d02e522
    source_path: gateway/troubleshooting.md
    workflow: 16
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
- `openclaw doctor` não relata problemas bloqueadores de configuração/serviço.
- `openclaw channels status --probe` mostra o status de transporte ativo por conta e, quando houver suporte, resultados de sondagem/auditoria como `works` ou `audit ok`.

## Instalações split brain e proteção de configuração mais recente

Use isto quando um serviço de Gateway parar inesperadamente após uma atualização, ou quando os logs mostrarem que um binário `openclaw` é mais antigo que a versão que escreveu `openclaw.json` pela última vez.

OpenClaw marca gravações de configuração com `meta.lastTouchedVersion`. Comandos somente leitura ainda podem inspecionar uma configuração escrita por um OpenClaw mais recente, mas mutações de processo e serviço se recusam a continuar a partir de um binário mais antigo. Ações bloqueadas incluem iniciar, parar, reiniciar e desinstalar o serviço de Gateway, reinstalação forçada do serviço, inicialização do Gateway em modo de serviço e limpeza de porta com `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    Corrija `PATH` para que `openclaw` resolva para a instalação mais recente e execute a ação novamente.
  </Step>
  <Step title="Reinstall the gateway service">
    Reinstale o serviço de Gateway pretendido a partir da instalação mais recente:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    Remova entradas obsoletas de pacote do sistema ou wrappers antigos que ainda apontam para um binário `openclaw` antigo.
  </Step>
</Steps>

<Warning>
Apenas para downgrade intencional ou recuperação de emergência, defina `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` para o comando único. Deixe sem definir para operação normal.
</Warning>

## Uso extra obrigatório do Anthropic 429 para contexto longo

Use isto quando logs/erros incluírem: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Procure por:

- O modelo Anthropic Opus/Sonnet selecionado tem `params.context1m: true`.
- A credencial Anthropic atual não é elegível para uso de contexto longo.
- As solicitações falham apenas em sessões/execuções de modelo longas que precisam do caminho beta de 1M.

Opções de correção:

<Steps>
  <Step title="Disable context1m">
    Desative `context1m` para esse modelo para voltar à janela de contexto normal.
  </Step>
  <Step title="Use an eligible credential">
    Use uma credencial Anthropic elegível para solicitações de contexto longo ou mude para uma chave de API Anthropic.
  </Step>
  <Step title="Configure fallback models">
    Configure modelos de fallback para que as execuções continuem quando solicitações Anthropic de contexto longo forem rejeitadas.
  </Step>
</Steps>

Relacionado:

- [Anthropic](/pt-BR/providers/anthropic)
- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Por que estou vendo HTTP 429 do Anthropic?](/pt-BR/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Backend local compatível com OpenAI passa em sondagens diretas, mas execuções de agente falham

Use isto quando:

- `curl ... /v1/models` funciona
- chamadas diretas pequenas para `/v1/chat/completions` funcionam
- execuções de modelo do OpenClaw falham apenas em turnos normais de agente

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Procure por:

- chamadas diretas pequenas têm sucesso, mas execuções do OpenClaw falham apenas em prompts maiores
- erros `model_not_found` ou 404, mesmo que `/v1/chat/completions` direto
  funcione com o mesmo id de modelo simples
- erros do backend sobre `messages[].content` esperar uma string
- avisos intermitentes `incomplete turn detected ... stopReason=stop payloads=0` com um backend local compatível com OpenAI
- falhas do backend que aparecem apenas com contagens maiores de tokens de prompt ou prompts completos do runtime do agente

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` com um servidor local no estilo MLX/vLLM → verifique se `baseUrl` inclui `/v1`, se `api` é `"openai-completions"` para backends `/v1/chat/completions` e se `models.providers.<provider>.models[].id` é o id local simples do provedor. Selecione-o com o prefixo do provedor uma vez, por exemplo `mlx/mlx-community/Qwen3-30B-A3B-6bit`; mantenha a entrada do catálogo como `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → o backend rejeita partes de conteúdo estruturado do Chat Completions. Correção: defina `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → o backend concluiu a solicitação de Chat Completions, mas não retornou texto de assistente visível ao usuário para esse turno. OpenClaw tenta novamente uma vez turnos vazios compatíveis com OpenAI que são seguros para replay; falhas persistentes geralmente significam que o backend está emitindo conteúdo vazio/não textual ou suprimindo o texto da resposta final.
    - solicitações diretas pequenas têm sucesso, mas execuções de agente do OpenClaw falham com travamentos de backend/modelo (por exemplo, Gemma em alguns builds `inferrs`) → o transporte do OpenClaw provavelmente já está correto; o backend está falhando no formato de prompt maior do runtime do agente.
    - as falhas diminuem após desativar ferramentas, mas não desaparecem → os esquemas de ferramentas eram parte da pressão, mas o problema restante ainda é capacidade do modelo/servidor upstream ou um bug do backend.

  </Accordion>
  <Accordion title="Fix options">
    1. Defina `compat.requiresStringContent: true` para backends Chat Completions que aceitam apenas string.
    2. Defina `compat.supportsTools: false` para modelos/backends que não conseguem lidar de forma confiável com a superfície de esquemas de ferramentas do OpenClaw.
    3. Reduza a pressão do prompt quando possível: bootstrap menor do workspace, histórico de sessão mais curto, modelo local mais leve ou um backend com suporte mais robusto a contexto longo.
    4. Se solicitações diretas pequenas continuarem passando enquanto turnos de agente do OpenClaw ainda travarem dentro do backend, trate como uma limitação upstream do servidor/modelo e registre uma reprodução lá com o formato de payload aceito.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Configuração](/pt-BR/gateway/configuration)
- [Modelos locais](/pt-BR/gateway/local-models)
- [Endpoints compatíveis com OpenAI](/pt-BR/gateway/configuration-reference#openai-compatible-endpoints)

## Sem respostas

Se os canais estão ativos, mas nada responde, verifique o roteamento e a política antes de reconectar qualquer coisa.

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
- Incompatibilidades de allowlist de canal/grupo.

Assinaturas comuns:

- `drop guild message (mention required` → mensagem de grupo ignorada até haver menção.
- `pairing request` → remetente precisa de aprovação.
- `blocked` / `allowlist` → remetente/canal foi filtrado pela política.

Relacionado:

- [Solução de problemas de canais](/pt-BR/channels/troubleshooting)
- [Grupos](/pt-BR/channels/groups)
- [Pareamento](/pt-BR/channels/pairing)

## Conectividade da interface de controle do dashboard

Quando a interface de dashboard/controle não conectar, valide URL, modo de autenticação e pressupostos de contexto seguro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Procure por:

- URL de sondagem e URL do dashboard corretas.
- Incompatibilidade de modo de autenticação/token entre cliente e Gateway.
- Uso de HTTP onde identidade do dispositivo é obrigatória.

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → contexto não seguro ou autenticação de dispositivo ausente.
    - `origin not allowed` → o `Origin` do navegador não está em `gateway.controlUi.allowedOrigins` (ou você está conectando a partir de uma origem de navegador que não é loopback sem uma allowlist explícita).
    - `device nonce required` / `device nonce mismatch` → o cliente não está concluindo o fluxo de autenticação de dispositivo baseado em desafio (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → o cliente assinou o payload errado (ou timestamp obsoleto) para o handshake atual.
    - `AUTH_TOKEN_MISMATCH` com `canRetryWithDeviceToken=true` → o cliente pode fazer uma nova tentativa confiável com token de dispositivo em cache.
    - Essa nova tentativa com token em cache reutiliza o conjunto de escopos em cache armazenado com o token de dispositivo pareado. Chamadores com `deviceToken` explícito / `scopes` explícitos mantêm o conjunto de escopos solicitado.
    - Fora desse caminho de nova tentativa, a precedência da autenticação de conexão é primeiro token/senha compartilhado explícito, depois `deviceToken` explícito, depois token de dispositivo armazenado e depois token de bootstrap.
    - No caminho assíncrono da interface de controle via Tailscale Serve, tentativas com falha para o mesmo `{scope, ip}` são serializadas antes de o limitador registrar a falha. Portanto, duas novas tentativas ruins concorrentes do mesmo cliente podem expor `retry later` na segunda tentativa em vez de duas incompatibilidades simples.
    - `too many failed authentication attempts (retry later)` de um cliente de navegador com origem loopback → falhas repetidas dessa mesma `Origin` normalizada são bloqueadas temporariamente; outra origem localhost usa um bucket separado.
    - `unauthorized` repetido após essa nova tentativa → divergência de token compartilhado/token de dispositivo; atualize a configuração do token e reaprove/gire o token de dispositivo se necessário.
    - `gateway connect failed:` → destino de host/porta/url incorreto.

  </Accordion>
</AccordionGroup>

### Mapa rápido de códigos de detalhes de autenticação

Use `error.details.code` da resposta `connect` com falha para escolher a próxima ação:

| Código de detalhe            | Significado                                                                                                                                                                                 | Ação recomendada                                                                                                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | O cliente não enviou um token compartilhado obrigatório.                                                                                                                                    | Cole/defina o token no cliente e tente novamente. Para caminhos do painel: `openclaw config get gateway.auth.token` e depois cole nas configurações da Control UI.                                                                                                                            |
| `AUTH_TOKEN_MISMATCH`        | O token compartilhado não correspondeu ao token de autenticação do gateway.                                                                                                                 | Se `canRetryWithDeviceToken=true`, permita uma nova tentativa confiável. Novas tentativas com token em cache reutilizam escopos aprovados armazenados; chamadores explícitos de `deviceToken` / `scopes` mantêm os escopos solicitados. Se ainda falhar, execute a [lista de verificação de recuperação de divergência de token](/pt-BR/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | O token em cache por dispositivo está obsoleto ou foi revogado.                                                                                                                             | Rotacione/reaprove o token do dispositivo usando a [CLI de dispositivos](/pt-BR/cli/devices) e depois reconecte.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | A identidade do dispositivo precisa de aprovação. Verifique `error.details.reason` para `not-paired`, `scope-upgrade`, `role-upgrade` ou `metadata-upgrade`, e use `requestId` / `remediationHint` quando presentes. | Aprove a solicitação pendente: `openclaw devices list` e depois `openclaw devices approve <requestId>`. Upgrades de escopo/função usam o mesmo fluxo depois que você revisar o acesso solicitado.                                                                                              |

<Note>
RPCs diretos de back-end por loopback autenticados com o token/senha compartilhado do gateway não devem depender da linha de base de escopo de dispositivo pareado da CLI. Se subagentes ou outras chamadas internas ainda falharem com `scope-upgrade`, verifique se o chamador está usando `client.id: "gateway-client"` e `client.mode: "backend"` e se não está forçando um `deviceIdentity` ou token de dispositivo explícito.
</Note>

Verificação de migração da autenticação de dispositivo v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Se os logs mostrarem erros de nonce/assinatura, atualize o cliente conectado e verifique-o:

<Steps>
  <Step title="Aguardar connect.challenge">
    O cliente aguarda o `connect.challenge` emitido pelo gateway.
  </Step>
  <Step title="Assinar a carga útil">
    O cliente assina a carga útil vinculada ao desafio.
  </Step>
  <Step title="Enviar o nonce do dispositivo">
    O cliente envia `connect.params.device.nonce` com o mesmo nonce do desafio.
  </Step>
</Steps>

Se `openclaw devices rotate` / `revoke` / `remove` for negado inesperadamente:

- sessões de token de dispositivo pareado podem gerenciar apenas **seu próprio** dispositivo, a menos que o chamador também tenha `operator.admin`
- `openclaw devices rotate --scope ...` só pode solicitar escopos de operador que a sessão do chamador já possui

Relacionado:

- [Configuração](/pt-BR/gateway/configuration) (modos de autenticação do gateway)
- [Control UI](/pt-BR/web/control-ui)
- [Dispositivos](/pt-BR/cli/devices)
- [Acesso remoto](/pt-BR/gateway/remote)
- [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth)

## Serviço do Gateway não está em execução

Use isto quando o serviço estiver instalado, mas o processo não permanecer ativo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Procure por:

- `Runtime: stopped` com dicas de saída.
- Incompatibilidade de configuração do serviço (`Config (cli)` vs `Config (service)`).
- Conflitos de porta/listener.
- Instalações extras de launchd/systemd/schtasks quando `--deep` é usado.
- Dicas de limpeza de `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Assinaturas comuns">
    - `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → o modo de gateway local não está habilitado, ou o arquivo de configuração foi sobrescrito e perdeu `gateway.mode`. Correção: defina `gateway.mode="local"` na sua configuração, ou execute novamente `openclaw onboard --mode local` / `openclaw setup` para recarimbar a configuração esperada de modo local. Se você estiver executando o OpenClaw via Podman, o caminho padrão da configuração é `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → vinculação sem loopback sem um caminho de autenticação de gateway válido (token/senha, ou proxy confiável quando configurado).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflito de porta.
    - `Other gateway-like services detected (best effort)` → existem unidades launchd/systemd/schtasks obsoletas ou paralelas. A maioria das configurações deve manter um gateway por máquina; se você precisar de mais de um, isole portas + configuração/estado/workspace. Consulte [/gateway#multiple-gateways-same-host](/pt-BR/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` do doctor → existe uma unidade systemd de sistema enquanto o serviço de usuário está ausente. Remova ou desabilite a duplicata antes de permitir que o doctor instale um serviço de usuário, ou defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` se a unidade de sistema for o supervisor pretendido.
    - `Gateway service port does not match current gateway config` → o supervisor instalado ainda fixa o `--port` antigo. Execute `openclaw doctor --fix` ou `openclaw gateway install --force` e depois reinicie o serviço do gateway.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Execução em segundo plano e ferramenta de processo](/pt-BR/gateway/background-process)
- [Configuração](/pt-BR/gateway/configuration)
- [Doctor](/pt-BR/gateway/doctor)

## Gateway rejeitou configuração inválida

Use isto quando a inicialização do Gateway falhar com `Invalid config` ou os logs de recarregamento a quente disserem
que uma edição inválida foi ignorada.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Procure por:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- Um arquivo `openclaw.json.rejected.*` com timestamp ao lado da configuração ativa
- Um arquivo `openclaw.json.clobbered.*` com timestamp se `doctor --fix` reparou uma edição direta quebrada

<AccordionGroup>
  <Accordion title="O que aconteceu">
    - A configuração não foi validada durante a inicialização, o recarregamento a quente ou uma gravação de propriedade do OpenClaw.
    - A inicialização do Gateway falha fechada em vez de reescrever `openclaw.json`.
    - O recarregamento a quente ignora edições externas inválidas e mantém a configuração de runtime atual ativa.
    - Gravações de propriedade do OpenClaw rejeitam cargas úteis inválidas/destrutivas antes do commit e salvam `.rejected.*`.
    - `openclaw doctor --fix` é responsável pelo reparo. Ele pode remover prefixos não JSON ou restaurar a última cópia válida conhecida enquanto preserva a carga útil rejeitada como `.clobbered.*`.

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
    - `.clobbered.*` existe → o doctor preservou uma edição externa quebrada ao reparar a configuração ativa.
    - `.rejected.*` existe → uma gravação de configuração de propriedade do OpenClaw falhou em verificações de esquema ou sobrescrita antes do commit.
    - `Config write rejected:` → a gravação tentou remover a forma obrigatória, reduzir drasticamente o arquivo ou persistir configuração inválida.
    - `config reload skipped (invalid config):` → uma edição direta falhou na validação e foi ignorada pelo Gateway em execução.
    - `Invalid config at ...` → a inicialização falhou antes de os serviços do Gateway iniciarem.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` ou `size-drop-vs-last-good:*` → uma gravação de propriedade do OpenClaw foi rejeitada porque perdeu campos ou tamanho em comparação com o backup da última versão válida conhecida.
    - `Config last-known-good promotion skipped` → o candidato continha placeholders de segredos redigidos, como `***`.

  </Accordion>
  <Accordion title="Opções de correção">
    1. Execute `openclaw doctor --fix` para permitir que o doctor repare a configuração prefixada/sobrescrita ou restaure a última versão válida conhecida.
    2. Copie apenas as chaves pretendidas de `.clobbered.*` ou `.rejected.*` e depois aplique-as com `openclaw config set` ou `config.patch`.
    3. Execute `openclaw config validate` antes de reiniciar.
    4. Se editar manualmente, mantenha a configuração JSON5 completa, não apenas o objeto parcial que você queria alterar.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Config](/pt-BR/cli/config)
- [Configuração: recarregamento a quente](/pt-BR/gateway/configuration#config-hot-reload)
- [Configuração: validação estrita](/pt-BR/gateway/configuration#strict-validation)
- [Doctor](/pt-BR/gateway/doctor)

## Avisos da sondagem do Gateway

Use isto quando `openclaw gateway probe` alcançar algo, mas ainda imprimir um bloco de aviso.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Procure por:

- `warnings[].code` e `primaryTargetId` na saída JSON.
- Se o aviso é sobre fallback de SSH, múltiplos gateways, escopos ausentes ou refs de autenticação não resolvidas.

Assinaturas comuns:

- `SSH tunnel failed to start; falling back to direct probes.` → a configuração de SSH falhou, mas o comando ainda tentou alvos diretos configurados/de loopback.
- `multiple reachable gateways detected` → mais de um alvo respondeu. Normalmente isso significa uma configuração multi-gateway intencional ou listeners obsoletos/duplicados.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → a conexão funcionou, mas a RPC de detalhes é limitada por escopo; pareie a identidade do dispositivo ou use credenciais com `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → a conexão funcionou, mas o conjunto completo de RPCs de diagnóstico expirou ou falhou. Trate isto como um Gateway alcançável com diagnósticos degradados; compare `connect.ok` e `connect.rpcOk` na saída `--json`.
- `Capability: pairing-pending` ou `gateway closed (1008): pairing required` → o gateway respondeu, mas este cliente ainda precisa de pareamento/aprovação antes do acesso normal de operador.
- texto de aviso de SecretRef `gateway.auth.*` / `gateway.remote.*` não resolvido → o material de autenticação não estava disponível neste caminho de comando para o alvo com falha.

Relacionado:

- [Gateway](/pt-BR/cli/gateway)
- [Múltiplos gateways no mesmo host](/pt-BR/gateway#multiple-gateways-same-host)
- [Acesso remoto](/pt-BR/gateway/remote)

## Canal conectado, mensagens não fluem

Se o estado do canal estiver conectado, mas o fluxo de mensagens estiver parado, concentre-se em política, permissões e regras de entrega específicas do canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Procure por:

- Política de DM (`pairing`, `allowlist`, `open`, `disabled`).
- Lista de permissões de grupo e requisitos de menção.
- Permissões/escopos ausentes da API do canal.

Assinaturas comuns:

- `mention required` → mensagem ignorada pela política de menção de grupo.
- `pairing` / rastros de aprovação pendente → remetente não aprovado.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema de autenticação/permissões do canal.

Relacionado:

- [Solução de problemas de canais](/pt-BR/channels/troubleshooting)
- [Discord](/pt-BR/channels/discord)
- [Telegram](/pt-BR/channels/telegram)
- [WhatsApp](/pt-BR/channels/whatsapp)

## Entrega de Cron e Heartbeat

Se Cron ou Heartbeat não foi executado ou não entregou, verifique primeiro o estado do agendador e depois o destino da entrega.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Procure por:

- Cron habilitado e próxima ativação presente.
- Status do histórico de execução do trabalho (`ok`, `skipped`, `error`).
- Motivos para pular Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Assinaturas comuns">
    - `cron: scheduler disabled; jobs will not run automatically` → cron desabilitado.
    - `cron: timer tick failed` → tique do agendador falhou; verifique erros de arquivo/log/runtime.
    - `heartbeat skipped` com `reason=quiet-hours` → fora da janela de horas ativas.
    - `heartbeat skipped` com `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe, mas contém apenas linhas em branco / cabeçalhos markdown, então o OpenClaw pula a chamada ao modelo.
    - `heartbeat skipped` com `reason=no-tasks-due` → `HEARTBEAT.md` contém um bloco `tasks:`, mas nenhuma das tarefas vence neste tique.
    - `heartbeat: unknown accountId` → ID de conta inválido para o destino de entrega do Heartbeat.
    - `heartbeat skipped` com `reason=dm-blocked` → o destino do Heartbeat foi resolvido para um destino do tipo DM enquanto `agents.defaults.heartbeat.directPolicy` (ou a substituição por agente) está definido como `block`.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Heartbeat](/pt-BR/gateway/heartbeat)
- [Tarefas agendadas](/pt-BR/automation/cron-jobs)
- [Tarefas agendadas: solução de problemas](/pt-BR/automation/cron-jobs#troubleshooting)

## Node pareado, ferramenta falha

Se um Node está pareado, mas as ferramentas falham, isole o estado de primeiro plano, permissões e aprovações.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Procure por:

- Node online com as capacidades esperadas.
- Concessões de permissão do sistema operacional para câmera/microfone/localização/tela.
- Aprovações de execução e estado da lista de permissões.

Assinaturas comuns:

- `NODE_BACKGROUND_UNAVAILABLE` → o aplicativo do Node deve estar em primeiro plano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permissão do sistema operacional ausente.
- `SYSTEM_RUN_DENIED: approval required` → aprovação de execução pendente.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado pela lista de permissões.

Relacionado:

- [Aprovações de execução](/pt-BR/tools/exec-approvals)
- [Solução de problemas de Node](/pt-BR/nodes/troubleshooting)
- [Nodes](/pt-BR/nodes/index)

## Ferramenta de navegador falha

Use isto quando ações da ferramenta de navegador falharem mesmo que o próprio Gateway esteja íntegro.

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
- Acessibilidade do perfil CDP.
- Disponibilidade local do Chrome para perfis `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Assinaturas de Plugin / executável">
    - `unknown command "browser"` ou `unknown command 'browser'` → o plugin de navegador incluído está excluído por `plugins.allow`.
    - ferramenta de navegador ausente / indisponível enquanto `browser.enabled=true` → `plugins.allow` exclui `browser`, então o plugin nunca foi carregado.
    - `Failed to start Chrome CDP on port` → o processo do navegador falhou ao iniciar.
    - `browser.executablePath not found` → o caminho configurado é inválido.
    - `browser.cdpUrl must be http(s) or ws(s)` → a URL CDP configurada usa um esquema sem suporte, como `file:` ou `ftp:`.
    - `browser.cdpUrl has invalid port` → a URL CDP configurada tem uma porta inválida ou fora do intervalo.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → a instalação atual do Gateway não tem a dependência principal de runtime de navegador; reinstale ou atualize o OpenClaw e reinicie o Gateway. Snapshots ARIA e capturas de tela básicas da página ainda podem funcionar, mas navegação, snapshots de IA, capturas de tela de elementos por seletor CSS e exportação de PDF permanecem indisponíveis.

  </Accordion>
  <Accordion title="Assinaturas de Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → a existing-session do Chrome MCP ainda não conseguiu se anexar ao diretório de dados do navegador selecionado. Abra a página de inspeção do navegador, habilite a depuração remota, mantenha o navegador aberto, aprove o primeiro prompt de anexação e tente novamente. Se o estado autenticado não for necessário, prefira o perfil gerenciado `openclaw`.
    - `No Chrome tabs found for profile="user"` → o perfil de anexação do Chrome MCP não tem abas locais do Chrome abertas.
    - `Remote CDP for profile "<name>" is not reachable` → o endpoint CDP remoto configurado não está acessível a partir do host do Gateway.
    - `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → o perfil somente anexação não tem destino acessível, ou o endpoint HTTP respondeu, mas o WebSocket CDP ainda não pôde ser aberto.

  </Accordion>
  <Accordion title="Assinaturas de elemento / captura de tela / upload">
    - `fullPage is not supported for element screenshots` → a solicitação de captura de tela misturou `--full-page` com `--ref` ou `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → chamadas de captura de tela do Chrome MCP / `existing-session` devem usar captura de página ou um `--ref` de snapshot, não `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooks de upload do Chrome MCP precisam de refs de snapshot, não seletores CSS.
    - `existing-session file uploads currently support one file at a time.` → envie um upload por chamada em perfis Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → hooks de diálogo em perfis Chrome MCP não dão suporte a substituições de timeout.
    - `existing-session type does not support timeoutMs overrides.` → omita `timeoutMs` para `act:type` em perfis `profile="user"` / Chrome MCP existing-session, ou use um perfil de navegador gerenciado/CDP quando um timeout personalizado for necessário.
    - `existing-session evaluate does not support timeoutMs overrides.` → omita `timeoutMs` para `act:evaluate` em perfis `profile="user"` / Chrome MCP existing-session, ou use um perfil de navegador gerenciado/CDP quando um timeout personalizado for necessário.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` ainda exige um navegador gerenciado ou perfil CDP bruto.
    - substituições obsoletas de viewport / modo escuro / localidade / offline em perfis somente anexação ou CDP remoto → execute `openclaw browser stop --browser-profile <name>` para fechar a sessão de controle ativa e liberar o estado de emulação Playwright/CDP sem reiniciar todo o Gateway.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Navegador (gerenciado pelo OpenClaw)](/pt-BR/tools/browser)
- [Solução de problemas de navegador](/pt-BR/tools/browser-linux-troubleshooting)

## Se você atualizou e algo quebrou de repente

A maior parte das quebras pós-atualização é desvio de configuração ou padrões mais rigorosos agora sendo aplicados.

<AccordionGroup>
  <Accordion title="1. Comportamento de autenticação e substituição de URL alterado">
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

    - `gateway connect failed:` → destino de URL errado.
    - `unauthorized` → endpoint acessível, mas autenticação errada.

  </Accordion>
  <Accordion title="2. Proteções de bind e autenticação estão mais rigorosas">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    O que verificar:

    - Binds que não são loopback (`lan`, `tailnet`, `custom`) precisam de um caminho válido de autenticação do Gateway: autenticação por token/senha compartilhados ou uma implantação `trusted-proxy` não loopback configurada corretamente.
    - Chaves antigas como `gateway.token` não substituem `gateway.auth.token`.

    Assinaturas comuns:

    - `refusing to bind gateway ... without auth` → bind não loopback sem um caminho válido de autenticação do Gateway.
    - `Connectivity probe: failed` enquanto o runtime está em execução → Gateway ativo, mas inacessível com a autenticação/URL atual.

  </Accordion>
  <Accordion title="3. Estado de pareamento e identidade do dispositivo alterado">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    O que verificar:

    - Aprovações de dispositivo pendentes para painel/Nodes.
    - Aprovações de pareamento de DM pendentes após mudanças de política ou identidade.

    Assinaturas comuns:

    - `device identity required` → autenticação do dispositivo não satisfeita.
    - `pairing required` → remetente/dispositivo deve ser aprovado.

  </Accordion>
</AccordionGroup>

Se a configuração do serviço e o runtime ainda discordarem após as verificações, reinstale os metadados do serviço a partir do mesmo diretório de perfil/estado:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Relacionado:

- [Autenticação](/pt-BR/gateway/authentication)
- [Execução em segundo plano e ferramenta de processo](/pt-BR/gateway/background-process)
- [Pareamento pertencente ao Gateway](/pt-BR/gateway/pairing)

## Relacionado

- [Doctor](/pt-BR/gateway/doctor)
- [FAQ](/pt-BR/help/faq)
- [Runbook do Gateway](/pt-BR/gateway)
