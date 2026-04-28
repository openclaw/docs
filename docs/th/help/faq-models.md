---
read_when:
    - การเลือกหรือสลับ models และการกำหนดค่า aliases
    - การดีบัก model failover / "All models failed"
    - การทำความเข้าใจ auth profiles และวิธีจัดการ դրանք
sidebarTitle: Models FAQ
summary: 'FAQ: ค่าเริ่มต้นของโมเดล การเลือก aliases การสลับ failover และ auth profiles'
title: 'FAQ: โมเดลและ auth'
x-i18n:
    generated_at: "2026-04-26T11:32:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: e060b48951b76d76a7f613b2abe3fdd845e34ae9eb5cbb36f45544f114edace7
    source_path: help/faq-models.md
    workflow: 15
---

  คำถามและคำตอบเกี่ยวกับ model และ auth profile สำหรับการตั้งค่า sessions, gateway, channels และการแก้ปัญหา โปรดดู [FAQ](/th/help/faq) หลัก

  ## Models: ค่าเริ่มต้น การเลือก aliases การสลับ

  <AccordionGroup>
  <Accordion title='“model ค่าเริ่มต้น” คืออะไร?'>
    model ค่าเริ่มต้นของ OpenClaw คือสิ่งที่คุณตั้งไว้เป็น:

    ```
    agents.defaults.model.primary
    ```

    models จะถูกอ้างอิงเป็น `provider/model` (ตัวอย่าง: `openai/gpt-5.5` หรือ `openai-codex/gpt-5.5`) หากคุณละ provider ออก OpenClaw จะลอง alias ก่อน จากนั้นจึงลองจับคู่ configured-provider แบบไม่กำกวมสำหรับ model id นั้นแบบตรงตัว และหลังจากนั้นจึง fallback ไปยัง provider ค่าเริ่มต้นที่กำหนดไว้ในฐานะเส้นทางความเข้ากันได้แบบ deprecated เท่านั้น หาก provider นั้นไม่ได้เปิดเผย model ค่าเริ่มต้นที่กำหนดไว้อีกต่อไป OpenClaw จะ fallback ไปยัง provider/model รายการแรกที่กำหนดค่าไว้แทนที่จะไปแสดงค่าเริ่มต้นของ provider ที่ล้าสมัยและถูกถอดออกแล้ว คุณยังควรตั้ง `provider/model` แบบ **ชัดเจน** อยู่ดี

  </Accordion>

  <Accordion title="คุณแนะนำ model ไหน?">
    **ค่าเริ่มต้นที่แนะนำ:** ใช้ model รุ่นล่าสุดที่แข็งแกร่งที่สุดที่มีในชุดผู้ให้บริการของคุณ
    **สำหรับเอเจนต์ที่เปิดใช้ tools หรือรับอินพุตที่ไม่น่าเชื่อถือ:** ให้ความสำคัญกับความแข็งแกร่งของ model มากกว่าต้นทุน
    **สำหรับการแชตทั่วไป/ความเสี่ยงต่ำ:** ใช้ fallback models ที่ถูกกว่าและกำหนดเส้นทางตามบทบาทของเอเจนต์

    MiniMax มีเอกสารของตัวเอง: [MiniMax](/th/providers/minimax) และ
    [Local models](/th/gateway/local-models)

    หลักง่ายๆ คือ ใช้ **model ที่ดีที่สุดเท่าที่คุณจ่ายไหว** สำหรับงานที่มีความสำคัญสูง และใช้
    model ที่ถูกกว่าสำหรับการแชตทั่วไปหรือการสรุป คุณสามารถกำหนดเส้นทาง models ต่อเอเจนต์และใช้ sub-agents เพื่อ
    ทำงานยาวแบบขนานได้ (แต่ละ sub-agent จะใช้ tokens) ดู [Models](/th/concepts/models) และ
    [Sub-agents](/th/tools/subagents)

    คำเตือนสำคัญ: models ที่อ่อนกว่าหรือถูก quantize มากเกินไปจะเสี่ยงต่อ prompt
    injection และพฤติกรรมที่ไม่ปลอดภัยมากกว่า ดู [Security](/th/gateway/security)

    บริบทเพิ่มเติม: [Models](/th/concepts/models)

  </Accordion>

  <Accordion title="จะสลับ models โดยไม่ล้างคอนฟิกได้อย่างไร?">
    ใช้ **คำสั่ง model** หรือแก้เฉพาะฟิลด์ **model** เท่านั้น หลีกเลี่ยงการแทนที่คอนฟิกทั้งชุด

    ตัวเลือกที่ปลอดภัย:

    - `/model` ในแชต (เร็ว และมีผลต่อเซสชัน)
    - `openclaw models set ...` (อัปเดตเฉพาะคอนฟิก model)
    - `openclaw configure --section model` (แบบโต้ตอบ)
    - แก้ `agents.defaults.model` ใน `~/.openclaw/openclaw.json`

    หลีกเลี่ยง `config.apply` พร้อม partial object เว้นแต่คุณตั้งใจจะแทนที่คอนฟิกทั้งหมด
    สำหรับการแก้ไขผ่าน RPC ให้ตรวจสอบด้วย `config.schema.lookup` ก่อน และควรใช้ `config.patch`
    payload จาก lookup จะให้ normalized path, เอกสาร/ข้อกำหนดของ schema ระดับตื้น และสรุปลูกโดยตรง
    สำหรับการอัปเดตบางส่วน
    หากคุณเขียนทับคอนฟิกไปแล้ว ให้กู้คืนจาก backup หรือรัน `openclaw doctor` ใหม่เพื่อซ่อมแซม

    เอกสาร: [Models](/th/concepts/models), [Configure](/th/cli/configure), [Config](/th/cli/config), [Doctor](/th/gateway/doctor)

  </Accordion>

  <Accordion title="ฉันใช้ self-hosted models (llama.cpp, vLLM, Ollama) ได้ไหม?">
    ได้ Ollama เป็นเส้นทางที่ง่ายที่สุดสำหรับ local models

    การตั้งค่าที่เร็วที่สุด:

    1. ติดตั้ง Ollama จาก `https://ollama.com/download`
    2. ดึง local model เช่น `ollama pull gemma4`
    3. หากคุณต้องการ cloud models ด้วย ให้รัน `ollama signin`
    4. รัน `openclaw onboard` แล้วเลือก `Ollama`
    5. เลือก `Local` หรือ `Cloud + Local`

    หมายเหตุ:

    - `Cloud + Local` จะให้ทั้ง cloud models และ local Ollama models ของคุณ
    - cloud models เช่น `kimi-k2.5:cloud` ไม่ต้องดึงในเครื่อง
    - สำหรับการสลับด้วยตนเอง ให้ใช้ `openclaw models list` และ `openclaw models set ollama/<model>`

    หมายเหตุด้านความปลอดภัย: models ที่เล็กกว่าหรือถูก quantize หนักจะเสี่ยงต่อ prompt
    injection มากกว่า เราแนะนำอย่างยิ่งให้ใช้ **large models** สำหรับบอทใดก็ตามที่ใช้ tools ได้
    หากคุณยังต้องการใช้ models ขนาดเล็ก ให้เปิด sandboxing และใช้ tool allowlists แบบเข้มงวด

    เอกสาร: [Ollama](/th/providers/ollama), [Local models](/th/gateway/local-models),
    [Model providers](/th/concepts/model-providers), [Security](/th/gateway/security),
    [Sandboxing](/th/gateway/sandboxing)

  </Accordion>

  <Accordion title="OpenClaw, Flawd และ Krill ใช้อะไรเป็น models?">
    - deployments เหล่านี้อาจแตกต่างกันและอาจเปลี่ยนแปลงได้ตลอดเวลา; ไม่มีคำแนะนำเรื่อง provider ที่ตายตัว
    - ตรวจสอบการตั้งค่า runtime ปัจจุบันบนแต่ละ gateway ด้วย `openclaw models status`
    - สำหรับเอเจนต์ที่เกี่ยวข้องกับความปลอดภัย/เปิดใช้ tools ให้ใช้ model รุ่นล่าสุดที่แข็งแกร่งที่สุดเท่าที่มี

  </Accordion>

  <Accordion title="จะสลับ models แบบทันที (โดยไม่ต้องรีสตาร์ต) ได้อย่างไร?">
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

    เหล่านี้คือ aliases แบบ built-in คุณสามารถเพิ่ม custom aliases ได้ผ่าน `agents.defaults.models`

    คุณสามารถแสดงรายการ models ที่ใช้ได้ด้วย `/model`, `/model list` หรือ `/model status`

    `/model` (และ `/model list`) จะแสดงตัวเลือกแบบกะทัดรัดพร้อมหมายเลข เลือกด้วยหมายเลข:

    ```
    /model 3
    ```

    คุณยังสามารถบังคับ auth profile เฉพาะสำหรับ provider ได้ (ต่อเซสชัน):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    เคล็ดลับ: `/model status` จะแสดงว่าเอเจนต์ใดกำลัง active อยู่, ใช้ไฟล์ `auth-profiles.json` ไฟล์ไหน และ auth profile ใดจะถูกลองเป็นรายการถัดไป
    นอกจากนี้ยังแสดง provider endpoint (`baseUrl`) และโหมด API (`api`) ที่กำหนดค่าไว้เมื่อมี

    **จะยกเลิกการตรึง profile ที่ตั้งด้วย @profile ได้อย่างไร?**

    รัน `/model` ใหม่ **โดยไม่ใส่** suffix `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    หากคุณต้องการกลับไปใช้ค่าเริ่มต้น ให้เลือกจาก `/model` (หรือส่ง `/model <default provider/model>`)
    ใช้ `/model status` เพื่อยืนยันว่า auth profile ใดกำลัง active อยู่

  </Accordion>

  <Accordion title="ฉันใช้ GPT 5.5 สำหรับงานประจำวัน และ Codex 5.5 สำหรับงานเขียนโค้ดได้ไหม?">
    ได้ ตั้งค่าตัวหนึ่งเป็นค่าเริ่มต้น แล้วสลับเมื่อจำเป็น:

    - **สลับเร็ว (ต่อเซสชัน):** `/model openai/gpt-5.5` สำหรับงานปัจจุบันที่ใช้ OpenAI API key โดยตรง หรือ `/model openai-codex/gpt-5.5` สำหรับงาน GPT-5.5 Codex OAuth
    - **ค่าเริ่มต้น:** ตั้ง `agents.defaults.model.primary` เป็น `openai/gpt-5.5` สำหรับการใช้ API key หรือ `openai-codex/gpt-5.5` สำหรับการใช้ GPT-5.5 Codex OAuth
    - **Sub-agents:** กำหนดเส้นทางงานเขียนโค้ดไปยัง sub-agents ที่มี model ค่าเริ่มต้นต่างออกไป

    ดู [Models](/th/concepts/models) และ [Slash commands](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="จะกำหนดค่า fast mode สำหรับ GPT 5.5 ได้อย่างไร?">
    ใช้ได้ทั้งตัวสลับต่อเซสชันหรือค่าเริ่มต้นในคอนฟิก:

    - **ต่อเซสชัน:** ส่ง `/fast on` ขณะที่เซสชันกำลังใช้ `openai/gpt-5.5` หรือ `openai-codex/gpt-5.5`
    - **ค่าเริ่มต้นต่อ model:** ตั้ง `agents.defaults.models["openai/gpt-5.5"].params.fastMode` หรือ `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` เป็น `true`

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

    สำหรับ OpenAI, fast mode จะถูกแมปเป็น `service_tier = "priority"` บน native Responses requests ที่รองรับ คำสั่ง `/fast` ระดับเซสชันมีผลเหนือกว่าค่าเริ่มต้นในคอนฟิก

    ดู [Thinking and fast mode](/th/tools/thinking) และ [OpenAI fast mode](/th/providers/openai#fast-mode)

  </Accordion>

  <Accordion title='ทำไมฉันจึงเห็น "Model ... is not allowed" แล้วก็ไม่มีคำตอบ?'>
    หากมีการตั้ง `agents.defaults.models` ค่านั้นจะกลายเป็น **allowlist** สำหรับ `/model` และ
    session overrides ใดๆ การเลือก model ที่ไม่ได้อยู่ในรายการนั้นจะส่งกลับว่า:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    ข้อผิดพลาดนี้จะถูกส่งกลับ **แทน** คำตอบปกติ วิธีแก้คือ: เพิ่ม model นั้นลงใน
    `agents.defaults.models`, ลบ allowlist ออก หรือเลือก model จาก `/model list`

  </Accordion>

  <Accordion title='ทำไมฉันจึงเห็น "Unknown model: minimax/MiniMax-M2.7"?'>
    นี่หมายความว่า **provider ยังไม่ได้รับการกำหนดค่า** (ไม่พบคอนฟิก MiniMax หรือ auth
    profile ของ MiniMax) ดังนั้น model จึงไม่สามารถ resolve ได้

    รายการตรวจสอบเพื่อแก้ไข:

    1. อัปเกรดเป็น OpenClaw รุ่นปัจจุบัน (หรือรันจาก source `main`) แล้วรีสตาร์ต gateway
    2. ตรวจสอบว่าได้กำหนดค่า MiniMax แล้ว (ผ่าน wizard หรือ JSON) หรือมี MiniMax auth
       อยู่ใน env/auth profiles เพื่อให้สามารถ inject provider ที่ตรงกันได้
       (`MINIMAX_API_KEY` สำหรับ `minimax`, `MINIMAX_OAUTH_TOKEN` หรือ MiniMax
       OAuth ที่จัดเก็บไว้สำหรับ `minimax-portal`)
    3. ใช้ model id ที่ตรงเป๊ะ (แยกตัวพิมพ์เล็กใหญ่) สำหรับเส้นทาง auth ของคุณ:
       `minimax/MiniMax-M2.7` หรือ `minimax/MiniMax-M2.7-highspeed` สำหรับการตั้งค่าแบบ API-key
       หรือ `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` สำหรับการตั้งค่าแบบ OAuth
    4. รัน:

       ```bash
       openclaw models list
       ```

       แล้วเลือกจากรายการ (หรือ `/model list` ในแชต)

    ดู [MiniMax](/th/providers/minimax) และ [Models](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันใช้ MiniMax เป็นค่าเริ่มต้นและใช้ OpenAI สำหรับงานซับซ้อนได้ไหม?">
    ได้ ใช้ **MiniMax เป็นค่าเริ่มต้น** แล้วสลับ models **ต่อเซสชัน** เมื่อจำเป็น
    fallbacks มีไว้สำหรับ **ข้อผิดพลาด** ไม่ใช่ “งานยาก” ดังนั้นให้ใช้ `/model` หรือใช้เอเจนต์แยก

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

    **ตัวเลือก B: เอเจนต์แยกกัน**

    - เอเจนต์ A ค่าเริ่มต้น: MiniMax
    - เอเจนต์ B ค่าเริ่มต้น: OpenAI
    - กำหนดเส้นทางตามเอเจนต์ หรือใช้ `/agent` เพื่อสลับ

    เอกสาร: [Models](/th/concepts/models), [Multi-Agent Routing](/th/concepts/multi-agent), [MiniMax](/th/providers/minimax), [OpenAI](/th/providers/openai)

  </Accordion>

  <Accordion title="opus / sonnet / gpt เป็น shortcuts แบบ built-in ไหม?">
    ใช่ OpenClaw มาพร้อม shorthand เริ่มต้นบางรายการ (จะใช้ก็ต่อเมื่อมี model อยู่ใน `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` สำหรับการตั้งค่าแบบ API-key หรือ `openai-codex/gpt-5.5` เมื่อกำหนดค่าให้ใช้ Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    หากคุณตั้ง alias ของตัวเองโดยใช้ชื่อเดียวกัน ค่าของคุณจะมีผลเหนือกว่า

  </Accordion>

  <Accordion title="จะกำหนด/override model shortcuts (aliases) ได้อย่างไร?">
    aliases มาจาก `agents.defaults.models.<modelId>.alias` ตัวอย่าง:

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

  <Accordion title="จะเพิ่ม models จากผู้ให้บริการอื่น เช่น OpenRouter หรือ Z.AI ได้อย่างไร?">
    OpenRouter (จ่ายตาม token; มีหลาย models):

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

    Z.AI (GLM models):

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

    หากคุณอ้างอิง `provider/model` แต่ไม่มีคีย์ของ provider ที่จำเป็น คุณจะได้รับข้อผิดพลาดด้าน auth ระหว่าง runtime (เช่น `No API key found for provider "zai"`)

    **No API key found for provider after adding a new agent**

    โดยปกติหมายความว่า **agent ใหม่** มี auth store ว่างเปล่า auth เป็นแบบต่อเอเจนต์และ
    ถูกเก็บไว้ที่:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    วิธีแก้:

    - รัน `openclaw agents add <id>` และกำหนดค่า auth ระหว่างตัวช่วยตั้งค่า
    - หรือคัดลอก `auth-profiles.json` จาก `agentDir` ของเอเจนต์หลักไปยัง `agentDir` ของเอเจนต์ใหม่

    อย่าใช้ `agentDir` ร่วมกันระหว่างเอเจนต์; เพราะจะทำให้เกิดการชนกันของ auth/session

  </Accordion>
</AccordionGroup>

## Model failover และ "All models failed"

<AccordionGroup>
  <Accordion title="failover ทำงานอย่างไร?">
    failover เกิดขึ้นสองขั้นตอน:

    1. **การหมุนเวียน auth profile** ภายใน provider เดียวกัน
    2. **model fallback** ไปยัง model ถัดไปใน `agents.defaults.model.fallbacks`

    ช่วงคูลดาวน์จะถูกใช้กับ profiles ที่ล้มเหลว (exponential backoff) ดังนั้น OpenClaw จึงยังตอบสนองต่อได้แม้ provider จะถูก rate-limit หรือล้มเหลวชั่วคราว

    bucket ของ rate-limit ครอบคลุมมากกว่าการตอบกลับ `429` แบบธรรมดา OpenClaw
    ยังถือว่าข้อความอย่าง `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` และขีดจำกัด
    ตามหน้าต่างการใช้งานเป็นช่วง (`weekly/monthly limit reached`) เป็น
    rate limits ที่ควรทำ failover เช่นกัน

    การตอบกลับบางอย่างที่ดูเหมือนเกี่ยวกับการเรียกเก็บเงินอาจไม่ใช่ `402` และการตอบกลับ HTTP `402`
    บางส่วนก็ยังอยู่ใน bucket ชั่วคราวนั้น หาก provider ส่ง
    ข้อความเกี่ยวกับการเรียกเก็บเงินอย่างชัดเจนบน `401` หรือ `403`, OpenClaw ก็ยังสามารถจัดให้อยู่ใน
    กลุ่ม billing ได้ แต่ text matchers แบบเฉพาะ provider จะยังคงจำกัดอยู่กับ
    provider ที่เป็นเจ้าของมันเท่านั้น (เช่น OpenRouter `Key limit exceeded`) หากข้อความ `402`
    กลับดูเหมือนเป็นขีดจำกัดตามหน้าต่างการใช้งานที่ retry ได้ หรือ
    ขีดจำกัดการใช้จ่ายของ organization/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw จะจัดให้เป็น
    `rate_limit` ไม่ใช่การปิดใช้งานแบบ billing ระยะยาว

    ข้อผิดพลาดเรื่อง context overflow แตกต่างออกไป: รูปแบบอย่าง
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` หรือ `ollama error: context length
    exceeded` จะยังคงอยู่บนเส้นทาง compaction/retry แทนที่จะขยับ model
    fallback

    ข้อความ generic server-error ถูกตั้งใจให้แคบกว่า “อะไรก็ตามที่มี
    unknown/error อยู่ในนั้น” OpenClaw ถือว่ารูปแบบชั่วคราวที่อยู่ในขอบเขตของ provider
    เช่น Anthropic แบบ plain `An unknown error occurred`, OpenRouter แบบ plain
    `Provider returned error`, stop-reason errors เช่น `Unhandled stop reason:
    error`, JSON payloads แบบ `api_error` ที่มีข้อความเซิร์ฟเวอร์ชั่วคราว
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) และข้อผิดพลาดแบบ provider-busy เช่น `ModelNotReadyException` เป็น
    สัญญาณ timeout/overloaded ที่ควรทำ failover เมื่อบริบทของ provider ตรงกัน
    ข้อความ fallback ภายในแบบ generic เช่น `LLM request failed with an unknown
    error.` จะยังคงใช้เกณฑ์ระมัดระวังและจะไม่ทริกเกอร์ model fallback ด้วยตัวเอง

  </Accordion>

  <Accordion title='“No credentials found for profile anthropic:default” หมายความว่าอะไร?'>
    หมายความว่าระบบพยายามใช้ auth profile ID `anthropic:default` แต่ไม่พบ credentials สำหรับมันใน auth store ที่คาดไว้

    **รายการตรวจสอบเพื่อแก้ไข:**

    - **ยืนยันว่า auth profiles อยู่ที่ไหน** (พาธใหม่กับพาธเดิม)
      - ปัจจุบัน: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - เดิม: `~/.openclaw/agent/*` (จะถูกย้ายด้วย `openclaw doctor`)
    - **ยืนยันว่า Gateway โหลด env var ของคุณแล้ว**
      - หากคุณตั้ง `ANTHROPIC_API_KEY` ไว้ใน shell แต่รัน Gateway ผ่าน systemd/launchd ระบบอาจไม่สืบทอดค่านั้น ใส่ไว้ใน `~/.openclaw/.env` หรือเปิด `env.shellEnv`
    - **ตรวจสอบว่าคุณกำลังแก้ไขเอเจนต์ที่ถูกต้อง**
      - การตั้งค่าแบบหลายเอเจนต์หมายความว่าอาจมีไฟล์ `auth-profiles.json` หลายไฟล์
    - **ตรวจสอบสถานะ model/auth แบบพื้นฐาน**
      - ใช้ `openclaw models status` เพื่อดู models ที่กำหนดค่าไว้และดูว่าผู้ให้บริการได้รับการยืนยันตัวตนหรือไม่

    **รายการตรวจสอบเพื่อแก้ไขสำหรับ “No credentials found for profile anthropic”**

    หมายความว่าการรันนี้ถูกตรึงไว้กับ Anthropic auth profile แต่ Gateway
    หาไม่พบใน auth store ของมัน

    - **ใช้ Claude CLI**
      - รัน `openclaw models auth login --provider anthropic --method cli --set-default` บนโฮสต์ gateway
    - **หากคุณต้องการใช้ API key แทน**
      - ใส่ `ANTHROPIC_API_KEY` ลงใน `~/.openclaw/.env` บน **โฮสต์ gateway**
      - ล้างลำดับที่ถูกตรึงไว้ซึ่งบังคับใช้ profile ที่หายไป:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **ยืนยันว่าคุณกำลังรันคำสั่งบนโฮสต์ gateway**
      - ใน remote mode, auth profiles อยู่บนเครื่อง gateway ไม่ใช่บนแล็ปท็อปของคุณ

  </Accordion>

  <Accordion title="ทำไมมันถึงลอง Google Gemini แล้วล้มเหลวด้วย?">
    หากคอนฟิก model ของคุณมี Google Gemini เป็น fallback (หรือคุณสลับไปใช้ shorthand ของ Gemini) OpenClaw จะลองมันระหว่าง model fallback หากคุณยังไม่ได้กำหนดค่า credentials ของ Google คุณจะเห็น `No API key found for provider "google"`

    วิธีแก้: ให้กำหนดค่า Google auth หรือเอา/หลีกเลี่ยง Google models ใน `agents.defaults.model.fallbacks` / aliases เพื่อไม่ให้ fallback วิ่งไปที่นั่น

    **LLM request rejected: thinking signature required (Google Antigravity)**

    สาเหตุ: ประวัติเซสชันมี **thinking blocks ที่ไม่มี signatures** (มักเกิดจาก
    stream ที่ถูกยกเลิก/ไม่สมบูรณ์) Google Antigravity ต้องใช้ signatures สำหรับ thinking blocks

    วิธีแก้: ตอนนี้ OpenClaw จะตัด unsigned thinking blocks ออกสำหรับ Google Antigravity Claude หากยังเกิดอยู่ ให้เริ่ม **เซสชันใหม่** หรือใช้ `/thinking off` สำหรับเอเจนต์นั้น

  </Accordion>
</AccordionGroup>

## Auth profiles: คืออะไร และจัดการอย่างไร

ที่เกี่ยวข้อง: [/concepts/oauth](/th/concepts/oauth) (โฟลว์ OAuth, การจัดเก็บ token, รูปแบบหลายบัญชี)

<AccordionGroup>
  <Accordion title="auth profile คืออะไร?">
    auth profile คือระเบียน credential แบบมีชื่อ (OAuth หรือ API key) ที่ผูกกับ provider โดย profiles จะอยู่ที่:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="profile IDs ที่พบบ่อยมีอะไรบ้าง?">
    OpenClaw ใช้ IDs ที่มี provider เป็น prefix เช่น:

    - `anthropic:default` (พบบ่อยเมื่อไม่มี email identity)
    - `anthropic:<email>` สำหรับ OAuth identities
    - IDs แบบกำหนดเองที่คุณเลือก (เช่น `anthropic:work`)

  </Accordion>

  <Accordion title="ฉันควบคุมได้ไหมว่า auth profile ไหนจะถูกลองก่อน?">
    ได้ คอนฟิกรองรับ metadata แบบเลือกได้สำหรับ profiles และลำดับต่อ provider (`auth.order.<provider>`) สิ่งนี้ **ไม่ได้** เก็บ secrets; มันเพียงแมป IDs ไปยัง provider/mode และกำหนดลำดับการหมุนเวียน

    OpenClaw อาจข้าม profile ชั่วคราวหากอยู่ในสถานะ **cooldown** ระยะสั้น (rate limits/timeouts/auth failures) หรือสถานะ **disabled** ที่นานกว่า (billing/credits ไม่เพียงพอ) หากต้องการตรวจสอบ ให้รัน `openclaw models status --json` แล้วดู `auth.unusableProfiles` การปรับแต่ง: `auth.cooldowns.billingBackoffHours*`

    คูลดาวน์ของ rate-limit อาจอยู่ในขอบเขตของ model ได้ profile ที่กำลังคูลดาวน์
    สำหรับ model หนึ่งอาจยังใช้งานได้สำหรับ model พี่น้องบน provider เดียวกัน
    ขณะที่หน้าต่าง billing/disabled จะยังคงบล็อกทั้ง profile

    คุณยังสามารถตั้ง **override ลำดับต่อเอเจนต์** (เก็บไว้ใน `auth-state.json` ของเอเจนต์นั้น) ผ่าน CLI ได้:

    ```bash
    # ใช้เอเจนต์ค่าเริ่มต้นที่กำหนดไว้โดยปริยาย (ละ --agent ได้)
    openclaw models auth order get --provider anthropic

    # ล็อกการหมุนเวียนให้ใช้เพียง profile เดียว (ลองแค่นี้ตัวเดียว)
    openclaw models auth order set --provider anthropic anthropic:default

    # หรือตั้งลำดับแบบ explicit (fallback ภายใน provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # ล้าง override (fallback ไปใช้ config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    หากต้องการเจาะจงเอเจนต์:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    หากต้องการตรวจสอบว่าจะลองอะไรจริง ให้ใช้:

    ```bash
    openclaw models status --probe
    ```

    หาก stored profile ถูกละออกจาก explicit order, probe จะรายงาน
    `excluded_by_auth_order` สำหรับ profile นั้นแทนการลองแบบเงียบๆ

  </Accordion>

  <Accordion title="OAuth กับ API key - ต่างกันอย่างไร?">
    OpenClaw รองรับทั้งสองแบบ:

    - **OAuth** มักใช้ประโยชน์จากสิทธิ์การเข้าถึงแบบ subscription (เมื่อรองรับ)
    - **API keys** ใช้การคิดค่าบริการแบบจ่ายตาม token

    ตัวช่วยตั้งค่ารองรับ Anthropic Claude CLI, OpenAI Codex OAuth และ API keys อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [FAQ](/th/help/faq) — FAQ หลัก
- [FAQ — quick start และการตั้งค่าครั้งแรก](/th/help/faq-first-run)
- [Model selection](/th/concepts/model-providers)
- [Model failover](/th/concepts/model-failover)
