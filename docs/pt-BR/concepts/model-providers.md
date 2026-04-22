---
read_when:
    - Você precisa de uma referência de configuração de modelo por provedor
    - Você quer configurações de exemplo ou comandos de onboarding da CLI para provedores de modelo
summary: Visão geral do provedor de modelo com configurações de exemplo + fluxos de CLI
title: Provedores de modelo
x-i18n:
    generated_at: "2026-04-22T04:21:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: c195cf5eafe277212aefb82483fe5daa6705a7e6534cf3612e7b5b20ac67adb7
    source_path: concepts/model-providers.md
    workflow: 15
---

# Provedores de modelo

Esta página cobre **provedores de LLM/modelo** (não canais de chat como WhatsApp/Telegram).
Para regras de seleção de modelo, consulte [/concepts/models](/pt-BR/concepts/models).

## Regras rápidas

- Referências de modelo usam `provider/model` (exemplo: `opencode/claude-opus-4-6`).
- Se você definir `agents.defaults.models`, isso se tornará a lista de permissões.
- Auxiliares da CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Regras de runtime de fallback, sondas de cooldown e persistência de substituição por sessão
  estão documentadas em [/concepts/model-failover](/pt-BR/concepts/model-failover).
- `models.providers.*.models[].contextWindow` são metadados nativos do modelo;
  `models.providers.*.models[].contextTokens` é o limite efetivo de runtime.
- Plugins de provedor podem injetar catálogos de modelo via `registerProvider({ catalog })`;
  o OpenClaw mescla essa saída em `models.providers` antes de gravar
  `models.json`.
- Manifestos de provedor podem declarar `providerAuthEnvVars` e
  `providerAuthAliases`, para que sondas genéricas de autenticação baseadas em env e variantes de provedor
  não precisem carregar o runtime do plugin. O mapa restante de variáveis de ambiente no core agora
  serve apenas para provedores não baseados em plugin/core e alguns casos de precedência genérica
  como onboarding do Anthropic com prioridade para chave de API.
- Plugins de provedor também podem controlar o comportamento de runtime do provedor por meio de
  `normalizeModelId`, `normalizeTransport`, `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`,
  `normalizeResolvedModel`, `contributeResolvedModelCompat`,
  `capabilities`, `normalizeToolSchemas`,
  `inspectToolSchemas`, `resolveReasoningOutputMode`,
  `prepareExtraParams`, `createStreamFn`, `wrapStreamFn`,
  `resolveTransportTurnState`, `resolveWebSocketSessionPolicy`,
  `createEmbeddingProvider`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`,
  `matchesContextOverflowError`, `classifyFailoverReason`,
  `isCacheTtlEligible`, `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile`, `isBinaryThinking`,
  `supportsXHighThinking`, `resolveDefaultThinkingLevel`,
  `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, e
  `onModelSelected`.
- Observação: `capabilities` do runtime do provedor são metadados compartilhados do executor (família do provedor, particularidades de transcrição/ferramentas, dicas de transporte/cache). Isso não é o mesmo que o [modelo público de capacidades](/pt-BR/plugins/architecture#public-capability-model),
  que descreve o que um plugin registra (inferência de texto, fala etc.).
- O provedor `codex` incluído é pareado com o harness do agente Codex incluído.
  Use `codex/gpt-*` quando quiser login controlado pelo Codex, descoberta de modelos,
  retomada nativa de thread e execução no servidor do aplicativo. Referências simples `openai/gpt-*` continuam
  usando o provedor OpenAI e o transporte normal de provedor do OpenClaw.
  Implantações somente com Codex podem desativar o fallback automático de PI com
  `agents.defaults.embeddedHarness.fallback: "none"`; consulte
  [Codex Harness](/pt-BR/plugins/codex-harness).

## Comportamento de provedor controlado por plugin

Os plugins de provedor agora podem controlar a maior parte da lógica específica de provedor, enquanto o OpenClaw mantém
o loop genérico de inferência.

Divisão típica:

- `auth[].run` / `auth[].runNonInteractive`: o provedor controla os fluxos de onboarding/login
  para `openclaw onboard`, `openclaw models auth` e configuração headless
- `wizard.setup` / `wizard.modelPicker`: o provedor controla rótulos de escolha de autenticação,
  aliases legados, dicas de lista de permissões no onboarding e entradas de configuração em seletores de onboarding/modelo
- `catalog`: o provedor aparece em `models.providers`
- `normalizeModelId`: o provedor normaliza IDs de modelo legados/prévia antes da
  busca ou canonização
- `normalizeTransport`: o provedor normaliza `api` / `baseUrl` da família de transporte
  antes da montagem genérica do modelo; o OpenClaw verifica primeiro o provedor correspondente,
  depois outros plugins de provedor com suporte a hooks até que um realmente altere o
  transporte
- `normalizeConfig`: o provedor normaliza a configuração `models.providers.<id>` antes que o runtime a use;
  o OpenClaw verifica primeiro o provedor correspondente, depois outros plugins de provedor
  com suporte a hooks até que um realmente altere a configuração. Se nenhum
  hook de provedor reescrever a configuração, os auxiliares incluídos da família Google ainda
  normalizam entradas compatíveis de provedores Google.
- `applyNativeStreamingUsageCompat`: o provedor aplica regravações de compatibilidade de uso de streaming nativo orientadas por endpoint para provedores de configuração
- `resolveConfigApiKey`: o provedor resolve autenticação por marcador de env para provedores de configuração
  sem forçar o carregamento completo da autenticação de runtime. `amazon-bedrock` também tem um
  resolvedor integrado de marcador de env da AWS aqui, embora a autenticação de runtime do Bedrock use
  a cadeia padrão do SDK da AWS.
- `resolveSyntheticAuth`: o provedor pode expor disponibilidade de autenticação local/self-hosted ou outra
  baseada em configuração sem persistir segredos em texto simples
- `shouldDeferSyntheticProfileAuth`: o provedor pode marcar placeholders sintéticos de perfil armazenados
  com precedência menor do que autenticação baseada em env/config
- `resolveDynamicModel`: o provedor aceita IDs de modelo ainda não presentes no catálogo estático
  local
- `prepareDynamicModel`: o provedor precisa de uma atualização de metadados antes de tentar novamente
  a resolução dinâmica
- `normalizeResolvedModel`: o provedor precisa de regravações de transporte ou base URL
- `contributeResolvedModelCompat`: o provedor contribui com flags de compatibilidade para seus
  modelos do fornecedor, mesmo quando eles chegam por outro transporte compatível
- `capabilities`: o provedor publica particularidades de transcrição/ferramentas/família de provedor
- `normalizeToolSchemas`: o provedor limpa schemas de ferramentas antes que o
  executor embutido os veja
- `inspectToolSchemas`: o provedor expõe avisos de schema específicos do transporte
  após a normalização
- `resolveReasoningOutputMode`: o provedor escolhe contratos nativos vs marcados
  de saída de raciocínio
- `prepareExtraParams`: o provedor define padrões ou normaliza parâmetros de requisição por modelo
- `createStreamFn`: o provedor substitui o caminho normal de stream por um transporte
  totalmente personalizado
- `wrapStreamFn`: o provedor aplica wrappers de compatibilidade de cabeçalhos/corpo/modelo na requisição
- `resolveTransportTurnState`: o provedor fornece cabeçalhos nativos de transporte por turno
  ou metadados
- `resolveWebSocketSessionPolicy`: o provedor fornece cabeçalhos nativos de sessão WebSocket
  ou política de cooldown da sessão
- `createEmbeddingProvider`: o provedor controla o comportamento de embedding de memória quando ele
  pertence ao plugin de provedor em vez do comutador central de embeddings do core
- `formatApiKey`: o provedor formata perfis de autenticação armazenados na string
  `apiKey` de runtime esperada pelo transporte
- `refreshOAuth`: o provedor controla a atualização de OAuth quando os atualizadores compartilhados
  de `pi-ai` não são suficientes
- `buildAuthDoctorHint`: o provedor acrescenta orientação de reparo quando a atualização de OAuth
  falha
- `matchesContextOverflowError`: o provedor reconhece erros de overflow da janela de contexto
  específicos do provedor que heurísticas genéricas não detectariam
- `classifyFailoverReason`: o provedor mapeia erros brutos de transporte/API específicos do provedor
  para motivos de failover, como limite de taxa ou sobrecarga
- `isCacheTtlEligible`: o provedor decide quais IDs de modelo upstream oferecem suporte a TTL de cache de prompt
- `buildMissingAuthMessage`: o provedor substitui o erro genérico do armazenamento de autenticação
  por uma dica de recuperação específica do provedor
- `suppressBuiltInModel`: o provedor oculta linhas upstream desatualizadas e pode retornar um
  erro controlado pelo fornecedor para falhas de resolução direta
- `augmentModelCatalog`: o provedor acrescenta linhas sintéticas/finais ao catálogo após
  descoberta e mesclagem de configuração
- `resolveThinkingProfile`: o provedor controla o conjunto exato de níveis `/think`,
  rótulos opcionais de exibição e o nível padrão para um modelo selecionado
- `isBinaryThinking`: hook de compatibilidade para UX de raciocínio binário ligado/desligado
- `supportsXHighThinking`: hook de compatibilidade para modelos `xhigh` selecionados
- `resolveDefaultThinkingLevel`: hook de compatibilidade para política padrão de `/think`
- `applyConfigDefaults`: o provedor aplica padrões globais específicos do provedor
  durante a materialização da configuração com base no modo de autenticação, env ou família de modelo
- `isModernModelRef`: o provedor controla a correspondência de modelo preferido em live/smoke
- `prepareRuntimeAuth`: o provedor transforma uma credencial configurada em um token de runtime
  de curta duração
- `resolveUsageAuth`: o provedor resolve credenciais de uso/cota para `/usage`
  e superfícies relacionadas de status/relatórios
- `fetchUsageSnapshot`: o provedor controla a busca/análise do endpoint de uso, enquanto
  o core continua controlando a estrutura de resumo e a formatação
- `onModelSelected`: o provedor executa efeitos colaterais após a seleção do modelo, como
  telemetria ou bookkeeping de sessão controlado pelo provedor

Exemplos incluídos atualmente:

- `anthropic`: fallback de compatibilidade futura para Claude 4.6, dicas de reparo de autenticação, busca de endpoint de uso, metadados de TTL de cache/família de provedor e padrões globais de configuração sensíveis à autenticação
- `amazon-bedrock`: correspondência de overflow de contexto controlada pelo provedor e classificação de motivo de failover para erros específicos do Bedrock de throttle/não pronto, além da família compartilhada de replay `anthropic-by-model` para proteções de política de replay somente de Claude em tráfego Anthropic
- `anthropic-vertex`: proteções de política de replay somente de Claude em tráfego de mensagens Anthropic
- `openrouter`: IDs de modelo pass-through, wrappers de requisição, dicas de capacidade do provedor, saneamento de assinatura de pensamento do Gemini em tráfego Gemini via proxy, injeção de raciocínio via proxy por meio da família de stream `openrouter-thinking`, encaminhamento de metadados de roteamento e política de TTL de cache
- `github-copilot`: onboarding/login por dispositivo, fallback de modelo com compatibilidade futura, dicas de transcrição para Claude-thinking, troca de token em runtime e busca de endpoint de uso
- `openai`: fallback de compatibilidade futura para GPT-5.4, normalização de transporte OpenAI direto, dicas de autenticação ausente com reconhecimento de Codex, supressão do Spark, linhas sintéticas de catálogo OpenAI/Codex, política de thinking/modelo live, normalização de aliases de token de uso (`input` / `output` e famílias `prompt` / `completion`), a família compartilhada de stream `openai-responses-defaults` para wrappers nativos OpenAI/Codex, metadados de família de provedor, registro incluído de provedor de geração de imagem para `gpt-image-2` e registro incluído de provedor de geração de vídeo para `sora-2`
- `google` e `google-gemini-cli`: fallback de compatibilidade futura para Gemini 3.1, validação nativa de replay do Gemini, saneamento de replay de bootstrap, modo de saída de raciocínio com tags, correspondência de modelo moderno, registro incluído de provedor de geração de imagem para modelos Gemini image-preview e registro incluído de provedor de geração de vídeo para modelos Veo; o OAuth do Gemini CLI também controla a formatação do token do perfil de autenticação, a análise do token de uso e a busca do endpoint de cota para superfícies de uso
- `moonshot`: transporte compartilhado, normalização da carga de thinking controlada pelo plugin
- `kilocode`: transporte compartilhado, cabeçalhos de requisição controlados pelo plugin, normalização da carga de raciocínio, saneamento de assinatura de pensamento do proxy-Gemini e política de TTL de cache
- `zai`: fallback de compatibilidade futura para GLM-5, padrões de `tool_stream`, política de TTL de cache, política binária de thinking/modelo live e autenticação de uso + busca de cota; IDs desconhecidos `glm-5*` são sintetizados a partir do modelo incluído `glm-4.7`
- `xai`: normalização nativa do transporte Responses, regravações de alias `/fast` para variantes rápidas do Grok, padrão `tool_stream`, limpeza específica do xAI de schema de ferramenta/carga de raciocínio e registro incluído de provedor de geração de vídeo para `grok-imagine-video`
- `mistral`: metadados de capacidade controlados pelo plugin
- `opencode` e `opencode-go`: metadados de capacidade controlados pelo plugin mais saneamento de assinatura de pensamento do proxy-Gemini
- `alibaba`: catálogo de geração de vídeo controlado pelo plugin para referências diretas de modelos Wan, como `alibaba/wan2.6-t2v`
- `byteplus`: catálogos controlados pelo plugin mais registro incluído de provedor de geração de vídeo para modelos Seedance de texto para vídeo/imagem para vídeo
- `fal`: registro incluído de provedor de geração de vídeo para hospedado de terceiros e registro incluído de provedor de geração de imagem para modelos de imagem FLUX mais registro incluído de provedor de geração de vídeo para modelos de vídeo hospedados de terceiros
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` e `volcengine`:
  apenas catálogos controlados pelo plugin
- `qwen`: catálogos controlados pelo plugin para modelos de texto mais registros compartilhados de provedor de compreensão de mídia e geração de vídeo para suas superfícies multimodais; a geração de vídeo do Qwen usa endpoints de vídeo Standard DashScope com modelos Wan incluídos, como `wan2.6-t2v` e `wan2.7-r2v`
- `runway`: registro de provedor de geração de vídeo controlado pelo plugin para modelos nativos baseados em tarefa do Runway, como `gen4.5`
- `minimax`: catálogos controlados pelo plugin, registro incluído de provedor de geração de vídeo para modelos de vídeo Hailuo, registro incluído de provedor de geração de imagem para `image-01`, seleção híbrida de política de replay Anthropic/OpenAI e lógica de autenticação/snapshot de uso
- `together`: catálogos controlados pelo plugin mais registro incluído de provedor de geração de vídeo para modelos de vídeo Wan
- `xiaomi`: catálogos controlados pelo plugin mais lógica de autenticação/snapshot de uso

O plugin `openai` incluído agora controla ambos os IDs de provedor: `openai` e
`openai-codex`.

Isso cobre provedores que ainda se encaixam nos transportes normais do OpenClaw. Um provedor
que precise de um executor de requisição totalmente personalizado é uma superfície de extensão
separada e mais profunda.

## Rotação de chave de API

- Oferece suporte à rotação genérica de provedor para provedores selecionados.
- Configure várias chaves por meio de:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (substituição live única, prioridade mais alta)
  - `<PROVIDER>_API_KEYS` (lista separada por vírgula ou ponto e vírgula)
  - `<PROVIDER>_API_KEY` (chave principal)
  - `<PROVIDER>_API_KEY_*` (lista numerada, por exemplo `<PROVIDER>_API_KEY_1`)
- Para provedores Google, `GOOGLE_API_KEY` também é incluída como fallback.
- A ordem de seleção de chaves preserva a prioridade e remove valores duplicados.
- As requisições são tentadas novamente com a próxima chave apenas em respostas de limite de taxa (por
  exemplo `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` ou mensagens periódicas de limite de uso).
- Falhas que não sejam de limite de taxa falham imediatamente; nenhuma rotação de chave é tentada.
- Quando todas as chaves candidatas falham, o erro final da última tentativa é retornado.

## Provedores integrados (catálogo pi-ai)

O OpenClaw inclui o catálogo pi‑ai. Esses provedores não exigem configuração em
`models.providers`; basta definir a autenticação + escolher um modelo.

### OpenAI

- Provedor: `openai`
- Autenticação: `OPENAI_API_KEY`
- Rotação opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, mais `OPENCLAW_LIVE_OPENAI_KEY` (substituição única)
- Modelos de exemplo: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- O transporte padrão é `auto` (WebSocket primeiro, fallback para SSE)
- Substitua por modelo via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- O warm-up de WebSocket do OpenAI Responses vem ativado por padrão via `params.openaiWsWarmup` (`true`/`false`)
- O processamento prioritário do OpenAI pode ser ativado via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mapeiam requisições diretas `openai/*` Responses para `service_tier=priority` em `api.openai.com`
- Use `params.serviceTier` quando quiser um tier explícito em vez da alternância compartilhada `/fast`
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`,
  `User-Agent`) se aplicam apenas em tráfego OpenAI nativo para `api.openai.com`, não
  em proxies genéricos compatíveis com OpenAI
- Rotas OpenAI nativas também preservam `store` do Responses, dicas de cache de prompt e modelagem de carga de compatibilidade de raciocínio do OpenAI; rotas de proxy não
- `openai/gpt-5.3-codex-spark` é intencionalmente suprimido no OpenClaw porque a API OpenAI live o rejeita; Spark é tratado como somente Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provedor: `anthropic`
- Autenticação: `ANTHROPIC_API_KEY`
- Rotação opcional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, mais `OPENCLAW_LIVE_ANTHROPIC_KEY` (substituição única)
- Modelo de exemplo: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Requisições Anthropic públicas diretas também oferecem suporte à alternância compartilhada `/fast` e `params.fastMode`, incluindo tráfego autenticado por chave de API e OAuth enviado para `api.anthropic.com`; o OpenClaw mapeia isso para `service_tier` do Anthropic (`auto` vs `standard_only`)
- Observação sobre Anthropic: a equipe da Anthropic nos informou que o uso no estilo Claude CLI do OpenClaw é novamente permitido, então o OpenClaw trata a reutilização do Claude CLI e o uso de `claude -p` como autorizados para essa integração, a menos que a Anthropic publique uma nova política.
- O token de configuração do Anthropic continua disponível como um caminho de token compatível no OpenClaw, mas o OpenClaw agora prefere a reutilização do Claude CLI e `claude -p` quando disponíveis.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Provedor: `openai-codex`
- Autenticação: OAuth (ChatGPT)
- Modelo de exemplo: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` ou `openclaw models auth login --provider openai-codex`
- O transporte padrão é `auto` (WebSocket primeiro, fallback para SSE)
- Substitua por modelo via `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- `params.serviceTier` também é encaminhado em requisições nativas Codex Responses (`chatgpt.com/backend-api`)
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`,
  `User-Agent`) são anexados apenas em tráfego Codex nativo para
  `chatgpt.com/backend-api`, não em proxies genéricos compatíveis com OpenAI
- Compartilha a mesma alternância `/fast` e configuração `params.fastMode` de `openai/*` direto; o OpenClaw mapeia isso para `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` continua disponível quando o catálogo OAuth do Codex o expõe; depende de entitlement
- `openai-codex/gpt-5.4` mantém `contextWindow = 1050000` nativo e `contextTokens = 272000` como padrão de runtime; substitua o limite de runtime com `models.providers.openai-codex.models[].contextTokens`
- Observação de política: o OAuth do OpenAI Codex é explicitamente compatível com ferramentas/fluxos de trabalho externos como o OpenClaw.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.4", contextTokens: 160000 }],
      },
    },
  },
}
```

### Outras opções hospedadas no estilo de assinatura

- [Qwen Cloud](/pt-BR/providers/qwen): superfície do provedor Qwen Cloud mais mapeamento de endpoint Alibaba DashScope e Coding Plan
- [MiniMax](/pt-BR/providers/minimax): OAuth do MiniMax Coding Plan ou acesso por chave de API
- [GLM Models](/pt-BR/providers/glm): Z.AI Coding Plan ou endpoints gerais de API

### OpenCode

- Autenticação: `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`)
- Provedor de runtime Zen: `opencode`
- Provedor de runtime Go: `opencode-go`
- Modelos de exemplo: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` ou `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (chave de API)

- Provedor: `google`
- Autenticação: `GEMINI_API_KEY`
- Rotação opcional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (substituição única)
- Modelos de exemplo: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilidade: configuração legada do OpenClaw usando `google/gemini-3.1-flash-preview` é normalizada para `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Execuções diretas do Gemini também aceitam `agents.defaults.models["google/<model>"].params.cachedContent`
  (ou legado `cached_content`) para encaminhar um handle nativo do provedor
  `cachedContents/...`; acertos de cache do Gemini aparecem como `cacheRead` no OpenClaw

### Google Vertex e Gemini CLI

- Provedores: `google-vertex`, `google-gemini-cli`
- Autenticação: Vertex usa gcloud ADC; Gemini CLI usa seu fluxo OAuth
- Cuidado: o OAuth do Gemini CLI no OpenClaw é uma integração não oficial. Alguns usuários relataram restrições na conta Google após usar clientes de terceiros. Revise os termos do Google e use uma conta não crítica se decidir prosseguir.
- O OAuth do Gemini CLI é distribuído como parte do plugin `google` incluído.
  - Instale o Gemini CLI primeiro:
    - `brew install gemini-cli`
    - ou `npm install -g @google/gemini-cli`
  - Ative: `openclaw plugins enable google`
  - Login: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Modelo padrão: `google-gemini-cli/gemini-3-flash-preview`
  - Observação: você **não** cola um client id nem um secret em `openclaw.json`. O fluxo de login da CLI armazena
    tokens em perfis de autenticação no host do gateway.
  - Se as requisições falharem após o login, defina `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` no host do gateway.
  - Respostas JSON do Gemini CLI são analisadas a partir de `response`; o uso usa fallback para
    `stats`, com `stats.cached` normalizado para `cacheRead` no OpenClaw.

### Z.AI (GLM)

- Provedor: `zai`
- Autenticação: `ZAI_API_KEY`
- Modelo de exemplo: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliases: `z.ai/*` e `z-ai/*` são normalizados para `zai/*`
  - `zai-api-key` detecta automaticamente o endpoint correspondente do Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` e `zai-cn` forçam uma superfície específica

### Vercel AI Gateway

- Provedor: `vercel-ai-gateway`
- Autenticação: `AI_GATEWAY_API_KEY`
- Modelos de exemplo: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provedor: `kilocode`
- Autenticação: `KILOCODE_API_KEY`
- Modelo de exemplo: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL base: `https://api.kilo.ai/api/gateway/`
- O catálogo estático de fallback inclui `kilocode/kilo/auto`; a descoberta live em
  `https://api.kilo.ai/api/gateway/models` pode expandir ainda mais o catálogo
  de runtime.
- O roteamento upstream exato por trás de `kilocode/kilo/auto` é controlado pelo Kilo Gateway,
  não codificado diretamente no OpenClaw.

Consulte [/providers/kilocode](/pt-BR/providers/kilocode) para detalhes de configuração.

### Outros plugins de provedor incluídos

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Modelos de exemplo: `openrouter/auto`, `openrouter/moonshotai/kimi-k2.6`
- O OpenClaw aplica os cabeçalhos documentados de atribuição de app do OpenRouter apenas quando
  a requisição realmente tem como destino `openrouter.ai`
- Os marcadores `cache_control` específicos do OpenRouter para Anthropic também são restritos a
  rotas OpenRouter verificadas, não URLs arbitrárias de proxy
- O OpenRouter permanece no caminho de proxy em estilo compatível com OpenAI, então
  a modelagem de requisição exclusiva do OpenAI nativo (`serviceTier`, `store` do Responses,
  dicas de cache de prompt, cargas de compatibilidade de raciocínio do OpenAI) não é encaminhada
- Referências OpenRouter com backend Gemini mantêm apenas o saneamento de assinatura de pensamento do Gemini via proxy;
  a validação nativa de replay do Gemini e as regravações de bootstrap permanecem desativadas
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Modelo de exemplo: `kilocode/kilo/auto`
- Referências Kilo com backend Gemini mantêm o mesmo caminho de saneamento de assinatura de pensamento do Gemini via proxy;
  `kilocode/kilo/auto` e outras dicas sem suporte a raciocínio por proxy ignoram a injeção de raciocínio por proxy
- MiniMax: `minimax` (chave de API) e `minimax-portal` (OAuth)
- Autenticação: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` ou `MINIMAX_API_KEY` para `minimax-portal`
- Modelo de exemplo: `minimax/MiniMax-M2.7` ou `minimax-portal/MiniMax-M2.7`
- A configuração de onboarding/chave de API do MiniMax grava definições explícitas do modelo M2.7 com
  `input: ["text", "image"]`; o catálogo do provedor incluído mantém as referências de chat
  somente texto até que a configuração desse provedor seja materializada
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Modelo de exemplo: `moonshot/kimi-k2.6`
- Kimi Coding: `kimi` (`KIMI_API_KEY` ou `KIMICODE_API_KEY`)
- Modelo de exemplo: `kimi/kimi-code`
- Qianfan: `qianfan` (`QIANFAN_API_KEY`)
- Modelo de exemplo: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen` (`QWEN_API_KEY`, `MODELSTUDIO_API_KEY` ou `DASHSCOPE_API_KEY`)
- Modelo de exemplo: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia` (`NVIDIA_API_KEY`)
- Modelo de exemplo: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan` (`STEPFUN_API_KEY`)
- Modelos de exemplo: `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
- Together: `together` (`TOGETHER_API_KEY`)
- Modelo de exemplo: `together/moonshotai/Kimi-K2.5`
- Venice: `venice` (`VENICE_API_KEY`)
- Xiaomi: `xiaomi` (`XIAOMI_API_KEY`)
- Modelo de exemplo: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`)
- Cloudflare AI Gateway: `cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: `volcengine` (`VOLCANO_ENGINE_API_KEY`)
- Modelo de exemplo: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus` (`BYTEPLUS_API_KEY`)
- Modelo de exemplo: `byteplus-plan/ark-code-latest`
- xAI: `xai` (`XAI_API_KEY`)
  - Requisições xAI nativas incluídas usam o caminho xAI Responses
  - `/fast` ou `params.fastMode: true` regravam `grok-3`, `grok-3-mini`,
    `grok-4` e `grok-4-0709` para suas variantes `*-fast`
  - `tool_stream` vem ativado por padrão; defina
    `agents.defaults.models["xai/<model>"].params.tool_stream` como `false` para
    desativá-lo
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Modelo de exemplo: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Modelos GLM no Cerebras usam IDs `zai-glm-4.7` e `zai-glm-4.6`.
  - URL base compatível com OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Modelo de exemplo do Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Consulte [Hugging Face (Inference)](/pt-BR/providers/huggingface).

## Provedores via `models.providers` (personalizado/base URL)

Use `models.providers` (ou `models.json`) para adicionar provedores **personalizados** ou
proxies compatíveis com OpenAI/Anthropic.

Muitos dos plugins de provedor incluídos abaixo já publicam um catálogo padrão.
Use entradas explícitas `models.providers.<id>` apenas quando quiser substituir a
URL base, os cabeçalhos ou a lista de modelos padrão.

### Moonshot AI (Kimi)

O Moonshot é distribuído como um plugin de provedor incluído. Use o provedor integrado por
padrão e adicione uma entrada explícita `models.providers.moonshot` apenas quando
precisar substituir a URL base ou os metadados do modelo:

- Provedor: `moonshot`
- Autenticação: `MOONSHOT_API_KEY`
- Modelo de exemplo: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` ou `openclaw onboard --auth-choice moonshot-api-key-cn`

IDs de modelo do Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi Coding

O Kimi Coding usa o endpoint compatível com Anthropic da Moonshot AI:

- Provedor: `kimi`
- Autenticação: `KIMI_API_KEY`
- Modelo de exemplo: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

O legado `kimi/k2p5` continua aceito como ID de modelo de compatibilidade.

### Volcano Engine (Doubao)

O Volcano Engine (火山引擎) fornece acesso ao Doubao e a outros modelos na China.

- Provedor: `volcengine` (coding: `volcengine-plan`)
- Autenticação: `VOLCANO_ENGINE_API_KEY`
- Modelo de exemplo: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

O onboarding usa por padrão a superfície de coding, mas o catálogo geral `volcengine/*`
é registrado ao mesmo tempo.

Nos seletores de modelo de onboarding/configuração, a opção de autenticação do Volcengine prefere linhas
`volcengine/*` e `volcengine-plan/*`. Se esses modelos ainda não estiverem carregados,
o OpenClaw usa como fallback o catálogo sem filtro, em vez de mostrar um seletor
vazio com escopo de provedor.

Modelos disponíveis:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Modelos de coding (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (internacional)

O BytePlus ARK fornece acesso aos mesmos modelos do Volcano Engine para usuários internacionais.

- Provedor: `byteplus` (coding: `byteplus-plan`)
- Autenticação: `BYTEPLUS_API_KEY`
- Modelo de exemplo: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

O onboarding usa por padrão a superfície de coding, mas o catálogo geral `byteplus/*`
é registrado ao mesmo tempo.

Nos seletores de modelo de onboarding/configuração, a opção de autenticação do BytePlus prefere linhas
`byteplus/*` e `byteplus-plan/*`. Se esses modelos ainda não estiverem carregados,
o OpenClaw usa como fallback o catálogo sem filtro, em vez de mostrar um seletor
vazio com escopo de provedor.

Modelos disponíveis:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Modelos de coding (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

O Synthetic fornece modelos compatíveis com Anthropic por trás do provedor `synthetic`:

- Provedor: `synthetic`
- Autenticação: `SYNTHETIC_API_KEY`
- Modelo de exemplo: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

O MiniMax é configurado via `models.providers` porque usa endpoints personalizados:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax chave de API (Global): `--auth-choice minimax-global-api`
- MiniMax chave de API (CN): `--auth-choice minimax-cn-api`
- Autenticação: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` ou
  `MINIMAX_API_KEY` para `minimax-portal`

Consulte [/providers/minimax](/pt-BR/providers/minimax) para detalhes de configuração, opções de modelo e snippets de configuração.

No caminho de streaming compatível com Anthropic do MiniMax, o OpenClaw desativa thinking por
padrão, a menos que você o defina explicitamente, e `/fast on` regrava
`MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.

Divisão de capacidades controlada pelo plugin:

- Os padrões de texto/chat permanecem em `minimax/MiniMax-M2.7`
- A geração de imagem é `minimax/image-01` ou `minimax-portal/image-01`
- A compreensão de imagem é `MiniMax-VL-01`, controlada pelo plugin, em ambos os caminhos de autenticação do MiniMax
- A pesquisa na web permanece no ID de provedor `minimax`

### LM Studio

O LM Studio é distribuído como um plugin de provedor incluído que usa a API nativa:

- Provedor: `lmstudio`
- Autenticação: `LM_API_TOKEN`
- URL base padrão de inferência: `http://localhost:1234/v1`

Depois, defina um modelo (substitua por um dos IDs retornados por `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

O OpenClaw usa `/api/v1/models` e `/api/v1/models/load` nativos do LM Studio
para descoberta + carregamento automático, com `/v1/chat/completions` para inferência por padrão.
Consulte [/providers/lmstudio](/pt-BR/providers/lmstudio) para configuração e solução de problemas.

### Ollama

O Ollama é distribuído como um plugin de provedor incluído e usa a API nativa do Ollama:

- Provedor: `ollama`
- Autenticação: nenhuma necessária (servidor local)
- Modelo de exemplo: `ollama/llama3.3`
- Instalação: [https://ollama.com/download](https://ollama.com/download)

```bash
# Instale o Ollama e depois baixe um modelo:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

O Ollama é detectado localmente em `http://127.0.0.1:11434` quando você opta por isso com
`OLLAMA_API_KEY`, e o plugin de provedor incluído adiciona o Ollama diretamente ao
`openclaw onboard` e ao seletor de modelos. Consulte [/providers/ollama](/pt-BR/providers/ollama)
para onboarding, modo cloud/local e configuração personalizada.

### vLLM

O vLLM é distribuído como um plugin de provedor incluído para servidores
locais/self-hosted compatíveis com OpenAI:

- Provedor: `vllm`
- Autenticação: opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:8000/v1`

Para optar pela descoberta automática localmente (qualquer valor funciona se seu servidor não exigir autenticação):

```bash
export VLLM_API_KEY="vllm-local"
```

Depois, defina um modelo (substitua por um dos IDs retornados por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Consulte [/providers/vllm](/pt-BR/providers/vllm) para detalhes.

### SGLang

O SGLang é distribuído como um plugin de provedor incluído para servidores
rápidos self-hosted compatíveis com OpenAI:

- Provedor: `sglang`
- Autenticação: opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:30000/v1`

Para optar pela descoberta automática localmente (qualquer valor funciona se seu servidor não
exigir autenticação):

```bash
export SGLANG_API_KEY="sglang-local"
```

Depois, defina um modelo (substitua por um dos IDs retornados por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Consulte [/providers/sglang](/pt-BR/providers/sglang) para detalhes.

### Proxies locais (LM Studio, vLLM, LiteLLM etc.)

Exemplo (compatível com OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Observações:

- Para provedores personalizados, `reasoning`, `input`, `cost`, `contextWindow` e `maxTokens` são opcionais.
  Quando omitidos, o OpenClaw usa como padrão:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Recomendado: defina valores explícitos que correspondam aos limites do seu proxy/modelo.
- Para `api: "openai-completions"` em endpoints não nativos (qualquer `baseUrl` não vazio cujo host não seja `api.openai.com`), o OpenClaw força `compat.supportsDeveloperRole: false` para evitar erros 400 do provedor para papéis `developer` sem suporte.
- Rotas em estilo proxy compatíveis com OpenAI também ignoram a modelagem de requisição exclusiva do OpenAI nativo: sem `service_tier`, sem `store` do Responses, sem dicas de cache de prompt, sem modelagem de carga de compatibilidade de raciocínio do OpenAI e sem cabeçalhos ocultos de atribuição do OpenClaw.
- Se `baseUrl` estiver vazio/omitido, o OpenClaw mantém o comportamento padrão do OpenAI (que resolve para `api.openai.com`).
- Por segurança, um `compat.supportsDeveloperRole: true` explícito ainda é sobrescrito em endpoints não nativos `openai-completions`.

## Exemplos de CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Consulte também: [/gateway/configuration](/pt-BR/gateway/configuration) para exemplos completos de configuração.

## Relacionado

- [Models](/pt-BR/concepts/models) — configuração de modelo e aliases
- [Model Failover](/pt-BR/concepts/model-failover) — cadeias de fallback e comportamento de nova tentativa
- [Configuration Reference](/pt-BR/gateway/configuration-reference#agent-defaults) — chaves de configuração de modelo
- [Providers](/pt-BR/providers) — guias de configuração por provedor
