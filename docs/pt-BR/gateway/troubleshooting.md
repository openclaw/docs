---
read_when:
    - O hub de solução de problemas direcionou você para cá para um diagnóstico mais aprofundado
    - Você precisa de seções de runbook estáveis baseadas em sintomas com comandos exatos
sidebarTitle: Troubleshooting
summary: Runbook aprofundado de solução de problemas para Gateway, canais, automação, nós e navegador
title: Solução de problemas
x-i18n:
    generated_at: "2026-06-27T17:35:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ce8e8aed5c3e00be5b093875222962c22883472802e164534dae32adc5365c5
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Esta página é o runbook detalhado. Comece em [/help/troubleshooting](/pt-BR/help/troubleshooting) se quiser primeiro o fluxo rápido de triagem.

## Sequência de comandos

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
- `openclaw channels status --probe` mostra o status de transporte ativo por conta e, quando houver suporte, resultados de sondagem/auditoria como `works` ou `audit ok`.

## Depois de uma atualização

Use isto quando uma atualização termina, mas o Gateway está fora do ar, os canais estão vazios ou
as chamadas de modelo começam a falhar com 401.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Procure por:

- `Update restart` em `openclaw status` / `openclaw status --all`. Transferências pendentes ou
  com falha incluem o próximo comando a executar.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`
  em Channels. Isso significa que a configuração do canal ainda existe, mas o registro do plugin
  falhou antes que o canal pudesse ser carregado.
- 401s do provedor após nova autenticação. `openclaw doctor --fix` verifica sombras antigas
  de autenticação OAuth por agente e remove as cópias antigas para que todos os agentes resolvam
  o perfil compartilhado atual.

## Instalações split brain e proteção de configuração mais nova

Use isto quando um serviço de gateway para inesperadamente após uma atualização, ou os logs mostram que um binário `openclaw` é mais antigo que a versão que gravou `openclaw.json` pela última vez.

O OpenClaw marca gravações de configuração com `meta.lastTouchedVersion`. Comandos somente leitura ainda podem inspecionar uma configuração gravada por um OpenClaw mais novo, mas mutações de processo e serviço se recusam a continuar a partir de um binário mais antigo. Ações bloqueadas incluem iniciar, parar, reiniciar e desinstalar o serviço do gateway, reinstalação forçada do serviço, inicialização do gateway em modo de serviço e limpeza de porta com `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Corrigir PATH">
    Corrija `PATH` para que `openclaw` resolva para a instalação mais nova e, em seguida, execute novamente a ação.
  </Step>
  <Step title="Reinstalar o serviço do gateway">
    Reinstale o serviço de gateway pretendido a partir da instalação mais nova:

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
Apenas para downgrade intencional ou recuperação de emergência, defina `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` para o comando único. Deixe indefinido para operação normal.
</Warning>

## Incompatibilidade de protocolo após rollback

Use isto quando os logs continuam imprimindo `protocol mismatch` depois que você faz downgrade ou rollback do OpenClaw. Isso significa que um Gateway mais antigo está em execução, mas um processo de cliente local mais novo ainda está tentando se reconectar com um intervalo de protocolo que o Gateway mais antigo não consegue falar.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Procure por:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` nos logs do Gateway.
- `Established clients:` em `openclaw gateway status --deep` ou `Gateway clients` em `openclaw doctor --deep`. Isso lista clientes TCP ativos conectados à porta do Gateway, incluindo PIDs e linhas de comando quando o SO permite.
- Um processo de cliente cuja linha de comando aponta para a instalação ou wrapper mais novo do OpenClaw do qual você fez rollback.

Correção:

1. Pare ou reinicie o processo de cliente OpenClaw obsoleto mostrado por `gateway status --deep`.
2. Reinicie apps ou wrappers que incorporam o OpenClaw, como dashboards locais, editores, auxiliares de app-server ou shells `openclaw logs --follow` de longa duração.
3. Execute novamente `openclaw gateway status --deep` ou `openclaw doctor --deep` e confirme que o PID do cliente obsoleto desapareceu.

Não faça um Gateway mais antigo aceitar um protocolo incompatível mais novo. Aumentos de protocolo protegem o contrato de comunicação; a recuperação de rollback é um problema de limpeza de processo/versão.

## Symlink de Skill ignorado como escape de caminho

Use isto quando os logs incluírem:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

O OpenClaw trata cada raiz de skill como um limite de contenção. Um symlink em
`~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` ou
`~/.openclaw/skills` é ignorado quando seu alvo real resolve para fora dessa raiz,
a menos que o alvo seja explicitamente confiável.

Inspecione o link:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Se o alvo for intencional, configure tanto a raiz direta da skill quanto o
alvo de symlink permitido:

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

Em seguida, inicie uma nova sessão ou aguarde o watcher de skills atualizar. Reinicie o
gateway se o processo em execução for anterior à alteração de configuração.

Não use alvos amplos como `~`, `/` ou uma pasta inteira de projeto sincronizado.
Mantenha `allowSymlinkTargets` restrito à raiz real de skills que contém diretórios
`SKILL.md` confiáveis.

Se o apply do Skill Workshop também deve gravar por esses caminhos de skill de workspace
com symlink confiável, habilite `skills.workshop.allowSymlinkTargetWrites`. Mantenha-o
desabilitado para raízes de skills compartilhadas somente leitura.

Relacionado:

- [Configuração de Skills](/pt-BR/tools/skills-config#symlinked-skill-roots)
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 exige uso extra para contexto longo

Use isto quando logs/erros incluírem: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Procure por:

- O modelo Anthropic selecionado é um modelo Claude 4.x de 1M com capacidade GA, ou o modelo tem `params.context1m: true` legado.
- A credencial Anthropic atual não é qualificada para uso de contexto longo.
- As solicitações falham apenas em sessões/execuções de modelo longas que precisam do caminho de contexto de 1M.

Opções de correção:

<Steps>
  <Step title="Usar uma janela de contexto padrão">
    Troque para um modelo com janela padrão, ou remova `context1m` legado de uma
    configuração de modelo antiga que não tem capacidade GA para contexto de 1M.
  </Step>
  <Step title="Usar uma credencial qualificada">
    Use uma credencial Anthropic qualificada para solicitações de contexto longo, ou troque para uma chave de API Anthropic.
  </Step>
  <Step title="Configurar modelos de fallback">
    Configure modelos de fallback para que as execuções continuem quando solicitações Anthropic de contexto longo forem rejeitadas.
  </Step>
</Steps>

Relacionado:

- [Anthropic](/pt-BR/providers/anthropic)
- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Por que estou vendo HTTP 429 da Anthropic?](/pt-BR/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Respostas upstream 403 bloqueadas

Use isto quando um provedor LLM upstream retornar um `403` genérico, como
`Your request was blocked`.

Não presuma que isso é sempre um problema de configuração do OpenClaw. A resposta pode
vir de uma camada de segurança upstream, como CDN, WAF, regra de gerenciamento de bots ou
proxy reverso na frente de um endpoint compatível com OpenAI.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Procure por:

- vários modelos sob o mesmo provedor falhando da mesma forma
- HTML ou texto genérico de segurança em vez de um erro normal de API do provedor
- eventos de segurança do lado do provedor no mesmo horário da solicitação
- uma pequena sondagem direta com `curl` tendo sucesso enquanto solicitações normais no formato do SDK falham

Corrija primeiro a filtragem do lado do provedor quando as evidências apontarem para um bloqueio
de WAF/CDN. Prefira uma regra de permissão ou exceção com escopo estreito para o caminho de API que o OpenClaw
usa, e evite desabilitar a proteção para o site inteiro.

<Warning>
Um `curl` mínimo bem-sucedido não garante que solicitações reais no estilo do SDK
passarão pela mesma camada de segurança upstream.
</Warning>

Relacionado:

- [Endpoints compatíveis com OpenAI](/pt-BR/gateway/configuration-reference#openai-compatible-endpoints)
- [Configuração de provedor](/pt-BR/providers)
- [Logs](/pt-BR/logging)

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
- erros `model_not_found` ou 404 mesmo que `/v1/chat/completions` direto
  funcione com o mesmo id de modelo simples
- erros do backend sobre `messages[].content` esperando uma string
- avisos intermitentes `incomplete turn detected ... stopReason=stop payloads=0` com um backend local compatível com OpenAI
- falhas do backend que aparecem apenas com contagens maiores de tokens de prompt ou prompts completos de runtime de agente

<AccordionGroup>
  <Accordion title="Assinaturas comuns">
    - `model_not_found` com um servidor local no estilo MLX/vLLM → verifique se `baseUrl` inclui `/v1`, se `api` é `"openai-completions"` para backends `/v1/chat/completions` e se `models.providers.<provider>.models[].id` é o id local simples do provedor. Selecione-o com o prefixo do provedor uma vez, por exemplo `mlx/mlx-community/Qwen3-30B-A3B-6bit`; mantenha a entrada do catálogo como `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → o backend rejeita partes de conteúdo estruturado do Chat Completions. Correção: defina `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` ou chaves de mensagem permitidas como `["role","content"]` → o backend rejeita metadados de replay no estilo OpenAI em mensagens do Chat Completions. Correção: defina `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → o backend concluiu a solicitação Chat Completions, mas não retornou texto de assistente visível ao usuário para esse turno. O OpenClaw tenta novamente turnos vazios compatíveis com OpenAI e seguros para replay uma vez; falhas persistentes geralmente significam que o backend está emitindo conteúdo vazio/não textual ou suprimindo o texto da resposta final.
    - solicitações diretas pequenas têm sucesso, mas execuções de agente do OpenClaw falham com crashes de backend/modelo (por exemplo, Gemma em alguns builds `inferrs`) → o transporte do OpenClaw provavelmente já está correto; o backend está falhando no formato maior de prompt de runtime de agente.
    - falhas diminuem após desabilitar ferramentas, mas não desaparecem → os schemas de ferramentas faziam parte da pressão, mas o problema restante ainda é capacidade upstream do modelo/servidor ou um bug do backend.

  </Accordion>
  <Accordion title="Opções de correção">
    1. Defina `compat.requiresStringContent: true` para backends Chat Completions que aceitam apenas string.
    2. Defina `compat.strictMessageKeys: true` para backends Chat Completions estritos que só aceitam `role` e `content` em cada mensagem.
    3. Defina `compat.supportsTools: false` para modelos/backends que não conseguem lidar com a superfície de schema de ferramentas do OpenClaw de forma confiável.
    4. Reduza a pressão de prompt quando possível: bootstrap menor do workspace, histórico de sessão mais curto, modelo local mais leve ou um backend com suporte mais forte a contexto longo.
    5. Se solicitações diretas pequenas continuarem passando enquanto turnos de agente do OpenClaw ainda travam dentro do backend, trate isso como uma limitação upstream de servidor/modelo e registre uma reprodução lá com o formato de payload aceito.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Configuração](/pt-BR/gateway/configuration)
- [Modelos locais](/pt-BR/gateway/local-models)
- [Endpoints compatíveis com OpenAI](/pt-BR/gateway/configuration-reference#openai-compatible-endpoints)

## Sem respostas

Se os canais estiverem ativos, mas nada responder, verifique o roteamento e a política antes de reconectar qualquer coisa.

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
- `blocked` / `allowlist` → o remetente/canal foi filtrado pela política.

Relacionado:

- [Solução de problemas de canais](/pt-BR/channels/troubleshooting)
- [Grupos](/pt-BR/channels/groups)
- [Pareamento](/pt-BR/channels/pairing)

## Conectividade da IU de controle do painel

Quando o painel/IU de controle não conectar, valide a URL, o modo de autenticação e as premissas de contexto seguro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Procure por:

- URL de probe e URL do painel corretas.
- Incompatibilidade de modo/token de autenticação entre cliente e Gateway.
- Uso de HTTP onde identidade do dispositivo é necessária.

Se um navegador local não conseguir conectar a `127.0.0.1:18789` após uma atualização, primeiro
recupere o serviço local do Gateway e confirme que ele está servindo o painel:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

Se `curl` retornar HTML do OpenClaw, o Gateway está funcionando e o problema restante
provavelmente é cache do navegador, um link profundo antigo ou estado obsoleto de aba. Abra
`http://127.0.0.1:18789` diretamente e navegue a partir do painel. Se a reinicialização
não deixar o serviço em execução, execute `openclaw gateway start` e verifique novamente
`openclaw gateway status`.

<AccordionGroup>
  <Accordion title="Assinaturas de conexão / autenticação">
    - `device identity required` → contexto não seguro ou autenticação de dispositivo ausente.
    - `origin not allowed` → o `Origin` do navegador não está em `gateway.controlUi.allowedOrigins` (ou você está conectando de uma origem de navegador que não é loopback sem uma allowlist explícita).
    - `device nonce required` / `device nonce mismatch` → o cliente não está concluindo o fluxo de autenticação de dispositivo baseado em desafio (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → o cliente assinou o payload errado (ou um timestamp obsoleto) para o handshake atual.
    - `AUTH_TOKEN_MISMATCH` com `canRetryWithDeviceToken=true` → o cliente pode fazer uma nova tentativa confiável com token de dispositivo em cache.
    - Essa nova tentativa com token em cache reutiliza o conjunto de escopos em cache armazenado com o token de dispositivo pareado. Chamadores com `deviceToken` explícito / `scopes` explícitos mantêm o conjunto de escopos solicitado.
    - `AUTH_SCOPE_MISMATCH` → o token de dispositivo foi reconhecido, mas seus escopos aprovados não cobrem esta solicitação de conexão; repareie ou aprove o contrato de escopo solicitado em vez de rotacionar um token compartilhado de Gateway.
    - Fora desse caminho de nova tentativa, a precedência da autenticação de conexão é primeiro token/senha compartilhado explícito, depois `deviceToken` explícito, depois token de dispositivo armazenado e, por fim, token de bootstrap.
    - No caminho assíncrono da IU de controle do Tailscale Serve, tentativas com falha para o mesmo `{scope, ip}` são serializadas antes que o limitador registre a falha. Duas novas tentativas ruins simultâneas do mesmo cliente podem, portanto, exibir `retry later` na segunda tentativa em vez de duas incompatibilidades simples.
    - `too many failed authentication attempts (retry later)` de um cliente loopback com origem de navegador → falhas repetidas dessa mesma `Origin` normalizada são bloqueadas temporariamente; outra origem localhost usa um bucket separado.
    - `unauthorized` repetido após essa nova tentativa → divergência de token compartilhado/token de dispositivo; atualize a configuração de token e reaprove/rotacione o token de dispositivo se necessário.
    - `gateway connect failed:` → alvo de host/porta/url incorreto.

  </Accordion>
</AccordionGroup>

### Mapa rápido de códigos de detalhe de autenticação

Use `error.details.code` da resposta `connect` com falha para escolher a próxima ação:

| Código de detalhe            | Significado                                                                                                                                                                                  | Ação recomendada                                                                                                                                                                                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | O cliente não enviou um token compartilhado obrigatório.                                                                                                                                     | Cole/defina o token no cliente e tente novamente. Para caminhos do painel: `openclaw config get gateway.auth.token` e então cole nas configurações da IU de controle.                                                                                                                   |
| `AUTH_TOKEN_MISMATCH`        | O token compartilhado não correspondeu ao token de autenticação do Gateway.                                                                                                                   | Se `canRetryWithDeviceToken=true`, permita uma nova tentativa confiável. Novas tentativas com token em cache reutilizam escopos aprovados armazenados; chamadores com `deviceToken` / `scopes` explícitos mantêm os escopos solicitados. Se ainda falhar, execute a [lista de recuperação de divergência de token](/pt-BR/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | O token por dispositivo em cache está obsoleto ou revogado.                                                                                                                                  | Rotacione/reaprove o token de dispositivo usando a [CLI de dispositivos](/pt-BR/cli/devices), depois reconecte.                                                                                                                                                                                |
| `AUTH_SCOPE_MISMATCH`        | O token de dispositivo é válido, mas sua função/escopos aprovados não cobrem esta solicitação de conexão.                                                                                    | Repareie o dispositivo ou aprove o contrato de escopo solicitado; não trate isso como divergência de token compartilhado.                                                                                                                                                                |
| `PAIRING_REQUIRED`           | A identidade do dispositivo precisa de aprovação. Verifique `error.details.reason` para `not-paired`, `scope-upgrade`, `role-upgrade` ou `metadata-upgrade`, e use `requestId` / `remediationHint` quando presentes. | Aprove a solicitação pendente: `openclaw devices list` e depois `openclaw devices approve <requestId>`. Upgrades de escopo/função usam o mesmo fluxo depois que você revisar o acesso solicitado.                                                                                       |

<Note>
RPCs diretos de backend por loopback autenticados com o token/senha compartilhado do Gateway não devem depender da linha de base de escopo de dispositivo pareado da CLI. Se subagentes ou outras chamadas internas ainda falharem com `scope-upgrade`, verifique se o chamador está usando `client.id: "gateway-client"` e `client.mode: "backend"` e não está forçando um `deviceIdentity` explícito ou token de dispositivo.
</Note>

Verificação de migração de autenticação de dispositivo v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Se os logs mostrarem erros de nonce/assinatura, atualize o cliente que está conectando e verifique:

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
- `openclaw devices rotate --scope ...` só pode solicitar escopos de operador que a sessão do chamador já possui

Relacionado:

- [Configuração](/pt-BR/gateway/configuration) (modos de autenticação do Gateway)
- [IU de controle](/pt-BR/web/control-ui)
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
- Incompatibilidade de configuração de serviço (`Config (cli)` vs `Config (service)`).
- Conflitos de porta/listener.
- Instalações extras de launchd/systemd/schtasks quando `--deep` é usado.
- Dicas de limpeza de `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Assinaturas comuns">
    - `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → o modo de Gateway local não está habilitado, ou o arquivo de configuração foi sobrescrito e perdeu `gateway.mode`. Correção: defina `gateway.mode="local"` na sua configuração, ou execute novamente `openclaw onboard --mode local` / `openclaw setup` para remarcar a configuração esperada de modo local. Se você estiver executando o OpenClaw via Podman, o caminho padrão da configuração é `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → bind que não é loopback sem um caminho válido de autenticação do Gateway (token/senha, ou proxy confiável quando configurado).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflito de porta.
    - `Other gateway-like services detected (best effort)` → existem unidades launchd/systemd/schtasks obsoletas ou paralelas. A maioria das configurações deve manter um Gateway por máquina; se você precisar de mais de um, isole portas + configuração/estado/workspace. Veja [/gateway#multiple-gateways-same-host](/pt-BR/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` do doctor → existe uma unidade de sistema systemd enquanto o serviço de usuário está ausente. Remova ou desabilite a duplicata antes de permitir que o doctor instale um serviço de usuário, ou defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` se a unidade de sistema for o supervisor pretendido.
    - `Gateway service port does not match current gateway config` → o supervisor instalado ainda fixa o `--port` antigo. Execute `openclaw doctor --fix` ou `openclaw gateway install --force`, depois reinicie o serviço do Gateway.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Execução em segundo plano e ferramenta de processo](/pt-BR/gateway/background-process)
- [Configuração](/pt-BR/gateway/configuration)
- [Doctor](/pt-BR/gateway/doctor)

## Gateway do macOS para de responder silenciosamente e depois retoma quando você toca no painel

Use isto quando canais (Telegram, WhatsApp etc.) em um host macOS ficam silenciosos por minutos a horas de cada vez, e o Gateway parece voltar no momento em que você abre a IU de controle, acessa via SSH ou interage de outra forma com o host. Normalmente não há sintoma óbvio em `openclaw status` porque, quando você verifica, o Gateway já está ativo novamente.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Procure por:

- Um ou mais pacotes `*-uncaught_exception.json` em `~/.openclaw/logs/stability/` com `error.code` definido como um código de rede transitório, como `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` ou `ECONNREFUSED`.
- Linhas de `pmset -g log` como `Entering Sleep state due to 'Maintenance Sleep'` ou `en0 driver is slow (msg: WillChangeState to 0)` alinhadas com os carimbos de data/hora da falha. Power Nap / Maintenance Sleep coloca brevemente o driver de Wi-Fi no estado 0; qualquer `connect()` de saída que caia nessa janela pode falhar com `ENETDOWN`, mesmo em um host que, de outra forma, tem conectividade de rede completa.
- Saída de `launchctl print` mostrando `state = not running` com várias `runs` recentes e um código de saída, especialmente quando o intervalo entre a falha e a próxima inicialização é da ordem de uma hora, em vez de segundos. O launchd do macOS aplica uma barreira de proteção de respawn não documentada após uma rajada de falhas que pode parar de honrar `KeepAlive=true` até que um gatilho externo, como login interativo, conexão do dashboard ou `launchctl kickstart`, a rearme.

Assinaturas comuns:

- Um pacote de estabilidade cujo `error.code` é `ENETDOWN` ou um código semelhante, com a pilha de chamadas apontando para Node `net` `lookupAndConnect` / `Socket.connect`. O OpenClaw `2026.5.26` e versões mais recentes classificam isso como erros de rede transitórios benignos, então eles não são mais propagados para o manipulador de exceções não capturadas de nível superior; se você estiver em uma versão mais antiga, atualize primeiro.
- Longos períodos silenciosos que terminam no instante em que você se conecta à Control UI ou acessa o host por SSH: a atividade visível para o usuário é o que rearma a barreira de respawn do launchd, não algo que o dashboard faz com o Gateway.
- Contagem de `runs` aumentando ao longo do dia sem uma linha correspondente `received SIG*; shutting down` em `~/Library/Logs/openclaw/gateway.log`: desligamentos limpos registram um sinal; falhas transitórias não.

O que fazer:

1. **Atualize o Gateway** se você estiver executando uma versão anterior a `2026.5.26`. Após a atualização, erros futuros `ENETDOWN` serão registrados como avisos, em vez de encerrar o processo.
2. **Reduza a atividade de manutenção durante o repouso** em hosts Mac mini / desktop destinados a funcionar como servidores sempre ativos:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Isso reduz significativamente, mas não elimina por completo, a oscilação subjacente do driver. O sistema ainda pode executar alguns repousos de manutenção para TCP keepalive e manutenção de mDNS, independentemente dessas flags.

3. **Adicione um watchdog de vivacidade** para que uma futura rajada de falhas estacionada pelo launchd seja detectada rapidamente:

   ```bash
   # Example launchd-aware liveness check, suitable for a 5-minute cron or LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   O objetivo é rearmar externamente a barreira de respawn; `KeepAlive=true` sozinho não é suficiente no macOS após uma rajada de falhas.

Relacionado:

- [Notas da plataforma macOS](/pt-BR/platforms/macos)
- [Registro de logs](/pt-BR/logging)
- [Doctor](/pt-BR/gateway/doctor)

## Gateway sai durante alto uso de memória

Use isto quando o Gateway desaparecer sob carga, o supervisor relatar uma reinicialização no estilo OOM, ou os logs mencionarem `critical memory pressure bundle written`.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Procure por:

- `Reason: diagnostic.memory.pressure.critical` no pacote de estabilidade mais recente.
- `Memory pressure:` com `critical/rss_threshold`, `critical/heap_threshold` ou `critical/rss_growth`.
- Valores de `V8 heap:` próximos ao limite de heap.
- Entradas de `Largest session files:`, como `agents/<agent>/sessions/<session>.jsonl` ou `sessions/<session>.jsonl`.
- Contadores de memória de cgroup do Linux quando o Gateway é executado dentro de um contêiner ou serviço com limite de memória.

Assinaturas comuns:

- `critical memory pressure bundle written` aparece pouco antes da reinicialização → o OpenClaw capturou um pacote de estabilidade pré-OOM. Inspecione-o com `openclaw gateway stability --bundle latest`.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` aparece nos logs do Gateway → o OpenClaw detectou pressão de memória crítica, mas o snapshot de estabilidade pré-OOM está desativado.
- `Largest session files:` aponta para um caminho de transcrição redigida muito grande → reduza o histórico de sessões retido, inspecione o crescimento da sessão ou mova transcrições antigas para fora do armazenamento ativo antes de reiniciar.
- Bytes usados de `V8 heap:` estão próximos ao limite de heap → reduza a pressão de prompts/sessões, reduza o trabalho concorrente ou aumente o limite de heap do Node somente após confirmar que a carga de trabalho é esperada.
- `Memory pressure: critical/rss_growth` → a memória cresceu rapidamente dentro de uma janela de amostragem. Verifique os logs mais recentes em busca de uma importação grande, saída de ferramenta descontrolada, novas tentativas repetidas ou um lote de trabalho de agentes enfileirado.
- Pressão de memória crítica aparece nos logs, mas não existe pacote → esse é o padrão. Defina `diagnostics.memoryPressureSnapshot: true` para capturar o pacote de estabilidade pré-OOM em eventos futuros de pressão de memória crítica.

O pacote de estabilidade não contém payloads. Ele inclui evidências operacionais de memória e caminhos relativos de arquivos redigidos, não texto de mensagens, corpos de webhook, credenciais, tokens, cookies ou ids brutos de sessão. Anexe a exportação de diagnósticos a relatórios de bug em vez de copiar logs brutos.

Relacionado:

- [Saúde do Gateway](/pt-BR/gateway/health)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
- [Sessões](/pt-BR/cli/sessions)

## Gateway rejeitou configuração inválida

Use isto quando a inicialização do Gateway falhar com `Invalid config` ou os logs de hot reload disserem
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
- O OpenClaw mantém os 32 arquivos `.clobbered.*` mais recentes para cada caminho de configuração e alterna os mais antigos

<AccordionGroup>
  <Accordion title="O que aconteceu">
    - A configuração não foi validada durante a inicialização, o hot reload ou uma escrita pertencente ao OpenClaw.
    - A inicialização do Gateway falha de forma fechada em vez de reescrever `openclaw.json`.
    - O hot reload ignora edições externas inválidas e mantém a configuração de runtime atual ativa.
    - Escritas pertencentes ao OpenClaw rejeitam payloads inválidos/destrutivos antes do commit e salvam `.rejected.*`.
    - `openclaw doctor --fix` é responsável pelo reparo. Ele pode remover prefixos não JSON ou restaurar a última cópia reconhecidamente boa, preservando o payload rejeitado como `.clobbered.*`.
    - Quando muitos reparos acontecem para um caminho de configuração, o OpenClaw alterna arquivos `.clobbered.*` mais antigos para que o payload reparado mais recente ainda fique disponível.

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
    - `.rejected.*` existe → uma escrita de configuração pertencente ao OpenClaw falhou nas verificações de schema ou sobrescrita antes do commit.
    - `Config write rejected:` → a escrita tentou remover a forma exigida, reduzir o arquivo de forma brusca ou persistir uma configuração inválida.
    - `config reload skipped (invalid config):` → uma edição direta falhou na validação e foi ignorada pelo Gateway em execução.
    - `Invalid config at ...` → a inicialização falhou antes que os serviços do Gateway fossem iniciados.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` ou `size-drop-vs-last-good:*` → uma escrita pertencente ao OpenClaw foi rejeitada porque perdeu campos ou tamanho em comparação com o backup reconhecidamente bom mais recente.
    - `Config last-known-good promotion skipped` → o candidato continha placeholders de segredo redigidos, como `***`.

  </Accordion>
  <Accordion title="Opções de correção">
    1. Execute `openclaw doctor --fix` para deixar o doctor reparar uma configuração prefixada/sobrescrita ou restaurar a última configuração reconhecidamente boa.
    2. Copie apenas as chaves pretendidas de `.clobbered.*` ou `.rejected.*` e aplique-as com `openclaw config set` ou `config.patch`.
    3. Execute `openclaw config validate` antes de reiniciar.
    4. Se você editar manualmente, mantenha a configuração JSON5 completa, não apenas o objeto parcial que queria alterar.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Configuração](/pt-BR/cli/config)
- [Configuração: hot reload](/pt-BR/gateway/configuration#config-hot-reload)
- [Configuração: validação estrita](/pt-BR/gateway/configuration#strict-validation)
- [Doctor](/pt-BR/gateway/doctor)

## Avisos de probe do Gateway

Use isto quando `openclaw gateway probe` alcançar algo, mas ainda imprimir um bloco de aviso.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Procure por:

- `warnings[].code` e `primaryTargetId` na saída JSON.
- Se o aviso é sobre fallback de SSH, múltiplos gateways, escopos ausentes ou referências de autenticação não resolvidas.

Assinaturas comuns:

- `SSH tunnel failed to start; falling back to direct probes.` → a configuração de SSH falhou, mas o comando ainda tentou alvos diretos configurados/de loopback.
- `multiple reachable gateway identities detected` → gateways distintos responderam, ou o OpenClaw não conseguiu provar que os alvos alcançáveis são o mesmo Gateway. Um túnel SSH, URL de proxy ou URL remota configurada para o mesmo Gateway é tratado como um Gateway com vários transportes, mesmo quando as portas de transporte diferem.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → a conexão funcionou, mas o RPC de detalhes é limitado por escopo; emparelhe a identidade do dispositivo ou use credenciais com `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → a conexão funcionou, mas o conjunto completo de RPCs de diagnóstico atingiu timeout ou falhou. Trate isso como um Gateway alcançável com diagnósticos degradados; compare `connect.ok` e `connect.rpcOk` na saída de `--json`.
- `Capability: pairing-pending` ou `gateway closed (1008): pairing required` → o Gateway respondeu, mas este cliente ainda precisa de emparelhamento/aprovação antes do acesso normal de operador.
- texto de aviso de SecretRef `gateway.auth.*` / `gateway.remote.*` não resolvido → o material de autenticação estava indisponível neste caminho de comando para o alvo com falha.

Relacionado:

- [Gateway](/pt-BR/cli/gateway)
- [Múltiplos gateways no mesmo host](/pt-BR/gateway#multiple-gateways-same-host)
- [Acesso remoto](/pt-BR/gateway/remote)

## Canal conectado, mensagens não fluem

Se o estado do canal está conectado, mas o fluxo de mensagens está parado, concentre-se em política, permissões e regras de entrega específicas do canal.

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

- `mention required` → mensagem ignorada pela política de menção do grupo.
- Rastros de `pairing` / aprovação pendente → o remetente não está aprovado.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema de autenticação/permissões do canal.

Relacionado:

- [Solução de problemas de canais](/pt-BR/channels/troubleshooting)
- [Discord](/pt-BR/channels/discord)
- [Telegram](/pt-BR/channels/telegram)
- [WhatsApp](/pt-BR/channels/whatsapp)

## Entrega de Cron e Heartbeat

Se Cron ou Heartbeat não executou ou não entregou, verifique primeiro o estado do agendador e depois o alvo de entrega.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Procure por:

- Cron habilitado e próximo despertar presente.
- Status do histórico de execução do job (`ok`, `skipped`, `error`).
- Motivos de pular Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Assinaturas comuns">
    - `cron: scheduler disabled; jobs will not run automatically` → cron desabilitado.
    - `cron: timer tick failed` → tick do agendador falhou; verifique erros de arquivo/log/runtime.
    - `heartbeat skipped` com `reason=quiet-hours` → fora da janela de horas ativas.
    - `heartbeat skipped` com `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe, mas contém apenas estruturas vazias de linha em branco, comentário, cabeçalho, fence ou checklist vazia, então o OpenClaw pula a chamada ao modelo.
    - `heartbeat skipped` com `reason=no-tasks-due` → `HEARTBEAT.md` contém um bloco `tasks:`, mas nenhuma tarefa está vencida neste tick.
    - `heartbeat: unknown accountId` → id de conta inválido para o destino de entrega do Heartbeat.
    - `heartbeat skipped` com `reason=dm-blocked` → o destino do Heartbeat foi resolvido para um destino no estilo DM enquanto `agents.defaults.heartbeat.directPolicy` (ou a substituição por agente) está definido como `block`.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Heartbeat](/pt-BR/gateway/heartbeat)
- [Tarefas agendadas](/pt-BR/automation/cron-jobs)
- [Tarefas agendadas: solução de problemas](/pt-BR/automation/cron-jobs#troubleshooting)

## Nó pareado, ferramenta falha

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
- Concessões de permissão do SO para câmera/microfone/localização/tela.
- Aprovações de exec e estado da lista de permissões.

Assinaturas comuns:

- `NODE_BACKGROUND_UNAVAILABLE` → o app do nó deve estar em primeiro plano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permissão do SO ausente.
- `SYSTEM_RUN_DENIED: approval required` → aprovação de exec pendente.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado pela lista de permissões.

Relacionado:

- [Aprovações de exec](/pt-BR/tools/exec-approvals)
- [Solução de problemas de nós](/pt-BR/nodes/troubleshooting)
- [Nós](/pt-BR/nodes/index)

## Ferramenta de navegador falha

Use isto quando as ações da ferramenta de navegador falharem, mesmo que o Gateway em si esteja íntegro.

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
    - `unknown command "browser"` ou `unknown command 'browser'` → o Plugin de navegador incluído foi excluído por `plugins.allow`.
    - ferramenta de navegador ausente / indisponível enquanto `browser.enabled=true` → `plugins.allow` exclui `browser`, então o Plugin nunca foi carregado.
    - `Failed to start Chrome CDP on port` → falha ao iniciar o processo do navegador.
    - `browser.executablePath not found` → o caminho configurado é inválido.
    - `browser.cdpUrl must be http(s) or ws(s)` → a URL CDP configurada usa um esquema sem suporte, como `file:` ou `ftp:`.
    - `browser.cdpUrl has invalid port` → a URL CDP configurada tem uma porta inválida ou fora do intervalo.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → a instalação atual do Gateway não tem a dependência central de runtime do navegador; reinstale ou atualize o OpenClaw e reinicie o Gateway. Snapshots ARIA e capturas de tela básicas de páginas ainda podem funcionar, mas navegação, snapshots de IA, capturas de tela de elementos por seletor CSS e exportação para PDF permanecem indisponíveis.

  </Accordion>
  <Accordion title="Assinaturas de Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → a existing-session do Chrome MCP ainda não conseguiu anexar ao diretório de dados do navegador selecionado. Abra a página de inspeção do navegador, habilite a depuração remota, mantenha o navegador aberto, aprove o primeiro prompt de anexação e tente novamente. Se o estado de login não for necessário, prefira o perfil gerenciado `openclaw`.
    - `No Chrome tabs found for profile="user"` → o perfil de anexação do Chrome MCP não tem abas locais do Chrome abertas.
    - `Remote CDP for profile "<name>" is not reachable` → o endpoint CDP remoto configurado não está acessível a partir do host do Gateway.
    - `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → o perfil somente anexação não tem um alvo acessível, ou o endpoint HTTP respondeu, mas ainda assim não foi possível abrir o WebSocket CDP.

  </Accordion>
  <Accordion title="Assinaturas de elemento / captura de tela / upload">
    - `fullPage is not supported for element screenshots` → a solicitação de captura de tela misturou `--full-page` com `--ref` ou `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → chamadas de captura de tela do Chrome MCP / `existing-session` devem usar captura de página ou uma `--ref` de snapshot, não `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooks de upload do Chrome MCP precisam de refs de snapshot, não seletores CSS.
    - `existing-session file uploads currently support one file at a time.` → envie um upload por chamada em perfis Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → hooks de diálogo em perfis Chrome MCP não aceitam substituições de timeout.
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

A maioria das quebras pós-atualização é desvio de configuração ou padrões mais rígidos sendo aplicados agora.

<AccordionGroup>
  <Accordion title="1. O comportamento de auth e substituição de URL mudou">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    O que verificar:

    - Se `gateway.mode=remote`, chamadas da CLI podem estar apontando para remoto enquanto seu serviço local está íntegro.
    - Chamadas explícitas com `--url` não recorrem a credenciais armazenadas.

    Assinaturas comuns:

    - `gateway connect failed:` → destino de URL errado.
    - `unauthorized` → endpoint acessível, mas auth incorreto.

  </Accordion>
  <Accordion title="2. Bind e proteções de auth estão mais rígidos">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    O que verificar:

    - Binds não loopback (`lan`, `tailnet`, `custom`) precisam de um caminho de auth do Gateway válido: auth por token/senha compartilhado ou uma implantação `trusted-proxy` não loopback configurada corretamente.
    - Chaves antigas como `gateway.token` não substituem `gateway.auth.token`.

    Assinaturas comuns:

    - `refusing to bind gateway ... without auth` → bind não loopback sem um caminho de auth do Gateway válido.
    - `Connectivity probe: failed` enquanto o runtime está em execução → Gateway ativo, mas inacessível com o auth/url atual.

  </Accordion>
  <Accordion title="3. O estado de pareamento e identidade do dispositivo mudou">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    O que verificar:

    - Aprovações de dispositivo pendentes para dashboard/nós.
    - Aprovações de pareamento DM pendentes após mudanças de política ou identidade.

    Assinaturas comuns:

    - `device identity required` → auth do dispositivo não satisfeito.
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
