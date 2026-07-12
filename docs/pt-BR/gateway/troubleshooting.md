---
read_when:
    - A central de solução de problemas direcionou você para cá para um diagnóstico mais aprofundado
    - Você precisa de seções estáveis de runbook baseadas em sintomas, com comandos exatos
sidebarTitle: Troubleshooting
summary: Guia aprofundado de solução de problemas para Gateway, canais, automação, Nodes e navegador
title: Solução de problemas
x-i18n:
    generated_at: "2026-07-12T15:16:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f53064a0d42e601ec1a1904fc9d0e8ebb9def7a2fb9d2579c7f10ca675b8f7fd
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Este é o runbook detalhado. Comece por [/help/troubleshooting](/pt-BR/help/troubleshooting) para seguir primeiro o fluxo rápido de triagem.

## Sequência de comandos

Execute nesta ordem:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sinais de funcionamento normal:

- `openclaw gateway status` mostra `Runtime: running`, `Connectivity probe: ok` e uma linha `Capability: ...`.
- `openclaw doctor` não relata problemas impeditivos de configuração ou serviço.
- `openclaw channels status --probe` mostra o status atual do transporte por conta e, quando houver suporte, `works` ou `audit ok`.

## Após uma atualização

Use quando uma atualização terminar, mas o Gateway estiver inativo, os canais estiverem vazios ou as chamadas de modelo falharem com erros 401.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Procure por:

- `Update restart` em `openclaw status` / `openclaw status --all`. Transferências pendentes ou com falha incluem o próximo comando a ser executado.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` em Canais: a configuração do canal ainda existe, mas o registro do plugin falhou antes que o canal pudesse ser carregado.
- Erros 401 do provedor após uma nova autenticação: `openclaw doctor --fix` verifica se há cópias obsoletas de autenticação OAuth por agente que estejam ocultando a autenticação atual e remove as cópias antigas para que todos os agentes resolvam o perfil compartilhado atual.

## Instalações divergentes e proteção contra configurações mais recentes

Use quando um serviço do Gateway parar inesperadamente após uma atualização ou quando os logs mostrarem que um binário `openclaw` é mais antigo do que a versão que gravou `openclaw.json` pela última vez.

O OpenClaw marca as gravações de configuração com `meta.lastTouchedVersion`. Comandos somente leitura podem inspecionar uma configuração gravada por uma versão mais recente do OpenClaw, mas mutações de processos e serviços se recusam a ser executadas por um binário mais antigo. Ações bloqueadas: iniciar/parar/reiniciar/desinstalar o serviço do Gateway, reinstalação forçada do serviço, inicialização do Gateway no modo de serviço e limpeza de porta com `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Corrija o PATH">
    Corrija o `PATH` para que `openclaw` seja resolvido para a instalação mais recente e execute a ação novamente.
  </Step>
  <Step title="Reinstale o serviço do Gateway">
    Reinstale o serviço pretendido do Gateway usando a instalação mais recente:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remova wrappers obsoletos">
    Remova entradas obsoletas de pacotes do sistema ou wrappers antigos que ainda apontem para um binário `openclaw` antigo.
  </Step>
</Steps>

<Warning>
Somente para downgrade intencional ou recuperação de emergência, defina `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` para o comando específico. Mantenha essa variável não definida durante a operação normal.
</Warning>

## Incompatibilidade de protocolo após reversão

Use quando os logs continuarem exibindo `protocol mismatch` após um downgrade ou uma reversão. Um Gateway mais antigo está em execução, mas um processo cliente local mais recente ainda está tentando se reconectar com um intervalo de protocolo que o Gateway mais antigo não consegue usar.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Procure por:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` nos logs do Gateway.
- `Established clients:` em `openclaw gateway status --deep` ou `Gateway clients` em `openclaw doctor --deep`: clientes TCP ativos conectados à porta do Gateway, com PIDs e linhas de comando quando o sistema operacional permitir.
- Um processo cliente cuja linha de comando aponte para a instalação ou o wrapper mais recente do OpenClaw a partir do qual você fez a reversão.

Correção:

1. Pare ou reinicie o processo cliente obsoleto do OpenClaw exibido por `gateway status --deep`.
2. Reinicie aplicativos ou wrappers que incorporem o OpenClaw: painéis locais, editores, auxiliares de servidores de aplicativos ou shells de longa duração com `openclaw logs --follow`.
3. Execute novamente `openclaw gateway status --deep` ou `openclaw doctor --deep` e confirme que o PID do cliente obsoleto desapareceu.

Não faça um Gateway mais antigo aceitar um protocolo mais recente e incompatível. Os incrementos de versão do protocolo protegem o contrato de comunicação; a recuperação após reversão é um problema de limpeza de processos e versões.

## Link simbólico de Skill ignorado por escapar do caminho

Use quando os logs incluírem:

```text
Ignorando caminho de Skill que escapou de sua raiz configurada: ... reason=symlink-escape
```

Cada raiz de Skill é um limite de contenção. Um link simbólico em `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` ou `~/.openclaw/skills` é ignorado quando seu destino real é resolvido fora dessa raiz, a menos que o destino seja explicitamente confiável.

Inspecione o link:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Se o destino for intencional, configure tanto a raiz direta de Skills quanto o destino permitido do link simbólico:

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

Em seguida, inicie uma nova sessão ou aguarde a atualização do monitor de Skills. Reinicie o Gateway se o processo em execução for anterior à alteração da configuração.

Não use destinos abrangentes, como `~`, `/` ou uma pasta inteira de projeto sincronizado. Restrinja `allowSymlinkTargets` à raiz real de Skills que contém diretórios `SKILL.md` confiáveis.

Se a aplicação do Skill Workshop também precisar gravar por meio desses caminhos confiáveis de Skills do espaço de trabalho vinculados simbolicamente, ative `skills.workshop.allowSymlinkTargetWrites`. Mantenha essa opção desativada para raízes compartilhadas de Skills somente leitura.

Relacionado:

- [Configuração de Skills](/pt-BR/tools/skills-config#symlinked-skill-roots)
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Uso adicional exigido pelo erro 429 da Anthropic para contexto longo

Use quando os logs ou erros incluírem: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Procure por:

- O modelo Anthropic selecionado é um modelo Claude 4.x com disponibilidade geral e capacidade para 1M (Opus 4.6/4.7/4.8, Sonnet 4.6), ou a configuração do modelo ainda contém o parâmetro legado `params.context1m: true`.
- A credencial atual da Anthropic não está qualificada para uso de contexto longo.
- As solicitações falham somente em sessões longas ou execuções de modelos que precisam do caminho de contexto de 1M.

Opções de correção:

<Steps>
  <Step title="Use uma janela de contexto padrão">
    Mude para um modelo com janela padrão ou remova o `context1m` legado de uma
    configuração de modelo antiga que não tenha disponibilidade geral para contexto de 1M.
  </Step>
  <Step title="Use uma credencial qualificada">
    Use uma credencial da Anthropic qualificada para solicitações de contexto longo ou mude para uma chave de API da Anthropic.
  </Step>
  <Step title="Configure modelos alternativos">
    Configure modelos alternativos para que as execuções continuem quando as solicitações de contexto longo da Anthropic forem rejeitadas.
  </Step>
</Steps>

Relacionado:

- [Anthropic](/pt-BR/providers/anthropic)
- [Uso e custos de tokens](/pt-BR/reference/token-use)
- [Por que estou recebendo HTTP 429 da Anthropic?](/pt-BR/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Respostas 403 bloqueadas pelo serviço upstream

Use quando um provedor upstream de LLM retornar um erro `403` genérico, como `Your request was blocked`.

Não presuma que isso seja sempre um problema de configuração do OpenClaw. A resposta pode vir de uma camada de segurança upstream, como uma CDN, WAF, regra de gerenciamento de bots ou proxy reverso diante de um endpoint compatível com OpenAI.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Procure por:

- Vários modelos do mesmo provedor falhando da mesma maneira.
- HTML ou texto genérico de segurança em vez de um erro normal da API do provedor.
- Eventos de segurança do lado do provedor correspondentes ao mesmo horário da solicitação.
- Uma pequena sondagem direta com `curl` funcionando enquanto solicitações normais no formato do SDK falham.

Corrija primeiro a filtragem do lado do provedor quando as evidências apontarem para um bloqueio de WAF/CDN. Prefira uma regra de permissão ou de desvio com escopo restrito ao caminho da API usado pelo OpenClaw e evite desativar a proteção de todo o site.

<Warning>
Um `curl` mínimo bem-sucedido não garante que solicitações reais no estilo do SDK passem pela mesma camada de segurança upstream.
</Warning>

Relacionado:

- [Endpoints compatíveis com OpenAI](/pt-BR/gateway/configuration-reference#openai-compatible-endpoints)
- [Configuração de provedores](/pt-BR/providers)
- [Logs](/pt-BR/logging)

## Backend local compatível com OpenAI passa em sondagens diretas, mas as execuções do agente falham

Use quando:

- `curl ... /v1/models` funciona.
- Chamadas diretas pequenas para `/v1/chat/completions` funcionam.
- As execuções de modelos do OpenClaw falham somente em interações normais do agente.

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Procure por:

- Chamadas diretas pequenas funcionam, mas as execuções do OpenClaw falham somente com prompts maiores.
- Erros `model_not_found` ou 404, embora `/v1/chat/completions` funcione diretamente com o mesmo ID simples de modelo.
- Erros do backend informando que `messages[].content` esperava uma string.
- Avisos intermitentes `incomplete turn detected ... stopReason=stop payloads=0` com um backend local compatível com OpenAI.
- Falhas do backend que aparecem somente com contagens maiores de tokens do prompt ou prompts completos do runtime do agente.

<AccordionGroup>
  <Accordion title="Assinaturas comuns">
    - `model_not_found` com um servidor local no estilo MLX/vLLM: verifique se `baseUrl` inclui `/v1`, se `api` é `"openai-completions"` para backends de `/v1/chat/completions` e se `models.providers.<provider>.models[].id` é o ID simples local do provedor. Selecione-o uma vez com o prefixo do provedor, por exemplo, `mlx/mlx-community/Qwen3-30B-A3B-6bit`; mantenha a entrada do catálogo como `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string`: o backend rejeita partes estruturadas do conteúdo do Chat Completions. Correção: defina `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` ou chaves de mensagem permitidas como `["role","content"]`: o backend rejeita metadados de reprodução no estilo OpenAI em mensagens do Chat Completions. Correção: defina `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0`: o backend concluiu a solicitação do Chat Completions, mas não retornou texto do assistente visível ao usuário nessa interação. O OpenClaw repete uma vez as interações vazias compatíveis com OpenAI cuja reprodução é segura; falhas persistentes geralmente significam que o backend está emitindo conteúdo vazio ou não textual ou suprimindo o texto da resposta final.
    - Solicitações diretas pequenas funcionam, mas as execuções do agente do OpenClaw falham com travamentos do backend/modelo (por exemplo, Gemma em algumas compilações do `inferrs`): o transporte do OpenClaw provavelmente já está correto; o backend está falhando com o formato maior do prompt do runtime do agente.
    - As falhas diminuem após desativar as ferramentas, mas não desaparecem: os esquemas das ferramentas faziam parte da pressão, mas o problema restante ainda é a capacidade upstream do modelo/servidor ou um bug do backend.

  </Accordion>
  <Accordion title="Opções de correção">
    1. Defina `compat.requiresStringContent: true` para backends do Chat Completions que aceitam somente strings.
    2. Defina `compat.strictMessageKeys: true` para backends estritos do Chat Completions que aceitam somente `role` e `content` em cada mensagem.
    3. Defina `compat.supportsTools: false` para modelos/backends que não conseguem processar de forma confiável a superfície de esquemas de ferramentas do OpenClaw.
    4. Reduza a pressão do prompt quando possível: inicialização menor do espaço de trabalho, histórico de sessão mais curto, modelo local mais leve ou um backend com suporte mais robusto a contexto longo.
    5. Se as solicitações diretas pequenas continuarem funcionando enquanto as interações do agente do OpenClaw ainda causarem falhas no backend, trate isso como uma limitação upstream do servidor/modelo e registre uma reprodução nesse projeto com o formato de payload aceito.
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

- Pareamento pendente para remetentes de mensagens diretas.
- Restrição por menção em grupos (`requireMention`, `mentionPatterns`).
- Incompatibilidades na lista de permissões do canal/grupo.

Assinaturas comuns:

- `drop guild message (mention required` → mensagem de grupo ignorada até haver uma menção.
- `pairing request` → o remetente precisa de aprovação.
- `blocked` / `allowlist` → o remetente/canal foi filtrado pela política.

Relacionado:

- [Solução de problemas de canais](/pt-BR/channels/troubleshooting)
- [Grupos](/pt-BR/channels/groups)
- [Pareamento](/pt-BR/channels/pairing)

## Conectividade da interface de controle do painel

Quando o painel/interface de controle não se conectar, valide a URL, o modo de autenticação e as premissas de contexto seguro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Procure por:

- URL de sondagem e URL do painel corretas.
- Incompatibilidade de modo/token de autenticação entre o cliente e o Gateway.
- Uso de HTTP quando a identidade do dispositivo é obrigatória.

Se um navegador local não conseguir se conectar a `127.0.0.1:18789` após uma atualização, primeiro recupere o serviço local do Gateway e confirme que ele está servindo o painel:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

Se `curl` retornar HTML do OpenClaw, o Gateway está funcionando, e o problema restante provavelmente é o cache do navegador, um link direto antigo ou o estado obsoleto de uma aba. Abra `http://127.0.0.1:18789` diretamente e navegue a partir do painel. Se a reinicialização não mantiver o serviço em execução, execute `openclaw gateway start` e verifique novamente `openclaw gateway status`.

<AccordionGroup>
  <Accordion title="Assinaturas de conexão/autenticação">
    - `device identity required` → contexto não seguro ou autenticação do dispositivo ausente.
    - `origin not allowed` → o `Origin` do navegador não está em `gateway.controlUi.allowedOrigins` (ou você está se conectando a partir de uma origem de navegador que não é loopback sem uma lista de permissões explícita).
    - `device nonce required` / `device nonce mismatch` → o cliente não está concluindo o fluxo de autenticação do dispositivo baseado em desafio (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → o cliente assinou o payload incorreto (ou usou um carimbo de data/hora obsoleto) para o handshake atual.
    - `AUTH_TOKEN_MISMATCH` com `canRetryWithDeviceToken=true` → o cliente pode fazer uma nova tentativa confiável com o token de dispositivo armazenado em cache.
    - Essa nova tentativa com o token em cache reutiliza o conjunto de escopos armazenado com o token do dispositivo pareado. Chamadores com `deviceToken` / `scopes` explícitos mantêm o conjunto de escopos solicitado.
    - `AUTH_SCOPE_MISMATCH` → o token do dispositivo foi reconhecido, mas seus escopos aprovados não abrangem esta solicitação de conexão; faça um novo pareamento ou aprove o contrato de escopo solicitado em vez de alternar um token compartilhado do Gateway.
    - Fora desse caminho de nova tentativa, a precedência da autenticação de conexão é: token compartilhado/senha explícito primeiro, depois `deviceToken` explícito, depois o token de dispositivo armazenado e, por fim, o token de bootstrap.
    - No caminho assíncrono da interface de controle do Tailscale Serve, as tentativas com falha para o mesmo `{scope, ip}` são serializadas antes que o limitador registre a falha. Portanto, duas novas tentativas simultâneas inválidas do mesmo cliente podem resultar em `retry later` na segunda tentativa, em vez de duas incompatibilidades simples.
    - `too many failed authentication attempts (retry later)` de um cliente loopback com origem de navegador → falhas repetidas da mesma `Origin` normalizada são bloqueadas temporariamente; outra origem localhost usa um bucket separado.
    - `unauthorized` repetido após essa nova tentativa → divergência entre o token compartilhado e o token do dispositivo; atualize a configuração do token e, se necessário, aprove novamente ou alterne o token do dispositivo.
    - `gateway connect failed:` → destino de host/porta/URL incorreto.

  </Accordion>
</AccordionGroup>

### Mapa rápido dos códigos de detalhes de autenticação

Use `error.details.code` da resposta de `connect` com falha para escolher a próxima ação:

| Código de detalhe            | Significado                                                                                                                                                                                  | Ação recomendada                                                                                                                                                                                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | O cliente não enviou um token compartilhado obrigatório.                                                                                                                                    | Cole/defina o token no cliente e tente novamente. Para caminhos do painel: `openclaw config get gateway.auth.token` e depois cole nas configurações da interface de controle.                                                                                                             |
| `AUTH_TOKEN_MISMATCH`        | O token compartilhado não correspondeu ao token de autenticação do Gateway.                                                                                                                 | Se `canRetryWithDeviceToken=true`, permita uma nova tentativa confiável. Novas tentativas com o token em cache reutilizam os escopos aprovados armazenados; chamadores com `deviceToken` / `scopes` explícitos mantêm os escopos solicitados. Se ainda falhar, execute a [lista de verificação de recuperação de divergência de token](/pt-BR/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | O token armazenado em cache por dispositivo está obsoleto ou foi revogado.                                                                                                                   | Alterne/aprove novamente o token do dispositivo usando a [CLI de dispositivos](/pt-BR/cli/devices) e reconecte.                                                                                                                                                                                |
| `AUTH_SCOPE_MISMATCH`        | O token do dispositivo é válido, mas sua função/seus escopos aprovados não abrangem esta solicitação de conexão.                                                                             | Faça um novo pareamento do dispositivo ou aprove o contrato de escopo solicitado; não trate isso como divergência do token compartilhado.                                                                                                                                                 |
| `PAIRING_REQUIRED`           | A identidade do dispositivo precisa de aprovação. Verifique `error.details.reason` para `not-paired`, `scope-upgrade`, `role-upgrade` ou `metadata-upgrade` e use `requestId` / `remediationHint` quando presentes. | Aprove a solicitação pendente: `openclaw devices list` e depois `openclaw devices approve <requestId>`. Atualizações de escopo/função usam o mesmo fluxo após você revisar o acesso solicitado.                                                                                           |

<Note>
RPCs diretas do backend em loopback, autenticadas com o token compartilhado/senha do Gateway, não devem depender da linha de base de escopos de dispositivos pareados da CLI. Se subagentes ou outras chamadas internas ainda falharem com `scope-upgrade`, verifique se o chamador está usando `client.id: "gateway-client"` e `client.mode: "backend"` e se não está forçando uma `deviceIdentity` explícita ou um token de dispositivo.
</Note>

Verificação da migração da autenticação de dispositivo v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Se os logs mostrarem erros de nonce/assinatura, atualize o cliente que está se conectando e verifique-o:

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

- Sessões com token de dispositivo pareado podem gerenciar somente **seu próprio** dispositivo, a menos que o chamador também tenha `operator.admin`.
- `openclaw devices rotate --scope ...` só pode solicitar escopos de operador que a sessão do chamador já possui.

Relacionado:

- [Configuração](/pt-BR/gateway/configuration) (modos de autenticação do Gateway)
- [Interface de controle](/pt-BR/web/control-ui)
- [Dispositivos](/pt-BR/cli/devices)
- [Acesso remoto](/pt-BR/gateway/remote)
- [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth)

## Serviço do Gateway não está em execução

Use quando o serviço estiver instalado, mas o processo não permanecer em execução.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # também verifica serviços no nível do sistema
```

Procure por:

- `Runtime: stopped` com indicações de saída.
- Incompatibilidade na configuração do serviço (`Config (cli)` em comparação com `Config (service)`).
- Conflitos de porta/listener.
- Instalações adicionais de launchd/systemd/schtasks quando `--deep` é usado.
- Dicas de limpeza em `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Assinaturas comuns">
    - `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → o modo local do Gateway não está habilitado, ou o arquivo de configuração foi sobrescrito e perdeu `gateway.mode`. Correção: defina `gateway.mode="local"` em sua configuração ou execute novamente `openclaw onboard --mode local` / `openclaw setup` para restaurar a configuração esperada do modo local. Se você estiver executando o OpenClaw via Podman, o caminho de configuração padrão é `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → associação a uma interface que não é loopback sem um caminho válido de autenticação do Gateway (token/senha ou proxy confiável, quando configurado).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflito de porta.
    - `Other gateway-like services detected (best effort)` → existem unidades launchd/systemd/schtasks obsoletas ou paralelas. A maioria das configurações deve manter um Gateway por máquina; se você realmente precisar de mais de um, isole portas + configuração/estado/workspace. Consulte [/gateway#multiple-gateways-same-host](/pt-BR/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` do doctor → existe uma unidade systemd de sistema, enquanto o serviço no nível do usuário está ausente. Remova ou desabilite a duplicata antes de permitir que o doctor instale um serviço de usuário, ou defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` se a unidade de sistema for o supervisor pretendido.
    - `Gateway service port does not match current gateway config` → o supervisor instalado ainda fixa o `--port` antigo. Execute `openclaw doctor --fix` ou `openclaw gateway install --force` e reinicie o serviço do Gateway.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Execução em segundo plano e ferramenta de processos](/pt-BR/gateway/background-process)
- [Configuração](/pt-BR/gateway/configuration)
- [Doctor](/pt-BR/gateway/doctor)

## O Gateway no macOS para silenciosamente de responder e retoma quando você interage com o painel

Use quando os canais (Telegram, WhatsApp etc.) em um host macOS ficam inativos por minutos ou horas, e o Gateway parece voltar assim que você abre a interface de controle, acessa via SSH ou interage de outra forma com o host. Geralmente, não há nenhum sintoma evidente em `openclaw status`, pois, quando você verifica, o Gateway já está ativo novamente.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Procure por:

- Um ou mais pacotes `*-uncaught_exception.json` em `~/.openclaw/logs/stability/` com `error.code` definido como um código transitório de rede, como `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` ou `ECONNREFUSED`.
- Linhas de `pmset -g log` como `Entering Sleep state due to 'Maintenance Sleep'` ou `en0 driver is slow (msg: WillChangeState to 0)` alinhadas aos horários das falhas. Power Nap / Maintenance Sleep coloca brevemente o driver de Wi-Fi no estado 0; qualquer `connect()` de saída que ocorra nessa janela pode falhar com `ENETDOWN`, mesmo em um host que normalmente tenha conectividade de rede completa.
- Saída de `launchctl print` mostrando `state = not running` com várias execuções (`runs`) recentes e um código de saída, especialmente quando o intervalo entre a falha e a próxima inicialização é da ordem de uma hora, em vez de segundos. O launchd do macOS aplica uma barreira não documentada de proteção contra reinicializações após uma sequência de falhas, que pode deixar de respeitar `KeepAlive=true` até que um gatilho externo, como login interativo, conexão com o painel ou `launchctl kickstart`, a reative.

Assinaturas comuns:

- Um pacote de estabilidade cujo `error.code` seja `ENETDOWN` ou um código relacionado, com a pilha de chamadas apontando para `lookupAndConnect` / `Socket.connect` do módulo `net` do Node. O OpenClaw `2026.5.26` e versões posteriores classificam esses casos como erros transitórios de rede inofensivos, portanto eles não chegam mais ao manipulador de exceções não capturadas de nível superior; se você estiver em uma versão anterior, atualize primeiro.
- Longos períodos de inatividade que terminam no instante em que você se conecta à interface de controle ou acessa o host por SSH: é a atividade visível ao usuário que reativa a barreira de reinicialização do launchd, não alguma ação do painel sobre o Gateway.
- A contagem de `runs` aumentando ao longo do dia sem uma linha correspondente `received SIG*; shutting down` em `~/Library/Logs/openclaw/gateway.log`: encerramentos normais registram um sinal; falhas transitórias não.

O que fazer:

1. **Atualize o Gateway** se estiver executando uma versão anterior à `2026.5.26`. Após a atualização, futuros erros `ENETDOWN` serão registrados como avisos, em vez de encerrar o processo.
2. **Reduza a atividade de suspensão para manutenção** em hosts Mac mini / desktop destinados a funcionar como servidores sempre ativos:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Isso reduz significativamente, mas não elimina por completo, a oscilação subjacente do driver. O sistema ainda pode realizar algumas suspensões para manutenção de keepalive TCP e manutenção de mDNS, independentemente dessas opções.

3. **Adicione um monitor de atividade** para que uma futura sequência de falhas estacionada pelo launchd seja detectada rapidamente:

   ```bash
   # Exemplo de verificação de atividade compatível com launchd, adequada para um Cron ou LaunchAgent executado a cada 5 minutos
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   O objetivo é reativar externamente a barreira de reinicialização; `KeepAlive=true` por si só não é suficiente no macOS após uma sequência de falhas.

Relacionado:

- [Observações sobre a plataforma macOS](/pt-BR/platforms/macos)
- [Logs](/pt-BR/logging)
- [Doctor](/pt-BR/gateway/doctor)

## Loop de supervisão do launchd no macOS com LaunchAgents duplicados de Gateway/Node

Use isto quando uma instalação do macOS continuar reiniciando a cada poucos segundos, as verificações de integridade do `openclaw`
alternarem entre disponível e indisponível e o encaminhamento de canais travar,
mesmo que o serviço pareça estar em execução.

Isso foi observado em instalações antigas nas quais os LaunchAgents `ai.openclaw.gateway` e
`ai.openclaw.node` estavam ativos e cada um injetava
`OPENCLAW_LAUNCHD_LABEL`. Nesse estado, o OpenClaw pode detectar a
supervisão do launchd, tentar devolver o controle da reinicialização ao launchd e entrar em um loop rápido de
`EADDRINUSE`/reinicialização, em vez de manter um único processo estável do Gateway.

```bash
for i in 1 2 3 4; do
  ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
  sleep 10
done

openclaw gateway status --deep
openclaw node status
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'state|last exit|runs'
tail -n 80 ~/Library/Logs/openclaw/gateway.log
```

Procure por:

- Mais de um PID do Gateway ao longo da amostra de 30 segundos, em vez de um único
  processo estável.
- `EADDRINUSE`, `another gateway instance is already listening` ou linhas repetidas de
  reinicialização/transferência em `gateway.log`.
- Tanto `~/Library/LaunchAgents/ai.openclaw.gateway.plist` quanto
  `~/Library/LaunchAgents/ai.openclaw.node.plist` carregados ao mesmo tempo em um
  host que deveria executar apenas um serviço gerenciado do Gateway.

O que fazer:

1. Se este host deve executar somente o serviço do Gateway, remova o serviço
   gerenciado do Node por meio do OpenClaw. **Pule esta etapa** se você utiliza ativamente o serviço do Node
   para recursos remotos do Node; desinstalá-lo interrompe esses recursos neste
   host:

   ```bash
   openclaw node uninstall
   ```

2. Instale um wrapper persistente do Gateway que remova os marcadores herdados do launchd
   antes de iniciar o OpenClaw. Use a opção compatível `--wrapper`; não
   edite o arquivo gerado em `~/.openclaw/service-env/`, pois a reinstalação
   do serviço, a atualização e o reparo do Doctor regeneram esse arquivo:

   ```bash
   mkdir -p ~/.local/bin
   cat >~/.local/bin/openclaw-launchd-workaround <<'EOF'
   #!/bin/sh
   set -eu
   unset OPENCLAW_LAUNCHD_LABEL LAUNCH_JOB_LABEL LAUNCH_JOB_NAME XPC_SERVICE_NAME || true
   exec openclaw "$@"
   EOF
   chmod 700 ~/.local/bin/openclaw-launchd-workaround

   openclaw gateway install \
     --wrapper ~/.local/bin/openclaw-launchd-workaround \
     --force
   ```

   `gateway install` mantém o caminho do wrapper entre reinstalações forçadas,
   atualizações e reparos do Doctor.

3. Verifique se o Gateway está estável e atendendo RPC, não apenas escutando:

   ```bash
   openclaw gateway status --deep --require-rpc

   for i in 1 2 3 4; do
     ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
     sleep 10
   done
   ```

   A amostra de PIDs deve mostrar um único processo estável, em vez de um conjunto rotativo de
   PIDs, e o encaminhamento de canais de entrada deve ser retomado.

4. Depois de atualizar para uma versão na qual o loop subjacente de dois LaunchAgents esteja
   corrigido, remova a solução alternativa e reinstale o serviço gerenciado normal:

   ```bash
   OPENCLAW_WRAPPER= openclaw gateway install --force
   rm ~/.local/bin/openclaw-launchd-workaround
   ```

Relacionado:

- [Observações sobre a plataforma macOS](/pt-BR/platforms/mac/bundled-gateway)
- [Doctor](/pt-BR/gateway/doctor)
- [CLI do Gateway](/pt-BR/cli/gateway)

## O Gateway é encerrado durante alto uso de memória

Use quando o Gateway desaparecer sob carga, o supervisor relatar uma reinicialização semelhante a OOM ou os logs mencionarem `critical memory pressure bundle written`.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Procure por:

- `Reason: diagnostic.memory.pressure.critical` no pacote de estabilidade mais recente.
- `Memory pressure:` com `critical/rss_threshold`, `critical/heap_threshold` ou `critical/rss_growth`.
- Valores de `V8 heap:` próximos ao limite do heap.
- Entradas de `Largest session files:` como `agents/<agent>/sessions/<session>.jsonl` ou `sessions/<session>.jsonl`.
- Contadores de memória de cgroup do Linux quando o Gateway é executado dentro de um contêiner ou serviço com memória limitada.

Assinaturas comuns:

- `critical memory pressure bundle written` aparece pouco antes da reinicialização → o OpenClaw capturou um pacote de estabilidade anterior ao OOM. Inspecione-o com `openclaw gateway stability --bundle latest`.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` aparece nos logs do Gateway → o OpenClaw detectou pressão crítica de memória, mas o instantâneo de estabilidade anterior ao OOM está desativado.
- `Largest session files:` aponta para um caminho de transcrição anonimizado muito grande → reduza o histórico de sessões mantido, inspecione o crescimento das sessões ou mova transcrições antigas para fora do armazenamento ativo antes de reiniciar.
- Os bytes usados em `V8 heap:` estão próximos ao limite do heap → reduza a pressão de prompts/sessões, diminua o trabalho simultâneo ou aumente o limite de heap do Node somente após confirmar que a carga de trabalho é esperada.
- `Memory pressure: critical/rss_growth` → a memória cresceu rapidamente em uma única janela de amostragem. Verifique nos logs mais recentes se houve uma importação grande, saída descontrolada de uma ferramenta, tentativas repetidas ou um lote de trabalhos de agentes enfileirados.
- A pressão crítica de memória aparece nos logs, mas não existe pacote → esse é o padrão. Defina `diagnostics.memoryPressureSnapshot: true` para capturar o pacote de estabilidade anterior ao OOM em futuros eventos de pressão crítica de memória.

O pacote de estabilidade não contém cargas úteis. Ele inclui evidências operacionais de memória e caminhos relativos de arquivos anonimizados, não texto de mensagens, corpos de Webhook, credenciais, tokens, cookies nem IDs brutos de sessão. Anexe a exportação de diagnóstico aos relatórios de bugs, em vez de copiar os logs brutos.

Relacionado:

- [Integridade do Gateway](/pt-BR/gateway/health)
- [Exportação de diagnóstico](/pt-BR/gateway/diagnostics)
- [Sessões](/pt-BR/cli/sessions)

## O Gateway rejeitou uma configuração inválida

Use quando a inicialização do Gateway falhar com `Invalid config` ou quando os logs de recarga dinâmica indicarem que uma edição inválida foi ignorada.

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
- Um arquivo `openclaw.json.rejected.*` com data e hora ao lado da configuração ativa.
- Um arquivo `openclaw.json.clobbered.*` com data e hora se `doctor --fix` tiver reparado uma edição direta corrompida.
- O OpenClaw mantém os 32 arquivos `.clobbered.*` mais recentes de cada caminho de configuração e remove os mais antigos por rotação.

<AccordionGroup>
  <Accordion title="O que aconteceu">
    - A configuração não passou pela validação durante a inicialização, a recarga dinâmica ou uma gravação controlada pelo OpenClaw.
    - A inicialização do Gateway falha de forma segura, em vez de reescrever `openclaw.json`.
    - A recarga dinâmica ignora edições externas inválidas e mantém ativa a configuração atual do ambiente de execução.
    - As gravações controladas pelo OpenClaw rejeitam cargas úteis inválidas/destrutivas antes da confirmação e salvam `.rejected.*`.
    - `openclaw doctor --fix` é responsável pelo reparo. Ele pode remover prefixos que não sejam JSON ou restaurar a última cópia válida conhecida, preservando a carga útil rejeitada como `.clobbered.*`.
    - Quando ocorrem muitos reparos em um caminho de configuração, o OpenClaw remove por rotação os arquivos `.clobbered.*` mais antigos, para que a carga útil reparada mais recente continue disponível.

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
    - `.clobbered.*` existe → o Doctor preservou uma edição externa corrompida ao reparar a configuração ativa.
    - `.rejected.*` existe → uma gravação de configuração controlada pelo OpenClaw falhou nas verificações de esquema ou sobrescrita antes da confirmação.
    - `Config write rejected:` → a gravação tentou remover a estrutura obrigatória, reduzir o arquivo drasticamente ou persistir uma configuração inválida.
    - `config reload skipped (invalid config):` → uma edição direta falhou na validação e foi ignorada pelo Gateway em execução.
    - `Invalid config at ...` → a inicialização falhou antes que os serviços do Gateway fossem iniciados.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` ou `size-drop-vs-last-good:*` → uma gravação controlada pelo OpenClaw foi rejeitada porque perdeu campos ou tamanho em comparação com o último backup válido conhecido.
    - `Config last-known-good promotion skipped` → o candidato continha espaços reservados anonimizados de segredos, como `***`.

  </Accordion>
  <Accordion title="Opções de correção">
    1. Execute `openclaw doctor --fix` para permitir que o Doctor repare uma configuração com prefixo/sobrescrita ou restaure a última configuração válida conhecida.
    2. Copie somente as chaves desejadas de `.clobbered.*` ou `.rejected.*` e aplique-as com `openclaw config set` ou `config.patch`.
    3. Execute `openclaw config validate` antes de reiniciar.
    4. Se editar manualmente, mantenha a configuração JSON5 completa, não apenas o objeto parcial que pretendia alterar.
  </Accordion>
</AccordionGroup>

Relacionado:

- [Configuração](/pt-BR/cli/config)
- [Configuração: recarga dinâmica](/pt-BR/gateway/configuration#config-hot-reload)
- [Configuração: validação estrita](/pt-BR/gateway/configuration#strict-validation)
- [Doctor](/pt-BR/gateway/doctor)

## Avisos da sondagem do Gateway

Use quando `openclaw gateway probe` alcançar algum destino, mas ainda exibir um bloco de avisos.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Procure por:

- `warnings[].code` e `primaryTargetId` na saída JSON.
- Se o aviso é sobre fallback de SSH, vários gateways, escopos ausentes ou referências de autenticação não resolvidas.

Assinaturas comuns:

- `SSH tunnel failed to start; falling back to direct probes.` → a configuração do SSH falhou, mas o comando ainda tentou sondagens diretas nos destinos configurados/de loopback.
- `multiple reachable gateway identities detected` → gateways distintos responderam, ou o OpenClaw não conseguiu comprovar que os destinos alcançáveis são o mesmo gateway. Um túnel SSH, uma URL de proxy ou uma URL remota configurada para o mesmo gateway é tratado como um único gateway com vários transportes, mesmo quando as portas de transporte são diferentes.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → a conexão funcionou, mas a RPC de detalhes está limitada pelo escopo; emparelhe a identidade do dispositivo ou use credenciais com `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → a conexão funcionou, mas o conjunto completo de RPCs de diagnóstico atingiu o tempo limite ou falhou. Trate isso como um Gateway alcançável com diagnósticos degradados; compare `connect.ok` e `connect.rpcOk` na saída de `--json`.
- `Capability: pairing-pending` ou `gateway closed (1008): pairing required` → o gateway respondeu, mas este cliente ainda precisa de emparelhamento/aprovação antes do acesso normal de operador.
- Texto de aviso de SecretRef não resolvida em `gateway.auth.*` / `gateway.remote.*` → o material de autenticação não estava disponível neste caminho de comando para o destino que falhou.

Relacionado:

- [Gateway](/pt-BR/cli/gateway)
- [Vários gateways no mesmo host](/pt-BR/gateway#multiple-gateways-same-host)
- [Acesso remoto](/pt-BR/gateway/remote)

## Canal conectado, mas as mensagens não fluem

Se o estado do canal estiver conectado, mas o fluxo de mensagens estiver inativo, concentre-se em políticas, permissões e regras de entrega específicas do canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Procure por:

- Política de mensagens diretas (`pairing`, `allowlist`, `open`, `disabled`).
- Lista de permissões do grupo e requisitos de menção.
- Permissões/escopos ausentes da API do canal.

Assinaturas comuns:

- `mention required` → mensagem ignorada pela política de menções do grupo.
- `pairing` / rastros de aprovação pendente → o remetente não está aprovado.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema de autenticação/permissões do canal.

Relacionado:

- [Solução de problemas de canais](/pt-BR/channels/troubleshooting)
- [Discord](/pt-BR/channels/discord)
- [Telegram](/pt-BR/channels/telegram)
- [WhatsApp](/pt-BR/channels/whatsapp)

## Entrega de Cron e Heartbeat

Se o Cron ou o Heartbeat não tiver sido executado ou não tiver feito a entrega, verifique primeiro o estado do agendador e depois o destino de entrega.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Procure por:

- Cron habilitado e próximo despertar presente.
- Status do histórico de execução da tarefa (`ok`, `skipped`, `error`).
- Motivos para ignorar o Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Assinaturas comuns">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron desabilitado.
    - `cron: timer tick failed` → o ciclo do agendador falhou; verifique erros de arquivo/log/runtime.
    - `heartbeat skipped` com `reason=quiet-hours` → fora da janela de horários ativos.
    - `heartbeat skipped` com `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe, mas contém apenas uma estrutura vazia composta por espaços em branco, comentários, cabeçalhos, cercas ou listas de verificação vazias; portanto, o OpenClaw ignora a chamada ao modelo.
    - `heartbeat skipped` com `reason=no-tasks-due` → `HEARTBEAT.md` contém um bloco `tasks:`, mas nenhuma das tarefas deve ser executada neste ciclo.
    - `heartbeat: unknown accountId` → ID de conta inválido para o destino de entrega do Heartbeat.
    - `heartbeat skipped` com `reason=dm-blocked` → o destino do Heartbeat foi resolvido como um destino do tipo mensagem direta enquanto `agents.defaults.heartbeat.directPolicy` (ou a substituição por agente) está definido como `block`.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Heartbeat](/pt-BR/gateway/heartbeat)
- [Tarefas agendadas](/pt-BR/automation/cron-jobs)
- [Tarefas agendadas: solução de problemas](/pt-BR/automation/cron-jobs#troubleshooting)

## Node emparelhado, ferramenta falha

Se um Node estiver emparelhado, mas as ferramentas falharem, isole o estado de primeiro plano, permissões e aprovação.

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
- Estado das aprovações de execução e da lista de permissões.

Assinaturas comuns:

- `NODE_BACKGROUND_UNAVAILABLE` → o aplicativo do Node deve estar em primeiro plano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permissão do sistema operacional ausente.
- `SYSTEM_RUN_DENIED: approval required` → aprovação de execução pendente.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado pela lista de permissões.

Relacionado:

- [Aprovações de execução](/pt-BR/tools/exec-approvals)
- [Solução de problemas de Node](/pt-BR/nodes/troubleshooting)
- [Nodes](/pt-BR/nodes/index)

## A ferramenta de navegador falha

Use quando as ações da ferramenta de navegador falharem, mesmo que o próprio gateway esteja íntegro.

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

<AccordionGroup>
  <Accordion title="Assinaturas do Plugin/executável">
    - `unknown command "browser"` ou `unknown command 'browser'` → o plugin de navegador incluído foi excluído por `plugins.allow`.
    - Ferramenta de navegador ausente/indisponível enquanto `browser.enabled=true` → `plugins.allow` exclui `browser`, portanto o plugin nunca foi carregado.
    - `Failed to start Chrome CDP on port` → o processo do navegador não conseguiu iniciar.
    - `browser.executablePath not found` → o caminho configurado é inválido.
    - `browser.cdpUrl must be http(s) or ws(s)` → a URL CDP configurada usa um esquema incompatível, como `file:` ou `ftp:`.
    - `browser.cdpUrl has invalid port` → a URL CDP configurada tem uma porta inválida ou fora do intervalo.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → a instalação atual do gateway não possui a dependência principal do runtime do navegador; reinstale ou atualize o OpenClaw e reinicie o gateway. Capturas ARIA e capturas básicas de página ainda podem funcionar, mas navegação, capturas de IA, capturas de elementos por seletor CSS e exportação para PDF permanecem indisponíveis.

  </Accordion>
  <Accordion title="Assinaturas do Chrome MCP/existing-session">
    - `Could not find DevToolsActivePort for chrome` → a sessão existente do Chrome MCP ainda não conseguiu se conectar ao diretório de dados do navegador selecionado. Abra a página de inspeção do navegador, habilite a depuração remota, mantenha o navegador aberto, aprove a primeira solicitação de conexão e tente novamente. Se o estado de login não for necessário, prefira o perfil gerenciado `openclaw`.
    - `No browser tabs found for profile="user"` → o perfil de conexão do Chrome MCP não tem nenhuma guia local do Chrome aberta.
    - `Remote CDP for profile "<name>" is not reachable` → o endpoint CDP remoto configurado não pode ser alcançado a partir do host do gateway.
    - `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → o perfil somente para conexão não tem um destino alcançável, ou o endpoint HTTP respondeu, mas ainda não foi possível abrir o WebSocket CDP.

  </Accordion>
  <Accordion title="Assinaturas de elemento/captura/upload">
    - `fullPage is not supported for element screenshots` → a solicitação de captura combinou `--full-page` com `--ref` ou `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → as chamadas de captura do Chrome MCP / `existing-session` devem usar a captura de página ou um `--ref` de uma captura, não `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → os hooks de upload do Chrome MCP precisam de referências de captura, não de seletores CSS.
    - `existing-session file uploads currently support one file at a time.` → envie um upload por chamada nos perfis do Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → os hooks de diálogo nos perfis do Chrome MCP não aceitam substituições de tempo limite.
    - `existing-session type does not support timeoutMs overrides.` → omita `timeoutMs` para `act:type` em perfis `profile="user"` / de sessão existente do Chrome MCP, ou use um perfil de navegador gerenciado/CDP quando um tempo limite personalizado for necessário.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` ainda exige um perfil de navegador gerenciado ou CDP bruto.
    - Substituições obsoletas de viewport/modo escuro/localidade/modo offline em perfis somente para conexão ou CDP remoto → execute `openclaw browser stop --browser-profile <name>` para fechar a sessão de controle ativa e liberar o estado de emulação do Playwright/CDP sem reiniciar todo o gateway.

  </Accordion>
</AccordionGroup>

Relacionado:

- [Navegador (gerenciado pelo OpenClaw)](/pt-BR/tools/browser)
- [Solução de problemas do navegador](/pt-BR/tools/browser-linux-troubleshooting)

## Se você atualizou e algo parou de funcionar repentinamente

A maioria das falhas após uma atualização ocorre por divergência de configuração ou porque padrões mais rigorosos passaram a ser aplicados.

<AccordionGroup>
  <Accordion title="1. O comportamento de autenticação e substituição de URL mudou">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    O que verificar:

    - Se `gateway.mode=remote`, as chamadas da CLI podem estar direcionadas ao remoto enquanto o serviço local está funcionando normalmente.
    - Chamadas explícitas com `--url` não recorrem às credenciais armazenadas.

    Assinaturas comuns:

    - `gateway connect failed:` → destino da URL incorreto.
    - `unauthorized` → endpoint alcançável, mas autenticação incorreta.

  </Accordion>
  <Accordion title="2. As proteções de vinculação e autenticação estão mais rigorosas">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    O que verificar:

    - Vinculações que não sejam de loopback (`lan`, `tailnet`, `custom`) precisam de um caminho válido de autenticação do gateway: autenticação por token/senha compartilhados ou uma implantação `trusted-proxy` fora do loopback configurada corretamente.
    - Chaves antigas como `gateway.token` não substituem `gateway.auth.token`.

    Assinaturas comuns:

    - `refusing to bind gateway ... without auth` → vinculação fora do loopback sem um caminho válido de autenticação do gateway.
    - `Connectivity probe: failed` enquanto o runtime está em execução → gateway ativo, mas inacessível com a autenticação/URL atual.

  </Accordion>
  <Accordion title="3. O estado de emparelhamento e identidade do dispositivo mudou">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    O que verificar:

    - Aprovações de dispositivos pendentes para o painel/Nodes.
    - Aprovações pendentes de emparelhamento de mensagens diretas após alterações de política ou identidade.

    Assinaturas comuns:

    - `device identity required` → a autenticação do dispositivo não foi atendida.
    - `pairing required` → o remetente/dispositivo deve ser aprovado.

  </Accordion>
</AccordionGroup>

Se a configuração do serviço e o runtime ainda estiverem divergentes após as verificações, reinstale os metadados do serviço usando o mesmo diretório de perfil/estado:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Relacionado:

- [Autenticação](/pt-BR/gateway/authentication)
- [Execução em segundo plano e ferramenta de processos](/pt-BR/gateway/background-process)
- [Emparelhamento de Node](/pt-BR/gateway/pairing)

## Relacionado

- [Doctor](/pt-BR/gateway/doctor)
- [Perguntas frequentes](/pt-BR/help/faq)
- [Guia operacional do Gateway](/pt-BR/gateway)
