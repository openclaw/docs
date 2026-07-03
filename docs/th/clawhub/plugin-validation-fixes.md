---
read_when:
    - คุณรัน clawhub package validate แล้วและต้องแก้ไขข้อค้นพบของ Plugin
    - ClawHub ปฏิเสธหรือเตือนระหว่างการเผยแพร่แพ็กเกจ Plugin
    - คุณกำลังอัปเดตข้อมูลเมตาของแพ็กเกจ Plugin ก่อนการเผยแพร่
summary: แก้ไขผลการตรวจสอบความถูกต้องของแพ็กเกจ Plugin ของ ClawHub ก่อนเผยแพร่
title: การแก้ไขการตรวจสอบ Plugin
x-i18n:
    generated_at: "2026-07-03T23:45:03Z"
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
ข้อค้นพบที่ผู้เขียน Plugin สามารถแก้ไขได้ในเมทาดาทาของแพ็กเกจ, manifest, การนำเข้า SDK
หรืออาร์ติแฟกต์ที่เผยแพร่

หน้านี้ไม่ครอบคลุมข้อค้นพบด้านความครอบคลุมภายในของ Plugin Inspector หากรายงานฉบับเต็ม
มีโค้ดบำรุงรักษาของสแกนเนอร์โดยไม่มีแนวทางแก้ไขสำหรับผู้เขียน โค้ดเหล่านั้นมีไว้สำหรับ
ผู้ดูแล OpenClaw ไม่ใช่ผู้เขียน Plugin

หลังจากใช้การแก้ไขใดๆ แล้ว ให้รันอีกครั้ง:

```bash
clawhub package validate <path-to-plugin>
```

## ข้อค้นพบสำหรับผู้เขียน

| โค้ด                                    | เริ่มที่นี่                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [เพิ่มเมทาดาทาของแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [เพิ่มบล็อก openclaw ของแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [ประกาศ entrypoint ของแพ็กเกจ OpenClaw](/th/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [เผยแพร่ entrypoint ที่ประกาศไว้](/th/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [เติมเมทาดาทาการติดตั้งให้ครบถ้วน](/th/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [ประกาศความเข้ากันได้ของ API สำหรับ Plugin](/th/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [จัดเวอร์ชัน host ขั้นต่ำให้ตรงกัน](/th/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [จัดเวอร์ชันแพ็กเกจและ manifest ให้ตรงกัน](/th/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [นำเมทาดาทาแพ็กเกจ OpenClaw ที่ไม่รองรับออก](/th/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [ทำให้อาร์ติแฟกต์ npm สามารถแพ็กได้](/th/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [รวม entrypoint ในผลลัพธ์ของ npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [รวมเมทาดาทาในผลลัพธ์ของ npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [เพิ่มชื่อที่แสดงของ manifest](/th/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [นำฟิลด์ manifest ที่ไม่รองรับออก](/th/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [นำคีย์ contract ที่ไม่รองรับออก](/th/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [แทนที่การนำเข้า SDK ระดับ root](/th/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [นำการนำเข้า SDK ที่สงวนไว้ออก](/th/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [แทนที่การเข้าถึง whole-session-store](/th/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [แทนที่การเขียน whole-session-store](/th/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [แทนที่ตัวช่วยพาธไฟล์ของเซสชัน](/th/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [แทนที่เป้าหมายไฟล์ transcript แบบเดิม](/th/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [แทนที่ตัวช่วย transcript ระดับต่ำ](/th/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [แทนที่ before_agent_start](/th/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [ย้าย env vars ของ provider ไปยังเมทาดาทาการตั้งค่า](/th/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [มิเรอร์ env vars ของช่องทางในเมทาดาทาปัจจุบัน](/th/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [นำการอ้างอิง schema ของ security manifest ที่ไม่พร้อมใช้งานออก](/th/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [นำไฟล์ security manifest ที่ไม่รองรับออก](/th/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## เมทาดาทาของแพ็กเกจ

### package-json-missing

root ของแพ็กเกจไม่มี `package.json` ดังนั้น ClawHub จึงไม่สามารถระบุ
แพ็กเกจ npm, เวอร์ชัน, entrypoint หรือเมทาดาทา OpenClaw ได้

- เพิ่ม `package.json` พร้อม `name`, `version` และ `type`
- เพิ่มบล็อก `openclaw` เมื่อแพ็กเกจส่งมอบ Plugin ของ OpenClaw
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
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-entry-missing

มีเมทาดาทาของแพ็กเกจอยู่แล้ว แต่ไม่ได้ประกาศ entrypoint ของรันไทม์
OpenClaw

- เพิ่ม `openclaw.extensions` สำหรับ entrypoint ของ Plugin แบบเนทีฟ
- เพิ่ม `openclaw.runtimeExtensions` เมื่อแพ็กเกจที่เผยแพร่ควรโหลด JavaScript
  ที่ build แล้ว
- เก็บพาธ entrypoint ทั้งหมดไว้ภายในไดเรกทอรีแพ็กเกจ
- ดู [จุดเข้าใช้งานของ Plugin](/th/plugins/sdk-entrypoints) และ
  [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-entrypoint-missing

แพ็กเกจประกาศ entrypoint ของ OpenClaw แต่ไฟล์ที่อ้างอิงหายไป
จากแพ็กเกจที่กำลังตรวจสอบ

- ตรวจสอบแต่ละพาธใน `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` และ `openclaw.runtimeSetupEntry`
- build แพ็กเกจหาก entrypoint ถูกสร้างไปยัง `dist`
- อัปเดตเมทาดาทาหาก entrypoint ถูกย้าย
- ดู [จุดเข้าใช้งานของ Plugin](/th/plugins/sdk-entrypoints)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-install-metadata-incomplete

ClawHub ไม่สามารถบอกได้ว่าควรติดตั้งหรืออัปเดตแพ็กเกจอย่างไร

- เติม `openclaw.install` ด้วยแหล่งติดตั้งที่รองรับ เช่น
  `clawhubSpec`, `npmSpec` หรือ `localPath`
- ตั้งค่า `openclaw.install.defaultChoice` เมื่อมีแหล่งติดตั้งมากกว่าหนึ่งแหล่ง
  ให้ใช้งาน
- ใช้ `openclaw.install.minHostVersion` สำหรับเวอร์ชัน host ของ OpenClaw ขั้นต่ำ
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-plugin-api-compat-missing

แพ็กเกจไม่ได้ประกาศช่วง API สำหรับ Plugin ของ OpenClaw ที่รองรับ

- เพิ่ม `openclaw.compat.pluginApi` ลงใน `package.json`
- ใช้เวอร์ชัน API สำหรับ Plugin ของ OpenClaw หรือ semver floor ที่คุณใช้ build และทดสอบ
  เทียบกับเวอร์ชันนั้น
- แยกสิ่งนี้ออกจากเวอร์ชันของแพ็กเกจ เวอร์ชันของแพ็กเกจอธิบาย
  รุ่นเผยแพร่ของ Plugin; `openclaw.compat.pluginApi` อธิบาย contract ของ API ฝั่ง host
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-min-host-version-drift

เวอร์ชัน host ขั้นต่ำของแพ็กเกจไม่ตรงกับเมทาดาทาเวอร์ชัน OpenClaw
ที่ใช้ build แพ็กเกจ

- ตรวจสอบ `openclaw.install.minHostVersion`
- ตรวจสอบเมทาดาทา build ของ OpenClaw ในแพ็กเกจ เช่น เวอร์ชัน OpenClaw
  ที่ใช้ระหว่างการเผยแพร่
- จัดเวอร์ชัน host ขั้นต่ำให้ตรงกับช่วงเวอร์ชัน host ที่แพ็กเกจ
  รองรับจริง
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-manifest-version-drift

เวอร์ชันแพ็กเกจและเวอร์ชัน manifest ของ Plugin ไม่ตรงกัน

- ควรใช้ `package.json#version` เป็นเวอร์ชันเผยแพร่ของแพ็กเกจ
- หาก `openclaw.plugin.json` มี `version` ด้วย ให้อัปเดตให้ตรงกันหรือนำ
  เมทาดาทาเวอร์ชัน manifest ที่เก่าออกเมื่อเมทาดาทาแพ็กเกจเป็นแหล่งอ้างอิงหลัก
- เผยแพร่แพ็กเกจเวอร์ชันใหม่หลังจากเปลี่ยนเมทาดาทาที่เผยแพร่แล้ว
- ดู [Plugin manifest](/th/plugins/manifest)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-unsupported-metadata

บล็อก `package.json#openclaw` มีฟิลด์ที่ไม่รองรับเป็น
เมทาดาทาแพ็กเกจ OpenClaw

- นำฟิลด์ที่ไม่รองรับออก เช่น `openclaw.bundle`
- เก็บเมทาดาทา Plugin แบบเนทีฟไว้ใน `openclaw.plugin.json`
- เก็บ entrypoint ของแพ็กเกจ, ความเข้ากันได้, การติดตั้ง, การตั้งค่า และเมทาดาทาแค็ตตาล็อก
  ไว้ในฟิลด์ `package.json#openclaw` ที่รองรับ
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## อาร์ติแฟกต์ที่เผยแพร่

### package-npm-pack-unavailable

แพ็กเกจไม่สามารถถูกแพ็กเป็นอาร์ติแฟกต์ที่ ClawHub จะตรวจสอบหรือ
เผยแพร่ได้

- รัน `npm pack --dry-run` จาก root ของแพ็กเกจ
- แก้ไขเมทาดาทาแพ็กเกจที่ไม่ถูกต้อง, สคริปต์ lifecycle ที่เสีย หรือรายการไฟล์ที่
  ทำให้การแพ็กล้มเหลว
- นำ `private: true` ออกหากแพ็กเกจนี้ตั้งใจให้เผยแพร่สู่สาธารณะ
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-entrypoint-missing

แพ็กเกจสามารถแพ็กได้ แต่อาร์ติแฟกต์ที่แพ็กแล้วไม่มีไฟล์
entrypoint ที่ประกาศใน `package.json#openclaw`

- รัน `npm pack --dry-run` และตรวจสอบไฟล์ที่จะถูกรวมไว้
- build entrypoint ที่สร้างขึ้นก่อนแพ็ก
- อัปเดต `files`, `.npmignore` หรือผลลัพธ์ build เพื่อให้ entrypoint ที่ประกาศไว้
  ถูกรวมอยู่ด้วย
- ดู [จุดเข้าใช้งานของ Plugin](/th/plugins/sdk-entrypoints)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-metadata-missing

อาร์ติแฟกต์ที่แพ็กแล้วขาดเมทาดาทา OpenClaw ที่มีอยู่ในแพ็กเกจ
ต้นทางของคุณ

- รัน `npm pack --dry-run` และตรวจสอบไฟล์เมทาดาทาที่รวมอยู่
- ตรวจให้แน่ใจว่า `package.json` มีบล็อก `openclaw` ในอาร์ติแฟกต์ที่แพ็กแล้ว
- ตรวจให้แน่ใจว่า `openclaw.plugin.json` ถูกรวมไว้เมื่อแพ็กเกจเป็น Plugin
  OpenClaw แบบเนทีฟ
- อัปเดต `files` หรือ `.npmignore` เพื่อไม่ให้เมทาดาทาแพ็กเกจถูกแยกออก
- ดู [การสร้าง Plugin](/th/plugins/building-plugins)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## เมทาดาทา manifest

### manifest-name-missing

manifest ของ Plugin แบบเนทีฟไม่มีชื่อที่ใช้แสดงผล

- เพิ่มฟิลด์ `name` ที่ไม่ว่างใน `openclaw.plugin.json`
- ทำให้ `name` อ่านเข้าใจได้โดยมนุษย์ และคง `id` เป็นรหัสเครื่องที่เสถียร
- ดู [manifest ของ Plugin](/th/plugins/manifest)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-fields

manifest ของ Plugin มีฟิลด์ระดับบนสุดที่ OpenClaw ไม่รองรับ

- เปรียบเทียบฟิลด์ระดับบนสุดแต่ละรายการกับ
  [ข้อมูลอ้างอิงฟิลด์ของ manifest](/th/plugins/manifest#top-level-field-reference)
- ลบฟิลด์กำหนดเองออกจาก `openclaw.plugin.json`
- ย้าย metadata ของแพ็กเกจหรือการติดตั้งไปไว้ในฟิลด์ `package.json#openclaw`
  ที่รองรับแทน manifest
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-contracts

manifest ประกาศคีย์ที่ไม่รองรับภายใน `contracts`

- เปรียบเทียบแต่ละคีย์ภายใต้ `contracts` กับ
  [ข้อมูลอ้างอิง contracts](/th/plugins/manifest#contracts-reference)
- ลบคีย์ contract ที่ไม่รองรับ
- ย้ายพฤติกรรม runtime ไปไว้ในโค้ดลงทะเบียน Plugin และจำกัด `contracts`
  ให้มีเฉพาะ metadata ความเป็นเจ้าของ capability แบบคงที่
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## SDK และการย้าย compatibility

### legacy-root-sdk-import

Plugin import จาก root SDK barrel ที่เลิกใช้แล้ว:
`openclaw/plugin-sdk`

- แทนที่ root-barrel imports ด้วย public subpath imports ที่เฉพาะเจาะจง
- ใช้ `openclaw/plugin-sdk/plugin-entry` สำหรับ `definePluginEntry`
- ใช้ `openclaw/plugin-sdk/channel-core` สำหรับ channel entry helpers
- ใช้ [แนวทาง import](/th/plugins/building-plugins#import-conventions) และ
  [subpaths ของ Plugin SDK](/th/plugins/sdk-subpaths) เพื่อหา import ที่แคบลง
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### reserved-sdk-import

Plugin import พาธ SDK ที่สงวนไว้สำหรับ Plugin ที่บันเดิลมาด้วยหรือ
compatibility ภายใน

- แทนที่ OpenClaw internal SDK imports ที่สงวนไว้ด้วย public
  `openclaw/plugin-sdk/*` subpaths ที่มีเอกสารกำกับ
- หากพฤติกรรมนั้นไม่มี SDK สาธารณะ ให้เก็บ helper ไว้ภายในแพ็กเกจของคุณ หรือ
  ขอ OpenClaw API สาธารณะ
- ใช้ [subpaths ของ Plugin SDK](/th/plugins/sdk-subpaths) และ
  [การย้าย SDK](/th/plugins/sdk-migration) เพื่อเลือก import ที่รองรับ
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-load-session-store

Plugin ยังใช้ whole-session-store helper ที่เลิกใช้แล้ว
`loadSessionStore`

- ใช้ `getSessionEntry(...)` หรือ `listSessionEntries(...)` เมื่ออ่าน
  session state
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เมื่อเขียน
  session state
- หลีกเลี่ยงการโหลด แก้ไข และบันทึก whole session store object
- เก็บ `loadSessionStore(...)` ไว้เฉพาะขณะที่ช่วง compatibility ที่คุณประกาศ
  ยังคงรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [subpaths ของ Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-store-write

Plugin ยังใช้ whole-session-store write helper ที่เลิกใช้แล้ว เช่น
`saveSessionStore` หรือ `updateSessionStore`

- ใช้ `patchSessionEntry(...)` เมื่ออัปเดตฟิลด์ใน session entry ที่มีอยู่
- ใช้ `upsertSessionEntry(...)` เมื่อแทนที่หรือสร้าง session entry
- หลีกเลี่ยงการโหลด แก้ไข และบันทึก whole session store object
- เก็บ whole-store write helpers ไว้เฉพาะขณะที่ช่วง compatibility ที่คุณประกาศ
  ยังคงรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [subpaths ของ Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-file-helper

Plugin ยังใช้ session file-path helpers ที่เลิกใช้แล้ว เช่น
`resolveSessionFilePath` หรือ `resolveAndPersistSessionFile`

- ใช้ `getSessionEntry(...)` เพื่ออ่าน session metadata ตาม agent และ
  session identity
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เพื่อ persist
  session metadata
- ใช้ transcript identity หรือ target helpers เมื่อโค้ดกำลังเตรียม
  transcript operation
- อย่า persist หรือพึ่งพา transcript file paths แบบ legacy
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [subpaths ของ Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-transcript-file-target

Plugin ยังใช้ transcript file target helper ที่เลิกใช้แล้ว
`resolveSessionTranscriptLegacyFileTarget`

- ใช้ `resolveSessionTranscriptIdentity(...)` เมื่อโค้ดต้องการเฉพาะ public
  session identity
- ใช้ `resolveSessionTranscriptTarget(...)` เมื่อโค้ดต้องการ structured
  transcript operation target
- หลีกเลี่ยงการอ่านหรือสร้าง legacy transcript file targets โดยตรง
- เก็บ legacy helper ไว้เฉพาะขณะที่ช่วง compatibility ที่คุณประกาศยังคงรองรับ
  OpenClaw เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [subpaths ของ Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-transcript-low-level

Plugin ยังใช้ low-level transcript helpers ที่เลิกใช้แล้ว เช่น
`appendSessionTranscriptMessage` หรือ `emitSessionTranscriptUpdate`

- ใช้ `appendSessionTranscriptMessageByIdentity(...)` สำหรับ transcript appends
- ใช้ `publishSessionTranscriptUpdateByIdentity(...)` สำหรับการแจ้งเตือน
  transcript update
- ควรใช้ structured transcript runtime surface เพื่อให้ OpenClaw ใช้
  transaction boundaries และการจัดการ identity ที่ถูกต้องได้
- เก็บ low-level transcript helpers ไว้เฉพาะขณะที่ช่วง compatibility ที่คุณประกาศ
  ยังคงรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [subpaths ของ Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### legacy-before-agent-start

Plugin ยังใช้ hook `before_agent_start` แบบ legacy

- ย้ายงาน override model หรือ provider ไปที่ `before_model_resolve`
- ย้ายงาน mutation ของ prompt หรือ context ไปที่ `before_prompt_build`
- เก็บ `before_agent_start` ไว้เฉพาะขณะที่ช่วง compatibility ที่คุณประกาศ
  ยังคงรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Hooks](/th/plugins/hooks) และ
  [Plugin compatibility](/th/plugins/compatibility)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### provider-auth-env-vars

manifest ยังใช้ metadata การ auth ของ provider แบบ legacy
`providerAuthEnvVars`

- สะท้อน metadata ของ provider env-var ไปยัง `setup.providers[].envVars`
- เก็บ `providerAuthEnvVars` ไว้เป็น compatibility metadata เท่านั้น
  ขณะที่ช่วง OpenClaw ที่คุณรองรับยังต้องใช้มัน
- ดู [ข้อมูลอ้างอิง setup](/th/plugins/manifest#setup-reference) และ
  [การย้าย SDK](/th/plugins/sdk-migration)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### channel-env-vars

manifest ใช้ metadata ของ channel env-var แบบ legacy หรือแบบเก่าโดยไม่มี
metadata setup หรือ config ปัจจุบันที่ ClawHub คาดหวัง

- ทำให้ metadata ของ channel env-var เป็นแบบ declarative เพื่อให้ OpenClaw
  ตรวจสอบสถานะ setup ได้โดยไม่ต้องโหลด channel runtime
- สะท้อนการ setup channel ที่ขับเคลื่อนด้วย env ไปยัง metadata setup,
  channel config หรือ package channel ปัจจุบันที่รูปแบบ Plugin ของคุณใช้
- เก็บ `channelEnvVars` ไว้เป็น compatibility metadata เท่านั้น ขณะที่ OpenClaw
  เวอร์ชันเก่าที่รองรับยังต้องใช้มัน
- ดู [manifest ของ Plugin](/th/plugins/manifest) และ
  [Channel plugins](/th/plugins/sdk-channel-plugins)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## Security manifest

### security-manifest-schema-unavailable

แพ็กเกจส่ง `openclaw.security.json` มาพร้อม schema reference ที่ ClawHub
ไม่รู้จักว่าใช้งานได้

- ลบ schema URL หากเป็นเพียงคำแนะนำ
- ใช้ schema แบบ versioned ที่มีเอกสารกำกับหลังจาก OpenClaw เผยแพร่แล้วเท่านั้น
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### unrecognized-security-manifest

แพ็กเกจส่งไฟล์ security manifest ที่ไม่รองรับมา

- ลบ `openclaw.security.json` จนกว่า OpenClaw จะจัดทำเอกสารสำหรับ schema ของ
  security manifest แบบ versioned และพฤติกรรมของ ClawHub
- เก็บพฤติกรรมที่เกี่ยวข้องกับความปลอดภัยไว้ในเอกสารแพ็กเกจสาธารณะหรือ
  README ของคุณ จนกว่า manifest contract จะมีอยู่
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## ที่เกี่ยวข้อง

- [ClawHub CLI](/th/clawhub/cli)
- [การเผยแพร่ ClawHub](/th/clawhub/publishing)
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [manifest ของ Plugin](/th/plugins/manifest)
- [entry points ของ Plugin](/th/plugins/sdk-entrypoints)
- [Plugin compatibility](/th/plugins/compatibility)
