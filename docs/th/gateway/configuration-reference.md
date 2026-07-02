---
read_when:
    - คุณต้องการความหมายของการกำหนดค่าระดับฟิลด์หรือค่าเริ่มต้นที่แน่นอน
    - คุณกำลังตรวจสอบบล็อกการกำหนดค่า channel, model, gateway หรือ tool
summary: ข้อมูลอ้างอิงการกำหนดค่า Gateway สำหรับคีย์หลักของ OpenClaw ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงเฉพาะของระบบย่อย
title: ข้อมูลอ้างอิงการกำหนดค่า
x-i18n:
    generated_at: "2026-07-02T01:20:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d15cc968bc89a7a490a5eaf571d5f38d052ad8783fcc7de5ca17d08ac04bfcc7
    source_path: gateway/configuration-reference.md
    workflow: 16
---

ข้อมูลอ้างอิงการกำหนดค่าหลักสำหรับ `~/.openclaw/openclaw.json` สำหรับภาพรวมแบบเน้นงาน โปรดดู [การกำหนดค่า](/th/gateway/configuration)

ครอบคลุมพื้นผิวการกำหนดค่าหลักของ OpenClaw และลิงก์ออกไปเมื่อระบบย่อยมีข้อมูลอ้างอิงที่ละเอียดกว่าของตัวเอง แค็ตตาล็อกคำสั่งที่ช่องทางและ Plugin เป็นเจ้าของ รวมถึงตัวเลือกหน่วยความจำเชิงลึก/QMD อยู่ในหน้าของตัวเองแทนที่จะอยู่ในหน้านี้

ความจริงจากโค้ด:

- `openclaw config schema` พิมพ์ JSON Schema จริงที่ใช้สำหรับการตรวจสอบความถูกต้องและ Control UI โดยรวมเมตาดาต้าของ bundled/plugin/channel เข้าไปเมื่อมี
- `config.schema.lookup` ส่งคืนโหนดสคีมาหนึ่งรายการที่จำกัดตามพาธสำหรับเครื่องมือเจาะดูรายละเอียด
- `pnpm config:docs:check` / `pnpm config:docs:gen` ตรวจสอบแฮชฐานของเอกสารการกำหนดค่ากับพื้นผิวสคีมาปัจจุบัน

พาธการค้นหาของเอเจนต์: ใช้การกระทำเครื่องมือ `gateway` ชื่อ `config.schema.lookup` สำหรับเอกสารและข้อจำกัดระดับฟิลด์ที่แม่นยำก่อนแก้ไข ใช้ [การกำหนดค่า](/th/gateway/configuration) สำหรับคำแนะนำแบบเน้นงาน และใช้หน้านี้สำหรับแผนที่ฟิลด์โดยรวม ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงของระบบย่อย

ข้อมูลอ้างอิงเชิงลึกเฉพาะด้าน:

- [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config) สำหรับ `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` และการกำหนดค่า dreaming ใต้ `plugins.entries.memory-core.config.dreaming`
- [คำสั่งสแลช](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่งในตัว + bundled ปัจจุบัน
- หน้าช่องทาง/Plugin ที่เป็นเจ้าของสำหรับพื้นผิวคำสั่งเฉพาะช่องทาง

รูปแบบการกำหนดค่าคือ **JSON5** (อนุญาตให้มีคอมเมนต์ + comma ท้ายรายการ) ฟิลด์ทั้งหมดเป็นแบบไม่บังคับ - OpenClaw ใช้ค่าเริ่มต้นที่ปลอดภัยเมื่อเว้นไว้

---

## ช่องทาง

คีย์การกำหนดค่ารายช่องทางถูกย้ายไปยังหน้าเฉพาะแล้ว - ดู [การกำหนดค่า - ช่องทาง](/th/gateway/config-channels) สำหรับ `channels.*` รวมถึง Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และช่องทาง bundled อื่นๆ (การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี, mention gating)

## ค่าเริ่มต้นของเอเจนต์, หลายเอเจนต์, เซสชัน และข้อความ

ย้ายไปยังหน้าเฉพาะแล้ว - ดู [การกำหนดค่า - เอเจนต์](/th/gateway/config-agents) สำหรับ:

- `agents.defaults.*` (เวิร์กสเปซ, โมเดล, การคิด, heartbeat, หน่วยความจำ, สื่อ, skills, sandbox)
- `multiAgent.*` (การกำหนดเส้นทางและการผูกหลายเอเจนต์)
- `session.*` (วงจรชีวิตเซสชัน, Compaction, การตัดทอน)
- `messages.*` (การส่งข้อความ, TTS, การเรนเดอร์ markdown)
- `talk.*` (โหมด Talk)
  - `talk.consultThinkingLevel`: การแทนที่ระดับการคิดสำหรับการรันเอเจนต์ OpenClaw ทั้งหมดที่อยู่เบื้องหลังการปรึกษาแบบเรียลไทม์ของ Control UI Talk
  - `talk.consultFastMode`: การแทนที่โหมดเร็วแบบครั้งเดียวสำหรับการปรึกษาแบบเรียลไทม์ของ Control UI Talk
  - `talk.speechLocale`: รหัส locale BCP 47 แบบไม่บังคับสำหรับการรู้จำเสียงพูดของ Talk บน iOS/macOS
  - `talk.silenceTimeoutMs`: เมื่อไม่ได้ตั้งค่า Talk จะคงหน้าต่างหยุดพูดค่าเริ่มต้นของแพลตฟอร์มไว้ก่อนส่ง transcript (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: fallback การรีเลย์ของ Gateway สำหรับ transcript Talk แบบเรียลไทม์ที่สรุปแล้วซึ่งข้าม `openclaw_agent_consult`

## เครื่องมือและผู้ให้บริการกำหนดเอง

นโยบายเครื่องมือ, toggle ทดลอง, การกำหนดค่าเครื่องมือที่มีผู้ให้บริการรองรับ และการตั้งค่าผู้ให้บริการกำหนดเอง / base-URL ถูกย้ายไปยังหน้าเฉพาะแล้ว - ดู [การกำหนดค่า - เครื่องมือและผู้ให้บริการกำหนดเอง](/th/gateway/config-tools)

## โมเดล

นิยามผู้ให้บริการ, allowlist โมเดล และการตั้งค่าผู้ให้บริการกำหนดเองอยู่ใน [การกำหนดค่า - เครื่องมือและผู้ให้บริการกำหนดเอง](/th/gateway/config-tools#custom-providers-and-base-urls)
รูท `models` ยังเป็นเจ้าของพฤติกรรมแค็ตตาล็อกโมเดลส่วนกลางด้วย

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: พฤติกรรมแค็ตตาล็อกผู้ให้บริการ (`merge` หรือ `replace`)
- `models.providers`: แผนที่ผู้ให้บริการกำหนดเองที่ใช้ id ผู้ให้บริการเป็นคีย์
- `models.providers.*.localService`: ตัวจัดการ process แบบตามต้องการที่ไม่บังคับสำหรับเซิร์ฟเวอร์โมเดล local OpenClaw probe health endpoint ที่กำหนดค่าไว้, เริ่ม `command` แบบ absolute เมื่อจำเป็น, รอความพร้อม แล้วจึงส่งคำขอโมเดล ดู [บริการโมเดล Local](/th/gateway/local-model-services)
- `models.pricing.enabled`: ควบคุม bootstrap ราคาพื้นหลังที่เริ่มหลังจาก sidecar และช่องทางเข้าสู่พาธ Gateway ready เมื่อเป็น `false` Gateway จะข้ามการดึงแค็ตตาล็อกราคาของ OpenRouter และ LiteLLM; ค่า `models.providers.*.models[].cost` ที่กำหนดค่าไว้ยังคงใช้ได้สำหรับการประมาณค่าใช้จ่าย local

## MCP

นิยามเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการอยู่ใต้ `mcp.servers` และถูกใช้โดย OpenClaw แบบฝังและ runtime adapter อื่นๆ คำสั่ง `openclaw mcp list`, `show`, `set` และ `unset` จัดการบล็อกนี้โดยไม่เชื่อมต่อกับเซิร์ฟเวอร์เป้าหมายระหว่างการแก้ไขการกำหนดค่า

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

- `mcp.servers`: นิยามเซิร์ฟเวอร์ MCP แบบ stdio หรือ remote ที่ตั้งชื่อไว้สำหรับ runtime ที่เปิดเผยเครื่องมือ MCP ที่กำหนดค่าไว้ รายการ remote ใช้ `transport: "streamable-http"` หรือ `transport: "sse"`; `type: "http"` เป็น alias แบบ CLI-native ที่ `openclaw mcp set` และ `openclaw doctor --fix` normalize เป็นฟิลด์ `transport` ตามรูปแบบ canonical
- `mcp.servers.<name>.enabled`: ตั้งเป็น `false` เพื่อเก็บนิยามเซิร์ฟเวอร์ที่บันทึกไว้ขณะตัดออกจากการค้นพบ MCP และการ projection เครื่องมือของ OpenClaw แบบฝัง
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: timeout คำขอ MCP ต่อเซิร์ฟเวอร์เป็นวินาทีหรือมิลลิวินาที
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: timeout การเชื่อมต่อต่อเซิร์ฟเวอร์เป็นวินาทีหรือมิลลิวินาที
- `mcp.servers.<name>.supportsParallelToolCalls`: คำใบ้ concurrency แบบไม่บังคับสำหรับ adapter ที่สามารถเลือกว่าจะออกคำสั่งเรียกเครื่องมือ MCP แบบขนานหรือไม่
- `mcp.servers.<name>.auth`: ตั้งเป็น `"oauth"` สำหรับเซิร์ฟเวอร์ HTTP MCP ที่ต้องใช้ OAuth รัน `openclaw mcp login <name>` เพื่อจัดเก็บ token ใต้ state ของ OpenClaw
- `mcp.servers.<name>.oauth`: การแทนที่ scope OAuth, URL redirect และ URL เมตาดาต้า client แบบไม่บังคับ
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: การควบคุม HTTP TLS สำหรับ endpoint ส่วนตัวและ mutual TLS
- `mcp.servers.<name>.toolFilter`: การเลือกเครื่องมือต่อเซิร์ฟเวอร์แบบไม่บังคับ `include` จำกัดเครื่องมือ MCP ที่ค้นพบให้เหลือเฉพาะชื่อที่ตรงกัน; `exclude` ซ่อนชื่อที่ตรงกัน รายการเป็นชื่อเครื่องมือ MCP แบบตรงตัวหรือ glob `*` แบบง่าย เซิร์ฟเวอร์ที่มี resources หรือ prompts จะสร้างชื่อเครื่องมือ utility ด้วย (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) และชื่อเหล่านั้นใช้ filter เดียวกัน
- `mcp.servers.<name>.codex`: การควบคุม projection ของ Codex app-server แบบไม่บังคับ บล็อกนี้เป็นเมตาดาต้าของ OpenClaw สำหรับเธรด Codex app-server เท่านั้น; ไม่กระทบเซสชัน ACP, การกำหนดค่า generic Codex harness หรือ runtime adapter อื่นๆ `codex.agents` ที่ไม่ว่างจะจำกัดเซิร์ฟเวอร์ให้เฉพาะ id เอเจนต์ OpenClaw ที่ระบุ รายการเอเจนต์ที่จำกัด scope ซึ่งว่าง เปล่า หรือไม่ถูกต้องจะถูกปฏิเสธโดยการตรวจสอบความถูกต้องของการกำหนดค่า และถูกละเว้นโดยพาธ runtime projection แทนที่จะกลายเป็น global `codex.defaultToolsApprovalMode` จะ emit ค่า native ของ Codex ชื่อ `default_tools_approval_mode` สำหรับเซิร์ฟเวอร์นั้น OpenClaw จะตัดบล็อก `codex` ออกก่อนส่งการกำหนดค่า `mcp_servers` แบบ native ให้ Codex เว้นบล็อกนี้ไว้เพื่อคงการ projection เซิร์ฟเวอร์สำหรับเอเจนต์ Codex app-server ทุกตัวด้วยพฤติกรรมการอนุมัติ MCP ค่าเริ่มต้นของ Codex
- `mcp.sessionIdleTtlMs`: idle TTL สำหรับ runtime MCP bundled ที่จำกัดตามเซสชัน การรันแบบฝังครั้งเดียวร้องขอการล้างข้อมูลเมื่อจบการรัน; TTL นี้เป็น backstop สำหรับเซสชันที่มีอายุยาวและ caller ในอนาคต
- การเปลี่ยนแปลงใต้ `mcp.*` จะ hot-apply โดย dispose runtime MCP ของเซสชันที่ cache ไว้ การค้นพบ/ใช้งานเครื่องมือครั้งถัดไปจะสร้างใหม่จากการกำหนดค่าใหม่ ดังนั้นรายการ `mcp.servers` ที่ถูกลบจะถูก reap ทันทีแทนที่จะรอ idle TTL
- การค้นพบ runtime ยังเคารพการแจ้งเตือนการเปลี่ยนแปลงรายการเครื่องมือ MCP โดย drop แค็ตตาล็อกที่ cache ไว้สำหรับเซสชันนั้น เซิร์ฟเวอร์ที่ประกาศ resources หรือ prompts จะได้เครื่องมือ utility สำหรับแสดงรายการ/อ่าน resources และแสดงรายการ/ดึง prompts ความล้มเหลวของการเรียกเครื่องมือซ้ำๆ จะ pause เซิร์ฟเวอร์ที่ได้รับผลกระทบชั่วคราวก่อนลองเรียกอีกครั้ง

ดู [MCP](/th/cli/mcp#openclaw-as-an-mcp-client-registry) และ [แบ็กเอนด์ CLI](/th/gateway/cli-backends#bundle-mcp-overlays) สำหรับพฤติกรรม runtime

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

- `allowBundled`: allowlist แบบไม่บังคับสำหรับ skills bundled เท่านั้น (ไม่กระทบ skills ที่จัดการ/ในเวิร์กสเปซ)
- `load.extraDirs`: root skill ที่ใช้ร่วมกันเพิ่มเติม (ลำดับความสำคัญต่ำสุด)
- `load.allowSymlinkTargets`: root เป้าหมายจริงที่เชื่อถือได้ซึ่ง symlink ของ skill อาจ resolve เข้าไปได้เมื่อ link อยู่ข้างนอก root แหล่งที่มาที่กำหนดค่าไว้
- `workshop.allowSymlinkTargetWrites`: อนุญาตให้ Skill Workshop apply เขียนผ่านเป้าหมาย symlink ที่เชื่อถือแล้ว (ค่าเริ่มต้น: false)
- `install.preferBrew`: เมื่อเป็น true ให้เลือกตัวติดตั้ง Homebrew ก่อนเมื่อมี `brew` แล้วจึง fallback ไปยังประเภทตัวติดตั้งอื่น
- `install.nodeManager`: ค่ากำหนดตัวติดตั้ง node สำหรับสเปก `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`)
- `install.allowUploadedArchives`: อนุญาตให้ client Gateway ที่เชื่อถือได้ระดับ `operator.admin` ติดตั้ง archive zip ส่วนตัวที่ staged ผ่าน `skills.upload.*` (ค่าเริ่มต้น: false) ตัวเลือกนี้เปิดใช้งานเฉพาะพาธ uploaded-archive เท่านั้น; การติดตั้ง ClawHub ปกติไม่ต้องใช้
- `entries.<skillKey>.enabled: false` ปิดใช้งาน skill แม้จะ bundled/ติดตั้งแล้ว
- `entries.<skillKey>.apiKey`: ความสะดวกสำหรับ skills ที่ประกาศ env var หลัก (สตริง plaintext หรือออบเจ็กต์ SecretRef)

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

- โหลดจากไดเรกทอรีแพ็กเกจหรือบันเดิลภายใต้ `~/.openclaw/extensions` และ `<workspace>/.openclaw/extensions` รวมถึงไฟล์หรือไดเรกทอรีที่ระบุใน `plugins.load.paths`
- ใส่ไฟล์ plugin แบบสแตนด์อโลนใน `plugins.load.paths`; รากส่วนขยายที่ค้นพบอัตโนมัติจะละเว้นไฟล์ `.js`, `.mjs` และ `.ts` ระดับบนสุด เพื่อไม่ให้สคริปต์ตัวช่วยในรากเหล่านั้นขัดขวางการเริ่มทำงาน
- การค้นพบรองรับ OpenClaw plugins แบบเนทีฟ รวมถึงบันเดิล Codex และบันเดิล Claude ที่เข้ากันได้ รวมถึงบันเดิลเลย์เอาต์เริ่มต้นของ Claude ที่ไม่มี manifest
- **การเปลี่ยนแปลง config ต้องรีสตาร์ต Gateway**
- `allow`: allowlist แบบไม่บังคับ (โหลดเฉพาะ plugins ที่ระบุไว้) `deny` มีสิทธิ์เหนือกว่า
- `plugins.entries.<id>.apiKey`: ฟิลด์อำนวยความสะดวกสำหรับคีย์ API ระดับ plugin (เมื่อ plugin รองรับ)
- `plugins.entries.<id>.env`: แผนที่ตัวแปร env เฉพาะ plugin
- `plugins.entries.<id>.hooks.allowPromptInjection`: เมื่อเป็น `false` แกนหลักจะบล็อก `before_prompt_build` และละเว้นฟิลด์ที่แก้ไขพรอมป์จาก `before_agent_start` แบบ legacy โดยยังคงรักษา `modelOverride` และ `providerOverride` แบบ legacy ไว้ ใช้กับ hooks ของ plugin แบบเนทีฟและไดเรกทอรี hook ที่บันเดิลที่รองรับจัดหาให้
- `plugins.entries.<id>.hooks.allowConversationAccess`: เมื่อเป็น `true` plugins ที่ไม่ได้บันเดิลและเชื่อถือได้อาจอ่านข้อความสนทนาดิบจาก typed hooks เช่น `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` และ `agent_end`
- `plugins.entries.<id>.subagent.allowModelOverride`: เชื่อถือ plugin นี้อย่างชัดเจนให้ร้องขอการ override `provider` และ `model` รายรันสำหรับการรัน subagent เบื้องหลัง
- `plugins.entries.<id>.subagent.allowedModels`: allowlist แบบไม่บังคับของเป้าหมาย `provider/model` แบบ canonical สำหรับการ override subagent ที่เชื่อถือได้ ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาตโมเดลใดก็ได้
- `plugins.entries.<id>.llm.allowModelOverride`: เชื่อถือ plugin นี้อย่างชัดเจนให้ร้องขอการ override โมเดลสำหรับ `api.runtime.llm.complete`
- `plugins.entries.<id>.llm.allowedModels`: allowlist แบบไม่บังคับของเป้าหมาย `provider/model` แบบ canonical สำหรับการ override การทำ LLM completion ของ plugin ที่เชื่อถือได้ ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจอนุญาตโมเดลใดก็ได้
- `plugins.entries.<id>.llm.allowAgentIdOverride`: เชื่อถือ plugin นี้อย่างชัดเจนให้รัน `api.runtime.llm.complete` กับ agent id ที่ไม่ใช่ค่าเริ่มต้น
- `plugins.entries.<id>.config`: ออบเจ็กต์ config ที่ plugin กำหนด (ตรวจสอบความถูกต้องโดย schema ของ OpenClaw plugin แบบเนทีฟเมื่อมี)
- การตั้งค่าบัญชี/รันไทม์ของ channel plugin อยู่ภายใต้ `channels.<id>` และควรอธิบายด้วยเมทาดาทา `channelConfigs` ใน manifest ของ plugin เจ้าของ ไม่ใช่ด้วยรีจิสทรีตัวเลือกกลางของ OpenClaw

### การกำหนดค่า Plugin ฮาร์เนส Codex

Plugin `codex` ที่บันเดิลมาด้วยเป็นเจ้าของการตั้งค่าฮาร์เนส app-server ของ Codex แบบเนทีฟภายใต้
`plugins.entries.codex.config` ดู
[เอกสารอ้างอิงฮาร์เนส Codex](/th/plugins/codex-harness-reference) สำหรับพื้นผิว config ทั้งหมด
และ [ฮาร์เนส Codex](/th/plugins/codex-harness) สำหรับโมเดลรันไทม์

`codexPlugins` ใช้กับเซสชันที่เลือกฮาร์เนส Codex แบบเนทีฟเท่านั้น
ไม่ได้เปิดใช้ Codex plugins สำหรับการรันผู้ให้บริการ OpenClaw, ACP
conversation bindings หรือฮาร์เนสที่ไม่ใช่ Codex ใดๆ

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

- `plugins.entries.codex.config.codexPlugins.enabled`: เปิดใช้การรองรับ
  plugin/app แบบเนทีฟของ Codex สำหรับฮาร์เนส Codex ค่าเริ่มต้น: `false`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  นโยบาย destructive-action เริ่มต้นสำหรับ plugin app elicitations ที่ย้ายมา
  ใช้ `true` เพื่อยอมรับ schema การอนุมัติ Codex ที่ปลอดภัยโดยไม่ต้องถาม, `false`
  เพื่อปฏิเสธ, `"auto"` เพื่อกำหนดเส้นทางการอนุมัติที่ Codex ต้องการผ่านการอนุมัติ
  plugin ของ OpenClaw หรือ `"ask"` เพื่อถามสำหรับการเขียน/การกระทำแบบทำลายล้างของ plugin ทุกครั้ง
  โดยไม่มีการอนุมัติแบบ durable โหมด `"ask"` จะล้างการ override การอนุมัติรายเครื่องมือ
  แบบ durable ของ Codex สำหรับ app ที่ได้รับผลกระทบ และเลือกผู้ตรวจทานการอนุมัติ
  แบบมนุษย์สำหรับ app นั้นก่อนที่เธรด Codex จะเริ่ม
  ค่าเริ่มต้น: `true`
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: เปิดใช้รายการ
  plugin ที่ย้ายมาเมื่อ global `codexPlugins.enabled` เป็น true ด้วย
  ค่าเริ่มต้น: `true` สำหรับรายการที่ระบุอย่างชัดเจน
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  อัตลักษณ์ marketplace ที่เสถียร V1 รองรับเฉพาะ `"openai-curated"`
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: อัตลักษณ์
  Codex plugin ที่เสถียรจากการย้าย เช่น `"google-calendar"`
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  การ override destructive-action ราย plugin เมื่อเว้นไว้ จะใช้ค่า
  `allow_destructive_actions` ระดับ global ค่าราย plugin รองรับนโยบาย
  `true`, `false`, `"auto"` หรือ `"ask"` แบบเดียวกัน

plugin app แต่ละตัวที่ได้รับอนุญาตและใช้ `"ask"` จะกำหนดเส้นทางคำขออนุมัติของ app นั้น
ไปยังผู้ตรวจทานที่เป็นมนุษย์ app อื่นๆ และการอนุมัติเธรดที่ไม่ใช่ app จะยังคงใช้
ผู้ตรวจทานที่กำหนดค่าไว้ ดังนั้นนโยบาย plugin แบบผสมจะไม่สืบทอดพฤติกรรม `"ask"`

`codexPlugins.enabled` คือคำสั่งเปิดใช้งานระดับ global รายการ plugin
ที่เขียนโดยการย้ายคือชุดการติดตั้งแบบ durable และสิทธิ์ในการซ่อมแซม
ไม่รองรับ `plugins["*"]` ไม่มีสวิตช์ `install` และค่า
`marketplacePath` ในเครื่องตั้งใจไม่ให้เป็นฟิลด์ config เพราะเป็นค่าเฉพาะโฮสต์

การตรวจสอบความพร้อมของ `app/list` ถูกแคชไว้หนึ่งชั่วโมงและรีเฟรช
แบบอะซิงโครนัสเมื่อเก่า config app ของเธรด Codex ถูกคำนวณเมื่อสร้างเซสชันฮาร์เนส
Codex ไม่ใช่ทุกเทิร์น; ใช้ `/new`, `/reset` หรือรีสตาร์ต Gateway
หลังจากเปลี่ยน config plugin แบบเนทีฟ

- `plugins.entries.firecrawl.config.webFetch`: การตั้งค่าผู้ให้บริการ web-fetch ของ Firecrawl
  - `apiKey`: คีย์ API ของ Firecrawl แบบไม่บังคับสำหรับขีดจำกัดที่สูงขึ้น (รองรับ SecretRef) fallback ไปที่ `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey` หรือ env var `FIRECRAWL_API_KEY`
  - `baseUrl`: URL ฐานของ API Firecrawl (ค่าเริ่มต้น: `https://api.firecrawl.dev`; การ override แบบ self-hosted ต้องชี้ไปยัง endpoint ส่วนตัว/ภายใน)
  - `onlyMainContent`: ดึงเฉพาะเนื้อหาหลักจากหน้าเว็บ (ค่าเริ่มต้น: `true`)
  - `maxAgeMs`: อายุแคชสูงสุดเป็นมิลลิวินาที (ค่าเริ่มต้น: `172800000` / 2 วัน)
  - `timeoutSeconds`: timeout ของคำขอ scrape เป็นวินาที (ค่าเริ่มต้น: `60`)
- `plugins.entries.xai.config.xSearch`: การตั้งค่า xAI X Search (การค้นหาเว็บ Grok)
  - `enabled`: เปิดใช้ผู้ให้บริการ X Search
  - `model`: โมเดล Grok ที่ใช้สำหรับการค้นหา (เช่น `"grok-4-1-fast"`)
- `plugins.entries.memory-core.config.dreaming`: การตั้งค่า memory dreaming ดู [Dreaming](/th/concepts/dreaming) สำหรับ phase และ threshold
  - `enabled`: สวิตช์ dreaming หลัก (ค่าเริ่มต้น `false`)
  - `frequency`: cadence แบบ cron สำหรับการ sweep dreaming เต็มรูปแบบแต่ละครั้ง (`"0 3 * * *"` โดยค่าเริ่มต้น)
  - `model`: การ override โมเดล subagent ของ Dream Diary แบบไม่บังคับ ต้องมี `plugins.entries.memory-core.subagent.allowModelOverride: true`; จับคู่กับ `allowedModels` เพื่อจำกัดเป้าหมาย ข้อผิดพลาดโมเดลไม่พร้อมใช้งานจะ retry หนึ่งครั้งด้วยโมเดลค่าเริ่มต้นของเซสชัน; ความล้มเหลวด้าน trust หรือ allowlist จะไม่ fallback แบบเงียบๆ
  - นโยบาย phase และ threshold เป็นรายละเอียดการใช้งานภายใน (ไม่ใช่คีย์ config สำหรับผู้ใช้)
- config หน่วยความจำฉบับเต็มอยู่ใน [เอกสารอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Claude bundle plugins ที่เปิดใช้ยังสามารถเพิ่มค่าเริ่มต้น OpenClaw แบบฝังจาก `settings.json`; OpenClaw ใช้ค่าเหล่านั้นเป็นการตั้งค่า agent ที่ sanitize แล้ว ไม่ใช่เป็นแพตช์ config ดิบของ OpenClaw
- `plugins.slots.memory`: เลือก plugin id หน่วยความจำที่ใช้งานอยู่ หรือ `"none"` เพื่อปิดใช้ memory plugins
- `plugins.slots.contextEngine`: เลือก plugin id ของ context engine ที่ใช้งานอยู่; ค่าเริ่มต้นเป็น `"legacy"` เว้นแต่คุณติดตั้งและเลือก engine อื่น

ดู [Plugin](/th/tools/plugin)

---

## ข้อผูกมัด

`commitments` ควบคุมหน่วยความจำการติดตามผลที่อนุมานได้: OpenClaw สามารถตรวจพบการ check-in จากเทิร์นการสนทนาและส่งผ่านการรัน Heartbeat

- `commitments.enabled`: เปิดใช้การดึงข้อมูลด้วย LLM แบบซ่อน, การจัดเก็บ และการส่งผ่าน Heartbeat สำหรับข้อผูกมัดติดตามผลที่อนุมานได้ ค่าเริ่มต้น: `false`
- `commitments.maxPerDay`: จำนวนข้อผูกมัดติดตามผลที่อนุมานได้สูงสุดที่ส่งต่อเซสชัน agent ในหนึ่งวันแบบ rolling ค่าเริ่มต้น: `3`

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

- `evaluateEnabled: false` ปิดใช้งาน `act:evaluate` และ `wait --fn`
- `tabCleanup` เรียกคืนแท็บ primary-agent ที่ติดตามไว้หลังจากเวลาว่างงาน หรือเมื่อ
  เซสชันเกินขีดจำกัดของตัวเอง ตั้งค่า `idleMinutes: 0` หรือ `maxTabsPerSession: 0` เพื่อ
  ปิดใช้งานโหมดล้างข้อมูลแต่ละแบบเหล่านั้น
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` จะถูกปิดใช้งานเมื่อไม่ได้ตั้งค่า ดังนั้นการนำทางของเบราว์เซอร์จึงยังเข้มงวดตามค่าเริ่มต้น
- ตั้งค่า `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เฉพาะเมื่อคุณตั้งใจไว้วางใจการนำทางของเบราว์เซอร์บนเครือข่ายส่วนตัว
- ในโหมดเข้มงวด ปลายทางโปรไฟล์ CDP ระยะไกล (`profiles.*.cdpUrl`) จะอยู่ภายใต้การบล็อกเครือข่ายส่วนตัวแบบเดียวกันระหว่างการตรวจสอบการเข้าถึง/การค้นพบ
- `ssrfPolicy.allowPrivateNetwork` ยังคงรองรับในฐานะนามแฝงดั้งเดิม
- ในโหมดเข้มงวด ให้ใช้ `ssrfPolicy.hostnameAllowlist` และ `ssrfPolicy.allowedHostnames` สำหรับข้อยกเว้นที่ระบุอย่างชัดเจน
- โปรไฟล์ระยะไกลเป็นแบบแนบเท่านั้น (ปิดใช้งานการเริ่ม/หยุด/รีเซ็ต)
- `profiles.*.cdpUrl` รับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) เมื่อคุณต้องการให้ OpenClaw ค้นพบ `/json/version`; ใช้ WS(S)
  เมื่อผู้ให้บริการของคุณให้ URL DevTools WebSocket โดยตรง
- `remoteCdpTimeoutMs` และ `remoteCdpHandshakeTimeoutMs` ใช้กับการเข้าถึง CDP ระยะไกลและ
  `attachOnly` รวมถึงคำขอเปิดแท็บ โปรไฟล์ loopback ที่จัดการไว้
  จะคงค่าเริ่มต้น CDP ภายในไว้
- หากบริการ CDP ที่จัดการจากภายนอกเข้าถึงได้ผ่าน loopback ให้ตั้งค่า
  `attachOnly: true` ให้โปรไฟล์นั้น; มิฉะนั้น OpenClaw จะถือว่าพอร์ต loopback เป็น
  โปรไฟล์เบราว์เซอร์ภายในที่จัดการไว้ และอาจรายงานข้อผิดพลาดความเป็นเจ้าของพอร์ตภายใน
- โปรไฟล์ `existing-session` ใช้ Chrome MCP แทน CDP และสามารถแนบได้บน
  โฮสต์ที่เลือก หรือผ่านโหนดเบราว์เซอร์ที่เชื่อมต่ออยู่
- โปรไฟล์ `existing-session` สามารถตั้งค่า `userDataDir` เพื่อเล็งไปยัง
  โปรไฟล์เบราว์เซอร์ที่ใช้ Chromium เฉพาะ เช่น Brave หรือ Edge
- โปรไฟล์ `existing-session` สามารถตั้งค่า `cdpUrl` เมื่อ Chrome กำลังทำงานอยู่แล้ว
  หลังปลายทางการค้นพบ DevTools HTTP(S) หรือปลายทาง WS(S) โดยตรง ใน
  โหมดนั้น OpenClaw จะส่งปลายทางให้ Chrome MCP แทนการใช้การเชื่อมต่ออัตโนมัติ;
  `userDataDir` จะถูกละเว้นสำหรับอาร์กิวเมนต์การเปิด Chrome MCP
- โปรไฟล์ `existing-session` ยังคงมีข้อจำกัดเส้นทาง Chrome MCP ปัจจุบัน:
  การกระทำที่ขับเคลื่อนด้วยสแนปช็อต/ref แทนการกำหนดเป้าหมายด้วยตัวเลือก CSS, ฮุกอัปโหลดไฟล์เดียว,
  ไม่มีการแทนที่ระยะหมดเวลาของกล่องโต้ตอบ, ไม่มี `wait --load networkidle` และไม่มี
  `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด หรือการกระทำแบบชุด
- โปรไฟล์ `openclaw` ภายในที่จัดการไว้จะกำหนด `cdpPort` และ `cdpUrl` อัตโนมัติ; ตั้งค่า
  `cdpUrl` อย่างชัดเจนเฉพาะสำหรับโปรไฟล์ CDP ระยะไกล หรือการแนบปลายทาง existing-session
- โปรไฟล์ภายในที่จัดการไว้สามารถตั้งค่า `executablePath` เพื่อแทนที่
  `browser.executablePath` ทั่วโลกสำหรับโปรไฟล์นั้น ใช้สิ่งนี้เพื่อรันโปรไฟล์หนึ่งใน
  Chrome และอีกโปรไฟล์หนึ่งใน Brave
- โปรไฟล์ภายในที่จัดการไว้ใช้ `browser.localLaunchTimeoutMs` สำหรับการค้นพบ Chrome CDP HTTP
  หลังจากเริ่มกระบวนการ และใช้ `browser.localCdpReadyTimeoutMs` สำหรับ
  ความพร้อมของ CDP websocket หลังการเปิด เพิ่มค่าเหล่านี้บนโฮสต์ที่ช้ากว่า ซึ่ง Chrome
  เริ่มได้สำเร็จแต่การตรวจสอบความพร้อมแข่งกับการเริ่มต้น ทั้งสองค่าต้องเป็น
  จำนวนเต็มบวกไม่เกิน `120000` มิลลิวินาที; ค่าคอนฟิกที่ไม่ถูกต้องจะถูกปฏิเสธ
- ลำดับการตรวจหาอัตโนมัติ: เบราว์เซอร์เริ่มต้นหากใช้ Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary
- `browser.executablePath` และ `browser.profiles.<name>.executablePath` ทั้งคู่
  รับ `~` และ `~/...` สำหรับไดเรกทอรีโฮมของ OS ก่อนเปิด Chromium
  `userDataDir` ต่อโปรไฟล์บนโปรไฟล์ `existing-session` จะถูกขยายเครื่องหมายตัวหนอนด้วย
- บริการควบคุม: loopback เท่านั้น (พอร์ตได้มาจาก `gateway.port`, ค่าเริ่มต้น `18791`)
- `extraArgs` ผนวกแฟล็กเปิดเพิ่มเติมให้การเริ่ม Chromium ภายใน (เช่น
  `--disable-gpu`, การกำหนดขนาดหน้าต่าง หรือแฟล็กดีบัก)

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

- `seamColor`: สีเน้นสำหรับโครม UI แอปเนทีฟ (สีแต้มบับเบิล Talk Mode เป็นต้น)
- `assistant`: การแทนที่ตัวตน Control UI ย้อนกลับไปใช้ตัวตนเอเจนต์ที่ใช้งานอยู่

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

- `mode`: `local` (เรียกใช้ gateway) หรือ `remote` (เชื่อมต่อกับ gateway ระยะไกล) Gateway จะปฏิเสธการเริ่มทำงาน เว้นแต่จะเป็น `local`.
- `port`: พอร์ตเดียวแบบ multiplexed สำหรับ WS + HTTP ลำดับความสำคัญ: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (ค่าเริ่มต้น), `lan` (`0.0.0.0`), `tailnet` (IP ของ Tailscale เท่านั้น) หรือ `custom`.
- **นามแฝง bind แบบเก่า**: ใช้ค่าโหมด bind ใน `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`) ไม่ใช่นามแฝง host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **หมายเหตุ Docker**: bind ค่าเริ่มต้น `loopback` จะฟังที่ `127.0.0.1` ภายในคอนเทนเนอร์ เมื่อใช้เครือข่ายแบบ Docker bridge (`-p 18789:18789`) ทราฟฟิกจะเข้ามาที่ `eth0` ดังนั้น gateway จะเข้าถึงไม่ได้ ใช้ `--network host` หรือตั้งค่า `bind: "lan"` (หรือ `bind: "custom"` พร้อม `customBindHost: "0.0.0.0"`) เพื่อฟังบนทุกอินเทอร์เฟซ.
- **การยืนยันตัวตน**: จำเป็นตามค่าเริ่มต้น bind ที่ไม่ใช่ loopback ต้องใช้การยืนยันตัวตนของ gateway ในทางปฏิบัติหมายถึงโทเค็น/รหัสผ่านร่วมกัน หรือ reverse proxy ที่รับรู้ตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"` วิซาร์ดเริ่มต้นใช้งานจะสร้างโทเค็นตามค่าเริ่มต้น.
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) ให้ตั้งค่า `gateway.auth.mode` เป็น `token` หรือ `password` อย่างชัดเจน โฟลว์เริ่มต้นและติดตั้ง/ซ่อมแซมบริการจะล้มเหลวเมื่อกำหนดค่าทั้งสองอย่างและไม่ได้ตั้งค่า mode.
- `gateway.auth.mode: "none"`: โหมดไม่มีการยืนยันตัวตนแบบชัดเจน ใช้เฉพาะสำหรับการตั้งค่า local loopback ที่เชื่อถือได้เท่านั้น; ค่านี้จึงจงใจไม่ถูกเสนอในพรอมป์เริ่มต้นใช้งาน.
- `gateway.auth.mode: "trusted-proxy"`: มอบหมายการยืนยันตัวตนของเบราว์เซอร์/ผู้ใช้ให้ reverse proxy ที่รับรู้ตัวตน และเชื่อถือ header ตัวตนจาก `gateway.trustedProxies` (ดู [การยืนยันตัวตนผ่านพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth)) โหมดนี้คาดหวังแหล่ง proxy แบบ **ไม่ใช่ loopback** ตามค่าเริ่มต้น; reverse proxy แบบ loopback บน host เดียวกันต้องตั้งค่า `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน ผู้เรียกภายในบน host เดียวกันสามารถใช้ `gateway.auth.password` เป็น fallback โดยตรงในเครื่องได้; `gateway.auth.token` ยังคงใช้ร่วมกับโหมด trusted-proxy ไม่ได้.
- `gateway.auth.allowTailscale`: เมื่อเป็น `true` header ตัวตนของ Tailscale Serve สามารถใช้ผ่านการยืนยันตัวตนของส่วนติดต่อควบคุม/WebSocket ได้ (ตรวจสอบผ่าน `tailscale whois`) endpoint ของ HTTP API จะ **ไม่** ใช้การยืนยันตัวตนด้วย header ของ Tailscale นั้น; แต่จะใช้โหมดการยืนยันตัวตน HTTP ปกติของ gateway แทน โฟลว์แบบไม่มีโทเค็นนี้ถือว่า host ของ gateway เชื่อถือได้ ค่าเริ่มต้นเป็น `true` เมื่อ `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: ตัวจำกัดการยืนยันตัวตนล้มเหลวแบบไม่บังคับ ใช้ต่อ IP ไคลเอนต์และต่อขอบเขตการยืนยันตัวตน (shared-secret และ device-token ถูกติดตามแยกกัน) ความพยายามที่ถูกบล็อกจะคืน `429` + `Retry-After`.
  - บนเส้นทางส่วนติดต่อควบคุมแบบ async ของ Tailscale Serve ความพยายามที่ล้มเหลวสำหรับ `{scope, clientIp}` เดียวกันจะถูกเรียงลำดับก่อนเขียนผลล้มเหลว ดังนั้นความพยายามผิดพร้อมกันจากไคลเอนต์เดียวกันอาจทำให้ตัวจำกัดทำงานที่คำขอที่สอง แทนที่ทั้งคู่จะวิ่งผ่านไปเป็นการไม่ตรงกันธรรมดา.
  - `gateway.auth.rateLimit.exemptLoopback` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เมื่อคุณตั้งใจให้ทราฟฟิก localhost ถูกจำกัดอัตราด้วย (สำหรับการตั้งค่าทดสอบหรือการ deploy proxy ที่เข้มงวด).
- ความพยายามยืนยันตัวตน WS จาก origin ของเบราว์เซอร์จะถูก throttle เสมอโดยปิดการยกเว้น loopback (การป้องกันเชิงลึกจากการ brute force localhost ผ่านเบราว์เซอร์).
- บน loopback การ lockout จาก origin ของเบราว์เซอร์เหล่านั้นจะแยกตามค่า `Origin`
  ที่ normalize แล้ว ดังนั้นความล้มเหลวซ้ำจาก localhost origin หนึ่งจะไม่
  lock out origin อื่นโดยอัตโนมัติ.
- `tailscale.mode`: `serve` (เฉพาะ tailnet, bind แบบ loopback) หรือ `funnel` (สาธารณะ, ต้องมีการยืนยันตัวตน).
- `tailscale.serviceName`: ชื่อ Service ของ Tailscale แบบไม่บังคับสำหรับโหมด Serve เช่น
  `svc:openclaw` เมื่อตั้งค่าแล้ว OpenClaw จะส่งค่านี้ให้ `tailscale serve
--service` เพื่อให้ส่วนติดต่อควบคุมถูกเปิดผ่าน Service ที่ตั้งชื่อไว้แทน
  hostname ของอุปกรณ์ ค่าต้องใช้รูปแบบชื่อ Service ของ Tailscale แบบ `svc:<dns-label>`;
  การเริ่มต้นจะรายงาน URL ของ Service ที่ได้มา.
- `tailscale.preserveFunnel`: เมื่อเป็น `true` และ `tailscale.mode = "serve"` OpenClaw
  จะตรวจสอบ `tailscale funnel status` ก่อนใช้ Serve อีกครั้งตอนเริ่มต้น และข้าม
  หาก route ของ Funnel ที่กำหนดค่าจากภายนอกครอบคลุมพอร์ต gateway อยู่แล้ว
  ค่าเริ่มต้นคือ `false`.
- `controlUi.allowedOrigins`: allowlist ของ origin เบราว์เซอร์แบบชัดเจนสำหรับการเชื่อมต่อ WebSocket ของ Gateway จำเป็นสำหรับ origin เบราว์เซอร์สาธารณะที่ไม่ใช่ loopback การโหลด UI แบบ LAN/Tailnet ส่วนตัวที่เป็น same-origin จาก loopback, RFC1918/link-local, `.local`, `.ts.net` หรือ host Tailscale CGNAT จะได้รับการยอมรับโดยไม่ต้องเปิดใช้ fallback ของ Host-header.
- `controlUi.chatMessageMaxWidth`: ความกว้างสูงสุดแบบไม่บังคับสำหรับข้อความแชทของส่วนติดต่อควบคุมที่จัดกลุ่มแล้ว รับค่าความกว้าง CSS แบบจำกัด เช่น `960px`, `82%`, `min(1280px, 82%)` และ `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: โหมดอันตรายที่เปิดใช้ fallback ของ origin จาก Host-header สำหรับการ deploy ที่ตั้งใจพึ่งพานโยบาย origin จาก Host-header.
- `remote.transport`: `ssh` (ค่าเริ่มต้น) หรือ `direct` (ws/wss) สำหรับ `direct`, `remote.url` ต้องเป็น `wss://` สำหรับ host สาธารณะ; plaintext `ws://` ยอมรับเฉพาะสำหรับ loopback, LAN, link-local, `.local`, `.ts.net` และ host Tailscale CGNAT.
- `remote.remotePort`: พอร์ต gateway บน host SSH ระยะไกล ค่าเริ่มต้นคือ `18789`; ใช้ค่านี้เมื่อพอร์ต tunnel ในเครื่องแตกต่างจากพอร์ต gateway ระยะไกล.
- `gateway.remote.token` / `.password` เป็นฟิลด์ข้อมูลประจำตัวของไคลเอนต์ระยะไกล ฟิลด์เหล่านี้ไม่ได้กำหนดค่าการยืนยันตัวตนของ gateway ด้วยตัวเอง.
- `gateway.push.apns.relay.baseUrl`: URL ฐาน HTTPS สำหรับรีเลย์ APNs ภายนอกที่ใช้หลังจาก build iOS ที่พึ่งพารีเลย์เผยแพร่การลงทะเบียนไปยัง gateway build สาธารณะบน App Store/TestFlight ใช้รีเลย์ OpenClaw ที่ host ไว้ URL รีเลย์แบบกำหนดเองต้องตรงกับเส้นทาง build/deployment ของ iOS ที่แยกไว้โดยตั้งใจ ซึ่ง URL รีเลย์ชี้ไปยังรีเลย์นั้น.
- `gateway.push.apns.relay.timeoutMs`: timeout การส่งจาก gateway ไปยังรีเลย์ หน่วยเป็นมิลลิวินาที ค่าเริ่มต้นคือ `10000`.
- การลงทะเบียนที่พึ่งพารีเลย์ถูกมอบหมายให้ตัวตน gateway เฉพาะ แอป iOS ที่จับคู่จะดึง `gateway.identity.get`, รวมตัวตนนั้นในการลงทะเบียนรีเลย์ และส่งต่อสิทธิ์การส่งตามขอบเขตการลงทะเบียนไปยัง gateway gateway อื่นไม่สามารถนำการลงทะเบียนที่เก็บไว้นั้นไปใช้ซ้ำได้.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: การ override env ชั่วคราวสำหรับค่ากำหนดรีเลย์ด้านบน.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: ทางออกเฉพาะสำหรับการพัฒนาสำหรับ URL รีเลย์ HTTP แบบ loopback URL รีเลย์ production ควรอยู่บน HTTPS.
- `gateway.handshakeTimeoutMs`: timeout การ handshake ของ WebSocket ก่อนยืนยันตัวตนของ Gateway หน่วยเป็นมิลลิวินาที ค่าเริ่มต้น: `15000` `OPENCLAW_HANDSHAKE_TIMEOUT_MS` มีลำดับความสำคัญเมื่อถูกตั้งค่า เพิ่มค่านี้บน host ที่มีโหลดหรือพลังประมวลผลต่ำ ซึ่งไคลเอนต์ในเครื่องสามารถเชื่อมต่อได้ขณะ startup warmup ยัง settle อยู่.
- `gateway.channelHealthCheckMinutes`: ช่วงเวลาของตัวตรวจสอบสุขภาพ channel หน่วยเป็นนาที ตั้ง `0` เพื่อปิดการ restart จากตัวตรวจสอบสุขภาพทั่วทั้งระบบ ค่าเริ่มต้น: `5`.
- `gateway.channelStaleEventThresholdMinutes`: threshold ของ stale-socket หน่วยเป็นนาที ให้ค่านี้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes` ค่าเริ่มต้น: `30`.
- `gateway.channelMaxRestartsPerHour`: จำนวน restart สูงสุดจากตัวตรวจสอบสุขภาพต่อ channel/account ในหนึ่งชั่วโมงแบบ rolling ค่าเริ่มต้น: `10`.
- `channels.<provider>.healthMonitor.enabled`: การ opt out ราย channel สำหรับ restart จากตัวตรวจสอบสุขภาพ โดยยังเปิดตัวตรวจสอบระดับ global ไว้.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override ราย account สำหรับ channel แบบหลาย account เมื่อตั้งค่าแล้ว จะมีลำดับความสำคัญเหนือ override ระดับ channel.
- เส้นทางการเรียก gateway ในเครื่องสามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`.
- หากกำหนดค่า `gateway.auth.token` / `gateway.auth.password` อย่างชัดเจนผ่าน SecretRef และ resolve ไม่ได้ การ resolve จะ fail closed (ไม่มี remote fallback มาบดบัง).
- `trustedProxies`: IP ของ reverse proxy ที่ terminate TLS หรือ inject header forwarded-client ระบุเฉพาะ proxy ที่คุณควบคุม รายการ loopback ยังใช้ได้สำหรับการตั้งค่า proxy/การตรวจจับในเครื่องบน host เดียวกัน (เช่น Tailscale Serve หรือ reverse proxy ในเครื่อง) แต่รายการเหล่านี้ **ไม่** ทำให้คำขอ loopback เข้าเกณฑ์สำหรับ `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: เมื่อเป็น `true` gateway จะยอมรับ `X-Real-IP` หากไม่มี `X-Forwarded-For` ค่าเริ่มต้นคือ `false` เพื่อพฤติกรรม fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist CIDR/IP แบบไม่บังคับสำหรับอนุมัติการจับคู่อุปกรณ์ node ครั้งแรกโดยอัตโนมัติเมื่อไม่มีขอบเขตที่ร้องขอ ค่านี้ถูกปิดเมื่อไม่ได้ตั้งค่า สิ่งนี้ไม่อนุมัติการจับคู่ operator/browser/ส่วนติดต่อควบคุม/WebChat โดยอัตโนมัติ และไม่อนุมัติการอัปเกรด role, scope, metadata หรือ public-key โดยอัตโนมัติ.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: การกำหนด allow/deny ระดับ global สำหรับคำสั่ง node ที่ประกาศ หลังจากการจับคู่และการประเมิน allowlist ของแพลตฟอร์ม ใช้ `allowCommands` เพื่อ opt in เข้าสู่คำสั่ง node อันตราย เช่น `camera.snap`, `camera.clip` และ `screen.record`; `denyCommands` จะนำคำสั่งออก แม้ค่าเริ่มต้นของแพลตฟอร์มหรือ explicit allow จะรวมคำสั่งนั้นไว้ก็ตาม หลังจาก node เปลี่ยนรายการคำสั่งที่ประกาศ ให้ปฏิเสธและอนุมัติการจับคู่อุปกรณ์นั้นใหม่ เพื่อให้ gateway เก็บ snapshot คำสั่งที่อัปเดตแล้ว.
- `gateway.tools.deny`: ชื่อเครื่องมือเพิ่มเติมที่ถูกบล็อกสำหรับ HTTP `POST /tools/invoke` (ขยายรายการ deny ค่าเริ่มต้น).
- `gateway.tools.allow`: นำชื่อเครื่องมือออกจากรายการ deny HTTP ค่าเริ่มต้นสำหรับ
  ผู้เรียก owner/admin สิ่งนี้ไม่ได้ยกระดับผู้เรียก `operator.write` ที่มีตัวตน
  ให้เป็นสิทธิ์ owner/admin; `cron`, `gateway` และ `nodes` ยังคง
  ไม่พร้อมใช้งานสำหรับผู้เรียกที่ไม่ใช่ owner แม้จะอยู่ใน allowlist.

</Accordion>

### endpoint ที่เข้ากันได้กับ OpenAI

- Admin HTTP RPC: ปิดตามค่าเริ่มต้นในฐานะ Plugin `admin-http-rpc` เปิดใช้ Plugin เพื่อลงทะเบียน `POST /api/v1/admin/rpc` ดู [Admin HTTP RPC](/th/plugins/admin-http-rpc).
- Chat Completions: ปิดตามค่าเริ่มต้น เปิดด้วย `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- การเสริมความปลอดภัยของ URL-input สำหรับ Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlist ว่างจะถือว่าไม่ได้ตั้งค่า; ใช้ `gateway.http.endpoints.responses.files.allowUrl=false`
    และ/หรือ `gateway.http.endpoints.responses.images.allowUrl=false` เพื่อปิดการดึง URL.
- header เสริมความปลอดภัยของ response แบบไม่บังคับ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ตั้งค่าเฉพาะสำหรับ origin HTTPS ที่คุณควบคุม; ดู [การยืนยันตัวตนผ่านพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### การแยกหลาย instance

เรียกใช้ gateway หลายตัวบน host เดียวด้วยพอร์ตและไดเรกทอรี state ที่ไม่ซ้ำกัน:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

flag อำนวยความสะดวก: `--dev` (ใช้ `~/.openclaw-dev` + พอร์ต `19001`), `--profile <name>` (ใช้ `~/.openclaw-<name>`).

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

- `enabled`: เปิดใช้ TLS termination ที่ listener ของ gateway (HTTPS/WSS) (ค่าเริ่มต้น: `false`).
- `autoGenerate`: สร้างคู่ cert/key แบบ self-signed ในเครื่องโดยอัตโนมัติเมื่อไม่ได้กำหนดค่าไฟล์อย่างชัดเจน; ใช้สำหรับ local/dev เท่านั้น.
- `certPath`: path ในระบบไฟล์ไปยังไฟล์ใบรับรอง TLS.
- `keyPath`: path ในระบบไฟล์ไปยังไฟล์ private key ของ TLS; จำกัดสิทธิ์ให้รัดกุม.
- `caPath`: path ของ CA bundle แบบไม่บังคับสำหรับการตรวจสอบไคลเอนต์หรือ custom trust chain.

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

- `mode`: ควบคุมวิธีใช้การแก้ไข config ขณะรันไทม์
  - `"off"`: ไม่สนใจการแก้ไขสด; การเปลี่ยนแปลงต้อง restart อย่างชัดเจน
  - `"restart"`: restart โปรเซส Gateway ทุกครั้งเมื่อ config เปลี่ยน
  - `"hot"`: ใช้การเปลี่ยนแปลงภายในโปรเซสโดยไม่ต้อง restart
  - `"hybrid"` (ค่าเริ่มต้น): ลอง hot reload ก่อน; fallback ไป restart หากจำเป็น
- `debounceMs`: ช่วงเวลา debounce เป็น ms ก่อนใช้การเปลี่ยนแปลง config (จำนวนเต็มไม่ติดลบ)
- `deferralTimeoutMs`: เวลาสูงสุดแบบไม่บังคับเป็น ms สำหรับรอการทำงานที่ยังค้างอยู่ก่อนบังคับ restart หรือ hot reload ช่องทาง ละไว้เพื่อใช้การรอแบบมีขอบเขตเริ่มต้น (`300000`); ตั้งเป็น `0` เพื่อรอไม่จำกัดเวลาและบันทึกคำเตือนว่ายังค้างอยู่เป็นระยะ

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

หมายเหตุด้านการตรวจสอบและความปลอดภัย:

- `hooks.enabled=true` ต้องมี `hooks.token` ที่ไม่ว่าง
- `hooks.token` ควรแยกต่างหากจากการยืนยันตัวตน shared-secret ของ Gateway ที่ใช้งานอยู่ (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); ตอนเริ่มต้นจะบันทึกคำเตือนความปลอดภัยแบบไม่ร้ายแรงเมื่อตรวจพบการใช้ซ้ำ
- `openclaw security audit` ทำเครื่องหมายการใช้การยืนยันตัวตน hook/Gateway ซ้ำเป็นข้อค้นพบระดับวิกฤต รวมถึงการยืนยันตัวตนด้วยรหัสผ่าน Gateway ที่ให้เฉพาะตอน audit (`--auth password --password <password>`) รัน `openclaw doctor --fix` เพื่อหมุนเวียน `hooks.token` ที่บันทึกถาวรและถูกใช้ซ้ำ จากนั้นอัปเดตตัวส่ง hook ภายนอกให้ใช้โทเค็น hook ใหม่
- `hooks.path` เป็น `/` ไม่ได้; ใช้ subpath เฉพาะ เช่น `/hooks`
- หาก `hooks.allowRequestSessionKey=true` ให้จำกัด `hooks.allowedSessionKeyPrefixes` (เช่น `["hook:"]`)
- หาก mapping หรือ preset ใช้ `sessionKey` แบบเทมเพลต ให้ตั้ง `hooks.allowedSessionKeyPrefixes` และ `hooks.allowRequestSessionKey=true` คีย์ mapping แบบคงที่ไม่ต้อง opt-in นี้

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` จาก payload คำขอจะยอมรับเฉพาะเมื่อ `hooks.allowRequestSessionKey=true` (ค่าเริ่มต้น: `false`)
- `POST /hooks/<name>` → resolve ผ่าน `hooks.mappings`
  - ค่า `sessionKey` ของ mapping ที่ render จากเทมเพลตจะถือว่าเป็นค่าที่จัดหาจากภายนอก และต้องมี `hooks.allowRequestSessionKey=true` เช่นกัน

<Accordion title="รายละเอียด mapping">

- `match.path` จับคู่ sub-path หลัง `/hooks` (เช่น `/hooks/gmail` → `gmail`)
- `match.source` จับคู่ฟิลด์ payload สำหรับพาธทั่วไป
- เทมเพลตอย่าง `{{messages[0].subject}}` อ่านจาก payload
- `transform` สามารถชี้ไปยังโมดูล JS/TS ที่คืนค่า hook action ได้
  - `transform.module` ต้องเป็นพาธแบบ relative และอยู่ภายใน `hooks.transformsDir` (พาธ absolute และการ traversal จะถูกปฏิเสธ)
  - เก็บ `hooks.transformsDir` ไว้ใต้ `~/.openclaw/hooks/transforms`; ไดเรกทอรี skill ของ workspace จะถูกปฏิเสธ หาก `openclaw doctor` รายงานว่าพาธนี้ไม่ถูกต้อง ให้ย้ายโมดูล transform เข้าไปในไดเรกทอรี hooks transforms หรือลบ `hooks.transformsDir`
- `agentId` route ไปยัง agent ที่ระบุ; ID ที่ไม่รู้จักจะ fallback ไปยัง agent เริ่มต้น
- `allowedAgentIds`: จำกัดการ route agent ที่มีผล รวมถึงพาธ agent เริ่มต้นเมื่อไม่ได้ระบุ `agentId` (`*` หรือการละไว้ = อนุญาตทั้งหมด, `[]` = ปฏิเสธทั้งหมด)
- `defaultSessionKey`: คีย์ session แบบคงที่ที่ไม่บังคับสำหรับการรัน hook agent ที่ไม่มี `sessionKey` ชัดเจน
- `allowRequestSessionKey`: อนุญาตให้ผู้เรียก `/hooks/agent` และคีย์ session mapping ที่ขับเคลื่อนด้วยเทมเพลตตั้งค่า `sessionKey` (ค่าเริ่มต้น: `false`)
- `allowedSessionKeyPrefixes`: allowlist prefix แบบไม่บังคับสำหรับค่า `sessionKey` ที่ระบุชัดเจน (คำขอ + mapping) เช่น `["hook:"]` ค่านี้จะกลายเป็นสิ่งที่จำเป็นเมื่อ mapping หรือ preset ใดใช้ `sessionKey` แบบเทมเพลต
- `deliver: true` ส่งคำตอบสุดท้ายไปยังช่องทาง; `channel` มีค่าเริ่มต้นเป็น `last`
- `model` override LLM สำหรับการรัน hook นี้ (ต้องได้รับอนุญาตหากตั้ง model catalog ไว้)

</Accordion>

### การผสานรวม Gmail

- preset Gmail ในตัวใช้ `sessionKey: "hook:gmail:{{messages[0].id}}"`
- หากคุณคงการ route รายข้อความนั้นไว้ ให้ตั้ง `hooks.allowRequestSessionKey: true` และจำกัด `hooks.allowedSessionKeyPrefixes` ให้ตรงกับ namespace ของ Gmail เช่น `["hook:", "hook:gmail:"]`
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

- Gateway จะเริ่ม `gog gmail watch serve` โดยอัตโนมัติเมื่อบูตหากมีการกำหนดค่าไว้ ตั้ง `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อปิดใช้งาน
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

- ให้บริการ HTML/CSS/JS ที่ agent แก้ไขได้ และ A2UI ผ่าน HTTP ใต้พอร์ต Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- เฉพาะ local: คง `gateway.bind: "loopback"` (ค่าเริ่มต้น)
- การ bind ที่ไม่ใช่ loopback: route canvas ต้องใช้การยืนยันตัวตน Gateway (โทเค็น/รหัสผ่าน/trusted-proxy) เช่นเดียวกับพื้นผิว HTTP อื่นของ Gateway
- โดยทั่วไป Node WebViews จะไม่ส่ง header ยืนยันตัวตน; หลังจาก node ถูกจับคู่และเชื่อมต่อแล้ว Gateway จะประกาศ URL ความสามารถแบบจำกัดขอบเขต node สำหรับการเข้าถึง canvas/A2UI
- URL ความสามารถผูกกับ session WS ของ node ที่ใช้งานอยู่และหมดอายุอย่างรวดเร็ว ไม่มีการใช้ fallback ตาม IP
- inject ไคลเอนต์ live-reload เข้าไปใน HTML ที่ให้บริการ
- สร้าง `index.html` เริ่มต้นโดยอัตโนมัติเมื่อว่าง
- ให้บริการ A2UI ที่ `/__openclaw__/a2ui/` ด้วย
- การเปลี่ยนแปลงต้อง restart gateway
- ปิด live reload สำหรับไดเรกทอรีขนาดใหญ่หรือข้อผิดพลาด `EMFILE`

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

- `minimal` (ค่าเริ่มต้นเมื่อเปิดใช้งาน Plugin `bonjour` ที่ bundled): ละ `cliPath` + `sshPort` จากระเบียน TXT
- `full`: รวม `cliPath` + `sshPort`; การประกาศ LAN multicast ยังคงต้องเปิดใช้งาน Plugin `bonjour` ที่ bundled
- `off`: ระงับการประกาศ LAN multicast โดยไม่เปลี่ยนการเปิดใช้งาน Plugin
- Plugin `bonjour` ที่ bundled จะเริ่มอัตโนมัติบนโฮสต์ macOS และเป็นแบบ opt-in บน Linux, Windows และการ deploy Gateway แบบ containerized
- hostname มีค่าเริ่มต้นเป็น hostname ของระบบเมื่อเป็น label DNS ที่ถูกต้อง และ fallback เป็น `openclaw` override ด้วย `OPENCLAW_MDNS_HOSTNAME`

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

เขียนโซน unicast DNS-SD ไว้ใต้ `~/.openclaw/dns/` สำหรับการค้นพบข้ามเครือข่าย ให้ใช้คู่กับเซิร์ฟเวอร์ DNS (แนะนำ CoreDNS) + Tailscale split DNS

การตั้งค่า: `openclaw dns setup --apply`.

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

- ตัวแปรสภาพแวดล้อมแบบอินไลน์จะถูกใช้เฉพาะเมื่อ process env ไม่มีคีย์นั้น
- ไฟล์ `.env`: CWD `.env` + `~/.openclaw/.env` (ทั้งคู่จะไม่เขียนทับตัวแปรที่มีอยู่)
- `shellEnv`: นำเข้าคีย์ที่คาดไว้แต่ยังขาดอยู่จากโปรไฟล์เชลล์ล็อกอินของคุณ
- ดู [สภาพแวดล้อม](/th/help/environment) สำหรับลำดับความสำคัญแบบเต็ม

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
- ตัวแปรที่ขาดหายหรือว่างจะทำให้เกิดข้อผิดพลาดเมื่อโหลดการกำหนดค่า
- เอสเคปด้วย `$${VAR}` เพื่อให้ได้ลิเทอรัล `${VAR}`
- ทำงานร่วมกับ `$include`

---

## ความลับ

การอ้างอิงความลับเป็นแบบเพิ่มเสริม: ค่าข้อความธรรมดายังคงใช้งานได้

### `SecretRef`

ใช้รูปแบบออบเจ็กต์เดียว:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

การตรวจสอบความถูกต้อง:

- รูปแบบ `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- รูปแบบ id ของ `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id ของ `source: "file"`: JSON pointer แบบสัมบูรณ์ (เช่น `"/providers/openai/apiKey"`)
- รูปแบบ id ของ `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (รองรับตัวเลือกแบบ AWS เช่น `secret#json_key`)
- id ของ `source: "exec"` ต้องไม่มีเซกเมนต์พาธที่คั่นด้วยสแลชเป็น `.` หรือ `..` (เช่น `a/../b` จะถูกปฏิเสธ)

### พื้นผิวข้อมูลรับรองที่รองรับ

- เมทริกซ์มาตรฐาน: [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
- `secrets apply` กำหนดเป้าหมายไปยังพาธข้อมูลรับรอง `openclaw.json` ที่รองรับ
- การอ้างอิง `auth-profiles.json` รวมอยู่ในการแก้ค่าในรันไทม์และขอบเขตการตรวจสอบ

### การกำหนดค่าผู้ให้บริการความลับ

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
- พาธของผู้ให้บริการ file และ exec จะปิดแบบล้มเหลวเมื่อการตรวจสอบ Windows ACL ไม่พร้อมใช้งาน ตั้งค่า `allowInsecurePath: true` เฉพาะสำหรับพาธที่เชื่อถือได้ซึ่งไม่สามารถตรวจสอบได้
- ผู้ให้บริการ `exec` ต้องใช้พาธ `command` แบบสัมบูรณ์ และใช้ payload ของโปรโตคอลผ่าน stdin/stdout
- โดยค่าเริ่มต้น พาธคำสั่งที่เป็น symlink จะถูกปฏิเสธ ตั้งค่า `allowSymlinkCommand: true` เพื่ออนุญาตพาธ symlink ขณะตรวจสอบความถูกต้องของพาธเป้าหมายที่แก้ค่าแล้ว
- หากกำหนดค่า `trustedDirs` ไว้ การตรวจสอบไดเรกทอรีที่เชื่อถือได้จะใช้กับพาธเป้าหมายที่แก้ค่าแล้ว
- สภาพแวดล้อมของ child `exec` จะเป็นแบบขั้นต่ำโดยค่าเริ่มต้น ส่งผ่านตัวแปรที่จำเป็นอย่างชัดเจนด้วย `passEnv`
- การอ้างอิงความลับจะถูกแก้ค่า ณ เวลาเปิดใช้งานเป็นสแนปช็อตในหน่วยความจำ จากนั้นพาธคำขอจะอ่านเฉพาะสแนปช็อตนั้น
- การกรองพื้นผิวที่ใช้งานอยู่จะใช้ระหว่างการเปิดใช้งาน: การอ้างอิงที่แก้ค่าไม่ได้บนพื้นผิวที่เปิดใช้จะทำให้การเริ่มต้น/โหลดซ้ำล้มเหลว ส่วนพื้นผิวที่ไม่ได้ใช้งานจะถูกข้ามพร้อมข้อมูลวินิจฉัย

---

## พื้นที่จัดเก็บการยืนยันตัวตน

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

- โปรไฟล์ต่อเอเจนต์ถูกจัดเก็บที่ `<agentDir>/auth-profiles.json`
- `auth-profiles.json` รองรับ refs ระดับค่า (`keyRef` สำหรับ `api_key`, `tokenRef` สำหรับ `token`) สำหรับโหมดข้อมูลรับรองแบบคงที่
- แมป `auth-profiles.json` แบบแบนเดิม เช่น `{ "provider": { "apiKey": "..." } }` ไม่ใช่รูปแบบรันไทม์; `openclaw doctor --fix` จะเขียนใหม่เป็นโปรไฟล์ API key แบบมาตรฐาน `provider:default` พร้อมข้อมูลสำรอง `.legacy-flat.*.bak`
- โปรไฟล์โหมด OAuth (`auth.profiles.<id>.mode = "oauth"`) ไม่รองรับข้อมูลรับรอง auth-profile ที่มี SecretRef เป็นแบ็กเอนด์
- ข้อมูลรับรองรันไทม์แบบคงที่มาจากสแนปช็อตที่แก้ค่าแล้วในหน่วยความจำ; รายการ `auth.json` แบบคงที่เดิมจะถูกล้างเมื่อพบ
- การนำเข้า OAuth เดิมมาจาก `~/.openclaw/credentials/oauth.json`
- ดู [OAuth](/th/concepts/oauth)
- พฤติกรรมรันไทม์ของ secrets และเครื่องมือ `audit/configure/apply`: [การจัดการ Secrets](/th/gateway/secrets)

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

- `billingBackoffHours`: ค่า backoff พื้นฐานเป็นชั่วโมงเมื่อโปรไฟล์ล้มเหลวจากข้อผิดพลาดด้านการเรียกเก็บเงินจริง
  หรือเครดิตไม่เพียงพอ (ค่าเริ่มต้น: `5`) ข้อความการเรียกเก็บเงินที่ชัดเจนยังคง
  เข้ามาที่นี่ได้แม้ในคำตอบ `401`/`403` แต่ตัวจับคู่ข้อความเฉพาะ provider
  จะยังจำกัดขอบเขตอยู่กับ provider ที่เป็นเจ้าของเท่านั้น (เช่น OpenRouter
  `Key limit exceeded`) ข้อความ HTTP `402` แบบลองใหม่ได้สำหรับหน้าต่างการใช้งาน หรือ
  ข้อความจำกัดยอดใช้จ่ายระดับองค์กร/เวิร์กสเปซ จะยังอยู่ในเส้นทาง `rate_limit`
  แทน
- `billingBackoffHoursByProvider`: ค่าทับซ้อนราย provider แบบไม่บังคับสำหรับชั่วโมง backoff ด้านการเรียกเก็บเงิน
- `billingMaxHours`: เพดานเป็นชั่วโมงสำหรับการเติบโตแบบเอ็กซ์โปเนนเชียลของ backoff ด้านการเรียกเก็บเงิน (ค่าเริ่มต้น: `24`)
- `authPermanentBackoffMinutes`: ค่า backoff พื้นฐานเป็นนาทีสำหรับความล้มเหลว `auth_permanent` ที่มีความมั่นใจสูง (ค่าเริ่มต้น: `10`)
- `authPermanentMaxMinutes`: เพดานเป็นนาทีสำหรับการเติบโตของ backoff `auth_permanent` (ค่าเริ่มต้น: `60`)
- `failureWindowHours`: หน้าต่างแบบเลื่อนเป็นชั่วโมงที่ใช้สำหรับตัวนับ backoff (ค่าเริ่มต้น: `24`)
- `overloadedProfileRotations`: จำนวนสูงสุดของการหมุนเวียน auth-profile ใน provider เดียวกันสำหรับข้อผิดพลาด overloaded ก่อนเปลี่ยนไปใช้ model fallback (ค่าเริ่มต้น: `1`) รูปแบบ provider-busy เช่น `ModelNotReadyException` จะเข้ามาที่นี่
- `overloadedBackoffMs`: ดีเลย์คงที่ก่อนลองการหมุนเวียน provider/profile ที่ overloaded อีกครั้ง (ค่าเริ่มต้น: `0`)
- `rateLimitedProfileRotations`: จำนวนสูงสุดของการหมุนเวียน auth-profile ใน provider เดียวกันสำหรับข้อผิดพลาด rate-limit ก่อนเปลี่ยนไปใช้ model fallback (ค่าเริ่มต้น: `1`) กลุ่ม rate-limit นั้นรวมข้อความที่มีรูปแบบของ provider เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` และ `resource exhausted`

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
- ตั้งค่า `logging.file` สำหรับพาธแบบคงที่
- `consoleLevel` จะเพิ่มเป็น `debug` เมื่อใช้ `--verbose`
- `maxFileBytes`: ขนาดไฟล์ล็อกที่ใช้งานอยู่สูงสุดเป็นไบต์ก่อนหมุนไฟล์ (จำนวนเต็มบวก; ค่าเริ่มต้น: `104857600` = 100 MB) OpenClaw เก็บไฟล์เก็บถาวรแบบมีหมายเลขได้สูงสุดห้าไฟล์ข้างไฟล์ที่ใช้งานอยู่
- `redactSensitive` / `redactPatterns`: การปิดบังแบบ best-effort สำหรับเอาต์พุตคอนโซล, ไฟล์ล็อก, ระเบียนล็อก OTLP และข้อความทรานสคริปต์เซสชันที่บันทึกถาวร `redactSensitive: "off"` ปิดใช้งานเฉพาะนโยบายล็อก/ทรานสคริปต์ทั่วไปนี้เท่านั้น; พื้นผิวความปลอดภัยของ UI/tool/diagnostic ยังคง redact secrets ก่อนส่งออก

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
- `flags`: อาร์เรย์ของสตริง flag ที่เปิดใช้เอาต์พุตล็อกแบบกำหนดเป้าหมาย (รองรับไวลด์การ์ด เช่น `"telegram.*"` หรือ `"*"`)
- `stuckSessionWarnMs`: เกณฑ์อายุที่ไม่มีความคืบหน้าเป็น ms สำหรับจัดประเภทเซสชันประมวลผลที่ทำงานนานเป็น `session.long_running`, `session.stalled` หรือ `session.stuck` การตอบกลับ, tool, สถานะ, บล็อก และความคืบหน้า ACP จะรีเซ็ตตัวจับเวลา; การวินิจฉัย `session.stuck` ซ้ำ ๆ จะ back off ขณะไม่มีการเปลี่ยนแปลง
- `stuckSessionAbortMs`: เกณฑ์อายุที่ไม่มีความคืบหน้าเป็น ms ก่อนที่งานที่ใช้งานอยู่ซึ่ง stalled และมีสิทธิ์อาจถูก abort-drained เพื่อกู้คืน เมื่อไม่ได้ตั้งค่า OpenClaw จะใช้หน้าต่าง embedded-run แบบขยายที่ปลอดภัยกว่าอย่างน้อย 5 นาที และ 3x `stuckSessionWarnMs`
- `memoryPressureSnapshot`: จับสแนปช็อตเสถียรภาพก่อน OOM ที่ redact แล้วเมื่อแรงกดดันหน่วยความจำถึง `critical` (ค่าเริ่มต้น: `false`) ตั้งเป็น `true` เพื่อเพิ่มการสแกน/เขียนไฟล์ stability bundle ในขณะที่ยังคงเหตุการณ์แรงกดดันหน่วยความจำปกติ
- `otel.enabled`: เปิดใช้ pipeline การส่งออก OpenTelemetry (ค่าเริ่มต้น: `false`) สำหรับการกำหนดค่าเต็ม แค็ตตาล็อกสัญญาณ และโมเดลความเป็นส่วนตัว ดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)
- `otel.endpoint`: URL ของ collector สำหรับการส่งออก OTel
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP เฉพาะสัญญาณแบบไม่บังคับ เมื่อตั้งค่าแล้ว จะทับ `otel.endpoint` เฉพาะสัญญาณนั้น
- `otel.protocol`: `"http/protobuf"` (ค่าเริ่มต้น) หรือ `"grpc"`
- `otel.headers`: เฮดเดอร์ metadata HTTP/gRPC เพิ่มเติมที่ส่งไปพร้อมคำขอส่งออก OTel
- `otel.serviceName`: ชื่อบริการสำหรับ resource attributes
- `otel.traces` / `otel.metrics` / `otel.logs`: เปิดใช้การส่งออก trace, metrics หรือ log
- `otel.logsExporter`: ปลายทางการส่งออกล็อก: `"otlp"` (ค่าเริ่มต้น), `"stdout"` สำหรับ JSON object หนึ่งรายการต่อบรรทัด stdout หรือ `"both"`
- `otel.sampleRate`: อัตราการสุ่มตัวอย่าง trace `0`-`1`
- `otel.flushIntervalMs`: ช่วงเวลาการ flush telemetry เป็นระยะใน ms
- `otel.captureContent`: การจับเนื้อหาดิบแบบ opt-in สำหรับ OTEL span attributes ค่าเริ่มต้นคือปิด Boolean `true` จับเนื้อหา message/tool ที่ไม่ใช่ระบบ; รูปแบบ object ให้คุณเปิดใช้ `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` และ `toolDefinitions` ได้อย่างชัดเจน
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: สวิตช์ environment สำหรับรูปแบบ span การอนุมาน GenAI รุ่นทดลองล่าสุด รวมถึงชื่อ span `{gen_ai.operation.name} {gen_ai.request.model}`, span kind `CLIENT` และ `gen_ai.provider.name` แทน `gen_ai.system` แบบเดิม โดยค่าเริ่มต้น span จะคง `openclaw.model.call` และ `gen_ai.system` เพื่อความเข้ากันได้; metrics GenAI ใช้ semantic attributes แบบมีขอบเขต
- `OPENCLAW_OTEL_PRELOADED=1`: สวิตช์ environment สำหรับ host ที่ลงทะเบียน OpenTelemetry SDK แบบ global ไว้แล้ว จากนั้น OpenClaw จะข้ามการ startup/shutdown SDK ที่ Plugin เป็นเจ้าของ ขณะที่ยังคง diagnostic listeners ให้ทำงานอยู่
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` และ `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: env vars endpoint เฉพาะสัญญาณที่ใช้เมื่อไม่ได้ตั้งค่าคีย์ config ที่ตรงกัน
- `cacheTrace.enabled`: บันทึกสแนปช็อต cache trace สำหรับ embedded runs (ค่าเริ่มต้น: `false`)
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
- `checkOnStart`: ตรวจสอบการอัปเดต npm เมื่อ gateway เริ่มทำงาน (ค่าเริ่มต้น: `true`)
- `auto.enabled`: เปิดใช้ auto-update เบื้องหลังสำหรับการติดตั้ง package (ค่าเริ่มต้น: `false`)
- `auto.stableDelayHours`: ดีเลย์ขั้นต่ำเป็นชั่วโมงก่อน auto-apply ของ stable-channel (ค่าเริ่มต้น: `6`; สูงสุด: `168`)
- `auto.stableJitterHours`: หน้าต่างกระจาย rollout เพิ่มเติมสำหรับ stable-channel เป็นชั่วโมง (ค่าเริ่มต้น: `12`; สูงสุด: `168`)
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

- `enabled`: feature gate แบบ global สำหรับ ACP (ค่าเริ่มต้น: `true`; ตั้งเป็น `false` เพื่อซ่อน ACP dispatch และ affordances การ spawn)
- `dispatch.enabled`: gate อิสระสำหรับการ dispatch turn ของเซสชัน ACP (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อคงคำสั่ง ACP ไว้แต่บล็อกการดำเนินการ
- `backend`: id ของ backend รันไทม์ ACP เริ่มต้น (ต้องตรงกับ Plugin รันไทม์ ACP ที่ลงทะเบียนไว้)
  ติดตั้ง Plugin backend ก่อน และถ้าตั้งค่า `plugins.allow` ให้รวม id ของ Plugin backend (เช่น `acpx`) มิฉะนั้น ACP backend จะไม่โหลด
- `defaultAgent`: id เอเจนต์ ACP เป้าหมายสำรองเมื่อ spawns ไม่ระบุเป้าหมายชัดเจน
- `allowedAgents`: allowlist ของ id เอเจนต์ที่อนุญาตสำหรับเซสชันรันไทม์ ACP; ค่าว่างหมายถึงไม่มีข้อจำกัดเพิ่มเติม
- `maxConcurrentSessions`: จำนวนเซสชัน ACP ที่ใช้งานพร้อมกันสูงสุด
- `stream.coalesceIdleMs`: หน้าต่าง idle flush เป็น ms สำหรับข้อความที่สตรีม
- `stream.maxChunkChars`: ขนาด chunk สูงสุดก่อนแยกการฉายบล็อกที่สตรีม
- `stream.repeatSuppression`: ระงับบรรทัดสถานะ/tool ซ้ำต่อ turn (ค่าเริ่มต้น: `true`)
- `stream.deliveryMode`: `"live"` สตรีมแบบเพิ่มทีละส่วน; `"final_only"` บัฟเฟอร์จนถึงเหตุการณ์สิ้นสุดของ turn
- `stream.hiddenBoundarySeparator`: ตัวคั่นก่อนข้อความที่มองเห็นหลังเหตุการณ์ tool ที่ซ่อนอยู่ (ค่าเริ่มต้น: `"paragraph"`)
- `stream.maxOutputChars`: จำนวนอักขระเอาต์พุตผู้ช่วยสูงสุดที่ฉายต่อ ACP turn
- `stream.maxSessionUpdateChars`: จำนวนอักขระสูงสุดสำหรับบรรทัดสถานะ/อัปเดต ACP ที่ฉาย
- `stream.tagVisibility`: ระเบียนชื่อ tag ไปยังค่าทับซ้อน visibility แบบ boolean สำหรับเหตุการณ์ที่สตรีม
- `runtime.ttlMinutes`: idle TTL เป็นนาทีสำหรับ workers เซสชัน ACP ก่อนมีสิทธิ์ cleanup
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

- `cli.banner.taglineMode` ควบคุมรูปแบบสโลแกนของแบนเนอร์:
  - `"random"` (ค่าเริ่มต้น): สโลแกนตลก/ตามฤดูกาลแบบหมุนเวียน
  - `"default"`: สโลแกนกลางแบบคงที่ (`All your chats, one OpenClaw.`)
  - `"off"`: ไม่มีข้อความสโลแกน (ยังแสดงชื่อ/เวอร์ชันของแบนเนอร์)
- หากต้องการซ่อนทั้งแบนเนอร์ (ไม่ใช่แค่สโลแกน) ให้ตั้งค่า env `OPENCLAW_HIDE_BANNER=1`

---

## Wizard

เมทาดาทาที่เขียนโดยขั้นตอนตั้งค่าแบบมีคำแนะนำของ CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## ตัวตน

ดูฟิลด์ตัวตน `agents.list` ใต้ [ค่าเริ่มต้นของ Agent](/th/gateway/config-agents#agent-defaults)

---

## Bridge (ดั้งเดิม, ถูกนำออกแล้ว)

บิลด์ปัจจุบันไม่มี TCP bridge อีกต่อไป Node เชื่อมต่อผ่าน Gateway WebSocket คีย์ `bridge.*` ไม่ได้เป็นส่วนหนึ่งของสคีมาคอนฟิกอีกต่อไป (การตรวจสอบจะล้มเหลวจนกว่าจะนำออก; `openclaw doctor --fix` สามารถลบคีย์ที่ไม่รู้จักได้)

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

- `sessionRetention`: ระยะเวลาที่จะเก็บเซสชันการรัน Cron แบบแยกที่เสร็จสมบูรณ์ไว้ก่อนตัดออกจาก `sessions.json` ยังควบคุมการล้างทรานสคริปต์ Cron ที่ถูกลบและเก็บถาวรด้วย ค่าเริ่มต้น: `24h`; ตั้งค่าเป็น `false` เพื่อปิดใช้งาน
- `runLog.maxBytes`: ยอมรับเพื่อความเข้ากันได้กับบันทึกการรัน Cron รุ่นเก่าที่อิงไฟล์ ค่าเริ่มต้น: `2_000_000` ไบต์
- `runLog.keepLines`: แถวประวัติการรัน SQLite ล่าสุดที่เก็บไว้ต่อหนึ่งงาน ค่าเริ่มต้น: `2000`
- `webhookToken`: โทเคน bearer ที่ใช้สำหรับการส่ง Cron Webhook POST (`delivery.mode = "webhook"`), หากละไว้จะไม่ส่งส่วนหัว auth
- `webhook`: URL Webhook สำรองแบบดั้งเดิมที่เลิกใช้แล้ว (http/https) ซึ่ง `openclaw doctor --fix` ใช้เพื่อย้ายงานที่จัดเก็บไว้ซึ่งยังมี `notify: true`; การส่งในรันไทม์ใช้ `delivery.mode="webhook"` ต่อแต่ละงานพร้อม `delivery.to`, หรือ `delivery.completionDestination` เมื่อรักษาการส่งประกาศไว้

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

- `maxAttempts`: จำนวนครั้งสูงสุดในการลองซ้ำสำหรับงาน Cron เมื่อเกิดข้อผิดพลาดชั่วคราว (ค่าเริ่มต้น: `3`; ช่วง: `0`-`10`)
- `backoffMs`: อาร์เรย์ของการหน่วงเวลา backoff เป็นมิลลิวินาทีสำหรับแต่ละครั้งที่ลองซ้ำ (ค่าเริ่มต้น: `[30000, 60000, 300000]`; 1-10 รายการ)
- `retryOn`: ประเภทข้อผิดพลาดที่ทริกเกอร์การลองซ้ำ - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"` ละไว้เพื่อลองซ้ำกับประเภทชั่วคราวทั้งหมด

งานแบบครั้งเดียวจะยังเปิดใช้งานอยู่จนกว่าจำนวนครั้งที่ลองซ้ำจะหมด จากนั้นจึงปิดใช้งานพร้อมเก็บสถานะข้อผิดพลาดสุดท้ายไว้ งานที่เกิดซ้ำใช้นโยบายลองซ้ำชั่วคราวเดียวกันเพื่อรันอีกครั้งหลัง backoff ก่อนช่องเวลาที่กำหนดถัดไป; ข้อผิดพลาดถาวรหรือการลองซ้ำชั่วคราวที่หมดจำนวนครั้งจะกลับไปใช้กำหนดการเกิดซ้ำปกติพร้อม backoff ข้อผิดพลาด

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
- `after`: จำนวนความล้มเหลวติดต่อกันก่อนส่งการแจ้งเตือน (จำนวนเต็มบวก, ต่ำสุด: `1`)
- `cooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการแจ้งเตือนซ้ำสำหรับงานเดียวกัน (จำนวนเต็มที่ไม่เป็นลบ)
- `includeSkipped`: นับการรันที่ถูกข้ามติดต่อกันเข้าสู่เกณฑ์การแจ้งเตือน (ค่าเริ่มต้น: `false`) การรันที่ถูกข้ามจะถูกติดตามแยกต่างหากและไม่ส่งผลต่อ backoff ของข้อผิดพลาดการดำเนินการ
- `mode`: โหมดการส่ง - `"announce"` ส่งผ่านข้อความช่อง; `"webhook"` โพสต์ไปยัง Webhook ที่กำหนดค่าไว้
- `accountId`: บัญชีหรือรหัสช่องแบบไม่บังคับเพื่อจำกัดขอบเขตการส่งการแจ้งเตือน

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
- `channel`: การแทนที่ช่องสำหรับการส่งประกาศ `"last"` ใช้ช่องส่งที่ทราบล่าสุดซ้ำ
- `to`: เป้าหมายประกาศหรือ URL Webhook แบบชัดเจน จำเป็นสำหรับโหมด Webhook
- `accountId`: การแทนที่บัญชีแบบไม่บังคับสำหรับการส่ง
- `delivery.failureDestination` ต่อแต่ละงานจะแทนที่ค่าเริ่มต้นส่วนกลางนี้
- เมื่อไม่ได้ตั้งค่าปลายทางความล้มเหลวทั้งส่วนกลางและต่อแต่ละงาน งานที่ส่งผ่าน `announce` อยู่แล้วจะกลับไปใช้เป้าหมายประกาศหลักนั้นเมื่อเกิดความล้มเหลว
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เว้นแต่ว่า `delivery.mode` หลักของงานจะเป็น `"webhook"`

ดู [งาน Cron](/th/automation/cron-jobs) การดำเนินการ Cron แบบแยกจะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

---

## ตัวแปรเทมเพลตโมเดลสื่อ

ตัวแทนที่ในเทมเพลตที่ถูกขยายใน `tools.media.models[].args`:

| ตัวแปร             | คำอธิบาย                                         |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | เนื้อหาข้อความขาเข้าทั้งหมด                     |
| `{{RawBody}}`      | เนื้อหาดิบ (ไม่มี wrapper ประวัติ/ผู้ส่ง)         |
| `{{BodyStripped}}` | เนื้อหาที่ลบการกล่าวถึงกลุ่มออกแล้ว              |
| `{{From}}`         | ตัวระบุผู้ส่ง                                    |
| `{{To}}`           | ตัวระบุปลายทาง                                   |
| `{{MessageSid}}`   | รหัสข้อความช่อง                                  |
| `{{SessionId}}`    | UUID ของเซสชันปัจจุบัน                          |
| `{{IsNewSession}}` | `"true"` เมื่อสร้างเซสชันใหม่                    |
| `{{MediaUrl}}`     | pseudo-URL ของสื่อขาเข้า                         |
| `{{MediaPath}}`    | พาธสื่อในเครื่อง                                |
| `{{MediaType}}`    | ประเภทสื่อ (รูปภาพ/เสียง/เอกสาร/…)              |
| `{{Transcript}}`   | ทรานสคริปต์เสียง                                 |
| `{{Prompt}}`       | พรอมป์สื่อที่แก้ไขแล้วสำหรับรายการ CLI           |
| `{{MaxChars}}`     | จำนวนอักขระเอาต์พุตสูงสุดที่แก้ไขแล้วสำหรับรายการ CLI |
| `{{ChatType}}`     | `"direct"` หรือ `"group"`                        |
| `{{GroupSubject}}` | หัวข้อกลุ่ม (พยายามให้ดีที่สุด)                 |
| `{{GroupMembers}}` | ตัวอย่างสมาชิกกลุ่ม (พยายามให้ดีที่สุด)          |
| `{{SenderName}}`   | ชื่อที่แสดงของผู้ส่ง (พยายามให้ดีที่สุด)         |
| `{{SenderE164}}`   | หมายเลขโทรศัพท์ของผู้ส่ง (พยายามให้ดีที่สุด)    |
| `{{Provider}}`     | คำใบ้ผู้ให้บริการ (whatsapp, telegram, discord ฯลฯ) |

---

## การรวมคอนฟิก (`$include`)

แบ่งคอนฟิกออกเป็นหลายไฟล์:

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

**พฤติกรรมการรวม:**

- ไฟล์เดียว: แทนที่ออบเจ็กต์ที่ครอบอยู่
- อาร์เรย์ของไฟล์: deep-merge ตามลำดับ (รายการภายหลังแทนที่รายการก่อนหน้า)
- คีย์พี่น้อง: รวมหลัง includes (แทนที่ค่าที่รวมเข้ามา)
- includes ซ้อนกัน: ลึกได้สูงสุด 10 ระดับ
- พาธ: แก้ไขโดยอิงจากไฟล์ที่รวม แต่ต้องอยู่ภายในไดเรกทอรีคอนฟิกระดับบนสุด (`dirname` ของ `openclaw.json`) อนุญาตรูปแบบ absolute/`../` เฉพาะเมื่อยังแก้ไขแล้วอยู่ภายในขอบเขตนั้น พาธต้องไม่มี null bytes และต้องสั้นกว่า 4096 อักขระอย่างเคร่งครัดทั้งก่อนและหลังการแก้ไข
- การเขียนที่ OpenClaw เป็นเจ้าของซึ่งเปลี่ยนเฉพาะส่วนระดับบนสุดหนึ่งส่วนที่มี single-file include รองรับ จะเขียนทะลุไปยังไฟล์ที่รวมไว้นั้น ตัวอย่างเช่น `plugins install` อัปเดต `plugins: { $include: "./plugins.json5" }` ใน `plugins.json5` และปล่อย `openclaw.json` ไว้เหมือนเดิม
- root includes, อาร์เรย์ include, และ includes ที่มีการแทนที่คีย์พี่น้องเป็นแบบอ่านอย่างเดียวสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนเหล่านั้นจะล้มเหลวแบบปิดแทนที่จะ flatten คอนฟิก
- ข้อผิดพลาด: ข้อความชัดเจนสำหรับไฟล์ที่หายไป, ข้อผิดพลาดการแยกวิเคราะห์, includes วนซ้ำ, รูปแบบพาธไม่ถูกต้อง, และความยาวเกินกำหนด

---

_ที่เกี่ยวข้อง: [การกำหนดค่า](/th/gateway/configuration) · [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
