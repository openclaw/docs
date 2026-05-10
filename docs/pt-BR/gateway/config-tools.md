---
read_when:
    - Configurando a política de `tools.*`, listas de permissões ou recursos experimentais
    - Registrando provedores personalizados ou substituindo URLs base
    - Configuração de endpoints auto-hospedados compatíveis com OpenAI
sidebarTitle: Tools and custom providers
summary: Configuração de ferramentas (política, alternâncias experimentais, ferramentas com suporte de provedor) e configuração personalizada de provedor/base-URL
title: Configuração — ferramentas e provedores personalizados
x-i18n:
    generated_at: "2026-05-10T19:33:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: c02dad1d895afe90baf99487b37d29968ebd944890075511e1cb057776b29ec6
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` chaves de configuração e configuração personalizada de provedor / URL base. Para agentes, canais e outras chaves de configuração de nível superior, consulte a [referência de configuração](/pt-BR/gateway/configuration-reference).

## Ferramentas

### Perfis de ferramentas

`tools.profile` define uma lista de permissões base antes de `tools.allow`/`tools.deny`:

<Note>
O onboarding local define novas configurações locais como `tools.profile: "coding"` quando não está definido (perfis explícitos existentes são preservados).
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
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` é aceito como um alias para `exec`)                                         |
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

Política global de permitir/negar ferramentas (negar vence). Não diferencia maiúsculas de minúsculas, oferece suporte a curingas `*`. Aplicada mesmo quando o sandbox Docker está desativado.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` e `apply_patch` são ids de ferramenta separados. `allow: ["write"]` também habilita `apply_patch` para modelos compatíveis, mas `deny: ["write"]` não nega `apply_patch`. Para bloquear toda mutação de arquivos, negue `group:fs` ou liste cada ferramenta de mutação explicitamente:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

Restringe ainda mais as ferramentas para provedores ou modelos específicos. Ordem: perfil base → perfil do provedor → allow/deny.

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

### `tools.elevated`

Controla o acesso elevado a exec fora do sandbox:

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
- `/elevated on|off|ask|full` armazena o estado por sessão; diretivas inline se aplicam a uma única mensagem.
- `exec` elevado ignora o sandboxing e usa o caminho de escape configurado (`gateway` por padrão, ou `node` quando o destino de exec é `node`).

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
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

As verificações de segurança de loop de ferramentas ficam **desabilitadas por padrão**. Defina `enabled: true` para ativar a detecção. As configurações podem ser definidas globalmente em `tools.loopDetection` e substituídas por agente em `agents.list[].tools.loopDetection`.

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
  Histórico máximo de chamadas de ferramenta retido para análise de loop.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Limite de padrão repetido sem progresso para avisos.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Limite de repetição mais alto para bloquear loops críticos.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Limite de parada rígida para qualquer execução sem progresso.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Avisa sobre chamadas repetidas com a mesma ferramenta/os mesmos argumentos.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Avisa/bloqueia em ferramentas de sondagem conhecidas (`process.poll`, `command_status`, etc.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Avisa/bloqueia em padrões alternados de pares sem progresso.
</ParamField>

<Warning>
Se `warningThreshold >= criticalThreshold` ou `criticalThreshold >= globalCircuitBreakerThreshold`, a validação falha.
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
    **Entrada de provedor** (`type: "provider"` ou omitido):

    - `provider`: id do provedor de API (`openai`, `anthropic`, `google`/`gemini`, `groq`, etc.)
    - `model`: substituição do id do modelo
    - `profile` / `preferredProfile`: seleção de perfil de `auth-profiles.json`

    **Entrada de CLI** (`type: "cli"`):

    - `command`: executável a ser executado
    - `args`: argumentos com modelo (compatível com `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, etc.; `openclaw doctor --fix` migra placeholders obsoletos `{input}` para `{{MediaPath}}`)

    **Campos comuns:**

    - `capabilities`: lista opcional (`image`, `audio`, `video`). Padrões: `openai`/`anthropic`/`minimax` → imagem, `google` → imagem+áudio+vídeo, `groq` → áudio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: substituições por entrada.
    - `tools.media.image.timeoutSeconds` e as entradas `timeoutSeconds` correspondentes do modelo de imagem também se aplicam quando o agente chama a ferramenta `image` explícita.
    - Falhas recorrem à próxima entrada.

    A autenticação do provedor segue a ordem padrão: `auth-profiles.json` → variáveis de ambiente → `models.providers.*.apiKey`.

    **Campos de conclusão assíncrona:**

    - `asyncCompletion.directSend`: sinalizador de compatibilidade obsoleto. Tarefas assíncronas de mídia concluídas continuam mediadas pela sessão solicitante para que o agente receba o resultado, decida como informar o usuário e use a ferramenta de mensagem quando a entrega de origem exigir.

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

Controla quais sessões podem ser direcionadas pelas ferramentas de sessão (`sessions_list`, `sessions_history`, `sessions_send`).

Padrão: `tree` (sessão atual + sessões geradas por ela, como subagentes).

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
    - `self`: apenas a chave da sessão atual.
    - `tree`: sessão atual + sessões geradas pela sessão atual (subagentes).
    - `agent`: qualquer sessão pertencente ao id do agente atual (pode incluir outros usuários se você executar sessões por remetente sob o mesmo id de agente).
    - `all`: qualquer sessão. O direcionamento entre agentes ainda exige `tools.agentToAgent`.
    - Restrição de sandbox: quando a sessão atual está em sandbox e `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, a visibilidade é forçada para `tree`, mesmo se `tools.sessions.visibility="all"`.

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
    - Anexos são compatíveis apenas com `runtime: "subagent"`. O runtime ACP os rejeita.
    - Os arquivos são materializados no workspace filho em `.openclaw/attachments/<uuid>/` com um `.manifest.json`.
    - O conteúdo dos anexos é automaticamente redigido da persistência da transcrição.
    - Entradas Base64 são validadas com verificações rigorosas de alfabeto/preenchimento e uma proteção de tamanho antes da decodificação.
    - As permissões de arquivo são `0700` para diretórios e `0600` para arquivos.
    - A limpeza segue a política `cleanup`: `delete` sempre remove anexos; `keep` os retém apenas quando `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Flags experimentais de ferramentas integradas. Desativadas por padrão, a menos que uma regra de ativação automática de GPT-5 estritamente agêntica se aplique.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: habilita a ferramenta estruturada `update_plan` para acompanhamento de trabalho não trivial com várias etapas.
- Padrão: `false`, a menos que `agents.defaults.embeddedPi.executionContract` (ou uma substituição por agente) esteja definido como `"strict-agentic"` para uma execução da família GPT-5 da OpenAI ou do OpenAI Codex. Defina como `true` para forçar a ativação da ferramenta fora desse escopo, ou como `false` para mantê-la desativada mesmo em execuções GPT-5 estritamente agênticas.
- Quando habilitado, o prompt do sistema também adiciona orientações de uso para que o modelo a use apenas em trabalhos substanciais e mantenha no máximo uma etapa `in_progress`.

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
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: modelo padrão para subagentes criados. Se omitido, os subagentes herdam o modelo do chamador.
- `allowAgents`: allowlist padrão de ids de agentes de destino para `sessions_spawn` quando o agente solicitante não define seu próprio `subagents.allowAgents` (`["*"]` = qualquer um; padrão: apenas o mesmo agente).
- `runTimeoutSeconds`: tempo limite padrão (segundos) para `sessions_spawn` quando a chamada da ferramenta omite `runTimeoutSeconds`. `0` significa sem tempo limite.
- Política de ferramentas por subagente: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Provedores personalizados e URLs base

OpenClaw usa o catálogo de modelos integrado. Adicione provedores personalizados via `models.providers` na configuração ou em `~/.openclaw/agents/<agentId>/agent/models.json`.

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
  <Accordion title="Auth and merge precedence">
    - Use `authHeader: true` + `headers` para necessidades de autenticação personalizada.
    - Substitua a raiz de configuração do agente com `OPENCLAW_AGENT_DIR` (ou `PI_CODING_AGENT_DIR`, um alias legado de variável de ambiente).
    - Precedência de mesclagem para IDs de provedores correspondentes:
      - Valores não vazios de `baseUrl` do `models.json` do agente prevalecem.
      - Valores não vazios de `apiKey` do agente prevalecem apenas quando esse provedor não é gerenciado por SecretRef no contexto atual de configuração/perfil de autenticação.
      - Valores de `apiKey` de provedores gerenciados por SecretRef são atualizados a partir dos marcadores de origem (`ENV_VAR_NAME` para referências de env, `secretref-managed` para referências de arquivo/exec), em vez de persistir segredos resolvidos.
      - Valores de cabeçalho de provedores gerenciados por SecretRef são atualizados a partir dos marcadores de origem (`secretref-env:ENV_VAR_NAME` para referências de env, `secretref-managed` para referências de arquivo/exec).
      - `apiKey`/`baseUrl` vazios ou ausentes do agente recorrem a `models.providers` na configuração.
      - `contextWindow`/`maxTokens` de modelos correspondentes usam o valor mais alto entre a configuração explícita e os valores implícitos do catálogo.
      - `contextTokens` de modelos correspondentes preserva um limite explícito de runtime quando presente; use-o para limitar o contexto efetivo sem alterar os metadados nativos do modelo.
      - Use `models.mode: "replace"` quando quiser que a configuração reescreva completamente `models.json`.
      - A persistência de marcadores é autoritativa pela origem: os marcadores são escritos a partir do snapshot de configuração de origem ativo (antes da resolução), não de valores de segredos resolvidos em runtime.

  </Accordion>
</AccordionGroup>

### Detalhes dos campos do provedor

<AccordionGroup>
  <Accordion title="Top-level catalog">
    - `models.mode`: comportamento do catálogo de provedores (`merge` ou `replace`).
    - `models.providers`: mapa de provedores personalizados indexado por id do provedor.
      - Edições seguras: use `openclaw config set models.providers.<id> '<json>' --strict-json --merge` ou `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` para atualizações aditivas. `config set` recusa substituições destrutivas, a menos que você passe `--replace`.

  </Accordion>
  <Accordion title="Provider connection and auth">
    - `models.providers.*.api`: adaptador de solicitação (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, etc). Para backends auto-hospedados `/v1/chat/completions`, como MLX, vLLM, SGLang e a maioria dos servidores locais compatíveis com OpenAI, use `openai-completions`. Um provedor personalizado com `baseUrl` mas sem `api` usa `openai-completions` por padrão; defina `openai-responses` apenas quando o backend for compatível com `/v1/responses`.
    - `models.providers.*.apiKey`: credencial do provedor (prefira substituição por SecretRef/env).
    - `models.providers.*.auth`: estratégia de autenticação (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: janela de contexto nativa padrão para modelos neste provedor quando a entrada do modelo não define `contextWindow`.
    - `models.providers.*.contextTokens`: limite de contexto efetivo de runtime padrão para modelos neste provedor quando a entrada do modelo não define `contextTokens`.
    - `models.providers.*.maxTokens`: limite padrão de tokens de saída para modelos neste provedor quando a entrada do modelo não define `maxTokens`.
    - `models.providers.*.timeoutSeconds`: tempo limite opcional por provedor para solicitações HTTP de modelo, em segundos, incluindo conexão, cabeçalhos, corpo e tratamento de cancelamento total da solicitação.
    - `models.providers.*.injectNumCtxForOpenAICompat`: para Ollama + `openai-completions`, injeta `options.num_ctx` nas solicitações (padrão: `true`).
    - `models.providers.*.authHeader`: força o transporte da credencial no cabeçalho `Authorization` quando necessário.
    - `models.providers.*.baseUrl`: URL base da API upstream.
    - `models.providers.*.headers`: cabeçalhos estáticos extras para roteamento de proxy/tenant.

  </Accordion>
  <Accordion title="Request transport overrides">
    `models.providers.*.request`: substituições de transporte para solicitações HTTP do provedor de modelo.

    - `request.headers`: cabeçalhos extras (mesclados com os padrões do provedor). Valores aceitam SecretRef.
    - `request.auth`: substituição da estratégia de autenticação. Modos: `"provider-default"` (usa a autenticação integrada do provedor), `"authorization-bearer"` (com `token`), `"header"` (com `headerName`, `value`, `prefix` opcional).
    - `request.proxy`: substituição de proxy HTTP. Modos: `"env-proxy"` (usa variáveis de ambiente `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (com `url`). Ambos os modos aceitam um subobjeto `tls` opcional.
    - `request.tls`: substituição de TLS para conexões diretas. Campos: `ca`, `cert`, `key`, `passphrase` (todos aceitam SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: quando `true`, permite HTTPS para `baseUrl` quando o DNS resolve para faixas privadas, CGNAT ou semelhantes, por meio da proteção de fetch HTTP do provedor (opt-in do operador para endpoints auto-hospedados confiáveis compatíveis com OpenAI). URLs de stream de provedor de modelo em loopback, como `localhost`, `127.0.0.1` e `[::1]`, são permitidas automaticamente, a menos que isso seja definido explicitamente como `false`; hosts LAN, tailnet e DNS privados ainda exigem opt-in. WebSocket usa o mesmo `request` para cabeçalhos/TLS, mas não esse gate SSRF de fetch. Padrão `false`.

  </Accordion>
  <Accordion title="Model catalog entries">
    - `models.providers.*.models`: entradas explícitas do catálogo de modelos do provedor.
    - `models.providers.*.models.*.input`: modalidades de entrada do modelo. Use `["text"]` para modelos somente texto e `["text", "image"]` para modelos nativos de imagem/visão. Anexos de imagem são injetados em turnos do agente apenas quando o modelo selecionado está marcado como compatível com imagem.
    - `models.providers.*.models.*.contextWindow`: metadados da janela de contexto nativa do modelo. Isso substitui o `contextWindow` em nível de provedor para esse modelo.
    - `models.providers.*.models.*.contextTokens`: limite opcional de contexto de runtime. Isso substitui o `contextTokens` em nível de provedor; use-o quando quiser um orçamento de contexto efetivo menor que o `contextWindow` nativo do modelo; `openclaw models list` mostra ambos os valores quando eles diferem.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: dica opcional de compatibilidade. Para `api: "openai-completions"` com um `baseUrl` não nativo e não vazio (host diferente de `api.openai.com`), OpenClaw força isso para `false` em runtime. `baseUrl` vazio/omitido mantém o comportamento padrão da OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: dica opcional de compatibilidade para endpoints de chat compatíveis com OpenAI que aceitam apenas strings. Quando `true`, OpenClaw achata arrays `messages[].content` de texto puro em strings simples antes de enviar a solicitação.
    - `models.providers.*.models.*.compat.strictMessageKeys`: dica opcional de compatibilidade para endpoints de chat compatíveis com OpenAI estritos. Quando `true`, OpenClaw reduz objetos de mensagem enviados de Chat Completions para `role` e `content` antes de enviar a solicitação.
    - `models.providers.*.models.*.compat.thinkingFormat`: dica opcional de payload de pensamento. Use `"qwen"` para `enable_thinking` em nível superior, ou `"qwen-chat-template"` para `chat_template_kwargs.enable_thinking` em servidores compatíveis com OpenAI da família Qwen que aceitam kwargs de template de chat em nível de solicitação, como vLLM.

  </Accordion>
  <Accordion title="Amazon Bedrock discovery">
    - `plugins.entries.amazon-bedrock.config.discovery`: raiz das configurações de descoberta automática do Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: ativa/desativa a descoberta implícita.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: região da AWS para descoberta.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filtro opcional de id do provedor para descoberta direcionada.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: intervalo de polling para atualização da descoberta.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: janela de contexto de fallback para modelos descobertos.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: máximo de tokens de saída de fallback para modelos descobertos.

  </Accordion>
</AccordionGroup>

A integração interativa de provedores personalizados infere entrada de imagem para IDs comuns de modelos de visão, como GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V e GLM-4V, e pula a pergunta extra para famílias conhecidas somente texto. IDs de modelos desconhecidos ainda perguntam sobre suporte a imagem. A integração não interativa usa a mesma inferência; passe `--custom-image-input` para forçar metadados compatíveis com imagem ou `--custom-text-input` para forçar metadados somente texto.

### Exemplos de provedores

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    O Plugin de provedor `cerebras` incluído pode configurar isso via `openclaw onboard --auth-choice cerebras-api-key`. Use configuração explícita de provedor apenas ao substituir padrões.

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
  <Accordion title="Codificação Kimi">
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

    Compatível com Anthropic, provider integrado. Atalho: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Modelos locais (LM Studio)">
    Consulte [Modelos locais](/pt-BR/gateway/local-models). TL;DR: execute um modelo local grande pela API Responses do LM Studio em hardware robusto; mantenha modelos hospedados mesclados para fallback.
  </Accordion>
  <Accordion title="MiniMax M2.7 (direto)">
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

    Defina `MINIMAX_API_KEY`. Atalhos: `openclaw onboard --auth-choice minimax-global-api` ou `openclaw onboard --auth-choice minimax-cn-api`. O catálogo de modelos usa apenas M2.7 por padrão. No caminho de streaming compatível com Anthropic, o OpenClaw desativa o pensamento do MiniMax por padrão, a menos que você defina explicitamente `thinking`. `/fast on` ou `params.fastMode: true` reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.

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

    Endpoints nativos da Moonshot anunciam compatibilidade de uso de streaming no transporte compartilhado `openai-completions`, e o OpenClaw usa isso com base nas capacidades do endpoint, não apenas no id do provider integrado.

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

    Defina `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`). Use refs `opencode/...` para o catálogo Zen ou refs `opencode-go/...` para o catálogo Go. Atalho: `openclaw onboard --auth-choice opencode-zen` ou `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (compatível com Anthropic)">
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
    - Para o endpoint geral, defina um provider personalizado com a substituição da URL base.

  </Accordion>
</AccordionGroup>

---

## Relacionados

- [Configuração — agents](/pt-BR/gateway/config-agents)
- [Configuração — channels](/pt-BR/gateway/config-channels)
- [Referência de configuração](/pt-BR/gateway/configuration-reference) — outras chaves de nível superior
- [Ferramentas e plugins](/pt-BR/tools)
