---
read_when:
    - การเลือกหรือสลับโมเดล การกำหนดค่าเอเลียส
    - การดีบักการสลับสำรองของโมเดล / "โมเดลทั้งหมดล้มเหลว"
    - ทำความเข้าใจโปรไฟล์การยืนยันตัวตนและวิธีจัดการ
sidebarTitle: Models FAQ
summary: 'คำถามที่พบบ่อย: ค่าเริ่มต้นของโมเดล การเลือก นามแฝง การสลับ การเฟลโอเวอร์ และโปรไฟล์การตรวจสอบสิทธิ์'
title: 'คำถามที่พบบ่อย: โมเดลและการยืนยันตัวตน'
x-i18n:
    generated_at: "2026-06-27T17:41:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 048e031bb52d10572527d790fda3b63a0d74d08799e48128ea64c4c16ab1f423
    source_path: help/faq-models.md
    workflow: 16
---

  ถาม-ตอบเกี่ยวกับโมเดลและโปรไฟล์ auth สำหรับการตั้งค่า เซสชัน Gateway ช่องทาง และ
  การแก้ปัญหา โปรดดู [FAQ](/th/help/faq) หลัก

  ## โมเดล: ค่าเริ่มต้น การเลือก นามแฝง การสลับ

  <AccordionGroup>
  <Accordion title='“โมเดลเริ่มต้น” คืออะไร?'>
    โมเดลเริ่มต้นของ OpenClaw คือค่าที่คุณตั้งไว้เป็น:

    ```
    agents.defaults.model.primary
    ```

    อ้างอิงโมเดลในรูปแบบ `provider/model` (ตัวอย่าง: `openai/gpt-5.5` หรือ `anthropic/claude-sonnet-4-6`) หากคุณละเว้นผู้ให้บริการ OpenClaw จะลองใช้นามแฝงก่อน จากนั้นจึงลองจับคู่กับผู้ให้บริการที่กำหนดค่าไว้แบบไม่ซ้ำสำหรับรหัสโมเดลนั้นแบบตรงตัว และสุดท้ายจึงย้อนกลับไปใช้ผู้ให้บริการเริ่มต้นที่กำหนดค่าไว้ในฐานะเส้นทางความเข้ากันได้ที่เลิกแนะนำแล้ว หากผู้ให้บริการนั้นไม่มีโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะย้อนกลับไปใช้ผู้ให้บริการ/โมเดลแรกที่กำหนดค่าไว้ แทนที่จะแสดงค่าเริ่มต้นของผู้ให้บริการที่ถูกลบและล้าสมัย คุณควรยังคงตั้งค่า `provider/model` อย่าง**ชัดเจน**

  </Accordion>

  <Accordion title="คุณแนะนำโมเดลใด?">
    **ค่าเริ่มต้นที่แนะนำ:** ใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดที่มีในชุดผู้ให้บริการของคุณ
    **สำหรับเอเจนต์ที่เปิดใช้เครื่องมือหรือรับอินพุตที่ไม่น่าเชื่อถือ:** ให้ความสำคัญกับความสามารถของโมเดลมากกว่าค่าใช้จ่าย
    **สำหรับแชตทั่วไป/ความเสี่ยงต่ำ:** ใช้โมเดลสำรองที่ถูกกว่าและกำหนดเส้นทางตามบทบาทของเอเจนต์

    MiniMax มีเอกสารของตัวเอง: [MiniMax](/th/providers/minimax) และ
    [โมเดลภายในเครื่อง](/th/gateway/local-models)

    หลักทั่วไป: ใช้**โมเดลที่ดีที่สุดที่คุณจ่ายไหว**สำหรับงานที่มีความเสี่ยงสูง และใช้โมเดลที่ถูกกว่า
    สำหรับแชตทั่วไปหรือการสรุป คุณสามารถกำหนดเส้นทางโมเดลต่อเอเจนต์และใช้เอเจนต์ย่อยเพื่อ
    ทำงานยาวแบบขนาน (เอเจนต์ย่อยแต่ละตัวใช้โทเค็น) ดู [โมเดล](/th/concepts/models) และ
    [เอเจนต์ย่อย](/th/tools/subagents)

    คำเตือนสำคัญ: โมเดลที่อ่อนกว่าหรือถูกควอนไทซ์มากเกินไปมีความเสี่ยงต่อ prompt
    injection และพฤติกรรมที่ไม่ปลอดภัยมากกว่า ดู [ความปลอดภัย](/th/gateway/security)

    บริบทเพิ่มเติม: [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันจะสลับโมเดลโดยไม่ล้าง config ได้อย่างไร?">
    ใช้**คำสั่งโมเดล**หรือแก้ไขเฉพาะฟิลด์ **model** หลีกเลี่ยงการแทนที่ config ทั้งหมด

    ตัวเลือกที่ปลอดภัย:

    - `/model` ในแชต (รวดเร็ว ต่อเซสชัน)
    - `openclaw models set ...` (อัปเดตเฉพาะ config ของโมเดล)
    - `openclaw configure --section model` (โต้ตอบ)
    - แก้ไข `agents.defaults.model` ใน `~/.openclaw/openclaw.json`

    หลีกเลี่ยง `config.apply` พร้อมออบเจ็กต์บางส่วน เว้นแต่คุณตั้งใจจะแทนที่ config ทั้งหมด
    สำหรับการแก้ไขผ่าน RPC ให้ตรวจสอบด้วย `config.schema.lookup` ก่อนและควรใช้ `config.patch` เพย์โหลด lookup จะให้เส้นทางที่ normalize แล้ว เอกสาร/ข้อจำกัดของ schema แบบตื้น และสรุปลูกโดยตรง
    สำหรับการอัปเดตบางส่วน
    หากคุณเขียนทับ config แล้ว ให้กู้คืนจากข้อมูลสำรองหรือรัน `openclaw doctor` อีกครั้งเพื่อซ่อมแซม

    เอกสาร: [โมเดล](/th/concepts/models), [กำหนดค่า](/th/cli/configure), [Config](/th/cli/config), [Doctor](/th/gateway/doctor)

  </Accordion>

  <Accordion title="ฉันใช้โมเดลที่โฮสต์เองได้ไหม (llama.cpp, vLLM, Ollama)?">
    ได้ Ollama เป็นเส้นทางที่ง่ายที่สุดสำหรับโมเดลภายในเครื่อง

    การตั้งค่าที่เร็วที่สุด:

    1. ติดตั้ง Ollama จาก `https://ollama.com/download`
    2. ดึงโมเดลภายในเครื่อง เช่น `ollama pull gemma4`
    3. หากคุณต้องการโมเดลคลาวด์ด้วย ให้รัน `ollama signin`
    4. รัน `openclaw onboard` แล้วเลือก `Ollama`
    5. เลือก `Local` หรือ `Cloud + Local`

    หมายเหตุ:

    - `Cloud + Local` ให้คุณใช้ทั้งโมเดลคลาวด์และโมเดล Ollama ภายในเครื่องของคุณ
    - โมเดลคลาวด์ เช่น `kimi-k2.5:cloud` ไม่ต้องดึงลงเครื่อง
    - สำหรับการสลับด้วยตนเอง ให้ใช้ `openclaw models list` และ `openclaw models set ollama/<model>`

    หมายเหตุด้านความปลอดภัย: โมเดลขนาดเล็กหรือที่ถูกควอนไทซ์อย่างหนักมีความเสี่ยงต่อ prompt
    injection มากกว่า เราขอแนะนำอย่างยิ่งให้ใช้**โมเดลขนาดใหญ่**สำหรับบอตใดๆ ที่สามารถใช้เครื่องมือได้
    หากคุณยังต้องการใช้โมเดลขนาดเล็ก ให้เปิดใช้ sandboxing และรายการอนุญาตเครื่องมือที่เข้มงวด

    เอกสาร: [Ollama](/th/providers/ollama), [โมเดลภายในเครื่อง](/th/gateway/local-models),
    [ผู้ให้บริการโมเดล](/th/concepts/model-providers), [ความปลอดภัย](/th/gateway/security),
    [Sandboxing](/th/gateway/sandboxing)

  </Accordion>

  <Accordion title="OpenClaw, Flawd และ Krill ใช้โมเดลอะไร?">
    - ดีพลอยเมนต์เหล่านี้อาจแตกต่างกันและอาจเปลี่ยนแปลงได้ตามเวลา จึงไม่มีคำแนะนำผู้ให้บริการแบบตายตัว
    - ตรวจสอบการตั้งค่ารันไทม์ปัจจุบันบนแต่ละ Gateway ด้วย `openclaw models status`
    - สำหรับเอเจนต์ที่ไวต่อความปลอดภัย/เปิดใช้เครื่องมือ ให้ใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดที่มี

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

    รายการเหล่านี้เป็นนามแฝงในตัว สามารถเพิ่มนามแฝงแบบกำหนดเองผ่าน `agents.defaults.models`

    คุณสามารถแสดงรายการโมเดลที่มีได้ด้วย `/model`, `/model list` หรือ `/model status`

    `/model` (และ `/model list`) แสดงตัวเลือกแบบกะทัดรัดพร้อมหมายเลข เลือกด้วยหมายเลข:

    ```
    /model 3
    ```

    คุณยังสามารถบังคับใช้โปรไฟล์ auth เฉพาะสำหรับผู้ให้บริการ (ต่อเซสชัน):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    เคล็ดลับ: `/model status` แสดงว่าเอเจนต์ใดกำลังใช้งานอยู่ ไฟล์ `auth-profiles.json` ใดกำลังถูกใช้ และโปรไฟล์ auth ใดจะถูกลองถัดไป
    นอกจากนี้ยังแสดง endpoint ของผู้ให้บริการที่กำหนดค่าไว้ (`baseUrl`) และโหมด API (`api`) เมื่อมี

    **ฉันจะยกเลิกการปักหมุดโปรไฟล์ที่ตั้งด้วย @profile ได้อย่างไร?**

    รัน `/model` อีกครั้ง**โดยไม่มี**ส่วนต่อท้าย `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    หากคุณต้องการกลับไปใช้ค่าเริ่มต้น ให้เลือกจาก `/model` (หรือส่ง `/model <default provider/model>`)
    ใช้ `/model status` เพื่อยืนยันว่าโปรไฟล์ auth ใดกำลังใช้งานอยู่

  </Accordion>

  <Accordion title="หากผู้ให้บริการสองรายเปิดเผยรหัสโมเดลเดียวกัน /model จะใช้อันไหน?">
    `/model provider/model` เลือกเส้นทางผู้ให้บริการนั้นแบบตรงตัวสำหรับเซสชัน

    ตัวอย่างเช่น `qianfan/deepseek-v4-flash` และ `deepseek/deepseek-v4-flash` เป็นการอ้างอิงโมเดลที่ต่างกัน แม้ว่าทั้งคู่จะมี `deepseek-v4-flash` OpenClaw ไม่ควรสลับจากผู้ให้บริการหนึ่งไปยังอีกผู้ให้บริการหนึ่งแบบเงียบๆ เพียงเพราะรหัสโมเดลเปล่าตรงกัน

    การอ้างอิง `/model` ที่ผู้ใช้เลือกยังเข้มงวดสำหรับนโยบาย fallback ด้วย หากผู้ให้บริการ/โมเดลที่เลือกนั้นไม่พร้อมใช้งาน การตอบกลับจะล้มเหลวอย่างเห็นได้ชัด แทนที่จะตอบจาก `agents.defaults.model.fallbacks` เชน fallback ที่กำหนดค่าไว้ยังคงใช้กับค่าเริ่มต้นที่กำหนดค่าไว้ primary ของงาน cron และสถานะ fallback ที่เลือกอัตโนมัติ

    หากการรันที่เริ่มจากการ override ที่ไม่ใช่เซสชันได้รับอนุญาตให้ใช้ fallback OpenClaw จะลองผู้ให้บริการ/โมเดลที่ร้องขอก่อน จากนั้นจึงลอง fallback ที่กำหนดค่าไว้ และสุดท้ายจึงลอง primary ที่กำหนดค่าไว้ วิธีนี้ป้องกันไม่ให้รหัสโมเดลเปล่าที่ซ้ำกันกระโดดกลับไปยังผู้ให้บริการเริ่มต้นโดยตรง

    ดู [โมเดล](/th/concepts/models) และ [Model failover](/th/concepts/model-failover)

  </Accordion>

  <Accordion title="ฉันใช้ GPT 5.5 สำหรับงานประจำวัน และ Codex 5.5 สำหรับการเขียนโค้ดได้ไหม?">
    ได้ ให้แยกการเลือกโมเดลออกจากการเลือกรันไทม์:

    - **เอเจนต์เขียนโค้ด Codex แบบเนทีฟ:** ตั้ง `agents.defaults.model.primary` เป็น `openai/gpt-5.5` ลงชื่อเข้าใช้ด้วย `openclaw models auth login --provider openai` เมื่อคุณต้องการ auth แบบการสมัครสมาชิก ChatGPT/Codex
    - **งาน OpenAI API โดยตรงนอกลูปเอเจนต์:** กำหนดค่า `OPENAI_API_KEY` สำหรับรูปภาพ embeddings เสียง realtime และพื้นผิว OpenAI API อื่นๆ ที่ไม่ใช่เอเจนต์
    - **auth ด้วยคีย์ API สำหรับเอเจนต์ OpenAI:** ใช้ `/model openai/gpt-5.5` พร้อมโปรไฟล์คีย์ API ของ `openai` ที่เรียงลำดับไว้
    - **เอเจนต์ย่อย:** กำหนดเส้นทางงานเขียนโค้ดไปยังเอเจนต์ที่เน้น Codex พร้อมโมเดล `openai/gpt-5.5` ของตัวเอง

    ดู [โมเดล](/th/concepts/models) และ [คำสั่ง slash](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="ฉันจะกำหนดค่าโหมดเร็วสำหรับ GPT 5.5 ได้อย่างไร?">
    ใช้ได้ทั้ง toggle ของเซสชันหรือค่าเริ่มต้นใน config:

    - **ต่อเซสชัน:** ส่ง `/fast on` ขณะเซสชันกำลังใช้ `openai/gpt-5.5`
    - **ค่าเริ่มต้นต่อโมเดล:** ตั้ง `agents.defaults.models["openai/gpt-5.5"].params.fastMode` เป็น `true`
    - **จุดตัดอัตโนมัติ:** ใช้ `/fast auto` หรือ `params.fastMode: "auto"` เพื่อเริ่มการเรียกโมเดลใหม่แบบเร็วไปจนถึงจุดตัดอัตโนมัติ จากนั้นเริ่มการเรียก retry, fallback, ผลลัพธ์เครื่องมือ หรือ continuation ในภายหลังโดยไม่มีโหมดเร็ว จุดตัดมีค่าเริ่มต้นที่ 60 วินาที ตั้ง `params.fastAutoOnSeconds` บนโมเดลที่ใช้งานอยู่เพื่อเปลี่ยนค่า

    ตัวอย่าง:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: "auto",
                fastAutoOnSeconds: 30,
              },
            },
          },
        },
      },
    }
    ```

    สำหรับ OpenAI โหมดเร็วจะ map ไปยัง `service_tier = "priority"` บนคำขอ Responses แบบเนทีฟที่รองรับ การ override `/fast` ของเซสชันจะมีผลเหนือค่าเริ่มต้นใน config เทิร์นของ app-server ของ Codex รับ tier ได้เฉพาะตอนเริ่มเทิร์นเท่านั้น ดังนั้น `auto` จึงมีผลกับเทิร์นโมเดลถัดไปที่ OpenClaw เริ่ม แทนที่จะมีผลภายในเทิร์น app-server ที่กำลังรันอยู่แล้ว

    ดู [Thinking และโหมดเร็ว](/th/tools/thinking) และ [โหมดเร็วของ OpenAI](/th/providers/openai#fast-mode)

  </Accordion>

  <Accordion title='ทำไมฉันจึงเห็น "Model ... is not allowed" แล้วไม่มีการตอบกลับ?'>
    หากตั้งค่า `agents.defaults.models` ไว้ ค่านั้นจะกลายเป็น**รายการอนุญาต**สำหรับ `/model` และการ override ของ
    เซสชันใดๆ การเลือกโมเดลที่ไม่ได้อยู่ในรายการนั้นจะคืนค่า:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    ข้อผิดพลาดนั้นจะถูกส่งคืน**แทน**การตอบกลับปกติ วิธีแก้: เพิ่มโมเดลแบบตรงตัวลงใน
    `agents.defaults.models`, เพิ่ม wildcard ของผู้ให้บริการ เช่น `"provider/*": {}` สำหรับแค็ตตาล็อกผู้ให้บริการแบบไดนามิก ลบรายการอนุญาต หรือเลือกโมเดลจาก `/model list`
    หากคำสั่งรวม `--runtime codex` ด้วย ให้อัปเดตรายการอนุญาตก่อน แล้วลองคำสั่ง
    `/model provider/model --runtime codex` เดิมอีกครั้ง

  </Accordion>

  <Accordion title='ทำไมฉันจึงเห็น "Unknown model: minimax/MiniMax-M3"?'>
    หมายความว่า**ยังไม่ได้กำหนดค่าผู้ให้บริการ** (ไม่พบ config หรือโปรไฟล์ auth ของผู้ให้บริการ MiniMax)
    ดังนั้นจึง resolve โมเดลไม่ได้

    เช็กลิสต์การแก้ไข:

    1. อัปเกรดเป็น OpenClaw รุ่นปัจจุบัน (หรือรันจาก source `main`) แล้วรีสตาร์ต Gateway
    2. ตรวจสอบว่า MiniMax ถูกกำหนดค่าแล้ว (ผ่าน wizard หรือ JSON) หรือมี auth ของ MiniMax
       อยู่ใน env/โปรไฟล์ auth เพื่อให้สามารถฉีดผู้ให้บริการที่ตรงกันได้
       (`MINIMAX_API_KEY` สำหรับ `minimax`, `MINIMAX_OAUTH_TOKEN` หรือ MiniMax
       OAuth ที่จัดเก็บไว้สำหรับ `minimax-portal`)
    3. ใช้รหัสโมเดลแบบตรงตัว (คำนึงถึงตัวพิมพ์เล็กใหญ่) สำหรับเส้นทาง auth ของคุณ:
       `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` หรือ
       `minimax/MiniMax-M2.7-highspeed` สำหรับการตั้งค่าด้วยคีย์ API หรือ
       `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` หรือ
       `minimax-portal/MiniMax-M2.7-highspeed` สำหรับการตั้งค่าด้วย OAuth
    4. รัน:

       ```bash
       openclaw models list
       ```

       แล้วเลือกจากรายการ (หรือ `/model list` ในแชต)

    ดู [MiniMax](/th/providers/minimax) และ [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันใช้ MiniMax เป็นค่าเริ่มต้นและใช้ OpenAI สำหรับงานซับซ้อนได้ไหม?">
    ได้ ใช้**MiniMax เป็นค่าเริ่มต้น**และสลับโมเดล**ต่อเซสชัน**เมื่อต้องการ
    Fallback มีไว้สำหรับ**ข้อผิดพลาด** ไม่ใช่ “งานยาก” ดังนั้นให้ใช้ `/model` หรือเอเจนต์แยกต่างหาก

    **ตัวเลือก A: สลับต่อเซสชัน**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
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

    เอกสาร: [โมเดล](/th/concepts/models), [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent), [MiniMax](/th/providers/minimax), [OpenAI](/th/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt เป็นชอร์ตคัตในตัวหรือไม่?">
    ใช่ OpenClaw มาพร้อมชอร์ตแฮนด์เริ่มต้นบางรายการ (จะใช้เฉพาะเมื่อโมเดลนั้นมีอยู่ใน `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-8`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite`

    หากคุณตั้ง alias ของคุณเองด้วยชื่อเดียวกัน ค่าของคุณจะถูกใช้ก่อน

  </Accordion>

  <Accordion title="ฉันจะกำหนด/เขียนทับชอร์ตคัตโมเดล (aliases) ได้อย่างไร?">
    Aliases มาจาก `agents.defaults.models.<modelId>.alias` ตัวอย่าง:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
          },
        },
      },
    }
    ```

    จากนั้น `/model sonnet` (หรือ `/<alias>` เมื่อรองรับ) จะ resolve เป็น ID โมเดลนั้น

  </Accordion>

  <Accordion title="ฉันจะเพิ่มโมเดลจากผู้ให้บริการอื่น เช่น OpenRouter หรือ Z.AI ได้อย่างไร?">
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

    หากคุณอ้างอิงผู้ให้บริการ/โมเดล แต่ไม่มีคีย์ผู้ให้บริการที่จำเป็น คุณจะได้รับข้อผิดพลาด auth ขณะรัน (เช่น `No API key found for provider "zai"`)

    **ไม่พบคีย์ API สำหรับผู้ให้บริการหลังจากเพิ่มเอเจนต์ใหม่**

    โดยปกติหมายความว่า **เอเจนต์ใหม่** มี auth store ว่าง Auth เป็นแบบแยกตามเอเจนต์และ
    จัดเก็บไว้ใน:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    ตัวเลือกการแก้ไข:

    - รัน `openclaw agents add <id>` และกำหนดค่า auth ระหว่างวิซาร์ด
    - หรือคัดลอกเฉพาะโปรไฟล์ `api_key` / `token` แบบ static ที่พกพาได้จาก auth store ของเอเจนต์หลักไปยัง auth store ของเอเจนต์ใหม่
    - สำหรับโปรไฟล์ OAuth ให้ลงชื่อเข้าใช้จากเอเจนต์ใหม่เมื่อจำเป็นต้องใช้บัญชีของตัวเอง มิฉะนั้น OpenClaw สามารถอ่านผ่านไปยังเอเจนต์ default/main ได้โดยไม่ต้อง clone refresh token

    อย่าใช้ `agentDir` ซ้ำข้ามเอเจนต์ เพราะจะทำให้ auth/session ชนกัน

  </Accordion>
</AccordionGroup>

## การ failover ของโมเดลและ "All models failed"

<AccordionGroup>
  <Accordion title="failover ทำงานอย่างไร?">
    Failover เกิดขึ้นในสองขั้นตอน:

    1. **การหมุนเวียนโปรไฟล์ auth** ภายในผู้ให้บริการเดียวกัน
    2. **โมเดล fallback** ไปยังโมเดลถัดไปใน `agents.defaults.model.fallbacks`

    Cooldown จะใช้กับโปรไฟล์ที่ล้มเหลว (exponential backoff) เพื่อให้ OpenClaw ยังตอบสนองต่อไปได้แม้ผู้ให้บริการถูก rate limit หรือล้มเหลวชั่วคราว

    กลุ่ม rate-limit รวมมากกว่า response `429` ธรรมดา OpenClaw
    ยังถือว่าข้อความอย่าง `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` และขีดจำกัด
    usage-window เป็นระยะ (`weekly/monthly limit reached`) เป็น rate limit
    ที่ควร failover

    response บางรายการที่ดูเหมือน billing ไม่ใช่ `402` และ response HTTP `402`
    บางรายการก็ยังอยู่ในกลุ่มชั่วคราวนั้นเช่นกัน หากผู้ให้บริการส่งคืน
    ข้อความ billing ที่ชัดเจนบน `401` หรือ `403` OpenClaw ยังสามารถเก็บสิ่งนั้นไว้ใน
    lane ของ billing ได้ แต่ matcher ข้อความเฉพาะผู้ให้บริการจะยังถูกจำกัดขอบเขตไว้กับ
    ผู้ให้บริการที่เป็นเจ้าของ matcher นั้น (เช่น OpenRouter `Key limit exceeded`) หากข้อความ `402`
    กลับดูเหมือน usage-window ที่ลองใหม่ได้ หรือ
    ขีดจำกัดค่าใช้จ่ายของ organization/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) OpenClaw จะถือว่าเป็น
    `rate_limit` ไม่ใช่การปิดใช้งาน billing ระยะยาว

    ข้อผิดพลาด context-overflow จะแตกต่างออกไป: ลายเซ็นอย่าง
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` หรือ `ollama error: context length
    exceeded` จะยังอยู่บนเส้นทาง compaction/retry แทนที่จะเลื่อนไปยัง model
    fallback

    ข้อความ server-error ทั่วไปถูกตั้งใจให้แคบกว่า "อะไรก็ตามที่มี
    unknown/error อยู่ในนั้น" OpenClaw จะถือว่า transient shape ที่อยู่ในขอบเขตผู้ให้บริการ
    เช่น Anthropic แบบเปล่า `An unknown error occurred`, OpenRouter แบบเปล่า
    `Provider returned error`, ข้อผิดพลาด stop-reason เช่น `Unhandled stop reason:
    error`, payload JSON `api_error` ที่มีข้อความเซิร์ฟเวอร์ชั่วคราว
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) และข้อผิดพลาดผู้ให้บริการไม่ว่าง เช่น `ModelNotReadyException` เป็น
    สัญญาณ timeout/overloaded ที่ควร failover เมื่อบริบทผู้ให้บริการ
    ตรงกัน
    ข้อความ fallback ภายในทั่วไปอย่าง `LLM request failed with an unknown
    error.` จะยังคงระมัดระวังและไม่ trigger model fallback ด้วยตัวเอง

  </Accordion>

  <Accordion title='ข้อความ "No credentials found for profile anthropic:default" หมายความว่าอะไร?'>
    หมายความว่าระบบพยายามใช้ ID โปรไฟล์ auth `anthropic:default` แต่ไม่พบ credentials ของโปรไฟล์นั้นใน auth store ที่คาดไว้

    **เช็กลิสต์การแก้ไข:**

    - **ยืนยันว่าโปรไฟล์ auth อยู่ที่ใด** (พาธใหม่เทียบกับพาธ legacy)
      - ปัจจุบัน: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legacy: `~/.openclaw/agent/*` (ย้ายโดย `openclaw doctor`)
    - **ยืนยันว่า env var ของคุณถูกโหลดโดย Gateway**
      - หากคุณตั้ง `ANTHROPIC_API_KEY` ใน shell แต่รัน Gateway ผ่าน systemd/launchd มันอาจไม่สืบทอดค่านั้น ให้ใส่ไว้ใน `~/.openclaw/.env` หรือเปิดใช้ `env.shellEnv`
    - **ตรวจให้แน่ใจว่าคุณกำลังแก้ไขเอเจนต์ที่ถูกต้อง**
      - การตั้งค่าแบบหลายเอเจนต์หมายความว่าอาจมีไฟล์ `auth-profiles.json` หลายไฟล์
    - **ตรวจสอบสถานะโมเดล/auth แบบคร่าว ๆ**
      - ใช้ `openclaw models status` เพื่อดูโมเดลที่กำหนดค่าไว้และดูว่าผู้ให้บริการ authenticated แล้วหรือไม่

    **เช็กลิสต์การแก้ไขสำหรับ "No credentials found for profile anthropic"**

    หมายความว่ารันนี้ถูกตรึงไว้กับโปรไฟล์ auth ของ Anthropic แต่ Gateway
    หาโปรไฟล์นั้นไม่พบใน auth store ของตัวเอง

    - **ใช้ Claude CLI**
      - รัน `openclaw models auth login --provider anthropic --method cli --set-default` บนโฮสต์ Gateway
    - **หากคุณต้องการใช้คีย์ API แทน**
      - ใส่ `ANTHROPIC_API_KEY` ใน `~/.openclaw/.env` บน **โฮสต์ Gateway**
      - ล้างลำดับที่ตรึงไว้ซึ่งบังคับให้ใช้โปรไฟล์ที่หายไป:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **ยืนยันว่าคุณกำลังรันคำสั่งบนโฮสต์ Gateway**
      - ในโหมดระยะไกล โปรไฟล์ auth จะอยู่บนเครื่อง Gateway ไม่ใช่แล็ปท็อปของคุณ

  </Accordion>

  <Accordion title="ทำไมจึงลอง Google Gemini แล้วล้มเหลวด้วย?">
    หาก config โมเดลของคุณรวม Google Gemini เป็น fallback (หรือคุณสลับไปใช้ชอร์ตแฮนด์ Gemini) OpenClaw จะลองใช้ระหว่าง model fallback หากคุณยังไม่ได้กำหนดค่า credentials ของ Google คุณจะเห็น `No API key found for provider "google"`

    การแก้ไข: ให้ใส่ Google auth หรือเอา/หลีกเลี่ยงโมเดล Google ใน `agents.defaults.model.fallbacks` / aliases เพื่อไม่ให้ fallback route ไปที่นั่น

    **LLM request rejected: thinking signature required (Google Antigravity)**

    สาเหตุ: ประวัติเซสชันมี **thinking blocks without signatures** (มักมาจาก
    stream ที่ถูกยกเลิก/บางส่วน) Google Antigravity ต้องใช้ signatures สำหรับ thinking blocks

    การแก้ไข: ตอนนี้ OpenClaw จะตัด thinking blocks ที่ไม่มีลายเซ็นออกสำหรับ Google Antigravity Claude หากยังปรากฏอยู่ ให้เริ่ม **เซสชันใหม่** หรือตั้ง `/thinking off` สำหรับเอเจนต์นั้น

  </Accordion>
</AccordionGroup>

## โปรไฟล์ auth: คืออะไรและจัดการอย่างไร

ที่เกี่ยวข้อง: [/concepts/oauth](/th/concepts/oauth) (โฟลว์ OAuth, การจัดเก็บ token, รูปแบบหลายบัญชี)

<AccordionGroup>
  <Accordion title="โปรไฟล์ auth คืออะไร?">
    โปรไฟล์ auth คือระเบียน credential ที่มีชื่อ (OAuth หรือคีย์ API) ซึ่งผูกกับผู้ให้บริการ โปรไฟล์อยู่ใน:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    หากต้องการตรวจสอบโปรไฟล์ที่บันทึกไว้โดยไม่ dump secrets ให้รัน `openclaw models auth list` (เลือกใช้ `--provider <id>` หรือ `--json` ได้) ดูรายละเอียดที่ [CLI โมเดล](/th/cli/models#auth-profiles)

  </Accordion>

  <Accordion title="ID โปรไฟล์โดยทั่วไปเป็นแบบใด?">
    OpenClaw ใช้ ID ที่มี prefix ผู้ให้บริการ เช่น:

    - `anthropic:default` (พบได้ทั่วไปเมื่อไม่มี identity อีเมล)
    - `anthropic:<email>` สำหรับ identity OAuth
    - ID กำหนดเองที่คุณเลือก (เช่น `anthropic:work`)

  </Accordion>

  <Accordion title="ฉันควบคุมได้ไหมว่าจะลองโปรไฟล์ auth ใดก่อน?">
    ได้ Config รองรับ metadata ทางเลือกสำหรับโปรไฟล์และการจัดลำดับต่อผู้ให้บริการ (`auth.order.<provider>`) สิ่งนี้ **ไม่** จัดเก็บ secrets แต่จะ map ID ไปยังผู้ให้บริการ/mode และตั้งลำดับการหมุนเวียน

    OpenClaw อาจข้ามโปรไฟล์ชั่วคราวหากอยู่ใน **cooldown** ระยะสั้น (rate limits/timeouts/auth failures) หรือสถานะ **disabled** ที่นานกว่า (billing/credits ไม่เพียงพอ) หากต้องการตรวจสอบ ให้รัน `openclaw models status --json` และดู `auth.unusableProfiles` การปรับแต่ง: `auth.cooldowns.billingBackoffHours*`

    Cooldown ของ rate-limit สามารถจำกัดตามโมเดลได้ โปรไฟล์ที่กำลัง cooling down
    สำหรับโมเดลหนึ่งยังอาจใช้งานได้กับโมเดล sibling บนผู้ให้บริการเดียวกัน
    ขณะที่หน้าต่าง billing/disabled ยังบล็อกทั้งโปรไฟล์

    คุณยังสามารถตั้งการ override ลำดับแบบ **ต่อเอเจนต์** (จัดเก็บใน `auth-state.json` ของเอเจนต์นั้น) ผ่าน CLI:

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

    หากต้องการ target เอเจนต์เฉพาะ:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    หากต้องการตรวจสอบว่าจะลองใช้อะไรจริง ให้ใช้:

    ```bash
    openclaw models status --probe
    ```

    หากโปรไฟล์ที่จัดเก็บไว้ถูกละเว้นจากลำดับที่ระบุอย่างชัดเจน probe จะรายงาน
    `excluded_by_auth_order` สำหรับโปรไฟล์นั้นแทนที่จะลองใช้อย่างเงียบ ๆ

  </Accordion>

  <Accordion title="OAuth กับคีย์ API ต่างกันอย่างไร?">
    OpenClaw รองรับทั้งสองแบบ:

    - **OAuth / CLI login** มักใช้สิทธิ์จาก subscription เมื่อ
      ผู้ให้บริการรองรับ สำหรับ Anthropic backend Claude CLI ของ OpenClaw ใช้
      Claude Code `claude -p`; ขณะนี้ Anthropic ถือว่าสิ่งนั้นเป็นการใช้งาน Agent
      SDK/programmatic โดยมีเครดิต Agent SDK รายเดือนแยกต่างหากตั้งแต่
      15 มิถุนายน 2026
    - **คีย์ API** ใช้การคิดค่าบริการแบบจ่ายตามโทเค็น

    วิซาร์ดรองรับ Anthropic Claude CLI, OpenAI Codex OAuth และคีย์ API อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [FAQ](/th/help/faq) — FAQ หลัก
- [FAQ — การเริ่มต้นอย่างรวดเร็วและการตั้งค่าครั้งแรก](/th/help/faq-first-run)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [Model failover](/th/concepts/model-failover)
