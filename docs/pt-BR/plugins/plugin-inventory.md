---
read_when:
    - Você está decidindo se um Plugin é incluído no pacote npm principal ou instalado separadamente
    - Você está atualizando metadados de pacote de Plugin empacotado ou automação de lançamento
    - Você precisa da lista canônica de plugins internos versus externos
summary: Inventário gerado de plugins OpenClaw enviados no core, publicados externamente ou mantidos somente como código-fonte
title: Inventário de Plugins
x-i18n:
    generated_at: "2026-06-27T17:50:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f0c5aa2c3e5f25308a4398dc2582caa8f355a4dfd0d5693d9cfaf1c1ce6926
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Inventário de Plugins

Esta página é gerada a partir de `extensions/*/package.json`, `openclaw.plugin.json`,
e das exclusões de `files` do pacote npm raiz. Regenere-a com:

```bash
pnpm plugins:inventory:gen
```

## Definições

- **Pacote npm principal:** integrado ao pacote npm `openclaw` e disponível sem uma instalação separada de Plugin.
- **Pacote externo oficial:** Plugin mantido pela OpenClaw omitido do pacote npm principal, mantido neste inventário oficial e instalado sob demanda pelo ClawHub e/ou npm.
- **Apenas checkout de código-fonte:** Plugin local do repo omitido dos artefatos npm publicados e não divulgado como pacote instalável.

Checkouts de código-fonte são diferentes de instalações npm: após `pnpm install`, Plugins
incluídos carregam de `extensions/<id>`, então edições locais e dependências de workspace
locais do pacote ficam disponíveis.

## Instalar um Plugin

Use a rota de instalação em cada entrada para decidir se a instalação é necessária. Plugins
que dizem `incluído no OpenClaw` já estão presentes no pacote principal.
Pacotes externos oficiais precisam de uma instalação e, depois, uma reinicialização do Gateway.

Por exemplo, Discord é um pacote externo oficial:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Durante a transição de lançamento, especificações comuns de pacote sem prefixo ainda instalam a partir do npm.
Use `clawhub:@openclaw/discord` ou `npm:@openclaw/discord` quando precisar de uma
origem explícita. Após a instalação, siga a documentação de configuração do Plugin, como
[Discord](/pt-BR/channels/discord), para adicionar credenciais e configuração de canal. Consulte
[Gerenciar Plugins](/pt-BR/plugins/manage-plugins) para comandos de atualização, desinstalação e publicação.

Cada entrada lista o pacote, a rota de distribuição e a descrição.

## Pacote npm principal

59 Plugins

- **[admin-http-rpc](/pt-BR/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - incluído no OpenClaw. Endpoint HTTP RPC de administração do OpenClaw.

- **[alibaba](/pt-BR/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - incluído no OpenClaw. Adiciona suporte a provedor de geração de vídeo.

- **[anthropic](/pt-BR/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - incluído no OpenClaw. Adiciona suporte ao provedor de modelos Anthropic ao OpenClaw.

- **[azure-speech](/pt-BR/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - incluído no OpenClaw. Texto para fala do Azure AI Speech (MP3, notas de voz Ogg/Opus nativas, telefonia PCM).

- **[bonjour](/pt-BR/plugins/reference/bonjour)** (`@openclaw/bonjour`) - incluído no OpenClaw. Anuncia o Gateway local do OpenClaw por Bonjour/mDNS.

- **[browser](/pt-BR/plugins/reference/browser)** (`@openclaw/browser-plugin`) - incluído no OpenClaw. Adiciona ferramentas chamáveis por agente.

- **[byteplus](/pt-BR/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - incluído no OpenClaw. Adiciona suporte a provedores de modelos BytePlus e BytePlus Plan ao OpenClaw.

- **[canvas](/pt-BR/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - incluído no OpenClaw. Superfícies experimentais de controle Canvas e renderização A2UI para nós pareados.

- **[codex-supervisor](/pt-BR/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - incluído no OpenClaw. Supervisiona sessões do servidor de app Codex a partir do OpenClaw.

- **[cohere](/pt-BR/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - incluído no OpenClaw; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. Plugin provedor Cohere do OpenClaw.

- **[comfy](/pt-BR/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - incluído no OpenClaw. Adiciona suporte ao provedor de modelos ComfyUI ao OpenClaw.

- **[copilot-proxy](/pt-BR/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - incluído no OpenClaw. Adiciona suporte ao provedor de modelos Copilot Proxy ao OpenClaw.

- **[deepgram](/pt-BR/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - incluído no OpenClaw. Adiciona suporte a provedor de compreensão de mídia. Adiciona suporte a provedor de transcrição em tempo real.

- **[document-extract](/pt-BR/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - incluído no OpenClaw. Extrai texto e imagens de página de fallback de anexos de documentos locais.

- **[duckduckgo](/pt-BR/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - incluído no OpenClaw. Adiciona suporte a provedor de busca na web.

- **[elevenlabs](/pt-BR/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - incluído no OpenClaw. Adiciona suporte a provedor de compreensão de mídia. Adiciona suporte a provedor de transcrição em tempo real. Adiciona suporte a provedor de texto para fala.

- **[fal](/pt-BR/plugins/reference/fal)** (`@openclaw/fal-provider`) - incluído no OpenClaw. Adiciona suporte ao provedor de modelos fal ao OpenClaw.

- **[file-transfer](/pt-BR/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - incluído no OpenClaw. Busca, lista e grava arquivos em nós pareados por comandos dedicados de nó. Contorna o truncamento de stdout do bash usando base64 sobre node.invoke para binários de até 16 MB.

- **[github-copilot](/pt-BR/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - incluído no OpenClaw. Adiciona suporte ao provedor de modelos GitHub Copilot ao OpenClaw.

- **[google](/pt-BR/plugins/reference/google)** (`@openclaw/google-plugin`) - incluído no OpenClaw. Adiciona suporte a provedores de modelos Google, Google Gemini CLI e Google Vertex ao OpenClaw.

- **[huggingface](/pt-BR/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - incluído no OpenClaw. Adiciona suporte ao provedor de modelos Hugging Face ao OpenClaw.

- **[imessage](/pt-BR/plugins/reference/imessage)** (`@openclaw/imessage`) - incluído no OpenClaw. Adiciona a superfície de canal iMessage para enviar e receber mensagens do OpenClaw.

- **[litellm](/pt-BR/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - incluído no OpenClaw. Adiciona suporte ao provedor de modelos LiteLLM ao OpenClaw.

- **[llm-task](/pt-BR/plugins/reference/llm-task)** (`@openclaw/llm-task`) - incluído no OpenClaw. Ferramenta LLM genérica somente JSON para tarefas estruturadas chamáveis a partir de fluxos de trabalho.

- **[lmstudio](/pt-BR/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - incluído no OpenClaw. Adiciona suporte ao provedor de modelos LM Studio ao OpenClaw.

- **[memory-core](/pt-BR/plugins/reference/memory-core)** (`@openclaw/memory-core`) - incluído no OpenClaw. Adiciona ferramentas chamáveis por agente.

- **[memory-wiki](/pt-BR/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - incluído no OpenClaw. Compilador de wiki persistente e cofre de conhecimento compatível com Obsidian para o OpenClaw.

- **[microsoft](/pt-BR/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - incluído no OpenClaw. Adiciona suporte a provedor de texto para fala.

- **[microsoft-foundry](/pt-BR/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - incluído no OpenClaw. Adiciona suporte ao provedor de modelos Microsoft Foundry ao OpenClaw.

- **[migrate-claude](/pt-BR/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - incluído no OpenClaw. Importa instruções do Claude Code e Claude Desktop, servidores MCP, Skills e configuração segura para o OpenClaw.

- **[migrate-hermes](/pt-BR/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - incluído no OpenClaw. Importa configuração do Hermes, memórias, Skills e credenciais compatíveis para o OpenClaw.

- **[minimax](/pt-BR/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - incluído no OpenClaw. Adiciona suporte a provedores de modelos MiniMax e MiniMax Portal ao OpenClaw.

- **[mistral](/pt-BR/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - incluído no OpenClaw. Adiciona suporte ao provedor de modelos Mistral ao OpenClaw.

- **[novita](/pt-BR/plugins/reference/novita)** (`@openclaw/novita-provider`) - incluído no OpenClaw. Adiciona suporte a provedores de modelos Novita, Novita AI e Novitaai ao OpenClaw.

- **[nvidia](/pt-BR/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - incluído no OpenClaw. Adiciona suporte ao provedor de modelos NVIDIA ao OpenClaw.

- **[oc-path](/pt-BR/plugins/reference/oc-path)** (`@openclaw/oc-path`) - incluído no OpenClaw. Adiciona a CLI de caminho openclaw para endereçamento de arquivos de workspace `oc://`.

- **[ollama](/pt-BR/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - incluído no OpenClaw. Adiciona suporte a provedores de modelos Ollama e Ollama Cloud ao OpenClaw.

- **[open-prose](/pt-BR/plugins/reference/open-prose)** (`@openclaw/open-prose`) - incluído no OpenClaw. Pacote de Skills de VM OpenProse com um comando de barra `/prose`.

- **[openai](/pt-BR/plugins/reference/openai)** (`@openclaw/openai-provider`) - incluído no OpenClaw. Adiciona suporte ao provedor de modelos OpenAI ao OpenClaw.

- **[opencode](/pt-BR/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - incluído no OpenClaw. Adiciona suporte ao provedor de modelos OpenCode ao OpenClaw.

- **[opencode-go](/pt-BR/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - incluído no OpenClaw. Adiciona suporte ao provedor de modelos OpenCode Go ao OpenClaw.

- **[openrouter](/pt-BR/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - incluído no OpenClaw. Adiciona suporte ao provedor de modelos OpenRouter ao OpenClaw.

- **[policy](/pt-BR/plugins/reference/policy)** (`@openclaw/policy`) - incluído no OpenClaw. Adiciona verificações doctor baseadas em política para conformidade do workspace.

- **[runway](/pt-BR/plugins/reference/runway)** (`@openclaw/runway-provider`) - incluído no OpenClaw. Adiciona suporte a provedor de geração de vídeo.

- **[senseaudio](/pt-BR/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - incluído no OpenClaw. Adiciona suporte a provedor de compreensão de mídia.

- **[sglang](/pt-BR/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - incluído no OpenClaw. Adiciona suporte ao provedor de modelos SGLang ao OpenClaw.

- **[synthetic](/pt-BR/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - incluído no OpenClaw. Adiciona suporte ao provedor de modelos Synthetic ao OpenClaw.

- **[telegram](/pt-BR/plugins/reference/telegram)** (`@openclaw/telegram`) - incluído no OpenClaw. Adiciona a superfície de canal Telegram para enviar e receber mensagens do OpenClaw.

- **[together](/pt-BR/plugins/reference/together)** (`@openclaw/together-provider`) - incluído no OpenClaw. Adiciona suporte ao provedor de modelos Together ao OpenClaw.

- **[tts-local-cli](/pt-BR/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - incluído no OpenClaw. Adiciona suporte a provedor de texto para fala.

- **[vllm](/pt-BR/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - incluído no OpenClaw. Adiciona suporte ao provedor de modelos vLLM ao OpenClaw.

- **[volcengine](/pt-BR/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - incluído no OpenClaw. Adiciona suporte a provedores de modelos Volcengine e Volcengine Plan ao OpenClaw.

- **[voyage](/pt-BR/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - incluído no OpenClaw. Adiciona suporte a provedor de embeddings de memória.

- **[vydra](/pt-BR/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - incluído no OpenClaw. Adiciona suporte ao provedor de modelos Vydra ao OpenClaw.

- **[web-readability](/pt-BR/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - incluído no OpenClaw. Extrai conteúdo legível de artigos de respostas locais de busca web em HTML.

- **[webhooks](/pt-BR/plugins/reference/webhooks)** (`@openclaw/webhooks`) - incluído no OpenClaw. webhooks de entrada autenticados que vinculam automações externas a TaskFlows do OpenClaw.

- **[workboard](/pt-BR/plugins/reference/workboard)** (`@openclaw/workboard`) - incluído no OpenClaw. Quadro de trabalho de dashboard para issues e sessões pertencentes a agentes.

- **[xai](/pt-BR/plugins/reference/xai)** (`@openclaw/xai-plugin`) - incluído no OpenClaw. Adiciona suporte ao provedor de modelos xAI ao OpenClaw.

- **[xiaomi](/pt-BR/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - incluído no OpenClaw. Adiciona suporte a provedores de modelos Xiaomi e Xiaomi Token Plan ao OpenClaw.

## Pacotes externos oficiais

68 Plugins

- **[acpx](/pt-BR/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub. Backend de runtime ACP do OpenClaw com gerenciamento de sessão e transporte pertencente ao Plugin.

- **[amazon-bedrock](/pt-BR/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub. Plugin provedor Amazon Bedrock do OpenClaw com descoberta de modelos, embeddings e suporte a guardrail.

- **[amazon-bedrock-mantle](/pt-BR/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. Plugin de provedor OpenClaw Amazon Bedrock Mantle para roteamento de modelos compatível com OpenAI.

- **[anthropic-vertex](/pt-BR/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. Plugin de provedor OpenClaw Anthropic Vertex para modelos Claude no Google Vertex AI.

- **[arcee](/pt-BR/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. Adiciona suporte ao provedor de modelos Arcee ao OpenClaw.

- **[brave](/pt-BR/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. Plugin de provedor OpenClaw Brave Search para pesquisa na web.

- **[cerebras](/pt-BR/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. Adiciona suporte ao provedor de modelos Cerebras ao OpenClaw.

- **[chutes](/pt-BR/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. Adiciona suporte ao provedor de modelos Chutes ao OpenClaw.

- **[clickclack](/pt-BR/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. Adiciona a superfície de canal Clickclack para enviar e receber mensagens do OpenClaw.

- **[cloudflare-ai-gateway](/pt-BR/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. Adiciona suporte ao provedor de modelos Cloudflare AI Gateway ao OpenClaw.

- **[codex](/pt-BR/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. Plugin de harness de servidor de aplicativo Codex e provedor de modelos OpenClaw com um catálogo GPT gerenciado pelo Codex.

- **[copilot](/pt-BR/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. Registra o runtime de agente GitHub Copilot.

- **[deepinfra](/pt-BR/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. Adiciona suporte ao provedor de modelos DeepInfra ao OpenClaw.

- **[deepseek](/pt-BR/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. Adiciona suporte ao provedor de modelos DeepSeek ao OpenClaw.

- **[diagnostics-otel](/pt-BR/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. Exportador OpenTelemetry de diagnóstico do OpenClaw para métricas, rastreamentos e logs.

- **[diagnostics-prometheus](/pt-BR/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. Exportador Prometheus de diagnóstico do OpenClaw para métricas de runtime.

- **[diffs](/pt-BR/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. Plugin visualizador de diffs somente leitura e renderizador de arquivos do OpenClaw para agentes.

- **[diffs-language-pack](/pt-BR/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. Adiciona destaque de sintaxe para linguagens fora do conjunto padrão do visualizador de diffs.

- **[discord](/pt-BR/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. Plugin de canal OpenClaw Discord para canais, DMs, comandos e eventos de aplicativo.

- **[exa](/pt-BR/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. Adiciona suporte ao provedor de pesquisa na web.

- **[feishu](/pt-BR/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. Plugin de canal OpenClaw Feishu/Lark para chats e ferramentas de trabalho (mantido pela comunidade por @m1heng).

- **[firecrawl](/pt-BR/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. Adiciona ferramentas chamáveis por agentes. Adiciona suporte ao provedor de busca na web. Adiciona suporte ao provedor de pesquisa na web.

- **[fireworks](/pt-BR/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. Adiciona suporte ao provedor de modelos Fireworks ao OpenClaw.

- **[gmi](/pt-BR/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. Plugin de provedor OpenClaw GMI Cloud.

- **[google-meet](/pt-BR/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. Plugin de participante OpenClaw Google Meet para entrar em chamadas por meio dos transportes Chrome ou Twilio.

- **[googlechat](/pt-BR/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. Plugin de canal OpenClaw Google Chat para espaços e mensagens diretas.

- **[gradium](/pt-BR/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. Adiciona suporte ao provedor de conversão de texto em fala.

- **[groq](/pt-BR/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. Adiciona suporte ao provedor de modelos Groq ao OpenClaw.

- **[inworld](/pt-BR/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Conversão de texto em fala por streaming da Inworld (MP3, OGG_OPUS, PCM telefônico).

- **[irc](/pt-BR/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. Adiciona a superfície de canal IRC para enviar e receber mensagens do OpenClaw.

- **[kilocode](/pt-BR/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. Adiciona suporte ao provedor de modelos Kilocode ao OpenClaw.

- **[kimi](/pt-BR/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. Adiciona suporte ao provedor de modelos Kimi, Kimi Coding ao OpenClaw.

- **[line](/pt-BR/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. Plugin de canal OpenClaw LINE para chats da LINE Bot API.

- **[llama-cpp](/pt-BR/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. Embeddings GGUF locais por meio do node-llama-cpp.

- **[lobster](/pt-BR/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. Plugin de ferramenta de fluxo de trabalho Lobster para pipelines tipados e aprovações retomáveis.

- **[matrix](/pt-BR/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. Plugin de canal OpenClaw Matrix para salas e mensagens diretas.

- **[mattermost](/pt-BR/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. Adiciona a superfície de canal Mattermost para enviar e receber mensagens do OpenClaw.

- **[memory-lancedb](/pt-BR/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. Plugin de memória de longo prazo do OpenClaw com backend LanceDB, com recuperação automática, captura automática e pesquisa vetorial.

- **[moonshot](/pt-BR/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. Adiciona suporte ao provedor de modelos Moonshot ao OpenClaw.

- **[msteams](/pt-BR/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. Plugin de canal OpenClaw Microsoft Teams para conversas de bot.

- **[nextcloud-talk](/pt-BR/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. Plugin de canal OpenClaw Nextcloud Talk para conversas.

- **[nostr](/pt-BR/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. Plugin de canal OpenClaw Nostr para mensagens diretas criptografadas NIP-04.

- **[openshell](/pt-BR/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. Backend de sandbox do OpenClaw para a CLI NVIDIA OpenShell, com workspaces locais espelhados e execução de comandos SSH.

- **[parallel](/pt-BR/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. Adiciona suporte ao provedor de pesquisa na web.

- **[perplexity](/pt-BR/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. Adiciona suporte ao provedor de pesquisa na web.

- **[pixverse](/pt-BR/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. Plugin de provedor de geração de vídeo OpenClaw PixVerse.

- **[qianfan](/pt-BR/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. Adiciona suporte ao provedor de modelos Qianfan ao OpenClaw.

- **[qqbot](/pt-BR/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. Plugin de canal OpenClaw QQ Bot para fluxos de trabalho em grupo e mensagens diretas.

- **[qwen](/pt-BR/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. Adiciona suporte ao provedor de modelos Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Oauth, Qwen Portal, Qwen CLI ao OpenClaw.

- **[raft](/pt-BR/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. Plugin de canal OpenClaw Raft para pontes seguras de despertar pela CLI.

- **[searxng](/pt-BR/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. Adiciona suporte ao provedor de pesquisa na web.

- **[signal](/pt-BR/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. Adiciona a superfície de canal Signal para enviar e receber mensagens do OpenClaw.

- **[slack](/pt-BR/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. Plugin de canal OpenClaw Slack para canais, DMs, comandos e eventos de aplicativo.

- **[sms](/pt-BR/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. Plugin de canal Twilio SMS para mensagens de texto do OpenClaw.

- **[stepfun](/pt-BR/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. Adiciona suporte ao provedor de modelos StepFun, StepFun Plan ao OpenClaw.

- **[synology-chat](/pt-BR/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. Plugin de canal Synology Chat para canais e mensagens diretas do OpenClaw.

- **[tavily](/pt-BR/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. Adiciona ferramentas chamáveis por agentes. Adiciona suporte ao provedor de pesquisa na web.

- **[tencent](/pt-BR/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. Adiciona suporte ao provedor de modelos Tencent TokenHub ao OpenClaw.

- **[tlon](/pt-BR/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. Plugin de canal OpenClaw Tlon/Urbit para fluxos de trabalho de chat.

- **[tokenjuice](/pt-BR/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. Compacta resultados das ferramentas exec e bash com redutores tokenjuice.

- **[twitch](/pt-BR/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. Plugin de canal OpenClaw Twitch para fluxos de trabalho de chat e moderação.

- **[venice](/pt-BR/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. Adiciona suporte ao provedor de modelos Venice ao OpenClaw.

- **[vercel-ai-gateway](/pt-BR/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. Adiciona suporte ao provedor de modelos Vercel AI Gateway ao OpenClaw.

- **[voice-call](/pt-BR/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. Plugin voice-call do OpenClaw para chamadas telefônicas Twilio, Telnyx e Plivo.

- **[whatsapp](/pt-BR/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. Plugin de canal OpenClaw WhatsApp para chats do WhatsApp Web.

- **[zai](/pt-BR/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. Adiciona suporte ao provedor de modelos Z.AI ao OpenClaw.

- **[zalo](/pt-BR/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. Plugin de canal OpenClaw Zalo para chats de bot e webhook.

- **[zalouser](/pt-BR/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. Plugin OpenClaw Zalo Personal Account via integração nativa zca-js.

## Apenas checkout do código-fonte

3 plugins

- **[qa-channel](/pt-BR/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - apenas checkout do código-fonte. Adiciona a superfície QA Channel para enviar e receber mensagens do OpenClaw.

- **[qa-lab](/pt-BR/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - apenas checkout do código-fonte. Plugin de laboratório de QA OpenClaw com interface privada de depuração e executor de cenários.

- **[qa-matrix](/pt-BR/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - somente em checkout do código-fonte. Executor e substrato de transporte de QA de matriz.
