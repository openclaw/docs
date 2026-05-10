---
read_when:
    - คุณต้องการความหมายของการกำหนดค่าระดับฟิลด์หรือค่าเริ่มต้นที่แน่นอน
    - คุณกำลังตรวจสอบความถูกต้องของบล็อกการกำหนดค่าช่องทาง โมเดล Gateway หรือเครื่องมือ
summary: เอกสารอ้างอิงการกำหนดค่า Gateway สำหรับคีย์หลักของ OpenClaw ค่าเริ่มต้น และลิงก์ไปยังเอกสารอ้างอิงของระบบย่อยเฉพาะ
title: คู่มืออ้างอิงการกำหนดค่า
x-i18n:
    generated_at: "2026-05-10T19:36:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71a9b9ba64b334086a3e32fd9255eb45f9089818a1798a4d542d39d586d53fd9
    source_path: gateway/configuration-reference.md
    workflow: 16
---

ข้อมูลอ้างอิง config หลักสำหรับ `~/.openclaw/openclaw.json` สำหรับภาพรวมแบบเน้นงาน ให้ดู [การกำหนดค่า](/th/gateway/configuration)

ครอบคลุมพื้นผิว config หลักของ OpenClaw และลิงก์ออกไปเมื่อระบบย่อยมีข้อมูลอ้างอิงเชิงลึกของตัวเอง แคตตาล็อกคำสั่งที่ channel และ plugin เป็นเจ้าของ รวมถึง knob เชิงลึกของ memory/QMD อยู่ในหน้าของตัวเองแทนที่จะอยู่ในหน้านี้

แหล่งจริงของโค้ด:

- `openclaw config schema` พิมพ์ JSON Schema สดที่ใช้สำหรับการตรวจสอบความถูกต้องและ Control UI โดยผสาน metadata ของ bundled/plugin/channel เมื่อมี
- `config.schema.lookup` คืน schema node หนึ่งรายการตาม path scope สำหรับเครื่องมือเจาะดูรายละเอียด
- `pnpm config:docs:check` / `pnpm config:docs:gen` ตรวจสอบ hash baseline ของ config-doc เทียบกับ schema surface ปัจจุบัน

เส้นทางค้นหาของ agent: ใช้การกระทำของเครื่องมือ `gateway` ชื่อ `config.schema.lookup` สำหรับ
เอกสารและข้อจำกัดระดับ field ที่แม่นยำก่อนแก้ไข ใช้
[การกำหนดค่า](/th/gateway/configuration) สำหรับคำแนะนำแบบเน้นงาน และใช้หน้านี้
สำหรับแผนที่ field ที่กว้างกว่า ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงของระบบย่อย

ข้อมูลอ้างอิงเชิงลึกเฉพาะเรื่อง:

- [ข้อมูลอ้างอิงการกำหนดค่า memory](/th/reference/memory-config) สำหรับ `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` และ config ของ dreaming ภายใต้ `plugins.entries.memory-core.config.dreaming`
- [คำสั่ง slash](/th/tools/slash-commands) สำหรับแคตตาล็อกคำสั่ง built-in + bundled ปัจจุบัน
- หน้า channel/plugin เจ้าของ สำหรับพื้นผิวคำสั่งเฉพาะ channel

รูปแบบ config คือ **JSON5** (อนุญาตให้มี comments + trailing commas) ทุก field เป็น optional - OpenClaw ใช้ค่าเริ่มต้นที่ปลอดภัยเมื่อเว้นไว้

---

## Channels

คีย์ config ราย channel ถูกย้ายไปยังหน้าเฉพาะแล้ว - ดู
[การกำหนดค่า - channels](/th/gateway/config-channels) สำหรับ `channels.*`
รวมถึง Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และ channel
bundled อื่นๆ (auth, access control, multi-account, mention gating)

## ค่าเริ่มต้นของ agent, multi-agent, sessions และ messages

ย้ายไปยังหน้าเฉพาะแล้ว - ดู
[การกำหนดค่า - agents](/th/gateway/config-agents) สำหรับ:

- `agents.defaults.*` (workspace, model, thinking, heartbeat, memory, media, skills, sandbox)
- `multiAgent.*` (การ routing และ bindings ของ multi-agent)
- `session.*` (วงจรชีวิตของ session, compaction, pruning)
- `messages.*` (การส่ง message, TTS, การ render markdown)
- `talk.*` (โหมด Talk)
  - `talk.consultThinkingLevel`: override ระดับ thinking สำหรับการรัน agent ของ OpenClaw แบบเต็มที่อยู่เบื้องหลัง realtime consult ของ Control UI Talk
  - `talk.consultFastMode`: override fast-mode แบบครั้งเดียวสำหรับ realtime consult ของ Control UI Talk
  - `talk.speechLocale`: id locale BCP 47 ที่ optional สำหรับการรู้จำเสียงพูดของ Talk บน iOS/macOS
  - `talk.silenceTimeoutMs`: เมื่อไม่ได้ตั้งค่า Talk จะคงหน้าต่าง pause เริ่มต้นของ platform ก่อนส่ง transcript (`700 ms on macOS and Android, 900 ms on iOS`)

## Tools และ custom providers

นโยบาย tool, toggles แบบ experimental, config ของ tool ที่มี provider รองรับ และการตั้งค่า
custom provider / base-URL ถูกย้ายไปยังหน้าเฉพาะแล้ว - ดู
[การกำหนดค่า - tools และ custom providers](/th/gateway/config-tools)

## Models

นิยาม provider, allowlists ของ model และการตั้งค่า custom provider อยู่ใน
[การกำหนดค่า - tools และ custom providers](/th/gateway/config-tools#custom-providers-and-base-urls)
root `models` ยังเป็นเจ้าของพฤติกรรม model-catalog ระดับ global ด้วย

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: พฤติกรรมแคตตาล็อก provider (`merge` หรือ `replace`)
- `models.providers`: map ของ custom provider ที่ใช้ provider id เป็นคีย์
- `models.providers.*.localService`: process manager แบบ on-demand ที่ optional สำหรับ
  local model servers OpenClaw probe health endpoint ที่กำหนดค่าไว้, start
  absolute `command` เมื่อจำเป็น, รอ readiness แล้วจึงส่ง model
  request ดู [Local model services](/th/gateway/local-model-services)
- `models.pricing.enabled`: ควบคุม background pricing bootstrap ที่
  เริ่มหลังจาก sidecars และ channels เข้าสู่ path ที่ Gateway พร้อมใช้งาน เมื่อเป็น `false`
  Gateway จะข้ามการ fetch pricing-catalog ของ OpenRouter และ LiteLLM; ค่า
  `models.providers.*.models[].cost` ที่กำหนดค่าไว้ยังคงใช้ได้สำหรับการประเมิน cost ในเครื่อง

## MCP

นิยาม MCP server ที่ OpenClaw จัดการอยู่ภายใต้ `mcp.servers` และถูก
ใช้โดย Pi แบบ embedded และ runtime adapters อื่นๆ คำสั่ง `openclaw mcp list`,
`show`, `set` และ `unset` จัดการ block นี้โดยไม่เชื่อมต่อไปยัง
target server ระหว่างการแก้ไข config

```json5
{
  mcp: {
    // Optional. Default: 600000 ms (10 minutes). Set 0 to disable idle eviction.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: นิยาม MCP server แบบ stdio หรือ remote ที่มีชื่อ สำหรับ runtimes ที่
  expose MCP tools ที่กำหนดค่าไว้
  รายการ remote ใช้ `transport: "streamable-http"` หรือ `transport: "sse"`;
  `type: "http"` เป็น alias แบบ CLI-native ที่ `openclaw mcp set` และ
  `openclaw doctor --fix` normalize ให้เป็น field `transport` ตาม canonical
- `mcp.sessionIdleTtlMs`: idle TTL สำหรับ bundled MCP runtimes ที่ scope ตาม session
  การรัน embedded แบบ one-shot ขอ cleanup เมื่อจบการรัน; TTL นี้เป็น backstop สำหรับ
  sessions ที่มีอายุยาวและ callers ในอนาคต
- การเปลี่ยนแปลงภายใต้ `mcp.*` hot-apply โดย dispose cached session MCP runtimes
  การ discovery/use ของ tool ครั้งถัดไปจะสร้างใหม่จาก config ใหม่ ดังนั้นรายการ
  `mcp.servers` ที่ถูกลบจะถูก reaped ทันทีแทนที่จะรอ idle TTL

ดู [MCP](/th/cli/mcp#openclaw-as-an-mcp-client-registry) และ
[CLI backends](/th/gateway/cli-backends#bundle-mcp-overlays) สำหรับพฤติกรรม runtime

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist ที่ optional สำหรับ bundled skills เท่านั้น (ไม่มีผลกับ managed/workspace skills)
- `load.extraDirs`: roots ของ shared skill เพิ่มเติม (precedence ต่ำสุด)
- `load.allowSymlinkTargets`: roots ของ target จริงที่เชื่อถือได้ ซึ่ง symlink ของ skill อาจ
  resolve เข้าไปได้เมื่อ link อยู่นอก source root ที่กำหนดค่าไว้
- `install.preferBrew`: เมื่อเป็น true ให้เลือกใช้ตัวติดตั้ง Homebrew ก่อนเมื่อมี `brew`
  พร้อมใช้งาน ก่อน fallback ไปยัง installer ชนิดอื่น
- `install.nodeManager`: preference ของ node installer สำหรับ spec `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`)
- `install.allowUploadedArchives`: อนุญาตให้ Gateway
  clients แบบ `operator.admin` ที่เชื่อถือได้ติดตั้ง private zip archives ที่ staged ผ่าน `skills.upload.*`
  (ค่าเริ่มต้น: false) สิ่งนี้เปิดใช้เฉพาะ path ของ uploaded-archive เท่านั้น; การติดตั้ง ClawHub
  ปกติไม่ต้องใช้
- `entries.<skillKey>.enabled: false` ปิดใช้งาน skill แม้ว่าจะเป็น bundled/installed
- `entries.<skillKey>.apiKey`: ทางลัดสำหรับ skills ที่ประกาศ env var หลัก (plaintext string หรือ object SecretRef)

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    bundledDiscovery: "allowlist",
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- โหลดจาก `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` และ `plugins.load.paths`
- Discovery รองรับ OpenClaw plugins แบบ native รวมถึง bundles ของ Codex ที่เข้ากันได้และ bundles ของ Claude รวมถึง bundles layout เริ่มต้นของ Claude ที่ไม่มี manifest
- **การเปลี่ยนแปลง config ต้อง restart gateway**
- `allow`: allowlist ที่ optional (โหลดเฉพาะ plugins ที่ระบุ) `deny` มีลำดับความสำคัญเหนือกว่า
- `bundledDiscovery`: ค่าเริ่มต้นเป็น `"allowlist"` สำหรับ config ใหม่ ดังนั้น
  `plugins.allow` ที่ไม่ว่างจะ gate bundled provider plugins ด้วย รวมถึง web-search
  runtime providers Doctor เขียน `"compat"` สำหรับ config allowlist legacy
  ที่ migrated แล้ว เพื่อรักษาพฤติกรรม bundled provider ที่มีอยู่จนกว่าคุณจะ opt in
- `plugins.entries.<id>.apiKey`: field ทางลัดของ API key ระดับ plugin (เมื่อ plugin รองรับ)
- `plugins.entries.<id>.env`: map ของ env var ที่ scope ตาม plugin
- `plugins.entries.<id>.hooks.allowPromptInjection`: เมื่อเป็น `false` core จะบล็อก `before_prompt_build` และเพิกเฉยต่อ fields ที่แก้ไข prompt จาก legacy `before_agent_start` ขณะยังคงรักษา legacy `modelOverride` และ `providerOverride` ใช้กับ hooks ของ plugin แบบ native และ directories hook ที่ bundle รองรับให้มา
- `plugins.entries.<id>.hooks.allowConversationAccess`: เมื่อเป็น `true` plugins ที่ไม่ใช่ bundled และเชื่อถือได้อาจอ่านเนื้อหา conversation ดิบจาก typed hooks เช่น `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` และ `agent_end`
- `plugins.entries.<id>.subagent.allowModelOverride`: เชื่อถือ plugin นี้อย่างชัดเจนให้ขอ override `provider` และ `model` แบบราย run สำหรับการรัน subagent เบื้องหลัง
- `plugins.entries.<id>.subagent.allowedModels`: allowlist ที่ optional ของ target `provider/model` แบบ canonical สำหรับ subagent overrides ที่เชื่อถือได้ ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาต model ใดก็ได้
- `plugins.entries.<id>.llm.allowModelOverride`: เชื่อถือ plugin นี้อย่างชัดเจนให้ขอ model overrides สำหรับ `api.runtime.llm.complete`
- `plugins.entries.<id>.llm.allowedModels`: allowlist ที่ optional ของ target `provider/model` แบบ canonical สำหรับ plugin LLM completion overrides ที่เชื่อถือได้ ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาต model ใดก็ได้
- `plugins.entries.<id>.llm.allowAgentIdOverride`: เชื่อถือ plugin นี้อย่างชัดเจนให้รัน `api.runtime.llm.complete` กับ agent id ที่ไม่ใช่ค่าเริ่มต้น
- `plugins.entries.<id>.config`: object config ที่ plugin กำหนด (ตรวจสอบความถูกต้องโดย schema ของ OpenClaw plugin แบบ native เมื่อมี)
- การตั้งค่า account/runtime ของ channel plugin อยู่ภายใต้ `channels.<id>` และควรถูกอธิบายโดย metadata `channelConfigs` ใน manifest ของ plugin เจ้าของ ไม่ใช่โดย registry ของ option กลางของ OpenClaw

### Config ของ Codex harness plugin

`codex` plugin แบบ bundled เป็นเจ้าของการตั้งค่า harness ของ native Codex app-server ภายใต้
`plugins.entries.codex.config` ดู
[ข้อมูลอ้างอิง Codex harness](/th/plugins/codex-harness-reference) สำหรับ config
surface ทั้งหมด และ [Codex harness](/th/plugins/codex-harness) สำหรับ model runtime

`codexPlugins` ใช้เฉพาะกับ sessions ที่เลือก native Codex harness
ไม่ได้เปิดใช้ Codex plugins สำหรับ Pi, การรัน provider ของ OpenAI ปกติ, ACP
conversation bindings หรือ harness ใดๆ ที่ไม่ใช่ Codex

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled`: เปิดใช้งานการรองรับ Plugin/แอป Codex
  แบบเนทีฟสำหรับ Codex harness ค่าเริ่มต้น: `false`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  นโยบายเริ่มต้นสำหรับการกระทำเชิงทำลายของการขอข้อมูลจากแอป Plugin ที่ย้ายมา
  ค่าเริ่มต้น: `false`
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: เปิดใช้งานรายการ
  Plugin ที่ย้ายมาเมื่อ global `codexPlugins.enabled` เป็นจริงด้วย
  ค่าเริ่มต้น: `true` สำหรับรายการที่ระบุชัดเจน
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  ตัวตนของตลาดกลางที่เสถียร V1 รองรับเฉพาะ `"openai-curated"`
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: ตัวตน
  Plugin Codex ที่เสถียรจากการย้ายข้อมูล เช่น `"google-calendar"`
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  การแทนที่นโยบายการกระทำเชิงทำลายต่อ Plugin เมื่อไม่ได้ระบุ จะใช้ค่า global
  `allow_destructive_actions`

`codexPlugins.enabled` คือคำสั่งเปิดใช้งานแบบ global รายการ Plugin ที่ระบุชัดเจน
ซึ่งเขียนโดยการย้ายข้อมูลคือชุดการติดตั้งที่คงทนและชุดที่มีสิทธิ์ซ่อมแซม
ไม่รองรับ `plugins["*"]` ไม่มีสวิตช์ `install` และค่า local
`marketplacePath` ตั้งใจไม่ให้เป็นฟิลด์ config เพราะขึ้นอยู่กับโฮสต์

การตรวจสอบความพร้อมของ `app/list` จะถูกแคชไว้หนึ่งชั่วโมงและรีเฟรช
แบบอะซิงโครนัสเมื่อค้างอยู่ config แอปเธรด Codex จะคำนวณเมื่อสร้างเซสชัน
Codex harness ไม่ใช่ในทุกเทิร์น; ใช้ `/new`, `/reset` หรือรีสตาร์ท Gateway
หลังเปลี่ยน config Plugin แบบเนทีฟ

- `plugins.entries.firecrawl.config.webFetch`: การตั้งค่าผู้ให้บริการ web-fetch ของ Firecrawl
  - `apiKey`: คีย์ API ของ Firecrawl (รับ SecretRef) สำรองไปใช้ `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` แบบเดิม หรือ env var `FIRECRAWL_API_KEY`
  - `baseUrl`: URL ฐาน API ของ Firecrawl (ค่าเริ่มต้น: `https://api.firecrawl.dev`; การแทนที่แบบ self-hosted ต้องชี้ไปยัง endpoint ส่วนตัว/ภายใน)
  - `onlyMainContent`: แยกเฉพาะเนื้อหาหลักจากหน้า (ค่าเริ่มต้น: `true`)
  - `maxAgeMs`: อายุแคชสูงสุดเป็นมิลลิวินาที (ค่าเริ่มต้น: `172800000` / 2 วัน)
  - `timeoutSeconds`: timeout ของคำขอ scrape เป็นวินาที (ค่าเริ่มต้น: `60`)
- `plugins.entries.xai.config.xSearch`: การตั้งค่า xAI X Search (การค้นหาเว็บ Grok)
  - `enabled`: เปิดใช้งานผู้ให้บริการ X Search
  - `model`: โมเดล Grok ที่จะใช้สำหรับการค้นหา (เช่น `"grok-4-1-fast"`)
- `plugins.entries.memory-core.config.dreaming`: การตั้งค่า memory dreaming ดู [Dreaming](/th/concepts/dreaming) สำหรับเฟสและเกณฑ์
  - `enabled`: สวิตช์หลักของ dreaming (ค่าเริ่มต้น `false`)
  - `frequency`: cadence แบบ cron สำหรับการกวาด dreaming แบบเต็มแต่ละครั้ง (ค่าเริ่มต้นคือ `"0 3 * * *"`)
  - `model`: การแทนที่โมเดล subagent Dream Diary แบบไม่บังคับ ต้องใช้ `plugins.entries.memory-core.subagent.allowModelOverride: true`; จับคู่กับ `allowedModels` เพื่อจำกัดเป้าหมาย ข้อผิดพลาดกรณีโมเดลไม่พร้อมใช้งานจะลองใหม่หนึ่งครั้งด้วยโมเดลเริ่มต้นของเซสชัน; ความล้มเหลวด้าน trust หรือ allowlist จะไม่ fallback แบบเงียบ
  - นโยบายเฟสและเกณฑ์เป็นรายละเอียดการติดตั้งใช้งาน (ไม่ใช่คีย์ config ที่แสดงต่อผู้ใช้)
- config หน่วยความจำฉบับเต็มอยู่ใน [เอกสารอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin ใน bundle ของ Claude ที่เปิดใช้งานแล้วยังสามารถให้ค่าเริ่มต้น Pi แบบฝังจาก `settings.json`; OpenClaw ใช้ค่าเหล่านั้นเป็นการตั้งค่า agent ที่ผ่านการ sanitize แล้ว ไม่ใช่เป็น patch config OpenClaw แบบดิบ
- `plugins.slots.memory`: เลือก id ของ Plugin หน่วยความจำที่ active หรือ `"none"` เพื่อปิดใช้งาน Plugin หน่วยความจำ
- `plugins.slots.contextEngine`: เลือก id ของ Plugin context engine ที่ active; ค่าเริ่มต้นเป็น `"legacy"` เว้นแต่คุณจะติดตั้งและเลือก engine อื่น

ดู [Plugins](/th/tools/plugin)

---

## ข้อผูกมัด

`commitments` ควบคุมหน่วยความจำการติดตามผลที่อนุมาน: OpenClaw สามารถตรวจจับการ check-in จากเทิร์นการสนทนาและส่งผ่านการรัน Heartbeat ได้

- `commitments.enabled`: เปิดใช้งานการสกัด LLM แบบซ่อน การจัดเก็บ และการส่งผ่าน Heartbeat สำหรับข้อผูกมัดการติดตามผลที่อนุมาน ค่าเริ่มต้น: `false`
- `commitments.maxPerDay`: จำนวนข้อผูกมัดการติดตามผลที่อนุมานสูงสุดที่ส่งต่อเซสชัน agent ในหนึ่งวันแบบ rolling ค่าเริ่มต้น: `3`

ดู [ข้อผูกมัดที่อนุมาน](/th/concepts/commitments)

---

## เบราว์เซอร์

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` ปิดใช้งาน `act:evaluate` และ `wait --fn`
- `tabCleanup` เรียกคืนแท็บ primary-agent ที่ติดตามไว้หลังเวลาว่างหรือเมื่อ
  เซสชันเกินเพดาน ตั้งค่า `idleMinutes: 0` หรือ `maxTabsPerSession: 0` เพื่อ
  ปิดใช้งานโหมด cleanup แต่ละรายการ
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` จะถูกปิดใช้งานเมื่อไม่ได้ตั้งค่า ดังนั้นการนำทางของเบราว์เซอร์จะเข้มงวดเป็นค่าเริ่มต้น
- ตั้งค่า `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เฉพาะเมื่อคุณตั้งใจเชื่อถือการนำทางเบราว์เซอร์ในเครือข่ายส่วนตัว
- ในโหมดเข้มงวด endpoint ของโปรไฟล์ CDP ระยะไกล (`profiles.*.cdpUrl`) อยู่ภายใต้การบล็อกเครือข่ายส่วนตัวแบบเดียวกันระหว่างการตรวจสอบการเข้าถึง/การค้นพบ
- `ssrfPolicy.allowPrivateNetwork` ยังรองรับเป็น alias แบบเดิม
- ในโหมดเข้มงวด ใช้ `ssrfPolicy.hostnameAllowlist` และ `ssrfPolicy.allowedHostnames` สำหรับข้อยกเว้นที่ระบุชัดเจน
- โปรไฟล์ระยะไกลเป็น attach-only (ปิดใช้งาน start/stop/reset)
- `profiles.*.cdpUrl` รับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) เมื่อคุณต้องการให้ OpenClaw ค้นพบ `/json/version`; ใช้ WS(S)
  เมื่อผู้ให้บริการของคุณให้ URL DevTools WebSocket โดยตรง
- `remoteCdpTimeoutMs` และ `remoteCdpHandshakeTimeoutMs` ใช้กับการเข้าถึง CDP ระยะไกลและ
  `attachOnly` รวมถึงคำขอเปิดแท็บ โปรไฟล์ local loopback
  ที่จัดการไว้จะคงค่าเริ่มต้น CDP แบบ local
- หากบริการ CDP ที่จัดการภายนอกเข้าถึงได้ผ่าน loopback ให้ตั้งค่า
  `attachOnly: true` ของโปรไฟล์นั้น; มิฉะนั้น OpenClaw จะถือว่าพอร์ต loopback เป็น
  โปรไฟล์เบราว์เซอร์ที่จัดการแบบ local และอาจรายงานข้อผิดพลาดความเป็นเจ้าของพอร์ต local
- โปรไฟล์ `existing-session` ใช้ Chrome MCP แทน CDP และสามารถ attach บน
  โฮสต์ที่เลือกหรือผ่าน node เบราว์เซอร์ที่เชื่อมต่ออยู่
- โปรไฟล์ `existing-session` สามารถตั้งค่า `userDataDir` เพื่อชี้เป้าโปรไฟล์
  เบราว์เซอร์ฐาน Chromium เฉพาะ เช่น Brave หรือ Edge
- โปรไฟล์ `existing-session` รักษาข้อจำกัด route ของ Chrome MCP ปัจจุบัน:
  การกระทำแบบ snapshot/ref-driven แทนการกำหนดเป้าหมายด้วย CSS selector, hook อัปโหลดไฟล์เดียว,
  ไม่มีการแทนที่ dialog timeout, ไม่มี `wait --load networkidle` และไม่มี
  `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด หรือการกระทำแบบ batch
- โปรไฟล์ `openclaw` ที่จัดการแบบ local จะกำหนด `cdpPort` และ `cdpUrl` โดยอัตโนมัติ; ตั้งค่า
  `cdpUrl` อย่างชัดเจนเฉพาะสำหรับ CDP ระยะไกล
- โปรไฟล์ที่จัดการแบบ local สามารถตั้งค่า `executablePath` เพื่อแทนที่
  `browser.executablePath` แบบ global สำหรับโปรไฟล์นั้น ใช้สิ่งนี้เพื่อรันโปรไฟล์หนึ่งใน
  Chrome และอีกโปรไฟล์ใน Brave
- โปรไฟล์ที่จัดการแบบ local ใช้ `browser.localLaunchTimeoutMs` สำหรับการค้นพบ HTTP ของ Chrome CDP
  หลังเริ่ม process และใช้ `browser.localCdpReadyTimeoutMs` สำหรับความพร้อมของ websocket CDP
  หลังเปิดใช้งาน เพิ่มค่าเหล่านี้บนโฮสต์ที่ช้ากว่า ซึ่ง Chrome
  เริ่มได้สำเร็จแต่การตรวจสอบความพร้อมแข่งกับช่วงเริ่มต้น ทั้งสองค่าต้องเป็น
  จำนวนเต็มบวกไม่เกิน `120000` ms; ค่า config ที่ไม่ถูกต้องจะถูกปฏิเสธ
- ลำดับการตรวจจับอัตโนมัติ: เบราว์เซอร์เริ่มต้นหากเป็นฐาน Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary
- `browser.executablePath` และ `browser.profiles.<name>.executablePath` ทั้งคู่
  รับ `~` และ `~/...` สำหรับไดเรกทอรี home ของ OS ก่อนเปิด Chromium
  `userDataDir` ต่อโปรไฟล์บนโปรไฟล์ `existing-session` ก็จะขยาย tilde ด้วย
- บริการควบคุม: loopback เท่านั้น (พอร์ตได้มาจาก `gateway.port`, ค่าเริ่มต้น `18791`)
- `extraArgs` ต่อท้าย flag เปิดใช้งานเพิ่มเติมให้การเริ่ม Chromium แบบ local (เช่น
  `--disable-gpu`, การกำหนดขนาดหน้าต่าง หรือ flag debug)

---

## ส่วนติดต่อผู้ใช้

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: สีเน้นสำหรับ chrome ของ UI แอปเนทีฟ (สี tint ของฟอง Talk Mode เป็นต้น)
- `assistant`: การแทนที่ตัวตนของ Control UI สำรองไปใช้ตัวตน agent ที่ active

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // chatMessageMaxWidth: "min(1280px, 82%)", // optional grouped chat message max-width
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="รายละเอียดฟิลด์ Gateway">

- `mode`: `local` (เรียกใช้ Gateway) หรือ `remote` (เชื่อมต่อกับ Gateway ระยะไกล) Gateway จะปฏิเสธการเริ่มทำงานเว้นแต่จะเป็น `local`
- `port`: พอร์ตมัลติเพล็กซ์เดียวสำหรับ WS + HTTP ลำดับความสำคัญ: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`
- `bind`: `auto`, `loopback` (ค่าเริ่มต้น), `lan` (`0.0.0.0`), `tailnet` (เฉพาะ IP ของ Tailscale), หรือ `custom`
- **นามแฝง bind แบบเดิม**: ใช้ค่าโหมด bind ใน `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`) ไม่ใช่นามแฝงโฮสต์ (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`)
- **หมายเหตุ Docker**: bind ค่าเริ่มต้น `loopback` จะรับฟังบน `127.0.0.1` ภายในคอนเทนเนอร์ เมื่อใช้เครือข่าย Docker bridge (`-p 18789:18789`) ทราฟฟิกจะเข้ามาทาง `eth0` ดังนั้น Gateway จะเข้าถึงไม่ได้ ใช้ `--network host` หรือตั้งค่า `bind: "lan"` (หรือ `bind: "custom"` พร้อม `customBindHost: "0.0.0.0"`) เพื่อรับฟังบนทุกอินเทอร์เฟซ
- **การยืนยันตัวตน**: จำเป็นโดยค่าเริ่มต้น bind ที่ไม่ใช่ loopback ต้องใช้การยืนยันตัวตนของ Gateway ในทางปฏิบัติหมายถึงโทเค็น/รหัสผ่านร่วมกัน หรือ reverse proxy ที่รับรู้ตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"` วิซาร์ด onboarding จะสร้างโทเค็นโดยค่าเริ่มต้น
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) ให้ตั้งค่า `gateway.auth.mode` เป็น `token` หรือ `password` อย่างชัดเจน โฟลว์เริ่มต้นระบบและติดตั้ง/ซ่อมแซมบริการจะล้มเหลวเมื่อกำหนดค่าทั้งสองอย่างแต่ไม่ได้ตั้งค่า mode
- `gateway.auth.mode: "none"`: โหมดไม่ต้องยืนยันตัวตนแบบชัดเจน ใช้เฉพาะสำหรับการตั้งค่า local loopback ที่เชื่อถือได้เท่านั้น โดยตั้งใจไม่เสนอในพรอมป์ onboarding
- `gateway.auth.mode: "trusted-proxy"`: มอบหมายการยืนยันตัวตนของเบราว์เซอร์/ผู้ใช้ให้ reverse proxy ที่รับรู้ตัวตน และเชื่อถือส่วนหัวตัวตนจาก `gateway.trustedProxies` (ดู [การยืนยันตัวตนผ่าน Trusted Proxy](/th/gateway/trusted-proxy-auth)) โหมดนี้คาดหวังแหล่งที่มาของพร็อกซีที่ **ไม่ใช่ loopback** โดยค่าเริ่มต้น reverse proxy แบบ loopback บนโฮสต์เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน ตัวเรียกภายในบนโฮสต์เดียวกันสามารถใช้ `gateway.auth.password` เป็น fallback โดยตรงแบบ local ได้ `gateway.auth.token` ยังคงใช้ร่วมกับโหมด trusted-proxy ไม่ได้
- `gateway.auth.allowTailscale`: เมื่อเป็น `true` ส่วนหัวตัวตนของ Tailscale Serve สามารถตอบสนองการยืนยันตัวตนของ Control UI/WebSocket ได้ (ตรวจสอบผ่าน `tailscale whois`) ปลายทาง HTTP API **ไม่** ใช้การยืนยันตัวตนผ่านส่วนหัว Tailscale นั้น แต่จะใช้โหมดการยืนยันตัวตน HTTP ปกติของ Gateway แทน โฟลว์แบบไม่มีโทเค็นนี้ถือว่าโฮสต์ Gateway เชื่อถือได้ ค่าเริ่มต้นเป็น `true` เมื่อ `tailscale.mode = "serve"`
- `gateway.auth.rateLimit`: ตัวจำกัดการยืนยันตัวตนล้มเหลวแบบไม่บังคับ ใช้ต่อ IP ไคลเอนต์และต่อขอบเขตการยืนยันตัวตน (shared-secret และ device-token ถูกติดตามแยกกัน) ความพยายามที่ถูกบล็อกจะส่งกลับ `429` + `Retry-After`
  - บนเส้นทาง Control UI ของ Tailscale Serve แบบ async ความพยายามที่ล้มเหลวสำหรับ `{scope, clientIp}` เดียวกันจะถูกทำให้เป็นลำดับก่อนเขียนความล้มเหลว ดังนั้นความพยายามผิดพร้อมกันจากไคลเอนต์เดียวกันอาจทำให้ตัวจำกัดถูกกระตุ้นในคำขอที่สอง แทนที่ทั้งสองคำขอจะแข่งผ่านไปเป็นเพียงความไม่ตรงกันธรรมดา
  - `gateway.auth.rateLimit.exemptLoopback` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เมื่อคุณตั้งใจให้ทราฟฟิก localhost ถูกจำกัดอัตราด้วย (สำหรับการตั้งค่าทดสอบหรือการปรับใช้พร็อกซีแบบเข้มงวด)
- ความพยายามยืนยันตัวตน WS ที่มีต้นทางจากเบราว์เซอร์จะถูกจำกัดอัตราเสมอ โดยปิดการยกเว้น loopback (การป้องกันเชิงลึกต่อการ brute force localhost จากเบราว์เซอร์)
- บน loopback การล็อกเอาต์ที่มีต้นทางจากเบราว์เซอร์เหล่านั้นจะแยกตามค่า `Origin`
  ที่ทำให้เป็นรูปแบบมาตรฐานแล้ว ดังนั้นความล้มเหลวซ้ำจากต้นทาง localhost หนึ่งจะไม่ล็อกเอาต์
  ต้นทางอื่นโดยอัตโนมัติ
- `tailscale.mode`: `serve` (เฉพาะ tailnet, bind แบบ loopback) หรือ `funnel` (สาธารณะ, ต้องยืนยันตัวตน)
- `tailscale.preserveFunnel`: เมื่อเป็น `true` และ `tailscale.mode = "serve"` OpenClaw
  จะตรวจสอบ `tailscale funnel status` ก่อนปรับใช้ Serve ซ้ำตอนเริ่มระบบ และข้าม
  หากเส้นทาง Funnel ที่กำหนดค่าจากภายนอกครอบคลุมพอร์ต Gateway อยู่แล้ว
  ค่าเริ่มต้น `false`
- `controlUi.allowedOrigins`: allowlist ต้นทางเบราว์เซอร์แบบชัดเจนสำหรับการเชื่อมต่อ WebSocket ของ Gateway จำเป็นเมื่อคาดว่าจะมีไคลเอนต์เบราว์เซอร์จากต้นทางที่ไม่ใช่ loopback
- `controlUi.chatMessageMaxWidth`: max-width แบบไม่บังคับสำหรับข้อความแชต Control UI ที่จัดกลุ่ม รับค่าความกว้าง CSS ที่มีข้อจำกัด เช่น `960px`, `82%`, `min(1280px, 82%)`, และ `calc(100% - 2rem)`
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: โหมดอันตรายที่เปิดใช้ fallback ต้นทางจากส่วนหัว Host สำหรับการปรับใช้ที่ตั้งใจพึ่งพานโยบายต้นทางจากส่วนหัว Host
- `remote.transport`: `ssh` (ค่าเริ่มต้น) หรือ `direct` (ws/wss) สำหรับ `direct`, `remote.url` ต้องเป็น `ws://` หรือ `wss://`
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override ฉุกเฉินฝั่งไคลเอนต์ผ่านสภาพแวดล้อมของกระบวนการ
  ที่อนุญาต `ws://` แบบ plaintext ไปยัง IP เครือข่ายส่วนตัวที่เชื่อถือได้
  ค่าเริ่มต้นยังคงอนุญาต plaintext เฉพาะ loopback ไม่มีค่าเทียบเท่าใน `openclaw.json`
  และการกำหนดค่าเครือข่ายส่วนตัวของเบราว์เซอร์ เช่น
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` จะไม่ส่งผลต่อไคลเอนต์ WebSocket
  ของ Gateway
- `gateway.remote.token` / `.password` เป็นฟิลด์ข้อมูลรับรองไคลเอนต์ระยะไกล ฟิลด์เหล่านี้ไม่ได้กำหนดค่าการยืนยันตัวตนของ Gateway ด้วยตัวเอง
- `gateway.push.apns.relay.baseUrl`: URL ฐาน HTTPS สำหรับ relay APNs ภายนอกที่ใช้โดยบิลด์ iOS อย่างเป็นทางการ/TestFlight หลังจากเผยแพร่การลงทะเบียนที่พึ่งพา relay ไปยัง Gateway URL นี้ต้องตรงกับ URL relay ที่คอมไพล์เข้าไปในบิลด์ iOS
- `gateway.push.apns.relay.timeoutMs`: timeout การส่งจาก Gateway ไปยัง relay หน่วยเป็นมิลลิวินาที ค่าเริ่มต้นเป็น `10000`
- การลงทะเบียนที่พึ่งพา relay จะถูกมอบหมายให้ตัวตน Gateway เฉพาะ แอป iOS ที่จับคู่จะดึง `gateway.identity.get` รวมตัวตนนั้นในการลงทะเบียน relay และส่งต่อสิทธิ์การส่งที่ผูกกับการลงทะเบียนให้ Gateway Gateway อื่นไม่สามารถนำการลงทะเบียนที่จัดเก็บไว้นั้นไปใช้ซ้ำได้
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env ชั่วคราวสำหรับการกำหนดค่า relay ด้านบน
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: ช่องทางเลี่ยงสำหรับการพัฒนาเท่านั้นสำหรับ URL relay HTTP แบบ loopback URL relay สำหรับ production ควรคงอยู่บน HTTPS
- `gateway.handshakeTimeoutMs`: timeout การจับมือ WebSocket ของ Gateway ก่อนยืนยันตัวตน หน่วยเป็นมิลลิวินาที ค่าเริ่มต้น: `15000` `OPENCLAW_HANDSHAKE_TIMEOUT_MS` มีลำดับความสำคัญเมื่อถูกตั้งค่า เพิ่มค่านี้บนโฮสต์ที่มีโหลดหรือกำลังต่ำ ซึ่งไคลเอนต์ local สามารถเชื่อมต่อได้ขณะที่ช่วงอุ่นเครื่องตอนเริ่มระบบยังไม่เสถียร
- `gateway.channelHealthCheckMinutes`: ช่วงเวลาตัวตรวจสุขภาพช่องทาง หน่วยเป็นนาที ตั้ง `0` เพื่อปิดการรีสตาร์ทโดยตัวตรวจสุขภาพทั่วทั้งระบบ ค่าเริ่มต้น: `5`
- `gateway.channelStaleEventThresholdMinutes`: เกณฑ์ socket ค้าง หน่วยเป็นนาที ควรให้ค่านี้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes` ค่าเริ่มต้น: `30`
- `gateway.channelMaxRestartsPerHour`: จำนวนสูงสุดของการรีสตาร์ทโดยตัวตรวจสุขภาพต่อช่องทาง/บัญชีในหนึ่งชั่วโมงแบบ rolling ค่าเริ่มต้น: `10`
- `channels.<provider>.healthMonitor.enabled`: การปิดการรีสตาร์ทโดยตัวตรวจสุขภาพแบบรายช่องทาง ขณะที่ยังเปิดตัวตรวจสุขภาพทั่วทั้งระบบไว้
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override รายบัญชีสำหรับช่องทางหลายบัญชี เมื่อตั้งค่าแล้ว จะมีลำดับความสำคัญเหนือ override ระดับช่องทาง
- เส้นทางการเรียก Gateway แบบ local สามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
- หากกำหนดค่า `gateway.auth.token` / `gateway.auth.password` อย่างชัดเจนผ่าน SecretRef และแก้ค่าไม่ได้ การแก้ค่าจะล้มเหลวแบบปิด (ไม่มี fallback ระยะไกลมาบดบัง)
- `trustedProxies`: IP ของ reverse proxy ที่ยุติ TLS หรือแทรกส่วนหัว forwarded-client ระบุเฉพาะพร็อกซีที่คุณควบคุม รายการ loopback ยังใช้ได้สำหรับการตั้งค่าพร็อกซี/การตรวจจับ local บนโฮสต์เดียวกัน (เช่น Tailscale Serve หรือ reverse proxy แบบ local) แต่รายการเหล่านี้ **ไม่ได้** ทำให้คำขอ loopback มีสิทธิ์ใช้ `gateway.auth.mode: "trusted-proxy"`
- `allowRealIpFallback`: เมื่อเป็น `true` Gateway จะยอมรับ `X-Real-IP` หากไม่มี `X-Forwarded-For` ค่าเริ่มต้น `false` เพื่อพฤติกรรม fail-closed
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist CIDR/IP แบบไม่บังคับสำหรับอนุมัติการจับคู่อุปกรณ์ node ครั้งแรกโดยอัตโนมัติเมื่อไม่มีขอบเขตที่ร้องขอ ปิดใช้งานเมื่อไม่ได้ตั้งค่า สิ่งนี้ไม่อนุมัติการจับคู่ operator/browser/Control UI/WebChat โดยอัตโนมัติ และไม่อนุมัติการอัปเกรดบทบาท ขอบเขต เมตาดาตา หรือ public-key โดยอัตโนมัติ
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: การกำหนด allow/deny ทั่วทั้งระบบสำหรับคำสั่ง node ที่ประกาศไว้หลังการจับคู่และการประเมิน allowlist ของแพลตฟอร์ม ใช้ `allowCommands` เพื่อเลือกใช้คำสั่ง node อันตราย เช่น `camera.snap`, `camera.clip`, และ `screen.record`; `denyCommands` จะลบคำสั่งออกแม้ว่า default ของแพลตฟอร์มหรือ allow แบบชัดเจนจะรวมคำสั่งนั้นไว้ก็ตาม หลังจาก node เปลี่ยนรายการคำสั่งที่ประกาศ ให้ปฏิเสธและอนุมัติการจับคู่อุปกรณ์นั้นใหม่เพื่อให้ Gateway จัดเก็บ snapshot คำสั่งที่อัปเดต
- `gateway.tools.deny`: ชื่อเครื่องมือเพิ่มเติมที่ถูกบล็อกสำหรับ HTTP `POST /tools/invoke` (ขยายรายการ deny ค่าเริ่มต้น)
- `gateway.tools.allow`: ลบชื่อเครื่องมือออกจากรายการ deny ค่าเริ่มต้นของ HTTP

</Accordion>

### ปลายทางที่เข้ากันได้กับ OpenAI

- Chat Completions: ปิดใช้งานโดยค่าเริ่มต้น เปิดใช้ด้วย `gateway.http.endpoints.chatCompletions.enabled: true`
- Responses API: `gateway.http.endpoints.responses.enabled`
- การเสริมความปลอดภัยอินพุต URL ของ Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlist ว่างจะถือว่าไม่ได้ตั้งค่า; ใช้ `gateway.http.endpoints.responses.files.allowUrl=false`
    และ/หรือ `gateway.http.endpoints.responses.images.allowUrl=false` เพื่อปิดการดึง URL
- ส่วนหัวเสริมความปลอดภัยของ response แบบไม่บังคับ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ตั้งค่าเฉพาะสำหรับต้นทาง HTTPS ที่คุณควบคุม; ดู [การยืนยันตัวตนผ่าน Trusted Proxy](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### การแยกหลายอินสแตนซ์

เรียกใช้ Gateway หลายตัวบนโฮสต์เดียวด้วยพอร์ตและไดเรกทอรีสถานะที่ไม่ซ้ำกัน:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

แฟล็กอำนวยความสะดวก: `--dev` (ใช้ `~/.openclaw-dev` + พอร์ต `19001`), `--profile <name>` (ใช้ `~/.openclaw-<name>`)

ดู [Gateway หลายตัว](/th/gateway/multiple-gateways)

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: เปิดใช้การยุติ TLS ที่ตัวรับฟังของ Gateway (HTTPS/WSS) (ค่าเริ่มต้น: `false`)
- `autoGenerate`: สร้างคู่ cert/key แบบ self-signed สำหรับ local โดยอัตโนมัติเมื่อไม่ได้กำหนดค่าไฟล์อย่างชัดเจน; ใช้สำหรับ local/dev เท่านั้น
- `certPath`: พาธระบบไฟล์ไปยังไฟล์ใบรับรอง TLS
- `keyPath`: พาธระบบไฟล์ไปยังไฟล์ private key ของ TLS; ควรจำกัดสิทธิ์การเข้าถึง
- `caPath`: พาธ bundle CA แบบไม่บังคับสำหรับการตรวจสอบไคลเอนต์หรือ trust chain แบบกำหนดเอง

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: ควบคุมวิธีนำการแก้ไข config ไปใช้ระหว่าง runtime
  - `"off"`: เพิกเฉยต่อการแก้ไขแบบ live; การเปลี่ยนแปลงต้องรีสตาร์ทอย่างชัดเจน
  - `"restart"`: รีสตาร์ทกระบวนการ Gateway เสมอเมื่อ config เปลี่ยน
  - `"hot"`: ใช้การเปลี่ยนแปลงภายในกระบวนการโดยไม่รีสตาร์ท
  - `"hybrid"` (ค่าเริ่มต้น): ลอง hot reload ก่อน; fallback เป็นการรีสตาร์ทหากจำเป็น
- `debounceMs`: หน้าต่าง debounce หน่วยเป็น ms ก่อนนำการเปลี่ยนแปลง config ไปใช้ (จำนวนเต็มไม่ติดลบ)
- `deferralTimeoutMs`: เวลาสูงสุดแบบไม่บังคับ หน่วยเป็น ms เพื่อรอการดำเนินการที่กำลังทำงานอยู่ก่อนบังคับรีสตาร์ทหรือ hot reload ช่องทาง ไม่ระบุเพื่อใช้การรอแบบมีขอบเขตค่าเริ่มต้น (`300000`); ตั้ง `0` เพื่อรออย่างไม่มีกำหนดและบันทึกคำเตือนยังค้างอยู่เป็นระยะ

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

การยืนยันตัวตน: `Authorization: Bearer <token>` หรือ `x-openclaw-token: <token>`.
โทเค็น hook ในสตริงคำค้นจะถูกปฏิเสธ

หมายเหตุด้านการตรวจสอบความถูกต้องและความปลอดภัย:

- `hooks.enabled=true` ต้องมี `hooks.token` ที่ไม่ว่าง
- `hooks.token` ต้อง **แตกต่าง** จาก `gateway.auth.token`; การใช้โทเค็น Gateway ซ้ำจะถูกปฏิเสธ
- `hooks.path` เป็น `/` ไม่ได้; ให้ใช้พาธย่อยเฉพาะ เช่น `/hooks`
- หาก `hooks.allowRequestSessionKey=true` ให้จำกัด `hooks.allowedSessionKeyPrefixes` (ตัวอย่างเช่น `["hook:"]`)
- หาก mapping หรือ preset ใช้ `sessionKey` แบบเทมเพลต ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` และ `hooks.allowRequestSessionKey=true` คีย์ mapping แบบคงที่ไม่ต้องใช้การเลือกเปิดใช้งานนี้

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` จากเพย์โหลดคำขอจะยอมรับเฉพาะเมื่อ `hooks.allowRequestSessionKey=true` (ค่าเริ่มต้น: `false`)
- `POST /hooks/<name>` → แก้ไขผ่าน `hooks.mappings`
  - ค่า `sessionKey` ของ mapping ที่เรนเดอร์จากเทมเพลตจะถือว่าเป็นค่าที่จัดหาจากภายนอก และต้องใช้ `hooks.allowRequestSessionKey=true` ด้วยเช่นกัน

<Accordion title="Mapping details">

- `match.path` ตรงกับพาธย่อยหลัง `/hooks` (เช่น `/hooks/gmail` → `gmail`)
- `match.source` ตรงกับฟิลด์ในเพย์โหลดสำหรับพาธทั่วไป
- เทมเพลตอย่าง `{{messages[0].subject}}` อ่านจากเพย์โหลด
- `transform` สามารถชี้ไปยังโมดูล JS/TS ที่ส่งคืนการกระทำ hook
  - `transform.module` ต้องเป็นพาธสัมพัทธ์และอยู่ภายใน `hooks.transformsDir` (พาธแบบสัมบูรณ์และการไล่ข้ามไดเรกทอรีจะถูกปฏิเสธ)
  - เก็บ `hooks.transformsDir` ไว้ใต้ `~/.openclaw/hooks/transforms`; ไดเรกทอรี Skills ของ workspace จะถูกปฏิเสธ หาก `openclaw doctor` รายงานว่าพาธนี้ไม่ถูกต้อง ให้ย้ายโมดูล transform เข้าไปในไดเรกทอรี transforms ของ hooks หรือลบ `hooks.transformsDir`
- `agentId` กำหนดเส้นทางไปยัง agent เฉพาะ; ID ที่ไม่รู้จักจะถอยกลับไปใช้ค่าเริ่มต้น
- `allowedAgentIds`: จำกัดการกำหนดเส้นทางแบบชัดเจน (`*` หรือไม่ระบุ = อนุญาตทั้งหมด, `[]` = ปฏิเสธทั้งหมด)
- `defaultSessionKey`: คีย์ session แบบคงที่ที่ไม่บังคับสำหรับการรัน agent hook โดยไม่มี `sessionKey` แบบชัดเจน
- `allowRequestSessionKey`: อนุญาตให้ผู้เรียก `/hooks/agent` และคีย์ session ของ mapping ที่ขับเคลื่อนด้วยเทมเพลตตั้งค่า `sessionKey` (ค่าเริ่มต้น: `false`)
- `allowedSessionKeyPrefixes`: รายการอนุญาต prefix ที่ไม่บังคับสำหรับค่า `sessionKey` แบบชัดเจน (คำขอ + mapping) เช่น `["hook:"]` ค่านี้จะกลายเป็นสิ่งจำเป็นเมื่อ mapping หรือ preset ใดใช้ `sessionKey` แบบเทมเพลต
- `deliver: true` ส่งคำตอบสุดท้ายไปยัง channel; `channel` มีค่าเริ่มต้นเป็น `last`
- `model` override LLM สำหรับการรัน hook นี้ (ต้องได้รับอนุญาตหากตั้งค่า catalog ของ model ไว้)

</Accordion>

### การผสานรวม Gmail

- preset Gmail ในตัวใช้ `sessionKey: "hook:gmail:{{messages[0].id}}"`
- หากคุณคงการกำหนดเส้นทางต่อข้อความนั้นไว้ ให้ตั้งค่า `hooks.allowRequestSessionKey: true` และจำกัด `hooks.allowedSessionKeyPrefixes` ให้ตรงกับ namespace ของ Gmail ตัวอย่างเช่น `["hook:", "hook:gmail:"]`
- หากคุณต้องใช้ `hooks.allowRequestSessionKey: false` ให้ override preset ด้วย `sessionKey` แบบคงที่แทนค่าเริ่มต้นแบบเทมเพลต

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway เริ่ม `gog gmail watch serve` อัตโนมัติเมื่อบูตหากมีการกำหนดค่าไว้ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อปิดใช้งาน
- อย่ารัน `gog gmail watch serve` แยกต่างหากควบคู่กับ Gateway

---

## โฮสต์ Plugin Canvas

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- ให้บริการ HTML/CSS/JS ที่ agent แก้ไขได้และ A2UI ผ่าน HTTP ใต้พอร์ต Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- เฉพาะภายในเครื่อง: คง `gateway.bind: "loopback"` ไว้ (ค่าเริ่มต้น)
- การ bind แบบไม่ใช่ loopback: เส้นทาง canvas ต้องใช้การยืนยันตัวตนของ Gateway (โทเค็น/รหัสผ่าน/trusted-proxy) เหมือนพื้นผิว HTTP อื่นของ Gateway
- โดยปกติ Node WebViews จะไม่ส่ง header การยืนยันตัวตน; หลังจาก node ถูกจับคู่และเชื่อมต่อแล้ว Gateway จะประกาศ URL ความสามารถที่กำหนดขอบเขตตาม node สำหรับการเข้าถึง canvas/A2UI
- URL ความสามารถผูกกับ session WS ของ node ที่ใช้งานอยู่และหมดอายุอย่างรวดเร็ว ไม่มีการใช้ fallback ตาม IP
- ฉีดไคลเอนต์ live-reload เข้าไปใน HTML ที่ให้บริการ
- สร้าง `index.html` เริ่มต้นอัตโนมัติเมื่อว่าง
- ให้บริการ A2UI ที่ `/__openclaw__/a2ui/` ด้วย
- การเปลี่ยนแปลงต้องรีสตาร์ต Gateway
- ปิดใช้งาน live reload สำหรับไดเรกทอรีขนาดใหญ่หรือข้อผิดพลาด `EMFILE`

---

## การค้นพบ

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (ค่าเริ่มต้นเมื่อเปิดใช้งาน Plugin `bonjour` ที่บันเดิลมา): ไม่ใส่ `cliPath` + `sshPort` ในระเบียน TXT
- `full`: ใส่ `cliPath` + `sshPort`; การโฆษณา LAN multicast ยังต้องเปิดใช้งาน Plugin `bonjour` ที่บันเดิลมา
- `off`: ระงับการโฆษณา LAN multicast โดยไม่เปลี่ยนการเปิดใช้งาน Plugin
- Plugin `bonjour` ที่บันเดิลมาจะเริ่มอัตโนมัติบนโฮสต์ macOS และต้องเลือกเปิดใช้งานบน Linux, Windows และการปรับใช้ Gateway แบบ containerized
- ชื่อโฮสต์มีค่าเริ่มต้นเป็นชื่อโฮสต์ของระบบเมื่อเป็น label DNS ที่ถูกต้อง โดยถอยกลับไปใช้ `openclaw` override ด้วย `OPENCLAW_MDNS_HOSTNAME`

### พื้นที่กว้าง (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

เขียน zone DNS-SD แบบ unicast ใต้ `~/.openclaw/dns/` สำหรับการค้นพบข้ามเครือข่าย ให้จับคู่กับเซิร์ฟเวอร์ DNS (แนะนำ CoreDNS) + Tailscale split DNS

ตั้งค่า: `openclaw dns setup --apply`.

---

## สภาพแวดล้อม

### `env` (ตัวแปรสภาพแวดล้อมแบบอินไลน์)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- ตัวแปรสภาพแวดล้อมแบบอินไลน์จะถูกนำไปใช้เฉพาะเมื่อสภาพแวดล้อมของโปรเซสไม่มีคีย์นั้น
- ไฟล์ `.env`: CWD `.env` + `~/.openclaw/.env` (ทั้งสองไม่เขียนทับตัวแปรที่มีอยู่)
- `shellEnv`: นำเข้าคีย์ที่คาดไว้แต่ขาดหายจากโปรไฟล์เชลล์สำหรับล็อกอินของคุณ
- ดู [สภาพแวดล้อม](/th/help/environment) สำหรับลำดับความสำคัญทั้งหมด

### การแทนที่ตัวแปรสภาพแวดล้อม

อ้างอิงตัวแปรสภาพแวดล้อมในสตริงการกำหนดค่าใดก็ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- จับคู่เฉพาะชื่อที่เป็นตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- ตัวแปรที่ขาดหาย/ว่างเปล่าจะทำให้เกิดข้อผิดพลาดเมื่อโหลดการกำหนดค่า
- เอสเคปด้วย `$${VAR}` เพื่อใช้ `${VAR}` ตามตัวอักษร
- ทำงานร่วมกับ `$include`

---

## ความลับ

การอ้างอิงความลับเป็นแบบเพิ่มเติม: ค่าข้อความธรรมดายังคงใช้ได้

### `SecretRef`

ใช้รูปทรงออบเจ็กต์เดียว:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

การตรวจสอบความถูกต้อง:

- รูปแบบ `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- รูปแบบ id ของ `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id ของ `source: "file"`: JSON pointer แบบสัมบูรณ์ (เช่น `"/providers/openai/apiKey"`)
- รูปแบบ id ของ `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id ของ `source: "exec"` ต้องไม่มีส่วนเส้นทางที่คั่นด้วยสแลชเป็น `.` หรือ `..` (เช่น `a/../b` จะถูกปฏิเสธ)

### พื้นผิวข้อมูลรับรองที่รองรับ

- เมทริกซ์ตามแบบบัญญัติ: [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
- เป้าหมาย `secrets apply` รองรับเส้นทางข้อมูลรับรอง `openclaw.json`
- การอ้างอิงใน `auth-profiles.json` ถูกรวมอยู่ในการแก้ค่าเวลารันและขอบเขตการตรวจสอบ

### การกำหนดค่า provider สำหรับความลับ

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

หมายเหตุ:

- provider `file` รองรับ `mode: "json"` และ `mode: "singleValue"` (`id` ต้องเป็น `"value"` ในโหมด singleValue)
- เส้นทางของ provider แบบ file และ exec จะล้มเหลวแบบปิดเมื่อไม่สามารถตรวจสอบ Windows ACL ได้ ตั้งค่า `allowInsecurePath: true` เฉพาะสำหรับเส้นทางที่เชื่อถือได้ซึ่งไม่สามารถตรวจสอบได้
- provider `exec` ต้องใช้เส้นทาง `command` แบบสัมบูรณ์ และใช้เพย์โหลดโปรโตคอลบน stdin/stdout
- โดยค่าเริ่มต้น เส้นทางคำสั่งที่เป็น symlink จะถูกปฏิเสธ ตั้งค่า `allowSymlinkCommand: true` เพื่ออนุญาตเส้นทาง symlink พร้อมตรวจสอบเส้นทางเป้าหมายที่แก้แล้ว
- หากกำหนดค่า `trustedDirs` ไว้ การตรวจสอบ trusted-dir จะใช้กับเส้นทางเป้าหมายที่แก้แล้ว
- สภาพแวดล้อมของ child ของ `exec` มีค่าน้อยที่สุดโดยค่าเริ่มต้น; ส่งตัวแปรที่ต้องใช้โดยระบุอย่างชัดเจนด้วย `passEnv`
- การอ้างอิงความลับจะถูกแก้ค่าในช่วงเปิดใช้งานเป็นสแนปช็อตในหน่วยความจำ จากนั้นเส้นทางคำขอจะอ่านเฉพาะสแนปช็อตนั้น
- การกรอง active-surface ใช้ระหว่างการเปิดใช้งาน: การอ้างอิงที่แก้ค่าไม่ได้บนพื้นผิวที่เปิดใช้งานจะทำให้การเริ่มต้น/โหลดใหม่ล้มเหลว ส่วนพื้นผิวที่ไม่ทำงานจะถูกข้ามพร้อมข้อมูลวินิจฉัย

---

## พื้นที่จัดเก็บการยืนยันตัวตน

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- โปรไฟล์ต่อ agent จะถูกจัดเก็บที่ `<agentDir>/auth-profiles.json`
- `auth-profiles.json` รองรับการอ้างอิงระดับค่า (`keyRef` สำหรับ `api_key`, `tokenRef` สำหรับ `token`) สำหรับโหมดข้อมูลรับรองแบบคงที่
- แมป `auth-profiles.json` แบบ flat รุ่นเก่า เช่น `{ "provider": { "apiKey": "..." } }` ไม่ใช่รูปแบบเวลารัน; `openclaw doctor --fix` จะเขียนใหม่เป็นโปรไฟล์ API-key แบบ `provider:default` ตามแบบบัญญัติ พร้อมข้อมูลสำรอง `.legacy-flat.*.bak`
- โปรไฟล์โหมด OAuth (`auth.profiles.<id>.mode = "oauth"`) ไม่รองรับข้อมูลรับรอง auth-profile ที่ใช้ SecretRef
- ข้อมูลรับรองเวลารันแบบคงที่มาจากสแนปช็อตที่แก้ค่าแล้วในหน่วยความจำ; รายการ `auth.json` แบบคงที่รุ่นเก่าจะถูกล้างเมื่อค้นพบ
- การนำเข้า OAuth รุ่นเก่ามาจาก `~/.openclaw/credentials/oauth.json`
- ดู [OAuth](/th/concepts/oauth)
- พฤติกรรมเวลารันของความลับและเครื่องมือ `audit/configure/apply`: [การจัดการความลับ](/th/gateway/secrets)

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: ค่าหน่วงถอยกลับพื้นฐานเป็นชั่วโมงเมื่อโปรไฟล์ล้มเหลวจากข้อผิดพลาดด้านการเรียกเก็บเงิน/เครดิตไม่เพียงพอจริง
  (ค่าเริ่มต้น: `5`) ข้อความการเรียกเก็บเงินที่ชัดเจนยังสามารถเข้ามาที่นี่ได้แม้ในคำตอบ `401`/`403` แต่ตัวจับคู่ข้อความเฉพาะผู้ให้บริการ
  จะยังจำกัดขอบเขตอยู่กับผู้ให้บริการที่เป็นเจ้าของตัวจับคู่นั้น (เช่น OpenRouter
  `Key limit exceeded`) ข้อความ HTTP `402` แบบลองใหม่ได้ที่เกี่ยวกับหน้าต่างการใช้งาน หรือข้อความขีดจำกัดการใช้จ่ายของ
  องค์กร/เวิร์กสเปซ จะยังอยู่ในเส้นทาง `rate_limit`
  แทน
- `billingBackoffHoursByProvider`: การ override จำนวนชั่วโมงหน่วงถอยกลับด้านการเรียกเก็บเงินรายผู้ให้บริการแบบไม่บังคับ
- `billingMaxHours`: เพดานเป็นชั่วโมงสำหรับการเติบโตแบบเอ็กซ์โปเนนเชียลของการหน่วงถอยกลับด้านการเรียกเก็บเงิน (ค่าเริ่มต้น: `24`)
- `authPermanentBackoffMinutes`: ค่าหน่วงถอยกลับพื้นฐานเป็นนาทีสำหรับความล้มเหลว `auth_permanent` ที่มีความเชื่อมั่นสูง (ค่าเริ่มต้น: `10`)
- `authPermanentMaxMinutes`: เพดานเป็นนาทีสำหรับการเติบโตของการหน่วงถอยกลับ `auth_permanent` (ค่าเริ่มต้น: `60`)
- `failureWindowHours`: หน้าต่างแบบเลื่อนเป็นชั่วโมงที่ใช้สำหรับตัวนับการหน่วงถอยกลับ (ค่าเริ่มต้น: `24`)
- `overloadedProfileRotations`: จำนวนสูงสุดของการหมุนเวียนโปรไฟล์ยืนยันตัวตนในผู้ให้บริการเดียวกันสำหรับข้อผิดพลาดโหลดเกิน ก่อนเปลี่ยนไปใช้โมเดลสำรอง (ค่าเริ่มต้น: `1`) รูปแบบผู้ให้บริการไม่ว่าง เช่น `ModelNotReadyException` จะเข้ามาที่นี่
- `overloadedBackoffMs`: หน่วงเวลาคงที่ก่อนลองหมุนเวียนผู้ให้บริการ/โปรไฟล์ที่โหลดเกินอีกครั้ง (ค่าเริ่มต้น: `0`)
- `rateLimitedProfileRotations`: จำนวนสูงสุดของการหมุนเวียนโปรไฟล์ยืนยันตัวตนในผู้ให้บริการเดียวกันสำหรับข้อผิดพลาดจำกัดอัตรา ก่อนเปลี่ยนไปใช้โมเดลสำรอง (ค่าเริ่มต้น: `1`) กลุ่มจำกัดอัตรานั้นรวมข้อความที่มีรูปแบบจากผู้ให้บริการ เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` และ `resource exhausted`

---

## การบันทึกล็อก

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- ไฟล์ล็อกเริ่มต้น: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`
- ตั้งค่า `logging.file` สำหรับพาธคงที่
- `consoleLevel` จะเพิ่มเป็น `debug` เมื่อใช้ `--verbose`
- `maxFileBytes`: ขนาดไฟล์ล็อกที่ใช้งานอยู่สูงสุดเป็นไบต์ก่อนการหมุนเวียนไฟล์ (จำนวนเต็มบวก; ค่าเริ่มต้น: `104857600` = 100 MB) OpenClaw เก็บไฟล์เก็บถาวรแบบมีหมายเลขได้สูงสุดห้าไฟล์ไว้ข้างไฟล์ที่ใช้งานอยู่
- `redactSensitive` / `redactPatterns`: การปิดบังแบบพยายามดีที่สุดสำหรับเอาต์พุตคอนโซล, ไฟล์ล็อก, ระเบียนล็อก OTLP และข้อความ transcript ของเซสชันที่คงไว้ `redactSensitive: "off"` ปิดใช้งานเฉพาะนโยบายล็อก/transcript ทั่วไปนี้เท่านั้น; พื้นผิวความปลอดภัยของ UI/เครื่องมือ/การวินิจฉัยยังคงปกปิดความลับก่อนปล่อยออก

---

## การวินิจฉัย

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 600000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: สวิตช์หลักสำหรับเอาต์พุตการวัดและติดตาม (ค่าเริ่มต้น: `true`)
- `flags`: อาร์เรย์ของสตริงแฟล็กที่เปิดเอาต์พุตล็อกแบบเจาะจง (รองรับ wildcard เช่น `"telegram.*"` หรือ `"*"`)
- `stuckSessionWarnMs`: เกณฑ์อายุที่ไม่มีความคืบหน้าเป็น ms สำหรับจัดประเภทเซสชันประมวลผลที่ทำงานนานเป็น `session.long_running`, `session.stalled` หรือ `session.stuck` การตอบกลับ, เครื่องมือ, สถานะ, บล็อก และความคืบหน้า ACP จะรีเซ็ตตัวจับเวลา; การวินิจฉัย `session.stuck` ที่เกิดซ้ำจะถอยกลับเมื่อยังไม่เปลี่ยนแปลง
- `stuckSessionAbortMs`: เกณฑ์อายุที่ไม่มีความคืบหน้าเป็น ms ก่อนงานที่ใช้งานอยู่ซึ่งค้างและเข้าเกณฑ์อาจถูก abort-drain เพื่อกู้คืน เมื่อไม่ได้ตั้งค่า OpenClaw จะใช้หน้าต่าง embedded-run แบบขยายที่ปลอดภัยกว่าอย่างน้อย 10 นาที และ 5 เท่าของ `stuckSessionWarnMs`
- `otel.enabled`: เปิด pipeline การส่งออก OpenTelemetry (ค่าเริ่มต้น: `false`) สำหรับการกำหนดค่าเต็ม แค็ตตาล็อกสัญญาณ และโมเดลความเป็นส่วนตัว โปรดดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)
- `otel.endpoint`: URL collector สำหรับการส่งออก OTel
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP เฉพาะสัญญาณแบบไม่บังคับ เมื่อตั้งค่าแล้วจะ override `otel.endpoint` เฉพาะสำหรับสัญญาณนั้น
- `otel.protocol`: `"http/protobuf"` (ค่าเริ่มต้น) หรือ `"grpc"`
- `otel.headers`: ส่วนหัว metadata HTTP/gRPC เพิ่มเติมที่ส่งพร้อมคำขอส่งออก OTel
- `otel.serviceName`: ชื่อบริการสำหรับแอตทริบิวต์ทรัพยากร
- `otel.traces` / `otel.metrics` / `otel.logs`: เปิดใช้งานการส่งออก trace, metrics หรือ log
- `otel.sampleRate`: อัตราการสุ่มตัวอย่าง trace `0`-`1`
- `otel.flushIntervalMs`: ช่วงเวลาการ flush telemetry เป็นระยะใน ms
- `otel.captureContent`: การดักจับเนื้อหาดิบแบบ opt-in สำหรับแอตทริบิวต์ span ของ OTEL ค่าเริ่มต้นคือปิด Boolean `true` จะดักจับเนื้อหาข้อความ/เครื่องมือที่ไม่ใช่ระบบ; รูปแบบ object ช่วยให้คุณเปิด `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` และ `systemPrompt` ได้อย่างชัดเจน
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: สวิตช์สภาพแวดล้อมสำหรับแอตทริบิวต์ผู้ให้บริการ span GenAI รุ่นทดลองล่าสุด โดยค่าเริ่มต้น span จะเก็บแอตทริบิวต์ `gen_ai.system` เดิมเพื่อความเข้ากันได้; metrics ของ GenAI ใช้แอตทริบิวต์เชิงความหมายแบบมีขอบเขต
- `OPENCLAW_OTEL_PRELOADED=1`: สวิตช์สภาพแวดล้อมสำหรับโฮสต์ที่ลงทะเบียน OpenTelemetry SDK ส่วนกลางไว้แล้ว จากนั้น OpenClaw จะข้ามการเริ่มต้น/ปิด SDK ที่ Plugin เป็นเจ้าของ โดยยังคงให้ listener การวินิจฉัยทำงานอยู่
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` และ `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: ตัวแปรสภาพแวดล้อม endpoint เฉพาะสัญญาณที่ใช้เมื่อคีย์ config ที่ตรงกันไม่ได้ตั้งค่า
- `cacheTrace.enabled`: บันทึก snapshot ของ cache trace สำหรับ embedded runs (ค่าเริ่มต้น: `false`)
- `cacheTrace.filePath`: พาธเอาต์พุตสำหรับ cache trace JSONL (ค่าเริ่มต้น: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: ควบคุมสิ่งที่รวมอยู่ในเอาต์พุต cache trace (ค่าเริ่มต้นทั้งหมด: `true`)

---

## การอัปเดต

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: ช่องทาง release สำหรับการติดตั้ง npm/git - `"stable"`, `"beta"` หรือ `"dev"`
- `checkOnStart`: ตรวจสอบการอัปเดต npm เมื่อ Gateway เริ่มทำงาน (ค่าเริ่มต้น: `true`)
- `auto.enabled`: เปิดการอัปเดตอัตโนมัติในเบื้องหลังสำหรับการติดตั้งแพ็กเกจ (ค่าเริ่มต้น: `false`)
- `auto.stableDelayHours`: หน่วงเวลาขั้นต่ำเป็นชั่วโมงก่อนใช้การอัปเดตอัตโนมัติของช่อง stable (ค่าเริ่มต้น: `6`; สูงสุด: `168`)
- `auto.stableJitterHours`: หน้าต่างกระจายการ rollout เพิ่มเติมของช่อง stable เป็นชั่วโมง (ค่าเริ่มต้น: `12`; สูงสุด: `168`)
- `auto.betaCheckIntervalHours`: ความถี่ที่การตรวจสอบช่อง beta ทำงานเป็นชั่วโมง (ค่าเริ่มต้น: `1`; สูงสุด: `24`)

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: feature gate ส่วนกลางของ ACP (ค่าเริ่มต้น: `true`; ตั้งเป็น `false` เพื่อซ่อนการ dispatch ของ ACP และ affordance สำหรับ spawn)
- `dispatch.enabled`: gate อิสระสำหรับการ dispatch เทิร์นเซสชัน ACP (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อให้คำสั่ง ACP ยังคงพร้อมใช้งานแต่บล็อกการดำเนินการ
- `backend`: id backend รันไทม์ ACP เริ่มต้น (ต้องตรงกับ Plugin รันไทม์ ACP ที่ลงทะเบียนไว้)
  ติดตั้ง Plugin backend ก่อน และหากตั้งค่า `plugins.allow` ให้รวม id ของ Plugin backend (เช่น `acpx`) มิฉะนั้น backend ACP จะไม่โหลด
- `defaultAgent`: id agent เป้าหมาย ACP สำรองเมื่อการ spawn ไม่ได้ระบุเป้าหมายอย่างชัดเจน
- `allowedAgents`: allowlist ของ id agent ที่อนุญาตสำหรับเซสชันรันไทม์ ACP; ค่าว่างหมายถึงไม่มีข้อจำกัดเพิ่มเติม
- `maxConcurrentSessions`: จำนวนสูงสุดของเซสชัน ACP ที่ active พร้อมกัน
- `stream.coalesceIdleMs`: หน้าต่าง idle flush เป็น ms สำหรับข้อความที่สตรีม
- `stream.maxChunkChars`: ขนาด chunk สูงสุดก่อนแยกการฉายบล็อกที่สตรีม
- `stream.repeatSuppression`: ระงับบรรทัดสถานะ/เครื่องมือที่ซ้ำต่อเทิร์น (ค่าเริ่มต้น: `true`)
- `stream.deliveryMode`: `"live"` สตรีมแบบเพิ่มทีละส่วน; `"final_only"` บัฟเฟอร์จนถึงเหตุการณ์ terminal ของเทิร์น
- `stream.hiddenBoundarySeparator`: ตัวคั่นก่อนข้อความที่มองเห็นได้หลังเหตุการณ์เครื่องมือที่ซ่อนอยู่ (ค่าเริ่มต้น: `"paragraph"`)
- `stream.maxOutputChars`: จำนวนอักขระเอาต์พุต assistant สูงสุดที่ฉายต่อเทิร์น ACP
- `stream.maxSessionUpdateChars`: จำนวนอักขระสูงสุดสำหรับบรรทัดสถานะ/อัปเดต ACP ที่ฉาย
- `stream.tagVisibility`: ระเบียนของชื่อ tag ไปยัง override การมองเห็นแบบ boolean สำหรับเหตุการณ์ที่สตรีม
- `runtime.ttlMinutes`: idle TTL เป็นนาทีสำหรับ worker เซสชัน ACP ก่อนเข้าเกณฑ์ cleanup
- `runtime.installCommand`: คำสั่งติดตั้งแบบไม่บังคับเพื่อรันเมื่อ bootstrap สภาพแวดล้อมรันไทม์ ACP

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` ควบคุมรูปแบบ tagline ของแบนเนอร์:
  - `"random"` (ค่าเริ่มต้น): tagline ตลก/ตามฤดูกาลที่หมุนเวียน
  - `"default"`: tagline เป็นกลางแบบคงที่ (`All your chats, one OpenClaw.`)
  - `"off"`: ไม่มีข้อความ tagline (ยังแสดงชื่อ/เวอร์ชันของแบนเนอร์)
- หากต้องการซ่อนทั้งแบนเนอร์ (ไม่ใช่แค่ tagline) ให้ตั้ง env `OPENCLAW_HIDE_BANNER=1`

---

## วิซาร์ด

Metadata ที่เขียนโดยขั้นตอนตั้งค่าแบบมีคำแนะนำของ CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## ข้อมูลระบุตัวตน

ดูฟิลด์ข้อมูลระบุตัวตน `agents.list` ภายใต้ [ค่าเริ่มต้นของ Agent](/th/gateway/config-agents#agent-defaults)

---

## Bridge (ดั้งเดิม, ถูกถอดออก)

build ปัจจุบันไม่มี TCP bridge แล้ว Node เชื่อมต่อผ่าน WebSocket ของ Gateway คีย์ `bridge.*` ไม่ได้เป็นส่วนหนึ่งของสคีมา config อีกต่อไป (การตรวจสอบจะล้มเหลวจนกว่าจะลบออก; `openclaw doctor --fix` สามารถตัดคีย์ที่ไม่รู้จักออกได้)

<Accordion title="config bridge ดั้งเดิม (ข้อมูลอ้างอิงทางประวัติ)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: ระยะเวลาที่จะเก็บเซสชันการรัน Cron แบบแยกที่เสร็จสมบูรณ์ไว้ก่อนตัดออกจาก `sessions.json` และยังควบคุมการล้างทรานสคริปต์ Cron ที่ถูกลบและเก็บถาวร ค่าเริ่มต้น: `24h`; ตั้งเป็น `false` เพื่อปิดใช้งาน
- `runLog.maxBytes`: ขนาดสูงสุดต่อไฟล์บันทึกการรัน (`cron/runs/<jobId>.jsonl`) ก่อนตัดทอน ค่าเริ่มต้น: `2_000_000` ไบต์
- `runLog.keepLines`: บรรทัดล่าสุดที่เก็บไว้เมื่อการตัดทอนบันทึกการรันถูกทริกเกอร์ ค่าเริ่มต้น: `2000`
- `webhookToken`: โทเค็น bearer ที่ใช้สำหรับการส่ง POST ของ Webhook Cron (`delivery.mode = "webhook"`), หากละไว้จะไม่ส่งส่วนหัว auth
- `webhook`: URL Webhook สำรองแบบเดิมที่เลิกใช้แล้ว (http/https) ใช้เฉพาะกับงานที่จัดเก็บไว้ซึ่งยังมี `notify: true`

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: จำนวนครั้งสูงสุดในการลองใหม่สำหรับงานแบบครั้งเดียวเมื่อเกิดข้อผิดพลาดชั่วคราว (ค่าเริ่มต้น: `3`; ช่วง: `0`-`10`)
- `backoffMs`: อาร์เรย์ของความล่าช้าแบบ backoff เป็นมิลลิวินาทีสำหรับแต่ละครั้งที่ลองใหม่ (ค่าเริ่มต้น: `[30000, 60000, 300000]`; 1-10 รายการ)
- `retryOn`: ประเภทข้อผิดพลาดที่ทริกเกอร์การลองใหม่ - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"` ละไว้เพื่อลองใหม่สำหรับประเภทชั่วคราวทั้งหมด

ใช้กับงาน Cron แบบครั้งเดียวเท่านั้น งานที่เกิดซ้ำใช้การจัดการความล้มเหลวแยกต่างหาก

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: เปิดใช้งานการแจ้งเตือนความล้มเหลวสำหรับงาน Cron (ค่าเริ่มต้น: `false`)
- `after`: จำนวนความล้มเหลวติดต่อกันก่อนส่งการแจ้งเตือน (จำนวนเต็มบวก, ค่าต่ำสุด: `1`)
- `cooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการแจ้งเตือนซ้ำสำหรับงานเดียวกัน (จำนวนเต็มไม่ติดลบ)
- `includeSkipped`: นับการรันที่ถูกข้ามติดต่อกันรวมในเกณฑ์การแจ้งเตือน (ค่าเริ่มต้น: `false`) การรันที่ถูกข้ามจะถูกติดตามแยกต่างหากและไม่ส่งผลต่อ backoff ของข้อผิดพลาดในการดำเนินการ
- `mode`: โหมดการส่ง - `"announce"` ส่งผ่านข้อความช่อง; `"webhook"` โพสต์ไปยัง Webhook ที่กำหนดค่าไว้
- `accountId`: ID บัญชีหรือช่องที่ไม่บังคับเพื่อจำกัดขอบเขตการส่งการแจ้งเตือน

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- ปลายทางเริ่มต้นสำหรับการแจ้งเตือนความล้มเหลวของ Cron ในทุกงาน
- `mode`: `"announce"` หรือ `"webhook"`; ค่าเริ่มต้นเป็น `"announce"` เมื่อมีข้อมูลเป้าหมายเพียงพอ
- `channel`: การแทนที่ช่องสำหรับการส่งแบบ announce `"last"` ใช้ช่องการส่งที่ทราบล่าสุดซ้ำ
- `to`: เป้าหมาย announce หรือ URL Webhook แบบระบุชัดเจน จำเป็นสำหรับโหมด Webhook
- `accountId`: การแทนที่บัญชีที่ไม่บังคับสำหรับการส่ง
- `delivery.failureDestination` รายงานต่องานจะแทนที่ค่าเริ่มต้นส่วนกลางนี้
- เมื่อไม่ได้ตั้งค่าปลายทางความล้มเหลวทั้งส่วนกลางและรายงานต่องาน งานที่ส่งผ่าน `announce` อยู่แล้วจะถอยกลับไปใช้เป้าหมาย announce หลักนั้นเมื่อเกิดความล้มเหลว
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เว้นแต่ `delivery.mode` หลักของงานจะเป็น `"webhook"`

ดู [งาน Cron](/th/automation/cron-jobs) การดำเนินการ Cron แบบแยกจะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

---

## ตัวแปรเทมเพลตโมเดลสื่อ

ตัวยึดตำแหน่งเทมเพลตที่ขยายใน `tools.media.models[].args`:

| ตัวแปร             | คำอธิบาย                                         |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | เนื้อหาข้อความขาเข้าแบบเต็ม                      |
| `{{RawBody}}`      | เนื้อหาดิบ (ไม่มีตัวครอบประวัติ/ผู้ส่ง)          |
| `{{BodyStripped}}` | เนื้อหาที่ตัดการกล่าวถึงกลุ่มออกแล้ว             |
| `{{From}}`         | ตัวระบุผู้ส่ง                                    |
| `{{To}}`           | ตัวระบุปลายทาง                                   |
| `{{MessageSid}}`   | ID ข้อความช่อง                                   |
| `{{SessionId}}`    | UUID ของเซสชันปัจจุบัน                           |
| `{{IsNewSession}}` | `"true"` เมื่อสร้างเซสชันใหม่                    |
| `{{MediaUrl}}`     | URL เทียมของสื่อขาเข้า                           |
| `{{MediaPath}}`    | พาธสื่อภายในเครื่อง                              |
| `{{MediaType}}`    | ประเภทสื่อ (รูปภาพ/เสียง/เอกสาร/…)              |
| `{{Transcript}}`   | ทรานสคริปต์เสียง                                 |
| `{{Prompt}}`       | พรอมป์สื่อที่แก้ค่าแล้วสำหรับรายการ CLI          |
| `{{MaxChars}}`     | จำนวนอักขระเอาต์พุตสูงสุดที่แก้ค่าแล้วสำหรับรายการ CLI |
| `{{ChatType}}`     | `"direct"` หรือ `"group"`                         |
| `{{GroupSubject}}` | หัวข้อกลุ่ม (พยายามให้ดีที่สุด)                  |
| `{{GroupMembers}}` | ตัวอย่างสมาชิกกลุ่ม (พยายามให้ดีที่สุด)          |
| `{{SenderName}}`   | ชื่อที่แสดงของผู้ส่ง (พยายามให้ดีที่สุด)         |
| `{{SenderE164}}`   | หมายเลขโทรศัพท์ของผู้ส่ง (พยายามให้ดีที่สุด)     |
| `{{Provider}}`     | คำใบ้ผู้ให้บริการ (whatsapp, telegram, discord, ฯลฯ) |

---

## การรวมไฟล์การกำหนดค่า (`$include`)

แยกการกำหนดค่าเป็นหลายไฟล์:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**พฤติกรรมการผสาน:**

- ไฟล์เดียว: แทนที่ออบเจ็กต์ที่ครอบอยู่
- อาร์เรย์ของไฟล์: ผสานแบบลึกตามลำดับ (รายการหลังแทนที่รายการก่อนหน้า)
- คีย์ข้างเคียง: ผสานหลังจาก include (แทนที่ค่าที่ include เข้ามา)
- Include ซ้อนกัน: ลึกได้สูงสุด 10 ระดับ
- พาธ: แก้โดยสัมพันธ์กับไฟล์ที่ include แต่ต้องอยู่ภายในไดเรกทอรีการกำหนดค่าระดับบนสุด (`dirname` ของ `openclaw.json`) รูปแบบสัมบูรณ์/`../` อนุญาตเฉพาะเมื่อยังคงแก้ได้อยู่ภายในขอบเขตนั้น
- การเขียนที่ OpenClaw เป็นเจ้าของซึ่งเปลี่ยนเฉพาะส่วนระดับบนสุดหนึ่งส่วนที่รองรับด้วย include แบบไฟล์เดียวจะเขียนผ่านไปยังไฟล์ที่ include นั้น ตัวอย่างเช่น `plugins install` อัปเดต `plugins: { $include: "./plugins.json5" }` ใน `plugins.json5` และปล่อยให้ `openclaw.json` คงเดิม
- Include ที่ราก, อาร์เรย์ include, และ include ที่มีการแทนที่ด้วยคีย์ข้างเคียงเป็นแบบอ่านอย่างเดียวสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนเหล่านั้นจะล้มเหลวแบบปิดแทนการทำให้การกำหนดค่าแบนลง
- ข้อผิดพลาด: ข้อความชัดเจนสำหรับไฟล์ที่หายไป, ข้อผิดพลาดการแยกวิเคราะห์, และ include แบบวนซ้ำ

---

_ที่เกี่ยวข้อง: [การกำหนดค่า](/th/gateway/configuration) · [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
