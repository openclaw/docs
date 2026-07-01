---
read_when:
    - คุณรัน clawhub package validate และต้องแก้ไขผลการตรวจพบของ Plugin
    - ClawHub ปฏิเสธหรือเตือนระหว่างการเผยแพร่แพ็กเกจ Plugin
    - คุณกำลังอัปเดตเมทาดาทาแพ็กเกจ Plugin ก่อนรีลีส
summary: แก้ไขข้อค้นพบจากการตรวจสอบความถูกต้องของแพ็กเกจ Plugin ของ ClawHub ก่อนเผยแพร่
title: การแก้ไขการตรวจสอบความถูกต้องของ Plugin
x-i18n:
    generated_at: "2026-07-01T15:33:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# การแก้ไขการตรวจสอบ Plugin

ClawHub ตรวจสอบแพ็กเกจ Plugin ก่อนเผยแพร่ และยังสามารถแสดงข้อค้นพบจาก
การสแกนแพ็กเกจอัตโนมัติได้ด้วย หน้านี้ครอบคลุมข้อค้นพบสำหรับผู้เขียน ซึ่งหมายถึง
ข้อค้นพบที่ผู้เขียน Plugin สามารถแก้ไขได้ใน metadata ของแพ็กเกจ, manifest, การนำเข้า SDK
หรือ artifact ที่เผยแพร่แล้ว

ไม่ครอบคลุมข้อค้นพบด้านความครอบคลุมภายในของ Plugin Inspector หากรายงานฉบับเต็ม
มีรหัสการบำรุงรักษาตัวสแกนโดยไม่มีคำแนะนำการแก้ไขสำหรับผู้เขียน รหัสเหล่านั้น
มีไว้สำหรับผู้ดูแล OpenClaw ไม่ใช่ผู้เขียน Plugin

หลังจากใช้การแก้ไขใด ๆ แล้ว ให้รันอีกครั้ง:

```bash
clawhub package validate <path-to-plugin>
```

## ข้อค้นพบสำหรับผู้เขียน

| รหัส                                    | เริ่มที่นี่                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [เพิ่ม metadata ของแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [เพิ่มบล็อก openclaw ของแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [ประกาศ entrypoint ของแพ็กเกจ OpenClaw](/th/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [เผยแพร่ entrypoint ที่ประกาศไว้](/th/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [เติม metadata การติดตั้งให้ครบถ้วน](/th/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [ประกาศความเข้ากันได้ของ API Plugin](/th/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [ปรับเวอร์ชัน host ขั้นต่ำให้ตรงกัน](/th/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [ปรับเวอร์ชันแพ็กเกจและ manifest ให้ตรงกัน](/th/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [ลบ metadata แพ็กเกจ OpenClaw ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [ทำให้ artifact npm สามารถ pack ได้](/th/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [รวม entrypoint ในผลลัพธ์ npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [รวม metadata ในผลลัพธ์ npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [เพิ่มชื่อแสดงผลของ manifest](/th/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [ลบฟิลด์ manifest ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [ลบคีย์ contract ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [แทนที่การนำเข้า SDK จากราก](/th/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [ลบการนำเข้า SDK ที่สงวนไว้](/th/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [แทนที่การเข้าถึง whole-session-store](/th/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [แทนที่การเขียน whole-session-store](/th/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [แทนที่ตัวช่วย path ไฟล์ session](/th/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [แทนที่เป้าหมายไฟล์ transcript แบบเดิม](/th/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [แทนที่ตัวช่วย transcript ระดับต่ำ](/th/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [แทนที่ before_agent_start](/th/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [ย้าย env vars ของ provider ไปยัง metadata การตั้งค่า](/th/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [สะท้อน env vars ของ channel ใน metadata ปัจจุบัน](/th/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [ลบการอ้างอิง schema manifest ด้านความปลอดภัยที่ไม่มีให้ใช้](/th/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [ลบไฟล์ manifest ด้านความปลอดภัยที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## metadata ของแพ็กเกจ

### package-json-missing

รากของแพ็กเกจไม่มี `package.json` ดังนั้น ClawHub จึงระบุ
แพ็กเกจ npm, เวอร์ชัน, entrypoint หรือ metadata ของ OpenClaw ไม่ได้

- เพิ่ม `package.json` พร้อม `name`, `version` และ `type`
- เพิ่มบล็อก `openclaw` เมื่อแพ็กเกจจัดส่ง Plugin ของ OpenClaw
- ใช้ [การสร้าง Plugin](/th/plugins/building-plugins) สำหรับตัวอย่างแพ็กเกจขั้นต่ำ
  และ [manifest ของ Plugin](/th/plugins/manifest#manifest-versus-packagejson)
  สำหรับการแยกหน้าที่ระหว่างแพ็กเกจกับ manifest
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-metadata-missing

แพ็กเกจมี `package.json` แต่ไม่ได้ประกาศ metadata แพ็กเกจ
OpenClaw

- เพิ่ม `package.json#openclaw`
- รวม metadata ของ entrypoint เช่น `openclaw.extensions` หรือ
  `openclaw.runtimeExtensions`
- เพิ่ม metadata ความเข้ากันได้และการติดตั้งเมื่อจะเผยแพร่แพ็กเกจหรือ
  ติดตั้งผ่าน ClawHub
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-entry-missing

มี metadata ของแพ็กเกจอยู่แล้ว แต่ไม่ได้ประกาศ entrypoint runtime
ของ OpenClaw

- เพิ่ม `openclaw.extensions` สำหรับ entrypoint ของ Plugin แบบ native
- เพิ่ม `openclaw.runtimeExtensions` เมื่อแพ็กเกจที่เผยแพร่ควรโหลด
  JavaScript ที่ build แล้ว
- เก็บ path ของ entrypoint ทั้งหมดไว้ภายในไดเรกทอรีแพ็กเกจ
- ดู [entry point ของ Plugin](/th/plugins/sdk-entrypoints) และ
  [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-entrypoint-missing

แพ็กเกจประกาศ entrypoint ของ OpenClaw แต่ไฟล์ที่อ้างอิงหายไป
จากแพ็กเกจที่กำลังตรวจสอบ

- ตรวจสอบแต่ละ path ใน `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` และ `openclaw.runtimeSetupEntry`
- build แพ็กเกจหาก entrypoint ถูกสร้างเข้าไปใน `dist`
- อัปเดต metadata หาก entrypoint ถูกย้าย
- ดู [entry point ของ Plugin](/th/plugins/sdk-entrypoints)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-install-metadata-incomplete

ClawHub ไม่สามารถบอกได้ว่าควรติดตั้งหรืออัปเดตแพ็กเกจอย่างไร

- เติม `openclaw.install` ด้วยแหล่งติดตั้งที่รองรับ เช่น
  `clawhubSpec`, `npmSpec` หรือ `localPath`
- ตั้งค่า `openclaw.install.defaultChoice` เมื่อมีแหล่งติดตั้งมากกว่าหนึ่งแหล่ง
  ให้ใช้
- ใช้ `openclaw.install.minHostVersion` สำหรับเวอร์ชัน host ขั้นต่ำของ OpenClaw
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-plugin-api-compat-missing

แพ็กเกจไม่ได้ประกาศช่วง API Plugin ของ OpenClaw ที่รองรับ

- เพิ่ม `openclaw.compat.pluginApi` ไปยัง `package.json`
- ใช้เวอร์ชัน API Plugin ของ OpenClaw หรือ semver floor ที่คุณ build และทดสอบ
  มาแล้ว
- แยกสิ่งนี้ออกจากเวอร์ชันแพ็กเกจ เวอร์ชันแพ็กเกจอธิบาย
  release ของ Plugin ส่วน `openclaw.compat.pluginApi` อธิบาย contract ของ API host
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-min-host-version-drift

เวอร์ชัน host ขั้นต่ำของแพ็กเกจไม่ตรงกับ metadata เวอร์ชัน OpenClaw
ที่ใช้ build แพ็กเกจ

- ตรวจสอบ `openclaw.install.minHostVersion`
- ตรวจสอบ metadata การ build ของ OpenClaw ใด ๆ ในแพ็กเกจ เช่น เวอร์ชัน OpenClaw
  ที่ใช้ระหว่าง release
- ปรับเวอร์ชัน host ขั้นต่ำให้ตรงกับช่วงเวอร์ชัน host ที่แพ็กเกจ
  รองรับจริง
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-manifest-version-drift

เวอร์ชันแพ็กเกจและเวอร์ชัน manifest ของ Plugin ไม่ตรงกัน

- ให้ใช้ `package.json#version` เป็นเวอร์ชัน release ของแพ็กเกจเป็นหลัก
- หาก `openclaw.plugin.json` มี `version` ด้วย ให้อัปเดตให้ตรงกันหรือลบ
  metadata เวอร์ชัน manifest ที่ล้าสมัยเมื่อ metadata ของแพ็กเกจเป็นแหล่งอ้างอิงหลัก
- เผยแพร่แพ็กเกจเวอร์ชันใหม่หลังจากเปลี่ยน metadata ที่เผยแพร่แล้ว
- ดู [manifest ของ Plugin](/th/plugins/manifest)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-unsupported-metadata

บล็อก `package.json#openclaw` มีฟิลด์ที่ไม่ใช่ metadata แพ็กเกจ
OpenClaw ที่รองรับ

- ลบฟิลด์ที่ไม่รองรับ เช่น `openclaw.bundle`
- เก็บ metadata ของ Plugin แบบ native ไว้ใน `openclaw.plugin.json`
- เก็บ entrypoint ของแพ็กเกจ, ความเข้ากันได้, การติดตั้ง, การตั้งค่า และ metadata catalog
  ไว้ในฟิลด์ `package.json#openclaw` ที่รองรับ
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## artifact ที่เผยแพร่แล้ว

### package-npm-pack-unavailable

ไม่สามารถ pack แพ็กเกจเป็น artifact ที่ ClawHub จะตรวจสอบหรือ
เผยแพร่ได้

- รัน `npm pack --dry-run` จากรากของแพ็กเกจ
- แก้ไข metadata แพ็กเกจที่ไม่ถูกต้อง, lifecycle scripts ที่เสีย หรือรายการ files ที่
  ทำให้การ pack ล้มเหลว
- ลบ `private: true` หากแพ็กเกจนี้ตั้งใจให้เผยแพร่แบบสาธารณะ
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-entrypoint-missing

แพ็กเกจสามารถ pack ได้ แต่ artifact ที่ pack แล้วไม่มีไฟล์
entrypoint ที่ประกาศไว้ใน `package.json#openclaw`

- รัน `npm pack --dry-run` และตรวจสอบไฟล์ที่จะถูกรวมไว้
- build entrypoint ที่สร้างขึ้นก่อน pack
- อัปเดต `files`, `.npmignore` หรือผลลัพธ์การ build เพื่อให้ entrypoint ที่ประกาศไว้
  ถูกรวมไว้
- ดู [entry point ของ Plugin](/th/plugins/sdk-entrypoints)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-metadata-missing

artifact ที่ pack แล้วขาด metadata ของ OpenClaw ที่มีอยู่ในแพ็กเกจ
ซอร์สของคุณ

- รัน `npm pack --dry-run` และตรวจสอบไฟล์ metadata ที่ถูกรวมไว้
- ตรวจสอบให้แน่ใจว่า `package.json` มีบล็อก `openclaw` ใน artifact ที่ pack แล้ว
- ตรวจสอบให้แน่ใจว่า `openclaw.plugin.json` ถูกรวมไว้เมื่อแพ็กเกจเป็น Plugin
  OpenClaw แบบ native
- อัปเดต `files` หรือ `.npmignore` เพื่อไม่ให้ metadata ของแพ็กเกจถูกตัดออก
- ดู [การสร้าง Plugin](/th/plugins/building-plugins)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## metadata ของ manifest

### manifest-name-missing

แมนิเฟสต์ Plugin แบบเนทีฟไม่มีชื่อที่ใช้แสดงผล

- เพิ่มฟิลด์ `name` ที่ไม่ว่างใน `openclaw.plugin.json`
- ให้ `name` อ่านเข้าใจได้สำหรับมนุษย์ และให้ `id` เป็นรหัสเครื่องที่เสถียร
- ดู [แมนิเฟสต์ Plugin](/th/plugins/manifest)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-fields

แมนิเฟสต์ Plugin มีฟิลด์ระดับบนสุดที่ OpenClaw ไม่รองรับ

- เปรียบเทียบฟิลด์ระดับบนสุดแต่ละรายการกับ
  [ข้อมูลอ้างอิงฟิลด์แมนิเฟสต์](/th/plugins/manifest#top-level-field-reference)
- นำฟิลด์แบบกำหนดเองออกจาก `openclaw.plugin.json`
- ย้ายเมตาดาต้าของแพ็กเกจหรือการติดตั้งไปไว้ในฟิลด์ `package.json#openclaw`
  ที่รองรับ แทนที่จะอยู่ในแมนิเฟสต์
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-contracts

แมนิเฟสต์ประกาศคีย์ที่ไม่รองรับภายใน `contracts`

- เปรียบเทียบแต่ละคีย์ภายใต้ `contracts` กับ
  [ข้อมูลอ้างอิง contracts](/th/plugins/manifest#contracts-reference)
- นำคีย์ contract ที่ไม่รองรับออก
- ย้ายพฤติกรรมรันไทม์ไปไว้ในโค้ดลงทะเบียน Plugin และจำกัด `contracts`
  ให้เป็นเมตาดาต้าความเป็นเจ้าของความสามารถแบบคงที่เท่านั้น
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## SDK และการย้ายความเข้ากันได้

### legacy-root-sdk-import

Plugin นำเข้าจาก root SDK barrel ที่เลิกใช้แล้ว:
`openclaw/plugin-sdk`

- แทนที่การนำเข้า root-barrel ด้วยการนำเข้า public subpath แบบเจาะจง
- ใช้ `openclaw/plugin-sdk/plugin-entry` สำหรับ `definePluginEntry`
- ใช้ `openclaw/plugin-sdk/channel-core` สำหรับตัวช่วย channel entry
- ใช้ [แนวทางการนำเข้า](/th/plugins/building-plugins#import-conventions) และ
  [Plugin SDK subpaths](/th/plugins/sdk-subpaths) เพื่อหาการนำเข้าที่แคบกว่า
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### reserved-sdk-import

Plugin นำเข้าเส้นทาง SDK ที่สงวนไว้สำหรับ Plugin แบบ bundled หรือความเข้ากันได้
ภายใน

- แทนที่การนำเข้า SDK ภายในของ OpenClaw ที่สงวนไว้ด้วย public subpath
  `openclaw/plugin-sdk/*` ที่มีเอกสารกำกับ
- หากพฤติกรรมนั้นไม่มี SDK สาธารณะ ให้เก็บตัวช่วยไว้ภายในแพ็กเกจของคุณ หรือ
  ขอ API สาธารณะของ OpenClaw
- ใช้ [Plugin SDK subpaths](/th/plugins/sdk-subpaths) และ
  [การย้าย SDK](/th/plugins/sdk-migration) เพื่อเลือกการนำเข้าที่รองรับ
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-load-session-store

Plugin ยังใช้ตัวช่วย whole-session-store ที่เลิกใช้แล้ว
`loadSessionStore`

- ใช้ `getSessionEntry(...)` หรือ `listSessionEntries(...)` เมื่ออ่านสถานะเซสชัน
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เมื่อเขียนสถานะเซสชัน
- หลีกเลี่ยงการโหลด แก้ไข และบันทึกออบเจ็กต์ session store ทั้งหมด
- เก็บ `loadSessionStore(...)` ไว้เฉพาะขณะที่ช่วงความเข้ากันได้ที่คุณประกาศ
  ยังรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้ตัวช่วยนี้
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [Plugin SDK subpaths](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-store-write

Plugin ยังใช้ตัวช่วยเขียน whole-session-store ที่เลิกใช้แล้ว เช่น
`saveSessionStore` หรือ `updateSessionStore`

- ใช้ `patchSessionEntry(...)` เมื่ออัปเดตฟิลด์ในรายการเซสชันที่มีอยู่
- ใช้ `upsertSessionEntry(...)` เมื่อแทนที่หรือสร้างรายการเซสชัน
- หลีกเลี่ยงการโหลด แก้ไข และบันทึกออบเจ็กต์ session store ทั้งหมด
- เก็บตัวช่วยเขียนทั้ง store ไว้เฉพาะขณะที่ช่วงความเข้ากันได้ที่คุณประกาศ
  ยังรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้ตัวช่วยเหล่านั้น
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [Plugin SDK subpaths](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-file-helper

Plugin ยังใช้ตัวช่วยเส้นทางไฟล์เซสชันที่เลิกใช้แล้ว เช่น
`resolveSessionFilePath` หรือ `resolveAndPersistSessionFile`

- ใช้ `getSessionEntry(...)` เพื่ออ่านเมตาดาต้าเซสชันตาม agent และตัวตนของเซสชัน
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เพื่อคงอยู่เมตาดาต้าเซสชัน
- ใช้ตัวช่วยตัวตน transcript หรือเป้าหมายเมื่อโค้ดกำลังเตรียมการดำเนินการ
  transcript
- อย่าคงอยู่หรือพึ่งพาเส้นทางไฟล์ transcript แบบเก่า
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [Plugin SDK subpaths](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-transcript-file-target

Plugin ยังใช้ตัวช่วยเป้าหมายไฟล์ transcript ที่เลิกใช้แล้ว
`resolveSessionTranscriptLegacyFileTarget`

- ใช้ `resolveSessionTranscriptIdentity(...)` เมื่อโค้ดต้องการเฉพาะตัวตนเซสชันสาธารณะ
- ใช้ `resolveSessionTranscriptTarget(...)` เมื่อโค้ดต้องการเป้าหมายการดำเนินการ
  transcript แบบมีโครงสร้าง
- หลีกเลี่ยงการอ่านหรือสร้างเป้าหมายไฟล์ transcript แบบเก่าโดยตรง
- เก็บตัวช่วยแบบเก่าไว้เฉพาะขณะที่ช่วงความเข้ากันได้ที่คุณประกาศยังรองรับ
  OpenClaw เวอร์ชันเก่าที่ต้องใช้ตัวช่วยนี้
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [Plugin SDK subpaths](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-transcript-low-level

Plugin ยังใช้ตัวช่วย transcript ระดับต่ำที่เลิกใช้แล้ว เช่น
`appendSessionTranscriptMessage` หรือ `emitSessionTranscriptUpdate`

- ใช้ `appendSessionTranscriptMessageByIdentity(...)` สำหรับการเพิ่ม transcript
- ใช้ `publishSessionTranscriptUpdateByIdentity(...)` สำหรับการแจ้งเตือนการอัปเดต
  transcript
- ควรใช้พื้นผิวรันไทม์ transcript แบบมีโครงสร้าง เพื่อให้ OpenClaw ใช้ขอบเขต
  ธุรกรรมและการจัดการตัวตนที่ถูกต้องได้
- เก็บตัวช่วย transcript ระดับต่ำไว้เฉพาะขณะที่ช่วงความเข้ากันได้ที่คุณประกาศ
  ยังรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้ตัวช่วยเหล่านั้น
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [Plugin SDK subpaths](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### legacy-before-agent-start

Plugin ยังใช้ hook แบบเก่า `before_agent_start`

- ย้ายงาน override โมเดลหรือผู้ให้บริการไปที่ `before_model_resolve`
- ย้ายงานแก้ไข prompt หรือ context ไปที่ `before_prompt_build`
- เก็บ `before_agent_start` ไว้เฉพาะขณะที่ช่วงความเข้ากันได้ที่คุณประกาศยังรองรับ
  OpenClaw เวอร์ชันเก่าที่ต้องใช้ hook นี้
- ดู [Hooks](/th/plugins/hooks) และ
  [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### provider-auth-env-vars

แมนิเฟสต์ยังใช้เมตาดาต้าการยืนยันตัวตนผู้ให้บริการแบบเก่า `providerAuthEnvVars`

- สะท้อนเมตาดาต้า env-var ของผู้ให้บริการไปยัง `setup.providers[].envVars`
- เก็บ `providerAuthEnvVars` ไว้เฉพาะเป็นเมตาดาต้าความเข้ากันได้ ขณะที่ช่วง
  OpenClaw ที่คุณรองรับยังต้องใช้
- ดู [ข้อมูลอ้างอิง setup](/th/plugins/manifest#setup-reference) และ
  [การย้าย SDK](/th/plugins/sdk-migration)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### channel-env-vars

แมนิเฟสต์ใช้เมตาดาต้า env-var ของช่องทางแบบเก่าหรือรุ่นก่อนหน้า โดยไม่มี
เมตาดาต้า setup หรือ config ปัจจุบันที่ ClawHub คาดหวัง

- ให้เมตาดาต้า env-var ของช่องทางเป็นแบบประกาศ เพื่อให้ OpenClaw ตรวจสอบสถานะ
  setup ได้โดยไม่ต้องโหลดรันไทม์ของช่องทาง
- สะท้อน setup ของช่องทางที่ขับเคลื่อนด้วย env ไปยัง setup ปัจจุบัน, config
  ช่องทาง หรือเมตาดาต้าช่องทางของแพ็กเกจที่รูปแบบ Plugin ของคุณใช้
- เก็บ `channelEnvVars` ไว้เฉพาะเป็นเมตาดาต้าความเข้ากันได้ ขณะที่ OpenClaw
  เวอร์ชันเก่าที่รองรับยังต้องใช้
- ดู [แมนิเฟสต์ Plugin](/th/plugins/manifest) และ
  [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## แมนิเฟสต์ความปลอดภัย

### security-manifest-schema-unavailable

แพ็กเกจจัดส่ง `openclaw.security.json` พร้อม schema reference ที่ ClawHub
ไม่รู้จักว่าพร้อมใช้งาน

- นำ URL ของ schema ออก หากมีไว้เพื่อคำแนะนำเท่านั้น
- ใช้ schema แบบมีเวอร์ชันที่มีเอกสารกำกับหลังจาก OpenClaw เผยแพร่แล้วเท่านั้น
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### unrecognized-security-manifest

แพ็กเกจจัดส่งไฟล์แมนิเฟสต์ความปลอดภัยที่ไม่รองรับ

- นำ `openclaw.security.json` ออก จนกว่า OpenClaw จะจัดทำเอกสาร schema
  แมนิเฟสต์ความปลอดภัยแบบมีเวอร์ชันและพฤติกรรมของ ClawHub
- เก็บพฤติกรรมที่เกี่ยวกับความปลอดภัยไว้ในเอกสารแพ็กเกจสาธารณะหรือ README
  ของคุณ จนกว่าจะมีสัญญาแมนิเฟสต์
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## ที่เกี่ยวข้อง

- [ClawHub CLI](/th/clawhub/cli)
- [การเผยแพร่ ClawHub](/th/clawhub/publishing)
- [การสร้าง plugins](/th/plugins/building-plugins)
- [แมนิเฟสต์ Plugin](/th/plugins/manifest)
- [จุดเข้าใช้งาน Plugin](/th/plugins/sdk-entrypoints)
- [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
