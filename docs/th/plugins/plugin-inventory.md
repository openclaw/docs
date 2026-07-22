---
read_when:
    - คุณกำลังตัดสินใจว่า Plugin จะรวมอยู่ในแพ็กเกจ npm หลักหรือติดตั้งแยกต่างหาก
    - คุณกำลังอัปเดตข้อมูลเมตาของแพ็กเกจ Plugin ที่มาพร้อมระบบ หรือระบบอัตโนมัติสำหรับการเผยแพร่รุ่น
    - คุณต้องมีรายการ Plugin ภายในและภายนอกที่เป็นมาตรฐานอ้างอิง
summary: รายการ Plugin ของ OpenClaw ที่สร้างขึ้นโดยอัตโนมัติ ซึ่งจัดส่งใน core เผยแพร่ภายนอก หรือเก็บไว้เฉพาะซอร์สโค้ด
title: รายการ Plugin
x-i18n:
    generated_at: "2026-07-22T03:35:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2d835087afbe9d75f883c3db9739f914bedab5ac87a9c20b69c248304b61c594
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# รายการ Plugin

หน้านี้สร้างขึ้นจาก `extensions/*/package.json`, `openclaw.plugin.json`
และรายการยกเว้นของแพ็กเกจ npm หลัก `files` สร้างใหม่ด้วย:

```bash
pnpm plugins:inventory:gen
```

## คำจำกัดความ

- **แพ็กเกจ npm หลัก:** รวมอยู่ในแพ็กเกจ npm `openclaw` และใช้งานได้โดยไม่ต้องติดตั้ง Plugin แยกต่างหาก
- **แพ็กเกจภายนอกอย่างเป็นทางการ:** Plugin ที่ดูแลโดย OpenClaw ซึ่งไม่รวมอยู่ในแพ็กเกจ npm หลัก แต่ยังคงอยู่ในรายการอย่างเป็นทางการนี้ และติดตั้งเมื่อต้องการผ่าน ClawHub และ/หรือ npm
- **เฉพาะซอร์สเช็กเอาต์:** Plugin ภายในรีโพซิทอรีซึ่งไม่รวมอยู่ในอาร์ติแฟกต์ npm ที่เผยแพร่ และไม่มีการประชาสัมพันธ์ว่าเป็นแพ็กเกจที่ติดตั้งได้

ซอร์สเช็กเอาต์แตกต่างจากการติดตั้ง npm: หลังจาก `pnpm install` แล้ว Plugin
ที่รวมมาให้จะโหลดจาก `extensions/<id>` เพื่อให้ใช้การแก้ไขในเครื่องและการพึ่งพา
เวิร์กสเปซภายในแพ็กเกจได้

## ติดตั้ง Plugin

ใช้ช่องทางการติดตั้งในแต่ละรายการเพื่อตัดสินใจว่าจำเป็นต้องติดตั้งหรือไม่ Plugin
ที่ระบุว่า `included in OpenClaw` มีอยู่ในแพ็กเกจหลักแล้ว
แพ็กเกจภายนอกอย่างเป็นทางการต้องติดตั้งหนึ่งครั้ง แล้วรีสตาร์ต Gateway

ตัวอย่างเช่น Discord เป็นแพ็กเกจภายนอกอย่างเป็นทางการ:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

ระหว่างการเปลี่ยนผ่านช่วงเปิดตัว ข้อกำหนดแพ็กเกจแบบเปล่าทั่วไปยังคงติดตั้งจาก npm
ใช้ `clawhub:@openclaw/discord` หรือ `npm:@openclaw/discord` เมื่อต้องการ
ระบุแหล่งที่มาอย่างชัดเจน หลังจากติดตั้งแล้ว ให้ทำตามเอกสารการตั้งค่าของ Plugin เช่น
[Discord](/th/channels/discord) เพื่อเพิ่มข้อมูลประจำตัวและการกำหนดค่าช่องทาง ดูคำสั่ง
สำหรับการอัปเดต ถอนการติดตั้ง และเผยแพร่ได้ที่
[จัดการ Plugin](/th/plugins/manage-plugins)

แต่ละรายการระบุแพ็กเกจ ช่องทางการเผยแพร่ และคำอธิบาย

## แพ็กเกจ npm หลัก

70 Plugin

- **[admin-http-rpc](/th/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - รวมอยู่ใน OpenClaw จุดเชื่อมต่อ HTTP RPC สำหรับผู้ดูแลระบบ OpenClaw

- **[alibaba](/th/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการสร้างวิดีโอ

- **[anthropic](/th/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - รวมอยู่ใน OpenClaw โมเดล Anthropic, Claude CLI และแค็ตตาล็อกเซสชัน Claude แบบเนทีฟ

- **[azure-speech](/th/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - รวมอยู่ใน OpenClaw การแปลงข้อความเป็นเสียงพูดด้วย Azure AI Speech (MP3, ข้อความเสียง Ogg/Opus แบบเนทีฟ, โทรศัพท์ PCM)

- **[bonjour](/th/plugins/reference/bonjour)** (`@openclaw/bonjour`) - รวมอยู่ใน OpenClaw ประกาศ Gateway ของ OpenClaw ในเครื่องผ่าน Bonjour/mDNS

- **[browser](/th/plugins/reference/browser)** (`@openclaw/browser-plugin`) - รวมอยู่ใน OpenClaw เพิ่มเครื่องมือที่เอเจนต์เรียกใช้ได้

- **[byteplus](/th/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล BytePlus และ BytePlus Plan ให้กับ OpenClaw

- **[canvas](/th/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - รวมอยู่ใน OpenClaw พื้นผิวทดลองสำหรับควบคุม Canvas และเรนเดอร์ A2UI บน Node ที่จับคู่ไว้

- **[clawrouter](/th/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล ClawRouter ให้กับ OpenClaw

- **[cohere](/th/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - รวมอยู่ใน OpenClaw; npm; ClawHub: `clawhub:@openclaw/cohere-provider` Plugin ผู้ให้บริการ Cohere สำหรับ OpenClaw

- **[comfy](/th/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล ComfyUI ให้กับ OpenClaw

- **[copilot-proxy](/th/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Copilot Proxy ให้กับ OpenClaw

- **[crabbox](/th/plugins/reference/crabbox)** (`@openclaw/crabbox-provider`) - รวมอยู่ใน OpenClaw ผู้ให้บริการเวิร์กเกอร์บนคลาวด์ที่ขับเคลื่อนด้วย Crabbox CLI

- **[cua-computer](/plugins/reference/cua-computer)** (`@openclaw/cua-computer`) - รวมอยู่ใน OpenClaw การควบคุมคอมพิวเตอร์ด้วย cua-driver แบบทดลองสำหรับโฮสต์ Node บน Windows และ Linux

- **[deepgram](/th/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการทำความเข้าใจสื่อ เพิ่มการรองรับผู้ให้บริการถอดเสียงแบบเรียลไทม์

- **[document-extract](/th/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - รวมอยู่ใน OpenClaw แยกข้อความและรูปภาพหน้าสำรองจากไฟล์แนบเอกสารในเครื่อง

- **[duckduckgo](/th/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการค้นหาเว็บ

- **[elevenlabs](/th/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการทำความเข้าใจสื่อ เพิ่มการรองรับผู้ให้บริการถอดเสียงแบบเรียลไทม์ เพิ่มการรองรับผู้ให้บริการแปลงข้อความเป็นเสียงพูด

- **[fal](/th/plugins/reference/fal)** (`@openclaw/fal-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล fal ให้กับ OpenClaw

- **[file-transfer](/th/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - รวมอยู่ใน OpenClaw ดึงข้อมูล แสดงรายการ และเขียนไฟล์บน Node ที่จับคู่ไว้ผ่านคำสั่งเฉพาะของ Node หลีกเลี่ยงการตัดทอน stdout ของ bash โดยใช้ base64 ผ่าน node.invoke สำหรับไฟล์ไบนารีขนาดสูงสุด 16 MB

- **[github-copilot](/th/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล GitHub Copilot ให้กับ OpenClaw

- **[google](/th/plugins/reference/google)** (`@openclaw/google-plugin`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Google, Google Gemini CLI และ Google Vertex ให้กับ OpenClaw

- **[huggingface](/th/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Hugging Face ให้กับ OpenClaw

- **[imessage](/th/plugins/reference/imessage)** (`@openclaw/imessage`) - รวมอยู่ใน OpenClaw เพิ่มพื้นผิวช่องทาง iMessage สำหรับส่งและรับข้อความ OpenClaw

- **[linux-canvas](/th/plugins/reference/linux-canvas)** (`@openclaw/linux-canvas`) - รวมอยู่ใน OpenClaw บริดจ์การเรนเดอร์ Canvas สำหรับแอปเดสก์ท็อป OpenClaw บน Linux

- **[linux-node](/th/plugins/reference/linux-node)** (`@openclaw/linux-node`) - รวมอยู่ใน OpenClaw การแจ้งเตือนบนเดสก์ท็อป การจับภาพจากกล้อง และตำแหน่งที่ตั้งสำหรับโฮสต์ Node บน Linux

- **[litellm](/th/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล LiteLLM ให้กับ OpenClaw

- **[llm-task](/th/plugins/reference/llm-task)** (`@openclaw/llm-task`) - รวมอยู่ใน OpenClaw เครื่องมือ LLM ทั่วไปที่ใช้เฉพาะ JSON สำหรับงานที่มีโครงสร้างและเรียกใช้ได้จากเวิร์กโฟลว์

- **[lmstudio](/th/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล LM Studio ให้กับ OpenClaw

- **[logbook](/th/plugins/reference/logbook)** (`@openclaw/logbook`) - รวมอยู่ใน OpenClaw สมุดบันทึกงานอัตโนมัติ: จับภาพหน้าจอเป็นระยะจาก Node ที่จับคู่ไว้ และแปลงเป็นไทม์ไลน์ประจำวันซึ่งตรวจทานได้

- **[memory-core](/th/plugins/reference/memory-core)** (`@openclaw/memory-core`) - รวมอยู่ใน OpenClaw เพิ่มเครื่องมือที่เอเจนต์เรียกใช้ได้

- **[memory-wiki](/th/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - รวมอยู่ใน OpenClaw คอมไพเลอร์วิกิแบบถาวรและคลังความรู้ที่เป็นมิตรกับ Obsidian สำหรับ OpenClaw

- **[meta](/th/plugins/reference/meta)** (`@openclaw/meta-provider`) - รวมอยู่ใน OpenClaw; npm; ClawHub: `clawhub:@openclaw/meta-provider` เพิ่มการรองรับผู้ให้บริการโมเดล Meta ให้กับ OpenClaw

- **[microsoft](/th/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการแปลงข้อความเป็นเสียงพูด

- **[microsoft-foundry](/th/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Microsoft Foundry ให้กับ OpenClaw

- **[migrate-claude](/th/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - รวมอยู่ใน OpenClaw นำเข้าคำสั่ง Claude Code และ Claude Desktop, เซิร์ฟเวอร์ MCP, ทักษะ และการกำหนดค่าที่ปลอดภัยเข้าสู่ OpenClaw

- **[migrate-hermes](/th/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - รวมอยู่ใน OpenClaw นำเข้าการกำหนดค่า หน่วยความจำ ทักษะ และข้อมูลประจำตัวที่รองรับของ Hermes เข้าสู่ OpenClaw

- **[minimax](/th/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล MiniMax และ MiniMax Portal ให้กับ OpenClaw

- **[mistral](/th/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Mistral ให้กับ OpenClaw

- **[novita](/th/plugins/reference/novita)** (`@openclaw/novita-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Novita, Novita AI และ Novitaai ให้กับ OpenClaw

- **[nvidia](/th/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล NVIDIA ให้กับ OpenClaw

- **[oc-path](/th/plugins/reference/oc-path)** (`@openclaw/oc-path`) - รวมอยู่ใน OpenClaw เพิ่ม CLI พาธ openclaw สำหรับระบุที่อยู่ไฟล์ในเวิร์กสเปซด้วย oc://

- **[ollama](/th/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Ollama และ Ollama Cloud ให้กับ OpenClaw

- **[onepassword](/th/plugins/reference/onepassword)** (`@openclaw/onepassword`) - รวมอยู่ใน OpenClaw โบรกเกอร์ข้อมูลลับ 1Password ที่คัดสรรแล้ว พร้อมนโยบายการอนุมัติและประวัติการตรวจสอบใน SQLite

- **[open-prose](/th/plugins/reference/open-prose)** (`@openclaw/open-prose`) - รวมอยู่ใน OpenClaw ชุดทักษะ OpenProse VM พร้อมคำสั่งแบบสแลช /prose

- **[openai](/th/plugins/reference/openai)** (`@openclaw/openai-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล OpenAI ให้กับ OpenClaw

- **[opencode](/th/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล OpenCode ให้กับ OpenClaw

- **[opencode-go](/th/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล OpenCode Go ให้กับ OpenClaw

- **[openrouter](/th/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล OpenRouter ให้กับ OpenClaw

- **[policy](/th/plugins/reference/policy)** (`@openclaw/policy`) - รวมอยู่ใน OpenClaw เพิ่มการตรวจสอบ doctor ที่อิงตามนโยบายสำหรับความสอดคล้องของเวิร์กสเปซ

- **[reef](/th/plugins/reference/reef)** (`@openclaw/reef`) - รวมอยู่ใน OpenClaw ช่องทาง claw ที่เข้ารหัสจากต้นทางถึงปลายทางและมีการป้องกัน

- **[runway](/th/plugins/reference/runway)** (`@openclaw/runway-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการสร้างวิดีโอ

- **[senseaudio](/th/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการทำความเข้าใจสื่อ

- **[sglang](/th/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล SGLang ให้กับ OpenClaw

- **[synthetic](/th/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Synthetic ให้กับ OpenClaw

- **[teams-meetings](/th/plugins/reference/teams-meetings)** (`@openclaw/teams-meetings`) - รวมอยู่ใน OpenClaw เข้าร่วมการประชุม Microsoft Teams ในฐานะผู้เยี่ยมชมผ่านเบราว์เซอร์ Chrome

- **[telegram](/th/plugins/reference/telegram)** (`@openclaw/telegram`) - รวมอยู่ใน OpenClaw เพิ่มพื้นผิวช่องทาง Telegram สำหรับส่งและรับข้อความ OpenClaw

- **[together](/th/plugins/reference/together)** (`@openclaw/together-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Together ให้กับ OpenClaw

- **[tts-local-cli](/th/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการแปลงข้อความเป็นเสียงพูด

- **[vault](/th/plugins/reference/vault)** (`@openclaw/vault`) - รวมอยู่ใน OpenClaw การผสานรวมผู้ให้บริการ SecretRef สำหรับ HashiCorp Vault

- **[vllm](/th/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล vLLM ให้กับ OpenClaw

- **[volcengine](/th/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Volcengine และ Volcengine Plan ให้กับ OpenClaw

- **[voyage](/th/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการ embedding สำหรับหน่วยความจำ

- **[vydra](/th/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Vydra ให้กับ OpenClaw

- **[web-readability](/th/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - รวมอยู่ใน OpenClaw แยกเนื้อหาบทความที่อ่านได้จากการตอบกลับการดึงเว็บ HTML ภายในเครื่อง

- **[webhooks](/th/plugins/reference/webhooks)** (`@openclaw/webhooks`) - รวมอยู่ใน OpenClaw Webhook ขาเข้าที่ผ่านการยืนยันตัวตน ซึ่งเชื่อมระบบอัตโนมัติภายนอกเข้ากับ TaskFlow ของ OpenClaw

- **[workboard](/th/plugins/reference/workboard)** (`@openclaw/workboard`) - รวมอยู่ใน OpenClaw กระดานงานบนแดชบอร์ดสำหรับปัญหาและเซสชันที่เอเจนต์เป็นเจ้าของ

- **[xai](/th/plugins/reference/xai)** (`@openclaw/xai-plugin`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล xAI ให้กับ OpenClaw

- **[xiaomi](/th/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - รวมอยู่ใน OpenClaw เพิ่มการรองรับผู้ให้บริการโมเดล Xiaomi และ Xiaomi Token Plan ให้กับ OpenClaw

- **[zoom-meetings](/th/plugins/reference/zoom-meetings)** (`@openclaw/zoom-meetings`) - รวมอยู่ใน OpenClaw เข้าร่วมการประชุม Zoom ในฐานะผู้เข้าร่วมผ่านเบราว์เซอร์ Chrome

## แพ็กเกจภายนอกอย่างเป็นทางการ

72 Plugin

- **[acpx](/th/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub แบ็กเอนด์รันไทม์ ACP ของ OpenClaw พร้อมการจัดการเซสชันและการรับส่งข้อมูลที่ Plugin เป็นเจ้าของ

- **[amazon-bedrock](/th/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub Plugin ผู้ให้บริการ Amazon Bedrock สำหรับ OpenClaw พร้อมการค้นหาโมเดล, embedding และการรองรับ guardrail

- **[amazon-bedrock-mantle](/th/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub Plugin ผู้ให้บริการ Amazon Bedrock Mantle สำหรับ OpenClaw เพื่อกำหนดเส้นทางโมเดลที่เข้ากันได้กับ OpenAI

- **[anthropic-vertex](/th/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub Plugin ผู้ให้บริการ Anthropic Vertex สำหรับ OpenClaw เพื่อใช้งานโมเดล Claude บน Google Vertex AI

- **[arcee](/th/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider` เพิ่มการรองรับผู้ให้บริการโมเดล Arcee ให้กับ OpenClaw

- **[baseten](/th/plugins/reference/baseten)** (`@openclaw/baseten-provider`) - npm; ClawHub: `clawhub:@openclaw/baseten-provider` Plugin ผู้ให้บริการ Baseten สำหรับ OpenClaw

- **[brave](/th/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub Plugin ผู้ให้บริการ Brave Search สำหรับ OpenClaw เพื่อการค้นหาเว็บ

- **[cerebras](/th/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider` เพิ่มการรองรับผู้ให้บริการโมเดล Cerebras ให้กับ OpenClaw

- **[chutes](/th/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider` เพิ่มการรองรับผู้ให้บริการโมเดล Chutes ให้กับ OpenClaw

- **[clickclack](/th/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack` เพิ่มช่องทาง Clickclack สำหรับส่งและรับข้อความ OpenClaw

- **[cloudflare-ai-gateway](/th/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider` เพิ่มการรองรับผู้ให้บริการโมเดล Cloudflare AI Gateway ให้กับ OpenClaw

- **[codex](/th/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub ชุดควบคุม app-server ของ Codex และแค็ตตาล็อกเซสชันแบบเนทีฟ

- **[copilot](/th/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot` ลงทะเบียนรันไทม์เอเจนต์ GitHub Copilot

- **[deepinfra](/th/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider` เพิ่มการรองรับผู้ให้บริการโมเดล DeepInfra ให้กับ OpenClaw

- **[deepseek](/th/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider` เพิ่มการรองรับผู้ให้บริการโมเดล DeepSeek ให้กับ OpenClaw

- **[diagnostics-otel](/th/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel` ตัวส่งออกการวินิจฉัย OpenTelemetry ของ OpenClaw สำหรับเมตริก เทรซ และบันทึก

- **[diagnostics-prometheus](/th/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus` ตัวส่งออกการวินิจฉัย Prometheus ของ OpenClaw สำหรับเมตริกรันไทม์

- **[diffs](/th/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub Plugin ดูความแตกต่างแบบอ่านอย่างเดียวและตัวเรนเดอร์ไฟล์สำหรับเอเจนต์ของ OpenClaw

- **[diffs-language-pack](/th/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack` เพิ่มการเน้นไวยากรณ์สำหรับภาษาที่ไม่อยู่ในชุดเริ่มต้นของโปรแกรมดูความแตกต่าง

- **[discord](/th/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub Plugin ช่องทาง Discord ของ OpenClaw สำหรับช่องทาง ข้อความส่วนตัว คำสั่ง และเหตุการณ์ของแอป

- **[exa](/th/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin` เพิ่มการรองรับผู้ให้บริการค้นหาเว็บ

- **[featherless](/th/plugins/reference/featherless)** (`@openclaw/featherless-provider`) - npm; ClawHub: `clawhub:@openclaw/featherless-provider` Plugin ผู้ให้บริการ Featherless AI สำหรับ OpenClaw

- **[feishu](/th/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub Plugin ช่องทาง Feishu/Lark ของ OpenClaw สำหรับแชตและเครื่องมือในที่ทำงาน (ดูแลโดยชุมชนโดย @m1heng)

- **[firecrawl](/th/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin` เพิ่มเครื่องมือที่เอเจนต์เรียกใช้ได้ เพิ่มการรองรับผู้ให้บริการดึงข้อมูลเว็บ เพิ่มการรองรับผู้ให้บริการค้นหาเว็บ

- **[fireworks](/th/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider` เพิ่มการรองรับผู้ให้บริการโมเดล Fireworks ให้กับ OpenClaw

- **[gmi](/th/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider` Plugin ผู้ให้บริการ GMI Cloud สำหรับ OpenClaw

- **[google-meet](/th/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub Plugin ผู้เข้าร่วม Google Meet ของ OpenClaw สำหรับเข้าร่วมการโทรผ่านการรับส่งข้อมูลของ Chrome หรือ Twilio

- **[googlechat](/th/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub Plugin ช่องทาง Google Chat ของ OpenClaw สำหรับพื้นที่และข้อความโดยตรง

- **[gradium](/th/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech` เพิ่มการรองรับผู้ให้บริการแปลงข้อความเป็นเสียงพูด

- **[groq](/th/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider` เพิ่มการรองรับผู้ให้บริการโมเดล Groq ให้กับ OpenClaw

- **[inworld](/th/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech` การสตรีมแปลงข้อความเป็นเสียงพูดของ Inworld (MP3, OGG_OPUS, PCM สำหรับโทรศัพท์)

- **[irc](/th/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc` เพิ่มช่องทาง IRC สำหรับส่งและรับข้อความ OpenClaw

- **[kilocode](/th/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider` เพิ่มการรองรับผู้ให้บริการโมเดล Kilocode ให้กับ OpenClaw

- **[kimi](/th/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider` เพิ่มการรองรับผู้ให้บริการโมเดล Kimi และ Kimi Coding ให้กับ OpenClaw

- **[line](/th/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub Plugin ช่องทาง LINE ของ OpenClaw สำหรับแชตผ่าน LINE Bot API

- **[llama-cpp](/th/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub การอนุมานข้อความและ embedding จาก GGUF ภายในเครื่องผ่าน node-llama-cpp

- **[lobster](/th/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub Plugin เครื่องมือเวิร์กโฟลว์ Lobster สำหรับไปป์ไลน์ที่กำหนดชนิดข้อมูลและการอนุมัติที่ดำเนินการต่อได้

- **[longcat](/th/plugins/reference/longcat)** (`@openclaw/longcat-provider`) - npm; ClawHub: `clawhub:@openclaw/longcat-provider` Plugin ผู้ให้บริการ LongCat สำหรับ OpenClaw

- **[matrix](/th/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm Plugin ช่องทาง Matrix ของ OpenClaw สำหรับห้องและข้อความโดยตรง

- **[mattermost](/th/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost` เพิ่มช่องทาง Mattermost สำหรับส่งและรับข้อความ OpenClaw

- **[memory-lancedb](/th/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub Plugin หน่วยความจำระยะยาวของ OpenClaw ที่ใช้ LanceDB พร้อมการเรียกคืนอัตโนมัติ การบันทึกอัตโนมัติ และการค้นหาเวกเตอร์

- **[moonshot](/th/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider` เพิ่มการรองรับผู้ให้บริการโมเดล Moonshot ให้กับ OpenClaw

- **[msteams](/th/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub Plugin ช่องทาง Microsoft Teams ของ OpenClaw สำหรับการสนทนากับบอต

- **[mxc](/th/plugins/reference/mxc)** (`@openclaw/mxc-sandbox`) - npm; ClawHub การเรียกใช้เครื่องมือในแซนด์บ็อกซ์ระดับระบบปฏิบัติการผ่าน MXC โดยเรียกใช้คำสั่งใน Windows ProcessContainer ตามไฟล์นโยบาย MXC ที่กำหนดค่าไว้

- **[nextcloud-talk](/th/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub Plugin ช่องทาง Nextcloud Talk ของ OpenClaw สำหรับการสนทนา

- **[nostr](/th/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub Plugin ช่องทาง Nostr ของ OpenClaw สำหรับข้อความโดยตรงที่เข้ารหัสด้วย NIP-04

- **[openshell](/th/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub แบ็กเอนด์แซนด์บ็อกซ์ของ OpenClaw สำหรับ NVIDIA OpenShell CLI พร้อมพื้นที่ทำงานภายในเครื่องแบบมิเรอร์และการเรียกใช้คำสั่งผ่าน SSH

- **[parallel](/th/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin` เพิ่มการรองรับผู้ให้บริการค้นหาเว็บ

- **[perplexity](/th/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin` เพิ่มการรองรับผู้ให้บริการค้นหาเว็บ

- **[pixverse](/th/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider` Plugin ผู้ให้บริการสร้างวิดีโอ PixVerse สำหรับ OpenClaw

- **[qianfan](/th/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider` เพิ่มการรองรับผู้ให้บริการโมเดล Qianfan ให้กับ OpenClaw

- **[qqbot](/th/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub Plugin ช่องทาง QQ Bot ของ OpenClaw สำหรับเวิร์กโฟลว์แบบกลุ่มและข้อความโดยตรง

- **[qwen](/th/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider` เพิ่มการรองรับผู้ให้บริการโมเดล Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Token Plan และ Bailian Token Plan ให้กับ OpenClaw

- **[raft](/th/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub Plugin ช่องทาง Raft ของ OpenClaw สำหรับบริดจ์ปลุก CLI ที่ปลอดภัย

- **[searxng](/th/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin` เพิ่มการรองรับผู้ให้บริการค้นหาเว็บ

- **[signal](/th/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal` เพิ่มช่องทาง Signal สำหรับส่งและรับข้อความ OpenClaw

- **[slack](/th/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub Plugin ช่องทาง Slack ของ OpenClaw สำหรับช่องทาง ข้อความส่วนตัว คำสั่ง และเหตุการณ์ของแอป

- **[sms](/th/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. Plugin ช่องทาง SMS ของ Twilio สำหรับข้อความตัวอักษรของ OpenClaw

- **[stepfun](/th/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล StepFun และ StepFun Plan ให้กับ OpenClaw

- **[synology-chat](/th/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. Plugin ช่องทาง Synology Chat สำหรับช่องทางและข้อความส่วนตัวของ OpenClaw

- **[tavily](/th/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. เพิ่มเครื่องมือที่เอเจนต์เรียกใช้ได้ เพิ่มการรองรับผู้ให้บริการค้นหาเว็บ

- **[tencent](/th/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Tencent TokenHub และ Tencent Tokenplan ให้กับ OpenClaw

- **[tlon](/th/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. Plugin ช่องทาง Tlon/Urbit ของ OpenClaw สำหรับเวิร์กโฟลว์แชต

- **[tokenjuice](/th/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. ย่อผลลัพธ์ของเครื่องมือ exec และ bash ด้วยตัวลดขนาดของ Tokenjuice

- **[twitch](/th/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. Plugin ช่องทาง Twitch ของ OpenClaw สำหรับเวิร์กโฟลว์แชตและการดูแลเนื้อหา

- **[venice](/th/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Venice ให้กับ OpenClaw

- **[vercel-ai-gateway](/th/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Vercel AI Gateway ให้กับ OpenClaw

- **[voice-call](/th/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. Plugin การโทรด้วยเสียงของ OpenClaw สำหรับการโทรศัพท์ผ่าน Twilio, Telnyx และ Plivo

- **[whatsapp](/th/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. Plugin ช่องทาง WhatsApp ของ OpenClaw สำหรับแชตผ่าน WhatsApp Web

- **[zai](/th/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. เพิ่มการรองรับผู้ให้บริการโมเดล Z.AI ให้กับ OpenClaw

- **[zalo](/th/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. Plugin ช่องทาง Zalo ของ OpenClaw สำหรับแชตผ่านบอตและ Webhook

- **[zalouser](/th/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. Plugin บัญชีส่วนบุคคล Zalo ของ OpenClaw ผ่านการผสานรวม zca-js แบบเนทีฟ

## เฉพาะการเช็กเอาต์ซอร์สเท่านั้น

2 Plugin

- **[qa-channel](/th/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - เฉพาะการเช็กเอาต์ซอร์สเท่านั้น เพิ่มพื้นผิว QA Channel สำหรับส่งและรับข้อความ OpenClaw

- **[qa-lab](/th/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - เฉพาะการเช็กเอาต์ซอร์สเท่านั้น Plugin ห้องปฏิบัติการ QA ของ OpenClaw พร้อม UI ดีบักเกอร์ส่วนตัวและตัวเรียกใช้สถานการณ์
