---
read_when:
    - คุณต้องการความหมายเชิงการตั้งค่าในระดับฟิลด์หรือค่าเริ่มต้นที่แม่นยำ
    - คุณกำลังตรวจสอบบล็อกการกำหนดค่า channel, model, gateway หรือ tool
summary: เอกสารอ้างอิงการกำหนดค่า Gateway สำหรับคีย์หลักของ OpenClaw ค่าเริ่มต้น และลิงก์ไปยังเอกสารอ้างอิงของระบบย่อยเฉพาะ
title: ข้อมูลอ้างอิงการกำหนดค่า
x-i18n:
    generated_at: "2026-06-27T17:32:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb8ebf55fe7562f00dbd42eb5fd00a7bac95ac934bdb0b778d04bb6926f28102
    source_path: gateway/configuration-reference.md
    workflow: 16
---

ข้อมูลอ้างอิงคอนฟิกหลักสำหรับ `~/.openclaw/openclaw.json` หากต้องการภาพรวมตามงานที่ต้องทำ โปรดดู [การกำหนดค่า](/th/gateway/configuration)

ครอบคลุมพื้นผิวคอนฟิกหลักของ OpenClaw และลิงก์ออกไปเมื่อระบบย่อยมีข้อมูลอ้างอิงเชิงลึกของตัวเอง แคตตาล็อกคำสั่งที่ช่องทางและ Plugin เป็นเจ้าของ รวมถึงตัวเลือกเชิงลึกของหน่วยความจำ/QMD อยู่ในหน้าของตัวเอง ไม่ได้อยู่ในหน้านี้

แหล่งความจริงของโค้ด:

- `openclaw config schema` พิมพ์ JSON Schema สดที่ใช้สำหรับการตรวจสอบความถูกต้องและ Control UI พร้อมรวมเมตาดาตาของบันเดิล/Plugin/ช่องทางเมื่อมี
- `config.schema.lookup` ส่งคืนโหนดสคีมาหนึ่งรายการที่มีขอบเขตตามพาธสำหรับเครื่องมือเจาะลึก
- `pnpm config:docs:check` / `pnpm config:docs:gen` ตรวจสอบแฮชฐานอ้างอิงของเอกสารคอนฟิกเทียบกับพื้นผิวสคีมาปัจจุบัน

พาธค้นหาของเอเจนต์: ใช้แอ็กชันเครื่องมือ `gateway` ชื่อ `config.schema.lookup` สำหรับ
เอกสารและข้อจำกัดระดับฟิลด์ที่แม่นยำก่อนแก้ไข ใช้
[การกำหนดค่า](/th/gateway/configuration) สำหรับคำแนะนำตามงานที่ต้องทำ และหน้านี้
สำหรับแผนที่ฟิลด์ที่กว้างกว่า ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงของระบบย่อย

ข้อมูลอ้างอิงเชิงลึกเฉพาะด้าน:

- [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config) สำหรับ `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` และคอนฟิก Dreaming ใต้ `plugins.entries.memory-core.config.dreaming`
- [คำสั่งสแลช](/th/tools/slash-commands) สำหรับแคตตาล็อกคำสั่งในตัว + บันเดิลปัจจุบัน
- หน้าของช่องทาง/Plugin เจ้าของ สำหรับพื้นผิวคำสั่งเฉพาะช่องทาง

รูปแบบคอนฟิกคือ **JSON5** (อนุญาตคอมเมนต์ + จุลภาคท้ายรายการ) ฟิลด์ทั้งหมดเป็นตัวเลือก - OpenClaw ใช้ค่าเริ่มต้นที่ปลอดภัยเมื่อไม่ได้ระบุ

---

## ช่องทาง

คีย์คอนฟิกต่อช่องทางถูกย้ายไปยังหน้าเฉพาะ - ดู
[การกำหนดค่า - ช่องทาง](/th/gateway/config-channels) สำหรับ `channels.*`
รวมถึง Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และช่องทางบันเดิลอื่นๆ
(การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี, การกำกับการ mention)

## ค่าเริ่มต้นของเอเจนต์, หลายเอเจนต์, เซสชัน และข้อความ

ย้ายไปยังหน้าเฉพาะแล้ว - ดู
[การกำหนดค่า - เอเจนต์](/th/gateway/config-agents) สำหรับ:

- `agents.defaults.*` (พื้นที่ทำงาน, โมเดล, การคิด, Heartbeat, หน่วยความจำ, สื่อ, Skills, sandbox)
- `multiAgent.*` (การกำหนดเส้นทางและการผูกหลายเอเจนต์)
- `session.*` (วงจรชีวิตเซสชัน, Compaction, การตัดแต่ง)
- `messages.*` (การส่งข้อความ, TTS, การเรนเดอร์มาร์กดาวน์)
- `talk.*` (โหมด Talk)
  - `talk.consultThinkingLevel`: การแทนที่ระดับการคิดสำหรับการรันเอเจนต์ OpenClaw เต็มรูปแบบเบื้องหลัง Control UI Talk realtime consults
  - `talk.consultFastMode`: การแทนที่โหมดเร็วแบบครั้งเดียวสำหรับ Control UI Talk realtime consults
  - `talk.speechLocale`: รหัสภาษา BCP 47 แบบเลือกได้สำหรับการรู้จำเสียงพูดของ Talk บน iOS/macOS
  - `talk.silenceTimeoutMs`: เมื่อไม่ได้ตั้งค่า Talk จะคงหน้าต่างหยุดพักเริ่มต้นของแพลตฟอร์มก่อนส่งทรานสคริปต์ (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: การสำรองการส่งต่อของ Gateway สำหรับทรานสคริปต์ realtime Talk ที่สรุปแล้วและข้าม `openclaw_agent_consult`

## เครื่องมือและผู้ให้บริการกำหนดเอง

นโยบายเครื่องมือ, สวิตช์ทดลอง, คอนฟิกเครื่องมือที่มีผู้ให้บริการรองรับ และการตั้งค่า
ผู้ให้บริการกำหนดเอง / base-URL ถูกย้ายไปยังหน้าเฉพาะแล้ว - ดู
[การกำหนดค่า - เครื่องมือและผู้ให้บริการกำหนดเอง](/th/gateway/config-tools)

## โมเดล

คำจำกัดความของผู้ให้บริการ, allowlist ของโมเดล และการตั้งค่าผู้ให้บริการกำหนดเองอยู่ใน
[การกำหนดค่า - เครื่องมือและผู้ให้บริการกำหนดเอง](/th/gateway/config-tools#custom-providers-and-base-urls)
รูท `models` ยังเป็นเจ้าของพฤติกรรมแคตตาล็อกโมเดลส่วนกลางด้วย

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: พฤติกรรมแคตตาล็อกผู้ให้บริการ (`merge` หรือ `replace`)
- `models.providers`: แมปผู้ให้บริการกำหนดเองที่มีคีย์เป็นรหัสผู้ให้บริการ
- `models.providers.*.localService`: ตัวจัดการกระบวนการตามต้องการแบบเลือกได้สำหรับ
  เซิร์ฟเวอร์โมเดลในเครื่อง OpenClaw ตรวจสอบ endpoint สุขภาพที่กำหนดค่าไว้ เริ่ม
  `command` แบบพาธสัมบูรณ์เมื่อจำเป็น รอจนพร้อม แล้วจึงส่งคำขอโมเดล
  ดู [บริการโมเดลในเครื่อง](/th/gateway/local-model-services)
- `models.pricing.enabled`: ควบคุมการบูตสแตรปราคาเบื้องหลังที่
  เริ่มหลังจาก sidecar และช่องทางเข้าสู่พาธพร้อมใช้งานของ Gateway เมื่อเป็น `false`
  Gateway จะข้ามการดึงแคตตาล็อกราคาของ OpenRouter และ LiteLLM; ค่า
  `models.providers.*.models[].cost` ที่กำหนดค่าไว้ยังคงใช้ได้สำหรับการประมาณต้นทุนในเครื่อง

## MCP

คำจำกัดความเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการอยู่ใต้ `mcp.servers` และถูก
ใช้โดย OpenClaw แบบฝังและอะแดปเตอร์รันไทม์อื่นๆ คำสั่ง `openclaw mcp list`,
`show`, `set` และ `unset` จัดการบล็อกนี้โดยไม่เชื่อมต่อกับ
เซิร์ฟเวอร์เป้าหมายระหว่างแก้ไขคอนฟิก

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
        timeout: 20,
        connectTimeout: 5,
        supportsParallelToolCalls: true,
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        auth: "oauth",
        oauth: {
          scope: "docs.read",
        },
        sslVerify: true,
        clientCert: "/path/to/client.crt",
        clientKey: "/path/to/client.key",
        toolFilter: {
          include: ["search_*"],
          exclude: ["admin_*"],
        },
        // Optional Codex app-server projection controls.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: คำจำกัดความเซิร์ฟเวอร์ MCP แบบ stdio หรือรีโมตที่มีชื่อ สำหรับรันไทม์ที่
  เปิดเผยเครื่องมือ MCP ที่กำหนดค่าไว้
  รายการรีโมตใช้ `transport: "streamable-http"` หรือ `transport: "sse"`;
  `type: "http"` เป็นนามแฝงแบบ CLI-native ที่ `openclaw mcp set` และ
  `openclaw doctor --fix` ทำให้เป็นฟิลด์ `transport` มาตรฐาน
- `mcp.servers.<name>.enabled`: ตั้งเป็น `false` เพื่อเก็บคำจำกัดความเซิร์ฟเวอร์ที่บันทึกไว้
  ในขณะที่ยกเว้นออกจากการค้นพบ MCP แบบฝังของ OpenClaw และการฉายเครื่องมือ
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: timeout ของคำขอ MCP ต่อเซิร์ฟเวอร์
  เป็นวินาทีหรือมิลลิวินาที
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: timeout การเชื่อมต่อต่อเซิร์ฟเวอร์
  เป็นวินาทีหรือมิลลิวินาที
- `mcp.servers.<name>.supportsParallelToolCalls`: คำใบ้การทำงานพร้อมกันแบบเลือกได้สำหรับ
  อะแดปเตอร์ที่เลือกได้ว่าจะเรียกเครื่องมือ MCP แบบขนานหรือไม่
- `mcp.servers.<name>.auth`: ตั้งเป็น `"oauth"` สำหรับเซิร์ฟเวอร์ HTTP MCP ที่ต้องใช้
  OAuth รัน `openclaw mcp login <name>` เพื่อเก็บโทเคนไว้ใต้สถานะ OpenClaw
- `mcp.servers.<name>.oauth`: การแทนที่ scope ของ OAuth, URL redirect และ URL
  เมตาดาตาไคลเอนต์แบบเลือกได้
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: ตัวควบคุม HTTP TLS
  สำหรับ endpoint ส่วนตัวและ mutual TLS
- `mcp.servers.<name>.toolFilter`: การเลือกเครื่องมือต่อเซิร์ฟเวอร์แบบเลือกได้ `include`
  จำกัดเครื่องมือ MCP ที่ค้นพบให้เหลือเฉพาะชื่อที่ตรงกัน; `exclude` ซ่อนชื่อที่ตรงกัน
  รายการเป็นชื่อเครื่องมือ MCP แบบตรงตัวหรือ glob `*` แบบง่าย เซิร์ฟเวอร์ที่มี
  resources หรือ prompts ยังสร้างชื่อเครื่องมืออรรถประโยชน์ (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`) และชื่อเหล่านั้นใช้
  ตัวกรองเดียวกัน
- `mcp.servers.<name>.codex`: ตัวควบคุมการฉาย Codex app-server แบบเลือกได้
  บล็อกนี้เป็นเมตาดาตา OpenClaw สำหรับเธรด Codex app-server เท่านั้น; ไม่ได้
  ส่งผลต่อเซสชัน ACP, คอนฟิก Codex harness ทั่วไป หรืออะแดปเตอร์รันไทม์อื่นๆ
  `codex.agents` ที่ไม่ว่างจะจำกัดเซิร์ฟเวอร์ให้กับรหัสเอเจนต์ OpenClaw ที่ระบุไว้
  รายการเอเจนต์ที่มีขอบเขตว่าง เปล่า หรือไม่ถูกต้องจะถูกปฏิเสธโดยการตรวจสอบคอนฟิก
  และถูกละเว้นโดยพาธการฉายของรันไทม์ แทนที่จะกลายเป็นแบบทั่วโลก
  `codex.defaultToolsApprovalMode` ส่งออก
  `default_tools_approval_mode` ของ Codex สำหรับเซิร์ฟเวอร์นั้น OpenClaw ตัดบล็อก `codex`
  ออกก่อนส่งคอนฟิก `mcp_servers` แบบเนทีฟให้ Codex ละเว้นบล็อกนี้เพื่อ
  ให้เซิร์ฟเวอร์ถูกฉายสำหรับทุกเอเจนต์ Codex app-server ด้วยพฤติกรรมการอนุมัติ MCP
  เริ่มต้นของ Codex
- `mcp.sessionIdleTtlMs`: TTL เมื่อไม่ได้ใช้งานสำหรับรันไทม์ MCP แบบบันเดิลที่มีขอบเขตเซสชัน
  การรันแบบฝังครั้งเดียวจะขอการล้างข้อมูลเมื่อจบการรัน; TTL นี้เป็นตัวสำรองสำหรับ
  เซสชันที่มีอายุยาวและผู้เรียกในอนาคต
- การเปลี่ยนแปลงใต้ `mcp.*` นำไปใช้ทันทีโดย dispose รันไทม์ MCP ของเซสชันที่แคชไว้
  การค้นพบ/ใช้เครื่องมือครั้งถัดไปจะสร้างใหม่จากคอนฟิกใหม่ ดังนั้นรายการ
  `mcp.servers` ที่ถูกลบจะถูกเก็บกวาดทันที แทนที่จะรอ TTL เมื่อไม่ได้ใช้งาน
- การค้นพบของรันไทม์ยังเคารพการแจ้งเตือนการเปลี่ยนแปลงรายการเครื่องมือ MCP โดยทิ้ง
  แคตตาล็อกที่แคชไว้สำหรับเซสชันนั้น เซิร์ฟเวอร์ที่ประกาศ resources หรือ
  prompts จะได้รับเครื่องมืออรรถประโยชน์สำหรับแสดงรายการ/อ่าน resources และแสดงรายการ/ดึง
  prompts ความล้มเหลวของการเรียกเครื่องมือซ้ำๆ จะพักเซิร์ฟเวอร์ที่ได้รับผลกระทบชั่วคราวก่อน
  พยายามเรียกอีกครั้ง

ดู [MCP](/th/cli/mcp#openclaw-as-an-mcp-client-registry) และ
[แบ็กเอนด์ CLI](/th/gateway/cli-backends#bundle-mcp-overlays) สำหรับพฤติกรรมรันไทม์

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
    workshop: {
      allowSymlinkTargetWrites: false,
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

- `allowBundled`: allowlist แบบเลือกได้สำหรับ Skills แบบบันเดิลเท่านั้น (Skills ที่จัดการ/ในพื้นที่ทำงานไม่ได้รับผลกระทบ)
- `load.extraDirs`: รูท Skills ที่ใช้ร่วมกันเพิ่มเติม (ลำดับความสำคัญต่ำสุด)
- `load.allowSymlinkTargets`: รูทเป้าหมายจริงที่เชื่อถือได้ ซึ่ง symlink ของ Skills อาจ
  resolve เข้าไปได้เมื่อลิงก์อยู่นอกรูทแหล่งที่มาที่กำหนดค่าไว้
- `workshop.allowSymlinkTargetWrites`: อนุญาตให้ Skill Workshop apply เขียน
  ผ่านเป้าหมาย symlink ที่เชื่อถือแล้ว (ค่าเริ่มต้น: false)
- `install.preferBrew`: เมื่อเป็น true ให้เลือกตัวติดตั้ง Homebrew ก่อนเมื่อมี `brew`
  แล้วจึง fallback ไปยังชนิดตัวติดตั้งอื่น
- `install.nodeManager`: ค่ากำหนดตัวติดตั้ง Node สำหรับสเปก `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`)
- `install.allowUploadedArchives`: อนุญาตให้ไคลเอนต์ Gateway ที่เชื่อถือได้ระดับ `operator.admin`
  ติดตั้ง zip archive ส่วนตัวที่ staging ผ่าน `skills.upload.*`
  (ค่าเริ่มต้น: false) สิ่งนี้เปิดใช้เฉพาะพาธ uploaded-archive; การติดตั้ง ClawHub
  ตามปกติไม่ต้องใช้
- `entries.<skillKey>.enabled: false` ปิดใช้งาน Skill แม้ว่าจะบันเดิล/ติดตั้งแล้วก็ตาม
- `entries.<skillKey>.apiKey`: ทางลัดสำหรับ Skills ที่ประกาศ env var หลัก (สตริง plaintext หรือออบเจกต์ SecretRef)

---

## Plugin

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

- โหลดจากแพ็กเกจหรือไดเรกทอรีบันเดิลภายใต้ `~/.openclaw/extensions` และ `<workspace>/.openclaw/extensions` รวมถึงไฟล์หรือไดเรกทอรีที่ระบุใน `plugins.load.paths`
- วางไฟล์ plugin แบบสแตนด์อโลนไว้ใน `plugins.load.paths`; รากส่วนขยายที่ค้นพบอัตโนมัติจะละเว้นไฟล์ `.js`, `.mjs` และ `.ts` ระดับบนสุด เพื่อไม่ให้สคริปต์ช่วยเหลือในรากเหล่านั้นขัดขวางการเริ่มต้น
- การค้นพบรองรับ OpenClaw plugins แบบเนทีฟ รวมถึง Codex bundles และ Claude bundles ที่เข้ากันได้ รวมถึง Claude default-layout bundles ที่ไม่มี manifest
- **การเปลี่ยนแปลง config ต้อง restart gateway**
- `allow`: allowlist แบบไม่บังคับ (โหลดเฉพาะ plugins ที่ระบุ) `deny` มีลำดับความสำคัญเหนือกว่า
- `plugins.entries.<id>.apiKey`: ฟิลด์อำนวยความสะดวกระดับ plugin สำหรับ API key (เมื่อ plugin รองรับ)
- `plugins.entries.<id>.env`: แมป env var ที่จำกัดขอบเขตตาม plugin
- `plugins.entries.<id>.hooks.allowPromptInjection`: เมื่อเป็น `false` core จะบล็อก `before_prompt_build` และละเว้นฟิลด์ที่แก้ไข prompt จาก `before_agent_start` แบบ legacy ขณะยังคงรักษา `modelOverride` และ `providerOverride` แบบ legacy ไว้ ใช้กับ native plugin hooks และไดเรกทอรี hook ที่มาจาก bundle ซึ่งรองรับ
- `plugins.entries.<id>.hooks.allowConversationAccess`: เมื่อเป็น `true` plugins ที่เชื่อถือได้และไม่ใช่ bundled อาจอ่านข้อความสนทนาดิบจาก typed hooks เช่น `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` และ `agent_end`
- `plugins.entries.<id>.subagent.allowModelOverride`: เชื่อถือ plugin นี้อย่างชัดเจนให้ร้องขอการ override `provider` และ `model` ต่อ run สำหรับ background subagent runs
- `plugins.entries.<id>.subagent.allowedModels`: allowlist แบบไม่บังคับของเป้าหมาย `provider/model` แบบ canonical สำหรับ subagent overrides ที่เชื่อถือได้ ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาตให้ใช้ model ใดก็ได้
- `plugins.entries.<id>.llm.allowModelOverride`: เชื่อถือ plugin นี้อย่างชัดเจนให้ร้องขอ model overrides สำหรับ `api.runtime.llm.complete`
- `plugins.entries.<id>.llm.allowedModels`: allowlist แบบไม่บังคับของเป้าหมาย `provider/model` แบบ canonical สำหรับ plugin LLM completion overrides ที่เชื่อถือได้ ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาตให้ใช้ model ใดก็ได้
- `plugins.entries.<id>.llm.allowAgentIdOverride`: เชื่อถือ plugin นี้อย่างชัดเจนให้ run `api.runtime.llm.complete` กับ agent id ที่ไม่ใช่ค่าเริ่มต้น
- `plugins.entries.<id>.config`: ออบเจ็กต์ config ที่ plugin กำหนด (ตรวจสอบความถูกต้องด้วย schema ของ native OpenClaw plugin เมื่อมี)
- การตั้งค่าบัญชี/runtime ของ channel plugin อยู่ภายใต้ `channels.<id>` และควรถูกอธิบายโดย metadata `channelConfigs` ใน manifest ของ plugin เจ้าของ ไม่ใช่โดย registry ตัวเลือก OpenClaw ส่วนกลาง

### Config ของ Codex harness plugin

Plugin `codex` ที่ bundled เป็นเจ้าของการตั้งค่า native Codex app-server harness ภายใต้
`plugins.entries.codex.config` ดู
[ข้อมูลอ้างอิง Codex harness](/th/plugins/codex-harness-reference) สำหรับพื้นผิว config ทั้งหมด
และ [Codex harness](/th/plugins/codex-harness) สำหรับ runtime model

`codexPlugins` ใช้เฉพาะกับ sessions ที่เลือก native Codex harness
ไม่เปิดใช้งาน Codex plugins สำหรับ OpenClaw provider runs, ACP
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

- `plugins.entries.codex.config.codexPlugins.enabled`: เปิดใช้งานการรองรับ
  plugin/app แบบ native Codex สำหรับ Codex harness ค่าเริ่มต้น: `false`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  นโยบาย destructive-action เริ่มต้นสำหรับ plugin app elicitations ที่ migrate แล้ว
  ใช้ `true` เพื่อยอมรับ safe Codex approval schemas โดยไม่ถาม, `false`
  เพื่อปฏิเสธ, `"auto"` เพื่อส่งต่อ approvals ที่ Codex ต้องการผ่าน OpenClaw
  plugin approvals หรือ `"always"` เพื่อถามทุกการเขียน/destructive
  action ของ plugin โดยไม่มี durable approval โหมด `"always"` จะล้าง durable Codex
  per-tool approval overrides สำหรับ app ที่ได้รับผลกระทบก่อนเริ่ม thread
  ค่าเริ่มต้น: `true`
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: เปิดใช้งาน
  รายการ plugin ที่ migrate แล้ว เมื่อ global `codexPlugins.enabled` เป็น true ด้วย
  ค่าเริ่มต้น: `true` สำหรับรายการที่ระบุอย่างชัดเจน
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  ตัวตน marketplace ที่เสถียร V1 รองรับเฉพาะ `"openai-curated"`
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: ตัวตน
  Codex plugin ที่เสถียรจาก migration เช่น `"google-calendar"`
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  destructive-action override ต่อ plugin เมื่อเว้นไว้ จะใช้ค่า global
  `allow_destructive_actions` ค่าแบบต่อ plugin รองรับนโยบาย
  `true`, `false`, `"auto"` หรือ `"always"` เช่นเดียวกัน

`codexPlugins.enabled` คือคำสั่งเปิดใช้งานแบบ global รายการ plugin
ที่ migration เขียนไว้อย่างชัดเจนคือชุด durable install และสิทธิ์การ repair
ไม่รองรับ `plugins["*"]` ไม่มีสวิตช์ `install` และค่า local
`marketplacePath` ไม่ได้เป็นฟิลด์ config โดยตั้งใจ เพราะเป็นค่าเฉพาะ host

การตรวจ readiness ของ `app/list` ถูก cache ไว้หนึ่งชั่วโมงและ refresh
แบบ asynchronous เมื่อ stale config ของ Codex thread app ถูกคำนวณตอนสร้าง
session ของ Codex harness ไม่ใช่ทุก turn; ใช้ `/new`, `/reset` หรือ restart
gateway หลังเปลี่ยน native plugin config

- `plugins.entries.firecrawl.config.webFetch`: การตั้งค่า provider web-fetch ของ Firecrawl
  - `apiKey`: Firecrawl API key แบบไม่บังคับสำหรับ limit ที่สูงขึ้น (รับ SecretRef) fallback ไปที่ `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey` หรือ env var `FIRECRAWL_API_KEY`
  - `baseUrl`: URL ฐานของ Firecrawl API (ค่าเริ่มต้น: `https://api.firecrawl.dev`; overrides แบบ self-hosted ต้องชี้ไปยัง endpoint ส่วนตัว/ภายใน)
  - `onlyMainContent`: ดึงเฉพาะเนื้อหาหลักจากหน้า (ค่าเริ่มต้น: `true`)
  - `maxAgeMs`: อายุ cache สูงสุดเป็นมิลลิวินาที (ค่าเริ่มต้น: `172800000` / 2 วัน)
  - `timeoutSeconds`: timeout ของคำขอ scrape เป็นวินาที (ค่าเริ่มต้น: `60`)
- `plugins.entries.xai.config.xSearch`: การตั้งค่า xAI X Search (Grok web search)
  - `enabled`: เปิดใช้งาน X Search provider
  - `model`: Grok model ที่ใช้สำหรับ search (เช่น `"grok-4-1-fast"`)
- `plugins.entries.memory-core.config.dreaming`: การตั้งค่า memory dreaming ดู [Dreaming](/th/concepts/dreaming) สำหรับ phases และ thresholds
  - `enabled`: สวิตช์หลักของ dreaming (ค่าเริ่มต้น `false`)
  - `frequency`: จังหวะ cron สำหรับ dreaming sweep แบบเต็มแต่ละครั้ง (ค่าเริ่มต้นคือ `"0 3 * * *"`)
  - `model`: Dream Diary subagent model override แบบไม่บังคับ ต้องใช้ `plugins.entries.memory-core.subagent.allowModelOverride: true`; จับคู่กับ `allowedModels` เพื่อจำกัดเป้าหมาย ข้อผิดพลาด model-unavailable จะ retry หนึ่งครั้งด้วย model เริ่มต้นของ session; trust หรือ allowlist failures จะไม่ fallback แบบเงียบๆ
  - นโยบาย phase และ thresholds เป็นรายละเอียดการ implement (ไม่ใช่ config keys ที่แสดงต่อผู้ใช้)
- Config memory แบบเต็มอยู่ใน [ข้อมูลอ้างอิงการตั้งค่า Memory](/th/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Claude bundle plugins ที่เปิดใช้งานแล้วยังสามารถเพิ่มค่าเริ่มต้น OpenClaw แบบ embedded จาก `settings.json` ได้ด้วย; OpenClaw ใช้ค่าเหล่านั้นเป็นการตั้งค่า agent ที่ sanitize แล้ว ไม่ใช่ raw OpenClaw config patches
- `plugins.slots.memory`: เลือก active memory plugin id หรือ `"none"` เพื่อปิดใช้งาน memory plugins
- `plugins.slots.contextEngine`: เลือก active context engine plugin id; ค่าเริ่มต้นเป็น `"legacy"` เว้นแต่คุณติดตั้งและเลือก engine อื่น

ดู [Plugins](/th/tools/plugin)

---

## Commitments

`commitments` ควบคุม follow-up memory ที่อนุมาน: OpenClaw สามารถตรวจพบ check-ins จาก conversation turns และส่งผ่าน heartbeat runs

- `commitments.enabled`: เปิดใช้งานการดึงข้อมูลด้วย LLM แบบซ่อน การจัดเก็บ และการส่งผ่าน heartbeat สำหรับ inferred follow-up commitments ค่าเริ่มต้น: `false`
- `commitments.maxPerDay`: จำนวน inferred follow-up commitments สูงสุดที่ส่งต่อ agent session ในหนึ่งวันแบบ rolling ค่าเริ่มต้น: `3`

ดู [Inferred commitments](/th/concepts/commitments)

---

## Browser

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

- `evaluateEnabled: false` ปิดใช้งาน `act:evaluate` และ `wait --fn`.
- `tabCleanup` เรียกคืนแท็บตัวแทนหลักที่ติดตามไว้หลังจากไม่ได้ใช้งานเป็นระยะเวลาหนึ่ง หรือเมื่อ
  เซสชันเกินขีดจำกัดของตน ตั้งค่า `idleMinutes: 0` หรือ `maxTabsPerSession: 0` เพื่อ
  ปิดใช้งานโหมดล้างข้อมูลแต่ละโหมดเหล่านั้น
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` จะถูกปิดใช้งานเมื่อไม่ได้ตั้งค่า ดังนั้นการนำทางของเบราว์เซอร์จึงเข้มงวดตามค่าเริ่มต้น
- ตั้งค่า `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เฉพาะเมื่อคุณตั้งใจเชื่อถือการนำทางเบราว์เซอร์ผ่านเครือข่ายส่วนตัว
- ในโหมดเข้มงวด endpoint โปรไฟล์ CDP ระยะไกล (`profiles.*.cdpUrl`) จะอยู่ภายใต้การบล็อกเครือข่ายส่วนตัวแบบเดียวกันระหว่างการตรวจสอบการเข้าถึง/การค้นพบ
- `ssrfPolicy.allowPrivateNetwork` ยังคงรองรับในฐานะ alias แบบเดิม
- ในโหมดเข้มงวด ให้ใช้ `ssrfPolicy.hostnameAllowlist` และ `ssrfPolicy.allowedHostnames` สำหรับข้อยกเว้นที่ระบุอย่างชัดเจน
- โปรไฟล์ระยะไกลเป็นแบบแนบเท่านั้น (ปิดใช้งาน start/stop/reset)
- `profiles.*.cdpUrl` รองรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) เมื่อคุณต้องการให้ OpenClaw ค้นพบ `/json/version`; ใช้ WS(S)
  เมื่อผู้ให้บริการของคุณให้ URL ของ DevTools WebSocket โดยตรง
- `remoteCdpTimeoutMs` และ `remoteCdpHandshakeTimeoutMs` ใช้กับการเข้าถึง CDP ระยะไกลและ
  `attachOnly` รวมถึงคำขอเปิดแท็บ โปรไฟล์ local loopback ที่จัดการอยู่
  จะใช้ค่าเริ่มต้น CDP แบบโลคัลต่อไป
- หากบริการ CDP ที่จัดการภายนอกเข้าถึงได้ผ่าน loopback ให้ตั้งค่า
  `attachOnly: true` ของโปรไฟล์นั้น มิฉะนั้น OpenClaw จะถือว่าพอร์ต loopback เป็น
  โปรไฟล์เบราว์เซอร์โลคัลที่จัดการอยู่ และอาจรายงานข้อผิดพลาดความเป็นเจ้าของพอร์ตโลคัล
- โปรไฟล์ `existing-session` ใช้ Chrome MCP แทน CDP และสามารถแนบกับ
  โฮสต์ที่เลือกหรือผ่านโหนดเบราว์เซอร์ที่เชื่อมต่ออยู่
- โปรไฟล์ `existing-session` สามารถตั้งค่า `userDataDir` เพื่อระบุเป้าหมายเป็น
  โปรไฟล์เบราว์เซอร์ที่ใช้ Chromium เฉพาะ เช่น Brave หรือ Edge
- โปรไฟล์ `existing-session` สามารถตั้งค่า `cdpUrl` เมื่อ Chrome กำลังทำงานอยู่แล้ว
  อยู่เบื้องหลัง endpoint การค้นพบ DevTools HTTP(S) หรือ endpoint WS(S) โดยตรง ใน
  โหมดนั้น OpenClaw จะส่ง endpoint ให้ Chrome MCP แทนการใช้การเชื่อมต่ออัตโนมัติ;
  `userDataDir` จะถูกละเว้นสำหรับอาร์กิวเมนต์การเปิด Chrome MCP
- โปรไฟล์ `existing-session` ยังคงใช้ขีดจำกัดเส้นทาง Chrome MCP ปัจจุบัน:
  การกระทำที่ขับเคลื่อนด้วย snapshot/ref แทนการระบุเป้าหมายด้วย CSS-selector, ฮุกอัปโหลด
  ไฟล์เดียว, ไม่มีการ override timeout ของ dialog, ไม่มี `wait --load networkidle` และไม่มี
  `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด หรือการกระทำแบบชุด
- โปรไฟล์ `openclaw` โลคัลที่จัดการอยู่จะกำหนด `cdpPort` และ `cdpUrl` โดยอัตโนมัติ; ตั้งค่า
  `cdpUrl` อย่างชัดเจนเฉพาะสำหรับโปรไฟล์ CDP ระยะไกลหรือการแนบ endpoint ของ existing-session
- โปรไฟล์โลคัลที่จัดการอยู่สามารถตั้งค่า `executablePath` เพื่อแทนที่ค่า
  `browser.executablePath` ส่วนกลางสำหรับโปรไฟล์นั้น ใช้สิ่งนี้เพื่อเรียกใช้โปรไฟล์หนึ่งใน
  Chrome และอีกโปรไฟล์ใน Brave
- โปรไฟล์โลคัลที่จัดการอยู่ใช้ `browser.localLaunchTimeoutMs` สำหรับการค้นพบ HTTP ของ Chrome CDP
  หลังจากเริ่มโปรเซส และใช้ `browser.localCdpReadyTimeoutMs` สำหรับ
  ความพร้อมของ websocket CDP หลังการเปิด เพิ่มค่านี้บนโฮสต์ที่ช้ากว่า ซึ่ง Chrome
  เริ่มได้สำเร็จแต่การตรวจสอบความพร้อมแข่งกับช่วงเริ่มต้น ทั้งสองค่าต้องเป็น
  จำนวนเต็มบวกไม่เกิน `120000` ms; ค่าคอนฟิกที่ไม่ถูกต้องจะถูกปฏิเสธ
- ลำดับการตรวจจับอัตโนมัติ: เบราว์เซอร์เริ่มต้นหากใช้ Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary
- ทั้ง `browser.executablePath` และ `browser.profiles.<name>.executablePath`
  รองรับ `~` และ `~/...` สำหรับไดเรกทอรี home ของ OS ก่อนเปิด Chromium
  `userDataDir` รายโปรไฟล์บนโปรไฟล์ `existing-session` จะถูกขยาย tilde ด้วยเช่นกัน
- บริการควบคุม: loopback เท่านั้น (พอร์ตมาจาก `gateway.port`, ค่าเริ่มต้น `18791`)
- `extraArgs` เพิ่มแฟล็กการเปิดเพิ่มเติมให้กับการเริ่มต้น Chromium โลคัล (เช่น
  `--disable-gpu`, การกำหนดขนาดหน้าต่าง หรือแฟล็ก debug)

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

- `seamColor`: สีเน้นสำหรับโครม UI ของแอปเนทีฟ (สีอ่อนของฟอง Talk Mode เป็นต้น)
- `assistant`: การ override ตัวตนของ Control UI จะถอยกลับไปใช้ตัวตนของตัวแทนที่ใช้งานอยู่

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
      url: "ws://127.0.0.1:18789",
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
      // Remove tools from the default HTTP deny list for owner/admin callers
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

- `mode`: `local` (รัน gateway) หรือ `remote` (เชื่อมต่อไปยัง remote gateway). Gateway จะปฏิเสธการเริ่มทำงานเว้นแต่จะเป็น `local`.
- `port`: พอร์ตเดียวแบบ multiplexed สำหรับ WS + HTTP. ลำดับความสำคัญ: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (ค่าเริ่มต้น), `lan` (`0.0.0.0`), `tailnet` (Tailscale IP เท่านั้น), หรือ `custom`.
- **นามแฝง bind เดิม**: ใช้ค่าโหมด bind ใน `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`) ไม่ใช่นามแฝง host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **หมายเหตุ Docker**: bind ค่าเริ่มต้น `loopback` จะ listen ที่ `127.0.0.1` ภายในคอนเทนเนอร์ เมื่อใช้ Docker bridge networking (`-p 18789:18789`) ทราฟฟิกจะเข้ามาที่ `eth0` ทำให้เข้าถึง gateway ไม่ได้ ใช้ `--network host` หรือตั้งค่า `bind: "lan"` (หรือ `bind: "custom"` พร้อม `customBindHost: "0.0.0.0"`) เพื่อ listen บนทุกอินเทอร์เฟซ.
- **Auth**: จำเป็นโดยค่าเริ่มต้น bind ที่ไม่ใช่ loopback ต้องใช้ gateway auth ในทางปฏิบัติหมายถึง token/password ที่ใช้ร่วมกัน หรือ identity-aware reverse proxy พร้อม `gateway.auth.mode: "trusted-proxy"` onboarding wizard จะสร้าง token เป็นค่าเริ่มต้น.
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) ให้ตั้งค่า `gateway.auth.mode` อย่างชัดเจนเป็น `token` หรือ `password` ขั้นตอน startup และการติดตั้ง/ซ่อมแซม service จะล้มเหลวเมื่อกำหนดค่าทั้งสองรายการและไม่ได้ตั้ง mode.
- `gateway.auth.mode: "none"`: โหมดไม่มี auth แบบชัดเจน ใช้เฉพาะกับการตั้งค่า local loopback ที่เชื่อถือได้เท่านั้น โดยตั้งใจไม่เสนอใน onboarding prompts.
- `gateway.auth.mode: "trusted-proxy"`: มอบหมาย browser/user auth ให้ identity-aware reverse proxy และเชื่อถือ identity headers จาก `gateway.trustedProxies` (ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth)) โหมดนี้คาดหวัง proxy source ที่ **ไม่ใช่ loopback** โดยค่าเริ่มต้น; reverse proxies แบบ same-host loopback ต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน caller ภายใน same-host สามารถใช้ `gateway.auth.password` เป็น local direct fallback ได้; `gateway.auth.token` ยังคงใช้ร่วมกับ trusted-proxy mode ไม่ได้.
- `gateway.auth.allowTailscale`: เมื่อเป็น `true`, Tailscale Serve identity headers สามารถผ่าน Control UI/WebSocket auth ได้ (ตรวจสอบผ่าน `tailscale whois`) HTTP API endpoints จะ **ไม่** ใช้ Tailscale header auth นี้ แต่จะใช้ HTTP auth mode ปกติของ gateway แทน flow แบบไม่ใช้ token นี้ถือว่า gateway host เชื่อถือได้ ค่าเริ่มต้นเป็น `true` เมื่อ `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: ตัวจำกัด failed-auth แบบเลือกใช้ได้ ใช้ต่อ client IP และต่อ auth scope (shared-secret และ device-token ถูกติดตามแยกกัน) ความพยายามที่ถูกบล็อกจะส่งคืน `429` + `Retry-After`.
  - บน path async Tailscale Serve Control UI ความพยายามที่ล้มเหลวสำหรับ `{scope, clientIp}` เดียวกันจะถูก serialize ก่อนเขียน failure ดังนั้นความพยายามที่ผิดพลาดพร้อมกันจาก client เดียวกันอาจทำให้ limiter ทำงานที่คำขอที่สอง แทนที่ทั้งคู่จะแข่งกันผ่านไปเป็นเพียง mismatches.
  - `gateway.auth.rateLimit.exemptLoopback` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เมื่อคุณตั้งใจให้ทราฟฟิก localhost ถูก rate-limit ด้วย (สำหรับ test setups หรือ proxy deployments ที่เข้มงวด).
- ความพยายาม WS auth จาก browser-origin จะถูก throttle เสมอโดยปิดการยกเว้น loopback (defense-in-depth ต่อการ brute force localhost จาก browser).
- บน loopback lockouts จาก browser-origin เหล่านั้นจะแยกตามค่า `Origin`
  ที่ normalize แล้ว ดังนั้นการล้มเหลวซ้ำจาก localhost origin หนึ่งจะไม่
  lock out origin อื่นโดยอัตโนมัติ.
- `tailscale.mode`: `serve` (tailnet เท่านั้น, loopback bind) หรือ `funnel` (สาธารณะ, ต้องใช้ auth).
- `tailscale.serviceName`: ชื่อ Tailscale Service แบบเลือกใช้ได้สำหรับ Serve mode เช่น
  `svc:openclaw` เมื่อตั้งค่าแล้ว OpenClaw จะส่งต่อไปยัง `tailscale serve
--service` เพื่อให้ Control UI เปิดเผยผ่าน Service ที่มีชื่อ แทน
  hostname ของอุปกรณ์ ค่าต้องใช้รูปแบบชื่อ Service `svc:<dns-label>`
  ของ Tailscale; startup จะรายงาน Service URL ที่ได้มา.
- `tailscale.preserveFunnel`: เมื่อเป็น `true` และ `tailscale.mode = "serve"`, OpenClaw
  จะตรวจสอบ `tailscale funnel status` ก่อนใช้ Serve ซ้ำตอน startup และข้าม
  หาก Funnel route ที่กำหนดค่าจากภายนอกครอบคลุมพอร์ต gateway อยู่แล้ว
  ค่าเริ่มต้น `false`.
- `controlUi.allowedOrigins`: allowlist ของ browser-origin แบบชัดเจนสำหรับการเชื่อมต่อ Gateway WebSocket จำเป็นสำหรับ browser origins สาธารณะที่ไม่ใช่ loopback การโหลด UI แบบ private same-origin LAN/Tailnet จาก loopback, RFC1918/link-local, `.local`, `.ts.net`, หรือ Tailscale CGNAT hosts จะถูกยอมรับโดยไม่ต้องเปิด Host-header fallback.
- `controlUi.chatMessageMaxWidth`: max-width แบบเลือกใช้ได้สำหรับข้อความแชท Control UI ที่จัดกลุ่ม ยอมรับค่า CSS width ที่มีข้อจำกัด เช่น `960px`, `82%`, `min(1280px, 82%)`, และ `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: โหมดอันตรายที่เปิด Host-header origin fallback สำหรับ deployments ที่ตั้งใจพึ่งพา Host-header origin policy.
- `remote.transport`: `ssh` (ค่าเริ่มต้น) หรือ `direct` (ws/wss). สำหรับ `direct`, `remote.url` ต้องเป็น `wss://` สำหรับ hosts สาธารณะ; plaintext `ws://` จะยอมรับเฉพาะสำหรับ loopback, LAN, link-local, `.local`, `.ts.net`, และ Tailscale CGNAT hosts.
- `remote.remotePort`: พอร์ต gateway บน remote SSH host ค่าเริ่มต้นคือ `18789`; ใช้ค่านี้เมื่อพอร์ต tunnel ภายในเครื่องแตกต่างจากพอร์ต remote gateway.
- `gateway.remote.token` / `.password` เป็นฟิลด์ credential ของ remote-client ไม่ได้กำหนดค่า gateway auth ด้วยตัวเอง.
- `gateway.push.apns.relay.baseUrl`: base HTTPS URL สำหรับ APNs relay ภายนอกที่ใช้หลังจาก relay-backed iOS builds เผยแพร่ registrations ไปยัง gateway Public App Store/TestFlight builds ใช้ OpenClaw relay ที่ hosted ไว้ Custom relay URLs ต้องตรงกับ iOS build/deployment path ที่แยกไว้อย่างตั้งใจ ซึ่ง relay URL ชี้ไปยัง relay นั้น.
- `gateway.push.apns.relay.timeoutMs`: timeout การส่งจาก gateway ไปยัง relay เป็นมิลลิวินาที ค่าเริ่มต้นคือ `10000`.
- Relay-backed registrations ถูกมอบหมายให้ gateway identity เฉพาะ iOS app ที่จับคู่กันจะ fetch `gateway.identity.get`, รวม identity นั้นใน relay registration, และ forward registration-scoped send grant ไปยัง gateway gateway อื่นไม่สามารถใช้ registration ที่เก็บไว้นั้นซ้ำได้.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: env overrides ชั่วคราวสำหรับ relay config ข้างต้น.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch สำหรับ development เท่านั้นสำหรับ loopback HTTP relay URLs Production relay URLs ควรอยู่บน HTTPS.
- `gateway.handshakeTimeoutMs`: pre-auth Gateway WebSocket handshake timeout เป็นมิลลิวินาที ค่าเริ่มต้น: `15000` `OPENCLAW_HANDSHAKE_TIMEOUT_MS` มีลำดับความสำคัญเมื่อถูกตั้งค่า เพิ่มค่านี้บน hosts ที่โหลดสูงหรือพลังงานต่ำ ซึ่ง local clients สามารถเชื่อมต่อได้ขณะที่ startup warmup ยังนิ่งตัวไม่เสร็จ.
- `gateway.channelHealthCheckMinutes`: ช่วงเวลา health-monitor ของ channel เป็นนาที ตั้ง `0` เพื่อปิด health-monitor restarts ทั้งระบบ ค่าเริ่มต้น: `5`.
- `gateway.channelStaleEventThresholdMinutes`: threshold ของ stale-socket เป็นนาที ให้ค่านี้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes` ค่าเริ่มต้น: `30`.
- `gateway.channelMaxRestartsPerHour`: จำนวน health-monitor restarts สูงสุดต่อ channel/account ใน rolling hour ค่าเริ่มต้น: `10`.
- `channels.<provider>.healthMonitor.enabled`: การ opt-out ราย channel สำหรับ health-monitor restarts โดยยังคงเปิด global monitor ไว้.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override ราย account สำหรับ channels แบบหลาย account เมื่อตั้งค่าแล้ว จะมีลำดับความสำคัญเหนือ override ระดับ channel.
- path การเรียก gateway ภายในเครื่องสามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`.
- หาก `gateway.auth.token` / `gateway.auth.password` ถูกกำหนดค่าอย่างชัดเจนผ่าน SecretRef และ resolve ไม่ได้ การ resolve จะ fail closed (ไม่มี remote fallback มาบัง).
- `trustedProxies`: IP ของ reverse proxy ที่ terminate TLS หรือ inject forwarded-client headers ระบุเฉพาะ proxies ที่คุณควบคุม รายการ loopback ยังคงใช้ได้สำหรับ same-host proxy/local-detection setups (เช่น Tailscale Serve หรือ local reverse proxy) แต่รายการเหล่านี้ **ไม่** ทำให้ loopback requests มีสิทธิ์ใช้ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: เมื่อเป็น `true`, gateway จะยอมรับ `X-Real-IP` หากไม่มี `X-Forwarded-For` ค่าเริ่มต้น `false` เพื่อพฤติกรรมแบบ fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: CIDR/IP allowlist แบบเลือกใช้ได้สำหรับ auto-approving การ pair อุปกรณ์ node ครั้งแรกโดยไม่มี scopes ที่ร้องขอ จะถูกปิดเมื่อไม่ได้ตั้งค่า สิ่งนี้ไม่ auto-approve operator/browser/Control UI/WebChat pairing และไม่ auto-approve การอัปเกรด role, scope, metadata, หรือ public-key.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: การ shaping แบบ global allow/deny สำหรับคำสั่ง node ที่ประกาศ หลังจาก pairing และการประเมิน platform allowlist ใช้ `allowCommands` เพื่อ opt into คำสั่ง node อันตราย เช่น `camera.snap`, `camera.clip`, และ `screen.record`; `denyCommands` จะลบคำสั่งแม้ platform default หรือ explicit allow จะรวมคำสั่งนั้นไว้ หลังจาก node เปลี่ยนรายการคำสั่งที่ประกาศ ให้ reject และ re-approve device pairing นั้นเพื่อให้ gateway เก็บ command snapshot ที่อัปเดต.
- `gateway.tools.deny`: ชื่อ tool เพิ่มเติมที่ถูกบล็อกสำหรับ HTTP `POST /tools/invoke` (ขยาย default deny list).
- `gateway.tools.allow`: ลบชื่อ tool ออกจาก default HTTP deny list สำหรับ
  owner/admin callers สิ่งนี้ไม่ได้ยกระดับ callers ที่มี identity `operator.write`
  ให้เป็น owner/admin access; `cron`, `gateway`, และ `nodes` ยังคง
  ใช้ไม่ได้สำหรับ non-owner callers แม้อยู่ใน allowlist.

</Accordion>

### Endpoints ที่เข้ากันได้กับ OpenAI

- Admin HTTP RPC: ปิดโดยค่าเริ่มต้นในฐานะ Plugin `admin-http-rpc` เปิดใช้ Plugin เพื่อ register `POST /api/v1/admin/rpc` ดู [Admin HTTP RPC](/th/plugins/admin-http-rpc).
- Chat Completions: ปิดโดยค่าเริ่มต้น เปิดใช้ด้วย `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- การ hardening URL-input ของ Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlists ที่ว่างจะถูกถือว่าไม่ได้ตั้งค่า; ใช้ `gateway.http.endpoints.responses.files.allowUrl=false`
    และ/หรือ `gateway.http.endpoints.responses.images.allowUrl=false` เพื่อปิดการ fetch URL.
- header การ hardening response แบบเลือกใช้ได้:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ตั้งเฉพาะสำหรับ HTTPS origins ที่คุณควบคุม; ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### การแยกหลาย instance

รัน gateways หลายตัวบน host เดียวโดยใช้ ports และ state dirs ที่ไม่ซ้ำกัน:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

flags เพื่อความสะดวก: `--dev` (ใช้ `~/.openclaw-dev` + port `19001`), `--profile <name>` (ใช้ `~/.openclaw-<name>`).

ดู [Multiple Gateways](/th/gateway/multiple-gateways).

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

- `enabled`: เปิดใช้ TLS termination ที่ gateway listener (HTTPS/WSS) (ค่าเริ่มต้น: `false`).
- `autoGenerate`: สร้างคู่ cert/key แบบ self-signed ภายในเครื่องโดยอัตโนมัติเมื่อไม่ได้กำหนดไฟล์อย่างชัดเจน; สำหรับการใช้งาน local/dev เท่านั้น.
- `certPath`: path ใน filesystem ไปยังไฟล์ TLS certificate.
- `keyPath`: path ใน filesystem ไปยังไฟล์ TLS private key; จำกัด permission ไว้.
- `caPath`: path ของ CA bundle แบบเลือกใช้ได้สำหรับ client verification หรือ custom trust chains.

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

- `mode`: ควบคุมวิธีนำการแก้ไข config ไปใช้ขณะ runtime
  - `"off"`: ไม่สนใจการแก้ไขสด การเปลี่ยนแปลงต้อง restart อย่างชัดเจน
  - `"restart"`: restart โปรเซส Gateway ทุกครั้งเมื่อ config เปลี่ยน
  - `"hot"`: นำการเปลี่ยนแปลงไปใช้ภายในโปรเซสโดยไม่ต้อง restart
  - `"hybrid"` (ค่าเริ่มต้น): ลอง hot reload ก่อน หากจำเป็นจึง fallback ไป restart
- `debounceMs`: ช่วง debounce เป็น ms ก่อนนำการเปลี่ยนแปลง config ไปใช้ (จำนวนเต็มไม่ติดลบ)
- `deferralTimeoutMs`: เวลาสูงสุดที่เลือกกำหนดได้เป็น ms เพื่อรอการทำงานที่กำลังดำเนินอยู่ก่อนบังคับ restart หรือ hot reload ช่องทาง หากละไว้จะใช้การรอแบบมีขอบเขตค่าเริ่มต้น (`300000`); ตั้งเป็น `0` เพื่อรอไม่จำกัดและบันทึกคำเตือนว่ายังค้างอยู่เป็นระยะ

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
โทเค็น hook ใน query string จะถูกปฏิเสธ

หมายเหตุด้านการตรวจสอบความถูกต้องและความปลอดภัย:

- `hooks.enabled=true` ต้องมี `hooks.token` ที่ไม่ว่างเปล่า
- `hooks.token` ควรแตกต่างจาก auth แบบ shared-secret ของ Gateway ที่ใช้งานอยู่ (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); startup จะบันทึกคำเตือนด้านความปลอดภัยแบบไม่ร้ายแรงเมื่อตรวจพบการใช้ซ้ำ
- `openclaw security audit` จะระบุการใช้ auth ของ hook/Gateway ซ้ำเป็นผลการตรวจพบระดับวิกฤต รวมถึง auth รหัสผ่าน Gateway ที่ระบุเฉพาะตอน audit (`--auth password --password <password>`) ให้รัน `openclaw doctor --fix` เพื่อหมุนเวียน `hooks.token` ที่ persist ไว้และถูกใช้ซ้ำ จากนั้นอัปเดตตัวส่ง hook ภายนอกให้ใช้โทเค็น hook ใหม่
- `hooks.path` เป็น `/` ไม่ได้ ให้ใช้ subpath เฉพาะ เช่น `/hooks`
- หาก `hooks.allowRequestSessionKey=true` ให้จำกัด `hooks.allowedSessionKeyPrefixes` (เช่น `["hook:"]`)
- หาก mapping หรือ preset ใช้ `sessionKey` แบบ template ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` และ `hooks.allowRequestSessionKey=true` คีย์ mapping แบบคงที่ไม่ต้อง opt-in นี้

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` จาก request payload จะถูกรับเฉพาะเมื่อ `hooks.allowRequestSessionKey=true` (ค่าเริ่มต้น: `false`)
- `POST /hooks/<name>` → resolve ผ่าน `hooks.mappings`
  - ค่า `sessionKey` ของ mapping ที่ render จาก template จะถือว่าเป็นค่าที่ระบุจากภายนอก และต้องมี `hooks.allowRequestSessionKey=true` ด้วย

<Accordion title="Mapping details">

- `match.path` จับคู่ sub-path หลัง `/hooks` (เช่น `/hooks/gmail` → `gmail`)
- `match.source` จับคู่ field ใน payload สำหรับ path ทั่วไป
- Template เช่น `{{messages[0].subject}}` อ่านจาก payload
- `transform` สามารถชี้ไปยังโมดูล JS/TS ที่คืนค่า hook action ได้
  - `transform.module` ต้องเป็น path แบบ relative และอยู่ภายใน `hooks.transformsDir` (path แบบ absolute และ traversal จะถูกปฏิเสธ)
  - เก็บ `hooks.transformsDir` ไว้ใต้ `~/.openclaw/hooks/transforms`; ไดเรกทอรี Skills ของ workspace จะถูกปฏิเสธ หาก `openclaw doctor` รายงานว่า path นี้ไม่ถูกต้อง ให้ย้ายโมดูล transform เข้าไปในไดเรกทอรี hooks transforms หรือลบ `hooks.transformsDir`
- `agentId` route ไปยัง agent เฉพาะ; ID ที่ไม่รู้จักจะ fallback ไปยัง agent ค่าเริ่มต้น
- `allowedAgentIds`: จำกัดการ route agent ที่มีผล รวมถึง path ของ agent ค่าเริ่มต้นเมื่อไม่ได้ระบุ `agentId` (`*` หรือไม่ระบุ = อนุญาตทั้งหมด, `[]` = ปฏิเสธทั้งหมด)
- `defaultSessionKey`: คีย์ session คงที่แบบเลือกกำหนดได้สำหรับการรัน hook agent ที่ไม่มี `sessionKey` ชัดเจน
- `allowRequestSessionKey`: อนุญาตให้ผู้เรียก `/hooks/agent` และคีย์ session ของ mapping ที่ขับเคลื่อนด้วย template ตั้งค่า `sessionKey` (ค่าเริ่มต้น: `false`)
- `allowedSessionKeyPrefixes`: allowlist prefix แบบเลือกกำหนดได้สำหรับค่า `sessionKey` ที่ระบุชัดเจน (request + mapping), เช่น `["hook:"]` ค่านี้จะกลายเป็นข้อบังคับเมื่อ mapping หรือ preset ใด ๆ ใช้ `sessionKey` แบบ template
- `deliver: true` ส่งการตอบกลับสุดท้ายไปยังช่องทาง; `channel` มีค่าเริ่มต้นเป็น `last`
- `model` override LLM สำหรับการรัน hook นี้ (ต้องได้รับอนุญาตหากตั้งค่า model catalog)

</Accordion>

### การผสานรวม Gmail

- preset Gmail ในตัวใช้ `sessionKey: "hook:gmail:{{messages[0].id}}"`
- หากคุณคงการ route ต่อข้อความนั้นไว้ ให้ตั้ง `hooks.allowRequestSessionKey: true` และจำกัด `hooks.allowedSessionKeyPrefixes` ให้ตรงกับ namespace ของ Gmail เช่น `["hook:", "hook:gmail:"]`
- หากคุณต้องใช้ `hooks.allowRequestSessionKey: false` ให้ override preset ด้วย `sessionKey` แบบคงที่แทนค่าเริ่มต้นแบบ template

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

- Gateway จะ auto-start `gog gmail watch serve` ตอน boot เมื่อมีการกำหนดค่า ตั้ง `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อปิดใช้งาน
- อย่ารัน `gog gmail watch serve` แยกต่างหากคู่กับ Gateway

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

- ให้บริการ HTML/CSS/JS ที่ agent แก้ไขได้และ A2UI ผ่าน HTTP ภายใต้พอร์ต Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- เฉพาะ local: คง `gateway.bind: "loopback"` ไว้ (ค่าเริ่มต้น)
- การ bind ที่ไม่ใช่ loopback: route ของ canvas ต้องใช้ auth ของ Gateway (token/password/trusted-proxy) เช่นเดียวกับพื้นผิว HTTP อื่นของ Gateway
- โดยทั่วไป Node WebViews จะไม่ส่ง header auth; หลังจากจับคู่และเชื่อมต่อ node แล้ว Gateway จะประกาศ URL ความสามารถแบบจำกัด scope ตาม node สำหรับการเข้าถึง canvas/A2UI
- URL ความสามารถจะผูกกับ session WS ของ node ที่ใช้งานอยู่และหมดอายุอย่างรวดเร็ว ไม่มีการใช้ fallback ตาม IP
- inject client live-reload เข้าไปใน HTML ที่ให้บริการ
- สร้าง `index.html` เริ่มต้นโดยอัตโนมัติเมื่อว่างเปล่า
- ให้บริการ A2UI ที่ `/__openclaw__/a2ui/` ด้วย
- การเปลี่ยนแปลงต้อง restart Gateway
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

- `minimal` (ค่าเริ่มต้นเมื่อเปิดใช้งาน Plugin `bonjour` ที่ bundled มา): ละ `cliPath` + `sshPort` จาก TXT record
- `full`: รวม `cliPath` + `sshPort`; การโฆษณา multicast บน LAN ยังต้องเปิดใช้งาน Plugin `bonjour` ที่ bundled มา
- `off`: ระงับการโฆษณา multicast บน LAN โดยไม่เปลี่ยนการเปิดใช้งาน Plugin
- Plugin `bonjour` ที่ bundled มาจะ auto-start บนโฮสต์ macOS และเป็นแบบ opt-in บน Linux, Windows และการ deploy Gateway ใน container
- Hostname มีค่าเริ่มต้นเป็น hostname ของระบบเมื่อเป็น DNS label ที่ถูกต้อง และ fallback เป็น `openclaw` override ได้ด้วย `OPENCLAW_MDNS_HOSTNAME`

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

เขียนโซน DNS-SD แบบ unicast ไว้ใต้ `~/.openclaw/dns/` สำหรับการค้นพบข้ามเครือข่าย ให้ใช้ร่วมกับเซิร์ฟเวอร์ DNS (แนะนำ CoreDNS) + Tailscale split DNS

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

- ตัวแปรสภาพแวดล้อมแบบอินไลน์จะถูกนำไปใช้เฉพาะเมื่อสภาพแวดล้อมของโปรเซสไม่มีคีย์นั้น
- ไฟล์ `.env`: CWD `.env` + `~/.openclaw/.env` (ทั้งคู่ไม่เขียนทับตัวแปรที่มีอยู่)
- `shellEnv`: นำเข้าคีย์ที่คาดไว้และยังขาดจากโปรไฟล์เชลล์ล็อกอินของคุณ
- ดู [สภาพแวดล้อม](/th/help/environment) สำหรับลำดับความสำคัญทั้งหมด

### การแทนค่าตัวแปรสภาพแวดล้อม

อ้างอิงตัวแปรสภาพแวดล้อมในสตริง config ใดก็ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- จับคู่เฉพาะชื่อที่เป็นตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- ตัวแปรที่ขาดหาย/ว่างจะทำให้เกิดข้อผิดพลาดเมื่อโหลด config
- เอสเคปด้วย `$${VAR}` สำหรับ literal `${VAR}`
- ใช้ได้กับ `$include`

---

## ความลับ

การอ้างอิงความลับเป็นแบบเพิ่มเข้าไป: ค่าข้อความธรรมดายังคงใช้ได้

### `SecretRef`

ใช้รูปทรงอ็อบเจ็กต์เดียว:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

การตรวจสอบความถูกต้อง:

- รูปแบบ `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- รูปแบบ id ของ `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id ของ `source: "file"`: JSON pointer แบบสัมบูรณ์ (เช่น `"/providers/openai/apiKey"`)
- รูปแบบ id ของ `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (รองรับตัวเลือกแบบ AWS `secret#json_key`)
- id ของ `source: "exec"` ต้องไม่มี path segment ที่คั่นด้วยสแลชเป็น `.` หรือ `..` (เช่น `a/../b` จะถูกปฏิเสธ)

### พื้นผิวข้อมูลรับรองที่รองรับ

- เมทริกซ์มาตรฐาน: [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
- `secrets apply` กำหนดเป้าหมายไปยังพาธข้อมูลรับรองของ `openclaw.json` ที่รองรับ
- การอ้างอิงใน `auth-profiles.json` รวมอยู่ในการแก้ไขค่าขณะรันไทม์และขอบเขตการตรวจสอบแล้ว

### config ผู้ให้บริการความลับ

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
- พาธของผู้ให้บริการ file และ exec จะ fail closed เมื่อการตรวจสอบ Windows ACL ไม่พร้อมใช้งาน ตั้งค่า `allowInsecurePath: true` เฉพาะสำหรับพาธที่เชื่อถือได้แต่ไม่สามารถตรวจสอบได้
- ผู้ให้บริการ `exec` ต้องใช้พาธ `command` แบบสัมบูรณ์ และใช้ payload โปรโตคอลบน stdin/stdout
- ตามค่าเริ่มต้น พาธคำสั่งที่เป็น symlink จะถูกปฏิเสธ ตั้งค่า `allowSymlinkCommand: true` เพื่ออนุญาตพาธ symlink พร้อมตรวจสอบพาธเป้าหมายที่แก้ไขแล้ว
- หากกำหนดค่า `trustedDirs` การตรวจสอบ trusted-dir จะใช้กับพาธเป้าหมายที่แก้ไขแล้ว
- โดยค่าเริ่มต้น สภาพแวดล้อมของ child ของ `exec` จะเป็นแบบขั้นต่ำ ให้ส่งตัวแปรที่ต้องใช้แบบชัดเจนด้วย `passEnv`
- การอ้างอิงความลับจะถูกแก้ไขค่าในเวลาเปิดใช้งานเป็นสแนปช็อตในหน่วยความจำ จากนั้นพาธคำขอจะอ่านเฉพาะสแนปช็อตนั้น
- การกรอง active-surface จะมีผลระหว่างการเปิดใช้งาน: การอ้างอิงที่ยังแก้ค่าไม่ได้บนพื้นผิวที่เปิดใช้งานจะทำให้การเริ่มต้น/โหลดซ้ำล้มเหลว ส่วนพื้นผิวที่ไม่ใช้งานจะถูกข้ามพร้อม diagnostics

---

## ที่จัดเก็บ auth

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal"],
    },
  },
}
```

- โปรไฟล์ต่อเอเจนต์ถูกเก็บไว้ที่ `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` รองรับการอ้างอิงระดับค่า (`keyRef` สำหรับ `api_key`, `tokenRef` สำหรับ `token`) สำหรับโหมดข้อมูลรับรองแบบคงที่
- แมป `auth-profiles.json` แบบแบนรุ่นเก่า เช่น `{ "provider": { "apiKey": "..." } }` ไม่ใช่รูปแบบ runtime; `openclaw doctor --fix` จะเขียนใหม่เป็นโปรไฟล์ API-key แบบ canonical `provider:default` พร้อมข้อมูลสำรอง `.legacy-flat.*.bak`
- โปรไฟล์โหมด OAuth (`auth.profiles.<id>.mode = "oauth"`) ไม่รองรับข้อมูลรับรอง auth-profile ที่มี SecretRef หนุนหลัง
- ข้อมูลรับรอง runtime แบบคงที่มาจาก snapshot ที่ resolve แล้วในหน่วยความจำ; รายการ `auth.json` แบบคงที่รุ่นเก่าจะถูกล้างเมื่อพบ
- การนำเข้า OAuth รุ่นเก่ามาจาก `~/.openclaw/credentials/oauth.json`
- ดู [OAuth](/th/concepts/oauth)
- พฤติกรรม runtime ของ secrets และเครื่องมือ `audit/configure/apply`: [การจัดการ Secrets](/th/gateway/secrets)

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

- `billingBackoffHours`: backoff พื้นฐานเป็นชั่วโมงเมื่อโปรไฟล์ล้มเหลวจากข้อผิดพลาด
  billing/เครดิตไม่เพียงพอจริง (ค่าเริ่มต้น: `5`) ข้อความ billing ที่ชัดเจนยัง
  อาจเข้ามาที่นี่ได้แม้บนการตอบกลับ `401`/`403` แต่ตัวจับคู่ข้อความเฉพาะ provider
  จะยังจำกัดขอบเขตอยู่กับ provider ที่เป็นเจ้าของเท่านั้น (เช่น OpenRouter
  `Key limit exceeded`) ข้อความ HTTP `402` แบบลองใหม่ได้สำหรับ usage-window หรือ
  ขีดจำกัดค่าใช้จ่ายของ organization/workspace จะยังอยู่ในเส้นทาง `rate_limit`
  แทน
- `billingBackoffHoursByProvider`: การ override จำนวนชั่วโมง billing backoff แยกตาม provider แบบไม่บังคับ
- `billingMaxHours`: เพดานเป็นชั่วโมงสำหรับการเติบโตแบบ exponential ของ billing backoff (ค่าเริ่มต้น: `24`)
- `authPermanentBackoffMinutes`: backoff พื้นฐานเป็นนาทีสำหรับความล้มเหลว `auth_permanent` ที่มีความมั่นใจสูง (ค่าเริ่มต้น: `10`)
- `authPermanentMaxMinutes`: เพดานเป็นนาทีสำหรับการเติบโตของ `auth_permanent` backoff (ค่าเริ่มต้น: `60`)
- `failureWindowHours`: หน้าต่างแบบ rolling เป็นชั่วโมงที่ใช้สำหรับตัวนับ backoff (ค่าเริ่มต้น: `24`)
- `overloadedProfileRotations`: จำนวนสูงสุดของการหมุนเวียน auth-profile ใน provider เดียวกันสำหรับข้อผิดพลาด overloaded ก่อนเปลี่ยนไปใช้ model fallback (ค่าเริ่มต้น: `1`) รูปแบบ provider-busy เช่น `ModelNotReadyException` จะเข้ามาที่นี่
- `overloadedBackoffMs`: ดีเลย์คงที่ก่อนลองหมุนเวียน provider/profile ที่ overloaded อีกครั้ง (ค่าเริ่มต้น: `0`)
- `rateLimitedProfileRotations`: จำนวนสูงสุดของการหมุนเวียน auth-profile ใน provider เดียวกันสำหรับข้อผิดพลาด rate-limit ก่อนเปลี่ยนไปใช้ model fallback (ค่าเริ่มต้น: `1`) กลุ่ม rate-limit นั้นรวมข้อความที่มีรูปแบบตาม provider เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` และ `resource exhausted`

---

## การบันทึก

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

- ไฟล์ log เริ่มต้น: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`
- ตั้งค่า `logging.file` สำหรับ path ที่คงที่
- `consoleLevel` จะเพิ่มเป็น `debug` เมื่อใช้ `--verbose`
- `maxFileBytes`: ขนาดไฟล์ log ที่ใช้งานอยู่สูงสุดเป็นไบต์ก่อนหมุนเวียนไฟล์ (จำนวนเต็มบวก; ค่าเริ่มต้น: `104857600` = 100 MB) OpenClaw เก็บไฟล์ archive แบบมีหมายเลขไว้ข้างไฟล์ที่ใช้งานอยู่ได้สูงสุดห้าไฟล์
- `redactSensitive` / `redactPatterns`: การปิดบังแบบ best-effort สำหรับเอาต์พุต console, file logs, ระเบียน log ของ OTLP และข้อความ transcript ของ session ที่คงอยู่ `redactSensitive: "off"` จะปิดเฉพาะนโยบาย log/transcript ทั่วไปนี้เท่านั้น; พื้นผิวความปลอดภัยของ UI/tool/diagnostic ยังคง redact secrets ก่อนส่งออก

---

## การวินิจฉัย

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

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
      logsExporter: "otlp",
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
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
- `flags`: อาร์เรย์ของสตริง flag ที่เปิดใช้งานเอาต์พุต log แบบเจาะจง (รองรับ wildcard เช่น `"telegram.*"` หรือ `"*"`)
- `stuckSessionWarnMs`: เกณฑ์อายุแบบไม่มีความคืบหน้าเป็น ms สำหรับจัดประเภท session ประมวลผลที่รันนานเป็น `session.long_running`, `session.stalled` หรือ `session.stuck` การตอบกลับ, tool, สถานะ, block และความคืบหน้า ACP จะรีเซ็ตตัวจับเวลา; diagnostics `session.stuck` ที่ซ้ำกันจะ back off ขณะไม่มีการเปลี่ยนแปลง
- `stuckSessionAbortMs`: เกณฑ์อายุแบบไม่มีความคืบหน้าเป็น ms ก่อนที่งาน active ที่ stalled และมีสิทธิ์อาจถูก abort-drain เพื่อกู้คืน เมื่อไม่ได้ตั้งค่า OpenClaw จะใช้หน้าต่าง embedded-run ที่ขยายและปลอดภัยกว่าอย่างน้อย 5 นาที และ 3 เท่าของ `stuckSessionWarnMs`
- `memoryPressureSnapshot`: จับ snapshot เสถียรภาพก่อน OOM แบบ redacted เมื่อแรงกดดันหน่วยความจำถึง `critical` (ค่าเริ่มต้น: `false`) ตั้งเป็น `true` เพื่อเพิ่มการสแกน/เขียนไฟล์ stability bundle ขณะยังคง event แรงกดดันหน่วยความจำตามปกติ
- `otel.enabled`: เปิดใช้งาน pipeline การ export ของ OpenTelemetry (ค่าเริ่มต้น: `false`) สำหรับการกำหนดค่าเต็ม, signal catalog และ privacy model ดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)
- `otel.endpoint`: URL ของ collector สำหรับการ export OTel
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP เฉพาะ signal แบบไม่บังคับ เมื่อตั้งค่าแล้ว จะ override `otel.endpoint` สำหรับ signal นั้นเท่านั้น
- `otel.protocol`: `"http/protobuf"` (ค่าเริ่มต้น) หรือ `"grpc"`
- `otel.headers`: header metadata HTTP/gRPC เพิ่มเติมที่ส่งพร้อมคำขอ export OTel
- `otel.serviceName`: ชื่อบริการสำหรับ resource attributes
- `otel.traces` / `otel.metrics` / `otel.logs`: เปิดใช้งานการ export trace, metrics หรือ log
- `otel.logsExporter`: ปลายทาง export log: `"otlp"` (ค่าเริ่มต้น), `"stdout"` สำหรับอ็อบเจ็กต์ JSON หนึ่งรายการต่อบรรทัด stdout หรือ `"both"`
- `otel.sampleRate`: อัตราการสุ่มตัวอย่าง trace `0`-`1`
- `otel.flushIntervalMs`: ช่วงเวลา flush telemetry เป็นระยะใน ms
- `otel.captureContent`: เลือกรับการจับเนื้อหาดิบสำหรับ OTEL span attributes ค่าเริ่มต้นคือปิด Boolean `true` จะจับเนื้อหา message/tool ที่ไม่ใช่ระบบ; รูปแบบอ็อบเจ็กต์ให้คุณเปิดใช้งาน `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` และ `toolDefinitions` ได้อย่างชัดเจน
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: สวิตช์ environment สำหรับรูปแบบ span การ inference ของ GenAI แบบ experimental ล่าสุด รวมถึงชื่อ span `{gen_ai.operation.name} {gen_ai.request.model}`, ชนิด span `CLIENT` และ `gen_ai.provider.name` แทน `gen_ai.system` รุ่นเก่า โดยค่าเริ่มต้น span จะคง `openclaw.model.call` และ `gen_ai.system` ไว้เพื่อความเข้ากันได้; metrics ของ GenAI ใช้ semantic attributes ที่มีขอบเขตจำกัด
- `OPENCLAW_OTEL_PRELOADED=1`: สวิตช์ environment สำหรับ host ที่ลงทะเบียน OpenTelemetry SDK แบบ global ไว้แล้ว จากนั้น OpenClaw จะข้ามการเริ่ม/ปิด SDK ที่ Plugin เป็นเจ้าของ ขณะยังคงให้ diagnostic listeners ทำงานอยู่
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` และ `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: env vars ของ endpoint เฉพาะ signal ที่ใช้เมื่อไม่ได้ตั้งค่า config key ที่ตรงกัน
- `cacheTrace.enabled`: บันทึก snapshot ของ cache trace สำหรับ embedded runs (ค่าเริ่มต้น: `false`)
- `cacheTrace.filePath`: path เอาต์พุตสำหรับ cache trace JSONL (ค่าเริ่มต้น: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: ควบคุมสิ่งที่รวมอยู่ในเอาต์พุต cache trace (ทั้งหมดมีค่าเริ่มต้น: `true`)

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

- `channel`: release channel สำหรับการติดตั้ง npm/git - `"stable"`, `"beta"` หรือ `"dev"`
- `checkOnStart`: ตรวจสอบการอัปเดต npm เมื่อ gateway เริ่มทำงาน (ค่าเริ่มต้น: `true`)
- `auto.enabled`: เปิดใช้งานการอัปเดตอัตโนมัติแบบเบื้องหลังสำหรับการติดตั้ง package (ค่าเริ่มต้น: `false`)
- `auto.stableDelayHours`: ดีเลย์ขั้นต่ำเป็นชั่วโมงก่อน auto-apply สำหรับ stable-channel (ค่าเริ่มต้น: `6`; สูงสุด: `168`)
- `auto.stableJitterHours`: หน้าต่างกระจายการ rollout เพิ่มเติมของ stable-channel เป็นชั่วโมง (ค่าเริ่มต้น: `12`; สูงสุด: `168`)
- `auto.betaCheckIntervalHours`: ความถี่ที่การตรวจสอบ beta-channel ทำงานเป็นชั่วโมง (ค่าเริ่มต้น: `1`; สูงสุด: `24`)

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

- `enabled`: feature gate ACP แบบ global (ค่าเริ่มต้น: `true`; ตั้งเป็น `false` เพื่อซ่อน dispatch และ affordance การ spawn ของ ACP)
- `dispatch.enabled`: gate อิสระสำหรับการ dispatch turn ของ ACP session (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อให้คำสั่ง ACP ยังพร้อมใช้งานขณะบล็อกการดำเนินการ
- `backend`: id backend runtime ACP เริ่มต้น (ต้องตรงกับ Plugin runtime ACP ที่ลงทะเบียนไว้)
  ติดตั้ง Plugin backend ก่อน และหากตั้งค่า `plugins.allow` ให้รวม id Plugin backend (เช่น `acpx`) มิฉะนั้น backend ACP จะไม่โหลด
- `defaultAgent`: id เอเจนต์เป้าหมาย ACP fallback เมื่อ spawns ไม่ได้ระบุเป้าหมายอย่างชัดเจน
- `allowedAgents`: allowlist ของ id เอเจนต์ที่อนุญาตสำหรับ session runtime ACP; ว่างหมายถึงไม่มีข้อจำกัดเพิ่มเติม
- `maxConcurrentSessions`: จำนวน session ACP ที่ active พร้อมกันสูงสุด
- `stream.coalesceIdleMs`: หน้าต่าง idle flush เป็น ms สำหรับข้อความที่ stream
- `stream.maxChunkChars`: ขนาด chunk สูงสุดก่อนแยก projection ของ block ที่ stream
- `stream.repeatSuppression`: ระงับบรรทัดสถานะ/tool ที่ซ้ำกันต่อ turn (ค่าเริ่มต้น: `true`)
- `stream.deliveryMode`: `"live"` stream แบบเพิ่มทีละส่วน; `"final_only"` buffer จนถึง event สิ้นสุดของ turn
- `stream.hiddenBoundarySeparator`: ตัวคั่นก่อนข้อความที่มองเห็นได้หลัง event tool ที่ซ่อนอยู่ (ค่าเริ่มต้น: `"paragraph"`)
- `stream.maxOutputChars`: จำนวนอักขระเอาต์พุต assistant สูงสุดที่ project ต่อ ACP turn
- `stream.maxSessionUpdateChars`: จำนวนอักขระสูงสุดสำหรับบรรทัดสถานะ/อัปเดต ACP ที่ project
- `stream.tagVisibility`: ระเบียนของชื่อ tag ไปยัง override การมองเห็นแบบ boolean สำหรับ event ที่ stream
- `runtime.ttlMinutes`: TTL เมื่อ idle เป็นนาทีสำหรับ worker ของ ACP session ก่อนมีสิทธิ์ cleanup
- `runtime.installCommand`: คำสั่งติดตั้งแบบไม่บังคับที่จะรันเมื่อ bootstrap environment runtime ACP

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

- `cli.banner.taglineMode` ควบคุมสไตล์แท็กไลน์ของแบนเนอร์:
  - `"random"` (ค่าเริ่มต้น): แท็กไลน์ตลก/ตามฤดูกาลที่หมุนเวียนกัน.
  - `"default"`: แท็กไลน์กลางแบบคงที่ (`All your chats, one OpenClaw.`).
  - `"off"`: ไม่มีข้อความแท็กไลน์ (ยังคงแสดงชื่อ/เวอร์ชันของแบนเนอร์).
- หากต้องการซ่อนทั้งแบนเนอร์ (ไม่ใช่แค่แท็กไลน์) ให้ตั้งค่า env `OPENCLAW_HIDE_BANNER=1`.

---

## ตัวช่วยตั้งค่า

เมทาดาทาที่เขียนโดยโฟลว์การตั้งค่าแบบมีคำแนะนำของ CLI (`onboard`, `configure`, `doctor`):

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

## ตัวตน

ดูฟิลด์ตัวตน `agents.list` ใต้ [ค่าเริ่มต้นของเอเจนต์](/th/gateway/config-agents#agent-defaults).

---

## บริดจ์ (เลกาซี, นำออกแล้ว)

บิลด์ปัจจุบันไม่มี TCP bridge อีกต่อไป Node เชื่อมต่อผ่าน Gateway WebSocket คีย์ `bridge.*` ไม่ได้เป็นส่วนหนึ่งของสคีมาการตั้งค่าอีกต่อไป (การตรวจสอบจะล้มเหลวจนกว่าจะนำออก; `openclaw doctor --fix` สามารถลบคีย์ที่ไม่รู้จักได้).

<Accordion title="Legacy bridge config (historical reference)">

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
    maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
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

- `sessionRetention`: ระยะเวลาที่จะเก็บเซสชันการรัน cron แบบแยกที่เสร็จสิ้นแล้วก่อนตัดออกจาก `sessions.json`. ยังควบคุมการล้างทรานสคริปต์ cron ที่ถูกลบและเก็บถาวรด้วย ค่าเริ่มต้น: `24h`; ตั้งค่าเป็น `false` เพื่อปิดใช้.
- `runLog.maxBytes`: ยอมรับเพื่อความเข้ากันได้กับบันทึกการรัน cron แบบใช้ไฟล์รุ่นเก่า ค่าเริ่มต้น: `2_000_000` ไบต์.
- `runLog.keepLines`: แถวประวัติการรัน SQLite ล่าสุดที่เก็บไว้ต่อหนึ่งงาน ค่าเริ่มต้น: `2000`.
- `webhookToken`: โทเค็น bearer ที่ใช้สำหรับการส่ง POST ของ cron webhook (`delivery.mode = "webhook"`); หากไม่ระบุ จะไม่ส่งส่วนหัว auth.
- `webhook`: URL webhook เลกาซีสำรองที่เลิกใช้แล้ว (http/https) ซึ่ง `openclaw doctor --fix` ใช้เพื่อย้ายงานที่เก็บไว้ซึ่งยังมี `notify: true`; การส่งขณะรันไทม์ใช้ `delivery.mode="webhook"` ต่อแต่ละงานร่วมกับ `delivery.to`, หรือ `delivery.completionDestination` เมื่อรักษาการส่งแบบประกาศไว้.

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

- `maxAttempts`: จำนวนครั้งสูงสุดที่จะลองใหม่สำหรับงาน cron เมื่อเกิดข้อผิดพลาดชั่วคราว (ค่าเริ่มต้น: `3`; ช่วง: `0`-`10`).
- `backoffMs`: อาร์เรย์ของดีเลย์ backoff เป็น ms สำหรับความพยายามลองใหม่แต่ละครั้ง (ค่าเริ่มต้น: `[30000, 60000, 300000]`; 1-10 รายการ).
- `retryOn`: ประเภทข้อผิดพลาดที่ทริกเกอร์การลองใหม่ - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. ไม่ต้องระบุหากต้องการลองใหม่กับประเภทชั่วคราวทั้งหมด.

งานแบบครั้งเดียวจะยังคงเปิดใช้จนกว่าความพยายามลองใหม่จะหมด จากนั้นจะปิดใช้โดยยังเก็บสถานะข้อผิดพลาดสุดท้ายไว้ งานแบบเกิดซ้ำใช้นโยบายการลองใหม่เมื่อเกิดข้อผิดพลาดชั่วคราวเดียวกันเพื่อรันอีกครั้งหลัง backoff ก่อนช่วงเวลาที่กำหนดครั้งถัดไป; ข้อผิดพลาดถาวรหรือการลองใหม่ชั่วคราวที่หมดแล้วจะกลับไปใช้กำหนดการเกิดซ้ำปกติพร้อม backoff ข้อผิดพลาด.

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

- `enabled`: เปิดใช้การแจ้งเตือนความล้มเหลวสำหรับงาน cron (ค่าเริ่มต้น: `false`).
- `after`: จำนวนความล้มเหลวติดต่อกันก่อนส่งการแจ้งเตือน (จำนวนเต็มบวก, ต่ำสุด: `1`).
- `cooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการแจ้งเตือนซ้ำสำหรับงานเดียวกัน (จำนวนเต็มไม่ติดลบ).
- `includeSkipped`: นับการรันที่ถูกข้ามติดต่อกันรวมในเกณฑ์การแจ้งเตือน (ค่าเริ่มต้น: `false`). การรันที่ถูกข้ามจะถูกติดตามแยกต่างหากและไม่ส่งผลต่อ backoff ของข้อผิดพลาดการดำเนินการ.
- `mode`: โหมดการส่ง - `"announce"` ส่งผ่านข้อความช่องทาง; `"webhook"` โพสต์ไปยัง webhook ที่กำหนดค่าไว้.
- `accountId`: บัญชีหรือ id ช่องทางที่เป็นทางเลือกเพื่อจำกัดขอบเขตการส่งการแจ้งเตือน.

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

- ปลายทางเริ่มต้นสำหรับการแจ้งเตือนความล้มเหลวของ cron ในทุกงาน.
- `mode`: `"announce"` หรือ `"webhook"`; ค่าเริ่มต้นเป็น `"announce"` เมื่อมีข้อมูลเป้าหมายเพียงพอ.
- `channel`: การแทนที่ช่องทางสำหรับการส่งแบบประกาศ `"last"` ใช้ช่องทางการส่งล่าสุดที่ทราบซ้ำ.
- `to`: เป้าหมายประกาศหรือ URL webhook แบบชัดเจน จำเป็นสำหรับโหมด webhook.
- `accountId`: การแทนที่บัญชีสำหรับการส่งที่เป็นทางเลือก.
- `delivery.failureDestination` ต่อแต่ละงานจะแทนที่ค่าเริ่มต้นทั่วโลกนี้.
- เมื่อไม่ได้ตั้งค่าปลายทางความล้มเหลวทั้งแบบทั่วโลกและต่อแต่ละงาน งานที่ส่งผ่าน `announce` อยู่แล้วจะย้อนกลับไปใช้เป้าหมายประกาศหลักนั้นเมื่อเกิดความล้มเหลว.
- รองรับ `delivery.failureDestination` เฉพาะกับงาน `sessionTarget="isolated"` เว้นแต่ `delivery.mode` หลักของงานจะเป็น `"webhook"`.

ดู [งาน Cron](/th/automation/cron-jobs). การดำเนินการ cron แบบแยกถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks).

---

## ตัวแปรเทมเพลตโมเดลสื่อ

ตัวยึดตำแหน่งเทมเพลตที่ขยายใน `tools.media.models[].args`:

| ตัวแปร             | คำอธิบาย                                          |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | เนื้อหาข้อความขาเข้าทั้งหมด                      |
| `{{RawBody}}`      | เนื้อหาดิบ (ไม่มีตัวครอบประวัติ/ผู้ส่ง)          |
| `{{BodyStripped}}` | เนื้อหาที่ลบการกล่าวถึงกลุ่มออกแล้ว              |
| `{{From}}`         | ตัวระบุผู้ส่ง                                     |
| `{{To}}`           | ตัวระบุปลายทาง                                    |
| `{{MessageSid}}`   | id ข้อความของช่องทาง                              |
| `{{SessionId}}`    | UUID เซสชันปัจจุบัน                               |
| `{{IsNewSession}}` | `"true"` เมื่อสร้างเซสชันใหม่                    |
| `{{MediaUrl}}`     | pseudo-URL ของสื่อขาเข้า                          |
| `{{MediaPath}}`    | พาธสื่อในเครื่อง                                  |
| `{{MediaType}}`    | ประเภทสื่อ (รูปภาพ/เสียง/เอกสาร/…)               |
| `{{Transcript}}`   | ทรานสคริปต์เสียง                                  |
| `{{Prompt}}`       | พรอมต์สื่อที่แก้ค่าแล้วสำหรับรายการ CLI          |
| `{{MaxChars}}`     | จำนวนอักขระเอาต์พุตสูงสุดที่แก้ค่าแล้วสำหรับรายการ CLI |
| `{{ChatType}}`     | `"direct"` หรือ `"group"`                         |
| `{{GroupSubject}}` | หัวข้อกลุ่ม (พยายามให้ดีที่สุด)                  |
| `{{GroupMembers}}` | ตัวอย่างสมาชิกกลุ่ม (พยายามให้ดีที่สุด)          |
| `{{SenderName}}`   | ชื่อที่แสดงของผู้ส่ง (พยายามให้ดีที่สุด)         |
| `{{SenderE164}}`   | หมายเลขโทรศัพท์ของผู้ส่ง (พยายามให้ดีที่สุด)    |
| `{{Provider}}`     | คำใบ้ผู้ให้บริการ (whatsapp, telegram, discord, ฯลฯ) |

---

## การรวมการตั้งค่า (`$include`)

แยกการตั้งค่าเป็นหลายไฟล์:

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

- ไฟล์เดียว: แทนที่อ็อบเจกต์ที่ครอบอยู่.
- อาร์เรย์ของไฟล์: ผสานแบบลึกตามลำดับ (รายการหลังแทนที่รายการก่อน).
- คีย์พี่น้อง: ผสานหลังจาก includes (แทนที่ค่าที่รวมเข้ามา).
- Includes ซ้อนกัน: ลึกได้สูงสุด 10 ระดับ.
- พาธ: แก้ค่าแบบสัมพันธ์กับไฟล์ที่รวม แต่ต้องอยู่ภายในไดเรกทอรีการตั้งค่าระดับบนสุด (`dirname` ของ `openclaw.json`). รูปแบบ absolute/`../` อนุญาตเฉพาะเมื่อยังแก้ค่าอยู่ภายในขอบเขตนั้น พาธต้องไม่มีไบต์ null และต้องสั้นกว่า 4096 อักขระอย่างเคร่งครัดทั้งก่อนและหลังการแก้ค่า.
- การเขียนที่ OpenClaw เป็นเจ้าของซึ่งเปลี่ยนเฉพาะส่วนระดับบนสุดหนึ่งส่วนที่รองรับโดย include แบบไฟล์เดียว จะเขียนทะลุไปยังไฟล์ที่ถูกรวมนั้น ตัวอย่างเช่น `plugins install` อัปเดต `plugins: { $include: "./plugins.json5" }` ใน `plugins.json5` และคง `openclaw.json` ไว้ตามเดิม.
- Root includes, อาร์เรย์ include, และ includes ที่มีการแทนที่ด้วยคีย์พี่น้องเป็นแบบอ่านอย่างเดียวสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนเหล่านั้นจะล้มเหลวแบบปิดแทนที่จะ flatten การตั้งค่า.
- ข้อผิดพลาด: ข้อความที่ชัดเจนสำหรับไฟล์ที่หายไป, ข้อผิดพลาดการ parse, includes แบบวนซ้ำ, รูปแบบพาธที่ไม่ถูกต้อง, และความยาวเกินกำหนด.

---

_ที่เกี่ยวข้อง: [การตั้งค่า](/th/gateway/configuration) · [ตัวอย่างการตั้งค่า](/th/gateway/configuration-examples) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [การตั้งค่า](/th/gateway/configuration)
- [ตัวอย่างการตั้งค่า](/th/gateway/configuration-examples)
