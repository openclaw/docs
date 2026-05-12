---
read_when:
    - คุณต้องการความหมายเชิง config ระดับฟิลด์หรือค่าเริ่มต้นที่แน่นอน
    - คุณกำลังตรวจสอบบล็อกการกำหนดค่าช่องทาง โมเดล Gateway หรือเครื่องมือ
summary: เอกสารอ้างอิงการกำหนดค่า Gateway สำหรับคีย์หลักของ OpenClaw ค่าเริ่มต้น และลิงก์ไปยังเอกสารอ้างอิงเฉพาะของระบบย่อย
title: ข้อมูลอ้างอิงการกำหนดค่า
x-i18n:
    generated_at: "2026-05-12T00:58:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b8e31f7a6ed82faf3b5a50daa286bb6fce0c2e4452ae81a8e792a437004ad54
    source_path: gateway/configuration-reference.md
    workflow: 16
---

การอ้างอิง config หลักสำหรับ `~/.openclaw/openclaw.json` สำหรับภาพรวมแบบมุ่งงาน ดู [การกำหนดค่า](/th/gateway/configuration)

ครอบคลุมพื้นผิว config หลักของ OpenClaw และลิงก์ออกไปเมื่อระบบย่อยมีเอกสารอ้างอิงเชิงลึกของตัวเอง แคตตาล็อกคำสั่งที่ช่องทางและ Plugin เป็นเจ้าของ รวมถึงปุ่มปรับแต่ง memory/QMD เชิงลึก อยู่ในหน้าของตัวเองแทนที่จะอยู่ในหน้านี้

ความจริงจากโค้ด:

- `openclaw config schema` พิมพ์ JSON Schema สดที่ใช้สำหรับการตรวจสอบความถูกต้องและ Control UI โดยรวม metadata ของ bundled/plugin/channel เข้ามาเมื่อมี
- `config.schema.lookup` คืนค่าโหนด schema หนึ่งรายการตาม path scope สำหรับเครื่องมือเจาะดูรายละเอียด
- `pnpm config:docs:check` / `pnpm config:docs:gen` ตรวจสอบ hash baseline ของเอกสาร config เทียบกับพื้นผิว schema ปัจจุบัน

เส้นทางค้นหา agent: ใช้ action ของเครื่องมือ `gateway` ชื่อ `config.schema.lookup` สำหรับ
เอกสารและข้อจำกัดระดับ field ที่แม่นยำก่อนแก้ไข ใช้
[การกำหนดค่า](/th/gateway/configuration) สำหรับคำแนะนำแบบมุ่งงาน และใช้หน้านี้
สำหรับแผนที่ field ที่กว้างกว่า ค่าเริ่มต้น และลิงก์ไปยังเอกสารอ้างอิงของระบบย่อย

เอกสารอ้างอิงเชิงลึกเฉพาะทาง:

- [เอกสารอ้างอิงการกำหนดค่า memory](/th/reference/memory-config) สำหรับ `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` และ config ของ dreaming ภายใต้ `plugins.entries.memory-core.config.dreaming`
- [คำสั่ง slash](/th/tools/slash-commands) สำหรับแคตตาล็อกคำสั่ง built-in + bundled ปัจจุบัน
- หน้าของช่องทาง/Plugin เจ้าของ สำหรับพื้นผิวคำสั่งเฉพาะช่องทาง

รูปแบบ config คือ **JSON5** (อนุญาตให้มี comments + trailing commas) ทุก field เป็น optional - OpenClaw ใช้ค่าเริ่มต้นที่ปลอดภัยเมื่อเว้นไว้

---

## ช่องทาง

คีย์ config รายช่องทางย้ายไปยังหน้าเฉพาะแล้ว - ดู
[การกำหนดค่า - ช่องทาง](/th/gateway/config-channels) สำหรับ `channels.*`
รวมถึง Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และช่องทาง bundled อื่นๆ
(auth, การควบคุมการเข้าถึง, หลายบัญชี, mention gating)

## ค่าเริ่มต้นของ agent, multi-agent, เซสชัน และข้อความ

ย้ายไปยังหน้าเฉพาะแล้ว - ดู
[การกำหนดค่า - agents](/th/gateway/config-agents) สำหรับ:

- `agents.defaults.*` (workspace, model, thinking, Heartbeat, memory, media, Skills, sandbox)
- `multiAgent.*` (การกำหนดเส้นทางและการผูกของ multi-agent)
- `session.*` (วงจรชีวิตของเซสชัน, Compaction, การตัดแต่ง)
- `messages.*` (การส่งข้อความ, TTS, การเรนเดอร์ markdown)
- `talk.*` (โหมด Talk)
  - `talk.consultThinkingLevel`: การ override ระดับ thinking สำหรับการรัน agent OpenClaw แบบเต็มเบื้องหลัง Control UI Talk realtime consults
  - `talk.consultFastMode`: การ override fast-mode แบบครั้งเดียวสำหรับ Control UI Talk realtime consults
  - `talk.speechLocale`: id locale BCP 47 แบบ optional สำหรับการรู้จำเสียงพูดของ Talk บน iOS/macOS
  - `talk.silenceTimeoutMs`: เมื่อไม่ได้ตั้งค่า Talk จะคงหน้าต่างหยุดพักค่าเริ่มต้นของแพลตฟอร์มก่อนส่ง transcript (`700 ms on macOS and Android, 900 ms on iOS`)

## เครื่องมือและผู้ให้บริการแบบกำหนดเอง

นโยบายเครื่องมือ, toggles เชิงทดลอง, config เครื่องมือที่มี provider รองรับ และการตั้งค่า
provider / base-URL แบบกำหนดเอง ย้ายไปยังหน้าเฉพาะแล้ว - ดู
[การกำหนดค่า - เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools)

## Models

นิยาม provider, allowlist ของ model และการตั้งค่า provider แบบกำหนดเองอยู่ใน
[การกำหนดค่า - เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools#custom-providers-and-base-urls)
root `models` ยังเป็นเจ้าของพฤติกรรม model-catalog แบบ global ด้วย

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: พฤติกรรมแคตตาล็อก provider (`merge` หรือ `replace`)
- `models.providers`: map ของ provider แบบกำหนดเองที่ key ด้วย provider id
- `models.providers.*.localService`: process manager แบบ on-demand ที่เป็น optional สำหรับ
  เซิร์ฟเวอร์ model ในเครื่อง OpenClaw probe health endpoint ที่กำหนดค่าไว้, start
  `command` แบบ absolute เมื่อจำเป็น, รอความพร้อม แล้วจึงส่งคำขอ model
  ดู [บริการ model ในเครื่อง](/th/gateway/local-model-services)
- `models.pricing.enabled`: ควบคุม background pricing bootstrap ที่
  เริ่มหลังจาก sidecars และช่องทางเข้าสู่เส้นทาง Gateway ready เมื่อเป็น `false`
  Gateway จะข้ามการ fetch แคตตาล็อก pricing ของ OpenRouter และ LiteLLM; ค่า
  `models.providers.*.models[].cost` ที่กำหนดค่าไว้ยังคงใช้ได้สำหรับการประเมิน cost ในเครื่อง

## MCP

นิยามเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการอยู่ภายใต้ `mcp.servers` และถูก
ใช้โดย Pi แบบ embedded และ runtime adapters อื่นๆ คำสั่ง `openclaw mcp list`,
`show`, `set` และ `unset` จัดการ block นี้โดยไม่เชื่อมต่อไปยัง
เซิร์ฟเวอร์เป้าหมายระหว่างแก้ไข config

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

- `mcp.servers`: นิยามเซิร์ฟเวอร์ MCP แบบ stdio หรือ remote ที่มีชื่อ สำหรับ runtimes ที่
  expose เครื่องมือ MCP ที่กำหนดค่าไว้
  entries แบบ remote ใช้ `transport: "streamable-http"` หรือ `transport: "sse"`;
  `type: "http"` เป็น alias แบบ CLI-native ที่ `openclaw mcp set` และ
  `openclaw doctor --fix` normalize ไปเป็น field `transport` ตาม canonical
- `mcp.sessionIdleTtlMs`: idle TTL สำหรับ MCP runtimes แบบ bundled ที่ scope ตามเซสชัน
  การรัน embedded แบบ one-shot จะขอ cleanup เมื่อจบการรัน; TTL นี้เป็น backstop สำหรับ
  เซสชันที่อยู่ยาวและ callers ในอนาคต
- การเปลี่ยนแปลงภายใต้ `mcp.*` hot-apply โดย dispose session MCP runtimes ที่ cache ไว้
  การค้นพบ/ใช้งานเครื่องมือครั้งถัดไปจะสร้างใหม่จาก config ใหม่ ดังนั้น entries ของ
  `mcp.servers` ที่ถูกลบจะถูกเก็บกวาดทันทีแทนที่จะรอ idle TTL

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

- `allowBundled`: allowlist แบบ optional สำหรับ Skills แบบ bundled เท่านั้น (ไม่กระทบ managed/workspace Skills)
- `load.extraDirs`: roots ของ skill ที่ใช้ร่วมกันเพิ่มเติม (precedence ต่ำสุด)
- `load.allowSymlinkTargets`: roots ของ target จริงที่เชื่อถือได้ซึ่ง symlink ของ skill อาจ
  resolve เข้าไปได้เมื่อ link อยู่ภายนอก source root ที่กำหนดค่าไว้
- `install.preferBrew`: เมื่อเป็น true ให้เลือกใช้ installers ของ Homebrew ก่อนเมื่อมี `brew`
  พร้อมใช้งาน ก่อน fallback ไปยัง installer ชนิดอื่น
- `install.nodeManager`: preference ของตัวติดตั้ง node สำหรับ specs `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`)
- `install.allowUploadedArchives`: อนุญาตให้ clients ของ Gateway ที่เป็น `operator.admin` และเชื่อถือได้
  ติดตั้ง zip archives ส่วนตัวที่ staged ผ่าน `skills.upload.*`
  (ค่าเริ่มต้น: false) นี่เปิดใช้เฉพาะเส้นทาง uploaded-archive; การติดตั้ง ClawHub
  ปกติไม่ต้องใช้ค่านี้
- `entries.<skillKey>.enabled: false` ปิดใช้ skill แม้ว่าจะ bundled/installed อยู่ก็ตาม
- `entries.<skillKey>.apiKey`: ความสะดวกสำหรับ Skills ที่ประกาศ env var หลัก (plaintext string หรือ SecretRef object)

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

- โหลดจาก `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` รวมถึง `plugins.load.paths`
- Discovery ยอมรับ Plugin native ของ OpenClaw รวมถึง bundles ของ Codex ที่เข้ากันได้ และ bundles ของ Claude รวมถึง bundles layout ค่าเริ่มต้นของ Claude ที่ไม่มี manifest
- **การเปลี่ยน config ต้อง restart gateway**
- `allow`: allowlist แบบ optional (โหลดเฉพาะ Plugins ที่อยู่ในรายการ) `deny` มีสิทธิ์ชนะ
- `bundledDiscovery`: ค่าเริ่มต้นเป็น `"allowlist"` สำหรับ configs ใหม่ ดังนั้น
  `plugins.allow` ที่ไม่ว่างจะ gate bundled provider plugins ด้วย รวมถึง web-search
  runtime providers ด้วย Doctor เขียน `"compat"` สำหรับ configs allowlist เดิมที่ migrate มา
  เพื่อรักษาพฤติกรรม bundled provider ที่มีอยู่จนกว่าคุณจะ opt in
- `plugins.entries.<id>.apiKey`: field ความสะดวกสำหรับ API key ระดับ Plugin (เมื่อ Plugin รองรับ)
- `plugins.entries.<id>.env`: map ของ env var ที่ scope ตาม Plugin
- `plugins.entries.<id>.hooks.allowPromptInjection`: เมื่อเป็น `false` core จะ block `before_prompt_build` และ ignore fields ที่ mutate prompt จาก legacy `before_agent_start` ในขณะที่ยังรักษา legacy `modelOverride` และ `providerOverride` ไว้ ใช้กับ hooks ของ Plugin native และ hook directories ที่ bundle-provided และรองรับ
- `plugins.entries.<id>.hooks.allowConversationAccess`: เมื่อเป็น `true` Plugins ที่ไม่ใช่ bundled และเชื่อถือได้อาจอ่านเนื้อหาการสนทนาแบบ raw จาก typed hooks เช่น `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` และ `agent_end`
- `plugins.entries.<id>.subagent.allowModelOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนให้ขอ override `provider` และ `model` ต่อการรัน สำหรับ background subagent runs
- `plugins.entries.<id>.subagent.allowedModels`: allowlist แบบ optional ของ target `provider/model` ตาม canonical สำหรับ trusted subagent overrides ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาต model ใดก็ได้
- `plugins.entries.<id>.llm.allowModelOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนให้ขอ model overrides สำหรับ `api.runtime.llm.complete`
- `plugins.entries.<id>.llm.allowedModels`: allowlist แบบ optional ของ target `provider/model` ตาม canonical สำหรับ trusted plugin LLM completion overrides ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาต model ใดก็ได้
- `plugins.entries.<id>.llm.allowAgentIdOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนให้รัน `api.runtime.llm.complete` กับ agent id ที่ไม่ใช่ค่าเริ่มต้น
- `plugins.entries.<id>.config`: config object ที่ Plugin นิยาม (ตรวจสอบความถูกต้องด้วย schema ของ Plugin native OpenClaw เมื่อมี)
- การตั้งค่า account/runtime ของ Channel Plugin อยู่ภายใต้ `channels.<id>` และควรถูกอธิบายโดย metadata `channelConfigs` ใน manifest ของ Plugin เจ้าของ ไม่ใช่โดย option registry กลางของ OpenClaw

### Config ของ Codex harness Plugin

Plugin `codex` แบบ bundled เป็นเจ้าของการตั้งค่า native Codex app-server harness ภายใต้
`plugins.entries.codex.config` ดู
[เอกสารอ้างอิง Codex harness](/th/plugins/codex-harness-reference) สำหรับพื้นผิว config แบบเต็ม
และ [Codex harness](/th/plugins/codex-harness) สำหรับ model ของ runtime

`codexPlugins` ใช้เฉพาะกับเซสชันที่เลือก native Codex harness เท่านั้น
มันไม่ได้เปิดใช้ Codex plugins สำหรับ Pi, การรัน provider OpenAI ปกติ, การผูกการสนทนา ACP
หรือ harness ใดๆ ที่ไม่ใช่ Codex

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
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

- `plugins.entries.codex.config.codexPlugins.enabled`: เปิดใช้การรองรับ Plugin/แอป Codex
  แบบเนทีฟสำหรับ Codex harness ค่าเริ่มต้น: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  นโยบายการกระทำแบบทำลายข้อมูลเริ่มต้นสำหรับการร้องขอจากแอป Plugin ที่ย้ายมา
  ค่าเริ่มต้น: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: เปิดใช้
  รายการ Plugin ที่ย้ายมาเมื่อ `codexPlugins.enabled` ระดับโกลบอลเป็น true ด้วย
  ค่าเริ่มต้น: `true` สำหรับรายการที่ระบุชัดเจน
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  ตัวตนของ marketplace ที่เสถียร V1 รองรับเฉพาะ `"openai-curated"` เท่านั้น
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: ตัวตน
  Plugin ของ Codex ที่เสถียรจากการย้ายข้อมูล เช่น `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  การแทนที่นโยบายการกระทำแบบทำลายข้อมูลราย Plugin เมื่อละไว้ จะใช้ค่า
  `allow_destructive_actions` ระดับโกลบอล

`codexPlugins.enabled` คือคำสั่งเปิดใช้ระดับโกลบอล รายการ Plugin ที่ระบุชัดเจน
ซึ่งเขียนโดยการย้ายข้อมูลคือชุดการติดตั้งและสิทธิ์ซ่อมแซมที่คงทน
ไม่รองรับ `plugins["*"]` ไม่มีสวิตช์ `install` และค่า
`marketplacePath` แบบโลคัลตั้งใจไม่ให้เป็นฟิลด์ config เพราะเป็นค่าเฉพาะโฮสต์

การตรวจสอบความพร้อมของ `app/list` จะถูกแคชไว้หนึ่งชั่วโมงและรีเฟรช
แบบอะซิงโครนัสเมื่อเก่าเกินไป config แอปของเธรด Codex จะถูกคำนวณตอนเริ่ม
เซสชัน Codex harness ไม่ใช่ทุกเทิร์น ใช้ `/new`, `/reset` หรือรีสตาร์ท gateway
หลังเปลี่ยน config Plugin แบบเนทีฟ

- `plugins.entries.firecrawl.config.webFetch`: การตั้งค่าผู้ให้บริการ web-fetch ของ Firecrawl
  - `apiKey`: คีย์ API ของ Firecrawl (ยอมรับ SecretRef) ถอยกลับไปใช้ `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` แบบเก่า หรือ env var `FIRECRAWL_API_KEY`
  - `baseUrl`: URL ฐานของ Firecrawl API (ค่าเริ่มต้น: `https://api.firecrawl.dev`; การแทนที่แบบ self-hosted ต้องชี้ไปยัง endpoint ส่วนตัว/ภายใน)
  - `onlyMainContent`: ดึงเฉพาะเนื้อหาหลักจากหน้าเว็บ (ค่าเริ่มต้น: `true`)
  - `maxAgeMs`: อายุแคชสูงสุดเป็นมิลลิวินาที (ค่าเริ่มต้น: `172800000` / 2 วัน)
  - `timeoutSeconds`: timeout ของคำขอ scrape เป็นวินาที (ค่าเริ่มต้น: `60`)
- `plugins.entries.xai.config.xSearch`: การตั้งค่า xAI X Search (การค้นเว็บของ Grok)
  - `enabled`: เปิดใช้ผู้ให้บริการ X Search
  - `model`: โมเดล Grok ที่จะใช้สำหรับการค้นหา (เช่น `"grok-4-1-fast"`)
- `plugins.entries.memory-core.config.dreaming`: การตั้งค่า memory dreaming ดู [Dreaming](/th/concepts/dreaming) สำหรับเฟสและเกณฑ์
  - `enabled`: สวิตช์หลักของ dreaming (ค่าเริ่มต้น `false`)
  - `frequency`: จังหวะ cron สำหรับการ sweep dreaming แบบเต็มแต่ละครั้ง (ค่าเริ่มต้นคือ `"0 3 * * *"`)
  - `model`: การแทนที่โมเดล subagent ของ Dream Diary แบบไม่บังคับ ต้องมี `plugins.entries.memory-core.subagent.allowModelOverride: true`; จับคู่กับ `allowedModels` เพื่อจำกัดเป้าหมาย ข้อผิดพลาดโมเดลไม่พร้อมใช้งานจะลองใหม่หนึ่งครั้งด้วยโมเดลเริ่มต้นของเซสชัน ความล้มเหลวจาก trust หรือ allowlist จะไม่ถอยกลับแบบเงียบๆ
  - นโยบายเฟสและเกณฑ์เป็นรายละเอียดการใช้งานภายใน (ไม่ใช่คีย์ config ที่แสดงต่อผู้ใช้)
- config หน่วยความจำฉบับเต็มอยู่ใน [เอกสารอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin บันเดิล Claude ที่เปิดใช้อยู่ยังสามารถให้ค่าเริ่มต้น Pi แบบฝังจาก `settings.json` ได้ด้วย OpenClaw จะนำค่าเหล่านั้นไปใช้เป็นการตั้งค่า agent ที่ผ่านการทำให้ปลอดภัยแล้ว ไม่ใช่เป็นแพตช์ config OpenClaw ดิบ
- `plugins.slots.memory`: เลือก id ของ Plugin หน่วยความจำที่ใช้งานอยู่ หรือ `"none"` เพื่อปิดใช้ Plugin หน่วยความจำ
- `plugins.slots.contextEngine`: เลือก id ของ Plugin context engine ที่ใช้งานอยู่ ค่าเริ่มต้นเป็น `"legacy"` เว้นแต่คุณจะติดตั้งและเลือกเอนจินอื่น

ดู [Plugins](/th/tools/plugin)

---

## ข้อผูกมัด

`commitments` ควบคุมหน่วยความจำการติดตามผลที่อนุมานได้: OpenClaw สามารถตรวจจับการ check-in จากเทิร์นบทสนทนาและส่งผ่านการรัน Heartbeat ได้

- `commitments.enabled`: เปิดใช้การดึงข้อมูลด้วย LLM แบบซ่อน การจัดเก็บ และการส่งผ่าน Heartbeat สำหรับข้อผูกมัดการติดตามผลที่อนุมานได้ ค่าเริ่มต้น: `false`.
- `commitments.maxPerDay`: จำนวนข้อผูกมัดการติดตามผลที่อนุมานได้สูงสุดที่ส่งต่อเซสชัน agent ในหนึ่งวันแบบ rolling ค่าเริ่มต้น: `3`.

ดู [ข้อผูกมัดที่อนุมานได้](/th/concepts/commitments)

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

- `evaluateEnabled: false` ปิดใช้ `act:evaluate` และ `wait --fn`.
- `tabCleanup` เรียกคืนแท็บ agent หลักที่ติดตามไว้หลังจากไม่ได้ใช้งาน หรือเมื่อ
  เซสชันเกินขีดจำกัด ตั้งค่า `idleMinutes: 0` หรือ `maxTabsPerSession: 0` เพื่อ
  ปิดใช้โหมด cleanup รายการนั้นๆ
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` ถูกปิดใช้เมื่่อไม่ได้ตั้งค่า ดังนั้นการนำทางของเบราว์เซอร์จึงเข้มงวดโดยค่าเริ่มต้น
- ตั้งค่า `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เฉพาะเมื่อคุณตั้งใจไว้วางใจการนำทางเบราว์เซอร์ในเครือข่ายส่วนตัว
- ในโหมดเข้มงวด endpoint ของโปรไฟล์ CDP ระยะไกล (`profiles.*.cdpUrl`) อยู่ภายใต้การบล็อกเครือข่ายส่วนตัวแบบเดียวกันระหว่างการตรวจสอบความสามารถในการเข้าถึง/การค้นพบ
- `ssrfPolicy.allowPrivateNetwork` ยังรองรับเป็น alias แบบเก่า
- ในโหมดเข้มงวด ให้ใช้ `ssrfPolicy.hostnameAllowlist` และ `ssrfPolicy.allowedHostnames` สำหรับข้อยกเว้นที่ระบุชัดเจน
- โปรไฟล์ระยะไกลเป็นแบบ attach-only (ปิดใช้ start/stop/reset)
- `profiles.*.cdpUrl` ยอมรับ `http://`, `https://`, `ws://`, และ `wss://`
  ใช้ HTTP(S) เมื่อคุณต้องการให้ OpenClaw ค้นพบ `/json/version`; ใช้ WS(S)
  เมื่อผู้ให้บริการของคุณให้ URL DevTools WebSocket โดยตรง
- `remoteCdpTimeoutMs` และ `remoteCdpHandshakeTimeoutMs` ใช้กับคำขอความสามารถในการเข้าถึง CDP ระยะไกลและ
  `attachOnly` รวมถึงคำขอเปิดแท็บ โปรไฟล์ local loopback
  ที่จัดการไว้จะคงค่าเริ่มต้น CDP แบบโลคัลไว้
- หากบริการ CDP ที่จัดการจากภายนอกเข้าถึงได้ผ่าน loopback ให้ตั้งค่า
  `attachOnly: true` ของโปรไฟล์นั้น ไม่เช่นนั้น OpenClaw จะถือว่า port loopback เป็น
  โปรไฟล์เบราว์เซอร์โลคัลที่จัดการอยู่ และอาจรายงานข้อผิดพลาดเรื่องการเป็นเจ้าของ port โลคัล
- โปรไฟล์ `existing-session` ใช้ Chrome MCP แทน CDP และสามารถ attach บน
  โฮสต์ที่เลือก หรือผ่าน node เบราว์เซอร์ที่เชื่อมต่ออยู่
- โปรไฟล์ `existing-session` สามารถตั้งค่า `userDataDir` เพื่อกำหนดเป้าหมาย
  โปรไฟล์เบราว์เซอร์ที่ใช้ Chromium เฉพาะ เช่น Brave หรือ Edge
- โปรไฟล์ `existing-session` คงข้อจำกัด route ปัจจุบันของ Chrome MCP:
  การกระทำที่ขับเคลื่อนด้วย snapshot/ref แทนการกำหนดเป้าหมายด้วย CSS selector, hook อัปโหลดไฟล์เดียว,
  ไม่มีการแทนที่ timeout ของ dialog, ไม่มี `wait --load networkidle`, และไม่มี
  `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด หรือการกระทำแบบ batch
- โปรไฟล์ `openclaw` แบบโลคัลที่จัดการไว้จะกำหนด `cdpPort` และ `cdpUrl` อัตโนมัติ ให้
  ตั้งค่า `cdpUrl` ชัดเจนเฉพาะสำหรับ CDP ระยะไกล
- โปรไฟล์โลคัลที่จัดการไว้สามารถตั้งค่า `executablePath` เพื่อแทนที่ค่า
  `browser.executablePath` ระดับโกลบอลสำหรับโปรไฟล์นั้น ใช้สิ่งนี้เพื่อรันโปรไฟล์หนึ่งใน
  Chrome และอีกโปรไฟล์ใน Brave
- โปรไฟล์โลคัลที่จัดการไว้ใช้ `browser.localLaunchTimeoutMs` สำหรับการค้นพบ Chrome CDP HTTP
  หลังเริ่มโปรเซส และใช้ `browser.localCdpReadyTimeoutMs` สำหรับ
  ความพร้อมของ CDP websocket หลังเปิดใช้งาน เพิ่มค่านี้บนโฮสต์ที่ช้ากว่าเมื่อ Chrome
  เริ่มสำเร็จแต่การตรวจสอบความพร้อมชนกับช่วง startup ค่าทั้งสองต้องเป็น
  จำนวนเต็มบวกไม่เกิน `120000` ms; ค่า config ที่ไม่ถูกต้องจะถูกปฏิเสธ
- ลำดับการตรวจหาอัตโนมัติ: เบราว์เซอร์เริ่มต้นถ้าใช้ Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary
- `browser.executablePath` และ `browser.profiles.<name>.executablePath` ทั้งคู่
  ยอมรับ `~` และ `~/...` สำหรับไดเรกทอรี home ของ OS ก่อนเปิด Chromium
  `userDataDir` ต่อโปรไฟล์บนโปรไฟล์ `existing-session` จะถูกขยาย tilde ด้วย
- บริการควบคุม: loopback เท่านั้น (port มาจาก `gateway.port`, ค่าเริ่มต้น `18791`)
- `extraArgs` เพิ่มแฟล็กการเปิดใช้งานเพิ่มเติมให้ startup ของ Chromium โลคัล (เช่น
  `--disable-gpu`, ขนาดหน้าต่าง หรือแฟล็ก debug)

---

## UI

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

- `seamColor`: สีเน้นสำหรับ chrome ของ UI แอปเนทีฟ (สี bubble ของ Talk Mode ฯลฯ)
- `assistant`: การแทนที่ตัวตนของ Control UI ถอยกลับไปใช้ตัวตนของ agent ที่ใช้งานอยู่

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

<Accordion title="Gateway field details">

- `mode`: `local` (เรียกใช้ gateway) หรือ `remote` (เชื่อมต่อไปยัง gateway ระยะไกล) Gateway จะปฏิเสธการเริ่มทำงานเว้นแต่เป็น `local`
- `port`: พอร์ตมัลติเพล็กซ์พอร์ตเดียวสำหรับ WS + HTTP ลำดับความสำคัญ: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`
- `bind`: `auto`, `loopback` (ค่าเริ่มต้น), `lan` (`0.0.0.0`), `tailnet` (เฉพาะ IP ของ Tailscale) หรือ `custom`
- **นามแฝง bind แบบเดิม**: ใช้ค่าโหมด bind ใน `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`) ไม่ใช่นามแฝงของโฮสต์ (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`)
- **หมายเหตุ Docker**: ค่า bind เริ่มต้น `loopback` จะฟังที่ `127.0.0.1` ภายในคอนเทนเนอร์ เมื่อใช้เครือข่ายแบบ bridge ของ Docker (`-p 18789:18789`) ทราฟฟิกจะเข้ามาที่ `eth0` ดังนั้น gateway จะเข้าถึงไม่ได้ ใช้ `--network host` หรือตั้งค่า `bind: "lan"` (หรือ `bind: "custom"` พร้อม `customBindHost: "0.0.0.0"`) เพื่อฟังบนทุกอินเทอร์เฟซ
- **การตรวจสอบสิทธิ์**: จำเป็นโดยค่าเริ่มต้น bind ที่ไม่ใช่ loopback ต้องใช้การตรวจสอบสิทธิ์ของ gateway ในทางปฏิบัติหมายถึงโทเค็น/รหัสผ่านที่ใช้ร่วมกัน หรือ reverse proxy ที่รับรู้ตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"` ตัวช่วยเริ่มต้นใช้งานจะสร้างโทเค็นโดยค่าเริ่มต้น
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) ให้ตั้งค่า `gateway.auth.mode` อย่างชัดเจนเป็น `token` หรือ `password` โฟลว์เริ่มต้นและติดตั้ง/ซ่อมแซมบริการจะล้มเหลวเมื่อกำหนดค่าทั้งสองอย่างและไม่ได้ตั้งค่า mode
- `gateway.auth.mode: "none"`: โหมดไม่มีการตรวจสอบสิทธิ์อย่างชัดเจน ใช้เฉพาะสำหรับการตั้งค่า local loopback ที่เชื่อถือได้เท่านั้น โหมดนี้ตั้งใจไม่ให้แสดงในพรอมป์เริ่มต้นใช้งาน
- `gateway.auth.mode: "trusted-proxy"`: มอบหมายการตรวจสอบสิทธิ์ของเบราว์เซอร์/ผู้ใช้ให้ reverse proxy ที่รับรู้ตัวตน และเชื่อถือเฮดเดอร์ตัวตนจาก `gateway.trustedProxies` (ดู [การตรวจสอบสิทธิ์ผ่าน Trusted Proxy](/th/gateway/trusted-proxy-auth)) โหมดนี้คาดหวังแหล่งที่มาของพร็อกซีที่ **ไม่ใช่ loopback** โดยค่าเริ่มต้น reverse proxy แบบ loopback บนโฮสต์เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน ผู้เรียกภายในบนโฮสต์เดียวกันสามารถใช้ `gateway.auth.password` เป็น fallback โดยตรงในเครื่องได้ ส่วน `gateway.auth.token` ยังคงใช้ร่วมกับโหมด trusted-proxy ไม่ได้
- `gateway.auth.allowTailscale`: เมื่อเป็น `true` เฮดเดอร์ตัวตนของ Tailscale Serve สามารถตอบสนองการตรวจสอบสิทธิ์ของ UI ควบคุม/WebSocket ได้ (ตรวจสอบผ่าน `tailscale whois`) ปลายทาง HTTP API **ไม่** ใช้การตรวจสอบสิทธิ์ด้วยเฮดเดอร์ Tailscale นั้น แต่จะใช้โหมดการตรวจสอบสิทธิ์ HTTP ปกติของ gateway แทน โฟลว์แบบไม่มีโทเค็นนี้ถือว่าโฮสต์ gateway น่าเชื่อถือ ค่าเริ่มต้นเป็น `true` เมื่อ `tailscale.mode = "serve"`
- `gateway.auth.rateLimit`: ตัวจำกัดการตรวจสอบสิทธิ์ที่ล้มเหลวแบบเลือกได้ ใช้ต่อ IP ของไคลเอนต์และต่อขอบเขตการตรวจสอบสิทธิ์ (shared-secret และ device-token ถูกติดตามแยกกัน) ความพยายามที่ถูกบล็อกจะส่งคืน `429` + `Retry-After`
  - บนเส้นทาง UI ควบคุมของ Tailscale Serve แบบ async ความพยายามที่ล้มเหลวสำหรับ `{scope, clientIp}` เดียวกันจะถูกจัดลำดับก่อนเขียนผลล้มเหลว ดังนั้นความพยายามผิดพร้อมกันจากไคลเอนต์เดียวกันอาจทำให้ตัวจำกัดทำงานตั้งแต่คำขอที่สอง แทนที่ทั้งสองคำขอจะแข่งผ่านไปเป็นเพียงการไม่ตรงกันธรรมดา
  - `gateway.auth.rateLimit.exemptLoopback` มีค่าเริ่มต้นเป็น `true`; ตั้งค่าเป็น `false` เมื่อคุณตั้งใจให้ทราฟฟิก localhost ถูกจำกัดอัตราด้วย (สำหรับการตั้งค่าทดสอบหรือการปรับใช้พร็อกซีแบบเข้มงวด)
- ความพยายามตรวจสอบสิทธิ์ WS ที่มีต้นทางจากเบราว์เซอร์จะถูกหน่วงเสมอโดยปิดการยกเว้น loopback (การป้องกันเชิงลึกต่อการ brute force localhost จากเบราว์เซอร์)
- บน loopback การล็อกเอาต์ที่มีต้นทางจากเบราว์เซอร์เหล่านั้นจะแยกตามค่า `Origin`
  ที่ normalize แล้ว ดังนั้นความล้มเหลวซ้ำจากต้นทาง localhost หนึ่งจะไม่ล็อก
  ต้นทางอื่นโดยอัตโนมัติ
- `tailscale.mode`: `serve` (เฉพาะ tailnet, bind แบบ loopback) หรือ `funnel` (สาธารณะ, ต้องมีการตรวจสอบสิทธิ์)
- `tailscale.preserveFunnel`: เมื่อเป็น `true` และ `tailscale.mode = "serve"` OpenClaw
  จะตรวจสอบ `tailscale funnel status` ก่อนใช้ Serve ซ้ำตอนเริ่มต้น และข้าม
  หากเส้นทาง Funnel ที่กำหนดค่าจากภายนอกครอบคลุมพอร์ต gateway อยู่แล้ว
  ค่าเริ่มต้น `false`
- `controlUi.allowedOrigins`: allowlist ต้นทางเบราว์เซอร์อย่างชัดเจนสำหรับการเชื่อมต่อ WebSocket ของ Gateway จำเป็นเมื่อคาดว่าจะมีไคลเอนต์เบราว์เซอร์จากต้นทางที่ไม่ใช่ loopback
- `controlUi.chatMessageMaxWidth`: ความกว้างสูงสุดแบบเลือกได้สำหรับข้อความแชทของ UI ควบคุมที่ถูกจัดกลุ่ม ยอมรับค่าความกว้าง CSS แบบมีขอบเขต เช่น `960px`, `82%`, `min(1280px, 82%)` และ `calc(100% - 2rem)`
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: โหมดอันตรายที่เปิดใช้ fallback ของต้นทางจากเฮดเดอร์ Host สำหรับการปรับใช้ที่ตั้งใจพึ่งพานโยบายต้นทางจากเฮดเดอร์ Host
- `remote.transport`: `ssh` (ค่าเริ่มต้น) หรือ `direct` (ws/wss) สำหรับ `direct` ค่า `remote.url` ต้องเป็น `ws://` หรือ `wss://`
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: ตัว override ฉุกเฉินของ environment
  ฝั่งไคลเอนต์ที่อนุญาต plaintext `ws://` ไปยัง IP เครือข่ายส่วนตัว
  ที่เชื่อถือได้ ค่าเริ่มต้นยังคงเป็นเฉพาะ loopback สำหรับ plaintext ไม่มีค่าเทียบเท่าใน `openclaw.json`
  และการตั้งค่าเครือข่ายส่วนตัวของเบราว์เซอร์ เช่น
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ไม่มีผลต่อไคลเอนต์ WebSocket ของ Gateway
- `gateway.remote.token` / `.password` เป็นฟิลด์ข้อมูลประจำตัวของไคลเอนต์ระยะไกล ฟิลด์เหล่านี้ไม่ได้กำหนดค่าการตรวจสอบสิทธิ์ของ gateway ด้วยตัวเอง
- `gateway.push.apns.relay.baseUrl`: URL ฐาน HTTPS สำหรับรีเลย์ APNs ภายนอกที่ใช้โดยบิลด์ iOS ทางการ/TestFlight หลังจากเผยแพร่การลงทะเบียนแบบ relay-backed ไปยัง gateway แล้ว URL นี้ต้องตรงกับ URL รีเลย์ที่คอมไพล์ไว้ในบิลด์ iOS
- `gateway.push.apns.relay.timeoutMs`: timeout การส่งจาก gateway ไปยังรีเลย์เป็นมิลลิวินาที ค่าเริ่มต้นเป็น `10000`
- การลงทะเบียนแบบ relay-backed จะถูกมอบหมายให้กับตัวตน gateway เฉพาะ แอป iOS ที่จับคู่จะดึง `gateway.identity.get`, ใส่ตัวตนนั้นในการลงทะเบียนรีเลย์ และส่งต่อสิทธิ์อนุญาตการส่งที่จำกัดตามการลงทะเบียนไปยัง gateway gateway อื่นไม่สามารถนำการลงทะเบียนที่จัดเก็บไว้นั้นไปใช้ซ้ำได้
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: env override ชั่วคราวสำหรับการกำหนดค่ารีเลย์ด้านบน
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: ทางออกสำหรับการพัฒนาเท่านั้นสำหรับ URL รีเลย์ HTTP แบบ loopback URL รีเลย์สำหรับ production ควรอยู่บน HTTPS
- `gateway.handshakeTimeoutMs`: timeout การจับมือ WebSocket ของ Gateway ก่อนตรวจสอบสิทธิ์เป็นมิลลิวินาที ค่าเริ่มต้น: `15000` `OPENCLAW_HANDSHAKE_TIMEOUT_MS` มีลำดับความสำคัญเมื่อถูกตั้งค่า เพิ่มค่านี้บนโฮสต์ที่โหลดสูงหรือพลังประมวลผลต่ำ ซึ่งไคลเอนต์ในเครื่องอาจเชื่อมต่อขณะที่การอุ่นเครื่องตอนเริ่มต้นยังไม่เสร็จนิ่ง
- `gateway.channelHealthCheckMinutes`: ช่วงเวลาตัวตรวจสอบสุขภาพ channel เป็นนาที ตั้งค่า `0` เพื่อปิดการรีสตาร์ทโดยตัวตรวจสอบสุขภาพทั่วทั้งระบบ ค่าเริ่มต้น: `5`
- `gateway.channelStaleEventThresholdMinutes`: เกณฑ์ stale-socket เป็นนาที ให้ค่านี้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes` ค่าเริ่มต้น: `30`
- `gateway.channelMaxRestartsPerHour`: จำนวนการรีสตาร์ทสูงสุดโดยตัวตรวจสอบสุขภาพต่อ channel/account ในช่วงหนึ่งชั่วโมงแบบ rolling ค่าเริ่มต้น: `10`
- `channels.<provider>.healthMonitor.enabled`: การเลือกไม่ใช้การรีสตาร์ทโดยตัวตรวจสอบสุขภาพราย channel ขณะที่ยังเปิดตัวตรวจสอบทั่วทั้งระบบไว้
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override ราย account สำหรับ channel แบบหลาย account เมื่อตั้งค่าแล้ว จะมีลำดับความสำคัญเหนือ override ระดับ channel
- เส้นทางการเรียก local gateway สามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
- หากกำหนดค่า `gateway.auth.token` / `gateway.auth.password` อย่างชัดเจนผ่าน SecretRef และ resolve ไม่ได้ การ resolve จะล้มเหลวแบบปิด (ไม่มี remote fallback มาบดบัง)
- `trustedProxies`: IP ของ reverse proxy ที่ terminate TLS หรือแทรกเฮดเดอร์ forwarded-client ระบุเฉพาะพร็อกซีที่คุณควบคุม รายการ loopback ยังคงใช้ได้สำหรับการตั้งค่าพร็อกซี/การตรวจจับในเครื่องบนโฮสต์เดียวกัน (เช่น Tailscale Serve หรือ reverse proxy ในเครื่อง) แต่จะ **ไม่** ทำให้คำขอ loopback มีสิทธิ์ใช้ `gateway.auth.mode: "trusted-proxy"`
- `allowRealIpFallback`: เมื่อเป็น `true` gateway จะยอมรับ `X-Real-IP` หากไม่มี `X-Forwarded-For` ค่าเริ่มต้น `false` สำหรับพฤติกรรม fail-closed
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist CIDR/IP แบบเลือกได้สำหรับอนุมัติการจับคู่อุปกรณ์ Node ครั้งแรกโดยอัตโนมัติเมื่อไม่มีขอบเขตที่ร้องขอ จะถูกปิดใช้งานเมื่อไม่ได้ตั้งค่า สิ่งนี้ไม่อนุมัติการจับคู่ของ operator/เบราว์เซอร์/UI ควบคุม/WebChat โดยอัตโนมัติ และไม่อนุมัติการอัปเกรด role, scope, metadata หรือ public-key โดยอัตโนมัติ
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: การกำหนด allow/deny ทั่วทั้งระบบสำหรับคำสั่ง Node ที่ประกาศ หลังจากการจับคู่และการประเมิน allowlist ของแพลตฟอร์ม ใช้ `allowCommands` เพื่อเลือกใช้คำสั่ง Node ที่อันตราย เช่น `camera.snap`, `camera.clip` และ `screen.record`; `denyCommands` จะลบคำสั่งแม้ค่าเริ่มต้นของแพลตฟอร์มหรือการอนุญาตอย่างชัดเจนจะรวมคำสั่งนั้นไว้ หลังจาก Node เปลี่ยนรายการคำสั่งที่ประกาศ ให้ปฏิเสธและอนุมัติการจับคู่อุปกรณ์นั้นใหม่ เพื่อให้ gateway จัดเก็บ snapshot คำสั่งที่อัปเดต
- `gateway.tools.deny`: ชื่อเครื่องมือเพิ่มเติมที่ถูกบล็อกสำหรับ HTTP `POST /tools/invoke` (ขยายรายการ deny เริ่มต้น)
- `gateway.tools.allow`: ลบชื่อเครื่องมือออกจากรายการ deny ของ HTTP เริ่มต้น

</Accordion>

### ปลายทางที่เข้ากันได้กับ OpenAI

- Chat Completions: ปิดใช้งานโดยค่าเริ่มต้น เปิดใช้ด้วย `gateway.http.endpoints.chatCompletions.enabled: true`
- Responses API: `gateway.http.endpoints.responses.enabled`
- การเพิ่มความเข้มงวดสำหรับ URL-input ของ Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlist ว่างจะถือว่าไม่ได้ตั้งค่า; ใช้ `gateway.http.endpoints.responses.files.allowUrl=false`
    และ/หรือ `gateway.http.endpoints.responses.images.allowUrl=false` เพื่อปิดการดึง URL
- เฮดเดอร์เพิ่มความเข้มงวดของ response แบบเลือกได้:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ตั้งค่าเฉพาะสำหรับต้นทาง HTTPS ที่คุณควบคุม; ดู [การตรวจสอบสิทธิ์ผ่าน Trusted Proxy](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### การแยกหลายอินสแตนซ์

เรียกใช้ gateway หลายตัวบนโฮสต์เดียวด้วยพอร์ตและไดเรกทอรีสถานะที่ไม่ซ้ำกัน:

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

- `enabled`: เปิดใช้การ terminate TLS ที่ listener ของ gateway (HTTPS/WSS) (ค่าเริ่มต้น: `false`)
- `autoGenerate`: สร้างคู่ cert/key แบบ self-signed ในเครื่องโดยอัตโนมัติเมื่อไม่ได้กำหนดค่าไฟล์อย่างชัดเจน; ใช้สำหรับ local/dev เท่านั้น
- `certPath`: เส้นทางไฟล์ระบบไปยังไฟล์ใบรับรอง TLS
- `keyPath`: เส้นทางไฟล์ระบบไปยังไฟล์ private key ของ TLS; จำกัดสิทธิ์การเข้าถึงไว้
- `caPath`: เส้นทาง CA bundle แบบเลือกได้สำหรับการตรวจสอบไคลเอนต์หรือ trust chain แบบกำหนดเอง

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

- `mode`: ควบคุมวิธีใช้การแก้ไข config ใน runtime
  - `"off"`: ไม่สนใจการแก้ไขแบบ live; การเปลี่ยนแปลงต้อง restart อย่างชัดเจน
  - `"restart"`: restart โปรเซส gateway เสมอเมื่อ config เปลี่ยน
  - `"hot"`: ใช้การเปลี่ยนแปลงในโปรเซสโดยไม่ restart
  - `"hybrid"` (ค่าเริ่มต้น): ลอง hot reload ก่อน; fallback ไป restart หากจำเป็น
- `debounceMs`: ช่วง debounce เป็น ms ก่อนใช้การเปลี่ยนแปลง config (จำนวนเต็มไม่ติดลบ)
- `deferralTimeoutMs`: เวลาสูงสุดแบบเลือกได้เป็น ms สำหรับรอการดำเนินการที่ยังค้างอยู่ก่อนบังคับ restart หรือ hot reload ของ channel ละไว้เพื่อใช้เวลารอแบบมีขอบเขตค่าเริ่มต้น (`300000`); ตั้งค่า `0` เพื่อรอไม่มีกำหนดและบันทึกคำเตือน still-pending เป็นระยะ

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

การยืนยันตัวตน: `Authorization: Bearer <token>` หรือ `x-openclaw-token: <token>`
โทเค็นฮุกในสตริงคำค้นจะถูกปฏิเสธ

หมายเหตุด้านการตรวจสอบความถูกต้องและความปลอดภัย:

- `hooks.enabled=true` ต้องมี `hooks.token` ที่ไม่ว่างเปล่า
- `hooks.token` ต้อง **แตกต่าง** จาก `gateway.auth.token`; การใช้โทเค็น Gateway ซ้ำจะถูกปฏิเสธ
- `hooks.path` เป็น `/` ไม่ได้; ใช้เส้นทางย่อยเฉพาะ เช่น `/hooks`
- หาก `hooks.allowRequestSessionKey=true` ให้จำกัด `hooks.allowedSessionKeyPrefixes` (เช่น `["hook:"]`)
- หากการแมปหรือพรีเซ็ตใช้ `sessionKey` แบบเทมเพลต ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` และ `hooks.allowRequestSessionKey=true` คีย์การแมปแบบคงที่ไม่ต้องเลือกใช้ตัวเลือกนั้น

**ปลายทาง:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` จากเพย์โหลดคำขอจะถูกยอมรับเฉพาะเมื่อ `hooks.allowRequestSessionKey=true` (ค่าเริ่มต้น: `false`)
- `POST /hooks/<name>` → แก้ผ่าน `hooks.mappings`
  - ค่า `sessionKey` ของการแมปที่เรนเดอร์จากเทมเพลตจะถือว่าเป็นค่าที่ส่งมาจากภายนอก และต้องใช้ `hooks.allowRequestSessionKey=true` เช่นกัน

<Accordion title="รายละเอียดการแมป">

- `match.path` จับคู่เส้นทางย่อยหลัง `/hooks` (เช่น `/hooks/gmail` → `gmail`)
- `match.source` จับคู่ฟิลด์เพย์โหลดสำหรับเส้นทางทั่วไป
- เทมเพลตอย่าง `{{messages[0].subject}}` อ่านค่าจากเพย์โหลด
- `transform` สามารถชี้ไปยังโมดูล JS/TS ที่คืนค่าการกระทำของฮุกได้
  - `transform.module` ต้องเป็นเส้นทางแบบสัมพัทธ์และอยู่ภายใน `hooks.transformsDir` (เส้นทางแบบสัมบูรณ์และการไต่เส้นทางจะถูกปฏิเสธ)
  - เก็บ `hooks.transformsDir` ไว้ใต้ `~/.openclaw/hooks/transforms`; ไดเรกทอรี Skills ของเวิร์กสเปซจะถูกปฏิเสธ หาก `openclaw doctor` รายงานว่าเส้นทางนี้ไม่ถูกต้อง ให้ย้ายโมดูลแปลงเข้าไปในไดเรกทอรีแปลงของฮุก หรือลบ `hooks.transformsDir`
- `agentId` ส่งต่อไปยังเอเจนต์เฉพาะ; ID ที่ไม่รู้จักจะย้อนกลับไปใช้ค่าเริ่มต้น
- `allowedAgentIds`: จำกัดการกำหนดเส้นทางแบบชัดเจน (`*` หรือไม่ได้ระบุ = อนุญาตทั้งหมด, `[]` = ปฏิเสธทั้งหมด)
- `defaultSessionKey`: คีย์เซสชันคงที่แบบไม่บังคับสำหรับการรันเอเจนต์ฮุกที่ไม่มี `sessionKey` ชัดเจน
- `allowRequestSessionKey`: อนุญาตให้ผู้เรียก `/hooks/agent` และคีย์เซสชันการแมปที่ขับเคลื่อนด้วยเทมเพลตตั้งค่า `sessionKey` (ค่าเริ่มต้น: `false`)
- `allowedSessionKeyPrefixes`: รายการอนุญาตคำนำหน้าแบบไม่บังคับสำหรับค่า `sessionKey` ที่ระบุชัดเจน (คำขอ + การแมป) เช่น `["hook:"]` จะกลายเป็นสิ่งจำเป็นเมื่อการแมปหรือพรีเซ็ตใดใช้ `sessionKey` แบบเทมเพลต
- `deliver: true` ส่งคำตอบสุดท้ายไปยังช่องทาง; `channel` มีค่าเริ่มต้นเป็น `last`
- `model` แทนที่ LLM สำหรับการรันฮุกนี้ (ต้องได้รับอนุญาตหากตั้งค่าแคตตาล็อกโมเดลไว้)

</Accordion>

### การผสานรวม Gmail

- พรีเซ็ต Gmail ในตัวใช้ `sessionKey: "hook:gmail:{{messages[0].id}}"`
- หากคุณคงการกำหนดเส้นทางรายข้อความนั้นไว้ ให้ตั้งค่า `hooks.allowRequestSessionKey: true` และจำกัด `hooks.allowedSessionKeyPrefixes` ให้ตรงกับเนมสเปซ Gmail เช่น `["hook:", "hook:gmail:"]`
- หากคุณต้องใช้ `hooks.allowRequestSessionKey: false` ให้แทนที่พรีเซ็ตด้วย `sessionKey` แบบคงที่แทนค่าเริ่มต้นแบบเทมเพลต

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

- ให้บริการ HTML/CSS/JS ที่เอเจนต์แก้ไขได้ และ A2UI ผ่าน HTTP ใต้พอร์ต Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- เฉพาะภายในเครื่อง: คง `gateway.bind: "loopback"` ไว้ (ค่าเริ่มต้น)
- การผูกแบบไม่ใช่ loopback: เส้นทาง canvas ต้องใช้การยืนยันตัวตน Gateway (โทเค็น/รหัสผ่าน/พร็อกซีที่เชื่อถือได้) เช่นเดียวกับพื้นผิว HTTP อื่นของ Gateway
- โดยทั่วไป Node WebViews ไม่ส่งส่วนหัวการยืนยันตัวตน; หลังจากจับคู่และเชื่อมต่อโหนดแล้ว Gateway จะประกาศ URL ความสามารถที่จำกัดขอบเขตตามโหนดสำหรับการเข้าถึง canvas/A2UI
- URL ความสามารถผูกกับเซสชัน WS ของโหนดที่ใช้งานอยู่และหมดอายุอย่างรวดเร็ว ไม่มีการใช้การย้อนกลับตาม IP
- แทรกไคลเอนต์โหลดซ้ำสดเข้าใน HTML ที่ให้บริการ
- สร้าง `index.html` เริ่มต้นอัตโนมัติเมื่อว่างเปล่า
- ให้บริการ A2UI ที่ `/__openclaw__/a2ui/` ด้วย
- การเปลี่ยนแปลงต้องรีสตาร์ต Gateway
- ปิดใช้งานการโหลดซ้ำสดสำหรับไดเรกทอรีขนาดใหญ่หรือข้อผิดพลาด `EMFILE`

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

- `minimal` (ค่าเริ่มต้นเมื่อเปิดใช้งาน Plugin `bonjour` ที่บันเดิลมา): ละ `cliPath` + `sshPort` จากระเบียน TXT
- `full`: รวม `cliPath` + `sshPort`; การโฆษณามัลติคาสต์ LAN ยังต้องเปิดใช้งาน Plugin `bonjour` ที่บันเดิลมา
- `off`: ระงับการโฆษณามัลติคาสต์ LAN โดยไม่เปลี่ยนการเปิดใช้งาน Plugin
- Plugin `bonjour` ที่บันเดิลมาจะเริ่มอัตโนมัติบนโฮสต์ macOS และเป็นแบบเลือกเปิดบน Linux, Windows และการปรับใช้ Gateway แบบคอนเทนเนอร์
- ชื่อโฮสต์มีค่าเริ่มต้นเป็นชื่อโฮสต์ของระบบเมื่อเป็นป้าย DNS ที่ถูกต้อง มิฉะนั้นจะย้อนกลับไปใช้ `openclaw` แทนที่ด้วย `OPENCLAW_MDNS_HOSTNAME`

### พื้นที่กว้าง (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

เขียนโซน DNS-SD แบบยูนิคาสต์ใต้ `~/.openclaw/dns/` สำหรับการค้นพบข้ามเครือข่าย ให้จับคู่กับเซิร์ฟเวอร์ DNS (แนะนำ CoreDNS) + Tailscale split DNS

การตั้งค่า: `openclaw dns setup --apply`

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

- ตัวแปรสภาพแวดล้อมแบบอินไลน์จะถูกใช้เฉพาะเมื่อ process env ไม่มีคีย์นั้นอยู่
- ไฟล์ `.env`: CWD `.env` + `~/.openclaw/.env` (ทั้งสองไม่แทนที่ตัวแปรที่มีอยู่)
- `shellEnv`: นำเข้าคีย์ที่คาดไว้แต่ยังขาดจากโปรไฟล์ login shell ของคุณ
- ดูลำดับความสำคัญทั้งหมดได้ที่ [สภาพแวดล้อม](/th/help/environment)

### การแทนที่ตัวแปรสภาพแวดล้อม

อ้างอิงตัวแปรสภาพแวดล้อมในสตริง config ใดก็ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- จับคู่เฉพาะชื่อที่เป็นตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- ตัวแปรที่หายไปหรือว่างจะทำให้เกิดข้อผิดพลาดขณะโหลด config
- Escape ด้วย `$${VAR}` เพื่อให้ได้ `${VAR}` แบบ literal
- ใช้งานได้กับ `$include`

---

## ข้อมูลลับ

การอ้างอิงข้อมูลลับเป็นแบบเพิ่มทับ: ค่าข้อความธรรมดายังคงใช้งานได้

### `SecretRef`

ใช้รูปแบบอ็อบเจกต์เดียว:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

การตรวจสอบความถูกต้อง:

- รูปแบบ `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- รูปแบบ id ของ `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id ของ `source: "file"`: JSON pointer แบบ absolute (เช่น `"/providers/openai/apiKey"`)
- รูปแบบ id ของ `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id ของ `source: "exec"` ต้องไม่มีเซกเมนต์พาธที่คั่นด้วย slash เป็น `.` หรือ `..` (เช่น `a/../b` จะถูกปฏิเสธ)

### พื้นผิวข้อมูลรับรองที่รองรับ

- เมทริกซ์มาตรฐาน: [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
- เป้าหมาย `secrets apply` รองรับพาธข้อมูลรับรองของ `openclaw.json`
- การอ้างอิงใน `auth-profiles.json` รวมอยู่ในการ resolve ขณะรันไทม์และขอบเขตการ audit

### Config ของ provider ข้อมูลลับ

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
- พาธของ provider แบบ file และ exec จะล้มเหลวแบบปิดเมื่อไม่สามารถตรวจสอบ Windows ACL ได้ ตั้งค่า `allowInsecurePath: true` เฉพาะกับพาธที่เชื่อถือได้ซึ่งไม่สามารถตรวจสอบได้เท่านั้น
- provider `exec` ต้องใช้พาธ `command` แบบ absolute และใช้ protocol payload บน stdin/stdout
- โดยค่าเริ่มต้น พาธคำสั่งที่เป็น symlink จะถูกปฏิเสธ ตั้งค่า `allowSymlinkCommand: true` เพื่ออนุญาตพาธ symlink พร้อมตรวจสอบความถูกต้องของพาธเป้าหมายที่ resolve แล้ว
- หากกำหนดค่า `trustedDirs` ไว้ การตรวจสอบ trusted-dir จะใช้กับพาธเป้าหมายที่ resolve แล้ว
- environment ของ child `exec` จะมีให้น้อยที่สุดโดยค่าเริ่มต้น ให้ส่งตัวแปรที่จำเป็นอย่างชัดเจนด้วย `passEnv`
- การอ้างอิงข้อมูลลับจะถูก resolve ตอน activation เป็น snapshot ในหน่วยความจำ จากนั้นพาธ request จะอ่านจาก snapshot เท่านั้น
- การกรอง active-surface จะใช้ระหว่าง activation: การอ้างอิงที่ resolve ไม่ได้บนพื้นผิวที่เปิดใช้งานจะทำให้ startup/reload ล้มเหลว ส่วนพื้นผิวที่ไม่ได้ใช้งานจะถูกข้ามพร้อม diagnostics

---

## ที่จัดเก็บการยืนยันตัวตน

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

- โปรไฟล์ต่อ agent จะถูกเก็บไว้ที่ `<agentDir>/auth-profiles.json`
- `auth-profiles.json` รองรับการอ้างอิงระดับค่า (`keyRef` สำหรับ `api_key`, `tokenRef` สำหรับ `token`) สำหรับโหมดข้อมูลรับรองแบบ static
- แผนที่ `auth-profiles.json` แบบ flat เดิม เช่น `{ "provider": { "apiKey": "..." } }` ไม่ใช่รูปแบบรันไทม์; `openclaw doctor --fix` จะเขียนใหม่เป็นโปรไฟล์ API-key มาตรฐาน `provider:default` พร้อมข้อมูลสำรอง `.legacy-flat.*.bak`
- โปรไฟล์โหมด OAuth (`auth.profiles.<id>.mode = "oauth"`) ไม่รองรับข้อมูลรับรอง auth-profile ที่อิงกับ SecretRef
- ข้อมูลรับรองรันไทม์แบบ static มาจาก snapshot ที่ resolve แล้วในหน่วยความจำ; รายการ `auth.json` แบบ static เดิมจะถูกล้างเมื่อพบ
- การนำเข้า OAuth เดิมมาจาก `~/.openclaw/credentials/oauth.json`
- ดู [OAuth](/th/concepts/oauth)
- พฤติกรรมรันไทม์ของข้อมูลลับและเครื่องมือ `audit/configure/apply`: [การจัดการข้อมูลลับ](/th/gateway/secrets)

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

- `billingBackoffHours`: ค่า backoff พื้นฐานเป็นชั่วโมงเมื่อโปรไฟล์ล้มเหลวจากข้อผิดพลาดด้านการเรียกเก็บเงินจริงหรือเครดิตไม่เพียงพอ (ค่าเริ่มต้น: `5`) ข้อความเกี่ยวกับการเรียกเก็บเงินที่ชัดเจนยังสามารถมาอยู่ที่นี่ได้แม้ในคำตอบ `401`/`403` แต่ตัวจับคู่ข้อความเฉพาะผู้ให้บริการจะยังจำกัดอยู่กับผู้ให้บริการที่เป็นเจ้าของเท่านั้น (เช่น OpenRouter `Key limit exceeded`) ข้อความ HTTP `402` ที่ลองใหม่ได้เกี่ยวกับกรอบเวลาการใช้งาน หรือขีดจำกัดการใช้จ่ายขององค์กร/เวิร์กสเปซ จะยังอยู่ในเส้นทาง `rate_limit` แทน
- `billingBackoffHoursByProvider`: การแทนที่รายผู้ให้บริการแบบไม่บังคับสำหรับจำนวนชั่วโมง backoff ด้านการเรียกเก็บเงิน
- `billingMaxHours`: เพดานเป็นชั่วโมงสำหรับการเติบโตแบบเอ็กซ์โพเนนเชียลของ backoff ด้านการเรียกเก็บเงิน (ค่าเริ่มต้น: `24`)
- `authPermanentBackoffMinutes`: ค่า backoff พื้นฐานเป็นนาทีสำหรับความล้มเหลว `auth_permanent` ที่มีความมั่นใจสูง (ค่าเริ่มต้น: `10`)
- `authPermanentMaxMinutes`: เพดานเป็นนาทีสำหรับการเติบโตของ backoff `auth_permanent` (ค่าเริ่มต้น: `60`)
- `failureWindowHours`: หน้าต่างเลื่อนเป็นชั่วโมงที่ใช้สำหรับตัวนับ backoff (ค่าเริ่มต้น: `24`)
- `overloadedProfileRotations`: จำนวนสูงสุดของการหมุนเวียนโปรไฟล์การยืนยันตัวตนภายในผู้ให้บริการเดียวกันสำหรับข้อผิดพลาดโอเวอร์โหลด ก่อนสลับไปใช้ model fallback (ค่าเริ่มต้น: `1`) รูปแบบผู้ให้บริการไม่ว่าง เช่น `ModelNotReadyException` จะมาอยู่ที่นี่
- `overloadedBackoffMs`: ดีเลย์คงที่ก่อนลองหมุนเวียนผู้ให้บริการ/โปรไฟล์ที่โอเวอร์โหลดใหม่ (ค่าเริ่มต้น: `0`)
- `rateLimitedProfileRotations`: จำนวนสูงสุดของการหมุนเวียนโปรไฟล์การยืนยันตัวตนภายในผู้ให้บริการเดียวกันสำหรับข้อผิดพลาด rate-limit ก่อนสลับไปใช้ model fallback (ค่าเริ่มต้น: `1`) บักเก็ต rate-limit นั้นรวมข้อความที่มีรูปแบบจากผู้ให้บริการ เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` และ `resource exhausted`

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
- ตั้งค่า `logging.file` เพื่อใช้เส้นทางคงที่
- `consoleLevel` จะเพิ่มเป็น `debug` เมื่อใช้ `--verbose`
- `maxFileBytes`: ขนาดไฟล์ล็อกที่ใช้งานอยู่สูงสุดเป็นไบต์ก่อนหมุนไฟล์ (จำนวนเต็มบวก; ค่าเริ่มต้น: `104857600` = 100 MB) OpenClaw จะเก็บไฟล์เก็บถาวรแบบมีหมายเลขไว้ข้างไฟล์ที่ใช้งานอยู่ได้สูงสุดห้าไฟล์
- `redactSensitive` / `redactPatterns`: การปิดบังแบบดีที่สุดเท่าที่ทำได้สำหรับเอาต์พุตคอนโซล, ไฟล์ล็อก, ระเบียนล็อก OTLP และข้อความถอดความเซสชันที่เก็บไว้ `redactSensitive: "off"` ปิดใช้งานเฉพาะนโยบายล็อก/ข้อความถอดความทั่วไปนี้เท่านั้น; พื้นผิวความปลอดภัยของ UI/เครื่องมือ/การวินิจฉัยยังคงปิดบังความลับก่อนปล่อยออก

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

- `enabled`: สวิตช์หลักสำหรับเอาต์พุตเครื่องมือวัด (ค่าเริ่มต้น: `true`)
- `flags`: อาร์เรย์ของสตริงแฟล็กที่เปิดใช้เอาต์พุตล็อกแบบเจาะจง (รองรับไวลด์การ์ด เช่น `"telegram.*"` หรือ `"*"`)
- `stuckSessionWarnMs`: เกณฑ์อายุที่ไม่มีความคืบหน้าเป็นมิลลิวินาทีสำหรับจัดประเภทเซสชันประมวลผลที่ทำงานนานเป็น `session.long_running`, `session.stalled` หรือ `session.stuck` การตอบกลับ, เครื่องมือ, สถานะ, บล็อก และความคืบหน้า ACP จะรีเซ็ตตัวจับเวลา; การวินิจฉัย `session.stuck` ที่ซ้ำจะ back off ขณะที่ยังไม่เปลี่ยนแปลง
- `stuckSessionAbortMs`: เกณฑ์อายุที่ไม่มีความคืบหน้าเป็นมิลลิวินาทีก่อนที่งานที่ใช้งานอยู่ซึ่งค้างและเข้าเกณฑ์อาจถูก abort-drained เพื่อกู้คืน เมื่อไม่ได้ตั้งค่า OpenClaw จะใช้หน้าต่างการรันแบบฝังที่ขยายและปลอดภัยกว่าอย่างน้อย 10 นาทีและ 5 เท่าของ `stuckSessionWarnMs`
- `otel.enabled`: เปิดใช้ไปป์ไลน์การส่งออก OpenTelemetry (ค่าเริ่มต้น: `false`) สำหรับการกำหนดค่าเต็ม แคตตาล็อกสัญญาณ และโมเดลความเป็นส่วนตัว โปรดดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)
- `otel.endpoint`: URL ของตัวรวบรวมสำหรับการส่งออก OTel
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP เฉพาะสัญญาณแบบไม่บังคับ เมื่อตั้งค่าไว้ จะเขียนทับ `otel.endpoint` สำหรับสัญญาณนั้นเท่านั้น
- `otel.protocol`: `"http/protobuf"` (ค่าเริ่มต้น) หรือ `"grpc"`
- `otel.headers`: ส่วนหัวเมตาดาต้า HTTP/gRPC เพิ่มเติมที่ส่งพร้อมคำขอส่งออก OTel
- `otel.serviceName`: ชื่อบริการสำหรับแอตทริบิวต์ทรัพยากร
- `otel.traces` / `otel.metrics` / `otel.logs`: เปิดใช้การส่งออก trace, metrics หรือ log
- `otel.sampleRate`: อัตราการสุ่มตัวอย่าง trace `0`-`1`
- `otel.flushIntervalMs`: ช่วงเวลาการ flush telemetry เป็นระยะในมิลลิวินาที
- `otel.captureContent`: การจับเนื้อหาดิบแบบเลือกเปิดสำหรับแอตทริบิวต์ span ของ OTEL ค่าเริ่มต้นคือปิด ค่า Boolean `true` จะจับเนื้อหาข้อความ/เครื่องมือที่ไม่ใช่ระบบ; รูปแบบอ็อบเจ็กต์ให้คุณเปิดใช้ `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` และ `systemPrompt` ได้อย่างชัดเจน
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: สวิตช์สภาพแวดล้อมสำหรับแอตทริบิวต์ผู้ให้บริการ span GenAI รุ่นทดลองล่าสุด โดยค่าเริ่มต้น span จะคงแอตทริบิวต์เดิม `gen_ai.system` เพื่อความเข้ากันได้; เมตริก GenAI ใช้แอตทริบิวต์เชิงความหมายแบบมีขอบเขต
- `OPENCLAW_OTEL_PRELOADED=1`: สวิตช์สภาพแวดล้อมสำหรับโฮสต์ที่ได้ลงทะเบียน OpenTelemetry SDK ส่วนกลางไว้แล้ว จากนั้น OpenClaw จะข้ามการเริ่ม/ปิด SDK ที่ Plugin เป็นเจ้าของ ขณะยังคงให้ตัวฟังการวินิจฉัยทำงานอยู่
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` และ `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: ตัวแปรสภาพแวดล้อม endpoint เฉพาะสัญญาณที่ใช้เมื่อไม่ได้ตั้งค่าคีย์การกำหนดค่าที่ตรงกัน
- `cacheTrace.enabled`: บันทึกสแนปช็อต cache trace สำหรับการรันแบบฝัง (ค่าเริ่มต้น: `false`)
- `cacheTrace.filePath`: เส้นทางเอาต์พุตสำหรับ cache trace JSONL (ค่าเริ่มต้น: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)
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

- `channel`: ช่องทางเผยแพร่สำหรับการติดตั้ง npm/git - `"stable"`, `"beta"` หรือ `"dev"`
- `checkOnStart`: ตรวจหาการอัปเดต npm เมื่อ Gateway เริ่มทำงาน (ค่าเริ่มต้น: `true`)
- `auto.enabled`: เปิดใช้งานการอัปเดตอัตโนมัติในพื้นหลังสำหรับการติดตั้งแพ็กเกจ (ค่าเริ่มต้น: `false`)
- `auto.stableDelayHours`: ดีเลย์ขั้นต่ำเป็นชั่วโมงก่อนใช้การอัปเดตอัตโนมัติสำหรับช่องทาง stable (ค่าเริ่มต้น: `6`; สูงสุด: `168`)
- `auto.stableJitterHours`: หน้าต่างกระจายการ rollout เพิ่มเติมของช่องทาง stable เป็นชั่วโมง (ค่าเริ่มต้น: `12`; สูงสุด: `168`)
- `auto.betaCheckIntervalHours`: ความถี่ที่การตรวจสอบช่องทาง beta ทำงานเป็นชั่วโมง (ค่าเริ่มต้น: `1`; สูงสุด: `24`)

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

- `enabled`: feature gate ส่วนกลางของ ACP (ค่าเริ่มต้น: `true`; ตั้งเป็น `false` เพื่อซ่อน ACP dispatch และ affordance การ spawn)
- `dispatch.enabled`: gate อิสระสำหรับการ dispatch turn ของเซสชัน ACP (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อคงคำสั่ง ACP ไว้ในขณะที่บล็อกการดำเนินการ
- `backend`: id แบ็กเอนด์รันไทม์ ACP เริ่มต้น (ต้องตรงกับ Plugin รันไทม์ ACP ที่ลงทะเบียนไว้)
  ติดตั้ง Plugin แบ็กเอนด์ก่อน และหากตั้งค่า `plugins.allow` ไว้ ให้รวม id ของ Plugin แบ็กเอนด์ (เช่น `acpx`) มิฉะนั้นแบ็กเอนด์ ACP จะไม่โหลด
- `defaultAgent`: id เอเจนต์เป้าหมาย ACP สำรองเมื่อการ spawn ไม่ได้ระบุเป้าหมายอย่างชัดเจน
- `allowedAgents`: allowlist ของ id เอเจนต์ที่อนุญาตสำหรับเซสชันรันไทม์ ACP; ค่าว่างหมายถึงไม่มีข้อจำกัดเพิ่มเติม
- `maxConcurrentSessions`: จำนวนสูงสุดของเซสชัน ACP ที่ทำงานพร้อมกัน
- `stream.coalesceIdleMs`: หน้าต่าง idle flush เป็นมิลลิวินาทีสำหรับข้อความที่สตรีม
- `stream.maxChunkChars`: ขนาดชิ้นสูงสุดก่อนแบ่งการฉายบล็อกที่สตรีม
- `stream.repeatSuppression`: ระงับบรรทัดสถานะ/เครื่องมือที่ซ้ำกันต่อ turn (ค่าเริ่มต้น: `true`)
- `stream.deliveryMode`: `"live"` สตรีมแบบเพิ่มทีละส่วน; `"final_only"` บัฟเฟอร์จนถึงเหตุการณ์สิ้นสุดของ turn
- `stream.hiddenBoundarySeparator`: ตัวคั่นก่อนข้อความที่มองเห็นได้หลังเหตุการณ์เครื่องมือที่ซ่อนอยู่ (ค่าเริ่มต้น: `"paragraph"`)
- `stream.maxOutputChars`: จำนวนอักขระเอาต์พุตของผู้ช่วยสูงสุดที่ฉายต่อ ACP turn
- `stream.maxSessionUpdateChars`: จำนวนอักขระสูงสุดสำหรับบรรทัดสถานะ/อัปเดต ACP ที่ฉาย
- `stream.tagVisibility`: ระเบียนของชื่อแท็กไปยังการแทนที่การมองเห็นแบบ boolean สำหรับเหตุการณ์ที่สตรีม
- `runtime.ttlMinutes`: TTL เมื่อ idle เป็นนาทีสำหรับ worker เซสชัน ACP ก่อนเข้าเกณฑ์ล้างข้อมูล
- `runtime.installCommand`: คำสั่งติดตั้งแบบไม่บังคับที่จะรันเมื่อ bootstrap สภาพแวดล้อมรันไทม์ ACP

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

- `cli.banner.taglineMode` ควบคุมสไตล์ tagline ของแบนเนอร์:
  - `"random"` (ค่าเริ่มต้น): tagline ตลก/ตามฤดูกาลที่หมุนเวียน
  - `"default"`: tagline กลางแบบคงที่ (`All your chats, one OpenClaw.`)
  - `"off"`: ไม่มีข้อความ tagline (ยังแสดงชื่อ/เวอร์ชันของแบนเนอร์)
- หากต้องการซ่อนแบนเนอร์ทั้งหมด (ไม่ใช่แค่ tagline) ให้ตั้งค่า env `OPENCLAW_HIDE_BANNER=1`

---

## Wizard

เมตาดาต้าที่เขียนโดยโฟลว์ตั้งค่าแบบมีคำแนะนำของ CLI (`onboard`, `configure`, `doctor`):

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

## ข้อมูลประจำตัว

ดูฟิลด์ข้อมูลประจำตัว `agents.list` ใต้ [ค่าเริ่มต้นของเอเจนต์](/th/gateway/config-agents#agent-defaults)

---

## Bridge (เลิกใช้แล้ว, ถูกนำออก)

บิลด์ปัจจุบันไม่มี TCP bridge อีกต่อไป Node เชื่อมต่อผ่าน WebSocket ของ Gateway คีย์ `bridge.*` ไม่เป็นส่วนหนึ่งของสคีมาการกำหนดค่าอีกต่อไป (การตรวจสอบจะล้มเหลวจนกว่าจะนำออก; `openclaw doctor --fix` สามารถลบคีย์ที่ไม่รู้จักได้)

<Accordion title="การกำหนดค่า bridge รุ่นเก่า (ข้อมูลอ้างอิงย้อนหลัง)">

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

- `sessionRetention`: ระยะเวลาที่เก็บเซสชันการรัน Cron แบบแยกที่เสร็จสมบูรณ์แล้วก่อนตัดออกจาก `sessions.json` นอกจากนี้ยังควบคุมการล้าง transcript ของ Cron ที่ถูกลบและเก็บถาวรไว้ด้วย ค่าเริ่มต้น: `24h`; ตั้งเป็น `false` เพื่อปิดใช้งาน.
- `runLog.maxBytes`: ขนาดสูงสุดต่อไฟล์บันทึกการรัน (`cron/runs/<jobId>.jsonl`) ก่อนตัดข้อมูล ค่าเริ่มต้น: `2_000_000` ไบต์.
- `runLog.keepLines`: บรรทัดล่าสุดที่เก็บไว้เมื่อมีการตัดบันทึกการรัน ค่าเริ่มต้น: `2000`.
- `webhookToken`: โทเคน bearer ที่ใช้สำหรับการส่ง POST ของ Cron Webhook (`delivery.mode = "webhook"`), หากละไว้จะไม่ส่งส่วนหัว auth.
- `webhook`: URL ของ Webhook สำรองแบบเดิมที่เลิกใช้แล้ว (http/https) ใช้เฉพาะกับงานที่บันทึกไว้ซึ่งยังมี `notify: true`.

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

- `maxAttempts`: จำนวนครั้งสูงสุดในการลองใหม่สำหรับงานแบบครั้งเดียวเมื่อเกิดข้อผิดพลาดชั่วคราว (ค่าเริ่มต้น: `3`; ช่วง: `0`-`10`).
- `backoffMs`: อาร์เรย์ของระยะเวลาหน่วง backoff เป็นมิลลิวินาทีสำหรับแต่ละครั้งที่ลองใหม่ (ค่าเริ่มต้น: `[30000, 60000, 300000]`; 1-10 รายการ).
- `retryOn`: ประเภทข้อผิดพลาดที่ทำให้ลองใหม่ - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"` ละไว้เพื่อลองใหม่กับประเภทชั่วคราวทั้งหมด.

มีผลเฉพาะกับงาน Cron แบบครั้งเดียว งานแบบเกิดซ้ำใช้การจัดการความล้มเหลวแยกต่างหาก.

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

- `enabled`: เปิดใช้การแจ้งเตือนความล้มเหลวสำหรับงาน Cron (ค่าเริ่มต้น: `false`).
- `after`: จำนวนความล้มเหลวต่อเนื่องก่อนส่งการแจ้งเตือน (จำนวนเต็มบวก, ต่ำสุด: `1`).
- `cooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการแจ้งเตือนซ้ำสำหรับงานเดียวกัน (จำนวนเต็มไม่ติดลบ).
- `includeSkipped`: นับการรันที่ถูกข้ามต่อเนื่องรวมเข้ากับเกณฑ์การแจ้งเตือน (ค่าเริ่มต้น: `false`) การรันที่ถูกข้ามจะถูกติดตามแยกต่างหากและไม่กระทบ backoff ของข้อผิดพลาดการดำเนินการ.
- `mode`: โหมดการส่ง - `"announce"` ส่งผ่านข้อความของช่อง; `"webhook"` โพสต์ไปยัง Webhook ที่กำหนดค่าไว้.
- `accountId`: id ของบัญชีหรือช่องที่เป็นทางเลือกเพื่อจำกัดขอบเขตการส่งการแจ้งเตือน.

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

- ปลายทางเริ่มต้นสำหรับการแจ้งเตือนความล้มเหลวของ Cron ในทุกงาน.
- `mode`: `"announce"` หรือ `"webhook"`; ค่าเริ่มต้นเป็น `"announce"` เมื่อมีข้อมูลเป้าหมายเพียงพอ.
- `channel`: การแทนที่ช่องสำหรับการส่งแบบ announce `"last"` ใช้ช่องส่งล่าสุดที่ทราบซ้ำ.
- `to`: เป้าหมาย announce หรือ URL ของ Webhook ที่ระบุอย่างชัดเจน จำเป็นสำหรับโหมด Webhook.
- `accountId`: การแทนที่บัญชีสำหรับการส่งที่เป็นทางเลือก.
- `delivery.failureDestination` รายงานต่องานจะแทนที่ค่าเริ่มต้นส่วนกลางนี้.
- เมื่อไม่ได้ตั้งค่าปลายทางความล้มเหลวทั้งแบบส่วนกลางและรายงานต่องาน งานที่ส่งผ่าน `announce` อยู่แล้วจะย้อนกลับไปใช้เป้าหมาย announce หลักนั้นเมื่อเกิดความล้มเหลว.
- รองรับ `delivery.failureDestination` เฉพาะกับงาน `sessionTarget="isolated"` เว้นแต่ `delivery.mode` หลักของงานเป็น `"webhook"`.

ดู [งาน Cron](/th/automation/cron-jobs) การดำเนินการ Cron แบบแยกจะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks).

---

## ตัวแปรเทมเพลตของโมเดลสื่อ

ตัวแทนเทมเพลตที่ขยายใน `tools.media.models[].args`:

| ตัวแปร             | คำอธิบาย                                          |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | เนื้อหาข้อความขาเข้าทั้งหมด                      |
| `{{RawBody}}`      | เนื้อหาดิบ (ไม่มี wrapper ของประวัติ/ผู้ส่ง)      |
| `{{BodyStripped}}` | เนื้อหาที่ตัดการกล่าวถึงกลุ่มออกแล้ว             |
| `{{From}}`         | ตัวระบุผู้ส่ง                                     |
| `{{To}}`           | ตัวระบุปลายทาง                                    |
| `{{MessageSid}}`   | id ข้อความของช่อง                                |
| `{{SessionId}}`    | UUID ของเซสชันปัจจุบัน                           |
| `{{IsNewSession}}` | `"true"` เมื่อสร้างเซสชันใหม่                    |
| `{{MediaUrl}}`     | pseudo-URL ของสื่อขาเข้า                         |
| `{{MediaPath}}`    | เส้นทางสื่อภายในเครื่อง                          |
| `{{MediaType}}`    | ประเภทสื่อ (รูปภาพ/เสียง/เอกสาร/…)               |
| `{{Transcript}}`   | transcript เสียง                                  |
| `{{Prompt}}`       | prompt สื่อที่แก้ค่าแล้วสำหรับรายการ CLI         |
| `{{MaxChars}}`     | จำนวนอักขระเอาต์พุตสูงสุดที่แก้ค่าแล้วสำหรับรายการ CLI |
| `{{ChatType}}`     | `"direct"` หรือ `"group"`                         |
| `{{GroupSubject}}` | หัวข้อกลุ่ม (พยายามอย่างดีที่สุด)                |
| `{{GroupMembers}}` | ตัวอย่างสมาชิกกลุ่ม (พยายามอย่างดีที่สุด)        |
| `{{SenderName}}`   | ชื่อที่แสดงของผู้ส่ง (พยายามอย่างดีที่สุด)       |
| `{{SenderE164}}`   | หมายเลขโทรศัพท์ของผู้ส่ง (พยายามอย่างดีที่สุด)  |
| `{{Provider}}`     | คำใบ้ผู้ให้บริการ (whatsapp, telegram, discord ฯลฯ) |

---

## การรวมไฟล์กำหนดค่า (`$include`)

แยกการกำหนดค่าออกเป็นหลายไฟล์:

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

- ไฟล์เดียว: แทนที่ออบเจ็กต์ที่ครอบอยู่.
- อาร์เรย์ของไฟล์: ผสานแบบลึกตามลำดับ (รายการหลังแทนที่รายการก่อน).
- คีย์พี่น้อง: ผสานหลัง include (แทนที่ค่าที่ include มา).
- include ซ้อนกัน: ลึกได้สูงสุด 10 ระดับ.
- เส้นทาง: แก้ค่าเทียบกับไฟล์ที่ include แต่ต้องยังอยู่ภายในไดเรกทอรีการกำหนดค่าระดับบนสุด (`dirname` ของ `openclaw.json`) อนุญาตรูปแบบ absolute/`../` เฉพาะเมื่อยังแก้ค่าแล้วอยู่ภายในขอบเขตนั้น.
- การเขียนที่ OpenClaw เป็นเจ้าของซึ่งเปลี่ยนเฉพาะส่วนระดับบนสุดหนึ่งส่วนที่รองรับโดย include ไฟล์เดียว จะเขียนทะลุไปยังไฟล์ที่ include นั้น ตัวอย่างเช่น `plugins install` อัปเดต `plugins: { $include: "./plugins.json5" }` ใน `plugins.json5` และปล่อยให้ `openclaw.json` ไม่เปลี่ยนแปลง.
- root includes, อาร์เรย์ include และ include ที่มีการแทนที่ด้วยคีย์พี่น้องเป็นแบบอ่านอย่างเดียวสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนเหล่านั้นจะล้มเหลวแบบปิดแทนการแผ่การกำหนดค่า.
- ข้อผิดพลาด: ข้อความชัดเจนสำหรับไฟล์ที่หายไป, ข้อผิดพลาดการแยกวิเคราะห์, และ include แบบวนซ้ำ.

---

_ที่เกี่ยวข้อง: [การกำหนดค่า](/th/gateway/configuration) · [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
