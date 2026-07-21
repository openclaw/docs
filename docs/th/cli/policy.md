---
read_when:
    - คุณต้องการตรวจสอบการตั้งค่า OpenClaw เทียบกับไฟล์ policy.jsonc ที่จัดทำไว้
    - คุณต้องการให้ doctor lint รายงานข้อค้นพบด้านนโยบาย
    - คุณต้องมีแฮชการรับรองนโยบายเพื่อใช้เป็นหลักฐานการตรวจสอบ
summary: ข้อมูลอ้างอิง CLI สำหรับการตรวจสอบความสอดคล้องของ `openclaw policy`
title: นโยบาย
x-i18n:
    generated_at: "2026-07-21T15:31:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: abb9ad87dceaa2004817db6a8c270e66ce1c3848a1680d2119ad95faa5453cc0
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` มาจาก Policy plugin ที่รวมมาให้ โดยเป็นชั้นการตรวจสอบความสอดคล้องระดับองค์กรที่ครอบทับการตั้งค่า OpenClaw ที่มีอยู่ ไม่ใช่ระบบการกำหนดค่าระบบที่สอง คุณเขียนข้อกำหนดไว้ใน `policy.jsonc`; OpenClaw สังเกต workspace ที่ใช้งานอยู่เพื่อใช้เป็นหลักฐาน; Policy รายงานความคลาดเคลื่อนผ่าน `doctor --lint` Policy ไม่ได้บังคับใช้การเรียกใช้เครื่องมือหรือเขียนพฤติกรรมรันไทม์ใหม่ในขณะประมวลผลคำขอ และไม่ได้รับรองที่เก็บข้อมูลประจำตัวของแต่ละ agent เช่น `auth-profiles.json`

Policy ตรวจสอบ channel ที่กำหนดค่าไว้, เซิร์ฟเวอร์ MCP, ผู้ให้บริการโมเดล, สถานะการป้องกัน SSRF ของเครือข่าย, การเข้าถึง ingress/channel, การเปิดเผย Gateway และสถานะคำสั่งของ Node, โพรบการกำหนดเส้นทางข้อความที่ผู้ใช้เขียนขึ้น, การเข้าถึง workspace ของ agent, สถานะ sandbox, สถานะการจัดการข้อมูล, สถานะผู้ให้บริการ secret/โปรไฟล์การยืนยันตัวตน และข้อมูลเมตาของเครื่องมือที่อยู่ภายใต้การกำกับดูแล (`TOOLS.md`) ใช้เมื่อ workspace ต้องการข้อความประกาศที่คงทนและตรวจสอบได้ เช่น "ต้องไม่เปิดใช้งาน Telegram" หรือ "เครื่องมือที่อยู่ภายใต้การกำกับดูแลต้องประกาศข้อมูลเมตาด้านความเสี่ยงและเจ้าของ" หากต้องการเพียงพฤติกรรมภายในเครื่องโดยไม่มีการรับรองหรือการตรวจจับความคลาดเคลื่อน การกำหนดค่าปกติก็เพียงพอ

## เริ่มต้นอย่างรวดเร็ว

```bash
openclaw plugins enable policy
```

Plugin จะยังคงเปิดใช้งานแม้ไม่มี `policy.jsonc` เพื่อให้ doctor รายงานอาร์ติแฟกต์ที่ขาดหายไปแทนที่จะข้ามการตรวจสอบโดยไม่แจ้งให้ทราบ

เขียน `policy.jsonc` ด้วยตนเอง โดยไม่ได้สร้างขึ้นจากการตั้งค่าปัจจุบัน แต่ละส่วนระดับบนสุดคือเนมสเปซของกฎ: การตรวจสอบจะทำงานต่อเมื่อมีกฎที่เป็นรูปธรรมอยู่ภายใต้ส่วนนั้นเท่านั้น (ส่วนหรือคีย์ที่ไม่รองรับจะล้มเหลวเป็น `policy/policy-jsonc-invalid` แทนที่จะถูกละเว้นโดยไม่แจ้งให้ทราบ) ตัวอย่างขั้นต่ำที่ครอบคลุมทุกส่วนที่รองรับ:

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram ไม่ได้รับการอนุมัติสำหรับ workspace นี้",
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
  "routing": {
    "requireBindings": true,
    "requireConfiguredChannels": true,
    "probes": [
      {
        "id": "family-dm",
        "route": {
          "channel": "imessage",
          "peer": { "kind": "direct", "id": "+15555550123" },
        },
        "expect": {
          "agentId": "family",
          "matchedBy": ["binding.peer"],
        },
      },
    ],
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

หมายเหตุที่ครอบคลุมหลายส่วนซึ่งอาจไม่ชัดเจนจากตารางกฎด้านล่าง:

- การละเว้น `gateway.bind` ขณะปฏิเสธการ bind ที่ไม่ใช่ loopback หมายความว่าคุณยอมรับค่าเริ่มต้นของรันไทม์; ตั้งค่า `gateway.bind: "loopback"` เพื่อให้สอดคล้องอย่างเคร่งครัด
- สำหรับ agent แบบอ่านอย่างเดียว ให้ตั้งค่า sandbox `mode` เป็น `all` หรือ `non-main` ในค่าเริ่มต้น/agent ที่เกี่ยวข้อง และตั้งค่า `workspaceAccess` เป็น `none` หรือ `ro` โหมด sandbox ที่ไม่มีค่าหรือเป็น `off` ไม่เป็นไปตามนโยบายแบบอ่านอย่างเดียว
- `agents.workspace.denyTools` ยอมรับ `exec`, `process`, `write`, `edit`, `apply_patch` กลุ่มปฏิเสธเครื่องมือในการกำหนดค่า `group:fs` (การแก้ไขไฟล์) และ `group:runtime` (shell/process) เป็นไปตามสถานะที่เทียบเท่ากัน
- การตรวจสอบการอนุมัติการดำเนินการจะอ่านอาร์ติแฟกต์ `exec-approvals.json` ที่ใช้งานอยู่ต่อเมื่อมีกฎ `execApprovals`; อาร์ติแฟกต์ที่ขาดหายไปหรือไม่ถูกต้องคือหลักฐานที่สังเกตไม่ได้ ไม่ใช่ผลผ่านที่สร้างขึ้น
- หลักฐานของ secret และโปรไฟล์การยืนยันตัวตนจะบันทึกเฉพาะสถานะของผู้ให้บริการ/แหล่งที่มาและข้อมูลเมตา SecretRef เท่านั้น โดยไม่บันทึกค่าดิบ Policy ไม่อ่านหรือรับรองที่เก็บข้อมูลประจำตัวของแต่ละ agent เช่น `auth-profiles.json`
- หลักฐานการจัดการข้อมูลเป็นเพียงสถานะระดับการกำหนดค่าเท่านั้น (โหมดการปกปิดข้อมูล, สวิตช์การบันทึกข้อมูล telemetry, โหมดการบำรุงรักษาเซสชัน, การตั้งค่าการทำดัชนีทรานสคริปต์) โดยไม่ตรวจสอบบันทึก, ข้อมูลส่งออก telemetry, ทรานสคริปต์ หรือไฟล์หน่วยความจำ และผลลัพธ์ที่ไม่มีปัญหาไม่ได้พิสูจน์ว่าไม่มีข้อมูลส่วนบุคคลหรือ secret อยู่ในสิ่งเหล่านั้น
- โพรบการกำหนดเส้นทางใช้ตัวแก้ไข binding ของรันไทม์ OpenClaw ซ้ำ หลักฐานการกำหนดเส้นทางบันทึกเฉพาะรหัสโพรบ, agent ที่แก้ไขได้, ประเภทการจับคู่ และข้อมูลเมตา binding ที่ปกปิดแล้วเท่านั้น โดยจะไม่บันทึกตัวระบุ peer, account, guild, team หรือ role การเพิ่มส่วนการกำหนดเส้นทางจะเปลี่ยนแฮชนโยบายและการรับรองโดยเจตนา; นโยบายที่ไม่มีการกำหนดเส้นทางจะคงรูปแบบหลักฐานเดิมไว้

### ข้อมูลอ้างอิงกฎ Policy

กฎทุกข้อด้านล่างเป็นตัวเลือก; การตรวจสอบจะทำงานต่อเมื่อมีกฎนั้นอยู่ สถานะที่สังเกตได้คือการกำหนดค่า OpenClaw หรือข้อมูลเมตาของ workspace ที่มีอยู่

#### โอเวอร์เลย์แบบกำหนดขอบเขต

ใช้ `scopes.<scopeName>` เมื่อ agent หรือ channel บางรายการต้องการนโยบายที่เข้มงวดกว่าค่าพื้นฐานระดับบนสุด ชื่อขอบเขตเป็นเพียงป้ายกำกับ; การจับคู่ใช้ตัวเลือกภายในขอบเขต โอเวอร์เลย์เป็นแบบเพิ่มเติม: กฎส่วนกลางยังคงทำงาน และกฎที่กำหนดขอบเขตสามารถเพิ่มผลการตรวจพบของตนเองต่อหลักฐานเดียวกันได้

| ตัวเลือก     | ส่วนที่รองรับ                                                             | ใช้เมื่อ                                          |
| ------------ | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | agent รันไทม์อย่างน้อยหนึ่งรายการต้องการกฎที่เข้มงวดยิ่งขึ้น   |
| `channelIds` | `ingress.channels`                                                             | channel อย่างน้อยหนึ่งรายการต้องการกฎ ingress ที่เข้มงวดยิ่งขึ้น |

หากไม่มีรายการ `agentIds` อยู่ใน `agents.list[]` OpenClaw จะประเมินกฎที่กำหนดขอบเขตกับสถานะส่วนกลาง/ค่าเริ่มต้นที่สืบทอดมาสำหรับรหัส agent รันไทม์นั้นแทนที่จะข้ามไป

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

agent เดียวกันสามารถปรากฏในหลายขอบเขตได้ หากแต่ละขอบเขตกำกับดูแลฟิลด์ที่ต่างกันดังตัวอย่างข้างต้น ฟิลด์ที่กำหนดขอบเขตซ้ำสำหรับ agent เดียวกันต้องเข้มงวดเท่ากันหรือมากกว่า; การอ้างสิทธิ์ซ้ำที่อ่อนกว่าจะถูกปฏิเสธ (รายการอนุญาตต้องเป็นเซตย่อย, รายการปฏิเสธต้องเป็นเซตครอบ และค่าบูลีนที่กำหนดเป็นข้อบังคับจะคงที่)

กฎสถานะคอนเทนเนอร์ (`sandbox.containers.*`) จะตรวจสอบเฉพาะกับหลักฐานที่แบ็กเอนด์ sandbox ของ agent ที่ตรงกันสามารถเปิดเผยได้ หากแบ็กเอนด์ไม่สามารถสังเกตกฎที่คุณเปิดใช้งานสำหรับแบ็กเอนด์นั้น Policy จะรายงาน `policy/sandbox-container-posture-unobservable` แทนการให้ผลผ่าน; กำหนดขอบเขตกฎคอนเทนเนอร์ให้กับกลุ่ม agent ที่ใช้แบ็กเอนด์ซึ่งสามารถเปิดเผยหลักฐานดังกล่าวได้

`ingress.session.requireDmScope` ระดับบนสุดยังคงเป็นส่วนกลาง; `session.dmScope` ไม่ใช่หลักฐานที่ระบุแหล่งที่มาเป็น channel ได้ จึงไม่สามารถกำหนดขอบเขตด้วย `channelIds`

ทุกขอบเขตที่มีอยู่ใน `policy.jsonc` ต้องถูกต้องและบังคับใช้ได้

#### Channel

| ฟิลด์นโยบาย                         | สถานะที่สังเกตได้                          | ใช้เมื่อ                                                     |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | ผู้ให้บริการและสถานะการเปิดใช้งานของ `channels.*` | ปฏิเสธ channel ที่กำหนดค่าไว้จากผู้ให้บริการ เช่น `telegram` |
| `channels.denyRules[].reason`        | ข้อความผลการตรวจพบและบริบทคำแนะนำการแก้ไข | อธิบายสาเหตุที่ผู้ให้บริการถูกปฏิเสธ                          |

#### เซิร์ฟเวอร์ MCP

| ฟิลด์นโยบาย        | สถานะที่สังเกตได้      | ใช้เมื่อ                                                   |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | รหัส `mcp.servers.*` | กำหนดให้เซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้ทุกรายการต้องอยู่ในรายการอนุญาต |
| `mcp.servers.deny`  | รหัส `mcp.servers.*` | ปฏิเสธรหัสเซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้โดยเฉพาะ                   |

#### ผู้ให้บริการโมเดล

| ฟิลด์นโยบาย             | สถานะที่สังเกตได้                                   | ใช้เมื่อ                                                                        |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | รหัส `models.providers.*` และการอ้างอิงโมเดลที่เลือก | กำหนดให้ผู้ให้บริการที่กำหนดค่าไว้และการอ้างอิงโมเดลที่เลือกใช้เฉพาะผู้ให้บริการที่ได้รับอนุมัติ |
| `models.providers.deny`  | รหัส `models.providers.*` และการอ้างอิงโมเดลที่เลือก | ปฏิเสธผู้ให้บริการที่กำหนดค่าไว้และการอ้างอิงโมเดลที่เลือกตามรหัสผู้ให้บริการ               |

#### เครือข่าย

| ฟิลด์นโยบาย                   | สถานะที่สังเกตได้                      | ใช้เมื่อ                                                           |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | ช่องทางเลี่ยงการป้องกัน SSRF สำหรับเครือข่ายส่วนตัว | ตั้งเป็น `false` เพื่อกำหนดให้การเข้าถึงเครือข่ายส่วนตัวยังคงปิดใช้งานอยู่ |

#### การกำหนดเส้นทางข้อความ

| ฟิลด์นโยบาย                        | สถานะที่สังเกตได้                                      | ใช้เมื่อ                                                               |
| ----------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| `routing.requireBindings`           | การผูกเส้นทางช่องทาง โดยไม่รวมการผูก ACP      | กำหนดให้มีการผูกสำหรับกำหนดเส้นทางข้อความอย่างน้อยหนึ่งรายการ                          |
| `routing.requireConfiguredChannels` | ID ช่องทางในการผูกและ ID `channels.*` ที่กำหนดค่าไว้ | ตรวจหาค่า ID ช่องทางในการผูกที่ล้าสมัยหรือสะกดผิด                        |
| `routing.probes[].route`            | ตัวแก้ไขเส้นทางสาธารณะของ OpenClaw                  | อธิบายเส้นทางขาเข้าที่เป็นตัวแทนโดยไม่ส่งข้อความ     |
| `routing.probes[].expect.agentId`   | ID เอเจนต์ที่แก้ไขได้                                   | กำหนดให้เส้นทางไปถึงเอเจนต์ที่ผ่านการตรวจสอบ                         |
| `routing.probes[].expect.matchedBy` | ชนิดการจับคู่ของตัวแก้ไขเส้นทาง                                 | กำหนดความเฉพาะเจาะจงของการผูกที่ผ่านการตรวจสอบในระดับเพียร์ บัญชี ช่องทาง หรือชนิดอื่น |

ID โพรบต้องไม่ซ้ำกัน เส้นทางรองรับ `channel`, `accountId` ซึ่งเป็นตัวเลือก,
`peer`, `parentPeer`, `guildId`, `teamId` และ `memberRoleIds` ชนิดเพียร์ได้แก่
`direct`, `group` และ `channel` ส่วน `matchedBy` อาจมีชนิดการจับคู่ขณะรันไทม์
หนึ่งชนิดขึ้นไป รวมถึง `binding.peer`, `binding.account`, `binding.channel`
หรือ `default`

การตรวจสอบการกำหนดเส้นทางเป็นเพียงการตรวจสอบความสอดคล้องเท่านั้น โดยไม่เปลี่ยนแปลงการเริ่มทำงาน
การส่งข้อความ ลำดับความสำคัญของการผูก หรือพฤติกรรมสำรอง ข้อค้นพบต้องได้รับ
การตรวจสอบจากผู้ดำเนินการ เนื่องจากการเปลี่ยนการผูกโดยอัตโนมัติอาจเปลี่ยนเส้นทาง
ของข้อความส่วนตัว

#### การรับข้อมูลขาเข้าและการเข้าถึงช่องทาง

| ฟิลด์นโยบาย                              | สถานะที่สังเกตได้                                                 | ใช้เมื่อ                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | กำหนดขอบเขตการแยกข้อความโดยตรงที่ผ่านการตรวจสอบ                 |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` และฟิลด์นโยบาย DM แบบเดิมของช่องทาง      | อนุญาตเฉพาะนโยบายช่องทางข้อความโดยตรงที่ผ่านการตรวจสอบ               |
| `ingress.channels.denyOpenGroups`         | นโยบายการรับข้อมูลขาเข้าของช่องทาง บัญชี และกลุ่ม                     | ปฏิเสธการรับข้อมูลขาเข้าของกลุ่มแบบเปิดสำหรับช่องทางและบัญชีที่กำหนดค่าไว้      |
| `ingress.channels.requireMentionInGroups` | การกำหนดค่าเกตการกล่าวถึงของช่องทาง บัญชี กลุ่ม กิลด์ และระดับที่ซ้อนกัน | กำหนดให้ใช้เกตการกล่าวถึงเมื่อการรับข้อมูลขาเข้าของกลุ่มเป็นแบบเปิดหรือมีเกตการกล่าวถึง |

#### Gateway

| ฟิลด์นโยบาย                            | สถานะที่สังเกตได้                                 | ใช้เมื่อ                                                                             |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | ตั้งเป็น `false` เพื่อกำหนดให้ Gateway ผูกกับลูปแบ็ก                                  |
| `gateway.exposure.allowTailscaleFunnel` | สถานะการให้บริการ/ฟันเนลของ Gateway ผ่าน Tailscale         | ตั้งเป็น `false` เพื่อปฏิเสธการเปิดเผยผ่าน Tailscale Funnel                                    |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | ตั้งเป็น `true` เพื่อปฏิเสธการปิดใช้งานการยืนยันตัวตนของ Gateway                                       |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | ตั้งเป็น `true` เพื่อกำหนดให้ระบุการกำหนดค่าขีดจำกัดอัตราสำหรับการยืนยันตัวตนอย่างชัดเจน                            |
| `gateway.controlUi.allowInsecure`       | ตัวเลือกเปิด/ปิดการยืนยันตัวตน อุปกรณ์ หรือต้นทางที่ไม่ปลอดภัยของ Control UI | ตั้งเป็น `false` เพื่อปฏิเสธตัวเลือกเปิด/ปิดที่ทำให้ Control UI เปิดเผยอย่างไม่ปลอดภัย                         |
| `gateway.remote.allow`                  | โหมด/การกำหนดค่า Gateway ระยะไกล                     | ตั้งเป็น `false` เพื่อปฏิเสธโหมด Gateway ระยะไกล                                          |
| `gateway.http.denyEndpoints`            | เอนด์พอยต์ HTTP API ของ Gateway                     | ปฏิเสธ ID เอนด์พอยต์ เช่น `chatCompletions` หรือ `responses`                          |
| `gateway.http.requireUrlAllowlists`     | อินพุตการดึงข้อมูลจาก URL ผ่าน HTTP ของ Gateway                  | ตั้งเป็น `true` เพื่อกำหนดให้มีรายการอนุญาต URL สำหรับอินพุตการดึงข้อมูลจาก URL                         |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                   | กำหนดให้ ID คำสั่ง Node แบบตรงกันทุกตัวอักษร เช่น `system.run` ถูกปฏิเสธในการกำหนดค่า OpenClaw |

`gateway.nodes.denyCommands` เป็นกฎเซตครอบคลุมของรายการปฏิเสธที่ต้องตรงกันทุกตัวอักษรและคำนึงถึงตัวพิมพ์เล็กใหญ่
ใช้เมื่อจำเป็นต้องใช้นโยบายพิสูจน์ว่าคำสั่ง Node ที่มีสิทธิ์พิเศษถูกปฏิเสธอย่างชัดเจน
โดยการกำหนดค่า OpenClaw การติดตั้งใช้งานที่ตั้งใจอนุญาตคำสั่ง Node ที่มีสิทธิ์พิเศษ
ควรอัปเดต `policy.jsonc` หลังการตรวจสอบ แทนการพึ่งพาเพียง
`gateway.nodes.allowCommands`

#### พื้นที่ทำงานของเอเจนต์

| ฟิลด์นโยบาย                     | สถานะที่สังเกตได้                                                                        | ใช้เมื่อ                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` และ `agents.list[].sandbox.workspaceAccess` | อนุญาตเฉพาะค่าการเข้าถึงพื้นที่ทำงานของแซนด์บ็อกซ์ เช่น `none` หรือ `ro`                       |
| `agents.workspace.denyTools`     | การกำหนดค่าปฏิเสธเครื่องมือส่วนกลางและรายเอเจนต์                                                 | กำหนดให้ปฏิเสธเครื่องมือที่แก้ไขข้อมูล (`exec`, `process`, `write`, `edit`, `apply_patch`) |

#### สถานะของแซนด์บ็อกซ์

| ฟิลด์นโยบาย                                          | สถานะที่สังเกตได้                                          | ใช้เมื่อ                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` และโหมดรายเอเจนต์       | อนุญาตเฉพาะโหมดแซนด์บ็อกซ์ที่ผ่านการตรวจสอบ เช่น `all` หรือ `non-main` |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` และแบ็กเอนด์รายเอเจนต์ | อนุญาตเฉพาะแบ็กเอนด์แซนด์บ็อกซ์ที่ผ่านการตรวจสอบ เช่น `docker`         |
| `sandbox.containers.denyHostNetwork`                  | โหมดเครือข่ายของแซนด์บ็อกซ์/เบราว์เซอร์ที่ใช้คอนเทนเนอร์           | ปฏิเสธโหมดเครือข่ายโฮสต์                                        |
| `sandbox.containers.denyContainerNamespaceJoin`       | โหมดเครือข่ายของแซนด์บ็อกซ์/เบราว์เซอร์ที่ใช้คอนเทนเนอร์           | ปฏิเสธการเข้าร่วมเนมสเปซเครือข่ายของคอนเทนเนอร์อื่น              |
| `sandbox.containers.requireReadOnlyMounts`            | โหมดการเมานต์ของแซนด์บ็อกซ์/เบราว์เซอร์ที่ใช้คอนเทนเนอร์             | กำหนดให้การเมานต์เป็นแบบอ่านอย่างเดียว                                |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | เป้าหมายการเมานต์ของแซนด์บ็อกซ์/เบราว์เซอร์ที่ใช้คอนเทนเนอร์          | ปฏิเสธการเมานต์ซ็อกเก็ตรันไทม์ของคอนเทนเนอร์                          |
| `sandbox.containers.denyUnconfinedProfiles`           | สถานะโปรไฟล์ความปลอดภัยของคอนเทนเนอร์                      | ปฏิเสธโปรไฟล์ความปลอดภัยของคอนเทนเนอร์ที่ไม่มีข้อจำกัด                   |
| `sandbox.browser.requireCdpSourceRange`               | ช่วงต้นทาง CDP ของเบราว์เซอร์ในแซนด์บ็อกซ์                        | กำหนดให้การเปิดเผย CDP ของเบราว์เซอร์ประกาศช่วงต้นทาง        |

นโยบายถือว่า `sandbox.mode` ที่ไม่มีการระบุค่าใช้ค่าเริ่มต้นโดยนัยคือ `off` ดังนั้น
`sandbox.requireMode` จึงรายงานว่าแซนด์บ็อกซ์ใหม่หรือยังไม่ได้กำหนดค่าอยู่นอก
รายการอนุญาต เช่น `["all"]`

#### การจัดการข้อมูล

| ฟิลด์นโยบาย                                        | สถานะที่สังเกตได้                                                                       | ใช้เมื่อ                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | ตั้งเป็น `true` เพื่อปฏิเสธ `logging.redactSensitive: "off"`              |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | ตั้งเป็น `true` เพื่อปฏิเสธการบันทึกเนื้อหาเทเลเมทรี                     |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | ตั้งเป็น `true` เพื่อกำหนดให้โหมดบำรุงรักษาเซสชันที่มีผลเป็น `enforce` |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` และ `agents.*.memorySearch.experimental.sessionMemory` | ตั้งเป็น `true` เพื่อปฏิเสธการทำดัชนีบันทึกถอดความเซสชันลงในหน่วยความจำ       |

#### ข้อมูลลับ

| ฟิลด์นโยบาย                      | สถานะที่สังเกตได้                                           | ใช้เมื่อ                                                                |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | SecretRef ในการกำหนดค่าและการประกาศ `secrets.providers.*` | ตั้งเป็น `true` เพื่อกำหนดให้ SecretRef ชี้ไปยังผู้ให้บริการที่ประกาศไว้     |
| `secrets.denySources`             | แหล่งที่มาของผู้ให้บริการข้อมูลลับและแหล่งที่มาของ SecretRef            | ปฏิเสธแหล่งที่มา เช่น `exec`, `file` หรือชื่อแหล่งที่มาอื่นที่กำหนดค่าไว้ |
| `secrets.allowInsecureProviders`  | แฟล็กสถานะผู้ให้บริการข้อมูลลับที่ไม่ปลอดภัย                   | ตั้งเป็น `false` เพื่อปฏิเสธผู้ให้บริการที่เลือกใช้สถานะไม่ปลอดภัย      |

#### การอนุมัติ Exec

การตรวจสอบการอนุมัติ Exec อ่านอาร์ติแฟกต์ `exec-approvals.json` ขณะรันไทม์:
ค่าเริ่มต้นคือ `~/.openclaw/exec-approvals.json` หรือ
`$OPENCLAW_STATE_DIR/exec-approvals.json` เมื่อตั้งค่า `OPENCLAW_STATE_DIR`
กฎสถานะภายใต้ `execApprovals.defaults.*` หรือ `execApprovals.agents.*`
กำหนดให้มีหลักฐานอาร์ติแฟกต์ที่อ่านได้ อาร์ติแฟกต์ที่ไม่มีหรือไม่ถูกต้องจะถูกรายงานเป็น
หลักฐานที่สังเกตไม่ได้ แทนที่จะถือว่าผ่านตามความพยายามสูงสุด เมื่ออ่านได้แล้ว ฟิลด์ที่ละไว้
จะสืบทอดค่าเริ่มต้นขณะรันไทม์: `defaults.security` ที่ไม่มีการระบุค่าคือ `full` และ
การรักษาความปลอดภัยของเอเจนต์ที่ไม่มีการระบุค่าจะสืบทอดค่าเริ่มต้นนั้น หลักฐานประกอบด้วย `defaults`,
`agents.*`, `agents.*.allowlist[].pattern`, `argPattern` ซึ่งเป็นตัวเลือก, สถานะ
`autoAllowSkills` ที่มีผล และแหล่งที่มาของรายการ โดยจะไม่รวมพาธซ็อกเก็ต/โทเค็น,
`commandText`, `lastUsedCommand`, พาธที่แก้ไขแล้ว หรือการประทับเวลา

| ฟิลด์นโยบาย                                | สถานะที่สังเกตได้                                                                         | ใช้เมื่อ                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | พาธ `exec-approvals.json` ของรันไทม์ที่ใช้งานอยู่                                              | ตั้งเป็น `true` เพื่อกำหนดให้อาร์ติแฟกต์การอนุมัติต้องมีอยู่และแยกวิเคราะห์ได้                     |
| `execApprovals.defaults.allowSecurity`      | `defaults.security` โดยมีค่าเริ่มต้นเป็น `full`                                              | อนุญาตเฉพาะโหมดความปลอดภัยเริ่มต้นสำหรับการอนุมัติที่ได้รับอนุมัติแล้ว                                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security` โดยสืบทอดค่าเริ่มต้น                                               | อนุญาตเฉพาะโหมดความปลอดภัยที่มีผลสำหรับการอนุมัติรายเอเจนต์ซึ่งได้รับอนุมัติแล้ว                        |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` และ `agents.*.autoAllowSkills` โดยสืบทอดค่าเริ่มต้นของรันไทม์ | ตั้งเป็น `false` เพื่อกำหนดให้ใช้รายการอนุญาตแบบกำหนดเองที่เข้มงวด โดยไม่มีการอนุมัติ CLI ของ Skills โดยปริยาย |
| `execApprovals.agents.allowlist.expected`   | รูปแบบ `agents.*.allowlist[]` แบบรวมและรายการ argPattern ที่ไม่บังคับ               | กำหนดให้รายการอนุญาตสำหรับการอนุมัติตรงกับชุดรูปแบบที่ผ่านการรีวิว                      |

ตัวอย่าง: กำหนดให้มีอาร์ติแฟกต์การอนุมัติ ปฏิเสธค่าเริ่มต้นที่ผ่อนปรน และอนุญาต
เฉพาะสถานะการอนุมัติ exec ที่ผ่านการรีวิวสำหรับเอเจนต์ที่เลือก

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // โหมดความปลอดภัย: "deny", "allowlist" หรือ "full"
      // ค่าเริ่มต้นนี้อนุญาตเฉพาะสถานะ deny ที่จำกัดอย่างเข้มงวด
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // เอเจนต์ที่เลือกอาจใช้สถานะ allowlist ที่ผ่านการรีวิว แต่ใช้ "full" ไม่ได้
          "allowSecurity": ["allowlist"],
          // false หมายความว่า CLI ของ Skills ต้องปรากฏในรายการอนุญาตที่ผ่านการรีวิว แทนที่จะ
          // ได้รับการอนุมัติโดยปริยายจาก autoAllowSkills
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // รายการแบบง่าย: รูปแบบไฟล์ปฏิบัติการที่ผ่านการรีวิวและตรงกันทุกประการ โดยไม่มี argPattern
              "travel-hub",
              // รายการที่มีข้อจำกัด: รูปแบบพร้อมนิพจน์ทั่วไปของอาร์กิวเมนต์ที่ผ่านการรีวิว
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

#### โปรไฟล์การรับรองความถูกต้อง

| ฟิลด์นโยบาย                    | สถานะที่สังเกตได้                               | ใช้เมื่อ                                                                                   |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | ข้อมูลเมตาผู้ให้บริการและโหมดของ `auth.profiles.*` | กำหนดให้โปรไฟล์การรับรองความถูกต้องในการกำหนดค่ามีคีย์ข้อมูลเมตา เช่น `provider` และ `mode`               |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | อนุญาตเฉพาะโหมดโปรไฟล์การรับรองความถูกต้องที่รองรับ เช่น `api_key`, `aws-sdk`, `oauth` หรือ `token` |

#### ข้อมูลเมตาของเครื่องมือ

| ฟิลด์นโยบาย            | สถานะที่สังเกตได้                   | ใช้เมื่อ                                                                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | การประกาศ `TOOLS.md` ที่อยู่ภายใต้การกำกับดูแล | กำหนดให้เครื่องมือที่อยู่ภายใต้การกำกับดูแลประกาศคีย์ข้อมูลเมตา เช่น `risk`, `sensitivity` หรือ `owner` |

#### สถานะของเครื่องมือ

| ฟิลด์นโยบาย                    | สถานะที่สังเกตได้                                              | ใช้เมื่อ                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` และ `agents.list[].tools.profile`           | อนุญาตเฉพาะรหัสโปรไฟล์เครื่องมือ เช่น `minimal`, `messaging` หรือ `coding`                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` และการแทนที่ `tools.fs` รายเอเจนต์ | ตั้งเป็น `true` เพื่อกำหนดให้สถานะเครื่องมือระบบไฟล์จำกัดเฉพาะเวิร์กสเปซ                                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` และความปลอดภัย exec รายเอเจนต์           | อนุญาตเฉพาะโหมดความปลอดภัย exec เช่น `deny` หรือ `allowlist`                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` และโหมดถามสำหรับ exec รายเอเจนต์                | กำหนดให้ใช้สถานะการอนุมัติ เช่น `always`                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` และการกำหนดเส้นทางโฮสต์ exec รายเอเจนต์           | อนุญาตเฉพาะโหมดการกำหนดเส้นทางโฮสต์ exec เช่น `sandbox`                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` และสถานะยกระดับรายเอเจนต์     | ตั้งเป็น `false` เพื่อกำหนดให้โหมดเครื่องมือยกระดับยังคงปิดใช้งาน                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` และ `tools.alsoAllow` รายเอเจนต์           | กำหนดให้มีรายการ `alsoAllow` ที่ตรงกันทุกประการ และรายงานสิทธิ์เครื่องมือเพิ่มเติมที่ขาดหายหรือไม่คาดคิด                 |
| `tools.denyTools`               | `tools.deny` และ `agents.list[].tools.deny`                 | กำหนดให้รายการปฏิเสธเครื่องมือที่กำหนดค่าไว้มีรหัสหรือกลุ่มเครื่องมือ เช่น `group:runtime` และ `group:fs` |

## เรียกใช้การตรวจสอบ

เรียกใช้เฉพาะการตรวจสอบนโยบายระหว่างการเขียน:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` เรียกใช้เฉพาะชุดการตรวจสอบนโยบาย และส่งออกหลักฐาน ข้อค้นพบ
และแฮชการรับรอง ข้อค้นพบเดียวกันยังปรากฏใน
`openclaw doctor --lint` เมื่อเปิดใช้งาน Plugin นโยบาย

เปรียบเทียบไฟล์นโยบายของผู้ดำเนินการกับค่าฐานที่เขียนไว้:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` ตรวจสอบไวยากรณ์ของไฟล์นโยบายเทียบกับไวยากรณ์ของไฟล์นโยบาย โดย
ไม่ตรวจสอบสถานะรันไทม์ หลักฐาน ข้อมูลประจำตัว หรือข้อมูลลับ คำสั่งนี้ใช้
ข้อมูลเมตาของกฎชุดเดียวกับที่กำกับดูแลโอเวอร์เลย์ตามขอบเขต: รายการอนุญาตต้องเท่าเดิมหรือ
แคบลง รายการปฏิเสธต้องเท่าเดิมหรือกว้างขึ้น ค่าบูลีนที่จำเป็นต้องคง
ค่าเดิม สตริงที่มีลำดับสามารถเปลี่ยนไปยังด้านที่เข้มงวดกว่าของ
ลำดับที่กำหนดค่าไว้เท่านั้น และรายการแบบตรงกันทุกประการต้องตรงกัน ค่าฐานอาจเป็น
นโยบายที่องค์กรเขียนขึ้น ส่วนนโยบายที่ตรวจสอบอาจเพิ่มค่าที่เข้มงวดขึ้นหรือ
กฎเพิ่มเติมได้ กฎระดับบนสุดที่ตรวจสอบสามารถทำให้กฎค่าฐานตามขอบเขตเป็นไปตามข้อกำหนดได้ เมื่อ
มีข้อจำกัดเท่ากันหรือมากกว่า ชื่อขอบเขตระหว่างไฟล์ไม่จำเป็นต้องตรงกัน
การเปรียบเทียบใช้ตัวเลือก (`agentIds`/`channelIds`) และฟิลด์เป็นคีย์
สำหรับโพรบการกำหนดเส้นทาง รหัสโพรบทุกตัวในค่าฐานต้องคงอยู่พร้อมเส้นทาง
และเอเจนต์ที่คาดไว้เดิม นโยบายที่ตรวจสอบอาจเพิ่มโพรบหรือทำให้ `matchedBy` แคบลง แต่
การนำโพรบออก การเปลี่ยนเส้นทางหรือเอเจนต์ของโพรบ หรือการขยายชนิดการจับคู่ที่ยอมรับ
ถือว่าอ่อนแอกว่า

ผลการเปรียบเทียบที่ผ่าน (`--json`):

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

เอาต์พุต `policy check --json` ที่ผ่านจะมีแฮชที่คงที่ซึ่งผู้ดำเนินการหรือ
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
| `enabled`                 | เปิดใช้การตรวจสอบนโยบายแม้ก่อนที่ `policy.jsonc` จะมีอยู่         |
| `workspaceRepairs`        | อนุญาตให้ `doctor --fix` แก้ไขการตั้งค่าเวิร์กสเปซที่นโยบายจัดการ |
| `expectedHash`            | การล็อกด้วยแฮชแบบไม่บังคับสำหรับอาร์ติแฟกต์นโยบายที่ได้รับอนุมัติ            |
| `expectedAttestationHash` | การล็อกด้วยแฮชแบบไม่บังคับสำหรับการตรวจสอบนโยบายที่ผ่านและยอมรับล่าสุด    |
| `path`                    | ตำแหน่งของอาร์ติแฟกต์นโยบายแบบสัมพัทธ์กับเวิร์กสเปซ             |

ตั้ง `plugins.entries.policy.config.enabled` เป็น `false` เพื่อปิดใช้งานการตรวจสอบ
นโยบายสำหรับเวิร์กสเปซ โดยยังคงติดตั้ง Plugin ไว้

## ยอมรับสถานะนโยบาย

ตัวอย่างเอาต์พุต JSON:

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

`attestation.policy.hash` ระบุอาร์ติแฟกต์กฎที่เขียนขึ้น `evidence`
บันทึกสถานะ OpenClaw ที่ตรวจพบซึ่งการตรวจสอบใช้ และ
`workspace.hash` ระบุเพย์โหลดหลักฐานนั้น `findingsHash` ระบุ
ชุดผลการตรวจสอบที่แน่นอน `checkedAt` บันทึกเวลาที่ดำเนินการตรวจสอบ
`attestationHash` ระบุข้ออ้างที่คงที่ (แฮชนโยบาย แฮชหลักฐาน
แฮชผลการตรวจสอบ และสถานะสะอาด/ไม่สะอาด) และจงใจไม่รวม `checkedAt`
เพื่อให้สถานะนโยบายเดียวกันสร้างแฮชการรับรองเดียวกันเสมอ เมื่อรวมกัน
ค่าทั้งสี่นี้จะเป็นทูเพิลการตรวจสอบสำหรับการตรวจสอบนโยบายหนึ่งครั้ง

หาก Gateway หรือซูเปอร์ไวเซอร์ใช้นโยบายเพื่อบล็อก อนุมัติ หรือใส่หมายเหตุให้
การดำเนินการขณะรัน ควรบันทึกแฮชการรับรองจากการตรวจสอบที่สะอาดครั้งล่าสุด
`checkedAt` ยังคงอยู่ในเอาต์พุต JSON สำหรับบันทึกการตรวจสอบ แต่ไม่ได้เป็นส่วนหนึ่งของ
แฮชที่คงที่

วงจรชีวิตสำหรับการยอมรับสถานะนโยบาย:

1. เขียนหรือรีวิว `policy.jsonc`
2. เรียกใช้ `openclaw policy check --json`
3. หากสะอาด ให้บันทึก `attestation.policy.hash` เป็น `expectedHash`
4. บันทึก `attestation.attestationHash` เป็น `expectedAttestationHash`
5. เรียกใช้ `openclaw doctor --lint` ซ้ำใน CI หรือเกตการเผยแพร่

หากกฎนโยบายเปลี่ยนโดยตั้งใจ ให้อัปเดตแฮชที่ยอมรับทั้งสองค่าจาก
การตรวจสอบที่สะอาด หากเปลี่ยนเฉพาะการตั้งค่าเวิร์กสเปซ (นโยบายยังคงเดิม)
โดยทั่วไปจะเปลี่ยนเฉพาะ `expectedAttestationHash`

การเปิดใช้หรืออัปเกรดกฎ `agents.workspace` จะเพิ่มหลักฐาน `agentWorkspace`
ลงในแฮชเวิร์กสเปซและแฮชการรับรอง ให้รีวิวหลักฐานใหม่และ
รีเฟรชแฮชการรับรองที่ยอมรับหลังจากเปิดใช้ การเปิดใช้หรืออัปเกรด
กฎสถานะความปลอดภัยของเครื่องมือจะเพิ่มหลักฐาน `toolPosture` ในลักษณะเดียวกัน

`openclaw policy watch` เรียกใช้การตรวจสอบซ้ำและรายงานเมื่อหลักฐานปัจจุบัน
ไม่ตรงกับ `expectedAttestationHash` อีกต่อไป:

```bash
openclaw policy watch --json
```

ใช้ `--once` ใน CI หรือสคริปต์ที่ต้องการประเมินการเบี่ยงเบนเพียงครั้งเดียว หากไม่มี
`--once` ระบบจะสำรวจทุกสองวินาทีโดยค่าเริ่มต้น ใช้ `--interval-ms` เพื่อเปลี่ยน
ช่วงเวลา

## ผลการตรวจสอบ

| รหัสการตรวจสอบ                                                 | ข้อค้นพบ                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | เปิดใช้นโยบายแล้ว แต่ไม่มี `policy.jsonc`                                  |
| `policy/policy-jsonc-invalid`                            | ไม่สามารถแยกวิเคราะห์นโยบายได้ หรือมีรายการกฎที่มีรูปแบบไม่ถูกต้อง                       |
| `policy/policy-hash-mismatch`                            | นโยบายไม่ตรงกับ `expectedHash` ที่กำหนดค่าไว้                                  |
| `policy/attestation-hash-mismatch`                       | หลักฐานนโยบายปัจจุบันไม่ตรงกับการรับรองที่ยอมรับอีกต่อไป               |
| `policy/policy-conformance-invalid`                      | ไฟล์นโยบายพื้นฐานหรือไฟล์นโยบายที่ตรวจสอบมีไวยากรณ์การเปรียบเทียบที่ไม่ถูกต้อง                  |
| `policy/policy-conformance-missing`                      | ไฟล์นโยบายที่ตรวจสอบไม่มีกฎที่ไฟล์นโยบายพื้นฐานกำหนดให้ต้องมี     |
| `policy/policy-conformance-weaker`                       | ไฟล์นโยบายที่ตรวจสอบมีค่าที่อ่อนกว่าค่าในไฟล์นโยบายพื้นฐาน           |
| `policy/channels-denied-provider`                        | ช่องทางที่เปิดใช้งานตรงกับกฎปฏิเสธช่องทาง                                   |
| `policy/mcp-denied-server`                               | เซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้ถูกนโยบายปฏิเสธ                                      |
| `policy/mcp-unapproved-server`                           | เซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้อยู่นอกรายการอนุญาต                                 |
| `policy/models-denied-provider`                          | ผู้ให้บริการโมเดลหรือการอ้างอิงโมเดลที่กำหนดค่าไว้ใช้ผู้ให้บริการที่ถูกปฏิเสธ                  |
| `policy/models-unapproved-provider`                      | ผู้ให้บริการโมเดลหรือการอ้างอิงโมเดลที่กำหนดค่าไว้อยู่นอกรายการอนุญาต                |
| `policy/network-private-access-enabled`                  | เปิดใช้งานช่องทางหลีกเลี่ยง SSRF สำหรับเครือข่ายส่วนตัว ทั้งที่นโยบายปฏิเสธ             |
| `policy/routing-bindings-required`                       | นโยบายกำหนดให้ต้องมีการผูกเส้นทางช่องทาง แต่ยังไม่ได้กำหนดค่าไว้                  |
| `policy/routing-binding-channel-unconfigured`            | การผูกเส้นทางระบุชื่อช่องทางที่ไม่มีอยู่ใน `channels.*`                         |
| `policy/routing-agent-mismatch`                          | เส้นทางที่เขียนไว้ได้รับการแก้ไขไปยังเอเจนต์อื่น                                  |
| `policy/routing-match-kind-mismatch`                     | เส้นทางที่เขียนไว้ตรงกันด้วยระดับความจำเพาะของการผูกที่ไม่คาดคิด                   |
| `policy/ingress-dm-policy-unapproved`                    | นโยบาย DM ของช่องทางอยู่นอกรายการอนุญาตของนโยบาย                              |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` ไม่ตรงกับขอบเขตการแยก DM ที่นโยบายกำหนด          |
| `policy/ingress-open-groups-denied`                      | นโยบายกลุ่มของช่องทางเป็น `open` ทั้งที่นโยบายปฏิเสธการรับข้อมูลเข้าจากกลุ่มแบบเปิด          |
| `policy/ingress-group-mention-required`                  | รายการช่องทางหรือกลุ่มปิดใช้งานเกตการกล่าวถึง ทั้งที่นโยบายกำหนดให้ต้องใช้       |
| `policy/gateway-non-loopback-bind`                       | รูปแบบการผูกของ Gateway อนุญาตให้เปิดเผยนอก loopback ทั้งที่นโยบายปฏิเสธ         |
| `policy/gateway-auth-disabled`                           | ปิดใช้งานการยืนยันตัวตนของ Gateway ทั้งที่นโยบายกำหนดให้ต้องใช้การยืนยันตัวตน                     |
| `policy/gateway-rate-limit-missing`                      | ไม่ได้ระบุรูปแบบการจำกัดอัตราการยืนยันตัวตนของ Gateway อย่างชัดเจน ทั้งที่นโยบายกำหนดให้ต้องระบุ          |
| `policy/gateway-control-ui-insecure`                     | เปิดใช้งานตัวเลือกการเปิดเผย Gateway Control UI ที่ไม่ปลอดภัย                         |
| `policy/gateway-tailscale-funnel`                        | เปิดใช้งานการเปิดเผย Gateway ผ่าน Tailscale Funnel ทั้งที่นโยบายปฏิเสธ               |
| `policy/gateway-remote-enabled`                          | โหมดระยะไกลของ Gateway ทำงานอยู่ ทั้งที่นโยบายปฏิเสธ                              |
| `policy/gateway-http-endpoint-enabled`                   | เปิดใช้งานปลายทาง HTTP API ของ Gateway ทั้งที่นโยบายปฏิเสธ                    |
| `policy/gateway-http-url-fetch-unrestricted`             | อินพุตดึงข้อมูล URL ผ่าน HTTP ของ Gateway ไม่มีรายการอนุญาต URL ที่จำเป็น                      |
| `policy/gateway-node-command-denied`                     | คำสั่ง Node ที่นโยบายปฏิเสธไม่ได้ถูกปฏิเสธโดยการกำหนดค่า OpenClaw                 |
| `policy/agents-workspace-access-denied`                  | โหมดแซนด์บ็อกซ์ของเอเจนต์หรือการเข้าถึงพื้นที่ทำงานอยู่นอกรายการอนุญาตของนโยบาย           |
| `policy/agents-tool-not-denied`                          | การกำหนดค่าเอเจนต์หรือค่าเริ่มต้นไม่ได้ปฏิเสธเครื่องมือที่นโยบายกำหนดให้ต้องปฏิเสธ               |
| `policy/tools-profile-unapproved`                        | โปรไฟล์เครื่องมือแบบส่วนกลางหรือรายเอเจนต์ที่กำหนดค่าไว้อยู่นอกรายการอนุญาต           |
| `policy/tools-fs-workspace-only-required`                | เครื่องมือระบบไฟล์ไม่ได้กำหนดค่ารูปแบบพาธให้จำกัดเฉพาะพื้นที่ทำงาน             |
| `policy/tools-exec-security-unapproved`                  | โหมดความปลอดภัยของการดำเนินการอยู่นอกรายการอนุญาตของนโยบาย                               |
| `policy/tools-exec-ask-unapproved`                       | โหมดการถามก่อนดำเนินการอยู่นอกรายการอนุญาตของนโยบาย                                    |
| `policy/tools-exec-host-unapproved`                      | การกำหนดเส้นทางโฮสต์สำหรับการดำเนินการอยู่นอกรายการอนุญาตของนโยบาย                                |
| `policy/tools-elevated-enabled`                          | เปิดใช้งานโหมดเครื่องมือแบบยกระดับ ทั้งที่นโยบายปฏิเสธ                              |
| `policy/tools-also-allow-missing`                        | รายการ `alsoAllow` ที่กำหนดค่าไว้ไม่มีรายการที่นโยบายกำหนดให้ต้องมี             |
| `policy/tools-also-allow-unexpected`                     | รายการ `alsoAllow` ที่กำหนดค่าไว้มีรายการที่นโยบายไม่ได้คาดหมาย           |
| `policy/tools-required-deny-missing`                     | รายการปฏิเสธเครื่องมือแบบส่วนกลางหรือรายเอเจนต์ไม่มีเครื่องมือที่กำหนดให้ต้องปฏิเสธ     |
| `policy/sandbox-mode-unapproved`                         | โหมดแซนด์บ็อกซ์อยู่นอกรายการอนุญาตของนโยบาย                                     |
| `policy/sandbox-backend-unapproved`                      | แบ็กเอนด์แซนด์บ็อกซ์อยู่นอกรายการอนุญาตของนโยบาย                                  |
| `policy/sandbox-container-posture-unobservable`          | เปิดใช้งานกฎรูปแบบคอนเทนเนอร์กับแบ็กเอนด์ที่ไม่สามารถตรวจสังเกตกฎนั้นได้         |
| `policy/sandbox-container-host-network-denied`           | แซนด์บ็อกซ์หรือเบราว์เซอร์ที่ใช้คอนเทนเนอร์ใช้โหมดเครือข่ายของโฮสต์                     |
| `policy/sandbox-container-namespace-join-denied`         | แซนด์บ็อกซ์หรือเบราว์เซอร์ที่ใช้คอนเทนเนอร์เข้าร่วมเนมสเปซของคอนเทนเนอร์อื่น          |
| `policy/sandbox-container-mount-mode-required`           | เมานต์ของแซนด์บ็อกซ์หรือเบราว์เซอร์ที่ใช้คอนเทนเนอร์ไม่ได้เป็นแบบอ่านอย่างเดียว                     |
| `policy/sandbox-container-runtime-socket-mount`          | เมานต์ของแซนด์บ็อกซ์หรือเบราว์เซอร์ที่ใช้คอนเทนเนอร์เปิดเผยซ็อกเก็ตรันไทม์ของคอนเทนเนอร์ |
| `policy/sandbox-container-unconfined-profile`            | โปรไฟล์แซนด์บ็อกซ์คอนเทนเนอร์ไม่มีข้อจำกัด ทั้งที่นโยบายปฏิเสธ                    |
| `policy/sandbox-browser-cdp-source-range-missing`        | ไม่มีช่วงแหล่งที่มา CDP ของเบราว์เซอร์แซนด์บ็อกซ์ ทั้งที่นโยบายกำหนดให้ต้องมี             |
| `policy/data-handling-redaction-disabled`                | ปิดใช้งานการปกปิดข้อมูลสำคัญในบันทึก ทั้งที่นโยบายกำหนดให้ต้องใช้                  |
| `policy/data-handling-telemetry-content-capture`         | เปิดใช้งานการเก็บเนื้อหาเทเลเมทรี ทั้งที่นโยบายปฏิเสธ                       |
| `policy/data-handling-session-retention-not-enforced`    | ไม่มีการบังคับใช้การบำรุงรักษาระยะเวลาเก็บเซสชัน ทั้งที่นโยบายกำหนดให้ต้องใช้            |
| `policy/data-handling-session-transcript-memory-enabled` | เปิดใช้งานการจัดทำดัชนีหน่วยความจำจากทรานสคริปต์เซสชัน ทั้งที่นโยบายปฏิเสธ              |
| `policy/secrets-unmanaged-provider`                      | SecretRef ในการกำหนดค่าอ้างอิงผู้ให้บริการที่ไม่ได้ประกาศไว้ภายใต้ `secrets.providers`  |
| `policy/secrets-denied-provider-source`                  | ผู้ให้บริการข้อมูลลับหรือ SecretRef ในการกำหนดค่าใช้แหล่งที่มาที่นโยบายปฏิเสธ             |
| `policy/secrets-insecure-provider`                       | ผู้ให้บริการข้อมูลลับเลือกใช้รูปแบบที่ไม่ปลอดภัย ทั้งที่นโยบายปฏิเสธ               |
| `policy/auth-profile-invalid-metadata`                   | โปรไฟล์การยืนยันตัวตนในการกำหนดค่าไม่มีข้อมูลเมตาของผู้ให้บริการหรือโหมดที่ถูกต้อง                 |
| `policy/auth-profile-unapproved-mode`                    | โหมดโปรไฟล์การยืนยันตัวตนในการกำหนดค่าอยู่นอกรายการอนุญาตของนโยบาย                       |
| `policy/exec-approvals-missing`                          | นโยบายกำหนดให้ต้องมี `exec-approvals.json` แต่ไม่มีอาร์ติแฟกต์               |
| `policy/exec-approvals-invalid`                          | ไม่สามารถแยกวิเคราะห์อาร์ติแฟกต์การอนุมัติการดำเนินการที่กำหนดค่าไว้ได้                          |
| `policy/exec-approvals-default-security-unapproved`      | ค่าเริ่มต้นของการอนุมัติการดำเนินการใช้โหมดความปลอดภัยที่อยู่นอกรายการอนุญาตของนโยบาย          |
| `policy/exec-approvals-agent-security-unapproved`        | โหมดความปลอดภัยที่มีผลของการอนุมัติการดำเนินการรายเอเจนต์อยู่นอกรายการอนุญาต       |
| `policy/exec-approvals-auto-allow-skills-enabled`        | เอเจนต์การอนุมัติการดำเนินการอนุญาต CLI ของ Skills โดยอัตโนมัติโดยปริยาย ทั้งที่นโยบายปฏิเสธ   |
| `policy/exec-approvals-allowlist-missing`                | รายการอนุญาตของการอนุมัติไม่มีรูปแบบที่นโยบายกำหนดให้ต้องมี                  |
| `policy/exec-approvals-allowlist-unexpected`             | รายการอนุญาตของการอนุมัติมีรูปแบบที่นโยบายไม่ได้คาดหมาย                |
| `policy/tools-missing-risk-level`                        | การประกาศเครื่องมือที่อยู่ภายใต้การกำกับไม่มีข้อมูลเมตาความเสี่ยง                             |
| `policy/tools-unknown-risk-level`                        | การประกาศเครื่องมือที่อยู่ภายใต้การกำกับใช้ค่าความเสี่ยงที่ไม่รู้จัก                           |
| `policy/tools-missing-sensitivity-token`                 | การประกาศเครื่องมือที่อยู่ภายใต้การกำกับไม่มีข้อมูลเมตาความอ่อนไหว                      |
| `policy/tools-missing-owner`                             | การประกาศเครื่องมือที่อยู่ภายใต้การกำกับไม่มีข้อมูลเมตาเจ้าของ                            |
| `policy/tools-unknown-sensitivity-token`                 | การประกาศเครื่องมือที่อยู่ภายใต้การกำกับใช้ค่าความอ่อนไหวที่ไม่รู้จัก                    |

ข้อค้นพบหนึ่งรายการสามารถมีทั้ง `target` (สิ่งที่ตรวจพบในพื้นที่ทำงานซึ่ง
ไม่สอดคล้อง) และ `requirement` (กฎที่เขียนไว้ซึ่งทำให้เกิดข้อค้นพบนี้)
ปัจจุบันทั้งสองเป็นสตริงที่อยู่ `oc://` แต่ชื่อฟิลด์อธิบายบทบาทในนโยบาย
แทนที่จะอธิบายรูปแบบที่อยู่

ตัวอย่างข้อค้นพบ:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "ช่องทาง 'telegram' ใช้ผู้ให้บริการ 'telegram' ที่ถูกปฏิเสธ",
  "source": "policy",
  "path": "การกำหนดค่า openclaw",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram ไม่ได้รับการอนุมัติสำหรับพื้นที่ทำงานนี้"
}
```

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "เครื่องมือ 'deploy' ใน TOOLS.md ไม่มีการจำแนกความเสี่ยงอย่างชัดเจน",
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
  "message": "เซิร์ฟเวอร์ MCP 'remote' ไม่อยู่ในรายการอนุญาตของนโยบาย",
  "source": "policy",
  "path": "การกำหนดค่า openclaw",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "การอ้างอิงโมเดล 'anthropic/claude-sonnet-4.7' ใช้ผู้ให้บริการ 'anthropic' ที่ไม่ได้รับอนุมัติ",
  "source": "policy",
  "path": "การกำหนดค่า openclaw",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "การตั้งค่าเครือข่าย 'browser-private-network' อนุญาตการเข้าถึงเครือข่ายส่วนตัว",
  "source": "policy",
  "path": "การกำหนดค่า openclaw",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "การตั้งค่าการผูก Gateway 'gateway-bind' อนุญาตให้เปิดเผยผ่านที่อยู่ที่ไม่ใช่ลูปแบ็ก",
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
  "message": "คำสั่ง Node ของ Gateway 'system.run' ถูกนโยบายปฏิเสธ แต่ไม่ได้ถูกปฏิเสธในการกำหนดค่า OpenClaw",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "เพิ่ม 'system.run' ไปยัง gateway.nodes.denyCommands หรืออัปเดตนโยบายหลังจากตรวจสอบแล้ว"
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "นโยบายไม่อนุญาต sandbox workspaceAccess 'rw' ของ agents.defaults",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## การซ่อมแซม

`doctor --lint` และ `policy check` เป็นแบบอ่านอย่างเดียว

`doctor --fix` จะแก้ไขการตั้งค่าเวิร์กสเปซที่จัดการโดยนโยบายเฉพาะเมื่อ
เปิดใช้ `workspaceRepairs` อย่างชัดเจนเท่านั้น มิฉะนั้น การตรวจสอบจะรายงานสิ่งที่
จะซ่อมแซมและปล่อยให้การตั้งค่าไม่เปลี่ยนแปลง

ในเวอร์ชันนี้ การซ่อมแซมสามารถปิดใช้ช่องทางที่ `channels.denyRules` ปฏิเสธ และ
ใช้การซ่อมแซมเพื่อจำกัดขอบเขตโดยอัตโนมัติตามรายการด้านล่าง เปิดใช้ `workspaceRepairs`
หลังจากตรวจสอบไฟล์นโยบายแล้วเท่านั้น เนื่องจากกฎที่ถูกต้องสามารถเปลี่ยนแปลง
การกำหนดค่าเวิร์กสเปซได้:

- ตั้งค่า `tools.elevated.enabled=false` เมื่อนโยบายส่วนกลางห้ามใช้เครื่องมือที่มีสิทธิ์ระดับสูง
- เพิ่ม ID เครื่องมือที่จำเป็นต้องปฏิเสธแต่ยังขาดอยู่ไปยัง `tools.deny` หรือ
  `agents.list[].tools.deny` เมื่อนโยบายกำหนดให้ปฏิเสธเครื่องมือเหล่านั้น
- ตั้งค่าตัวเลือก `gateway.controlUi.*` ที่ไม่ปลอดภัยเป็น `false`
- ตั้งค่า `gateway.mode=local` เมื่อนโยบายปฏิเสธโหมด Gateway ระยะไกล
- ตั้งค่าพาธ `gateway.http.endpoints.*.enabled` ที่รายงานเป็น `false` เมื่อนโยบาย
  ปฏิเสธปลายทาง HTTP API ของ Gateway
- ตั้งค่าพาธขาเข้า `groupPolicy` ของช่องทางที่รายงานเป็น `allowlist` เมื่อนโยบาย
  ปฏิเสธการรับข้อมูลขาเข้าจากกลุ่มแบบเปิด
- ตั้งค่าพาธขาเข้า `requireMention` ของช่องทางที่รายงานเป็น `true` เมื่อนโยบาย
  กำหนดให้ต้องกล่าวถึงในกลุ่ม
- ตั้งค่า `logging.redactSensitive=tools` เมื่อนโยบายกำหนดให้ปกปิดข้อมูลละเอียดอ่อน
  ในบันทึก
- ตั้งค่า `diagnostics.otel.captureContent=false` หรือ
  `diagnostics.otel.captureContent.enabled=false` สำหรับการตั้งค่าการบันทึกเทเลเมทรีในรูปแบบออบเจ็กต์
  เมื่อนโยบายปฏิเสธการบันทึกเนื้อหาเทเลเมทรี

การซ่อมแซมเครื่องมือที่มีสิทธิ์ระดับสูงแบบกำหนดขอบเขตจะตรวจหาเท่านั้น นอกจากนี้
ระบบจะข้ามการซ่อมแซมการจัดการข้อมูลแบบกำหนดขอบเขตเมื่อผลการตรวจพบรายงานการกำหนดค่า
การบันทึกหรือเทเลเมทรีที่ใช้ร่วมกัน เนื่องจากการเปลี่ยนการตั้งค่าที่ใช้ร่วมกัน
จะส่งผลกระทบมากกว่าเป้าหมายนโยบายที่กำหนดขอบเขตไว้

ระบบจะข้ามการซ่อมแซมรายการที่จำเป็นต้องปฏิเสธแบบกำหนดขอบเขต เมื่อผลการตรวจพบรายงาน
`tools.deny` ระดับรากที่สืบทอดมา เนื่องจากการเพิ่มเครื่องมือที่จำเป็นไปยังการกำหนดค่าระดับรากจะส่งผลกระทบ
มากกว่าเป้าหมายนโยบายที่กำหนดขอบเขตไว้ การซ่อมแซมรายการที่จำเป็นต้องปฏิเสธเฉพาะเอเจนต์สามารถอัปเดต
พาธ `agents.list[].tools.deny` ที่รายงานได้

ระบบจะข้ามการซ่อมแซมขาเข้าของช่องทางแบบกำหนดขอบเขต เมื่อผลการตรวจพบรายงาน
`channels.defaults.*` ที่สืบทอดมา เนื่องจากการเปลี่ยนค่าเริ่มต้นของช่องทางที่ใช้ร่วมกันจะส่งผลกระทบ
มากกว่าเป้าหมายนโยบายที่กำหนดขอบเขตไว้ ผลการตรวจพบรายการอนุญาตสำหรับการดึง URL ผ่าน HTTP ของ Gateway
ยังคงต้องดำเนินการด้วยตนเอง เนื่องจากการซ่อมแซมอัตโนมัติไม่สามารถเลือกค่า URL ปลายทาง
ที่ถูกต้องสำหรับรายการอนุญาตได้

ผลการตรวจพบเกี่ยวกับการผูก Gateway และคำสั่ง Node ยังคงต้องได้รับการตรวจสอบ เมื่อ
สามารถแมป `policy/gateway-non-loopback-bind` หรือ `policy/gateway-node-command-denied`
ไปยังพาธการกำหนดค่าได้ `doctor --fix` จะรายงานการเปลี่ยนแปลง
`gateway.bind` หรือ `gateway.nodes.denyCommands` ที่เสนอเป็นคำแนะนำตัวอย่าง
ที่ถูกข้าม ระบบจะไม่ใช้การเปลี่ยนแปลงดังกล่าว และผลการตรวจพบจะไม่นับว่า
ซ่อมแซมแล้วจนกว่าผู้ปฏิบัติงานจะตรวจสอบและอัปเดตการกำหนดค่าหรือนโยบาย

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

## รหัสออก

| คำสั่ง          | `0`                                                    | `1`                                                                 | `2`                          |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------- |
| `policy check`   | ไม่มีผลการตรวจพบที่ถึงเกณฑ์                          | มีผลการตรวจพบอย่างน้อยหนึ่งรายการที่ถึงเกณฑ์                             | อาร์กิวเมนต์หรือรันไทม์ล้มเหลว |
| `policy compare` | ไฟล์นโยบายเข้มงวดเท่ากับหรือมากกว่าค่าฐาน | ไฟล์นโยบายไม่ถูกต้อง สูญหาย หรือเข้มงวดน้อยกว่ากฎค่าฐาน | อาร์กิวเมนต์หรือรันไทม์ล้มเหลว |
| `policy watch`   | ไม่มีผลการตรวจพบและแฮชที่ยอมรับเป็นปัจจุบัน              | มีผลการตรวจพบหรือการรับรองที่ยอมรับล้าสมัย                    | อาร์กิวเมนต์หรือรันไทม์ล้มเหลว |

## ที่เกี่ยวข้อง

- [โหมด lint ของ Doctor](/th/cli/doctor#lint-mode)
- [CLI สำหรับพาธ](/th/cli/path)
