---
read_when:
    - คุณกำลังสร้าง Plugin แบ็กเอนด์ AI CLI แบบโลคัล
    - คุณต้องการลงทะเบียนแบ็กเอนด์สำหรับการอ้างอิงโมเดล เช่น acme-cli/model
    - คุณต้องแมป CLI ของบุคคลที่สามเข้ากับตัวเรียกใช้สำรองแบบข้อความของ OpenClaw
sidebarTitle: CLI backend plugins
summary: สร้าง Plugin ที่ลงทะเบียนแบ็กเอนด์ CLI ของ AI ภายในเครื่อง
title: การสร้าง Plugin แบ็กเอนด์สำหรับ CLI
x-i18n:
    generated_at: "2026-07-19T07:21:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e5bce682ad5ea64c11e4447f51c0f6cb083a0f6f4b88864792b82d8ef89fa64f
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Plugin แบ็กเอนด์ CLI ช่วยให้ OpenClaw เรียกใช้ CLI AI ในเครื่องเป็นแบ็กเอนด์
สำหรับการอนุมานข้อความได้ แบ็กเอนด์จะแสดงเป็นคำนำหน้าผู้ให้บริการในการอ้างอิงโมเดล:

```text
acme-cli/acme-large
```

ใช้แบ็กเอนด์ CLI เมื่อการผสานรวมต้นทางมีให้ใช้งานอยู่แล้วในรูปคำสั่ง
ภายในเครื่อง เมื่อ CLI จัดการสถานะการเข้าสู่ระบบในเครื่อง หรือใช้เป็นทางเลือกสำรองเมื่อผู้ให้บริการ
API ไม่พร้อมใช้งาน

<Info>
  หากบริการต้นทางมี API โมเดล HTTP ตามปกติ ให้เขียน
  [Plugin ผู้ให้บริการ](/th/plugins/sdk-provider-plugins) แทน หากรันไทม์ต้นทาง
  จัดการเซสชันเอเจนต์ เหตุการณ์เครื่องมือ Compaction หรือสถานะงานเบื้องหลัง
  ทั้งหมด ให้ใช้ [ชุดควบคุมเอเจนต์](/th/plugins/sdk-agent-harness)
</Info>

## สิ่งที่ Plugin จัดการ

Plugin แบ็กเอนด์ CLI มีสัญญาสามรายการ:

| สัญญา               | ไฟล์                   | วัตถุประสงค์                                                |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| จุดเข้าของแพ็กเกจ     | `package.json`         | ชี้ OpenClaw ไปยังโมดูลรันไทม์ของ Plugin                    |
| การประกาศความเป็นเจ้าของ | `openclaw.plugin.json` | ประกาศรหัสแบ็กเอนด์ก่อนโหลดรันไทม์                           |
| การลงทะเบียนรันไทม์   | `index.ts`             | เรียก `api.registerCliBackend(...)` พร้อมค่าเริ่มต้นของคำสั่ง |

แมนิเฟสต์เป็นเมทาดาทาสำหรับการค้นหา โดยจะไม่เรียกใช้ CLI หรือลงทะเบียน
พฤติกรรมรันไทม์ พฤติกรรมรันไทม์เริ่มต้นเมื่อจุดเข้าของ Plugin เรียก
`api.registerCliBackend(...)`

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

    แพ็กเกจที่เผยแพร่ต้องมีไฟล์รันไทม์ JavaScript ที่บิลด์แล้ว หากจุดเข้า
    ของซอร์สคือ `./src/index.ts` ให้เพิ่ม `openclaw.runtimeExtensions` ที่ชี้ไปยัง
    ไฟล์ JavaScript คู่กันซึ่งบิลด์แล้ว ดูที่ [จุดเข้า](/th/plugins/sdk-entrypoints)

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
    Plugin โดยอัตโนมัติเมื่อการกำหนดค่าหรือการเลือกโมเดลกล่าวถึง `acme-cli/...`

    `setup.cliBackends` คือพื้นผิวการตั้งค่าที่ใช้ตัวอธิบายก่อน เพิ่มรายการนี้เมื่อ
    การค้นหาโมเดล การเริ่มต้นใช้งาน หรือสถานะควรรู้จักแบ็กเอนด์
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
      description: "Run Acme's local AI CLI through OpenClaw",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    รหัสแบ็กเอนด์ต้องตรงกับรายการ `cliBackends` ในแมนิเฟสต์ ส่วน
    `config` ที่ลงทะเบียนเป็นเพียงค่าเริ่มต้น การกำหนดค่าของผู้ใช้ภายใต้
    `agents.defaults.cliBackends.acme-cli` จะถูกผสานทับในขณะรันไทม์

  </Step>
</Steps>

## รูปแบบการกำหนดค่า

`CliBackendConfig` อธิบายวิธีที่ OpenClaw ควรเปิดใช้และแยกวิเคราะห์ CLI:

| ฟิลด์                                                     | การใช้งาน                                                                               |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `command`                                                 | ชื่อไบนารีหรือพาธคำสั่งแบบสัมบูรณ์                                              |
| `args`                                                    | argv พื้นฐานสำหรับการรันใหม่                                                          |
| `resumeArgs`                                              | argv ทางเลือกสำหรับเซสชันที่กลับมาทำต่อ รองรับ `{sessionId}`                       |
| `output` / `resumeOutput`                                 | ตัวแยกวิเคราะห์: `json`, `jsonl` หรือ `text`                                                |
| `jsonlDialect`                                            | รูปแบบเหตุการณ์ JSONL: `claude-stream-json` หรือ `gemini-stream-json`                 |
| `liveSession`                                             | โหมดกระบวนการ CLI ที่ทำงานระยะยาว (`claude-stdio`)                                      |
| `input`                                                   | การส่งพรอมต์: `arg` หรือ `stdin`                                                |
| `maxPromptArgChars`                                       | ความยาวสูงสุดของพรอมต์สำหรับโหมด `arg` ก่อนเปลี่ยนไปใช้ stdin                     |
| `env` / `clearEnv`                                        | ตัวแปรสภาพแวดล้อมเพิ่มเติมที่จะแทรก หรือชื่อที่จะลบออกก่อนเปิดใช้                         |
| `modelArg`                                                | แฟล็กที่ใช้ก่อนรหัสโมเดล                                                     |
| `modelAliases`                                            | จับคู่รหัสโมเดล OpenClaw กับรหัสดั้งเดิมของ CLI                                          |
| `sessionArg` / `sessionArgs`                              | วิธีส่งรหัสเซสชัน                                                          |
| `sessionMode`                                             | `always`, `existing` หรือ `none`                                                   |
| `sessionIdFields`                                         | ฟิลด์ JSON ที่ OpenClaw อ่านจากเอาต์พุต CLI                                        |
| `systemPromptArg` / `systemPromptFileArg`                 | การส่งพรอมต์ระบบ                                                           |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | การส่งผ่านค่าที่แทนที่การกำหนดค่าสำหรับไฟล์พรอมต์ระบบ (ตัวอย่างเช่น `-c`)             |
| `systemPromptMode`                                        | `append` หรือ `replace`                                                             |
| `systemPromptWhen`                                        | `first`, `always` หรือ `never`                                                     |
| `imageArg` / `imageMode`                                  | แฟล็กพาธรูปภาพและวิธีส่งหลายรูปภาพ (`repeat` หรือ `list`)              |
| `imagePathScope`                                          | ตำแหน่งเก็บไฟล์รูปภาพที่จัดเตรียมไว้ก่อนส่งมอบ: `temp` หรือ `workspace`               |
| `serialize`                                               | รักษาลำดับการรันที่ใช้แบ็กเอนด์เดียวกัน                                                    |
| `reseedFromRawTranscriptWhenUncompacted`                  | เลือกใช้การป้อนทรานสคริปต์ดิบกลับเข้าไปใหม่แบบมีขอบเขตก่อน Compaction เพื่อรีเซ็ตเซสชันอย่างปลอดภัย |
| `reliability.outputLimits`                                | จำนวนอักขระ/บรรทัด JSONL ดิบสูงสุดที่เก็บไว้สำหรับหนึ่งรอบการทำงาน CLI สด (แบ็กเอนด์เซสชันสด)  |
| `reliability.watchdog`                                    | การปรับแต่งเวลาหมดเวลาสำหรับกรณีไม่มีเอาต์พุต โดยแยกระหว่างการรันใหม่กับการรันต่อ                      |

ควรใช้การกำหนดค่าแบบคงที่ที่เล็กที่สุดซึ่งตรงกับ CLI เพิ่มคอลแบ็กของ Plugin
เฉพาะสำหรับพฤติกรรมที่ควรเป็นความรับผิดชอบของแบ็กเอนด์อย่างแท้จริง

## ฮุกขั้นสูงของแบ็กเอนด์

`CliBackendPlugin` ยังสามารถกำหนดรายการต่อไปนี้:

| ฮุก                               | การใช้งาน                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | เขียนการกำหนดค่าเดิมของผู้ใช้ใหม่หลังการผสาน                                      |
| `resolveExecutionArgs(ctx)`        | เพิ่มแฟล็กตามขอบเขตคำขอ เช่น ระดับความพยายามในการคิดหรือการแยกคำถามย่อย |
| `prepareExecution(ctx)`            | สร้างตัวเชื่อมชั่วคราวสำหรับการยืนยันตัวตน การกำหนดค่า หรือสภาพแวดล้อมก่อนเปิดใช้         |
| `transformSystemPrompt(ctx)`       | ใช้การแปลงพรอมต์ระบบขั้นสุดท้ายที่เฉพาะเจาะจงกับ CLI                          |
| `textTransforms`                   | การแทนที่พรอมต์/เอาต์พุตแบบสองทิศทาง                                    |
| `defaultAuthProfileId`             | เลือกใช้โปรไฟล์การยืนยันตัวตน OpenClaw ที่ระบุ                                     |
| `authEpochMode`                    | กำหนดว่าการเปลี่ยนแปลงการยืนยันตัวตนทำให้เซสชัน CLI ที่จัดเก็บไว้ใช้ไม่ได้อย่างไร                      |
| `nativeToolMode`                   | ประกาศว่าไม่มีเครื่องมือดั้งเดิม เปิดใช้งานเสมอ หรือโฮสต์เลือกได้      |
| `sideQuestionToolMode`             | ประกาศเครื่องมือดั้งเดิมที่ปิดใช้งานสำหรับคำถามย่อย `/btw`                     |
| `bundleMcp` / `bundleMcpMode`      | เลือกใช้บริดจ์เครื่องมือ MCP แบบลูปแบ็กของ OpenClaw                                |
| `ownsNativeCompaction`             | แบ็กเอนด์จัดการ Compaction ของตนเอง — OpenClaw จะเลื่อนการดำเนินการให้                           |
| `subscriptionAuthDispatch`         | การรันแบบฝังที่เลือกใช้ข้อมูลรับรองการสมัครสมาชิกจะดำเนินการผ่านแบ็กเอนด์นี้ |
| `runtimeArtifact`                  | จำกัดตัวเปิดใช้สคริปต์ให้อยู่ภายในโครงสร้างแพ็กเกจที่รวมมาทั้งหมด                |

ให้ฮุกเหล่านี้อยู่ภายใต้การจัดการของผู้ให้บริการ อย่าเพิ่มสาขาเฉพาะ CLI ลงในแกนหลักเมื่อ
ฮุกของแบ็กเอนด์สามารถแสดงพฤติกรรมนั้นได้

`prepareExecution(ctx)` รับ `ctx.contextTokenBudget` ซึ่งเป็นขีดจำกัดโทเค็นที่มีผล
ซึ่งเลือกไว้สำหรับการรัน แบ็กเอนด์ที่จัดการ Compaction ดั้งเดิมสามารถจับคู่งบประมาณนั้น
เข้ากับสัญญาการเปิดใช้เฉพาะ CLI ของตนได้

`runtimeArtifact` เป็นของ Plugin และผู้ใช้ไม่สามารถแทนที่ได้ ระบบจะตรวจสอบค่านี้
เฉพาะเมื่อรอบการอนุมานแบบสดสร้างหรือตรวจสอบสิทธิ์การตั้งค่าที่ผ่านการยืนยันอีกครั้งเท่านั้น
การรัน CLI ตามปกติไม่จำเป็นต้องใช้ค่านี้ แบ็กเอนด์ที่ไม่มีการประกาศนี้ไม่สามารถ
สร้างสิทธิ์การตั้งค่า CLI ที่ผ่านการยืนยันได้ การประกาศ `bundled-package-tree` จะระบุ
เจ้าของ `package.json` ที่แน่นอน และกำหนดให้ entrypoint ของแพ็กเกจเป็น
คำสั่ง OpenClaw จะแฮชโครงสร้างแพ็กเกจที่ติดตั้งทั้งหมดภายในขอบเขต รวมถึง
การขึ้นต่อกันแบบซ้อน และจะปฏิเสธโดยค่าเริ่มต้นสำหรับ symlink ที่เปลี่ยนเส้นทาง
ตัวเรียกใช้งานที่อยู่นอกแพ็กเกจที่ประกาศ การประกาศการขึ้นต่อกันภายนอกที่จำเป็น
โครงสร้างที่มีขนาดใหญ่เกินไป และสคริปต์ที่ไม่รู้จัก ให้ประกาศค่านี้เฉพาะเมื่อ
โครงสร้างดังกล่าวมีการใช้งานการอนุมานที่สมบูรณ์ทั้งหมด การผสานรวมเครื่องมือเสริม
ไม่ได้ทำให้กราฟการใช้งานภายนอกปลอดภัย

หากแบ็กเอนด์เดียวกันมีไฟล์ปฏิบัติการเนทีฟแบบครบจบในตัวด้วย ให้ระบุ
basename มาตรฐานของไฟล์เหล่านั้นใน `nativeExecutableNames` คำสั่งเนทีฟอื่น ๆ ยังคง
ไม่ผ่านการยืนยัน แม้ว่าผู้ใช้จะแทนที่คำสั่งแบ็กเอนด์ก็ตาม

`ctx.executionMode` คือ `"agent"` สำหรับรอบปกติ และ `"side-question"` สำหรับ
การเรียก `/btw` แบบชั่วคราว ใช้ค่านี้เมื่อ CLI ต้องใช้แฟล็กแบบครั้งเดียวที่แตกต่างกัน
เช่น การปิดใช้งานเครื่องมือเนทีฟ การคงอยู่ของเซสชัน หรือพฤติกรรมการทำงานต่อสำหรับ
BTW หากตามปกติแบ็กเอนด์มี `nativeToolMode: "always-on"` แต่อาร์กิวเมนต์ argv สำหรับคำถามแทรก
ปิดใช้งานเครื่องมือเหล่านั้นได้อย่างเชื่อถือได้ ให้ตั้งค่า
`sideQuestionToolMode: "disabled"` ด้วย มิฉะนั้น OpenClaw จะปฏิเสธโดยค่าเริ่มต้นเมื่อ BTW
ต้องการการรัน CLI โดยไม่มีเครื่องมือ

ตั้งค่า `nativeToolMode: "selectable"` เฉพาะเมื่อ `resolveExecutionArgs` สามารถปิดใช้งาน
เครื่องมือเนทีฟของแบ็กเอนด์ทุกตัวสำหรับการรันแต่ละครั้งได้ สำหรับการรันแบบจำกัดเหล่านั้น
`ctx.toolAvailability.native` เป็นทูเพิลว่าง และ
`ctx.toolAvailability.mcp` เป็นรายการอนุญาต MCP ที่แยกจากโฮสต์อย่างแน่นอน hook
ต้องแทนที่แฟล็กเครื่องมือที่ขัดแย้งกันและส่งคืน argv ที่บังคับใช้ค่าทั้งสอง
OpenClaw จะเรียก hook นี้หนึ่งครั้งด้วย argv สุดท้ายสำหรับการเริ่มใหม่หรือการทำงานต่อ และจะปฏิเสธโดยค่าเริ่มต้นเมื่อ
แบ็กเอนด์ไม่สามารถบังคับใช้ข้อจำกัดได้ ชื่อ MCP ในบริบทนี้สามารถ
อนุมัติโดยอัตโนมัติได้อย่างปลอดภัย เพราะโฮสต์ได้จำกัดการกำหนดค่า MCP ที่สร้างขึ้น
ไว้เฉพาะเซิร์ฟเวอร์และเครื่องมือเหล่านั้นแล้ว

### `ownsNativeCompaction`: การเลือกไม่ใช้ Compaction ของ OpenClaw

หากแบ็กเอนด์ของคุณรันเอเจนต์ที่ทำ Compaction กับทรานสคริปต์ **ของตนเอง** ให้ตั้งค่า
`ownsNativeCompaction: true` เพื่อไม่ให้ตัวสรุปเพื่อความปลอดภัยของ OpenClaw ทำงาน
กับเซสชันของแบ็กเอนด์ วงจรชีวิต Compaction ของ CLI จะไม่ดำเนินการใด ๆ และ
รอบจะดำเนินต่อไป `claude-cli` ประกาศค่านี้เนื่องจาก Claude Code ทำ Compaction
ภายในโดยไม่มี endpoint ของ harness ส่วนเซสชัน native-harness เช่น Codex
ยังคงส่งต่อไปยัง endpoint Compaction ของ harness แทน

**ประกาศค่านี้เฉพาะเมื่อเป็นไปตามเงื่อนไขทั้งหมดต่อไปนี้** มิฉะนั้นเซสชันที่เลื่อนการทำงาน
และเกินงบประมาณอาจยังคงเกินงบประมาณหรือล้าสมัยได้ (OpenClaw จะไม่
กู้คืนเซสชันดังกล่าวอีกต่อไป):

- แบ็กเอนด์ทำ Compaction หรือจำกัดทรานสคริปต์ของตนเองได้อย่างเชื่อถือได้เมื่อเข้าใกล้
  ขีดจำกัดหน้าต่าง;
- แบ็กเอนด์คงสถานะเซสชันที่ทำงานต่อได้ เพื่อให้สถานะหลัง Compaction คงอยู่ข้ามรอบ
  (ตัวอย่างเช่น `--resume` / `--session-id`);
- เซสชันดังกล่าวไม่ใช่เซสชัน Compaction แบบ native-harness โดยเซสชันที่ตรงกับ `agentHarnessId`
  จะถูกส่งไปยัง endpoint ของ harness แทน

## บริดจ์เครื่องมือ MCP

โดยค่าเริ่มต้น แบ็กเอนด์ CLI จะไม่ได้รับเครื่องมือ OpenClaw หาก CLI สามารถใช้
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
| `claude-config-file`     | CLI ที่รับไฟล์กำหนดค่า MCP                              |
| `codex-config-overrides` | CLI ที่รับค่ากำหนดแทนผ่าน argv                        |
| `gemini-system-settings` | CLI ที่อ่านการตั้งค่า MCP จากไดเรกทอรีการตั้งค่าระบบของตน |

เปิดใช้งานบริดจ์เฉพาะเมื่อ CLI สามารถใช้งานได้จริง หาก CLI มี
ชั้นเครื่องมือในตัวที่ไม่สามารถปิดใช้งานได้ ให้ตั้งค่า `nativeToolMode:
"always-on"` เพื่อให้ OpenClaw ปฏิเสธโดยค่าเริ่มต้นเมื่อผู้เรียกต้องการไม่ใช้เครื่องมือเนทีฟ
หากสามารถปิดใช้งานเครื่องมือเนทีฟทุกตัวต่อการรันได้ ให้ใช้ `"selectable"` ร่วมกับ
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

จัดทำเอกสารค่าที่ผู้ใช้น่าจะต้องแทนที่อย่างน้อยที่สุด ซึ่งโดยทั่วไปมีเพียง
`command` เมื่อไบนารีอยู่นอก `PATH`

## การตรวจสอบยืนยัน

สำหรับ Plugin ที่รวมมาให้ ให้เพิ่มการทดสอบเฉพาะจุดสำหรับ builder และการลงทะเบียน
การตั้งค่า จากนั้นรันเลนการทดสอบเฉพาะของ Plugin:

```bash
pnpm test extensions/acme-cli
```

สำหรับ Plugin ภายในเครื่องหรือที่ติดตั้งแล้ว ให้ตรวจสอบการค้นพบและการรันโมเดลจริงหนึ่งครั้ง:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "ตอบให้ตรงตามนี้: backend ok" --model acme-cli/acme-large
```

หากแบ็กเอนด์รองรับรูปภาพหรือ MCP ให้เพิ่ม smoke test แบบสดที่พิสูจน์เส้นทางเหล่านั้น
ด้วย CLI จริง อย่าพึ่งพาการตรวจสอบแบบสแตติกสำหรับพรอมต์ รูปภาพ
MCP หรือพฤติกรรมการทำงานต่อของเซสชัน

## รายการตรวจสอบ

<Check>`package.json` มี `openclaw.extensions` และรายการรันไทม์ที่สร้างแล้วสำหรับแพ็กเกจที่เผยแพร่</Check>
<Check>`openclaw.plugin.json` ประกาศ `cliBackends` และ `activation.onStartup` โดยเจตนา</Check>
<Check>มี `setup.cliBackends` เมื่อการตั้งค่า/การค้นพบโมเดลควรมองเห็นแบ็กเอนด์ในสถานะ cold</Check>
<Check>`api.registerCliBackend(...)` ใช้รหัสแบ็กเอนด์เดียวกับ manifest</Check>
<Check>ค่าที่ผู้ใช้แทนที่ภายใต้ `agents.defaults.cliBackends.<id>` ยังคงมีผลเหนือกว่า</Check>
<Check>การตั้งค่าเซสชัน พรอมต์ระบบ รูปภาพ และตัวแยกวิเคราะห์เอาต์พุตตรงกับสัญญาของ CLI จริง</Check>
<Check>การทดสอบเฉพาะจุดและ smoke test CLI แบบสดอย่างน้อยหนึ่งรายการพิสูจน์เส้นทางแบ็กเอนด์</Check>

## ที่เกี่ยวข้อง

- [แบ็กเอนด์ CLI](/th/gateway/cli-backends) - การกำหนดค่าของผู้ใช้และพฤติกรรมรันไทม์
- [การสร้าง Plugin](/th/plugins/building-plugins) - พื้นฐานแพ็กเกจและ manifest
- [ภาพรวม SDK ของ Plugin](/th/plugins/sdk-overview) - เอกสารอ้างอิง API การลงทะเบียน
- [manifest ของ Plugin](/th/plugins/manifest) - `cliBackends` และตัวอธิบายการตั้งค่า
- [harness ของเอเจนต์](/th/plugins/sdk-agent-harness) - รันไทม์เอเจนต์ภายนอกแบบเต็มรูปแบบ
