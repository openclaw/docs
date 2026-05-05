---
read_when:
    - คุณต้องการความหมายหรือค่าเริ่มต้นของการกำหนดค่าระดับฟิลด์ที่แม่นยำ
    - คุณกำลังตรวจสอบความถูกต้องของบล็อกการกำหนดค่าช่องทาง โมเดล Gateway หรือเครื่องมือ
summary: ข้อมูลอ้างอิงการกำหนดค่า Gateway สำหรับคีย์หลักของ OpenClaw ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงของระบบย่อยเฉพาะ
title: ข้อมูลอ้างอิงการกำหนดค่า
x-i18n:
    generated_at: "2026-05-05T01:46:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82164a3ea7592f667573b643ee9e0ec840b9b622c9d86c382a3feaf192e75684
    source_path: gateway/configuration-reference.md
    workflow: 16
---

ข้อมูลอ้างอิงการตั้งค่าหลักสำหรับ `~/.openclaw/openclaw.json` สำหรับภาพรวมแบบมุ่งเน้นงาน โปรดดู [การกำหนดค่า](/th/gateway/configuration)

ครอบคลุมพื้นผิวการตั้งค่าหลักของ OpenClaw และลิงก์ออกไปเมื่อระบบย่อยมีข้อมูลอ้างอิงเชิงลึกของตัวเอง แคตตาล็อกคำสั่งที่ช่องทางและ plugin เป็นเจ้าของ รวมถึงตัวปรับแต่งหน่วยความจำเชิงลึก/QMD อยู่ในหน้าของตัวเองแทนที่จะอยู่ในหน้านี้

แหล่งความจริงของโค้ด:

- `openclaw config schema` พิมพ์ JSON Schema สดที่ใช้สำหรับการตรวจสอบและ Control UI โดยรวม metadata ของ bundled/plugin/channel เข้ามาเมื่อมีให้ใช้
- `config.schema.lookup` ส่งคืนโหนด schema หนึ่งรายการตามขอบเขตเส้นทางสำหรับเครื่องมือเจาะลึก
- `pnpm config:docs:check` / `pnpm config:docs:gen` ตรวจสอบแฮช baseline ของเอกสารการตั้งค่ากับพื้นผิว schema ปัจจุบัน

เส้นทางค้นหาของเอเจนต์: ใช้การกระทำเครื่องมือ `gateway` ชื่อ `config.schema.lookup` สำหรับ
เอกสารและข้อจำกัดระดับฟิลด์ที่แม่นยำก่อนแก้ไข ใช้
[การกำหนดค่า](/th/gateway/configuration) สำหรับคำแนะนำแบบมุ่งเน้นงาน และใช้หน้านี้
สำหรับแผนผังฟิลด์โดยรวม ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงของระบบย่อย

ข้อมูลอ้างอิงเชิงลึกเฉพาะ:

- [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config) สำหรับ `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` และการตั้งค่า dreaming ภายใต้ `plugins.entries.memory-core.config.dreaming`
- [คำสั่ง Slash](/th/tools/slash-commands) สำหรับแคตตาล็อกคำสั่ง built-in + bundled ปัจจุบัน
- หน้าของช่องทาง/plugin เจ้าของ สำหรับพื้นผิวคำสั่งเฉพาะช่องทาง

รูปแบบการตั้งค่าคือ **JSON5** (อนุญาตให้มีคอมเมนต์ + comma ต่อท้ายได้) ทุกฟิลด์เป็นตัวเลือก — OpenClaw ใช้ค่าเริ่มต้นที่ปลอดภัยเมื่อเว้นไว้

---

## ช่องทาง

คีย์การตั้งค่าต่อช่องทางถูกย้ายไปยังหน้าเฉพาะ — ดู
[การกำหนดค่า — ช่องทาง](/th/gateway/config-channels) สำหรับ `channels.*`
รวมถึง Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และช่องทาง
bundled อื่น ๆ (auth, การควบคุมการเข้าถึง, หลายบัญชี, การ gate การ mention)

## ค่าเริ่มต้นของเอเจนต์, multi-agent, sessions และข้อความ

ย้ายไปยังหน้าเฉพาะแล้ว — ดู
[การกำหนดค่า — เอเจนต์](/th/gateway/config-agents) สำหรับ:

- `agents.defaults.*` (workspace, model, thinking, Heartbeat, หน่วยความจำ, media, Skills, sandbox)
- `multiAgent.*` (การกำหนดเส้นทางและ bindings ของ multi-agent)
- `session.*` (วงจรชีวิต session, Compaction, pruning)
- `messages.*` (การส่งข้อความ, TTS, การ render markdown)
- `talk.*` (โหมด Talk)
  - `talk.speechLocale`: id locale BCP 47 แบบตัวเลือกสำหรับการรู้จำเสียงพูดของ Talk บน iOS/macOS
  - `talk.silenceTimeoutMs`: เมื่อไม่ได้ตั้งค่า Talk จะคงหน้าต่างหยุดพักค่าเริ่มต้นของแพลตฟอร์มก่อนส่ง transcript (`700 ms on macOS and Android, 900 ms on iOS`)

## เครื่องมือและผู้ให้บริการที่กำหนดเอง

นโยบายเครื่องมือ, toggle แบบทดลอง, การตั้งค่าเครื่องมือที่รองรับโดยผู้ให้บริการ และการตั้งค่า
ผู้ให้บริการ / base-URL ที่กำหนดเอง ถูกย้ายไปยังหน้าเฉพาะ — ดู
[การกำหนดค่า — เครื่องมือและผู้ให้บริการที่กำหนดเอง](/th/gateway/config-tools)

## Models

คำนิยามผู้ให้บริการ, allowlist ของ model และการตั้งค่าผู้ให้บริการที่กำหนดเองอยู่ใน
[การกำหนดค่า — เครื่องมือและผู้ให้บริการที่กำหนดเอง](/th/gateway/config-tools#custom-providers-and-base-urls)
root `models` ยังเป็นเจ้าของพฤติกรรม model-catalog ทั่วโลกด้วย

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: พฤติกรรมแคตตาล็อกผู้ให้บริการ (`merge` หรือ `replace`)
- `models.providers`: แผนที่ผู้ให้บริการที่กำหนดเอง โดยใช้ provider id เป็นคีย์
- `models.pricing.enabled`: ควบคุม bootstrap การกำหนดราคาที่ทำงานเบื้องหลัง ซึ่ง
  เริ่มหลังจาก sidecars และ channels ไปถึงเส้นทาง Gateway ready เมื่อเป็น `false`
  Gateway จะข้ามการดึง pricing-catalog ของ OpenRouter และ LiteLLM; ค่า
  `models.providers.*.models[].cost` ที่กำหนดไว้ยังคงใช้ได้สำหรับการประมาณค่าใช้จ่ายในเครื่อง

## MCP

คำนิยาม MCP server ที่ OpenClaw จัดการอยู่ภายใต้ `mcp.servers` และถูก
ใช้งานโดย Pi แบบฝังและ runtime adapters อื่น ๆ คำสั่ง `openclaw mcp list`,
`show`, `set` และ `unset` จัดการบล็อกนี้โดยไม่เชื่อมต่อกับ
เซิร์ฟเวอร์เป้าหมายระหว่างแก้ไขการตั้งค่า

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

- `mcp.servers`: คำนิยาม stdio หรือ MCP server ระยะไกลที่ตั้งชื่อไว้ สำหรับ runtime ที่
  เปิดเผยเครื่องมือ MCP ที่กำหนดค่าไว้
  รายการระยะไกลใช้ `transport: "streamable-http"` หรือ `transport: "sse"`;
  `type: "http"` เป็น alias แบบ CLI-native ที่ `openclaw mcp set` และ
  `openclaw doctor --fix` ทำให้เป็นมาตรฐานเข้าสู่ฟิลด์ canonical `transport`
- `mcp.sessionIdleTtlMs`: TTL ขณะ idle สำหรับ runtime MCP แบบ bundled ที่มีขอบเขตตาม session
  การรันแบบฝังครั้งเดียวร้องขอ cleanup ตอนจบการรัน; TTL นี้เป็น backstop สำหรับ
  session ที่มีอายุยาวและ caller ในอนาคต
- การเปลี่ยนแปลงภายใต้ `mcp.*` hot-apply โดยการ dispose runtime MCP ของ session ที่ cache ไว้
  การ discovery/use เครื่องมือครั้งถัดไปจะสร้างใหม่จากการตั้งค่าใหม่ ดังนั้นรายการ
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
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
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

- `allowBundled`: allowlist แบบตัวเลือกสำหรับ Skills แบบ bundled เท่านั้น (Skills แบบ managed/workspace ไม่ได้รับผลกระทบ)
- `load.extraDirs`: root ของ skill ที่แชร์เพิ่มเติม (ลำดับความสำคัญต่ำสุด)
- `install.preferBrew`: เมื่อเป็น true ให้เลือกตัวติดตั้ง Homebrew ก่อนเมื่อมี `brew`
  ให้ใช้ ก่อน fallback ไปยังชนิดตัวติดตั้งอื่น
- `install.nodeManager`: preference ของตัวติดตั้ง node สำหรับ spec `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`)
- `entries.<skillKey>.enabled: false` ปิดใช้งาน skill แม้ว่าจะ bundled/installed อยู่
- `entries.<skillKey>.apiKey`: ตัวอำนวยความสะดวกสำหรับ Skills ที่ประกาศ env var หลัก (สตริง plaintext หรืออ็อบเจกต์ SecretRef)

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
- Discovery ยอมรับ OpenClaw plugins แบบ native รวมถึง bundle ของ Codex และ Claude ที่เข้ากันได้ รวมถึง bundle layout ค่าเริ่มต้นของ Claude ที่ไม่มี manifest
- **การเปลี่ยนแปลงการตั้งค่าต้อง restart gateway**
- `allow`: allowlist แบบตัวเลือก (โหลดเฉพาะ plugins ที่ระบุไว้) `deny` ชนะ
- `bundledDiscovery`: ค่าเริ่มต้นเป็น `"allowlist"` สำหรับการตั้งค่าใหม่ ดังนั้น
  `plugins.allow` ที่ไม่ว่างจะ gate bundled provider plugins ด้วย รวมถึง web-search
  runtime providers Doctor เขียน `"compat"` สำหรับการตั้งค่า allowlist แบบ legacy ที่ migrate แล้ว
  เพื่อรักษาพฤติกรรม bundled provider เดิมไว้จนกว่าคุณจะ opt in
- `plugins.entries.<id>.apiKey`: ฟิลด์อำนวยความสะดวกสำหรับ API key ระดับ plugin (เมื่อ plugin รองรับ)
- `plugins.entries.<id>.env`: แผนที่ env var ตามขอบเขต plugin
- `plugins.entries.<id>.hooks.allowPromptInjection`: เมื่อเป็น `false` core จะบล็อก `before_prompt_build` และละเว้นฟิลด์ที่แก้ไข prompt จาก `before_agent_start` แบบ legacy ขณะยังคงรักษา `modelOverride` และ `providerOverride` แบบ legacy ไว้ ใช้กับ hooks ของ native plugin และไดเรกทอรี hook ที่ bundle-provided รองรับ
- `plugins.entries.<id>.hooks.allowConversationAccess`: เมื่อเป็น `true` plugins แบบ non-bundled ที่เชื่อถือได้อาจอ่านเนื้อหาการสนทนาดิบจาก typed hooks เช่น `llm_input`, `llm_output`, `before_agent_finalize` และ `agent_end`
- `plugins.entries.<id>.subagent.allowModelOverride`: เชื่อถือ plugin นี้อย่างชัดเจนให้ร้องขอ `provider` และ `model` overrides ต่อการรัน สำหรับการรัน subagent เบื้องหลัง
- `plugins.entries.<id>.subagent.allowedModels`: allowlist แบบตัวเลือกของเป้าหมาย `provider/model` canonical สำหรับ trusted subagent overrides ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาต model ใดก็ได้
- `plugins.entries.<id>.config`: อ็อบเจกต์การตั้งค่าที่ plugin กำหนด (ตรวจสอบโดย schema ของ OpenClaw plugin แบบ native เมื่อมีให้ใช้)
- การตั้งค่าบัญชี/runtime ของ Channel plugin อยู่ภายใต้ `channels.<id>` และควรอธิบายโดย metadata `channelConfigs` ใน manifest ของ plugin เจ้าของ ไม่ใช่โดย registry ตัวเลือกกลางของ OpenClaw
- `plugins.entries.firecrawl.config.webFetch`: การตั้งค่า web-fetch provider ของ Firecrawl
  - `apiKey`: API key ของ Firecrawl (รับ SecretRef) fallback ไปยัง `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` แบบ legacy หรือ env var `FIRECRAWL_API_KEY`
  - `baseUrl`: base URL ของ Firecrawl API (ค่าเริ่มต้น: `https://api.firecrawl.dev`; overrides แบบ self-hosted ต้องชี้ไปยัง endpoints ส่วนตัว/ภายใน)
  - `onlyMainContent`: ดึงเฉพาะเนื้อหาหลักจากหน้าเว็บ (ค่าเริ่มต้น: `true`)
  - `maxAgeMs`: อายุ cache สูงสุดเป็นมิลลิวินาที (ค่าเริ่มต้น: `172800000` / 2 วัน)
  - `timeoutSeconds`: timeout ของคำขอ scrape เป็นวินาที (ค่าเริ่มต้น: `60`)
- `plugins.entries.xai.config.xSearch`: การตั้งค่า xAI X Search (Grok web search)
  - `enabled`: เปิดใช้งาน X Search provider
  - `model`: Grok model ที่ใช้สำหรับ search (เช่น `"grok-4-1-fast"`)
- `plugins.entries.memory-core.config.dreaming`: การตั้งค่า memory dreaming ดู [Dreaming](/th/concepts/dreaming) สำหรับ phases และ thresholds
  - `enabled`: switch หลักของ dreaming (ค่าเริ่มต้น `false`)
  - `frequency`: cadence แบบ cron สำหรับแต่ละ dreaming sweep เต็มรูปแบบ (`"0 3 * * *"` เป็นค่าเริ่มต้น)
  - `model`: override model ของ subagent Dream Diary แบบตัวเลือก ต้องใช้ `plugins.entries.memory-core.subagent.allowModelOverride: true`; จับคู่กับ `allowedModels` เพื่อจำกัดเป้าหมาย ข้อผิดพลาด model-unavailable จะ retry หนึ่งครั้งด้วย model ค่าเริ่มต้นของ session; ความล้มเหลวด้าน trust หรือ allowlist จะไม่ fallback แบบเงียบ ๆ
  - นโยบาย phase และ thresholds เป็นรายละเอียด implementation (ไม่ใช่คีย์การตั้งค่าที่ user-facing)
- การตั้งค่าหน่วยความจำทั้งหมดอยู่ใน [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Claude bundle plugins ที่เปิดใช้งานยังสามารถมีค่าเริ่มต้นของ Pi แบบฝังจาก `settings.json` ได้ด้วย; OpenClaw ใช้ค่าเหล่านั้นเป็นการตั้งค่า agent ที่ผ่านการ sanitize ไม่ใช่ raw patches ของการตั้งค่า OpenClaw
- `plugins.slots.memory`: เลือก id ของ active memory plugin หรือ `"none"` เพื่อปิดใช้งาน memory plugins
- `plugins.slots.contextEngine`: เลือก id ของ active context engine plugin; ค่าเริ่มต้นคือ `"legacy"` เว้นแต่คุณติดตั้งและเลือก engine อื่น

ดู [Plugins](/th/tools/plugin)

---

## Commitments

`commitments` ควบคุมหน่วยความจำ follow-up ที่อนุมานได้: OpenClaw สามารถตรวจพบ check-ins จาก turns ของการสนทนาและส่งผ่านการรัน Heartbeat ได้

- `commitments.enabled`: เปิดใช้งานการ extraction โดย LLM แบบซ่อน, storage และการส่งผ่าน Heartbeat สำหรับ commitments แบบ follow-up ที่อนุมานได้ ค่าเริ่มต้น: `false`
- `commitments.maxPerDay`: จำนวน commitments แบบ follow-up ที่อนุมานได้สูงสุดที่ส่งต่อ agent session ในหนึ่งวันแบบ rolling ค่าเริ่มต้น: `3`

ดู [Commitments ที่อนุมานได้](/th/concepts/commitments)

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
- `tabCleanup` เรียกคืนแท็บของเอเจนต์หลักที่ถูกติดตามหลังจากไม่มีการใช้งานตามเวลาที่กำหนด หรือเมื่อ
  เซสชันมีจำนวนเกินขีดจำกัด ตั้งค่า `idleMinutes: 0` หรือ `maxTabsPerSession: 0` เพื่อ
  ปิดใช้งานโหมดการล้างข้อมูลแต่ละรายการ
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` จะถูกปิดใช้งานเมื่อไม่ได้ตั้งค่า ดังนั้นการนำทางของเบราว์เซอร์จึงเข้มงวดตามค่าเริ่มต้น
- ตั้งค่า `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เฉพาะเมื่อคุณตั้งใจเชื่อถือการนำทางเบราว์เซอร์ในเครือข่ายส่วนตัว
- ในโหมดเข้มงวด endpoint ของโปรไฟล์ CDP ระยะไกล (`profiles.*.cdpUrl`) จะอยู่ภายใต้การบล็อกเครือข่ายส่วนตัวแบบเดียวกันระหว่างการตรวจสอบการเข้าถึง/การค้นพบ
- `ssrfPolicy.allowPrivateNetwork` ยังคงรองรับในฐานะนามแฝงเดิม
- ในโหมดเข้มงวด ให้ใช้ `ssrfPolicy.hostnameAllowlist` และ `ssrfPolicy.allowedHostnames` สำหรับข้อยกเว้นที่ระบุชัดเจน
- โปรไฟล์ระยะไกลเป็นแบบแนบเท่านั้น (ปิดใช้งาน start/stop/reset)
- `profiles.*.cdpUrl` รองรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) เมื่อคุณต้องการให้ OpenClaw ค้นพบ `/json/version`; ใช้ WS(S)
  เมื่อผู้ให้บริการของคุณให้ URL ของ DevTools WebSocket โดยตรง
- `remoteCdpTimeoutMs` และ `remoteCdpHandshakeTimeoutMs` มีผลกับการเข้าถึง CDP ระยะไกลและ
  `attachOnly` รวมถึงคำขอเปิดแท็บ โปรไฟล์ local loopback
  ที่มีการจัดการจะใช้ค่าเริ่มต้น CDP ภายในเครื่องต่อไป
- หากบริการ CDP ที่จัดการจากภายนอกเข้าถึงได้ผ่าน loopback ให้ตั้งค่า
  `attachOnly: true` ของโปรไฟล์นั้น มิฉะนั้น OpenClaw จะถือว่าพอร์ต loopback เป็น
  โปรไฟล์เบราว์เซอร์ภายในเครื่องที่มีการจัดการ และอาจรายงานข้อผิดพลาดความเป็นเจ้าของพอร์ตภายในเครื่อง
- โปรไฟล์ `existing-session` ใช้ Chrome MCP แทน CDP และสามารถแนบกับ
  โฮสต์ที่เลือกหรือผ่านโหนดเบราว์เซอร์ที่เชื่อมต่ออยู่
- โปรไฟล์ `existing-session` สามารถตั้งค่า `userDataDir` เพื่อกำหนดเป้าหมาย
  โปรไฟล์เบราว์เซอร์ที่ใช้ Chromium เฉพาะ เช่น Brave หรือ Edge
- โปรไฟล์ `existing-session` ยังคงใช้ข้อจำกัดเส้นทาง Chrome MCP ปัจจุบัน:
  การทำงานที่ขับเคลื่อนด้วย snapshot/ref แทนการกำหนดเป้าหมายด้วย CSS selector, hook อัปโหลดไฟล์เดียว,
  ไม่มีการ override timeout ของกล่องโต้ตอบ, ไม่มี `wait --load networkidle` และไม่มี
  `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด หรือการทำงานแบบกลุ่ม
- โปรไฟล์ `openclaw` ภายในเครื่องที่มีการจัดการจะกำหนด `cdpPort` และ `cdpUrl` โดยอัตโนมัติ; ให้
  ตั้งค่า `cdpUrl` อย่างชัดเจนเฉพาะสำหรับ CDP ระยะไกลเท่านั้น
- โปรไฟล์ภายในเครื่องที่มีการจัดการสามารถตั้งค่า `executablePath` เพื่อ override
  `browser.executablePath` ส่วนกลางสำหรับโปรไฟล์นั้น ใช้สิ่งนี้เพื่อเรียกใช้โปรไฟล์หนึ่งใน
  Chrome และอีกโปรไฟล์หนึ่งใน Brave
- โปรไฟล์ภายในเครื่องที่มีการจัดการใช้ `browser.localLaunchTimeoutMs` สำหรับการค้นพบ Chrome CDP HTTP
  หลังจากเริ่มโปรเซส และใช้ `browser.localCdpReadyTimeoutMs` สำหรับ
  ความพร้อมของ CDP websocket หลังเปิดใช้งาน เพิ่มค่าเหล่านี้บนโฮสต์ที่ช้ากว่า ซึ่ง Chrome
  เริ่มสำเร็จแต่การตรวจสอบความพร้อมแข่งกับการเริ่มต้น ทั้งสองค่าต้องเป็น
  จำนวนเต็มบวกไม่เกิน `120000` ms; ค่าคอนฟิกที่ไม่ถูกต้องจะถูกปฏิเสธ
- ลำดับการตรวจจับอัตโนมัติ: เบราว์เซอร์เริ่มต้นหากใช้ Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary
- ทั้ง `browser.executablePath` และ `browser.profiles.<name>.executablePath`
  รองรับ `~` และ `~/...` สำหรับไดเรกทอรี home ของ OS ก่อนเริ่ม Chromium
  `userDataDir` ต่อโปรไฟล์บนโปรไฟล์ `existing-session` จะถูกขยาย tilde ด้วย
- บริการควบคุม: เฉพาะ loopback เท่านั้น (พอร์ตมาจาก `gateway.port`, ค่าเริ่มต้น `18791`)
- `extraArgs` เพิ่มแฟล็กการเปิดใช้งานเพิ่มเติมให้การเริ่มต้น Chromium ภายในเครื่อง (เช่น
  `--disable-gpu`, การกำหนดขนาดหน้าต่าง หรือแฟล็กดีบัก)

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

- `seamColor`: สีเน้นสำหรับโครม UI ของแอปเนทีฟ (สีของฟอง Talk Mode เป็นต้น)
- `assistant`: การ override ตัวตนใน Control UI ถอยกลับไปใช้ตัวตนของเอเจนต์ที่ใช้งานอยู่

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

- `mode`: `local` (เรียกใช้ gateway) หรือ `remote` (เชื่อมต่อไปยัง gateway ระยะไกล) Gateway จะปฏิเสธการเริ่มทำงานเว้นแต่เป็น `local`.
- `port`: พอร์ตมัลติเพล็กซ์เดียวสำหรับ WS + HTTP ลำดับความสำคัญ: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (ค่าเริ่มต้น), `lan` (`0.0.0.0`), `tailnet` (เฉพาะ IP ของ Tailscale) หรือ `custom`.
- **นามแฝง bind แบบเดิม**: ใช้ค่าของโหมด bind ใน `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`) ไม่ใช่นามแฝงโฮสต์ (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **หมายเหตุ Docker**: bind ค่าเริ่มต้น `loopback` จะฟังที่ `127.0.0.1` ภายในคอนเทนเนอร์ เมื่อใช้เครือข่าย Docker bridge (`-p 18789:18789`) ทราฟฟิกจะมาถึงที่ `eth0` ดังนั้น gateway จึงเข้าถึงไม่ได้ ใช้ `--network host` หรือตั้งค่า `bind: "lan"` (หรือ `bind: "custom"` พร้อม `customBindHost: "0.0.0.0"`) เพื่อฟังบนทุกอินเทอร์เฟซ.
- **การยืนยันตัวตน**: จำเป็นตามค่าเริ่มต้น bind ที่ไม่ใช่ loopback ต้องใช้การยืนยันตัวตนของ gateway ในทางปฏิบัติ หมายถึงโทเค็น/รหัสผ่านที่ใช้ร่วมกัน หรือ reverse proxy ที่รับรู้ตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"` วิซาร์ดการเริ่มต้นใช้งานจะสร้างโทเค็นตามค่าเริ่มต้น.
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) ให้ตั้งค่า `gateway.auth.mode` อย่างชัดเจนเป็น `token` หรือ `password` โฟลว์การเริ่มทำงานและการติดตั้ง/ซ่อมแซมบริการจะล้มเหลวเมื่อกำหนดค่าทั้งสองและไม่ได้ตั้งค่า mode.
- `gateway.auth.mode: "none"`: โหมดไม่มีการยืนยันตัวตนแบบชัดเจน ใช้เฉพาะสำหรับการตั้งค่า local loopback ที่เชื่อถือได้เท่านั้น; โหมดนี้ตั้งใจไม่เสนอในพรอมป์การเริ่มต้นใช้งาน.
- `gateway.auth.mode: "trusted-proxy"`: มอบหมายการยืนยันตัวตนของเบราว์เซอร์/ผู้ใช้ให้ reverse proxy ที่รับรู้ตัวตน และเชื่อถือส่วนหัวตัวตนจาก `gateway.trustedProxies` (ดู [การยืนยันตัวตน Trusted Proxy](/th/gateway/trusted-proxy-auth)) โหมดนี้คาดหวังแหล่งที่มาของพร็อกซีแบบ **ไม่ใช่ loopback** ตามค่าเริ่มต้น; reverse proxy แบบ loopback บนโฮสต์เดียวกันต้องกำหนด `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน ผู้เรียกภายในบนโฮสต์เดียวกันสามารถใช้ `gateway.auth.password` เป็นทางเลือกโดยตรงภายในเครื่องได้; `gateway.auth.token` ยังคงใช้ร่วมกับโหมด trusted-proxy ไม่ได้.
- `gateway.auth.allowTailscale`: เมื่อเป็น `true` ส่วนหัวตัวตนของ Tailscale Serve สามารถผ่านการยืนยันตัวตนของ Control UI/WebSocket ได้ (ตรวจสอบผ่าน `tailscale whois`) เอนด์พอยต์ HTTP API **ไม่** ใช้การยืนยันตัวตนผ่านส่วนหัว Tailscale นั้น; แต่จะทำตามโหมดการยืนยันตัวตน HTTP ปกติของ gateway แทน โฟลว์ที่ไม่ใช้โทเค็นนี้ถือว่าโฮสต์ gateway เชื่อถือได้ ค่าเริ่มต้นเป็น `true` เมื่อ `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: ตัวจำกัดความพยายามยืนยันตัวตนที่ล้มเหลวแบบไม่บังคับ ใช้ต่อ IP ไคลเอนต์และต่อขอบเขตการยืนยันตัวตน (shared-secret และ device-token ถูกติดตามแยกกัน) ความพยายามที่ถูกบล็อกจะส่งคืน `429` + `Retry-After`.
  - บนเส้นทาง Control UI ของ Tailscale Serve แบบอะซิงโครนัส ความพยายามที่ล้มเหลวสำหรับ `{scope, clientIp}` เดียวกันจะถูกจัดลำดับก่อนเขียนผลล้มเหลว ดังนั้นความพยายามที่ผิดพลาดพร้อมกันจากไคลเอนต์เดียวกันอาจทำให้ตัวจำกัดทำงานในคำขอที่สอง แทนที่ทั้งสองจะวิ่งผ่านไปเป็นการไม่ตรงกันธรรมดา.
  - `gateway.auth.rateLimit.exemptLoopback` มีค่าเริ่มต้นเป็น `true`; ตั้งค่า `false` เมื่อคุณตั้งใจให้ทราฟฟิก localhost ถูกจำกัดอัตราด้วย (สำหรับการตั้งค่าทดสอบหรือการปรับใช้พร็อกซีแบบเข้มงวด).
- ความพยายามยืนยันตัวตน WS จาก origin ของเบราว์เซอร์จะถูกจำกัดความถี่เสมอโดยปิดการยกเว้น loopback (การป้องกันเชิงลึกต่อการ brute force localhost จากเบราว์เซอร์).
- บน loopback การล็อกเอาต์จาก origin ของเบราว์เซอร์เหล่านั้นจะถูกแยกตามค่า `Origin`
  ที่ปรับให้เป็นมาตรฐานแล้ว ดังนั้นความล้มเหลวซ้ำจาก origin localhost หนึ่งจะไม่ล็อกเอาต์
  origin อื่นโดยอัตโนมัติ.
- `tailscale.mode`: `serve` (เฉพาะ tailnet, bind แบบ loopback) หรือ `funnel` (สาธารณะ, ต้องมีการยืนยันตัวตน).
- `controlUi.allowedOrigins`: allowlist ของ origin เบราว์เซอร์แบบชัดเจนสำหรับการเชื่อมต่อ WebSocket ของ Gateway จำเป็นเมื่อคาดว่าไคลเอนต์เบราว์เซอร์จะมาจาก origin ที่ไม่ใช่ loopback.
- `controlUi.chatMessageMaxWidth`: max-width แบบไม่บังคับสำหรับข้อความแชต Control UI ที่จัดกลุ่ม รองรับค่า CSS width แบบจำกัด เช่น `960px`, `82%`, `min(1280px, 82%)` และ `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: โหมดอันตรายที่เปิดใช้การ fallback origin จากส่วนหัว Host สำหรับการปรับใช้ที่ตั้งใจพึ่งพานโยบาย origin จากส่วนหัว Host.
- `remote.transport`: `ssh` (ค่าเริ่มต้น) หรือ `direct` (ws/wss) สำหรับ `direct`, `remote.url` ต้องเป็น `ws://` หรือ `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: การแทนที่แบบ break-glass ฝั่งไคลเอนต์ผ่านสภาพแวดล้อมของโปรเซส
  ที่อนุญาต plaintext `ws://` ไปยัง IP เครือข่ายส่วนตัวที่เชื่อถือได้;
  ค่าเริ่มต้นยังคงเป็น loopback-only สำหรับ plaintext ไม่มีค่าเทียบเท่าใน `openclaw.json`
  และการตั้งค่าเครือข่ายส่วนตัวของเบราว์เซอร์ เช่น
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` จะไม่ส่งผลต่อไคลเอนต์ WebSocket ของ Gateway.
- `gateway.remote.token` / `.password` เป็นฟิลด์ข้อมูลประจำตัวของไคลเอนต์ระยะไกล ไม่ได้กำหนดค่าการยืนยันตัวตนของ gateway ด้วยตัวเอง.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS พื้นฐานสำหรับรีเลย์ APNs ภายนอกที่ใช้โดยบิลด์ iOS ทางการ/TestFlight หลังจากเผยแพร่การลงทะเบียนที่มีรีเลย์รองรับไปยัง gateway URL นี้ต้องตรงกับ URL รีเลย์ที่คอมไพล์เข้าไปในบิลด์ iOS.
- `gateway.push.apns.relay.timeoutMs`: ระยะหมดเวลาการส่งจาก gateway ไปยังรีเลย์เป็นมิลลิวินาที ค่าเริ่มต้นคือ `10000`.
- การลงทะเบียนที่มีรีเลย์รองรับจะถูกมอบหมายให้ตัวตน gateway เฉพาะ แอป iOS ที่จับคู่แล้วจะดึง `gateway.identity.get`, ใส่ตัวตนนั้นในการลงทะเบียนรีเลย์ และส่งต่อสิทธิ์การส่งตามขอบเขตการลงทะเบียนไปยัง gateway Gateway อื่นไม่สามารถนำการลงทะเบียนที่จัดเก็บไว้นั้นกลับมาใช้ซ้ำได้.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: การแทนที่ env ชั่วคราวสำหรับการกำหนดค่ารีเลย์ข้างต้น.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: ช่องทางหลีกเลี่ยงสำหรับการพัฒนาเท่านั้นสำหรับ URL รีเลย์ HTTP แบบ loopback URL รีเลย์สำหรับโปรดักชันควรอยู่บน HTTPS.
- `gateway.handshakeTimeoutMs`: ระยะหมดเวลา pre-auth สำหรับการ handshake WebSocket ของ Gateway เป็นมิลลิวินาที ค่าเริ่มต้น: `15000` `OPENCLAW_HANDSHAKE_TIMEOUT_MS` มีลำดับความสำคัญเมื่อถูกตั้งค่า เพิ่มค่านี้บนโฮสต์ที่มีโหลดสูงหรือพลังประมวลผลต่ำ ซึ่งไคลเอนต์ภายในเครื่องสามารถเชื่อมต่อได้ขณะ warmup ตอนเริ่มทำงานยังคงกำลังเข้าที่.
- `gateway.channelHealthCheckMinutes`: ช่วงเวลาของ health-monitor ช่องทางเป็นนาที ตั้งค่า `0` เพื่อปิดการรีสตาร์ตโดย health-monitor ทั่วทั้งระบบ ค่าเริ่มต้น: `5`.
- `gateway.channelStaleEventThresholdMinutes`: เกณฑ์ stale-socket เป็นนาที ให้ค่านี้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes` ค่าเริ่มต้น: `30`.
- `gateway.channelMaxRestartsPerHour`: จำนวนสูงสุดของการรีสตาร์ตโดย health-monitor ต่อช่องทาง/บัญชีในช่วงเวลาหนึ่งชั่วโมงแบบ rolling ค่าเริ่มต้น: `10`.
- `channels.<provider>.healthMonitor.enabled`: การเลือกปิดต่อช่องทางสำหรับการรีสตาร์ตโดย health-monitor ในขณะที่ยังเปิดใช้งานตัวตรวจสอบระดับ global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: การแทนที่ต่อบัญชีสำหรับช่องทางหลายบัญชี เมื่อถูกตั้งค่า จะมีลำดับความสำคัญเหนือการแทนที่ระดับช่องทาง.
- เส้นทางการเรียก gateway ภายในเครื่องสามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`.
- หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดค่าอย่างชัดเจนผ่าน SecretRef และแก้ค่าไม่ได้ การแก้ค่าจะล้มเหลวแบบปิด (ไม่มี remote fallback มาบดบัง).
- `trustedProxies`: IP ของ reverse proxy ที่สิ้นสุด TLS หรือฉีดส่วนหัว forwarded-client ระบุเฉพาะพร็อกซีที่คุณควบคุม รายการ loopback ยังคงใช้ได้สำหรับการตั้งค่าพร็อกซี/การตรวจจับภายในเครื่องบนโฮสต์เดียวกัน (เช่น Tailscale Serve หรือ reverse proxy ภายในเครื่อง) แต่รายการเหล่านี้ **ไม่** ทำให้คำขอ loopback เข้าเกณฑ์สำหรับ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: เมื่อเป็น `true` gateway จะยอมรับ `X-Real-IP` หากไม่มี `X-Forwarded-For` ค่าเริ่มต้นคือ `false` สำหรับพฤติกรรม fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist CIDR/IP แบบไม่บังคับสำหรับการอนุมัติการจับคู่อุปกรณ์ node ครั้งแรกโดยอัตโนมัติเมื่อไม่มี scope ที่ร้องขอ ปิดใช้งานเมื่อไม่ได้ตั้งค่า สิ่งนี้ไม่อนุมัติการจับคู่ operator/browser/Control UI/WebChat โดยอัตโนมัติ และไม่อนุมัติการอัปเกรดบทบาท, scope, metadata หรือ public-key โดยอัตโนมัติ.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: การกำหนด allow/deny ระดับ global สำหรับคำสั่ง node ที่ประกาศไว้หลังจากการจับคู่และการประเมิน allowlist ของแพลตฟอร์ม ใช้ `allowCommands` เพื่อเลือกเปิดใช้คำสั่ง node อันตราย เช่น `camera.snap`, `camera.clip` และ `screen.record`; `denyCommands` จะลบคำสั่งออกแม้ค่าเริ่มต้นของแพลตฟอร์มหรือการอนุญาตอย่างชัดเจนจะรวมคำสั่งนั้นไว้ก็ตาม หลังจาก node เปลี่ยนรายการคำสั่งที่ประกาศไว้ ให้ปฏิเสธและอนุมัติการจับคู่อุปกรณ์นั้นใหม่ เพื่อให้ gateway จัดเก็บ snapshot คำสั่งที่อัปเดตแล้ว.
- `gateway.tools.deny`: ชื่อเครื่องมือเพิ่มเติมที่ถูกบล็อกสำหรับ HTTP `POST /tools/invoke` (ขยายรายการ deny ค่าเริ่มต้น).
- `gateway.tools.allow`: ลบชื่อเครื่องมือออกจากรายการ deny HTTP ค่าเริ่มต้น.

</Accordion>

### เอนด์พอยต์ที่เข้ากันได้กับ OpenAI

- Chat Completions: ปิดใช้งานตามค่าเริ่มต้น เปิดใช้งานด้วย `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- การเพิ่มความแข็งแกร่งให้ URL-input ของ Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlist ว่างจะถือว่าไม่ได้ตั้งค่า; ใช้ `gateway.http.endpoints.responses.files.allowUrl=false`
    และ/หรือ `gateway.http.endpoints.responses.images.allowUrl=false` เพื่อปิดการดึง URL.
- ส่วนหัวเพิ่มความแข็งแกร่งให้ response แบบไม่บังคับ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ตั้งค่าเฉพาะสำหรับ origin HTTPS ที่คุณควบคุม; ดู [การยืนยันตัวตน Trusted Proxy](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### การแยกหลายอินสแตนซ์

เรียกใช้ gateway หลายตัวบนโฮสต์เดียวด้วยพอร์ตและไดเรกทอรี state ที่ไม่ซ้ำกัน:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

แฟล็กอำนวยความสะดวก: `--dev` (ใช้ `~/.openclaw-dev` + พอร์ต `19001`), `--profile <name>` (ใช้ `~/.openclaw-<name>`).

ดู [Gateway หลายตัว](/th/gateway/multiple-gateways).

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

- `enabled`: เปิดใช้การสิ้นสุด TLS ที่ listener ของ gateway (HTTPS/WSS) (ค่าเริ่มต้น: `false`).
- `autoGenerate`: สร้างคู่ cert/key แบบ self-signed ภายในเครื่องโดยอัตโนมัติเมื่อไม่ได้กำหนดค่าไฟล์อย่างชัดเจน; สำหรับการใช้งาน local/dev เท่านั้น.
- `certPath`: path ระบบไฟล์ไปยังไฟล์ใบรับรอง TLS.
- `keyPath`: path ระบบไฟล์ไปยังไฟล์ private key ของ TLS; จำกัดสิทธิ์การเข้าถึงไว้.
- `caPath`: path ของ CA bundle แบบไม่บังคับสำหรับการตรวจสอบไคลเอนต์หรือ trust chain แบบกำหนดเอง.

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

- `mode`: ควบคุมวิธีนำการแก้ไข config ไปใช้ขณะรันไทม์.
  - `"off"`: เพิกเฉยต่อการแก้ไขแบบ live; การเปลี่ยนแปลงต้อง restart อย่างชัดเจน.
  - `"restart"`: restart โปรเซส gateway เสมอเมื่อ config เปลี่ยน.
  - `"hot"`: ใช้การเปลี่ยนแปลงภายในโปรเซสโดยไม่ restart.
  - `"hybrid"` (ค่าเริ่มต้น): ลอง hot reload ก่อน; fallback ไป restart หากจำเป็น.
- `debounceMs`: หน้าต่าง debounce เป็น ms ก่อนนำการเปลี่ยนแปลง config ไปใช้ (จำนวนเต็มไม่ติดลบ).
- `deferralTimeoutMs`: เวลาสูงสุดแบบไม่บังคับเป็น ms เพื่อรอการทำงานที่กำลังดำเนินอยู่ก่อนบังคับ restart ละไว้เพื่อใช้การรอแบบมีขอบเขตค่าเริ่มต้น (`300000`); ตั้งค่า `0` เพื่อรอไม่มีกำหนดและบันทึกคำเตือนว่ายังคงรออยู่เป็นระยะ.

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

การตรวจสอบสิทธิ์: `Authorization: Bearer <token>` หรือ `x-openclaw-token: <token>`
โทเค็น hook ในสตริงคิวรีจะถูกปฏิเสธ

หมายเหตุการตรวจสอบความถูกต้องและความปลอดภัย:

- `hooks.enabled=true` ต้องมี `hooks.token` ที่ไม่ว่างเปล่า
- `hooks.token` ต้อง**แตกต่าง**จาก `gateway.auth.token`; การใช้โทเค็น Gateway ซ้ำจะถูกปฏิเสธ
- `hooks.path` ต้องไม่เป็น `/`; ใช้พาธย่อยเฉพาะ เช่น `/hooks`
- ถ้า `hooks.allowRequestSessionKey=true` ให้จำกัด `hooks.allowedSessionKeyPrefixes` (เช่น `["hook:"]`)
- ถ้าแมปปิงหรือพรีเซ็ตใช้ `sessionKey` แบบเทมเพลต ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` และ `hooks.allowRequestSessionKey=true` คีย์แมปปิงแบบคงที่ไม่ต้องเปิดใช้ตัวเลือกนี้

**เอนด์พอยต์:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` จากเพย์โหลดคำขอจะยอมรับเฉพาะเมื่อ `hooks.allowRequestSessionKey=true` (ค่าเริ่มต้น: `false`)
- `POST /hooks/<name>` → แก้ผ่าน `hooks.mappings`
  - ค่า `sessionKey` ของแมปปิงที่เรนเดอร์จากเทมเพลตจะถือว่าเป็นค่าที่ส่งมาจากภายนอก และต้องมี `hooks.allowRequestSessionKey=true` เช่นกัน

<Accordion title="Mapping details">

- `match.path` จับคู่พาธย่อยหลัง `/hooks` (เช่น `/hooks/gmail` → `gmail`)
- `match.source` จับคู่ฟิลด์เพย์โหลดสำหรับพาธทั่วไป
- เทมเพลตอย่าง `{{messages[0].subject}}` อ่านค่าจากเพย์โหลด
- `transform` สามารถชี้ไปยังโมดูล JS/TS ที่คืนค่า hook action ได้
  - `transform.module` ต้องเป็นพาธสัมพัทธ์และอยู่ภายใน `hooks.transformsDir` (พาธแบบสัมบูรณ์และการไล่ย้อนพาธจะถูกปฏิเสธ)
  - เก็บ `hooks.transformsDir` ไว้ใต้ `~/.openclaw/hooks/transforms`; ไดเรกทอรี Skills ของเวิร์กสเปซจะถูกปฏิเสธ ถ้า `openclaw doctor` รายงานว่าพาธนี้ไม่ถูกต้อง ให้ย้ายโมดูล transform เข้าไปในไดเรกทอรี hooks transforms หรือลบ `hooks.transformsDir`
- `agentId` ส่งต่อไปยัง agent ที่ระบุ; ID ที่ไม่รู้จักจะย้อนกลับไปใช้ค่าเริ่มต้น
- `allowedAgentIds`: จำกัดการกำหนดเส้นทางแบบระบุชัด (`*` หรือไม่ระบุ = อนุญาตทั้งหมด, `[]` = ปฏิเสธทั้งหมด)
- `defaultSessionKey`: คีย์เซสชันคงที่ที่เลือกใช้ได้สำหรับการรัน hook agent โดยไม่มี `sessionKey` ที่ระบุชัด
- `allowRequestSessionKey`: อนุญาตให้ผู้เรียก `/hooks/agent` และคีย์เซสชันแมปปิงที่ขับเคลื่อนด้วยเทมเพลตตั้งค่า `sessionKey` (ค่าเริ่มต้น: `false`)
- `allowedSessionKeyPrefixes`: รายการอนุญาตของคำนำหน้าที่เลือกใช้ได้สำหรับค่า `sessionKey` ที่ระบุชัด (คำขอ + แมปปิง) เช่น `["hook:"]` ค่านี้จะกลายเป็นข้อบังคับเมื่อแมปปิงหรือพรีเซ็ตใดๆ ใช้ `sessionKey` แบบเทมเพลต
- `deliver: true` ส่งคำตอบสุดท้ายไปยังช่องทาง; `channel` มีค่าเริ่มต้นเป็น `last`
- `model` แทนที่ LLM สำหรับการรัน hook นี้ (ต้องได้รับอนุญาตถ้ามีการตั้งค่าแค็ตตาล็อกโมเดล)

</Accordion>

### การผสานรวม Gmail

- พรีเซ็ต Gmail ในตัวใช้ `sessionKey: "hook:gmail:{{messages[0].id}}"`
- ถ้าคุณคงการกำหนดเส้นทางต่อข้อความนี้ไว้ ให้ตั้งค่า `hooks.allowRequestSessionKey: true` และจำกัด `hooks.allowedSessionKeyPrefixes` ให้ตรงกับเนมสเปซ Gmail เช่น `["hook:", "hook:gmail:"]`
- ถ้าคุณต้องใช้ `hooks.allowRequestSessionKey: false` ให้แทนที่พรีเซ็ตด้วย `sessionKey` แบบคงที่แทนค่าเริ่มต้นแบบเทมเพลต

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

- Gateway เริ่ม `gog gmail watch serve` โดยอัตโนมัติเมื่อบูตหากมีการกำหนดค่าไว้ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อปิดใช้งาน
- อย่ารัน `gog gmail watch serve` แยกต่างหากควบคู่กับ Gateway

---

## โฮสต์ Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- ให้บริการ HTML/CSS/JS ที่ agent แก้ไขได้ และ A2UI ผ่าน HTTP ใต้พอร์ต Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- เฉพาะภายในเครื่อง: คง `gateway.bind: "loopback"` ไว้ (ค่าเริ่มต้น)
- การ bind ที่ไม่ใช่ loopback: เส้นทาง canvas ต้องใช้การตรวจสอบสิทธิ์ Gateway (โทเค็น/รหัสผ่าน/trusted-proxy) เช่นเดียวกับพื้นผิว HTTP อื่นของ Gateway
- โดยทั่วไป Node WebViews จะไม่ส่งส่วนหัวการตรวจสอบสิทธิ์; หลังจาก Node จับคู่และเชื่อมต่อแล้ว Gateway จะประกาศ URL ความสามารถที่กำหนดขอบเขตตาม Node สำหรับการเข้าถึง canvas/A2UI
- URL ความสามารถผูกกับเซสชัน WS ของ Node ที่ใช้งานอยู่และหมดอายุอย่างรวดเร็ว ไม่มีการใช้ fallback ตาม IP
- ฉีดไคลเอนต์ live-reload เข้าไปใน HTML ที่ให้บริการ
- สร้าง `index.html` เริ่มต้นโดยอัตโนมัติเมื่อว่างเปล่า
- ให้บริการ A2UI ที่ `/__openclaw__/a2ui/` ด้วย
- การเปลี่ยนแปลงต้องรีสตาร์ท Gateway
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

- `minimal` (ค่าเริ่มต้นเมื่อเปิดใช้ Plugin `bonjour` ที่รวมมา): ไม่ใส่ `cliPath` + `sshPort` ในระเบียน TXT
- `full`: ใส่ `cliPath` + `sshPort`; การโฆษณา LAN multicast ยังต้องเปิดใช้ Plugin `bonjour` ที่รวมมา
- `off`: ระงับการโฆษณา LAN multicast โดยไม่เปลี่ยนการเปิดใช้ Plugin
- Plugin `bonjour` ที่รวมมาจะเริ่มโดยอัตโนมัติบนโฮสต์ macOS และเป็นแบบเลือกเปิดใช้บน Linux, Windows และการปรับใช้ Gateway แบบคอนเทนเนอร์
- ชื่อโฮสต์มีค่าเริ่มต้นเป็นชื่อโฮสต์ของระบบเมื่อเป็นป้ายกำกับ DNS ที่ถูกต้อง และย้อนกลับไปใช้ `openclaw` หากไม่ถูกต้อง แทนที่ได้ด้วย `OPENCLAW_MDNS_HOSTNAME`

### พื้นที่กว้าง (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

เขียนโซน DNS-SD แบบ unicast ใต้ `~/.openclaw/dns/` สำหรับการค้นพบข้ามเครือข่าย ให้จับคู่กับเซิร์ฟเวอร์ DNS (แนะนำ CoreDNS) + Tailscale split DNS

การตั้งค่า: `openclaw dns setup --apply`

---

## สภาพแวดล้อม

### `env` (ตัวแปร env แบบอินไลน์)

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

- ตัวแปร env แบบอินไลน์จะถูกใช้เฉพาะเมื่อ process env ไม่มีคีย์นั้นอยู่
- ไฟล์ `.env`: CWD `.env` + `~/.openclaw/.env` (ทั้งสองไม่เขียนทับตัวแปรที่มีอยู่)
- `shellEnv`: นำเข้าคีย์ที่คาดไว้แต่ยังขาดจากโปรไฟล์ login shell ของคุณ
- ดูลำดับความสำคัญทั้งหมดได้ที่ [สภาพแวดล้อม](/th/help/environment)

### การแทนที่ตัวแปร env

อ้างอิงตัวแปร env ในสตริง config ใดก็ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- จับคู่เฉพาะชื่อที่เป็นตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- ตัวแปรที่ขาดหายหรือว่างจะทำให้เกิดข้อผิดพลาดเมื่อโหลด config
- Escape ด้วย `$${VAR}` สำหรับ `${VAR}` แบบ literal
- ใช้งานได้กับ `$include`

---

## ความลับ

การอ้างอิงความลับเป็นแบบเพิ่มเติม: ค่าข้อความธรรมดายังคงใช้งานได้

### `SecretRef`

ใช้รูปทรง object แบบเดียว:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

การตรวจสอบความถูกต้อง:

- รูปแบบ `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- รูปแบบ id ของ `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id ของ `source: "file"`: JSON pointer แบบ absolute (เช่น `"/providers/openai/apiKey"`)
- รูปแบบ id ของ `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id ของ `source: "exec"` ต้องไม่มีส่วน path ที่คั่นด้วย slash เป็น `.` หรือ `..` (เช่น `a/../b` จะถูกปฏิเสธ)

### พื้นผิว credential ที่รองรับ

- เมทริกซ์หลัก: [พื้นผิว Credential ของ SecretRef](/th/reference/secretref-credential-surface)
- `secrets apply` กำหนดเป้าหมายไปยัง path credential ของ `openclaw.json` ที่รองรับ
- การอ้างอิงใน `auth-profiles.json` รวมอยู่ในการ resolve ตอน runtime และขอบเขต audit

### Config ของผู้ให้บริการความลับ

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

- ผู้ให้บริการ `file` รองรับ `mode: "json"` และ `mode: "singleValue"` (`id` ต้องเป็น `"value"` ในโหมด singleValue)
- path ของผู้ให้บริการ file และ exec จะ fail closed เมื่อการตรวจสอบ Windows ACL ใช้งานไม่ได้ ตั้งค่า `allowInsecurePath: true` เฉพาะสำหรับ path ที่เชื่อถือได้แต่ตรวจสอบไม่ได้
- ผู้ให้บริการ `exec` ต้องใช้ path `command` แบบ absolute และใช้ payload ของโปรโตคอลบน stdin/stdout
- โดยค่าเริ่มต้น path คำสั่งที่เป็น symlink จะถูกปฏิเสธ ตั้งค่า `allowSymlinkCommand: true` เพื่ออนุญาต path แบบ symlink พร้อมตรวจสอบ path เป้าหมายที่ resolve แล้ว
- หากกำหนดค่า `trustedDirs` การตรวจสอบ trusted-dir จะใช้กับ path เป้าหมายที่ resolve แล้ว
- สภาพแวดล้อมของ child ของ `exec` จะเป็นแบบขั้นต่ำโดยค่าเริ่มต้น; ส่งตัวแปรที่จำเป็นอย่างชัดเจนด้วย `passEnv`
- การอ้างอิงความลับจะถูก resolve ในช่วง activation เป็น snapshot ในหน่วยความจำ จากนั้น path ของคำขอจะอ่านเฉพาะ snapshot เท่านั้น
- การกรอง active-surface จะใช้ระหว่าง activation: การอ้างอิงที่ resolve ไม่ได้บนพื้นผิวที่เปิดใช้งานจะทำให้ startup/reload ล้มเหลว ส่วนพื้นผิวที่ไม่ active จะถูกข้ามพร้อม diagnostics

---

## การจัดเก็บ Auth

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
- `auth-profiles.json` รองรับการอ้างอิงระดับค่า (`keyRef` สำหรับ `api_key`, `tokenRef` สำหรับ `token`) สำหรับโหมด credential แบบ static
- แมป `auth-profiles.json` แบบ flat เดิม เช่น `{ "provider": { "apiKey": "..." } }` ไม่ใช่รูปแบบ runtime; `openclaw doctor --fix` จะเขียนใหม่เป็นโปรไฟล์ API-key แบบ canonical `provider:default` พร้อมข้อมูลสำรอง `.legacy-flat.*.bak`
- โปรไฟล์โหมด OAuth (`auth.profiles.<id>.mode = "oauth"`) ไม่รองรับ credential ของ auth-profile ที่มี SecretRef เป็น backing
- credential runtime แบบ static มาจาก snapshot ที่ resolve แล้วในหน่วยความจำ; รายการ `auth.json` แบบ static เดิมจะถูกล้างเมื่อพบ
- การนำเข้า OAuth เดิมมาจาก `~/.openclaw/credentials/oauth.json`
- ดู [OAuth](/th/concepts/oauth)
- พฤติกรรม runtime ของความลับและเครื่องมือ `audit/configure/apply`: [การจัดการความลับ](/th/gateway/secrets)

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

- `billingBackoffHours`: ค่า backoff พื้นฐานเป็นชั่วโมงเมื่อโปรไฟล์ล้มเหลวเพราะข้อผิดพลาดด้านการเรียกเก็บเงิน/เครดิตไม่เพียงพอที่เป็นจริง (ค่าเริ่มต้น: `5`) ข้อความการเรียกเก็บเงินที่ชัดเจนอาจยังเข้ามาที่นี่ได้แม้อยู่ในการตอบกลับ `401`/`403` แต่ตัวจับคู่ข้อความเฉพาะผู้ให้บริการจะยังจำกัดขอบเขตอยู่กับผู้ให้บริการที่เป็นเจ้าของเท่านั้น (ตัวอย่างเช่น OpenRouter `Key limit exceeded`) ข้อความ HTTP `402` ที่ลองใหม่ได้เกี่ยวกับ usage-window หรือ organization/workspace spend-limit จะยังอยู่ในเส้นทาง `rate_limit` แทน
- `billingBackoffHoursByProvider`: การแทนที่เป็นรายผู้ให้บริการแบบไม่บังคับสำหรับชั่วโมง backoff ด้านการเรียกเก็บเงิน
- `billingMaxHours`: เพดานเป็นชั่วโมงสำหรับการเติบโตแบบเอ็กซ์โพเนนเชียลของ backoff ด้านการเรียกเก็บเงิน (ค่าเริ่มต้น: `24`)
- `authPermanentBackoffMinutes`: ค่า backoff พื้นฐานเป็นนาทีสำหรับความล้มเหลว `auth_permanent` ที่มีความมั่นใจสูง (ค่าเริ่มต้น: `10`)
- `authPermanentMaxMinutes`: เพดานเป็นนาทีสำหรับการเติบโตของ backoff `auth_permanent` (ค่าเริ่มต้น: `60`)
- `failureWindowHours`: หน้าต่างแบบเลื่อนเป็นชั่วโมงที่ใช้สำหรับตัวนับ backoff (ค่าเริ่มต้น: `24`)
- `overloadedProfileRotations`: จำนวนสูงสุดของการหมุนเวียนโปรไฟล์ auth ในผู้ให้บริการเดียวกันสำหรับข้อผิดพลาด overloaded ก่อนสลับไปใช้ model fallback (ค่าเริ่มต้น: `1`) รูปแบบ provider-busy เช่น `ModelNotReadyException` จะเข้ามาที่นี่
- `overloadedBackoffMs`: หน่วงเวลาคงที่ก่อนลองหมุนเวียนผู้ให้บริการ/โปรไฟล์ที่ overloaded อีกครั้ง (ค่าเริ่มต้น: `0`)
- `rateLimitedProfileRotations`: จำนวนสูงสุดของการหมุนเวียนโปรไฟล์ auth ในผู้ให้บริการเดียวกันสำหรับข้อผิดพลาด rate-limit ก่อนสลับไปใช้ model fallback (ค่าเริ่มต้น: `1`) บัคเก็ต rate-limit นั้นรวมข้อความที่มีรูปแบบตามผู้ให้บริการ เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` และ `resource exhausted`

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
- ตั้งค่า `logging.file` สำหรับพาธที่คงที่
- `consoleLevel` จะเพิ่มเป็น `debug` เมื่อใช้ `--verbose`
- `maxFileBytes`: ขนาดไฟล์ล็อกที่ใช้งานอยู่สูงสุดเป็นไบต์ก่อนการหมุนไฟล์ (จำนวนเต็มบวก; ค่าเริ่มต้น: `104857600` = 100 MB) OpenClaw เก็บไฟล์เก็บถาวรแบบมีหมายเลขไว้ข้างไฟล์ที่ใช้งานอยู่ได้สูงสุดห้าไฟล์
- `redactSensitive` / `redactPatterns`: การปิดบังแบบดีที่สุดเท่าที่ทำได้สำหรับเอาต์พุตคอนโซล ไฟล์ล็อก ระเบียนล็อก OTLP และข้อความ transcript ของเซสชันที่คงอยู่ `redactSensitive: "off"` จะปิดใช้งานเฉพาะนโยบายล็อก/transcript ทั่วไปนี้เท่านั้น; พื้นผิวความปลอดภัยของ UI/tool/diagnostic จะยัง redact ความลับก่อนปล่อยออกมา

---

## การวินิจฉัย

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

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

- `enabled`: สวิตช์หลักสำหรับเอาต์พุต instrumentation (ค่าเริ่มต้น: `true`)
- `flags`: อาร์เรย์ของสตริง flag ที่เปิดใช้งานเอาต์พุตล็อกแบบเจาะจง (รองรับ wildcard เช่น `"telegram.*"` หรือ `"*"`)
- `stuckSessionWarnMs`: เกณฑ์อายุที่ไม่มีความคืบหน้าเป็น ms สำหรับจัดประเภทเซสชันประมวลผลที่รันนานเป็น `session.long_running`, `session.stalled` หรือ `session.stuck` การตอบกลับ tool สถานะ บล็อก และความคืบหน้า ACP จะรีเซ็ตตัวจับเวลา; การวินิจฉัย `session.stuck` ที่เกิดซ้ำจะ back off ขณะไม่มีการเปลี่ยนแปลง
- `otel.enabled`: เปิดใช้งาน pipeline ส่งออก OpenTelemetry (ค่าเริ่มต้น: `false`) สำหรับการกำหนดค่าเต็ม แค็ตตาล็อกสัญญาณ และโมเดลความเป็นส่วนตัว โปรดดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)
- `otel.endpoint`: URL collector สำหรับการส่งออก OTel
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP เฉพาะสัญญาณแบบไม่บังคับ เมื่อตั้งค่าแล้ว จะ override `otel.endpoint` เฉพาะสำหรับสัญญาณนั้นเท่านั้น
- `otel.protocol`: `"http/protobuf"` (ค่าเริ่มต้น) หรือ `"grpc"`
- `otel.headers`: header metadata HTTP/gRPC เพิ่มเติมที่ส่งไปกับคำขอส่งออก OTel
- `otel.serviceName`: ชื่อบริการสำหรับ resource attributes
- `otel.traces` / `otel.metrics` / `otel.logs`: เปิดใช้งานการส่งออก trace, metrics หรือ log
- `otel.sampleRate`: อัตราการสุ่มตัวอย่าง trace `0`–`1`
- `otel.flushIntervalMs`: ช่วงเวลา flush telemetry เป็นคาบใน ms
- `otel.captureContent`: การบันทึกเนื้อหาดิบแบบ opt-in สำหรับแอตทริบิวต์ span ของ OTEL ค่าเริ่มต้นคือปิด Boolean `true` จะบันทึกเนื้อหา message/tool ที่ไม่ใช่ system; รูปแบบ object ให้คุณเปิดใช้งาน `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` และ `systemPrompt` ได้อย่างชัดเจน
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: สวิตช์สภาพแวดล้อมสำหรับแอตทริบิวต์ provider ของ span GenAI รุ่นทดลองล่าสุด โดยค่าเริ่มต้น span จะคงแอตทริบิวต์ `gen_ai.system` แบบเดิมไว้เพื่อความเข้ากันได้; metrics ของ GenAI ใช้แอตทริบิวต์เชิงความหมายแบบมีขอบเขต
- `OPENCLAW_OTEL_PRELOADED=1`: สวิตช์สภาพแวดล้อมสำหรับ host ที่ลงทะเบียน OpenTelemetry SDK ส่วนกลางไว้แล้ว จากนั้น OpenClaw จะข้ามการเริ่มต้น/ปิด SDK ที่ Plugin เป็นเจ้าของ ขณะที่ยังคง listener ด้านการวินิจฉัยไว้
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` และ `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: env var ของ endpoint เฉพาะสัญญาณที่ใช้เมื่อ config key ที่ตรงกันไม่ได้ตั้งค่าไว้
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

- `channel`: ช่องทาง release สำหรับการติดตั้ง npm/git — `"stable"`, `"beta"` หรือ `"dev"`
- `checkOnStart`: ตรวจหาการอัปเดต npm เมื่อ Gateway เริ่มทำงาน (ค่าเริ่มต้น: `true`)
- `auto.enabled`: เปิดใช้งานการอัปเดตอัตโนมัติในเบื้องหลังสำหรับการติดตั้งแพ็กเกจ (ค่าเริ่มต้น: `false`)
- `auto.stableDelayHours`: ระยะหน่วงขั้นต่ำเป็นชั่วโมงก่อน auto-apply ของช่องทาง stable (ค่าเริ่มต้น: `6`; สูงสุด: `168`)
- `auto.stableJitterHours`: หน้าต่างกระจาย rollout เพิ่มเติมของช่องทาง stable เป็นชั่วโมง (ค่าเริ่มต้น: `12`; สูงสุด: `168`)
- `auto.betaCheckIntervalHours`: ความถี่ที่การตรวจของช่องทาง beta ทำงานเป็นชั่วโมง (ค่าเริ่มต้น: `1`; สูงสุด: `24`)

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

- `enabled`: feature gate ACP ส่วนกลาง (ค่าเริ่มต้น: `true`; ตั้งเป็น `false` เพื่อซ่อน dispatch และ spawn affordances ของ ACP)
- `dispatch.enabled`: gate แยกต่างหากสำหรับ dispatch เทิร์นของเซสชัน ACP (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อให้คำสั่ง ACP ยังพร้อมใช้งานขณะบล็อกการดำเนินการ
- `backend`: id ของ backend runtime ACP เริ่มต้น (ต้องตรงกับ Plugin runtime ACP ที่ลงทะเบียนไว้)
  ติดตั้ง Plugin backend ก่อน และถ้ามีการตั้งค่า `plugins.allow` ให้รวม id ของ Plugin backend (เช่น `acpx`) มิฉะนั้น backend ACP จะไม่โหลด
- `defaultAgent`: id ของ agent เป้าหมาย ACP สำรองเมื่อการ spawn ไม่ได้ระบุเป้าหมายอย่างชัดเจน
- `allowedAgents`: allowlist ของ id agent ที่อนุญาตสำหรับเซสชัน runtime ACP; ค่าว่างหมายถึงไม่มีข้อจำกัดเพิ่มเติม
- `maxConcurrentSessions`: จำนวนสูงสุดของเซสชัน ACP ที่ active พร้อมกัน
- `stream.coalesceIdleMs`: หน้าต่าง flush เมื่อ idle เป็น ms สำหรับข้อความที่ stream
- `stream.maxChunkChars`: ขนาด chunk สูงสุดก่อนแบ่ง block projection ที่ stream
- `stream.repeatSuppression`: ระงับบรรทัดสถานะ/tool ที่ซ้ำกันต่อเทิร์น (ค่าเริ่มต้น: `true`)
- `stream.deliveryMode`: `"live"` stream แบบเพิ่มทีละส่วน; `"final_only"` buffer จนถึงเหตุการณ์สิ้นสุดเทิร์น
- `stream.hiddenBoundarySeparator`: ตัวคั่นก่อนข้อความที่มองเห็นได้หลังเหตุการณ์ tool ที่ซ่อนอยู่ (ค่าเริ่มต้น: `"paragraph"`)
- `stream.maxOutputChars`: จำนวนอักขระเอาต์พุต assistant สูงสุดที่ project ต่อเทิร์น ACP
- `stream.maxSessionUpdateChars`: จำนวนอักขระสูงสุดสำหรับบรรทัดสถานะ/อัปเดต ACP ที่ project
- `stream.tagVisibility`: ระเบียนของชื่อ tag ไปยังการ override การมองเห็นแบบ boolean สำหรับเหตุการณ์ที่ stream
- `runtime.ttlMinutes`: TTL เมื่อ idle เป็นนาทีสำหรับ worker เซสชัน ACP ก่อนมีสิทธิ์ cleanup
- `runtime.installCommand`: คำสั่งติดตั้งแบบไม่บังคับที่จะรันเมื่อ bootstrap สภาพแวดล้อม runtime ACP

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

- `cli.banner.taglineMode` ควบคุมรูปแบบ tagline ของ banner:
  - `"random"` (ค่าเริ่มต้น): tagline ตลก/ตามฤดูกาลแบบหมุนเวียน
  - `"default"`: tagline กลางแบบคงที่ (`All your chats, one OpenClaw.`)
  - `"off"`: ไม่มีข้อความ tagline (ยังแสดงชื่อ/version ของ banner)
- หากต้องการซ่อน banner ทั้งหมด (ไม่ใช่แค่ tagline) ให้ตั้ง env `OPENCLAW_HIDE_BANNER=1`

---

## Wizard

Metadata ที่เขียนโดยโฟลว์การตั้งค่าแบบมีคำแนะนำของ CLI (`onboard`, `configure`, `doctor`):

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

ดูฟิลด์ข้อมูลระบุตัวตน `agents.list` ใต้ [ค่าเริ่มต้นของ Agent](/th/gateway/config-agents#agent-defaults)

---

## Bridge (legacy, removed)

บิลด์ปัจจุบันไม่มี TCP bridge อีกต่อไป Node เชื่อมต่อผ่าน WebSocket ของ Gateway คีย์ `bridge.*` ไม่ได้เป็นส่วนหนึ่งของ config schema อีกต่อไป (การตรวจสอบความถูกต้องจะล้มเหลวจนกว่าจะนำออก; `openclaw doctor --fix` สามารถลบคีย์ที่ไม่รู้จักได้)

<Accordion title="การกำหนดค่า bridge แบบ legacy (ข้อมูลอ้างอิงทางประวัติศาสตร์)">

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

- `sessionRetention`: ระยะเวลาที่เก็บเซสชันการรัน Cron แบบ isolated ที่เสร็จสิ้นแล้วก่อน prune ออกจาก `sessions.json` และยังควบคุมการ cleanup transcript Cron ที่ถูกลบและเก็บถาวรไว้ด้วย ค่าเริ่มต้น: `24h`; ตั้งเป็น `false` เพื่อปิดใช้งาน
- `runLog.maxBytes`: ขนาดสูงสุดต่อไฟล์ run log (`cron/runs/<jobId>.jsonl`) ก่อน prune ค่าเริ่มต้น: `2_000_000` ไบต์
- `runLog.keepLines`: บรรทัดล่าสุดที่คงไว้เมื่อการ prune run-log ถูกทริกเกอร์ ค่าเริ่มต้น: `2000`
- `webhookToken`: bearer token ที่ใช้สำหรับการส่ง POST ของ Webhook Cron (`delivery.mode = "webhook"`) หากละไว้จะไม่มีการส่ง header auth
- `webhook`: URL Webhook fallback แบบ legacy ที่เลิกใช้แล้ว (http/https) ใช้เฉพาะกับงานที่จัดเก็บไว้ซึ่งยังมี `notify: true`

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

- `maxAttempts`: จำนวนครั้งสูงสุดในการลองใหม่สำหรับงานแบบครั้งเดียวเมื่อเกิดข้อผิดพลาดชั่วคราว (ค่าเริ่มต้น: `3`; ช่วง: `0`–`10`)
- `backoffMs`: อาร์เรย์ของระยะเวลาหน่วงการถอยกลับเป็นมิลลิวินาทีสำหรับความพยายามลองใหม่แต่ละครั้ง (ค่าเริ่มต้น: `[30000, 60000, 300000]`; 1–10 รายการ)
- `retryOn`: ประเภทข้อผิดพลาดที่ทริกเกอร์การลองใหม่ — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"` ละไว้เพื่อลองใหม่กับประเภทชั่วคราวทั้งหมด

ใช้เฉพาะกับงาน Cron แบบครั้งเดียว งานที่เกิดซ้ำใช้การจัดการความล้มเหลวแยกต่างหาก

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

- `enabled`: เปิดใช้การแจ้งเตือนความล้มเหลวสำหรับงาน Cron (ค่าเริ่มต้น: `false`)
- `after`: จำนวนความล้มเหลวติดต่อกันก่อนส่งการแจ้งเตือน (จำนวนเต็มบวก, ค่าต่ำสุด: `1`)
- `cooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการแจ้งเตือนซ้ำสำหรับงานเดียวกัน (จำนวนเต็มไม่ติดลบ)
- `includeSkipped`: นับการรันที่ถูกข้ามติดต่อกันรวมในเกณฑ์การแจ้งเตือน (ค่าเริ่มต้น: `false`) การรันที่ถูกข้ามจะถูกติดตามแยกต่างหากและไม่กระทบต่อการถอยกลับของข้อผิดพลาดการดำเนินการ
- `mode`: โหมดการส่ง — `"announce"` ส่งผ่านข้อความช่องทาง; `"webhook"` โพสต์ไปยัง Webhook ที่กำหนดค่าไว้
- `accountId`: บัญชีหรือรหัสช่องทางเสริมเพื่อจำกัดขอบเขตการส่งการแจ้งเตือน

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
- `channel`: การแทนที่ช่องทางสำหรับการส่งแบบ announce `"last"` ใช้ช่องทางการส่งล่าสุดที่รู้จักซ้ำ
- `to`: เป้าหมาย announce หรือ URL ของ Webhook ที่ระบุชัดเจน จำเป็นสำหรับโหมด Webhook
- `accountId`: การแทนที่บัญชีเสริมสำหรับการส่ง
- `delivery.failureDestination` ต่อหนึ่งงานจะแทนที่ค่าเริ่มต้นส่วนกลางนี้
- เมื่อไม่ได้ตั้งค่าปลายทางความล้มเหลวทั้งแบบส่วนกลางและแบบต่อหนึ่งงาน งานที่ส่งผ่าน `announce` อยู่แล้วจะย้อนกลับไปใช้เป้าหมาย announce หลักนั้นเมื่อเกิดความล้มเหลว
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เว้นแต่ `delivery.mode` หลักของงานจะเป็น `"webhook"`

ดู [งาน Cron](/th/automation/cron-jobs) การดำเนินการ Cron แบบแยกจะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

---

## ตัวแปรเทมเพลตโมเดลสื่อ

ตัวแทนที่ในเทมเพลตที่ขยายใน `tools.media.models[].args`:

| ตัวแปร             | คำอธิบาย                                          |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | เนื้อหาข้อความขาเข้าทั้งหมด                     |
| `{{RawBody}}`      | เนื้อหาดิบ (ไม่มีตัวห่อประวัติ/ผู้ส่ง)          |
| `{{BodyStripped}}` | เนื้อหาที่ลบการกล่าวถึงกลุ่มออกแล้ว             |
| `{{From}}`         | ตัวระบุผู้ส่ง                                    |
| `{{To}}`           | ตัวระบุปลายทาง                                   |
| `{{MessageSid}}`   | รหัสข้อความช่องทาง                               |
| `{{SessionId}}`    | UUID ของเซสชันปัจจุบัน                           |
| `{{IsNewSession}}` | `"true"` เมื่อสร้างเซสชันใหม่                    |
| `{{MediaUrl}}`     | URL เสมือนของสื่อขาเข้า                          |
| `{{MediaPath}}`    | พาธสื่อในเครื่อง                                 |
| `{{MediaType}}`    | ประเภทสื่อ (รูปภาพ/เสียง/เอกสาร/…)              |
| `{{Transcript}}`   | บทถอดเสียง                                       |
| `{{Prompt}}`       | พรอมป์สื่อที่แก้ไขแล้วสำหรับรายการ CLI          |
| `{{MaxChars}}`     | จำนวนอักขระเอาต์พุตสูงสุดที่แก้ไขแล้วสำหรับรายการ CLI |
| `{{ChatType}}`     | `"direct"` หรือ `"group"`                         |
| `{{GroupSubject}}` | หัวข้อกลุ่ม (พยายามให้ดีที่สุด)                  |
| `{{GroupMembers}}` | ตัวอย่างสมาชิกกลุ่ม (พยายามให้ดีที่สุด)          |
| `{{SenderName}}`   | ชื่อที่แสดงของผู้ส่ง (พยายามให้ดีที่สุด)         |
| `{{SenderE164}}`   | หมายเลขโทรศัพท์ของผู้ส่ง (พยายามให้ดีที่สุด)     |
| `{{Provider}}`     | คำใบ้ผู้ให้บริการ (whatsapp, telegram, discord, ฯลฯ) |

---

## การรวมคอนฟิก (`$include`)

แยกคอนฟิกออกเป็นหลายไฟล์:

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

- ไฟล์เดียว: แทนที่อ็อบเจกต์ที่ครอบอยู่
- อาร์เรย์ของไฟล์: ผสานแบบลึกตามลำดับ (รายการหลังแทนที่รายการก่อน)
- คีย์พี่น้อง: ผสานหลังจากการรวม (แทนที่ค่าที่รวมเข้ามา)
- การรวมแบบซ้อน: ลึกได้สูงสุด 10 ระดับ
- พาธ: แก้ไขโดยอิงจากไฟล์ที่รวม แต่ต้องอยู่ภายในไดเรกทอรีคอนฟิกระดับบนสุด (`dirname` ของ `openclaw.json`) อนุญาตรูปแบบแบบสัมบูรณ์/`../` เฉพาะเมื่อยังคงแก้ไขอยู่ภายในขอบเขตนั้น
- การเขียนที่ OpenClaw เป็นเจ้าของซึ่งเปลี่ยนเฉพาะส่วนระดับบนสุดหนึ่งส่วนที่หนุนด้วยการรวมไฟล์เดียว จะเขียนทะลุไปยังไฟล์ที่รวมอยู่นั้น ตัวอย่างเช่น `plugins install` อัปเดต `plugins: { $include: "./plugins.json5" }` ใน `plugins.json5` และปล่อย `openclaw.json` ไว้เหมือนเดิม
- การรวมที่รูท, อาร์เรย์การรวม, และการรวมที่มีการแทนที่ด้วยคีย์พี่น้องเป็นแบบอ่านอย่างเดียวสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนเหล่านั้นจะล้มเหลวแบบปิดแทนที่จะทำให้คอนฟิกแบน
- ข้อผิดพลาด: ข้อความชัดเจนสำหรับไฟล์ที่หายไป, ข้อผิดพลาดการแยกวิเคราะห์, และการรวมแบบวนรอบ

---

_ที่เกี่ยวข้อง: [การกำหนดค่า](/th/gateway/configuration) · [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
