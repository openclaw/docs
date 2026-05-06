---
read_when:
    - การติดตั้งหรือกำหนดค่า Plugin
    - ทำความเข้าใจกฎการค้นพบและการโหลด Plugin
    - การทำงานกับชุด Plugin ที่เข้ากันได้กับ Codex/Claude
sidebarTitle: Install and Configure
summary: ติดตั้ง กำหนดค่า และจัดการ Plugin ของ OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-06T18:01:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef355ac480bce7140049f59d3d01909de2cf2fdf80ad07db62e05ee997840c81
    source_path: tools/plugin.md
    workflow: 16
---

Plugin ขยาย OpenClaw ด้วยความสามารถใหม่ ๆ: ช่องทาง, ผู้ให้บริการโมเดล,
agent harnesses, เครื่องมือ, Skills, เสียงพูด, การถอดเสียงแบบเรียลไทม์, เสียงแบบเรียลไทม์,
การทำความเข้าใจสื่อ, การสร้างรูปภาพ, การสร้างวิดีโอ, การดึงข้อมูลเว็บ, การค้นหาเว็บ,
และอื่น ๆ Plugin บางตัวเป็น **แกนหลัก** (มาพร้อมกับ OpenClaw) ส่วนตัวอื่น ๆ
เป็น **ภายนอก** Plugin ภายนอกส่วนใหญ่เผยแพร่และค้นพบผ่าน
[ClawHub](/th/tools/clawhub) npm ยังคงรองรับสำหรับการติดตั้งโดยตรง และสำหรับชุดชั่วคราว
ของแพ็กเกจ Plugin ที่ OpenClaw เป็นเจ้าของระหว่างที่การย้ายนี้เสร็จสิ้น

## เริ่มต้นอย่างรวดเร็ว

สำหรับตัวอย่างการติดตั้งแบบคัดลอกวาง, การแสดงรายการ, การถอนการติดตั้ง, การอัปเดต,
และการเผยแพร่ โปรดดู
[จัดการ Plugin](/th/plugins/manage-plugins)

<Steps>
  <Step title="ดูว่ามีอะไรโหลดอยู่">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="ติดตั้ง Plugin">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin
    openclaw plugins install npm-pack:./openclaw-plugin-1.2.3.tgz

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="รีสตาร์ท Gateway">
    ```bash
    openclaw gateway restart
    ```

    จากนั้นกำหนดค่าภายใต้ `plugins.entries.\<id\>.config` ในไฟล์ config ของคุณ

  </Step>

  <Step title="การจัดการแบบเนทีฟในแชต">
    ใน Gateway ที่กำลังทำงานอยู่ `/plugins enable` และ `/plugins disable`
    สำหรับเจ้าของเท่านั้นจะทริกเกอร์ตัวโหลด config ใหม่ของ Gateway Gateway จะโหลดพื้นผิวรันไทม์
    ของ Plugin ใหม่ในโปรเซส และ agent turn ใหม่จะสร้างรายการเครื่องมือขึ้นใหม่จาก
    registry ที่รีเฟรชแล้ว `/plugins install` เปลี่ยนซอร์สโค้ดของ Plugin ดังนั้น
    Gateway จะร้องขอการรีสตาร์ทแทนการแสร้งว่าโปรเซสปัจจุบันสามารถ
    โหลดโมดูลที่นำเข้าไปแล้วใหม่ได้อย่างปลอดภัย

  </Step>

  <Step title="ตรวจสอบ Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    ใช้ `--runtime` เมื่อคุณต้องพิสูจน์เครื่องมือ, บริการ, เมธอด Gateway,
    hooks, หรือคำสั่ง CLI ที่ Plugin เป็นเจ้าของซึ่งลงทะเบียนไว้ `inspect` แบบธรรมดาเป็นการตรวจสอบ manifest/registry
    แบบ cold และตั้งใจหลีกเลี่ยงการนำเข้ารันไทม์ของ Plugin

  </Step>
</Steps>

หากคุณต้องการการควบคุมแบบเนทีฟในแชต ให้เปิดใช้ `commands.plugins: true` และใช้:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

พาธการติดตั้งใช้ resolver เดียวกับ CLI: พาธ/ไฟล์ archive ในเครื่อง, `clawhub:<pkg>` แบบชัดเจน,
`npm:<pkg>` แบบชัดเจน, `npm-pack:<path.tgz>` แบบชัดเจน,
`git:<repo>` แบบชัดเจน, หรือ package spec แบบเปล่าผ่าน npm

หาก config ไม่ถูกต้อง การติดตั้งโดยปกติจะล้มเหลวแบบปิดและชี้คุณไปที่
`openclaw doctor --fix` ข้อยกเว้นสำหรับการกู้คืนเพียงอย่างเดียวคือพาธการติดตั้ง Plugin ที่มาพร้อมระบบใหม่
แบบแคบสำหรับ Plugin ที่เลือกใช้
`openclaw.install.allowInvalidConfigRecovery`
ระหว่างการเริ่มต้น Gateway config ของ Plugin ที่ไม่ถูกต้องจะล้มเหลวแบบปิดเหมือน config ที่ไม่ถูกต้องอื่น ๆ
เรียกใช้ `openclaw doctor --fix` เพื่อกักกัน config ของ Plugin ที่เสียโดย
ปิดใช้งาน entry ของ Plugin นั้นและลบ payload config ที่ไม่ถูกต้องออก; การสำรองข้อมูล config ปกติ
จะเก็บค่าก่อนหน้าไว้
เมื่อ config ของช่องทางอ้างอิง Plugin ที่ค้นพบไม่ได้อีกต่อไป แต่
id ของ Plugin เก่าตัวเดิมยังคงอยู่ใน config ของ Plugin หรือระเบียนการติดตั้ง การเริ่มต้น Gateway
จะบันทึกคำเตือนและข้ามช่องทางนั้นแทนการบล็อกช่องทางอื่นทั้งหมด
เรียกใช้ `openclaw doctor --fix` เพื่อลบ entry ช่องทาง/Plugin เก่า; คีย์ช่องทางที่ไม่รู้จัก
ซึ่งไม่มีหลักฐาน Plugin เก่ายังคงทำให้การตรวจสอบไม่ผ่าน เพื่อให้การพิมพ์ผิดยังมองเห็นได้
หากตั้งค่า `plugins.enabled: false` การอ้างอิง Plugin เก่าจะถูกถือว่าเฉื่อย:
การเริ่มต้น Gateway จะข้ามงานค้นพบ/โหลด Plugin และ `openclaw doctor` จะคง
config ของ Plugin ที่ปิดใช้งานไว้แทนการลบโดยอัตโนมัติ เปิดใช้งาน Plugin อีกครั้งก่อน
เรียกใช้การล้างข้อมูลด้วย doctor หากคุณต้องการลบ id Plugin เก่า

การติดตั้ง dependency ของ Plugin เกิดขึ้นเฉพาะระหว่าง flow การติดตั้ง/อัปเดตที่ชัดเจน หรือ
การซ่อมแซมด้วย doctor เท่านั้น การเริ่มต้น Gateway, การโหลด config ใหม่, และการตรวจสอบรันไทม์
จะไม่เรียก package manager หรือซ่อม dependency tree Plugin ในเครื่องต้อง
ติดตั้ง dependency ไว้แล้ว ส่วน Plugin จาก npm, git, และ ClawHub จะ
ติดตั้งภายใต้ราก Plugin ที่ OpenClaw จัดการ dependency ของ npm อาจถูก hoist
ภายในราก npm ที่ OpenClaw จัดการ; การติดตั้ง/อัปเดตจะสแกนรากที่จัดการนั้นก่อน
การ trust และการถอนการติดตั้งจะลบแพ็กเกจที่ npm จัดการผ่าน npm Plugin ภายนอก
และพาธโหลดแบบกำหนดเองยังต้องติดตั้งผ่าน `openclaw plugins install`
ใช้ `openclaw plugins list --json` เพื่อดู `dependencyStatus` แบบสแตติกสำหรับแต่ละ
Plugin ที่มองเห็นได้ โดยไม่นำเข้าโค้ดรันไทม์หรือซ่อม dependency
ดู [การแก้ dependency ของ Plugin](/th/plugins/dependency-resolution) สำหรับ
วงจรชีวิตในเวลา install

### ความเป็นเจ้าของพาธ Plugin ที่ถูกบล็อก

หาก diagnostics ของ Plugin แจ้งว่า
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
และการตรวจสอบ config ตามมาด้วย `plugin present but blocked` หมายความว่า OpenClaw พบ
ไฟล์ Plugin ที่เป็นของผู้ใช้ Unix คนละคนกับโปรเซสที่กำลังโหลดไฟล์เหล่านั้น
เก็บ config ของ Plugin ไว้ตามเดิม; แก้ความเป็นเจ้าของในระบบไฟล์ หรือเรียกใช้
OpenClaw ด้วยผู้ใช้เดียวกับที่เป็นเจ้าของไดเรกทอรี state

สำหรับการติดตั้ง Docker อิมเมจทางการทำงานเป็น `node` (uid `1000`) ดังนั้น
ไดเรกทอรี config และ workspace ของ OpenClaw ที่ bind mount จากโฮสต์โดยปกติควรเป็น
ของ uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

หากคุณตั้งใจเรียกใช้ OpenClaw เป็น root ให้ซ่อมราก Plugin ที่จัดการให้เป็น
ความเป็นเจ้าของของ root แทน:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

หลังแก้ความเป็นเจ้าของแล้ว ให้เรียกใช้ `openclaw doctor --fix` อีกครั้ง หรือ
`openclaw plugins registry --refresh` เพื่อให้ registry ของ Plugin ที่ persist ไว้ตรงกับ
ไฟล์ที่ซ่อมแล้ว

สำหรับการติดตั้ง npm selector ที่เปลี่ยนแปลงได้ เช่น `latest` หรือ dist-tag จะถูก resolve
ก่อนการติดตั้ง จากนั้น pin ไปยังเวอร์ชันที่ตรวจสอบแล้วแบบ exact ในราก npm
ที่ OpenClaw จัดการ หลัง npm เสร็จสิ้น OpenClaw จะตรวจสอบว่า entry
`package-lock.json` ที่ติดตั้งยังตรงกับเวอร์ชันและ integrity ที่ resolve แล้ว หาก
npm เขียน metadata ของแพ็กเกจที่ต่างออกไป การติดตั้งจะล้มเหลวและแพ็กเกจที่จัดการ
จะถูก rollback แทนการยอมรับ artifact Plugin ที่ต่างออกไป
ราก npm ที่จัดการยังสืบทอด `overrides` ของ npm ระดับแพ็กเกจของ OpenClaw ดังนั้น
security pin ที่ปกป้อง host ที่แพ็กเกจไว้จะมีผลกับ dependency ของ Plugin ภายนอก
ที่ถูก hoist ด้วย

source checkout เป็น pnpm workspace หากคุณ clone OpenClaw เพื่อแก้ไข Plugin ที่มาพร้อมระบบ
ให้เรียกใช้ `pnpm install`; จากนั้น OpenClaw จะโหลด Plugin ที่มาพร้อมระบบจาก
`extensions/<id>` เพื่อให้การแก้ไขและ dependency ระดับแพ็กเกจในเครื่องถูกใช้โดยตรง
การติดตั้ง npm root แบบธรรมดามีไว้สำหรับ OpenClaw ที่แพ็กเกจแล้ว ไม่ใช่การพัฒนา
source checkout

## ประเภทของ Plugin

OpenClaw รู้จักรูปแบบ Plugin สองแบบ:

| รูปแบบ     | วิธีการทำงาน                                                       | ตัวอย่าง                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **เนทีฟ** | `openclaw.plugin.json` + โมดูลรันไทม์; ทำงานในโปรเซส       | Plugin ทางการ, แพ็กเกจ npm ของชุมชน               |
| **บันเดิล** | เลย์เอาต์ที่เข้ากันได้กับ Codex/Claude/Cursor; แมปเป็นฟีเจอร์ของ OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

ทั้งสองแบบจะแสดงภายใต้ `openclaw plugins list` ดู [บันเดิล Plugin](/th/plugins/bundles) สำหรับรายละเอียดบันเดิล

หากคุณกำลังเขียน Plugin แบบเนทีฟ ให้เริ่มจาก [การสร้าง Plugin](/th/plugins/building-plugins)
และ [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## entrypoint ของแพ็กเกจ

แพ็กเกจ npm ของ Plugin แบบเนทีฟต้องประกาศ `openclaw.extensions` ใน `package.json`
entry แต่ละรายการต้องอยู่ภายในไดเรกทอรีแพ็กเกจ และ resolve ไปยัง
ไฟล์รันไทม์ที่อ่านได้ หรือไปยังไฟล์ซอร์ส TypeScript ที่มี peer JavaScript ที่ build แล้วซึ่งอนุมานได้
เช่น `src/index.ts` ไปยัง `dist/index.js`
การติดตั้งแบบแพ็กเกจต้องส่ง output รันไทม์ JavaScript นั้นมาด้วย fallback
ซอร์ส TypeScript มีไว้สำหรับ source checkout และพาธการพัฒนาในเครื่อง ไม่ใช่สำหรับ
แพ็กเกจ npm ที่ติดตั้งลงในราก Plugin ที่ OpenClaw จัดการ

หากคำเตือนของแพ็กเกจที่จัดการแจ้งว่า `requires compiled runtime output for
TypeScript entry ...` แปลว่าแพ็กเกจถูกเผยแพร่โดยไม่มีไฟล์ JavaScript
ที่ OpenClaw ต้องใช้ในรันไทม์ นั่นเป็นปัญหาการแพ็กเกจของ Plugin ไม่ใช่ปัญหา config
ในเครื่อง อัปเดตหรือติดตั้ง Plugin ใหม่หลังผู้เผยแพร่เผยแพร่ JavaScript ที่ compile แล้ว
อีกครั้ง หรือปิดใช้งาน/ถอนการติดตั้ง Plugin นั้นจนกว่าจะมีแพ็กเกจที่แก้ไขแล้ว

ใช้ `openclaw.runtimeExtensions` เมื่อไฟล์รันไทม์ที่เผยแพร่ไม่ได้อยู่ที่
พาธเดียวกับ entry ของซอร์ส เมื่อมีอยู่ `runtimeExtensions` ต้องมี
หนึ่ง entry สำหรับทุก entry ใน `extensions` อย่างพอดี รายการที่ไม่ตรงกันจะทำให้การติดตั้งและ
การค้นพบ Plugin ล้มเหลว แทนการ fallback ไปยังพาธซอร์สอย่างเงียบ ๆ หากคุณยัง
เผยแพร่ `openclaw.setupEntry` ให้ใช้ `openclaw.runtimeSetupEntry` สำหรับ peer
JavaScript ที่ build แล้ว; ไฟล์นั้นจำเป็นเมื่อประกาศไว้

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Plugin ทางการ

### แพ็กเกจ npm ที่ OpenClaw เป็นเจ้าของระหว่างการย้าย

ClawHub เป็นพาธการเผยแพร่หลักสำหรับ Plugin ส่วนใหญ่ release ของ OpenClaw แบบแพ็กเกจในปัจจุบัน
มี Plugin ทางการจำนวนมากมาพร้อมอยู่แล้ว ดังนั้นโดยปกติจึงไม่ต้อง
ติดตั้ง npm แยกต่างหากใน setup ทั่วไป จนกว่า Plugin ที่ OpenClaw เป็นเจ้าของทุกตัวจะ
ย้ายไป ClawHub เสร็จ OpenClaw ยังจัดส่งแพ็กเกจ Plugin `@openclaw/*` บางส่วนบน
npm สำหรับการติดตั้งเก่า/แบบกำหนดเอง และ workflow npm โดยตรง

หาก npm รายงานว่าแพ็กเกจ Plugin `@openclaw/*` ถูก deprecate แปลว่าเวอร์ชันแพ็กเกจนั้น
มาจาก train แพ็กเกจภายนอกที่เก่ากว่า ใช้ Plugin ที่มาพร้อมกับ
OpenClaw ปัจจุบัน หรือ checkout ในเครื่อง จนกว่าจะมีแพ็กเกจ npm ที่ใหม่กว่าเผยแพร่

| Plugin          | แพ็กเกจ                    | เอกสาร                                       |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/th/channels/bluebubbles)       |
| Discord         | `@openclaw/discord`        | [Discord](/th/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/th/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/th/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/th/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/th/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/th/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/th/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/th/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/th/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/th/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/th/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/th/plugins/zalouser)         |

### แกนหลัก (มาพร้อมกับ OpenClaw)

<AccordionGroup>
  <Accordion title="ผู้ให้บริการโมเดล (เปิดใช้โดยค่าเริ่มต้น)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin หน่วยความจำ">
    - `memory-core` - การค้นหาหน่วยความจำแบบบันเดิล (ค่าเริ่มต้นผ่าน `plugins.slots.memory`)
    - `memory-lancedb` - หน่วยความจำระยะยาวที่รองรับด้วย LanceDB พร้อมการเรียกคืน/จับภาพอัตโนมัติ (ตั้งค่า `plugins.slots.memory = "memory-lancedb"`)

    ดู [Memory LanceDB](/th/plugins/memory-lancedb) สำหรับการตั้งค่า embedding ที่เข้ากันได้กับ OpenAI,
    ตัวอย่าง Ollama, ขีดจำกัดการเรียกคืน และการแก้ปัญหา

  </Accordion>

  <Accordion title="ผู้ให้บริการเสียงพูด (เปิดใช้งานตามค่าเริ่มต้น)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="อื่นๆ">
    - `browser` - Plugin เบราว์เซอร์แบบบันเดิลสำหรับเครื่องมือเบราว์เซอร์, CLI `openclaw browser`, เมธอด Gateway `browser.request`, รันไทม์เบราว์เซอร์ และบริการควบคุมเบราว์เซอร์เริ่มต้น (เปิดใช้งานตามค่าเริ่มต้น; ปิดใช้งานก่อนแทนที่)
    - `copilot-proxy` - บริดจ์ VS Code Copilot Proxy (ปิดใช้งานตามค่าเริ่มต้น)

  </Accordion>
</AccordionGroup>

กำลังมองหา Plugin จากบุคคลที่สามอยู่ใช่ไหม? ดู [Plugin ชุมชน](/th/plugins/community)

## การกำหนดค่า

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| ฟิลด์              | คำอธิบาย                                               |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | สวิตช์หลัก (ค่าเริ่มต้น: `true`)                           |
| `allow`            | รายการอนุญาตของ Plugin (ไม่บังคับ)                               |
| `bundledDiscovery` | โหมดการค้นพบ Plugin แบบบันเดิล (ค่าเริ่มต้นคือ `allowlist`)    |
| `deny`             | รายการปฏิเสธของ Plugin (ไม่บังคับ; deny มีผลเหนือกว่า)                     |
| `load.paths`       | ไฟล์/ไดเรกทอรี Plugin เพิ่มเติม                            |
| `slots`            | ตัวเลือกสล็อตแบบเอกสิทธิ์ (เช่น `memory`, `contextEngine`) |
| `entries.\<id\>`   | สวิตช์เปิด/ปิดและการกำหนดค่าต่อ Plugin                               |

`plugins.allow` เป็นแบบเอกสิทธิ์ เมื่อไม่ว่างเปล่า จะโหลดได้เฉพาะ Plugin ที่ระบุไว้
หรือเปิดเผยเครื่องมือได้ แม้ว่า `tools.allow` จะมี `"*"` หรือชื่อเครื่องมือที่
Plugin เป็นเจ้าของแบบเจาะจงก็ตาม หากรายการอนุญาตของเครื่องมืออ้างอิงเครื่องมือของ Plugin ให้เพิ่ม id ของ Plugin เจ้าของ
ลงใน `plugins.allow` หรือเอา `plugins.allow` ออก; `openclaw doctor` จะเตือนเกี่ยวกับ
รูปแบบนี้

`plugins.bundledDiscovery` มีค่าเริ่มต้นเป็น `"allowlist"` สำหรับการกำหนดค่าใหม่ ดังนั้น
รายการ `plugins.allow` ที่เข้มงวดจะบล็อก Plugin ผู้ให้บริการแบบบันเดิลที่ไม่ได้ระบุไว้ด้วย
รวมถึงการค้นพบผู้ให้บริการค้นหาเว็บของรันไทม์ Doctor จะประทับการกำหนดค่า
รายการอนุญาตแบบเข้มงวดรุ่นเก่าด้วย `"compat"` ระหว่างการย้ายข้อมูล เพื่อให้การอัปเกรดยังคง
พฤติกรรมผู้ให้บริการแบบบันเดิลเดิมไว้จนกว่าผู้ปฏิบัติการจะเลือกใช้โหมดที่เข้มงวดขึ้น
`plugins.allow` ที่ว่างเปล่ายังคงถูกมองว่าไม่ได้ตั้งค่า/เปิดอยู่

การเปลี่ยนแปลงการกำหนดค่าที่ทำผ่าน `/plugins enable` หรือ `/plugins disable` จะทริกเกอร์
การโหลด Plugin ของ Gateway ใหม่ภายในกระบวนการ เทิร์นใหม่ของเอเจนต์จะสร้างรายการเครื่องมือใหม่จาก
รีจิสทรี Plugin ที่รีเฟรชแล้ว การดำเนินการที่เปลี่ยนแหล่งที่มา เช่น install,
update และ uninstall ยังคงรีสตาร์ทกระบวนการ Gateway เพราะโมดูล
Plugin ที่นำเข้าแล้วไม่สามารถแทนที่ในที่เดิมได้อย่างปลอดภัย

`openclaw plugins list` คือสแนปช็อตรีจิสทรี/การกำหนดค่า Plugin ภายในเครื่อง
Plugin ที่เป็น `enabled` ตรงนั้นหมายความว่ารีจิสทรีที่บันทึกไว้และการกำหนดค่าปัจจุบันอนุญาตให้
Plugin เข้าร่วมได้ ไม่ได้พิสูจน์ว่า Gateway ระยะไกลที่กำลังทำงานอยู่
โหลดใหม่หรือรีสตาร์ทเข้าสู่โค้ด Plugin เดียวกันแล้ว ในการตั้งค่า VPS/คอนเทนเนอร์
ที่มีกระบวนการ wrapper ให้ส่งการรีสตาร์ทหรือการเขียนที่ทริกเกอร์การโหลดใหม่ไปยังกระบวนการ
`openclaw gateway run` จริง หรือใช้ `openclaw gateway restart` กับ
Gateway ที่กำลังทำงานอยู่เมื่อการโหลดใหม่รายงานความล้มเหลว

<Accordion title="สถานะของ Plugin: ปิดใช้งาน เทียบกับ หายไป เทียบกับ ไม่ถูกต้อง">
  - **ปิดใช้งาน**: มี Plugin อยู่ แต่กฎการเปิดใช้งานปิดไว้ การกำหนดค่าถูกเก็บรักษาไว้
  - **หายไป**: การกำหนดค่าอ้างอิง id ของ Plugin ที่การค้นหาไม่พบ
  - **ไม่ถูกต้อง**: มี Plugin อยู่ แต่การกำหนดค่าไม่ตรงกับ schema ที่ประกาศไว้ การเริ่มต้น Gateway จะข้ามเฉพาะ Plugin นั้น; `openclaw doctor --fix` สามารถกักกันรายการที่ไม่ถูกต้องโดยปิดใช้งานและเอา payload การกำหนดค่าออกได้

</Accordion>

## การค้นพบและลำดับความสำคัญ

OpenClaw สแกนหา Plugin ตามลำดับนี้ (รายการแรกที่ตรงกันจะชนะ):

<Steps>
  <Step title="พาธการกำหนดค่า">
    `plugins.load.paths` - พาธไฟล์หรือไดเรกทอรีที่ระบุอย่างชัดเจน พาธที่ชี้
    กลับไปยังไดเรกทอรี Plugin แบบบันเดิลที่แพ็กเกจมากับ OpenClaw เองจะถูกละเว้น;
    รัน `openclaw doctor --fix` เพื่อลบ alias เก่าเหล่านั้น
  </Step>

  <Step title="Plugin ของ workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` และ `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin ส่วนกลาง">
    `~/.openclaw/<plugin-root>/*.ts` และ `~/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin แบบบันเดิล">
    จัดส่งมากับ OpenClaw หลายรายการเปิดใช้งานตามค่าเริ่มต้น (ผู้ให้บริการโมเดล, เสียงพูด)
    รายการอื่นต้องเปิดใช้งานอย่างชัดเจน
  </Step>
</Steps>

การติดตั้งแบบแพ็กเกจและอิมเมจ Docker โดยปกติจะ resolve Plugin แบบบันเดิลจาก
ทรี `dist/extensions` ที่คอมไพล์แล้ว หากไดเรกทอรีซอร์สของ Plugin แบบบันเดิลถูก
bind-mounted ทับพาธซอร์สแพ็กเกจที่ตรงกัน เช่น
`/app/extensions/synology-chat` OpenClaw จะมองไดเรกทอรีซอร์สที่เมานต์นั้น
เป็น source overlay แบบบันเดิลและค้นพบก่อนบันเดิลแพ็กเกจ
`/app/dist/extensions/synology-chat` วิธีนี้ช่วยให้ลูปคอนเทนเนอร์ของผู้ดูแล
ทำงานได้โดยไม่ต้องสลับ Plugin แบบบันเดิลทุกรายการกลับไปเป็นซอร์ส TypeScript
ตั้งค่า `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` เพื่อบังคับใช้บันเดิล dist ที่แพ็กเกจแล้ว
แม้จะมีการเมานต์ source overlay อยู่ก็ตาม

### กฎการเปิดใช้งาน

- `plugins.enabled: false` ปิดใช้งาน Plugin ทั้งหมด และข้ามงานค้นพบ/โหลด Plugin
- `plugins.deny` มีผลเหนือกว่า allow เสมอ
- `plugins.entries.\<id\>.enabled: false` ปิดใช้งาน Plugin นั้น
- Plugin ที่มาจาก workspace จะ **ปิดใช้งานตามค่าเริ่มต้น** (ต้องเปิดใช้งานอย่างชัดเจน)
- Plugin แบบบันเดิลทำตามชุดเปิดใช้งานเริ่มต้นในตัว เว้นแต่จะถูก override
- สล็อตแบบเอกสิทธิ์สามารถบังคับเปิดใช้งาน Plugin ที่เลือกสำหรับสล็อตนั้นได้
- Plugin แบบบันเดิลบางตัวที่ต้อง opt-in จะเปิดใช้งานโดยอัตโนมัติเมื่อการกำหนดค่าระบุ
  surface ที่ Plugin เป็นเจ้าของ เช่น ref โมเดลผู้ให้บริการ, การกำหนดค่าช่องทาง หรือรันไทม์
  harness
- การกำหนดค่า Plugin เก่าจะถูกเก็บรักษาไว้ขณะ `plugins.enabled: false` ทำงานอยู่;
  เปิดใช้งาน Plugin อีกครั้งก่อนรันการล้างข้อมูลของ doctor หากต้องการลบ id เก่า
- เส้นทาง Codex ตระกูล OpenAI จะรักษาขอบเขต Plugin แยกกัน:
  `openai-codex/*` เป็นของ Plugin OpenAI ส่วน Plugin app-server Codex
  แบบบันเดิลจะถูกเลือกโดย `agentRuntime.id: "codex"` หรือ ref โมเดล
  `codex/*` แบบเดิม

## การแก้ปัญหา hooks ของรันไทม์

หาก Plugin ปรากฏใน `plugins list` แต่ side effect หรือ hooks ของ `register(api)`
ไม่ทำงานในทราฟฟิกแชทสด ให้ตรวจสอบสิ่งเหล่านี้ก่อน:

- รัน `openclaw gateway status --deep --require-rpc` และยืนยันว่า URL,
  โปรไฟล์, พาธการกำหนดค่า และกระบวนการของ Gateway ที่ใช้งานอยู่คือรายการที่คุณกำลังแก้ไข
- รีสตาร์ท Gateway สดหลังการเปลี่ยนแปลง install/config/code ของ Plugin ในคอนเทนเนอร์แบบ wrapper
  PID 1 อาจเป็นเพียง supervisor; รีสตาร์ทหรือส่งสัญญาณไปยังกระบวนการลูก
  `openclaw gateway run`
- ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อยืนยันการลงทะเบียน hook และ
  diagnostics hooks การสนทนาที่ไม่ใช่แบบบันเดิล เช่น `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` และ `agent_end` ต้องใช้
  `plugins.entries.<id>.hooks.allowConversationAccess=true`
- สำหรับการสลับโมเดล ให้ใช้ `before_model_resolve` เป็นหลัก มันทำงานก่อนการ resolve โมเดล
  สำหรับเทิร์นของเอเจนต์; `llm_output` จะทำงานหลังจากความพยายามใช้โมเดล
  สร้างเอาต์พุตของผู้ช่วยแล้วเท่านั้น
- สำหรับหลักฐานของโมเดลเซสชันที่มีผลจริง ให้ใช้ `openclaw sessions` หรือ
  surface เซสชัน/สถานะของ Gateway และเมื่อดีบัก payload ของผู้ให้บริการ ให้เริ่ม
  Gateway ด้วย `--raw-stream --raw-stream-path <path>`

### การตั้งค่าเครื่องมือ Plugin ช้า

หากเทิร์นของเอเจนต์ดูเหมือนค้างขณะเตรียมเครื่องมือ ให้เปิดใช้งาน trace logging และ
ตรวจสอบบรรทัดเวลา factory ของเครื่องมือ Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

มองหา:

```text
[trace:plugin-tools] factory timings ...
```

สรุปจะแสดงเวลารวมของ factory และ factory เครื่องมือ Plugin ที่ช้าที่สุด
รวมถึง id ของ Plugin, ชื่อเครื่องมือที่ประกาศไว้, รูปร่างผลลัพธ์ และเครื่องมือนั้น
เป็น optional หรือไม่ บรรทัดที่ช้าจะถูกยกระดับเป็นคำเตือนเมื่อ factory รายเดียวใช้เวลา
อย่างน้อย 1 วินาที หรือการเตรียม factory เครื่องมือ Plugin ทั้งหมดใช้เวลาอย่างน้อย 5 วินาที

OpenClaw แคชผลลัพธ์ factory เครื่องมือ Plugin ที่สำเร็จสำหรับการ resolve ซ้ำ
ด้วยบริบทคำขอที่มีผลเดียวกัน คีย์แคชรวมถึงการกำหนดค่ารันไทม์ที่มีผล,
workspace, id เอเจนต์/เซสชัน, นโยบาย sandbox, การตั้งค่าเบราว์เซอร์,
บริบทการส่งมอบ, ตัวตนผู้ร้องขอ และสถานะความเป็นเจ้าของ ดังนั้น factory ที่
ขึ้นกับฟิลด์ที่เชื่อถือได้เหล่านั้นจะถูกรันใหม่เมื่อบริบทเปลี่ยน

หาก Plugin หนึ่งครองเวลาส่วนใหญ่ ให้ตรวจสอบการลงทะเบียนรันไทม์ของมัน:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

จากนั้นอัปเดต ติดตั้งใหม่ หรือปิดใช้งาน Plugin นั้น ผู้เขียน Plugin ควรย้าย
การโหลด dependency ที่มีค่าใช้จ่ายสูงไปไว้ด้านหลังเส้นทางการเรียกใช้เครื่องมือ แทนที่จะทำ
ภายใน tool factory

### การเป็นเจ้าของช่องทางหรือเครื่องมือซ้ำกัน

อาการ:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

สิ่งเหล่านี้หมายความว่ามี Plugin ที่เปิดใช้งานมากกว่าหนึ่งรายการพยายามเป็นเจ้าของช่องทางเดียวกัน,
โฟลว์การตั้งค่าเดียวกัน หรือชื่อเครื่องมือเดียวกัน สาเหตุที่พบบ่อยที่สุดคือ Plugin ช่องทางภายนอก
ถูกติดตั้งข้าง Plugin แบบบันเดิลที่ตอนนี้ให้ id ช่องทางเดียวกัน

ขั้นตอนการดีบัก:

- รัน `openclaw plugins list --enabled --verbose` เพื่อดู Plugin ที่เปิดใช้งานทุกตัว
  และต้นทาง
- รัน `openclaw plugins inspect <id> --runtime --json` สำหรับ Plugin ที่สงสัยแต่ละตัว และ
  เปรียบเทียบ `channels`, `channelConfigs`, `tools` และ diagnostics
- รัน `openclaw plugins registry --refresh` หลังติดตั้งหรือลบ
  แพ็กเกจ Plugin เพื่อให้เมทาดาทาที่บันทึกไว้สะท้อนการติดตั้งปัจจุบัน
- รีสตาร์ท Gateway หลังการเปลี่ยนแปลง install, registry หรือ config

ตัวเลือกการแก้ไข:

- หาก Plugin หนึ่งตั้งใจแทนที่อีกตัวสำหรับ id ช่องทางเดียวกัน
  Plugin ที่ต้องการควรประกาศ `channelConfigs.<channel-id>.preferOver` พร้อม
  id ของ Plugin ที่มีลำดับความสำคัญต่ำกว่า ดู [/plugins/manifest#replacing-another-channel-plugin](/th/plugins/manifest#replacing-another-channel-plugin)
- หากรายการซ้ำเกิดโดยไม่ตั้งใจ ให้ปิดใช้งานด้านหนึ่งด้วย
  `plugins.entries.<plugin-id>.enabled: false` หรือเอาการติดตั้ง Plugin
  เก่าออก
- หากคุณเปิดใช้งานทั้งสอง Plugin อย่างชัดเจน OpenClaw จะคงคำขอนั้นไว้และ
  รายงานความขัดแย้ง เลือกเจ้าของเดียวสำหรับช่องทาง หรือเปลี่ยนชื่อเครื่องมือที่ Plugin เป็นเจ้าของ
  เพื่อให้ surface ของรันไทม์ไม่กำกวม

## สล็อต Plugin (หมวดหมู่เอกสิทธิ์)

บางหมวดหมู่เป็นแบบเอกสิทธิ์ (ใช้งานได้ครั้งละหนึ่งตัวเท่านั้น):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| สล็อต            | สิ่งที่ควบคุม      | ค่าเริ่มต้น             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin หน่วยความจำที่ใช้งานอยู่  | `memory-core`       |
| `contextEngine` | เอนจินบริบทที่ใช้งานอยู่ | `legacy` (ในตัว) |

## อ้างอิง CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install from npm by default
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugin ที่บันเดิลมาจะมาพร้อมกับ OpenClaw หลายรายการเปิดใช้งานตามค่าเริ่มต้น (เช่น
ผู้ให้บริการโมเดลที่บันเดิลมา, ผู้ให้บริการเสียงพูดที่บันเดิลมา และ
Plugin เบราว์เซอร์ที่บันเดิลมา) Plugin ที่บันเดิลมาอื่น ๆ ยังต้องใช้ `openclaw plugins enable <id>`

`--force` เขียนทับ Plugin หรือ hook pack ที่ติดตั้งอยู่แล้ว ณ ตำแหน่งเดิม ใช้
`openclaw plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติของ Plugin npm
ที่ติดตามอยู่ ไม่รองรับการใช้ร่วมกับ `--link` ซึ่งจะใช้พาธต้นทางซ้ำแทน
การคัดลอกทับเป้าหมายการติดตั้งที่จัดการอยู่

เมื่อกำหนด `plugins.allow` ไว้แล้ว `openclaw plugins install` จะเพิ่ม
id ของ Plugin ที่ติดตั้งเข้าไปใน allowlist นั้นก่อนเปิดใช้งาน หาก id ของ Plugin เดียวกัน
มีอยู่ใน `plugins.deny` การติดตั้งจะลบรายการ deny ที่ค้างอยู่นั้นออก เพื่อให้
การติดตั้งที่ระบุอย่างชัดเจนโหลดได้ทันทีหลังรีสตาร์ต

OpenClaw เก็บรีจิสทรี Plugin ภายในเครื่องแบบถาวรไว้เป็นโมเดลอ่านแบบ cold สำหรับ
คลัง Plugin, ความเป็นเจ้าของ contribution และการวางแผนการเริ่มต้น โฟลว์ติดตั้ง, อัปเดต,
ถอนการติดตั้ง, เปิดใช้งาน และปิดใช้งาน จะรีเฟรชรีจิสทรีนั้นหลังเปลี่ยนสถานะ Plugin
ไฟล์ `plugins/installs.json` เดียวกันเก็บ metadata การติดตั้งแบบถาวรใน
`installRecords` ระดับบนสุด และ metadata ของ manifest ที่สร้างใหม่ได้ใน `plugins` หาก
รีจิสทรีหายไป ล้าสมัย หรือไม่ถูกต้อง `openclaw plugins registry
--refresh` จะสร้างมุมมอง manifest ใหม่จาก install records, นโยบาย config และ
metadata ของ manifest/package โดยไม่โหลดโมดูล runtime ของ Plugin

ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) ตัวแก้ไขวงจรชีวิต Plugin จะถูกปิดใช้งาน
ให้จัดการการเลือกแพ็กเกจ Plugin และ config ผ่านซอร์ส Nix สำหรับ
การติดตั้งแทน; สำหรับ nix-openclaw ให้เริ่มจาก
[Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) แบบ agent-first
`openclaw plugins update <id-or-npm-spec>` ใช้กับการติดตั้งที่ติดตามอยู่ การส่ง
spec แพ็กเกจ npm พร้อม dist-tag หรือเวอร์ชันที่แน่นอนจะ resolve ชื่อแพ็กเกจ
กลับไปยัง record ของ Plugin ที่ติดตามอยู่ และบันทึก spec ใหม่สำหรับการอัปเดตในอนาคต
การส่งชื่อแพ็กเกจโดยไม่มีเวอร์ชันจะย้ายการติดตั้งที่ pin แบบแน่นอนกลับไปยัง
release line เริ่มต้นของรีจิสทรี หาก Plugin npm ที่ติดตั้งอยู่ตรงกับ
เวอร์ชันที่ resolve แล้วและ identity ของ artifact ที่บันทึกไว้ OpenClaw จะข้ามการอัปเดต
โดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน config ใหม่
เมื่อ `openclaw update` ทำงานบนช่อง beta record ของ Plugin npm และ ClawHub
แบบ default-line จะลอง `@beta` ก่อน และ fallback ไปยัง default/latest เมื่อไม่มี
release beta ของ Plugin เวอร์ชันที่แน่นอนและ tag ที่ระบุชัดเจนจะยังคงถูก pin ไว้

`--pin` ใช้ได้กับ npm เท่านั้น ไม่รองรับการใช้ร่วมกับ `--marketplace` เพราะ
การติดตั้งจาก marketplace จะคง metadata แหล่งที่มาของ marketplace แทน spec ของ npm

`--dangerously-force-unsafe-install` เป็นการ override แบบ break-glass สำหรับ
ผลบวกปลอมจากตัวสแกนโค้ดอันตรายในตัว มันอนุญาตให้การติดตั้ง Plugin
และการอัปเดต Plugin ดำเนินต่อผ่าน finding ระดับ `critical` ในตัวได้ แต่ยังคง
ไม่ข้ามการบล็อกตามนโยบาย `before_install` ของ Plugin หรือการบล็อกเมื่อสแกนล้มเหลว
การสแกนระหว่างติดตั้งจะละเว้นไฟล์และไดเรกทอรีทดสอบทั่วไป เช่น `tests/`,
`__tests__/`, `*.test.*` และ `*.spec.*` เพื่อหลีกเลี่ยงการบล็อก test mock ที่แพ็กมา;
entrypoint runtime ของ Plugin ที่ประกาศไว้ยังคงถูกสแกน แม้ว่าจะใช้หนึ่งใน
ชื่อเหล่านั้นก็ตาม

แฟล็ก CLI นี้ใช้กับโฟลว์ติดตั้ง/อัปเดต Plugin เท่านั้น การติดตั้ง dependency ของ skill
ที่มี Gateway รองรับจะใช้ request override `dangerouslyForceUnsafeInstall`
ที่ตรงกันแทน ขณะที่ `openclaw skills install` ยังคงเป็นโฟลว์ดาวน์โหลด/ติดตั้ง skill
จาก ClawHub ที่แยกต่างหาก

หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกซ่อนหรือถูกบล็อกโดยการสแกน ให้เปิด
แดชบอร์ด ClawHub หรือรัน `clawhub package rescan <name>` เพื่อขอให้ ClawHub ตรวจสอบ
อีกครั้ง `--dangerously-force-unsafe-install` มีผลเฉพาะกับการติดตั้งบนเครื่องของคุณเอง
เท่านั้น; มันไม่ได้ขอให้ ClawHub สแกน Plugin ใหม่หรือทำให้ release ที่ถูกบล็อก
เป็นสาธารณะ

bundle ที่เข้ากันได้จะเข้าร่วมในโฟลว์ list/inspect/enable/disable ของ Plugin เดียวกัน
การรองรับ runtime ปัจจุบันรวมถึง Skills ของ bundle, command-skills ของ Claude,
ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` ของ Claude และ
`lspServers` ที่ประกาศใน manifest, command-skills ของ Cursor และไดเรกทอรี hook
ของ Codex ที่เข้ากันได้

`openclaw plugins inspect <id>` ยังรายงานความสามารถของ bundle ที่ตรวจพบ พร้อม
รายการเซิร์ฟเวอร์ MCP และ LSP ที่รองรับหรือไม่รองรับสำหรับ Plugin ที่มี bundle รองรับ

แหล่งที่มาของ marketplace อาจเป็นชื่อ known-marketplace ของ Claude จาก
`~/.claude/plugins/known_marketplaces.json`, root ของ marketplace ภายในเครื่องหรือ
พาธ `marketplace.json`, shorthand ของ GitHub เช่น `owner/repo`, URL ของ repo GitHub
หรือ URL git สำหรับ marketplace ระยะไกล รายการ Plugin ต้องอยู่ภายใน repo marketplace
ที่ clone มา และใช้เฉพาะแหล่งที่มาแบบพาธสัมพัทธ์เท่านั้น

ดูรายละเอียดทั้งหมดได้ที่ [ข้อมูลอ้างอิง CLI `openclaw plugins`](/th/cli/plugins)

## ภาพรวม API ของ Plugin

Plugin แบบเนทีฟ export อ็อบเจ็กต์ entry ที่เปิดเผย `register(api)` Plugin รุ่นเก่า
อาจยังใช้ `activate(api)` เป็น alias เดิมได้ แต่ Plugin ใหม่ควรใช้
`register`

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw โหลดอ็อบเจ็กต์ entry และเรียก `register(api)` ระหว่างการ activate
Plugin loader ยัง fallback ไปที่ `activate(api)` สำหรับ Plugin รุ่นเก่า
แต่ Plugin ที่บันเดิลมาและ Plugin ภายนอกใหม่ควรมองว่า `register` เป็น
สัญญาสาธารณะ

`api.registrationMode` บอก Plugin ว่าทำไม entry ของมันจึงถูกโหลด:

| โหมด | ความหมาย |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | การ activate runtime ลงทะเบียน tools, hooks, services, commands, routes และ side effect สดอื่น ๆ |
| `discovery` | การค้นหาความสามารถแบบอ่านอย่างเดียว ลงทะเบียน providers และ metadata; โค้ด entry ของ Plugin ที่เชื่อถือได้อาจโหลดได้ แต่ให้ข้าม side effect สด |
| `setup-only` | การโหลด metadata การตั้งค่า channel ผ่าน entry การตั้งค่าแบบเบา |
| `setup-runtime` | การโหลดการตั้งค่า channel ที่ต้องใช้ entry runtime ด้วย |
| `cli-metadata` | การรวบรวม metadata ของคำสั่ง CLI เท่านั้น |

entry ของ Plugin ที่เปิด sockets, databases, background workers หรือ clients
ที่มีอายุยาวควรป้องกัน side effect เหล่านั้นด้วย `api.registrationMode === "full"`
การโหลด discovery จะถูกแคชแยกจากการโหลดเพื่อ activate และไม่แทนที่
รีจิสทรี Gateway ที่กำลังทำงานอยู่ Discovery ไม่ใช่การ activate แต่ก็ไม่ใช่แบบไม่ import:
OpenClaw อาจ evaluate entry ของ Plugin ที่เชื่อถือได้หรือโมดูล Plugin channel เพื่อสร้าง
snapshot ให้รักษาระดับบนสุดของโมดูลให้เบาและปราศจาก side effect และย้าย
network clients, subprocesses, listeners, การอ่าน credential และการเริ่ม service
ไปไว้หลังเส้นทาง full-runtime

เมธอดลงทะเบียนทั่วไป:

| เมธอด | สิ่งที่ลงทะเบียน |
| --------------------------------------- | --------------------------- |
| `registerProvider` | ผู้ให้บริการโมเดล (LLM) |
| `registerChannel` | channel แชต |
| `registerTool` | tool ของ Agent |
| `registerHook` / `on(...)` | hooks วงจรชีวิต |
| `registerSpeechProvider` | Text-to-speech / STT |
| `registerRealtimeTranscriptionProvider` | Streaming STT |
| `registerRealtimeVoiceProvider` | เสียงเรียลไทม์แบบ duplex |
| `registerMediaUnderstandingProvider` | การวิเคราะห์รูปภาพ/เสียง |
| `registerImageGenerationProvider` | การสร้างรูปภาพ |
| `registerMusicGenerationProvider` | การสร้างเพลง |
| `registerVideoGenerationProvider` | การสร้างวิดีโอ |
| `registerWebFetchProvider` | ผู้ให้บริการ web fetch / scrape |
| `registerWebSearchProvider` | การค้นหาเว็บ |
| `registerHttpRoute` | endpoint HTTP |
| `registerCommand` / `registerCli` | คำสั่ง CLI |
| `registerContextEngine` | context engine |
| `registerService` | service เบื้องหลัง |

พฤติกรรม hook guard สำหรับ typed lifecycle hooks:

- `before_tool_call`: `{ block: true }` เป็น terminal; handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `before_tool_call`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `before_install`: `{ block: true }` เป็น terminal; handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `before_install`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็น terminal; handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `message_sending`: `{ cancel: false }` เป็น no-op และไม่ล้าง cancel ก่อนหน้า

การรันแอปเซิร์ฟเวอร์ Codex แบบเนทีฟจะเชื่อมเหตุการณ์เครื่องมือเนทีฟของ Codex กลับเข้าสู่พื้นผิวฮุกนี้ Plugin สามารถบล็อกเครื่องมือเนทีฟของ Codex ผ่าน `before_tool_call`, สังเกตผลลัพธ์ผ่าน `after_tool_call`, และเข้าร่วมการอนุมัติ `PermissionRequest` ของ Codex ได้ บริดจ์นี้ยังไม่เขียนอาร์กิวเมนต์ของเครื่องมือเนทีฟ Codex ใหม่ ขอบเขตการรองรับรันไทม์ Codex ที่แน่นอนอยู่ใน [สัญญาการรองรับ Codex harness v1](/th/plugins/codex-harness#v1-support-contract)

สำหรับพฤติกรรมฮุกแบบมีชนิดครบถ้วน โปรดดู [ภาพรวม SDK](/th/plugins/sdk-overview#hook-decision-semantics)

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins) - สร้าง Plugin ของคุณเอง
- [บันเดิล Plugin](/th/plugins/bundles) - ความเข้ากันได้ของบันเดิล Codex/Claude/Cursor
- [ไฟล์กำกับ Plugin](/th/plugins/manifest) - สคีมาไฟล์กำกับ
- [การลงทะเบียนเครื่องมือ](/th/plugins/building-plugins#registering-agent-tools) - เพิ่มเครื่องมือเอเจนต์ใน Plugin
- [กลไกภายใน Plugin](/th/plugins/architecture) - โมเดลความสามารถและไปป์ไลน์การโหลด
- [Plugin ชุมชน](/th/plugins/community) - รายการจากบุคคลที่สาม
