---
read_when:
    - การเลือกหรือสลับโมเดล การกำหนดค่านามแฝง
    - การดีบักการสลับไปใช้โมเดลสำรอง / "โมเดลทั้งหมดล้มเหลว"
    - ทำความเข้าใจโปรไฟล์การตรวจสอบสิทธิ์และวิธีจัดการ
sidebarTitle: Models FAQ
summary: 'คำถามที่พบบ่อย: ค่าเริ่มต้นของโมเดล การเลือก นามแฝง การสลับ การสลับไปยังระบบสำรองเมื่อเกิดข้อผิดพลาด และโปรไฟล์การยืนยันตัวตน'
title: 'คำถามที่พบบ่อย: โมเดลและการยืนยันตัวตน'
x-i18n:
    generated_at: "2026-05-11T20:32:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1bd3bcfdca583472d42782448271879a2bcaaa21858ab3304da48556ae922c
    source_path: help/faq-models.md
    workflow: 16
---

  Q&A เกี่ยวกับโมเดลและโปรไฟล์การยืนยันตัวตน สำหรับการตั้งค่า เซสชัน Gateway ช่องทาง และ
  การแก้ปัญหา โปรดดู [FAQ](/th/help/faq) หลัก

  ## โมเดล: ค่าเริ่มต้น การเลือก alias และการสลับ

  <AccordionGroup>
  <Accordion title='What is the "default model"?'>
    โมเดลเริ่มต้นของ OpenClaw คือค่าที่คุณตั้งไว้เป็น:

    ```
    agents.defaults.model.primary
    ```

    โมเดลอ้างอิงในรูปแบบ `provider/model` (ตัวอย่าง: `openai/gpt-5.5` หรือ `anthropic/claude-sonnet-4-6`) หากคุณละ provider ไว้ OpenClaw จะลอง alias ก่อน จากนั้นจึงลองจับคู่ configured-provider ที่ไม่ซ้ำสำหรับ model id นั้นแบบตรงตัว และสุดท้ายจึง fallback ไปยัง provider เริ่มต้นที่กำหนดไว้ในฐานะเส้นทางความเข้ากันได้ที่เลิกแนะนำแล้ว หาก provider นั้นไม่เปิดเผยโมเดลเริ่มต้นที่กำหนดไว้อีกต่อไป OpenClaw จะ fallback ไปยัง provider/model แรกที่กำหนดไว้แทนการแสดงค่าเริ่มต้นของ provider เก่าที่ถูกลบไปแล้ว คุณยังควรตั้งค่า `provider/model` แบบ **ชัดเจน**

  </Accordion>

  <Accordion title="What model do you recommend?">
    **ค่าเริ่มต้นที่แนะนำ:** ใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดที่มีใน provider stack ของคุณ
    **สำหรับ agent ที่ใช้เครื่องมือหรือรับอินพุตที่ไม่น่าเชื่อถือ:** ให้ความสำคัญกับความสามารถของโมเดลมากกว่าต้นทุน
    **สำหรับการแชททั่วไป/ความเสี่ยงต่ำ:** ใช้โมเดล fallback ที่ถูกกว่าและ route ตามบทบาทของ agent

    MiniMax มีเอกสารของตัวเอง: [MiniMax](/th/providers/minimax) และ
    [โมเดลภายในเครื่อง](/th/gateway/local-models)

    หลักทั่วไป: ใช้ **โมเดลที่ดีที่สุดที่คุณจ่ายไหว** สำหรับงานที่มีความเสี่ยงสูง และใช้โมเดลที่ถูกกว่า
    สำหรับการแชททั่วไปหรือการสรุป คุณสามารถ route โมเดลแยกตาม agent และใช้ sub-agent เพื่อ
    ทำงานยาวแบบขนานได้ (sub-agent แต่ละตัวใช้ token) ดู [โมเดล](/th/concepts/models) และ
    [Sub-agents](/th/tools/subagents)

    คำเตือนสำคัญ: โมเดลที่อ่อนกว่าหรือถูก quantize มากเกินไปมีความเสี่ยงต่อ prompt
    injection และพฤติกรรมที่ไม่ปลอดภัยมากกว่า ดู [ความปลอดภัย](/th/gateway/security)

    บริบทเพิ่มเติม: [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="How do I switch models without wiping my config?">
    ใช้ **คำสั่งโมเดล** หรือแก้ไขเฉพาะฟิลด์ **model** หลีกเลี่ยงการแทนที่ config ทั้งหมด

    ตัวเลือกที่ปลอดภัย:

    - `/model` ในแชท (รวดเร็ว ต่อเซสชัน)
    - `openclaw models set ...` (อัปเดตเฉพาะ config โมเดล)
    - `openclaw configure --section model` (แบบโต้ตอบ)
    - แก้ไข `agents.defaults.model` ใน `~/.openclaw/openclaw.json`

    หลีกเลี่ยง `config.apply` พร้อมออบเจ็กต์บางส่วน เว้นแต่คุณตั้งใจจะแทนที่ config ทั้งหมด
    สำหรับการแก้ไขผ่าน RPC ให้ตรวจด้วย `config.schema.lookup` ก่อน และควรใช้ `config.patch` payload ของ lookup จะให้ path ที่ normalize แล้ว เอกสาร/ข้อจำกัดของ schema แบบตื้น และสรุป child ทันที
    สำหรับการอัปเดตบางส่วน
    หากคุณเขียนทับ config ไปแล้ว ให้กู้คืนจาก backup หรือรัน `openclaw doctor` อีกครั้งเพื่อซ่อมแซม

    เอกสาร: [โมเดล](/th/concepts/models), [กำหนดค่า](/th/cli/configure), [Config](/th/cli/config), [Doctor](/th/gateway/doctor)

  </Accordion>

  <Accordion title="Can I use self-hosted models (llama.cpp, vLLM, Ollama)?">
    ได้ Ollama เป็นเส้นทางที่ง่ายที่สุดสำหรับโมเดลภายในเครื่อง

    การตั้งค่าที่เร็วที่สุด:

    1. ติดตั้ง Ollama จาก `https://ollama.com/download`
    2. ดึงโมเดลภายในเครื่อง เช่น `ollama pull gemma4`
    3. หากคุณต้องการโมเดล cloud ด้วย ให้รัน `ollama signin`
    4. รัน `openclaw onboard` แล้วเลือก `Ollama`
    5. เลือก `Local` หรือ `Cloud + Local`

    หมายเหตุ:

    - `Cloud + Local` ให้คุณใช้ทั้งโมเดล cloud และโมเดล Ollama ภายในเครื่องของคุณ
    - โมเดล cloud เช่น `kimi-k2.5:cloud` ไม่ต้องดึงลงเครื่อง
    - สำหรับการสลับแบบ manual ให้ใช้ `openclaw models list` และ `openclaw models set ollama/<model>`

    หมายเหตุด้านความปลอดภัย: โมเดลที่เล็กกว่าหรือถูก quantize อย่างหนักมีความเสี่ยงต่อ prompt
    injection มากกว่า เราแนะนำอย่างยิ่งให้ใช้ **โมเดลขนาดใหญ่** สำหรับบอตใดก็ตามที่ใช้เครื่องมือได้
    หากคุณยังต้องการใช้โมเดลขนาดเล็ก ให้เปิด sandboxing และ tool allowlist ที่เข้มงวด

    เอกสาร: [Ollama](/th/providers/ollama), [โมเดลภายในเครื่อง](/th/gateway/local-models),
    [ผู้ให้บริการโมเดล](/th/concepts/model-providers), [ความปลอดภัย](/th/gateway/security),
    [Sandboxing](/th/gateway/sandboxing)

  </Accordion>

  <Accordion title="What do OpenClaw, Flawd, and Krill use for models?">
    - การ deploy เหล่านี้อาจแตกต่างกันและอาจเปลี่ยนแปลงได้ตามเวลา จึงไม่มีคำแนะนำ provider แบบตายตัว
    - ตรวจการตั้งค่า runtime ปัจจุบันบนแต่ละ Gateway ด้วย `openclaw models status`
    - สำหรับ agent ที่เกี่ยวข้องกับความปลอดภัยหรือใช้เครื่องมือได้ ให้ใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดที่มี

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

    รายการเหล่านี้คือ alias ในตัว คุณสามารถเพิ่ม alias แบบกำหนดเองได้ผ่าน `agents.defaults.models`

    คุณสามารถแสดงรายการโมเดลที่มีได้ด้วย `/model`, `/model list` หรือ `/model status`

    `/model` (และ `/model list`) จะแสดงตัวเลือกแบบกระชับที่มีหมายเลข เลือกด้วยหมายเลข:

    ```
    /model 3
    ```

    คุณยังสามารถบังคับใช้โปรไฟล์การยืนยันตัวตนเฉพาะสำหรับ provider ได้ (ต่อเซสชัน):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    เคล็ดลับ: `/model status` แสดงว่า agent ใดกำลัง active, ไฟล์ `auth-profiles.json` ใดถูกใช้ และ auth profile ใดจะถูกลองถัดไป
    นอกจากนี้ยังแสดง endpoint ของ provider ที่กำหนดไว้ (`baseUrl`) และโหมด API (`api`) เมื่อมี

    **ฉันจะยกเลิกการ pin โปรไฟล์ที่ตั้งด้วย @profile ได้อย่างไร?**

    รัน `/model` อีกครั้ง **โดยไม่มี** suffix `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    หากคุณต้องการกลับไปใช้ค่าเริ่มต้น ให้เลือกจาก `/model` (หรือส่ง `/model <default provider/model>`)
    ใช้ `/model status` เพื่อยืนยันว่า auth profile ใดกำลัง active

  </Accordion>

  <Accordion title="If two providers expose the same model id, which one does /model use?">
    `/model provider/model` จะเลือก route ของ provider นั้นแบบตรงตัวสำหรับเซสชัน

    ตัวอย่างเช่น `qianfan/deepseek-v4-flash` และ `deepseek/deepseek-v4-flash` เป็น model ref คนละตัว แม้ว่าทั้งคู่จะมี `deepseek-v4-flash` ก็ตาม OpenClaw ไม่ควรสลับจาก provider หนึ่งไปอีก provider หนึ่งแบบเงียบ ๆ เพียงเพราะ bare model id ตรงกัน

    ref ของ `/model` ที่ผู้ใช้เลือกยังเข้มงวดสำหรับนโยบาย fallback ด้วย หาก provider/model ที่เลือกนั้นไม่พร้อมใช้งาน การตอบกลับจะล้มเหลวให้เห็นชัด แทนที่จะตอบจาก `agents.defaults.model.fallbacks` chain ของ fallback ที่กำหนดไว้ยังคงใช้กับค่าเริ่มต้นที่กำหนดไว้ primary ของ cron job และสถานะ fallback ที่เลือกอัตโนมัติ

    หาก run ที่เริ่มจาก override ที่ไม่ใช่เซสชันได้รับอนุญาตให้ใช้ fallback OpenClaw จะลอง provider/model ที่ร้องขอก่อน จากนั้นจึงลอง fallback ที่กำหนดไว้ และสุดท้ายจึงลอง primary ที่กำหนดไว้ วิธีนี้ป้องกันไม่ให้ bare model id ที่ซ้ำกันกระโดดกลับไปยัง provider เริ่มต้นโดยตรง

    ดู [โมเดล](/th/concepts/models) และ [Model failover](/th/concepts/model-failover)

  </Accordion>

  <Accordion title="Can I use GPT 5.5 for daily tasks and Codex 5.5 for coding?">
    ได้ ให้แยกการเลือกโมเดลออกจากการเลือก runtime:

    - **Native Codex coding agent:** ตั้ง `agents.defaults.model.primary` เป็น `openai/gpt-5.5` เข้าสู่ระบบด้วย `openclaw models auth login --provider openai-codex` เมื่อคุณต้องการการยืนยันตัวตนด้วย subscription ของ ChatGPT/Codex
    - **งาน OpenAI API โดยตรงนอก agent loop:** กำหนดค่า `OPENAI_API_KEY` สำหรับรูปภาพ embeddings, speech, realtime และพื้นผิว OpenAI API อื่นที่ไม่ใช่ agent
    - **การยืนยันตัวตนด้วย API key สำหรับ OpenAI agent:** ใช้ `/model openai/gpt-5.5` พร้อมโปรไฟล์ API-key ของ `openai-codex` แบบเรียงลำดับ
    - **Sub-agents:** route งานเขียนโค้ดไปยัง agent ที่เน้น Codex พร้อมโมเดล `openai/gpt-5.5` ของตัวเอง

    ดู [โมเดล](/th/concepts/models) และ [คำสั่ง Slash](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="How do I configure fast mode for GPT 5.5?">
    ใช้ toggle ต่อเซสชันหรือค่าเริ่มต้นใน config:

    - **ต่อเซสชัน:** ส่ง `/fast on` ขณะที่เซสชันใช้ `openai/gpt-5.5`
    - **ค่าเริ่มต้นต่อโมเดล:** ตั้ง `agents.defaults.models["openai/gpt-5.5"].params.fastMode` เป็น `true`

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

    สำหรับ OpenAI fast mode จะแมปเป็น `service_tier = "priority"` บน request ของ native Responses ที่รองรับ ค่า override ของเซสชัน `/fast` จะชนะค่าเริ่มต้นใน config

    ดู [Thinking และ fast mode](/th/tools/thinking) และ [OpenAI fast mode](/th/providers/openai#fast-mode)

  </Accordion>

  <Accordion title='Why do I see "Model ... is not allowed" and then no reply?'>
    หากตั้งค่า `agents.defaults.models` ไว้ ค่านั้นจะกลายเป็น **allowlist** สำหรับ `/model` และ override ใด ๆ
    ของเซสชัน การเลือกโมเดลที่ไม่อยู่ในรายการนั้นจะคืนค่า:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    ข้อผิดพลาดนั้นจะถูกส่งคืน **แทน** การตอบกลับปกติ วิธีแก้: เพิ่มโมเดลแบบตรงตัวไปยัง
    `agents.defaults.models`, เพิ่ม provider wildcard เช่น `"provider/*": {}` สำหรับ catalog ของ provider แบบ dynamic, เอา allowlist ออก หรือเลือกโมเดลจาก `/model list`
    หากคำสั่งมี `--runtime codex` ด้วย ให้อัปเดต allowlist ก่อน แล้วลองคำสั่ง
    `/model provider/model --runtime codex` เดิมอีกครั้ง

  </Accordion>

  <Accordion title='Why do I see "Unknown model: minimax/MiniMax-M2.7"?'>
    หมายความว่า **provider ยังไม่ได้กำหนดค่า** (ไม่พบ config หรือ auth
    profile ของ MiniMax) จึง resolve โมเดลไม่ได้

    checklist สำหรับการแก้ไข:

    1. อัปเกรดเป็น OpenClaw release ปัจจุบัน (หรือรันจาก source `main`) จากนั้น restart Gateway
    2. ตรวจให้แน่ใจว่า MiniMax ถูกกำหนดค่าแล้ว (wizard หรือ JSON) หรือมีการยืนยันตัวตนของ MiniMax
       อยู่ใน env/auth profiles เพื่อให้ provider ที่ตรงกันถูก inject ได้
       (`MINIMAX_API_KEY` สำหรับ `minimax`, `MINIMAX_OAUTH_TOKEN` หรือ MiniMax OAuth
       ที่เก็บไว้สำหรับ `minimax-portal`)
    3. ใช้ model id แบบตรงตัว (คำนึงถึงตัวพิมพ์เล็ก/ใหญ่) สำหรับเส้นทาง auth ของคุณ:
       `minimax/MiniMax-M2.7` หรือ `minimax/MiniMax-M2.7-highspeed` สำหรับการตั้งค่า
       API-key หรือ `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` สำหรับการตั้งค่า OAuth
    4. รัน:

       ```bash
       openclaw models list
       ```

       แล้วเลือกจากรายการ (หรือ `/model list` ในแชท)

    ดู [MiniMax](/th/providers/minimax) และ [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="Can I use MiniMax as my default and OpenAI for complex tasks?">
    ได้ ใช้ **MiniMax เป็นค่าเริ่มต้น** และสลับโมเดล **ต่อเซสชัน** เมื่อจำเป็น
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

    **ตัวเลือก B: agent แยกกัน**

    - ค่าเริ่มต้นของ Agent A: MiniMax
    - ค่าเริ่มต้นของ Agent B: OpenAI
    - Route ตาม agent หรือใช้ `/agent` เพื่อสลับ

    เอกสาร: [โมเดล](/th/concepts/models), [Multi-Agent Routing](/th/concepts/multi-agent), [MiniMax](/th/providers/minimax), [OpenAI](/th/providers/openai)

  </Accordion>

  <Accordion title="Are opus / sonnet / gpt built-in shortcuts?">
    ใช่ OpenClaw มี shorthand เริ่มต้นอยู่บางรายการ (ใช้เฉพาะเมื่อโมเดลมีอยู่ใน `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    หากคุณตั้งค่า alias ของคุณเองด้วยชื่อเดียวกัน ค่าของคุณจะถูกใช้ก่อน

  </Accordion>

  <Accordion title="ฉันจะกำหนด/เขียนทับทางลัดโมเดล (aliases) ได้อย่างไร">
    Aliases มาจาก `agents.defaults.models.<modelId>.alias` ตัวอย่าง:

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

    จากนั้น `/model sonnet` (หรือ `/<alias>` เมื่อรองรับ) จะ resolve ไปยัง ID โมเดลนั้น

  </Accordion>

  <Accordion title="ฉันจะเพิ่มโมเดลจากผู้ให้บริการอื่น เช่น OpenRouter หรือ Z.AI ได้อย่างไร">
    OpenRouter (จ่ายตามจำนวนโทเค็น; มีหลายโมเดล):

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

    Z.AI (โมเดล GLM):

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

    หากคุณอ้างอิงผู้ให้บริการ/โมเดล แต่ไม่มีคีย์ผู้ให้บริการที่จำเป็น คุณจะได้รับข้อผิดพลาด auth ขณะรัน (เช่น `No API key found for provider "zai"`)

    **ไม่พบ API key สำหรับผู้ให้บริการหลังจากเพิ่มเอเจนต์ใหม่**

    โดยปกติหมายความว่า **เอเจนต์ใหม่** มี auth store ว่าง Auth เป็นแบบต่อเอเจนต์และ
    จัดเก็บไว้ใน:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    ตัวเลือกการแก้ไข:

    - รัน `openclaw agents add <id>` และกำหนดค่า auth ระหว่าง wizard
    - หรือคัดลอกเฉพาะโปรไฟล์ `api_key` / `token` แบบ static ที่ย้ายได้จาก auth store ของเอเจนต์หลักไปยัง auth store ของเอเจนต์ใหม่
    - สำหรับโปรไฟล์ OAuth ให้ลงชื่อเข้าใช้จากเอเจนต์ใหม่เมื่อจำเป็นต้องใช้บัญชีของตัวเอง มิฉะนั้น OpenClaw สามารถอ่านผ่านไปยังเอเจนต์ค่าเริ่มต้น/หลักได้โดยไม่ต้อง clone refresh token

    อย่าใช้ `agentDir` ซ้ำระหว่างเอเจนต์ เพราะจะทำให้ auth/session ชนกัน

  </Accordion>
</AccordionGroup>

## การ failover ของโมเดลและ "All models failed"

<AccordionGroup>
  <Accordion title="failover ทำงานอย่างไร">
    Failover เกิดขึ้นในสองขั้นตอน:

    1. **การหมุนเวียน auth profile** ภายในผู้ให้บริการเดียวกัน
    2. **การ fallback ของโมเดล** ไปยังโมเดลถัดไปใน `agents.defaults.model.fallbacks`

    Cooldown จะใช้กับโปรไฟล์ที่ล้มเหลว (exponential backoff) ดังนั้น OpenClaw จึงยังตอบสนองต่อไปได้แม้ผู้ให้บริการถูกจำกัดอัตราหรือล้มเหลวชั่วคราว

    บัคเก็ต rate-limit ครอบคลุมมากกว่าการตอบสนอง `429` แบบตรง ๆ OpenClaw
    ยังถือว่าข้อความอย่าง `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` และข้อจำกัด
    usage-window แบบเป็นรอบ (`weekly/monthly limit reached`) เป็น rate limit
    ที่ควรทำ failover

    การตอบสนองบางแบบที่ดูเกี่ยวกับ billing ไม่ใช่ `402` และการตอบสนอง HTTP `402`
    บางรายการก็ยังอยู่ในบัคเก็ตชั่วคราวนั้น หากผู้ให้บริการส่งคืน
    ข้อความ billing อย่างชัดเจนบน `401` หรือ `403` OpenClaw ยังสามารถเก็บไว้
    ในเลน billing ได้ แต่ตัวจับคู่ข้อความเฉพาะผู้ให้บริการจะยังจำกัดอยู่ในขอบเขตของ
    ผู้ให้บริการที่เป็นเจ้าของตัวจับคู่นั้น (เช่น OpenRouter `Key limit exceeded`) หากข้อความ `402`
    กลับดูเหมือน usage-window ที่ retry ได้ หรือ
    ขีดจำกัดค่าใช้จ่ายขององค์กร/เวิร์กสเปซ (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) OpenClaw จะถือว่าเป็น
    `rate_limit` ไม่ใช่การปิดใช้งาน billing ระยะยาว

    ข้อผิดพลาด context-overflow แตกต่างออกไป: signature เช่น
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` หรือ `ollama error: context length
    exceeded` จะอยู่บนเส้นทาง compaction/retry แทนที่จะเลื่อนไปยัง model
    fallback

    ข้อความ server-error ทั่วไปถูกตั้งใจให้แคบกว่า "ทุกอย่างที่มี
    unknown/error อยู่ในนั้น" OpenClaw จะถือว่า transient shape ที่อยู่ในขอบเขตผู้ให้บริการ
    เช่น Anthropic แบบเปล่า `An unknown error occurred`, OpenRouter แบบเปล่า
    `Provider returned error`, ข้อผิดพลาด stop-reason เช่น `Unhandled stop reason:
    error`, payload JSON `api_error` ที่มีข้อความเซิร์ฟเวอร์ชั่วคราว
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) และข้อผิดพลาด provider-busy เช่น `ModelNotReadyException` เป็น
    สัญญาณ timeout/overloaded ที่ควรทำ failover เมื่อบริบทผู้ให้บริการ
    ตรงกัน
    ข้อความ fallback ภายในทั่วไป เช่น `LLM request failed with an unknown
    error.` จะยังคงอนุรักษ์นิยมและไม่ trigger model fallback ด้วยตัวเอง

  </Accordion>

  <Accordion title='คำว่า "No credentials found for profile anthropic:default" หมายความว่าอะไร'>
    หมายความว่าระบบพยายามใช้ ID auth profile `anthropic:default` แต่ไม่พบข้อมูลประจำตัวสำหรับโปรไฟล์นั้นใน auth store ที่คาดไว้

    **เช็กลิสต์การแก้ไข:**

    - **ยืนยันว่า auth profile อยู่ที่ไหน** (พาธใหม่เทียบกับพาธ legacy)
      - ปัจจุบัน: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legacy: `~/.openclaw/agent/*` (ย้ายโดย `openclaw doctor`)
    - **ยืนยันว่า env var ของคุณถูกโหลดโดย Gateway**
      - หากคุณตั้งค่า `ANTHROPIC_API_KEY` ใน shell แต่รัน Gateway ผ่าน systemd/launchd มันอาจไม่สืบทอดค่านั้น ใส่ไว้ใน `~/.openclaw/.env` หรือเปิดใช้ `env.shellEnv`
    - **ตรวจสอบให้แน่ใจว่าคุณกำลังแก้ไขเอเจนต์ที่ถูกต้อง**
      - การตั้งค่าแบบหลายเอเจนต์หมายความว่าอาจมีไฟล์ `auth-profiles.json` หลายไฟล์
    - **ตรวจสอบสถานะโมเดล/auth แบบคร่าว ๆ**
      - ใช้ `openclaw models status` เพื่อดูโมเดลที่กำหนดค่าไว้และดูว่าผู้ให้บริการ authenticated แล้วหรือไม่

    **เช็กลิสต์การแก้ไขสำหรับ "No credentials found for profile anthropic"**

    หมายความว่าการรันถูก pin ไว้กับ auth profile ของ Anthropic แต่ Gateway
    หาโปรไฟล์นั้นใน auth store ไม่พบ

    - **ใช้ Claude CLI**
      - รัน `openclaw models auth login --provider anthropic --method cli --set-default` บนโฮสต์ gateway
    - **หากคุณต้องการใช้ API key แทน**
      - ใส่ `ANTHROPIC_API_KEY` ใน `~/.openclaw/.env` บน **โฮสต์ gateway**
      - ล้างลำดับที่ pin ไว้ซึ่งบังคับใช้โปรไฟล์ที่ขาดหาย:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **ยืนยันว่าคุณกำลังรันคำสั่งบนโฮสต์ gateway**
      - ในโหมดระยะไกล auth profile จะอยู่บนเครื่อง gateway ไม่ใช่แล็ปท็อปของคุณ

  </Accordion>

  <Accordion title="ทำไมมันถึงลอง Google Gemini แล้วล้มเหลวด้วย">
    หาก config โมเดลของคุณมี Google Gemini เป็น fallback (หรือคุณเปลี่ยนไปใช้ shorthand ของ Gemini) OpenClaw จะลองใช้ระหว่าง model fallback หากคุณไม่ได้กำหนดค่า credentials ของ Google คุณจะเห็น `No API key found for provider "google"`

    การแก้ไข: ให้ auth ของ Google หรือเอา/หลีกเลี่ยงโมเดล Google ใน `agents.defaults.model.fallbacks` / aliases เพื่อไม่ให้ fallback route ไปที่นั่น

    **คำขอ LLM ถูกปฏิเสธ: ต้องใช้ thinking signature (Google Antigravity)**

    สาเหตุ: ประวัติ session มี **thinking blocks ที่ไม่มี signatures** (มักมาจาก
    stream ที่ถูกยกเลิก/บางส่วน) Google Antigravity ต้องใช้ signatures สำหรับ thinking blocks

    การแก้ไข: ตอนนี้ OpenClaw จะตัด thinking blocks ที่ไม่มี signature ออกสำหรับ Google Antigravity Claude หากยังปรากฏอยู่ ให้เริ่ม **session ใหม่** หรือตั้งค่า `/thinking off` สำหรับเอเจนต์นั้น

  </Accordion>
</AccordionGroup>

## Auth profiles: คืออะไรและจัดการอย่างไร

เกี่ยวข้อง: [/concepts/oauth](/th/concepts/oauth) (โฟลว์ OAuth, การจัดเก็บ token, รูปแบบหลายบัญชี)

<AccordionGroup>
  <Accordion title="auth profile คืออะไร">
    auth profile คือระเบียนข้อมูลประจำตัวที่มีชื่อ (OAuth หรือ API key) ซึ่งผูกกับผู้ให้บริการ โปรไฟล์อยู่ใน:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    หากต้องการตรวจสอบโปรไฟล์ที่บันทึกไว้โดยไม่ dump secrets ให้รัน `openclaw models auth list` (เลือกใช้ `--provider <id>` หรือ `--json` ได้) ดูรายละเอียดที่ [Models CLI](/th/cli/models#auth-profiles)

  </Accordion>

  <Accordion title="ID โปรไฟล์ทั่วไปมีอะไรบ้าง">
    OpenClaw ใช้ ID ที่มี prefix ผู้ให้บริการ เช่น:

    - `anthropic:default` (พบได้บ่อยเมื่อไม่มี email identity)
    - `anthropic:<email>` สำหรับ OAuth identities
    - ID แบบกำหนดเองที่คุณเลือก (เช่น `anthropic:work`)

  </Accordion>

  <Accordion title="ฉันควบคุมได้ไหมว่าจะลอง auth profile ใดก่อน">
    ได้ Config รองรับ metadata แบบเลือกได้สำหรับโปรไฟล์และลำดับต่อผู้ให้บริการ (`auth.order.<provider>`) สิ่งนี้ **ไม่** จัดเก็บ secrets แต่ map ID ไปยังผู้ให้บริการ/โหมด และตั้งค่าลำดับการหมุนเวียน

    OpenClaw อาจข้ามโปรไฟล์ชั่วคราวหากอยู่ใน **cooldown** สั้น ๆ (rate limits/timeouts/auth failures) หรือสถานะ **disabled** ที่นานกว่า (billing/credits ไม่เพียงพอ) หากต้องการตรวจสอบ ให้รัน `openclaw models status --json` และตรวจ `auth.unusableProfiles` การปรับแต่ง: `auth.cooldowns.billingBackoffHours*`

    Cooldown ของ rate-limit สามารถจำกัดตามโมเดลได้ โปรไฟล์ที่กำลัง cooling down
    สำหรับโมเดลหนึ่งอาจยังใช้ได้กับโมเดลพี่น้องในผู้ให้บริการเดียวกัน
    ในขณะที่ช่วงเวลา billing/disabled ยังคงบล็อกทั้งโปรไฟล์

    คุณยังตั้งค่า override ลำดับ **ต่อเอเจนต์** ได้ด้วย (จัดเก็บใน `auth-state.json` ของเอเจนต์นั้น) ผ่าน CLI:

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

    หากต้องการระบุเอเจนต์เฉพาะ:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    หากต้องการตรวจสอบว่าจะมีการลองใช้อะไรจริง ให้ใช้:

    ```bash
    openclaw models status --probe
    ```

    หากโปรไฟล์ที่จัดเก็บไว้ถูกละไว้จากลำดับที่ระบุ explicit probe จะรายงาน
    `excluded_by_auth_order` สำหรับโปรไฟล์นั้นแทนที่จะลองใช้แบบเงียบ ๆ

  </Accordion>

  <Accordion title="OAuth เทียบกับ API key - แตกต่างกันอย่างไร">
    OpenClaw รองรับทั้งสองแบบ:

    - **OAuth** มักใช้ประโยชน์จากการเข้าถึงแบบ subscription (เมื่อใช้ได้)
    - **API keys** ใช้การคิดเงินแบบจ่ายตามจำนวนโทเค็น

    wizard รองรับ Anthropic Claude CLI, OpenAI Codex OAuth และ API keys อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [FAQ](/th/help/faq) — FAQ หลัก
- [FAQ — เริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก](/th/help/faq-first-run)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [การ failover ของโมเดล](/th/concepts/model-failover)
