---
read_when:
    - A central de solução de problemas direcionou você para cá para um diagnóstico mais aprofundado
    - Você precisa de seções estáveis de manual operacional baseadas em sintomas com comandos exatos
sidebarTitle: Troubleshooting
summary: Runbook aprofundado de solução de problemas para Gateway, canais, automação, nós e navegador
title: Solução de problemas
x-i18n:
    generated_at: "2026-05-02T05:48:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 815fbbca4d12b4b9c65b1172e07606d0eaf4c64df7fd6ca23a8f8d104b78c2a9
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

Sinais esperados de funcionamento saudável:

- `openclaw gateway status` mostra `Runtime: running`, `Connectivity probe: ok` e uma linha `Capability: ...`.
- `openclaw doctor` não relata problemas bloqueantes de configuração/serviço.
- `openclaw channels status --probe` mostra o status de transporte ativo por conta e, onde houver suporte, resultados de sondagem/auditoria como `works` ou `audit ok`.

## Instalações split brain e proteção de configuração mais nova

Use isto quando um serviço de Gateway parar inesperadamente após uma atualização, ou quando os logs mostrarem que um binário `openclaw` é mais antigo que a versão que gravou `openclaw.json` pela última vez.

O OpenClaw marca gravações de configuração com `meta.lastTouchedVersion`. Comandos somente leitura ainda podem inspecionar uma configuração gravada por um OpenClaw mais novo, mas mutações de processo e serviço se recusam a continuar a partir de um binário mais antigo. Ações bloqueadas incluem iniciar, parar, reiniciar, desinstalar o serviço de Gateway, reinstalação forçada de serviço, inicialização do Gateway em modo de serviço e limpeza de porta com `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Corrigir PATH">
    Corrija `PATH` para que `openclaw` resolva para a instalação mais nova, então execute novamente a ação.
  </Step>
  <Step title="Reinstalar o serviço de Gateway">
    Reinstale o serviço de Gateway pretendido a partir da instalação mais nova:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remover wrappers obsoletos">
    Remova pacotes de sistema obsoletos ou entradas antigas de wrapper que ainda apontam para um binário `openclaw` antigo.
  </Step>
</Steps>

<Warning>
Apenas para downgrade intencional ou recuperação emergencial, defina `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` para o único comando. Deixe indefinido para operação normal.
</Warning>

## Uso extra da Anthropic 429 exigido para contexto longo

Use isto quando logs/erros incluírem: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Procure por:

- O modelo Anthropic Opus/Sonnet selecionado tem `params.context1m: true`.
- A credencial Anthropic atual não está qualificada para uso de contexto longo.
- As solicitações falham apenas em sessões longas/execuções de modelo que precisam do caminho beta de 1M.

Opções de correção:

<Steps>
  <Step title="Desabilitar context1m">
    Desabilite `context1m` para esse modelo para retornar à janela de contexto normal.
  </Step>
  <Step title="Usar uma credencial qualificada">
    Use uma credencial Anthropic qualificada para solicitações de contexto longo, ou mude para uma chave de API Anthropic.
  </Step>
  <Step title="Configurar modelos de fallback">
    Configure modelos de fallback para que as execuções continuem quando solicitações Anthropic de contexto longo forem rejeitadas.
  </Step>
</Steps>

Relacionado:

- [Anthropic](/pt-BR/providers/anthropic)
- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Por que estou vendo HTTP 429 da Anthropic?](/pt-BR/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

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

- chamadas diretas pequenas são bem-sucedidas, mas execuções do OpenClaw falham apenas com prompts maiores
- erros `model_not_found` ou 404, mesmo que `/v1/chat/completions` direto
  funcione com o mesmo id de modelo simples
- erros do backend sobre `messages[].content` esperar uma string
- avisos intermitentes `incomplete turn detected ... stopReason=stop payloads=0` com um backend local compatível com OpenAI
- falhas do backend que aparecem apenas com contagens maiores de tokens de prompt ou prompts completos do runtime de agente

<AccordionGroup>
  <Accordion title="Assinaturas comuns">
    - `model_not_found` com um servidor local no estilo MLX/vLLM → verifique se `baseUrl` inclui `/v1`, se `api` é `"openai-completions"` para backends `/v1/chat/completions` e se `models.providers.<provider>.models[].id` é o id simples local do provedor. Selecione-o com o prefixo do provedor uma vez, por exemplo `mlx/mlx-community/Qwen3-30B-A3B-6bit`; mantenha a entrada do catálogo como `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → o backend rejeita partes estruturadas de conteúdo do Chat Completions. Correção: defina `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → o backend concluiu a solicitação de Chat Completions, mas não retornou texto de assistente visível ao usuário para esse turno. O OpenClaw tenta novamente uma vez turnos vazios compatíveis com OpenAI que sejam seguros para replay; falhas persistentes geralmente significam que o backend está emitindo conteúdo vazio/não textual ou suprimindo o texto da resposta final.
    - solicitações diretas pequenas são bem-sucedidas, mas execuções de agente do OpenClaw falham com travamentos de backend/modelo (por exemplo, Gemma em algumas builds `inferrs`) → o transporte do OpenClaw provavelmente já está correto; o backend está falhando no formato maior do prompt de runtime do agente.
    - as falhas diminuem após desabilitar ferramentas, mas não desaparecem → os esquemas de ferramenta faziam parte da pressão, mas o problema restante ainda é capacidade upstream do modelo/servidor ou um bug do backend.

  </Accordion>
  <Accordion title="Opções de correção">
    1. Defina `compat.requiresStringContent: true` para backends Chat Completions que aceitam somente string.
    2. Defina `compat.supportsTools: false` para modelos/backends que não conseguem lidar de forma confiável com a superfície de esquemas de ferramenta do OpenClaw.
    3. Reduza a pressão do prompt onde possível: bootstrap de workspace menor, histórico de sessão mais curto, modelo local mais leve ou um backend com suporte mais forte a contexto longo.
    4. Se solicitações diretas pequenas continuarem passando enquanto turnos de agente do OpenClaw ainda travam dentro do backend, trate como uma limitação upstream do servidor/modelo e registre uma reprodução lá com o formato de payload aceito.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Configuração](/pt-BR/gateway/configuration)
- [Modelos locais](/pt-BR/gateway/local-models)
- [Endpoints compatíveis com OpenAI](/pt-BR/gateway/configuration-reference#openai-compatible-endpoints)

## Sem respostas

Se os canais estiverem ativos, mas nada responder, verifique roteamento e política antes de reconectar qualquer coisa.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Procure por:

- Pareamento pendente para remetentes de DM.
- Bloqueio de menção em grupo (`requireMention`, `mentionPatterns`).
- Incompatibilidades de allowlist de canal/grupo.

Assinaturas comuns:

- `drop guild message (mention required` → mensagem de grupo ignorada até haver menção.
- `pairing request` → o remetente precisa de aprovação.
- `blocked` / `allowlist` → remetente/canal foi filtrado por política.

Relacionado:

- [Solução de problemas de canais](/pt-BR/channels/troubleshooting)
- [Grupos](/pt-BR/channels/groups)
- [Pareamento](/pt-BR/channels/pairing)

## Conectividade da UI de controle do dashboard

Quando a UI de dashboard/controle não se conectar, valide a URL, o modo de autenticação e as suposições de contexto seguro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Procure por:

- URL de sondagem e URL do dashboard corretas.
- Incompatibilidade de modo/token de autenticação entre cliente e Gateway.
- Uso de HTTP quando identidade de dispositivo é exigida.

<AccordionGroup>
  <Accordion title="Assinaturas de conexão/autenticação">
    - `device identity required` → contexto não seguro ou autenticação de dispositivo ausente.
    - `origin not allowed` → o `Origin` do navegador não está em `gateway.controlUi.allowedOrigins` (ou você está conectando a partir de uma origem de navegador que não é loopback sem uma allowlist explícita).
    - `device nonce required` / `device nonce mismatch` → o cliente não está concluindo o fluxo de autenticação de dispositivo baseado em desafio (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → o cliente assinou o payload errado (ou timestamp obsoleto) para o handshake atual.
    - `AUTH_TOKEN_MISMATCH` com `canRetryWithDeviceToken=true` → o cliente pode fazer uma nova tentativa confiável com o token de dispositivo em cache.
    - Essa nova tentativa com token em cache reutiliza o conjunto de escopos em cache armazenado com o token de dispositivo pareado. Chamadores com `deviceToken` explícito / `scopes` explícitos mantêm o conjunto de escopos solicitado.
    - Fora desse caminho de nova tentativa, a precedência de autenticação de conexão é primeiro token/senha compartilhado explícito, depois `deviceToken` explícito, depois token de dispositivo armazenado, depois token de bootstrap.
    - No caminho assíncrono da UI de Controle Tailscale Serve, tentativas malsucedidas para o mesmo `{scope, ip}` são serializadas antes de o limitador registrar a falha. Duas novas tentativas simultâneas ruins do mesmo cliente podem, portanto, expor `retry later` na segunda tentativa em vez de duas incompatibilidades simples.
    - `too many failed authentication attempts (retry later)` de um cliente de loopback com origem de navegador → falhas repetidas dessa mesma `Origin` normalizada são bloqueadas temporariamente; outra origem localhost usa um bucket separado.
    - `unauthorized` repetido após essa nova tentativa → divergência de token compartilhado/token de dispositivo; atualize a configuração de token e aprove novamente/rotacione o token de dispositivo se necessário.
    - `gateway connect failed:` → destino incorreto de host/porta/url.

  </Accordion>
</AccordionGroup>

### Mapa rápido de códigos de detalhe de autenticação

Use `error.details.code` da resposta `connect` com falha para escolher a próxima ação:

| Código de detalhe            | Significado                                                                                                                                                                                | Ação recomendada                                                                                                                                                                                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_TOKEN_MISSING`         | O cliente não enviou um token compartilhado obrigatório.                                                                                                                                   | Cole/defina o token no cliente e tente novamente. Para caminhos do painel: `openclaw config get gateway.auth.token` e depois cole nas configurações da Control UI.                                                                                                                   |
| `AUTH_TOKEN_MISMATCH`        | O token compartilhado não correspondeu ao token de autenticação do Gateway.                                                                                                                 | Se `canRetryWithDeviceToken=true`, permita uma nova tentativa confiável. Novas tentativas com token em cache reutilizam os escopos aprovados armazenados; chamadores explícitos de `deviceToken` / `scopes` mantêm os escopos solicitados. Se ainda falhar, execute a [lista de verificação de recuperação de desvio de token](/pt-BR/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | O token em cache por dispositivo está desatualizado ou foi revogado.                                                                                                                       | Rotacione/reaprove o token do dispositivo usando a [CLI de dispositivos](/pt-BR/cli/devices) e reconecte.                                                                                                                                                                                   |
| `PAIRING_REQUIRED`           | A identidade do dispositivo precisa de aprovação. Verifique `error.details.reason` para `not-paired`, `scope-upgrade`, `role-upgrade` ou `metadata-upgrade`, e use `requestId` / `remediationHint` quando presentes. | Aprove a solicitação pendente: `openclaw devices list` e depois `openclaw devices approve <requestId>`. Atualizações de escopo/função usam o mesmo fluxo depois que você revisar o acesso solicitado.                                                                                 |

<Note>
RPCs diretos de backend em loopback autenticados com o token/senha compartilhado do Gateway não devem depender da linha de base de escopo de dispositivo pareado da CLI. Se subagentes ou outras chamadas internas ainda falharem com `scope-upgrade`, verifique se o chamador está usando `client.id: "gateway-client"` e `client.mode: "backend"` e não está forçando uma `deviceIdentity` explícita ou token de dispositivo.
</Note>

Verificação de migração de autenticação de dispositivo v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Se os logs mostrarem erros de nonce/assinatura, atualize o cliente de conexão e verifique-o:

<Steps>
  <Step title="Aguardar connect.challenge">
    O cliente aguarda o `connect.challenge` emitido pelo Gateway.
  </Step>
  <Step title="Assinar o payload">
    O cliente assina o payload vinculado ao desafio.
  </Step>
  <Step title="Enviar o nonce do dispositivo">
    O cliente envia `connect.params.device.nonce` com o mesmo nonce do desafio.
  </Step>
</Steps>

Se `openclaw devices rotate` / `revoke` / `remove` for negado inesperadamente:

- sessões de token de dispositivo pareado podem gerenciar apenas **seu próprio** dispositivo, a menos que o chamador também tenha `operator.admin`
- `openclaw devices rotate --scope ...` só pode solicitar escopos de operador que a sessão do chamador já possua

Relacionado:

- [Configuração](/pt-BR/gateway/configuration) (modos de autenticação do Gateway)
- [Control UI](/pt-BR/web/control-ui)
- [Dispositivos](/pt-BR/cli/devices)
- [Acesso remoto](/pt-BR/gateway/remote)
- [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth)

## Serviço Gateway não está em execução

Use isto quando o serviço está instalado, mas o processo não permanece ativo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # também verifica serviços em nível de sistema
```

Procure por:

- `Runtime: stopped` com dicas de saída.
- Incompatibilidade de configuração do serviço (`Config (cli)` vs `Config (service)`).
- Conflitos de porta/listener.
- Instalações extras de launchd/systemd/schtasks quando `--deep` é usado.
- Dicas de limpeza de `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Assinaturas comuns">
    - `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → o modo de Gateway local não está ativado, ou o arquivo de configuração foi sobrescrito e perdeu `gateway.mode`. Correção: defina `gateway.mode="local"` na sua configuração, ou execute novamente `openclaw onboard --mode local` / `openclaw setup` para remarcar a configuração esperada do modo local. Se você estiver executando o OpenClaw via Podman, o caminho de configuração padrão é `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → bind fora de loopback sem um caminho válido de autenticação do Gateway (token/senha, ou trusted-proxy quando configurado).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflito de porta.
    - `Other gateway-like services detected (best effort)` → existem unidades launchd/systemd/schtasks obsoletas ou paralelas. A maioria das configurações deve manter um Gateway por máquina; se você realmente precisar de mais de um, isole portas + configuração/estado/workspace. Veja [/gateway#multiple-gateways-same-host](/pt-BR/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` do doctor → existe uma unidade systemd de sistema enquanto o serviço em nível de usuário está ausente. Remova ou desative a duplicata antes de permitir que o doctor instale um serviço de usuário, ou defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` se a unidade de sistema for o supervisor pretendido.
    - `Gateway service port does not match current gateway config` → o supervisor instalado ainda fixa o `--port` antigo. Execute `openclaw doctor --fix` ou `openclaw gateway install --force`, depois reinicie o serviço Gateway.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Execução em segundo plano e ferramenta de processo](/pt-BR/gateway/background-process)
- [Configuração](/pt-BR/gateway/configuration)
- [Doctor](/pt-BR/gateway/doctor)

## Gateway restaurou a última configuração válida conhecida

Use isto quando o Gateway inicia, mas os logs dizem que ele restaurou `openclaw.json`.

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
- Um arquivo `openclaw.json.clobbered.*` com carimbo de data/hora ao lado da configuração ativa
- Um evento de sistema do agente principal que começa com `Config recovery warning`

<AccordionGroup>
  <Accordion title="O que aconteceu">
    - A configuração rejeitada não foi validada durante a inicialização ou o recarregamento dinâmico.
    - O OpenClaw preservou o payload rejeitado como `.clobbered.*`.
    - A configuração ativa foi restaurada da última cópia validada da última configuração válida conhecida.
    - O próximo turno do agente principal é avisado para não reescrever cegamente a configuração rejeitada.
    - Se todos os problemas de validação estivessem em `plugins.entries.<id>...`, o OpenClaw não restauraria o arquivo inteiro. Falhas locais do Plugin permanecem visíveis enquanto configurações de usuário não relacionadas continuam na configuração ativa.

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
    - `.rejected.*` existe → uma gravação de configuração pertencente ao OpenClaw falhou no schema ou nas verificações de sobrescrita antes do commit.
    - `Config write rejected:` → a gravação tentou remover a estrutura obrigatória, reduzir drasticamente o arquivo ou persistir uma configuração inválida.
    - `Rejected validation details:` → o log de recuperação ou aviso do agente principal inclui o caminho de schema que causou a restauração, como `agents.defaults.execution` ou `gateway.auth.password.source`.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` ou `size-drop-vs-last-good:*` → a inicialização tratou o arquivo atual como sobrescrito porque ele perdeu campos ou tamanho em comparação com o backup da última configuração válida conhecida.
    - `Config last-known-good promotion skipped` → o candidato continha placeholders de segredos redigidos, como `***`.

  </Accordion>
  <Accordion title="Opções de correção">
    1. Mantenha a configuração ativa restaurada se ela estiver correta.
    2. Copie apenas as chaves pretendidas de `.clobbered.*` ou `.rejected.*`, depois aplique-as com `openclaw config set` ou `config.patch`.
    3. Execute `openclaw config validate` antes de reiniciar.
    4. Se você editar manualmente, mantenha a configuração JSON5 completa, não apenas o objeto parcial que queria alterar.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Configuração](/pt-BR/cli/config)
- [Configuração: recarregamento dinâmico](/pt-BR/gateway/configuration#config-hot-reload)
- [Configuração: validação estrita](/pt-BR/gateway/configuration#strict-validation)
- [Doctor](/pt-BR/gateway/doctor)

## Avisos de sondagem do Gateway

Use isto quando `openclaw gateway probe` alcança algo, mas ainda imprime um bloco de aviso.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Procure por:

- `warnings[].code` e `primaryTargetId` na saída JSON.
- Se o aviso é sobre fallback de SSH, múltiplos Gateways, escopos ausentes ou refs de autenticação não resolvidas.

Assinaturas comuns:

- `SSH tunnel failed to start; falling back to direct probes.` → a configuração de SSH falhou, mas o comando ainda tentou alvos diretos configurados/loopback.
- `multiple reachable gateways detected` → mais de um alvo respondeu. Normalmente isso significa uma configuração intencional de múltiplos Gateways ou listeners obsoletos/duplicados.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → a conexão funcionou, mas o RPC de detalhes é limitado por escopo; pareie a identidade do dispositivo ou use credenciais com `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → a conexão funcionou, mas o conjunto completo de RPCs de diagnóstico expirou ou falhou. Trate isso como um Gateway alcançável com diagnósticos degradados; compare `connect.ok` e `connect.rpcOk` na saída de `--json`.
- `Capability: pairing-pending` ou `gateway closed (1008): pairing required` → o Gateway respondeu, mas este cliente ainda precisa de pareamento/aprovação antes do acesso normal de operador.
- texto de aviso de SecretRef `gateway.auth.*` / `gateway.remote.*` não resolvido → o material de autenticação não estava disponível neste caminho de comando para o alvo com falha.

Relacionado:

- [Gateway](/pt-BR/cli/gateway)
- [Múltiplos Gateways no mesmo host](/pt-BR/gateway#multiple-gateways-same-host)
- [Acesso remoto](/pt-BR/gateway/remote)

## Canal conectado, mensagens não fluem

Se o estado do canal está conectado, mas o fluxo de mensagens está morto, concentre-se em política, permissões e regras de entrega específicas do canal.

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

- `mention required` → mensagem ignorada pela política de menção em grupo.
- `pairing` / rastros de aprovação pendente → remetente não está aprovado.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema de autenticação/permissões do canal.

Relacionado:

- [Solução de problemas de canal](/pt-BR/channels/troubleshooting)
- [Discord](/pt-BR/channels/discord)
- [Telegram](/pt-BR/channels/telegram)
- [WhatsApp](/pt-BR/channels/whatsapp)

## Entrega de Cron e heartbeat

Se cron ou heartbeat não executou ou não entregou, verifique primeiro o estado do agendador e depois o destino da entrega.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Procure por:

- Cron habilitado e próxima ativação presente.
- Status do histórico de execução do job (`ok`, `skipped`, `error`).
- Motivos para pular o heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Common signatures">
    - `cron: scheduler disabled; jobs will not run automatically` → cron desabilitado.
    - `cron: timer tick failed` → tick do agendador falhou; verifique erros de arquivo/log/runtime.
    - `heartbeat skipped` com `reason=quiet-hours` → fora da janela de horas ativas.
    - `heartbeat skipped` com `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe, mas contém apenas linhas em branco / cabeçalhos markdown, então o OpenClaw pula a chamada ao modelo.
    - `heartbeat skipped` com `reason=no-tasks-due` → `HEARTBEAT.md` contém um bloco `tasks:`, mas nenhuma das tarefas está vencida neste tick.
    - `heartbeat: unknown accountId` → id de conta inválido para o destino de entrega do heartbeat.
    - `heartbeat skipped` com `reason=dm-blocked` → o destino do heartbeat foi resolvido para um destino do tipo DM enquanto `agents.defaults.heartbeat.directPolicy` (ou substituição por agente) está definido como `block`.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Heartbeat](/pt-BR/gateway/heartbeat)
- [Tarefas agendadas](/pt-BR/automation/cron-jobs)
- [Tarefas agendadas: solução de problemas](/pt-BR/automation/cron-jobs#troubleshooting)

## Node pareado, ferramenta falha

Se um Node está pareado, mas as ferramentas falham, isole o estado de primeiro plano, permissão e aprovação.

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

- `NODE_BACKGROUND_UNAVAILABLE` → o app do Node precisa estar em primeiro plano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permissão do sistema operacional ausente.
- `SYSTEM_RUN_DENIED: approval required` → aprovação de execução pendente.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado pela lista de permissões.

Relacionado:

- [Aprovações de execução](/pt-BR/tools/exec-approvals)
- [Solução de problemas de Node](/pt-BR/nodes/troubleshooting)
- [Nodes](/pt-BR/nodes/index)

## Ferramenta de navegador falha

Use isto quando ações da ferramenta de navegador falharem mesmo que o gateway em si esteja íntegro.

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
  <Accordion title="Plugin / executable signatures">
    - `unknown command "browser"` ou `unknown command 'browser'` → o Plugin de navegador incluído foi excluído por `plugins.allow`.
    - ferramenta de navegador ausente / indisponível enquanto `browser.enabled=true` → `plugins.allow` exclui `browser`, então o Plugin nunca foi carregado.
    - `Failed to start Chrome CDP on port` → o processo do navegador falhou ao iniciar.
    - `browser.executablePath not found` → o caminho configurado é inválido.
    - `browser.cdpUrl must be http(s) or ws(s)` → a URL CDP configurada usa um esquema incompatível, como `file:` ou `ftp:`.
    - `browser.cdpUrl has invalid port` → a URL CDP configurada tem uma porta inválida ou fora do intervalo.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → a instalação atual do Gateway não tem a dependência principal de runtime do navegador; reinstale ou atualize o OpenClaw e depois reinicie o Gateway. Snapshots ARIA e capturas de tela básicas de páginas ainda podem funcionar, mas navegação, snapshots de IA, capturas de tela de elementos por seletor CSS e exportação em PDF permanecem indisponíveis.

  </Accordion>
  <Accordion title="Chrome MCP / existing-session signatures">
    - `Could not find DevToolsActivePort for chrome` → a sessão existente do Chrome MCP ainda não conseguiu anexar ao diretório de dados do navegador selecionado. Abra a página de inspeção do navegador, habilite a depuração remota, mantenha o navegador aberto, aprove o primeiro prompt de anexação e tente novamente. Se o estado autenticado não for necessário, prefira o perfil gerenciado `openclaw`.
    - `No Chrome tabs found for profile="user"` → o perfil de anexação do Chrome MCP não tem abas locais do Chrome abertas.
    - `Remote CDP for profile "<name>" is not reachable` → o endpoint CDP remoto configurado não está acessível a partir do host do Gateway.
    - `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → o perfil somente anexação não tem alvo acessível, ou o endpoint HTTP respondeu, mas o WebSocket CDP ainda não pôde ser aberto.

  </Accordion>
  <Accordion title="Element / screenshot / upload signatures">
    - `fullPage is not supported for element screenshots` → a solicitação de captura de tela combinou `--full-page` com `--ref` ou `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → chamadas de captura de tela do Chrome MCP / `existing-session` devem usar captura de página ou um `--ref` de snapshot, não `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooks de upload do Chrome MCP precisam de refs de snapshot, não seletores CSS.
    - `existing-session file uploads currently support one file at a time.` → envie um upload por chamada em perfis Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → hooks de diálogo em perfis Chrome MCP não aceitam substituições de timeout.
    - `existing-session type does not support timeoutMs overrides.` → omita `timeoutMs` para `act:type` em perfis `profile="user"` / Chrome MCP existing-session, ou use um perfil de navegador gerenciado/CDP quando um timeout personalizado for necessário.
    - `existing-session evaluate does not support timeoutMs overrides.` → omita `timeoutMs` para `act:evaluate` em perfis `profile="user"` / Chrome MCP existing-session, ou use um perfil de navegador gerenciado/CDP quando um timeout personalizado for necessário.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` ainda requer um navegador gerenciado ou perfil CDP bruto.
    - substituições obsoletas de viewport / modo escuro / localidade / offline em perfis somente anexação ou CDP remoto → execute `openclaw browser stop --browser-profile <name>` para fechar a sessão de controle ativa e liberar o estado de emulação do Playwright/CDP sem reiniciar todo o Gateway.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Navegador (gerenciado pelo OpenClaw)](/pt-BR/tools/browser)
- [Solução de problemas do navegador](/pt-BR/tools/browser-linux-troubleshooting)

## Se você atualizou e algo quebrou de repente

A maioria das quebras pós-atualização é desvio de configuração ou padrões mais rigorosos agora sendo aplicados.

<AccordionGroup>
  <Accordion title="1. Auth and URL override behavior changed">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    O que verificar:

    - Se `gateway.mode=remote`, chamadas da CLI podem estar apontando para o remoto enquanto seu serviço local está correto.
    - Chamadas explícitas com `--url` não recorrem a credenciais armazenadas.

    Assinaturas comuns:

    - `gateway connect failed:` → destino de URL incorreto.
    - `unauthorized` → endpoint acessível, mas autenticação incorreta.

  </Accordion>
  <Accordion title="2. Bind and auth guardrails are stricter">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    O que verificar:

    - Binds não loopback (`lan`, `tailnet`, `custom`) precisam de um caminho válido de autenticação do Gateway: autenticação por token/senha compartilhados, ou uma implantação `trusted-proxy` não loopback configurada corretamente.
    - Chaves antigas como `gateway.token` não substituem `gateway.auth.token`.

    Assinaturas comuns:

    - `refusing to bind gateway ... without auth` → bind não loopback sem um caminho válido de autenticação do Gateway.
    - `Connectivity probe: failed` enquanto o runtime está em execução → Gateway ativo, mas inacessível com a autenticação/url atual.

  </Accordion>
  <Accordion title="3. Pairing and device identity state changed">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    O que verificar:

    - Aprovações de dispositivos pendentes para dashboard/Nodes.
    - Aprovações de pareamento por DM pendentes após mudanças de política ou identidade.

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
- [Pareamento gerenciado pelo Gateway](/pt-BR/gateway/pairing)

## Relacionado

- [Doctor](/pt-BR/gateway/doctor)
- [FAQ](/pt-BR/help/faq)
- [Runbook do Gateway](/pt-BR/gateway)
