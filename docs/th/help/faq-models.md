---
read_when:
    - การเลือกหรือสลับโมเดล, การกำหนดค่านามแฝง
    - การดีบักการสลับไปใช้โมเดลสำรอง / "โมเดลทั้งหมดล้มเหลว"
    - ทำความเข้าใจโปรไฟล์การตรวจสอบสิทธิ์และวิธีจัดการ
sidebarTitle: Models FAQ
summary: 'คำถามที่พบบ่อย: ค่าเริ่มต้นของโมเดล การเลือก นามแฝง การสลับ การเฟลโอเวอร์ และโปรไฟล์การยืนยันตัวตน'
title: 'คำถามที่พบบ่อย: โมเดลและการยืนยันตัวตน'
x-i18n:
    generated_at: "2026-05-05T01:47:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e60abcd6aa99121200de0e45cc3efa6334e668cbe6a4b590610c53d17e03a54
    source_path: help/faq-models.md
    workflow: 16
---

  ถาม-ตอบเกี่ยวกับโมเดลและโปรไฟล์การยืนยันตัวตน สำหรับการตั้งค่า เซสชัน Gateway ช่องทาง และ
  การแก้ปัญหา ดู [FAQ](/th/help/faq) หลัก

  ## โมเดล: ค่าเริ่มต้น การเลือก นามแฝง การสลับ

  <AccordionGroup>
  <Accordion title='“โมเดลเริ่มต้น” คืออะไร?'>
    โมเดลเริ่มต้นของ OpenClaw คือค่าที่คุณตั้งไว้เป็น:

    ```
    agents.defaults.model.primary
    ```

    อ้างอิงโมเดลในรูปแบบ `provider/model` (ตัวอย่าง: `openai/gpt-5.5` หรือ `openai-codex/gpt-5.5`) หากคุณละผู้ให้บริการไว้ OpenClaw จะลองใช้นามแฝงก่อน จากนั้นจึงลองจับคู่ผู้ให้บริการที่กำหนดค่าไว้ซึ่งไม่ซ้ำกันสำหรับรหัสโมเดลนั้นแบบตรงตัว และหลังจากนั้นเท่านั้นจึงถอยกลับไปใช้ผู้ให้บริการเริ่มต้นที่กำหนดค่าไว้ในฐานะเส้นทางความเข้ากันได้ที่เลิกแนะนำแล้ว หากผู้ให้บริการนั้นไม่เปิดเผยโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะถอยกลับไปใช้ผู้ให้บริการ/โมเดลตัวแรกที่กำหนดค่าไว้แทนการแสดงค่าเริ่มต้นของผู้ให้บริการที่ถูกลบและล้าสมัย คุณยังควรตั้งค่า `provider/model` อย่าง**ชัดเจน**

  </Accordion>

  <Accordion title="คุณแนะนำโมเดลใด?">
    **ค่าเริ่มต้นที่แนะนำ:** ใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดซึ่งมีอยู่ในสแต็กผู้ให้บริการของคุณ
    **สำหรับเอเจนต์ที่เปิดใช้เครื่องมือหรือรับอินพุตที่ไม่น่าเชื่อถือ:** ให้ความสำคัญกับความสามารถของโมเดลมากกว่าต้นทุน
    **สำหรับแชตทั่วไป/ความเสี่ยงต่ำ:** ใช้โมเดลสำรองที่ถูกกว่าและกำหนดเส้นทางตามบทบาทของเอเจนต์

    MiniMax มีเอกสารของตัวเอง: [MiniMax](/th/providers/minimax) และ
    [โมเดลในเครื่อง](/th/gateway/local-models)

    หลักทั่วไป: ใช้**โมเดลที่ดีที่สุดที่คุณจ่ายไหว**สำหรับงานที่มีความเสี่ยงสูง และใช้โมเดลที่ถูกกว่า
    สำหรับแชตทั่วไปหรือการสรุป คุณสามารถกำหนดเส้นทางโมเดลต่อเอเจนต์และใช้เอเจนต์ย่อยเพื่อ
    ทำงานยาวแบบขนานได้ (เอเจนต์ย่อยแต่ละตัวใช้โทเคน) ดู [โมเดล](/th/concepts/models) และ
    [เอเจนต์ย่อย](/th/tools/subagents)

    คำเตือนสำคัญ: โมเดลที่อ่อนกว่าหรือถูกควอนไทซ์มากเกินไปมีความเสี่ยงต่อ prompt
    injection และพฤติกรรมที่ไม่ปลอดภัยมากกว่า ดู [ความปลอดภัย](/th/gateway/security)

    บริบทเพิ่มเติม: [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันจะสลับโมเดลโดยไม่ล้างค่ากำหนดได้อย่างไร?">
    ใช้**คำสั่งโมเดล**หรือแก้ไขเฉพาะฟิลด์**โมเดล** หลีกเลี่ยงการแทนที่ค่ากำหนดทั้งหมด

    ตัวเลือกที่ปลอดภัย:

    - `/model` ในแชต (เร็ว ต่อเซสชัน)
    - `openclaw models set ...` (อัปเดตเฉพาะค่ากำหนดโมเดล)
    - `openclaw configure --section model` (โต้ตอบ)
    - แก้ไข `agents.defaults.model` ใน `~/.openclaw/openclaw.json`

    หลีกเลี่ยง `config.apply` กับอ็อบเจกต์บางส่วน เว้นแต่ว่าคุณตั้งใจจะแทนที่ค่ากำหนดทั้งหมด
    สำหรับการแก้ไขผ่าน RPC ให้ตรวจสอบด้วย `config.schema.lookup` ก่อนและควรใช้ `config.patch` เพย์โหลด lookup ให้พาธที่ทำให้เป็นมาตรฐานแล้ว เอกสาร/ข้อจำกัดของสคีมาแบบตื้น และสรุปลูกโดยตรง
    สำหรับการอัปเดตบางส่วน
    หากคุณเขียนทับค่ากำหนดไปแล้ว ให้กู้คืนจากข้อมูลสำรองหรือรัน `openclaw doctor` อีกครั้งเพื่อซ่อมแซม

    เอกสาร: [โมเดล](/th/concepts/models), [กำหนดค่า](/th/cli/configure), [ค่ากำหนด](/th/cli/config), [Doctor](/th/gateway/doctor)

  </Accordion>

  <Accordion title="ฉันใช้โมเดลที่โฮสต์เองได้ไหม (llama.cpp, vLLM, Ollama)?">
    ได้ Ollama เป็นเส้นทางที่ง่ายที่สุดสำหรับโมเดลในเครื่อง

    การตั้งค่าที่เร็วที่สุด:

    1. ติดตั้ง Ollama จาก `https://ollama.com/download`
    2. ดึงโมเดลในเครื่อง เช่น `ollama pull gemma4`
    3. หากคุณต้องการโมเดลบนคลาวด์ด้วย ให้รัน `ollama signin`
    4. รัน `openclaw onboard` แล้วเลือก `Ollama`
    5. เลือก `Local` หรือ `Cloud + Local`

    หมายเหตุ:

    - `Cloud + Local` ให้คุณใช้โมเดลบนคลาวด์พร้อมกับโมเดล Ollama ในเครื่องของคุณ
    - โมเดลบนคลาวด์ เช่น `kimi-k2.5:cloud` ไม่จำเป็นต้องดึงไว้ในเครื่อง
    - สำหรับการสลับด้วยตนเอง ให้ใช้ `openclaw models list` และ `openclaw models set ollama/<model>`

    หมายเหตุด้านความปลอดภัย: โมเดลที่เล็กกว่าหรือถูกควอนไทซ์อย่างหนักมีความเสี่ยงต่อ prompt
    injection มากกว่า เราแนะนำอย่างยิ่งให้ใช้**โมเดลขนาดใหญ่**สำหรับบอตใดก็ตามที่สามารถใช้เครื่องมือได้
    หากคุณยังต้องการใช้โมเดลขนาดเล็ก ให้เปิดใช้ sandboxing และรายการอนุญาตเครื่องมือที่เข้มงวด

    เอกสาร: [Ollama](/th/providers/ollama), [โมเดลในเครื่อง](/th/gateway/local-models),
    [ผู้ให้บริการโมเดล](/th/concepts/model-providers), [ความปลอดภัย](/th/gateway/security),
    [Sandboxing](/th/gateway/sandboxing)

  </Accordion>

  <Accordion title="OpenClaw, Flawd และ Krill ใช้โมเดลอะไร?">
    - การปรับใช้งานเหล่านี้อาจต่างกันและอาจเปลี่ยนไปตามเวลา ไม่มีคำแนะนำผู้ให้บริการแบบตายตัว
    - ตรวจสอบค่ารันไทม์ปัจจุบันบน Gateway แต่ละตัวด้วย `openclaw models status`
    - สำหรับเอเจนต์ที่ไวต่อความปลอดภัย/เปิดใช้เครื่องมือ ให้ใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดซึ่งมีอยู่

  </Accordion>

  <Accordion title="ฉันจะสลับโมเดลทันทีได้อย่างไร (โดยไม่รีสตาร์ต)?">
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

    เหล่านี้คือนามแฝงในตัว สามารถเพิ่มนามแฝงกำหนดเองผ่าน `agents.defaults.models`

    คุณสามารถแสดงรายการโมเดลที่ใช้ได้ด้วย `/model`, `/model list` หรือ `/model status`

    `/model` (และ `/model list`) แสดงตัวเลือกแบบกะทัดรัดพร้อมหมายเลข เลือกด้วยหมายเลข:

    ```
    /model 3
    ```

    คุณยังสามารถบังคับใช้โปรไฟล์การยืนยันตัวตนเฉพาะสำหรับผู้ให้บริการได้ (ต่อเซสชัน):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    เคล็ดลับ: `/model status` แสดงว่าเอเจนต์ใดใช้งานอยู่ กำลังใช้ไฟล์ `auth-profiles.json` ใด และจะลองใช้โปรไฟล์การยืนยันตัวตนใดถัดไป
    นอกจากนี้ยังแสดงปลายทางผู้ให้บริการที่กำหนดค่าไว้ (`baseUrl`) และโหมด API (`api`) เมื่อมี

    **ฉันจะเลิกปักหมุดโปรไฟล์ที่ตั้งด้วย @profile ได้อย่างไร?**

    รัน `/model` อีกครั้ง**โดยไม่มี**ส่วนต่อท้าย `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    หากคุณต้องการกลับไปใช้ค่าเริ่มต้น ให้เลือกจาก `/model` (หรือส่ง `/model <default provider/model>`)
    ใช้ `/model status` เพื่อยืนยันว่าโปรไฟล์การยืนยันตัวตนใดใช้งานอยู่

  </Accordion>

  <Accordion title="ฉันใช้ GPT 5.5 สำหรับงานประจำวันและ Codex 5.5 สำหรับการเขียนโค้ดได้ไหม?">
    ได้ ให้แยกการเลือกโมเดลออกจากการเลือกรันไทม์:

    - **เอเจนต์เขียนโค้ด Codex แบบเนทีฟ:** ตั้ง `agents.defaults.model.primary` เป็น `openai/gpt-5.5` และ `agents.defaults.agentRuntime.id` เป็น `"codex"` ลงชื่อเข้าใช้ด้วย `openclaw models auth login --provider openai-codex` เมื่อคุณต้องการการยืนยันตัวตนด้วยการสมัครสมาชิก ChatGPT/Codex
    - **งาน OpenAI API โดยตรงผ่าน PI:** ใช้ `/model openai/gpt-5.5` โดยไม่แทนที่รันไทม์ Codex และกำหนดค่า `OPENAI_API_KEY`
    - **Codex OAuth ผ่าน PI:** ใช้ `/model openai-codex/gpt-5.5` เฉพาะเมื่อคุณตั้งใจต้องการ runner PI ปกติพร้อม Codex OAuth
    - **เอเจนต์ย่อย:** กำหนดเส้นทางงานเขียนโค้ดไปยังเอเจนต์ที่ใช้ Codex เท่านั้น โดยมีโมเดลและค่าเริ่มต้น `agentRuntime` ของตัวเอง

    ดู [โมเดล](/th/concepts/models) และ [คำสั่ง Slash](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="ฉันจะกำหนดค่าโหมดเร็วสำหรับ GPT 5.5 ได้อย่างไร?">
    ใช้การสลับระดับเซสชันหรือค่าเริ่มต้นในค่ากำหนด:

    - **ต่อเซสชัน:** ส่ง `/fast on` ขณะที่เซสชันใช้ `openai/gpt-5.5` หรือ `openai-codex/gpt-5.5`
    - **ค่าเริ่มต้นต่อโมเดล:** ตั้ง `agents.defaults.models["openai/gpt-5.5"].params.fastMode` หรือ `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` เป็น `true`

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

    สำหรับ OpenAI โหมดเร็วจะจับคู่กับ `service_tier = "priority"` บนคำขอ Responses แบบเนทีฟที่รองรับ การแทนที่ด้วย `/fast` ในเซสชันมีผลเหนือค่าเริ่มต้นในค่ากำหนด

    ดู [การคิดและโหมดเร็ว](/th/tools/thinking) และ [โหมดเร็วของ OpenAI](/th/providers/openai#fast-mode)

  </Accordion>

  <Accordion title='ทำไมฉันเห็น "Model ... is not allowed" แล้วไม่มีการตอบกลับ?'>
    หากตั้งค่า `agents.defaults.models` ไว้ ค่านั้นจะกลายเป็น**รายการอนุญาต**สำหรับ `/model` และการแทนที่ใดๆ
    ในเซสชัน การเลือกโมเดลที่ไม่ได้อยู่ในรายการนั้นจะคืนค่า:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    ข้อผิดพลาดนั้นจะถูกส่งกลับ**แทน**การตอบกลับปกติ วิธีแก้: เพิ่มโมเดลลงใน
    `agents.defaults.models` ลบรายการอนุญาต หรือเลือกโมเดลจาก `/model list`
    หากคำสั่งมี `--runtime codex` ด้วย ให้เพิ่มโมเดลก่อนแล้วลองคำสั่ง
    `/model provider/model --runtime codex` เดิมอีกครั้ง

  </Accordion>

  <Accordion title='ทำไมฉันเห็น "Unknown model: minimax/MiniMax-M2.7"?'>
    หมายความว่า**ยังไม่ได้กำหนดค่าผู้ให้บริการ** (ไม่พบค่ากำหนดผู้ให้บริการ MiniMax หรือโปรไฟล์การยืนยันตัวตน)
    ดังนั้นจึงไม่สามารถ resolve โมเดลได้

    เช็กลิสต์การแก้ไข:

    1. อัปเกรดเป็น OpenClaw รุ่นปัจจุบัน (หรือรันจากซอร์ส `main`) แล้วรีสตาร์ต Gateway
    2. ตรวจสอบให้แน่ใจว่า MiniMax ถูกกำหนดค่าแล้ว (ตัวช่วยหรือ JSON) หรือมีการยืนยันตัวตน MiniMax
       อยู่ใน env/โปรไฟล์การยืนยันตัวตน เพื่อให้สามารถฉีดผู้ให้บริการที่ตรงกันได้
       (`MINIMAX_API_KEY` สำหรับ `minimax`, `MINIMAX_OAUTH_TOKEN` หรือ MiniMax
       OAuth ที่จัดเก็บไว้สำหรับ `minimax-portal`)
    3. ใช้รหัสโมเดลที่ตรงตัว (แยกตัวพิมพ์ใหญ่เล็ก) สำหรับเส้นทางการยืนยันตัวตนของคุณ:
       `minimax/MiniMax-M2.7` หรือ `minimax/MiniMax-M2.7-highspeed` สำหรับการตั้งค่า
       API-key หรือ `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` สำหรับการตั้งค่า OAuth
    4. รัน:

       ```bash
       openclaw models list
       ```

       แล้วเลือกจากรายการ (หรือ `/model list` ในแชต)

    ดู [MiniMax](/th/providers/minimax) และ [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันใช้ MiniMax เป็นค่าเริ่มต้นและ OpenAI สำหรับงานซับซ้อนได้ไหม?">
    ได้ ใช้**MiniMax เป็นค่าเริ่มต้น**และสลับโมเดล**ต่อเซสชัน**เมื่อจำเป็น
    Fallback ใช้สำหรับ**ข้อผิดพลาด** ไม่ใช่ "งานยาก" ดังนั้นให้ใช้ `/model` หรือเอเจนต์แยกต่างหาก

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

    **ตัวเลือก B: เอเจนต์แยกต่างหาก**

    - ค่าเริ่มต้นของเอเจนต์ A: MiniMax
    - ค่าเริ่มต้นของเอเจนต์ B: OpenAI
    - กำหนดเส้นทางตามเอเจนต์หรือใช้ `/agent` เพื่อสลับ

    เอกสาร: [โมเดล](/th/concepts/models), [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent), [MiniMax](/th/providers/minimax), [OpenAI](/th/providers/openai)

  </Accordion>

  <Accordion title="opus / sonnet / gpt เป็นชอร์ตคัตในตัวหรือไม่?">
    ใช่ OpenClaw มาพร้อมชวเลขเริ่มต้นบางรายการ (ใช้เฉพาะเมื่อมีโมเดลอยู่ใน `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` สำหรับการตั้งค่าด้วย API-key หรือ `openai-codex/gpt-5.5` เมื่อกำหนดค่าสำหรับ Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    หากคุณตั้งนามแฝงของตัวเองด้วยชื่อเดียวกัน ค่าของคุณจะมีผล

  </Accordion>

  <Accordion title="ฉันจะกำหนด/แทนที่ชอร์ตคัตโมเดล (นามแฝง) ได้อย่างไร?">
    นามแฝงมาจาก `agents.defaults.models.<modelId>.alias` ตัวอย่าง:

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

    จากนั้น `/model sonnet` (หรือ `/<alias>` เมื่อรองรับ) จะ resolve ไปยังรหัสโมเดลนั้น

  </Accordion>

  <Accordion title="ฉันจะเพิ่มโมเดลจากผู้ให้บริการอื่น เช่น OpenRouter หรือ Z.AI ได้อย่างไร?">
    OpenRouter (จ่ายตามโทเคน มีหลายโมเดล):

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

    หากคุณอ้างอิงผู้ให้บริการ/โมเดล แต่ไม่มีคีย์ผู้ให้บริการที่จำเป็น คุณจะได้รับข้อผิดพลาด auth ขณะรันไทม์ (เช่น `No API key found for provider "zai"`)

    **ไม่พบคีย์ API สำหรับผู้ให้บริการหลังจากเพิ่มเอเจนต์ใหม่**

    โดยปกติหมายความว่า **เอเจนต์ใหม่** มีที่เก็บ auth ว่างเปล่า auth แยกตามแต่ละเอเจนต์และ
    จัดเก็บไว้ใน:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    ตัวเลือกการแก้ไข:

    - รัน `openclaw agents add <id>` และกำหนดค่า auth ระหว่างตัวช่วยตั้งค่า
    - หรือคัดลอกเฉพาะโปรไฟล์ `api_key` / `token` แบบคงที่ที่พกพาได้จากที่เก็บ auth ของเอเจนต์หลักไปยังที่เก็บ auth ของเอเจนต์ใหม่
    - สำหรับโปรไฟล์ OAuth ให้ลงชื่อเข้าใช้จากเอเจนต์ใหม่เมื่อจำเป็นต้องใช้บัญชีของตัวเอง มิฉะนั้น OpenClaw สามารถอ่านต่อไปยังเอเจนต์เริ่มต้น/หลักได้โดยไม่ต้องโคลน refresh token

    อย่าใช้ `agentDir` ซ้ำข้ามเอเจนต์ เพราะจะทำให้ auth/session ชนกัน

  </Accordion>
</AccordionGroup>

## การสลับโมเดลสำรองและ "โมเดลทั้งหมดล้มเหลว"

<AccordionGroup>
  <Accordion title="How does failover work?">
    การสลับสำรองเกิดขึ้นสองขั้นตอน:

    1. **การหมุนเวียนโปรไฟล์ auth** ภายในผู้ให้บริการเดียวกัน
    2. **การถอยกลับไปใช้โมเดลสำรอง** ไปยังโมเดลถัดไปใน `agents.defaults.model.fallbacks`

    คูลดาวน์จะใช้กับโปรไฟล์ที่ล้มเหลว (exponential backoff) ดังนั้น OpenClaw จึงยังตอบสนองต่อไปได้แม้ผู้ให้บริการถูกจำกัดอัตราการใช้งานหรือล้มเหลวชั่วคราว

    บัคเก็ตการจำกัดอัตรารวมมากกว่าแค่การตอบกลับ `429` ธรรมดา OpenClaw
    ยังถือว่าข้อความอย่าง `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` และขีดจำกัดตาม
    หน้าต่างการใช้งานเป็นรอบ (`weekly/monthly limit reached`) เป็นการจำกัดอัตราที่ควรสลับสำรอง

    การตอบกลับบางรายการที่ดูเหมือนการเรียกเก็บเงินไม่ใช่ `402` และการตอบกลับ HTTP `402`
    บางรายการก็ยังอยู่ในบัคเก็ตชั่วคราวนั้นด้วย หากผู้ให้บริการส่งคืน
    ข้อความการเรียกเก็บเงินที่ชัดเจนใน `401` หรือ `403` OpenClaw ยังสามารถเก็บสิ่งนั้นไว้ใน
    ช่องทางการเรียกเก็บเงินได้ แต่ตัวจับคู่ข้อความเฉพาะผู้ให้บริการจะยังจำกัดขอบเขตอยู่กับ
    ผู้ให้บริการที่เป็นเจ้าของตัวจับคู่นั้น (เช่น OpenRouter `Key limit exceeded`) หากข้อความ `402`
    กลับดูเหมือนหน้าต่างการใช้งานที่ลองใหม่ได้หรือ
    ขีดจำกัดค่าใช้จ่ายขององค์กร/เวิร์กสเปซ (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) OpenClaw จะถือว่าเป็น
    `rate_limit` ไม่ใช่การปิดใช้งานด้านการเรียกเก็บเงินระยะยาว

    ข้อผิดพลาด context-overflow แตกต่างออกไป: ลายเซ็นอย่าง
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` หรือ `ollama error: context length
    exceeded` จะยังอยู่บนเส้นทาง Compaction/ลองใหม่ แทนที่จะไปยังการ
    ถอยกลับไปใช้โมเดลสำรอง

    ข้อความข้อผิดพลาดเซิร์ฟเวอร์ทั่วไปตั้งใจให้แคบกว่า "อะไรก็ตามที่มี
    unknown/error อยู่ในนั้น" OpenClaw ถือว่ารูปแบบชั่วคราวที่จำกัดขอบเขตตามผู้ให้บริการ
    เช่น Anthropic แบบเปล่า `An unknown error occurred`, OpenRouter แบบเปล่า
    `Provider returned error`, ข้อผิดพลาด stop-reason เช่น `Unhandled stop reason:
    error`, payload JSON `api_error` ที่มีข้อความเซิร์ฟเวอร์ชั่วคราว
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) และข้อผิดพลาดผู้ให้บริการไม่ว่าง เช่น `ModelNotReadyException` เป็น
    สัญญาณ timeout/overloaded ที่ควรสลับสำรองเมื่อบริบทผู้ให้บริการ
    ตรงกัน
    ข้อความสำรองภายในทั่วไปอย่าง `LLM request failed with an unknown
    error.` จะยังระมัดระวังและไม่ทริกเกอร์การถอยกลับไปใช้โมเดลสำรองด้วยตัวมันเอง

  </Accordion>

  <Accordion title='What does "No credentials found for profile anthropic:default" mean?'>
    หมายความว่าระบบพยายามใช้ ID โปรไฟล์ auth `anthropic:default` แต่ไม่พบข้อมูลรับรองของโปรไฟล์นั้นในที่เก็บ auth ที่คาดไว้

    **รายการตรวจสอบการแก้ไข:**

    - **ยืนยันว่าโปรไฟล์ auth อยู่ที่ใด** (พาธใหม่เทียบกับพาธเดิม)
      - ปัจจุบัน: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - เดิม: `~/.openclaw/agent/*` (ย้ายข้อมูลโดย `openclaw doctor`)
    - **ยืนยันว่า env var ของคุณถูกโหลดโดย Gateway**
      - หากคุณตั้งค่า `ANTHROPIC_API_KEY` ในเชลล์ แต่รัน Gateway ผ่าน systemd/launchd อาจไม่ได้รับค่านั้น ให้ใส่ไว้ใน `~/.openclaw/.env` หรือเปิดใช้ `env.shellEnv`
    - **ตรวจสอบให้แน่ใจว่าคุณกำลังแก้ไขเอเจนต์ที่ถูกต้อง**
      - การตั้งค่าหลายเอเจนต์หมายความว่าอาจมีไฟล์ `auth-profiles.json` หลายไฟล์
    - **ตรวจสอบสถานะโมเดล/auth แบบคร่าว ๆ**
      - ใช้ `openclaw models status` เพื่อดูโมเดลที่กำหนดค่าไว้และผู้ให้บริการผ่านการยืนยันตัวตนแล้วหรือไม่

    **รายการตรวจสอบการแก้ไขสำหรับ "No credentials found for profile anthropic"**

    หมายความว่าการรันถูกตรึงไว้กับโปรไฟล์ auth ของ Anthropic แต่ Gateway
    ไม่พบโปรไฟล์นั้นในที่เก็บ auth ของตน

    - **ใช้ Claude CLI**
      - รัน `openclaw models auth login --provider anthropic --method cli --set-default` บนโฮสต์ Gateway
    - **หากคุณต้องการใช้คีย์ API แทน**
      - ใส่ `ANTHROPIC_API_KEY` ใน `~/.openclaw/.env` บน **โฮสต์ Gateway**
      - ล้างลำดับที่ตรึงไว้ซึ่งบังคับใช้โปรไฟล์ที่หายไป:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **ยืนยันว่าคุณกำลังรันคำสั่งบนโฮสต์ Gateway**
      - ในโหมดรีโมต โปรไฟล์ auth อยู่บนเครื่อง Gateway ไม่ใช่แล็ปท็อปของคุณ

  </Accordion>

  <Accordion title="Why did it also try Google Gemini and fail?">
    หากการกำหนดค่าโมเดลของคุณมี Google Gemini เป็นโมเดลสำรอง (หรือคุณเปลี่ยนไปใช้รูปย่อของ Gemini) OpenClaw จะลองใช้ระหว่างการถอยกลับไปใช้โมเดลสำรอง หากคุณยังไม่ได้กำหนดค่าข้อมูลรับรอง Google คุณจะเห็น `No API key found for provider "google"`

    วิธีแก้: ให้ตั้งค่า auth ของ Google หรือลบ/หลีกเลี่ยงโมเดล Google ใน `agents.defaults.model.fallbacks` / aliases เพื่อไม่ให้การสลับสำรองส่งไปที่นั่น

    **คำขอ LLM ถูกปฏิเสธ: จำเป็นต้องมีลายเซ็น thinking (Google Antigravity)**

    สาเหตุ: ประวัติเซสชันมี **บล็อก thinking ที่ไม่มีลายเซ็น** (มักมาจาก
    สตรีมที่ถูกยกเลิก/ไม่สมบูรณ์) Google Antigravity ต้องใช้ลายเซ็นสำหรับบล็อก thinking

    วิธีแก้: ตอนนี้ OpenClaw จะตัดบล็อก thinking ที่ไม่มีลายเซ็นสำหรับ Google Antigravity Claude ออก หากยังปรากฏอยู่ ให้เริ่ม **เซสชันใหม่** หรือตั้งค่า `/thinking off` สำหรับเอเจนต์นั้น

  </Accordion>
</AccordionGroup>

## โปรไฟล์ auth: คืออะไรและจัดการอย่างไร

ที่เกี่ยวข้อง: [/concepts/oauth](/th/concepts/oauth) (โฟลว์ OAuth, การจัดเก็บโทเค็น, รูปแบบหลายบัญชี)

<AccordionGroup>
  <Accordion title="What is an auth profile?">
    โปรไฟล์ auth คือระเบียนข้อมูลรับรองที่มีชื่อ (OAuth หรือคีย์ API) ซึ่งผูกกับผู้ให้บริการ โปรไฟล์อยู่ใน:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    หากต้องการตรวจสอบโปรไฟล์ที่บันทึกไว้โดยไม่แสดง secret ให้รัน `openclaw models auth list` (เลือกใช้ `--provider <id>` หรือ `--json` ได้) ดูรายละเอียดใน [Models CLI](/th/cli/models#openclaw-models-auth-list)

  </Accordion>

  <Accordion title="What are typical profile IDs?">
    OpenClaw ใช้ ID ที่มีคำนำหน้าผู้ให้บริการ เช่น:

    - `anthropic:default` (พบได้บ่อยเมื่อไม่มีตัวตนอีเมล)
    - `anthropic:<email>` สำหรับตัวตน OAuth
    - ID กำหนดเองที่คุณเลือก (เช่น `anthropic:work`)

  </Accordion>

  <Accordion title="Can I control which auth profile is tried first?">
    ได้ การกำหนดค่ารองรับ metadata เพิ่มเติมสำหรับโปรไฟล์และการจัดลำดับต่อผู้ให้บริการ (`auth.order.<provider>`) สิ่งนี้ **ไม่** เก็บ secret แต่แมป ID ไปยังผู้ให้บริการ/โหมด และตั้งค่าลำดับการหมุนเวียน

    OpenClaw อาจข้ามโปรไฟล์ชั่วคราวหากอยู่ใน **คูลดาวน์** สั้น ๆ (การจำกัดอัตรา/timeout/auth ล้มเหลว) หรือสถานะ **ปิดใช้งาน** ที่นานกว่า (การเรียกเก็บเงิน/เครดิตไม่เพียงพอ) หากต้องการตรวจสอบ ให้รัน `openclaw models status --json` และดู `auth.unusableProfiles` การปรับแต่ง: `auth.cooldowns.billingBackoffHours*`

    คูลดาวน์การจำกัดอัตราสามารถจำกัดตามโมเดลได้ โปรไฟล์ที่กำลังคูลดาวน์
    สำหรับโมเดลหนึ่งยังอาจใช้ได้กับโมเดลพี่น้องบนผู้ให้บริการเดียวกัน
    ขณะที่หน้าต่างการเรียกเก็บเงิน/ปิดใช้งานยังบล็อกทั้งโปรไฟล์

    คุณยังสามารถตั้งค่า override ลำดับ **ต่อเอเจนต์** (เก็บไว้ใน `auth-state.json` ของเอเจนต์นั้น) ผ่าน CLI:

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

    หากต้องการตรวจสอบว่าจะลองใช้อะไรจริง ให้ใช้:

    ```bash
    openclaw models status --probe
    ```

    หากโปรไฟล์ที่จัดเก็บถูกละไว้จากลำดับที่ระบุอย่างชัดเจน probe จะรายงาน
    `excluded_by_auth_order` สำหรับโปรไฟล์นั้นแทนที่จะลองใช้แบบเงียบ ๆ

  </Accordion>

  <Accordion title="OAuth vs API key - what is the difference?">
    OpenClaw รองรับทั้งสองแบบ:

    - **OAuth** มักใช้ประโยชน์จากสิทธิ์การเข้าถึงแบบสมัครสมาชิก (เมื่อใช้ได้)
    - **คีย์ API** ใช้การเรียกเก็บเงินตามจำนวนโทเค็น

    ตัวช่วยตั้งค่ารองรับ Anthropic Claude CLI, OpenAI Codex OAuth และคีย์ API อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [FAQ](/th/help/faq) — FAQ หลัก
- [FAQ — การเริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก](/th/help/faq-first-run)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [การสลับโมเดลสำรอง](/th/concepts/model-failover)
