---
read_when:
    - คุณดูแล Plugin ของ OpenClaw
    - คุณเห็นคำเตือนเกี่ยวกับความเข้ากันได้ของ Plugin
    - คุณกำลังวางแผนการไมเกรต Plugin SDK หรือ manifest
summary: สัญญาความเข้ากันได้ของ Plugin, เมตาดาตาการเลิกใช้ และความคาดหวังในการย้ายระบบ
title: ความเข้ากันได้ของ Plugin
x-i18n:
    generated_at: "2026-05-11T20:35:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1afd37697f55721ca8419256a6e8187c398d4b20fb11a65776b755050dd5368b
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw เชื่อมต่อสัญญา Plugin รุ่นเก่าผ่านอะแดปเตอร์ความเข้ากันได้ที่มีชื่อกำกับไว้ก่อนที่จะลบออก วิธีนี้ช่วยปกป้อง Plugin ที่บันเดิลมากับระบบและ Plugin ภายนอกที่มีอยู่ ขณะที่สัญญาของ SDK, manifest, setup, config และ agent runtime พัฒนาต่อไป

## รีจิสทรีความเข้ากันได้

สัญญาความเข้ากันได้ของ Plugin ถูกติดตามในรีจิสทรีหลักที่
`src/plugins/compat/registry.ts`

แต่ละระเบียนมี:

- รหัสความเข้ากันได้ที่คงที่
- status: `active`, `deprecated`, `removal-pending`, หรือ `removed`
- owner: SDK, config, setup, channel, provider, การรัน Plugin, agent runtime,
  หรือ core
- วันที่เริ่มใช้และวันที่เลิกใช้งานเมื่อเกี่ยวข้อง
- คำแนะนำสำหรับสิ่งทดแทน
- เอกสาร การวินิจฉัย และการทดสอบที่ครอบคลุมพฤติกรรมเก่าและใหม่

รีจิสทรีเป็นแหล่งข้อมูลสำหรับการวางแผนของผู้ดูแลและการตรวจสอบของ plugin inspector ในอนาคต หากพฤติกรรมที่กระทบผู้สร้าง Plugin เปลี่ยนแปลง ให้เพิ่มหรืออัปเดตระเบียนความเข้ากันได้ในการเปลี่ยนแปลงเดียวกับที่เพิ่มอะแดปเตอร์

ความเข้ากันได้สำหรับการซ่อมแซมและการย้ายข้อมูลของ doctor ถูกติดตามแยกต่างหากที่
`src/commands/doctor/shared/deprecation-compat.ts` ระเบียนเหล่านั้นครอบคลุมรูปแบบ config เก่า เลย์เอาต์ install-ledger และ repair shim ที่อาจต้องคงอยู่หลังจากเส้นทางความเข้ากันได้ของ runtime ถูกลบออกแล้ว

การกวาดตรวจในรอบรีลีสควรตรวจสอบทั้งสองรีจิสทรี อย่าลบการย้ายข้อมูลของ doctor เพียงเพราะระเบียนความเข้ากันได้ของ runtime หรือ config ที่สอดคล้องกันหมดอายุแล้ว ให้ตรวจสอบก่อนว่าไม่มีเส้นทางอัปเกรดที่ยังรองรับและยังต้องใช้การซ่อมแซมนั้น นอกจากนี้ให้ตรวจสอบคำอธิบายสิ่งทดแทนแต่ละรายการอีกครั้งระหว่างการวางแผนรีลีส เพราะความเป็นเจ้าของ Plugin และขอบเขต config อาจเปลี่ยนไปเมื่อ provider และ channel ย้ายออกจาก core

## แพ็กเกจ plugin inspector

plugin inspector ควรอยู่ภายนอก repo หลักของ OpenClaw ในฐานะแพ็กเกจ/รีโพซิทอรีแยกต่างหากที่อิงกับสัญญาความเข้ากันได้และ manifest ที่มีการกำหนดเวอร์ชัน

CLI วันแรกควรเป็น:

```sh
openclaw-plugin-inspector ./my-plugin
```

ควรแสดงผล:

- การตรวจสอบ manifest/schema
- เวอร์ชันความเข้ากันได้ของสัญญาที่กำลังตรวจสอบ
- การตรวจสอบเมทาดาทา install/source
- การตรวจสอบการ import แบบ cold-path
- คำเตือนการเลิกใช้งานและความเข้ากันได้

ใช้ `--json` สำหรับผลลัพธ์ที่เครื่องอ่านได้อย่างเสถียรใน annotation ของ CI core ของ OpenClaw ควรเปิดเผยสัญญาและ fixture ที่ inspector นำไปใช้ได้ แต่ไม่ควรเผยแพร่ไบนารีของ inspector จากแพ็กเกจหลัก `openclaw`

### เลนการยอมรับของผู้ดูแล

ใช้ Blacksmith Testbox ที่รองรับด้วย Crabbox สำหรับเลนการยอมรับแพ็กเกจที่ติดตั้งได้ เมื่อตรวจสอบ inspector ภายนอกกับแพ็กเกจ Plugin ของ OpenClaw ให้รันจาก checkout ของ OpenClaw ที่สะอาดหลังจากสร้างแพ็กเกจแล้ว:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

ให้เลนนี้เป็นแบบ opt-in สำหรับผู้ดูแล เพราะเลนนี้ติดตั้งแพ็กเกจ npm ภายนอกและอาจตรวจสอบแพ็กเกจ Plugin ที่ clone อยู่นอก repo ตัวป้องกันใน repo ภายในครอบคลุม export map ของ SDK, เมทาดาทารีจิสทรีความเข้ากันได้, การลดการใช้ SDK import ที่เลิกใช้งานแล้ว และขอบเขตการ import ของส่วนขยายที่บันเดิลมากับระบบ ส่วนหลักฐานจาก Testbox inspector ครอบคลุมแพ็กเกจในแบบที่ผู้สร้าง Plugin ภายนอกใช้งานจริง

## นโยบายการเลิกใช้งาน

OpenClaw ไม่ควรลบสัญญา Plugin ที่มีเอกสารระบุไว้ในรีลีสเดียวกับที่แนะนำสิ่งทดแทน

ลำดับการย้ายข้อมูลคือ:

1. เพิ่มสัญญาใหม่
2. คงพฤติกรรมเก่าไว้โดยเชื่อมผ่านอะแดปเตอร์ความเข้ากันได้ที่มีชื่อกำกับ
3. แสดงการวินิจฉัยหรือคำเตือนเมื่อผู้สร้าง Plugin สามารถดำเนินการได้
4. จัดทำเอกสารสิ่งทดแทนและไทม์ไลน์
5. ทดสอบทั้งเส้นทางเก่าและใหม่
6. รอให้ครบช่วงเวลาการย้ายข้อมูลที่ประกาศไว้
7. ลบเฉพาะเมื่อได้รับอนุมัติสำหรับรีลีสที่มีการเปลี่ยนแปลงแบบ breaking อย่างชัดเจน

ระเบียนที่เลิกใช้งานต้องมีวันที่เริ่มเตือน สิ่งทดแทน ลิงก์เอกสาร และวันที่ลบขั้นสุดท้ายไม่เกินสามเดือนหลังจากเริ่มเตือน อย่าเพิ่มเส้นทางความเข้ากันได้ที่เลิกใช้งานพร้อมกรอบเวลาการลบแบบไม่มีกำหนด เว้นแต่ผู้ดูแลจะตัดสินใจอย่างชัดเจนว่าเป็นความเข้ากันได้ถาวรและทำเครื่องหมายเป็น `active` แทน

## พื้นที่ความเข้ากันได้ปัจจุบัน

ระเบียนความเข้ากันได้ปัจจุบันประกอบด้วย:

- การ import SDK แบบกว้างรุ่นเก่า เช่น `openclaw/plugin-sdk/compat`
- รูปแบบ Plugin รุ่นเก่าที่มีเฉพาะ hook และ `before_agent_start`
- entrypoint ของ Plugin รุ่นเก่า `activate(api)` ระหว่างที่ Plugin ย้ายไปใช้
  `register(api)`
- alias ของ SDK รุ่นเก่า เช่น `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, ตัวสร้างสถานะ `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils` (แทนที่ด้วย subpath ทดสอบ
  `openclaw/plugin-sdk/*` ที่เฉพาะเจาะจง) และ type alias `ClawdbotConfig` /
  `OpenClawSchemaType`
- พฤติกรรม allowlist และการเปิดใช้งานของ Plugin ที่บันเดิลมากับระบบ
- เมทาดาทา manifest ของ env-var สำหรับ provider/channel รุ่นเก่า
- hook และ type alias ของ provider Plugin รุ่นเก่า ระหว่างที่ provider ย้ายไปใช้
  hook สำหรับ catalog, auth, thinking, replay และ transport อย่างชัดเจน
- alias ของ runtime รุ่นเก่า เช่น `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` และ
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
  ที่เลิกใช้งานแล้ว
- การลงทะเบียนแบบแยกของ memory-plugin รุ่นเก่า ระหว่างที่ memory Plugin ย้ายไปใช้
  `registerMemoryCapability`
- helper ของ channel SDK รุ่นเก่าสำหรับ schema ข้อความ native, mention gating,
  การจัดรูปแบบ inbound envelope และการซ้อนความสามารถ approval
- alias ของ route key ของ channel และ helper เป้าหมายที่เปรียบเทียบได้ ระหว่างที่ Plugin
  ย้ายไปใช้ `openclaw/plugin-sdk/channel-route`
- activation hint ที่กำลังถูกแทนที่ด้วยความเป็นเจ้าของ contribution ใน manifest
- fallback ของ runtime `setup-api` ระหว่างที่ตัวอธิบาย setup ย้ายไปใช้เมทาดาทาแบบ cold
  `setup.requiresRuntime: false`
- hook `discovery` ของ provider ระหว่างที่ hook ของ provider catalog ย้ายไปใช้
  `catalog.run(...)`
- เมทาดาทา `showConfigured` / `showInSetup` ของ channel ระหว่างที่แพ็กเกจ channel ย้ายไปใช้
  `openclaw.channel.exposure`
- key ของ runtime-policy config รุ่นเก่า ระหว่างที่ doctor ย้าย operator ไปใช้
  `agentRuntime`
- fallback เมทาดาทา config ของ channel ที่บันเดิลมากับระบบและสร้างขึ้นอัตโนมัติ ระหว่างที่เมทาดาทา
  `channelConfigs` แบบ registry-first ถูกนำมาใช้
- แฟล็ก env สำหรับการปิดใช้รีจิสทรี Plugin ที่คงไว้และ install-migration ระหว่างที่โฟลว์ซ่อมแซมย้าย operator ไปใช้ `openclaw plugins registry --refresh` และ
  `openclaw doctor --fix`
- เส้นทาง config ของ web search, web fetch และ x_search ที่ Plugin เป็นเจ้าของรุ่นเก่า ระหว่างที่
  doctor ย้ายไปยัง `plugins.entries.<plugin>.config`
- config ที่เขียนด้วย `plugins.installs` รุ่นเก่าและ alias ของ load-path ของ Plugin ที่บันเดิลมากับระบบ ระหว่างที่เมทาดาทาการติดตั้งย้ายไปอยู่ใน plugin ledger ที่จัดการโดย state

โค้ด Plugin ใหม่ควรเลือกใช้สิ่งทดแทนที่ระบุไว้ในรีจิสทรีและในคู่มือการย้ายข้อมูลเฉพาะ Plugin ที่มีอยู่สามารถใช้เส้นทางความเข้ากันได้ต่อไปได้จนกว่าเอกสาร การวินิจฉัย และบันทึกรีลีสจะประกาศกรอบเวลาการลบ

## บันทึกรีลีส

บันทึกรีลีสควรรวมการเลิกใช้งาน Plugin ที่กำลังจะมาถึง พร้อมวันที่เป้าหมายและลิงก์ไปยังเอกสารการย้ายข้อมูล คำเตือนนั้นต้องเกิดขึ้นก่อนที่เส้นทางความเข้ากันได้จะย้ายไปเป็น `removal-pending` หรือ `removed`
