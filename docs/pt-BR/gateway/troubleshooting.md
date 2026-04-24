---
read_when:
    - O hub de solução de problemas apontou você para cá para um diagnóstico mais aprofundado
    - Você precisa de seções estáveis de runbook baseadas em sintomas com comandos exatos
summary: Runbook aprofundado de solução de problemas para gateway, canais, automação, nodes e navegador
title: Solução de problemas
x-i18n:
    generated_at: "2026-04-24T05:54:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32c4cbbbe8b1cd5eaca34503f4a363d3fa2650e491f83455958eb5725f9d50c5
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Solução de problemas do Gateway

Esta página é o runbook aprofundado.
Comece em [/help/troubleshooting](/pt-BR/help/troubleshooting) se quiser primeiro o fluxo rápido de triagem.

## Sequência de comandos

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
- `openclaw doctor` não relata problemas bloqueadores de configuração/serviço.
- `openclaw channels status --probe` mostra status de transporte ativo por conta e,
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

- O modelo Anthropic Opus/Sonnet selecionado tem `params.context1m: true`.
- A credencial Anthropic atual não é elegível para uso de contexto longo.
- As requisições falham apenas em sessões longas/execuções de modelo que precisam do caminho beta de 1M.

Opções de correção:

1. Desative `context1m` para esse modelo para voltar à janela de contexto normal.
2. Use uma credencial Anthropic elegível para requisições de contexto longo ou troque para uma chave de API da Anthropic.
3. Configure modelos de fallback para que as execuções continuem quando requisições Anthropic de contexto longo forem rejeitadas.

Relacionado:

- [/providers/anthropic](/pt-BR/providers/anthropic)
- [/reference/token-use](/pt-BR/reference/token-use)
- [/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/pt-BR/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Backend local compatível com OpenAI passa em probes diretos, mas execuções do agente falham

Use isto quando:

- `curl ... /v1/models` funciona
- pequenas chamadas diretas para `/v1/chat/completions` funcionam
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

- chamadas diretas pequenas funcionam, mas execuções do OpenClaw falham apenas em prompts maiores
- erros do backend sobre `messages[].content` esperando uma string
- falhas do backend que aparecem apenas com contagens maiores de tokens de prompt ou prompts completos
  de runtime do agente

Assinaturas comuns:

- `messages[...].content: invalid type: sequence, expected a string` → o backend
  rejeita partes estruturadas de conteúdo de Chat Completions. Correção: defina
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- requisições diretas pequenas funcionam, mas execuções do agente OpenClaw falham com falhas
  de backend/modelo (por exemplo Gemma em algumas builds `inferrs`) → o transporte do OpenClaw
  provavelmente já está correto; o backend está falhando no formato maior de prompt
  do runtime do agente.
- as falhas diminuem após desativar ferramentas, mas não desaparecem → schemas de ferramenta
  faziam parte da pressão, mas o problema restante ainda é capacidade do modelo/servidor upstream
  ou bug do backend.

Opções de correção:

1. Defina `compat.requiresStringContent: true` para backends de Chat Completions que aceitam apenas string.
2. Defina `compat.supportsTools: false` para modelos/backends que não conseguem lidar
   de forma confiável com a superfície de schema de ferramentas do OpenClaw.
3. Reduza a pressão do prompt quando possível: bootstrap de workspace menor, histórico de
   sessão mais curto, modelo local mais leve ou um backend com melhor suporte a contexto longo.
4. Se pequenas requisições diretas continuarem funcionando, mas os turnos do agente OpenClaw ainda falharem
   dentro do backend, trate isso como limitação do servidor/modelo upstream e registre
   lá uma reprodução com o formato de payload aceito.

Relacionado:

- [/gateway/local-models](/pt-BR/gateway/local-models)
- [/gateway/configuration](/pt-BR/gateway/configuration)
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

- Pareamento pendente para remetentes de DM.
- Bloqueio por menção em grupo (`requireMention`, `mentionPatterns`).
- Incompatibilidades de allowlist de canal/grupo.

Assinaturas comuns:

- `drop guild message (mention required` → mensagem de grupo ignorada até haver menção.
- `pairing request` → o remetente precisa de aprovação.
- `blocked` / `allowlist` → remetente/canal foi filtrado pela política.

Relacionado:

- [/channels/troubleshooting](/pt-BR/channels/troubleshooting)
- [/channels/pairing](/pt-BR/channels/pairing)
- [/channels/groups](/pt-BR/channels/groups)

## Conectividade da interface do dashboard/control

Quando o dashboard/interface do Control não conecta, valide URL, modo de autenticação e pressupostos de contexto seguro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Procure por:

- URL de probe e URL do dashboard corretas.
- Incompatibilidade de modo de autenticação/token entre cliente e gateway.
- Uso de HTTP quando identidade de dispositivo é exigida.

Assinaturas comuns:

- `device identity required` → contexto não seguro ou autenticação de dispositivo ausente.
- `origin not allowed` → `Origin` do navegador não está em `gateway.controlUi.allowedOrigins`
  (ou você está conectando a partir de uma origem de navegador sem loopback sem uma
  allowlist explícita).
- `device nonce required` / `device nonce mismatch` → o cliente não está concluindo o
  fluxo de autenticação de dispositivo baseado em desafio (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → o cliente assinou o payload
  errado (ou com timestamp obsoleto) para o handshake atual.
- `AUTH_TOKEN_MISMATCH` com `canRetryWithDeviceToken=true` → o cliente pode fazer uma tentativa confiável com token de dispositivo em cache.
- Essa nova tentativa com token em cache reutiliza o conjunto de escopos armazenado com o token de dispositivo pareado. Chamadores com `deviceToken` explícito / `scopes` explícitos mantêm o conjunto de escopos solicitado.
- Fora desse caminho de nova tentativa, a precedência de autenticação de conexão é:
  token/senha compartilhado explícito primeiro, depois `deviceToken` explícito, depois token de dispositivo armazenado, depois token bootstrap.
- No caminho assíncrono da interface do Control via Tailscale Serve, tentativas falhas para o mesmo
  `{scope, ip}` são serializadas antes que o limitador registre a falha. Duas novas tentativas ruins concorrentes do mesmo cliente podem, portanto, mostrar `retry later`
  na segunda tentativa, em vez de duas simples incompatibilidades.
- `too many failed authentication attempts (retry later)` de um cliente loopback com origem de navegador
  → falhas repetidas dessa mesma `Origin` normalizada são bloqueadas temporariamente; outra origem localhost usa um bucket separado.
- `unauthorized` repetido após essa nova tentativa → divergência de token compartilhado/token de dispositivo; atualize a configuração do token e reaprove/rotacione o token do dispositivo se necessário.
- `gateway connect failed:` → destino de host/porta/url incorreto.

### Mapa rápido de códigos de detalhe de autenticação

Use `error.details.code` da resposta `connect` com falha para escolher a próxima ação:

| Código de detalhe            | Significado                                                                                                                                                                                   | Ação recomendada                                                                                                                                                                                                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | O cliente não enviou um token compartilhado obrigatório.                                                                                                                                      | Cole/defina o token no cliente e tente novamente. Para caminhos do dashboard: `openclaw config get gateway.auth.token` e depois cole nas configurações da interface do Control.                                                                                                         |
| `AUTH_TOKEN_MISMATCH`        | O token compartilhado não corresponde ao token de autenticação do gateway.                                                                                                                    | Se `canRetryWithDeviceToken=true`, permita uma nova tentativa confiável. Novas tentativas com token em cache reutilizam escopos aprovados armazenados; chamadores com `deviceToken` / `scopes` explícitos mantêm os escopos solicitados. Se ainda falhar, execute a [checklist de recuperação de divergência de token](/pt-BR/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | O token em cache por dispositivo está obsoleto ou revogado.                                                                                                                                   | Rotacione/reaprove o token do dispositivo usando a [CLI de devices](/pt-BR/cli/devices) e depois reconecte.                                                                                                                                                                                    |
| `PAIRING_REQUIRED`           | A identidade do dispositivo precisa de aprovação. Verifique `error.details.reason` para `not-paired`, `scope-upgrade`, `role-upgrade` ou `metadata-upgrade`, e use `requestId` / `remediationHint` quando presentes. | Aprove a solicitação pendente: `openclaw devices list` e depois `openclaw devices approve <requestId>`. Atualizações de escopo/função usam o mesmo fluxo depois que você revisar o acesso solicitado.                                                                                 |

Verificação de migração do device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Se os logs mostrarem erros de nonce/assinatura, atualize o cliente que está conectando e verifique se ele:

1. espera por `connect.challenge`
2. assina o payload vinculado ao desafio
3. envia `connect.params.device.nonce` com o mesmo nonce do desafio

Se `openclaw devices rotate` / `revoke` / `remove` for negado inesperadamente:

- sessões com token de dispositivo pareado podem gerenciar apenas **seu próprio** dispositivo, a menos que o
  chamador também tenha `operator.admin`
- `openclaw devices rotate --scope ...` só pode solicitar escopos de operador que
  a sessão do chamador já possua

Relacionado:

- [/web/control-ui](/pt-BR/web/control-ui)
- [/gateway/configuration](/pt-BR/gateway/configuration) (modos de autenticação do gateway)
- [/gateway/trusted-proxy-auth](/pt-BR/gateway/trusted-proxy-auth)
- [/gateway/remote](/pt-BR/gateway/remote)
- [/cli/devices](/pt-BR/cli/devices)

## Serviço do gateway não está em execução

Use isto quando o serviço estiver instalado, mas o processo não permanecer ativo.

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
- Dicas de limpeza `Other gateway-like services detected (best effort)`.

Assinaturas comuns:

- `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → o modo de gateway local não está ativado, ou o arquivo de configuração foi corrompido e perdeu `gateway.mode`. Correção: defina `gateway.mode="local"` na sua configuração ou execute novamente `openclaw onboard --mode local` / `openclaw setup` para reaplicar a configuração esperada de modo local. Se você estiver executando o OpenClaw via Podman, o caminho padrão de configuração é `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → bind sem loopback sem um caminho válido de autenticação do gateway (token/senha ou trusted-proxy, quando configurado).
- `another gateway instance is already listening` / `EADDRINUSE` → conflito de porta.
- `Other gateway-like services detected (best effort)` → existem unidades launchd/systemd/schtasks obsoletas ou paralelas. A maioria das configurações deve manter um gateway por máquina; se você realmente precisar de mais de um, isole portas + config/estado/workspace. Consulte [/gateway#multiple-gateways-same-host](/pt-BR/gateway#multiple-gateways-same-host).

Relacionado:

- [/gateway/background-process](/pt-BR/gateway/background-process)
- [/gateway/configuration](/pt-BR/gateway/configuration)
- [/gateway/doctor](/pt-BR/gateway/doctor)

## Gateway restaurou a última configuração válida conhecida

Use isto quando o Gateway iniciar, mas os logs disserem que restaurou `openclaw.json`.

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
- Um arquivo com timestamp `openclaw.json.clobbered.*` ao lado da configuração ativa
- Um evento do sistema do agente principal que começa com `Config recovery warning`

O que aconteceu:

- A configuração rejeitada não passou na validação durante a inicialização ou hot reload.
- O OpenClaw preservou o payload rejeitado como `.clobbered.*`.
- A configuração ativa foi restaurada a partir da última cópia válida conhecida.
- O próximo turno do agente principal recebe um aviso para não reescrever cegamente a configuração rejeitada.

Inspecionar e reparar:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Assinaturas comuns:

- `.clobbered.*` existe → uma edição direta externa ou leitura de inicialização foi restaurada.
- `.rejected.*` existe → uma gravação de configuração de propriedade do OpenClaw falhou em verificações de schema ou corrupção antes do commit.
- `Config write rejected:` → a gravação tentou remover formato obrigatório, reduzir drasticamente o arquivo ou persistir configuração inválida.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` ou `size-drop-vs-last-good:*` → a inicialização tratou o arquivo atual como corrompido porque ele perdeu campos ou tamanho em comparação com o backup válido conhecido.
- `Config last-known-good promotion skipped` → o candidato continha placeholders de segredos redigidos, como `***`.

Opções de correção:

1. Mantenha a configuração ativa restaurada se ela estiver correta.
2. Copie apenas as chaves pretendidas de `.clobbered.*` ou `.rejected.*` e depois aplique-as com `openclaw config set` ou `config.patch`.
3. Execute `openclaw config validate` antes de reiniciar.
4. Se editar manualmente, mantenha a configuração JSON5 completa, não apenas o objeto parcial que você queria alterar.

Relacionado:

- [/gateway/configuration#strict-validation](/pt-BR/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/pt-BR/gateway/configuration#config-hot-reload)
- [/cli/config](/pt-BR/cli/config)
- [/gateway/doctor](/pt-BR/gateway/doctor)

## Avisos de probe do Gateway

Use isto quando `openclaw gateway probe` alcançar algo, mas ainda assim imprimir um bloco de aviso.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Procure por:

- `warnings[].code` e `primaryTargetId` na saída JSON.
- Se o aviso é sobre fallback para SSH, múltiplos gateways, escopos ausentes ou refs de autenticação não resolvidas.

Assinaturas comuns:

- `SSH tunnel failed to start; falling back to direct probes.` → a configuração SSH falhou, mas o comando ainda tentou alvos diretos configurados/em loopback.
- `multiple reachable gateways detected` → mais de um alvo respondeu. Normalmente isso significa uma configuração intencional de múltiplos gateways ou listeners obsoletos/duplicados.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → a conexão funcionou, mas a RPC de detalhe está limitada por escopo; pareie a identidade do dispositivo ou use credenciais com `operator.read`.
- `Capability: pairing-pending` ou `gateway closed (1008): pairing required` → o gateway respondeu, mas este cliente ainda precisa de pareamento/aprovação antes do acesso normal de operador.
- texto de aviso de SecretRef não resolvida em `gateway.auth.*` / `gateway.remote.*` → o material de autenticação estava indisponível neste caminho de comando para o alvo com falha.

Relacionado:

- [/cli/gateway](/pt-BR/cli/gateway)
- [/gateway#multiple-gateways-same-host](/pt-BR/gateway#multiple-gateways-same-host)
- [/gateway/remote](/pt-BR/gateway/remote)

## Canal conectado, mas mensagens não fluem

Se o estado do canal estiver conectado, mas o fluxo de mensagens estiver morto, concentre-se em política, permissões e regras específicas de entrega do canal.

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
- rastros de `pairing` / aprovação pendente → o remetente não está aprovado.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema de autenticação/permissões do canal.

Relacionado:

- [/channels/troubleshooting](/pt-BR/channels/troubleshooting)
- [/channels/whatsapp](/pt-BR/channels/whatsapp)
- [/channels/telegram](/pt-BR/channels/telegram)
- [/channels/discord](/pt-BR/channels/discord)

## Entrega de Cron e Heartbeat

Se o Cron ou o Heartbeat não executou ou não entregou, verifique primeiro o estado do agendador e depois o destino de entrega.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Procure por:

- Cron ativado e próxima ativação presente.
- Status do histórico de execução da tarefa (`ok`, `skipped`, `error`).
- Motivos de ignorar Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Assinaturas comuns:

- `cron: scheduler disabled; jobs will not run automatically` → cron desativado.
- `cron: timer tick failed` → o tick do agendador falhou; verifique erros de arquivo/log/runtime.
- `heartbeat skipped` com `reason=quiet-hours` → fora da janela de horas ativas.
- `heartbeat skipped` com `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe, mas contém apenas linhas em branco / cabeçalhos markdown, então o OpenClaw ignora a chamada ao modelo.
- `heartbeat skipped` com `reason=no-tasks-due` → `HEARTBEAT.md` contém um bloco `tasks:`, mas nenhuma das tarefas está vencida neste tick.
- `heartbeat: unknown accountId` → account id inválido para o destino de entrega do Heartbeat.
- `heartbeat skipped` com `reason=dm-blocked` → o destino do Heartbeat foi resolvido para um destino no estilo DM enquanto `agents.defaults.heartbeat.directPolicy` (ou substituição por agente) está definido como `block`.

Relacionado:

- [/automation/cron-jobs#troubleshooting](/pt-BR/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/pt-BR/automation/cron-jobs)
- [/gateway/heartbeat](/pt-BR/gateway/heartbeat)

## Ferramenta de Node pareado falha

Se um Node estiver pareado, mas as ferramentas falharem, isole estado de foreground, permissão e aprovação.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Procure por:

- Node online com os recursos esperados.
- Concessões de permissão do sistema operacional para câmera/microfone/localização/tela.
- Aprovações de exec e estado de allowlist.

Assinaturas comuns:

- `NODE_BACKGROUND_UNAVAILABLE` → o app do node precisa estar em primeiro plano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permissão do sistema operacional ausente.
- `SYSTEM_RUN_DENIED: approval required` → aprovação de exec pendente.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado pela allowlist.

Relacionado:

- [/nodes/troubleshooting](/pt-BR/nodes/troubleshooting)
- [/nodes/index](/pt-BR/nodes/index)
- [/tools/exec-approvals](/pt-BR/tools/exec-approvals)

## Ferramenta de navegador falha

Use isto quando ações da ferramenta de navegador falharem, mesmo que o próprio gateway esteja saudável.

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
- Disponibilidade do Chrome local para perfis `existing-session` / `user`.

Assinaturas comuns:

- `unknown command "browser"` ou `unknown command 'browser'` → o plugin empacotado de navegador foi excluído por `plugins.allow`.
- ferramenta de navegador ausente / indisponível enquanto `browser.enabled=true` → `plugins.allow` exclui `browser`, então o plugin nunca foi carregado.
- `Failed to start Chrome CDP on port` → o processo do navegador falhou ao iniciar.
- `browser.executablePath not found` → o caminho configurado é inválido.
- `browser.cdpUrl must be http(s) or ws(s)` → a URL CDP configurada usa um esquema não compatível, como `file:` ou `ftp:`.
- `browser.cdpUrl has invalid port` → a URL CDP configurada tem uma porta inválida ou fora do intervalo.
- `Could not find DevToolsActivePort for chrome` → o existing-session do Chrome MCP ainda não conseguiu se conectar ao diretório de dados do navegador selecionado. Abra a página de inspeção do navegador, ative a depuração remota, mantenha o navegador aberto, aprove o primeiro prompt de conexão e tente novamente. Se o estado de login não for necessário, prefira o perfil gerenciado `openclaw`.
- `No Chrome tabs found for profile="user"` → o perfil de conexão do Chrome MCP não tem abas locais abertas do Chrome.
- `Remote CDP for profile "<name>" is not reachable` → o endpoint remoto CDP configurado não está acessível a partir do host do gateway.
- `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → o perfil somente attach não tem destino acessível, ou o endpoint HTTP respondeu, mas o WebSocket CDP ainda não pôde ser aberto.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → a instalação atual do gateway não tem a dependência de runtime `playwright-core` do plugin empacotado de navegador; execute `openclaw doctor --fix` e depois reinicie o gateway. Snapshots ARIA e capturas básicas de página ainda podem funcionar, mas navegação, snapshots com IA, capturas de elemento por seletor CSS e exportação de PDF continuam indisponíveis.
- `fullPage is not supported for element screenshots` → a solicitação de screenshot misturou `--full-page` com `--ref` ou `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → chamadas de screenshot do Chrome MCP / `existing-session` devem usar captura de página ou um `--ref` de snapshot, não CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooks de upload do Chrome MCP precisam de refs de snapshot, não seletores CSS.
- `existing-session file uploads currently support one file at a time.` → envie um upload por chamada em perfis Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → hooks de diálogo em perfis Chrome MCP não aceitam substituições de timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` ainda exige um navegador gerenciado ou perfil CDP bruto.
- substituições obsoletas de viewport / dark mode / locale / offline em perfis attach-only ou CDP remotos → execute `openclaw browser stop --browser-profile <name>` para fechar a sessão de controle ativa e liberar o estado de emulação Playwright/CDP sem reiniciar todo o gateway.

Relacionado:

- [/tools/browser-linux-troubleshooting](/pt-BR/tools/browser-linux-troubleshooting)
- [/tools/browser](/pt-BR/tools/browser)

## Se algo quebrou logo após uma atualização

A maior parte das quebras pós-atualização vem de deriva de configuração ou de padrões mais estritos agora sendo aplicados.

### 1) O comportamento de autenticação e substituição de URL mudou

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

O que verificar:

- Se `gateway.mode=remote`, chamadas da CLI podem estar tendo como alvo o remoto enquanto seu serviço local está funcionando.
- Chamadas explícitas com `--url` não usam fallback para credenciais armazenadas.

Assinaturas comuns:

- `gateway connect failed:` → alvo de URL incorreto.
- `unauthorized` → endpoint acessível, mas autenticação errada.

### 2) Guardrails de bind e autenticação estão mais rígidos

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

O que verificar:

- Binds sem loopback (`lan`, `tailnet`, `custom`) precisam de um caminho válido de autenticação do gateway: autenticação por token/senha compartilhados ou uma implantação `trusted-proxy` sem loopback configurada corretamente.
- Chaves antigas como `gateway.token` não substituem `gateway.auth.token`.

Assinaturas comuns:

- `refusing to bind gateway ... without auth` → bind sem loopback sem um caminho válido de autenticação do gateway.
- `Connectivity probe: failed` enquanto o runtime está em execução → gateway vivo, mas inacessível com a autenticação/URL atuais.

### 3) O estado de pareamento e identidade de dispositivo mudou

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

Relacionado:

- [/gateway/pairing](/pt-BR/gateway/pairing)
- [/gateway/authentication](/pt-BR/gateway/authentication)
- [/gateway/background-process](/pt-BR/gateway/background-process)

## Relacionado

- [Runbook do Gateway](/pt-BR/gateway)
- [Doctor](/pt-BR/gateway/doctor)
- [FAQ](/pt-BR/help/faq)
