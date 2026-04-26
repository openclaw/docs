---
read_when:
    - คุณดูแล Plugin ของ OpenClaw
    - คุณเห็นคำเตือนเกี่ยวกับความเข้ากันได้ของ Plugin
    - คุณกำลังวางแผนการย้ายระบบของ SDK หรือ manifest ของ Plugin
summary: สัญญาความเข้ากันได้ของ Plugin เมทาดาทาการเลิกใช้งาน และความคาดหวังในการย้ายระบบ
title: ความเข้ากันได้ของ Plugin
x-i18n:
    generated_at: "2026-04-26T11:36:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b4e11dc57c29eac72844b91bec75a9d48005bbd3c89a2a9d7a5634ab782e5fc
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw จะคงสัญญา contract ของ Plugin รุ่นเก่าไว้ผ่าน compatibility adapter ที่มีชื่อเรียกก่อนจะนำออก วิธีนี้ช่วยปกป้องทั้ง Plugin ที่บันเดิลมากับระบบและ Plugin ภายนอก ขณะที่ contract ของ SDK, manifest, setup, config และรันไทม์ของเอเจนต์มีการพัฒนาเปลี่ยนแปลง

## รีจิสทรีความเข้ากันได้

contract ความเข้ากันได้ของ Plugin ถูกติดตามไว้ในรีจิสทรีหลักที่
`src/plugins/compat/registry.ts`

แต่ละระเบียนมี:

- รหัส compatibility ที่คงที่
- สถานะ: `active`, `deprecated`, `removal-pending` หรือ `removed`
- owner: SDK, config, setup, channel, provider, การรัน Plugin, รันไทม์ของเอเจนต์ หรือ core
- วันที่เริ่มใช้และวันที่เลิกใช้งานเมื่อมี
- แนวทางสำหรับสิ่งที่ใช้แทน
- เอกสาร การวินิจฉัย และการทดสอบที่ครอบคลุมทั้งพฤติกรรมเก่าและใหม่

รีจิสทรีนี้เป็นแหล่งอ้างอิงสำหรับการวางแผนของผู้ดูแลและการตรวจสอบ plugin inspector ในอนาคต หากพฤติกรรมที่ Plugin มองเห็นมีการเปลี่ยนแปลง ให้เพิ่มหรืออัปเดตระเบียน compatibility ภายในการเปลี่ยนแปลงเดียวกันกับที่เพิ่ม adapter

การซ่อมแซมของ doctor และ compatibility สำหรับการย้ายระบบจะถูกติดตามแยกต่างหากที่
`src/commands/doctor/shared/deprecation-compat.ts` ระเบียนเหล่านั้นครอบคลุมโครงสร้าง config เก่า เลย์เอาต์ install-ledger และ repair shim ที่อาจต้องคงไว้หลังจากเส้นทาง runtime compatibility ถูกนำออกแล้ว

การตรวจทานก่อนรีลีสควรตรวจทั้งสองรีจิสทรี อย่าลบ doctor migration เพียงเพราะระเบียน runtime หรือ config compatibility ที่สอดคล้องกันหมดอายุแล้ว; ให้ตรวจสอบก่อนว่ายังไม่มีเส้นทางอัปเกรดที่รองรับซึ่งยังต้องใช้การซ่อมแซมนั้นอยู่ อีกทั้งควรตรวจทาน annotation ของสิ่งที่ใช้แทนแต่ละรายการใหม่ในระหว่างวางแผนรีลีส เพราะ owner ของ Plugin และขอบเขตของ config อาจเปลี่ยนไปเมื่อ provider และ channel ถูกย้ายออกจาก core

## แพ็กเกจ plugin inspector

plugin inspector ควรอยู่ภายนอกรีโป OpenClaw core เป็นแพ็กเกจ/รีโพแยกต่างหากที่อ้างอิงกับ contract ของ compatibility และ manifest ที่มีการกำหนดเวอร์ชัน

CLI เวอร์ชันเริ่มต้นควรเป็น:

```sh
openclaw-plugin-inspector ./my-plugin
```

ควรแสดงผลดังนี้:

- การตรวจสอบ manifest/schema
- เวอร์ชัน contract compatibility ที่กำลังตรวจสอบ
- การตรวจสอบเมทาดาทาการติดตั้ง/แหล่งที่มา
- การตรวจสอบ import ใน cold path
- คำเตือนเกี่ยวกับการเลิกใช้งานและความเข้ากันได้

ใช้ `--json` เพื่อให้ได้เอาต์พุตแบบ machine-readable ที่คงที่สำหรับ annotation ใน CI OpenClaw
core ควรเปิดเผย contract และ fixture ที่ inspector สามารถนำไปใช้ได้ แต่ไม่ควรเผยแพร่ไบนารี inspector จากแพ็กเกจ `openclaw` หลัก

## นโยบายการเลิกใช้งาน

OpenClaw ไม่ควรนำ contract ของ Plugin ที่มีเอกสารรองรับออกภายในรีลีสเดียวกับที่เพิ่มสิ่งทดแทนเข้ามา

ลำดับการย้ายระบบคือ:

1. เพิ่ม contract ใหม่
2. คงพฤติกรรมเดิมไว้ผ่าน compatibility adapter ที่มีชื่อเรียก
3. แสดงการวินิจฉัยหรือคำเตือนเมื่อผู้เขียน Plugin สามารถลงมือได้
4. จัดทำเอกสารของสิ่งที่ใช้แทนและกรอบเวลา
5. ทดสอบทั้งเส้นทางเก่าและใหม่
6. รอให้พ้นช่วงเวลาการย้ายระบบที่ประกาศไว้
7. นำออกได้ก็ต่อเมื่อมีการอนุมัติการเปลี่ยนแปลงแบบ breaking release อย่างชัดเจน

ระเบียนที่เลิกใช้งานแล้วต้องมีวันที่เริ่มเตือน สิ่งที่ใช้แทน ลิงก์เอกสาร และวันที่นำออกสุดท้ายซึ่งต้องไม่เกินสามเดือนหลังจากเริ่มเตือน อย่าเพิ่มเส้นทาง compatibility ที่เลิกใช้งานแล้วโดยไม่มีกรอบเวลานำออกที่ชัดเจน เว้นแต่ผู้ดูแลจะตัดสินใจอย่างชัดแจ้งว่าเป็น compatibility ถาวรและทำเครื่องหมายเป็น `active` แทน

## พื้นที่ความเข้ากันได้ปัจจุบัน

ระเบียน compatibility ปัจจุบันประกอบด้วย:

- import SDK แบบกว้างรุ่นเก่า เช่น `openclaw/plugin-sdk/compat`
- รูปแบบ Plugin รุ่นเก่าที่มีแต่ hook และ `before_agent_start`
- entrypoint ของ Plugin รุ่นเก่าแบบ `activate(api)` ขณะที่ Plugin กำลังย้ายไปใช้ `register(api)`
- alias ของ SDK รุ่นเก่า เช่น `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, ตัวสร้างสถานะ `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils` และ type alias `ClawdbotConfig` /
  `OpenClawSchemaType`
- พฤติกรรม allowlist และการเปิดใช้งาน Plugin ที่บันเดิลมา
- เมทาดาทา manifest ของ env var สำหรับ provider/channel แบบเดิม
- hook และ type alias ของ provider Plugin แบบเดิม ขณะที่ provider กำลังย้ายไปสู่ hook แบบ explicit สำหรับ catalog, auth, thinking, replay และ transport
- alias ของ runtime แบบเดิม เช่น `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession` และ `api.runtime.stt`
- การลงทะเบียนแยกของ memory-plugin แบบเดิม ขณะที่ memory plugin กำลังย้ายไปใช้
  `registerMemoryCapability`
- helper ของ channel SDK แบบเดิมสำหรับสคีมาข้อความแบบ native, mention gating, การจัดรูปแบบ inbound envelope และการซ้อน approval capability
- activation hint ที่กำลังถูกแทนที่ด้วย ownership ของ manifest contribution
- fallback ของ runtime ใน `setup-api` ขณะที่ setup descriptor กำลังย้ายไปสู่เมทาดาทาแบบ cold
  `setup.requiresRuntime: false`
- hook `discovery` ของ provider ขณะที่ hook แค็ตตาล็อกของ provider กำลังย้ายไปใช้
  `catalog.run(...)`
- เมทาดาทา `showConfigured` / `showInSetup` ของ channel ขณะที่แพ็กเกจ channel กำลังย้ายไปใช้
  `openclaw.channel.exposure`
- คีย์ config ของ runtime-policy แบบเดิม ขณะที่ doctor กำลังย้ายผู้ดูแลระบบไปใช้
  `agentRuntime`
- fallback ของเมทาดาทา config channel ที่สร้างจาก bundled channel ขณะที่เมทาดาทา `channelConfigs` แบบ registry-first กำลังถูกนำมาใช้
- แฟล็ก env สำหรับการปิดรีจิสทรี Plugin ที่บันทึกไว้และการย้ายการติดตั้ง ขณะที่โฟลว์ repair กำลังย้ายผู้ดูแลระบบไปใช้
  `openclaw plugins registry --refresh` และ
  `openclaw doctor --fix`
- พาธ config ของ web search, web fetch และ x_search ที่ Plugin เป็นเจ้าของแบบเดิม ขณะที่ doctor กำลังย้ายไปยัง `plugins.entries.<plugin>.config`
- config ที่ผู้เขียนกำหนดใน `plugins.installs` แบบเดิม และ alias ของ load-path สำหรับ Plugin ที่บันเดิลมา ขณะที่เมทาดาทาการติดตั้งกำลังย้ายไปอยู่ใน plugin ledger ที่จัดการสถานะแบบมีระบบ

โค้ด Plugin ใหม่ควรเลือกใช้สิ่งทดแทนที่ระบุไว้ในรีจิสทรีและในคู่มือการย้ายระบบเฉพาะเรื่อง Plugin ที่มีอยู่เดิมยังสามารถใช้เส้นทาง compatibility ต่อไปได้จนกว่าเอกสาร การวินิจฉัย และบันทึกประจำรุ่นจะประกาศกรอบเวลาการนำออก

## บันทึกประจำรุ่น

บันทึกประจำรุ่นควรระบุการเลิกใช้งาน Plugin ที่กำลังจะมาถึง พร้อมวันที่เป้าหมายและลิงก์ไปยังเอกสารการย้ายระบบ ต้องมีคำเตือนดังกล่าวก่อนที่เส้นทาง compatibility จะย้ายไปเป็น `removal-pending` หรือ `removed`
