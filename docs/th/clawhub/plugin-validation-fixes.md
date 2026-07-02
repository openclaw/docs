---
read_when:
    - คุณรัน clawhub package validate แล้วและจำเป็นต้องแก้ไขข้อพบเจอของ Plugin
    - ClawHub ปฏิเสธหรือเตือนเมื่อเผยแพร่แพ็กเกจ Plugin
    - คุณกำลังอัปเดตข้อมูลเมตาของแพ็กเกจ Plugin ก่อนการเผยแพร่
summary: แก้ไขข้อค้นพบในการตรวจสอบแพ็กเกจ Plugin ของ ClawHub ก่อนเผยแพร่
title: การแก้ไขการตรวจสอบความถูกต้องของ Plugin
x-i18n:
    generated_at: "2026-07-02T14:13:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# การแก้ไขการตรวจสอบ Plugin

ClawHub ตรวจสอบแพ็กเกจ Plugin ก่อนเผยแพร่ และยังสามารถแสดงผลการตรวจพบจาก
การสแกนแพ็กเกจอัตโนมัติได้ด้วย หน้านี้ครอบคลุมผลการตรวจพบที่ผู้เขียนต้องแก้ไข ซึ่งหมายถึง
ผลการตรวจพบที่ผู้เขียน Plugin สามารถแก้ได้ในเมทาดาตาแพ็กเกจ, แมนิเฟสต์, การนำเข้า SDK
หรืออาร์ติแฟกต์ที่เผยแพร่ของตน

หน้านี้ไม่ครอบคลุมผลการตรวจพบความครอบคลุมภายในของ Plugin Inspector หากรายงานฉบับเต็ม
มีรหัสการบำรุงรักษาตัวสแกนโดยไม่มีคำแนะนำการแก้ไขสำหรับผู้เขียน รหัสเหล่านั้นมีไว้สำหรับ
ผู้ดูแล OpenClaw ไม่ใช่ผู้เขียน Plugin

หลังจากปรับใช้การแก้ไขใด ๆ แล้ว ให้เรียกใช้อีกครั้ง:

```bash
clawhub package validate <path-to-plugin>
```

## ผลการตรวจพบสำหรับผู้เขียน

| รหัส                                    | เริ่มที่นี่                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [เพิ่มเมทาดาตาแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [เพิ่มบล็อก openclaw ของแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [ประกาศจุดเข้าใช้งานแพ็กเกจ OpenClaw](/th/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [เผยแพร่จุดเข้าใช้งานที่ประกาศไว้](/th/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [เติมเมทาดาตาการติดตั้งให้ครบถ้วน](/th/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [ประกาศความเข้ากันได้ของ API Plugin](/th/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [จัดเวอร์ชันโฮสต์ขั้นต่ำให้ตรงกัน](/th/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [จัดเวอร์ชันแพ็กเกจและแมนิเฟสต์ให้ตรงกัน](/th/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [ลบเมทาดาตาแพ็กเกจ OpenClaw ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [ทำให้อาร์ติแฟกต์ npm สามารถแพ็กได้](/th/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [รวมจุดเข้าใช้งานในผลลัพธ์ npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [รวมเมทาดาตาในผลลัพธ์ npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [เพิ่มชื่อแสดงผลของแมนิเฟสต์](/th/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [ลบฟิลด์แมนิเฟสต์ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [ลบคีย์สัญญาที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [แทนที่การนำเข้า SDK ระดับราก](/th/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [ลบการนำเข้า SDK ที่สงวนไว้](/th/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [แทนที่การเข้าถึงคลังเซสชันทั้งชุด](/th/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [แทนที่การเขียนคลังเซสชันทั้งชุด](/th/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [แทนที่ตัวช่วยพาธไฟล์เซสชัน](/th/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [แทนที่เป้าหมายไฟล์ทรานสคริปต์แบบเดิม](/th/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [แทนที่ตัวช่วยทรานสคริปต์ระดับต่ำ](/th/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [แทนที่ before_agent_start](/th/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [ย้ายตัวแปรสภาพแวดล้อมของผู้ให้บริการไปยังเมทาดาตาการตั้งค่า](/th/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [สะท้อนตัวแปรสภาพแวดล้อมของช่องทางในเมทาดาตาปัจจุบัน](/th/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [ลบการอ้างอิงสคีมาแมนิเฟสต์ความปลอดภัยที่ใช้ไม่ได้](/th/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [ลบไฟล์แมนิเฟสต์ความปลอดภัยที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## เมทาดาตาแพ็กเกจ

### package-json-missing

รากของแพ็กเกจไม่มี `package.json` ดังนั้น ClawHub จึงไม่สามารถระบุ
แพ็กเกจ npm, เวอร์ชัน, จุดเข้าใช้งาน หรือเมทาดาตา OpenClaw ได้

- เพิ่ม `package.json` พร้อม `name`, `version` และ `type`
- เพิ่มบล็อก `openclaw` เมื่อแพ็กเกจจัดส่ง OpenClaw Plugin
- ใช้ [การสร้าง Plugin](/th/plugins/building-plugins) สำหรับตัวอย่างแพ็กเกจขั้นต่ำ
  และ [แมนิเฟสต์ Plugin](/th/plugins/manifest#manifest-versus-packagejson)
  สำหรับการแยกระหว่างแพ็กเกจกับแมนิเฟสต์
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-metadata-missing

แพ็กเกจมี `package.json` แต่ไม่ได้ประกาศเมทาดาตาแพ็กเกจ
OpenClaw

- เพิ่ม `package.json#openclaw`
- รวมเมทาดาตาจุดเข้าใช้งาน เช่น `openclaw.extensions` หรือ
  `openclaw.runtimeExtensions`
- เพิ่มเมทาดาตาความเข้ากันได้และการติดตั้งเมื่อแพ็กเกจจะถูกเผยแพร่หรือ
  ติดตั้งผ่าน ClawHub
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-entry-missing

มีเมทาดาตาแพ็กเกจอยู่แล้ว แต่ไม่ได้ประกาศจุดเข้าใช้งานรันไทม์
OpenClaw

- เพิ่ม `openclaw.extensions` สำหรับจุดเข้าใช้งาน Plugin แบบเนทีฟ
- เพิ่ม `openclaw.runtimeExtensions` เมื่อแพ็กเกจที่เผยแพร่ควรโหลด JavaScript
  ที่สร้างแล้ว
- เก็บพาธจุดเข้าใช้งานทั้งหมดไว้ภายในไดเรกทอรีแพ็กเกจ
- ดู [จุดเข้าใช้งาน Plugin](/th/plugins/sdk-entrypoints) และ
  [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-entrypoint-missing

แพ็กเกจประกาศจุดเข้าใช้งาน OpenClaw แต่ไฟล์ที่อ้างอิงหายไป
จากแพ็กเกจที่กำลังตรวจสอบ

- ตรวจสอบแต่ละพาธใน `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` และ `openclaw.runtimeSetupEntry`
- สร้างแพ็กเกจหากจุดเข้าใช้งานถูกสร้างเข้าไปใน `dist`
- อัปเดตเมทาดาตาหากจุดเข้าใช้งานถูกย้าย
- ดู [จุดเข้าใช้งาน Plugin](/th/plugins/sdk-entrypoints)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-install-metadata-incomplete

ClawHub ไม่สามารถบอกได้ว่าแพ็กเกจควรถูกติดตั้งหรืออัปเดตอย่างไร

- เติม `openclaw.install` ด้วยแหล่งติดตั้งที่รองรับ เช่น
  `clawhubSpec`, `npmSpec` หรือ `localPath`
- ตั้งค่า `openclaw.install.defaultChoice` เมื่อมีแหล่งติดตั้งมากกว่าหนึ่งแหล่ง
  ให้เลือกใช้
- ใช้ `openclaw.install.minHostVersion` สำหรับเวอร์ชันโฮสต์ OpenClaw ขั้นต่ำ
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-plugin-api-compat-missing

แพ็กเกจไม่ได้ประกาศช่วง API Plugin ของ OpenClaw ที่รองรับ

- เพิ่ม `openclaw.compat.pluginApi` ใน `package.json`
- ใช้เวอร์ชัน API Plugin ของ OpenClaw หรือค่า semver ขั้นต่ำที่คุณสร้างและทดสอบ
  ด้วย
- แยกสิ่งนี้ออกจากเวอร์ชันแพ็กเกจ เวอร์ชันแพ็กเกจอธิบาย
  การเผยแพร่ Plugin; `openclaw.compat.pluginApi` อธิบายสัญญา API ของโฮสต์
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-min-host-version-drift

เวอร์ชันโฮสต์ขั้นต่ำของแพ็กเกจไม่ตรงกับเมทาดาตาเวอร์ชัน OpenClaw
ที่ใช้สร้างแพ็กเกจ

- ตรวจสอบ `openclaw.install.minHostVersion`
- ตรวจสอบเมทาดาตาการสร้าง OpenClaw ใด ๆ ในแพ็กเกจ เช่น เวอร์ชัน OpenClaw
  ที่ใช้ระหว่างการเผยแพร่
- จัดเวอร์ชันโฮสต์ขั้นต่ำให้ตรงกับช่วงเวอร์ชันโฮสต์ที่แพ็กเกจ
  รองรับจริง
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-manifest-version-drift

เวอร์ชันแพ็กเกจและเวอร์ชันแมนิเฟสต์ Plugin ไม่ตรงกัน

- แนะนำให้ใช้ `package.json#version` เป็นเวอร์ชันเผยแพร่แพ็กเกจ
- หาก `openclaw.plugin.json` มี `version` ด้วย ให้อัปเดตให้ตรงกันหรือลบ
  เมทาดาตาเวอร์ชันแมนิเฟสต์ที่ล้าสมัยเมื่อเมทาดาตาแพ็กเกจเป็นแหล่งอ้างอิงหลัก
- เผยแพร่แพ็กเกจเวอร์ชันใหม่หลังจากเปลี่ยนเมทาดาตาที่เผยแพร่แล้ว
- ดู [แมนิเฟสต์ Plugin](/th/plugins/manifest)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-unsupported-metadata

บล็อก `package.json#openclaw` มีฟิลด์ที่ไม่รองรับ
เป็นเมทาดาตาแพ็กเกจ OpenClaw

- ลบฟิลด์ที่ไม่รองรับ เช่น `openclaw.bundle`
- เก็บเมทาดาตา Plugin แบบเนทีฟไว้ใน `openclaw.plugin.json`
- เก็บเมทาดาตาจุดเข้าใช้งานแพ็กเกจ, ความเข้ากันได้, การติดตั้ง, การตั้งค่า และแคตตาล็อก
  ไว้ในฟิลด์ `package.json#openclaw` ที่รองรับ
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## อาร์ติแฟกต์ที่เผยแพร่

### package-npm-pack-unavailable

แพ็กเกจไม่สามารถถูกแพ็กเป็นอาร์ติแฟกต์ที่ ClawHub จะตรวจสอบหรือ
เผยแพร่ได้

- เรียกใช้ `npm pack --dry-run` จากรากของแพ็กเกจ
- แก้ไขเมทาดาตาแพ็กเกจที่ไม่ถูกต้อง, สคริปต์วงจรชีวิตที่เสียหาย หรือรายการไฟล์ที่
  ทำให้การแพ็กล้มเหลว
- ลบ `private: true` หากแพ็กเกจนี้ตั้งใจให้เผยแพร่สู่สาธารณะ
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-entrypoint-missing

แพ็กเกจสามารถแพ็กได้ แต่อาร์ติแฟกต์ที่แพ็กแล้วไม่มี
ไฟล์จุดเข้าใช้งานที่ประกาศไว้ใน `package.json#openclaw`

- เรียกใช้ `npm pack --dry-run` และตรวจสอบไฟล์ที่จะถูกรวมไว้
- สร้างจุดเข้าใช้งานที่สร้างขึ้นก่อนการแพ็ก
- อัปเดต `files`, `.npmignore` หรือผลลัพธ์การสร้าง เพื่อให้จุดเข้าใช้งานที่ประกาศไว้
  ถูกรวมอยู่ด้วย
- ดู [จุดเข้าใช้งาน Plugin](/th/plugins/sdk-entrypoints)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-metadata-missing

อาร์ติแฟกต์ที่แพ็กแล้วขาดเมทาดาตา OpenClaw ที่มีอยู่ในแพ็กเกจ
ต้นทางของคุณ

- เรียกใช้ `npm pack --dry-run` และตรวจสอบไฟล์เมทาดาตาที่ถูกรวมไว้
- ตรวจสอบให้แน่ใจว่า `package.json` มีบล็อก `openclaw` ในอาร์ติแฟกต์ที่แพ็กแล้ว
- ตรวจสอบให้แน่ใจว่า `openclaw.plugin.json` ถูกรวมไว้เมื่อแพ็กเกจเป็น
  OpenClaw Plugin แบบเนทีฟ
- อัปเดต `files` หรือ `.npmignore` เพื่อไม่ให้เมทาดาตาแพ็กเกจถูกแยกออก
- ดู [การสร้าง Plugin](/th/plugins/building-plugins)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## เมทาดาตาแมนิเฟสต์

### manifest-name-missing

manifest ของ Plugin แบบเนทีฟไม่มีชื่อที่ใช้แสดงผล

- เพิ่มฟิลด์ `name` ที่ไม่ว่างใน `openclaw.plugin.json`
- ให้ `name` อ่านเข้าใจได้สำหรับมนุษย์ และให้ `id` เป็นรหัสเครื่องที่เสถียร
- ดู [manifest ของ Plugin](/th/plugins/manifest)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-fields

manifest ของ Plugin มีฟิลด์ระดับบนสุดที่ OpenClaw ไม่รองรับ

- เปรียบเทียบฟิลด์ระดับบนสุดแต่ละรายการกับ
  [เอกสารอ้างอิงฟิลด์ของ manifest](/th/plugins/manifest#top-level-field-reference)
- นำฟิลด์กำหนดเองออกจาก `openclaw.plugin.json`
- ย้าย metadata ของแพ็กเกจหรือการติดตั้งไปไว้ในฟิลด์ `package.json#openclaw` ที่รองรับ
  แทน manifest
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-contracts

manifest ประกาศคีย์ที่ไม่รองรับภายใน `contracts`

- เปรียบเทียบคีย์แต่ละรายการภายใต้ `contracts` กับ
  [เอกสารอ้างอิง contracts](/th/plugins/manifest#contracts-reference)
- นำคีย์ contract ที่ไม่รองรับออก
- ย้ายพฤติกรรม runtime ไปไว้ในโค้ดการลงทะเบียน Plugin และจำกัด `contracts`
  ให้เหลือเฉพาะ metadata การเป็นเจ้าของ capability แบบคงที่
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## SDK และการย้ายเพื่อความเข้ากันได้

### legacy-root-sdk-import

Plugin import จาก root SDK barrel ที่เลิกใช้แล้ว:
`openclaw/plugin-sdk`.

- แทนที่ root-barrel imports ด้วย public subpath imports ที่เจาะจง
- ใช้ `openclaw/plugin-sdk/plugin-entry` สำหรับ `definePluginEntry`
- ใช้ `openclaw/plugin-sdk/channel-core` สำหรับตัวช่วย channel entry
- ใช้ [แนวทางการ import](/th/plugins/building-plugins#import-conventions) และ
  [subpaths ของ Plugin SDK](/th/plugins/sdk-subpaths) เพื่อหา import ที่แคบลง
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### reserved-sdk-import

Plugin import เส้นทาง SDK ที่สงวนไว้สำหรับ Plugin ที่ bundled มาด้วยหรือความเข้ากันได้ภายใน

- แทนที่ OpenClaw internal SDK imports ที่สงวนไว้ด้วย public
  `openclaw/plugin-sdk/*` subpaths ที่มีเอกสารกำกับ
- หากพฤติกรรมนั้นไม่มี SDK สาธารณะ ให้เก็บตัวช่วยไว้ภายในแพ็กเกจของคุณ หรือ
  ขอ OpenClaw API สาธารณะ
- ใช้ [subpaths ของ Plugin SDK](/th/plugins/sdk-subpaths) และ
  [การย้าย SDK](/th/plugins/sdk-migration) เพื่อเลือก import ที่รองรับ
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-load-session-store

Plugin ยังใช้ตัวช่วย whole-session-store ที่เลิกใช้แล้ว
`loadSessionStore`

- ใช้ `getSessionEntry(...)` หรือ `listSessionEntries(...)` เมื่ออ่านสถานะ session
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เมื่อเขียนสถานะ session
- หลีกเลี่ยงการโหลด แก้ไข และบันทึกอ็อบเจกต์ session store ทั้งหมด
- เก็บ `loadSessionStore(...)` ไว้เฉพาะระหว่างที่ช่วงความเข้ากันได้ที่คุณประกาศ
  ยังรองรับ OpenClaw รุ่นเก่าที่ต้องใช้มัน
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [subpaths ของ Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-store-write

Plugin ยังใช้ตัวช่วยเขียน whole-session-store ที่เลิกใช้แล้ว เช่น
`saveSessionStore` หรือ `updateSessionStore`

- ใช้ `patchSessionEntry(...)` เมื่ออัปเดตฟิลด์บน session
  entry ที่มีอยู่
- ใช้ `upsertSessionEntry(...)` เมื่อแทนที่หรือสร้าง session entry
- หลีกเลี่ยงการโหลด แก้ไข และบันทึกอ็อบเจกต์ session store ทั้งหมด
- เก็บตัวช่วยเขียน whole-store ไว้เฉพาะระหว่างที่ช่วงความเข้ากันได้ที่คุณประกาศ
  ยังรองรับ OpenClaw รุ่นเก่าที่ต้องใช้มัน
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [subpaths ของ Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-file-helper

Plugin ยังใช้ตัวช่วย file-path ของ session ที่เลิกใช้แล้ว เช่น
`resolveSessionFilePath` หรือ `resolveAndPersistSessionFile`

- ใช้ `getSessionEntry(...)` เพื่ออ่าน metadata ของ session ตาม agent และ session
  identity
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เพื่อ persist metadata ของ session
- ใช้ transcript identity หรือตัวช่วย target เมื่อโค้ดกำลังเตรียมการดำเนินการ
  transcript
- อย่า persist หรือพึ่งพา file paths ของ transcript แบบเดิม
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [subpaths ของ Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-transcript-file-target

Plugin ยังใช้ตัวช่วย target ของไฟล์ transcript ที่เลิกใช้แล้ว
`resolveSessionTranscriptLegacyFileTarget`

- ใช้ `resolveSessionTranscriptIdentity(...)` เมื่อโค้ดต้องการเพียง session identity
  สาธารณะ
- ใช้ `resolveSessionTranscriptTarget(...)` เมื่อโค้ดต้องการ target การดำเนินการ
  transcript แบบมีโครงสร้าง
- หลีกเลี่ยงการอ่านหรือสร้าง target ของไฟล์ transcript แบบเดิมโดยตรง
- เก็บตัวช่วยแบบเดิมไว้เฉพาะระหว่างที่ช่วงความเข้ากันได้ที่คุณประกาศยัง
  รองรับ OpenClaw รุ่นเก่าที่ต้องใช้มัน
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [subpaths ของ Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-transcript-low-level

Plugin ยังใช้ตัวช่วย transcript ระดับต่ำที่เลิกใช้แล้ว เช่น
`appendSessionTranscriptMessage` หรือ `emitSessionTranscriptUpdate`

- ใช้ `appendSessionTranscriptMessageByIdentity(...)` สำหรับการ append transcript
- ใช้ `publishSessionTranscriptUpdateByIdentity(...)` สำหรับการแจ้งเตือนการอัปเดต transcript
- ควรใช้พื้นผิว runtime ของ transcript แบบมีโครงสร้าง เพื่อให้ OpenClaw ใช้
  ขอบเขต transaction และการจัดการ identity ที่ถูกต้องได้
- เก็บตัวช่วย transcript ระดับต่ำไว้เฉพาะระหว่างที่ช่วงความเข้ากันได้ที่คุณประกาศ
  ยังรองรับ OpenClaw รุ่นเก่าที่ต้องใช้มัน
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [subpaths ของ Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### legacy-before-agent-start

Plugin ยังใช้ hook `before_agent_start` แบบเดิม

- ย้ายงาน override model หรือ provider ไปที่ `before_model_resolve`
- ย้ายงานแก้ไข prompt หรือ context ไปที่ `before_prompt_build`
- เก็บ `before_agent_start` ไว้เฉพาะระหว่างที่ช่วงความเข้ากันได้ที่คุณประกาศยัง
  รองรับ OpenClaw รุ่นเก่าที่ต้องใช้มัน
- ดู [Hooks](/th/plugins/hooks) และ
  [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### provider-auth-env-vars

manifest ยังใช้ metadata auth ของ provider แบบเดิม `providerAuthEnvVars`

- mirror metadata env-var ของ provider ไปยัง `setup.providers[].envVars`
- เก็บ `providerAuthEnvVars` ไว้เป็น metadata สำหรับความเข้ากันได้เท่านั้น ตราบใดที่ช่วง
  OpenClaw ที่คุณรองรับยังต้องใช้มัน
- ดู [เอกสารอ้างอิง setup](/th/plugins/manifest#setup-reference) และ
  [การย้าย SDK](/th/plugins/sdk-migration)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### channel-env-vars

manifest ใช้ metadata env-var ของ channel แบบเดิมหรือเก่า โดยไม่มี
metadata setup หรือ config ปัจจุบันที่ ClawHub คาดหวัง

- เก็บ metadata env-var ของ channel ให้เป็นแบบ declarative เพื่อให้ OpenClaw ตรวจสอบสถานะ setup
  ได้โดยไม่ต้องโหลด runtime ของ channel
- mirror setup ของ channel ที่ขับเคลื่อนด้วย env ไปยัง setup ปัจจุบัน, config ของ channel หรือ
  metadata channel ของแพ็กเกจที่ Plugin รูปแบบของคุณใช้
- เก็บ `channelEnvVars` ไว้เป็น metadata สำหรับความเข้ากันได้เท่านั้น ตราบใดที่ OpenClaw
  รุ่นเก่าที่รองรับยังต้องใช้มัน
- ดู [manifest ของ Plugin](/th/plugins/manifest) และ
  [Channel plugins](/th/plugins/sdk-channel-plugins)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## manifest ด้านความปลอดภัย

### security-manifest-schema-unavailable

แพ็กเกจส่ง `openclaw.security.json` มาพร้อม schema reference ที่ ClawHub
ไม่รู้จักว่าใช้งานได้

- นำ schema URL ออกหากเป็นเพียงคำแนะนำ
- ใช้ schema แบบมีเวอร์ชันที่มีเอกสารกำกับหลังจาก OpenClaw เผยแพร่แล้วเท่านั้น
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### unrecognized-security-manifest

แพ็กเกจส่งไฟล์ manifest ด้านความปลอดภัยที่ไม่รองรับมาด้วย

- นำ `openclaw.security.json` ออกจนกว่า OpenClaw จะจัดทำเอกสาร schema ของ manifest
  ด้านความปลอดภัยแบบมีเวอร์ชันและพฤติกรรมของ ClawHub
- เก็บพฤติกรรมที่ไวต่อความปลอดภัยไว้ในเอกสารแพ็กเกจสาธารณะหรือ
  README ของคุณจนกว่า contract ของ manifest จะมีอยู่
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## ที่เกี่ยวข้อง

- [ClawHub CLI](/th/clawhub/cli)
- [การเผยแพร่ผ่าน ClawHub](/th/clawhub/publishing)
- [การสร้าง plugins](/th/plugins/building-plugins)
- [manifest ของ Plugin](/th/plugins/manifest)
- [entry points ของ Plugin](/th/plugins/sdk-entrypoints)
- [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
