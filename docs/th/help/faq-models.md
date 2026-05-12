---
read_when:
    - การเลือกหรือสลับโมเดล การกำหนดค่านามแฝง
    - การดีบักการสลับไปใช้โมเดลสำรอง / "โมเดลทั้งหมดล้มเหลว"
    - ทำความเข้าใจโปรไฟล์การตรวจสอบสิทธิ์และวิธีจัดการ
sidebarTitle: Models FAQ
summary: 'คำถามที่พบบ่อย: ค่าเริ่มต้นของโมเดล การเลือก นามแฝง การสลับ การสลับไปใช้ระบบสำรองเมื่อขัดข้อง และโปรไฟล์การตรวจสอบสิทธิ์'
title: 'คำถามที่พบบ่อย: โมเดลและการตรวจสอบสิทธิ์'
x-i18n:
    generated_at: "2026-05-12T04:10:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: a42a8c24798908c7782a9f0c6f0af3fac0c1ad4e5f80d64778f6fd7e1e174f3b
    source_path: help/faq-models.md
    workflow: 16
---

  คำถามและคำตอบเกี่ยวกับโมเดลและโปรไฟล์การยืนยันตัวตน สำหรับการตั้งค่า เซสชัน Gateway ช่องทาง และ
  การแก้ปัญหา โปรดดู [FAQ](/th/help/faq) หลัก

  ## โมเดล: ค่าเริ่มต้น การเลือก alias และการสลับ

  <AccordionGroup>
  <Accordion title='“โมเดลเริ่มต้น” คืออะไร?'>
    โมเดลเริ่มต้นของ OpenClaw คือสิ่งที่คุณตั้งค่าไว้เป็น:

    ```
    agents.defaults.model.primary
    ```

    โมเดลจะถูกอ้างอิงเป็น `provider/model` (ตัวอย่าง: `openai/gpt-5.5` หรือ `anthropic/claude-sonnet-4-6`) หากคุณละเว้นผู้ให้บริการ OpenClaw จะลองใช้ alias ก่อน จากนั้นจึงลองจับคู่ผู้ให้บริการที่กำหนดค่าไว้แบบไม่ซ้ำสำหรับ id โมเดลนั้นแบบตรงตัว และหลังจากนั้นจึงย้อนกลับไปใช้ผู้ให้บริการเริ่มต้นที่กำหนดค่าไว้ในฐานะเส้นทางความเข้ากันได้ที่เลิกใช้แล้วเท่านั้น หากผู้ให้บริการนั้นไม่เปิดเผยโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะย้อนกลับไปใช้ผู้ให้บริการ/โมเดลแรกที่กำหนดค่าไว้แทนที่จะแสดงค่าเริ่มต้นของผู้ให้บริการที่ถูกลบซึ่งล้าสมัยแล้ว คุณยังควรตั้งค่า `provider/model` **อย่างชัดเจน**

  </Accordion>

  <Accordion title="คุณแนะนำให้ใช้โมเดลใด?">
    **ค่าเริ่มต้นที่แนะนำ:** ใช้โมเดลรุ่นล่าสุดที่ทรงพลังที่สุดซึ่งมีอยู่ในสแตกผู้ให้บริการของคุณ
    **สำหรับเอเจนต์ที่เปิดใช้เครื่องมือหรือรับอินพุตที่ไม่น่าเชื่อถือ:** ให้ความสำคัญกับความสามารถของโมเดลมากกว่าต้นทุน
    **สำหรับแชททั่วไป/ความเสี่ยงต่ำ:** ใช้โมเดลสำรองที่ถูกกว่าและกำหนดเส้นทางตามบทบาทของเอเจนต์

    MiniMax มีเอกสารของตัวเอง: [MiniMax](/th/providers/minimax) และ
    [โมเดลภายในเครื่อง](/th/gateway/local-models)

    หลักคร่าว ๆ: ใช้ **โมเดลที่ดีที่สุดที่คุณจ่ายไหว** สำหรับงานที่มีความเสี่ยงสูง และใช้โมเดลที่ถูกกว่า
    สำหรับแชททั่วไปหรือการสรุป คุณสามารถกำหนดเส้นทางโมเดลต่อเอเจนต์และใช้เอเจนต์ย่อยเพื่อ
    ทำงานยาว ๆ แบบขนานได้ (เอเจนต์ย่อยแต่ละตัวใช้โทเค็น) ดู [โมเดล](/th/concepts/models) และ
    [เอเจนต์ย่อย](/th/tools/subagents)

    คำเตือนสำคัญ: โมเดลที่อ่อนกว่าหรือถูกควอนไทซ์มากเกินไปเสี่ยงต่อ prompt
    injection และพฤติกรรมที่ไม่ปลอดภัยมากกว่า ดู [ความปลอดภัย](/th/gateway/security)

    บริบทเพิ่มเติม: [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันจะสลับโมเดลโดยไม่ล้าง config ได้อย่างไร?">
    ใช้ **คำสั่งโมเดล** หรือแก้ไขเฉพาะฟิลด์ **model** หลีกเลี่ยงการแทนที่ config ทั้งหมด

    ตัวเลือกที่ปลอดภัย:

    - `/model` ในแชท (รวดเร็ว ต่อเซสชัน)
    - `openclaw models set ...` (อัปเดตเฉพาะ config โมเดล)
    - `openclaw configure --section model` (โต้ตอบได้)
    - แก้ไข `agents.defaults.model` ใน `~/.openclaw/openclaw.json`

    หลีกเลี่ยง `config.apply` กับอ็อบเจกต์บางส่วน เว้นแต่คุณตั้งใจจะแทนที่ config ทั้งหมด
    สำหรับการแก้ไขผ่าน RPC ให้ตรวจสอบด้วย `config.schema.lookup` ก่อนและควรใช้ `config.patch` payload การ lookup จะให้ path ที่ normalize แล้ว เอกสาร/ข้อจำกัดของ schema แบบตื้น และสรุปลูกโดยตรง
    สำหรับการอัปเดตบางส่วน
    หากคุณเขียนทับ config ไปแล้ว ให้กู้คืนจากข้อมูลสำรองหรือรัน `openclaw doctor` อีกครั้งเพื่อซ่อมแซม

    เอกสาร: [โมเดล](/th/concepts/models), [กำหนดค่า](/th/cli/configure), [Config](/th/cli/config), [Doctor](/th/gateway/doctor)

  </Accordion>

  <Accordion title="ฉันสามารถใช้โมเดลที่โฮสต์เอง (llama.cpp, vLLM, Ollama) ได้ไหม?">
    ได้ Ollama เป็นเส้นทางที่ง่ายที่สุดสำหรับโมเดลภายในเครื่อง

    การตั้งค่าที่เร็วที่สุด:

    1. ติดตั้ง Ollama จาก `https://ollama.com/download`
    2. ดึงโมเดลภายในเครื่อง เช่น `ollama pull gemma4`
    3. หากคุณต้องการโมเดลคลาวด์ด้วย ให้รัน `ollama signin`
    4. รัน `openclaw onboard` และเลือก `Ollama`
    5. เลือก `Local` หรือ `Cloud + Local`

    หมายเหตุ:

    - `Cloud + Local` ให้ทั้งโมเดลคลาวด์และโมเดล Ollama ภายในเครื่องของคุณ
    - โมเดลคลาวด์ เช่น `kimi-k2.5:cloud` ไม่จำเป็นต้องดึงมาไว้ในเครื่อง
    - สำหรับการสลับด้วยตนเอง ให้ใช้ `openclaw models list` และ `openclaw models set ollama/<model>`

    หมายเหตุด้านความปลอดภัย: โมเดลที่เล็กกว่าหรือถูกควอนไทซ์อย่างหนักเสี่ยงต่อ prompt
    injection มากกว่า เราแนะนำอย่างยิ่งให้ใช้ **โมเดลขนาดใหญ่** สำหรับบอตใด ๆ ที่สามารถใช้เครื่องมือได้
    หากคุณยังต้องการใช้โมเดลขนาดเล็ก ให้เปิดใช้ sandboxing และ allowlist เครื่องมือแบบเข้มงวด

    เอกสาร: [Ollama](/th/providers/ollama), [โมเดลภายในเครื่อง](/th/gateway/local-models),
    [ผู้ให้บริการโมเดล](/th/concepts/model-providers), [ความปลอดภัย](/th/gateway/security),
    [Sandboxing](/th/gateway/sandboxing)

  </Accordion>

  <Accordion title="OpenClaw, Flawd และ Krill ใช้โมเดลใด?">
    - การดีพลอยเหล่านี้อาจแตกต่างกันและอาจเปลี่ยนแปลงได้ตามเวลา ไม่มีคำแนะนำผู้ให้บริการแบบตายตัว
    - ตรวจสอบการตั้งค่ารันไทม์ปัจจุบันในแต่ละ Gateway ด้วย `openclaw models status`
    - สำหรับเอเจนต์ที่ไวต่อความปลอดภัย/เปิดใช้เครื่องมือ ให้ใช้โมเดลรุ่นล่าสุดที่ทรงพลังที่สุดซึ่งมีอยู่

  </Accordion>

  <Accordion title="ฉันจะสลับโมเดลแบบทันที (โดยไม่ต้องรีสตาร์ท) ได้อย่างไร?">
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

    รายการเหล่านี้คือ alias ในตัว สามารถเพิ่ม alias แบบกำหนดเองผ่าน `agents.defaults.models` ได้

    คุณสามารถแสดงรายการโมเดลที่ใช้ได้ด้วย `/model`, `/model list` หรือ `/model status`

    `/model` (และ `/model list`) แสดงตัวเลือกแบบกระชับพร้อมหมายเลข เลือกด้วยหมายเลข:

    ```
    /model 3
    ```

    คุณยังสามารถบังคับใช้โปรไฟล์การยืนยันตัวตนเฉพาะสำหรับผู้ให้บริการได้ (ต่อเซสชัน):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    เคล็ดลับ: `/model status` แสดงว่าเอเจนต์ใด active อยู่ ไฟล์ `auth-profiles.json` ใดกำลังถูกใช้ และโปรไฟล์การยืนยันตัวตนใดจะถูกลองถัดไป
    นอกจากนี้ยังแสดง endpoint ของผู้ให้บริการที่กำหนดค่าไว้ (`baseUrl`) และโหมด API (`api`) เมื่อมี

    **ฉันจะยกเลิกการปักหมุดโปรไฟล์ที่ตั้งด้วย @profile ได้อย่างไร?**

    รัน `/model` อีกครั้ง **โดยไม่มี** suffix `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    หากคุณต้องการกลับไปใช้ค่าเริ่มต้น ให้เลือกจาก `/model` (หรือส่ง `/model <default provider/model>`)
    ใช้ `/model status` เพื่อยืนยันว่าโปรไฟล์การยืนยันตัวตนใด active อยู่

  </Accordion>

  <Accordion title="หากผู้ให้บริการสองรายเปิดเผย id โมเดลเดียวกัน /model จะใช้รายใด?">
    `/model provider/model` จะเลือกเส้นทางผู้ให้บริการนั้นแบบตรงตัวสำหรับเซสชัน

    ตัวอย่างเช่น `qianfan/deepseek-v4-flash` และ `deepseek/deepseek-v4-flash` เป็น model ref คนละตัวกัน แม้ว่าทั้งคู่จะมี `deepseek-v4-flash` อยู่ก็ตาม OpenClaw ไม่ควรสลับจากผู้ให้บริการหนึ่งไปยังอีกรายแบบเงียบ ๆ เพียงเพราะ id โมเดลแบบเปล่าตรงกัน

    ref ของ `/model` ที่ผู้ใช้เลือกยังเข้มงวดสำหรับนโยบาย fallback ด้วย หากผู้ให้บริการ/โมเดลที่เลือกนั้นไม่พร้อมใช้งาน การตอบกลับจะล้มเหลวให้เห็นชัด แทนที่จะตอบจาก `agents.defaults.model.fallbacks` เชน fallback ที่กำหนดค่าไว้ยังคงใช้กับค่าเริ่มต้นที่กำหนดค่าไว้ primary ของงาน cron และสถานะ fallback ที่เลือกอัตโนมัติ

    หากการรันที่เริ่มจาก override ที่ไม่ใช่เซสชันได้รับอนุญาตให้ใช้ fallback ได้ OpenClaw จะลองผู้ให้บริการ/โมเดลที่ร้องขอก่อน จากนั้นลอง fallback ที่กำหนดค่าไว้ และหลังจากนั้นจึงลอง primary ที่กำหนดค่าไว้ วิธีนี้ป้องกันไม่ให้ id โมเดลแบบเปล่าที่ซ้ำกันกระโดดกลับไปยังผู้ให้บริการเริ่มต้นโดยตรง

    ดู [โมเดล](/th/concepts/models) และ [Model failover](/th/concepts/model-failover)

  </Accordion>

  <Accordion title="ฉันสามารถใช้ GPT 5.5 สำหรับงานประจำวันและ Codex 5.5 สำหรับการเขียนโค้ดได้ไหม?">
    ได้ ให้แยกการเลือกโมเดลออกจากการเลือกรันไทม์:

    - **เอเจนต์เขียนโค้ด Codex แบบเนทีฟ:** ตั้ง `agents.defaults.model.primary` เป็น `openai/gpt-5.5` ลงชื่อเข้าใช้ด้วย `openclaw models auth login --provider openai-codex` เมื่อคุณต้องการการยืนยันตัวตนด้วยการสมัครสมาชิก ChatGPT/Codex
    - **งาน Direct OpenAI API นอกลูปเอเจนต์:** กำหนดค่า `OPENAI_API_KEY` สำหรับรูปภาพ embeddings เสียง realtime และพื้นผิว OpenAI API อื่น ๆ ที่ไม่ใช่เอเจนต์
    - **การยืนยันตัวตนด้วย API key สำหรับเอเจนต์ OpenAI:** ใช้ `/model openai/gpt-5.5` กับโปรไฟล์ API key ของ `openai-codex` แบบมีลำดับ
    - **เอเจนต์ย่อย:** กำหนดเส้นทางงานเขียนโค้ดไปยังเอเจนต์ที่เน้น Codex ซึ่งมีโมเดล `openai/gpt-5.5` ของตัวเอง

    ดู [โมเดล](/th/concepts/models) และ [คำสั่ง Slash](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="ฉันจะกำหนดค่าโหมดเร็วสำหรับ GPT 5.5 ได้อย่างไร?">
    ใช้ได้ทั้ง toggle ต่อเซสชันหรือค่าเริ่มต้นใน config:

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

    สำหรับ OpenAI โหมดเร็วจะ map เป็น `service_tier = "priority"` บนคำขอ Responses แบบเนทีฟที่รองรับ override `/fast` ของเซสชันจะมีผลเหนือค่าเริ่มต้นใน config

    ดู [การคิดและโหมดเร็ว](/th/tools/thinking) และ [โหมดเร็วของ OpenAI](/th/providers/openai#fast-mode)

  </Accordion>

  <Accordion title='ทำไมฉันจึงเห็น "Model ... is not allowed" แล้วไม่มีคำตอบ?'>
    หากตั้งค่า `agents.defaults.models` ไว้ รายการนั้นจะกลายเป็น **allowlist** สำหรับ `/model` และ override ใด ๆ
    ของเซสชัน การเลือกโมเดลที่ไม่อยู่ในรายการนั้นจะส่งคืน:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    ข้อผิดพลาดนั้นจะถูกส่งคืน **แทนที่** การตอบกลับปกติ วิธีแก้: เพิ่มโมเดลแบบตรงตัวลงใน
    `agents.defaults.models`, เพิ่ม wildcard ของผู้ให้บริการ เช่น `"provider/*": {}` สำหรับแค็ตตาล็อกผู้ให้บริการแบบไดนามิก ลบ allowlist หรือเลือกโมเดลจาก `/model list`
    หากคำสั่งนั้นมี `--runtime codex` ด้วย ให้อัปเดต allowlist ก่อนแล้วลองคำสั่ง
    `/model provider/model --runtime codex` เดิมอีกครั้ง

  </Accordion>

  <Accordion title='ทำไมฉันจึงเห็น "Unknown model: minimax/MiniMax-M2.7"?'>
    หมายความว่า **ยังไม่ได้กำหนดค่าผู้ให้บริการ** (ไม่พบ config ผู้ให้บริการ MiniMax หรือโปรไฟล์การยืนยันตัวตน)
    จึง resolve โมเดลไม่ได้

    checklist สำหรับการแก้ไข:

    1. อัปเกรดเป็น OpenClaw รุ่นปัจจุบัน (หรือรันจากซอร์ส `main`) แล้วรีสตาร์ท Gateway
    2. ตรวจสอบว่า MiniMax ถูกกำหนดค่าแล้ว (wizard หรือ JSON) หรือมีการยืนยันตัวตนของ MiniMax
       อยู่ใน env/โปรไฟล์การยืนยันตัวตน เพื่อให้สามารถ inject ผู้ให้บริการที่ตรงกันได้
       (`MINIMAX_API_KEY` สำหรับ `minimax`, `MINIMAX_OAUTH_TOKEN` หรือ OAuth ของ MiniMax
       ที่จัดเก็บไว้สำหรับ `minimax-portal`)
    3. ใช้ id โมเดลแบบตรงตัว (คำนึงถึงตัวพิมพ์เล็ก/ใหญ่) สำหรับเส้นทางการยืนยันตัวตนของคุณ:
       `minimax/MiniMax-M2.7` หรือ `minimax/MiniMax-M2.7-highspeed` สำหรับการตั้งค่า
       API key หรือ `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` สำหรับการตั้งค่า OAuth
    4. รัน:

       ```bash
       openclaw models list
       ```

       แล้วเลือกจากรายการ (หรือ `/model list` ในแชท)

    ดู [MiniMax](/th/providers/minimax) และ [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันสามารถใช้ MiniMax เป็นค่าเริ่มต้นและใช้ OpenAI สำหรับงานซับซ้อนได้ไหม?">
    ได้ ใช้ **MiniMax เป็นค่าเริ่มต้น** และสลับโมเดล **ต่อเซสชัน** เมื่อจำเป็น
    fallback มีไว้สำหรับ **ข้อผิดพลาด** ไม่ใช่ "งานยาก" ดังนั้นให้ใช้ `/model` หรือเอเจนต์แยกต่างหาก

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

  <Accordion title="opus / sonnet / gpt เป็น shortcut ในตัวหรือไม่?">
    ใช่ OpenClaw มาพร้อมคำย่อเริ่มต้นบางรายการ (จะนำไปใช้เฉพาะเมื่อโมเดลมีอยู่ใน `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-7`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    หากคุณตั้งนามแฝงของคุณเองด้วยชื่อเดียวกัน ค่าของคุณจะมีผลเหนือกว่า

  </Accordion>

  <Accordion title="ฉันจะกำหนด/แทนที่ชอร์ตคัตโมเดล (นามแฝง) ได้อย่างไร">
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

    จากนั้น `/model sonnet` (หรือ `/<alias>` เมื่อรองรับ) จะถูก resolve เป็น ID โมเดลนั้น

  </Accordion>

  <Accordion title="ฉันจะเพิ่มโมเดลจากผู้ให้บริการอื่น เช่น OpenRouter หรือ Z.AI ได้อย่างไร">
    OpenRouter (จ่ายตามโทเค็น; มีหลายโมเดล):

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

    โดยทั่วไปหมายความว่า **เอเจนต์ใหม่** มี auth store ว่างเปล่า auth เป็นแบบแยกต่อเอเจนต์และ
    จัดเก็บอยู่ใน:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    ตัวเลือกการแก้ไข:

    - รัน `openclaw agents add <id>` และกำหนดค่า auth ระหว่างวิซาร์ด
    - หรือคัดลอกเฉพาะโปรไฟล์ `api_key` / `token` แบบสแตติกที่ย้ายข้ามได้จาก auth store ของเอเจนต์หลักไปยัง auth store ของเอเจนต์ใหม่
    - สำหรับโปรไฟล์ OAuth ให้ลงชื่อเข้าใช้จากเอเจนต์ใหม่เมื่อเอเจนต์นั้นต้องใช้บัญชีของตัวเอง มิฉะนั้น OpenClaw สามารถอ่านผ่านไปยังเอเจนต์ค่าเริ่มต้น/หลักได้โดยไม่ต้องโคลน refresh token

    อย่าใช้ `agentDir` ซ้ำข้ามเอเจนต์ เพราะจะทำให้ auth/session ชนกัน

  </Accordion>
</AccordionGroup>

## การสำรองโมเดลเมื่อเกิดข้อผิดพลาดและ "โมเดลทั้งหมดล้มเหลว"

<AccordionGroup>
  <Accordion title="การสำรองเมื่อเกิดข้อผิดพลาดทำงานอย่างไร">
    การสำรองเมื่อเกิดข้อผิดพลาดเกิดขึ้นเป็นสองขั้นตอน:

    1. **การหมุนเวียนโปรไฟล์ auth** ภายในผู้ให้บริการเดียวกัน
    2. **การถอยกลับของโมเดล** ไปยังโมเดลถัดไปใน `agents.defaults.model.fallbacks`

    คูลดาวน์จะมีผลกับโปรไฟล์ที่ล้มเหลว (exponential backoff) ดังนั้น OpenClaw จึงยังตอบสนองต่อได้แม้ผู้ให้บริการถูกจำกัดอัตราหรือล้มเหลวชั่วคราว

    บักเก็ต rate-limit รวมมากกว่าการตอบกลับ `429` แบบทั่วไป OpenClaw
    ยังถือว่าข้อความอย่าง `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` และขีดจำกัด
    ช่วงเวลาการใช้งานเป็นระยะ (`weekly/monthly limit reached`) เป็น rate limit
    ที่ควรทำการสำรองเมื่อเกิดข้อผิดพลาด

    การตอบกลับบางรายการที่ดูเหมือนเกี่ยวกับการเรียกเก็บเงินไม่ใช่ `402` และการตอบกลับ HTTP `402`
    บางรายการก็ยังอยู่ในบักเก็ตชั่วคราวนั้นเช่นกัน หากผู้ให้บริการส่งคืน
    ข้อความการเรียกเก็บเงินที่ชัดเจนบน `401` หรือ `403` OpenClaw ยังสามารถเก็บรายการนั้นไว้ใน
    ช่องทางการเรียกเก็บเงินได้ แต่ตัวจับคู่ข้อความเฉพาะผู้ให้บริการจะยังคงจำกัดอยู่กับ
    ผู้ให้บริการที่เป็นเจ้าของตัวจับคู่นั้น (เช่น OpenRouter `Key limit exceeded`) หากข้อความ `402`
    ดูเหมือนเป็นขีดจำกัดหน้าต่างการใช้งานที่ลองใหม่ได้ หรือ
    ขีดจำกัดค่าใช้จ่ายระดับองค์กร/เวิร์กสเปซ (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) แทน OpenClaw จะถือว่าเป็น
    `rate_limit` ไม่ใช่การปิดใช้งานการเรียกเก็บเงินระยะยาว

    ข้อผิดพลาด context-overflow ต่างออกไป: ลายเซ็นเช่น
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` หรือ `ollama error: context length
    exceeded` จะยังอยู่บนเส้นทาง Compaction/ลองใหม่ แทนที่จะเลื่อนไปยังการ
    ถอยกลับของโมเดล

    ข้อความข้อผิดพลาดเซิร์ฟเวอร์ทั่วไปถูกตั้งใจให้แคบกว่า "อะไรก็ตามที่มี
    unknown/error อยู่ในนั้น" OpenClaw ถือว่า transient shape ที่จำกัดตามผู้ให้บริการ
    เช่น Anthropic แบบเปล่า `An unknown error occurred`, OpenRouter แบบเปล่า
    `Provider returned error`, ข้อผิดพลาด stop-reason เช่น `Unhandled stop reason:
    error`, payload JSON `api_error` พร้อมข้อความเซิร์ฟเวอร์ชั่วคราว
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) และข้อผิดพลาด provider-busy เช่น `ModelNotReadyException` เป็น
    สัญญาณหมดเวลา/โอเวอร์โหลดที่ควรสำรองเมื่อเกิดข้อผิดพลาด เมื่อ context ของผู้ให้บริการ
    ตรงกัน
    ข้อความถอยกลับภายในทั่วไป เช่น `LLM request failed with an unknown
    error.` จะยังคงอนุรักษ์นิยมและไม่ทริกเกอร์การถอยกลับของโมเดลด้วยตัวเอง

  </Accordion>

  <Accordion title='ข้อความ "ไม่พบข้อมูลประจำตัวสำหรับโปรไฟล์ anthropic:default" หมายความว่าอย่างไร'>
    หมายความว่าระบบพยายามใช้ ID โปรไฟล์ auth `anthropic:default` แต่ไม่พบข้อมูลประจำตัวของโปรไฟล์นั้นใน auth store ที่คาดไว้

    **เช็กลิสต์การแก้ไข:**

    - **ยืนยันว่าโปรไฟล์ auth อยู่ที่ใด** (พาธใหม่เทียบกับพาธเดิม)
      - ปัจจุบัน: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - เดิม: `~/.openclaw/agent/*` (ย้ายโดย `openclaw doctor`)
    - **ยืนยันว่า env var ของคุณถูกโหลดโดย Gateway**
      - หากคุณตั้ง `ANTHROPIC_API_KEY` ใน shell ของคุณ แต่รัน Gateway ผ่าน systemd/launchd อาจไม่ได้สืบทอดค่านั้น ให้ใส่ไว้ใน `~/.openclaw/.env` หรือเปิดใช้งาน `env.shellEnv`
    - **ตรวจสอบให้แน่ใจว่าคุณกำลังแก้ไขเอเจนต์ที่ถูกต้อง**
      - การตั้งค่าแบบหลายเอเจนต์หมายความว่าอาจมีไฟล์ `auth-profiles.json` หลายไฟล์
    - **ตรวจสอบสถานะโมเดล/auth แบบคร่าว ๆ**
      - ใช้ `openclaw models status` เพื่อดูโมเดลที่กำหนดค่าไว้และดูว่าผู้ให้บริการผ่านการรับรองตัวตนแล้วหรือไม่

    **เช็กลิสต์การแก้ไขสำหรับ "ไม่พบข้อมูลประจำตัวสำหรับโปรไฟล์ anthropic"**

    หมายความว่าการรันถูกตรึงไว้กับโปรไฟล์ auth ของ Anthropic แต่ Gateway
    หาโปรไฟล์นั้นไม่พบใน auth store ของตน

    - **ใช้ Claude CLI**
      - รัน `openclaw models auth login --provider anthropic --method cli --set-default` บนโฮสต์ Gateway
    - **หากคุณต้องการใช้คีย์ API แทน**
      - ใส่ `ANTHROPIC_API_KEY` ใน `~/.openclaw/.env` บน **โฮสต์ Gateway**
      - ล้างลำดับที่ตรึงไว้ซึ่งบังคับใช้โปรไฟล์ที่หายไป:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **ยืนยันว่าคุณกำลังรันคำสั่งบนโฮสต์ Gateway**
      - ในโหมดระยะไกล โปรไฟล์ auth จะอยู่บนเครื่อง Gateway ไม่ใช่แล็ปท็อปของคุณ

  </Accordion>

  <Accordion title="ทำไมจึงลอง Google Gemini แล้วล้มเหลวด้วย">
    หากการกำหนดค่าโมเดลของคุณมี Google Gemini เป็นตัวสำรอง (หรือคุณสลับไปใช้ชอร์ตแฮนด์ Gemini) OpenClaw จะลองใช้ระหว่างการถอยกลับของโมเดล หากคุณยังไม่ได้กำหนดค่าข้อมูลประจำตัว Google คุณจะเห็น `No API key found for provider "google"`

    วิธีแก้: ให้ข้อมูล auth ของ Google หรือเอา/หลีกเลี่ยงโมเดล Google ใน `agents.defaults.model.fallbacks` / นามแฝง เพื่อไม่ให้การถอยกลับ route ไปที่นั่น

    **คำขอ LLM ถูกปฏิเสธ: ต้องมี thinking signature (Google Antigravity)**

    สาเหตุ: ประวัติเซสชันมี **thinking blocks ที่ไม่มีลายเซ็น** (มักมาจาก
    สตรีมที่ถูกยกเลิก/ไม่สมบูรณ์) Google Antigravity ต้องใช้ลายเซ็นสำหรับ thinking blocks

    วิธีแก้: ตอนนี้ OpenClaw จะตัด thinking blocks ที่ไม่มีลายเซ็นออกสำหรับ Google Antigravity Claude หากยังปรากฏอยู่ ให้เริ่ม **เซสชันใหม่** หรือตั้ง `/thinking off` สำหรับเอเจนต์นั้น

  </Accordion>
</AccordionGroup>

## โปรไฟล์ auth: คืออะไรและจัดการอย่างไร

ที่เกี่ยวข้อง: [/concepts/oauth](/th/concepts/oauth) (โฟลว์ OAuth, การจัดเก็บโทเค็น, รูปแบบหลายบัญชี)

<AccordionGroup>
  <Accordion title="โปรไฟล์ auth คืออะไร">
    โปรไฟล์ auth คือระเบียนข้อมูลประจำตัวที่มีชื่อ (OAuth หรือคีย์ API) ซึ่งผูกกับผู้ให้บริการ โปรไฟล์อยู่ใน:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    หากต้องการตรวจสอบโปรไฟล์ที่บันทึกไว้โดยไม่ dump ข้อมูลลับ ให้รัน `openclaw models auth list` (เลือกใช้ `--provider <id>` หรือ `--json` ได้) ดูรายละเอียดใน [Models CLI](/th/cli/models#auth-profiles)

  </Accordion>

  <Accordion title="ID โปรไฟล์ทั่วไปมีอะไรบ้าง">
    OpenClaw ใช้ ID ที่มีคำนำหน้าผู้ให้บริการ เช่น:

    - `anthropic:default` (พบได้บ่อยเมื่อไม่มีอัตลักษณ์อีเมล)
    - `anthropic:<email>` สำหรับอัตลักษณ์ OAuth
    - ID แบบกำหนดเองที่คุณเลือก (เช่น `anthropic:work`)

  </Accordion>

  <Accordion title="ฉันควบคุมได้ไหมว่าโปรไฟล์ auth ใดจะถูกลองก่อน">
    ได้ การกำหนดค่ารองรับ metadata ทางเลือกสำหรับโปรไฟล์และลำดับต่อผู้ให้บริการ (`auth.order.<provider>`) สิ่งนี้ **ไม่** จัดเก็บข้อมูลลับ แต่แมป ID ไปยังผู้ให้บริการ/โหมด และตั้งลำดับการหมุนเวียน

    OpenClaw อาจข้ามโปรไฟล์ชั่วคราวหากอยู่ใน **คูลดาวน์** ระยะสั้น (rate limits/timeouts/auth failures) หรืออยู่ในสถานะ **ปิดใช้งาน** ที่ยาวกว่า (การเรียกเก็บเงิน/เครดิตไม่เพียงพอ) หากต้องการตรวจสอบ ให้รัน `openclaw models status --json` และตรวจสอบ `auth.unusableProfiles` การปรับแต่ง: `auth.cooldowns.billingBackoffHours*`

    คูลดาวน์ rate-limit สามารถจำกัดตามโมเดลได้ โปรไฟล์ที่กำลังคูลดาวน์
    สำหรับโมเดลหนึ่งอาจยังใช้งานได้กับโมเดลพี่น้องบนผู้ให้บริการเดียวกัน
    ขณะที่ช่วงเวลาการเรียกเก็บเงิน/ปิดใช้งานยังคงบล็อกทั้งโปรไฟล์

    คุณยังสามารถตั้งการแทนที่ลำดับ **ต่อเอเจนต์** (จัดเก็บใน `auth-state.json` ของเอเจนต์นั้น) ผ่าน CLI ได้:

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

    หากต้องการตรวจสอบว่าจะลองอะไรจริง ๆ ให้ใช้:

    ```bash
    openclaw models status --probe
    ```

    หากโปรไฟล์ที่จัดเก็บไว้ถูกละไว้จากลำดับที่ระบุอย่างชัดเจน probe จะรายงาน
    `excluded_by_auth_order` สำหรับโปรไฟล์นั้นแทนการลองแบบเงียบ ๆ

  </Accordion>

  <Accordion title="OAuth เทียบกับคีย์ API - ต่างกันอย่างไร">
    OpenClaw รองรับทั้งสองแบบ:

    - **OAuth** มักใช้ประโยชน์จากการเข้าถึงแบบสมัครสมาชิก (เมื่อใช้ได้)
    - **คีย์ API** ใช้การเรียกเก็บเงินแบบจ่ายตามโทเค็น

    วิซาร์ดรองรับ Anthropic Claude CLI, OpenAI Codex OAuth และคีย์ API อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [FAQ](/th/help/faq) — FAQ หลัก
- [FAQ — เริ่มต้นอย่างรวดเร็วและการตั้งค่าการรันครั้งแรก](/th/help/faq-first-run)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [การสำรองโมเดลเมื่อเกิดข้อผิดพลาด](/th/concepts/model-failover)
