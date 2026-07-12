---
read_when:
    - Você está decidindo se um plugin é distribuído no pacote npm principal ou instalado separadamente
    - Você está atualizando os metadados de pacote de plugins incluídos ou a automação de lançamento
    - Você precisa da lista canônica de plugins internos e externos
summary: Inventário gerado de plugins do OpenClaw incluídos no núcleo, publicados externamente ou mantidos apenas no código-fonte
title: Inventário de plugins
x-i18n:
    generated_at: "2026-07-12T15:31:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: aa3ccb8d9213ec35f0055331cb30509cb92a3e0581e4689bd2c0ce98326d119d
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Inventário de Plugins

Esta página é gerada a partir de `extensions/*/package.json`, `openclaw.plugin.json`
e das exclusões de `files` do pacote npm raiz. Gere-a novamente com:

```bash
pnpm plugins:inventory:gen
```

## Definições

- **Pacote npm principal:** integrado ao pacote npm `openclaw` e disponível sem a instalação separada de um plugin.
- **Pacote externo oficial:** plugin mantido pelo OpenClaw, omitido do pacote npm principal, mantido neste inventário oficial e instalado sob demanda por meio do ClawHub e/ou npm.
- **Somente checkout do código-fonte:** plugin local do repositório, omitido dos artefatos npm publicados e não anunciado como um pacote instalável.

Os checkouts do código-fonte são diferentes das instalações via npm: após `pnpm install`, os plugins
incluídos são carregados de `extensions/<id>`, de modo que as edições locais e as dependências
do workspace locais do pacote fiquem disponíveis.

## Instalar um plugin

Use a opção de instalação de cada entrada para decidir se a instalação é necessária. Os plugins
que indicam `included in OpenClaw` já estão presentes no pacote principal.
Pacotes externos oficiais precisam ser instalados uma vez e, depois, o Gateway deve ser reiniciado.

Por exemplo, o Discord é um pacote externo oficial:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Durante a transição de lançamento, especificações simples de pacotes ainda são instaladas pelo npm.
Use `clawhub:@openclaw/discord` ou `npm:@openclaw/discord` quando precisar de uma
origem explícita. Após a instalação, siga a documentação de configuração do plugin, como
[Discord](/pt-BR/channels/discord), para adicionar credenciais e a configuração do canal. Consulte
[Gerenciar plugins](/pt-BR/plugins/manage-plugins) para ver os comandos de atualização, desinstalação e publicação.

Cada entrada lista o pacote, a rota de distribuição e a descrição.

## Pacote npm principal

64 plugins

- **[admin-http-rpc](/pt-BR/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - incluído no OpenClaw. Endpoint RPC HTTP de administração do OpenClaw.

- **[alibaba](/pt-BR/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - incluído no OpenClaw. Adiciona suporte ao provedor de geração de vídeo.

- **[anthropic](/pt-BR/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - incluído no OpenClaw. Modelos da Anthropic, CLI do Claude e catálogo nativo de sessões do Claude.

- **[azure-speech](/pt-BR/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - incluído no OpenClaw. Conversão de texto em fala do Azure AI Speech (MP3, mensagens de voz nativas em Ogg/Opus, telefonia PCM).

- **[bonjour](/pt-BR/plugins/reference/bonjour)** (`@openclaw/bonjour`) - incluído no OpenClaw. Anuncia o Gateway local do OpenClaw por Bonjour/mDNS.

- **[browser](/pt-BR/plugins/reference/browser)** (`@openclaw/browser-plugin`) - incluído no OpenClaw. Adiciona ferramentas que podem ser chamadas por agentes.

- **[byteplus](/pt-BR/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte aos provedores de modelos BytePlus e BytePlus Plan.

- **[canvas](/pt-BR/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - incluído no OpenClaw. Superfícies experimentais de controle do Canvas e renderização A2UI para nós pareados.

- **[clawrouter](/pt-BR/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte ao provedor de modelos ClawRouter.

- **[cohere](/pt-BR/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - incluído no OpenClaw; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. Plugin do provedor Cohere para OpenClaw.

- **[comfy](/pt-BR/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte ao provedor de modelos ComfyUI.

- **[copilot-proxy](/pt-BR/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte ao provedor de modelos Copilot Proxy.

- **[crabbox](/pt-BR/plugins/reference/crabbox)** (`@openclaw/crabbox-provider`) - incluído no OpenClaw. Provedor de workers na nuvem baseado na CLI do Crabbox.

- **[deepgram](/pt-BR/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - incluído no OpenClaw. Adiciona suporte a provedores de compreensão de mídia. Adiciona suporte a provedores de transcrição em tempo real.

- **[document-extract](/pt-BR/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - incluído no OpenClaw. Extrai texto e, como alternativa, imagens das páginas de anexos de documentos locais.

- **[duckduckgo](/pt-BR/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - incluído no OpenClaw. Adiciona suporte a provedores de pesquisa na web.

- **[elevenlabs](/pt-BR/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - incluído no OpenClaw. Adiciona suporte a provedores de compreensão de mídia. Adiciona suporte a provedores de transcrição em tempo real. Adiciona suporte a provedores de conversão de texto em fala.

- **[fal](/pt-BR/plugins/reference/fal)** (`@openclaw/fal-provider`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte ao provedor de modelos fal.

- **[file-transfer](/pt-BR/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - incluído no OpenClaw. Busca, lista e grava arquivos em nós pareados por meio de comandos de nó dedicados. Contorna o truncamento da saída padrão do bash usando base64 sobre node.invoke para arquivos binários de até 16 MB.

- **[github-copilot](/pt-BR/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte ao provedor de modelos GitHub Copilot.

- **[google](/pt-BR/plugins/reference/google)** (`@openclaw/google-plugin`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte aos provedores de modelos Google, Google Gemini CLI e Google Vertex.

- **[huggingface](/pt-BR/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte ao provedor de modelos Hugging Face.

- **[imessage](/pt-BR/plugins/reference/imessage)** (`@openclaw/imessage`) - incluído no OpenClaw. Adiciona a superfície do canal iMessage para enviar e receber mensagens do OpenClaw.

- **[litellm](/pt-BR/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte ao provedor de modelos LiteLLM.

- **[llm-task](/pt-BR/plugins/reference/llm-task)** (`@openclaw/llm-task`) - incluído no OpenClaw. Ferramenta genérica de LLM, exclusivamente para JSON, destinada a tarefas estruturadas e invocável por fluxos de trabalho.

- **[lmstudio](/pt-BR/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte ao provedor de modelos LM Studio.

- **[logbook](/pt-BR/plugins/reference/logbook)** (`@openclaw/logbook`) - incluído no OpenClaw. Diário de trabalho automático: captura periodicamente imagens da tela de um Node emparelhado e as transforma em uma linha do tempo revisável do seu dia.

- **[memory-core](/pt-BR/plugins/reference/memory-core)** (`@openclaw/memory-core`) - incluído no OpenClaw. Adiciona ferramentas que podem ser chamadas por agentes.

- **[memory-wiki](/pt-BR/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - incluído no OpenClaw. Compilador de wiki persistente e repositório de conhecimento compatível com o Obsidian para o OpenClaw.

- **[meta](/plugins/reference/meta)** (`@openclaw/meta-provider`) - incluído no OpenClaw; npm; ClawHub: `clawhub:@openclaw/meta-provider`. Adiciona ao OpenClaw suporte ao provedor de modelos Meta.

- **[microsoft](/pt-BR/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - incluído no OpenClaw. Adiciona suporte ao provedor de conversão de texto em fala.

- **[microsoft-foundry](/pt-BR/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte ao provedor de modelos Microsoft Foundry.

- **[migrate-claude](/pt-BR/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - incluído no OpenClaw. Importa para o OpenClaw instruções do Claude Code e do Claude Desktop, servidores MCP, Skills e configurações seguras.

- **[migrate-hermes](/pt-BR/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - incluído no OpenClaw. Importa para o OpenClaw configurações, memórias, Skills e credenciais compatíveis do Hermes.

- **[minimax](/pt-BR/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte aos provedores de modelos MiniMax e MiniMax Portal.

- **[mistral](/pt-BR/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte ao provedor de modelos Mistral.

- **[novita](/pt-BR/plugins/reference/novita)** (`@openclaw/novita-provider`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte aos provedores de modelos Novita, Novita AI e Novitaai.

- **[nvidia](/pt-BR/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte ao provedor de modelos NVIDIA.

- **[oc-path](/pt-BR/plugins/reference/oc-path)** (`@openclaw/oc-path`) - incluído no OpenClaw. Adiciona a CLI de caminhos do openclaw para endereçar arquivos do espaço de trabalho com oc://.

- **[ollama](/pt-BR/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte aos provedores de modelos Ollama e Ollama Cloud.

- **[open-prose](/pt-BR/plugins/reference/open-prose)** (`@openclaw/open-prose`) - incluído no OpenClaw. Pacote de Skills da VM OpenProse com um comando de barra /prose.

- **[openai](/pt-BR/plugins/reference/openai)** (`@openclaw/openai-provider`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte ao provedor de modelos OpenAI.

- **[opencode](/pt-BR/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte ao provedor de modelos OpenCode.

- **[opencode-go](/pt-BR/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte ao provedor de modelos OpenCode Go.

- **[openrouter](/pt-BR/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte ao provedor de modelos OpenRouter.

- **[policy](/pt-BR/plugins/reference/policy)** (`@openclaw/policy`) - incluído no OpenClaw. Adiciona verificações do doctor baseadas em políticas para garantir a conformidade do espaço de trabalho.

- **[runway](/pt-BR/plugins/reference/runway)** (`@openclaw/runway-provider`) - incluído no OpenClaw. Adiciona suporte ao provedor de geração de vídeos.

- **[senseaudio](/pt-BR/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - incluído no OpenClaw. Adiciona suporte ao provedor de compreensão de mídia.

- **[sglang](/pt-BR/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte ao provedor de modelos SGLang.

- **[synthetic](/pt-BR/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte ao provedor de modelos Synthetic.

- **[telegram](/pt-BR/plugins/reference/telegram)** (`@openclaw/telegram`) - incluído no OpenClaw. Adiciona a superfície do canal Telegram para enviar e receber mensagens do OpenClaw.

- **[together](/pt-BR/plugins/reference/together)** (`@openclaw/together-provider`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte ao provedor de modelos Together.

- **[tts-local-cli](/pt-BR/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - incluído no OpenClaw. Adiciona suporte ao provedor de conversão de texto em fala.

- **[vault](/pt-BR/plugins/reference/vault)** (`@openclaw/vault`) - incluído no OpenClaw. Integração com o provedor SecretRef do HashiCorp Vault.

- **[vllm](/pt-BR/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte ao provedor de modelos vLLM.

- **[volcengine](/pt-BR/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte aos provedores de modelos Volcengine e Volcengine Plan.

- **[voyage](/pt-BR/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - incluído no OpenClaw. Adiciona suporte ao provedor de embeddings de memória.

- **[vydra](/pt-BR/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte ao provedor de modelos Vydra.

- **[web-readability](/pt-BR/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - incluído no OpenClaw. Extrai conteúdo legível de artigos de respostas locais de busca de páginas web em HTML.

- **[webhooks](/pt-BR/plugins/reference/webhooks)** (`@openclaw/webhooks`) - incluído no OpenClaw. Webhooks de entrada autenticados que vinculam automações externas aos TaskFlows do OpenClaw.

- **[workboard](/pt-BR/plugins/reference/workboard)** (`@openclaw/workboard`) - incluído no OpenClaw. Painel de trabalho para problemas e sessões pertencentes a agentes.

- **[workspaces](/plugins/reference/workspaces)** (`@openclaw/workspaces-plugin`) - incluído no OpenClaw. Backend de documentos e plano de controle de Workspaces que pode ser composto por agentes.

- **[xai](/pt-BR/plugins/reference/xai)** (`@openclaw/xai-plugin`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte ao provedor de modelos xAI.

- **[xiaomi](/pt-BR/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - incluído no OpenClaw. Adiciona ao OpenClaw suporte aos provedores de modelos Xiaomi e Xiaomi Token Plan.

## Pacotes externos oficiais

70 plugins

- **[acpx](/pt-BR/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub. Backend de runtime ACP do OpenClaw com gerenciamento de sessões e transporte sob responsabilidade do plugin.

- **[amazon-bedrock](/pt-BR/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub. Plugin de provedor Amazon Bedrock do OpenClaw com descoberta de modelos, embeddings e suporte a proteções.

- **[amazon-bedrock-mantle](/pt-BR/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. Plugin de provedor Amazon Bedrock Mantle do OpenClaw para roteamento de modelos compatível com OpenAI.

- **[anthropic-vertex](/pt-BR/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. Plugin de provedor Anthropic Vertex do OpenClaw para modelos Claude no Google Vertex AI.

- **[arcee](/pt-BR/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. Adiciona ao OpenClaw suporte ao provedor de modelos Arcee.

- **[brave](/pt-BR/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. Plugin de provedor Brave Search do OpenClaw para pesquisa na web.

- **[cerebras](/pt-BR/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. Adiciona ao OpenClaw suporte ao provedor de modelos Cerebras.

- **[chutes](/pt-BR/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. Adiciona ao OpenClaw suporte ao provedor de modelos Chutes.

- **[clickclack](/pt-BR/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. Adiciona a interface de canal Clickclack para enviar e receber mensagens do OpenClaw.

- **[cloudflare-ai-gateway](/pt-BR/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. Adiciona ao OpenClaw suporte ao provedor de modelos Cloudflare AI Gateway.

- **[codex](/pt-BR/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. Harness do servidor de aplicativo Codex, provedor de modelos e catálogo nativo de sessões.

- **[copilot](/pt-BR/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. Registra o runtime do agente GitHub Copilot.

- **[deepinfra](/pt-BR/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. Adiciona ao OpenClaw suporte ao provedor de modelos DeepInfra.

- **[deepseek](/pt-BR/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. Adiciona ao OpenClaw suporte ao provedor de modelos DeepSeek.

- **[diagnostics-otel](/pt-BR/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. Exportador de diagnóstico OpenTelemetry do OpenClaw para métricas, rastreamentos e logs.

- **[diagnostics-prometheus](/pt-BR/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. Exportador de diagnóstico Prometheus do OpenClaw para métricas de runtime.

- **[diffs](/pt-BR/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. Plugin de visualização de diferenças somente leitura e renderizador de arquivos do OpenClaw para agentes.

- **[diffs-language-pack](/pt-BR/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. Adiciona realce de sintaxe para linguagens não incluídas no conjunto padrão do visualizador de diferenças.

- **[discord](/pt-BR/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. Plugin de canal Discord do OpenClaw para canais, mensagens diretas, comandos e eventos de aplicativo.

- **[exa](/pt-BR/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. Adiciona suporte a provedor de pesquisa na web.

- **[featherless](/plugins/reference/featherless)** (`@openclaw/featherless-provider`) - npm; ClawHub: `clawhub:@openclaw/featherless-provider`. Plugin de provedor Featherless AI do OpenClaw.

- **[feishu](/pt-BR/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. Plugin de canal Feishu/Lark do OpenClaw para chats e ferramentas de trabalho (mantido pela comunidade por @m1heng).

- **[firecrawl](/pt-BR/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. Adiciona ferramentas que podem ser chamadas por agentes. Adiciona suporte a provedor de obtenção de conteúdo da web. Adiciona suporte a provedor de pesquisa na web.

- **[fireworks](/pt-BR/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. Adiciona ao OpenClaw suporte ao provedor de modelos Fireworks.

- **[gmi](/pt-BR/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. Plugin de provedor GMI Cloud do OpenClaw.

- **[google-meet](/pt-BR/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. Plugin de participante do Google Meet do OpenClaw para entrar em chamadas por meio dos transportes Chrome ou Twilio.

- **[googlechat](/pt-BR/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. Plugin de canal Google Chat do OpenClaw para espaços e mensagens diretas.

- **[gradium](/pt-BR/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. Adiciona suporte a provedor de conversão de texto em fala.

- **[groq](/pt-BR/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. Adiciona ao OpenClaw suporte ao provedor de modelos Groq.

- **[inworld](/pt-BR/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Conversão de texto em fala por streaming da Inworld (MP3, OGG_OPUS, PCM para telefonia).

- **[irc](/pt-BR/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. Adiciona a interface de canal IRC para enviar e receber mensagens do OpenClaw.

- **[kilocode](/pt-BR/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. Adiciona ao OpenClaw suporte ao provedor de modelos Kilocode.

- **[kimi](/pt-BR/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. Adiciona ao OpenClaw suporte aos provedores de modelos Kimi e Kimi Coding.

- **[line](/pt-BR/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. Plugin de canal LINE do OpenClaw para chats da LINE Bot API.

- **[llama-cpp](/pt-BR/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. Embeddings GGUF locais por meio do node-llama-cpp.

- **[lobster](/pt-BR/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. Plugin de ferramenta de fluxo de trabalho Lobster para pipelines tipados e aprovações retomáveis.

- **[longcat](/plugins/reference/longcat)** (`@openclaw/longcat-provider`) - npm; ClawHub: `clawhub:@openclaw/longcat-provider`. Plugin de provedor LongCat do OpenClaw.

- **[matrix](/pt-BR/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. Plugin de canal Matrix do OpenClaw para salas e mensagens diretas.

- **[mattermost](/pt-BR/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. Adiciona a interface de canal Mattermost para enviar e receber mensagens do OpenClaw.

- **[memory-lancedb](/pt-BR/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. Plugin de memória de longo prazo do OpenClaw baseado em LanceDB, com recuperação automática, captura automática e pesquisa vetorial.

- **[moonshot](/pt-BR/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. Adiciona ao OpenClaw suporte ao provedor de modelos Moonshot.

- **[msteams](/pt-BR/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. Plugin de canal Microsoft Teams do OpenClaw para conversas com bots.

- **[nextcloud-talk](/pt-BR/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. Plugin de canal Nextcloud Talk do OpenClaw para conversas.

- **[nostr](/pt-BR/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. Plugin de canal Nostr do OpenClaw para mensagens diretas criptografadas com NIP-04.

- **[openshell](/pt-BR/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. Backend de sandbox do OpenClaw para a CLI NVIDIA OpenShell, com espaços de trabalho locais espelhados e execução de comandos por SSH.

- **[parallel](/pt-BR/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. Adiciona suporte a provedor de pesquisa na web.

- **[perplexity](/pt-BR/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. Adiciona suporte a provedor de pesquisa na web.

- **[pixverse](/pt-BR/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. Plugin de provedor de geração de vídeos PixVerse do OpenClaw.

- **[qianfan](/pt-BR/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. Adiciona ao OpenClaw suporte ao provedor de modelos Qianfan.

- **[qqbot](/pt-BR/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. Plugin de canal QQ Bot do OpenClaw para fluxos de trabalho em grupos e por mensagens diretas.

- **[qwen](/pt-BR/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. Adiciona ao OpenClaw suporte aos provedores de modelos Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Oauth, Qwen Portal, Qwen CLI, Qwen Token Plan e Bailian Token Plan.

- **[raft](/pt-BR/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. Plugin de canal Raft do OpenClaw para pontes seguras de ativação via CLI.

- **[searxng](/pt-BR/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. Adiciona suporte a provedor de pesquisa na web.

- **[signal](/pt-BR/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. Adiciona a interface de canal Signal para enviar e receber mensagens do OpenClaw.

- **[slack](/pt-BR/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. Plugin de canal Slack do OpenClaw para canais, mensagens diretas, comandos e eventos de aplicativo.

- **[sms](/pt-BR/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. Plugin de canal SMS da Twilio para mensagens de texto do OpenClaw.

- **[stepfun](/pt-BR/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. Adiciona ao OpenClaw suporte aos provedores de modelos StepFun e StepFun Plan.

- **[synology-chat](/pt-BR/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. Plugin de canal Synology Chat para canais e mensagens diretas do OpenClaw.

- **[tavily](/pt-BR/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. Adiciona ferramentas que podem ser chamadas por agentes. Adiciona suporte a provedor de pesquisa na web.

- **[tencent](/pt-BR/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. Adiciona ao OpenClaw suporte aos provedores de modelos Tencent TokenHub e Tencent Tokenplan.

- **[tlon](/pt-BR/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. Plugin de canal Tlon/Urbit do OpenClaw para fluxos de trabalho de chat.

- **[tokenjuice](/pt-BR/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. Compacta os resultados das ferramentas exec e bash com redutores do Tokenjuice.

- **[twitch](/pt-BR/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. Plugin de canal Twitch do OpenClaw para fluxos de trabalho de chat e moderação.

- **[venice](/pt-BR/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. Adiciona ao OpenClaw suporte ao provedor de modelos Venice.

- **[vercel-ai-gateway](/pt-BR/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. Adiciona ao OpenClaw suporte ao provedor de modelos Vercel AI Gateway.

- **[voice-call](/pt-BR/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. Plugin de chamadas de voz do OpenClaw para chamadas telefônicas via Twilio, Telnyx e Plivo.

- **[whatsapp](/pt-BR/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. Plugin de canal do WhatsApp para o OpenClaw para conversas no WhatsApp Web.

- **[zai](/pt-BR/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. Adiciona ao OpenClaw suporte ao provedor de modelos Z.AI.

- **[zalo](/pt-BR/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. Plugin de canal do Zalo para o OpenClaw para conversas com bots e via Webhook.

- **[zalouser](/pt-BR/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. Plugin de conta pessoal do Zalo para o OpenClaw por meio da integração nativa com zca-js.

## Somente checkout do código-fonte

3 plugins

- **[qa-channel](/pt-BR/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - somente checkout do código-fonte. Adiciona a interface QA Channel para enviar e receber mensagens do OpenClaw.

- **[qa-lab](/pt-BR/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - somente checkout do código-fonte. Plugin de laboratório de QA do OpenClaw com interface privada de depuração e executor de cenários.

- **[qa-matrix](/pt-BR/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - somente checkout do código-fonte. Executor e substrato de transporte de QA do Matrix.
