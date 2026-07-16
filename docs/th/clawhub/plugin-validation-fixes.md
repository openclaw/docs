---
read_when:
    - คุณได้เรียกใช้ clawhub package validate และต้องแก้ไขข้อบกพร่องที่พบใน Plugin
    - ClawHub ปฏิเสธหรือแสดงคำเตือนระหว่างการเผยแพร่แพ็กเกจ Plugin
    - คุณกำลังอัปเดตข้อมูลเมตาของแพ็กเกจ Plugin ก่อนเผยแพร่
summary: แก้ไขข้อค้นพบจากการตรวจสอบความถูกต้องของแพ็กเกจ Plugin ของ ClawHub ก่อนเผยแพร่
title: การแก้ไขการตรวจสอบความถูกต้องของ Plugin
x-i18n:
    generated_at: "2026-07-16T18:46:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# การแก้ไขปัญหาการตรวจสอบ Plugin

ClawHub ตรวจสอบแพ็กเกจ Plugin ก่อนเผยแพร่และยังสามารถแสดงข้อค้นพบจาก
การสแกนแพ็กเกจอัตโนมัติได้ด้วย หน้านี้ครอบคลุมข้อค้นพบสำหรับผู้เขียน ซึ่งหมายถึง
ข้อค้นพบที่ผู้เขียน Plugin สามารถแก้ไขได้ในข้อมูลเมตาของแพ็กเกจ manifest การนำเข้า
SDK หรืออาร์ติแฟกต์ที่เผยแพร่

หน้านี้ไม่ครอบคลุมข้อค้นพบด้านความครอบคลุมภายในของ Plugin Inspector หากรายงานฉบับเต็ม
มีรหัสการบำรุงรักษาสแกนเนอร์โดยไม่มีคำแนะนำการแก้ไขสำหรับผู้เขียน รหัสเหล่านั้น
มีไว้สำหรับผู้ดูแล OpenClaw ไม่ใช่ผู้เขียน Plugin

หลังจากใช้การแก้ไขใด ๆ แล้ว ให้เรียกใช้อีกครั้ง:

```bash
clawhub package validate <path-to-plugin>
```

## ข้อค้นพบสำหรับผู้เขียน

| รหัส                                    | เริ่มต้นที่นี่                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [เพิ่มข้อมูลเมตาของแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [เพิ่มบล็อก openclaw ของแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [ประกาศจุดเข้าใช้งานของแพ็กเกจ OpenClaw](/th/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [เผยแพร่จุดเข้าใช้งานที่ประกาศไว้](/th/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [กรอกข้อมูลเมตาการติดตั้งให้ครบถ้วน](/th/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [ประกาศความเข้ากันได้ของ API Plugin](/th/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [ปรับเวอร์ชันโฮสต์ขั้นต่ำให้สอดคล้องกัน](/th/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [ปรับเวอร์ชันแพ็กเกจและ manifest ให้สอดคล้องกัน](/th/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [ลบข้อมูลเมตาแพ็กเกจ OpenClaw ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [ทำให้อาร์ติแฟกต์ npm สามารถแพ็กได้](/th/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [รวมจุดเข้าใช้งานในผลลัพธ์ npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [รวมข้อมูลเมตาในผลลัพธ์ npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [เพิ่มชื่อที่แสดงใน manifest](/th/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [ลบฟิลด์ manifest ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [ลบคีย์สัญญาที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [แทนที่การนำเข้า SDK จากรูท](/th/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [ลบการนำเข้า SDK ที่สงวนไว้](/th/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [แทนที่การเข้าถึงพื้นที่จัดเก็บเซสชันทั้งหมด](/th/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [แทนที่การเขียนพื้นที่จัดเก็บเซสชันทั้งหมด](/th/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [แทนที่ตัวช่วยพาธไฟล์เซสชัน](/th/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [แทนที่เป้าหมายไฟล์บทถอดเสียงแบบเดิม](/th/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [แทนที่ตัวช่วยบทถอดเสียงระดับล่าง](/th/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [แทนที่ before_agent_start](/th/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [ย้ายตัวแปรสภาพแวดล้อมของผู้ให้บริการไปยังข้อมูลเมตาการตั้งค่า](/th/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [ทำสำเนาตัวแปรสภาพแวดล้อมของช่องทางไว้ในข้อมูลเมตาปัจจุบัน](/th/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [ลบการอ้างอิงสคีมา manifest ความปลอดภัยที่ไม่มีให้ใช้](/th/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [ลบไฟล์ manifest ความปลอดภัยที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## ข้อมูลเมตาของแพ็กเกจ

### package-json-missing

รูทของแพ็กเกจไม่มี `package.json` ดังนั้น ClawHub จึงไม่สามารถระบุ
แพ็กเกจ npm เวอร์ชัน จุดเข้าใช้งาน หรือข้อมูลเมตา OpenClaw ได้

- เพิ่ม `package.json` พร้อม `name`, `version` และ `type`
- เพิ่มบล็อก `openclaw` เมื่อแพ็กเกจมี Plugin OpenClaw
- ใช้ [การสร้าง Plugin](/th/plugins/building-plugins) สำหรับตัวอย่างแพ็กเกจ
  ขั้นต่ำ และ [manifest ของ Plugin](/th/plugins/manifest#manifest-versus-packagejson)
  สำหรับการแบ่งหน้าที่ระหว่างแพ็กเกจและ manifest
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-metadata-missing

แพ็กเกจมี `package.json` แต่ไม่ได้ประกาศข้อมูลเมตา
แพ็กเกจ OpenClaw

- เพิ่ม `package.json#openclaw`
- รวมข้อมูลเมตาจุดเข้าใช้งาน เช่น `openclaw.extensions` หรือ
  `openclaw.runtimeExtensions`
- เพิ่มข้อมูลเมตาความเข้ากันได้และการติดตั้งเมื่อแพ็กเกจจะเผยแพร่หรือ
  ติดตั้งผ่าน ClawHub
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-entry-missing

มีข้อมูลเมตาของแพ็กเกจอยู่ แต่ไม่ได้ประกาศจุดเข้าใช้งาน
รันไทม์ OpenClaw

- เพิ่ม `openclaw.extensions` สำหรับจุดเข้าใช้งาน Plugin แบบเนทีฟ
- เพิ่ม `openclaw.runtimeExtensions` เมื่อแพ็กเกจที่เผยแพร่ควรโหลด
  JavaScript ที่สร้างแล้ว
- เก็บพาธจุดเข้าใช้งานทั้งหมดไว้ภายในไดเรกทอรีแพ็กเกจ
- ดู [จุดเข้าใช้งานของ Plugin](/th/plugins/sdk-entrypoints) และ
  [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-entrypoint-missing

แพ็กเกจประกาศจุดเข้าใช้งาน OpenClaw แต่ไฟล์ที่อ้างอิงไม่มีอยู่
ในแพ็กเกจที่กำลังตรวจสอบ

- ตรวจสอบแต่ละพาธใน `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` และ `openclaw.runtimeSetupEntry`
- สร้างแพ็กเกจหากจุดเข้าใช้งานถูกสร้างไว้ใน `dist`
- อัปเดตข้อมูลเมตาหากย้ายจุดเข้าใช้งานแล้ว
- ดู [จุดเข้าใช้งานของ Plugin](/th/plugins/sdk-entrypoints)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-install-metadata-incomplete

ClawHub ไม่สามารถระบุได้ว่าควรติดตั้งหรืออัปเดตแพ็กเกจอย่างไร

- กรอก `openclaw.install` ด้วยแหล่งติดตั้งที่รองรับ เช่น
  `clawhubSpec`, `npmSpec` หรือ `localPath`
- ตั้งค่า `openclaw.install.defaultChoice` เมื่อมีแหล่งติดตั้ง
  มากกว่าหนึ่งแหล่ง
- ใช้ `openclaw.install.minHostVersion` สำหรับเวอร์ชันโฮสต์ OpenClaw ขั้นต่ำ
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-plugin-api-compat-missing

แพ็กเกจไม่ได้ประกาศช่วง API Plugin ของ OpenClaw ที่รองรับ

- เพิ่ม `openclaw.compat.pluginApi` ไปยัง `package.json`
- ใช้เวอร์ชัน API Plugin ของ OpenClaw หรือค่าขั้นต่ำ semver ที่ใช้สร้างและทดสอบ
- แยกค่านี้ออกจากเวอร์ชันแพ็กเกจ เวอร์ชันแพ็กเกจอธิบายรุ่น
  ของ Plugin ส่วน `openclaw.compat.pluginApi` อธิบายสัญญา API ของโฮสต์
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-min-host-version-drift

เวอร์ชันโฮสต์ขั้นต่ำของแพ็กเกจไม่ตรงกับข้อมูลเมตาเวอร์ชัน OpenClaw
ที่ใช้สร้างแพ็กเกจ

- ตรวจสอบ `openclaw.install.minHostVersion`
- ตรวจสอบข้อมูลเมตาการสร้าง OpenClaw ในแพ็กเกจ เช่น เวอร์ชัน OpenClaw
  ที่ใช้ระหว่างการออกรุ่น
- ปรับเวอร์ชันโฮสต์ขั้นต่ำให้สอดคล้องกับช่วงเวอร์ชันโฮสต์ที่แพ็กเกจ
  รองรับจริง
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-manifest-version-drift

เวอร์ชันแพ็กเกจและเวอร์ชัน manifest ของ Plugin ไม่ตรงกัน

- ควรใช้ `package.json#version` เป็นเวอร์ชันรุ่นของแพ็กเกจ
- หาก `openclaw.plugin.json` มี `version` ด้วย ให้อัปเดตให้ตรงกันหรือลบ
  ข้อมูลเมตาเวอร์ชัน manifest ที่ล้าสมัยเมื่อข้อมูลเมตาแพ็กเกจเป็นแหล่งข้อมูลหลัก
- เผยแพร่แพ็กเกจเวอร์ชันใหม่หลังจากเปลี่ยนข้อมูลเมตาที่เผยแพร่แล้ว
- ดู [manifest ของ Plugin](/th/plugins/manifest)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-unsupported-metadata

บล็อก `package.json#openclaw` มีฟิลด์ที่ไม่รองรับ
ในข้อมูลเมตาแพ็กเกจ OpenClaw

- ลบฟิลด์ที่ไม่รองรับ เช่น `openclaw.bundle`
- เก็บข้อมูลเมตา Plugin แบบเนทีฟไว้ใน `openclaw.plugin.json`
- เก็บข้อมูลเมตาจุดเข้าใช้งาน ความเข้ากันได้ การติดตั้ง การตั้งค่า และแค็ตตาล็อก
  ของแพ็กเกจไว้ในฟิลด์ `package.json#openclaw` ที่รองรับ
- ดู [ฟิลด์ package.json ที่มีผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## อาร์ติแฟกต์ที่เผยแพร่

### package-npm-pack-unavailable

ไม่สามารถแพ็กแพ็กเกจเป็นอาร์ติแฟกต์ที่ ClawHub จะตรวจสอบหรือ
เผยแพร่ได้

- เรียกใช้ `npm pack --dry-run` จากรูทของแพ็กเกจ
- แก้ไขข้อมูลเมตาแพ็กเกจที่ไม่ถูกต้อง สคริปต์วงจรชีวิตที่เสียหาย หรือรายการไฟล์ที่
  ทำให้การแพ็กล้มเหลว
- ลบ `private: true` หากแพ็กเกจนี้มีไว้สำหรับการเผยแพร่สู่สาธารณะ
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-entrypoint-missing

สามารถแพ็กแพ็กเกจได้ แต่อาร์ติแฟกต์ที่แพ็กแล้วไม่มี
ไฟล์จุดเข้าใช้งานที่ประกาศใน `package.json#openclaw`

- เรียกใช้ `npm pack --dry-run` และตรวจสอบไฟล์ที่จะถูกรวม
- สร้างจุดเข้าใช้งานที่สร้างขึ้นอัตโนมัติก่อนแพ็ก
- อัปเดต `files`, `.npmignore` หรือผลลัพธ์การสร้างเพื่อให้รวมจุดเข้าใช้งานที่ประกาศไว้
- ดู [จุดเข้าใช้งานของ Plugin](/th/plugins/sdk-entrypoints)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-metadata-missing

อาร์ติแฟกต์ที่แพ็กแล้วไม่มีข้อมูลเมตา OpenClaw ที่มีอยู่ในแพ็กเกจ
ต้นฉบับของคุณ

- เรียกใช้ `npm pack --dry-run` และตรวจสอบไฟล์ข้อมูลเมตาที่รวมอยู่
- ตรวจสอบให้แน่ใจว่า `package.json` มีบล็อก `openclaw` อยู่ในอาร์ติแฟกต์ที่แพ็กแล้ว
- ตรวจสอบให้แน่ใจว่ามี `openclaw.plugin.json` รวมอยู่ด้วยเมื่อแพ็กเกจเป็น Plugin แบบเนทีฟของ
  OpenClaw
- อัปเดต `files` หรือ `.npmignore` เพื่อไม่ให้ข้อมูลเมตาของแพ็กเกจถูกตัดออก
- ดู [การสร้าง Plugin](/th/plugins/building-plugins)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## ข้อมูลเมตาของไฟล์ Manifest

### manifest-name-missing

ไฟล์ Manifest ของ Plugin แบบเนทีฟไม่มีชื่อที่ใช้แสดงผล

- เพิ่มฟิลด์ `name` ที่ไม่ว่างลงใน `openclaw.plugin.json`
- กำหนดให้ `name` มนุษย์อ่านเข้าใจได้ และคง `id` ไว้เป็นรหัสเครื่องที่เสถียร
- ดู [ไฟล์ Manifest ของ Plugin](/th/plugins/manifest)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-fields

ไฟล์ Manifest ของ Plugin มีฟิลด์ระดับบนสุดที่ OpenClaw ไม่รองรับ

- เปรียบเทียบฟิลด์ระดับบนสุดแต่ละฟิลด์กับ
  [ข้อมูลอ้างอิงฟิลด์ของไฟล์ Manifest](/th/plugins/manifest#top-level-field-reference)
- ลบฟิลด์ที่กำหนดเองออกจาก `openclaw.plugin.json`
- ย้ายข้อมูลเมตาของแพ็กเกจหรือการติดตั้งไปไว้ในฟิลด์ `package.json#openclaw` ที่รองรับ
  แทนไฟล์ Manifest
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-contracts

ไฟล์ Manifest ประกาศคีย์ที่ไม่รองรับภายใน `contracts`

- เปรียบเทียบแต่ละคีย์ภายใต้ `contracts` กับ
  [ข้อมูลอ้างอิงสัญญา](/th/plugins/manifest#contracts-reference)
- ลบคีย์สัญญาที่ไม่รองรับ
- ย้ายพฤติกรรมรันไทม์ไปไว้ในโค้ดลงทะเบียน Plugin และจำกัด `contracts`
  ให้มีเฉพาะข้อมูลเมตาแบบคงที่เกี่ยวกับการเป็นเจ้าของความสามารถ
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## การย้าย SDK และความเข้ากันได้

### legacy-root-sdk-import

Plugin นำเข้าจากแบร์เรล SDK ระดับรากที่เลิกใช้แล้ว:
`openclaw/plugin-sdk`

- แทนที่การนำเข้าจากแบร์เรลระดับรากด้วยการนำเข้าจากพาธย่อยสาธารณะที่เจาะจง
- ใช้ `openclaw/plugin-sdk/plugin-entry` สำหรับ `definePluginEntry`
- ใช้ `openclaw/plugin-sdk/channel-core` สำหรับตัวช่วยจุดเริ่มต้นของช่องทาง
- ใช้ [แนวทางการนำเข้า](/th/plugins/building-plugins#import-conventions) และ
  [พาธย่อยของ SDK สำหรับ Plugin](/th/plugins/sdk-subpaths) เพื่อค้นหาการนำเข้าที่เจาะจง
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### reserved-sdk-import

Plugin นำเข้าพาธ SDK ที่สงวนไว้สำหรับ Plugin ที่รวมมากับระบบหรือการรักษา
ความเข้ากันได้ภายใน

- แทนที่การนำเข้า SDK ภายในที่สงวนไว้ของ OpenClaw ด้วยพาธย่อย
  `openclaw/plugin-sdk/*` สาธารณะที่มีเอกสารกำกับ
- หากพฤติกรรมนั้นไม่มี SDK สาธารณะ ให้เก็บตัวช่วยไว้ภายในแพ็กเกจของคุณหรือ
  ร้องขอ API สาธารณะของ OpenClaw
- ใช้ [พาธย่อยของ SDK สำหรับ Plugin](/th/plugins/sdk-subpaths) และ
  [การย้าย SDK](/th/plugins/sdk-migration) เพื่อเลือกการนำเข้าที่รองรับ
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-load-session-store

Plugin ยังคงใช้ตัวช่วยสำหรับที่เก็บเซสชันทั้งชุดซึ่งเลิกใช้แล้ว
`loadSessionStore`

- ใช้ `getSessionEntry(...)` หรือ `listSessionEntries(...)` เมื่ออ่านสถานะ
  เซสชัน
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เมื่อเขียนสถานะ
  เซสชัน
- หลีกเลี่ยงการโหลด แก้ไข และบันทึกออบเจ็กต์ที่เก็บเซสชันทั้งชุด
- เก็บ `loadSessionStore(...)` ไว้เฉพาะในช่วงที่ขอบเขตความเข้ากันได้ที่ประกาศไว้ของคุณ
  ยังคงรองรับ OpenClaw เวอร์ชันเก่าที่จำเป็นต้องใช้
- ดู [API รันไทม์](/th/plugins/sdk-runtime#agent-session-state) และ
  [พาธย่อยของ SDK สำหรับ Plugin](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-store-write

Plugin ยังคงใช้ตัวช่วยเขียนที่เก็บเซสชันทั้งชุดซึ่งเลิกใช้แล้ว เช่น
`saveSessionStore` หรือ `updateSessionStore`

- ใช้ `patchSessionEntry(...)` เมื่ออัปเดตฟิลด์ในรายการเซสชันที่มีอยู่
- ใช้ `upsertSessionEntry(...)` เมื่อแทนที่หรือสร้างรายการเซสชัน
- หลีกเลี่ยงการโหลด แก้ไข และบันทึกออบเจ็กต์ที่เก็บเซสชันทั้งชุด
- เก็บตัวช่วยเขียนทั้งที่เก็บไว้เฉพาะในช่วงที่ขอบเขตความเข้ากันได้ที่ประกาศไว้ของคุณ
  ยังคงรองรับ OpenClaw เวอร์ชันเก่าที่จำเป็นต้องใช้ตัวช่วยเหล่านั้น
- ดู [API รันไทม์](/th/plugins/sdk-runtime#agent-session-state) และ
  [พาธย่อยของ SDK สำหรับ Plugin](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-file-helper

Plugin ยังคงใช้ตัวช่วยพาธไฟล์เซสชันที่เลิกใช้แล้ว เช่น
`resolveSessionFilePath` หรือ `resolveAndPersistSessionFile`

- ใช้ `getSessionEntry(...)` เพื่ออ่านข้อมูลเมตาของเซสชันตามอัตลักษณ์ของเอเจนต์และ
  เซสชัน
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เพื่อจัดเก็บข้อมูลเมตาของ
  เซสชันอย่างถาวร
- ใช้ตัวช่วยอัตลักษณ์หรือเป้าหมายของทรานสคริปต์เมื่อโค้ดกำลังเตรียม
  การดำเนินการกับทรานสคริปต์
- อย่าจัดเก็บหรือพึ่งพาพาธไฟล์ทรานสคริปต์แบบเดิม
- ดู [API รันไทม์](/th/plugins/sdk-runtime#agent-session-state) และ
  [พาธย่อยของ SDK สำหรับ Plugin](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-transcript-file-target

Plugin ยังคงใช้ตัวช่วยเป้าหมายไฟล์ทรานสคริปต์ที่เลิกใช้แล้ว
`resolveSessionTranscriptLegacyFileTarget`

- ใช้ `resolveSessionTranscriptIdentity(...)` เมื่อโค้ดต้องการเพียงอัตลักษณ์
  เซสชันสาธารณะ
- ใช้ `resolveSessionTranscriptTarget(...)` เมื่อโค้ดต้องการเป้าหมายการดำเนินการกับ
  ทรานสคริปต์ที่มีโครงสร้าง
- หลีกเลี่ยงการอ่านหรือสร้างเป้าหมายไฟล์ทรานสคริปต์แบบเดิมโดยตรง
- เก็บตัวช่วยแบบเดิมไว้เฉพาะในช่วงที่ขอบเขตความเข้ากันได้ที่ประกาศไว้ของคุณยังคง
  รองรับ OpenClaw เวอร์ชันเก่าที่จำเป็นต้องใช้
- ดู [API รันไทม์](/th/plugins/sdk-runtime#agent-session-state) และ
  [พาธย่อยของ SDK สำหรับ Plugin](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-transcript-low-level

Plugin ยังคงใช้ตัวช่วยทรานสคริปต์ระดับต่ำที่เลิกใช้แล้ว เช่น
`appendSessionTranscriptMessage` หรือ `emitSessionTranscriptUpdate`

- ใช้ `appendSessionTranscriptMessageByIdentity(...)` สำหรับการต่อท้ายทรานสคริปต์
- ใช้ `publishSessionTranscriptUpdateByIdentity(...)` สำหรับการแจ้งเตือนการอัปเดต
  ทรานสคริปต์
- ควรใช้พื้นผิวรันไทม์สำหรับทรานสคริปต์ที่มีโครงสร้าง เพื่อให้ OpenClaw สามารถใช้
  ขอบเขตธุรกรรมและการจัดการอัตลักษณ์ที่ถูกต้อง
- เก็บตัวช่วยทรานสคริปต์ระดับต่ำไว้เฉพาะในช่วงที่ขอบเขตความเข้ากันได้ที่ประกาศไว้ของคุณ
  ยังคงรองรับ OpenClaw เวอร์ชันเก่าที่จำเป็นต้องใช้ตัวช่วยเหล่านั้น
- ดู [API รันไทม์](/th/plugins/sdk-runtime#agent-session-state) และ
  [พาธย่อยของ SDK สำหรับ Plugin](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### legacy-before-agent-start

Plugin ยังคงใช้ฮุก `before_agent_start` แบบเดิม

- ย้ายงานแทนที่โมเดลหรือผู้ให้บริการไปยัง `before_model_resolve`
- ย้ายงานแก้ไขพรอมต์หรือบริบทไปยัง `before_prompt_build`
- เก็บ `before_agent_start` ไว้เฉพาะในช่วงที่ขอบเขตความเข้ากันได้ที่ประกาศไว้ของคุณยังคง
  รองรับ OpenClaw เวอร์ชันเก่าที่จำเป็นต้องใช้
- ดู [ฮุก](/th/plugins/hooks) และ
  [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### provider-auth-env-vars

ไฟล์ Manifest ยังคงใช้ข้อมูลเมตาการรับรองความถูกต้องของผู้ให้บริการ `providerAuthEnvVars` แบบเดิม

- ทำสำเนาข้อมูลเมตาตัวแปรสภาพแวดล้อมของผู้ให้บริการไปยัง `setup.providers[].envVars`
- เก็บ `providerAuthEnvVars` ไว้เป็นข้อมูลเมตาความเข้ากันได้เท่านั้น ตราบใดที่ช่วง
  OpenClaw ที่คุณรองรับยังคงจำเป็นต้องใช้
- ดู [ข้อมูลอ้างอิงการตั้งค่า](/th/plugins/manifest#setup-reference) และ
  [การย้าย SDK](/th/plugins/sdk-migration)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### channel-env-vars

ไฟล์ Manifest ใช้ข้อมูลเมตาตัวแปรสภาพแวดล้อมของช่องทางแบบเดิมหรือเวอร์ชันเก่า โดยไม่มีข้อมูลเมตา
การตั้งค่าหรือการกำหนดค่าปัจจุบันที่ ClawHub ต้องการ

- กำหนดข้อมูลเมตาตัวแปรสภาพแวดล้อมของช่องทางในรูปแบบเชิงประกาศ เพื่อให้ OpenClaw ตรวจสอบสถานะการตั้งค่าได้
  โดยไม่ต้องโหลดรันไทม์ของช่องทาง
- ทำสำเนาการตั้งค่าช่องทางที่ขับเคลื่อนด้วยตัวแปรสภาพแวดล้อมไปยังข้อมูลเมตาการตั้งค่า การกำหนดค่าช่องทาง หรือ
  ช่องทางแพ็กเกจปัจจุบันที่รูปแบบ Plugin ของคุณใช้
- เก็บ `channelEnvVars` ไว้เป็นข้อมูลเมตาความเข้ากันได้เท่านั้น ตราบใดที่ OpenClaw
  เวอร์ชันเก่าที่รองรับยังคงจำเป็นต้องใช้
- ดู [ไฟล์ Manifest ของ Plugin](/th/plugins/manifest) และ
  [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## ไฟล์ Manifest ด้านความปลอดภัย

### security-manifest-schema-unavailable

แพ็กเกจจัดส่ง `openclaw.security.json` พร้อมการอ้างอิงสคีมาที่ ClawHub
ไม่รู้จักว่าพร้อมใช้งาน

- ลบ URL ของสคีมาหากมีไว้เพื่อให้คำแนะนำเท่านั้น
- ใช้สคีมาที่ระบุเวอร์ชันและมีเอกสารกำกับหลังจาก OpenClaw เผยแพร่แล้วเท่านั้น
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### unrecognized-security-manifest

แพ็กเกจจัดส่งไฟล์ Manifest ด้านความปลอดภัยที่ไม่รองรับ

- ลบ `openclaw.security.json` จนกว่า OpenClaw จะจัดทำเอกสารสคีมาไฟล์ Manifest ด้านความปลอดภัย
  ที่ระบุเวอร์ชันและพฤติกรรมของ ClawHub
- จัดทำเอกสารพฤติกรรมที่ละเอียดอ่อนด้านความปลอดภัยไว้ในเอกสารสาธารณะของแพ็กเกจหรือ
  README จนกว่าจะมีสัญญาของไฟล์ Manifest
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## ที่เกี่ยวข้อง

- [CLI ของ ClawHub](/th/clawhub/cli)
- [การเผยแพร่บน ClawHub](/th/clawhub/publishing)
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ไฟล์ Manifest ของ Plugin](/th/plugins/manifest)
- [จุดเริ่มต้นของ Plugin](/th/plugins/sdk-entrypoints)
- [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
