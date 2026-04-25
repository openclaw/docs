---
read_when:
    - Você quer entender quais recursos podem chamar APIs pagas
    - Você precisa auditar chaves, custos e visibilidade de uso
    - Você está explicando o relatório de custos do /status ou /usage
summary: Audite o que pode gerar custos, quais chaves são usadas e como visualizar o uso
title: Uso da API e custos
x-i18n:
    generated_at: "2026-04-25T13:55:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2958c0961b46961d942a5bb6e7954eda6bf3d0f659ae0bffb390a8502e00ff38
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# Uso da API e custos

Este documento lista os **recursos que podem invocar chaves de API** e onde seus custos aparecem. Ele se concentra em
recursos do OpenClaw que podem gerar uso de provedor ou chamadas pagas de API.

## Onde os custos aparecem (chat + CLI)

**Resumo de custo por sessão**

- `/status` mostra o modelo atual da sessão, uso de contexto e tokens da última resposta.
- Se o modelo usar **autenticação por chave de API**, `/status` também mostrará o **custo estimado** da última resposta.
- Se os metadados da sessão ao vivo estiverem escassos, `/status` poderá recuperar
  contadores de tokens/cache e o rótulo do modelo ativo em tempo de execução a partir da entrada
  de uso mais recente da transcrição. Valores ativos não zero existentes ainda têm precedência, e totais
  da transcrição no tamanho do prompt podem prevalecer quando os totais armazenados estiverem ausentes ou forem menores.

**Rodapé de custo por mensagem**

- `/usage full` acrescenta um rodapé de uso a cada resposta, incluindo **custo estimado** (somente chave de API).
- `/usage tokens` mostra apenas tokens; fluxos de OAuth/token no estilo assinatura e da CLI ocultam o custo em dólar.
- Observação sobre Gemini CLI: quando a CLI retorna saída em JSON, o OpenClaw lê o uso de
  `stats`, normaliza `stats.cached` em `cacheRead` e deriva os tokens de entrada
  de `stats.input_tokens - stats.cached` quando necessário.

Observação sobre Anthropic: a equipe da Anthropic nos informou que o uso do Claude CLI no estilo OpenClaw está
permitido novamente, então o OpenClaw trata a reutilização do Claude CLI e o uso de `claude -p` como
autorizados para esta integração, a menos que a Anthropic publique uma nova política.
A Anthropic ainda não expõe uma estimativa em dólar por mensagem que o OpenClaw possa
mostrar em `/usage full`.

**Janelas de uso da CLI (cotas do provedor)**

- `openclaw status --usage` e `openclaw channels list` mostram **janelas de uso**
  do provedor (resumos de cota, não custos por mensagem).
- A saída legível por humanos é normalizada para `X% left` entre provedores.
- Provedores atuais com janelas de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.
- Observação sobre MiniMax: seus campos brutos `usage_percent` / `usagePercent` significam
  cota restante, então o OpenClaw os inverte antes de exibi-los. Campos baseados em contagem ainda prevalecem
  quando presentes. Se o provedor retornar `model_remains`, o OpenClaw prefere a entrada
  do modelo de chat, deriva o rótulo da janela a partir de timestamps quando necessário e
  inclui o nome do modelo no rótulo do plano.
- A autenticação de uso para essas janelas de cota vem de hooks específicos do provedor quando
  disponíveis; caso contrário, o OpenClaw recorre à correspondência de credenciais OAuth/chave de API
  de perfis de autenticação, ambiente ou configuração.

Consulte [Uso de tokens e custos](/pt-BR/reference/token-use) para detalhes e exemplos.

## Como as chaves são descobertas

O OpenClaw pode obter credenciais de:

- **Perfis de autenticação** (por agente, armazenados em `auth-profiles.json`).
- **Variáveis de ambiente** (por exemplo, `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Configuração** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) que podem exportar chaves para o ambiente do processo da skill.

## Recursos que podem consumir chaves

### 1) Respostas do modelo principal (chat + ferramentas)

Cada resposta ou chamada de ferramenta usa o **provedor do modelo atual** (OpenAI, Anthropic etc.). Essa é a
principal fonte de uso e custo.

Isso também inclui provedores hospedados no estilo assinatura que ainda cobram fora
da UI local do OpenClaw, como **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** e
o caminho de login Claude da Anthropic no OpenClaw com **Extra Usage** habilitado.

Consulte [Models](/pt-BR/providers/models) para configuração de preços e [Uso de tokens e custos](/pt-BR/reference/token-use) para exibição.

### 2) Entendimento de mídia (áudio/imagem/vídeo)

Mídia recebida pode ser resumida/transcrita antes de a resposta ser executada. Isso usa APIs de modelo/provedor.

- Áudio: OpenAI / Groq / Deepgram / Google / Mistral.
- Imagem: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Vídeo: Google / Qwen / Moonshot.

Consulte [Entendimento de mídia](/pt-BR/nodes/media-understanding).

### 3) Geração de imagem e vídeo

Capacidades compartilhadas de geração também podem consumir chaves de provedor:

- Geração de imagem: OpenAI / Google / fal / MiniMax
- Geração de vídeo: Qwen

A geração de imagem pode inferir um provedor padrão com autenticação quando
`agents.defaults.imageGenerationModel` não estiver definido. A geração de vídeo atualmente
exige um `agents.defaults.videoGenerationModel` explícito, como
`qwen/wan2.6-t2v`.

Consulte [Geração de imagem](/pt-BR/tools/image-generation), [Qwen Cloud](/pt-BR/providers/qwen)
e [Models](/pt-BR/concepts/models).

### 4) Embeddings de memória + busca semântica

A busca semântica de memória usa **APIs de embeddings** quando configurada para provedores remotos:

- `memorySearch.provider = "openai"` → embeddings da OpenAI
- `memorySearch.provider = "gemini"` → embeddings do Gemini
- `memorySearch.provider = "voyage"` → embeddings da Voyage
- `memorySearch.provider = "mistral"` → embeddings da Mistral
- `memorySearch.provider = "lmstudio"` → embeddings do LM Studio (local/autohospedado)
- `memorySearch.provider = "ollama"` → embeddings do Ollama (local/autohospedado; normalmente sem cobrança de API hospedada)
- Fallback opcional para um provedor remoto se os embeddings locais falharem

Você pode manter isso local com `memorySearch.provider = "local"` (sem uso de API).

Consulte [Memory](/pt-BR/concepts/memory).

### 5) Ferramenta de busca na web

`web_search` pode gerar cobranças de uso dependendo do seu provedor:

- **Brave Search API**: `BRAVE_API_KEY` ou `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` ou `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` ou `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` ou `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` ou `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: sem chave por padrão, mas exige um host Ollama acessível mais `ollama signin`; também pode reutilizar a autenticação bearer normal do provedor Ollama quando o host a exigir
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` ou `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` ou `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback sem chave (sem cobrança de API, mas não oficial e baseado em HTML)
- **SearXNG**: `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl` (sem chave/autohospedado; sem cobrança de API hospedada)

Caminhos legados de provedor em `tools.web.search.*` ainda são carregados pelo shim temporário de compatibilidade, mas não são mais a superfície de configuração recomendada.

**Crédito gratuito do Brave Search:** cada plano do Brave inclui US$ 5/mês em
crédito gratuito renovável. O plano Search custa US$ 5 por 1.000 solicitações, então o
crédito cobre 1.000 solicitações/mês sem custo. Defina seu limite de uso no dashboard do Brave
para evitar cobranças inesperadas.

Consulte [Ferramentas web](/pt-BR/tools/web).

### 5) Ferramenta de busca de páginas web (Firecrawl)

`web_fetch` pode chamar o **Firecrawl** quando uma chave de API estiver presente:

- `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webFetch.apiKey`

Se o Firecrawl não estiver configurado, a ferramenta recorre a busca direta mais o Plugin
`web-readability` incluído (sem API paga). Desative `plugins.entries.web-readability.enabled` para ignorar a extração Readability local.

Consulte [Ferramentas web](/pt-BR/tools/web).

### 6) Resumos de uso do provedor (status/saúde)

Alguns comandos de status chamam **endpoints de uso do provedor** para exibir janelas de cota ou a integridade da autenticação.
Essas normalmente são chamadas de baixo volume, mas ainda assim acessam APIs do provedor:

- `openclaw status --usage`
- `openclaw models status --json`

Consulte [CLI de Models](/pt-BR/cli/models).

### 7) Sumarização de proteção do Compaction

A proteção do Compaction pode resumir o histórico da sessão usando o **modelo atual**, o que
invoca APIs do provedor quando é executada.

Consulte [Gerenciamento de sessão + compaction](/pt-BR/reference/session-management-compaction).

### 8) Varredura / sondagem de modelos

`openclaw models scan` pode sondar modelos do OpenRouter e usa `OPENROUTER_API_KEY` quando
a sondagem está habilitada.

Consulte [CLI de Models](/pt-BR/cli/models).

### 9) Talk (fala)

O modo Talk pode invocar **ElevenLabs** quando configurado:

- `ELEVENLABS_API_KEY` ou `talk.providers.elevenlabs.apiKey`

Consulte [Modo Talk](/pt-BR/nodes/talk).

### 10) Skills (APIs de terceiros)

As Skills podem armazenar `apiKey` em `skills.entries.<name>.apiKey`. Se uma skill usar essa chave para
APIs externas, ela poderá gerar custos de acordo com o provedor da skill.

Consulte [Skills](/pt-BR/tools/skills).

## Relacionado

- [Uso de tokens e custos](/pt-BR/reference/token-use)
- [Cache de prompt](/pt-BR/reference/prompt-caching)
- [Rastreamento de uso](/pt-BR/concepts/usage-tracking)
