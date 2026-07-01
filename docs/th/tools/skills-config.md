---
read_when:
    - การกำหนดค่าการโหลด การติดตั้ง หรือพฤติกรรมการควบคุมการเข้าถึงของ Skills
    - การตั้งค่าการมองเห็น Skills ต่อเอเจนต์
    - การปรับขีดจำกัดของ Skill Workshop หรือนโยบายการอนุมัติ
sidebarTitle: Skills config
summary: ข้อมูลอ้างอิงฉบับเต็มสำหรับสคีมาการกำหนดค่า skills.* รายการอนุญาตของเอเจนต์ การตั้งค่าเวิร์กช็อป และการจัดการตัวแปรสภาพแวดล้อมของแซนด์บ็อกซ์
title: การกำหนดค่า Skills
x-i18n:
    generated_at: "2026-07-01T08:48:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37251cd12162c3083b8b9e1a84c462233eb44656a84ca915705859a352c9557b
    source_path: tools/skills-config.md
    workflow: 16
---

การกำหนดค่าสกิลส่วนใหญ่อยู่ใต้ `skills` ใน
`~/.openclaw/openclaw.json` การมองเห็นเฉพาะเอเจนต์อยู่ใต้
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
  ร่วมกับเครื่องมือหลัก `image_generate` แทน `skills.entries` รายการสกิล
  ใช้สำหรับเวิร์กโฟลว์สกิลแบบกำหนดเองหรือของบุคคลที่สามเท่านั้น
</Note>

## การโหลด (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  ไดเรกทอรีสกิลเพิ่มเติมที่จะสแกน โดยมีลำดับความสำคัญต่ำสุด (หลังจากสกิลที่รวมมาให้
  และสกิลของ Plugin) พาธจะถูกขยายโดยรองรับ `~`
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  ไดเรกทอรีเป้าหมายจริงที่เชื่อถือได้ซึ่งโฟลเดอร์สกิลแบบ symlink อาจ resolve ไปถึงได้
  แม้ symlink จะอยู่นอกรูทที่กำหนดค่าไว้ ใช้ค่านี้สำหรับเลย์เอาต์ sibling repo
  ที่ตั้งใจไว้ เช่น
  `<workspace>/skills/manager -> ~/Projects/manager/skills` จำกัดรายการนี้ให้แคบ
  อย่าชี้ไปยังรูทกว้าง ๆ อย่าง `~` หรือ `~/Projects`
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  เฝ้าดูโฟลเดอร์สกิลและรีเฟรช snapshot ของสกิลเมื่อไฟล์ `SKILL.md`
  เปลี่ยนแปลง ครอบคลุมไฟล์ซ้อนอยู่ภายใต้รูทสกิลแบบจัดกลุ่ม
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  ช่วง debounce สำหรับเหตุการณ์ watcher ของสกิล หน่วยเป็นมิลลิวินาที
</ParamField>

## การติดตั้ง (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  เลือกใช้ตัวติดตั้ง Homebrew เมื่อมี `brew`
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  ค่ากำหนดตัวจัดการแพ็กเกจ Node สำหรับการติดตั้งสกิล ค่านี้มีผลกับการติดตั้งสกิลเท่านั้น
  รันไทม์ Gateway ยังควรใช้ Node (ไม่แนะนำ Bun
  สำหรับ WhatsApp/Telegram) ใช้ `openclaw setup --node-manager` สำหรับ npm, pnpm,
  หรือ bun; ตั้ง `"yarn"` ด้วยตนเองสำหรับการติดตั้งสกิลที่อิง Yarn
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  อนุญาตให้ไคลเอนต์ Gateway `operator.admin` ที่เชื่อถือได้ติดตั้งไฟล์ zip
  archive ส่วนตัวที่จัดเตรียมผ่าน `skills.upload.*` การติดตั้ง ClawHub ปกติไม่จำเป็นต้องใช้
  การตั้งค่านี้
</ParamField>

## นโยบายการติดตั้งของผู้ปฏิบัติงาน (`security.installPolicy`)

ใช้ `security.installPolicy` เมื่อผู้ปฏิบัติงานต้องการคำสั่งในเครื่องที่เชื่อถือได้เพื่อ
อนุมัติหรือบล็อกการติดตั้งสกิลและ Plugin ด้วยนโยบายเฉพาะโฮสต์ นโยบายจะรันหลังจาก
OpenClaw จัดเตรียมวัสดุต้นทางแล้วและก่อนที่การติดตั้งหรืออัปเดตจะดำเนินต่อ นโยบายนี้ใช้กับสกิล
ClawHub, สกิลที่อัปโหลด, สกิล Git/ในเครื่อง,
ตัวติดตั้ง dependency ของสกิล และแหล่งติดตั้ง/อัปเดตของ Plugin

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
  เปิดใช้นโยบายการติดตั้งที่ผู้ปฏิบัติงานเป็นเจ้าของ เมื่อเปิดใช้โดยไม่มีคำสั่ง `exec`
  ที่ถูกต้อง การติดตั้งจะปิดกั้นโดยค่าเริ่มต้น
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  ตัวกรองเป้าหมายแบบไม่บังคับ เมื่อละไว้ นโยบายจะใช้กับทุกเป้าหมายที่รองรับ
  เพื่อให้การติดตั้งใหม่ไม่เปิดผ่านโดยไม่คาดคิด
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  พาธแบบ absolute ไปยัง executable นโยบายที่เชื่อถือได้ OpenClaw รันโดยไม่ใช้
  shell และตรวจสอบพาธก่อนใช้งาน
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  อาร์กิวเมนต์แบบคงที่ที่ส่งต่อหลัง `command`
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  เวลารันจริงสูงสุดสำหรับการตัดสินใจนโยบายหนึ่งครั้ง
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  เวลาสูงสุดที่ไม่มีเอาต์พุต stdout หรือ stderr ก่อนที่นโยบายจะปิดกั้นโดยค่าเริ่มต้น
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  จำนวนไบต์ stdout และ stderr รวมสูงสุดที่ยอมรับจากโปรเซสนโยบาย
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  ตัวแปรสภาพแวดล้อมแบบ literal ที่ส่งให้โปรเซสนโยบาย
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  ชื่อตัวแปรสภาพแวดล้อมที่คัดลอกจากโปรเซส OpenClaw ไปยังโปรเซส
  นโยบาย ส่งผ่านเฉพาะตัวแปรที่ระบุชื่อไว้เท่านั้น
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  allowlist แบบไม่บังคับของไดเรกทอรีที่อาจมี executable นโยบาย
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  ข้ามการตรวจสอบความเป็นเจ้าของและสิทธิ์ของพาธคำสั่ง ใช้เฉพาะเมื่อพาธ
  ได้รับการปกป้องโดยกลไกอื่น
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  อนุญาตให้พาธคำสั่งที่กำหนดค่าไว้เป็น symlink เป้าหมายที่ resolve แล้วต้อง
  ผ่านการตรวจสอบพาธอื่น ๆ อยู่ดี อาร์กิวเมนต์ของสคริปต์ interpreter ต้องเป็น
  ไฟล์ปกติโดยตรง ไม่ใช่ symlink
</ParamField>

นโยบายจะได้รับออบเจ็กต์ JSON หนึ่งรายการทาง stdin พร้อม `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
`source` แบบมีโครงสร้างที่ไม่บังคับ, `origin` แบบมีโครงสร้าง และ `request` นโยบายต้องเขียน
ออบเจ็กต์ JSON หนึ่งรายการทาง stdout: `{ "protocolVersion": 1, "decision": "allow" }` หรือ
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }` การออกด้วยโค้ดไม่เป็นศูนย์,
timeout, JSON ผิดรูปแบบ, ฟิลด์ขาดหาย หรือเวอร์ชัน protocol ที่ไม่รองรับ
จะปิดกั้นโดยค่าเริ่มต้น

OpenClaw ไม่รันนโยบายการติดตั้งระหว่างการเริ่ม Gateway ปกติ การติดตั้ง
และการอัปเดตจะปิดกั้นโดยค่าเริ่มต้นเมื่อนโยบายเปิดใช้อยู่แต่ไม่พร้อมใช้งาน `openclaw doctor`
ทำการตรวจสอบแบบ static และ `openclaw doctor --deep` รัน probe การติดตั้งสังเคราะห์
กับคำสั่งที่กำหนดค่าไว้

การอัปเดตจำนวนมากใช้นโยบายแยกตามเป้าหมาย: การอัปเดตสกิลหรือ Plugin ที่ถูกบล็อกจะล้มเหลว
เฉพาะเป้าหมายนั้น โดยไม่ปิดใช้นโยบายหรือข้ามเป้าหมายถัดไปในชุด

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

## allowlist ของสกิลที่รวมมาให้

<ParamField path="skills.allowBundled" type="string[]">
  allowlist แบบไม่บังคับสำหรับสกิลที่ **รวมมาให้** เท่านั้น เมื่อตั้งค่าแล้ว เฉพาะสกิลที่รวมมาให้
  ในรายการเท่านั้นที่มีสิทธิ์ใช้งาน สกิลที่จัดการแล้ว ระดับเอเจนต์ และ workspace
  จะไม่ได้รับผลกระทบ
</ParamField>

## รายการต่อสกิล (`skills.entries`)

คีย์ใต้ `entries` จะตรงกับ `name` ของสกิลโดยค่าเริ่มต้น หากสกิลกำหนด
`metadata.openclaw.skillKey` ให้ใช้คีย์นั้นแทน ใส่ชื่อที่มี hyphen ในเครื่องหมายคำพูด
(JSON5 อนุญาตคีย์ที่ใส่เครื่องหมายคำพูด)

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` ปิดใช้งานสกิลแม้จะรวมมาให้หรือติดตั้งแล้ว สกิลที่รวมมาให้ `coding-agent`
  เป็นแบบ opt-in ให้ตั้งเป็น `true` และตรวจสอบให้แน่ใจว่า `claude`,
  `codex`, `opencode` หรือ CLI อื่นที่รองรับถูกติดตั้งและยืนยันตัวตนแล้ว
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  ฟิลด์อำนวยความสะดวกสำหรับสกิลที่ประกาศ `metadata.openclaw.primaryEnv`
  รองรับสตริง plaintext หรือ SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  ตัวแปรสภาพแวดล้อมที่ฉีดเข้าไปสำหรับการรันเอเจนต์ ฉีดเข้าไปเฉพาะเมื่อ
  ตัวแปรนั้นยังไม่ได้ตั้งอยู่ในโปรเซส
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  ถุงข้อมูลแบบไม่บังคับสำหรับฟิลด์การกำหนดค่าต่อสกิลแบบกำหนดเอง
</ParamField>

## allowlist ของเอเจนต์ (`agents`)

ใช้การกำหนดค่าเอเจนต์เมื่อคุณต้องการใช้รูทสกิลของเครื่อง/workspace เดียวกัน แต่มี
ชุดสกิลที่มองเห็นได้ต่างกันต่อเอเจนต์

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
  allowlist baseline ที่ใช้ร่วมกันซึ่งเอเจนต์ที่ละ `agents.list[].skills` จะสืบทอด
  ละไว้ทั้งหมดเพื่อให้สกิลไม่ถูกจำกัดโดยค่าเริ่มต้น
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  ชุดสกิลสุดท้ายแบบชัดเจนสำหรับเอเจนต์นั้น รายการแบบชัดเจนจะ **แทนที่** ค่าเริ่มต้นที่สืบทอดมา
  ไม่ได้ merge กัน ตั้งเป็น `[]` เพื่อไม่เปิดเผยสกิลใด ๆ สำหรับเอเจนต์นั้น
</ParamField>

<Warning>
  allowlist สกิลของเอเจนต์เป็นตัวกรองการมองเห็นและการโหลดสำหรับการค้นพบสกิลของ OpenClaw,
  prompt, การค้นพบ slash-command, การซิงก์ sandbox และ snapshot
  ของสกิล ไม่ใช่ขอบเขตการอนุญาตในเวลา shell หากเอเจนต์สามารถ
  รัน `exec` ของโฮสต์ได้ shell นั้นยังสามารถรันไคลเอนต์ภายนอกหรืออ่านไฟล์โฮสต์
  ที่ผู้ใช้ในการดำเนินการมองเห็นได้ รวมถึง registry ของไคลเอนต์ MCP เช่น
  `~/.openclaw/skills/config/mcporter.json` สำหรับการแยก MCP ต่อเอเจนต์
  ให้รวม allowlist สกิลกับการแยก sandbox/ผู้ใช้ OS, ปฏิเสธหรือ
  จำกัด allowlist ของ exec โฮสต์อย่างเข้มงวด และเลือกใช้ข้อมูลประจำตัวต่อเอเจนต์ที่เซิร์ฟเวอร์ MCP
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  เมื่อเป็น `true` เอเจนต์สามารถสร้างข้อเสนอที่รอดำเนินการจากสัญญาณการสนทนา
  ที่คงทนหลังจากเทิร์นสำเร็จ การสร้างสกิลที่ผู้ใช้ prompt จะผ่าน
  Skill Workshop เสมอไม่ว่าการตั้งค่านี้จะเป็นอย่างไร
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` ต้องได้รับการอนุมัติจากผู้ปฏิบัติงานก่อนการใช้ การปฏิเสธ หรือ
  การกักกันที่เอเจนต์เริ่มต้น `auto` อนุญาตให้ดำเนินการเหล่านั้นได้โดยไม่ต้องอนุมัติ
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  อนุญาตให้การใช้ Skill Workshop เขียนผ่าน symlink ของ Skills ใน workspace ที่
  เป้าหมายจริงได้รับความเชื่อถือแล้วโดย `skills.load.allowSymlinkTargets` ปิดค่านี้ไว้
  เว้นแต่ว่าการใช้ข้อเสนอที่สร้างขึ้นควรแก้ไขรูท Skills ที่ใช้ร่วมกันนั้น
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  จำนวนข้อเสนอที่รอดำเนินการและถูกกักกันสูงสุดที่เก็บไว้ต่อ workspace
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  ขนาดเนื้อหาข้อเสนอสูงสุดเป็นไบต์ คำอธิบายข้อเสนอถูกจำกัดแบบเข้มงวดไว้ที่
  160 ไบต์ เพราะคำอธิบายจะแสดงในผลลัพธ์การค้นพบและการแสดงรายการ
</ParamField>

## รูท Skills ที่เป็น symlink

ตามค่าเริ่มต้น รูท Skills ของ workspace, project-agent, extra-dir และแบบที่มาพร้อมแพ็กเกจ
เป็นขอบเขตการกักกัน โฟลเดอร์ Skills ที่เป็น symlink ใต้ `<workspace>/skills`
ซึ่ง resolve ออกไปนอก root จะถูกข้ามพร้อมข้อความ log

หากต้องการอนุญาตเลย์เอาต์ symlink โดยตั้งใจ ให้ประกาศเป้าหมายที่เชื่อถือได้:

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

ด้วย config นี้ `<workspace>/skills/manager -> ~/Projects/manager/skills` จะถูก
ยอมรับหลังจาก realpath resolution `extraDirs` จะสแกน repo ข้างเคียงโดยตรง;
`allowSymlinkTargets` จะคง path ที่เป็น symlink ไว้สำหรับเลย์เอาต์ที่มีอยู่

โดยค่าเริ่มต้น การใช้ Skill Workshop จะไม่เขียนผ่าน symlink เหล่านั้น หากต้องการให้
Workshop apply แก้ไข Skills ใต้เป้าหมาย symlink ที่เชื่อถือแล้ว ให้เลือกใช้
แยกต่างหาก:

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

ไดเรกทอรี `~/.openclaw/skills` ที่จัดการอยู่และ `~/.agents/skills` ส่วนบุคคล
ยอมรับ symlink ของไดเรกทอรี Skills อยู่แล้ว (การกักกัน `SKILL.md` ต่อ Skill
ยังคงมีผล)

## Skills ใน sandbox และ env vars

<Warning>
  `skills.entries.<skill>.env` และ `apiKey` มีผลกับการรันบน **host** เท่านั้น ภายใน
  sandbox ค่าเหล่านี้ไม่มีผล — Skill ที่ขึ้นกับ `GEMINI_API_KEY` จะ
  ล้มเหลวด้วย `apiKey not configured` เว้นแต่ sandbox จะได้รับตัวแปรนั้น
  แยกต่างหาก
</Warning>

ส่ง secret เข้า Docker sandbox ด้วย:

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
  ผู้ใช้ที่มีสิทธิ์เข้าถึง Docker daemon สามารถตรวจสอบค่า `sandbox.docker.env`
  ผ่าน metadata ของ Docker ได้ ใช้ไฟล์ secret ที่ mount เข้ามา, image แบบกำหนดเอง หรือ
  ช่องทางส่งมอบอื่นเมื่อการเปิดเผยลักษณะนั้นยอมรับไม่ได้
</Note>

## คำเตือนเรื่องลำดับการโหลด

```text
workspace/skills      (highest)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
bundled skills
skills.load.extraDirs (lowest)
```

การเปลี่ยนแปลง Skills และ config จะมีผลในเซสชันใหม่ถัดไปเมื่อเปิดใช้
watcher หรือในเทิร์นเอเจนต์ถัดไปเมื่อ watcher ตรวจพบการเปลี่ยนแปลง

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ข้อมูลอ้างอิง Skills" href="/th/tools/skills" icon="puzzle-piece">
    Skills คืออะไร ลำดับการโหลด การควบคุมสิทธิ์ และรูปแบบ SKILL.md
  </Card>
  <Card title="การสร้าง Skills" href="/th/tools/creating-skills" icon="hammer">
    การเขียน Skills แบบกำหนดเองสำหรับ workspace
  </Card>
  <Card title="Skill Workshop" href="/th/tools/skill-workshop" icon="flask">
    คิวข้อเสนอสำหรับ Skills ที่เอเจนต์ร่างขึ้น
  </Card>
  <Card title="คำสั่ง slash" href="/th/tools/slash-commands" icon="terminal">
    แคตตาล็อกคำสั่ง slash แบบเนทีฟและ directive สำหรับแชต
  </Card>
</CardGroup>
