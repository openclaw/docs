---
read_when:
    - คุณต้องการความหมายเชิงกำหนดค่าหรือค่าเริ่มต้นที่แม่นยำในระดับฟิลด์
    - คุณกำลังตรวจสอบบล็อกการกำหนดค่าของช่องทาง โมเดล Gateway หรือเครื่องมือ
summary: ข้อมูลอ้างอิงการกำหนดค่า Gateway สำหรับคีย์หลักของ OpenClaw ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงเฉพาะของระบบย่อย
title: ข้อมูลอ้างอิงการกำหนดค่า
x-i18n:
    generated_at: "2026-07-20T16:02:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fc847d29653f3457b44ba6d3b7059329ac760e039f858ef7df5e081586b2e6f6
    source_path: gateway/configuration-reference.md
    workflow: 16
---

ข้อมูลอ้างอิงระดับฟิลด์สำหรับ `~/.openclaw/openclaw.json`: คีย์ ค่าเริ่มต้น และลิงก์ไปยังหน้าระบบย่อยเชิงลึก สำหรับคำแนะนำการตั้งค่าที่เน้นงาน โปรดดู [การกำหนดค่า](/th/gateway/configuration) แค็ตตาล็อกคำสั่งที่ช่องทางและ Plugin เป็นเจ้าของ รวมถึงตัวเลือกเชิงลึกของหน่วยความจำ/QMD อยู่ในหน้าของแต่ละส่วน ไม่ได้อยู่ที่นี่

รูปแบบการกำหนดค่าคือ **JSON5** (อนุญาตให้มีความคิดเห็นและเครื่องหมายจุลภาคท้ายรายการ) ฟิลด์ทั้งหมดเป็นตัวเลือก เมื่อไม่ได้ระบุ OpenClaw จะใช้ค่าเริ่มต้นที่ปลอดภัย

ความจริงจากโค้ดมีความสำคัญเหนือหน้านี้:

- `openclaw config schema` แสดง JSON Schema ที่ใช้งานจริงสำหรับการตรวจสอบความถูกต้องและ Control UI โดยผสานข้อมูลเมตาของบันเดิล/Plugin/ช่องทางแล้ว
- เอเจนต์ควรเรียกการดำเนินการของเครื่องมือ `gateway` ชื่อ `config.schema.lookup` เพื่อรับโหนดสคีมาที่จำกัดขอบเขตตามพาธเพียงพาธเดียวอย่างแม่นยำก่อนแก้ไขการกำหนดค่า
- `pnpm config:docs:check` / `pnpm config:docs:gen` ตรวจสอบแฮชพื้นฐานของเอกสารนี้เทียบกับพื้นผิวสคีมาปัจจุบัน

ข้อมูลอ้างอิงเชิงลึกเฉพาะด้าน:

- [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config) สำหรับ `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` และการกำหนดค่า Dreaming ภายใต้ `plugins.entries.memory-core.config.dreaming`
- [คำสั่งเครื่องหมายทับ](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่งในตัวและคำสั่งที่รวมในบันเดิลปัจจุบัน
- หน้าของช่องทาง/Plugin ที่เป็นเจ้าของ สำหรับพื้นผิวคำสั่งเฉพาะช่องทาง

---

## ช่องทาง

คีย์การกำหนดค่าแยกตามช่องทางอยู่ใน [การกำหนดค่า - ช่องทาง](/th/gateway/config-channels): `channels.*` สำหรับ Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และช่องทางอื่นที่รวมในบันเดิล (การยืนยันตัวตน การควบคุมการเข้าถึง หลายบัญชี และการจำกัดด้วยการกล่าวถึง)

## ค่าเริ่มต้นของเอเจนต์ หลายเอเจนต์ เซสชัน และข้อความ

โปรดดู [การกำหนดค่า - เอเจนต์](/th/gateway/config-agents) สำหรับ:

- `agents.defaults.*` (พื้นที่ทำงาน โมเดล การคิด Heartbeat หน่วยความจำ สื่อ Skills แซนด์บ็อกซ์)
- `multiAgent.*` (การกำหนดเส้นทางและการเชื่อมโยงแบบหลายเอเจนต์)
- `session.*` (วงจรชีวิตเซสชัน Compaction การตัดทอน)
- `messages.*` (การส่งข้อความ TTS การเรนเดอร์ Markdown)
- `talk.*` (โหมด Talk)
  - `talk.consultThinkingLevel`: การแทนที่ระดับการคิดสำหรับการรันเอเจนต์ OpenClaw ทั้งหมดที่รองรับการปรึกษาแบบเรียลไทม์ของ Control UI Talk
  - `talk.consultFastMode`: การแทนที่โหมดเร็วแบบครั้งเดียวสำหรับการปรึกษาแบบเรียลไทม์ของ Control UI Talk
  - `talk.speechLocale`: รหัสโลแคล BCP 47 ที่เป็นตัวเลือกสำหรับการรู้จำเสียงพูดของ Talk บน Android, iOS และ macOS
  - `talk.silenceTimeoutMs`: เมื่อไม่ได้ตั้งค่า Talk จะคงช่วงเวลาหยุดชั่วคราวเริ่มต้นของแพลตฟอร์มก่อนส่งข้อความถอดเสียง (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: ทางเลือกสำรองของรีเลย์ Gateway สำหรับข้อความถอดเสียง Talk แบบเรียลไทม์ที่เสร็จสมบูรณ์ซึ่งข้าม `openclaw_agent_consult`

## เครื่องมือและผู้ให้บริการแบบกำหนดเอง

นโยบายเครื่องมือ ตัวเลือกทดลอง การกำหนดค่าเครื่องมือที่อาศัยผู้ให้บริการ และการตั้งค่า
ผู้ให้บริการ / URL ฐานแบบกำหนดเองอยู่ใน
[การกำหนดค่า - เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools)

## โมเดล

คำจำกัดความผู้ให้บริการ รายการโมเดลที่อนุญาต และการตั้งค่าผู้ให้บริการแบบกำหนดเองอยู่ใน
[การกำหนดค่า - เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools#custom-providers-and-base-urls)
รูท `models` ยังเป็นเจ้าของพฤติกรรมแค็ตตาล็อกโมเดลส่วนกลางด้วย

```json5
{
  models: {
    // ตัวเลือก ค่าเริ่มต้น: true ต้องรีสตาร์ต Gateway เมื่อมีการเปลี่ยนแปลง
    pricing: { enabled: false },
  },
}
```

- `models.mode`: พฤติกรรมแค็ตตาล็อกผู้ให้บริการ (`merge` หรือ `replace`)
- `models.providers`: แมปผู้ให้บริการแบบกำหนดเองที่ใช้รหัสผู้ให้บริการเป็นคีย์
- `models.providers.*.localService`: ตัวจัดการกระบวนการตามต้องการที่เป็นตัวเลือกสำหรับ
  เซิร์ฟเวอร์โมเดลภายในเครื่อง OpenClaw ตรวจสอบปลายทางสถานภาพที่กำหนดค่าไว้ เริ่ม
  `command` แบบพาธสัมบูรณ์เมื่อจำเป็น รอจนพร้อม แล้วจึงส่งคำขอ
  โมเดล โปรดดู [บริการโมเดลภายในเครื่อง](/th/gateway/local-model-services)
- `models.pricing.enabled`: ควบคุมการเริ่มต้นข้อมูลราคาเบื้องหลังซึ่ง
  เริ่มหลังจากไซด์คาร์และช่องทางเข้าสู่พาธพร้อมใช้งานของ Gateway เมื่อ `false`
  Gateway จะข้ามการดึงแค็ตตาล็อกราคาของ OpenRouter และ LiteLLM แต่ค่า
  `models.providers.*.models[].cost` ที่กำหนดค่าไว้ยังคงใช้ได้สำหรับการประมาณค่าใช้จ่ายภายในเครื่อง

## MCP

คำจำกัดความเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการอยู่ภายใต้ `mcp.servers` และ
ถูกใช้โดย OpenClaw แบบฝังตัวและอะแดปเตอร์รันไทม์อื่น คำสั่ง `openclaw mcp list`,
`show`, `set` และ `unset` จัดการบล็อกนี้โดยไม่เชื่อมต่อกับ
เซิร์ฟเวอร์เป้าหมายระหว่างแก้ไขการกำหนดค่า

```json5
{
  mcp: {
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        requestTimeoutMs: 20000,
        connectionTimeoutMs: 5000,
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
        // ตัวควบคุมการฉายภาพไปยังเซิร์ฟเวอร์แอป Codex ที่เป็นตัวเลือก
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: คำจำกัดความเซิร์ฟเวอร์ MCP แบบ stdio หรือระยะไกลที่มีชื่อ สำหรับรันไทม์ที่
  เปิดเผยเครื่องมือ MCP ที่กำหนดค่าไว้
  รายการระยะไกลใช้ `transport: "streamable-http"` หรือ `transport: "sse"`;
  `type: "http"` เป็นนามแฝงแบบเนทีฟของ CLI ซึ่ง `openclaw mcp set` และ
  `openclaw doctor --fix` จะปรับให้อยู่ในฟิลด์มาตรฐาน `transport`
- `mcp.servers.<name>.enabled`: ตั้งค่า `false` เพื่อเก็บคำจำกัดความเซิร์ฟเวอร์ที่บันทึกไว้
  แต่ไม่นำไปรวมในการค้นพบ MCP และการฉายเครื่องมือของ OpenClaw แบบฝังตัว
- `mcp.servers.<name>.requestTimeoutMs`: ระยะหมดเวลาคำขอ MCP แยกตามเซิร์ฟเวอร์ หน่วยเป็นมิลลิวินาที
- `mcp.servers.<name>.connectionTimeoutMs`: ระยะหมดเวลาการเชื่อมต่อแยกตามเซิร์ฟเวอร์ หน่วยเป็นมิลลิวินาที
- `mcp.servers.<name>.supportsParallelToolCalls`: คำแนะนำด้านภาวะพร้อมกันที่เป็นตัวเลือกสำหรับ
  อะแดปเตอร์ที่สามารถเลือกได้ว่าจะเรียกเครื่องมือ MCP แบบขนานหรือไม่
- `mcp.servers.<name>.auth`: ตั้งค่า `"oauth"` สำหรับเซิร์ฟเวอร์ HTTP MCP ที่ต้องใช้
  OAuth เรียกใช้ `openclaw mcp login <name>` เพื่อจัดเก็บโทเค็นภายใต้สถานะ OpenClaw
- `mcp.servers.<name>.oauth`: การแทนที่ขอบเขต OAuth, URL เปลี่ยนเส้นทาง และ URL
  ข้อมูลเมตาไคลเอนต์ที่เป็นตัวเลือก
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: ตัวควบคุม HTTP TLS
  สำหรับปลายทางส่วนตัวและ TLS แบบสองทาง
- `mcp.servers.<name>.toolFilter`: การเลือกเครื่องมือแยกตามเซิร์ฟเวอร์ที่เป็นตัวเลือก `include`
  จำกัดเครื่องมือ MCP ที่ค้นพบให้เหลือเฉพาะชื่อที่ตรงกัน ส่วน `exclude` ซ่อนชื่อที่ตรงกัน
  รายการเป็นชื่อเครื่องมือ MCP แบบตรงตัวหรือรูปแบบ glob อย่างง่าย `*` เซิร์ฟเวอร์ที่มี
  ทรัพยากรหรือพรอมต์จะสร้างชื่อเครื่องมืออรรถประโยชน์ด้วย (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`) และชื่อเหล่านั้นใช้
  ตัวกรองเดียวกัน
- `mcp.servers.<name>.codex`: ตัวควบคุมการฉายภาพไปยังเซิร์ฟเวอร์แอป Codex ที่เป็นตัวเลือก
  บล็อกนี้เป็นข้อมูลเมตาของ OpenClaw สำหรับเธรดเซิร์ฟเวอร์แอป Codex เท่านั้น โดยไม่มี
  ผลต่อเซสชัน ACP การกำหนดค่าฮาร์เนส Codex ทั่วไป หรืออะแดปเตอร์รันไทม์อื่น
  `codex.agents` ที่ไม่ว่างจะจำกัดเซิร์ฟเวอร์ไว้เฉพาะรหัสเอเจนต์ OpenClaw ที่ระบุ
  รายการเอเจนต์ที่กำหนดขอบเขตซึ่งว่าง มีเฉพาะช่องว่าง หรือไม่ถูกต้อง จะถูกปฏิเสธโดยการตรวจสอบ
  การกำหนดค่า และถูกละเว้นจากพาธการฉายของรันไทม์แทนที่จะกลายเป็นค่าทั่วทั้งระบบ
  `codex.defaultToolsApprovalMode` ส่งออก
  `default_tools_approval_mode` แบบเนทีฟของ Codex สำหรับเซิร์ฟเวอร์นั้น OpenClaw จะตัดบล็อก `codex`
  ออกก่อนส่งการกำหนดค่า `mcp_servers` แบบเนทีฟไปยัง Codex ละเว้นบล็อกนี้เพื่อ
  ให้เซิร์ฟเวอร์ถูกฉายไปยังเอเจนต์เซิร์ฟเวอร์แอป Codex ทุกตัว โดยใช้พฤติกรรม
  การอนุมัติ MCP เริ่มต้นของ Codex
- รันไทม์ MCP ที่รวมในบันเดิลและจำกัดขอบเขตตามเซสชันใช้ TTL เมื่อไม่มีการใช้งาน 10 นาทีในตัว
  การรันแบบฝังตัวครั้งเดียวจะขอให้ล้างข้อมูลเมื่อการรันสิ้นสุด ส่วน TTL เป็นกลไกสำรองสำหรับเซสชันที่ทำงานยาวนานและผู้เรียกในอนาคต
- การเปลี่ยนแปลงภายใต้ `mcp.*` จะมีผลทันทีโดยยกเลิกรันไทม์ MCP ของเซสชันที่แคชไว้
  การค้นพบ/ใช้เครื่องมือครั้งถัดไปจะสร้างรันไทม์ใหม่จากการกำหนดค่าใหม่ ดังนั้นรายการ
  `mcp.servers` ที่ถูกนำออกจะถูกเก็บกวาดทันทีแทนที่จะรอ TTL เมื่อไม่มีการใช้งาน
- การค้นพบของรันไทม์ยังรองรับการแจ้งเตือนการเปลี่ยนแปลงรายการเครื่องมือ MCP โดยล้าง
  แค็ตตาล็อกที่แคชไว้สำหรับเซสชันนั้น เซิร์ฟเวอร์ที่ประกาศทรัพยากรหรือ
  พรอมต์จะได้รับเครื่องมืออรรถประโยชน์สำหรับแสดงรายการ/อ่านทรัพยากร และแสดงรายการ/ดึง
  พรอมต์ ความล้มเหลวของการเรียกเครื่องมือซ้ำ ๆ จะหยุดเซิร์ฟเวอร์ที่ได้รับผลกระทบไว้ชั่วครู่ก่อน
  พยายามเรียกอีกครั้ง

โปรดดู [MCP](/th/cli/mcp#openclaw-as-an-mcp-client-registry) และ
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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // หรือสตริงข้อความธรรมดา
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: รายการอนุญาตที่เป็นตัวเลือกสำหรับ Skills ที่รวมในบันเดิลเท่านั้น (ไม่มีผลต่อ Skills ที่มีการจัดการ/ในพื้นที่ทำงาน)
- `load.extraDirs`: รูท Skills ที่ใช้ร่วมกันเพิ่มเติม (ลำดับความสำคัญต่ำสุด)
- `load.allowSymlinkTargets`: รูทเป้าหมายจริงที่เชื่อถือได้ซึ่งลิงก์สัญลักษณ์ของ Skills สามารถ
  ชี้ไปได้ เมื่อลิงก์อยู่นอกรูทต้นทางที่กำหนดค่าไว้
- `workshop.allowSymlinkTargetWrites`: อนุญาตให้การนำการเปลี่ยนแปลงจาก Skill Workshop ไปใช้ เขียน
  ผ่านไปยังเป้าหมายลิงก์สัญลักษณ์ที่เชื่อถืออยู่แล้ว (ค่าเริ่มต้น: false)
- `install.preferBrew`: เมื่อเป็น true ให้เลือกใช้ตัวติดตั้ง Homebrew ก่อนเมื่อมี `brew`
  แล้วจึงถอยไปใช้ตัวติดตั้งชนิดอื่น
- `install.nodeManager`: ตัวเลือกตัวติดตั้ง Node สำหรับข้อกำหนด `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`)
- `install.allowUploadedArchives`: อนุญาตให้ไคลเอนต์ Gateway `operator.admin` ที่เชื่อถือได้
  ติดตั้งไฟล์เก็บถาวร zip ส่วนตัวที่จัดเตรียมผ่าน `skills.upload.*`
  (ค่าเริ่มต้น: false) การตั้งค่านี้เปิดใช้เฉพาะพาธไฟล์เก็บถาวรที่อัปโหลดเท่านั้น การติดตั้ง ClawHub
  ตามปกติไม่จำเป็นต้องใช้
- `entries.<skillKey>.enabled: false` ปิดใช้งาน Skills แม้ว่าจะรวมในบันเดิล/ติดตั้งไว้แล้ว
- `entries.<skillKey>.apiKey`: ตัวช่วยอำนวยความสะดวกสำหรับ Skills ที่ประกาศตัวแปรสภาพแวดล้อมหลัก (สตริงข้อความธรรมดาหรือออบเจ็กต์ SecretRef)
- `limits.maxCandidatesPerRoot`, `limits.maxSkillsLoadedPerSource`, `limits.maxSkillsInPrompt`, `limits.maxSkillsPromptChars`, `limits.maxSkillFileBytes`: จำกัดการค้นพบ Skills และพรอมต์ Skills ที่แสดงต่อโมเดล
- การตั้งค่าความเป็นอิสระ/การอนุมัติของ Skill Workshop (`workshop.autonomous.enabled`, `workshop.approvalPolicy`, `workshop.maxPending`, `workshop.maxSkillBytes`) มีเอกสารอยู่ใน [การกำหนดค่า Skills](/th/tools/skills-config)

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
- วางไฟล์ Plugin แบบสแตนด์อโลนไว้ใน `plugins.load.paths`; รากส่วนขยายที่ค้นพบโดยอัตโนมัติจะละเว้นไฟล์ระดับบนสุด `.js`, `.mjs` และ `.ts` เพื่อไม่ให้สคริปต์ตัวช่วยในรากเหล่านั้นขัดขวางการเริ่มทำงาน
- การค้นหารองรับทั้ง Plugin แบบเนทีฟของ OpenClaw บันเดิล Codex ที่เข้ากันได้ และบันเดิล Claude รวมถึงบันเดิล Claude ที่ไม่มีแมนิเฟสต์และใช้เค้าโครงเริ่มต้น
- **การเปลี่ยนแปลงการกำหนดค่าต้องรีสตาร์ต Gateway**
- `allow`: รายการอนุญาตที่ไม่บังคับ (โหลดเฉพาะ Plugin ที่ระบุไว้) โดย `deny` มีลำดับความสำคัญสูงกว่า
- `plugins.entries.<id>.apiKey`: ฟิลด์อำนวยความสะดวกสำหรับคีย์ API ระดับ Plugin (เมื่อ Plugin รองรับ)
- `plugins.entries.<id>.env`: แมปตัวแปรสภาพแวดล้อมที่จำกัดขอบเขตเฉพาะ Plugin
- `plugins.entries.<id>.hooks.allowPromptInjection`: เมื่อเป็น `false` แกนหลักจะบล็อกฮุกที่แก้ไขพรอมต์ เช่น `before_prompt_build` โดยมีผลกับฮุกของ Plugin แบบเนทีฟและไดเรกทอรีฮุกที่มาจากบันเดิลซึ่งรองรับ
- `plugins.entries.<id>.hooks.allowConversationAccess`: เมื่อเป็น `true` Plugin ที่เชื่อถือได้และไม่ได้รวมมาในบันเดิลสามารถอ่านเนื้อหาการสนทนาดิบจากฮุกแบบมีชนิด เช่น `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` และ `agent_end`
- `plugins.entries.<id>.subagent.allowModelOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนเพื่อให้ร้องขอการแทนที่ `provider` และ `model` ต่อการรันสำหรับการรันเอเจนต์ย่อยเบื้องหลัง
- `plugins.entries.<id>.subagent.allowedModels`: รายการอนุญาตที่ไม่บังคับของเป้าหมาย `provider/model` แบบมาตรฐานสำหรับการแทนที่ของเอเจนต์ย่อยที่เชื่อถือได้ ใช้ `"*"` เฉพาะเมื่อตั้งใจอนุญาตโมเดลใดก็ได้
- `plugins.entries.<id>.llm.allowModelOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนเพื่อให้ร้องขอการแทนที่โมเดลสำหรับ `api.runtime.llm.complete`
- `plugins.entries.<id>.llm.allowedModels`: รายการอนุญาตที่ไม่บังคับของเป้าหมาย `provider/model` แบบมาตรฐานสำหรับการแทนที่การเติมข้อความ LLM ของ Plugin ที่เชื่อถือได้ ใช้ `"*"` เฉพาะเมื่อตั้งใจอนุญาตโมเดลใดก็ได้
- `plugins.entries.<id>.llm.allowAgentIdOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนเพื่อให้รัน `api.runtime.llm.complete` กับรหัสเอเจนต์ที่ไม่ใช่ค่าเริ่มต้น
- `plugins.entries.<id>.config`: ออบเจ็กต์การกำหนดค่าที่ Plugin กำหนด (ตรวจสอบความถูกต้องด้วยสคีมา Plugin แบบเนทีฟของ OpenClaw เมื่อมี)
- การตั้งค่าบัญชี/รันไทม์ของ Plugin ช่องทางอยู่ภายใต้ `channels.<id>` และควรอธิบายด้วยข้อมูลเมตา `channelConfigs` ในแมนิเฟสต์ของ Plugin เจ้าของ ไม่ใช่ด้วยรีจิสทรีตัวเลือกส่วนกลางของ OpenClaw

### การกำหนดค่า Plugin ของชุดควบคุม Codex

Plugin `codex` ที่รวมมาในบันเดิลเป็นเจ้าของการตั้งค่าชุดควบคุมเซิร์ฟเวอร์แอป Codex แบบเนทีฟภายใต้
`plugins.entries.codex.config` ดูพื้นผิวการกำหนดค่าทั้งหมดได้ที่
[ข้อมูลอ้างอิงชุดควบคุม Codex](/th/plugins/codex-harness-reference) และดูโมเดลรันไทม์ได้ที่
[ชุดควบคุม Codex](/th/plugins/codex-harness)

`codexPlugins` มีผลเฉพาะกับเซสชันที่เลือกชุดควบคุม Codex แบบเนทีฟ
ค่านี้ไม่เปิดใช้งาน Plugin Codex สำหรับการรันผู้ให้บริการของ OpenClaw การผูกการสนทนา
ACP หรือชุดควบคุมอื่นที่ไม่ใช่ Codex

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
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
  Plugin/แอป Codex แบบเนทีฟสำหรับชุดควบคุม Codex ค่าเริ่มต้น: `false`
- `plugins.entries.codex.config.codexPlugins.allow_all_plugins`: เปิดเผยทุกแอป
  ที่เข้าถึงได้ในขณะนั้นและเชื่อมต่อกับบัญชี Codex ที่ผ่านการตรวจสอบสิทธิ์แล้วใน
  เธรด Codex แบบเนทีฟใหม่แต่ละเธรด ค่าเริ่มต้น: `false`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  นโยบายเริ่มต้นสำหรับการดำเนินการที่ทำลายข้อมูลในการร้องขอข้อมูลจากแอป Plugin ที่กำหนดค่าไว้
  ใช้ `true` เพื่อยอมรับสคีมาการอนุมัติ Codex ที่ปลอดภัยโดยไม่แสดงพรอมต์ ใช้ `false`
  เพื่อปฏิเสธ ใช้ `"auto"` เพื่อส่งต่อการอนุมัติที่ Codex กำหนดให้ต้องมีผ่านการอนุมัติ
  Plugin ของ OpenClaw หรือใช้ `"ask"` เพื่อแสดงพรอมต์สำหรับทุกการเขียน/การดำเนินการที่ทำลายข้อมูล
  ของ Plugin โดยไม่มีการอนุมัติแบบถาวร โหมด `"ask"` จะล้างการแทนที่การอนุมัติ
  ต่อเครื่องมือแบบถาวรของ Codex สำหรับแอปที่ได้รับผลกระทบ และเลือกผู้ตรวจสอบการอนุมัติที่เป็นมนุษย์
  สำหรับแอปนั้นก่อนเริ่มเธรด Codex
  ค่าเริ่มต้น: `true`
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: เปิดใช้งาน
  รายการ Plugin ที่กำหนดค่าไว้เมื่อ `codexPlugins.enabled` ส่วนกลางเป็น true ด้วย
  ค่าเริ่มต้น: `true` สำหรับรายการที่ระบุอย่างชัดเจน
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  อัตลักษณ์มาร์เก็ตเพลสที่คงที่ ซึ่งต้องใช้ร่วมกับ `pluginName` สำหรับทุกรายการที่แก้ไขได้
  รองรับ `"openai-curated"` และ `"workspace-directory"` รายการที่
  ขาดฟิลด์อัตลักษณ์อย่างใดอย่างหนึ่งจะถูกละเว้น
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: อัตลักษณ์
  Plugin Codex ที่คงที่ ซึ่งต้องใช้ร่วมกับ `marketplaceName` รายการ
  `workspace-directory` ต้องใช้ `summary.id` ที่มีการระบุมาร์เก็ตเพลสกำกับอย่างถูกต้อง
  ซึ่งส่งคืนโดย `plugin/list` เช่น
  `"example-plugin@workspace-directory"`
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  การแทนที่การดำเนินการที่ทำลายข้อมูลต่อ Plugin เมื่อละไว้ ระบบจะใช้ค่า
  `allow_destructive_actions` ส่วนกลาง ค่าต่อ Plugin รองรับนโยบาย
  `true`, `false`, `"auto"` หรือ `"ask"` เช่นเดียวกัน

ทุกแอป Plugin ที่ได้รับอนุญาตและใช้ `"ask"` จะส่งต่อคำขออนุมัติของแอปนั้น
ไปยังผู้ตรวจสอบที่เป็นมนุษย์ แอปอื่นและการอนุมัติเธรดที่ไม่ใช่แอปจะยังคงใช้
ผู้ตรวจสอบที่กำหนดค่าไว้ ดังนั้นนโยบาย Plugin แบบผสมจะไม่สืบทอดพฤติกรรม
`"ask"`

`codexPlugins.enabled` เป็นคำสั่งเปิดใช้งานส่วนกลาง รายการ Plugin ที่ระบุอย่างชัดเจน
ซึ่งเขียนโดยการย้ายข้อมูลคือชุดสิทธิ์แบบถาวรสำหรับการติดตั้งที่คัดสรรและการซ่อมแซม
รายการ `workspace-directory` ที่กำหนดค่าด้วยตนเองต้องติดตั้งและเปิดใช้งานอยู่แล้ว
และแอปที่รายการเหล่านั้นเป็นเจ้าของต้องเข้าถึงได้ โดย OpenClaw
จะไม่ติดตั้งหรือตรวจสอบสิทธิ์ให้ หาก Codex ปฏิเสธคำขอแค็ตตาล็อกพื้นที่ทำงาน
ที่ระบุอย่างชัดเจน รายการพื้นที่ทำงานที่เปิดใช้งานจะปฏิเสธการทำงานอย่างปลอดภัยด้วย
`marketplace_missing` ขณะที่รายการที่คัดสรรจากแค็ตตาล็อกเริ่มต้นยังคง
พร้อมใช้งาน ไม่รองรับ `plugins["*"]` ไม่มีสวิตช์ `install` และ
ค่า `marketplacePath` ภายในเครื่องไม่ได้เป็นฟิลด์การกำหนดค่าโดยเจตนา เนื่องจาก
ขึ้นอยู่กับโฮสต์ ดูข้อกำหนดเวอร์ชันและความพร้อมของเซิร์ฟเวอร์แอปได้ที่
[Plugin Codex แบบเนทีฟ](/th/plugins/codex-native-plugins)

การตรวจสอบความพร้อมของ `app/list` จะถูกแคชไว้หนึ่งชั่วโมงและรีเฟรช
แบบอะซิงโครนัสเมื่อข้อมูลเก่า การกำหนดค่าแอปของเธรด Codex จะคำนวณเมื่อสร้าง
เซสชันชุดควบคุม Codex ไม่ใช่ในทุกเทิร์น หลังเปลี่ยนการกำหนดค่า Plugin แบบเนทีฟ ให้ใช้ `/new`, `/reset` หรือรีสตาร์ต Gateway

`codexPlugins.allow_all_plugins` จะบันทึกสแนปช็อตของทุกแอปในบัญชีที่เข้าถึงได้ในขณะนั้น
ลงในเธรด Codex แบบเนทีฟใหม่แต่ละเธรด ค่านี้ไม่ติดตั้ง Plugin หรือแอป และ
แอปที่เข้าถึงไม่ได้จะยังคงถูกยกเว้น แอปในบัญชีใช้นโยบายส่วนกลาง
`codexPlugins.allow_destructive_actions` รายการ Plugin ที่ระบุอย่างชัดเจนมี
ลำดับความสำคัญสูงกว่าเมื่อมีแอปเดียวกันอยู่ในทั้งสองเส้นทาง หากไม่สามารถอ่าน
`app/list` ได้ การเปิดเผยทั่วทั้งบัญชีจะปฏิเสธการทำงานอย่างปลอดภัย

- `plugins.entries.firecrawl.config.webFetch`: การตั้งค่าผู้ให้บริการดึงข้อมูลเว็บ Firecrawl
  - `apiKey`: คีย์ API ของ Firecrawl ที่ไม่บังคับสำหรับขีดจำกัดที่สูงขึ้น (รองรับ SecretRef) หากไม่มีจะใช้ตัวแปรสภาพแวดล้อม `plugins.entries.firecrawl.config.webSearch.apiKey` หรือ `FIRECRAWL_API_KEY`
  - `baseUrl`: URL ฐาน API ของ Firecrawl (ค่าเริ่มต้น: `https://api.firecrawl.dev`; การแทนที่แบบโฮสต์เองต้องชี้ไปยังปลายทางส่วนตัว/ภายใน)
  - `onlyMainContent`: แยกเฉพาะเนื้อหาหลักจากหน้าเว็บ (ค่าเริ่มต้น: `true`)
  - `maxAgeMs`: อายุสูงสุดของแคชในหน่วยมิลลิวินาที (ค่าเริ่มต้น: `172800000` / 2 วัน)
  - `timeoutSeconds`: ระยะหมดเวลาของคำขอสแครปในหน่วยวินาที (ค่าเริ่มต้น: `60`)
- `plugins.entries.xai.config.xSearch`: การตั้งค่า xAI X Search (การค้นหาเว็บด้วย Grok)
  - `enabled`: เปิดใช้งานผู้ให้บริการ X Search
  - `model`: โมเดล Grok ที่ใช้สำหรับการค้นหา (เช่น `"grok-4.3"`)
- `plugins.entries.memory-core.config.dreaming`: การตั้งค่า Dreaming ของหน่วยความจำ ดูระยะและเกณฑ์ได้ที่ [Dreaming](/th/concepts/dreaming)
  - `enabled`: สวิตช์หลักของ Dreaming (ค่าเริ่มต้น `false`)
  - `frequency`: รอบเวลา Cron สำหรับการกวาด Dreaming แบบเต็มแต่ละครั้ง (ค่าเริ่มต้นคือ `"0 3 * * *"`)
  - `model`: การแทนที่โมเดลเอเจนต์ย่อย Dream Diary ที่ไม่บังคับ ต้องใช้ `plugins.entries.memory-core.subagent.allowModelOverride: true`; ใช้คู่กับ `allowedModels` เพื่อจำกัดเป้าหมาย ข้อผิดพลาดที่โมเดลไม่พร้อมใช้งานจะลองอีกครั้งหนึ่งครั้งด้วยโมเดลเริ่มต้นของเซสชัน ส่วนความล้มเหลวด้านความเชื่อถือหรือรายการอนุญาตจะไม่ย้อนกลับไปใช้ค่าอื่นโดยไม่แจ้ง
  - นโยบายและเกณฑ์ของแต่ละระยะเป็นรายละเอียดการนำไปใช้ (ไม่ใช่คีย์การกำหนดค่าที่ผู้ใช้มองเห็น)
- การกำหนดค่าหน่วยความจำทั้งหมดอยู่ใน [ข้อมูลอ้างอิงการกำหนดค่าหน่วยความจำ](/th/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugin บันเดิล Claude ที่เปิดใช้งานยังสามารถเพิ่มค่าเริ่มต้น OpenClaw แบบฝังจาก `settings.json` ได้ โดย OpenClaw จะนำค่าเหล่านั้นไปใช้เป็นการตั้งค่าเอเจนต์ที่ผ่านการกรอง ไม่ใช่แพตช์การกำหนดค่า OpenClaw แบบดิบ
- `plugins.slots.memory`: เลือกรหัส Plugin หน่วยความจำที่ใช้งานอยู่ หรือใช้ `"none"` เพื่อปิดใช้งาน Plugin หน่วยความจำ
- `plugins.slots.contextEngine`: เลือกรหัส Plugin กลไกบริบทที่ใช้งานอยู่ ค่าเริ่มต้นคือ `"legacy"` เว้นแต่จะติดตั้งและเลือกกลไกอื่น

ดู [Plugin](/th/tools/plugin)

---

## ข้อผูกพัน

`commitments` ควบคุมหน่วยความจำการติดตามผลที่อนุมาน: OpenClaw สามารถตรวจจับการกลับมาติดตามผลจากเทิร์นการสนทนาและส่งผ่านการรัน Heartbeat

- `commitments.enabled`: เปิดใช้งานการสกัดข้อมูลด้วย LLM แบบซ่อน การจัดเก็บ และการส่งผ่าน Heartbeat สำหรับข้อผูกพันการติดตามผลที่อนุมาน ค่าเริ่มต้น: `false`
- `commitments.maxPerDay`: จำนวนสูงสุดของข้อผูกพันการติดตามผลที่อนุมานซึ่งส่งต่อได้ต่อเซสชันเอเจนต์ภายในช่วงเวลาหนึ่งวันแบบต่อเนื่อง ค่าเริ่มต้น: `3`

ดู [ข้อผูกพันที่อนุมาน](/th/concepts/commitments)

---

## เบราว์เซอร์

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // เลือกใช้เฉพาะสำหรับการเข้าถึงเครือข่ายส่วนตัวที่เชื่อถือได้
      // allowPrivateNetwork: true, // ชื่อแทนเดิม
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
- `tabCleanup` ควบคุมการล้างข้อมูลเป็นระยะอย่างสุดความสามารถสำหรับแท็บของเอเจนต์หลัก
  ที่ติดตาม หลังไม่มีการใช้งานหรือเมื่อเซสชันเกินขีดจำกัด การติดตามมีผลเฉพาะ
  กับแท็บที่สร้างโดยเครื่องมือเบราว์เซอร์ `action: "open"` เท่านั้น ส่วนแท็บที่ผู้ใช้เปิดหรือ
  ไม่ทราบเจ้าของจะไม่ถูกรับมาอยู่ภายใต้การจัดการ การปิดใช้งาน `tabCleanup` ไม่ได้ปิดใช้งานการล้างข้อมูลวงจรชีวิตเซสชันที่สั่งอย่างชัดเจน
- การเปิดภายในโฮสต์ด้วยเป้าหมาย CDP แบบเนทีฟและข้อมูลประจำตัวเบราว์เซอร์ที่คงที่
  จะถูกจัดเก็บในสถานะ SQLite ที่ใช้ร่วมกัน และยังคงมีสิทธิ์ข้ามการรีสตาร์ต Gateway สำหรับ
  `/new` และการล้างข้อมูลวงจรชีวิตเซสชัน เป้าหมาย CDP แบบเนทีฟที่เปิดให้เครื่องมือใช้งานยัง
  คงมีสิทธิ์รับการล้างเมื่อไม่มีการใช้งานและเมื่อเกินขีดจำกัดหลังรีสตาร์ต Chrome MCP ใช้
  แฮนเดิลเป้าหมายภายในโปรเซส ดังนั้นระเบียนเซสชันที่มีอยู่แบบเริ่มต้นใหม่จะรอ
  การล้างข้อมูลตามวงจรชีวิต แทนที่จะเสี่ยงกวาดล้างเมื่อไม่มีการใช้งานโดยอิงกับกิจกรรมหลังรีสตาร์ต
  ที่ไม่สามารถระบุที่มาได้ OpenClaw จะตรวจสอบโปรไฟล์และอินสแตนซ์เบราว์เซอร์
  ก่อนปิด การเชื่อมต่ออัตโนมัติของ Chrome MCP, ข้อมูลประจำตัวเบราว์เซอร์ `/json/version`
  ที่หายไป และเป้าหมายแบบเนทีฟที่ยังแก้ไขไม่ได้จะยังคงอยู่ภายในโปรเซสทั้งหมด ดังนั้น
  จึงไม่ถูกปิดโดยอัตโนมัติหลังรีสตาร์ต แท็บเก่าที่ไม่ได้ติดตาม
  ต้องปิดด้วยตนเอง ความล้มเหลวชั่วคราวจะคงสถานะรอดำเนินการไว้เพื่อลองอีกครั้งภายหลัง ดู
  [ความเป็นเจ้าของการล้างแท็บ](/th/tools/browser#tab-cleanup-ownership)
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` จะถูกปิดใช้งานเมื่อไม่ได้กำหนดค่า ดังนั้นการนำทางของเบราว์เซอร์จึงยังคงเข้มงวดโดยค่าเริ่มต้น
- กำหนด `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เฉพาะเมื่อคุณตั้งใจเชื่อถือการนำทางของเบราว์เซอร์ในเครือข่ายส่วนตัว
- ในโหมดเข้มงวด ปลายทางโปรไฟล์ CDP ระยะไกล (`profiles.*.cdpUrl`) จะอยู่ภายใต้การบล็อกเครือข่ายส่วนตัวแบบเดียวกันระหว่างการตรวจสอบการเข้าถึง/การค้นหา
- `ssrfPolicy.allowPrivateNetwork` ยังคงรองรับในฐานะนามแฝงแบบเดิม
- ในโหมดเข้มงวด ให้ใช้ `ssrfPolicy.hostnameAllowlist` และ `ssrfPolicy.allowedHostnames` สำหรับข้อยกเว้นที่ระบุอย่างชัดเจน
- โปรไฟล์ระยะไกลรองรับเฉพาะการเชื่อมต่อแนบ (ปิดใช้งานการเริ่ม/หยุด/รีเซ็ต)
- `profiles.*.cdpUrl` ยอมรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) เมื่อต้องการให้ OpenClaw ค้นหา `/json/version`; ใช้ WS(S)
  เมื่อผู้ให้บริการมอบ URL ของ DevTools WebSocket โดยตรง
- หากเข้าถึงบริการ CDP ที่จัดการจากภายนอกผ่านลูปแบ็กได้ ให้กำหนด
  `attachOnly: true` ของโปรไฟล์นั้น มิฉะนั้น OpenClaw จะถือว่าพอร์ตลูปแบ็กเป็น
  โปรไฟล์เบราว์เซอร์ภายในที่มีการจัดการ และอาจรายงานข้อผิดพลาดเกี่ยวกับความเป็นเจ้าของพอร์ตภายใน
- โปรไฟล์ `existing-session` ใช้ Chrome MCP แทน CDP และสามารถเชื่อมต่อแนบ
  บนโฮสต์ที่เลือกหรือผ่าน Node เบราว์เซอร์ที่เชื่อมต่ออยู่
- โปรไฟล์ `existing-session` สามารถกำหนด `userDataDir` เพื่อเลือกโปรไฟล์
  เบราว์เซอร์ที่ใช้ Chromium โดยเฉพาะ เช่น Brave หรือ Edge
- โปรไฟล์ `existing-session` สามารถกำหนด `cdpUrl` เมื่อ Chrome ทำงานอยู่แล้ว
  หลังปลายทางค้นหา DevTools แบบ HTTP(S) หรือปลายทาง WS(S) โดยตรง ใน
  โหมดดังกล่าว OpenClaw จะส่งปลายทางให้ Chrome MCP แทนการใช้การเชื่อมต่ออัตโนมัติ
  และจะไม่ใช้ `userDataDir` เป็นอาร์กิวเมนต์เปิด Chrome MCP
- โปรไฟล์ `existing-session` ยังคงใช้ข้อจำกัดเส้นทาง Chrome MCP ปัจจุบัน:
  การดำเนินการที่ขับเคลื่อนด้วยสแนปช็อต/การอ้างอิงแทนการกำหนดเป้าหมายด้วยตัวเลือก CSS, ฮุกอัปโหลด
  ไฟล์เดียว, ไม่มีการแทนที่ระยะหมดเวลาของกล่องโต้ตอบ, ไม่มี `wait --load networkidle` และไม่มี
  `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด หรือการดำเนินการแบบกลุ่ม
- โปรไฟล์ `openclaw` ภายในที่มีการจัดการจะกำหนด `cdpPort` และ `cdpUrl` โดยอัตโนมัติ ให้กำหนด
  `cdpUrl` อย่างชัดเจนเฉพาะสำหรับโปรไฟล์ CDP ระยะไกลหรือการเชื่อมต่อแนบกับปลายทาง
  ของเซสชันที่มีอยู่
- โปรไฟล์ภายในที่มีการจัดการสามารถกำหนด `executablePath` เพื่อแทนที่ค่า
  `browser.executablePath` ส่วนกลางสำหรับโปรไฟล์นั้น ใช้ตัวเลือกนี้เพื่อเรียกใช้โปรไฟล์หนึ่งใน
  Chrome และอีกโปรไฟล์หนึ่งใน Brave
- ลำดับการตรวจหาอัตโนมัติ: เบราว์เซอร์เริ่มต้นหากใช้ Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary
- ทั้ง `browser.executablePath` และ `browser.profiles.<name>.executablePath`
  ยอมรับ `~` และ `~/...` สำหรับไดเรกทอรีหลักของระบบปฏิบัติการก่อนเปิด Chromium
  นอกจากนี้ `userDataDir` รายโปรไฟล์บนโปรไฟล์ `existing-session` จะถูกขยายเครื่องหมายทิลดาด้วย
- บริการควบคุม: ลูปแบ็กเท่านั้น (พอร์ตได้มาจาก `gateway.port`, ค่าเริ่มต้น `18791`)
- `extraArgs` เพิ่มแฟล็กการเปิดเพิ่มเติมในการเริ่มต้น Chromium ภายใน (ตัวอย่างเช่น
  `--disable-gpu`, การกำหนดขนาดหน้าต่าง หรือแฟล็กดีบัก)

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // อีโมจิ ข้อความสั้น URL รูปภาพ หรือ data URI
    },
    prefs: {
      theme: "claw", // claw | knot | dash | custom
      themeMode: "system", // light | dark | system
      textScale: 100, // 90 | 100 | 110 | 125 | 140
      locale: "en",
      chatShowThinking: true,
      chatShowToolCalls: true,
      chatPersistCommentary: true, // เก็บคำบรรยายหลังการทำงานใน Control UI แต่ไม่ส่งไปยังช่องทาง
      chatSendShortcut: "enter", // enter | modifier-enter
      chatFollowUpMode: "steer", // steer | queue; ละไว้เพื่อใช้โหมดคิวของเซิร์ฟเวอร์
    },
  },
}
```

- `seamColor`: สีเน้นสำหรับองค์ประกอบ UI ของแอปแบบเนทีฟ (สีฟอง Talk Mode เป็นต้น)
- `assistant`: การแทนที่ข้อมูลประจำตัวใน Control UI หากไม่มีจะใช้ข้อมูลประจำตัวของเอเจนต์ที่ทำงานอยู่
- `prefs`: การกำหนดค่าการแสดงผลของผู้ดำเนินการ นี่คือตำแหน่งหลักที่เป็นมาตรฐาน เพื่อให้เอเจนต์สามารถ
  เปลี่ยนค่าเหล่านี้ผ่านด่านการอนุมัติ และทำให้ไคลเอนต์ Control UI ทุกตัว
  ซิงค์ตรงกัน เบราว์เซอร์จะจำลองค่าไปยังที่จัดเก็บภายในเพื่อให้เริ่มทำงานได้ทันที และเก็บ
  สำเนาเฉพาะอุปกรณ์ไว้เมื่อไม่สามารถเขียนการกำหนดค่าได้ (ขอบเขตผู้ดู, ออฟไลน์)
  `chatPersistCommentary` มีค่าเริ่มต้นเป็น `true` การกำหนดเป็น `false` จะทำให้
  คำบรรยายสดยังคงมองเห็นได้ระหว่างการทำงาน แต่จะลบออกเมื่อเสร็จสิ้น และป้องกันไม่ให้
  คำบรรยายใหม่ของ Codex เข้าสู่สำเนาทรานสคริปต์ถาวร การส่งไปยังช่องทางรับส่งข้อความ
  ยังคงแยกจากกันและไม่เปลี่ยนแปลง
  ไคลเอนต์ที่เชื่อมต่อจะนำการเปลี่ยนแปลงฝั่งเซิร์ฟเวอร์ไปใช้แบบสด: Gateway จะเผยแพร่
  เหตุการณ์ `config.changed` ที่มีเฉพาะแฮชหลังการเขียนการกำหนดค่าถาวรทุกครั้ง และ
  ไคลเอนต์จะรีเฟรชสแนปช็อตของตน (ข้ามขั้นตอนนี้เมื่อฉบับร่างการตั้งค่าภายในมี
  การแก้ไขที่ยังไม่ได้บันทึก) ไคลเอนต์ที่เชื่อมต่อใหม่จะปรับสถานะให้ตรงกันเมื่อเชื่อมต่อ

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
      // password: "your-password", // หรือ OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // สำหรับ mode=trusted-proxy; ดู /gateway/trusted-proxy-auth
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
      // toolTitles: false, // เลือกใช้ชื่อวัตถุประสงค์ที่ AI สร้างสำหรับการเรียกเครื่องมือ (ใช้โทเค็นของโมเดลอรรถประโยชน์)
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // อันตราย: อนุญาต URL ฝังภายนอกแบบ http(s) ที่เป็น URL สัมบูรณ์
      // chatMessageMaxWidth: "min(1280px, 82%)", // ความกว้างสูงสุดของทรานสคริปต์แชตที่จัดกึ่งกลางซึ่งกำหนดหรือไม่ก็ได้
      // allowedOrigins: ["https://control.example.com"], // จำเป็นสำหรับ Control UI ที่ไม่ใช่ลูปแบ็ก
      // dangerouslyAllowHostHeaderOriginFallback: false, // โหมดสำรองต้นทางจากส่วนหัว Host ที่เป็นอันตราย
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    terminal: {
      enabled: false,
      // shell: "/bin/zsh",
    },
    remote: {
      url: "ws://127.0.0.1:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // ไม่บังคับ ค่าเริ่มต้นคือ false
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // ไม่บังคับ ค่าเริ่มต้นคือไม่ได้กำหนด/ปิดใช้งาน
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
        // การอนุมัติอัตโนมัติที่ตรวจสอบด้วย SSH ค่าเริ่มต้น: เปิดใช้งาน (true)
        // กำหนดเป็น false เพื่อปิดใช้งานเฉพาะการตรวจสอบ SSH ซึ่งไม่ส่งผลต่อ
        // autoApproveCidrs ด้านบน สำหรับการจับคู่ Node ด้วยตนเองเท่านั้น ให้กำหนดเป็น false และ
        // ไม่กำหนด autoApproveCidrs ส่งออบเจ็กต์เพื่อปรับแต่ง: { user, identity,
        // timeoutMs, cidrs }
        sshVerify: true,
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // การปฏิเสธ HTTP เพิ่มเติมสำหรับ /tools/invoke
      deny: ["browser"],
      // นำเครื่องมือออกจากรายการปฏิเสธ HTTP เริ่มต้นสำหรับผู้เรียกที่เป็นเจ้าของ/ผู้ดูแลระบบ
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

- `mode`: `local` (เรียกใช้ Gateway) หรือ `remote` (เชื่อมต่อกับ Gateway ระยะไกล) Gateway จะปฏิเสธการเริ่มทำงาน เว้นแต่ `local`
- `port`: พอร์ตมัลติเพล็กซ์เดียวสำหรับ WS + HTTP ลำดับความสำคัญ: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`
- `bind`: `auto`, `loopback` (ค่าเริ่มต้น), `lan` (`0.0.0.0`), `tailnet` (IPv4 ของ Tailscale เมื่อพร้อมใช้งาน มิฉะนั้นใช้ลูปแบ็ก) หรือ `custom` (ที่อยู่ IPv4 หนึ่งรายการ) ที่อยู่ `tailnet` ที่ผ่านการแปลงค่าแล้วและที่อยู่ `custom` ใดๆ ที่ไม่ใช่ `127.0.0.1` หรือ `0.0.0.0` ต้องใช้ `127.0.0.1` บนพอร์ตเดียวกันสำหรับไคลเอนต์บนโฮสต์เดียวกัน การเริ่มทำงานจะล้มเหลวหาก Listener ใด Listener หนึ่งไม่สามารถผูกได้ การเปิดรับการเชื่อมต่อที่ไม่ใช่ลูปแบ็กยังคงจำกัดอยู่ที่อินเทอร์เฟซที่เลือก
- **นามแฝงการผูกแบบเดิม**: ใช้ค่าของโหมดการผูกใน `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`) ไม่ใช่นามแฝงโฮสต์ (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`)
- **หมายเหตุเกี่ยวกับ Docker**: การผูก `loopback` เริ่มต้นจะรับฟังที่ `127.0.0.1` ภายในคอนเทนเนอร์ เมื่อใช้เครือข่ายบริดจ์ของ Docker (`-p 18789:18789`) การรับส่งข้อมูลจะเข้ามาทาง `eth0` ทำให้ไม่สามารถเข้าถึง Gateway ได้ ให้ใช้ `--network host` หรือตั้งค่า `bind: "lan"` (หรือ `bind: "custom"` ร่วมกับ `customBindHost: "0.0.0.0"`) เพื่อรับฟังบนอินเทอร์เฟซทั้งหมด
- **การตรวจสอบสิทธิ์**: จำเป็นโดยค่าเริ่มต้น การผูกที่ไม่ใช่ลูปแบ็กต้องใช้การตรวจสอบสิทธิ์ของ Gateway ในทางปฏิบัติหมายถึงโทเค็น/รหัสผ่านที่ใช้ร่วมกัน หรือพร็อกซีย้อนกลับที่รับรู้ข้อมูลประจำตัวร่วมกับ `gateway.auth.mode: "trusted-proxy"` ตัวช่วยสร้างการเริ่มต้นใช้งานจะสร้างโทเค็นให้โดยค่าเริ่มต้น
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) ให้ตั้งค่า `gateway.auth.mode` เป็น `token` หรือ `password` อย่างชัดเจน ขั้นตอนการเริ่มทำงานและการติดตั้ง/ซ่อมแซมบริการจะล้มเหลวเมื่อกำหนดค่าทั้งสองรายการแต่ไม่ได้ตั้งค่าโหมด
- `gateway.auth.mode: "none"`: โหมดไม่ใช้การตรวจสอบสิทธิ์แบบชัดเจน ใช้เฉพาะการตั้งค่าลูปแบ็กภายในที่เชื่อถือได้เท่านั้น โดยเจตนาแล้วจะไม่มีตัวเลือกนี้ในพรอมต์การเริ่มต้นใช้งาน
- `gateway.auth.mode: "trusted-proxy"`: มอบหมายการตรวจสอบสิทธิ์ของเบราว์เซอร์/ผู้ใช้ให้พร็อกซีย้อนกลับที่รับรู้ข้อมูลประจำตัว และเชื่อถือส่วนหัวข้อมูลประจำตัวจาก `gateway.trustedProxies` (ดู [การตรวจสอบสิทธิ์ผ่านพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth)) โดยค่าเริ่มต้น โหมดนี้คาดหวังแหล่งที่มาของพร็อกซีที่ **ไม่ใช่ลูปแบ็ก** พร็อกซีย้อนกลับแบบลูปแบ็กบนโฮสต์เดียวกันต้องใช้ `gateway.auth.trustedProxy.allowLoopback = true` อย่างชัดเจน ผู้เรียกภายในบนโฮสต์เดียวกันสามารถใช้ `gateway.auth.password` เป็นทางเลือกสำรองสำหรับการเชื่อมต่อภายในโดยตรงได้ ส่วน `gateway.auth.token` ยังคงไม่สามารถใช้ร่วมกับโหมดพร็อกซีที่เชื่อถือได้
- `gateway.auth.allowTailscale`: เมื่อ `true` ส่วนหัวข้อมูลประจำตัวของ Tailscale Serve สามารถใช้ผ่านการตรวจสอบสิทธิ์ของ Control UI/WebSocket ได้ (ตรวจสอบผ่าน `tailscale whois`) จุดเชื่อมต่อ HTTP API **ไม่** ใช้การตรวจสอบสิทธิ์ด้วยส่วนหัว Tailscale นี้ แต่จะใช้โหมดการตรวจสอบสิทธิ์ HTTP ตามปกติของ Gateway แทน ขั้นตอนที่ไม่ใช้โทเค็นนี้ถือว่าโฮสต์ Gateway เชื่อถือได้ ค่าเริ่มต้นคือ `true` เมื่อ `tailscale.mode = "serve"`
- `gateway.auth.rateLimit`: ตัวจำกัดความพยายามตรวจสอบสิทธิ์ที่ล้มเหลวซึ่งเลือกใช้ได้ มีผลแยกตาม IP ของไคลเอนต์และขอบเขตการตรวจสอบสิทธิ์ (ติดตามความลับที่ใช้ร่วมกันและโทเค็นอุปกรณ์แยกจากกัน) ความพยายามที่ถูกบล็อกจะส่งคืน `429` + `Retry-After`
  - บนเส้นทาง Control UI แบบอะซิงโครนัสของ Tailscale Serve ความพยายามที่ล้มเหลวสำหรับ `{scope, clientIp}` เดียวกันจะถูกจัดลำดับก่อนเขียนข้อมูลความล้มเหลว ดังนั้นความพยายามที่ไม่ถูกต้องพร้อมกันจากไคลเอนต์เดียวกันอาจทำให้คำขอที่สองเรียกใช้ตัวจำกัด แทนที่ทั้งสองคำขอจะแข่งขันผ่านไปโดยเป็นเพียงการไม่ตรงกัน
  - `gateway.auth.rateLimit.exemptLoopback` มีค่าเริ่มต้นเป็น `true`; ตั้งค่า `false` เมื่อต้องการจำกัดอัตราการรับส่งข้อมูลของ localhost ด้วยโดยเจตนา (สำหรับการตั้งค่าการทดสอบหรือการใช้งานพร็อกซีที่เข้มงวด)
- ความพยายามตรวจสอบสิทธิ์ WS ที่มีต้นทางจากเบราว์เซอร์จะถูกจำกัดอัตราเสมอโดยปิดการยกเว้นลูปแบ็ก (เป็นการป้องกันหลายชั้นจากการโจมตีแบบลองรหัสผ่าน localhost ผ่านเบราว์เซอร์)
- บนลูปแบ็ก การล็อกดังกล่าวที่มีต้นทางจากเบราว์เซอร์จะแยกตามค่า `Origin`
  ที่ปรับให้อยู่ในรูปแบบมาตรฐานแล้ว ดังนั้นความล้มเหลวซ้ำจากต้นทาง localhost หนึ่งจะไม่
  ล็อกต้นทางอื่นโดยอัตโนมัติ
- `tailscale.mode`: `serve` (เฉพาะ tailnet, ผูกแบบลูปแบ็ก) หรือ `funnel` (สาธารณะ, ต้องใช้การตรวจสอบสิทธิ์)
- `tailscale.serviceName`: ชื่อบริการ Tailscale ที่เลือกกำหนดได้สำหรับโหมด Serve เช่น
  `svc:openclaw` เมื่อตั้งค่าแล้ว OpenClaw จะส่งค่านี้ให้ `tailscale serve
--service` เพื่อให้เปิด Control UI ผ่าน Service ที่มีชื่อได้
  แทนชื่อโฮสต์ของอุปกรณ์ ค่าต้องใช้รูปแบบชื่อ Service
  `svc:<dns-label>` ของ Tailscale และเมื่อเริ่มทำงาน ระบบจะรายงาน URL ของ Service ที่ได้
- `tailscale.preserveFunnel`: เมื่อ `true` และ `tailscale.mode = "serve"` OpenClaw
  จะตรวจสอบ `tailscale funnel status` ก่อนใช้ Serve ซ้ำเมื่อเริ่มทำงาน และจะข้าม
  หากเส้นทาง Funnel ที่กำหนดค่าจากภายนอกครอบคลุมพอร์ตของ Gateway อยู่แล้ว
  ค่าเริ่มต้นคือ `false`
- `controlUi.allowedOrigins`: รายการอนุญาตต้นทางเบราว์เซอร์แบบชัดเจนสำหรับการเชื่อมต่อ WebSocket ของ Gateway จำเป็นสำหรับต้นทางเบราว์เซอร์สาธารณะที่ไม่ใช่ลูปแบ็ก การโหลด UI ส่วนตัวจากต้นทางเดียวกันบน LAN/Tailnet ผ่านลูปแบ็ก, RFC1918/link-local, `.local`, `.ts.net` หรือโฮสต์ CGNAT ของ Tailscale จะได้รับการยอมรับโดยไม่ต้องเปิดใช้ทางเลือกสำรองด้วยส่วนหัว Host
- `controlUi.toolTitles`: เลือกใช้ชื่อวัตถุประสงค์ที่ AI สร้างขึ้นสำหรับการเรียกใช้เครื่องมือในแชต Control UI ค่าเริ่มต้น: `false` (การแสดงผลเครื่องมือยังคงกำหนดผลได้อย่างสมบูรณ์โดยไม่มีการเรียกโมเดลเบื้องหลัง) เมื่อเปิดใช้ เมธอด `chat.toolTitles` จะติดป้ายกำกับการเรียกที่ซับซ้อนผ่านการกำหนดเส้นทางโมเดลอรรถประโยชน์มาตรฐาน ได้แก่ `utilityModel` ของเอเจนต์ (การตัดสินใจของผู้ดำเนินการซึ่งอาจส่งอาร์กิวเมนต์เครื่องมือในขอบเขตจำกัดไปยังผู้ให้บริการที่เลือก เช่นเดียวกับงานอรรถประโยชน์ทุกงาน) หรือค่าเริ่มต้นของโมเดลขนาดเล็กที่ผู้ให้บริการของเซสชันประกาศไว้ (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`) และแคชผลลัพธ์ไว้ในฐานข้อมูลสถานะต่อเอเจนต์ เพื่อไม่ให้การดูซ้ำถูกเรียกเก็บเงินอีก `utilityModel: \"\"` จะปิดใช้ชื่อเช่นเดียวกับงานอรรถประโยชน์อื่นๆ ทั้งหมด และชื่อจะไม่เปลี่ยนไปใช้โมเดลหลักเป็นทางเลือกสำรอง
- `controlUi.chatMessageMaxWidth`: ความกว้างสูงสุดที่เลือกกำหนดได้สำหรับทรานสคริปต์แชต Control UI ที่จัดกึ่งกลาง รองรับค่าความกว้าง CSS ที่มีข้อจำกัด เช่น `960px`, `82%`, `min(1280px, 82%)` และ `calc(100% - 2rem)`
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: โหมดอันตรายที่เปิดใช้ทางเลือกสำรองด้านต้นทางด้วยส่วนหัว Host สำหรับการใช้งานที่ตั้งใจพึ่งพานโยบายต้นทางจากส่วนหัว Host
- `terminal.enabled`: เลือกใช้เทอร์มินัลของผู้ดำเนินการที่มีขอบเขตผู้ดูแลระบบ ค่าเริ่มต้น: `false` เทอร์มินัลจะเริ่ม PTY ของโฮสต์ในพื้นที่ทำงานของเอเจนต์ที่เลือก รับค่าสภาพแวดล้อมของกระบวนการ Gateway และจะถูกปฏิเสธสำหรับเอเจนต์ที่มี `sandbox.mode: "all"` เปิดใช้เฉพาะในการใช้งานโดยผู้ดำเนินการที่เชื่อถือได้เท่านั้น การเปลี่ยนค่านี้จะเริ่ม Gateway ใหม่และอัปเดตนโยบายความปลอดภัยของเนื้อหาใน Control UI
- `terminal.shell`: โปรแกรมเชลล์ที่เลือกกำหนดได้ เมื่อไม่ได้ตั้งค่า OpenClaw จะใช้ `$SHELL` บน Unix และ `%ComSpec%` บน Windows
- `terminal.detachedSessionTimeoutSeconds`: ระยะเวลาที่เซสชันเทอร์มินัลจะยังคงทำงานหลังจากการเชื่อมต่อขาดหาย (โหลดหน้าใหม่, แล็ปท็อปเข้าสู่โหมดสลีป) โดยยังสามารถเชื่อมต่อกลับผ่าน `terminal.attach` และเล่นเอาต์พุตล่าสุดซ้ำได้ ค่าเริ่มต้น: `300` ตั้งค่า `0` เพื่อยุติเซสชันทันทีที่การเชื่อมต่อขาดหาย เซสชันที่ยกเลิกการเชื่อมต่อจะยังคงเรียกใช้คำสั่งต่อไป ดังนั้นควรลดระยะเวลานี้บนโฮสต์ที่ใช้ร่วมกันหรือเปิดรับจากภายนอก
- `remote.transport`: `ssh` (ค่าเริ่มต้น) หรือ `direct` (ws/wss) สำหรับ `direct` นั้น `remote.url` ต้องเป็น `wss://` สำหรับโฮสต์สาธารณะ ส่วน `ws://` แบบข้อความธรรมดาจะได้รับการยอมรับเฉพาะสำหรับลูปแบ็ก, LAN, link-local, `.local`, `.ts.net` และโฮสต์ CGNAT ของ Tailscale
- `remote.remotePort`: พอร์ต Gateway บนโฮสต์ SSH ระยะไกล ค่าเริ่มต้นคือ `18789`; ใช้ค่านี้เมื่อพอร์ตทันเนลภายในแตกต่างจากพอร์ต Gateway ระยะไกล
- `remote.sshHostKeyPolicy`: นโยบายคีย์โฮสต์ของทันเนล SSH บน macOS `strict` เป็นค่าเริ่มต้นและต้องใช้คีย์ที่เชื่อถืออยู่แล้ว `openssh` เป็นการเลือกใช้การกำหนดค่า OpenSSH ที่มีผลจริงสำหรับนามแฝงที่มีการจัดการอย่างชัดเจน โปรดตรวจสอบการตั้งค่า SSH ของผู้ใช้และระบบที่ตรงกันก่อนใช้งาน แอป macOS และ `configure-remote` จะรีเซ็ตนโยบายนี้เป็น `strict` เมื่อเปลี่ยนเป้าหมาย เว้นแต่จะเลือกใช้อีกครั้งอย่างชัดเจน
- `gateway.remote.token` / `.password` เป็นฟิลด์ข้อมูลประจำตัวของไคลเอนต์ระยะไกล ฟิลด์เหล่านี้ไม่ได้กำหนดค่าการตรวจสอบสิทธิ์ของ Gateway ด้วยตัวเอง
- `gateway.push.apns.relay.baseUrl`: URL ฐานแบบ HTTPS สำหรับรีเลย์ APNs ภายนอกที่ใช้หลังจากบิลด์ iOS ที่รองรับรีเลย์เผยแพร่การลงทะเบียนไปยัง Gateway บิลด์ App Store สาธารณะใช้รีเลย์ที่ OpenClaw ให้บริการ URL รีเลย์แบบกำหนดเองต้องตรงกับเส้นทางบิลด์/การใช้งาน iOS ที่แยกต่างหากโดยเจตนา ซึ่ง URL รีเลย์ชี้ไปยังรีเลย์นั้น
- `gateway.push.apns.relay.timeoutMs`: ระยะหมดเวลาการส่งจาก Gateway ไปยังรีเลย์ หน่วยเป็นมิลลิวินาที ค่าเริ่มต้นคือ `10000`
- การลงทะเบียนที่รองรับรีเลย์จะถูกมอบหมายให้ข้อมูลประจำตัวของ Gateway รายการหนึ่งโดยเฉพาะ แอป iOS ที่จับคู่จะดึง `gateway.identity.get` รวมข้อมูลประจำตัวนั้นไว้ในการลงทะเบียนรีเลย์ และส่งต่อสิทธิ์การส่งที่มีขอบเขตเฉพาะการลงทะเบียนให้ Gateway Gateway อื่นไม่สามารถนำการลงทะเบียนที่จัดเก็บไว้นั้นมาใช้ซ้ำได้
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: ค่าทดแทนผ่านตัวแปรสภาพแวดล้อมชั่วคราวสำหรับการกำหนดค่ารีเลย์ข้างต้น
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: ช่องทางหลีกเลี่ยงสำหรับ URL รีเลย์ HTTP แบบลูปแบ็กที่ใช้ในการพัฒนาเท่านั้น URL รีเลย์สำหรับการใช้งานจริงควรใช้ HTTPS ต่อไป
- `OPENCLAW_HANDSHAKE_TIMEOUT_MS`: ค่าทดแทนผ่านตัวแปรสภาพแวดล้อมที่เลือกกำหนดได้สำหรับระยะหมดเวลาการแฮนด์เชก WebSocket ของ Gateway ก่อนการตรวจสอบสิทธิ์ในตัว
- `channels.<provider>.healthMonitor.enabled`: การยกเลิกใช้การเริ่มทำงานใหม่โดยตัวตรวจสอบสถานภาพแยกตามช่องทาง โดยยังคงเปิดใช้ตัวตรวจสอบส่วนกลาง
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: ค่าทดแทนแยกตามบัญชีสำหรับช่องทางหลายบัญชี เมื่อตั้งค่าแล้ว ค่านี้จะมีลำดับความสำคัญเหนือค่าทดแทนระดับช่องทาง
- เส้นทางการเรียก Gateway ภายในสามารถใช้ `gateway.remote.*` เป็นทางเลือกสำรองได้เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*`
- หากกำหนดค่า `gateway.auth.token` / `gateway.auth.password` อย่างชัดเจนผ่าน SecretRef และไม่สามารถแปลงค่าได้ การแปลงค่าจะล้มเหลวแบบปิดกั้น (ไม่มีทางเลือกสำรองระยะไกลมาปกปิด)
- `trustedProxies`: IP ของพร็อกซีย้อนกลับที่ยุติ TLS หรือแทรกส่วนหัวไคลเอนต์ที่ส่งต่อ ระบุเฉพาะพร็อกซีที่ควบคุมเท่านั้น รายการลูปแบ็กยังคงใช้ได้สำหรับการตั้งค่าพร็อกซี/การตรวจจับภายในบนโฮสต์เดียวกัน (เช่น Tailscale Serve หรือพร็อกซีย้อนกลับภายใน) แต่รายการเหล่านี้ **ไม่** ทำให้คำขอลูปแบ็กมีสิทธิ์ใช้ `gateway.auth.mode: "trusted-proxy"`
- `allowRealIpFallback`: เมื่อ `true` Gateway จะยอมรับ `X-Real-IP` หากไม่มี `X-Forwarded-For` ค่าเริ่มต้นคือ `false` เพื่อให้ทำงานแบบปิดกั้นเมื่อเกิดความล้มเหลว
- `gateway.nodes.pairing.autoApproveCidrs`: รายการอนุญาต CIDR/IP ที่เลือกกำหนดได้สำหรับการอนุมัติการจับคู่อุปกรณ์ Node ครั้งแรกโดยอัตโนมัติเมื่อไม่มีการร้องขอขอบเขต จะปิดใช้งานเมื่อไม่ได้ตั้งค่า การตั้งค่านี้จะไม่อนุมัติการจับคู่ของผู้ดำเนินการ/เบราว์เซอร์/Control UI/WebChat โดยอัตโนมัติ และจะไม่อนุมัติการอัปเกรดบทบาท ขอบเขต ข้อมูลเมตา หรือคีย์สาธารณะโดยอัตโนมัติ
- `gateway.nodes.pairing.sshVerify`: การอนุมัติอัตโนมัติที่ตรวจสอบผ่าน SSH สำหรับการจับคู่อุปกรณ์ Node ครั้งแรก (ค่าเริ่มต้น: เปิดใช้) Gateway จะเชื่อมต่อ SSH กลับไปยังโฮสต์ที่จับคู่ (BatchMode, คีย์โฮสต์แบบเข้มงวด) และอนุมัติเฉพาะเมื่อคีย์อุปกรณ์ `openclaw node identity` ตรงกันทุกประการ เกณฑ์สิทธิ์ขั้นต่ำเหมือนกับ `autoApproveCidrs`; การตรวจสอบจำกัดเฉพาะที่อยู่ต้นทางส่วนตัว/CGNAT เว้นแต่ `cidrs` จะเขียนทับ ตั้งค่า `false` เพื่อปิดใช้ หรือ `{ user, identity, timeoutMs, cidrs }` เพื่อปรับแต่ง ดู [การจับคู่ Node](/th/gateway/pairing#ssh-verified-device-auto-approval-default)
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: การกำหนด allow/deny ส่วนกลางสำหรับคำสั่ง Node ที่ประกาศไว้ หลังจากประเมินการจับคู่และรายการอนุญาตของแพลตฟอร์มแล้ว ใช้ `allowCommands` เพื่อเลือกเปิดใช้คำสั่ง Node ที่เป็นอันตราย เช่น `camera.snap`, `camera.clip`, `screen.record`, `health.summary`, `sms.search` และ `sms.send`; `denyCommands` จะนำคำสั่งออก แม้ว่าค่าเริ่มต้นของแพลตฟอร์มหรือการอนุญาตอย่างชัดแจ้งจะรวมคำสั่งนั้นไว้ก็ตาม สิทธิ์ Health ของ iOS, สิทธิ์ SMS ของ Android และการให้สิทธิ์คำสั่งของ Gateway เป็นอิสระจากกัน หลังจาก Node เปลี่ยนรายการคำสั่งที่ประกาศไว้ ให้ปฏิเสธและอนุมัติการจับคู่ของอุปกรณ์นั้นใหม่ เพื่อให้ Gateway จัดเก็บสแนปช็อตคำสั่งที่อัปเดตแล้ว
- `gateway.tools.deny`: ชื่อเครื่องมือเพิ่มเติมที่ถูกบล็อกสำหรับ HTTP `POST /tools/invoke` (ขยายรายการปฏิเสธเริ่มต้น)
- `gateway.tools.allow`: นำชื่อเครื่องมือออกจากรายการปฏิเสธ HTTP เริ่มต้นสำหรับ
  ผู้เรียกที่เป็นเจ้าของ/ผู้ดูแลระบบ การดำเนินการนี้ไม่ได้ยกระดับผู้เรียก `operator.write`
  ที่มีข้อมูลระบุตัวตนให้เข้าถึงในฐานะเจ้าของ/ผู้ดูแลระบบได้; `cron`, `gateway` และ `nodes` ยังคง
  ไม่พร้อมใช้งานสำหรับผู้เรียกที่ไม่ใช่เจ้าของ แม้จะอยู่ในรายการอนุญาตก็ตาม

</Accordion>

### ปลายทางที่เข้ากันได้กับ OpenAI

- Admin HTTP RPC: ปิดไว้โดยค่าเริ่มต้นในฐานะ Plugin `admin-http-rpc` เปิดใช้งาน Plugin เพื่อลงทะเบียน `POST /api/v1/admin/rpc` ดู [Admin HTTP RPC](/th/plugins/admin-http-rpc)
- Chat Completions: ปิดใช้งานไว้โดยค่าเริ่มต้น เปิดใช้งานด้วย `gateway.http.endpoints.chatCompletions.enabled: true`
- Responses API: `gateway.http.endpoints.responses.enabled`
- การเพิ่มความแข็งแกร่งให้ข้อมูลป้อนเข้าแบบ URL ของ Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    รายการอนุญาตที่ว่างจะถือว่าไม่ได้ตั้งค่าไว้ ให้ใช้ `gateway.http.endpoints.responses.files.allowUrl=false`
    และ/หรือ `gateway.http.endpoints.responses.images.allowUrl=false` เพื่อปิดใช้งานการดึงข้อมูลจาก URL
- เฮดเดอร์เสริมสำหรับเพิ่มความแข็งแกร่งให้การตอบกลับ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ตั้งค่าเฉพาะสำหรับต้นทาง HTTPS ที่คุณควบคุม โปรดดู [การยืนยันตัวตนผ่านพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### การแยกหลายอินสแตนซ์

เรียกใช้ Gateway หลายตัวบนโฮสต์เดียวโดยใช้พอร์ตและไดเรกทอรีสถานะที่ไม่ซ้ำกัน:

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

- `enabled`: เปิดใช้งานการยุติ TLS ที่ตัวรับฟังของ Gateway (HTTPS/WSS) (ค่าเริ่มต้น: `false`)
- `autoGenerate`: สร้างคู่ใบรับรอง/คีย์แบบลงนามด้วยตนเองภายในเครื่องโดยอัตโนมัติเมื่อไม่ได้กำหนดไฟล์ไว้อย่างชัดเจน ใช้สำหรับภายในเครื่อง/การพัฒนาเท่านั้น
- `certPath`: พาธระบบไฟล์ไปยังไฟล์ใบรับรอง TLS
- `keyPath`: พาธระบบไฟล์ไปยังไฟล์คีย์ส่วนตัว TLS ให้จำกัดสิทธิ์การเข้าถึง
- `caPath`: พาธชุดรวม CA ที่เป็นทางเลือกสำหรับการตรวจสอบไคลเอนต์หรือสายโซ่ความเชื่อถือแบบกำหนดเอง

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

- `mode`: ควบคุมวิธีนำการแก้ไขการกำหนดค่าไปใช้ขณะรันไทม์
  - `"off"`: ละเว้นการแก้ไขแบบสด การเปลี่ยนแปลงต้องมีการรีสตาร์ตอย่างชัดเจน
  - `"restart"`: รีสตาร์ตกระบวนการ Gateway ทุกครั้งเมื่อการกำหนดค่าเปลี่ยนแปลง
  - `"hot"`: นำการเปลี่ยนแปลงไปใช้ภายในกระบวนการโดยไม่รีสตาร์ต
  - `"hybrid"` (ค่าเริ่มต้น): ลองโหลดใหม่แบบร้อนก่อน แล้วถอยกลับไปรีสตาร์ตหากจำเป็น
- `debounceMs`: ช่วงเวลาดีบาวซ์เป็น ms ก่อนนำการเปลี่ยนแปลงการกำหนดค่าไปใช้ (จำนวนเต็มไม่ติดลบ ค่าเริ่มต้น: `300`)
- `deferralTimeoutMs`: เวลาสูงสุดที่เป็นทางเลือกในหน่วย ms สำหรับรอการดำเนินการที่กำลังทำงานอยู่ก่อนบังคับรีสตาร์ตหรือโหลดช่องทางใหม่แบบร้อน ละเว้นค่านี้เพื่อใช้ระยะเวลารอแบบมีขอบเขตตามค่าเริ่มต้น (`300000`) ตั้งค่า `0` เพื่อรอโดยไม่มีกำหนดและบันทึกคำเตือนว่ายังคงรอดำเนินการอยู่เป็นระยะ

---

## สภาพแวดล้อมเวิร์กเกอร์บนคลาวด์

เวิร์กเกอร์บนคลาวด์เป็นคุณสมบัติแบบเลือกใช้ หากไม่มี `cloudWorkers` หรือ `profiles` ว่างเปล่า OpenClaw จะไม่ยอมรับการสร้างเวิร์กเกอร์ใหม่ ระเบียนถาวรที่สร้างไว้ก่อนหน้านี้ยังคงปรับให้สอดคล้องและมองเห็นได้ ส่วนการฉายภาพ gateway/node ที่มีอยู่จะไม่เปลี่ยนแปลง

ผู้ให้บริการเวิร์กเกอร์ทุกรายต้องส่งคืน `hostKey` ของ SSH จากผลลัพธ์การจัดเตรียมที่เชื่อถือได้ในรูปแบบ `algorithm base64` อย่างแม่นยำ โดยไม่มีชื่อโฮสต์หรือความคิดเห็น Bootstrap จะเขียนคีย์นั้นลงในไฟล์ `known_hosts` ที่แยกต่างหาก ใช้ `StrictHostKeyChecking=yes` และล้มเหลวก่อนเปิดการเชื่อมต่อเมื่อผู้ให้บริการไม่ได้ส่งคีย์มา ไม่มีการถอยกลับไปใช้การเชื่อถือในการใช้งานครั้งแรก

การตั้งค่าทันเนลเกิดขึ้นตามความต้องการแทนที่จะเป็นส่วนหนึ่งของการจัดเตรียม เมื่อเริ่มต้น Gateway จะทำ reverse-forward ซ็อกเก็ต Unix ภายในเวิร์กเกอร์ไปยังปลายทาง WebSocket แบบลูปแบ็ก ซ็อกเก็ตจะอยู่ในไดเรกทอรีระยะไกลที่จัดสรรแบบสุ่มและเข้าถึงได้เฉพาะเจ้าของ ต่างจากพอร์ต TCP แบบลูปแบ็ก ซ็อกเก็ตนี้ไม่สามารถเข้าถึงได้โดยบัญชีอื่นบนเวิร์กเกอร์ที่มีผู้ใช้หลายราย และไม่สามารถชนกับพอร์ตของสภาพแวดล้อมอื่นได้ การส่ง keepalive ของ SSH และการหน่วงเวลาถอยกลับเพื่อเชื่อมต่อใหม่แบบมีเพดานจะทำงานเฉพาะขณะที่เจ้าของทันเนลยังคงเป็นเจ้าของปัจจุบัน การหยุดทันเนลจะกั้นการเชื่อมต่อใหม่ก่อนปิดกระบวนการ SSH

ทราฟฟิกควบคุมและการถ่ายโอนเวิร์กสเปซใช้การเชื่อมต่อ SSH แยกกัน ทั้งสองใช้ข้อมูลประจำตัวที่แก้ไขแล้วชุดเดียวกันและไฟล์ `known_hosts` ที่ปักหมุดและแยกต่างหาก แต่การถ่ายโอนเวิร์กสเปซจะไม่ใช้การมัลติเพล็กซ์การเชื่อมต่อ SSH ร่วมกับทันเนลที่ทำงานระยะยาว ดังนั้น rsync จึงไม่สามารถบล็อกทราฟฟิกควบคุมได้

### โปรไฟล์ Crabbox

ผู้ให้บริการ `crabbox` ที่รวมมาให้จะจัดเตรียมสัญญาเช่าที่รองรับ SSH ผ่าน CLI ของ Crabbox ภายในเครื่อง `settings.provider` ภายในจะเลือกแบ็กเอนด์ Crabbox ซึ่งแยกจากรหัสผู้ให้บริการ OpenClaw ภายนอก

```json5
{
  cloudWorkers: {
    profiles: {
      production: {
        provider: "crabbox",
        install: "bundle", // ค่าเริ่มต้น ใช้ "npm" สำหรับ Gateway เวอร์ชันที่เผยแพร่แล้วเท่านั้น
        settings: {
          provider: "aws",
          class: "standard",
          ttl: "24h",
          idleTimeout: "60m",
          // พาธสัมบูรณ์ที่เป็นทางเลือก ค่าเริ่มต้น: sibling ../crabbox/bin/crabbox จากนั้น PATH
          binary: "/usr/local/bin/crabbox",
        },
        lifetime: {
          idleTimeoutMinutes: 60,
          maxLifetimeMinutes: 1440,
        },
      },
    },
  },
}
```

- `settings.provider` (จำเป็น): แบ็กเอนด์ Crabbox ที่ส่งผ่าน `--provider` ให้ใช้แบ็กเอนด์ที่ผลลัพธ์การตรวจสอบมีปลายทาง SSH โดย `aws` จะเลือกแบ็กเอนด์ AWS โดยตรง
- `settings.class` (จำเป็น): คลาสเครื่อง Crabbox ที่ส่งไปยัง `--class`
- `settings.ttl` และ `settings.idleTimeout` (จำเป็น): สตริงระยะเวลา Go ที่เป็นค่าบวกซึ่งส่งไปยัง `--ttl` และ `--idle-timeout` กลไกป้องกันความเสียหายฝั่งผู้ให้บริการเหล่านี้แยกจากนโยบาย `lifetime` ที่ OpenClaw จัดเก็บไว้ด้านล่าง
- `settings.binary`: พาธสัมบูรณ์ไปยังไฟล์ปฏิบัติการ Crabbox ที่เป็นทางเลือก หากไม่มีค่านี้ OpenClaw จะตรวจสอบเช็กเอาต์ Crabbox ที่อยู่ข้างกัน จากนั้นตรวจสอบรายการไฟล์ปฏิบัติการใน `PATH` และสุดท้ายเรียกใช้ `crabbox` เพื่อให้ CLI ที่ขาดหายยังคงเป็นข้อผิดพลาดของผู้ให้บริการที่มองเห็นได้

การตั้งค่าที่ไม่รู้จักจะถูกปฏิเสธ ข้อมูลรับรอง Crabbox และการกำหนดค่าบัญชีเฉพาะแบ็กเอนด์ยังคงอยู่ภายใต้การดูแลของ Crabbox อย่าใส่ไว้ใน `settings` OpenClaw เรียกใช้เฉพาะ CLI ภายในเครื่องและไม่เรียกเครือข่ายของผู้ให้บริการจาก Plugin นี้ การจัดเตรียมจะส่ง `--keep=true` เสมอ OpenClaw เป็นเจ้าของวงจรชีวิตภายนอกและทำลายสัญญาเช่าด้วย `crabbox stop`

<Note>
  OpenClaw แก้ไขพาธ `sshKey` ภายในสัญญาเช่าของ Crabbox ผ่านตัวแก้ไขข้อมูลลับที่ผู้ให้บริการเป็นเจ้าของ และปักหมุด `sshHostKey` ที่เชื่อถือได้ซึ่งส่งคืนโดย `crabbox inspect --json` การรับเข้า AWS ยังต้องใช้ `providerMetadata.instanceProfileAttached` ติดตั้ง Crabbox 0.38.1 หรือใหม่กว่าสำหรับสัญญาการตรวจสอบแบบปิดนี้
</Note>

### โปรไฟล์การพัฒนา SSH แบบคงที่

```json5
{
  cloudWorkers: {
    profiles: {
      development: {
        provider: "static-ssh",
        settings: {
          host: "worker.example.test",
          port: 22,
          user: "openclaw",
          hostKey: "ssh-ed25519 <base64-public-host-key>",
          keyRef: {
            source: "env",
            provider: "default",
            id: "OPENCLAW_WORKER_SSH_KEY",
          },
        },
        lifetime: {
          idleTimeoutMinutes: 60,
          maxLifetimeMinutes: 1440,
        },
      },
    },
  },
}
```

- `profiles`: โปรไฟล์เวิร์กเกอร์ที่มีชื่อพร้อมรหัสที่ไม่ว่างและตัดช่องว่างแล้ว แต่ละโปรไฟล์เลือกผู้ให้บริการที่ลงทะเบียนโดย Plugin
- `provider`: รหัสผู้ให้บริการเวิร์กเกอร์ที่ไม่ว่าง ตัวอย่างใช้ผู้ให้บริการ `crabbox` ที่รวมมาให้และผู้ให้บริการ `static-ssh` ของ QA Lab
- `install`: วิธีติดตั้งเวิร์กเกอร์ `"bundle"` (ค่าเริ่มต้น) จะถ่ายโอนบันเดิลที่แฮชตามเนื้อหาของบิลด์ที่ติดตั้งใน Gateway และรองรับเวอร์ชันที่เผยแพร่แล้ว เวอร์ชันพัฒนา และเวอร์ชันที่ยังไม่เผยแพร่ `"npm"` เป็นการเพิ่มประสิทธิภาพแบบเลือกใช้สำหรับรุ่นแพ็กเกจที่ไม่มีการแก้ไข โดยจะติดตั้ง `openclaw@<exact gateway version>` จากรีจิสทรี npm สาธารณะและไม่ติดตั้ง `latest`
- Plugin ผู้ให้บริการที่รวมมาให้จะถูกเลือกโดยอัตโนมัติเมื่อกำหนดค่า แต่การปิดใช้งานอย่างชัดเจนและ `plugins.allow` ยังคงมีผล เมื่อกำหนดค่ารายการอนุญาต ให้รวมรหัสผู้ให้บริการ (เช่น `crabbox`) Plugin ผู้ให้บริการภายนอกต้องได้รับการติดตั้งและเปิดใช้งานอย่างชัดเจนด้วย
- `settings`: JSON แบบมีขอบเขตที่ผู้ให้บริการเป็นเจ้าของ Plugin ที่เลือกจะกำหนดและตรวจสอบคีย์ของตน ให้ใช้ [ออบเจ็กต์ SecretRef](/th/gateway/secrets) สำหรับค่าที่มีข้อมูลลับ ผู้ให้บริการ SSH แบบคงที่ต้องใช้ `host`, `user`, `hostKey` และ `keyRef` โดย `port` มีค่าเริ่มต้นเป็น `22` `hostKey` ต้องเป็นบรรทัดคีย์โฮสต์สาธารณะ OpenSSH หนึ่งบรรทัด (`algorithm base64`) ที่ได้รับจากโฮสต์ที่รู้จักหรือช่องทางที่เชื่อถือได้อื่น โดยไม่มีคำนำหน้าตัวเลือก
- `lifetime.idleTimeoutMinutes`: จำนวนนาทีที่เป็นจำนวนเต็มบวกซึ่งจัดเก็บไว้สำหรับนโยบายเรียกคืนเมื่อไม่ได้ใช้งานในภายหลัง
- `lifetime.maxLifetimeMinutes`: จำนวนนาทีที่เป็นจำนวนเต็มบวกซึ่งจัดเก็บไว้สำหรับนโยบายวงจรชีวิตในภายหลัง

ต้องติดตั้งรันไทม์ Node ที่รองรับ (22.22.3+, 24.15+ หรือ 25.9+) พร้อม SQLite ที่รีเซ็ต WAL ได้อย่างปลอดภัยบนเวิร์กเกอร์ไว้แล้ว วิธี `"npm"` แบบเลือกใช้ยังต้องใช้ `npm` และการเข้าถึง HTTPS ขาออกไปยังรีจิสทรี npm สาธารณะ การตั้งค่าชุดเครื่องมือผ่านเครือข่ายเป็นนโยบายของผู้ให้บริการ Bootstrap จะรายงานข้อผิดพลาดที่นำไปแก้ไขได้แทนการติดตั้งชุดเครื่องมือด้วยตัวเอง

รากฐานนี้ติดตั้งและตรวจสอบบิลด์ของ Gateway พร้อมจัดเตรียมวงจรชีวิตการเริ่ม/หยุดทันเนล แต่จะไม่เปิดใช้ CLI ทั่วไปของ OpenClaw จุดเข้าใช้งานเวิร์กเกอร์แบบครบในตัวและลูปจะมาในหมุดหมายเวิร์กเกอร์บนคลาวด์ถัดไป

ระเบียนสภาพแวดล้อมถาวรแต่ละรายการจะเก็บการตั้งค่าผู้ให้บริการที่ผ่านการตรวจสอบ วิธีติดตั้งที่แก้ไขแล้ว และนโยบายอายุการใช้งานไว้ในสแนปช็อตโปรไฟล์ ณ เวลาสร้าง การเปลี่ยนหรือลบโปรไฟล์ที่มีชื่อจะมีผลต่อการสร้างใหม่ ส่วนระเบียนที่มีอยู่จะดำเนินการปรับวงจรชีวิตให้สอดคล้องต่อไปโดยใช้สแนปช็อตนั้น ตราบใดที่ Plugin เจ้าของยังพร้อมใช้งาน

ค่าอายุการใช้งานเป็นเพียงข้อมูลในรุ่นเวิร์กเกอร์บนคลาวด์รุ่นแรก การบังคับใช้อัตโนมัติจะมาในงานวงจรชีวิตภายหลัง การเปลี่ยนแปลงโปรไฟล์ต้องรีสตาร์ต Gateway

<Warning>
  ผู้ให้บริการ `static-ssh` เป็นชุดทดสอบการพัฒนา QA Lab จากซอร์สทรีและไม่รวมอยู่ในการเผยแพร่แบบแพ็กเกจ เวิร์กเกอร์ที่ทำงานบนโฮสต์ที่ใช้ร่วมกันสามารถอ่านข้อมูลอื่นที่ไม่เกี่ยวข้องบนโฮสต์ได้ ดังนั้นอย่าใช้ผู้ให้บริการนี้เป็นขอบเขตการแยกสำหรับการใช้งานจริง
  ผู้ดำเนินการต้องระบุ `hostKey` ที่คาดไว้ OpenClaw จะไม่เรียนรู้หรือยอมรับคีย์จากการเชื่อมต่อครั้งแรก
  การทำลายสัญญาเช่าจะปล่อยเฉพาะระเบียนเชิงตรรกะของ OpenClaw เท่านั้น โดยจะไม่หยุดหรือทำความสะอาดโฮสต์
</Warning>

---

## ฮุก

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
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
        model: "openai/gpt-5.6-sol",
      },
    ],
  },
}
```

การยืนยันตัวตน: `Authorization: Bearer <token>` หรือ `x-openclaw-token: <token>`
โทเค็นฮุกในสตริงคำค้นจะถูกปฏิเสธ

หมายเหตุด้านการตรวจสอบความถูกต้องและความปลอดภัย:

- `hooks.enabled=true` ต้องมี `hooks.token` ที่ไม่ว่างเปล่า
- `hooks.token` ควรแตกต่างจากการยืนยันตัวตนด้วยข้อมูลลับร่วมของ Gateway ที่ใช้งานอยู่ (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` หรือ `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) เมื่อเริ่มทำงาน ระบบจะบันทึกคำเตือนด้านความปลอดภัยที่ไม่ร้ายแรงหากตรวจพบการใช้ซ้ำ
- `openclaw security audit` ระบุการใช้ข้อมูลยืนยันตัวตนร่วมกันระหว่าง hook/Gateway เป็นข้อค้นพบระดับวิกฤต รวมถึงการยืนยันตัวตนด้วยรหัสผ่านของ Gateway ที่ระบุเฉพาะตอนตรวจสอบ (`--auth password --password <password>`) เรียกใช้ `openclaw doctor --fix` เพื่อหมุนเวียน `hooks.token` ที่จัดเก็บไว้และถูกใช้ซ้ำ จากนั้นอัปเดตตัวส่ง hook ภายนอกให้ใช้โทเค็น hook ใหม่
- `hooks.path` ต้องไม่เป็น `/` ให้ใช้พาธย่อยเฉพาะ เช่น `/hooks`
- หาก `hooks.allowRequestSessionKey=true` ให้จำกัด `hooks.allowedSessionKeyPrefixes` (ตัวอย่างเช่น `["hook:"]`)
- หากการแมปหรือค่าที่ตั้งไว้ล่วงหน้าใช้ `sessionKey` แบบเทมเพลต ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` และ `hooks.allowRequestSessionKey=true` คีย์การแมปแบบคงที่ไม่ต้องเลือกรับการทำงานนี้

**เอ็นด์พอยต์:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - ระบบยอมรับ `sessionKey` จากเพย์โหลดคำขอเฉพาะเมื่อ `hooks.allowRequestSessionKey=true` (ค่าเริ่มต้น: `false`)
- `POST /hooks/<name>` → แก้ค่าโดยใช้ `hooks.mappings`
  - ค่า `sessionKey` ของการแมปที่เรนเดอร์จากเทมเพลตจะถือว่ามาจากภายนอก และต้องมี `hooks.allowRequestSessionKey=true` เช่นกัน

<Accordion title="รายละเอียดการแมป">

- `match.path` จับคู่พาธย่อยหลัง `/hooks` (เช่น `/hooks/gmail` → `gmail`)
- `match.source` จับคู่ฟิลด์เพย์โหลดสำหรับพาธทั่วไป
- เทมเพลต เช่น `{{messages[0].subject}}` อ่านค่าจากเพย์โหลด
- `transform` สามารถชี้ไปยังโมดูล JS/TS ที่ส่งคืนการดำเนินการของ hook
  - `transform.module` ต้องเป็นพาธสัมพัทธ์และอยู่ภายใน `hooks.transformsDir` (ระบบจะปฏิเสธพาธสัมบูรณ์และการข้ามไดเรกทอรี)
  - เก็บ `hooks.transformsDir` ไว้ภายใต้ `~/.openclaw/hooks/transforms` ระบบจะปฏิเสธไดเรกทอรี Skills ของพื้นที่ทำงาน หาก `openclaw doctor` รายงานว่าพาธนี้ไม่ถูกต้อง ให้ย้ายโมดูลแปลงไปยังไดเรกทอรีการแปลงของ hooks หรือลบ `hooks.transformsDir`
- `agentId` กำหนดเส้นทางไปยังเอเจนต์ที่ระบุ โดย ID ที่ไม่รู้จักจะใช้เอเจนต์เริ่มต้นแทน
- `allowedAgentIds`: จำกัดการกำหนดเส้นทางเอเจนต์ที่มีผล รวมถึงพาธของเอเจนต์เริ่มต้นเมื่อไม่ได้ระบุ `agentId` (`*` หรือไม่ระบุ = อนุญาตทั้งหมด, `[]` = ปฏิเสธทั้งหมด)
- `defaultSessionKey`: คีย์เซสชันคงที่ซึ่งระบุหรือไม่ก็ได้สำหรับการเรียกใช้เอเจนต์ของ hook ที่ไม่มี `sessionKey` ชัดเจน
- `allowRequestSessionKey`: อนุญาตให้ผู้เรียก `/hooks/agent` และคีย์เซสชันการแมปที่ขับเคลื่อนด้วยเทมเพลตตั้งค่า `sessionKey` (ค่าเริ่มต้น: `false`)
- `allowedSessionKeyPrefixes`: รายการอนุญาตของคำนำหน้าซึ่งระบุหรือไม่ก็ได้สำหรับค่า `sessionKey` ที่กำหนดอย่างชัดเจน (คำขอ + การแมป) เช่น `["hook:"]` ค่านี้จะกลายเป็นข้อบังคับเมื่อการแมปหรือค่าที่ตั้งไว้ล่วงหน้ารายการใดใช้ `sessionKey` แบบเทมเพลต
- `deliver: true` ส่งคำตอบสุดท้ายไปยังช่องทาง โดย `channel` มีค่าเริ่มต้นเป็น `last`
- `model` แทนที่ LLM สำหรับการเรียกใช้ hook ครั้งนี้ (ต้องได้รับอนุญาตหากมีการตั้งค่าแค็ตตาล็อกโมเดล)

</Accordion>

### การผสานการทำงานกับ Gmail

- ค่าที่ตั้งไว้ล่วงหน้าของ Gmail ในตัวใช้ `sessionKey: "hook:gmail:{{messages[0].id}}"`
- คีย์ต่อข้อความนี้แยกบริบทการสนทนา ไม่ได้แยกเครื่องมือหรือการเข้าถึงพื้นที่ทำงาน หากไม่มีการแมปแบบกำหนดเองที่ตั้งค่า `agentId` ค่าที่ตั้งไว้ล่วงหน้าจะใช้เอเจนต์เริ่มต้น
- สำหรับกล่องจดหมายที่ไม่น่าเชื่อถือ ให้กำหนดเส้นทาง Gmail ไปยังเอเจนต์ตัวอ่านเฉพาะ และจำกัดเอเจนต์นั้นด้วย [แซนด์บ็อกซ์และนโยบายเครื่องมือต่อเอเจนต์](/th/tools/multi-agent-sandbox-tools) หากตัวอ่านต้องแจ้งเอเจนต์หลัก ให้จำกัดการส่งต่องานด้วย [`tools.agentToAgent`](/th/gateway/config-tools#toolsagenttoagent) ดูโมเดลภัยคุกคามและระดับโมเดลที่แนะนำได้ที่ [การแทรกพรอมต์](/th/gateway/security#prompt-injection)
- หากคงการกำหนดเส้นทางต่อข้อความดังกล่าวไว้ ให้ตั้งค่า `hooks.allowRequestSessionKey: true` และจำกัด `hooks.allowedSessionKeyPrefixes` ให้ตรงกับเนมสเปซของ Gmail เช่น `["hook:", "hook:gmail:"]`
- หากต้องการ `hooks.allowRequestSessionKey: false` ให้แทนที่ค่าที่ตั้งไว้ล่วงหน้าด้วย `sessionKey` แบบคงที่ แทนค่าเริ่มต้นแบบเทมเพลต

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
      model: "openai/gpt-5.6-sol",
      thinking: "high",
    },
  },
}
```

- Gateway เริ่ม `gog gmail watch serve` โดยอัตโนมัติขณะบูตเมื่อมีการกำหนดค่า ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อปิดใช้งาน
- อย่าเรียกใช้ `gog gmail watch serve` แยกต่างหากควบคู่กับ Gateway

---

## โฮสต์ Plugin ของ Canvas

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // หรือ OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- ให้บริการ HTML/CSS/JS ที่เอเจนต์แก้ไขได้และ A2UI ผ่าน HTTP ภายใต้พอร์ตของ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- เฉพาะภายในเครื่อง: คง `gateway.bind: "loopback"` ไว้ (ค่าเริ่มต้น)
- การผูกกับอินเทอร์เฟซที่ไม่ใช่ลูปแบ็ก: เส้นทาง canvas ต้องใช้การยืนยันตัวตนของ Gateway (โทเค็น/รหัสผ่าน/พร็อกซีที่เชื่อถือได้) เช่นเดียวกับพื้นผิว HTTP อื่นของ Gateway
- โดยทั่วไป WebView ของ Node จะไม่ส่งส่วนหัวการยืนยันตัวตน หลังจากจับคู่และเชื่อมต่อโหนดแล้ว Gateway จะประกาศ URL ความสามารถที่มีขอบเขตเฉพาะโหนดสำหรับการเข้าถึง canvas/A2UI
- URL ความสามารถจะผูกกับเซสชัน WS ที่ใช้งานอยู่ของโหนดและหมดอายุอย่างรวดเร็ว ไม่มีการใช้ทางเลือกสำรองตาม IP
- แทรกไคลเอ็นต์โหลดซ้ำแบบสดลงใน HTML ที่ให้บริการ
- สร้าง `index.html` เริ่มต้นโดยอัตโนมัติเมื่อว่างเปล่า
- ให้บริการ A2UI ที่ `/__openclaw__/a2ui/` ด้วย
- การเปลี่ยนแปลงต้องเริ่ม Gateway ใหม่
- ปิดใช้การโหลดซ้ำแบบสดสำหรับไดเรกทอรีขนาดใหญ่หรือเมื่อเกิดข้อผิดพลาด `EMFILE`

---

## การค้นหา

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

- `minimal` (ค่าเริ่มต้น): ละเว้น `cliPath` + `sshPort` จากระเบียน TXT
- `full`: รวม `cliPath` + `sshPort` การประกาศแบบมัลติแคสต์บน LAN ยังคงต้องเปิดใช้งาน Plugin `bonjour` ที่รวมมาให้
- `off`: ระงับการประกาศแบบมัลติแคสต์บน LAN โดยไม่เปลี่ยนการเปิดใช้งาน Plugin
- Plugin `bonjour` ที่รวมมาให้จะเริ่มโดยอัตโนมัติบนโฮสต์ macOS และต้องเลือกรับการทำงานบน Linux, Windows และการปรับใช้ Gateway แบบคอนเทนเนอร์
- ชื่อโฮสต์มีค่าเริ่มต้นเป็นชื่อโฮสต์ของระบบเมื่อเป็นป้ายกำกับ DNS ที่ถูกต้อง หากไม่ถูกต้องจะใช้ `openclaw` แทน กำหนดทับด้วย `OPENCLAW_MDNS_HOSTNAME`
- `OPENCLAW_DISABLE_BONJOUR=1` ปิดการประกาศ mDNS โดยสิ้นเชิง และแทนที่ `discovery.mdns.mode`

### บริเวณกว้าง (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

เขียนโซน DNS-SD แบบยูนิแคสต์ภายใต้ `~/.openclaw/dns/` สำหรับการค้นหาข้ามเครือข่าย ให้ใช้ร่วมกับเซิร์ฟเวอร์ DNS (แนะนำ CoreDNS) + DNS แบบแยกของ Tailscale

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

- ตัวแปรสภาพแวดล้อมแบบอินไลน์จะมีผลเฉพาะเมื่อสภาพแวดล้อมของกระบวนการไม่มีคีย์ดังกล่าว
- ไฟล์ `.env`: `.env` ของ CWD + `~/.openclaw/.env` (ทั้งสองไม่แทนที่ตัวแปรที่มีอยู่)
- `shellEnv`: นำเข้าคีย์ที่คาดไว้แต่ยังไม่มีจากโปรไฟล์ล็อกอินเชลล์
- ดูลำดับความสำคัญทั้งหมดได้ที่ [สภาพแวดล้อม](/th/help/environment)

### การแทนค่าตัวแปรสภาพแวดล้อม

อ้างอิงตัวแปรสภาพแวดล้อมในสตริงการกำหนดค่าใดก็ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- จับคู่เฉพาะชื่อที่เป็นตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- ตัวแปรที่ไม่มีหรือว่างเปล่าจะทำให้เกิดข้อผิดพลาดเมื่อโหลดการกำหนดค่า
- หลีกอักขระด้วย `$${VAR}` สำหรับ `${VAR}` แบบข้อความตรงตัว
- ทำงานร่วมกับ `$include`

---

## ข้อมูลลับ

การอ้างอิงข้อมูลลับเป็นแบบเพิ่มเติม โดยค่าข้อความธรรมดายังคงใช้งานได้

### `SecretRef`

ใช้รูปแบบออบเจ็กต์แบบเดียว:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

การตรวจสอบความถูกต้อง:

- รูปแบบ `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- รูปแบบ ID ของ `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- ID ของ `source: "file"`: ตัวชี้ JSON แบบสัมบูรณ์ (ตัวอย่างเช่น `"/providers/openai/apiKey"`)
- รูปแบบ ID ของ `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (รองรับตัวเลือก `secret#json_key` แบบ AWS)
- ID ของ `source: "exec"` ต้องไม่มีเซกเมนต์พาธที่คั่นด้วยเครื่องหมายทับ `.` หรือ `..` (ตัวอย่างเช่น ระบบจะปฏิเสธ `a/../b`)

### พื้นผิวข้อมูลประจำตัวที่รองรับ

- เมทริกซ์มาตรฐาน: [พื้นผิวข้อมูลประจำตัว SecretRef](/th/reference/secretref-credential-surface)
- เป้าหมาย `secrets apply` รองรับพาธข้อมูลประจำตัว `openclaw.json`
- การอ้างอิง `auth-profiles.json` รวมอยู่ในการแก้ค่าขณะรันไทม์และขอบเขตการตรวจสอบ

### การกำหนดค่าผู้ให้บริการข้อมูลลับ

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // ผู้ให้บริการ env แบบระบุชัดเจนซึ่งไม่บังคับ
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
- พาธของผู้ให้บริการ file และ exec จะปฏิเสธการทำงานเมื่อไม่สามารถตรวจสอบ ACL ของ Windows ได้ ตั้งค่า `allowInsecurePath: true` เฉพาะสำหรับพาธที่เชื่อถือได้แต่ไม่สามารถตรวจสอบได้
- ผู้ให้บริการ `exec` ต้องใช้พาธ `command` แบบสัมบูรณ์ และใช้เพย์โหลดโปรโตคอลบน stdin/stdout
- โดยค่าเริ่มต้น ระบบจะปฏิเสธพาธคำสั่งที่เป็นลิงก์สัญลักษณ์ ตั้งค่า `allowSymlinkCommand: true` เพื่ออนุญาตพาธลิงก์สัญลักษณ์ พร้อมตรวจสอบความถูกต้องของพาธเป้าหมายที่แก้ค่าแล้ว
- หากมีการกำหนดค่า `trustedDirs` การตรวจสอบไดเรกทอรีที่เชื่อถือได้จะใช้กับพาธเป้าหมายที่แก้ค่าแล้ว
- โดยค่าเริ่มต้น สภาพแวดล้อมลูกของ `exec` จะมีเฉพาะค่าขั้นต่ำ ให้ส่งตัวแปรที่จำเป็นอย่างชัดเจนด้วย `passEnv`
- การอ้างอิงข้อมูลลับจะได้รับการแก้ค่าเป็นสแนปช็อตในหน่วยความจำเมื่อเปิดใช้งาน จากนั้นพาธคำขอจะอ่านเฉพาะสแนปช็อตดังกล่าว
- การกรองพื้นผิวที่ใช้งานอยู่จะเกิดขึ้นระหว่างการเปิดใช้งาน: การอ้างอิงที่ยังแก้ค่าไม่ได้บนพื้นผิวที่เปิดใช้งานจะทำให้การเริ่มทำงาน/โหลดซ้ำล้มเหลว ส่วนพื้นผิวที่ไม่ได้ใช้งานจะถูกข้ามพร้อมข้อมูลวินิจฉัย

---

## ที่จัดเก็บการยืนยันตัวตน

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

- โปรไฟล์ต่อเอเจนต์จัดเก็บไว้ที่ `<agentDir>/auth-profiles.json`
- `auth-profiles.json` รองรับการอ้างอิงระดับค่า (`keyRef` สำหรับ `api_key`, `tokenRef` สำหรับ `token`) สำหรับโหมดข้อมูลประจำตัวแบบคงที่
- แมป `auth-profiles.json` แบบแบนดั้งเดิม เช่น `{ "provider": { "apiKey": "..." } }` ไม่ใช่รูปแบบรันไทม์; `openclaw doctor --fix` จะเขียนใหม่เป็นโปรไฟล์คีย์ API `provider:default` มาตรฐานพร้อมข้อมูลสำรอง `.legacy-flat.*.bak`
- โปรไฟล์โหมด OAuth (`auth.profiles.<id>.mode = "oauth"`) ไม่รองรับข้อมูลประจำตัวของโปรไฟล์การยืนยันตัวตนที่อ้างอิงผ่าน SecretRef
- ข้อมูลประจำตัวรันไทม์แบบคงที่มาจากสแนปช็อตที่แก้ไขค่าแล้วในหน่วยความจำ; รายการ `auth.json` แบบคงที่ดั้งเดิมจะถูกล้างเมื่อตรวจพบ
- การนำเข้า OAuth แบบดั้งเดิมจาก `~/.openclaw/credentials/oauth.json`
- ดู [OAuth](/th/concepts/oauth)
- พฤติกรรมรันไทม์ของข้อมูลลับและเครื่องมือ `audit/configure/apply`: [การจัดการข้อมูลลับ](/th/gateway/secrets)

---

## การตรวจสอบ

```json5
{
  audit: {
    enabled: true,
    messages: "off", // off | direct | all
  },
}
```

Gateway บันทึกเหตุการณ์ตรวจสอบที่มี **เฉพาะเมทาดาทา** สำหรับการเรียกใช้เอเจนต์และการทำงานของเครื่องมือลงในฐานข้อมูลสถานะที่ใช้ร่วมกัน เมทาดาทาวงจรชีวิตของข้อความเป็นตัวเลือกแยกต่างหากที่ต้องเปิดใช้ บัญชีบันทึกจัดเก็บข้อมูลประจำตัว เวลา ชื่อเครื่องมือ และผลลัพธ์ที่ทำให้เป็นมาตรฐานแล้ว แต่จะไม่จัดเก็บพรอมต์ เนื้อหาข้อความ อาร์กิวเมนต์ของเครื่องมือ ผลลัพธ์ หรือข้อความข้อผิดพลาดดิบ แถวข้อความจะไม่จัดเก็บ ID ดิบของบัญชีแพลตฟอร์ม การสนทนา ข้อความ และเป้าหมาย คีย์เซสชันของการเรียกใช้/เครื่องมือยังคงพร้อมใช้สำหรับการเชื่อมโยง และอาจมี ID บัญชีแพลตฟอร์มหรือ ID ของเพียร์อยู่ด้วย ระเบียนจะหมดอายุหลังจาก 30 วัน และบัญชีบันทึกจำกัดไว้ที่ 100,000 แถว สอบถามข้อมูลด้วย [`openclaw audit`](/th/cli/audit) หรือ Gateway RPC [`audit.activity.list`](/th/gateway/protocol#audit-ledger-rpc) ดูโมเดลข้อมูลทั้งหมด ความหมายด้านความเป็นส่วนตัว และขีดจำกัดความครอบคลุมได้ที่ [ประวัติการตรวจสอบ](/th/gateway/audit)

- `enabled`: บันทึกเหตุการณ์ตรวจสอบใหม่ (ค่าเริ่มต้น: `true`) บัญชีบันทึกเปิดใช้โดยค่าเริ่มต้น เพราะเส้นทางการตรวจสอบที่เปิดใช้หลังเกิดเหตุเท่านั้นไม่สามารถอธิบายเหตุการณ์นั้นได้ การตั้งค่า `false` จะหยุดการแทรกเหตุการณ์ใหม่หลังจาก Gateway เริ่มต้นใหม่; ระเบียนที่มีอยู่ยังคงอ่านได้จนกว่าจะหมดอายุ การเปิดใช้อีกครั้งจะเริ่มบันทึกต่อจากจุดนั้น โดยจะไม่มีการเติมข้อมูลย้อนหลังในช่วงที่ขาดหาย
- `messages`: ขอบเขตเมทาดาทาของข้อความ (ค่าเริ่มต้น: `"off"`) `"direct"` บันทึกเฉพาะการสนทนาโดยตรงที่รู้จัก `"all"` บันทึกการสนทนาแบบกลุ่ม ช่อง และชนิดที่ไม่รู้จักด้วย ทั้งสองโหมดยังคงไม่มีเนื้อหาและแทนที่ตัวระบุดิบด้วยนามแฝงที่สร้างด้วยคีย์เฉพาะการติดตั้งเมื่อสามารถเชื่อมโยงได้ สิ่งเหล่านี้เป็นตัวช่วยเชื่อมโยง ไม่ใช่การทำให้เป็นนิรนาม; ฐานข้อมูลสถานะจัดเก็บคีย์ที่ใช้สร้าง แต่การส่งออกผ่าน RPC และ CLI จะไม่รวมคีย์นี้

Gateway ที่กำลังทำงานจะบันทึกค่า `audit.enabled` และ `audit.messages` ขณะเริ่มต้น; ให้เริ่มต้นใหม่หลังเปลี่ยนการตั้งค่าใดค่าหนึ่ง ปัจจุบันความครอบคลุมของข้อความรวมถึงข้อความขาเข้าที่ได้รับการยอมรับและไปถึงการส่งต่อหลัก และแถวสถานะสิ้นสุดหนึ่งแถวต่อเพย์โหลดการตอบกลับขาออกเชิงตรรกะต้นฉบับแต่ละรายการที่ไปถึงการส่งมอบแบบคงทนที่ใช้ร่วมกัน เส้นทางภายใน Plugin และเส้นทางส่งโดยตรงที่ข้ามขอบเขตที่ใช้ร่วมกันเหล่านั้นยังไม่ครอบคลุม ตัวเขียนเบื้องหลังแบบมีขอบเขตจำกัดทำงานโดยพยายามอย่างดีที่สุด ไม่ใช่คลังข้อมูลการปฏิบัติตามข้อกำหนดที่รับประกันว่าไม่มีข้อมูลสูญหาย

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
- ตั้งค่า `logging.file` เพื่อใช้พาธที่คงที่
- `consoleLevel` จะเพิ่มเป็น `debug` เมื่อ `--verbose`
- `maxFileBytes`: ขนาดสูงสุดของไฟล์ล็อกที่ใช้งานอยู่ในหน่วยไบต์ก่อนหมุนเวียน (จำนวนเต็มบวก; ค่าเริ่มต้น: `104857600` = 100 MB) OpenClaw เก็บไฟล์เก็บถาวรแบบมีหมายเลขไว้ข้างไฟล์ที่ใช้งานอยู่สูงสุดห้าไฟล์
- `redactSensitive` / `redactPatterns`: การปกปิดแบบพยายามอย่างดีที่สุดสำหรับเอาต์พุตคอนโซล ล็อกไฟล์ ระเบียนล็อก OTLP และข้อความบันทึกการสนทนาของเซสชันที่จัดเก็บถาวร `redactSensitive: "off"` ปิดใช้งานเฉพาะนโยบายล็อก/บันทึกการสนทนาทั่วไปนี้เท่านั้น; พื้นผิวความปลอดภัยของ UI/เครื่องมือ/การวินิจฉัยยังคงปกปิดข้อมูลลับก่อนส่งออก

---

## การวินิจฉัย

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],

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

- `enabled`: สวิตช์หลักสำหรับเอาต์พุตการตรวจวัด (ค่าเริ่มต้น: `true`)
- `flags`: อาร์เรย์ของสตริงแฟล็กที่เปิดใช้เอาต์พุตล็อกแบบเจาะจง (รองรับไวลด์การ์ด เช่น `"telegram.*"` หรือ `"*"`)
- `otel.enabled`: เปิดใช้ไปป์ไลน์ส่งออก OpenTelemetry (ค่าเริ่มต้น: `false`) สำหรับการกำหนดค่าทั้งหมด แค็ตตาล็อกสัญญาณ และโมเดลความเป็นส่วนตัว ดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)
- `otel.endpoint`: URL ของตัวรวบรวมสำหรับการส่งออก OTel
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: ปลายทาง OTLP เฉพาะสัญญาณที่กำหนดหรือไม่ก็ได้ เมื่อตั้งค่าแล้ว จะใช้แทน `otel.endpoint` เฉพาะสำหรับสัญญาณนั้น
- `otel.protocol`: `"http/protobuf"` (ค่าเริ่มต้น) หรือ `"grpc"`
- `otel.headers`: ส่วนหัวเมทาดาทา HTTP/gRPC เพิ่มเติมที่ส่งพร้อมคำขอส่งออก OTel
- `otel.serviceName`: ชื่อบริการสำหรับแอตทริบิวต์ทรัพยากร
- `otel.traces` / `otel.metrics` / `otel.logs`: เปิดใช้การส่งออกเทรซ เมตริก หรือล็อก
- `otel.logsExporter`: ปลายทางรับการส่งออกล็อก: `"otlp"` (ค่าเริ่มต้น), `"stdout"` สำหรับออบเจ็กต์ JSON หนึ่งรายการต่อหนึ่งบรรทัด stdout หรือ `"both"`
- `otel.sampleRate`: อัตราการสุ่มตัวอย่างเทรซ `0`-`1`
- `otel.flushIntervalMs`: ช่วงเวลาล้างข้อมูลโทรมาตรเป็นระยะในหน่วย ms
- `otel.captureContent`: การบันทึกเนื้อหาดิบแบบเลือกเปิดใช้สำหรับแอตทริบิวต์สแปน OTEL ค่าเริ่มต้นคือปิด ค่าบูลีน `true` จะบันทึกเนื้อหาข้อความ/เครื่องมือที่ไม่ใช่ระบบ; รูปแบบออบเจ็กต์ช่วยให้เปิดใช้ `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` และ `toolDefinitions` ได้อย่างชัดเจน
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: สวิตช์สภาพแวดล้อมสำหรับรูปแบบสแปนการอนุมาน GenAI เชิงทดลองล่าสุด รวมถึงชื่อสแปน `{gen_ai.operation.name} {gen_ai.request.model}`, ชนิดสแปน `CLIENT` และ `gen_ai.provider.name` แทน `gen_ai.system` แบบดั้งเดิม โดยค่าเริ่มต้น สแปนจะคง `openclaw.model.call` และ `gen_ai.system` ไว้เพื่อความเข้ากันได้; เมตริก GenAI ใช้แอตทริบิวต์เชิงความหมายแบบมีขอบเขต
- `OPENCLAW_OTEL_PRELOADED=1`: สวิตช์สภาพแวดล้อมสำหรับโฮสต์ที่ลงทะเบียน OpenTelemetry SDK ส่วนกลางไว้แล้ว จากนั้น OpenClaw จะข้ามการเริ่มต้น/ปิดระบบ SDK ที่ Plugin เป็นเจ้าของ โดยยังคงให้ตัวรับฟังการวินิจฉัยทำงานอยู่
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` และ `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: ตัวแปรสภาพแวดล้อมปลายทางเฉพาะสัญญาณที่ใช้เมื่อไม่ได้ตั้งค่าคีย์การกำหนดค่าที่ตรงกัน
- `cacheTrace.enabled`: บันทึกสแนปช็อตเทรซแคชสำหรับการเรียกใช้แบบฝัง (ค่าเริ่มต้น: `false`)
- `cacheTrace.filePath`: พาธเอาต์พุตสำหรับ JSONL ของเทรซแคช (ค่าเริ่มต้น: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: ควบคุมสิ่งที่รวมอยู่ในเอาต์พุตเทรซแคช (ค่าเริ่มต้นทั้งหมด: `true`)

---

## การอัปเดต

```json5
{
  update: {
    channel: "stable", // stable | extended-stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
    },
  },
}
```

- `channel`: ช่องทางการเผยแพร่ - `"stable"`, `"extended-stable"`, `"beta"` หรือ `"dev"` Extended-stable ใช้สำหรับแพ็กเกจเท่านั้น: คำสั่งเบื้องหน้ารับผิดชอบการติดตั้ง ขณะที่ Gateway อาจแสดงคำแนะนำการอัปเดตแบบอ่านอย่างเดียว
- `checkOnStart`: ตรวจสอบการอัปเดต npm เมื่อ Gateway เริ่มต้น (ค่าเริ่มต้น: `true`) ตัวเลือก extended-stable ที่จัดเก็บไว้ใช้คำแนะนำแบบอ่านอย่างเดียวและกำหนดการแนะนำทุก 24 ชั่วโมงเช่นเดียวกัน
- `auto.enabled`: เปิดใช้การอัปเดตอัตโนมัติเบื้องหลังสำหรับการติดตั้งแพ็กเกจ stable และ beta (ค่าเริ่มต้น: `false`) Extended-stable จะไม่ถูกนำไปใช้โดยอัตโนมัติ

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    fallbacks: ["acpx-secondary"],
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    stream: {
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
    },
  },
}
```

- `enabled`: เกตฟีเจอร์ ACP ส่วนกลาง (ค่าเริ่มต้น: `true`; ตั้งค่า `false` เพื่อซ่อนความสามารถในการส่งต่อและสร้าง ACP)
- `dispatch.enabled`: เกตอิสระสำหรับการส่งต่อเทิร์นของเซสชัน ACP (ค่าเริ่มต้น: `true`) ตั้งค่า `false` เพื่อให้คำสั่ง ACP ยังใช้งานได้แต่บล็อกการดำเนินการ
- `backend`: ID แบ็กเอนด์รันไทม์ ACP เริ่มต้น (ต้องตรงกับ Plugin รันไทม์ ACP ที่ลงทะเบียนไว้)
  ติดตั้ง Plugin แบ็กเอนด์ก่อน และหากตั้งค่า `plugins.allow` ให้รวม ID ของ Plugin แบ็กเอนด์ (เช่น `acpx`) มิฉะนั้นแบ็กเอนด์ ACP จะไม่โหลด
- `fallbacks`: รายการ ID แบ็กเอนด์ ACP สำรองตามลำดับที่จะลองเมื่อแบ็กเอนด์หลักล้มเหลวตั้งแต่เนิ่น ๆ ด้วยข้อผิดพลาดที่ดูเป็นเหตุชั่วคราว (ไม่พร้อมใช้งาน ถูกจำกัดอัตรา โควตาหมด หรือโหลดเกิน) ก่อนที่จะสร้างเอาต์พุตใด ๆ แต่ละรายการต้องตรงกับแบ็กเอนด์ Plugin รันไทม์ ACP ที่ลงทะเบียนไว้
- `defaultAgent`: ID เอเจนต์เป้าหมาย ACP สำรองเมื่อการสร้างไม่ได้ระบุเป้าหมายอย่างชัดเจน
- `allowedAgents`: รายการอนุญาตของ ID เอเจนต์ที่ใช้ได้สำหรับเซสชันรันไทม์ ACP; หากว่างหมายถึงไม่มีข้อจำกัดเพิ่มเติม
- `stream.repeatSuppression`: ระงับบรรทัดสถานะ/เครื่องมือที่ซ้ำกันต่อเทิร์น (ค่าเริ่มต้น: `true`)
- `stream.deliveryMode`: `"live"` สตรีมแบบเพิ่มทีละส่วน; `"final_only"` พักข้อมูลไว้จนกว่าจะเกิดเหตุการณ์สิ้นสุดเทิร์น
- `stream.tagVisibility`: ระเบียนชื่อแท็กที่แมปกับค่าบูลีนซึ่งเขียนทับการมองเห็นสำหรับเหตุการณ์ที่สตรีม
- `runtime.installCommand`: คำสั่งติดตั้งที่กำหนดหรือไม่ก็ได้สำหรับเรียกใช้เมื่อบูตสแตรปสภาพแวดล้อมรันไทม์ ACP

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

- `cli.banner.taglineMode` ควบคุมรูปแบบคำโปรยของแบนเนอร์:
  - `"random"` (ค่าเริ่มต้น): หมุนเวียนคำโปรยขำขัน/ตามฤดูกาล
  - `"default"`: คำโปรยเป็นกลางแบบคงที่ (`All your chats, one OpenClaw.`)
  - `"off"`: ไม่มีข้อความคำโปรย (ยังคงแสดงชื่อ/เวอร์ชันในแบนเนอร์)
- หากต้องการซ่อนแบนเนอร์ทั้งหมด (ไม่ใช่เฉพาะคำโปรย) ให้ตั้งค่าตัวแปรสภาพแวดล้อม `OPENCLAW_HIDE_BANNER=1`

---

## วิซาร์ด

ลักษณะการทำงานและเมทาดาทาสำหรับขั้นตอนการตั้งค่าแบบมีคำแนะนำของ CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    accessMode: "full",
    appRecommendations: true,
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

- `wizard.accessMode`: ความยินยอมให้สำรวจที่เลือกเมื่อเริ่มต้นการเริ่มใช้งานแบบมีคำแนะนำ `"full"` (แนะนำ) อนุญาตให้การตั้งค่าค้นหาแอป AI คีย์ และรันไทม์ภายในเครื่องโดยอัตโนมัติ ส่วน `"guarded"` ทำให้การตั้งค่าถามหนึ่งครั้งก่อนสำรวจและเสนอการกำหนดค่าด้วยตนเองแทน

- `wizard.appRecommendations` มีค่าเริ่มต้นเป็น `true` ตั้งค่าเป็น `false` เพื่อปิดคำแนะนำแอปพลิเคชันที่ติดตั้งระหว่างการเริ่มใช้งานแบบมีคำแนะนำหรือแบบคลาสสิก และบล็อกการเข้าถึง `device.apps` ของ Gateway โฮสต์ Node ยังคงต้องเปิดแฟล็กแยกสำหรับการแชร์แอปที่ติดตั้ง ซึ่งปิดอยู่โดยค่าเริ่มต้น ก่อนที่จะประกาศคำสั่งดังกล่าว

---

## ข้อมูลประจำตัว

ดูฟิลด์ข้อมูลประจำตัว `agents.list` ภายใต้ [ค่าเริ่มต้นของเอเจนต์](/th/gateway/config-agents#agent-defaults)

---

## บริดจ์ (แบบเดิม ถูกนำออกแล้ว)

บิลด์ปัจจุบันไม่มีบริดจ์ TCP อีกต่อไป Node เชื่อมต่อผ่าน WebSocket ของ Gateway คีย์ `bridge.*` ไม่ได้เป็นส่วนหนึ่งของสคีมาการกำหนดค่าอีกต่อไป (การตรวจสอบความถูกต้องจะล้มเหลวจนกว่าจะนำคีย์ออก โดย `openclaw doctor --fix` สามารถลบคีย์ที่ไม่รู้จักได้)

<Accordion title="การกำหนดค่าบริดจ์แบบเดิม (ข้อมูลอ้างอิงย้อนหลัง)">

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
    webhook: "https://example.invalid/legacy", // ตัวสำรองที่เลิกใช้แล้วสำหรับงานที่จัดเก็บไว้ซึ่งมี notify:true
    webhookToken: "replace-with-dedicated-token", // โทเค็น bearer ที่เลือกใช้ได้สำหรับการยืนยันตัวตนของ webhook ขาออก
    sessionRetention: "24h", // สตริงระยะเวลาหรือ false
  },
}
```

- `sessionRetention`: ระยะเวลาที่เก็บเซสชันการทำงาน cron แบบแยกที่เสร็จสิ้นแล้ว ก่อนตัดแถวเซสชันใน SQLite ออก นอกจากนี้ยังควบคุมการล้างทรานสคริปต์ cron ที่ถูกลบและเก็บถาวร ค่าเริ่มต้น: `24h`; ตั้งค่าเป็น `false` เพื่อปิดใช้งาน
- ประวัติการทำงานจะเก็บแถวสถานะสิ้นสุดล่าสุด 2000 แถวต่องานโดยอัตโนมัติ แถวที่สูญหายยังคงมีช่วงเวลาล้างข้อมูล 24 ชั่วโมง
- `webhookToken`: โทเค็น bearer ที่ใช้สำหรับการส่ง POST ของ cron webhook (`delivery.mode = "webhook"`) หากละไว้จะไม่มีการส่งส่วนหัวการยืนยันตัวตน
- `webhook`: URL webhook สำรองแบบเดิมที่เลิกใช้แล้ว (http/https) ซึ่ง `openclaw doctor --fix` ใช้ย้ายงานที่จัดเก็บไว้และยังมี `notify: true`; การส่งขณะรันไทม์ใช้ `delivery.mode="webhook"` รายงานร่วมกับ `delivery.to` หรือใช้ `delivery.completionDestination` เมื่อคงการส่งแบบประกาศไว้

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

- `enabled`: เปิดการแจ้งเตือนความล้มเหลวสำหรับงาน cron (ค่าเริ่มต้น: `false`)
- `after`: จำนวนความล้มเหลวต่อเนื่องก่อนเรียกใช้การแจ้งเตือน (จำนวนเต็มบวก ค่าต่ำสุด: `1`)
- `cooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการแจ้งเตือนซ้ำสำหรับงานเดียวกัน (จำนวนเต็มที่ไม่ติดลบ)
- `includeSkipped`: นับการทำงานที่ข้ามติดต่อกันรวมในเกณฑ์การแจ้งเตือน (ค่าเริ่มต้น: `false`) การทำงานที่ข้ามจะถูกติดตามแยกต่างหากและไม่ส่งผลต่อการหน่วงถอยหลังเมื่อเกิดข้อผิดพลาดในการดำเนินการ
- `mode`: โหมดการส่ง - `"announce"` ส่งผ่านข้อความในช่องทาง ส่วน `"webhook"` โพสต์ไปยัง webhook ที่กำหนดค่าไว้
- `accountId`: รหัสบัญชีหรือช่องทางที่เลือกใช้ได้เพื่อจำกัดขอบเขตการส่งการแจ้งเตือน

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

- ปลายทางเริ่มต้นสำหรับการแจ้งเตือนความล้มเหลวของ cron ในทุกงาน
- `mode`: `"announce"` หรือ `"webhook"`; มีค่าเริ่มต้นเป็น `"announce"` เมื่อมีข้อมูลเป้าหมายเพียงพอ
- `channel`: การแทนที่ช่องทางสำหรับการส่งแบบประกาศ `"last"` ใช้ช่องทางการส่งล่าสุดที่ทราบซ้ำ
- `to`: เป้าหมายการประกาศหรือ URL webhook ที่ระบุอย่างชัดเจน จำเป็นสำหรับโหมด webhook
- `accountId`: การแทนที่บัญชีสำหรับการส่งที่เลือกใช้ได้
- `delivery.failureDestination` รายงานจะแทนที่ค่าเริ่มต้นส่วนกลางนี้
- เมื่อไม่ได้ตั้งค่าปลายทางความล้มเหลวทั้งส่วนกลางและรายงาน งานที่ส่งผ่าน `announce` อยู่แล้วจะใช้เป้าหมายการประกาศหลักนั้นเป็นตัวสำรองเมื่อเกิดความล้มเหลว
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เว้นแต่ `delivery.mode` หลักของงานจะเป็น `"webhook"`

ดู [งาน Cron](/th/automation/cron-jobs) การดำเนินการ cron แบบแยกจะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

## ตัวแปรเทมเพลตโมเดลสื่อ

ตัวยึดตำแหน่งของเทมเพลตที่ถูกขยายใน `tools.media.models[].args`:

| ตัวแปร             | คำอธิบาย                                          |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | เนื้อหาข้อความขาเข้าทั้งหมด                       |
| `{{RawBody}}`      | เนื้อหาดิบ (ไม่มีตัวครอบประวัติ/ผู้ส่ง)             |
| `{{BodyStripped}}` | เนื้อหาที่นำการกล่าวถึงกลุ่มออกแล้ว                 |
| `{{From}}`         | ตัวระบุผู้ส่ง                                      |
| `{{To}}`           | ตัวระบุปลายทาง                                    |
| `{{MessageSid}}`   | รหัสข้อความในช่องทาง                               |
| `{{SessionId}}`    | UUID ของเซสชันปัจจุบัน                            |
| `{{IsNewSession}}` | `"true"` เมื่อสร้างเซสชันใหม่                      |
| `{{MediaUrl}}`     | URL จำลองของสื่อขาเข้า                            |
| `{{MediaPath}}`    | พาธสื่อภายในเครื่อง                                |
| `{{MediaType}}`    | ประเภทสื่อ (รูปภาพ/เสียง/เอกสาร/…)                 |
| `{{Transcript}}`   | ทรานสคริปต์เสียง                                   |
| `{{Prompt}}`       | พรอมต์สื่อที่แปลงค่าแล้วสำหรับรายการ CLI             |
| `{{MaxChars}}`     | จำนวนอักขระเอาต์พุตสูงสุดที่แปลงค่าแล้วสำหรับรายการ CLI |
| `{{ChatType}}`     | `"direct"` หรือ `"group"`                           |
| `{{GroupSubject}}` | หัวข้อกลุ่ม (เท่าที่ทำได้)                          |
| `{{GroupMembers}}` | ตัวอย่างสมาชิกกลุ่ม (เท่าที่ทำได้)                  |
| `{{SenderName}}`   | ชื่อที่แสดงของผู้ส่ง (เท่าที่ทำได้)                  |
| `{{SenderE164}}`   | หมายเลขโทรศัพท์ของผู้ส่ง (เท่าที่ทำได้)              |
| `{{Provider}}`     | คำใบ้ผู้ให้บริการ (whatsapp, telegram, discord เป็นต้น) |

---

## การรวมไฟล์การกำหนดค่า (`$include`)

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

**ลักษณะการผสาน:**

- ไฟล์เดียว: แทนที่ออบเจ็กต์ที่ครอบอยู่
- อาร์เรย์ของไฟล์: ผสานแบบลึกตามลำดับ (รายการหลังแทนที่รายการก่อน)
- คีย์ระดับเดียวกัน: ผสานหลังการรวมไฟล์ (แทนที่ค่าที่รวมเข้ามา)
- การรวมไฟล์แบบซ้อน: ลึกได้สูงสุด 10 ระดับ
- พาธ: แปลงค่าโดยอิงกับไฟล์ที่ทำการรวม แต่ต้องอยู่ภายในไดเรกทอรีการกำหนดค่าระดับบนสุด (`dirname` ของ `openclaw.json`) รูปแบบพาธแบบสัมบูรณ์/`../` อนุญาตเฉพาะเมื่อยังแปลงค่าไปอยู่ภายในขอบเขตดังกล่าว ตั้งค่า `OPENCLAW_INCLUDE_ROOTS` (พาธสัมบูรณ์) เพื่ออนุญาตรูทเพิ่มเติมภายนอกไดเรกทอรีการกำหนดค่า
- ขีดจำกัด: พาธต้องไม่มีไบต์ null และต้องสั้นกว่า 4096 อักขระอย่างเคร่งครัดทั้งก่อนและหลังการแปลงค่า แต่ละไฟล์ที่รวมมีขนาดสูงสุด 2 MB
- การเขียนที่ OpenClaw เป็นเจ้าของ ซึ่งเปลี่ยนเฉพาะส่วนระดับบนสุดหนึ่งส่วนที่ใช้การรวมไฟล์เดียว จะเขียนผ่านไปยังไฟล์ที่รวมเข้ามานั้น ตัวอย่างเช่น `plugins install` อัปเดต `plugins: { $include: "./plugins.json5" }` ใน `plugins.json5` และคง `openclaw.json` ไว้เหมือนเดิม
- การรวมที่รูท อาร์เรย์การรวม และการรวมที่มีการแทนที่ด้วยคีย์ระดับเดียวกัน เป็นแบบอ่านอย่างเดียวสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ การเขียนเหล่านั้นจะปฏิเสธอย่างปลอดภัยแทนการทำให้การกำหนดค่าแบนราบ
- ข้อผิดพลาด: ข้อความชัดเจนสำหรับไฟล์ที่หายไป ข้อผิดพลาดในการแยกวิเคราะห์ การรวมแบบวนซ้ำ รูปแบบพาธที่ไม่ถูกต้อง และความยาวที่มากเกินไป

---

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
- [Doctor](/th/gateway/doctor)
