---
read_when:
    - คุณกำลังสร้าง Plugin แบ็กเอนด์ AI CLI ภายในเครื่อง
    - คุณต้องการลงทะเบียนแบ็กเอนด์สำหรับการอ้างอิงโมเดล เช่น acme-cli/model
    - คุณต้องแมป CLI ของบุคคลที่สามเข้ากับตัวรันสำรองแบบข้อความของ OpenClaw
sidebarTitle: CLI backend plugins
summary: สร้าง Plugin ที่ลงทะเบียนแบ็กเอนด์ CLI AI ในเครื่อง
title: การสร้าง Plugin แบ็กเอนด์ CLI
x-i18n:
    generated_at: "2026-05-07T13:23:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fcd604d35eb20d91350d5201236f22edfe7bb7e52eb19e89bceb8025dd3a29b
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Plugin แบ็กเอนด์ CLI ช่วยให้ OpenClaw เรียก CLI AI ภายในเครื่องเป็นแบ็กเอนด์การอนุมานข้อความได้ แบ็กเอนด์จะแสดงเป็นคำนำหน้าผู้ให้บริการใน refs ของโมเดล:

```text
acme-cli/acme-large
```

ใช้แบ็กเอนด์ CLI เมื่อการผสาน upstream ถูกเปิดเผยเป็นคำสั่งภายในเครื่องอยู่แล้ว เมื่อ CLI เป็นเจ้าของสถานะการเข้าสู่ระบบภายในเครื่อง หรือเมื่อ CLI เป็นตัวเลือกสำรองที่มีประโยชน์หากผู้ให้บริการ API ไม่พร้อมใช้งาน

<Info>
  หากบริการ upstream เปิดเผย API โมเดล HTTP ปกติ ให้เขียน
  [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) แทน หาก runtime ของ upstream
  เป็นเจ้าของเซสชันเอเจนต์ทั้งหมด เหตุการณ์เครื่องมือ Compaction หรือสถานะงานเบื้องหลัง
  ให้ใช้ [ชุดควบคุมเอเจนต์](/th/plugins/sdk-agent-harness)
</Info>

## สิ่งที่ Plugin เป็นเจ้าของ

Plugin แบ็กเอนด์ CLI มีสัญญาสามส่วน:

| สัญญา             | ไฟล์                   | วัตถุประสงค์                                                   |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| จุดเข้าแพ็กเกจ        | `package.json`         | ชี้ OpenClaw ไปยังโมดูล runtime ของ Plugin              |
| ความเป็นเจ้าของ manifest   | `openclaw.plugin.json` | ประกาศรหัสแบ็กเอนด์ก่อนโหลด runtime              |
| การลงทะเบียน runtime | `index.ts`             | เรียก `api.registerCliBackend(...)` พร้อมค่าเริ่มต้นของคำสั่ง |

manifest เป็นเมทาดาทาสำหรับการค้นพบ มันไม่ได้เรียกใช้ CLI และไม่ได้ลงทะเบียนพฤติกรรม runtime พฤติกรรม runtime เริ่มเมื่อจุดเข้า Plugin เรียก `api.registerCliBackend(...)`

## Plugin แบ็กเอนด์ขั้นต่ำ

<Steps>
  <Step title="สร้างเมทาดาทาแพ็กเกจ">
    ```json package.json
    {
      "name": "@acme/openclaw-acme-cli",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      },
      "dependencies": {
        "openclaw": "^2026.3.24"
      },
      "devDependencies": {
        "typescript": "^5.9.0"
      }
    }
    ```

    แพ็กเกจที่เผยแพร่ต้องจัดส่งไฟล์ runtime JavaScript ที่ build แล้ว หากจุดเข้าซอร์สของคุณคือ `./src/index.ts` ให้เพิ่ม `openclaw.runtimeExtensions` ที่ชี้ไปยังไฟล์ JavaScript ที่ build แล้วคู่กัน ดู [จุดเข้า](/th/plugins/sdk-entrypoints)

  </Step>

  <Step title="ประกาศความเป็นเจ้าของแบ็กเอนด์">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "Run Acme's local AI CLI through OpenClaw",
      "cliBackends": ["acme-cli"],
      "setup": {
        "cliBackends": ["acme-cli"],
        "requiresRuntime": false
      },
      "activation": {
        "onStartup": false
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```

    `cliBackends` คือรายการความเป็นเจ้าของ runtime ซึ่งช่วยให้ OpenClaw โหลด Plugin อัตโนมัติเมื่อ config หรือการเลือกโมเดลกล่าวถึง `acme-cli/...`

    `setup.cliBackends` คือพื้นผิวการตั้งค่าแบบ descriptor-first เพิ่มเมื่อการค้นพบโมเดล การเริ่มใช้งาน หรือสถานะควรรู้จักแบ็กเอนด์โดยไม่ต้องโหลด runtime ของ Plugin ใช้ `requiresRuntime: false` เฉพาะเมื่อ descriptor แบบสแตติกเหล่านั้นเพียงพอสำหรับการตั้งค่า

  </Step>

  <Step title="ลงทะเบียนแบ็กเอนด์">
    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      CLI_FRESH_WATCHDOG_DEFAULTS,
      CLI_RESUME_WATCHDOG_DEFAULTS,
      type CliBackendPlugin,
    } from "openclaw/plugin-sdk/cli-backend";

    function buildAcmeCliBackend(): CliBackendPlugin {
      return {
        id: "acme-cli",
        liveTest: {
          defaultModelRef: "acme-cli/acme-large",
          defaultImageProbe: false,
          defaultMcpProbe: false,
          docker: {
            npmPackage: "@acme/acme-cli",
            binaryName: "acme",
          },
        },
        config: {
          command: "acme",
          args: ["chat", "--json"],
          output: "json",
          input: "stdin",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptFileArg: "--system-file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          reliability: {
            watchdog: {
              fresh: { ...CLI_FRESH_WATCHDOG_DEFAULTS },
              resume: { ...CLI_RESUME_WATCHDOG_DEFAULTS },
            },
          },
          serialize: true,
        },
      };
    }

    export default definePluginEntry({
      id: "acme-cli",
      name: "Acme CLI",
      description: "Run Acme's local AI CLI through OpenClaw",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    รหัสแบ็กเอนด์ต้องตรงกับรายการ `cliBackends` ใน manifest ส่วน `config` ที่ลงทะเบียนเป็นเพียงค่าเริ่มต้นเท่านั้น config ของผู้ใช้ภายใต้ `agents.defaults.cliBackends.acme-cli` จะถูก merge ทับใน runtime

  </Step>
</Steps>

## รูปแบบ config

`CliBackendConfig` อธิบายว่า OpenClaw ควรเรียกใช้และแยกวิเคราะห์ CLI อย่างไร:

| ฟิลด์                                     | การใช้งาน                                                         |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | ชื่อไบนารีหรือพาธคำสั่งแบบสมบูรณ์                        |
| `args`                                    | argv พื้นฐานสำหรับการรันใหม่                                    |
| `resumeArgs`                              | argv ทางเลือกสำหรับเซสชันที่ดำเนินต่อ รองรับ `{sessionId}` |
| `output` / `resumeOutput`                 | ตัวแยกวิเคราะห์: `json`, `jsonl` หรือ `text`                          |
| `input`                                   | การส่งพรอมป์: `arg` หรือ `stdin`                          |
| `modelArg`                                | แฟล็กที่ใช้ก่อนรหัสโมเดล                               |
| `modelAliases`                            | แมปรหัสโมเดล OpenClaw ไปยังรหัสแบบเนทีฟของ CLI                    |
| `sessionArg` / `sessionArgs`              | วิธีส่งรหัสเซสชัน                                    |
| `sessionMode`                             | `always`, `existing` หรือ `none`                             |
| `sessionIdFields`                         | ฟิลด์ JSON ที่ OpenClaw อ่านจากเอาต์พุต CLI                  |
| `systemPromptArg` / `systemPromptFileArg` | การส่งพรอมป์ระบบ                                     |
| `systemPromptWhen`                        | `first`, `always` หรือ `never`                               |
| `imageArg` / `imageMode`                  | การรองรับพาธรูปภาพ                                          |
| `serialize`                               | รักษาลำดับการรันของแบ็กเอนด์เดียวกัน                              |
| `reliability.watchdog`                    | การปรับแต่ง timeout เมื่อไม่มีเอาต์พุต                                    |

เลือกใช้ config แบบสแตติกที่เล็กที่สุดซึ่งตรงกับ CLI เพิ่ม callback ของ Plugin เฉพาะสำหรับพฤติกรรมที่เป็นของแบ็กเอนด์จริง ๆ

## hook แบ็กเอนด์ขั้นสูง

`CliBackendPlugin` ยังสามารถกำหนด:

| Hook                               | การใช้งาน                                                    |
| ---------------------------------- | ------------------------------------------------------ |
| `normalizeConfig(config, context)` | เขียน config ผู้ใช้แบบเก่าใหม่หลัง merge                 |
| `resolveExecutionArgs(ctx)`        | เพิ่มแฟล็กตามขอบเขตคำขอ เช่น ระดับความพยายามในการคิด       |
| `prepareExecution(ctx)`            | สร้างสะพาน auth หรือ config ชั่วคราวก่อนเริ่มทำงาน  |
| `transformSystemPrompt(ctx)`       | ใช้การแปลงพรอมป์ระบบขั้นสุดท้ายที่เจาะจงกับ CLI     |
| `textTransforms`                   | การแทนที่พรอมป์/เอาต์พุตแบบสองทิศทาง               |
| `defaultAuthProfileId`             | เลือกใช้โปรไฟล์ auth ของ OpenClaw ที่เจาะจง                |
| `authEpochMode`                    | ตัดสินว่าการเปลี่ยน auth ทำให้เซสชัน CLI ที่จัดเก็บไว้หมดอายุอย่างไร |
| `nativeToolMode`                   | ประกาศว่า CLI มีเครื่องมือเนทีฟที่เปิดตลอดหรือไม่     |
| `bundleMcp` / `bundleMcpMode`      | เลือกใช้สะพานเครื่องมือ MCP ผ่าน loopback ของ OpenClaw           |

ให้ hook เหล่านี้เป็นของผู้ให้บริการ อย่าเพิ่ม branch ที่เจาะจง CLI ลงใน core เมื่อ hook แบ็กเอนด์สามารถแสดงพฤติกรรมได้

## สะพานเครื่องมือ MCP

แบ็กเอนด์ CLI จะไม่ได้รับเครื่องมือ OpenClaw โดยค่าเริ่มต้น หาก CLI สามารถใช้ config MCP ได้ ให้เลือกใช้โดยชัดเจน:

```typescript
return {
  id: "acme-cli",
  bundleMcp: true,
  bundleMcpMode: "codex-config-overrides",
  config: {
    command: "acme",
    args: ["chat", "--json"],
    output: "json",
  },
};
```

โหมดสะพานที่รองรับคือ:

| โหมด                     | การใช้งาน                                                              |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | CLI ที่ยอมรับไฟล์ config MCP                              |
| `codex-config-overrides` | CLI ที่ยอมรับการ override config บน argv                        |
| `gemini-system-settings` | CLI ที่อ่านการตั้งค่า MCP จากไดเรกทอรีการตั้งค่าระบบของตัวเอง |

เปิดใช้สะพานเฉพาะเมื่อ CLI ใช้งานได้จริง หาก CLI มีเลเยอร์เครื่องมือในตัวที่ปิดไม่ได้ ให้ตั้ง `nativeToolMode:
"always-on"` เพื่อให้ OpenClaw ปิดกั้นอย่างปลอดภัยเมื่อผู้เรียกต้องการไม่มีเครื่องมือเนทีฟ

## การกำหนดค่าของผู้ใช้

ผู้ใช้สามารถ override ค่าเริ่มต้นของแบ็กเอนด์ใดก็ได้:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "acme-cli": {
          command: "/opt/acme/bin/acme",
          args: ["chat", "--json", "--profile", "work"],
          modelAliases: {
            large: "acme-large-2026",
          },
        },
      },
      model: {
        primary: "openai/gpt-5.5",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

บันทึก override ขั้นต่ำที่ผู้ใช้น่าจะต้องใช้ โดยทั่วไปคือเฉพาะ `command` เมื่อไบนารีอยู่นอก `PATH`

## การตรวจสอบ

สำหรับ Plugin ที่รวมมาในชุด ให้เพิ่มการทดสอบแบบเฉพาะจุดรอบ builder และการลงทะเบียน setup จากนั้นรัน lane ทดสอบเป้าหมายของ Plugin:

```bash
pnpm test extensions/acme-cli
```

สำหรับ Plugin ภายในเครื่องหรือที่ติดตั้งแล้ว ให้ตรวจสอบการค้นพบและการรันโมเดลจริงหนึ่งครั้ง:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

หากแบ็กเอนด์รองรับรูปภาพหรือ MCP ให้เพิ่ม live smoke ที่พิสูจน์เส้นทางเหล่านั้นด้วย CLI จริง อย่าพึ่งพาการตรวจสอบแบบสแตติกสำหรับพฤติกรรมพรอมป์ รูปภาพ MCP หรือการดำเนินเซสชันต่อ

## รายการตรวจสอบ

<Check>`package.json` มี `openclaw.extensions` และจุดเข้า runtime ที่ build แล้วสำหรับแพ็กเกจที่เผยแพร่</Check>
<Check>`openclaw.plugin.json` ประกาศ `cliBackends` และ `activation.onStartup` ตามเจตนา</Check>
<Check>`setup.cliBackends` มีอยู่เมื่อการตั้งค่า/การค้นพบโมเดลควรมองเห็นแบ็กเอนด์แบบเย็น</Check>
<Check>`api.registerCliBackend(...)` ใช้รหัสแบ็กเอนด์เดียวกับ manifest</Check>
<Check>override ของผู้ใช้ภายใต้ `agents.defaults.cliBackends.<id>` ยังคงชนะ</Check>
<Check>การตั้งค่าเซสชัน พรอมป์ระบบ รูปภาพ และตัวแยกวิเคราะห์เอาต์พุตตรงกับสัญญาจริงของ CLI</Check>
<Check>การทดสอบเป้าหมายและ live CLI smoke อย่างน้อยหนึ่งรายการพิสูจน์เส้นทางแบ็กเอนด์</Check>

## ที่เกี่ยวข้อง

- [แบ็กเอนด์ CLI](/th/gateway/cli-backends) - การกำหนดค่าของผู้ใช้และพฤติกรรม runtime
- [การสร้าง Plugin](/th/plugins/building-plugins) - พื้นฐานของแพ็กเกจและ manifest
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview) - เอกสารอ้างอิง API การลงทะเบียน
- [manifest ของ Plugin](/th/plugins/manifest) - `cliBackends` และ descriptor สำหรับ setup
- [ชุดควบคุมเอเจนต์](/th/plugins/sdk-agent-harness) - runtime เอเจนต์ภายนอกเต็มรูปแบบ
