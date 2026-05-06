---
read_when:
    - คุณต้องการให้บริการโมเดลจากเครื่อง GPU ของคุณเอง
    - คุณกำลังเชื่อมต่อ LM Studio หรือพร็อกซีที่เข้ากันได้กับ OpenAI
    - คุณต้องการคำแนะนำเกี่ยวกับโมเดลภายในเครื่องที่ปลอดภัยที่สุด
summary: เรียกใช้ OpenClaw บนโมเดลภาษา LLM ภายในเครื่อง (LM Studio, vLLM, LiteLLM, ปลายทาง OpenAI แบบกำหนดเอง)
title: โมเดลภายในเครื่อง
x-i18n:
    generated_at: "2026-05-06T09:13:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf0a1f960c5d0bd93eebb49e10db1066c305b2bc64401eb5000bf559f7e62349
    source_path: gateway/local-models.md
    workflow: 16
---

โมเดลแบบโลคัลทำได้จริง แต่ก็ยกระดับข้อกำหนดด้านฮาร์ดแวร์ ขนาดคอนเท็กซ์ และการป้องกัน prompt-injection ให้สูงขึ้นด้วย การ์ดขนาดเล็กหรือที่ quantize อย่างหนักจะตัดคอนเท็กซ์และทำให้ความปลอดภัยรั่วไหล หน้านี้เป็นคู่มือเชิงแนะนำสำหรับสแตกโลคัลระดับสูงกว่าและเซิร์ฟเวอร์โลคัลแบบกำหนดเองที่เข้ากันได้กับ OpenAI สำหรับการเริ่มต้นใช้งานที่มีแรงเสียดทานต่ำที่สุด ให้เริ่มจาก [LM Studio](/th/providers/lmstudio) หรือ [Ollama](/th/providers/ollama) และ `openclaw onboard`

## ระดับฮาร์ดแวร์ขั้นต่ำ

ตั้งเป้าให้สูง: **Mac Studio รุ่นเต็มสเปกอย่างน้อย 2 เครื่อง หรือชุด GPU ที่เทียบเท่า (~$30k+)** เพื่อให้ลูป agent ทำงานได้อย่างสบาย GPU **24 GB** เพียงตัวเดียวใช้ได้เฉพาะกับพรอมป์ที่เบากว่าและมี latency สูงกว่าเท่านั้น ให้ใช้ **ตัวแปรรุ่นใหญ่ที่สุด / ขนาดเต็มที่สุดที่คุณโฮสต์ได้** เสมอ checkpoint ขนาดเล็กหรือที่ quantize หนักจะเพิ่มความเสี่ยงต่อ prompt-injection (ดู [ความปลอดภัย](/th/gateway/security))

## เลือกแบ็กเอนด์

| แบ็กเอนด์                                             | ใช้เมื่อ                                                                      |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/th/providers/lmstudio)                     | ตั้งค่าโลคัลครั้งแรก, ตัวโหลด GUI, Responses API แบบเนทีฟ                  |
| [Ollama](/th/providers/ollama)                          | เวิร์กโฟลว์ CLI, ไลบรารีโมเดล, บริการ systemd แบบไม่ต้องดูแล                |
| MLX / vLLM / SGLang                                  | การให้บริการแบบ self-hosted ที่ throughput สูง พร้อมเอนด์พอยต์ HTTP ที่เข้ากันได้กับ OpenAI |
| LiteLLM / OAI-proxy / พร็อกซีแบบกำหนดเองที่เข้ากันได้กับ OpenAI | คุณวางอีก model API ไว้ข้างหน้าและต้องการให้ OpenClaw ปฏิบัติกับมันเหมือน OpenAI |

ใช้ Responses API (`api: "openai-responses"`) เมื่อแบ็กเอนด์รองรับ (LM Studio รองรับ) มิฉะนั้นให้ใช้ Chat Completions (`api: "openai-completions"`)

<Warning>
**ผู้ใช้ WSL2 + Ollama + NVIDIA/CUDA:** ตัวติดตั้ง Ollama Linux อย่างเป็นทางการเปิดใช้บริการ systemd พร้อม `Restart=always` บนชุด WSL2 GPU การ autostart อาจโหลดโมเดลล่าสุดซ้ำระหว่างบูตและยึดหน่วยความจำของโฮสต์ไว้ หาก VM WSL2 ของคุณรีสตาร์ตซ้ำหลังจากเปิดใช้ Ollama ให้ดู [ลูปแครช WSL2](/th/providers/ollama#wsl2-crash-loop-repeated-reboots)
</Warning>

## แนะนำ: LM Studio + โมเดลโลคัลขนาดใหญ่ (Responses API)

สแตกโลคัลที่ดีที่สุดในปัจจุบัน โหลดโมเดลขนาดใหญ่ใน LM Studio (เช่น build ขนาดเต็มของ Qwen, DeepSeek หรือ Llama) เปิดใช้เซิร์ฟเวอร์โลคัล (ค่าเริ่มต้น `http://127.0.0.1:1234`) และใช้ Responses API เพื่อแยก reasoning ออกจากข้อความสุดท้าย

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
- ใน LM Studio ให้ดาวน์โหลด **build โมเดลที่ใหญ่ที่สุดที่มี** (หลีกเลี่ยงตัวแปร "small"/ที่ quantize หนัก) เริ่มเซิร์ฟเวอร์ และยืนยันว่า `http://127.0.0.1:1234/v1/models` แสดงรายการโมเดลนั้น
- แทนที่ `my-local-model` ด้วย ID โมเดลจริงที่แสดงใน LM Studio
- โหลดโมเดลค้างไว้ การโหลดแบบ cold-load จะเพิ่ม latency ตอนเริ่มต้น
- ปรับ `contextWindow`/`maxTokens` หาก build ของ LM Studio ที่คุณใช้แตกต่างออกไป
- สำหรับ WhatsApp ให้ใช้ Responses API ต่อไป เพื่อให้ส่งเฉพาะข้อความสุดท้ายเท่านั้น

คงการตั้งค่าโมเดลที่โฮสต์ไว้แม้ขณะรันโลคัล ใช้ `models.mode: "merge"` เพื่อให้ fallback ยังพร้อมใช้งาน

### คอนฟิกแบบไฮบริด: hosted primary, local fallback

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

### ใช้โลคัลเป็นหลักพร้อม safety net แบบ hosted

สลับลำดับ primary และ fallback คงบล็อก providers เดิมและ `models.mode: "merge"` เพื่อให้คุณ fallback ไปยัง Sonnet หรือ Opus ได้เมื่อเครื่องโลคัลไม่พร้อมใช้งาน

### การโฮสต์ตามภูมิภาค / การกำหนดเส้นทางข้อมูล

- ตัวแปร Hosted MiniMax/Kimi/GLM มีอยู่บน OpenRouter ด้วย พร้อมเอนด์พอยต์ที่ปักภูมิภาคไว้ (เช่น โฮสต์ในสหรัฐฯ) เลือกตัวแปรตามภูมิภาคที่นั่นเพื่อเก็บทราฟฟิกไว้ในเขตอำนาจที่คุณเลือก ขณะยังใช้ `models.mode: "merge"` สำหรับ fallback ไปยัง Anthropic/OpenAI
- แบบ local-only ยังคงเป็นเส้นทางความเป็นส่วนตัวที่แข็งแกร่งที่สุด การกำหนดเส้นทางแบบ hosted ตามภูมิภาคเป็นทางสายกลางเมื่อคุณต้องการฟีเจอร์ของผู้ให้บริการแต่ยังต้องการควบคุมการไหลของข้อมูล

## พร็อกซีโลคัลอื่นที่เข้ากันได้กับ OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy หรือ Gateway แบบกำหนดเองจะทำงานได้หากเปิดเผยเอนด์พอยต์ `/v1/chat/completions` แบบ OpenAI-style ใช้อะแดปเตอร์ Chat Completions เว้นแต่แบ็กเอนด์จะมีเอกสารรองรับ `/v1/responses` อย่างชัดเจน แทนที่บล็อก provider ด้านบนด้วยเอนด์พอยต์และ ID โมเดลของคุณ:

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

หากละ `api` ไว้ใน provider แบบกำหนดเองที่มี `baseUrl` OpenClaw จะใช้ค่าเริ่มต้นเป็น `openai-completions` เอนด์พอยต์ loopback เช่น `127.0.0.1` จะได้รับความเชื่อถือโดยอัตโนมัติ ส่วนเอนด์พอยต์ LAN, tailnet และ DNS ส่วนตัวยังต้องใช้ `request.allowPrivateNetwork: true`

ค่า `models.providers.<id>.models[].id` เป็นแบบ local ต่อ provider อย่าใส่ prefix ของ provider ไว้ตรงนั้น ตัวอย่างเช่น เซิร์ฟเวอร์ MLX ที่เริ่มด้วย `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` ควรใช้ ID แค็ตตาล็อกและ model ref นี้:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

ตั้งค่า `input: ["text", "image"]` บนโมเดล vision แบบโลคัลหรือผ่านพร็อกซี เพื่อให้แนบรูปภาพเข้าไปในเทิร์นของ agent การ onboarding provider แบบกำหนดเองเชิงโต้ตอบจะอนุมาน ID โมเดล vision ที่พบบ่อยและถามเฉพาะชื่อที่ไม่รู้จัก การ onboarding แบบไม่โต้ตอบใช้การอนุมานเดียวกัน ใช้ `--custom-image-input` สำหรับ ID vision ที่ไม่รู้จัก หรือ `--custom-text-input` เมื่อโมเดลที่ดูเหมือนรู้จักเป็น text-only อยู่หลังเอนด์พอยต์ของคุณ

คง `models.mode: "merge"` ไว้เพื่อให้โมเดล hosted ยังพร้อมเป็น fallback ใช้ `models.providers.<id>.timeoutSeconds` สำหรับเซิร์ฟเวอร์โมเดลโลคัลหรือรีโมตที่ช้า ก่อนเพิ่ม `agents.defaults.timeoutSeconds` timeout ของ provider ใช้เฉพาะกับคำขอ HTTP ของโมเดล รวมถึงการเชื่อมต่อ headers การสตรีม body และการ abort ของ guarded-fetch ทั้งหมด

<Note>
สำหรับ provider แบบกำหนดเองที่เข้ากันได้กับ OpenAI การคง marker โลคัลที่ไม่ใช่ความลับ เช่น `apiKey: "ollama-local"` เป็นที่ยอมรับเมื่อ `baseUrl` resolve ไปยัง loopback, LAN ส่วนตัว, `.local` หรือ hostname เปล่า OpenClaw จะถือว่าเป็นข้อมูลรับรองโลคัลที่ถูกต้อง แทนที่จะรายงานว่าขาด key ใช้ค่าจริงสำหรับ provider ใดก็ตามที่ยอมรับ hostname สาธารณะ
</Note>

หมายเหตุพฤติกรรมสำหรับแบ็กเอนด์ `/v1` แบบโลคัล/ผ่านพร็อกซี:

- OpenClaw ถือว่าสิ่งเหล่านี้เป็น route ที่เข้ากันได้กับ OpenAI แบบ proxy-style ไม่ใช่เอนด์พอยต์ OpenAI แบบเนทีฟ
- การจัดรูปคำขอเฉพาะ OpenAI แบบเนทีฟจะไม่ใช้ที่นี่: ไม่มี `service_tier`, ไม่มี Responses `store`, ไม่มีการจัดรูป payload สำหรับ OpenAI reasoning-compat และไม่มี hint ของ prompt-cache
- header แสดงที่มาของ OpenClaw แบบซ่อน (`originator`, `version`, `User-Agent`) จะไม่ถูกแทรกบน URL พร็อกซีแบบกำหนดเองเหล่านี้

หมายเหตุความเข้ากันได้สำหรับแบ็กเอนด์ที่เข้ากันได้กับ OpenAI และเข้มงวดกว่า:

- บางเซิร์ฟเวอร์ยอมรับเฉพาะ `messages[].content` แบบสตริงบน Chat Completions ไม่ใช่ array ของ content-part แบบมีโครงสร้าง ตั้งค่า `models.providers.<provider>.models[].compat.requiresStringContent: true` สำหรับเอนด์พอยต์เหล่านั้น
- โมเดลโลคัลบางตัวปล่อยคำขอ tool แบบวงเล็บเดี่ยวเป็นข้อความ เช่น `[tool_name]` ตามด้วย JSON และ `[END_TOOL_REQUEST]` OpenClaw จะยกระดับสิ่งเหล่านั้นเป็น tool call จริงก็ต่อเมื่อชื่อตรงกับ tool ที่ลงทะเบียนไว้สำหรับเทิร์นนั้นอย่างพอดี มิฉะนั้นบล็อกนั้นจะถูกถือเป็นข้อความที่ไม่รองรับและถูกซ่อนจากคำตอบที่ผู้ใช้เห็น
- หากโมเดลปล่อย JSON, XML หรือข้อความสไตล์ ReAct ที่ดูเหมือน tool call แต่ provider ไม่ได้ปล่อย invocation แบบมีโครงสร้าง OpenClaw จะปล่อยไว้เป็นข้อความและบันทึกคำเตือนพร้อม run id, provider/model, pattern ที่ตรวจพบ และชื่อ tool เมื่อมี ให้ถือว่านี่เป็นความไม่เข้ากันของ tool-call ของ provider/model ไม่ใช่การรัน tool ที่เสร็จสมบูรณ์
- หาก tool ปรากฏเป็นข้อความของ assistant แทนที่จะถูกรัน เช่น raw JSON, XML, syntax แบบ ReAct หรือ array `tool_calls` ว่างใน response ของ provider ให้ตรวจสอบก่อนว่าเซิร์ฟเวอร์กำลังใช้ chat template/parser ที่รองรับ tool-call สำหรับแบ็กเอนด์ Chat Completions ที่เข้ากันได้กับ OpenAI ซึ่ง parser ทำงานเฉพาะเมื่อบังคับใช้ tool ให้ตั้งค่า override คำขอต่อโมเดลแทนการพึ่งพาการ parse ข้อความ:

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

  ใช้สิ่งนี้เฉพาะกับโมเดล/เซสชันที่ทุกเทิร์นปกติควรเรียก tool เท่านั้น มันจะแทนที่ค่า proxy เริ่มต้นของ OpenClaw คือ `tool_choice: "auto"` แทนที่ `local/my-local-model` ด้วย provider/model ref ที่ตรงตามที่แสดงโดย `openclaw models list`

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- หากโมเดลแบบกำหนดเองที่เข้ากันได้กับ OpenAI ยอมรับ OpenAI reasoning efforts นอกเหนือจากโปรไฟล์ในตัว ให้ประกาศค่าเหล่านั้นบนบล็อก compat ของโมเดล การเพิ่ม `"xhigh"` ที่นี่จะทำให้ `/think xhigh`, ตัวเลือกเซสชัน, การตรวจสอบ Gateway และการตรวจสอบ `llm-task` เปิดเผยระดับนี้สำหรับ provider/model ref ที่กำหนดค่าไว้:

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

หากโมเดลโหลดได้เรียบร้อย แต่ agent turn เต็มรูปแบบทำงานผิดปกติ ให้ไล่จากบนลงล่าง ยืนยัน transport ก่อน แล้วค่อยจำกัดพื้นผิวให้แคบลง

1. **ยืนยันว่าโมเดลภายในเครื่องตอบสนองได้เอง** ไม่มีเครื่องมือ ไม่มีบริบทเอเจนต์:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **ยืนยันการกำหนดเส้นทางของ Gateway** ส่งเฉพาะพรอมป์ที่ระบุเท่านั้น — ข้ามทรานสคริปต์, การบูตสแตรป AGENTS, การประกอบ context-engine, เครื่องมือ และเซิร์ฟเวอร์ MCP ที่รวมมาให้ แต่ยังคงทดสอบการกำหนดเส้นทางของ Gateway, การยืนยันตัวตน และการเลือกผู้ให้บริการ:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **ลองใช้โหมด lean** หากโพรบทั้งสองผ่าน แต่รอบการทำงานจริงของเอเจนต์ล้มเหลวด้วยการเรียกเครื่องมือที่มีรูปแบบไม่ถูกต้องหรือพรอมป์ที่ใหญ่เกินไป ให้เปิดใช้ `agents.defaults.experimental.localModelLean: true` โหมดนี้จะตัดเครื่องมือเริ่มต้นที่หนักที่สุดสามรายการ (`browser`, `cron`, `message`) ออก เพื่อให้รูปแบบพรอมป์เล็กลงและเปราะบางน้อยลง ดู [ฟีเจอร์ทดลอง → โหมด lean สำหรับโมเดลภายในเครื่อง](/th/concepts/experimental-features#local-model-lean-mode) สำหรับคำอธิบายทั้งหมด กรณีที่ควรใช้ และวิธียืนยันว่าเปิดใช้งานอยู่

4. **ปิดใช้งานเครื่องมือทั้งหมดเป็นทางเลือกสุดท้าย** หากโหมด lean ยังไม่พอ ให้ตั้งค่า `models.providers.<provider>.models[].compat.supportsTools: false` สำหรับรายการโมเดลนั้น จากนั้นเอเจนต์จะทำงานโดยไม่มีการเรียกเครื่องมือบนโมเดลนั้น

5. **หลังจากนั้น คอขวดอยู่ที่ต้นทาง** หากแบ็กเอนด์ยังคงล้มเหลวเฉพาะกับการรัน OpenClaw ขนาดใหญ่หลังจากใช้โหมด lean และ `supportsTools: false` แล้ว ปัญหาที่เหลือมักเป็นความจุของโมเดลหรือเซิร์ฟเวอร์ต้นทาง — หน้าต่างบริบท, หน่วยความจำ GPU, การขับไล่ kv-cache หรือบั๊กของแบ็กเอนด์ ณ จุดนั้นปัญหาไม่ได้อยู่ที่ชั้นการรับส่งข้อมูลของ OpenClaw

## การแก้ไขปัญหา

- Gateway เข้าถึงพร็อกซีได้หรือไม่? `curl http://127.0.0.1:1234/v1/models`.
- โมเดล LM Studio ถูกถอนโหลดอยู่หรือไม่? โหลดใหม่; การเริ่มแบบ cold start เป็นสาเหตุของอาการ "ค้าง" ที่พบบ่อย
- เซิร์ฟเวอร์ภายในเครื่องรายงาน `terminated`, `ECONNRESET` หรือปิดสตรีมกลางรอบหรือไม่?
  OpenClaw จะบันทึก `model.call.error.failureKind` ที่มีคาร์ดินาลิตีต่ำ พร้อมกับสแนปช็อต
  RSS/heap ของกระบวนการ OpenClaw ใน diagnostics สำหรับภาวะหน่วยความจำตึงตัวของ LM Studio/Ollama
  ให้เทียบเวลานั้นกับล็อกของเซิร์ฟเวอร์ หรือล็อก crash / jetsam ของ macOS เพื่อยืนยันว่าเซิร์ฟเวอร์โมเดลถูกฆ่าหรือไม่
- OpenClaw คำนวณค่าเกณฑ์ preflight ของหน้าต่างบริบทจากหน้าต่างโมเดลที่ตรวจพบ หรือจากหน้าต่างโมเดลแบบไม่จำกัดเมื่อ `agents.defaults.contextTokens` ลดหน้าต่างที่มีผลจริงลง ระบบจะเตือนเมื่อต่ำกว่า 20% โดยมีพื้นขั้นต่ำ **8k** การบล็อกแบบเด็ดขาดใช้เกณฑ์ 10% โดยมีพื้นขั้นต่ำ **4k** และจำกัดไม่เกินหน้าต่างบริบทที่มีผลจริง เพื่อให้ metadata ของโมเดลที่ใหญ่เกินไปไม่ปฏิเสธค่าจำกัดของผู้ใช้ที่ยังถูกต้องอยู่ หากคุณเจอ preflight นี้ ให้เพิ่มขีดจำกัดบริบทของเซิร์ฟเวอร์/โมเดล หรือเลือกโมเดลที่ใหญ่กว่า
- เกิดข้อผิดพลาดด้านบริบทหรือไม่? ลด `contextWindow` หรือเพิ่มขีดจำกัดของเซิร์ฟเวอร์ของคุณ
- เซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI ส่งคืน `messages[].content ... expected a string` หรือไม่?
  เพิ่ม `compat.requiresStringContent: true` ในรายการโมเดลนั้น
- การเรียก `/v1/chat/completions` ขนาดเล็กโดยตรงทำงานได้ แต่ `openclaw infer model run --local`
  ล้มเหลวบน Gemma หรือโมเดลภายในเครื่องอื่นหรือไม่? ตรวจสอบ URL ของผู้ให้บริการ, อ้างอิงโมเดล, เครื่องหมาย auth
  และล็อกเซิร์ฟเวอร์ก่อน; `model run` ภายในเครื่องไม่รวมเครื่องมือของเอเจนต์
  หาก `model run` ภายในเครื่องสำเร็จ แต่รอบการทำงานของเอเจนต์ที่ใหญ่กว่าล้มเหลว ให้ลดพื้นผิวเครื่องมือของเอเจนต์ด้วย `localModelLean` หรือ `compat.supportsTools: false`
- การเรียกเครื่องมือปรากฏเป็นข้อความ JSON/XML/ReAct ดิบ หรือผู้ให้บริการส่งคืนอาร์เรย์
  `tool_calls` ว่างหรือไม่? อย่าเพิ่มพร็อกซีที่แปลงข้อความ assistant
  เป็นการดำเนินการเครื่องมือแบบไม่พิจารณา ให้แก้ chat template/parser ของเซิร์ฟเวอร์ก่อน หาก
  โมเดลทำงานได้เฉพาะเมื่อบังคับใช้เครื่องมือ ให้เพิ่มการ override รายโมเดล
  `params.extra_body.tool_choice: "required"` ข้างต้น และใช้รายการโมเดลนั้น
  เฉพาะกับเซสชันที่คาดว่าจะมีการเรียกเครื่องมือทุกครั้ง
- ความปลอดภัย: โมเดลภายในเครื่องจะข้ามตัวกรองฝั่งผู้ให้บริการ; จำกัดขอบเขตเอเจนต์ให้แคบและเปิด Compaction ไว้เพื่อลดรัศมีผลกระทบจาก prompt injection

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [การสลับโมเดลเมื่อเกิดข้อผิดพลาด](/th/concepts/model-failover)
