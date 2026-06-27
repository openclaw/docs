---
doc-schema-version: 1
read_when:
    - การติดตั้งหรือกำหนดค่า Plugin
    - ทำความเข้าใจการค้นพบ Plugin และกฎการโหลด
    - การทำงานกับชุด Plugin ที่เข้ากันได้กับ Codex/Claude
sidebarTitle: Getting Started
summary: ติดตั้ง กำหนดค่า และจัดการ Plugin ของ OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-06-27T18:30:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61e0ddb164baba368fbf57883e7a72eddadc28cb100ed6c4f11977c55576513
    source_path: tools/plugin.md
    workflow: 16
---

Plugin ขยาย OpenClaw ด้วยช่องทาง, ผู้ให้บริการโมเดล, agent harness, เครื่องมือ,
Skills, คำพูด, การถอดเสียงแบบเรียลไทม์, เสียง, การทำความเข้าใจสื่อ, การสร้าง,
web fetch, web search และความสามารถรันไทม์อื่นๆ

ใช้หน้านี้เมื่อคุณต้องการติดตั้ง Plugin, รีสตาร์ท Gateway, ตรวจสอบว่า
รันไทม์โหลด Plugin แล้ว และจัดการความล้มเหลวทั่วไปในการตั้งค่า สำหรับตัวอย่างที่เป็นคำสั่งเท่านั้น
ดู [จัดการ Plugin](/th/plugins/manage-plugins) สำหรับรายการที่สร้างครบทั้งหมด
ของ Plugin ที่บันเดิลมา, ภายนอกอย่างเป็นทางการ และมีเฉพาะซอร์สโค้ด ดู
[รายการ Plugin](/th/plugins/plugin-inventory)

## ข้อกำหนด

ก่อนติดตั้ง Plugin ให้ตรวจสอบว่าคุณมี:

- checkout หรือการติดตั้ง OpenClaw ที่มี CLI `openclaw` พร้อมใช้งาน
- การเข้าถึงเครือข่ายไปยังแหล่งที่เลือก เช่น ClawHub, npm หรือโฮสต์ git
- ข้อมูลประจำตัว, คีย์ config หรือเครื่องมือของระบบปฏิบัติการที่เฉพาะกับ Plugin
  ซึ่งระบุไว้ในเอกสารการตั้งค่าของ Plugin นั้น
- สิทธิ์สำหรับ Gateway ที่ให้บริการช่องทางของคุณเพื่อโหลดใหม่หรือรีสตาร์ท

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="Find the plugin">
    ค้นหาแพ็กเกจ Plugin สาธารณะใน [ClawHub](/th/clawhub):

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub เป็นพื้นที่ค้นหาหลักสำหรับ Plugin จากชุมชน ระหว่างช่วง
    เปลี่ยนผ่านการเปิดตัว สเปกแพ็กเกจแบบเปล่าทั่วไปยังคงติดตั้งจาก npm เว้นแต่
    จะตรงกับ ID ของ Plugin อย่างเป็นทางการ สเปกแพ็กเกจ `@openclaw/*` แบบดิบที่ตรงกับ
    Plugin ที่บันเดิลมาจะใช้สำเนาที่บันเดิลจาก build OpenClaw ปัจจุบัน ใช้
    prefix ที่ชัดเจนเมื่อคุณต้องการระบุแหล่งหนึ่งโดยเฉพาะ

  </Step>

  <Step title="Install the plugin">
    ```bash
    # From ClawHub.
    openclaw plugins install clawhub:<package>

    # From npm.
    openclaw plugins install npm:<package>

    # From git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # From a local development checkout.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    ปฏิบัติต่อการติดตั้ง Plugin เหมือนการรันโค้ด ควรใช้เวอร์ชันที่ pin ไว้เมื่อคุณ
    ต้องการการติดตั้งใน production ที่ทำซ้ำได้

  </Step>

  <Step title="Configure and enable it">
    กำหนดค่าการตั้งค่าเฉพาะ Plugin ภายใต้ `plugins.entries.<id>.config`
    เปิดใช้ Plugin เมื่อยังไม่ได้เปิดใช้อยู่แล้ว:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    หาก config ของคุณใช้รายการ `plugins.allow` ที่จำกัด ID ของ Plugin ที่ติดตั้ง
    ต้องอยู่ในรายการนั้นก่อน Plugin จึงจะโหลดได้
    `openclaw plugins install` จะเพิ่ม ID ที่ติดตั้งเข้าไปในรายการ
    `plugins.allow` ที่มีอยู่ และลบ ID เดียวกันออกจาก `plugins.deny` เพื่อให้
    การติดตั้งที่ระบุชัดเจนโหลดได้หลังรีสตาร์ท

  </Step>

  <Step title="Let the Gateway reload">
    การติดตั้ง, อัปเดต หรือถอนการติดตั้งโค้ด Plugin ต้องรีสตาร์ท Gateway
    เมื่อ Gateway ที่จัดการไว้อยู่กำลังรันพร้อมเปิดใช้การโหลด config ใหม่
    OpenClaw จะตรวจพบ install record ของ Plugin ที่เปลี่ยนไปและรีสตาร์ท
    Gateway โดยอัตโนมัติ หาก Gateway ไม่ได้ถูกจัดการหรือปิดการโหลดใหม่ไว้
    ให้รีสตาร์ทด้วยตัวเอง:

    ```bash
    openclaw gateway restart
    ```

    การเปิดใช้และปิดใช้จะอัปเดต config และรีเฟรช cold registry
    การ inspect รันไทม์ยังคงเป็นเส้นทางตรวจสอบที่ชัดเจนที่สุดสำหรับพื้นผิวรันไทม์ที่ live อยู่

  </Step>

  <Step title="Verify runtime registration">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    ใช้ `--runtime` เมื่อคุณต้องพิสูจน์เครื่องมือ, hooks, services,
    เมธอด Gateway หรือคำสั่ง CLI ที่ Plugin เป็นเจ้าของซึ่งลงทะเบียนแล้ว `inspect` แบบปกติคือ
    การตรวจสอบ manifest และ registry แบบ cold

  </Step>
</Steps>

## การกำหนดค่า

### เลือกแหล่งติดตั้ง

| แหล่ง      | ใช้เมื่อ                                                                       | ตัวอย่าง                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | คุณต้องการการค้นหา, การสแกน, metadata เวอร์ชัน และคำแนะนำการติดตั้งแบบ OpenClaw-native | `openclaw plugins install clawhub:<package>`                   |
| npm         | คุณต้องการเวิร์กโฟลว์ npm registry หรือ dist-tag โดยตรง                             | `openclaw plugins install npm:<package>`                       |
| git         | คุณต้องการ branch, tag หรือ commit จาก repository                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| path ในเครื่อง  | คุณกำลังพัฒนาหรือทดสอบ Plugin บนเครื่องเดียวกัน                     | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | คุณกำลังติดตั้ง Plugin marketplace ที่เข้ากันได้กับ Claude                      | `openclaw plugins install <plugin> --marketplace <source>`     |

สเปกแพ็กเกจแบบเปล่ามีพฤติกรรมความเข้ากันได้พิเศษ หากชื่อแบบเปล่าตรงกับ
ID ของ Plugin ที่บันเดิลมา OpenClaw จะใช้แหล่งที่บันเดิลมานั้น หากตรงกับ
ID ของ Plugin ภายนอกอย่างเป็นทางการ OpenClaw จะใช้ catalog แพ็กเกจอย่างเป็นทางการ สเปกแพ็กเกจแบบเปล่าทั่วไปอื่นๆ
จะติดตั้งผ่าน npm ระหว่างช่วงเปลี่ยนผ่านการเปิดตัว สเปกแพ็กเกจ `@openclaw/*`
แบบดิบที่ตรงกับ Plugin ที่บันเดิลมาก็จะ resolve ไปยังสำเนาที่บันเดิลมา
ก่อน fallback ไป npm เช่นกัน ใช้ `npm:@openclaw/<plugin>@<version>` เมื่อ
คุณตั้งใจต้องการแพ็กเกจ npm ภายนอกแทนสำเนาที่บันเดิลมา
ซึ่ง image เป็นเจ้าของ ใช้ `clawhub:`, `npm:`, `git:` หรือ `npm-pack:` เมื่อคุณต้องการ
การเลือกแหล่งที่กำหนดแน่นอน ดู [`openclaw plugins`](/th/cli/plugins#install)
สำหรับสัญญาคำสั่งฉบับเต็ม

สำหรับการติดตั้ง npm สเปกแพ็กเกจที่ไม่ pin และ `@latest` จะเลือกแพ็กเกจ stable
ใหม่ที่สุดที่ประกาศความเข้ากันได้กับ build OpenClaw นี้ หาก release latest
ปัจจุบันของ npm ประกาศ `openclaw.compat.pluginApi` หรือ
`openclaw.install.minHostVersion` ที่ใหม่กว่า OpenClaw จะสแกนเวอร์ชันแพ็กเกจ stable
ที่เก่ากว่าและติดตั้งเวอร์ชันใหม่ที่สุดที่ใช้ได้ เวอร์ชันแบบ exact และแท็กช่องทางที่ระบุชัดเจน
เช่น `@beta` จะยังคง pin กับแพ็กเกจที่เลือกและล้มเหลวเมื่อเข้ากันไม่ได้

### นโยบายการติดตั้งของผู้ปฏิบัติการ

กำหนดค่า `security.installPolicy` เพื่อรันคำสั่งนโยบายในเครื่องที่เชื่อถือได้ก่อน
การติดตั้งหรืออัปเดต Plugin จะดำเนินต่อ นโยบายจะรับ metadata พร้อมกับ path
ของแหล่งที่ staged ไว้ และสามารถอนุญาตหรือบล็อกการติดตั้งได้ ครอบคลุมเส้นทางติดตั้ง/อัปเดต
Plugin ผ่าน CLI และที่มี Gateway รองรับ hook `before_install` ของ Plugin จะรันภายหลังเฉพาะใน
process ของ OpenClaw ที่โหลด hook ของ Plugin แล้ว ดังนั้นให้ใช้ `security.installPolicy`
สำหรับการตัดสินใจติดตั้งที่ผู้ปฏิบัติการเป็นเจ้าของ flag
`--dangerously-force-unsafe-install` ที่เลิกใช้แล้วจะยังรับไว้เพื่อความเข้ากันได้ แต่
ไม่ข้ามนโยบายการติดตั้งหรือ denylist dependency ของ Plugin ที่ OpenClaw มีในตัว

ดู [config ของ Skills](/th/tools/skills-config#operator-install-policy-securityinstallpolicy)
สำหรับ schema exec ร่วมของ `security.installPolicy` ที่ใช้โดยทั้ง Skills และ
Plugin

### กำหนดค่านโยบาย Plugin

รูปแบบ config Plugin ทั่วไปคือ:

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    slots: { memory: "memory-core" },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

กฎนโยบายสำคัญ:

- `plugins.enabled: false` ปิดใช้ Plugin ทั้งหมดและข้ามงาน discovery/load
  ของ Plugin การอ้างอิง Plugin ที่ค้างอยู่จะไม่ทำงานขณะค่านี้ active อยู่ ให้เปิดใช้
  Plugin อีกครั้งก่อนรัน doctor cleanup เมื่อคุณต้องการลบ ID ที่ค้างอยู่
- `plugins.deny` ชนะ allow และการเปิดใช้ต่อ Plugin
- `plugins.allow` เป็น allowlist แบบ exclusive เครื่องมือที่ Plugin เป็นเจ้าของนอก
  allowlist จะยังไม่พร้อมใช้งาน แม้ `tools.allow` จะมี `"*"` ก็ตาม
- `plugins.entries.<id>.enabled: false` ปิดใช้ Plugin หนึ่งรายการโดยยังเก็บ
  config ของมันไว้
- `plugins.load.paths` เพิ่มไฟล์หรือไดเรกทอรี Plugin ในเครื่องที่ระบุชัดเจน path ในเครื่องของ
  `plugins install` ที่จัดการแล้วต้องเป็นไดเรกทอรีหรือ archive ของ Plugin ใช้
  `plugins.load.paths` สำหรับไฟล์ Plugin แบบ standalone
- Plugin ที่มีต้นทางจาก workspace จะถูกปิดใช้โดยค่าเริ่มต้น ให้เปิดใช้หรือ
  ใส่ไว้ใน allowlist อย่างชัดเจนก่อนใช้โค้ด workspace ในเครื่อง
- Plugin ที่บันเดิลมาจะทำตาม metadata default-on/default-off ในตัวของมัน เว้นแต่
  config จะ override อย่างชัดเจน
- `plugins.slots.<slot>` เลือก Plugin หนึ่งรายการสำหรับหมวดหมู่แบบ exclusive เช่น
  engine หน่วยความจำและบริบท การเลือก slot จะ force-enable Plugin ที่เลือก
  สำหรับ slot นั้นโดยนับเป็นการเปิดใช้อย่างชัดเจน จึงสามารถโหลดได้แม้โดยปกติ
  จะเป็นแบบ opt-in ก็ตาม `plugins.deny` และ
  `plugins.entries.<id>.enabled: false` ยังคงบล็อกมัน
- Plugin opt-in ที่บันเดิลมาสามารถ auto-activate ได้เมื่อ config ระบุชื่อหนึ่งในพื้นผิวที่มันเป็นเจ้าของ
  เช่น provider/model ref, channel config, CLI backend หรือ agent
  harness runtime
- การ routing ของ Codex ตระกูล OpenAI แยกขอบเขต provider และ runtime plugin
  ออกจากกัน: legacy Codex model refs คือ config legacy ที่ doctor ซ่อมแซม ขณะที่ Plugin
  `codex` ที่บันเดิลมาเป็นเจ้าของรันไทม์ Codex app-server สำหรับ agent ref
  `openai/*` แบบ canonical, `agentRuntime.id: "codex"` แบบชัดเจน และ ref `codex/*` legacy

เมื่อไม่ได้ตั้งค่า `plugins.allow` และ Plugin ที่ไม่ได้บันเดิลมาถูก auto-discover จาก
workspace หรือ root ของ Plugin ส่วนกลาง log ตอน startup จะแสดง
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
คำเตือนจะรวม ID ของ Plugin ที่พบ และสำหรับรายการสั้นๆ จะมี snippet
`plugins.allow` ขั้นต่ำ รัน
[`openclaw plugins list --enabled --verbose`](/th/cli/plugins#list) หรือ
[`openclaw plugins inspect <id>`](/th/cli/plugins#inspect) พร้อม ID ของ Plugin ที่ระบุไว้
ก่อนคัดลอก Plugin ที่เชื่อถือเข้าไปใน `openclaw.json` แนวทางการ trust-pinning
เดียวกันใช้เมื่อ diagnostics ระบุว่า Plugin โหลด
`without install/load-path provenance`: inspect ID ของ Plugin นั้น แล้ว pin ID
ที่เชื่อถือไว้ใน `plugins.allow` หรือติดตั้งใหม่จากแหล่งที่เชื่อถือได้เพื่อให้ OpenClaw
บันทึก install provenance

รัน `openclaw doctor` หรือ `openclaw doctor --fix` เมื่อการตรวจสอบ config รายงาน
ID ของ Plugin ที่ค้างอยู่, allowlist/tool mismatch หรือ path ของ Plugin ที่บันเดิลมาแบบ legacy

## ทำความเข้าใจรูปแบบ Plugin

OpenClaw รู้จักรูปแบบ Plugin สองแบบ:

| รูปแบบ                 | วิธีโหลด                                                                 | ใช้เมื่อ                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Plugin OpenClaw แบบเนทีฟ | `openclaw.plugin.json` พร้อมโมดูลรันไทม์ที่โหลดใน process               | คุณกำลังติดตั้งหรือสร้างความสามารถรันไทม์เฉพาะ OpenClaw  |
| bundle ที่เข้ากันได้      | layout ของ Plugin Codex, Claude หรือ Cursor ที่ map เข้าไปในรายการ Plugin ของ OpenClaw | คุณกำลังใช้ Skills, คำสั่ง, hooks หรือ metadata ของ bundle ที่เข้ากันได้ซ้ำ |

ทั้งสองรูปแบบจะแสดงใน `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` และ `openclaw plugins disable` ดู
[Plugin bundles](/th/plugins/bundles) สำหรับขอบเขตความเข้ากันได้ของ bundle และ
[การสร้าง Plugin](/th/plugins/building-plugins) สำหรับการเขียน Plugin แบบเนทีฟ

## Plugin hooks

Plugin สามารถลงทะเบียน hooks ตอนรันไทม์ได้ แต่มี API สองแบบที่ต่างกันและมีหน้าที่
ต่างกัน

- ใช้ hook แบบ typed ผ่าน `api.on(...)` สำหรับ lifecycle hook ของรันไทม์ นี่คือ
  พื้นผิวที่แนะนำสำหรับ middleware, policy, การเขียนข้อความใหม่, การปรับรูป prompt
  และการควบคุมเครื่องมือ
- ใช้ `api.registerHook(...)` เฉพาะเมื่อคุณต้องการเข้าร่วมระบบ hook ภายใน
  ที่อธิบายใน [Hooks](/th/automation/hooks) ส่วนใหญ่ใช้สำหรับ side effect แบบกว้างของ
  คำสั่ง/lifecycle และความเข้ากันได้กับ automation รูปแบบ HOOK ที่มีอยู่

กฎอย่างรวดเร็ว:

- หาก handler ต้องการ priority, merge semantics หรือพฤติกรรม block/cancel ให้ใช้
  hook ของ Plugin แบบ typed
- หาก handler เพียงตอบสนองต่อ `command:new`, `command:reset`, `message:sent`
  หรือ event แบบกว้างที่คล้ายกัน `api.registerHook(...)` ก็ใช้ได้

hook ภายในที่ Plugin จัดการจะแสดงใน `openclaw hooks list` พร้อม
`plugin:<id>` คุณไม่สามารถเปิดใช้หรือปิดใช้ผ่าน `openclaw hooks`;
ให้เปิดใช้หรือปิดใช้ Plugin แทน

## ตรวจสอบ Gateway ที่ active อยู่

`openclaw plugins list` และ `openclaw plugins inspect` แบบธรรมดาจะอ่าน config,
manifest และสถานะรีจิสทรีแบบ cold เท่านั้น คำสั่งเหล่านี้ไม่ได้พิสูจน์ว่า Gateway
ที่กำลังทำงานอยู่ได้นำเข้าโค้ด Plugin เดียวกันแล้ว

เมื่อ Plugin แสดงว่าติดตั้งแล้ว แต่ทราฟฟิกแชทแบบสดไม่ได้ใช้งาน:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Gateway ที่จัดการให้จะรีสตาร์ทโดยอัตโนมัติหลังจากการติดตั้ง อัปเดต และถอนการติดตั้ง
Plugin ที่เปลี่ยนแหล่งที่มาของ Plugin บน VPS หรือการติดตั้งในคอนเทนเนอร์ ให้ตรวจสอบว่า
การรีสตาร์ทด้วยตนเองมุ่งไปที่ child ของ `openclaw gateway run` ตัวจริงที่ให้บริการ
ช่องทางของคุณ ไม่ใช่เพียง wrapper หรือ supervisor

## การแก้ไขปัญหา

| อาการ                                                        | ตรวจสอบ                                                                                                                                      | วิธีแก้ไข                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Plugin ปรากฏใน `plugins list` แต่ runtime hooks ไม่ทำงาน  | ใช้ `openclaw plugins inspect <id> --runtime --json` และยืนยัน Gateway ที่ใช้งานอยู่ด้วย `gateway status --deep --require-rpc`             | รีสตาร์ท Gateway สดหลังจากการติดตั้ง อัปเดต config หรือเปลี่ยนแหล่งที่มา                               |
| มี diagnostics เรื่องช่องทางซ้ำหรือความเป็นเจ้าของเครื่องมือปรากฏ         | รัน `openclaw plugins list --enabled --verbose` ตรวจสอบ Plugin ที่สงสัยแต่ละตัวด้วย `--runtime --json` และเปรียบเทียบความเป็นเจ้าของช่องทาง/เครื่องมือ | ปิดใช้งานเจ้าของหนึ่งราย ลบการติดตั้งเก่าที่ค้างอยู่ หรือใช้ manifest `preferOver` สำหรับการแทนที่โดยเจตนา      |
| config ระบุว่าไม่มี Plugin                                | ตรวจสอบ [รายการคลัง Plugin](/th/plugins/plugin-inventory) ว่าเป็นแบบ bundled, official external หรือ source-only                           | ติดตั้งแพ็กเกจภายนอก เปิดใช้งาน Plugin ที่ bundled หรือเอา config เก่าที่ค้างอยู่ออก                         |
| config ไม่ถูกต้องระหว่างการติดตั้ง                               | อ่านข้อความ validation และรัน `openclaw doctor --fix` เมื่อข้อความชี้ไปที่สถานะ Plugin เก่าที่ค้างอยู่                                           | Doctor สามารถกักกัน config ของ Plugin ที่ไม่ถูกต้องได้โดยปิดใช้งานรายการนั้นและลบ payload ที่ไม่ถูกต้อง     |
| เส้นทาง Plugin ถูกบล็อกเพราะความเป็นเจ้าของหรือสิทธิ์ที่น่าสงสัย | ตรวจสอบ diagnostic ก่อนข้อผิดพลาด config                                                                                             | แก้ไขความเป็นเจ้าของ/สิทธิ์ของระบบไฟล์ แล้วรัน `openclaw plugins registry --refresh`                    |
| `OPENCLAW_NIX_MODE=1` บล็อกคำสั่ง lifecycle                | ยืนยันว่าการติดตั้งถูกจัดการโดย Nix                                                                                                      | เปลี่ยนการเลือก Plugin ในซอร์สของ Nix แทนการใช้คำสั่ง mutator ของ Plugin                      |
| การนำเข้า dependency ล้มเหลวที่ runtime                             | ตรวจสอบว่า Plugin ติดตั้งผ่าน npm/git/ClawHub หรือโหลดจากเส้นทาง local                                                 | รัน `openclaw plugins update <id>` ติดตั้งซอร์สใหม่ หรือติดตั้ง dependency ของ Plugin local ด้วยตนเอง |

เมื่อ config ของ Plugin เก่าที่ยังค้างอยู่ยังอ้างชื่อ Plugin ช่องทางที่ไม่สามารถค้นพบได้อีกต่อไป
การเริ่มต้น Gateway จะข้ามช่องทางที่มี Plugin นั้นสนับสนุน แทนที่จะบล็อกช่องทางอื่นทั้งหมด
รัน `openclaw doctor --fix` เพื่อลบรายการ Plugin และช่องทางเก่าที่ค้างอยู่ คีย์ช่องทางที่ไม่รู้จัก
ซึ่งไม่มีหลักฐานว่าเป็น Plugin เก่าที่ยังค้างอยู่จะยังคงทำให้ validation ล้มเหลว
เพื่อให้การพิมพ์ผิดยังมองเห็นได้

สำหรับการแทนที่ช่องทางโดยเจตนา Plugin ที่ต้องการควรประกาศ
`channelConfigs.<channel-id>.preferOver` พร้อม id ของ Plugin เก่าหรือที่มีลำดับความสำคัญต่ำกว่า
หากเปิดใช้งาน Plugin ทั้งสองตัวอย่างชัดเจน OpenClaw จะเก็บคำขอนั้นไว้
และรายงาน diagnostics เรื่องช่องทางหรือเครื่องมือซ้ำ แทนที่จะเลือกเจ้าของหนึ่งรายอย่างเงียบ ๆ

หากแพ็กเกจที่ติดตั้งรายงานว่า `requires compiled runtime output for
TypeScript entry ...` แสดงว่าแพ็กเกจนั้นเผยแพร่โดยไม่มีไฟล์ JavaScript ที่
OpenClaw ต้องใช้ใน runtime ให้อัปเดตหรือติดตั้งใหม่หลังจากผู้เผยแพร่จัดส่ง
JavaScript ที่คอมไพล์แล้ว หรือปิดใช้งาน/ถอนการติดตั้ง Plugin ไปก่อน

### ความเป็นเจ้าของเส้นทาง Plugin ที่ถูกบล็อก

หาก diagnostics ของ Plugin ระบุว่า
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
และ validation ของ config ตามมาด้วย `plugin present but blocked` แสดงว่า OpenClaw พบ
ไฟล์ Plugin ที่เป็นของผู้ใช้ Unix คนละรายกับ process ที่กำลังโหลดไฟล์เหล่านั้น
ให้คง config ของ Plugin ไว้ แล้วแก้ไขความเป็นเจ้าของของระบบไฟล์ หรือรัน
OpenClaw ด้วยผู้ใช้เดียวกับที่เป็นเจ้าของไดเรกทอรี state

สำหรับการติดตั้ง Docker อิมเมจทางการรันเป็น `node` (uid `1000`) ดังนั้นไดเรกทอรี
config และ workspace ของ OpenClaw ที่ bind mount จาก host โดยปกติควรเป็นของ uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

หากคุณตั้งใจรัน OpenClaw เป็น root ให้ซ่อมแซม root ของ Plugin ที่จัดการให้เป็น
ความเป็นเจ้าของของ root แทน:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

หลังจากแก้ไขความเป็นเจ้าของแล้ว ให้รัน `openclaw doctor --fix` หรือ
`openclaw plugins registry --refresh` อีกครั้ง เพื่อให้รีจิสทรี Plugin ที่บันทึกไว้
ตรงกับไฟล์ที่ซ่อมแซมแล้ว

### การตั้งค่าเครื่องมือ Plugin ช้า

หาก turn ของ agent ดูเหมือนค้างขณะเตรียมเครื่องมือ ให้เปิดใช้งาน trace logging และ
ตรวจสอบบรรทัด timing ของ factory เครื่องมือ Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

มองหา:

```text
[trace:plugin-tools] factory timings ...
```

สรุปจะแสดงเวลา factory รวมและ factory เครื่องมือ Plugin ที่ช้าที่สุด
รวมถึง id ของ Plugin ชื่อเครื่องมือที่ประกาศไว้ รูปทรงผลลัพธ์ และเครื่องมือนั้นเป็น
optional หรือไม่ บรรทัดที่ช้าจะถูกยกระดับเป็นคำเตือนเมื่อ factory เดียวใช้เวลา
อย่างน้อย 1s หรือการเตรียม factory เครื่องมือ Plugin รวมใช้เวลาอย่างน้อย 5s

OpenClaw แคชผลลัพธ์ factory เครื่องมือ Plugin ที่สำเร็จสำหรับการ resolve ซ้ำ
ด้วยบริบทคำขอที่มีผลเหมือนเดิม คีย์แคชประกอบด้วย runtime config ที่มีผล,
workspace, id ของ agent/session, นโยบาย sandbox, การตั้งค่าเบราว์เซอร์,
บริบทการส่งมอบ, ตัวตนผู้ร้องขอ และสถานะความเป็นเจ้าของ ดังนั้น factory ที่พึ่งพา
ฟิลด์ที่เชื่อถือได้เหล่านั้นจะถูกรันใหม่เมื่อบริบทเปลี่ยน หาก timing ยังสูงอยู่
Plugin อาจกำลังทำงานที่มีค่าใช้จ่ายสูงก่อนส่งคืนคำจำกัดความเครื่องมือ

หาก Plugin หนึ่งตัวครอง timing ให้ตรวจสอบการลงทะเบียน runtime ของมัน:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

จากนั้นอัปเดต ติดตั้งใหม่ หรือปิดใช้งาน Plugin นั้น ผู้เขียน Plugin ควรย้าย
การโหลด dependency ที่มีค่าใช้จ่ายสูงไปไว้หลังเส้นทางการดำเนินการเครื่องมือ
แทนที่จะทำภายใน factory เครื่องมือ

สำหรับ root ของ dependency, validation ของ metadata แพ็กเกจ, ระเบียนรีจิสทรี,
พฤติกรรม reload ตอน startup และการล้างของเก่า โปรดดู
[การ resolve dependency ของ Plugin](/th/plugins/dependency-resolution)

## ที่เกี่ยวข้อง

- [จัดการ Plugin](/th/plugins/manage-plugins) - ตัวอย่างคำสั่งสำหรับ list, install, update, uninstall และ publish
- [`openclaw plugins`](/th/cli/plugins) - เอกสารอ้างอิง CLI ฉบับเต็ม
- [รายการคลัง Plugin](/th/plugins/plugin-inventory) - รายการ Plugin ที่ bundled และภายนอกที่สร้างขึ้น
- [เอกสารอ้างอิง Plugin](/th/plugins/reference) - หน้าเอกสารอ้างอิงราย Plugin ที่สร้างขึ้น
- [Plugin ชุมชน](/th/plugins/community) - การค้นพบ ClawHub และนโยบาย PR เอกสาร
- [การ resolve dependency ของ Plugin](/th/plugins/dependency-resolution) - root การติดตั้ง ระเบียนรีจิสทรี และขอบเขต runtime
- [การสร้าง Plugin](/th/plugins/building-plugins) - คู่มือการเขียน Plugin native
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview) - การลงทะเบียน runtime, hooks และฟิลด์ API
- [Plugin manifest](/th/plugins/manifest) - manifest และ metadata ของแพ็กเกจ
