---
read_when:
    - การติดตั้งหรือกำหนดค่า Plugin
    - ทำความเข้าใจการค้นพบ Plugin และกฎการโหลด
    - การทำงานกับชุด Plugin ที่เข้ากันได้กับ Codex/Claude
sidebarTitle: Install and Configure
summary: ติดตั้ง กำหนดค่า และจัดการ Plugin ของ OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-02T10:32:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9378ef4a6aef26949148702f2f6d8537811869511e8830ae5c3d560ff06d98b
    source_path: tools/plugin.md
    workflow: 16
---

Plugin ขยาย OpenClaw ด้วยความสามารถใหม่ๆ: ช่องทาง, ผู้ให้บริการโมเดล,
ชุดควบคุมเอเจนต์, เครื่องมือ, Skills, เสียง, การถอดเสียงแบบเรียลไทม์, เสียงแบบเรียลไทม์,
การทำความเข้าใจสื่อ, การสร้างรูปภาพ, การสร้างวิดีโอ, การดึงข้อมูลเว็บ, การ
ค้นหาเว็บ และอื่นๆ Plugin บางตัวเป็น **แกนหลัก** (มาพร้อมกับ OpenClaw) ส่วนตัวอื่น
เป็น **ภายนอก** Plugin ภายนอกส่วนใหญ่เผยแพร่และค้นพบผ่าน
[ClawHub](/th/tools/clawhub) Npm ยังรองรับสำหรับการติดตั้งโดยตรงและสำหรับ
ชุดแพ็กเกจ Plugin ที่ OpenClaw เป็นเจ้าของชั่วคราวในระหว่างที่การย้ายนี้เสร็จสิ้น

## เริ่มต้นอย่างรวดเร็ว

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

    จากนั้นกำหนดค่าภายใต้ `plugins.entries.\<id\>.config` ในไฟล์คอนฟิกของคุณ

  </Step>

  <Step title="ตรวจสอบ Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    ใช้ `--runtime` เมื่อคุณต้องพิสูจน์เครื่องมือ บริการ เมธอด Gateway
    hooks หรือคำสั่ง CLI ที่ Plugin เป็นเจ้าของที่ลงทะเบียนไว้ `inspect` แบบธรรมดาเป็นการตรวจสอบ
    manifest/registry แบบเย็น และจงใจหลีกเลี่ยงการนำเข้า runtime ของ Plugin

  </Step>
</Steps>

หากคุณต้องการควบคุมแบบเนทีฟสำหรับแชต ให้เปิดใช้ `commands.plugins: true` และใช้:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

เส้นทางการติดตั้งใช้ resolver เดียวกับ CLI: เส้นทาง/ไฟล์เก็บถาวรในเครื่อง,
`clawhub:<pkg>` แบบระบุชัดเจน, `npm:<pkg>` แบบระบุชัดเจน, `git:<repo>` แบบระบุชัดเจน หรือ spec
แพ็กเกจแบบ bare (ClawHub ก่อน จากนั้น fallback ไปยัง npm)

หากคอนฟิกไม่ถูกต้อง การติดตั้งโดยปกติจะล้มเหลวแบบปิดและชี้คุณไปที่
`openclaw doctor --fix` ข้อยกเว้นในการกู้คืนเพียงอย่างเดียวคือเส้นทางติดตั้งใหม่ของ bundled-plugin
แบบแคบสำหรับ Plugin ที่เลือกใช้
`openclaw.install.allowInvalidConfigRecovery`
ระหว่างการเริ่มต้น Gateway คอนฟิกที่ไม่ถูกต้องของ Plugin หนึ่งตัวจะถูกแยกไว้เฉพาะ Plugin นั้น:
การเริ่มต้นจะบันทึกปัญหา `plugins.entries.<id>.config` ข้าม Plugin นั้นระหว่าง
โหลด และทำให้ Plugin กับช่องทางอื่นๆ ยังออนไลน์อยู่ รัน `openclaw doctor --fix`
เพื่อกักคอนฟิก Plugin ที่เสียโดยปิดใช้รายการ Plugin นั้นและลบ
payload คอนฟิกที่ไม่ถูกต้องของมัน; การสำรองคอนฟิกตามปกติจะเก็บค่าก่อนหน้าไว้
เมื่อคอนฟิกช่องทางอ้างอิง Plugin ที่ค้นหาไม่พบอีกแล้ว แต่
id ของ Plugin ที่ค้างเดิมยังอยู่ในคอนฟิก Plugin หรือบันทึกการติดตั้งเดียวกัน การเริ่มต้น Gateway
จะบันทึกคำเตือนและข้ามช่องทางนั้นแทนที่จะบล็อกทุกช่องทางอื่น
รัน `openclaw doctor --fix` เพื่อลบรายการช่องทาง/Plugin ที่ค้างอยู่; คีย์
ช่องทางที่ไม่รู้จักและไม่มีหลักฐาน Plugin ที่ค้างอยู่ยังคงทำให้การตรวจสอบล้มเหลว เพื่อให้การพิมพ์ผิดยัง
มองเห็นได้
หากตั้งค่า `plugins.enabled: false` ไว้ การอ้างอิง Plugin ที่ค้างอยู่จะถูกถือว่าไม่มีผล:
การเริ่มต้น Gateway จะข้ามงานค้นหา/โหลด Plugin และ `openclaw doctor` จะคง
คอนฟิก Plugin ที่ปิดใช้อยู่ไว้แทนที่จะลบอัตโนมัติ เปิดใช้ Plugin อีกครั้งก่อน
รันการล้างข้อมูลด้วย doctor หากคุณต้องการลบ id ของ Plugin ที่ค้างอยู่

การติดตั้ง dependency ของ Plugin เกิดขึ้นเฉพาะระหว่าง flow การติดตั้ง/อัปเดตแบบชัดเจน หรือ
การซ่อมแซมด้วย doctor เท่านั้น การเริ่มต้น Gateway, การโหลดคอนฟิกใหม่ และการตรวจสอบ runtime จะ
ไม่รัน package manager หรือซ่อม dependency tree Plugin ในเครื่องต้อง
ติดตั้ง dependency ไว้แล้ว ส่วน Plugin จาก npm, git และ ClawHub จะ
ติดตั้งภายใต้ราก Plugin ที่ OpenClaw จัดการ dependency ของ npm อาจถูก hoist
ภายในราก npm ที่ OpenClaw จัดการ; การติดตั้ง/อัปเดตจะสแกนรากที่จัดการนั้นก่อน
trust และการถอนการติดตั้งจะลบแพ็กเกจที่ npm จัดการผ่าน npm Plugin ภายนอก
และเส้นทางโหลดแบบกำหนดเองยังคงต้องติดตั้งผ่าน `openclaw plugins install`
ดู [การแก้ dependency ของ Plugin](/th/plugins/dependency-resolution) สำหรับ
วงจรชีวิตตอนติดตั้ง

source checkout เป็น pnpm workspace หากคุณ clone OpenClaw เพื่อปรับ bundled
Plugin ให้รัน `pnpm install`; จากนั้น OpenClaw จะโหลด bundled Plugin จาก
`extensions/<id>` เพื่อให้ใช้การแก้ไขและ dependency เฉพาะแพ็กเกจโดยตรง
การติดตั้งราก npm แบบธรรมดาใช้สำหรับ OpenClaw แบบแพ็กเกจ ไม่ใช่การพัฒนา
จาก source checkout

## ประเภท Plugin

OpenClaw รู้จักรูปแบบ Plugin สองแบบ:

| รูปแบบ     | วิธีทำงาน                                                       | ตัวอย่าง                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + โมดูล runtime; ทำงานในโปรเซส       | Plugin ทางการ, แพ็กเกจ npm ของชุมชน               |
| **Bundle** | เลย์เอาต์ที่เข้ากันได้กับ Codex/Claude/Cursor; แมปเป็นฟีเจอร์ของ OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

ทั้งสองแบบจะแสดงใต้ `openclaw plugins list` ดู [Plugin Bundles](/th/plugins/bundles) สำหรับรายละเอียด bundle

หากคุณกำลังเขียน native Plugin ให้เริ่มจาก [การสร้าง Plugin](/th/plugins/building-plugins)
และ [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## entrypoint ของแพ็กเกจ

แพ็กเกจ npm ของ native Plugin ต้องประกาศ `openclaw.extensions` ใน `package.json`
แต่ละ entry ต้องอยู่ภายในไดเรกทอรีแพ็กเกจและ resolve ไปยังไฟล์
runtime ที่อ่านได้ หรือไปยังไฟล์ซอร์ส TypeScript ที่มี JavaScript
peer ที่ build แล้วอนุมานได้ เช่น `src/index.ts` ไปยัง `dist/index.js`

ใช้ `openclaw.runtimeExtensions` เมื่อไฟล์ runtime ที่เผยแพร่ไม่ได้อยู่ที่
เส้นทางเดียวกับ source entry เมื่อมีอยู่ `runtimeExtensions` ต้องมี
entry เพียงหนึ่งรายการพอดีสำหรับทุก entry ของ `extensions` รายการที่ไม่ตรงกันทำให้การติดตั้งและ
การค้นหา Plugin ล้มเหลว แทนที่จะ fallback ไปยังเส้นทางซอร์สแบบเงียบๆ หากคุณ
เผยแพร่ `openclaw.setupEntry` ด้วย ให้ใช้ `openclaw.runtimeSetupEntry` สำหรับ
JavaScript peer ที่ build แล้ว; ไฟล์นั้นจำเป็นเมื่อประกาศไว้

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

ClawHub เป็นเส้นทางเผยแพร่หลักสำหรับ Plugin ส่วนใหญ่ รุ่น OpenClaw แบบแพ็กเกจในปัจจุบัน
รวม Plugin ทางการจำนวนมากไว้อยู่แล้ว ดังนั้นโดยปกติไม่จำเป็นต้อง
ติดตั้ง npm แยกต่างหากใน setup ทั่วไป จนกว่า Plugin ที่ OpenClaw เป็นเจ้าของทุกตัวจะ
ย้ายไป ClawHub แล้ว OpenClaw ยังคงส่งแพ็กเกจ Plugin `@openclaw/*` บางตัวบน
npm สำหรับการติดตั้งแบบเก่า/กำหนดเอง และ workflow npm โดยตรง

หาก npm รายงานว่าแพ็กเกจ Plugin `@openclaw/*` เลิกแนะนำแล้ว เวอร์ชันแพ็กเกจนั้น
มาจากชุดแพ็กเกจภายนอกที่เก่ากว่า ใช้ bundled Plugin จาก
OpenClaw ปัจจุบันหรือ checkout ในเครื่องจนกว่าจะเผยแพร่แพ็กเกจ npm ที่ใหม่กว่า

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
  <Accordion title="ผู้ให้บริการโมเดล (เปิดใช้เป็นค่าเริ่มต้น)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory Plugin">
    - `memory-core` — การค้นหาหน่วยความจำแบบ bundled (ค่าเริ่มต้นผ่าน `plugins.slots.memory`)
    - `memory-lancedb` — หน่วยความจำระยะยาวที่รองรับด้วย LanceDB พร้อม auto-recall/capture (ตั้งค่า `plugins.slots.memory = "memory-lancedb"`)

    ดู [Memory LanceDB](/th/plugins/memory-lancedb) สำหรับการตั้งค่า embedding
    ที่เข้ากันได้กับ OpenAI, ตัวอย่าง Ollama, ขีดจำกัด recall และการแก้ปัญหา

  </Accordion>

  <Accordion title="ผู้ให้บริการเสียง (เปิดใช้เป็นค่าเริ่มต้น)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="อื่นๆ">
    - `browser` — bundled browser Plugin สำหรับเครื่องมือ browser, CLI `openclaw browser`, เมธอด Gateway `browser.request`, browser runtime และบริการควบคุม browser เริ่มต้น (เปิดใช้เป็นค่าเริ่มต้น; ปิดใช้ก่อนแทนที่)
    - `copilot-proxy` — สะพาน VS Code Copilot Proxy (ปิดใช้เป็นค่าเริ่มต้น)

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

| ฟิลด์            | คำอธิบาย                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | สวิตช์หลัก (ค่าเริ่มต้น: `true`)                           |
| `allow`          | allowlist ของ Plugin (ไม่บังคับ)                               |
| `deny`           | denylist ของ Plugin (ไม่บังคับ; deny ชนะ)                     |
| `load.paths`     | ไฟล์/ไดเรกทอรี Plugin เพิ่มเติม                            |
| `slots`          | ตัวเลือก slot แบบเอกสิทธิ์ (เช่น `memory`, `contextEngine`) |
| `entries.\<id\>` | การเปิด/ปิด + คอนฟิกต่อ Plugin                               |

`plugins.allow` เป็นแบบเอกสิทธิ์ เมื่อไม่ว่างเปล่า จะมีเพียง Plugin ที่ระบุไว้เท่านั้นที่โหลด
หรือเปิดเผยเครื่องมือได้ แม้ว่า `tools.allow` จะมี `"*"` หรือชื่อเครื่องมือที่
Plugin เป็นเจ้าของโดยเฉพาะก็ตาม หาก allowlist ของเครื่องมืออ้างอิงเครื่องมือของ Plugin ให้เพิ่ม id ของ Plugin ที่เป็นเจ้าของ
ไปยัง `plugins.allow` หรือลบ `plugins.allow`; `openclaw doctor` จะเตือนเกี่ยวกับ
รูปแบบนี้

การเปลี่ยนแปลงคอนฟิก **ต้องรีสตาร์ท Gateway** หาก Gateway กำลังทำงานด้วย config
watch + การรีสตาร์ทในโปรเซสที่เปิดใช้ (เส้นทาง `openclaw gateway` ค่าเริ่มต้น) โดยปกติ
การรีสตาร์ทนั้นจะดำเนินการอัตโนมัติหลังจากการเขียนคอนฟิกมีผลเพียงครู่เดียว
ไม่มีเส้นทาง hot-reload ที่รองรับสำหรับโค้ด runtime ของ native Plugin หรือ lifecycle
hooks; รีสตาร์ทโปรเซส Gateway ที่ให้บริการช่องทางสดก่อน
คาดหวังให้โค้ด `register(api)`, hooks `api.on(...)`, เครื่องมือ, บริการ หรือ
provider/runtime hooks ที่อัปเดตแล้วทำงาน

`openclaw plugins list` คือสแนปช็อต registry/config ของ Plugin ในเครื่อง Plugin ที่มีสถานะ
`enabled` ตรงนั้นหมายความว่า registry ที่บันทึกไว้และ config ปัจจุบันอนุญาตให้
Plugin เข้าร่วมได้ แต่ไม่ได้พิสูจน์ว่า remote Gateway child ที่กำลังรันอยู่ได้รีสตาร์ต
เข้าสู่โค้ด Plugin เดียวกันแล้ว สำหรับการตั้งค่าแบบ VPS/container ที่มี
wrapper process ให้ส่งการรีสตาร์ตไปยัง process จริงของ `openclaw gateway run`
หรือใช้ `openclaw gateway restart` กับ Gateway ที่กำลังรันอยู่

<Accordion title="สถานะ Plugin: disabled vs missing vs invalid">
  - **Disabled**: มี Plugin อยู่ แต่กฎ enablement ปิดไว้ Config จะถูกเก็บรักษาไว้
  - **Missing**: config อ้างถึง Plugin id ที่ discovery ไม่พบ
  - **Invalid**: มี Plugin อยู่ แต่ config ไม่ตรงกับ schema ที่ประกาศไว้ การเริ่มต้น Gateway จะข้ามเฉพาะ Plugin นั้น; `openclaw doctor --fix` สามารถกักรายการที่ invalid ได้โดยปิดใช้งานและลบ payload config ของรายการนั้น

</Accordion>

## การค้นพบและลำดับความสำคัญ

OpenClaw สแกนหา Plugin ตามลำดับนี้ (รายการแรกที่ตรงกันจะชนะ):

<Steps>
  <Step title="พาธ Config">
    `plugins.load.paths` — พาธไฟล์หรือไดเรกทอรีที่ระบุชัดเจน พาธที่ชี้
    กลับไปยังไดเรกทอรี bundled Plugin ที่แพ็กมากับ OpenClaw เองจะถูกละเว้น;
    รัน `openclaw doctor --fix` เพื่อลบ alias เก่าที่ค้างอยู่เหล่านั้น
  </Step>

  <Step title="Workspace Plugin">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` และ `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Global Plugin">
    `~/.openclaw/<plugin-root>/*.ts` และ `~/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Bundled Plugin">
    มาพร้อมกับ OpenClaw หลายตัวถูกเปิดใช้งานตามค่าเริ่มต้น (model provider, speech)
    ส่วนอื่นต้องเปิดใช้งานอย่างชัดเจน
  </Step>
</Steps>

การติดตั้งแบบแพ็กเกจและ Docker image โดยปกติจะ resolve bundled Plugin จาก
tree `dist/extensions` ที่คอมไพล์แล้ว หากไดเรกทอรี source ของ bundled Plugin
ถูก bind-mount ทับพาธ source ที่แพ็กเกจไว้ซึ่งตรงกัน เช่น
`/app/extensions/synology-chat` OpenClaw จะถือว่าไดเรกทอรี source ที่ mount นั้น
เป็น bundled source overlay และค้นพบก่อน bundle
`/app/dist/extensions/synology-chat` ที่แพ็กเกจไว้ วิธีนี้ช่วยให้ loop ใน container
ของ maintainer ทำงานต่อได้โดยไม่ต้องสลับ bundled Plugin ทุกตัวกลับไปใช้
TypeScript source ตั้งค่า `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` เพื่อบังคับใช้ dist bundle ที่แพ็กเกจไว้
แม้มี source overlay mount อยู่ก็ตาม

### กฎ enablement

- `plugins.enabled: false` ปิดใช้งาน Plugin ทั้งหมดและข้ามงาน discovery/load ของ Plugin
- `plugins.deny` ชนะ allow เสมอ
- `plugins.entries.\<id\>.enabled: false` ปิดใช้งาน Plugin นั้น
- Plugin ที่มีต้นทางจาก workspace จะถูก **ปิดใช้งานตามค่าเริ่มต้น** (ต้องเปิดใช้งานอย่างชัดเจน)
- Bundled Plugin จะใช้ชุด default-on ในตัว เว้นแต่ถูก override
- slot แบบ exclusive สามารถบังคับเปิดใช้งาน Plugin ที่เลือกสำหรับ slot นั้นได้
- bundled opt-in Plugin บางตัวจะถูกเปิดใช้งานอัตโนมัติเมื่อ config ระบุ surface
  ที่ Plugin เป็นเจ้าของ เช่น provider model ref, channel config หรือ harness
  runtime
- config Plugin เก่าที่ค้างอยู่จะถูกเก็บรักษาไว้ขณะที่ `plugins.enabled: false` เปิดใช้งานอยู่;
  เปิดใช้งาน Plugin อีกครั้งก่อนรันการล้างข้อมูลของ doctor หากต้องการลบ id เก่าที่ค้างอยู่
- เส้นทาง Codex ตระกูล OpenAI จะรักษาขอบเขต Plugin แยกกัน:
  `openai-codex/*` เป็นของ OpenAI Plugin ส่วน bundled Codex
  app-server Plugin จะถูกเลือกด้วย `agentRuntime.id: "codex"` หรือ
  model ref แบบเดิม `codex/*`

## การแก้ปัญหา runtime hooks

หาก Plugin ปรากฏใน `plugins list` แต่ side effect หรือ hook ของ `register(api)`
ไม่ทำงานใน traffic ของ live chat ให้ตรวจสอบสิ่งเหล่านี้ก่อน:

- รัน `openclaw gateway status --deep --require-rpc` และยืนยันว่า
  Gateway URL, profile, config path และ process ที่ active เป็นตัวที่คุณกำลังแก้ไข
- รีสตาร์ต Gateway จริงหลังจากการเปลี่ยนแปลง install/config/code ของ Plugin ใน wrapper
  container PID 1 อาจเป็นเพียง supervisor; ให้รีสตาร์ตหรือส่งสัญญาณไปยัง child
  process `openclaw gateway run`
- ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อยืนยัน hook registrations และ
  diagnostics conversation hook ที่ไม่ใช่ bundled เช่น `llm_input`,
  `llm_output`, `before_agent_finalize` และ `agent_end` ต้องมี
  `plugins.entries.<id>.hooks.allowConversationAccess=true`
- สำหรับการสลับ model ให้เลือกใช้ `before_model_resolve` มันทำงานก่อนการ
  resolve model สำหรับ agent turn; `llm_output` จะทำงานหลังจาก model attempt
  สร้าง assistant output แล้วเท่านั้น
- สำหรับหลักฐานของ session model ที่มีผลจริง ให้ใช้ `openclaw sessions` หรือ
  surface session/status ของ Gateway และเมื่อ debug provider payload ให้เริ่ม
  Gateway ด้วย `--raw-stream --raw-stream-path <path>`

### การตั้งค่าเครื่องมือ Plugin ที่ช้า

หาก agent turn ดูเหมือนค้างขณะเตรียมเครื่องมือ ให้เปิด trace logging และ
ตรวจสอบบรรทัด timing ของ plugin tool factory:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

มองหา:

```text
[trace:plugin-tools] factory timings ...
```

สรุปจะแสดงเวลารวมของ factory และ plugin tool factory ที่ช้าที่สุด
รวมถึง plugin id, ชื่อเครื่องมือที่ประกาศ, รูปทรงผลลัพธ์ และระบุว่าเครื่องมือนั้น
เป็น optional หรือไม่ บรรทัดที่ช้าจะถูกยกระดับเป็น warning เมื่อ factory เดียวใช้เวลา
อย่างน้อย 1s หรือการเตรียม plugin tool factory ทั้งหมดใช้เวลาอย่างน้อย 5s

หาก Plugin หนึ่งตัวครองเวลาส่วนใหญ่ ให้ตรวจสอบ runtime registrations ของมัน:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

จากนั้นอัปเดต ติดตั้งใหม่ หรือปิดใช้งาน Plugin นั้น ผู้เขียน Plugin ควรย้าย
การโหลด dependency ที่หนักไปไว้หลังเส้นทาง execution ของเครื่องมือ แทนที่จะทำ
ภายใน tool factory

### ความเป็นเจ้าของ channel หรือ tool ซ้ำกัน

อาการ:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

สิ่งเหล่านี้หมายความว่ามี Plugin ที่เปิดใช้งานมากกว่าหนึ่งตัวพยายามเป็นเจ้าของ channel,
setup flow หรือชื่อ tool เดียวกัน สาเหตุที่พบบ่อยที่สุดคือ external channel Plugin
ถูกติดตั้งอยู่ข้าง bundled Plugin ที่ตอนนี้ให้ channel id เดียวกันแล้ว

ขั้นตอน debug:

- รัน `openclaw plugins list --enabled --verbose` เพื่อดู Plugin ที่เปิดใช้งานทุกตัว
  และต้นทางของแต่ละตัว
- รัน `openclaw plugins inspect <id> --runtime --json` สำหรับ Plugin ที่สงสัยแต่ละตัว และ
  เปรียบเทียบ `channels`, `channelConfigs`, `tools` และ diagnostics
- รัน `openclaw plugins registry --refresh` หลังจากติดตั้งหรือลบ
  package Plugin เพื่อให้ metadata ที่บันทึกไว้สะท้อนการติดตั้งปัจจุบัน
- รีสตาร์ต Gateway หลังการเปลี่ยนแปลง install, registry หรือ config

ตัวเลือกการแก้ไข:

- หาก Plugin หนึ่งตั้งใจแทนที่อีกตัวสำหรับ channel id เดียวกัน
  Plugin ที่ต้องการควรประกาศ `channelConfigs.<channel-id>.preferOver` พร้อม
  plugin id ที่มีลำดับความสำคัญต่ำกว่า ดู [/plugins/manifest#replacing-another-channel-plugin](/th/plugins/manifest#replacing-another-channel-plugin)
- หากความซ้ำเกิดขึ้นโดยไม่ตั้งใจ ให้ปิดใช้งานฝั่งหนึ่งด้วย
  `plugins.entries.<plugin-id>.enabled: false` หรือลบการติดตั้ง Plugin
  เก่าที่ค้างอยู่
- หากคุณเปิดใช้งานทั้งสอง Plugin อย่างชัดเจน OpenClaw จะคงคำขอนั้นไว้และ
  รายงานความขัดแย้ง ให้เลือกเจ้าของหนึ่งรายสำหรับ channel หรือเปลี่ยนชื่อ tool
  ที่ Plugin เป็นเจ้าของเพื่อให้ runtime surface ไม่กำกวม

## Plugin slot (หมวดหมู่ exclusive)

บางหมวดหมู่เป็นแบบ exclusive (active ได้ครั้งละหนึ่งตัวเท่านั้น):

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

| Slot            | สิ่งที่ควบคุม      | ค่าเริ่มต้น             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active memory plugin  | `memory-core`       |
| `contextEngine` | Active context engine | `legacy` (built-in) |

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

openclaw plugins install <package>         # install (ClawHub first, then npm)
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

Bundled Plugin มาพร้อมกับ OpenClaw หลายตัวถูกเปิดใช้งานตามค่าเริ่มต้น (เช่น
bundled model provider, bundled speech provider และ bundled browser
Plugin) bundled Plugin อื่นยังต้องใช้ `openclaw plugins enable <id>`

`--force` เขียนทับ Plugin ที่ติดตั้งอยู่หรือ hook pack ที่มีอยู่เดิมในตำแหน่งนั้น ใช้
`openclaw plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติของ npm
Plugin ที่ติดตามอยู่ ไม่รองรับการใช้ร่วมกับ `--link` ซึ่งใช้พาธ source ซ้ำแทน
การคัดลอกทับ install target ที่จัดการอยู่

เมื่อ `plugins.allow` ถูกตั้งค่าไว้แล้ว `openclaw plugins install` จะเพิ่ม
plugin id ที่ติดตั้งเข้าไปใน allowlist นั้นก่อนเปิดใช้งาน หาก plugin id เดียวกัน
อยู่ใน `plugins.deny` install จะลบ deny entry เก่าที่ค้างอยู่นั้น เพื่อให้
การติดตั้งที่ระบุชัดเจน load ได้ทันทีหลังรีสตาร์ต

OpenClaw เก็บ local plugin registry ที่บันทึกไว้เป็น cold read model สำหรับ
plugin inventory, contribution ownership และ startup planning flow การ install, update,
uninstall, enable และ disable จะ refresh registry นั้นหลังเปลี่ยนสถานะ Plugin
ไฟล์ `plugins/installs.json` เดียวกันเก็บ install metadata ที่คงทนไว้ใน
`installRecords` ระดับบนสุด และ manifest metadata ที่สร้างใหม่ได้ใน `plugins` หาก
registry หาย เก่า หรือ invalid `openclaw plugins registry
--refresh` จะ rebuild manifest view จาก install records, config policy และ
manifest/package metadata โดยไม่โหลด runtime module ของ Plugin
`openclaw plugins update <id-or-npm-spec>` ใช้กับ install ที่ติดตามอยู่ การส่ง
npm package spec ที่มี dist-tag หรือ version ชัดเจนจะ resolve ชื่อ package
กลับไปยัง record Plugin ที่ติดตามอยู่และบันทึก spec ใหม่สำหรับการอัปเดตในอนาคต
การส่งชื่อ package โดยไม่มี version จะย้าย install ที่ pin แบบ exact กลับไปยัง
release line เริ่มต้นของ registry หาก npm Plugin ที่ติดตั้งอยู่ตรงกับ
resolved version และ recorded artifact identity แล้ว OpenClaw จะข้ามการอัปเดต
โดยไม่ดาวน์โหลด ติดตั้งใหม่ หรือเขียน config ใหม่

`--pin` ใช้ได้กับ npm เท่านั้น ไม่รองรับร่วมกับ `--marketplace` เพราะการติดตั้งจาก marketplace จะคง metadata แหล่งที่มาของ marketplace ไว้แทน npm spec.

`--dangerously-force-unsafe-install` เป็น override แบบ break-glass สำหรับผลบวกเท็จจากตัวสแกนโค้ดอันตรายในตัว มันอนุญาตให้การติดตั้ง Plugin และการอัปเดต Plugin ดำเนินต่อผ่าน findings ระดับ `critical` ในตัวได้ แต่ยังไม่ข้าม policy block ของ Plugin `before_install` หรือการบล็อกจาก scan-failure การสแกนตอนติดตั้งจะละเว้นไฟล์และไดเรกทอรีทดสอบทั่วไป เช่น `tests/`, `__tests__/`, `*.test.*` และ `*.spec.*` เพื่อหลีกเลี่ยงการบล็อก test mocks ที่อยู่ในแพ็กเกจ แต่ runtime entrypoints ของ Plugin ที่ประกาศไว้ยังคงถูกสแกน แม้จะใช้ชื่อเหล่านั้นก็ตาม

CLI flag นี้ใช้กับ flow การติดตั้ง/อัปเดต Plugin เท่านั้น การติดตั้ง dependency ของ Skills ที่มี Gateway หนุนหลังจะใช้ request override `dangerouslyForceUnsafeInstall` ที่ตรงกันแทน ขณะที่ `openclaw skills install` ยังคงเป็น flow ดาวน์โหลด/ติดตั้ง Skills จาก ClawHub แยกต่างหาก

หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกซ่อนหรือถูกบล็อกโดยการสแกน ให้เปิดแดชบอร์ด ClawHub หรือรัน `clawhub package rescan <name>` เพื่อขอให้ ClawHub ตรวจสอบอีกครั้ง `--dangerously-force-unsafe-install` มีผลเฉพาะการติดตั้งบนเครื่องของคุณเองเท่านั้น ไม่ได้ขอให้ ClawHub สแกน Plugin ใหม่หรือทำให้ release ที่ถูกบล็อกเป็นสาธารณะ

บันเดิลที่เข้ากันได้จะเข้าร่วม flow รายการ/ตรวจสอบ/เปิดใช้งาน/ปิดใช้งาน Plugin เดียวกัน การรองรับ runtime ปัจจุบันรวมถึง bundle skills, Claude command-skills, ค่าเริ่มต้น Claude `settings.json`, ค่าเริ่มต้น Claude `.lsp.json` และ `lspServers` ที่ประกาศใน manifest, Cursor command-skills และไดเรกทอรี hook ของ Codex ที่เข้ากันได้

`openclaw plugins inspect <id>` ยังรายงานความสามารถของบันเดิลที่ตรวจพบ รวมถึงรายการ MCP และ LSP server ที่รองรับหรือไม่รองรับสำหรับ Plugin ที่มีบันเดิลหนุนหลัง

แหล่ง marketplace อาจเป็นชื่อ known-marketplace ของ Claude จาก `~/.claude/plugins/known_marketplaces.json`, root ของ marketplace ในเครื่องหรือ path `marketplace.json`, GitHub shorthand อย่าง `owner/repo`, URL repo GitHub หรือ git URL สำหรับ remote marketplaces รายการ Plugin ต้องอยู่ภายใน repo marketplace ที่ clone มาแล้ว และใช้เฉพาะแหล่ง path แบบ relative เท่านั้น

ดูรายละเอียดทั้งหมดได้ที่ [เอกสารอ้างอิง CLI `openclaw plugins`](/th/cli/plugins)

## ภาพรวม API ของ Plugin

Native plugins export entry object ที่เปิดเผย `register(api)` Plugin รุ่นเก่าอาจยังใช้ `activate(api)` เป็น alias เดิมได้ แต่ Plugin ใหม่ควรใช้ `register`

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

OpenClaw โหลด entry object และเรียก `register(api)` ระหว่างการเปิดใช้งาน Plugin ตัวโหลดจะยัง fallback ไปใช้ `activate(api)` สำหรับ Plugin รุ่นเก่า แต่ bundled plugins และ Plugin ภายนอกใหม่ควรถือว่า `register` เป็น contract สาธารณะ

`api.registrationMode` บอก Plugin ว่า entry ของมันถูกโหลดด้วยเหตุผลใด:

| โหมด            | ความหมาย                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | การเปิดใช้งาน runtime ลงทะเบียน tools, hooks, services, commands, routes และ live side effects อื่นๆ                              |
| `discovery`     | การค้นหาความสามารถแบบอ่านอย่างเดียว ลงทะเบียน providers และ metadata; โค้ด entry ของ Plugin ที่เชื่อถือได้อาจโหลดได้ แต่ให้ข้าม live side effects |
| `setup-only`    | การโหลด metadata การตั้งค่าช่องทางผ่าน setup entry แบบเบา                                                                |
| `setup-runtime` | การโหลดการตั้งค่าช่องทางที่ต้องใช้ runtime entry ด้วย                                                                         |
| `cli-metadata`  | การรวบรวม metadata ของคำสั่ง CLI เท่านั้น                                                                                            |

Plugin entries ที่เปิด sockets, databases, background workers หรือ clients ที่มีอายุยาว ควรป้องกัน side effects เหล่านั้นด้วย `api.registrationMode === "full"` โหลดแบบ discovery จะถูก cache แยกจากโหลดการเปิดใช้งาน และไม่แทนที่ Gateway registry ที่กำลังรันอยู่ Discovery เป็นแบบไม่เปิดใช้งาน ไม่ใช่แบบปลอด import: OpenClaw อาจ evaluate entry ของ Plugin ที่เชื่อถือได้หรือโมดูล channel plugin เพื่อสร้าง snapshot รักษา top level ของโมดูลให้เบาและไม่มี side effects และย้าย network clients, subprocesses, listeners, การอ่าน credentials และการเริ่ม service ไปไว้หลังเส้นทาง full-runtime

เมธอดลงทะเบียนทั่วไป:

| เมธอด                                  | สิ่งที่ลงทะเบียน           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | ผู้ให้บริการโมเดล (LLM)        |
| `registerChannel`                       | ช่องทางแชต                |
| `registerTool`                          | เครื่องมือ Agent                  |
| `registerHook` / `on(...)`              | Lifecycle hooks             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | Streaming STT               |
| `registerRealtimeVoiceProvider`         | เสียง realtime แบบ duplex       |
| `registerMediaUnderstandingProvider`    | การวิเคราะห์รูปภาพ/เสียง        |
| `registerImageGenerationProvider`       | การสร้างรูปภาพ            |
| `registerMusicGenerationProvider`       | การสร้างเพลง            |
| `registerVideoGenerationProvider`       | การสร้างวิดีโอ            |
| `registerWebFetchProvider`              | ผู้ให้บริการ Web fetch / scrape |
| `registerWebSearchProvider`             | การค้นหาเว็บ                  |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | คำสั่ง CLI                |
| `registerContextEngine`                 | Context engine              |
| `registerService`                       | Background service          |

พฤติกรรม hook guard สำหรับ typed lifecycle hooks:

- `before_tool_call`: `{ block: true }` เป็น terminal; handlers ที่มี priority ต่ำกว่าจะถูกข้าม
- `before_tool_call`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `before_install`: `{ block: true }` เป็น terminal; handlers ที่มี priority ต่ำกว่าจะถูกข้าม
- `before_install`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็น terminal; handlers ที่มี priority ต่ำกว่าจะถูกข้าม
- `message_sending`: `{ cancel: false }` เป็น no-op และไม่ล้าง cancel ก่อนหน้า

Native Codex app-server จะ bridge เหตุการณ์เครื่องมือ Codex-native กลับเข้ามายัง hook surface นี้ Plugin สามารถบล็อกเครื่องมือ Codex native ผ่าน `before_tool_call`, สังเกตผลลัพธ์ผ่าน `after_tool_call` และเข้าร่วมการอนุมัติ `PermissionRequest` ของ Codex ได้ bridge ยังไม่ rewrite arguments ของเครื่องมือ Codex-native ขอบเขตการรองรับ runtime ของ Codex ที่แน่นอนอยู่ใน [support contract ของ Codex harness v1](/th/plugins/codex-harness#v1-support-contract)

สำหรับพฤติกรรม typed hook แบบครบถ้วน ดู [ภาพรวม SDK](/th/plugins/sdk-overview#hook-decision-semantics)

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins) — สร้าง Plugin ของคุณเอง
- [บันเดิล Plugin](/th/plugins/bundles) — ความเข้ากันได้ของบันเดิล Codex/Claude/Cursor
- [manifest ของ Plugin](/th/plugins/manifest) — schema ของ manifest
- [การลงทะเบียน tools](/th/plugins/building-plugins#registering-agent-tools) — เพิ่ม agent tools ใน Plugin
- [ภายในของ Plugin](/th/plugins/architecture) — โมเดลความสามารถและ load pipeline
- [Plugin ชุมชน](/th/plugins/community) — รายการจาก third-party
