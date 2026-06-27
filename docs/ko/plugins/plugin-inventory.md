---
read_when:
    - Plugin이 핵심 npm 패키지에 포함되어 배포되는지, 아니면 별도로 설치되는지 결정합니다
    - 번들된 Plugin 패키지 메타데이터 또는 릴리스 자동화를 업데이트하고 있습니다
    - 정식 내부 Plugin과 외부 Plugin 목록이 필요합니다
summary: 코어에 포함되어 제공되거나, 외부에 게시되거나, 소스 전용으로 유지되는 OpenClaw Plugin의 생성된 인벤토리
title: Plugin 인벤토리
x-i18n:
    generated_at: "2026-06-27T17:47:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f0c5aa2c3e5f25308a4398dc2582caa8f355a4dfd0d5693d9cfaf1c1ce6926
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Plugin 인벤토리

이 페이지는 `extensions/*/package.json`, `openclaw.plugin.json`,
그리고 루트 npm 패키지 `files` 제외 항목에서 생성됩니다. 다음 명령으로 다시 생성하세요.

```bash
pnpm plugins:inventory:gen
```

## 정의

- **코어 npm 패키지:** `openclaw` npm 패키지에 내장되어 있으며 별도의 plugin 설치 없이 사용할 수 있습니다.
- **공식 외부 패키지:** 코어 npm 패키지에서 제외된 OpenClaw 유지 관리 plugin으로, 이 공식 인벤토리에 보관되며 ClawHub 및/또는 npm을 통해 필요할 때 설치됩니다.
- **소스 체크아웃 전용:** 게시된 npm 아티팩트에서 제외되며 설치 가능한 패키지로 홍보되지 않는 저장소 로컬 plugin입니다.

소스 체크아웃은 npm 설치와 다릅니다. `pnpm install` 후 번들된
plugins는 `extensions/<id>`에서 로드되므로 로컬 편집 사항과 패키지 로컬 워크스페이스
의존성을 사용할 수 있습니다.

## Plugin 설치

설치가 필요한지 판단하려면 각 항목의 설치 경로를 사용하세요. `included in OpenClaw`라고
표시된 plugins는 이미 코어 패키지에 포함되어 있습니다.
공식 외부 패키지는 한 번 설치한 뒤 Gateway를 다시 시작해야 합니다.

예를 들어 Discord는 공식 외부 패키지입니다.

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

출시 전환 중에는 일반적인 bare 패키지 명세도 계속 npm에서 설치됩니다.
명시적인 소스가 필요할 때는 `clawhub:@openclaw/discord` 또는 `npm:@openclaw/discord`를 사용하세요.
설치 후에는 [Discord](/ko/channels/discord)와 같은 plugin의 설정 문서를 따라
자격 증명과 채널 구성을 추가하세요. 업데이트, 제거, 게시
명령은 [plugins 관리](/ko/plugins/manage-plugins)를 참조하세요.

각 항목에는 패키지, 배포 경로, 설명이 나열됩니다.

## 코어 npm 패키지

59개 plugins

- **[admin-http-rpc](/ko/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - OpenClaw에 포함됨. OpenClaw 관리자 HTTP RPC 엔드포인트입니다.

- **[alibaba](/ko/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - OpenClaw에 포함됨. 동영상 생성 provider 지원을 추가합니다.

- **[anthropic](/ko/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - OpenClaw에 포함됨. OpenClaw에 Anthropic 모델 provider 지원을 추가합니다.

- **[azure-speech](/ko/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - OpenClaw에 포함됨. Azure AI Speech 텍스트 음성 변환(MP3, 네이티브 Ogg/Opus 음성 메모, PCM 전화 통신).

- **[bonjour](/ko/plugins/reference/bonjour)** (`@openclaw/bonjour`) - OpenClaw에 포함됨. Bonjour/mDNS를 통해 로컬 OpenClaw gateway를 알립니다.

- **[browser](/ko/plugins/reference/browser)** (`@openclaw/browser-plugin`) - OpenClaw에 포함됨. 에이전트가 호출할 수 있는 도구를 추가합니다.

- **[byteplus](/ko/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - OpenClaw에 포함됨. OpenClaw에 BytePlus, BytePlus Plan 모델 provider 지원을 추가합니다.

- **[canvas](/ko/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - OpenClaw에 포함됨. 페어링된 노드를 위한 실험적 Canvas 제어 및 A2UI 렌더링 표면입니다.

- **[codex-supervisor](/ko/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - OpenClaw에 포함됨. OpenClaw에서 Codex 앱 서버 세션을 감독합니다.

- **[cohere](/ko/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - OpenClaw에 포함됨; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. OpenClaw Cohere provider plugin입니다.

- **[comfy](/ko/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - OpenClaw에 포함됨. OpenClaw에 ComfyUI 모델 provider 지원을 추가합니다.

- **[copilot-proxy](/ko/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - OpenClaw에 포함됨. OpenClaw에 Copilot Proxy 모델 provider 지원을 추가합니다.

- **[deepgram](/ko/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - OpenClaw에 포함됨. 미디어 이해 provider 지원을 추가합니다. 실시간 전사 provider 지원을 추가합니다.

- **[document-extract](/ko/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - OpenClaw에 포함됨. 로컬 문서 첨부 파일에서 텍스트와 대체 페이지 이미지를 추출합니다.

- **[duckduckgo](/ko/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - OpenClaw에 포함됨. 웹 검색 provider 지원을 추가합니다.

- **[elevenlabs](/ko/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - OpenClaw에 포함됨. 미디어 이해 provider 지원을 추가합니다. 실시간 전사 provider 지원을 추가합니다. 텍스트 음성 변환 provider 지원을 추가합니다.

- **[fal](/ko/plugins/reference/fal)** (`@openclaw/fal-provider`) - OpenClaw에 포함됨. OpenClaw에 fal 모델 provider 지원을 추가합니다.

- **[file-transfer](/ko/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - OpenClaw에 포함됨. 전용 노드 명령을 통해 페어링된 노드에서 파일을 가져오고, 나열하고, 씁니다. 최대 16MB의 바이너리에 대해 node.invoke를 통한 base64를 사용하여 bash stdout 잘림을 우회합니다.

- **[github-copilot](/ko/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - OpenClaw에 포함됨. OpenClaw에 GitHub Copilot 모델 provider 지원을 추가합니다.

- **[google](/ko/plugins/reference/google)** (`@openclaw/google-plugin`) - OpenClaw에 포함됨. OpenClaw에 Google, Google Gemini CLI, Google Vertex 모델 provider 지원을 추가합니다.

- **[huggingface](/ko/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - OpenClaw에 포함됨. OpenClaw에 Hugging Face 모델 provider 지원을 추가합니다.

- **[imessage](/ko/plugins/reference/imessage)** (`@openclaw/imessage`) - OpenClaw에 포함됨. OpenClaw 메시지를 보내고 받기 위한 iMessage 채널 표면을 추가합니다.

- **[litellm](/ko/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - OpenClaw에 포함됨. OpenClaw에 LiteLLM 모델 provider 지원을 추가합니다.

- **[llm-task](/ko/plugins/reference/llm-task)** (`@openclaw/llm-task`) - OpenClaw에 포함됨. 워크플로에서 호출할 수 있는 구조화된 작업용 범용 JSON 전용 LLM 도구입니다.

- **[lmstudio](/ko/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - OpenClaw에 포함됨. OpenClaw에 LM Studio 모델 provider 지원을 추가합니다.

- **[memory-core](/ko/plugins/reference/memory-core)** (`@openclaw/memory-core`) - OpenClaw에 포함됨. 에이전트가 호출할 수 있는 도구를 추가합니다.

- **[memory-wiki](/ko/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - OpenClaw에 포함됨. OpenClaw를 위한 영구 위키 컴파일러 및 Obsidian 친화적 지식 보관소입니다.

- **[microsoft](/ko/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - OpenClaw에 포함됨. 텍스트 음성 변환 provider 지원을 추가합니다.

- **[microsoft-foundry](/ko/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - OpenClaw에 포함됨. OpenClaw에 Microsoft Foundry 모델 provider 지원을 추가합니다.

- **[migrate-claude](/ko/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - OpenClaw에 포함됨. Claude Code 및 Claude Desktop 지침, MCP 서버, skills, 안전한 구성을 OpenClaw로 가져옵니다.

- **[migrate-hermes](/ko/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - OpenClaw에 포함됨. Hermes 구성, 메모리, skills, 지원되는 자격 증명을 OpenClaw로 가져옵니다.

- **[minimax](/ko/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - OpenClaw에 포함됨. OpenClaw에 MiniMax, MiniMax Portal 모델 provider 지원을 추가합니다.

- **[mistral](/ko/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - OpenClaw에 포함됨. OpenClaw에 Mistral 모델 provider 지원을 추가합니다.

- **[novita](/ko/plugins/reference/novita)** (`@openclaw/novita-provider`) - OpenClaw에 포함됨. OpenClaw에 Novita, Novita AI, Novitaai 모델 provider 지원을 추가합니다.

- **[nvidia](/ko/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - OpenClaw에 포함됨. OpenClaw에 NVIDIA 모델 provider 지원을 추가합니다.

- **[oc-path](/ko/plugins/reference/oc-path)** (`@openclaw/oc-path`) - OpenClaw에 포함됨. oc:// 워크스페이스 파일 주소 지정을 위한 openclaw path CLI를 추가합니다.

- **[ollama](/ko/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - OpenClaw에 포함됨. OpenClaw에 Ollama, Ollama Cloud 모델 provider 지원을 추가합니다.

- **[open-prose](/ko/plugins/reference/open-prose)** (`@openclaw/open-prose`) - OpenClaw에 포함됨. /prose 슬래시 명령이 포함된 OpenProse VM skill 팩입니다.

- **[openai](/ko/plugins/reference/openai)** (`@openclaw/openai-provider`) - OpenClaw에 포함됨. OpenClaw에 OpenAI 모델 provider 지원을 추가합니다.

- **[opencode](/ko/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - OpenClaw에 포함됨. OpenClaw에 OpenCode 모델 provider 지원을 추가합니다.

- **[opencode-go](/ko/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - OpenClaw에 포함됨. OpenClaw에 OpenCode Go 모델 provider 지원을 추가합니다.

- **[openrouter](/ko/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - OpenClaw에 포함됨. OpenClaw에 OpenRouter 모델 provider 지원을 추가합니다.

- **[policy](/ko/plugins/reference/policy)** (`@openclaw/policy`) - OpenClaw에 포함됨. 워크스페이스 준수를 위한 정책 기반 doctor 검사를 추가합니다.

- **[runway](/ko/plugins/reference/runway)** (`@openclaw/runway-provider`) - OpenClaw에 포함됨. 동영상 생성 provider 지원을 추가합니다.

- **[senseaudio](/ko/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - OpenClaw에 포함됨. 미디어 이해 provider 지원을 추가합니다.

- **[sglang](/ko/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - OpenClaw에 포함됨. OpenClaw에 SGLang 모델 provider 지원을 추가합니다.

- **[synthetic](/ko/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - OpenClaw에 포함됨. OpenClaw에 Synthetic 모델 provider 지원을 추가합니다.

- **[telegram](/ko/plugins/reference/telegram)** (`@openclaw/telegram`) - OpenClaw에 포함됨. OpenClaw 메시지를 보내고 받기 위한 Telegram 채널 표면을 추가합니다.

- **[together](/ko/plugins/reference/together)** (`@openclaw/together-provider`) - OpenClaw에 포함됨. OpenClaw에 Together 모델 provider 지원을 추가합니다.

- **[tts-local-cli](/ko/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - OpenClaw에 포함됨. 텍스트 음성 변환 provider 지원을 추가합니다.

- **[vllm](/ko/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - OpenClaw에 포함됨. OpenClaw에 vLLM 모델 provider 지원을 추가합니다.

- **[volcengine](/ko/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - OpenClaw에 포함됨. OpenClaw에 Volcengine, Volcengine Plan 모델 provider 지원을 추가합니다.

- **[voyage](/ko/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - OpenClaw에 포함됨. 메모리 임베딩 provider 지원을 추가합니다.

- **[vydra](/ko/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - OpenClaw에 포함됨. OpenClaw에 Vydra 모델 provider 지원을 추가합니다.

- **[web-readability](/ko/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - OpenClaw에 포함됨. 로컬 HTML 웹 가져오기 응답에서 읽기 쉬운 기사 콘텐츠를 추출합니다.

- **[webhooks](/ko/plugins/reference/webhooks)** (`@openclaw/webhooks`) - OpenClaw TaskFlow에 외부 자동화를 바인딩하는 인증된 인바운드 webhooks입니다.

- **[workboard](/ko/plugins/reference/workboard)** (`@openclaw/workboard`) - OpenClaw에 포함됨. 에이전트 소유 이슈와 세션을 위한 대시보드 작업 보드입니다.

- **[xai](/ko/plugins/reference/xai)** (`@openclaw/xai-plugin`) - OpenClaw에 포함됨. OpenClaw에 xAI 모델 provider 지원을 추가합니다.

- **[xiaomi](/ko/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - OpenClaw에 포함됨. OpenClaw에 Xiaomi, Xiaomi Token Plan 모델 provider 지원을 추가합니다.

## 공식 외부 패키지

68개 plugins

- **[acpx](/ko/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub. plugin 소유 세션 및 전송 관리를 제공하는 OpenClaw ACP 런타임 백엔드입니다.

- **[amazon-bedrock](/ko/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub. 모델 검색, 임베딩, 가드레일 지원을 제공하는 OpenClaw Amazon Bedrock provider plugin입니다.

- **[amazon-bedrock-mantle](/ko/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. OpenAI 호환 모델 라우팅을 위한 OpenClaw Amazon Bedrock Mantle 제공자 Plugin입니다.

- **[anthropic-vertex](/ko/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. Google Vertex AI의 Claude 모델을 위한 OpenClaw Anthropic Vertex 제공자 Plugin입니다.

- **[arcee](/ko/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. OpenClaw에 Arcee 모델 제공자 지원을 추가합니다.

- **[brave](/ko/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. 웹 검색을 위한 OpenClaw Brave Search 제공자 Plugin입니다.

- **[cerebras](/ko/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. OpenClaw에 Cerebras 모델 제공자 지원을 추가합니다.

- **[chutes](/ko/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. OpenClaw에 Chutes 모델 제공자 지원을 추가합니다.

- **[clickclack](/ko/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. OpenClaw 메시지를 보내고 받기 위한 Clickclack 채널 표면을 추가합니다.

- **[cloudflare-ai-gateway](/ko/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. OpenClaw에 Cloudflare AI Gateway 모델 제공자 지원을 추가합니다.

- **[codex](/ko/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. Codex가 관리하는 GPT 카탈로그를 포함한 OpenClaw Codex 앱 서버 하네스 및 모델 제공자 Plugin입니다.

- **[copilot](/ko/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. GitHub Copilot 에이전트 런타임을 등록합니다.

- **[deepinfra](/ko/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. OpenClaw에 DeepInfra 모델 제공자 지원을 추가합니다.

- **[deepseek](/ko/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. OpenClaw에 DeepSeek 모델 제공자 지원을 추가합니다.

- **[diagnostics-otel](/ko/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. 메트릭, 트레이스, 로그를 위한 OpenClaw 진단 OpenTelemetry 익스포터입니다.

- **[diagnostics-prometheus](/ko/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. 런타임 메트릭을 위한 OpenClaw 진단 Prometheus 익스포터입니다.

- **[diffs](/ko/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. 에이전트를 위한 OpenClaw 읽기 전용 diff 뷰어 Plugin 및 파일 렌더러입니다.

- **[diffs-language-pack](/ko/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. 기본 diff 뷰어 세트 밖의 언어에 대한 구문 강조를 추가합니다.

- **[discord](/ko/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. 채널, DM, 명령, 앱 이벤트를 위한 OpenClaw Discord 채널 Plugin입니다.

- **[exa](/ko/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. 웹 검색 제공자 지원을 추가합니다.

- **[feishu](/ko/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. 채팅 및 업무 도구를 위한 OpenClaw Feishu/Lark 채널 Plugin입니다(@m1heng가 커뮤니티에서 유지 관리).

- **[firecrawl](/ko/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. 에이전트가 호출할 수 있는 도구를 추가합니다. 웹 가져오기 제공자 지원을 추가합니다. 웹 검색 제공자 지원을 추가합니다.

- **[fireworks](/ko/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. OpenClaw에 Fireworks 모델 제공자 지원을 추가합니다.

- **[gmi](/ko/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. OpenClaw GMI Cloud 제공자 Plugin입니다.

- **[google-meet](/ko/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. Chrome 또는 Twilio 전송을 통해 통화에 참여하기 위한 OpenClaw Google Meet 참가자 Plugin입니다.

- **[googlechat](/ko/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. 스페이스와 다이렉트 메시지를 위한 OpenClaw Google Chat 채널 Plugin입니다.

- **[gradium](/ko/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. 텍스트 음성 변환 제공자 지원을 추가합니다.

- **[groq](/ko/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. OpenClaw에 Groq 모델 제공자 지원을 추가합니다.

- **[inworld](/ko/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Inworld 스트리밍 텍스트 음성 변환(MP3, OGG_OPUS, PCM 텔레포니)입니다.

- **[irc](/ko/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. OpenClaw 메시지를 보내고 받기 위한 IRC 채널 표면을 추가합니다.

- **[kilocode](/ko/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. OpenClaw에 Kilocode 모델 제공자 지원을 추가합니다.

- **[kimi](/ko/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. OpenClaw에 Kimi, Kimi Coding 모델 제공자 지원을 추가합니다.

- **[line](/ko/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. LINE Bot API 채팅을 위한 OpenClaw LINE 채널 Plugin입니다.

- **[llama-cpp](/ko/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. node-llama-cpp를 통한 로컬 GGUF 임베딩입니다.

- **[lobster](/ko/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. 타입 지정 파이프라인과 재개 가능한 승인을 위한 Lobster 워크플로 도구 Plugin입니다.

- **[matrix](/ko/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. 룸과 다이렉트 메시지를 위한 OpenClaw Matrix 채널 Plugin입니다.

- **[mattermost](/ko/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. OpenClaw 메시지를 보내고 받기 위한 Mattermost 채널 표면을 추가합니다.

- **[memory-lancedb](/ko/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. 자동 회상, 자동 캡처, 벡터 검색을 제공하는 OpenClaw LanceDB 기반 장기 메모리 Plugin입니다.

- **[moonshot](/ko/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. OpenClaw에 Moonshot 모델 제공자 지원을 추가합니다.

- **[msteams](/ko/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. 봇 대화를 위한 OpenClaw Microsoft Teams 채널 Plugin입니다.

- **[nextcloud-talk](/ko/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. 대화를 위한 OpenClaw Nextcloud Talk 채널 Plugin입니다.

- **[nostr](/ko/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. NIP-04 암호화 다이렉트 메시지를 위한 OpenClaw Nostr 채널 Plugin입니다.

- **[openshell](/ko/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. 미러링된 로컬 워크스페이스와 SSH 명령 실행을 제공하는 NVIDIA OpenShell CLI용 OpenClaw 샌드박스 백엔드입니다.

- **[parallel](/ko/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. 웹 검색 제공자 지원을 추가합니다.

- **[perplexity](/ko/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. 웹 검색 제공자 지원을 추가합니다.

- **[pixverse](/ko/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. OpenClaw PixVerse 동영상 생성 제공자 Plugin입니다.

- **[qianfan](/ko/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. OpenClaw에 Qianfan 모델 제공자 지원을 추가합니다.

- **[qqbot](/ko/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. 그룹 및 다이렉트 메시지 워크플로를 위한 OpenClaw QQ Bot 채널 Plugin입니다.

- **[qwen](/ko/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. OpenClaw에 Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Oauth, Qwen Portal, Qwen CLI 모델 제공자 지원을 추가합니다.

- **[raft](/ko/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. 안전한 CLI 깨우기 브리지를 위한 OpenClaw Raft 채널 Plugin입니다.

- **[searxng](/ko/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. 웹 검색 제공자 지원을 추가합니다.

- **[signal](/ko/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. OpenClaw 메시지를 보내고 받기 위한 Signal 채널 표면을 추가합니다.

- **[slack](/ko/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. 채널, DM, 명령, 앱 이벤트를 위한 OpenClaw Slack 채널 Plugin입니다.

- **[sms](/ko/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. OpenClaw 텍스트 메시지를 위한 Twilio SMS 채널 Plugin입니다.

- **[stepfun](/ko/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. OpenClaw에 StepFun, StepFun Plan 모델 제공자 지원을 추가합니다.

- **[synology-chat](/ko/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. OpenClaw 채널과 다이렉트 메시지를 위한 Synology Chat 채널 Plugin입니다.

- **[tavily](/ko/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. 에이전트가 호출할 수 있는 도구를 추가합니다. 웹 검색 제공자 지원을 추가합니다.

- **[tencent](/ko/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. OpenClaw에 Tencent TokenHub 모델 제공자 지원을 추가합니다.

- **[tlon](/ko/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. 채팅 워크플로를 위한 OpenClaw Tlon/Urbit 채널 Plugin입니다.

- **[tokenjuice](/ko/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. tokenjuice 리듀서로 exec 및 bash 도구 결과를 압축합니다.

- **[twitch](/ko/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. 채팅 및 중재 워크플로를 위한 OpenClaw Twitch 채널 Plugin입니다.

- **[venice](/ko/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. OpenClaw에 Venice 모델 제공자 지원을 추가합니다.

- **[vercel-ai-gateway](/ko/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. OpenClaw에 Vercel AI Gateway 모델 제공자 지원을 추가합니다.

- **[voice-call](/ko/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. Twilio, Telnyx, Plivo 전화 통화를 위한 OpenClaw voice-call Plugin입니다.

- **[whatsapp](/ko/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. WhatsApp Web 채팅을 위한 OpenClaw WhatsApp 채널 Plugin입니다.

- **[zai](/ko/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. OpenClaw에 Z.AI 모델 제공자 지원을 추가합니다.

- **[zalo](/ko/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. 봇 및 Webhook 채팅을 위한 OpenClaw Zalo 채널 Plugin입니다.

- **[zalouser](/ko/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. 네이티브 zca-js 통합을 통한 OpenClaw Zalo 개인 계정 Plugin입니다.

## 소스 체크아웃 전용

3개 Plugin

- **[qa-channel](/ko/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - 소스 체크아웃 전용. OpenClaw 메시지를 보내고 받기 위한 QA Channel 표면을 추가합니다.

- **[qa-lab](/ko/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - 소스 체크아웃 전용. 비공개 디버거 UI와 시나리오 러너를 포함한 OpenClaw QA lab Plugin입니다.

- **[qa-matrix](/ko/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - 소스 체크아웃 전용입니다. 매트릭스 QA 전송 러너 및 기반입니다.
