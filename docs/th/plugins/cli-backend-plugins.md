---
read_when:
    - คุณกำลังสร้าง Plugin แบ็กเอนด์ AI สำหรับ CLI ที่ทำงานภายในเครื่อง
    - คุณต้องการลงทะเบียนแบ็กเอนด์สำหรับการอ้างอิงโมเดล เช่น acme-cli/model
    - คุณต้องแมป CLI ของบุคคลที่สามเข้ากับตัวรันสำรองแบบข้อความของ OpenClaw
sidebarTitle: CLI backend plugins
summary: สร้าง Plugin ที่ลงทะเบียนแบ็กเอนด์ CLI สำหรับ AI ภายในเครื่อง
title: การสร้าง Plugin แบ็กเอนด์สำหรับ CLI
x-i18n:
    generated_at: "2026-07-20T06:02:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 08edceae9afd133684094b6febc6ca9b0ab89ce1168474f0a4fabd15b5ac4200
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Plugin แบ็กเอนด์ CLI ช่วยให้ OpenClaw เรียกใช้ CLI AI ภายในเครื่องเป็นแบ็กเอนด์
สำหรับการอนุมานข้อความได้ แบ็กเอนด์จะแสดงเป็นคำนำหน้าผู้ให้บริการในการอ้างอิงโมเดล:

```text
acme-cli/acme-large
```

ใช้แบ็กเอนด์ CLI เมื่อการผสานรวมต้นทางมีให้ใช้งานเป็นคำสั่งภายในเครื่องอยู่แล้ว
เมื่อ CLI จัดการสถานะการเข้าสู่ระบบภายในเครื่อง หรือใช้เป็นทางเลือกสำรองเมื่อผู้ให้บริการ
API ไม่พร้อมใช้งาน

<Info>
  หากบริการต้นทางมี API โมเดล HTTP แบบปกติ ให้เขียน
  [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) แทน หากรันไทม์ต้นทาง
  จัดการเซสชันเอเจนต์ เหตุการณ์เครื่องมือ Compaction หรือสถานะงานเบื้องหลัง
  ทั้งหมด ให้ใช้ [ชุดควบคุมเอเจนต์](/th/plugins/sdk-agent-harness)
</Info>

## สิ่งที่ Plugin เป็นผู้รับผิดชอบ

Plugin แบ็กเอนด์ CLI มีสัญญาสามรายการ:

| สัญญา               | ไฟล์                   | วัตถุประสงค์                                              |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| จุดเริ่มต้นแพ็กเกจ   | `package.json`         | ชี้ OpenClaw ไปยังโมดูลรันไทม์ของ Plugin                  |
| การเป็นเจ้าของแมนิเฟสต์ | `openclaw.plugin.json` | ประกาศรหัสแบ็กเอนด์ก่อนโหลดรันไทม์                        |
| การลงทะเบียนรันไทม์ | `index.ts`             | เรียก `api.registerCliBackend(...)` พร้อมค่าเริ่มต้นของคำสั่ง |

แมนิเฟสต์เป็นเมทาดาทาสำหรับการค้นพบ โดยจะไม่เรียกใช้ CLI หรือลงทะเบียน
พฤติกรรมรันไทม์ พฤติกรรมรันไทม์เริ่มต้นเมื่อจุดเริ่มต้นของ Plugin เรียก
`api.registerCliBackend(...)`

## Plugin แบ็กเอนด์ขั้นต่ำ

<Steps>
  <Step title="สร้างเมทาดาทาของแพ็กเกจ">
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

    แพ็กเกจที่เผยแพร่ต้องรวมไฟล์รันไทม์ JavaScript ที่สร้างแล้ว หากจุดเริ่มต้น
    ซอร์สของคุณคือ `./src/index.ts` ให้เพิ่ม `openclaw.runtimeExtensions` ที่ชี้ไปยัง
    ไฟล์ JavaScript คู่กันซึ่งสร้างแล้ว ดู[จุดเริ่มต้น](/th/plugins/sdk-entrypoints)

  </Step>

  <Step title="ประกาศการเป็นเจ้าของแบ็กเอนด์">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "เรียกใช้ CLI AI ภายในเครื่องของ Acme ผ่าน OpenClaw",
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

    `cliBackends` คือรายการความเป็นเจ้าของรันไทม์ ซึ่งช่วยให้ OpenClaw โหลด
    Plugin โดยอัตโนมัติเมื่อการกำหนดค่าหรือการเลือกโมเดลกล่าวถึง `acme-cli/...`

    `setup.cliBackends` คือพื้นผิวการตั้งค่าที่ใช้ตัวอธิบายเป็นหลัก เพิ่มรายการนี้เมื่อ
    การค้นพบโมเดล การเริ่มต้นใช้งาน หรือสถานะควรรู้จักแบ็กเอนด์
    โดยไม่ต้องโหลดรันไทม์ของ Plugin ใช้ `requiresRuntime: false` เฉพาะเมื่อ
    ตัวอธิบายแบบคงที่เหล่านั้นเพียงพอสำหรับการตั้งค่า

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
      description: "เรียกใช้ CLI AI ภายในเครื่องของ Acme ผ่าน OpenClaw",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    รหัสแบ็กเอนด์ต้องตรงกับรายการ `cliBackends` ในแมนิเฟสต์
    `config` ที่ลงทะเบียนไว้เป็นเพียงค่าเริ่มต้น การกำหนดค่าของผู้ใช้ภายใต้
    `agents.defaults.cliBackends.acme-cli` จะถูกรวมทับเมื่อรันไทม์ทำงาน

  </Step>
</Steps>

## รูปแบบการกำหนดค่า

`CliBackendConfig` อธิบายวิธีที่ OpenClaw ควรเรียกใช้และแยกวิเคราะห์ CLI:

| ฟิลด์                                                     | การใช้งาน                                                                        |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `command`                                                 | ชื่อไบนารีหรือพาธคำสั่งแบบสัมบูรณ์                                               |
| `args`                                                    | argv พื้นฐานสำหรับการเรียกใช้ใหม่                                                |
| `resumeArgs`                                              | argv ทางเลือกสำหรับเซสชันที่ดำเนินการต่อ รองรับ `{sessionId}`                       |
| `output` / `resumeOutput`                                 | ตัวแยกวิเคราะห์: `json`, `jsonl` หรือ `text`                                                |
| `jsonlDialect`                                            | รูปแบบเหตุการณ์ JSONL: `claude-stream-json` หรือ `gemini-stream-json`                 |
| `liveSession`                                             | โหมดกระบวนการ CLI ที่ทำงานระยะยาว (`claude-stdio`)                                      |
| `input`                                                   | การส่งพรอมต์: `arg` หรือ `stdin`                                                |
| `maxPromptArgChars`                                       | ความยาวพรอมต์สูงสุดสำหรับโหมด `arg` ก่อนเปลี่ยนไปใช้ stdin                     |
| `env` / `clearEnv`                                        | ตัวแปรสภาพแวดล้อมเพิ่มเติมที่จะใส่ หรือชื่อที่จะนำออกก่อนเรียกใช้                         |
| `modelArg`                                                | แฟล็กที่ใช้ก่อนรหัสโมเดล                                                     |
| `modelAliases`                                            | จับคู่รหัสโมเดล OpenClaw กับรหัสที่ CLI รองรับโดยตรง                                          |
| `sessionArg` / `sessionArgs`                              | วิธีส่งรหัสเซสชัน                                                          |
| `sessionMode`                                             | `always`, `existing` หรือ `none`                                                   |
| `sessionIdFields`                                         | ฟิลด์ JSON ที่ OpenClaw อ่านจากเอาต์พุต CLI                                        |
| `systemPromptArg` / `systemPromptFileArg`                 | การส่งพรอมต์ระบบ                                                           |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | การส่งผ่านการแทนที่การกำหนดค่าสำหรับไฟล์พรอมต์ระบบ (ตัวอย่างเช่น `-c`)             |
| `systemPromptMode`                                        | `append` หรือ `replace`                                                             |
| `systemPromptWhen`                                        | `first`, `always` หรือ `never`                                                     |
| `imageArg` / `imageMode`                                  | แฟล็กพาธรูปภาพและวิธีส่งรูปภาพหลายภาพ (`repeat` หรือ `list`)              |
| `imagePathScope`                                          | ตำแหน่งที่เก็บไฟล์รูปภาพที่จัดเตรียมไว้ก่อนส่งต่อ: `temp` หรือ `workspace`               |
| `serialize`                                               | รักษาลำดับการเรียกใช้แบ็กเอนด์เดียวกัน                                                    |
| `reseedFromRawTranscriptWhenUncompacted`                  | เลือกใช้การป้อนทรานสคริปต์ดิบซ้ำแบบมีขอบเขตก่อน Compaction เพื่อรีเซ็ตเซสชันอย่างปลอดภัย |
| `reliability.watchdog`                                    | การปรับแต่งระยะหมดเวลาหากไม่มีเอาต์พุต โดยแยกสำหรับการเรียกใช้ใหม่กับการเรียกใช้ต่อ                      |

ควรใช้การกำหนดค่าแบบคงที่ที่เล็กที่สุดซึ่งตรงกับ CLI เพิ่มคอลแบ็กของ Plugin
เฉพาะสำหรับพฤติกรรมที่เป็นความรับผิดชอบของแบ็กเอนด์อย่างแท้จริง

## ฮุกแบ็กเอนด์ขั้นสูง

`CliBackendPlugin` ยังสามารถกำหนดสิ่งต่อไปนี้ได้:

| ฮุก                                | การใช้งาน                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | เขียนการกำหนดค่าผู้ใช้แบบเดิมใหม่หลังการรวม                                      |
| `resolveExecutionArgs(ctx)`        | เพิ่มแฟล็กระดับคำขอ เช่น ระดับความพยายามในการคิดหรือการแยกคำถามย่อย |
| `prepareExecution(ctx)`            | สร้างสะพานเชื่อมการยืนยันตัวตน การกำหนดค่า หรือสภาพแวดล้อมชั่วคราวก่อนเรียกใช้         |
| `transformSystemPrompt(ctx)`       | ใช้การแปลงพรอมต์ระบบเฉพาะ CLI ขั้นสุดท้าย                          |
| `textTransforms`                   | การแทนที่พรอมต์/เอาต์พุตแบบสองทิศทาง                                    |
| `defaultAuthProfileId`             | เลือกใช้โปรไฟล์การยืนยันตัวตน OpenClaw ที่ระบุเป็นอันดับแรก                                     |
| `authEpochMode`                    | กำหนดว่าการเปลี่ยนแปลงการยืนยันตัวตนทำให้เซสชัน CLI ที่จัดเก็บไว้ใช้การไม่ได้อย่างไร                      |
| `nativeToolMode`                   | ประกาศว่าไม่มีเครื่องมือแบบเนทีฟ เปิดใช้งานเสมอ หรือโฮสต์เลือกได้      |
| `sideQuestionToolMode`             | ประกาศเครื่องมือแบบเนทีฟที่ปิดใช้งานสำหรับคำถามย่อย `/btw`                     |
| `bundleMcp` / `bundleMcpMode`      | เลือกใช้สะพานเครื่องมือ MCP แบบลูปแบ็กของ OpenClaw                                |
| `ownsNativeCompaction`             | แบ็กเอนด์จัดการ Compaction ของตนเอง โดย OpenClaw จะเลื่อนการทำงานนี้ให้                           |
| `subscriptionAuthDispatch`         | การเรียกใช้แบบฝังตัวที่เลือกใช้ข้อมูลประจำตัวการสมัครสมาชิกจะดำเนินการผ่านแบ็กเอนด์นี้ |
| `runtimeArtifact`                  | ผูกตัวเรียกใช้สคริปต์เข้ากับโครงสร้างแพ็กเกจที่รวมมาทั้งหมด                |

เก็บฮุกเหล่านี้ไว้ภายใต้ความรับผิดชอบของผู้ให้บริการ อย่าเพิ่มเงื่อนไขเฉพาะ CLI ลงในแกนหลักเมื่อ
ฮุกแบ็กเอนด์สามารถแสดงพฤติกรรมนั้นได้

`prepareExecution(ctx)` รับ `ctx.contextTokenBudget` ซึ่งเป็นขีดจำกัดโทเค็นที่มีผล
ซึ่งเลือกไว้สำหรับการเรียกใช้ แบ็กเอนด์ที่จัดการ Compaction แบบเนทีฟเองสามารถจับคู่
งบประมาณดังกล่าวกับสัญญาการเรียกใช้เฉพาะ CLI ของตนได้

`runtimeArtifact` อยู่ภายใต้การควบคุมของ Plugin และผู้ใช้ไม่สามารถแทนที่ได้ ระบบจะตรวจสอบค่านี้
เฉพาะเมื่อรอบการอนุมานแบบสดสร้างหรือตรวจสอบสิทธิ์การตั้งค่าที่ผ่านการยืนยันอีกครั้งเท่านั้น
การเรียกใช้ CLI ตามปกติไม่จำเป็นต้องใช้ค่านี้ แบ็กเอนด์ที่ไม่มีการประกาศนี้จะไม่สามารถ
สร้างสิทธิ์การตั้งค่า CLI ที่ผ่านการยืนยันได้ การประกาศ `bundled-package-tree` จะระบุ
เจ้าของ `package.json` ที่แน่นอน และกำหนดให้จุดเข้าใช้งานของแพ็กเกจเป็น
คำสั่ง OpenClaw จะแฮชแผนผังแพ็กเกจที่ติดตั้งทั้งหมดภายในขอบเขต รวมถึง
การขึ้นต่อกันแบบซ้อน และจะปฏิเสธโดยปริยายสำหรับ symlink ที่เปลี่ยนเส้นทาง
ตัวเรียกใช้งานที่อยู่นอกแพ็กเกจที่ประกาศ การประกาศการขึ้นต่อกันภายนอกที่จำเป็น
แผนผังที่มีขนาดใหญ่เกินไป และสคริปต์ที่ไม่รู้จัก ให้ประกาศค่านี้เฉพาะเมื่อ
แผนผังดังกล่าวมีการติดตั้งใช้งานการอนุมานที่สมบูรณ์ทั้งหมด การผสานรวมเครื่องมือเสริม
ไม่ได้ทำให้กราฟการติดตั้งใช้งานภายนอกปลอดภัย

หากแบ็กเอนด์เดียวกันมีไฟล์ปฏิบัติการเนทีฟที่ทำงานได้ด้วยตนเองด้วย ให้ระบุ
ชื่อฐานมาตรฐานของไฟล์เหล่านั้นใน `nativeExecutableNames` คำสั่งเนทีฟอื่น ๆ จะยังคง
ไม่ได้รับการยืนยัน แม้ผู้ใช้จะแทนที่คำสั่งของแบ็กเอนด์ก็ตาม

`ctx.executionMode` คือ `"agent"` สำหรับรอบปกติ และ `"side-question"` สำหรับ
การเรียก `/btw` แบบชั่วคราว ใช้ค่านี้เมื่อ CLI ต้องใช้แฟล็กแบบครั้งเดียวที่ต่างออกไป
เช่น การปิดใช้งานเครื่องมือเนทีฟ การคงอยู่ของเซสชัน หรือพฤติกรรมการทำงานต่อสำหรับ
BTW หากโดยปกติแบ็กเอนด์มี `nativeToolMode: "always-on"` แต่อาร์กิวเมนต์ argv
สำหรับคำถามแทรกสามารถปิดใช้งานเครื่องมือเหล่านั้นได้อย่างน่าเชื่อถือ ให้ตั้งค่า
`sideQuestionToolMode: "disabled"` ด้วย มิฉะนั้น OpenClaw จะปฏิเสธโดยปริยายเมื่อ BTW
ต้องการเรียกใช้ CLI โดยไม่มีเครื่องมือ

ตั้งค่า `nativeToolMode: "selectable"` เฉพาะเมื่อ `resolveExecutionArgs` สามารถปิดใช้งาน
เครื่องมือเนทีฟทั้งหมดของแบ็กเอนด์สำหรับการเรียกใช้แต่ละครั้งได้ สำหรับการเรียกใช้ที่จำกัดเหล่านั้น
`ctx.toolAvailability.native` จะเป็นทูเพิลว่าง และ
`ctx.toolAvailability.mcp` จะเป็นรายการอนุญาต MCP ที่แยกจากโฮสต์อย่างถูกต้องแม่นยำ ฮุก
ต้องแทนที่แฟล็กเครื่องมือที่ขัดแย้งกันและส่งคืน argv ที่บังคับใช้ค่าทั้งสอง
OpenClaw จะเรียกฮุกนี้หนึ่งครั้งด้วย argv สุดท้ายสำหรับการเริ่มใหม่หรือทำงานต่อ และจะปฏิเสธโดยปริยายเมื่อ
แบ็กเอนด์ไม่สามารถบังคับใช้ข้อจำกัดได้ ชื่อ MCP ในบริบทนี้สามารถ
อนุมัติโดยอัตโนมัติได้อย่างปลอดภัย เนื่องจากโฮสต์ได้จำกัดการกำหนดค่า MCP
ที่สร้างขึ้นไว้เฉพาะเซิร์ฟเวอร์และเครื่องมือเหล่านั้นแล้ว

### `ownsNativeCompaction`: การเลือกไม่ใช้ Compaction ของ OpenClaw

หากแบ็กเอนด์เรียกใช้เอเจนต์ที่ทำ Compaction ทรานสคริปต์ของ**ตนเอง** ให้ตั้งค่า
`ownsNativeCompaction: true` เพื่อไม่ให้ตัวสรุปเพื่อป้องกันของ OpenClaw ทำงาน
กับเซสชันของเอเจนต์นั้น โดยวงจรการทำงาน Compaction ของ CLI จะไม่ดำเนินการใด ๆ และ
รอบจะดำเนินต่อไป `claude-cli` ประกาศค่านี้เนื่องจาก Claude Code ทำ Compaction
ภายในโดยไม่มีปลายทางของฮาร์เนส ส่วนเซสชันฮาร์เนสเนทีฟ เช่น Codex
จะยังคงกำหนดเส้นทางไปยังปลายทาง Compaction ของฮาร์เนสแทน

**ให้ประกาศเฉพาะเมื่อเป็นไปตามเงื่อนไขทั้งหมดต่อไปนี้** มิฉะนั้นเซสชันที่ถูกเลื่อนออกไป
และเกินงบประมาณอาจยังคงเกินงบประมาณหรือกลายเป็นข้อมูลล้าสมัย (OpenClaw จะไม่
เข้าช่วยเหลืออีกต่อไป):

- แบ็กเอนด์ทำ Compaction หรือจำกัดขนาดทรานสคริปต์ของตนเองได้อย่างน่าเชื่อถือเมื่อใกล้ถึง
  ขีดจำกัดหน้าต่าง
- แบ็กเอนด์คงเซสชันที่ทำงานต่อได้ไว้ เพื่อให้สถานะหลัง Compaction คงอยู่ข้ามรอบ
  (ตัวอย่างเช่น `--resume` / `--session-id`)
- เซสชันนั้นไม่ใช่เซสชัน Compaction ของฮาร์เนสเนทีฟ โดยเซสชันที่ตรงกับ `agentHarnessId`
  จะถูกกำหนดเส้นทางไปยังปลายทางของฮาร์เนสแทน

## บริดจ์เครื่องมือ MCP

โดยค่าเริ่มต้น แบ็กเอนด์ CLI จะไม่ได้รับเครื่องมือของ OpenClaw หาก CLI สามารถใช้
การกำหนดค่า MCP ได้ ให้เลือกใช้อย่างชัดเจน:

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

โหมดบริดจ์ที่รองรับ:

| โหมด                     | การใช้งาน                                                              |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | CLI ที่ยอมรับไฟล์กำหนดค่า MCP                              |
| `codex-config-overrides` | CLI ที่ยอมรับการแทนที่ค่ากำหนดผ่าน argv                        |
| `gemini-system-settings` | CLI ที่อ่านการตั้งค่า MCP จากไดเรกทอรีการตั้งค่าระบบของตน |

เปิดใช้งานบริดจ์เฉพาะเมื่อ CLI สามารถใช้บริดจ์นั้นได้จริง หาก CLI มี
เลเยอร์เครื่องมือในตัวที่ไม่สามารถปิดใช้งานได้ ให้ตั้งค่า `nativeToolMode:
"always-on"` เพื่อให้ OpenClaw ปฏิเสธโดยปริยายได้เมื่อผู้เรียกต้องการไม่ใช้เครื่องมือเนทีฟ
หากสามารถปิดใช้งานเครื่องมือเนทีฟทั้งหมดสำหรับการเรียกใช้แต่ละครั้งได้ ให้ใช้ `"selectable"` กับ
สัญญา `resolveExecutionArgs` ข้างต้น

## การกำหนดค่าของผู้ใช้

ผู้ใช้สามารถแทนที่ค่าเริ่มต้นของแบ็กเอนด์ใด ๆ ได้:

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
        primary: "openai/gpt-5.6-sol",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

จัดทำเอกสารการแทนที่ขั้นต่ำที่ผู้ใช้น่าจะต้องใช้ ซึ่งโดยทั่วไปมีเพียง
`command` เมื่อไบนารีอยู่นอก `PATH`

## การตรวจสอบยืนยัน

สำหรับ Plugin ที่รวมมาในชุด ให้เพิ่มการทดสอบแบบเจาะจงสำหรับตัวสร้างและการลงทะเบียน
การตั้งค่า จากนั้นเรียกใช้ช่องทางการทดสอบแบบเจาะจงของ Plugin:

```bash
pnpm test extensions/acme-cli
```

สำหรับ Plugin ภายในเครื่องหรือที่ติดตั้งแล้ว ให้ตรวจสอบการค้นพบและการเรียกใช้โมเดลจริงหนึ่งครั้ง:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "ตอบให้ตรงตามนี้: backend ok" --model acme-cli/acme-large
```

หากแบ็กเอนด์รองรับรูปภาพหรือ MCP ให้เพิ่มการทดสอบควันแบบสดที่พิสูจน์เส้นทางเหล่านั้น
ด้วย CLI จริง อย่าพึ่งพาการตรวจสอบแบบสแตติกสำหรับพฤติกรรมพรอมต์ รูปภาพ
MCP หรือการทำงานต่อของเซสชัน

## รายการตรวจสอบ

<Check>`package.json` มี `openclaw.extensions` และรายการรันไทม์ที่สร้างแล้วสำหรับแพ็กเกจที่เผยแพร่</Check>
<Check>`openclaw.plugin.json` ประกาศ `cliBackends` และ `activation.onStartup` ที่กำหนดไว้อย่างจงใจ</Check>
<Check>มี `setup.cliBackends` เมื่อการตั้งค่า/การค้นพบโมเดลควรมองเห็นแบ็กเอนด์ขณะยังไม่เริ่มทำงาน</Check>
<Check>`api.registerCliBackend(...)` ใช้ ID แบ็กเอนด์เดียวกับแมนิเฟสต์</Check>
<Check>การแทนที่ของผู้ใช้ภายใต้ `agents.defaults.cliBackends.<id>` ยังคงมีผลเหนือกว่า</Check>
<Check>การตั้งค่าเซสชัน พรอมต์ระบบ รูปภาพ และตัวแยกวิเคราะห์เอาต์พุตตรงกับสัญญาของ CLI จริง</Check>
<Check>การทดสอบแบบเจาะจงและการทดสอบควัน CLI แบบสดอย่างน้อยหนึ่งครั้งพิสูจน์เส้นทางของแบ็กเอนด์</Check>

## ที่เกี่ยวข้อง

- [แบ็กเอนด์ CLI](/th/gateway/cli-backends) - การกำหนดค่าของผู้ใช้และพฤติกรรมรันไทม์
- [การสร้าง Plugin](/th/plugins/building-plugins) - ข้อมูลพื้นฐานเกี่ยวกับแพ็กเกจและแมนิเฟสต์
- [ภาพรวม SDK ของ Plugin](/th/plugins/sdk-overview) - เอกสารอ้างอิง API การลงทะเบียน
- [แมนิเฟสต์ของ Plugin](/th/plugins/manifest) - `cliBackends` และตัวอธิบายการตั้งค่า
- [ฮาร์เนสเอเจนต์](/th/plugins/sdk-agent-harness) - รันไทม์เอเจนต์ภายนอกเต็มรูปแบบ
