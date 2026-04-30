---
read_when:
    - การติดตั้งหรือกำหนดค่า Plugin
    - ทำความเข้าใจการค้นพบ Plugin และกฎการโหลด
    - การทำงานกับบันเดิล Plugin ที่เข้ากันได้กับ Codex/Claude
sidebarTitle: Install and Configure
summary: ติดตั้ง กำหนดค่า และจัดการ Plugin ของ OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-30T10:21:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a12d158053c13b47a56d8d6b382818962e9b5109fdf8ededd3ecf92b83089e6
    source_path: tools/plugin.md
    workflow: 16
---

Plugin ขยาย OpenClaw ด้วยความสามารถใหม่ๆ: ช่องทาง, ผู้ให้บริการโมเดล,
agent harnesses, เครื่องมือ, Skills, คำพูด, การถอดเสียงแบบเรียลไทม์, เสียงแบบเรียลไทม์,
การเข้าใจสื่อ, การสร้างภาพ, การสร้างวิดีโอ, การดึงข้อมูลเว็บ, การค้นหาเว็บ,
และอื่นๆ Plugin บางตัวเป็น **แกนหลัก** (มาพร้อมกับ OpenClaw) ส่วนบางตัว
เป็น **ภายนอก** Plugin ภายนอกส่วนใหญ่เผยแพร่และค้นพบผ่าน
[ClawHub](/th/tools/clawhub) Npm ยังคงรองรับสำหรับการติดตั้งโดยตรงและสำหรับ
ชุดแพ็กเกจ Plugin ที่ OpenClaw เป็นเจ้าของแบบชั่วคราวระหว่างที่การย้ายนี้เสร็จสิ้น

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
</Steps>

หากคุณต้องการการควบคุมแบบเนทีฟกับแชต ให้เปิดใช้ `commands.plugins: true` แล้วใช้:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

พาธการติดตั้งใช้ตัวแก้ตำแหน่งเดียวกับ CLI: พาธ/ไฟล์เก็บถาวรในเครื่อง,
`clawhub:<pkg>` แบบระบุชัดเจน, `npm:<pkg>` แบบระบุชัดเจน, หรือสเป็กแพ็กเกจเปล่า
(ClawHub ก่อน แล้วจึง fallback ไป npm)

หากการกำหนดค่าไม่ถูกต้อง การติดตั้งโดยปกติจะล้มเหลวแบบปิดและชี้คุณไปที่
`openclaw doctor --fix` ข้อยกเว้นสำหรับการกู้คืนเพียงอย่างเดียวคือพาธติดตั้งซ้ำ
แบบแคบสำหรับ Plugin ที่บันเดิลมาซึ่งเลือกใช้
`openclaw.install.allowInvalidConfigRecovery`
ระหว่างการเริ่มต้น Gateway การกำหนดค่าที่ไม่ถูกต้องของ Plugin หนึ่งตัวจะถูกแยกไว้เฉพาะ Plugin นั้น:
การเริ่มต้นจะบันทึกปัญหา `plugins.entries.<id>.config` ข้าม Plugin นั้นระหว่าง
โหลด และคงให้ Plugin และช่องทางอื่นออนไลน์ต่อไป รัน `openclaw doctor --fix`
เพื่อกักกันการกำหนดค่า Plugin ที่เสียโดยปิดใช้รายการ Plugin นั้นและลบ
เพย์โหลดการกำหนดค่าที่ไม่ถูกต้องของมันออก การสำรองข้อมูลการกำหนดค่าปกติจะคงค่าก่อนหน้าไว้
เมื่อการกำหนดค่าช่องทางอ้างถึง Plugin ที่ค้นพบไม่ได้อีกต่อไป แต่ id Plugin
เก่าตัวเดิมยังคงอยู่ในการกำหนดค่า Plugin หรือบันทึกการติดตั้ง การเริ่มต้น Gateway
จะบันทึกคำเตือนและข้ามช่องทางนั้นแทนที่จะบล็อกช่องทางอื่นทั้งหมด
รัน `openclaw doctor --fix` เพื่อลบรายการช่องทาง/Plugin เก่าออก คีย์ช่องทาง
ที่ไม่รู้จักซึ่งไม่มีหลักฐาน Plugin เก่ายังคงทำให้การตรวจสอบล้มเหลว เพื่อให้การพิมพ์ผิด
ยังมองเห็นได้
หากตั้งค่า `plugins.enabled: false` การอ้างอิง Plugin เก่าจะถือว่าไม่มีผล:
การเริ่มต้น Gateway จะข้ามงานค้นพบ/โหลด Plugin และ `openclaw doctor` จะคง
การกำหนดค่า Plugin ที่ปิดใช้อยู่ไว้แทนที่จะลบออกอัตโนมัติ เปิดใช้ Plugin อีกครั้งก่อน
รันการล้างข้อมูลด้วย doctor หากคุณต้องการให้ลบ id Plugin เก่าออก

การติดตั้ง OpenClaw แบบแพ็กเกจจะไม่ติดตั้ง dependency tree ของรันไทม์
สำหรับ Plugin ที่บันเดิลมาทุกตัวล่วงหน้า เมื่อ Plugin ที่ OpenClaw เป็นเจ้าของ
และบันเดิลมาเปิดใช้งานจากการกำหนดค่า Plugin, การกำหนดค่าช่องทางแบบเดิม,
หรือ manifest ที่เปิดใช้ตามค่าเริ่มต้น การเริ่มต้นจะซ่อมเฉพาะ runtime dependencies
ที่ Plugin นั้นประกาศไว้ก่อนนำเข้า Plugin นั้น
สถานะ auth ของช่องทางที่เก็บคงอยู่เพียงอย่างเดียวจะไม่เปิดใช้ช่องทางที่บันเดิลมา
สำหรับการซ่อม runtime-dependency ตอนเริ่มต้น Gateway
การปิดใช้อย่างชัดเจนยังคงมีผลเหนือกว่า: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false`, และ `channels.<id>.enabled: false`
จะป้องกันการซ่อม runtime-dependency ที่บันเดิลมาโดยอัตโนมัติสำหรับ Plugin/ช่องทางนั้น
`plugins.allow` ที่ไม่ว่างยังจำกัดการซ่อม runtime-dependency ที่บันเดิลมา
และเปิดใช้ตามค่าเริ่มต้นด้วย; การเปิดใช้ช่องทางที่บันเดิลมาอย่างชัดเจน
(`channels.<id>.enabled: true`) ยังคงซ่อม dependencies ของ Plugin ของช่องทางนั้นได้
Plugin ภายนอกและพาธโหลดแบบกำหนดเองยังต้องติดตั้งผ่าน
`openclaw plugins install`

## ประเภท Plugin

OpenClaw รองรับรูปแบบ Plugin สองแบบ:

| รูปแบบ     | วิธีทำงาน                                                       | ตัวอย่าง                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **เนทีฟ** | `openclaw.plugin.json` + โมดูลรันไทม์; ทำงานในกระบวนการ       | Plugin ทางการ, แพ็กเกจ npm จากชุมชน               |
| **Bundle** | เลย์เอาต์ที่เข้ากันได้กับ Codex/Claude/Cursor; แมปเป็นฟีเจอร์ของ OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

ทั้งสองแบบจะแสดงภายใต้ `openclaw plugins list` ดูรายละเอียด Bundle ได้ที่ [Plugin Bundles](/th/plugins/bundles)

หากคุณกำลังเขียน Plugin แบบเนทีฟ ให้เริ่มจาก [การสร้าง Plugin](/th/plugins/building-plugins)
และ [ภาพรวม Plugin SDK](/th/plugins/sdk-overview)

## จุดเข้าใช้งานของแพ็กเกจ

แพ็กเกจ npm ของ Plugin แบบเนทีฟต้องประกาศ `openclaw.extensions` ใน `package.json`
แต่ละรายการต้องอยู่ภายในไดเรกทอรีของแพ็กเกจและแก้ตำแหน่งไปยังไฟล์รันไทม์
ที่อ่านได้ หรือไปยังไฟล์ซอร์ส TypeScript ที่มีไฟล์ JavaScript ที่ build แล้วเป็น peer
ซึ่งอนุมานได้ เช่น `src/index.ts` ไปยัง `dist/index.js`

ใช้ `openclaw.runtimeExtensions` เมื่อไฟล์รันไทม์ที่เผยแพร่ไม่ได้อยู่ที่พาธเดียวกัน
กับรายการซอร์ส เมื่อมี `runtimeExtensions` ต้องมีรายการหนึ่งรายการพอดีสำหรับทุก
รายการ `extensions` รายการที่ไม่ตรงกันจะทำให้การติดตั้งและการค้นพบ Plugin ล้มเหลว
แทนที่จะ fallback ไปยังพาธซอร์สแบบเงียบๆ

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

ClawHub เป็นพาธการเผยแพร่หลักสำหรับ Plugin ส่วนใหญ่ OpenClaw รุ่นแพ็กเกจปัจจุบัน
บันเดิล Plugin ทางการไว้จำนวนมากแล้ว ดังนั้น Plugin เหล่านั้นจึงไม่ต้องติดตั้ง npm
แยกต่างหากในการตั้งค่าปกติ จนกว่า Plugin ทุกตัวที่ OpenClaw เป็นเจ้าของจะย้ายไป
ClawHub เสร็จ OpenClaw ยังคงจัดส่งแพ็กเกจ Plugin `@openclaw/*` บางรายการบน
npm สำหรับการติดตั้งแบบเก่า/กำหนดเองและ workflow npm โดยตรง

หาก npm รายงานว่าแพ็กเกจ Plugin `@openclaw/*` เลิกใช้แล้ว แพ็กเกจเวอร์ชันนั้น
มาจากสายแพ็กเกจภายนอกที่เก่ากว่า ใช้ Plugin ที่บันเดิลมากับ OpenClaw ปัจจุบัน
หรือ checkout ในเครื่องจนกว่าจะมีการเผยแพร่แพ็กเกจ npm ที่ใหม่กว่า

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
  <Accordion title="ผู้ให้บริการโมเดล (เปิดใช้ตามค่าเริ่มต้น)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin หน่วยความจำ">
    - `memory-core` — การค้นหาหน่วยความจำที่บันเดิลมา (ค่าเริ่มต้นผ่าน `plugins.slots.memory`)
    - `memory-lancedb` — หน่วยความจำระยะยาวแบบติดตั้งเมื่อต้องใช้ พร้อมการเรียกคืน/จับข้อมูลอัตโนมัติ (ตั้งค่า `plugins.slots.memory = "memory-lancedb"`)

    ดู [Memory LanceDB](/th/plugins/memory-lancedb) สำหรับการตั้งค่า embedding
    ที่เข้ากันได้กับ OpenAI, ตัวอย่าง Ollama, ขีดจำกัดการเรียกคืน และการแก้ปัญหา

  </Accordion>

  <Accordion title="ผู้ให้บริการคำพูด (เปิดใช้ตามค่าเริ่มต้น)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="อื่นๆ">
    - `browser` — Plugin เบราว์เซอร์ที่บันเดิลมาสำหรับเครื่องมือเบราว์เซอร์, CLI `openclaw browser`, เมธอด gateway `browser.request`, รันไทม์เบราว์เซอร์ และบริการควบคุมเบราว์เซอร์ค่าเริ่มต้น (เปิดใช้ตามค่าเริ่มต้น; ปิดใช้ก่อนแทนที่)
    - `copilot-proxy` — บริดจ์ VS Code Copilot Proxy (ปิดใช้ตามค่าเริ่มต้น)

  </Accordion>
</AccordionGroup>

กำลังมองหา Plugin จากบุคคลที่สามอยู่หรือไม่ ดู [Plugin ชุมชน](/th/plugins/community)

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
| `deny`           | denylist ของ Plugin (ไม่บังคับ; deny มีผลเหนือกว่า)                     |
| `load.paths`     | ไฟล์/ไดเรกทอรี Plugin เพิ่มเติม                            |
| `slots`          | ตัวเลือกสล็อตแบบผูกขาด (เช่น `memory`, `contextEngine`) |
| `entries.\<id\>` | สวิตช์ต่อ Plugin + การกำหนดค่า                               |

การเปลี่ยนแปลงการกำหนดค่า **ต้องรีสตาร์ท Gateway** หาก Gateway กำลังทำงานด้วย
การดูการกำหนดค่า + การรีสตาร์ทในกระบวนการที่เปิดใช้อยู่ (พาธ `openclaw gateway`
ค่าเริ่มต้น) การรีสตาร์ทนั้นมักจะดำเนินการโดยอัตโนมัติชั่วครู่หลังการเขียนการกำหนดค่าเสร็จสิ้น
ไม่มีพาธ hot-reload ที่รองรับสำหรับโค้ดรันไทม์หรือ lifecycle hooks ของ Plugin
แบบเนทีฟ; รีสตาร์ทกระบวนการ Gateway ที่ให้บริการช่องทางจริงก่อนคาดหวังว่า
โค้ด `register(api)` ที่อัปเดต, hooks `api.on(...)`, เครื่องมือ, บริการ หรือ
provider/runtime hooks จะทำงาน

`openclaw plugins list` เป็นสแนปช็อต registry/การกำหนดค่า Plugin ในเครื่อง
Plugin ที่ `enabled` อยู่ในนั้นหมายความว่า registry ที่เก็บคงอยู่และการกำหนดค่าปัจจุบัน
อนุญาตให้ Plugin เข้าร่วมได้ ไม่ได้พิสูจน์ว่า child ของ Gateway ระยะไกลที่กำลังรันอยู่
ได้รีสตาร์ทเข้าสู่โค้ด Plugin เดียวกันแล้ว ในการตั้งค่า VPS/container ที่มี
กระบวนการ wrapper ให้ส่งการรีสตาร์ทไปยังกระบวนการ `openclaw gateway run` จริง
หรือใช้ `openclaw gateway restart` กับ Gateway ที่กำลังรันอยู่

<Accordion title="สถานะ Plugin: ปิดใช้ vs หายไป vs ไม่ถูกต้อง">
  - **ปิดใช้**: Plugin มีอยู่แต่กฎการเปิดใช้ปิดมันไว้ การกำหนดค่าจะถูกเก็บรักษาไว้
  - **หายไป**: การกำหนดค่าอ้างถึง id Plugin ที่การค้นพบไม่พบ
  - **ไม่ถูกต้อง**: Plugin มีอยู่แต่การกำหนดค่าของมันไม่ตรงกับ schema ที่ประกาศไว้ การเริ่มต้น Gateway จะข้ามเฉพาะ Plugin นั้น; `openclaw doctor --fix` สามารถกักกันรายการที่ไม่ถูกต้องโดยปิดใช้รายการนั้นและลบเพย์โหลดการกำหนดค่าของมันออก

</Accordion>

## การค้นพบและลำดับความสำคัญ

OpenClaw สแกนหา Plugin ตามลำดับนี้ (รายการแรกที่ตรงกันมีผล):

<Steps>
  <Step title="พาธการกำหนดค่า">
    `plugins.load.paths` — พาธไฟล์หรือไดเรกทอรีที่ระบุชัดเจน พาธที่ชี้
    กลับไปยังไดเรกทอรี Plugin ที่บันเดิลมาในแพ็กเกจของ OpenClaw เองจะถูกละเว้น;
    รัน `openclaw doctor --fix` เพื่อลบ alias เก่าเหล่านั้น
  </Step>

  <Step title="Plugin ใน workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` และ `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Plugin ส่วนกลาง">
    `~/.openclaw/<plugin-root>/*.ts` และ `~/.openclaw/<plugin-root>/*/index.ts`
  </Step>

  <Step title="Bundled plugins">
    มาพร้อมกับ OpenClaw หลายรายการเปิดใช้งานเป็นค่าเริ่มต้น (ผู้ให้บริการโมเดล, เสียง)
    รายการอื่นต้องเปิดใช้งานอย่างชัดเจน
  </Step>
</Steps>

การติดตั้งแบบแพ็กเกจและอิมเมจ Docker โดยปกติจะ resolve Plugin ที่มาพร้อมแพ็กเกจจากแผนผัง
`dist/extensions` ที่คอมไพล์แล้ว หากไดเรกทอรีซอร์สของ Plugin ที่มาพร้อมแพ็กเกจถูก
bind-mount ทับพาธซอร์สแพ็กเกจที่ตรงกัน เช่น
`/app/extensions/synology-chat` OpenClaw จะถือว่าไดเรกทอรีซอร์สที่เมานต์นั้น
เป็นโอเวอร์เลย์ซอร์สที่มาพร้อมแพ็กเกจ และค้นพบก่อนบันเดิล
`/app/dist/extensions/synology-chat` ที่อยู่ในแพ็กเกจ วิธีนี้ช่วยให้ลูปคอนเทนเนอร์
ของผู้ดูแลทำงานต่อได้โดยไม่ต้องสลับ Plugin ที่มาพร้อมแพ็กเกจทุกตัวกลับไปใช้ซอร์ส TypeScript
ตั้งค่า `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` เพื่อบังคับใช้บันเดิล dist
ของแพ็กเกจ แม้จะมีการเมานต์โอเวอร์เลย์ซอร์สอยู่ก็ตาม

### กฎการเปิดใช้งาน

- `plugins.enabled: false` ปิดใช้งาน Plugin ทั้งหมด และข้ามงานค้นพบ/โหลด Plugin
- `plugins.deny` ชนะ allow เสมอ
- `plugins.entries.\<id\>.enabled: false` ปิดใช้งาน Plugin นั้น
- Plugin ที่มีต้นทางจาก workspace จะ **ปิดใช้งานเป็นค่าเริ่มต้น** (ต้องเปิดใช้งานอย่างชัดเจน)
- Plugin ที่มาพร้อมแพ็กเกจทำตามชุดค่าเริ่มต้นแบบเปิดในตัว เว้นแต่จะถูก override
- สล็อตแบบเอกสิทธิ์สามารถบังคับเปิดใช้งาน Plugin ที่เลือกสำหรับสล็อตนั้นได้
- Plugin ที่มาพร้อมแพ็กเกจบางรายการซึ่งต้องเลือกใช้ จะเปิดใช้งานโดยอัตโนมัติเมื่อ config ระบุ
  พื้นผิวที่ Plugin นั้นเป็นเจ้าของ เช่น ref โมเดลของผู้ให้บริการ, config ช่องทาง หรือ runtime
  ของ harness
- config Plugin ที่ค้างเก่าจะถูกเก็บรักษาไว้ขณะที่ `plugins.enabled: false` ทำงานอยู่;
  เปิดใช้งาน Plugin อีกครั้งก่อนรันการล้างข้อมูลของ doctor หากคุณต้องการลบ id ที่ค้างเก่า
- เส้นทาง Codex ตระกูล OpenAI จะรักษาขอบเขต Plugin แยกกัน:
  `openai-codex/*` เป็นของ OpenAI Plugin ส่วน Plugin app-server Codex ที่มาพร้อมแพ็กเกจ
  จะถูกเลือกโดย `agentRuntime.id: "codex"` หรือ ref โมเดล `codex/*` แบบ legacy

## การแก้ปัญหา runtime hooks

หาก Plugin ปรากฏใน `plugins list` แต่ side effect หรือ hook ของ `register(api)`
ไม่ทำงานในทราฟฟิกแชทจริง ให้ตรวจสอบสิ่งเหล่านี้ก่อน:

- รัน `openclaw gateway status --deep --require-rpc` และยืนยันว่า URL, โปรไฟล์,
  พาธ config และโปรเซสของ Gateway ที่ทำงานอยู่เป็นชุดที่คุณกำลังแก้ไข
- รีสตาร์ท Gateway จริงหลังเปลี่ยนแปลงการติดตั้ง/config/โค้ดของ Plugin ในคอนเทนเนอร์
  wrapper นั้น PID 1 อาจเป็นเพียง supervisor; ให้รีสตาร์ทหรือส่งสัญญาณไปยังโปรเซสลูก
  `openclaw gateway run`
- ใช้ `openclaw plugins inspect <id> --json` เพื่อยืนยันการลงทะเบียน hook และ diagnostics
  hook การสนทนาที่ไม่ได้มาพร้อมแพ็กเกจ เช่น `llm_input`,
  `llm_output`, `before_agent_finalize` และ `agent_end` ต้องใช้
  `plugins.entries.<id>.hooks.allowConversationAccess=true`
- สำหรับการสลับโมเดล ให้เลือกใช้ `before_model_resolve` ซึ่งทำงานก่อนการ resolve โมเดล
  สำหรับรอบของ agent; `llm_output` จะทำงานหลังจากการลองใช้โมเดล
  สร้างเอาต์พุตของ assistant แล้วเท่านั้น
- สำหรับหลักฐานของโมเดลเซสชันที่มีผลจริง ให้ใช้ `openclaw sessions` หรือพื้นผิว
  session/status ของ Gateway และเมื่อดีบัก payload ของผู้ให้บริการ ให้เริ่ม
  Gateway ด้วย `--raw-stream --raw-stream-path <path>`

### ความเป็นเจ้าของช่องทางหรือเครื่องมือซ้ำกัน

อาการ:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

ข้อความเหล่านี้หมายความว่า Plugin ที่เปิดใช้งานมากกว่าหนึ่งรายการกำลังพยายามเป็นเจ้าของ
ช่องทางเดียวกัน, flow การตั้งค่าเดียวกัน หรือชื่อเครื่องมือเดียวกัน สาเหตุที่พบบ่อยที่สุดคือ
มี Plugin ช่องทางภายนอกติดตั้งอยู่ข้าง Plugin ที่มาพร้อมแพ็กเกจซึ่งตอนนี้ให้ channel id เดียวกัน

ขั้นตอนดีบัก:

- รัน `openclaw plugins list --enabled --verbose` เพื่อดู Plugin ที่เปิดใช้งานทุกตัว
  และต้นทางของแต่ละตัว
- รัน `openclaw plugins inspect <id> --json` สำหรับ Plugin ที่สงสัยแต่ละตัว และ
  เปรียบเทียบ `channels`, `channelConfigs`, `tools` และ diagnostics
- รัน `openclaw plugins registry --refresh` หลังติดตั้งหรือลบแพ็กเกจ Plugin
  เพื่อให้ metadata ที่เก็บถาวรสะท้อนการติดตั้งปัจจุบัน
- รีสตาร์ท Gateway หลังเปลี่ยนแปลงการติดตั้ง, registry หรือ config

ตัวเลือกการแก้ไข:

- หาก Plugin หนึ่งตั้งใจแทนที่อีก Plugin สำหรับ channel id เดียวกัน Plugin ที่ต้องการควรประกาศ
  `channelConfigs.<channel-id>.preferOver` พร้อม id ของ Plugin ที่มีลำดับความสำคัญต่ำกว่า
  ดู [/plugins/manifest#replacing-another-channel-plugin](/th/plugins/manifest#replacing-another-channel-plugin)
- หากรายการซ้ำเกิดขึ้นโดยไม่ตั้งใจ ให้ปิดใช้งานฝั่งหนึ่งด้วย
  `plugins.entries.<plugin-id>.enabled: false` หรือลบการติดตั้ง Plugin ที่ค้างเก่า
- หากคุณเปิดใช้งาน Plugin ทั้งสองอย่างชัดเจน OpenClaw จะคงคำขอนั้นไว้และ
  รายงานข้อขัดแย้ง เลือกเจ้าของหนึ่งรายสำหรับช่องทาง หรือเปลี่ยนชื่อเครื่องมือที่ Plugin
  เป็นเจ้าของเพื่อให้พื้นผิว runtime ไม่กำกวม

## สล็อต Plugin (หมวดหมู่เอกสิทธิ์)

บางหมวดหมู่เป็นแบบเอกสิทธิ์ (มีได้เพียงหนึ่งรายการที่ทำงานอยู่ในแต่ละครั้ง):

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

| สล็อต           | สิ่งที่ควบคุม            | ค่าเริ่มต้น          |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active memory plugin  | `memory-core`       |
| `contextEngine` | Active context engine | `legacy` (built-in) |

## อ้างอิง CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # deep detail
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

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugin ที่มาพร้อมแพ็กเกจจัดส่งมากับ OpenClaw หลายรายการเปิดใช้งานเป็นค่าเริ่มต้น (เช่น
ผู้ให้บริการโมเดลที่มาพร้อมแพ็กเกจ, ผู้ให้บริการเสียงที่มาพร้อมแพ็กเกจ และ Plugin เบราว์เซอร์
ที่มาพร้อมแพ็กเกจ) Plugin ที่มาพร้อมแพ็กเกจอื่นยังต้องใช้ `openclaw plugins enable <id>`

`--force` เขียนทับ Plugin หรือ hook pack ที่ติดตั้งอยู่เดิมในตำแหน่งเดิม ใช้
`openclaw plugins update <id-or-npm-spec>` สำหรับการอัปเกรดตามปกติของ Plugin npm
ที่ติดตามอยู่ ไม่รองรับการใช้ร่วมกับ `--link` ซึ่งใช้พาธซอร์สซ้ำแทนการคัดลอกทับเป้าหมาย
การติดตั้งที่จัดการอยู่

เมื่อมีการตั้งค่า `plugins.allow` อยู่แล้ว `openclaw plugins install` จะเพิ่ม id ของ
Plugin ที่ติดตั้งลงใน allowlist นั้นก่อนเปิดใช้งาน หาก id ของ Plugin เดียวกันปรากฏอยู่ใน
`plugins.deny` การติดตั้งจะลบรายการ deny ที่ค้างเก่านั้น เพื่อให้การติดตั้งอย่างชัดเจน
โหลดได้ทันทีหลังรีสตาร์ท

OpenClaw เก็บ registry Plugin ภายในเครื่องแบบถาวรไว้เป็นโมเดลอ่านแบบ cold read สำหรับ
คลังรายการ Plugin, ความเป็นเจ้าของ contribution และการวางแผน startup flow การติดตั้ง,
อัปเดต, ถอนการติดตั้ง, เปิดใช้งาน และปิดใช้งาน จะ refresh registry นั้นหลังเปลี่ยนสถานะ Plugin
ไฟล์ `plugins/installs.json` เดียวกันเก็บ metadata การติดตั้งถาวรไว้ใน
`installRecords` ระดับบนสุด และ metadata manifest ที่สร้างใหม่ได้ไว้ใน `plugins` หาก
registry หายไป, ค้างเก่า หรือไม่ถูกต้อง `openclaw plugins registry
--refresh` จะสร้างมุมมอง manifest ใหม่จาก install records, policy config และ
metadata ของ manifest/package โดยไม่โหลดโมดูล runtime ของ Plugin
`openclaw plugins update <id-or-npm-spec>` ใช้กับการติดตั้งที่ติดตามอยู่ การส่ง
spec แพ็กเกจ npm พร้อม dist-tag หรือเวอร์ชันแบบ exact จะ resolve ชื่อแพ็กเกจ
กลับไปยัง record ของ Plugin ที่ติดตามอยู่ และบันทึก spec ใหม่สำหรับการอัปเดตในอนาคต
การส่งชื่อแพ็กเกจโดยไม่มีเวอร์ชันจะย้ายการติดตั้งที่ปักหมุดแบบ exact กลับไปยังสาย release
เริ่มต้นของ registry หาก Plugin npm ที่ติดตั้งอยู่ตรงกับเวอร์ชันที่ resolve แล้วและตัวตน artifact
ที่บันทึกไว้ OpenClaw จะข้ามการอัปเดตโดยไม่ดาวน์โหลด, ติดตั้งใหม่ หรือเขียน config ใหม่

`--pin` ใช้กับ npm เท่านั้น ไม่รองรับการใช้ร่วมกับ `--marketplace` เพราะการติดตั้งจาก
marketplace จะเก็บ metadata ของแหล่ง marketplace แทน spec ของ npm

`--dangerously-force-unsafe-install` เป็น override ฉุกเฉินสำหรับ false positive
จากตัวสแกน dangerous-code ในตัว โดยอนุญาตให้การติดตั้ง Plugin และการอัปเดต Plugin
ดำเนินต่อผ่านผลการตรวจพบ `critical` ในตัวได้ แต่ยังคงไม่ข้ามการบล็อก policy
`before_install` ของ Plugin หรือการบล็อกจากความล้มเหลวของการสแกน การสแกนการติดตั้ง
จะละเว้นไฟล์และไดเรกทอรีทดสอบทั่วไป เช่น `tests/`,
`__tests__/`, `*.test.*` และ `*.spec.*` เพื่อหลีกเลี่ยงการบล็อก mock ทดสอบที่แพ็กเกจมา;
entrypoint runtime ของ Plugin ที่ประกาศไว้ยังคงถูกสแกน แม้จะใช้หนึ่งในชื่อเหล่านั้นก็ตาม

แฟล็ก CLI นี้ใช้กับ flow การติดตั้ง/อัปเดต Plugin เท่านั้น การติดตั้ง dependency ของ Skills
ที่มี Gateway รองรับจะใช้ override คำขอ `dangerouslyForceUnsafeInstall` ที่ตรงกันแทน
ขณะที่ `openclaw skills install` ยังคงเป็น flow ดาวน์โหลด/ติดตั้ง Skills จาก ClawHub แยกต่างหาก

หาก Plugin ที่คุณเผยแพร่บน ClawHub ถูกซ่อนหรือถูกบล็อกโดยการสแกน ให้เปิดแดชบอร์ด
ClawHub หรือรัน `clawhub package rescan <name>` เพื่อขอให้ ClawHub ตรวจสอบอีกครั้ง
`--dangerously-force-unsafe-install` มีผลเฉพาะการติดตั้งบนเครื่องของคุณเองเท่านั้น;
ไม่ได้ขอให้ ClawHub สแกน Plugin อีกครั้งหรือทำให้ release ที่ถูกบล็อกเป็นสาธารณะ

บันเดิลที่เข้ากันได้จะเข้าร่วมใน flow รายการ/ตรวจสอบ/เปิดใช้งาน/ปิดใช้งาน Plugin เดียวกัน
การรองรับ runtime ปัจจุบันรวมถึง Skills ของบันเดิล, command-skills ของ Claude,
ค่าเริ่มต้น `settings.json` ของ Claude, ค่าเริ่มต้น `.lsp.json` ของ Claude และ
`lspServers` ที่ประกาศใน manifest, command-skills ของ Cursor และไดเรกทอรี hook
ของ Codex ที่เข้ากันได้

`openclaw plugins inspect <id>` ยังรายงานความสามารถของบันเดิลที่ตรวจพบ พร้อมรายการ
เซิร์ฟเวอร์ MCP และ LSP ที่รองรับหรือไม่รองรับสำหรับ Plugin ที่มีบันเดิลรองรับ

แหล่ง marketplace อาจเป็นชื่อ known-marketplace ของ Claude จาก
`~/.claude/plugins/known_marketplaces.json`, root ของ marketplace ภายในเครื่องหรือ
พาธ `marketplace.json`, shorthand ของ GitHub เช่น `owner/repo`, URL repo ของ
GitHub หรือ URL git สำหรับ marketplace ระยะไกล รายการ Plugin ต้องอยู่ภายใน repo
marketplace ที่ clone มา และใช้เฉพาะแหล่งที่เป็นพาธสัมพัทธ์เท่านั้น

ดูรายละเอียดทั้งหมดที่ [อ้างอิง CLI `openclaw plugins`](/th/cli/plugins)

## ภาพรวม API ของ Plugin

Native Plugin ส่งออกออบเจ็กต์ entry ที่เปิดเผย `register(api)` Plugin รุ่นเก่า
อาจยังใช้ `activate(api)` เป็น alias แบบ legacy แต่ Plugin ใหม่ควรใช้
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

OpenClaw โหลดออบเจ็กต์ entry และเรียก `register(api)` ระหว่างการเปิดใช้งาน Plugin
loader ยัง fallback ไปที่ `activate(api)` สำหรับ Plugin รุ่นเก่า แต่ Plugin ที่มาพร้อมแพ็กเกจ
และ Plugin ภายนอกใหม่ควรถือว่า `register` เป็นสัญญาสาธารณะ

`api.registrationMode` บอก Plugin ว่า entry ของมันถูกโหลดด้วยเหตุผลใด:

| โหมด            | ความหมาย                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | การเปิดใช้งานขณะรันไทม์ ลงทะเบียนเครื่องมือ, hooks, บริการ, คำสั่ง, routes และผลข้างเคียงขณะทำงานอื่นๆ                              |
| `discovery`     | การค้นพบความสามารถแบบอ่านอย่างเดียว ลงทะเบียนผู้ให้บริการและ metadata; โค้ด entry ของ Plugin ที่เชื่อถือได้อาจโหลดได้ แต่ข้ามผลข้างเคียงขณะทำงาน |
| `setup-only`    | การโหลด metadata สำหรับการตั้งค่าช่องทางผ่าน entry สำหรับการตั้งค่าแบบเบา                                                                |
| `setup-runtime` | การโหลดการตั้งค่าช่องทางที่ต้องใช้ runtime entry ด้วย                                                                         |
| `cli-metadata`  | การรวบรวม metadata ของคำสั่ง CLI เท่านั้น                                                                                            |

entry ของ Plugin ที่เปิด sockets, databases, background workers หรือ clients ที่มีอายุยาว
ควรป้องกันผลข้างเคียงเหล่านั้นด้วย `api.registrationMode === "full"`.
การโหลดเพื่อ discovery จะถูกแคชแยกจากการโหลดเพื่อเปิดใช้งาน และจะไม่แทนที่
registry ของ Gateway ที่กำลังทำงานอยู่ Discovery เป็นแบบไม่เปิดใช้งาน ไม่ใช่แบบปลอดการ import:
OpenClaw อาจประเมิน entry ของ Plugin ที่เชื่อถือได้หรือโมดูล Plugin ช่องทางเพื่อสร้าง
snapshot ควรรักษา top level ของโมดูลให้เบาและปราศจากผลข้างเคียง และย้าย
network clients, subprocesses, listeners, การอ่าน credentials และการเริ่มต้นบริการ
ไปไว้หลังเส้นทาง full-runtime

เมธอดการลงทะเบียนที่ใช้บ่อย:

| เมธอด                                  | สิ่งที่ลงทะเบียน           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | ผู้ให้บริการโมเดล (LLM)        |
| `registerChannel`                       | ช่องทางแชต                |
| `registerTool`                          | เครื่องมือของ agent                  |
| `registerHook` / `on(...)`              | Lifecycle hooks             |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | STT แบบสตรีม               |
| `registerRealtimeVoiceProvider`         | เสียง realtime แบบดูเพล็กซ์       |
| `registerMediaUnderstandingProvider`    | การวิเคราะห์รูปภาพ/เสียง        |
| `registerImageGenerationProvider`       | การสร้างรูปภาพ            |
| `registerMusicGenerationProvider`       | การสร้างเพลง            |
| `registerVideoGenerationProvider`       | การสร้างวิดีโอ            |
| `registerWebFetchProvider`              | ผู้ให้บริการ web fetch / scrape |
| `registerWebSearchProvider`             | การค้นหาเว็บ                  |
| `registerHttpRoute`                     | HTTP endpoint               |
| `registerCommand` / `registerCli`       | คำสั่ง CLI                |
| `registerContextEngine`                 | เอนจิน context              |
| `registerService`                       | บริการเบื้องหลัง          |

พฤติกรรม hook guard สำหรับ typed lifecycle hooks:

- `before_tool_call`: `{ block: true }` เป็น terminal; handlers ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_tool_call`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `before_install`: `{ block: true }` เป็น terminal; handlers ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `before_install`: `{ block: false }` เป็น no-op และไม่ล้าง block ก่อนหน้า
- `message_sending`: `{ cancel: true }` เป็น terminal; handlers ที่มีลำดับความสำคัญต่ำกว่าจะถูกข้าม
- `message_sending`: `{ cancel: false }` เป็น no-op และไม่ล้าง cancel ก่อนหน้า

app-server ของ Native Codex รันเหตุการณ์เครื่องมือแบบ Codex-native ผ่าน bridge กลับเข้าสู่
hook surface นี้ Plugins สามารถบล็อกเครื่องมือ native Codex ผ่าน `before_tool_call`,
สังเกตผลลัพธ์ผ่าน `after_tool_call`, และเข้าร่วมในการอนุมัติ
`PermissionRequest` ของ Codex ได้ bridge ยังไม่เขียน arguments ของเครื่องมือ Codex-native ใหม่
ขอบเขตการรองรับ runtime ของ Codex ที่แน่นอนอยู่ใน
[สัญญาการรองรับ Codex harness v1](/th/plugins/codex-harness#v1-support-contract)

สำหรับพฤติกรรม typed hook แบบเต็ม ดู [ภาพรวม SDK](/th/plugins/sdk-overview#hook-decision-semantics)

## ที่เกี่ยวข้อง

- [การสร้าง Plugins](/th/plugins/building-plugins) — สร้าง Plugin ของคุณเอง
- [ชุดรวม Plugin](/th/plugins/bundles) — ความเข้ากันได้ของชุดรวม Codex/Claude/Cursor
- [แมนิเฟสต์ Plugin](/th/plugins/manifest) — schema ของแมนิเฟสต์
- [การลงทะเบียนเครื่องมือ](/th/plugins/building-plugins#registering-agent-tools) — เพิ่มเครื่องมือของ agent ใน Plugin
- [ข้อมูลภายใน Plugin](/th/plugins/architecture) — โมเดลความสามารถและ pipeline การโหลด
- [Plugins ชุมชน](/th/plugins/community) — รายการจากบุคคลที่สาม
