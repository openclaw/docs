---
read_when:
    - คุณดูแล Plugin ของ OpenClaw
    - คุณเห็นคำเตือนความเข้ากันได้ของ Plugin
    - คุณกำลังวางแผนการย้ายข้อมูล Plugin SDK หรือ manifest
summary: Plugin สัญญาความเข้ากันได้ เมทาดาทาการเลิกใช้งาน และความคาดหวังในการย้ายระบบ
title: ความเข้ากันได้ของ Plugin
x-i18n:
    generated_at: "2026-06-27T17:54:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e17881c393e3649cb6accb13996d83a855f434735da2e84738f823ac4eba0f5
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw เชื่อมสัญญา Plugin รุ่นเก่าไว้ผ่านอะแดปเตอร์ความเข้ากันได้ที่มีชื่อก่อนจะนำออก วิธีนี้ปกป้อง Plugin ที่มาพร้อมชุดและ Plugin ภายนอกที่มีอยู่ ขณะที่สัญญา SDK, แมนิเฟสต์, การตั้งค่า, config และรันไทม์ agent พัฒนาต่อไป

## รีจิสทรีความเข้ากันได้

สัญญาความเข้ากันได้ของ Plugin ถูกติดตามในรีจิสทรีแกนหลักที่
`src/plugins/compat/registry.ts`

แต่ละระเบียนมี:

- รหัสความเข้ากันได้ที่เสถียร
- สถานะ: `active`, `deprecated`, `removal-pending` หรือ `removed`
- เจ้าของ: SDK, config, การตั้งค่า, ช่องทาง, ผู้ให้บริการ, การเรียกใช้ Plugin, รันไทม์ agent,
  หรือแกนหลัก
- วันที่เริ่มใช้และวันที่เลิกใช้เมื่อเกี่ยวข้อง
- แนวทางการแทนที่
- เอกสาร, การวินิจฉัย และการทดสอบที่ครอบคลุมพฤติกรรมเก่าและใหม่

รีจิสทรีเป็นแหล่งข้อมูลสำหรับการวางแผนของผู้ดูแลและการตรวจสอบ Plugin inspector ในอนาคต หากพฤติกรรมที่หันหน้าให้ Plugin เปลี่ยน ให้เพิ่มหรืออัปเดตระเบียนความเข้ากันได้ในชุดการเปลี่ยนแปลงเดียวกับที่เพิ่มอะแดปเตอร์

ความเข้ากันได้ของการซ่อมแซมและการย้ายข้อมูลของ doctor ถูกติดตามแยกต่างหากที่
`src/commands/doctor/shared/deprecation-compat.ts` ระเบียนเหล่านั้นครอบคลุมรูปทรง config เก่า, เลย์เอาต์บัญชีแยกประเภทการติดตั้ง และชิมการซ่อมแซมที่อาจต้องคงอยู่หลังจากนำเส้นทางความเข้ากันได้ของรันไทม์ออกแล้ว

การกวาดตรวจช่วง release ควรตรวจสอบทั้งสองรีจิสทรี อย่าลบการย้ายข้อมูลของ doctor เพียงเพราะระเบียนความเข้ากันได้ของรันไทม์หรือ config ที่ตรงกันหมดอายุแล้ว ให้ตรวจสอบก่อนว่าไม่มีเส้นทางอัปเกรดที่รองรับซึ่งยังต้องใช้การซ่อมแซมนั้น นอกจากนี้ให้ตรวจสอบคำอธิบายประกอบการแทนที่แต่ละรายการอีกครั้งระหว่างการวางแผน release เพราะความเป็นเจ้าของ Plugin และขอบเขต config อาจเปลี่ยนเมื่อผู้ให้บริการและช่องทางย้ายออกจากแกนหลัก

## แพ็กเกจ Plugin inspector

Plugin inspector ควรอยู่ภายนอก repo แกนหลักของ OpenClaw เป็นแพ็กเกจ/รีโพสิทอรีแยกต่างหากที่อิงกับสัญญาความเข้ากันได้และแมนิเฟสต์แบบกำหนดเวอร์ชัน

CLI วันแรกควรเป็น:

```sh
openclaw-plugin-inspector ./my-plugin
```

ควรส่งออก:

- การตรวจสอบแมนิเฟสต์/สคีมา
- เวอร์ชันความเข้ากันได้ของสัญญาที่กำลังตรวจสอบ
- การตรวจสอบเมตาดาต้าการติดตั้ง/แหล่งที่มา
- การตรวจสอบการนำเข้าแบบ cold-path
- คำเตือนการเลิกใช้และความเข้ากันได้

ใช้ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้อย่างเสถียรในคำอธิบายประกอบ CI แกนหลักของ OpenClaw ควรเปิดเผยสัญญาและฟิกซ์เจอร์ที่ inspector ใช้ได้ แต่ไม่ควรเผยแพร่ไบนารี inspector จากแพ็กเกจหลัก `openclaw`

### เลนการยอมรับของผู้ดูแล

ใช้ Blacksmith Testbox ที่รองรับด้วย Crabbox สำหรับเลนการยอมรับแพ็กเกจที่ติดตั้งได้ เมื่อตรวจสอบ inspector ภายนอกกับแพ็กเกจ Plugin ของ OpenClaw เรียกใช้จาก checkout OpenClaw ที่สะอาดหลังจากสร้างแพ็กเกจแล้ว:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

คงเลนนี้ไว้เป็นแบบ opt-in สำหรับผู้ดูแล เพราะมันติดตั้งแพ็กเกจ npm ภายนอกและอาจตรวจสอบแพ็กเกจ Plugin ที่ clone นอก repo การ์ดใน repo ภายในครอบคลุม export map ของ SDK, เมตาดาต้ารีจิสทรีความเข้ากันได้, การลดการนำเข้า SDK ที่เลิกใช้แล้ว และขอบเขตการนำเข้าส่วนขยายที่มาพร้อมชุด ส่วนหลักฐาน inspector ของ Testbox ครอบคลุมแพ็กเกจตามที่ผู้เขียน Plugin ภายนอกใช้งาน

## นโยบายการเลิกใช้

OpenClaw ไม่ควรนำสัญญา Plugin ที่มีเอกสารออกใน release เดียวกับที่แนะนำตัวแทนที่

ลำดับการย้ายข้อมูลคือ:

1. เพิ่มสัญญาใหม่
2. คงพฤติกรรมเก่าไว้โดยเชื่อมผ่านอะแดปเตอร์ความเข้ากันได้ที่มีชื่อ
3. ส่งการวินิจฉัยหรือคำเตือนเมื่อผู้เขียน Plugin สามารถดำเนินการได้
4. จัดทำเอกสารตัวแทนที่และไทม์ไลน์
5. ทดสอบทั้งเส้นทางเก่าและใหม่
6. รอจนผ่านช่วงเวลาย้ายข้อมูลที่ประกาศไว้
7. นำออกเฉพาะเมื่อมีการอนุมัติ breaking-release อย่างชัดเจน

ระเบียนที่เลิกใช้แล้วต้องมีวันที่เริ่มเตือน, ตัวแทนที่, ลิงก์เอกสาร และวันที่นำออกสุดท้ายไม่เกินสามเดือนหลังจากเริ่มเตือน อย่าเพิ่มเส้นทางความเข้ากันได้ที่เลิกใช้แล้วพร้อมกรอบเวลานำออกแบบเปิดปลาย เว้นแต่ผู้ดูแลจะตัดสินใจอย่างชัดเจนว่าเป็นความเข้ากันได้ถาวรและทำเครื่องหมายเป็น `active` แทน

## พื้นที่ความเข้ากันได้ปัจจุบัน

ระเบียนความเข้ากันได้ปัจจุบันประกอบด้วย:

- การนำเข้า SDK แบบกว้างรุ่นเก่า เช่น `openclaw/plugin-sdk/compat`
- รูปทรง Plugin รุ่นเก่าแบบ hook-only และ `before_agent_start`
- ชื่อ hook การล้างข้อมูล `api.on("deactivate", ...)` รุ่นเก่า ขณะที่ Plugin ย้ายไปใช้
  `gateway_stop`
- entrypoint ของ Plugin รุ่นเก่า `activate(api)` ขณะที่ Plugin ย้ายไปใช้
  `register(api)`
- alias ของ SDK รุ่นเก่า เช่น `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, ตัวสร้างสถานะ `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils` (แทนที่ด้วย subpath ทดสอบ
  `openclaw/plugin-sdk/*` ที่เจาะจง), และ alias ชนิด `ClawdbotConfig` /
  `OpenClawSchemaType`
- allowlist ของ Plugin ที่มาพร้อมชุดและพฤติกรรมการเปิดใช้งาน
- เมตาดาต้าแมนิเฟสต์ env-var ของผู้ให้บริการ/ช่องทางรุ่นเก่า
- hook และ alias ชนิดของ Plugin ผู้ให้บริการรุ่นเก่า ขณะที่ผู้ให้บริการย้ายไปใช้ hook แคตตาล็อก, auth, thinking, replay และ transport แบบชัดเจน
- alias รันไทม์รุ่นเก่า เช่น `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` และ
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)` ที่เลิกใช้แล้ว
- ฟิลด์ callback แบบแบนของ WhatsApp `WebInboundMessage` เช่น `body`, `chatId`,
  `reply(...)` และ `mediaPath` ขณะที่ผู้ใช้ callback ย้ายไปใช้บริบท
  `event`, `payload`, `quote`, `group` และ
  `platform` ของ `WebInboundCallbackMessage` แบบซ้อน
- ฟิลด์ admission ระดับบนของ WhatsApp `WebInboundMessage` เช่น `from`,
  `conversationId`, `accountId`, `accessControlPassed` และ `chatType` ขณะที่ผู้ใช้ callback ย้ายไปใช้ซอง `admission`
- การลงทะเบียนแบบแยกของ memory-plugin รุ่นเก่า ขณะที่ memory Plugin ย้ายไปใช้
  `registerMemoryCapability`
- การลงทะเบียนผู้ให้บริการ embedding เฉพาะ memory รุ่นเก่า ขณะที่ผู้ให้บริการ embedding ย้ายไปใช้ `api.registerEmbeddingProvider(...)` และ
  `contracts.embeddingProviders`
- helper ของ SDK ช่องทางรุ่นเก่าสำหรับสคีมาข้อความเนทีฟ, การ gating mention,
  การจัดรูปแบบซองขาเข้า และการซ้อนความสามารถ approval
- alias ของ route key ช่องทางและ helper comparable-target ขณะที่ Plugin
  ย้ายไปใช้ `openclaw/plugin-sdk/channel-route`
- activation hint ที่กำลังถูกแทนที่ด้วยความเป็นเจ้าของ contribution ในแมนิเฟสต์
- fallback รันไทม์ `setup-api` ขณะที่ descriptor การตั้งค่าย้ายไปใช้เมตาดาต้า cold
  `setup.requiresRuntime: false`
- hook `discovery` ของผู้ให้บริการ ขณะที่ hook แคตตาล็อกผู้ให้บริการย้ายไปใช้
  `catalog.run(...)`
- เมตาดาต้า `showConfigured` / `showInSetup` ของช่องทาง ขณะที่แพ็กเกจช่องทางย้ายไปใช้
  `openclaw.channel.exposure`
- คีย์ config runtime-policy รุ่นเก่า ขณะที่ doctor ย้าย operator ไปใช้
  `agentRuntime`
- fallback เมตาดาต้า config ช่องทางที่มาพร้อมชุดซึ่งสร้างขึ้น ขณะที่เมตาดาต้า
  `channelConfigs` แบบ registry-first เข้ามา
- flag env สำหรับปิดใช้งานรีจิสทรี Plugin ที่ persist แล้วและการย้ายข้อมูลการติดตั้ง ขณะที่ flow การซ่อมแซมย้าย operator ไปใช้ `openclaw plugins registry --refresh` และ
  `openclaw doctor --fix`
- เส้นทาง config การค้นเว็บ, การ fetch เว็บ และ x_search ที่ Plugin เป็นเจ้าของรุ่นเก่า ขณะที่ doctor ย้ายไปที่ `plugins.entries.<plugin>.config`
- config ที่เขียนด้วย `plugins.installs` รุ่นเก่าและ alias load-path ของ Plugin ที่มาพร้อมชุด ขณะที่เมตาดาต้าการติดตั้งย้ายเข้าไปในบัญชีแยกประเภท Plugin ที่จัดการโดย state

โค้ด Plugin ใหม่ควรใช้ตัวแทนที่ที่ระบุไว้ในรีจิสทรีและคู่มือการย้ายข้อมูลเฉพาะทาง Plugin ที่มีอยู่สามารถใช้เส้นทางความเข้ากันได้ต่อได้จนกว่าเอกสาร, การวินิจฉัย และ release notes จะประกาศกรอบเวลานำออก

### นามแฝงแบบแบนของคอลแบ็กขาเข้าของ WhatsApp

คอลแบ็กรันไทม์ของ WhatsApp ส่งมอบ `WebInboundMessage`: บริบทแบบซ้อนมาตรฐาน `event`, `payload`, `quote`, `group` และ `platform` พร้อม alias แบบแบนที่เลิกใช้แล้วสำหรับฟิลด์ callback ที่เคย ship แล้ว โค้ด callback ใหม่ควรอ่านบริบทแบบซ้อน โค้ดที่สร้างข้อความ callback แบบซ้อนที่สะอาดสามารถใช้ `WebInboundCallbackMessage`; listener ความเข้ากันได้ที่ยังฉีดข้อความทดสอบหรือข้อความ Plugin แบบแบนเก่าควรใช้ `LegacyFlatWebInboundMessage` หรือ
`WebInboundMessageInput`

alias แบบแบนยังคงพร้อมใช้งานจนถึง **2026-08-30** กรอบเวลานำออกนั้นใช้กับการเข้าถึง alias แบบแบนเท่านั้น รูปทรง callback แบบซ้อนคือสัญญารันไทม์มาตรฐาน คำอธิบายประกอบ TypeScript `@deprecated` บนชื่อ alias แบบแบนแต่ละรายการระบุตัวแทนที่แบบซ้อนที่แน่นอน ตัวอย่างทั่วไป:

- `id`, `timestamp` และ `isBatched` ย้ายไปอยู่ใต้ `event`
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location` และ
  `untrustedStructuredContext` ย้ายไปอยู่ใต้ `payload`
- `to`, `chatId`, ฟิลด์ sender/self, `sendComposing`, `reply(...)` และ
  `sendMedia(...)` ย้ายไปอยู่ใต้ `platform`
- ฟิลด์ `replyTo*` ย้ายไปอยู่ใต้ `quote` และฟิลด์ subject/participant/mention ของกลุ่มย้ายไปอยู่ใต้ `group`

`payload.untrustedStructuredContext` ถูกสกัดจาก payload ของผู้ให้บริการขาเข้า Plugin ควรตรวจสอบ `label`, `source` และ `type` ก่อนปฏิบัติต่อ
`payload` ของมันว่าเป็นข้อมูลที่เชื่อถือได้

### ฟิลด์ Admission ขาเข้าของ WhatsApp

ข้อความ callback ของ WhatsApp ที่ได้รับการยอมรับตอนนี้มี `admission` ซึ่งเป็นซองที่ปลอดภัยสำหรับสาธารณะสำหรับการตัดสินใจ access-control ที่รับข้อความนั้นเข้ามา โค้ด callback ใหม่ควรอ่านข้อเท็จจริง admission จาก `msg.admission` แทนฟิลด์ admission ระดับบนแบบเก่า

ฟิลด์ระดับบนยังคงพร้อมใช้งานจนถึง **2026-08-30** คำอธิบายประกอบ TypeScript
`@deprecated` ระบุตัวแทนที่แต่ละรายการ:

- `from` และ `conversationId` ย้ายไปที่ `admission.conversation.id`
- `accountId` ย้ายไปที่ `admission.accountId`
- `accessControlPassed` เป็นมุมมองความเข้ากันได้ที่คำนวณจาก
  `admission.ingress.decision === "allow"`; บนข้อความที่มี
  `admission` อยู่แล้ว การเขียน boolean รุ่นเก่าจะไม่เขียนกราฟ ingress ใหม่
- `chatType` ย้ายไปที่ `admission.conversation.kind`

## Release notes

Release notes ควรรวมการเลิกใช้ Plugin ที่กำลังจะมาถึง พร้อมวันที่เป้าหมายและลิงก์ไปยังเอกสารการย้ายข้อมูล คำเตือนนั้นต้องเกิดขึ้นก่อนที่เส้นทางความเข้ากันได้จะย้ายไปเป็น `removal-pending` หรือ `removed`
