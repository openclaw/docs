---
read_when:
    - คุณต้องการให้บริการโมเดลจากเครื่อง GPU ของคุณเอง
    - คุณกำลังเชื่อมต่อ LM Studio หรือพร็อกซีที่เข้ากันได้กับ OpenAI
    - คุณต้องการคำแนะนำเกี่ยวกับโมเดลภายในเครื่องที่ปลอดภัยที่สุด
summary: เรียกใช้ OpenClaw บน LLM ภายในเครื่อง (LM Studio, vLLM, LiteLLM, endpoints ของ OpenAI แบบกำหนดเอง)
title: โมเดลภายในเครื่อง
x-i18n:
    generated_at: "2026-04-30T09:53:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 283da11a7896c670d3a249eeb957a252cbda7f7457bd814bb0796f3ca9956723
    source_path: gateway/local-models.md
    workflow: 16
---

Local ทำได้ แต่ OpenClaw คาดหวังบริบทขนาดใหญ่ + การป้องกัน prompt injection ที่แข็งแรง การ์ดขนาดเล็กจะตัดทอนบริบทและทำให้ความปลอดภัยรั่วไหล ตั้งเป้าให้สูง: **Mac Studio ที่อัปเกรดเต็ม ≥2 เครื่อง หรือ GPU rig เทียบเท่า (~$30k+)** GPU **24 GB** เพียงตัวเดียวเหมาะเฉพาะกับพรอมป์ที่เบากว่าและมี latency สูงกว่า ใช้ **รุ่นโมเดลที่ใหญ่ที่สุด / ขนาดเต็มที่สุดที่คุณรันได้**; checkpoint ที่ quantize หนักหรือ “เล็ก” จะเพิ่มความเสี่ยง prompt-injection (ดู [ความปลอดภัย](/th/gateway/security))

หากคุณต้องการการตั้งค่า local ที่ยุ่งยากน้อยที่สุด ให้เริ่มด้วย [LM Studio](/th/providers/lmstudio) หรือ [Ollama](/th/providers/ollama) และ `openclaw onboard` หน้านี้เป็นคู่มือเชิงความเห็นสำหรับสแต็ก local ระดับสูงกว่าและเซิร์ฟเวอร์ local ที่เข้ากันได้กับ OpenAI แบบกำหนดเอง

<Warning>
**ผู้ใช้ WSL2 + Ollama + NVIDIA/CUDA:** ตัวติดตั้ง Ollama สำหรับ Linux อย่างเป็นทางการจะเปิดใช้บริการ systemd พร้อม `Restart=always` บนการตั้งค่า WSL2 GPU การเริ่มอัตโนมัติอาจโหลดโมเดลล่าสุดซ้ำระหว่างบูตและตรึงหน่วยความจำของโฮสต์ไว้ หาก VM WSL2 ของคุณรีสตาร์ตซ้ำหลังจากเปิดใช้ Ollama ให้ดู [ลูปการแครชของ WSL2](/th/providers/ollama#wsl2-crash-loop-repeated-reboots)
</Warning>

## แนะนำ: LM Studio + โมเดล local ขนาดใหญ่ (Responses API)

สแต็ก local ที่ดีที่สุดในปัจจุบัน โหลดโมเดลขนาดใหญ่ใน LM Studio (เช่น บิลด์ Qwen, DeepSeek หรือ Llama ขนาดเต็ม), เปิดใช้เซิร์ฟเวอร์ local (ค่าเริ่มต้น `http://127.0.0.1:1234`) และใช้ Responses API เพื่อแยกการให้เหตุผลออกจากข้อความสุดท้าย

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**เช็กลิสต์การตั้งค่า**

- ติดตั้ง LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- ใน LM Studio ให้ดาวน์โหลด **บิลด์โมเดลที่ใหญ่ที่สุดที่มี** (หลีกเลี่ยงรุ่น “small”/ที่ quantize หนัก), เริ่มเซิร์ฟเวอร์, ยืนยันว่า `http://127.0.0.1:1234/v1/models` แสดงรายการโมเดลนั้น
- แทนที่ `my-local-model` ด้วย ID โมเดลจริงที่แสดงใน LM Studio
- โหลดโมเดลค้างไว้; การโหลดแบบเย็นจะเพิ่ม latency ตอนเริ่มต้น
- ปรับ `contextWindow`/`maxTokens` หากบิลด์ LM Studio ของคุณแตกต่าง
- สำหรับ WhatsApp ให้ใช้ Responses API ต่อไป เพื่อให้ส่งเฉพาะข้อความสุดท้าย

กำหนดค่าโมเดลแบบ hosted ไว้แม้จะรัน local; ใช้ `models.mode: "merge"` เพื่อให้ fallback ยังพร้อมใช้งาน

### คอนฟิกแบบไฮบริด: hosted เป็นหลัก, local เป็น fallback

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### ใช้ local ก่อน พร้อมตาข่ายนิรภัยแบบ hosted

สลับลำดับ primary และ fallback; คงบล็อก providers เดิมและ `models.mode: "merge"` ไว้ เพื่อให้คุณ fallback ไปยัง Sonnet หรือ Opus ได้เมื่อเครื่อง local ไม่พร้อมใช้งาน

### การโฮสต์ตามภูมิภาค / การกำหนดเส้นทางข้อมูล

- รุ่น Hosted MiniMax/Kimi/GLM มีบน OpenRouter พร้อม endpoint ที่ตรึงตามภูมิภาคด้วย (เช่น โฮสต์ในสหรัฐฯ) เลือกรุ่นภูมิภาคที่นั่นเพื่อให้ทราฟฟิกอยู่ในเขตอำนาจศาลที่คุณเลือก ขณะยังใช้ `models.mode: "merge"` สำหรับ fallback ของ Anthropic/OpenAI
- local-only ยังคงเป็นเส้นทางความเป็นส่วนตัวที่แข็งแรงที่สุด; การกำหนดเส้นทางแบบ hosted ตามภูมิภาคคือทางสายกลางเมื่อคุณต้องการคุณสมบัติของผู้ให้บริการแต่ต้องการควบคุมการไหลของข้อมูล

## พร็อกซี local อื่นที่เข้ากันได้กับ OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy หรือ Gateway แบบกำหนดเอง
ใช้งานได้หากเปิด endpoint แบบ OpenAI-style `/v1/chat/completions`
ใช้ adapter ของ Chat Completions เว้นแต่ backend จะระบุเอกสารชัดเจนว่า
รองรับ `/v1/responses` แทนที่บล็อก provider ด้านบนด้วย
endpoint และ ID โมเดลของคุณ:

```json5
{
  agents: {
    defaults: {
      model: { primary: "local/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

หากละเว้น `api` ใน provider แบบกำหนดเองที่มี `baseUrl` OpenClaw จะใช้ค่าเริ่มต้นเป็น
`openai-completions` endpoint แบบ loopback เช่น `127.0.0.1` จะได้รับความเชื่อถือ
โดยอัตโนมัติ; endpoint แบบ LAN, tailnet และ private DNS ยังคงต้องใช้
`request.allowPrivateNetwork: true`

ค่า `models.providers.<id>.models[].id` เป็นค่าเฉพาะภายใน provider อย่า
ใส่ prefix ของ provider ไว้ในค่านั้น ตัวอย่างเช่น เซิร์ฟเวอร์ MLX ที่เริ่มด้วย
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` ควรใช้
ID ใน catalog และ model ref นี้:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

ตั้งค่า `input: ["text", "image"]` ในโมเดล vision แบบ local หรือผ่านพร็อกซี เพื่อให้
ไฟล์แนบรูปภาพถูกฉีดเข้าไปในเทิร์นของ agent การ onboarding provider แบบกำหนดเอง
เชิงโต้ตอบจะอนุมาน ID โมเดล vision ที่พบบ่อยและถามเฉพาะชื่อที่ไม่รู้จัก
การ onboarding แบบไม่โต้ตอบใช้การอนุมานเดียวกัน; ใช้ `--custom-image-input`
สำหรับ ID vision ที่ไม่รู้จัก หรือ `--custom-text-input` เมื่อโมเดลที่ดูเหมือนรู้จักเป็น
text-only อยู่หลัง endpoint ของคุณ

คง `models.mode: "merge"` ไว้เพื่อให้โมเดลแบบ hosted พร้อมใช้งานเป็น fallback
ใช้ `models.providers.<id>.timeoutSeconds` สำหรับเซิร์ฟเวอร์โมเดล local หรือ remote
ที่ช้า ก่อนเพิ่ม `agents.defaults.timeoutSeconds` timeout ของ provider
ใช้กับคำขอ HTTP ของโมเดลเท่านั้น รวมถึงการเชื่อมต่อ, headers, การสตรีม body,
และการ abort ของ guarded-fetch ทั้งหมด

<Note>
สำหรับ provider แบบกำหนดเองที่เข้ากันได้กับ OpenAI การเก็บ marker local ที่ไม่ใช่ความลับ เช่น `apiKey: "ollama-local"` จะยอมรับได้เมื่อ `baseUrl` resolve เป็น loopback, LAN ส่วนตัว, `.local` หรือ hostname เปล่า OpenClaw จะถือว่านี่เป็น credential local ที่ถูกต้องแทนการรายงานว่าขาด key ใช้ค่าจริงสำหรับ provider ใดก็ตามที่ยอมรับ hostname สาธารณะ
</Note>

หมายเหตุพฤติกรรมสำหรับ backend `/v1` แบบ local/ผ่านพร็อกซี:

- OpenClaw ถือว่าสิ่งเหล่านี้เป็นเส้นทางที่เข้ากันได้กับ OpenAI แบบ proxy-style ไม่ใช่
  endpoint OpenAI แบบ native
- การปรับรูปแบบคำขอเฉพาะ OpenAI แบบ native จะไม่ใช้ที่นี่: ไม่มี
  `service_tier`, ไม่มี Responses `store`, ไม่มีการปรับรูปแบบ payload
  reasoning-compat ของ OpenAI และไม่มี hint ของ prompt-cache
- header การระบุที่มาของ OpenClaw ที่ซ่อนอยู่ (`originator`, `version`, `User-Agent`)
  จะไม่ถูกฉีดใน URL พร็อกซีแบบกำหนดเองเหล่านี้

หมายเหตุความเข้ากันได้สำหรับ backend ที่เข้ากันได้กับ OpenAI แต่เข้มงวดกว่า:

- บางเซิร์ฟเวอร์ยอมรับเฉพาะ `messages[].content` ที่เป็น string บน Chat Completions ไม่ใช่
  อาร์เรย์ content-part แบบมีโครงสร้าง ตั้งค่า
  `models.providers.<provider>.models[].compat.requiresStringContent: true` สำหรับ
  endpoint เหล่านั้น
- โมเดล local บางตัวปล่อยคำขอเครื่องมือแบบข้อความที่อยู่ในวงเล็บเหลี่ยมแยกต่างหาก เช่น
  `[tool_name]` ตามด้วย JSON และ `[END_TOOL_REQUEST]` OpenClaw จะยกระดับ
  สิ่งเหล่านั้นให้เป็น tool calls จริงเฉพาะเมื่อชื่อตรงกับเครื่องมือที่ลงทะเบียนไว้
  สำหรับเทิร์นนั้นทุกประการ; ไม่เช่นนั้นบล็อกจะถือว่าเป็นข้อความที่ไม่รองรับและจะ
  ถูกซ่อนจากคำตอบที่ผู้ใช้เห็น
- หากโมเดลปล่อย JSON, XML หรือข้อความแบบ ReAct ที่ดูเหมือน tool call
  แต่ provider ไม่ได้ปล่อย invocation แบบมีโครงสร้าง OpenClaw จะคงไว้เป็น
  ข้อความและบันทึก warning พร้อม run id, provider/model, pattern ที่ตรวจพบ และ
  ชื่อเครื่องมือเมื่อมี ให้ถือว่านั่นเป็นความไม่เข้ากันของ tool-call ของ provider/model
  ไม่ใช่การรันเครื่องมือที่เสร็จสมบูรณ์
- หากเครื่องมือปรากฏเป็นข้อความของ assistant แทนที่จะถูกรัน เช่น raw JSON,
  XML, syntax แบบ ReAct หรืออาร์เรย์ `tool_calls` ที่ว่างใน response ของ provider
  ให้ตรวจสอบก่อนว่าเซิร์ฟเวอร์ใช้ chat template/parser ที่รองรับ tool-call หรือไม่ สำหรับ
  backend Chat Completions ที่เข้ากันได้กับ OpenAI ซึ่ง parser ทำงานเฉพาะเมื่อบังคับใช้เครื่องมือ
  ให้ตั้งค่า request override ต่อโมเดลแทนการพึ่งพาการ parse ข้อความ:

  ```json5
  {
    agents: {
      defaults: {
        models: {
          "local/my-local-model": {
            params: {
              extra_body: {
                tool_choice: "required",
              },
            },
          },
        },
      },
    },
  }
  ```

  ใช้สิ่งนี้เฉพาะกับโมเดล/เซสชันที่ทุกเทิร์นปกติควรเรียกเครื่องมือ
  ค่านี้ override ค่า proxy เริ่มต้นของ OpenClaw ที่เป็น `tool_choice: "auto"`
  แทนที่ `local/my-local-model` ด้วย provider/model ref ที่ตรงทุกประการตามที่
  `openclaw models list` แสดง

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- หากโมเดลแบบกำหนดเองที่เข้ากันได้กับ OpenAI ยอมรับ reasoning efforts ของ OpenAI
  ที่นอกเหนือจากโปรไฟล์ในตัว ให้ประกาศไว้ในบล็อก compat ของโมเดล การเพิ่ม `"xhigh"`
  ที่นี่จะทำให้ `/think xhigh`, session pickers, การตรวจสอบของ Gateway และการตรวจสอบ `llm-task`
  แสดงระดับนี้สำหรับ provider/model ref ที่กำหนดค่าไว้:

  ```json5
  {
    models: {
      providers: {
        local: {
          baseUrl: "http://127.0.0.1:8000/v1",
          apiKey: "sk-local",
          api: "openai-responses",
          models: [
            {
              id: "gpt-5.4",
              name: "GPT 5.4 via local proxy",
              reasoning: true,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 196608,
              maxTokens: 8192,
              compat: {
                supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
                reasoningEffortMap: { xhigh: "xhigh" },
              },
            },
          ],
        },
      },
    },
  }
  ```

- backend local ขนาดเล็กกว่าหรือเข้มงวดกว่าบางตัวไม่เสถียรกับรูปแบบพรอมป์
  agent-runtime แบบเต็มของ OpenClaw โดยเฉพาะเมื่อรวม schema เครื่องมือไว้ด้วย ให้
  ตรวจสอบเส้นทาง provider ด้วย probe local แบบเบาก่อน:

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  หากต้องการตรวจสอบเส้นทาง Gateway โดยไม่ใช้รูปแบบพรอมป์ agent แบบเต็ม ให้ใช้
  probe โมเดลของ Gateway แทน:

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  probe โมเดลทั้งแบบ local และ Gateway ส่งเฉพาะพรอมป์ที่ให้มาเท่านั้น
  probe ของ Gateway ยังคงตรวจสอบการกำหนดเส้นทาง Gateway, auth และการเลือก provider
  แต่จงใจข้าม transcript ของเซสชันก่อนหน้า, บริบท AGENTS/bootstrap,
  การประกอบ context-engine, เครื่องมือ และเซิร์ฟเวอร์ MCP ที่ bundled ไว้

  หากสำเร็จแต่รอบการทำงานของเอเจนต์ OpenClaw ตามปกติล้มเหลว ก่อนอื่นให้ลอง
  `agents.defaults.experimental.localModelLean: true` เพื่อลดเครื่องมือเริ่มต้น
  ที่หนัก เช่น `browser`, `cron` และ `message`; นี่เป็นแฟล็กทดลอง
  ไม่ใช่การตั้งค่าโหมดเริ่มต้นที่เสถียร ดู
  [ฟีเจอร์ทดลอง](/th/concepts/experimental-features) หากยังล้มเหลว ให้ลอง
  `models.providers.<provider>.models[].compat.supportsTools: false`

- หากแบ็กเอนด์ยังล้มเหลวเฉพาะในการรัน OpenClaw ขนาดใหญ่ ปัญหาที่เหลือ
  มักเป็นความจุของโมเดล/เซิร์ฟเวอร์ต้นทางหรือบั๊กของแบ็กเอนด์ ไม่ใช่
  ชั้นการขนส่งของ OpenClaw

## การแก้ปัญหา

- Gateway เข้าถึงพร็อกซีได้หรือไม่? `curl http://127.0.0.1:1234/v1/models`
- โมเดล LM Studio ถูกยกเลิกการโหลดหรือไม่? โหลดใหม่; การเริ่มแบบเย็นเป็นสาเหตุ “ค้าง” ที่พบบ่อย
- เซิร์ฟเวอร์ local แจ้งว่า `terminated`, `ECONNRESET` หรือปิดสตรีมกลางรอบหรือไม่?
  OpenClaw บันทึก `model.call.error.failureKind` ที่มีจำนวนค่าจำกัดพร้อม
  สแนปช็อต RSS/heap ของโปรเซส OpenClaw ในข้อมูลวินิจฉัย สำหรับภาวะหน่วยความจำตึงตัวของ LM Studio/Ollama
  ให้นำเวลานั้นไปเทียบกับบันทึกเซิร์ฟเวอร์หรือบันทึก crash /
  jetsam ของ macOS เพื่อยืนยันว่าเซิร์ฟเวอร์โมเดลถูกฆ่าหรือไม่
- OpenClaw อนุมานค่าเกณฑ์ preflight ของหน้าต่างบริบทจากหน้าต่างโมเดลที่ตรวจพบ หรือจากหน้าต่างโมเดลที่ไม่ถูกจำกัดเมื่อ `agents.defaults.contextTokens` ลดหน้าต่างที่มีผลจริง ระบบจะเตือนเมื่อต่ำกว่า 20% โดยมีฐานขั้นต่ำ **8k** การบล็อกแบบเด็ดขาดใช้เกณฑ์ 10% พร้อมฐานขั้นต่ำ **4k** และจำกัดไม่เกินหน้าต่างบริบทที่มีผลจริง เพื่อไม่ให้ข้อมูลเมตาโมเดลที่ใหญ่เกินไปปฏิเสธเพดานของผู้ใช้ที่ยังถูกต้อง หากเจอ preflight นี้ ให้เพิ่มขีดจำกัดบริบทของเซิร์ฟเวอร์/โมเดล หรือเลือกโมเดลที่ใหญ่กว่า
- มีข้อผิดพลาดเกี่ยวกับบริบทหรือไม่? ลด `contextWindow` หรือเพิ่มขีดจำกัดเซิร์ฟเวอร์ของคุณ
- เซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI ส่งคืน `messages[].content ... expected a string` หรือไม่?
  เพิ่ม `compat.requiresStringContent: true` ในรายการโมเดลนั้น
- การเรียก `/v1/chat/completions` ขนาดเล็กโดยตรงทำงานได้ แต่ `openclaw infer model run --local`
  ล้มเหลวกับ Gemma หรือโมเดล local อื่นหรือไม่? ตรวจ URL ของผู้ให้บริการ, ref ของโมเดล, เครื่องหมาย auth
  และบันทึกเซิร์ฟเวอร์ก่อน; `model run` แบบ local ไม่รวมเครื่องมือของเอเจนต์
  หาก `model run` แบบ local สำเร็จแต่รอบการทำงานของเอเจนต์ที่ใหญ่กว่าล้มเหลว ให้ลดพื้นผิวเครื่องมือของเอเจนต์
  ด้วย `localModelLean` หรือ `compat.supportsTools: false`
- การเรียกเครื่องมือปรากฏเป็นข้อความ JSON/XML/ReAct ดิบ หรือผู้ให้บริการส่งคืนอาร์เรย์
  `tool_calls` ว่างหรือไม่? อย่าเพิ่มพร็อกซีที่แปลงข้อความของ assistant
  เป็นการเรียกใช้เครื่องมือแบบสุ่มสี่สุ่มห้า ให้แก้ chat template/parser ของเซิร์ฟเวอร์ก่อน หาก
  โมเดลทำงานได้เฉพาะเมื่อบังคับใช้เครื่องมือ ให้เพิ่มการเขียนทับรายโมเดล
  `params.extra_body.tool_choice: "required"` ด้านบน และใช้รายการโมเดลนั้น
  เฉพาะกับเซสชันที่คาดว่าจะมีการเรียกเครื่องมือในทุก ๆ รอบ
- ความปลอดภัย: โมเดล local จะข้ามตัวกรองฝั่งผู้ให้บริการ; จำกัดขอบเขตเอเจนต์ให้แคบและเปิด Compaction ไว้เพื่อลดรัศมีผลกระทบของ prompt injection

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [การ failover ของโมเดล](/th/concepts/model-failover)
