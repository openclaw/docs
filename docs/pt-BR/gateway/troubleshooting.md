---
read_when:
    - O hub de solução de problemas apontou você para cá para um diagnóstico mais aprofundado
    - Você precisa de seções estáveis de runbook baseadas em sintomas, com comandos exatos
summary: Runbook detalhado de solução de problemas para gateway, canais, automação, nodes e browser
title: Solução de problemas
x-i18n:
    generated_at: "2026-04-25T13:48:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2270f05cf34592269894278e1eb75b8d47c02a4ff1c74bf62afb3d8f4fc4640
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Solução de problemas do Gateway

Esta página é o runbook detalhado.
Comece em [/help/troubleshooting](/pt-BR/help/troubleshooting) se quiser primeiro o fluxo rápido de triagem.

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
- `openclaw channels status --probe` mostra status de transporte por conta em tempo real e,
  onde houver suporte, resultados de probe/auditoria como `works` ou `audit ok`.

## Anthropic 429 extra usage required for long context

Use isto quando logs/erros incluírem:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Procure por:

- O modelo Anthropic Opus/Sonnet selecionado tem `params.context1m: true`.
- A credencial Anthropic atual não é elegível para uso de contexto longo.
- As solicitações falham apenas em sessões longas/execuções de modelo que precisam do caminho beta de 1M.

Opções de correção:

1. Desative `context1m` para esse modelo para voltar à janela de contexto normal.
2. Use uma credencial Anthropic elegível para solicitações de contexto longo, ou troque para uma chave de API Anthropic.
3. Configure modelos de fallback para que as execuções continuem quando solicitações Anthropic de contexto longo forem rejeitadas.

Relacionados:

- [Anthropic](/pt-BR/providers/anthropic)
- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Por que estou vendo HTTP 429 do Anthropic?](/pt-BR/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Backend local compatível com OpenAI passa em probes diretos, mas execuções do agente falham

Use isto quando:

- `curl ... /v1/models` funciona
- chamadas diretas pequenas para `/v1/chat/completions` funcionam
- execuções de modelo no OpenClaw falham apenas em turnos normais do agente

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Procure por:

- chamadas diretas pequenas funcionam, mas execuções do OpenClaw falham apenas com prompts maiores
- erros do backend sobre `messages[].content` esperando uma string
- falhas do backend que aparecem apenas com contagens maiores de tokens de prompt ou prompts completos do runtime do agente

Assinaturas comuns:

- `messages[...].content: invalid type: sequence, expected a string` → o backend
  rejeita partes estruturadas de conteúdo de Chat Completions. Correção: defina
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- solicitações diretas pequenas funcionam, mas execuções do agente OpenClaw falham com
  travamentos do backend/modelo (por exemplo Gemma em algumas builds de `inferrs`) → o transporte do OpenClaw
  provavelmente já está correto; o backend está falhando no formato maior de prompt do runtime do agente.
- as falhas diminuem após desativar ferramentas, mas não desaparecem → schemas de ferramentas
  eram parte da pressão, mas o problema restante ainda é capacidade upstream do modelo/servidor
  ou um bug do backend.

Opções de correção:

1. Defina `compat.requiresStringContent: true` para backends Chat Completions que aceitam apenas string.
2. Defina `compat.supportsTools: false` para modelos/backends que não conseguem lidar
   de forma confiável com a superfície de schema de ferramentas do OpenClaw.
3. Reduza a pressão do prompt quando possível: bootstrap de workspace menor, histórico
   de sessão mais curto, modelo local mais leve ou um backend com suporte mais forte a contexto longo.
4. Se solicitações diretas pequenas continuarem funcionando enquanto turnos do agente OpenClaw ainda travam
   dentro do backend, trate isso como uma limitação do servidor/modelo upstream e registre
   ali uma reprodução com o formato de carga aceito.

Relacionados:

- [Modelos locais](/pt-BR/gateway/local-models)
- [Configuration](/pt-BR/gateway/configuration)
- [Endpoints compatíveis com OpenAI](/pt-BR/gateway/configuration-reference#openai-compatible-endpoints)

## Sem respostas

Se os canais estão ativos, mas nada responde, verifique roteamento e política antes de reconectar qualquer coisa.

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
- `pairing request` → o remetente precisa de aprovação.
- `blocked` / `allowlist` → remetente/canal foi filtrado pela política.

Relacionados:

- [Solução de problemas de canal](/pt-BR/channels/troubleshooting)
- [Pairing](/pt-BR/channels/pairing)
- [Groups](/pt-BR/channels/groups)

## Conectividade da dashboard Control UI

Quando a dashboard/Control UI não conecta, valide URL, modo de autenticação e suposições de contexto seguro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Procure por:

- URL de probe e URL da dashboard corretas.
- Incompatibilidade de modo de autenticação/token entre cliente e gateway.
- Uso de HTTP onde a identidade do dispositivo é exigida.

Assinaturas comuns:

- `device identity required` → contexto não seguro ou autenticação de dispositivo ausente.
- `origin not allowed` → `Origin` do navegador não está em `gateway.controlUi.allowedOrigins`
  (ou você está conectando a partir de uma origem de navegador não-loopback sem uma
  allowlist explícita).
- `device nonce required` / `device nonce mismatch` → o cliente não está concluindo o
  fluxo de autenticação de dispositivo baseado em desafio (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → o cliente assinou a carga errada
  (ou timestamp obsoleto) para o handshake atual.
- `AUTH_TOKEN_MISMATCH` com `canRetryWithDeviceToken=true` → o cliente pode fazer uma tentativa confiável com token de dispositivo em cache.
- Essa nova tentativa com token em cache reutiliza o conjunto de escopos em cache armazenado com o token de dispositivo pareado. Chamadores com `deviceToken` explícito / `scopes` explícitos mantêm o conjunto de escopos solicitado.
- Fora desse caminho de nova tentativa, a precedência de autenticação de conexão é token/senha compartilhados explícitos primeiro, depois `deviceToken` explícito, depois token de dispositivo armazenado, depois token bootstrap.
- No caminho assíncrono da Control UI via Tailscale Serve, tentativas falhas para o mesmo
  `{scope, ip}` são serializadas antes que o limitador registre a falha. Duas novas tentativas ruins
  concorrentes do mesmo cliente podem, portanto, retornar `retry later`
  na segunda tentativa em vez de duas incompatibilidades simples.
- `too many failed authentication attempts (retry later)` de um cliente loopback com origem de navegador → falhas repetidas da mesma `Origin` normalizada são temporariamente bloqueadas; outra origem localhost usa um bucket separado.
- `unauthorized` repetido após essa nova tentativa → divergência entre token compartilhado e token de dispositivo; atualize a configuração do token e reaprove/gire o token de dispositivo se necessário.
- `gateway connect failed:` → host/porta/url de destino incorretos.

### Mapa rápido de códigos detalhados de autenticação

Use `error.details.code` da resposta `connect` com falha para escolher a próxima ação:

| Código detalhado             | Significado                                                                                                                                                                                    | Ação recomendada                                                                                                                                                                                                                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | O cliente não enviou um token compartilhado obrigatório.                                                                                                                                       | Cole/defina o token no cliente e tente novamente. Para caminhos da dashboard: `openclaw config get gateway.auth.token` e depois cole nas configurações da Control UI.                                                                                                                |
| `AUTH_TOKEN_MISMATCH`        | O token compartilhado não correspondeu ao token de autenticação do gateway.                                                                                                                    | Se `canRetryWithDeviceToken=true`, permita uma nova tentativa confiável. Novas tentativas com token em cache reutilizam escopos aprovados armazenados; chamadores com `deviceToken` / `scopes` explícitos mantêm os escopos solicitados. Se ainda falhar, execute o [checklist de recuperação de divergência de token](/pt-BR/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | O token por dispositivo em cache está obsoleto ou foi revogado.                                                                                                                                | Gire/reaprove o token de dispositivo usando a [CLI de devices](/pt-BR/cli/devices) e depois reconecte.                                                                                                                                                                                       |
| `PAIRING_REQUIRED`           | A identidade do dispositivo precisa de aprovação. Verifique `error.details.reason` para `not-paired`, `scope-upgrade`, `role-upgrade` ou `metadata-upgrade`, e use `requestId` / `remediationHint` quando presentes. | Aprove a solicitação pendente: `openclaw devices list` e depois `openclaw devices approve <requestId>`. Upgrades de escopo/papel usam o mesmo fluxo depois que você revisar o acesso solicitado.                                                                                     |

Verificação de migração do device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Se os logs mostrarem erros de nonce/assinatura, atualize o cliente que está conectando e verifique se ele:

1. espera por `connect.challenge`
2. assina a carga vinculada ao desafio
3. envia `connect.params.device.nonce` com o mesmo nonce do desafio

Se `openclaw devices rotate` / `revoke` / `remove` for negado inesperadamente:

- sessões com token de dispositivo pareado podem gerenciar apenas **o próprio** dispositivo, a menos que o
  chamador também tenha `operator.admin`
- `openclaw devices rotate --scope ...` só pode solicitar escopos de operator que
  a sessão chamadora já possui

Relacionados:

- [Control UI](/pt-BR/web/control-ui)
- [Configuration](/pt-BR/gateway/configuration) (modos de autenticação do gateway)
- [Trusted proxy auth](/pt-BR/gateway/trusted-proxy-auth)
- [Acesso remoto](/pt-BR/gateway/remote)
- [Devices](/pt-BR/cli/devices)

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
- Incompatibilidade de configuração de serviço (`Config (cli)` vs `Config (service)`).
- Conflitos de porta/listener.
- Instalações extras de launchd/systemd/schtasks quando `--deep` é usado.
- Dicas de limpeza em `Other gateway-like services detected (best effort)`.

Assinaturas comuns:

- `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → o modo de gateway local não está ativado, ou o arquivo de configuração foi sobrescrito e perdeu `gateway.mode`. Correção: defina `gateway.mode="local"` na sua configuração, ou execute novamente `openclaw onboard --mode local` / `openclaw setup` para reaplicar a configuração esperada de modo local. Se você estiver executando o OpenClaw via Podman, o caminho padrão da configuração é `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → bind fora de loopback sem um caminho válido de autenticação do gateway (token/senha, ou trusted-proxy quando configurado).
- `another gateway instance is already listening` / `EADDRINUSE` → conflito de porta.
- `Other gateway-like services detected (best effort)` → existem unidades launchd/systemd/schtasks obsoletas ou paralelas. A maioria das configurações deve manter um gateway por máquina; se você realmente precisar de mais de um, isole portas + configuração/estado/workspace. Consulte [/gateway#multiple-gateways-same-host](/pt-BR/gateway#multiple-gateways-same-host).

Relacionados:

- [Execução em segundo plano e ferramenta de processo](/pt-BR/gateway/background-process)
- [Configuration](/pt-BR/gateway/configuration)
- [Doctor](/pt-BR/gateway/doctor)

## Gateway restaurou a configuração last-known-good

Use isto quando o Gateway inicia, mas os logs dizem que restaurou `openclaw.json`.

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
- Um arquivo `openclaw.json.clobbered.*` com timestamp ao lado da configuração ativa
- Um evento de sistema do agente principal que começa com `Config recovery warning`

O que aconteceu:

- A configuração rejeitada não passou na validação durante a inicialização ou hot reload.
- O OpenClaw preservou a carga rejeitada como `.clobbered.*`.
- A configuração ativa foi restaurada a partir da última cópia validada last-known-good.
- O próximo turno do agente principal é avisado para não reescrever cegamente a configuração rejeitada.
- Se todos os problemas de validação estavam sob `plugins.entries.<id>...`, o OpenClaw
  não restauraria o arquivo inteiro. Falhas locais de Plugin continuam evidentes, enquanto
  configurações de usuário não relacionadas permanecem na configuração ativa.

Inspecionar e reparar:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Assinaturas comuns:

- `.clobbered.*` existe → uma edição direta externa ou leitura na inicialização foi restaurada.
- `.rejected.*` existe → uma gravação de configuração controlada pelo OpenClaw falhou nas verificações de schema ou clobber antes do commit.
- `Config write rejected:` → a gravação tentou remover uma estrutura obrigatória, reduzir fortemente o arquivo ou persistir configuração inválida.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` ou `size-drop-vs-last-good:*` → a inicialização tratou o arquivo atual como clobbered porque ele perdeu campos ou tamanho em comparação com o backup last-known-good.
- `Config last-known-good promotion skipped` → o candidato continha placeholders de segredo redigidos como `***`.

Opções de correção:

1. Mantenha a configuração ativa restaurada se ela estiver correta.
2. Copie apenas as chaves pretendidas de `.clobbered.*` ou `.rejected.*` e depois aplique-as com `openclaw config set` ou `config.patch`.
3. Execute `openclaw config validate` antes de reiniciar.
4. Se editar manualmente, mantenha a configuração JSON5 completa, não apenas o objeto parcial que você queria alterar.

Relacionados:

- [Configuration: strict validation](/pt-BR/gateway/configuration#strict-validation)
- [Configuration: hot reload](/pt-BR/gateway/configuration#config-hot-reload)
- [Config](/pt-BR/cli/config)
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
- Se o aviso é sobre fallback SSH, vários gateways, escopos ausentes ou refs de autenticação não resolvidas.

Assinaturas comuns:

- `SSH tunnel failed to start; falling back to direct probes.` → a configuração SSH falhou, mas o comando ainda tentou alvos diretos configurados/loopback.
- `multiple reachable gateways detected` → mais de um alvo respondeu. Normalmente isso significa uma configuração intencional com vários gateways ou listeners obsoletos/duplicados.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → a conexão funcionou, mas o RPC detalhado está limitado por escopo; pareie a identidade do dispositivo ou use credenciais com `operator.read`.
- `Capability: pairing-pending` ou `gateway closed (1008): pairing required` → o gateway respondeu, mas este cliente ainda precisa de pareamento/aprovação antes do acesso normal de operator.
- texto de aviso de SecretRef `gateway.auth.*` / `gateway.remote.*` não resolvido → o material de autenticação não estava disponível nesse caminho de comando para o alvo com falha.

Relacionados:

- [Gateway](/pt-BR/cli/gateway)
- [Vários gateways no mesmo host](/pt-BR/gateway#multiple-gateways-same-host)
- [Acesso remoto](/pt-BR/gateway/remote)

## Canal conectado, mas mensagens não fluem

Se o estado do canal está conectado, mas o fluxo de mensagens está morto, foque em política, permissões e regras de entrega específicas do canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Procure por:

- Política de DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist de grupo e exigências de menção.
- Permissões/escopos ausentes da API do canal.

Assinaturas comuns:

- `mention required` → mensagem ignorada pela política de menção em grupo.
- `pairing` / rastros de aprovação pendente → o remetente não está aprovado.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema de autenticação/permissões do canal.

Relacionados:

- [Solução de problemas de canal](/pt-BR/channels/troubleshooting)
- [WhatsApp](/pt-BR/channels/whatsapp)
- [Telegram](/pt-BR/channels/telegram)
- [Discord](/pt-BR/channels/discord)

## Entrega de Cron e Heartbeat

Se cron ou Heartbeat não executou ou não entregou, verifique primeiro o estado do agendador e depois o destino de entrega.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Procure por:

- Cron ativado e próximo wake presente.
- Status do histórico de execução do trabalho (`ok`, `skipped`, `error`).
- Motivos de ignorar o Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Assinaturas comuns:

- `cron: scheduler disabled; jobs will not run automatically` → cron desativado.
- `cron: timer tick failed` → falha no tick do agendador; verifique erros de arquivo/log/runtime.
- `heartbeat skipped` com `reason=quiet-hours` → fora da janela de horas ativas.
- `heartbeat skipped` com `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe, mas contém apenas linhas em branco / cabeçalhos Markdown, então o OpenClaw ignora a chamada ao modelo.
- `heartbeat skipped` com `reason=no-tasks-due` → `HEARTBEAT.md` contém um bloco `tasks:`, mas nenhuma das tarefas vence neste tick.
- `heartbeat: unknown accountId` → ID de conta inválido para o destino de entrega do Heartbeat.
- `heartbeat skipped` com `reason=dm-blocked` → o destino do Heartbeat foi resolvido para um destino no estilo DM enquanto `agents.defaults.heartbeat.directPolicy` (ou sobrescrita por agente) está definido como `block`.

Relacionados:

- [Tarefas agendadas: solução de problemas](/pt-BR/automation/cron-jobs#troubleshooting)
- [Tarefas agendadas](/pt-BR/automation/cron-jobs)
- [Heartbeat](/pt-BR/gateway/heartbeat)

## Ferramenta de Node pareado falha

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
- Permissões do sistema operacional para câmera/microfone/localização/tela.
- Aprovações de exec e estado da allowlist.

Assinaturas comuns:

- `NODE_BACKGROUND_UNAVAILABLE` → o app do Node precisa estar em primeiro plano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permissão do sistema ausente.
- `SYSTEM_RUN_DENIED: approval required` → aprovação de exec pendente.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado pela allowlist.

Relacionados:

- [Solução de problemas de Node](/pt-BR/nodes/troubleshooting)
- [Nodes](/pt-BR/nodes/index)
- [Exec approvals](/pt-BR/tools/exec-approvals)

## Ferramenta de browser falha

Use isto quando ações da ferramenta de browser falham mesmo que o próprio gateway esteja saudável.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Procure por:

- Se `plugins.allow` está definido e inclui `browser`.
- Caminho válido do executável do browser.
- Acessibilidade do perfil CDP.
- Disponibilidade do Chrome local para perfis `existing-session` / `user`.

Assinaturas comuns:

- `unknown command "browser"` ou `unknown command 'browser'` → o Plugin de browser incluído foi excluído por `plugins.allow`.
- ferramenta de browser ausente / indisponível enquanto `browser.enabled=true` → `plugins.allow` exclui `browser`, então o Plugin nunca foi carregado.
- `Failed to start Chrome CDP on port` → o processo do browser falhou ao iniciar.
- `browser.executablePath not found` → o caminho configurado é inválido.
- `browser.cdpUrl must be http(s) or ws(s)` → a URL CDP configurada usa um esquema não suportado, como `file:` ou `ftp:`.
- `browser.cdpUrl has invalid port` → a URL CDP configurada tem uma porta inválida ou fora do intervalo.
- `Could not find DevToolsActivePort for chrome` → o existing-session do Chrome MCP ainda não conseguiu se conectar ao diretório de dados do navegador selecionado. Abra a página de inspeção do browser, ative a depuração remota, mantenha o browser aberto, aprove o primeiro prompt de conexão e tente novamente. Se o estado de login não for necessário, prefira o perfil gerenciado `openclaw`.
- `No Chrome tabs found for profile="user"` → o perfil de conexão do Chrome MCP não tem abas locais do Chrome abertas.
- `Remote CDP for profile "<name>" is not reachable` → o endpoint CDP remoto configurado não é acessível a partir do host do gateway.
- `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → o perfil somente de conexão não tem um destino acessível, ou o endpoint HTTP respondeu, mas o WebSocket CDP ainda não pôde ser aberto.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → a instalação atual do gateway não tem a dependência de runtime `playwright-core` do Plugin de browser incluído; execute `openclaw doctor --fix` e depois reinicie o gateway. Snapshots ARIA e screenshots básicos de página ainda podem funcionar, mas navegação, AI snapshots, screenshots de elemento por seletor CSS e exportação em PDF continuam indisponíveis.
- `fullPage is not supported for element screenshots` → a solicitação de screenshot misturou `--full-page` com `--ref` ou `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → chamadas de screenshot do Chrome MCP / `existing-session` precisam usar captura de página ou um `--ref` de snapshot, não `--element` por CSS.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooks de upload do Chrome MCP precisam de refs de snapshot, não seletores CSS.
- `existing-session file uploads currently support one file at a time.` → envie um upload por chamada em perfis Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → hooks de diálogo em perfis Chrome MCP não oferecem suporte a sobrescritas de timeout.
- `existing-session type does not support timeoutMs overrides.` → omita `timeoutMs` para `act:type` em perfis `profile="user"` / Chrome MCP existing-session, ou use um perfil de browser gerenciado/CDP quando for necessário um timeout personalizado.
- `existing-session evaluate does not support timeoutMs overrides.` → omita `timeoutMs` para `act:evaluate` em perfis `profile="user"` / Chrome MCP existing-session, ou use um perfil de browser gerenciado/CDP quando for necessário um timeout personalizado.
- `response body is not supported for existing-session profiles yet.` → `responsebody` ainda exige um browser gerenciado ou perfil CDP bruto.
- sobrescritas obsoletas de viewport / dark-mode / locale / offline em perfis attach-only ou CDP remoto → execute `openclaw browser stop --browser-profile <name>` para fechar a sessão de controle ativa e liberar o estado de emulação do Playwright/CDP sem reiniciar todo o gateway.

Relacionados:

- [Solução de problemas do browser](/pt-BR/tools/browser-linux-troubleshooting)
- [Browser (gerenciado pelo OpenClaw)](/pt-BR/tools/browser)

## Se você atualizou e algo de repente quebrou

A maioria das quebras após atualização é causada por divergência de configuração ou aplicação de padrões mais rígidos.

### 1) O comportamento de autenticação e sobrescrita de URL mudou

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

O que verificar:

- Se `gateway.mode=remote`, chamadas da CLI podem estar mirando o remoto enquanto seu serviço local está funcionando.
- Chamadas explícitas com `--url` não usam fallback para credenciais armazenadas.

Assinaturas comuns:

- `gateway connect failed:` → alvo de URL incorreto.
- `unauthorized` → endpoint acessível, mas autenticação incorreta.

### 2) As proteções de bind e autenticação estão mais rígidas

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

O que verificar:

- Binds fora de loopback (`lan`, `tailnet`, `custom`) precisam de um caminho válido de autenticação do gateway: autenticação por token/senha compartilhados ou uma implantação `trusted-proxy` não-loopback corretamente configurada.
- Chaves antigas como `gateway.token` não substituem `gateway.auth.token`.

Assinaturas comuns:

- `refusing to bind gateway ... without auth` → bind fora de loopback sem caminho válido de autenticação do gateway.
- `Connectivity probe: failed` enquanto o runtime está em execução → gateway vivo, mas inacessível com a autenticação/url atuais.

### 3) O estado de pareamento e identidade do dispositivo mudou

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

- `device identity required` → autenticação de dispositivo não satisfeita.
- `pairing required` → remetente/dispositivo precisa ser aprovado.

Se a configuração do serviço e o runtime ainda divergirem após as verificações, reinstale os metadados do serviço a partir do mesmo diretório de perfil/estado:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Relacionados:

- [Pareamento controlado pelo gateway](/pt-BR/gateway/pairing)
- [Authentication](/pt-BR/gateway/authentication)
- [Execução em segundo plano e ferramenta de processo](/pt-BR/gateway/background-process)

## Relacionados

- [Runbook do gateway](/pt-BR/gateway)
- [Doctor](/pt-BR/gateway/doctor)
- [FAQ](/pt-BR/help/faq)
