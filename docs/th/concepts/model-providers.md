---
read_when:
    - คุณต้องมีเอกสารอ้างอิงการตั้งค่าโมเดลแบบแยกตามผู้ให้บริการ
    - คุณต้องการตัวอย่างการกำหนดค่าหรือคำสั่งเริ่มต้นใช้งานผ่าน CLI สำหรับผู้ให้บริการโมเดล
sidebarTitle: Model providers
summary: ภาพรวมผู้ให้บริการโมเดลพร้อมตัวอย่างการกำหนดค่า + โฟลว์ CLI
title: ผู้ให้บริการโมเดล
x-i18n:
    generated_at: "2026-04-30T09:47:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3902194674d6d4e17a8477c28addb39b8e04c3b498eb6a0305e82c2f1b5d737e
    source_path: concepts/model-providers.md
    workflow: 16
---

เอกสารอ้างอิงสำหรับ **ผู้ให้บริการ LLM/โมเดล** (ไม่ใช่ช่องทางแชตอย่าง WhatsApp/Telegram) สำหรับกฎการเลือกโมเดล โปรดดู [โมเดล](/th/concepts/models)

## กฎแบบย่อ

<AccordionGroup>
  <Accordion title="การอ้างอิงโมเดลและตัวช่วย CLI">
    - การอ้างอิงโมเดลใช้ `provider/model` (ตัวอย่าง: `opencode/claude-opus-4-6`)
    - `agents.defaults.models` ทำหน้าที่เป็น allowlist เมื่อมีการตั้งค่า
    - ตัวช่วย CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` ตั้งค่าเริ่มต้นระดับผู้ให้บริการ; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` จะเขียนทับต่อโมเดล
    - กฎ fallback, โพรบ cooldown และการคงอยู่ของ session-override: [การสลับโมเดลเมื่อขัดข้อง](/th/concepts/model-failover)

  </Accordion>
  <Accordion title="การแยกผู้ให้บริการ/รันไทม์ของ OpenAI">
    เส้นทางตระกูล OpenAI แยกตาม prefix เฉพาะ:

    - `openai/<model>` ใช้ผู้ให้บริการแบบ API key โดยตรงของ OpenAI ใน PI
    - `openai-codex/<model>` ใช้ Codex OAuth ใน PI
    - `openai/<model>` พร้อม `agents.defaults.agentRuntime.id: "codex"` ใช้ฮาร์เนส app-server ของ Codex แบบเนทีฟ

    ดู [OpenAI](/th/providers/openai) และ [ฮาร์เนส Codex](/th/plugins/codex-harness) หากการแยกผู้ให้บริการ/รันไทม์ทำให้สับสน ให้อ่าน [รันไทม์ของเอเจนต์](/th/concepts/agent-runtimes) ก่อน

    การเปิดใช้ Plugin อัตโนมัติใช้ขอบเขตเดียวกัน: `openai-codex/<model>` เป็นของ OpenAI plugin ส่วน Codex plugin จะเปิดใช้โดย `agentRuntime.id: "codex"` หรือการอ้างอิงเดิม `codex/<model>`

    GPT-5.5 พร้อมใช้งานผ่าน `openai/gpt-5.5` สำหรับทราฟฟิก API key โดยตรง, `openai-codex/gpt-5.5` ใน PI สำหรับ Codex OAuth และฮาร์เนส app-server ของ Codex แบบเนทีฟเมื่อมีการตั้งค่า `agentRuntime.id: "codex"`

  </Accordion>
  <Accordion title="รันไทม์ CLI">
    รันไทม์ CLI ใช้การแยกแบบเดียวกัน: เลือกการอ้างอิงโมเดลมาตรฐาน เช่น `anthropic/claude-*`, `google/gemini-*` หรือ `openai/gpt-*` จากนั้นตั้งค่า `agents.defaults.agentRuntime.id` เป็น `claude-cli`, `google-gemini-cli` หรือ `codex-cli` เมื่อต้องการ backend แบบ CLI ภายในเครื่อง

    การอ้างอิงเดิม `claude-cli/*`, `google-gemini-cli/*` และ `codex-cli/*` จะย้ายกลับไปเป็นการอ้างอิงผู้ให้บริการมาตรฐาน โดยบันทึกรันไทม์แยกไว้ต่างหาก

  </Accordion>
</AccordionGroup>

## พฤติกรรมผู้ให้บริการที่ Plugin เป็นเจ้าของ

ตรรกะเฉพาะผู้ให้บริการส่วนใหญ่อยู่ใน provider plugins (`registerProvider(...)`) ขณะที่ OpenClaw ยังคงดูแลลูป inference ทั่วไป Plugins เป็นเจ้าของ onboarding, แคตตาล็อกโมเดล, การแมป env var สำหรับการยืนยันตัวตน, การทำ normalization ของ transport/config, การล้าง tool-schema, การจัดประเภท failover, การรีเฟรช OAuth, การรายงานการใช้งาน, โปรไฟล์ thinking/reasoning และอื่นๆ

รายการทั้งหมดของ provider-SDK hooks และตัวอย่าง bundled-plugin อยู่ใน [Provider plugins](/th/plugins/sdk-provider-plugins) ผู้ให้บริการที่ต้องการ request executor แบบกำหนดเองทั้งหมดเป็นพื้นผิวส่วนขยายอีกระดับที่ลึกกว่า

<Note>
พฤติกรรม runner ที่ผู้ให้บริการเป็นเจ้าของอยู่บน provider hooks ที่ชัดเจน เช่น replay policy, tool-schema normalization, stream wrapping และตัวช่วย transport/request ส่วน static bag เดิม `ProviderPlugin.capabilities` มีไว้เพื่อความเข้ากันได้เท่านั้น และตรรกะ runner แบบแชร์จะไม่อ่านอีกต่อไป
</Note>

## การหมุนเวียน API key

<AccordionGroup>
  <Accordion title="แหล่งที่มาของคีย์และลำดับความสำคัญ">
    กำหนดค่าหลายคีย์ผ่าน:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (live override เดี่ยว ลำดับความสำคัญสูงสุด)
    - `<PROVIDER>_API_KEYS` (รายการคั่นด้วย comma หรือ semicolon)
    - `<PROVIDER>_API_KEY` (คีย์หลัก)
    - `<PROVIDER>_API_KEY_*` (รายการแบบมีหมายเลข เช่น `<PROVIDER>_API_KEY_1`)

    สำหรับผู้ให้บริการ Google จะรวม `GOOGLE_API_KEY` เป็น fallback ด้วย ลำดับการเลือกคีย์จะรักษาลำดับความสำคัญและตัดค่าซ้ำออก

  </Accordion>
  <Accordion title="เมื่อการหมุนเวียนเริ่มทำงาน">
    - คำขอจะถูกลองใหม่ด้วยคีย์ถัดไปเฉพาะเมื่อมีการตอบกลับ rate-limit เท่านั้น (เช่น `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` หรือข้อความ usage-limit เป็นระยะ)
    - ความล้มเหลวที่ไม่ใช่ rate-limit จะล้มเหลวทันที; จะไม่พยายามหมุนเวียนคีย์
    - เมื่อคีย์ผู้สมัครทั้งหมดล้มเหลว ข้อผิดพลาดสุดท้ายจะถูกส่งกลับจากความพยายามครั้งสุดท้าย

  </Accordion>
</AccordionGroup>

## ผู้ให้บริการในตัว (แคตตาล็อก pi-ai)

OpenClaw มาพร้อมกับแคตตาล็อก pi‑ai ผู้ให้บริการเหล่านี้ไม่ต้องใช้คอนฟิก `models.providers` **เลย**; เพียงตั้งค่าการยืนยันตัวตนและเลือกโมเดล

### OpenAI

- ผู้ให้บริการ: `openai`
- การยืนยันตัวตน: `OPENAI_API_KEY`
- การหมุนเวียนคีย์แบบไม่บังคับ: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, รวมถึง `OPENCLAW_LIVE_OPENAI_KEY` (ค่าแทนที่เดี่ยว)
- โมเดลตัวอย่าง: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- ตรวจสอบความพร้อมใช้งานของบัญชี/โมเดลด้วย `openclaw models list --provider openai` หากการติดตั้งหรือ API key เฉพาะมีพฤติกรรมต่างออกไป
- CLI: `openclaw onboard --auth-choice openai-api-key`
- การส่งข้อมูลเริ่มต้นคือ `auto` (เริ่มด้วย WebSocket, สำรองเป็น SSE)
- แทนที่ต่อโมเดลผ่าน `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, หรือ `"auto"`)
- การวอร์มอัป OpenAI Responses WebSocket เริ่มต้นเป็นเปิดใช้งานผ่าน `params.openaiWsWarmup` (`true`/`false`)
- เปิดใช้งานการประมวลผลแบบมีลำดับความสำคัญของ OpenAI ได้ผ่าน `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` และ `params.fastMode` จะแมปคำขอ Responses แบบตรงของ `openai/*` ไปเป็น `service_tier=priority` บน `api.openai.com`
- ใช้ `params.serviceTier` เมื่อคุณต้องการระดับที่ระบุชัดเจนแทนตัวสลับ `/fast` ที่ใช้ร่วมกัน
- ส่วนหัวการระบุแหล่งที่มา OpenClaw ที่ซ่อนอยู่ (`originator`, `version`, `User-Agent`) ใช้เฉพาะกับทราฟฟิก OpenAI แบบเนทีฟไปยัง `api.openai.com` ไม่ใช่พร็อกซีทั่วไปที่เข้ากันได้กับ OpenAI
- เส้นทาง OpenAI แบบเนทีฟยังคงเก็บ Responses `store`, คำใบ้ prompt-cache, และการจัดรูป payload ให้เข้ากันได้กับ reasoning ของ OpenAI; เส้นทางพร็อกซีไม่ทำเช่นนั้น
- `openai/gpt-5.3-codex-spark` ถูกระงับโดยตั้งใจใน OpenClaw เพราะคำขอ OpenAI API แบบสดปฏิเสธโมเดลนี้ และแค็ตตาล็อก Codex ปัจจุบันไม่ได้เปิดเผยโมเดลนี้

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- ผู้ให้บริการ: `anthropic`
- การยืนยันตัวตน: `ANTHROPIC_API_KEY`
- การหมุนเวียนคีย์แบบไม่บังคับ: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, รวมถึง `OPENCLAW_LIVE_ANTHROPIC_KEY` (ค่าแทนที่เดี่ยว)
- โมเดลตัวอย่าง: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- คำขอสาธารณะโดยตรงของ Anthropic รองรับตัวสลับ `/fast` ที่ใช้ร่วมกันและ `params.fastMode` รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย API-key และ OAuth ที่ส่งไปยัง `api.anthropic.com`; OpenClaw จะแมปสิ่งนั้นไปเป็น `service_tier` ของ Anthropic (`auto` เทียบกับ `standard_only`)
- การกำหนดค่า Claude CLI ที่แนะนำจะคงอ้างอิงโมเดลให้เป็นแบบ canonical และเลือกแบ็กเอนด์ CLI
  แยกต่างหาก: `anthropic/claude-opus-4-7` พร้อม
  `agents.defaults.agentRuntime.id: "claude-cli"` อ้างอิงแบบเดิม
  `claude-cli/claude-opus-4-7` ยังคงใช้งานได้เพื่อความเข้ากันได้

<Note>
พนักงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้งาน `claude -p` เป็นสิ่งที่ได้รับอนุญาตสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่ Anthropic setup-token ยังคงมีให้ใช้เป็นเส้นทางโทเค็นของ OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw แนะนำให้ใช้ Claude CLI ซ้ำและ `claude -p` เมื่อพร้อมใช้งาน
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- ผู้ให้บริการ: `openai-codex`
- การยืนยันตัวตน: OAuth (ChatGPT)
- อ้างอิงโมเดล PI: `openai-codex/gpt-5.5`
- อ้างอิง harness ของ Codex app-server แบบเนทีฟ: `openai/gpt-5.5` พร้อม `agents.defaults.agentRuntime.id: "codex"`
- เอกสาร harness ของ Codex app-server แบบเนทีฟ: [Codex harness](/th/plugins/codex-harness)
- อ้างอิงโมเดลแบบเดิม: `codex/gpt-*`
- ขอบเขต Plugin: `openai-codex/*` โหลด OpenAI plugin; Plugin ของ Codex app-server แบบเนทีฟจะถูกเลือกเฉพาะโดย runtime ของ Codex harness หรืออ้างอิงแบบเดิม `codex/*`
- CLI: `openclaw onboard --auth-choice openai-codex` หรือ `openclaw models auth login --provider openai-codex`
- การส่งข้อมูลเริ่มต้นคือ `auto` (เริ่มด้วย WebSocket, สำรองเป็น SSE)
- แทนที่ต่อโมเดล PI ผ่าน `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"`, หรือ `"auto"`)
- `params.serviceTier` จะถูกส่งต่อบนคำขอ Codex Responses แบบเนทีฟด้วย (`chatgpt.com/backend-api`)
- ส่วนหัวการระบุแหล่งที่มา OpenClaw ที่ซ่อนอยู่ (`originator`, `version`, `User-Agent`) จะถูกแนบเฉพาะกับทราฟฟิก Codex แบบเนทีฟไปยัง `chatgpt.com/backend-api` ไม่ใช่พร็อกซีทั่วไปที่เข้ากันได้กับ OpenAI
- ใช้การกำหนดค่าตัวสลับ `/fast` และ `params.fastMode` เดียวกับ `openai/*` แบบตรง; OpenClaw จะแมปสิ่งนั้นไปเป็น `service_tier=priority`
- `openai-codex/gpt-5.5` ใช้ `contextWindow = 400000` แบบเนทีฟจากแค็ตตาล็อก Codex และ runtime เริ่มต้น `contextTokens = 272000`; แทนที่เพดาน runtime ด้วย `models.providers.openai-codex.models[].contextTokens`
- หมายเหตุนโยบาย: OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับเครื่องมือ/เวิร์กโฟลว์ภายนอกอย่าง OpenClaw
- ใช้ `openai-codex/gpt-5.5` เมื่อคุณต้องการเส้นทาง Codex OAuth/subscription; ใช้ `openai/gpt-5.5` เมื่อการตั้งค่า API-key และแค็ตตาล็อกภายในเครื่องของคุณเปิดเผยเส้นทาง API สาธารณะ

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### ตัวเลือกโฮสต์แบบ subscription-style อื่นๆ

<CardGroup cols={3}>
  <Card title="โมเดล GLM" href="/th/providers/glm">
    Z.AI Coding Plan หรือ endpoint API ทั่วไป
  </Card>
  <Card title="MiniMax" href="/th/providers/minimax">
    MiniMax Coding Plan OAuth หรือการเข้าถึงด้วย API key
  </Card>
  <Card title="Qwen Cloud" href="/th/providers/qwen">
    พื้นผิวผู้ให้บริการ Qwen Cloud พร้อมการแมป endpoint ของ Alibaba DashScope และ Coding Plan
  </Card>
</CardGroup>

### OpenCode

- การยืนยันตัวตน: `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`)
- ผู้ให้บริการ runtime ของ Zen: `opencode`
- ผู้ให้บริการ runtime ของ Go: `opencode-go`
- โมเดลตัวอย่าง: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` หรือ `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- ผู้ให้บริการ: `google`
- การยืนยันตัวตน: `GEMINI_API_KEY`
- การหมุนเวียนคีย์แบบไม่บังคับ: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, ทางเลือกสำรอง `GOOGLE_API_KEY`, และ `OPENCLAW_LIVE_GEMINI_KEY` (ค่าแทนที่เดี่ยว)
- โมเดลตัวอย่าง: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- ความเข้ากันได้: การกำหนดค่า OpenClaw แบบเดิมที่ใช้ `google/gemini-3.1-flash-preview` จะถูก normalize เป็น `google/gemini-3-flash-preview`
- Alias: ยอมรับ `google/gemini-3.1-pro` และ normalize เป็น id ของ Gemini API แบบสดของ Google คือ `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` ใช้ dynamic thinking ของ Google Gemini 3/3.1 ละเว้น `thinkingLevel` แบบคงที่; Gemini 2.5 ส่ง `thinkingBudget: -1`
- การรัน Gemini แบบตรงยังยอมรับ `agents.defaults.models["google/<model>"].params.cachedContent` (หรือแบบเดิม `cached_content`) เพื่อส่งต่อ handle แบบเนทีฟของผู้ให้บริการ `cachedContents/...`; การพบ cache ของ Gemini จะแสดงใน OpenClaw เป็น `cacheRead`

### Google Vertex และ Gemini CLI

- ผู้ให้บริการ: `google-vertex`, `google-gemini-cli`
- การยืนยันตัวตน: Vertex ใช้ gcloud ADC; Gemini CLI ใช้ flow OAuth ของตน

<Warning>
Gemini CLI OAuth ใน OpenClaw เป็นการผสานรวมอย่างไม่เป็นทางการ ผู้ใช้บางรายรายงานข้อจำกัดบัญชี Google หลังจากใช้ไคลเอนต์บุคคลที่สาม ตรวจสอบข้อกำหนดของ Google และใช้บัญชีที่ไม่สำคัญหากคุณเลือกดำเนินการต่อ
</Warning>

Gemini CLI OAuth ถูกจัดส่งเป็นส่วนหนึ่งของ Plugin `google` ที่รวมมาให้

<Steps>
  <Step title="ติดตั้ง Gemini CLI">
    <Tabs>
      <Tab title="brew">
        ```bash
        brew install gemini-cli
        ```
      </Tab>
      <Tab title="npm">
        ```bash
        npm install -g @google/gemini-cli
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="เปิดใช้งาน Plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="เข้าสู่ระบบ">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    โมเดลเริ่มต้น: `google-gemini-cli/gemini-3-flash-preview` คุณ **ไม่** วาง client id หรือ secret ลงใน `openclaw.json` โฟลว์การเข้าสู่ระบบของ CLI จะจัดเก็บโทเค็นไว้ใน auth profiles บนโฮสต์ Gateway

  </Step>
  <Step title="ตั้งค่าโปรเจกต์ (หากจำเป็น)">
    หากคำขอล้มเหลวหลังจากเข้าสู่ระบบ ให้ตั้งค่า `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ Gateway
  </Step>
</Steps>

การตอบกลับ JSON ของ Gemini CLI จะถูกแยกวิเคราะห์จาก `response`; usage จะ fallback ไปที่ `stats` โดยมีการ normalize `stats.cached` เป็น OpenClaw `cacheRead`

### Z.AI (GLM)

- ผู้ให้บริการ: `zai`
- การยืนยันตัวตน: `ZAI_API_KEY`
- โมเดลตัวอย่าง: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - นามแฝง: `z.ai/*` และ `z-ai/*` จะ normalize เป็น `zai/*`
  - `zai-api-key` ตรวจจับ endpoint ของ Z.AI ที่ตรงกันโดยอัตโนมัติ; `zai-coding-global`, `zai-coding-cn`, `zai-global` และ `zai-cn` บังคับใช้ surface เฉพาะ

### Vercel AI Gateway

- ผู้ให้บริการ: `vercel-ai-gateway`
- การยืนยันตัวตน: `AI_GATEWAY_API_KEY`
- โมเดลตัวอย่าง: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- ผู้ให้บริการ: `kilocode`
- การยืนยันตัวตน: `KILOCODE_API_KEY`
- โมเดลตัวอย่าง: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- แค็ตตาล็อก fallback แบบคงที่มาพร้อม `kilocode/kilo/auto`; การค้นพบแบบ live ที่ `https://api.kilo.ai/api/gateway/models` สามารถขยายแค็ตตาล็อก runtime เพิ่มเติมได้
- การกำหนดเส้นทาง upstream ที่แน่นอนเบื้องหลัง `kilocode/kilo/auto` เป็นของ Kilo Gateway ไม่ได้ hard-code ไว้ใน OpenClaw

ดูรายละเอียดการตั้งค่าที่ [/providers/kilocode](/th/providers/kilocode)

### Plugin ผู้ให้บริการอื่นที่รวมมาให้

| ผู้ให้บริการ            | รหัส                             | env สำหรับการยืนยันตัวตน                                    | โมเดลตัวอย่าง                                 |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` or `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` or `KIMICODE_API_KEY`                         | `kimi/kimi-code`                              |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                  |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### ข้อควรทราบ

<AccordionGroup>
  <Accordion title="OpenRouter">
    ใช้ app-attribution headers และ Anthropic `cache_control` markers เฉพาะบน route `openrouter.ai` ที่ผ่านการยืนยันแล้วเท่านั้น DeepSeek, Moonshot และ ZAI refs มีสิทธิ์ใช้ cache-TTL สำหรับ prompt caching ที่ OpenRouter จัดการ แต่จะไม่ได้รับ Anthropic cache markers ในฐานะ path แบบ proxy ที่เข้ากันได้กับ OpenAI จึงข้ามการ shaping ที่ใช้เฉพาะ native-OpenAI (`serviceTier`, Responses `store`, prompt-cache hints, OpenAI reasoning-compat) refs ที่มี Gemini อยู่เบื้องหลังจะคงไว้เฉพาะการ sanitation ของ proxy-Gemini thought-signature
  </Accordion>
  <Accordion title="Kilo Gateway">
    refs ที่มี Gemini อยู่เบื้องหลังจะใช้ path การ sanitation ของ proxy-Gemini เดียวกัน; `kilocode/kilo/auto` และ refs อื่นที่ไม่รองรับ proxy-reasoning จะข้ามการฉีด proxy reasoning
  </Accordion>
  <Accordion title="MiniMax">
    การ onboarding ด้วย API key จะเขียนคำจำกัดความของโมเดลแชต M2.7 แบบข้อความเท่านั้นอย่างชัดเจน; image understanding ยังคงอยู่บน media provider `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
  </Accordion>
  <Accordion title="NVIDIA">
    รหัสโมเดลใช้ namespace แบบ `nvidia/<vendor>/<model>` (เช่น `nvidia/nvidia/nemotron-...` ควบคู่กับ `nvidia/moonshotai/kimi-k2.5`); ตัวเลือกจะรักษาการประกอบ `<provider>/<model-id>` ตามตัวอักษรไว้ ขณะที่ canonical key ที่ส่งไปยัง API ยังคงมี prefix เดียว
  </Accordion>
  <Accordion title="xAI">
    ใช้ path xAI Responses `/fast` หรือ `params.fastMode: true` จะ rewrite `grok-3`, `grok-3-mini`, `grok-4` และ `grok-4-0709` เป็น variant `*-fast` ของแต่ละรายการ `tool_stream` เปิดไว้โดยค่าเริ่มต้น; ปิดผ่าน `agents.defaults.models["xai/<model>"].params.tool_stream=false`
  </Accordion>
  <Accordion title="Cerebras">
    มาพร้อมเป็น Plugin ผู้ให้บริการ `cerebras` ที่รวมมาให้ GLM ใช้ `zai-glm-4.7`; OpenAI-compatible base URL คือ `https://api.cerebras.ai/v1`
  </Accordion>
</AccordionGroup>

## ผู้ให้บริการผ่าน `models.providers` (custom/base URL)

ใช้ `models.providers` (หรือ `models.json`) เพื่อเพิ่มผู้ให้บริการ **custom** หรือ proxy ที่เข้ากันได้กับ OpenAI/Anthropic

Plugin ผู้ให้บริการที่รวมมาให้จำนวนมากด้านล่างเผยแพร่แค็ตตาล็อกเริ่มต้นอยู่แล้ว ใช้รายการ `models.providers.<id>` แบบชัดเจนเฉพาะเมื่อคุณต้องการ override ค่าเริ่มต้นของ base URL, headers หรือรายการโมเดล

การตรวจสอบความสามารถของโมเดลใน Gateway จะอ่าน metadata `models.providers.<id>.models[]` แบบชัดเจนด้วย หากโมเดล custom หรือ proxy รับรูปภาพได้ ให้ตั้งค่า `input: ["text", "image"]` บนโมเดลนั้น เพื่อให้ WebChat และ path ของไฟล์แนบที่มาจาก node ส่งรูปภาพเป็นอินพุตโมเดลแบบ native แทน media refs แบบข้อความเท่านั้น

### Moonshot AI (Kimi)

Moonshot มาพร้อมเป็น Plugin ผู้ให้บริการที่รวมมาให้ ใช้ผู้ให้บริการในตัวเป็นค่าเริ่มต้น และเพิ่มรายการ `models.providers.moonshot` แบบชัดเจนเฉพาะเมื่อคุณต้อง override base URL หรือ metadata ของโมเดล:

- ผู้ให้บริการ: `moonshot`
- การยืนยันตัวตน: `MOONSHOT_API_KEY`
- โมเดลตัวอย่าง: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` หรือ `openclaw onboard --auth-choice moonshot-api-key-cn`

รหัสโมเดล Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### การเขียนโค้ดด้วย Kimi

Kimi Coding ใช้ endpoint ที่เข้ากันได้กับ Anthropic ของ Moonshot AI:

- ผู้ให้บริการ: `kimi`
- การยืนยันตัวตน: `KIMI_API_KEY`
- รุ่นตัวอย่าง: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

`kimi/k2p5` แบบเดิมยังคงยอมรับเป็น id รุ่นเพื่อความเข้ากันได้

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) ให้สิทธิ์เข้าถึง Doubao และรุ่นอื่นๆ ในประเทศจีน

- ผู้ให้บริการ: `volcengine` (การเขียนโค้ด: `volcengine-plan`)
- การยืนยันตัวตน: `VOLCANO_ENGINE_API_KEY`
- รุ่นตัวอย่าง: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

การเริ่มต้นใช้งานจะใช้พื้นผิวสำหรับการเขียนโค้ดเป็นค่าเริ่มต้น แต่แค็ตตาล็อกทั่วไป `volcengine/*` จะถูกลงทะเบียนพร้อมกัน

ในตัวเลือกรุ่นสำหรับการเริ่มต้นใช้งาน/การกำหนดค่า ตัวเลือกการยืนยันตัวตน Volcengine จะให้ความสำคัญกับทั้งแถว `volcengine/*` และ `volcengine-plan/*` หากยังไม่ได้โหลดรุ่นเหล่านั้น OpenClaw จะถอยกลับไปใช้แค็ตตาล็อกที่ไม่ได้กรองแทนการแสดงตัวเลือกที่จำกัดเฉพาะผู้ให้บริการแบบว่างเปล่า

<Tabs>
  <Tab title="Standard models">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Coding models (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (ระหว่างประเทศ)

BytePlus ARK ให้สิทธิ์เข้าถึงรุ่นเดียวกับ Volcano Engine สำหรับผู้ใช้ต่างประเทศ

- ผู้ให้บริการ: `byteplus` (การเขียนโค้ด: `byteplus-plan`)
- การยืนยันตัวตน: `BYTEPLUS_API_KEY`
- รุ่นตัวอย่าง: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

การเริ่มต้นใช้งานจะใช้พื้นผิวสำหรับการเขียนโค้ดเป็นค่าเริ่มต้น แต่แค็ตตาล็อกทั่วไป `byteplus/*` จะถูกลงทะเบียนพร้อมกัน

ในตัวเลือกโมเดลสำหรับการเริ่มใช้งาน/กำหนดค่า ตัวเลือกการยืนยันตัวตนของ BytePlus จะให้ความสำคัญกับทั้งแถว `byteplus/*` และ `byteplus-plan/*` หากโมเดลเหล่านั้นยังไม่ได้โหลด OpenClaw จะย้อนกลับไปใช้แค็ตตาล็อกที่ไม่กรองแทนการแสดงตัวเลือกที่จำกัดเฉพาะผู้ให้บริการแบบว่างเปล่า

<Tabs>
  <Tab title="โมเดลมาตรฐาน">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="โมเดลสำหรับการเขียนโค้ด (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic ให้บริการโมเดลที่เข้ากันได้กับ Anthropic ภายใต้ผู้ให้บริการ `synthetic`:

- ผู้ให้บริการ: `synthetic`
- การยืนยันตัวตน: `SYNTHETIC_API_KEY`
- โมเดลตัวอย่าง: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax ถูกกำหนดค่าผ่าน `models.providers` เพราะใช้ปลายทางแบบกำหนดเอง:

- MiniMax OAuth (ทั่วโลก): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (จีน): `--auth-choice minimax-cn-oauth`
- คีย์ API ของ MiniMax (ทั่วโลก): `--auth-choice minimax-global-api`
- คีย์ API ของ MiniMax (จีน): `--auth-choice minimax-cn-api`
- การยืนยันตัวตน: `MINIMAX_API_KEY` สำหรับ `minimax`; `MINIMAX_OAUTH_TOKEN` หรือ `MINIMAX_API_KEY` สำหรับ `minimax-portal`

ดูรายละเอียดการตั้งค่า ตัวเลือกโมเดล และส่วนย่อยการกำหนดค่าได้ที่ [/providers/minimax](/th/providers/minimax)

<Note>
บนเส้นทางสตรีมมิงที่เข้ากันได้กับ Anthropic ของ MiniMax นั้น OpenClaw จะปิดการคิดเป็นค่าเริ่มต้นเว้นแต่คุณจะตั้งค่าอย่างชัดเจน และ `/fast on` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`
</Note>

การแบ่งความสามารถที่ Plugin เป็นเจ้าของ:

- ค่าเริ่มต้นข้อความ/แชตยังคงอยู่ที่ `minimax/MiniMax-M2.7`
- การสร้างรูปภาพคือ `minimax/image-01` หรือ `minimax-portal/image-01`
- การเข้าใจรูปภาพคือ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของบนเส้นทางการยืนยันตัวตน MiniMax ทั้งสองแบบ
- การค้นหาเว็บยังคงอยู่บน ID ผู้ให้บริการ `minimax`

### LM Studio

LM Studio มาพร้อมเป็น Plugin ผู้ให้บริการแบบบันเดิลซึ่งใช้ API ดั้งเดิม:

- ผู้ให้บริการ: `lmstudio`
- การยืนยันตัวตน: `LM_API_TOKEN`
- URL ฐานสำหรับการอนุมานเริ่มต้น: `http://localhost:1234/v1`

จากนั้นตั้งค่าโมเดลหนึ่งตัว (แทนที่ด้วย ID หนึ่งจากรายการที่ `http://localhost:1234/api/v1/models` ส่งคืน):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw ใช้ `/api/v1/models` และ `/api/v1/models/load` แบบดั้งเดิมของ LM Studio สำหรับการค้นหา + โหลดอัตโนมัติ โดยใช้ `/v1/chat/completions` สำหรับการอนุมานเป็นค่าเริ่มต้น ดูการตั้งค่าและการแก้ไขปัญหาได้ที่ [/providers/lmstudio](/th/providers/lmstudio)

### Ollama

Ollama มาพร้อมเป็น Plugin ผู้ให้บริการแบบบันเดิลและใช้ API ดั้งเดิมของ Ollama:

- ผู้ให้บริการ: `ollama`
- การยืนยันตัวตน: ไม่จำเป็น (เซิร์ฟเวอร์ภายในเครื่อง)
- โมเดลตัวอย่าง: `ollama/llama3.3`
- การติดตั้ง: [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama จะถูกตรวจพบภายในเครื่องที่ `http://127.0.0.1:11434` เมื่อคุณเลือกใช้ด้วย `OLLAMA_API_KEY` และ Plugin ผู้ให้บริการแบบบันเดิลจะเพิ่ม Ollama เข้าไปใน `openclaw onboard` และตัวเลือกโมเดลโดยตรง ดูการเริ่มใช้งาน โหมดคลาวด์/ภายในเครื่อง และการกำหนดค่าแบบกำหนดเองได้ที่ [/providers/ollama](/th/providers/ollama)

### vLLM

vLLM มาพร้อมเป็น Plugin ผู้ให้บริการแบบบันเดิลสำหรับเซิร์ฟเวอร์ภายในเครื่อง/โฮสต์เองที่เข้ากันได้กับ OpenAI:

- ผู้ให้บริการ: `vllm`
- การยืนยันตัวตน: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- URL ฐานเริ่มต้น: `http://127.0.0.1:8000/v1`

หากต้องการเลือกใช้การค้นหาอัตโนมัติภายในเครื่อง (ค่าใดก็ได้ใช้ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับใช้การยืนยันตัวตน):

```bash
export VLLM_API_KEY="vllm-local"
```

จากนั้นตั้งค่าโมเดลหนึ่งตัว (แทนที่ด้วย ID หนึ่งจากรายการที่ `/v1/models` ส่งคืน):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

ดูรายละเอียดได้ที่ [/providers/vllm](/th/providers/vllm)

### SGLang

SGLang มาพร้อมเป็น Plugin ผู้ให้บริการแบบบันเดิลสำหรับเซิร์ฟเวอร์ที่โฮสต์เองอย่างรวดเร็วและเข้ากันได้กับ OpenAI:

- ผู้ให้บริการ: `sglang`
- การยืนยันตัวตน: ไม่บังคับ (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- URL ฐานเริ่มต้น: `http://127.0.0.1:30000/v1`

หากต้องการเลือกใช้การค้นหาอัตโนมัติภายในเครื่อง (ค่าใดก็ได้ใช้ได้หากเซิร์ฟเวอร์ของคุณไม่ได้บังคับใช้การยืนยันตัวตน):

```bash
export SGLANG_API_KEY="sglang-local"
```

จากนั้นตั้งค่าโมเดลหนึ่งตัว (แทนที่ด้วย ID หนึ่งจากรายการที่ `/v1/models` ส่งคืน):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

ดูรายละเอียดได้ที่ [/providers/sglang](/th/providers/sglang)

### พร็อกซีภายในเครื่อง (LM Studio, vLLM, LiteLLM ฯลฯ)

ตัวอย่าง (เข้ากันได้กับ OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="ฟิลด์ไม่บังคับเริ่มต้น">
    สำหรับผู้ให้บริการแบบกำหนดเอง `reasoning`, `input`, `cost`, `contextWindow` และ `maxTokens` เป็นฟิลด์ไม่บังคับ เมื่อไม่ระบุ OpenClaw จะใช้ค่าเริ่มต้นเป็น:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    แนะนำ: ตั้งค่าที่ชัดเจนให้ตรงกับขีดจำกัดของพร็อกซี/โมเดลของคุณ

  </Accordion>
  <Accordion title="กฎการจัดรูปเส้นทางพร็อกซี">
    - สำหรับ `api: "openai-completions"` บนปลายทางที่ไม่ใช่แบบดั้งเดิม (ค่า `baseUrl` ที่ไม่ว่างใด ๆ ซึ่งโฮสต์ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับ `compat.supportsDeveloperRole: false` เพื่อหลีกเลี่ยงข้อผิดพลาด 400 จากผู้ให้บริการสำหรับบทบาท `developer` ที่ไม่รองรับ
    - เส้นทางที่เข้ากันได้กับ OpenAI แบบพร็อกซียังข้ามการจัดรูปคำขอเฉพาะ OpenAI แบบดั้งเดิมด้วย: ไม่มี `service_tier`, ไม่มี Responses `store`, ไม่มี Completions `store`, ไม่มีคำใบ้ prompt-cache, ไม่มีการจัดรูปเพย์โหลด reasoning-compat ของ OpenAI และไม่มีส่วนหัวการระบุแหล่งที่มา OpenClaw ที่ซ่อนอยู่
    - สำหรับพร็อกซี Completions ที่เข้ากันได้กับ OpenAI ซึ่งต้องการฟิลด์เฉพาะผู้จำหน่าย ให้ตั้งค่า `agents.defaults.models["provider/model"].params.extra_body` (หรือ `extraBody`) เพื่อรวม JSON เพิ่มเติมเข้าไปในเนื้อความคำขอขาออก
    - สำหรับการควบคุม chat-template ของ vLLM ให้ตั้งค่า `agents.defaults.models["provider/model"].params.chat_template_kwargs` Plugin vLLM แบบบันเดิลจะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติสำหรับ `vllm/nemotron-3-*` เมื่อระดับการคิดของเซสชันปิดอยู่
    - สำหรับโมเดลภายในเครื่องที่ช้าหรือโฮสต์ LAN/tailnet ระยะไกล ให้ตั้งค่า `models.providers.<id>.timeoutSeconds` ค่านี้จะขยายการจัดการคำขอ HTTP ของโมเดลผู้ให้บริการ รวมถึงการเชื่อมต่อ ส่วนหัว การสตรีมเนื้อความ และการยกเลิก guarded-fetch รวม โดยไม่เพิ่มเวลาหมดอายุรันไทม์ของเอเจนต์ทั้งหมด
    - หาก `baseUrl` ว่าง/ไม่ระบุ OpenClaw จะคงพฤติกรรม OpenAI เริ่มต้นไว้ (ซึ่งจะแปลงเป็น `api.openai.com`)
    - เพื่อความปลอดภัย `compat.supportsDeveloperRole: true` ที่ระบุอย่างชัดเจนยังคงถูกแทนที่บนปลายทาง `openai-completions` ที่ไม่ใช่แบบดั้งเดิม
    - สำหรับ `api: "anthropic-messages"` บนปลายทางที่ไม่ใช่โดยตรง (ผู้ให้บริการใด ๆ ที่ไม่ใช่ `anthropic` ตามมาตรฐาน หรือ `models.providers.anthropic.baseUrl` แบบกำหนดเองที่โฮสต์ไม่ใช่ปลายทางสาธารณะ `api.anthropic.com`) OpenClaw จะระงับส่วนหัว Anthropic beta โดยนัย เช่น `claude-code-20250219`, `interleaved-thinking-2025-05-14` และเครื่องหมาย OAuth เพื่อให้พร็อกซีแบบกำหนดเองที่เข้ากันได้กับ Anthropic ไม่ปฏิเสธแฟล็ก beta ที่ไม่รองรับ ตั้งค่า `models.providers.<id>.headers["anthropic-beta"]` อย่างชัดเจนหากพร็อกซีของคุณต้องการฟีเจอร์ beta เฉพาะ

  </Accordion>
</AccordionGroup>

## ตัวอย่าง CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

ดูเพิ่มเติม: [การกำหนดค่า](/th/gateway/configuration) สำหรับตัวอย่างการกำหนดค่าแบบเต็ม

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) — คีย์การกำหนดค่าโมเดล
- [การสลับโมเดลเมื่อเกิดข้อผิดพลาด](/th/concepts/model-failover) — เชนสำรองและพฤติกรรมการลองใหม่
- [โมเดล](/th/concepts/models) — การกำหนดค่าโมเดลและนามแฝง
- [ผู้ให้บริการ](/th/providers) — คู่มือการตั้งค่าแยกตามผู้ให้บริการ
