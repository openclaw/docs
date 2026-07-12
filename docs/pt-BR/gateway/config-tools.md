---
read_when:
    - Configurando a política, as listas de permissões ou os recursos experimentais de `tools.*`
    - Registrando provedores personalizados ou substituindo URLs base
    - Configurando endpoints auto-hospedados compatíveis com a OpenAI
sidebarTitle: Tools and custom providers
summary: Configuração de ferramentas (política, opções experimentais, ferramentas fornecidas por provedores) e configuração personalizada de provedor/URL base
title: Configuração — ferramentas e provedores personalizados
x-i18n:
    generated_at: "2026-07-12T15:10:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 91f392efc7ca08ddd18875625ed3c95d21c5c12f70396594f8dc8e88a20293fc
    source_path: gateway/config-tools.md
    workflow: 16
---

Chaves de configuração `tools.*` e configuração de provedor personalizado / URL base. Para agentes, canais e outras chaves de configuração de nível superior, consulte a [Referência de configuração](/pt-BR/gateway/configuration-reference).

## Ferramentas

### Perfis de ferramentas

`tools.profile` define uma lista básica de permissões antes de `tools.allow`/`tools.deny`:

<Note>
A integração inicial local define por padrão `tools.profile: "coding"` em novas configurações locais quando ele não está definido (perfis explícitos existentes são preservados).
</Note>

| Perfil      | Inclui                                                                                                                                                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | somente `session_status`                                                                                                                                                                                                     |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                                                                                                    |
| `full`      | Sem restrição (igual a não definido)                                                                                                                                                                                         |

`coding` e `messaging` também permitem implicitamente `bundle-mcp` (servidores MCP configurados).

### Grupos de ferramentas

| Grupo              | Ferramentas                                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` é aceito como alias de `exec`)                                                                             |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `spawn_task`, `dismiss_task` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                         |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                 |
| `group:ui`         | `browser`, `canvas`                                                                                                                                   |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                |
| `group:messaging`  | `message`                                                                                                                                             |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                   |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                              |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                  |
| `group:openclaw`   | Todas as ferramentas integradas acima, exceto `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas` (exclui ferramentas de plugins)           |
| `group:plugins`    | Ferramentas pertencentes aos plugins carregados, incluindo servidores MCP configurados expostos por meio de `bundle-mcp`                              |

`spawn_task` permite que um agente de programação proponha um trabalho de acompanhamento confirmado sem iniciá-lo. A UI de controle mostra o título e o resumo como um chip acionável; uma TUI respaldada pelo Gateway mostra um prompt interativo equivalente. Aceitar qualquer um deles cria uma nova sessão de árvore de trabalho gerenciada e envia o prompt completo para ela, enquanto o turno atual continua. `dismiss_task` retira uma sugestão ainda pendente usando o `task_id` efêmero retornado por `spawn_task`.

As ferramentas são oferecidas somente quando a superfície do operador que iniciou a ação pode receber e executar eventos de sugestão de tarefa do Gateway. Sessões de canal e sessões TUI locais/incorporadas não os recebem; os transportes de canal precisam de uma ação de tarefa tipada e portável antes de poderem expor esse fluxo com segurança. As sugestões são locais ao processo e desaparecem quando o Gateway é reiniciado. Ambas as ferramentas permanecem no perfil `coding` e em `group:sessions`, portanto a política normal de `tools.allow` e `tools.deny` as configura automaticamente quando a superfície oferece suporte a elas.

### Ferramentas MCP e de plugins na política de ferramentas do sandbox

Os servidores MCP configurados são expostos como ferramentas pertencentes ao plugin sob o id de plugin `bundle-mcp`. Os perfis normais de ferramentas podem permiti-las, mas `tools.sandbox.tools` é uma barreira adicional para sessões em sandbox. Se o modo sandbox for `"all"` ou `"non-main"`, inclua uma destas entradas na lista de permissões de ferramentas do sandbox quando as ferramentas MCP/de plugins precisarem estar visíveis:

- `bundle-mcp` para servidores MCP gerenciados pelo OpenClaw provenientes de `mcp.servers`
- o id do plugin para um plugin nativo específico
- `group:plugins` para todas as ferramentas pertencentes aos plugins carregados
- nomes exatos de ferramentas de servidores MCP ou padrões glob de servidor, como `outlook__send_mail` ou `outlook__*`, quando você quiser apenas um servidor

Os padrões glob de servidor usam o prefixo do servidor MCP compatível com o provedor, não necessariamente a chave bruta de `mcp.servers`. Caracteres que não sejam `[A-Za-z0-9_-]` tornam-se `-`, nomes que não começam com uma letra recebem o prefixo `mcp-`, e prefixos longos ou duplicados podem ser truncados ou receber sufixos; por exemplo, `mcp.servers["Outlook Graph"]` usa um padrão glob como `outlook-graph__*`.

```json5
{
  agents: { defaults: { sandbox: { mode: "all" } } },
  mcp: {
    servers: {
      outlook: { command: "node", args: ["./outlook-mcp.js"] },
    },
  },
  tools: {
    sandbox: {
      tools: {
        alsoAllow: ["web_search", "web_fetch", "memory_search", "memory_get", "bundle-mcp"],
      },
    },
  },
}
```

Sem essa entrada na camada do sandbox, o servidor MCP ainda pode ser carregado com sucesso, enquanto suas ferramentas são filtradas antes da solicitação ao provedor. Use `openclaw doctor` para detectar essa configuração em servidores gerenciados pelo OpenClaw em `mcp.servers`. Servidores MCP carregados de manifestos de plugins integrados ou do `.mcp.json` do Claude usam a mesma barreira do sandbox, mas esse diagnóstico ainda não enumera essas fontes; use as mesmas entradas da lista de permissões se as ferramentas deles desaparecerem em turnos executados no sandbox.

### `tools.codeMode`

`tools.codeMode` habilita a superfície genérica do modo de código do OpenClaw. Quando habilitado
para uma execução com ferramentas, as ferramentas normais do OpenClaw passam a ficar atrás da ponte de catálogo `tools.*`
dentro do sandbox, e as ferramentas MCP ficam disponíveis por meio do namespace `MCP`
gerado. Normalmente, o modelo vê `exec` e `wait`; ferramentas como `computer`,
cujos resultados estruturados não podem atravessar a ponte exclusiva para JSON, permanecem diretas.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

A forma abreviada também é aceita:

```json5
{
  tools: { codeMode: true },
}
```

As declarações MCP são expostas por meio da superfície de arquivos da API virtual somente leitura no
modo de código. O código convidado pode chamar `API.list("mcp")` e
`API.read("mcp/<server>.d.ts")` para inspecionar assinaturas no estilo TypeScript antes de
chamar `MCP.<server>.<tool>()`. Consulte [Modo de código](/pt-BR/reference/code-mode) para ver o
contrato de execução, os limites e as etapas de depuração.

### `tools.allow` / `tools.deny`

Política global de permissão/bloqueio de ferramentas (o bloqueio prevalece). Não diferencia maiúsculas de minúsculas, aceita curingas `*`. Aplicada mesmo quando o sandbox do Docker está desativado.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` e `apply_patch` são IDs de ferramentas distintos. `allow: ["write"]` também habilita `apply_patch` para modelos compatíveis, mas `deny: ["write"]` não bloqueia `apply_patch`. Para bloquear toda alteração de arquivos, bloqueie `group:fs` ou liste explicitamente cada ferramenta que realiza alterações:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
`allow` e `alsoAllow` não podem ser definidos simultaneamente no mesmo escopo (`tools`, `tools.byProvider.<id>`, `agents.list[].tools`) — a validação da configuração rejeita essa combinação. Mescle as entradas de `alsoAllow` em `allow` ou remova `allow` e use `profile` + `alsoAllow`.
</Note>

### `tools.byProvider`

Restringe ainda mais as ferramentas para provedores ou modelos específicos. Ordem: perfil base → perfil do provedor → permissão/bloqueio.

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

Restringe as ferramentas para uma identidade específica do solicitante. Essa é uma medida de defesa em profundidade adicional ao controle de acesso do canal; os valores do remetente devem vir do adaptador do canal, não do texto da mensagem.

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

As chaves usam prefixos explícitos: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` ou `"*"`. Os IDs de canal são IDs canônicos do OpenClaw; aliases como `teams` são normalizados para `msteams`. Chaves legadas sem prefixo são aceitas somente como `id:`. A ordem de correspondência é canal+id, id, e164, nome de usuário, nome e, por fim, curinga.

`agents.list[].tools.toolsBySender` por agente substitui a correspondência global de remetente quando há correspondência, mesmo com uma política `{}` vazia.

### `tools.elevated`

Controla o acesso elevado de execução fora da sandbox:

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

- A substituição por agente (`agents.list[].tools.elevated`) só pode aplicar mais restrições.
- `/elevated on|off|ask|full` armazena o estado por sessão; diretivas em linha se aplicam a uma única mensagem.
- O `exec` elevado ignora o isolamento da sandbox e usa o caminho de escape configurado (`gateway` por padrão ou `node` quando o destino de execução é `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      approvalRunningNoticeMs: 10000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: true,
        allowModels: ["gpt-5.6-sol"],
      },
    },
  },
}
```

Os valores mostrados são os padrões, exceto `applyPatch.allowModels` (vazio/não definido por padrão, o que significa que qualquer modelo compatível pode usar `apply_patch`). `approvalRunningNoticeMs` emite um aviso de execução quando uma execução condicionada à aprovação demora; `0` desativa esse aviso.

### `tools.loopDetection`

As verificações de segurança contra loops de ferramentas estão **desativadas por padrão**. Defina `enabled: true` para ativar a detecção. As configurações podem ser definidas globalmente em `tools.loopDetection` e substituídas por agente em `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      unknownToolThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  Máximo de histórico de chamadas de ferramentas mantido para análise de loops.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Limite de padrões repetidos sem progresso para avisos.
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  Bloqueia chamadas repetidas ao mesmo nome de ferramenta indisponível/desconhecida após esse número de falhas.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Limite de repetição mais alto para bloquear loops críticos.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Limite de interrupção definitiva para qualquer execução sem progresso.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Avisa sobre chamadas repetidas com a mesma ferramenta e os mesmos argumentos.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Avisa/bloqueia ferramentas de consulta conhecidas (`process.poll`, `command_status` etc.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Avisa/bloqueia padrões alternados de pares sem progresso.
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  Número de tentativas após a compactação automática durante as quais a proteção permanece ativa; aborta se o agente repetir a mesma combinação (ferramenta, argumentos, resultado) dentro dessa janela.
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
        apiKey: "brave_api_key", // ou variável de ambiente BRAVE_API_KEY (provedor Brave)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // opcional; omita para detecção automática
        maxChars: 20000,
        maxCharsCap: 20000,
        maxResponseBytes: 750000,
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

Os valores mostrados são os padrões, exceto `provider` e `userAgent`. `maxResponseBytes` é limitado ao intervalo 32000–10000000; `maxChars` é limitado a `maxCharsCap` (aumente `maxCharsCap` para permitir respostas maiores).

### `tools.media`

Configura a compreensão de mídia recebida (imagem/áudio/vídeo):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // obsoleto: as conclusões continuam mediadas pelo agente
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

`concurrency` (padrão `2`), `audio.maxBytes` (padrão 20 MB) e `video.maxBytes` (padrão 50 MB) são mostrados com seus valores padrão; o padrão de `image.maxBytes` é 10 MB. Tempos limite padrão de solicitação por recurso: imagem/áudio `60`s, vídeo `120`s.

<AccordionGroup>
  <Accordion title="Campos de entrada do modelo de mídia">
    **Entrada de provedor** (`type: "provider"` ou omitido):

    - `provider`: ID do provedor de API (`openai`, `anthropic`, `google`/`gemini`, `groq` etc.)
    - `model`: substituição do ID do modelo
    - `profile` / `preferredProfile`: seleção de perfil em `auth-profiles.json`

    **Entrada de CLI** (`type: "cli"`):

    - `command`: executável a ser executado
    - `args`: argumentos com modelos (compatíveis com `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` etc.; `openclaw doctor --fix` migra os espaços reservados obsoletos `{input}` para `{{MediaPath}}`)

    **Campos comuns:**

    - `capabilities`: lista opcional (`image`, `audio`, `video`). Cada Plugin de provedor declara seu próprio conjunto padrão de recursos; por exemplo, o provedor `openai` incluído tem imagem+áudio como padrão, `anthropic`/`minimax` têm imagem, `google` tem imagem+áudio+vídeo e `groq` tem áudio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: substituições por entrada.
    - `tools.media.image.timeoutSeconds` e as entradas `timeoutSeconds` correspondentes do modelo de imagem também se aplicam quando o agente chama a ferramenta explícita `image`. Para compreensão de imagens, esse tempo limite se aplica à própria solicitação e não é reduzido pelo trabalho de preparação anterior.
    - Em caso de falha, passa para a próxima entrada.

    A autenticação do provedor segue a ordem padrão: `auth-profiles.json` → variáveis de ambiente → `models.providers.*.apiKey`.

    **Campos de conclusão assíncrona:**

    - `asyncCompletion.directSend`: sinalizador de compatibilidade obsoleto. As tarefas assíncronas de mídia concluídas continuam mediadas pela sessão solicitante, para que o agente receba o resultado, decida como informar o usuário e use a ferramenta de mensagens quando a entrega na origem exigir isso.

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
  <Accordion title="Escopos de visibilidade">
    - `self`: somente a chave da sessão atual.
    - `tree`: sessão atual + sessões criadas pela sessão atual (subagentes).
    - `agent`: qualquer sessão pertencente ao ID do agente atual (pode incluir outros usuários se você executar sessões por remetente sob o mesmo ID de agente).
    - `all`: qualquer sessão. O direcionamento entre agentes ainda exige `tools.agentToAgent`.
    - Restrição do sandbox: quando a sessão atual está em sandbox e `agents.defaults.sandbox.sessionToolsVisibility="spawned"` (o padrão), a visibilidade é forçada para `tree`, mesmo que `tools.sessions.visibility="all"`.
    - Quando não é `all`, `sessions_list` inclui um campo compacto `visibility`
      que descreve o modo efetivo e um aviso de que algumas sessões podem ser
      omitidas fora do escopo atual.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Controla o suporte a anexos embutidos para `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // adesão opcional: defina como true para permitir anexos de arquivos embutidos
        maxTotalBytes: 5242880, // 5 MB no total entre todos os arquivos
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB por arquivo
        retainOnSessionKeep: false, // mantém os anexos quando cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Observações sobre anexos">
    - Os anexos exigem `enabled: true`.
    - Os anexos de subagentes são materializados no espaço de trabalho filho em `.openclaw/attachments/<uuid>/`, com um arquivo `.manifest.json`.
    - Os anexos de ACP aceitam somente imagens e são encaminhados de forma embutida para o runtime ACP após passarem pelos mesmos limites de quantidade de arquivos, bytes por arquivo e total de bytes.
    - O conteúdo dos anexos é automaticamente ocultado na persistência da transcrição.
    - As entradas Base64 são validadas com verificações rigorosas de alfabeto/preenchimento e uma proteção de tamanho antes da decodificação.
    - As permissões de arquivos de anexos de subagentes são `0700` para diretórios e `0600` para arquivos.
    - A limpeza dos anexos de subagentes segue a política `cleanup`: `delete` sempre remove os anexos; `keep` os mantém somente quando `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Sinalizadores experimentais de ferramentas integradas. Desativados por padrão, salvo quando se aplica uma regra de ativação automática de GPT-5 com agente estrito.

```json5
{
  tools: {
    experimental: {
      planTool: true, // ativa o update_plan experimental
    },
  },
}
```

- `planTool`: ativa a ferramenta estruturada `update_plan` para acompanhar trabalhos não triviais com várias etapas.
- Padrão: `false`, salvo quando `agents.defaults.embeddedAgent.executionContract` (ou uma substituição por agente) está definido como `"strict-agentic"` para uma execução do provedor `openai` com um ID de modelo da família GPT-5 (isso também inclui execuções do OpenAI Codex CLI, pois o roteamento de autenticação/modelo do Codex fica sob o provedor `openai`). Defina como `true` para forçar a ativação da ferramenta fora desse escopo ou como `false` para mantê-la desativada mesmo em execuções de GPT-5 com agente estrito.
- Quando ativada, o prompt do sistema também adiciona orientações de uso para que o modelo a utilize somente em trabalhos substanciais e mantenha no máximo uma etapa como `in_progress`.

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

- `model`: modelo padrão para subagentes criados. Se omitido, os subagentes herdam o modelo do chamador.
- `allowAgents`: lista de permissões padrão dos IDs de agentes de destino configurados para `sessions_spawn` quando o agente solicitante não define seu próprio `subagents.allowAgents` (`["*"]` = qualquer destino configurado; padrão: somente o mesmo agente). Entradas obsoletas cuja configuração de agente foi excluída são rejeitadas por `sessions_spawn` e omitidas de `agents_list`; execute `openclaw doctor --fix` para removê-las.
- `maxConcurrent`: máximo de execuções simultâneas de subagentes. Padrão: `8`.
- `runTimeoutSeconds`: tempo limite (em segundos) de `sessions_spawn` quando o chamador não fornece sua própria substituição. Padrão: `0` (sem tempo limite); o valor `900` mostrado acima é um valor comum de adesão opcional, não o padrão integrado.
- `announceTimeoutMs`: tempo limite por chamada (em milissegundos) para tentativas de entrega de anúncios `agent` pelo Gateway. Padrão: `120000`. Novas tentativas transitórias podem fazer com que a espera total pelo anúncio seja maior do que um único tempo limite configurado.
- `archiveAfterMinutes`: minutos após a conclusão de uma sessão de subagente até que ela seja arquivada automaticamente. Padrão: `60`; `0` desativa o arquivamento automático.
- Política de ferramentas por subagente: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Provedores personalizados e URLs base

Os Plugins de provedor publicam suas próprias linhas no catálogo de modelos. Adicione provedores personalizados por meio de `models.providers` na configuração ou em `~/.openclaw/agents/<agentId>/agent/models.json`.

Configurar uma `baseUrl` de provedor personalizado/local também constitui uma decisão restrita de confiança de rede para solicitações HTTP de modelos: o OpenClaw permite essa origem exata `scheme://host:port` pelo caminho de busca protegido, sem adicionar uma opção de configuração separada nem confiar em outras origens privadas.

```json5
{
  models: {
    mode: "merge", // merge (padrão) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | etc.
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
  <Accordion title="Precedência de autenticação e mesclagem">
    - Use `authHeader: true` + `headers` para necessidades de autenticação personalizadas.
    - Substitua a raiz da configuração do agente com `OPENCLAW_AGENT_DIR`.
    - Precedência de mesclagem para IDs de provedores correspondentes:
      - Valores não vazios de `baseUrl` no `models.json` do agente têm precedência.
      - Valores não vazios de `apiKey` do agente têm precedência somente quando esse provedor não é gerenciado por SecretRef no contexto atual de configuração/perfil de autenticação.
      - Valores de `apiKey` de provedores gerenciados por SecretRef são atualizados a partir dos marcadores de origem (`ENV_VAR_NAME` para referências de ambiente, `secretref-managed` para referências de arquivo/execução), em vez de persistir segredos resolvidos.
      - Valores de cabeçalho de provedores gerenciados por SecretRef são atualizados a partir dos marcadores de origem (`secretref-env:ENV_VAR_NAME` para referências de ambiente, `secretref-managed` para referências de arquivo/execução).
      - Valores vazios ou ausentes de `apiKey`/`baseUrl` do agente usam como fallback `models.providers` na configuração.
      - Para `contextWindow`/`maxTokens` de modelos correspondentes: o valor explícito da configuração tem precedência quando presente e válido (um número finito positivo); caso contrário, o valor implícito/gerado do catálogo é usado.
      - `contextTokens` de modelos correspondentes segue a mesma regra de precedência do explícito, usando o implícito caso contrário; use-o para limitar o contexto efetivo sem alterar os metadados nativos do modelo.
      - Os catálogos de plugins de provedores são armazenados como fragmentos de catálogo gerados e pertencentes ao plugin no estado de plugins do agente.
      - Use `models.mode: "replace"` quando quiser que a configuração reescreva completamente o `models.json` e ignore a mesclagem dos fragmentos de catálogo pertencentes aos plugins.
      - A persistência de marcadores é determinada pela origem: os marcadores são gravados a partir do snapshot de configuração da origem ativa (antes da resolução), não a partir dos valores resolvidos dos segredos em tempo de execução.

  </Accordion>
</AccordionGroup>

### Detalhes dos campos do provedor

<AccordionGroup>
  <Accordion title="Catálogo de nível superior">
    - `models.mode`: comportamento do catálogo de provedores (`merge` ou `replace`).
    - `models.providers`: mapa de provedores personalizados indexado pelo ID do provedor.
      - Edições seguras: use `openclaw config set models.providers.<id> '<json>' --strict-json --merge` ou `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` para atualizações aditivas. `config set` recusa substituições destrutivas, a menos que você forneça `--replace`.

  </Accordion>
  <Accordion title="Conexão e autenticação do provedor">
    - `models.providers.*.api`: adaptador de solicitação (`openai-completions`, `openai-responses`, `openai-chatgpt-responses`, `anthropic-messages`, `google-generative-ai`, `google-vertex`, `github-copilot`, `bedrock-converse-stream`, `ollama`, `azure-openai-responses`). Para backends `/v1/chat/completions` auto-hospedados, como MLX, vLLM, SGLang e a maioria dos servidores locais compatíveis com OpenAI, use `openai-completions`. Um provedor personalizado com `baseUrl`, mas sem `api`, usa `openai-completions` como padrão; defina `openai-responses` somente quando o backend oferecer suporte a `/v1/responses`.
    - `models.providers.*.apiKey`: credencial do provedor (prefira substituição por SecretRef/variável de ambiente).
    - `models.providers.*.auth`: estratégia de autenticação (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: janela de contexto nativa padrão para os modelos desse provedor quando a entrada do modelo não define `contextWindow`.
    - `models.providers.*.contextTokens`: limite efetivo padrão de contexto em tempo de execução para os modelos desse provedor quando a entrada do modelo não define `contextTokens`.
    - `models.providers.*.maxTokens`: limite padrão de tokens de saída para os modelos desse provedor quando a entrada do modelo não define `maxTokens`.
    - `models.providers.*.timeoutSeconds`: tempo limite opcional, por provedor, em segundos para solicitações HTTP do modelo, incluindo conexão, cabeçalhos, corpo e tratamento do cancelamento da solicitação total.
    - `models.providers.*.injectNumCtxForOpenAICompat`: para Ollama + `openai-completions`, injeta `options.num_ctx` nas solicitações (padrão: `true`).
    - `models.providers.*.authHeader`: força o transporte da credencial no cabeçalho `Authorization` quando necessário.
    - `models.providers.*.baseUrl`: URL base da API upstream.
    - `models.providers.*.headers`: cabeçalhos estáticos adicionais para roteamento por proxy/locatário.

  </Accordion>
  <Accordion title="Substituições do transporte de solicitações">
    `models.providers.*.request`: substituições de transporte para solicitações HTTP ao provedor do modelo.

    - `request.headers`: cabeçalhos adicionais (mesclados com os padrões do provedor). Os valores aceitam SecretRef.
    - `request.auth`: substituição da estratégia de autenticação. Modos: `"provider-default"` (usa a autenticação integrada do provedor), `"authorization-bearer"` (com `token`), `"header"` (com `headerName`, `value` e `prefix` opcional).
    - `request.proxy`: substituição do proxy HTTP. Modos: `"env-proxy"` (usa as variáveis de ambiente `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (com `url`). Ambos os modos aceitam um subobjeto `tls` opcional.
    - `request.tls`: substituição de TLS para conexões diretas. Campos: `ca`, `cert`, `key`, `passphrase` (todos aceitam SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: quando `true`, permite que solicitações HTTP ao provedor do modelo acessem intervalos privados, CGNAT ou semelhantes por meio da proteção de busca HTTP do provedor. URLs base de provedores personalizados/locais já confiam na origem exata configurada, exceto origens de metadados/link-local, que continuam bloqueadas sem adesão explícita. Defina como `false` para desativar a confiança na origem exata. O WebSocket usa o mesmo `request` para cabeçalhos/TLS, mas não essa proteção SSRF de busca. Padrão: `false`.

  </Accordion>
  <Accordion title="Entradas do catálogo de modelos">
    - `models.providers.*.models`: entradas explícitas do catálogo de modelos do provedor.
    - `models.providers.*.models.*.input`: modalidades de entrada do modelo. Use `["text"]` para modelos somente de texto e `["text", "image"]` para modelos nativos de imagem/visão. Anexos de imagem são injetados nos turnos do agente somente quando o modelo selecionado está marcado como compatível com imagens.
    - `models.providers.*.models.*.contextWindow`: metadados da janela de contexto nativa do modelo. Isso substitui o `contextWindow` no nível do provedor para esse modelo.
    - `models.providers.*.models.*.contextTokens`: limite opcional de contexto em tempo de execução. Isso substitui o `contextTokens` no nível do provedor; use-o quando quiser um orçamento de contexto efetivo menor que o `contextWindow` nativo do modelo; `openclaw models list` mostra ambos os valores quando eles diferem.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: dica opcional de compatibilidade. Para `api: "openai-completions"` com um `baseUrl` não vazio e não nativo (host diferente de `api.openai.com`), o OpenClaw força esse valor para `false` em tempo de execução. Um `baseUrl` vazio/omitido mantém o comportamento padrão da OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: dica opcional de compatibilidade para endpoints de chat compatíveis com OpenAI que aceitam somente strings. Quando `true`, o OpenClaw converte arrays `messages[].content` que contêm apenas texto em strings simples antes de enviar a solicitação.
    - `models.providers.*.models.*.compat.strictMessageKeys`: dica opcional de compatibilidade para endpoints de chat estritos compatíveis com OpenAI. Quando `true`, o OpenClaw reduz os objetos de mensagem de Chat Completions enviados a `role` e `content` antes de enviar a solicitação.
    - `models.providers.*.models.*.compat.thinkingFormat`: dica opcional sobre o payload de raciocínio. Use `"together"` para `reasoning.enabled` no estilo Together, `"qwen"` para `enable_thinking` no nível superior ou `"qwen-chat-template"` para `chat_template_kwargs.enable_thinking` em servidores compatíveis com OpenAI da família Qwen que aceitam argumentos de palavra-chave de modelo de chat no nível da solicitação, como o vLLM. Modelos Qwen do vLLM configurados expõem opções binárias de `/think` (`off`, `on`) para esses formatos.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: dica opcional de compatibilidade para backends de Chat Completions no estilo DeepSeek que exigem que mensagens anteriores do assistente mantenham `reasoning_content` durante a reprodução. Quando `true`, o OpenClaw preserva esse campo nas mensagens enviadas do assistente. Use isso ao conectar um proxy personalizado compatível com DeepSeek que rejeite solicitações após a remoção do raciocínio. Padrão: `false`.

  </Accordion>
  <Accordion title="Descoberta do Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: raiz das configurações de descoberta automática do Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: ativa/desativa a descoberta implícita.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: região da AWS para descoberta.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filtro opcional de ID de provedor para descoberta direcionada.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: intervalo de sondagem para atualização da descoberta.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: janela de contexto de fallback para modelos descobertos.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: máximo de tokens de saída de fallback para modelos descobertos.

  </Accordion>
</AccordionGroup>

A integração interativa de provedores personalizados infere a entrada de imagem para padrões conhecidos de IDs de modelos de visão, incluindo GPT-4o/GPT-4.1/GPT-5+, as famílias de raciocínio `o1`/`o3`/`o4`, Claude, Gemini, qualquer ID com sufixo `-vl` (Qwen-VL e semelhantes) e famílias nomeadas como LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V e GLM-4V; ela ignora a pergunta adicional para famílias conhecidas que aceitam somente texto (Llama, DeepSeek, Mistral/Mixtral, Kimi/Moonshot, Codestral, Devstral, Phi, QwQ, CodeLlama e IDs Qwen simples sem sufixo vl/vision). IDs de modelos desconhecidos ainda solicitam confirmação sobre o suporte a imagens. A integração não interativa usa a mesma inferência; forneça `--custom-image-input` para forçar metadados compatíveis com imagens ou `--custom-text-input` para forçar metadados somente de texto.

### Exemplos de provedores

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    O Plugin de provedor externo oficial `cerebras` pode configurar isso por meio de `openclaw onboard --auth-choice cerebras-api-key`. Use uma configuração explícita do provedor somente ao substituir os padrões.

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

    Use `cerebras/zai-glm-4.7` para Cerebras; `zai/glm-4.7` para acesso direto à Z.AI.

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
  <Accordion title="Modelos locais (LM Studio)">
    Consulte [Modelos locais](/pt-BR/gateway/local-models). Resumindo: execute um modelo local de grande porte por meio da API Responses do LM Studio em hardware robusto; mantenha os modelos hospedados mesclados como fallback.
  </Accordion>
  <Accordion title="MiniMax M3 (direto)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "Minimax" },
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
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    Defina `MINIMAX_API_KEY`. Atalhos: `openclaw onboard --auth-choice minimax-global-api` ou `openclaw onboard --auth-choice minimax-cn-api`. O catálogo de modelos usa o M3 como padrão e também inclui as variantes do M2.7. No caminho de streaming compatível com a Anthropic, o OpenClaw desativa por padrão o raciocínio do MiniMax M2.x, a menos que você defina explicitamente `thinking`; o MiniMax-M3 (e o M3.x) permanece por padrão no caminho de raciocínio omitido/adaptativo do provedor. `/fast on` ou `params.fastMode: true` reescreve `MiniMax-M2.7` como `MiniMax-M2.7-highspeed`.

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

    Os endpoints nativos da Moonshot anunciam compatibilidade com o uso de streaming no transporte compartilhado `openai-completions`, e o OpenClaw determina isso com base nos recursos do endpoint, em vez de considerar apenas o ID do provedor integrado.

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
  <Accordion title="Synthetic (compatível com a Anthropic)">
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

    A URL base deve omitir `/v1` (o cliente da Anthropic a acrescenta). Atalho: `openclaw onboard --auth-choice synthetic-api-key`.

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

    Defina `ZAI_API_KEY`. As referências de modelo usam o ID canônico de provedor `zai/*`. Atalho: `openclaw onboard --auth-choice zai-api-key`.

    - Endpoint geral: `https://api.z.ai/api/paas/v4`
    - Endpoint de programação: `https://api.z.ai/api/coding/paas/v4`
    - A opção de autenticação padrão `zai-api-key` testa sua chave e detecta automaticamente a qual endpoint ela pertence (recorrendo a uma solicitação, com o padrão Global, se a detecção for inconclusiva). Também estão disponíveis opções de autenticação dedicadas para CN e Coding-Plan, permitindo a seleção explícita.
    - Para o endpoint geral, defina um provedor personalizado com a substituição da URL base.

  </Accordion>
</AccordionGroup>

---

## Relacionado

- [Configuração — agentes](/pt-BR/gateway/config-agents)
- [Configuração — canais](/pt-BR/gateway/config-channels)
- [Referência de configuração](/pt-BR/gateway/configuration-reference) — outras chaves de nível superior
- [Ferramentas e plugins](/pt-BR/tools)
