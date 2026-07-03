---
read_when:
    - คุณรัน clawhub package validate และต้องแก้ไขผลการตรวจพบของ Plugin
    - ClawHub ปฏิเสธหรือเตือนในการเผยแพร่แพ็กเกจ Plugin
    - คุณกำลังอัปเดตข้อมูลเมตาของแพ็กเกจ Plugin ก่อนการเผยแพร่
summary: แก้ไขผลการตรวจสอบความถูกต้องของแพ็กเกจ Plugin ของ ClawHub ก่อนเผยแพร่
title: การแก้ไขการตรวจสอบความถูกต้องของ Plugin
x-i18n:
    generated_at: "2026-07-03T02:57:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# การแก้ไขการตรวจสอบ Plugin

ClawHub ตรวจสอบความถูกต้องของแพ็กเกจ Plugin ก่อนเผยแพร่ และยังสามารถแสดงข้อค้นพบจาก
การสแกนแพ็กเกจอัตโนมัติได้ด้วย หน้านี้ครอบคลุมข้อค้นพบที่เกี่ยวกับผู้เขียน ซึ่งหมายถึง
ข้อค้นพบที่ผู้เขียน Plugin สามารถแก้ไขได้ในเมทาดาทาของแพ็กเกจ, manifest, การ import SDK
หรือ artifact ที่เผยแพร่ของตน

หน้านี้ไม่ครอบคลุมข้อค้นพบด้านความครอบคลุมภายในของ Plugin Inspector หากรายงานฉบับเต็ม
มีรหัสการบำรุงรักษาตัวสแกนโดยไม่มีคำแนะนำการแก้ไขสำหรับผู้เขียน รหัสเหล่านั้นมีไว้สำหรับ
ผู้ดูแล OpenClaw ไม่ใช่ผู้เขียน Plugin

หลังจากใช้การแก้ไขใดๆ แล้ว ให้รันอีกครั้ง:

```bash
clawhub package validate <path-to-plugin>
```

## ข้อค้นพบสำหรับผู้เขียน

| รหัส                                    | เริ่มที่นี่                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [เพิ่มเมทาดาทาแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [เพิ่มบล็อก openclaw ของแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [ประกาศ entrypoint ของแพ็กเกจ OpenClaw](/th/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [เผยแพร่ entrypoint ที่ประกาศไว้](/th/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [เติมเมทาดาทาการติดตั้งให้ครบถ้วน](/th/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [ประกาศความเข้ากันได้ของ API Plugin](/th/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [จัดเวอร์ชันโฮสต์ขั้นต่ำให้ตรงกัน](/th/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [จัดเวอร์ชันแพ็กเกจและ manifest ให้ตรงกัน](/th/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [ลบเมทาดาทาแพ็กเกจ OpenClaw ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [ทำให้ artifact ของ npm สามารถแพ็กได้](/th/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [รวม entrypoint ไว้ในเอาต์พุต npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [รวมเมทาดาทาไว้ในเอาต์พุต npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [เพิ่มชื่อแสดงผลของ manifest](/th/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [ลบฟิลด์ manifest ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [ลบคีย์ contract ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [แทนที่การ import SDK จาก root](/th/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [ลบการ import SDK ที่สงวนไว้](/th/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [แทนที่การเข้าถึง whole-session-store](/th/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [แทนที่การเขียน whole-session-store](/th/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [แทนที่ helper พาธไฟล์เซสชัน](/th/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [แทนที่เป้าหมายไฟล์ transcript แบบ legacy](/th/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [แทนที่ helper transcript ระดับต่ำ](/th/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [แทนที่ before_agent_start](/th/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [ย้าย env var ของ provider ไปยังเมทาดาทา setup](/th/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [สะท้อน env var ของ channel ในเมทาดาทาปัจจุบัน](/th/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [ลบการอ้างอิง schema ของ security manifest ที่ไม่มีให้ใช้](/th/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [ลบไฟล์ security manifest ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## เมทาดาทาแพ็กเกจ

### package-json-missing

root ของแพ็กเกจไม่มี `package.json` ดังนั้น ClawHub จึงระบุแพ็กเกจ
npm, เวอร์ชัน, entrypoint หรือเมทาดาทา OpenClaw ไม่ได้

- เพิ่ม `package.json` พร้อม `name`, `version` และ `type`
- เพิ่มบล็อก `openclaw` เมื่อแพ็กเกจจัดส่ง Plugin ของ OpenClaw
- ใช้ [การสร้าง Plugin](/th/plugins/building-plugins) สำหรับตัวอย่างแพ็กเกจขั้นต่ำ
  และ [Plugin manifest](/th/plugins/manifest#manifest-versus-packagejson)
  สำหรับการแยกแพ็กเกจกับ manifest
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-metadata-missing

แพ็กเกจมี `package.json` แต่ไม่ได้ประกาศเมทาดาทาแพ็กเกจ
OpenClaw

- เพิ่ม `package.json#openclaw`
- รวมเมทาดาทา entrypoint เช่น `openclaw.extensions` หรือ
  `openclaw.runtimeExtensions`
- เพิ่มเมทาดาทาความเข้ากันได้และการติดตั้งเมื่อแพ็กเกจจะถูกเผยแพร่หรือ
  ติดตั้งผ่าน ClawHub
- ดู [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-entry-missing

มีเมทาดาทาแพ็กเกจอยู่ แต่ไม่ได้ประกาศ entrypoint รันไทม์ของ
OpenClaw

- เพิ่ม `openclaw.extensions` สำหรับ entrypoint ของ Plugin แบบ native
- เพิ่ม `openclaw.runtimeExtensions` เมื่อแพ็กเกจที่เผยแพร่ควรโหลด JavaScript
  ที่ build แล้ว
- เก็บพาธ entrypoint ทั้งหมดไว้ภายในไดเรกทอรีแพ็กเกจ
- ดู [จุดเข้า Plugin](/th/plugins/sdk-entrypoints) และ
  [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-entrypoint-missing

แพ็กเกจประกาศ entrypoint ของ OpenClaw แต่ไฟล์ที่อ้างถึงหายไป
จากแพ็กเกจที่กำลังตรวจสอบ

- ตรวจสอบแต่ละพาธใน `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` และ `openclaw.runtimeSetupEntry`
- build แพ็กเกจหาก entrypoint ถูกสร้างลงใน `dist`
- อัปเดตเมทาดาทาหาก entrypoint ถูกย้าย
- ดู [จุดเข้า Plugin](/th/plugins/sdk-entrypoints)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-install-metadata-incomplete

ClawHub ไม่สามารถบอกได้ว่าควรติดตั้งหรืออัปเดตแพ็กเกจอย่างไร

- เติม `openclaw.install` ด้วยแหล่งติดตั้งที่รองรับ เช่น
  `clawhubSpec`, `npmSpec` หรือ `localPath`
- ตั้งค่า `openclaw.install.defaultChoice` เมื่อมีแหล่งติดตั้งมากกว่าหนึ่งแหล่ง
  ให้ใช้
- ใช้ `openclaw.install.minHostVersion` สำหรับเวอร์ชันโฮสต์ OpenClaw ขั้นต่ำ
- ดู [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-plugin-api-compat-missing

แพ็กเกจไม่ได้ประกาศช่วง API ของ Plugin OpenClaw ที่รองรับ

- เพิ่ม `openclaw.compat.pluginApi` ลงใน `package.json`
- ใช้เวอร์ชัน API ของ Plugin OpenClaw หรือ semver floor ที่คุณ build และทดสอบ
  เทียบไว้
- แยกค่านี้ออกจากเวอร์ชันแพ็กเกจ เวอร์ชันแพ็กเกจอธิบาย
  release ของ Plugin; `openclaw.compat.pluginApi` อธิบาย contract ของ API โฮสต์
- ดู [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-min-host-version-drift

เวอร์ชันโฮสต์ขั้นต่ำของแพ็กเกจไม่ตรงกับเมทาดาทาเวอร์ชัน OpenClaw
ที่ใช้ build แพ็กเกจ

- ตรวจสอบ `openclaw.install.minHostVersion`
- ตรวจสอบเมทาดาทา build ของ OpenClaw ในแพ็กเกจ เช่น เวอร์ชัน OpenClaw
  ที่ใช้ระหว่าง release
- จัดเวอร์ชันโฮสต์ขั้นต่ำให้ตรงกับช่วงเวอร์ชันโฮสต์ที่แพ็กเกจ
  รองรับจริง
- ดู [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-manifest-version-drift

เวอร์ชันแพ็กเกจและเวอร์ชัน Plugin manifest ไม่ตรงกัน

- ควรใช้ `package.json#version` เป็นเวอร์ชัน release ของแพ็กเกจ
- หาก `openclaw.plugin.json` มี `version` ด้วย ให้อัปเดตให้ตรงกันหรือลบ
  เมทาดาทาเวอร์ชัน manifest ที่ล้าสมัยเมื่อเมทาดาทาแพ็กเกจเป็นแหล่งอ้างอิงหลัก
- เผยแพร่เวอร์ชันแพ็กเกจใหม่หลังจากเปลี่ยนเมทาดาทาที่เผยแพร่แล้ว
- ดู [Plugin manifest](/th/plugins/manifest)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-unsupported-metadata

บล็อก `package.json#openclaw` มีฟิลด์ที่ไม่รองรับ
ในฐานะเมทาดาทาแพ็กเกจ OpenClaw

- ลบฟิลด์ที่ไม่รองรับ เช่น `openclaw.bundle`
- เก็บเมทาดาทา Plugin แบบ native ไว้ใน `openclaw.plugin.json`
- เก็บ entrypoint ของแพ็กเกจ, ความเข้ากันได้, การติดตั้ง, setup และเมทาดาทา catalog
  ไว้ในฟิลด์ `package.json#openclaw` ที่รองรับ
- ดู [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## Artifact ที่เผยแพร่

### package-npm-pack-unavailable

ไม่สามารถแพ็กแพ็กเกจเป็น artifact ที่ ClawHub จะตรวจสอบหรือ
เผยแพร่ได้

- รัน `npm pack --dry-run` จาก root ของแพ็กเกจ
- แก้เมทาดาทาแพ็กเกจที่ไม่ถูกต้อง, lifecycle script ที่เสีย หรือรายการ files ที่
  ทำให้การแพ็กล้มเหลว
- ลบ `private: true` หากแพ็กเกจนี้ตั้งใจให้เผยแพร่สู่สาธารณะ
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-entrypoint-missing

แพ็กเกจสามารถแพ็กได้ แต่ artifact ที่แพ็กแล้วไม่มีไฟล์
entrypoint ที่ประกาศไว้ใน `package.json#openclaw`

- รัน `npm pack --dry-run` และตรวจสอบไฟล์ที่จะถูกรวมไว้
- build entrypoint ที่สร้างขึ้นก่อนแพ็ก
- อัปเดต `files`, `.npmignore` หรือเอาต์พุต build เพื่อให้ entrypoint ที่ประกาศไว้
  ถูกรวมไว้
- ดู [จุดเข้า Plugin](/th/plugins/sdk-entrypoints)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-metadata-missing

artifact ที่แพ็กแล้วขาดเมทาดาทา OpenClaw ที่มีอยู่ในแพ็กเกจ
ซอร์สของคุณ

- รัน `npm pack --dry-run` และตรวจสอบไฟล์เมทาดาทาที่รวมไว้
- ตรวจให้แน่ใจว่า `package.json` มีบล็อก `openclaw` ใน artifact ที่แพ็กแล้ว
- ตรวจให้แน่ใจว่า `openclaw.plugin.json` ถูกรวมไว้เมื่อแพ็กเกจเป็น Plugin
  OpenClaw แบบ native
- อัปเดต `files` หรือ `.npmignore` เพื่อไม่ให้เมทาดาทาแพ็กเกจถูกยกเว้น
- ดู [การสร้าง Plugin](/th/plugins/building-plugins)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## เมทาดาทา Manifest

### manifest-name-missing

รายการกำกับ Plugin แบบเนทีฟไม่มีชื่อที่ใช้แสดงผล

- เพิ่มฟิลด์ `name` ที่ไม่ว่างลงใน `openclaw.plugin.json`
- ให้ `name` อ่านเข้าใจได้สำหรับมนุษย์ และให้ `id` เป็นรหัสเครื่องที่เสถียร
- ดู [รายการกำกับ Plugin](/th/plugins/manifest)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-fields

รายการกำกับ Plugin มีฟิลด์ระดับบนสุดที่ OpenClaw ไม่รองรับ

- เปรียบเทียบฟิลด์ระดับบนสุดแต่ละฟิลด์กับ
  [เอกสารอ้างอิงฟิลด์รายการกำกับ](/th/plugins/manifest#top-level-field-reference)
- ลบฟิลด์แบบกำหนดเองออกจาก `openclaw.plugin.json`
- ย้ายเมทาดาทาของแพ็กเกจหรือการติดตั้งไปไว้ในฟิลด์ `package.json#openclaw`
  ที่รองรับแทนรายการกำกับ
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-contracts

รายการกำกับประกาศคีย์ที่ไม่รองรับไว้ภายใน `contracts`

- เปรียบเทียบแต่ละคีย์ภายใต้ `contracts` กับ
  [เอกสารอ้างอิง contracts](/th/plugins/manifest#contracts-reference)
- ลบคีย์ contract ที่ไม่รองรับ
- ย้ายพฤติกรรมรันไทม์ไปไว้ในโค้ดลงทะเบียน Plugin และจำกัด `contracts`
  ให้มีเฉพาะเมทาดาทาความเป็นเจ้าของความสามารถแบบสแตติก
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## SDK และการย้ายความเข้ากันได้

### legacy-root-sdk-import

Plugin นำเข้าจากแบร์เรล SDK รากที่เลิกใช้แล้ว:
`openclaw/plugin-sdk`

- แทนที่การนำเข้าจากแบร์เรลรากด้วยการนำเข้าซับพาธสาธารณะแบบเจาะจง
- ใช้ `openclaw/plugin-sdk/plugin-entry` สำหรับ `definePluginEntry`
- ใช้ `openclaw/plugin-sdk/channel-core` สำหรับตัวช่วยจุดเข้า channel
- ใช้ [แนวทางการนำเข้า](/th/plugins/building-plugins#import-conventions) และ
  [ซับพาธ Plugin SDK](/th/plugins/sdk-subpaths) เพื่อหาการนำเข้าที่แคบลง
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### reserved-sdk-import

Plugin นำเข้าพาธ SDK ที่สงวนไว้สำหรับ Plugin แบบบันเดิลหรือความเข้ากันได้ภายใน

- แทนที่การนำเข้า SDK ภายในของ OpenClaw ที่สงวนไว้ด้วยซับพาธ
  `openclaw/plugin-sdk/*` สาธารณะที่มีเอกสารกำกับ
- หากพฤติกรรมนั้นไม่มี SDK สาธารณะ ให้เก็บตัวช่วยไว้ภายในแพ็กเกจของคุณ หรือ
  ขอ API สาธารณะของ OpenClaw
- ใช้ [ซับพาธ Plugin SDK](/th/plugins/sdk-subpaths) และ
  [การย้าย SDK](/th/plugins/sdk-migration) เพื่อเลือกการนำเข้าที่รองรับ
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-load-session-store

Plugin ยังใช้ตัวช่วยทั้ง session store ที่เลิกใช้แล้ว
`loadSessionStore`

- ใช้ `getSessionEntry(...)` หรือ `listSessionEntries(...)` เมื่ออ่านสถานะ session
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เมื่อเขียนสถานะ session
- หลีกเลี่ยงการโหลด แก้ไข และบันทึกออบเจ็กต์ session store ทั้งหมด
- เก็บ `loadSessionStore(...)` ไว้เฉพาะในช่วงที่ช่วงความเข้ากันได้ที่คุณประกาศ
  ยังรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้ตัวช่วยนี้
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [ซับพาธ Plugin SDK](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-store-write

Plugin ยังใช้ตัวช่วยเขียนทั้ง session store ที่เลิกใช้แล้ว เช่น
`saveSessionStore` หรือ `updateSessionStore`

- ใช้ `patchSessionEntry(...)` เมื่ออัปเดตฟิลด์ใน session entry ที่มีอยู่
- ใช้ `upsertSessionEntry(...)` เมื่อแทนที่หรือสร้าง session entry
- หลีกเลี่ยงการโหลด แก้ไข และบันทึกออบเจ็กต์ session store ทั้งหมด
- เก็บตัวช่วยเขียนทั้ง store ไว้เฉพาะในช่วงที่ช่วงความเข้ากันได้ที่คุณประกาศ
  ยังรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้ตัวช่วยเหล่านี้
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [ซับพาธ Plugin SDK](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-file-helper

Plugin ยังใช้ตัวช่วยพาธไฟล์ session ที่เลิกใช้แล้ว เช่น
`resolveSessionFilePath` หรือ `resolveAndPersistSessionFile`

- ใช้ `getSessionEntry(...)` เพื่ออ่านเมทาดาทา session ตาม agent และตัวตนของ session
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เพื่อคงอยู่เมทาดาทา session
- ใช้ตัวช่วยตัวตน transcript หรือ target เมื่อโค้ดกำลังเตรียมการดำเนินการ transcript
- อย่าคงอยู่หรือพึ่งพาพาธไฟล์ transcript แบบเก่า
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [ซับพาธ Plugin SDK](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-transcript-file-target

Plugin ยังใช้ตัวช่วย target ไฟล์ transcript ที่เลิกใช้แล้ว
`resolveSessionTranscriptLegacyFileTarget`

- ใช้ `resolveSessionTranscriptIdentity(...)` เมื่อโค้ดต้องการเฉพาะตัวตน session สาธารณะ
- ใช้ `resolveSessionTranscriptTarget(...)` เมื่อโค้ดต้องการ target การดำเนินการ transcript แบบมีโครงสร้าง
- หลีกเลี่ยงการอ่านหรือสร้าง target ไฟล์ transcript แบบเก่าโดยตรง
- เก็บตัวช่วยเก่าไว้เฉพาะในช่วงที่ช่วงความเข้ากันได้ที่คุณประกาศยังรองรับ
  OpenClaw เวอร์ชันเก่าที่ต้องใช้ตัวช่วยนี้
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [ซับพาธ Plugin SDK](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-transcript-low-level

Plugin ยังใช้ตัวช่วย transcript ระดับต่ำที่เลิกใช้แล้ว เช่น
`appendSessionTranscriptMessage` หรือ `emitSessionTranscriptUpdate`

- ใช้ `appendSessionTranscriptMessageByIdentity(...)` สำหรับการเพิ่มต่อท้าย transcript
- ใช้ `publishSessionTranscriptUpdateByIdentity(...)` สำหรับการแจ้งเตือนการอัปเดต transcript
- ควรใช้พื้นผิวรันไทม์ transcript แบบมีโครงสร้าง เพื่อให้ OpenClaw ใช้ขอบเขตธุรกรรมและการจัดการตัวตนที่ถูกต้องได้
- เก็บตัวช่วย transcript ระดับต่ำไว้เฉพาะในช่วงที่ช่วงความเข้ากันได้ที่คุณประกาศ
  ยังรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้ตัวช่วยเหล่านี้
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [ซับพาธ Plugin SDK](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### legacy-before-agent-start

Plugin ยังใช้ hook เก่า `before_agent_start`

- ย้ายงาน override model หรือ provider ไปที่ `before_model_resolve`
- ย้ายงานแก้ไข prompt หรือ context ไปที่ `before_prompt_build`
- เก็บ `before_agent_start` ไว้เฉพาะในช่วงที่ช่วงความเข้ากันได้ที่คุณประกาศยังรองรับ
  OpenClaw เวอร์ชันเก่าที่ต้องใช้ hook นี้
- ดู [Hooks](/th/plugins/hooks) และ
  [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### provider-auth-env-vars

รายการกำกับยังใช้เมทาดาทาการยืนยันตัวตน provider แบบเก่า `providerAuthEnvVars`

- สะท้อนเมทาดาทา env-var ของ provider ไปยัง `setup.providers[].envVars`
- เก็บ `providerAuthEnvVars` ไว้เฉพาะเป็นเมทาดาทาความเข้ากันได้ในช่วงที่ช่วง
  OpenClaw ที่คุณรองรับยังต้องใช้
- ดู [เอกสารอ้างอิง setup](/th/plugins/manifest#setup-reference) และ
  [การย้าย SDK](/th/plugins/sdk-migration)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### channel-env-vars

รายการกำกับใช้เมทาดาทา env-var ของ channel แบบเก่าหรือรุ่นเก่ากว่า โดยไม่มีเมทาดาทา
setup หรือ config ปัจจุบันที่ ClawHub คาดหวัง

- ให้เมทาดาทา env-var ของ channel เป็นแบบประกาศ เพื่อให้ OpenClaw ตรวจสอบสถานะ setup
  ได้โดยไม่ต้องโหลดรันไทม์ของ channel
- สะท้อน setup ของ channel ที่ขับเคลื่อนด้วย env ไปยังเมทาดาทา setup, config ของ channel หรือ
  package channel ปัจจุบันที่รูปแบบ Plugin ของคุณใช้
- เก็บ `channelEnvVars` ไว้เฉพาะเป็นเมทาดาทาความเข้ากันได้ในช่วงที่ OpenClaw
  เวอร์ชันเก่าที่รองรับยังต้องใช้
- ดู [รายการกำกับ Plugin](/th/plugins/manifest) และ
  [Channel plugins](/th/plugins/sdk-channel-plugins)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## รายการกำกับความปลอดภัย

### security-manifest-schema-unavailable

แพ็กเกจจัดส่ง `openclaw.security.json` พร้อมการอ้างอิง schema ที่ ClawHub
ไม่รู้จักว่าใช้งานได้

- ลบ URL ของ schema หากเป็นเพียงคำแนะนำ
- ใช้ schema แบบมีเวอร์ชันที่มีเอกสารกำกับหลังจาก OpenClaw เผยแพร่แล้วเท่านั้น
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### unrecognized-security-manifest

แพ็กเกจจัดส่งไฟล์รายการกำกับความปลอดภัยที่ไม่รองรับ

- ลบ `openclaw.security.json` จนกว่า OpenClaw จะจัดทำเอกสาร schema รายการกำกับความปลอดภัย
  แบบมีเวอร์ชันและพฤติกรรมของ ClawHub
- เก็บพฤติกรรมที่อ่อนไหวด้านความปลอดภัยไว้ในเอกสารแพ็กเกจสาธารณะหรือ
  README ของคุณ จนกว่าสัญญารายการกำกับจะมีอยู่
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## ที่เกี่ยวข้อง

- [ClawHub CLI](/th/clawhub/cli)
- [การเผยแพร่ ClawHub](/th/clawhub/publishing)
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [รายการกำกับ Plugin](/th/plugins/manifest)
- [จุดเข้า Plugin](/th/plugins/sdk-entrypoints)
- [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
