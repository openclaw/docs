---
read_when:
    - Você quer entender quais recursos podem chamar APIs pagas
    - Você precisa auditar chaves, custos e visibilidade de uso
    - Você está explicando os relatórios de custos de /status ou /usage
summary: Audite o que pode gerar custos, quais chaves são usadas e como visualizar o uso
title: Uso e custos da API
x-i18n:
    generated_at: "2026-07-12T15:35:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b35ad64f83572eb8c01b59ee57368fd7ba20cb83ccac835281859796f782c1dd
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Mapa dos recursos do OpenClaw que podem chamar APIs pagas de provedores, de onde cada um lê suas credenciais e onde o custo resultante é exibido.

## Onde os custos são exibidos

**`/status`** (instantâneo por sessão)

- Mostra o modelo da sessão atual, o uso do contexto e os tokens da última resposta.
- Adiciona um **custo estimado** para a última resposta quando o OpenClaw tem metadados de uso e preços locais para o modelo ativo, incluindo provedores sem chave de API com preços definidos explicitamente, como modelos `aws-sdk` do Bedrock.
- Se o instantâneo da sessão ativa tiver poucos dados, `/status` recupera os contadores de tokens/cache e o rótulo do modelo ativo da entrada de uso mais recente da transcrição. Valores ativos existentes diferentes de zero prevalecem sobre os dados da transcrição; um total da transcrição correspondente ao tamanho do prompt ainda pode prevalecer quando o total armazenado estiver ausente ou for menor.

**`/usage`** (rodapé por mensagem)

- `/usage full` adiciona um rodapé de uso a cada resposta, incluindo o **custo estimado** quando os preços locais estão configurados e os metadados de uso estão disponíveis.
- `/usage tokens` mostra apenas tokens. OAuth/token em estilo de assinatura e runtimes de CLI mostram apenas tokens, a menos que forneçam metadados de uso compatíveis e um preço local explícito.
- `/usage cost` exibe um resumo de custos locais; `/usage off` desativa o rodapé.
- Observação sobre a CLI do Gemini: tanto a saída `stream-json` quanto a saída legada `json` incluem o uso em `stats`. O OpenClaw normaliza `stats.cached` como `cacheRead` e, quando necessário, deriva os tokens de entrada de `stats.input_tokens - stats.cached`.

**Interface de controle → Uso** (análise entre sessões)

- Mostra os totais de tokens e custos estimados derivados das transcrições para o intervalo de datas selecionado, com detalhamentos por provedor, modelo, agente, canal e tipo de token.
- Compara janelas de calendário mais curtas que terminam na data final do intervalo selecionado. Datas ausentes contam como dias do calendário com uso zero; elas não são ignoradas para criar uma janela mais densa.
- Identifica diretamente a escala do gráfico diário. Um selo `√` indica que a compressão por raiz quadrada está mantendo visíveis os dias de baixo uso.
- Esses totais descrevem o histórico de sessões local disponível, não uma fatura do provedor nem um registro de cobranças vitalício. A interface avisa quando faltam preços para algumas entradas.

**Janelas de uso da CLI** (cotas do provedor, não custo por mensagem)

- `openclaw status --usage` e `openclaw channels list` mostram as **janelas de uso** do provedor como `X% left`.
- Provedores atuais de janelas de uso: Anthropic, ClawRouter, DeepSeek, GitHub Copilot, CLI do Gemini, MiniMax, OpenAI (abrange autenticação OAuth/token do ChatGPT/Codex), Xiaomi e z.ai. Consulte [CLI de modelos](/pt-BR/cli/models) e [CLI de canais](/pt-BR/cli/channels) para ver a lista completa de provedores/opções.
- Os campos brutos `usage_percent` / `usagePercent` do MiniMax informam a cota restante, portanto o OpenClaw os inverte; campos baseados em contagem prevalecem quando presentes. Se a resposta incluir um array `model_remains`, o OpenClaw seleciona a entrada do modelo de chat, deriva o rótulo da janela dos carimbos de data/hora quando necessário e inclui o nome do modelo no rótulo do plano.
- A autenticação de uso vem de hooks específicos do provedor quando disponíveis; caso contrário, o OpenClaw recorre a credenciais OAuth/chave de API correspondentes, obtidas de perfis de autenticação, variáveis de ambiente ou configuração.

Consulte [Uso e custos de tokens](/pt-BR/reference/token-use) para ver exemplos detalhados.

<Note>
A Anthropic confirmou que a reutilização da CLI do Claude (incluindo `claude -p`) é um padrão de integração autorizado, a menos que publique uma nova política. A Anthropic não disponibiliza uma estimativa em dólares por mensagem, portanto `/usage full` não pode mostrar o custo do uso da CLI do Claude.
</Note>

## Como as chaves são descobertas

- **Perfis de autenticação**: específicos por agente, armazenados em `auth-profiles.json`.
- **Variáveis de ambiente**: por exemplo, `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`.
- **Configuração**: `models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`, `plugins.entries.firecrawl.config.webFetch.apiKey`, `agents.defaults.memorySearch.*`, `talk.providers.*.apiKey`.
- **Skills**: `skills.entries.<name>.apiKey`, que pode exportar a chave para o ambiente do processo da skill.

## Recursos que podem consumir chaves

### Respostas do modelo principal (chat + ferramentas)

Cada resposta ou chamada de ferramenta é executada no provedor do modelo atual. Essa é a principal fonte de uso e custo, incluindo planos hospedados em estilo de assinatura cuja cobrança ocorre fora da interface local do OpenClaw: OpenAI Codex, Alibaba Cloud Model Studio Coding Plan, MiniMax Coding Plan, Z.AI/GLM Coding Plan e o fluxo de login do Claude da Anthropic com Extra Usage habilitado.

Consulte [Modelos](/pt-BR/providers/models) para ver a configuração de preços e [Uso e custos de tokens](/pt-BR/reference/token-use) para ver a exibição.

### Compreensão de mídia (áudio/imagem/vídeo)

A mídia recebida pode ser resumida ou transcrita por meio da API de um provedor antes da execução do pipeline de resposta. O suporte a provedores é registrado por Plugin e muda conforme plugins são adicionados; consulte [Compreensão de mídia](/pt-BR/nodes/media-understanding) para ver a lista e a configuração atuais.

### Geração de imagens e vídeos

`image_generate` e `video_generate` encaminham para qualquer provedor configurado que esteja disponível. A geração de imagens pode inferir um provedor padrão respaldado por autenticação quando `agents.defaults.imageGenerationModel` não está definido; a geração de vídeos exige um `agents.defaults.videoGenerationModel` explícito (por exemplo, `qwen/wan2.6-t2v`).

Consulte [Geração de imagens](/pt-BR/tools/image-generation) e [Geração de vídeos](/pt-BR/tools/video-generation) para ver a lista atual de provedores.

### Embeddings de memória e pesquisa semântica

A pesquisa semântica na memória usa APIs de embeddings quando `agents.defaults.memorySearch.provider` indica um adaptador remoto (por exemplo, `openai`, `gemini`, `voyage`, `mistral`, `deepinfra`, `github-copilot`, `amazon-bedrock`). `memorySearch.provider = "lmstudio"` ou `"ollama"` é executado em um servidor local/auto-hospedado e normalmente não gera cobrança de hospedagem. `memorySearch.provider = "local"` mantém tudo no dispositivo, sem uso de API. Um provedor opcional em `memorySearch.fallback` pode cobrir falhas dos embeddings locais.

Consulte [Memória](/pt-BR/concepts/memory).

### Ferramenta de pesquisa na web

`web_search` pode gerar cobranças de uso, dependendo do provedor selecionado. Cada provedor lê sua chave primeiro de uma variável de ambiente e depois de `plugins.entries.<id>.config.webSearch.apiKey`:

| Provedor               | Variável(is) de ambiente                                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brave Search           | `BRAVE_API_KEY`                                                                                                                                                        |
| DuckDuckGo             | sem chave; não oficial, baseado em HTML, sem cobrança                                                                                                                  |
| Exa                    | `EXA_API_KEY`                                                                                                                                                          |
| Firecrawl              | `FIRECRAWL_API_KEY`                                                                                                                                                    |
| Gemini (Google Search) | `GEMINI_API_KEY`                                                                                                                                                       |
| Grok (xAI)             | perfil OAuth da xAI ou `XAI_API_KEY`                                                                                                                                   |
| Kimi (Moonshot)        | `KIMI_API_KEY` ou `MOONSHOT_API_KEY`                                                                                                                                   |
| MiniMax Search         | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` ou `MINIMAX_API_KEY`                                                                          |
| Ollama Web Search      | sem chave para um host local acessível com sessão iniciada; a pesquisa direta em `https://ollama.com` usa `OLLAMA_API_KEY`; hosts protegidos por autenticação reutilizam a autenticação bearer normal do provedor Ollama |
| Parallel               | `PARALLEL_API_KEY`                                                                                                                                                     |
| Perplexity Search API  | `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY`                                                                                                                           |
| SearXNG                | `SEARXNG_BASE_URL`; sem chave/auto-hospedado, sem cobrança de hospedagem                                                                                               |
| Tavily                 | `TAVILY_API_KEY`                                                                                                                                                       |

Os caminhos legados de configuração `tools.web.search.*` ainda são carregados por meio de um shim de compatibilidade, mas não são mais a interface recomendada.

**Crédito gratuito do Brave Search**: cada plano inclui US$ 5/mês em crédito gratuito renovável. O plano Search custa US$ 5 por 1.000 solicitações, portanto o crédito cobre 1.000 solicitações/mês sem cobrança. Defina um limite de uso no painel do Brave para evitar cobranças inesperadas.

Consulte [Ferramentas web](/pt-BR/tools/web).

### Ferramenta de busca de conteúdo web (Firecrawl)

`web_fetch` pode chamar o Firecrawl com acesso inicial sem chave; adicione `FIRECRAWL_API_KEY` (ou `plugins.entries.firecrawl.config.webFetch.apiKey`) para obter limites maiores. Se o Firecrawl não estiver configurado, a ferramenta recorre à busca direta junto com o plugin `web-readability` incluído (sem API paga). Desative `plugins.entries.web-readability.enabled` para ignorar a extração local do Readability.

Consulte [Ferramentas web](/pt-BR/tools/web).

### Instantâneos de uso do provedor (status/integridade)

`openclaw status --usage` e `openclaw models status --json` chamam endpoints de uso do provedor para mostrar janelas de cota ou a integridade da autenticação. As chamadas têm baixo volume, mas ainda acessam as APIs do provedor.

Consulte [CLI de modelos](/pt-BR/cli/models).

### Sumarização de proteção da Compaction

A proteção da Compaction pode resumir o histórico da sessão usando o modelo atual, o que invoca APIs do provedor quando é executada.

Consulte [Gerenciamento de sessões e Compaction](/pt-BR/reference/session-management-compaction).

### Varredura/sondagem de modelos

`openclaw models scan` pode sondar modelos do OpenRouter e usa `OPENROUTER_API_KEY` quando a sondagem está habilitada.

Consulte [CLI de modelos](/pt-BR/cli/models).

### Conversa (fala)

O modo de conversa pode invocar o ElevenLabs quando configurado: `ELEVENLABS_API_KEY` ou `talk.providers.elevenlabs.apiKey`.

Consulte [Modo de conversa](/pt-BR/nodes/talk).

### Skills (APIs de terceiros)

As Skills podem armazenar `apiKey` em `skills.entries.<name>.apiKey`. Se uma skill usar essa chave em uma API externa, o custo seguirá o provedor da skill.

Consulte [Skills](/pt-BR/tools/skills).

## Relacionados

- [Uso e custos de tokens](/pt-BR/reference/token-use)
- [Cache de prompts](/pt-BR/reference/prompt-caching)
- [Rastreamento de uso](/pt-BR/concepts/usage-tracking)
