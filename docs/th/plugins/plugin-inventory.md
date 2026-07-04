---
read_when:
    - คุณกำลังตัดสินใจว่า Plugin จะถูกจัดส่งในแพ็กเกจ npm หลักหรือติดตั้งแยกต่างหาก
    - คุณกำลังอัปเดตเมทาดาทาของแพ็กเกจ Plugin ที่รวมมาด้วย หรือระบบอัตโนมัติสำหรับการเผยแพร่รุ่น
    - คุณต้องใช้รายการ Plugin ภายในเทียบกับภายนอกที่เป็นมาตรฐาน
summary: สร้างรายการสินค้าคงคลังของ Plugin ของ OpenClaw ที่รวมมากับ core, เผยแพร่ภายนอก หรือเก็บไว้เฉพาะซอร์ส
title: รายการ Plugin
x-i18n:
    generated_at: "2026-07-04T04:12:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1af48e3d1ca8e994780dae2ac39dd2d3c3ed0bc8c136cbf3448fe18fadddfb0a
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# สินค้าคงคลัง Plugin

หน้านี้สร้างจาก `extensions/*/package.json`, `openclaw.plugin.json`
และการยกเว้น `files` ของแพ็กเกจ npm ราก สร้างใหม่ด้วย:

```bash
pnpm plugins:inventory:gen
```

## คำจำกัดความ

- **แพ็กเกจ npm หลัก:** รวมอยู่ในแพ็กเกจ npm `openclaw` และใช้งานได้โดยไม่ต้องติดตั้ง Plugin แยกต่างหาก
- **แพ็กเกจภายนอกอย่างเป็นทางการ:** Plugin ที่ดูแลโดย OpenClaw ซึ่งถูกละไว้จากแพ็กเกจ npm หลัก เก็บไว้ในสินค้าคงคลังอย่างเป็นทางการนี้ และติดตั้งตามต้องการผ่าน ClawHub และ/หรือ npm
- **เฉพาะซอร์สเช็กเอาต์:** Plugin ภายใน repo ที่ถูกละไว้จากอาร์ติแฟกต์ npm ที่เผยแพร่ และไม่ได้ประกาศเป็นแพ็กเกจที่ติดตั้งได้

ซอร์สเช็กเอาต์แตกต่างจากการติดตั้ง npm: หลังจาก `pnpm install` แล้ว Plugin
ที่บันเดิลมาจะโหลดจาก `extensions/<id>` เพื่อให้การแก้ไขในเครื่องและ dependency
ของ workspace ภายในแพ็กเกจพร้อมใช้งาน

## ติดตั้ง Plugin

ใช้เส้นทางการติดตั้งในแต่ละรายการเพื่อพิจารณาว่าจำเป็นต้องติดตั้งหรือไม่ Plugin
ที่ระบุว่า `included in OpenClaw` มีอยู่แล้วในแพ็กเกจหลัก
แพ็กเกจภายนอกอย่างเป็นทางการต้องติดตั้งหนึ่งครั้ง จากนั้นรีสตาร์ท Gateway

ตัวอย่างเช่น Discord เป็นแพ็กเกจภายนอกอย่างเป็นทางการ:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

ระหว่างการเปลี่ยนผ่านช่วงเปิดตัว สเป็กแพ็กเกจแบบ bare ทั่วไปยังคงติดตั้งจาก npm
ใช้ `clawhub:@openclaw/discord` หรือ `npm:@openclaw/discord` เมื่อคุณต้องการระบุแหล่งที่มา
อย่างชัดเจน หลังติดตั้ง ให้ทำตามเอกสารการตั้งค่าของ Plugin เช่น
[Discord](/th/channels/discord) เพื่อเพิ่มข้อมูลประจำตัวและการกำหนดค่าช่องทาง ดู
[จัดการ Plugin](/th/plugins/manage-plugins) สำหรับคำสั่งอัปเดต ถอนการติดตั้ง และเผยแพร่

แต่ละรายการแสดงแพ็กเกจ เส้นทางการเผยแพร่ และคำอธิบาย

## แพ็กเกจ npm หลัก

60 Plugin

- **[admin-http-rpc](/th/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - รวมอยู่ใน OpenClaw ปลายทาง HTTP RPC สำหรับผู้ดูแล OpenClaw

- **[alibaba](/th/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider สำหรับการสร้างวิดีโอ

- **[anthropic](/th/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล Anthropic ให้กับ OpenClaw

- **[azure-speech](/th/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - รวมอยู่ใน OpenClaw Azure AI Speech สำหรับแปลงข้อความเป็นเสียง (MP3, โน้ตเสียง Ogg/Opus แบบ native, PCM telephony)

- **[bonjour](/th/plugins/reference/bonjour)** (`@openclaw/bonjour`) - รวมอยู่ใน OpenClaw ประกาศ Gateway OpenClaw ภายในเครื่องผ่าน Bonjour/mDNS

- **[browser](/th/plugins/reference/browser)** (`@openclaw/browser-plugin`) - รวมอยู่ใน OpenClaw เพิ่มเครื่องมือที่ agent เรียกใช้ได้

- **[byteplus](/th/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล BytePlus, BytePlus Plan ให้กับ OpenClaw

- **[canvas](/th/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - รวมอยู่ใน OpenClaw พื้นผิวการควบคุม Canvas และการเรนเดอร์ A2UI แบบทดลองสำหรับโหนดที่จับคู่

- **[clawrouter](/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล ClawRouter ให้กับ OpenClaw

- **[codex-supervisor](/th/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - รวมอยู่ใน OpenClaw ควบคุมดูแลเซสชัน Codex app-server จาก OpenClaw

- **[cohere](/th/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - รวมอยู่ใน OpenClaw; npm; ClawHub: `clawhub:@openclaw/cohere-provider` Plugin provider Cohere สำหรับ OpenClaw

- **[comfy](/th/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล ComfyUI ให้กับ OpenClaw

- **[copilot-proxy](/th/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล Copilot Proxy ให้กับ OpenClaw

- **[deepgram](/th/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider สำหรับการทำความเข้าใจสื่อ เพิ่มการรองรับ provider สำหรับการถอดเสียงแบบเรียลไทม์

- **[document-extract](/th/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - รวมอยู่ใน OpenClaw แยกข้อความและรูปภาพหน้าสำรองจากไฟล์แนบเอกสารในเครื่อง

- **[duckduckgo](/th/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider สำหรับการค้นหาเว็บ

- **[elevenlabs](/th/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider สำหรับการทำความเข้าใจสื่อ เพิ่มการรองรับ provider สำหรับการถอดเสียงแบบเรียลไทม์ เพิ่มการรองรับ provider สำหรับแปลงข้อความเป็นเสียง

- **[fal](/th/plugins/reference/fal)** (`@openclaw/fal-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล fal ให้กับ OpenClaw

- **[file-transfer](/th/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - รวมอยู่ใน OpenClaw ดึงข้อมูล แสดงรายการ และเขียนไฟล์บนโหนดที่จับคู่ผ่านคำสั่งโหนดเฉพาะ เลี่ยงการตัดทอน stdout ของ bash โดยใช้ base64 ผ่าน node.invoke สำหรับไบนารีสูงสุด 16 MB

- **[github-copilot](/th/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล GitHub Copilot ให้กับ OpenClaw

- **[google](/th/plugins/reference/google)** (`@openclaw/google-plugin`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล Google, Google Gemini CLI, Google Vertex ให้กับ OpenClaw

- **[huggingface](/th/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล Hugging Face ให้กับ OpenClaw

- **[imessage](/th/plugins/reference/imessage)** (`@openclaw/imessage`) - รวมอยู่ใน OpenClaw เพิ่มพื้นผิวช่องทาง iMessage สำหรับส่งและรับข้อความ OpenClaw

- **[litellm](/th/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล LiteLLM ให้กับ OpenClaw

- **[llm-task](/th/plugins/reference/llm-task)** (`@openclaw/llm-task`) - รวมอยู่ใน OpenClaw เครื่องมือ LLM แบบ JSON-only ทั่วไปสำหรับงานแบบมีโครงสร้างที่เรียกใช้ได้จากเวิร์กโฟลว์

- **[lmstudio](/th/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล LM Studio ให้กับ OpenClaw

- **[memory-core](/th/plugins/reference/memory-core)** (`@openclaw/memory-core`) - รวมอยู่ใน OpenClaw เพิ่มเครื่องมือที่ agent เรียกใช้ได้

- **[memory-wiki](/th/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - รวมอยู่ใน OpenClaw คอมไพเลอร์วิกิแบบคงอยู่และคลังความรู้ที่เป็นมิตรกับ Obsidian สำหรับ OpenClaw

- **[microsoft](/th/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider สำหรับแปลงข้อความเป็นเสียง

- **[microsoft-foundry](/th/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล Microsoft Foundry ให้กับ OpenClaw

- **[migrate-claude](/th/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - รวมอยู่ใน OpenClaw นำเข้าคำสั่ง Claude Code และ Claude Desktop, เซิร์ฟเวอร์ MCP, skills และการกำหนดค่าที่ปลอดภัยเข้าสู่ OpenClaw

- **[migrate-hermes](/th/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - รวมอยู่ใน OpenClaw นำเข้าการกำหนดค่า Hermes, หน่วยความจำ, skills และข้อมูลประจำตัวที่รองรับเข้าสู่ OpenClaw

- **[minimax](/th/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล MiniMax, MiniMax Portal ให้กับ OpenClaw

- **[mistral](/th/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล Mistral ให้กับ OpenClaw

- **[novita](/th/plugins/reference/novita)** (`@openclaw/novita-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล Novita, Novita AI, Novitaai ให้กับ OpenClaw

- **[nvidia](/th/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล NVIDIA ให้กับ OpenClaw

- **[oc-path](/th/plugins/reference/oc-path)** (`@openclaw/oc-path`) - รวมอยู่ใน OpenClaw เพิ่ม CLI เส้นทาง openclaw สำหรับการอ้างอิงไฟล์ workspace แบบ oc://

- **[ollama](/th/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล Ollama, Ollama Cloud ให้กับ OpenClaw

- **[open-prose](/th/plugins/reference/open-prose)** (`@openclaw/open-prose`) - รวมอยู่ใน OpenClaw แพ็ก Skills OpenProse VM พร้อมคำสั่ง slash /prose

- **[openai](/th/plugins/reference/openai)** (`@openclaw/openai-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล OpenAI ให้กับ OpenClaw

- **[opencode](/th/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล OpenCode ให้กับ OpenClaw

- **[opencode-go](/th/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล OpenCode Go ให้กับ OpenClaw

- **[openrouter](/th/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล OpenRouter ให้กับ OpenClaw

- **[policy](/th/plugins/reference/policy)** (`@openclaw/policy`) - รวมอยู่ใน OpenClaw เพิ่มการตรวจสอบ doctor ที่มี policy รองรับสำหรับความสอดคล้องของ workspace

- **[runway](/th/plugins/reference/runway)** (`@openclaw/runway-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider สำหรับการสร้างวิดีโอ

- **[senseaudio](/th/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider สำหรับการทำความเข้าใจสื่อ

- **[sglang](/th/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล SGLang ให้กับ OpenClaw

- **[synthetic](/th/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล Synthetic ให้กับ OpenClaw

- **[telegram](/th/plugins/reference/telegram)** (`@openclaw/telegram`) - รวมอยู่ใน OpenClaw เพิ่มพื้นผิวช่องทาง Telegram สำหรับส่งและรับข้อความ OpenClaw

- **[together](/th/plugins/reference/together)** (`@openclaw/together-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล Together ให้กับ OpenClaw

- **[tts-local-cli](/th/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider สำหรับแปลงข้อความเป็นเสียง

- **[vllm](/th/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล vLLM ให้กับ OpenClaw

- **[volcengine](/th/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล Volcengine, Volcengine Plan ให้กับ OpenClaw

- **[voyage](/th/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider สำหรับ memory embedding

- **[vydra](/th/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล Vydra ให้กับ OpenClaw

- **[web-readability](/th/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - รวมอยู่ใน OpenClaw แยกเนื้อหาบทความที่อ่านได้จากการตอบกลับการดึงเว็บ HTML ในเครื่อง

- **[webhooks](/th/plugins/reference/webhooks)** (`@openclaw/webhooks`) - รวมอยู่ใน OpenClaw Webhook ขาเข้าที่ผ่านการยืนยันตัวตนซึ่งผูก automation ภายนอกเข้ากับ TaskFlow ของ OpenClaw

- **[workboard](/th/plugins/reference/workboard)** (`@openclaw/workboard`) - รวมอยู่ใน OpenClaw workboard แบบแดชบอร์ดสำหรับ issue และเซสชันที่ agent เป็นเจ้าของ

- **[xai](/th/plugins/reference/xai)** (`@openclaw/xai-plugin`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล xAI ให้กับ OpenClaw

- **[xiaomi](/th/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับ provider โมเดล Xiaomi, Xiaomi Token Plan ให้กับ OpenClaw

## แพ็กเกจภายนอกอย่างเป็นทางการ

68 Plugin

- **[acpx](/th/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub แบ็กเอนด์ runtime ACP ของ OpenClaw พร้อมการจัดการเซสชันและการขนส่งที่ Plugin เป็นเจ้าของ

- **[amazon-bedrock](/th/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub Plugin provider Amazon Bedrock สำหรับ OpenClaw พร้อมการค้นหาโมเดล embeddings และการรองรับ guardrail

- **[amazon-bedrock-mantle](/th/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. Plugin ผู้ให้บริการ OpenClaw Amazon Bedrock Mantle สำหรับการกำหนดเส้นทางโมเดลที่เข้ากันได้กับ OpenAI

- **[anthropic-vertex](/th/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. Plugin ผู้ให้บริการ OpenClaw Anthropic Vertex สำหรับโมเดล Claude บน Google Vertex AI

- **[arcee](/th/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Arcee ให้กับ OpenClaw

- **[brave](/th/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. Plugin ผู้ให้บริการ OpenClaw Brave Search สำหรับการค้นหาเว็บ

- **[cerebras](/th/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Cerebras ให้กับ OpenClaw

- **[chutes](/th/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Chutes ให้กับ OpenClaw

- **[clickclack](/th/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. เพิ่มพื้นผิวช่องทาง Clickclack สำหรับส่งและรับข้อความ OpenClaw

- **[cloudflare-ai-gateway](/th/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Cloudflare AI Gateway ให้กับ OpenClaw

- **[codex](/th/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. Plugin ฮาร์เนสเซิร์ฟเวอร์แอป OpenClaw Codex และผู้ให้บริการโมเดลพร้อมแค็ตตาล็อก GPT ที่ Codex จัดการ

- **[copilot](/th/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. ลงทะเบียนรันไทม์เอเจนต์ GitHub Copilot

- **[deepinfra](/th/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล DeepInfra ให้กับ OpenClaw

- **[deepseek](/th/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล DeepSeek ให้กับ OpenClaw

- **[diagnostics-otel](/th/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. ตัวส่งออก OpenTelemetry ด้านการวินิจฉัยของ OpenClaw สำหรับเมตริก เทรซ และล็อก

- **[diagnostics-prometheus](/th/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. ตัวส่งออก Prometheus ด้านการวินิจฉัยของ OpenClaw สำหรับเมตริกรันไทม์

- **[diffs](/th/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. Plugin ตัวดู diff แบบอ่านอย่างเดียวของ OpenClaw และตัวเรนเดอร์ไฟล์สำหรับเอเจนต์

- **[diffs-language-pack](/th/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. เพิ่มการเน้นไวยากรณ์สำหรับภาษาที่อยู่นอกชุดตัวดู diffs เริ่มต้น

- **[discord](/th/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. Plugin ช่องทาง OpenClaw Discord สำหรับช่องทาง, DM, คำสั่ง และเหตุการณ์แอป

- **[exa](/th/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. เพิ่มการรองรับผู้ให้บริการค้นหาเว็บ

- **[feishu](/th/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. Plugin ช่องทาง OpenClaw Feishu/Lark สำหรับแชตและเครื่องมือในที่ทำงาน (ดูแลโดยชุมชนโดย @m1heng)

- **[firecrawl](/th/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. เพิ่มเครื่องมือที่เอเจนต์เรียกใช้ได้ เพิ่มการรองรับผู้ให้บริการดึงข้อมูลเว็บ เพิ่มการรองรับผู้ให้บริการค้นหาเว็บ

- **[fireworks](/th/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Fireworks ให้กับ OpenClaw

- **[gmi](/th/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. Plugin ผู้ให้บริการ OpenClaw GMI Cloud

- **[google-meet](/th/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. Plugin ผู้เข้าร่วม OpenClaw Google Meet สำหรับเข้าร่วมสายผ่านทรานสปอร์ต Chrome หรือ Twilio

- **[googlechat](/th/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. Plugin ช่องทาง OpenClaw Google Chat สำหรับพื้นที่และข้อความโดยตรง

- **[gradium](/th/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. เพิ่มการรองรับผู้ให้บริการแปลงข้อความเป็นเสียงพูด

- **[groq](/th/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Groq ให้กับ OpenClaw

- **[inworld](/th/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. การแปลงข้อความเป็นเสียงพูดแบบสตรีมมิงของ Inworld (MP3, OGG_OPUS, PCM telephony)

- **[irc](/th/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. เพิ่มพื้นผิวช่องทาง IRC สำหรับส่งและรับข้อความ OpenClaw

- **[kilocode](/th/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Kilocode ให้กับ OpenClaw

- **[kimi](/th/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Kimi, Kimi Coding ให้กับ OpenClaw

- **[line](/th/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. Plugin ช่องทาง OpenClaw LINE สำหรับแชต LINE Bot API

- **[llama-cpp](/th/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. เอ็มเบดดิง GGUF ภายในเครื่องผ่าน node-llama-cpp

- **[lobster](/th/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. Plugin เครื่องมือเวิร์กโฟลว์ Lobster สำหรับไปป์ไลน์แบบมีชนิดและการอนุมัติที่ดำเนินต่อได้

- **[matrix](/th/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. Plugin ช่องทาง OpenClaw Matrix สำหรับห้องและข้อความโดยตรง

- **[mattermost](/th/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. เพิ่มพื้นผิวช่องทาง Mattermost สำหรับส่งและรับข้อความ OpenClaw

- **[memory-lancedb](/th/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. Plugin หน่วยความจำระยะยาวของ OpenClaw ที่หนุนด้วย LanceDB พร้อมการเรียกคืนอัตโนมัติ การบันทึกอัตโนมัติ และการค้นหาเวกเตอร์

- **[moonshot](/th/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Moonshot ให้กับ OpenClaw

- **[msteams](/th/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. Plugin ช่องทาง OpenClaw Microsoft Teams สำหรับการสนทนาของบอต

- **[nextcloud-talk](/th/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. Plugin ช่องทาง OpenClaw Nextcloud Talk สำหรับการสนทนา

- **[nostr](/th/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. Plugin ช่องทาง OpenClaw Nostr สำหรับข้อความโดยตรงที่เข้ารหัส NIP-04

- **[openshell](/th/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. แบ็กเอนด์แซนด์บ็อกซ์ OpenClaw สำหรับ NVIDIA OpenShell CLI พร้อมเวิร์กสเปซภายในเครื่องแบบมิเรอร์และการดำเนินการคำสั่ง SSH

- **[parallel](/th/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. เพิ่มการรองรับผู้ให้บริการค้นหาเว็บ

- **[perplexity](/th/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. เพิ่มการรองรับผู้ให้บริการค้นหาเว็บ

- **[pixverse](/th/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. Plugin ผู้ให้บริการสร้างวิดีโอ OpenClaw PixVerse

- **[qianfan](/th/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Qianfan ให้กับ OpenClaw

- **[qqbot](/th/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. Plugin ช่องทาง OpenClaw QQ Bot สำหรับเวิร์กโฟลว์แบบกลุ่มและข้อความโดยตรง

- **[qwen](/th/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Oauth, Qwen Portal, Qwen CLI ให้กับ OpenClaw

- **[raft](/th/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. Plugin ช่องทาง OpenClaw Raft สำหรับสะพานปลุก CLI ที่ปลอดภัย

- **[searxng](/th/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. เพิ่มการรองรับผู้ให้บริการค้นหาเว็บ

- **[signal](/th/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. เพิ่มพื้นผิวช่องทาง Signal สำหรับส่งและรับข้อความ OpenClaw

- **[slack](/th/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. Plugin ช่องทาง OpenClaw Slack สำหรับช่องทาง, DM, คำสั่ง และเหตุการณ์แอป

- **[sms](/th/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. Plugin ช่องทาง Twilio SMS สำหรับข้อความข้อความของ OpenClaw

- **[stepfun](/th/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล StepFun, StepFun Plan ให้กับ OpenClaw

- **[synology-chat](/th/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. Plugin ช่องทาง Synology Chat สำหรับช่องทาง OpenClaw และข้อความโดยตรง

- **[tavily](/th/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. เพิ่มเครื่องมือที่เอเจนต์เรียกใช้ได้ เพิ่มการรองรับผู้ให้บริการค้นหาเว็บ

- **[tencent](/th/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Tencent TokenHub ให้กับ OpenClaw

- **[tlon](/th/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. Plugin ช่องทาง OpenClaw Tlon/Urbit สำหรับเวิร์กโฟลว์แชต

- **[tokenjuice](/th/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. กระชับผลลัพธ์เครื่องมือ exec และ bash ด้วยตัวลดของ tokenjuice

- **[twitch](/th/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. Plugin ช่องทาง OpenClaw Twitch สำหรับเวิร์กโฟลว์แชตและการดูแล

- **[venice](/th/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Venice ให้กับ OpenClaw

- **[vercel-ai-gateway](/th/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Vercel AI Gateway ให้กับ OpenClaw

- **[voice-call](/th/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. Plugin voice-call ของ OpenClaw สำหรับสายโทรศัพท์ Twilio, Telnyx และ Plivo

- **[whatsapp](/th/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. Plugin ช่องทาง OpenClaw WhatsApp สำหรับแชต WhatsApp Web

- **[zai](/th/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Z.AI ให้กับ OpenClaw

- **[zalo](/th/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. Plugin ช่องทาง OpenClaw Zalo สำหรับแชตบอตและ Webhook

- **[zalouser](/th/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. Plugin บัญชีส่วนตัว OpenClaw Zalo ผ่านการผสานรวม zca-js แบบเนทีฟ

## เฉพาะซอร์สเช็กเอาต์เท่านั้น

3 Plugin

- **[qa-channel](/th/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - เฉพาะซอร์สเช็กเอาต์เท่านั้น เพิ่มพื้นผิว QA Channel สำหรับส่งและรับข้อความ OpenClaw

- **[qa-lab](/th/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - เฉพาะซอร์สเช็กเอาต์เท่านั้น Plugin ห้องปฏิบัติการ QA ของ OpenClaw พร้อม UI ดีบักเกอร์ส่วนตัวและตัวรันสถานการณ์

- **[qa-matrix](/th/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - เฉพาะสำเนาซอร์สที่เช็กเอาต์มาเท่านั้น ตัวรันทรานสปอร์ต Matrix QA และชั้นฐาน.
