---
read_when:
    - คุณต้องการให้บริการโมเดลจากเครื่อง GPU ของคุณเอง
    - คุณกำลังตั้งค่า LM Studio หรือพร็อกซีที่เข้ากันได้กับ OpenAI
    - คุณต้องการคำแนะนำเกี่ยวกับโมเดลภายในเครื่องที่ปลอดภัยที่สุด
summary: เรียกใช้ OpenClaw บน LLM ในเครื่อง (LM Studio, vLLM, LiteLLM, endpoint OpenAI แบบกำหนดเอง)
title: โมเดลภายในเครื่อง
x-i18n:
    generated_at: "2026-05-02T22:19:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29ab8530620370e0c213714bf6fef67bafed878055102cea47935c85b6238ffb
    source_path: gateway/local-models.md
    workflow: 16
---

โมเดลภายในเครื่องทำได้จริง แต่ก็เพิ่มข้อกำหนดด้านฮาร์ดแวร์ ขนาดบริบท และการป้องกัน prompt-injection ด้วยเช่นกัน การ์ดขนาดเล็กหรือที่ quantized อย่างหนักจะตัดบริบทและลดทอนความปลอดภัย หน้านี้เป็นคู่มือแบบมีจุดยืนสำหรับสแต็กภายในเครื่องระดับสูงและเซิร์ฟเวอร์ภายในเครื่องแบบ OpenAI-compatible ที่กำหนดเอง สำหรับการเริ่มใช้งานที่มีแรงเสียดทานน้อยที่สุด ให้เริ่มด้วย [LM Studio](/th/providers/lmstudio) หรือ [Ollama](/th/providers/ollama) และ `openclaw onboard`

## ระดับฮาร์ดแวร์ขั้นต่ำ

ตั้งเป้าไว้สูง: **Mac Studios ที่จัดเต็มอย่างน้อย 2 เครื่อง หรือริก GPU ที่เทียบเท่า (~$30k+)** เพื่อให้ agent loop ทำงานได้สบาย GPU **24 GB** เพียงใบเดียวใช้ได้เฉพาะกับพรอมป์ที่เบากว่าและมี latency สูงกว่าเท่านั้น ให้รัน **ตัวแปรที่ใหญ่ที่สุด / ขนาดเต็มที่สุดที่คุณโฮสต์ได้** เสมอ checkpoint ขนาดเล็กหรือที่ quantized หนักจะเพิ่มความเสี่ยงจาก prompt-injection (ดู [ความปลอดภัย](/th/gateway/security))

## เลือก backend

| Backend                                              | ใช้เมื่อ                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/th/providers/lmstudio)                     | การตั้งค่าภายในเครื่องครั้งแรก ตัวโหลดแบบ GUI, Responses API แบบ native                    |
| [Ollama](/th/providers/ollama)                          | เวิร์กโฟลว์ CLI, ไลบรารีโมเดล, บริการ systemd ที่ไม่ต้องดูแล                      |
| MLX / vLLM / SGLang                                  | การให้บริการแบบ self-hosted ที่มี throughput สูง พร้อม endpoint HTTP แบบ OpenAI-compatible |
| LiteLLM / OAI-proxy / พร็อกซี OpenAI-compatible แบบกำหนดเอง | คุณวาง model API อื่นไว้ด้านหน้า และต้องการให้ OpenClaw ปฏิบัติกับมันเหมือน OpenAI         |

ใช้ Responses API (`api: "openai-responses"`) เมื่อ backend รองรับ (LM Studio รองรับ) มิฉะนั้นให้ใช้ Chat Completions (`api: "openai-completions"`)

<Warning>
**ผู้ใช้ WSL2 + Ollama + NVIDIA/CUDA:** ตัวติดตั้ง Ollama Linux อย่างเป็นทางการเปิดใช้งานบริการ systemd ด้วย `Restart=always` บนการตั้งค่า WSL2 GPU การเริ่มอัตโนมัติอาจโหลดโมเดลล่าสุดอีกครั้งระหว่างบูตและตรึงหน่วยความจำของโฮสต์ หาก VM WSL2 ของคุณรีสตาร์ตซ้ำหลังเปิดใช้งาน Ollama ให้ดู [ลูปการขัดข้องของ WSL2](/th/providers/ollama#wsl2-crash-loop-repeated-reboots)
</Warning>

## แนะนำ: LM Studio + โมเดลภายในเครื่องขนาดใหญ่ (Responses API)

สแต็กภายในเครื่องที่ดีที่สุดในปัจจุบัน โหลดโมเดลขนาดใหญ่ใน LM Studio (เช่น บิลด์ Qwen, DeepSeek หรือ Llama ขนาดเต็ม) เปิดใช้เซิร์ฟเวอร์ภายในเครื่อง (ค่าเริ่มต้น `http://127.0.0.1:1234`) และใช้ Responses API เพื่อแยก reasoning ออกจากข้อความสุดท้าย

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
- ใน LM Studio ให้ดาวน์โหลด **บิลด์โมเดลที่ใหญ่ที่สุดที่มี** (หลีกเลี่ยงตัวแปร “small”/ที่ quantized หนัก) เริ่มเซิร์ฟเวอร์ และยืนยันว่า `http://127.0.0.1:1234/v1/models` แสดงรายการโมเดลนั้น
- แทนที่ `my-local-model` ด้วย ID โมเดลจริงที่แสดงใน LM Studio
- ให้โมเดลโหลดค้างไว้ การโหลดแบบ cold-load จะเพิ่ม latency ตอนเริ่มต้น
- ปรับ `contextWindow`/`maxTokens` หากบิลด์ LM Studio ของคุณแตกต่างออกไป
- สำหรับ WhatsApp ให้ใช้ Responses API เพื่อให้ส่งเฉพาะข้อความสุดท้ายเท่านั้น

ให้คงการกำหนดค่าโมเดลแบบ hosted ไว้แม้ขณะรันภายในเครื่อง ใช้ `models.mode: "merge"` เพื่อให้ fallback ยังพร้อมใช้งาน

### คอนฟิกแบบผสม: hosted primary, local fallback

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

### ใช้ภายในเครื่องก่อน โดยมีตาข่ายนิรภัยแบบ hosted

สลับลำดับ primary และ fallback เก็บบล็อก providers เดิมและ `models.mode: "merge"` ไว้ เพื่อให้คุณ fallback ไปยัง Sonnet หรือ Opus ได้เมื่อกล่องภายในเครื่องล่ม

### การโฮสต์ตามภูมิภาค / การกำหนดเส้นทางข้อมูล

- ตัวแปร hosted MiniMax/Kimi/GLM ยังมีอยู่บน OpenRouter พร้อม endpoint ที่ตรึงภูมิภาค (เช่น โฮสต์ในสหรัฐฯ) เลือกตัวแปรภูมิภาคที่นั่นเพื่อให้ทราฟฟิกอยู่ในเขตอำนาจศาลที่คุณเลือก ขณะยังใช้ `models.mode: "merge"` สำหรับ fallback ของ Anthropic/OpenAI
- แบบ local-only ยังคงเป็นเส้นทางความเป็นส่วนตัวที่แข็งแกร่งที่สุด การกำหนดเส้นทางแบบ hosted regional เป็นทางสายกลางเมื่อคุณต้องการฟีเจอร์ของผู้ให้บริการ แต่ต้องการควบคุมการไหลของข้อมูล

## พร็อกซีภายในเครื่องแบบ OpenAI-compatible อื่นๆ

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy หรือ Gateway แบบกำหนดเอง
จะทำงานได้หากเปิดเผย endpoint `/v1/chat/completions` แบบ OpenAI-style
ใช้ adapter ของ Chat Completions เว้นแต่ backend จะระบุอย่างชัดเจนว่า
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

หากละ `api` ไว้ใน provider แบบกำหนดเองที่มี `baseUrl` OpenClaw จะใช้ค่าเริ่มต้นเป็น
`openai-completions` endpoint แบบ loopback เช่น `127.0.0.1` จะถูกเชื่อถือ
โดยอัตโนมัติ endpoint แบบ LAN, tailnet และ DNS ส่วนตัวยังคงต้องใช้
`request.allowPrivateNetwork: true`

ค่า `models.providers.<id>.models[].id` เป็นค่าภายใน provider อย่า
ใส่ provider prefix ไว้ตรงนั้น ตัวอย่างเช่น เซิร์ฟเวอร์ MLX ที่เริ่มด้วย
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` ควรใช้
catalog id และ model ref นี้:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

ตั้งค่า `input: ["text", "image"]` บนโมเดล vision ภายในเครื่องหรือที่ผ่านพร็อกซี เพื่อให้
แนบรูปภาพเข้าไปในเทิร์นของ agent การ onboarding provider แบบกำหนดเองแบบโต้ตอบ
จะอนุมาน ID โมเดล vision ทั่วไปและถามเฉพาะชื่อที่ไม่รู้จักเท่านั้น
การ onboarding แบบไม่โต้ตอบใช้การอนุมานเดียวกัน ใช้ `--custom-image-input`
สำหรับ ID vision ที่ไม่รู้จัก หรือ `--custom-text-input` เมื่อโมเดลที่ดูเหมือนรู้จัก
เป็นแบบ text-only อยู่หลัง endpoint ของคุณ

คง `models.mode: "merge"` ไว้เพื่อให้โมเดลแบบ hosted ยังคงพร้อมเป็น fallback
ใช้ `models.providers.<id>.timeoutSeconds` สำหรับเซิร์ฟเวอร์โมเดลภายในเครื่องหรือระยะไกลที่ช้า
ก่อนเพิ่ม `agents.defaults.timeoutSeconds` timeout ของ provider
ใช้เฉพาะกับคำขอ HTTP ของโมเดล รวมถึง connect, headers, body streaming
และการ abort แบบ guarded-fetch ทั้งหมด

<Note>
สำหรับ provider แบบ OpenAI-compatible ที่กำหนดเอง การคง marker ภายในเครื่องที่ไม่ใช่ secret เช่น `apiKey: "ollama-local"` เป็นที่ยอมรับเมื่อ `baseUrl` resolve ไปยัง loopback, LAN ส่วนตัว, `.local` หรือ hostname เปล่า OpenClaw จะถือว่าเป็น credential ภายในเครื่องที่ถูกต้องแทนที่จะรายงานว่าขาด key ใช้ค่าจริงสำหรับ provider ใดก็ตามที่ยอมรับ hostname สาธารณะ
</Note>

หมายเหตุด้านพฤติกรรมสำหรับ backend `/v1` แบบภายในเครื่อง/ผ่านพร็อกซี:

- OpenClaw ปฏิบัติกับสิ่งเหล่านี้เป็น route แบบพร็อกซี OpenAI-compatible ไม่ใช่
  endpoint OpenAI แบบ native
- การจัดรูปคำขอเฉพาะ OpenAI แบบ native จะไม่ใช้ที่นี่: ไม่มี
  `service_tier`, ไม่มี Responses `store`, ไม่มีการจัดรูป payload แบบ reasoning-compat ของ OpenAI
  และไม่มี hint ของ prompt-cache
- header attribution ของ OpenClaw ที่ซ่อนอยู่ (`originator`, `version`, `User-Agent`)
  จะไม่ถูกใส่ใน URL พร็อกซีแบบกำหนดเองเหล่านี้

หมายเหตุความเข้ากันได้สำหรับ backend แบบ OpenAI-compatible ที่เข้มงวดกว่า:

- บางเซิร์ฟเวอร์ยอมรับเฉพาะ `messages[].content` แบบ string บน Chat Completions ไม่ใช่
  array แบบ structured content-part ตั้งค่า
  `models.providers.<provider>.models[].compat.requiresStringContent: true` สำหรับ
  endpoint เหล่านั้น
- โมเดลภายในเครื่องบางตัวปล่อยคำขอเครื่องมือแบบ standalone ที่อยู่ในวงเล็บเป็นข้อความ เช่น
  `[tool_name]` ตามด้วย JSON และ `[END_TOOL_REQUEST]` OpenClaw จะเลื่อน
  สิ่งเหล่านั้นเป็น tool call จริงเฉพาะเมื่อชื่อตรงกับเครื่องมือที่ลงทะเบียนไว้
  สำหรับเทิร์นนั้นอย่างพอดี มิฉะนั้นบล็อกจะถูกถือว่าเป็นข้อความที่ไม่รองรับและ
  ถูกซ่อนจากคำตอบที่ผู้ใช้มองเห็น
- หากโมเดลปล่อย JSON, XML หรือข้อความแบบ ReAct-style ที่ดูเหมือน tool call
  แต่ provider ไม่ได้ปล่อย invocation แบบมีโครงสร้าง OpenClaw จะปล่อยไว้เป็น
  ข้อความและบันทึกคำเตือนพร้อม run id, provider/model, pattern ที่ตรวจพบ และ
  ชื่อเครื่องมือเมื่อมี ให้ถือว่านั่นเป็นความไม่เข้ากันของ tool-call
  ระหว่าง provider/model ไม่ใช่การรันเครื่องมือที่เสร็จสมบูรณ์
- หากเครื่องมือปรากฏเป็นข้อความ assistant แทนที่จะรัน เช่น raw JSON,
  XML, syntax แบบ ReAct หรือ array `tool_calls` ว่างใน response ของ provider
  ให้ตรวจสอบก่อนว่าเซิร์ฟเวอร์ใช้ chat template/parser ที่รองรับ tool-call สำหรับ
  backend Chat Completions แบบ OpenAI-compatible ที่ parser ทำงานเฉพาะเมื่อบังคับ
  การใช้เครื่องมือ ให้ตั้งค่า request override ต่อโมเดล แทนที่จะพึ่งพาการ parse ข้อความ:

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
  มัน override ค่าพร็อกซีเริ่มต้นของ OpenClaw ที่ `tool_choice: "auto"`
  แทนที่ `local/my-local-model` ด้วย ref provider/model ที่ตรงกันพอดีซึ่งแสดงโดย
  `openclaw models list`

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- หากโมเดล OpenAI-compatible แบบกำหนดเองยอมรับ OpenAI reasoning efforts ที่อยู่นอกเหนือ
  โปรไฟล์ในตัว ให้ประกาศไว้ในบล็อก compat ของโมเดล การเพิ่ม `"xhigh"`
  ที่นี่ทำให้ `/think xhigh`, ตัวเลือกเซสชัน, การตรวจสอบของ Gateway และการตรวจสอบ `llm-task`
  เปิดเผยระดับดังกล่าวสำหรับ provider/model ref ที่กำหนดค่าไว้:

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

## Backend ที่เล็กกว่าหรือเข้มงวดกว่า

หากโมเดลโหลดได้เรียบร้อยแต่เทิร์น agent เต็มรูปแบบทำงานผิดปกติ ให้ทำงานจากบนลงล่าง ยืนยัน transport ก่อน แล้วค่อยจำกัดพื้นผิวให้แคบลง

1. **ยืนยันว่า local model เองตอบสนองได้** ไม่มี tools ไม่มีบริบท agent:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **ยืนยันการกำหนดเส้นทางของ Gateway** ส่งเฉพาะพรอมป์ที่ให้มาเท่านั้น — ข้าม transcript, การ bootstrap ของ AGENTS, การประกอบ context-engine, tools และ MCP servers ที่รวมมาให้ แต่ยังทดสอบการกำหนดเส้นทางของ Gateway, auth และการเลือก provider:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **ลองใช้โหมด lean** หากการตรวจสอบทั้งสองผ่าน แต่รอบ agent จริงล้มเหลวด้วย tool calls ที่ผิดรูปแบบหรือพรอมป์ที่ใหญ่เกินไป ให้เปิดใช้ `agents.defaults.experimental.localModelLean: true` โหมดนี้จะตัด tools เริ่มต้นที่หนักที่สุดสามรายการ (`browser`, `cron`, `message`) เพื่อให้รูปทรงพรอมป์เล็กลงและเปราะบางน้อยลง ดู [ฟีเจอร์ทดลอง → โหมด lean สำหรับ local model](/th/concepts/experimental-features#local-model-lean-mode) สำหรับคำอธิบายเต็มรูปแบบ กรณีที่ควรใช้ และวิธียืนยันว่าเปิดใช้อยู่

4. **ปิดใช้งาน tools ทั้งหมดเป็นทางเลือกสุดท้าย** หากโหมด lean ยังไม่พอ ให้ตั้งค่า `models.providers.<provider>.models[].compat.supportsTools: false` สำหรับรายการ model นั้น จากนั้น agent จะทำงานโดยไม่มี tool calls บน model นั้น

5. **หลังจากนั้น คอขวดอยู่ที่ upstream** หาก backend ยังล้มเหลวเฉพาะกับการรัน OpenClaw ที่ใหญ่ขึ้นหลังใช้โหมด lean และ `supportsTools: false` แล้ว ปัญหาที่เหลือมักเป็นความจุของ upstream model หรือ server — context window, หน่วยความจำ GPU, การขับ kv-cache ออก หรือบั๊กของ backend ณ จุดนั้นไม่ใช่ชั้น transport ของ OpenClaw

## การแก้ไขปัญหา

- Gateway เข้าถึง proxy ได้หรือไม่? `curl http://127.0.0.1:1234/v1/models`
- LM Studio model ถูก unload อยู่หรือไม่? โหลดใหม่ การเริ่มแบบ cold start เป็นสาเหตุ “ค้าง” ที่พบบ่อย
- local server แจ้งว่า `terminated`, `ECONNRESET` หรือปิด stream กลางรอบหรือไม่?
  OpenClaw บันทึก `model.call.error.failureKind` แบบ low-cardinality พร้อมสแนปช็อต RSS/heap ของกระบวนการ
  OpenClaw ไว้ใน diagnostics สำหรับแรงกดดันด้านหน่วยความจำของ LM Studio/Ollama
  ให้เทียบ timestamp นั้นกับ server log หรือบันทึก crash /
  jetsam ของ macOS เพื่อยืนยันว่า model server ถูก kill หรือไม่
- OpenClaw คำนวณ threshold ของ context-window preflight จาก model window ที่ตรวจพบ หรือจาก model window แบบไม่ถูกจำกัดเมื่อ `agents.defaults.contextTokens` ลด effective window ลง ระบบจะเตือนเมื่อเหลือต่ำกว่า 20% โดยมีพื้นขั้นต่ำ **8k** การบล็อกแบบ hard ใช้ threshold 10% โดยมีพื้นขั้นต่ำ **4k** และถูกจำกัดไม่ให้เกิน effective context window เพื่อไม่ให้ metadata ของ model ที่ใหญ่เกินไปปฏิเสธ user cap ที่ถูกต้องอยู่แล้ว หากเจอ preflight นี้ ให้เพิ่ม context limit ของ server/model หรือเลือก model ที่ใหญ่กว่า
- พบ context errors หรือไม่? ลด `contextWindow` หรือเพิ่ม server limit ของคุณ
- server ที่เข้ากันได้กับ OpenAI ส่งคืน `messages[].content ... expected a string` หรือไม่?
  เพิ่ม `compat.requiresStringContent: true` ในรายการ model นั้น
- การเรียก `/v1/chat/completions` ขนาดเล็กโดยตรงใช้งานได้ แต่ `openclaw infer model run --local`
  ล้มเหลวกับ Gemma หรือ local model อื่นหรือไม่? ตรวจ provider URL, model ref, auth
  marker และ server logs ก่อน; local `model run` ไม่มี agent tools รวมอยู่
  หาก local `model run` สำเร็จแต่รอบ agent ที่ใหญ่กว่าล้มเหลว ให้ลดพื้นผิว tools ของ agent
  ด้วย `localModelLean` หรือ `compat.supportsTools: false`
- tool calls แสดงเป็นข้อความ JSON/XML/ReAct ดิบ หรือ provider ส่งคืนอาร์เรย์
  `tool_calls` ว่างหรือไม่? อย่าเพิ่ม proxy ที่แปลงข้อความ assistant
  เป็นการเรียกใช้ tool แบบสุ่มสี่สุ่มห้า ให้แก้ chat template/parser ของ server ก่อน หาก
  model ใช้งานได้เฉพาะเมื่อบังคับใช้ tool ให้เพิ่ม override ราย model
  `params.extra_body.tool_choice: "required"` ด้านบน และใช้รายการ model นั้น
  เฉพาะกับ sessions ที่คาดว่าจะมี tool call ในทุก turn
- ความปลอดภัย: local models ข้ามตัวกรองฝั่ง provider; จำกัด agents ให้แคบและเปิด Compaction ไว้เพื่อลด blast radius ของ prompt injection

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [Model failover](/th/concepts/model-failover)
