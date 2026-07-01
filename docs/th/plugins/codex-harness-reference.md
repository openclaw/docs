---
read_when:
    - คุณต้องมีฟิลด์การกำหนดค่าฮาร์เนส Codex ทุกฟิลด์
    - คุณกำลังเปลี่ยนแปลงลักษณะการทำงานของทรานสปอร์ต การยืนยันตัวตน การค้นพบ หรือการหมดเวลาของ app-server
    - คุณกำลังดีบักการเริ่มต้นฮาร์เนส Codex, การค้นหาโมเดล หรือการแยกสภาพแวดล้อม
summary: เอกสารอ้างอิงเกี่ยวกับการกำหนดค่า การยืนยันตัวตน การค้นพบ และเซิร์ฟเวอร์แอปสำหรับ Codex harness
title: ข้อมูลอ้างอิงฮาร์เนส Codex
x-i18n:
    generated_at: "2026-07-01T08:46:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02dd72f9d85d2ea5fa45533a402d640786f17bdbe2242b7c1b8cd99405561a25
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

ข้อมูลอ้างอิงนี้ครอบคลุมการกำหนดค่าโดยละเอียดสำหรับ Plugin `codex`
ที่มาพร้อมชุด สำหรับการตั้งค่าและการตัดสินใจด้านการกำหนดเส้นทาง ให้เริ่มจาก
[Codex harness](/th/plugins/codex-harness)

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
| `appServer`                | app-server แบบ stdio ที่จัดการให้ | การตั้งค่าการขนส่ง คำสั่ง การตรวจสอบสิทธิ์ การอนุมัติ sandbox และ timeout                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | ใช้ `"direct"` เพื่อใส่เครื่องมือแบบไดนามิกของ OpenClaw ลงในบริบทเครื่องมือ Codex เริ่มต้นโดยตรง                                                  |
| `codexDynamicToolsExclude` | `[]`                     | ชื่อเครื่องมือแบบไดนามิกของ OpenClaw เพิ่มเติมที่จะละเว้นจากรอบ Codex app-server                                                               |
| `codexPlugins`             | ปิดใช้งาน                 | การรองรับ Plugin/แอป Codex แบบเนทีฟสำหรับ Plugin คัดสรรที่ติดตั้งจากซอร์สซึ่งย้ายแล้ว ดู [Plugin Codex แบบเนทีฟ](/th/plugins/codex-native-plugins) |
| `computerUse`              | ปิดใช้งาน                 | การตั้งค่า Codex Computer Use ดู [Codex Computer Use](/th/plugins/codex-computer-use)                                                          |

## การขนส่ง app-server

ตามค่าเริ่มต้น OpenClaw จะเริ่มไบนารี Codex ที่จัดการให้ซึ่งมาพร้อมกับ
Plugin ที่รวมมา:

```bash
codex app-server --listen stdio://
```

วิธีนี้ทำให้เวอร์ชัน app-server ผูกกับ Plugin `codex` ที่มาพร้อมชุด แทนที่จะเป็น
Codex CLI แยกต่างหากตัวใดก็ตามที่บังเอิญติดตั้งอยู่ในเครื่อง ตั้งค่า
`appServer.command` เฉพาะเมื่อคุณตั้งใจต้องการเรียกใช้ไฟล์ปฏิบัติการอื่นเท่านั้น

สำหรับ app-server ที่ทำงานอยู่แล้ว ให้ใช้การขนส่ง WebSocket:

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

| ฟิลด์                                        | ค่าเริ่มต้น                                           | ความหมาย                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` จะสร้าง Codex; `"websocket"` จะเชื่อมต่อกับ `url`                                                                                                                                                                                                                                                                                                                                        |
| `command`                                     | ไบนารี Codex ที่จัดการให้                             | ไฟล์ปฏิบัติการสำหรับการรับส่งแบบ stdio ไม่ต้องตั้งค่าเพื่อใช้ไบนารีที่จัดการให้                                                                                                                                                                                                                                                                                                                   |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | อาร์กิวเมนต์สำหรับการรับส่งแบบ stdio                                                                                                                                                                                                                                                                                                                                                              |
| `url`                                         | ไม่ได้ตั้งค่า                                         | URL ของ WebSocket app-server                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | ไม่ได้ตั้งค่า                                         | โทเคน Bearer สำหรับการรับส่งผ่าน WebSocket รับได้ทั้งสตริงตรงตัวหรือ SecretInput เช่น `${CODEX_APP_SERVER_TOKEN}`                                                                                                                                                                                                                                                                                 |
| `headers`                                     | `{}`                                                   | ส่วนหัว WebSocket เพิ่มเติม ค่าส่วนหัวรับได้ทั้งสตริงตรงตัวหรือค่า SecretInput เช่น `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`                                                                                                                                                                                                                                                |
| `clearEnv`                                    | `[]`                                                   | ชื่อตัวแปรสภาพแวดล้อมเพิ่มเติมที่ถูกลบออกจากโปรเซส stdio app-server ที่สร้างขึ้น หลังจาก OpenClaw สร้างสภาพแวดล้อมที่สืบทอดแล้ว                                                                                                                                                                                                                                                                 |
| `remoteWorkspaceRoot`                         | ไม่ได้ตั้งค่า                                         | รากของพื้นที่ทำงาน Codex app-server ระยะไกล เมื่อตั้งค่า OpenClaw จะอนุมานรากของพื้นที่ทำงานภายในเครื่องจากพื้นที่ทำงาน OpenClaw ที่แก้ไขแล้ว รักษาส่วนต่อท้าย cwd ปัจจุบันไว้ใต้รากระยะไกลนี้ และส่งเฉพาะ cwd สุดท้ายของ app-server ไปยัง Codex หาก cwd อยู่นอกรากพื้นที่ทำงาน OpenClaw ที่แก้ไขแล้ว OpenClaw จะล้มเหลวแบบปิดแทนที่จะส่งเส้นทางภายใน Gateway ไปยัง app-server ระยะไกล |
| `requestTimeoutMs`                            | `60000`                                                | ระยะหมดเวลาสำหรับการเรียก control-plane ของ app-server                                                                                                                                                                                                                                                                                                                                            |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | ช่วงเงียบหลังจาก Codex รับเทิร์น หรือหลังจากคำขอ app-server ที่มีขอบเขตเฉพาะเทิร์น ขณะที่ OpenClaw รอ `turn/completed`                                                                                                                                                                                                                                                                           |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | ตัวเฝ้าระยะว่างของการเสร็จสิ้นและความคืบหน้าที่ใช้หลังจากส่งต่อไปยังเครื่องมือ การเสร็จสิ้นของเครื่องมือเนทีฟ ความคืบหน้าของผู้ช่วยดิบหลังเครื่องมือ การเสร็จสิ้นของการให้เหตุผลดิบ หรือความคืบหน้าของการให้เหตุผล ขณะที่ OpenClaw รอ `turn/completed` ใช้ค่านี้สำหรับงานที่เชื่อถือได้หรืองานหนัก ซึ่งการสังเคราะห์หลังเครื่องมืออาจเงียบนานกว่างบเวลาปล่อยผู้ช่วยสุดท้ายได้อย่างสมเหตุสมผล |
| `mode`                                        | `"yolo"` เว้นแต่ข้อกำหนด Codex ภายในเครื่องไม่อนุญาต YOLO | ค่าที่ตั้งไว้ล่วงหน้าสำหรับการดำเนินการแบบ YOLO หรือแบบให้ guardian ตรวจทาน                                                                                                                                                                                                                                                                                                                       |
| `approvalPolicy`                              | `"never"` หรือนโยบายการอนุมัติของ guardian ที่อนุญาต  | นโยบายการอนุมัติเนทีฟของ Codex ที่ส่งไปยังการเริ่มเธรด การดำเนินการต่อ และเทิร์น                                                                                                                                                                                                                                                                                                                  |
| `sandbox`                                     | `"danger-full-access"` หรือแซนด์บ็อกซ์ guardian ที่อนุญาต | โหมดแซนด์บ็อกซ์เนทีฟของ Codex ที่ส่งไปยังการเริ่มเธรดและการดำเนินการต่อ แซนด์บ็อกซ์ OpenClaw ที่ใช้งานอยู่จะจำกัดเทิร์น `danger-full-access` ให้เป็น Codex `workspace-write`; แฟล็กเครือข่ายของเทิร์นจะตามการออกเครือข่ายของแซนด์บ็อกซ์ OpenClaw                                                                                                                                            |
| `approvalsReviewer`                           | `"user"` หรือผู้ตรวจทาน guardian ที่อนุญาต             | ใช้ `"auto_review"` เพื่อให้ Codex ตรวจทานพรอมป์อนุมัติเนทีฟเมื่ออนุญาต                                                                                                                                                                                                                                                                                                                           |
| `defaultWorkspaceDir`                         | ไดเรกทอรีของโปรเซสปัจจุบัน                            | พื้นที่ทำงานที่ `/codex bind` ใช้เมื่อไม่ได้ระบุ `--cwd`                                                                                                                                                                                                                                                                                                                                          |
| `serviceTier`                                 | ไม่ได้ตั้งค่า                                         | ระดับบริการ Codex app-server แบบเลือกได้ `"priority"` เปิดใช้การจัดเส้นทางโหมดเร็ว, `"flex"` ขอการประมวลผลแบบ flex และ `null` ล้างค่าที่แทนที่ ค่าเดิม `"fast"` จะถูกรับเป็น `"priority"`                                                                                                                                                                                                      |
| `networkProxy`                                | ปิดใช้งาน                                             | เลือกใช้เครือข่ายแบบโปรไฟล์สิทธิ์ของ Codex สำหรับคำสั่ง app-server OpenClaw จะกำหนดค่า `permissions.<profile>.network` ที่เลือกและเลือกด้วย `default_permissions` แทนการส่ง `sandbox`                                                                                                                                                                                                         |
| `experimental.sandboxExecServer`              | `false`                                                | การเลือกใช้แบบพรีวิวที่ลงทะเบียนสภาพแวดล้อม Codex ซึ่งรองรับด้วยแซนด์บ็อกซ์ OpenClaw กับ Codex app-server 0.132.0 หรือใหม่กว่า เพื่อให้การดำเนินการเนทีฟของ Codex รันภายในแซนด์บ็อกซ์ OpenClaw ที่ใช้งานอยู่ได้                                                                                                                                                                               |

`appServer.networkProxy` ระบุอย่างชัดเจนเพราะเปลี่ยนสัญญาแซนด์บ็อกซ์ของ Codex
เมื่อเปิดใช้ OpenClaw จะตั้งค่า `features.network_proxy.enabled` และ
`default_permissions` ในค่ากำหนดเธรด Codex ด้วย เพื่อให้โปรไฟล์สิทธิ์ที่สร้างขึ้น
เริ่มเครือข่ายที่ Codex จัดการได้ โดยค่าเริ่มต้น OpenClaw จะสร้างชื่อโปรไฟล์
`openclaw-network-<fingerprint>` ที่ทนต่อการชนกันจากเนื้อหาโปรไฟล์;
ใช้ `profileName` เฉพาะเมื่อจำเป็นต้องมีชื่อภายในเครื่องที่คงที่

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
`networkProxy` จะใช้การเข้าถึงระบบไฟล์แบบพื้นที่ทำงานสำหรับโปรไฟล์สิทธิ์ที่สร้างขึ้น
การบังคับใช้งานเครือข่ายที่ Codex จัดการคือเครือข่ายที่อยู่ในแซนด์บ็อกซ์
ดังนั้นโปรไฟล์แบบเข้าถึงเต็มรูปแบบจะไม่ป้องกันทราฟฟิกขาออก

Plugin จะบล็อกการจับมือ app-server ที่เก่ากว่าหรือไม่มีเวอร์ชัน Codex app-server
ต้องรายงานเวอร์ชันเสถียร `0.125.0` หรือใหม่กว่า

OpenClaw ถือว่า URL ของแอปเซิร์ฟเวอร์ WebSocket ที่ไม่ใช่ loopback เป็นระยะไกล และกำหนดให้มีการยืนยันตัวตน WebSocket ที่มีข้อมูลระบุตัวตนผ่าน `appServer.authToken` หรือเฮดเดอร์ `Authorization` ค่า `appServer.authToken` และค่า `appServer.headers.*` แต่ละค่าจะเป็น SecretInput ได้; runtime ของ secrets จะแก้ค่า SecretRefs และรูปย่อของ env ก่อนที่ OpenClaw จะสร้างตัวเลือกการเริ่มต้นแอปเซิร์ฟเวอร์ และ SecretRefs แบบมีโครงสร้างที่ยังแก้ค่าไม่ได้จะล้มเหลวก่อนที่จะส่ง token หรือ header ใดๆ เมื่อกำหนดค่า Plugin ของ Codex แบบ native ไว้ OpenClaw จะใช้ control plane ของ Plugin จากแอปเซิร์ฟเวอร์ที่เชื่อมต่ออยู่เพื่อติดตั้งหรือรีเฟรช Plugin เหล่านั้น แล้วจึงรีเฟรช inventory ของแอปเพื่อให้แอปที่ Plugin เป็นเจ้าของมองเห็นได้ในเธรด Codex `app/list` ยังคงเป็นแหล่ง inventory และ metadata ที่มีอำนาจตัดสินใจ แต่ policy ของ OpenClaw จะตัดสินว่า `thread/start` จะส่ง `config.apps[appId].enabled = true` สำหรับแอปที่เข้าถึงได้และอยู่ในรายการหรือไม่ แม้ Codex จะทำเครื่องหมายว่าแอปนั้นปิดใช้งานอยู่ในปัจจุบันก็ตาม app id ที่ไม่รู้จักหรือขาดหายไปยังคง fail-closed; เส้นทางนี้เปิดใช้เฉพาะ marketplace plugins ผ่าน `plugin/install` และรีเฟรช inventory เท่านั้น เชื่อมต่อ OpenClaw กับแอปเซิร์ฟเวอร์ระยะไกลเฉพาะเมื่อเชื่อถือได้ว่าจะยอมรับการติดตั้ง Plugin และการรีเฟรช inventory ของแอปที่ OpenClaw จัดการ

## โหมดการอนุมัติและ sandbox

เซสชันแอปเซิร์ฟเวอร์ stdio ภายในเครื่องมีค่าเริ่มต้นเป็นโหมด YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` และ
`sandbox: "danger-full-access"` ท่าทีของผู้ปฏิบัติงานภายในเครื่องที่เชื่อถือได้นี้ช่วยให้ turn และ Heartbeat ของ OpenClaw แบบไม่ต้องเฝ้าดูเดินหน้าต่อได้โดยไม่มี prompt การอนุมัติแบบ native ที่ไม่มีใครอยู่ตอบ

หากไฟล์ข้อกำหนดระบบภายในเครื่องของ Codex ไม่อนุญาตค่า YOLO โดยนัยสำหรับการอนุมัติ reviewer หรือ sandbox OpenClaw จะถือค่าเริ่มต้นโดยนัยเป็น guardian แทน และเลือกสิทธิ์ guardian ที่อนุญาต `tools.exec.mode: "auto"` ยังบังคับให้การอนุมัติ Codex ผ่านการตรวจทานโดย guardian และไม่คง override แบบ legacy ที่ไม่ปลอดภัยอย่าง `approvalPolicy: "never"` หรือ `sandbox: "danger-full-access"` ไว้; ตั้ง `tools.exec.mode: "full"` สำหรับท่าทีที่ตั้งใจให้ไม่มีการอนุมัติ รายการ `[[remote_sandbox_config]]` ที่ตรงกับ hostname ในไฟล์ข้อกำหนดเดียวกันจะถูกนำมาใช้สำหรับการตัดสินค่าเริ่มต้นของ sandbox

ตั้ง `appServer.mode: "guardian"` สำหรับการอนุมัติ Codex ที่ผ่านการตรวจทานโดย guardian:

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

preset `guardian` ขยายเป็น `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` และ `sandbox: "workspace-write"` เมื่อค่าเหล่านั้นได้รับอนุญาต ฟิลด์ policy รายตัวจะ override `mode` ค่า reviewer แบบเก่า `guardian_subagent` ยังยอมรับเป็น alias เพื่อความเข้ากันได้ แต่ config ใหม่ควรใช้ `auto_review`

เมื่อ sandbox ของ OpenClaw ทำงานอยู่ process ของแอปเซิร์ฟเวอร์ Codex ภายในเครื่องยังคงรันบนโฮสต์ Gateway ดังนั้น OpenClaw จะปิดใช้งาน Code Mode แบบ native ของ Codex, เซิร์ฟเวอร์ MCP ของผู้ใช้ และการเรียกใช้ Plugin ที่มีแอปรองรับสำหรับ turn นั้น แทนที่จะถือว่า sandboxing ฝั่งโฮสต์ของ Codex เทียบเท่ากับ backend sandbox ของ OpenClaw การเข้าถึง shell ถูกเปิดเผยผ่าน dynamic tools ที่รองรับด้วย sandbox ของ OpenClaw เช่น `sandbox_exec` และ `sandbox_process` เมื่อเครื่องมือ exec/process ปกติพร้อมใช้งาน

บนโฮสต์ Ubuntu/AppArmor Codex bwrap อาจล้มเหลวภายใต้ `workspace-write` ก่อนที่คำสั่ง shell จะเริ่ม เมื่อคุณตั้งใจรัน `workspace-write` แบบ native ของ Codex โดยไม่มี sandboxing ของ OpenClaw ที่ทำงานอยู่ หากคุณเห็น `bwrap: setting up uid map: Permission denied` หรือ
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` ให้รัน
`openclaw doctor` และแก้ไข host namespace policy ที่รายงานสำหรับผู้ใช้ service ของ OpenClaw แทนการให้สิทธิ์ Docker container ที่กว้างขึ้น ควรใช้ AppArmor profile แบบจำกัดขอบเขตสำหรับ process ของ service; fallback
`kernel.apparmor_restrict_unprivileged_userns=0` มีผลทั้งโฮสต์และมี tradeoff ด้านความปลอดภัย

## การดำเนินการแบบ native ใน sandbox

ค่าเริ่มต้นที่เสถียรคือ fail-closed: sandboxing ของ OpenClaw ที่ทำงานอยู่จะปิดใช้งานพื้นผิวการดำเนินการแบบ native ของ Codex ที่มิฉะนั้นจะรันจากโฮสต์แอปเซิร์ฟเวอร์ Codex ใช้ `appServer.experimental.sandboxExecServer: true` เฉพาะเมื่อคุณต้องการลองใช้การรองรับสภาพแวดล้อมระยะไกลของ Codex กับ backend sandbox ของ OpenClaw เส้นทาง preview นี้ต้องใช้แอปเซิร์ฟเวอร์ Codex 0.132.0 หรือใหม่กว่า

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

เมื่อเปิด flag และเซสชัน OpenClaw ปัจจุบันอยู่ใน sandbox OpenClaw จะเริ่ม exec-server แบบ local loopback ที่รองรับด้วย sandbox ที่ทำงานอยู่ ลงทะเบียนกับแอปเซิร์ฟเวอร์ Codex และเริ่มเธรดกับ turn ของ Codex ด้วยสภาพแวดล้อมที่ OpenClaw เป็นเจ้าของนั้น หากแอปเซิร์ฟเวอร์ลงทะเบียนสภาพแวดล้อมไม่ได้ run จะ fail closed แทนการถอยกลับไปใช้การดำเนินการบนโฮสต์อย่างเงียบๆ

เส้นทาง preview นี้ใช้ได้เฉพาะภายในเครื่อง แอปเซิร์ฟเวอร์ WebSocket ระยะไกลไม่สามารถเข้าถึง exec-server แบบ loopback ได้เว้นแต่จะรันอยู่บนโฮสต์เดียวกัน ดังนั้น OpenClaw จะปฏิเสธชุดค่าผสมนั้น

## การยืนยันตัวตนและการแยกสภาพแวดล้อม

การยืนยันตัวตนถูกเลือกตามลำดับนี้:

1. โปรไฟล์การยืนยันตัวตน Codex ของ OpenClaw ที่ระบุชัดเจนสำหรับ agent
2. บัญชีที่มีอยู่ของแอปเซิร์ฟเวอร์ใน Codex home ของ agent นั้น
3. สำหรับการเปิดแอปเซิร์ฟเวอร์ stdio ภายในเครื่องเท่านั้น `CODEX_API_KEY` แล้วจึง
   `OPENAI_API_KEY` เมื่อไม่มีบัญชีแอปเซิร์ฟเวอร์อยู่ และยังต้องใช้การยืนยันตัวตน OpenAI

เมื่อ OpenClaw พบโปรไฟล์การยืนยันตัวตน Codex แบบ subscription ของ ChatGPT จะลบ `CODEX_API_KEY` และ `OPENAI_API_KEY` ออกจาก process ลูกของ Codex ที่ถูก spawn วิธีนี้ทำให้ API keys ระดับ Gateway ยังพร้อมใช้สำหรับ embeddings หรือโมเดล OpenAI โดยตรง โดยไม่ทำให้ turn ของแอปเซิร์ฟเวอร์ Codex แบบ native ถูกคิดค่าใช้จ่ายผ่าน API โดยไม่ตั้งใจ

โปรไฟล์ API-key ของ Codex ที่ระบุชัดเจนและ fallback env-key ของ stdio ภายในเครื่องจะใช้การล็อกอินของแอปเซิร์ฟเวอร์แทน env ที่สืบทอดจาก process ลูก การเชื่อมต่อแอปเซิร์ฟเวอร์ WebSocket จะไม่ได้รับ fallback API-key จาก env ของ Gateway; ให้ใช้โปรไฟล์การยืนยันตัวตนที่ระบุชัดเจนหรือบัญชีของแอปเซิร์ฟเวอร์ระยะไกลเอง

การเปิดแอปเซิร์ฟเวอร์ stdio จะสืบทอดสภาพแวดล้อม process ของ OpenClaw ตามค่าเริ่มต้น OpenClaw เป็นเจ้าของ account bridge ของแอปเซิร์ฟเวอร์ Codex และตั้ง `CODEX_HOME` เป็นไดเรกทอรีต่อ agent ภายใต้ state ของ OpenClaw ของ agent นั้น วิธีนี้ทำให้ config, บัญชี, cache/data ของ Plugin และ state ของเธรดของ Codex ถูกจำกัดขอบเขตไว้กับ agent ของ OpenClaw แทนที่จะรั่วเข้ามาจาก home `~/.codex` ส่วนตัวของผู้ปฏิบัติงาน

OpenClaw ไม่เขียน `HOME` ใหม่สำหรับการเปิดแอปเซิร์ฟเวอร์ภายในเครื่องตามปกติ subprocesses ที่ Codex รัน เช่น `openclaw`, `gh`, `git`, cloud CLIs และคำสั่ง shell จะเห็น process home ปกติและค้นหา config กับ token ใน user-home ได้ Codex ยังอาจค้นพบ `$HOME/.agents/skills` และ `$HOME/.agents/plugins/marketplace.json`; การค้นพบ `.agents` นั้นตั้งใจให้ใช้ร่วมกับ home ของผู้ปฏิบัติงาน และแยกจาก state `~/.codex` ที่ถูกแยกไว้

Plugin ของ OpenClaw และ snapshot ของ skill ของ OpenClaw ยังคงไหลผ่าน registry ของ Plugin และ skill loader ของ OpenClaw เอง asset ส่วนตัวของ Codex `~/.codex` ไม่เป็นเช่นนั้น หากคุณมี Skills หรือ Plugin ของ Codex CLI ที่มีประโยชน์จาก Codex home ซึ่งควรกลายเป็นส่วนหนึ่งของ agent ของ OpenClaw ให้ทำ inventory อย่างชัดเจน:

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

`appServer.clearEnv` มีผลเฉพาะกับ process ลูกของแอปเซิร์ฟเวอร์ Codex ที่ถูก spawn เท่านั้น OpenClaw จะลบ `CODEX_HOME` และ `HOME` ออกจากรายการนี้ระหว่างการ normalize การเปิดภายในเครื่อง: `CODEX_HOME` ยังคงเป็นแบบต่อ agent และ `HOME` ยังคงสืบทอดมาเพื่อให้ subprocesses ใช้ state ของ user-home ตามปกติได้

## Dynamic tools

dynamic tools ของ Codex มีค่าเริ่มต้นเป็นการโหลดแบบ `searchable` OpenClaw ไม่เปิดเผย dynamic tools ที่ซ้ำกับการดำเนินการ workspace แบบ native ของ Codex:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

เครื่องมือ integration ของ OpenClaw ส่วนใหญ่ที่เหลือ เช่น messaging, media, cron, browser, nodes, gateway, `heartbeat_respond` และ `web_search` พร้อมใช้งานผ่านการค้นหาเครื่องมือของ Codex ภายใต้ namespace `openclaw` วิธีนี้ทำให้ context เริ่มต้นของโมเดลเล็กลง `sessions_yield` และการตอบกลับแหล่งที่มาแบบ message-tool-only ยังคงเป็น direct เพราะสิ่งเหล่านั้นเป็นสัญญา turn-control `sessions_spawn` ยังคง searchable เพื่อให้ `spawn_agent` แบบ native ของ Codex ยังคงเป็นพื้นผิว subagent หลักของ Codex ขณะที่การมอบหมายงานแบบ OpenClaw หรือ ACP ที่ระบุชัดเจนยังคงพร้อมใช้งานผ่าน namespace ของ dynamic tool `openclaw`

ตั้ง `codexDynamicToolsLoading: "direct"` เฉพาะเมื่อเชื่อมต่อกับแอปเซิร์ฟเวอร์ Codex แบบ custom ที่ไม่สามารถค้นหา dynamic tools ที่เลื่อนไว้ หรือเมื่อ debug payload เครื่องมือทั้งหมด

## Timeout

การเรียก dynamic tool ที่ OpenClaw เป็นเจ้าของถูกจำกัดเวลาแยกจาก
`appServer.requestTimeoutMs` คำขอ `item/tool/call` ของ Codex แต่ละครั้งใช้ timeout แรกที่มีตามลำดับนี้:

- อาร์กิวเมนต์ `timeoutMs` ต่อการเรียกที่เป็นค่าบวก
- สำหรับ `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`
- สำหรับ `image_generate` ที่ไม่มี timeout ที่กำหนดค่าไว้ ค่าเริ่มต้นการสร้างภาพ 120 วินาที
- สำหรับเครื่องมือ `image` ของ media-understanding, `tools.media.image.timeoutSeconds`
  ที่แปลงเป็นมิลลิวินาที หรือค่าเริ่มต้น media 60 วินาที สำหรับ image understanding สิ่งนี้มีผลกับคำขอเองและไม่ถูกลดด้วยงานเตรียมการก่อนหน้า
- ค่าเริ่มต้น dynamic-tool 90 วินาที

watchdog นี้เป็นงบประมาณ `item/tool/call` แบบ dynamic ชั้นนอก timeout ของคำขอเฉพาะ provider จะรันอยู่ภายในการเรียกนั้นและคง semantics ของ timeout ของตัวเอง งบประมาณของ dynamic tool ถูกจำกัดสูงสุดที่ 600000 ms เมื่อ timeout OpenClaw จะ abort signal ของเครื่องมือเมื่อรองรับ และส่ง response ของ dynamic-tool ที่ล้มเหลวกลับไปยัง Codex เพื่อให้ turn ดำเนินต่อได้ แทนที่จะปล่อยให้เซสชันค้างอยู่ใน `processing`

หลังจาก Codex ยอมรับ turn และหลังจาก OpenClaw ตอบคำขอแอปเซิร์ฟเวอร์ที่อยู่ในขอบเขตของ turn แล้ว harness คาดว่า Codex จะมีความคืบหน้าใน turn ปัจจุบันและท้ายที่สุดจบ turn แบบ native ด้วย `turn/completed` หากแอปเซิร์ฟเวอร์เงียบไปนาน `appServer.turnCompletionIdleTimeoutMs` OpenClaw จะพยายาม interrupt turn ของ Codex อย่าง best-effort บันทึก diagnostic timeout และปล่อย session lane ของ OpenClaw เพื่อให้ข้อความแชทถัดไปไม่ถูกคิวไว้หลัง turn แบบ native ที่ค้างอยู่

การแจ้งเตือนที่ไม่ใช่สถานะสิ้นสุดส่วนใหญ่สำหรับรอบเดียวกันจะปลด watchdog ระยะสั้นนั้น
เพราะ Codex ได้พิสูจน์แล้วว่ารอบนั้นยังทำงานอยู่ การส่งต่อเครื่องมือใช้โควตาเวลาว่างหลังเครื่องมือที่ยาวกว่า:
หลังจาก OpenClaw ส่งคืนการตอบกลับ `item/tool/call`, หลังจากรายการเครื่องมือเนทีฟ เช่น
`commandExecution` ทำงานเสร็จ, หลังจากการเสร็จสิ้นของ `custom_tool_call_output` แบบดิบ,
และหลังจากความคืบหน้าของผู้ช่วยแบบดิบหลังเครื่องมือ, การเสร็จสิ้นของการให้เหตุผลแบบดิบ,
หรือความคืบหน้าของการให้เหตุผล ตัวป้องกันใช้
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` เมื่อกำหนดค่าไว้ และ
ค่าเริ่มต้นเป็นห้านาทีในกรณีอื่น โควตาหลังเครื่องมือเดียวกันนี้ยังขยาย
progress watchdog สำหรับช่วงสังเคราะห์แบบเงียบก่อนที่ Codex จะส่งอีเวนต์รอบปัจจุบันถัดไปด้วย
การเสร็จสิ้นของการให้เหตุผล, การเสร็จสิ้นของ `agentMessage` ใน commentary,
และความคืบหน้าของการให้เหตุผลหรือผู้ช่วยแบบดิบก่อนเครื่องมือสามารถ
ตามด้วยการตอบกลับสุดท้ายอัตโนมัติได้ จึงใช้ตัวป้องกันการตอบกลับหลังความคืบหน้า
แทนที่จะปล่อยช่องทางเซสชันทันที เฉพาะรายการ `agentMessage` ที่เสร็จสมบูรณ์แบบ
final/non-commentary และการเสร็จสิ้นของผู้ช่วยแบบดิบก่อนเครื่องมือเท่านั้น
ที่ติดอาวุธการปล่อยเอาต์พุตผู้ช่วย: หาก Codex จากนั้นเงียบไปโดยไม่มี
`turn/completed`, OpenClaw จะพยายาม interrupt รอบเนทีฟแบบ best-effort และปล่อย
ช่องทางเซสชัน ความล้มเหลวของแอปเซิร์ฟเวอร์ stdio ที่ replay-safe รวมถึง
timeout จากการว่างระหว่างรอการเสร็จสิ้นของรอบโดยไม่มีหลักฐานผู้ช่วย เครื่องมือ รายการที่ทำงานอยู่
หรือ side effect จะถูกลองซ้ำหนึ่งครั้งบนความพยายามแอปเซิร์ฟเวอร์ใหม่ Timeout ที่ไม่ปลอดภัย
ยังคง retire ไคลเอนต์แอปเซิร์ฟเวอร์ที่ค้างและปล่อยช่องทางเซสชัน OpenClaw
นอกจากนี้ยังล้างการผูกเธรดเนทีฟที่ค้างแทนที่จะ replay โดยอัตโนมัติ Timeout ของ completion-watch
จะแสดงข้อความ timeout เฉพาะ Codex: กรณี replay-safe ระบุว่าการตอบกลับอาจไม่สมบูรณ์
ส่วนกรณีที่ไม่ปลอดภัยจะแจ้งให้ผู้ใช้ตรวจสอบสถานะปัจจุบันก่อนลองใหม่ การวินิจฉัย timeout แบบสาธารณะ
รวมฟิลด์เชิงโครงสร้าง เช่น เมธอดการแจ้งเตือนแอปเซิร์ฟเวอร์ล่าสุด,
id/type/role ของรายการการตอบกลับผู้ช่วยแบบดิบ, จำนวนคำขอ/รายการที่ทำงานอยู่,
และสถานะ watch ที่ติดอาวุธไว้ เมื่อการแจ้งเตือนล่าสุดเป็นรายการการตอบกลับผู้ช่วยแบบดิบ
การวินิจฉัยจะรวมตัวอย่างข้อความผู้ช่วยแบบจำกัดขนาดด้วย แต่จะไม่รวม prompt แบบดิบหรือ
เนื้อหาเครื่องมือ

## การค้นหาโมเดล

ตามค่าเริ่มต้น Plugin Codex จะขอโมเดลที่พร้อมใช้งานจากแอปเซิร์ฟเวอร์ ความพร้อมใช้งานของโมเดล
อยู่ภายใต้การควบคุมของแอปเซิร์ฟเวอร์ Codex ดังนั้นรายการอาจเปลี่ยนเมื่อ OpenClaw
อัปเกรดเวอร์ชัน `@openai/codex` ที่ bundled ไว้ หรือเมื่อ deployment ชี้
`appServer.command` ไปยังไบนารี Codex อื่น ความพร้อมใช้งานยังอาจขึ้นกับบัญชีด้วย
ใช้ `/codex models` บน gateway ที่กำลังทำงานเพื่อดูแค็ตตาล็อกจริง
สำหรับ harness และบัญชีนั้น

หากการค้นหาล้มเหลวหรือ timeout, OpenClaw จะใช้แค็ตตาล็อก fallback ที่ bundled ไว้สำหรับ:

- GPT-5.5
- GPT-5.4 mini

harness ที่ bundled อยู่ปัจจุบันคือ `@openai/codex` `0.142.4` probe `model/list`
กับแอปเซิร์ฟเวอร์ที่ bundled นั้นใน workspace ที่เปิดใช้ GPT-5.6 ส่งคืนแถวตัวเลือกสาธารณะเหล่านี้:

| id โมเดล              | รูปแบบอินพุต | ระดับความพยายามในการให้เหตุผล        |
| --------------------- | ------------ | ------------------------------------ |
| `gpt-5.6-sol`         | text, image  | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | text, image  | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | text, image  | low, medium, high, xhigh, max        |
| `gpt-5.5`             | text, image  | low, medium, high, xhigh             |
| `gpt-5.4`             | text, image  | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | text, image  | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | text, image  | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | text         | low, medium, high, xhigh             |

การเข้าถึง GPT-5.6 อยู่ในขอบเขตบัญชีระหว่าง limited preview `max` เป็น
ระดับความพยายามในการให้เหตุผลของโมเดล `ultra` เป็นเมทาดาทา orchestration แบบ multi-agent
ของ Codex แยกต่างหาก ไม่ใช่ระดับความพยายามในการให้เหตุผลมาตรฐานของ OpenAI

โมเดลที่ซ่อนอยู่อาจถูกส่งคืนโดยแค็ตตาล็อกแอปเซิร์ฟเวอร์สำหรับโฟลว์ภายในหรือ
เฉพาะทาง แต่ไม่ใช่ตัวเลือกปกติในตัวเลือกโมเดล

ปรับแต่งการค้นหาใต้ `plugins.entries.codex.config.discovery`:

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

ปิดการค้นหาเมื่อคุณต้องการให้การเริ่มต้นหลีกเลี่ยงการ probe Codex และใช้เฉพาะ
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

## ไฟล์ bootstrap ของ workspace

Codex จัดการ `AGENTS.md` เองผ่านการค้นพบ project-doc แบบเนทีฟ OpenClaw
ไม่เขียนไฟล์ project-doc ของ Codex แบบสังเคราะห์หรือพึ่งพาชื่อไฟล์ fallback
ของ Codex สำหรับไฟล์ persona เพราะ fallback ของ Codex ใช้เฉพาะเมื่อ
`AGENTS.md` ขาดหายไปเท่านั้น

เพื่อให้ workspace OpenClaw เทียบเท่ากัน harness Codex จะแก้ resolve ไฟล์ bootstrap
อื่น ๆ `SOUL.md`, `IDENTITY.md`, `TOOLS.md`, และ `USER.md` จะถูกส่งต่อเป็น
คำสั่ง developer ของ OpenClaw Codex เพราะไฟล์เหล่านี้กำหนด agent ที่ใช้งานอยู่,
คำแนะนำ workspace ที่มีให้ใช้, และโปรไฟล์ผู้ใช้ รายการ Skills ของ OpenClaw แบบกระชับ
จะถูกส่งต่อเป็นคำสั่ง developer ด้านการทำงานร่วมกันที่มีขอบเขตตามรอบ
เนื้อหา `HEARTBEAT.md` จะไม่ถูก inject; รอบ heartbeat จะได้รับ pointer โหมดการทำงานร่วมกัน
เพื่ออ่านไฟล์เมื่อมีอยู่และไม่ว่าง เนื้อหา `MEMORY.md` จาก workspace ของ agent
ที่กำหนดค่าไว้จะไม่ถูกวางลงในอินพุตรอบ Codex เนทีฟ เมื่อมีเครื่องมือ memory
สำหรับ workspace นั้น; เมื่อมีอยู่ harness จะเพิ่ม pointer workspace-memory ขนาดเล็ก
ไปยังคำสั่ง developer ด้านการทำงานร่วมกันที่มีขอบเขตตามรอบ และ Codex ควรใช้
`memory_search` หรือ `memory_get` เมื่อ memory ระยะยาวเกี่ยวข้อง หากเครื่องมือถูกปิด,
memory search ไม่พร้อมใช้งาน, หรือ workspace ที่ใช้งานอยู่ต่างจาก workspace memory ของ agent,
`MEMORY.md` จะใช้เส้นทาง turn-context แบบจำกัดขนาดตามปกติ
`BOOTSTRAP.md` เมื่อมีอยู่จะถูกส่งต่อเป็นบริบทอ้างอิงอินพุตรอบของ OpenClaw

## การ override สภาพแวดล้อม

การ override สภาพแวดล้อมยังคงมีให้ใช้สำหรับการทดสอบในเครื่อง:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` จะข้ามไบนารีที่จัดการไว้เมื่อ
ไม่ได้ตั้งค่า `appServer.command`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` ถูกลบแล้ว ใช้
`plugins.entries.codex.config.appServer.mode: "guardian"` แทน หรือ
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` สำหรับการทดสอบในเครื่องแบบครั้งเดียว แนะนำให้ใช้ config
สำหรับ deployment ที่ทำซ้ำได้ เพราะทำให้พฤติกรรม Plugin อยู่ในไฟล์ที่ผ่านการ review เดียวกัน
กับการตั้งค่า harness Codex ที่เหลือ

## ที่เกี่ยวข้อง

- [harness Codex](/th/plugins/codex-harness)
- [runtime harness Codex](/th/plugins/codex-harness-runtime)
- [Plugin Codex เนทีฟ](/th/plugins/codex-native-plugins)
- [Codex Computer Use](/th/plugins/codex-computer-use)
- [provider OpenAI](/th/providers/openai)
- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
