---
read_when:
    - การเลือกหรือสลับโมเดล การกำหนดค่านามแฝง
    - การดีบักการสลับโมเดลสำรอง / "โมเดลทั้งหมดล้มเหลว"
    - ทำความเข้าใจโปรไฟล์การยืนยันตัวตนและวิธีจัดการ
sidebarTitle: Models FAQ
summary: 'คำถามที่พบบ่อย: ค่าเริ่มต้นของโมเดล, การเลือก, นามแฝง, การสลับ, การสลับเมื่อเกิดข้อผิดพลาด, และโปรไฟล์การรับรองความถูกต้อง'
title: 'คำถามที่พบบ่อย: โมเดลและการตรวจสอบสิทธิ์'
x-i18n:
    generated_at: "2026-05-02T10:19:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bf7a6bb4a0e2bf791c73dbb4005ba4628afc2c20e06417f8147f4c65583e884
    source_path: help/faq-models.md
    workflow: 16
---

  Model และโปรไฟล์การยืนยันตัวตนแบบถาม-ตอบ สำหรับการตั้งค่า เซสชัน Gateway ช่องทาง และการแก้ปัญหา โปรดดู [FAQ](/th/help/faq) หลัก

  ## Models: ค่าเริ่มต้น การเลือก alias และการสลับ

  <AccordionGroup>
  <Accordion title='What is the "default model"?'>
    Model เริ่มต้นของ OpenClaw คือสิ่งที่คุณตั้งค่าไว้เป็น:

    ```
    agents.defaults.model.primary
    ```

    อ้างอิง Model ในรูปแบบ `provider/model` (ตัวอย่าง: `openai/gpt-5.5` หรือ `openai-codex/gpt-5.5`) หากคุณละ provider ไว้ OpenClaw จะลอง alias ก่อน จากนั้นจึงลองจับคู่กับ configured-provider ที่ไม่ซ้ำสำหรับ model id นั้นแบบตรงตัว และหลังจากนั้นเท่านั้นจึง fallback ไปยัง provider เริ่มต้นที่ตั้งค่าไว้เป็นเส้นทางความเข้ากันได้แบบเลิกใช้แล้ว หาก provider นั้นไม่ได้เปิดเผย Model เริ่มต้นที่ตั้งค่าไว้อีกต่อไป OpenClaw จะ fallback ไปยัง provider/model แรกที่ตั้งค่าไว้แทนการแสดงค่าเริ่มต้น provider เก่าที่ถูกลบออก คุณยังควรตั้งค่า `provider/model` อย่าง **ชัดเจน**

  </Accordion>

  <Accordion title="What model do you recommend?">
    **ค่าเริ่มต้นที่แนะนำ:** ใช้ Model รุ่นล่าสุดที่แข็งแกร่งที่สุดที่มีใน provider stack ของคุณ
    **สำหรับ agent ที่เปิดใช้เครื่องมือหรือรับอินพุตที่ไม่น่าเชื่อถือ:** ให้ความสำคัญกับความสามารถของ Model มากกว่าต้นทุน
    **สำหรับแชตทั่วไป/ความเสี่ยงต่ำ:** ใช้ Model fallback ที่ถูกกว่าและกำหนดเส้นทางตามบทบาทของ agent

    MiniMax มีเอกสารของตัวเอง: [MiniMax](/th/providers/minimax) และ
    [Model ภายในเครื่อง](/th/gateway/local-models)

    หลักคร่าว ๆ: ใช้ **Model ที่ดีที่สุดที่คุณจ่ายไหว** สำหรับงานที่มีความเสี่ยงสูง และใช้ Model ที่ถูกกว่าสำหรับแชตหรือสรุปทั่วไป คุณสามารถกำหนดเส้นทาง Model ต่อ agent และใช้ sub-agents เพื่อทำงานยาวแบบขนานได้ (แต่ละ sub-agent ใช้ token) ดู [Models](/th/concepts/models) และ
    [Sub-agents](/th/tools/subagents)

    คำเตือนสำคัญ: Model ที่อ่อนกว่าหรือถูก quantize มากเกินไปมีความเสี่ยงต่อ prompt injection และพฤติกรรมที่ไม่ปลอดภัยมากกว่า ดู [Security](/th/gateway/security)

    บริบทเพิ่มเติม: [Models](/th/concepts/models)

  </Accordion>

  <Accordion title="How do I switch models without wiping my config?">
    ใช้ **คำสั่ง Model** หรือแก้ไขเฉพาะฟิลด์ **model** หลีกเลี่ยงการแทนที่ config ทั้งหมด

    ตัวเลือกที่ปลอดภัย:

    - `/model` ในแชต (รวดเร็ว ต่อเซสชัน)
    - `openclaw models set ...` (อัปเดตเฉพาะ config ของ Model)
    - `openclaw configure --section model` (แบบโต้ตอบ)
    - แก้ไข `agents.defaults.model` ใน `~/.openclaw/openclaw.json`

    หลีกเลี่ยง `config.apply` ด้วย object บางส่วน เว้นแต่ว่าคุณตั้งใจจะแทนที่ config ทั้งหมด
    สำหรับการแก้ไขผ่าน RPC ให้ตรวจสอบด้วย `config.schema.lookup` ก่อน และควรใช้ `config.patch` payload ของ lookup จะให้ path ที่ normalize แล้ว เอกสาร/ข้อจำกัด schema แบบตื้น และสรุปลูกโดยตรง
    สำหรับการอัปเดตบางส่วน
    หากคุณเขียนทับ config ไปแล้ว ให้กู้คืนจาก backup หรือรัน `openclaw doctor` อีกครั้งเพื่อซ่อมแซม

    เอกสาร: [Models](/th/concepts/models), [Configure](/th/cli/configure), [Config](/th/cli/config), [Doctor](/th/gateway/doctor)

  </Accordion>

  <Accordion title="Can I use self-hosted models (llama.cpp, vLLM, Ollama)?">
    ได้ Ollama เป็นเส้นทางที่ง่ายที่สุดสำหรับ Model ภายในเครื่อง

    การตั้งค่าที่เร็วที่สุด:

    1. ติดตั้ง Ollama จาก `https://ollama.com/download`
    2. ดึง Model ภายในเครื่อง เช่น `ollama pull gemma4`
    3. หากคุณต้องการ cloud models ด้วย ให้รัน `ollama signin`
    4. รัน `openclaw onboard` แล้วเลือก `Ollama`
    5. เลือก `Local` หรือ `Cloud + Local`

    หมายเหตุ:

    - `Cloud + Local` ให้คุณใช้ cloud models พร้อมกับ Model Ollama ภายในเครื่องของคุณ
    - cloud models เช่น `kimi-k2.5:cloud` ไม่ต้องดึงมาไว้ภายในเครื่อง
    - สำหรับการสลับแบบ manual ให้ใช้ `openclaw models list` และ `openclaw models set ollama/<model>`

    หมายเหตุด้านความปลอดภัย: Model ที่เล็กกว่าหรือถูก quantize หนักมีความเสี่ยงต่อ prompt injection มากกว่า เราแนะนำอย่างยิ่งให้ใช้ **Model ขนาดใหญ่** สำหรับ bot ใด ๆ ที่สามารถใช้เครื่องมือได้
    หากคุณยังต้องการใช้ Model ขนาดเล็ก ให้เปิดใช้ sandboxing และ allowlist เครื่องมือแบบเข้มงวด

    เอกสาร: [Ollama](/th/providers/ollama), [Model ภายในเครื่อง](/th/gateway/local-models),
    [Model providers](/th/concepts/model-providers), [Security](/th/gateway/security),
    [Sandboxing](/th/gateway/sandboxing)

  </Accordion>

  <Accordion title="What do OpenClaw, Flawd, and Krill use for models?">
    - deployment เหล่านี้อาจแตกต่างกันและอาจเปลี่ยนแปลงได้ตามเวลา จึงไม่มีคำแนะนำ provider แบบตายตัว
    - ตรวจสอบการตั้งค่า runtime ปัจจุบันในแต่ละ Gateway ด้วย `openclaw models status`
    - สำหรับ agent ที่ไวต่อความปลอดภัย/เปิดใช้เครื่องมือ ให้ใช้ Model รุ่นล่าสุดที่แข็งแกร่งที่สุดที่มี

  </Accordion>

  <Accordion title="How do I switch models on the fly (without restarting)?">
    ใช้คำสั่ง `/model` เป็นข้อความเดี่ยว:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    เหล่านี้คือ alias ที่มีมาให้ในตัว สามารถเพิ่ม alias แบบกำหนดเองได้ผ่าน `agents.defaults.models`

    คุณสามารถแสดงรายการ Model ที่มีได้ด้วย `/model`, `/model list` หรือ `/model status`

    `/model` (และ `/model list`) จะแสดงตัวเลือกแบบย่อพร้อมหมายเลข เลือกด้วยหมายเลข:

    ```
    /model 3
    ```

    คุณยังสามารถบังคับใช้ auth profile เฉพาะสำหรับ provider ได้ด้วย (ต่อเซสชัน):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    เคล็ดลับ: `/model status` แสดงว่า agent ใดทำงานอยู่ ใช้ไฟล์ `auth-profiles.json` ใด และจะลอง auth profile ใดต่อไป
    นอกจากนี้ยังแสดง endpoint ของ provider ที่ตั้งค่าไว้ (`baseUrl`) และโหมด API (`api`) เมื่อมี

    **ฉันจะยกเลิกการปักหมุดโปรไฟล์ที่ตั้งด้วย @profile ได้อย่างไร?**

    รัน `/model` อีกครั้ง **โดยไม่ต้องมี** suffix `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    หากคุณต้องการกลับไปใช้ค่าเริ่มต้น ให้เลือกจาก `/model` (หรือส่ง `/model <default provider/model>`)
    ใช้ `/model status` เพื่อยืนยันว่า auth profile ใด active อยู่

  </Accordion>

  <Accordion title="Can I use GPT 5.5 for daily tasks and Codex 5.5 for coding?">
    ได้ ให้แยกการเลือก Model ออกจากการเลือก runtime:

    - **Native Codex coding agent:** ตั้ง `agents.defaults.model.primary` เป็น `openai/gpt-5.5` และ `agents.defaults.agentRuntime.id` เป็น `"codex"` เข้าสู่ระบบด้วย `openclaw models auth login --provider openai-codex` เมื่อต้องการใช้การยืนยันตัวตนแบบสมัครสมาชิก ChatGPT/Codex
    - **งาน OpenAI API โดยตรงผ่าน PI:** ใช้ `/model openai/gpt-5.5` โดยไม่ override Codex runtime และตั้งค่า `OPENAI_API_KEY`
    - **Codex OAuth ผ่าน PI:** ใช้ `/model openai-codex/gpt-5.5` เฉพาะเมื่อคุณตั้งใจใช้ runner ปกติของ PI พร้อม Codex OAuth
    - **Sub-agents:** กำหนดเส้นทางงานเขียนโค้ดไปยัง agent ที่ใช้ Codex เท่านั้น พร้อม Model ของตัวเองและค่าเริ่มต้น `agentRuntime`

    ดู [Models](/th/concepts/models) และ [Slash commands](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="How do I configure fast mode for GPT 5.5?">
    ใช้ได้ทั้งการเปิดสวิตช์ต่อเซสชันหรือค่าเริ่มต้นใน config:

    - **ต่อเซสชัน:** ส่ง `/fast on` ขณะที่เซสชันใช้ `openai/gpt-5.5` หรือ `openai-codex/gpt-5.5`
    - **ค่าเริ่มต้นต่อ Model:** ตั้ง `agents.defaults.models["openai/gpt-5.5"].params.fastMode` หรือ `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` เป็น `true`

    ตัวอย่าง:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    สำหรับ OpenAI fast mode จะ map ไปยัง `service_tier = "priority"` ในคำขอ native Responses ที่รองรับ ค่า override ของเซสชัน `/fast` มีผลเหนือค่าเริ่มต้นใน config

    ดู [Thinking and fast mode](/th/tools/thinking) และ [OpenAI fast mode](/th/providers/openai#fast-mode)

  </Accordion>

  <Accordion title='Why do I see "Model ... is not allowed" and then no reply?'>
    หากตั้งค่า `agents.defaults.models` ไว้ มันจะกลายเป็น **allowlist** สำหรับ `/model` และ override ใด ๆ ของเซสชัน การเลือก Model ที่ไม่ได้อยู่ในรายการนั้นจะคืนค่า:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    ข้อผิดพลาดนั้นจะถูกส่งคืน **แทน** การตอบกลับปกติ วิธีแก้: เพิ่ม Model ลงใน `agents.defaults.models`, ลบ allowlist, หรือเลือก Model จาก `/model list`

  </Accordion>

  <Accordion title='Why do I see "Unknown model: minimax/MiniMax-M2.7"?'>
    หมายความว่า **ยังไม่ได้ตั้งค่า provider** (ไม่พบ config หรือ auth profile ของ MiniMax provider) ดังนั้นจึง resolve Model ไม่ได้

    รายการตรวจสอบการแก้ไข:

    1. อัปเกรดเป็น OpenClaw release ปัจจุบัน (หรือรันจาก source `main`) แล้ว restart Gateway
    2. ตรวจสอบว่า MiniMax ถูกตั้งค่าไว้แล้ว (wizard หรือ JSON) หรือมีการยืนยันตัวตน MiniMax อยู่ใน env/auth profiles เพื่อให้ provider ที่ตรงกันถูก inject ได้ (`MINIMAX_API_KEY` สำหรับ `minimax`, `MINIMAX_OAUTH_TOKEN` หรือ MiniMax OAuth ที่จัดเก็บไว้สำหรับ `minimax-portal`)
    3. ใช้ model id ที่ตรงตัว (ตัวพิมพ์เล็ก-ใหญ่มีผล) สำหรับเส้นทางการยืนยันตัวตนของคุณ:
       `minimax/MiniMax-M2.7` หรือ `minimax/MiniMax-M2.7-highspeed` สำหรับการตั้งค่า API key หรือ `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` สำหรับการตั้งค่า OAuth
    4. รัน:

       ```bash
       openclaw models list
       ```

       แล้วเลือกจากรายการ (หรือ `/model list` ในแชต)

    ดู [MiniMax](/th/providers/minimax) และ [Models](/th/concepts/models)

  </Accordion>

  <Accordion title="Can I use MiniMax as my default and OpenAI for complex tasks?">
    ได้ ใช้ **MiniMax เป็นค่าเริ่มต้น** และสลับ Model **ต่อเซสชัน** เมื่อจำเป็น
    Fallback มีไว้สำหรับ **ข้อผิดพลาด** ไม่ใช่ "งานยาก" ดังนั้นให้ใช้ `/model` หรือ agent แยกต่างหาก

    **ตัวเลือก A: สลับต่อเซสชัน**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    จากนั้น:

    ```
    /model gpt
    ```

    **ตัวเลือก B: แยก agent**

    - ค่าเริ่มต้นของ Agent A: MiniMax
    - ค่าเริ่มต้นของ Agent B: OpenAI
    - กำหนดเส้นทางตาม agent หรือใช้ `/agent` เพื่อสลับ

    เอกสาร: [Models](/th/concepts/models), [Multi-Agent Routing](/th/concepts/multi-agent), [MiniMax](/th/providers/minimax), [OpenAI](/th/providers/openai)

  </Accordion>

  <Accordion title="Are opus / sonnet / gpt built-in shortcuts?">
    ใช่ OpenClaw มาพร้อม shorthand เริ่มต้นบางรายการ (ใช้เฉพาะเมื่อ Model มีอยู่ใน `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` สำหรับการตั้งค่า API key หรือ `openai-codex/gpt-5.5` เมื่อตั้งค่าสำหรับ Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    หากคุณตั้ง alias ของตัวเองด้วยชื่อเดียวกัน ค่าของคุณจะมีผล

  </Accordion>

  <Accordion title="How do I define/override model shortcuts (aliases)?">
    Alias มาจาก `agents.defaults.models.<modelId>.alias` ตัวอย่าง:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    จากนั้น `/model sonnet` (หรือ `/<alias>` เมื่อรองรับ) จะ resolve ไปยัง model ID นั้น

  </Accordion>

  <Accordion title="How do I add models from other providers like OpenRouter or Z.AI?">
    OpenRouter (จ่ายตาม token; มี Model จำนวนมาก):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (Model GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    หากคุณอ้างอิง provider/model แต่ไม่มีคีย์ provider ที่จำเป็น คุณจะได้รับข้อผิดพลาดการยืนยันตัวตนขณะรันไทม์ (เช่น `No API key found for provider "zai"`)

    **ไม่พบคีย์ API สำหรับ provider หลังจากเพิ่ม agent ใหม่**

    โดยปกติหมายความว่า **agent ใหม่** มี auth store ว่างเปล่า Auth แยกตาม agent และ
    จัดเก็บไว้ใน:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    ตัวเลือกการแก้ไข:

    - รัน `openclaw agents add <id>` และกำหนดค่า auth ระหว่าง wizard
    - หรือคัดลอกเฉพาะโปรไฟล์ `api_key` / `token` แบบสแตติกที่พกพาได้จาก auth store ของ agent หลักไปยัง auth store ของ agent ใหม่
    - สำหรับโปรไฟล์ OAuth ให้ลงชื่อเข้าใช้จาก agent ใหม่เมื่อจำเป็นต้องใช้บัญชีของตัวเอง มิฉะนั้น OpenClaw สามารถอ่านต่อไปยัง agent เริ่มต้น/หลักได้โดยไม่ต้องโคลน refresh token

    อย่าใช้ `agentDir` ซ้ำข้าม agent เพราะจะทำให้ auth/session ชนกัน

  </Accordion>
</AccordionGroup>

## การสลับโมเดลสำรองและ "All models failed"

<AccordionGroup>
  <Accordion title="การสลับสำรองทำงานอย่างไร?">
    การสลับสำรองเกิดขึ้นในสองขั้นตอน:

    1. **การหมุนเวียนโปรไฟล์ auth** ภายใน provider เดียวกัน
    2. **การ fallback ของโมเดล** ไปยังโมเดลถัดไปใน `agents.defaults.model.fallbacks`

    Cooldown ใช้กับโปรไฟล์ที่ล้มเหลว (exponential backoff) ดังนั้น OpenClaw จึงยังตอบสนองต่อไปได้แม้ provider ถูกจำกัดอัตราหรือล้มเหลวชั่วคราว

    กลุ่ม rate-limit ครอบคลุมมากกว่าการตอบกลับ `429` ธรรมดา OpenClaw
    ยังถือว่าข้อความอย่าง `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` และข้อจำกัด
    usage-window เป็นระยะ (`weekly/monthly limit reached`) เป็น rate limit
    ที่ควรสลับสำรอง

    การตอบกลับบางอย่างที่ดูเหมือนเกี่ยวกับ billing ไม่ใช่ `402` และการตอบกลับ HTTP `402`
    บางรายการก็ยังอยู่ในกลุ่มชั่วคราวนั้นเช่นกัน หาก provider ส่งคืน
    ข้อความ billing ที่ชัดเจนบน `401` หรือ `403` OpenClaw ยังสามารถเก็บสิ่งนั้นไว้ใน
    ช่องทาง billing ได้ แต่ตัวจับคู่ข้อความเฉพาะ provider จะยังจำกัดขอบเขตอยู่กับ
    provider ที่เป็นเจ้าของเท่านั้น (เช่น OpenRouter `Key limit exceeded`) หากข้อความ `402`
    ดูเหมือน usage-window ที่ลองใหม่ได้ หรือ
    ขีดจำกัดการใช้จ่ายขององค์กร/เวิร์กสเปซ (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) แทน OpenClaw จะถือว่าเป็น
    `rate_limit` ไม่ใช่การปิดใช้ billing ระยะยาว

    ข้อผิดพลาด context-overflow แตกต่างออกไป: ลายเซ็นอย่าง
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` หรือ `ollama error: context length
    exceeded` จะยังอยู่บนเส้นทาง compaction/retry แทนที่จะเลื่อน
    fallback ของโมเดล

    ข้อความ server-error ทั่วไปถูกจำกัดให้แคบกว่า "อะไรก็ตามที่มี
    unknown/error อยู่ในนั้น" โดยเจตนา OpenClaw จะถือว่ารูปแบบชั่วคราวที่จำกัดตาม provider
    เช่น Anthropic แบบสั้น `An unknown error occurred`, OpenRouter แบบสั้น
    `Provider returned error`, ข้อผิดพลาด stop-reason อย่าง `Unhandled stop reason:
    error`, payload JSON `api_error` ที่มีข้อความเซิร์ฟเวอร์ชั่วคราว
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) และข้อผิดพลาด provider-busy อย่าง `ModelNotReadyException` เป็น
    สัญญาณ timeout/overloaded ที่ควรสลับสำรองเมื่อบริบทของ provider
    ตรงกัน
    ข้อความ fallback ภายในทั่วไปอย่าง `LLM request failed with an unknown
    error.` จะยังคงระมัดระวังและไม่เรียก fallback ของโมเดลด้วยตัวเอง

  </Accordion>

  <Accordion title='ข้อความ "No credentials found for profile anthropic:default" หมายความว่าอย่างไร?'>
    หมายความว่าระบบพยายามใช้ ID โปรไฟล์ auth `anthropic:default` แต่ไม่พบข้อมูลรับรองสำหรับโปรไฟล์นั้นใน auth store ที่คาดไว้

    **เช็กลิสต์การแก้ไข:**

    - **ยืนยันว่าโปรไฟล์ auth อยู่ที่ใด** (พาธใหม่เทียบกับพาธ legacy)
      - ปัจจุบัน: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legacy: `~/.openclaw/agent/*` (ย้ายข้อมูลโดย `openclaw doctor`)
    - **ยืนยันว่า env var ของคุณถูกโหลดโดย Gateway**
      - หากคุณตั้งค่า `ANTHROPIC_API_KEY` ใน shell แต่รัน Gateway ผ่าน systemd/launchd อาจไม่ได้สืบทอดค่านั้น ให้ใส่ไว้ใน `~/.openclaw/.env` หรือเปิดใช้ `env.shellEnv`
    - **ตรวจให้แน่ใจว่าคุณกำลังแก้ไข agent ที่ถูกต้อง**
      - การตั้งค่าแบบหลาย agent หมายความว่าอาจมีไฟล์ `auth-profiles.json` หลายไฟล์
    - **ตรวจสอบสถานะ model/auth เบื้องต้น**
      - ใช้ `openclaw models status` เพื่อดูโมเดลที่กำหนดค่าไว้และตรวจว่า provider ได้ยืนยันตัวตนแล้วหรือไม่

    **เช็กลิสต์การแก้ไขสำหรับ "No credentials found for profile anthropic"**

    หมายความว่าการรันถูกตรึงไว้กับโปรไฟล์ auth ของ Anthropic แต่ Gateway
    หาโปรไฟล์นั้นใน auth store ไม่พบ

    - **ใช้ Claude CLI**
      - รัน `openclaw models auth login --provider anthropic --method cli --set-default` บนโฮสต์ gateway
    - **หากคุณต้องการใช้คีย์ API แทน**
      - ใส่ `ANTHROPIC_API_KEY` ใน `~/.openclaw/.env` บน **โฮสต์ gateway**
      - ล้างลำดับที่ถูกตรึงไว้ซึ่งบังคับใช้โปรไฟล์ที่หายไป:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **ยืนยันว่าคุณกำลังรันคำสั่งบนโฮสต์ gateway**
      - ในโหมดระยะไกล โปรไฟล์ auth อยู่บนเครื่อง gateway ไม่ใช่แล็ปท็อปของคุณ

  </Accordion>

  <Accordion title="ทำไมจึงลอง Google Gemini แล้วล้มเหลวด้วย?">
    หากการกำหนดค่าโมเดลของคุณมี Google Gemini เป็น fallback (หรือคุณเปลี่ยนไปใช้ตัวย่อ Gemini) OpenClaw จะลองใช้ระหว่าง fallback ของโมเดล หากคุณยังไม่ได้กำหนดค่าข้อมูลรับรอง Google คุณจะเห็น `No API key found for provider "google"`

    วิธีแก้ไข: ให้ระบุ auth ของ Google หรือลบ/หลีกเลี่ยงโมเดล Google ใน `agents.defaults.model.fallbacks` / aliases เพื่อไม่ให้ fallback ส่งเส้นทางไปที่นั่น

    **คำขอ LLM ถูกปฏิเสธ: ต้องมี thinking signature (Google Antigravity)**

    สาเหตุ: ประวัติเซสชันมี **thinking blocks ที่ไม่มี signatures** (มักมาจาก
    สตรีมที่ถูกยกเลิก/บางส่วน) Google Antigravity ต้องการ signatures สำหรับ thinking blocks

    วิธีแก้ไข: ตอนนี้ OpenClaw จะตัด thinking blocks ที่ไม่มีลายเซ็นออกสำหรับ Google Antigravity Claude หากยังปรากฏอยู่ ให้เริ่ม **เซสชันใหม่** หรือใช้ `/thinking off` สำหรับ agent นั้น

  </Accordion>
</AccordionGroup>

## โปรไฟล์ auth: คืออะไรและจัดการอย่างไร

ที่เกี่ยวข้อง: [/concepts/oauth](/th/concepts/oauth) (โฟลว์ OAuth, การจัดเก็บ token, รูปแบบหลายบัญชี)

<AccordionGroup>
  <Accordion title="โปรไฟล์ auth คืออะไร?">
    โปรไฟล์ auth คือบันทึกข้อมูลรับรองที่มีชื่อ (OAuth หรือคีย์ API) ที่ผูกกับ provider โปรไฟล์อยู่ใน:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="ID โปรไฟล์โดยทั่วไปมีอะไรบ้าง?">
    OpenClaw ใช้ ID ที่มีคำนำหน้า provider เช่น:

    - `anthropic:default` (พบได้ทั่วไปเมื่อไม่มี identity อีเมล)
    - `anthropic:<email>` สำหรับ identity OAuth
    - ID ที่กำหนดเองซึ่งคุณเลือก (เช่น `anthropic:work`)

  </Accordion>

  <Accordion title="ฉันควบคุมได้ไหมว่าจะลองโปรไฟล์ auth ใดก่อน?">
    ได้ การกำหนดค่ารองรับ metadata ทางเลือกสำหรับโปรไฟล์และการจัดลำดับต่อ provider (`auth.order.<provider>`) สิ่งนี้ **ไม่** จัดเก็บ secrets แต่จะจับคู่ ID กับ provider/mode และตั้งค่าลำดับการหมุนเวียน

    OpenClaw อาจข้ามโปรไฟล์ชั่วคราวหากอยู่ใน **cooldown** ระยะสั้น (rate limits/timeouts/auth failures) หรือสถานะ **disabled** ที่ยาวกว่า (billing/credits ไม่พอ) หากต้องการตรวจสอบ ให้รัน `openclaw models status --json` และดู `auth.unusableProfiles` การปรับแต่ง: `auth.cooldowns.billingBackoffHours*`

    Cooldown ของ rate-limit สามารถจำกัดตามโมเดลได้ โปรไฟล์ที่กำลัง cooling down
    สำหรับโมเดลหนึ่งยังอาจใช้งานได้กับโมเดลพี่น้องบน provider เดียวกัน
    ขณะที่ช่วง billing/disabled ยังบล็อกทั้งโปรไฟล์

    คุณยังสามารถตั้งค่าการ override ลำดับแบบ **ต่อ agent** (จัดเก็บใน `auth-state.json` ของ agent นั้น) ผ่าน CLI:

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    เพื่อกำหนดเป้าหมาย agent เฉพาะ:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    เพื่อตรวจสอบว่าสุดท้ายแล้วจะลองใช้อะไรจริง ให้ใช้:

    ```bash
    openclaw models status --probe
    ```

    หากโปรไฟล์ที่จัดเก็บไว้ถูกละไว้จากลำดับที่ระบุไว้อย่างชัดเจน probe จะรายงาน
    `excluded_by_auth_order` สำหรับโปรไฟล์นั้นแทนที่จะลองใช้อย่างเงียบ ๆ

  </Accordion>

  <Accordion title="OAuth เทียบกับคีย์ API - ต่างกันอย่างไร?">
    OpenClaw รองรับทั้งสองแบบ:

    - **OAuth** มักใช้ประโยชน์จากการเข้าถึงแบบ subscription (เมื่อใช้ได้)
    - **คีย์ API** ใช้การคิดค่าบริการตาม token ที่ใช้

    wizard รองรับ Anthropic Claude CLI, OpenAI Codex OAuth และคีย์ API อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [FAQ](/th/help/faq) — FAQ หลัก
- [FAQ — การเริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก](/th/help/faq-first-run)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [การสลับโมเดลสำรอง](/th/concepts/model-failover)
