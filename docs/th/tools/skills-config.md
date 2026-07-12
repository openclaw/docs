---
read_when:
    - การกำหนดค่าพฤติกรรมการโหลด การติดตั้ง หรือการควบคุมการเข้าถึง Skills
    - การตั้งค่าการมองเห็น Skills แยกตามเอเจนต์
    - การปรับขีดจำกัดหรือนโยบายการอนุมัติของเวิร์กช็อป Skills
sidebarTitle: Skills config
summary: ข้อมูลอ้างอิงฉบับเต็มสำหรับสคีมาการกำหนดค่า skills.* รายการอนุญาตของเอเจนต์ การตั้งค่าเวิร์กช็อป และการจัดการตัวแปรสภาพแวดล้อมของแซนด์บ็อกซ์
title: การกำหนดค่า Skills
x-i18n:
    generated_at: "2026-07-12T16:53:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ed1ec20aa102b458a9485a1ada1bb7566c97d28b1f43caa28f52b3f5bdc381e
    source_path: tools/skills-config.md
    workflow: 16
---

การกำหนดค่า Skills ส่วนใหญ่อยู่ภายใต้ `skills` ใน
`~/.openclaw/openclaw.json` ส่วนการมองเห็นเฉพาะเอเจนต์อยู่ภายใต้
`agents.defaults.skills` และ `agents.list[].skills`

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm",
      allowUploadedArchives: false,
    },
    workshop: {
      autonomous: { enabled: false },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<Note>
  สำหรับการสร้างภาพในตัว ให้ใช้ `agents.defaults.imageGenerationModel`
  ร่วมกับเครื่องมือหลัก `image_generate` แทน `skills.entries` รายการ Skill
  มีไว้สำหรับเวิร์กโฟลว์ Skill แบบกำหนดเองหรือจากบุคคลที่สามเท่านั้น
</Note>

## การโหลด (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  ไดเรกทอรี Skill เพิ่มเติมที่จะสแกน โดยมีลำดับความสำคัญต่ำสุด (ต่ำกว่า
  Skill ที่รวมมาให้และ Skill ของ Plugin) พาธรองรับการขยาย `~`
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  ไดเรกทอรีเป้าหมายจริงที่เชื่อถือได้ซึ่งโฟลเดอร์ Skill แบบ symlink
  สามารถชี้เข้าไปได้ แม้ symlink จะอยู่นอกรากที่กำหนดค่าไว้ ใช้ตัวเลือกนี้
  สำหรับโครงสร้างรีโพซิทอรีข้างเคียงที่ตั้งใจไว้ เช่น
  `<workspace>/skills/manager -> ~/Projects/manager/skills` จำกัดรายการนี้
  ให้แคบ — อย่าชี้ไปยังรากกว้าง ๆ เช่น `~` หรือ `~/Projects`
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  เฝ้าดูโฟลเดอร์ Skill และรีเฟรชสแนปช็อต Skills เมื่อไฟล์ `SKILL.md`
  เปลี่ยนแปลง ครอบคลุมไฟล์ซ้อนภายใต้ราก Skill ที่จัดกลุ่มไว้
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  ช่วงหน่วง debounce สำหรับเหตุการณ์จากตัวเฝ้าดู Skill หน่วยเป็นมิลลิวินาที
</ParamField>

## การติดตั้ง (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  เลือกใช้ตัวติดตั้ง Homebrew ก่อนเมื่อมี `brew`
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  ตัวจัดการแพ็กเกจ Node ที่ต้องการสำหรับการติดตั้ง Skill ค่านี้มีผลเฉพาะ
  การติดตั้ง Skill — รันไทม์ Gateway ควรใช้ Node ต่อไป (ไม่แนะนำ Bun
  สำหรับ WhatsApp/Telegram) `openclaw setup --node-manager` และ
  `openclaw onboard --node-manager` รองรับ `npm`, `pnpm` หรือ `bun`;
  ตั้งค่า `"yarn"` โดยตรงในการกำหนดค่าสำหรับการติดตั้ง Skill ที่ใช้ Yarn
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  อนุญาตให้ไคลเอนต์ Gateway `operator.admin` ที่เชื่อถือได้ติดตั้งไฟล์เก็บถาวร
  zip ส่วนตัวที่จัดเตรียมผ่าน `skills.upload.*` การติดตั้ง ClawHub ปกติ
  ไม่จำเป็นต้องใช้การตั้งค่านี้
</ParamField>

## นโยบายการติดตั้งของผู้ดำเนินการ (`security.installPolicy`)

ใช้ `security.installPolicy` เมื่อผู้ดำเนินการต้องการคำสั่งภายในเครื่องที่เชื่อถือได้
เพื่ออนุมัติหรือบล็อกการติดตั้ง Skill และ Plugin ตามนโยบายเฉพาะโฮสต์
นโยบายจะทำงานหลังจาก OpenClaw จัดเตรียมซอร์สแล้ว และก่อนที่การติดตั้ง
หรืออัปเดตจะดำเนินต่อ นโยบายนี้ใช้กับ Skills จาก ClawHub, Skills ที่อัปโหลด,
Skills จาก Git/ภายในเครื่อง, ตัวติดตั้งการขึ้นต่อกันของ Skill และแหล่งที่มา
สำหรับการติดตั้ง/อัปเดต Plugin

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Omit targets to cover every supported target.
      targets: ["skill", "plugin"],
      exec: {
        source: "exec",
        command: "/usr/local/bin/openclaw-install-policy",
        args: ["--json"],
        timeoutMs: 10000,
        noOutputTimeoutMs: 10000,
        maxOutputBytes: 1048576,
        passEnv: ["OPENCLAW_STATE_DIR", "PATH"],
        env: { POLICY_MODE: "strict" },
        trustedDirs: ["/usr/local/bin"],
      },
    },
  },
}
```

<ParamField path="security.installPolicy.enabled" type="boolean" default="false">
  เปิดใช้นโยบายการติดตั้งที่ผู้ดำเนินการเป็นเจ้าของ เมื่อเปิดใช้โดยไม่มีคำสั่ง
  `exec` ที่ถูกต้อง การติดตั้งจะล้มเหลวแบบปิดกั้น
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  ตัวกรองเป้าหมายแบบไม่บังคับ เมื่อละไว้ นโยบายจะใช้กับทุกเป้าหมายที่รองรับ
  เพื่อให้การติดตั้งใหม่ไม่เปิดอนุญาตโดยไม่คาดคิด
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  พาธสัมบูรณ์ไปยังไฟล์ปฏิบัติการนโยบายที่เชื่อถือได้ OpenClaw เรียกใช้ไฟล์นี้
  โดยไม่ผ่านเชลล์และตรวจสอบพาธก่อนใช้งาน
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  อาร์กิวเมนต์คงที่ที่ส่งต่อหลัง `command`
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  ระยะเวลาตามนาฬิกาสูงสุดสำหรับการตัดสินใจตามนโยบายหนึ่งครั้ง
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  ระยะเวลาสูงสุดที่ไม่มีเอาต์พุต stdout หรือ stderr ก่อนที่นโยบายจะล้มเหลว
  แบบปิดกั้น
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  จำนวนไบต์รวมสูงสุดของ stdout และ stderr ที่ยอมรับจากกระบวนการนโยบาย
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  ตัวแปรสภาพแวดล้อมแบบค่าตรงที่ส่งให้กระบวนการนโยบาย
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  ชื่อตัวแปรสภาพแวดล้อมที่คัดลอกจากกระบวนการ OpenClaw ไปยังกระบวนการ
  นโยบาย โดยจะส่งเฉพาะตัวแปรที่ระบุชื่อไว้เท่านั้น
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  รายการอนุญาตแบบไม่บังคับของไดเรกทอรีที่สามารถมีไฟล์ปฏิบัติการนโยบายได้
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  ข้ามการตรวจสอบความเป็นเจ้าของและสิทธิ์ของพาธคำสั่ง ใช้เฉพาะเมื่อพาธ
  ได้รับการปกป้องด้วยกลไกอื่น
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  อนุญาตให้พาธคำสั่งที่กำหนดค่าเป็น symlink ได้ เป้าหมายที่แก้พาธแล้ว
  ยังคงต้องผ่านการตรวจสอบพาธอื่น ๆ อาร์กิวเมนต์สคริปต์สำหรับอินเทอร์พรีเตอร์
  ต้องเป็นไฟล์ปกติโดยตรง ไม่ใช่ symlink
</ParamField>

นโยบายจะได้รับออบเจ็กต์ JSON หนึ่งรายการทาง stdin ซึ่งมี `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
`source` แบบมีโครงสร้างซึ่งเป็นทางเลือก, `origin` แบบมีโครงสร้าง และ `request`
นโยบายต้องเขียนออบเจ็กต์ JSON หนึ่งรายการไปยัง stdout:
`{ "protocolVersion": 1, "decision": "allow" }`
หรือ `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`
การออกด้วยรหัสที่ไม่ใช่ศูนย์, หมดเวลา, JSON ผิดรูปแบบ, ฟิลด์ขาดหาย
หรือเวอร์ชันโปรโตคอลที่ไม่รองรับ จะล้มเหลวแบบปิดกั้น

OpenClaw ไม่เรียกใช้นโยบายการติดตั้งระหว่างการเริ่มต้น Gateway ตามปกติ
การติดตั้งและอัปเดตจะล้มเหลวแบบปิดกั้นเมื่อนโยบายเปิดใช้อยู่แต่ไม่พร้อมใช้งาน
`openclaw doctor` ทำการตรวจสอบแบบสถิต ส่วน `openclaw doctor --deep`
เรียกใช้โพรบการติดตั้งจำลองกับคำสั่งที่กำหนดค่าไว้

การอัปเดตแบบกลุ่มจะใช้นโยบายแยกตามแต่ละเป้าหมาย: การอัปเดต Skill หรือ Plugin
ที่ถูกบล็อกจะทำให้เฉพาะเป้าหมายนั้นล้มเหลว โดยไม่ปิดใช้นโยบายหรือข้ามเป้าหมาย
ถัดไปในชุด

ตัวอย่าง stdin:

```json
{
  "protocolVersion": 1,
  "openclawVersion": "2026.6.1",
  "targetType": "skill",
  "targetName": "weather",
  "sourcePath": "/var/folders/.../openclaw-skill-clawhub/root",
  "sourcePathKind": "directory",
  "source": {
    "kind": "clawhub",
    "authority": "openclaw",
    "mutable": false,
    "network": true
  },
  "origin": {
    "type": "clawhub",
    "registry": "https://clawhub.openclaw.ai",
    "slug": "weather",
    "version": "1.0.0"
  },
  "request": {
    "kind": "skill-install",
    "mode": "install",
    "requestedSpecifier": "clawhub:weather@1.0.0"
  },
  "skill": {
    "installId": "clawhub"
  }
}
```

คำสั่งนโยบายขั้นต่ำ:

```js
#!/usr/bin/env node

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  const request = JSON.parse(input);
  if (request.targetType === "plugin" && request.source?.kind === "local-path") {
    process.stdout.write(
      JSON.stringify({
        protocolVersion: 1,
        decision: "block",
        reason: "local plugin paths are not approved on this host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## รายการอนุญาตของ Skill ที่รวมมาให้

<ParamField path="skills.allowBundled" type="string[]">
  รายการอนุญาตแบบไม่บังคับสำหรับ Skills ที่ **รวมมาให้** เท่านั้น เมื่อตั้งค่า
  เฉพาะ Skills ที่รวมมาให้และอยู่ในรายการเท่านั้นที่มีสิทธิ์ใช้งาน Skills
  ที่มีการจัดการ, ระดับเอเจนต์ และระดับพื้นที่ทำงานจะไม่ได้รับผลกระทบ
</ParamField>

## รายการต่อ Skill (`skills.entries`)

โดยค่าเริ่มต้น คีย์ภายใต้ `entries` จะตรงกับ `name` ของ Skill หาก Skill
กำหนด `metadata.openclaw.skillKey` ให้ใช้คีย์นั้นแทน ใส่ชื่อที่มีเครื่องหมายขีดกลาง
ไว้ในเครื่องหมายอัญประกาศ (JSON5 อนุญาตคีย์ที่ใส่เครื่องหมายอัญประกาศ)

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` ปิดใช้งาน Skill แม้จะรวมมาให้หรือติดตั้งแล้วก็ตาม Skill ที่รวมมาให้
  `coding-agent` ต้องเลือกเปิดใช้ — ตั้งค่าเป็น `true` และตรวจสอบให้แน่ใจว่า
  มีการติดตั้งและยืนยันตัวตน `claude`, `codex`, `opencode` หรือ CLI อื่นที่รองรับ
  อย่างใดอย่างหนึ่งแล้ว
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  ฟิลด์อำนวยความสะดวกสำหรับ Skills ที่ประกาศ `metadata.openclaw.primaryEnv`
  รองรับสตริงข้อความธรรมดาหรือ SecretRef:
  `{ source: "env", provider: "default", id: "VAR_NAME" }`
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  ตัวแปรสภาพแวดล้อมที่แทรกให้การทำงานของเอเจนต์ โดยจะแทรกเฉพาะเมื่อตัวแปร
  ยังไม่ได้ตั้งค่าไว้ในกระบวนการ
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  ชุดข้อมูลแบบไม่บังคับสำหรับฟิลด์การกำหนดค่าต่อ Skill แบบกำหนดเอง
</ParamField>

## รายการอนุญาตของเอเจนต์ (`agents`)

ใช้การกำหนดค่าเอเจนต์เมื่อคุณต้องการใช้ราก Skill ของเครื่อง/พื้นที่ทำงานเดียวกัน
แต่ให้แต่ละเอเจนต์มองเห็นชุด Skill ที่แตกต่างกัน

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  รายการอนุญาตพื้นฐานร่วมที่เอเจนต์ซึ่งละ `agents.list[].skills` จะสืบทอด
  ละไว้ทั้งหมดเพื่อไม่จำกัด Skills โดยค่าเริ่มต้น
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  ชุด Skill สุดท้ายที่ระบุชัดเจนสำหรับเอเจนต์นั้น รายการที่ระบุชัดเจนจะ
  **แทนที่** ค่าเริ่มต้นที่สืบทอดมา — จะไม่ผสานกัน ตั้งค่าเป็น `[]`
  เพื่อไม่เปิดเผย Skills ใด ๆ แก่เอเจนต์นั้น
</ParamField>

<Warning>
  รายการอนุญาต Skill ของเอเจนต์เป็นตัวกรองการมองเห็นและการโหลดสำหรับ
  การค้นหา Skill, พรอมต์, การค้นหาคำสั่งแบบเครื่องหมายทับ, การซิงค์แซนด์บ็อกซ์
  และสแนปช็อต Skill ของ OpenClaw รายการเหล่านี้ไม่ใช่ขอบเขตการอนุญาต
  ขณะทำงานของเชลล์ หากเอเจนต์สามารถเรียกใช้ `exec` บนโฮสต์ เชลล์นั้น
  ยังสามารถเรียกใช้ไคลเอนต์ภายนอกหรืออ่านไฟล์บนโฮสต์ที่ผู้ใช้ซึ่งดำเนินการ
  มองเห็นได้ รวมถึงรีจิสทรีไคลเอนต์ MCP เช่น
  `~/.openclaw/skills/config/mcporter.json` สำหรับการแยก MCP ต่อเอเจนต์
  ให้ใช้รายการอนุญาต Skill ร่วมกับการแยกด้วยแซนด์บ็อกซ์/ผู้ใช้ระบบปฏิบัติการ
  ปฏิเสธหรือจำกัด `exec` บนโฮสต์ด้วยรายการอนุญาตอย่างเข้มงวด และเลือกใช้
  ข้อมูลประจำตัวแยกต่อเอเจนต์ที่เซิร์ฟเวอร์ MCP
</Warning>

## เวิร์กช็อป (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  เมื่อเป็น `true` เอเจนต์สามารถสร้างข้อเสนอที่รอดำเนินการจากสัญญาณการสนทนา
  แบบถาวรหลังจากดำเนินงานแต่ละรอบสำเร็จ การสร้าง Skills ตามคำสั่งของผู้ใช้จะ
  ดำเนินการผ่าน Skill Workshop เสมอโดยไม่ขึ้นกับการตั้งค่านี้
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` กำหนดให้ผู้ดำเนินการต้องอนุมัติก่อนการนำไปใช้ ปฏิเสธ
  หรือกักกันที่เอเจนต์เป็นผู้เริ่มต้น `auto` อนุญาตการดำเนินการเหล่านั้นโดยไม่ต้องได้รับอนุมัติ
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  อนุญาตให้การนำไปใช้โดย Skill Workshop เขียนผ่าน symlink ของ Skills ในพื้นที่ทำงาน
  ซึ่งเป้าหมายจริงได้รับความเชื่อถือจาก `skills.load.allowSymlinkTargets` อยู่แล้ว
  คงการตั้งค่านี้เป็นปิด เว้นแต่การนำข้อเสนอที่สร้างขึ้นไปใช้ควรแก้ไขราก Skills
  ที่ใช้ร่วมกันนั้น
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  จำนวนสูงสุดของข้อเสนอที่รอดำเนินการและถูกกักกันซึ่งเก็บไว้ต่อพื้นที่ทำงาน
  (ช่วงที่อนุญาต: 1-200)
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  ขนาดสูงสุดของเนื้อหาข้อเสนอเป็นไบต์ (ช่วงที่อนุญาต: 1024-200000) คำอธิบาย
  ข้อเสนอถูกจำกัดแยกต่างหากไม่เกิน 160 ไบต์ เนื่องจากจะแสดงในผลลัพธ์
  การค้นพบและการแสดงรายการ
</ParamField>

ดู [Skill Workshop](/th/tools/skill-workshop) สำหรับวงจรชีวิตของข้อเสนอ คำสั่ง CLI
พารามิเตอร์เครื่องมือของเอเจนต์ และเมธอด Gateway ที่การกำหนดค่านี้ควบคุม

## ราก Skills ที่เชื่อมด้วย symlink

ตามค่าเริ่มต้น ราก Skills ของพื้นที่ทำงาน เอเจนต์โครงการ ไดเรกทอรีเพิ่มเติม
และ Skills ที่รวมมาให้จะเป็นขอบเขตการจำกัด โฟลเดอร์ Skills ที่เป็น symlink
ภายใต้ `<workspace>/skills` ซึ่งชี้ออกไปนอกรากจะถูกข้ามพร้อมข้อความในบันทึก

หากต้องการอนุญาตโครงสร้าง symlink โดยเจตนา ให้ประกาศเป้าหมายที่เชื่อถือได้:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

เมื่อใช้การกำหนดค่านี้ `<workspace>/skills/manager -> ~/Projects/manager/skills`
จะได้รับการยอมรับหลังจากแก้ไขเป็นพาธจริงแล้ว `extraDirs` จะสแกนรีโพซิทอรีข้างเคียง
โดยตรง ส่วน `allowSymlinkTargets` จะคงพาธที่เชื่อมด้วย symlink ไว้สำหรับ
โครงสร้างที่มีอยู่

ตามค่าเริ่มต้น การนำไปใช้โดย Skill Workshop จะไม่เขียนผ่าน symlink เหล่านั้น
หากต้องการให้การนำไปใช้โดย Workshop แก้ไข Skills ภายใต้เป้าหมาย symlink
ที่เชื่อถืออยู่แล้ว ให้เปิดใช้แยกต่างหาก:

```json5
{
  skills: {
    load: {
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    workshop: {
      allowSymlinkTargetWrites: true,
    },
  },
}
```

ไดเรกทอรี `~/.openclaw/skills` ที่มีการจัดการและไดเรกทอรีส่วนบุคคล
`~/.agents/skills` ยอมรับ symlink ของไดเรกทอรี Skills โดยไม่มีเงื่อนไขอยู่แล้ว
(การจำกัดขอบเขตของ `SKILL.md` ต่อ Skills ยังคงมีผล) — จำเป็นต้องใช้
`allowSymlinkTargets` เฉพาะกับรากของพื้นที่ทำงาน ไดเรกทอรีเพิ่มเติม และเอเจนต์โครงการ
(`<workspace>/.agents/skills`) เท่านั้น

## Skills ในแซนด์บ็อกซ์และตัวแปรสภาพแวดล้อม

<Warning>
  `skills.entries.<skill>.env` และ `apiKey` มีผลเฉพาะกับการทำงานบน **โฮสต์**
  เท่านั้น ภายในแซนด์บ็อกซ์จะไม่มีผล — Skills ที่ต้องใช้
  `GEMINI_API_KEY` จะล้มเหลวด้วยข้อผิดพลาด `apiKey not configured` เว้นแต่
  จะส่งตัวแปรดังกล่าวให้แซนด์บ็อกซ์แยกต่างหาก
</Warning>

ส่งข้อมูลลับเข้าแซนด์บ็อกซ์ Docker ด้วย:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          env: { GEMINI_API_KEY: "your-key-here" },
        },
      },
    },
  },
}
```

<Note>
  ผู้ใช้ที่มีสิทธิ์เข้าถึงดีมอน Docker สามารถตรวจสอบค่า `sandbox.docker.env`
  ผ่านข้อมูลเมตาของ Docker ได้ ใช้ไฟล์ข้อมูลลับที่เมานต์ อิมเมจแบบกำหนดเอง
  หรือช่องทางส่งมอบอื่นเมื่อไม่สามารถยอมรับการเปิดเผยดังกล่าวได้
</Note>

## การเตือนเรื่องลำดับการโหลด

```text
workspace/skills      (สูงสุด)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
Skills ที่รวมมาให้
skills.load.extraDirs (ต่ำสุด)
```

การเปลี่ยนแปลง Skills และการกำหนดค่าจะมีผลในเซสชันใหม่ครั้งถัดไปเมื่อเปิดใช้
ตัวเฝ้าดู หรือในรอบการทำงานถัดไปของเอเจนต์เมื่อตัวเฝ้าดูตรวจพบการเปลี่ยนแปลง

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ข้อมูลอ้างอิง Skills" href="/th/tools/skills" icon="puzzle-piece">
    ความหมายของ Skills ลำดับการโหลด การควบคุมสิทธิ์ และรูปแบบ SKILL.md
  </Card>
  <Card title="การสร้าง Skills" href="/th/tools/creating-skills" icon="hammer">
    การเขียน Skills แบบกำหนดเองสำหรับพื้นที่ทำงาน
  </Card>
  <Card title="Skill Workshop" href="/th/tools/skill-workshop" icon="flask">
    คิวข้อเสนอสำหรับ Skills ที่เอเจนต์ร่างขึ้น
  </Card>
  <Card title="คำสั่งเครื่องหมายทับ" href="/th/tools/slash-commands" icon="terminal">
    แค็ตตาล็อกคำสั่งเครื่องหมายทับแบบเนทีฟและคำสั่งกำกับการแชต
  </Card>
</CardGroup>
