---
read_when:
    - คุณรัน `clawhub package validate` และต้องแก้ไขข้อค้นพบของ Plugin
    - ClawHub ปฏิเสธหรือเตือนในการเผยแพร่แพ็กเกจ Plugin
    - คุณกำลังอัปเดตข้อมูลเมตาของแพ็กเกจ Plugin ก่อนการเผยแพร่
summary: แก้ไขข้อค้นพบจากการตรวจสอบความถูกต้องของแพ็กเกจ Plugin ของ ClawHub ก่อนเผยแพร่
title: การแก้ไขการตรวจสอบความถูกต้องของ Plugin
x-i18n:
    generated_at: "2026-06-28T22:33:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c50f57c8feb79c7ff304ad1c8e115b362795621d7cd4f85f435c44cc75308b9
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# การแก้ไขการตรวจสอบ Plugin

ClawHub ตรวจสอบแพ็กเกจ Plugin ก่อนเผยแพร่ และยังสามารถแสดงผลการตรวจพบจาก
การสแกนแพ็กเกจอัตโนมัติได้ด้วย หน้านี้ครอบคลุมผลการตรวจพบที่เกี่ยวข้องกับผู้เขียน ซึ่งหมายถึง
ผลการตรวจพบที่ผู้เขียน Plugin สามารถแก้ไขได้ในเมทาดาทาแพ็กเกจ, manifest, การนำเข้า SDK
หรืออาร์ทิแฟกต์ที่เผยแพร่ของตน

หน้านี้ไม่ครอบคลุมผลการตรวจพบความครอบคลุมภายในของ Plugin Inspector หากรายงานฉบับเต็ม
มีรหัสการบำรุงรักษาสแกนเนอร์โดยไม่มีคำแนะนำการแก้ไขสำหรับผู้เขียน รหัสเหล่านั้นมีไว้สำหรับ
ผู้ดูแล OpenClaw ไม่ใช่ผู้เขียน Plugin

หลังจากปรับใช้การแก้ไขใดๆ แล้ว ให้เรียกซ้ำ:

```bash
clawhub package validate <path-to-plugin>
```

## ผลการตรวจพบที่เกี่ยวข้องกับผู้เขียน

| รหัส                                    | เริ่มที่นี่                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [เพิ่มเมทาดาทาแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [เพิ่มบล็อก openclaw ของแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [ประกาศ entrypoint ของแพ็กเกจ OpenClaw](/th/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [เผยแพร่ entrypoint ที่ประกาศไว้](/th/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [เติมเมทาดาทาการติดตั้งให้ครบถ้วน](/th/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [ประกาศความเข้ากันได้ของ API ของ Plugin](/th/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [จัดแนวเวอร์ชันโฮสต์ขั้นต่ำ](/th/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [จัดแนวเวอร์ชันแพ็กเกจและ manifest](/th/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [ลบเมทาดาทาแพ็กเกจ OpenClaw ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [ทำให้อาร์ทิแฟกต์ npm สามารถแพ็กได้](/th/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [รวม entrypoint ในเอาต์พุต npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [รวมเมทาดาทาในเอาต์พุต npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [เพิ่มชื่อที่แสดงใน manifest](/th/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [ลบฟิลด์ manifest ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [ลบคีย์ contract ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [แทนที่การนำเข้า SDK จาก root](/th/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [ลบการนำเข้า SDK ที่สงวนไว้](/th/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [แทนที่การเข้าถึง session store ทั้งหมด](/th/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `legacy-before-agent-start`             | [แทนที่ before_agent_start](/th/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [ย้าย env vars ของ provider ไปยังเมทาดาทาการตั้งค่า](/th/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [สะท้อน env vars ของ channel ในเมทาดาทาปัจจุบัน](/th/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [ลบการอ้างอิง schema ของ security manifest ที่ไม่มีให้ใช้](/th/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [ลบไฟล์ security manifest ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## เมทาดาทาแพ็กเกจ

### package-json-missing

root ของแพ็กเกจไม่มี `package.json` ดังนั้น ClawHub จึงไม่สามารถระบุ
แพ็กเกจ npm, เวอร์ชัน, entrypoint หรือเมทาดาทา OpenClaw ได้

- เพิ่ม `package.json` พร้อม `name`, `version` และ `type`
- เพิ่มบล็อก `openclaw` เมื่อแพ็กเกจจัดส่ง Plugin ของ OpenClaw
- ใช้ [การสร้าง Plugin](/th/plugins/building-plugins) สำหรับตัวอย่างแพ็กเกจขั้นต่ำ
  และ [Plugin manifest](/th/plugins/manifest#manifest-versus-packagejson)
  สำหรับการแยกแพ็กเกจกับ manifest
- เรียก `clawhub package validate <path-to-plugin>` ซ้ำ

### package-openclaw-metadata-missing

แพ็กเกจมี `package.json` แต่ไม่ได้ประกาศเมทาดาทาแพ็กเกจ
OpenClaw

- เพิ่ม `package.json#openclaw`
- รวมเมทาดาทา entrypoint เช่น `openclaw.extensions` หรือ
  `openclaw.runtimeExtensions`
- เพิ่มเมทาดาทาความเข้ากันได้และการติดตั้งเมื่อแพ็กเกจจะถูกเผยแพร่หรือ
  ติดตั้งผ่าน ClawHub
- ดู [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียก `clawhub package validate <path-to-plugin>` ซ้ำ

### package-openclaw-entry-missing

มีเมทาดาทาแพ็กเกจอยู่แล้ว แต่ไม่ได้ประกาศ entrypoint ของ runtime
OpenClaw

- เพิ่ม `openclaw.extensions` สำหรับ entrypoint ของ Plugin แบบ native
- เพิ่ม `openclaw.runtimeExtensions` เมื่อแพ็กเกจที่เผยแพร่ควรโหลด JavaScript
  ที่ build แล้ว
- เก็บพาธ entrypoint ทั้งหมดไว้ภายในไดเรกทอรีแพ็กเกจ
- ดู [จุดเข้าใช้งานของ Plugin](/th/plugins/sdk-entrypoints) และ
  [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียก `clawhub package validate <path-to-plugin>` ซ้ำ

### package-entrypoint-missing

แพ็กเกจประกาศ entrypoint ของ OpenClaw แต่ไฟล์ที่อ้างอิงหายไป
จากแพ็กเกจที่กำลังตรวจสอบ

- ตรวจสอบแต่ละพาธใน `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` และ `openclaw.runtimeSetupEntry`
- build แพ็กเกจหาก entrypoint ถูกสร้างเข้าไปใน `dist`
- อัปเดตเมทาดาทาหาก entrypoint ถูกย้าย
- ดู [จุดเข้าใช้งานของ Plugin](/th/plugins/sdk-entrypoints)
- เรียก `clawhub package validate <path-to-plugin>` ซ้ำ

### package-install-metadata-incomplete

ClawHub ไม่สามารถบอกได้ว่าควรติดตั้งหรืออัปเดตแพ็กเกจอย่างไร

- เติม `openclaw.install` ด้วยแหล่งติดตั้งที่รองรับ เช่น
  `clawhubSpec`, `npmSpec` หรือ `localPath`
- ตั้งค่า `openclaw.install.defaultChoice` เมื่อมีแหล่งติดตั้งมากกว่าหนึ่งแหล่ง
  ให้ใช้ได้
- ใช้ `openclaw.install.minHostVersion` สำหรับเวอร์ชันโฮสต์ OpenClaw ขั้นต่ำ
- ดู [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียก `clawhub package validate <path-to-plugin>` ซ้ำ

### package-plugin-api-compat-missing

แพ็กเกจไม่ได้ประกาศช่วง API ของ Plugin OpenClaw ที่รองรับ

- เพิ่ม `openclaw.compat.pluginApi` ไปยัง `package.json`
- ใช้เวอร์ชัน API ของ Plugin OpenClaw หรือ semver floor ที่คุณ build และทดสอบ
  เทียบไว้
- แยกค่านี้ออกจากเวอร์ชันแพ็กเกจ เวอร์ชันแพ็กเกจอธิบายรุ่นของ
  Plugin; `openclaw.compat.pluginApi` อธิบาย contract ของ API โฮสต์
- ดู [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียก `clawhub package validate <path-to-plugin>` ซ้ำ

### package-min-host-version-drift

เวอร์ชันโฮสต์ขั้นต่ำของแพ็กเกจไม่ตรงกับเมทาดาทาเวอร์ชัน OpenClaw
ที่ใช้ build แพ็กเกจ

- ตรวจสอบ `openclaw.install.minHostVersion`
- ตรวจสอบเมทาดาทาการ build ของ OpenClaw ในแพ็กเกจ เช่น เวอร์ชัน OpenClaw
  ที่ใช้ระหว่างการ release
- จัดแนวเวอร์ชันโฮสต์ขั้นต่ำให้ตรงกับช่วงเวอร์ชันโฮสต์ที่แพ็กเกจ
  รองรับจริง
- ดู [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียก `clawhub package validate <path-to-plugin>` ซ้ำ

### package-manifest-version-drift

เวอร์ชันแพ็กเกจและเวอร์ชัน manifest ของ Plugin ไม่ตรงกัน

- ควรใช้ `package.json#version` เป็นเวอร์ชัน release ของแพ็กเกจ
- หาก `openclaw.plugin.json` มี `version` ด้วย ให้อัปเดตให้ตรงกันหรือลบ
  เมทาดาทาเวอร์ชัน manifest ที่ล้าสมัยเมื่อเมทาดาทาแพ็กเกจเป็นแหล่งข้อมูลหลัก
- เผยแพร่เวอร์ชันแพ็กเกจใหม่หลังจากเปลี่ยนเมทาดาทาที่เผยแพร่แล้ว
- ดู [Plugin manifest](/th/plugins/manifest)
- เรียก `clawhub package validate <path-to-plugin>` ซ้ำ

### package-openclaw-unsupported-metadata

บล็อก `package.json#openclaw` มีฟิลด์ที่ไม่รองรับในฐานะ
เมทาดาทาแพ็กเกจ OpenClaw

- ลบฟิลด์ที่ไม่รองรับ เช่น `openclaw.bundle`
- เก็บเมทาดาทา Plugin แบบ native ไว้ใน `openclaw.plugin.json`
- เก็บ entrypoint ของแพ็กเกจ, ความเข้ากันได้, การติดตั้ง, การตั้งค่า และเมทาดาทา catalog
  ไว้ในฟิลด์ `package.json#openclaw` ที่รองรับ
- ดู [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียก `clawhub package validate <path-to-plugin>` ซ้ำ

## อาร์ทิแฟกต์ที่เผยแพร่

### package-npm-pack-unavailable

ไม่สามารถแพ็กแพ็กเกจเป็นอาร์ทิแฟกต์ที่ ClawHub จะตรวจสอบหรือ
เผยแพร่ได้

- เรียก `npm pack --dry-run` จาก root ของแพ็กเกจ
- แก้ไขเมทาดาทาแพ็กเกจที่ไม่ถูกต้อง, lifecycle scripts ที่เสีย หรือรายการ files ที่
  ทำให้การแพ็กล้มเหลว
- ลบ `private: true` หากแพ็กเกจนี้ตั้งใจให้เผยแพร่แบบสาธารณะ
- เรียก `clawhub package validate <path-to-plugin>` ซ้ำ

### package-npm-pack-entrypoint-missing

แพ็กเกจสามารถแพ็กได้ แต่อาร์ทิแฟกต์ที่แพ็กแล้วไม่มีไฟล์
entrypoint ที่ประกาศไว้ใน `package.json#openclaw`

- เรียก `npm pack --dry-run` และตรวจสอบไฟล์ที่จะถูกรวมไว้
- build entrypoint ที่สร้างขึ้นก่อนแพ็ก
- อัปเดต `files`, `.npmignore` หรือเอาต์พุต build เพื่อให้ entrypoint ที่ประกาศไว้
  ถูกรวมอยู่ด้วย
- ดู [จุดเข้าใช้งานของ Plugin](/th/plugins/sdk-entrypoints)
- เรียก `clawhub package validate <path-to-plugin>` ซ้ำ

### package-npm-pack-metadata-missing

อาร์ทิแฟกต์ที่แพ็กแล้วขาดเมทาดาทา OpenClaw ที่มีอยู่ในแพ็กเกจ
ต้นทางของคุณ

- เรียก `npm pack --dry-run` และตรวจสอบไฟล์เมทาดาทาที่ถูกรวมไว้
- ตรวจสอบให้แน่ใจว่า `package.json` มีบล็อก `openclaw` ในอาร์ทิแฟกต์ที่แพ็กแล้ว
- ตรวจสอบให้แน่ใจว่า `openclaw.plugin.json` ถูกรวมไว้เมื่อแพ็กเกจเป็น Plugin
  OpenClaw แบบ native
- อัปเดต `files` หรือ `.npmignore` เพื่อไม่ให้เมทาดาทาแพ็กเกจถูกยกเว้น
- ดู [การสร้าง Plugin](/th/plugins/building-plugins)
- เรียก `clawhub package validate <path-to-plugin>` ซ้ำ

## เมทาดาทา manifest

### manifest-name-missing

manifest ของ Plugin แบบ native ไม่มีชื่อที่แสดง

- เพิ่มฟิลด์ `name` ที่ไม่ว่างลงใน `openclaw.plugin.json`
- ให้ `name` อ่านเข้าใจได้โดยมนุษย์ และให้ `id` เป็น id ของเครื่องที่เสถียร
- ดู [Plugin manifest](/th/plugins/manifest)
- เรียก `clawhub package validate <path-to-plugin>` ซ้ำ

### manifest-unknown-fields

manifest ของ Plugin มีฟิลด์ระดับบนสุดที่ OpenClaw ไม่รองรับ

- เปรียบเทียบแต่ละฟิลด์ระดับบนสุดกับ
  [ข้อมูลอ้างอิงฟิลด์ manifest](/th/plugins/manifest#top-level-field-reference)
- นำฟิลด์กำหนดเองออกจาก `openclaw.plugin.json`
- ย้ายเมทาดาทา package หรือการติดตั้งไปยังฟิลด์ `package.json#openclaw` ที่รองรับ
  แทน manifest
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-contracts

manifest ประกาศคีย์ที่ไม่รองรับภายใน `contracts`

- เปรียบเทียบแต่ละคีย์ภายใต้ `contracts` กับ
  [ข้อมูลอ้างอิง contracts](/th/plugins/manifest#contracts-reference)
- นำคีย์ contract ที่ไม่รองรับออก
- ย้ายพฤติกรรม runtime ไปไว้ในโค้ดลงทะเบียน plugin และจำกัด `contracts`
  ให้เป็นเมทาดาทาความเป็นเจ้าของความสามารถแบบคงที่เท่านั้น
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## การย้าย SDK และความเข้ากันได้

### legacy-root-sdk-import

plugin นำเข้าจาก barrel SDK รากที่เลิกใช้แล้ว:
`openclaw/plugin-sdk`

- แทนที่การนำเข้าจาก root-barrel ด้วยการนำเข้าจาก subpath สาธารณะที่เจาะจง
- ใช้ `openclaw/plugin-sdk/plugin-entry` สำหรับ `definePluginEntry`
- ใช้ `openclaw/plugin-sdk/channel-core` สำหรับตัวช่วย entry ของช่องทาง
- ใช้ [แบบแผนการนำเข้า](/th/plugins/building-plugins#import-conventions) และ
  [subpath ของ Plugin SDK](/th/plugins/sdk-subpaths) เพื่อค้นหา import ที่แคบลง
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### reserved-sdk-import

plugin นำเข้าเส้นทาง SDK ที่สงวนไว้สำหรับ plugin ที่ bundled หรือความเข้ากันได้
ภายใน

- แทนที่การนำเข้า SDK ภายในของ OpenClaw ที่สงวนไว้ด้วย subpath สาธารณะ
  `openclaw/plugin-sdk/*` ที่มีเอกสารกำกับ
- หากพฤติกรรมไม่มี SDK สาธารณะ ให้เก็บตัวช่วยไว้ภายใน package ของคุณ หรือ
  ขอ API สาธารณะของ OpenClaw
- ใช้ [subpath ของ Plugin SDK](/th/plugins/sdk-subpaths) และ
  [การย้าย SDK](/th/plugins/sdk-migration) เพื่อเลือก import ที่รองรับ
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-load-session-store

plugin ยังคงใช้ตัวช่วย whole-session-store ที่เลิกใช้แล้ว
`loadSessionStore`

- ใช้ `getSessionEntry(...)` หรือ `listSessionEntries(...)` เมื่ออ่านสถานะ session
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เมื่อเขียนสถานะ session
- หลีกเลี่ยงการโหลด แก้ไข และบันทึกออบเจ็กต์ session store ทั้งหมด
- เก็บ `loadSessionStore(...)` ไว้เฉพาะขณะที่ช่วงความเข้ากันได้ที่คุณประกาศ
  ยังรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [subpath ของ Plugin SDK](/th/plugins/sdk-subpaths)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### legacy-before-agent-start

plugin ยังคงใช้ hook `before_agent_start` แบบ legacy

- ย้ายงาน override โมเดลหรือ provider ไปยัง `before_model_resolve`
- ย้ายงานแก้ไข prompt หรือ context ไปยัง `before_prompt_build`
- เก็บ `before_agent_start` ไว้เฉพาะขณะที่ช่วงความเข้ากันได้ที่คุณประกาศยัง
  รองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Hooks](/th/plugins/hooks) และ
  [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### provider-auth-env-vars

manifest ยังคงใช้เมทาดาทา auth ของ provider แบบ legacy `providerAuthEnvVars`

- ทำสำเนาเมทาดาทา env-var ของ provider ไปยัง `setup.providers[].envVars`
- เก็บ `providerAuthEnvVars` ไว้เป็นเมทาดาทาความเข้ากันได้เท่านั้น ขณะที่ช่วง
  OpenClaw ที่คุณรองรับยังต้องใช้มัน
- ดู [ข้อมูลอ้างอิง setup](/th/plugins/manifest#setup-reference) และ
  [การย้าย SDK](/th/plugins/sdk-migration)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### channel-env-vars

manifest ใช้เมทาดาทา env-var ของช่องทางแบบ legacy หรือแบบเก่า โดยไม่มี
เมทาดาทา setup หรือ config ปัจจุบันที่ ClawHub คาดหวัง

- เก็บเมทาดาทา env-var ของช่องทางให้เป็นแบบ declarative เพื่อให้ OpenClaw ตรวจสอบสถานะ setup
  ได้โดยไม่ต้องโหลด runtime ของช่องทาง
- ทำสำเนา setup ของช่องทางที่ขับเคลื่อนด้วย env ไปยัง setup, config ของช่องทาง หรือ
  เมทาดาทาช่องทางของ package ปัจจุบันที่รูปแบบ plugin ของคุณใช้
- เก็บ `channelEnvVars` ไว้เป็นเมทาดาทาความเข้ากันได้เท่านั้น ขณะที่ OpenClaw
  เวอร์ชันเก่าที่รองรับยังต้องใช้มัน
- ดู [manifest ของ Plugin](/th/plugins/manifest) และ
  [plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## manifest ความปลอดภัย

### security-manifest-schema-unavailable

package จัดส่ง `openclaw.security.json` พร้อมข้อมูลอ้างอิง schema ที่ ClawHub
ไม่รู้จักว่าพร้อมใช้งาน

- นำ URL ของ schema ออก หากมีไว้เพื่อเป็นคำแนะนำเท่านั้น
- ใช้ schema ที่ระบุเวอร์ชันและมีเอกสารกำกับ หลังจาก OpenClaw เผยแพร่แล้วเท่านั้น
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### unrecognized-security-manifest

package จัดส่งไฟล์ manifest ความปลอดภัยที่ไม่รองรับ

- นำ `openclaw.security.json` ออกจนกว่า OpenClaw จะจัดทำเอกสาร schema manifest
  ความปลอดภัยแบบระบุเวอร์ชันและพฤติกรรมของ ClawHub
- เก็บพฤติกรรมที่เกี่ยวข้องกับความปลอดภัยไว้ในเอกสาร package สาธารณะหรือ
  README ของคุณ จนกว่าจะมี contract ของ manifest
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## ที่เกี่ยวข้อง

- [ClawHub CLI](/th/clawhub/cli)
- [การเผยแพร่ ClawHub](/th/clawhub/publishing)
- [การสร้าง plugins](/th/plugins/building-plugins)
- [manifest ของ Plugin](/th/plugins/manifest)
- [entry point ของ Plugin](/th/plugins/sdk-entrypoints)
- [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
