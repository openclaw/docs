---
read_when:
    - คุณต้องการความหมายหรือค่าเริ่มต้นของ config ในระดับฟิลด์อย่างแม่นยำ
    - คุณกำลังตรวจสอบบล็อก config ของ channel, model, gateway หรือ tool
summary: เอกสารอ้างอิง config ของ Gateway สำหรับคีย์หลัก ค่าเริ่มต้น และลิงก์ไปยังเอกสารอ้างอิงเฉพาะของแต่ละระบบย่อยของ OpenClaw
title: เอกสารอ้างอิงการกำหนดค่า
x-i18n:
    generated_at: "2026-04-25T13:47:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14818087bd47a685a30140f7995840785797ffda556e68b757b8ba10043deea8
    source_path: gateway/configuration-reference.md
    workflow: 15
---

เอกสารอ้างอิง config หลักสำหรับ `~/.openclaw/openclaw.json` สำหรับภาพรวมแบบอิงงาน ให้ดู [การกำหนดค่า](/th/gateway/configuration)

ครอบคลุมพื้นผิว config หลักของ OpenClaw และลิงก์ออกไปเมื่อระบบย่อยมีเอกสารอ้างอิงเชิงลึกของตัวเอง แค็ตตาล็อกคำสั่งและตัวเลือกเชิงลึกของหน่วยความจำ/QMD ที่เป็นของช่องหรือ Plugin จะอยู่ในหน้าของตนเองแทนที่จะอยู่ในหน้านี้

แหล่งความจริงของโค้ด:

- `openclaw config schema` จะแสดง JSON Schema แบบสดที่ใช้สำหรับการตรวจสอบและ Control UI โดยมี metadata จาก bundled/plugin/channel ถูกรวมเข้ามาเมื่อพร้อมใช้งาน
- `config.schema.lookup` จะคืน schema node หนึ่งรายการแบบจำกัดพาธสำหรับเครื่องมือ drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` จะตรวจสอบ baseline hash ของเอกสาร config เทียบกับพื้นผิว schema ปัจจุบัน

เอกสารอ้างอิงเชิงลึกเฉพาะทาง:

- [เอกสารอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config) สำหรับ `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` และ config ของ Dreaming ภายใต้ `plugins.entries.memory-core.config.dreaming`
- [คำสั่ง slash](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่ง built-in + bundled ปัจจุบัน
- หน้าของช่อง/Plugin เจ้าของสำหรับพื้นผิวคำสั่งเฉพาะของช่อง

รูปแบบ config คือ **JSON5** (อนุญาตคอมเมนต์ + trailing commas) ทุกฟิลด์เป็นทางเลือก — OpenClaw จะใช้ค่าเริ่มต้นที่ปลอดภัยเมื่อไม่ได้ระบุ

---

## Channels

คีย์ config รายช่องถูกย้ายไปยังหน้าเฉพาะแล้ว — ดู
[การกำหนดค่า — channels](/th/gateway/config-channels) สำหรับ `channels.*`,
รวมถึง Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และช่อง bundled
อื่น ๆ (การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี, การบังคับ mention)

## ค่าเริ่มต้นของเอเจนต์ หลายเอเจนต์ เซสชัน และข้อความ

ย้ายไปยังหน้าเฉพาะแล้ว — ดู
[การกำหนดค่า — agents](/th/gateway/config-agents) สำหรับ:

- `agents.defaults.*` (workspace, model, thinking, Heartbeat, memory, media, Skills, sandbox)
- `multiAgent.*` (การกำหนดเส้นทางและ bindings หลายเอเจนต์)
- `session.*` (วงจรชีวิตเซสชัน, Compaction, pruning)
- `messages.*` (การส่งข้อความ, TTS, การเรนเดอร์ markdown)
- `talk.*` (โหมด Talk)
  - `talk.silenceTimeoutMs`: เมื่อไม่ได้ตั้งค่า Talk จะคงช่วงหยุดตามค่าเริ่มต้นของแพลตฟอร์มก่อนส่ง transcript (`700 ms บน macOS และ Android, 900 ms บน iOS`)

## Tools และ custom providers

นโยบายของ Tool, ตัวสลับ experimental, config ของ Tool ที่ขับเคลื่อนด้วย provider และการตั้งค่า custom
provider / base-URL ถูกย้ายไปยังหน้าเฉพาะแล้ว — ดู
[การกำหนดค่า — tools และ custom providers](/th/gateway/config-tools)

## MCP

คำจำกัดความของ MCP server ที่ OpenClaw จัดการอยู่ภายใต้ `mcp.servers` และถูก
ใช้โดย embedded Pi และ runtime adapter อื่น ๆ คำสั่ง `openclaw mcp list`,
`show`, `set` และ `unset` ใช้จัดการบล็อกนี้โดยไม่ต้องเชื่อมต่อกับ
server เป้าหมายระหว่างแก้ไข config

```json5
{
  mcp: {
    // ไม่บังคับ ค่าเริ่มต้น: 600000 ms (10 นาที) ตั้งเป็น 0 เพื่อปิด idle eviction
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

- `mcp.servers`: คำจำกัดความของ MCP server แบบ stdio หรือระยะไกลแบบมีชื่อสำหรับ runtime ที่
  เปิดเผย MCP tools ที่กำหนดค่าไว้
- `mcp.sessionIdleTtlMs`: idle TTL สำหรับ bundled MCP runtime แบบจำกัดขอบเขตเซสชัน
  การรัน embedded แบบ one-shot จะขอ cleanup เมื่อจบรัน; TTL นี้เป็นกลไก backstop สำหรับ
  เซสชันที่มีอายุยาวและผู้เรียกใช้ในอนาคต
- การเปลี่ยนแปลงภายใต้ `mcp.*` จะถูกนำไปใช้แบบ hot-apply โดยการกำจัด cached session MCP runtime
  การค้นหา/ใช้งาน tool ครั้งถัดไปจะสร้างใหม่จาก config ใหม่ ดังนั้นรายการ
  `mcp.servers` ที่ถูกลบจะถูกเก็บกวาดทันทีแทนที่จะรอ idle TTL

ดู [MCP](/th/cli/mcp#openclaw-as-an-mcp-client-registry) และ
[CLI backends](/th/gateway/cli-backends#bundle-mcp-overlays) สำหรับพฤติกรรมรันไทม์

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // หรือสตริง plaintext
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist แบบไม่บังคับสำหรับ Skills แบบ bundled เท่านั้น (managed/workspace skills ไม่ได้รับผลกระทบ)
- `load.extraDirs`: ราก Skill แบบใช้ร่วมกันเพิ่มเติม (ลำดับความสำคัญต่ำสุด)
- `install.preferBrew`: เมื่อเป็น true จะให้ใช้ตัวติดตั้ง Homebrew ก่อนเมื่อมี `brew`
  พร้อมใช้งาน ก่อนจะ fallback ไปยังตัวติดตั้งชนิดอื่น
- `install.nodeManager`: ค่าที่ต้องการสำหรับตัวติดตั้ง node สำหรับสเปก `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`)
- `entries.<skillKey>.enabled: false` จะปิดใช้งาน Skill แม้จะ bundled/ติดตั้งไว้แล้วก็ตาม
- `entries.<skillKey>.apiKey`: ตัวช่วย convenience สำหรับ Skills ที่ประกาศ env var หลัก (สตริง plaintext หรือออบเจ็กต์ SecretRef)

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
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
- การค้นพบรองรับทั้ง OpenClaw plugins แบบเนทีฟ รวมถึง Codex bundle และ Claude bundle ที่เข้ากันได้ รวมถึง Claude bundle แบบ manifestless ที่ใช้เลย์เอาต์ค่าเริ่มต้น
- **การเปลี่ยนแปลง config ต้องรีสตาร์ท gateway**
- `allow`: allowlist แบบไม่บังคับ (จะโหลดเฉพาะ Plugin ที่อยู่ในรายการ) `deny` มีลำดับความสำคัญสูงกว่า
- `plugins.entries.<id>.apiKey`: ฟิลด์ convenience ระดับ Plugin สำหรับ API key (เมื่อ Plugin รองรับ)
- `plugins.entries.<id>.env`: แผนที่ env var ที่จำกัดขอบเขตต่อ Plugin
- `plugins.entries.<id>.hooks.allowPromptInjection`: เมื่อเป็น `false`, core จะบล็อก `before_prompt_build` และละเว้นฟิลด์ที่แก้ไขพรอมต์จาก `before_agent_start` แบบเดิม ขณะเดียวกันยังคงเก็บ `modelOverride` และ `providerOverride` แบบเดิมไว้ ใช้กับ hook ของ Plugin แบบเนทีฟและไดเรกทอรี hook ที่ bundle ให้มาซึ่งรองรับ
- `plugins.entries.<id>.hooks.allowConversationAccess`: เมื่อเป็น `true`, non-bundled plugins ที่เชื่อถือได้จะสามารถอ่านเนื้อหาการสนทนาดิบจาก typed hooks เช่น `llm_input`, `llm_output` และ `agent_end`
- `plugins.entries.<id>.subagent.allowModelOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนให้ร้องขอการแทนที่ `provider` และ `model` ต่อการรันสำหรับ background subagent run
- `plugins.entries.<id>.subagent.allowedModels`: allowlist แบบไม่บังคับของเป้าหมาย `provider/model` แบบ canonical สำหรับ trusted subagent overrides ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจจะอนุญาตทุก model จริง ๆ
- `plugins.entries.<id>.config`: ออบเจ็กต์ config ที่นิยามโดย Plugin (ตรวจสอบด้วย schema ของ OpenClaw Plugin แบบเนทีฟเมื่อมี)
- การตั้งค่าบัญชี/รันไทม์ของ channel plugin อยู่ภายใต้ `channels.<id>` และควรถูกอธิบายโดย metadata `channelConfigs` ใน manifest ของ Plugin เจ้าของ ไม่ใช่โดย registry ตัวเลือกกลางของ OpenClaw
- `plugins.entries.firecrawl.config.webFetch`: การตั้งค่า Firecrawl web-fetch provider
  - `apiKey`: Firecrawl API key (รองรับ SecretRef) fallback ไปยัง `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` แบบเดิม หรือ env var `FIRECRAWL_API_KEY`
  - `baseUrl`: URL ฐานของ Firecrawl API (ค่าเริ่มต้น: `https://api.firecrawl.dev`)
  - `onlyMainContent`: ดึงเฉพาะเนื้อหาหลักจากหน้าเว็บ (ค่าเริ่มต้น: `true`)
  - `maxAgeMs`: อายุแคชสูงสุดเป็นมิลลิวินาที (ค่าเริ่มต้น: `172800000` / 2 วัน)
  - `timeoutSeconds`: เวลาหมดอายุของคำขอ scrape เป็นวินาที (ค่าเริ่มต้น: `60`)
- `plugins.entries.xai.config.xSearch`: การตั้งค่า xAI X Search (Grok web search)
  - `enabled`: เปิดใช้ X Search provider
  - `model`: Grok model ที่จะใช้สำหรับการค้นหา (เช่น `"grok-4-1-fast"`)
- `plugins.entries.memory-core.config.dreaming`: การตั้งค่า Dreaming ของ memory ดู [Dreaming](/th/concepts/dreaming) สำหรับ phase และ threshold
  - `enabled`: สวิตช์หลักของ Dreaming (ค่าเริ่มต้น `false`)
  - `frequency`: รอบเวลา Cron สำหรับแต่ละการกวาด Dreaming เต็มรูปแบบ (ค่าเริ่มต้น `"0 3 * * *"`)
  - นโยบาย phase และ threshold เป็นรายละเอียดระดับ implementation (ไม่ใช่คีย์ config ที่ผู้ใช้ใช้งานโดยตรง)
- config หน่วยความจำเต็มรูปแบบอยู่ใน [เอกสารอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Claude bundle plugins ที่เปิดใช้งานยังสามารถส่งค่าเริ่มต้นของ embedded Pi มาผ่าน `settings.json` ได้ด้วย OpenClaw จะนำค่านั้นไปใช้เป็นการตั้งค่าเอเจนต์ที่ผ่านการทำให้ปลอดภัยแล้ว ไม่ใช่เป็น patch config ดิบของ OpenClaw
- `plugins.slots.memory`: เลือก id ของ memory plugin ที่ทำงานอยู่ หรือ `"none"` เพื่อปิด memory plugins
- `plugins.slots.contextEngine`: เลือก id ของ context engine plugin ที่ทำงานอยู่; ค่าเริ่มต้นเป็น `"legacy"` เว้นแต่คุณจะติดตั้งและเลือก engine อื่น
- `plugins.installs`: metadata การติดตั้งที่ CLI จัดการ ใช้โดย `openclaw plugins update`
  - รวมถึง `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`
  - ให้ถือว่า `plugins.installs.*` เป็น managed state; ควรใช้คำสั่ง CLI แทนการแก้ไขด้วยมือ

ดู [Plugins](/th/tools/plugin)

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // เปิดใช้แบบ opt in เท่านั้นสำหรับการเข้าถึง private network ที่เชื่อถือได้
      // allowPrivateNetwork: true, // ชื่อแทนแบบเดิม
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

- `evaluateEnabled: false` จะปิดใช้งาน `act:evaluate` และ `wait --fn`
- `tabCleanup` จะเก็บกวาดแท็บหลักของเอเจนต์ที่ถูกติดตามหลังจากไม่มีการใช้งานตามเวลาที่กำหนด หรือเมื่อ
  เซสชันมีจำนวนแท็บเกินขีดจำกัด ตั้ง `idleMinutes: 0` หรือ `maxTabsPerSession: 0` เพื่อ
  ปิดโหมดการเก็บกวาดแต่ละแบบนั้นแยกกัน
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` จะถูกปิดใช้งานเมื่อไม่ได้ตั้งค่า ดังนั้นการนำทางของเบราว์เซอร์จะยังคงเข้มงวดตามค่าเริ่มต้น
- ตั้ง `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เฉพาะเมื่อคุณตั้งใจไว้วางใจการนำทางเบราว์เซอร์บน private network
- ในโหมดเข้มงวด endpoint ของโปรไฟล์ CDP ระยะไกล (`profiles.*.cdpUrl`) จะอยู่ภายใต้การบล็อก private network แบบเดียวกันระหว่างการตรวจสอบการเข้าถึง/การค้นพบ
- `ssrfPolicy.allowPrivateNetwork` ยังคงรองรับในฐานะชื่อแทนแบบเดิม
- ในโหมดเข้มงวด ให้ใช้ `ssrfPolicy.hostnameAllowlist` และ `ssrfPolicy.allowedHostnames` สำหรับข้อยกเว้นแบบระบุชัดเจน
- โปรไฟล์ระยะไกลเป็นแบบ attach-only (ปิดใช้งาน start/stop/reset)
- `profiles.*.cdpUrl` รองรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) เมื่อต้องการให้ OpenClaw ค้นหา `/json/version`; ใช้ WS(S)
  เมื่อ provider ของคุณให้ URL DevTools WebSocket โดยตรง
- โปรไฟล์ `existing-session` ใช้ Chrome MCP แทน CDP และสามารถเชื่อมต่อบน
  โฮสต์ที่เลือกหรือผ่าน browser node ที่เชื่อมต่ออยู่
- โปรไฟล์ `existing-session` สามารถตั้ง `userDataDir` เพื่อระบุเป้าหมายเป็น
  โปรไฟล์เบราว์เซอร์ที่อิง Chromium แบบเฉพาะ เช่น Brave หรือ Edge
- โปรไฟล์ `existing-session` ยังคงข้อจำกัดเส้นทางของ Chrome MCP ในปัจจุบัน:
  การดำเนินการแบบขับเคลื่อนด้วย snapshot/ref แทนการระบุเป้าหมายด้วย CSS selector, hook สำหรับอัปโหลดครั้งละหนึ่งไฟล์,
  ไม่มีการแทนที่ dialog timeout, ไม่มี `wait --load networkidle`, และไม่มี
  `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด หรือ batch actions
- โปรไฟล์ `openclaw` แบบจัดการในเครื่องจะกำหนด `cdpPort` และ `cdpUrl` อัตโนมัติ; ควร
  ตั้ง `cdpUrl` อย่างชัดเจนเฉพาะสำหรับ CDP ระยะไกลเท่านั้น
- โปรไฟล์แบบจัดการในเครื่องสามารถตั้ง `executablePath` เพื่อใช้แทน
  `browser.executablePath` แบบโกลบอลสำหรับโปรไฟล์นั้น ใช้สิ่งนี้เพื่อรันโปรไฟล์หนึ่งใน
  Chrome และอีกโปรไฟล์หนึ่งใน Brave
- โปรไฟล์แบบจัดการในเครื่องใช้ `browser.localLaunchTimeoutMs` สำหรับการค้นหา Chrome CDP HTTP
  หลังจากโปรเซสเริ่มทำงาน และใช้ `browser.localCdpReadyTimeoutMs` สำหรับ
  ความพร้อมใช้งานของ CDP websocket หลังเปิดตัว เพิ่มค่านี้บนโฮสต์ที่ช้ากว่าซึ่ง Chrome
  เริ่มสำเร็จแต่การตรวจสอบความพร้อมชนกับช่วงเริ่มต้น
- ลำดับการตรวจจับอัตโนมัติ: เบราว์เซอร์ค่าเริ่มต้นหากอิง Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary
- `browser.executablePath` รองรับ `~` สำหรับไดเรกทอรี home ของระบบปฏิบัติการคุณ
- บริการควบคุม: loopback เท่านั้น (พอร์ต derive จาก `gateway.port`, ค่าเริ่มต้น `18791`)
- `extraArgs` จะต่อท้าย launch flag เพิ่มเติมให้กับการเริ่ม Chromium ในเครื่อง (เช่น
  `--disable-gpu`, การกำหนดขนาดหน้าต่าง หรือ flag สำหรับดีบัก)

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

- `seamColor`: สี accent สำหรับ UI chrome ของแอปเนทีฟ (เช่น สีของบับเบิลใน Talk Mode)
- `assistant`: การแทนที่ identity ของ Control UI จะ fallback ไปยัง identity ของเอเจนต์ที่ใช้งานอยู่

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
    // ไม่บังคับ ค่าเริ่มต้น false
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // ไม่บังคับ ค่าเริ่มต้นคือ unset/disabled
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // การปฏิเสธ HTTP เพิ่มเติมสำหรับ /tools/invoke
      deny: ["browser"],
      // นำ tools ออกจากรายการปฏิเสธ HTTP เริ่มต้น
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

<Accordion title="รายละเอียดฟิลด์ของ Gateway">

- `mode`: `local` (รัน gateway) หรือ `remote` (เชื่อมต่อกับ gateway ระยะไกล) Gateway จะปฏิเสธการเริ่มทำงานหากไม่ใช่ `local`
- `port`: พอร์ตแบบ multiplexed เดียวสำหรับทั้ง WS + HTTP ลำดับความสำคัญ: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`
- `bind`: `auto`, `loopback` (ค่าเริ่มต้น), `lan` (`0.0.0.0`), `tailnet` (เฉพาะ Tailscale IP) หรือ `custom`
- **ชื่อแทน bind แบบเดิม**: ให้ใช้ค่าของ bind mode ใน `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`) ไม่ใช่ชื่อแทนของโฮสต์ (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`)
- **หมายเหตุสำหรับ Docker**: ค่า bind เริ่มต้น `loopback` จะฟังบน `127.0.0.1` ภายในคอนเทนเนอร์ เมื่อใช้ Docker bridge networking (`-p 18789:18789`) ทราฟฟิกจะเข้ามาทาง `eth0` ดังนั้น gateway จะไม่สามารถเข้าถึงได้ ใช้ `--network host` หรือตั้ง `bind: "lan"` (หรือ `bind: "custom"` พร้อม `customBindHost: "0.0.0.0"`) เพื่อฟังทุกอินเทอร์เฟซ
- **การยืนยันตัวตน**: จำเป็นตามค่าเริ่มต้น bind ที่ไม่ใช่ loopback จำเป็นต้องใช้ gateway auth ในทางปฏิบัติหมายถึงโทเค็น/รหัสผ่านที่ใช้ร่วมกัน หรือ reverse proxy แบบรับรู้ตัวตนที่ตั้ง `gateway.auth.mode: "trusted-proxy"` วิซาร์ด onboarding จะสร้างโทเค็นให้เป็นค่าเริ่มต้น
- หากกำหนดทั้ง `gateway.auth.token` และ `gateway.auth.password` ไว้ (รวมถึง SecretRef) ให้ตั้ง `gateway.auth.mode` อย่างชัดเจนเป็น `token` หรือ `password` การเริ่มทำงานและโฟลว์ติดตั้ง/ซ่อมแซม service จะล้มเหลวเมื่อทั้งสองค่าถูกกำหนดไว้แต่ไม่ได้ตั้ง mode
- `gateway.auth.mode: "none"`: โหมดไม่ยืนยันตัวตนแบบชัดเจน ใช้เฉพาะกับการตั้งค่า local loopback ที่เชื่อถือได้เท่านั้น; ตัวเลือกนี้จะไม่ถูกเสนอโดยตั้งใจในพรอมต์ onboarding
- `gateway.auth.mode: "trusted-proxy"`: มอบหมายการยืนยันตัวตนให้ reverse proxy แบบรับรู้ตัวตน และเชื่อถือ identity header จาก `gateway.trustedProxies` (ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth)) โหมดนี้คาดหวังแหล่งที่มาของ proxy แบบ **non-loopback**; reverse proxy แบบ loopback บนโฮสต์เดียวกันไม่เข้าเงื่อนไข trusted-proxy auth
- `gateway.auth.allowTailscale`: เมื่อเป็น `true`, header identity ของ Tailscale Serve สามารถใช้ยืนยันตัวตนสำหรับ Control UI/WebSocket ได้ (ตรวจสอบผ่าน `tailscale whois`) endpoint ของ HTTP API **จะไม่** ใช้การยืนยันตัวตนผ่าน header ของ Tailscale นี้; แต่จะใช้โหมด HTTP auth ปกติของ gateway แทน โฟลว์แบบไม่ใช้โทเค็นนี้ตั้งอยู่บนสมมติฐานว่าโฮสต์ของ gateway เชื่อถือได้ ค่าเริ่มต้นเป็น `true` เมื่อ `tailscale.mode = "serve"`
- `gateway.auth.rateLimit`: ตัวจำกัดความพยายามยืนยันตัวตนที่ล้มเหลวแบบไม่บังคับ ใช้ต่อ client IP และต่อ auth scope (shared-secret และ device-token จะถูกติดตามแยกกัน) ความพยายามที่ถูกบล็อกจะคืน `429` + `Retry-After`
  - บนเส้นทาง async ของ Tailscale Serve Control UI ความพยายามที่ล้มเหลวสำหรับ `{scope, clientIp}` เดียวกันจะถูก serialize ก่อนการเขียนสถานะล้มเหลว ดังนั้นความพยายามที่ไม่ถูกต้องพร้อมกันจาก client เดียวกันจึงอาจไปชนตัวจำกัดในคำขอที่สอง แทนที่จะหลุดผ่านทั้งคู่ในฐานะ mismatch ปกติ
  - `gateway.auth.rateLimit.exemptLoopback` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เมื่อคุณตั้งใจให้ทราฟฟิก localhost ถูกจำกัดอัตราด้วยเช่นกัน (สำหรับชุดทดสอบหรือการติดตั้ง proxy แบบเข้มงวด)
- ความพยายามยืนยันตัวตนของ WS ที่มาจาก browser จะถูก throttle เสมอโดยปิด loopback exemption (ป้องกันเชิงลึกจากการ brute force localhost ผ่าน browser)
- บน loopback การล็อกเอาต์จากฝั่ง browser-origin เหล่านั้นจะถูกแยกตามค่า `Origin`
  ที่ normalize แล้ว ดังนั้นความล้มเหลวซ้ำ ๆ จาก localhost origin หนึ่งจะไม่
  ทำให้ origin อื่นถูกล็อกเอาต์โดยอัตโนมัติ
- `tailscale.mode`: `serve` (เฉพาะ tailnet, bind แบบ loopback) หรือ `funnel` (สาธารณะ, ต้องใช้ auth)
- `controlUi.allowedOrigins`: allowlist ของ browser-origin แบบชัดเจนสำหรับการเชื่อมต่อ Gateway WebSocket จำเป็นเมื่อคาดว่าจะมี browser client จาก origin ที่ไม่ใช่ loopback
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: โหมดอันตรายที่เปิดใช้ Host-header origin fallback สำหรับการติดตั้งที่ตั้งใจพึ่งพานโยบาย origin จาก Host header
- `remote.transport`: `ssh` (ค่าเริ่มต้น) หรือ `direct` (ws/wss) สำหรับ `direct`, `remote.url` ต้องเป็น `ws://` หรือ `wss://`
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: ตัว override แบบ break-glass ใน process-environment ฝั่ง client
  ที่อนุญาต `ws://` แบบ plaintext ไปยัง trusted private-network
  IPs; ค่าเริ่มต้นยังคงจำกัด plaintext ไว้เฉพาะ loopback ไม่มีค่าเทียบเท่าใน `openclaw.json`
  และ config private-network ของ browser เช่น
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ไม่มีผลต่อ Gateway
  WebSocket clients
- `gateway.remote.token` / `.password` เป็นฟิลด์ข้อมูลรับรองของ remote-client โดยตัวมันเองไม่ได้กำหนดค่า gateway auth
- `gateway.push.apns.relay.baseUrl`: URL HTTPS ฐานสำหรับ APNs relay ภายนอกที่ใช้โดย iOS build ทางการ/TestFlight หลังจากที่พวกมันเผยแพร่ relay-backed registrations ไปยัง gateway URL นี้ต้องตรงกับ relay URL ที่คอมไพล์อยู่ใน iOS build
- `gateway.push.apns.relay.timeoutMs`: เวลาหมดอายุการส่งจาก gateway ไปยัง relay เป็นมิลลิวินาที ค่าเริ่มต้นเป็น `10000`
- relay-backed registrations จะถูกมอบหมายให้กับ identity ของ gateway เฉพาะตัว iOS app ที่จับคู่ไว้จะเรียก `gateway.identity.get`, ใส่ identity นั้นลงในการลงทะเบียน relay และส่งต่อ send grant ที่ผูกกับ registration ไปยัง gateway gateway อื่นจะไม่สามารถนำ registration ที่เก็บไว้นี้กลับมาใช้ได้
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: env override ชั่วคราวสำหรับ config relay ข้างต้น
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch สำหรับการพัฒนาเท่านั้น สำหรับ URL relay แบบ loopback HTTP URL relay สำหรับ production ควรคงเป็น HTTPS
- `gateway.channelHealthCheckMinutes`: ช่วงเวลาของตัวตรวจสอบสุขภาพช่องเป็นนาที ตั้ง `0` เพื่อปิดการรีสตาร์ทจาก health-monitor ทั่วทั้งระบบ ค่าเริ่มต้น: `5`
- `gateway.channelStaleEventThresholdMinutes`: ค่า threshold ของ socket ค้างเป็นนาที ควรตั้งให้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes` ค่าเริ่มต้น: `30`
- `gateway.channelMaxRestartsPerHour`: จำนวนครั้งสูงสุดของการรีสตาร์ทโดย health-monitor ต่อช่อง/บัญชี ในหนึ่งชั่วโมงแบบ rolling ค่าเริ่มต้น: `10`
- `channels.<provider>.healthMonitor.enabled`: ตัวเลือกปิดการรีสตาร์ทโดย health-monitor รายช่อง โดยยังคงเปิด global monitor ไว้
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: การแทนที่รายบัญชีสำหรับช่องแบบหลายบัญชี เมื่อมีการตั้งค่าไว้ จะมีลำดับความสำคัญสูงกว่าการแทนที่ระดับช่อง
- เส้นทางการเรียก local gateway สามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อยังไม่ได้ตั้ง `gateway.auth.*`
- หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดอย่างชัดเจนผ่าน SecretRef แต่ resolve ไม่ได้ การ resolve จะล้มเหลวแบบ fail-closed (ไม่มี remote fallback มาช่วยกลบ)
- `trustedProxies`: IP ของ reverse proxy ที่ terminate TLS หรือ inject forwarded-client headers ให้ระบุเฉพาะ proxy ที่คุณควบคุมเท่านั้น รายการ loopback ยังคงใช้ได้กับการตั้งค่า proxy บนโฮสต์เดียวกัน/การตรวจจับแบบ local (เช่น Tailscale Serve หรือ local reverse proxy) แต่รายการเหล่านี้ **ไม่ได้** ทำให้คำขอ loopback มีสิทธิ์ใช้ `gateway.auth.mode: "trusted-proxy"`
- `allowRealIpFallback`: เมื่อเป็น `true`, gateway จะยอมรับ `X-Real-IP` หากไม่มี `X-Forwarded-For` ค่าเริ่มต้น `false` เพื่อคงพฤติกรรม fail-closed
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist แบบไม่บังคับของ CIDR/IP สำหรับการอนุมัติอัตโนมัติให้กับการจับคู่อุปกรณ์ node ครั้งแรกที่ไม่ร้องขอ scope ใด ๆ ฟีเจอร์นี้จะปิดอยู่เมื่อไม่ได้ตั้งค่า ไม่อนุมัติอัตโนมัติให้ operator/browser/Control UI/WebChat pairing และไม่อนุมัติอัตโนมัติสำหรับการอัปเกรด role, scope, metadata หรือ public-key
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: การกำหนดรูปแบบ allow/deny แบบโกลบอลสำหรับคำสั่ง node ที่ประกาศไว้ หลังการจับคู่และการประเมิน allowlist
- `gateway.tools.deny`: ชื่อ tool เพิ่มเติมที่ถูกบล็อกสำหรับ HTTP `POST /tools/invoke` (ขยายรายการ deny เริ่มต้น)
- `gateway.tools.allow`: นำชื่อ tool ออกจากรายการ deny เริ่มต้นของ HTTP

</Accordion>

### endpoint ที่เข้ากันได้กับ OpenAI

- Chat Completions: ปิดใช้งานตามค่าเริ่มต้น เปิดใช้ด้วย `gateway.http.endpoints.chatCompletions.enabled: true`
- Responses API: `gateway.http.endpoints.responses.enabled`
- การทำให้ URL-input ของ Responses แข็งแรงขึ้น:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlist ที่ว่างจะถือว่าไม่ได้ตั้งค่า; ใช้ `gateway.http.endpoints.responses.files.allowUrl=false`
    และ/หรือ `gateway.http.endpoints.responses.images.allowUrl=false` เพื่อปิดการดึง URL
- header แบบไม่บังคับสำหรับ hardening ของ response:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ตั้งค่าเฉพาะสำหรับ HTTPS origin ที่คุณควบคุม; ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### การแยกหลายอินสแตนซ์

รันหลาย gateway บนโฮสต์เดียวกันโดยใช้พอร์ตและ state dir ที่ไม่ซ้ำกัน:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

แฟล็กอำนวยความสะดวก: `--dev` (ใช้ `~/.openclaw-dev` + พอร์ต `19001`), `--profile <name>` (ใช้ `~/.openclaw-<name>`)

ดู [Multiple Gateways](/th/gateway/multiple-gateways)

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

- `enabled`: เปิดใช้ TLS termination ที่ listener ของ gateway (HTTPS/WSS) (ค่าเริ่มต้น: `false`)
- `autoGenerate`: สร้างคู่ cert/key แบบ self-signed ภายในเครื่องโดยอัตโนมัติเมื่อไม่ได้กำหนดไฟล์แบบชัดเจน; ใช้เฉพาะ local/dev เท่านั้น
- `certPath`: พาธใน filesystem ไปยังไฟล์ TLS certificate
- `keyPath`: พาธใน filesystem ไปยังไฟล์ TLS private key; ควรจำกัดสิทธิ์การเข้าถึง
- `caPath`: พาธไปยัง CA bundle แบบไม่บังคับสำหรับการยืนยัน client หรือ trust chain แบบกำหนดเอง

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 0,
    },
  },
}
```

- `mode`: ควบคุมวิธีนำการแก้ไข config ไปใช้ในรันไทม์
  - `"off"`: เพิกเฉยต่อการแก้ไขแบบสด; การเปลี่ยนแปลงต้องรีสตาร์ทอย่างชัดเจน
  - `"restart"`: รีสตาร์ทโปรเซส gateway ทุกครั้งเมื่อ config เปลี่ยน
  - `"hot"`: นำการเปลี่ยนแปลงไปใช้ในโปรเซสโดยไม่รีสตาร์ท
  - `"hybrid"` (ค่าเริ่มต้น): ลอง hot reload ก่อน; fallback ไปรีสตาร์ทหากจำเป็น
- `debounceMs`: หน้าต่าง debounce เป็นมิลลิวินาทีก่อนนำการเปลี่ยนแปลง config ไปใช้ (จำนวนเต็มที่ไม่ติดลบ)
- `deferralTimeoutMs`: เวลาสูงสุดแบบไม่บังคับเป็นมิลลิวินาทีสำหรับรอให้การดำเนินการที่กำลังทำงานอยู่เสร็จก่อนบังคับรีสตาร์ท ละเว้นหรือกำหนดเป็น `0` เพื่อรอไม่มีกำหนดและบันทึกคำเตือน still-pending เป็นระยะ

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
        messageTemplate: "จาก: {{messages[0].from}}\nหัวเรื่อง: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

การยืนยันตัวตน: `Authorization: Bearer <token>` หรือ `x-openclaw-token: <token>`
โทเค็นของ hook ใน query string จะถูกปฏิเสธ

หมายเหตุด้านการตรวจสอบและความปลอดภัย:

- `hooks.enabled=true` ต้องมี `hooks.token` ที่ไม่ว่าง
- `hooks.token` ต้อง **แตกต่าง** จาก `gateway.auth.token`; การใช้โทเค็น Gateway ซ้ำจะถูกปฏิเสธ
- `hooks.path` ต้องไม่เป็น `/`; ให้ใช้ subpath เฉพาะ เช่น `/hooks`
- หาก `hooks.allowRequestSessionKey=true` ให้จำกัด `hooks.allowedSessionKeyPrefixes` (เช่น `["hook:"]`)
- หาก mapping หรือ preset ใช้ `sessionKey` แบบ template ให้ตั้ง `hooks.allowedSessionKeyPrefixes` และ `hooks.allowRequestSessionKey=true` คีย์ mapping แบบคงที่ไม่ต้องใช้ opt-in นี้

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` จาก payload ของคำขอจะถูกรับก็ต่อเมื่อ `hooks.allowRequestSessionKey=true` (ค่าเริ่มต้น: `false`)
- `POST /hooks/<name>` → resolve ผ่าน `hooks.mappings`
  - ค่า `sessionKey` ของ mapping ที่เรนเดอร์ด้วย template จะถือว่าเป็นค่าที่มาจากภายนอก และต้องใช้ `hooks.allowRequestSessionKey=true` เช่นกัน

<Accordion title="รายละเอียดของ Mapping">

- `match.path` จับคู่ sub-path หลัง `/hooks` (เช่น `/hooks/gmail` → `gmail`)
- `match.source` จับคู่ฟิลด์ใน payload สำหรับพาธแบบทั่วไป
- template อย่าง `{{messages[0].subject}}` จะอ่านจาก payload
- `transform` สามารถชี้ไปยังโมดูล JS/TS ที่คืนค่า hook action ได้
  - `transform.module` ต้องเป็นพาธสัมพัทธ์และอยู่ภายใน `hooks.transformsDir` เท่านั้น (พาธแบบ absolute และการ traversal จะถูกปฏิเสธ)
- `agentId` ใช้กำหนดเส้นทางไปยังเอเจนต์เฉพาะ; ID ที่ไม่รู้จักจะ fallback ไปยังค่าเริ่มต้น
- `allowedAgentIds`: จำกัด explicit routing (`*` หรือไม่ระบุ = อนุญาตทั้งหมด, `[]` = ปฏิเสธทั้งหมด)
- `defaultSessionKey`: session key คงที่แบบไม่บังคับสำหรับการรัน hook agent ที่ไม่มี `sessionKey` แบบ explicit
- `allowRequestSessionKey`: อนุญาตให้ผู้เรียก `/hooks/agent` และ session key ของ mapping ที่ขับเคลื่อนด้วย template ตั้งค่า `sessionKey` ได้ (ค่าเริ่มต้น: `false`)
- `allowedSessionKeyPrefixes`: allowlist แบบไม่บังคับของ prefix สำหรับค่า `sessionKey` แบบ explicit (ทั้ง request + mapping) เช่น `["hook:"]` จะกลายเป็นสิ่งจำเป็นเมื่อ mapping หรือ preset ใด ๆ ใช้ `sessionKey` แบบ template
- `deliver: true` จะส่งคำตอบสุดท้ายไปยังช่อง; `channel` มีค่าเริ่มต้นเป็น `last`
- `model` ใช้แทน LLM สำหรับการรัน hook นี้ (ต้องได้รับอนุญาตหากมีการตั้ง model catalog)

</Accordion>

### การเชื่อมต่อ Gmail

- Gmail preset ในตัวใช้ `sessionKey: "hook:gmail:{{messages[0].id}}"`
- หากคุณคงการกำหนดเส้นทางแบบต่อข้อความนี้ไว้ ให้ตั้ง `hooks.allowRequestSessionKey: true` และจำกัด `hooks.allowedSessionKeyPrefixes` ให้ตรงกับ namespace ของ Gmail เช่น `["hook:", "hook:gmail:"]`
- หากคุณต้องการ `hooks.allowRequestSessionKey: false` ให้แทนที่ preset ด้วย `sessionKey` แบบคงที่แทนค่าเริ่มต้นแบบ template

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

- Gateway จะเริ่ม `gog gmail watch serve` อัตโนมัติระหว่างบูตเมื่อมีการกำหนดค่าไว้ ตั้ง `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อปิดใช้งาน
- อย่ารัน `gog gmail watch serve` แยกต่างหากพร้อมกับ Gateway

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- ให้บริการ HTML/CSS/JS และ A2UI ที่เอเจนต์แก้ไขได้ผ่าน HTTP ภายใต้พอร์ตของ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- เฉพาะ local: ให้คง `gateway.bind: "loopback"` (ค่าเริ่มต้น)
- bind ที่ไม่ใช่ loopback: เส้นทาง canvas ต้องใช้ Gateway auth (token/password/trusted-proxy) เช่นเดียวกับพื้นผิว HTTP อื่นของ Gateway
- โดยทั่วไป Node WebView จะไม่ส่ง auth header; หลังจากจับคู่และเชื่อมต่อ node แล้ว Gateway จะโฆษณา capability URL แบบจำกัดขอบเขต node สำหรับการเข้าถึง canvas/A2UI
- capability URL จะผูกกับเซสชัน WS ของ node ที่กำลังใช้งานอยู่ และหมดอายุอย่างรวดเร็ว ไม่มีการใช้ fallback แบบอิง IP
- inject live-reload client ลงใน HTML ที่ให้บริการ
- สร้าง `index.html` เริ่มต้นให้อัตโนมัติเมื่อว่างเปล่า
- ให้บริการ A2UI ที่ `/__openclaw__/a2ui/` ด้วย
- การเปลี่ยนแปลงต้องรีสตาร์ท gateway
- ปิด live reload สำหรับไดเรกทอรีขนาดใหญ่หรือเมื่อเกิดข้อผิดพลาด `EMFILE`

---

## Discovery

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

- `minimal` (ค่าเริ่มต้น): ละเว้น `cliPath` + `sshPort` จาก TXT record
- `full`: รวม `cliPath` + `sshPort`
- hostname มีค่าเริ่มต้นเป็น `openclaw` แทนที่ได้ด้วย `OPENCLAW_MDNS_HOSTNAME`

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

เขียน unicast DNS-SD zone ลงใต้ `~/.openclaw/dns/` สำหรับการค้นพบข้ามเครือข่าย ให้ใช้ร่วมกับ DNS server (แนะนำ CoreDNS) + Tailscale split DNS

การตั้งค่า: `openclaw dns setup --apply`

---

## Environment

### `env` (env vars แบบ inline)

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

- env vars แบบ inline จะถูกนำไปใช้เฉพาะเมื่อ process env ไม่มีคีย์นั้น
- ไฟล์ `.env`: `.env` ของ CWD + `~/.openclaw/.env` (ทั้งสองแห่งจะไม่แทนที่ตัวแปรที่มีอยู่แล้ว)
- `shellEnv`: นำเข้าคีย์ที่คาดว่าจะมีแต่ยังขาดหายไปจาก login shell profile ของคุณ
- ดู [Environment](/th/help/environment) สำหรับลำดับความสำคัญแบบเต็ม

### การแทนที่ env var

อ้างอิง env vars ในสตริง config ใดก็ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- จับคู่เฉพาะชื่อแบบตัวพิมพ์ใหญ่เท่านั้น: `[A-Z_][A-Z0-9_]*`
- ตัวแปรที่หายไป/ว่างจะทำให้เกิดข้อผิดพลาดตอนโหลด config
- ใช้ `$${VAR}` เพื่อให้ได้ `${VAR}` แบบ literal
- ใช้งานได้กับ `$include`

---

## Secrets

Secret ref เป็นแบบ additive: ค่า plaintext ยังคงใช้งานได้

### `SecretRef`

ใช้ออบเจ็กต์เพียงรูปแบบเดียว:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

การตรวจสอบ:

- แพตเทิร์นของ `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- แพตเทิร์นของ `id` เมื่อ `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` `id`: absolute JSON pointer (เช่น `"/providers/openai/apiKey"`)
- แพตเทิร์นของ `id` เมื่อ `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` `id` ต้องไม่มี path segment แบบ `.` หรือ `..` ที่คั่นด้วย `/` (เช่น `a/../b` จะถูกปฏิเสธ)

### พื้นผิวข้อมูลรับรองที่รองรับ

- เมทริกซ์มาตรฐาน: [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
- `secrets apply` จะกำหนดเป้าหมายไปยังพาธข้อมูลรับรองของ `openclaw.json` ที่รองรับ
- ref ใน `auth-profiles.json` ถูกรวมอยู่ในการ resolve ระหว่างรันไทม์และในการครอบคลุมของการตรวจสอบ

### Config ของ Secret provider

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // env provider แบบ explicit ที่ไม่บังคับ
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

- provider แบบ `file` รองรับ `mode: "json"` และ `mode: "singleValue"` (`id` ต้องเป็น `"value"` ในโหมด singleValue)
- พาธของ provider แบบ file และ exec จะ fail closed เมื่อไม่สามารถตรวจสอบ Windows ACL ได้ ตั้ง `allowInsecurePath: true` เฉพาะกับพาธที่เชื่อถือได้และไม่สามารถตรวจสอบได้เท่านั้น
- provider แบบ `exec` ต้องใช้พาธ `command` แบบ absolute และใช้ protocol payload ผ่าน stdin/stdout
- ตามค่าเริ่มต้น พาธคำสั่งที่เป็น symlink จะถูกปฏิเสธ ตั้ง `allowSymlinkCommand: true` เพื่ออนุญาตพาธ symlink โดยยังคงตรวจสอบพาธเป้าหมายที่ resolve แล้ว
- หากมีการตั้งค่า `trustedDirs` การตรวจสอบ trusted-dir จะใช้กับพาธเป้าหมายที่ resolve แล้ว
- environment ของ child สำหรับ `exec` จะมีค่าน้อยที่สุดตามค่าเริ่มต้น; ส่งผ่านตัวแปรที่จำเป็นอย่างชัดเจนด้วย `passEnv`
- Secret ref จะถูก resolve ตอน activation ไปยัง snapshot ในหน่วยความจำ จากนั้นเส้นทางคำขอจะอ่านจาก snapshot เท่านั้น
- การกรอง active-surface จะถูกนำไปใช้ระหว่าง activation: ref ที่ resolve ไม่ได้บนพื้นผิวที่เปิดใช้งานจะทำให้ startup/reload ล้มเหลว ขณะที่พื้นผิวที่ไม่ได้ใช้งานจะถูกข้ามพร้อมข้อมูลวินิจฉัย

---

## ที่เก็บข้อมูลการยืนยันตัวตน

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

- โปรไฟล์รายเอเจนต์จะถูกเก็บไว้ที่ `<agentDir>/auth-profiles.json`
- `auth-profiles.json` รองรับ ref ระดับค่า (`keyRef` สำหรับ `api_key`, `tokenRef` สำหรับ `token`) สำหรับโหมดข้อมูลรับรองแบบคงที่
- โปรไฟล์โหมด OAuth (`auth.profiles.<id>.mode = "oauth"`) ไม่รองรับข้อมูลรับรองของ auth-profile ที่ขับเคลื่อนด้วย SecretRef
- ข้อมูลรับรองรันไทม์แบบคงที่มาจาก snapshot ที่ resolve แล้วในหน่วยความจำ; รายการ `auth.json` แบบคงที่เดิมจะถูกล้างเมื่อถูกค้นพบ
- การนำเข้า OAuth แบบเดิมมาจาก `~/.openclaw/credentials/oauth.json`
- ดู [OAuth](/th/concepts/oauth)
- พฤติกรรมรันไทม์ของ Secrets และเครื่องมือ `audit/configure/apply`: [การจัดการ Secrets](/th/gateway/secrets)

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

- `billingBackoffHours`: backoff พื้นฐานเป็นชั่วโมงเมื่อโปรไฟล์ล้มเหลวจากข้อผิดพลาด billing/เครดิตไม่เพียงพอที่เชื่อถือได้จริง
  (ค่าเริ่มต้น: `5`) ข้อความ billing แบบ explicit
  ยังอาจเข้ามาในเส้นทางนี้ได้แม้ตอบกลับด้วย `401`/`403` แต่ text matcher
  ที่เฉพาะกับ provider จะยังคงจำกัดอยู่กับ provider ที่เป็นเจ้าของมันเท่านั้น (เช่น OpenRouter
  `Key limit exceeded`) ข้อความ `402` usage-window หรือ
  spend-limit ของ organization/workspace ที่ retry ได้จะยังคงอยู่ในเส้นทาง `rate_limit`
  แทน
- `billingBackoffHoursByProvider`: การแทนที่ราย provider แบบไม่บังคับสำหรับ billing backoff เป็นชั่วโมง
- `billingMaxHours`: เพดานเป็นชั่วโมงสำหรับการเติบโตแบบ exponential ของ billing backoff (ค่าเริ่มต้น: `24`)
- `authPermanentBackoffMinutes`: backoff พื้นฐานเป็นนาทีสำหรับความล้มเหลว `auth_permanent` ที่มีความเชื่อมั่นสูง (ค่าเริ่มต้น: `10`)
- `authPermanentMaxMinutes`: เพดานเป็นนาทีสำหรับการเติบโตของ backoff ของ `auth_permanent` (ค่าเริ่มต้น: `60`)
- `failureWindowHours`: หน้าต่างแบบ rolling เป็นชั่วโมงที่ใช้สำหรับตัวนับ backoff (ค่าเริ่มต้น: `24`)
- `overloadedProfileRotations`: จำนวนการสลับ auth-profile ของ provider เดียวกันสูงสุดสำหรับข้อผิดพลาด overloaded ก่อนสลับไปใช้ model fallback (ค่าเริ่มต้น: `1`) รูปแบบ provider-busy เช่น `ModelNotReadyException` จะอยู่ในกลุ่มนี้
- `overloadedBackoffMs`: ความหน่วงคงที่ก่อนลอง provider/profile rotation ใหม่เมื่อ overloaded (ค่าเริ่มต้น: `0`)
- `rateLimitedProfileRotations`: จำนวนการสลับ auth-profile ของ provider เดียวกันสูงสุดสำหรับข้อผิดพลาด rate-limit ก่อนสลับไปใช้ model fallback (ค่าเริ่มต้น: `1`) กลุ่ม rate-limit นั้นรวมข้อความในสไตล์ provider เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` และ `resource exhausted`

---

## Logging

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

- ไฟล์ log ค่าเริ่มต้น: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`
- ตั้ง `logging.file` สำหรับพาธแบบคงที่
- `consoleLevel` จะถูกยกระดับเป็น `debug` เมื่อใช้ `--verbose`
- `maxFileBytes`: ขนาดไฟล์ log สูงสุดเป็นไบต์ก่อนจะระงับการเขียน (จำนวนเต็มบวก; ค่าเริ่มต้น: `524288000` = 500 MB) ควรใช้การหมุน log ภายนอกสำหรับการติดตั้ง production

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

- `enabled`: สวิตช์หลักสำหรับเอาต์พุตการทำ instrumentation (ค่าเริ่มต้น: `true`)
- `flags`: อาร์เรย์ของสตริงแฟล็กที่เปิดใช้เอาต์พุต log แบบเจาะจงเป้าหมาย (รองรับ wildcard เช่น `"telegram.*"` หรือ `"*"`)
- `stuckSessionWarnMs`: ค่า threshold ของอายุเป็นมิลลิวินาทีสำหรับการส่งคำเตือนเซสชันค้าง ขณะที่เซสชันยังคงอยู่ในสถานะกำลังประมวลผล
- `otel.enabled`: เปิดใช้ไปป์ไลน์การส่งออก OpenTelemetry (ค่าเริ่มต้น: `false`)
- `otel.endpoint`: URL ของ collector สำหรับการส่งออก OTel
- `otel.protocol`: `"http/protobuf"` (ค่าเริ่มต้น) หรือ `"grpc"`
- `otel.headers`: header metadata HTTP/gRPC เพิ่มเติมที่ส่งไปพร้อมคำขอส่งออก OTel
- `otel.serviceName`: ชื่อ service สำหรับ resource attributes
- `otel.traces` / `otel.metrics` / `otel.logs`: เปิดใช้การส่งออก trace, metrics หรือ log
- `otel.sampleRate`: อัตราการสุ่มตัวอย่าง trace `0`–`1`
- `otel.flushIntervalMs`: ช่วงเวลาการ flush telemetry ตามรอบเป็นมิลลิวินาที
- `otel.captureContent`: การเลือกเปิดแบบ opt-in สำหรับการเก็บเนื้อหาดิบไว้ใน OTel span attributes ค่าเริ่มต้นคือปิดอยู่ ค่า boolean `true` จะเก็บเนื้อหาข้อความ/เครื่องมือที่ไม่ใช่ system; รูปแบบออบเจ็กต์ทำให้คุณสามารถเปิด `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` และ `systemPrompt` ได้อย่างชัดเจน
- `OPENCLAW_OTEL_PRELOADED=1`: ตัวสลับผ่าน environment สำหรับโฮสต์ที่ลงทะเบียน OpenTelemetry SDK แบบโกลบอลไว้แล้ว จากนั้น OpenClaw จะข้ามการเริ่มต้น/ปิดระบบ SDK ที่เป็นของ Plugin ขณะยังคงให้ diagnostic listeners ทำงานอยู่
- `cacheTrace.enabled`: บันทึก snapshot ของ cache trace สำหรับการรันแบบ embedded (ค่าเริ่มต้น: `false`)
- `cacheTrace.filePath`: พาธเอาต์พุตสำหรับ cache trace JSONL (ค่าเริ่มต้น: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: ควบคุมสิ่งที่จะถูกรวมไว้ในเอาต์พุต cache trace (ค่าเริ่มต้นทั้งหมด: `true`)

---

## Update

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

- `channel`: release channel สำหรับการติดตั้งแบบ npm/git — `"stable"`, `"beta"` หรือ `"dev"`
- `checkOnStart`: ตรวจหาการอัปเดต npm เมื่อ gateway เริ่มทำงาน (ค่าเริ่มต้น: `true`)
- `auto.enabled`: เปิดใช้การอัปเดตอัตโนมัติเบื้องหลังสำหรับการติดตั้งแบบแพ็กเกจ (ค่าเริ่มต้น: `false`)
- `auto.stableDelayHours`: ระยะหน่วงขั้นต่ำเป็นชั่วโมงก่อนการใช้การอัปเดตอัตโนมัติของ stable channel (ค่าเริ่มต้น: `6`; สูงสุด: `168`)
- `auto.stableJitterHours`: หน้าต่างกระจายการทยอยปล่อยเพิ่มเติมของ stable channel เป็นชั่วโมง (ค่าเริ่มต้น: `12`; สูงสุด: `168`)
- `auto.betaCheckIntervalHours`: ความถี่ในการตรวจสอบของ beta channel เป็นชั่วโมง (ค่าเริ่มต้น: `1`; สูงสุด: `24`)

---

## ACP

```json5
{
  acp: {
    enabled: false,
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

- `enabled`: feature gate แบบโกลบอลของ ACP (ค่าเริ่มต้น: `false`)
- `dispatch.enabled`: gate แบบแยกอิสระสำหรับการส่งเทิร์นของ ACP session (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อให้คำสั่ง ACP ยังใช้งานได้ ขณะบล็อกการทำงานจริง
- `backend`: id ของ ACP runtime backend ค่าเริ่มต้น (ต้องตรงกับ ACP runtime plugin ที่ลงทะเบียนไว้)
- `defaultAgent`: id ของเอเจนต์ ACP เป้าหมายแบบ fallback เมื่อการ spawn ไม่ได้ระบุเป้าหมายอย่างชัดเจน
- `allowedAgents`: allowlist ของ agent id ที่ได้รับอนุญาตสำหรับ ACP runtime session; ถ้าว่างหมายถึงไม่มีข้อจำกัดเพิ่มเติม
- `maxConcurrentSessions`: จำนวน ACP session ที่ active พร้อมกันได้สูงสุด
- `stream.coalesceIdleMs`: หน้าต่าง idle flush เป็นมิลลิวินาทีสำหรับข้อความที่สตรีม
- `stream.maxChunkChars`: ขนาด chunk สูงสุดก่อนแบ่งการฉายผลแบบ block ที่สตรีม
- `stream.repeatSuppression`: ระงับบรรทัดสถานะ/เครื่องมือที่ซ้ำกันต่อเทิร์น (ค่าเริ่มต้น: `true`)
- `stream.deliveryMode`: `"live"` สตรีมแบบค่อยเป็นค่อยไป; `"final_only"` บัฟเฟอร์ไว้จนถึงเหตุการณ์สุดท้ายของเทิร์น
- `stream.hiddenBoundarySeparator`: ตัวคั่นก่อนข้อความที่มองเห็นได้หลัง hidden tool events (ค่าเริ่มต้น: `"paragraph"`)
- `stream.maxOutputChars`: จำนวนอักขระเอาต์พุตของผู้ช่วยสูงสุดที่ฉายผลต่อ ACP turn
- `stream.maxSessionUpdateChars`: จำนวนอักขระสูงสุดสำหรับบรรทัดสถานะ/อัปเดต ACP ที่ฉายผล
- `stream.tagVisibility`: ระเบียนของชื่อแท็กไปยังการแทนค่าการมองเห็นแบบ boolean สำหรับเหตุการณ์ที่สตรีม
- `runtime.ttlMinutes`: idle TTL เป็นนาทีสำหรับ worker ของ ACP session ก่อนจะมีสิทธิ์ถูก cleanup
- `runtime.installCommand`: คำสั่งติดตั้งแบบไม่บังคับที่จะรันเมื่อ bootstrap สภาพแวดล้อม ACP runtime

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
  - `"random"` (ค่าเริ่มต้น): tagline แบบหมุนเวียน ตลก/ตามฤดูกาล
  - `"default"`: tagline กลาง ๆ แบบคงที่ (`All your chats, one OpenClaw.`)
  - `"off"`: ไม่มีข้อความ tagline (ยังคงแสดงชื่อแบนเนอร์/เวอร์ชัน)
- หากต้องการซ่อนทั้งแบนเนอร์ (ไม่ใช่แค่ tagline) ให้ตั้ง env `OPENCLAW_HIDE_BANNER=1`

---

## Wizard

metadata ที่เขียนโดยโฟลว์ guided setup ของ CLI (`onboard`, `configure`, `doctor`):

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

## Identity

ดูฟิลด์ identity ของ `agents.list` ภายใต้ [ค่าเริ่มต้นของเอเจนต์](/th/gateway/config-agents#agent-defaults)

---

## Bridge (แบบเดิม, ถูกนำออกแล้ว)

บิลด์ปัจจุบันไม่มี TCP bridge รวมมาแล้ว Node จะเชื่อมต่อผ่าน Gateway WebSocket คีย์ `bridge.*` ไม่ได้เป็นส่วนหนึ่งของ config schema อีกต่อไป (การตรวจสอบจะล้มเหลวจนกว่าจะลบออก; `openclaw doctor --fix` สามารถลบคีย์ที่ไม่รู้จักได้)

<Accordion title="config bridge แบบเดิม (อ้างอิงเชิงประวัติศาสตร์)">

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
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // fallback แบบเดิมที่เลิกใช้แล้ว สำหรับงานที่เก็บไว้ซึ่งยังมี notify:true
    webhookToken: "replace-with-dedicated-token", // bearer token แบบไม่บังคับสำหรับ auth ของ outbound webhook
    sessionRetention: "24h", // สตริงระยะเวลาหรือ false
    runLog: {
      maxBytes: "2mb", // ค่าเริ่มต้น 2_000_000 bytes
      keepLines: 2000, // ค่าเริ่มต้น 2000
    },
  },
}
```

- `sessionRetention`: ระยะเวลาที่จะเก็บเซสชันการรัน Cron แบบ isolated ที่เสร็จสิ้นแล้วก่อน prune ออกจาก `sessions.json` ยังควบคุมการ cleanup ของ transcript Cron ที่ถูกลบและเก็บถาวรไว้ด้วย ค่าเริ่มต้น: `24h`; ตั้งเป็น `false` เพื่อปิดใช้งาน
- `runLog.maxBytes`: ขนาดสูงสุดต่อไฟล์ run log (`cron/runs/<jobId>.jsonl`) ก่อน pruning ค่าเริ่มต้น: `2_000_000` bytes
- `runLog.keepLines`: จำนวนบรรทัดล่าสุดที่จะเก็บไว้เมื่อเกิดการ prune run-log ค่าเริ่มต้น: `2000`
- `webhookToken`: bearer token ที่ใช้สำหรับการส่ง Cron webhook แบบ POST (`delivery.mode = "webhook"`) หากไม่ระบุ จะไม่ส่ง auth header
- `webhook`: URL webhook fallback แบบเดิมที่เลิกใช้แล้ว (http/https) ใช้เฉพาะกับงานที่เก็บไว้ซึ่งยังมี `notify: true`

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

- `maxAttempts`: จำนวนครั้งสูงสุดในการลองใหม่สำหรับงาน one-shot เมื่อเกิดข้อผิดพลาดชั่วคราว (ค่าเริ่มต้น: `3`; ช่วง: `0`–`10`)
- `backoffMs`: อาร์เรย์ของเวลาหน่วง backoff เป็นมิลลิวินาทีสำหรับแต่ละครั้งที่ลองใหม่ (ค่าเริ่มต้น: `[30000, 60000, 300000]`; 1–10 รายการ)
- `retryOn`: ประเภทข้อผิดพลาดที่ทำให้เกิดการลองใหม่ — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"` หากไม่ระบุ จะลองใหม่กับทุกประเภทชั่วคราว

ใช้กับงาน Cron แบบ one-shot เท่านั้น งานแบบ recurring จะใช้การจัดการความล้มเหลวแยกต่างหาก

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: เปิดใช้การแจ้งเตือนความล้มเหลวสำหรับงาน Cron (ค่าเริ่มต้น: `false`)
- `after`: จำนวนความล้มเหลวต่อเนื่องก่อนจะมีการแจ้งเตือน (จำนวนเต็มบวก, ขั้นต่ำ: `1`)
- `cooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการแจ้งเตือนซ้ำสำหรับงานเดียวกัน (จำนวนเต็มไม่ติดลบ)
- `mode`: โหมดการส่ง — `"announce"` ส่งผ่านข้อความของช่อง; `"webhook"` จะ POST ไปยัง webhook ที่กำหนดไว้
- `accountId`: id ของบัญชีหรือช่องแบบไม่บังคับเพื่อจำกัดขอบเขตการส่งการแจ้งเตือน

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

- ปลายทางค่าเริ่มต้นสำหรับการแจ้งเตือนความล้มเหลวของ Cron สำหรับทุกงาน
- `mode`: `"announce"` หรือ `"webhook"`; ค่าเริ่มต้นเป็น `"announce"` เมื่อมีข้อมูลเป้าหมายเพียงพอ
- `channel`: การแทนที่ช่องสำหรับการส่งแบบ announce `"last"` จะใช้ช่องการส่งล่าสุดที่รู้จักซ้ำ
- `to`: เป้าหมาย announce แบบ explicit หรือ URL webhook จำเป็นสำหรับโหมด webhook
- `accountId`: การแทนที่บัญชีสำหรับการส่งแบบไม่บังคับ
- `delivery.failureDestination` รายงานจะ override ค่าเริ่มต้นระดับโกลบอลนี้
- เมื่อไม่มีการตั้งปลายทางความล้มเหลวทั้งระดับโกลบอลและระดับงาน งานที่ส่งผ่าน `announce` อยู่แล้วจะ fallback ไปยังเป้าหมาย announce หลักนั้นเมื่อเกิดความล้มเหลว
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เว้นแต่ `delivery.mode` หลักของงานจะเป็น `"webhook"`

ดู [งาน Cron](/th/automation/cron-jobs) การรัน Cron แบบ isolated จะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

---

## ตัวแปร template ของ media model

placeholder ของ template ที่ถูกขยายใน `tools.media.models[].args`:

| ตัวแปร | คำอธิบาย |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | เนื้อหาข้อความขาเข้าทั้งหมด |
| `{{RawBody}}`      | เนื้อหาดิบ (ไม่มีตัวครอบประวัติ/ผู้ส่ง) |
| `{{BodyStripped}}` | เนื้อหาที่ลบการ mention ของกลุ่มออกแล้ว |
| `{{From}}`         | ตัวระบุผู้ส่ง |
| `{{To}}`           | ตัวระบุปลายทาง |
| `{{MessageSid}}`   | ID ข้อความของช่อง |
| `{{SessionId}}`    | UUID ของเซสชันปัจจุบัน |
| `{{IsNewSession}}` | `"true"` เมื่อมีการสร้างเซสชันใหม่ |
| `{{MediaUrl}}`     | pseudo-URL ของสื่อขาเข้า |
| `{{MediaPath}}`    | พาธของสื่อในเครื่อง |
| `{{MediaType}}`    | ประเภทสื่อ (image/audio/document/…) |
| `{{Transcript}}`   | transcript ของเสียง |
| `{{Prompt}}`       | media prompt ที่ resolve แล้วสำหรับรายการ CLI |
| `{{MaxChars}}`     | จำนวนอักขระเอาต์พุตสูงสุดที่ resolve แล้วสำหรับรายการ CLI |
| `{{ChatType}}`     | `"direct"` หรือ `"group"` |
| `{{GroupSubject}}` | หัวข้อของกลุ่ม (พยายามให้ได้มากที่สุด) |
| `{{GroupMembers}}` | ตัวอย่างสมาชิกในกลุ่ม (พยายามให้ได้มากที่สุด) |
| `{{SenderName}}`   | ชื่อแสดงผลของผู้ส่ง (พยายามให้ได้มากที่สุด) |
| `{{SenderE164}}`   | หมายเลขโทรศัพท์ของผู้ส่ง (พยายามให้ได้มากที่สุด) |
| `{{Provider}}`     | คำใบ้ของ provider (whatsapp, telegram, discord เป็นต้น) |

---

## การ include config (`$include`)

แยก config ออกเป็นหลายไฟล์:

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

**พฤติกรรมการ merge:**

- ไฟล์เดี่ยว: แทนที่ออบเจ็กต์ที่ครอบอยู่
- อาร์เรย์ของไฟล์: deep-merge ตามลำดับ (ไฟล์หลัง override ไฟล์ก่อน)
- คีย์ข้างเคียง: merge หลังจาก includes (override ค่าที่ include มา)
- nested include: ลึกได้สูงสุด 10 ระดับ
- พาธ: resolve แบบสัมพันธ์กับไฟล์ที่ include แต่ต้องยังอยู่ภายในไดเรกทอรี config ระดับบนสุด (`dirname` ของ `openclaw.json`) รูปแบบ absolute/`../` อนุญาตได้เฉพาะเมื่อยัง resolve อยู่ภายในขอบเขตนั้น
- การเขียนที่ OpenClaw เป็นเจ้าของซึ่งเปลี่ยนเพียงหนึ่ง section ระดับบนสุดที่รองรับด้วย include แบบไฟล์เดียว จะเขียนทะลุไปยังไฟล์ที่ include นั้น ตัวอย่างเช่น `plugins install` จะอัปเดต `plugins: { $include: "./plugins.json5" }` ใน `plugins.json5` และปล่อย `openclaw.json` ไว้เหมือนเดิม
- root include, include array และ include ที่มี sibling override เป็นแบบอ่านอย่างเดียวสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนเหล่านั้นจะ fail closed แทนการ flatten config
- ข้อผิดพลาด: มีข้อความชัดเจนสำหรับไฟล์หาย, parse error และ circular include

---

_ที่เกี่ยวข้อง: [การกำหนดค่า](/th/gateway/configuration) · [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
