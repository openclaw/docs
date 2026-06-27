---
read_when:
    - การกำหนดค่าการโหลด การติดตั้ง หรือพฤติกรรมการควบคุมการใช้งาน Skills
    - การตั้งค่าการมองเห็น Skills ต่อเอเจนต์
    - การปรับขีดจำกัดหรือ นโยบายการอนุมัติ ของ Skill Workshop
sidebarTitle: Skills config
summary: ข้อมูลอ้างอิงฉบับสมบูรณ์สำหรับสคีมา config ของ skills.* รายการอนุญาตของเอเจนต์ การตั้งค่าเวิร์กช็อป และการจัดการ env var ของแซนด์บ็อกซ์
title: การกำหนดค่า Skills
x-i18n:
    generated_at: "2026-06-27T18:30:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c1ba6beb1e06e7090dd6669320a91893bf26abe71633914e7564aebb59c637f
    source_path: tools/skills-config.md
    workflow: 16
---

การกำหนดค่าส่วนใหญ่ของสกิลอยู่ใต้ `skills` ใน
`~/.openclaw/openclaw.json` การมองเห็นเฉพาะเอเจนต์อยู่ใต้
`agents.defaults.skills` และ `agents.list[].skills`.

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
  สำหรับการสร้างรูปภาพในตัว ให้ใช้ `agents.defaults.imageGenerationModel`
  ร่วมกับเครื่องมือหลัก `image_generate` แทน `skills.entries` รายการสกิล
  มีไว้สำหรับเวิร์กโฟลว์สกิลแบบกำหนดเองหรือจากบุคคลที่สามเท่านั้น
</Note>

## การโหลด (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  ไดเรกทอรีสกิลเพิ่มเติมที่จะสแกน โดยมีลำดับความสำคัญต่ำที่สุด (หลังสกิลที่บันเดิลมา
  และสกิลจาก Plugin) พาธจะถูกขยายโดยรองรับ `~`
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  ไดเรกทอรีเป้าหมายจริงที่เชื่อถือได้ ซึ่งโฟลเดอร์สกิลที่เป็น symlink อาจ resolve ไปหาได้
  แม้ symlink จะอยู่นอก root ที่กำหนดค่าไว้ ใช้ค่านี้สำหรับเลย์เอาต์ sibling repo
  ที่ตั้งใจไว้ เช่น
  `<workspace>/skills/manager -> ~/Projects/manager/skills` จำกัดรายการนี้ให้แคบ
  อย่าชี้ไปยัง root กว้าง ๆ เช่น `~` หรือ `~/Projects`
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  เฝ้าดูโฟลเดอร์สกิลและรีเฟรช snapshot ของสกิลเมื่อไฟล์ `SKILL.md`
  เปลี่ยนแปลง ครอบคลุมไฟล์ซ้อนภายใน root ของสกิลแบบกลุ่ม
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  หน้าต่าง debounce สำหรับเหตุการณ์ watcher ของสกิล หน่วยเป็นมิลลิวินาที
</ParamField>

## การติดตั้ง (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  เลือกใช้ตัวติดตั้ง Homebrew เมื่อมี `brew`
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  ค่ากำหนดตัวจัดการแพ็กเกจ Node สำหรับการติดตั้งสกิล ค่านี้มีผลเฉพาะกับการติดตั้งสกิลเท่านั้น
  runtime ของ Gateway ยังควรใช้ Node (ไม่แนะนำ Bun
  สำหรับ WhatsApp/Telegram) ใช้ `openclaw setup --node-manager` สำหรับ npm, pnpm,
  หรือ bun; ตั้งค่า `"yarn"` ด้วยตนเองสำหรับการติดตั้งสกิลที่อิง Yarn
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  อนุญาตให้ไคลเอนต์ Gateway `operator.admin` ที่เชื่อถือได้ติดตั้งไฟล์ zip
  ส่วนตัวที่ staging ผ่าน `skills.upload.*` การติดตั้ง ClawHub ปกติไม่จำเป็นต้องใช้
  การตั้งค่านี้
</ParamField>

## นโยบายการติดตั้งของผู้ปฏิบัติงาน (`security.installPolicy`)

ใช้ `security.installPolicy` เมื่อผู้ปฏิบัติงานต้องการคำสั่ง local ที่เชื่อถือได้เพื่อ
อนุมัติหรือบล็อกการติดตั้งสกิลและ Plugin ด้วยนโยบายเฉพาะ host นโยบายนี้
ทำงานหลังจาก OpenClaw staging วัสดุต้นทางแล้ว และก่อนที่การติดตั้งหรืออัปเดต
จะดำเนินต่อไป นโยบายนี้ใช้กับสกิล ClawHub, สกิลที่อัปโหลด, สกิล Git/local,
ตัวติดตั้ง dependency ของสกิล และแหล่งติดตั้ง/อัปเดต Plugin

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
  ที่ถูกต้อง การติดตั้งจะล้มเหลวแบบปิดกั้น
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  ตัวกรองเป้าหมายแบบไม่บังคับ เมื่อไม่ระบุ นโยบายจะใช้กับทุกเป้าหมายที่รองรับ
  เพื่อให้การติดตั้งใหม่ไม่เปิดให้ผ่านโดยไม่คาดคิด
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  พาธแบบ absolute ไปยัง executable ของนโยบายที่เชื่อถือได้ OpenClaw เรียกใช้โดยไม่ผ่าน
  shell และตรวจสอบพาธก่อนใช้งาน
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  อาร์กิวเมนต์แบบคงที่ที่ส่งหลัง `command`
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  runtime ตามเวลาจริงสูงสุดสำหรับการตัดสินใจของนโยบายหนึ่งครั้ง
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  เวลาสูงสุดที่ไม่มีเอาต์พุต stdout หรือ stderr ก่อนที่นโยบายจะล้มเหลวแบบปิดกั้น
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  จำนวนไบต์รวมสูงสุดของ stdout และ stderr ที่ยอมรับจาก process ของนโยบาย
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  ตัวแปรสภาพแวดล้อมแบบ literal ที่ส่งให้ process ของนโยบาย
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  ชื่อตัวแปรสภาพแวดล้อมที่คัดลอกจาก process ของ OpenClaw ไปยัง process
  ของนโยบาย ส่งผ่านเฉพาะตัวแปรที่ระบุชื่อเท่านั้น
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  allowlist แบบไม่บังคับของไดเรกทอรีที่อาจมี executable ของนโยบาย
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  ข้ามการตรวจสอบเจ้าของและสิทธิ์ของพาธคำสั่ง ใช้เฉพาะเมื่อพาธ
  ได้รับการป้องกันโดยกลไกอื่น
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  อนุญาตให้พาธคำสั่งที่กำหนดค่าเป็น symlink ได้ เป้าหมายที่ resolve แล้วต้อง
  ยังผ่านการตรวจสอบพาธอื่น ๆ อาร์กิวเมนต์สคริปต์ interpreter ต้องเป็น
  ไฟล์ปกติโดยตรง ไม่ใช่ symlink
</ParamField>

นโยบายจะรับออบเจ็กต์ JSON หนึ่งรายการทาง stdin พร้อม `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
`source` แบบมีโครงสร้างที่ไม่บังคับ, `origin` แบบมีโครงสร้าง และ `request` นโยบายต้องเขียน
ออบเจ็กต์ JSON หนึ่งรายการทาง stdout: `{ "protocolVersion": 1, "decision": "allow" }` หรือ
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }` การออกด้วยค่าไม่เป็นศูนย์,
timeout, JSON ผิดรูปแบบ, ฟิลด์ขาดหาย หรือเวอร์ชันโปรโตคอลที่ไม่รองรับ
จะล้มเหลวแบบปิดกั้น

OpenClaw ไม่เรียกใช้นโยบายการติดตั้งระหว่างการเริ่มต้น Gateway ตามปกติ การติดตั้ง
และการอัปเดตจะล้มเหลวแบบปิดกั้นเมื่อนโยบายเปิดใช้อยู่แต่ไม่พร้อมใช้งาน `openclaw doctor`
ทำการตรวจสอบแบบ static และ `openclaw doctor --deep` เรียกใช้โพรบการติดตั้งจำลอง
กับคำสั่งที่กำหนดค่าไว้

การอัปเดตเป็นชุดใช้นโยบายแยกตามเป้าหมาย: การอัปเดตสกิลหรือ Plugin ที่ถูกบล็อกจะล้มเหลว
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

## allowlist ของสกิลที่บันเดิลมา

<ParamField path="skills.allowBundled" type="string[]">
  allowlist แบบไม่บังคับสำหรับสกิลที่ **บันเดิลมา** เท่านั้น เมื่อตั้งค่าแล้ว เฉพาะสกิลที่บันเดิลมา
  ในรายการเท่านั้นที่จะมีสิทธิ์ใช้งาน สกิลแบบจัดการ, ระดับเอเจนต์ และ workspace
  จะไม่ได้รับผลกระทบ
</ParamField>

## รายการรายสกิล (`skills.entries`)

คีย์ใต้ `entries` จะตรงกับ `name` ของสกิลโดยค่าเริ่มต้น หากสกิลกำหนด
`metadata.openclaw.skillKey` ให้ใช้คีย์นั้นแทน ใส่เครื่องหมายคำพูดครอบชื่อที่มีขีดกลาง
(JSON5 อนุญาตให้ใช้คีย์ที่มีเครื่องหมายคำพูด)

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` ปิดใช้งานสกิลแม้จะถูกบันเดิลหรือติดตั้งแล้ว สกิลที่บันเดิลมา `coding-agent`
  เป็นแบบ opt-in ตั้งค่าเป็น `true` และตรวจสอบให้แน่ใจว่ามี CLI อย่างใดอย่างหนึ่งจาก `claude`,
  `codex`, `opencode` หรือ CLI อื่นที่รองรับติดตั้งและผ่านการยืนยันตัวตนแล้ว
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  ฟิลด์อำนวยความสะดวกสำหรับสกิลที่ประกาศ `metadata.openclaw.primaryEnv`
  รองรับสตริง plaintext หรือ SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  ตัวแปรสภาพแวดล้อมที่ฉีดเข้าไปสำหรับการรันเอเจนต์ ฉีดเข้าไปเฉพาะเมื่อ
  ตัวแปรยังไม่ได้ถูกตั้งค่าใน process
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  ถุงข้อมูลแบบไม่บังคับสำหรับฟิลด์การกำหนดค่ารายสกิลแบบกำหนดเอง
</ParamField>

## allowlist ของเอเจนต์ (`agents`)

ใช้การกำหนดค่าเอเจนต์เมื่อคุณต้องการ root สกิลของเครื่อง/workspace เดียวกัน แต่มี
ชุดสกิลที่มองเห็นได้แตกต่างกันต่อเอเจนต์

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
  allowlist baseline ที่ใช้ร่วมกัน ซึ่งเอเจนต์ที่ละเว้น `agents.list[].skills` จะสืบทอด
  ละเว้นทั้งหมดเพื่อให้สกิลไม่ถูกจำกัดโดยค่าเริ่มต้น
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  ชุดสกิลสุดท้ายที่ระบุชัดเจนสำหรับเอเจนต์นั้น รายการที่ระบุชัดเจนจะ **แทนที่** ค่าเริ่มต้นที่สืบทอดมา
  โดยไม่ merge กัน ตั้งเป็น `[]` เพื่อไม่เปิดเผยสกิลใด ๆ สำหรับเอเจนต์นั้น
</ParamField>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  เมื่อเป็น `true` เอเจนต์สามารถสร้างข้อเสนอที่รอพิจารณาจากสัญญาณการสนทนาที่คงทน
  หลังจากเทิร์นสำเร็จ การสร้างสกิลที่ผู้ใช้ร้องขอจะผ่าน Skill Workshop เสมอ
  ไม่ว่าการตั้งค่านี้จะเป็นอย่างไร
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` ต้องได้รับการอนุมัติจากผู้ปฏิบัติงานก่อนการ apply, reject หรือ
  quarantine ที่เอเจนต์เริ่มต้น `auto` อนุญาตการกระทำเหล่านั้นโดยไม่ต้องอนุมัติ
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  อนุญาตให้การ apply ของ Skill Workshop เขียนผ่าน symlink สกิลของ workspace ซึ่ง
  เป้าหมายจริงได้รับความเชื่อถือแล้วโดย `skills.load.allowSymlinkTargets` ปิดค่านี้ไว้
  เว้นแต่การ apply ข้อเสนอที่สร้างขึ้นควรแก้ไข root สกิลที่ใช้ร่วมกันนั้น
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  จำนวนข้อเสนอที่รอดำเนินการและถูกกักกันสูงสุดที่เก็บไว้ต่อ workspace
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  ขนาดสูงสุดของเนื้อหาข้อเสนอเป็นไบต์ คำอธิบายข้อเสนอถูกจำกัดแบบตายตัวไว้ที่
  160 ไบต์ เพราะจะแสดงในเอาต์พุตการค้นพบและการแสดงรายการ
</ParamField>

## รูท Skills แบบ symlink

โดยค่าเริ่มต้น รูท Skills ของ workspace, project-agent, extra-dir และแบบ bundled
เป็นขอบเขตการกักกัน โฟลเดอร์ Skills แบบ symlink ใต้ `<workspace>/skills`
ที่ resolve ออกไปนอกรูทจะถูกข้ามพร้อมข้อความ log

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

ด้วย config นี้ `<workspace>/skills/manager -> ~/Projects/manager/skills` จะได้รับการยอมรับ
หลังจาก resolve realpath แล้ว `extraDirs` จะสแกน repo พี่น้องโดยตรง;
`allowSymlinkTargets` จะคง path แบบ symlink ไว้สำหรับเลย์เอาต์ที่มีอยู่

การ apply ของ Skill Workshop จะไม่เขียนผ่าน symlink เหล่านั้นโดยค่าเริ่มต้น หากต้องการให้
Workshop apply แก้ไข Skills ใต้เป้าหมาย symlink ที่เชื่อถือแล้ว ให้เลือกเปิดใช้
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

ไดเรกทอรี `~/.openclaw/skills` ที่จัดการโดยระบบและไดเรกทอรีส่วนตัว `~/.agents/skills`
ยอมรับ symlink ของไดเรกทอรี Skills อยู่แล้ว (การกักกัน `SKILL.md` ต่อ Skill ยังคง
มีผล)

## Skills แบบ sandbox และ env vars

<Warning>
  `skills.entries.<skill>.env` และ `apiKey` มีผลกับการรันบน **host** เท่านั้น ภายใน
  sandbox ค่าเหล่านี้ไม่มีผล — Skill ที่พึ่งพา `GEMINI_API_KEY` จะ
  ล้มเหลวด้วย `apiKey not configured` เว้นแต่ sandbox จะได้รับตัวแปรนั้น
  แยกต่างหาก
</Warning>

ส่ง secrets เข้าไปใน Docker sandbox ด้วย:

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
  ผ่าน metadata ของ Docker ได้ ใช้ไฟล์ secret ที่ mount ไว้, image แบบกำหนดเอง หรือ
  เส้นทางส่งมอบอื่นเมื่อไม่สามารถยอมรับการเปิดเผยนี้ได้
</Note>

## การเตือนลำดับการโหลด

```text
workspace/skills      (highest)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
bundled skills
skills.load.extraDirs (lowest)
```

การเปลี่ยนแปลง Skills และ config จะมีผลใน session ใหม่ถัดไปเมื่อเปิดใช้
watcher หรือใน agent turn ถัดไปเมื่อ watcher ตรวจพบการเปลี่ยนแปลง

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Skills reference" href="/th/tools/skills" icon="puzzle-piece">
    Skills คืออะไร ลำดับการโหลด gating และรูปแบบ SKILL.md
  </Card>
  <Card title="Creating skills" href="/th/tools/creating-skills" icon="hammer">
    การเขียน Skills แบบกำหนดเองของ workspace
  </Card>
  <Card title="Skill Workshop" href="/th/tools/skill-workshop" icon="flask">
    คิวข้อเสนอสำหรับ Skills ที่ agent ร่าง
  </Card>
  <Card title="Slash commands" href="/th/tools/slash-commands" icon="terminal">
    แค็ตตาล็อก slash-command แบบ native และคำสั่งกำกับการแชต
  </Card>
</CardGroup>
