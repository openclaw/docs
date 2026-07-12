---
read_when:
    - คุณต้องการตรวจสอบการตั้งค่า OpenClaw เทียบกับไฟล์ policy.jsonc ที่เขียนไว้
    - คุณต้องการให้ผลการตรวจพบนโยบายแสดงใน lint ของ doctor
    - คุณต้องมีแฮชการรับรองนโยบายเพื่อใช้เป็นหลักฐานการตรวจสอบ
summary: เอกสารอ้างอิง CLI สำหรับการตรวจสอบความสอดคล้องของ `openclaw policy`
title: นโยบาย
x-i18n:
    generated_at: "2026-07-12T15:54:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 280f9ed1e741786f85dfed978690eb18a03c8fbde20e0d01e31a9d215ae0a128
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` มาจาก Policy Plugin ที่รวมมาให้ โดยเป็นชั้นการตรวจสอบความสอดคล้องระดับองค์กรบนการตั้งค่า OpenClaw ที่มีอยู่ ไม่ใช่ระบบกำหนดค่าอีกระบบหนึ่ง คุณกำหนดข้อกำหนดใน `policy.jsonc`; OpenClaw สังเกตเวิร์กสเปซที่ใช้งานอยู่เพื่อใช้เป็นหลักฐาน; นโยบายรายงานความคลาดเคลื่อนผ่าน `doctor --lint` นโยบายไม่ได้บังคับใช้การเรียกเครื่องมือหรือเขียนพฤติกรรมรันไทม์ใหม่ขณะประมวลผลคำขอ และไม่ได้รับรองที่เก็บข้อมูลประจำตัวแยกตามเอเจนต์ เช่น `auth-profiles.json`

นโยบายตรวจสอบช่องทางที่กำหนดค่าไว้, เซิร์ฟเวอร์ MCP, ผู้ให้บริการโมเดล, สถานะการป้องกัน SSRF ของเครือข่าย, การเข้าถึงขาเข้า/ช่องทาง, การเปิดเผย Gateway และสถานะคำสั่งของ Node, การเข้าถึงเวิร์กสเปซของเอเจนต์, สถานะแซนด์บ็อกซ์, สถานะการจัดการข้อมูล, สถานะผู้ให้บริการข้อมูลลับ/โปรไฟล์การยืนยันตัวตน และข้อมูลเมตาของเครื่องมือที่อยู่ภายใต้การกำกับดูแล (`TOOLS.md`) ใช้เมื่อเวิร์กสเปซต้องมีข้อกำหนดที่คงทนและตรวจสอบได้ เช่น "ต้องไม่เปิดใช้งาน Telegram" หรือ "เครื่องมือที่อยู่ภายใต้การกำกับดูแลต้องประกาศข้อมูลเมตาด้านความเสี่ยงและเจ้าของ" หากคุณต้องการเพียงพฤติกรรมภายในเครื่องโดยไม่มีการรับรองหรือการตรวจจับความคลาดเคลื่อน การกำหนดค่าปกติก็เพียงพอ

## เริ่มต้นอย่างรวดเร็ว

```bash
openclaw plugins enable policy
```

Plugin จะยังคงเปิดใช้งานแม้ไม่มี `policy.jsonc` เพื่อให้ doctor รายงานอาร์ติแฟกต์ที่ขาดหายไป แทนที่จะข้ามการตรวจสอบโดยไม่แจ้งให้ทราบ

เขียน `policy.jsonc` ด้วยตนเอง; ไฟล์นี้ไม่ได้สร้างจากการตั้งค่าปัจจุบัน แต่ละส่วนระดับบนสุดเป็นเนมสเปซของกฎ: การตรวจสอบจะทำงานเฉพาะเมื่อมีกฎที่ชัดเจนอยู่ภายใต้ส่วนนั้น (ส่วนหรือคีย์ที่ไม่รองรับจะล้มเหลวด้วย `policy/policy-jsonc-invalid` แทนที่จะถูกละเว้นโดยไม่แจ้งให้ทราบ) ตัวอย่างขั้นต่ำที่ครอบคลุมทุกส่วนที่รองรับ:

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram is not approved for this workspace.",
      },
    ],
  },
  "mcp": {
    "servers": {
      "allow": ["docs"],
      "deny": ["untrusted"],
    },
  },
  "models": {
    "providers": {
      "allow": ["openai", "anthropic"],
      "deny": ["openrouter"],
    },
  },
  "network": {
    "privateNetwork": {
      "allow": false,
    },
  },
  "ingress": {
    "session": {
      "requireDmScope": "per-channel-peer",
    },
    "channels": {
      "allowDmPolicies": ["pairing", "allowlist", "disabled"],
      "denyOpenGroups": true,
      "requireMentionInGroups": true,
    },
  },
  "gateway": {
    "exposure": {
      "allowNonLoopbackBind": false,
      "allowTailscaleFunnel": false,
    },
    "auth": {
      "requireAuth": true,
      "requireExplicitRateLimit": true,
    },
    "controlUi": {
      "allowInsecure": false,
    },
    "remote": {
      "allow": false,
    },
    "http": {
      "denyEndpoints": ["chatCompletions", "responses"],
      "requireUrlAllowlists": true,
    },
    "nodes": {
      "denyCommands": ["system.run"],
    },
  },
  "agents": {
    "workspace": {
      "allowedAccess": ["none", "ro"],
      "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
    },
  },
  "dataHandling": {
    "sensitiveLogging": {
      "requireRedaction": true,
    },
    "telemetry": {
      "denyContentCapture": true,
    },
    "retention": {
      "requireSessionMaintenance": true,
    },
    "memory": {
      "denySessionTranscriptIndexing": true,
    },
  },
  "secrets": {
    "requireManagedProviders": true,
    "denySources": ["exec"],
    "allowInsecureProviders": false,
  },
  "auth": {
    "profiles": {
      "requireMetadata": ["provider", "mode"],
      "allowModes": ["api_key", "token"],
    },
  },
  "execApprovals": {
    "requireFile": true,
    "defaults": { "allowSecurity": ["deny"] },
    "agents": {
      "allowSecurity": ["deny", "allowlist"],
      "allowAutoAllowSkills": false,
      "allowlist": { "expected": ["deploy", "status"] },
    },
  },
  "tools": {
    "requireMetadata": ["risk", "sensitivity", "owner"],
    "profiles": {
      "allow": ["messaging", "minimal"],
    },
    "fs": {
      "requireWorkspaceOnly": true,
    },
    "exec": {
      "allowSecurity": ["deny", "allowlist"],
      "requireAsk": ["always"],
      "allowHosts": ["sandbox"],
    },
    "elevated": {
      "allow": false,
    },
    "denyTools": ["group:runtime", "group:fs"],
  },
}
```

หมายเหตุที่ครอบคลุมหลายส่วนและอาจไม่ชัดเจนจากตารางกฎด้านล่าง:

- การละ `gateway.bind` ไว้ขณะปฏิเสธการผูกกับที่อยู่นอก local loopback หมายความว่าคุณยอมรับค่าเริ่มต้นของรันไทม์; กำหนด `gateway.bind: "loopback"` เพื่อให้สอดคล้องอย่างเคร่งครัด
- สำหรับเอเจนต์แบบอ่านอย่างเดียว ให้ตั้งค่า `mode` ของแซนด์บ็อกซ์เป็น `all` หรือ `non-main` ในค่าเริ่มต้น/เอเจนต์ที่เกี่ยวข้อง และตั้งค่า `workspaceAccess` เป็น `none` หรือ `ro` โหมดแซนด์บ็อกซ์ที่ขาดหายไปหรือเป็น `off` ไม่เป็นไปตามนโยบายแบบอ่านอย่างเดียว
- `agents.workspace.denyTools` รองรับ `exec`, `process`, `write`, `edit`, `apply_patch` กลุ่มปฏิเสธเครื่องมือในการกำหนดค่า `group:fs` (การแก้ไขไฟล์) และ `group:runtime` (เชลล์/กระบวนการ) เป็นไปตามสถานะที่เทียบเท่ากัน
- การตรวจสอบการอนุมัติการดำเนินการจะอ่านอาร์ติแฟกต์ `exec-approvals.json` ที่ใช้งานอยู่เฉพาะเมื่อมีกฎ `execApprovals`; อาร์ติแฟกต์ที่ขาดหายไปหรือไม่ถูกต้องคือหลักฐานที่สังเกตไม่ได้ ไม่ใช่ผลผ่านที่สร้างขึ้น
- หลักฐานของข้อมูลลับและโปรไฟล์การยืนยันตัวตนจะบันทึกเฉพาะสถานะผู้ให้บริการ/แหล่งที่มาและข้อมูลเมตา SecretRef เท่านั้น โดยจะไม่บันทึกค่าดิบ นโยบายไม่อ่านหรือรับรองที่เก็บข้อมูลประจำตัวแยกตามเอเจนต์ เช่น `auth-profiles.json`
- หลักฐานการจัดการข้อมูลเป็นเพียงสถานะระดับการกำหนดค่า (โหมดการปกปิดข้อมูล, สวิตช์การบันทึกข้อมูลเทเลเมทรี, โหมดการบำรุงรักษาเซสชัน, การตั้งค่าการทำดัชนีบทถอดความ) โดยไม่ตรวจสอบบันทึก, ข้อมูลส่งออกเทเลเมทรี, บทถอดความ หรือไฟล์หน่วยความจำ และผลลัพธ์ที่ไม่พบปัญหาไม่ได้พิสูจน์ว่าไม่มีข้อมูลส่วนบุคคลหรือข้อมูลลับอยู่ในสิ่งเหล่านั้น

### ข้อมูลอ้างอิงกฎนโยบาย

กฎทุกข้อด้านล่างเป็นทางเลือก; การตรวจสอบจะทำงานเฉพาะเมื่อมีกฎนั้น สถานะที่สังเกตได้คือการกำหนดค่า OpenClaw หรือข้อมูลเมตาของเวิร์กสเปซที่มีอยู่

#### การซ้อนทับแบบกำหนดขอบเขต

ใช้ `scopes.<scopeName>` เมื่อเอเจนต์หรือช่องทางบางรายการต้องใช้นโยบายที่เข้มงวดกว่าค่าพื้นฐานระดับบนสุด ชื่อขอบเขตเป็นเพียงป้ายกำกับ; การจับคู่ใช้ตัวเลือกภายในขอบเขต การซ้อนทับเป็นแบบเพิ่มเข้าไป: กฎส่วนกลางยังคงทำงาน และกฎที่กำหนดขอบเขตสามารถเพิ่มข้อค้นพบของตนเองกับหลักฐานเดียวกันได้

| ตัวเลือก     | ส่วนที่รองรับ                                                             | ใช้เมื่อ                                          |
| ------------ | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | เอเจนต์รันไทม์อย่างน้อยหนึ่งรายการต้องใช้กฎที่เข้มงวดขึ้น   |
| `channelIds` | `ingress.channels`                                                             | ช่องทางอย่างน้อยหนึ่งรายการต้องใช้กฎขาเข้าที่เข้มงวดขึ้น |

หากรายการ `agentIds` ไม่มีอยู่ใน `agents.list[]` OpenClaw จะประเมินกฎที่กำหนดขอบเขตกับสถานะส่วนกลาง/ค่าเริ่มต้นที่สืบทอดมาสำหรับรหัสเอเจนต์รันไทม์นั้น แทนที่จะข้ามไป

```jsonc
{
  "tools": {
    "exec": {
      "allowHosts": ["sandbox", "node"],
    },
  },
  "sandbox": {
    "requireMode": ["all", "non-main"],
  },
  "scopes": {
    "release-workspace": {
      "agentIds": ["release-agent", "review-agent"],
      "agents": {
        "workspace": {
          "allowedAccess": ["none", "ro"],
        },
      },
    },
    "release-lockdown": {
      "agentIds": ["release-agent"],
      "tools": {
        "exec": {
          "allowHosts": ["sandbox"],
          "allowSecurity": ["deny", "allowlist"],
          "requireAsk": ["always"],
        },
        "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
      },
      "sandbox": {
        "requireMode": ["all"],
        "allowBackends": ["docker"],
      },
      "dataHandling": {
        "memory": {
          "denySessionTranscriptIndexing": true,
        },
      },
    },
    "shell-sandbox": {
      "agentIds": ["shell-agent"],
      "sandbox": {
        "allowBackends": ["openshell"],
        "containers": {
          "requireReadOnlyMounts": false,
        },
      },
    },
    "telegram-ingress": {
      "channelIds": ["telegram"],
      "ingress": {
        "channels": {
          "allowDmPolicies": ["pairing"],
          "denyOpenGroups": true,
          "requireMentionInGroups": true,
        },
      },
    },
  },
}
```

เอเจนต์เดียวกันสามารถปรากฏในหลายขอบเขตได้ หากแต่ละขอบเขตกำกับดูแลคนละฟิลด์ดังตัวอย่างข้างต้น ฟิลด์ที่กำหนดขอบเขตซ้ำสำหรับเอเจนต์เดียวกันต้องเข้มงวดเท่ากันหรือมากกว่า; การอ้างข้อกำหนดซ้ำที่อ่อนกว่าจะถูกปฏิเสธ (รายการอนุญาตต้องเป็นเซตย่อย, รายการปฏิเสธต้องเป็นเซตครอบคลุม และค่าบูลีนที่บังคับต้องคงที่)

กฎสถานะคอนเทนเนอร์ (`sandbox.containers.*`) จะตรวจสอบกับหลักฐานที่แบ็กเอนด์แซนด์บ็อกซ์ของเอเจนต์ที่ตรงกันสามารถเปิดเผยได้เท่านั้น หากแบ็กเอนด์ไม่สามารถสังเกตกฎที่คุณเปิดใช้งานสำหรับแบ็กเอนด์นั้น นโยบายจะรายงาน `policy/sandbox-container-posture-unobservable` แทนการให้ผลผ่าน; ให้กำหนดขอบเขตกฎคอนเทนเนอร์เฉพาะกับกลุ่มเอเจนต์ที่ใช้แบ็กเอนด์ซึ่งสามารถเปิดเผยหลักฐานดังกล่าวได้

`ingress.session.requireDmScope` ระดับบนสุดยังคงเป็นแบบส่วนกลาง; `session.dmScope` ไม่ใช่หลักฐานที่ระบุที่มาของช่องทางได้ จึงไม่สามารถกำหนดขอบเขตด้วย `channelIds`

ทุกขอบเขตที่อยู่ใน `policy.jsonc` ต้องถูกต้องและสามารถบังคับใช้ได้

#### ช่องทาง

| ฟิลด์นโยบาย                         | สถานะที่สังเกตได้                          | ใช้เมื่อ                                                     |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | ผู้ให้บริการและสถานะเปิดใช้งานของ `channels.*` | ปฏิเสธช่องทางที่กำหนดค่าจากผู้ให้บริการ เช่น `telegram` |
| `channels.denyRules[].reason`        | ข้อความข้อค้นพบและบริบทคำแนะนำการแก้ไข | อธิบายเหตุผลที่ผู้ให้บริการถูกปฏิเสธ                          |

#### เซิร์ฟเวอร์ MCP

| ฟิลด์นโยบาย        | สถานะที่สังเกตได้      | ใช้เมื่อ                                                   |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | รหัส `mcp.servers.*` | กำหนดให้เซิร์ฟเวอร์ MCP ที่ตั้งค่าไว้ทุกรายการต้องอยู่ในรายการอนุญาต |
| `mcp.servers.deny`  | รหัส `mcp.servers.*` | ปฏิเสธรหัสเซิร์ฟเวอร์ MCP ที่ตั้งค่าไว้บางรายการ                   |

#### ผู้ให้บริการโมเดล

| ฟิลด์นโยบาย             | สถานะที่สังเกตได้                                   | ใช้เมื่อ                                                                        |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | รหัส `models.providers.*` และการอ้างอิงโมเดลที่เลือก | กำหนดให้ผู้ให้บริการที่ตั้งค่าไว้และการอ้างอิงโมเดลที่เลือกใช้ผู้ให้บริการที่ได้รับอนุมัติ |
| `models.providers.deny`  | รหัส `models.providers.*` และการอ้างอิงโมเดลที่เลือก | ปฏิเสธผู้ให้บริการที่ตั้งค่าไว้และการอ้างอิงโมเดลที่เลือกตามรหัสผู้ให้บริการ               |

#### เครือข่าย

| ฟิลด์นโยบาย                   | สถานะที่สังเกตได้                      | ใช้เมื่อ                                                           |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | ช่องทางเลี่ยงการป้องกัน SSRF ของเครือข่ายส่วนตัว | ตั้งเป็น `false` เพื่อกำหนดให้การเข้าถึงเครือข่ายส่วนตัวยังคงปิดใช้งาน |

#### การเข้าถึงขาเข้าและช่องทาง

| ฟิลด์นโยบาย                              | สถานะที่ตรวจพบ                                                 | ใช้เมื่อ                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | กำหนดให้มีขอบเขตการแยกข้อความโดยตรงที่ผ่านการตรวจสอบแล้ว                 |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` และฟิลด์นโยบาย DM แบบเดิมของช่องทาง      | อนุญาตเฉพาะนโยบายช่องทางข้อความโดยตรงที่ผ่านการตรวจสอบแล้ว               |
| `ingress.channels.denyOpenGroups`         | นโยบายขาเข้าของช่องทาง บัญชี และกลุ่ม                           | ปฏิเสธขาเข้าของกลุ่มแบบเปิดสำหรับช่องทางและบัญชีที่กำหนดค่าไว้            |
| `ingress.channels.requireMentionInGroups` | การกำหนดค่าด่านตรวจการกล่าวถึงของช่องทาง บัญชี กลุ่ม กิลด์ และระดับซ้อน | กำหนดให้มีด่านตรวจการกล่าวถึงเมื่อขาเข้าของกลุ่มเปิดอยู่หรือกำหนดให้ต้องกล่าวถึง |

#### Gateway

| ฟิลด์นโยบาย                            | สถานะที่ตรวจพบ                                 | ใช้เมื่อ                                                                             |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | ตั้งเป็น `false` เพื่อกำหนดให้ Gateway ผูกกับ local loopback เท่านั้น                |
| `gateway.exposure.allowTailscaleFunnel` | รูปแบบการให้บริการ/ฟันเนล Gateway ของ Tailscale | ตั้งเป็น `false` เพื่อปฏิเสธการเปิดเผยผ่าน Tailscale Funnel                          |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | ตั้งเป็น `true` เพื่อปฏิเสธการปิดใช้การยืนยันตัวตนของ Gateway                        |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | ตั้งเป็น `true` เพื่อกำหนดให้ระบุการกำหนดค่าการจำกัดอัตราสำหรับการยืนยันตัวตนอย่างชัดเจน |
| `gateway.controlUi.allowInsecure`       | สวิตช์การยืนยันตัวตน/อุปกรณ์/ต้นทางที่ไม่ปลอดภัยของ UI ควบคุม | ตั้งเป็น `false` เพื่อปฏิเสธสวิตช์การเปิดเผย UI ควบคุมที่ไม่ปลอดภัย                  |
| `gateway.remote.allow`                  | โหมด/การกำหนดค่า Gateway ระยะไกล              | ตั้งเป็น `false` เพื่อปฏิเสธโหมด Gateway ระยะไกล                                     |
| `gateway.http.denyEndpoints`            | ปลายทาง API HTTP ของ Gateway                   | ปฏิเสธรหัสปลายทาง เช่น `chatCompletions` หรือ `responses`                            |
| `gateway.http.requireUrlAllowlists`     | อินพุตการดึงข้อมูลจาก URL ของ Gateway HTTP     | ตั้งเป็น `true` เพื่อกำหนดให้มีรายการอนุญาต URL สำหรับอินพุตการดึงข้อมูลจาก URL      |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                   | กำหนดให้รหัสคำสั่ง Node ที่ตรงกันทุกประการ เช่น `system.run` ถูกปฏิเสธในการกำหนดค่า OpenClaw |

`gateway.nodes.denyCommands` เป็นกฎชุดครอบคลุมการปฏิเสธที่ต้องตรงกันทุกประการและคำนึงถึงตัวพิมพ์เล็ก-ใหญ่
ใช้เมื่อจำเป็นต้องพิสูจน์ด้วยนโยบายว่าคำสั่ง Node ที่มีสิทธิ์สูงถูกปฏิเสธ
อย่างชัดเจนโดยการกำหนดค่า OpenClaw การติดตั้งใช้งานที่ตั้งใจอนุญาตคำสั่ง
Node ที่มีสิทธิ์สูงควรอัปเดต `policy.jsonc` หลังการตรวจสอบ แทนที่จะพึ่งพา
`gateway.nodes.allowCommands` เพียงอย่างเดียว

#### พื้นที่ทำงานของเอเจนต์

| ฟิลด์นโยบาย                     | สถานะที่ตรวจพบ                                                                        | ใช้เมื่อ                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` และ `agents.list[].sandbox.workspaceAccess` | อนุญาตเฉพาะค่าการเข้าถึงพื้นที่ทำงานของแซนด์บ็อกซ์ เช่น `none` หรือ `ro`                  |
| `agents.workspace.denyTools`     | การกำหนดค่าปฏิเสธเครื่องมือส่วนกลางและรายเอเจนต์                                      | กำหนดให้ปฏิเสธเครื่องมือที่แก้ไขข้อมูล (`exec`, `process`, `write`, `edit`, `apply_patch`) |

#### รูปแบบความปลอดภัยของแซนด์บ็อกซ์

| ฟิลด์นโยบาย                                          | สถานะที่ตรวจพบ                                          | ใช้เมื่อ                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` และโหมดรายเอเจนต์       | อนุญาตเฉพาะโหมดแซนด์บ็อกซ์ที่ผ่านการตรวจสอบแล้ว เช่น `all` หรือ `non-main` |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` และแบ็กเอนด์รายเอเจนต์ | อนุญาตเฉพาะแบ็กเอนด์แซนด์บ็อกซ์ที่ผ่านการตรวจสอบแล้ว เช่น `docker` |
| `sandbox.containers.denyHostNetwork`                  | โหมดเครือข่ายของแซนด์บ็อกซ์/เบราว์เซอร์ที่ใช้คอนเทนเนอร์ | ปฏิเสธโหมดเครือข่ายโฮสต์                                      |
| `sandbox.containers.denyContainerNamespaceJoin`       | โหมดเครือข่ายของแซนด์บ็อกซ์/เบราว์เซอร์ที่ใช้คอนเทนเนอร์ | ปฏิเสธการเข้าร่วมเนมสเปซเครือข่ายของคอนเทนเนอร์อื่น            |
| `sandbox.containers.requireReadOnlyMounts`            | โหมดการเมานต์ของแซนด์บ็อกซ์/เบราว์เซอร์ที่ใช้คอนเทนเนอร์ | กำหนดให้การเมานต์เป็นแบบอ่านอย่างเดียว                         |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | เป้าหมายการเมานต์ของแซนด์บ็อกซ์/เบราว์เซอร์ที่ใช้คอนเทนเนอร์ | ปฏิเสธการเมานต์ซ็อกเก็ตรันไทม์ของคอนเทนเนอร์                   |
| `sandbox.containers.denyUnconfinedProfiles`           | รูปแบบโปรไฟล์ความปลอดภัยของคอนเทนเนอร์                  | ปฏิเสธโปรไฟล์ความปลอดภัยของคอนเทนเนอร์แบบไม่มีข้อจำกัด          |
| `sandbox.browser.requireCdpSourceRange`               | ช่วงต้นทาง CDP ของเบราว์เซอร์แซนด์บ็อกซ์               | กำหนดให้การเปิดเผย CDP ของเบราว์เซอร์ต้องประกาศช่วงต้นทาง       |

นโยบายถือว่า `sandbox.mode` ที่ขาดหายไปใช้ค่าเริ่มต้นโดยนัยเป็น `off` ดังนั้น
`sandbox.requireMode` จะรายงานว่าแซนด์บ็อกซ์ใหม่หรือยังไม่ได้กำหนดค่าอยู่นอก
รายการอนุญาต เช่น `["all"]`

#### การจัดการข้อมูล

| ฟิลด์นโยบาย                                        | สถานะที่ตรวจพบ                                                                       | ใช้เมื่อ                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | ตั้งเป็น `true` เพื่อปฏิเสธ `logging.redactSensitive: "off"`           |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | ตั้งเป็น `true` เพื่อปฏิเสธการบันทึกเนื้อหาโดยระบบโทรมาตร              |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | ตั้งเป็น `true` เพื่อกำหนดให้โหมดการบำรุงรักษาเซสชันที่มีผลเป็น `enforce` |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` และ `agents.*.memorySearch.experimental.sessionMemory` | ตั้งเป็น `true` เพื่อปฏิเสธการจัดทำดัชนีบันทึกการสนทนาของเซสชันลงในหน่วยความจำ |

#### ข้อมูลลับ

| ฟิลด์นโยบาย                      | สถานะที่ตรวจพบ                                           | ใช้เมื่อ                                                                |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | SecretRefs ในการกำหนดค่าและการประกาศ `secrets.providers.*` | ตั้งเป็น `true` เพื่อกำหนดให้ SecretRefs ชี้ไปยังผู้ให้บริการที่ประกาศไว้ |
| `secrets.denySources`             | แหล่งที่มาของผู้ให้บริการข้อมูลลับและแหล่งที่มาของ SecretRef | ปฏิเสธแหล่งที่มา เช่น `exec`, `file` หรือชื่อแหล่งที่มาอื่นที่กำหนดค่าไว้ |
| `secrets.allowInsecureProviders`  | แฟล็กรูปแบบความปลอดภัยต่ำของผู้ให้บริการข้อมูลลับ        | ตั้งเป็น `false` เพื่อปฏิเสธผู้ให้บริการที่เลือกใช้รูปแบบที่ไม่ปลอดภัย    |

#### การอนุมัติ Exec

การตรวจสอบการอนุมัติ Exec จะอ่านอาร์ติแฟกต์รันไทม์ `exec-approvals.json`:
โดยค่าเริ่มต้นคือ `~/.openclaw/exec-approvals.json` หรือ
`$OPENCLAW_STATE_DIR/exec-approvals.json` เมื่อตั้งค่า `OPENCLAW_STATE_DIR`
กฎรูปแบบภายใต้ `execApprovals.defaults.*` หรือ `execApprovals.agents.*`
กำหนดให้มีหลักฐานอาร์ติแฟกต์ที่อ่านได้ อาร์ติแฟกต์ที่ขาดหายไปหรือไม่ถูกต้องจะถูกรายงานเป็น
หลักฐานที่ไม่สามารถสังเกตได้ แทนที่จะถือว่าผ่านโดยพยายามเท่าที่ทำได้ เมื่ออ่านได้แล้ว ฟิลด์ที่ละไว้
จะสืบทอดค่าเริ่มต้นของรันไทม์: `defaults.security` ที่ขาดหายไปจะเป็น `full` และ
การตั้งค่าความปลอดภัยของเอเจนต์ที่ขาดหายไปจะสืบทอดค่าเริ่มต้นนั้น หลักฐานประกอบด้วย `defaults`,
`agents.*`, `agents.*.allowlist[].pattern`, `argPattern` ที่เป็นตัวเลือก, รูปแบบ
`autoAllowSkills` ที่มีผล และแหล่งที่มาของรายการ โดยจะไม่รวมพาธ/โทเค็นซ็อกเก็ต,
`commandText`, `lastUsedCommand`, พาธที่แก้ไขแล้ว หรือการประทับเวลา

| ฟิลด์นโยบาย                                | สถานะที่ตรวจพบ                                                                         | ใช้เมื่อ                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | พาธ `exec-approvals.json` ของรันไทม์ที่ใช้งานอยู่                                      | ตั้งเป็น `true` เพื่อกำหนดให้อาร์ติแฟกต์การอนุมัติต้องมีอยู่และแยกวิเคราะห์ได้           |
| `execApprovals.defaults.allowSecurity`      | `defaults.security` โดยมีค่าเริ่มต้นเป็น `full`                                        | อนุญาตเฉพาะโหมดความปลอดภัยเริ่มต้นสำหรับการอนุมัติที่ได้รับการรับรอง                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security` ซึ่งสืบทอดค่าเริ่มต้น                                               | อนุญาตเฉพาะโหมดความปลอดภัยที่มีผลสำหรับการอนุมัติรายเอเจนต์ที่ได้รับการรับรอง            |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` และ `agents.*.autoAllowSkills` ซึ่งสืบทอดค่าเริ่มต้นของรันไทม์ | ตั้งเป็น `false` เพื่อกำหนดให้ใช้รายการอนุญาตด้วยตนเองอย่างเข้มงวด โดยไม่มีการอนุมัติ CLI ของ Skills โดยนัย |
| `execApprovals.agents.allowlist.expected`   | รายการรูปแบบรวมจาก `agents.*.allowlist[]` และรายการ `argPattern` ที่เป็นตัวเลือก       | กำหนดให้รายการอนุญาตการอนุมัติตรงกับชุดรูปแบบที่ผ่านการตรวจสอบแล้ว                       |

ตัวอย่าง: กำหนดให้มีอาร์ติแฟกต์การอนุมัติ ปฏิเสธค่าเริ่มต้นที่ผ่อนปรน และอนุญาต
เฉพาะรูปแบบการอนุมัติ Exec ที่ผ่านการตรวจสอบแล้วสำหรับเอเจนต์ที่เลือก

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // โหมดความปลอดภัย: "deny", "allowlist" หรือ "full"
      // ค่าเริ่มต้นนี้อนุญาตเฉพาะสถานะปฏิเสธที่จำกัดอย่างเข้มงวด
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // เอเจนต์ที่เลือกอาจใช้สถานะรายการที่อนุญาตซึ่งผ่านการตรวจสอบแล้ว แต่ห้ามใช้ "full"
          "allowSecurity": ["allowlist"],
          // false หมายความว่า CLI ของ Skills ต้องปรากฏในรายการที่อนุญาตซึ่งผ่านการตรวจสอบแล้ว แทนที่จะ
          // ได้รับอนุมัติโดยปริยายผ่าน autoAllowSkills
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // รายการแบบง่าย: รูปแบบไฟล์ปฏิบัติการที่ผ่านการตรวจสอบและตรงกันทุกประการ โดยไม่มี argPattern
              "travel-hub",
              // รายการแบบมีข้อจำกัด: รูปแบบพร้อมนิพจน์ทั่วไปของอาร์กิวเมนต์ที่ผ่านการตรวจสอบแล้ว
              { "pattern": "calendar-cli", "argPattern": "^sync\\b" },
              "/bin/date",
            ],
          },
        },
      },
    },
  },
}
```

#### โปรไฟล์การยืนยันตัวตน

| ฟิลด์นโยบาย                    | สถานะที่ตรวจพบ                               | ใช้เมื่อ                                                                                   |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | ข้อมูลเมตาของผู้ให้บริการและโหมดใน `auth.profiles.*` | กำหนดให้โปรไฟล์การยืนยันตัวตนในการกำหนดค่ามีคีย์ข้อมูลเมตา เช่น `provider` และ `mode`               |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | อนุญาตเฉพาะโหมดโปรไฟล์การยืนยันตัวตนที่รองรับ เช่น `api_key`, `aws-sdk`, `oauth` หรือ `token` |

#### ข้อมูลเมตาของเครื่องมือ

| ฟิลด์นโยบาย            | สถานะที่ตรวจพบ                   | ใช้เมื่อ                                                                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | การประกาศใน `TOOLS.md` ที่อยู่ภายใต้การกำกับดูแล | กำหนดให้เครื่องมือที่อยู่ภายใต้การกำกับดูแลประกาศคีย์ข้อมูลเมตา เช่น `risk`, `sensitivity` หรือ `owner` |

#### สถานะการควบคุมเครื่องมือ

| ฟิลด์นโยบาย                    | สถานะที่ตรวจพบ                                              | ใช้เมื่อ                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` และ `agents.list[].tools.profile`           | อนุญาตเฉพาะรหัสโปรไฟล์เครื่องมือ เช่น `minimal`, `messaging` หรือ `coding`                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` และการแทนที่ `tools.fs` รายเอเจนต์ | ตั้งเป็น `true` เพื่อกำหนดให้สถานะเครื่องมือระบบไฟล์จำกัดเฉพาะพื้นที่ทำงาน                                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` และการรักษาความปลอดภัยการดำเนินการรายเอเจนต์           | อนุญาตเฉพาะโหมดความปลอดภัยในการดำเนินการ เช่น `deny` หรือ `allowlist`                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` และโหมดการขออนุมัติการดำเนินการรายเอเจนต์                | กำหนดสถานะการอนุมัติ เช่น `always`                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` และการกำหนดเส้นทางโฮสต์การดำเนินการรายเอเจนต์           | อนุญาตเฉพาะโหมดการกำหนดเส้นทางโฮสต์สำหรับการดำเนินการ เช่น `sandbox`                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` และสถานะสิทธิ์ระดับสูงรายเอเจนต์     | ตั้งเป็น `false` เพื่อกำหนดให้โหมดเครื่องมือสิทธิ์ระดับสูงยังคงปิดใช้งาน                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` และ `tools.alsoAllow` รายเอเจนต์           | กำหนดให้รายการ `alsoAllow` ตรงกันทุกประการ และรายงานสิทธิ์เครื่องมือเพิ่มเติมที่ขาดหายหรือไม่คาดหมาย                 |
| `tools.denyTools`               | `tools.deny` และ `agents.list[].tools.deny`                 | กำหนดให้รายการปฏิเสธเครื่องมือที่ตั้งค่าไว้รวมรหัสหรือกลุ่มเครื่องมือ เช่น `group:runtime` และ `group:fs` |

## เรียกใช้การตรวจสอบ

เรียกใช้เฉพาะการตรวจสอบนโยบายระหว่างการจัดทำ:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` เรียกใช้เฉพาะชุดการตรวจสอบนโยบาย และส่งออกหลักฐาน ข้อค้นพบ
และแฮชการรับรอง ข้อค้นพบเดียวกันจะปรากฏใน
`openclaw doctor --lint` ด้วยเมื่อเปิดใช้งาน Plugin นโยบาย

เปรียบเทียบไฟล์นโยบายของผู้ดำเนินการกับค่าพื้นฐานที่จัดทำไว้:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` ตรวจสอบไวยากรณ์ของไฟล์นโยบายเทียบกับไวยากรณ์ของไฟล์นโยบาย โดย
ไม่ตรวจสอบสถานะรันไทม์ หลักฐาน ข้อมูลประจำตัว หรือข้อมูลลับ เครื่องมือนี้ใช้
ข้อมูลเมตาของกฎชุดเดียวกับที่ควบคุมโอเวอร์เลย์ตามขอบเขต: รายการที่อนุญาตต้องคงความเท่ากันหรือ
แคบลง รายการปฏิเสธต้องคงความเท่ากันหรือกว้างขึ้น ค่าบูลีนที่บังคับต้องคง
ค่าเดิม สตริงที่มีลำดับจะเลื่อนได้เฉพาะไปยังด้านที่เข้มงวดกว่าของ
ลำดับที่กำหนดค่าไว้ และรายการแบบตรงกันทุกประการต้องตรงกัน ค่าพื้นฐานอาจเป็น
นโยบายที่องค์กรจัดทำขึ้น ส่วนนโยบายที่ตรวจสอบอาจเพิ่มค่าที่เข้มงวดขึ้นหรือ
กฎเพิ่มเติมได้ กฎระดับบนสุดที่ตรวจสอบสามารถทำให้กฎพื้นฐานตามขอบเขตเป็นไปตามข้อกำหนดได้ เมื่อ
กฎนั้นเข้มงวดเท่ากันหรือมากกว่า ชื่อขอบเขตไม่จำเป็นต้องตรงกันระหว่าง
ไฟล์ การเปรียบเทียบใช้ตัวเลือก (`agentIds`/`channelIds`) และฟิลด์เป็นคีย์

ผลการเปรียบเทียบที่ไม่มีปัญหา (`--json`):

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

ผลลัพธ์ `policy check --json` ที่ไม่มีปัญหาจะมีแฮชคงที่ซึ่งผู้ดำเนินการหรือ
ผู้ควบคุมสามารถบันทึกได้:

```json
{
  "ok": true,
  "attestation": {
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": []
}
```

## กำหนดค่านโยบาย

การกำหนดค่านโยบายอยู่ภายใต้ `plugins.entries.policy.config`

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "enabled": true,
        "config": {
          "enabled": true,
          "path": "policy.jsonc",
          "workspaceRepairs": false,
          "expectedHash": "sha256:...",
          "expectedAttestationHash": "sha256:...",
        },
      },
    },
  },
}
```

| การตั้งค่า                   | วัตถุประสงค์                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | เปิดใช้งานการตรวจสอบนโยบายแม้ก่อนที่ `policy.jsonc` จะมีอยู่         |
| `workspaceRepairs`        | อนุญาตให้ `doctor --fix` แก้ไขการตั้งค่าพื้นที่ทำงานที่นโยบายจัดการ |
| `expectedHash`            | ตัวล็อกแฮชที่ไม่บังคับสำหรับอาร์ติแฟกต์นโยบายที่ได้รับอนุมัติ            |
| `expectedAttestationHash` | ตัวล็อกแฮชที่ไม่บังคับสำหรับการตรวจสอบนโยบายที่ไม่มีปัญหาและได้รับการยอมรับครั้งล่าสุด    |
| `path`                    | ตำแหน่งของอาร์ติแฟกต์นโยบายที่สัมพันธ์กับพื้นที่ทำงาน             |

ตั้งค่า `plugins.entries.policy.config.enabled` เป็น `false` เพื่อปิดใช้งานการตรวจสอบ
นโยบายสำหรับพื้นที่ทำงาน โดยยังคงติดตั้ง Plugin ไว้

## ยอมรับสถานะนโยบาย

ตัวอย่างผลลัพธ์ JSON:

```json
{
  "ok": true,
  "attestation": {
    "checkedAt": "2026-05-10T20:00:00.000Z",
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "evidence": {
    "channels": [
      {
        "id": "telegram",
        "provider": "telegram",
        "source": "oc://openclaw.config/channels/telegram",
        "enabled": false
      }
    ],
    "mcpServers": [
      {
        "id": "docs",
        "transport": "stdio",
        "source": "oc://openclaw.config/mcp/servers/docs",
        "command": "npx"
      }
    ],
    "modelProviders": [
      {
        "id": "openai",
        "source": "oc://openclaw.config/models/providers/openai"
      }
    ],
    "modelRefs": [
      {
        "ref": "openai/gpt-5.6-sol",
        "provider": "openai",
        "model": "gpt-5.6-sol",
        "source": "oc://openclaw.config/agents/defaults/model"
      }
    ],
    "network": [
      {
        "id": "browser-private-network",
        "source": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
        "value": false
      }
    ],
    "gatewayExposure": [
      {
        "id": "gateway-bind",
        "kind": "bind",
        "source": "oc://openclaw.config/gateway/bind",
        "value": "loopback",
        "nonLoopback": false,
        "explicit": true
      }
    ],
    "agentWorkspace": [
      {
        "id": "agents-defaults-workspace-access",
        "kind": "workspaceAccess",
        "source": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
        "scope": "defaults",
        "value": "ro",
        "sandboxMode": "all",
        "sandboxModeSource": "oc://openclaw.config/agents/defaults/sandbox/mode",
        "sandboxEnabled": true,
        "explicit": true
      },
      {
        "id": "agents-defaults-tool-exec",
        "kind": "toolDeny",
        "source": "oc://openclaw.config/tools/deny",
        "scope": "defaults",
        "tool": "exec",
        "denied": true,
        "explicit": true
      }
    ],
    "secrets": [
      {
        "id": "vault",
        "kind": "provider",
        "source": "oc://openclaw.config/secrets/providers/vault",
        "providerSource": "env"
      },
      {
        "id": "oc://openclaw.config/models/providers/openai/apiKey",
        "kind": "input",
        "source": "oc://openclaw.config/models/providers/openai/apiKey",
        "provenance": "secretRef",
        "refSource": "env",
        "refProvider": "vault"
      }
    ],
    "authProfiles": [
      {
        "id": "github",
        "source": "oc://openclaw.config/auth/profiles/github",
        "validMetadata": true,
        "provider": "github",
        "mode": "token"
      }
    ],
    "tools": [
      {
        "id": "deploy",
        "source": "oc://TOOLS.md/tools/deploy",
        "line": 12,
        "risk": "critical",
        "sensitivity": "restricted",
        "capabilities": ["IRREVERSIBLE_EXTERNAL"]
      }
    ]
  },
  "checksRun": 30,
  "checksSkipped": 0,
  "findings": []
}
```

`attestation.policy.hash` ระบุอาร์ติแฟกต์กฎที่จัดทำขึ้น `evidence`
บันทึกสถานะ OpenClaw ที่ตรวจพบซึ่งการตรวจสอบใช้ และ
`workspace.hash` ระบุเพย์โหลดหลักฐานนั้น `findingsHash` ระบุ
ชุดข้อค้นพบที่ตรงกันทุกประการ `checkedAt` บันทึกเวลาที่เรียกใช้การตรวจสอบ
`attestationHash` ระบุคำรับรองแบบคงที่ (แฮชนโยบาย แฮชหลักฐาน
แฮชข้อค้นพบ และสถานะไม่มีปัญหา/มีปัญหา) และจงใจไม่รวม `checkedAt`
ดังนั้นสถานะนโยบายเดียวกันจึงสร้างแฮชการรับรองเดียวกันเสมอ เมื่อใช้ร่วมกัน
ค่าทั้งสี่นี้จะประกอบเป็นทูเพิลการตรวจสอบสำหรับการตรวจสอบนโยบายหนึ่งครั้ง

หาก Gateway หรือผู้ควบคุมใช้นโยบายเพื่อบล็อก อนุมัติ หรือใส่คำอธิบายประกอบให้กับ
การดำเนินการรันไทม์ ระบบควรบันทึกแฮชการรับรองจากการตรวจสอบที่ไม่มีปัญหาครั้งล่าสุด
`checkedAt` ยังคงอยู่ในผลลัพธ์ JSON สำหรับบันทึกการตรวจสอบ แต่ไม่เป็นส่วนหนึ่งของ
แฮชคงที่

วงจรการยอมรับสถานะนโยบาย:

1. จัดทำหรือตรวจทาน `policy.jsonc`
2. เรียกใช้ `openclaw policy check --json`
3. หากไม่มีปัญหา ให้บันทึก `attestation.policy.hash` เป็น `expectedHash`
4. บันทึก `attestation.attestationHash` เป็น `expectedAttestationHash`
5. เรียกใช้ `openclaw doctor --lint` อีกครั้งใน CI หรือเกตการเผยแพร่

หากมีการเปลี่ยนแปลงกฎนโยบายโดยตั้งใจ ให้อัปเดตแฮชที่ยอมรับทั้งสองค่าจากการตรวจสอบที่สะอาด หากเปลี่ยนเฉพาะการตั้งค่าเวิร์กสเปซ (นโยบายยังคงเดิม) โดยทั่วไปจะเปลี่ยนเฉพาะ `expectedAttestationHash`

การเปิดใช้หรืออัปเกรดกฎ `agents.workspace` จะเพิ่มหลักฐาน `agentWorkspace` ลงในแฮชเวิร์กสเปซและแฮชการรับรอง ให้ตรวจสอบหลักฐานใหม่และรีเฟรชแฮชการรับรองที่ยอมรับหลังจากเปิดใช้ การเปิดใช้หรืออัปเกรดกฎสถานะเครื่องมือจะเพิ่มหลักฐาน `toolPosture` ในลักษณะเดียวกัน

`openclaw policy watch` จะเรียกใช้การตรวจสอบซ้ำและรายงานเมื่อหลักฐานปัจจุบันไม่ตรงกับ `expectedAttestationHash` อีกต่อไป:

```bash
openclaw policy watch --json
```

ใช้ `--once` ใน CI หรือสคริปต์ที่ต้องการประเมินความคลาดเคลื่อนเพียงครั้งเดียว หากไม่มี `--once` ระบบจะสำรวจทุกสองวินาทีโดยค่าเริ่มต้น ใช้ `--interval-ms` เพื่อเปลี่ยนช่วงเวลา

## ข้อค้นพบ

| รหัสการตรวจสอบ                                          | ข้อค้นพบ                                                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `policy/policy-jsonc-missing`                            | เปิดใช้นโยบายแล้ว แต่ไม่พบ `policy.jsonc`                                                       |
| `policy/policy-jsonc-invalid`                            | ไม่สามารถแยกวิเคราะห์นโยบายได้ หรือมีรายการกฎที่มีรูปแบบไม่ถูกต้อง                               |
| `policy/policy-hash-mismatch`                            | นโยบายไม่ตรงกับ `expectedHash` ที่กำหนดค่าไว้                                                    |
| `policy/attestation-hash-mismatch`                       | หลักฐานนโยบายปัจจุบันไม่ตรงกับการรับรองที่ยอมรับอีกต่อไป                                         |
| `policy/policy-conformance-invalid`                      | ไฟล์นโยบายฐานหรือไฟล์นโยบายที่ตรวจสอบมีไวยากรณ์การเปรียบเทียบที่ไม่ถูกต้อง                        |
| `policy/policy-conformance-missing`                      | ไฟล์นโยบายที่ตรวจสอบไม่มีกฎที่ไฟล์นโยบายฐานกำหนดให้ต้องมี                                        |
| `policy/policy-conformance-weaker`                       | ไฟล์นโยบายที่ตรวจสอบมีค่าที่อ่อนกว่าค่าในไฟล์นโยบายฐาน                                           |
| `policy/channels-denied-provider`                        | ช่องทางที่เปิดใช้ตรงกับกฎปฏิเสธช่องทาง                                                            |
| `policy/mcp-denied-server`                               | เซิร์ฟเวอร์ MCP ที่กำหนดค่าถูกนโยบายปฏิเสธ                                                        |
| `policy/mcp-unapproved-server`                           | เซิร์ฟเวอร์ MCP ที่กำหนดค่าอยู่นอกรายการอนุญาต                                                    |
| `policy/models-denied-provider`                          | ผู้ให้บริการโมเดลหรือการอ้างอิงโมเดลที่กำหนดค่าใช้ผู้ให้บริการที่ถูกปฏิเสธ                         |
| `policy/models-unapproved-provider`                      | ผู้ให้บริการโมเดลหรือการอ้างอิงโมเดลที่กำหนดค่าอยู่นอกรายการอนุญาต                               |
| `policy/network-private-access-enabled`                  | เปิดใช้ช่องทางหลีกเลี่ยง SSRF สำหรับเครือข่ายส่วนตัว ทั้งที่นโยบายปฏิเสธ                           |
| `policy/ingress-dm-policy-unapproved`                    | นโยบาย DM ของช่องทางอยู่นอกรายการอนุญาตของนโยบาย                                                 |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` ไม่ตรงกับขอบเขตการแยก DM ที่นโยบายกำหนด                                        |
| `policy/ingress-open-groups-denied`                      | นโยบายกลุ่มของช่องทางเป็น `open` ทั้งที่นโยบายปฏิเสธการรับเข้าจากกลุ่มแบบเปิด                    |
| `policy/ingress-group-mention-required`                  | รายการช่องทางหรือกลุ่มปิดใช้เกตการกล่าวถึง ทั้งที่นโยบายกำหนดให้ต้องใช้                           |
| `policy/gateway-non-loopback-bind`                       | สถานะการผูก Gateway อนุญาตให้เปิดเผยนอก local loopback ทั้งที่นโยบายปฏิเสธ                        |
| `policy/gateway-auth-disabled`                           | ปิดใช้การยืนยันตัวตนของ Gateway ทั้งที่นโยบายกำหนดให้ต้องมีการยืนยันตัวตน                         |
| `policy/gateway-rate-limit-missing`                      | ไม่ได้ระบุสถานะการจำกัดอัตราสำหรับการยืนยันตัวตนของ Gateway อย่างชัดเจน ทั้งที่นโยบายกำหนด         |
| `policy/gateway-control-ui-insecure`                     | เปิดใช้ตัวเลือกการเปิดเผย Control UI ของ Gateway แบบไม่ปลอดภัย                                    |
| `policy/gateway-tailscale-funnel`                        | เปิดใช้การเปิดเผย Gateway ผ่าน Tailscale Funnel ทั้งที่นโยบายปฏิเสธ                               |
| `policy/gateway-remote-enabled`                          | โหมดระยะไกลของ Gateway ทำงานอยู่ ทั้งที่นโยบายปฏิเสธ                                              |
| `policy/gateway-http-endpoint-enabled`                   | เปิดใช้ปลายทาง HTTP API ของ Gateway ทั้งที่นโยบายปฏิเสธ                                           |
| `policy/gateway-http-url-fetch-unrestricted`             | อินพุตการดึง URL ผ่าน HTTP ของ Gateway ไม่มีรายการ URL ที่อนุญาตตามข้อกำหนด                       |
| `policy/gateway-node-command-denied`                     | คำสั่ง Node ที่นโยบายปฏิเสธไม่ได้ถูกปฏิเสธโดยการกำหนดค่า OpenClaw                                 |
| `policy/agents-workspace-access-denied`                  | โหมดแซนด์บ็อกซ์ของเอเจนต์หรือการเข้าถึงเวิร์กสเปซอยู่นอกรายการอนุญาตของนโยบาย                     |
| `policy/agents-tool-not-denied`                          | การกำหนดค่าของเอเจนต์หรือค่าเริ่มต้นไม่ได้ปฏิเสธเครื่องมือที่นโยบายกำหนดให้ต้องปฏิเสธ              |
| `policy/tools-profile-unapproved`                        | โปรไฟล์เครื่องมือส่วนกลางหรือต่อเอเจนต์ที่กำหนดค่าอยู่นอกรายการอนุญาต                            |
| `policy/tools-fs-workspace-only-required`                | เครื่องมือระบบไฟล์ไม่ได้กำหนดค่าให้มีสถานะเส้นทางเฉพาะเวิร์กสเปซ                                  |
| `policy/tools-exec-security-unapproved`                  | โหมดความปลอดภัยในการดำเนินการอยู่นอกรายการอนุญาตของนโยบาย                                        |
| `policy/tools-exec-ask-unapproved`                       | โหมดการถามก่อนดำเนินการอยู่นอกรายการอนุญาตของนโยบาย                                              |
| `policy/tools-exec-host-unapproved`                      | การกำหนดเส้นทางโฮสต์สำหรับการดำเนินการอยู่นอกรายการอนุญาตของนโยบาย                               |
| `policy/tools-elevated-enabled`                          | เปิดใช้โหมดเครื่องมือที่มีสิทธิ์ระดับสูง ทั้งที่นโยบายปฏิเสธ                                      |
| `policy/tools-also-allow-missing`                        | รายการ `alsoAllow` ที่กำหนดค่าขาดรายการที่นโยบายกำหนดให้ต้องมี                                    |
| `policy/tools-also-allow-unexpected`                     | รายการ `alsoAllow` ที่กำหนดค่ามีรายการที่นโยบายไม่ได้คาดหมาย                                      |
| `policy/tools-required-deny-missing`                     | รายการปฏิเสธเครื่องมือส่วนกลางหรือต่อเอเจนต์ไม่มีเครื่องมือที่กำหนดให้ต้องปฏิเสธ                   |
| `policy/sandbox-mode-unapproved`                         | โหมดแซนด์บ็อกซ์อยู่นอกรายการอนุญาตของนโยบาย                                                       |
| `policy/sandbox-backend-unapproved`                      | แบ็กเอนด์แซนด์บ็อกซ์อยู่นอกรายการอนุญาตของนโยบาย                                                 |
| `policy/sandbox-container-posture-unobservable`          | เปิดใช้กฎสถานะคอนเทนเนอร์กับแบ็กเอนด์ที่ไม่สามารถสังเกตสถานะดังกล่าวได้                            |
| `policy/sandbox-container-host-network-denied`           | แซนด์บ็อกซ์หรือเบราว์เซอร์ที่ใช้คอนเทนเนอร์ใช้โหมดเครือข่ายของโฮสต์                               |
| `policy/sandbox-container-namespace-join-denied`         | แซนด์บ็อกซ์หรือเบราว์เซอร์ที่ใช้คอนเทนเนอร์เข้าร่วมเนมสเปซของคอนเทนเนอร์อื่น                      |
| `policy/sandbox-container-mount-mode-required`           | การเมานต์ของแซนด์บ็อกซ์หรือเบราว์เซอร์ที่ใช้คอนเทนเนอร์ไม่ใช่แบบอ่านอย่างเดียว                    |
| `policy/sandbox-container-runtime-socket-mount`          | การเมานต์ของแซนด์บ็อกซ์หรือเบราว์เซอร์ที่ใช้คอนเทนเนอร์เปิดเผยซ็อกเก็ตรันไทม์ของคอนเทนเนอร์       |
| `policy/sandbox-container-unconfined-profile`            | โปรไฟล์แซนด์บ็อกซ์ของคอนเทนเนอร์ไม่มีการจำกัด ทั้งที่นโยบายปฏิเสธ                                 |
| `policy/sandbox-browser-cdp-source-range-missing`        | ไม่ได้ระบุช่วงแหล่งที่มา CDP ของเบราว์เซอร์แซนด์บ็อกซ์ ทั้งที่นโยบายกำหนดให้ต้องมี                |
| `policy/data-handling-redaction-disabled`                | ปิดใช้การปกปิดข้อมูลบันทึกที่ละเอียดอ่อน ทั้งที่นโยบายกำหนดให้ต้องใช้                              |
| `policy/data-handling-telemetry-content-capture`         | เปิดใช้การบันทึกเนื้อหาเทเลเมทรี ทั้งที่นโยบายปฏิเสธ                                               |
| `policy/data-handling-session-retention-not-enforced`    | ไม่ได้บังคับใช้การบำรุงรักษาระยะเวลาการเก็บเซสชัน ทั้งที่นโยบายกำหนด                               |
| `policy/data-handling-session-transcript-memory-enabled` | เปิดใช้การจัดทำดัชนีหน่วยความจำจากบันทึกบทสนทนาของเซสชัน ทั้งที่นโยบายปฏิเสธ                       |
| `policy/secrets-unmanaged-provider`                      | SecretRef ในการกำหนดค่าอ้างอิงผู้ให้บริการที่ไม่ได้ประกาศภายใต้ `secrets.providers`               |
| `policy/secrets-denied-provider-source`                  | ผู้ให้บริการข้อมูลลับหรือ SecretRef ในการกำหนดค่าใช้แหล่งที่นโยบายปฏิเสธ                           |
| `policy/secrets-insecure-provider`                       | ผู้ให้บริการข้อมูลลับเลือกใช้สถานะที่ไม่ปลอดภัย ทั้งที่นโยบายปฏิเสธ                               |
| `policy/auth-profile-invalid-metadata`                   | โปรไฟล์การยืนยันตัวตนในการกำหนดค่าไม่มีข้อมูลเมตาของผู้ให้บริการหรือโหมดที่ถูกต้อง                 |
| `policy/auth-profile-unapproved-mode`                    | โหมดโปรไฟล์การยืนยันตัวตนในการกำหนดค่าอยู่นอกรายการอนุญาตของนโยบาย                               |
| `policy/exec-approvals-missing`                          | นโยบายกำหนดให้ต้องมี `exec-approvals.json` แต่ไม่พบอาร์ติแฟกต์                                    |
| `policy/exec-approvals-invalid`                          | ไม่สามารถแยกวิเคราะห์อาร์ติแฟกต์การอนุมัติการดำเนินการที่กำหนดค่าได้                              |
| `policy/exec-approvals-default-security-unapproved`      | ค่าเริ่มต้นของการอนุมัติการดำเนินการใช้โหมดความปลอดภัยที่อยู่นอกรายการอนุญาตของนโยบาย             |
| `policy/exec-approvals-agent-security-unapproved`        | โหมดความปลอดภัยที่มีผลจริงของการอนุมัติการดำเนินการต่อเอเจนต์อยู่นอกรายการอนุญาต                 |
| `policy/exec-approvals-auto-allow-skills-enabled`        | เอเจนต์อนุมัติการดำเนินการอนุญาต CLI ของ Skills โดยอัตโนมัติโดยปริยาย ทั้งที่นโยบายปฏิเสธ         |
| `policy/exec-approvals-allowlist-missing`                | รายการอนุญาตสำหรับการอนุมัติขาดรูปแบบที่นโยบายกำหนดให้ต้องมี                                      |
| `policy/exec-approvals-allowlist-unexpected`             | รายการอนุญาตสำหรับการอนุมัติมีรูปแบบที่นโยบายไม่ได้คาดหมาย                                        |
| `policy/tools-missing-risk-level`                        | การประกาศเครื่องมือที่อยู่ภายใต้การกำกับไม่มีข้อมูลเมตาระดับความเสี่ยง                            |
| `policy/tools-unknown-risk-level`                        | การประกาศเครื่องมือที่อยู่ภายใต้การกำกับใช้ค่าความเสี่ยงที่ไม่รู้จัก                              |
| `policy/tools-missing-sensitivity-token`                 | การประกาศเครื่องมือที่อยู่ภายใต้การกำกับไม่มีข้อมูลเมตาความอ่อนไหว                                |
| `policy/tools-missing-owner`                             | การประกาศเครื่องมือที่อยู่ภายใต้การกำกับไม่มีข้อมูลเมตาเจ้าของ                                    |
| `policy/tools-unknown-sensitivity-token`                 | การประกาศเครื่องมือที่อยู่ภายใต้การกำกับใช้ค่าความอ่อนไหวที่ไม่รู้จัก                             |

ข้อค้นพบหนึ่งรายการสามารถมีทั้ง `target` (สิ่งที่สังเกตพบในเวิร์กสเปซซึ่งไม่เป็นไปตามข้อกำหนด) และ `requirement` (กฎที่เขียนไว้ซึ่งทำให้เกิดข้อค้นพบนั้น) ปัจจุบันทั้งสองเป็นสตริงที่อยู่ `oc://` แต่ชื่อฟิลด์อธิบายบทบาทในนโยบาย ไม่ใช่รูปแบบที่อยู่

ตัวอย่างข้อค้นพบ:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Channel 'telegram' uses denied provider 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram is not approved for this workspace."
}
```

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md tool 'deploy' has no explicit risk classification.",
  "source": "policy",
  "path": "TOOLS.md",
  "line": 12,
  "ocPath": "oc://TOOLS.md/tools/deploy",
  "target": "oc://TOOLS.md/tools/deploy",
  "requirement": "oc://policy.jsonc/tools/requireMetadata"
}
```

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "MCP server 'remote' is not in the policy allowlist.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "Model ref 'anthropic/claude-sonnet-4.7' uses unapproved provider 'anthropic'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "Network setting 'browser-private-network' allows private-network access.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "Gateway bind setting 'gateway-bind' permits non-loopback exposure.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

```json
{
  "checkId": "policy/gateway-node-command-denied",
  "severity": "error",
  "message": "Gateway node command 'system.run' is denied by policy but not denied by OpenClaw config.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Add 'system.run' to gateway.nodes.denyCommands or update policy after review."
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "agents.defaults sandbox workspaceAccess 'rw' is not allowed by policy.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## การซ่อมแซม

`doctor --lint` และ `policy check` เป็นแบบอ่านอย่างเดียว

`doctor --fix` จะแก้ไขการตั้งค่าพื้นที่ทำงานที่นโยบายจัดการเฉพาะเมื่อเปิดใช้
`workspaceRepairs` อย่างชัดเจนเท่านั้น มิฉะนั้น การตรวจสอบจะรายงานสิ่งที่ระบบ
จะซ่อมแซมและคงการตั้งค่าไว้โดยไม่เปลี่ยนแปลง

ในเวอร์ชันนี้ การซ่อมแซมสามารถปิดใช้งานช่องทางที่ `channels.denyRules` ปฏิเสธ
และใช้การซ่อมแซมแบบจำกัดขอบเขตโดยอัตโนมัติตามรายการด้านล่าง เปิดใช้
`workspaceRepairs` หลังจากตรวจสอบไฟล์นโยบายแล้วเท่านั้น เนื่องจากกฎที่ถูกต้อง
อาจเปลี่ยนแปลงการกำหนดค่าพื้นที่ทำงานได้:

- ตั้งค่า `tools.elevated.enabled=false` เมื่อนโยบายส่วนกลางห้ามใช้เครื่องมือที่มีสิทธิ์ระดับสูง
- เพิ่มรหัสเครื่องมือที่ต้องปฏิเสธแต่ยังขาดอยู่ลงใน `tools.deny` หรือ
  `agents.list[].tools.deny` เมื่อนโยบายกำหนดให้ปฏิเสธเครื่องมือเหล่านั้น
- ตั้งค่าตัวเลือก `gateway.controlUi.*` ที่ไม่ปลอดภัยเป็น `false`
- ตั้งค่า `gateway.mode=local` เมื่อนโยบายปฏิเสธโหมด Gateway ระยะไกล
- ตั้งค่าพาธ `gateway.http.endpoints.*.enabled` ที่รายงานเป็น `false` เมื่อนโยบาย
  ปฏิเสธปลายทาง HTTP API ของ Gateway
- ตั้งค่าพาธ `groupPolicy` สำหรับการรับข้อมูลเข้าของช่องทางที่รายงานเป็น `allowlist` เมื่อนโยบาย
  ปฏิเสธการรับข้อมูลเข้าจากกลุ่มแบบเปิด
- ตั้งค่าพาธ `requireMention` สำหรับการรับข้อมูลเข้าของช่องทางที่รายงานเป็น `true` เมื่อนโยบาย
  กำหนดให้ต้องกล่าวถึงในกลุ่ม
- ตั้งค่า `logging.redactSensitive=tools` เมื่อนโยบายกำหนดให้ปกปิดข้อมูลสำคัญ
  ในบันทึก
- ตั้งค่า `diagnostics.otel.captureContent=false` หรือ
  `diagnostics.otel.captureContent.enabled=false` สำหรับการตั้งค่าการเก็บข้อมูลเทเลเมทรี
  ในรูปแบบออบเจ็กต์ เมื่อนโยบายปฏิเสธการเก็บเนื้อหาเทเลเมทรี

การซ่อมแซมเครื่องมือที่มีสิทธิ์ระดับสูงแบบจำกัดขอบเขตเป็นการตรวจหาเท่านั้น นอกจากนี้
ระบบจะข้ามการซ่อมแซมการจัดการข้อมูลแบบจำกัดขอบเขตเมื่อผลการตรวจพบรายงานการกำหนดค่า
บันทึกหรือเทเลเมทรีที่ใช้ร่วมกัน เนื่องจากการเปลี่ยนการตั้งค่าที่ใช้ร่วมกันจะส่งผล
เกินกว่าเป้าหมายนโยบายแบบจำกัดขอบเขต

ระบบจะข้ามการซ่อมแซมข้อกำหนดให้ปฏิเสธแบบจำกัดขอบเขตเมื่อผลการตรวจพบรายงาน
`tools.deny` ระดับรากที่สืบทอดมา เนื่องจากการเพิ่มเครื่องมือที่กำหนดลงในการกำหนดค่า
ระดับรากจะส่งผลเกินกว่าเป้าหมายนโยบายแบบจำกัดขอบเขต การซ่อมแซมข้อกำหนดให้ปฏิเสธ
เฉพาะเอเจนต์สามารถอัปเดตพาธ `agents.list[].tools.deny` ที่รายงานได้

ระบบจะข้ามการซ่อมแซมการรับข้อมูลเข้าของช่องทางแบบจำกัดขอบเขตเมื่อผลการตรวจพบรายงาน
`channels.defaults.*` ที่สืบทอดมา เนื่องจากการเปลี่ยนค่าเริ่มต้นของช่องทางที่ใช้ร่วมกัน
จะส่งผลเกินกว่าเป้าหมายนโยบายแบบจำกัดขอบเขต ผลการตรวจพบรายการอนุญาตสำหรับการดึง URL
ผ่าน HTTP ของ Gateway ยังคงต้องดำเนินการด้วยตนเอง เนื่องจากการซ่อมแซมอัตโนมัติ
ไม่สามารถเลือกค่า URL ของปลายทางที่ถูกต้องสำหรับรายการอนุญาตได้

ผลการตรวจพบการผูก Gateway และคำสั่ง Node ยังคงต้องผ่านการตรวจสอบ เมื่อ
`policy/gateway-non-loopback-bind` หรือ `policy/gateway-node-command-denied`
สามารถจับคู่กับพาธการกำหนดค่าได้ `doctor --fix` จะรายงานการเปลี่ยนแปลง
`gateway.bind` หรือ `gateway.nodes.denyCommands` ที่เสนอเป็นคำแนะนำตัวอย่าง
ที่ข้ามการดำเนินการ ระบบจะไม่ใช้การเปลี่ยนแปลงดังกล่าว และผลการตรวจพบจะยังไม่นับว่า
ได้รับการซ่อมแซมจนกว่าผู้ดูแลระบบจะตรวจสอบและอัปเดตการกำหนดค่าหรือนโยบาย

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "config": {
          "workspaceRepairs": true,
        },
      },
    },
  },
}
```

## รหัสการออก

| คำสั่ง           | `0`                                                    | `1`                                                                 | `2`                                      |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------------------- |
| `policy check`   | ไม่พบผลการตรวจพบที่ถึงเกณฑ์                            | มีผลการตรวจพบอย่างน้อยหนึ่งรายการที่ถึงเกณฑ์                        | อาร์กิวเมนต์หรือการทำงานล้มเหลว          |
| `policy compare` | ไฟล์นโยบายเข้มงวดอย่างน้อยเทียบเท่ากับค่าพื้นฐาน      | ไฟล์นโยบายไม่ถูกต้อง ขาดหาย หรืออ่อนกว่ากฎพื้นฐาน                   | อาร์กิวเมนต์หรือการทำงานล้มเหลว          |
| `policy watch`   | ไม่พบผลการตรวจพบและแฮชที่ยอมรับเป็นข้อมูลปัจจุบัน      | มีผลการตรวจพบหรือการรับรองที่ยอมรับล้าสมัย                          | อาร์กิวเมนต์หรือการทำงานล้มเหลว          |

## เนื้อหาที่เกี่ยวข้อง

- [โหมด lint ของ Doctor](/th/cli/doctor#lint-mode)
- [CLI สำหรับพาธ](/th/cli/path)
