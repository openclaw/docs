---
read_when:
    - การเลือกหรือสลับโมเดล และการกำหนดค่าชื่อแทน
    - การดีบักการสลับไปใช้โมเดลสำรอง / "โมเดลทั้งหมดล้มเหลว"
    - ทำความเข้าใจโปรไฟล์การยืนยันตัวตนและวิธีจัดการ
sidebarTitle: Models FAQ
summary: 'คำถามที่พบบ่อย: ค่าเริ่มต้นของโมเดล การเลือก ชื่อแทน การสลับ การสลับสำรองเมื่อเกิดข้อขัดข้อง และโปรไฟล์การยืนยันตัวตน'
title: 'คำถามที่พบบ่อย: โมเดลและการยืนยันตัวตน'
x-i18n:
    generated_at: "2026-05-06T09:16:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8f6d367cf22b9035f75ffcfa641008a015d78b727c4b3d67730fd5286520fb4
    source_path: help/faq-models.md
    workflow: 16
---

  ถาม-ตอบเกี่ยวกับโมเดลและโปรไฟล์ยืนยันตัวตน สำหรับการตั้งค่า เซสชัน Gateway ช่องทาง และ
  การแก้ปัญหา โปรดดู [FAQ](/th/help/faq) หลัก

  ## โมเดล: ค่าเริ่มต้น การเลือก alias และการสลับ

  <AccordionGroup>
  <Accordion title='“โมเดลเริ่มต้น” คืออะไร?'>
    โมเดลเริ่มต้นของ OpenClaw คือค่าที่คุณตั้งไว้เป็น:

    ```
    agents.defaults.model.primary
    ```

    โมเดลจะอ้างอิงในรูปแบบ `provider/model` (ตัวอย่าง: `openai/gpt-5.5` หรือ `openai-codex/gpt-5.5`) หากคุณละเว้น provider, OpenClaw จะลอง alias ก่อน จากนั้นจึงลองจับคู่ configured-provider ที่ไม่ซ้ำสำหรับ model id นั้นแบบตรงตัว และท้ายที่สุดจึงถอยกลับไปใช้ provider เริ่มต้นที่กำหนดค่าไว้เป็นเส้นทางความเข้ากันได้แบบเลิกใช้แล้ว หาก provider นั้นไม่เปิดเผยโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะถอยกลับไปใช้ provider/model แรกที่กำหนดค่าไว้ แทนที่จะแสดงค่าเริ่มต้นของ provider ที่ถูกนำออกไปแล้วซึ่งล้าสมัย คุณยังควรตั้งค่า `provider/model` อย่าง **ชัดเจน**

  </Accordion>

  <Accordion title="คุณแนะนำโมเดลใด?">
    **ค่าเริ่มต้นที่แนะนำ:** ใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดซึ่งมีอยู่ในชุด provider ของคุณ
    **สำหรับ agent ที่เปิดใช้เครื่องมือหรือรับอินพุตที่ไม่น่าเชื่อถือ:** ให้ความสำคัญกับความแข็งแกร่งของโมเดลมากกว่าต้นทุน
    **สำหรับแชตทั่วไป/ความเสี่ยงต่ำ:** ใช้โมเดล fallback ที่ถูกกว่าและกำหนดเส้นทางตามบทบาทของ agent

    MiniMax มีเอกสารของตัวเอง: [MiniMax](/th/providers/minimax) และ
    [โมเดลภายในเครื่อง](/th/gateway/local-models)

    หลักทั่วไป: ใช้ **โมเดลที่ดีที่สุดที่คุณจ่ายไหว** สำหรับงานที่มีความเสี่ยงสูง และใช้โมเดลที่ถูกกว่า
    สำหรับแชตทั่วไปหรือสรุป คุณสามารถกำหนดเส้นทางโมเดลแยกตาม agent และใช้ sub-agent เพื่อ
    ทำงานยาว ๆ แบบขนานได้ (sub-agent แต่ละตัวใช้โทเค็น) ดู [โมเดล](/th/concepts/models) และ
    [Sub-agents](/th/tools/subagents)

    คำเตือนสำคัญ: โมเดลที่อ่อนกว่าหรือถูก quantize มากเกินไปมีความเสี่ยงต่อ prompt
    injection และพฤติกรรมที่ไม่ปลอดภัยมากกว่า ดู [ความปลอดภัย](/th/gateway/security)

    บริบทเพิ่มเติม: [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันจะสลับโมเดลโดยไม่ล้าง config ได้อย่างไร?">
    ใช้ **คำสั่งโมเดล** หรือแก้ไขเฉพาะฟิลด์ **model** หลีกเลี่ยงการแทนที่ config ทั้งชุด

    ตัวเลือกที่ปลอดภัย:

    - `/model` ในแชต (รวดเร็ว ต่อเซสชัน)
    - `openclaw models set ...` (อัปเดตเฉพาะ config ของโมเดล)
    - `openclaw configure --section model` (แบบโต้ตอบ)
    - แก้ไข `agents.defaults.model` ใน `~/.openclaw/openclaw.json`

    หลีกเลี่ยง `config.apply` กับออบเจ็กต์บางส่วน เว้นแต่คุณตั้งใจจะแทนที่ config ทั้งหมด
    สำหรับการแก้ไขผ่าน RPC ให้ตรวจสอบด้วย `config.schema.lookup` ก่อน และควรใช้ `config.patch` payload ของ lookup จะให้ path ที่ normalize แล้ว เอกสาร/ข้อจำกัดของ schema แบบตื้น และสรุป child โดยตรง
    สำหรับการอัปเดตบางส่วน
    หากคุณเขียนทับ config ไปแล้ว ให้กู้คืนจากข้อมูลสำรองหรือรัน `openclaw doctor` อีกครั้งเพื่อซ่อมแซม

    เอกสาร: [โมเดล](/th/concepts/models), [กำหนดค่า](/th/cli/configure), [Config](/th/cli/config), [Doctor](/th/gateway/doctor)

  </Accordion>

  <Accordion title="ฉันใช้โมเดลที่โฮสต์เองได้ไหม (llama.cpp, vLLM, Ollama)?">
    ได้ Ollama เป็นเส้นทางที่ง่ายที่สุดสำหรับโมเดลภายในเครื่อง

    การตั้งค่าที่เร็วที่สุด:

    1. ติดตั้ง Ollama จาก `https://ollama.com/download`
    2. ดึงโมเดลภายในเครื่อง เช่น `ollama pull gemma4`
    3. หากคุณต้องการโมเดลคลาวด์ด้วย ให้รัน `ollama signin`
    4. รัน `openclaw onboard` และเลือก `Ollama`
    5. เลือก `Local` หรือ `Cloud + Local`

    หมายเหตุ:

    - `Cloud + Local` ให้ทั้งโมเดลคลาวด์และโมเดล Ollama ภายในเครื่องของคุณ
    - โมเดลคลาวด์ เช่น `kimi-k2.5:cloud` ไม่ต้องดึงมาไว้ภายในเครื่อง
    - สำหรับการสลับด้วยตนเอง ให้ใช้ `openclaw models list` และ `openclaw models set ollama/<model>`

    หมายเหตุด้านความปลอดภัย: โมเดลขนาดเล็กหรือที่ถูก quantize หนักมีความเสี่ยงต่อ prompt
    injection มากกว่า เราแนะนำอย่างยิ่งให้ใช้ **โมเดลขนาดใหญ่** สำหรับ bot ใด ๆ ที่สามารถใช้เครื่องมือได้
    หากคุณยังต้องการใช้โมเดลขนาดเล็ก ให้เปิดใช้ sandboxing และ allowlist เครื่องมือที่เข้มงวด

    เอกสาร: [Ollama](/th/providers/ollama), [โมเดลภายในเครื่อง](/th/gateway/local-models),
    [Provider โมเดล](/th/concepts/model-providers), [ความปลอดภัย](/th/gateway/security),
    [Sandboxing](/th/gateway/sandboxing)

  </Accordion>

  <Accordion title="OpenClaw, Flawd และ Krill ใช้โมเดลใด?">
    - deployment เหล่านี้อาจแตกต่างกันและอาจเปลี่ยนแปลงตามเวลา ไม่มีคำแนะนำ provider แบบตายตัว
    - ตรวจสอบการตั้งค่า runtime ปัจจุบันบนแต่ละ gateway ด้วย `openclaw models status`
    - สำหรับ agent ที่ไวต่อความปลอดภัย/เปิดใช้เครื่องมือ ให้ใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดที่มีอยู่

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

    เหล่านี้คือ alias ในตัว สามารถเพิ่ม alias แบบกำหนดเองผ่าน `agents.defaults.models`

    คุณสามารถแสดงรายการโมเดลที่มีด้วย `/model`, `/model list` หรือ `/model status`

    `/model` (และ `/model list`) จะแสดงตัวเลือกแบบกระชับพร้อมหมายเลข เลือกด้วยหมายเลข:

    ```
    /model 3
    ```

    คุณยังสามารถบังคับใช้โปรไฟล์ยืนยันตัวตนเฉพาะสำหรับ provider ได้ (ต่อเซสชัน):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    เคล็ดลับ: `/model status` จะแสดงว่า agent ใดกำลังทำงานอยู่ ใช้ไฟล์ `auth-profiles.json` ใด และจะลองใช้โปรไฟล์ยืนยันตัวตนใดถัดไป
    นอกจากนี้ยังแสดง endpoint ของ provider ที่กำหนดค่าไว้ (`baseUrl`) และโหมด API (`api`) เมื่อมีข้อมูล

    **ฉันจะยกเลิกการปักหมุดโปรไฟล์ที่ตั้งด้วย @profile ได้อย่างไร?**

    รัน `/model` อีกครั้ง **โดยไม่มี** suffix `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    หากคุณต้องการกลับไปใช้ค่าเริ่มต้น ให้เลือกจาก `/model` (หรือส่ง `/model <default provider/model>`)
    ใช้ `/model status` เพื่อยืนยันว่าโปรไฟล์ยืนยันตัวตนใดทำงานอยู่

  </Accordion>

  <Accordion title="ฉันใช้ GPT 5.5 สำหรับงานประจำวันและ Codex 5.5 สำหรับการเขียนโค้ดได้ไหม?">
    ได้ ให้แยกการเลือกโมเดลออกจากการเลือก runtime:

    - **agent เขียนโค้ด Codex แบบ native:** ตั้ง `agents.defaults.model.primary` เป็น `openai/gpt-5.5` และ `agents.defaults.agentRuntime.id` เป็น `"codex"` ลงชื่อเข้าใช้ด้วย `openclaw models auth login --provider openai-codex` เมื่อคุณต้องการยืนยันตัวตนด้วย subscription ของ ChatGPT/Codex
    - **งาน Direct OpenAI API ผ่าน PI:** ใช้ `/model openai/gpt-5.5` โดยไม่มีการ override runtime ของ Codex และกำหนดค่า `OPENAI_API_KEY`
    - **Codex OAuth ผ่าน PI:** ใช้ `/model openai-codex/gpt-5.5` เฉพาะเมื่อคุณตั้งใจต้องการ runner PI ปกติพร้อม Codex OAuth
    - **Sub-agent:** กำหนดเส้นทางงานเขียนโค้ดไปยัง agent ที่ใช้ Codex เท่านั้น พร้อมโมเดลและค่าเริ่มต้น `agentRuntime` ของตัวเอง

    ดู [โมเดล](/th/concepts/models) และ [คำสั่ง slash](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="ฉันจะกำหนดค่า fast mode สำหรับ GPT 5.5 ได้อย่างไร?">
    ใช้ได้ทั้ง toggle ต่อเซสชันหรือค่าเริ่มต้นใน config:

    - **ต่อเซสชัน:** ส่ง `/fast on` ขณะที่เซสชันกำลังใช้ `openai/gpt-5.5` หรือ `openai-codex/gpt-5.5`
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

    สำหรับ OpenAI, fast mode จะ map ไปยัง `service_tier = "priority"` บนคำขอ Responses แบบ native ที่รองรับ การ override ด้วย `/fast` ของเซสชันมีลำดับความสำคัญเหนือค่าเริ่มต้นใน config

    ดู [Thinking และ fast mode](/th/tools/thinking) และ [OpenAI fast mode](/th/providers/openai#fast-mode)

  </Accordion>

  <Accordion title='ทำไมฉันเห็น "Model ... is not allowed" แล้วไม่มีคำตอบ?'>
    หากตั้งค่า `agents.defaults.models` ไว้ ค่านี้จะกลายเป็น **allowlist** สำหรับ `/model` และการ override ใด ๆ
    ของเซสชัน การเลือกโมเดลที่ไม่อยู่ในรายการนั้นจะคืนค่า:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    ข้อผิดพลาดนั้นจะถูกส่งกลับ **แทน** คำตอบปกติ วิธีแก้: เพิ่มโมเดลเข้าไปใน
    `agents.defaults.models`, นำ allowlist ออก หรือเลือกโมเดลจาก `/model list`
    หากคำสั่งมี `--runtime codex` ด้วย ให้เพิ่มโมเดลก่อน แล้วลองคำสั่ง
    `/model provider/model --runtime codex` เดิมอีกครั้ง

  </Accordion>

  <Accordion title='ทำไมฉันเห็น "Unknown model: minimax/MiniMax-M2.7"?'>
    หมายความว่า **ยังไม่ได้กำหนดค่า provider** (ไม่พบ config หรือโปรไฟล์ยืนยันตัวตนของ MiniMax
    provider) ดังนั้นจึง resolve โมเดลไม่ได้

    checklist สำหรับการแก้ไข:

    1. อัปเกรดเป็น OpenClaw รุ่นปัจจุบัน (หรือรันจาก source `main`) แล้วรีสตาร์ต gateway
    2. ตรวจสอบให้แน่ใจว่า MiniMax ถูกกำหนดค่าแล้ว (wizard หรือ JSON) หรือมีการยืนยันตัวตน MiniMax
       อยู่ใน env/auth profiles เพื่อให้สามารถ inject provider ที่ตรงกันได้
       (`MINIMAX_API_KEY` สำหรับ `minimax`, `MINIMAX_OAUTH_TOKEN` หรือ MiniMax
       OAuth ที่จัดเก็บไว้สำหรับ `minimax-portal`)
    3. ใช้ model id ที่ตรงตัว (คำนึงถึงตัวพิมพ์เล็กใหญ่) สำหรับเส้นทางยืนยันตัวตนของคุณ:
       `minimax/MiniMax-M2.7` หรือ `minimax/MiniMax-M2.7-highspeed` สำหรับการตั้งค่า
       ด้วย API-key หรือ `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` สำหรับการตั้งค่าด้วย OAuth
    4. รัน:

       ```bash
       openclaw models list
       ```

       แล้วเลือกจากรายการ (หรือ `/model list` ในแชต)

    ดู [MiniMax](/th/providers/minimax) และ [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันใช้ MiniMax เป็นค่าเริ่มต้นและ OpenAI สำหรับงานซับซ้อนได้ไหม?">
    ได้ ใช้ **MiniMax เป็นค่าเริ่มต้น** และสลับโมเดล **ต่อเซสชัน** เมื่อจำเป็น
    fallback ใช้สำหรับ **ข้อผิดพลาด** ไม่ใช่ "งานยาก" ดังนั้นให้ใช้ `/model` หรือ agent แยกต่างหาก

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

    เอกสาร: [โมเดล](/th/concepts/models), [การกำหนดเส้นทางแบบหลาย Agent](/th/concepts/multi-agent), [MiniMax](/th/providers/minimax), [OpenAI](/th/providers/openai)

  </Accordion>

  <Accordion title="opus / sonnet / gpt เป็น shortcut ในตัวหรือไม่?">
    ใช่ OpenClaw มาพร้อม shorthand เริ่มต้นบางรายการ (ใช้เฉพาะเมื่อโมเดลมีอยู่ใน `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` สำหรับการตั้งค่าด้วย API-key หรือ `openai-codex/gpt-5.5` เมื่อกำหนดค่าสำหรับ Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    หากคุณตั้ง alias ของตัวเองด้วยชื่อเดียวกัน ค่าของคุณจะมีผล

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
    OpenRouter (คิดเงินตาม token; มีหลายโมเดล):

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

    หากคุณอ้างอิง provider/model แต่ไม่มีคีย์ provider ที่จำเป็น คุณจะได้รับข้อผิดพลาดการยืนยันตัวตนขณะรันไทม์ (เช่น `No API key found for provider "zai"`)

    **ไม่พบคีย์ API สำหรับ provider หลังจากเพิ่ม agent ใหม่**

    โดยปกติหมายความว่า **agent ใหม่** มีที่เก็บข้อมูลยืนยันตัวตนว่างเปล่า การยืนยันตัวตนเป็นแบบแยกตาม agent และ
    จัดเก็บไว้ใน:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    ตัวเลือกการแก้ไข:

    - รัน `openclaw agents add <id>` และกำหนดค่าการยืนยันตัวตนระหว่างตัวช่วยตั้งค่า
    - หรือคัดลอกเฉพาะโปรไฟล์ `api_key` / `token` แบบ static ที่ย้ายข้ามได้จากที่เก็บข้อมูลยืนยันตัวตนของ agent หลักไปยังที่เก็บข้อมูลยืนยันตัวตนของ agent ใหม่
    - สำหรับโปรไฟล์ OAuth ให้ลงชื่อเข้าใช้จาก agent ใหม่เมื่อจำเป็นต้องใช้บัญชีของตัวเอง มิฉะนั้น OpenClaw สามารถอ่านผ่านไปยัง agent ค่าเริ่มต้น/หลักได้โดยไม่ต้องโคลน refresh token

    อย่าใช้ `agentDir` ซ้ำระหว่าง agent เพราะจะทำให้การยืนยันตัวตน/เซสชันชนกัน

  </Accordion>
</AccordionGroup>

## การสลับสำรองของโมเดลและ "โมเดลทั้งหมดล้มเหลว"

<AccordionGroup>
  <Accordion title="การสลับสำรองทำงานอย่างไร?">
    การสลับสำรองเกิดขึ้นเป็นสองขั้นตอน:

    1. **การหมุนเวียนโปรไฟล์ยืนยันตัวตน** ภายใน provider เดียวกัน
    2. **การถอยกลับของโมเดล** ไปยังโมเดลถัดไปใน `agents.defaults.model.fallbacks`

    Cooldown จะใช้กับโปรไฟล์ที่ล้มเหลว (exponential backoff) เพื่อให้ OpenClaw ยังตอบสนองได้แม้ provider ถูกจำกัดอัตราหรือขัดข้องชั่วคราว

    กลุ่มการจำกัดอัตราครอบคลุมมากกว่าการตอบกลับ `429` ธรรมดา OpenClaw
    ยังถือว่าข้อความอย่าง `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` และขีดจำกัด
    หน้าต่างการใช้งานเป็นรอบ (`weekly/monthly limit reached`) เป็นการจำกัดอัตรา
    ที่ควรสลับสำรอง

    การตอบกลับบางแบบที่ดูเหมือนเรื่องการเรียกเก็บเงินไม่ใช่ `402` และการตอบกลับ HTTP `402`
    บางรายการก็ยังคงอยู่ในกลุ่มชั่วคราวนั้น หาก provider ส่งคืนข้อความการเรียกเก็บเงิน
    ที่ชัดเจนบน `401` หรือ `403` OpenClaw ยังสามารถคงสิ่งนั้นไว้ใน
    เส้นทางการเรียกเก็บเงินได้ แต่ตัวจับคู่ข้อความเฉพาะ provider จะยังจำกัดขอบเขตอยู่กับ
    provider ที่เป็นเจ้าของเท่านั้น (ตัวอย่างเช่น OpenRouter `Key limit exceeded`) หากข้อความ `402`
    ดูเหมือนขีดจำกัดหน้าต่างการใช้งานที่ลองใหม่ได้ หรือ
    ขีดจำกัดค่าใช้จ่ายขององค์กร/พื้นที่ทำงาน (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) OpenClaw จะถือว่าเป็น
    `rate_limit` ไม่ใช่การปิดใช้งานด้านการเรียกเก็บเงินระยะยาว

    ข้อผิดพลาด context ล้นแตกต่างออกไป: รูปแบบอย่าง
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` หรือ `ollama error: context length
    exceeded` จะยังอยู่บนเส้นทาง Compaction/ลองใหม่ แทนที่จะเลื่อนไปยัง
    การถอยกลับของโมเดล

    ข้อความข้อผิดพลาดเซิร์ฟเวอร์ทั่วไปตั้งใจให้แคบกว่า "อะไรก็ตามที่มีคำว่า
    unknown/error อยู่ในนั้น" OpenClaw จะถือว่ารูปแบบชั่วคราวที่จำกัดตาม provider
    เช่น Anthropic แบบเปล่า `An unknown error occurred`, OpenRouter แบบเปล่า
    `Provider returned error`, ข้อผิดพลาด stop-reason เช่น `Unhandled stop reason:
    error`, เพย์โหลด JSON `api_error` ที่มีข้อความเซิร์ฟเวอร์ชั่วคราว
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) และข้อผิดพลาด provider ไม่พร้อม เช่น `ModelNotReadyException` เป็น
    สัญญาณ timeout/โหลดเกินที่ควรสลับสำรองเมื่อ context ของ provider
    ตรงกัน
    ข้อความ fallback ภายในทั่วไปอย่าง `LLM request failed with an unknown
    error.` จะยังคงระมัดระวังและไม่กระตุ้นการถอยกลับของโมเดลด้วยตัวเอง

  </Accordion>

  <Accordion title='ข้อความ "No credentials found for profile anthropic:default" หมายความว่าอะไร?'>
    หมายความว่าระบบพยายามใช้ ID โปรไฟล์ยืนยันตัวตน `anthropic:default` แต่ไม่พบข้อมูลรับรองสำหรับโปรไฟล์นั้นในที่เก็บข้อมูลยืนยันตัวตนที่คาดไว้

    **เช็กลิสต์การแก้ไข:**

    - **ยืนยันว่าโปรไฟล์ยืนยันตัวตนอยู่ที่ใด** (พาธใหม่เทียบกับพาธเดิม)
      - ปัจจุบัน: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - เดิม: `~/.openclaw/agent/*` (ย้ายโดย `openclaw doctor`)
    - **ยืนยันว่า env var ของคุณถูกโหลดโดย Gateway**
      - หากคุณตั้งค่า `ANTHROPIC_API_KEY` ในเชลล์ แต่รัน Gateway ผ่าน systemd/launchd อาจไม่ได้รับค่านั้น ให้ใส่ไว้ใน `~/.openclaw/.env` หรือเปิดใช้ `env.shellEnv`
    - **ตรวจสอบให้แน่ใจว่าคุณกำลังแก้ไข agent ที่ถูกต้อง**
      - การตั้งค่าแบบหลาย agent หมายความว่าอาจมีไฟล์ `auth-profiles.json` หลายไฟล์
    - **ตรวจสอบสถานะโมเดล/การยืนยันตัวตนแบบเร็ว**
      - ใช้ `openclaw models status` เพื่อดูโมเดลที่กำหนดค่าไว้และดูว่า provider ได้รับการยืนยันตัวตนหรือไม่

    **เช็กลิสต์การแก้ไขสำหรับ "No credentials found for profile anthropic"**

    หมายความว่าการรันถูกตรึงไว้กับโปรไฟล์ยืนยันตัวตนของ Anthropic แต่ Gateway
    ไม่พบโปรไฟล์นั้นในที่เก็บข้อมูลยืนยันตัวตนของตน

    - **ใช้ Claude CLI**
      - รัน `openclaw models auth login --provider anthropic --method cli --set-default` บนโฮสต์ Gateway
    - **หากคุณต้องการใช้คีย์ API แทน**
      - ใส่ `ANTHROPIC_API_KEY` ใน `~/.openclaw/.env` บน **โฮสต์ Gateway**
      - ล้างลำดับที่ตรึงไว้ซึ่งบังคับให้ใช้โปรไฟล์ที่หายไป:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **ยืนยันว่าคุณกำลังรันคำสั่งบนโฮสต์ Gateway**
      - ในโหมดรีโมต โปรไฟล์ยืนยันตัวตนจะอยู่บนเครื่อง Gateway ไม่ใช่แล็ปท็อปของคุณ

  </Accordion>

  <Accordion title="ทำไมจึงลอง Google Gemini ด้วยแล้วล้มเหลว?">
    หากคอนฟิกโมเดลของคุณมี Google Gemini เป็น fallback (หรือคุณเปลี่ยนไปใช้รูปย่อของ Gemini) OpenClaw จะลองใช้ระหว่างการถอยกลับของโมเดล หากคุณยังไม่ได้กำหนดค่าข้อมูลรับรองของ Google คุณจะเห็น `No API key found for provider "google"`

    วิธีแก้ไข: ให้ข้อมูลยืนยันตัวตนของ Google หรือลบ/หลีกเลี่ยงโมเดล Google ใน `agents.defaults.model.fallbacks` / alias เพื่อไม่ให้ fallback route ไปที่นั่น

    **คำขอ LLM ถูกปฏิเสธ: ต้องมี thinking signature (Google Antigravity)**

    สาเหตุ: ประวัติเซสชันมี **thinking block ที่ไม่มี signature** (มักมาจาก
    สตรีมที่ถูกยกเลิก/ไม่สมบูรณ์) Google Antigravity ต้องใช้ signature สำหรับ thinking block

    วิธีแก้ไข: ตอนนี้ OpenClaw จะตัด thinking block ที่ไม่มี signature ออกสำหรับ Google Antigravity Claude หากยังปรากฏอยู่ ให้เริ่ม **เซสชันใหม่** หรือตั้งค่า `/thinking off` สำหรับ agent นั้น

  </Accordion>
</AccordionGroup>

## โปรไฟล์ยืนยันตัวตน: คืออะไรและจัดการอย่างไร

ที่เกี่ยวข้อง: [/concepts/oauth](/th/concepts/oauth) (โฟลว์ OAuth, การจัดเก็บ token, รูปแบบหลายบัญชี)

<AccordionGroup>
  <Accordion title="โปรไฟล์ยืนยันตัวตนคืออะไร?">
    โปรไฟล์ยืนยันตัวตนคือระเบียนข้อมูลรับรองที่มีชื่อ (OAuth หรือคีย์ API) ที่ผูกกับ provider โปรไฟล์อยู่ใน:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    หากต้องการตรวจสอบโปรไฟล์ที่บันทึกไว้โดยไม่แสดง secret ให้รัน `openclaw models auth list` (เลือกใช้ `--provider <id>` หรือ `--json` ได้) ดูรายละเอียดที่ [CLI โมเดล](/th/cli/models#auth-profiles)

  </Accordion>

  <Accordion title="ID โปรไฟล์ทั่วไปมีอะไรบ้าง?">
    OpenClaw ใช้ ID ที่มี provider เป็นคำนำหน้า เช่น:

    - `anthropic:default` (พบได้บ่อยเมื่อไม่มีตัวตนอีเมล)
    - `anthropic:<email>` สำหรับตัวตน OAuth
    - ID แบบกำหนดเองที่คุณเลือก (เช่น `anthropic:work`)

  </Accordion>

  <Accordion title="ฉันควบคุมได้ไหมว่าโปรไฟล์ยืนยันตัวตนใดจะถูกลองก่อน?">
    ได้ คอนฟิกรองรับเมตาดาต้าเสริมสำหรับโปรไฟล์และลำดับต่อ provider (`auth.order.<provider>`) สิ่งนี้ **ไม่** จัดเก็บ secret แต่จะ map ID ไปยัง provider/mode และตั้งลำดับการหมุนเวียน

    OpenClaw อาจข้ามโปรไฟล์ชั่วคราวหากอยู่ใน **cooldown** ระยะสั้น (การจำกัดอัตรา/timeout/การยืนยันตัวตนล้มเหลว) หรือสถานะ **disabled** ที่นานกว่า (การเรียกเก็บเงิน/เครดิตไม่เพียงพอ) หากต้องการตรวจสอบ ให้รัน `openclaw models status --json` และตรวจ `auth.unusableProfiles` การปรับแต่ง: `auth.cooldowns.billingBackoffHours*`

    Cooldown ของการจำกัดอัตราสามารถจำกัดตามโมเดลได้ โปรไฟล์ที่กำลัง cooldown
    สำหรับโมเดลหนึ่งยังอาจใช้ได้กับโมเดลพี่น้องใน provider เดียวกัน
    ขณะที่หน้าต่างการเรียกเก็บเงิน/disabled ยังบล็อกทั้งโปรไฟล์

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

    หากต้องการระบุ agent เฉพาะ:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    หากต้องการตรวจสอบว่าสุดท้ายแล้วจะลองใช้อะไรจริง ให้ใช้:

    ```bash
    openclaw models status --probe
    ```

    หากโปรไฟล์ที่จัดเก็บไว้ถูกละเว้นจากลำดับที่ระบุชัดเจน probe จะรายงาน
    `excluded_by_auth_order` สำหรับโปรไฟล์นั้นแทนที่จะลองใช้แบบเงียบ ๆ

  </Accordion>

  <Accordion title="OAuth เทียบกับคีย์ API - ต่างกันอย่างไร?">
    OpenClaw รองรับทั้งสองแบบ:

    - **OAuth** มักใช้สิทธิ์การเข้าถึงจาก subscription (เมื่อใช้ได้)
    - **คีย์ API** ใช้การเรียกเก็บเงินแบบจ่ายตาม token

    ตัวช่วยตั้งค่ารองรับ Anthropic Claude CLI, OpenAI Codex OAuth และคีย์ API อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [FAQ](/th/help/faq) — FAQ หลัก
- [FAQ — การเริ่มต้นอย่างรวดเร็วและการตั้งค่าการรันครั้งแรก](/th/help/faq-first-run)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [การสลับสำรองของโมเดล](/th/concepts/model-failover)
