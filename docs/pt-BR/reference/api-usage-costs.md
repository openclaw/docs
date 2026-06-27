---
read_when:
    - Você quer entender quais recursos podem chamar APIs pagas
    - Você precisa auditar chaves, custos e visibilidade de uso
    - Você está explicando o relatório de custos de /status ou /usage
summary: Audite o que pode gastar dinheiro, quais chaves são usadas e como visualizar o uso
title: Uso da API e custos
x-i18n:
    generated_at: "2026-06-27T18:08:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 473028747c3e8eab60667106d22616aa185f867d01238b856f4235faad957a9e
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Este documento lista **recursos que podem invocar chaves de API** e onde seus custos aparecem. Ele se concentra em
recursos do OpenClaw que podem gerar uso de provedores ou chamadas de API pagas.

## Onde os custos aparecem (chat + CLI)

**Snapshot de custo por sessão**

- `/status` mostra o modelo da sessão atual, o uso de contexto e os tokens da última resposta.
- Se o OpenClaw tiver metadados de uso e preços locais para o modelo ativo,
  `/status` também mostra o **custo estimado** da última resposta. Isso pode incluir
  provedores sem chave de API com preço explícito, como modelos Bedrock `aws-sdk`.
- Se os metadados da sessão ao vivo forem escassos, `/status` pode recuperar contadores
  de tokens/cache e o rótulo do modelo de runtime ativo a partir da entrada de uso
  mais recente da transcrição. Valores ao vivo não zero existentes ainda têm precedência,
  e totais de transcrição do tamanho do prompt podem prevalecer quando os totais armazenados
  estão ausentes ou são menores.

**Rodapé de custo por mensagem**

- `/usage full` acrescenta um rodapé de uso a cada resposta, incluindo **custo estimado**
  quando o preço local está configurado para o modelo ativo e os metadados de uso estão
  disponíveis.
- `/usage tokens` mostra apenas tokens; fluxos OAuth/token em estilo de assinatura e CLI
  ainda mostram apenas tokens, a menos que esse runtime forneça metadados de uso compatíveis
  e um preço local explícito esteja configurado.
- Observação sobre o Gemini CLI: a saída padrão `stream-json` e as substituições JSON legadas
  leem o uso de `stats`, normalizam `stats.cached` em `cacheRead` e derivam tokens de entrada
  de `stats.input_tokens - stats.cached` quando necessário.

Observação sobre a Anthropic: a equipe da Anthropic nos informou que o uso do Claude CLI no estilo
OpenClaw voltou a ser permitido, então o OpenClaw trata a reutilização do Claude CLI e o uso de
`claude -p` como autorizados para esta integração, a menos que a Anthropic publique uma nova política.
A Anthropic ainda não expõe uma estimativa em dólares por mensagem que o OpenClaw possa
mostrar em `/usage full`.

**Janelas de uso da CLI (cotas de provedores)**

- `openclaw status --usage` e `openclaw channels list` mostram **janelas de uso** de provedores
  (snapshots de cota, não custos por mensagem).
- A saída para humanos é normalizada como `X% left` entre provedores.
- Provedores atuais de janela de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.
- Observação sobre MiniMax: seus campos brutos `usage_percent` / `usagePercent` significam cota
  restante, então o OpenClaw os inverte antes da exibição. Campos baseados em contagem ainda prevalecem
  quando presentes. Se o provedor retornar `model_remains`, o OpenClaw prefere a entrada do
  modelo de chat, deriva o rótulo da janela a partir de timestamps quando necessário e
  inclui o nome do modelo no rótulo do plano.
- A autenticação de uso para essas janelas de cota vem de hooks específicos do provedor quando
  disponíveis; caso contrário, o OpenClaw recorre a credenciais OAuth/chave de API correspondentes
  de perfis de autenticação, env ou config.

Veja [Uso de tokens e custos](/pt-BR/reference/token-use) para detalhes e exemplos.

## Como as chaves são descobertas

O OpenClaw pode obter credenciais de:

- **Perfis de autenticação** (por agente, armazenados em `auth-profiles.json`).
- **Variáveis de ambiente** (por exemplo, `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Config** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) que podem exportar chaves para o env do processo da skill.

## Recursos que podem gastar chaves

### 1) Respostas do modelo principal (chat + ferramentas)

Cada resposta ou chamada de ferramenta usa o **provedor de modelo atual** (OpenAI, Anthropic etc.). Esta é a
fonte principal de uso e custo.

Isso também inclui provedores hospedados em estilo de assinatura que ainda cobram fora
da UI local do OpenClaw, como **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** e
o caminho de login Claude da Anthropic no OpenClaw com **Extra Usage** habilitado.

Veja [Modelos](/pt-BR/providers/models) para configuração de preços e [Uso de tokens e custos](/pt-BR/reference/token-use) para exibição.

### 2) Compreensão de mídia (áudio/imagem/vídeo)

Mídias recebidas podem ser resumidas/transcritas antes da execução da resposta. Isso usa APIs de modelo/provedor.

- Áudio: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Imagem: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Vídeo: Google / Qwen / Moonshot.

Veja [Compreensão de mídia](/pt-BR/nodes/media-understanding).

### 3) Geração de imagem e vídeo

Capacidades compartilhadas de geração também podem gastar chaves de provedores:

- Geração de imagem: OpenAI / Google / DeepInfra / fal / MiniMax
- Geração de vídeo: DeepInfra / Qwen

A geração de imagem pode inferir um provedor padrão respaldado por autenticação quando
`agents.defaults.imageGenerationModel` não está definido. A geração de vídeo atualmente
exige um `agents.defaults.videoGenerationModel` explícito, como
`qwen/wan2.6-t2v`.

Veja [Geração de imagem](/pt-BR/tools/image-generation), [Qwen Cloud](/pt-BR/providers/qwen)
e [Modelos](/pt-BR/concepts/models).

### 4) Embeddings de memória + busca semântica

A busca semântica de memória usa **APIs de embedding** quando configurada para provedores remotos:

- `memorySearch.provider = "openai"` → embeddings da OpenAI
- `memorySearch.provider = "gemini"` → embeddings do Gemini
- `memorySearch.provider = "voyage"` → embeddings da Voyage
- `memorySearch.provider = "mistral"` → embeddings da Mistral
- `memorySearch.provider = "deepinfra"` → embeddings da DeepInfra
- `memorySearch.provider = "lmstudio"` → embeddings do LM Studio (local/auto-hospedado)
- `memorySearch.provider = "ollama"` → embeddings do Ollama (local/auto-hospedado; normalmente sem cobrança de API hospedada)
- Fallback opcional para um provedor remoto se embeddings locais falharem

Você pode mantê-la local com `memorySearch.provider = "local"` (sem uso de API).

Veja [Memória](/pt-BR/concepts/memory).

### 5) Ferramenta de busca na web

`web_search` pode incorrer em cobranças de uso dependendo do seu provedor:

- **Brave Search API**: `BRAVE_API_KEY` ou `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` ou `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` ou `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: perfil OAuth xAI, `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` ou `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` ou `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: sem chave para um host Ollama local conectado e acessível; busca direta em `https://ollama.com` usa `OLLAMA_API_KEY`, e hosts protegidos por autenticação podem reutilizar a autenticação bearer normal do provedor Ollama
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` ou `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` ou `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: provedor sem chave quando selecionado explicitamente (sem cobrança de API, mas não oficial e baseado em HTML)
- **SearXNG**: `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl` (sem chave/auto-hospedado; sem cobrança de API hospedada)

Caminhos legados de provedor `tools.web.search.*` ainda são carregados por meio do shim temporário de compatibilidade, mas não são mais a superfície de config recomendada.

**Crédito gratuito do Brave Search:** Cada plano Brave inclui \$5/mês em crédito gratuito
renovável. O plano Search custa \$5 por 1.000 solicitações, então o crédito cobre
1.000 solicitações/mês sem custo. Defina seu limite de uso no painel do Brave
para evitar cobranças inesperadas.

Veja [Ferramentas web](/pt-BR/tools/web).

### 5) Ferramenta de busca de conteúdo web (Firecrawl)

`web_fetch` pode chamar **Firecrawl** com acesso inicial sem chave. Adicione uma chave de API
para limites mais altos:

- `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webFetch.apiKey`

Se o Firecrawl não estiver configurado, a ferramenta recorre a busca direta mais o Plugin `web-readability` incluído (sem API paga). Desabilite `plugins.entries.web-readability.enabled` para pular a extração local do Readability.

Veja [Ferramentas web](/pt-BR/tools/web).

### 6) Snapshots de uso do provedor (status/saúde)

Alguns comandos de status chamam **endpoints de uso do provedor** para exibir janelas de cota ou integridade da autenticação.
Essas geralmente são chamadas de baixo volume, mas ainda atingem APIs de provedores:

- `openclaw status --usage`
- `openclaw models status --json`

Veja [CLI de modelos](/pt-BR/cli/models).

### 7) Sumarização de proteção de Compaction

A proteção de Compaction pode resumir o histórico da sessão usando o **modelo atual**, o que
invoca APIs de provedores quando ela é executada.

Veja [Gerenciamento de sessão + Compaction](/pt-BR/reference/session-management-compaction).

### 8) Varredura / sondagem de modelo

`openclaw models scan` pode sondar modelos OpenRouter e usa `OPENROUTER_API_KEY` quando
a sondagem está habilitada.

Veja [CLI de modelos](/pt-BR/cli/models).

### 9) Talk (fala)

O modo Talk pode invocar **ElevenLabs** quando configurado:

- `ELEVENLABS_API_KEY` ou `talk.providers.elevenlabs.apiKey`

Veja [Modo Talk](/pt-BR/nodes/talk).

### 10) Skills (APIs de terceiros)

Skills podem armazenar `apiKey` em `skills.entries.<name>.apiKey`. Se uma skill usar essa chave para APIs
externas, ela pode incorrer em custos de acordo com o provedor da skill.

Veja [Skills](/pt-BR/tools/skills).

## Relacionados

- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Cache de prompts](/pt-BR/reference/prompt-caching)
- [Rastreamento de uso](/pt-BR/concepts/usage-tracking)
