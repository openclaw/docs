---
read_when:
    - การเลือกหรือสลับโมเดล การกำหนดค่านามแฝง
    - การดีบักการสลับโมเดลเมื่อขัดข้อง / "โมเดลทั้งหมดล้มเหลว"
    - ทำความเข้าใจโปรไฟล์การยืนยันตัวตนและวิธีจัดการโปรไฟล์เหล่านั้น
sidebarTitle: Models FAQ
summary: 'คำถามที่พบบ่อย: ค่าเริ่มต้นของโมเดล การเลือก นามแฝง การสลับ เฟลโอเวอร์ และโปรไฟล์การยืนยันตัวตน'
title: 'คำถามที่พบบ่อย: โมเดลและการยืนยันตัวตน'
x-i18n:
    generated_at: "2026-04-30T09:57:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: eaa72bf66d3f1528f95762e2a2763bc2f6bfddbc1d4c24a9ec2df7f943ebc14b
    source_path: help/faq-models.md
    workflow: 16
---

  คำถามและคำตอบเกี่ยวกับโมเดลและโปรไฟล์การยืนยันตัวตน สำหรับการตั้งค่า เซสชัน Gateway ช่องทาง และการแก้ไขปัญหา โปรดดู [FAQ](/th/help/faq) หลัก

  ## โมเดล: ค่าเริ่มต้น การเลือก alias และการสลับ

  <AccordionGroup>
  <Accordion title='“โมเดลเริ่มต้น” คืออะไร?'>
    โมเดลเริ่มต้นของ OpenClaw คือสิ่งที่คุณตั้งค่าไว้เป็น:

    ```
    agents.defaults.model.primary
    ```

    โมเดลอ้างอิงในรูปแบบ `provider/model` (ตัวอย่าง: `openai/gpt-5.5` หรือ `openai-codex/gpt-5.5`) หากคุณละเว้น provider, OpenClaw จะลองใช้ alias ก่อน จากนั้นจึงลองจับคู่กับ configured-provider ที่ไม่ซ้ำสำหรับ model id นั้นแบบตรงกันทุกประการ และท้ายที่สุดจึง fallback ไปยัง provider เริ่มต้นที่กำหนดค่าไว้ในฐานะเส้นทางความเข้ากันได้ที่เลิกแนะนำแล้ว หาก provider นั้นไม่เปิดเผยโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะ fallback ไปยัง provider/model แรกที่กำหนดค่าไว้แทนการแสดงค่าเริ่มต้นของ provider ที่ถูกนำออกไปแล้วซึ่งล้าสมัย คุณยังควรตั้งค่า `provider/model` อย่าง**ชัดเจน**

  </Accordion>

  <Accordion title="คุณแนะนำโมเดลใด?">
    **ค่าเริ่มต้นที่แนะนำ:** ใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดที่มีในชุด provider ของคุณ
    **สำหรับ agent ที่เปิดใช้เครื่องมือหรือรับอินพุตที่ไม่น่าเชื่อถือ:** ให้ความสำคัญกับความสามารถของโมเดลมากกว่าต้นทุน
    **สำหรับแชตงานทั่วไป/ความเสี่ยงต่ำ:** ใช้โมเดล fallback ที่ถูกกว่าและกำหนดเส้นทางตามบทบาทของ agent

    MiniMax มีเอกสารของตนเอง: [MiniMax](/th/providers/minimax) และ
    [โมเดลภายในเครื่อง](/th/gateway/local-models)

    หลักทั่วไป: ใช้**โมเดลที่ดีที่สุดที่คุณจ่ายไหว**สำหรับงานที่มีความเสี่ยงสูง และใช้โมเดลที่ถูกกว่า
    สำหรับแชตหรืองานสรุปทั่วไป คุณสามารถกำหนดเส้นทางโมเดลแยกตาม agent และใช้ sub-agent เพื่อ
    ทำงานยาวแบบขนานได้ (sub-agent แต่ละตัวใช้โทเค็น) ดู [โมเดล](/th/concepts/models) และ
    [Sub-agents](/th/tools/subagents)

    คำเตือนสำคัญ: โมเดลที่อ่อนกว่าหรือถูก quantize มากเกินไปมีความเสี่ยงต่อ prompt
    injection และพฤติกรรมที่ไม่ปลอดภัยมากกว่า ดู [ความปลอดภัย](/th/gateway/security)

    บริบทเพิ่มเติม: [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันจะสลับโมเดลโดยไม่ล้าง config ได้อย่างไร?">
    ใช้**คำสั่งโมเดล**หรือแก้ไขเฉพาะฟิลด์ **model** หลีกเลี่ยงการแทนที่ config ทั้งหมด

    ตัวเลือกที่ปลอดภัย:

    - `/model` ในแชต (รวดเร็ว รายเซสชัน)
    - `openclaw models set ...` (อัปเดตเฉพาะ config ของโมเดล)
    - `openclaw configure --section model` (แบบโต้ตอบ)
    - แก้ไข `agents.defaults.model` ใน `~/.openclaw/openclaw.json`

    หลีกเลี่ยง `config.apply` กับอ็อบเจ็กต์บางส่วน เว้นแต่คุณตั้งใจจะแทนที่ config ทั้งหมด
    สำหรับการแก้ไขผ่าน RPC ให้ตรวจสอบด้วย `config.schema.lookup` ก่อน และควรใช้ `config.patch` payload ของ lookup จะให้ path ที่ normalize แล้ว เอกสาร/ข้อจำกัดของ schema แบบตื้น และสรุปของ child ระดับถัดไป
    สำหรับการอัปเดตบางส่วน
    หากคุณเขียนทับ config ไปแล้ว ให้กู้คืนจากข้อมูลสำรองหรือรัน `openclaw doctor` อีกครั้งเพื่อซ่อมแซม

    เอกสาร: [โมเดล](/th/concepts/models), [กำหนดค่า](/th/cli/configure), [Config](/th/cli/config), [Doctor](/th/gateway/doctor)

  </Accordion>

  <Accordion title="ฉันใช้โมเดล self-hosted (llama.cpp, vLLM, Ollama) ได้ไหม?">
    ได้ Ollama เป็นเส้นทางที่ง่ายที่สุดสำหรับโมเดลภายในเครื่อง

    การตั้งค่าที่เร็วที่สุด:

    1. ติดตั้ง Ollama จาก `https://ollama.com/download`
    2. Pull โมเดลภายในเครื่อง เช่น `ollama pull gemma4`
    3. หากคุณต้องการโมเดลบนคลาวด์ด้วย ให้รัน `ollama signin`
    4. รัน `openclaw onboard` แล้วเลือก `Ollama`
    5. เลือก `Local` หรือ `Cloud + Local`

    หมายเหตุ:

    - `Cloud + Local` ให้คุณใช้ทั้งโมเดลบนคลาวด์และโมเดล Ollama ภายในเครื่องของคุณ
    - โมเดลบนคลาวด์ เช่น `kimi-k2.5:cloud` ไม่ต้อง pull ภายในเครื่อง
    - สำหรับการสลับด้วยตนเอง ให้ใช้ `openclaw models list` และ `openclaw models set ollama/<model>`

    หมายเหตุด้านความปลอดภัย: โมเดลที่เล็กกว่าหรือถูก quantize หนักมากมีความเสี่ยงต่อ prompt
    injection มากกว่า เราแนะนำอย่างยิ่งให้ใช้**โมเดลขนาดใหญ่**สำหรับ bot ใด ๆ ที่สามารถใช้เครื่องมือได้
    หากคุณยังต้องการใช้โมเดลขนาดเล็ก ให้เปิดใช้ sandboxing และ allowlist เครื่องมือที่เข้มงวด

    เอกสาร: [Ollama](/th/providers/ollama), [โมเดลภายในเครื่อง](/th/gateway/local-models),
    [Model providers](/th/concepts/model-providers), [ความปลอดภัย](/th/gateway/security),
    [Sandboxing](/th/gateway/sandboxing)

  </Accordion>

  <Accordion title="OpenClaw, Flawd และ Krill ใช้โมเดลอะไร?">
    - deployment เหล่านี้อาจแตกต่างกันและอาจเปลี่ยนไปตามเวลา ไม่มีคำแนะนำ provider ที่ตายตัว
    - ตรวจสอบการตั้งค่า runtime ปัจจุบันบนแต่ละ gateway ด้วย `openclaw models status`
    - สำหรับ agent ที่อ่อนไหวด้านความปลอดภัย/เปิดใช้เครื่องมือ ให้ใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดที่มี

  </Accordion>

  <Accordion title="ฉันจะสลับโมเดลทันที (โดยไม่รีสตาร์ต) ได้อย่างไร?">
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

    เหล่านี้คือ alias ในตัว สามารถเพิ่ม alias ที่กำหนดเองผ่าน `agents.defaults.models` ได้

    คุณสามารถแสดงรายการโมเดลที่มีด้วย `/model`, `/model list` หรือ `/model status`

    `/model` (และ `/model list`) แสดงตัวเลือกแบบกะทัดรัดพร้อมหมายเลข เลือกด้วยหมายเลข:

    ```
    /model 3
    ```

    คุณยังสามารถบังคับใช้โปรไฟล์การยืนยันตัวตนเฉพาะสำหรับ provider ได้ (รายเซสชัน):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    เคล็ดลับ: `/model status` แสดงว่า agent ใด active อยู่ ไฟล์ `auth-profiles.json` ใดที่ถูกใช้ และโปรไฟล์การยืนยันตัวตนใดจะถูกลองถัดไป
    นอกจากนี้ยังแสดง endpoint ของ provider ที่กำหนดค่าไว้ (`baseUrl`) และโหมด API (`api`) เมื่อมีให้ใช้

    **ฉันจะยกเลิกการปักหมุดโปรไฟล์ที่ตั้งด้วย @profile ได้อย่างไร?**

    รัน `/model` อีกครั้ง**โดยไม่มี** suffix `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    หากคุณต้องการกลับไปใช้ค่าเริ่มต้น ให้เลือกจาก `/model` (หรือส่ง `/model <default provider/model>`)
    ใช้ `/model status` เพื่อยืนยันว่าโปรไฟล์การยืนยันตัวตนใด active อยู่

  </Accordion>

  <Accordion title="ฉันใช้ GPT 5.5 สำหรับงานประจำวัน และ Codex 5.5 สำหรับเขียนโค้ดได้ไหม?">
    ได้ ตั้งค่าหนึ่งตัวเป็นค่าเริ่มต้นและสลับเมื่อจำเป็น:

    - **สลับอย่างรวดเร็ว (รายเซสชัน):** `/model openai/gpt-5.5` สำหรับงาน API key ของ OpenAI โดยตรงในเซสชันปัจจุบัน หรือ `/model openai-codex/gpt-5.5` สำหรับงาน GPT-5.5 Codex OAuth
    - **ค่าเริ่มต้น:** ตั้ง `agents.defaults.model.primary` เป็น `openai/gpt-5.5` สำหรับการใช้งาน API key หรือ `openai-codex/gpt-5.5` สำหรับการใช้งาน GPT-5.5 Codex OAuth
    - **Sub-agents:** กำหนดเส้นทางงานเขียนโค้ดไปยัง sub-agent ที่มีโมเดลเริ่มต้นต่างกัน

    ดู [โมเดล](/th/concepts/models) และ [Slash commands](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="ฉันจะกำหนดค่า fast mode สำหรับ GPT 5.5 ได้อย่างไร?">
    ใช้ toggle รายเซสชันหรือค่าเริ่มต้นใน config:

    - **รายเซสชัน:** ส่ง `/fast on` ขณะที่เซสชันใช้ `openai/gpt-5.5` หรือ `openai-codex/gpt-5.5`
    - **ค่าเริ่มต้นรายโมเดล:** ตั้ง `agents.defaults.models["openai/gpt-5.5"].params.fastMode` หรือ `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` เป็น `true`

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

    สำหรับ OpenAI, fast mode จะแมปไปที่ `service_tier = "priority"` บนคำขอ Responses แบบ native ที่รองรับ ค่า override ของเซสชัน `/fast` มีลำดับความสำคัญเหนือค่าเริ่มต้นใน config

    ดู [Thinking และ fast mode](/th/tools/thinking) และ [OpenAI fast mode](/th/providers/openai#fast-mode)

  </Accordion>

  <Accordion title='ทำไมฉันเห็น “Model ... is not allowed” แล้วไม่มีคำตอบ?'>
    หากตั้งค่า `agents.defaults.models` ไว้ ค่านั้นจะกลายเป็น**allowlist** สำหรับ `/model` และการ override
    ใด ๆ ในเซสชัน การเลือกโมเดลที่ไม่ได้อยู่ในรายการนั้นจะส่งคืน:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    ข้อผิดพลาดนั้นจะถูกส่งคืน**แทน**คำตอบปกติ วิธีแก้: เพิ่มโมเดลใน
    `agents.defaults.models`, นำ allowlist ออก หรือเลือกโมเดลจาก `/model list`

  </Accordion>

  <Accordion title='ทำไมฉันเห็น “Unknown model: minimax/MiniMax-M2.7”?'>
    ข้อความนี้หมายความว่า **provider ยังไม่ได้กำหนดค่า** (ไม่พบ config หรือโปรไฟล์การยืนยันตัวตน
    ของ MiniMax provider) ดังนั้นจึง resolve โมเดลไม่ได้

    checklist สำหรับแก้ไข:

    1. อัปเกรดเป็น OpenClaw release ปัจจุบัน (หรือรันจาก source `main`) จากนั้นรีสตาร์ต gateway
    2. ตรวจสอบให้แน่ใจว่า MiniMax ได้รับการกำหนดค่าแล้ว (wizard หรือ JSON) หรือมี auth ของ MiniMax
       อยู่ใน env/auth profiles เพื่อให้ provider ที่ตรงกันถูก inject ได้
       (`MINIMAX_API_KEY` สำหรับ `minimax`, `MINIMAX_OAUTH_TOKEN` หรือ MiniMax
       OAuth ที่จัดเก็บไว้สำหรับ `minimax-portal`)
    3. ใช้ model id ที่ถูกต้องแบบตรงทุกตัวพิมพ์ใหญ่เล็ก (case-sensitive) สำหรับเส้นทาง auth ของคุณ:
       `minimax/MiniMax-M2.7` หรือ `minimax/MiniMax-M2.7-highspeed` สำหรับการตั้งค่า
       API key หรือ `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` สำหรับการตั้งค่า OAuth
    4. รัน:

       ```bash
       openclaw models list
       ```

       แล้วเลือกจากรายการ (หรือ `/model list` ในแชต)

    ดู [MiniMax](/th/providers/minimax) และ [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันใช้ MiniMax เป็นค่าเริ่มต้นและใช้ OpenAI สำหรับงานซับซ้อนได้ไหม?">
    ได้ ใช้ **MiniMax เป็นค่าเริ่มต้น** และสลับโมเดล**รายเซสชัน**เมื่อจำเป็น
    fallback มีไว้สำหรับ**ข้อผิดพลาด** ไม่ใช่ “งานยาก” ดังนั้นให้ใช้ `/model` หรือ agent แยกต่างหาก

    **ตัวเลือก A: สลับรายเซสชัน**

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
    - กำหนดเส้นทางตาม agent หรือใช้ `/agent` เพื่อสลับ

    เอกสาร: [โมเดล](/th/concepts/models), [Multi-Agent Routing](/th/concepts/multi-agent), [MiniMax](/th/providers/minimax), [OpenAI](/th/providers/openai)

  </Accordion>

  <Accordion title="opus / sonnet / gpt เป็น shortcut ในตัวหรือไม่?">
    ใช่ OpenClaw มาพร้อม shorthand เริ่มต้นบางรายการ (ใช้เฉพาะเมื่อมีโมเดลอยู่ใน `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` สำหรับการตั้งค่า API key หรือ `openai-codex/gpt-5.5` เมื่อกำหนดค่าสำหรับ Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    หากคุณตั้ง alias ของคุณเองด้วยชื่อเดียวกัน ค่าของคุณจะมีผลเหนือกว่า

  </Accordion>

  <Accordion title="ฉันจะกำหนด/override shortcut ของโมเดล (alias) ได้อย่างไร?">
    alias มาจาก `agents.defaults.models.<modelId>.alias` ตัวอย่าง:

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

    จากนั้น `/model sonnet` (หรือ `/<alias>` เมื่อรองรับ) จะ resolve เป็น model ID นั้น

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

    หากคุณอ้างอิงผู้ให้บริการ/โมเดล แต่คีย์ผู้ให้บริการที่จำเป็นขาดหายไป คุณจะได้รับข้อผิดพลาดการยืนยันตัวตนขณะรันไทม์ (เช่น `No API key found for provider "zai"`)

    **ไม่พบคีย์ API สำหรับผู้ให้บริการหลังจากเพิ่มเอเจนต์ใหม่**

    โดยปกติหมายความว่า **เอเจนต์ใหม่** มีคลังการยืนยันตัวตนว่างเปล่า การยืนยันตัวตนแยกตามเอเจนต์และ
    ถูกจัดเก็บไว้ใน:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    ตัวเลือกการแก้ไข:

    - เรียกใช้ `openclaw agents add <id>` และกำหนดค่าการยืนยันตัวตนระหว่างตัวช่วยตั้งค่า
    - หรือคัดลอกเฉพาะโปรไฟล์ `api_key` / `token` แบบคงที่ที่ย้ายได้จากคลังการยืนยันตัวตนของเอเจนต์หลักไปยังคลังการยืนยันตัวตนของเอเจนต์ใหม่
    - สำหรับโปรไฟล์ OAuth ให้ลงชื่อเข้าใช้จากเอเจนต์ใหม่เมื่อเอเจนต์นั้นต้องใช้บัญชีของตัวเอง มิฉะนั้น OpenClaw สามารถอ่านผ่านไปยังเอเจนต์เริ่มต้น/หลักได้โดยไม่ต้องโคลนโทเค็นรีเฟรช

    อย่าใช้ `agentDir` ซ้ำข้ามเอเจนต์ เพราะจะทำให้การยืนยันตัวตน/เซสชันชนกัน

  </Accordion>
</AccordionGroup>

## การสลับไปใช้โมเดลสำรองและ "โมเดลทั้งหมดล้มเหลว"

<AccordionGroup>
  <Accordion title="การสลับไปใช้สำรองทำงานอย่างไร?">
    การสลับไปใช้สำรองเกิดขึ้นในสองขั้นตอน:

    1. **การหมุนเวียนโปรไฟล์การยืนยันตัวตน** ภายในผู้ให้บริการเดียวกัน
    2. **การย้อนกลับไปใช้โมเดลสำรอง** ไปยังโมเดลถัดไปใน `agents.defaults.model.fallbacks`

    คูลดาวน์จะมีผลกับโปรไฟล์ที่ล้มเหลว (backoff แบบเอ็กซ์โพเนนเชียล) ดังนั้น OpenClaw จึงยังตอบสนองต่อไปได้แม้ผู้ให้บริการถูกจำกัดอัตราหรือล้มเหลวชั่วคราว

    บักเก็ตการจำกัดอัตราครอบคลุมมากกว่าการตอบกลับ `429` ธรรมดา OpenClaw
    ยังถือว่าข้อความอย่าง `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` และข้อจำกัด
    หน้าต่างการใช้งานเป็นระยะ (`weekly/monthly limit reached`) เป็นการจำกัดอัตรา
    ที่สมควรสลับไปใช้สำรอง

    การตอบกลับบางรายการที่ดูเหมือนการเรียกเก็บเงินไม่ใช่ `402` และการตอบกลับ HTTP `402`
    บางรายการก็ยังคงอยู่ในบักเก็ตชั่วคราวนั้น หากผู้ให้บริการส่งคืน
    ข้อความการเรียกเก็บเงินอย่างชัดเจนบน `401` หรือ `403` OpenClaw ยังสามารถเก็บไว้
    ในช่องทางการเรียกเก็บเงินได้ แต่ตัวจับคู่ข้อความเฉพาะผู้ให้บริการจะยังจำกัดอยู่กับ
    ผู้ให้บริการที่เป็นเจ้าของเท่านั้น (เช่น OpenRouter `Key limit exceeded`) หากข้อความ `402`
    ดูเหมือนหน้าต่างการใช้งานที่ลองใหม่ได้หรือ
    ขีดจำกัดค่าใช้จ่ายขององค์กร/เวิร์กสเปซ (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) OpenClaw จะถือว่าเป็น
    `rate_limit` ไม่ใช่การปิดใช้งานระยะยาวจากการเรียกเก็บเงิน

    ข้อผิดพลาดบริบทล้นจะแตกต่างออกไป: ลายเซ็นอย่าง
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` หรือ `ollama error: context length
    exceeded` จะยังอยู่บนเส้นทาง Compaction/ลองใหม่ แทนที่จะเดินหน้าไปยังการ
    ย้อนกลับไปใช้โมเดลสำรอง

    ข้อความข้อผิดพลาดเซิร์ฟเวอร์ทั่วไปถูกจำกัดให้แคบกว่า "อะไรก็ตามที่มี
    unknown/error อยู่ในนั้น" โดยตั้งใจ OpenClaw ถือว่ารูปแบบชั่วคราวที่จำกัดตามผู้ให้บริการ
    เช่น Anthropic แบบเปล่า `An unknown error occurred`, OpenRouter แบบเปล่า
    `Provider returned error`, ข้อผิดพลาดเหตุผลการหยุดอย่าง `Unhandled stop reason:
    error`, เพย์โหลด JSON `api_error` ที่มีข้อความเซิร์ฟเวอร์ชั่วคราว
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) และข้อผิดพลาดผู้ให้บริการไม่ว่าง เช่น `ModelNotReadyException` เป็นสัญญาณ
    หมดเวลา/โหลดเกินที่สมควรสลับไปใช้สำรองเมื่อบริบทผู้ให้บริการตรงกัน
    ข้อความย้อนกลับภายในทั่วไป เช่น `LLM request failed with an unknown
    error.` จะยังคงใช้แนวทางระมัดระวังและไม่ทริกเกอร์การย้อนกลับไปใช้โมเดลสำรองด้วยตัวเอง

  </Accordion>

  <Accordion title='ข้อความ "No credentials found for profile anthropic:default" หมายความว่าอย่างไร?'>
    หมายความว่าระบบพยายามใช้ ID โปรไฟล์การยืนยันตัวตน `anthropic:default` แต่ไม่พบข้อมูลรับรองสำหรับโปรไฟล์นั้นในคลังการยืนยันตัวตนที่คาดไว้

    **รายการตรวจสอบการแก้ไข:**

    - **ยืนยันว่าโปรไฟล์การยืนยันตัวตนอยู่ที่ใด** (พาธใหม่เทียบกับพาธเดิม)
      - ปัจจุบัน: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - เดิม: `~/.openclaw/agent/*` (ย้ายโดย `openclaw doctor`)
    - **ยืนยันว่า env var ของคุณถูกโหลดโดย Gateway**
      - หากคุณตั้งค่า `ANTHROPIC_API_KEY` ในเชลล์ของคุณ แต่รัน Gateway ผ่าน systemd/launchd อาจไม่สืบทอดค่านั้น ให้ใส่ไว้ใน `~/.openclaw/.env` หรือเปิดใช้ `env.shellEnv`
    - **ตรวจสอบให้แน่ใจว่าคุณกำลังแก้ไขเอเจนต์ที่ถูกต้อง**
      - การตั้งค่าแบบหลายเอเจนต์หมายความว่าอาจมีไฟล์ `auth-profiles.json` หลายไฟล์
    - **ตรวจสอบสถานะโมเดล/การยืนยันตัวตนแบบคร่าว ๆ**
      - ใช้ `openclaw models status` เพื่อดูโมเดลที่กำหนดค่าไว้และดูว่าผู้ให้บริการได้รับการยืนยันตัวตนแล้วหรือไม่

    **รายการตรวจสอบการแก้ไขสำหรับ "No credentials found for profile anthropic"**

    หมายความว่าการรันถูกตรึงไว้กับโปรไฟล์การยืนยันตัวตน Anthropic แต่ Gateway
    ไม่พบโปรไฟล์นั้นในคลังการยืนยันตัวตนของตน

    - **ใช้ Claude CLI**
      - เรียกใช้ `openclaw models auth login --provider anthropic --method cli --set-default` บนโฮสต์ Gateway
    - **หากคุณต้องการใช้คีย์ API แทน**
      - ใส่ `ANTHROPIC_API_KEY` ใน `~/.openclaw/.env` บน **โฮสต์ Gateway**
      - ล้างลำดับที่ตรึงไว้ซึ่งบังคับใช้โปรไฟล์ที่ขาดหายไป:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **ยืนยันว่าคุณกำลังรันคำสั่งบนโฮสต์ Gateway**
      - ในโหมดระยะไกล โปรไฟล์การยืนยันตัวตนอยู่บนเครื่อง Gateway ไม่ใช่แล็ปท็อปของคุณ

  </Accordion>

  <Accordion title="ทำไมจึงลอง Google Gemini แล้วล้มเหลวด้วย?">
    หากการกำหนดค่าโมเดลของคุณมี Google Gemini เป็นตัวสำรอง (หรือคุณเปลี่ยนไปใช้ชวเลข Gemini) OpenClaw จะลองใช้ระหว่างการย้อนกลับไปใช้โมเดลสำรอง หากคุณยังไม่ได้กำหนดค่าข้อมูลรับรอง Google คุณจะเห็น `No API key found for provider "google"`

    การแก้ไข: ให้ระบุการยืนยันตัวตน Google หรือเอา/หลีกเลี่ยงโมเดล Google ใน `agents.defaults.model.fallbacks` / นามแฝง เพื่อไม่ให้การย้อนกลับไปใช้สำรองส่งเส้นทางไปที่นั่น

    **คำขอ LLM ถูกปฏิเสธ: ต้องมีลายเซ็น thinking (Google Antigravity)**

    สาเหตุ: ประวัติเซสชันมี **บล็อก thinking ที่ไม่มีลายเซ็น** (มักมาจาก
    สตรีมที่ถูกยกเลิก/บางส่วน) Google Antigravity ต้องใช้ลายเซ็นสำหรับบล็อก thinking

    การแก้ไข: ตอนนี้ OpenClaw จะตัดบล็อก thinking ที่ไม่มีลายเซ็นออกสำหรับ Google Antigravity Claude หากยังปรากฏอยู่ ให้เริ่ม **เซสชันใหม่** หรือตั้งค่า `/thinking off` สำหรับเอเจนต์นั้น

  </Accordion>
</AccordionGroup>

## โปรไฟล์การยืนยันตัวตน: คืออะไรและจัดการอย่างไร

ที่เกี่ยวข้อง: [/concepts/oauth](/th/concepts/oauth) (โฟลว์ OAuth, การจัดเก็บโทเค็น, รูปแบบหลายบัญชี)

<AccordionGroup>
  <Accordion title="โปรไฟล์การยืนยันตัวตนคืออะไร?">
    โปรไฟล์การยืนยันตัวตนคือระเบียนข้อมูลรับรองที่มีชื่อ (OAuth หรือคีย์ API) ซึ่งผูกกับผู้ให้บริการ โปรไฟล์อยู่ใน:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="ID โปรไฟล์ทั่วไปมีอะไรบ้าง?">
    OpenClaw ใช้ ID ที่นำหน้าด้วยผู้ให้บริการ เช่น:

    - `anthropic:default` (พบได้บ่อยเมื่อไม่มีตัวตนอีเมล)
    - `anthropic:<email>` สำหรับตัวตน OAuth
    - ID แบบกำหนดเองที่คุณเลือก (เช่น `anthropic:work`)

  </Accordion>

  <Accordion title="ฉันควบคุมได้ไหมว่าจะลองโปรไฟล์การยืนยันตัวตนใดก่อน?">
    ได้ การกำหนดค่ารองรับเมตาดาต้าเสริมสำหรับโปรไฟล์และการจัดลำดับต่อผู้ให้บริการ (`auth.order.<provider>`) สิ่งนี้ **ไม่** จัดเก็บความลับ แต่แมป ID ไปยังผู้ให้บริการ/โหมด และตั้งค่าลำดับการหมุนเวียน

    OpenClaw อาจข้ามโปรไฟล์ชั่วคราวหากอยู่ใน **คูลดาวน์** ระยะสั้น (การจำกัดอัตรา/หมดเวลา/การยืนยันตัวตนล้มเหลว) หรือสถานะ **ปิดใช้งาน** ที่นานกว่า (การเรียกเก็บเงิน/เครดิตไม่เพียงพอ) หากต้องการตรวจสอบ ให้รัน `openclaw models status --json` และตรวจสอบ `auth.unusableProfiles` การปรับแต่ง: `auth.cooldowns.billingBackoffHours*`

    คูลดาวน์การจำกัดอัตราสามารถจำกัดตามโมเดลได้ โปรไฟล์ที่กำลังคูลดาวน์
    สำหรับโมเดลหนึ่งอาจยังใช้งานได้กับโมเดลพี่น้องบนผู้ให้บริการเดียวกัน
    ขณะที่ช่วงการเรียกเก็บเงิน/ปิดใช้งานยังคงบล็อกทั้งโปรไฟล์

    คุณยังสามารถตั้งค่าการแทนที่ลำดับ **ต่อเอเจนต์** (จัดเก็บใน `auth-state.json` ของเอเจนต์นั้น) ผ่าน CLI:

    ```bash
    # ค่าเริ่มต้นคือเอเจนต์เริ่มต้นที่กำหนดค่าไว้ (ละ --agent)
    openclaw models auth order get --provider anthropic

    # ล็อกการหมุนเวียนไว้ที่โปรไฟล์เดียว (ลองเฉพาะโปรไฟล์นี้)
    openclaw models auth order set --provider anthropic anthropic:default

    # หรือตั้งค่าลำดับชัดเจน (สำรองภายในผู้ให้บริการ)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # ล้างการแทนที่ (ย้อนกลับไปใช้ config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    หากต้องการกำหนดเป้าหมายเอเจนต์เฉพาะ:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    หากต้องการตรวจสอบว่าสิ่งใดจะถูกลองจริง ให้ใช้:

    ```bash
    openclaw models status --probe
    ```

    หากโปรไฟล์ที่จัดเก็บไว้ถูกละไว้จากลำดับชัดเจน probe จะรายงาน
    `excluded_by_auth_order` สำหรับโปรไฟล์นั้นแทนที่จะลองแบบเงียบ ๆ

  </Accordion>

  <Accordion title="OAuth กับคีย์ API แตกต่างกันอย่างไร?">
    OpenClaw รองรับทั้งสองแบบ:

    - **OAuth** มักใช้สิทธิ์การเข้าถึงจากการสมัครสมาชิก (เมื่อใช้ได้)
    - **คีย์ API** ใช้การเรียกเก็บเงินตามโทเค็นที่ใช้

    ตัวช่วยตั้งค่ารองรับ Anthropic Claude CLI, OpenAI Codex OAuth และคีย์ API อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [คำถามที่พบบ่อย](/th/help/faq) — คำถามที่พบบ่อยหลัก
- [คำถามที่พบบ่อย — การเริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก](/th/help/faq-first-run)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [การสลับไปใช้โมเดลสำรอง](/th/concepts/model-failover)
