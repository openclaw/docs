---
read_when:
    - คุณกำลังสร้าง Plugin แบ็กเอนด์ AI แบบ CLI ภายในเครื่อง
    - คุณต้องการลงทะเบียนแบ็กเอนด์สำหรับการอ้างอิงโมเดล เช่น acme-cli/model
    - คุณต้องแมป CLI ของบุคคลที่สามเข้ากับตัวเรียกใช้สำรองแบบข้อความของ OpenClaw
sidebarTitle: CLI backend plugins
summary: สร้าง Plugin ที่ลงทะเบียนแบ็กเอนด์ AI CLI ภายในเครื่อง
title: การสร้าง Plugin แบ็กเอนด์สำหรับ CLI
x-i18n:
    generated_at: "2026-07-12T16:23:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6448cdac02a03e5fdf0d802a54189998d97c08769b1b85c8d9963301fa2c5b79
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Plugin แบ็กเอนด์ CLI ช่วยให้ OpenClaw เรียกใช้ CLI ปัญญาประดิษฐ์ภายในเครื่องเป็นแบ็กเอนด์สำหรับการอนุมานข้อความได้ แบ็กเอนด์จะแสดงเป็นคำนำหน้าผู้ให้บริการในการอ้างอิงโมเดล:

```text
acme-cli/acme-large
```

ใช้แบ็กเอนด์ CLI เมื่อการผสานรวมต้นทางมีให้ใช้งานเป็นคำสั่งภายในเครื่องอยู่แล้ว เมื่อ CLI จัดการสถานะการเข้าสู่ระบบภายในเครื่อง หรือใช้เป็นทางเลือกสำรองเมื่อผู้ให้บริการ API ไม่พร้อมใช้งาน

<Info>
  หากบริการต้นทางเปิดเผย API โมเดล HTTP แบบปกติ ให้สร้าง
  [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) แทน หากรันไทม์ต้นทาง
  จัดการเซสชันเอเจนต์ เหตุการณ์เครื่องมือ Compaction หรือสถานะงานเบื้องหลัง
  อย่างสมบูรณ์ ให้ใช้ [ชุดควบคุมเอเจนต์](/th/plugins/sdk-agent-harness)
</Info>

## สิ่งที่ Plugin รับผิดชอบ

Plugin แบ็กเอนด์ CLI มีสัญญาสามรายการ:

| สัญญา                | ไฟล์                   | วัตถุประสงค์                                                     |
| -------------------- | ---------------------- | ----------------------------------------------------------------- |
| จุดเข้าของแพ็กเกจ    | `package.json`         | ชี้ OpenClaw ไปยังโมดูลรันไทม์ของ Plugin                         |
| การประกาศความเป็นเจ้าของ | `openclaw.plugin.json` | ประกาศรหัสแบ็กเอนด์ก่อนโหลดรันไทม์                               |
| การลงทะเบียนรันไทม์  | `index.ts`             | เรียก `api.registerCliBackend(...)` พร้อมค่าเริ่มต้นของคำสั่ง     |

ไฟล์ประกาศเป็นเมทาดาทาสำหรับการค้นพบ โดยจะไม่เรียกใช้ CLI หรือลงทะเบียนพฤติกรรมรันไทม์ พฤติกรรมรันไทม์จะเริ่มต้นเมื่อจุดเข้าของ Plugin เรียก `api.registerCliBackend(...)`

## Plugin แบ็กเอนด์แบบขั้นต่ำ

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

    แพ็กเกจที่เผยแพร่ต้องรวมไฟล์รันไทม์ JavaScript ที่สร้างแล้ว หากจุดเข้าของซอร์ส
    คือ `./src/index.ts` ให้เพิ่ม `openclaw.runtimeExtensions` ซึ่งชี้ไปยังไฟล์
    JavaScript ที่สร้างแล้วซึ่งเป็นคู่กัน ดู[จุดเข้า](/th/plugins/sdk-entrypoints)

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

    `cliBackends` คือรายการความเป็นเจ้าของรันไทม์ ซึ่งช่วยให้ OpenClaw โหลด
    Plugin โดยอัตโนมัติเมื่อการกำหนดค่าหรือการเลือกโมเดลระบุถึง `acme-cli/...`

    `setup.cliBackends` คือพื้นผิวการตั้งค่าที่ใช้ตัวอธิบายเป็นหลัก ให้เพิ่มเมื่อ
    การค้นพบโมเดล การเริ่มต้นใช้งาน หรือสถานะควรรู้จักแบ็กเอนด์โดยไม่ต้องโหลด
    รันไทม์ของ Plugin ใช้ `requiresRuntime: false` เฉพาะเมื่อตัวอธิบายแบบคงที่
    เหล่านั้นเพียงพอสำหรับการตั้งค่า

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

    รหัสแบ็กเอนด์ต้องตรงกับรายการ `cliBackends` ในไฟล์ประกาศ `config`
    ที่ลงทะเบียนเป็นเพียงค่าเริ่มต้น การกำหนดค่าของผู้ใช้ภายใต้
    `agents.defaults.cliBackends.acme-cli` จะถูกผสานทับเมื่อรันไทม์ทำงาน

  </Step>
</Steps>

## รูปแบบการกำหนดค่า

`CliBackendConfig` อธิบายว่า OpenClaw ควรเรียกใช้และแยกวิเคราะห์ CLI อย่างไร:

| ฟิลด์                                                     | การใช้งาน                                                                                          |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `command`                                                 | ชื่อไบนารีหรือพาธคำสั่งแบบสัมบูรณ์                                                                |
| `args`                                                    | อาร์กิวเมนต์พื้นฐานสำหรับการทำงานใหม่                                                              |
| `resumeArgs`                                              | อาร์กิวเมนต์ทางเลือกสำหรับเซสชันที่ดำเนินต่อ รองรับ `{sessionId}`                                  |
| `output` / `resumeOutput`                                 | ตัวแยกวิเคราะห์: `json`, `jsonl` หรือ `text`                                                       |
| `jsonlDialect`                                            | รูปแบบเหตุการณ์ JSONL: `claude-stream-json` หรือ `gemini-stream-json`                              |
| `liveSession`                                             | โหมดกระบวนการ CLI ที่ทำงานยาวนาน (`claude-stdio`)                                                  |
| `input`                                                   | การส่งพรอมต์: `arg` หรือ `stdin`                                                                    |
| `maxPromptArgChars`                                       | ความยาวสูงสุดของพรอมต์สำหรับโหมด `arg` ก่อนเปลี่ยนไปใช้ stdin                                      |
| `env` / `clearEnv`                                        | ตัวแปรสภาพแวดล้อมเพิ่มเติมที่จะแทรก หรือชื่อที่จะลบออกก่อนเรียกใช้                                 |
| `modelArg`                                                | แฟล็กที่ใช้ก่อนรหัสโมเดล                                                                            |
| `modelAliases`                                            | จับคู่รหัสโมเดล OpenClaw กับรหัสเฉพาะของ CLI                                                       |
| `sessionArg` / `sessionArgs`                              | วิธีส่งรหัสเซสชัน                                                                                    |
| `sessionMode`                                             | `always`, `existing` หรือ `none`                                                                    |
| `sessionIdFields`                                         | ฟิลด์ JSON ที่ OpenClaw อ่านจากเอาต์พุต CLI                                                        |
| `systemPromptArg` / `systemPromptFileArg`                 | การส่งพรอมต์ระบบ                                                                                     |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | การส่งการแทนค่าการกำหนดค่าสำหรับไฟล์พรอมต์ระบบ (ตัวอย่างเช่น `-c`)                                 |
| `systemPromptMode`                                        | `append` หรือ `replace`                                                                              |
| `systemPromptWhen`                                        | `first`, `always` หรือ `never`                                                                       |
| `imageArg` / `imageMode`                                  | แฟล็กพาธรูปภาพและวิธีส่งรูปภาพหลายรูป (`repeat` หรือ `list`)                                       |
| `imagePathScope`                                          | ตำแหน่งของไฟล์รูปภาพที่จัดเตรียมไว้ก่อนส่งต่อ: `temp` หรือ `workspace`                             |
| `serialize`                                               | รักษาลำดับการทำงานของแบ็กเอนด์เดียวกัน                                                             |
| `reseedFromRawTranscriptWhenUncompacted`                  | เลือกใช้การป้อนทรานสคริปต์ดิบกลับแบบจำกัดก่อน Compaction เพื่อรีเซ็ตเซสชันอย่างปลอดภัย             |
| `reliability.outputLimits`                                | จำนวนอักขระ/บรรทัด JSONL ดิบสูงสุดที่เก็บไว้สำหรับหนึ่งรอบ CLI สด (แบ็กเอนด์เซสชันสด)             |
| `reliability.watchdog`                                    | การปรับแต่งระยะหมดเวลาเมื่อไม่มีเอาต์พุต แยกระหว่างการทำงานใหม่กับการทำงานต่อ                       |

เลือกใช้การกำหนดค่าแบบคงที่ที่เล็กที่สุดซึ่งตรงกับ CLI เพิ่มคอลแบ็กของ Plugin เฉพาะสำหรับพฤติกรรมที่เป็นความรับผิดชอบของแบ็กเอนด์อย่างแท้จริง

## ฮุกแบ็กเอนด์ขั้นสูง

`CliBackendPlugin` ยังสามารถกำหนดรายการต่อไปนี้ได้:

| ฮุก                                | การใช้งาน                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | เขียนการกำหนดค่าผู้ใช้แบบเก่าใหม่หลังการผสาน                                       |
| `resolveExecutionArgs(ctx)`        | เพิ่มแฟล็กเฉพาะคำขอ เช่น ระดับความพยายามในการคิดหรือการแยกคำถามเสริม               |
| `prepareExecution(ctx)`            | สร้างตัวเชื่อมการยืนยันตัวตนหรือการกำหนดค่าชั่วคราวก่อนเรียกใช้                    |
| `transformSystemPrompt(ctx)`       | ใช้การแปลงพรอมต์ระบบเฉพาะ CLI เป็นขั้นตอนสุดท้าย                                    |
| `textTransforms`                   | การแทนที่พรอมต์/เอาต์พุตแบบสองทิศทาง                                                |
| `defaultAuthProfileId`             | เลือกใช้โปรไฟล์การยืนยันตัวตน OpenClaw ที่ระบุเป็นอันดับแรก                         |
| `authEpochMode`                    | กำหนดว่าการเปลี่ยนแปลงการยืนยันตัวตนทำให้เซสชัน CLI ที่จัดเก็บไว้ใช้ไม่ได้อย่างไร  |
| `nativeToolMode`                   | ประกาศว่าไม่มีเครื่องมือเนทีฟ เปิดใช้งานตลอด หรือโฮสต์สามารถเลือกได้               |
| `sideQuestionToolMode`             | ประกาศเครื่องมือเนทีฟที่ปิดใช้งานสำหรับคำถามเสริม `/btw`                           |
| `bundleMcp` / `bundleMcpMode`      | เลือกใช้บริดจ์เครื่องมือ MCP แบบ local loopback ของ OpenClaw                        |
| `ownsNativeCompaction`             | แบ็กเอนด์จัดการ Compaction ของตนเอง โดย OpenClaw จะชะลอการดำเนินการไว้             |
| `runtimeArtifact`                  | จำกัดตัวเรียกใช้สคริปต์ให้อยู่ภายในโครงสร้างแพ็กเกจแบบรวมที่สมบูรณ์                |

เก็บฮุกเหล่านี้ไว้ภายใต้ความรับผิดชอบของผู้ให้บริการ อย่าเพิ่มแขนงเฉพาะ CLI ลงในแกนกลางเมื่อฮุกของแบ็กเอนด์สามารถอธิบายพฤติกรรมนั้นได้

`runtimeArtifact` เป็นความรับผิดชอบของ Plugin และผู้ใช้ไม่สามารถแทนค่าได้ ระบบจะตรวจสอบค่านี้เฉพาะเมื่อรอบการอนุมานสดสร้างหรือตรวจสอบสิทธิ์การตั้งค่าที่ผ่านการยืนยันอีกครั้ง การทำงาน CLI ปกติไม่จำเป็นต้องใช้ค่านี้ แบ็กเอนด์ที่ไม่มีการประกาศนี้ไม่สามารถสร้างสิทธิ์การตั้งค่า CLI ที่ผ่านการยืนยันได้ การประกาศ `bundled-package-tree` จะระบุเจ้าของ `package.json` ที่แน่นอนและกำหนดให้จุดเข้าของแพ็กเกจเป็นคำสั่ง OpenClaw จะแฮชโครงสร้างแพ็กเกจที่ติดตั้งทั้งหมดภายในขอบเขต รวมถึงการขึ้นต่อกันแบบซ้อน และจะหยุดการทำงานอย่างปลอดภัยเมื่อพบลิงก์สัญลักษณ์ที่เปลี่ยนเส้นทาง ตัวเรียกใช้นอกแพ็กเกจที่ประกาศ การประกาศการขึ้นต่อกันภายนอกที่จำเป็น โครงสร้างที่มีขนาดใหญ่เกินไป และสคริปต์ที่ไม่รู้จัก ให้ประกาศค่านี้เฉพาะเมื่อโครงสร้างดังกล่าวมีการใช้งานการอนุมานที่สมบูรณ์ การผสานรวมเครื่องมือเสริมไม่ได้ทำให้กราฟการใช้งานภายนอกมีความปลอดภัย

หากแบ็กเอนด์เดียวกันมีไฟล์ปฏิบัติการเนทีฟที่ทำงานได้ในตัว ให้ระบุชื่อฐานมาตรฐานของไฟล์เหล่านั้นใน `nativeExecutableNames` คำสั่งเนทีฟอื่น ๆ จะยังคงไม่ได้รับการยืนยัน แม้ว่าผู้ใช้จะแทนที่คำสั่งของแบ็กเอนด์ก็ตาม

`ctx.executionMode` มีค่าเป็น `"agent"` สำหรับรอบการทำงานปกติ และ `"side-question"` สำหรับการเรียก `/btw` แบบชั่วคราว ใช้ค่านี้เมื่อ CLI ต้องใช้แฟล็กแบบครั้งเดียวที่แตกต่างกัน เช่น การปิดใช้งานเครื่องมือเนทีฟ การคงอยู่ของเซสชัน หรือลักษณะการทำงานของการทำต่อสำหรับ BTW หากโดยปกติแบ็กเอนด์มี `nativeToolMode: "always-on"` แต่อาร์กิวเมนต์ argv สำหรับคำถามแทรกของแบ็กเอนด์สามารถปิดใช้งานเครื่องมือเหล่านั้นได้อย่างน่าเชื่อถือ ให้ตั้งค่า `sideQuestionToolMode: "disabled"` ด้วย มิฉะนั้น OpenClaw จะหยุดทำงานแบบปิดเพื่อความปลอดภัยเมื่อ BTW ต้องเรียกใช้ CLI โดยไม่มีเครื่องมือ

ตั้งค่า `nativeToolMode: "selectable"` เฉพาะเมื่อ `resolveExecutionArgs` สามารถปิดใช้งานเครื่องมือเนทีฟของแบ็กเอนด์ทุกตัวสำหรับการทำงานแต่ละครั้งได้ สำหรับการทำงานที่ถูกจำกัดเหล่านั้น `ctx.toolAvailability.native` จะเป็นทูเพิลว่าง และ `ctx.toolAvailability.mcp` จะเป็นรายการอนุญาต MCP ที่แยกจากโฮสต์อย่างเคร่งครัด ฮุกต้องแทนที่แฟล็กเครื่องมือที่ขัดแย้งกันและส่งคืน argv ที่บังคับใช้ค่าทั้งสอง OpenClaw จะเรียกฮุกนี้หนึ่งครั้งด้วย argv สุดท้ายสำหรับการเริ่มใหม่หรือการทำต่อ และจะหยุดทำงานแบบปิดเพื่อความปลอดภัยเมื่อแบ็กเอนด์ไม่สามารถบังคับใช้ข้อจำกัดได้ ชื่อ MCP ในบริบทนี้สามารถอนุมัติโดยอัตโนมัติได้อย่างปลอดภัย เนื่องจากโฮสต์ได้จำกัดการกำหนดค่า MCP ที่สร้างขึ้นไว้เฉพาะเซิร์ฟเวอร์และเครื่องมือเหล่านั้นแล้ว

### `ownsNativeCompaction`: การเลือกไม่ใช้ Compaction ของ OpenClaw

หากแบ็กเอนด์ของคุณเรียกใช้เอเจนต์ที่ทำ Compaction ทรานสคริปต์ของ**ตนเอง** ให้ตั้งค่า `ownsNativeCompaction: true` เพื่อให้ตัวสรุปเพื่อป้องกันของ OpenClaw ไม่ทำงานกับเซสชันของแบ็กเอนด์ วงจร Compaction ของ CLI จะไม่ดำเนินการใด ๆ และรอบการทำงานจะดำเนินต่อไป `claude-cli` ประกาศค่านี้เนื่องจาก Claude Code ทำ Compaction ภายในโดยไม่มีเอนด์พอยต์ของฮาร์เนส ส่วนเซสชันฮาร์เนสเนทีฟ เช่น Codex จะยังคงถูกส่งต่อไปยังเอนด์พอยต์ Compaction ของฮาร์เนสแทน

**ประกาศค่านี้เฉพาะเมื่อเป็นไปตามเงื่อนไขทั้งหมดต่อไปนี้** มิฉะนั้นเซสชันที่เกินงบประมาณและถูกเลื่อนการประมวลผลอาจยังคงเกินงบประมาณหรือล้าสมัยได้ (OpenClaw จะไม่เข้าช่วยเหลืออีกต่อไป):

- แบ็กเอนด์ทำ Compaction หรือจำกัดขนาดทรานสคริปต์ของตนเองอย่างน่าเชื่อถือเมื่อใกล้ถึงขีดจำกัดหน้าต่าง;
- แบ็กเอนด์คงเซสชันที่สามารถทำต่อได้ เพื่อให้สถานะที่ผ่าน Compaction ยังคงอยู่ข้ามรอบการทำงาน (ตัวอย่างเช่น `--resume` / `--session-id`);
- เซสชันนั้นไม่ใช่เซสชัน Compaction ของฮาร์เนสเนทีฟ โดยเซสชันที่ตรงกับ `agentHarnessId` จะถูกส่งต่อไปยังเอนด์พอยต์ของฮาร์เนสแทน

## บริดจ์เครื่องมือ MCP

โดยค่าเริ่มต้น แบ็กเอนด์ CLI จะไม่ได้รับเครื่องมือของ OpenClaw หาก CLI สามารถใช้การกำหนดค่า MCP ได้ ให้เลือกใช้โดยชัดเจน:

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
| `claude-config-file`     | CLI ที่รับไฟล์การกำหนดค่า MCP                              |
| `codex-config-overrides` | CLI ที่รับค่าทับการกำหนดค่าผ่าน argv                        |
| `gemini-system-settings` | CLI ที่อ่านการตั้งค่า MCP จากไดเรกทอรีการตั้งค่าระบบ |

เปิดใช้งานบริดจ์เฉพาะเมื่อ CLI สามารถใช้บริดจ์นั้นได้จริง หาก CLI มีชั้นเครื่องมือในตัวของตนเองที่ไม่สามารถปิดใช้งานได้ ให้ตั้งค่า `nativeToolMode: "always-on"` เพื่อให้ OpenClaw หยุดทำงานแบบปิดเพื่อความปลอดภัยได้เมื่อผู้เรียกต้องการไม่ให้มีเครื่องมือเนทีฟ หาก CLI สามารถปิดใช้งานเครื่องมือเนทีฟทุกตัวแยกตามการทำงานแต่ละครั้งได้ ให้ใช้ `"selectable"` ร่วมกับสัญญา `resolveExecutionArgs` ข้างต้น

## การกำหนดค่าของผู้ใช้

ผู้ใช้สามารถทับค่าเริ่มต้นของแบ็กเอนด์ใด ๆ ได้:

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

จัดทำเอกสารค่าทับขั้นต่ำที่ผู้ใช้น่าจะต้องใช้ ซึ่งโดยทั่วไปคือเพียง `command` เมื่อไบนารีอยู่นอก `PATH`

## การตรวจสอบยืนยัน

สำหรับ Plugin ที่รวมมาในชุด ให้เพิ่มการทดสอบแบบเจาะจงสำหรับบิลเดอร์และการลงทะเบียนการตั้งค่า จากนั้นเรียกใช้เลนการทดสอบเป้าหมายของ Plugin:

```bash
pnpm test extensions/acme-cli
```

สำหรับ Plugin ภายในเครื่องหรือที่ติดตั้งแล้ว ให้ตรวจสอบการค้นพบและการเรียกใช้โมเดลจริงหนึ่งครั้ง:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

หากแบ็กเอนด์รองรับรูปภาพหรือ MCP ให้เพิ่มการทดสอบควันแบบใช้งานจริงที่พิสูจน์เส้นทางเหล่านั้นด้วย CLI จริง อย่าพึ่งพาการตรวจสอบแบบสแตติกสำหรับลักษณะการทำงานของพรอมป์ รูปภาพ MCP หรือการทำต่อเซสชัน

## รายการตรวจสอบ

<Check>`package.json` มี `openclaw.extensions` และรายการรันไทม์ที่สร้างแล้วสำหรับแพ็กเกจที่เผยแพร่</Check>
<Check>`openclaw.plugin.json` ประกาศ `cliBackends` และ `activation.onStartup` โดยตั้งใจ</Check>
<Check>มี `setup.cliBackends` เมื่อการตั้งค่า/การค้นพบโมเดลควรมองเห็นแบ็กเอนด์ขณะเริ่มต้นแบบเย็น</Check>
<Check>`api.registerCliBackend(...)` ใช้รหัสแบ็กเอนด์เดียวกับแมนิเฟสต์</Check>
<Check>ค่าทับของผู้ใช้ภายใต้ `agents.defaults.cliBackends.<id>` ยังคงมีผลเหนือกว่า</Check>
<Check>การตั้งค่าเซสชัน พรอมป์ระบบ รูปภาพ และตัวแยกวิเคราะห์เอาต์พุตตรงกับสัญญาของ CLI จริง</Check>
<Check>การทดสอบแบบเจาะจงและการทดสอบควันด้วย CLI จริงอย่างน้อยหนึ่งครั้งพิสูจน์เส้นทางแบ็กเอนด์</Check>

## เนื้อหาที่เกี่ยวข้อง

- [แบ็กเอนด์ CLI](/th/gateway/cli-backends) - การกำหนดค่าของผู้ใช้และลักษณะการทำงานขณะรันไทม์
- [การสร้าง Plugin](/th/plugins/building-plugins) - พื้นฐานของแพ็กเกจและแมนิเฟสต์
- [ภาพรวม Plugin SDK](/th/plugins/sdk-overview) - เอกสารอ้างอิง API การลงทะเบียน
- [แมนิเฟสต์ Plugin](/th/plugins/manifest) - `cliBackends` และตัวระบุการตั้งค่า
- [ฮาร์เนสเอเจนต์](/th/plugins/sdk-agent-harness) - รันไทม์เอเจนต์ภายนอกแบบเต็มรูปแบบ
