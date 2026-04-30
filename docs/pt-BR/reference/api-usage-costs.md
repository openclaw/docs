---
read_when:
    - Você quer entender quais recursos podem chamar APIs pagas
    - É necessário auditar chaves, custos e visibilidade de uso
    - Você está explicando os relatórios de custos de /status ou /usage
summary: Audite o que pode gastar dinheiro, quais chaves são usadas e como visualizar o uso
title: Uso e custos da API
x-i18n:
    generated_at: "2026-04-30T10:07:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5638007a77a93701ce4ed9139a6c4377c951e2d69941423c3e1b19b5bd52d5d5
    source_path: reference/api-usage-costs.md
    workflow: 16
---

# Uso e custos de API

Este documento lista **recursos que podem invocar chaves de API** e onde seus custos aparecem. Ele se concentra em
recursos do OpenClaw que podem gerar uso de provedor ou chamadas de API pagas.

## Onde os custos aparecem (chat + CLI)

**Instantâneo de custo por sessão**

- `/status` mostra o modelo da sessão atual, o uso de contexto e os tokens da última resposta.
- Se o modelo usa **autenticação por chave de API**, `/status` também mostra o **custo estimado** da última resposta.
- Se os metadados da sessão ao vivo estiverem escassos, `/status` pode recuperar contadores
  de tokens/cache e o rótulo do modelo de runtime ativo a partir da entrada de uso
  da transcrição mais recente. Valores ao vivo não zero existentes ainda têm precedência, e totais
  de transcrição do tamanho do prompt podem prevalecer quando os totais armazenados estão ausentes ou são menores.

**Rodapé de custo por mensagem**

- `/usage full` acrescenta um rodapé de uso a cada resposta, incluindo **custo estimado** (somente chave de API).
- `/usage tokens` mostra apenas tokens; fluxos de OAuth/token no estilo assinatura e CLI ocultam o custo em dinheiro.
- Observação sobre Gemini CLI: quando a CLI retorna saída JSON, o OpenClaw lê o uso de
  `stats`, normaliza `stats.cached` para `cacheRead` e deriva tokens de entrada
  de `stats.input_tokens - stats.cached` quando necessário.

Observação sobre Anthropic: a equipe da Anthropic nos informou que o uso do Claude CLI no estilo OpenClaw
foi permitido novamente, então o OpenClaw trata a reutilização do Claude CLI e o uso de `claude -p` como
sancionados para esta integração, a menos que a Anthropic publique uma nova política.
A Anthropic ainda não expõe uma estimativa em dinheiro por mensagem que o OpenClaw possa
mostrar em `/usage full`.

**Janelas de uso da CLI (cotas de provedor)**

- `openclaw status --usage` e `openclaw channels list` mostram **janelas de uso** do provedor
  (instantâneos de cota, não custos por mensagem).
- A saída legível por humanos é normalizada para `X% left` entre provedores.
- Provedores atuais de janelas de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.
- Observação sobre MiniMax: seus campos brutos `usage_percent` / `usagePercent` significam cota restante,
  então o OpenClaw os inverte antes de exibir. Campos baseados em contagem ainda prevalecem
  quando presentes. Se o provedor retorna `model_remains`, o OpenClaw prefere a entrada
  do modelo de chat, deriva o rótulo da janela a partir dos carimbos de data/hora quando necessário e
  inclui o nome do modelo no rótulo do plano.
- A autenticação de uso para essas janelas de cota vem de hooks específicos do provedor quando
  disponíveis; caso contrário, o OpenClaw recorre a credenciais OAuth/chave de API correspondentes
  de perfis de autenticação, env ou configuração.

Consulte [Uso de tokens e custos](/pt-BR/reference/token-use) para detalhes e exemplos.

## Como as chaves são descobertas

O OpenClaw pode obter credenciais de:

- **Perfis de autenticação** (por agente, armazenados em `auth-profiles.json`).
- **Variáveis de ambiente** (por exemplo, `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Configuração** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), que podem exportar chaves para o env do processo da skill.

## Recursos que podem gastar chaves

### 1) Respostas do modelo principal (chat + ferramentas)

Cada resposta ou chamada de ferramenta usa o **provedor do modelo atual** (OpenAI, Anthropic etc.). Esta é a
principal fonte de uso e custo.

Isso também inclui provedores hospedados no estilo assinatura que ainda cobram fora
da UI local do OpenClaw, como **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** e
o caminho de login do Claude da Anthropic no OpenClaw com **Extra Usage** ativado.

Consulte [Modelos](/pt-BR/providers/models) para configuração de preços e [Uso de tokens e custos](/pt-BR/reference/token-use) para exibição.

### 2) Compreensão de mídia (áudio/imagem/vídeo)

Mídia recebida pode ser resumida/transcrita antes da resposta ser executada. Isso usa APIs de modelo/provedor.

- Áudio: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Imagem: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Vídeo: Google / Qwen / Moonshot.

Consulte [Compreensão de mídia](/pt-BR/nodes/media-understanding).

### 3) Geração de imagem e vídeo

Recursos compartilhados de geração também podem gastar chaves de provedor:

- Geração de imagem: OpenAI / Google / DeepInfra / fal / MiniMax
- Geração de vídeo: DeepInfra / Qwen

A geração de imagem pode inferir um padrão de provedor apoiado por autenticação quando
`agents.defaults.imageGenerationModel` não está definido. Atualmente, a geração de vídeo
exige um `agents.defaults.videoGenerationModel` explícito, como
`qwen/wan2.6-t2v`.

Consulte [Geração de imagem](/pt-BR/tools/image-generation), [Qwen Cloud](/pt-BR/providers/qwen)
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
- Fallback opcional para um provedor remoto se os embeddings locais falharem

Você pode mantê-la local com `memorySearch.provider = "local"` (sem uso de API).

Consulte [Memória](/pt-BR/concepts/memory).

### 5) Ferramenta de busca na Web

`web_search` pode gerar cobranças de uso dependendo do seu provedor:

- **Brave Search API**: `BRAVE_API_KEY` ou `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` ou `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` ou `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` ou `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` ou `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: sem chave para um host local do Ollama conectado e acessível; a busca direta em `https://ollama.com` usa `OLLAMA_API_KEY`, e hosts protegidos por autenticação podem reutilizar a autenticação bearer normal do provedor Ollama
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` ou `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` ou `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback sem chave (sem cobrança de API, mas não oficial e baseado em HTML)
- **SearXNG**: `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl` (sem chave/auto-hospedado; sem cobrança de API hospedada)

Caminhos legados de provedor `tools.web.search.*` ainda são carregados pelo shim temporário de compatibilidade, mas não são mais a superfície de configuração recomendada.

**Crédito gratuito do Brave Search:** Cada plano Brave inclui US$ 5/mês em crédito gratuito
renovável. O plano Search custa US$ 5 por 1.000 solicitações, então o crédito cobre
1.000 solicitações/mês sem cobrança. Defina seu limite de uso no painel do Brave
para evitar cobranças inesperadas.

Consulte [Ferramentas Web](/pt-BR/tools/web).

### 5) Ferramenta de busca Web (Firecrawl)

`web_fetch` pode chamar **Firecrawl** quando uma chave de API está presente:

- `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webFetch.apiKey`

Se o Firecrawl não estiver configurado, a ferramenta recorre à busca direta mais o Plugin `web-readability` incluído (sem API paga). Desative `plugins.entries.web-readability.enabled` para ignorar a extração local de Readability.

Consulte [Ferramentas Web](/pt-BR/tools/web).

### 6) Instantâneos de uso do provedor (status/integridade)

Alguns comandos de status chamam **endpoints de uso do provedor** para exibir janelas de cota ou integridade de autenticação.
Normalmente são chamadas de baixo volume, mas ainda atingem APIs do provedor:

- `openclaw status --usage`
- `openclaw models status --json`

Consulte [CLI de modelos](/pt-BR/cli/models).

### 7) Sumarização de proteção de Compaction

A proteção de Compaction pode resumir o histórico da sessão usando o **modelo atual**, o que
invoca APIs do provedor quando executada.

Consulte [Gerenciamento de sessões + Compaction](/pt-BR/reference/session-management-compaction).

### 8) Varredura / sondagem de modelos

`openclaw models scan` pode sondar modelos do OpenRouter e usa `OPENROUTER_API_KEY` quando
a sondagem está ativada.

Consulte [CLI de modelos](/pt-BR/cli/models).

### 9) Talk (fala)

O modo Talk pode invocar **ElevenLabs** quando configurado:

- `ELEVENLABS_API_KEY` ou `talk.providers.elevenlabs.apiKey`

Consulte [Modo Talk](/pt-BR/nodes/talk).

### 10) Skills (APIs de terceiros)

Skills podem armazenar `apiKey` em `skills.entries.<name>.apiKey`. Se uma skill usar essa chave para APIs
externas, ela pode gerar custos de acordo com o provedor da skill.

Consulte [Skills](/pt-BR/tools/skills).

## Relacionados

- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Cache de prompts](/pt-BR/reference/prompt-caching)
- [Rastreamento de uso](/pt-BR/concepts/usage-tracking)
