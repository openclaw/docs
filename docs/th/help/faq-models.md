---
read_when:
    - การเลือกหรือสลับโมเดล การกำหนดค่านามแฝง
    - การดีบักการสลับสำรองของโมเดล / "โมเดลทั้งหมดล้มเหลว"
    - ทำความเข้าใจโปรไฟล์การยืนยันตัวตนและวิธีจัดการ
sidebarTitle: Models FAQ
summary: 'คำถามที่พบบ่อย: ค่าเริ่มต้นของโมเดล การเลือก นามแฝง การสลับ การสลับเมื่อเกิดข้อผิดพลาด และโปรไฟล์การยืนยันตัวตน'
title: 'คำถามที่พบบ่อย: โมเดลและการยืนยันตัวตน'
x-i18n:
    generated_at: "2026-05-10T19:41:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62ff4ee6f455e9b8786d79b71dc9be53e650afbe177e3d467665aa407cadfdfd
    source_path: help/faq-models.md
    workflow: 16
---

  ถาม-ตอบเกี่ยวกับโมเดลและโปรไฟล์การยืนยันตัวตน สำหรับการตั้งค่า เซสชัน Gateway ช่องทาง และ
  การแก้ปัญหา โปรดดู [FAQ](/th/help/faq) หลัก

  ## โมเดล: ค่าเริ่มต้น การเลือก alias และการสลับ

  <AccordionGroup>
  <Accordion title='โมเดล "default" คืออะไร?'>
    โมเดลเริ่มต้นของ OpenClaw คือค่าที่คุณตั้งไว้เป็น:

    ```
    agents.defaults.model.primary
    ```

    โมเดลอ้างอิงในรูปแบบ `provider/model` (ตัวอย่าง: `openai/gpt-5.5` หรือ `anthropic/claude-sonnet-4-6`) หากคุณไม่ระบุ provider OpenClaw จะลอง alias ก่อน จากนั้นจะลองจับคู่กับ provider ที่กำหนดค่าไว้เพียงหนึ่งเดียวสำหรับ model id นั้นแบบตรงตัว และสุดท้ายจึง fallback ไปยัง provider เริ่มต้นที่กำหนดค่าไว้เป็นเส้นทางความเข้ากันได้เดิมที่เลิกแนะนำแล้ว หาก provider นั้นไม่เผยแพร่โมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะ fallback ไปยัง provider/model แรกที่กำหนดค่าไว้แทนการแสดงค่าเริ่มต้นของ provider ที่ถูกลบและล้าสมัย คุณยังควรตั้งค่า `provider/model` อย่าง **ชัดเจน**

  </Accordion>

  <Accordion title="คุณแนะนำโมเดลใด?">
    **ค่าเริ่มต้นที่แนะนำ:** ใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดซึ่งมีในชุด provider ของคุณ
    **สำหรับเอเจนต์ที่ใช้เครื่องมือได้หรือรับอินพุตที่ไม่น่าเชื่อถือ:** ให้ความสำคัญกับความสามารถของโมเดลมากกว่าค่าใช้จ่าย
    **สำหรับแชตทั่วไป/ความเสี่ยงต่ำ:** ใช้โมเดล fallback ที่ถูกกว่าและ route ตามบทบาทของเอเจนต์

    MiniMax มีเอกสารของตนเอง: [MiniMax](/th/providers/minimax) และ
    [โมเดล Local](/th/gateway/local-models)

    หลักจำง่าย ๆ: ใช้ **โมเดลที่ดีที่สุดเท่าที่คุณจ่ายไหว** สำหรับงานที่มีความเสี่ยงสูง และใช้โมเดลที่ถูกกว่า
    สำหรับแชตทั่วไปหรือการสรุป คุณสามารถ route โมเดลตามเอเจนต์ และใช้ sub-agents เพื่อ
    ทำงานยาว ๆ แบบขนานได้ (sub-agent แต่ละตัวใช้ token) ดู [โมเดล](/th/concepts/models) และ
    [Sub-agents](/th/tools/subagents)

    คำเตือนสำคัญ: โมเดลที่อ่อนกว่าหรือถูก quantize มากเกินไปมีความเปราะบางต่อ prompt
    injection และพฤติกรรมที่ไม่ปลอดภัยมากกว่า ดู [ความปลอดภัย](/th/gateway/security)

    บริบทเพิ่มเติม: [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันจะสลับโมเดลโดยไม่ล้าง config ได้อย่างไร?">
    ใช้ **คำสั่งโมเดล** หรือแก้ไขเฉพาะฟิลด์ **model** หลีกเลี่ยงการแทนที่ config ทั้งหมด

    ตัวเลือกที่ปลอดภัย:

    - `/model` ในแชต (รวดเร็ว ต่อเซสชัน)
    - `openclaw models set ...` (อัปเดตเฉพาะ config โมเดล)
    - `openclaw configure --section model` (โต้ตอบ)
    - แก้ไข `agents.defaults.model` ใน `~/.openclaw/openclaw.json`

    หลีกเลี่ยง `config.apply` กับออบเจ็กต์บางส่วน เว้นแต่คุณตั้งใจจะแทนที่ config ทั้งหมด
    สำหรับการแก้ไขผ่าน RPC ให้ตรวจสอบด้วย `config.schema.lookup` ก่อน และควรใช้ `config.patch` payload ของ lookup จะให้ path ที่ normalize แล้ว เอกสาร/ข้อจำกัดของ schema แบบตื้น และสรุปลูกโดยตรง
    สำหรับการอัปเดตบางส่วน
    หากคุณเขียนทับ config ไปแล้ว ให้กู้คืนจาก backup หรือรัน `openclaw doctor` อีกครั้งเพื่อซ่อมแซม

    เอกสาร: [โมเดล](/th/concepts/models), [Configure](/th/cli/configure), [Config](/th/cli/config), [Doctor](/th/gateway/doctor)

  </Accordion>

  <Accordion title="ฉันใช้โมเดลที่โฮสต์เองได้ไหม (llama.cpp, vLLM, Ollama)?">
    ได้ Ollama เป็นเส้นทางที่ง่ายที่สุดสำหรับโมเดล Local

    การตั้งค่าที่เร็วที่สุด:

    1. ติดตั้ง Ollama จาก `https://ollama.com/download`
    2. pull โมเดล Local เช่น `ollama pull gemma4`
    3. หากคุณต้องการโมเดล cloud ด้วย ให้รัน `ollama signin`
    4. รัน `openclaw onboard` แล้วเลือก `Ollama`
    5. เลือก `Local` หรือ `Cloud + Local`

    หมายเหตุ:

    - `Cloud + Local` ให้คุณมีโมเดล cloud พร้อมกับโมเดล Ollama Local ของคุณ
    - โมเดล cloud เช่น `kimi-k2.5:cloud` ไม่ต้อง pull ในเครื่อง
    - สำหรับการสลับด้วยตนเอง ให้ใช้ `openclaw models list` และ `openclaw models set ollama/<model>`

    หมายเหตุด้านความปลอดภัย: โมเดลขนาดเล็กหรือถูก quantize หนักมีความเปราะบางต่อ prompt
    injection มากกว่า เราแนะนำอย่างยิ่งให้ใช้ **โมเดลขนาดใหญ่** สำหรับบอตใด ๆ ที่ใช้เครื่องมือได้
    หากคุณยังต้องการใช้โมเดลขนาดเล็ก ให้เปิดใช้ sandboxing และ allowlist เครื่องมืออย่างเข้มงวด

    เอกสาร: [Ollama](/th/providers/ollama), [โมเดล Local](/th/gateway/local-models),
    [Provider โมเดล](/th/concepts/model-providers), [ความปลอดภัย](/th/gateway/security),
    [Sandboxing](/th/gateway/sandboxing)

  </Accordion>

  <Accordion title="OpenClaw, Flawd และ Krill ใช้โมเดลอะไร?">
    - การ deploy เหล่านี้อาจแตกต่างกันและอาจเปลี่ยนแปลงเมื่อเวลาผ่านไป จึงไม่มีคำแนะนำ provider แบบตายตัว
    - ตรวจสอบการตั้งค่า runtime ปัจจุบันบนแต่ละ Gateway ด้วย `openclaw models status`
    - สำหรับเอเจนต์ที่ไวต่อความปลอดภัย/ใช้เครื่องมือได้ ให้ใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดซึ่งมีอยู่

  </Accordion>

  <Accordion title="ฉันจะสลับโมเดลแบบทันทีได้อย่างไร (โดยไม่ต้องรีสตาร์ต)?">
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

    รายการเหล่านี้คือ alias ในตัว สามารถเพิ่ม alias ที่กำหนดเองได้ผ่าน `agents.defaults.models`

    คุณสามารถแสดงรายการโมเดลที่มีได้ด้วย `/model`, `/model list` หรือ `/model status`

    `/model` (และ `/model list`) จะแสดงตัวเลือกแบบกระชับพร้อมหมายเลข เลือกด้วยหมายเลข:

    ```
    /model 3
    ```

    คุณยังสามารถบังคับใช้โปรไฟล์การยืนยันตัวตนเฉพาะสำหรับ provider ได้ (ต่อเซสชัน):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    เคล็ดลับ: `/model status` แสดงว่าเอเจนต์ใดกำลัง active ใช้ไฟล์ `auth-profiles.json` ใด และจะลองโปรไฟล์การยืนยันตัวตนใดต่อไป
    นอกจากนี้ยังแสดง endpoint ของ provider ที่กำหนดค่าไว้ (`baseUrl`) และโหมด API (`api`) เมื่อมีข้อมูล

    **ฉันจะยกเลิกการ pin โปรไฟล์ที่ตั้งด้วย @profile ได้อย่างไร?**

    รัน `/model` อีกครั้ง **โดยไม่ใส่** suffix `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    หากคุณต้องการกลับไปใช้ค่าเริ่มต้น ให้เลือกจาก `/model` (หรือส่ง `/model <default provider/model>`)
    ใช้ `/model status` เพื่อยืนยันว่าโปรไฟล์การยืนยันตัวตนใดกำลัง active

  </Accordion>

  <Accordion title="ฉันใช้ GPT 5.5 สำหรับงานประจำวันและ Codex 5.5 สำหรับการเขียนโค้ดได้ไหม?">
    ได้ ให้แยกการเลือกโมเดลออกจากการเลือก runtime:

    - **เอเจนต์เขียนโค้ด Native Codex:** ตั้ง `agents.defaults.model.primary` เป็น `openai/gpt-5.5` ลงชื่อเข้าใช้ด้วย `openclaw models auth login --provider openai-codex` เมื่อคุณต้องการการยืนยันตัวตนด้วย subscription ของ ChatGPT/Codex
    - **งาน OpenAI API โดยตรงนอกลูปเอเจนต์:** กำหนดค่า `OPENAI_API_KEY` สำหรับภาพ embeddings เสียง realtime และ surface อื่น ๆ ของ OpenAI API ที่ไม่ใช่เอเจนต์
    - **การยืนยันตัวตนด้วย API key สำหรับเอเจนต์ OpenAI:** ใช้ `/model openai/gpt-5.5` พร้อมโปรไฟล์ API-key ของ `openai-codex` ที่เรียงลำดับไว้
    - **Sub-agents:** route งานเขียนโค้ดไปยังเอเจนต์ที่เน้น Codex พร้อมโมเดล `openai/gpt-5.5` ของตัวเอง

    ดู [โมเดล](/th/concepts/models) และ [คำสั่ง Slash](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="ฉันจะกำหนดค่า fast mode สำหรับ GPT 5.5 ได้อย่างไร?">
    ใช้ตัวสลับในเซสชันหรือค่าเริ่มต้นใน config:

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

    สำหรับ OpenAI fast mode จะ map ไปยัง `service_tier = "priority"` บนคำขอ Responses native ที่รองรับ การ override ด้วย `/fast` ในเซสชันมีผลเหนือค่าเริ่มต้นใน config

    ดู [Thinking และ fast mode](/th/tools/thinking) และ [OpenAI fast mode](/th/providers/openai#fast-mode)

  </Accordion>

  <Accordion title='ทำไมฉันจึงเห็น "Model ... is not allowed" แล้วไม่มีการตอบกลับ?'>
    หากตั้งค่า `agents.defaults.models` ไว้ ค่านั้นจะกลายเป็น **allowlist** สำหรับ `/model` และ override ใด ๆ
    ในเซสชัน การเลือกโมเดลที่ไม่อยู่ในรายการนั้นจะส่งคืน:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    ข้อผิดพลาดนั้นจะถูกส่งคืน **แทน** การตอบกลับปกติ วิธีแก้: เพิ่มโมเดลตรงตัวเข้าไปใน
    `agents.defaults.models`, เพิ่ม wildcard ของ provider เช่น `"provider/*": {}` สำหรับ catalog provider แบบ dynamic, ลบ allowlist ออก หรือเลือกโมเดลจาก `/model list`
    หากคำสั่งมี `--runtime codex` ด้วย ให้อัปเดต allowlist ก่อน แล้วค่อยลองรัน
    คำสั่ง `/model provider/model --runtime codex` เดิมอีกครั้ง

  </Accordion>

  <Accordion title='ทำไมฉันจึงเห็น "Unknown model: minimax/MiniMax-M2.7"?'>
    หมายความว่า **provider ยังไม่ได้กำหนดค่า** (ไม่พบ config หรือโปรไฟล์การยืนยันตัวตนของ MiniMax
    provider) ดังนั้นจึง resolve โมเดลไม่ได้

    เช็กลิสต์การแก้ไข:

    1. อัปเกรดเป็น OpenClaw รุ่นปัจจุบัน (หรือรันจากซอร์ส `main`) จากนั้นรีสตาร์ต Gateway
    2. ตรวจสอบให้แน่ใจว่า MiniMax ถูกกำหนดค่าแล้ว (ผ่าน wizard หรือ JSON) หรือมีการยืนยันตัวตน MiniMax
       อยู่ใน env/auth profiles เพื่อให้ provider ที่ตรงกันถูก inject ได้
       (`MINIMAX_API_KEY` สำหรับ `minimax`, `MINIMAX_OAUTH_TOKEN` หรือ MiniMax
       OAuth ที่จัดเก็บไว้สำหรับ `minimax-portal`)
    3. ใช้ model id ที่ตรงตัว (แยกตัวพิมพ์เล็กใหญ่) สำหรับเส้นทางการยืนยันตัวตนของคุณ:
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

  <Accordion title="ฉันใช้ MiniMax เป็นค่าเริ่มต้นและใช้ OpenAI สำหรับงานซับซ้อนได้ไหม?">
    ได้ ใช้ **MiniMax เป็นค่าเริ่มต้น** และสลับโมเดล **ต่อเซสชัน** เมื่อจำเป็น
    Fallback ใช้สำหรับ **ข้อผิดพลาด** ไม่ใช่ "งานยาก" ดังนั้นให้ใช้ `/model` หรือเอเจนต์แยกต่างหาก

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

    - ค่าเริ่มต้นของ Agent A: MiniMax
    - ค่าเริ่มต้นของ Agent B: OpenAI
    - route ตามเอเจนต์หรือใช้ `/agent` เพื่อสลับ

    เอกสาร: [โมเดล](/th/concepts/models), [การ route หลายเอเจนต์](/th/concepts/multi-agent), [MiniMax](/th/providers/minimax), [OpenAI](/th/providers/openai)

  </Accordion>

  <Accordion title="opus / sonnet / gpt เป็น shortcut ในตัวหรือไม่?">
    ใช่ OpenClaw มาพร้อม shorthand เริ่มต้นบางรายการ (ใช้เฉพาะเมื่อโมเดลมีอยู่ใน `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    หากคุณตั้ง alias ของตัวเองด้วยชื่อเดียวกัน ค่าของคุณจะมีผล

  </Accordion>

  <Accordion title="ฉันจะกำหนด/override shortcut ของโมเดล (alias) ได้อย่างไร?">
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

    จากนั้น `/model sonnet` (หรือ `/<alias>` เมื่อรองรับ) จะ resolve เป็น model ID นั้น

  </Accordion>

  <Accordion title="ฉันจะเพิ่มโมเดลจาก provider อื่น เช่น OpenRouter หรือ Z.AI ได้อย่างไร?">
    OpenRouter (จ่ายตาม token; มีหลายโมเดล):

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

    หากคุณอ้างอิงผู้ให้บริการ/โมเดล แต่ไม่มีคีย์ผู้ให้บริการที่จำเป็น คุณจะได้รับข้อผิดพลาดการยืนยันตัวตนขณะรัน (เช่น `No API key found for provider "zai"`)

    **ไม่พบคีย์ API สำหรับผู้ให้บริการหลังจากเพิ่มเอเจนต์ใหม่**

    โดยปกติหมายความว่า **เอเจนต์ใหม่** มีที่เก็บการยืนยันตัวตนว่างเปล่า การยืนยันตัวตนเป็นแบบต่อเอเจนต์และ
    จัดเก็บไว้ใน:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    ตัวเลือกการแก้ไข:

    - รัน `openclaw agents add <id>` และกำหนดค่าการยืนยันตัวตนระหว่างวิซาร์ด
    - หรือคัดลอกเฉพาะโปรไฟล์ `api_key` / `token` แบบคงที่ที่ย้ายได้จากที่เก็บการยืนยันตัวตนของเอเจนต์หลักไปยังที่เก็บการยืนยันตัวตนของเอเจนต์ใหม่
    - สำหรับโปรไฟล์ OAuth ให้ลงชื่อเข้าใช้จากเอเจนต์ใหม่เมื่อจำเป็นต้องใช้บัญชีของตัวเอง มิฉะนั้น OpenClaw สามารถอ่านผ่านไปยังเอเจนต์เริ่มต้น/หลักได้โดยไม่ต้องโคลนโทเค็นรีเฟรช

    อย่าใช้ `agentDir` ซ้ำข้ามเอเจนต์ เพราะจะทำให้การยืนยันตัวตน/เซสชันชนกัน

  </Accordion>
</AccordionGroup>

## การสลับโมเดลสำรองและ "โมเดลทั้งหมดล้มเหลว"

<AccordionGroup>
  <Accordion title="การสลับสำรองทำงานอย่างไร?">
    การสลับสำรองเกิดขึ้นในสองขั้นตอน:

    1. **การหมุนเวียนโปรไฟล์การยืนยันตัวตน** ภายในผู้ให้บริการเดียวกัน
    2. **การสลับโมเดลสำรอง** ไปยังโมเดลถัดไปใน `agents.defaults.model.fallbacks`

    คูลดาวน์จะมีผลกับโปรไฟล์ที่ล้มเหลว (แบ็กออฟแบบเอ็กซ์โพเนนเชียล) ดังนั้น OpenClaw จึงยังตอบสนองต่อไปได้แม้ผู้ให้บริการจะถูกจำกัดอัตราหรือล้มเหลวชั่วคราว

    บัคเก็ตการจำกัดอัตราครอบคลุมมากกว่าการตอบกลับ `429` ทั่วไป OpenClaw
    ยังถือว่าข้อความอย่าง `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` และขีดจำกัด
    หน้าต่างการใช้งานเป็นรอบ (`weekly/monthly limit reached`) เป็นการจำกัดอัตรา
    ที่ควรสลับสำรอง

    การตอบกลับบางอย่างที่ดูเกี่ยวกับการเรียกเก็บเงินไม่ใช่ `402` และการตอบกลับ HTTP `402`
    บางส่วนก็ยังอยู่ในบัคเก็ตชั่วคราวนั้นด้วย หากผู้ให้บริการส่งคืน
    ข้อความการเรียกเก็บเงินอย่างชัดเจนบน `401` หรือ `403` OpenClaw ยังสามารถเก็บสิ่งนั้นไว้ใน
    เลนการเรียกเก็บเงินได้ แต่ตัวจับคู่ข้อความเฉพาะผู้ให้บริการจะยังจำกัดขอบเขตไว้กับ
    ผู้ให้บริการที่เป็นเจ้าของเท่านั้น (เช่น OpenRouter `Key limit exceeded`) หากข้อความ `402`
    ดูเหมือนเป็นหน้าต่างการใช้งานที่ลองใหม่ได้หรือ
    ขีดจำกัดค่าใช้จ่ายขององค์กร/เวิร์กสเปซ (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) OpenClaw จะถือว่าเป็น
    `rate_limit` ไม่ใช่การปิดใช้งานด้านการเรียกเก็บเงินระยะยาว

    ข้อผิดพลาดบริบทล้นแตกต่างออกไป: ลายเซ็นเช่น
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` หรือ `ollama error: context length
    exceeded` จะอยู่บนเส้นทาง Compaction/ลองใหม่ แทนที่จะเดินหน้าไปยัง
    การสลับโมเดลสำรอง

    ข้อความข้อผิดพลาดเซิร์ฟเวอร์ทั่วไปถูกจำกัดให้แคบกว่า "ทุกอย่างที่มี
    unknown/error อยู่ในนั้น" โดยตั้งใจ OpenClaw ถือว่ารูปแบบชั่วคราวที่จำกัดขอบเขตตามผู้ให้บริการ
    เช่น Anthropic แบบเปล่า `An unknown error occurred`, OpenRouter แบบเปล่า
    `Provider returned error`, ข้อผิดพลาดเหตุผลการหยุดอย่าง `Unhandled stop reason:
    error`, เพย์โหลด JSON `api_error` ที่มีข้อความเซิร์ฟเวอร์ชั่วคราว
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) และข้อผิดพลาดผู้ให้บริการไม่ว่าง เช่น `ModelNotReadyException` เป็น
    สัญญาณหมดเวลา/โอเวอร์โหลดที่ควรสลับสำรอง เมื่อบริบทของผู้ให้บริการ
    ตรงกัน
    ข้อความสำรองภายในทั่วไปอย่าง `LLM request failed with an unknown
    error.` จะยังคงเป็นแบบระมัดระวังและไม่กระตุ้นการสลับโมเดลสำรองด้วยตัวเอง

  </Accordion>

  <Accordion title='ข้อความ "No credentials found for profile anthropic:default" หมายความว่าอย่างไร?'>
    หมายความว่าระบบพยายามใช้ ID โปรไฟล์การยืนยันตัวตน `anthropic:default` แต่ไม่พบข้อมูลประจำตัวสำหรับโปรไฟล์นั้นในที่เก็บการยืนยันตัวตนที่คาดไว้

    **เช็กลิสต์การแก้ไข:**

    - **ยืนยันว่าโปรไฟล์การยืนยันตัวตนอยู่ที่ใด** (พาธใหม่เทียบกับพาธเดิม)
      - ปัจจุบัน: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - เดิม: `~/.openclaw/agent/*` (ย้ายโดย `openclaw doctor`)
    - **ยืนยันว่า Gateway โหลดตัวแปรสภาพแวดล้อมของคุณแล้ว**
      - หากคุณตั้งค่า `ANTHROPIC_API_KEY` ในเชลล์ แต่รัน Gateway ผ่าน systemd/launchd อาจไม่ได้สืบทอดค่านั้น ให้ใส่ไว้ใน `~/.openclaw/.env` หรือเปิดใช้ `env.shellEnv`
    - **ตรวจสอบให้แน่ใจว่าคุณกำลังแก้ไขเอเจนต์ที่ถูกต้อง**
      - การตั้งค่าแบบหลายเอเจนต์หมายความว่าอาจมีไฟล์ `auth-profiles.json` ได้หลายไฟล์
    - **ตรวจสอบสถานะโมเดล/การยืนยันตัวตนแบบเร็ว**
      - ใช้ `openclaw models status` เพื่อดูโมเดลที่กำหนดค่าไว้และผู้ให้บริการได้รับการยืนยันตัวตนแล้วหรือไม่

    **เช็กลิสต์การแก้ไขสำหรับ "No credentials found for profile anthropic"**

    หมายความว่าการรันถูกปักไว้กับโปรไฟล์การยืนยันตัวตนของ Anthropic แต่ Gateway
    ไม่พบโปรไฟล์นั้นในที่เก็บการยืนยันตัวตนของตัวเอง

    - **ใช้ Claude CLI**
      - รัน `openclaw models auth login --provider anthropic --method cli --set-default` บนโฮสต์ Gateway
    - **หากคุณต้องการใช้คีย์ API แทน**
      - ใส่ `ANTHROPIC_API_KEY` ใน `~/.openclaw/.env` บน **โฮสต์ Gateway**
      - ล้างลำดับที่ปักไว้ซึ่งบังคับให้ใช้โปรไฟล์ที่หายไป:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **ยืนยันว่าคุณกำลังรันคำสั่งบนโฮสต์ Gateway**
      - ในโหมดรีโมต โปรไฟล์การยืนยันตัวตนจะอยู่บนเครื่อง Gateway ไม่ใช่แล็ปท็อปของคุณ

  </Accordion>

  <Accordion title="ทำไมจึงลอง Google Gemini แล้วล้มเหลวด้วย?">
    หากการกำหนดค่าโมเดลของคุณมี Google Gemini เป็นโมเดลสำรอง (หรือคุณสลับไปใช้ชื่อย่อ Gemini) OpenClaw จะลองใช้ระหว่างการสลับโมเดลสำรอง หากคุณยังไม่ได้กำหนดค่าข้อมูลประจำตัวของ Google คุณจะเห็น `No API key found for provider "google"`

    วิธีแก้: ให้ข้อมูลยืนยันตัวตนของ Google หรือนำ/หลีกเลี่ยงโมเดล Google ใน `agents.defaults.model.fallbacks` / นามแฝง เพื่อไม่ให้การสลับสำรองส่งเส้นทางไปที่นั่น

    **คำขอ LLM ถูกปฏิเสธ: ต้องมีลายเซ็นการคิด (Google Antigravity)**

    สาเหตุ: ประวัติเซสชันมี **บล็อกการคิดที่ไม่มีลายเซ็น** (มักมาจาก
    สตรีมที่ถูกยกเลิก/บางส่วน) Google Antigravity ต้องการลายเซ็นสำหรับบล็อกการคิด

    วิธีแก้: ตอนนี้ OpenClaw จะตัดบล็อกการคิดที่ไม่มีลายเซ็นออกสำหรับ Google Antigravity Claude หากยังปรากฏอยู่ ให้เริ่ม **เซสชันใหม่** หรือตั้งค่า `/thinking off` สำหรับเอเจนต์นั้น

  </Accordion>
</AccordionGroup>

## โปรไฟล์การยืนยันตัวตน: คืออะไรและจัดการอย่างไร

ที่เกี่ยวข้อง: [/concepts/oauth](/th/concepts/oauth) (โฟลว์ OAuth, การจัดเก็บโทเค็น, รูปแบบหลายบัญชี)

<AccordionGroup>
  <Accordion title="โปรไฟล์การยืนยันตัวตนคืออะไร?">
    โปรไฟล์การยืนยันตัวตนคือระเบียนข้อมูลประจำตัวที่มีชื่อ (OAuth หรือคีย์ API) ซึ่งผูกกับผู้ให้บริการ โปรไฟล์อยู่ใน:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    หากต้องการตรวจสอบโปรไฟล์ที่บันทึกไว้โดยไม่พิมพ์ความลับออกมา ให้รัน `openclaw models auth list` (เลือกใช้ `--provider <id>` หรือ `--json` ได้) ดูรายละเอียดใน [CLI โมเดล](/th/cli/models#auth-profiles)

  </Accordion>

  <Accordion title="ID โปรไฟล์ทั่วไปมีอะไรบ้าง?">
    OpenClaw ใช้ ID ที่มีคำนำหน้าผู้ให้บริการ เช่น:

    - `anthropic:default` (พบได้บ่อยเมื่อไม่มีตัวตนอีเมล)
    - `anthropic:<email>` สำหรับตัวตน OAuth
    - ID กำหนดเองที่คุณเลือก (เช่น `anthropic:work`)

  </Accordion>

  <Accordion title="ฉันควบคุมได้ไหมว่าจะลองโปรไฟล์การยืนยันตัวตนใดก่อน?">
    ได้ การกำหนดค่ารองรับเมทาดาทาเสริมสำหรับโปรไฟล์และลำดับต่อผู้ให้บริการ (`auth.order.<provider>`) สิ่งนี้ **ไม่** จัดเก็บความลับ แต่แมป ID ไปยังผู้ให้บริการ/โหมด และตั้งลำดับการหมุนเวียน

    OpenClaw อาจข้ามโปรไฟล์ชั่วคราวหากอยู่ใน **คูลดาวน์** ระยะสั้น (การจำกัดอัตรา/หมดเวลา/การยืนยันตัวตนล้มเหลว) หรือสถานะ **ปิดใช้งาน** ที่นานกว่า (การเรียกเก็บเงิน/เครดิตไม่เพียงพอ) หากต้องการตรวจสอบ ให้รัน `openclaw models status --json` และดู `auth.unusableProfiles` การปรับแต่ง: `auth.cooldowns.billingBackoffHours*`

    คูลดาวน์การจำกัดอัตราอาจจำกัดขอบเขตตามโมเดลได้ โปรไฟล์ที่กำลังคูลดาวน์
    สำหรับโมเดลหนึ่งยังอาจใช้ได้กับโมเดลพี่น้องบนผู้ให้บริการเดียวกัน
    ขณะที่หน้าต่างการเรียกเก็บเงิน/ปิดใช้งานยังบล็อกทั้งโปรไฟล์อยู่

    คุณยังสามารถตั้งค่าการแทนที่ลำดับ **ต่อเอเจนต์** (จัดเก็บใน `auth-state.json` ของเอเจนต์นั้น) ผ่าน CLI:

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

    หากต้องการตรวจสอบว่าจะลองใช้อะไรจริง ให้ใช้:

    ```bash
    openclaw models status --probe
    ```

    หากโปรไฟล์ที่จัดเก็บไว้ถูกละเว้นจากลำดับที่ระบุไว้อย่างชัดเจน probe จะรายงาน
    `excluded_by_auth_order` สำหรับโปรไฟล์นั้นแทนที่จะลองแบบเงียบ ๆ

  </Accordion>

  <Accordion title="OAuth เทียบกับคีย์ API - ต่างกันอย่างไร?">
    OpenClaw รองรับทั้งสองแบบ:

    - **OAuth** มักใช้ประโยชน์จากการเข้าถึงแบบสมัครสมาชิก (เมื่อใช้ได้)
    - **คีย์ API** ใช้การเรียกเก็บเงินตามโทเค็นที่ใช้

    วิซาร์ดรองรับ Anthropic Claude CLI, OpenAI Codex OAuth และคีย์ API อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [FAQ](/th/help/faq) — FAQ หลัก
- [FAQ — การเริ่มต้นอย่างรวดเร็วและการตั้งค่าการรันครั้งแรก](/th/help/faq-first-run)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [การสลับโมเดลสำรอง](/th/concepts/model-failover)
