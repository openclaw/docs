---
read_when:
    - การเลือกหรือสลับโมเดล, การกำหนดค่าชื่อแทน
    - การดีบักการสลับสำรองของโมเดล / "โมเดลทั้งหมดล้มเหลว"
    - ทำความเข้าใจโปรไฟล์การยืนยันตัวตนและวิธีจัดการ
sidebarTitle: Models FAQ
summary: 'คำถามที่พบบ่อย: ค่าเริ่มต้นของโมเดล, การเลือก, ชื่อแทน, การสลับ, การสลับไปใช้ระบบสำรองเมื่อเกิดข้อผิดพลาด, และโปรไฟล์การยืนยันตัวตน'
title: 'คำถามที่พบบ่อย: โมเดลและการยืนยันตัวตน'
x-i18n:
    generated_at: "2026-05-07T13:20:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec3256990c91d30e1241554ceafeb23ba0eb9b858cd028d64c9cd0631e67f34
    source_path: help/faq-models.md
    workflow: 16
---

  คำถามและคำตอบเกี่ยวกับโมเดลและ auth-profile สำหรับการตั้งค่า เซสชัน Gateway ช่องทาง และการแก้ไขปัญหา โปรดดู [FAQ](/th/help/faq) หลัก

  ## โมเดล: ค่าเริ่มต้น การเลือก นามแฝง การสลับ

  <AccordionGroup>
  <Accordion title='“โมเดลเริ่มต้น” คืออะไร?'>
    โมเดลเริ่มต้นของ OpenClaw คือค่าที่คุณตั้งไว้เป็น:

    ```
    agents.defaults.model.primary
    ```

    โมเดลอ้างอิงในรูปแบบ `provider/model` (ตัวอย่าง: `openai/gpt-5.5` หรือ `anthropic/claude-sonnet-4-6`) หากคุณละ provider ไว้ OpenClaw จะลองใช้นามแฝงก่อน จากนั้นจึงลองจับคู่กับ configured-provider ที่ไม่ซ้ำกันสำหรับ model id นั้นแบบตรงตัว และหลังจากนั้นเท่านั้นจึงย้อนกลับไปใช้ provider เริ่มต้นที่กำหนดค่าไว้ในฐานะเส้นทางความเข้ากันได้แบบเลิกใช้แล้ว หาก provider นั้นไม่เปิดเผยโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะย้อนกลับไปใช้ provider/model ตัวแรกที่กำหนดค่าไว้ แทนที่จะแสดงค่าเริ่มต้นของ removed-provider ที่เก่าแล้ว คุณยังควรตั้งค่า `provider/model` แบบ**ชัดเจน**

  </Accordion>

  <Accordion title="คุณแนะนำโมเดลใด?">
    **ค่าเริ่มต้นที่แนะนำ:** ใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดซึ่งมีอยู่ในสแต็ก provider ของคุณ
    **สำหรับเอเจนต์ที่เปิดใช้เครื่องมือหรือรับอินพุตที่ไม่น่าเชื่อถือ:** ให้ความสำคัญกับความแข็งแกร่งของโมเดลเหนือค่าใช้จ่าย
    **สำหรับแชตรูทีน/ความเสี่ยงต่ำ:** ใช้โมเดลสำรองที่ถูกกว่าและกำหนดเส้นทางตามบทบาทของเอเจนต์

    MiniMax มีเอกสารของตัวเอง: [MiniMax](/th/providers/minimax) และ
    [โมเดลโลคัล](/th/gateway/local-models)

    หลักทั่วไป: ใช้**โมเดลที่ดีที่สุดที่คุณรับค่าใช้จ่ายได้**สำหรับงานที่มีความเสี่ยงสูง และใช้โมเดลที่ถูกกว่า
    สำหรับแชตรูทีนหรือการสรุป คุณสามารถกำหนดเส้นทางโมเดลแยกตามเอเจนต์ และใช้เอเจนต์ย่อยเพื่อ
    ขนานงานที่ใช้เวลานานได้ (เอเจนต์ย่อยแต่ละตัวใช้โทเค็น) ดู [โมเดล](/th/concepts/models) และ
    [เอเจนต์ย่อย](/th/tools/subagents)

    คำเตือนสำคัญ: โมเดลที่อ่อนแอกว่าหรือถูก quantize มากเกินไปจะเสี่ยงต่อ prompt
    injection และพฤติกรรมที่ไม่ปลอดภัยมากกว่า ดู [ความปลอดภัย](/th/gateway/security)

    บริบทเพิ่มเติม: [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันจะสลับโมเดลโดยไม่ล้างการกำหนดค่าของฉันได้อย่างไร?">
    ใช้**คำสั่งโมเดล**หรือแก้ไขเฉพาะฟิลด์ **model** หลีกเลี่ยงการแทนที่ config ทั้งหมด

    ตัวเลือกที่ปลอดภัย:

    - `/model` ในแชต (รวดเร็ว ต่อเซสชัน)
    - `openclaw models set ...` (อัปเดตเฉพาะ config ของโมเดล)
    - `openclaw configure --section model` (แบบโต้ตอบ)
    - แก้ไข `agents.defaults.model` ใน `~/.openclaw/openclaw.json`

    หลีกเลี่ยง `config.apply` ด้วยออบเจ็กต์บางส่วน เว้นแต่คุณตั้งใจจะแทนที่ config ทั้งหมด
    สำหรับการแก้ไข RPC ให้ตรวจสอบด้วย `config.schema.lookup` ก่อน และควรใช้ `config.patch` เพย์โหลด lookup จะให้ path ที่ normalize แล้ว เอกสาร/ข้อจำกัดของ schema แบบตื้น และสรุปลูกชั้นถัดไปทันที
    สำหรับการอัปเดตบางส่วน
    หากคุณเขียนทับ config ไปแล้ว ให้กู้คืนจากข้อมูลสำรองหรือรัน `openclaw doctor` อีกครั้งเพื่อซ่อมแซม

    เอกสาร: [โมเดล](/th/concepts/models), [กำหนดค่า](/th/cli/configure), [Config](/th/cli/config), [Doctor](/th/gateway/doctor)

  </Accordion>

  <Accordion title="ฉันใช้โมเดล self-hosted (llama.cpp, vLLM, Ollama) ได้ไหม?">
    ได้ Ollama เป็นเส้นทางที่ง่ายที่สุดสำหรับโมเดลโลคัล

    การตั้งค่าที่เร็วที่สุด:

    1. ติดตั้ง Ollama จาก `https://ollama.com/download`
    2. ดึงโมเดลโลคัล เช่น `ollama pull gemma4`
    3. หากคุณต้องการโมเดลคลาวด์ด้วย ให้รัน `ollama signin`
    4. รัน `openclaw onboard` แล้วเลือก `Ollama`
    5. เลือก `Local` หรือ `Cloud + Local`

    หมายเหตุ:

    - `Cloud + Local` ให้คุณใช้โมเดลคลาวด์พร้อมกับโมเดล Ollama โลคัลของคุณ
    - โมเดลคลาวด์ เช่น `kimi-k2.5:cloud` ไม่ต้องดึงมาไว้ในเครื่อง
    - สำหรับการสลับด้วยตนเอง ให้ใช้ `openclaw models list` และ `openclaw models set ollama/<model>`

    หมายเหตุด้านความปลอดภัย: โมเดลที่เล็กกว่าหรือถูก quantize หนักจะเสี่ยงต่อ prompt
    injection มากกว่า เราแนะนำอย่างยิ่งให้ใช้**โมเดลขนาดใหญ่**สำหรับบอตใดๆ ที่ใช้เครื่องมือได้
    หากคุณยังต้องการใช้โมเดลขนาดเล็ก ให้เปิดใช้ sandboxing และ allowlist เครื่องมือแบบเข้มงวด

    เอกสาร: [Ollama](/th/providers/ollama), [โมเดลโลคัล](/th/gateway/local-models),
    [Provider โมเดล](/th/concepts/model-providers), [ความปลอดภัย](/th/gateway/security),
    [Sandboxing](/th/gateway/sandboxing)

  </Accordion>

  <Accordion title="OpenClaw, Flawd และ Krill ใช้โมเดลอะไร?">
    - การปรับใช้เหล่านี้อาจแตกต่างกันและอาจเปลี่ยนแปลงเมื่อเวลาผ่านไป ไม่มีคำแนะนำ provider แบบตายตัว
    - ตรวจสอบการตั้งค่ารันไทม์ปัจจุบันในแต่ละ gateway ด้วย `openclaw models status`
    - สำหรับเอเจนต์ที่อ่อนไหวด้านความปลอดภัย/เปิดใช้เครื่องมือ ให้ใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดซึ่งมีอยู่

  </Accordion>

  <Accordion title="ฉันจะสลับโมเดลทันที (โดยไม่รีสตาร์ท) ได้อย่างไร?">
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

    เหล่านี้คือนามแฝงในตัว สามารถเพิ่มนามแฝงแบบกำหนดเองผ่าน `agents.defaults.models`

    คุณสามารถแสดงรายการโมเดลที่มีได้ด้วย `/model`, `/model list` หรือ `/model status`

    `/model` (และ `/model list`) จะแสดงตัวเลือกแบบกะทัดรัดพร้อมหมายเลข เลือกด้วยหมายเลข:

    ```
    /model 3
    ```

    คุณยังสามารถบังคับใช้ auth profile เฉพาะสำหรับ provider ได้ (ต่อเซสชัน):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    เคล็ดลับ: `/model status` แสดงว่าเอเจนต์ใดกำลังทำงานอยู่ ใช้ไฟล์ `auth-profiles.json` ไฟล์ใด และจะลองใช้ auth profile ใดถัดไป
    นอกจากนี้ยังแสดง endpoint ของ provider ที่กำหนดค่าไว้ (`baseUrl`) และโหมด API (`api`) เมื่อมีข้อมูล

    **ฉันจะเลิกปักหมุดโปรไฟล์ที่ตั้งด้วย @profile ได้อย่างไร?**

    รัน `/model` อีกครั้งโดย**ไม่มี** suffix `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    หากคุณต้องการกลับไปใช้ค่าเริ่มต้น ให้เลือกจาก `/model` (หรือส่ง `/model <default provider/model>`)
    ใช้ `/model status` เพื่อยืนยันว่า auth profile ใดกำลังทำงานอยู่

  </Accordion>

  <Accordion title="ฉันใช้ GPT 5.5 สำหรับงานประจำวัน และ Codex 5.5 สำหรับการเขียนโค้ดได้ไหม?">
    ได้ ให้แยกการเลือกโมเดลออกจากการเลือกรันไทม์:

    - **เอเจนต์เขียนโค้ด Codex แบบเนทีฟ:** ตั้ง `agents.defaults.model.primary` เป็น `openai/gpt-5.5` ลงชื่อเข้าใช้ด้วย `openclaw models auth login --provider openai-codex` เมื่อต้องการ auth จากการสมัครสมาชิก ChatGPT/Codex
    - **งาน OpenAI API โดยตรงนอก agent loop:** กำหนดค่า `OPENAI_API_KEY` สำหรับรูปภาพ embeddings เสียง realtime และพื้นผิว OpenAI API อื่นๆ ที่ไม่ใช่เอเจนต์
    - **auth คีย์ API ของเอเจนต์ OpenAI:** ใช้ `/model openai/gpt-5.5` กับโปรไฟล์คีย์ API `openai-codex` ที่จัดลำดับไว้
    - **เอเจนต์ย่อย:** กำหนดเส้นทางงานเขียนโค้ดไปยังเอเจนต์แบบ Codex-only ที่มีโมเดลของตนเองและค่าเริ่มต้น `agentRuntime`

    ดู [โมเดล](/th/concepts/models) และ [คำสั่ง Slash](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="ฉันจะกำหนดค่าโหมดเร็วสำหรับ GPT 5.5 ได้อย่างไร?">
    ใช้ได้ทั้ง toggle ต่อเซสชันหรือค่าเริ่มต้นใน config:

    - **ต่อเซสชัน:** ส่ง `/fast on` ขณะที่เซสชันกำลังใช้ `openai/gpt-5.5`
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

    สำหรับ OpenAI โหมดเร็ว map ไปยัง `service_tier = "priority"` บนคำขอ Responses แบบเนทีฟที่รองรับ การ override ด้วย `/fast` ของเซสชันจะมีผลเหนือค่าเริ่มต้นใน config

    ดู [Thinking และโหมดเร็ว](/th/tools/thinking) และ [โหมดเร็วของ OpenAI](/th/providers/openai#fast-mode)

  </Accordion>

  <Accordion title='ทำไมฉันจึงเห็น "Model ... is not allowed" แล้วไม่มีคำตอบ?'>
    หากตั้งค่า `agents.defaults.models` ไว้ ค่านั้นจะกลายเป็น **allowlist** สำหรับ `/model` และการ override ใดๆ
    ของเซสชัน การเลือกโมเดลที่ไม่อยู่ในรายการนั้นจะคืนค่า:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    ข้อผิดพลาดนั้นถูกส่งกลับ**แทน**คำตอบปกติ วิธีแก้: เพิ่มโมเดลลงใน
    `agents.defaults.models` ลบ allowlist หรือเลือกโมเดลจาก `/model list`
    หากคำสั่งมี `--runtime codex` ด้วย ให้เพิ่มโมเดลก่อน แล้วค่อยลองคำสั่ง
    `/model provider/model --runtime codex` เดิมอีกครั้ง

  </Accordion>

  <Accordion title='ทำไมฉันจึงเห็น "Unknown model: minimax/MiniMax-M2.7"?'>
    นี่หมายความว่า **provider ไม่ได้ถูกกำหนดค่า** (ไม่พบ config หรือ auth
    profile ของ MiniMax provider) ดังนั้นจึง resolve โมเดลไม่ได้

    รายการตรวจสอบการแก้ไข:

    1. อัปเกรดเป็น OpenClaw รุ่นปัจจุบัน (หรือรันจาก source `main`) แล้วรีสตาร์ท gateway
    2. ตรวจให้แน่ใจว่า MiniMax ถูกกำหนดค่าแล้ว (wizard หรือ JSON) หรือมี auth ของ MiniMax
       อยู่ใน env/auth profiles เพื่อให้ provider ที่ตรงกันถูก inject ได้
       (`MINIMAX_API_KEY` สำหรับ `minimax`, `MINIMAX_OAUTH_TOKEN` หรือ MiniMax
       OAuth ที่จัดเก็บไว้สำหรับ `minimax-portal`)
    3. ใช้ model id ที่ตรงเป๊ะ (case-sensitive) สำหรับเส้นทาง auth ของคุณ:
       `minimax/MiniMax-M2.7` หรือ `minimax/MiniMax-M2.7-highspeed` สำหรับการตั้งค่า
       คีย์ API หรือ `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` สำหรับการตั้งค่า OAuth
    4. รัน:

       ```bash
       openclaw models list
       ```

       แล้วเลือกจากรายการ (หรือ `/model list` ในแชต)

    ดู [MiniMax](/th/providers/minimax) และ [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันใช้ MiniMax เป็นค่าเริ่มต้นและใช้ OpenAI สำหรับงานซับซ้อนได้ไหม?">
    ได้ ใช้ **MiniMax เป็นค่าเริ่มต้น** และสลับโมเดล**ต่อเซสชัน**เมื่อจำเป็น
    Fallback มีไว้สำหรับ**ข้อผิดพลาด** ไม่ใช่ “งานยาก” ดังนั้นให้ใช้ `/model` หรือเอเจนต์แยกต่างหาก

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

  <Accordion title="opus / sonnet / gpt เป็นทางลัดในตัวใช่ไหม?">
    ใช่ OpenClaw มาพร้อมชวเลขเริ่มต้นบางรายการ (ใช้เฉพาะเมื่อโมเดลมีอยู่ใน `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    หากคุณตั้งนามแฝงของคุณเองด้วยชื่อเดียวกัน ค่าของคุณจะมีผลก่อน

  </Accordion>

  <Accordion title="ฉันจะกำหนด/override ทางลัดโมเดล (นามแฝง) ได้อย่างไร?">
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

    จากนั้น `/model sonnet` (หรือ `/<alias>` เมื่อรองรับ) จะ resolve เป็น ID โมเดลนั้น

  </Accordion>

  <Accordion title="ฉันจะเพิ่มโมเดลจาก provider อื่น เช่น OpenRouter หรือ Z.AI ได้อย่างไร?">
    OpenRouter (จ่ายตามโทเค็น มีหลายโมเดล):

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

    หากคุณอ้างอิงผู้ให้บริการ/โมเดล แต่ไม่มีคีย์ผู้ให้บริการที่จำเป็น คุณจะได้รับข้อผิดพลาดการยืนยันตัวตนขณะรันไทม์ (เช่น `No API key found for provider "zai"`)

    **ไม่พบ API key สำหรับผู้ให้บริการหลังจากเพิ่มเอเจนต์ใหม่**

    โดยปกติหมายความว่า **เอเจนต์ใหม่** มีที่เก็บการยืนยันตัวตนว่างเปล่า การยืนยันตัวตนแยกตามเอเจนต์และ
    ถูกจัดเก็บไว้ใน:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    ตัวเลือกการแก้ไข:

    - รัน `openclaw agents add <id>` และกำหนดค่าการยืนยันตัวตนระหว่างตัวช่วยตั้งค่า
    - หรือคัดลอกเฉพาะโปรไฟล์ `api_key` / `token` แบบสแตติกที่ย้ายได้จากที่เก็บการยืนยันตัวตนของเอเจนต์หลักไปยังที่เก็บการยืนยันตัวตนของเอเจนต์ใหม่
    - สำหรับโปรไฟล์ OAuth ให้ลงชื่อเข้าใช้จากเอเจนต์ใหม่เมื่อจำเป็นต้องใช้บัญชีของตัวเอง มิฉะนั้น OpenClaw สามารถอ่านผ่านไปยังเอเจนต์ค่าเริ่มต้น/เอเจนต์หลักได้โดยไม่ต้องโคลนรีเฟรชโทเค็น

    อย่าใช้ `agentDir` ซ้ำข้ามเอเจนต์ เพราะจะทำให้การยืนยันตัวตน/เซสชันชนกัน

  </Accordion>
</AccordionGroup>

## การสลับโมเดลเมื่อขัดข้องและ "โมเดลทั้งหมดล้มเหลว"

<AccordionGroup>
  <Accordion title="How does failover work?">
    การสลับเมื่อขัดข้องเกิดขึ้นในสองขั้นตอน:

    1. **การหมุนเวียนโปรไฟล์การยืนยันตัวตน** ภายในผู้ให้บริการเดียวกัน
    2. **โมเดลสำรอง** ไปยังโมเดลถัดไปใน `agents.defaults.model.fallbacks`

    คูลดาวน์จะใช้กับโปรไฟล์ที่ล้มเหลว (แบ็กออฟแบบเอ็กซ์โพเนนเชียล) ดังนั้น OpenClaw จึงยังตอบสนองต่อไปได้แม้ผู้ให้บริการถูกจำกัดอัตราการใช้งานหรือล้มเหลวชั่วคราว

    บักเก็ตการจำกัดอัตรามีมากกว่าการตอบกลับ `429` ธรรมดา OpenClaw
    ยังถือว่าข้อความอย่าง `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` และขีดจำกัด
    หน้าต่างการใช้งานเป็นรอบ (`weekly/monthly limit reached`) เป็นขีดจำกัดอัตรา
    ที่ควรสลับเมื่อขัดข้อง

    การตอบกลับบางรายการที่ดูเหมือนเกี่ยวกับการเรียกเก็บเงินไม่ใช่ `402` และการตอบกลับ HTTP `402`
    บางรายการก็ยังอยู่ในบักเก็ตชั่วคราวนั้นด้วย หากผู้ให้บริการส่งคืน
    ข้อความการเรียกเก็บเงินแบบชัดเจนบน `401` หรือ `403` OpenClaw ยังสามารถเก็บข้อความนั้นไว้ใน
    เลนการเรียกเก็บเงินได้ แต่ตัวจับคู่ข้อความเฉพาะผู้ให้บริการจะยังจำกัดขอบเขตอยู่กับ
    ผู้ให้บริการที่เป็นเจ้าของเท่านั้น (ตัวอย่างเช่น OpenRouter `Key limit exceeded`) หากข้อความ `402`
    กลับดูเหมือนหน้าต่างการใช้งานที่ลองใหม่ได้ หรือ
    ขีดจำกัดค่าใช้จ่ายขององค์กร/เวิร์กสเปซ (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) OpenClaw จะถือว่าเป็น
    `rate_limit` ไม่ใช่การปิดใช้งานการเรียกเก็บเงินระยะยาว

    ข้อผิดพลาดบริบทล้นจะแตกต่างออกไป: รูปแบบอย่าง
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` หรือ `ollama error: context length
    exceeded` จะอยู่บนเส้นทาง Compaction/ลองใหม่ แทนที่จะเดินหน้าไปยัง
    โมเดลสำรอง

    ข้อความข้อผิดพลาดเซิร์ฟเวอร์ทั่วไปถูกตั้งใจให้แคบกว่า "อะไรก็ตามที่มี
    unknown/error อยู่ในนั้น" OpenClaw จะถือว่ารูปแบบชั่วคราวที่จำกัดตามผู้ให้บริการ
    เช่น Anthropic แบบเปล่า `An unknown error occurred`, OpenRouter แบบเปล่า
    `Provider returned error`, ข้อผิดพลาดสาเหตุการหยุดอย่าง `Unhandled stop reason:
    error`, เพย์โหลด JSON `api_error` ที่มีข้อความเซิร์ฟเวอร์ชั่วคราว
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) และข้อผิดพลาดผู้ให้บริการไม่ว่าง เช่น `ModelNotReadyException` เป็น
    สัญญาณหมดเวลา/โอเวอร์โหลดที่ควรสลับเมื่อขัดข้อง เมื่อบริบทผู้ให้บริการ
    ตรงกัน
    ข้อความสำรองภายในทั่วไปอย่าง `LLM request failed with an unknown
    error.` จะยังคงระมัดระวังและไม่กระตุ้นโมเดลสำรองด้วยตัวเอง

  </Accordion>

  <Accordion title='What does "No credentials found for profile anthropic:default" mean?'>
    หมายความว่าระบบพยายามใช้ ID โปรไฟล์การยืนยันตัวตน `anthropic:default` แต่ไม่พบข้อมูลรับรองสำหรับโปรไฟล์นั้นในที่เก็บการยืนยันตัวตนที่คาดไว้

    **รายการตรวจสอบการแก้ไข:**

    - **ยืนยันว่าโปรไฟล์การยืนยันตัวตนอยู่ที่ใด** (พาธใหม่เทียบกับพาธเก่า)
      - ปัจจุบัน: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - เดิม: `~/.openclaw/agent/*` (ย้ายโดย `openclaw doctor`)
    - **ยืนยันว่า env var ของคุณถูกโหลดโดย Gateway**
      - หากคุณตั้งค่า `ANTHROPIC_API_KEY` ในเชลล์ แต่รัน Gateway ผ่าน systemd/launchd ระบบอาจไม่สืบทอดค่านั้น ให้ใส่ไว้ใน `~/.openclaw/.env` หรือเปิดใช้ `env.shellEnv`
    - **ตรวจสอบให้แน่ใจว่าคุณกำลังแก้ไขเอเจนต์ที่ถูกต้อง**
      - การตั้งค่าแบบหลายเอเจนต์หมายความว่าอาจมีไฟล์ `auth-profiles.json` ได้หลายไฟล์
    - **ตรวจสอบสถานะโมเดล/การยืนยันตัวตนคร่าว ๆ**
      - ใช้ `openclaw models status` เพื่อดูโมเดลที่กำหนดค่าไว้และตรวจสอบว่าผู้ให้บริการได้รับการยืนยันตัวตนแล้วหรือไม่

    **รายการตรวจสอบการแก้ไขสำหรับ "ไม่พบข้อมูลรับรองสำหรับโปรไฟล์ anthropic"**

    หมายความว่าการรันถูกปักไว้กับโปรไฟล์การยืนยันตัวตน Anthropic แต่ Gateway
    หาโปรไฟล์นั้นไม่พบในที่เก็บการยืนยันตัวตน

    - **ใช้ Claude CLI**
      - รัน `openclaw models auth login --provider anthropic --method cli --set-default` บนโฮสต์ Gateway
    - **หากคุณต้องการใช้ API key แทน**
      - ใส่ `ANTHROPIC_API_KEY` ใน `~/.openclaw/.env` บน **โฮสต์ Gateway**
      - ล้างลำดับที่ปักไว้ซึ่งบังคับให้ใช้โปรไฟล์ที่หายไป:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **ยืนยันว่าคุณกำลังรันคำสั่งบนโฮสต์ Gateway**
      - ในโหมดระยะไกล โปรไฟล์การยืนยันตัวตนอยู่บนเครื่อง Gateway ไม่ใช่แล็ปท็อปของคุณ

  </Accordion>

  <Accordion title="Why did it also try Google Gemini and fail?">
    หากการกำหนดค่าโมเดลของคุณมี Google Gemini เป็นตัวสำรอง (หรือคุณเปลี่ยนไปใช้ตัวย่อ Gemini) OpenClaw จะลองใช้ระหว่างการสลับโมเดลเมื่อขัดข้อง หากคุณยังไม่ได้กำหนดค่าข้อมูลรับรอง Google คุณจะเห็น `No API key found for provider "google"`

    วิธีแก้: ให้ข้อมูลยืนยันตัวตน Google หรือเอา/หลีกเลี่ยงโมเดล Google ใน `agents.defaults.model.fallbacks` / alias เพื่อไม่ให้ตัวสำรองส่งเส้นทางไปที่นั่น

    **คำขอ LLM ถูกปฏิเสธ: ต้องมีลายเซ็นการคิด (Google Antigravity)**

    สาเหตุ: ประวัติเซสชันมี **บล็อกการคิดที่ไม่มีลายเซ็น** (มักมาจาก
    สตรีมที่ถูกยกเลิก/บางส่วน) Google Antigravity ต้องใช้ลายเซ็นสำหรับบล็อกการคิด

    วิธีแก้: ตอนนี้ OpenClaw จะตัดบล็อกการคิดที่ไม่มีลายเซ็นออกสำหรับ Google Antigravity Claude หากยังปรากฏอยู่ ให้เริ่ม **เซสชันใหม่** หรือตั้งค่า `/thinking off` สำหรับเอเจนต์นั้น

  </Accordion>
</AccordionGroup>

## โปรไฟล์การยืนยันตัวตน: คืออะไรและจัดการอย่างไร

ที่เกี่ยวข้อง: [/concepts/oauth](/th/concepts/oauth) (โฟลว์ OAuth, การจัดเก็บโทเค็น, รูปแบบหลายบัญชี)

<AccordionGroup>
  <Accordion title="What is an auth profile?">
    โปรไฟล์การยืนยันตัวตนคือระเบียนข้อมูลรับรองที่มีชื่อ (OAuth หรือ API key) ซึ่งผูกกับผู้ให้บริการ โปรไฟล์อยู่ใน:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    หากต้องการตรวจสอบโปรไฟล์ที่บันทึกไว้โดยไม่เทความลับออกมา ให้รัน `openclaw models auth list` (เลือกใช้ `--provider <id>` หรือ `--json` ได้) ดูรายละเอียดใน [Models CLI](/th/cli/models#auth-profiles)

  </Accordion>

  <Accordion title="What are typical profile IDs?">
    OpenClaw ใช้ ID ที่นำหน้าด้วยผู้ให้บริการ เช่น:

    - `anthropic:default` (พบบ่อยเมื่อไม่มีข้อมูลระบุตัวตนอีเมล)
    - `anthropic:<email>` สำหรับตัวตน OAuth
    - ID กำหนดเองที่คุณเลือก (เช่น `anthropic:work`)

  </Accordion>

  <Accordion title="Can I control which auth profile is tried first?">
    ได้ Config รองรับเมตาดาต้าเสริมสำหรับโปรไฟล์และลำดับต่อผู้ให้บริการ (`auth.order.<provider>`) สิ่งนี้ **ไม่** เก็บความลับ แต่แมป ID กับผู้ให้บริการ/โหมด และตั้งค่าลำดับการหมุนเวียน

    OpenClaw อาจข้ามโปรไฟล์ชั่วคราวหากอยู่ใน **คูลดาวน์** สั้น ๆ (ขีดจำกัดอัตรา/หมดเวลา/การยืนยันตัวตนล้มเหลว) หรือสถานะ **ปิดใช้งาน** ที่นานกว่า (การเรียกเก็บเงิน/เครดิตไม่พอ) หากต้องการตรวจสอบ ให้รัน `openclaw models status --json` และดู `auth.unusableProfiles` การปรับแต่ง: `auth.cooldowns.billingBackoffHours*`

    คูลดาวน์ของขีดจำกัดอัตราสามารถจำกัดตามโมเดลได้ โปรไฟล์ที่กำลังคูลดาวน์
    สำหรับโมเดลหนึ่งยังอาจใช้งานได้กับโมเดลพี่น้องบนผู้ให้บริการเดียวกัน
    ขณะที่หน้าต่างการเรียกเก็บเงิน/ปิดใช้งานยังคงบล็อกทั้งโปรไฟล์

    คุณยังสามารถตั้งค่าการแทนที่ลำดับ **ต่อเอเจนต์** (จัดเก็บใน `auth-state.json` ของเอเจนต์นั้น) ผ่าน CLI ได้:

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

    หากต้องการกำหนดเป้าหมายเอเจนต์เฉพาะ:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    หากต้องการตรวจสอบว่าสุดท้ายแล้วจะลองใช้อะไรจริง ๆ ให้ใช้:

    ```bash
    openclaw models status --probe
    ```

    หากโปรไฟล์ที่จัดเก็บไว้ถูกละเว้นจากลำดับที่ระบุชัดเจน probe จะรายงาน
    `excluded_by_auth_order` สำหรับโปรไฟล์นั้น แทนที่จะลองใช้อย่างเงียบ ๆ

  </Accordion>

  <Accordion title="OAuth vs API key - what is the difference?">
    OpenClaw รองรับทั้งสองแบบ:

    - **OAuth** มักใช้ประโยชน์จากการเข้าถึงแบบสมัครสมาชิก (เมื่อใช้ได้)
    - **API keys** ใช้การเรียกเก็บเงินตามโทเค็นที่ใช้

    ตัวช่วยตั้งค่ารองรับ Anthropic Claude CLI, OpenAI Codex OAuth และ API keys อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [FAQ](/th/help/faq) — FAQ หลัก
- [FAQ — การเริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก](/th/help/faq-first-run)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [การสลับโมเดลเมื่อขัดข้อง](/th/concepts/model-failover)
