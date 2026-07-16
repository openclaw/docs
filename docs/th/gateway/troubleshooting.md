---
read_when:
    - ศูนย์รวมการแก้ไขปัญหานำคุณมาที่นี่เพื่อวินิจฉัยปัญหาเชิงลึกยิ่งขึ้น
    - คุณต้องมีส่วนต่างๆ ของคู่มือปฏิบัติงานที่อิงตามอาการและมีความเสถียร พร้อมคำสั่งที่แม่นยำ
sidebarTitle: Troubleshooting
summary: คู่มือการแก้ไขปัญหาเชิงลึกสำหรับ Gateway, ช่องทาง, ระบบอัตโนมัติ, Node และเบราว์เซอร์
title: การแก้ไขปัญหา
x-i18n:
    generated_at: "2026-07-16T19:17:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f53064a0d42e601ec1a1904fc9d0e8ebb9def7a2fb9d2579c7f10ca675b8f7fd
    source_path: gateway/troubleshooting.md
    workflow: 16
---

นี่คือคู่มือปฏิบัติการเชิงลึก ให้เริ่มที่ [/help/troubleshooting](/th/help/troubleshooting) เพื่อดำเนินขั้นตอนการคัดแยกปัญหาแบบรวดเร็วก่อน

## ลำดับคำสั่ง

เรียกใช้ตามลำดับนี้:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

สัญญาณว่าระบบทำงานปกติ:

- `openclaw gateway status` แสดง `Runtime: running`, `Connectivity probe: ok` และบรรทัด `Capability: ...`
- `openclaw doctor` รายงานว่าไม่มีปัญหาการกำหนดค่า/บริการที่ขัดขวางการทำงาน
- `openclaw channels status --probe` แสดงสถานะการรับส่งข้อมูลแบบสดของแต่ละบัญชี และแสดง `works` หรือ `audit ok` ในส่วนที่รองรับ

## หลังการอัปเดต

ใช้เมื่อการอัปเดตเสร็จสิ้น แต่ Gateway หยุดทำงาน ช่องทางว่างเปล่า หรือการเรียกโมเดลล้มเหลวด้วยข้อผิดพลาด 401

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

ตรวจสอบสิ่งต่อไปนี้:

- `Update restart` ใน `openclaw status` / `openclaw status --all` การส่งต่องานที่รอดำเนินการหรือล้มเหลวจะระบุคำสั่งถัดไปที่ต้องเรียกใช้
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` ใต้ Channels: การกำหนดค่าช่องทางยังคงอยู่ แต่การลงทะเบียน Plugin ล้มเหลวก่อนที่จะโหลดช่องทางได้
- ข้อผิดพลาด 401 จากผู้ให้บริการหลังการยืนยันตัวตนใหม่: `openclaw doctor --fix` ตรวจสอบเงาข้อมูลยืนยันตัวตน OAuth ที่ล้าสมัยของแต่ละเอเจนต์และลบสำเนาเก่า เพื่อให้เอเจนต์ทั้งหมดใช้โปรไฟล์ที่แชร์ร่วมกันในปัจจุบัน

## การติดตั้งที่แยกเป็นสองชุดและการป้องกันการใช้การกำหนดค่าที่ใหม่กว่า

ใช้เมื่อบริการ Gateway หยุดทำงานโดยไม่คาดคิดหลังการอัปเดต หรือบันทึกแสดงว่าไบนารี `openclaw` ตัวหนึ่งเก่ากว่าเวอร์ชันที่เขียน `openclaw.json` ครั้งล่าสุด

OpenClaw ประทับเวอร์ชันในการเขียนการกำหนดค่าด้วย `meta.lastTouchedVersion` คำสั่งแบบอ่านอย่างเดียวสามารถตรวจสอบการกำหนดค่าที่เขียนโดย OpenClaw เวอร์ชันใหม่กว่าได้ แต่การเปลี่ยนแปลงกระบวนการและบริการจะปฏิเสธการทำงานจากไบนารีที่เก่ากว่า การดำเนินการที่ถูกปิดกั้น ได้แก่ การเริ่ม/หยุด/รีสตาร์ต/ถอนการติดตั้งบริการ Gateway, การบังคับติดตั้งบริการใหม่, การเริ่ม Gateway ในโหมดบริการ และการล้างพอร์ต `gateway --force`

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="แก้ไข PATH">
    แก้ไข `PATH` เพื่อให้ `openclaw` ชี้ไปยังการติดตั้งที่ใหม่กว่า จากนั้นเรียกใช้การดำเนินการอีกครั้ง
  </Step>
  <Step title="ติดตั้งบริการ Gateway ใหม่">
    ติดตั้งบริการ Gateway ที่ต้องการใหม่จากการติดตั้งที่ใหม่กว่า:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="ลบตัวครอบที่ล้าสมัย">
    ลบแพ็กเกจระบบหรือตัวครอบเก่าที่ยังคงชี้ไปยังไบนารี `openclaw` เวอร์ชันเก่า
  </Step>
</Steps>

<Warning>
สำหรับการดาวน์เกรดโดยตั้งใจหรือการกู้คืนฉุกเฉินเท่านั้น ให้ตั้งค่า `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` สำหรับคำสั่งนั้นเพียงคำสั่งเดียว ในการทำงานปกติให้ปล่อยไว้โดยไม่ตั้งค่า
</Warning>

## โปรโตคอลไม่ตรงกันหลังการย้อนกลับ

ใช้เมื่อบันทึกยังคงแสดง `protocol mismatch` หลังการดาวน์เกรดหรือย้อนกลับ Gateway เวอร์ชันเก่ากำลังทำงาน แต่กระบวนการไคลเอนต์ภายในเครื่องเวอร์ชันใหม่กว่ายังคงเชื่อมต่อใหม่ด้วยช่วงโปรโตคอลที่ Gateway เวอร์ชันเก่าไม่รองรับ

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

ตรวจสอบสิ่งต่อไปนี้:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` ในบันทึก Gateway
- `Established clients:` ใน `openclaw gateway status --deep` หรือ `Gateway clients` ใน `openclaw doctor --deep`: ไคลเอนต์ TCP ที่ทำงานอยู่และเชื่อมต่อกับพอร์ต Gateway พร้อม PID และบรรทัดคำสั่งเมื่อระบบปฏิบัติการอนุญาต
- กระบวนการไคลเอนต์ที่บรรทัดคำสั่งชี้ไปยังการติดตั้งหรือตัวครอบ OpenClaw เวอร์ชันใหม่กว่าที่ได้ย้อนกลับมา

วิธีแก้ไข:

1. หยุดหรือรีสตาร์ตกระบวนการไคลเอนต์ OpenClaw ที่ล้าสมัยซึ่งแสดงโดย `gateway status --deep`
2. รีสตาร์ตแอปหรือตัวครอบที่ฝัง OpenClaw ไว้ ได้แก่ แดชบอร์ดภายในเครื่อง โปรแกรมแก้ไข ตัวช่วยแอปเซิร์ฟเวอร์ หรือเชลล์ `openclaw logs --follow` ที่ทำงานเป็นเวลานาน
3. เรียกใช้ `openclaw gateway status --deep` หรือ `openclaw doctor --deep` อีกครั้ง และยืนยันว่า PID ของไคลเอนต์ที่ล้าสมัยหายไปแล้ว

อย่าทำให้ Gateway เวอร์ชันเก่ายอมรับโปรโตคอลเวอร์ชันใหม่กว่าที่เข้ากันไม่ได้ การเพิ่มเวอร์ชันโปรโตคอลมีไว้เพื่อปกป้องสัญญาการสื่อสารผ่านสาย ส่วนการกู้คืนจากการย้อนกลับเป็นปัญหาที่ต้องล้างกระบวนการ/เวอร์ชัน

## ข้ามซิมลิงก์ของ Skills เนื่องจากออกนอกพาธ

ใช้เมื่อบันทึกมีข้อความ:

```text
ข้ามพาธ Skills ที่ออกนอกขอบเขตรูทที่กำหนดค่าไว้: ... reason=symlink-escape
```

รูทของ Skills ทุกแห่งเป็นขอบเขตการกักกัน ซิมลิงก์ภายใต้ `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` หรือ `~/.openclaw/skills` จะถูกข้ามเมื่อเป้าหมายจริงชี้ออกนอกขอบเขตรูทนั้น เว้นแต่เป้าหมายจะได้รับความเชื่อถืออย่างชัดเจน

ตรวจสอบลิงก์:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

หากตั้งใจใช้เป้าหมายนั้น ให้กำหนดค่าทั้งรูทของ Skills โดยตรงและเป้าหมายซิมลิงก์ที่อนุญาต:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

จากนั้นเริ่มเซสชันใหม่หรือรอให้ตัวเฝ้าดู Skills รีเฟรช รีสตาร์ต Gateway หากกระบวนการที่กำลังทำงานเริ่มขึ้นก่อนการเปลี่ยนแปลงการกำหนดค่า

อย่าใช้เป้าหมายที่กว้าง เช่น `~`, `/` หรือทั้งโฟลเดอร์โปรเจกต์ที่ซิงค์ไว้ ให้จำกัดขอบเขต `allowSymlinkTargets` ไว้ที่รูทของ Skills จริงซึ่งมีไดเรกทอรี `SKILL.md` ที่เชื่อถือได้

หากต้องการให้การนำการเปลี่ยนแปลงจาก Skill Workshop ไปใช้สามารถเขียนผ่านพาธ Skills ในพื้นที่ทำงานที่เป็นซิมลิงก์และเชื่อถือได้เหล่านั้นด้วย ให้เปิดใช้ `skills.workshop.allowSymlinkTargetWrites` และปิดไว้สำหรับรูทของ Skills ที่แชร์แบบอ่านอย่างเดียว

ที่เกี่ยวข้อง:

- [การกำหนดค่า Skills](/th/tools/skills-config#symlinked-skill-roots)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 ต้องใช้สิทธิ์การใช้งานเพิ่มเติมสำหรับบริบทยาว

ใช้เมื่อบันทึก/ข้อผิดพลาดมีข้อความ: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

ตรวจสอบสิ่งต่อไปนี้:

- โมเดล Anthropic ที่เลือกเป็นโมเดล Claude 4.x ขนาด 1M ที่รองรับ GA (Opus 4.6/4.7/4.8, Sonnet 4.6) หรือการกำหนดค่าโมเดลยังมี `params.context1m: true` แบบเดิม
- ข้อมูลประจำตัว Anthropic ปัจจุบันไม่มีสิทธิ์ใช้บริบทยาว
- คำขอล้มเหลวเฉพาะในเซสชันยาว/การเรียกใช้โมเดลที่ต้องใช้เส้นทางบริบท 1M

ตัวเลือกในการแก้ไข:

<Steps>
  <Step title="ใช้หน้าต่างบริบทมาตรฐาน">
    เปลี่ยนไปใช้โมเดลที่มีหน้าต่างมาตรฐาน หรือลบ `context1m` แบบเดิมออกจาก
    การกำหนดค่าโมเดลเก่าที่ไม่รองรับ GA สำหรับบริบท 1M
  </Step>
  <Step title="ใช้ข้อมูลประจำตัวที่มีสิทธิ์">
    ใช้ข้อมูลประจำตัว Anthropic ที่มีสิทธิ์ส่งคำขอบริบทยาว หรือเปลี่ยนไปใช้คีย์ API ของ Anthropic
  </Step>
  <Step title="กำหนดค่าโมเดลสำรอง">
    กำหนดค่าโมเดลสำรองเพื่อให้การทำงานดำเนินต่อได้เมื่อคำขอบริบทยาวของ Anthropic ถูกปฏิเสธ
  </Step>
</Steps>

ที่เกี่ยวข้อง:

- [Anthropic](/th/providers/anthropic)
- [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use)
- [เหตุใดจึงพบ HTTP 429 จาก Anthropic](/th/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## การตอบกลับ 403 ที่ถูกปิดกั้นจากต้นทาง

ใช้เมื่อผู้ให้บริการ LLM ต้นทางส่งคืน `403` แบบทั่วไป เช่น `Your request was blocked`

อย่าสันนิษฐานว่านี่เป็นปัญหาการกำหนดค่า OpenClaw เสมอไป การตอบกลับอาจมาจากชั้นความปลอดภัยต้นทาง เช่น CDN, WAF, กฎการจัดการบอต หรือพร็อกซีย้อนกลับที่อยู่หน้าเอนด์พอยต์ที่เข้ากันได้กับ OpenAI

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

ตรวจสอบสิ่งต่อไปนี้:

- โมเดลหลายรายการภายใต้ผู้ให้บริการเดียวกันล้มเหลวในลักษณะเดียวกัน
- ได้รับ HTML หรือข้อความความปลอดภัยแบบทั่วไปแทนข้อผิดพลาด API ปกติของผู้ให้บริการ
- มีเหตุการณ์ความปลอดภัยฝั่งผู้ให้บริการในเวลาที่ส่งคำขอเดียวกัน
- การตรวจสอบโดยตรงขนาดเล็กด้วย `curl` สำเร็จ แต่คำขอรูปแบบ SDK ปกติล้มเหลว

แก้ไขการกรองฝั่งผู้ให้บริการก่อน เมื่อหลักฐานชี้ว่า WAF/CDN เป็นผู้ปิดกั้น ควรใช้กฎอนุญาตหรือข้ามที่จำกัดขอบเขตเฉพาะพาธ API ที่ OpenClaw ใช้ และหลีกเลี่ยงการปิดการป้องกันทั้งเว็บไซต์

<Warning>
การที่ `curl` ขั้นต่ำทำงานสำเร็จไม่ได้รับประกันว่าคำขอรูปแบบ SDK จริงจะผ่านชั้นความปลอดภัยต้นทางเดียวกันได้
</Warning>

ที่เกี่ยวข้อง:

- [เอนด์พอยต์ที่เข้ากันได้กับ OpenAI](/th/gateway/configuration-reference#openai-compatible-endpoints)
- [การกำหนดค่าผู้ให้บริการ](/th/providers)
- [บันทึก](/th/logging)

## แบ็กเอนด์ภายในเครื่องที่เข้ากันได้กับ OpenAI ผ่านการตรวจสอบโดยตรง แต่การเรียกใช้เอเจนต์ล้มเหลว

ใช้เมื่อ:

- `curl ... /v1/models` ทำงานได้
- การเรียก `/v1/chat/completions` โดยตรงขนาดเล็กทำงานได้
- การเรียกใช้โมเดล OpenClaw ล้มเหลวเฉพาะในรอบการทำงานปกติของเอเจนต์

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"สวัสดี"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "สวัสดี" --json
openclaw logs --follow
```

ตรวจสอบสิ่งต่อไปนี้:

- การเรียกโดยตรงขนาดเล็กสำเร็จ แต่การเรียกใช้ OpenClaw ล้มเหลวเฉพาะกับพรอมต์ขนาดใหญ่
- เกิดข้อผิดพลาด `model_not_found` หรือ 404 แม้ว่าการเรียก `/v1/chat/completions` โดยตรงจะทำงานได้กับรหัสโมเดลเปล่าเดียวกัน
- ข้อผิดพลาดจากแบ็กเอนด์ที่ระบุว่า `messages[].content` ต้องเป็นสตริง
- คำเตือน `incomplete turn detected ... stopReason=stop payloads=0` เป็นระยะเมื่อใช้แบ็กเอนด์ภายในเครื่องที่เข้ากันได้กับ OpenAI
- แบ็กเอนด์ขัดข้องเฉพาะเมื่อจำนวนโทเค็นพรอมต์มากขึ้นหรือใช้พรอมต์รันไทม์ของเอเจนต์แบบเต็ม

<AccordionGroup>
  <Accordion title="รูปแบบอาการที่พบบ่อย">
    - `model_not_found` เมื่อใช้เซิร์ฟเวอร์ภายในเครื่องแบบ MLX/vLLM: ตรวจสอบว่า `baseUrl` มี `/v1`, `api` เป็น `"openai-completions"` สำหรับแบ็กเอนด์ `/v1/chat/completions` และ `models.providers.<provider>.models[].id` เป็นรหัสภายในของผู้ให้บริการแบบเปล่า เลือกด้วยคำนำหน้าผู้ให้บริการเพียงครั้งเดียว เช่น `mlx/mlx-community/Qwen3-30B-A3B-6bit` และคงรายการแค็ตตาล็อกเป็น `mlx-community/Qwen3-30B-A3B-6bit`
    - `messages[...].content: invalid type: sequence, expected a string`: แบ็กเอนด์ปฏิเสธส่วนเนื้อหา Chat Completions ที่มีโครงสร้าง วิธีแก้ไข: ตั้งค่า `models.providers.<provider>.models[].compat.requiresStringContent: true`
    - `validation.keys` หรือคีย์ข้อความที่อนุญาต เช่น `["role","content"]`: แบ็กเอนด์ปฏิเสธข้อมูลเมตาการเล่นซ้ำแบบ OpenAI ในข้อความ Chat Completions วิธีแก้ไข: ตั้งค่า `models.providers.<provider>.models[].compat.strictMessageKeys: true`
    - `incomplete turn detected ... stopReason=stop payloads=0`: แบ็กเอนด์ดำเนินการคำขอ Chat Completions เสร็จสิ้น แต่ไม่ส่งคืนข้อความของผู้ช่วยที่ผู้ใช้มองเห็นสำหรับรอบนั้น OpenClaw จะลองรอบที่ว่างเปล่าซึ่งเล่นซ้ำได้อย่างปลอดภัยและเข้ากันได้กับ OpenAI อีกหนึ่งครั้ง ความล้มเหลวต่อเนื่องมักหมายความว่าแบ็กเอนด์กำลังส่งเนื้อหาว่าง/ไม่ใช่ข้อความ หรือระงับข้อความคำตอบสุดท้าย
    - คำขอโดยตรงขนาดเล็กสำเร็จ แต่การเรียกใช้เอเจนต์ OpenClaw ล้มเหลวโดยแบ็กเอนด์/โมเดลขัดข้อง (ตัวอย่างเช่น Gemma ในบิลด์ `inferrs` บางรุ่น): การรับส่งข้อมูลของ OpenClaw น่าจะถูกต้องอยู่แล้ว แต่แบ็กเอนด์ล้มเหลวกับรูปแบบพรอมต์รันไทม์ของเอเจนต์ที่มีขนาดใหญ่กว่า
    - ความล้มเหลวลดลงหลังปิดใช้งานเครื่องมือแต่ยังไม่หายไป: สคีมาของเครื่องมือเป็นส่วนหนึ่งของภาระ แต่ปัญหาที่เหลือยังคงเป็นความจุของโมเดล/เซิร์ฟเวอร์ต้นทางหรือข้อบกพร่องของแบ็กเอนด์

  </Accordion>
  <Accordion title="ตัวเลือกในการแก้ไข">
    1. ตั้งค่า `compat.requiresStringContent: true` สำหรับแบ็กเอนด์ Chat Completions ที่รับเฉพาะสตริง
    2. ตั้งค่า `compat.strictMessageKeys: true` สำหรับแบ็กเอนด์ Chat Completions ที่เข้มงวดซึ่งยอมรับเฉพาะ `role` และ `content` ในแต่ละข้อความ
    3. ตั้งค่า `compat.supportsTools: false` สำหรับโมเดล/แบ็กเอนด์ที่ไม่สามารถรองรับพื้นผิวสคีมาเครื่องมือของ OpenClaw ได้อย่างน่าเชื่อถือ
    4. ลดภาระพรอมต์เมื่อทำได้: ลดขนาดการเริ่มต้นพื้นที่ทำงาน ย่อประวัติเซสชัน ใช้โมเดลภายในเครื่องที่เบากว่า หรือใช้แบ็กเอนด์ที่รองรับบริบทยาวได้ดีกว่า
    5. หากคำขอโดยตรงขนาดเล็กยังคงผ่าน แต่รอบการทำงานของเอเจนต์ OpenClaw ยังทำให้แบ็กเอนด์ขัดข้อง ให้ถือว่าเป็นข้อจำกัดของเซิร์ฟเวอร์/โมเดลต้นทาง และรายงานขั้นตอนการทำซ้ำปัญหาไปยังโครงการนั้นพร้อมรูปแบบเพย์โหลดที่ได้รับการยอมรับ
  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [การกำหนดค่า](/th/gateway/configuration)
- [โมเดลภายในเครื่อง](/th/gateway/local-models)
- [ปลายทางที่เข้ากันได้กับ OpenAI](/th/gateway/configuration-reference#openai-compatible-endpoints)

## ไม่มีการตอบกลับ

หากช่องทางทำงานอยู่แต่ไม่มีการตอบกลับ ให้ตรวจสอบการกำหนดเส้นทางและนโยบายก่อนเชื่อมต่อสิ่งใดใหม่

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

ตรวจสอบ:

- การจับคู่ที่รอดำเนินการสำหรับผู้ส่งข้อความส่วนตัว
- การจำกัดด้วยการกล่าวถึงในกลุ่ม (`requireMention`, `mentionPatterns`)
- รายการอนุญาตของช่องทาง/กลุ่มไม่ตรงกัน

รูปแบบที่พบบ่อย:

- `drop guild message (mention required` → ข้อความกลุ่มจะถูกละเว้นจนกว่าจะมีการกล่าวถึง
- `pairing request` → ผู้ส่งต้องได้รับการอนุมัติ
- `blocked` / `allowlist` → ผู้ส่ง/ช่องทางถูกกรองตามนโยบาย

หัวข้อที่เกี่ยวข้อง:

- [การแก้ปัญหาช่องทาง](/th/channels/troubleshooting)
- [กลุ่ม](/th/channels/groups)
- [การจับคู่](/th/channels/pairing)

## การเชื่อมต่อ UI ควบคุมของแดชบอร์ด

เมื่อแดชบอร์ด/UI ควบคุมเชื่อมต่อไม่ได้ ให้ตรวจสอบ URL, โหมดการยืนยันตัวตน และข้อกำหนดของบริบทที่ปลอดภัย

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

ตรวจสอบ:

- URL สำหรับตรวจสอบและ URL แดชบอร์ดถูกต้อง
- โหมดการยืนยันตัวตน/โทเค็นระหว่างไคลเอนต์กับ Gateway ไม่ตรงกัน
- มีการใช้ HTTP ในกรณีที่ต้องใช้ข้อมูลประจำตัวของอุปกรณ์

หากเบราว์เซอร์ภายในเครื่องเชื่อมต่อกับ `127.0.0.1:18789` ไม่ได้หลังการอัปเดต ให้กู้คืนบริการ Gateway ภายในเครื่องก่อน และยืนยันว่าบริการกำลังให้บริการแดชบอร์ด:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

หาก `curl` ส่งคืน HTML ของ OpenClaw แสดงว่า Gateway ทำงานอยู่ และปัญหาที่เหลือน่าจะเกิดจากแคชของเบราว์เซอร์ ดีปลิงก์เก่า หรือสถานะแท็บที่ค้างอยู่ เปิด `http://127.0.0.1:18789` โดยตรงและนำทางจากแดชบอร์ด หากหลังรีสตาร์ตบริการไม่ทำงานต่อ ให้เรียกใช้ `openclaw gateway start` และตรวจสอบ `openclaw gateway status` อีกครั้ง

<AccordionGroup>
  <Accordion title="รูปแบบการเชื่อมต่อ/การยืนยันตัวตน">
    - `device identity required` → บริบทไม่ปลอดภัยหรือไม่มีการยืนยันตัวตนของอุปกรณ์
    - `origin not allowed` → `Origin` ของเบราว์เซอร์ไม่อยู่ใน `gateway.controlUi.allowedOrigins` (หรือกำลังเชื่อมต่อจากต้นทางเบราว์เซอร์ที่ไม่ใช่ลูปแบ็กโดยไม่มีรายการอนุญาตที่ระบุไว้อย่างชัดเจน)
    - `device nonce required` / `device nonce mismatch` → ไคลเอนต์ดำเนินขั้นตอนการยืนยันตัวตนอุปกรณ์แบบชาเลนจ์ไม่สมบูรณ์ (`connect.challenge` + `device.nonce`)
    - `device signature invalid` / `device signature expired` → ไคลเอนต์ลงนามเพย์โหลดผิด (หรือใช้การประทับเวลาที่ล้าสมัย) สำหรับการจับมือปัจจุบัน
    - `AUTH_TOKEN_MISMATCH` พร้อม `canRetryWithDeviceToken=true` → ไคลเอนต์สามารถลองใหม่แบบเชื่อถือได้หนึ่งครั้งด้วยโทเค็นอุปกรณ์ที่แคชไว้
    - การลองใหม่ด้วยโทเค็นที่แคชไว้นั้นจะใช้ชุดขอบเขตที่แคชไว้กับโทเค็นอุปกรณ์ที่จับคู่แล้วซ้ำ ส่วนผู้เรียกที่ระบุ `deviceToken` / `scopes` อย่างชัดเจนจะคงชุดขอบเขตที่ร้องขอไว้
    - `AUTH_SCOPE_MISMATCH` → ระบบรู้จักโทเค็นอุปกรณ์ แต่ขอบเขตที่อนุมัติไว้ไม่ครอบคลุมคำขอเชื่อมต่อนี้ ให้จับคู่ใหม่หรืออนุมัติสัญญาขอบเขตที่ร้องขอ แทนการหมุนเวียนโทเค็น Gateway ที่ใช้ร่วมกัน
    - นอกเส้นทางการลองใหม่นั้น ลำดับความสำคัญของการยืนยันตัวตนสำหรับการเชื่อมต่อคือโทเค็น/รหัสผ่านที่ใช้ร่วมกันซึ่งระบุไว้อย่างชัดเจนก่อน ตามด้วย `deviceToken` ที่ระบุไว้อย่างชัดเจน จากนั้นเป็นโทเค็นอุปกรณ์ที่จัดเก็บไว้ และสุดท้ายคือโทเค็นบูตสแตรป
    - ในเส้นทาง UI ควบคุมของ Tailscale Serve แบบอะซิงโครนัส ความพยายามที่ล้มเหลวสำหรับ `{scope, ip}` เดียวกันจะถูกจัดลำดับก่อนที่ตัวจำกัดจะบันทึกความล้มเหลว ดังนั้นการลองใหม่พร้อมกันที่ไม่ถูกต้องสองครั้งจากไคลเอนต์เดียวกันอาจแสดง `retry later` ในครั้งที่สอง แทนที่จะแสดงความไม่ตรงกันธรรมดาสองครั้ง
    - `too many failed authentication attempts (retry later)` จากไคลเอนต์ลูปแบ็กที่มีต้นทางจากเบราว์เซอร์ → ความล้มเหลวซ้ำจาก `Origin` ที่ปรับให้เป็นมาตรฐานเดียวกันจะถูกล็อกชั่วคราว ส่วนต้นทาง localhost อื่นจะใช้บักเก็ตแยกต่างหาก
    - เกิด `unauthorized` ซ้ำหลังการลองใหม่นั้น → โทเค็นที่ใช้ร่วมกันกับโทเค็นอุปกรณ์ไม่สอดคล้องกัน ให้อัปเดตการกำหนดค่าโทเค็นและอนุมัติใหม่/หมุนเวียนโทเค็นอุปกรณ์หากจำเป็น
    - `gateway connect failed:` → เป้าหมายโฮสต์/พอร์ต/URL ไม่ถูกต้อง

  </Accordion>
</AccordionGroup>

### แผนผังย่อของรหัสรายละเอียดการยืนยันตัวตน

ใช้ `error.details.code` จากการตอบกลับ `connect` ที่ล้มเหลวเพื่อเลือกการดำเนินการถัดไป:

| รหัสรายละเอียด                  | ความหมาย                                                                                                                                                                                      | การดำเนินการที่แนะนำ                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | ไคลเอนต์ไม่ได้ส่งโทเค็นที่ใช้ร่วมกันซึ่งจำเป็น                                                                                                                                                 | วาง/ตั้งค่าโทเค็นในไคลเอนต์แล้วลองใหม่ สำหรับเส้นทางแดชบอร์ด: `openclaw config get gateway.auth.token` จากนั้นวางลงในการตั้งค่า UI ควบคุม                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | โทเค็นที่ใช้ร่วมกันไม่ตรงกับโทเค็นการยืนยันตัวตนของ Gateway                                                                                                                                               | หาก `canRetryWithDeviceToken=true` ให้อนุญาตการลองใหม่แบบเชื่อถือได้หนึ่งครั้ง การลองใหม่ด้วยโทเค็นที่แคชไว้จะใช้ขอบเขตที่อนุมัติและจัดเก็บไว้ซ้ำ ส่วนผู้เรียกที่ระบุ `deviceToken` / `scopes` อย่างชัดเจนจะคงขอบเขตที่ร้องขอ หากยังล้มเหลว ให้เรียกใช้ [รายการตรวจสอบการกู้คืนโทเค็นที่ไม่สอดคล้องกัน](/th/cli/devices#token-drift-recovery-checklist) |
| `AUTH_DEVICE_TOKEN_MISMATCH` | โทเค็นรายอุปกรณ์ที่แคชไว้ล้าสมัยหรือถูกเพิกถอน                                                                                                                                                 | หมุนเวียน/อนุมัติโทเค็นอุปกรณ์ใหม่โดยใช้ [CLI สำหรับอุปกรณ์](/th/cli/devices) จากนั้นเชื่อมต่อใหม่                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | โทเค็นอุปกรณ์ถูกต้อง แต่บทบาท/ขอบเขตที่อนุมัติไว้ไม่ครอบคลุมคำขอเชื่อมต่อนี้                                                                                                       | จับคู่อุปกรณ์ใหม่หรืออนุมัติสัญญาขอบเขตที่ร้องขอ อย่าถือว่ากรณีนี้เป็นโทเค็นที่ใช้ร่วมกันไม่สอดคล้องกัน                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | ข้อมูลประจำตัวของอุปกรณ์ต้องได้รับการอนุมัติ ตรวจสอบ `error.details.reason` สำหรับ `not-paired`, `scope-upgrade`, `role-upgrade` หรือ `metadata-upgrade` และใช้ `requestId` / `remediationHint` เมื่อมี | อนุมัติคำขอที่รอดำเนินการ: `openclaw devices list` จากนั้น `openclaw devices approve <requestId>` การอัปเกรดขอบเขต/บทบาทใช้ขั้นตอนเดียวกันหลังจากตรวจสอบสิทธิ์การเข้าถึงที่ร้องขอแล้ว                                                                                                               |

<Note>
RPC แบ็กเอนด์แบบลูปแบ็กโดยตรงที่ยืนยันตัวตนด้วยโทเค็น/รหัสผ่าน Gateway ที่ใช้ร่วมกันไม่ควรขึ้นอยู่กับค่าพื้นฐานของขอบเขตอุปกรณ์ที่จับคู่ของ CLI หากเอเจนต์ย่อยหรือการเรียกภายในอื่นยังคงล้มเหลวด้วย `scope-upgrade` ให้ตรวจสอบว่าผู้เรียกใช้ `client.id: "gateway-client"` และ `client.mode: "backend"` และไม่ได้บังคับใช้ `deviceIdentity` หรือโทเค็นอุปกรณ์อย่างชัดเจน
</Note>

การตรวจสอบการย้ายข้อมูลการยืนยันตัวตนอุปกรณ์ v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

หากบันทึกแสดงข้อผิดพลาด nonce/ลายเซ็น ให้อัปเดตไคลเอนต์ที่เชื่อมต่อและตรวจสอบดังนี้:

<Steps>
  <Step title="รอ connect.challenge">
    ไคลเอนต์รอ `connect.challenge` ที่ Gateway ออกให้
  </Step>
  <Step title="ลงนามเพย์โหลด">
    ไคลเอนต์ลงนามเพย์โหลดที่ผูกกับชาเลนจ์
  </Step>
  <Step title="ส่ง nonce ของอุปกรณ์">
    ไคลเอนต์ส่ง `connect.params.device.nonce` พร้อม nonce ของชาเลนจ์เดียวกัน
  </Step>
</Steps>

หาก `openclaw devices rotate` / `revoke` / `remove` ถูกปฏิเสธโดยไม่คาดคิด:

- เซสชันโทเค็นของอุปกรณ์ที่จับคู่สามารถจัดการได้เฉพาะอุปกรณ์ **ของตนเอง** เว้นแต่ผู้เรียกจะมี `operator.admin` ด้วย
- `openclaw devices rotate --scope ...` สามารถร้องขอได้เฉพาะขอบเขตผู้ปฏิบัติงานที่เซสชันของผู้เรียกมีอยู่แล้ว

หัวข้อที่เกี่ยวข้อง:

- [การกำหนดค่า](/th/gateway/configuration) (โหมดการยืนยันตัวตนของ Gateway)
- [UI ควบคุม](/th/web/control-ui)
- [อุปกรณ์](/th/cli/devices)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [การยืนยันตัวตนพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth)

## บริการ Gateway ไม่ทำงาน

ใช้เมื่อบริการได้รับการติดตั้งแล้ว แต่โพรเซสหยุดทำงานอยู่เสมอ

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

ตรวจสอบ:

- `Runtime: stopped` พร้อมคำแนะนำเกี่ยวกับการออก
- การกำหนดค่าบริการไม่ตรงกัน (`Config (cli)` เทียบกับ `Config (service)`)
- พอร์ต/ตัวรับฟังขัดแย้งกัน
- มีการติดตั้ง launchd/systemd/schtasks เพิ่มเติมเมื่อใช้ `--deep`
- คำแนะนำในการล้างข้อมูล `Other gateway-like services detected (best effort)`

<AccordionGroup>
  <Accordion title="รูปแบบที่พบบ่อย">
    - `Gateway start blocked: set gateway.mode=local` หรือ `existing config is missing gateway.mode` → ไม่ได้เปิดใช้งานโหมด Gateway ภายในเครื่อง หรือไฟล์การกำหนดค่าถูกเขียนทับจนสูญเสีย `gateway.mode` วิธีแก้: ตั้งค่า `gateway.mode="local"` ในการกำหนดค่า หรือเรียกใช้ `openclaw onboard --mode local` / `openclaw setup` อีกครั้งเพื่อประทับการกำหนดค่าโหมดภายในเครื่องที่คาดไว้อีกครั้ง หากเรียกใช้ OpenClaw ผ่าน Podman พาธการกำหนดค่าเริ่มต้นคือ `~/.openclaw/openclaw.json`
    - `refusing to bind gateway ... without auth` → ผูกกับที่อยู่ที่ไม่ใช่ลูปแบ็กโดยไม่มีเส้นทางการยืนยันตัวตน Gateway ที่ถูกต้อง (โทเค็น/รหัสผ่าน หรือพร็อกซีที่เชื่อถือได้เมื่อกำหนดค่าไว้)
    - `another gateway instance is already listening` / `EADDRINUSE` → พอร์ตขัดแย้งกัน
    - `Other gateway-like services detected (best effort)` → มีหน่วย launchd/systemd/schtasks ที่ล้าสมัยหรือทำงานขนานกัน การตั้งค่าส่วนใหญ่ควรมี Gateway หนึ่งรายการต่อเครื่อง หากจำเป็นต้องมีมากกว่าหนึ่งรายการ ให้แยกพอร์ต + การกำหนดค่า/สถานะ/พื้นที่ทำงาน ดู [/gateway#multiple-gateways-same-host](/th/gateway#multiple-gateways-same-host)
    - `System-level OpenClaw gateway service detected` จาก doctor → มีหน่วยระบบ systemd อยู่แต่ไม่มีบริการระดับผู้ใช้ ให้ลบหรือปิดใช้งานรายการซ้ำก่อนอนุญาตให้ doctor ติดตั้งบริการผู้ใช้ หรือตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` หากต้องการใช้หน่วยระบบเป็นตัวควบคุม
    - `Gateway service port does not match current gateway config` → ตัวควบคุมที่ติดตั้งไว้ยังคงตรึง `--port` เก่าไว้ เรียกใช้ `openclaw doctor --fix` หรือ `openclaw gateway install --force` จากนั้นรีสตาร์ตบริการ Gateway

  </Accordion>
</AccordionGroup>

หัวข้อที่เกี่ยวข้อง:

- [การดำเนินการเบื้องหลังและเครื่องมือโพรเซส](/th/gateway/background-process)
- [การกำหนดค่า](/th/gateway/configuration)
- [Doctor](/th/gateway/doctor)

## Gateway บน macOS หยุดตอบสนองโดยไม่มีสัญญาณ แล้วกลับมาทำงานเมื่อมีการโต้ตอบกับแดชบอร์ด

ใช้เมื่อช่องทางต่าง ๆ (Telegram, WhatsApp เป็นต้น) บนโฮสต์ macOS เงียบหายไปครั้งละหลายนาทีถึงหลายชั่วโมง และดูเหมือนว่า Gateway จะกลับมาทำงานทันทีที่เปิด Control UI, เชื่อมต่อผ่าน SSH หรือโต้ตอบกับโฮสต์ด้วยวิธีอื่น โดยปกติจะไม่พบอาการที่ชัดเจนใน `openclaw status` เพราะเมื่อเข้าไปตรวจสอบ Gateway ก็กลับมาทำงานแล้ว

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

ให้มองหา:

- บันเดิล `*-uncaught_exception.json` อย่างน้อยหนึ่งรายการใน `~/.openclaw/logs/stability/` ซึ่งตั้งค่า `error.code` เป็นรหัสเครือข่ายชั่วคราว เช่น `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` หรือ `ECONNREFUSED`
- บรรทัด `pmset -g log` เช่น `Entering Sleep state due to 'Maintenance Sleep'` หรือ `en0 driver is slow (msg: WillChangeState to 0)` ที่มีเวลาตรงกับการขัดข้อง Power Nap / Maintenance Sleep จะทำให้ไดรเวอร์ Wi-Fi เข้าสู่สถานะ 0 ชั่วครู่ การเชื่อมต่อขาออก `connect()` ใด ๆ ที่เกิดขึ้นในช่วงนั้นอาจล้มเหลวด้วย `ENETDOWN` แม้โดยปกติโฮสต์จะเชื่อมต่อเครือข่ายได้อย่างสมบูรณ์
- เอาต์พุต `launchctl print` ที่แสดง `state = not running` พร้อม `runs` ล่าสุดหลายครั้งและรหัสออก โดยเฉพาะเมื่อช่วงห่างระหว่างการขัดข้องกับการเริ่มทำงานครั้งถัดไปกินเวลาประมาณหนึ่งชั่วโมงแทนที่จะเป็นไม่กี่วินาที launchd ของ macOS ใช้กลไกป้องกันการเกิดซ้ำที่ไม่มีการบันทึกไว้หลังเกิดการขัดข้องต่อเนื่อง ซึ่งอาจทำให้หยุดปฏิบัติตาม `KeepAlive=true` จนกว่าทริกเกอร์ภายนอก เช่น การเข้าสู่ระบบแบบโต้ตอบ การเชื่อมต่อแดชบอร์ด หรือ `launchctl kickstart` จะเปิดใช้งานกลไกนี้อีกครั้ง

ลักษณะที่พบบ่อย:

- บันเดิลเสถียรภาพที่มี `error.code` เป็น `ENETDOWN` หรือรหัสอื่นในกลุ่มเดียวกัน โดย call stack ชี้ไปยัง Node `net` `lookupAndConnect` / `Socket.connect` OpenClaw `2026.5.26` และใหม่กว่าจะจัดประเภทข้อผิดพลาดเหล่านี้เป็นข้อผิดพลาดเครือข่ายชั่วคราวที่ไม่เป็นอันตราย จึงไม่ส่งต่อไปยังตัวจัดการข้อยกเว้นที่ไม่ถูกดักจับระดับบนสุดอีกต่อไป หากใช้รุ่นเก่ากว่านี้ ให้อัปเกรดก่อน
- ช่วงที่เงียบหายไปนานและสิ้นสุดทันทีที่เชื่อมต่อกับ Control UI หรือเชื่อมต่อโฮสต์ผ่าน SSH: กิจกรรมที่ผู้ใช้มองเห็นเป็นสิ่งที่เปิดใช้งานกลไกการเกิดซ้ำของ launchd อีกครั้ง ไม่ใช่สิ่งใดที่แดชบอร์ดทำกับ Gateway
- จำนวน `runs` เพิ่มขึ้นตลอดทั้งวันโดยไม่มีบรรทัด `received SIG*; shutting down` ที่สอดคล้องกันใน `~/Library/Logs/openclaw/gateway.log`: การปิดระบบตามปกติจะบันทึกสัญญาณลงในบันทึก แต่การขัดข้องชั่วคราวจะไม่บันทึก

สิ่งที่ควรทำ:

1. **อัปเกรด Gateway** หากกำลังใช้รุ่นก่อน `2026.5.26` หลังอัปเกรดแล้ว ข้อผิดพลาด `ENETDOWN` ที่เกิดขึ้นในอนาคตจะถูกบันทึกเป็นคำเตือนแทนการยุติกระบวนการ
2. **ลดกิจกรรมการพักเครื่องเพื่อบำรุงรักษา** บนโฮสต์ Mac mini / เดสก์ท็อปที่ต้องการใช้เป็นเซิร์ฟเวอร์ซึ่งเปิดทำงานตลอดเวลา:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   วิธีนี้ช่วยลดความไม่เสถียรชั่วคราวของไดรเวอร์ได้อย่างมาก แต่ไม่สามารถกำจัดสาเหตุพื้นฐานได้ทั้งหมด ระบบยังคงอาจเข้าสู่โหมดพักเครื่องเพื่อบำรุงรักษาบางประเภทสำหรับ TCP keepalive และการบำรุงรักษา mDNS โดยไม่ขึ้นกับแฟล็กเหล่านี้

3. **เพิ่ม watchdog ตรวจสอบการทำงาน** เพื่อให้ตรวจพบอย่างรวดเร็วหากการขัดข้องต่อเนื่องในอนาคตถูก launchd ระงับไว้:

   ```bash
   # ตัวอย่างการตรวจสอบการทำงานที่รับรู้ launchd เหมาะสำหรับ Cron ทุก 5 นาทีหรือ LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   จุดประสงค์คือการเปิดใช้งานกลไกการเกิดซ้ำจากภายนอกอีกครั้ง โดย `KeepAlive=true` เพียงอย่างเดียวไม่เพียงพอบน macOS หลังเกิดการขัดข้องต่อเนื่อง

เนื้อหาที่เกี่ยวข้อง:

- [หมายเหตุเกี่ยวกับแพลตฟอร์ม macOS](/th/platforms/macos)
- [การบันทึก](/th/logging)
- [Doctor](/th/gateway/doctor)

## ลูปตัวควบคุม launchd ของ macOS ที่มี Gateway/Node LaunchAgent ซ้ำกัน

ใช้เมื่อการติดตั้งบน macOS เริ่มทำงานใหม่ทุก ๆ ไม่กี่วินาที การตรวจสอบสถานะ `openclaw`
สลับไปมาระหว่างพร้อมใช้งานกับไม่พร้อมใช้งาน และการส่งข้อมูลผ่านช่องทางหยุดชะงัก
แม้ว่าดูเหมือนว่าบริการยังทำงานอยู่

พบอาการนี้ในการติดตั้งรุ่นเก่าที่ทั้ง `ai.openclaw.gateway` และ
`ai.openclaw.node` LaunchAgent ทำงานอยู่ และแต่ละรายการแทรก
`OPENCLAW_LAUNCHD_LABEL` ในสถานะดังกล่าว OpenClaw สามารถตรวจพบการควบคุมโดย launchd
พยายามส่งมอบการเริ่มทำงานใหม่กลับไปให้ launchd และตกอยู่ในลูป
`EADDRINUSE`/การเกิดซ้ำอย่างรวดเร็ว แทนที่จะมีกระบวนการ Gateway ที่เสถียรเพียงหนึ่งรายการ

```bash
for i in 1 2 3 4; do
  ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
  sleep 10
done

openclaw gateway status --deep
openclaw node status
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'state|last exit|runs'
tail -n 80 ~/Library/Logs/openclaw/gateway.log
```

ให้มองหา:

- มี PID ของ Gateway มากกว่าหนึ่งรายการตลอดช่วงเก็บตัวอย่าง 30 วินาที แทนที่จะเป็นกระบวนการเดียวที่เสถียร
- `EADDRINUSE`, `another gateway instance is already listening` หรือบรรทัดการเริ่มทำงานใหม่/ส่งมอบซ้ำ ๆ
  ใน `gateway.log`
- ทั้ง `~/Library/LaunchAgents/ai.openclaw.gateway.plist` และ
  `~/Library/LaunchAgents/ai.openclaw.node.plist` ถูกโหลดพร้อมกันบน
  โฮสต์ที่ควรเรียกใช้บริการ Gateway ที่มีการจัดการเพียงบริการเดียว

สิ่งที่ควรทำ:

1. หากโฮสต์นี้ควรเรียกใช้เฉพาะบริการ Gateway ให้ลบบริการ Node
   ที่มีการจัดการผ่าน OpenClaw **ข้ามขั้นตอนนี้** หากยังใช้งานบริการ Node
   สำหรับคุณสมบัติ Node ระยะไกลอยู่ เนื่องจากการถอนการติดตั้งจะหยุดคุณสมบัติเหล่านั้นบน
   โฮสต์นี้:

   ```bash
   openclaw node uninstall
   ```

2. ติดตั้ง Wrapper ถาวรสำหรับ Gateway ซึ่งล้างตัวบ่งชี้ launchd
   ที่สืบทอดมาก่อนเริ่ม OpenClaw ใช้ตัวเลือก `--wrapper` ที่รองรับ
   อย่าแก้ไขไฟล์ที่สร้างขึ้นภายใต้ `~/.openclaw/service-env/` เนื่องจากการติดตั้งบริการ
   ใหม่ การอัปเดต และการซ่อมแซมด้วย Doctor จะสร้างไฟล์นั้นขึ้นใหม่:

   ```bash
   mkdir -p ~/.local/bin
   cat >~/.local/bin/openclaw-launchd-workaround <<'EOF'
   #!/bin/sh
   set -eu
   unset OPENCLAW_LAUNCHD_LABEL LAUNCH_JOB_LABEL LAUNCH_JOB_NAME XPC_SERVICE_NAME || true
   exec openclaw "$@"
   EOF
   chmod 700 ~/.local/bin/openclaw-launchd-workaround

   openclaw gateway install \
     --wrapper ~/.local/bin/openclaw-launchd-workaround \
     --force
   ```

   `gateway install` จะคงพาธของ wrapper ไว้เมื่อบังคับติดตั้งใหม่
   อัปเดต และซ่อมแซมด้วย doctor

3. ตรวจสอบว่า Gateway ทำงานอย่างเสถียรและให้บริการ RPC ไม่ใช่เพียงเปิดรับการเชื่อมต่อ:

   ```bash
   openclaw gateway status --deep --require-rpc

   for i in 1 2 3 4; do
     ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
     sleep 10
   done
   ```

   ตัวอย่าง PID ควรแสดงโปรเซสเดียวที่เสถียรแทนชุด PID ที่เปลี่ยนไปเรื่อยๆ
   และการส่งต่อช่องทางขาเข้าควรกลับมาทำงาน

4. หลังจากอัปเกรดเป็นรุ่นที่แก้ไขลูป LaunchAgent แบบคู่ที่เป็นสาเหตุแล้ว
   ให้นำวิธีแก้ชั่วคราวออกและติดตั้งบริการที่มีการจัดการตามปกติใหม่:

   ```bash
   OPENCLAW_WRAPPER= openclaw gateway install --force
   rm ~/.local/bin/openclaw-launchd-workaround
   ```

ที่เกี่ยวข้อง:

- [หมายเหตุเกี่ยวกับแพลตฟอร์ม macOS](/th/platforms/mac/bundled-gateway)
- [Doctor](/th/gateway/doctor)
- [Gateway CLI](/th/cli/gateway)

## Gateway หยุดทำงานระหว่างใช้หน่วยความจำสูง

ใช้เมื่อ Gateway หายไปขณะมีภาระงาน ตัวควบคุมรายงานการเริ่มใหม่ในลักษณะ OOM หรือบันทึกกล่าวถึง `critical memory pressure bundle written`

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

ตรวจหา:

- `Reason: diagnostic.memory.pressure.critical` ในบันเดิลข้อมูลเสถียรภาพล่าสุด
- `Memory pressure:` พร้อมกับ `critical/rss_threshold`, `critical/heap_threshold` หรือ `critical/rss_growth`
- ค่า `V8 heap:` ที่ใกล้ขีดจำกัดฮีป
- รายการ `Largest session files:` เช่น `agents/<agent>/sessions/<session>.jsonl` หรือ `sessions/<session>.jsonl`
- ตัวนับหน่วยความจำ cgroup ของ Linux เมื่อ Gateway ทำงานภายในคอนเทนเนอร์หรือบริการที่จำกัดหน่วยความจำ

ลักษณะที่พบบ่อย:

- `critical memory pressure bundle written` ปรากฏไม่นานก่อนเริ่มใหม่ → OpenClaw บันทึกบันเดิลข้อมูลเสถียรภาพก่อนเกิด OOM แล้ว ตรวจสอบด้วย `openclaw gateway stability --bundle latest`
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` ปรากฏในบันทึกของ Gateway → OpenClaw ตรวจพบแรงกดดันด้านหน่วยความจำระดับวิกฤต แต่ปิดการบันทึกภาพรวมเสถียรภาพก่อนเกิด OOM ไว้
- `Largest session files:` ชี้ไปยังพาธทรานสคริปต์ที่ปกปิดข้อมูลแล้วซึ่งมีขนาดใหญ่มาก → ลดประวัติเซสชันที่เก็บไว้ ตรวจสอบการขยายตัวของเซสชัน หรือย้ายทรานสคริปต์เก่าออกจากที่เก็บที่ใช้งานอยู่ก่อนเริ่มใหม่
- จำนวนไบต์ที่ใช้ใน `V8 heap:` ใกล้ขีดจำกัดฮีป → ลดภาระจากพรอมต์/เซสชัน ลดงานที่ทำพร้อมกัน หรือเพิ่มขีดจำกัดฮีปของ Node เฉพาะหลังจากยืนยันแล้วว่าภาระงานดังกล่าวเป็นสิ่งที่คาดไว้
- `Memory pressure: critical/rss_growth` → หน่วยความจำเพิ่มขึ้นอย่างรวดเร็วภายในช่วงการสุ่มตัวอย่างหนึ่งช่วง ตรวจสอบบันทึกล่าสุดเพื่อหาการนำเข้าขนาดใหญ่ เอาต์พุตเครื่องมือที่ควบคุมไม่ได้ การลองซ้ำหลายครั้ง หรือชุดงานเอเจนต์ที่รออยู่ในคิว
- บันทึกแสดงแรงกดดันด้านหน่วยความจำระดับวิกฤตแต่ไม่มีบันเดิล → นี่คือค่าเริ่มต้น ตั้งค่า `diagnostics.memoryPressureSnapshot: true` เพื่อบันทึกบันเดิลข้อมูลเสถียรภาพก่อนเกิด OOM เมื่อเกิดเหตุการณ์แรงกดดันด้านหน่วยความจำระดับวิกฤตในอนาคต

บันเดิลข้อมูลเสถียรภาพไม่มีเพย์โหลด โดยมีหลักฐานการทำงานเกี่ยวกับหน่วยความจำและพาธไฟล์แบบสัมพัทธ์ที่ปกปิดข้อมูลแล้ว แต่ไม่มีข้อความ เนื้อหา Webhook ข้อมูลประจำตัว โทเค็น คุกกี้ หรือรหัสเซสชันดิบ ให้แนบไฟล์ส่งออกการวินิจฉัยไปกับรายงานข้อบกพร่องแทนการคัดลอกบันทึกดิบ

ที่เกี่ยวข้อง:

- [สถานะการทำงานของ Gateway](/th/gateway/health)
- [การส่งออกการวินิจฉัย](/th/gateway/diagnostics)
- [เซสชัน](/th/cli/sessions)

## Gateway ปฏิเสธการกำหนดค่าที่ไม่ถูกต้อง

ใช้เมื่อการเริ่มต้น Gateway ล้มเหลวพร้อม `Invalid config` หรือบันทึกการโหลดซ้ำแบบทันทีระบุว่าได้ข้ามการแก้ไขที่ไม่ถูกต้อง

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

ตรวจหา:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- ไฟล์ `openclaw.json.rejected.*` ที่มีการประทับเวลาอยู่ข้างการกำหนดค่าที่ใช้งานอยู่
- ไฟล์ `openclaw.json.clobbered.*` ที่มีการประทับเวลา หาก `doctor --fix` ซ่อมแซมการแก้ไขโดยตรงที่เสียหาย
- OpenClaw จะเก็บไฟล์ `.clobbered.*` ล่าสุด 32 ไฟล์สำหรับแต่ละพาธการกำหนดค่าและหมุนเวียนไฟล์ที่เก่ากว่าออก

<AccordionGroup>
  <Accordion title="เกิดอะไรขึ้น">
    - การกำหนดค่าไม่ผ่านการตรวจสอบระหว่างการเริ่มต้น การโหลดซ้ำแบบทันที หรือการเขียนที่ OpenClaw เป็นผู้ดำเนินการ
    - การเริ่มต้น Gateway จะล้มเหลวแบบปิดกั้นแทนที่จะเขียน `openclaw.json` ใหม่
    - การโหลดซ้ำแบบทันทีจะข้ามการแก้ไขภายนอกที่ไม่ถูกต้อง และคงใช้การกำหนดค่ารันไทม์ปัจจุบันต่อไป
    - การเขียนที่ OpenClaw เป็นผู้ดำเนินการจะปฏิเสธเพย์โหลดที่ไม่ถูกต้องหรือก่อให้เกิดความเสียหายก่อนคอมมิต และบันทึก `.rejected.*`
    - `openclaw doctor --fix` รับผิดชอบการซ่อมแซม โดยสามารถลบคำนำหน้าที่ไม่ใช่ JSON หรือกู้คืนสำเนาล่าสุดที่ทราบว่าใช้งานได้ พร้อมเก็บเพย์โหลดที่ถูกปฏิเสธไว้เป็น `.clobbered.*`
    - เมื่อมีการซ่อมแซมหลายครั้งสำหรับพาธการกำหนดค่าเดียว OpenClaw จะหมุนเวียนไฟล์ `.clobbered.*` ที่เก่ากว่าออก เพื่อให้เพย์โหลดที่ซ่อมแซมล่าสุดยังคงพร้อมใช้งาน

  </Accordion>
  <Accordion title="ตรวจสอบและซ่อมแซม">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="ลักษณะที่พบบ่อย">
    - `.clobbered.*` มีอยู่ → doctor เก็บรักษาการแก้ไขภายนอกที่เสียหายไว้ระหว่างซ่อมแซมการกำหนดค่าที่ใช้งานอยู่
    - `.rejected.*` มีอยู่ → การเขียนการกำหนดค่าที่ OpenClaw เป็นเจ้าของไม่ผ่านการตรวจสอบสคีมาหรือการเขียนทับก่อนคอมมิต
    - `Config write rejected:` → การเขียนพยายามตัดโครงสร้างที่จำเป็นออก ลดขนาดไฟล์อย่างมาก หรือบันทึกการกำหนดค่าที่ไม่ถูกต้อง
    - `config reload skipped (invalid config):` → การแก้ไขโดยตรงไม่ผ่านการตรวจสอบและ Gateway ที่กำลังทำงานเพิกเฉยต่อการแก้ไขนั้น
    - `Invalid config at ...` → การเริ่มต้นล้มเหลวก่อนบริการ Gateway จะเริ่มทำงาน
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` หรือ `size-drop-vs-last-good:*` → การเขียนที่ OpenClaw เป็นเจ้าของถูกปฏิเสธ เพราะมีฟิลด์หรือขนาดลดลงเมื่อเทียบกับข้อมูลสำรองที่ใช้งานได้ล่าสุด
    - `Config last-known-good promotion skipped` → ข้อมูลที่เสนอมีตัวยึดตำแหน่งข้อมูลลับที่ถูกปกปิด เช่น `***`

  </Accordion>
  <Accordion title="ตัวเลือกการแก้ไข">
    1. เรียกใช้ `openclaw doctor --fix` เพื่อให้ doctor ซ่อมแซมการกำหนดค่าที่มีคำนำหน้า/ถูกเขียนทับ หรือคืนค่าข้อมูลที่ใช้งานได้ล่าสุด
    2. คัดลอกเฉพาะคีย์ที่ต้องการจาก `.clobbered.*` หรือ `.rejected.*` แล้วนำไปใช้ด้วย `openclaw config set` หรือ `config.patch`
    3. เรียกใช้ `openclaw config validate` ก่อนเริ่มใหม่
    4. หากแก้ไขด้วยตนเอง ให้คงการกำหนดค่า JSON5 ฉบับเต็มไว้ ไม่ใช่เฉพาะออบเจ็กต์บางส่วนที่ต้องการเปลี่ยน
  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [การกำหนดค่า](/th/cli/config)
- [การกำหนดค่า: โหลดใหม่ทันที](/th/gateway/configuration#config-hot-reload)
- [การกำหนดค่า: การตรวจสอบอย่างเข้มงวด](/th/gateway/configuration#strict-validation)
- [Doctor](/th/gateway/doctor)

## คำเตือนจากการตรวจสอบ Gateway

ใช้เมื่อ `openclaw gateway probe` เข้าถึงบางสิ่งได้ แต่ยังคงแสดงบล็อกคำเตือน

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

ตรวจหา:

- `warnings[].code` และ `primaryTargetId` ในเอาต์พุต JSON
- คำเตือนเกี่ยวข้องกับการสำรองไปใช้ SSH, Gateway หลายรายการ, ขอบเขตที่ขาดหาย หรือการอ้างอิงการยืนยันตัวตนที่แก้ไขไม่ได้

ลักษณะที่พบบ่อย:

- `SSH tunnel failed to start; falling back to direct probes.` → การตั้งค่า SSH ล้มเหลว แต่คำสั่งยังคงลองใช้เป้าหมายที่กำหนดค่าโดยตรง/ลูปแบ็ก
- `multiple reachable gateway identities detected` → Gateway คนละรายการตอบกลับ หรือ OpenClaw ไม่สามารถยืนยันได้ว่าเป้าหมายที่เข้าถึงได้เป็น Gateway เดียวกัน อุโมงค์ SSH, URL พร็อกซี หรือ URL ระยะไกลที่กำหนดค่าไว้ซึ่งชี้ไปยัง Gateway เดียวกัน จะถือเป็น Gateway หนึ่งรายการที่มีการขนส่งหลายแบบ แม้ว่าพอร์ตการขนส่งจะแตกต่างกัน
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → เชื่อมต่อสำเร็จ แต่ RPC รายละเอียดถูกจำกัดด้วยขอบเขต ให้จับคู่อัตลักษณ์อุปกรณ์หรือใช้ข้อมูลประจำตัวที่มี `operator.read`
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → เชื่อมต่อสำเร็จ แต่ชุด RPC วินิจฉัยฉบับเต็มหมดเวลาหรือล้มเหลว ให้ถือว่าเป็น Gateway ที่เข้าถึงได้แต่ความสามารถในการวินิจฉัยลดลง เปรียบเทียบ `connect.ok` และ `connect.rpcOk` ในเอาต์พุต `--json`
- `Capability: pairing-pending` หรือ `gateway closed (1008): pairing required` → Gateway ตอบกลับแล้ว แต่ไคลเอนต์นี้ยังต้องจับคู่/ได้รับอนุมัติก่อนจึงจะเข้าถึงในฐานะผู้ปฏิบัติงานได้ตามปกติ
- ข้อความเตือน SecretRef ของ `gateway.auth.*` / `gateway.remote.*` ที่แก้ไขไม่ได้ → วัสดุการยืนยันตัวตนไม่พร้อมใช้งานในเส้นทางคำสั่งนี้สำหรับเป้าหมายที่ล้มเหลว

ที่เกี่ยวข้อง:

- [Gateway](/th/cli/gateway)
- [Gateway หลายรายการบนโฮสต์เดียวกัน](/th/gateway#multiple-gateways-same-host)
- [การเข้าถึงระยะไกล](/th/gateway/remote)

## ช่องทางเชื่อมต่อแล้ว แต่ข้อความไม่ไหล

หากสถานะช่องทางเชื่อมต่อแล้วแต่ข้อความไม่ไหล ให้เน้นตรวจสอบนโยบาย สิทธิ์ และกฎการส่งที่เฉพาะเจาะจงของช่องทาง

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

ตรวจหา:

- นโยบาย DM (`pairing`, `allowlist`, `open`, `disabled`)
- รายการอนุญาตของกลุ่มและข้อกำหนดการกล่าวถึง
- สิทธิ์/ขอบเขต API ของช่องทางที่ขาดหาย

ลักษณะที่พบบ่อย:

- `mention required` → ข้อความถูกเพิกเฉยตามนโยบายการกล่าวถึงในกลุ่ม
- `pairing` / ร่องรอยการรออนุมัติ → ผู้ส่งยังไม่ได้รับอนุมัติ
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → ปัญหาการยืนยันตัวตน/สิทธิ์ของช่องทาง

ที่เกี่ยวข้อง:

- [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)
- [Discord](/th/channels/discord)
- [Telegram](/th/channels/telegram)
- [WhatsApp](/th/channels/whatsapp)

## การส่ง Cron และ Heartbeat

หาก Cron หรือ Heartbeat ไม่ทำงานหรือไม่ส่ง ให้ตรวจสอบสถานะตัวจัดกำหนดการก่อน แล้วจึงตรวจสอบเป้าหมายการส่ง

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

ตรวจหา:

- เปิดใช้ Cron และมีเวลาปลุกครั้งถัดไป
- สถานะประวัติการรันงาน (`ok`, `skipped`, `error`)
- เหตุผลที่ข้าม Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`)

<AccordionGroup>
  <Accordion title="ลักษณะที่พบบ่อย">
    - `cron: scheduler disabled; jobs will not run automatically` → ปิดใช้ Cron
    - `cron: timer tick failed` → รอบการทำงานของตัวจัดกำหนดการล้มเหลว ให้ตรวจสอบข้อผิดพลาดของไฟล์/บันทึก/รันไทม์
    - `heartbeat skipped` ร่วมกับ `reason=quiet-hours` → อยู่นอกช่วงเวลาทำงาน
    - `heartbeat skipped` ร่วมกับ `reason=empty-heartbeat-file` → มี `HEARTBEAT.md` อยู่ แต่มีเพียงโครงร่างที่เป็นช่องว่าง ความคิดเห็น ส่วนหัว รั้ว หรือรายการตรวจสอบว่าง OpenClaw จึงข้ามการเรียกโมเดล
    - `heartbeat skipped` ร่วมกับ `reason=no-tasks-due` → `HEARTBEAT.md` มีบล็อก `tasks:` แต่ยังไม่มีงานใดถึงกำหนดในรอบนี้
    - `heartbeat: unknown accountId` → รหัสบัญชีสำหรับเป้าหมายการส่ง Heartbeat ไม่ถูกต้อง
    - `heartbeat skipped` ร่วมกับ `reason=dm-blocked` → เป้าหมาย Heartbeat ถูกแก้ไขเป็นปลายทางแบบ DM ขณะที่ตั้งค่า `agents.defaults.heartbeat.directPolicy` (หรือค่าที่แทนที่สำหรับแต่ละเอเจนต์) เป็น `block`

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Heartbeat](/th/gateway/heartbeat)
- [งานตามกำหนดเวลา](/th/automation/cron-jobs)
- [งานตามกำหนดเวลา: การแก้ไขปัญหา](/th/automation/cron-jobs#troubleshooting)

## จับคู่ Node แล้ว แต่เครื่องมือล้มเหลว

หากจับคู่ Node แล้วแต่เครื่องมือล้มเหลว ให้แยกตรวจสอบสถานะเบื้องหน้า สิทธิ์ และการอนุมัติ

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

ตรวจหา:

- Node ออนไลน์พร้อมความสามารถตามที่คาดไว้
- การให้สิทธิ์ของระบบปฏิบัติการสำหรับกล้อง/ไมโครโฟน/ตำแหน่ง/หน้าจอ
- สถานะการอนุมัติการดำเนินการและรายการอนุญาต

ลักษณะที่พบบ่อย:

- `NODE_BACKGROUND_UNAVAILABLE` → แอป Node ต้องอยู่เบื้องหน้า
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → ขาดสิทธิ์ของระบบปฏิบัติการ
- `SYSTEM_RUN_DENIED: approval required` → การอนุมัติการดำเนินการอยู่ระหว่างรอ
- `SYSTEM_RUN_DENIED: allowlist miss` → คำสั่งถูกบล็อกโดยรายการอนุญาต

ที่เกี่ยวข้อง:

- [การอนุมัติการดำเนินการ](/th/tools/exec-approvals)
- [การแก้ไขปัญหา Node](/th/nodes/troubleshooting)
- [Node](/th/nodes/index)

## เครื่องมือเบราว์เซอร์ล้มเหลว

ใช้เมื่อการทำงานของเครื่องมือเบราว์เซอร์ล้มเหลว แม้ Gateway จะทำงานปกติ

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

ตรวจหา:

- ตั้งค่า `plugins.allow` ไว้หรือไม่ และมี `browser` หรือไม่
- พาธไฟล์ปฏิบัติการของเบราว์เซอร์ที่ถูกต้อง
- การเข้าถึงโปรไฟล์ CDP
- ความพร้อมใช้งานของ Chrome ภายในเครื่องสำหรับโปรไฟล์ `existing-session` / `user`

<AccordionGroup>
  <Accordion title="ลักษณะของ Plugin / ไฟล์ปฏิบัติการ">
    - `unknown command "browser"` หรือ `unknown command 'browser'` → Plugin เบราว์เซอร์ที่รวมมาด้วยถูก `plugins.allow` ยกเว้น
    - เครื่องมือเบราว์เซอร์หายไป / ใช้งานไม่ได้ขณะที่ `browser.enabled=true` → `plugins.allow` ยกเว้น `browser` ทำให้ Plugin ไม่เคยโหลด
    - `Failed to start Chrome CDP on port` → กระบวนการเบราว์เซอร์เริ่มทำงานไม่สำเร็จ
    - `browser.executablePath not found` → พาธที่กำหนดค่าไม่ถูกต้อง
    - `browser.cdpUrl must be http(s) or ws(s)` → URL ของ CDP ที่กำหนดค่าใช้รูปแบบที่ไม่รองรับ เช่น `file:` หรือ `ftp:`
    - `browser.cdpUrl has invalid port` → URL ของ CDP ที่กำหนดค่ามีพอร์ตไม่ถูกต้องหรืออยู่นอกช่วง
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → การติดตั้ง Gateway ปัจจุบันไม่มีการขึ้นต่อกันของรันไทม์เบราว์เซอร์หลัก ให้ติดตั้งใหม่หรืออัปเดต OpenClaw แล้วเริ่ม Gateway ใหม่ สแนปช็อต ARIA และภาพหน้าจอพื้นฐานของหน้ายังทำงานได้ แต่การนำทาง สแนปช็อต AI ภาพหน้าจอองค์ประกอบด้วยตัวเลือก CSS และการส่งออก PDF จะยังใช้งานไม่ได้

  </Accordion>
  <Accordion title="ลักษณะของ Chrome MCP / เซสชันที่มีอยู่">
    - `Could not find DevToolsActivePort for chrome` → เซสชันที่มีอยู่ของ Chrome MCP ยังเชื่อมต่อกับไดเรกทอรีข้อมูลเบราว์เซอร์ที่เลือกไม่ได้ เปิดหน้าตรวจสอบของเบราว์เซอร์ เปิดใช้การดีบักระยะไกล เปิดเบราว์เซอร์ทิ้งไว้ อนุมัติคำขอเชื่อมต่อครั้งแรก แล้วลองใหม่ หากไม่จำเป็นต้องใช้สถานะที่ลงชื่อเข้าใช้ ให้เลือกใช้โปรไฟล์ `openclaw` ที่มีการจัดการ
    - `No browser tabs found for profile="user"` → โปรไฟล์เชื่อมต่อของ Chrome MCP ไม่มีแท็บ Chrome ภายในเครื่องที่เปิดอยู่
    - `Remote CDP for profile "<name>" is not reachable` → ปลายทาง CDP ระยะไกลที่กำหนดค่าไม่สามารถเข้าถึงได้จากโฮสต์ Gateway
    - `Browser attachOnly is enabled ... not reachable` หรือ `Browser attachOnly is enabled and CDP websocket ... is not reachable` → โปรไฟล์แบบเชื่อมต่อเท่านั้นไม่มีเป้าหมายที่เข้าถึงได้ หรือปลายทาง HTTP ตอบกลับแล้วแต่ยังเปิด WebSocket ของ CDP ไม่ได้

  </Accordion>
  <Accordion title="ลักษณะขององค์ประกอบ / ภาพหน้าจอ / การอัปโหลด">
    - `fullPage is not supported for element screenshots` → คำขอภาพหน้าจอใช้ `--full-page` ร่วมกับ `--ref` หรือ `--element`
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → การเรียกภาพหน้าจอของ Chrome MCP / `existing-session` ต้องใช้การจับภาพหน้า หรือ `--ref` ของสแนปช็อต ไม่ใช่ `--element` ของ CSS
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → ฮุกการอัปโหลดของ Chrome MCP ต้องใช้การอ้างอิงสแนปช็อต ไม่ใช่ตัวเลือก CSS
    - `existing-session file uploads currently support one file at a time.` → ส่งการอัปโหลดครั้งละหนึ่งรายการต่อการเรียกบนโปรไฟล์ Chrome MCP
    - `existing-session dialog handling does not support timeoutMs.` → ฮุกกล่องโต้ตอบบนโปรไฟล์ Chrome MCP ไม่รองรับการแทนที่ค่าหมดเวลา
    - `existing-session type does not support timeoutMs overrides.` → ละเว้น `timeoutMs` สำหรับ `act:type` บนโปรไฟล์เซสชันที่มีอยู่ของ `profile="user"` / Chrome MCP หรือใช้โปรไฟล์เบราว์เซอร์แบบมีการจัดการ/CDP เมื่อต้องใช้ค่าหมดเวลาแบบกำหนดเอง
    - `response body is not supported for existing-session profiles yet.` → `responsebody` ยังคงต้องใช้เบราว์เซอร์แบบมีการจัดการหรือโปรไฟล์ CDP ดิบ
    - การแทนที่วิวพอร์ต / โหมดมืด / โลแคล / ออฟไลน์ที่ค้างอยู่บนโปรไฟล์แบบเชื่อมต่อเท่านั้นหรือ CDP ระยะไกล → เรียกใช้ `openclaw browser stop --browser-profile <name>` เพื่อปิดเซสชันควบคุมที่ใช้งานอยู่และปล่อยสถานะการจำลอง Playwright/CDP โดยไม่ต้องเริ่ม Gateway ทั้งหมดใหม่

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [เบราว์เซอร์ (จัดการโดย OpenClaw)](/th/tools/browser)
- [การแก้ไขปัญหาเบราว์เซอร์](/th/tools/browser-linux-troubleshooting)

## หากอัปเกรดแล้วบางสิ่งเสียหายกะทันหัน

ความเสียหายหลังอัปเกรดส่วนใหญ่เกิดจากการกำหนดค่าคลาดเคลื่อน หรือมีการบังคับใช้ค่าเริ่มต้นที่เข้มงวดขึ้นในขณะนี้

<AccordionGroup>
  <Accordion title="1. ลักษณะการทำงานของการยืนยันตัวตนและการแทนที่ URL มีการเปลี่ยนแปลง">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    สิ่งที่ต้องตรวจสอบ:

    - หาก `gateway.mode=remote` การเรียกผ่าน CLI อาจกำลังกำหนดเป้าหมายไปยังระบบระยะไกล ขณะที่บริการภายในเครื่องยังทำงานเป็นปกติ
    - การเรียก `--url` แบบระบุชัดเจนจะไม่ย้อนกลับไปใช้ข้อมูลประจำตัวที่จัดเก็บไว้

    อาการที่พบบ่อย:

    - `gateway connect failed:` → เป้าหมาย URL ไม่ถูกต้อง
    - `unauthorized` → เข้าถึงปลายทางได้ แต่การยืนยันตัวตนไม่ถูกต้อง

  </Accordion>
  <Accordion title="2. มาตรการป้องกันสำหรับการผูกและการยืนยันตัวตนเข้มงวดขึ้น">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    สิ่งที่ต้องตรวจสอบ:

    - การผูกแบบไม่ใช่ลูปแบ็ก (`lan`, `tailnet`, `custom`) ต้องมีเส้นทางการยืนยันตัวตนของ Gateway ที่ถูกต้อง ได้แก่ การยืนยันตัวตนด้วยโทเค็น/รหัสผ่านที่ใช้ร่วมกัน หรือการปรับใช้ `trusted-proxy` แบบไม่ใช่ลูปแบ็กที่กำหนดค่าไว้อย่างถูกต้อง
    - คีย์เก่า เช่น `gateway.token` ไม่สามารถใช้แทน `gateway.auth.token` ได้

    อาการที่พบบ่อย:

    - `refusing to bind gateway ... without auth` → การผูกแบบไม่ใช่ลูปแบ็กโดยไม่มีเส้นทางการยืนยันตัวตนของ Gateway ที่ถูกต้อง
    - `Connectivity probe: failed` ขณะที่รันไทม์กำลังทำงาน → Gateway ทำงานอยู่ แต่ไม่สามารถเข้าถึงได้ด้วยการยืนยันตัวตน/URL ปัจจุบัน

  </Accordion>
  <Accordion title="3. สถานะการจับคู่และข้อมูลประจำตัวของอุปกรณ์มีการเปลี่ยนแปลง">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    สิ่งที่ต้องตรวจสอบ:

    - การอนุมัติอุปกรณ์ที่รอดำเนินการสำหรับแดชบอร์ด/โหนด
    - การอนุมัติการจับคู่ DM ที่รอดำเนินการหลังจากมีการเปลี่ยนแปลงนโยบายหรือข้อมูลประจำตัว

    อาการที่พบบ่อย:

    - `device identity required` → ไม่เป็นไปตามข้อกำหนดการยืนยันตัวตนของอุปกรณ์
    - `pairing required` → ต้องอนุมัติผู้ส่ง/อุปกรณ์

  </Accordion>
</AccordionGroup>

หากการกำหนดค่าบริการและรันไทม์ยังคงไม่ตรงกันหลังจากตรวจสอบแล้ว ให้ติดตั้งข้อมูลเมตาของบริการอีกครั้งจากไดเรกทอรีโปรไฟล์/สถานะเดียวกัน:

```bash
openclaw gateway install --force
openclaw gateway restart
```

เนื้อหาที่เกี่ยวข้อง:

- [การยืนยันตัวตน](/th/gateway/authentication)
- [การดำเนินการเบื้องหลังและเครื่องมือกระบวนการ](/th/gateway/background-process)
- [การจับคู่ Node](/th/gateway/pairing)

## เนื้อหาที่เกี่ยวข้อง

- [Doctor](/th/gateway/doctor)
- [คำถามที่พบบ่อย](/th/help/faq)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
