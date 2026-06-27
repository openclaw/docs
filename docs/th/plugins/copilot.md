---
read_when:
    - คุณต้องการใช้ฮาร์เนส GitHub Copilot SDK สำหรับเอเจนต์
    - คุณต้องมีตัวอย่างการกำหนดค่าสำหรับรันไทม์ `copilot`
    - คุณกำลังเชื่อมต่อเอเจนต์กับ Copilot แบบสมัครสมาชิก (github / openclaw / copilot) และต้องการให้เรียกใช้ผ่าน Copilot CLI
summary: เรียกใช้รอบการทำงานของ agent แบบฝังตัวของ OpenClaw ผ่าน harness ของ GitHub Copilot SDK ภายนอก
title: ฮาร์เนส Copilot SDK
x-i18n:
    generated_at: "2026-06-27T17:54:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a052cc21130b680f6af9ae32bc1dbaeaa15be5092939f0c236515a3233ab9b
    source_path: plugins/copilot.md
    workflow: 16
---

Plugin ภายนอก `@openclaw/copilot` ช่วยให้ OpenClaw เรียกเทิร์นของเอเจนต์
Copilot แบบสมัครสมาชิกที่ฝังอยู่ผ่าน GitHub Copilot CLI (`@github/copilot-sdk`)
แทน PI harness ในตัว

ใช้ Copilot SDK harness เมื่อคุณต้องการให้เซสชัน Copilot CLI เป็นเจ้าของ
ลูปเอเจนต์ระดับล่าง: การเรียกใช้เครื่องมือแบบเนทีฟ, compaction แบบเนทีฟ
(`infiniteSessions`) และสถานะเธรดที่ CLI จัดการภายใต้ `copilotHome`
OpenClaw ยังคงเป็นเจ้าของช่องแชท, ไฟล์เซสชัน, การเลือกโมเดล, เครื่องมือไดนามิกของ OpenClaw
(เชื่อมผ่านบริดจ์), การอนุมัติ, การส่งสื่อ, มิเรอร์ทรานสคริปต์ที่มองเห็นได้,
คำถามเสริม `/btw` (จัดการโดย PI fallback ในทรี — ดู
[คำถามเสริม (`/btw`)](#side-questions-btw)) และ `openclaw doctor`

สำหรับการแบ่งโมเดล/ผู้ให้บริการ/รันไทม์ในภาพรวม ให้เริ่มที่
[รันไทม์เอเจนต์](/th/concepts/agent-runtimes)

## ข้อกำหนด

- OpenClaw ที่ติดตั้ง Plugin `@openclaw/copilot` แล้ว
- หากคอนฟิกของคุณใช้ `plugins.allow` ให้รวม `copilot` (id ใน manifest
  ที่ Plugin ประกาศไว้) allowlist แบบจำกัดที่ใช้ชื่อแพ็กเกจ npm แบบ
  `@openclaw/copilot` จะทำให้ Plugin ถูกบล็อกและรันไทม์จะไม่โหลด
  แม้มี `agentRuntime.id: "copilot"` ก็ตาม
- การสมัครสมาชิก GitHub Copilot ที่สามารถขับเคลื่อน Copilot CLI ได้ (หรือรายการ
  env / โปรไฟล์ auth `gitHubToken` สำหรับการรันแบบ headless / cron)
- ไดเรกทอรี `copilotHome` ที่เขียนได้ harness ตั้งค่าเริ่มต้นเป็น
  `<agentDir>/copilot` เมื่อ OpenClaw ให้ไดเรกทอรีเอเจนต์ มิฉะนั้นจะใช้
  `~/.openclaw/agents/<agentId>/copilot` เพื่อแยกต่อเอเจนต์อย่างสมบูรณ์

`openclaw doctor` รัน
[สัญญา doctor](#doctor) ของ Plugin สำหรับความเป็นเจ้าของสถานะเซสชันแบบประกาศได้และการย้ายข้อมูลเพื่อความเข้ากันได้ในอนาคต
เครื่องมือนี้ไม่รันโพรบสภาพแวดล้อมของ Copilot CLI

## การติดตั้ง Plugin

รันไทม์ Copilot เป็น Plugin ภายนอก ดังนั้นแพ็กเกจหลัก `openclaw` จึงไม่รวม
dependency `@github/copilot-sdk` หรือไบนารี CLI เฉพาะแพลตฟอร์ม
`@github/copilot-<platform>-<arch>` ของแพ็กเกจนั้น ทั้งสองอย่างรวมกันเพิ่มขนาดประมาณ
260 MB ดังนั้นให้ติดตั้งเฉพาะสำหรับเอเจนต์ที่เลือกใช้รันไทม์นี้:

```bash
openclaw plugins install @openclaw/copilot
```

วิซาร์ดจะติดตั้ง Plugin ในครั้งแรกที่คุณเลือกโมเดล
`github-copilot/*` **และ** คอนฟิกของคุณเลือกให้โมเดล (หรือผู้ให้บริการของโมเดล)
ใช้รันไทม์เอเจนต์ Copilot ผ่าน
`agentRuntime: { id: "copilot" }` (ดู [เริ่มต้นอย่างรวดเร็ว](#quickstart) ด้านล่าง)
หากไม่ได้เลือกใช้ openclaw จะใช้ผู้ให้บริการ GitHub Copilot ในตัว
และจะไม่ติดตั้ง Plugin รันไทม์

รันไทม์จะแก้ตำแหน่ง SDK ตามลำดับนี้:

1. `import("@github/copilot-sdk")` จากแพ็กเกจ `@openclaw/copilot`
   ที่ติดตั้งไว้
2. ไดเรกทอรี fallback ที่รู้จักกันดี `~/.openclaw/npm-runtime/copilot/` (เป้าหมายการติดตั้งแบบตามต้องการเดิม)

เมื่อไม่มี SDK จะแสดงข้อผิดพลาดเดียวด้วยโค้ด `COPILOT_SDK_MISSING`
และคำสั่งติดตั้ง Plugin ใหม่ด้านบน

## เริ่มต้นอย่างรวดเร็ว

ปักหมุดโมเดลหนึ่งตัว (หรือผู้ให้บริการหนึ่งราย) ไปที่ harness:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/auto",
      models: {
        "github-copilot/auto": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

ทั้งสองเส้นทางเทียบเท่ากัน ใช้ `agentRuntime.id` กับรายการโมเดลเดียว
เมื่อมีเพียงโมเดลนั้นที่ควรถูกส่งผ่าน harness; ตั้ง
`agentRuntime.id` กับผู้ให้บริการเมื่อทุกโมเดลภายใต้ผู้ให้บริการนั้นควรใช้รันไทม์นี้

`github-copilot/auto` เป็นจุดเริ่มต้นที่พกพาได้ โมเดล Copilot แบบระบุชื่อขึ้นอยู่กับ
บัญชีและนโยบายองค์กร ดังนั้นให้ปักหมุดโมเดลหลังจากยืนยันแล้วเท่านั้น
ว่า Copilot CLI ที่ยืนยันตัวตนแล้วเปิดเผยโมเดลนั้น

## ผู้ให้บริการที่รองรับ

harness ประกาศรองรับผู้ให้บริการ `github-copilot` ตามแบบแผน
(id เดียวกับที่ `extensions/github-copilot` เป็นเจ้าของ):

- `github-copilot`

นอกจากนี้ยังรองรับรายการ `models.providers` แบบกำหนดเองเมื่อโมเดลที่เลือกมี
`baseUrl` ที่ไม่ว่าง และมีรูปแบบ API หนึ่งในรายการเหล่านี้:

- `openai-responses`
- `openai-completions`
- `ollama` (completions ที่เข้ากันได้กับ OpenAI)
- `azure-openai-responses`
- `anthropic-messages`

id ผู้ให้บริการแบบเนทีฟ เช่น `openai`, `anthropic`, `google` และ `ollama` ยังคง
เป็นของรันไทม์เนทีฟของตน ใช้ id ผู้ให้บริการแบบกำหนดเองที่ต่างออกไปเมื่อกำหนดเส้นทาง
endpoint ผ่าน Copilot BYOK

endpoint Copilot BYOK ต้องเป็น URL HTTPS บนเครือข่ายสาธารณะ harness ให้
Copilot SDK ใช้ URL พร็อกซี local loopback ต่อความพยายามหนึ่งครั้ง จากนั้นส่งต่อทราฟฟิกผู้ให้บริการ
ผ่านเส้นทาง fetch ที่ OpenClaw ป้องกันไว้ เพื่อให้ DNS pinning และนโยบาย SSRF ยังคง
เป็นของ OpenClaw ใช้รันไทม์ OpenClaw แบบเนทีฟสำหรับ Ollama, LM Studio,
หรือเซิร์ฟเวอร์โมเดลบน LAN

## BYOK

Copilot BYOK ใช้สัญญาผู้ให้บริการแบบกำหนดเองระดับเซสชันของ SDK OpenClaw
ส่ง endpoint โมเดลที่แก้แล้ว, API key, โหมด bearer-token, headers, id โมเดล
และขีดจำกัดบริบท/เอาต์พุต โดยไม่ย้ายลอจิกการส่งข้อมูลของผู้ให้บริการเข้าไปใน
core

ตัวอย่าง:

```json5
{
  agents: {
    defaults: {
      model: "custom-proxy/llama-3.1-8b",
      models: {
        "custom-proxy/llama-3.1-8b": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "https://api.example.com/v1",
        apiKey: "${CUSTOM_PROXY_API_KEY}",
        api: "openai-responses",
        authHeader: true,
        models: [{ id: "llama-3.1-8b", name: "Llama 3.1 8B" }],
      },
    },
  },
}
```

เซสชัน BYOK ใช้คีย์แยกจากเซสชันสมัครสมาชิก และจาก endpoint หรือ fingerprint
ของข้อมูลรับรองอื่น การหมุนเวียนคีย์, headers, โมเดล หรือ
endpoint จะสร้างเซสชัน Copilot SDK ใหม่แทนที่จะกลับมาใช้สถานะที่เข้ากันไม่ได้ต่อ

## Auth

ลำดับความสำคัญต่อเอเจนต์ ซึ่งใช้ระหว่าง `runCopilotAttempt`:

1. **`useLoggedInUser: true` แบบระบุชัดเจน** ในอินพุตความพยายาม ใช้ผู้ใช้ที่ล็อกอินใน
   Copilot CLI ซึ่งแก้ภายใต้ `copilotHome` ของเอเจนต์
2. **`gitHubToken` แบบระบุชัดเจน** ในอินพุตความพยายาม (พร้อม `profileId` +
   `profileVersion`) เหมาะสำหรับการเรียก CLI โดยตรงและการทดสอบที่
   ผู้เรียกต้องการข้ามการแก้ auth-profile
3. **`resolvedApiKey` + `authProfileId` ที่แก้ตามสัญญา** จากรูปทรง
   `EmbeddedRunAttemptParams` นี่คือ **เส้นทางหลักของ production**:
   core แก้โปรไฟล์ auth `github-copilot` ที่คอนฟิกไว้ของเอเจนต์
   (ผ่าน `src/infra/provider-usage.auth.ts:resolveProviderAuths`) ก่อน
   เรียก harness และ harness ใช้ทั้งสองฟิลด์โดยตรง
   สิ่งนี้ทำให้โปรไฟล์ auth `github-copilot:<profile>` ทำงานครบวงจร
   สำหรับการตั้งค่าแบบ headless / cron / หลายโปรไฟล์โดยไม่ต้องใช้ env vars
4. **env-var fallback** สำหรับการรัน CLI โดยตรง / dogfood ที่ไม่มีการคอนฟิก
   โปรไฟล์ auth รันไทม์ตรวจสอบ vars ต่อไปนี้ตามลำดับความสำคัญ
   โดยสะท้อนผู้ให้บริการ `github-copilot` ที่จัดส่งแล้ว
   (`extensions/github-copilot/auth.ts`) และการตั้งค่า Copilot SDK
   ที่บันทึกไว้ในเอกสาร:
   1. `OPENCLAW_GITHUB_TOKEN` -- การ override เฉพาะ harness; ตั้งค่านี้
      เพื่อปักหมุด token สำหรับ OpenClaw harness โดยไม่รบกวน
      คอนฟิก `gh` / Copilot CLI ทั้งระบบ
   2. `COPILOT_GITHUB_TOKEN` -- env var มาตรฐานของ Copilot SDK / CLI
   3. `GH_TOKEN` -- env var มาตรฐานของ `gh` CLI (ตรงกับลำดับความสำคัญของ
      ผู้ให้บริการ `github-copilot` ที่มีอยู่)
   4. `GITHUB_TOKEN` -- fallback token GitHub ทั่วไป

   ค่าที่ไม่ว่างค่าแรกจะชนะ; สตริงว่างถือว่า
   ไม่มีอยู่ id โปรไฟล์พูลที่สังเคราะห์ขึ้นคือ `env:<NAME>` และ
   profileVersion เป็น fingerprint sha256 ที่ย้อนกลับไม่ได้ของ
   token ดังนั้นการหมุนเวียนค่า env จะล้างพูลไคลเอนต์ได้อย่างเรียบร้อย

5. **`useLoggedInUser` เริ่มต้น** เมื่อไม่มีสัญญาณ token

แต่ละเอเจนต์จะได้ `copilotHome` แยกเฉพาะเพื่อให้ token, เซสชัน และ
คอนฟิกของ Copilot CLI ไม่รั่วไหลระหว่างเอเจนต์บนเครื่องเดียวกัน ค่าเริ่มต้นคือ
`<agentDir>/copilot` เมื่อโฮสต์ส่งไดเรกทอรีเอเจนต์ให้ harness
(แยกสถานะ SDK ออกจาก `models.json` / `auth-profiles.json` ของ OpenClaw ใน
ไดเรกทอรีเดียวกัน) หรือ `~/.openclaw/agents/<agentId>/copilot` ในกรณีอื่น
override ด้วย `copilotHome: <path>` ในอินพุตความพยายามเมื่อคุณต้องการ
ตำแหน่งแบบกำหนดเอง (เช่น เมานต์ที่แชร์สำหรับการย้ายข้อมูล)

การทดสอบ harness แบบ live ใช้ `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` เมื่อต้องใช้ token โดยตรง
การตั้งค่า live-test ที่แชร์จะล้าง
`COPILOT_GITHUB_TOKEN`, `GH_TOKEN` และ `GITHUB_TOKEN` โดยเจตนาหลังจากเตรียมโปรไฟล์ auth จริง
ใน test home ที่แยกไว้ ดังนั้นการส่งค่า `gh auth token`
ผ่านตัวแปรเฉพาะของ live-test จะหลีกเลี่ยงการ skip ผิดพลาดโดยไม่เปิดเผย
token ต่อชุดทดสอบที่ไม่เกี่ยวข้อง

## พื้นผิวการคอนฟิก

harness อ่านคอนฟิกจากอินพุตต่อความพยายาม
(`runCopilotAttempt({...})`) รวมกับชุดค่าเริ่มต้น env ขนาดเล็กภายใน
`extensions/copilot/src/`:

- `copilotHome` — ไดเรกทอรีสถานะ CLI ต่อเอเจนต์ (ค่าเริ่มต้นอธิบายไว้ด้านบน)
- `model` — สตริงหรือ `{ provider, id, api?, baseUrl?, headers?, authHeader? }`
  เมื่อไม่ระบุ OpenClaw จะใช้การเลือกโมเดลปกติของเอเจนต์และ
  harness จะตรวจสอบว่าผู้ให้บริการที่แก้แล้วรองรับหรือไม่
- `reasoningEffort` — `"low" | "medium" | "high" | "xhigh"` แมปจาก
  การแก้ `ThinkLevel` / `ReasoningLevel` ของ OpenClaw ใน
  `auto-reply/thinking.ts`
- `infiniteSessionConfig` — override เสริมสำหรับบล็อก
  `infiniteSessions` ของ SDK ที่ขับเคลื่อนโดย `harness.compact` ค่าเริ่มต้นปลอดภัยที่จะ
  ปล่อยไว้ตามเดิม
- `hooksConfig` — คอนฟิกความเข้ากันได้ `SessionHooks` ของ Copilot SDK แบบเนทีฟที่เป็นทางเลือก
  สำหรับ callback ของ tool/MCP, user-prompt, session และ error
  แยกจาก lifecycle hooks แบบพกพาของ OpenClaw
- `permissionPolicy` — override เสริมสำหรับ handler
  `onPermissionRequest` ของ SDK ที่ใช้กับชนิดเครื่องมือ SDK ในตัว
  (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`) ค่าเริ่มต้น
  เป็น `rejectAllPolicy` เพื่อเป็นตาข่ายนิรภัย; ในทางปฏิบัติ SDK ไม่เคย
  เรียกชนิดเหล่านั้นเลย เพราะทุกเครื่องมือ OpenClaw ที่เชื่อมผ่านบริดจ์
  ลงทะเบียนด้วย `overridesBuiltInTool: true` และ
  `skipPermission: true` ดังนั้น 100% ของการเรียกเครื่องมือจะไหลผ่าน
  `execute()` ที่ OpenClaw ห่อไว้ ดู [สิทธิ์และ ask_user](#permissions-and-ask_user)
- `enableSessionTelemetry` — flag telemetry ของเซสชัน SDK ที่เป็นทางเลือก

hooks ของ Plugin OpenClaw ไม่จำเป็นต้องมีคอนฟิกความพยายามเฉพาะ Copilot
harness รัน `before_prompt_build` (และ hook ความเข้ากันได้เดิม `before_agent_start`),
`llm_input`, `llm_output` และ `agent_end` ผ่าน helper มาตรฐานของ harness
การ compaction ของ SDK ที่สำเร็จยังรัน
`before_compaction` และ `after_compaction` ด้วย เครื่องมือ OpenClaw ที่เชื่อมผ่านบริดจ์ยังคง
รัน `before_tool_call` และรายงาน `after_tool_call`; `hooksConfig` ยังคงมีไว้สำหรับ
callback เฉพาะ SDK แบบเนทีฟที่ไม่มีสิ่งเทียบเท่าแบบพกพา

ส่วนอื่นของ OpenClaw ไม่จำเป็นต้องรู้จักฟิลด์เหล่านี้ Plugin อื่น,
ช่องทาง และโค้ด core เห็นเฉพาะรูปทรงมาตรฐาน
`AgentHarnessAttemptParams` / `AgentHarnessAttemptResult`

## Compaction

เมื่อ `harness.compact` ทำงาน Copilot SDK harness จะ:

1. กลับมาใช้เซสชัน SDK ที่ติดตามไว้โดยไม่ทำงานที่ค้างอยู่ต่อ
2. เรียก RPC การ compaction ประวัติที่อยู่ในขอบเขตเซสชันของ SDK
3. ส่งคืนผลลัพธ์การ compaction ของ SDK โดยไม่เขียนไฟล์ marker ความเข้ากันได้
   ใต้ workspace

มิเรอร์ทรานสคริปต์ฝั่ง OpenClaw (ดูด้านล่าง) ยังคงรับ
ข้อความหลังการ compaction ดังนั้นประวัติแชทที่ผู้ใช้เห็นจึงยังสอดคล้องกัน

## การมิเรอร์ทรานสคริปต์

`runCopilotAttempt` เขียนซ้ำแบบคู่ข้อความที่มิเรอร์ได้ของแต่ละเทิร์นเข้าไปใน
ทรานสคริปต์ audit ของ OpenClaw ผ่าน
`extensions/copilot/src/dual-write-transcripts.ts` มิเรอร์มีขอบเขตต่อเซสชัน
(`copilot:${sessionId}`) และใช้ตัวตนต่อข้อความ
(`${role}:${sha256_16(role,content)}`) ดังนั้นการปล่อยรายการจากเทิร์นก่อนซ้ำ
จะชนกับคีย์บนดิสก์ที่มีอยู่และไม่ซ้ำซ้อน

มิเรอร์ถูกห่อด้วยการกักกันความล้มเหลวสองชั้น เพื่อให้ความล้มเหลวในการเขียน
ทรานสคริปต์ไม่ทำให้ความพยายามล้มเหลว: wrapper แบบ best-effort ภายในและ
`.catch(...)` แบบ defense-in-depth ที่ระดับความพยายาม ความล้มเหลวจะถูกบันทึก log แต่
ไม่ถูกแสดงออกมา

## คำถามเสริม (`/btw`)

`/btw` ไม่ใช่ฟีเจอร์เนทีฟบนฮาร์เนสนี้ `createCopilotAgentHarness()`
ตั้งใจปล่อยให้ `harness.runSideQuestion` เป็น undefined ดังนั้น dispatcher `/btw`
ของ OpenClaw (`src/agents/btw.ts`) จะตกไปใช้เส้นทางสำรอง PI ในซอร์สเดียวกัน
เหมือนที่ใช้กับทุก runtime ที่ไม่ใช่ Codex: model provider ที่กำหนดค่าจะถูก
เรียกโดยตรงด้วยพรอมป์คำถามเสริมสั้น ๆ แล้วสตรีมกลับผ่าน
`streamSimple` (ไม่มีเซสชัน CLI, ไม่มี pool slot เพิ่ม)

สิ่งนี้ทำให้เซสชัน Copilot CLI ถูกสงวนไว้สำหรับลูปเทิร์นหลักของเอเจนต์ และ
ทำให้พฤติกรรม `/btw` เหมือนกับ runtime อื่นที่มี PI รองรับ สัญญานี้ถูกยืนยันไว้ใน
[`extensions/copilot/harness.test.ts`](https://github.com/openclaw/openclaw/blob/main/extensions/copilot/harness.test.ts)
ภายใต้ `describe("runSideQuestion")`

## Doctor

`extensions/copilot/doctor-contract-api.ts` ถูกโหลดอัตโนมัติโดย
`src/plugins/doctor-contract-registry.ts` โดยเพิ่มสิ่งต่อไปนี้:

- `legacyConfigRules` ว่าง (ไม่มีฟิลด์ที่เลิกใช้แล้วใน MVP)
- `normalizeCompatibilityConfig` แบบ no-op (เก็บไว้เพื่อให้การเลิกใช้ฟิลด์ในอนาคต
  มีตำแหน่งในซอร์สเดียวกันที่เสถียร)
- รายการ `sessionRouteStateOwners` หนึ่งรายการที่อ้างสิทธิ์ provider `github-copilot`;
  runtime `copilot`; คีย์เซสชัน CLI `copilot`; prefix ของโปรไฟล์ auth
  `github-copilot:`

## ข้อจำกัด

- ฮาร์เนสอ้างสิทธิ์ `github-copilot` รวมถึง id ของ provider BYOK แบบกำหนดเองที่ไม่มีเจ้าของ
  id ของ provider เนทีฟที่ manifest เป็นเจ้าของจะยังอยู่กับ runtime เจ้าของเดิม แม้เมื่อ
  `agentRuntime.id` ถูกบังคับเป็น `copilot`
- ฮาร์เนสไม่ได้ส่งมอบ TUI; TUI ของ PI ไม่ได้รับผลกระทบและยังคงเป็น
  fallback สำหรับ runtime ใดก็ตามที่ไม่มีพื้นผิวคู่กัน
- สถานะเซสชัน PI จะไม่ถูกย้ายเมื่อเอเจนต์สลับไปใช้ `copilot`
  การเลือกเป็นราย attempt; เซสชัน PI ที่มีอยู่ยังคงใช้งานได้
- `ask_user` ใช้เส้นทางพรอมป์และตอบกลับของ OpenClaw แบบเดียวกับฮาร์เนส Codex
  เมื่อ Copilot SDK ขออินพุตจากผู้ใช้ OpenClaw จะโพสต์พรอมป์แบบบล็อกไปยัง
  channel/TUI ที่ใช้งานอยู่ และข้อความผู้ใช้ถัดไปในคิวจะ resolve คำขอของ SDK

## สิทธิ์และ ask_user

การบังคับใช้สิทธิ์สำหรับเครื่องมือ OpenClaw ที่เชื่อมผ่าน bridge เกิดขึ้น **ภายใน
tool wrapper** ไม่ใช่ผ่าน callback `onPermissionRequest` ของ SDK
`wrapToolWithBeforeToolCallHook` เดียวกับที่ PI ใช้
(`src/agents/pi-tools.before-tool-call.ts`) ถูกนำไปใช้โดย
`createOpenClawCodingTools` กับเครื่องมือเขียนโค้ดทุกตัว: การตรวจจับ loop,
นโยบาย Plugin ที่เชื่อถือได้, hook before-tool-call และการอนุมัติ Plugin
แบบสองเฟสผ่าน gateway (`plugin.approval.request`) ทั้งหมดทำงานด้วย
เส้นทางโค้ดเดียวกันทุกประการกับ attempt ของ PI แบบเนทีฟ

เพื่อให้ wrapper นั้นเป็นเจ้าของการตัดสินใจ SDK Tool ที่ส่งกลับโดย
`convertOpenClawToolToSdkTool` จะถูกทำเครื่องหมายด้วย:

- `overridesBuiltInTool: true` — แทนที่เครื่องมือ built-in ของ Copilot CLI
  ที่มีชื่อเดียวกัน (edit, read, write, bash, …) เพื่อให้การเรียกใช้เครื่องมือทุกครั้ง
  route กลับมายัง OpenClaw
- `skipPermission: true` — บอก SDK ไม่ให้เรียก
  `onPermissionRequest({kind: "custom-tool"})` ก่อนเรียกใช้เครื่องมือ
  `execute()` ที่ถูก wrap จะทำการตรวจนโยบาย OpenClaw ที่ละเอียดกว่า
  ภายใน; พรอมป์ระดับ SDK จะทำให้การบังคับใช้ของ OpenClaw ถูก short-circuit
  (ถ้าเรา allow-all) หรือบล็อกทุก tool call (ถ้าเรา
  reject-all) — ทั้งสองแบบไม่ตรงกับความเท่าเทียมกับ PI

ฮาร์เนส codex ในซอร์สเดียวกันใช้การแยกแบบเดียวกัน: เครื่องมือ OpenClaw
ที่เชื่อมผ่าน bridge จะถูก wrap (`extensions/codex/src/app-server/dynamic-tools.ts`) และ
ชนิดการอนุมัติเนทีฟ _ของตัว_ codex-app-server เอง
(`item/commandExecution/requestApproval`,
`item/fileChange/requestApproval`,
`item/permissions/requestApproval`) จะถูก route ผ่าน
`plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`) สิ่งที่เทียบเท่าใน Copilot SDK
คือ `rejectAllPolicy` แบบ fail-closed สำหรับ kind ที่ไม่ใช่ `custom-tool`
ใดก็ตามที่ไปถึง `onPermissionRequest` ซึ่งเป็น safety net แบบเดียวกัน
และในทางปฏิบัติจะไม่ถูกเรียก เพราะ `overridesBuiltInTool: true`
แทนที่ built-in ทุกตัว

เพื่อให้ชั้น wrapped-tool ตัดสินใจด้านนโยบายได้เทียบเท่า PI
ฮาร์เนสจะส่งต่อบริบท PI attempt-tool แบบเต็มไปยัง
`createOpenClawCodingTools` — ตัวตน (`senderIsOwner`,
`memberRoleIds`, `ownerOnlyToolAllowlist`, …), channel/routing
(`groupId`, `currentChannelId`, `replyToMode`, toggle ของ message-tool),
auth (`authProfileStore`), ตัวตนของ run
(`sessionKey`/`runSessionKey` ที่ derive จาก `sandboxSessionKey`,
`runId`), บริบทโมเดล (`modelApi`, `modelContextWindowTokens`,
`modelCompat`, `modelHasVision`) และ hook ของ run (`onToolOutcome`,
`onYield`) หากไม่มีฟิลด์เหล่านี้ allowlist แบบ owner-only จะ
ทำตัวเป็น deny-by-default อย่างเงียบ ๆ, นโยบาย plugin-trust จะไม่สามารถ resolve ไปยัง
scope ที่ถูกต้อง และ `session_status: "current"` จะ resolve ไปยัง
คีย์ sandbox ที่ล้าสมัย ตัวสร้าง bridge อยู่ที่
`extensions/copilot/src/tool-bridge.ts` และ mirror การเรียกที่ authoritative ของ PI ที่
`src/agents/pi-embedded-runner/run/attempt.ts:1029-1117` `runAttempt`
resolve บริบท sandbox ผ่าน seam ร่วม
`resolveSandboxContext` อยู่แล้ว, ส่ง working directory ที่มีผลจริงให้ SDK,
และส่งต่อ `sandbox` รวมถึง workspace สำหรับ subagent-spawn เข้าไปยัง
tool bridge นอกจากนี้ bridge ยังส่งต่อ control สำหรับการสร้างเครื่องมือแบบมีขอบเขต
ที่บังคับใช้ได้ที่ boundary ของ SDK: `includeCoreTools`,
allowlist เครื่องมือของ runtime และ `toolConstructionPlan`

bridge ยังใช้ helper พื้นผิวเครื่องมือของฮาร์เนสที่ใช้ร่วมกันจาก
`openclaw/plugin-sdk/agent-harness-tool-runtime` เพื่อให้เท่าเทียมกับ PI เมื่อเปิดใช้
tool-search SDK จะเห็นเครื่องมือควบคุมขนาดกะทัดรัดพร้อมตัว executor catalog ที่ซ่อนอยู่
แทนที่จะเห็น schema เครื่องมือ OpenClaw ทุกตัว เมื่อเปิดใช้ code mode
helper จะสร้างพื้นผิวควบคุม code-mode และ lifecycle ของ catalog แบบเดียวกับที่
ฮาร์เนสเอเจนต์อื่นใช้ ค่าเริ่มต้นแบบ lean สำหรับโมเดลโลคัล,
การกรอง schema ที่เข้ากันได้กับ runtime, การ hydrate ไดเรกทอรี และการ cleanup
catalog ทั้งหมดยังคงอยู่ใน helper ร่วม เพื่อให้ฮาร์เนส Copilot และ
ฮาร์เนสที่อยู่ใกล้กับ Codex ไม่ drift ออกจากกัน

### โทเคน GitHub ระดับเซสชัน

สัญญาของ Copilot SDK แยกโทเคน GitHub **ระดับไคลเอนต์**
(`CopilotClientOptions.gitHubToken`, ใช้เพื่อ authenticate โปรเซส
CLI เอง) ออกจากโทเคน **ระดับเซสชัน**
(`SessionConfig.gitHubToken`, ซึ่งกำหนด content exclusion,
model routing และ quota สำหรับเซสชันนั้น และได้รับการเคารพทั้งใน
`createSession` และ `resumeSession`) ฮาร์เนส resolve auth หนึ่งครั้ง
ผ่าน `resolveCopilotAuth` และตั้งค่าทั้งสองฟิลด์เมื่อโหมด auth เป็น
`gitHubToken` (`auth.gitHubToken` แบบ explicit หรือ
`resolvedApiKey` ที่ resolve ตามสัญญาจากโปรไฟล์ auth `github-copilot`
ที่กำหนดค่าไว้) เมื่อโหมดที่ resolve ได้เป็น `useLoggedInUser` ฟิลด์ระดับเซสชัน
จะถูกละไว้ เพื่อให้ SDK ยังคง derive ตัวตนจากตัวตนที่ล็อกอินอยู่

`ask_user` ใช้ `SessionConfig.onUserInputRequest` bridge รับ
index หรือ label ของ choice สำหรับคำขอ fixed-choice, รับคำตอบแบบ free-form
เมื่อคำขอของ SDK อนุญาต และยกเลิกคำขอที่ pending เมื่อ OpenClaw attempt
ถูกยกเลิก

## ที่เกี่ยวข้อง

- [runtime ของเอเจนต์](/th/concepts/agent-runtimes)
- [ฮาร์เนส Codex](/th/plugins/codex-harness)
- [Plugin ฮาร์เนสเอเจนต์ (ข้อมูลอ้างอิง SDK)](/th/plugins/sdk-agent-harness)
