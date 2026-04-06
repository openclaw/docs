---
read_when:
    - Você precisa de uma referência de configuração de modelos por provedor
    - Você quer configurações de exemplo ou comandos de onboarding da CLI para provedores de modelo
summary: Visão geral dos provedores de modelo com configurações de exemplo + fluxos da CLI
title: Provedores de modelo
x-i18n:
    generated_at: "2026-04-06T03:08:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15e4b82e07221018a723279d309e245bb4023bc06e64b3c910ef2cae3dfa2599
    source_path: concepts/model-providers.md
    workflow: 15
---

# Provedores de modelo

Esta página cobre **provedores de LLM/modelo** (não canais de chat como WhatsApp/Telegram).
Para regras de seleção de modelos, consulte [/concepts/models](/pt-BR/concepts/models).

## Regras rápidas

- Referências de modelo usam `provider/model` (exemplo: `opencode/claude-opus-4-6`).
- Se você definir `agents.defaults.models`, isso se tornará a allowlist.
- Auxiliares da CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Regras de fallback em runtime, sondas de cooldown e persistência de substituições de sessão
  estão documentadas em [/concepts/model-failover](/pt-BR/concepts/model-failover).
- `models.providers.*.models[].contextWindow` é metadado nativo do modelo;
  `models.providers.*.models[].contextTokens` é o limite efetivo em runtime.
- Plugins de provedor podem injetar catálogos de modelo via `registerProvider({ catalog })`;
  o OpenClaw mescla essa saída em `models.providers` antes de gravar
  `models.json`.
- Manifests de provedor podem declarar `providerAuthEnvVars` para que sondas genéricas
  de autenticação baseadas em env não precisem carregar o runtime do plugin. O mapa restante
  de variáveis de ambiente do core agora existe apenas para provedores não baseados em plugin/core e para alguns casos
  genéricos de precedência, como onboarding do Anthropic priorizando chave de API.
- Plugins de provedor também podem controlar o comportamento de runtime do provedor via
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
  `augmentModelCatalog`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, e
  `onModelSelected`.
- Observação: `capabilities` no runtime do provedor são metadados compartilhados do runner (família do provedor,
  peculiaridades de transcrição/ferramentas, dicas de transporte/cache). Isso não é a
  mesma coisa que o [modelo público de capacidades](/pt-BR/plugins/architecture#public-capability-model),
  que descreve o que um plugin registra (inferência de texto, fala etc.).

## Comportamento de provedor controlado por plugin

Agora os plugins de provedor podem controlar a maior parte da lógica específica de cada provedor, enquanto o OpenClaw mantém
o loop genérico de inferência.

Divisão típica:

- `auth[].run` / `auth[].runNonInteractive`: o provedor controla os fluxos de onboarding/login
  para `openclaw onboard`, `openclaw models auth` e configuração headless
- `wizard.setup` / `wizard.modelPicker`: o provedor controla rótulos de escolha de autenticação,
  aliases legados, dicas de allowlist de onboarding e entradas de configuração em seletores de onboarding/modelo
- `catalog`: o provedor aparece em `models.providers`
- `normalizeModelId`: o provedor normaliza ids de modelo legados/preview antes da
  busca ou canonização
- `normalizeTransport`: o provedor normaliza `api` / `baseUrl` da família de transporte
  antes da montagem genérica do modelo; o OpenClaw verifica primeiro o provedor correspondente,
  depois outros plugins de provedor com suporte a hook até que um deles realmente altere o
  transporte
- `normalizeConfig`: o provedor normaliza a configuração de `models.providers.<id>` antes que
  o runtime a use; o OpenClaw verifica primeiro o provedor correspondente, depois outros
  plugins de provedor com suporte a hook até que um deles realmente altere a configuração. Se nenhum
  hook de provedor reescrever a configuração, os auxiliares empacotados da família Google ainda
  normalizam as entradas de provedor Google compatíveis.
- `applyNativeStreamingUsageCompat`: o provedor aplica regravações de compatibilidade de uso de streaming nativo orientadas pelo endpoint para provedores configurados
- `resolveConfigApiKey`: o provedor resolve autenticação por marcador de env para provedores configurados
  sem forçar o carregamento completo da autenticação em runtime. `amazon-bedrock` também tem um
  resolvedor embutido de marcador de env da AWS aqui, embora a autenticação em runtime do Bedrock use
  a cadeia padrão do SDK da AWS.
- `resolveSyntheticAuth`: o provedor pode expor disponibilidade de autenticação local/self-hosted ou outra autenticação
  baseada em configuração sem persistir segredos em texto puro
- `shouldDeferSyntheticProfileAuth`: o provedor pode marcar placeholders de perfil sintético armazenados
  como de precedência menor que autenticação baseada em env/configuração
- `resolveDynamicModel`: o provedor aceita ids de modelo que ainda não estão presentes no
  catálogo estático local
- `prepareDynamicModel`: o provedor precisa de uma atualização de metadados antes de tentar novamente
  a resolução dinâmica
- `normalizeResolvedModel`: o provedor precisa de regravações de transporte ou base URL
- `contributeResolvedModelCompat`: o provedor contribui com flags de compatibilidade para seus
  modelos do fornecedor mesmo quando eles chegam por outro transporte compatível
- `capabilities`: o provedor publica peculiaridades de transcrição/ferramentas/família de provedor
- `normalizeToolSchemas`: o provedor limpa schemas de ferramenta antes que o
  runner embutido os veja
- `inspectToolSchemas`: o provedor expõe avisos de schema específicos de transporte
  após a normalização
- `resolveReasoningOutputMode`: o provedor escolhe contratos de saída de raciocínio
  nativos versus marcados
- `prepareExtraParams`: o provedor define padrões ou normaliza parâmetros de solicitação por modelo
- `createStreamFn`: o provedor substitui o caminho normal de stream por um transporte
  totalmente personalizado
- `wrapStreamFn`: o provedor aplica wrappers de compatibilidade de cabeçalhos/corpo/modelo à solicitação
- `resolveTransportTurnState`: o provedor fornece cabeçalhos ou metadados nativos de transporte
  por turno
- `resolveWebSocketSessionPolicy`: o provedor fornece cabeçalhos nativos de sessão WebSocket
  ou política de cooldown da sessão
- `createEmbeddingProvider`: o provedor controla o comportamento de embeddings de memória quando isso
  deve ficar com o plugin do provedor em vez do comutador central de embeddings do core
- `formatApiKey`: o provedor formata perfis de autenticação armazenados na string
  `apiKey` em runtime esperada pelo transporte
- `refreshOAuth`: o provedor controla a atualização de OAuth quando os refreshers compartilhados de `pi-ai`
  não são suficientes
- `buildAuthDoctorHint`: o provedor acrescenta orientações de reparo quando a atualização de OAuth
  falha
- `matchesContextOverflowError`: o provedor reconhece erros de estouro de janela de contexto
  específicos do provedor que heurísticas genéricas não detectariam
- `classifyFailoverReason`: o provedor mapeia erros brutos específicos do provedor de transporte/API
  para motivos de failover, como limite de taxa ou sobrecarga
- `isCacheTtlEligible`: o provedor decide quais ids de modelo upstream oferecem suporte a TTL de cache de prompt
- `buildMissingAuthMessage`: o provedor substitui o erro genérico do armazenamento de autenticação
  por uma dica de recuperação específica do provedor
- `suppressBuiltInModel`: o provedor oculta linhas upstream obsoletas e pode retornar um
  erro controlado pelo fornecedor para falhas de resolução direta
- `augmentModelCatalog`: o provedor acrescenta linhas sintéticas/finais ao catálogo após
  descoberta e mesclagem da configuração
- `isBinaryThinking`: o provedor controla a UX de thinking binário ligado/desligado
- `supportsXHighThinking`: o provedor habilita `xhigh` para modelos selecionados
- `resolveDefaultThinkingLevel`: o provedor controla a política padrão de `/think` para uma
  família de modelos
- `applyConfigDefaults`: o provedor aplica padrões globais específicos do provedor
  durante a materialização da configuração com base no modo de autenticação, env ou família de modelo
- `isModernModelRef`: o provedor controla a correspondência de modelo preferido para live/smoke
- `prepareRuntimeAuth`: o provedor transforma uma credencial configurada em um token de runtime
  de curta duração
- `resolveUsageAuth`: o provedor resolve credenciais de uso/cota para `/usage`
  e superfícies relacionadas de status/relatórios
- `fetchUsageSnapshot`: o provedor controla a busca/parsing do endpoint de uso enquanto
  o core ainda controla o shell de resumo e a formatação
- `onModelSelected`: o provedor executa efeitos colaterais pós-seleção como
  telemetria ou bookkeeping de sessão controlado pelo provedor

Exemplos empacotados atuais:

- `anthropic`: fallback de compatibilidade futura do Claude 4.6, dicas de reparo de autenticação, busca
  de endpoint de uso, metadados de cache-TTL/família do provedor e padrões globais de
  configuração sensíveis à autenticação
- `amazon-bedrock`: correspondência de estouro de contexto controlada pelo provedor e classificação do
  motivo de failover para erros específicos do Bedrock de throttle/não pronto, além
  da família compartilhada de replay `anthropic-by-model` para proteções de política de replay somente de Claude
  em tráfego Anthropic
- `anthropic-vertex`: proteções de política de replay somente de Claude em tráfego de
  mensagens Anthropic
- `openrouter`: ids de modelo pass-through, wrappers de requisição, dicas de capacidade do provedor,
  saneamento de thought-signature do Gemini em tráfego proxy Gemini, injeção de raciocínio
  via proxy através da família de stream `openrouter-thinking`, encaminhamento de metadados de roteamento
  e política de cache-TTL
- `github-copilot`: onboarding/device login, fallback de modelo com compatibilidade futura,
  dicas de transcrição de thinking do Claude, troca de token em runtime e busca
  de endpoint de uso
- `openai`: fallback de compatibilidade futura do GPT-5.4, normalização de transporte
  direto do OpenAI, dicas de autenticação ausente cientes de Codex, supressão do Spark,
  linhas sintéticas de catálogo OpenAI/Codex, política de thinking/modelo live, normalização
  de alias de token de uso (`input` / `output` e famílias `prompt` / `completion`), a
  família compartilhada de stream `openai-responses-defaults` para wrappers nativos de OpenAI/Codex,
  metadados da família do provedor, registro empacotado de provedor de geração de imagem
  para `gpt-image-1` e registro empacotado de provedor de geração de vídeo
  para `sora-2`
- `google`: fallback de compatibilidade futura do Gemini 3.1, validação de replay nativa do Gemini,
  saneamento de replay de bootstrap, modo de saída de raciocínio marcado,
  correspondência de modelo moderno, registro empacotado de provedor de geração de imagem para
  modelos Gemini image-preview e registro empacotado de provedor de geração de vídeo
  para modelos Veo
- `moonshot`: transporte compartilhado, normalização de payload de thinking controlada por plugin
- `kilocode`: transporte compartilhado, cabeçalhos de requisição controlados por plugin, normalização
  de payload de raciocínio, saneamento de thought-signature de proxy-Gemini e política
  de cache-TTL
- `zai`: fallback de compatibilidade futura do GLM-5, padrões `tool_stream`, política de cache-TTL,
  política binária de thinking/modelo live e autenticação de uso + busca de cota;
  ids `glm-5*` desconhecidos são sintetizados a partir do template empacotado `glm-4.7`
- `xai`: normalização nativa de transporte Responses, regravações de alias `/fast` para
  variantes rápidas do Grok, `tool_stream` padrão, limpeza de schema de ferramenta /
  payload de raciocínio específica da xAI e registro empacotado de provedor de geração de vídeo
  para `grok-imagine-video`
- `mistral`: metadados de capacidade controlados por plugin
- `opencode` e `opencode-go`: metadados de capacidade controlados por plugin mais
  saneamento de thought-signature de proxy-Gemini
- `alibaba`: catálogo de geração de vídeo controlado por plugin para referências diretas de modelo Wan
  como `alibaba/wan2.6-t2v`
- `byteplus`: catálogos controlados por plugin mais registro empacotado de provedor de geração de vídeo
  para modelos de texto para vídeo/imagem para vídeo Seedance
- `fal`: registro empacotado de provedor de geração de vídeo para hospedado por terceiros e
  registro empacotado de provedor de geração de imagem para modelos de imagem FLUX mais
  registro empacotado de provedor de geração de vídeo para modelos de vídeo hospedados por terceiros
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` e `volcengine`:
  apenas catálogos controlados por plugin
- `qwen`: catálogos controlados por plugin para modelos de texto mais registros compartilhados de provedor
  de media-understanding e geração de vídeo para suas superfícies multimodais; a geração de vídeo Qwen usa os
  endpoints de vídeo Standard DashScope com modelos Wan empacotados como `wan2.6-t2v` e `wan2.7-r2v`
- `runway`: registro de provedor de geração de vídeo controlado por plugin para modelos nativos
  baseados em tarefas do Runway, como `gen4.5`
- `minimax`: catálogos controlados por plugin, registro empacotado de provedor de geração de vídeo
  para modelos de vídeo Hailuo, registro empacotado de provedor de geração de imagem
  para `image-01`, seleção híbrida de política de replay Anthropic/OpenAI e lógica de autenticação/snapshot de uso
- `together`: catálogos controlados por plugin mais registro empacotado de provedor de geração de vídeo
  para modelos de vídeo Wan
- `xiaomi`: catálogos controlados por plugin mais lógica de autenticação/snapshot de uso

O plugin empacotado `openai` agora controla ambos os ids de provedor: `openai` e
`openai-codex`.

Isso cobre provedores que ainda se encaixam nos transportes normais do OpenClaw. Um provedor
que precise de um executor de requisição totalmente personalizado é uma superfície de extensão
separada e mais profunda.

## Rotação de chaves de API

- Oferece suporte à rotação genérica de provedores para provedores selecionados.
- Configure várias chaves por meio de:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (substituição live única, maior prioridade)
  - `<PROVIDER>_API_KEYS` (lista separada por vírgula ou ponto e vírgula)
  - `<PROVIDER>_API_KEY` (chave primária)
  - `<PROVIDER>_API_KEY_*` (lista numerada, por exemplo `<PROVIDER>_API_KEY_1`)
- Para provedores Google, `GOOGLE_API_KEY` também é incluída como fallback.
- A ordem de seleção de chaves preserva a prioridade e remove valores duplicados.
- As requisições são tentadas novamente com a próxima chave apenas em respostas de limite de taxa (por
  exemplo `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` ou mensagens periódicas de limite de uso).
- Falhas que não são de limite de taxa falham imediatamente; nenhuma rotação de chave é tentada.
- Quando todas as chaves candidatas falham, o erro final retornado vem da última tentativa.

## Provedores embutidos (catálogo pi-ai)

O OpenClaw vem com o catálogo pi‑ai. Esses provedores não exigem configuração em
`models.providers`; basta definir a autenticação + escolher um modelo.

### OpenAI

- Provedor: `openai`
- Auth: `OPENAI_API_KEY`
- Rotação opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, além de `OPENCLAW_LIVE_OPENAI_KEY` (substituição única)
- Modelos de exemplo: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- O transporte padrão é `auto` (WebSocket primeiro, fallback para SSE)
- Substitua por modelo via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- O aquecimento de WebSocket do OpenAI Responses vem ativado por padrão via `params.openaiWsWarmup` (`true`/`false`)
- O processamento prioritário da OpenAI pode ser ativado via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mapeiam requisições Responses diretas `openai/*` para `service_tier=priority` em `api.openai.com`
- Use `params.serviceTier` quando quiser um tier explícito em vez da alternância compartilhada `/fast`
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`,
  `User-Agent`) são aplicados apenas em tráfego OpenAI nativo para `api.openai.com`, não
  em proxies genéricos compatíveis com OpenAI
- Rotas OpenAI nativas também mantêm `store` do Responses, dicas de cache de prompt e
  modelagem de payload de compatibilidade de raciocínio do OpenAI; rotas de proxy não
- `openai/gpt-5.3-codex-spark` é intencionalmente suprimido no OpenClaw porque a API live da OpenAI o rejeita; Spark é tratado apenas como Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provedor: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Rotação opcional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, além de `OPENCLAW_LIVE_ANTHROPIC_KEY` (substituição única)
- Modelo de exemplo: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Requisições diretas públicas à Anthropic oferecem suporte à alternância compartilhada `/fast` e `params.fastMode`, incluindo tráfego autenticado por chave de API e OAuth enviado para `api.anthropic.com`; o OpenClaw mapeia isso para `service_tier` da Anthropic (`auto` vs `standard_only`)
- Observação de cobrança: para Anthropic no OpenClaw, a divisão prática é **chave de API** ou **assinatura Claude com Extra Usage**. A Anthropic notificou usuários do OpenClaw em **4 de abril de 2026 às 12:00 PM PT / 8:00 PM BST** que o caminho de login Claude do **OpenClaw** conta como uso de harness de terceiros e exige **Extra Usage** cobrado separadamente da assinatura. Nossas reproduções locais também mostram que a string de prompt de identificação do OpenClaw não se reproduz no caminho Anthropic SDK + chave de API.
- O setup-token da Anthropic está disponível novamente como um caminho legado/manual do OpenClaw. Use-o com a expectativa de que a Anthropic informou aos usuários do OpenClaw que esse caminho exige **Extra Usage**.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Provedor: `openai-codex`
- Auth: OAuth (ChatGPT)
- Modelo de exemplo: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` ou `openclaw models auth login --provider openai-codex`
- O transporte padrão é `auto` (WebSocket primeiro, fallback para SSE)
- Substitua por modelo via `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- `params.serviceTier` também é encaminhado em requisições nativas Codex Responses (`chatgpt.com/backend-api`)
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`,
  `User-Agent`) são anexados apenas no tráfego Codex nativo para
  `chatgpt.com/backend-api`, não em proxies genéricos compatíveis com OpenAI
- Compartilha a mesma alternância `/fast` e configuração `params.fastMode` do `openai/*` direto; o OpenClaw mapeia isso para `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` continua disponível quando o catálogo OAuth do Codex o expõe; depende de entitlement
- `openai-codex/gpt-5.4` mantém `contextWindow = 1050000` nativo e um `contextTokens = 272000` padrão em runtime; substitua o limite de runtime com `models.providers.openai-codex.models[].contextTokens`
- Observação de política: o OpenAI Codex OAuth tem suporte explícito para ferramentas/fluxos de trabalho externos como o OpenClaw.

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

### Outras opções hospedadas no estilo assinatura

- [Qwen Cloud](/pt-BR/providers/qwen): superfície de provedor do Qwen Cloud mais mapeamento de endpoint Alibaba DashScope e Coding Plan
- [MiniMax](/pt-BR/providers/minimax): acesso por OAuth ou chave de API ao MiniMax Coding Plan
- [GLM Models](/pt-BR/providers/glm): endpoints do Z.AI Coding Plan ou APIs gerais

### OpenCode

- Auth: `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`)
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
- Auth: `GEMINI_API_KEY`
- Rotação opcional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback para `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (substituição única)
- Modelos de exemplo: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilidade: configuração legada do OpenClaw usando `google/gemini-3.1-flash-preview` é normalizada para `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Execuções diretas do Gemini também aceitam `agents.defaults.models["google/<model>"].params.cachedContent`
  (ou o legado `cached_content`) para encaminhar um handle nativo do provedor
  `cachedContents/...`; acertos de cache do Gemini aparecem como `cacheRead` no OpenClaw

### Google Vertex

- Provedor: `google-vertex`
- Auth: gcloud ADC
  - Respostas JSON do Gemini CLI são analisadas a partir de `response`; o uso recorre a
    `stats`, com `stats.cached` normalizado para `cacheRead` do OpenClaw.

### Z.AI (GLM)

- Provedor: `zai`
- Auth: `ZAI_API_KEY`
- Modelo de exemplo: `zai/glm-5`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliases: `z.ai/*` e `z-ai/*` são normalizados para `zai/*`
  - `zai-api-key` detecta automaticamente o endpoint Z.AI correspondente; `zai-coding-global`, `zai-coding-cn`, `zai-global` e `zai-cn` forçam uma superfície específica

### Vercel AI Gateway

- Provedor: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Modelo de exemplo: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provedor: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Modelo de exemplo: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- O catálogo estático de fallback inclui `kilocode/kilo/auto`; a descoberta live em
  `https://api.kilo.ai/api/gateway/models` pode expandir ainda mais o catálogo
  em runtime.
- O roteamento upstream exato por trás de `kilocode/kilo/auto` é controlado pelo Kilo Gateway,
  não codificado diretamente no OpenClaw.

Consulte [/providers/kilocode](/pt-BR/providers/kilocode) para detalhes de configuração.

### Outros plugins de provedor empacotados

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Modelo de exemplo: `openrouter/auto`
- O OpenClaw aplica os cabeçalhos documentados de atribuição de app do OpenRouter apenas quando
  a requisição realmente tem como destino `openrouter.ai`
- Os marcadores `cache_control` específicos do OpenRouter para Anthropic também são limitados a
  rotas OpenRouter verificadas, não a URLs arbitrárias de proxy
- O OpenRouter permanece no caminho estilo proxy compatível com OpenAI, então a
  modelagem de requisição nativa exclusiva do OpenAI (`serviceTier`, `store` do Responses,
  dicas de cache de prompt, payloads de compatibilidade de raciocínio do OpenAI) não é encaminhada
- Referências OpenRouter baseadas em Gemini mantêm apenas o saneamento de thought-signature de proxy-Gemini;
  a validação nativa de replay do Gemini e as regravações de bootstrap permanecem desativadas
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Modelo de exemplo: `kilocode/kilo/auto`
- Referências Kilo baseadas em Gemini mantêm o mesmo caminho de saneamento de thought-signature
  de proxy-Gemini; `kilocode/kilo/auto` e outras dicas de proxy sem suporte a raciocínio
  ignoram a injeção de raciocínio via proxy
- MiniMax: `minimax` (chave de API) e `minimax-portal` (OAuth)
- Auth: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` ou `MINIMAX_API_KEY` para `minimax-portal`
- Modelo de exemplo: `minimax/MiniMax-M2.7` ou `minimax-portal/MiniMax-M2.7`
- A configuração/onboarding com chave de API do MiniMax grava definições explícitas de modelo M2.7 com
  `input: ["text", "image"]`; o catálogo empacotado do provedor mantém as referências de chat
  apenas como texto até que a configuração desse provedor seja materializada
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Modelo de exemplo: `moonshot/kimi-k2.5`
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
  - Requisições xAI nativas empacotadas usam o caminho xAI Responses
  - `/fast` ou `params.fastMode: true` reescrevem `grok-3`, `grok-3-mini`,
    `grok-4` e `grok-4-0709` para suas variantes `*-fast`
  - `tool_stream` é ativado por padrão; defina
    `agents.defaults.models["xai/<model>"].params.tool_stream` como `false` para
    desativá-lo
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Modelo de exemplo: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Modelos GLM no Cerebras usam os ids `zai-glm-4.7` e `zai-glm-4.6`.
  - Base URL compatível com OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Modelo de exemplo do Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Consulte [Hugging Face (Inference)](/pt-BR/providers/huggingface).

## Provedores via `models.providers` (custom/base URL)

Use `models.providers` (ou `models.json`) para adicionar provedores **custom** ou
proxies compatíveis com OpenAI/Anthropic.

Muitos dos plugins de provedor empacotados abaixo já publicam um catálogo padrão.
Use entradas explícitas `models.providers.<id>` apenas quando quiser substituir a
base URL, os cabeçalhos ou a lista de modelos padrão.

### Moonshot AI (Kimi)

O Moonshot é fornecido como plugin de provedor empacotado. Use o provedor embutido por
padrão e adicione uma entrada explícita `models.providers.moonshot` apenas quando
precisar substituir a base URL ou os metadados do modelo:

- Provedor: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Modelo de exemplo: `moonshot/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` ou `openclaw onboard --auth-choice moonshot-api-key-cn`

IDs de modelo Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }],
      },
    },
  },
}
```

### Kimi Coding

O Kimi Coding usa o endpoint compatível com Anthropic da Moonshot AI:

- Provedor: `kimi`
- Auth: `KIMI_API_KEY`
- Modelo de exemplo: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

O legado `kimi/k2p5` continua aceito como id de modelo de compatibilidade.

### Volcano Engine (Doubao)

O Volcano Engine (火山引擎) oferece acesso ao Doubao e a outros modelos na China.

- Provedor: `volcengine` (coding: `volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
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

Nos seletores de modelo de onboarding/configuração, a opção de autenticação do Volcengine prioriza
tanto linhas `volcengine/*` quanto `volcengine-plan/*`. Se esses modelos ainda não estiverem carregados,
o OpenClaw recorre ao catálogo não filtrado em vez de mostrar um seletor
com escopo de provedor vazio.

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

### BytePlus (Internacional)

O BytePlus ARK oferece acesso aos mesmos modelos do Volcano Engine para usuários internacionais.

- Provedor: `byteplus` (coding: `byteplus-plan`)
- Auth: `BYTEPLUS_API_KEY`
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

Nos seletores de modelo de onboarding/configuração, a opção de autenticação do BytePlus prioriza
tanto linhas `byteplus/*` quanto `byteplus-plan/*`. Se esses modelos ainda não estiverem carregados,
o OpenClaw recorre ao catálogo não filtrado em vez de mostrar um seletor
com escopo de provedor vazio.

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

O Synthetic oferece modelos compatíveis com Anthropic por trás do provedor `synthetic`:

- Provedor: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
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

O MiniMax é configurado via `models.providers` porque usa endpoints custom:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax chave de API (Global): `--auth-choice minimax-global-api`
- MiniMax chave de API (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` ou
  `MINIMAX_API_KEY` para `minimax-portal`

Consulte [/providers/minimax](/pt-BR/providers/minimax) para detalhes de configuração, opções de modelo e snippets de configuração.

No caminho de streaming compatível com Anthropic do MiniMax, o OpenClaw desativa thinking por
padrão, a menos que você o defina explicitamente, e `/fast on` reescreve
`MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.

Divisão de capacidades controlada por plugin:

- Os padrões de texto/chat permanecem em `minimax/MiniMax-M2.7`
- A geração de imagem é `minimax/image-01` ou `minimax-portal/image-01`
- O entendimento de imagem é o `MiniMax-VL-01` controlado por plugin em ambos os caminhos de autenticação do MiniMax
- A busca na web permanece no id de provedor `minimax`

### Ollama

O Ollama é fornecido como plugin de provedor empacotado e usa a API nativa do Ollama:

- Provedor: `ollama`
- Auth: Nenhuma necessária (servidor local)
- Modelo de exemplo: `ollama/llama3.3`
- Instalação: [https://ollama.com/download](https://ollama.com/download)

```bash
# Instale o Ollama e então faça pull de um modelo:
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
`OLLAMA_API_KEY`, e o plugin de provedor empacotado adiciona o Ollama diretamente ao
`openclaw onboard` e ao seletor de modelo. Consulte [/providers/ollama](/pt-BR/providers/ollama)
para onboarding, modo cloud/local e configuração custom.

### vLLM

O vLLM é fornecido como plugin de provedor empacotado para servidores locais/self-hosted compatíveis
com OpenAI:

- Provedor: `vllm`
- Auth: Opcional (depende do seu servidor)
- Base URL padrão: `http://127.0.0.1:8000/v1`

Para optar pela descoberta automática localmente (qualquer valor funciona se seu servidor não exigir autenticação):

```bash
export VLLM_API_KEY="vllm-local"
```

Depois defina um modelo (substitua por um dos IDs retornados por `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Consulte [/providers/vllm](/pt-BR/providers/vllm) para detalhes.

### SGLang

O SGLang é fornecido como plugin de provedor empacotado para servidores self-hosted rápidos
compatíveis com OpenAI:

- Provedor: `sglang`
- Auth: Opcional (depende do seu servidor)
- Base URL padrão: `http://127.0.0.1:30000/v1`

Para optar pela descoberta automática localmente (qualquer valor funciona se seu servidor não
exigir autenticação):

```bash
export SGLANG_API_KEY="sglang-local"
```

Depois defina um modelo (substitua por um dos IDs retornados por `/v1/models`):

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
        apiKey: "LMSTUDIO_KEY",
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

- Para provedores custom, `reasoning`, `input`, `cost`, `contextWindow` e `maxTokens` são opcionais.
  Quando omitidos, o OpenClaw usa por padrão:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Recomendado: defina valores explícitos que correspondam aos limites do seu proxy/modelo.
- Para `api: "openai-completions"` em endpoints não nativos (qualquer `baseUrl` não vazio cujo host não seja `api.openai.com`), o OpenClaw força `compat.supportsDeveloperRole: false` para evitar erros 400 do provedor para papéis `developer` sem suporte.
- Rotas estilo proxy compatíveis com OpenAI também ignoram modelagem de requisição nativa exclusiva do OpenAI:
  sem `service_tier`, sem `store` do Responses, sem dicas de cache de prompt, sem
  modelagem de payload de compatibilidade de raciocínio do OpenAI e sem cabeçalhos
  ocultos de atribuição do OpenClaw.
- Se `baseUrl` estiver vazio/omitido, o OpenClaw mantém o comportamento padrão da OpenAI (que resolve para `api.openai.com`).
- Por segurança, um `compat.supportsDeveloperRole: true` explícito ainda é sobrescrito em endpoints não nativos `openai-completions`.

## Exemplos da CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Consulte também: [/gateway/configuration](/pt-BR/gateway/configuration) para exemplos completos de configuração.

## Relacionado

- [Models](/pt-BR/concepts/models) — configuração de modelo e aliases
- [Model Failover](/pt-BR/concepts/model-failover) — cadeias de fallback e comportamento de repetição
- [Configuration Reference](/pt-BR/gateway/configuration-reference#agent-defaults) — chaves de configuração de modelo
- [Providers](/pt-BR/providers) — guias de configuração por provedor
