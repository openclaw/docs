---
read_when:
    - คุณต้องการให้บริการโมเดลจากเครื่อง GPU ของคุณเอง
    - คุณกำลังกำหนดการเชื่อมต่อ LM Studio หรือพร็อกซีที่เข้ากันได้กับ OpenAI
    - คุณต้องการคำแนะนำเกี่ยวกับโมเดลภายในเครื่องที่ปลอดภัยที่สุด
summary: เรียกใช้ OpenClaw บน LLM ภายในเครื่อง (LM Studio, vLLM, LiteLLM, เอนด์พอยต์ OpenAI แบบกำหนดเอง)
title: โมเดลภายในเครื่อง
x-i18n:
    generated_at: "2026-05-10T19:39:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83a5667aa5bef697a890b0d8b6b8f5e4de56fa3cdcdfe5a5dbb826a62b64fbcf
    source_path: gateway/local-models.md
    workflow: 16
---

โมเดลแบบ local สามารถทำได้ แต่ก็ยกระดับข้อกำหนดด้านฮาร์ดแวร์ ขนาด context และการป้องกัน prompt-injection ด้วยเช่นกัน การ์ดขนาดเล็กหรือที่ quantize อย่างหนักจะตัด context และทำให้ความปลอดภัยรั่วไหลได้ หน้านี้เป็นคู่มือเชิงแนะนำสำหรับสแตก local ระดับสูงกว่าและเซิร์ฟเวอร์ local แบบกำหนดเองที่เข้ากันได้กับ OpenAI สำหรับการเริ่มต้นใช้งานที่มีแรงเสียดทานต่ำที่สุด ให้เริ่มด้วย [LM Studio](/th/providers/lmstudio) หรือ [Ollama](/th/providers/ollama) และ `openclaw onboard`

สำหรับเซิร์ฟเวอร์ local ที่ควรเริ่มทำงานเฉพาะเมื่อโมเดลที่เลือกต้องใช้เท่านั้น โปรดดู
[บริการโมเดล local](/th/gateway/local-model-services)

## ระดับฮาร์ดแวร์ขั้นต่ำ

ตั้งเป้าให้สูง: **Mac Studio สเปกสูงสุด ≥2 เครื่อง หรือชุด GPU ที่เทียบเท่า (~$30k+)** เพื่อ agent loop ที่ใช้งานได้สบาย GPU **24 GB** เพียงตัวเดียวเหมาะเฉพาะกับ prompt ที่เบากว่าและมี latency สูงกว่าเท่านั้น ให้รัน **รุ่นที่ใหญ่ที่สุด / ขนาดเต็มที่สุดที่คุณ host ได้** เสมอ checkpoint ขนาดเล็กหรือที่ quantize อย่างหนักเพิ่มความเสี่ยงด้าน prompt-injection (ดู [ความปลอดภัย](/th/gateway/security))

## เลือก backend

| Backend                                              | ใช้เมื่อ                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/th/providers/lmstudio)                     | การตั้งค่า local ครั้งแรก, ตัวโหลดแบบ GUI, Responses API แบบ native                    |
| [Ollama](/th/providers/ollama)                          | เวิร์กโฟลว์ CLI, คลังโมเดล, บริการ systemd แบบไม่ต้องดูแล                      |
| MLX / vLLM / SGLang                                  | การให้บริการ self-hosted throughput สูงด้วย HTTP endpoint ที่เข้ากันได้กับ OpenAI |
| LiteLLM / OAI-proxy / proxy แบบกำหนดเองที่เข้ากันได้กับ OpenAI | คุณวาง model API อื่นไว้ด้านหน้าและต้องการให้ OpenClaw ปฏิบัติกับมันเหมือน OpenAI         |

ใช้ Responses API (`api: "openai-responses"`) เมื่อ backend รองรับ (LM Studio รองรับ) มิฉะนั้นให้ใช้ Chat Completions (`api: "openai-completions"`)

<Warning>
**ผู้ใช้ WSL2 + Ollama + NVIDIA/CUDA:** ตัวติดตั้ง Ollama Linux อย่างเป็นทางการเปิดใช้บริการ systemd พร้อม `Restart=always` บนการตั้งค่า WSL2 GPU การเริ่มอัตโนมัติอาจโหลดโมเดลล่าสุดซ้ำระหว่างบูตและตรึงหน่วยความจำของ host หาก WSL2 VM ของคุณรีสตาร์ตซ้ำหลังจากเปิดใช้ Ollama โปรดดู [ลูปการล่มของ WSL2](/th/providers/ollama#wsl2-crash-loop-repeated-reboots)
</Warning>

## แนะนำ: LM Studio + โมเดล local ขนาดใหญ่ (Responses API)

สแตก local ที่ดีที่สุดในปัจจุบัน โหลดโมเดลขนาดใหญ่ใน LM Studio (เช่น build ขนาดเต็มของ Qwen, DeepSeek หรือ Llama) เปิดใช้เซิร์ฟเวอร์ local (ค่าเริ่มต้น `http://127.0.0.1:1234`) และใช้ Responses API เพื่อแยก reasoning ออกจากข้อความสุดท้าย

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

**รายการตรวจสอบการตั้งค่า**

- ติดตั้ง LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- ใน LM Studio ให้ดาวน์โหลด **build โมเดลที่ใหญ่ที่สุดที่มี** (หลีกเลี่ยงรุ่น "small"/ที่ quantize อย่างหนัก) เริ่มเซิร์ฟเวอร์ และยืนยันว่า `http://127.0.0.1:1234/v1/models` แสดงรายการโมเดลนั้น
- แทนที่ `my-local-model` ด้วย model ID จริงที่แสดงใน LM Studio
- โหลดโมเดลค้างไว้ การโหลดแบบ cold-load จะเพิ่ม latency ตอนเริ่มต้น
- ปรับ `contextWindow`/`maxTokens` หาก build ของ LM Studio ของคุณแตกต่างออกไป
- สำหรับ WhatsApp ให้ใช้ Responses API เพื่อให้ส่งเฉพาะข้อความสุดท้ายเท่านั้น

เก็บโมเดล hosted ไว้ใน config แม้จะรันแบบ local ใช้ `models.mode: "merge"` เพื่อให้ fallback ยังพร้อมใช้งาน

### Config แบบ hybrid: primary แบบ hosted, fallback แบบ local

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

### local-first พร้อมตาข่ายความปลอดภัยแบบ hosted

สลับลำดับ primary และ fallback โดยคง providers block เดิมและ `models.mode: "merge"` เพื่อให้คุณ fallback ไปยัง Sonnet หรือ Opus ได้เมื่อเครื่อง local ใช้งานไม่ได้

### การ host ตามภูมิภาค / การกำหนดเส้นทางข้อมูล

- รุ่น hosted MiniMax/Kimi/GLM ยังมีบน OpenRouter พร้อม endpoint ที่ผูกภูมิภาค (เช่น host ในสหรัฐฯ) เลือกรุ่นตามภูมิภาคที่นั่นเพื่อเก็บ traffic ไว้ในเขตอำนาจศาลที่คุณเลือก ขณะที่ยังใช้ `models.mode: "merge"` สำหรับ fallback ของ Anthropic/OpenAI
- เส้นทาง local-only ยังคงเป็นเส้นทางความเป็นส่วนตัวที่แข็งแกร่งที่สุด การกำหนดเส้นทาง hosted ตามภูมิภาคเป็นทางสายกลางเมื่อคุณต้องใช้ฟีเจอร์ของ provider แต่ยังต้องการควบคุมการไหลของข้อมูล

## Proxy local อื่นที่เข้ากันได้กับ OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy หรือ gateway แบบกำหนดเอง
ใช้งานได้หากเปิด endpoint แบบ OpenAI-style `/v1/chat/completions`
ใช้ adapter ของ Chat Completions เว้นแต่ backend จะระบุชัดเจนในเอกสารว่า
รองรับ `/v1/responses` แทนที่ provider block ด้านบนด้วย
endpoint และ model ID ของคุณ:

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

หากละ `api` ใน provider แบบกำหนดเองที่มี `baseUrl` OpenClaw จะใช้ค่าเริ่มต้นเป็น
`openai-completions` endpoint แบบ loopback เช่น `127.0.0.1` จะถูกเชื่อถือ
โดยอัตโนมัติ endpoint บน LAN, tailnet และ DNS ส่วนตัวยังคงต้องใช้
`request.allowPrivateNetwork: true`

ค่า `models.providers.<id>.models[].id` เป็นค่าเฉพาะภายใน provider อย่า
ใส่ prefix ของ provider ไว้ในค่านั้น ตัวอย่างเช่น เซิร์ฟเวอร์ MLX ที่เริ่มด้วย
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` ควรใช้
catalog id และ model ref นี้:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

ตั้งค่า `input: ["text", "image"]` บนโมเดล vision แบบ local หรือผ่าน proxy เพื่อให้
image attachment ถูกฉีดเข้าไปใน turn ของ agent การ onboarding provider แบบกำหนดเองเชิงโต้ตอบ
จะอนุมาน ID โมเดล vision ทั่วไปและถามเฉพาะชื่อที่ไม่รู้จัก
การ onboarding แบบไม่โต้ตอบใช้การอนุมานเดียวกัน ใช้ `--custom-image-input`
สำหรับ vision ID ที่ไม่รู้จัก หรือ `--custom-text-input` เมื่อโมเดลที่ดูเหมือนรู้จัก
เป็นแบบ text-only อยู่หลัง endpoint ของคุณ

คง `models.mode: "merge"` ไว้เพื่อให้โมเดล hosted ยังพร้อมใช้งานเป็น fallback
ใช้ `models.providers.<id>.timeoutSeconds` สำหรับเซิร์ฟเวอร์โมเดล local หรือ remote ที่ช้า
ก่อนเพิ่ม `agents.defaults.timeoutSeconds` timeout ของ provider
ใช้เฉพาะกับคำขอ HTTP ของโมเดล รวมถึง connect, headers, body streaming,
และ abort ของ guarded-fetch ทั้งหมด

<Note>
สำหรับ provider แบบกำหนดเองที่เข้ากันได้กับ OpenAI การบันทึก marker local ที่ไม่ใช่ secret เช่น `apiKey: "ollama-local"` จะยอมรับได้เมื่อ `baseUrl` resolve ไปยัง loopback, LAN ส่วนตัว, `.local` หรือ hostname เปล่า OpenClaw จะปฏิบัติกับค่านั้นเป็น credential local ที่ถูกต้องแทนที่จะรายงานว่า key หายไป ใช้ค่าจริงสำหรับ provider ใดก็ตามที่ยอมรับ hostname สาธารณะ
</Note>

หมายเหตุพฤติกรรมสำหรับ backend `/v1` แบบ local/ผ่าน proxy:

- OpenClaw ปฏิบัติกับสิ่งเหล่านี้เป็น route ที่เข้ากันได้กับ OpenAI แบบ proxy-style ไม่ใช่
  endpoint OpenAI แบบ native
- การจัดรูปคำขอเฉพาะ OpenAI แบบ native จะไม่นำมาใช้ที่นี่: ไม่มี
  `service_tier`, ไม่มี Responses `store`, ไม่มีการจัดรูป payload
  เพื่อความเข้ากันได้กับ OpenAI reasoning และไม่มี hint ของ prompt-cache
- header attribution ของ OpenClaw ที่ซ่อนอยู่ (`originator`, `version`, `User-Agent`)
  จะไม่ถูกฉีดบน URL proxy แบบกำหนดเองเหล่านี้

หมายเหตุความเข้ากันได้สำหรับ backend ที่เข้ากันได้กับ OpenAI ที่เข้มงวดกว่า:

- บางเซิร์ฟเวอร์ยอมรับเฉพาะ `messages[].content` แบบ string บน Chat Completions ไม่ใช่
  array ของ content-part แบบมีโครงสร้าง ตั้งค่า
  `models.providers.<provider>.models[].compat.requiresStringContent: true` สำหรับ
  endpoint เหล่านั้น
- โมเดล local บางตัวปล่อยคำขอ tool แบบวงเล็บเดี่ยวเป็นข้อความ เช่น
  `[tool_name]` ตามด้วย JSON และ `[END_TOOL_REQUEST]` OpenClaw จะยกระดับ
  สิ่งเหล่านั้นเป็น tool call จริงเฉพาะเมื่อชื่อตรงกับ tool ที่ลงทะเบียนไว้
  สำหรับ turn นั้นแบบเป๊ะ ๆ มิฉะนั้น block จะถูกถือเป็นข้อความที่ไม่รองรับและจะ
  ถูกซ่อนจาก reply ที่ผู้ใช้มองเห็น
- หากโมเดลปล่อย JSON, XML หรือข้อความแบบ ReAct-style ที่ดูเหมือน tool call
  แต่ provider ไม่ได้ปล่อย invocation แบบมีโครงสร้าง OpenClaw จะปล่อยให้เป็น
  ข้อความและ log คำเตือนพร้อม run id, provider/model, pattern ที่ตรวจพบ และ
  ชื่อ tool เมื่อมี ให้ถือว่านั่นเป็นความไม่เข้ากันได้ของ tool-call ของ provider/model
  ไม่ใช่ tool run ที่เสร็จแล้ว
- หาก tool ปรากฏเป็นข้อความของ assistant แทนที่จะถูกรัน เช่น JSON ดิบ,
  XML, syntax แบบ ReAct หรือ array `tool_calls` ว่างใน response ของ provider
  ให้ตรวจสอบก่อนว่าเซิร์ฟเวอร์ใช้ chat template/parser ที่รองรับ tool-call สำหรับ
  backend OpenAI-compatible Chat Completions ที่ parser ทำงานเฉพาะเมื่อบังคับใช้ tool
  ให้ตั้งค่า request override ต่อโมเดลแทนการพึ่งพา text
  parsing:

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

  ใช้สิ่งนี้เฉพาะกับโมเดล/session ที่ทุก turn ปกติควรเรียก tool
  ค่านี้ override ค่า proxy เริ่มต้นของ OpenClaw คือ `tool_choice: "auto"`
  แทนที่ `local/my-local-model` ด้วย provider/model ref ที่ตรงตามที่แสดงโดย
  `openclaw models list`

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- หากโมเดลแบบกำหนดเองที่เข้ากันได้กับ OpenAI ยอมรับ OpenAI reasoning efforts ที่เกินกว่า
  profile ในตัว ให้ประกาศค่าเหล่านั้นบน compat block ของโมเดล การเพิ่ม `"xhigh"`
  ที่นี่จะทำให้ `/think xhigh`, ตัวเลือก session, การตรวจสอบของ Gateway และการตรวจสอบ `llm-task`
  แสดง level นั้นสำหรับ provider/model ref ที่กำหนดค่าไว้:

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

## Backend ขนาดเล็กกว่าหรือเข้มงวดกว่า

หากโมเดลโหลดได้ปกติแต่รอบการทำงานของเอเจนต์เต็มรูปแบบทำงานผิดปกติ ให้ไล่ตรวจจากบนลงล่าง — ยืนยันการรับส่งข้อมูลก่อน แล้วค่อยจำกัดพื้นผิวปัญหาให้แคบลง

1. **ยืนยันว่าโมเดลภายในเครื่องตอบสนองได้เอง** ไม่มีเครื่องมือ ไม่มีบริบทเอเจนต์:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **ยืนยันการกำหนดเส้นทางของ Gateway** ส่งเฉพาะพรอมต์ที่ระบุ — ข้ามทรานสคริปต์, AGENTS bootstrap, การประกอบ context-engine, เครื่องมือ, และเซิร์ฟเวอร์ MCP ที่บันเดิลมา แต่ยังทดสอบการกำหนดเส้นทางของ Gateway, การยืนยันตัวตน, และการเลือกผู้ให้บริการ:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **ลองใช้โหมด lean** หากโพรบทั้งสองผ่าน แต่รอบการทำงานจริงของเอเจนต์ล้มเหลวด้วยการเรียกเครื่องมือที่ผิดรูปแบบหรือพรอมต์ใหญ่เกินไป ให้เปิดใช้ `agents.defaults.experimental.localModelLean: true` โหมดนี้จะตัดเครื่องมือค่าเริ่มต้นที่หนักที่สุดสามรายการ (`browser`, `cron`, `message`) ออก เพื่อให้รูปทรงพรอมต์เล็กลงและเปราะบางน้อยลง ดู [ฟีเจอร์ทดลอง → โหมด lean สำหรับโมเดลภายในเครื่อง](/th/concepts/experimental-features#local-model-lean-mode) สำหรับคำอธิบายเต็มรูปแบบ เวลาที่ควรใช้ และวิธียืนยันว่าเปิดใช้งานอยู่

4. **ปิดใช้เครื่องมือทั้งหมดเป็นทางเลือกสุดท้าย** หากโหมด lean ยังไม่พอ ให้ตั้งค่า `models.providers.<provider>.models[].compat.supportsTools: false` สำหรับรายการโมเดลนั้น จากนั้นเอเจนต์จะทำงานกับโมเดลนั้นโดยไม่มีการเรียกเครื่องมือ

5. **หลังจากนั้น คอขวดอยู่ที่ต้นทาง** หากแบ็กเอนด์ยังล้มเหลวเฉพาะเมื่อรัน OpenClaw ขนาดใหญ่หลังจากใช้โหมด lean และ `supportsTools: false` แล้ว ปัญหาที่เหลือมักเป็นความจุของโมเดลหรือเซิร์ฟเวอร์ต้นทาง — context window, หน่วยความจำ GPU, การขับ kv-cache ออก, หรือบั๊กของแบ็กเอนด์ ณ จุดนั้นไม่ใช่ชั้นการรับส่งข้อมูลของ OpenClaw แล้ว

## การแก้ไขปัญหา

- Gateway เข้าถึงพร็อกซีได้หรือไม่? `curl http://127.0.0.1:1234/v1/models`
- โมเดล LM Studio ถูก unload อยู่หรือไม่? โหลดใหม่; cold start เป็นสาเหตุทั่วไปของอาการ "ค้าง"
- เซิร์ฟเวอร์ภายในเครื่องแจ้งว่า `terminated`, `ECONNRESET`, หรือปิดสตรีมกลางรอบการทำงานหรือไม่?
  OpenClaw จะบันทึก `model.call.error.failureKind` แบบคาร์ดินาลิตีต่ำ พร้อมสแนปชอต RSS/heap ของกระบวนการ
  OpenClaw ใน diagnostics สำหรับแรงกดดันหน่วยความจำของ LM Studio/Ollama
  ให้เทียบเวลานั้นกับบันทึกเซิร์ฟเวอร์หรือบันทึก crash /
  jetsam ของ macOS เพื่อยืนยันว่าเซิร์ฟเวอร์โมเดลถูก kill หรือไม่
- OpenClaw คำนวณเกณฑ์ preflight ของ context-window จากหน้าต่างโมเดลที่ตรวจพบ หรือจากหน้าต่างโมเดลแบบไม่ถูกจำกัดเมื่อ `agents.defaults.contextTokens` ลดหน้าต่างที่มีผลจริง ระบบจะเตือนเมื่อต่ำกว่า 20% พร้อม floor **8k** การบล็อกแบบเด็ดขาดใช้เกณฑ์ 10% พร้อม floor **4k** โดย capped ตามหน้าต่างบริบทที่มีผลจริง เพื่อไม่ให้ metadata โมเดลที่ใหญ่เกินไปปฏิเสธ user cap ที่จริงแล้วยังใช้ได้ หากชน preflight นี้ ให้เพิ่มขีดจำกัดบริบทของเซิร์ฟเวอร์/โมเดล หรือเลือกโมเดลที่ใหญ่กว่า
- มีข้อผิดพลาดบริบทหรือไม่? ลด `contextWindow` หรือเพิ่มขีดจำกัดเซิร์ฟเวอร์ของคุณ
- เซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI ส่งคืน `messages[].content ... expected a string` หรือไม่?
  เพิ่ม `compat.requiresStringContent: true` ในรายการโมเดลนั้น
- เซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI ส่งคืน `validation.keys` หรือแจ้งว่ารายการข้อความอนุญาตเฉพาะ `role` และ `content` หรือไม่?
  เพิ่ม `compat.strictMessageKeys: true` ในรายการโมเดลนั้น
- การเรียก `/v1/chat/completions` ขนาดเล็กโดยตรงทำงานได้ แต่ `openclaw infer model run --local`
  ล้มเหลวกับ Gemma หรือโมเดลภายในเครื่องอื่นหรือไม่? ตรวจ URL ผู้ให้บริการ, model ref, เครื่องหมาย auth,
  และบันทึกเซิร์ฟเวอร์ก่อน; `model run` ภายในเครื่องไม่รวมเครื่องมือเอเจนต์
  หาก `model run` ภายในเครื่องสำเร็จ แต่รอบการทำงานของเอเจนต์ที่ใหญ่กว่าล้มเหลว ให้ลดพื้นผิวเครื่องมือเอเจนต์
  ด้วย `localModelLean` หรือ `compat.supportsTools: false`
- การเรียกเครื่องมือแสดงเป็นข้อความ JSON/XML/ReAct ดิบ หรือผู้ให้บริการส่งคืนอาร์เรย์
  `tool_calls` ว่างหรือไม่? อย่าเพิ่มพร็อกซีที่แปลงข้อความ assistant
  เป็นการเรียกเครื่องมือแบบไม่ตรวจสอบ ให้แก้ chat template/parser ของเซิร์ฟเวอร์ก่อน หาก
  โมเดลทำงานได้เฉพาะเมื่อบังคับใช้เครื่องมือ ให้เพิ่ม override ต่อโมเดล
  `params.extra_body.tool_choice: "required"` ด้านบน และใช้รายการโมเดลนั้น
  เฉพาะกับเซสชันที่คาดว่าจะมีการเรียกเครื่องมือในทุกเทิร์น
- ความปลอดภัย: โมเดลภายในเครื่องข้ามตัวกรองฝั่งผู้ให้บริการ; จำกัดเอเจนต์ให้แคบและเปิด Compaction ไว้เพื่อจำกัดขอบเขตผลกระทบของ prompt injection

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [การสลับโมเดลเมื่อเกิดข้อผิดพลาด](/th/concepts/model-failover)
