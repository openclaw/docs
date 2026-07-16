---
read_when:
    - การกำหนดค่าการโหลด การติดตั้ง หรือการควบคุมการเปิดใช้งาน Skills
    - การตั้งค่าการมองเห็น Skills สำหรับแต่ละเอเจนต์
    - การปรับขีดจำกัดหรือนโยบายการอนุมัติของเวิร์กช็อป Skills
sidebarTitle: Skills config
summary: เอกสารอ้างอิงฉบับสมบูรณ์สำหรับสคีมาการกำหนดค่า skills.* รายการอนุญาตของเอเจนต์ การตั้งค่าเวิร์กช็อป และการจัดการตัวแปรสภาพแวดล้อมของแซนด์บ็อกซ์
title: การกำหนดค่า Skills
x-i18n:
    generated_at: "2026-07-16T19:47:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1633364a7333ba00f5f6c8d6f1f478b65e63bc97de23705e492eb980967ec521
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
      approvalPolicy: "auto",
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
  สำหรับการสร้างรูปภาพในตัว ให้ใช้ `agents.defaults.imageGenerationModel`
  ร่วมกับเครื่องมือหลัก `image_generate` แทน `skills.entries` รายการ Skill
  มีไว้สำหรับเวิร์กโฟลว์ Skill แบบกำหนดเองหรือของบุคคลที่สามเท่านั้น
</Note>

## การโหลด (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  ไดเรกทอรี Skill เพิ่มเติมที่จะสแกน โดยมีลำดับความสำคัญต่ำที่สุด (ต่ำกว่า
  Skills ที่มาพร้อมระบบและของ Plugin) พาธจะถูกขยายโดยรองรับ `~`
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  ไดเรกทอรีเป้าหมายจริงที่เชื่อถือได้ ซึ่งโฟลเดอร์ Skill ที่เป็น symlink สามารถชี้
  เข้าไปได้ แม้ symlink จะอยู่นอกรากที่กำหนดค่าไว้ ใช้สำหรับ
  โครงสร้างรีโพซิทอรีพี่น้องที่ตั้งใจไว้ เช่น
  `<workspace>/skills/manager -> ~/Projects/manager/skills` ควรกำหนดรายการนี้ให้แคบ
  อย่าชี้ไปยังรากที่กว้าง เช่น `~` หรือ `~/Projects`
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  เฝ้าดูโฟลเดอร์ Skill และรีเฟรชสแนปช็อตของ Skills เมื่อไฟล์ `SKILL.md`
  มีการเปลี่ยนแปลง ครอบคลุมไฟล์ที่ซ้อนอยู่ภายใต้ราก Skill แบบจัดกลุ่ม
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  ช่วง debounce สำหรับเหตุการณ์จากตัวเฝ้าดู Skill หน่วยเป็นมิลลิวินาที
</ParamField>

## การติดตั้ง (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  เลือกใช้ตัวติดตั้ง Homebrew ก่อนเมื่อมี `brew`
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  การตั้งค่าตัวจัดการแพ็กเกจ Node ที่ต้องการสำหรับการติดตั้ง Skill การตั้งค่านี้มีผล
  เฉพาะกับการติดตั้ง Skill เท่านั้น โดย OpenClaw CLI และรันไทม์ Gateway ต้องใช้ Node เพราะ
  ที่เก็บสถานะมาตรฐานใช้ `node:sqlite` ส่วน `openclaw setup --node-manager` และ
  `openclaw onboard --node-manager` รองรับ `npm`, `pnpm` หรือ `bun`; ให้กำหนด
  `"yarn"` โดยตรงในการกำหนดค่าสำหรับการติดตั้ง Skill ที่ใช้ Yarn
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  อนุญาตให้ไคลเอนต์ Gateway `operator.admin` ที่เชื่อถือได้ติดตั้งไฟล์บีบอัด zip
  ส่วนตัวที่จัดเตรียมผ่าน `skills.upload.*` การติดตั้ง ClawHub ตามปกติไม่จำเป็นต้องใช้
  การตั้งค่านี้
</ParamField>

## นโยบายการติดตั้งของผู้ดำเนินการ (`security.installPolicy`)

ใช้ `security.installPolicy` เมื่อผู้ดำเนินการต้องการคำสั่งภายในเครื่องที่เชื่อถือได้เพื่อ
อนุมัติหรือบล็อกการติดตั้ง Skill และ Plugin ด้วยนโยบายเฉพาะโฮสต์
นโยบายจะทำงานหลังจาก OpenClaw จัดเตรียมเนื้อหาต้นฉบับแล้ว และก่อนดำเนินการ
ติดตั้งหรืออัปเดตต่อ โดยมีผลกับ Skills จาก ClawHub, Skills ที่อัปโหลด, Skills จาก Git/ภายในเครื่อง,
ตัวติดตั้งการขึ้นต่อกันของ Skill และแหล่งที่มาสำหรับติดตั้ง/อัปเดต Plugin

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // ไม่ระบุ targets เพื่อให้ครอบคลุมทุกเป้าหมายที่รองรับ
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
  `exec` ที่ถูกต้อง การติดตั้งจะปิดกั้นเมื่อเกิดข้อผิดพลาด
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  ตัวกรองเป้าหมายที่เป็นทางเลือก เมื่อไม่ระบุ นโยบายจะมีผลกับทุกเป้าหมาย
  ที่รองรับ เพื่อให้การติดตั้งใหม่ไม่เปิดอนุญาตโดยไม่คาดคิด
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  พาธสัมบูรณ์ไปยังโปรแกรมปฏิบัติการของนโยบายที่เชื่อถือได้ OpenClaw เรียกใช้โดยไม่ผ่าน
  เชลล์และตรวจสอบความถูกต้องของพาธก่อนใช้งาน
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  อาร์กิวเมนต์คงที่ที่ส่งต่อหลัง `command`
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  เวลาทำงานตามนาฬิกาสูงสุดสำหรับการตัดสินใจตามนโยบายหนึ่งครั้ง
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  เวลาสูงสุดที่ไม่มีเอาต์พุตจาก stdout หรือ stderr ก่อนที่นโยบายจะ
  ปิดกั้นเมื่อเกิดข้อผิดพลาด
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  จำนวนไบต์รวมสูงสุดจาก stdout และ stderr ที่ยอมรับจากกระบวนการนโยบาย
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  ตัวแปรสภาพแวดล้อมแบบค่าตรงตัวที่ส่งให้กระบวนการนโยบาย
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  ชื่อตัวแปรสภาพแวดล้อมที่คัดลอกจากกระบวนการ OpenClaw ไปยังกระบวนการ
  นโยบาย โดยส่งเฉพาะตัวแปรที่ระบุชื่อไว้
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  รายการอนุญาตแบบเลือกได้ของไดเรกทอรีที่อาจมีโปรแกรมปฏิบัติการของนโยบาย
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  ข้ามการตรวจสอบความเป็นเจ้าของและสิทธิ์ของพาธคำสั่ง ใช้เฉพาะเมื่อ
  พาธได้รับการป้องกันด้วยกลไกอื่น
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  อนุญาตให้พาธคำสั่งที่กำหนดค่าเป็น symlink ได้ เป้าหมายที่แก้พาธแล้ว
  ยังคงต้องผ่านการตรวจสอบพาธอื่น ๆ อาร์กิวเมนต์สคริปต์ของอินเทอร์พรีเตอร์ต้อง
  เป็นไฟล์ปกติโดยตรง ไม่ใช่ symlink
</ParamField>

นโยบายจะได้รับออบเจ็กต์ JSON หนึ่งรายการทาง stdin ซึ่งมี `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
`source` แบบมีโครงสร้างซึ่งเป็นทางเลือก, `origin` แบบมีโครงสร้าง และ `request` โดยต้อง
เขียนออบเจ็กต์ JSON หนึ่งรายการไปยัง stdout: `{ "protocolVersion": 1, "decision": "allow" }`
หรือ `{ "protocolVersion": 1, "decision": "block", "reason": "..." }` การออกด้วยรหัสที่ไม่ใช่ศูนย์,
หมดเวลา, JSON ผิดรูปแบบ, ไม่มีฟิลด์ หรือเวอร์ชันโปรโตคอลที่ไม่รองรับ
จะทำให้ปิดกั้นเมื่อเกิดข้อผิดพลาด

OpenClaw จะไม่เรียกใช้นโยบายการติดตั้งระหว่างการเริ่มต้น Gateway ตามปกติ
การติดตั้งและการอัปเดตจะปิดกั้นเมื่อเกิดข้อผิดพลาด หากเปิดใช้นโยบายแต่ไม่พร้อมใช้งาน
`openclaw doctor` ทำการตรวจสอบแบบสถิต ส่วน `openclaw doctor --deep`
เรียกใช้โพรบจำลองการติดตั้งกับคำสั่งที่กำหนดค่าไว้

การอัปเดตแบบกลุ่มจะใช้นโยบายแยกตามแต่ละเป้าหมาย โดยการอัปเดต Skill หรือ Plugin
ที่ถูกบล็อกจะล้มเหลวเฉพาะเป้าหมายนั้น โดยไม่ปิดใช้นโยบายหรือข้ามเป้าหมายถัดไป
ในชุด

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
        reason: "พาธ Plugin ภายในเครื่องไม่ได้รับการอนุมัติบนโฮสต์นี้",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## รายการอนุญาตของ Skill ที่มาพร้อมระบบ

<ParamField path="skills.allowBundled" type="string[]">
  รายการอนุญาตแบบเลือกได้สำหรับ Skills ที่ **มาพร้อมระบบ** เท่านั้น เมื่อกำหนดค่า
  เฉพาะ Skills ที่มาพร้อมระบบซึ่งอยู่ในรายการเท่านั้นที่มีสิทธิ์ใช้งาน Skills ที่มีการจัดการ,
  ระดับเอเจนต์ และในพื้นที่ทำงานจะไม่ได้รับผลกระทบ
</ParamField>

## รายการต่อ Skill (`skills.entries`)

โดยค่าเริ่มต้น คีย์ภายใต้ `entries` จะตรงกับ `name` ของ Skill หาก Skill กำหนด
`metadata.openclaw.skillKey` ให้ใช้คีย์นั้นแทน ชื่อที่มีเครื่องหมายยัติภังค์ต้องใส่เครื่องหมายอัญประกาศ
(JSON5 อนุญาตคีย์ที่ใส่เครื่องหมายอัญประกาศ)

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` จะปิดใช้งาน Skill แม้จะมาพร้อมระบบหรือติดตั้งแล้วก็ตาม
  Skill ที่มาพร้อมระบบ `coding-agent` ต้องเปิดใช้เอง โดยกำหนดเป็น `true` และตรวจสอบให้แน่ใจว่า
  มีการติดตั้งและยืนยันตัวตนของ `claude`, `codex`, `opencode` หรือ CLI อื่นที่รองรับ
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  ฟิลด์อำนวยความสะดวกสำหรับ Skills ที่ประกาศ `metadata.openclaw.primaryEnv`
  รองรับสตริงข้อความธรรมดาหรือ SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  ตัวแปรสภาพแวดล้อมที่แทรกสำหรับการเรียกใช้เอเจนต์ โดยจะแทรกเฉพาะเมื่อ
  ตัวแปรนั้นยังไม่ได้กำหนดไว้ในกระบวนการ
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  ชุดข้อมูลแบบเลือกได้สำหรับฟิลด์การกำหนดค่าเฉพาะของแต่ละ Skill
</ParamField>

## รายการอนุญาตของเอเจนต์ (`agents`)

ใช้การกำหนดค่าเอเจนต์เมื่อต้องการใช้ราก Skill ของเครื่อง/พื้นที่ทำงานเดียวกัน แต่มี
ชุด Skill ที่มองเห็นได้แตกต่างกันสำหรับแต่ละเอเจนต์

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // ค่าพื้นฐานที่ใช้ร่วมกัน
    },
    list: [
      { id: "writer" }, // สืบทอด github, weather
      { id: "docs", skills: ["docs-search"] }, // แทนที่ค่าเริ่มต้นทั้งหมด
      { id: "locked-down", skills: [] }, // ไม่มี Skills
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  รายการอนุญาตพื้นฐานที่ใช้ร่วมกัน ซึ่งเอเจนต์ที่ไม่ระบุ
  `agents.list[].skills` จะสืบทอด ไม่ต้องระบุเลยหากต้องการให้ Skills
  ไม่ถูกจำกัดโดยค่าเริ่มต้น
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  ชุด Skill สุดท้ายที่ระบุชัดเจนสำหรับเอเจนต์นั้น รายการที่ระบุชัดเจนจะ
  **แทนที่** ค่าเริ่มต้นที่สืบทอดมา โดยจะไม่ผสานกัน กำหนดเป็น `[]` เพื่อไม่เปิดเผย Skills
  ใด ๆ แก่เอเจนต์นั้น
</ParamField>

<Warning>
  รายการอนุญาต Skill ของเอเจนต์เป็นตัวกรองการมองเห็นและการโหลดสำหรับการค้นหา
  Skill ของ OpenClaw, พรอมต์, การค้นหาคำสั่งแบบ slash, การซิงค์ sandbox และสแนปช็อต
  Skill รายการเหล่านี้ไม่ใช่ขอบเขตการให้สิทธิ์ ณ เวลาทำงานของเชลล์ หากเอเจนต์
  สามารถเรียกใช้ `exec` ของโฮสต์ เชลล์นั้นยังคงเรียกใช้ไคลเอนต์ภายนอกหรืออ่าน
  ไฟล์โฮสต์ที่ผู้ใช้ผู้ดำเนินการมองเห็นได้ รวมถึงรีจิสทรีไคลเอนต์ MCP
  เช่น `~/.openclaw/skills/config/mcporter.json` สำหรับ
  การแยก MCP รายเอเจนต์ ให้ใช้รายการอนุญาต Skill ร่วมกับการแยกด้วย sandbox/ผู้ใช้ระบบปฏิบัติการ,
  ปฏิเสธหรือจำกัด host exec ด้วยรายการอนุญาตอย่างเข้มงวด และควรใช้
  ข้อมูลรับรองแยกตามเอเจนต์ที่เซิร์ฟเวอร์ MCP
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  เมื่อ `true` OpenClaw สามารถสร้างข้อเสนอที่รอดำเนินการจากการแก้ไขแบบถาวร
  และสามารถตรวจทานงานที่เสร็จสมบูรณ์แล้วซึ่งสำเร็จและมีสาระสำคัญหลังจากระบบ
  ไม่มีการใช้งาน การดำเนินการนี้อาจเพิ่มการเรียกใช้โมเดลเบื้องหลังหลังจากรอบที่เข้าเกณฑ์ การสร้าง
  สกิลตามคำขอของผู้ใช้และ `/learn` ยังคงใช้งานได้เมื่อการตั้งค่าเป็น `false`
</ParamField>

ดู[การเรียนรู้ด้วยตนเอง](/tools/self-learning)สำหรับเกณฑ์คุณสมบัติ ความเป็นส่วนตัว ค่าใช้จ่าย
สิทธิ์ที่จำกัดเฉพาะข้อเสนอ และการแก้ไขปัญหา

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"auto"'>
  `auto` อนุญาตให้เอเจนต์เป็นผู้เริ่มใช้ ปฏิเสธ หรือกักกันได้โดยไม่ต้องมี
  พรอมต์ขออนุมัติเพิ่มเติม `pending` ต้องได้รับการอนุมัติจากผู้ปฏิบัติงาน
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  อนุญาตให้การใช้ข้อเสนอของ Skill Workshop เขียนผ่าน symlink ของสกิลในพื้นที่ทำงานซึ่ง
  เป้าหมายจริงได้รับความเชื่อถือจาก `skills.load.allowSymlinkTargets` อยู่แล้ว ให้คง
  การตั้งค่านี้เป็นปิด เว้นแต่การใช้ข้อเสนอที่สร้างขึ้นควรแก้ไขรูทสกิลที่ใช้ร่วมกันนั้น
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  จำนวนสูงสุดของข้อเสนอที่รอดำเนินการและถูกกักกันซึ่งเก็บไว้ต่อพื้นที่ทำงาน (ช่วงที่อนุญาต:
  1-200)
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  ขนาดสูงสุดของเนื้อหาข้อเสนอเป็นไบต์ (ช่วงที่อนุญาต: 1024-200000) คำอธิบาย
  ข้อเสนอถูกจำกัดอย่างเคร่งครัดแยกต่างหากที่ 160 ไบต์ เนื่องจากปรากฏ
  ในผลลัพธ์การค้นพบและการแสดงรายการ
</ParamField>

ดู [Skill Workshop](/th/tools/skill-workshop) สำหรับวงจรชีวิตของข้อเสนอ คำสั่ง CLI
พารามิเตอร์เครื่องมือของเอเจนต์ และเมธอด Gateway ที่การกำหนดค่านี้ควบคุม

## รูทสกิลแบบ symlink

โดยค่าเริ่มต้น รูทสกิลของพื้นที่ทำงาน เอเจนต์โครงการ ไดเรกทอรีเพิ่มเติม และสกิลที่รวมมาให้
เป็นขอบเขตการกักเก็บ โฟลเดอร์สกิลแบบ symlink ภายใต้ `<workspace>/skills`
ที่แก้ไขแล้วอยู่นอกรูทจะถูกข้ามพร้อมข้อความบันทึก

หากต้องการอนุญาตรูปแบบ symlink โดยเจตนา ให้ประกาศเป้าหมายที่เชื่อถือได้:

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

ด้วยการกำหนดค่านี้ `<workspace>/skills/manager -> ~/Projects/manager/skills`
จะได้รับการยอมรับหลังการแก้ไข realpath โดย `extraDirs` จะสแกนรีโพซิทอรีข้างเคียง
โดยตรง ส่วน `allowSymlinkTargets` จะคงเส้นทางแบบ symlink ไว้สำหรับรูปแบบ
ที่มีอยู่

โดยค่าเริ่มต้น การใช้ข้อเสนอของ Skill Workshop จะไม่เขียนผ่าน symlink เหล่านั้น หากต้องการ
ให้การใช้ข้อเสนอของ Workshop แก้ไขสกิลภายใต้เป้าหมาย symlink ที่เชื่อถืออยู่แล้ว ให้เลือก
เข้าร่วมแยกต่างหาก:

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

ไดเรกทอรี `~/.openclaw/skills` ที่มีการจัดการและไดเรกทอรี `~/.agents/skills` ส่วนบุคคล
ยอมรับ symlink ของไดเรกทอรีสกิลโดยไม่มีเงื่อนไขอยู่แล้ว (การกักเก็บ `SKILL.md`
ต่อสกิลยังคงมีผล) — จำเป็นต้องใช้ `allowSymlinkTargets` เฉพาะกับรูท
พื้นที่ทำงาน ไดเรกทอรีเพิ่มเติม และเอเจนต์โครงการ (`<workspace>/.agents/skills`)
เท่านั้น

## สกิลในแซนด์บ็อกซ์และตัวแปรสภาพแวดล้อม

<Warning>
  `skills.entries.<skill>.env` และ `apiKey` มีผลเฉพาะกับการทำงานบน **โฮสต์**
  เท่านั้น ภายในแซนด์บ็อกซ์จะไม่มีผล — สกิลที่ขึ้นอยู่กับ
  `GEMINI_API_KEY` จะล้มเหลวด้วย `apiKey not configured` เว้นแต่จะกำหนดตัวแปร
  ให้แซนด์บ็อกซ์แยกต่างหาก
</Warning>

ส่งข้อมูลลับเข้าสู่แซนด์บ็อกซ์ Docker ด้วย:

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
  ผ่านเมทาดาทาของ Docker ได้ ให้ใช้ไฟล์ข้อมูลลับที่เมานต์ อิมเมจที่กำหนดเอง หรือ
  ช่องทางการส่งมอบอื่นเมื่อไม่สามารถยอมรับการเปิดเผยดังกล่าวได้
</Note>

## ข้อควรจำเกี่ยวกับลำดับการโหลด

```text
workspace/skills      (สูงสุด)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
สกิลที่รวมมาให้
skills.load.extraDirs (ต่ำสุด)
```

การเปลี่ยนแปลงสกิลและการกำหนดค่าจะมีผลในเซสชันใหม่ถัดไปเมื่อเปิดใช้
ตัวเฝ้าดู หรือในรอบเอเจนต์ถัดไปเมื่อตัวเฝ้าดูตรวจพบ
การเปลี่ยนแปลง

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="เอกสารอ้างอิงสกิล" href="/th/tools/skills" icon="puzzle-piece">
    สกิลคืออะไร ลำดับการโหลด การควบคุมการเข้าถึง และรูปแบบ SKILL.md
  </Card>
  <Card title="การสร้างสกิล" href="/th/tools/creating-skills" icon="hammer">
    การสร้างสกิลแบบกำหนดเองสำหรับพื้นที่ทำงาน
  </Card>
  <Card title="Skill Workshop" href="/th/tools/skill-workshop" icon="flask">
    คิวข้อเสนอสำหรับสกิลที่เอเจนต์ร่าง
  </Card>
  <Card title="การเรียนรู้ด้วยตนเอง" href="/tools/self-learning" icon="brain">
    ข้อเสนอแบบระมัดระวังและเลือกเข้าร่วมได้จากงานที่เสร็จสมบูรณ์
  </Card>
  <Card title="คำสั่งแบบสแลช" href="/th/tools/slash-commands" icon="terminal">
    แค็ตตาล็อกคำสั่งแบบสแลชเนทีฟและไดเรกทีฟแชต
  </Card>
</CardGroup>
