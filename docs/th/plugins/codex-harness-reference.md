---
read_when:
    - คุณต้องระบุฟิลด์การกำหนดค่าทุกฟิลด์ของ harness สำหรับ Codex
    - คุณกำลังเปลี่ยนแปลงพฤติกรรมด้านการขนส่งข้อมูล การตรวจสอบสิทธิ์ การค้นพบบริการ หรือการหมดเวลาของ app-server
    - คุณกำลังดีบักการเริ่มต้น Codex harness, การค้นหาโมเดล หรือการแยกสภาพแวดล้อม
summary: การอ้างอิงการกำหนดค่า การยืนยันตัวตน การค้นพบ และแอปเซิร์ฟเวอร์สำหรับ Codex harness
title: ข้อมูลอ้างอิงฮาร์เนส Codex
x-i18n:
    generated_at: "2026-06-27T17:52:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32da817c262a61769b78b16c10e508175c730a568c2ba6321595c430815526a5
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

เอกสารอ้างอิงนี้ครอบคลุมการกำหนดค่าโดยละเอียดสำหรับ Plugin `codex`
ที่รวมมาให้ สำหรับการตั้งค่าและการตัดสินใจด้านการกำหนดเส้นทาง ให้เริ่มที่
[ฮาร์เนส Codex](/th/plugins/codex-harness)

## พื้นผิวการกำหนดค่า Plugin

การตั้งค่าฮาร์เนส Codex ทั้งหมดอยู่ภายใต้ `plugins.entries.codex.config`

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
| `appServer`                | app-server แบบ stdio ที่จัดการให้ | การตั้งค่าการขนส่ง คำสั่ง การยืนยันตัวตน การอนุมัติ sandbox และการหมดเวลา                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | ใช้ `"direct"` เพื่อใส่เครื่องมือแบบไดนามิกของ OpenClaw ลงในบริบทเครื่องมือ Codex เริ่มต้นโดยตรง                                                  |
| `codexDynamicToolsExclude` | `[]`                     | ชื่อเครื่องมือแบบไดนามิกของ OpenClaw เพิ่มเติมที่จะละเว้นจากเทิร์น Codex app-server                                                               |
| `codexPlugins`             | ปิดใช้งาน                 | การรองรับ Plugin/แอป Codex แบบเนทีฟสำหรับ Plugin คัดสรรที่ติดตั้งจากซอร์สและย้ายแล้ว ดู [Plugin Codex แบบเนทีฟ](/th/plugins/codex-native-plugins) |
| `computerUse`              | ปิดใช้งาน                 | การตั้งค่า Codex Computer Use ดู [Codex Computer Use](/th/plugins/codex-computer-use)                                                          |

## การขนส่งของ App-server

โดยค่าเริ่มต้น OpenClaw จะเริ่มไบนารี Codex ที่จัดการให้ซึ่งมาพร้อมกับ
Plugin ที่รวมมาให้:

```bash
codex app-server --listen stdio://
```

วิธีนี้ทำให้เวอร์ชัน app-server ผูกกับ Plugin `codex` ที่รวมมาให้ แทนที่จะเป็น
Codex CLI แยกต่างหากตัวใดก็ตามที่บังเอิญติดตั้งอยู่ในเครื่อง ตั้งค่า
`appServer.command` เฉพาะเมื่อคุณตั้งใจต้องการรัน executable อื่น

สำหรับ app-server ที่กำลังรันอยู่แล้ว ให้ใช้การขนส่ง WebSocket:

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

| ฟิลด์                                        | ค่าเริ่มต้น                                           | ความหมาย                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` จะ spawn Codex; `"websocket"` จะเชื่อมต่อกับ `url`                                                                                                                                                                                                                                                                                                                                        |
| `command`                                     | ไบนารี Codex ที่จัดการให้                            | ไฟล์ปฏิบัติการสำหรับ stdio transport ปล่อยว่างไว้เพื่อใช้ไบนารีที่จัดการให้                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | อาร์กิวเมนต์สำหรับ stdio transport                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | ไม่ได้ตั้งค่า                                         | URL ของ WebSocket app-server                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | ไม่ได้ตั้งค่า                                         | Bearer token สำหรับ WebSocket transport รับได้ทั้งสตริงโดยตรงหรือ SecretInput เช่น `${CODEX_APP_SERVER_TOKEN}`                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | ส่วนหัว WebSocket เพิ่มเติม ค่าส่วนหัวยอมรับสตริงโดยตรงหรือค่า SecretInput เช่น `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | ชื่อตัวแปรสภาพแวดล้อมเพิ่มเติมที่จะถูกลบออกจากโปรเซส stdio app-server ที่ spawn หลังจาก OpenClaw สร้างสภาพแวดล้อมที่สืบทอดมาแล้ว                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | ไม่ได้ตั้งค่า                                         | รูท workspace ของ Codex app-server ระยะไกล เมื่อตั้งค่าแล้ว OpenClaw จะอนุมานรูท workspace ในเครื่องจาก workspace ของ OpenClaw ที่ resolve แล้ว รักษาส่วนต่อท้าย cwd ปัจจุบันภายใต้รูทระยะไกลนี้ และส่งเฉพาะ cwd สุดท้ายของ app-server ไปยัง Codex หาก cwd อยู่นอกรูท workspace ของ OpenClaw ที่ resolve แล้ว OpenClaw จะปฏิเสธแบบ fail-closed แทนการส่งพาธในเครื่องของ Gateway ไปยัง app-server ระยะไกล |
| `requestTimeoutMs`                            | `60000`                                                | ระยะหมดเวลาสำหรับการเรียก control-plane ของ app-server                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | ช่วงเวลาเงียบหลังจาก Codex ยอมรับ turn หรือหลังจากคำขอ app-server ในขอบเขต turn ขณะที่ OpenClaw รอ `turn/completed`                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | ตัวคุม completion-idle และความคืบหน้าที่ใช้หลังจากการส่งต่อเครื่องมือ การเสร็จสิ้นของเครื่องมือ native ความคืบหน้าของ assistant แบบ raw หลังเครื่องมือ การเสร็จสิ้นของ reasoning แบบ raw หรือความคืบหน้า reasoning ขณะที่ OpenClaw รอ `turn/completed` ใช้ค่านี้สำหรับ workload ที่เชื่อถือได้หรือหนัก ซึ่งการสังเคราะห์หลังเครื่องมือสามารถเงียบได้นานกว่างบเวลาการปล่อย assistant สุดท้ายอย่างสมเหตุสมผล                                |
| `mode`                                        | `"yolo"` เว้นแต่ข้อกำหนด Codex ในเครื่องจะไม่อนุญาต YOLO | preset สำหรับการทำงานแบบ YOLO หรือแบบที่ guardian ตรวจทาน                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` หรือนโยบายการอนุมัติของ guardian ที่อนุญาต       | นโยบายการอนุมัติ native ของ Codex ที่ส่งไปยังการเริ่ม thread, resume และ turn                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` หรือ sandbox ของ guardian ที่อนุญาต  | โหมด sandbox native ของ Codex ที่ส่งไปยังการเริ่ม thread และ resume sandbox ของ OpenClaw ที่ใช้งานอยู่จะจำกัด turn แบบ `danger-full-access` ให้เป็น Codex `workspace-write`; แฟล็กเครือข่ายของ turn จะเป็นไปตาม egress ของ sandbox OpenClaw                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` หรือ reviewer ของ guardian ที่อนุญาต               | ใช้ `"auto_review"` เพื่อให้ Codex ตรวจทาน prompt การอนุมัติ native เมื่ออนุญาต                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | ไดเรกทอรีของโปรเซสปัจจุบัน                              | workspace ที่ `/codex bind` ใช้เมื่อไม่ได้ระบุ `--cwd`                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | ไม่ได้ตั้งค่า                                         | service tier ของ Codex app-server แบบไม่บังคับ `"priority"` เปิดใช้งานการกำหนดเส้นทาง fast-mode, `"flex"` ขอการประมวลผลแบบ flex และ `null` ล้างการ override ค่า legacy `"fast"` จะถูกรับเป็น `"priority"`                                                                                                                                                                                                 |
| `networkProxy`                                | ปิดใช้งาน                                             | เลือกใช้ networking แบบ permissions-profile ของ Codex สำหรับคำสั่ง app-server OpenClaw จะกำหนดค่า config `permissions.<profile>.network` ที่เลือกและเลือกค่านั้นด้วย `default_permissions` แทนการส่ง `sandbox`                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | opt-in แบบพรีวิวที่ลงทะเบียนสภาพแวดล้อม Codex ที่มี sandbox ของ OpenClaw รองรับกับ Codex app-server 0.132.0 หรือใหม่กว่า เพื่อให้การทำงาน native ของ Codex สามารถรันภายใน sandbox ของ OpenClaw ที่ใช้งานอยู่ได้                                                                                                                                                                                                         |

`appServer.networkProxy` เป็นค่าแบบชัดเจนเพราะเปลี่ยนสัญญา sandbox ของ Codex
เมื่อเปิดใช้งาน OpenClaw จะตั้งค่า `features.network_proxy.enabled` และ
`default_permissions` ใน config ของ thread Codex ด้วย เพื่อให้ permission
profile ที่สร้างขึ้นสามารถเริ่ม networking ที่ Codex จัดการให้ได้ โดยค่าเริ่มต้น OpenClaw จะสร้าง
ชื่อ profile `openclaw-network-<fingerprint>` ที่ทนต่อการชนกันจากเนื้อหา
profile; ใช้ `profileName` เฉพาะเมื่อต้องการชื่อในเครื่องที่เสถียรเท่านั้น

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

หาก runtime ปกติของ app-server จะเป็น `danger-full-access` การเปิดใช้งาน
`networkProxy` จะใช้การเข้าถึงระบบไฟล์แบบ workspace สำหรับ permission
profile ที่สร้างขึ้น การบังคับใช้เครือข่ายที่ Codex จัดการให้เป็น networking ที่อยู่ใน sandbox
ดังนั้น profile แบบ full-access จะไม่ป้องกันทราฟฟิกขาออก

Plugin จะบล็อก app-server handshake ที่เก่ากว่าหรือไม่มีเวอร์ชัน Codex app-server
ต้องรายงานเวอร์ชัน stable `0.125.0` หรือใหม่กว่า

OpenClaw ถือว่า URL เซิร์ฟเวอร์แอป WebSocket ที่ไม่ใช่ loopback เป็นรีโมต และต้องมี
การยืนยันตัวตน WebSocket ที่ระบุตัวตนผ่าน `appServer.authToken` หรือ
ส่วนหัว `Authorization` `appServer.authToken` และค่า `appServer.headers.*`
แต่ละค่าจะเป็น SecretInput ได้ รันไทม์ secrets จะแปลง SecretRefs และ env
แบบย่อก่อนที่ OpenClaw จะสร้างตัวเลือกการเริ่มเซิร์ฟเวอร์แอป และ SecretRefs
แบบมีโครงสร้างที่แปลงไม่ได้จะล้มเหลวก่อนส่ง token หรือ header ใดๆ เมื่อกำหนดค่า
Plugin ดั้งเดิมของ Codex ไว้ OpenClaw จะใช้ control plane ของ Plugin
จากเซิร์ฟเวอร์แอปที่เชื่อมต่อเพื่อติดตั้งหรือรีเฟรช Plugin เหล่านั้น แล้วรีเฟรชคลังแอปเพื่อให้
แอปที่ Plugin เป็นเจ้าของมองเห็นได้ในเธรด Codex `app/list` ยังคงเป็น
แหล่งข้อมูลคลังและ metadata ที่มีอำนาจตัดสิน แต่ policy ของ OpenClaw จะตัดสินว่า
`thread/start` จะส่ง `config.apps[appId].enabled = true` สำหรับแอปที่เข้าถึงได้
และอยู่ในรายการหรือไม่ แม้ Codex จะทำเครื่องหมายว่าปิดใช้งานอยู่ในขณะนั้นก็ตาม app id
ที่ไม่รู้จักหรือขาดหายยังคงล้มเหลวแบบปิด เส้นทางนี้จะเปิดใช้งาน Plugin จาก marketplace
ผ่าน `plugin/install` และรีเฟรชคลังเท่านั้น เชื่อมต่อ OpenClaw กับเซิร์ฟเวอร์แอปรีโมต
ที่เชื่อถือให้รับการติดตั้ง Plugin ที่ OpenClaw จัดการและการรีเฟรชคลังแอปเท่านั้น

## โหมดการอนุมัติและ sandbox

เซสชันเซิร์ฟเวอร์แอป stdio ภายในเครื่องมีค่าเริ่มต้นเป็นโหมด YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` และ
`sandbox: "danger-full-access"` ท่าทีสำหรับผู้ปฏิบัติงานภายในเครื่องที่เชื่อถือได้นี้ทำให้
เทิร์นและ Heartbeat ของ OpenClaw แบบไม่มีผู้ดูแลคืบหน้าได้โดยไม่มี prompt
การอนุมัติดั้งเดิมที่ไม่มีใครอยู่ตอบ

หากไฟล์ข้อกำหนดระบบภายในเครื่องของ Codex ไม่อนุญาตค่าอนุมัติแบบ YOLO โดยปริยาย
ค่า reviewer หรือค่า sandbox OpenClaw จะถือค่าเริ่มต้นโดยปริยายนั้นเป็น guardian
แทน และเลือกสิทธิ์ guardian ที่อนุญาต `tools.exec.mode: "auto"`
ยังบังคับใช้การอนุมัติ Codex ที่ guardian ตรวจทาน และไม่คง override แบบ legacy
ที่ไม่ปลอดภัยอย่าง `approvalPolicy: "never"` หรือ `sandbox: "danger-full-access"`;
ตั้ง `tools.exec.mode: "full"` สำหรับท่าทีแบบไม่มีการอนุมัติโดยตั้งใจ รายการ
`[[remote_sandbox_config]]` ที่ตรงกับ hostname ในไฟล์ข้อกำหนดเดียวกันจะถูกใช้
สำหรับการตัดสินค่าเริ่มต้นของ sandbox

ตั้ง `appServer.mode: "guardian"` สำหรับการอนุมัติ Codex ที่ guardian ตรวจทาน:

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
ได้รับอนุญาต field policy แต่ละรายการจะ override `mode` ค่า reviewer รุ่นเก่า
`guardian_subagent` ยังยอมรับเป็น alias เพื่อความเข้ากันได้ แต่ config ใหม่ควรใช้
`auto_review`

เมื่อ sandbox ของ OpenClaw ทำงานอยู่ กระบวนการเซิร์ฟเวอร์แอป Codex ภายในเครื่องยังคง
ทำงานบนโฮสต์ Gateway ดังนั้น OpenClaw จะปิดใช้งานโหมดโค้ดดั้งเดิมของ Codex,
เซิร์ฟเวอร์ MCP ของผู้ใช้ และการเรียกใช้ Plugin ที่มีแอปหนุนหลังสำหรับเทิร์นนั้น แทนที่จะ
ถือว่า sandboxing ฝั่งโฮสต์ของ Codex เทียบเท่ากับ backend sandbox ของ OpenClaw
การเข้าถึง shell จะถูกเปิดเผยผ่านเครื่องมือไดนามิกที่มี sandbox ของ OpenClaw หนุนหลัง
เช่น `sandbox_exec` และ `sandbox_process` เมื่อเครื่องมือ exec/process ปกติพร้อมใช้งาน

บนโฮสต์ Ubuntu/AppArmor, bwrap ของ Codex อาจล้มเหลวภายใต้ `workspace-write` ก่อน
คำสั่ง shell จะเริ่ม เมื่อคุณตั้งใจรัน `workspace-write` ดั้งเดิมของ Codex โดยไม่มี
sandboxing ของ OpenClaw ที่ทำงานอยู่ หากคุณเห็น
`bwrap: setting up uid map: Permission denied` หรือ
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` ให้รัน
`openclaw doctor` และแก้ไข policy namespace ของโฮสต์ที่รายงานสำหรับผู้ใช้บริการ
OpenClaw แทนการให้สิทธิ์คอนเทนเนอร์ Docker ที่กว้างกว่า ควรใช้โปรไฟล์ AppArmor
แบบจำกัดขอบเขตสำหรับกระบวนการบริการ fallback
`kernel.apparmor_restrict_unprivileged_userns=0` มีผลทั้งโฮสต์และมีข้อแลกเปลี่ยนด้านความปลอดภัย

## การเรียกใช้ดั้งเดิมภายใต้ sandbox

ค่าเริ่มต้นที่เสถียรคือล้มเหลวแบบปิด: sandboxing ของ OpenClaw ที่ทำงานอยู่จะปิดใช้งาน
พื้นผิวการเรียกใช้ดั้งเดิมของ Codex ที่มิฉะนั้นจะรันจากโฮสต์เซิร์ฟเวอร์แอป Codex
ใช้ `appServer.experimental.sandboxExecServer: true` เฉพาะเมื่อคุณต้องการลอง
การรองรับสภาพแวดล้อมรีโมตของ Codex กับ backend sandbox ของ OpenClaw เส้นทางพรีวิวนี้
ต้องใช้เซิร์ฟเวอร์แอป Codex 0.132.0 หรือใหม่กว่า

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

เมื่อเปิด flag และเซสชัน OpenClaw ปัจจุบันอยู่ใน sandbox, OpenClaw จะเริ่ม
exec-server แบบ local loopback ที่มี sandbox ที่ทำงานอยู่หนุนหลัง ลงทะเบียนกับ
เซิร์ฟเวอร์แอป Codex และเริ่มเธรดและเทิร์น Codex ด้วยสภาพแวดล้อมที่ OpenClaw
เป็นเจ้าของนั้น หากเซิร์ฟเวอร์แอปลงทะเบียนสภาพแวดล้อมไม่ได้ การรันจะล้มเหลวแบบปิดแทน
การ fallback ไปยังการเรียกใช้บนโฮสต์แบบเงียบๆ

เส้นทางพรีวิวนี้ใช้ได้เฉพาะภายในเครื่อง เซิร์ฟเวอร์แอป WebSocket รีโมตเข้าถึง
exec-server แบบ loopback ไม่ได้ เว้นแต่จะรันอยู่บนโฮสต์เดียวกัน ดังนั้น OpenClaw
จะปฏิเสธการผสมผสานนั้น

## การยืนยันตัวตนและการแยกสภาพแวดล้อม

การยืนยันตัวตนถูกเลือกตามลำดับนี้:

1. โปรไฟล์การยืนยันตัวตน OpenClaw Codex ที่ระบุชัดเจนสำหรับ agent
2. บัญชีที่มีอยู่ของเซิร์ฟเวอร์แอปใน Codex home ของ agent นั้น
3. สำหรับการเปิดเซิร์ฟเวอร์แอป stdio ภายในเครื่องเท่านั้น `CODEX_API_KEY` แล้วตามด้วย
   `OPENAI_API_KEY` เมื่อไม่มีบัญชีเซิร์ฟเวอร์แอปและยังต้องใช้การยืนยันตัวตน OpenAI

เมื่อ OpenClaw เห็นโปรไฟล์การยืนยันตัวตน Codex แบบการสมัครสมาชิก ChatGPT ระบบจะลบ
`CODEX_API_KEY` และ `OPENAI_API_KEY` ออกจากกระบวนการลูก Codex ที่ spawn ขึ้นมา
สิ่งนี้ทำให้ API key ระดับ Gateway ยังคงพร้อมใช้สำหรับ embeddings หรือโมเดล OpenAI
โดยตรง โดยไม่ทำให้เทิร์นเซิร์ฟเวอร์แอป Codex ดั้งเดิมถูกคิดค่าใช้จ่ายผ่าน API โดยไม่ตั้งใจ

โปรไฟล์ API-key ของ Codex ที่ระบุชัดเจนและ fallback env-key ของ stdio ภายในเครื่องใช้
การเข้าสู่ระบบเซิร์ฟเวอร์แอปแทน env ที่สืบทอดจากกระบวนการลูก การเชื่อมต่อเซิร์ฟเวอร์แอป
WebSocket จะไม่ได้รับ fallback API-key จาก env ของ Gateway; ใช้โปรไฟล์การยืนยันตัวตน
ที่ระบุชัดเจนหรือบัญชีของเซิร์ฟเวอร์แอปรีโมตเอง

การเปิดเซิร์ฟเวอร์แอป stdio จะสืบทอดสภาพแวดล้อมกระบวนการของ OpenClaw ตามค่าเริ่มต้น
OpenClaw เป็นเจ้าของสะพานบัญชีเซิร์ฟเวอร์แอป Codex และตั้ง `CODEX_HOME` เป็นไดเรกทอรี
ต่อ agent ภายใต้ state ของ OpenClaw ของ agent นั้น สิ่งนี้ทำให้ config, บัญชี,
cache/data ของ Plugin และ state ของเธรด Codex อยู่ในขอบเขตของ agent OpenClaw
แทนการรั่วไหลเข้ามาจาก home `~/.codex` ส่วนตัวของผู้ปฏิบัติงาน

OpenClaw ไม่เขียน `HOME` ใหม่สำหรับการเปิดเซิร์ฟเวอร์แอปภายในเครื่องตามปกติ กระบวนการย่อย
ที่ Codex รัน เช่น `openclaw`, `gh`, `git`, CLI ของคลาวด์ และคำสั่ง shell จะเห็น
process home ปกติและค้นหา config กับ token ใน user-home ได้ Codex ยังอาจค้นพบ
`$HOME/.agents/skills` และ `$HOME/.agents/plugins/marketplace.json`; การค้นพบ
`.agents` นั้นตั้งใจให้แชร์กับ home ของผู้ปฏิบัติงาน และแยกจาก state `~/.codex`
ที่แยกไว้

Plugin ของ OpenClaw และ snapshot ของ Skills ของ OpenClaw ยังคงไหลผ่าน registry
Plugin และตัวโหลด Skills ของ OpenClaw เอง asset ส่วนตัวใน Codex `~/.codex` ไม่เป็นเช่นนั้น
หากคุณมี Skills หรือ Plugin ของ Codex CLI ที่มีประโยชน์จาก Codex home ซึ่งควรกลายเป็น
ส่วนหนึ่งของ agent OpenClaw ให้ทำ inventory อย่างชัดเจน:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

หาก deployment ต้องการการแยกสภาพแวดล้อมเพิ่มเติม ให้เพิ่มตัวแปรเหล่านั้นใน
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

`appServer.clearEnv` มีผลเฉพาะกับกระบวนการลูกเซิร์ฟเวอร์แอป Codex ที่ spawn ขึ้นมา
OpenClaw จะลบ `CODEX_HOME` และ `HOME` ออกจากรายการนี้ระหว่างการปรับรูปแบบการเปิดภายในเครื่อง:
`CODEX_HOME` ยังคงเป็นแบบต่อ agent และ `HOME` ยังคงสืบทอดมาเพื่อให้กระบวนการย่อย
ใช้ state ใน user-home ปกติได้

## เครื่องมือไดนามิก

เครื่องมือไดนามิกของ Codex มีค่าเริ่มต้นเป็นการโหลดแบบ `searchable` OpenClaw ไม่เปิดเผย
เครื่องมือไดนามิกที่ซ้ำกับการดำเนินการ workspace ดั้งเดิมของ Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

เครื่องมือ integration ของ OpenClaw ที่เหลือส่วนใหญ่ เช่น messaging, media, cron,
browser, nodes, gateway, `heartbeat_respond` และ `web_search` พร้อมใช้งานผ่าน
การค้นหาเครื่องมือของ Codex ภายใต้ namespace `openclaw` สิ่งนี้ช่วยให้ context
เริ่มต้นของโมเดลเล็กลง `sessions_yield` และการตอบกลับแหล่งที่มาสำหรับเครื่องมือข้อความเท่านั้น
ยังคงเป็นแบบ direct เพราะสิ่งเหล่านั้นเป็นสัญญาควบคุมเทิร์น `sessions_spawn` ยังคงเป็น
searchable เพื่อให้ `spawn_agent` ดั้งเดิมของ Codex ยังคงเป็นพื้นผิว subagent หลักของ
Codex ขณะที่การมอบหมายงาน OpenClaw หรือ ACP ที่ระบุชัดเจนยังคงพร้อมใช้งานผ่าน namespace
เครื่องมือไดนามิก `openclaw`

ตั้ง `codexDynamicToolsLoading: "direct"` เฉพาะเมื่อเชื่อมต่อกับเซิร์ฟเวอร์แอป Codex
แบบกำหนดเองที่ค้นหาเครื่องมือไดนามิกที่เลื่อนโหลดไม่ได้ หรือเมื่อ debug payload เครื่องมือแบบเต็ม

## Timeout

การเรียกเครื่องมือไดนามิกที่ OpenClaw เป็นเจ้าของถูกจำกัดแยกจาก
`appServer.requestTimeoutMs` คำขอ Codex `item/tool/call` แต่ละรายการใช้ timeout
ที่มีอยู่รายการแรกตามลำดับนี้:

- อาร์กิวเมนต์ `timeoutMs` ต่อการเรียกที่เป็นค่าบวก
- สำหรับ `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`
- สำหรับ `image_generate` ที่ไม่มี timeout ที่กำหนดค่าไว้ ค่าเริ่มต้นการสร้างภาพ 120 วินาที
- สำหรับเครื่องมือ `image` สำหรับการทำความเข้าใจสื่อ, `tools.media.image.timeoutSeconds`
  ที่แปลงเป็นมิลลิวินาที หรือค่าเริ่มต้นสื่อ 60 วินาที สำหรับการทำความเข้าใจภาพ
  สิ่งนี้มีผลกับคำขอเองและจะไม่ถูกลดด้วยงานเตรียมการก่อนหน้า
- ค่าเริ่มต้นเครื่องมือไดนามิก 90 วินาที

watchdog นี้เป็นงบประมาณ `item/tool/call` ไดนามิกชั้นนอก timeout ของคำขอเฉพาะ provider
ทำงานอยู่ภายในการเรียกนั้นและคง semantics timeout ของตัวเองไว้ งบประมาณเครื่องมือไดนามิก
ถูกจำกัดสูงสุดที่ 600000 ms เมื่อ timeout, OpenClaw จะยกเลิกสัญญาณเครื่องมือเมื่อรองรับ
และส่งคืนการตอบกลับเครื่องมือไดนามิกที่ล้มเหลวไปยัง Codex เพื่อให้เทิร์นดำเนินต่อได้แทนการปล่อย
ให้เซสชันค้างอยู่ใน `processing`

หลังจาก Codex รับเทิร์นแล้ว และหลังจาก OpenClaw ตอบกลับคำขอเซิร์ฟเวอร์แอปที่อยู่ในขอบเขตเทิร์น
harness คาดว่า Codex จะคืบหน้าในเทิร์นปัจจุบันและท้ายที่สุดจบเทิร์นดั้งเดิมด้วย
`turn/completed` หากเซิร์ฟเวอร์แอปเงียบไปนาน `appServer.turnCompletionIdleTimeoutMs`,
OpenClaw จะพยายาม interrupt เทิร์น Codex อย่างสุดความสามารถ บันทึก timeout เพื่อการวินิจฉัย
และปล่อย lane เซสชัน OpenClaw เพื่อไม่ให้ข้อความแชทถัดไปต้องรอคิวหลังเทิร์นดั้งเดิมที่ค้าง

การแจ้งเตือนส่วนใหญ่ที่ไม่ใช่สถานะปลายทางสำหรับเทิร์นเดียวกันจะปลด watchdog สั้นนั้น
เพราะ Codex ได้พิสูจน์แล้วว่าเทิร์นยังมีชีวิตอยู่ การส่งต่อเครื่องมือใช้ช่วงเวลาอนุญาตให้ว่างหลังใช้เครื่องมือที่ยาวกว่า: หลังจาก OpenClaw ส่งคืนการตอบสนอง `item/tool/call`, หลังจาก
รายการเครื่องมือเนทีฟเช่น `commandExecution` ทำงานเสร็จ, หลังจากการเสร็จสิ้นแบบ raw
`custom_tool_call_output`, และหลังจากความคืบหน้า raw ของผู้ช่วยหลังใช้เครื่องมือ,
การเสร็จสิ้นการให้เหตุผลแบบ raw, หรือความคืบหน้าการให้เหตุผล guard ใช้
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` เมื่อกำหนดค่าไว้ และ
ค่าเริ่มต้นเป็นห้านาทีในกรณีอื่น ช่วงเวลาอนุญาตหลังใช้เครื่องมือเดียวกันนั้นยังขยาย
progress watchdog สำหรับหน้าต่างสังเคราะห์แบบเงียบก่อนที่ Codex จะส่งเหตุการณ์
เทิร์นปัจจุบันถัดไปด้วย การเสร็จสิ้นการให้เหตุผล, การเสร็จสิ้น
`agentMessage` แบบ commentary, และความคืบหน้าการให้เหตุผลหรือผู้ช่วยแบบ raw ก่อนใช้เครื่องมือ
อาจตามด้วยการตอบกลับสุดท้ายอัตโนมัติ ดังนั้นจึงใช้ guard การตอบกลับหลังความคืบหน้า
แทนการปล่อยเลนเซสชันทันที เฉพาะรายการ `agentMessage` ที่เสร็จสิ้นแบบ
final/non-commentary และการเสร็จสิ้นของผู้ช่วยแบบ raw ก่อนใช้เครื่องมือเท่านั้นที่ติดอาวุธ
การปล่อยเอาต์พุตผู้ช่วย: หาก Codex เงียบไปโดยไม่มี `turn/completed` หลังจากนั้น
OpenClaw จะพยายามแบบ best-effort เพื่อขัดจังหวะเทิร์นเนทีฟและปล่อยเลนเซสชัน
ความล้มเหลวของ app-server แบบ stdio ที่เล่นซ้ำได้อย่างปลอดภัย รวมถึง
turn-completion idle timeout ที่ไม่มีหลักฐานของผู้ช่วย เครื่องมือ active-item หรือ
side effect จะถูกลองใหม่หนึ่งครั้งด้วยความพยายาม app-server ใหม่ timeout ที่ไม่ปลอดภัย
ยังคงปลดระวางไคลเอนต์ app-server ที่ค้างและปล่อยเลนเซสชัน OpenClaw และยังล้าง
การผูกเธรดเนทีฟที่ค้างแทนที่จะเล่นซ้ำโดยอัตโนมัติ timeout ของ completion-watch
แสดงข้อความ timeout เฉพาะของ Codex: กรณีที่เล่นซ้ำได้อย่างปลอดภัยจะบอกว่าการตอบสนองอาจไม่สมบูรณ์
ขณะที่กรณีที่ไม่ปลอดภัยจะบอกให้ผู้ใช้ตรวจสอบสถานะปัจจุบันก่อนลองใหม่ การวินิจฉัย
timeout แบบสาธารณะมีฟิลด์โครงสร้าง เช่น เมธอดการแจ้งเตือน app-server ล่าสุด,
id/type/role ของรายการการตอบสนองผู้ช่วยแบบ raw, จำนวนคำขอ/รายการที่ใช้งานอยู่,
และสถานะ watch ที่ติดอาวุธ เมื่อการแจ้งเตือนล่าสุดเป็นรายการการตอบสนองผู้ช่วยแบบ raw
จะมีตัวอย่างข้อความผู้ช่วยแบบจำกัดขอบเขตด้วย แต่จะไม่มี prompt แบบ raw หรือ
เนื้อหาเครื่องมือ

## การค้นพบโมเดล

ตามค่าเริ่มต้น Plugin Codex จะถาม app-server สำหรับโมเดลที่พร้อมใช้งาน
ความพร้อมใช้งานของโมเดลอยู่ภายใต้ Codex app-server ดังนั้นรายการอาจเปลี่ยนเมื่อ OpenClaw
อัปเกรดเวอร์ชัน `@openai/codex` ที่บันเดิลมา หรือเมื่อการดีพลอยชี้
`appServer.command` ไปยังไบนารี Codex อื่น ความพร้อมใช้งานอาจจำกัดตามบัญชีด้วย
ใช้ `/codex models` บน Gateway ที่กำลังทำงานเพื่อดูแคตตาล็อกสดสำหรับ harness และบัญชีนั้น

หากการค้นพบล้มเหลวหรือหมดเวลา OpenClaw จะใช้แคตตาล็อก fallback ที่บันเดิลมาสำหรับ:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

harness ที่บันเดิลมาปัจจุบันคือ `@openai/codex` `0.139.0` การ probe `model/list`
กับ app-server ที่บันเดิลมานั้นส่งคืน:

| Model id        | ค่าเริ่มต้น | ซ่อน | รูปแบบอินพุต | Reasoning efforts        |
| --------------- | ------- | ------ | ---------------- | ------------------------ |
| `gpt-5.5`       | ใช่     | ไม่ใช่     | text, image      | low, medium, high, xhigh |
| `gpt-5.4`       | ไม่ใช่      | ไม่ใช่     | text, image      | low, medium, high, xhigh |
| `gpt-5.4-mini`  | ไม่ใช่      | ไม่ใช่     | text, image      | low, medium, high, xhigh |
| `gpt-5.3-codex` | ไม่ใช่      | ไม่ใช่     | text, image      | low, medium, high, xhigh |
| `gpt-5.2`       | ไม่ใช่      | ไม่ใช่     | text, image      | low, medium, high, xhigh |

โมเดลที่ซ่อนอยู่สามารถถูกส่งคืนโดยแคตตาล็อก app-server สำหรับโฟลว์ภายในหรือ
โฟลว์เฉพาะทาง แต่ไม่ใช่ตัวเลือกปกติในตัวเลือกโมเดล

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

ปิดใช้การค้นพบเมื่อคุณต้องการให้การเริ่มต้นหลีกเลี่ยงการ probe Codex และใช้เฉพาะ
แคตตาล็อก fallback:

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

## ไฟล์บูตสแตรปเวิร์กสเปซ

Codex จัดการ `AGENTS.md` เองผ่านการค้นพบ project-doc เนทีฟ OpenClaw
ไม่เขียนไฟล์ project-doc ของ Codex แบบสังเคราะห์หรือพึ่งพาชื่อไฟล์ fallback ของ Codex
สำหรับไฟล์ persona เพราะ fallback ของ Codex ใช้เฉพาะเมื่อไม่มี `AGENTS.md`

เพื่อความเทียบเท่าในเวิร์กสเปซ OpenClaw, Codex harness จะแก้ไขไฟล์บูตสแตรปอื่น
`SOUL.md`, `IDENTITY.md`, `TOOLS.md`, และ `USER.md` จะถูกส่งต่อเป็น
คำสั่งผู้พัฒนา OpenClaw Codex เพราะไฟล์เหล่านี้กำหนด agent ที่ใช้งานอยู่,
แนวทางเวิร์กสเปซที่พร้อมใช้, และโปรไฟล์ผู้ใช้ รายการ OpenClaw Skills แบบกระชับ
จะถูกส่งต่อเป็นคำสั่งผู้พัฒนาการทำงานร่วมกันที่มีขอบเขตตามเทิร์น
เนื้อหา `HEARTBEAT.md` จะไม่ถูกฉีดเข้าไป; เทิร์น heartbeat จะได้รับตัวชี้ในโหมดการทำงานร่วมกัน
ให้อ่านไฟล์เมื่อไฟล์มีอยู่และไม่ว่าง เนื้อหา `MEMORY.md` จากเวิร์กสเปซ agent ที่กำหนดค่าไว้
จะไม่ถูกวางลงในอินพุตเทิร์น Codex เนทีฟเมื่อเครื่องมือ memory พร้อมใช้งานสำหรับเวิร์กสเปซนั้น;
เมื่อมีไฟล์อยู่ harness จะเพิ่มตัวชี้ workspace-memory ขนาดเล็กลงในคำสั่งผู้พัฒนา
การทำงานร่วมกันที่มีขอบเขตตามเทิร์น และ Codex ควรใช้ `memory_search` หรือ `memory_get`
เมื่อหน่วยความจำถาวรเกี่ยวข้อง หากเครื่องมือถูกปิดใช้, การค้นหา memory ไม่พร้อมใช้งาน,
หรือเวิร์กสเปซที่ใช้งานอยู่ต่างจากเวิร์กสเปซ memory ของ agent, `MEMORY.md` จะใช้
เส้นทาง turn-context แบบจำกัดขอบเขตตามปกติ
เมื่อมี `BOOTSTRAP.md` จะถูกส่งต่อเป็นบริบทอ้างอิงอินพุตเทิร์นของ OpenClaw

## การแทนที่สภาพแวดล้อม

การแทนที่สภาพแวดล้อมยังคงพร้อมใช้งานสำหรับการทดสอบในเครื่อง:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` ข้ามไบนารีที่จัดการเมื่อ
ไม่ได้ตั้งค่า `appServer.command`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกลบออกแล้ว ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือ
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบในเครื่องแบบครั้งเดียว ควรใช้ config
สำหรับการดีพลอยที่ทำซ้ำได้ เพราะช่วยให้พฤติกรรมของ Plugin อยู่ในไฟล์ที่ผ่านการตรวจทานเดียวกัน
กับการตั้งค่า Codex harness ส่วนที่เหลือ

## ที่เกี่ยวข้อง

- [Codex harness](/th/plugins/codex-harness)
- [Codex harness runtime](/th/plugins/codex-harness-runtime)
- [Native Codex plugins](/th/plugins/codex-native-plugins)
- [Codex Computer Use](/th/plugins/codex-computer-use)
- [ผู้ให้บริการ OpenAI](/th/providers/openai)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
