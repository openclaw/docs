---
read_when:
    - คุณดูแลรักษา Plugin ของ OpenClaw
    - คุณเห็นคำเตือนเกี่ยวกับความเข้ากันได้ของ Plugin
    - คุณกำลังวางแผนการย้ายสำหรับ Plugin SDK หรือ manifest
summary: สัญญาความเข้ากันได้ของ Plugin, เมทาดาตาการเลิกใช้งาน และความคาดหวังในการย้ายข้อมูล
title: ความเข้ากันได้ของ Plugin
x-i18n:
    generated_at: "2026-04-30T10:05:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 344dbaac86db7259adc09bc91b7fbe7ba540fc6fdd96cc422918ccf2c34d9cec
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw จะเชื่อมสัญญา Plugin รุ่นเก่าไว้ผ่านอะแดปเตอร์ความเข้ากันได้ที่มีชื่อ ก่อนจะลบออก วิธีนี้ช่วยปกป้อง Plugin ที่บันเดิลมาและ Plugin ภายนอกที่มีอยู่ ขณะที่สัญญา SDK, manifest, setup, config และ agent runtime พัฒนาไปข้างหน้า

## รีจิสทรีความเข้ากันได้

สัญญาความเข้ากันได้ของ Plugin ถูกติดตามในรีจิสทรีหลักที่
`src/plugins/compat/registry.ts`

แต่ละระเบียนมี:

- รหัสความเข้ากันได้ที่เสถียร
- สถานะ: `active`, `deprecated`, `removal-pending` หรือ `removed`
- เจ้าของ: SDK, config, setup, channel, provider, การดำเนินการ Plugin, agent runtime
  หรือ core
- วันที่เริ่มใช้และวันที่เลิกสนับสนุนเมื่อเกี่ยวข้อง
- คำแนะนำสำหรับสิ่งทดแทน
- เอกสาร การวินิจฉัย และการทดสอบที่ครอบคลุมพฤติกรรมเก่าและใหม่

รีจิสทรีนี้เป็นแหล่งข้อมูลสำหรับการวางแผนของผู้ดูแลและการตรวจสอบ plugin inspector ในอนาคต หากพฤติกรรมที่กระทบ Plugin เปลี่ยนแปลง ให้เพิ่มหรืออัปเดตระเบียนความเข้ากันได้ในการเปลี่ยนแปลงเดียวกับที่เพิ่มอะแดปเตอร์

ความเข้ากันได้ของการซ่อมแซมและการย้ายข้อมูลของ doctor ถูกติดตามแยกต่างหากที่
`src/commands/doctor/shared/deprecation-compat.ts` ระเบียนเหล่านั้นครอบคลุมรูปแบบ config เก่า เลย์เอาต์ install-ledger และ shim สำหรับการซ่อมแซมที่อาจต้องคงไว้หลังจากลบเส้นทางความเข้ากันได้ของ runtime แล้ว

การกวาดตรวจช่วง release ควรตรวจสอบทั้งสองรีจิสทรี อย่าลบการย้ายข้อมูลของ doctor เพียงเพราะระเบียนความเข้ากันได้ของ runtime หรือ config ที่ตรงกันหมดอายุแล้ว ให้ตรวจสอบก่อนว่าไม่มีเส้นทางอัปเกรดที่รองรับซึ่งยังต้องใช้การซ่อมแซมนี้ นอกจากนี้ ให้ตรวจสอบ annotation ของสิ่งทดแทนแต่ละรายการอีกครั้งระหว่างการวางแผน release เพราะความเป็นเจ้าของ Plugin และขอบเขต config อาจเปลี่ยนได้เมื่อ provider และ channel ย้ายออกจาก core

## แพ็กเกจ plugin inspector

plugin inspector ควรอยู่ภายนอก repo หลักของ OpenClaw ในฐานะแพ็กเกจ/รีโพซิทอรีแยกต่างหากที่รองรับด้วยสัญญาความเข้ากันได้และ manifest แบบมีเวอร์ชัน

CLI วันแรกควรเป็น:

```sh
openclaw-plugin-inspector ./my-plugin
```

ควรส่งออก:

- การตรวจสอบ manifest/schema
- เวอร์ชันความเข้ากันได้ของสัญญาที่กำลังตรวจสอบ
- การตรวจสอบ metadata ของ install/source
- การตรวจสอบ import ใน cold-path
- คำเตือนการเลิกสนับสนุนและความเข้ากันได้

ใช้ `--json` สำหรับเอาต์พุตที่เครื่องอ่านได้อย่างเสถียรใน annotation ของ CI OpenClaw core ควรเปิดเผยสัญญาและ fixture ที่ inspector ใช้ได้ แต่ไม่ควรเผยแพร่ไบนารี inspector จากแพ็กเกจหลัก `openclaw`

### เลนการยอมรับของผู้ดูแล

ใช้ Blacksmith Testbox สำหรับเลนการยอมรับแพ็กเกจที่ติดตั้งได้ เมื่อตรวจสอบ inspector ภายนอกกับแพ็กเกจ Plugin ของ OpenClaw ให้เรียกใช้จาก checkout ของ OpenClaw ที่สะอาดหลังจาก build แพ็กเกจแล้ว:

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

ให้เลนนี้เป็นแบบ opt-in สำหรับผู้ดูแล เพราะจะติดตั้งแพ็กเกจ npm ภายนอกและอาจตรวจสอบแพ็กเกจ Plugin ที่ clone ไว้นอก repo ตัวป้องกันของ repo ในเครื่องครอบคลุม SDK export map, metadata ของรีจิสทรีความเข้ากันได้, การลดการใช้งาน import ของ SDK ที่เลิกสนับสนุน และขอบเขต import ของส่วนขยายที่บันเดิลมา ส่วนหลักฐานจาก Testbox inspector ครอบคลุมแพ็กเกจในแบบที่ผู้เขียน Plugin ภายนอกใช้งานจริง

## นโยบายการเลิกสนับสนุน

OpenClaw ไม่ควรลบสัญญา Plugin ที่มีเอกสารกำกับใน release เดียวกับที่แนะนำสิ่งทดแทน

ลำดับการย้ายข้อมูลคือ:

1. เพิ่มสัญญาใหม่
2. คงพฤติกรรมเก่าไว้ผ่านอะแดปเตอร์ความเข้ากันได้ที่มีชื่อ
3. ส่งการวินิจฉัยหรือคำเตือนเมื่อผู้เขียน Plugin ดำเนินการได้
4. จัดทำเอกสารสิ่งทดแทนและไทม์ไลน์
5. ทดสอบทั้งเส้นทางเก่าและใหม่
6. รอให้ผ่านช่วงเวลาการย้ายข้อมูลที่ประกาศไว้
7. ลบเฉพาะเมื่อมีการอนุมัติ release ที่เป็น breaking change อย่างชัดเจน

ระเบียนที่เลิกสนับสนุนต้องมีวันที่เริ่มเตือน สิ่งทดแทน ลิงก์เอกสาร และวันที่ลบขั้นสุดท้ายที่ไม่เกินสามเดือนหลังจากเริ่มเตือน อย่าเพิ่มเส้นทางความเข้ากันได้ที่เลิกสนับสนุนพร้อมกรอบเวลาการลบแบบไม่มีกำหนด เว้นแต่ผู้ดูแลจะตัดสินใจอย่างชัดเจนว่าเป็นความเข้ากันได้แบบถาวรและทำเครื่องหมายเป็น `active` แทน

## พื้นที่ความเข้ากันได้ปัจจุบัน

ระเบียนความเข้ากันได้ปัจจุบันประกอบด้วย:

- import ของ SDK แบบกว้างรุ่นเก่า เช่น `openclaw/plugin-sdk/compat`
- รูปแบบ Plugin รุ่นเก่าที่มีเฉพาะ hook และ `before_agent_start`
- entrypoint ของ Plugin รุ่นเก่าแบบ `activate(api)` ระหว่างที่ Plugin ย้ายไปใช้
  `register(api)`
- alias ของ SDK รุ่นเก่า เช่น `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, ตัวสร้างสถานะ `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils` (แทนที่ด้วย subpath ทดสอบเฉพาะทางของ
  `openclaw/plugin-sdk/*`) และ type alias `ClawdbotConfig` /
  `OpenClawSchemaType`
- allowlist ของ Plugin ที่บันเดิลมาและพฤติกรรมการเปิดใช้งาน
- metadata ของ manifest env-var สำหรับ provider/channel รุ่นเก่า
- hook และ type alias ของ provider Plugin รุ่นเก่า ระหว่างที่ provider ย้ายไปยัง hook สำหรับ catalog, auth, thinking, replay และ transport ที่ชัดเจน
- alias ของ runtime รุ่นเก่า เช่น `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` และ
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
  ที่เลิกสนับสนุนแล้ว
- การลงทะเบียนแบบแยกของ memory-plugin รุ่นเก่า ระหว่างที่ memory Plugin ย้ายไปยัง
  `registerMemoryCapability`
- helper ของ channel SDK รุ่นเก่าสำหรับ schema ข้อความ native, mention gating,
  การจัดรูปแบบ inbound envelope และการซ้อน capability การอนุมัติ
- alias ของ helper สำหรับ route key ของ channel และ comparable-target รุ่นเก่า ระหว่างที่ Plugin
  ย้ายไปยัง `openclaw/plugin-sdk/channel-route`
- activation hint ที่กำลังถูกแทนที่ด้วยความเป็นเจ้าของ contribution ใน manifest
- การโหลด startup sidecar โดยนัยที่เลิกสนับสนุนแล้ว สำหรับ Plugin ที่ยังไม่ได้ประกาศ
  `activation.onStartup`; ผู้ดูแลสามารถทดสอบพฤติกรรมที่เข้มงวดขึ้นในอนาคตได้ด้วย
  `OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1`
- fallback ของ runtime `setup-api` ระหว่างที่ setup descriptor ย้ายไปยัง metadata แบบ cold
  `setup.requiresRuntime: false`
- hook `discovery` ของ provider ระหว่างที่ hook ของ catalog provider ย้ายไปยัง
  `catalog.run(...)`
- metadata `showConfigured` / `showInSetup` ของ channel ระหว่างที่แพ็กเกจ channel ย้ายไปยัง
  `openclaw.channel.exposure`
- คีย์ config ของ runtime-policy รุ่นเก่า ระหว่างที่ doctor ย้าย operator ไปยัง
  `agentRuntime`
- fallback ของ metadata config channel ที่บันเดิลมาและสร้างขึ้นโดย generator ระหว่างที่ metadata แบบ registry-first
  `channelConfigs` เข้ามา
- flag env สำหรับการปิดใช้รีจิสทรี Plugin ที่ persist ไว้และการย้ายข้อมูล install ระหว่างที่ flow การซ่อมแซมย้าย operator ไปยัง `openclaw plugins registry --refresh` และ
  `openclaw doctor --fix`
- เส้นทาง config ของ web search, web fetch และ x_search ที่ Plugin เป็นเจ้าของรุ่นเก่า ระหว่างที่ doctor ย้ายไปยัง `plugins.entries.<plugin>.config`
- config `plugins.installs` ที่เขียนขึ้นรุ่นเก่า และ alias ของ load-path สำหรับ Plugin ที่บันเดิลมา ระหว่างที่ metadata การติดตั้งย้ายเข้าไปยัง ledger ของ Plugin ที่จัดการโดย state

โค้ด Plugin ใหม่ควรเลือกใช้สิ่งทดแทนที่ระบุไว้ในรีจิสทรีและในคู่มือการย้ายข้อมูลเฉพาะ Plugin ที่มีอยู่สามารถใช้เส้นทางความเข้ากันได้ต่อไปได้จนกว่าเอกสาร การวินิจฉัย และ release notes จะประกาศกรอบเวลาการลบ

## Release notes

Release notes ควรรวมการเลิกสนับสนุน Plugin ที่กำลังจะมาถึง พร้อมวันที่เป้าหมายและลิงก์ไปยังเอกสารการย้ายข้อมูล คำเตือนนั้นต้องเกิดขึ้นก่อนที่เส้นทางความเข้ากันได้จะย้ายไปเป็น `removal-pending` หรือ `removed`
