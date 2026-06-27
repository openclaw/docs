---
read_when:
    - Decydujesz, czy Plugin jest dostarczany w podstawowym pakiecie npm, czy instalowany osobno
    - Aktualizujesz metadane pakietu dołączonego Plugin lub automatyzację wydań
    - Potrzebujesz kanonicznej listy Pluginów wewnętrznych i zewnętrznych
summary: Wygenerowany spis pluginów OpenClaw dostarczanych w rdzeniu, publikowanych zewnętrznie lub utrzymywanych wyłącznie jako kod źródłowy
title: Inwentarz Plugin
x-i18n:
    generated_at: "2026-06-27T17:56:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f0c5aa2c3e5f25308a4398dc2582caa8f355a4dfd0d5693d9cfaf1c1ce6926
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Inwentarz Plugin

Ta strona jest generowana z `extensions/*/package.json`, `openclaw.plugin.json`
oraz wykluczeń `files` w głównym pakiecie npm. Wygeneruj ją ponownie za pomocą:

```bash
pnpm plugins:inventory:gen
```

## Definicje

- **Główny pakiet npm:** wbudowany w pakiet npm `openclaw` i dostępny bez osobnej instalacji pluginu.
- **Oficjalny pakiet zewnętrzny:** plugin utrzymywany przez OpenClaw, pominięty w głównym pakiecie npm, przechowywany w tym oficjalnym inwentarzu i instalowany na żądanie przez ClawHub i/lub npm.
- **Tylko checkout źródeł:** plugin lokalny dla repozytorium, pominięty w opublikowanych artefaktach npm i niereklamowany jako pakiet możliwy do zainstalowania.

Checkouty źródeł różnią się od instalacji npm: po `pnpm install` dołączone
pluginy ładują się z `extensions/<id>`, więc dostępne są lokalne zmiany oraz
zależności workspace lokalne dla pakietu.

## Instalowanie pluginu

Użyj ścieżki instalacji w każdym wpisie, aby zdecydować, czy instalacja jest potrzebna. Pluginy,
które mówią `included in OpenClaw`, są już obecne w głównym pakiecie.
Oficjalne pakiety zewnętrzne wymagają jednej instalacji, a następnie ponownego uruchomienia Gateway.

Na przykład Discord jest oficjalnym pakietem zewnętrznym:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Podczas przełączenia uruchomieniowego zwykłe gołe specyfikacje pakietów nadal instalują się z npm.
Użyj `clawhub:@openclaw/discord` lub `npm:@openclaw/discord`, gdy potrzebujesz
jawnego źródła. Po instalacji postępuj zgodnie z dokumentacją konfiguracji pluginu, taką jak
[Discord](/pl/channels/discord), aby dodać dane uwierzytelniające i konfigurację kanału. Zobacz
[Zarządzanie pluginami](/pl/plugins/manage-plugins), aby poznać polecenia aktualizacji, odinstalowania i publikowania.

Każdy wpis zawiera pakiet, ścieżkę dystrybucji i opis.

## Główny pakiet npm

59 pluginów

- **[admin-http-rpc](/pl/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - dołączony w OpenClaw. Punkt końcowy HTTP RPC administracji OpenClaw.

- **[alibaba](/pl/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - dołączony w OpenClaw. Dodaje obsługę dostawcy generowania wideo.

- **[anthropic](/pl/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli Anthropic.

- **[azure-speech](/pl/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - dołączony w OpenClaw. Azure AI Speech do zamiany tekstu na mowę (MP3, natywne notatki głosowe Ogg/Opus, telefonia PCM).

- **[bonjour](/pl/plugins/reference/bonjour)** (`@openclaw/bonjour`) - dołączony w OpenClaw. Rozgłasza lokalny Gateway OpenClaw przez Bonjour/mDNS.

- **[browser](/pl/plugins/reference/browser)** (`@openclaw/browser-plugin`) - dołączony w OpenClaw. Dodaje narzędzia wywoływalne przez agenta.

- **[byteplus](/pl/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawców modeli BytePlus, BytePlus Plan.

- **[canvas](/pl/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - dołączony w OpenClaw. Eksperymentalne powierzchnie sterowania Canvas i renderowania A2UI dla sparowanych węzłów.

- **[codex-supervisor](/pl/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - dołączony w OpenClaw. Nadzoruj sesje app-server Codex z OpenClaw.

- **[cohere](/pl/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - dołączony w OpenClaw; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. Plugin dostawcy Cohere dla OpenClaw.

- **[comfy](/pl/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli ComfyUI.

- **[copilot-proxy](/pl/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli Copilot Proxy.

- **[deepgram](/pl/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - dołączony w OpenClaw. Dodaje obsługę dostawcy rozumienia multimediów. Dodaje obsługę dostawcy transkrypcji w czasie rzeczywistym.

- **[document-extract](/pl/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - dołączony w OpenClaw. Wyodrębnia tekst i zapasowe obrazy stron z lokalnych załączników dokumentów.

- **[duckduckgo](/pl/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - dołączony w OpenClaw. Dodaje obsługę dostawcy wyszukiwania internetowego.

- **[elevenlabs](/pl/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - dołączony w OpenClaw. Dodaje obsługę dostawcy rozumienia multimediów. Dodaje obsługę dostawcy transkrypcji w czasie rzeczywistym. Dodaje obsługę dostawcy zamiany tekstu na mowę.

- **[fal](/pl/plugins/reference/fal)** (`@openclaw/fal-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli fal.

- **[file-transfer](/pl/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - dołączony w OpenClaw. Pobieraj, wyświetlaj i zapisuj pliki na sparowanych węzłach za pomocą dedykowanych poleceń węzła. Omija obcinanie stdout powłoki bash, używając base64 przez node.invoke dla plików binarnych do 16 MB.

- **[github-copilot](/pl/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli GitHub Copilot.

- **[google](/pl/plugins/reference/google)** (`@openclaw/google-plugin`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawców modeli Google, Google Gemini CLI, Google Vertex.

- **[huggingface](/pl/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli Hugging Face.

- **[imessage](/pl/plugins/reference/imessage)** (`@openclaw/imessage`) - dołączony w OpenClaw. Dodaje powierzchnię kanału iMessage do wysyłania i odbierania wiadomości OpenClaw.

- **[litellm](/pl/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli LiteLLM.

- **[llm-task](/pl/plugins/reference/llm-task)** (`@openclaw/llm-task`) - dołączony w OpenClaw. Ogólne narzędzie LLM wyłącznie JSON do ustrukturyzowanych zadań wywoływalnych z przepływów pracy.

- **[lmstudio](/pl/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli LM Studio.

- **[memory-core](/pl/plugins/reference/memory-core)** (`@openclaw/memory-core`) - dołączony w OpenClaw. Dodaje narzędzia wywoływalne przez agenta.

- **[memory-wiki](/pl/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - dołączony w OpenClaw. Trwały kompilator wiki i przyjazny dla Obsidian magazyn wiedzy dla OpenClaw.

- **[microsoft](/pl/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - dołączony w OpenClaw. Dodaje obsługę dostawcy zamiany tekstu na mowę.

- **[microsoft-foundry](/pl/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli Microsoft Foundry.

- **[migrate-claude](/pl/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - dołączony w OpenClaw. Importuje instrukcje Claude Code i Claude Desktop, serwery MCP, Skills oraz bezpieczną konfigurację do OpenClaw.

- **[migrate-hermes](/pl/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - dołączony w OpenClaw. Importuje konfigurację Hermes, pamięci, Skills i obsługiwane dane uwierzytelniające do OpenClaw.

- **[minimax](/pl/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawców modeli MiniMax, MiniMax Portal.

- **[mistral](/pl/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli Mistral.

- **[novita](/pl/plugins/reference/novita)** (`@openclaw/novita-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawców modeli Novita, Novita AI, Novitaai.

- **[nvidia](/pl/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli NVIDIA.

- **[oc-path](/pl/plugins/reference/oc-path)** (`@openclaw/oc-path`) - dołączony w OpenClaw. Dodaje CLI ścieżki openclaw do adresowania plików workspace przez oc://.

- **[ollama](/pl/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawców modeli Ollama, Ollama Cloud.

- **[open-prose](/pl/plugins/reference/open-prose)** (`@openclaw/open-prose`) - dołączony w OpenClaw. Pakiet Skills OpenProse VM z poleceniem ukośnikowym /prose.

- **[openai](/pl/plugins/reference/openai)** (`@openclaw/openai-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli OpenAI.

- **[opencode](/pl/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli OpenCode.

- **[opencode-go](/pl/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli OpenCode Go.

- **[openrouter](/pl/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli OpenRouter.

- **[policy](/pl/plugins/reference/policy)** (`@openclaw/policy`) - dołączony w OpenClaw. Dodaje kontrole doctor oparte na zasadach zgodności workspace.

- **[runway](/pl/plugins/reference/runway)** (`@openclaw/runway-provider`) - dołączony w OpenClaw. Dodaje obsługę dostawcy generowania wideo.

- **[senseaudio](/pl/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - dołączony w OpenClaw. Dodaje obsługę dostawcy rozumienia multimediów.

- **[sglang](/pl/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli SGLang.

- **[synthetic](/pl/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli Synthetic.

- **[telegram](/pl/plugins/reference/telegram)** (`@openclaw/telegram`) - dołączony w OpenClaw. Dodaje powierzchnię kanału Telegram do wysyłania i odbierania wiadomości OpenClaw.

- **[together](/pl/plugins/reference/together)** (`@openclaw/together-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli Together.

- **[tts-local-cli](/pl/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - dołączony w OpenClaw. Dodaje obsługę dostawcy zamiany tekstu na mowę.

- **[vllm](/pl/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli vLLM.

- **[volcengine](/pl/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawców modeli Volcengine, Volcengine Plan.

- **[voyage](/pl/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - dołączony w OpenClaw. Dodaje obsługę dostawcy embeddingów pamięci.

- **[vydra](/pl/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli Vydra.

- **[web-readability](/pl/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - dołączony w OpenClaw. Wyodrębnia czytelną treść artykułu z lokalnych odpowiedzi pobierania stron HTML.

- **[webhooks](/pl/plugins/reference/webhooks)** (`@openclaw/webhooks`) - dołączony w OpenClaw. Uwierzytelnione przychodzące Webhooki, które wiążą zewnętrzną automatyzację z OpenClaw TaskFlows.

- **[workboard](/pl/plugins/reference/workboard)** (`@openclaw/workboard`) - dołączony w OpenClaw. Tablica dashboard dla spraw i sesji należących do agenta.

- **[xai](/pl/plugins/reference/xai)** (`@openclaw/xai-plugin`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawcy modeli xAI.

- **[xiaomi](/pl/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - dołączony w OpenClaw. Dodaje do OpenClaw obsługę dostawców modeli Xiaomi, Xiaomi Token Plan.

## Oficjalne pakiety zewnętrzne

68 pluginów

- **[acpx](/pl/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub. Backend runtime ACP OpenClaw z zarządzaniem sesją i transportem należącym do pluginu.

- **[amazon-bedrock](/pl/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub. Plugin dostawcy Amazon Bedrock dla OpenClaw z wykrywaniem modeli, embeddingami i obsługą guardrail.

- **[amazon-bedrock-mantle](/pl/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. Plugin dostawcy OpenClaw Amazon Bedrock Mantle do routingu modeli zgodnych z OpenAI.

- **[anthropic-vertex](/pl/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. Plugin dostawcy OpenClaw Anthropic Vertex dla modeli Claude w Google Vertex AI.

- **[arcee](/pl/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. Dodaje do OpenClaw obsługę dostawcy modeli Arcee.

- **[brave](/pl/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. Plugin dostawcy OpenClaw Brave Search do wyszukiwania w sieci.

- **[cerebras](/pl/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. Dodaje do OpenClaw obsługę dostawcy modeli Cerebras.

- **[chutes](/pl/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. Dodaje do OpenClaw obsługę dostawcy modeli Chutes.

- **[clickclack](/pl/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. Dodaje powierzchnię kanału Clickclack do wysyłania i odbierania wiadomości OpenClaw.

- **[cloudflare-ai-gateway](/pl/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. Dodaje do OpenClaw obsługę dostawcy modeli Cloudflare AI Gateway.

- **[codex](/pl/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. Plugin uprzęży serwera aplikacji OpenClaw Codex i dostawcy modeli z katalogiem GPT zarządzanym przez Codex.

- **[copilot](/pl/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. Rejestruje środowisko uruchomieniowe agenta GitHub Copilot.

- **[deepinfra](/pl/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. Dodaje do OpenClaw obsługę dostawcy modeli DeepInfra.

- **[deepseek](/pl/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. Dodaje do OpenClaw obsługę dostawcy modeli DeepSeek.

- **[diagnostics-otel](/pl/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. Eksporter diagnostyki OpenClaw OpenTelemetry dla metryk, śladów i dzienników.

- **[diagnostics-prometheus](/pl/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. Eksporter diagnostyki OpenClaw Prometheus dla metryk środowiska uruchomieniowego.

- **[diffs](/pl/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. Plugin OpenClaw tylko do odczytu do przeglądania diffów i renderowania plików dla agentów.

- **[diffs-language-pack](/pl/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. Dodaje podświetlanie składni dla języków spoza domyślnego zestawu przeglądarki diffów.

- **[discord](/pl/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. Plugin kanału OpenClaw Discord dla kanałów, wiadomości DM, poleceń i zdarzeń aplikacji.

- **[exa](/pl/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. Dodaje obsługę dostawcy wyszukiwania w sieci.

- **[feishu](/pl/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. Plugin kanału OpenClaw Feishu/Lark dla czatów i narzędzi miejsca pracy (utrzymywany przez społeczność przez @m1heng).

- **[firecrawl](/pl/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. Dodaje narzędzia wywoływane przez agentów. Dodaje obsługę dostawcy pobierania stron z sieci. Dodaje obsługę dostawcy wyszukiwania w sieci.

- **[fireworks](/pl/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. Dodaje do OpenClaw obsługę dostawcy modeli Fireworks.

- **[gmi](/pl/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. Plugin dostawcy OpenClaw GMI Cloud.

- **[google-meet](/pl/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. Plugin uczestnika OpenClaw Google Meet do dołączania do połączeń przez transporty Chrome lub Twilio.

- **[googlechat](/pl/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. Plugin kanału OpenClaw Google Chat dla przestrzeni i wiadomości bezpośrednich.

- **[gradium](/pl/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. Dodaje obsługę dostawcy zamiany tekstu na mowę.

- **[groq](/pl/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. Dodaje do OpenClaw obsługę dostawcy modeli Groq.

- **[inworld](/pl/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Strumieniowa zamiana tekstu na mowę Inworld (MP3, OGG_OPUS, PCM telephony).

- **[irc](/pl/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. Dodaje powierzchnię kanału IRC do wysyłania i odbierania wiadomości OpenClaw.

- **[kilocode](/pl/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. Dodaje do OpenClaw obsługę dostawcy modeli Kilocode.

- **[kimi](/pl/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. Dodaje do OpenClaw obsługę dostawcy modeli Kimi, Kimi Coding.

- **[line](/pl/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. Plugin kanału OpenClaw LINE dla czatów LINE Bot API.

- **[llama-cpp](/pl/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. Lokalne osadzenia GGUF przez node-llama-cpp.

- **[lobster](/pl/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. Plugin narzędzia przepływu pracy Lobster dla typowanych potoków i wznawialnych zatwierdzeń.

- **[matrix](/pl/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. Plugin kanału OpenClaw Matrix dla pokojów i wiadomości bezpośrednich.

- **[mattermost](/pl/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. Dodaje powierzchnię kanału Mattermost do wysyłania i odbierania wiadomości OpenClaw.

- **[memory-lancedb](/pl/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. Plugin pamięci długoterminowej OpenClaw oparty na LanceDB, z automatycznym przywoływaniem, automatycznym przechwytywaniem i wyszukiwaniem wektorowym.

- **[moonshot](/pl/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. Dodaje do OpenClaw obsługę dostawcy modeli Moonshot.

- **[msteams](/pl/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. Plugin kanału OpenClaw Microsoft Teams dla rozmów z botem.

- **[nextcloud-talk](/pl/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. Plugin kanału OpenClaw Nextcloud Talk dla rozmów.

- **[nostr](/pl/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. Plugin kanału OpenClaw Nostr dla szyfrowanych wiadomości bezpośrednich NIP-04.

- **[openshell](/pl/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. Backend piaskownicy OpenClaw dla CLI NVIDIA OpenShell z lustrzanymi lokalnymi obszarami roboczymi i wykonywaniem poleceń SSH.

- **[parallel](/pl/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. Dodaje obsługę dostawcy wyszukiwania w sieci.

- **[perplexity](/pl/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. Dodaje obsługę dostawcy wyszukiwania w sieci.

- **[pixverse](/pl/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. Plugin dostawcy OpenClaw PixVerse do generowania wideo.

- **[qianfan](/pl/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. Dodaje do OpenClaw obsługę dostawcy modeli Qianfan.

- **[qqbot](/pl/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. Plugin kanału OpenClaw QQ Bot dla przepływów pracy grupowych i wiadomości bezpośrednich.

- **[qwen](/pl/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. Dodaje do OpenClaw obsługę dostawcy modeli Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Oauth, Qwen Portal, Qwen CLI.

- **[raft](/pl/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. Plugin kanału OpenClaw Raft dla bezpiecznych mostów wybudzania CLI.

- **[searxng](/pl/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. Dodaje obsługę dostawcy wyszukiwania w sieci.

- **[signal](/pl/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. Dodaje powierzchnię kanału Signal do wysyłania i odbierania wiadomości OpenClaw.

- **[slack](/pl/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. Plugin kanału OpenClaw Slack dla kanałów, wiadomości DM, poleceń i zdarzeń aplikacji.

- **[sms](/pl/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. Plugin kanału Twilio SMS dla wiadomości tekstowych OpenClaw.

- **[stepfun](/pl/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. Dodaje do OpenClaw obsługę dostawcy modeli StepFun, StepFun Plan.

- **[synology-chat](/pl/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. Plugin kanału Synology Chat dla kanałów OpenClaw i wiadomości bezpośrednich.

- **[tavily](/pl/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. Dodaje narzędzia wywoływane przez agentów. Dodaje obsługę dostawcy wyszukiwania w sieci.

- **[tencent](/pl/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. Dodaje do OpenClaw obsługę dostawcy modeli Tencent TokenHub.

- **[tlon](/pl/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. Plugin kanału OpenClaw Tlon/Urbit dla przepływów pracy czatu.

- **[tokenjuice](/pl/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. Kompaktuje wyniki narzędzi exec i bash za pomocą reduktorów tokenjuice.

- **[twitch](/pl/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. Plugin kanału OpenClaw Twitch dla przepływów pracy czatu i moderacji.

- **[venice](/pl/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. Dodaje do OpenClaw obsługę dostawcy modeli Venice.

- **[vercel-ai-gateway](/pl/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. Dodaje do OpenClaw obsługę dostawcy modeli Vercel AI Gateway.

- **[voice-call](/pl/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. Plugin OpenClaw voice-call dla połączeń telefonicznych Twilio, Telnyx i Plivo.

- **[whatsapp](/pl/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. Plugin kanału OpenClaw WhatsApp dla czatów WhatsApp Web.

- **[zai](/pl/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. Dodaje do OpenClaw obsługę dostawcy modeli Z.AI.

- **[zalo](/pl/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. Plugin kanału OpenClaw Zalo dla czatów botów i Webhook.

- **[zalouser](/pl/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. Plugin OpenClaw Zalo Personal Account przez natywną integrację zca-js.

## Tylko checkout źródłowy

3 pluginy

- **[qa-channel](/pl/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - tylko checkout źródłowy. Dodaje powierzchnię QA Channel do wysyłania i odbierania wiadomości OpenClaw.

- **[qa-lab](/pl/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - tylko checkout źródłowy. Plugin OpenClaw QA lab z prywatnym interfejsem debuggera i runnerem scenariuszy.

- **[qa-matrix](/pl/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - tylko checkout źródłowy. Mechanizm uruchamiający transport QA Matrix i podłoże.
