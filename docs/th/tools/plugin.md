---
read_when:
    - การติดตั้งหรือกำหนดค่า Plugin
    - ทำความเข้าใจกฎการค้นพบและการโหลด Plugin
    - การทำงานกับชุดรวม Plugin ที่เข้ากันได้กับ Codex/Claude
sidebarTitle: Install and Configure
summary: ติดตั้ง กำหนดค่า และจัดการ Plugin ของ OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-05-01T10:22:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1efa91ac4d78c6707a1e9e5cd5a5958642128a61b5873e169f66c7c2b954adb9
    source_path: tools/plugin.md
    workflow: 16
---

Plugin ขยาย OpenClaw ด้วยความสามารถใหม่: ช่องทาง, ผู้ให้บริการโมเดล,
ชุดควบคุมเอเจนต์, เครื่องมือ, Skills, เสียงพูด, การถอดเสียงแบบเรียลไทม์,
เสียงแบบเรียลไทม์, การทำความเข้าใจสื่อ, การสร้างภาพ, การสร้างวิดีโอ, การดึงเว็บ, การ
ค้นหาเว็บ และอื่น ๆ บาง Plugin เป็น **core** (จัดส่งมากับ OpenClaw) ส่วนอื่น
เป็น **external** Plugin ภายนอกส่วนใหญ่เผยแพร่และค้นพบผ่าน
[ClawHub](/th/tools/clawhub) npm ยังคงรองรับสำหรับการติดตั้งโดยตรงและสำหรับ
ชุดแพ็กเกจ Plugin ชั่วคราวที่ OpenClaw เป็นเจ้าของ ระหว่างที่การย้ายนี้เสร็จสิ้น

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ดูว่ามีอะไรโหลดอยู่">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="ติดตั้ง Plugin">
    ```bash
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

    จากนั้นกำหนดค่าภายใต้ `plugins.entries.\<id\>.config` ในไฟล์การกำหนดค่าของคุณ

  </Step>

  <Step title="ตรวจสอบ Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    ใช้ `--runtime` เมื่อคุณต้องพิสูจน์เครื่องมือ บริการ เมธอด Gateway
    hook หรือคำสั่ง CLI ที่ Plugin เป็นเจ้าของและลงทะเบียนไว้ `inspect` แบบปกติเป็นการตรวจ
    manifest/registry แบบเย็น และตั้งใจหลีกเลี่ยงการนำเข้า runtime ของ Plugin

  </Step>
</Steps>

หากคุณต้องการควบคุมแบบเนทีฟในแชต ให้เปิดใช้ `commands.plugins: true` แล้วใช้:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

เส้นทางการติดตั้งใช้ resolver เดียวกับ CLI: พาธ/archive ในเครื่อง, ระบุ
`clawhub:<pkg>` ชัดเจน, ระบุ `npm:<pkg>` ชัดเจน, ระบุ `git:<repo>` ชัดเจน หรือ spec
แพ็กเกจแบบเปล่า (ClawHub ก่อน แล้ว fallback ไป npm)

หากการกำหนดค่าไม่ถูกต้อง โดยปกติการติดตั้งจะล้มเหลวแบบปิดและชี้คุณไปที่
`openclaw doctor --fix` ข้อยกเว้นสำหรับการกู้คืนมีเพียงเส้นทางติดตั้ง Plugin ที่จัดชุดมาใหม่
แบบแคบสำหรับ Plugin ที่เลือกใช้
`openclaw.install.allowInvalidConfigRecovery`
ระหว่างการเริ่มต้น Gateway การกำหนดค่าที่ไม่ถูกต้องของ Plugin หนึ่งจะถูกแยกไว้กับ Plugin นั้น:
การเริ่มต้นจะบันทึกปัญหา `plugins.entries.<id>.config` ข้าม Plugin นั้นระหว่าง
โหลด และทำให้ Plugin กับช่องทางอื่นยังออนไลน์อยู่ เรียกใช้ `openclaw doctor --fix`
เพื่อกักการกำหนดค่า Plugin ที่เสียโดยปิดใช้รายการ Plugin นั้นและลบ payload
การกำหนดค่าที่ไม่ถูกต้องของมันออก การสำรองข้อมูลการกำหนดค่าปกติจะเก็บค่าก่อนหน้าไว้
เมื่อการกำหนดค่าช่องทางอ้างถึง Plugin ที่ค้นพบไม่ได้อีกต่อไป แต่ id Plugin เก่าเดียวกัน
ยังคงอยู่ในการกำหนดค่า Plugin หรือระเบียนการติดตั้ง การเริ่มต้น Gateway
จะบันทึกคำเตือนและข้ามช่องทางนั้นแทนที่จะบล็อกช่องทางอื่นทั้งหมด
เรียกใช้ `openclaw doctor --fix` เพื่อลบรายการช่องทาง/Plugin ที่ค้างอยู่ คีย์
ช่องทางที่ไม่รู้จักซึ่งไม่มีหลักฐาน Plugin ค้างยังคงทำให้การตรวจสอบความถูกต้องล้มเหลวเพื่อให้เห็นการพิมพ์ผิดได้
หากตั้งค่า `plugins.enabled: false` การอ้างอิง Plugin ที่ค้างจะถูกถือว่าไม่ทำงาน:
การเริ่มต้น Gateway จะข้ามงานค้นพบ/โหลด Plugin และ `openclaw doctor` จะคง
การกำหนดค่า Plugin ที่ปิดใช้งานไว้แทนที่จะลบอัตโนมัติ เปิดใช้ Plugin อีกครั้งก่อน
เรียกใช้การล้างข้อมูลด้วย doctor หากคุณต้องการลบ id Plugin ที่ค้าง

การติดตั้ง OpenClaw แบบแพ็กเกจจะไม่ติดตั้ง dependency tree ของ runtime ของทุก Plugin ที่จัดชุดมา
ล่วงหน้าอย่างกระตือรือร้น เมื่อ Plugin ที่ OpenClaw เป็นเจ้าของและจัดชุดมาเปิดใช้งานจาก
การกำหนดค่า Plugin, การกำหนดค่าช่องทางแบบเดิม หรือ manifest ที่เปิดใช้เป็นค่าเริ่มต้น การเริ่มต้น
จะซ่อมเฉพาะ dependency runtime ที่ Plugin นั้นประกาศไว้ก่อนนำเข้า
สถานะ auth ของช่องทางที่ persist ไว้อย่างเดียวจะไม่เปิดใช้งานช่องทางที่จัดชุดมาเพื่อ
การซ่อม dependency runtime ระหว่างเริ่มต้น Gateway
การปิดใช้งานแบบชัดเจนยังคงชนะ: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` และ `channels.<id>.enabled: false`
จะป้องกันการซ่อม dependency runtime ของชุดที่จัดมาโดยอัตโนมัติสำหรับ Plugin/ช่องทางนั้น
`plugins.allow` ที่ไม่ว่างยังจำกัดการซ่อม dependency runtime ของชุดที่จัดมาและเปิดใช้เป็นค่าเริ่มต้น;
การเปิดใช้ช่องทางที่จัดชุดมาอย่างชัดเจน (`channels.<id>.enabled: true`) ยังสามารถ
ซ่อม dependency ของ Plugin ของช่องทางนั้นได้
Plugin ภายนอกและพาธโหลดแบบกำหนดเองยังต้องติดตั้งผ่าน
`openclaw plugins install`
ดู [การแก้ไข dependency ของ Plugin](/th/plugins/dependency-resolution) สำหรับวงจรชีวิต
การวางแผนและการจัดเตรียมแบบเต็ม

## ประเภท Plugin

OpenClaw รู้จักรูปแบบ Plugin สองแบบ:

| รูปแบบ     | วิธีทำงาน                                                       | ตัวอย่าง                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + โมดูล runtime; รันในโปรเซส       | Plugin อย่างเป็นทางการ, แพ็กเกจ npm ของชุมชน               |
| **Bundle** | เลย์เอาต์ที่เข้ากันได้กับ Codex/Claude/Cursor; แมปกับฟีเจอร์ของ OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

ทั้งสองจะแสดงใต้ `openclaw plugins list` ดู [Plugin Bundles](/th/plugins/bundles) สำหรับรายละเอียด bundle

หากคุณกำลังเขียน Plugin แบบ native ให้เริ่มจาก [การสร้าง Plugin](/th/plugins/building-plugins)
และ [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## Entrypoint ของแพ็กเกจ

แพ็กเกจ npm ของ Plugin แบบ native ต้องประกาศ `openclaw.extensions` ใน `package.json`
แต่ละ entry ต้องอยู่ภายในไดเรกทอรีแพ็กเกจและ resolve ไปยังไฟล์
runtime ที่อ่านได้ หรือไปยังไฟล์ซอร์ส TypeScript ที่มี peer JavaScript ที่ build แล้วซึ่งอนุมานได้
เช่น `src/index.ts` ไปยัง `dist/index.js`

ใช้ `openclaw.runtimeExtensions` เมื่อไฟล์ runtime ที่เผยแพร่ไม่ได้อยู่ที่
พาธเดียวกับ entry ของซอร์ส เมื่อมีอยู่ `runtimeExtensions` ต้องมี
entry หนึ่งรายการพอดีสำหรับทุก entry ใน `extensions` รายการที่ไม่ตรงกันจะทำให้การติดตั้งและ
การค้นพบ Plugin ล้มเหลวแทนที่จะ fallback ไปยังพาธซอร์สแบบเงียบ ๆ

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Plugin อย่างเป็นทางการ

### แพ็กเกจ npm ที่ OpenClaw เป็นเจ้าของระหว่างการย้าย

ClawHub เป็นเส้นทางเผยแพร่หลักสำหรับ Plugin ส่วนใหญ่ รุ่น OpenClaw แบบแพ็กเกจปัจจุบัน
จัดชุด Plugin อย่างเป็นทางการจำนวนมากมาแล้ว ดังนั้น Plugin เหล่านั้นไม่จำเป็นต้อง
ติดตั้ง npm แยกในการตั้งค่าปกติ จนกว่า Plugin ที่ OpenClaw เป็นเจ้าของทั้งหมดจะ
ย้ายไป ClawHub แล้ว OpenClaw ยังจัดส่งแพ็กเกจ Plugin `@openclaw/*` บางรายการบน
npm สำหรับการติดตั้งเก่า/กำหนดเองและ workflow npm โดยตรง

หาก npm รายงานว่าแพ็กเกจ Plugin `@openclaw/*` deprecated แพ็กเกจ
เวอร์ชันนั้นมาจากสายแพ็กเกจภายนอกที่เก่ากว่า ใช้ Plugin ที่จัดชุดมากับ
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

### Core (จัดส่งมากับ OpenClaw)

<AccordionGroup>
  <Accordion title="ผู้ให้บริการโมเดล (เปิดใช้เป็นค่าเริ่มต้น)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory Plugin">
    - `memory-core` — การค้นหา memory ที่จัดชุดมา (ค่าเริ่มต้นผ่าน `plugins.slots.memory`)
    - `memory-lancedb` — memory ระยะยาวแบบติดตั้งเมื่อต้องใช้ พร้อม auto-recall/capture (ตั้งค่า `plugins.slots.memory = "memory-lancedb"`)

    ดู [Memory LanceDB](/th/plugins/memory-lancedb) สำหรับการตั้งค่า embedding ที่เข้ากันได้กับ OpenAI,
    ตัวอย่าง Ollama, ขีดจำกัด recall และการแก้ไขปัญหา

  </Accordion>

  <Accordion title="ผู้ให้บริการเสียงพูด (เปิดใช้เป็นค่าเริ่มต้น)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="อื่น ๆ">
    - `browser` — Plugin browser ที่จัดชุดมาสำหรับเครื่องมือ browser, CLI `openclaw browser`, เมธอด gateway `browser.request`, runtime ของ browser และบริการควบคุม browser เริ่มต้น (เปิดใช้เป็นค่าเริ่มต้น; ปิดใช้ก่อนแทนที่)
    - `copilot-proxy` — สะพาน VS Code Copilot Proxy (ปิดใช้เป็นค่าเริ่มต้น)

  </Accordion>
</AccordionGroup>

กำลังมองหา Plugin จากบุคคลที่สามใช่ไหม ดู [Plugin ชุมชน](/th/plugins/community)

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
| `entries.\<id\>` | สวิตช์ต่อ Plugin + การกำหนดค่า                               |

`plugins.allow` เป็นแบบเอกสิทธิ์ เมื่อไม่ว่าง จะโหลดหรือ expose เครื่องมือได้เฉพาะ
Plugin ที่ระบุไว้ แม้ว่า `tools.allow` จะมี `"*"` หรือชื่อเครื่องมือที่ Plugin เป็นเจ้าของ
แบบเจาะจงก็ตาม หาก allowlist ของเครื่องมืออ้างอิงเครื่องมือของ Plugin ให้เพิ่ม id Plugin เจ้าของ
ลงใน `plugins.allow` หรือลบ `plugins.allow`; `openclaw doctor` จะเตือนเกี่ยวกับ
รูปแบบนี้

การเปลี่ยนแปลงการกำหนดค่า **ต้องรีสตาร์ท Gateway** หาก Gateway กำลังรันโดยเปิดใช้การ watch การกำหนดค่า
+ รีสตาร์ทในโปรเซส (พาธ `openclaw gateway` ค่าเริ่มต้น) โดยปกติ
การรีสตาร์ทนั้นจะดำเนินการอัตโนมัติชั่วครู่หลังจากการเขียนการกำหนดค่ามาถึง
ไม่มีพาธ hot-reload ที่รองรับสำหรับโค้ด runtime ของ Plugin แบบ native หรือ lifecycle
hook; รีสตาร์ทโปรเซส Gateway ที่กำลังให้บริการช่องทางสดก่อน
คาดหวังว่าโค้ด `register(api)`, hook `api.on(...)`, เครื่องมือ, บริการ หรือ
hook provider/runtime ที่อัปเดตแล้วจะรัน

`openclaw plugins list` เป็น snapshot ของ registry/การกำหนดค่า Plugin ในเครื่อง
Plugin ที่ `enabled` ตรงนั้นหมายความว่า registry ที่ persist ไว้และการกำหนดค่าปัจจุบันอนุญาตให้
Plugin เข้าร่วมได้ ไม่ได้พิสูจน์ว่า child ของ Gateway ระยะไกลที่รันอยู่แล้ว
รีสตาร์ทเข้าสู่โค้ด Plugin เดียวกันแล้ว บนการตั้งค่า VPS/container ที่มี
โปรเซส wrapper ให้ส่งการรีสตาร์ทไปยังโปรเซส `openclaw gateway run` จริง
หรือใช้ `openclaw gateway restart` กับ Gateway ที่กำลังรันอยู่

<Accordion title="สถานะ Plugin: ปิดใช้งาน เทียบกับ ขาดหาย เทียบกับ ไม่ถูกต้อง">
  - **ปิดใช้งาน**: Plugin มีอยู่ แต่กฎการเปิดใช้งานปิดมันไว้ การกำหนดค่าจะถูกเก็บรักษาไว้
  - **ขาดหาย**: การกำหนดค่าอ้างอิง ID ของ Plugin ที่การค้นหาไม่พบ
  - **ไม่ถูกต้อง**: Plugin มีอยู่ แต่การกำหนดค่าไม่ตรงกับสคีมาที่ประกาศไว้ การเริ่มต้น Gateway จะข้ามเฉพาะ Plugin นั้น; `openclaw doctor --fix` สามารถกักกันรายการที่ไม่ถูกต้องได้โดยปิดใช้งานและลบเพย์โหลดการกำหนดค่าของรายการนั้น

</Accordion>

## การค้นหาและลำดับความสำคัญ

OpenClaw สแกนหา Plugin ตามลำดับนี้ (รายการที่ตรงกันรายการแรกจะชนะ):

<Steps>
  <Step title="พาธการกำหนดค่า">
    `plugins.load.paths` — พาธไฟล์หรือไดเรกทอรีที่ระบุชัดเจน พาธที่ชี้
    กลับไปยังไดเรกทอรี Plugin แบบ bundled ที่ OpenClaw บรรจุมาด้วยเองจะถูกละเว้น;
    รัน `openclaw doctor --fix` เพื่อลบ alias เก่าเหล่านั้น
  </Step>

  <Step title="Plugin ใน workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` และ `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin ส่วนกลาง">
    `~/.openclaw/<plugin-root>/*.ts` และ `~/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin แบบ bundled">
    จัดส่งมาพร้อมกับ OpenClaw หลายรายการถูกเปิดใช้งานโดยค่าเริ่มต้น (ผู้ให้บริการโมเดล, คำพูด)
    รายการอื่นต้องเปิดใช้งานอย่างชัดเจน
  </Step>
</Steps>

การติดตั้งแบบแพ็กเกจและอิมเมจ Docker โดยปกติจะแก้ตำแหน่ง Plugin แบบ bundled จาก
ทรี `dist/extensions` ที่คอมไพล์แล้ว หากไดเรกทอรีซอร์สของ Plugin แบบ bundled ถูก
bind-mounted ทับพาธซอร์สแบบแพ็กเกจที่ตรงกัน เช่น
`/app/extensions/synology-chat` OpenClaw จะถือว่าไดเรกทอรีซอร์สที่เมาท์นั้น
เป็นซอร์ส overlay แบบ bundled และค้นพบก่อน bundle แบบแพ็กเกจ
`/app/dist/extensions/synology-chat` วิธีนี้ช่วยให้ลูปคอนเทนเนอร์ของ maintainer
ทำงานได้โดยไม่ต้องสลับ Plugin แบบ bundled ทุกตัวกลับไปใช้ซอร์ส TypeScript
ตั้งค่า `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` เพื่อบังคับใช้ bundle dist แบบแพ็กเกจ
แม้มีการเมาท์ซอร์ส overlay อยู่

### กฎการเปิดใช้งาน

- `plugins.enabled: false` ปิดใช้งาน Plugin ทั้งหมดและข้ามงานค้นหา/โหลด Plugin
- `plugins.deny` ชนะ allow เสมอ
- `plugins.entries.\<id\>.enabled: false` ปิดใช้งาน Plugin นั้น
- Plugin ที่มีต้นทางจาก workspace จะถูก **ปิดใช้งานโดยค่าเริ่มต้น** (ต้องเปิดใช้งานอย่างชัดเจน)
- Plugin แบบ bundled ใช้ชุด default-on ในตัว เว้นแต่จะถูกแทนที่
- slot แบบ exclusive สามารถบังคับเปิดใช้งาน Plugin ที่เลือกสำหรับ slot นั้น
- Plugin แบบ bundled บางรายการที่ต้อง opt-in จะถูกเปิดใช้งานโดยอัตโนมัติเมื่อการกำหนดค่าระบุ
  surface ที่ Plugin เป็นเจ้าของ เช่น ref ของโมเดลผู้ให้บริการ, การกำหนดค่า channel, หรือ harness
  runtime
- การกำหนดค่า Plugin เก่าจะถูกเก็บรักษาไว้ขณะที่ `plugins.enabled: false` ทำงานอยู่;
  เปิดใช้งาน Plugin อีกครั้งก่อนรันการล้างข้อมูล doctor หากคุณต้องการลบ ID เก่าออก
- เส้นทาง Codex ในตระกูล OpenAI เก็บขอบเขต Plugin แยกกัน:
  `openai-codex/*` เป็นของ Plugin OpenAI ส่วน Plugin app-server Codex แบบ bundled
  จะถูกเลือกด้วย `agentRuntime.id: "codex"` หรือ ref โมเดลเดิม
  `codex/*`

## การแก้ปัญหา runtime hooks

หาก Plugin ปรากฏใน `plugins list` แต่ side effects หรือ hooks ของ `register(api)`
ไม่ทำงานในทราฟฟิกแชตจริง ให้ตรวจสอบสิ่งเหล่านี้ก่อน:

- รัน `openclaw gateway status --deep --require-rpc` และยืนยันว่า URL ของ Gateway ที่ใช้งานอยู่,
  โปรไฟล์, พาธการกำหนดค่า, และ process เป็นรายการที่คุณกำลังแก้ไข
- รีสตาร์ท Gateway จริงหลังการเปลี่ยนแปลงการติดตั้ง/การกำหนดค่า/โค้ดของ Plugin ในคอนเทนเนอร์ wrapper
  PID 1 อาจเป็นเพียง supervisor; ให้รีสตาร์ทหรือส่งสัญญาณไปยัง process ลูก
  `openclaw gateway run`
- ใช้ `openclaw plugins inspect <id> --runtime --json` เพื่อยืนยันการลงทะเบียน hook และ
  การวินิจฉัย hook ของบทสนทนาที่ไม่ใช่ bundled เช่น `llm_input`,
  `llm_output`, `before_agent_finalize`, และ `agent_end` ต้องใช้
  `plugins.entries.<id>.hooks.allowConversationAccess=true`
- สำหรับการสลับโมเดล ให้ใช้ `before_model_resolve` เป็นหลัก มันทำงานก่อนการแก้โมเดล
  สำหรับรอบ agent; `llm_output` จะทำงานหลังจากความพยายามใช้โมเดล
  สร้างเอาต์พุตของ assistant แล้วเท่านั้น
- สำหรับหลักฐานของโมเดล session ที่มีผลจริง ให้ใช้ `openclaw sessions` หรือ
  surface session/status ของ Gateway และเมื่อดีบักเพย์โหลดผู้ให้บริการ ให้เริ่ม
  Gateway ด้วย `--raw-stream --raw-stream-path <path>`

### การเป็นเจ้าของ channel หรือ tool ซ้ำ

อาการ:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

ข้อความเหล่านี้หมายความว่ามี Plugin ที่เปิดใช้งานมากกว่าหนึ่งตัวพยายามเป็นเจ้าของ channel,
setup flow, หรือชื่อ tool เดียวกัน สาเหตุที่พบบ่อยที่สุดคือ Plugin channel ภายนอก
ถูกติดตั้งคู่กับ Plugin แบบ bundled ที่ตอนนี้ให้ channel ID เดียวกันแล้ว

ขั้นตอนดีบัก:

- รัน `openclaw plugins list --enabled --verbose` เพื่อดู Plugin ที่เปิดใช้งานทุกตัว
  และต้นทาง
- รัน `openclaw plugins inspect <id> --runtime --json` สำหรับ Plugin ที่สงสัยแต่ละตัวและ
  เปรียบเทียบ `channels`, `channelConfigs`, `tools`, และการวินิจฉัย
- รัน `openclaw plugins registry --refresh` หลังติดตั้งหรือลบ
  แพ็กเกจ Plugin เพื่อให้ metadata ที่ persisted สะท้อนการติดตั้งปัจจุบัน
- รีสตาร์ท Gateway หลังการเปลี่ยนแปลงการติดตั้ง, registry, หรือการกำหนดค่า

ตัวเลือกการแก้ไข:

- หาก Plugin หนึ่งตั้งใจแทนที่อีกตัวสำหรับ channel ID เดียวกัน
  Plugin ที่ต้องการควรประกาศ `channelConfigs.<channel-id>.preferOver` พร้อม
  ID ของ Plugin ที่มีลำดับความสำคัญต่ำกว่า ดู [/plugins/manifest#replacing-another-channel-plugin](/th/plugins/manifest#replacing-another-channel-plugin)
- หากรายการซ้ำเกิดขึ้นโดยไม่ตั้งใจ ให้ปิดใช้งานฝั่งหนึ่งด้วย
  `plugins.entries.<plugin-id>.enabled: false` หรือลบการติดตั้ง Plugin เก่า
- หากคุณเปิดใช้งาน Plugin ทั้งสองอย่างชัดเจน OpenClaw จะคงคำขอนั้นไว้และ
  รายงานข้อขัดแย้ง เลือกเจ้าของหนึ่งรายสำหรับ channel หรือเปลี่ยนชื่อ tool ที่ Plugin เป็นเจ้าของ
  เพื่อให้ surface ของ runtime ไม่กำกวม

## Slot ของ Plugin (หมวดหมู่ exclusive)

บางหมวดหมู่เป็นแบบ exclusive (มีได้เพียงหนึ่งรายการที่ active ในแต่ละครั้ง):

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

| Slot            | สิ่งที่ควบคุม         | ค่าเริ่มต้น          |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active memory plugin  | `memory-core`       |
| `contextEngine` | Active context engine | `legacy` (built-in) |

## อ้างอิง CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
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

Plugin แบบ bundled จัดส่งมาพร้อมกับ OpenClaw หลายรายการถูกเปิดใช้งานโดยค่าเริ่มต้น (เช่น
ผู้ให้บริการโมเดลแบบ bundled, ผู้ให้บริการคำพูดแบบ bundled, และ Plugin เบราว์เซอร์แบบ bundled)
Plugin แบบ bundled อื่นยังต้องใช้ `openclaw plugins enable <id>`

`--force` เขียนทับ Plugin ที่ติดตั้งอยู่แล้วหรือ hook pack ในตำแหน่งเดิม ใช้
`openclaw plugins update <id-or-npm-spec>` สำหรับการอัปเกรด Plugin npm ที่ติดตามอยู่
ตามปกติ ไม่รองรับร่วมกับ `--link` ซึ่งนำพาธซอร์สมาใช้ซ้ำแทน
การคัดลอกทับเป้าหมายการติดตั้งที่จัดการอยู่

เมื่อ `plugins.allow` ถูกตั้งค่าไว้แล้ว `openclaw plugins install` จะเพิ่ม
ID ของ Plugin ที่ติดตั้งเข้าไปใน allowlist นั้นก่อนเปิดใช้งาน หาก ID ของ Plugin เดียวกัน
อยู่ใน `plugins.deny` การติดตั้งจะลบรายการ deny เก่านั้นเพื่อให้
การติดตั้งที่ระบุชัดเจนโหลดได้ทันทีหลังรีสตาร์ท

OpenClaw เก็บ registry ของ Plugin ภายในเครื่องแบบ persisted เป็นโมเดลอ่านแบบ cold
สำหรับ inventory ของ Plugin, การเป็นเจ้าของ contribution, และการวางแผนเริ่มต้น Flow การติดตั้ง, อัปเดต,
ถอนการติดตั้ง, เปิดใช้งาน, และปิดใช้งานจะ refresh registry นั้นหลังเปลี่ยนสถานะ Plugin
ไฟล์ `plugins/installs.json` เดียวกันเก็บ metadata การติดตั้งที่คงทนไว้ใน
`installRecords` ระดับบนสุด และ metadata manifest ที่สร้างใหม่ได้ไว้ใน `plugins` หาก
registry ขาดหาย, เก่า, หรือไม่ถูกต้อง `openclaw plugins registry
--refresh` จะสร้างมุมมอง manifest ใหม่จาก install records, นโยบายการกำหนดค่า, และ
metadata manifest/package โดยไม่โหลดโมดูล runtime ของ Plugin
`openclaw plugins update <id-or-npm-spec>` ใช้กับการติดตั้งที่ติดตามอยู่ การส่ง
spec แพ็กเกจ npm พร้อม dist-tag หรือเวอร์ชันแน่นอนจะแก้ชื่อแพ็กเกจ
กลับไปยัง record ของ Plugin ที่ติดตามอยู่และบันทึก spec ใหม่สำหรับการอัปเดตในอนาคต
การส่งชื่อแพ็กเกจโดยไม่มีเวอร์ชันจะย้ายการติดตั้งที่ pin แบบแน่นอนกลับไปยัง
สาย release เริ่มต้นของ registry หาก Plugin npm ที่ติดตั้งอยู่ตรงกับ
เวอร์ชันที่แก้ได้และ identity ของ artifact ที่บันทึกไว้แล้ว OpenClaw จะข้ามการอัปเดต
โดยไม่ดาวน์โหลด, ติดตั้งใหม่, หรือเขียนการกำหนดค่าใหม่

`--pin` ใช้ได้กับ npm เท่านั้น ไม่รองรับร่วมกับ `--marketplace` เพราะ
การติดตั้งจาก marketplace จะ persist metadata แหล่งที่มาของ marketplace แทน spec ของ npm

`--dangerously-force-unsafe-install` เป็น override แบบ break-glass สำหรับ false
positive จากตัวสแกน dangerous-code ในตัว มันอนุญาตให้การติดตั้ง Plugin
และการอัปเดต Plugin ดำเนินต่อผ่าน findings ระดับ `critical` ในตัวได้ แต่ยังคง
ไม่ข้าม policy block ของ `before_install` ของ Plugin หรือการบล็อกจาก scan failure
สแกนการติดตั้งจะละเว้นไฟล์และไดเรกทอรีทดสอบทั่วไป เช่น `tests/`,
`__tests__/`, `*.test.*`, และ `*.spec.*` เพื่อหลีกเลี่ยงการบล็อก mock ทดสอบในแพ็กเกจ;
entrypoint runtime ของ Plugin ที่ประกาศไว้จะยังถูกสแกนแม้ใช้ชื่อใดชื่อหนึ่ง
เหล่านั้น

แฟล็ก CLI นี้ใช้กับ flow การติดตั้ง/อัปเดต Plugin เท่านั้น การติดตั้ง dependency ของ skill
ที่ทำผ่าน Gateway จะใช้ override คำขอ `dangerouslyForceUnsafeInstall` ที่ตรงกัน
แทน ขณะที่ `openclaw skills install` ยังคงเป็น flow ดาวน์โหลด/ติดตั้ง Skills จาก ClawHub
ที่แยกต่างหาก

หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกซ่อนหรือถูกบล็อกจากการสแกน ให้เปิด
แดชบอร์ด ClawHub หรือรัน `clawhub package rescan <name>` เพื่อขอให้ ClawHub ตรวจสอบ
อีกครั้ง `--dangerously-force-unsafe-install` มีผลเฉพาะการติดตั้งบนเครื่องของคุณเอง
เท่านั้น; มันไม่ได้ขอให้ ClawHub สแกน Plugin ใหม่หรือทำให้ release ที่ถูกบล็อก
เป็นสาธารณะ

บันเดิลที่เข้ากันได้จะเข้าร่วมในโฟลว์รายการ/ตรวจสอบ/เปิดใช้/ปิดใช้ Plugin
เดียวกัน การรองรับรันไทม์ปัจจุบันมีทั้ง Skills ของบันเดิล, command-skills ของ Claude,
ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` ของ Claude และ
`lspServers` ที่ประกาศในแมนิเฟสต์, command-skills ของ Cursor และไดเรกทอรี hook
ของ Codex ที่เข้ากันได้

`openclaw plugins inspect <id>` ยังรายงานความสามารถของบันเดิลที่ตรวจพบ รวมถึง
รายการเซิร์ฟเวอร์ MCP และ LSP ที่รองรับหรือไม่รองรับสำหรับ Plugin ที่มีบันเดิลเป็นฐาน

แหล่ง Marketplace อาจเป็นชื่อ known-marketplace ของ Claude จาก
`~/.claude/plugins/known_marketplaces.json`, ราก Marketplace ภายในเครื่องหรือพาธ
`marketplace.json`, รูปย่อ GitHub เช่น `owner/repo`, URL ของ repo GitHub,
หรือ URL ของ git สำหรับ Marketplace ระยะไกล รายการ Plugin ต้องคงอยู่ภายใน repo
Marketplace ที่ clone มา และใช้เฉพาะแหล่งพาธแบบสัมพัทธ์เท่านั้น

ดูรายละเอียดทั้งหมดได้ที่ [อ้างอิง CLI `openclaw plugins`](/th/cli/plugins)

## ภาพรวม API ของ Plugin

Plugin แบบเนทีฟส่งออกอ็อบเจกต์ entry ที่เปิดเผย `register(api)` Plugin รุ่นเก่า
อาจยังใช้ `activate(api)` เป็น alias แบบเดิมได้ แต่ Plugin ใหม่ควรใช้
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

OpenClaw โหลดอ็อบเจกต์ entry และเรียก `register(api)` ระหว่างการเปิดใช้งาน
Plugin ตัวโหลดจะยัง fallback ไปที่ `activate(api)` สำหรับ Plugin รุ่นเก่า
แต่ Plugin ที่รวมมาในชุดและ Plugin ภายนอกใหม่ควรมองว่า `register` เป็นสัญญา
สาธารณะ

`api.registrationMode` บอก Plugin ว่า entry ของตนถูกโหลดด้วยเหตุผลใด:

| โหมด            | ความหมาย                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | การเปิดใช้งานรันไทม์ ลงทะเบียนเครื่องมือ, hook, service, คำสั่ง, route และ side effect สดอื่นๆ                              |
| `discovery`     | การค้นหาความสามารถแบบอ่านอย่างเดียว ลงทะเบียน provider และ metadata; โค้ด entry ของ Plugin ที่เชื่อถือได้อาจถูกโหลด แต่ให้ข้าม side effect สด |
| `setup-only`    | การโหลด metadata สำหรับการตั้งค่าแชนเนลผ่าน entry ตั้งค่าแบบเบา                                                                |
| `setup-runtime` | การโหลดการตั้งค่าแชนเนลที่ต้องใช้ entry รันไทม์ด้วย                                                                         |
| `cli-metadata`  | การรวบรวม metadata ของคำสั่ง CLI เท่านั้น                                                                                            |

entry ของ Plugin ที่เปิด socket, database, background worker หรือ client
ที่อยู่ยาว ควรป้องกัน side effect เหล่านั้นด้วย `api.registrationMode === "full"`
โหลดสำหรับ discovery จะถูก cache แยกจากโหลดสำหรับ activation และจะไม่แทนที่
registry ของ Gateway ที่กำลังทำงาน Discovery เป็นแบบไม่เปิดใช้งาน แต่ไม่ใช่แบบ
ไม่ import: OpenClaw อาจประเมิน entry ของ Plugin ที่เชื่อถือได้หรือโมดูล
channel Plugin เพื่อสร้าง snapshot ทำให้ top level ของโมดูลเบาและปราศจาก
side effect และย้าย network client, subprocess, listener, การอ่าน credential
และการเริ่ม service ไปไว้หลังพาธ full-runtime

เมธอดลงทะเบียนที่พบบ่อย:

| เมธอด                                  | สิ่งที่ลงทะเบียน           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | provider ของโมเดล (LLM)        |
| `registerChannel`                       | แชนเนลแชต                |
| `registerTool`                          | เครื่องมือของ agent                  |
| `registerHook` / `on(...)`              | lifecycle hook             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | STT แบบ streaming               |
| `registerRealtimeVoiceProvider`         | เสียงเรียลไทม์แบบ duplex       |
| `registerMediaUnderstandingProvider`    | การวิเคราะห์รูปภาพ/เสียง        |
| `registerImageGenerationProvider`       | การสร้างรูปภาพ            |
| `registerMusicGenerationProvider`       | การสร้างเพลง            |
| `registerVideoGenerationProvider`       | การสร้างวิดีโอ            |
| `registerWebFetchProvider`              | provider สำหรับดึงเว็บ / scrape |
| `registerWebSearchProvider`             | การค้นหาเว็บ                  |
| `registerHttpRoute`                     | endpoint HTTP               |
| `registerCommand` / `registerCli`       | คำสั่ง CLI                |
| `registerContextEngine`                 | context engine              |
| `registerService`                       | service เบื้องหลัง          |

พฤติกรรม guard ของ hook สำหรับ typed lifecycle hook:

- `before_tool_call`: `{ block: true }` เป็นสถานะสิ้นสุด; handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `before_tool_call`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `before_install`: `{ block: true }` เป็นสถานะสิ้นสุด; handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `before_install`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็นสถานะสิ้นสุด; handler ที่มี priority ต่ำกว่าจะถูกข้าม
- `message_sending`: `{ cancel: false }` เป็น no-op และไม่ล้าง cancel ก่อนหน้า

app-server ของ Native Codex เชื่อม bridge เหตุการณ์เครื่องมือแบบ Codex-native
กลับมายังพื้นผิว hook นี้ Plugin สามารถบล็อกเครื่องมือ native Codex ผ่าน
`before_tool_call`, สังเกตผลลัพธ์ผ่าน `after_tool_call` และเข้าร่วมการอนุมัติ
`PermissionRequest` ของ Codex ได้ bridge ยังไม่เขียน argument ของเครื่องมือ
Codex-native ใหม่ ขอบเขตการรองรับรันไทม์ Codex ที่แน่นอนอยู่ใน
[สัญญาการรองรับ Codex harness v1](/th/plugins/codex-harness#v1-support-contract)

สำหรับพฤติกรรม typed hook แบบเต็ม ดู [ภาพรวม SDK](/th/plugins/sdk-overview#hook-decision-semantics)

## ที่เกี่ยวข้อง

- [การสร้าง Plugin](/th/plugins/building-plugins) — สร้าง Plugin ของคุณเอง
- [บันเดิล Plugin](/th/plugins/bundles) — ความเข้ากันได้ของบันเดิล Codex/Claude/Cursor
- [แมนิเฟสต์ Plugin](/th/plugins/manifest) — schema ของแมนิเฟสต์
- [การลงทะเบียนเครื่องมือ](/th/plugins/building-plugins#registering-agent-tools) — เพิ่มเครื่องมือของ agent ใน Plugin
- [ภายในของ Plugin](/th/plugins/architecture) — โมเดลความสามารถและ pipeline การโหลด
- [Plugin ชุมชน](/th/plugins/community) — รายการจากบุคคลที่สาม
