---
read_when:
    - Configurando a política, as listas de permissões ou os recursos experimentais de `tools.*`
    - Registrando provedores personalizados ou substituindo URLs base
    - Configurando endpoints auto-hospedados compatíveis com OpenAI
sidebarTitle: Tools and custom providers
summary: Configuração de ferramentas (política, alternâncias experimentais, ferramentas apoiadas por provedor) e configuração personalizada de provedor/URL base
title: Configuração — ferramentas e provedores personalizados
x-i18n:
    generated_at: "2026-05-11T20:29:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9ab0ec823da1e2e8598d9efb998a207c4486ba82dcf4dd65422c6bf90581b46
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` chaves de configuração e configuração personalizada de provedor / URL base. Para agentes, canais e outras chaves de configuração de nível superior, consulte [Referência de configuração](/pt-BR/gateway/configuration-reference).

## Ferramentas

### Perfis de ferramentas

`tools.profile` define uma lista de permissões base antes de `tools.allow`/`tools.deny`:

<Note>
A integração local define novas configurações locais como `tools.profile: "coding"` quando não definido (perfis explícitos existentes são preservados).
</Note>

| Perfil      | Inclui                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | somente `session_status`                                                                                                        |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Sem restrição (igual a não definido)                                                                                            |

### Grupos de ferramentas

| Grupo              | Ferramentas                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` é aceito como alias para `exec`)                                            |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                  |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`, `update_plan`                                                                                            |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                    |
| `group:openclaw`   | Todas as ferramentas integradas (exclui plugins de provedor)                                                            |

### `tools.allow` / `tools.deny`

Política global de permissão/bloqueio de ferramentas (bloqueio prevalece). Não diferencia maiúsculas de minúsculas, aceita curingas `*`. Aplicada mesmo quando o sandbox do Docker está desativado.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` e `apply_patch` são ids de ferramenta separados. `allow: ["write"]` também habilita `apply_patch` para modelos compatíveis, mas `deny: ["write"]` não bloqueia `apply_patch`. Para bloquear toda mutação de arquivos, bloqueie `group:fs` ou liste explicitamente cada ferramenta de mutação:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

Restringe ainda mais as ferramentas para provedores ou modelos específicos. Ordem: perfil base → perfil do provedor → permitir/bloquear.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.toolsBySender`

Restringe ferramentas para uma identidade de solicitante específica. Isso é defesa em profundidade sobre o controle de acesso do canal; os valores de remetente devem vir do adaptador de canal, não do texto da mensagem.

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

As chaves usam prefixos explícitos: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` ou `"*"`. Os ids de canal são ids canônicos do OpenClaw; aliases como `teams` são normalizados para `msteams`. Chaves legadas sem prefixo são aceitas somente como `id:`. A ordem de correspondência é canal+id, id, e164, nome de usuário, nome e, em seguida, curinga.

`agents.list[].tools.toolsBySender` por agente substitui a correspondência global de remetente quando há correspondência, mesmo com uma política `{}` vazia.

### `tools.elevated`

Controla acesso exec elevado fora do sandbox:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- A substituição por agente (`agents.list[].tools.elevated`) só pode restringir ainda mais.
- `/elevated on|off|ask|full` armazena o estado por sessão; diretivas embutidas se aplicam a uma única mensagem.
- `exec` elevado ignora o sandbox e usa o caminho de escape configurado (`gateway` por padrão, ou `node` quando o destino de exec é `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

As verificações de segurança contra loops de ferramentas são **desabilitadas por padrão**. Defina `enabled: true` para ativar a detecção. As configurações podem ser definidas globalmente em `tools.loopDetection` e substituídas por agente em `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  Histórico máximo de chamadas de ferramenta mantido para análise de loop.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Limite de padrões repetidos sem progresso para avisos.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Limite repetitivo mais alto para bloquear loops críticos.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Limite de parada rígida para qualquer execução sem progresso.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Avisa sobre chamadas repetidas da mesma ferramenta/com os mesmos argumentos.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Avisa/bloqueia em ferramentas de sondagem conhecidas (`process.poll`, `command_status`, etc.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Avisa/bloqueia em padrões alternados de pares sem progresso.
</ParamField>

<Warning>
Se `warningThreshold >= criticalThreshold` ou `criticalThreshold >= globalCircuitBreakerThreshold`, a validação falhará.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Configura o entendimento de mídia recebida (imagem/áudio/vídeo):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // deprecated: completions stay agent-mediated
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Media model entry fields">
    **Entrada de provedor** (`type: "provider"` ou omitida):

    - `provider`: ID do provedor de API (`openai`, `anthropic`, `google`/`gemini`, `groq`, etc.)
    - `model`: substituição do ID do modelo
    - `profile` / `preferredProfile`: seleção de perfil em `auth-profiles.json`

    **Entrada de CLI** (`type: "cli"`):

    - `command`: executável a ser executado
    - `args`: argumentos com modelo (aceita `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, etc.; `openclaw doctor --fix` migra placeholders obsoletos `{input}` para `{{MediaPath}}`)

    **Campos comuns:**

    - `capabilities`: lista opcional (`image`, `audio`, `video`). Padrões: `openai`/`anthropic`/`minimax` → imagem, `google` → imagem+áudio+vídeo, `groq` → áudio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: substituições por entrada.
    - `tools.media.image.timeoutSeconds` e entradas de modelo de imagem `timeoutSeconds` correspondentes também se aplicam quando o agente chama a ferramenta explícita `image`.
    - Falhas recorrem à próxima entrada.

    A autenticação do provedor segue a ordem padrão: `auth-profiles.json` → variáveis de ambiente → `models.providers.*.apiKey`.

    **Campos de conclusão assíncrona:**

    - `asyncCompletion.directSend`: sinalizador de compatibilidade obsoleto. Tarefas assíncronas de mídia concluídas permanecem mediadas pela sessão solicitante para que o agente receba o resultado, decida como informar o usuário e use a ferramenta de mensagem quando a entrega de origem exigir.

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Controla quais sessões podem ser alvo das ferramentas de sessão (`sessions_list`, `sessions_history`, `sessions_send`).

Padrão: `tree` (sessão atual + sessões criadas por ela, como subagentes).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Visibility scopes">
    - `self`: somente a chave da sessão atual.
    - `tree`: sessão atual + sessões criadas pela sessão atual (subagentes).
    - `agent`: qualquer sessão pertencente ao ID do agente atual (pode incluir outros usuários se você executar sessões por remetente sob o mesmo ID de agente).
    - `all`: qualquer sessão. O direcionamento entre agentes ainda exige `tools.agentToAgent`.
    - Restrição da sandbox: quando a sessão atual está em sandbox e `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, a visibilidade é forçada para `tree`, mesmo se `tools.sessions.visibility="all"`.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Controla o suporte a anexos inline para `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Attachment notes">
    - Anexos só são compatíveis com `runtime: "subagent"`. O runtime ACP os rejeita.
    - Os arquivos são materializados no workspace filho em `.openclaw/attachments/<uuid>/` com um `.manifest.json`.
    - O conteúdo dos anexos é automaticamente redigido da persistência da transcrição.
    - Entradas Base64 são validadas com verificações rigorosas de alfabeto/preenchimento e uma proteção de tamanho antes da decodificação.
    - As permissões de arquivo são `0700` para diretórios e `0600` para arquivos.
    - A limpeza segue a política `cleanup`: `delete` sempre remove anexos; `keep` os preserva somente quando `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Flags experimentais de ferramentas integradas. Desativadas por padrão, a menos que uma regra de ativação automática strict-agentic do GPT-5 se aplique.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: habilita a ferramenta estruturada `update_plan` para acompanhamento de trabalho não trivial em várias etapas.
- Padrão: `false`, a menos que `agents.defaults.embeddedPi.executionContract` (ou uma substituição por agente) esteja definido como `"strict-agentic"` para uma execução OpenAI ou OpenAI Codex da família GPT-5. Defina como `true` para forçar a ferramenta fora desse escopo, ou `false` para mantê-la desativada mesmo em execuções strict-agentic do GPT-5.
- Quando habilitado, o prompt do sistema também adiciona orientações de uso para que o modelo só a use em trabalhos substanciais e mantenha no máximo uma etapa como `in_progress`.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: modelo padrão para subagentes gerados. Se omitido, os subagentes herdam o modelo do chamador.
- `allowAgents`: lista de permissões padrão de IDs de agentes de destino para `sessions_spawn` quando o agente solicitante não define seu próprio `subagents.allowAgents` (`["*"]` = qualquer; padrão: somente o mesmo agente).
- `runTimeoutSeconds`: tempo limite padrão (segundos) para `sessions_spawn` quando a chamada da ferramenta omite `runTimeoutSeconds`. `0` significa sem tempo limite.
- `announceTimeoutMs`: tempo limite por chamada (milissegundos) para tentativas de entrega de anúncio `agent` do Gateway. Padrão: `120000`. Retentativas transitórias podem fazer com que a espera total pelo anúncio seja maior que um tempo limite configurado.
- Política de ferramentas por subagente: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Provedores personalizados e URLs base

O OpenClaw usa o catálogo de modelos integrado. Adicione provedores personalizados via `models.providers` na configuração ou em `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Autenticação e precedência de mesclagem">
    - Use `authHeader: true` + `headers` para necessidades de autenticação personalizada.
    - Substitua a raiz de configuração do agente com `OPENCLAW_AGENT_DIR` (ou `PI_CODING_AGENT_DIR`, um alias legado de variável de ambiente).
    - Precedência de mesclagem para IDs de provedor correspondentes:
      - Valores `baseUrl` não vazios do `models.json` do agente prevalecem.
      - Valores `apiKey` não vazios do agente prevalecem somente quando esse provedor não é gerenciado por SecretRef no contexto atual de configuração/perfil de autenticação.
      - Valores `apiKey` de provedor gerenciado por SecretRef são atualizados a partir dos marcadores de origem (`ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de arquivo/exec) em vez de persistir segredos resolvidos.
      - Valores de cabeçalho de provedor gerenciado por SecretRef são atualizados a partir dos marcadores de origem (`secretref-env:ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de arquivo/exec).
      - `apiKey`/`baseUrl` do agente vazios ou ausentes recorrem a `models.providers` na configuração.
      - `contextWindow`/`maxTokens` de modelo correspondente usam o maior valor entre a configuração explícita e os valores implícitos do catálogo.
      - `contextTokens` de modelo correspondente preserva um limite de runtime explícito quando presente; use-o para limitar o contexto efetivo sem alterar os metadados nativos do modelo.
      - Use `models.mode: "replace"` quando quiser que a configuração reescreva totalmente `models.json`.
      - A persistência de marcadores é autoritativa pela origem: marcadores são gravados a partir do snapshot ativo da configuração de origem (pré-resolução), não a partir de valores de segredo resolvidos em runtime.

  </Accordion>
</AccordionGroup>

### Detalhes dos campos do provedor

<AccordionGroup>
  <Accordion title="Catálogo de nível superior">
    - `models.mode`: comportamento do catálogo de provedores (`merge` ou `replace`).
    - `models.providers`: mapa de provedores personalizados indexado por id de provedor.
      - Edições seguras: use `openclaw config set models.providers.<id> '<json>' --strict-json --merge` ou `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` para atualizações aditivas. `config set` recusa substituições destrutivas, a menos que você passe `--replace`.

  </Accordion>
  <Accordion title="Conexão e autenticação do provedor">
    - `models.providers.*.api`: adaptador de requisição (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` etc.). Para backends auto-hospedados de `/v1/chat/completions`, como MLX, vLLM, SGLang e a maioria dos servidores locais compatíveis com OpenAI, use `openai-completions`. Um provedor personalizado com `baseUrl`, mas sem `api`, usa `openai-completions` por padrão; defina `openai-responses` somente quando o backend oferecer suporte a `/v1/responses`.
    - `models.providers.*.apiKey`: credencial do provedor (prefira substituição por SecretRef/env).
    - `models.providers.*.auth`: estratégia de autenticação (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: janela de contexto nativa padrão para modelos neste provedor quando a entrada do modelo não define `contextWindow`.
    - `models.providers.*.contextTokens`: limite efetivo padrão de contexto em runtime para modelos neste provedor quando a entrada do modelo não define `contextTokens`.
    - `models.providers.*.maxTokens`: limite padrão de tokens de saída para modelos neste provedor quando a entrada do modelo não define `maxTokens`.
    - `models.providers.*.timeoutSeconds`: timeout HTTP opcional por provedor para requisições de modelo, em segundos, incluindo conexão, cabeçalhos, corpo e tratamento de aborto da requisição total.
    - `models.providers.*.injectNumCtxForOpenAICompat`: para Ollama + `openai-completions`, injeta `options.num_ctx` nas requisições (padrão: `true`).
    - `models.providers.*.authHeader`: força o transporte de credenciais no cabeçalho `Authorization` quando necessário.
    - `models.providers.*.baseUrl`: URL base da API upstream.
    - `models.providers.*.headers`: cabeçalhos estáticos extras para roteamento de proxy/tenant.

  </Accordion>
  <Accordion title="Substituições de transporte de requisição">
    `models.providers.*.request`: substituições de transporte para requisições HTTP do provedor de modelo.

    - `request.headers`: cabeçalhos extras (mesclados com os padrões do provedor). Os valores aceitam SecretRef.
    - `request.auth`: substituição da estratégia de autenticação. Modos: `"provider-default"` (usa a autenticação integrada do provedor), `"authorization-bearer"` (com `token`), `"header"` (com `headerName`, `value`, `prefix` opcional).
    - `request.proxy`: substituição de proxy HTTP. Modos: `"env-proxy"` (usa as variáveis de ambiente `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (com `url`). Ambos os modos aceitam um subobjeto `tls` opcional.
    - `request.tls`: substituição de TLS para conexões diretas. Campos: `ca`, `cert`, `key`, `passphrase` (todos aceitam SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: quando `true`, permite HTTPS para `baseUrl` quando o DNS resolve para intervalos privados, CGNAT ou similares, por meio da proteção de fetch HTTP do provedor (adesão explícita do operador para endpoints auto-hospedados confiáveis compatíveis com OpenAI). URLs de stream de provedor de modelo em loopback, como `localhost`, `127.0.0.1` e `[::1]`, são permitidas automaticamente, a menos que isto seja definido explicitamente como `false`; hosts de LAN, tailnet e DNS privado ainda exigem adesão explícita. WebSocket usa o mesmo `request` para cabeçalhos/TLS, mas não esse gate SSRF de fetch. Padrão `false`.

  </Accordion>
  <Accordion title="Entradas do catálogo de modelos">
    - `models.providers.*.models`: entradas explícitas do catálogo de modelos do provedor.
    - `models.providers.*.models.*.input`: modalidades de entrada do modelo. Use `["text"]` para modelos apenas de texto e `["text", "image"]` para modelos nativos de imagem/visão. Anexos de imagem só são injetados em turnos do agente quando o modelo selecionado está marcado como capaz de imagem.
    - `models.providers.*.models.*.contextWindow`: metadados da janela de contexto nativa do modelo. Isso substitui o `contextWindow` em nível de provedor para esse modelo.
    - `models.providers.*.models.*.contextTokens`: limite opcional de contexto em runtime. Isso substitui o `contextTokens` em nível de provedor; use quando quiser um orçamento de contexto efetivo menor que o `contextWindow` nativo do modelo; `openclaw models list` mostra ambos os valores quando eles diferem.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: dica opcional de compatibilidade. Para `api: "openai-completions"` com um `baseUrl` não vazio e não nativo (host diferente de `api.openai.com`), o OpenClaw força isso para `false` em runtime. `baseUrl` vazio/omitido mantém o comportamento padrão da OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: dica opcional de compatibilidade para endpoints de chat compatíveis com OpenAI que aceitam apenas string. Quando `true`, o OpenClaw achata arrays `messages[].content` de texto puro em strings simples antes de enviar a requisição.
    - `models.providers.*.models.*.compat.strictMessageKeys`: dica opcional de compatibilidade para endpoints de chat compatíveis com OpenAI estritos. Quando `true`, o OpenClaw reduz os objetos de mensagem de Chat Completions enviados para `role` e `content` antes de enviar a requisição.
    - `models.providers.*.models.*.compat.thinkingFormat`: dica opcional de payload de pensamento. Use `"qwen"` para `enable_thinking` de nível superior, ou `"qwen-chat-template"` para `chat_template_kwargs.enable_thinking` em servidores compatíveis com OpenAI da família Qwen que oferecem suporte a kwargs de template de chat em nível de requisição, como vLLM.

  </Accordion>
  <Accordion title="Descoberta do Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: raiz das configurações de descoberta automática do Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: ativa/desativa a descoberta implícita.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: região AWS para descoberta.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filtro opcional de id de provedor para descoberta direcionada.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: intervalo de polling para atualização de descoberta.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: janela de contexto de fallback para modelos descobertos.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: tokens máximos de saída de fallback para modelos descobertos.

  </Accordion>
</AccordionGroup>

A integração interativa de provedores personalizados infere entrada de imagem para IDs comuns de modelos de visão, como GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V e GLM-4V, e pula a pergunta extra para famílias conhecidas somente de texto. IDs de modelo desconhecidos ainda perguntam sobre suporte a imagem. A integração não interativa usa a mesma inferência; passe `--custom-image-input` para forçar metadados compatíveis com imagem ou `--custom-text-input` para forçar metadados somente de texto.

### Exemplos de provedores

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    O Plugin de provedor `cerebras` incluído pode configurar isso via `openclaw onboard --auth-choice cerebras-api-key`. Use configuração explícita de provedor somente ao sobrescrever padrões.

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    Use `cerebras/zai-glm-4.7` para Cerebras; `zai/glm-4.7` para Z.AI direto.

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Compatível com Anthropic, provedor integrado. Atalho: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Local models (LM Studio)">
    Consulte [Modelos locais](/pt-BR/gateway/local-models). Resumo: execute um modelo local grande via LM Studio Responses API em hardware robusto; mantenha modelos hospedados mesclados para fallback.
  </Accordion>
  <Accordion title="MiniMax M2.7 (direct)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    Defina `MINIMAX_API_KEY`. Atalhos: `openclaw onboard --auth-choice minimax-global-api` ou `openclaw onboard --auth-choice minimax-cn-api`. O catálogo de modelos usa M2.7 como padrão exclusivo. No caminho de streaming compatível com Anthropic, o OpenClaw desativa o raciocínio do MiniMax por padrão, a menos que você defina `thinking` explicitamente. `/fast on` ou `params.fastMode: true` reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    Para o endpoint da China: `baseUrl: "https://api.moonshot.cn/v1"` ou `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Endpoints nativos da Moonshot anunciam compatibilidade de uso em streaming no transporte compartilhado `openai-completions`, e o OpenClaw ativa isso com base nos recursos do endpoint, não apenas no ID do provedor integrado.

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    Defina `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`). Use referências `opencode/...` para o catálogo Zen ou referências `opencode-go/...` para o catálogo Go. Atalho: `openclaw onboard --auth-choice opencode-zen` ou `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    A URL base deve omitir `/v1` (o cliente Anthropic a acrescenta). Atalho: `openclaw onboard --auth-choice synthetic-api-key`.

  </Accordion>
  <Accordion title="Z.AI (GLM-4.7)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    Defina `ZAI_API_KEY`. `z.ai/*` e `z-ai/*` são aliases aceitos. Atalho: `openclaw onboard --auth-choice zai-api-key`.

    - Endpoint geral: `https://api.z.ai/api/paas/v4`
    - Endpoint de codificação (padrão): `https://api.z.ai/api/coding/paas/v4`
    - Para o endpoint geral, defina um provedor personalizado com a substituição da URL base.

  </Accordion>
</AccordionGroup>

---

## Relacionado

- [Configuração — agentes](/pt-BR/gateway/config-agents)
- [Configuração — canais](/pt-BR/gateway/config-channels)
- [Referência de configuração](/pt-BR/gateway/configuration-reference) — outras chaves de nível superior
- [Ferramentas e plugins](/pt-BR/tools)
