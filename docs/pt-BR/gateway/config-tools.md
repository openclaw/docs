---
read_when:
    - Configurando política, allowlists ou recursos experimentais de `tools.*`
    - Registrando provedores personalizados ou substituindo URLs base
    - Configurando endpoints auto-hospedados compatíveis com OpenAI
sidebarTitle: Tools and custom providers
summary: Configuração de ferramentas (política, toggles experimentais, ferramentas com suporte de provedor) e configuração personalizada de provedor/base-URL
title: Configuração — ferramentas e provedores personalizados
x-i18n:
    generated_at: "2026-04-26T11:28:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef030940b155224e614675a85c7a81567fd3a493e5ec1c25c5956d49cbc11b86
    source_path: gateway/config-tools.md
    workflow: 15
---

Chaves de configuração `tools.*` e configuração de provedor personalizado / URL base. Para agentes, canais e outras chaves de configuração de nível superior, consulte [Referência de configuração](/pt-BR/gateway/configuration-reference).

## Ferramentas

### Perfis de ferramentas

`tools.profile` define uma allowlist base antes de `tools.allow`/`tools.deny`:

<Note>
A configuração inicial local define novas configurações locais com `tools.profile: "coding"` quando não definido (perfis explícitos existentes são preservados).
</Note>

| Perfil      | Inclui                                                                                                                        |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | somente `session_status`                                                                                                      |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                    |
| `full`      | Sem restrição (igual a não definido)                                                                                          |

### Grupos de ferramentas

| Grupo              | Ferramentas                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` é aceito como alias de `exec`)                                           |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                         |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                 |
| `group:ui`         | `browser`, `canvas`                                                                                                   |
| `group:automation` | `cron`, `gateway`                                                                                                     |
| `group:messaging`  | `message`                                                                                                             |
| `group:nodes`      | `nodes`                                                                                                               |
| `group:agents`     | `agents_list`                                                                                                         |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                    |
| `group:openclaw`   | Todas as ferramentas integradas (exclui plugins de provedor)                                                          |

### `tools.allow` / `tools.deny`

Política global de permitir/negar ferramentas (negação tem precedência). Não diferencia maiúsculas de minúsculas e oferece suporte a curingas `*`. Aplicada mesmo quando o sandbox Docker está desativado.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Restringe ainda mais ferramentas para provedores ou modelos específicos. Ordem: perfil base → perfil do provedor → allow/deny.

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

Controla acesso elevado de exec fora do sandbox:

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
- `/elevated on|off|ask|full` armazena estado por sessão; diretivas inline se aplicam a uma única mensagem.
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
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

As verificações de segurança contra loop de ferramentas ficam **desativadas por padrão**. Defina `enabled: true` para ativar a detecção. As configurações podem ser definidas globalmente em `tools.loopDetection` e substituídas por agente em `agents.list[].tools.loopDetection`.

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
  Limite de padrão repetitivo sem progresso para avisos.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Limite repetitivo mais alto para bloquear loops críticos.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Limite de interrupção total para qualquer execução sem progresso.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Avisa sobre chamadas repetidas com mesma ferramenta/mesmos argumentos.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Avisa/bloqueia ferramentas de polling conhecidas (`process.poll`, `command_status` etc.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Avisa/bloqueia padrões alternados em pares sem progresso.
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
        apiKey: "brave_api_key", // ou env BRAVE_API_KEY
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // opcional; omita para detecção automática
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

Configura o entendimento de mídia de entrada (imagem/áudio/vídeo):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: envia música/vídeo assíncrono concluído diretamente para o canal
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
  <Accordion title="Campos de entrada do modelo de mídia">
    **Entrada de provedor** (`type: "provider"` ou omitido):

    - `provider`: id do provedor de API (`openai`, `anthropic`, `google`/`gemini`, `groq` etc.)
    - `model`: substituição do id do modelo
    - `profile` / `preferredProfile`: seleção de perfil de `auth-profiles.json`

    **Entrada de CLI** (`type: "cli"`):

    - `command`: executável a ser executado
    - `args`: argumentos com template (suporta `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` etc.)

    **Campos comuns:**

    - `capabilities`: lista opcional (`image`, `audio`, `video`). Padrões: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: substituições por entrada.
    - Falhas usam fallback para a próxima entrada.

    A autenticação do provedor segue a ordem padrão: `auth-profiles.json` → variáveis de ambiente → `models.providers.*.apiKey`.

    **Campos de conclusão assíncrona:**

    - `asyncCompletion.directSend`: quando `true`, tarefas assíncronas concluídas de `music_generate` e `video_generate` tentam primeiro a entrega direta no canal. Padrão: `false` (caminho legado de ativação da sessão solicitante/entrega pelo modelo).

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

Controla quais sessões podem ser usadas como destino pelas ferramentas de sessão (`sessions_list`, `sessions_history`, `sessions_send`).

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
  <Accordion title="Escopos de visibilidade">
    - `self`: somente a chave da sessão atual.
    - `tree`: sessão atual + sessões geradas pela sessão atual (subagentes).
    - `agent`: qualquer sessão pertencente ao id do agente atual (pode incluir outros usuários se você executar sessões por remetente sob o mesmo id de agente).
    - `all`: qualquer sessão. O direcionamento entre agentes ainda exige `tools.agentToAgent`.
    - Restrição de sandbox: quando a sessão atual está em sandbox e `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, a visibilidade é forçada para `tree` mesmo que `tools.sessions.visibility="all"`.
  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Controla o suporte a anexos inline para `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: defina true para permitir anexos de arquivo inline
        maxTotalBytes: 5242880, // 5 MB no total entre todos os arquivos
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB por arquivo
        retainOnSessionKeep: false, // mantém anexos quando cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Observações sobre anexos">
    - Anexos são suportados apenas para `runtime: "subagent"`. O runtime ACP os rejeita.
    - Arquivos são materializados no workspace filho em `.openclaw/attachments/<uuid>/` com um `.manifest.json`.
    - O conteúdo do anexo é automaticamente redigido da persistência da transcrição.
    - Entradas Base64 são validadas com verificações estritas de alfabeto/preenchimento e uma proteção de tamanho antes da decodificação.
    - As permissões de arquivo são `0700` para diretórios e `0600` para arquivos.
    - A limpeza segue a política `cleanup`: `delete` sempre remove anexos; `keep` os mantém somente quando `retainOnSessionKeep: true`.
  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Flags experimentais de ferramentas integradas. Desativadas por padrão, a menos que se aplique uma regra de ativação automática estrita para agentes GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // habilita o update_plan experimental
    },
  },
}
```

- `planTool`: habilita a ferramenta estruturada `update_plan` para rastreamento de trabalho não trivial em várias etapas.
- Padrão: `false`, a menos que `agents.defaults.embeddedPi.executionContract` (ou uma substituição por agente) esteja definido como `"strict-agentic"` para uma execução da família GPT-5 do OpenAI ou OpenAI Codex. Defina `true` para forçar a ferramenta ligada fora desse escopo, ou `false` para mantê-la desligada mesmo em execuções GPT-5 strict-agentic.
- Quando habilitada, o prompt de sistema também adiciona orientações de uso para que o modelo a utilize apenas em trabalhos substanciais e mantenha no máximo uma etapa `in_progress`.

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

- `model`: modelo padrão para subagentes gerados. Se omitido, subagentes herdam o modelo do chamador.
- `allowAgents`: allowlist padrão de ids de agentes de destino para `sessions_spawn` quando o agente solicitante não define seu próprio `subagents.allowAgents` (`["*"]` = qualquer um; padrão: somente o mesmo agente).
- `runTimeoutSeconds`: timeout padrão (segundos) para `sessions_spawn` quando a chamada da ferramenta omite `runTimeoutSeconds`. `0` significa sem timeout.
- Política de ferramenta por subagente: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Provedores personalizados e URLs base

O OpenClaw usa o catálogo de modelos integrado. Adicione provedores personalizados via `models.providers` na configuração ou `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (padrão) | replace
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
  <Accordion title="Autenticação e precedência de merge">
    - Use `authHeader: true` + `headers` para necessidades de autenticação personalizadas.
    - Substitua a raiz de configuração do agente com `OPENCLAW_AGENT_DIR` (ou `PI_CODING_AGENT_DIR`, um alias legado de variável de ambiente).
    - Precedência de merge para IDs de provedor correspondentes:
      - Valores `baseUrl` não vazios de `models.json` do agente têm precedência.
      - Valores `apiKey` não vazios do agente têm precedência somente quando esse provedor não é gerenciado por SecretRef no contexto atual de configuração/perfil de autenticação.
      - Valores `apiKey` de provedor gerenciados por SecretRef são atualizados a partir de marcadores de origem (`ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de file/exec) em vez de persistir segredos resolvidos.
      - Valores de header de provedor gerenciados por SecretRef são atualizados a partir de marcadores de origem (`secretref-env:ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de file/exec).
      - `apiKey`/`baseUrl` vazios ou ausentes no agente usam fallback para `models.providers` na configuração.
      - `contextWindow`/`maxTokens` de modelos correspondentes usam o valor mais alto entre a configuração explícita e os valores implícitos do catálogo.
      - `contextTokens` de modelos correspondentes preserva um limite explícito de runtime quando presente; use-o para limitar o contexto efetivo sem alterar os metadados nativos do modelo.
      - Use `models.mode: "replace"` quando quiser que a configuração reescreva completamente `models.json`.
      - A persistência de marcadores é autoritativa pela origem: os marcadores são gravados a partir do snapshot ativo da configuração de origem (pré-resolução), não dos valores secretos resolvidos em runtime.
  </Accordion>
</AccordionGroup>

### Detalhes dos campos do provedor

<AccordionGroup>
  <Accordion title="Catálogo de nível superior">
    - `models.mode`: comportamento do catálogo de provedores (`merge` ou `replace`).
    - `models.providers`: mapa de provedores personalizados indexado por id de provedor.
      - Edições seguras: use `openclaw config set models.providers.<id> '<json>' --strict-json --merge` ou `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` para atualizações aditivas. `config set` recusa substituições destrutivas a menos que você passe `--replace`.
  </Accordion>
  <Accordion title="Conexão e autenticação do provedor">
    - `models.providers.*.api`: adaptador de requisição (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` etc).
    - `models.providers.*.apiKey`: credencial do provedor (prefira SecretRef/substituição por env).
    - `models.providers.*.auth`: estratégia de autenticação (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.injectNumCtxForOpenAICompat`: para Ollama + `openai-completions`, injeta `options.num_ctx` nas requisições (padrão: `true`).
    - `models.providers.*.authHeader`: força o transporte da credencial no header `Authorization` quando necessário.
    - `models.providers.*.baseUrl`: URL base da API upstream.
    - `models.providers.*.headers`: headers estáticos extras para roteamento de proxy/tenant.
  </Accordion>
  <Accordion title="Substituições de transporte de requisição">
    `models.providers.*.request`: substituições de transporte para requisições HTTP do provedor de modelos.

    - `request.headers`: headers extras (mesclados com os padrões do provedor). Valores aceitam SecretRef.
    - `request.auth`: substituição da estratégia de autenticação. Modos: `"provider-default"` (usa autenticação integrada do provedor), `"authorization-bearer"` (com `token`), `"header"` (com `headerName`, `value`, `prefix` opcional).
    - `request.proxy`: substituição de proxy HTTP. Modos: `"env-proxy"` (usa variáveis de ambiente `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (com `url`). Ambos os modos aceitam um subobjeto `tls` opcional.
    - `request.tls`: substituição de TLS para conexões diretas. Campos: `ca`, `cert`, `key`, `passphrase` (todos aceitam SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: quando `true`, permite HTTPS para `baseUrl` quando o DNS resolve para faixas privadas, CGNAT ou similares, via a proteção SSRF do fetch HTTP do provedor (opt-in do operador para endpoints compatíveis com OpenAI auto-hospedados confiáveis). WebSocket usa o mesmo `request` para headers/TLS, mas não essa proteção SSRF de fetch. Padrão `false`.

  </Accordion>
  <Accordion title="Entradas do catálogo de modelos">
    - `models.providers.*.models`: entradas explícitas do catálogo de modelos do provedor.
    - `models.providers.*.models.*.contextWindow`: metadados da janela de contexto nativa do modelo.
    - `models.providers.*.models.*.contextTokens`: limite opcional de contexto em runtime. Use isso quando quiser um orçamento efetivo de contexto menor que o `contextWindow` nativo do modelo; `openclaw models list` mostra ambos os valores quando diferem.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: dica opcional de compatibilidade. Para `api: "openai-completions"` com `baseUrl` não nativa não vazia (host diferente de `api.openai.com`), o OpenClaw força isso para `false` em runtime. `baseUrl` vazio/omitido mantém o comportamento padrão do OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: dica opcional de compatibilidade para endpoints de chat compatíveis com OpenAI que aceitam somente string. Quando `true`, o OpenClaw achata arrays `messages[].content` de texto puro em strings simples antes de enviar a requisição.
  </Accordion>
  <Accordion title="Descoberta do Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: raiz das configurações de descoberta automática do Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: ativa/desativa a descoberta implícita.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: região AWS para descoberta.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filtro opcional de id de provedor para descoberta direcionada.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: intervalo de polling para atualização da descoberta.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: fallback de janela de contexto para modelos descobertos.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: fallback de tokens máximos de saída para modelos descobertos.
  </Accordion>
</AccordionGroup>

### Exemplos de provedor

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.6 / 4.7)">
    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/zai-glm-4.6"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
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
              { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
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
          model: { primary: "kimi/kimi-code" },
          models: { "kimi/kimi-code": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Compatível com Anthropic, provedor integrado. Atalho: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Modelos locais (LM Studio)">
    Consulte [Modelos locais](/pt-BR/gateway/local-models). Resumindo: execute um grande modelo local via API Responses do LM Studio em hardware robusto; mantenha modelos hospedados mesclados para fallback.
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

    Defina `MINIMAX_API_KEY`. Atalhos: `openclaw onboard --auth-choice minimax-global-api` ou `openclaw onboard --auth-choice minimax-cn-api`. O catálogo de modelos usa por padrão apenas M2.7. No caminho de streaming compatível com Anthropic, o OpenClaw desabilita o thinking do MiniMax por padrão, a menos que você defina `thinking` explicitamente. `/fast on` ou `params.fastMode: true` reescreve `MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.

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

    Endpoints nativos do Moonshot anunciam compatibilidade de uso de streaming no transporte compartilhado `openai-completions`, e o OpenClaw baseia isso nas capacidades do endpoint em vez de apenas no id do provedor integrado.

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
    - Endpoint de coding (padrão): `https://api.z.ai/api/coding/paas/v4`
    - Para o endpoint geral, defina um provedor personalizado com a substituição da URL base.

  </Accordion>
</AccordionGroup>

---

## Relacionado

- [Configuração — agentes](/pt-BR/gateway/config-agents)
- [Configuração — canais](/pt-BR/gateway/config-channels)
- [Referência de configuração](/pt-BR/gateway/configuration-reference) — outras chaves de nível superior
- [Ferramentas e plugins](/pt-BR/tools)
