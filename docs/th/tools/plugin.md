---
read_when:
    - การติดตั้งหรือกำหนดค่า Plugin
    - ทำความเข้าใจการค้นพบ Plugin และกฎการโหลด
    - การทำงานกับบันเดิล Plugin ที่เข้ากันได้กับ Codex/Claude
sidebarTitle: Install and Configure
summary: ติดตั้ง กำหนดค่า และจัดการ Plugin ของ OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-06T09:35:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d68ad3cbd040d3f973d219cf273a792f11df382f6c4ccbf80c07acb0d26c658
    source_path: tools/plugin.md
    workflow: 16
---

Plugin ขยาย OpenClaw ด้วยความสามารถใหม่ ๆ: ช่องทาง, ผู้ให้บริการโมเดล,
ชุดควบคุมเอเจนต์, เครื่องมือ, Skills, คำพูด, การถอดเสียงแบบเรียลไทม์, เสียงแบบเรียลไทม์,
การทำความเข้าใจสื่อ, การสร้างรูปภาพ, การสร้างวิดีโอ, การดึงเว็บ, การค้นหาเว็บ
และอื่น ๆ Plugin บางตัวเป็น **core** (จัดส่งมาพร้อม OpenClaw) ส่วนตัวอื่นเป็น
**ภายนอก** Plugin ภายนอกส่วนใหญ่เผยแพร่และค้นพบผ่าน
[ClawHub](/th/tools/clawhub) Npm ยังคงรองรับสำหรับการติดตั้งโดยตรงและสำหรับ
ชุดแพ็กเกจ Plugin ที่ OpenClaw เป็นเจ้าของชั่วคราวระหว่างที่การย้ายระบบนั้นเสร็จสิ้น

## เริ่มต้นอย่างรวดเร็ว

สำหรับตัวอย่างการติดตั้งแบบคัดลอกแล้ววาง การแสดงรายการ การถอนการติดตั้ง การอัปเดต และการเผยแพร่ โปรดดู
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

    จากนั้นกำหนดค่าภายใต้ `plugins.entries.\<id\>.config` ในไฟล์กำหนดค่าของคุณ

  </Step>

  <Step title="การจัดการแบบเนทีฟในแชต">
    ใน Gateway ที่กำลังทำงานอยู่ `/plugins enable` และ `/plugins disable`
    สำหรับเจ้าของเท่านั้นจะทริกเกอร์ตัวโหลดการกำหนดค่าใหม่ของ Gateway Gateway จะโหลดพื้นผิวรันไทม์ของ Plugin
    ใหม่ภายในกระบวนการ และรอบเอเจนต์ใหม่จะสร้างรายการเครื่องมือจากรีจิสทรี
    ที่รีเฟรชแล้ว `/plugins install` เปลี่ยนซอร์สโค้ดของ Plugin ดังนั้น
    Gateway จะขอให้รีสตาร์ทแทนการแสร้งว่ากระบวนการปัจจุบันสามารถ
    โหลดโมดูลที่นำเข้าแล้วใหม่ได้อย่างปลอดภัย

  </Step>

  <Step title="ตรวจสอบ Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    ใช้ `--runtime` เมื่อคุณต้องพิสูจน์เครื่องมือ บริการ เมธอด Gateway
    hooks หรือคำสั่ง CLI ที่ Plugin เป็นเจ้าของที่ลงทะเบียนไว้ `inspect` แบบธรรมดาเป็นการตรวจสอบ manifest/registry
    แบบเย็น และตั้งใจหลีกเลี่ยงการนำเข้ารันไทม์ของ Plugin

  </Step>
</Steps>

หากคุณต้องการการควบคุมแบบเนทีฟในแชต ให้เปิดใช้ `commands.plugins: true` แล้วใช้:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

เส้นทางการติดตั้งใช้ตัวแก้ไขเดียวกับ CLI: พาธ/ไฟล์เก็บถาวรในเครื่อง,
`clawhub:<pkg>` แบบชัดเจน, `npm:<pkg>` แบบชัดเจน, `npm-pack:<path.tgz>`
แบบชัดเจน, `git:<repo>` แบบชัดเจน หรือสเปกแพ็กเกจเปล่าผ่าน npm

หากการกำหนดค่าไม่ถูกต้อง โดยปกติการติดตั้งจะปิดอย่างปลอดภัยและชี้ให้คุณไปที่
`openclaw doctor --fix` ข้อยกเว้นสำหรับการกู้คืนเพียงอย่างเดียวคือเส้นทางติดตั้ง Plugin ที่จัดส่งมาด้วยใหม่
แบบจำกัดสำหรับ Plugin ที่เลือกใช้
`openclaw.install.allowInvalidConfigRecovery`
ระหว่างการเริ่มต้น Gateway การกำหนดค่า Plugin ที่ไม่ถูกต้องจะปิดอย่างปลอดภัยเหมือนการกำหนดค่า
ที่ไม่ถูกต้องอื่น ๆ เรียกใช้ `openclaw doctor --fix` เพื่อกักกันการกำหนดค่า Plugin ที่เสีย
โดยปิดใช้งานรายการ Plugin นั้นและลบเพย์โหลดการกำหนดค่าที่ไม่ถูกต้องของมัน การสำรองข้อมูล
การกำหนดค่าปกติจะเก็บค่าก่อนหน้าไว้
เมื่อการกำหนดค่าช่องทางอ้างถึง Plugin ที่ไม่สามารถค้นพบได้อีกต่อไป แต่
id Plugin ค้างเดิมยังคงอยู่ในการกำหนดค่า Plugin หรือบันทึกการติดตั้ง การเริ่มต้น Gateway
จะบันทึกคำเตือนและข้ามช่องทางนั้นแทนการบล็อกช่องทางอื่นทั้งหมด
เรียกใช้ `openclaw doctor --fix` เพื่อลบรายการช่องทาง/Plugin ที่ค้างอยู่ คีย์
ช่องทางที่ไม่รู้จักซึ่งไม่มีหลักฐาน Plugin ค้างจะยังคงทำให้การตรวจสอบล้มเหลวเพื่อให้พิมพ์ผิด
ยังมองเห็นได้
หากตั้งค่า `plugins.enabled: false` การอ้างอิง Plugin ที่ค้างจะถือว่าไม่ทำงาน:
การเริ่มต้น Gateway จะข้ามงานค้นพบ/โหลด Plugin และ `openclaw doctor` จะเก็บ
การกำหนดค่า Plugin ที่ปิดใช้งานไว้แทนการลบอัตโนมัติ เปิดใช้ Plugin อีกครั้งก่อน
เรียกใช้การล้างข้อมูลด้วย doctor หากคุณต้องการลบ id Plugin ที่ค้าง

การติดตั้ง dependency ของ Plugin จะเกิดขึ้นเฉพาะระหว่างโฟลว์ติดตั้ง/อัปเดตหรือ
ซ่อมแซมด้วย doctor อย่างชัดเจนเท่านั้น การเริ่มต้น Gateway การโหลดการกำหนดค่าใหม่ และการตรวจสอบรันไทม์
จะไม่เรียกใช้ package managers หรือซ่อมแซมต้นไม้ dependency Plugin ในเครื่องต้อง
ติดตั้ง dependency ของตัวเองไว้แล้ว ส่วน Plugin จาก npm, git และ ClawHub จะ
ติดตั้งใต้ราก Plugin ที่ OpenClaw จัดการอยู่ dependency ของ npm อาจถูก hoist
ภายในราก npm ที่ OpenClaw จัดการอยู่ install/update จะสแกนรากที่จัดการนั้นก่อน
trust และ uninstall จะลบแพ็กเกจที่ npm จัดการผ่าน npm Plugin ภายนอก
และพาธโหลดแบบกำหนดเองยังต้องติดตั้งผ่าน `openclaw plugins install`
ใช้ `openclaw plugins list --json` เพื่อดู `dependencyStatus` แบบคงที่สำหรับแต่ละ
Plugin ที่มองเห็นได้โดยไม่นำเข้าโค้ดรันไทม์หรือซ่อมแซม dependency
ดู [การแก้ไข dependency ของ Plugin](/th/plugins/dependency-resolution) สำหรับ
วงจรชีวิตขณะติดตั้ง

### ความเป็นเจ้าของพาธ Plugin ที่ถูกบล็อก

หากการวินิจฉัย Plugin แจ้งว่า
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
และการตรวจสอบการกำหนดค่าตามด้วย `plugin present but blocked` แสดงว่า OpenClaw พบ
ไฟล์ Plugin ที่เป็นของผู้ใช้ Unix คนละรายกับกระบวนการที่กำลังโหลด
ไฟล์เหล่านั้น เก็บการกำหนดค่า Plugin ไว้ แก้ไขความเป็นเจ้าของในระบบไฟล์หรือเรียกใช้
OpenClaw ด้วยผู้ใช้เดียวกับเจ้าของไดเรกทอรีสถานะ

สำหรับการติดตั้ง Docker อิมเมจทางการทำงานเป็น `node` (uid `1000`) ดังนั้น
ไดเรกทอรีการกำหนดค่า OpenClaw และพื้นที่ทำงานที่ bind mount จากโฮสต์ควรเป็น
ของ uid `1000` ตามปกติ:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

หากคุณตั้งใจเรียกใช้ OpenClaw เป็น root ให้ซ่อมราก Plugin ที่จัดการอยู่ให้เป็น
ความเป็นเจ้าของของ root แทน:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

หลังแก้ไขความเป็นเจ้าของแล้ว ให้เรียกใช้ `openclaw doctor --fix` หรือ
`openclaw plugins registry --refresh` อีกครั้งเพื่อให้รีจิสทรี Plugin ที่บันทึกไว้ตรงกับ
ไฟล์ที่ซ่อมแล้ว

สำหรับการติดตั้ง npm ตัวเลือกที่เปลี่ยนแปลงได้ เช่น `latest` หรือ dist-tag จะถูกแก้ไข
ก่อนการติดตั้ง แล้วจึงปักหมุดเป็นเวอร์ชันที่ตรวจสอบแน่นอนในราก npm ที่ OpenClaw
จัดการอยู่ หลัง npm เสร็จสิ้น OpenClaw จะตรวจสอบว่ารายการ
`package-lock.json` ที่ติดตั้งยังตรงกับเวอร์ชันและ integrity ที่แก้ไขไว้ หาก
npm เขียนเมทาดาทาแพ็กเกจที่ต่างออกไป การติดตั้งจะล้มเหลวและแพ็กเกจที่จัดการอยู่
จะถูกย้อนกลับแทนการยอมรับอาร์ติแฟกต์ Plugin อื่น

การ checkout ซอร์สเป็น pnpm workspaces หากคุณ clone OpenClaw เพื่อแก้ไข
Plugin ที่จัดส่งมาด้วย ให้เรียกใช้ `pnpm install`; จากนั้น OpenClaw จะโหลด Plugin ที่จัดส่งมาด้วยจาก
`extensions/<id>` เพื่อให้การแก้ไขและ dependency เฉพาะแพ็กเกจถูกใช้งานโดยตรง
การติดตั้งราก npm แบบธรรมดามีไว้สำหรับ OpenClaw ที่แพ็กเกจแล้ว ไม่ใช่การพัฒนา
source checkout

## ประเภท Plugin

OpenClaw รู้จักรูปแบบ Plugin สองแบบ:

| รูปแบบ     | วิธีทำงาน                                                       | ตัวอย่าง                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **เนทีฟ** | `openclaw.plugin.json` + โมดูลรันไทม์; ดำเนินการในกระบวนการ       | Plugin ทางการ, แพ็กเกจ npm จากชุมชน               |
| **บันเดิล** | เลย์เอาต์ที่เข้ากันได้กับ Codex/Claude/Cursor; แมปกับฟีเจอร์ของ OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

ทั้งสองแบบจะแสดงภายใต้ `openclaw plugins list` ดู [บันเดิล Plugin](/th/plugins/bundles) สำหรับรายละเอียดบันเดิล

หากคุณกำลังเขียน Plugin แบบเนทีฟ ให้เริ่มด้วย [การสร้าง Plugin](/th/plugins/building-plugins)
และ [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## จุดเข้าแพ็กเกจ

แพ็กเกจ npm ของ Plugin แบบเนทีฟต้องประกาศ `openclaw.extensions` ใน `package.json`
แต่ละรายการต้องอยู่ภายในไดเรกทอรีแพ็กเกจและ resolve ไปยังไฟล์รันไทม์
ที่อ่านได้ หรือไปยังไฟล์ซอร์ส TypeScript ที่มี peer JavaScript ที่ build แล้วซึ่งอนุมานได้
เช่น `src/index.ts` ไปยัง `dist/index.js`
การติดตั้งแบบแพ็กเกจต้องจัดส่งเอาต์พุตรันไทม์ JavaScript นั้น fallback
ซอร์ส TypeScript มีไว้สำหรับ source checkout และพาธพัฒนาในเครื่อง ไม่ใช่สำหรับ
แพ็กเกจ npm ที่ติดตั้งลงในราก Plugin ที่ OpenClaw จัดการอยู่

หากคำเตือนแพ็กเกจที่จัดการอยู่บอกว่าแพ็กเกจนั้น `requires compiled runtime output for
TypeScript entry ...` แสดงว่าแพ็กเกจถูกเผยแพร่โดยไม่มีไฟล์ JavaScript
ที่ OpenClaw ต้องใช้ตอนรันไทม์ นั่นเป็นปัญหาการแพ็กเกจ Plugin ไม่ใช่ปัญหาการกำหนดค่า
ในเครื่อง อัปเดตหรือติดตั้ง Plugin ใหม่หลังผู้เผยแพร่เผยแพร่ JavaScript ที่คอมไพล์แล้ว
อีกครั้ง หรือปิดใช้งาน/ถอนการติดตั้ง Plugin นั้นจนกว่าแพ็กเกจที่แก้ไขแล้วจะพร้อมใช้งาน

ใช้ `openclaw.runtimeExtensions` เมื่อไฟล์รันไทม์ที่เผยแพร่ไม่ได้อยู่ใน
พาธเดียวกับรายการซอร์ส เมื่อมี `runtimeExtensions` จะต้องมี
รายการหนึ่งรายการพอดีสำหรับทุกรายการ `extensions` รายการที่ไม่ตรงกันจะทำให้การติดตั้งและ
การค้นพบ Plugin ล้มเหลว แทนที่จะ fallback ไปยังพาธซอร์สอย่างเงียบ ๆ หากคุณยัง
เผยแพร่ `openclaw.setupEntry` ด้วย ให้ใช้ `openclaw.runtimeSetupEntry` สำหรับ peer
JavaScript ที่ build แล้ว ไฟล์นั้นจำเป็นเมื่อประกาศไว้

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

### แพ็กเกจ npm ที่ OpenClaw เป็นเจ้าของระหว่างการย้ายระบบ

ClawHub เป็นเส้นทางกระจายหลักสำหรับ Plugin ส่วนใหญ่ OpenClaw รุ่นแพ็กเกจปัจจุบัน
ได้รวม Plugin ทางการจำนวนมากไว้แล้ว ดังนั้น Plugin เหล่านั้นไม่จำเป็นต้องมี
การติดตั้ง npm แยกต่างหากในการตั้งค่าปกติ จนกว่า Plugin ที่ OpenClaw เป็นเจ้าของทุกตัวจะ
ย้ายไปยัง ClawHub แล้ว OpenClaw ยังคงจัดส่งแพ็กเกจ Plugin `@openclaw/*` บางตัวบน
npm สำหรับการติดตั้งเก่า/แบบกำหนดเองและเวิร์กโฟลว์ npm โดยตรง

หาก npm รายงานว่าแพ็กเกจ Plugin `@openclaw/*` เลิกใช้แล้ว แสดงว่าเวอร์ชัน
แพ็กเกจนั้นมาจากชุดแพ็กเกจภายนอกที่เก่ากว่า ใช้ Plugin ที่จัดส่งมาด้วยจาก
OpenClaw ปัจจุบันหรือ checkout ในเครื่องจนกว่าจะมีการเผยแพร่แพ็กเกจ npm ที่ใหม่กว่า

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

### Core (จัดส่งมาพร้อม OpenClaw)

<AccordionGroup>
  <Accordion title="ผู้ให้บริการโมเดล (เปิดใช้ตามค่าเริ่มต้น)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory Plugin">
    - `memory-core` - การค้นหา memory ที่จัดส่งมาด้วย (ค่าเริ่มต้นผ่าน `plugins.slots.memory`)
    - `memory-lancedb` - memory ระยะยาวที่รองรับด้วย LanceDB พร้อม auto-recall/capture (ตั้งค่า `plugins.slots.memory = "memory-lancedb"`)

    ดู [Memory LanceDB](/th/plugins/memory-lancedb) สำหรับการตั้งค่า embedding ที่เข้ากันได้กับ OpenAI,
    ตัวอย่าง Ollama, ขีดจำกัดการเรียกคืน และการแก้ปัญหา

  </Accordion>

  <Accordion title="ผู้ให้บริการเสียงพูด (เปิดใช้งานตามค่าเริ่มต้น)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="อื่นๆ">
    - `browser` - Plugin เบราว์เซอร์ที่รวมมาให้สำหรับเครื่องมือเบราว์เซอร์, CLI `openclaw browser`, เมธอด Gateway `browser.request`, รันไทม์เบราว์เซอร์ และบริการควบคุมเบราว์เซอร์เริ่มต้น (เปิดใช้งานตามค่าเริ่มต้น; ปิดใช้งานก่อนแทนที่)
    - `copilot-proxy` - บริดจ์ VS Code Copilot Proxy (ปิดใช้งานตามค่าเริ่มต้น)

  </Accordion>
</AccordionGroup>

กำลังมองหา Plugin จากภายนอกอยู่ใช่ไหม? ดู [Community Plugins](/th/plugins/community)

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
| `allow`            | รายการอนุญาต Plugin (ไม่บังคับ)                               |
| `bundledDiscovery` | โหมดการค้นพบ Plugin ที่รวมมาให้ (`allowlist` ตามค่าเริ่มต้น)    |
| `deny`             | รายการปฏิเสธ Plugin (ไม่บังคับ; การปฏิเสธมีผลเหนือกว่า)                     |
| `load.paths`       | ไฟล์/ไดเรกทอรี Plugin เพิ่มเติม                            |
| `slots`            | ตัวเลือกสล็อตแบบเอกสิทธิ์ (เช่น `memory`, `contextEngine`) |
| `entries.\<id\>`   | สวิตช์เปิด/ปิด + การกำหนดค่าราย Plugin                               |

`plugins.allow` เป็นแบบเอกสิทธิ์ เมื่อไม่ว่าง จะโหลดหรือเปิดเผยเครื่องมือได้เฉพาะ Plugin ที่อยู่ในรายการเท่านั้น
แม้ว่า `tools.allow` จะมี `"*"` หรือชื่อเครื่องมือที่ Plugin หนึ่งเป็นเจ้าของโดยเฉพาะก็ตาม
หากรายการอนุญาตเครื่องมืออ้างอิงเครื่องมือของ Plugin ให้เพิ่ม id ของ Plugin เจ้าของ
ไปยัง `plugins.allow` หรือเอา `plugins.allow` ออก; `openclaw doctor` จะเตือนเกี่ยวกับรูปแบบนี้

`plugins.bundledDiscovery` มีค่าเริ่มต้นเป็น `"allowlist"` สำหรับการกำหนดค่าใหม่ ดังนั้น
รายการ `plugins.allow` ที่จำกัดสิทธิ์จะบล็อก Plugin ผู้ให้บริการที่รวมมาให้แต่ไม่ได้ระบุไว้ด้วย
รวมถึงการค้นพบผู้ให้บริการค้นเว็บของรันไทม์ Doctor จะประทับการกำหนดค่า allowlist
แบบจำกัดสิทธิ์รุ่นเก่าด้วย `"compat"` ระหว่างการย้ายข้อมูล เพื่อให้การอัปเกรดยังคง
พฤติกรรมผู้ให้บริการที่รวมมาให้แบบเดิมไว้ จนกว่าผู้ปฏิบัติงานจะเลือกใช้โหมดที่เข้มงวดกว่า
`plugins.allow` ที่ว่างยังคงถือว่าไม่ได้ตั้งค่า/เปิดอยู่

การเปลี่ยนแปลงการกำหนดค่าที่ทำผ่าน `/plugins enable` หรือ `/plugins disable` จะกระตุ้นให้
โหลด Plugin ของ Gateway ซ้ำภายในกระบวนการ เทิร์น agent ใหม่จะสร้างรายการเครื่องมือใหม่จาก
รีจิสทรี Plugin ที่รีเฟรชแล้ว การดำเนินการที่เปลี่ยนซอร์ส เช่น ติดตั้ง
อัปเดต และถอนการติดตั้ง ยังจะรีสตาร์ทกระบวนการ Gateway เพราะโมดูล Plugin
ที่นำเข้าแล้วไม่สามารถแทนที่ในที่เดิมได้อย่างปลอดภัย

`openclaw plugins list` คือสแนปช็อตรีจิสทรี/การกำหนดค่า Plugin ภายในเครื่อง
Plugin ที่เป็น `enabled` ในนั้นหมายความว่ารีจิสทรีที่บันทึกไว้และการกำหนดค่าปัจจุบันอนุญาตให้
Plugin เข้าร่วมได้ ไม่ได้พิสูจน์ว่า Gateway ระยะไกลที่กำลังทำงานอยู่ได้โหลดซ้ำหรือรีสตาร์ทเข้าสู่
โค้ด Plugin เดียวกันแล้ว ในการตั้งค่า VPS/คอนเทนเนอร์ที่มีกระบวนการ wrapper
ให้ส่งการรีสตาร์ทหรือการเขียนที่กระตุ้นการโหลดซ้ำไปยังกระบวนการ
`openclaw gateway run` จริง หรือใช้ `openclaw gateway restart` กับ
Gateway ที่กำลังทำงานอยู่เมื่อรายงานว่าการโหลดซ้ำล้มเหลว

<Accordion title="สถานะ Plugin: ปิดใช้งาน เทียบกับ หายไป เทียบกับ ไม่ถูกต้อง">
  - **ปิดใช้งาน**: Plugin มีอยู่แต่กฎการเปิดใช้งานปิดไว้ การกำหนดค่ายังคงถูกเก็บไว้
  - **หายไป**: การกำหนดค่าอ้างอิง id ของ Plugin ที่การค้นหาไม่พบ
  - **ไม่ถูกต้อง**: Plugin มีอยู่แต่การกำหนดค่าของมันไม่ตรงกับ schema ที่ประกาศไว้ การเริ่มต้น Gateway จะข้ามเฉพาะ Plugin นั้น; `openclaw doctor --fix` สามารถกักกันรายการที่ไม่ถูกต้องได้โดยปิดใช้งานและนำ payload การกำหนดค่าของมันออก

</Accordion>

## การค้นพบและลำดับความสำคัญ

OpenClaw สแกนหา Plugin ตามลำดับนี้ (รายการแรกที่ตรงกันจะชนะ):

<Steps>
  <Step title="พาธการกำหนดค่า">
    `plugins.load.paths` - พาธไฟล์หรือไดเรกทอรีแบบชัดเจน พาธที่ชี้
    กลับไปยังไดเรกทอรี Plugin ที่รวมมาให้ในแพ็กเกจของ OpenClaw เองจะถูกละเว้น;
    รัน `openclaw doctor --fix` เพื่อลบ alias เก่าเหล่านั้น
  </Step>

  <Step title="Plugin ใน workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` และ `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin ส่วนกลาง">
    `~/.openclaw/<plugin-root>/*.ts` และ `~/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin ที่รวมมาให้">
    จัดส่งมาพร้อม OpenClaw หลายรายการเปิดใช้งานตามค่าเริ่มต้น (ผู้ให้บริการโมเดล, เสียงพูด)
    รายการอื่นต้องเปิดใช้งานอย่างชัดเจน
  </Step>
</Steps>

การติดตั้งแบบแพ็กเกจและ Docker image โดยปกติจะ resolve Plugin ที่รวมมาให้จาก
ทรี `dist/extensions` ที่คอมไพล์แล้ว หากไดเรกทอรีซอร์สของ Plugin ที่รวมมาให้ถูก
bind-mounted ทับพาธซอร์สแพ็กเกจที่ตรงกัน เช่น
`/app/extensions/synology-chat` OpenClaw จะถือว่าไดเรกทอรีซอร์สที่เมานต์นั้น
เป็น source overlay ที่รวมมาให้ และค้นพบมันก่อนบันเดิลแพ็กเกจ
`/app/dist/extensions/synology-chat` วิธีนี้ทำให้ลูปคอนเทนเนอร์ของผู้ดูแลทำงานได้
โดยไม่ต้องสลับ Plugin ที่รวมมาให้ทุกตัวกลับไปใช้ซอร์ส TypeScript
ตั้งค่า `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` เพื่อบังคับใช้บันเดิล dist แบบแพ็กเกจ
แม้มีเมานต์ source overlay อยู่

### กฎการเปิดใช้งาน

- `plugins.enabled: false` ปิดใช้งาน Plugin ทั้งหมดและข้ามงานค้นหา/โหลด Plugin
- `plugins.deny` มีผลเหนือกว่า allow เสมอ
- `plugins.entries.\<id\>.enabled: false` ปิดใช้งาน Plugin นั้น
- Plugin ที่มาจาก workspace จะ **ปิดใช้งานตามค่าเริ่มต้น** (ต้องเปิดใช้งานอย่างชัดเจน)
- Plugin ที่รวมมาให้จะเป็นไปตามชุดค่าเริ่มต้นที่เปิดไว้ในตัว เว้นแต่ถูกแทนที่
- สล็อตแบบเอกสิทธิ์สามารถบังคับเปิดใช้งาน Plugin ที่เลือกสำหรับสล็อตนั้นได้
- Plugin แบบ opt-in ที่รวมมาให้บางตัวจะเปิดใช้งานโดยอัตโนมัติเมื่อการกำหนดค่าระบุ
  surface ที่ Plugin เป็นเจ้าของ เช่น provider model ref, การกำหนดค่าช่องทาง หรือรันไทม์
  harness
- การกำหนดค่า Plugin ที่เก่าค้างจะถูกเก็บไว้ขณะที่ `plugins.enabled: false` ทำงานอยู่;
  เปิดใช้งาน Plugin อีกครั้งก่อนรันการล้างข้อมูลด้วย doctor หากคุณต้องการลบ id เก่าค้าง
- เส้นทาง Codex ในตระกูล OpenAI จะแยกขอบเขต Plugin ไว้ต่างหาก:
  `openai-codex/*` เป็นของ Plugin OpenAI ขณะที่ Plugin app-server Codex
  ที่รวมมาให้จะถูกเลือกโดย `agentRuntime.id: "codex"` หรือ model ref แบบเดิม
  `codex/*`

## การแก้ปัญหา hook ของรันไทม์

หาก Plugin ปรากฏใน `plugins list` แต่ side effect หรือ hook ของ `register(api)`
ไม่ทำงานในการรับส่งข้อมูลแชตจริง ให้ตรวจสิ่งเหล่านี้ก่อน:

- รัน `openclaw gateway status --deep --require-rpc` และยืนยันว่า URL
  Gateway, โปรไฟล์, พาธการกำหนดค่า และกระบวนการที่ทำงานอยู่คือรายการที่คุณกำลังแก้ไข
- รีสตาร์ท Gateway จริงหลังการเปลี่ยนแปลงการติดตั้ง/การกำหนดค่า/โค้ดของ Plugin ในคอนเทนเนอร์
  wrapper PID 1 อาจเป็นเพียง supervisor; ให้รีสตาร์ทหรือส่งสัญญาณไปยังกระบวนการลูก
  `openclaw gateway run`
- ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อยืนยันการลงทะเบียน hook และ
  diagnostics hook การสนทนาที่ไม่ได้รวมมาให้ เช่น `llm_input`,
  `llm_output`, `before_agent_finalize`, และ `agent_end` ต้องใช้
  `plugins.entries.<id>.hooks.allowConversationAccess=true`
- สำหรับการสลับโมเดล ให้เลือกใช้ `before_model_resolve` มันทำงานก่อนการ resolve โมเดล
  สำหรับเทิร์น agent; `llm_output` จะทำงานหลังจากความพยายามเรียกโมเดล
  สร้าง output ของ assistant แล้วเท่านั้น
- สำหรับหลักฐานของโมเดลเซสชันที่มีผลจริง ให้ใช้ `openclaw sessions` หรือ
  surface เซสชัน/สถานะของ Gateway และเมื่อดีบัก payload ของผู้ให้บริการ ให้เริ่ม
  Gateway ด้วย `--raw-stream --raw-stream-path <path>`

### การตั้งค่าเครื่องมือ Plugin ช้า

หากเทิร์น agent ดูเหมือนค้างขณะเตรียมเครื่องมือ ให้เปิด trace logging และ
ตรวจบรรทัด timing ของ factory เครื่องมือ Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

มองหา:

```text
[trace:plugin-tools] factory timings ...
```

สรุปจะแสดงเวลารวมของ factory และ factory เครื่องมือ Plugin ที่ช้าที่สุด
รวมถึง id ของ Plugin, ชื่อเครื่องมือที่ประกาศ, รูปทรงผลลัพธ์ และเครื่องมือนั้นเป็น
ไม่บังคับหรือไม่ บรรทัดที่ช้าจะถูกยกระดับเป็นคำเตือนเมื่อ factory เดี่ยวใช้เวลา
อย่างน้อย 1 วินาที หรือการเตรียม factory เครื่องมือ Plugin รวมใช้เวลาอย่างน้อย 5 วินาที

OpenClaw แคชผลลัพธ์ factory เครื่องมือ Plugin ที่สำเร็จสำหรับการ resolve ซ้ำ
ด้วยบริบทคำขอที่มีผลจริงเดียวกัน คีย์แคชรวมถึงการกำหนดค่ารันไทม์ที่มีผลจริง,
workspace, id ของ agent/เซสชัน, นโยบาย sandbox, การตั้งค่าเบราว์เซอร์,
บริบทการส่งมอบ, ตัวตนของผู้ร้องขอ และสถานะความเป็นเจ้าของ ดังนั้น factory ที่
ขึ้นกับฟิลด์ที่เชื่อถือได้เหล่านั้นจะถูกรันใหม่เมื่อบริบทเปลี่ยน

หาก Plugin หนึ่งใช้เวลามากที่สุด ให้ตรวจการลงทะเบียนรันไทม์ของมัน:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

จากนั้นอัปเดต ติดตั้งใหม่ หรือปิดใช้งาน Plugin นั้น ผู้เขียน Plugin ควรย้าย
การโหลด dependency ที่มีค่าใช้จ่ายสูงไปไว้หลังเส้นทางการเรียกใช้เครื่องมือ แทนที่จะทำ
ภายใน factory เครื่องมือ

### ความเป็นเจ้าของช่องทางหรือเครื่องมือซ้ำ

อาการ:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

สิ่งเหล่านี้หมายความว่ามี Plugin ที่เปิดใช้งานมากกว่าหนึ่งตัวพยายามเป็นเจ้าของช่องทาง,
โฟลว์การตั้งค่า หรือชื่อเครื่องมือเดียวกัน สาเหตุที่พบบ่อยที่สุดคือ Plugin ช่องทางภายนอก
ติดตั้งอยู่ข้างๆ Plugin ที่รวมมาให้ซึ่งตอนนี้ให้ id ช่องทางเดียวกัน

ขั้นตอนการดีบัก:

- รัน `openclaw plugins list --enabled --verbose` เพื่อดู Plugin ที่เปิดใช้งานทุกตัว
  และที่มา
- รัน `openclaw plugins inspect <id> --runtime --json` สำหรับ Plugin ที่สงสัยแต่ละตัว และ
  เปรียบเทียบ `channels`, `channelConfigs`, `tools`, และ diagnostics
- รัน `openclaw plugins registry --refresh` หลังติดตั้งหรือลบ
  แพ็กเกจ Plugin เพื่อให้ metadata ที่บันทึกไว้สะท้อนการติดตั้งปัจจุบัน
- รีสตาร์ท Gateway หลังการเปลี่ยนแปลงการติดตั้ง รีจิสทรี หรือการกำหนดค่า

ตัวเลือกการแก้ไข:

- หาก Plugin หนึ่งตั้งใจแทนที่อีกตัวหนึ่งสำหรับ id ช่องทางเดียวกัน Plugin
  ที่ต้องการควรประกาศ `channelConfigs.<channel-id>.preferOver` พร้อม
  id ของ Plugin ที่มีลำดับความสำคัญต่ำกว่า ดู [/plugins/manifest#replacing-another-channel-plugin](/th/plugins/manifest#replacing-another-channel-plugin)
- หากการซ้ำเกิดโดยไม่ตั้งใจ ให้ปิดใช้งานฝั่งหนึ่งด้วย
  `plugins.entries.<plugin-id>.enabled: false` หรือลบการติดตั้ง Plugin
  ที่เก่าค้างออก
- หากคุณเปิดใช้งาน Plugin ทั้งสองอย่างชัดเจน OpenClaw จะคงคำขอนั้นไว้และ
  รายงานความขัดแย้ง เลือกเจ้าของหนึ่งรายสำหรับช่องทาง หรือเปลี่ยนชื่อเครื่องมือที่ Plugin เป็นเจ้าของ
  เพื่อให้ surface ของรันไทม์ไม่คลุมเครือ

## สล็อต Plugin (หมวดหมู่แบบเอกสิทธิ์)

บางหมวดหมู่เป็นแบบเอกสิทธิ์ (ใช้งานได้เพียงหนึ่งรายการในแต่ละครั้ง):

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

| สล็อต            | ควบคุมอะไร      | ค่าเริ่มต้น             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin หน่วยความจำที่ใช้งานอยู่  | `memory-core`       |
| `contextEngine` | เอนจินบริบทที่ใช้งานอยู่ | `legacy` (มีในตัว) |

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

Plugin ที่มาพร้อมชุดติดตั้งจะจัดส่งมากับ OpenClaw หลายรายการถูกเปิดใช้งานโดยค่าเริ่มต้น (เช่น ผู้ให้บริการโมเดลที่มาพร้อมชุดติดตั้ง ผู้ให้บริการเสียงพูดที่มาพร้อมชุดติดตั้ง และ Plugin เบราว์เซอร์ที่มาพร้อมชุดติดตั้ง) Plugin อื่นที่มาพร้อมชุดติดตั้งยังต้องใช้ `openclaw plugins enable <id>`

`--force` เขียนทับ Plugin หรือ hook pack ที่ติดตั้งอยู่เดิม ณ ตำแหน่งเดิม ใช้ `openclaw plugins update <id-or-npm-spec>` สำหรับการอัปเกรด Plugin npm ที่ติดตามไว้ตามปกติ ไม่รองรับการใช้ร่วมกับ `--link` ซึ่งนำพาธต้นทางกลับมาใช้แทนการคัดลอกทับเป้าหมายการติดตั้งที่จัดการไว้

เมื่อมีการตั้งค่า `plugins.allow` อยู่แล้ว `openclaw plugins install` จะเพิ่ม id ของ Plugin ที่ติดตั้งลงใน allowlist นั้นก่อนเปิดใช้งาน หาก id ของ Plugin เดียวกันมีอยู่ใน `plugins.deny` การติดตั้งจะลบรายการ deny ที่ค้างอยู่นั้นออก เพื่อให้การติดตั้งแบบชัดเจนโหลดได้ทันทีหลังรีสตาร์ต

OpenClaw เก็บรีจิสทรี Plugin ภายในเครื่องแบบ persisted เป็นโมเดลอ่านเย็นสำหรับคลัง Plugin ความเป็นเจ้าของ contribution และการวางแผนตอนเริ่มต้น ระบบ install, update, uninstall, enable และ disable จะรีเฟรชรีจิสทรีนั้นหลังเปลี่ยนสถานะ Plugin ไฟล์ `plugins/installs.json` เดียวกันเก็บ metadata การติดตั้งแบบคงทนใน `installRecords` ระดับบนสุด และ metadata ของ manifest ที่สร้างใหม่ได้ใน `plugins` หากรีจิสทรีหายไป เก่า หรือไม่ถูกต้อง `openclaw plugins registry --refresh` จะสร้างมุมมอง manifest ใหม่จาก install records, config policy และ metadata ของ manifest/package โดยไม่โหลดโมดูล runtime ของ Plugin
`openclaw plugins update <id-or-npm-spec>` ใช้กับการติดตั้งที่ติดตามไว้ การส่ง npm package spec ที่มี dist-tag หรือเวอร์ชันแบบเจาะจงจะ resolve ชื่อแพ็กเกจกลับไปยังระเบียน Plugin ที่ติดตามไว้ และบันทึก spec ใหม่สำหรับการอัปเดตในอนาคต การส่งชื่อแพ็กเกจโดยไม่มีเวอร์ชันจะย้ายการติดตั้งแบบ exact pinned กลับไปยัง release line ค่าเริ่มต้นของรีจิสทรี หาก Plugin npm ที่ติดตั้งอยู่ตรงกับเวอร์ชันที่ resolve ได้และ artifact identity ที่บันทึกไว้แล้ว OpenClaw จะข้ามการอัปเดตโดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน config ใหม่
เมื่อ `openclaw update` ทำงานบนช่อง beta ระเบียน Plugin npm และ ClawHub ใน default-line จะลอง `@beta` ก่อน และ fallback ไปยัง default/latest เมื่อไม่มี release beta ของ Plugin เวอร์ชันแบบเจาะจงและแท็กที่ระบุชัดเจนจะยังคงถูกตรึงไว้

`--pin` ใช้ได้กับ npm เท่านั้น ไม่รองรับการใช้ร่วมกับ `--marketplace` เพราะการติดตั้งจาก marketplace จะ persist metadata แหล่ง marketplace แทน npm spec

`--dangerously-force-unsafe-install` เป็น override แบบ break-glass สำหรับ false positive จากตัวสแกนโค้ดอันตรายในตัว อนุญาตให้การติดตั้ง Plugin และการอัปเดต Plugin เดินต่อผ่าน findings ระดับ `critical` ในตัวได้ แต่ยังไม่ข้าม policy block ของ `before_install` จาก Plugin หรือการบล็อกเมื่อสแกนล้มเหลว การสแกนตอนติดตั้งจะละเว้นไฟล์และไดเรกทอรีทดสอบทั่วไป เช่น `tests/`, `__tests__/`, `*.test.*` และ `*.spec.*` เพื่อหลีกเลี่ยงการบล็อก test mock ที่แพ็กมาด้วย entrypoint runtime ของ Plugin ที่ประกาศไว้ยังถูกสแกนอยู่ แม้ว่าจะใช้ชื่อใดชื่อหนึ่งเหล่านั้นก็ตาม

แฟล็ก CLI นี้ใช้กับ flow การติดตั้ง/อัปเดต Plugin เท่านั้น การติดตั้ง dependency ของ skill ที่มี Gateway รองรับจะใช้ request override `dangerouslyForceUnsafeInstall` ที่สอดคล้องกันแทน ส่วน `openclaw skills install` ยังคงเป็น flow แยกสำหรับดาวน์โหลด/ติดตั้ง skill จาก ClawHub

หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกซ่อนหรือถูกบล็อกโดยการสแกน ให้เปิด dashboard ของ ClawHub หรือรัน `clawhub package rescan <name>` เพื่อขอให้ ClawHub ตรวจสอบอีกครั้ง `--dangerously-force-unsafe-install` มีผลเฉพาะการติดตั้งบนเครื่องของคุณเองเท่านั้น ไม่ได้ขอให้ ClawHub สแกน Plugin ใหม่หรือทำให้ release ที่ถูกบล็อกเป็นสาธารณะ

บันเดิลที่เข้ากันได้จะเข้าร่วม flow list/inspect/enable/disable ของ Plugin เดียวกัน การรองรับ runtime ปัจจุบันรวมถึง bundle skills, command-skills ของ Claude, ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` ของ Claude และ `lspServers` ที่ประกาศใน manifest, command-skills ของ Cursor และไดเรกทอรี hook ของ Codex ที่เข้ากันได้

`openclaw plugins inspect <id>` ยังรายงานความสามารถของบันเดิลที่ตรวจพบ รวมถึงรายการเซิร์ฟเวอร์ MCP และ LSP ที่รองรับหรือไม่รองรับสำหรับ Plugin ที่มีบันเดิลรองรับ

แหล่ง marketplace อาจเป็นชื่อ known-marketplace ของ Claude จาก `~/.claude/plugins/known_marketplaces.json`, root ของ marketplace ภายในเครื่องหรือพาธ `marketplace.json`, shorthand ของ GitHub เช่น `owner/repo`, URL ของ repo GitHub หรือ URL git สำหรับ marketplace ระยะไกล รายการ Plugin ต้องอยู่ภายใน repo marketplace ที่ clone มา และใช้เฉพาะแหล่งพาธแบบ relative เท่านั้น

ดูรายละเอียดทั้งหมดที่ [เอกสารอ้างอิง CLI `openclaw plugins`](/th/cli/plugins)

## ภาพรวม API ของ Plugin

Native plugins ส่งออก entry object ที่เปิดเผย `register(api)` Plugin รุ่นเก่าอาจยังใช้ `activate(api)` เป็น alias แบบ legacy แต่ Plugin ใหม่ควรใช้ `register`

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

OpenClaw โหลด entry object และเรียก `register(api)` ระหว่างการ activate Plugin loader ยังคง fallback ไปที่ `activate(api)` สำหรับ Plugin รุ่นเก่า แต่ Plugin ที่มาพร้อมชุดติดตั้งและ Plugin ภายนอกใหม่ควรมอง `register` เป็น contract สาธารณะ

`api.registrationMode` บอก Plugin ว่าเหตุใด entry ของมันจึงถูกโหลด:

| โหมด | ความหมาย |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full` | การ activate runtime ลงทะเบียน tools, hooks, services, commands, routes และ side effects แบบ live อื่นๆ |
| `discovery` | การค้นพบความสามารถแบบอ่านอย่างเดียว ลงทะเบียน providers และ metadata; โค้ด entry ของ Plugin ที่เชื่อถือได้อาจโหลดขึ้นมา แต่ให้ข้าม side effects แบบ live |
| `setup-only` | การโหลด metadata การตั้งค่า Channel ผ่าน setup entry แบบเบา |
| `setup-runtime` | การโหลดการตั้งค่า Channel ที่ต้องใช้ runtime entry ด้วย |
| `cli-metadata` | การรวบรวม metadata ของคำสั่ง CLI เท่านั้น |

Plugin entries ที่เปิด sockets, databases, background workers หรือ clients ที่มีอายุยาว ควร guard side effects เหล่านั้นด้วย `api.registrationMode === "full"` การโหลด discovery ถูก cache แยกจากการโหลดเพื่อ activate และไม่แทนที่รีจิสทรี Gateway ที่กำลังทำงานอยู่ Discovery เป็นแบบไม่ activate ไม่ใช่แบบ import-free: OpenClaw อาจ evaluate entry ของ Plugin ที่เชื่อถือได้หรือโมดูล Channel Plugin เพื่อสร้าง snapshot รักษา top level ของโมดูลให้เบาและไม่มี side effect และย้าย network clients, subprocesses, listeners, การอ่าน credentials และการเริ่ม service ไว้หลังพาธ full-runtime

วิธีลงทะเบียนทั่วไป:

| วิธี | สิ่งที่ลงทะเบียน |
| --------------------------------------- | --------------------------- |
| `registerProvider` | ผู้ให้บริการโมเดล (LLM) |
| `registerChannel` | Channel แชต |
| `registerTool` | เครื่องมือ Agent |
| `registerHook` / `on(...)` | Lifecycle hooks |
| `registerSpeechProvider` | Text-to-speech / STT |
| `registerRealtimeTranscriptionProvider` | Streaming STT |
| `registerRealtimeVoiceProvider` | เสียง realtime แบบ duplex |
| `registerMediaUnderstandingProvider` | การวิเคราะห์ภาพ/เสียง |
| `registerImageGenerationProvider` | การสร้างภาพ |
| `registerMusicGenerationProvider` | การสร้างเพลง |
| `registerVideoGenerationProvider` | การสร้างวิดีโอ |
| `registerWebFetchProvider` | ผู้ให้บริการ web fetch / scrape |
| `registerWebSearchProvider` | การค้นหาเว็บ |
| `registerHttpRoute` | endpoint HTTP |
| `registerCommand` / `registerCli` | คำสั่ง CLI |
| `registerContextEngine` | context engine |
| `registerService` | service เบื้องหลัง |

พฤติกรรม hook guard สำหรับ typed lifecycle hooks:

- `before_tool_call`: `{ block: true }` เป็น terminal; handlers ที่มี priority ต่ำกว่าจะถูกข้าม
- `before_tool_call`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `before_install`: `{ block: true }` เป็น terminal; handlers ที่มี priority ต่ำกว่าจะถูกข้าม
- `before_install`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็น terminal; handlers ที่มี priority ต่ำกว่าจะถูกข้าม
- `message_sending`: `{ cancel: false }` เป็น no-op และไม่ล้าง cancel ก่อนหน้า

app-server ของ Native Codex เชื่อม bridge เหตุการณ์เครื่องมือแบบ Codex-native กลับเข้าสู่พื้นผิว hook นี้ Plugin สามารถบล็อกเครื่องมือ native Codex ผ่าน `before_tool_call`, สังเกตผลลัพธ์ผ่าน `after_tool_call` และเข้าร่วมการอนุมัติ `PermissionRequest` ของ Codex ได้ bridge ยังไม่ rewrite อาร์กิวเมนต์ของเครื่องมือ Codex-native ขอบเขตการรองรับ runtime ของ Codex ที่แน่นอนอยู่ใน [contract การรองรับ Codex harness v1](/th/plugins/codex-harness#v1-support-contract)

สำหรับพฤติกรรม typed hook แบบเต็ม ดู [ภาพรวม SDK](/th/plugins/sdk-overview#hook-decision-semantics)

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins) - สร้าง Plugin ของคุณเอง
- [ชุดรวม Plugin](/th/plugins/bundles) - ความเข้ากันได้ของชุดรวม Codex/Claude/Cursor
- [manifest ของ Plugin](/th/plugins/manifest) - สคีมา manifest
- [การลงทะเบียนเครื่องมือ](/th/plugins/building-plugins#registering-agent-tools) - เพิ่มเครื่องมือเอเจนต์ใน Plugin
- [กลไกภายในของ Plugin](/th/plugins/architecture) - โมเดลความสามารถและไปป์ไลน์การโหลด
- [Plugin จากชุมชน](/th/plugins/community) - รายการของบุคคลที่สาม
