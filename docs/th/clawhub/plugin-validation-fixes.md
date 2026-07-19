---
read_when:
    - คุณได้เรียกใช้ clawhub package validate และต้องแก้ไขข้อค้นพบของ Plugin
    - ClawHub ปฏิเสธหรือแสดงคำเตือนในการเผยแพร่แพ็กเกจ Plugin
    - คุณกำลังอัปเดตข้อมูลเมตาของแพ็กเกจ Plugin ก่อนเผยแพร่
summary: แก้ไขข้อค้นพบจากการตรวจสอบแพ็กเกจ Plugin ของ ClawHub ก่อนเผยแพร่
title: การแก้ไขการตรวจสอบความถูกต้องของ Plugin
x-i18n:
    generated_at: "2026-07-19T07:14:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# การแก้ไขการตรวจสอบ Plugin

ClawHub ตรวจสอบแพ็กเกจ Plugin ก่อนเผยแพร่ และยังสามารถแสดงข้อค้นพบจาก
การสแกนแพ็กเกจอัตโนมัติได้อีกด้วย หน้านี้ครอบคลุมข้อค้นพบสำหรับผู้เขียน ซึ่งหมายถึง
ข้อค้นพบที่ผู้เขียน Plugin สามารถแก้ไขได้ในข้อมูลเมตาของแพ็กเกจ manifest การนำเข้า
SDK หรืออาร์ติแฟกต์ที่เผยแพร่

หน้านี้ไม่ครอบคลุมข้อค้นพบด้านความครอบคลุมภายในของ Plugin Inspector หากรายงานฉบับเต็ม
มีรหัสการบำรุงรักษาสแกนเนอร์โดยไม่มีคำแนะนำในการแก้ไขสำหรับผู้เขียน รหัสเหล่านั้น
มีไว้สำหรับผู้ดูแล OpenClaw ไม่ใช่ผู้เขียน Plugin

หลังจากใช้การแก้ไขแล้ว ให้เรียกใช้อีกครั้ง:

```bash
clawhub package validate <path-to-plugin>
```

## ข้อค้นพบสำหรับผู้เขียน

| รหัส                                    | เริ่มต้นที่นี่                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [เพิ่มข้อมูลเมตาของแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [เพิ่มบล็อก openclaw ของแพ็กเกจ](/th/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [ประกาศจุดเข้าใช้งานแพ็กเกจ OpenClaw](/th/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [เผยแพร่จุดเข้าใช้งานที่ประกาศไว้](/th/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [กรอกข้อมูลเมตาการติดตั้งให้ครบถ้วน](/th/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [ประกาศความเข้ากันได้กับ API ของ Plugin](/th/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [ปรับเวอร์ชันขั้นต่ำของโฮสต์ให้ตรงกัน](/th/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [ปรับเวอร์ชันแพ็กเกจและ manifest ให้ตรงกัน](/th/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [ลบข้อมูลเมตาแพ็กเกจ OpenClaw ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [ทำให้อาร์ติแฟกต์ npm สามารถแพ็กได้](/th/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [รวมจุดเข้าใช้งานไว้ในผลลัพธ์ npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [รวมข้อมูลเมตาไว้ในผลลัพธ์ npm pack](/th/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [เพิ่มชื่อที่แสดงของ manifest](/th/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [ลบฟิลด์ manifest ที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [ลบคีย์สัญญาที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [แทนที่การนำเข้า SDK จากรูท](/th/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [ลบการนำเข้า SDK ที่สงวนไว้](/th/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [แทนที่การเข้าถึงที่เก็บเซสชันทั้งชุด](/th/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [แทนที่การเขียนที่เก็บเซสชันทั้งชุด](/th/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [แทนที่ตัวช่วยพาธไฟล์เซสชัน](/th/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [แทนที่เป้าหมายไฟล์บทถอดความแบบเดิม](/th/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [แทนที่ตัวช่วยบทถอดความระดับล่าง](/th/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [แทนที่ before_agent_start](/th/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [ย้ายตัวแปรสภาพแวดล้อมของผู้ให้บริการไปยังข้อมูลเมตาการตั้งค่า](/th/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [ทำสำเนาตัวแปรสภาพแวดล้อมของช่องทางไว้ในข้อมูลเมตาปัจจุบัน](/th/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [ลบการอ้างอิงสคีมา manifest ความปลอดภัยที่ใช้ไม่ได้](/th/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [ลบไฟล์ manifest ความปลอดภัยที่ไม่รองรับ](/th/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## ข้อมูลเมตาของแพ็กเกจ

### package-json-missing

รูทของแพ็กเกจไม่มี `package.json` ทำให้ ClawHub ไม่สามารถระบุ
แพ็กเกจ npm เวอร์ชัน จุดเข้าใช้งาน หรือข้อมูลเมตา OpenClaw ได้

- เพิ่ม `package.json` พร้อม `name`, `version` และ `type`
- เพิ่มบล็อก `openclaw` เมื่อแพ็กเกจมี Plugin ของ OpenClaw
- ดูตัวอย่างแพ็กเกจขั้นต่ำได้จาก [การสร้าง Plugin](/th/plugins/building-plugins)
  และดูการแบ่งแยกระหว่างแพ็กเกจกับ manifest ได้จาก [manifest ของ Plugin](/th/plugins/manifest#manifest-versus-packagejson)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-metadata-missing

แพ็กเกจมี `package.json` แต่ไม่ได้ประกาศข้อมูลเมตา
แพ็กเกจ OpenClaw

- เพิ่ม `package.json#openclaw`
- ระบุข้อมูลเมตาจุดเข้าใช้งาน เช่น `openclaw.extensions` หรือ
  `openclaw.runtimeExtensions`
- เพิ่มข้อมูลเมตาความเข้ากันได้และการติดตั้ง เมื่อจะเผยแพร่หรือติดตั้ง
  แพ็กเกจผ่าน ClawHub
- ดู [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-entry-missing

มีข้อมูลเมตาของแพ็กเกจอยู่ แต่ไม่ได้ประกาศจุดเข้าใช้งาน
รันไทม์ OpenClaw

- เพิ่ม `openclaw.extensions` สำหรับจุดเข้าใช้งาน Plugin แบบเนทีฟ
- เพิ่ม `openclaw.runtimeExtensions` เมื่อแพ็กเกจที่เผยแพร่ควรโหลด
  JavaScript ที่บิลด์แล้ว
- เก็บพาธจุดเข้าใช้งานทั้งหมดไว้ภายในไดเรกทอรีแพ็กเกจ
- ดู [จุดเข้าใช้งาน Plugin](/th/plugins/sdk-entrypoints) และ
  [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-entrypoint-missing

แพ็กเกจประกาศจุดเข้าใช้งาน OpenClaw แต่ไฟล์ที่อ้างอิงไม่มีอยู่
ในแพ็กเกจที่กำลังตรวจสอบ

- ตรวจสอบแต่ละพาธใน `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` และ `openclaw.runtimeSetupEntry`
- บิลด์แพ็กเกจ หากจุดเข้าใช้งานถูกสร้างไว้ใน `dist`
- อัปเดตข้อมูลเมตา หากจุดเข้าใช้งานถูกย้าย
- ดู [จุดเข้าใช้งาน Plugin](/th/plugins/sdk-entrypoints)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-install-metadata-incomplete

ClawHub ไม่สามารถระบุได้ว่าควรติดตั้งหรืออัปเดตแพ็กเกจอย่างไร

- กรอก `openclaw.install` ด้วยแหล่งติดตั้งที่รองรับ เช่น
  `clawhubSpec`, `npmSpec` หรือ `localPath`
- ตั้งค่า `openclaw.install.defaultChoice` เมื่อมีแหล่งติดตั้ง
  มากกว่าหนึ่งแหล่ง
- ใช้ `openclaw.install.minHostVersion` สำหรับเวอร์ชันขั้นต่ำของโฮสต์ OpenClaw
- ดู [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-plugin-api-compat-missing

แพ็กเกจไม่ได้ประกาศช่วง API ของ Plugin OpenClaw ที่รองรับ

- เพิ่ม `openclaw.compat.pluginApi` ไปยัง `package.json`
- ใช้เวอร์ชัน API ของ Plugin OpenClaw หรือค่าขั้นต่ำ semver ที่ใช้
  ในการบิลด์และทดสอบ
- แยกค่านี้ออกจากเวอร์ชันแพ็กเกจ เวอร์ชันแพ็กเกจอธิบายรุ่น
  ของ Plugin ส่วน `openclaw.compat.pluginApi` อธิบายสัญญา API ของโฮสต์
- ดู [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-min-host-version-drift

เวอร์ชันขั้นต่ำของโฮสต์ในแพ็กเกจไม่ตรงกับข้อมูลเมตาเวอร์ชัน OpenClaw
ที่ใช้บิลด์แพ็กเกจ

- ตรวจสอบ `openclaw.install.minHostVersion`
- ตรวจสอบข้อมูลเมตาการบิลด์ OpenClaw ใดๆ ในแพ็กเกจ เช่น เวอร์ชัน OpenClaw
  ที่ใช้ระหว่างการออกรุ่น
- ปรับเวอร์ชันขั้นต่ำของโฮสต์ให้ตรงกับช่วงเวอร์ชันโฮสต์ที่แพ็กเกจ
  รองรับจริง
- ดู [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-manifest-version-drift

เวอร์ชันแพ็กเกจและเวอร์ชัน manifest ของ Plugin ไม่ตรงกัน

- ควรใช้ `package.json#version` เป็นเวอร์ชันการออกรุ่นของแพ็กเกจ
- หาก `openclaw.plugin.json` มี `version` ด้วย ให้อัปเดตให้ตรงกัน หรือลบ
  ข้อมูลเมตาเวอร์ชัน manifest ที่ล้าสมัย เมื่อข้อมูลเมตาแพ็กเกจเป็นแหล่งข้อมูลหลัก
- เผยแพร่แพ็กเกจเวอร์ชันใหม่หลังจากเปลี่ยนข้อมูลเมตาที่เผยแพร่แล้ว
- ดู [manifest ของ Plugin](/th/plugins/manifest)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-openclaw-unsupported-metadata

บล็อก `package.json#openclaw` มีฟิลด์ที่ไม่รองรับ
ในฐานะข้อมูลเมตาแพ็กเกจ OpenClaw

- ลบฟิลด์ที่ไม่รองรับ เช่น `openclaw.bundle`
- เก็บข้อมูลเมตาของ Plugin แบบเนทีฟไว้ใน `openclaw.plugin.json`
- เก็บข้อมูลเมตาจุดเข้าใช้งานแพ็กเกจ ความเข้ากันได้ การติดตั้ง การตั้งค่า และแค็ตตาล็อก
  ไว้ในฟิลด์ `package.json#openclaw` ที่รองรับ
- ดู [ฟิลด์ package.json ที่ส่งผลต่อการค้นพบ](/th/plugins/manifest#packagejson-fields-that-affect-discovery)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## อาร์ติแฟกต์ที่เผยแพร่

### package-npm-pack-unavailable

ไม่สามารถแพ็กแพ็กเกจเป็นอาร์ติแฟกต์ที่ ClawHub จะตรวจสอบหรือ
เผยแพร่ได้

- เรียกใช้ `npm pack --dry-run` จากรูทของแพ็กเกจ
- แก้ไขข้อมูลเมตาแพ็กเกจที่ไม่ถูกต้อง สคริปต์วงจรชีวิตที่เสียหาย หรือรายการ files ที่
  ทำให้การแพ็กล้มเหลว
- ลบ `private: true` หากแพ็กเกจนี้มีไว้สำหรับเผยแพร่ต่อสาธารณะ
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-entrypoint-missing

สามารถแพ็กแพ็กเกจได้ แต่อาร์ติแฟกต์ที่แพ็กไม่มี
ไฟล์จุดเข้าใช้งานที่ประกาศไว้ใน `package.json#openclaw`

- เรียกใช้ `npm pack --dry-run` และตรวจสอบไฟล์ที่จะถูกรวมไว้
- บิลด์จุดเข้าใช้งานที่สร้างขึ้นก่อนแพ็ก
- อัปเดต `files`, `.npmignore` หรือผลลัพธ์การบิลด์ เพื่อให้รวมจุดเข้าใช้งาน
  ที่ประกาศไว้
- ดู [จุดเข้าใช้งาน Plugin](/th/plugins/sdk-entrypoints)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### package-npm-pack-metadata-missing

อาร์ติแฟกต์ที่แพ็กไม่มีข้อมูลเมตา OpenClaw ที่มีอยู่ในแพ็กเกจ
ต้นฉบับของคุณ

- เรียกใช้ `npm pack --dry-run` และตรวจสอบไฟล์เมทาดาทาที่รวมอยู่
- ตรวจสอบว่า `package.json` มีบล็อก `openclaw` อยู่ในอาร์ติแฟกต์ที่แพ็กแล้ว
- ตรวจสอบว่าได้รวม `openclaw.plugin.json` เมื่อแพ็กเกจเป็น Plugin แบบเนทีฟของ
  OpenClaw
- อัปเดต `files` หรือ `.npmignore` เพื่อไม่ให้เมทาดาทาของแพ็กเกจถูกยกเว้น
- ดู [การสร้าง Plugin](/th/plugins/building-plugins)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## เมทาดาทาของไฟล์ Manifest

### manifest-name-missing

ไฟล์ Manifest ของ Plugin แบบเนทีฟไม่มีชื่อที่ใช้แสดงผล

- เพิ่มฟิลด์ `name` ที่ไม่ว่างลงใน `openclaw.plugin.json`
- กำหนดให้ `name` อ่านเข้าใจได้ง่าย และคง `id` ไว้เป็นรหัสเครื่องที่เสถียร
- ดู [ไฟล์ Manifest ของ Plugin](/th/plugins/manifest)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-fields

ไฟล์ Manifest ของ Plugin มีฟิลด์ระดับบนสุดที่ OpenClaw ไม่รองรับ

- เปรียบเทียบฟิลด์ระดับบนสุดแต่ละฟิลด์กับ
  [ข้อมูลอ้างอิงฟิลด์ของไฟล์ Manifest](/th/plugins/manifest#top-level-field-reference)
- นำฟิลด์ที่กำหนดเองออกจาก `openclaw.plugin.json`
- ย้ายเมทาดาทาของแพ็กเกจหรือการติดตั้งไปยังฟิลด์ `package.json#openclaw` ที่รองรับ
  แทนการใส่ไว้ในไฟล์ Manifest
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### manifest-unknown-contracts

ไฟล์ Manifest ประกาศคีย์ที่ไม่รองรับภายใน `contracts`

- เปรียบเทียบแต่ละคีย์ภายใต้ `contracts` กับ
  [ข้อมูลอ้างอิงสัญญา](/th/plugins/manifest#contracts-reference)
- นำคีย์สัญญาที่ไม่รองรับออก
- ย้ายพฤติกรรมรันไทม์ไปยังโค้ดลงทะเบียน Plugin และจำกัด `contracts`
  ให้มีเฉพาะเมทาดาทาแบบคงที่เกี่ยวกับความเป็นเจ้าของความสามารถ
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## การย้าย SDK และความเข้ากันได้

### legacy-root-sdk-import

Plugin นำเข้าจาก barrel หลักของ SDK ที่เลิกใช้แล้ว:
`openclaw/plugin-sdk`

- แทนที่การนำเข้าจาก barrel หลักด้วยการนำเข้าจากเส้นทางย่อยสาธารณะที่เฉพาะเจาะจง
- ใช้ `openclaw/plugin-sdk/plugin-entry` สำหรับ `definePluginEntry`
- ใช้ `openclaw/plugin-sdk/channel-core` สำหรับตัวช่วยจุดเริ่มต้นของช่องทาง
- ใช้ [หลักเกณฑ์การนำเข้า](/th/plugins/building-plugins#import-conventions) และ
  [เส้นทางย่อยของ Plugin SDK](/th/plugins/sdk-subpaths) เพื่อค้นหาเส้นทางนำเข้าที่เฉพาะเจาะจง
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### reserved-sdk-import

Plugin นำเข้าเส้นทาง SDK ที่สงวนไว้สำหรับ Plugin ที่รวมมาในตัวหรือสำหรับ
ความเข้ากันได้ภายใน

- แทนที่การนำเข้า SDK ภายในที่สงวนไว้ของ OpenClaw ด้วยเส้นทางย่อย
  `openclaw/plugin-sdk/*` สาธารณะที่มีเอกสารกำกับ
- หากพฤติกรรมนั้นไม่มี SDK สาธารณะ ให้เก็บตัวช่วยไว้ภายในแพ็กเกจของคุณ หรือ
  ร้องขอ API สาธารณะของ OpenClaw
- ใช้ [เส้นทางย่อยของ Plugin SDK](/th/plugins/sdk-subpaths) และ
  [การย้าย SDK](/th/plugins/sdk-migration) เพื่อเลือกการนำเข้าที่รองรับ
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-load-session-store

Plugin ยังคงใช้ตัวช่วยที่เลิกใช้แล้วสำหรับพื้นที่จัดเก็บเซสชันทั้งหมด
`loadSessionStore`

- ใช้ `getSessionEntry(...)` หรือ `listSessionEntries(...)` เมื่ออ่านสถานะ
  เซสชัน
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เมื่อเขียนสถานะ
  เซสชัน
- หลีกเลี่ยงการโหลด แก้ไข และบันทึกออบเจ็กต์พื้นที่จัดเก็บเซสชันทั้งหมด
- เก็บ `loadSessionStore(...)` ไว้เฉพาะในช่วงที่ช่วงความเข้ากันได้ที่คุณประกาศ
  ยังคงรองรับ OpenClaw เวอร์ชันเก่าที่จำเป็นต้องใช้ตัวช่วยนี้
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [เส้นทางย่อยของ Plugin SDK](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-store-write

Plugin ยังคงใช้ตัวช่วยเขียนพื้นที่จัดเก็บเซสชันทั้งหมดที่เลิกใช้แล้ว เช่น
`saveSessionStore` หรือ `updateSessionStore`

- ใช้ `patchSessionEntry(...)` เมื่ออัปเดตฟิลด์ในรายการเซสชันที่มีอยู่
- ใช้ `upsertSessionEntry(...)` เมื่อแทนที่หรือสร้างรายการเซสชัน
- หลีกเลี่ยงการโหลด แก้ไข และบันทึกออบเจ็กต์พื้นที่จัดเก็บเซสชันทั้งหมด
- เก็บตัวช่วยเขียนพื้นที่จัดเก็บทั้งหมดไว้เฉพาะในช่วงที่ช่วงความเข้ากันได้ที่คุณประกาศ
  ยังคงรองรับ OpenClaw เวอร์ชันเก่าที่จำเป็นต้องใช้ตัวช่วยเหล่านั้น
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [เส้นทางย่อยของ Plugin SDK](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-file-helper

Plugin ยังคงใช้ตัวช่วยเส้นทางไฟล์เซสชันที่เลิกใช้แล้ว เช่น
`resolveSessionFilePath` หรือ `resolveAndPersistSessionFile`

- ใช้ `getSessionEntry(...)` เพื่ออ่านเมทาดาทาของเซสชันตามข้อมูลประจำตัว
  ของเอเจนต์และเซสชัน
- ใช้ `patchSessionEntry(...)` หรือ `upsertSessionEntry(...)` เพื่อจัดเก็บเมทาดาทา
  ของเซสชัน
- ใช้ข้อมูลประจำตัวของทรานสคริปต์หรือตัวช่วยเป้าหมายเมื่อโค้ดกำลังเตรียม
  การดำเนินการกับทรานสคริปต์
- อย่าจัดเก็บหรือพึ่งพาเส้นทางไฟล์ทรานสคริปต์แบบเดิม
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [เส้นทางย่อยของ Plugin SDK](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-transcript-file-target

Plugin ยังคงใช้ตัวช่วยเป้าหมายไฟล์ทรานสคริปต์ที่เลิกใช้แล้ว
`resolveSessionTranscriptLegacyFileTarget`

- ใช้ `resolveSessionTranscriptIdentity(...)` เมื่อโค้ดต้องการเพียงข้อมูลประจำตัว
  สาธารณะของเซสชัน
- ใช้ `resolveSessionTranscriptTarget(...)` เมื่อโค้ดต้องการเป้าหมายการดำเนินการ
  กับทรานสคริปต์ที่มีโครงสร้าง
- หลีกเลี่ยงการอ่านหรือสร้างเป้าหมายไฟล์ทรานสคริปต์แบบเดิมโดยตรง
- เก็บตัวช่วยแบบเดิมไว้เฉพาะในช่วงที่ช่วงความเข้ากันได้ที่คุณประกาศยังคง
  รองรับ OpenClaw เวอร์ชันเก่าที่จำเป็นต้องใช้ตัวช่วยนี้
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [เส้นทางย่อยของ Plugin SDK](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### sdk-session-transcript-low-level

Plugin ยังคงใช้ตัวช่วยทรานสคริปต์ระดับต่ำที่เลิกใช้แล้ว เช่น
`appendSessionTranscriptMessage` หรือ `emitSessionTranscriptUpdate`

- ใช้ `appendSessionTranscriptMessageByIdentity(...)` สำหรับการเพิ่มข้อมูลต่อท้ายทรานสคริปต์
- ใช้ `publishSessionTranscriptUpdateByIdentity(...)` สำหรับการแจ้งเตือนการอัปเดต
  ทรานสคริปต์
- ควรใช้พื้นผิวรันไทม์ทรานสคริปต์แบบมีโครงสร้าง เพื่อให้ OpenClaw สามารถใช้
  ขอบเขตธุรกรรมและการจัดการข้อมูลประจำตัวที่ถูกต้อง
- เก็บตัวช่วยทรานสคริปต์ระดับต่ำไว้เฉพาะในช่วงที่ช่วงความเข้ากันได้ที่คุณประกาศ
  ยังคงรองรับ OpenClaw เวอร์ชันเก่าที่จำเป็นต้องใช้ตัวช่วยเหล่านั้น
- ดู [Runtime API](/th/plugins/sdk-runtime#agent-session-state) และ
  [เส้นทางย่อยของ Plugin SDK](/th/plugins/sdk-subpaths)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### legacy-before-agent-start

Plugin ยังคงใช้ฮุก `before_agent_start` แบบเดิม

- ย้ายงานแทนที่โมเดลหรือผู้ให้บริการไปยัง `before_model_resolve`
- ย้ายงานแก้ไขพรอมต์หรือบริบทไปยัง `before_prompt_build`
- เก็บ `before_agent_start` ไว้เฉพาะในช่วงที่ช่วงความเข้ากันได้ที่คุณประกาศยังคง
  รองรับ OpenClaw เวอร์ชันเก่าที่จำเป็นต้องใช้ฮุกนี้
- ดู [ฮุก](/th/plugins/hooks) และ
  [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### provider-auth-env-vars

ไฟล์ Manifest ยังคงใช้เมทาดาทาการตรวจสอบสิทธิ์ผู้ให้บริการ `providerAuthEnvVars` แบบเดิม

- ทำสำเนาเมทาดาทาตัวแปรสภาพแวดล้อมของผู้ให้บริการไปยัง `setup.providers[].envVars`
- เก็บ `providerAuthEnvVars` ไว้เป็นเมทาดาทาความเข้ากันได้เท่านั้น ตราบเท่าที่ช่วง
  OpenClaw ที่คุณรองรับยังคงจำเป็นต้องใช้
- ดู [ข้อมูลอ้างอิงการตั้งค่า](/th/plugins/manifest#setup-reference) และ
  [การย้าย SDK](/th/plugins/sdk-migration)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### channel-env-vars

ไฟล์ Manifest ใช้เมทาดาทาตัวแปรสภาพแวดล้อมของช่องทางแบบเดิมหรือเวอร์ชันเก่า โดยไม่มี
เมทาดาทาการตั้งค่าหรือการกำหนดค่าปัจจุบันที่ ClawHub คาดหวัง

- กำหนดเมทาดาทาตัวแปรสภาพแวดล้อมของช่องทางแบบประกาศ เพื่อให้ OpenClaw ตรวจสอบสถานะการตั้งค่า
  ได้โดยไม่ต้องโหลดรันไทม์ของช่องทาง
- ทำสำเนาการตั้งค่าช่องทางที่ขับเคลื่อนด้วยตัวแปรสภาพแวดล้อมไปยังเมทาดาทาการตั้งค่า การกำหนดค่าช่องทาง หรือ
  ช่องทางของแพ็กเกจในปัจจุบันที่รูปแบบ Plugin ของคุณใช้
- เก็บ `channelEnvVars` ไว้เป็นเมทาดาทาความเข้ากันได้เท่านั้น ตราบเท่าที่ OpenClaw
  เวอร์ชันเก่าที่รองรับยังคงจำเป็นต้องใช้
- ดู [ไฟล์ Manifest ของ Plugin](/th/plugins/manifest) และ
  [Plugin ช่องทาง](/th/plugins/sdk-channel-plugins)
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## ไฟล์ Manifest ด้านความปลอดภัย

### security-manifest-schema-unavailable

แพ็กเกจจัดส่ง `openclaw.security.json` พร้อมการอ้างอิงสคีมาที่ ClawHub
ไม่รู้จักว่ามีพร้อมใช้งาน

- นำ URL ของสคีมาออกหากมีไว้เพื่อให้คำแนะนำเท่านั้น
- ใช้สคีมาแบบมีเวอร์ชันที่มีเอกสารกำกับหลังจาก OpenClaw เผยแพร่แล้วเท่านั้น
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

### unrecognized-security-manifest

แพ็กเกจจัดส่งไฟล์ Manifest ด้านความปลอดภัยที่ไม่รองรับ

- นำ `openclaw.security.json` ออกจนกว่า OpenClaw จะจัดทำเอกสารสคีมาไฟล์ Manifest
  ด้านความปลอดภัยแบบมีเวอร์ชันและพฤติกรรมของ ClawHub
- บันทึกพฤติกรรมที่เกี่ยวข้องกับความปลอดภัยไว้ในเอกสารสาธารณะของแพ็กเกจหรือ
  README จนกว่าจะมีสัญญาของไฟล์ Manifest
- เรียกใช้ `clawhub package validate <path-to-plugin>` อีกครั้ง

## เนื้อหาที่เกี่ยวข้อง

- [ClawHub CLI](/th/clawhub/cli)
- [การเผยแพร่บน ClawHub](/th/clawhub/publishing)
- [การสร้าง Plugin](/th/plugins/building-plugins)
- [ไฟล์ Manifest ของ Plugin](/th/plugins/manifest)
- [จุดเริ่มต้นของ Plugin](/th/plugins/sdk-entrypoints)
- [ความเข้ากันได้ของ Plugin](/th/plugins/compatibility)
