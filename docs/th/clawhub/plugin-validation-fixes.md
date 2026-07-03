---
read_when:
    - คุณรัน clawhub package validate แล้วและต้องแก้ไขข้อค้นพบของ Plugin
    - ClawHub ปฏิเสธหรือเตือนในการเผยแพร่แพ็กเกจ Plugin
    - คุณกำลังอัปเดตข้อมูลเมตาของแพ็กเกจ Plugin ก่อนการเผยแพร่
summary: แก้ไขข้อค้นพบจากการตรวจสอบความถูกต้องของแพ็กเกจ Plugin ของ ClawHub ก่อนเผยแพร่
title: การแก้ไขการตรวจสอบความถูกต้องของ Plugin
x-i18n:
    generated_at: "2026-07-03T10:04:28Z"
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
มีรหัสการบำรุงรักษาสแกนเนอร์โดยไม่มีคำแนะนำการแก้ไขสำหรับผู้เขียน รหัสเหล่านั้น
มีไว้สำหรับผู้ดูแล OpenClaw ไม่ใช่ผู้เขียน Plugin

หลังจากใช้การแก้ไขใดๆ แล้ว ให้รันอีกครั้ง:

```bash
clawhub package validate <path-to-plugin>
```

## ข้อค้นพบสำหรับผู้เขียน

| รหัส                                    | เริ่มที่นี่                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [เพิ่มเมทาดาทาแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [เพิ่มบล็อก openclaw ของแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [ประกาศจุดเข้าใช้งานของแพ็กเกจ OpenClaw](/th/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [เผยแพร่จุดเข้าใช้งานที่ประกาศไว้](/th/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [เติมเมทาดาทาการติดตั้งให้ครบ](/th/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [ประกาศความเข้ากันได้ของ API ของ Plugin](/th/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [จัดให้เวอร์ชันโฮสต์ขั้นต่ำตรงกัน](/th/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [จัดให้เวอร์ชันแพ็กเกจและ manifest ตรงกัน](/th/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [นำเมทาดาทาแพ็กเกจ OpenClaw ที่ไม่รองรับออก](/th/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [ทำให้อาร์ติแฟกต์ npm สามารถแพ็กได้](/th/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [รวมจุดเข้าใช้งานไว้ในเอาต์พุต npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [รวมเมทาดาทาไว้ในเอาต์พุต npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [เพิ่มชื่อที่แสดงของ manifest](/th/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [นำฟิลด์ manifest ที่ไม่รองรับออก](/th/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [นำคีย์สัญญาที่ไม่รองรับออก](/th/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [แทนที่การนำเข้า SDK จากราก](/th/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [นำการนำเข้า SDK ที่สงวนไว้ออก](/th/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [แทนที่การเข้าถึงพื้นที่เก็บเซสชันทั้งชุด](/th/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [แทนที่การเขียนพื้นที่เก็บเซสชันทั้งชุด](/th/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [แทนที่ตัวช่วยพาธไฟล์เซสชัน](/th/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [แทนที่เป้าหมายไฟล์ transcript แบบเดิม](/th/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [แทนที่ตัวช่วย transcript ระดับต่ำ](/th/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [แทนที่ before_agent_start](/th/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [ย้าย env vars ของผู้ให้บริการไปยังเมทาดาทาการตั้งค่า](/th/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [สะท้อน env vars ของช่องทางในเมทาดาทาปัจจุบัน](/th/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [นำการอ้างอิง schema ของ security manifest ที่ใช้ไม่ได้ออก](/th/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [นำไฟล์ security manifest ที่ไม่รองรับออก](/th/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## เมทาดาทาแพ็กเกจ

### package-json-missing

รากแพ็กเกจไม่มี `package.json` ดังนั้น ClawHub จึงไม่สามารถระบุ
แพ็กเกจ npm, เวอร์ชัน, จุดเข้าใช้งาน หรือเมทาดาทา OpenClaw ได้

- เพิ่ม `package.json` พร้อม `name`, `version` และ `type`
- เพิ่มบล็อก `openclaw` เมื่อแพ็กเกจจัดส่ง Plugin ของ OpenClaw
- ใช้ [การสร้าง Plugin](/th/plugins/building-plugins) สำหรับตัวอย่างแพ็กเกจขั้นต่ำ
  และ [Plugin manifest](/th/plugins/manifest#manifest-versus-packagejson)
  สำหรับการแยกระหว่างแพ็กเกจและ manifest
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-metadata-missing

แพ็กเกจมี `package.json` แต่ไม่ได้ประกาศเมทาดาทาแพ็กเกจ
OpenClaw

- เพิ่ม `package.json#openclaw`
- รวมเมทาดาทาจุดเข้าใช้งาน เช่น `openclaw.extensions` หรือ
  `openclaw.runtimeExtensions`
- เพิ่มเมทาดาทาความเข้ากันได้และการติดตั้งเมื่อแพ็กเกจจะถูกเผยแพร่หรือ
  ติดตั้งผ่าน ClawHub
- ดู [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-entry-missing

มีเมทาดาทาแพ็กเกจอยู่แล้ว แต่ไม่ได้ประกาศจุดเข้าใช้งาน runtime ของ
OpenClaw

- เพิ่ม `openclaw.extensions` สำหรับจุดเข้าใช้งาน Plugin แบบเนทีฟ
- เพิ่ม `openclaw.runtimeExtensions` เมื่อแพ็กเกจที่เผยแพร่ควรโหลด JavaScript
  ที่ build แล้ว
- เก็บพาธจุดเข้าใช้งานทั้งหมดไว้ภายในไดเรกทอรีแพ็กเกจ
- ดู [จุดเข้าใช้งาน Plugin](/th/plugins/sdk-entrypoints) และ
  [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-entrypoint-missing

แพ็กเกจประกาศจุดเข้าใช้งาน OpenClaw แต่ไฟล์ที่อ้างอิงขาดหายไป
จากแพ็กเกจที่กำลังตรวจสอบ

- ตรวจสอบแต่ละพาธใน `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` และ `openclaw.runtimeSetupEntry`
- build แพ็กเกจหากจุดเข้าใช้งานถูกสร้างลงใน `dist`
- อัปเดตเมทาดาทาหากจุดเข้าใช้งานถูกย้าย
- ดู [จุดเข้าใช้งาน Plugin](/th/plugins/sdk-entrypoints)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-install-metadata-incomplete

ClawHub ไม่สามารถบอกได้ว่าควรติดตั้งหรืออัปเดตแพ็กเกจอย่างไร

- เติม `openclaw.install` ด้วยแหล่งติดตั้งที่รองรับ เช่น
  `clawhubSpec`, `npmSpec` หรือ `localPath`
- ตั้งค่า `openclaw.install.defaultChoice` เมื่อมีแหล่งติดตั้งมากกว่าหนึ่งแหล่ง
- ใช้ `openclaw.install.minHostVersion` สำหรับเวอร์ชันโฮสต์ OpenClaw ขั้นต่ำ
- ดู [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-plugin-api-compat-missing

แพ็กเกจไม่ได้ประกาศช่วง API ของ Plugin OpenClaw ที่รองรับ

- เพิ่ม `openclaw.compat.pluginApi` ใน `package.json`
- ใช้เวอร์ชัน API ของ Plugin OpenClaw หรือ semver floor ที่คุณ build และทดสอบ
  เทียบไว้
- แยกค่านี้ออกจากเวอร์ชันแพ็กเกจ เวอร์ชันแพ็กเกจอธิบายการปล่อย
  Plugin ส่วน `openclaw.compat.pluginApi` อธิบายสัญญา API ของโฮสต์
- ดู [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-min-host-version-drift

เวอร์ชันโฮสต์ขั้นต่ำของแพ็กเกจไม่ตรงกับเมทาดาทาเวอร์ชัน OpenClaw
ที่ใช้ build แพ็กเกจ

- ตรวจสอบ `openclaw.install.minHostVersion`
- ตรวจสอบเมทาดาทา build ของ OpenClaw ใดๆ ในแพ็กเกจ เช่น เวอร์ชัน OpenClaw
  ที่ใช้ระหว่างการปล่อย
- จัดให้เวอร์ชันโฮสต์ขั้นต่ำตรงกับช่วงเวอร์ชันโฮสต์ที่แพ็กเกจ
  รองรับจริง
- ดู [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-manifest-version-drift

เวอร์ชันแพ็กเกจและเวอร์ชัน manifest ของ Plugin ไม่ตรงกัน

- ควรใช้ `package.json#version` เป็นเวอร์ชันการปล่อยแพ็กเกจ
- หาก `openclaw.plugin.json` มี `version` ด้วย ให้อัปเดตให้ตรงกัน หรือนำ
  เมทาดาทาเวอร์ชัน manifest ที่ล้าสมัยออกเมื่อเมทาดาทาแพ็กเกจเป็นแหล่งอ้างอิงหลัก
- เผยแพร่เวอร์ชันแพ็กเกจใหม่หลังจากเปลี่ยนเมทาดาทาที่เผยแพร่แล้ว
- ดู [Plugin manifest](/th/plugins/manifest)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-unsupported-metadata

บล็อก `package.json#openclaw` มีฟิลด์ที่ไม่รองรับในฐานะ
เมทาดาทาแพ็กเกจ OpenClaw

- นำฟิลด์ที่ไม่รองรับออก เช่น `openclaw.bundle`
- เก็บเมทาดาทา Plugin แบบเนทีฟไว้ใน `openclaw.plugin.json`
- เก็บจุดเข้าใช้งานแพ็กเกจ, ความเข้ากันได้, การติดตั้ง, การตั้งค่า และเมทาดาทาแคตตาล็อก
  ไว้ในฟิลด์ `package.json#openclaw` ที่รองรับ
- ดู [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## อาร์ติแฟกต์ที่เผยแพร่

### package-npm-pack-unavailable

ไม่สามารถแพ็กแพ็กเกจเป็นอาร์ติแฟกต์ที่ ClawHub จะตรวจสอบหรือ
เผยแพร่ได้

- รัน `npm pack --dry-run` จากรากแพ็กเกจ
- แก้ไขเมทาดาทาแพ็กเกจที่ไม่ถูกต้อง, lifecycle scripts ที่เสีย หรือรายการไฟล์
  ที่ทำให้การแพ็กล้มเหลว
- นำ `private: true` ออกหากแพ็กเกจนี้ตั้งใจให้เผยแพร่สาธารณะ
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-entrypoint-missing

แพ็กเกจสามารถแพ็กได้ แต่อาร์ติแฟกต์ที่แพ็กแล้วไม่มีไฟล์
จุดเข้าใช้งานที่ประกาศใน `package.json#openclaw`

- รัน `npm pack --dry-run` และตรวจสอบไฟล์ที่จะถูกรวม
- build จุดเข้าใช้งานที่สร้างขึ้นก่อนแพ็ก
- อัปเดต `files`, `.npmignore` หรือเอาต์พุต build เพื่อให้รวมจุดเข้าใช้งาน
  ที่ประกาศไว้
- ดู [จุดเข้าใช้งาน Plugin](/th/plugins/sdk-entrypoints)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-metadata-missing

อาร์ติแฟกต์ที่แพ็กแล้วขาดเมทาดาทา OpenClaw ที่มีอยู่ในแพ็กเกจ
ต้นทางของคุณ

- รัน `npm pack --dry-run` และตรวจสอบไฟล์เมทาดาทาที่ถูกรวม
- ตรวจสอบให้แน่ใจว่า `package.json` มีบล็อก `openclaw` ในอาร์ติแฟกต์ที่แพ็กแล้ว
- ตรวจสอบให้แน่ใจว่า `openclaw.plugin.json` ถูกรวมเมื่อแพ็กเกจเป็น Plugin
  OpenClaw แบบเนทีฟ
- อัปเดต `files` หรือ `.npmignore` เพื่อไม่ให้เมทาดาทาแพ็กเกจถูกยกเว้น
- ดู [การสร้าง Plugin](/th/plugins/building-plugins)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## เมทาดาทา manifest

### manifest-name-missing

แมนิเฟสต์ Plugin แบบเนทีฟไม่มีชื่อที่แสดง

- เพิ่มฟิลด์ `name` ที่ไม่ว่างใน `openclaw.plugin.json`
- ทำให้ `name` อ่านได้โดยมนุษย์ และคง `id` เป็น id สำหรับเครื่องที่เสถียร
- ดู [แมนิเฟสต์ Plugin](/th/plugins/manifest)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-fields

แมนิเฟสต์ Plugin มีฟิลด์ระดับบนที่ OpenClaw ไม่รองรับ

- เปรียบเทียบฟิลด์ระดับบนแต่ละฟิลด์กับ
  [ข้อมูลอ้างอิงฟิลด์ของแมนิเฟสต์](/th/plugins/manifest#top-level-field-reference)
- ลบฟิลด์แบบกำหนดเองออกจาก `openclaw.plugin.json`
- ย้ายเมตาดาต้าของแพ็กเกจหรือการติดตั้งไปยังฟิลด์ `package.json#openclaw` ที่รองรับ
  แทนแมนิเฟสต์
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-contracts

แมนิเฟสต์ประกาศคีย์ที่ไม่รองรับภายใน `contracts`

- เปรียบเทียบแต่ละคีย์ภายใต้ `contracts` กับ
  [ข้อมูลอ้างอิง contracts](/th/plugins/manifest#contracts-reference)
- ลบคีย์ contract ที่ไม่รองรับ
- ย้ายพฤติกรรมขณะรันไปไว้ในโค้ดการลงทะเบียน Plugin และจำกัด `contracts`
  ให้เป็นเมตาดาต้าการเป็นเจ้าของความสามารถแบบคงที่เท่านั้น
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## SDK และการย้ายความเข้ากันได้

### legacy-root-sdk-import

Plugin นำเข้าจาก root SDK barrel ที่เลิกใช้แล้ว:
`openclaw/plugin-sdk`

- แทนที่การนำเข้าจาก root-barrel ด้วยการนำเข้า public subpath แบบเจาะจง
- ใช้ `openclaw/plugin-sdk/plugin-entry` สำหรับ `definePluginEntry`
- ใช้ `openclaw/plugin-sdk/channel-core` สำหรับตัวช่วย entry ของช่องทาง
- ใช้ [แนวทางการนำเข้า](/th/plugins/building-plugins#import-conventions) และ
  [subpath ของ Plugin SDK](/th/plugins/sdk-subpaths) เพื่อค้นหาการนำเข้าที่แคบลง
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### reserved-sdk-import

Plugin นำเข้า path ของ SDK ที่สงวนไว้สำหรับ Plugin ที่รวมมาด้วยหรือความเข้ากันได้
ภายใน

- แทนที่การนำเข้า SDK ภายในของ OpenClaw ที่สงวนไว้ด้วย subpath สาธารณะ
  `openclaw/plugin-sdk/*` ที่มีเอกสารกำกับ
- หากพฤติกรรมนั้นไม่มี SDK สาธารณะ ให้เก็บตัวช่วยไว้ภายในแพ็กเกจของคุณ หรือ
  ขอ API สาธารณะของ OpenClaw
- ใช้ [subpath ของ Plugin SDK](/th/plugins/sdk-subpaths) และ
  [การย้าย SDK](/th/plugins/sdk-migration) เพื่อเลือกการนำเข้าที่รองรับ
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-load-session-store

Plugin ยังใช้ตัวช่วย whole-session-store ที่เลิกใช้แล้ว
`loadSessionStore`

- ใช้ `getSessionEntry(...)` หรือ `listSessionEntries(...)` เมื่ออ่านสถานะ session
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เมื่อเขียนสถานะ session
- หลีกเลี่ยงการโหลด แก้ไข และบันทึกออบเจ็กต์ session store ทั้งหมด
- คง `loadSessionStore(...)` ไว้เฉพาะเมื่อช่วงความเข้ากันได้ที่คุณประกาศ
  ยังรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [subpath ของ Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-store-write

Plugin ยังใช้ตัวช่วยเขียน whole-session-store ที่เลิกใช้แล้ว เช่น
`saveSessionStore` หรือ `updateSessionStore`

- ใช้ `patchSessionEntry(...)` เมื่ออัปเดตฟิลด์ใน session entry ที่มีอยู่
- ใช้ `upsertSessionEntry(...)` เมื่อแทนที่หรือสร้าง session entry
- หลีกเลี่ยงการโหลด แก้ไข และบันทึกออบเจ็กต์ session store ทั้งหมด
- คงตัวช่วยเขียน whole-store ไว้เฉพาะเมื่อช่วงความเข้ากันได้ที่คุณประกาศ
  ยังรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [subpath ของ Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-file-helper

Plugin ยังใช้ตัวช่วย path ไฟล์ session ที่เลิกใช้แล้ว เช่น
`resolveSessionFilePath` หรือ `resolveAndPersistSessionFile`

- ใช้ `getSessionEntry(...)` เพื่ออ่านเมตาดาต้า session ตาม agent และข้อมูลระบุ session
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เพื่อบันทึกเมตาดาต้า session
- ใช้ข้อมูลระบุ transcript หรือตัวช่วย target เมื่อโค้ดกำลังเตรียมการดำเนินการ
  transcript
- อย่าบันทึกหรือพึ่งพา path ไฟล์ transcript แบบ legacy
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [subpath ของ Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-transcript-file-target

Plugin ยังใช้ตัวช่วย target ไฟล์ transcript ที่เลิกใช้แล้ว
`resolveSessionTranscriptLegacyFileTarget`

- ใช้ `resolveSessionTranscriptIdentity(...)` เมื่อโค้ดต้องการเพียงข้อมูลระบุ session
  แบบสาธารณะ
- ใช้ `resolveSessionTranscriptTarget(...)` เมื่อโค้ดต้องการ target การดำเนินการ
  transcript แบบมีโครงสร้าง
- หลีกเลี่ยงการอ่านหรือสร้าง target ไฟล์ transcript แบบ legacy โดยตรง
- คงตัวช่วย legacy ไว้เฉพาะเมื่อช่วงความเข้ากันได้ที่คุณประกาศยังรองรับ OpenClaw
  เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [subpath ของ Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-transcript-low-level

Plugin ยังใช้ตัวช่วย transcript ระดับต่ำที่เลิกใช้แล้ว เช่น
`appendSessionTranscriptMessage` หรือ `emitSessionTranscriptUpdate`

- ใช้ `appendSessionTranscriptMessageByIdentity(...)` สำหรับการเพิ่ม transcript
- ใช้ `publishSessionTranscriptUpdateByIdentity(...)` สำหรับการแจ้งเตือนการอัปเดต
  transcript
- ควรใช้พื้นผิว runtime ของ transcript แบบมีโครงสร้าง เพื่อให้ OpenClaw ใช้ขอบเขต
  transaction และการจัดการข้อมูลระบุได้อย่างถูกต้อง
- คงตัวช่วย transcript ระดับต่ำไว้เฉพาะเมื่อช่วงความเข้ากันได้ที่คุณประกาศ
  ยังรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [subpath ของ Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### legacy-before-agent-start

Plugin ยังใช้ hook `before_agent_start` แบบ legacy

- ย้ายงาน override model หรือ provider ไปยัง `before_model_resolve`
- ย้ายงานแก้ไข prompt หรือ context ไปยัง `before_prompt_build`
- คง `before_agent_start` ไว้เฉพาะเมื่อช่วงความเข้ากันได้ที่คุณประกาศยังรองรับ
  OpenClaw เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Hooks](/th/plugins/hooks) และ
  [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### provider-auth-env-vars

แมนิเฟสต์ยังใช้เมตาดาต้า auth ของ provider แบบ legacy `providerAuthEnvVars`

- ทำสำเนาเมตาดาต้า env-var ของ provider ไปยัง `setup.providers[].envVars`
- คง `providerAuthEnvVars` ไว้เฉพาะเป็นเมตาดาต้าความเข้ากันได้ ขณะที่ช่วง OpenClaw
  ที่คุณรองรับยังต้องใช้มัน
- ดู [ข้อมูลอ้างอิง setup](/th/plugins/manifest#setup-reference) และ
  [การย้าย SDK](/th/plugins/sdk-migration)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### channel-env-vars

แมนิเฟสต์ใช้เมตาดาต้า env-var ของช่องทางแบบ legacy หรือแบบเก่า โดยไม่มีเมตาดาต้า
setup หรือ config ปัจจุบันที่ ClawHub คาดหวัง

- ทำให้เมตาดาต้า env-var ของช่องทางเป็นแบบ declarative เพื่อให้ OpenClaw ตรวจสอบสถานะ
  setup ได้โดยไม่ต้องโหลด runtime ของช่องทาง
- ทำสำเนา setup ของช่องทางที่ขับเคลื่อนด้วย env ไปยัง setup ปัจจุบัน, config ช่องทาง,
  หรือเมตาดาต้าช่องทางของแพ็กเกจที่รูปแบบ Plugin ของคุณใช้
- คง `channelEnvVars` ไว้เฉพาะเป็นเมตาดาต้าความเข้ากันได้ ขณะที่ OpenClaw เวอร์ชันเก่า
  ที่รองรับยังต้องใช้มัน
- ดู [แมนิเฟสต์ Plugin](/th/plugins/manifest) และ
  [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## แมนิเฟสต์ความปลอดภัย

### security-manifest-schema-unavailable

แพ็กเกจจัดส่ง `openclaw.security.json` พร้อมการอ้างอิง schema ที่ ClawHub
ไม่รู้จักว่าพร้อมใช้งาน

- ลบ URL ของ schema หากเป็นเพียงคำแนะนำเท่านั้น
- ใช้ schema แบบมีเวอร์ชันที่มีเอกสารกำกับหลังจาก OpenClaw เผยแพร่แล้วเท่านั้น
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### unrecognized-security-manifest

แพ็กเกจจัดส่งไฟล์แมนิเฟสต์ความปลอดภัยที่ไม่รองรับ

- ลบ `openclaw.security.json` จนกว่า OpenClaw จะจัดทำเอกสาร schema แมนิเฟสต์ความปลอดภัย
  แบบมีเวอร์ชันและพฤติกรรมของ ClawHub
- เก็บพฤติกรรมที่เกี่ยวกับความปลอดภัยไว้ในเอกสารแพ็กเกจสาธารณะหรือ README
  ของคุณจนกว่าสัญญาแมนิเฟสต์จะมีอยู่
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## ที่เกี่ยวข้อง

- [ClawHub CLI](/th/clawhub/cli)
- [การเผยแพร่ ClawHub](/th/clawhub/publishing)
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [แมนิเฟสต์ Plugin](/th/plugins/manifest)
- [จุดเข้าใช้งานของ Plugin](/th/plugins/sdk-entrypoints)
- [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
