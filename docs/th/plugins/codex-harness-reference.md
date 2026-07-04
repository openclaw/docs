---
read_when:
    - คุณต้องใช้ฟิลด์การกำหนดค่าทุกฟิลด์ของชุดเครื่องมือทดสอบ Codex
    - คุณกำลังเปลี่ยนพฤติกรรมการส่งข้อมูล การตรวจสอบสิทธิ์ การค้นพบ หรือการหมดเวลาของ app-server
    - คุณกำลังดีบักการเริ่มต้นฮาร์เนส Codex, การค้นหาโมเดล หรือการแยกสภาพแวดล้อม
summary: ข้อมูลอ้างอิงการกำหนดค่า การยืนยันตัวตน การค้นพบ และแอปเซิร์ฟเวอร์สำหรับฮาร์เนส Codex
title: คู่มืออ้างอิงฮาร์เนส Codex
x-i18n:
    generated_at: "2026-07-04T20:46:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1ffe2404dd35df36a706c098f99b841a9664baf76ee5d712836bb35d9ac78bc
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

ข้อมูลอ้างอิงนี้ครอบคลุมการกำหนดค่าโดยละเอียดสำหรับ Plugin `codex`
ที่รวมมาให้ สำหรับการตั้งค่าและการตัดสินใจเกี่ยวกับการกำหนดเส้นทาง ให้เริ่มที่
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
| `discovery`                | เปิดใช้งาน                  | การตั้งค่าการค้นพบโมเดลสำหรับ Codex app-server `model/list`                                                                               |
| `appServer`                | app-server แบบ stdio ที่จัดการให้ | การตั้งค่าการส่งผ่าน คำสั่ง การยืนยันตัวตน การอนุมัติ sandbox และระยะหมดเวลา                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | ใช้ `"direct"` เพื่อวางเครื่องมือไดนามิกของ OpenClaw ไว้ในบริบทเครื่องมือ Codex เริ่มต้นโดยตรง                                                  |
| `codexDynamicToolsExclude` | `[]`                     | ชื่อเครื่องมือไดนามิกของ OpenClaw เพิ่มเติมที่จะละเว้นจากรอบการทำงานของ Codex app-server                                                               |
| `codexPlugins`             | ปิดใช้งาน                 | การรองรับ Plugin/app แบบเนทีฟของ Codex สำหรับ Plugin คัดสรรที่ติดตั้งจากซอร์สและย้ายมาแล้ว ดู [Plugin เนทีฟของ Codex](/th/plugins/codex-native-plugins) |
| `computerUse`              | ปิดใช้งาน                 | การตั้งค่า Codex Computer Use ดู [Codex Computer Use](/th/plugins/codex-computer-use)                                                          |

## การส่งผ่าน app-server

โดยค่าเริ่มต้น OpenClaw จะเริ่มไบนารี Codex ที่จัดการให้ซึ่งมาพร้อมกับ Plugin
ที่รวมมาให้:

```bash
codex app-server --listen stdio://
```

วิธีนี้ทำให้เวอร์ชัน app-server ผูกอยู่กับ Plugin `codex` ที่รวมมาให้ แทนที่จะเป็น
Codex CLI แยกต่างหากตัวใดก็ตามที่ติดตั้งอยู่ในเครื่อง ตั้งค่า
`appServer.command` เฉพาะเมื่อคุณตั้งใจต้องการเรียกใช้ไฟล์ปฏิบัติการอื่น

สำหรับ app-server ที่กำลังทำงานอยู่แล้ว ให้ใช้การส่งผ่าน WebSocket:

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

| ฟิลด์                                         | ค่าเริ่มต้น                                                | ความหมาย                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` จะเปิด Codex; `"websocket"` จะเชื่อมต่อกับ `url`                                                                                                                                                                                                                                                                                                                                        |
| `homeScope`                                   | `"agent"`                                              | `"agent"` จะแยกสถานะ Codex ต่อเอเจนต์ OpenClaw แต่ละตัว `"user"` จะแชร์ `$CODEX_HOME` หรือ `~/.codex` แบบเนทีฟ ใช้การยืนยันตัวตนแบบเนทีฟ และเปิดใช้การจัดการเธรดเฉพาะเจ้าของ ขอบเขตผู้ใช้ต้องใช้ stdio                                                                                                                                                                                               |
| `command`                                     | ไบนารี Codex ที่จัดการให้                                   | ไฟล์ปฏิบัติการสำหรับการขนส่ง stdio ปล่อยไว้โดยไม่ตั้งค่าเพื่อใช้ไบนารีที่จัดการให้                                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | อาร์กิวเมนต์สำหรับการขนส่ง stdio                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | ไม่ได้ตั้งค่า                                                  | URL ของ WebSocket app-server                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | ไม่ได้ตั้งค่า                                                  | โทเค็น Bearer สำหรับการขนส่ง WebSocket รับสตริงตรงตัวหรือ SecretInput เช่น `${CODEX_APP_SERVER_TOKEN}`                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | ส่วนหัว WebSocket เพิ่มเติม ค่าส่วนหัวยอมรับสตริงตรงตัวหรือค่า SecretInput เช่น `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | ชื่อตัวแปรสภาพแวดล้อมเพิ่มเติมที่จะถูกลบออกจากโปรเซส stdio app-server ที่เปิดขึ้น หลังจาก OpenClaw สร้างสภาพแวดล้อมที่สืบทอดมาแล้ว                                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | ไม่ได้ตั้งค่า                                                  | รากเวิร์กสเปซของ Codex app-server ระยะไกล เมื่อตั้งค่าแล้ว OpenClaw จะอนุมานรากเวิร์กสเปซในเครื่องจากเวิร์กสเปซ OpenClaw ที่แก้ไขได้ รักษาส่วนต่อท้าย cwd ปัจจุบันไว้ใต้รากระยะไกลนี้ และส่งเฉพาะ cwd สุดท้ายของ app-server ไปยัง Codex หาก cwd อยู่นอกรากเวิร์กสเปซ OpenClaw ที่แก้ไขได้ OpenClaw จะปิดแบบปลอดภัยแทนที่จะส่งพาธภายใน Gateway ไปยัง app-server ระยะไกล |
| `requestTimeoutMs`                            | `60000`                                                | ระยะหมดเวลาสำหรับการเรียก control-plane ของ app-server                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | ช่วงเวลาที่เงียบหลังจาก Codex รับเทิร์น หรือหลังจากคำขอ app-server ที่จำกัดขอบเขตตามเทิร์น ขณะที่ OpenClaw รอ `turn/completed`                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | ตัวคุม completion-idle และความคืบหน้าที่ใช้หลังจากส่งต่อเครื่องมือ การทำงานของเครื่องมือเนทีฟเสร็จสมบูรณ์ ความคืบหน้าของผู้ช่วยดิบหลังใช้เครื่องมือ การให้เหตุผลดิบเสร็จสมบูรณ์ หรือความคืบหน้าของการให้เหตุผล ขณะที่ OpenClaw รอ `turn/completed` ใช้ค่านี้สำหรับเวิร์กโหลดที่เชื่อถือได้หรือหนัก ซึ่งการสังเคราะห์หลังใช้เครื่องมือสามารถเงียบได้นานกว่างบเวลาปล่อยคำตอบสุดท้ายของผู้ช่วยอย่างสมเหตุสมผล |
| `mode`                                        | `"yolo"` เว้นแต่ข้อกำหนด Codex ในเครื่องจะไม่อนุญาต YOLO | พรีเซ็ตสำหรับการดำเนินการแบบ YOLO หรือการดำเนินการที่ผู้พิทักษ์ตรวจสอบ                                                                                                                                                                                                                                                                                                                                                 |
| `approvalPolicy`                              | `"never"` หรือนโยบายการอนุมัติของผู้พิทักษ์ที่อนุญาต       | นโยบายการอนุมัติ Codex แบบเนทีฟที่ส่งไปเมื่อเริ่มเธรด กลับมาทำงานต่อ และส่งเทิร์น                                                                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` หรือแซนด์บ็อกซ์ของผู้พิทักษ์ที่อนุญาต  | โหมดแซนด์บ็อกซ์ Codex แบบเนทีฟที่ส่งไปเมื่อเริ่มเธรดและกลับมาทำงานต่อ แซนด์บ็อกซ์ OpenClaw ที่ใช้งานอยู่จะจำกัดเทิร์น `danger-full-access` ให้เป็น Codex `workspace-write`; แฟล็กเครือข่ายของเทิร์นจะตามการออกสู่เครือข่ายของแซนด์บ็อกซ์ OpenClaw                                                                                                                                                                                       |
| `approvalsReviewer`                           | `"user"` หรือผู้ตรวจสอบผู้พิทักษ์ที่อนุญาต               | ใช้ `"auto_review"` เพื่อให้ Codex ตรวจสอบพรอมป์การอนุมัติแบบเนทีฟเมื่อได้รับอนุญาต                                                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | ไดเรกทอรีของโปรเซสปัจจุบัน                              | เวิร์กสเปซที่ `/codex bind` ใช้เมื่อไม่ได้ระบุ `--cwd`                                                                                                                                                                                                                                                                                                                                        |
| `serviceTier`                                 | ไม่ได้ตั้งค่า                                                  | ระดับบริการ Codex app-server แบบไม่บังคับ `"priority"` เปิดใช้การกำหนดเส้นทางโหมดเร็ว, `"flex"` ขอการประมวลผลแบบ flex และ `null` ล้างการแทนที่ ค่าเดิม `"fast"` จะถูกรับเป็น `"priority"`                                                                                                                                                                                                 |
| `networkProxy`                                | ปิดใช้งาน                                               | เลือกใช้เครือข่ายตามโปรไฟล์สิทธิ์ของ Codex สำหรับคำสั่ง app-server OpenClaw จะกำหนดการตั้งค่า `permissions.<profile>.network` ที่เลือก และเลือกด้วย `default_permissions` แทนการส่ง `sandbox`                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | การเลือกใช้พรีวิวที่จะลงทะเบียนสภาพแวดล้อม Codex ที่มีแซนด์บ็อกซ์ OpenClaw รองรับกับ Codex app-server 0.132.0 หรือใหม่กว่า เพื่อให้การดำเนินการ Codex แบบเนทีฟทำงานภายในแซนด์บ็อกซ์ OpenClaw ที่ใช้งานอยู่ได้                                                                                                                                                                                                         |

`appServer.networkProxy` เป็นแบบชัดเจน เพราะเปลี่ยนสัญญาแซนด์บ็อกซ์ของ Codex
เมื่อเปิดใช้ OpenClaw จะตั้งค่า `features.network_proxy.enabled` และ
`default_permissions` ในการกำหนดค่าเธรด Codex ด้วย เพื่อให้โปรไฟล์สิทธิ์ที่สร้างขึ้น
สามารถเริ่มเครือข่ายที่ Codex จัดการได้ โดยค่าเริ่มต้น OpenClaw จะสร้างชื่อโปรไฟล์
`openclaw-network-<fingerprint>` ที่ทนต่อการชนกันจากเนื้อหาโปรไฟล์
ใช้ `profileName` เฉพาะเมื่อจำเป็นต้องมีชื่อในเครื่องที่เสถียรเท่านั้น

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

หากรันไทม์ app-server ปกติจะเป็น `danger-full-access` การเปิดใช้
`networkProxy` จะใช้การเข้าถึงระบบไฟล์แบบ workspace สำหรับโปรไฟล์สิทธิ์ที่สร้างขึ้น
การบังคับใช้เครือข่ายที่ Codex จัดการคือเครือข่ายแบบ sandbox
ดังนั้นโปรไฟล์ full-access จะไม่ป้องกันทราฟฟิกขาออก

Plugin จะบล็อกการ handshake ของ app-server ที่เก่ากว่าหรือไม่มีเวอร์ชัน Codex app-server
ต้องรายงานเวอร์ชันเสถียร `0.125.0` หรือใหม่กว่า

OpenClaw ถือว่า URL ของ WebSocket app-server ที่ไม่ใช่ loopback เป็นระยะไกล และกำหนดให้ใช้
การยืนยันตัวตน WebSocket ที่มีข้อมูลระบุตัวตนผ่าน `appServer.authToken` หรือ
header `Authorization` ค่า `appServer.authToken` และค่า `appServer.headers.*`
แต่ละค่าจะเป็น SecretInput ได้ รันไทม์ secrets จะแก้ SecretRefs และรูปย่อ env
ก่อนที่ OpenClaw จะสร้างตัวเลือกการเริ่มต้น app-server และ SecretRefs แบบมีโครงสร้าง
ที่แก้ไม่ได้จะล้มเหลวก่อนส่ง token หรือ header ใดๆ เมื่อกำหนดค่า Plugin Codex
แบบ native ไว้ OpenClaw จะใช้ control plane ของ Plugin ของ app-server ที่เชื่อมต่ออยู่
เพื่อติดตั้งหรือรีเฟรช Plugin เหล่านั้น แล้วรีเฟรช app inventory เพื่อให้แอปที่ Plugin
เป็นเจ้าของมองเห็นได้ในเธรด Codex `app/list` ยังคงเป็นแหล่ง inventory และ metadata
ที่มีอำนาจตัดสิน แต่ policy ของ OpenClaw จะตัดสินว่า `thread/start` จะส่ง
`config.apps[appId].enabled = true` สำหรับแอปที่ระบุและเข้าถึงได้หรือไม่
แม้ Codex จะทำเครื่องหมายว่าแอปนั้นปิดใช้อยู่ในขณะนั้นก็ตาม app id ที่ไม่รู้จักหรือขาดหาย
ยังคง fail-closed; เส้นทางนี้เปิดใช้เฉพาะ Plugin จาก marketplace ผ่าน `plugin/install`
และรีเฟรช inventory เท่านั้น เชื่อมต่อ OpenClaw กับ app-server ระยะไกลเฉพาะที่เชื่อถือได้ว่า
จะยอมรับการติดตั้ง Plugin ที่ OpenClaw จัดการและการรีเฟรช app inventory

## โหมดการอนุมัติและ sandbox

เซสชัน app-server แบบ stdio ในเครื่องมีค่าเริ่มต้นเป็นโหมด YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` และ
`sandbox: "danger-full-access"` ท่าทีของผู้ปฏิบัติงานในเครื่องที่เชื่อถือได้นี้ช่วยให้
turn และ Heartbeat ของ OpenClaw ที่ไม่มีผู้ดูแลดำเนินต่อได้โดยไม่ต้องมี prompt
การอนุมัติ native ที่ไม่มีใครอยู่ตอบ

หากไฟล์ข้อกำหนดระบบในเครื่องของ Codex ไม่อนุญาตค่าอนุมัติ YOLO, reviewer หรือ sandbox
แบบ implicit OpenClaw จะถือค่าเริ่มต้น implicit เป็น guardian แทน และเลือกสิทธิ์ guardian
ที่อนุญาต `tools.exec.mode: "auto"` ยังบังคับการอนุมัติ Codex ที่ตรวจทานโดย guardian
และไม่คง override legacy ที่ไม่ปลอดภัยอย่าง `approvalPolicy: "never"` หรือ
`sandbox: "danger-full-access"` ไว้ ตั้งค่า `tools.exec.mode: "full"` สำหรับท่าที
แบบไม่มีการอนุมัติโดยตั้งใจ รายการ
`[[remote_sandbox_config]]` ที่ตรงกับ hostname ในไฟล์ข้อกำหนดเดียวกันจะถูกเคารพ
สำหรับการตัดสินค่าเริ่มต้นของ sandbox

ตั้งค่า `appServer.mode: "guardian"` สำหรับการอนุมัติ Codex ที่ตรวจทานโดย guardian:

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
ได้รับอนุญาต ฟิลด์ policy รายรายการจะ override `mode` ค่า reviewer รุ่นเก่า
`guardian_subagent` ยังยอมรับเป็น alias เพื่อความเข้ากันได้ แต่ config ใหม่ควรใช้
`auto_review`

เมื่อ sandbox ของ OpenClaw ทำงานอยู่ โปรเซส Codex app-server ในเครื่องยังคงรันบนโฮสต์
Gateway ดังนั้น OpenClaw จึงปิด Code Mode native ของ Codex, เซิร์ฟเวอร์ MCP ของผู้ใช้
และการดำเนินการ Plugin ที่หนุนด้วยแอปสำหรับ turn นั้น แทนที่จะถือว่า sandboxing
ฝั่งโฮสต์ Codex เทียบเท่ากับ backend sandbox ของ OpenClaw การเข้าถึง shell
จะถูกเปิดผ่านเครื่องมือ dynamic ที่หนุนด้วย sandbox ของ OpenClaw เช่น `sandbox_exec`
และ `sandbox_process` เมื่อมีเครื่องมือ exec/process ปกติพร้อมใช้งาน

บนโฮสต์ Ubuntu/AppArmor Codex bwrap อาจล้มเหลวภายใต้ `workspace-write` ก่อนที่คำสั่ง shell
จะเริ่ม เมื่อคุณตั้งใจรัน `workspace-write` native ของ Codex โดยไม่มี sandboxing
ของ OpenClaw ที่ทำงานอยู่ หากคุณเห็น
`bwrap: setting up uid map: Permission denied` หรือ
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` ให้รัน
`openclaw doctor` และแก้ policy namespace ของโฮสต์ที่รายงานสำหรับผู้ใช้ service ของ OpenClaw
แทนการให้สิทธิ์ Docker container ที่กว้างขึ้น ควรใช้โปรไฟล์ AppArmor แบบจำกัดขอบเขต
สำหรับโปรเซส service; fallback `kernel.apparmor_restrict_unprivileged_userns=0`
มีผลทั้งโฮสต์และมีข้อแลกเปลี่ยนด้านความปลอดภัย

## การดำเนินการ native แบบ sandbox

ค่าเริ่มต้นเสถียรคือ fail-closed: sandboxing ของ OpenClaw ที่ทำงานอยู่จะปิดพื้นผิว
การดำเนินการ native ของ Codex ที่ไม่เช่นนั้นจะรันจากโฮสต์ Codex app-server ใช้
`appServer.experimental.sandboxExecServer: true` เฉพาะเมื่อคุณต้องการลองการรองรับ
สภาพแวดล้อมระยะไกลของ Codex กับ backend sandbox ของ OpenClaw เส้นทางพรีวิวนี้ต้องใช้
Codex app-server 0.132.0 หรือใหม่กว่า

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

เมื่อเปิด flag และเซสชัน OpenClaw ปัจจุบันเป็นแบบ sandboxed OpenClaw จะเริ่ม
local loopback exec-server ที่หนุนด้วย sandbox ที่ใช้งานอยู่ ลงทะเบียนกับ Codex app-server
และเริ่มเธรดและ turn ของ Codex ด้วยสภาพแวดล้อมที่ OpenClaw เป็นเจ้าของนั้น หาก app-server
ลงทะเบียนสภาพแวดล้อมไม่ได้ การรันจะ fail closed แทนที่จะ fallback ไปดำเนินการบนโฮสต์
อย่างเงียบๆ

เส้นทางพรีวิวนี้ใช้ได้เฉพาะในเครื่อง app-server WebSocket ระยะไกลจะเข้าถึง
loopback exec-server ไม่ได้ เว้นแต่ว่าจะรันอยู่บนโฮสต์เดียวกัน ดังนั้น OpenClaw
จะปฏิเสธชุดค่านี้

## การยืนยันตัวตนและการแยกสภาพแวดล้อม

ใน home ต่อเอเจนต์ค่าเริ่มต้น การยืนยันตัวตนจะถูกเลือกตามลำดับนี้:

1. โปรไฟล์การยืนยันตัวตน OpenClaw Codex ที่ระบุชัดเจนสำหรับเอเจนต์
2. บัญชีที่มีอยู่ของ app-server ใน Codex home ของเอเจนต์นั้น
3. สำหรับการเปิดใช้ app-server แบบ stdio ในเครื่องเท่านั้น `CODEX_API_KEY` แล้วตามด้วย
   `OPENAI_API_KEY` เมื่อไม่มีบัญชี app-server อยู่และยังต้องใช้การยืนยันตัวตน OpenAI

เมื่อ OpenClaw เห็นโปรไฟล์การยืนยันตัวตน Codex แบบ subscription-style ของ ChatGPT
มันจะลบ `CODEX_API_KEY` และ `OPENAI_API_KEY` ออกจากโปรเซสลูก Codex ที่ spawned
การทำเช่นนี้ทำให้คีย์ API ระดับ Gateway ยังคงพร้อมใช้สำหรับ embeddings หรือโมเดล OpenAI
โดยตรง โดยไม่ทำให้ turn ของ Codex app-server native ถูกคิดค่าใช้จ่ายผ่าน API โดยไม่ตั้งใจ

โปรไฟล์ Codex API-key ที่ระบุชัดเจนและ fallback env-key ของ stdio ในเครื่องใช้การ login
ของ app-server แทน env ของ child-process ที่สืบทอดมา การเชื่อมต่อ app-server แบบ WebSocket
จะไม่ได้รับ fallback คีย์ API จาก env ของ Gateway; ให้ใช้โปรไฟล์การยืนยันตัวตนที่ระบุชัดเจน
หรือบัญชีของ app-server ระยะไกลเอง

การเปิดใช้ app-server แบบ stdio จะสืบทอดสภาพแวดล้อมโปรเซสของ OpenClaw ตามค่าเริ่มต้น
OpenClaw เป็นเจ้าของสะพานบัญชี Codex app-server และตั้งค่า `CODEX_HOME` เป็นไดเรกทอรี
ต่อเอเจนต์ภายใต้ state ของ OpenClaw ของเอเจนต์นั้น การทำเช่นนี้ทำให้ config, บัญชี,
cache/data ของ Plugin และ state ของเธรดของ Codex ถูกจำกัดขอบเขตไว้กับเอเจนต์ OpenClaw
แทนที่จะรั่วเข้ามาจาก home `~/.codex` ส่วนตัวของผู้ปฏิบัติงาน

ตั้งค่า `appServer.homeScope: "user"` เพื่อแชร์ state native ของ Codex กับ Codex Desktop
และ CLI โหมด local-stdio-only นี้ใช้ `$CODEX_HOME` เมื่อถูกตั้งค่า และใช้ `~/.codex`
ในกรณีอื่น รวมถึงการยืนยันตัวตน native, config, Plugin และเธรด OpenClaw จะข้ามสะพาน
auth-profile ของตนสำหรับ app-server turn ของเจ้าของที่ตรวจสอบแล้วสามารถใช้ `codex_threads`
เพื่อแสดงรายการ ค้นหา อ่าน fork เปลี่ยนชื่อ archive และ restore เธรดเหล่านั้นได้
ให้ fork เธรดก่อนดำเนินการต่อใน OpenClaw; โปรเซส Codex อิสระจะไม่ประสานงาน writer
พร้อมกันสำหรับเธรดเดียวกัน

OpenClaw ไม่ rewrite `HOME` สำหรับการเปิดใช้ app-server ในเครื่องตามปกติ subprocess
ที่ Codex รัน เช่น `openclaw`, `gh`, `git`, CLI cloud และคำสั่ง shell จะเห็น process home
ปกติและสามารถหา config และ token ใน user-home ได้ Codex อาจค้นพบ `$HOME/.agents/skills`
และ `$HOME/.agents/plugins/marketplace.json` ด้วย การค้นพบ `.agents` นั้นแชร์กับ
operator home โดยตั้งใจ และแยกจาก state `~/.codex` ที่แยกไว้

ในขอบเขตเอเจนต์ค่าเริ่มต้น Plugin ของ OpenClaw และ snapshot Skills ของ OpenClaw
ยังคงไหลผ่าน registry ของ Plugin และ loader Skills ของ OpenClaw เอง; asset ส่วนตัวของ Codex
`~/.codex` จะไม่ไหลผ่าน หากคุณมี Skills หรือ Plugin ของ Codex CLI ที่มีประโยชน์จาก Codex home
ซึ่งควรกลายเป็นส่วนหนึ่งของเอเจนต์ OpenClaw ที่แยกไว้ ให้ inventory รายการเหล่านั้นอย่างชัดเจน:

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

`appServer.clearEnv` มีผลเฉพาะกับโปรเซสลูก Codex app-server ที่ spawned เท่านั้น
OpenClaw จะลบ `CODEX_HOME` และ `HOME` ออกจากรายการนี้ระหว่างการ normalize การเปิดใช้
ในเครื่อง: `CODEX_HOME` ยังคงชี้ไปยังขอบเขตเอเจนต์หรือผู้ใช้ที่เลือก และ `HOME`
ยังคงสืบทอดมาเพื่อให้ subprocess ใช้ state user-home ปกติได้

## เครื่องมือ dynamic

เครื่องมือ dynamic ของ Codex มีค่าเริ่มต้นเป็นการโหลดแบบ `searchable` OpenClaw ไม่เปิดเผย
เครื่องมือ dynamic ที่ซ้ำกับการดำเนินการ workspace แบบ native ของ Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

เครื่องมือ integration ส่วนใหญ่ที่เหลือของ OpenClaw เช่น messaging, media, Cron,
browser, nodes, Gateway, `heartbeat_respond` และ `web_search` พร้อมใช้งานผ่านการค้นหา
เครื่องมือของ Codex ภายใต้ namespace `openclaw` การทำเช่นนี้ทำให้บริบทโมเดลเริ่มต้นเล็กลง
`sessions_yield` และการตอบกลับ source แบบ message-tool-only ยังคงเป็น direct
เพราะสิ่งเหล่านั้นเป็นสัญญา turn-control `sessions_spawn` ยังคงเป็น searchable
เพื่อให้ `spawn_agent` native ของ Codex ยังคงเป็นพื้นผิว subagent หลักของ Codex
ขณะที่การมอบหมาย OpenClaw หรือ ACP อย่างชัดเจนยังคงพร้อมใช้งานผ่าน namespace
เครื่องมือ dynamic `openclaw`

ตั้งค่า `codexDynamicToolsLoading: "direct"` เฉพาะเมื่อเชื่อมต่อกับ Codex app-server
แบบกำหนดเองที่ค้นหาเครื่องมือ dynamic ที่เลื่อนไว้ไม่ได้ หรือเมื่อ debug payload
เครื่องมือแบบเต็ม

## Timeout

การเรียกเครื่องมือ dynamic ที่ OpenClaw เป็นเจ้าของถูกจำกัดเวลาแยกจาก
`appServer.requestTimeoutMs` คำขอ `item/tool/call` ของ Codex แต่ละรายการใช้ timeout
แรกที่พร้อมใช้งานตามลำดับนี้:

- อาร์กิวเมนต์ `timeoutMs` ต่อการเรียกที่เป็นค่าบวก
- สำหรับ `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`
- สำหรับ `image_generate` ที่ไม่มี timeout ที่กำหนดค่าไว้ ค่าเริ่มต้นการสร้างภาพ 120 วินาที
- สำหรับเครื่องมือ `image` เพื่อทำความเข้าใจสื่อ `tools.media.image.timeoutSeconds`
  ที่แปลงเป็นมิลลิวินาที หรือค่าเริ่มต้นสื่อ 60 วินาที สำหรับการทำความเข้าใจภาพ
  ค่านี้ใช้กับตัวคำขอเองและไม่ถูกลดด้วยงานเตรียมการก่อนหน้า
- ค่าเริ่มต้นเครื่องมือ dynamic 90 วินาที

watchdog นี้เป็นงบประมาณ `item/tool/call` dynamic ชั้นนอก timeout ของคำขอเฉพาะ provider
จะรันภายใน call นั้นและคง semantics timeout ของตนเอง งบประมาณเครื่องมือ dynamic
ถูกจำกัดที่ 600000 ms เมื่อ timeout OpenClaw จะ abort signal ของเครื่องมือเมื่อรองรับ
และส่งคืนการตอบสนอง dynamic-tool ที่ล้มเหลวให้ Codex เพื่อให้ turn ดำเนินต่อได้
แทนที่จะปล่อยให้เซสชันอยู่ใน `processing`

หลังจาก Codex ยอมรับ turn และหลังจาก OpenClaw ตอบกลับคำขอ app-server ที่มีขอบเขตเป็น turn
harness คาดว่า Codex จะดำเนินความคืบหน้าของ turn ปัจจุบันและสุดท้ายจบ turn native ด้วย
`turn/completed` หาก app-server เงียบไปเป็นเวลา `appServer.turnCompletionIdleTimeoutMs`
OpenClaw จะพยายาม interrupt turn ของ Codex แบบ best-effort บันทึก timeout เพื่อวินิจฉัย
และปล่อย session lane ของ OpenClaw เพื่อให้ข้อความ chat ถัดไปไม่ต้องเข้าคิวหลัง turn native
ที่ค้างอยู่

การแจ้งเตือนส่วนใหญ่ที่ไม่ใช่ปลายทางสำหรับเทิร์นเดียวกันจะปลดอาวุธ watchdog สั้นนั้น
เพราะ Codex ได้พิสูจน์แล้วว่าเทิร์นยังทำงานอยู่ การส่งต่องานให้เครื่องมือใช้
งบเวลาไม่ได้ใช้งานหลังเครื่องมือที่ยาวกว่า: หลังจาก OpenClaw ส่งคืนการตอบกลับ `item/tool/call`, หลังจาก
รายการเครื่องมือเนทีฟ เช่น `commandExecution` เสร็จสิ้น, หลังจากการเสร็จสิ้นของ
`custom_tool_call_output` แบบดิบ และหลังจากความคืบหน้าของผู้ช่วยแบบดิบหลังเครื่องมือ,
การเสร็จสิ้นของการให้เหตุผลแบบดิบ หรือความคืบหน้าของการให้เหตุผล guard ใช้
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` เมื่อกำหนดค่าไว้ และ
มีค่าเริ่มต้นเป็นห้านาทีในกรณีอื่น งบหลังเครื่องมือเดียวกันนี้ยังขยาย
progress watchdog สำหรับช่วงสังเคราะห์แบบเงียบก่อนที่ Codex จะปล่อยเหตุการณ์เทิร์นปัจจุบันถัดไป
การเสร็จสิ้นของการให้เหตุผล, การเสร็จสิ้นของ `agentMessage` แบบ commentary
และความคืบหน้าของการให้เหตุผลหรือผู้ช่วยแบบดิบก่อนเครื่องมือสามารถ
ตามด้วยคำตอบสุดท้ายอัตโนมัติได้ จึงใช้ guard การตอบกลับหลังความคืบหน้า
แทนที่จะปล่อยเลนเซสชันทันที เฉพาะรายการ `agentMessage` ที่เสร็จสมบูรณ์แบบ
final/non-commentary และการเสร็จสิ้นของผู้ช่วยแบบดิบก่อนเครื่องมือเท่านั้น
ที่ติดอาวุธการปล่อยเอาต์พุตผู้ช่วย: หาก Codex เงียบไปโดยไม่มี
`turn/completed` จากนั้น OpenClaw จะพยายามอย่างดีที่สุดเพื่อขัดจังหวะเทิร์นเนทีฟและปล่อย
เลนเซสชัน ความล้มเหลวของ app-server แบบ stdio ที่ replay-safe รวมถึง
การหมดเวลาไม่ได้ใช้งานของการเสร็จสิ้นเทิร์นโดยไม่มีหลักฐานของผู้ช่วย เครื่องมือ รายการที่ใช้งานอยู่ หรือ
ผลข้างเคียง จะถูกลองใหม่หนึ่งครั้งในการพยายาม app-server ใหม่ การหมดเวลาที่ไม่ปลอดภัย
ยังคงปลดระวางไคลเอนต์ app-server ที่ค้างอยู่และปล่อยเลนเซสชัน OpenClaw
นอกจากนี้ยังล้างการผูกเธรดเนทีฟที่เก่าแทนที่จะ replay โดยอัตโนมัติ
การหมดเวลาของ completion-watch แสดงข้อความหมดเวลาเฉพาะของ Codex:
กรณี replay-safe ระบุว่าการตอบกลับอาจไม่สมบูรณ์ ส่วนกรณีที่ไม่ปลอดภัย
บอกผู้ใช้ให้ตรวจสอบสถานะปัจจุบันก่อนลองใหม่ การวินิจฉัย timeout แบบสาธารณะ
รวมฟิลด์เชิงโครงสร้าง เช่น เมธอดการแจ้งเตือน app-server ล่าสุด,
id/type/role ของรายการการตอบกลับผู้ช่วยแบบดิบ, จำนวนคำขอ/รายการที่ใช้งานอยู่ และสถานะ watch ที่ติดอาวุธ
เมื่อการแจ้งเตือนล่าสุดเป็นรายการการตอบกลับผู้ช่วยแบบดิบ ก็จะ
รวมตัวอย่างข้อความผู้ช่วยแบบจำกัดขอบเขตด้วย แต่จะไม่รวมพรอมป์ดิบหรือ
เนื้อหาเครื่องมือ

## การค้นหาโมเดล

โดยค่าเริ่มต้น Plugin Codex จะถาม app-server เพื่อขอโมเดลที่พร้อมใช้งาน ความพร้อมใช้งานของโมเดล
เป็นความรับผิดชอบของ Codex app-server ดังนั้นรายการอาจเปลี่ยนเมื่อ OpenClaw
อัปเกรดเวอร์ชัน `@openai/codex` ที่รวมมา หรือเมื่อการปรับใช้ชี้
`appServer.command` ไปยังไบนารี Codex อื่น ความพร้อมใช้งานยังอาจ
ผูกกับบัญชีได้ด้วย ใช้ `/codex models` บน Gateway ที่กำลังทำงานเพื่อดูแค็ตตาล็อกสด
สำหรับ harness และบัญชีนั้น

หากการค้นหาล้มเหลวหรือหมดเวลา OpenClaw จะใช้แค็ตตาล็อกสำรองที่รวมมา สำหรับ:

- GPT-5.5
- GPT-5.4 mini

harness ที่รวมมาในปัจจุบันคือ `@openai/codex` `0.142.5` การ probe `model/list`
กับ app-server ที่รวมมานั้นส่งคืนแถวตัวเลือกสาธารณะเหล่านี้:

| รหัสโมเดล              | รูปแบบอินพุต | ระดับความพยายามในการให้เหตุผล        |
| --------------------- | ---------------- | ------------------------ |
| `gpt-5.5`             | ข้อความ, รูปภาพ      | low, medium, high, xhigh |
| `gpt-5.4`             | ข้อความ, รูปภาพ      | low, medium, high, xhigh |
| `gpt-5.4-mini`        | ข้อความ, รูปภาพ      | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | ข้อความ             | low, medium, high, xhigh |

โมเดลที่ซ่อนอยู่สามารถถูกส่งคืนโดยแค็ตตาล็อก app-server สำหรับโฟลว์ภายในหรือ
เฉพาะทาง แต่ไม่ใช่ตัวเลือกตัวเลือกโมเดลปกติ

ปรับแต่งการค้นหาภายใต้ `plugins.entries.codex.config.discovery`:

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

ปิดใช้งานการค้นหาเมื่อคุณต้องการให้การเริ่มต้นหลีกเลี่ยงการ probe Codex และใช้เฉพาะ
แค็ตตาล็อกสำรอง:

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

## ไฟล์ bootstrap ของ workspace

Codex จัดการ `AGENTS.md` เองผ่านการค้นหาเอกสารโปรเจกต์แบบเนทีฟ OpenClaw
ไม่เขียนไฟล์เอกสารโปรเจกต์ Codex สังเคราะห์หรือพึ่งพาชื่อไฟล์ fallback ของ Codex
สำหรับไฟล์ persona เพราะ fallback ของ Codex ใช้เฉพาะเมื่อ
ไม่มี `AGENTS.md`

เพื่อความเทียบเท่าของ workspace ใน OpenClaw, Codex harness จะ resolve ไฟล์ bootstrap
อื่นๆ `SOUL.md`, `IDENTITY.md`, `TOOLS.md` และ `USER.md` จะถูกส่งต่อเป็น
คำสั่งสำหรับนักพัฒนา OpenClaw Codex เพราะไฟล์เหล่านี้กำหนดเอเจนต์ที่ใช้งานอยู่,
คำแนะนำ workspace ที่มีอยู่ และโปรไฟล์ผู้ใช้ รายการ Skills ของ OpenClaw แบบกระชับ
จะถูกส่งต่อเป็นคำสั่งสำหรับนักพัฒนาเพื่อการทำงานร่วมกันในขอบเขตเทิร์น
เนื้อหา `HEARTBEAT.md` จะไม่ถูกแทรก; เทิร์น Heartbeat จะได้รับตัวชี้โหมดการทำงานร่วมกัน
ให้อ่านไฟล์เมื่อไฟล์มีอยู่และไม่ว่างเปล่า เนื้อหา `MEMORY.md`
จาก workspace ของเอเจนต์ที่กำหนดค่าไว้จะไม่ถูกวางลงในอินพุตเทิร์น Codex แบบเนทีฟ
เมื่อเครื่องมือหน่วยความจำพร้อมใช้งานสำหรับ workspace นั้น; เมื่อมีอยู่ harness
จะเพิ่มตัวชี้หน่วยความจำ workspace ขนาดเล็กลงในคำสั่งสำหรับนักพัฒนาเพื่อการทำงานร่วมกันในขอบเขตเทิร์น
และ Codex ควรใช้ `memory_search` หรือ `memory_get` เมื่อหน่วยความจำถาวร
เกี่ยวข้อง หากปิดใช้งานเครื่องมือ, การค้นหาหน่วยความจำไม่พร้อมใช้งาน หรือ
workspace ที่ใช้งานอยู่แตกต่างจาก workspace หน่วยความจำของเอเจนต์, `MEMORY.md` จะใช้
เส้นทางบริบทเทิร์นแบบจำกัดขอบเขตตามปกติ
`BOOTSTRAP.md` เมื่อมีอยู่ จะถูกส่งต่อเป็นบริบทอ้างอิงอินพุตเทิร์นของ OpenClaw

## การ override สภาพแวดล้อม

การ override สภาพแวดล้อมยังคงพร้อมใช้งานสำหรับการทดสอบภายในเครื่อง:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` ข้ามไบนารีที่จัดการเมื่อ
ไม่ได้ตั้งค่า `appServer.command`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกลบแล้ว ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือ
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบภายในเครื่องเฉพาะครั้ง ควรใช้ config
สำหรับการปรับใช้ที่ทำซ้ำได้ เพราะทำให้พฤติกรรมของ Plugin อยู่ในไฟล์ที่ตรวจทานเดียวกัน
กับการตั้งค่า Codex harness ส่วนที่เหลือ

## ที่เกี่ยวข้อง

- [Codex harness](/th/plugins/codex-harness)
- [รันไทม์ Codex harness](/th/plugins/codex-harness-runtime)
- [Plugin Codex เนทีฟ](/th/plugins/codex-native-plugins)
- [Codex Computer Use](/th/plugins/codex-computer-use)
- [ผู้ให้บริการ OpenAI](/th/providers/openai)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
