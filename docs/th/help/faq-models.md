---
read_when:
    - การเลือกหรือสลับโมเดล การกำหนดค่านามแฝง
    - การดีบักการสลับโมเดลเมื่อเกิดข้อผิดพลาด / "โมเดลทั้งหมดล้มเหลว"
    - ทำความเข้าใจโปรไฟล์การยืนยันตัวตนและวิธีจัดการ
sidebarTitle: Models FAQ
summary: 'คำถามที่พบบ่อย: ค่าเริ่มต้นของโมเดล การเลือก นามแฝง การสลับ การสลับเมื่อเกิดข้อขัดข้อง และโปรไฟล์การยืนยันตัวตน'
title: 'คำถามที่พบบ่อย: โมเดลและการยืนยันตัวตน'
x-i18n:
    generated_at: "2026-06-28T20:43:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3bfff016fc8b5afff5dde2b939b7fa431aa5a0309aa2833e7dd4675b638ca225
    source_path: help/faq-models.md
    workflow: 16
---

  ถาม-ตอบเรื่องโมเดลและโปรไฟล์การตรวจสอบสิทธิ์ สำหรับการตั้งค่า เซสชัน Gateway ช่องทาง และ
  การแก้ปัญหา โปรดดู [คำถามที่พบบ่อย](/th/help/faq) หลัก

  ## โมเดล: ค่าเริ่มต้น การเลือก นามแฝง การสลับ

  <AccordionGroup>
  <Accordion title='“โมเดลเริ่มต้น” คืออะไร?'>
    โมเดลเริ่มต้นของ OpenClaw คือค่าที่คุณตั้งไว้เป็น:

    ```
    agents.defaults.model.primary
    ```

    โมเดลอ้างอิงในรูปแบบ `provider/model` (ตัวอย่าง: `openai/gpt-5.5` หรือ `anthropic/claude-sonnet-4-6`) หากคุณละผู้ให้บริการไว้ OpenClaw จะลองใช้นามแฝงก่อน จากนั้นจึงลองจับคู่ผู้ให้บริการที่กำหนดค่าไว้แบบไม่ซ้ำสำหรับรหัสโมเดลนั้นแบบตรงตัว และหลังจากนั้นจึงค่อยถอยกลับไปใช้ผู้ให้บริการเริ่มต้นที่กำหนดค่าไว้เป็นเส้นทางความเข้ากันได้แบบเลิกใช้แล้ว หากผู้ให้บริการนั้นไม่เปิดเผยโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะถอยกลับไปใช้คู่ผู้ให้บริการ/โมเดลที่กำหนดค่าไว้รายการแรก แทนที่จะแสดงค่าเริ่มต้นของผู้ให้บริการเก่าที่ถูกลบแล้ว คุณยังควรตั้งค่า `provider/model` **อย่างชัดเจน**

  </Accordion>

  <Accordion title="คุณแนะนำโมเดลใด?">
    **ค่าเริ่มต้นที่แนะนำ:** ใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดที่มีอยู่ในชุดผู้ให้บริการของคุณ
    **สำหรับเอเจนต์ที่ใช้เครื่องมือได้หรือรับอินพุตที่ไม่น่าเชื่อถือ:** ให้ความสำคัญกับความแข็งแกร่งของโมเดลมากกว่าต้นทุน
    **สำหรับแชตงานประจำ/ความเสี่ยงต่ำ:** ใช้โมเดลสำรองที่ถูกกว่าและกำหนดเส้นทางตามบทบาทเอเจนต์

    MiniMax มีเอกสารของตัวเอง: [MiniMax](/th/providers/minimax) และ
    [โมเดลในเครื่อง](/th/gateway/local-models)

    หลักทั่วไป: ใช้ **โมเดลที่ดีที่สุดที่คุณจ่ายไหว** สำหรับงานที่มีความเสี่ยงสูง และใช้โมเดลที่ถูกกว่า
    สำหรับแชตหรืองานสรุปตามปกติ คุณสามารถกำหนดเส้นทางโมเดลต่อเอเจนต์ และใช้เอเจนต์ย่อยเพื่อ
    ทำงานยาวแบบขนานได้ (เอเจนต์ย่อยแต่ละตัวใช้โทเค็น) ดู [โมเดล](/th/concepts/models) และ
    [เอเจนต์ย่อย](/th/tools/subagents)

    คำเตือนสำคัญ: โมเดลที่อ่อนกว่า/ถูกควอนไทซ์มากเกินไปเสี่ยงต่อ prompt
    injection และพฤติกรรมที่ไม่ปลอดภัยมากกว่า ดู [ความปลอดภัย](/th/gateway/security)

    บริบทเพิ่มเติม: [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันจะสลับโมเดลโดยไม่ล้างการกำหนดค่าของฉันได้อย่างไร?">
    ใช้ **คำสั่งโมเดล** หรือแก้เฉพาะฟิลด์ **model** หลีกเลี่ยงการแทนที่การกำหนดค่าทั้งหมด

    ตัวเลือกที่ปลอดภัย:

    - `/model` ในแชต (รวดเร็ว ต่อเซสชัน)
    - `openclaw models set ...` (อัปเดตเฉพาะการกำหนดค่าโมเดล)
    - `openclaw configure --section model` (แบบโต้ตอบ)
    - แก้ `agents.defaults.model` ใน `~/.openclaw/openclaw.json`

    หลีกเลี่ยง `config.apply` กับอ็อบเจกต์บางส่วน เว้นแต่คุณต้องการแทนที่การกำหนดค่าทั้งหมด
    สำหรับการแก้ไขผ่าน RPC ให้ตรวจด้วย `config.schema.lookup` ก่อน และควรใช้ `config.patch` เพย์โหลด lookup จะให้พาธที่ผ่านการทำให้เป็นมาตรฐาน เอกสาร/ข้อจำกัดของสคีมาแบบตื้น และสรุปลูกโดยตรง
    สำหรับการอัปเดตบางส่วน
    หากคุณเขียนทับการกำหนดค่าไปแล้ว ให้กู้คืนจากข้อมูลสำรองหรือรัน `openclaw doctor` อีกครั้งเพื่อซ่อมแซม

    เอกสาร: [โมเดล](/th/concepts/models), [กำหนดค่า](/th/cli/configure), [การกำหนดค่า](/th/cli/config), [Doctor](/th/gateway/doctor)

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

    - `Cloud + Local` ให้ทั้งโมเดลบนคลาวด์และโมเดล Ollama ในเครื่องของคุณ
    - โมเดลบนคลาวด์ เช่น `kimi-k2.5:cloud` ไม่ต้องดึงลงเครื่อง
    - สำหรับการสลับด้วยตนเอง ให้ใช้ `openclaw models list` และ `openclaw models set ollama/<model>`

    หมายเหตุด้านความปลอดภัย: โมเดลที่เล็กกว่าหรือถูกควอนไทซ์หนักมีความเสี่ยงต่อ prompt
    injection มากกว่า เราแนะนำอย่างยิ่งให้ใช้ **โมเดลขนาดใหญ่** สำหรับบอตใด ๆ ที่ใช้เครื่องมือได้
    หากคุณยังต้องการใช้โมเดลขนาดเล็ก ให้เปิดใช้แซนด์บ็อกซ์และรายการอนุญาตเครื่องมือที่เข้มงวด

    เอกสาร: [Ollama](/th/providers/ollama), [โมเดลในเครื่อง](/th/gateway/local-models),
    [ผู้ให้บริการโมเดล](/th/concepts/model-providers), [ความปลอดภัย](/th/gateway/security),
    [แซนด์บ็อกซ์](/th/gateway/sandboxing)

  </Accordion>

  <Accordion title="OpenClaw, Flawd และ Krill ใช้โมเดลอะไร?">
    - การปรับใช้งานเหล่านี้อาจแตกต่างกันและอาจเปลี่ยนแปลงได้ตามเวลา จึงไม่มีคำแนะนำผู้ให้บริการแบบตายตัว
    - ตรวจการตั้งค่ารันไทม์ปัจจุบันในแต่ละ Gateway ด้วย `openclaw models status`
    - สำหรับเอเจนต์ที่อ่อนไหวด้านความปลอดภัย/ใช้เครื่องมือได้ ให้ใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดที่มีอยู่

  </Accordion>

  <Accordion title="ฉันจะสลับโมเดลระหว่างใช้งานได้อย่างไร (โดยไม่รีสตาร์ต)?">
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

    เหล่านี้คือนามแฝงในตัว สามารถเพิ่มนามแฝงกำหนดเองได้ผ่าน `agents.defaults.models`

    คุณสามารถแสดงรายการโมเดลที่มีได้ด้วย `/model`, `/model list` หรือ `/model status`

    `/model` (และ `/model list`) แสดงตัวเลือกแบบกะทัดรัดพร้อมหมายเลข เลือกด้วยหมายเลข:

    ```
    /model 3
    ```

    คุณยังสามารถบังคับใช้โปรไฟล์การตรวจสอบสิทธิ์เฉพาะสำหรับผู้ให้บริการได้ (ต่อเซสชัน):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    เคล็ดลับ: `/model status` แสดงว่าเอเจนต์ใดกำลังใช้งานอยู่ กำลังใช้ไฟล์ `auth-profiles.json` ใด และจะลองใช้โปรไฟล์การตรวจสอบสิทธิ์ใดถัดไป
    นอกจากนี้ยังแสดงปลายทางผู้ให้บริการที่กำหนดค่าไว้ (`baseUrl`) และโหมด API (`api`) เมื่อมีให้ใช้

    **ฉันจะเลิกปักหมุดโปรไฟล์ที่ตั้งด้วย @profile ได้อย่างไร?**

    รัน `/model` อีกครั้ง **โดยไม่ใส่** ส่วนต่อท้าย `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    หากคุณต้องการกลับไปใช้ค่าเริ่มต้น ให้เลือกจาก `/model` (หรือส่ง `/model <default provider/model>`)
    ใช้ `/model status` เพื่อยืนยันว่าโปรไฟล์การตรวจสอบสิทธิ์ใดกำลังใช้งานอยู่

  </Accordion>

  <Accordion title="หากผู้ให้บริการสองรายเปิดเผยรหัสโมเดลเดียวกัน /model จะใช้รายใด?">
    `/model provider/model` เลือกเส้นทางผู้ให้บริการนั้นแบบตรงตัวสำหรับเซสชัน

    ตัวอย่างเช่น `qianfan/deepseek-v4-flash` และ `deepseek/deepseek-v4-flash` เป็นการอ้างอิงโมเดลคนละตัว แม้ว่าทั้งคู่จะมี `deepseek-v4-flash` อยู่ก็ตาม OpenClaw ไม่ควรสลับจากผู้ให้บริการหนึ่งไปอีกผู้ให้บริการหนึ่งแบบเงียบ ๆ เพียงเพราะรหัสโมเดลเปล่าตรงกัน

    การอ้างอิง `/model` ที่ผู้ใช้เลือกยังเข้มงวดกับนโยบาย fallback ด้วย หากผู้ให้บริการ/โมเดลที่เลือกนั้นใช้ไม่ได้ การตอบกลับจะล้มเหลวให้เห็นชัด แทนที่จะตอบจาก `agents.defaults.model.fallbacks` เชน fallback ที่กำหนดค่าไว้ยังคงใช้กับค่าเริ่มต้นที่กำหนดค่าไว้ โมเดลหลักของงาน Cron และสถานะ fallback ที่เลือกอัตโนมัติ

    หากการรันที่เริ่มจากการแทนที่ที่ไม่ใช่เซสชันได้รับอนุญาตให้ใช้ fallback OpenClaw จะลองผู้ให้บริการ/โมเดลที่ร้องขอก่อน จากนั้นจึงลอง fallback ที่กำหนดค่าไว้ และหลังจากนั้นจึงค่อยลองโมเดลหลักที่กำหนดค่าไว้ วิธีนี้ป้องกันไม่ให้รหัสโมเดลเปล่าที่ซ้ำกันกระโดดกลับไปยังผู้ให้บริการเริ่มต้นโดยตรง

    ดู [โมเดล](/th/concepts/models) และ [การสลับเมื่อโมเดลล้มเหลว](/th/concepts/model-failover)

  </Accordion>

  <Accordion title="ฉันใช้ GPT 5.5 สำหรับงานประจำวันและ Codex 5.5 สำหรับการเขียนโค้ดได้ไหม?">
    ได้ ให้แยกการเลือกโมเดลและการเลือกรันไทม์ออกจากกัน:

    - **เอเจนต์เขียนโค้ด Codex แบบเนทีฟ:** ตั้ง `agents.defaults.model.primary` เป็น `openai/gpt-5.5` ลงชื่อเข้าใช้ด้วย `openclaw models auth login --provider openai` เมื่อต้องการใช้การตรวจสอบสิทธิ์จากการสมัครสมาชิก ChatGPT/Codex
    - **งาน OpenAI API โดยตรงนอกลูปเอเจนต์:** กำหนดค่า `OPENAI_API_KEY` สำหรับรูปภาพ embeddings เสียง realtime และพื้นผิว OpenAI API อื่นที่ไม่ใช่เอเจนต์
    - **การตรวจสอบสิทธิ์เอเจนต์ OpenAI ด้วย API key:** ใช้ `/model openai/gpt-5.5` กับโปรไฟล์ API key ของ `openai` ที่มีลำดับ
    - **เอเจนต์ย่อย:** กำหนดเส้นทางงานเขียนโค้ดไปยังเอเจนต์ที่เน้น Codex พร้อมโมเดล `openai/gpt-5.5` ของตัวเอง

    ดู [โมเดล](/th/concepts/models) และ [คำสั่งสแลช](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="ฉันจะกำหนดค่าโหมดเร็วสำหรับ GPT 5.5 ได้อย่างไร?">
    ใช้ได้ทั้งตัวสลับต่อเซสชันหรือค่าเริ่มต้นในการกำหนดค่า:

    - **ต่อเซสชัน:** ส่ง `/fast on` ขณะที่เซสชันกำลังใช้ `openai/gpt-5.5`
    - **ค่าเริ่มต้นต่อโมเดล:** ตั้ง `agents.defaults.models["openai/gpt-5.5"].params.fastMode` เป็น `true`
    - **จุดตัดอัตโนมัติ:** ใช้ `/fast auto` หรือ `params.fastMode: "auto"` เพื่อเริ่มการเรียกโมเดลใหม่แบบเร็วไปจนถึงจุดตัดอัตโนมัติ จากนั้นเริ่มการลองใหม่ fallback ผลลัพธ์เครื่องมือ หรือการเรียกต่อเนื่องภายหลังโดยไม่ใช้โหมดเร็ว ค่าเริ่มต้นของจุดตัดคือ 60 วินาที ตั้ง `params.fastAutoOnSeconds` บนโมเดลที่ใช้งานอยู่เพื่อเปลี่ยนค่านี้

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

    สำหรับ OpenAI โหมดเร็วแมปเป็น `service_tier = "priority"` บนคำขอ Responses แบบเนทีฟที่รองรับ การแทนที่ด้วย `/fast` ของเซสชันมีลำดับเหนือค่าเริ่มต้นในการกำหนดค่า เทิร์นของ app-server ของ Codex รับระดับได้เฉพาะตอนเริ่มเทิร์น ดังนั้น `auto` จึงมีผลกับเทิร์นโมเดลถัดไปที่ OpenClaw เริ่ม แทนที่จะมีผลภายในเทิร์น app-server ที่กำลังรันอยู่แล้ว

    ดู [Thinking และโหมดเร็ว](/th/tools/thinking) และ [โหมดเร็วของ OpenAI](/th/providers/openai#fast-mode)

  </Accordion>

  <Accordion title='ทำไมฉันเห็น "Model ... is not allowed" แล้วไม่มีคำตอบ?'>
    หากตั้งค่า `agents.defaults.models` ไว้ ค่านั้นจะกลายเป็น **รายการอนุญาต** สำหรับ `/model` และการแทนที่ใด ๆ
    ในเซสชัน การเลือกโมเดลที่ไม่อยู่ในรายการนั้นจะส่งคืน:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    ข้อผิดพลาดนั้นถูกส่งคืน **แทน** คำตอบปกติ วิธีแก้: เพิ่มโมเดลแบบตรงตัวลงใน
    `agents.defaults.models` เพิ่มไวลด์การ์ดผู้ให้บริการ เช่น `"provider/*": {}` สำหรับแค็ตตาล็อกผู้ให้บริการแบบไดนามิก ลบรายการอนุญาต หรือเลือกโมเดลจาก `/model list`
    หากคำสั่งมี `--runtime codex` ด้วย ให้อัปเดตรายการอนุญาตก่อน แล้วจึงลองคำสั่ง
    `/model provider/model --runtime codex` เดิมอีกครั้ง

  </Accordion>

  <Accordion title='ทำไมฉันเห็น "Unknown model: minimax/MiniMax-M3"?'>
    นี่หมายความว่า **ยังไม่ได้กำหนดค่าผู้ให้บริการ** (ไม่พบการกำหนดค่าผู้ให้บริการ MiniMax หรือโปรไฟล์การตรวจสอบสิทธิ์)
    ดังนั้นจึงไม่สามารถระบุโมเดลได้

    เช็กลิสต์การแก้ไข:

    1. อัปเกรดเป็น OpenClaw รุ่นปัจจุบัน (หรือรันจากซอร์ส `main`) แล้วรีสตาร์ต Gateway
    2. ตรวจให้แน่ใจว่ากำหนดค่า MiniMax แล้ว (วิซาร์ดหรือ JSON) หรือมีการตรวจสอบสิทธิ์ MiniMax
       อยู่ใน env/โปรไฟล์การตรวจสอบสิทธิ์ เพื่อให้สามารถฉีดผู้ให้บริการที่ตรงกันได้
       (`MINIMAX_API_KEY` สำหรับ `minimax`, `MINIMAX_OAUTH_TOKEN` หรือ OAuth ของ MiniMax
       ที่จัดเก็บไว้สำหรับ `minimax-portal`)
    3. ใช้รหัสโมเดลแบบตรงตัว (คำนึงถึงตัวพิมพ์เล็ก/ใหญ่) สำหรับเส้นทางการตรวจสอบสิทธิ์ของคุณ:
       `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` หรือ
       `minimax/MiniMax-M2.7-highspeed` สำหรับการตั้งค่าด้วย API key หรือ
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
    ได้ ใช้ **MiniMax เป็นค่าเริ่มต้น** และสลับโมเดล **ต่อเซสชัน** เมื่อต้องการ
    Fallback มีไว้สำหรับ **ข้อผิดพลาด** ไม่ใช่ “งานยาก” ดังนั้นให้ใช้ `/model` หรือเอเจนต์แยกต่างหาก

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
    ใช่ OpenClaw มาพร้อมชอร์ตแฮนด์เริ่มต้นบางรายการ (ใช้เฉพาะเมื่อโมเดลมีอยู่ใน `agents.defaults.models`):

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

  <Accordion title="ฉันจะกำหนด/เขียนทับชอร์ตคัตโมเดล (alias) ได้อย่างไร?">
    Alias มาจาก `agents.defaults.models.<modelId>.alias` ตัวอย่าง:

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

  <Accordion title="ฉันจะเพิ่มโมเดลจากผู้ให้บริการอื่นอย่าง OpenRouter หรือ Z.AI ได้อย่างไร?">
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

    **ไม่พบ API key สำหรับผู้ให้บริการหลังจากเพิ่มเอเจนต์ใหม่**

    โดยปกติหมายความว่า **เอเจนต์ใหม่** มีที่เก็บ auth ว่างเปล่า Auth เป็นแบบแยกต่อเอเจนต์และ
    จัดเก็บไว้ใน:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    ตัวเลือกการแก้ไข:

    - รัน `openclaw agents add <id>` และกำหนดค่า auth ระหว่างวิซาร์ด
    - หรือคัดลอกเฉพาะโปรไฟล์ `api_key` / `token` แบบ static ที่พกพาได้จากที่เก็บ auth ของเอเจนต์หลักไปยังที่เก็บ auth ของเอเจนต์ใหม่
    - สำหรับโปรไฟล์ OAuth ให้ลงชื่อเข้าใช้จากเอเจนต์ใหม่เมื่อเอเจนต์นั้นต้องใช้บัญชีของตนเอง มิฉะนั้น OpenClaw สามารถอ่านต่อไปยังเอเจนต์เริ่มต้น/หลักได้โดยไม่ต้องโคลน refresh token

    อย่าใช้ `agentDir` ซ้ำข้ามเอเจนต์ เพราะจะทำให้ auth/session ชนกัน

  </Accordion>
</AccordionGroup>

## การ failover โมเดลและ "All models failed"

<AccordionGroup>
  <Accordion title="failover ทำงานอย่างไร?">
    Failover เกิดขึ้นสองขั้นตอน:

    1. **การหมุนเวียนโปรไฟล์ auth** ภายในผู้ให้บริการเดียวกัน
    2. **การ fallback โมเดล** ไปยังโมเดลถัดไปใน `agents.defaults.model.fallbacks`

    Cooldown ใช้กับโปรไฟล์ที่ล้มเหลว (exponential backoff) ดังนั้น OpenClaw จึงยังตอบสนองได้แม้ผู้ให้บริการถูกจำกัดอัตราหรือขัดข้องชั่วคราว

    บักเก็ต rate-limit ครอบคลุมมากกว่าการตอบกลับ `429` ทั่วไป OpenClaw
    ยังถือว่าข้อความอย่าง `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` และขีดจำกัด
    usage-window เป็นช่วง (`weekly/monthly limit reached`) เป็น rate limit
    ที่ควร failover

    การตอบกลับบางอย่างที่ดูเหมือน billing ไม่ใช่ `402` และการตอบกลับ HTTP `402`
    บางรายการก็ยังอยู่ในบักเก็ตชั่วคราวนั้นด้วย หากผู้ให้บริการส่งคืนข้อความ
    billing แบบชัดเจนบน `401` หรือ `403` OpenClaw ยังสามารถเก็บสิ่งนั้นไว้ใน
    เลน billing ได้ แต่ตัวจับคู่ข้อความเฉพาะผู้ให้บริการจะยังจำกัดขอบเขตอยู่กับ
    ผู้ให้บริการที่เป็นเจ้าของมัน (เช่น OpenRouter `Key limit exceeded`) หากข้อความ `402`
    ดูเหมือน usage-window ที่ retry ได้ หรือขีดจำกัดการใช้จ่ายของ
    องค์กร/เวิร์กสเปซแทน (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) OpenClaw จะถือว่าเป็น
    `rate_limit` ไม่ใช่การปิดใช้งาน billing ระยะยาว

    ข้อผิดพลาด context-overflow แตกต่างออกไป: signature เช่น
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` หรือ `ollama error: context length
    exceeded` จะอยู่บนเส้นทาง Compaction/retry แทนที่จะเลื่อนไปยัง model
    fallback

    ข้อความ server-error ทั่วไปตั้งใจให้แคบกว่า "อะไรก็ตามที่มี
    unknown/error อยู่ในนั้น" OpenClaw ถือว่า shape ชั่วคราวที่จำกัดตามผู้ให้บริการ
    เช่น Anthropic แบบสั้น `An unknown error occurred`, OpenRouter แบบสั้น
    `Provider returned error`, ข้อผิดพลาด stop-reason เช่น `Unhandled stop reason:
    error`, payload JSON `api_error` ที่มีข้อความเซิร์ฟเวอร์ชั่วคราว
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) และข้อผิดพลาด provider-busy เช่น `ModelNotReadyException` เป็น
    สัญญาณ timeout/overloaded ที่ควร failover เมื่อบริบทผู้ให้บริการ
    ตรงกัน
    ข้อความ fallback ภายในทั่วไปอย่าง `LLM request failed with an unknown
    error.` จะยังคงตีความแบบระมัดระวังและไม่ trigger model fallback ด้วยตัวเอง

  </Accordion>

  <Accordion title=' "No credentials found for profile anthropic:default" หมายความว่าอย่างไร?'>
    หมายความว่าระบบพยายามใช้ ID โปรไฟล์ auth `anthropic:default` แต่ไม่พบ credentials สำหรับโปรไฟล์นั้นในที่เก็บ auth ที่คาดไว้

    **เช็กลิสต์การแก้ไข:**

    - **ยืนยันว่าโปรไฟล์ auth อยู่ที่ไหน** (พาธใหม่เทียบกับพาธ legacy)
      - ปัจจุบัน: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legacy: `~/.openclaw/agent/*` (ย้ายโดย `openclaw doctor`)
    - **ยืนยันว่า env var ของคุณถูกโหลดโดย Gateway**
      - หากคุณตั้ง `ANTHROPIC_API_KEY` ใน shell แต่รัน Gateway ผ่าน systemd/launchd อาจไม่ได้ inherit ค่าไว้ ให้ใส่ไว้ใน `~/.openclaw/.env` หรือเปิดใช้ `env.shellEnv`
    - **ตรวจให้แน่ใจว่าคุณกำลังแก้ไขเอเจนต์ที่ถูกต้อง**
      - การตั้งค่าหลายเอเจนต์หมายความว่าอาจมีไฟล์ `auth-profiles.json` หลายไฟล์
    - **ตรวจสถานะโมเดล/auth แบบคร่าว ๆ**
      - ใช้ `openclaw models status` เพื่อดูโมเดลที่กำหนดค่าไว้และดูว่าผู้ให้บริการ authenticated แล้วหรือไม่

    **เช็กลิสต์การแก้ไขสำหรับ "No credentials found for profile anthropic"**

    หมายความว่าการรันถูก pin ไว้กับโปรไฟล์ auth ของ Anthropic แต่ Gateway
    หาโปรไฟล์นั้นในที่เก็บ auth ไม่พบ

    - **ใช้ Claude CLI**
      - รัน `openclaw models auth login --provider anthropic --method cli --set-default` บนโฮสต์ gateway
    - **หากคุณต้องการใช้ API key แทน**
      - ใส่ `ANTHROPIC_API_KEY` ใน `~/.openclaw/.env` บน **โฮสต์ gateway**
      - ล้างลำดับที่ pin ไว้ซึ่งบังคับให้ใช้โปรไฟล์ที่หายไป:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **ยืนยันว่าคุณกำลังรันคำสั่งบนโฮสต์ gateway**
      - ในโหมด remote โปรไฟล์ auth จะอยู่บนเครื่อง gateway ไม่ใช่แล็ปท็อปของคุณ

  </Accordion>

  <Accordion title="ทำไมถึงลอง Google Gemini แล้วล้มเหลวด้วย?">
    หาก config โมเดลของคุณมี Google Gemini เป็น fallback (หรือคุณสลับไปใช้ชอร์ตแฮนด์ Gemini) OpenClaw จะลองใช้ระหว่าง model fallback หากคุณยังไม่ได้กำหนดค่า Google credentials คุณจะเห็น `No API key found for provider "google"`

    วิธีแก้: ให้ Google auth หรือเอา/หลีกเลี่ยงโมเดล Google ใน `agents.defaults.model.fallbacks` / alias เพื่อไม่ให้ fallback route ไปที่นั่น

    **คำขอ LLM ถูกปฏิเสธ: ต้องมี thinking signature (Google Antigravity)**

    สาเหตุ: ประวัติเซสชันมี **thinking blocks ที่ไม่มี signature** (มักมาจาก
    stream ที่ถูกยกเลิก/บางส่วน) Google Antigravity ต้องใช้ signature สำหรับ thinking blocks

    วิธีแก้: ตอนนี้ OpenClaw จะตัด thinking blocks ที่ไม่ได้ signed ออกสำหรับ Google Antigravity Claude หากยังปรากฏอยู่ ให้เริ่ม **เซสชันใหม่** หรือตั้ง `/thinking off` สำหรับเอเจนต์นั้น

  </Accordion>
</AccordionGroup>

## โปรไฟล์ Auth: คืออะไรและจัดการอย่างไร

ที่เกี่ยวข้อง: [/concepts/oauth](/th/concepts/oauth) (flow OAuth, การจัดเก็บโทเค็น, รูปแบบหลายบัญชี)

<AccordionGroup>
  <Accordion title="โปรไฟล์ auth คืออะไร?">
    โปรไฟล์ auth คือระเบียน credential ที่มีชื่อ (OAuth หรือ API key) ซึ่งผูกกับผู้ให้บริการ โปรไฟล์อยู่ใน:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    หากต้องการตรวจสอบโปรไฟล์ที่บันทึกไว้โดยไม่ dump secret ให้รัน `openclaw models auth list` (เลือกใช้ `--provider <id>` หรือ `--json` ได้) ดูรายละเอียดที่ [CLI โมเดล](/th/cli/models#auth-profiles)

  </Accordion>

  <Accordion title="ID โปรไฟล์ทั่วไปมีอะไรบ้าง?">
    OpenClaw ใช้ ID ที่มี prefix ผู้ให้บริการ เช่น:

    - `anthropic:default` (พบได้บ่อยเมื่อไม่มีตัวตนอีเมล)
    - `anthropic:<email>` สำหรับตัวตน OAuth
    - ID แบบกำหนดเองที่คุณเลือก (เช่น `anthropic:work`)

  </Accordion>

  <Accordion title="ฉันควบคุมได้ไหมว่าจะลองโปรไฟล์ auth ใดก่อน?">
    ได้ Config รองรับ metadata แบบเลือกได้สำหรับโปรไฟล์และการจัดลำดับต่อผู้ให้บริการ (`auth.order.<provider>`) สิ่งนี้ **ไม่** จัดเก็บ secret แต่ map ID ไปยังผู้ให้บริการ/mode และตั้งลำดับการหมุนเวียน

    OpenClaw อาจข้ามโปรไฟล์ชั่วคราวหากอยู่ใน **cooldown** ระยะสั้น (rate limit/timeout/auth failure) หรือสถานะ **disabled** ที่ยาวกว่า (billing/เครดิตไม่เพียงพอ) หากต้องการตรวจสอบ ให้รัน `openclaw models status --json` และตรวจ `auth.unusableProfiles` การปรับแต่ง: `auth.cooldowns.billingBackoffHours*`

    Cooldown ของ rate-limit สามารถจำกัดตามโมเดลได้ โปรไฟล์ที่กำลัง cooling down
    สำหรับโมเดลหนึ่งยังอาจใช้ได้กับโมเดล sibling บนผู้ให้บริการเดียวกัน
    ขณะที่ช่วง billing/disabled ยังคงบล็อกทั้งโปรไฟล์

    คุณยังสามารถตั้ง override ลำดับแบบ **ต่อเอเจนต์** (จัดเก็บใน `auth-state.json` ของเอเจนต์นั้น) ผ่าน CLI:

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

    หากต้องการตรวจสอบว่าจะลองใช้อะไรจริง ๆ ให้ใช้:

    ```bash
    openclaw models status --probe
    ```

    หากโปรไฟล์ที่จัดเก็บไว้ถูกละไว้จากลำดับแบบ explicit probe จะรายงาน
    `excluded_by_auth_order` สำหรับโปรไฟล์นั้นแทนที่จะลองใช้อย่างเงียบ ๆ

  </Accordion>

  <Accordion title="OAuth เทียบกับ API key - ต่างกันอย่างไร?">
    OpenClaw รองรับทั้งสองแบบ:

    - **OAuth / CLI login** มักใช้ประโยชน์จากการเข้าถึงแบบ subscription เมื่อ
      ผู้ให้บริการรองรับ สำหรับ Anthropic แบ็กเอนด์ Claude CLI ของ OpenClaw ใช้
      Claude Code `claude -p`; ปัจจุบัน Anthropic ถือว่าสิ่งนั้นเป็นการใช้งาน Agent
      SDK/แบบ programmatic Anthropic หยุดชั่วคราวการเปลี่ยนแปลงเครดิต Agent
      SDK แยกต่างหากในวันที่ 15 มิถุนายน 2026 ดังนั้นตอนนี้จึงยังดึงจากขีดจำกัดการใช้งานแบบ subscription
      ดู [บทความแผน Agent SDK ของ Anthropic](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
      สำหรับประกาศหยุดชั่วคราวล่าสุด
    - **API keys** ใช้การคิดเงินแบบจ่ายตามโทเค็น

    วิซาร์ดรองรับ Anthropic Claude CLI, OpenAI Codex OAuth และ API keys อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [FAQ](/th/help/faq) — FAQ หลัก
- [FAQ — การเริ่มต้นอย่างรวดเร็วและการตั้งค่าการรันครั้งแรก](/th/help/faq-first-run)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [การสลับโมเดลเมื่อเกิดข้อผิดพลาด](/th/concepts/model-failover)
