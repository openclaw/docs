---
read_when:
    - Você precisa de uma referência de configuração de modelos por provedor
    - Você quer configurações de exemplo ou comandos de integração da CLI para provedores de modelo
summary: Visão geral dos provedores de modelo com configurações de exemplo + fluxos da CLI
title: Provedores de modelo
x-i18n:
    generated_at: "2026-04-11T02:44:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 910ea7895e74c03910757d9d3e02825754b779b204eca7275b28422647ed0151
    source_path: concepts/model-providers.md
    workflow: 15
---

# Provedores de modelo

Esta página cobre **provedores de LLM/modelo** (não canais de chat como WhatsApp/Telegram).
Para regras de seleção de modelos, consulte [/concepts/models](/pt-BR/concepts/models).

## Regras rápidas

- As referências de modelo usam `provider/model` (exemplo: `opencode/claude-opus-4-6`).
- Se você definir `agents.defaults.models`, isso se torna a lista de permissões.
- Auxiliares da CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Regras de fallback em runtime, sondagens de resfriamento e persistência de substituição de sessão são
  documentadas em [/concepts/model-failover](/pt-BR/concepts/model-failover).
- `models.providers.*.models[].contextWindow` são metadados nativos do modelo;
  `models.providers.*.models[].contextTokens` é o limite efetivo em runtime.
- Plugins de provedor podem injetar catálogos de modelos via `registerProvider({ catalog })`;
  o OpenClaw mescla essa saída em `models.providers` antes de gravar
  `models.json`.
- Manifestos de provedor podem declarar `providerAuthEnvVars` e
  `providerAuthAliases` para que sondagens genéricas de autenticação baseadas em variáveis de ambiente e variantes de provedor
  não precisem carregar o runtime do plugin. O mapa restante de variáveis de ambiente do núcleo agora
  é apenas para provedores não baseados em plugin/do núcleo e alguns casos de precedência genérica,
  como integração com prioridade para chave de API da Anthropic.
- Plugins de provedor também podem ser donos do comportamento de runtime do provedor por meio de
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
- Observação: `capabilities` do runtime do provedor são metadados compartilhados do executor (família do provedor, peculiaridades de transcrição/ferramentas, dicas de transporte/cache). Não é o
  mesmo que o [modelo de capacidade pública](/pt-BR/plugins/architecture#public-capability-model),
  que descreve o que um plugin registra (inferência de texto, fala etc.).
- O provedor `codex` incluído é emparelhado com o harness do agente Codex incluído.
  Use referências `codex/gpt-*` quando você quiser login gerenciado pelo Codex, descoberta de modelos,
  retomada nativa de thread e execução em servidor de aplicativo. Referências simples `openai/gpt-*` continuam
  usando o provedor OpenAI e o transporte normal de provedor do OpenClaw.
  Implantações somente com Codex podem desativar o fallback automático de PI com
  `agents.defaults.embeddedHarness.fallback: "none"`; consulte
  [Codex Harness](/pt-BR/plugins/codex-harness).

## Comportamento de provedor sob posse do plugin

Plugins de provedor agora podem ser donos da maior parte da lógica específica do provedor, enquanto o OpenClaw mantém
o loop genérico de inferência.

Divisão típica:

- `auth[].run` / `auth[].runNonInteractive`: o provedor é dono dos fluxos de integração/login
  para `openclaw onboard`, `openclaw models auth` e configuração sem interface
- `wizard.setup` / `wizard.modelPicker`: o provedor é dono dos rótulos de escolha de autenticação,
  aliases legados, dicas de lista de permissões na integração e entradas de configuração nos seletores de integração/modelo
- `catalog`: o provedor aparece em `models.providers`
- `normalizeModelId`: o provedor normaliza IDs de modelo legados/prévia antes
  da busca ou da canonização
- `normalizeTransport`: o provedor normaliza `api` / `baseUrl` da família de transporte
  antes da montagem genérica do modelo; o OpenClaw verifica primeiro o provedor correspondente,
  depois outros plugins de provedor com suporte a hooks até que um realmente altere o
  transporte
- `normalizeConfig`: o provedor normaliza a configuração `models.providers.<id>` antes
  de o runtime usá-la; o OpenClaw verifica primeiro o provedor correspondente, depois outros
  plugins de provedor com suporte a hooks até que um realmente altere a configuração. Se nenhum
  hook de provedor reescrever a configuração, os auxiliares incluídos da família Google ainda
  normalizam entradas compatíveis de provedor Google.
- `applyNativeStreamingUsageCompat`: o provedor aplica regravações de compatibilidade de uso de streaming nativo orientadas por endpoint para provedores de configuração
- `resolveConfigApiKey`: o provedor resolve autenticação com marcador de variável de ambiente para provedores de configuração
  sem forçar o carregamento completo da autenticação de runtime. `amazon-bedrock` também tem um
  resolvedor interno de marcador de variável de ambiente da AWS aqui, embora a autenticação de runtime do Bedrock use
  a cadeia padrão do SDK da AWS.
- `resolveSyntheticAuth`: o provedor pode expor disponibilidade de autenticação
  local/self-hosted ou outra baseada em configuração sem persistir segredos em texto simples
- `shouldDeferSyntheticProfileAuth`: o provedor pode marcar placeholders sintéticos de perfil armazenados
  como de menor precedência do que autenticação baseada em variável de ambiente/configuração
- `resolveDynamicModel`: o provedor aceita IDs de modelo ainda não presentes no catálogo estático local
- `prepareDynamicModel`: o provedor precisa de uma atualização de metadados antes de tentar novamente
  a resolução dinâmica
- `normalizeResolvedModel`: o provedor precisa de regravações de transporte ou URL base
- `contributeResolvedModelCompat`: o provedor contribui com sinalizadores de compatibilidade para seus
  modelos do fornecedor, mesmo quando eles chegam por outro transporte compatível
- `capabilities`: o provedor publica peculiaridades de transcrição/ferramentas/família do provedor
- `normalizeToolSchemas`: o provedor limpa esquemas de ferramenta antes que o executor embutido os veja
- `inspectToolSchemas`: o provedor expõe avisos de esquema específicos de transporte
  após a normalização
- `resolveReasoningOutputMode`: o provedor escolhe contratos nativos versus marcados
  para saída de raciocínio
- `prepareExtraParams`: o provedor define padrões ou normaliza parâmetros de solicitação por modelo
- `createStreamFn`: o provedor substitui o caminho normal de stream por um transporte totalmente
  personalizado
- `wrapStreamFn`: o provedor aplica wrappers de compatibilidade de cabeçalhos/corpo/modelo da solicitação
- `resolveTransportTurnState`: o provedor fornece cabeçalhos ou metadados nativos de transporte
  por turno
- `resolveWebSocketSessionPolicy`: o provedor fornece cabeçalhos nativos de sessão WebSocket
  ou política de resfriamento de sessão
- `createEmbeddingProvider`: o provedor é dono do comportamento de embeddings de memória quando isso
  pertence ao plugin do provedor em vez do comutador central de embeddings do núcleo
- `formatApiKey`: o provedor formata perfis de autenticação armazenados na
  string `apiKey` de runtime esperada pelo transporte
- `refreshOAuth`: o provedor é dono da atualização de OAuth quando os atualizadores compartilhados
  de `pi-ai` não são suficientes
- `buildAuthDoctorHint`: o provedor anexa orientações de reparo quando a atualização de OAuth
  falha
- `matchesContextOverflowError`: o provedor reconhece erros de estouro de janela de contexto
  específicos do provedor que as heurísticas genéricas não detectariam
- `classifyFailoverReason`: o provedor mapeia erros brutos específicos do provedor, de transporte/API,
  para motivos de failover, como limite de taxa ou sobrecarga
- `isCacheTtlEligible`: o provedor decide quais IDs de modelo upstream oferecem suporte a TTL de cache de prompt
- `buildMissingAuthMessage`: o provedor substitui o erro genérico do armazenamento de autenticação
  por uma dica de recuperação específica do provedor
- `suppressBuiltInModel`: o provedor oculta linhas upstream desatualizadas e pode retornar um
  erro controlado pelo fornecedor para falhas de resolução direta
- `augmentModelCatalog`: o provedor adiciona linhas sintéticas/finais ao catálogo após
  descoberta e mesclagem de configuração
- `isBinaryThinking`: o provedor é dono da UX binária de pensamento ligado/desligado
- `supportsXHighThinking`: o provedor habilita `xhigh` para modelos selecionados
- `resolveDefaultThinkingLevel`: o provedor é dono da política padrão de `/think` para uma
  família de modelos
- `applyConfigDefaults`: o provedor aplica padrões globais específicos do provedor
  durante a materialização da configuração com base no modo de autenticação, ambiente ou família do modelo
- `isModernModelRef`: o provedor é dono da correspondência de modelo preferido em live/smoke
- `prepareRuntimeAuth`: o provedor transforma uma credencial configurada em um token de runtime
  de curta duração
- `resolveUsageAuth`: o provedor resolve credenciais de uso/cota para `/usage`
  e superfícies relacionadas de status/relatórios
- `fetchUsageSnapshot`: o provedor é dono da busca/análise do endpoint de uso, enquanto
  o núcleo ainda é dono da estrutura de resumo e da formatação
- `onModelSelected`: o provedor executa efeitos colaterais pós-seleção, como
  telemetria ou controle de sessão sob posse do provedor

Exemplos incluídos atualmente:

- `anthropic`: fallback de compatibilidade futura para Claude 4.6, dicas de reparo de autenticação, busca do endpoint de uso, metadados de TTL de cache/família de provedor e padrões globais de configuração conscientes de autenticação
- `amazon-bedrock`: correspondência de estouro de contexto sob posse do provedor e classificação de motivo de failover para erros específicos do Bedrock de limitação/não pronto, além da família compartilhada de replay `anthropic-by-model` para proteções de política de replay somente para Claude em tráfego Anthropic
- `anthropic-vertex`: proteções de política de replay somente para Claude em tráfego `anthropic-message`
- `openrouter`: IDs de modelo em passagem direta, wrappers de solicitação, dicas de capacidade do provedor, saneamento de assinatura de pensamento do Gemini em tráfego Gemini por proxy, injeção de raciocínio por proxy por meio da família de stream `openrouter-thinking`, encaminhamento de metadados de roteamento e política de TTL de cache
- `github-copilot`: integração/login de dispositivo, fallback de modelo com compatibilidade futura, dicas de transcrição para pensamento do Claude, troca de token em runtime e busca do endpoint de uso
- `openai`: fallback de compatibilidade futura para GPT-5.4, normalização direta de transporte OpenAI, dicas de autenticação ausente com reconhecimento de Codex, supressão do Spark, linhas sintéticas de catálogo OpenAI/Codex, política de thinking/live-model, normalização de aliases de token de uso (`input` / `output` e famílias `prompt` / `completion`), a família compartilhada de stream `openai-responses-defaults` para wrappers nativos OpenAI/Codex, metadados de família de provedor, registro incluído de provedor de geração de imagem para `gpt-image-1` e registro incluído de provedor de geração de vídeo para `sora-2`
- `google` e `google-gemini-cli`: fallback de compatibilidade futura para Gemini 3.1, validação nativa de replay do Gemini, saneamento de replay de bootstrap, modo de saída de raciocínio com tags, correspondência de modelo moderno, registro incluído de provedor de geração de imagem para modelos Gemini image-preview e registro incluído de provedor de geração de vídeo para modelos Veo; o OAuth do Gemini CLI também é dono da formatação de token do perfil de autenticação, análise de token de uso e busca de endpoint de cota para superfícies de uso
- `moonshot`: transporte compartilhado, normalização de payload de thinking sob posse do plugin
- `kilocode`: transporte compartilhado, cabeçalhos de solicitação sob posse do plugin, normalização de payload de raciocínio, saneamento de assinatura de pensamento do Gemini por proxy e política de TTL de cache
- `zai`: fallback de compatibilidade futura para GLM-5, padrões `tool_stream`, política de TTL de cache, política de binary-thinking/live-model e autenticação de uso + busca de cota; IDs desconhecidos `glm-5*` são sintetizados a partir do modelo `glm-4.7` incluído
- `xai`: normalização nativa de transporte Responses, regravações de alias `/fast` para variantes rápidas do Grok, `tool_stream` padrão, limpeza específica do xAI para esquema de ferramenta / payload de raciocínio e registro incluído de provedor de geração de vídeo para `grok-imagine-video`
- `mistral`: metadados de capacidade sob posse do plugin
- `opencode` e `opencode-go`: metadados de capacidade sob posse do plugin mais saneamento de assinatura de pensamento do Gemini por proxy
- `alibaba`: catálogo de geração de vídeo sob posse do plugin para referências diretas de modelo Wan, como `alibaba/wan2.6-t2v`
- `byteplus`: catálogos sob posse do plugin mais registro incluído de provedor de geração de vídeo para modelos Seedance de texto para vídeo/imagem para vídeo
- `fal`: registro incluído de provedor de geração de vídeo para geração de imagem de terceiros hospedada para modelos de imagem FLUX, mais registro incluído de provedor de geração de vídeo para modelos de vídeo de terceiros hospedados
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` e `volcengine`:
  apenas catálogos sob posse do plugin
- `qwen`: catálogos sob posse do plugin para modelos de texto mais registros compartilhados de provedores de compreensão de mídia e geração de vídeo para suas superfícies multimodais; a geração de vídeo Qwen usa os endpoints de vídeo DashScope Standard com modelos Wan incluídos, como `wan2.6-t2v` e `wan2.7-r2v`
- `runway`: registro de provedor de geração de vídeo sob posse do plugin para modelos nativos baseados em tarefa do Runway, como `gen4.5`
- `minimax`: catálogos sob posse do plugin, registro incluído de provedor de geração de vídeo para modelos de vídeo Hailuo, registro incluído de provedor de geração de imagem para `image-01`, seleção híbrida de política de replay Anthropic/OpenAI e lógica de autenticação/snapshot de uso
- `together`: catálogos sob posse do plugin mais registro incluído de provedor de geração de vídeo para modelos de vídeo Wan
- `xiaomi`: catálogos sob posse do plugin mais lógica de autenticação/snapshot de uso

O plugin `openai` incluído agora é dono de ambos os IDs de provedor: `openai` e
`openai-codex`.

Isso cobre provedores que ainda se encaixam nos transportes normais do OpenClaw. Um provedor
que precisa de um executor de solicitação totalmente personalizado pertence a uma superfície de extensão separada e mais profunda.

## Rotação de chave de API

- Suporta rotação genérica de provedor para provedores selecionados.
- Configure várias chaves por meio de:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (substituição única de uso ao vivo, prioridade mais alta)
  - `<PROVIDER>_API_KEYS` (lista separada por vírgula ou ponto e vírgula)
  - `<PROVIDER>_API_KEY` (chave principal)
  - `<PROVIDER>_API_KEY_*` (lista numerada, por exemplo `<PROVIDER>_API_KEY_1`)
- Para provedores Google, `GOOGLE_API_KEY` também é incluída como fallback.
- A ordem de seleção de chaves preserva a prioridade e remove valores duplicados.
- As solicitações são repetidas com a próxima chave apenas em respostas de limite de taxa (por
  exemplo `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` ou mensagens periódicas de limite de uso).
- Falhas que não sejam de limite de taxa falham imediatamente; nenhuma rotação de chave é tentada.
- Quando todas as chaves candidatas falham, o erro final retornado é o da última tentativa.

## Provedores incluídos (catálogo pi-ai)

O OpenClaw é fornecido com o catálogo pi‑ai. Esses provedores não exigem
configuração em `models.providers`; basta definir a autenticação + escolher um modelo.

### OpenAI

- Provedor: `openai`
- Autenticação: `OPENAI_API_KEY`
- Rotação opcional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, mais `OPENCLAW_LIVE_OPENAI_KEY` (substituição única)
- Modelos de exemplo: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- O transporte padrão é `auto` (WebSocket primeiro, fallback para SSE)
- Substitua por modelo via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- O pré-aquecimento do OpenAI Responses WebSocket vem habilitado por padrão via `params.openaiWsWarmup` (`true`/`false`)
- O processamento prioritário da OpenAI pode ser habilitado por meio de `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mapeiam solicitações diretas `openai/*` Responses para `service_tier=priority` em `api.openai.com`
- Use `params.serviceTier` quando quiser uma camada explícita em vez do alternador compartilhado `/fast`
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`,
  `User-Agent`) se aplicam apenas ao tráfego OpenAI nativo para `api.openai.com`, não a
  proxies genéricos compatíveis com OpenAI
- Rotas OpenAI nativas também mantêm `store` do Responses, dicas de cache de prompt e
  modelagem de payload de compatibilidade de raciocínio da OpenAI; rotas por proxy não
- `openai/gpt-5.3-codex-spark` é intencionalmente suprimido no OpenClaw porque a API OpenAI ao vivo o rejeita; Spark é tratado como exclusivo do Codex

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
- Solicitações públicas diretas para a Anthropic também oferecem suporte ao alternador compartilhado `/fast` e a `params.fastMode`, incluindo tráfego autenticado por chave de API e OAuth enviado para `api.anthropic.com`; o OpenClaw mapeia isso para `service_tier` da Anthropic (`auto` versus `standard_only`)
- Observação sobre a Anthropic: a equipe da Anthropic nos informou que o uso do Claude CLI no estilo do OpenClaw é permitido novamente, então o OpenClaw trata a reutilização do Claude CLI e o uso de `claude -p` como autorizados para esta integração, a menos que a Anthropic publique uma nova política.
- O token de configuração da Anthropic continua disponível como um caminho de token compatível do OpenClaw, mas o OpenClaw agora prefere reutilização do Claude CLI e `claude -p` quando disponíveis.

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
- `params.serviceTier` também é encaminhado em solicitações nativas Codex Responses (`chatgpt.com/backend-api`)
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`,
  `User-Agent`) são anexados apenas no tráfego Codex nativo para
  `chatgpt.com/backend-api`, não em proxies genéricos compatíveis com OpenAI
- Compartilha o mesmo alternador `/fast` e a mesma configuração `params.fastMode` de `openai/*` direto; o OpenClaw mapeia isso para `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` continua disponível quando o catálogo OAuth do Codex o expõe; dependente de direito de acesso
- `openai-codex/gpt-5.4` mantém `contextWindow = 1050000` nativo e um `contextTokens = 272000` padrão em runtime; substitua o limite de runtime com `models.providers.openai-codex.models[].contextTokens`
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

### Outras opções hospedadas no estilo assinatura

- [Qwen Cloud](/pt-BR/providers/qwen): superfície de provedor do Qwen Cloud mais mapeamento de endpoint Alibaba DashScope e Coding Plan
- [MiniMax](/pt-BR/providers/minimax): acesso ao OAuth ou chave de API do MiniMax Coding Plan
- [GLM Models](/pt-BR/providers/glm): endpoints do Z.AI Coding Plan ou da API geral

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
- Rotação opcional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback para `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (substituição única)
- Modelos de exemplo: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilidade: configuração legada do OpenClaw usando `google/gemini-3.1-flash-preview` é normalizada para `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Execuções diretas do Gemini também aceitam `agents.defaults.models["google/<model>"].params.cachedContent`
  (ou o legado `cached_content`) para encaminhar um identificador nativo do provedor
  `cachedContents/...`; acertos de cache do Gemini aparecem como `cacheRead` no OpenClaw

### Google Vertex e Gemini CLI

- Provedores: `google-vertex`, `google-gemini-cli`
- Autenticação: o Vertex usa gcloud ADC; o Gemini CLI usa seu fluxo OAuth
- Cuidado: o OAuth do Gemini CLI no OpenClaw é uma integração não oficial. Alguns usuários relataram restrições na conta Google após usar clientes de terceiros. Revise os termos do Google e use uma conta não crítica se optar por prosseguir.
- O OAuth do Gemini CLI é distribuído como parte do plugin `google` incluído.
  - Instale primeiro o Gemini CLI:
    - `brew install gemini-cli`
    - ou `npm install -g @google/gemini-cli`
  - Habilite: `openclaw plugins enable google`
  - Faça login: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Modelo padrão: `google-gemini-cli/gemini-3-flash-preview`
  - Observação: você **não** cola um client id nem um secret em `openclaw.json`. O fluxo de login da CLI armazena
    tokens em perfis de autenticação no host do gateway.
  - Se as solicitações falharem após o login, defina `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` no host do gateway.
  - As respostas JSON do Gemini CLI são analisadas a partir de `response`; o uso recorre a
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
- Modelo de exemplo: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provedor: `kilocode`
- Autenticação: `KILOCODE_API_KEY`
- Modelo de exemplo: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL base: `https://api.kilo.ai/api/gateway/`
- O catálogo estático de fallback inclui `kilocode/kilo/auto`; a descoberta ao vivo em
  `https://api.kilo.ai/api/gateway/models` pode expandir ainda mais o catálogo
  em runtime.
- O roteamento upstream exato por trás de `kilocode/kilo/auto` pertence ao Kilo Gateway,
  não é codificado diretamente no OpenClaw.

Consulte [/providers/kilocode](/pt-BR/providers/kilocode) para detalhes de configuração.

### Outros plugins de provedor incluídos

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Modelo de exemplo: `openrouter/auto`
- O OpenClaw aplica os cabeçalhos documentados de atribuição de aplicativo do OpenRouter apenas quando
  a solicitação realmente é direcionada para `openrouter.ai`
- Os marcadores `cache_control` específicos do Anthropic no OpenRouter também são restritos a
  rotas OpenRouter verificadas, não a URLs arbitrárias de proxy
- O OpenRouter continua no caminho compatível com OpenAI em estilo proxy, então a
  modelagem nativa de solicitação exclusiva do OpenAI (`serviceTier`, `store` do Responses,
  dicas de cache de prompt, payloads de compatibilidade de raciocínio do OpenAI) não é encaminhada
- Referências OpenRouter baseadas em Gemini mantêm apenas o saneamento de assinatura de pensamento do Gemini por proxy;
  a validação nativa de replay do Gemini e as regravações de bootstrap permanecem desativadas
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Modelo de exemplo: `kilocode/kilo/auto`
- Referências Kilo baseadas em Gemini mantêm o mesmo caminho de saneamento de assinatura
  de pensamento do Gemini por proxy; `kilocode/kilo/auto` e outras dicas de proxy sem suporte a raciocínio
  pulam a injeção de raciocínio por proxy
- MiniMax: `minimax` (chave de API) e `minimax-portal` (OAuth)
- Autenticação: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` ou `MINIMAX_API_KEY` para `minimax-portal`
- Modelo de exemplo: `minimax/MiniMax-M2.7` ou `minimax-portal/MiniMax-M2.7`
- A integração/configuração com chave de API do MiniMax grava definições explícitas do modelo M2.7 com
  `input: ["text", "image"]`; o catálogo do provedor incluído mantém as referências de chat
  apenas como texto até que essa configuração do provedor seja materializada
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
  - Solicitações xAI nativas incluídas usam o caminho xAI Responses
  - `/fast` ou `params.fastMode: true` reescreve `grok-3`, `grok-3-mini`,
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

## Provedores via `models.providers` (personalizado/URL base)

Use `models.providers` (ou `models.json`) para adicionar provedores **personalizados** ou
proxies compatíveis com OpenAI/Anthropic.

Muitos dos plugins de provedor incluídos abaixo já publicam um catálogo padrão.
Use entradas explícitas `models.providers.<id>` somente quando quiser substituir a
URL base, os cabeçalhos ou a lista de modelos padrão.

### Moonshot AI (Kimi)

O Moonshot é distribuído como um plugin de provedor incluído. Use o provedor incluído por
padrão e adicione uma entrada explícita `models.providers.moonshot` somente quando
precisar substituir a URL base ou os metadados do modelo:

- Provedor: `moonshot`
- Autenticação: `MOONSHOT_API_KEY`
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

O Kimi Coding usa o endpoint compatível com Anthropic do Moonshot AI:

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

A integração usa por padrão a superfície de coding, mas o catálogo geral `volcengine/*`
é registrado ao mesmo tempo.

Nos seletores de modelo de integração/configuração, a escolha de autenticação do Volcengine prioriza linhas
`volcengine/*` e `volcengine-plan/*`. Se esses modelos ainda não tiverem sido carregados,
o OpenClaw recorre ao catálogo sem filtro em vez de mostrar um seletor vazio
com escopo de provedor.

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

O BytePlus ARK fornece acesso aos mesmos modelos que o Volcano Engine para usuários internacionais.

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

A integração usa por padrão a superfície de coding, mas o catálogo geral `byteplus/*`
é registrado ao mesmo tempo.

Nos seletores de modelo de integração/configuração, a escolha de autenticação do BytePlus prioriza linhas
`byteplus/*` e `byteplus-plan/*`. Se esses modelos ainda não tiverem sido carregados,
o OpenClaw recorre ao catálogo sem filtro em vez de mostrar um seletor vazio
com escopo de provedor.

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
- Chave de API MiniMax (Global): `--auth-choice minimax-global-api`
- Chave de API MiniMax (CN): `--auth-choice minimax-cn-api`
- Autenticação: `MINIMAX_API_KEY` para `minimax`; `MINIMAX_OAUTH_TOKEN` ou
  `MINIMAX_API_KEY` para `minimax-portal`

Consulte [/providers/minimax](/pt-BR/providers/minimax) para detalhes de configuração, opções de modelo e trechos de configuração.

No caminho de streaming compatível com Anthropic do MiniMax, o OpenClaw desativa o thinking por
padrão, a menos que você o defina explicitamente, e `/fast on` reescreve
`MiniMax-M2.7` para `MiniMax-M2.7-highspeed`.

Divisão de capacidades sob posse do plugin:

- Os padrões de texto/chat permanecem em `minimax/MiniMax-M2.7`
- A geração de imagem é `minimax/image-01` ou `minimax-portal/image-01`
- A compreensão de imagem é `MiniMax-VL-01`, sob posse do plugin, em ambos os caminhos de autenticação MiniMax
- A busca na web permanece no ID de provedor `minimax`

### Ollama

O Ollama é distribuído como um plugin de provedor incluído e usa a API nativa do Ollama:

- Provedor: `ollama`
- Autenticação: não obrigatória (servidor local)
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

O Ollama é detectado localmente em `http://127.0.0.1:11434` quando você ativa com
`OLLAMA_API_KEY`, e o plugin de provedor incluído adiciona o Ollama diretamente ao
`openclaw onboard` e ao seletor de modelos. Consulte [/providers/ollama](/pt-BR/providers/ollama)
para integração, modo em nuvem/local e configuração personalizada.

### vLLM

O vLLM é distribuído como um plugin de provedor incluído para servidores
locais/self-hosted compatíveis com OpenAI:

- Provedor: `vllm`
- Autenticação: opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:8000/v1`

Para ativar a descoberta automática localmente (qualquer valor funciona se o seu servidor não exigir autenticação):

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

O SGLang é distribuído como um plugin de provedor incluído para servidores
self-hosted rápidos compatíveis com OpenAI:

- Provedor: `sglang`
- Autenticação: opcional (depende do seu servidor)
- URL base padrão: `http://127.0.0.1:30000/v1`

Para ativar a descoberta automática localmente (qualquer valor funciona se o seu servidor não
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

- Para provedores personalizados, `reasoning`, `input`, `cost`, `contextWindow` e `maxTokens` são opcionais.
  Quando omitidos, o OpenClaw usa por padrão:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Recomendado: defina valores explícitos que correspondam aos limites do seu proxy/modelo.
- Para `api: "openai-completions"` em endpoints não nativos (qualquer `baseUrl` não vazio cujo host não seja `api.openai.com`), o OpenClaw força `compat.supportsDeveloperRole: false` para evitar erros 400 do provedor por funções `developer` não compatíveis.
- Rotas compatíveis com OpenAI em estilo proxy também pulam a modelagem nativa de solicitação exclusiva do OpenAI: sem `service_tier`, sem `store` do Responses, sem dicas de cache de prompt, sem modelagem de payload de compatibilidade de raciocínio do OpenAI e sem cabeçalhos ocultos de atribuição do OpenClaw.
- Se `baseUrl` estiver vazio/omitido, o OpenClaw mantém o comportamento padrão da OpenAI (que resolve para `api.openai.com`).
- Por segurança, um `compat.supportsDeveloperRole: true` explícito ainda é substituído em endpoints não nativos `openai-completions`.

## Exemplos de CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Consulte também: [/gateway/configuration](/pt-BR/gateway/configuration) para exemplos completos de configuração.

## Relacionado

- [Models](/pt-BR/concepts/models) — configuração de modelos e aliases
- [Model Failover](/pt-BR/concepts/model-failover) — cadeias de fallback e comportamento de repetição
- [Configuration Reference](/pt-BR/gateway/configuration-reference#agent-defaults) — chaves de configuração de modelo
- [Providers](/pt-BR/providers) — guias de configuração por provedor
