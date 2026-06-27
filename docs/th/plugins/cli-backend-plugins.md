---
read_when:
    - คุณกำลังสร้าง Plugin แบ็กเอนด์ CLI AI ภายในเครื่อง
    - คุณต้องการลงทะเบียนแบ็กเอนด์สำหรับการอ้างอิงโมเดล เช่น acme-cli/model
    - คุณต้องแมป CLI ของบุคคลที่สามเข้ากับตัวรันสำรองแบบข้อความของ OpenClaw
sidebarTitle: CLI backend plugins
summary: สร้าง Plugin ที่ลงทะเบียนแบ็กเอนด์ AI CLI ภายในเครื่อง
title: การสร้าง Plugin แบ็กเอนด์ CLI
x-i18n:
    generated_at: "2026-06-27T17:51:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d91c2b712a821005303c6cbb0ccbd8f263c8c30c5dbd6ed05b842c47c63f0542
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Plugin แบ็กเอนด์ CLI ช่วยให้ OpenClaw เรียก AI CLI ภายในเครื่องเป็นแบ็กเอนด์
การอนุมานข้อความได้ แบ็กเอนด์จะแสดงเป็นคำนำหน้าผู้ให้บริการในการอ้างอิงโมเดล:

```text
acme-cli/acme-large
```

ใช้แบ็กเอนด์ CLI เมื่อการผสานรวมต้นทางถูกเปิดให้ใช้เป็นคำสั่งภายในเครื่องอยู่แล้ว
เมื่อ CLI เป็นเจ้าของสถานะการเข้าสู่ระบบภายในเครื่อง หรือเมื่อ CLI เป็นตัวสำรองที่มีประโยชน์
หากผู้ให้บริการ API ไม่พร้อมใช้งาน

<Info>
  หากบริการต้นทางเปิดเผย API โมเดล HTTP ปกติ ให้เขียน
  [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) แทน หากรันไทม์ต้นทาง
  เป็นเจ้าของเซสชันเอเจนต์ทั้งหมด เหตุการณ์เครื่องมือ Compaction หรือสถานะงานเบื้องหลัง
  ให้ใช้ [harness เอเจนต์](/th/plugins/sdk-agent-harness)
</Info>

## สิ่งที่ Plugin เป็นเจ้าของ

Plugin แบ็กเอนด์ CLI มีสัญญาสามอย่าง:

| สัญญา                 | ไฟล์                   | จุดประสงค์                                               |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| จุดเข้าแพ็กเกจ        | `package.json`         | ชี้ OpenClaw ไปยังโมดูลรันไทม์ของ Plugin                 |
| ความเป็นเจ้าของ manifest | `openclaw.plugin.json` | ประกาศ id แบ็กเอนด์ก่อนที่รันไทม์จะโหลด                 |
| การลงทะเบียนรันไทม์  | `index.ts`             | เรียก `api.registerCliBackend(...)` พร้อมค่าเริ่มต้นของคำสั่ง |

manifest เป็นเมทาดาทาสำหรับการค้นพบ มันไม่เรียกใช้ CLI และไม่
ลงทะเบียนพฤติกรรมรันไทม์ พฤติกรรมรันไทม์เริ่มเมื่อจุดเข้า Plugin เรียก
`api.registerCliBackend(...)`

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

    แพ็กเกจที่เผยแพร่ต้องจัดส่งไฟล์รันไทม์ JavaScript ที่ build แล้ว หากจุดเข้า
    ซอร์สของคุณคือ `./src/index.ts` ให้เพิ่ม `openclaw.runtimeExtensions` ที่ชี้ไปยัง
    peer JavaScript ที่ build แล้ว ดู [จุดเข้า](/th/plugins/sdk-entrypoints)

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

    `cliBackends` คือรายการความเป็นเจ้าของรันไทม์ มันช่วยให้ OpenClaw โหลด
    Plugin โดยอัตโนมัติเมื่อ config หรือการเลือกโมเดลกล่าวถึง `acme-cli/...`

    `setup.cliBackends` คือพื้นผิวการตั้งค่าแบบ descriptor-first เพิ่มเมื่อ
    การค้นพบโมเดล การ onboarding หรือสถานะควรรู้จักแบ็กเอนด์โดยไม่ต้อง
    โหลดรันไทม์ Plugin ใช้ `requiresRuntime: false` เฉพาะเมื่อ descriptor แบบสแตติกเหล่านั้น
    เพียงพอสำหรับการตั้งค่า

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

    id ของแบ็กเอนด์ต้องตรงกับรายการ `cliBackends` ใน manifest `config` ที่ลงทะเบียน
    เป็นเพียงค่าเริ่มต้นเท่านั้น; config ของผู้ใช้ภายใต้
    `agents.defaults.cliBackends.acme-cli` จะถูก merge ทับในรันไทม์

  </Step>
</Steps>

## รูปแบบ config

`CliBackendConfig` อธิบายว่า OpenClaw ควรเรียกใช้และ parse CLI อย่างไร:

| ฟิลด์                                     | การใช้งาน                                                   |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | ชื่อไบนารีหรือพาธคำสั่งแบบ absolute                        |
| `args`                                    | argv พื้นฐานสำหรับการรันใหม่                                |
| `resumeArgs`                              | argv ทางเลือกสำหรับเซสชันที่ resume; รองรับ `{sessionId}` |
| `output` / `resumeOutput`                 | Parser: `json`, `jsonl` หรือ `text`                         |
| `input`                                   | การส่ง prompt: `arg` หรือ `stdin`                           |
| `modelArg`                                | แฟล็กที่ใช้ก่อน id โมเดล                                    |
| `modelAliases`                            | map id โมเดล OpenClaw ไปยัง id แบบเนทีฟของ CLI             |
| `sessionArg` / `sessionArgs`              | วิธีส่ง id เซสชัน                                           |
| `sessionMode`                             | `always`, `existing` หรือ `none`                            |
| `sessionIdFields`                         | ฟิลด์ JSON ที่ OpenClaw อ่านจากเอาต์พุต CLI                 |
| `systemPromptArg` / `systemPromptFileArg` | การส่ง system prompt                                        |
| `systemPromptWhen`                        | `first`, `always` หรือ `never`                              |
| `imageArg` / `imageMode`                  | การรองรับพาธรูปภาพ                                          |
| `serialize`                               | รักษาลำดับการรันของแบ็กเอนด์เดียวกัน                       |
| `reliability.watchdog`                    | การปรับแต่ง timeout เมื่อไม่มีเอาต์พุต                     |

ควรใช้ config แบบสแตติกที่เล็กที่สุดซึ่งตรงกับ CLI เพิ่ม callback ของ Plugin
เฉพาะสำหรับพฤติกรรมที่ควรเป็นของแบ็กเอนด์จริง ๆ

## hook แบ็กเอนด์ขั้นสูง

`CliBackendPlugin` ยังสามารถกำหนด:

| Hook                               | การใช้งาน                                                                  |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | เขียน config ผู้ใช้แบบเก่าใหม่หลัง merge                                  |
| `resolveExecutionArgs(ctx)`        | เพิ่มแฟล็กตามขอบเขตคำขอ เช่น ระดับความพยายามในการคิด หรือการแยกคำถามเสริม |
| `prepareExecution(ctx)`            | สร้างบริดจ์ auth หรือ config ชั่วคราวก่อนเรียกใช้งาน                      |
| `transformSystemPrompt(ctx)`       | ใช้การแปลง system prompt ขั้นสุดท้ายเฉพาะ CLI                              |
| `textTransforms`                   | การแทนที่ prompt/เอาต์พุตแบบสองทิศทาง                                      |
| `defaultAuthProfileId`             | เลือกใช้โปรไฟล์ auth ของ OpenClaw ที่เฉพาะเจาะจง                           |
| `authEpochMode`                    | ตัดสินใจว่าการเปลี่ยน auth ทำให้เซสชัน CLI ที่จัดเก็บไว้หมดอายุอย่างไร    |
| `nativeToolMode`                   | ประกาศว่า CLI มีเครื่องมือเนทีฟที่เปิดตลอดเวลาหรือไม่                     |
| `sideQuestionToolMode`             | ประกาศเครื่องมือเนทีฟที่ปิดใช้งานสำหรับคำถามเสริม `/btw`                  |
| `bundleMcp` / `bundleMcpMode`      | เลือกใช้บริดจ์เครื่องมือ MCP แบบ loopback ของ OpenClaw                    |
| `ownsNativeCompaction`             | แบ็กเอนด์เป็นเจ้าของ Compaction ของตัวเอง - OpenClaw จะเลื่อนให้          |

เก็บ hook เหล่านี้ไว้เป็นของผู้ให้บริการ อย่าเพิ่ม branch เฉพาะ CLI ลงใน core เมื่อ
hook ของแบ็กเอนด์สามารถแสดงพฤติกรรมนั้นได้

`ctx.executionMode` คือ `"agent"` สำหรับ turn ปกติ และ `"side-question"` สำหรับ
การเรียก `/btw` แบบชั่วคราว ใช้ค่านี้เมื่อ CLI ต้องการแฟล็ก one-shot ที่ต่างกัน เช่น
การปิดใช้เครื่องมือเนทีฟ การคงอยู่ของเซสชัน หรือพฤติกรรม resume สำหรับ BTW หาก
แบ็กเอนด์ปกติมี `nativeToolMode: "always-on"` แต่ argv ของคำถามเสริม
ปิดใช้เครื่องมือเหล่านั้นได้อย่างน่าเชื่อถือ ให้ตั้ง `sideQuestionToolMode: "disabled"` ด้วย;
มิฉะนั้น OpenClaw จะ fail closed เมื่อ BTW ต้องการการรัน CLI แบบไม่มีเครื่องมือ

### `ownsNativeCompaction`: เลือกไม่ใช้ Compaction ของ OpenClaw

หากแบ็กเอนด์ของคุณรันเอเจนต์ที่ compact transcript **ของตัวเอง** ให้ตั้ง
`ownsNativeCompaction: true` เพื่อให้ตัวสรุปป้องกันของ OpenClaw ไม่ทำงานกับ
เซสชันของมัน - วงจรชีวิต Compaction ของ CLI จะคืนค่า no-op และ turn จะดำเนินต่อ `claude-cli`
ประกาศค่านี้เพราะ Claude Code compact ภายในโดยไม่มี endpoint ของ harness เซสชัน native-harness
เช่น Codex จะยังคง route ไปยัง endpoint Compaction ของ harness แทน

**ประกาศค่านี้เฉพาะเมื่อเงื่อนไขทั้งหมดต่อไปนี้เป็นจริง** มิฉะนั้นเซสชันที่เกินงบประมาณและถูกเลื่อน
อาจยังเกินงบประมาณ / กลายเป็น stale ได้ (OpenClaw จะไม่ช่วยกู้มันอีกต่อไป):

- แบ็กเอนด์ compact หรือจำกัด transcript ของตัวเองได้อย่างน่าเชื่อถือเมื่อเข้าใกล้ window;
- มัน persist เซสชันที่ resume ได้ เพื่อให้สถานะที่ compact แล้วอยู่รอดข้าม turn
  (เช่น `--resume` / `--session-id`);
- มันไม่ใช่เซสชัน Compaction แบบ native-harness - เซสชันที่ตรงกับ `agentHarnessId`
  จะ route ไปยัง endpoint ของ harness แทน

## บริดจ์เครื่องมือ MCP

แบ็กเอนด์ CLI ไม่ได้รับเครื่องมือ OpenClaw โดยค่าเริ่มต้น หาก CLI สามารถใช้
config MCP ได้ ให้เลือกใช้อย่างชัดเจน:

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

โหมดบริดจ์ที่รองรับคือ:

| โหมด                     | การใช้งาน                                                      |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | CLI ที่รับไฟล์ config MCP                                       |
| `codex-config-overrides` | CLI ที่รับ config override บน argv                              |
| `gemini-system-settings` | CLI ที่อ่านการตั้งค่า MCP จากไดเรกทอรีการตั้งค่าระบบของตัวเอง |

เปิดใช้บริดจ์เฉพาะเมื่อ CLI ใช้งานได้จริง หาก CLI มีเลเยอร์เครื่องมือในตัว
ของตัวเองที่ปิดใช้งานไม่ได้ ให้ตั้ง `nativeToolMode:
"always-on"` เพื่อให้ OpenClaw สามารถ fail closed เมื่อผู้เรียกต้องการไม่มีเครื่องมือเนทีฟ

## config ผู้ใช้

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

บันทึก override ขั้นต่ำที่ผู้ใช้น่าจะต้องใช้ โดยปกติจะมีเพียง
`command` เมื่อไบนารีอยู่นอก `PATH`

## การตรวจสอบ

สำหรับ Plugin ที่บันเดิลมา ให้เพิ่มการทดสอบแบบเจาะจงรอบตัวสร้างและการลงทะเบียนการตั้งค่า
จากนั้นรันเลนทดสอบเป้าหมายของ Plugin:

```bash
pnpm test extensions/acme-cli
```

สำหรับ Plugin แบบโลคัลหรือติดตั้งแล้ว ให้ตรวจสอบการค้นพบและการรันโมเดลจริงหนึ่งครั้ง:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

หากแบ็กเอนด์รองรับรูปภาพหรือ MCP ให้เพิ่มการทดสอบควันแบบสดที่พิสูจน์เส้นทางเหล่านั้น
ด้วย CLI จริง อย่าพึ่งพาการตรวจสอบแบบสแตติกสำหรับพฤติกรรมพรอมป์ รูปภาพ MCP หรือ
การกลับมาทำงานต่อของเซสชัน

## รายการตรวจสอบ

<Check>`package.json` มี `openclaw.extensions` และรายการรันไทม์ที่สร้างแล้วสำหรับแพ็กเกจที่เผยแพร่</Check>
<Check>`openclaw.plugin.json` ประกาศ `cliBackends` และ `activation.onStartup` ที่ตั้งใจไว้</Check>
<Check>`setup.cliBackends` มีอยู่เมื่อการตั้งค่า/การค้นพบโมเดลควรเห็นแบ็กเอนด์ตั้งแต่สถานะเย็น</Check>
<Check>`api.registerCliBackend(...)` ใช้รหัสแบ็กเอนด์เดียวกับ manifest</Check>
<Check>การแทนที่ของผู้ใช้ภายใต้ `agents.defaults.cliBackends.<id>` ยังคงมีผลเหนือกว่า</Check>
<Check>การตั้งค่าเซสชัน พรอมป์ระบบ รูปภาพ และตัวแยกวิเคราะห์เอาต์พุตตรงกับสัญญา CLI จริง</Check>
<Check>การทดสอบเป้าหมายและการทดสอบควัน CLI แบบสดอย่างน้อยหนึ่งรายการพิสูจน์เส้นทางแบ็กเอนด์</Check>

## ที่เกี่ยวข้อง

- [แบ็กเอนด์ CLI](/th/gateway/cli-backends) - การกำหนดค่าผู้ใช้และพฤติกรรมรันไทม์
- [การสร้าง Plugin](/th/plugins/building-plugins) - พื้นฐานของแพ็กเกจและ manifest
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview) - ข้อมูลอ้างอิง API การลงทะเบียน
- [Plugin manifest](/th/plugins/manifest) - `cliBackends` และตัวบรรยายการตั้งค่า
- [ฮาร์เนสเอเจนต์](/th/plugins/sdk-agent-harness) - รันไทม์เอเจนต์ภายนอกเต็มรูปแบบ
