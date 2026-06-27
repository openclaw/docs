---
read_when:
    - คุณต้องการตรวจสอบการตั้งค่า OpenClaw กับไฟล์ policy.jsonc ที่เขียนไว้
    - คุณต้องการข้อค้นพบด้านนโยบายใน doctor lint
    - คุณต้องมีแฮชการรับรองนโยบายสำหรับหลักฐานการตรวจสอบ
summary: ข้อมูลอ้างอิง CLI สำหรับการตรวจสอบความสอดคล้อง `openclaw policy`
title: นโยบาย
x-i18n:
    generated_at: "2026-06-27T17:22:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5af65bb34aeed72bbb348a56195d65152dce1e8d0e7236da8d8681e56c9b32f4
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` มาจาก Policy plugin ที่รวมมาพร้อมระบบ Policy เป็นชั้นการปฏิบัติตามข้อกำหนดระดับองค์กรที่ครอบทับการตั้งค่า OpenClaw ที่มีอยู่ ไม่ได้เพิ่มระบบการกำหนดค่าชุดที่สอง `policy.jsonc` กำหนดข้อกำหนดที่ผู้เขียนระบุไว้ OpenClaw สังเกต workspace ที่ใช้งานอยู่เป็นหลักฐาน และการตรวจสุขภาพ policy จะรายงาน drift ผ่าน `doctor --lint` สัญญาณการปฏิบัติตามข้อกำหนดสุดท้ายคือการรัน `doctor --lint` ที่สะอาด policy จะเพิ่ม finding เข้าไปในพื้นผิว lint ร่วมนี้ แทนการสร้าง health gate แยกต่างหาก

ปัจจุบัน Policy จัดการช่องทางที่กำหนดค่าไว้, เซิร์ฟเวอร์ MCP, ผู้ให้บริการโมเดล, ท่าที SSRF ของเครือข่าย, ท่าทีการเข้าถึง ingress/channel, ท่าทีการเปิดเผย Gateway, ท่าที workspace ของ agent, ท่าทีการจัดการข้อมูล, ท่าทีผู้ให้บริการ secret/auth profile ใน config ของ OpenClaw และ declaration ของเครื่องมือที่อยู่ภายใต้การกำกับ ตัวอย่างเช่น ฝ่าย IT หรือผู้ดูแล workspace สามารถบันทึกว่า Telegram ไม่ใช่ผู้ให้บริการช่องทางที่ได้รับอนุมัติ จำกัดเซิร์ฟเวอร์ MCP และ model ref ให้เหลือเฉพาะรายการที่ได้รับอนุมัติ กำหนดให้การเข้าถึง fetch/browser บน private-network ยังคงปิดอยู่ กำหนดให้การแยกเซสชัน direct-message และท่าที channel ingress อยู่ภายในขอบเขตที่ผ่านการตรวจทาน กำหนดให้ Gateway bind/auth/HTTP exposure อยู่ภายในขอบเขตที่ผ่านการตรวจทาน กำหนดให้การเข้าถึง workspace ของ agent และ tool deny อยู่ในท่าทีที่ผ่านการตรวจทาน กำหนดให้ SecretRefs ใน config ของ OpenClaw ใช้ผู้ให้บริการที่จัดการไว้ กำหนดให้ config auth profiles มี metadata ของ provider/mode กำหนดให้เครื่องมือที่อยู่ภายใต้การกำกับมี metadata ด้านความเสี่ยงและความละเอียดอ่อน กำหนดให้มีการปกปิดข้อมูลใน logging ที่ละเอียดอ่อน ปฏิเสธการจับเนื้อหา telemetry กำหนดให้มีการบำรุงรักษาการเก็บรักษาเซสชัน ปฏิเสธการทำดัชนี memory ของ session transcript แล้วใช้ `doctor --lint` เป็น gate การปฏิบัติตามข้อกำหนดร่วม

ใช้ policy เมื่อ workspace ต้องการคำประกาศที่คงทน เช่น "ช่องทางเหล่านี้ต้องไม่ถูกเปิดใช้งาน" หรือ "เครื่องมือที่อยู่ภายใต้การกำกับต้องประกาศ metadata การอนุมัติ" และต้องการวิธีที่ทำซ้ำได้เพื่อพิสูจน์ว่า OpenClaw ยังสอดคล้องกับคำประกาศนั้น ใช้ config ปกติและเอกสาร workspace เพียงอย่างเดียวเมื่อคุณต้องการเฉพาะพฤติกรรมในเครื่อง และไม่ต้องการ finding ของ policy หรือ output สำหรับ attestation

## เริ่มต้นอย่างรวดเร็ว

เปิดใช้งาน Policy plugin ที่รวมมาพร้อมระบบก่อนใช้งานครั้งแรก:

```bash
openclaw plugins enable policy
```

เมื่อเปิดใช้งาน policy แล้ว doctor สามารถโหลดการตรวจสุขภาพ policy ได้โดยไม่ต้องเปิดใช้งาน plugin อื่นตามอำเภอใจ plugin จะยังคงเปิดใช้งานอยู่แม้ `policy.jsonc` จะหายไป เพื่อให้ doctor รายงาน artifact ที่ขาดหายได้

Policy ถูกเขียนขึ้น ไม่ได้สร้างจากการตั้งค่าปัจจุบันของผู้ใช้ policy ขั้นต่ำสำหรับช่องทาง, เซิร์ฟเวอร์ MCP, ผู้ให้บริการโมเดล, ท่าทีเครือข่าย, การเข้าถึง ingress/channel, การเปิดเผย Gateway, ท่าที workspace ของ agent, ท่าที sandbox runtime ที่กำหนดค่าไว้, ท่าทีการจัดการข้อมูลของ OpenClaw, ท่าทีผู้ให้บริการ secret/auth profile ใน config, ท่าทีไฟล์ exec approval และ metadata ของเครื่องมือ มีลักษณะดังนี้:

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

กฎคือแหล่งอำนาจสูงสุด บล็อกหมวดหมู่เป็นเพียง namespace เท่านั้น การตรวจจะทำงานเมื่อมีกฎที่เป็นรูปธรรมอยู่ OpenClaw อ่านการตั้งค่า `channels.*` ปัจจุบัน, `mcp.servers.*`, `models.providers.*`, model ref ของ agent ที่เลือก, การตั้งค่า SSRF ของเครือข่าย, ขอบเขตเซสชัน direct-message, policy ของ channel DM, policy ของ channel group, gate การ mention ใน channel/group, ท่าที bind/auth/Control UI/Tailscale/remote/HTTP ของ Gateway, ท่าทีการเข้าถึง sandbox workspace ของ agent ใน config ของ OpenClaw และ tool deny, ท่าที config การจัดการข้อมูล, แหล่งที่มาของผู้ให้บริการ secret และ SecretRef ใน config, metadata ของ config auth profile, ท่าทีเครื่องมือ global/per-agent ที่กำหนดค่าไว้ และ declaration ใน `TOOLS.md` เป็นหลักฐาน จากนั้นรายงานสถานะที่สังเกตพบซึ่งไม่เป็นไปตามข้อกำหนด หาก policy ปฏิเสธ Gateway bind ที่ไม่ใช่ loopback ให้ละเว้น `gateway.bind` เฉพาะเมื่อคุณยินดีตรวจทานค่าเริ่มต้นของ runtime เท่านั้น ตั้งค่า `gateway.bind=loopback` สำหรับการปฏิบัติตาม config อย่างเข้มงวด สำหรับท่าที agent แบบอ่านอย่างเดียว ให้กำหนดค่า sandbox mode บน defaults หรือ agent ที่เกี่ยวข้อง และตั้งค่า `workspaceAccess` เป็น `none` หรือ `ro`; sandbox mode ที่ละเว้นไว้หรือเป็น `off` ไม่ถือว่าเป็นไปตาม policy แบบอ่านอย่างเดียว/ห้ามเขียน `agents.workspace.denyTools` รองรับ `exec`, `process`, `write`, `edit` และ `apply_patch`; config ของ OpenClaw `group:fs` ครอบคลุมเครื่องมือแก้ไขไฟล์ และ `group:runtime` ครอบคลุมเครื่องมือ shell/process Policy ท่าทีเครื่องมือสังเกต `tools.profile`, `tools.allow`, `tools.alsoAllow`, `tools.deny`, `tools.fs.workspaceOnly`, `tools.exec.security`, `tools.exec.ask`, `tools.exec.host`, `tools.elevated.enabled` และ override ต่อ agent แบบเดียวกันที่ `agents.list[].tools.*` Policy exec approval อ่าน artifact ผลิตภัณฑ์ `exec-approvals.json` ที่ระบุชื่อไว้เฉพาะเมื่อมีกฎ `execApprovals` อยู่ หลักฐานจะบันทึก defaults, ท่าทีต่อ agent และรูปแบบ allowlist โดยไม่มี socket token หรือข้อความคำสั่งที่ใช้ล่าสุด Policy ไม่บังคับใช้การเรียกเครื่องมือใน runtime หลักฐาน secret บันทึกท่าที provider/source และ metadata ของ SecretRef เท่านั้น ไม่บันทึกค่า secret ดิบ Policy ไม่อ่านหรือ attest credential store ต่อ agent เช่น `auth-profiles.json`; store เหล่านั้นยังคงอยู่ภายใต้ flow auth และ credential ที่มีอยู่ หลักฐานการจัดการข้อมูลเป็นท่าทีระดับ config เท่านั้น โดยตรวจสอบโหมด redaction ที่กำหนดค่าไว้ toggle การจับเนื้อหา telemetry, โหมดบำรุงรักษาเซสชัน และการตั้งค่าการทำดัชนี memory ของ session transcript ไม่ได้ตรวจสอบ log ดิบ, export ของ telemetry, เนื้อหา transcript, ไฟล์ memory หรือพิสูจน์ว่าไม่มีข้อมูลส่วนบุคคลหรือ secret อยู่

### ข้อมูลอ้างอิงกฎ Policy

ทุกฟิลด์ policy ด้านล่างเป็นแบบไม่บังคับ การตรวจจะทำงานเฉพาะเมื่อมีกฎที่ตรงกันอยู่ใน `policy.jsonc` สถานะที่สังเกตพบคือ config ของ OpenClaw หรือ metadata ของ workspace ที่มีอยู่ policy รายงาน drift แต่ไม่เขียนพฤติกรรม runtime ใหม่ เว้นแต่จะมี repair path ที่พร้อมใช้งานอย่างชัดเจนและเปิดใช้งานอยู่
ไฟล์ Policy เข้มงวด: section หรือ rule key ที่ไม่รองรับจะถูกรายงานเป็น `policy/policy-jsonc-invalid` แทนการถูกละเว้น

Policy overlay ทำให้กฎระดับบนกว้าง ๆ ยังคงเป็น global จากนั้นให้บล็อก scope ที่มีชื่อเพิ่ม section policy ปกติที่เข้มงวดขึ้นสำหรับ selector ที่ระบุชัดเจน ชื่อ scope เป็นเพียง bucket เชิงบรรยายเท่านั้น การจับคู่ใช้ค่า selector ภายใน scope overlay เป็นแบบเพิ่มเข้าไป: claim ระดับ global ยังคงทำงาน และ claim แบบ scoped สามารถส่ง finding ของตัวเองกับ config ที่สังเกตพบเดียวกันได้

#### Overlay แบบกำหนดขอบเขต

ใช้ `scopes.<scopeName>` เมื่อ agent หรือช่องทางชุดหนึ่งต้องการ policy ที่เข้มงวดกว่า baseline ระดับบน section แบบกำหนดขอบเขต agent ใช้ `agentIds` ซึ่งรองรับ `tools.*`, `agents.workspace.*`, `sandbox.*`, `dataHandling.memory.*` และ `execApprovals.*` ingress แบบกำหนดขอบเขตช่องทางใช้ `channelIds` ซึ่งรองรับ `ingress.channels.*` section ที่ไม่รองรับจะถูกปฏิเสธแทนการถูกละเว้น หากรายการ `agentIds` ไม่ปรากฏใน `agents.list[]` OpenClaw จะประเมินกฎแบบ scoped กับท่าที global/default ที่สืบทอดมาสำหรับ runtime agent id นั้น

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

agent เดียวกันสามารถปรากฏในหลาย scope ได้เมื่อแต่ละ scope กำกับดูแลฟิลด์ต่างกันตามที่แสดงด้านบน ฟิลด์แบบ scoped ที่ซ้ำสำหรับ agent เดียวกันต้องเข้มงวดเท่ากันหรือมากกว่าเดิมตาม metadata ของ policy; claim ซ้ำที่อ่อนกว่าเดิมจะถูกปฏิเสธ metadata ความเข้มงวดถือว่า allow-list เป็น subset, deny-list เป็น superset และ boolean ที่ required เป็นข้อกำหนดคงที่

Policy ท่าที container จะถูกประเมินกับหลักฐานที่ OpenClaw สามารถสังเกตได้สำหรับ agent ที่จับคู่เท่านั้น หากกฎ `sandbox.containers.*` ที่เปิดใช้งานมีผลกับ agent ที่ sandbox backend ไม่สามารถเปิดเผยฟิลด์นั้นได้ policy จะรายงาน `policy/sandbox-container-posture-unobservable` แทนการถือว่า claim ผ่าน ใช้ scope `agentIds` แยกกันสำหรับกลุ่ม agent ที่ใช้ sandbox backend ต่างกัน และปล่อยกฎ container ที่ไม่รองรับให้ unset หรือ false สำหรับกลุ่มที่ไม่สามารถสังเกตฟิลด์เหล่านั้นได้

`ingress.session.requireDmScope` ระดับบนยังคงเป็น global เพราะ `session.dmScope` ไม่ใช่หลักฐานที่ระบุแหล่งที่มาตามช่องทางได้

| ตัวเลือก     | ส่วนที่รองรับ                                                                 | ใช้เมื่อ                                          |
| ------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, และ `execApprovals` | เอเจนต์รันไทม์หนึ่งตัวหรือมากกว่าต้องใช้กฎที่เข้มงวดขึ้น   |
| `channelIds` | `ingress.channels`                                                                 | ช่องทางหนึ่งช่องหรือมากกว่าต้องใช้กฎ ingress ที่เข้มงวดขึ้น |

ทุก scope ที่มีอยู่ใน `policy.jsonc` ต้องถูกต้องและบังคับใช้ได้

#### ช่องทาง

| ฟิลด์นโยบาย                         | สถานะที่สังเกตได้                          | ใช้เมื่อ                                                     |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | provider และสถานะ enabled ของ `channels.*` | ปฏิเสธช่องทางที่กำหนดค่าจาก provider เช่น `telegram` |
| `channels.denyRules[].reason`        | ข้อความ finding และบริบทคำแนะนำการซ่อมแซม | อธิบายว่าเหตุใด provider จึงถูกปฏิเสธ                          |

#### เซิร์ฟเวอร์ MCP

| ฟิลด์นโยบาย        | สถานะที่สังเกตได้      | ใช้เมื่อ                                                   |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | ids ของ `mcp.servers.*` | กำหนดให้เซิร์ฟเวอร์ MCP ทุกตัวที่กำหนดค่าต้องอยู่ใน allowlist |
| `mcp.servers.deny`  | ids ของ `mcp.servers.*` | ปฏิเสธ ids ของเซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้โดยเฉพาะ                   |

#### ผู้ให้บริการโมเดล

| ฟิลด์นโยบาย             | สถานะที่สังเกตได้                                   | ใช้เมื่อ                                                                        |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | ids ของ `models.providers.*` และ refs ของโมเดลที่เลือก | กำหนดให้ provider ที่กำหนดค่าและ refs ของโมเดลที่เลือกต้องใช้ provider ที่ได้รับอนุมัติ |
| `models.providers.deny`  | ids ของ `models.providers.*` และ refs ของโมเดลที่เลือก | ปฏิเสธ provider ที่กำหนดค่าและ refs ของโมเดลที่เลือกตาม provider id               |

#### เครือข่าย

| ฟิลด์นโยบาย                   | สถานะที่สังเกตได้                      | ใช้เมื่อ                                                           |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | ช่องทางเลี่ยง SSRF ของเครือข่ายส่วนตัว | ตั้งเป็น `false` เพื่อกำหนดให้การเข้าถึงเครือข่ายส่วนตัวยังคงปิดใช้งาน |

#### Ingress และการเข้าถึงช่องทาง

| ฟิลด์นโยบาย                              | สถานะที่สังเกตได้                                                 | ใช้เมื่อ                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | กำหนดให้มี scope การแยก direct message ที่ผ่านการตรวจทาน                 |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` และฟิลด์นโยบาย DM ของช่องทางแบบเดิม      | อนุญาตเฉพาะนโยบายช่องทาง direct message ที่ผ่านการตรวจทาน               |
| `ingress.channels.denyOpenGroups`         | นโยบาย ingress ของช่องทาง บัญชี และกลุ่ม                     | ปฏิเสธ ingress ของกลุ่มแบบเปิดสำหรับช่องทางและบัญชีที่กำหนดค่า      |
| `ingress.channels.requireMentionInGroups` | การกำหนดค่าเกต mention ของช่องทาง บัญชี กลุ่ม guild และแบบซ้อน | กำหนดให้มีเกต mention เมื่อ ingress ของกลุ่มเปิดอยู่หรือใช้ mention-gated |

#### Gateway

| ฟิลด์นโยบาย                            | สถานะที่สังเกตได้                                 | ใช้เมื่อ                                                     |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | ตั้งเป็น `false` เพื่อกำหนดให้ Gateway ผูกกับ loopback          |
| `gateway.exposure.allowTailscaleFunnel` | ท่าที Gateway ของ Tailscale serve/funnel         | ตั้งเป็น `false` เพื่อปฏิเสธการเปิดเผยผ่าน Tailscale Funnel            |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | ตั้งเป็น `true` เพื่อปฏิเสธการปิดใช้งานการยืนยันตัวตนของ Gateway               |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | ตั้งเป็น `true` เพื่อกำหนดให้มีการกำหนดค่า rate-limit การยืนยันตัวตนอย่างชัดเจน    |
| `gateway.controlUi.allowInsecure`       | toggle การยืนยันตัวตน/device/origin ที่ไม่ปลอดภัยของ Control UI | ตั้งเป็น `false` เพื่อปฏิเสธ toggle การเปิดเผย Control UI ที่ไม่ปลอดภัย |
| `gateway.remote.allow`                  | โหมด/การกำหนดค่า Gateway ระยะไกล                     | ตั้งเป็น `false` เพื่อปฏิเสธโหมด Gateway ระยะไกล                  |
| `gateway.http.denyEndpoints`            | endpoints ของ Gateway HTTP API                     | ปฏิเสธ endpoint ids เช่น `chatCompletions` หรือ `responses`  |
| `gateway.http.requireUrlAllowlists`     | อินพุต URL-fetch ของ Gateway HTTP                  | ตั้งเป็น `true` เพื่อกำหนดให้มี URL allowlists บนอินพุต URL-fetch |

#### พื้นที่ทำงานของเอเจนต์

| ฟิลด์นโยบาย                     | สถานะที่สังเกตได้                                                                        | ใช้เมื่อ                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` และ `agents.list[].sandbox.workspaceAccess` | อนุญาตเฉพาะค่าการเข้าถึงพื้นที่ทำงาน sandbox เช่น `none` หรือ `ro`                                                  |
| `agents.workspace.denyTools`     | การกำหนดค่าปฏิเสธเครื่องมือแบบ global และต่อเอเจนต์                                                 | กำหนดให้เครื่องมือที่แก้ไขพื้นที่ทำงาน/รันไทม์ เช่น `exec`, `process`, `write`, `edit`, หรือ `apply_patch` ต้องถูกปฏิเสธ |

#### ท่าที Sandbox

| ฟิลด์นโยบาย                                          | สถานะที่สังเกตได้                                          | ใช้เมื่อ                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` และโหมดต่อเอเจนต์       | อนุญาตเฉพาะโหมด sandbox ที่ผ่านการตรวจทาน เช่น `all` หรือ `non-main` |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` และ backend ต่อเอเจนต์ | อนุญาตเฉพาะ backend ของ sandbox ที่ผ่านการตรวจทาน เช่น `docker`         |
| `sandbox.containers.denyHostNetwork`                  | โหมดเครือข่าย sandbox/browser ที่ใช้คอนเทนเนอร์รองรับ           | ปฏิเสธโหมดเครือข่ายของโฮสต์                                        |
| `sandbox.containers.denyContainerNamespaceJoin`       | โหมดเครือข่าย sandbox/browser ที่ใช้คอนเทนเนอร์รองรับ           | ปฏิเสธการเข้าร่วม namespace เครือข่ายของคอนเทนเนอร์อื่น              |
| `sandbox.containers.requireReadOnlyMounts`            | โหมด mount ของ sandbox/browser ที่ใช้คอนเทนเนอร์รองรับ             | กำหนดให้ mounts เป็นแบบอ่านอย่างเดียว                                |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | เป้าหมาย mount ของ sandbox/browser ที่ใช้คอนเทนเนอร์รองรับ          | ปฏิเสธ mounts ของ socket รันไทม์คอนเทนเนอร์                          |
| `sandbox.containers.denyUnconfinedProfiles`           | ท่าทีโปรไฟล์ความปลอดภัยของคอนเทนเนอร์                      | ปฏิเสธโปรไฟล์ความปลอดภัยคอนเทนเนอร์แบบ unconfined                   |
| `sandbox.browser.requireCdpSourceRange`               | ช่วงแหล่งที่มาของ CDP สำหรับเบราว์เซอร์ sandbox                        | กำหนดให้การเปิดเผย CDP ของเบราว์เซอร์ต้องประกาศช่วงแหล่งที่มา        |

Policy ถือว่า `sandbox.mode` ที่ขาดหายไปเป็นค่าเริ่มต้นโดยนัย `off` ดังนั้น
`sandbox.requireMode` จะรายงาน sandbox ใหม่หรือยังไม่ได้กำหนดค่าว่าอยู่นอก
allowlist เช่น `["all"]`

#### การจัดการข้อมูล

| ฟิลด์นโยบาย                                        | สถานะที่สังเกตได้                                                                       | ใช้เมื่อ                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | ตั้งเป็น `true` เพื่อปฏิเสธ `logging.redactSensitive: "off"`              |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | ตั้งเป็น `true` เพื่อปฏิเสธการจับเนื้อหาของ telemetry                     |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | ตั้งเป็น `true` เพื่อกำหนดให้โหมดการบำรุงรักษาเซสชันที่มีผลเป็น `enforce` |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` และ `agents.*.memorySearch.experimental.sessionMemory` | ตั้งเป็น `true` เพื่อปฏิเสธการทำดัชนี transcript ของเซสชันเข้าสู่ memory       |

#### ความลับ

| ฟิลด์นโยบาย                      | สถานะที่สังเกตได้                                           | ใช้เมื่อ                                                                |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | SecretRefs ใน config และการประกาศ `secrets.providers.*` | ตั้งเป็น `true` เพื่อกำหนดให้ SecretRefs ชี้ไปยัง provider ที่ประกาศไว้     |
| `secrets.denySources`             | แหล่งที่มาของ secret provider และแหล่งที่มาของ SecretRef            | ปฏิเสธแหล่งที่มา เช่น `exec`, `file`, หรือชื่อแหล่งที่มาอื่นที่กำหนดค่าไว้ |
| `secrets.allowInsecureProviders`  | flags ท่าทีของ secret-provider ที่ไม่ปลอดภัย                   | ตั้งเป็น `false` เพื่อปฏิเสธ provider ที่เลือกใช้ท่าทีไม่ปลอดภัย      |

#### การอนุมัติ Exec

นโยบายการอนุมัติ Exec สังเกต artifact `exec-approvals.json`
ของรันไทม์ที่ใช้งานอยู่ โดยค่าเริ่มต้นคือ `~/.openclaw/exec-approvals.json`; เมื่อ
ตั้งค่า `OPENCLAW_STATE_DIR` ไว้ Policy จะอ่าน
`$OPENCLAW_STATE_DIR/exec-approvals.json` กฎท่าทีจริง เช่น
`execApprovals.defaults.*` หรือ `execApprovals.agents.*` ต้องมีหลักฐาน artifact
ที่อ่านได้; artifact ที่หายไปหรือไม่ถูกต้องจะถูกรายงานเป็นหลักฐานที่สังเกตไม่ได้
แทนที่จะผ่านแบบ best-effort เทียบกับค่าเริ่มต้นรันไทม์สังเคราะห์ เมื่อ
artifact อ่านได้แล้ว ฟิลด์การอนุมัติที่ละไว้จะสืบทอดค่าเริ่มต้นรันไทม์: `defaults.security`
ที่หายไปคือ `full` และ security ของเอเจนต์ที่หายไปจะสืบทอดค่าเริ่มต้นนั้น
หลักฐานรวมถึง `defaults`, `agents.*`, และ
`agents.*.allowlist[].pattern` พร้อม `argPattern` ที่เป็นทางเลือก, ท่าที
`autoAllowSkills` ที่มีผล, และแหล่งที่มาของรายการ โดยไม่รวม socket
path/token, `commandText`, `lastUsedCommand`, path ที่ resolve แล้ว หรือ timestamp

| ฟิลด์นโยบาย | สถานะที่สังเกตได้ | ใช้เมื่อ |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile` | พาธ `exec-approvals.json` ของรันไทม์ที่ใช้งานอยู่ | ตั้งเป็น `true` เพื่อกำหนดให้อาร์ติแฟกต์การอนุมัติต้องมีอยู่และแยกวิเคราะห์ได้ |
| `execApprovals.defaults.allowSecurity` | `defaults.security` โดยมีค่าเริ่มต้นเป็น `full` | อนุญาตเฉพาะโหมดความปลอดภัยเริ่มต้นสำหรับการอนุมัติที่ได้รับอนุมัติแล้ว |
| `execApprovals.agents.allowSecurity` | `agents.*.security` ซึ่งสืบทอดค่าเริ่มต้น | อนุญาตเฉพาะโหมดความปลอดภัยการอนุมัติที่มีผลจริงต่อเอเจนต์แต่ละตัวและได้รับอนุมัติแล้ว |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` และ `agents.*.autoAllowSkills` ซึ่งสืบทอดค่าเริ่มต้นของรันไทม์ | ตั้งเป็น `false` เพื่อกำหนดให้ใช้รายการอนุญาตแบบกำหนดเองอย่างเคร่งครัดโดยไม่มีการอนุมัติ CLI ของ Skills โดยปริยาย |
| `execApprovals.agents.allowlist.expected` | รูปแบบรวมของ `agents.*.allowlist[]` และรายการ `argPattern` ที่เป็นทางเลือก | กำหนดให้รายการอนุญาตของการอนุมัติตรงกับชุดรูปแบบที่ตรวจทานแล้ว |

ตัวอย่างเช่น กำหนดให้อาร์ติแฟกต์การอนุมัติต้องมีอยู่ ปฏิเสธค่าเริ่มต้นที่ผ่อนปรน และ
อนุญาตเฉพาะสถานะการอนุมัติ exec ที่ตรวจทานแล้วสำหรับเอเจนต์ที่เลือก:

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Security modes: "deny", "allowlist", or "full".
      // This default permits only the locked-down deny posture.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Selected agents may use reviewed allowlist posture, but not "full".
          "allowSecurity": ["allowlist"],
          // false means skill CLIs must appear in the reviewed allowlist instead of
          // being implicitly approved by autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Simple entry: exact reviewed executable pattern with no argPattern.
              "travel-hub",
              // Constrained entry: pattern plus reviewed argument regex.
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

| ฟิลด์นโยบาย | สถานะที่สังเกตได้ | ใช้เมื่อ |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | เมตาดาต้า provider และ mode ของ `auth.profiles.*` | กำหนดให้โปรไฟล์การยืนยันตัวตนในคอนฟิกมีคีย์เมตาดาต้า เช่น `provider` และ `mode` |
| `auth.profiles.allowModes` | `auth.profiles.*.mode` | อนุญาตเฉพาะโหมดโปรไฟล์การยืนยันตัวตนที่รองรับ เช่น `api_key`, `aws-sdk`, `oauth` หรือ `token` |

#### เมตาดาต้าของเครื่องมือ

| ฟิลด์นโยบาย | สถานะที่สังเกตได้ | ใช้เมื่อ |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | การประกาศใน `TOOLS.md` ที่อยู่ภายใต้การกำกับ | กำหนดให้เครื่องมือที่อยู่ภายใต้การกำกับต้องประกาศคีย์เมตาดาต้า เช่น `risk`, `sensitivity` หรือ `owner` |

#### สถานะของเครื่องมือ

| ฟิลด์นโยบาย | สถานะที่สังเกตได้ | ใช้เมื่อ |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow` | `tools.profile` และ `agents.list[].tools.profile` | อนุญาตเฉพาะไอดีโปรไฟล์เครื่องมือ เช่น `minimal`, `messaging` หรือ `coding` |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` และการแทนที่ `tools.fs` ต่อเอเจนต์ | ตั้งเป็น `true` เพื่อกำหนดให้สถานะเครื่องมือระบบไฟล์จำกัดเฉพาะเวิร์กสเปซเท่านั้น |
| `tools.exec.allowSecurity` | `tools.exec.security` และความปลอดภัย exec ต่อเอเจนต์ | อนุญาตเฉพาะโหมดความปลอดภัย exec เช่น `deny` หรือ `allowlist` |
| `tools.exec.requireAsk` | `tools.exec.ask` และโหมดถามของ exec ต่อเอเจนต์ | กำหนดให้มีสถานะการอนุมัติ เช่น `always` |
| `tools.exec.allowHosts` | `tools.exec.host` และการกำหนดเส้นทางโฮสต์ exec ต่อเอเจนต์ | อนุญาตเฉพาะโหมดการกำหนดเส้นทางโฮสต์ exec เช่น `sandbox` |
| `tools.elevated.allow` | `tools.elevated.enabled` และสถานะ elevated ต่อเอเจนต์ | ตั้งเป็น `false` เพื่อกำหนดให้โหมดเครื่องมือ elevated ยังคงปิดใช้งาน |
| `tools.alsoAllow.expected` | `tools.alsoAllow` และ `tools.alsoAllow` ต่อเอเจนต์ | กำหนดให้รายการ `alsoAllow` ตรงกันทุกประการ และรายงานสิทธิ์เครื่องมือเพิ่มเติมที่ขาดหายหรือไม่คาดคิด |
| `tools.denyTools` | `tools.deny` และ `agents.list[].tools.deny` | กำหนดให้รายการปฏิเสธเครื่องมือที่คอนฟิกไว้ต้องมีไอดีหรือกลุ่มเครื่องมือ เช่น `group:runtime` และ `group:fs` |

เรียกใช้การตรวจสอบเฉพาะนโยบายระหว่างการเขียน:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` เรียกใช้เฉพาะชุดการตรวจสอบนโยบาย และส่งออกหลักฐาน ผลการตรวจพบ และ
แฮชการรับรอง ผลการตรวจพบเดียวกันนี้ยังปรากฏใน `openclaw doctor --lint`
เมื่อเปิดใช้งาน Policy plugin

เปรียบเทียบไฟล์นโยบายของผู้ปฏิบัติการกับไฟล์นโยบาย baseline ที่เขียนไว้:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` เปรียบเทียบไวยากรณ์ของไฟล์นโยบายกับไวยากรณ์ของไฟล์นโยบาย โดยไม่
ตรวจสอบสถานะรันไทม์ หลักฐาน ข้อมูลประจำตัว หรือความลับของ OpenClaw คำสั่งนี้
ใช้เมตาดาต้ากฎนโยบายเดียวกับที่ควบคุมโอเวอร์เลย์แบบมีขอบเขต: รายการอนุญาตต้อง
เท่ากันหรือแคบกว่า รายการปฏิเสธต้องเท่ากันหรือกว้างกว่า บูลีนที่บังคับต้อง
คงค่าที่บังคับไว้ สตริงที่มีลำดับต้องขยับได้เฉพาะไปยังปลายทางที่เข้มงวดกว่า
ของลำดับที่คอนฟิกไว้ และรายการแบบตรงตัวต้องตรงกัน

ไฟล์ baseline สามารถเป็นนโยบายที่องค์กรเขียนขึ้นได้ นโยบายที่ตรวจสอบสามารถ
ใช้ค่าที่เข้มงวดกว่า หรือเพิ่มกฎนโยบายเพิ่มเติมได้ กฎที่ตรวจสอบในระดับบนสุดยัง
สามารถตอบสนองกฎ baseline แบบมีขอบเขตได้เมื่อเข้มงวดเท่ากันหรือมากกว่า เพราะ
นโยบายระดับบนสุดมีผลอย่างกว้างขวาง ชื่อขอบเขตไม่จำเป็นต้องตรงกัน การเปรียบเทียบ
แบบมีขอบเขตอ้างอิงด้วยค่าตัวเลือก เช่น `agentIds` หรือ `channelIds` และด้วย
ฟิลด์นโยบายที่กำลังตรวจสอบ

ตัวอย่างเอาต์พุต JSON จากการเปรียบเทียบที่สะอาดรายงานเฉพาะสถานะการเปรียบเทียบไฟล์นโยบาย:

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

ตัวอย่างเอาต์พุต `policy check --json` ที่สะอาดมีแฮชที่เสถียรซึ่งผู้ปฏิบัติการหรือผู้ควบคุม
สามารถบันทึกไว้ได้:

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

## คอนฟิกนโยบาย

คอนฟิกนโยบายอยู่ภายใต้ `plugins.entries.policy.config`

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

| การตั้งค่า | วัตถุประสงค์ |
| ------------------------- | --------------------------------------------------------------- |
| `enabled` | เปิดใช้งานการตรวจสอบนโยบายแม้ก่อนที่ `policy.jsonc` จะมีอยู่ |
| `workspaceRepairs` | อนุญาตให้ `doctor --fix` แก้ไขการตั้งค่าเวิร์กสเปซที่นโยบายจัดการ |
| `expectedHash` | การล็อกแฮชที่เป็นทางเลือกสำหรับอาร์ติแฟกต์นโยบายที่ได้รับอนุมัติ |
| `expectedAttestationHash` | การล็อกแฮชที่เป็นทางเลือกสำหรับการตรวจสอบนโยบายที่สะอาดล่าสุดซึ่งยอมรับแล้ว |
| `path` | ตำแหน่งของอาร์ติแฟกต์นโยบายแบบสัมพัทธ์กับเวิร์กสเปซ |

ตั้ง `plugins.entries.policy.config.enabled` เป็น `false` เพื่อปิดใช้งานการตรวจสอบนโยบาย
สำหรับเวิร์กสเปซหนึ่งโดยที่ยังติดตั้ง Plugin ไว้

ข้อกำหนดเมตาดาต้าของเครื่องมือเขียนไว้ใน `policy.jsonc` ด้วย
`tools.requireMetadata` เช่น `["risk", "sensitivity", "owner"]`

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
        "ref": "openai/gpt-5.5",
        "provider": "openai",
        "model": "gpt-5.5",
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

แฮชนโยบายระบุอาร์ติแฟกต์กฎที่เขียนขึ้น บล็อกหลักฐาน
บันทึกสถานะ OpenClaw ที่สังเกตได้ซึ่งใช้โดยการตรวจสอบนโยบาย ค่า
`workspace.hash` ระบุเพย์โหลดหลักฐานนั้นสำหรับขอบเขตที่ตรวจสอบ
แฮชผลการตรวจพบระบุชุดผลการตรวจพบที่แน่นอนซึ่งส่งคืนโดยการตรวจสอบ
`checkedAt` บันทึกเวลาที่การประเมินทำงาน แฮชคำรับรองระบุ
การอ้างสิทธิ์ที่เสถียร ได้แก่ แฮชนโยบาย แฮชหลักฐาน แฮชผลการตรวจพบ และผลลัพธ์
ว่าสะอาดหรือไม่ โดยตั้งใจไม่รวม `checkedAt` เพื่อให้สถานะนโยบายเดียวกัน
สร้างคำรับรองเดียวกันในการตรวจสอบซ้ำ สิ่งเหล่านี้รวมกันเป็นทูเพิลการตรวจสอบ
สำหรับการตรวจสอบนโยบายนี้

หาก Gateway หรือผู้ควบคุมในภายหลังใช้นโยบายเพื่อบล็อก อนุมัติ หรือใส่คำอธิบายประกอบ
การกระทำในรันไทม์ ควรบันทึกแฮชคำรับรองจากการตรวจสอบนโยบายที่สะอาดครั้งล่าสุด
`checkedAt` ยังคงอยู่ในเอาต์พุต JSON สำหรับบันทึกการตรวจสอบ แต่ไม่ได้เป็นส่วนหนึ่งของ
แฮชคำรับรองที่เสถียร

ใช้วงจรชีวิตนี้เมื่อยอมรับสถานะนโยบาย:

1. เขียนหรือตรวจทาน `policy.jsonc`
2. เรียกใช้ `openclaw policy check --json`
3. หากผลลัพธ์สะอาด ให้บันทึก `attestation.policy.hash` เป็น `expectedHash`
4. บันทึก `attestation.attestationHash` เป็น `expectedAttestationHash`
5. เรียกใช้ `openclaw doctor --lint` อีกครั้งใน CI หรือเกตการเผยแพร่

หากกฎนโยบายเปลี่ยนโดยตั้งใจ ให้อัปเดตแฮชที่ยอมรับทั้งสองค่าจากการตรวจสอบที่สะอาด
หากการตั้งค่าเวิร์กสเปซเปลี่ยนโดยตั้งใจแต่นโยบายยังเหมือนเดิม
โดยปกติจะมีเพียง `expectedAttestationHash` ที่เปลี่ยน

การเปิดใช้หรืออัปเกรดกฎ `agents.workspace` จะเพิ่มหลักฐาน `agentWorkspace` ไปยัง
แฮชเวิร์กสเปซและแฮชคำรับรอง ผู้ปฏิบัติงานควรตรวจทานหลักฐานใหม่
และรีเฟรชแฮชคำรับรองที่ยอมรับหลังจากเปิดใช้กฎเหล่านี้
การเปิดใช้หรืออัปเกรดกฎท่าทีของเครื่องมือจะเพิ่มหลักฐาน `toolPosture`
ในลักษณะเดียวกัน

`openclaw policy watch` เรียกใช้การตรวจสอบเดียวกันซ้ำๆ และรายงานเมื่อ
หลักฐานปัจจุบันไม่ตรงกับ `expectedAttestationHash` อีกต่อไป:

```bash
openclaw policy watch --json
```

ใช้ `--once` ใน CI หรือสคริปต์ที่ต้องการการประเมินความคลาดเคลื่อนเพียงครั้งเดียว หากไม่มี
`--once` คำสั่งจะโพลทุกสองวินาทีตามค่าเริ่มต้น ใช้ `--interval-ms` เพื่อ
เลือกช่วงเวลาอื่น

## ผลการตรวจพบ

ขณะนี้นโยบายตรวจสอบ:

| รหัสการตรวจสอบ                                        | สิ่งที่พบ                                                                                 |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | เปิดใช้งานนโยบายแล้ว แต่ไม่มี `policy.jsonc`                                  |
| `policy/policy-jsonc-invalid`                            | ไม่สามารถแยกวิเคราะห์นโยบายได้ หรือมีรายการกฎที่ผิดรูปแบบ                       |
| `policy/policy-hash-mismatch`                            | นโยบายไม่ตรงกับ `expectedHash` ที่กำหนดค่าไว้                                  |
| `policy/attestation-hash-mismatch`                       | หลักฐานนโยบายปัจจุบันไม่ตรงกับการรับรองที่ยอมรับไว้อีกต่อไป               |
| `policy/policy-conformance-invalid`                      | ไฟล์นโยบายฐานหรือไฟล์นโยบายที่ตรวจสอบมีไวยากรณ์การเปรียบเทียบที่ไม่ถูกต้อง                  |
| `policy/policy-conformance-missing`                      | ไฟล์นโยบายที่ตรวจสอบขาดกฎที่ไฟล์นโยบายฐานกำหนดไว้     |
| `policy/policy-conformance-weaker`                       | ไฟล์นโยบายที่ตรวจสอบมีค่าที่อ่อนกว่าไฟล์นโยบายฐาน           |
| `policy/channels-denied-provider`                        | ช่องทางที่เปิดใช้งานตรงกับกฎปฏิเสธช่องทาง                                   |
| `policy/mcp-denied-server`                               | เซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้ถูกปฏิเสธโดยนโยบาย                                      |
| `policy/mcp-unapproved-server`                           | เซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้อยู่นอก allowlist                                 |
| `policy/models-denied-provider`                          | ผู้ให้บริการโมเดลหรือการอ้างอิงโมเดลที่กำหนดค่าไว้ใช้ผู้ให้บริการที่ถูกปฏิเสธ                  |
| `policy/models-unapproved-provider`                      | ผู้ให้บริการโมเดลหรือการอ้างอิงโมเดลที่กำหนดค่าไว้อยู่นอก allowlist                |
| `policy/network-private-access-enabled`                  | เปิดใช้ช่องทางเลี่ยง SSRF สำหรับเครือข่ายส่วนตัวเมื่อถูกนโยบายปฏิเสธ             |
| `policy/ingress-dm-policy-unapproved`                    | นโยบาย DM ของช่องทางอยู่นอก allowlist ของนโยบาย                              |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` ไม่ตรงกับขอบเขตการแยก DM ที่นโยบายกำหนด          |
| `policy/ingress-open-groups-denied`                      | นโยบายกลุ่มของช่องทางเป็น `open` ขณะที่นโยบายปฏิเสธ ingress ของกลุ่มแบบเปิด          |
| `policy/ingress-group-mention-required`                  | รายการช่องทางหรือกลุ่มปิดใช้งานเกตการกล่าวถึง ขณะที่นโยบายกำหนดให้ต้องมี       |
| `policy/gateway-non-loopback-bind`                       | ท่าทีการ bind ของ Gateway อนุญาตให้เปิดเผยแบบ non-loopback เมื่อถูกนโยบายปฏิเสธ         |
| `policy/gateway-auth-disabled`                           | การยืนยันตัวตนของ Gateway ถูกปิดใช้งานเมื่อมีนโยบายกำหนดให้ต้องใช้ auth                     |
| `policy/gateway-rate-limit-missing`                      | ท่าที rate-limit ของ auth บน Gateway ไม่ได้ระบุอย่างชัดเจนเมื่อมีนโยบายกำหนดไว้          |
| `policy/gateway-control-ui-insecure`                     | toggle การเปิดเผยที่ไม่ปลอดภัยของ Gateway Control UI ถูกเปิดใช้งาน                         |
| `policy/gateway-tailscale-funnel`                        | การเปิดเผย Gateway Tailscale Funnel ถูกเปิดใช้งานเมื่อถูกนโยบายปฏิเสธ               |
| `policy/gateway-remote-enabled`                          | โหมด remote ของ Gateway ทำงานอยู่เมื่อถูกนโยบายปฏิเสธ                              |
| `policy/gateway-http-endpoint-enabled`                   | endpoint ของ Gateway HTTP API ถูกเปิดใช้งานขณะที่ถูกนโยบายปฏิเสธ                    |
| `policy/gateway-http-url-fetch-unrestricted`             | อินพุตการดึง URL ของ Gateway HTTP ไม่มี URL allowlist ที่จำเป็น                      |
| `policy/agents-workspace-access-denied`                  | โหมด sandbox ของ agent หรือการเข้าถึง workspace อยู่นอก allowlist ของนโยบาย           |
| `policy/agents-tool-not-denied`                          | agent หรือ config ค่าเริ่มต้นไม่ได้ปฏิเสธเครื่องมือที่นโยบายกำหนด               |
| `policy/tools-profile-unapproved`                        | โปรไฟล์เครื่องมือแบบ global หรือราย agent ที่กำหนดค่าไว้อยู่นอก allowlist           |
| `policy/tools-fs-workspace-only-required`                | เครื่องมือระบบไฟล์ไม่ได้กำหนดค่าด้วยท่าทีพาธแบบ workspace-only             |
| `policy/tools-exec-security-unapproved`                  | โหมดความปลอดภัยของ exec อยู่นอก allowlist ของนโยบาย                               |
| `policy/tools-exec-ask-unapproved`                       | โหมด ask ของ exec อยู่นอก allowlist ของนโยบาย                                    |
| `policy/tools-exec-host-unapproved`                      | การกำหนดเส้นทาง host ของ exec อยู่นอก allowlist ของนโยบาย                                |
| `policy/tools-elevated-enabled`                          | โหมดเครื่องมือแบบยกระดับถูกเปิดใช้งานเมื่อถูกนโยบายปฏิเสธ                              |
| `policy/tools-also-allow-missing`                        | รายการ `alsoAllow` ที่กำหนดค่าไว้ขาดรายการที่นโยบายกำหนด             |
| `policy/tools-also-allow-unexpected`                     | รายการ `alsoAllow` ที่กำหนดค่าไว้มีรายการที่นโยบายไม่ได้คาดไว้           |
| `policy/tools-required-deny-missing`                     | รายการปฏิเสธเครื่องมือแบบ global หรือราย agent ไม่มีเครื่องมือที่ต้องถูกปฏิเสธตามที่กำหนด     |
| `policy/sandbox-mode-unapproved`                         | โหมด sandbox อยู่นอก allowlist ของนโยบาย                                     |
| `policy/sandbox-backend-unapproved`                      | backend ของ sandbox อยู่นอก allowlist ของนโยบาย                                  |
| `policy/sandbox-container-posture-unobservable`          | กฎท่าทีของ container ถูกเปิดใช้งานสำหรับ backend ที่ไม่สามารถสังเกตได้         |
| `policy/sandbox-container-host-network-denied`           | sandbox หรือ browser ที่ใช้ container เป็นฐานใช้โหมดเครือข่ายของ host                     |
| `policy/sandbox-container-namespace-join-denied`         | sandbox หรือ browser ที่ใช้ container เป็นฐานเข้าร่วม namespace ของ container อื่น          |
| `policy/sandbox-container-mount-mode-required`           | mount ของ sandbox หรือ browser ที่ใช้ container เป็นฐานไม่ใช่แบบ read-only                     |
| `policy/sandbox-container-runtime-socket-mount`          | mount ของ sandbox หรือ browser ที่ใช้ container เป็นฐานเปิดเผย socket ของ runtime container |
| `policy/sandbox-container-unconfined-profile`            | โปรไฟล์ sandbox ของ container เป็นแบบ unconfined เมื่อถูกนโยบายปฏิเสธ                    |
| `policy/sandbox-browser-cdp-source-range-missing`        | ช่วงแหล่งที่มาของ CDP สำหรับ sandbox browser ขาดหายไปเมื่อนโยบายกำหนดให้ต้องมี             |
| `policy/data-handling-redaction-disabled`                | การปกปิดข้อมูลสำคัญใน log ถูกปิดใช้งานเมื่อมีนโยบายกำหนดให้ต้องใช้                  |
| `policy/data-handling-telemetry-content-capture`         | การจับเนื้อหา telemetry ถูกเปิดใช้งานเมื่อถูกนโยบายปฏิเสธ                       |
| `policy/data-handling-session-retention-not-enforced`    | การบำรุงรักษาการเก็บรักษา session ไม่ถูกบังคับใช้เมื่อนโยบายกำหนดให้ต้องมี            |
| `policy/data-handling-session-transcript-memory-enabled` | การทำดัชนีหน่วยความจำ transcript ของ session ถูกเปิดใช้งานเมื่อถูกนโยบายปฏิเสธ              |
| `policy/secrets-unmanaged-provider`                      | config SecretRef อ้างถึงผู้ให้บริการที่ไม่ได้ประกาศไว้ใต้ `secrets.providers`  |
| `policy/secrets-denied-provider-source`                  | ผู้ให้บริการ secret ของ config หรือ SecretRef ใช้แหล่งที่มาที่ถูกนโยบายปฏิเสธ             |
| `policy/secrets-insecure-provider`                       | ผู้ให้บริการ secret เลือกใช้ท่าทีที่ไม่ปลอดภัยเมื่อถูกนโยบายปฏิเสธ               |
| `policy/auth-profile-invalid-metadata`                   | โปรไฟล์ auth ของ config ขาด metadata ของผู้ให้บริการหรือโหมดที่ถูกต้อง                 |
| `policy/auth-profile-unapproved-mode`                    | โหมดโปรไฟล์ auth ของ config อยู่นอก allowlist ของนโยบาย                       |
| `policy/exec-approvals-missing`                          | นโยบายกำหนดให้มี `exec-approvals.json` แต่ artifact ขาดหายไป               |
| `policy/exec-approvals-invalid`                          | ไม่สามารถแยกวิเคราะห์ artifact การอนุมัติ exec ที่กำหนดค่าไว้ได้                          |
| `policy/exec-approvals-default-security-unapproved`      | ค่าเริ่มต้นการอนุมัติ exec ใช้โหมดความปลอดภัยที่อยู่นอก allowlist ของนโยบาย          |
| `policy/exec-approvals-agent-security-unapproved`        | โหมดความปลอดภัยการอนุมัติ exec ที่มีผลสำหรับราย agent อยู่นอก allowlist       |
| `policy/exec-approvals-auto-allow-skills-enabled`        | agent การอนุมัติ exec อนุญาต CLI ของ Skills อัตโนมัติโดยนัยเมื่อถูกนโยบายปฏิเสธ   |
| `policy/exec-approvals-allowlist-missing`                | allowlist การอนุมัติขาด pattern ที่นโยบายกำหนด                  |
| `policy/exec-approvals-allowlist-unexpected`             | allowlist การอนุมัติมี pattern ที่นโยบายไม่ได้คาดไว้                |
| `policy/tools-missing-risk-level`                        | การประกาศเครื่องมือที่อยู่ภายใต้การกำกับขาด metadata ความเสี่ยง                             |
| `policy/tools-unknown-risk-level`                        | การประกาศเครื่องมือที่อยู่ภายใต้การกำกับใช้ค่าความเสี่ยงที่ไม่รู้จัก                           |
| `policy/tools-missing-sensitivity-token`                 | การประกาศเครื่องมือที่อยู่ภายใต้การกำกับขาด metadata ความอ่อนไหว                      |
| `policy/tools-missing-owner`                             | การประกาศเครื่องมือที่อยู่ภายใต้การกำกับขาด metadata เจ้าของ                            |
| `policy/tools-unknown-sensitivity-token`                 | การประกาศเครื่องมือที่อยู่ภายใต้การกำกับใช้ค่าความอ่อนไหวที่ไม่รู้จัก                    |

สิ่งที่พบนโยบายสามารถมีได้ทั้ง `target` และ `requirement` `target` คือ
สิ่งใน workspace ที่สังเกตพบว่าไม่เป็นไปตามข้อกำหนด `requirement` คือ
กฎนโยบายที่เขียนไว้ซึ่งทำให้เกิดสิ่งที่พบ ทั้งสองค่าเป็นที่อยู่ในปัจจุบัน โดยปกติคือ
พาธ `oc://` แต่ชื่อฟิลด์อธิบายบทบาทในนโยบายของค่าเหล่านั้น แทนที่จะอธิบาย
รูปแบบที่อยู่

ตัวอย่างสิ่งที่พบแบบ JSON:

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

ตัวอย่างสิ่งที่พบเกี่ยวกับเครื่องมือ:

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

ตัวอย่างสิ่งที่พบเกี่ยวกับ MCP:

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

ตัวอย่างสิ่งที่พบเกี่ยวกับผู้ให้บริการโมเดล:

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

ตัวอย่างสิ่งที่พบเกี่ยวกับเครือข่าย:

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

ตัวอย่างผลการตรวจพบการเปิดเผย Gateway:

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

ตัวอย่างผลการตรวจพบพื้นที่ทำงานของเอเจนต์:

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

`doctor --fix` จะแก้ไขเฉพาะการตั้งค่าพื้นที่ทำงานที่จัดการโดยนโยบายเมื่อ
เปิดใช้งาน `workspaceRepairs` อย่างชัดเจนเท่านั้น หากไม่เลือกเปิดใช้งานนี้ การตรวจนโยบายจะ
รายงานสิ่งที่จะซ่อมแซมและปล่อยให้การตั้งค่าไม่เปลี่ยนแปลง

ในเวอร์ชันนี้ การซ่อมแซมสามารถปิดใช้งานช่องทางที่เปิดใช้งานอยู่ในการกำหนดค่า OpenClaw
แต่ถูกปฏิเสธโดย `channels.denyRules` เปิดใช้งาน `workspaceRepairs` หลังจาก
ตรวจสอบไฟล์นโยบายแล้วเท่านั้น เพราะกฎปฏิเสธที่ถูกต้องสามารถปิด
ช่องทางที่กำหนดค่าไว้ได้:

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
| `policy check`   | ไม่มีผลการตรวจพบที่ถึงเกณฑ์                          | มีผลการตรวจพบอย่างน้อยหนึ่งรายการที่ถึงเกณฑ์                     | อาร์กิวเมนต์หรือรันไทม์ล้มเหลว |
| `policy compare` | ไฟล์นโยบายเข้มงวดอย่างน้อยเท่ากับเส้นฐาน             | ไฟล์นโยบายไม่ถูกต้อง ขาดหาย หรืออ่อนกว่ากฎเส้นฐาน               | อาร์กิวเมนต์หรือรันไทม์ล้มเหลว |
| `policy watch`   | ไม่มีผลการตรวจพบและแฮชที่ยอมรับเป็นปัจจุบัน          | มีผลการตรวจพบหรือการรับรองที่ยอมรับล้าสมัย                       | อาร์กิวเมนต์หรือรันไทม์ล้มเหลว |

## ที่เกี่ยวข้อง

- [โหมด lint ของ Doctor](/th/cli/doctor#lint-mode)
- [CLI สำหรับพาธ](/th/cli/path)
