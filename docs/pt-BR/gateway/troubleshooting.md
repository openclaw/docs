---
read_when:
    - O hub de solução de problemas apontou você para cá para um diagnóstico mais profundo
    - Você precisa de seções estáveis de runbook baseadas em sintomas com comandos exatos
summary: Runbook detalhado de solução de problemas para gateway, canais, automação, nós e navegador
title: Solução de problemas
x-i18n:
    generated_at: "2026-04-08T02:15:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02c9537845248db0c9d315bf581338a93215fe6fe3688ed96c7105cbb19fe6ba
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

- `openclaw gateway status` mostra `Runtime: running` e `RPC probe: ok`.
- `openclaw doctor` não relata problemas bloqueadores de configuração/serviço.
- `openclaw channels status --probe` mostra o status de transporte ativo por conta e,
  quando compatível, resultados de probe/auditoria como `works` ou `audit ok`.

## Anthropic 429: uso extra necessário para contexto longo

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
2. Use uma credencial Anthropic elegível para solicitações de contexto longo ou mude para uma chave de API da Anthropic.
3. Configure modelos de fallback para que as execuções continuem quando solicitações Anthropic de contexto longo forem rejeitadas.

Relacionado:

- [/providers/anthropic](/pt-BR/providers/anthropic)
- [/reference/token-use](/pt-BR/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/pt-BR/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Backend local compatível com OpenAI passa em probes diretos, mas execuções do agente falham

Use isto quando:

- `curl ... /v1/models` funciona
- chamadas diretas pequenas para `/v1/chat/completions` funcionam
- execuções de modelo do OpenClaw falham apenas em turnos normais do agente

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
- falhas do backend que aparecem apenas com contagens maiores de tokens no prompt ou com prompts completos do runtime do agente

Assinaturas comuns:

- `messages[...].content: invalid type: sequence, expected a string` → o backend
  rejeita partes estruturadas de conteúdo em Chat Completions. Correção: defina
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- chamadas diretas pequenas funcionam, mas execuções do agente OpenClaw falham com falhas do backend/modelo
  (por exemplo, Gemma em algumas builds de `inferrs`) → o transporte do OpenClaw
  provavelmente já está correto; o backend está falhando no formato maior do prompt do runtime do agente.
- as falhas diminuem após desativar ferramentas, mas não desaparecem → os schemas de ferramentas faziam
  parte da pressão, mas o problema restante ainda é limitação de capacidade do servidor/modelo upstream
  ou um bug no backend.

Opções de correção:

1. Defina `compat.requiresStringContent: true` para backends Chat Completions que aceitam apenas strings.
2. Defina `compat.supportsTools: false` para modelos/backends que não conseguem lidar com
   a superfície de schema de ferramentas do OpenClaw com confiabilidade.
3. Reduza a pressão do prompt quando possível: bootstrap menor do workspace, histórico de sessão mais curto, modelo local mais leve ou backend com melhor
   suporte a contexto longo.
4. Se pequenas solicitações diretas continuarem funcionando enquanto turnos do agente OpenClaw ainda falham
   dentro do backend, trate isso como uma limitação do servidor/modelo upstream e abra
   um repro lá com o formato de payload aceito.

Relacionado:

- [/gateway/local-models](/pt-BR/gateway/local-models)
- [/gateway/configuration#models](/pt-BR/gateway/configuration#models)
- [/gateway/configuration-reference#openai-compatible-endpoints](/pt-BR/gateway/configuration-reference#openai-compatible-endpoints)

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

- Pairing pendente para remetentes de DM.
- Exigência de menção em grupos (`requireMention`, `mentionPatterns`).
- Incompatibilidades de allowlist de canal/grupo.

Assinaturas comuns:

- `drop guild message (mention required` → mensagem de grupo ignorada até haver menção.
- `pairing request` → o remetente precisa de aprovação.
- `blocked` / `allowlist` → remetente/canal foi filtrado pela política.

Relacionado:

- [/channels/troubleshooting](/pt-BR/channels/troubleshooting)
- [/channels/pairing](/pt-BR/channels/pairing)
- [/channels/groups](/pt-BR/channels/groups)

## Conectividade da Control UI do Dashboard

Quando o dashboard/Control UI não se conecta, valide URL, modo de autenticação e pressupostos de contexto seguro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Procure por:

- URL de probe e URL do dashboard corretas.
- Incompatibilidade de modo/token de autenticação entre cliente e gateway.
- Uso de HTTP onde a identidade do dispositivo é obrigatória.

Assinaturas comuns:

- `device identity required` → contexto não seguro ou autenticação de dispositivo ausente.
- `origin not allowed` → a `Origin` do navegador não está em `gateway.controlUi.allowedOrigins`
  (ou você está se conectando de uma origin de navegador não loopback sem uma
  allowlist explícita).
- `device nonce required` / `device nonce mismatch` → o cliente não está concluindo o
  fluxo de autenticação de dispositivo baseado em desafio (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → o cliente assinou o payload errado
  (ou timestamp obsoleto) para o handshake atual.
- `AUTH_TOKEN_MISMATCH` com `canRetryWithDeviceToken=true` → o cliente pode fazer uma tentativa confiável com o token de dispositivo em cache.
- Essa nova tentativa com token em cache reutiliza o conjunto de escopos em cache armazenado com o token do
  dispositivo pareado. Chamadores com `deviceToken` explícito / `scopes` explícitos mantêm o
  conjunto de escopos solicitado.
- Fora desse caminho de nova tentativa, a precedência de autenticação na conexão é
  token/senha compartilhados explícitos primeiro, depois `deviceToken` explícito, depois token de dispositivo armazenado,
  e por fim token de bootstrap.
- No caminho assíncrono da Control UI com Tailscale Serve, tentativas com falha para o mesmo
  `{scope, ip}` são serializadas antes de o limitador registrar a falha. Duas novas tentativas simultâneas inválidas do mesmo cliente podem, portanto, mostrar `retry later`
  na segunda tentativa em vez de dois erros simples de incompatibilidade.
- `too many failed authentication attempts (retry later)` de um cliente loopback com origin de navegador
  → falhas repetidas da mesma `Origin` normalizada entram temporariamente em bloqueio; outra origin localhost usa um bucket separado.
- `unauthorized` repetido após essa nova tentativa → desvio entre token compartilhado/token de dispositivo; atualize a configuração do token e reaprove/redefina o token do dispositivo, se necessário.
- `gateway connect failed:` → host/porta/alvo de URL incorretos.

### Mapa rápido dos códigos de detalhe de autenticação

Use `error.details.code` da resposta `connect` com falha para escolher a próxima ação:

| Código de detalhe             | Significado                                             | Ação recomendada                                                                                                                                                                                                                                                                          |
| ----------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | O cliente não enviou um token compartilhado obrigatório. | Cole/defina o token no cliente e tente novamente. Para caminhos do dashboard: `openclaw config get gateway.auth.token` e depois cole em Control UI settings.                                                                                                                          |
| `AUTH_TOKEN_MISMATCH`        | O token compartilhado não corresponde ao token de autenticação do gateway. | Se `canRetryWithDeviceToken=true`, permita uma tentativa confiável. Novas tentativas com token em cache reutilizam escopos aprovados armazenados; chamadores com `deviceToken` / `scopes` explícitos mantêm os escopos solicitados. Se ainda falhar, execute a [lista de verificação de recuperação de desvio de token](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | O token em cache por dispositivo está obsoleto ou revogado. | Gire/reaprove o token do dispositivo usando [devices CLI](/cli/devices) e depois reconecte.                                                                                                                                                                                             |
| `PAIRING_REQUIRED`           | A identidade do dispositivo é conhecida, mas não aprovada para esse papel. | Aprove a solicitação pendente: `openclaw devices list` e depois `openclaw devices approve <requestId>`.                                                                                                                                                                                 |

Verificação de migração do device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Se os logs mostrarem erros de nonce/assinatura, atualize o cliente que está se conectando e verifique se ele:

1. aguarda `connect.challenge`
2. assina o payload vinculado ao desafio
3. envia `connect.params.device.nonce` com o mesmo nonce do desafio

Se `openclaw devices rotate` / `revoke` / `remove` for negado inesperadamente:

- sessões com token de dispositivo pareado podem gerenciar apenas **seu próprio** dispositivo, a menos que o
  chamador também tenha `operator.admin`
- `openclaw devices rotate --scope ...` só pode solicitar escopos de operador que
  a sessão do chamador já possui

Relacionado:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/pt-BR/gateway/configuration) (modos de autenticação do gateway)
- [/gateway/trusted-proxy-auth](/pt-BR/gateway/trusted-proxy-auth)
- [/gateway/remote](/pt-BR/gateway/remote)
- [/cli/devices](/cli/devices)

## Serviço do Gateway não está em execução

Use isto quando o serviço estiver instalado, mas o processo não permanecer em execução.

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
- Dicas de limpeza em `Other gateway-like services detected (best effort)`.

Assinaturas comuns:

- `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → o modo de gateway local não está habilitado, ou o arquivo de configuração foi sobrescrito e perdeu `gateway.mode`. Correção: defina `gateway.mode="local"` na sua configuração, ou execute novamente `openclaw onboard --mode local` / `openclaw setup` para restaurar a configuração esperada de modo local. Se você estiver executando o OpenClaw via Podman, o caminho padrão da configuração é `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → bind não loopback sem um caminho válido de autenticação do gateway (token/senha, ou trusted-proxy onde configurado).
- `another gateway instance is already listening` / `EADDRINUSE` → conflito de porta.
- `Other gateway-like services detected (best effort)` → existem unidades launchd/systemd/schtasks obsoletas ou paralelas. A maioria das configurações deve manter um gateway por máquina; se você realmente precisar de mais de um, isole portas + configuração/estado/workspace. Veja [/gateway#multiple-gateways-same-host](/pt-BR/gateway#multiple-gateways-same-host).

Relacionado:

- [/gateway/background-process](/pt-BR/gateway/background-process)
- [/gateway/configuration](/pt-BR/gateway/configuration)
- [/gateway/doctor](/pt-BR/gateway/doctor)

## Avisos de probe do Gateway

Use isto quando `openclaw gateway probe` alcança algo, mas ainda imprime um bloco de aviso.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Procure por:

- `warnings[].code` e `primaryTargetId` na saída JSON.
- Se o aviso é sobre fallback por SSH, múltiplos gateways, escopos ausentes ou refs de autenticação não resolvidas.

Assinaturas comuns:

- `SSH tunnel failed to start; falling back to direct probes.` → a configuração de SSH falhou, mas o comando ainda tentou alvos diretos configurados/loopback.
- `multiple reachable gateways detected` → mais de um alvo respondeu. Normalmente isso significa uma configuração intencional com múltiplos gateways ou listeners obsoletos/duplicados.
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → a conexão funcionou, mas o RPC de detalhes é limitado por escopo; pareie a identidade do dispositivo ou use credenciais com `operator.read`.
- texto de aviso de SecretRef `gateway.auth.*` / `gateway.remote.*` não resolvido → o material de autenticação não estava disponível neste caminho de comando para o alvo com falha.

Relacionado:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/pt-BR/gateway#multiple-gateways-same-host)
- [/gateway/remote](/pt-BR/gateway/remote)

## Canal conectado, mas as mensagens não fluem

Se o estado do canal é conectado, mas o fluxo de mensagens está morto, foque em política, permissões e regras de entrega específicas do canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Procure por:

- Política de DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist de grupo e requisitos de menção.
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

Se cron ou heartbeat não executou ou não entregou, verifique primeiro o estado do agendador e depois o alvo da entrega.

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
- Motivos de ignorar heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Assinaturas comuns:

- `cron: scheduler disabled; jobs will not run automatically` → cron desabilitado.
- `cron: timer tick failed` → falha no tick do agendador; verifique erros de arquivo/log/runtime.
- `heartbeat skipped` com `reason=quiet-hours` → fora da janela de horas ativas.
- `heartbeat skipped` com `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe, mas contém apenas linhas em branco / cabeçalhos Markdown, então o OpenClaw ignora a chamada ao modelo.
- `heartbeat skipped` com `reason=no-tasks-due` → `HEARTBEAT.md` contém um bloco `tasks:`, mas nenhuma das tarefas deve ser executada neste tick.
- `heartbeat: unknown accountId` → id de conta inválido para o alvo de entrega do heartbeat.
- `heartbeat skipped` com `reason=dm-blocked` → o alvo do heartbeat foi resolvido para um destino do tipo DM enquanto `agents.defaults.heartbeat.directPolicy` (ou a substituição por agente) está definido como `block`.

Relacionado:

- [/automation/cron-jobs#troubleshooting](/pt-BR/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/pt-BR/automation/cron-jobs)
- [/gateway/heartbeat](/pt-BR/gateway/heartbeat)

## Ferramenta de nó pareado falha

Se um nó estiver pareado, mas as ferramentas falharem, isole o estado de primeiro plano, permissão e aprovação.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Procure por:

- Nó online com as capacidades esperadas.
- Concessões de permissões do sistema operacional para câmera/microfone/localização/tela.
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

## Ferramenta do navegador falha

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
- Acessibilidade do perfil CDP.
- Disponibilidade local do Chrome para perfis `existing-session` / `user`.

Assinaturas comuns:

- `unknown command "browser"` ou `unknown command 'browser'` → o plugin de navegador incluído foi excluído por `plugins.allow`.
- ferramenta do navegador ausente / indisponível enquanto `browser.enabled=true` → `plugins.allow` exclui `browser`, então o plugin nunca foi carregado.
- `Failed to start Chrome CDP on port` → o processo do navegador falhou ao iniciar.
- `browser.executablePath not found` → o caminho configurado é inválido.
- `browser.cdpUrl must be http(s) or ws(s)` → a URL CDP configurada usa um esquema não compatível, como `file:` ou `ftp:`.
- `browser.cdpUrl has invalid port` → a URL CDP configurada tem uma porta inválida ou fora do intervalo.
- `No Chrome tabs found for profile="user"` → o perfil de anexação do Chrome MCP não tem abas locais abertas do Chrome.
- `Remote CDP for profile "<name>" is not reachable` → o endpoint CDP remoto configurado não está acessível a partir do host do gateway.
- `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → o perfil somente de anexação não tem alvo acessível, ou o endpoint HTTP respondeu, mas o WebSocket CDP ainda não pôde ser aberto.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → a instalação atual do gateway não tem o pacote completo do Playwright; snapshots ARIA e screenshots básicos da página ainda podem funcionar, mas navegação, snapshots de IA, screenshots de elementos por seletor CSS e exportação em PDF continuam indisponíveis.
- `fullPage is not supported for element screenshots` → a solicitação de screenshot misturou `--full-page` com `--ref` ou `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → chamadas de screenshot do Chrome MCP / `existing-session` devem usar captura de página ou `--ref` de snapshot, não `--element` CSS.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooks de upload do Chrome MCP precisam de refs de snapshot, não seletores CSS.
- `existing-session file uploads currently support one file at a time.` → envie um upload por chamada em perfis Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → hooks de diálogo em perfis Chrome MCP não suportam substituições de timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` ainda exige um navegador gerenciado ou perfil CDP bruto.
- substituições antigas de viewport / modo escuro / localidade / offline em perfis attach-only ou CDP remoto → execute `openclaw browser stop --browser-profile <name>` para fechar a sessão de controle ativa e liberar o estado de emulação do Playwright/CDP sem reiniciar o gateway inteiro.

Relacionado:

- [/tools/browser-linux-troubleshooting](/pt-BR/tools/browser-linux-troubleshooting)
- [/tools/browser](/pt-BR/tools/browser)

## Se você atualizou e algo quebrou de repente

A maior parte dos problemas após atualização é desvio de configuração ou defaults mais rígidos agora sendo aplicados.

### 1) O comportamento de autenticação e substituição de URL mudou

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

O que verificar:

- Se `gateway.mode=remote`, as chamadas da CLI podem estar mirando o remoto enquanto seu serviço local está funcionando.
- Chamadas explícitas com `--url` não recorrem às credenciais armazenadas.

Assinaturas comuns:

- `gateway connect failed:` → alvo de URL incorreto.
- `unauthorized` → endpoint acessível, mas autenticação incorreta.

### 2) Guardrails de bind e autenticação estão mais rígidos

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

O que verificar:

- Binds não loopback (`lan`, `tailnet`, `custom`) precisam de um caminho válido de autenticação do gateway: autenticação por token/senha compartilhados ou uma implantação `trusted-proxy` não loopback corretamente configurada.
- Chaves antigas como `gateway.token` não substituem `gateway.auth.token`.

Assinaturas comuns:

- `refusing to bind gateway ... without auth` → bind não loopback sem um caminho válido de autenticação do gateway.
- `RPC probe: failed` enquanto o runtime está em execução → gateway ativo, mas inacessível com a autenticação/url atuais.

### 3) O estado de pairing e identidade do dispositivo mudou

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

O que verificar:

- Aprovações pendentes de dispositivos para dashboard/nós.
- Aprovações pendentes de pairing de DM após mudanças de política ou identidade.

Assinaturas comuns:

- `device identity required` → autenticação de dispositivo não satisfeita.
- `pairing required` → remetente/dispositivo deve ser aprovado.

Se a configuração do serviço e o runtime ainda divergirem após as verificações, reinstale os metadados do serviço a partir do mesmo diretório de perfil/estado:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Relacionado:

- [/gateway/pairing](/pt-BR/gateway/pairing)
- [/gateway/authentication](/pt-BR/gateway/authentication)
- [/gateway/background-process](/pt-BR/gateway/background-process)
