---
read_when:
    - Você quer entender quais recursos podem chamar APIs pagas
    - Você precisa auditar chaves, custos e visibilidade de uso
    - Você está explicando relatórios de custos de /status ou /usage
summary: Audite o que pode gerar custos, quais chaves são usadas e como visualizar o uso
title: Uso e custos da API
x-i18n:
    generated_at: "2026-05-06T09:12:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8e6f9f8248ddb4241d00191aa231f1d72a2128a7995b4ed0ec0e18a7ed6dd69
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Este documento lista **recursos que podem invocar chaves de API** e onde seus custos aparecem. Ele se concentra em recursos do OpenClaw que podem gerar uso de provedores ou chamadas de API pagas.

## Onde os custos aparecem (chat + CLI)

**Instantâneo de custo por sessão**

- `/status` mostra o modelo da sessão atual, o uso de contexto e os tokens da última resposta.
- Se o modelo usar **autenticação por chave de API**, `/status` também mostra o **custo estimado** da última resposta.
- Se os metadados da sessão ao vivo estiverem escassos, `/status` pode recuperar contadores de tokens/cache e o rótulo do modelo de runtime ativo a partir da entrada de uso mais recente do transcript. Valores ao vivo não zero existentes ainda têm precedência, e totais de transcript do tamanho do prompt podem prevalecer quando os totais armazenados estão ausentes ou são menores.

**Rodapé de custo por mensagem**

- `/usage full` acrescenta um rodapé de uso a cada resposta, incluindo **custo estimado** (somente chave de API).
- `/usage tokens` mostra apenas tokens; fluxos de OAuth/token em estilo assinatura e CLI ocultam o custo em dólares.
- Observação sobre o Gemini CLI: quando a CLI retorna saída JSON, o OpenClaw lê o uso de `stats`, normaliza `stats.cached` para `cacheRead` e deriva os tokens de entrada de `stats.input_tokens - stats.cached` quando necessário.

Observação sobre Anthropic: a equipe da Anthropic nos informou que o uso do Claude CLI no estilo OpenClaw voltou a ser permitido, então o OpenClaw trata a reutilização do Claude CLI e o uso de `claude -p` como sancionados para esta integração, a menos que a Anthropic publique uma nova política. A Anthropic ainda não expõe uma estimativa em dólares por mensagem que o OpenClaw possa mostrar em `/usage full`.

**Janelas de uso da CLI (cotas de provedores)**

- `openclaw status --usage` e `openclaw channels list` mostram **janelas de uso** dos provedores (instantâneos de cota, não custos por mensagem).
- A saída legível para humanos é normalizada para `X% left` entre provedores.
- Provedores atuais de janelas de uso: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi e z.ai.
- Observação sobre MiniMax: seus campos brutos `usage_percent` / `usagePercent` significam cota restante, então o OpenClaw os inverte antes de exibir. Campos baseados em contagem ainda prevalecem quando presentes. Se o provedor retornar `model_remains`, o OpenClaw prefere a entrada do modelo de chat, deriva o rótulo da janela a partir dos carimbos de data/hora quando necessário e inclui o nome do modelo no rótulo do plano.
- A autenticação de uso dessas janelas de cota vem de hooks específicos do provedor quando disponíveis; caso contrário, o OpenClaw recorre a credenciais OAuth/chave de API correspondentes de perfis de autenticação, env ou configuração.

Consulte [Uso de tokens e custos](/pt-BR/reference/token-use) para detalhes e exemplos.

## Como as chaves são descobertas

O OpenClaw pode obter credenciais de:

- **Perfis de autenticação** (por agente, armazenados em `auth-profiles.json`).
- **Variáveis de ambiente** (por exemplo, `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Configuração** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`, `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`, `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), que podem exportar chaves para o ambiente do processo da skill.

## Recursos que podem gastar chaves

### 1) Respostas do modelo principal (chat + ferramentas)

Cada resposta ou chamada de ferramenta usa o **provedor do modelo atual** (OpenAI, Anthropic etc.). Esta é a principal fonte de uso e custo.

Isso também inclui provedores hospedados em estilo assinatura que ainda cobram fora da UI local do OpenClaw, como **OpenAI Codex**, **Alibaba Cloud Model Studio Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** e o caminho de login Claude da Anthropic no OpenClaw com **Extra Usage** habilitado.

Consulte [Modelos](/pt-BR/providers/models) para configuração de preços e [Uso de tokens e custos](/pt-BR/reference/token-use) para exibição.

### 2) Compreensão de mídia (áudio/imagem/vídeo)

Mídias de entrada podem ser resumidas/transcritas antes de a resposta ser executada. Isso usa APIs de modelo/provedor.

- Áudio: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Imagem: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Vídeo: Google / Qwen / Moonshot.

Consulte [Compreensão de mídia](/pt-BR/nodes/media-understanding).

### 3) Geração de imagens e vídeos

Capacidades compartilhadas de geração também podem gastar chaves de provedores:

- Geração de imagens: OpenAI / Google / DeepInfra / fal / MiniMax
- Geração de vídeos: DeepInfra / Qwen

A geração de imagens pode inferir um padrão de provedor com autenticação quando `agents.defaults.imageGenerationModel` não está definido. A geração de vídeos atualmente exige um `agents.defaults.videoGenerationModel` explícito, como `qwen/wan2.6-t2v`.

Consulte [Geração de imagens](/pt-BR/tools/image-generation), [Qwen Cloud](/pt-BR/providers/qwen) e [Modelos](/pt-BR/concepts/models).

### 4) Embeddings de memória + busca semântica

A busca semântica de memória usa **APIs de embeddings** quando configurada para provedores remotos:

- `memorySearch.provider = "openai"` → embeddings da OpenAI
- `memorySearch.provider = "gemini"` → embeddings do Gemini
- `memorySearch.provider = "voyage"` → embeddings da Voyage
- `memorySearch.provider = "mistral"` → embeddings da Mistral
- `memorySearch.provider = "deepinfra"` → embeddings da DeepInfra
- `memorySearch.provider = "lmstudio"` → embeddings do LM Studio (local/auto-hospedado)
- `memorySearch.provider = "ollama"` → embeddings do Ollama (local/auto-hospedado; normalmente sem cobrança de API hospedada)
- Fallback opcional para um provedor remoto se os embeddings locais falharem

Você pode mantê-la local com `memorySearch.provider = "local"` (sem uso de API).

Consulte [Memória](/pt-BR/concepts/memory).

### 5) Ferramenta de busca na web

`web_search` pode incorrer em cobranças de uso dependendo do seu provedor:

- **Brave Search API**: `BRAVE_API_KEY` ou `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` ou `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` ou `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` ou `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` ou `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: sem chave para um host local do Ollama acessível e com sessão iniciada; a busca direta em `https://ollama.com` usa `OLLAMA_API_KEY`, e hosts protegidos por autenticação podem reutilizar a autenticação bearer normal do provedor Ollama
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` ou `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` ou `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback sem chave (sem cobrança de API, mas não oficial e baseado em HTML)
- **SearXNG**: `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl` (sem chave/auto-hospedado; sem cobrança de API hospedada)

Caminhos legados de provedor `tools.web.search.*` ainda são carregados por meio do shim temporário de compatibilidade, mas não são mais a superfície de configuração recomendada.

**Crédito grátis do Brave Search:** Cada plano do Brave inclui US$ 5/mês em crédito grátis renovável. O plano Search custa US$ 5 por 1.000 solicitações, então o crédito cobre 1.000 solicitações/mês sem cobrança. Defina seu limite de uso no painel do Brave para evitar cobranças inesperadas.

Consulte [Ferramentas web](/pt-BR/tools/web).

### 5) Ferramenta de busca de conteúdo web (Firecrawl)

`web_fetch` pode chamar **Firecrawl** quando uma chave de API está presente:

- `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webFetch.apiKey`

Se o Firecrawl não estiver configurado, a ferramenta recorre a busca direta mais o plugin `web-readability` incluído (sem API paga). Desabilite `plugins.entries.web-readability.enabled` para pular a extração local com Readability.

Consulte [Ferramentas web](/pt-BR/tools/web).

### 6) Instantâneos de uso do provedor (status/saúde)

Alguns comandos de status chamam **endpoints de uso do provedor** para exibir janelas de cota ou a saúde da autenticação. Normalmente são chamadas de baixo volume, mas ainda acessam APIs dos provedores:

- `openclaw status --usage`
- `openclaw models status --json`

Consulte [CLI de modelos](/pt-BR/cli/models).

### 7) Sumarização de salvaguarda de Compaction

A salvaguarda de Compaction pode resumir o histórico da sessão usando o **modelo atual**, o que invoca APIs de provedores quando é executada.

Consulte [Gerenciamento de sessão + Compaction](/pt-BR/reference/session-management-compaction).

### 8) Varredura / sonda de modelos

`openclaw models scan` pode sondar modelos do OpenRouter e usa `OPENROUTER_API_KEY` quando a sondagem está habilitada.

Consulte [CLI de modelos](/pt-BR/cli/models).

### 9) Talk (fala)

O modo Talk pode invocar **ElevenLabs** quando configurado:

- `ELEVENLABS_API_KEY` ou `talk.providers.elevenlabs.apiKey`

Consulte [Modo Talk](/pt-BR/nodes/talk).

### 10) Skills (APIs de terceiros)

Skills podem armazenar `apiKey` em `skills.entries.<name>.apiKey`. Se uma skill usar essa chave para APIs externas, ela poderá incorrer em custos de acordo com o provedor da skill.

Consulte [Skills](/pt-BR/tools/skills).

## Relacionados

- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Cache de prompt](/pt-BR/reference/prompt-caching)
- [Acompanhamento de uso](/pt-BR/concepts/usage-tracking)
