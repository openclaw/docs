---
read_when:
    - O hub de solução de problemas trouxe você até aqui para um diagnóstico mais aprofundado
    - Você precisa de seções de runbook estáveis baseadas em sintomas com comandos exatos
summary: Runbook detalhado de solução de problemas para gateway, canais, automação, nós e navegador
title: Solução de problemas
x-i18n:
    generated_at: "2026-04-11T02:44:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ef2faccba26ede307861504043a6415bc1f12dc64407771106f63ddc5b107f5
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Solução de problemas do gateway

Esta página é o runbook aprofundado.
Comece em [/help/troubleshooting](/pt-BR/help/troubleshooting) se você quiser primeiro o fluxo rápido de triagem.

## Escada de comandos

Execute estes primeiro, nesta ordem:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sinais esperados de estado saudável:

- `openclaw gateway status` mostra `Runtime: running` e `RPC probe: ok`.
- `openclaw doctor` não relata problemas bloqueantes de configuração/serviço.
- `openclaw channels status --probe` mostra status de transporte em tempo real por conta e,
  quando compatível, resultados de probe/auditoria como `works` ou `audit ok`.

## Anthropic 429 extra usage required for long context

Use isto quando logs/erros incluírem:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Procure por:

- O modelo Opus/Sonnet da Anthropic selecionado tem `params.context1m: true`.
- A credencial atual da Anthropic não é elegível para uso de contexto longo.
- As solicitações falham apenas em sessões longas/execuções de modelo que precisam do caminho beta de 1M.

Opções de correção:

1. Desative `context1m` para esse modelo para voltar à janela normal de contexto.
2. Use uma credencial da Anthropic que seja elegível para solicitações de contexto longo ou troque para uma chave de API da Anthropic.
3. Configure modelos de fallback para que as execuções continuem quando solicitações de contexto longo da Anthropic forem rejeitadas.

Relacionado:

- [/providers/anthropic](/pt-BR/providers/anthropic)
- [/reference/token-use](/pt-BR/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/pt-BR/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Backend local compatível com OpenAI passa em probes diretas, mas execuções de agente falham

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

- chamadas diretas pequenas funcionam, mas execuções do OpenClaw falham apenas com prompts maiores
- erros do backend sobre `messages[].content` esperar uma string
- falhas do backend que aparecem apenas com contagens maiores de tokens de prompt ou prompts completos do runtime do agente

Assinaturas comuns:

- `messages[...].content: invalid type: sequence, expected a string` → o backend
  rejeita partes estruturadas de conteúdo de Chat Completions. Correção: defina
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- chamadas diretas pequenas funcionam, mas execuções de agente do OpenClaw falham com
  falhas do backend/modelo (por exemplo, Gemma em algumas builds do `inferrs`) → o transporte do OpenClaw
  provavelmente já está correto; o backend está falhando com o formato maior do prompt do runtime do agente.
- as falhas diminuem após desativar ferramentas, mas não desaparecem → os esquemas de ferramentas
  faziam parte da pressão, mas o problema restante ainda é de capacidade do modelo/servidor upstream
  ou de um bug no backend.

Opções de correção:

1. Defina `compat.requiresStringContent: true` para backends de Chat Completions que aceitam apenas string.
2. Defina `compat.supportsTools: false` para modelos/backends que não conseguem lidar
   de forma confiável com a superfície de esquema de ferramentas do OpenClaw.
3. Reduza a pressão do prompt quando possível: bootstrap menor do workspace, histórico de sessão mais curto, modelo local mais leve ou um backend com suporte mais forte a contexto longo.
4. Se solicitações diretas pequenas continuarem funcionando enquanto os turnos de agente do OpenClaw ainda falham
   dentro do backend, trate isso como uma limitação do servidor/modelo upstream e abra
   um repro lá com o formato de payload aceito.

Relacionado:

- [/gateway/local-models](/pt-BR/gateway/local-models)
- [/gateway/configuration](/pt-BR/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/pt-BR/gateway/configuration-reference#openai-compatible-endpoints)

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
- Restrição de menção em grupos (`requireMention`, `mentionPatterns`).
- Incompatibilidades de allowlist de canal/grupo.

Assinaturas comuns:

- `drop guild message (mention required` → mensagem de grupo ignorada até haver menção.
- `pairing request` → o remetente precisa de aprovação.
- `blocked` / `allowlist` → o remetente/canal foi filtrado pela política.

Relacionado:

- [/channels/troubleshooting](/pt-BR/channels/troubleshooting)
- [/channels/pairing](/pt-BR/channels/pairing)
- [/channels/groups](/pt-BR/channels/groups)

## Conectividade da dashboard/control UI

Quando a dashboard/control UI não conecta, valide URL, modo de autenticação e premissas de contexto seguro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Procure por:

- URL de probe e URL da dashboard corretas.
- Incompatibilidade de modo/token de autenticação entre cliente e gateway.
- Uso de HTTP onde é necessária identidade do dispositivo.

Assinaturas comuns:

- `device identity required` → contexto não seguro ou autenticação de dispositivo ausente.
- `origin not allowed` → `Origin` do navegador não está em `gateway.controlUi.allowedOrigins`
  (ou você está conectando a partir de uma origem de navegador não loopback sem uma
  allowlist explícita).
- `device nonce required` / `device nonce mismatch` → o cliente não está concluindo o
  fluxo de autenticação de dispositivo baseado em desafio (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → o cliente assinou o payload errado
  (ou com timestamp antigo) para o handshake atual.
- `AUTH_TOKEN_MISMATCH` com `canRetryWithDeviceToken=true` → o cliente pode fazer uma nova tentativa confiável com token de dispositivo em cache.
- Essa nova tentativa com token em cache reutiliza o conjunto de escopos armazenado com o
  token de dispositivo pareado. Chamadores com `deviceToken` explícito / `scopes` explícitos mantêm
  o conjunto de escopos solicitado.
- Fora desse caminho de nova tentativa, a precedência de autenticação na conexão é token/senha compartilhados explícitos primeiro, depois `deviceToken` explícito, depois token de dispositivo armazenado e então token de bootstrap.
- No caminho assíncrono da Control UI com Tailscale Serve, tentativas com falha para o mesmo
  `{scope, ip}` são serializadas antes de o limitador registrar a falha. Portanto, duas novas tentativas concorrentes ruins do mesmo cliente podem resultar em `retry later`
  na segunda tentativa em vez de duas incompatibilidades simples.
- `too many failed authentication attempts (retry later)` de um cliente loopback com origem de navegador
  → falhas repetidas da mesma `Origin` normalizada ficam temporariamente bloqueadas; outra origem localhost usa um bucket separado.
- `repeated unauthorized` após essa nova tentativa → divergência de token compartilhado/token de dispositivo; atualize a configuração do token e reaprovar/rotacione o token de dispositivo se necessário.
- `gateway connect failed:` → host/porta/url de destino incorretos.

### Mapa rápido de códigos de detalhe de autenticação

Use `error.details.code` da resposta `connect` com falha para escolher a próxima ação:

| Código de detalhe            | Significado                                              | Ação recomendada                                                                                                                                                                                                                                                                        |
| ---------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | O cliente não enviou um token compartilhado obrigatório. | Cole/defina o token no cliente e tente novamente. Para caminhos de dashboard: `openclaw config get gateway.auth.token` e então cole nas configurações da Control UI.                                                                                                                   |
| `AUTH_TOKEN_MISMATCH`        | O token compartilhado não corresponde ao token de autenticação do gateway. | Se `canRetryWithDeviceToken=true`, permita uma nova tentativa confiável. Novas tentativas com token em cache reutilizam escopos aprovados armazenados; chamadores com `deviceToken` / `scopes` explícitos mantêm os escopos solicitados. Se ainda falhar, execute a [checklist de recuperação de divergência de token](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | O token por dispositivo em cache está desatualizado ou revogado. | Rotacione/reaprove o token de dispositivo usando a [CLI de dispositivos](/cli/devices) e então reconecte.                                                                                                                                                                               |
| `PAIRING_REQUIRED`           | A identidade do dispositivo é conhecida, mas não aprovada para esta função. | Aprove a solicitação pendente: `openclaw devices list` e então `openclaw devices approve <requestId>`.                                                                                                                                                                                  |

Verificação de migração do auth de dispositivo v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Se os logs mostrarem erros de nonce/assinatura, atualize o cliente que está conectando e verifique se ele:

1. aguarda `connect.challenge`
2. assina o payload vinculado ao desafio
3. envia `connect.params.device.nonce` com o mesmo nonce do desafio

Se `openclaw devices rotate` / `revoke` / `remove` for negado inesperadamente:

- sessões com token de dispositivo pareado só podem gerenciar **seu próprio** dispositivo, a menos que o chamador também tenha `operator.admin`
- `openclaw devices rotate --scope ...` só pode solicitar escopos de operador que a sessão chamadora já possua

Relacionado:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/pt-BR/gateway/configuration) (modos de autenticação do gateway)
- [/gateway/trusted-proxy-auth](/pt-BR/gateway/trusted-proxy-auth)
- [/gateway/remote](/pt-BR/gateway/remote)
- [/cli/devices](/cli/devices)

## Serviço do gateway não está em execução

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
- Incompatibilidade de configuração do serviço (`Config (cli)` vs `Config (service)`).
- Conflitos de porta/listener.
- Instalações extras de launchd/systemd/schtasks quando `--deep` é usado.
- Dicas de limpeza em `Other gateway-like services detected (best effort)`.

Assinaturas comuns:

- `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → o modo de gateway local não está habilitado, ou o arquivo de configuração foi sobrescrito e perdeu `gateway.mode`. Correção: defina `gateway.mode="local"` na sua configuração, ou execute novamente `openclaw onboard --mode local` / `openclaw setup` para restaurar a configuração esperada de modo local. Se você estiver executando o OpenClaw via Podman, o caminho padrão da configuração é `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → bind não loopback sem um caminho válido de autenticação do gateway (token/senha ou trusted-proxy, quando configurado).
- `another gateway instance is already listening` / `EADDRINUSE` → conflito de porta.
- `Other gateway-like services detected (best effort)` → existem unidades launchd/systemd/schtasks antigas ou paralelas. A maioria das configurações deve manter um gateway por máquina; se você realmente precisar de mais de um, isole portas + configuração/estado/workspace. Consulte [/gateway#multiple-gateways-same-host](/pt-BR/gateway#multiple-gateways-same-host).

Relacionado:

- [/gateway/background-process](/pt-BR/gateway/background-process)
- [/gateway/configuration](/pt-BR/gateway/configuration)
- [/gateway/doctor](/pt-BR/gateway/doctor)

## Avisos de probe do gateway

Use isto quando `openclaw gateway probe` alcança algo, mas ainda imprime um bloco de aviso.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Procure por:

- `warnings[].code` e `primaryTargetId` na saída JSON.
- Se o aviso é sobre fallback via SSH, múltiplos gateways, escopos ausentes ou refs de autenticação não resolvidas.

Assinaturas comuns:

- `SSH tunnel failed to start; falling back to direct probes.` → a configuração de SSH falhou, mas o comando ainda tentou destinos configurados/de loopback diretamente.
- `multiple reachable gateways detected` → mais de um destino respondeu. Normalmente isso significa uma configuração intencional com múltiplos gateways ou listeners antigos/duplicados.
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → a conexão funcionou, mas o RPC de detalhes está limitado por escopo; pareie a identidade do dispositivo ou use credenciais com `operator.read`.
- texto de aviso de SecretRef não resolvido em `gateway.auth.*` / `gateway.remote.*` → o material de autenticação estava indisponível neste caminho de comando para o destino com falha.

Relacionado:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/pt-BR/gateway#multiple-gateways-same-host)
- [/gateway/remote](/pt-BR/gateway/remote)

## Canal conectado, mas as mensagens não fluem

Se o estado do canal estiver conectado, mas o fluxo de mensagens estiver parado, foque em política, permissões e regras de entrega específicas do canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Procure por:

- Política de DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist de grupos e requisitos de menção.
- Permissões/escopos ausentes da API do canal.

Assinaturas comuns:

- `mention required` → mensagem ignorada pela política de menção em grupo.
- `pairing` / rastros de aprovação pendente → o remetente não foi aprovado.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema de autenticação/permissões do canal.

Relacionado:

- [/channels/troubleshooting](/pt-BR/channels/troubleshooting)
- [/channels/whatsapp](/pt-BR/channels/whatsapp)
- [/channels/telegram](/pt-BR/channels/telegram)
- [/channels/discord](/pt-BR/channels/discord)

## Entrega de cron e heartbeat

Se o cron ou heartbeat não executou ou não entregou, verifique primeiro o estado do scheduler e depois o destino da entrega.

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
- Motivos de heartbeat ignorado (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Assinaturas comuns:

- `cron: scheduler disabled; jobs will not run automatically` → cron desabilitado.
- `cron: timer tick failed` → a ativação do scheduler falhou; verifique erros de arquivo/log/runtime.
- `heartbeat skipped` com `reason=quiet-hours` → fora da janela de horário ativo.
- `heartbeat skipped` com `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe, mas contém apenas linhas em branco / cabeçalhos Markdown, então o OpenClaw ignora a chamada ao modelo.
- `heartbeat skipped` com `reason=no-tasks-due` → `HEARTBEAT.md` contém um bloco `tasks:`, mas nenhuma das tarefas vence nesta ativação.
- `heartbeat: unknown accountId` → id de conta inválido para o destino de entrega do heartbeat.
- `heartbeat skipped` com `reason=dm-blocked` → o destino do heartbeat foi resolvido para um destino no estilo DM enquanto `agents.defaults.heartbeat.directPolicy` (ou a substituição por agente) está definido como `block`.

Relacionado:

- [/automation/cron-jobs#troubleshooting](/pt-BR/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/pt-BR/automation/cron-jobs)
- [/gateway/heartbeat](/pt-BR/gateway/heartbeat)

## Ferramenta de nó pareado falha

Se um nó está pareado, mas as ferramentas falham, isole estado em primeiro plano, permissões e estado de aprovação.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Procure por:

- Nó online com as capacidades esperadas.
- Permissões do sistema operacional para câmera/microfone/localização/tela.
- Estado de aprovações de execução e allowlist.

Assinaturas comuns:

- `NODE_BACKGROUND_UNAVAILABLE` → o app do nó precisa estar em primeiro plano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permissão do sistema operacional ausente.
- `SYSTEM_RUN_DENIED: approval required` → aprovação de execução pendente.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado pela allowlist.

Relacionado:

- [/nodes/troubleshooting](/pt-BR/nodes/troubleshooting)
- [/nodes/index](/pt-BR/nodes/index)
- [/tools/exec-approvals](/pt-BR/tools/exec-approvals)

## Falha na ferramenta do navegador

Use isto quando ações da ferramenta do navegador falham, mesmo que o próprio gateway esteja saudável.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Procure por:

- Se `plugins.allow` está definido e inclui `browser`.
- Caminho válido para o executável do navegador.
- Alcance do perfil CDP.
- Disponibilidade do Chrome local para perfis `existing-session` / `user`.

Assinaturas comuns:

- `unknown command "browser"` ou `unknown command 'browser'` → o plugin empacotado do navegador está excluído por `plugins.allow`.
- ferramenta do navegador ausente / indisponível enquanto `browser.enabled=true` → `plugins.allow` exclui `browser`, então o plugin nunca foi carregado.
- `Failed to start Chrome CDP on port` → o processo do navegador falhou ao iniciar.
- `browser.executablePath not found` → o caminho configurado é inválido.
- `browser.cdpUrl must be http(s) or ws(s)` → a URL de CDP configurada usa um esquema não compatível, como `file:` ou `ftp:`.
- `browser.cdpUrl has invalid port` → a URL de CDP configurada tem uma porta inválida ou fora do intervalo.
- `No Chrome tabs found for profile="user"` → o perfil de anexação do Chrome MCP não tem abas locais do Chrome abertas.
- `Remote CDP for profile "<name>" is not reachable` → o endpoint remoto de CDP configurado não está acessível a partir do host do gateway.
- `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → o perfil somente-anexação não tem um destino acessível, ou o endpoint HTTP respondeu, mas o WebSocket de CDP ainda não pôde ser aberto.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → a instalação atual do gateway não inclui o pacote completo do Playwright; snapshots ARIA e capturas de tela básicas de página ainda podem funcionar, mas navegação, snapshots com IA, capturas de elementos por seletor CSS e exportação para PDF continuam indisponíveis.
- `fullPage is not supported for element screenshots` → a solicitação de captura misturou `--full-page` com `--ref` ou `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → chamadas de screenshot do Chrome MCP / `existing-session` devem usar captura de página ou um `--ref` de snapshot, não `--element` em CSS.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooks de upload do Chrome MCP precisam de refs de snapshot, não seletores CSS.
- `existing-session file uploads currently support one file at a time.` → envie um upload por chamada em perfis do Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → hooks de diálogo em perfis do Chrome MCP não oferecem suporte a substituições de timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` ainda exige um navegador gerenciado ou perfil CDP bruto.
- substituições antigas de viewport / modo escuro / localidade / offline em perfis somente-anexação ou CDP remoto → execute `openclaw browser stop --browser-profile <name>` para fechar a sessão de controle ativa e liberar o estado de emulação do Playwright/CDP sem reiniciar todo o gateway.

Relacionado:

- [/tools/browser-linux-troubleshooting](/pt-BR/tools/browser-linux-troubleshooting)
- [/tools/browser](/pt-BR/tools/browser)

## Se você atualizou e algo quebrou de repente

A maioria das falhas após atualização vem de divergência de configuração ou de padrões mais rígidos agora sendo aplicados.

### 1) O comportamento de autenticação e substituição de URL mudou

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

O que verificar:

- Se `gateway.mode=remote`, chamadas da CLI podem estar mirando o remoto enquanto seu serviço local está funcionando bem.
- Chamadas explícitas com `--url` não recorrem a credenciais armazenadas.

Assinaturas comuns:

- `gateway connect failed:` → destino de URL incorreto.
- `unauthorized` → endpoint acessível, mas autenticação incorreta.

### 2) Os guardrails de bind e autenticação estão mais rígidos

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

O que verificar:

- Binds não loopback (`lan`, `tailnet`, `custom`) precisam de um caminho válido de autenticação do gateway: autenticação compartilhada por token/senha ou uma implantação `trusted-proxy` não loopback configurada corretamente.
- Chaves antigas como `gateway.token` não substituem `gateway.auth.token`.

Assinaturas comuns:

- `refusing to bind gateway ... without auth` → bind não loopback sem um caminho válido de autenticação do gateway.
- `RPC probe: failed` enquanto o runtime está em execução → gateway ativo, mas inacessível com a autenticação/url atuais.

### 3) O estado de pareamento e identidade do dispositivo mudou

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

O que verificar:

- Aprovações pendentes de dispositivos para dashboard/nós.
- Aprovações pendentes de pareamento de DM após mudanças de política ou identidade.

Assinaturas comuns:

- `device identity required` → autenticação de dispositivo não satisfeita.
- `pairing required` → remetente/dispositivo precisa ser aprovado.

Se a configuração do serviço e o runtime ainda divergirem após as verificações, reinstale os metadados do serviço a partir do mesmo diretório de perfil/estado:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Relacionado:

- [/gateway/pairing](/pt-BR/gateway/pairing)
- [/gateway/authentication](/pt-BR/gateway/authentication)
- [/gateway/background-process](/pt-BR/gateway/background-process)
