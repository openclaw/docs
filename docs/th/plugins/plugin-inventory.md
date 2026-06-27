---
read_when:
    - คุณกำลังตัดสินใจว่า Plugin หนึ่งจะจัดส่งมากับแพ็กเกจ npm หลักหรือติดตั้งแยกต่างหาก
    - คุณกำลังอัปเดตเมทาดาทาของแพ็กเกจ Plugin ที่บันเดิลมา หรือระบบอัตโนมัติสำหรับการเผยแพร่
    - คุณต้องใช้รายการ Plugin ภายในและภายนอกที่เป็นมาตรฐาน
summary: รายการ Plugin ของ OpenClaw ที่สร้างขึ้น ซึ่งจัดส่งมากับแกนหลัก เผยแพร่ภายนอก หรือเก็บไว้เป็นซอร์สเท่านั้น
title: รายการ Plugin
x-i18n:
    generated_at: "2026-06-27T17:58:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f0c5aa2c3e5f25308a4398dc2582caa8f355a4dfd0d5693d9cfaf1c1ce6926
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# คลังรายการ Plugin

หน้านี้สร้างจาก `extensions/*/package.json`, `openclaw.plugin.json`,
และการยกเว้น `files` ของแพ็กเกจ npm ราก สร้างใหม่ด้วย:

```bash
pnpm plugins:inventory:gen
```

## คำนิยาม

- **แพ็กเกจ npm หลัก:** รวมอยู่ในแพ็กเกจ npm `openclaw` และพร้อมใช้งานโดยไม่ต้องติดตั้ง Plugin แยกต่างหาก
- **แพ็กเกจภายนอกอย่างเป็นทางการ:** Plugin ที่ OpenClaw ดูแล ซึ่งถูกละไว้จากแพ็กเกจ npm หลัก เก็บไว้ในคลังรายการทางการนี้ และติดตั้งตามต้องการผ่าน ClawHub และ/หรือ npm
- **เฉพาะซอร์สเช็กเอาต์เท่านั้น:** Plugin ภายใน repo ที่ถูกละไว้จากอาร์ติแฟกต์ npm ที่เผยแพร่ และไม่ได้ประกาศเป็นแพ็กเกจที่ติดตั้งได้

ซอร์สเช็กเอาต์แตกต่างจากการติดตั้งผ่าน npm: หลังจาก `pnpm install` แล้ว Plugin
ที่บันเดิลมาจะโหลดจาก `extensions/<id>` เพื่อให้การแก้ไขในเครื่องและ dependency
ของ workspace ภายในแพ็กเกจพร้อมใช้งาน

## ติดตั้ง Plugin

ใช้เส้นทางการติดตั้งในแต่ละรายการเพื่อตัดสินว่าจำเป็นต้องติดตั้งหรือไม่ Plugin
ที่ระบุว่า `included in OpenClaw` มีอยู่แล้วในแพ็กเกจหลัก
แพ็กเกจภายนอกอย่างเป็นทางการต้องติดตั้งหนึ่งครั้ง แล้วรีสตาร์ท Gateway

ตัวอย่างเช่น Discord เป็นแพ็กเกจภายนอกอย่างเป็นทางการ:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

ระหว่างการเปลี่ยนผ่านช่วงเปิดตัว สเปกแพ็กเกจแบบ bare ตามปกติยังคงติดตั้งจาก npm
ใช้ `clawhub:@openclaw/discord` หรือ `npm:@openclaw/discord` เมื่อคุณต้องการ
ระบุแหล่งที่มาอย่างชัดเจน หลังติดตั้ง ให้ทำตามเอกสารการตั้งค่าของ Plugin เช่น
[Discord](/th/channels/discord) เพื่อเพิ่มข้อมูลรับรองและการกำหนดค่าช่องทาง ดู
[จัดการ Plugin](/th/plugins/manage-plugins) สำหรับคำสั่งอัปเดต ถอนการติดตั้ง และเผยแพร่

แต่ละรายการแสดงแพ็กเกจ เส้นทางการแจกจ่าย และคำอธิบาย

## แพ็กเกจ npm หลัก

59 Plugin

- **[admin-http-rpc](/th/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - รวมอยู่ใน OpenClaw จุดปลาย HTTP RPC สำหรับผู้ดูแลของ OpenClaw

- **[alibaba](/th/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการสร้างวิดีโอ

- **[anthropic](/th/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Anthropic ให้กับ OpenClaw

- **[azure-speech](/th/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - รวมอยู่ใน OpenClaw Azure AI Speech สำหรับแปลงข้อความเป็นเสียงพูด (MP3, บันทึกเสียง Ogg/Opus แบบเนทีฟ, โทรศัพท์ PCM)

- **[bonjour](/th/plugins/reference/bonjour)** (`@openclaw/bonjour`) - รวมอยู่ใน OpenClaw ประกาศ Gateway OpenClaw ภายในเครื่องผ่าน Bonjour/mDNS

- **[browser](/th/plugins/reference/browser)** (`@openclaw/browser-plugin`) - รวมอยู่ใน OpenClaw เพิ่มเครื่องมือที่เอเจนต์เรียกใช้ได้

- **[byteplus](/th/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล BytePlus, BytePlus Plan ให้กับ OpenClaw

- **[canvas](/th/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - รวมอยู่ใน OpenClaw พื้นผิวควบคุม Canvas และการเรนเดอร์ A2UI แบบทดลองสำหรับโหนดที่จับคู่กัน

- **[codex-supervisor](/th/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - รวมอยู่ใน OpenClaw กำกับดูแลเซสชัน Codex app-server จาก OpenClaw

- **[cohere](/th/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - รวมอยู่ใน OpenClaw; npm; ClawHub: `clawhub:@openclaw/cohere-provider` Plugin ผู้ให้บริการ Cohere ของ OpenClaw

- **[comfy](/th/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล ComfyUI ให้กับ OpenClaw

- **[copilot-proxy](/th/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Copilot Proxy ให้กับ OpenClaw

- **[deepgram](/th/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการทำความเข้าใจสื่อ เพิ่มการรองรับผู้ให้บริการถอดเสียงแบบเรียลไทม์

- **[document-extract](/th/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - รวมอยู่ใน OpenClaw แยกข้อความและรูปภาพหน้าสำรองจากไฟล์แนบเอกสารภายในเครื่อง

- **[duckduckgo](/th/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการค้นหาเว็บ

- **[elevenlabs](/th/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการทำความเข้าใจสื่อ เพิ่มการรองรับผู้ให้บริการถอดเสียงแบบเรียลไทม์ เพิ่มการรองรับผู้ให้บริการแปลงข้อความเป็นเสียงพูด

- **[fal](/th/plugins/reference/fal)** (`@openclaw/fal-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล fal ให้กับ OpenClaw

- **[file-transfer](/th/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - รวมอยู่ใน OpenClaw ดึง แสดงรายการ และเขียนไฟล์บนโหนดที่จับคู่กันผ่านคำสั่งโหนดเฉพาะ เลี่ยงการตัดทอน stdout ของ bash โดยใช้ base64 ผ่าน node.invoke สำหรับไบนารีขนาดสูงสุด 16 MB

- **[github-copilot](/th/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล GitHub Copilot ให้กับ OpenClaw

- **[google](/th/plugins/reference/google)** (`@openclaw/google-plugin`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Google, Google Gemini CLI, Google Vertex ให้กับ OpenClaw

- **[huggingface](/th/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Hugging Face ให้กับ OpenClaw

- **[imessage](/th/plugins/reference/imessage)** (`@openclaw/imessage`) - รวมอยู่ใน OpenClaw เพิ่มพื้นผิวช่องทาง iMessage สำหรับส่งและรับข้อความ OpenClaw

- **[litellm](/th/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล LiteLLM ให้กับ OpenClaw

- **[llm-task](/th/plugins/reference/llm-task)** (`@openclaw/llm-task`) - รวมอยู่ใน OpenClaw เครื่องมือ LLM แบบ JSON เท่านั้นทั่วไปสำหรับงานที่มีโครงสร้าง ซึ่งเรียกใช้ได้จาก workflow

- **[lmstudio](/th/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล LM Studio ให้กับ OpenClaw

- **[memory-core](/th/plugins/reference/memory-core)** (`@openclaw/memory-core`) - รวมอยู่ใน OpenClaw เพิ่มเครื่องมือที่เอเจนต์เรียกใช้ได้

- **[memory-wiki](/th/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - รวมอยู่ใน OpenClaw คอมไพเลอร์วิกิแบบถาวรและคลังความรู้ที่เป็นมิตรกับ Obsidian สำหรับ OpenClaw

- **[microsoft](/th/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการแปลงข้อความเป็นเสียงพูด

- **[microsoft-foundry](/th/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Microsoft Foundry ให้กับ OpenClaw

- **[migrate-claude](/th/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - รวมอยู่ใน OpenClaw นำเข้าคำสั่ง Claude Code และ Claude Desktop, เซิร์ฟเวอร์ MCP, Skills และการกำหนดค่าที่ปลอดภัยเข้าสู่ OpenClaw

- **[migrate-hermes](/th/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - รวมอยู่ใน OpenClaw นำเข้าการกำหนดค่า Hermes, หน่วยความจำ, Skills และข้อมูลรับรองที่รองรับเข้าสู่ OpenClaw

- **[minimax](/th/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล MiniMax, MiniMax Portal ให้กับ OpenClaw

- **[mistral](/th/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Mistral ให้กับ OpenClaw

- **[novita](/th/plugins/reference/novita)** (`@openclaw/novita-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Novita, Novita AI, Novitaai ให้กับ OpenClaw

- **[nvidia](/th/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล NVIDIA ให้กับ OpenClaw

- **[oc-path](/th/plugins/reference/oc-path)** (`@openclaw/oc-path`) - รวมอยู่ใน OpenClaw เพิ่ม CLI เส้นทาง openclaw สำหรับการอ้างอิงไฟล์ workspace แบบ oc://

- **[ollama](/th/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Ollama, Ollama Cloud ให้กับ OpenClaw

- **[open-prose](/th/plugins/reference/open-prose)** (`@openclaw/open-prose`) - รวมอยู่ใน OpenClaw ชุด Skills สำหรับ OpenProse VM พร้อมคำสั่ง slash /prose

- **[openai](/th/plugins/reference/openai)** (`@openclaw/openai-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล OpenAI ให้กับ OpenClaw

- **[opencode](/th/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล OpenCode ให้กับ OpenClaw

- **[opencode-go](/th/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล OpenCode Go ให้กับ OpenClaw

- **[openrouter](/th/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล OpenRouter ให้กับ OpenClaw

- **[policy](/th/plugins/reference/policy)** (`@openclaw/policy`) - รวมอยู่ใน OpenClaw เพิ่มการตรวจ doctor ที่รองรับด้วยนโยบายสำหรับความสอดคล้องของ workspace

- **[runway](/th/plugins/reference/runway)** (`@openclaw/runway-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการสร้างวิดีโอ

- **[senseaudio](/th/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการทำความเข้าใจสื่อ

- **[sglang](/th/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล SGLang ให้กับ OpenClaw

- **[synthetic](/th/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Synthetic ให้กับ OpenClaw

- **[telegram](/th/plugins/reference/telegram)** (`@openclaw/telegram`) - รวมอยู่ใน OpenClaw เพิ่มพื้นผิวช่องทาง Telegram สำหรับส่งและรับข้อความ OpenClaw

- **[together](/th/plugins/reference/together)** (`@openclaw/together-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Together ให้กับ OpenClaw

- **[tts-local-cli](/th/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการแปลงข้อความเป็นเสียงพูด

- **[vllm](/th/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล vLLM ให้กับ OpenClaw

- **[volcengine](/th/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Volcengine, Volcengine Plan ให้กับ OpenClaw

- **[voyage](/th/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการ embedding หน่วยความจำ

- **[vydra](/th/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Vydra ให้กับ OpenClaw

- **[web-readability](/th/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - รวมอยู่ใน OpenClaw แยกเนื้อหาบทความที่อ่านได้จากการตอบกลับการดึงเว็บ HTML ภายในเครื่อง

- **[webhooks](/th/plugins/reference/webhooks)** (`@openclaw/webhooks`) - รวมอยู่ใน OpenClaw Webhook ขาเข้าที่ผ่านการยืนยันตัวตน ซึ่งผูกระบบอัตโนมัติภายนอกเข้ากับ OpenClaw TaskFlows

- **[workboard](/th/plugins/reference/workboard)** (`@openclaw/workboard`) - รวมอยู่ใน OpenClaw workboard แดชบอร์ดสำหรับ issue และเซสชันที่เอเจนต์เป็นเจ้าของ

- **[xai](/th/plugins/reference/xai)** (`@openclaw/xai-plugin`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล xAI ให้กับ OpenClaw

- **[xiaomi](/th/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Xiaomi, Xiaomi Token Plan ให้กับ OpenClaw

## แพ็กเกจภายนอกอย่างเป็นทางการ

68 Plugin

- **[acpx](/th/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub แบ็กเอนด์รันไทม์ ACP ของ OpenClaw พร้อมการจัดการเซสชันและการขนส่งที่ Plugin เป็นเจ้าของ

- **[amazon-bedrock](/th/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub Plugin ผู้ให้บริการ Amazon Bedrock ของ OpenClaw พร้อมการค้นพบโมเดล, embeddings และการรองรับ guardrail

- **[amazon-bedrock-mantle](/th/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. Plugin ผู้ให้บริการ OpenClaw Amazon Bedrock Mantle สำหรับการกำหนดเส้นทางโมเดลที่เข้ากันได้กับ OpenAI.

- **[anthropic-vertex](/th/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. Plugin ผู้ให้บริการ OpenClaw Anthropic Vertex สำหรับโมเดล Claude บน Google Vertex AI.

- **[arcee](/th/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Arcee ให้กับ OpenClaw.

- **[brave](/th/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. Plugin ผู้ให้บริการ OpenClaw Brave Search สำหรับการค้นหาเว็บ.

- **[cerebras](/th/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Cerebras ให้กับ OpenClaw.

- **[chutes](/th/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Chutes ให้กับ OpenClaw.

- **[clickclack](/th/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. เพิ่มพื้นผิวช่องทาง Clickclack สำหรับส่งและรับข้อความ OpenClaw.

- **[cloudflare-ai-gateway](/th/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Cloudflare AI Gateway ให้กับ OpenClaw.

- **[codex](/th/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. Plugin ฮาร์เนสเซิร์ฟเวอร์แอป OpenClaw Codex และผู้ให้บริการโมเดล พร้อมแค็ตตาล็อก GPT ที่จัดการโดย Codex.

- **[copilot](/th/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. ลงทะเบียนรันไทม์เอเจนต์ GitHub Copilot.

- **[deepinfra](/th/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล DeepInfra ให้กับ OpenClaw.

- **[deepseek](/th/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล DeepSeek ให้กับ OpenClaw.

- **[diagnostics-otel](/th/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. ตัวส่งออก OpenTelemetry สำหรับการวินิจฉัยของ OpenClaw สำหรับเมตริก เทรซ และล็อก.

- **[diagnostics-prometheus](/th/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. ตัวส่งออก Prometheus สำหรับการวินิจฉัยของ OpenClaw สำหรับเมตริกรันไทม์.

- **[diffs](/th/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. Plugin ดู diff แบบอ่านอย่างเดียวของ OpenClaw และตัวเรนเดอร์ไฟล์สำหรับเอเจนต์.

- **[diffs-language-pack](/th/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. เพิ่มการไฮไลต์ไวยากรณ์สำหรับภาษานอกชุดตัวดู diff เริ่มต้น.

- **[discord](/th/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. Plugin ช่องทาง Discord ของ OpenClaw สำหรับช่องทาง DM คำสั่ง และเหตุการณ์แอป.

- **[exa](/th/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. เพิ่มการรองรับผู้ให้บริการค้นหาเว็บ.

- **[feishu](/th/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. Plugin ช่องทาง Feishu/Lark ของ OpenClaw สำหรับแชตและเครื่องมือที่ทำงาน (ดูแลโดยชุมชนโดย @m1heng).

- **[firecrawl](/th/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. เพิ่มเครื่องมือที่เอเจนต์เรียกใช้ได้ เพิ่มการรองรับผู้ให้บริการดึงข้อมูลเว็บ เพิ่มการรองรับผู้ให้บริการค้นหาเว็บ.

- **[fireworks](/th/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Fireworks ให้กับ OpenClaw.

- **[gmi](/th/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. Plugin ผู้ให้บริการ OpenClaw GMI Cloud.

- **[google-meet](/th/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. Plugin ผู้เข้าร่วม Google Meet ของ OpenClaw สำหรับเข้าร่วมการโทรผ่านการขนส่ง Chrome หรือ Twilio.

- **[googlechat](/th/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. Plugin ช่องทาง Google Chat ของ OpenClaw สำหรับพื้นที่และข้อความโดยตรง.

- **[gradium](/th/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. เพิ่มการรองรับผู้ให้บริการแปลงข้อความเป็นเสียงพูด.

- **[groq](/th/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Groq ให้กับ OpenClaw.

- **[inworld](/th/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. การแปลงข้อความเป็นเสียงพูดแบบสตรีมมิงของ Inworld (MP3, OGG_OPUS, PCM telephony).

- **[irc](/th/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. เพิ่มพื้นผิวช่องทาง IRC สำหรับส่งและรับข้อความ OpenClaw.

- **[kilocode](/th/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Kilocode ให้กับ OpenClaw.

- **[kimi](/th/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Kimi, Kimi Coding ให้กับ OpenClaw.

- **[line](/th/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. Plugin ช่องทาง LINE ของ OpenClaw สำหรับแชต LINE Bot API.

- **[llama-cpp](/th/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. Embeddings GGUF ในเครื่องผ่าน node-llama-cpp.

- **[lobster](/th/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. Plugin เครื่องมือเวิร์กโฟลว์ Lobster สำหรับไปป์ไลน์แบบมีชนิดและการอนุมัติที่กลับมาทำต่อได้.

- **[matrix](/th/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. Plugin ช่องทาง Matrix ของ OpenClaw สำหรับห้องและข้อความโดยตรง.

- **[mattermost](/th/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. เพิ่มพื้นผิวช่องทาง Mattermost สำหรับส่งและรับข้อความ OpenClaw.

- **[memory-lancedb](/th/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. Plugin หน่วยความจำระยะยาวที่มี LanceDB เป็นแบ็กเอนด์ของ OpenClaw พร้อมการเรียกคืนอัตโนมัติ การบันทึกอัตโนมัติ และการค้นหาเวกเตอร์.

- **[moonshot](/th/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Moonshot ให้กับ OpenClaw.

- **[msteams](/th/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. Plugin ช่องทาง Microsoft Teams ของ OpenClaw สำหรับการสนทนากับบอต.

- **[nextcloud-talk](/th/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. Plugin ช่องทาง Nextcloud Talk ของ OpenClaw สำหรับการสนทนา.

- **[nostr](/th/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. Plugin ช่องทาง Nostr ของ OpenClaw สำหรับข้อความโดยตรงที่เข้ารหัสด้วย NIP-04.

- **[openshell](/th/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. แบ็กเอนด์แซนด์บ็อกซ์ OpenClaw สำหรับ NVIDIA OpenShell CLI พร้อมเวิร์กสเปซในเครื่องที่ทำมิเรอร์และการเรียกใช้คำสั่ง SSH.

- **[parallel](/th/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. เพิ่มการรองรับผู้ให้บริการค้นหาเว็บ.

- **[perplexity](/th/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. เพิ่มการรองรับผู้ให้บริการค้นหาเว็บ.

- **[pixverse](/th/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. Plugin ผู้ให้บริการสร้างวิดีโอ OpenClaw PixVerse.

- **[qianfan](/th/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Qianfan ให้กับ OpenClaw.

- **[qqbot](/th/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. Plugin ช่องทาง QQ Bot ของ OpenClaw สำหรับเวิร์กโฟลว์กลุ่มและข้อความโดยตรง.

- **[qwen](/th/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Oauth, Qwen Portal, Qwen CLI ให้กับ OpenClaw.

- **[raft](/th/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. Plugin ช่องทาง Raft ของ OpenClaw สำหรับบริดจ์ปลุก CLI ที่ปลอดภัย.

- **[searxng](/th/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. เพิ่มการรองรับผู้ให้บริการค้นหาเว็บ.

- **[signal](/th/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. เพิ่มพื้นผิวช่องทาง Signal สำหรับส่งและรับข้อความ OpenClaw.

- **[slack](/th/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. Plugin ช่องทาง Slack ของ OpenClaw สำหรับช่องทาง DM คำสั่ง และเหตุการณ์แอป.

- **[sms](/th/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. Plugin ช่องทาง Twilio SMS สำหรับข้อความตัวอักษร OpenClaw.

- **[stepfun](/th/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล StepFun, StepFun Plan ให้กับ OpenClaw.

- **[synology-chat](/th/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. Plugin ช่องทาง Synology Chat สำหรับช่องทาง OpenClaw และข้อความโดยตรง.

- **[tavily](/th/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. เพิ่มเครื่องมือที่เอเจนต์เรียกใช้ได้ เพิ่มการรองรับผู้ให้บริการค้นหาเว็บ.

- **[tencent](/th/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Tencent TokenHub ให้กับ OpenClaw.

- **[tlon](/th/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. Plugin ช่องทาง Tlon/Urbit ของ OpenClaw สำหรับเวิร์กโฟลว์แชต.

- **[tokenjuice](/th/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. บีบอัดผลลัพธ์เครื่องมือ exec และ bash ด้วยตัวลดขนาดของ tokenjuice.

- **[twitch](/th/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. Plugin ช่องทาง Twitch ของ OpenClaw สำหรับเวิร์กโฟลว์แชตและการม็อดเดอเรชัน.

- **[venice](/th/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Venice ให้กับ OpenClaw.

- **[vercel-ai-gateway](/th/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Vercel AI Gateway ให้กับ OpenClaw.

- **[voice-call](/th/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. Plugin voice-call ของ OpenClaw สำหรับการโทรศัพท์ผ่าน Twilio, Telnyx และ Plivo.

- **[whatsapp](/th/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. Plugin ช่องทาง WhatsApp ของ OpenClaw สำหรับแชต WhatsApp Web.

- **[zai](/th/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Z.AI ให้กับ OpenClaw.

- **[zalo](/th/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. Plugin ช่องทาง Zalo ของ OpenClaw สำหรับบอตและแชต Webhook.

- **[zalouser](/th/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. Plugin บัญชีส่วนบุคคล Zalo ของ OpenClaw ผ่านการผสานรวม zca-js แบบเนทีฟ.

## สำหรับ source checkout เท่านั้น

3 Plugin

- **[qa-channel](/th/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - สำหรับ source checkout เท่านั้น. เพิ่มพื้นผิว QA Channel สำหรับส่งและรับข้อความ OpenClaw.

- **[qa-lab](/th/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - สำหรับ source checkout เท่านั้น. Plugin แล็บ QA ของ OpenClaw พร้อม UI ดีบักเกอร์ส่วนตัวและตัวรันสถานการณ์.

- **[qa-matrix](/th/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - เฉพาะการ checkout ซอร์สเท่านั้น ตัวรันทรานสปอร์ต Matrix QA และ substrate
