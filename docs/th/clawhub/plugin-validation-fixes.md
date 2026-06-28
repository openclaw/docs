---
read_when:
    - คุณรัน clawhub package validate และต้องแก้ไขข้อค้นพบของ Plugin
    - ClawHub ปฏิเสธหรือเตือนในการเผยแพร่แพ็กเกจ Plugin
    - คุณกำลังอัปเดตเมทาดาต้าของแพ็กเกจ Plugin ก่อนการเผยแพร่
summary: แก้ไขข้อค้นพบจากการตรวจสอบแพ็กเกจ Plugin ของ ClawHub ก่อนเผยแพร่
title: Plugin validation fixes
x-i18n:
    generated_at: "2026-06-28T10:15:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c50f57c8feb79c7ff304ad1c8e115b362795621d7cd4f85f435c44cc75308b9
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# การแก้ไขการตรวจสอบ Plugin

ClawHub ตรวจสอบความถูกต้องของแพ็กเกจ Plugin ก่อนเผยแพร่ และยังสามารถแสดงผลการค้นพบจาก
การสแกนแพ็กเกจอัตโนมัติได้ด้วย หน้านี้ครอบคลุมผลการค้นพบสำหรับผู้เขียน ซึ่งหมายถึง
ผลการค้นพบที่ผู้เขียน Plugin สามารถแก้ไขได้ในเมทาดาทาแพ็กเกจ, manifest, การนำเข้า SDK
หรืออาร์ติแฟกต์ที่เผยแพร่ของตน

หน้านี้ไม่ครอบคลุมผลการค้นพบด้านความครอบคลุมภายในของ Plugin Inspector หากรายงานฉบับเต็ม
มีโค้ดการบำรุงรักษาของสแกนเนอร์โดยไม่มีแนวทางแก้ไขสำหรับผู้เขียน โค้ดเหล่านั้นมีไว้สำหรับ
ผู้ดูแล OpenClaw แทนที่จะเป็นผู้เขียน Plugin

หลังจากใช้การแก้ไขใดๆ แล้ว ให้รันอีกครั้ง:

```bash
clawhub package validate <path-to-plugin>
```

## ผลการค้นพบสำหรับผู้เขียน

| โค้ด                                    | เริ่มที่นี่                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [เพิ่มเมทาดาทาแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [เพิ่มบล็อก openclaw ของแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [ประกาศจุดเข้าของแพ็กเกจ OpenClaw](/th/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [เผยแพร่จุดเข้าที่ประกาศไว้](/th/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [เติมเมทาดาทาการติดตั้งให้ครบถ้วน](/th/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [ประกาศความเข้ากันได้ของ API Plugin](/th/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [จัดเวอร์ชันโฮสต์ขั้นต่ำให้ตรงกัน](/th/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [จัดเวอร์ชันแพ็กเกจและ manifest ให้ตรงกัน](/th/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [นำเมทาดาทาแพ็กเกจ OpenClaw ที่ไม่รองรับออก](/th/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [ทำให้อาร์ติแฟกต์ npm แพ็กได้](/th/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [รวมจุดเข้าไว้ในเอาต์พุต npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [รวมเมทาดาทาไว้ในเอาต์พุต npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [เพิ่มชื่อที่แสดงของ manifest](/th/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [นำฟิลด์ manifest ที่ไม่รองรับออก](/th/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [นำคีย์สัญญาที่ไม่รองรับออก](/th/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [แทนที่การนำเข้า SDK ระดับราก](/th/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [นำการนำเข้า SDK ที่สงวนไว้ออก](/th/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [แทนที่การเข้าถึงพื้นที่จัดเก็บทั้งเซสชัน](/th/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `legacy-before-agent-start`             | [แทนที่ before_agent_start](/th/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [ย้ายตัวแปร env ของผู้ให้บริการไปยังเมทาดาทาการตั้งค่า](/th/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [สะท้อนตัวแปร env ของช่องทางในเมทาดาทาปัจจุบัน](/th/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [นำการอ้างอิงสคีมา manifest ความปลอดภัยที่ไม่พร้อมใช้งานออก](/th/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [นำไฟล์ manifest ความปลอดภัยที่ไม่รองรับออก](/th/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## เมทาดาทาแพ็กเกจ

### package-json-missing

รากของแพ็กเกจไม่มี `package.json` ดังนั้น ClawHub จึงไม่สามารถระบุ
แพ็กเกจ npm, เวอร์ชัน, จุดเข้า หรือเมทาดาทา OpenClaw ได้

- เพิ่ม `package.json` พร้อม `name`, `version` และ `type`
- เพิ่มบล็อก `openclaw` เมื่อแพ็กเกจส่งมอบ Plugin ของ OpenClaw
- ใช้ [การสร้าง Plugin](/th/plugins/building-plugins) สำหรับตัวอย่างแพ็กเกจขั้นต่ำ
  และ [Plugin manifest](/th/plugins/manifest#manifest-versus-packagejson)
  สำหรับการแยกส่วนระหว่างแพ็กเกจกับ manifest
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-metadata-missing

แพ็กเกจมี `package.json` แต่ไม่ได้ประกาศเมทาดาทาแพ็กเกจ
OpenClaw

- เพิ่ม `package.json#openclaw`
- รวมเมทาดาทาจุดเข้า เช่น `openclaw.extensions` หรือ
  `openclaw.runtimeExtensions`
- เพิ่มเมทาดาทาความเข้ากันได้และการติดตั้งเมื่อแพ็กเกจจะถูกเผยแพร่หรือ
  ติดตั้งผ่าน ClawHub
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-entry-missing

มีเมทาดาทาแพ็กเกจอยู่แล้ว แต่ไม่ได้ประกาศจุดเข้ารันไทม์
OpenClaw

- เพิ่ม `openclaw.extensions` สำหรับจุดเข้า Plugin แบบเนทีฟ
- เพิ่ม `openclaw.runtimeExtensions` เมื่อแพ็กเกจที่เผยแพร่ควรโหลด JavaScript
  ที่ build แล้ว
- เก็บพาธจุดเข้าทั้งหมดไว้ภายในไดเรกทอรีแพ็กเกจ
- ดู [จุดเข้า Plugin](/th/plugins/sdk-entrypoints) และ
  [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-entrypoint-missing

แพ็กเกจประกาศจุดเข้า OpenClaw แล้ว แต่ไฟล์ที่อ้างอิงหายไป
จากแพ็กเกจที่กำลังตรวจสอบ

- ตรวจสอบแต่ละพาธใน `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` และ `openclaw.runtimeSetupEntry`
- Build แพ็กเกจหากจุดเข้าถูกสร้างเข้าไปใน `dist`
- อัปเดตเมทาดาทาหากจุดเข้าถูกย้าย
- ดู [จุดเข้า Plugin](/th/plugins/sdk-entrypoints)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-install-metadata-incomplete

ClawHub ไม่สามารถบอกได้ว่าควรติดตั้งหรืออัปเดตแพ็กเกจอย่างไร

- เติม `openclaw.install` ด้วยแหล่งติดตั้งที่รองรับ เช่น
  `clawhubSpec`, `npmSpec` หรือ `localPath`
- ตั้งค่า `openclaw.install.defaultChoice` เมื่อมีแหล่งติดตั้งมากกว่าหนึ่งแหล่ง
  พร้อมใช้งาน
- ใช้ `openclaw.install.minHostVersion` สำหรับเวอร์ชันโฮสต์ OpenClaw ขั้นต่ำ
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-plugin-api-compat-missing

แพ็กเกจไม่ได้ประกาศช่วง API Plugin ของ OpenClaw ที่รองรับ

- เพิ่ม `openclaw.compat.pluginApi` ไปยัง `package.json`
- ใช้เวอร์ชัน API Plugin ของ OpenClaw หรือค่า semver ขั้นต่ำที่คุณสร้างและทดสอบ
  ด้วย
- แยกสิ่งนี้ออกจากเวอร์ชันแพ็กเกจ เวอร์ชันแพ็กเกจอธิบาย
  รุ่นของ Plugin; `openclaw.compat.pluginApi` อธิบายสัญญา API ของโฮสต์
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-min-host-version-drift

เวอร์ชันโฮสต์ขั้นต่ำของแพ็กเกจไม่ตรงกับเมทาดาทาเวอร์ชัน OpenClaw
ที่แพ็กเกจถูกสร้างอ้างอิง

- ตรวจสอบ `openclaw.install.minHostVersion`
- ตรวจสอบเมทาดาทาการ build ของ OpenClaw ใดๆ ในแพ็กเกจ เช่น เวอร์ชัน OpenClaw
  ที่ใช้ระหว่างการเผยแพร่
- จัดเวอร์ชันโฮสต์ขั้นต่ำให้ตรงกับช่วงเวอร์ชันโฮสต์ที่แพ็กเกจ
  รองรับจริง
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-manifest-version-drift

เวอร์ชันแพ็กเกจและเวอร์ชัน manifest ของ Plugin ไม่ตรงกัน

- ควรใช้ `package.json#version` เป็นเวอร์ชันเผยแพร่ของแพ็กเกจ
- หาก `openclaw.plugin.json` มี `version` ด้วย ให้อัปเดตให้ตรงกันหรือเอา
  เมทาดาทาเวอร์ชัน manifest ที่ล้าสมัยออกเมื่อเมทาดาทาแพ็กเกจเป็นแหล่งข้อมูลหลัก
- เผยแพร่แพ็กเกจเวอร์ชันใหม่หลังจากเปลี่ยนเมทาดาทาที่เผยแพร่แล้ว
- ดู [Plugin manifest](/th/plugins/manifest)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-unsupported-metadata

บล็อก `package.json#openclaw` มีฟิลด์ที่ไม่ใช่เมทาดาทาแพ็กเกจ
OpenClaw ที่รองรับ

- นำฟิลด์ที่ไม่รองรับออก เช่น `openclaw.bundle`
- เก็บเมทาดาทา Plugin แบบเนทีฟไว้ใน `openclaw.plugin.json`
- เก็บจุดเข้าแพ็กเกจ, ความเข้ากันได้, การติดตั้ง, การตั้งค่า และเมทาดาทาแค็ตตาล็อก
  ไว้ในฟิลด์ `package.json#openclaw` ที่รองรับ
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## อาร์ติแฟกต์ที่เผยแพร่

### package-npm-pack-unavailable

ไม่สามารถแพ็กแพ็กเกจเป็นอาร์ติแฟกต์ที่ ClawHub จะตรวจสอบหรือ
เผยแพร่ได้

- รัน `npm pack --dry-run` จากรากของแพ็กเกจ
- แก้ไขเมทาดาทาแพ็กเกจที่ไม่ถูกต้อง, สคริปต์ lifecycle ที่เสีย หรือรายการ files ที่
  ทำให้การแพ็กล้มเหลว
- นำ `private: true` ออกหากแพ็กเกจนี้ตั้งใจให้เผยแพร่สาธารณะ
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-entrypoint-missing

แพ็กเกจสามารถแพ็กได้ แต่อาร์ติแฟกต์ที่แพ็กแล้วไม่มีไฟล์
จุดเข้าที่ประกาศไว้ใน `package.json#openclaw`

- รัน `npm pack --dry-run` และตรวจสอบไฟล์ที่จะถูกรวมไว้
- Build จุดเข้าที่สร้างขึ้นก่อนแพ็ก
- อัปเดต `files`, `.npmignore` หรือเอาต์พุต build เพื่อให้จุดเข้าที่ประกาศไว้
  ถูกรวมอยู่ด้วย
- ดู [จุดเข้า Plugin](/th/plugins/sdk-entrypoints)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-metadata-missing

อาร์ติแฟกต์ที่แพ็กแล้วขาดเมทาดาทา OpenClaw ที่มีอยู่ในแพ็กเกจ
ต้นทางของคุณ

- รัน `npm pack --dry-run` และตรวจสอบไฟล์เมทาดาทาที่รวมอยู่
- ตรวจสอบให้แน่ใจว่า `package.json` มีบล็อก `openclaw` ในอาร์ติแฟกต์ที่แพ็กแล้ว
- ตรวจสอบให้แน่ใจว่า `openclaw.plugin.json` ถูกรวมไว้เมื่อแพ็กเกจเป็น Plugin
  OpenClaw แบบเนทีฟ
- อัปเดต `files` หรือ `.npmignore` เพื่อไม่ให้เมทาดาทาแพ็กเกจถูกแยกออก
- ดู [การสร้าง Plugin](/th/plugins/building-plugins)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

## เมทาดาทา manifest

### manifest-name-missing

manifest ของ Plugin แบบเนทีฟไม่มีชื่อที่แสดง

- เพิ่มฟิลด์ `name` ที่ไม่ว่างลงใน `openclaw.plugin.json`
- ทำให้ `name` อ่านเข้าใจได้สำหรับมนุษย์ และให้ `id` เป็นรหัสเครื่องที่เสถียร
- ดู [Plugin manifest](/th/plugins/manifest)
- รัน `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-fields

manifest ของ Plugin มีฟิลด์ระดับบนสุดที่ OpenClaw ไม่รองรับ

- เปรียบเทียบแต่ละฟิลด์ระดับบนสุดกับ
  [เอกสารอ้างอิงฟิลด์ของแมนิเฟสต์](/th/plugins/manifest#top-level-field-reference)
- ลบฟิลด์แบบกำหนดเองออกจาก `openclaw.plugin.json`
- ย้ายเมทาดาทาของแพ็กเกจหรือการติดตั้งไปไว้ในฟิลด์ `package.json#openclaw` ที่รองรับ
  แทนการใส่ไว้ในแมนิเฟสต์
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-contracts

แมนิเฟสต์ประกาศคีย์ที่ไม่รองรับไว้ภายใน `contracts`

- เปรียบเทียบแต่ละคีย์ภายใต้ `contracts` กับ
  [เอกสารอ้างอิง contracts](/th/plugins/manifest#contracts-reference)
- ลบคีย์ contract ที่ไม่รองรับ
- ย้ายพฤติกรรมรันไทม์ไปไว้ในโค้ดการลงทะเบียน Plugin และจำกัด `contracts`
  ให้มีเฉพาะเมทาดาทาการเป็นเจ้าของความสามารถแบบคงที่
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## การย้าย SDK และความเข้ากันได้

### legacy-root-sdk-import

Plugin นำเข้าจาก root SDK barrel ที่เลิกใช้แล้ว:
`openclaw/plugin-sdk`

- แทนที่การนำเข้าจาก root-barrel ด้วยการนำเข้าจาก subpath สาธารณะที่เฉพาะเจาะจง
- ใช้ `openclaw/plugin-sdk/plugin-entry` สำหรับ `definePluginEntry`
- ใช้ `openclaw/plugin-sdk/channel-core` สำหรับตัวช่วย entry ของช่องทาง
- ใช้ [แนวทางการนำเข้า](/th/plugins/building-plugins#import-conventions) และ
  [subpath ของ Plugin SDK](/th/plugins/sdk-subpaths) เพื่อหาการนำเข้าที่แคบลง
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### reserved-sdk-import

Plugin นำเข้าเส้นทาง SDK ที่สงวนไว้สำหรับ Plugin แบบ bundled หรือความเข้ากันได้ภายใน

- แทนที่การนำเข้า SDK ภายในของ OpenClaw ที่สงวนไว้ด้วย subpath
  `openclaw/plugin-sdk/*` สาธารณะที่มีเอกสารรองรับ
- หากพฤติกรรมนั้นไม่มี SDK สาธารณะ ให้เก็บตัวช่วยไว้ภายในแพ็กเกจของคุณ หรือ
  ขอ API สาธารณะจาก OpenClaw
- ใช้ [subpath ของ Plugin SDK](/th/plugins/sdk-subpaths) และ
  [การย้าย SDK](/th/plugins/sdk-migration) เพื่อเลือกการนำเข้าที่รองรับ
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-load-session-store

Plugin ยังใช้ตัวช่วย whole-session-store ที่เลิกใช้แล้ว
`loadSessionStore`

- ใช้ `getSessionEntry(...)` หรือ `listSessionEntries(...)` เมื่ออ่านสถานะเซสชัน
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เมื่อเขียนสถานะเซสชัน
- หลีกเลี่ยงการโหลด แก้ไข และบันทึกออบเจ็กต์ session store ทั้งหมด
- เก็บ `loadSessionStore(...)` ไว้เฉพาะขณะที่ช่วงความเข้ากันได้ที่คุณประกาศ
  ยังรองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [subpath ของ Plugin SDK](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### legacy-before-agent-start

Plugin ยังใช้ hook `before_agent_start` แบบ legacy

- ย้ายงาน override โมเดลหรือ provider ไปที่ `before_model_resolve`
- ย้ายงานแก้ไข prompt หรือ context ไปที่ `before_prompt_build`
- เก็บ `before_agent_start` ไว้เฉพาะขณะที่ช่วงความเข้ากันได้ที่คุณประกาศยัง
  รองรับ OpenClaw เวอร์ชันเก่าที่ต้องใช้มัน
- ดู [Hooks](/th/plugins/hooks) และ
  [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### provider-auth-env-vars

แมนิเฟสต์ยังใช้เมทาดาทาการยืนยันตัวตนของ provider แบบ legacy `providerAuthEnvVars`

- สะท้อนเมทาดาทา env-var ของ provider ไปไว้ใน `setup.providers[].envVars`
- เก็บ `providerAuthEnvVars` ไว้เป็นเมทาดาทาความเข้ากันได้เท่านั้น ขณะที่ช่วง
  OpenClaw ที่คุณรองรับยังต้องใช้มัน
- ดู [เอกสารอ้างอิง setup](/th/plugins/manifest#setup-reference) และ
  [การย้าย SDK](/th/plugins/sdk-migration)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### channel-env-vars

แมนิเฟสต์ใช้เมทาดาทา env-var ของช่องทางแบบ legacy หรือเก่ากว่า โดยไม่มีเมทาดาทา setup หรือ config ปัจจุบันที่ ClawHub คาดหวัง

- ทำให้เมทาดาทา env-var ของช่องทางเป็นแบบประกาศ เพื่อให้ OpenClaw ตรวจสอบสถานะ setup
  ได้โดยไม่ต้องโหลดรันไทม์ของช่องทาง
- สะท้อน setup ช่องทางที่ขับเคลื่อนด้วย env ไปไว้ใน setup ปัจจุบัน, config ช่องทาง หรือ
  เมทาดาทาช่องทางของแพ็กเกจที่รูปแบบ Plugin ของคุณใช้
- เก็บ `channelEnvVars` ไว้เป็นเมทาดาทาความเข้ากันได้เท่านั้น ขณะที่ OpenClaw
  เวอร์ชันเก่าที่รองรับยังต้องใช้มัน
- ดู [แมนิเฟสต์ Plugin](/th/plugins/manifest) และ
  [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## แมนิเฟสต์ความปลอดภัย

### security-manifest-schema-unavailable

แพ็กเกจจัดส่ง `openclaw.security.json` พร้อมการอ้างอิงสคีมาที่ ClawHub
ไม่รู้จักว่าพร้อมใช้งาน

- ลบ URL ของสคีมาออก หากเป็นเพียงคำแนะนำ
- ใช้สคีมาแบบมีเวอร์ชันที่มีเอกสารรองรับ หลังจาก OpenClaw เผยแพร่แล้วเท่านั้น
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### unrecognized-security-manifest

แพ็กเกจจัดส่งไฟล์แมนิเฟสต์ความปลอดภัยที่ไม่รองรับ

- ลบ `openclaw.security.json` ออกจนกว่า OpenClaw จะจัดทำเอกสารสคีมาแมนิเฟสต์ความปลอดภัย
  แบบมีเวอร์ชันและพฤติกรรมของ ClawHub
- เก็บพฤติกรรมที่อ่อนไหวด้านความปลอดภัยไว้ในเอกสารแพ็กเกจสาธารณะหรือ
  README ของคุณ จนกว่าสัญญาของแมนิเฟสต์จะมีอยู่
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## ที่เกี่ยวข้อง

- [ClawHub CLI](/th/clawhub/cli)
- [การเผยแพร่ผ่าน ClawHub](/th/clawhub/publishing)
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [แมนิเฟสต์ Plugin](/th/plugins/manifest)
- [จุดเข้าใช้งานของ Plugin](/th/plugins/sdk-entrypoints)
- [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
