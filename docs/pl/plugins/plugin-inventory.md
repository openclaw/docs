---
read_when:
    - Decydujesz, czy Plugin jest dostarczany w głównym pakiecie npm, czy instalowany oddzielnie
    - Aktualizujesz metadane pakietu dołączonego Plugin lub automatyzację wydań
    - Potrzebujesz kanonicznej listy Plugin wewnętrznych i zewnętrznych
summary: Wygenerowany inwentarz pluginów OpenClaw dostarczanych w rdzeniu, publikowanych zewnętrznie lub utrzymywanych wyłącznie jako kod źródłowy
title: Inwentarz Plugin
x-i18n:
    generated_at: "2026-07-04T04:10:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1af48e3d1ca8e994780dae2ac39dd2d3c3ed0bc8c136cbf3448fe18fadddfb0a
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Inwentarz Plugin

Ta strona jest generowana z `extensions/*/package.json`, `openclaw.plugin.json`
oraz wykluczeń `files` głównego pakietu npm. Wygeneruj ją ponownie za pomocą:

```bash
pnpm plugins:inventory:gen
```

## Definicje

- **Główny pakiet npm:** wbudowany w pakiet npm `openclaw` i dostępny bez osobnej instalacji Plugin.
- **Oficjalny pakiet zewnętrzny:** Plugin utrzymywany przez OpenClaw, pominięty w głównym pakiecie npm, przechowywany w tym oficjalnym inwentarzu i instalowany na żądanie przez ClawHub i/lub npm.
- **Tylko checkout źródeł:** repozytoryjny lokalny Plugin pominięty w opublikowanych artefaktach npm i niereklamowany jako pakiet możliwy do zainstalowania.

Checkouty źródeł różnią się od instalacji npm: po `pnpm install` dołączone
pluginy ładują się z `extensions/<id>`, więc dostępne są lokalne edycje i
zależności workspace lokalne dla pakietu.

## Zainstaluj Plugin

Użyj ścieżki instalacji w każdym wpisie, aby zdecydować, czy instalacja jest potrzebna. Pluginy,
które mają informację `included in OpenClaw`, są już obecne w głównym pakiecie.
Oficjalne pakiety zewnętrzne wymagają jednej instalacji, a następnie ponownego uruchomienia Gateway.

Na przykład Discord jest oficjalnym pakietem zewnętrznym:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Podczas przełączenia startowego zwykłe nieprefiksowane specyfikacje pakietów nadal instalują z npm.
Użyj `clawhub:@openclaw/discord` lub `npm:@openclaw/discord`, gdy potrzebujesz
jawnego źródła. Po instalacji postępuj zgodnie z dokumentacją konfiguracji Plugin, taką jak
[Discord](/pl/channels/discord), aby dodać dane uwierzytelniające i konfigurację kanału. Zobacz
[Zarządzanie pluginami](/pl/plugins/manage-plugins), aby poznać polecenia aktualizacji, odinstalowywania i publikowania.

Każdy wpis zawiera pakiet, ścieżkę dystrybucji i opis.

## Główny pakiet npm

60 pluginów

- **[admin-http-rpc](/pl/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - zawarty w OpenClaw. Punkt końcowy HTTP RPC administracji OpenClaw.

- **[alibaba](/pl/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - zawarty w OpenClaw. Dodaje obsługę dostawcy generowania wideo.

- **[anthropic](/pl/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli Anthropic.

- **[azure-speech](/pl/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - zawarty w OpenClaw. Azure AI Speech text-to-speech (MP3, natywne notatki głosowe Ogg/Opus, telefonia PCM).

- **[bonjour](/pl/plugins/reference/bonjour)** (`@openclaw/bonjour`) - zawarty w OpenClaw. Rozgłasza lokalny Gateway OpenClaw przez Bonjour/mDNS.

- **[browser](/pl/plugins/reference/browser)** (`@openclaw/browser-plugin`) - zawarty w OpenClaw. Dodaje narzędzia wywoływane przez agentów.

- **[byteplus](/pl/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawców modeli BytePlus i BytePlus Plan.

- **[canvas](/pl/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - zawarty w OpenClaw. Eksperymentalne powierzchnie sterowania Canvas i renderowania A2UI dla sparowanych węzłów.

- **[clawrouter](/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli ClawRouter.

- **[codex-supervisor](/pl/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - zawarty w OpenClaw. Nadzoruje sesje serwera aplikacji Codex z OpenClaw.

- **[cohere](/pl/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - zawarty w OpenClaw; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. Plugin dostawcy Cohere dla OpenClaw.

- **[comfy](/pl/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli ComfyUI.

- **[copilot-proxy](/pl/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli Copilot Proxy.

- **[deepgram](/pl/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - zawarty w OpenClaw. Dodaje obsługę dostawcy rozumienia mediów. Dodaje obsługę dostawcy transkrypcji w czasie rzeczywistym.

- **[document-extract](/pl/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - zawarty w OpenClaw. Wyodrębnia tekst i awaryjne obrazy stron z lokalnych załączników dokumentów.

- **[duckduckgo](/pl/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - zawarty w OpenClaw. Dodaje obsługę dostawcy wyszukiwania w sieci.

- **[elevenlabs](/pl/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - zawarty w OpenClaw. Dodaje obsługę dostawcy rozumienia mediów. Dodaje obsługę dostawcy transkrypcji w czasie rzeczywistym. Dodaje obsługę dostawcy text-to-speech.

- **[fal](/pl/plugins/reference/fal)** (`@openclaw/fal-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli fal.

- **[file-transfer](/pl/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - zawarty w OpenClaw. Pobiera, wyświetla i zapisuje pliki na sparowanych węzłach przez dedykowane polecenia węzłów. Omija obcinanie stdout bash, używając base64 przez node.invoke dla plików binarnych do 16 MB.

- **[github-copilot](/pl/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli GitHub Copilot.

- **[google](/pl/plugins/reference/google)** (`@openclaw/google-plugin`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawców modeli Google, Google Gemini CLI i Google Vertex.

- **[huggingface](/pl/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli Hugging Face.

- **[imessage](/pl/plugins/reference/imessage)** (`@openclaw/imessage`) - zawarty w OpenClaw. Dodaje powierzchnię kanału iMessage do wysyłania i odbierania wiadomości OpenClaw.

- **[litellm](/pl/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli LiteLLM.

- **[llm-task](/pl/plugins/reference/llm-task)** (`@openclaw/llm-task`) - zawarty w OpenClaw. Ogólne narzędzie LLM wyłącznie JSON do zadań strukturalnych wywoływanych z workflow.

- **[lmstudio](/pl/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli LM Studio.

- **[memory-core](/pl/plugins/reference/memory-core)** (`@openclaw/memory-core`) - zawarty w OpenClaw. Dodaje narzędzia wywoływane przez agentów.

- **[memory-wiki](/pl/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - zawarty w OpenClaw. Trwały kompilator wiki i przyjazny dla Obsidian magazyn wiedzy dla OpenClaw.

- **[microsoft](/pl/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - zawarty w OpenClaw. Dodaje obsługę dostawcy text-to-speech.

- **[microsoft-foundry](/pl/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli Microsoft Foundry.

- **[migrate-claude](/pl/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - zawarty w OpenClaw. Importuje do OpenClaw instrukcje Claude Code i Claude Desktop, serwery MCP, Skills oraz bezpieczną konfigurację.

- **[migrate-hermes](/pl/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - zawarty w OpenClaw. Importuje do OpenClaw konfigurację Hermes, pamięci, Skills i obsługiwane dane uwierzytelniające.

- **[minimax](/pl/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawców modeli MiniMax i MiniMax Portal.

- **[mistral](/pl/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli Mistral.

- **[novita](/pl/plugins/reference/novita)** (`@openclaw/novita-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawców modeli Novita, Novita AI i Novitaai.

- **[nvidia](/pl/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli NVIDIA.

- **[oc-path](/pl/plugins/reference/oc-path)** (`@openclaw/oc-path`) - zawarty w OpenClaw. Dodaje CLI ścieżek openclaw do adresowania plików workspace przez oc://.

- **[ollama](/pl/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawców modeli Ollama i Ollama Cloud.

- **[open-prose](/pl/plugins/reference/open-prose)** (`@openclaw/open-prose`) - zawarty w OpenClaw. Pakiet Skills VM OpenProse z poleceniem ukośnikowym /prose.

- **[openai](/pl/plugins/reference/openai)** (`@openclaw/openai-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli OpenAI.

- **[opencode](/pl/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli OpenCode.

- **[opencode-go](/pl/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli OpenCode Go.

- **[openrouter](/pl/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli OpenRouter.

- **[policy](/pl/plugins/reference/policy)** (`@openclaw/policy`) - zawarty w OpenClaw. Dodaje kontrole doctor oparte na politykach dla zgodności workspace.

- **[runway](/pl/plugins/reference/runway)** (`@openclaw/runway-provider`) - zawarty w OpenClaw. Dodaje obsługę dostawcy generowania wideo.

- **[senseaudio](/pl/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - zawarty w OpenClaw. Dodaje obsługę dostawcy rozumienia mediów.

- **[sglang](/pl/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli SGLang.

- **[synthetic](/pl/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli Synthetic.

- **[telegram](/pl/plugins/reference/telegram)** (`@openclaw/telegram`) - zawarty w OpenClaw. Dodaje powierzchnię kanału Telegram do wysyłania i odbierania wiadomości OpenClaw.

- **[together](/pl/plugins/reference/together)** (`@openclaw/together-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli Together.

- **[tts-local-cli](/pl/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - zawarty w OpenClaw. Dodaje obsługę dostawcy text-to-speech.

- **[vllm](/pl/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli vLLM.

- **[volcengine](/pl/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawców modeli Volcengine i Volcengine Plan.

- **[voyage](/pl/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - zawarty w OpenClaw. Dodaje obsługę dostawcy osadzania pamięci.

- **[vydra](/pl/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli Vydra.

- **[web-readability](/pl/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - zawarty w OpenClaw. Wyodrębnia czytelną treść artykułów z lokalnych odpowiedzi pobierania stron HTML.

- **[webhooks](/pl/plugins/reference/webhooks)** (`@openclaw/webhooks`) - zawarty w OpenClaw. Uwierzytelnione przychodzące Webhooki, które wiążą zewnętrzną automatyzację z OpenClaw TaskFlows.

- **[workboard](/pl/plugins/reference/workboard)** (`@openclaw/workboard`) - zawarty w OpenClaw. Dashboard workboard dla problemów i sesji należących do agentów.

- **[xai](/pl/plugins/reference/xai)** (`@openclaw/xai-plugin`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli xAI.

- **[xiaomi](/pl/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - zawarty w OpenClaw. Dodaje do OpenClaw obsługę dostawców modeli Xiaomi i Xiaomi Token Plan.

## Oficjalne pakiety zewnętrzne

68 pluginów

- **[acpx](/pl/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub. Backend środowiska uruchomieniowego ACP OpenClaw z zarządzaniem sesją i transportem należącym do Plugin.

- **[amazon-bedrock](/pl/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub. Plugin dostawcy Amazon Bedrock dla OpenClaw z wykrywaniem modeli, osadzeniami i obsługą guardrails.

- **[amazon-bedrock-mantle](/pl/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. Plugin dostawcy OpenClaw Amazon Bedrock Mantle do routingu modeli zgodnego z OpenAI.

- **[anthropic-vertex](/pl/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. Plugin dostawcy OpenClaw Anthropic Vertex dla modeli Claude w Google Vertex AI.

- **[arcee](/pl/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. Dodaje obsługę dostawcy modeli Arcee do OpenClaw.

- **[brave](/pl/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. Plugin dostawcy OpenClaw Brave Search do wyszukiwania w sieci.

- **[cerebras](/pl/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. Dodaje obsługę dostawcy modeli Cerebras do OpenClaw.

- **[chutes](/pl/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. Dodaje obsługę dostawcy modeli Chutes do OpenClaw.

- **[clickclack](/pl/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. Dodaje interfejs kanału Clickclack do wysyłania i odbierania wiadomości OpenClaw.

- **[cloudflare-ai-gateway](/pl/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. Dodaje obsługę dostawcy modeli Cloudflare AI Gateway do OpenClaw.

- **[codex](/pl/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. Plugin uprzęży serwera aplikacji OpenClaw Codex i dostawcy modeli z katalogiem GPT zarządzanym przez Codex.

- **[copilot](/pl/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. Rejestruje środowisko uruchomieniowe agenta GitHub Copilot.

- **[deepinfra](/pl/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. Dodaje obsługę dostawcy modeli DeepInfra do OpenClaw.

- **[deepseek](/pl/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. Dodaje obsługę dostawcy modeli DeepSeek do OpenClaw.

- **[diagnostics-otel](/pl/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. Eksporter diagnostyki OpenClaw OpenTelemetry dla metryk, śladów i logów.

- **[diagnostics-prometheus](/pl/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. Eksporter diagnostyki OpenClaw Prometheus dla metryk środowiska uruchomieniowego.

- **[diffs](/pl/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. Plugin OpenClaw tylko do odczytu do przeglądania różnic oraz renderowania plików dla agentów.

- **[diffs-language-pack](/pl/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. Dodaje wyróżnianie składni dla języków spoza domyślnego zestawu przeglądarki różnic.

- **[discord](/pl/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. Plugin kanału OpenClaw Discord dla kanałów, wiadomości prywatnych, poleceń i zdarzeń aplikacji.

- **[exa](/pl/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. Dodaje obsługę dostawcy wyszukiwania w sieci.

- **[feishu](/pl/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. Plugin kanału OpenClaw Feishu/Lark dla czatów i narzędzi miejsca pracy (utrzymywany przez społeczność przez @m1heng).

- **[firecrawl](/pl/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. Dodaje narzędzia wywoływalne przez agenta. Dodaje obsługę dostawcy pobierania treści z sieci. Dodaje obsługę dostawcy wyszukiwania w sieci.

- **[fireworks](/pl/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. Dodaje obsługę dostawcy modeli Fireworks do OpenClaw.

- **[gmi](/pl/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. Plugin dostawcy OpenClaw GMI Cloud.

- **[google-meet](/pl/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. Plugin uczestnika OpenClaw Google Meet do dołączania do połączeń przez transporty Chrome lub Twilio.

- **[googlechat](/pl/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. Plugin kanału OpenClaw Google Chat dla przestrzeni i wiadomości bezpośrednich.

- **[gradium](/pl/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. Dodaje obsługę dostawcy zamiany tekstu na mowę.

- **[groq](/pl/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. Dodaje obsługę dostawcy modeli Groq do OpenClaw.

- **[inworld](/pl/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Strumieniowa zamiana tekstu na mowę Inworld (MP3, OGG_OPUS, PCM telephony).

- **[irc](/pl/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. Dodaje interfejs kanału IRC do wysyłania i odbierania wiadomości OpenClaw.

- **[kilocode](/pl/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. Dodaje obsługę dostawcy modeli Kilocode do OpenClaw.

- **[kimi](/pl/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. Dodaje obsługę dostawcy modeli Kimi, Kimi Coding do OpenClaw.

- **[line](/pl/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. Plugin kanału OpenClaw LINE dla czatów LINE Bot API.

- **[llama-cpp](/pl/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. Lokalne osadzania GGUF przez node-llama-cpp.

- **[lobster](/pl/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. Plugin narzędzia przepływu pracy Lobster dla typowanych potoków i wznawialnych zatwierdzeń.

- **[matrix](/pl/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. Plugin kanału OpenClaw Matrix dla pokojów i wiadomości bezpośrednich.

- **[mattermost](/pl/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. Dodaje interfejs kanału Mattermost do wysyłania i odbierania wiadomości OpenClaw.

- **[memory-lancedb](/pl/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. Plugin pamięci długoterminowej OpenClaw oparty na LanceDB z automatycznym przywoływaniem, automatycznym przechwytywaniem i wyszukiwaniem wektorowym.

- **[moonshot](/pl/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. Dodaje obsługę dostawcy modeli Moonshot do OpenClaw.

- **[msteams](/pl/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. Plugin kanału OpenClaw Microsoft Teams dla konwersacji z botem.

- **[nextcloud-talk](/pl/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. Plugin kanału OpenClaw Nextcloud Talk dla konwersacji.

- **[nostr](/pl/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. Plugin kanału OpenClaw Nostr dla szyfrowanych wiadomości bezpośrednich NIP-04.

- **[openshell](/pl/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. Backend piaskownicy OpenClaw dla NVIDIA OpenShell CLI z lustrzanymi lokalnymi obszarami roboczymi i wykonywaniem poleceń SSH.

- **[parallel](/pl/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. Dodaje obsługę dostawcy wyszukiwania w sieci.

- **[perplexity](/pl/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. Dodaje obsługę dostawcy wyszukiwania w sieci.

- **[pixverse](/pl/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. Plugin dostawcy OpenClaw PixVerse do generowania wideo.

- **[qianfan](/pl/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. Dodaje obsługę dostawcy modeli Qianfan do OpenClaw.

- **[qqbot](/pl/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. Plugin kanału OpenClaw QQ Bot dla przepływów pracy grupowych i wiadomości bezpośrednich.

- **[qwen](/pl/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. Dodaje obsługę dostawcy modeli Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Oauth, Qwen Portal, Qwen CLI do OpenClaw.

- **[raft](/pl/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. Plugin kanału OpenClaw Raft dla bezpiecznych mostów wybudzania CLI.

- **[searxng](/pl/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. Dodaje obsługę dostawcy wyszukiwania w sieci.

- **[signal](/pl/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. Dodaje interfejs kanału Signal do wysyłania i odbierania wiadomości OpenClaw.

- **[slack](/pl/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. Plugin kanału OpenClaw Slack dla kanałów, wiadomości prywatnych, poleceń i zdarzeń aplikacji.

- **[sms](/pl/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. Plugin kanału Twilio SMS dla wiadomości tekstowych OpenClaw.

- **[stepfun](/pl/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. Dodaje obsługę dostawcy modeli StepFun, StepFun Plan do OpenClaw.

- **[synology-chat](/pl/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. Plugin kanału Synology Chat dla kanałów OpenClaw i wiadomości bezpośrednich.

- **[tavily](/pl/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. Dodaje narzędzia wywoływalne przez agenta. Dodaje obsługę dostawcy wyszukiwania w sieci.

- **[tencent](/pl/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. Dodaje obsługę dostawcy modeli Tencent TokenHub do OpenClaw.

- **[tlon](/pl/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. Plugin kanału OpenClaw Tlon/Urbit dla przepływów pracy czatu.

- **[tokenjuice](/pl/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. Kompaktuje wyniki narzędzi exec i bash za pomocą reduktorów tokenjuice.

- **[twitch](/pl/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. Plugin kanału OpenClaw Twitch dla przepływów pracy czatu i moderacji.

- **[venice](/pl/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. Dodaje obsługę dostawcy modeli Venice do OpenClaw.

- **[vercel-ai-gateway](/pl/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. Dodaje obsługę dostawcy modeli Vercel AI Gateway do OpenClaw.

- **[voice-call](/pl/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. Plugin OpenClaw voice-call dla połączeń telefonicznych Twilio, Telnyx i Plivo.

- **[whatsapp](/pl/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. Plugin kanału OpenClaw WhatsApp dla czatów WhatsApp Web.

- **[zai](/pl/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. Dodaje obsługę dostawcy modeli Z.AI do OpenClaw.

- **[zalo](/pl/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. Plugin kanału OpenClaw Zalo dla czatów bota i webhooków.

- **[zalouser](/pl/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. Plugin OpenClaw Zalo Personal Account przez natywną integrację zca-js.

## Tylko checkout źródłowy

3 pluginy

- **[qa-channel](/pl/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - tylko checkout źródłowy. Dodaje interfejs QA Channel do wysyłania i odbierania wiadomości OpenClaw.

- **[qa-lab](/pl/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - tylko checkout źródłowy. Plugin laboratorium QA OpenClaw z prywatnym interfejsem debuggera i uruchamiaczem scenariuszy.

- **[qa-matrix](/pl/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - tylko checkout źródeł. Runner i substrat transportu QA Matrix.
