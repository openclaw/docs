---
read_when:
    - O hub de solução de problemas indicou esta página para um diagnóstico mais aprofundado
    - Você precisa de seções de runbook estáveis, baseadas em sintomas, com comandos exatos
sidebarTitle: Troubleshooting
summary: Guia operacional aprofundado de solução de problemas para Gateway, canais, automação, nós e navegador
title: Solução de problemas
x-i18n:
    generated_at: "2026-05-10T19:36:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 798016211b615242abca327295c76223ff2dfd3d83dc8a08e396d9e65b9efed4
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
- `openclaw doctor` não relata problemas bloqueantes de configuração/serviço.
- `openclaw channels status --probe` mostra o status de transporte ao vivo por conta e, quando suportado, resultados de probe/auditoria como `works` ou `audit ok`.

## Instalações split brain e proteção de configuração mais nova

Use isto quando um serviço do Gateway parar inesperadamente após uma atualização, ou os logs mostrarem que um binário `openclaw` é mais antigo do que a versão que gravou `openclaw.json` pela última vez.

O OpenClaw carimba gravações de configuração com `meta.lastTouchedVersion`. Comandos somente leitura ainda podem inspecionar uma configuração gravada por um OpenClaw mais novo, mas mutações de processo e serviço se recusam a continuar a partir de um binário mais antigo. Ações bloqueadas incluem iniciar, parar, reiniciar e desinstalar o serviço do Gateway, reinstalação forçada do serviço, inicialização do Gateway em modo de serviço e limpeza de porta com `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Corrigir PATH">
    Corrija `PATH` para que `openclaw` resolva para a instalação mais nova e execute a ação novamente.
  </Step>
  <Step title="Reinstalar o serviço do Gateway">
    Reinstale o serviço do Gateway pretendido a partir da instalação mais nova:

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
Apenas para downgrade intencional ou recuperação de emergência, defina `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` para o comando único. Deixe indefinido para operação normal.
</Warning>

## Link simbólico de Skill ignorado por escape de caminho

Use isto quando os logs incluírem:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

O OpenClaw trata toda raiz de Skill como um limite de contenção. Um link simbólico em
`~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` ou
`~/.openclaw/skills` é ignorado quando seu destino real resolve para fora dessa raiz,
a menos que o destino seja explicitamente confiável.

Inspecione o link:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Se o destino for intencional, configure tanto a raiz direta da Skill quanto o
destino permitido do link simbólico:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Depois, inicie uma nova sessão ou aguarde o watcher de Skills atualizar. Reinicie o
Gateway se o processo em execução for anterior à alteração de configuração.

Não use destinos amplos como `~`, `/` ou uma pasta inteira de projeto sincronizado.
Mantenha `allowSymlinkTargets` limitado à raiz real de Skills que contém diretórios
`SKILL.md` confiáveis.

Relacionado:

- [Configuração de Skills](/pt-BR/tools/skills-config#symlinked-sibling-repos)
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Uso extra da Anthropic 429 exigido para contexto longo

Use isto quando logs/erros incluírem: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Procure por:

- O modelo Anthropic Opus/Sonnet selecionado tem `params.context1m: true`.
- A credencial Anthropic atual não é elegível para uso de contexto longo.
- As solicitações falham somente em sessões longas/execuções de modelo que precisam do caminho beta de 1M.

Opções de correção:

<Steps>
  <Step title="Desabilitar context1m">
    Desabilite `context1m` para esse modelo para voltar à janela de contexto normal.
  </Step>
  <Step title="Usar uma credencial elegível">
    Use uma credencial Anthropic elegível para solicitações de contexto longo ou alterne para uma chave de API da Anthropic.
  </Step>
  <Step title="Configurar modelos de fallback">
    Configure modelos de fallback para que as execuções continuem quando solicitações Anthropic de contexto longo forem rejeitadas.
  </Step>
</Steps>

Relacionado:

- [Anthropic](/pt-BR/providers/anthropic)
- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Por que estou vendo HTTP 429 da Anthropic?](/pt-BR/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Backend local compatível com OpenAI passa em probes diretos, mas execuções de agente falham

Use isto quando:

- `curl ... /v1/models` funciona
- chamadas diretas pequenas para `/v1/chat/completions` funcionam
- execuções de modelo do OpenClaw falham somente em turnos normais do agente

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Procure por:

- chamadas diretas pequenas têm sucesso, mas execuções do OpenClaw falham somente em prompts maiores
- erros `model_not_found` ou 404 mesmo que `/v1/chat/completions` direto
  funcione com o mesmo id de modelo simples
- erros do backend sobre `messages[].content` esperar uma string
- avisos intermitentes `incomplete turn detected ... stopReason=stop payloads=0` com um backend local compatível com OpenAI
- falhas do backend que aparecem somente com contagens maiores de tokens de prompt ou prompts completos de runtime do agente

<AccordionGroup>
  <Accordion title="Assinaturas comuns">
    - `model_not_found` com um servidor local estilo MLX/vLLM → verifique se `baseUrl` inclui `/v1`, se `api` é `"openai-completions"` para backends `/v1/chat/completions` e se `models.providers.<provider>.models[].id` é o id simples local do provedor. Selecione-o com o prefixo do provedor uma vez, por exemplo `mlx/mlx-community/Qwen3-30B-A3B-6bit`; mantenha a entrada do catálogo como `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → o backend rejeita partes estruturadas de conteúdo de Chat Completions. Correção: defina `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` ou chaves de mensagem permitidas como `["role","content"]` → o backend rejeita metadados de replay no estilo OpenAI em mensagens de Chat Completions. Correção: defina `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → o backend concluiu a solicitação de Chat Completions, mas não retornou texto de assistente visível ao usuário para esse turno. O OpenClaw repete uma vez turnos vazios compatíveis com OpenAI que são seguros para replay; falhas persistentes normalmente significam que o backend está emitindo conteúdo vazio/não textual ou suprimindo o texto de resposta final.
    - solicitações diretas pequenas têm sucesso, mas execuções do agente OpenClaw falham com travamentos do backend/modelo (por exemplo, Gemma em algumas builds de `inferrs`) → o transporte do OpenClaw provavelmente já está correto; o backend está falhando no formato maior de prompt de runtime do agente.
    - falhas diminuem após desabilitar ferramentas, mas não desaparecem → esquemas de ferramentas faziam parte da pressão, mas o problema restante ainda é capacidade do modelo/servidor upstream ou um bug de backend.

  </Accordion>
  <Accordion title="Opções de correção">
    1. Defina `compat.requiresStringContent: true` para backends de Chat Completions que aceitam apenas string.
    2. Defina `compat.strictMessageKeys: true` para backends estritos de Chat Completions que aceitam apenas `role` e `content` em cada mensagem.
    3. Defina `compat.supportsTools: false` para modelos/backends que não conseguem lidar de forma confiável com a superfície de esquema de ferramentas do OpenClaw.
    4. Reduza a pressão de prompt quando possível: bootstrap menor do workspace, histórico de sessão mais curto, modelo local mais leve ou um backend com suporte mais forte a contexto longo.
    5. Se solicitações diretas pequenas continuarem passando enquanto turnos do agente OpenClaw ainda travam dentro do backend, trate isso como uma limitação upstream de servidor/modelo e abra uma reprodução lá com o formato de payload aceito.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Configuração](/pt-BR/gateway/configuration)
- [Modelos locais](/pt-BR/gateway/local-models)
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
- Controle de menção em grupo (`requireMention`, `mentionPatterns`).
- Incompatibilidades de allowlist de canal/grupo.

Assinaturas comuns:

- `drop guild message (mention required` → mensagem de grupo ignorada até haver menção.
- `pairing request` → remetente precisa de aprovação.
- `blocked` / `allowlist` → remetente/canal foi filtrado por política.

Relacionado:

- [Solução de problemas de canais](/pt-BR/channels/troubleshooting)
- [Grupos](/pt-BR/channels/groups)
- [Pareamento](/pt-BR/channels/pairing)

## Conectividade da UI de controle do dashboard

Quando a UI de dashboard/controle não conectar, valide a URL, o modo de autenticação e as premissas de contexto seguro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Procure por:

- URL de probe e URL do dashboard corretas.
- Incompatibilidade de modo/token de autenticação entre cliente e Gateway.
- Uso de HTTP onde identidade do dispositivo é exigida.

<AccordionGroup>
  <Accordion title="Assinaturas de conexão/autenticação">
    - `device identity required` → contexto não seguro ou autenticação de dispositivo ausente.
    - `origin not allowed` → o `Origin` do navegador não está em `gateway.controlUi.allowedOrigins` (ou você está conectando de uma origem de navegador que não é loopback sem uma allowlist explícita).
    - `device nonce required` / `device nonce mismatch` → o cliente não está concluindo o fluxo de autenticação de dispositivo baseado em desafio (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → o cliente assinou o payload errado (ou timestamp obsoleto) para o handshake atual.
    - `AUTH_TOKEN_MISMATCH` com `canRetryWithDeviceToken=true` → o cliente pode fazer uma nova tentativa confiável com o token de dispositivo em cache.
    - Essa nova tentativa com token em cache reutiliza o conjunto de escopos em cache armazenado com o token do dispositivo pareado. Chamadores com `deviceToken` explícito / `scopes` explícitos mantêm o conjunto de escopos solicitado.
    - Fora desse caminho de nova tentativa, a precedência da autenticação de conexão é token compartilhado/senha explícitos primeiro, depois `deviceToken` explícito, depois token de dispositivo armazenado, depois token de bootstrap.
    - No caminho assíncrono da UI de Controle do Tailscale Serve, tentativas com falha para o mesmo `{scope, ip}` são serializadas antes de o limitador registrar a falha. Portanto, duas novas tentativas ruins simultâneas do mesmo cliente podem exibir `retry later` na segunda tentativa em vez de duas incompatibilidades simples.
    - `too many failed authentication attempts (retry later)` de um cliente loopback com origem de navegador → falhas repetidas dessa mesma `Origin` normalizada são bloqueadas temporariamente; outra origem localhost usa um bucket separado.
    - `unauthorized` repetido após essa nova tentativa → divergência de token compartilhado/token de dispositivo; atualize a configuração de token e aprove novamente/rotacione o token do dispositivo, se necessário.
    - `gateway connect failed:` → destino incorreto de host/porta/url.

  </Accordion>
</AccordionGroup>

### Mapa rápido dos códigos de detalhe de autenticação

Use `error.details.code` da resposta `connect` com falha para escolher a próxima ação:

| Código de detalhe            | Significado                                                                                                                                                                                    | Ação recomendada                                                                                                                                                                                                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | O cliente não enviou um token compartilhado obrigatório.                                                                                                                                       | Cole/defina o token no cliente e tente novamente. Para caminhos do painel: `openclaw config get gateway.auth.token` e então cole nas configurações da UI de Controle.                                                                                                                       |
| `AUTH_TOKEN_MISMATCH`        | O token compartilhado não correspondeu ao token de autenticação do Gateway.                                                                                                                    | Se `canRetryWithDeviceToken=true`, permita uma nova tentativa confiável. Novas tentativas com token em cache reutilizam escopos aprovados armazenados; chamadores explícitos de `deviceToken` / `scopes` mantêm os escopos solicitados. Se ainda falhar, execute a [lista de verificação de recuperação de desvio de token](/pt-BR/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | O token por dispositivo em cache está obsoleto ou foi revogado.                                                                                                                                | Rotacione/aprove novamente o token do dispositivo usando a [CLI de dispositivos](/pt-BR/cli/devices) e então reconecte.                                                                                                                                                                            |
| `PAIRING_REQUIRED`           | A identidade do dispositivo precisa de aprovação. Verifique `error.details.reason` para `not-paired`, `scope-upgrade`, `role-upgrade` ou `metadata-upgrade`, e use `requestId` / `remediationHint` quando presentes. | Aprove a solicitação pendente: `openclaw devices list` e então `openclaw devices approve <requestId>`. Atualizações de escopo/função usam o mesmo fluxo depois que você revisar o acesso solicitado.                                                                                        |

<Note>
RPCs diretos de backend por loopback autenticados com o token/senha compartilhado do Gateway não devem depender da linha de base de escopo de dispositivo pareado da CLI. Se subagentes ou outras chamadas internas ainda falharem com `scope-upgrade`, verifique se o chamador está usando `client.id: "gateway-client"` e `client.mode: "backend"` e se não está forçando um `deviceIdentity` explícito ou token de dispositivo.
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
    O cliente aguarda o `connect.challenge` emitido pelo Gateway.
  </Step>
  <Step title="Assinar a carga útil">
    O cliente assina a carga útil vinculada ao desafio.
  </Step>
  <Step title="Enviar o nonce do dispositivo">
    O cliente envia `connect.params.device.nonce` com o mesmo nonce de desafio.
  </Step>
</Steps>

Se `openclaw devices rotate` / `revoke` / `remove` for negado inesperadamente:

- sessões com token de dispositivo pareado podem gerenciar apenas **seu próprio** dispositivo, a menos que o chamador também tenha `operator.admin`
- `openclaw devices rotate --scope ...` só pode solicitar escopos de operador que a sessão do chamador já possui

Relacionado:

- [Configuração](/pt-BR/gateway/configuration) (modos de autenticação do Gateway)
- [UI de Controle](/pt-BR/web/control-ui)
- [Dispositivos](/pt-BR/cli/devices)
- [Acesso remoto](/pt-BR/gateway/remote)
- [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth)

## Serviço Gateway não está em execução

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
- Incompatibilidade na configuração do serviço (`Config (cli)` vs `Config (service)`).
- Conflitos de porta/ouvinte.
- Instalações extras de launchd/systemd/schtasks quando `--deep` é usado.
- Dicas de limpeza de `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Assinaturas comuns">
    - `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → o modo de Gateway local não está ativado, ou o arquivo de configuração foi sobrescrito e perdeu `gateway.mode`. Correção: defina `gateway.mode="local"` na sua configuração, ou execute novamente `openclaw onboard --mode local` / `openclaw setup` para remarcar a configuração de modo local esperada. Se você estiver executando o OpenClaw via Podman, o caminho de configuração padrão é `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → bind fora de loopback sem um caminho válido de autenticação do Gateway (token/senha, ou proxy confiável quando configurado).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflito de porta.
    - `Other gateway-like services detected (best effort)` → unidades launchd/systemd/schtasks obsoletas ou paralelas existem. A maioria das configurações deve manter um Gateway por máquina; se você realmente precisar de mais de um, isole portas + configuração/estado/workspace. Consulte [/gateway#multiple-gateways-same-host](/pt-BR/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` do doctor → uma unidade systemd do sistema existe enquanto o serviço no nível do usuário está ausente. Remova ou desative a duplicata antes de permitir que o doctor instale um serviço de usuário, ou defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` se a unidade do sistema for o supervisor pretendido.
    - `Gateway service port does not match current gateway config` → o supervisor instalado ainda fixa o `--port` antigo. Execute `openclaw doctor --fix` ou `openclaw gateway install --force` e então reinicie o serviço Gateway.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Execução em segundo plano e ferramenta de processo](/pt-BR/gateway/background-process)
- [Configuração](/pt-BR/gateway/configuration)
- [Doctor](/pt-BR/gateway/doctor)

## Gateway rejeitou configuração inválida

Use isto quando a inicialização do Gateway falhar com `Invalid config` ou os logs de recarregamento dinâmico disserem
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
- Um arquivo `openclaw.json.rejected.*` com carimbo de data/hora ao lado da configuração ativa
- Um arquivo `openclaw.json.clobbered.*` com carimbo de data/hora se `doctor --fix` reparou uma edição direta quebrada

<AccordionGroup>
  <Accordion title="O que aconteceu">
    - A configuração não foi validada durante a inicialização, o recarregamento dinâmico ou uma gravação de propriedade do OpenClaw.
    - A inicialização do Gateway falha de forma fechada em vez de reescrever `openclaw.json`.
    - O recarregamento dinâmico ignora edições externas inválidas e mantém a configuração de runtime atual ativa.
    - Gravações de propriedade do OpenClaw rejeitam cargas úteis inválidas/destrutivas antes do commit e salvam `.rejected.*`.
    - `openclaw doctor --fix` é responsável pelo reparo. Ele pode remover prefixos que não são JSON ou restaurar a última cópia sabidamente boa enquanto preserva a carga útil rejeitada como `.clobbered.*`.

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
    - `.clobbered.*` existe → o doctor preservou uma edição externa quebrada enquanto reparava a configuração ativa.
    - `.rejected.*` existe → uma gravação de configuração de propriedade do OpenClaw falhou nas verificações de esquema ou sobrescrita antes do commit.
    - `Config write rejected:` → a gravação tentou remover a estrutura obrigatória, reduzir drasticamente o arquivo ou persistir configuração inválida.
    - `config reload skipped (invalid config):` → uma edição direta falhou na validação e foi ignorada pelo Gateway em execução.
    - `Invalid config at ...` → a inicialização falhou antes de os serviços do Gateway iniciarem.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` ou `size-drop-vs-last-good:*` → uma gravação de propriedade do OpenClaw foi rejeitada porque perdeu campos ou tamanho em comparação com o backup da última versão sabidamente boa.
    - `Config last-known-good promotion skipped` → o candidato continha placeholders de segredos redigidos, como `***`.

  </Accordion>
  <Accordion title="Opções de correção">
    1. Execute `openclaw doctor --fix` para permitir que o doctor repare a configuração com prefixo/sobrescrita ou restaure a última versão sabidamente boa.
    2. Copie apenas as chaves pretendidas de `.clobbered.*` ou `.rejected.*` e então aplique-as com `openclaw config set` ou `config.patch`.
    3. Execute `openclaw config validate` antes de reiniciar.
    4. Se você editar manualmente, mantenha a configuração JSON5 completa, não apenas o objeto parcial que queria alterar.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Config](/pt-BR/cli/config)
- [Configuração: recarregamento dinâmico](/pt-BR/gateway/configuration#config-hot-reload)
- [Configuração: validação estrita](/pt-BR/gateway/configuration#strict-validation)
- [Doctor](/pt-BR/gateway/doctor)

## Avisos de sondagem do Gateway

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

- `SSH tunnel failed to start; falling back to direct probes.` → a configuração de SSH falhou, mas o comando ainda tentou destinos diretos configurados/de loopback.
- `multiple reachable gateways detected` → mais de um destino respondeu. Geralmente isso significa uma configuração intencional com múltiplos gateways ou ouvintes obsoletos/duplicados.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → a conexão funcionou, mas o RPC de detalhes está limitado por escopo; pareie a identidade do dispositivo ou use credenciais com `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → a conexão funcionou, mas o conjunto completo de RPCs de diagnóstico expirou ou falhou. Trate isto como um Gateway alcançável com diagnósticos degradados; compare `connect.ok` e `connect.rpcOk` na saída `--json`.
- `Capability: pairing-pending` ou `gateway closed (1008): pairing required` → o Gateway respondeu, mas este cliente ainda precisa de pareamento/aprovação antes do acesso normal de operador.
- texto de aviso de SecretRef de `gateway.auth.*` / `gateway.remote.*` não resolvido → o material de autenticação não estava disponível neste caminho de comando para o destino com falha.

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
- Lista de permissões de grupos e requisitos de menção.
- Permissões/escopos ausentes da API do canal.

Assinaturas comuns:

- `mention required` → mensagem ignorada pela política de menção em grupo.
- `pairing` / rastros de aprovação pendente → remetente não está aprovado.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema de autenticação/permissões do canal.

Relacionado:

- [Solução de problemas de canais](/pt-BR/channels/troubleshooting)
- [Discord](/pt-BR/channels/discord)
- [Telegram](/pt-BR/channels/telegram)
- [WhatsApp](/pt-BR/channels/whatsapp)

## Entrega de Cron e Heartbeat

Se o cron ou heartbeat não executou ou não entregou, verifique primeiro o estado do agendador e depois o destino da entrega.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Procure por:

- Cron ativado e próxima ativação presente.
- Status do histórico de execução do job (`ok`, `skipped`, `error`).
- Motivos para pular Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Assinaturas comuns">
    - `cron: scheduler disabled; jobs will not run automatically` → cron desativado.
    - `cron: timer tick failed` → falha no tick do agendador; verifique erros de arquivo/log/runtime.
    - `heartbeat skipped` com `reason=quiet-hours` → fora da janela de horas ativas.
    - `heartbeat skipped` com `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe, mas contém apenas linhas em branco / cabeçalhos markdown, então o OpenClaw pula a chamada ao modelo.
    - `heartbeat skipped` com `reason=no-tasks-due` → `HEARTBEAT.md` contém um bloco `tasks:`, mas nenhuma das tarefas vence neste tick.
    - `heartbeat: unknown accountId` → id de conta inválido para o destino de entrega do heartbeat.
    - `heartbeat skipped` com `reason=dm-blocked` → o destino do heartbeat foi resolvido para um destino no estilo DM enquanto `agents.defaults.heartbeat.directPolicy` (ou substituição por agente) está definido como `block`.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Heartbeat](/pt-BR/gateway/heartbeat)
- [Tarefas agendadas](/pt-BR/automation/cron-jobs)
- [Tarefas agendadas: solução de problemas](/pt-BR/automation/cron-jobs#troubleshooting)

## Node pareado, ferramenta falha

Se um node estiver pareado, mas as ferramentas falharem, isole o estado de primeiro plano, permissão e aprovação.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Procure por:

- Node online com as capacidades esperadas.
- Concessões de permissão do SO para câmera/microfone/localização/tela.
- Aprovações de exec e estado da lista de permissões.

Assinaturas comuns:

- `NODE_BACKGROUND_UNAVAILABLE` → o aplicativo do node precisa estar em primeiro plano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permissão do SO ausente.
- `SYSTEM_RUN_DENIED: approval required` → aprovação de exec pendente.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado pela lista de permissões.

Relacionado:

- [Aprovações de exec](/pt-BR/tools/exec-approvals)
- [Solução de problemas de Node](/pt-BR/nodes/troubleshooting)
- [Nodes](/pt-BR/nodes/index)

## Ferramenta de navegador falha

Use isto quando ações da ferramenta de navegador falham mesmo que o gateway em si esteja íntegro.

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

<AccordionGroup>
  <Accordion title="Assinaturas de Plugin / executável">
    - `unknown command "browser"` ou `unknown command 'browser'` → o plugin de navegador incluído está excluído por `plugins.allow`.
    - ferramenta de navegador ausente / indisponível enquanto `browser.enabled=true` → `plugins.allow` exclui `browser`, então o plugin nunca foi carregado.
    - `Failed to start Chrome CDP on port` → falha ao iniciar o processo do navegador.
    - `browser.executablePath not found` → o caminho configurado é inválido.
    - `browser.cdpUrl must be http(s) or ws(s)` → a URL CDP configurada usa um esquema sem suporte, como `file:` ou `ftp:`.
    - `browser.cdpUrl has invalid port` → a URL CDP configurada tem uma porta incorreta ou fora do intervalo.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → a instalação atual do gateway não tem a dependência principal de runtime de navegador; reinstale ou atualize o OpenClaw e reinicie o gateway. Snapshots ARIA e capturas de tela básicas de páginas ainda podem funcionar, mas navegação, snapshots de IA, capturas de elementos com seletor CSS e exportação de PDF continuam indisponíveis.

  </Accordion>
  <Accordion title="Assinaturas de Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → o Chrome MCP existing-session ainda não conseguiu anexar ao diretório de dados do navegador selecionado. Abra a página de inspeção do navegador, ative a depuração remota, mantenha o navegador aberto, aprove o primeiro prompt de anexação e tente novamente. Se o estado autenticado não for necessário, prefira o perfil gerenciado `openclaw`.
    - `No Chrome tabs found for profile="user"` → o perfil de anexação do Chrome MCP não tem abas locais do Chrome abertas.
    - `Remote CDP for profile "<name>" is not reachable` → o endpoint CDP remoto configurado não está acessível a partir do host do gateway.
    - `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → o perfil somente anexação não tem alvo acessível, ou o endpoint HTTP respondeu, mas o WebSocket CDP ainda não pôde ser aberto.

  </Accordion>
  <Accordion title="Assinaturas de elemento / captura de tela / upload">
    - `fullPage is not supported for element screenshots` → a solicitação de captura de tela misturou `--full-page` com `--ref` ou `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → chamadas de captura de tela do Chrome MCP / `existing-session` devem usar captura de página ou um `--ref` de snapshot, não CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooks de upload do Chrome MCP precisam de refs de snapshot, não seletores CSS.
    - `existing-session file uploads currently support one file at a time.` → envie um upload por chamada em perfis Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → hooks de diálogo em perfis Chrome MCP não oferecem suporte a substituições de timeout.
    - `existing-session type does not support timeoutMs overrides.` → omita `timeoutMs` para `act:type` em perfis `profile="user"` / Chrome MCP existing-session, ou use um perfil de navegador gerenciado/CDP quando um timeout personalizado for necessário.
    - `existing-session evaluate does not support timeoutMs overrides.` → omita `timeoutMs` para `act:evaluate` em perfis `profile="user"` / Chrome MCP existing-session, ou use um perfil de navegador gerenciado/CDP quando um timeout personalizado for necessário.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` ainda requer um navegador gerenciado ou perfil CDP bruto.
    - substituições obsoletas de viewport / modo escuro / localidade / offline em perfis somente anexação ou CDP remoto → execute `openclaw browser stop --browser-profile <name>` para fechar a sessão de controle ativa e liberar o estado de emulação Playwright/CDP sem reiniciar todo o gateway.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Navegador (gerenciado pelo OpenClaw)](/pt-BR/tools/browser)
- [Solução de problemas do navegador no Linux](/pt-BR/tools/browser-linux-troubleshooting)

## Se você atualizou e algo quebrou de repente

A maioria das quebras pós-atualização é desvio de configuração ou padrões mais rígidos agora sendo aplicados.

<AccordionGroup>
  <Accordion title="1. O comportamento de autenticação e substituição de URL mudou">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    O que verificar:

    - Se `gateway.mode=remote`, as chamadas da CLI podem estar apontando para o remoto enquanto seu serviço local está funcionando.
    - Chamadas explícitas com `--url` não recorrem a credenciais armazenadas.

    Assinaturas comuns:

    - `gateway connect failed:` → destino de URL incorreto.
    - `unauthorized` → endpoint acessível, mas autenticação incorreta.

  </Accordion>
  <Accordion title="2. Proteções de bind e autenticação estão mais rígidas">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    O que verificar:

    - Binds não loopback (`lan`, `tailnet`, `custom`) precisam de um caminho válido de autenticação do gateway: autenticação com token/senha compartilhados ou uma implantação `trusted-proxy` não loopback configurada corretamente.
    - Chaves antigas como `gateway.token` não substituem `gateway.auth.token`.

    Assinaturas comuns:

    - `refusing to bind gateway ... without auth` → bind não loopback sem um caminho válido de autenticação do gateway.
    - `Connectivity probe: failed` enquanto o runtime está em execução → gateway ativo, mas inacessível com a autenticação/URL atual.

  </Accordion>
  <Accordion title="3. O estado de pareamento e identidade do dispositivo mudou">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    O que verificar:

    - Aprovações de dispositivo pendentes para dashboard/nodes.
    - Aprovações de pareamento por DM pendentes após mudanças de política ou identidade.

    Assinaturas comuns:

    - `device identity required` → autenticação do dispositivo não satisfeita.
    - `pairing required` → remetente/dispositivo deve ser aprovado.

  </Accordion>
</AccordionGroup>

Se a configuração do serviço e o runtime ainda divergirem após as verificações, reinstale os metadados do serviço a partir do mesmo diretório de perfil/estado:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Relacionado:

- [Autenticação](/pt-BR/gateway/authentication)
- [Exec em segundo plano e ferramenta de processo](/pt-BR/gateway/background-process)
- [Pareamento de propriedade do Gateway](/pt-BR/gateway/pairing)

## Relacionado

- [Doctor](/pt-BR/gateway/doctor)
- [FAQ](/pt-BR/help/faq)
- [Runbook do Gateway](/pt-BR/gateway)
