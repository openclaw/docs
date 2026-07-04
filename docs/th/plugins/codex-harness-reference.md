---
read_when:
    - คุณต้องใช้ฟิลด์การกำหนดค่าของฮาร์เนส Codex ทุกฟิลด์
    - คุณกำลังเปลี่ยนแปลงพฤติกรรมของ transport, auth, discovery หรือ timeout ของ app-server
    - คุณกำลังดีบักการเริ่มต้น Codex harness, การค้นหาโมเดล หรือการแยกสภาพแวดล้อม
summary: ข้อมูลอ้างอิงการกำหนดค่า การตรวจสอบสิทธิ์ การค้นพบ และเซิร์ฟเวอร์แอปสำหรับ Codex harness
title: ข้อมูลอ้างอิง Codex harness
x-i18n:
    generated_at: "2026-07-04T11:07:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43c905586346c8d7c255b58b706eb82543fd1ca05588e459a257e8f9f4cf36d4
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

เอกสารอ้างอิงนี้ครอบคลุมการกำหนดค่าแบบละเอียดสำหรับ Plugin `codex`
ที่มาพร้อมชุด สำหรับการตั้งค่าและการตัดสินใจด้านการกำหนดเส้นทาง ให้เริ่มจาก
[Codex harness](/th/plugins/codex-harness).

## พื้นผิวการกำหนดค่า Plugin

การตั้งค่า Codex harness ทั้งหมดอยู่ภายใต้ `plugins.entries.codex.config`

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

ฟิลด์ระดับบนสุดที่รองรับ:

| ฟิลด์                      | ค่าเริ่มต้น                  | ความหมาย                                                                                                                                   |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | เปิดใช้งาน                  | การตั้งค่าการค้นหาโมเดลสำหรับ Codex app-server `model/list`                                                                               |
| `appServer`                | app-server แบบ managed stdio | การตั้งค่าการขนส่ง คำสั่ง การยืนยันตัวตน การอนุมัติ sandbox และการหมดเวลา                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | ใช้ `"direct"` เพื่อใส่เครื่องมือแบบไดนามิกของ OpenClaw ลงในบริบทเครื่องมือ Codex เริ่มต้นโดยตรง                                                  |
| `codexDynamicToolsExclude` | `[]`                     | ชื่อเครื่องมือแบบไดนามิกของ OpenClaw เพิ่มเติมที่จะละเว้นจากรอบ Codex app-server                                                               |
| `codexPlugins`             | ปิดใช้งาน                 | การรองรับ Plugin/app แบบเนทีฟของ Codex สำหรับ Plugin curated ที่ย้ายมาและติดตั้งจากซอร์ส ดู [Plugin แบบเนทีฟของ Codex](/th/plugins/codex-native-plugins) |
| `computerUse`              | ปิดใช้งาน                 | การตั้งค่า Codex Computer Use ดู [Codex Computer Use](/th/plugins/codex-computer-use)                                                          |

## การขนส่ง app-server

โดยค่าเริ่มต้น OpenClaw จะเริ่มไบนารี Codex แบบ managed ที่มาพร้อมกับ Plugin
ที่รวมอยู่ในชุด:

```bash
codex app-server --listen stdio://
```

วิธีนี้ทำให้เวอร์ชัน app-server ผูกกับ Plugin `codex` ที่มาพร้อมชุด แทนที่จะเป็น
Codex CLI แยกต่างหากตัวใดก็ตามที่บังเอิญติดตั้งอยู่ในเครื่อง ตั้งค่า
`appServer.command` เฉพาะเมื่อคุณตั้งใจต้องการเรียกใช้ไฟล์ปฏิบัติการอื่น

สำหรับ app-server ที่กำลังทำงานอยู่แล้ว ให้ใช้การขนส่ง WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

ฟิลด์ `appServer` ที่รองรับ:

| ฟิลด์                                        | ค่าเริ่มต้น                                             | ความหมาย                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` จะสปอว์น Codex; `"websocket"` จะเชื่อมต่อกับ `url`                                                                                                                                                                                                                                                                                                                                        |
| `homeScope`                                   | `"agent"`                                              | `"agent"` แยกสถานะ Codex ต่อ agent ของ OpenClaw แต่ละตัว `"user"` แชร์ `$CODEX_HOME` ดั้งเดิมหรือ `~/.codex` ใช้การยืนยันตัวตนดั้งเดิม และเปิดใช้การจัดการเธรดเฉพาะเจ้าของเท่านั้น ขอบเขตผู้ใช้ต้องใช้ stdio                                                                                                                                                                                               |
| `command`                                     | ไบนารี Codex ที่จัดการให้                              | ไฟล์ปฏิบัติการสำหรับการขนส่ง stdio เว้นว่างไว้เพื่อใช้ไบนารีที่จัดการให้                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | อาร์กิวเมนต์สำหรับการขนส่ง stdio                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | ไม่ได้ตั้งค่า                                           | URL ของ app-server WebSocket                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | ไม่ได้ตั้งค่า                                           | โทเคน Bearer สำหรับการขนส่ง WebSocket รับสตริงตรงตัวหรือ SecretInput เช่น `${CODEX_APP_SERVER_TOKEN}`                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | ส่วนหัว WebSocket เพิ่มเติม ค่าส่วนหัวยอมรับสตริงตรงตัวหรือค่า SecretInput เช่น `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | ชื่อตัวแปรสภาพแวดล้อมเพิ่มเติมที่จะถูกลบออกจากโปรเซส app-server stdio ที่สปอว์น หลังจาก OpenClaw สร้างสภาพแวดล้อมที่สืบทอดมาแล้ว                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | ไม่ได้ตั้งค่า                                           | ราก workspace ของ app-server Codex ระยะไกล เมื่อตั้งค่า OpenClaw จะอนุมานราก workspace ในเครื่องจาก workspace ของ OpenClaw ที่แก้ไขแล้ว รักษาส่วนต่อท้าย cwd ปัจจุบันภายใต้รากระยะไกลนี้ และส่งเฉพาะ cwd สุดท้ายของ app-server ไปยัง Codex หาก cwd อยู่นอกราก workspace ของ OpenClaw ที่แก้ไขแล้ว OpenClaw จะล้มเหลวแบบปิดแทนที่จะส่งพาธแบบ gateway-local ไปยัง app-server ระยะไกล |
| `requestTimeoutMs`                            | `60000`                                                | เวลาหมดเวลาสำหรับการเรียก control-plane ของ app-server                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | ช่วงเงียบหลังจาก Codex ยอมรับ turn หรือหลังคำขอ app-server ที่จำกัดขอบเขตต่อ turn ขณะที่ OpenClaw รอ `turn/completed`                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | ตัวป้องกัน completion-idle และความคืบหน้าที่ใช้หลังการส่งต่อไปยังเครื่องมือ การทำงานเครื่องมือดั้งเดิมเสร็จสิ้น ความคืบหน้า raw assistant หลังใช้เครื่องมือ การทำ reasoning ดิบเสร็จสิ้น หรือความคืบหน้า reasoning ขณะที่ OpenClaw รอ `turn/completed` ใช้ค่านี้สำหรับงานที่เชื่อถือได้หรืองานหนัก ซึ่งการสังเคราะห์หลังใช้เครื่องมือสามารถเงียบได้นานกว่างบเวลาปล่อย assistant สุดท้ายอย่างถูกต้องตามปกติ                                |
| `mode`                                        | `"yolo"` เว้นแต่ข้อกำหนด Codex ในเครื่องจะไม่อนุญาต YOLO | พรีเซ็ตสำหรับการทำงานแบบ YOLO หรือแบบตรวจทานโดย guardian                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` หรือนโยบายการอนุมัติ guardian ที่อนุญาต       | นโยบายการอนุมัติ Codex ดั้งเดิมที่ส่งไปยังการเริ่มเธรด การดำเนินต่อ และ turn                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` หรือ sandbox guardian ที่อนุญาต  | โหมด sandbox Codex ดั้งเดิมที่ส่งไปยังการเริ่มเธรดและการดำเนินต่อ sandbox ของ OpenClaw ที่ใช้งานอยู่จะจำกัด turn แบบ `danger-full-access` ให้เป็น Codex `workspace-write`; แฟล็กเครือข่ายของ turn จะเป็นไปตาม egress ของ sandbox OpenClaw                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` หรือผู้ตรวจทาน guardian ที่อนุญาต              | ใช้ `"auto_review"` เพื่อให้ Codex ตรวจทานพรอมป์การอนุมัติดั้งเดิมเมื่อได้รับอนุญาต                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | ไดเรกทอรีของโปรเซสปัจจุบัน                              | Workspace ที่ใช้โดย `/codex bind` เมื่อไม่ระบุ `--cwd`                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | ไม่ได้ตั้งค่า                                           | ระดับบริการ app-server Codex แบบไม่บังคับ `"priority"` เปิดใช้การกำหนดเส้นทาง fast-mode, `"flex"` ขอการประมวลผล flex และ `null` ล้างการ override ค่าเดิม `"fast"` จะถูกรับเป็น `"priority"`                                                                                                                                                                                                 |
| `networkProxy`                                | ปิดใช้งาน                                               | เลือกใช้เครือข่ายตามโปรไฟล์สิทธิ์ของ Codex สำหรับคำสั่ง app-server OpenClaw กำหนดค่า config `permissions.<profile>.network` ที่เลือก และเลือกด้วย `default_permissions` แทนการส่ง `sandbox`                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | การเลือกใช้ฟีเจอร์พรีวิวที่ลงทะเบียนสภาพแวดล้อม Codex ที่รองรับโดย sandbox ของ OpenClaw กับ app-server Codex 0.132.0 หรือใหม่กว่า เพื่อให้การทำงาน Codex ดั้งเดิมสามารถรันภายใน sandbox ของ OpenClaw ที่ใช้งานอยู่ได้                                                                                                                                                                                                         |

`appServer.networkProxy` เป็นแบบ explicit เพราะมันเปลี่ยนสัญญา sandbox ของ Codex
เมื่อเปิดใช้ OpenClaw จะตั้งค่า `features.network_proxy.enabled` และ
`default_permissions` ใน config เธรด Codex ด้วย เพื่อให้โปรไฟล์สิทธิ์ที่สร้างขึ้น
สามารถเริ่มเครือข่ายที่ Codex จัดการได้ โดยค่าเริ่มต้น OpenClaw จะสร้างชื่อโปรไฟล์
`openclaw-network-<fingerprint>` ที่ทนต่อการชนกันจากเนื้อหาโปรไฟล์
ใช้ `profileName` เฉพาะเมื่อจำเป็นต้องมีชื่อในเครื่องที่เสถียร

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

หาก runtime ของ app-server ปกติจะเป็น `danger-full-access` การเปิดใช้
`networkProxy` จะใช้การเข้าถึงระบบไฟล์แบบ workspace สำหรับโปรไฟล์สิทธิ์
ที่สร้างขึ้น การบังคับใช้นโยบายเครือข่ายที่ Codex จัดการคือเครือข่ายแบบ sandbox
ดังนั้นโปรไฟล์ full-access จะไม่ป้องกันทราฟฟิกขาออก

Plugin จะบล็อก handshake ของ app-server ที่เก่ากว่าหรือไม่มีเวอร์ชัน Codex app-server
ต้องรายงานเวอร์ชันเสถียร `0.125.0` หรือใหม่กว่า

OpenClaw ถือว่า URL ของ WebSocket app-server ที่ไม่ใช่ loopback เป็นรีโมตและต้องใช้
WebSocket auth ที่มีข้อมูลระบุตัวตนผ่าน `appServer.authToken` หรือ header
`Authorization` `appServer.authToken` และค่า `appServer.headers.*` แต่ละรายการ
สามารถเป็น SecretInput ได้ runtime ของ secrets จะ resolve SecretRefs และ env
แบบ shorthand ก่อนที่ OpenClaw จะสร้างตัวเลือกการเริ่ม app-server และ SecretRefs
แบบมีโครงสร้างที่ resolve ไม่ได้จะ fail ก่อนส่ง token หรือ header ใดๆ เมื่อกำหนดค่า
Codex plugins แบบ native ไว้ OpenClaw จะใช้ control plane ของ Plugin ของ
app-server ที่เชื่อมต่ออยู่เพื่อติดตั้งหรือ refresh Plugins เหล่านั้น แล้ว refresh
inventory ของแอปเพื่อให้แอปที่ Plugin เป็นเจ้าของมองเห็นได้ในเธรด Codex `app/list`
ยังคงเป็นแหล่ง inventory และ metadata ที่เชื่อถือได้ แต่ policy ของ OpenClaw
จะตัดสินใจว่า `thread/start` จะส่ง `config.apps[appId].enabled = true` สำหรับแอป
ที่อยู่ในรายการและเข้าถึงได้หรือไม่ แม้ Codex จะทำเครื่องหมายว่าแอปนั้น disabled
อยู่ในขณะนี้ก็ตาม app ids ที่ไม่รู้จักหรือหายไปยังคง fail-closed เส้นทางนี้จะเปิดใช้
marketplace plugins ผ่าน `plugin/install` และ refresh inventory เท่านั้น เชื่อมต่อ
OpenClaw กับ app-servers แบบรีโมตที่เชื่อถือได้ว่ายอมรับการติดตั้ง Plugin และการ
refresh app inventory ที่ OpenClaw จัดการเท่านั้น

## โหมด approval และ sandbox

เซสชัน app-server แบบ stdio ในเครื่องใช้ค่าเริ่มต้นเป็นโหมด YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` และ
`sandbox: "danger-full-access"` ท่าทีของ operator ในเครื่องที่เชื่อถือได้นี้ทำให้
turns และ heartbeats ของ OpenClaw ที่ไม่มีคนเฝ้าสามารถเดินหน้าต่อได้โดยไม่ต้องมี
prompt approval แบบ native ที่ไม่มีใครอยู่ตอบ

หากไฟล์ข้อกำหนดระบบในเครื่องของ Codex ไม่อนุญาตค่า approval, reviewer หรือ sandbox
แบบ YOLO โดยนัย OpenClaw จะถือค่าเริ่มต้นโดยนัยเป็น guardian แทนและเลือกสิทธิ์
guardian ที่อนุญาต `tools.exec.mode: "auto"` ยังบังคับให้ Codex approvals
ได้รับการ review โดย guardian และจะไม่คง override เดิมที่ไม่ปลอดภัยอย่าง
`approvalPolicy: "never"` หรือ `sandbox: "danger-full-access"` ไว้ ตั้งค่า
`tools.exec.mode: "full"` สำหรับท่าทีที่ตั้งใจให้ไม่มี approval รายการ
`[[remote_sandbox_config]]` ที่ match hostname ในไฟล์ข้อกำหนดเดียวกันจะถูกนำมาใช้
ในการตัดสินค่าเริ่มต้นของ sandbox

ตั้งค่า `appServer.mode: "guardian"` สำหรับ approvals ของ Codex ที่ guardian review:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

preset `guardian` จะขยายเป็น `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` และ `sandbox: "workspace-write"` เมื่อค่าเหล่านั้น
ได้รับอนุญาต ฟิลด์ policy แต่ละรายการจะ override `mode` ค่า reviewer เดิม
`guardian_subagent` ยังยอมรับเป็น alias เพื่อความเข้ากันได้ แต่ config ใหม่ควรใช้
`auto_review`

เมื่อ OpenClaw sandbox ทำงานอยู่ process ของ Codex app-server ในเครื่องยังคงทำงาน
บนโฮสต์ Gateway ดังนั้น OpenClaw จะปิดใช้งาน Codex Code Mode แบบ native, MCP servers
ของผู้ใช้ และการเรียกใช้ Plugin ที่มีแอปรองรับสำหรับ turn นั้น แทนที่จะถือว่า
sandboxing ฝั่งโฮสต์ของ Codex เทียบเท่ากับ backend sandbox ของ OpenClaw
การเข้าถึง shell จะถูกเปิดผ่าน dynamic tools ที่มี sandbox ของ OpenClaw รองรับ เช่น
`sandbox_exec` และ `sandbox_process` เมื่อ tools exec/process ปกติมีให้ใช้

บนโฮสต์ Ubuntu/AppArmor Codex bwrap อาจล้มเหลวภายใต้ `workspace-write` ก่อนที่คำสั่ง
shell จะเริ่ม เมื่อคุณตั้งใจเรียกใช้ Codex `workspace-write` แบบ native โดยไม่มี
OpenClaw sandboxing ที่ active หากคุณเห็น
`bwrap: setting up uid map: Permission denied` หรือ
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` ให้รัน
`openclaw doctor` แล้วแก้ policy namespace ของโฮสต์ที่รายงานสำหรับผู้ใช้ service
ของ OpenClaw แทนการให้สิทธิ์ Docker container ที่กว้างกว่า ควรใช้โปรไฟล์ AppArmor
แบบจำกัดขอบเขตสำหรับ process ของ service ส่วน fallback
`kernel.apparmor_restrict_unprivileged_userns=0` มีผลทั้งโฮสต์และมี tradeoffs
ด้านความปลอดภัย

## การเรียกใช้แบบ native ภายใต้ sandbox

ค่าเริ่มต้นที่เสถียรคือ fail-closed: OpenClaw sandboxing ที่ active จะปิดใช้งาน
พื้นผิวการเรียกใช้ Codex แบบ native ที่ไม่เช่นนั้นจะทำงานจากโฮสต์ Codex app-server
ใช้ `appServer.experimental.sandboxExecServer: true` เฉพาะเมื่อคุณต้องการลองใช้
การรองรับ environment รีโมตของ Codex กับ backend sandbox ของ OpenClaw เส้นทาง preview
นี้ต้องใช้ Codex app-server 0.132.0 หรือใหม่กว่า

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

เมื่อ flag เปิดอยู่และเซสชัน OpenClaw ปัจจุบันอยู่ใน sandbox OpenClaw จะเริ่ม
exec-server แบบ local loopback ที่รองรับโดย sandbox ที่ active ลงทะเบียนกับ
Codex app-server และเริ่มเธรดกับ turn ของ Codex ด้วย environment ที่ OpenClaw
เป็นเจ้าของนั้น หาก app-server ลงทะเบียน environment ไม่ได้ การรันจะ fail closed
แทนการ fallback เงียบๆ ไปเป็นการเรียกใช้บนโฮสต์

เส้นทาง preview นี้ใช้ได้เฉพาะในเครื่อง app-server แบบ WebSocket รีโมตไม่สามารถเข้าถึง
loopback exec-server ได้ เว้นแต่จะทำงานบนโฮสต์เดียวกัน ดังนั้น OpenClaw จึงปฏิเสธ
ชุดค่าดังกล่าว

## Auth และการแยก environment

ใน home แบบ per-agent เริ่มต้น auth จะถูกเลือกตามลำดับนี้:

1. โปรไฟล์ auth ของ OpenClaw Codex ที่ระบุชัดเจนสำหรับ agent
2. บัญชีที่มีอยู่ของ app-server ใน Codex home ของ agent นั้น
3. สำหรับการ launch app-server แบบ stdio ในเครื่องเท่านั้น `CODEX_API_KEY` แล้วจึง
   `OPENAI_API_KEY` เมื่อไม่มีบัญชี app-server อยู่และยังต้องใช้ OpenAI auth

เมื่อ OpenClaw พบโปรไฟล์ auth ของ Codex แบบ subscription-style ของ ChatGPT จะลบ
`CODEX_API_KEY` และ `OPENAI_API_KEY` ออกจาก child process ของ Codex ที่ spawn ขึ้น
สิ่งนี้ทำให้ API keys ระดับ Gateway ยังพร้อมใช้สำหรับ embeddings หรือ models ของ
OpenAI โดยตรง โดยไม่ทำให้ turns ของ Codex app-server แบบ native ถูกคิดค่าบริการ
ผ่าน API โดยไม่ตั้งใจ

โปรไฟล์ API-key ของ Codex ที่ระบุชัดเจนและ fallback env-key สำหรับ stdio ในเครื่อง
ใช้การ login ของ app-server แทน env ของ child-process ที่สืบทอดมา การเชื่อมต่อ
app-server แบบ WebSocket จะไม่ได้รับ fallback API-key จาก env ของ Gateway ให้ใช้
โปรไฟล์ auth ที่ระบุชัดเจนหรือบัญชีของ app-server รีโมตเอง

การ launch app-server แบบ stdio จะสืบทอด environment ของ process OpenClaw ตามค่าเริ่มต้น
OpenClaw เป็นเจ้าของ bridge บัญชี Codex app-server และตั้งค่า `CODEX_HOME` เป็น
ไดเรกทอรี per-agent ใต้ state ของ OpenClaw ของ agent นั้น สิ่งนี้ทำให้ config, accounts,
plugin cache/data และ thread state ของ Codex ถูกจำกัดขอบเขตอยู่กับ agent ของ OpenClaw
แทนที่จะรั่วเข้ามาจาก home `~/.codex` ส่วนตัวของ operator

ตั้งค่า `appServer.homeScope: "user"` เพื่อแชร์ state ของ Codex แบบ native กับ
Codex Desktop และ CLI โหมด local-stdio-only นี้ใช้ `$CODEX_HOME` เมื่อมีการตั้งค่า
และใช้ `~/.codex` ในกรณีอื่น รวมถึง auth, config, plugins และ threads แบบ native
OpenClaw จะข้าม bridge โปรไฟล์ auth ของตนสำหรับ app-server turns ของ owner ที่ยืนยันแล้ว
สามารถใช้ `codex_threads` เพื่อ list, search, read, fork, rename, archive และ restore
threads เหล่านั้นได้ Fork thread ก่อนดำเนินต่อใน OpenClaw; process ของ Codex ที่แยกกัน
จะไม่ประสานงานผู้เขียนพร้อมกันสำหรับ thread เดียวกัน

OpenClaw จะไม่ rewrite `HOME` สำหรับการ launch app-server ในเครื่องตามปกติ subprocesses
ที่ Codex รัน เช่น `openclaw`, `gh`, `git`, cloud CLIs และคำสั่ง shell จะเห็น process
home ปกติและหา config กับ tokens ใน user-home ได้ Codex อาจค้นพบ
`$HOME/.agents/skills` และ `$HOME/.agents/plugins/marketplace.json` ด้วย การค้นพบ
`.agents` นั้นตั้งใจแชร์กับ home ของ operator และแยกจาก state `~/.codex` ที่ isolate

ในขอบเขต agent เริ่มต้น Plugins ของ OpenClaw และ snapshots ของ OpenClaw skill
ยังคงไหลผ่าน registry ของ Plugin และ skill loader ของ OpenClaw เอง แต่ assets
`~/.codex` ส่วนตัวของ Codex จะไม่ไหลผ่าน หากคุณมี skills หรือ plugins ของ Codex CLI
ที่มีประโยชน์จาก Codex home ซึ่งควรกลายเป็นส่วนหนึ่งของ agent OpenClaw ที่ isolate
ให้ทำ inventory อย่างชัดเจน:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

หาก deployment ต้องการการแยก environment เพิ่มเติม ให้เพิ่ม variables เหล่านั้นใน
`appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` มีผลเฉพาะกับ child process ของ Codex app-server ที่ spawn ขึ้น
OpenClaw จะลบ `CODEX_HOME` และ `HOME` ออกจากรายการนี้ระหว่าง normalization การ launch
ในเครื่อง: `CODEX_HOME` ยังคงชี้ไปยังขอบเขต agent หรือ user ที่เลือก และ `HOME`
ยังคงสืบทอดมาเพื่อให้ subprocesses ใช้ state ใน user-home ปกติได้

## Dynamic tools

dynamic tools ของ Codex ใช้ค่าเริ่มต้นเป็นการโหลดแบบ `searchable` OpenClaw ไม่เปิดเผย
dynamic tools ที่ซ้ำกับการทำงาน workspace แบบ native ของ Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

tools การผสานรวม OpenClaw ที่เหลือส่วนใหญ่ เช่น messaging, media, cron, browser,
nodes, gateway, `heartbeat_respond` และ `web_search` จะพร้อมใช้ผ่านการค้นหา tool
ของ Codex ภายใต้ namespace `openclaw` วิธีนี้ทำให้ context เริ่มต้นของ model เล็กลง
`sessions_yield` และการตอบกลับ source แบบ message-tool-only ยังคงเป็น direct เพราะ
สิ่งเหล่านั้นเป็นสัญญา turn-control `sessions_spawn` ยังคงเป็น searchable เพื่อให้
`spawn_agent` แบบ native ของ Codex ยังคงเป็นพื้นผิว subagent หลักของ Codex ขณะที่
การมอบหมายงานแบบ OpenClaw หรือ ACP อย่างชัดเจนยังคงพร้อมใช้ผ่าน namespace ของ
dynamic tool `openclaw`

ตั้งค่า `codexDynamicToolsLoading: "direct"` เฉพาะเมื่อเชื่อมต่อกับ Codex app-server
แบบกำหนดเองที่ไม่สามารถค้นหา dynamic tools ที่เลื่อนโหลดไว้ หรือเมื่อ debugging
payload ของ tool แบบเต็ม

## Timeouts

การเรียก dynamic tool ที่ OpenClaw เป็นเจ้าของถูกจำกัดเวลาแยกจาก
`appServer.requestTimeoutMs` request `item/tool/call` แต่ละรายการของ Codex ใช้ timeout
แรกที่มีตามลำดับนี้:

- argument `timeoutMs` ต่อ call ที่เป็นค่าบวก
- สำหรับ `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`
- สำหรับ `image_generate` ที่ไม่มี timeout ที่กำหนดไว้ ค่าเริ่มต้น image-generation
  120 วินาที
- สำหรับ tool `image` ของ media-understanding, `tools.media.image.timeoutSeconds`
  ที่แปลงเป็นมิลลิวินาที หรือค่าเริ่มต้นของ media 60 วินาที สำหรับ image understanding
  ค่านี้มีผลกับ request เองและจะไม่ถูกลดลงจากงานเตรียมการก่อนหน้า
- ค่าเริ่มต้นของ dynamic-tool 90 วินาที

watchdog นี้คือ budget ภายนอกของ dynamic `item/tool/call` request timeouts เฉพาะ
provider จะทำงานอยู่ภายใน call นั้นและรักษา semantics ของ timeout เอง budget ของ
dynamic tool ถูกจำกัดสูงสุดที่ 600000 ms เมื่อ timeout OpenClaw จะ abort signal ของ
tool เมื่อรองรับ และส่ง dynamic-tool response ที่ล้มเหลวกลับไปยัง Codex เพื่อให้
turn ดำเนินต่อได้แทนที่จะปล่อยให้เซสชันค้างอยู่ใน `processing`

หลังจาก Codex ยอมรับ turn และหลังจาก OpenClaw ตอบสนอง request ของ app-server
ที่อยู่ในขอบเขต turn แล้ว harness คาดว่า Codex จะเดินหน้าภายใน current-turn และท้ายที่สุด
จบ turn แบบ native ด้วย `turn/completed` หาก app-server เงียบไปนาน
`appServer.turnCompletionIdleTimeoutMs` OpenClaw จะพยายาม interrupt turn ของ Codex
อย่าง best-effort บันทึก diagnostic timeout และปล่อย lane ของเซสชัน OpenClaw เพื่อให้
ข้อความแชตถัดไปไม่ถูก queue อยู่หลัง turn แบบ native ที่ค้างอยู่

การแจ้งเตือนส่วนใหญ่ที่ไม่ใช่สถานะสิ้นสุดสำหรับรอบเดียวกันจะปลดตัวเฝ้าระวังระยะสั้นนั้น
เพราะ Codex ได้พิสูจน์แล้วว่ารอบนั้นยังทำงานอยู่ การส่งต่อเครื่องมือใช้งบเวลาว่างหลังเครื่องมือที่ยาวกว่า:
หลังจาก OpenClaw ส่งคืนการตอบกลับ `item/tool/call`, หลังจากรายการเครื่องมือ native เช่น
`commandExecution` เสร็จสมบูรณ์, หลังจากการเสร็จสมบูรณ์ของ
`custom_tool_call_output` แบบ raw และหลังจากความคืบหน้าของผู้ช่วยแบบ raw หลังเครื่องมือ,
การเสร็จสมบูรณ์ของการให้เหตุผลแบบ raw, หรือความคืบหน้าของการให้เหตุผล กลไกป้องกันใช้
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` เมื่อกำหนดค่าไว้ และ
ใช้ค่าเริ่มต้นเป็นห้านาทีในกรณีอื่น งบหลังเครื่องมือเดียวกันนั้นยังขยาย
ตัวเฝ้าระวังความคืบหน้าสำหรับช่วงสังเคราะห์แบบเงียบก่อนที่ Codex จะส่งเหตุการณ์
รอบปัจจุบันถัดไป การเสร็จสมบูรณ์ของการให้เหตุผล, การเสร็จสมบูรณ์ของ
`agentMessage` แบบ commentary และความคืบหน้าของการให้เหตุผลหรือผู้ช่วยแบบ raw ก่อนเครื่องมือ
อาจตามด้วยการตอบกลับสุดท้ายอัตโนมัติได้ ดังนั้นจึงใช้กลไกป้องกันการตอบกลับหลังความคืบหน้า
แทนการปล่อยเลนเซสชันทันที เฉพาะรายการ `agentMessage` ที่เสร็จสมบูรณ์แบบ
final/non-commentary และการเสร็จสมบูรณ์ของผู้ช่วยแบบ raw ก่อนเครื่องมือเท่านั้น
ที่จะเปิดใช้การปล่อยเอาต์พุตของผู้ช่วย: หาก Codex เงียบไปโดยไม่มี
`turn/completed` จากนั้น OpenClaw จะพยายามขัดจังหวะรอบ native และปล่อย
เลนเซสชันอย่างสุดความสามารถ ความล้มเหลวของ app-server แบบ stdio ที่เล่นซ้ำได้อย่างปลอดภัย
รวมถึงการหมดเวลารอการเสร็จสมบูรณ์ของรอบโดยไม่มีหลักฐานของผู้ช่วย, เครื่องมือ,
รายการที่ใช้งานอยู่ หรือผลข้างเคียง จะถูกลองใหม่หนึ่งครั้งด้วยความพยายาม app-server ใหม่
การหมดเวลาที่ไม่ปลอดภัยยังคงเลิกใช้ไคลเอนต์ app-server ที่ค้างอยู่และปล่อยเลนเซสชัน
OpenClaw นอกจากนี้ยังล้างการผูกเธรด native ที่ค้าง แทนที่จะเล่นซ้ำโดยอัตโนมัติ
การหมดเวลาของการเฝ้าดูการเสร็จสมบูรณ์จะแสดงข้อความหมดเวลาที่เจาะจงกับ Codex:
กรณีที่เล่นซ้ำได้อย่างปลอดภัยจะบอกว่าการตอบกลับอาจไม่สมบูรณ์ ส่วนกรณีที่ไม่ปลอดภัย
จะบอกให้ผู้ใช้ตรวจสอบสถานะปัจจุบันก่อนลองใหม่ การวินิจฉัยการหมดเวลาสาธารณะ
มีฟิลด์เชิงโครงสร้าง เช่น เมธอดการแจ้งเตือน app-server ล่าสุด,
id/type/role ของรายการการตอบกลับผู้ช่วยแบบ raw, จำนวนคำขอ/รายการที่ใช้งานอยู่ และสถานะ
watch ที่เปิดใช้ เมื่อการแจ้งเตือนล่าสุดเป็นรายการการตอบกลับผู้ช่วยแบบ raw
การวินิจฉัยยังรวมตัวอย่างข้อความผู้ช่วยแบบจำกัดขนาดไว้ด้วย แต่จะไม่รวมพรอมป์แบบ raw
หรือเนื้อหาเครื่องมือ

## การค้นพบโมเดล

โดยค่าเริ่มต้น Plugin Codex จะถาม app-server เพื่อดูโมเดลที่พร้อมใช้งาน
ความพร้อมใช้งานของโมเดลเป็นความรับผิดชอบของ Codex app-server ดังนั้นรายการจึงอาจเปลี่ยนได้
เมื่อ OpenClaw อัปเกรดเวอร์ชัน `@openai/codex` ที่รวมมา หรือเมื่อการปรับใช้ชี้
`appServer.command` ไปยังไบนารี Codex อื่น ความพร้อมใช้งานอาจถูกจำกัดตามบัญชีได้เช่นกัน
ใช้ `/codex models` บน Gateway ที่กำลังทำงานเพื่อดูแค็ตตาล็อกสดสำหรับ harness และบัญชีนั้น

หากการค้นพบล้มเหลวหรือหมดเวลา OpenClaw จะใช้แค็ตตาล็อก fallback ที่รวมมาสำหรับ:

- GPT-5.5
- GPT-5.4 mini

harness ที่รวมมาในปัจจุบันคือ `@openai/codex` `0.142.4` โพรบ `model/list`
กับ app-server ที่รวมมานั้นในเวิร์กสเปซที่เปิดใช้ GPT-5.6 ส่งคืนแถวตัวเลือกสาธารณะเหล่านี้:

| รหัสโมเดล              | รูปแบบอินพุต | ระดับความพยายามในการให้เหตุผล       |
| --------------------- | ---------------- | ------------------------------------ |
| `gpt-5.6-sol`         | text, image      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | text, image      | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | text, image      | low, medium, high, xhigh, max        |
| `gpt-5.5`             | text, image      | low, medium, high, xhigh             |
| `gpt-5.4`             | text, image      | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | text, image      | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | text, image      | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | text             | low, medium, high, xhigh             |

การเข้าถึง GPT-5.6 ถูกจำกัดตามบัญชีในช่วงตัวอย่างแบบจำกัด `max` เป็น
ระดับความพยายามในการให้เหตุผลของโมเดล `ultra` เป็นเมทาดาทาการประสานงานแบบหลายเอเจนต์
ของ Codex ที่แยกต่างหาก ไม่ใช่ระดับความพยายามในการให้เหตุผลมาตรฐานของ OpenAI

โมเดลที่ซ่อนอยู่สามารถถูกส่งคืนโดยแค็ตตาล็อก app-server สำหรับโฟลว์ภายในหรือ
เฉพาะทางได้ แต่ไม่ใช่ตัวเลือกปกติในตัวเลือกโมเดล

ปรับแต่งการค้นพบภายใต้ `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

ปิดใช้การค้นพบเมื่อคุณต้องการให้การเริ่มต้นหลีกเลี่ยงการโพรบ Codex และใช้เฉพาะ
แค็ตตาล็อก fallback:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## ไฟล์บูตสแตรปของเวิร์กสเปซ

Codex จัดการ `AGENTS.md` เองผ่านการค้นพบเอกสารโปรเจกต์แบบ native OpenClaw
ไม่เขียนไฟล์เอกสารโปรเจกต์ Codex สังเคราะห์หรือพึ่งพาชื่อไฟล์ fallback ของ Codex
สำหรับไฟล์ persona เพราะ fallback ของ Codex จะใช้เฉพาะเมื่อไม่มี
`AGENTS.md`

เพื่อให้เวิร์กสเปซ OpenClaw มีความเท่าเทียมกัน harness Codex จะ resolve ไฟล์บูตสแตรปอื่น
`SOUL.md`, `IDENTITY.md`, `TOOLS.md` และ `USER.md` จะถูกส่งต่อเป็น
คำสั่งนักพัฒนา OpenClaw Codex เพราะไฟล์เหล่านี้กำหนดเอเจนต์ที่ใช้งานอยู่,
คำแนะนำเวิร์กสเปซที่มีให้ใช้ และโปรไฟล์ผู้ใช้ รายการ Skills แบบย่อของ OpenClaw
จะถูกส่งต่อเป็นคำสั่งนักพัฒนาสำหรับการทำงานร่วมกันที่จำกัดตามรอบ
เนื้อหา `HEARTBEAT.md` จะไม่ถูกฉีดเข้าไป; รอบ Heartbeat จะได้รับตัวชี้โหมดการทำงานร่วมกัน
ให้อ่านไฟล์เมื่อไฟล์มีอยู่และไม่ว่างเปล่า เนื้อหา `MEMORY.md`
จากเวิร์กสเปซเอเจนต์ที่กำหนดค่าจะไม่ถูกวางลงในอินพุตรอบ Codex แบบ native
เมื่อเครื่องมือหน่วยความจำพร้อมใช้งานสำหรับเวิร์กสเปซนั้น; เมื่อไฟล์มีอยู่ harness
จะเพิ่มตัวชี้หน่วยความจำเวิร์กสเปซขนาดเล็กในคำสั่งนักพัฒนาสำหรับการทำงานร่วมกัน
ที่จำกัดตามรอบ และ Codex ควรใช้ `memory_search` หรือ `memory_get`
เมื่อหน่วยความจำถาวรเกี่ยวข้อง หากเครื่องมือถูกปิดใช้, การค้นหาหน่วยความจำไม่พร้อมใช้งาน,
หรือเวิร์กสเปซที่ใช้งานอยู่แตกต่างจากเวิร์กสเปซหน่วยความจำของเอเจนต์ `MEMORY.md`
จะใช้เส้นทางบริบทรอบแบบจำกัดปกติ
`BOOTSTRAP.md` เมื่อมีอยู่จะถูกส่งต่อเป็นบริบทอ้างอิงอินพุตรอบของ OpenClaw

## การแทนที่สภาพแวดล้อม

การแทนที่สภาพแวดล้อมยังคงพร้อมใช้งานสำหรับการทดสอบในเครื่อง:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` จะข้ามไบนารีที่จัดการไว้เมื่อไม่ได้ตั้งค่า
`appServer.command`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกนำออกแล้ว ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือ
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบในเครื่องแบบครั้งเดียว ควรใช้ config
สำหรับการปรับใช้ที่ทำซ้ำได้ เพราะช่วยเก็บพฤติกรรม Plugin ไว้ในไฟล์ที่ผ่านการตรวจทานเดียวกัน
กับการตั้งค่า Codex harness ส่วนที่เหลือ

## ที่เกี่ยวข้อง

- [Codex harness](/th/plugins/codex-harness)
- [รันไทม์ Codex harness](/th/plugins/codex-harness-runtime)
- [Plugin Codex แบบ native](/th/plugins/codex-native-plugins)
- [Codex Computer Use](/th/plugins/codex-computer-use)
- [ผู้ให้บริการ OpenAI](/th/providers/openai)
- [อ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
