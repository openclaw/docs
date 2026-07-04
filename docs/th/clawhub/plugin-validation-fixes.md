---
read_when:
    - คุณเรียกใช้ clawhub package validate และต้องแก้ไขข้อค้นพบของ Plugin
    - ClawHub ปฏิเสธหรือแสดงคำเตือนเมื่อเผยแพร่แพ็กเกจ Plugin
    - คุณกำลังอัปเดตเมตาดาต้าแพ็กเกจ Plugin ก่อนปล่อยรุ่น
summary: แก้ไขข้อค้นพบจากการตรวจสอบความถูกต้องของแพ็กเกจ Plugin ของ ClawHub ก่อนเผยแพร่
title: การแก้ไขการตรวจสอบ Plugin
x-i18n:
    generated_at: "2026-07-04T20:45:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# การแก้ไขการตรวจสอบความถูกต้องของ Plugin

ClawHub ตรวจสอบความถูกต้องของแพ็กเกจ Plugin ก่อนเผยแพร่ และยังสามารถแสดงข้อค้นพบจาก
การสแกนแพ็กเกจอัตโนมัติได้ด้วย หน้านี้ครอบคลุมข้อค้นพบสำหรับผู้เขียน ซึ่งหมายถึง
ข้อค้นพบที่ผู้เขียน Plugin สามารถแก้ไขได้ในเมทาดาทาของแพ็กเกจ, manifest, การนำเข้า SDK
หรืออาร์ติแฟกต์ที่เผยแพร่แล้ว

หน้านี้ไม่ครอบคลุมข้อค้นพบด้านความครอบคลุมภายในของ Plugin Inspector หากรายงานฉบับเต็ม
มีรหัสการบำรุงรักษาสแกนเนอร์โดยไม่มีแนวทางแก้ไขสำหรับผู้เขียน รหัสเหล่านั้นมีไว้สำหรับ
ผู้ดูแล OpenClaw ไม่ใช่ผู้เขียน Plugin

หลังจากใช้การแก้ไขใด ๆ แล้ว ให้รันอีกครั้ง:

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
| `package-min-host-version-drift`        | [จัดแนวเวอร์ชันโฮสต์ขั้นต่ำ](/th/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [จัดแนวเวอร์ชันแพ็กเกจและ manifest](/th/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [ลบเมทาดาทาแพ็กเกจ OpenClaw ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [ทำให้อาร์ติแฟกต์ npm สามารถแพ็กได้](/th/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [รวม entrypoint ในเอาต์พุต npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [รวมเมทาดาทาในเอาต์พุต npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [เพิ่มชื่อที่แสดงของ manifest](/th/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [ลบฟิลด์ manifest ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [ลบคีย์สัญญาที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [แทนที่การนำเข้า SDK จากรูท](/th/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [ลบการนำเข้า SDK ที่สงวนไว้](/th/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [แทนที่การเข้าถึง session store ทั้งชุด](/th/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [แทนที่การเขียน session store ทั้งชุด](/th/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [แทนที่ตัวช่วยพาธไฟล์เซสชัน](/th/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [แทนที่เป้าหมายไฟล์ transcript แบบเดิม](/th/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [แทนที่ตัวช่วย transcript ระดับต่ำ](/th/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [แทนที่ before_agent_start](/th/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [ย้ายตัวแปรสภาพแวดล้อมของผู้ให้บริการไปยังเมทาดาทาการตั้งค่า](/th/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [สะท้อนตัวแปรสภาพแวดล้อมของช่องทางในเมทาดาทาปัจจุบัน](/th/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [ลบการอ้างอิง schema ของ manifest ความปลอดภัยที่ใช้งานไม่ได้](/th/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [ลบไฟล์ manifest ความปลอดภัยที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## เมทาดาทาแพ็กเกจ

### package-json-missing

รูทของแพ็กเกจไม่มี `package.json` ดังนั้น ClawHub จึงไม่สามารถระบุ
แพ็กเกจ npm, เวอร์ชัน, entrypoint หรือเมทาดาทา OpenClaw ได้

- เพิ่ม `package.json` พร้อม `name`, `version` และ `type`
- เพิ่มบล็อก `openclaw` เมื่อแพ็กเกจจัดส่ง Plugin ของ OpenClaw
- ใช้ [การสร้าง Plugin](/th/plugins/building-plugins) สำหรับตัวอย่างแพ็กเกจขั้นต่ำ
  และ [manifest ของ Plugin](/th/plugins/manifest#manifest-versus-packagejson)
  สำหรับการแยกหน้าที่ระหว่างแพ็กเกจกับ manifest
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

มีเมทาดาทาแพ็กเกจอยู่แล้ว แต่ไม่ได้ประกาศ entrypoint รันไทม์ของ
OpenClaw

- เพิ่ม `openclaw.extensions` สำหรับ entrypoint ของ Plugin แบบเนทีฟ
- เพิ่ม `openclaw.runtimeExtensions` เมื่อแพ็กเกจที่เผยแพร่ควรโหลด JavaScript
  ที่ build แล้ว
- เก็บพาธ entrypoint ทั้งหมดไว้ภายในไดเรกทอรีแพ็กเกจ
- ดู [entry point ของ Plugin](/th/plugins/sdk-entrypoints) และ
  [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-entrypoint-missing

แพ็กเกจประกาศ entrypoint ของ OpenClaw แต่ไฟล์ที่อ้างอิงหายไป
จากแพ็กเกจที่กำลังตรวจสอบความถูกต้อง

- ตรวจสอบแต่ละพาธใน `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` และ `openclaw.runtimeSetupEntry`
- build แพ็กเกจหาก entrypoint ถูกสร้างลงใน `dist`
- อัปเดตเมทาดาทาหาก entrypoint ถูกย้าย
- ดู [entry point ของ Plugin](/th/plugins/sdk-entrypoints)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-install-metadata-incomplete

ClawHub ไม่สามารถบอกได้ว่าควรติดตั้งหรืออัปเดตแพ็กเกจอย่างไร

- เติม `openclaw.install` ด้วยแหล่งติดตั้งที่รองรับ เช่น
  `clawhubSpec`, `npmSpec` หรือ `localPath`
- ตั้งค่า `openclaw.install.defaultChoice` เมื่อมีแหล่งติดตั้งมากกว่าหนึ่งแหล่ง
- ใช้ `openclaw.install.minHostVersion` สำหรับเวอร์ชันโฮสต์ OpenClaw ขั้นต่ำ
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-plugin-api-compat-missing

แพ็กเกจไม่ได้ประกาศช่วง API Plugin ของ OpenClaw ที่รองรับ

- เพิ่ม `openclaw.compat.pluginApi` ไปยัง `package.json`
- ใช้เวอร์ชัน API Plugin ของ OpenClaw หรือ semver floor ที่คุณ build และทดสอบ
  ด้วย
- แยกสิ่งนี้ออกจากเวอร์ชันแพ็กเกจ เวอร์ชันแพ็กเกจอธิบาย
  การเผยแพร่ Plugin ส่วน `openclaw.compat.pluginApi` อธิบายสัญญา API ของโฮสต์
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-min-host-version-drift

เวอร์ชันโฮสต์ขั้นต่ำของแพ็กเกจไม่ตรงกับเมทาดาทาเวอร์ชัน OpenClaw
ที่ใช้ build แพ็กเกจ

- ตรวจสอบ `openclaw.install.minHostVersion`
- ตรวจสอบเมทาดาทา build ของ OpenClaw ใด ๆ ในแพ็กเกจ เช่น เวอร์ชัน OpenClaw
  ที่ใช้ระหว่างการเผยแพร่
- จัดแนวเวอร์ชันโฮสต์ขั้นต่ำให้ตรงกับช่วงเวอร์ชันโฮสต์ที่แพ็กเกจ
  รองรับจริง
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-manifest-version-drift

เวอร์ชันแพ็กเกจและเวอร์ชัน manifest ของ Plugin ไม่ตรงกัน

- ควรใช้ `package.json#version` เป็นเวอร์ชันเผยแพร่ของแพ็กเกจ
- หาก `openclaw.plugin.json` มี `version` ด้วย ให้อัปเดตให้ตรงกันหรือ
  ลบเมทาดาทาเวอร์ชัน manifest ที่ล้าสมัยเมื่อเมทาดาทาแพ็กเกจเป็นแหล่งข้อมูลหลัก
- เผยแพร่แพ็กเกจเวอร์ชันใหม่หลังจากเปลี่ยนเมทาดาทาที่เผยแพร่แล้ว
- ดู [manifest ของ Plugin](/th/plugins/manifest)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-unsupported-metadata

บล็อก `package.json#openclaw` มีฟิลด์ที่ไม่รองรับ
สำหรับเมทาดาทาแพ็กเกจ OpenClaw

- ลบฟิลด์ที่ไม่รองรับ เช่น `openclaw.bundle`
- เก็บเมทาดาทา Plugin แบบเนทีฟไว้ใน `openclaw.plugin.json`
- เก็บ entrypoint ของแพ็กเกจ, ความเข้ากันได้, การติดตั้ง, การตั้งค่า และเมทาดาทาแค็ตตาล็อก
  ไว้ในฟิลด์ `package.json#openclaw` ที่รองรับ
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## อาร์ติแฟกต์ที่เผยแพร่แล้ว

### package-npm-pack-unavailable

ไม่สามารถแพ็กแพ็กเกจเป็นอาร์ติแฟกต์ที่ ClawHub จะตรวจสอบหรือ
เผยแพร่ได้

- รัน `npm pack --dry-run` จากรูทของแพ็กเกจ
- แก้ไขเมทาดาทาแพ็กเกจที่ไม่ถูกต้อง, lifecycle script ที่เสีย หรือรายการไฟล์ที่
  ทำให้การแพ็กล้มเหลว
- ลบ `private: true` หากแพ็กเกจนี้ตั้งใจให้เผยแพร่สาธารณะ
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-entrypoint-missing

แพ็กเกจสามารถแพ็กได้ แต่อาร์ติแฟกต์ที่แพ็กแล้วไม่มีไฟล์
entrypoint ที่ประกาศไว้ใน `package.json#openclaw`

- รัน `npm pack --dry-run` และตรวจสอบไฟล์ที่จะถูกรวมไว้
- build entrypoint ที่สร้างขึ้นก่อนแพ็ก
- อัปเดต `files`, `.npmignore` หรือเอาต์พุต build เพื่อให้ entrypoint ที่ประกาศไว้
  ถูกรวมอยู่
- ดู [entry point ของ Plugin](/th/plugins/sdk-entrypoints)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-metadata-missing

อาร์ติแฟกต์ที่แพ็กแล้วไม่มีเมทาดาทา OpenClaw ที่มีอยู่ในแพ็กเกจ
ซอร์สของคุณ

- รัน `npm pack --dry-run` และตรวจสอบไฟล์เมทาดาทาที่ถูกรวมไว้
- ตรวจสอบให้แน่ใจว่า `package.json` มีบล็อก `openclaw` ในอาร์ติแฟกต์ที่แพ็กแล้ว
- ตรวจสอบให้แน่ใจว่า `openclaw.plugin.json` ถูกรวมไว้เมื่อแพ็กเกจเป็น Plugin
  OpenClaw แบบเนทีฟ
- อัปเดต `files` หรือ `.npmignore` เพื่อไม่ให้เมทาดาทาแพ็กเกจถูกตัดออก
- ดู [การสร้าง Plugin](/th/plugins/building-plugins)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## เมทาดาทา manifest

### manifest-name-missing

manifest ของ Plugin แบบเนทีฟไม่มีชื่อที่ใช้แสดงผล

- เพิ่มฟิลด์ `name` ที่ไม่ว่างลงใน `openclaw.plugin.json`
- ให้ `name` อ่านเข้าใจได้สำหรับมนุษย์ และให้ `id` เป็น id เครื่องที่เสถียร
- ดู [manifest ของ Plugin](/th/plugins/manifest)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-fields

manifest ของ Plugin มีฟิลด์ระดับบนสุดที่ OpenClaw ไม่รองรับ

- เปรียบเทียบฟิลด์ระดับบนสุดแต่ละฟิลด์กับ
  [เอกสารอ้างอิงฟิลด์ manifest](/th/plugins/manifest#top-level-field-reference)
- ลบฟิลด์กำหนดเองออกจาก `openclaw.plugin.json`
- ย้ายเมตาดาต้าของแพ็กเกจหรือการติดตั้งไปไว้ในฟิลด์ `package.json#openclaw`
  ที่รองรับแทน manifest
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-contracts

manifest ประกาศคีย์ที่ไม่รองรับภายใน `contracts`

- เปรียบเทียบแต่ละคีย์ใต้ `contracts` กับ
  [เอกสารอ้างอิง contracts](/th/plugins/manifest#contracts-reference)
- ลบคีย์ contract ที่ไม่รองรับ
- ย้ายพฤติกรรม runtime ไปไว้ในโค้ดลงทะเบียน Plugin และจำกัด `contracts`
  ให้มีเฉพาะเมตาดาต้าความเป็นเจ้าของความสามารถแบบสแตติก
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## SDK และการย้ายความเข้ากันได้

### legacy-root-sdk-import

Plugin นำเข้าจาก barrel ของ SDK รูทที่เลิกใช้แล้ว:
`openclaw/plugin-sdk`

- แทนที่การนำเข้าจาก root-barrel ด้วยการนำเข้า public subpath ที่เจาะจง
- ใช้ `openclaw/plugin-sdk/plugin-entry` สำหรับ `definePluginEntry`
- ใช้ `openclaw/plugin-sdk/channel-core` สำหรับตัวช่วย entry ของช่องทาง
- ใช้ [แนวทางการนำเข้า](/th/plugins/building-plugins#import-conventions) และ
  [subpath ของ Plugin SDK](/th/plugins/sdk-subpaths) เพื่อค้นหาการนำเข้าที่แคบลง
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### reserved-sdk-import

Plugin นำเข้า path ของ SDK ที่สงวนไว้สำหรับ Plugin ที่บันเดิลมาด้วยหรือสำหรับความเข้ากันได้ภายใน

- แทนที่การนำเข้า SDK ภายในของ OpenClaw ที่สงวนไว้ด้วย subpath
  `openclaw/plugin-sdk/*` แบบ public ที่มีเอกสารกำกับ
- หากพฤติกรรมนั้นไม่มี SDK แบบ public ให้เก็บตัวช่วยไว้ภายในแพ็กเกจของคุณ หรือ
  ขอ API แบบ public จาก OpenClaw
- ใช้ [subpath ของ Plugin SDK](/th/plugins/sdk-subpaths) และ
  [การย้าย SDK](/th/plugins/sdk-migration) เพื่อเลือกการนำเข้าที่รองรับ
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-load-session-store

Plugin ยังใช้ตัวช่วย whole-session-store ที่เลิกใช้แล้ว
`loadSessionStore`

- ใช้ `getSessionEntry(...)` หรือ `listSessionEntries(...)` เมื่ออ่านสถานะ session
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เมื่อเขียนสถานะ session
- หลีกเลี่ยงการโหลด แก้ไข และบันทึกอ็อบเจกต์ session store ทั้งหมด
- เก็บ `loadSessionStore(...)` ไว้เฉพาะในช่วงที่ช่วงความเข้ากันได้ที่คุณประกาศ
  ยังรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [subpath ของ Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-store-write

Plugin ยังใช้ตัวช่วยเขียน whole-session-store ที่เลิกใช้แล้ว เช่น
`saveSessionStore` หรือ `updateSessionStore`

- ใช้ `patchSessionEntry(...)` เมื่ออัปเดตฟิลด์บนรายการ session ที่มีอยู่
- ใช้ `upsertSessionEntry(...)` เมื่อแทนที่หรือสร้างรายการ session
- หลีกเลี่ยงการโหลด แก้ไข และบันทึกอ็อบเจกต์ session store ทั้งหมด
- เก็บตัวช่วยเขียน whole-store ไว้เฉพาะในช่วงที่ช่วงความเข้ากันได้ที่คุณประกาศ
  ยังรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [subpath ของ Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-file-helper

Plugin ยังใช้ตัวช่วย path ไฟล์ session ที่เลิกใช้แล้ว เช่น
`resolveSessionFilePath` หรือ `resolveAndPersistSessionFile`

- ใช้ `getSessionEntry(...)` เพื่ออ่านเมตาดาต้า session ตาม agent และตัวตนของ session
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เพื่อคงอยู่เมตาดาต้า session
- ใช้ตัวตน transcript หรือตัวช่วย target เมื่อโค้ดกำลังเตรียมการดำเนินการ transcript
- อย่าคงอยู่หรือพึ่งพา path ไฟล์ transcript แบบเดิม
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [subpath ของ Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-transcript-file-target

Plugin ยังใช้ตัวช่วย target ไฟล์ transcript ที่เลิกใช้แล้ว
`resolveSessionTranscriptLegacyFileTarget`

- ใช้ `resolveSessionTranscriptIdentity(...)` เมื่อโค้ดต้องการเฉพาะตัวตน session แบบ public
- ใช้ `resolveSessionTranscriptTarget(...)` เมื่อโค้ดต้องการ target การดำเนินการ transcript แบบมีโครงสร้าง
- หลีกเลี่ยงการอ่านหรือสร้าง target ไฟล์ transcript แบบเดิมโดยตรง
- เก็บตัวช่วยแบบเดิมไว้เฉพาะในช่วงที่ช่วงความเข้ากันได้ที่คุณประกาศยังรองรับ
  OpenClaw เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [subpath ของ Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-transcript-low-level

Plugin ยังใช้ตัวช่วย transcript ระดับต่ำที่เลิกใช้แล้ว เช่น
`appendSessionTranscriptMessage` หรือ `emitSessionTranscriptUpdate`

- ใช้ `appendSessionTranscriptMessageByIdentity(...)` สำหรับการเพิ่ม transcript
- ใช้ `publishSessionTranscriptUpdateByIdentity(...)` สำหรับการแจ้งเตือนอัปเดต transcript
- ควรใช้พื้นผิว runtime ของ transcript แบบมีโครงสร้าง เพื่อให้ OpenClaw ใช้ขอบเขตธุรกรรมและการจัดการตัวตนที่ถูกต้องได้
- เก็บตัวช่วย transcript ระดับต่ำไว้เฉพาะในช่วงที่ช่วงความเข้ากันได้ที่คุณประกาศ
  ยังรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [subpath ของ Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### legacy-before-agent-start

Plugin ยังใช้ hook แบบเดิม `before_agent_start`

- ย้ายงาน override โมเดลหรือผู้ให้บริการไปที่ `before_model_resolve`
- ย้ายงานแก้ไข prompt หรือ context ไปที่ `before_prompt_build`
- เก็บ `before_agent_start` ไว้เฉพาะในช่วงที่ช่วงความเข้ากันได้ที่คุณประกาศยังรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Hooks](/th/plugins/hooks) และ
  [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### provider-auth-env-vars

manifest ยังใช้เมตาดาต้า auth ของผู้ให้บริการ `providerAuthEnvVars` แบบเดิม

- สะท้อนเมตาดาต้า env-var ของผู้ให้บริการไปยัง `setup.providers[].envVars`
- เก็บ `providerAuthEnvVars` ไว้เฉพาะเป็นเมตาดาต้าความเข้ากันได้ ขณะที่ช่วง OpenClaw ที่คุณรองรับยังต้องใช้มัน
- ดู [เอกสารอ้างอิง setup](/th/plugins/manifest#setup-reference) และ
  [การย้าย SDK](/th/plugins/sdk-migration)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### channel-env-vars

manifest ใช้เมตาดาต้า env-var ของช่องทางแบบเดิมหรือรุ่นเก่า โดยไม่มีเมตาดาต้า setup หรือ config ปัจจุบันที่ ClawHub คาดหวัง

- ให้เมตาดาต้า env-var ของช่องทางเป็นแบบประกาศ เพื่อให้ OpenClaw ตรวจสอบสถานะ setup ได้
  โดยไม่ต้องโหลด runtime ของช่องทาง
- สะท้อน setup ของช่องทางที่ขับเคลื่อนด้วย env ไปยัง setup, config ช่องทาง หรือ
  เมตาดาต้าช่องทางของแพ็กเกจในปัจจุบันที่รูปแบบ Plugin ของคุณใช้
- เก็บ `channelEnvVars` ไว้เฉพาะเป็นเมตาดาต้าความเข้ากันได้ ขณะที่ OpenClaw เวอร์ชันเก่าที่รองรับยังต้องใช้มัน
- ดู [manifest ของ Plugin](/th/plugins/manifest) และ
  [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## manifest ด้านความปลอดภัย

### security-manifest-schema-unavailable

แพ็กเกจส่ง `openclaw.security.json` มาพร้อม schema reference ที่ ClawHub
ไม่รู้จักว่าพร้อมใช้งาน

- ลบ URL ของ schema หากเป็นเพียงคำแนะนำ
- ใช้ schema แบบมีเวอร์ชันที่มีเอกสารกำกับหลังจาก OpenClaw เผยแพร่แล้วเท่านั้น
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### unrecognized-security-manifest

แพ็กเกจส่งไฟล์ manifest ด้านความปลอดภัยที่ไม่รองรับมา

- ลบ `openclaw.security.json` จนกว่า OpenClaw จะจัดทำเอกสาร schema ของ manifest ด้านความปลอดภัยแบบมีเวอร์ชันและพฤติกรรมของ ClawHub
- เก็บพฤติกรรมที่ไวต่อความปลอดภัยไว้ในเอกสารแพ็กเกจแบบ public หรือ
  README ของคุณ จนกว่าจะมีสัญญา manifest
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## ที่เกี่ยวข้อง

- [ClawHub CLI](/th/clawhub/cli)
- [การเผยแพร่ ClawHub](/th/clawhub/publishing)
- [การสร้าง plugins](/th/plugins/building-plugins)
- [manifest ของ Plugin](/th/plugins/manifest)
- [entry point ของ Plugin](/th/plugins/sdk-entrypoints)
- [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
