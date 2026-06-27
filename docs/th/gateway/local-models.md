---
read_when:
    - คุณต้องการให้บริการโมเดลจากเครื่องที่มี GPU ของคุณเอง
    - คุณกำลังเชื่อมต่อ LM Studio หรือพร็อกซีที่เข้ากันได้กับ OpenAI
    - คุณต้องการคำแนะนำโมเดลในเครื่องที่ปลอดภัยที่สุด
summary: เรียกใช้ OpenClaw บน LLM ภายในเครื่อง (LM Studio, vLLM, LiteLLM, ปลายทาง OpenAI แบบกำหนดเอง)
title: โมเดลในเครื่อง
x-i18n:
    generated_at: "2026-06-27T17:35:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 671c92d78fa29c778fd34b6df027cc8f9e7ad507c9d446700d97cd789becd041
    source_path: gateway/local-models.md
    workflow: 16
---

โมเดลในเครื่องทำได้จริง แต่ก็เพิ่มข้อกำหนดด้านฮาร์ดแวร์ ขนาดคอนเท็กซ์ และการป้องกัน prompt injection ให้สูงขึ้นด้วย การ์ดขนาดเล็กหรือที่ quantize หนักจะตัดทอนคอนเท็กซ์และลดทอนความปลอดภัย หน้านี้เป็นคู่มือแบบมีจุดยืนสำหรับสแตกในเครื่องระดับสูงกว่าและเซิร์ฟเวอร์ในเครื่องแบบกำหนดเองที่เข้ากันได้กับ OpenAI สำหรับการเริ่มต้นใช้งานที่มีแรงเสียดทานต่ำที่สุด ให้เริ่มจาก [LM Studio](/th/providers/lmstudio) หรือ [Ollama](/th/providers/ollama) และ `openclaw onboard`

สำหรับเซิร์ฟเวอร์ในเครื่องที่ควรเริ่มทำงานเฉพาะเมื่อโมเดลที่เลือกต้องใช้เท่านั้น โปรดดู
[บริการโมเดลในเครื่อง](/th/gateway/local-model-services)

## ระดับฮาร์ดแวร์ขั้นต่ำ

ตั้งเป้าให้สูง: **Mac Studio สเปกสูงสุดอย่างน้อย 2 เครื่อง หรือชุด GPU ที่เทียบเท่า (~$30k+)** เพื่อให้ลูปเอเจนต์ทำงานได้อย่างสบาย GPU **24 GB** เพียงตัวเดียวเหมาะเฉพาะกับพรอมป์ที่เบากว่าและมีเวลาแฝงสูงกว่าเท่านั้น ให้รัน **รุ่นที่ใหญ่ที่สุด / ขนาดเต็มที่สุดที่คุณโฮสต์ได้** เสมอ เช็กพอยต์ขนาดเล็กหรือที่ quantize หนักจะเพิ่มความเสี่ยงด้าน prompt injection (ดู [ความปลอดภัย](/th/gateway/security))

## เลือกแบ็กเอนด์

| แบ็กเอนด์                                             | ใช้เมื่อ                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [ds4](/th/providers/ds4)                                | DeepSeek V4 Flash ในเครื่องบน macOS Metal พร้อมการเรียกเครื่องมือที่เข้ากันได้กับ OpenAI |
| [LM Studio](/th/providers/lmstudio)                     | การตั้งค่าในเครื่องครั้งแรก ตัวโหลด GUI และ Responses API แบบเนทีฟ        |
| LiteLLM / OAI-proxy / พร็อกซีแบบกำหนดเองที่เข้ากันได้กับ OpenAI | คุณอยู่หน้า API ของโมเดลอื่นและต้องการให้ OpenClaw ปฏิบัติต่อโมเดลนั้นเหมือน OpenAI |
| MLX / vLLM / SGLang                                  | การให้บริการแบบ self-hosted ปริมาณงานสูงพร้อมปลายทาง HTTP ที่เข้ากันได้กับ OpenAI |
| [Ollama](/th/providers/ollama)                          | เวิร์กโฟลว์ CLI ไลบรารีโมเดล และบริการ systemd แบบไม่ต้องดูแลเอง          |

ใช้ Responses API (`api: "openai-responses"`) เมื่อแบ็กเอนด์รองรับ (LM Studio รองรับ) มิฉะนั้นให้ใช้ Chat Completions (`api: "openai-completions"`)

<Warning>
**ผู้ใช้ WSL2 + Ollama + NVIDIA/CUDA:** ตัวติดตั้ง Ollama Linux อย่างเป็นทางการจะเปิดใช้งานบริการ systemd พร้อม `Restart=always` ในการตั้งค่า GPU บน WSL2 การเริ่มอัตโนมัติสามารถโหลดโมเดลล่าสุดซ้ำระหว่างบูตและยึดหน่วยความจำของโฮสต์ไว้ได้ หาก VM WSL2 ของคุณรีสตาร์ตซ้ำหลังเปิดใช้งาน Ollama โปรดดู [ลูปการแครชของ WSL2](/th/providers/ollama#wsl2-crash-loop-repeated-reboots)
</Warning>

## แนะนำ: LM Studio + โมเดลในเครื่องขนาดใหญ่ (Responses API)

สแตกในเครื่องที่ดีที่สุดในปัจจุบัน โหลดโมเดลขนาดใหญ่ใน LM Studio (ตัวอย่างเช่น บิลด์ Qwen, DeepSeek หรือ Llama ขนาดเต็ม) เปิดใช้งานเซิร์ฟเวอร์ในเครื่อง (ค่าเริ่มต้น `http://127.0.0.1:1234`) และใช้ Responses API เพื่อแยก reasoning ออกจากข้อความสุดท้าย

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
- ใน LM Studio ให้ดาวน์โหลด **บิลด์โมเดลที่ใหญ่ที่สุดที่มี** (หลีกเลี่ยงรุ่น "small"/ที่ quantize หนัก) เริ่มเซิร์ฟเวอร์ แล้วตรวจสอบว่า `http://127.0.0.1:1234/v1/models` แสดงรายการโมเดลนั้น
- แทนที่ `my-local-model` ด้วย ID โมเดลจริงที่แสดงใน LM Studio
- โหลดโมเดลค้างไว้ การโหลดแบบ cold-load จะเพิ่มเวลาแฝงตอนเริ่มต้น
- ปรับ `contextWindow`/`maxTokens` หากบิลด์ LM Studio ของคุณแตกต่างออกไป
- สำหรับ WhatsApp ให้ใช้ Responses API เพื่อให้ส่งเฉพาะข้อความสุดท้าย

คงการกำหนดค่าโมเดลแบบโฮสต์ไว้แม้ขณะรันในเครื่อง ใช้ `models.mode: "merge"` เพื่อให้ยังมี fallback พร้อมใช้งาน

### การกำหนดค่าแบบไฮบริด: โฮสต์เป็นตัวหลัก ในเครื่องเป็น fallback

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

### ให้ในเครื่องมาก่อน พร้อมตาข่ายนิรภัยแบบโฮสต์

สลับลำดับตัวหลักและ fallback โดยคงบล็อก providers เดิมและ `models.mode: "merge"` เพื่อให้คุณ fallback ไปยัง Sonnet หรือ Opus ได้เมื่อเครื่องในเครื่องใช้งานไม่ได้

### การโฮสต์ตามภูมิภาค / การกำหนดเส้นทางข้อมูล

- รุ่น MiniMax/Kimi/GLM แบบโฮสต์ยังมีบน OpenRouter พร้อมปลายทางที่ตรึงภูมิภาค (เช่น โฮสต์ในสหรัฐฯ) เลือกรุ่นตามภูมิภาคที่นั่นเพื่อให้ทราฟฟิกอยู่ในเขตอำนาจศาลที่คุณเลือก ขณะยังใช้ `models.mode: "merge"` สำหรับ fallback ของ Anthropic/OpenAI
- แบบในเครื่องเท่านั้นยังคงเป็นเส้นทางความเป็นส่วนตัวที่แข็งแกร่งที่สุด การกำหนดเส้นทางแบบโฮสต์ตามภูมิภาคเป็นทางสายกลางเมื่อคุณต้องการฟีเจอร์จากผู้ให้บริการแต่ยังต้องการควบคุมการไหลของข้อมูล

## พร็อกซีในเครื่องอื่นที่เข้ากันได้กับ OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy หรือ Gateway แบบกำหนดเอง
ใช้งานได้หากเปิดเผยปลายทาง `/v1/chat/completions`
สไตล์ OpenAI ใช้อะแดปเตอร์ Chat Completions เว้นแต่แบ็กเอนด์จะระบุอย่างชัดเจนว่า
รองรับ `/v1/responses` แทนที่บล็อก provider ด้านบนด้วย
ปลายทางและ ID โมเดลของคุณ:

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
`openai-completions` รายการ provider แบบกำหนดเอง/ในเครื่องจะเชื่อถือ origin ของ
`baseUrl` ที่กำหนดไว้อย่างตรงตัวสำหรับคำขอโมเดลที่มีการป้องกัน รวมถึง loopback, LAN, tailnet
และโฮสต์ DNS ส่วนตัว คำขอไปยัง origin ส่วนตัวอื่นยังต้องใช้
`request.allowPrivateNetwork: true`; origin แบบ metadata/link-local ยังคงถูกบล็อก
หากไม่ได้ opt-in อย่างชัดเจน ตั้งค่าเป็น `false` เพื่อ opt out จากความเชื่อถือ origin แบบตรงตัว

ค่า `models.providers.<id>.models[].id` เป็นค่าเฉพาะภายใน provider อย่า
ใส่คำนำหน้า provider ไว้ในค่านั้น ตัวอย่างเช่น เซิร์ฟเวอร์ MLX ที่เริ่มด้วย
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` ควรใช้
ID แค็ตตาล็อกและอ้างอิงโมเดลดังนี้:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

ตั้งค่า `input: ["text", "image"]` บนโมเดลวิชันในเครื่องหรือผ่านพร็อกซี เพื่อให้แนบรูปภาพ
เข้าไปในเทิร์นของเอเจนต์ การเริ่มใช้งาน provider แบบกำหนดเองในโหมดอินเทอร์แอคทีฟ
จะอนุมาน ID โมเดลวิชันทั่วไปและถามเฉพาะชื่อที่ไม่รู้จัก
การเริ่มใช้งานแบบไม่โต้ตอบใช้การอนุมานเดียวกัน ใช้ `--custom-image-input`
สำหรับ ID วิชันที่ไม่รู้จัก หรือ `--custom-text-input` เมื่อโมเดลที่ดูเหมือนรู้จัก
เป็นแบบข้อความเท่านั้นหลังปลายทางของคุณ

คง `models.mode: "merge"` ไว้เพื่อให้โมเดลแบบโฮสต์ยังพร้อมใช้เป็น fallback
ใช้ `models.providers.<id>.timeoutSeconds` สำหรับเซิร์ฟเวอร์โมเดลในเครื่องหรือระยะไกล
ที่ช้า ก่อนเพิ่ม `agents.defaults.timeoutSeconds` ค่า timeout ของ provider
มีผลเฉพาะกับคำขอ HTTP ของโมเดล รวมถึงการเชื่อมต่อ ส่วนหัว การสตรีมบอดี
และการยกเลิก guarded-fetch ทั้งหมด หาก timeout ของเอเจนต์หรือการรันต่ำกว่า ให้เพิ่ม
เพดานนั้นด้วย เพราะ timeout ของ provider ไม่สามารถยืดเวลาการรันเอเจนต์ทั้งหมดได้

<Note>
สำหรับ provider แบบกำหนดเองที่เข้ากันได้กับ OpenAI การเก็บมาร์กเกอร์ในเครื่องที่ไม่ใช่ความลับ เช่น `apiKey: "ollama-local"` เป็นสิ่งที่ยอมรับได้เมื่อ `baseUrl` resolve ไปยัง loopback, LAN ส่วนตัว, `.local` หรือชื่อโฮสต์เปล่า OpenClaw จะปฏิบัติต่อค่านั้นเป็น credential ในเครื่องที่ถูกต้องแทนที่จะรายงานว่าขาดคีย์ ใช้ค่าจริงสำหรับ provider ใดก็ตามที่ยอมรับชื่อโฮสต์สาธารณะ
</Note>

หมายเหตุพฤติกรรมสำหรับแบ็กเอนด์ `/v1` ในเครื่อง/ผ่านพร็อกซี:

- OpenClaw ปฏิบัติต่อสิ่งเหล่านี้เป็นเส้นทางที่เข้ากันได้กับ OpenAI แบบพร็อกซี ไม่ใช่ปลายทาง
  OpenAI แบบเนทีฟ
- การจัดรูปคำขอที่มีเฉพาะ OpenAI แบบเนทีฟจะไม่มีผลที่นี่: ไม่มี
  `service_tier`, ไม่มี Responses `store`, ไม่มีการจัดรูป payload เพื่อความเข้ากันได้กับ reasoning ของ OpenAI
  และไม่มีคำใบ้ prompt-cache
- header ระบุที่มาของ OpenClaw แบบซ่อน (`originator`, `version`, `User-Agent`)
  จะไม่ถูกใส่ใน URL พร็อกซีแบบกำหนดเองเหล่านี้

หมายเหตุความเข้ากันได้สำหรับแบ็กเอนด์ที่เข้ากันได้กับ OpenAI และเข้มงวดกว่า:

- บางเซิร์ฟเวอร์ยอมรับเฉพาะ `messages[].content` แบบสตริงบน Chat Completions ไม่ใช่
  อาร์เรย์ content-part แบบมีโครงสร้าง ให้ตั้งค่า
  `models.providers.<provider>.models[].compat.requiresStringContent: true` สำหรับ
  ปลายทางเหล่านั้น
- โมเดลในเครื่องบางตัวส่งคำขอเครื่องมือแบบวงเล็บลอยเดี่ยวเป็นข้อความ เช่น
  `[tool_name]` ตามด้วย JSON และ `[END_TOOL_REQUEST]` OpenClaw จะยกระดับ
  สิ่งเหล่านั้นเป็นการเรียกเครื่องมือจริงเฉพาะเมื่อชื่อตรงกับเครื่องมือที่ลงทะเบียนไว้
  สำหรับเทิร์นนั้นเท่านั้น มิฉะนั้นบล็อกจะถูกปฏิบัติเป็นข้อความที่ไม่รองรับและถูก
  ซ่อนจากคำตอบที่ผู้ใช้เห็น
- หากโมเดลส่ง JSON, XML หรือข้อความสไตล์ ReAct ที่ดูเหมือนการเรียกเครื่องมือ
  แต่ provider ไม่ได้ส่ง invocation แบบมีโครงสร้าง OpenClaw จะปล่อยไว้เป็น
  ข้อความและบันทึกคำเตือนพร้อม run id, provider/model, รูปแบบที่ตรวจพบ และ
  ชื่อเครื่องมือเมื่อมี ให้ถือว่านั่นเป็นความไม่เข้ากันของการเรียกเครื่องมือของ provider/model
  ไม่ใช่การรันเครื่องมือที่เสร็จแล้ว
- หากเครื่องมือปรากฏเป็นข้อความของ assistant แทนที่จะถูกรัน เช่น JSON ดิบ,
  XML, ไวยากรณ์ ReAct หรืออาร์เรย์ `tool_calls` ว่างในคำตอบจาก provider
  ให้ตรวจสอบก่อนว่าเซิร์ฟเวอร์กำลังใช้ chat template/parser ที่รองรับการเรียกเครื่องมือ สำหรับ
  แบ็กเอนด์ Chat Completions ที่เข้ากันได้กับ OpenAI ซึ่ง parser ทำงานเฉพาะเมื่อบังคับใช้
  เครื่องมือ ให้ตั้งค่า override คำขอต่อโมเดลแทนการพึ่งพาการแยกวิเคราะห์ข้อความ:

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
  สิ่งนี้จะ override ค่า proxy เริ่มต้นของ OpenClaw ที่เป็น `tool_choice: "auto"`
  แทนที่ `local/my-local-model` ด้วยอ้างอิง provider/model ที่ตรงตัวซึ่งแสดงโดย
  `openclaw models list`

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- หากโมเดลแบบกำหนดเองที่เข้ากันได้กับ OpenAI ยอมรับระดับ reasoning effort ของ OpenAI นอกเหนือจาก
  โปรไฟล์ในตัว ให้ประกาศไว้ในบล็อก compat ของโมเดล การเพิ่ม `"xhigh"`
  ที่นี่จะทำให้ `/think xhigh`, ตัวเลือกเซสชัน, การตรวจสอบของ Gateway และการตรวจสอบ `llm-task`
  แสดงระดับนี้สำหรับอ้างอิง provider/model ที่กำหนดค่าไว้:

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

## แบ็กเอนด์ที่เล็กกว่าหรือเข้มงวดกว่า

หากโมเดลโหลดได้เรียบร้อยแต่รอบการทำงานของเอเจนต์แบบเต็มทำงานผิดปกติ ให้ไล่ตรวจจากบนลงล่าง — ยืนยันการขนส่งข้อมูลก่อน แล้วจึงจำกัดขอบเขตให้แคบลง

1. **ยืนยันว่าโมเดลภายในเครื่องตอบสนองได้เอง** ไม่มีเครื่องมือ ไม่มีบริบทของเอเจนต์:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **ยืนยันการกำหนดเส้นทางของ Gateway** ส่งเฉพาะพรอมป์ที่ให้มา — ข้ามทรานสคริปต์, การบูตสแตรป AGENTS, การประกอบ context-engine, เครื่องมือ และเซิร์ฟเวอร์ MCP ที่รวมมา แต่ยังคงทดสอบการกำหนดเส้นทางของ Gateway, การยืนยันตัวตน และการเลือกผู้ให้บริการ:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **ลองใช้โหมดแบบเบา** หากโพรบทั้งสองผ่าน แต่การทำงานจริงของเอเจนต์ล้มเหลวด้วยการเรียกเครื่องมือที่มีรูปแบบไม่ถูกต้องหรือพรอมป์ที่ใหญ่เกินไป ให้เปิดใช้ `agents.defaults.experimental.localModelLean: true` ตัวเลือกนี้จะตัดเครื่องมือเริ่มต้นที่หนักที่สุดสามรายการ (`browser`, `cron`, `message`) ออก และตั้งค่าแค็ตตาล็อกเครื่องมือขนาดใหญ่กว่าให้อยู่หลังตัวควบคุม Tool Search แบบมีโครงสร้างเป็นค่าเริ่มต้น ยกเว้นการรันที่ต้องคงความหมายของการส่ง `message` โดยตรงไว้ ดู [ฟีเจอร์ทดลอง → โหมดแบบเบาสำหรับโมเดลภายในเครื่อง](/th/concepts/experimental-features#local-model-lean-mode) สำหรับคำอธิบายทั้งหมด เวลาที่ควรใช้ และวิธียืนยันว่าเปิดใช้งานอยู่

4. **ปิดใช้เครื่องมือทั้งหมดเป็นทางเลือกสุดท้าย** หากโหมดแบบเบายังไม่พอ ให้ตั้งค่า `models.providers.<provider>.models[].compat.supportsTools: false` สำหรับรายการโมเดลนั้น จากนั้นเอเจนต์จะทำงานกับโมเดลนั้นโดยไม่มีการเรียกเครื่องมือ

5. **หลังจากนั้น คอขวดอยู่ที่ต้นทาง** หากแบ็กเอนด์ยังล้มเหลวเฉพาะในการรัน OpenClaw ขนาดใหญ่หลังจากใช้โหมดแบบเบาและ `supportsTools: false` แล้ว ปัญหาที่เหลือมักเป็นความจุของโมเดลหรือเซิร์ฟเวอร์ต้นทาง เช่น หน้าต่างบริบท หน่วยความจำ GPU การไล่ kv-cache ออก หรือบั๊กของแบ็กเอนด์ ณ จุดนั้นปัญหาไม่ได้อยู่ที่ชั้นการขนส่งของ OpenClaw

## การแก้ปัญหา

- Gateway เข้าถึงพร็อกซีได้หรือไม่ `curl http://127.0.0.1:1234/v1/models`
- โมเดล LM Studio ถูกยกเลิกการโหลดหรือไม่ โหลดใหม่ การเริ่มแบบเย็นเป็นสาเหตุทั่วไปของอาการ “ค้าง”
- เซิร์ฟเวอร์ภายในเครื่องแจ้งว่า `terminated`, `ECONNRESET` หรือปิดสตรีมกลางเทิร์นหรือไม่
  OpenClaw บันทึก `model.call.error.failureKind` ที่มีคาร์ดินาลิตีต่ำ พร้อมสแนปช็อต RSS/heap ของกระบวนการ
  OpenClaw ในข้อมูลวินิจฉัย สำหรับแรงกดดันด้านหน่วยความจำของ LM Studio/Ollama
  ให้เทียบเวลานั้นกับบันทึกของเซิร์ฟเวอร์หรือบันทึก crash /
  jetsam ของ macOS เพื่อยืนยันว่าเซิร์ฟเวอร์โมเดลถูกปิดหรือไม่
- OpenClaw อนุมานเกณฑ์พรีไฟลต์ของหน้าต่างบริบทจากหน้าต่างโมเดลที่ตรวจพบ หรือจากหน้าต่างโมเดลแบบไม่จำกัดเมื่อ `agents.defaults.contextTokens` ลดหน้าต่างที่มีผลจริง ระบบจะเตือนเมื่อต่ำกว่า 20% โดยมีพื้นขั้นต่ำ **8k** การบล็อกแบบเด็ดขาดใช้เกณฑ์ 10% โดยมีพื้นขั้นต่ำ **4k** และจำกัดไว้ไม่เกินหน้าต่างบริบทที่มีผลจริง เพื่อให้เมทาดาทาโมเดลที่ใหญ่เกินไปไม่ปฏิเสธขีดจำกัดผู้ใช้ที่ยังใช้ได้ หากคุณเจอพรีไฟลต์นี้ ให้เพิ่มขีดจำกัดบริบทของเซิร์ฟเวอร์/โมเดล หรือเลือกโมเดลที่ใหญ่กว่า
- เกิดข้อผิดพลาดบริบทหรือไม่ ลด `contextWindow` หรือเพิ่มขีดจำกัดเซิร์ฟเวอร์ของคุณ
- เซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI ส่งคืน `messages[].content ... expected a string` หรือไม่
  เพิ่ม `compat.requiresStringContent: true` ในรายการโมเดลนั้น
- เซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI ส่งคืน `validation.keys` หรือบอกว่ารายการข้อความอนุญาตเฉพาะ `role` และ `content` หรือไม่
  เพิ่ม `compat.strictMessageKeys: true` ในรายการโมเดลนั้น
- การเรียก `/v1/chat/completions` ขนาดเล็กโดยตรงทำงานได้ แต่ `openclaw infer model run --local`
  ล้มเหลวกับ Gemma หรือโมเดลภายในเครื่องอื่นหรือไม่ ตรวจ URL ของผู้ให้บริการ การอ้างอิงโมเดล เครื่องหมายการยืนยันตัวตน
  และบันทึกเซิร์ฟเวอร์ก่อน `model run` ภายในเครื่องไม่มีเครื่องมือของเอเจนต์รวมอยู่
  หาก `model run` ภายในเครื่องสำเร็จ แต่เทิร์นเอเจนต์ที่ใหญ่กว่าล้มเหลว ให้ลดพื้นผิวเครื่องมือของเอเจนต์
  ด้วย `localModelLean` หรือ `compat.supportsTools: false`
- การเรียกเครื่องมือแสดงเป็นข้อความ JSON/XML/ReAct ดิบ หรือผู้ให้บริการส่งคืน
  อาร์เรย์ `tool_calls` ว่างหรือไม่ อย่าเพิ่มพร็อกซีที่แปลงข้อความของผู้ช่วย
  เป็นการดำเนินการเครื่องมือแบบไม่พิจารณา ให้แก้เทมเพลต/ตัวแยกวิเคราะห์แชตของเซิร์ฟเวอร์ก่อน หาก
  โมเดลทำงานได้เฉพาะเมื่อบังคับใช้เครื่องมือ ให้เพิ่มการแทนที่รายโมเดล
  `params.extra_body.tool_choice: "required"` ด้านบน และใช้รายการโมเดลนั้น
  เฉพาะกับเซสชันที่คาดว่าจะมีการเรียกเครื่องมือในทุกเทิร์น
- ความปลอดภัย: โมเดลภายในเครื่องข้ามตัวกรองฝั่งผู้ให้บริการ ให้จำกัดขอบเขตเอเจนต์ให้แคบและเปิด Compaction เพื่อลดรัศมีผลกระทบของ prompt injection

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [การสลับโมเดลเมื่อเกิดความล้มเหลว](/th/concepts/model-failover)
