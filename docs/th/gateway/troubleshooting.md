---
read_when:
    - ศูนย์รวมการแก้ไขปัญหาแนะนำให้มาที่นี่เพื่อวินิจฉัยเชิงลึกยิ่งขึ้น
    - คุณต้องมีส่วนคู่มือปฏิบัติงานตามอาการที่เสถียร พร้อมคำสั่งที่ถูกต้องแม่นยำ
sidebarTitle: Troubleshooting
summary: คู่มือการแก้ไขปัญหาเชิงลึกสำหรับ Gateway, ช่องทาง, ระบบอัตโนมัติ, Node และเบราว์เซอร์
title: การแก้ไขปัญหา
x-i18n:
    generated_at: "2026-07-20T05:58:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a6e3da86a5f655582ea17e1ed3988fc32294c25a34cee04dbcc3e492c997c366
    source_path: gateway/troubleshooting.md
    workflow: 16
---

นี่คือคู่มือปฏิบัติงานเชิงลึก เริ่มที่ [/help/troubleshooting](/th/help/troubleshooting) เพื่อทำตามขั้นตอนการคัดกรองปัญหาแบบรวดเร็วก่อน

## ลำดับคำสั่ง

เรียกใช้ตามลำดับนี้:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

สัญญาณที่บ่งชี้ว่าระบบทำงานเป็นปกติ:

- `openclaw gateway status` แสดง `Runtime: running`, `Connectivity probe: ok` และบรรทัด `Capability: ...`
- `openclaw doctor` รายงานว่าไม่มีปัญหาการกำหนดค่าหรือบริการที่ขัดขวางการทำงาน
- `openclaw channels status --probe` แสดงสถานะการรับส่งข้อมูลแบบสดสำหรับแต่ละบัญชี และแสดง `works` หรือ `audit ok` ในกรณีที่รองรับ

## หลังการอัปเดต

ใช้เมื่อการอัปเดตเสร็จสิ้นแล้ว แต่ Gateway หยุดทำงาน ช่องไม่มีข้อมูล หรือการเรียกโมเดลล้มเหลวด้วยข้อผิดพลาด 401

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

ตรวจสอบสิ่งต่อไปนี้:

- `Update restart` ใน `openclaw status` / `openclaw status --all` การส่งต่องานที่รอดำเนินการหรือล้มเหลวจะระบุคำสั่งถัดไปที่ต้องเรียกใช้
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` ใต้ Channels: การกำหนดค่าช่องยังคงอยู่ แต่การลงทะเบียน Plugin ล้มเหลวก่อนที่จะโหลดช่องได้
- ข้อผิดพลาด 401 จากผู้ให้บริการหลังยืนยันตัวตนอีกครั้ง: `openclaw doctor --fix` ตรวจหาเงาข้อมูลยืนยันตัวตน OAuth ที่ล้าสมัยของแต่ละเอเจนต์และนำสำเนาเก่าออก เพื่อให้เอเจนต์ทั้งหมดเลือกใช้โปรไฟล์ที่แชร์ร่วมกันในปัจจุบัน

## การติดตั้งที่แยกกันทำงานและกลไกป้องกันการกำหนดค่าจากเวอร์ชันใหม่กว่า

ใช้เมื่อบริการ Gateway หยุดทำงานโดยไม่คาดคิดหลังการอัปเดต หรือบันทึกแสดงว่าไบนารี `openclaw` หนึ่งรายการเก่ากว่าเวอร์ชันที่เขียน `openclaw.json` ครั้งล่าสุด

OpenClaw ประทับเวอร์ชันลงในการเขียนการกำหนดค่าด้วย `meta.lastTouchedVersion` คำสั่งแบบอ่านอย่างเดียวสามารถตรวจสอบการกำหนดค่าที่เขียนโดย OpenClaw เวอร์ชันใหม่กว่าได้ แต่การเปลี่ยนแปลงกระบวนการและบริการจะไม่ยอมทำงานจากไบนารีเวอร์ชันเก่ากว่า การดำเนินการที่ถูกบล็อก ได้แก่ การเริ่ม/หยุด/เริ่มใหม่/ถอนการติดตั้งบริการ Gateway, การบังคับติดตั้งบริการใหม่, การเริ่ม Gateway ในโหมดบริการ และการล้างพอร์ต `gateway --force`

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="แก้ไข PATH">
    แก้ไข `PATH` เพื่อให้ `openclaw` ชี้ไปยังการติดตั้งที่ใหม่กว่า แล้วเรียกใช้การดำเนินการอีกครั้ง
  </Step>
  <Step title="ติดตั้งบริการ Gateway ใหม่">
    ติดตั้งบริการ Gateway ที่ต้องการอีกครั้งจากการติดตั้งที่ใหม่กว่า:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="นำตัวห่อหุ้มที่ล้าสมัยออก">
    นำรายการแพ็กเกจระบบหรือตัวห่อหุ้มเก่าที่ยังคงชี้ไปยังไบนารี `openclaw` เวอร์ชันเก่าออก
  </Step>
</Steps>

<Warning>
สำหรับการดาวน์เกรดโดยตั้งใจหรือการกู้คืนฉุกเฉินเท่านั้น ให้ตั้งค่า `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` สำหรับคำสั่งนั้นเพียงคำสั่งเดียว สำหรับการทำงานปกติให้ปล่อยไว้โดยไม่ตั้งค่า
</Warning>

## โปรโตคอลไม่ตรงกันหลังย้อนกลับ

ใช้เมื่อบันทึกยังคงแสดง `protocol mismatch` หลังการดาวน์เกรดหรือย้อนกลับ Gateway เวอร์ชันเก่ากำลังทำงานอยู่ แต่กระบวนการไคลเอนต์ในเครื่องเวอร์ชันใหม่กว่ายังคงเชื่อมต่อใหม่ด้วยช่วงโปรโตคอลที่ Gateway เวอร์ชันเก่าไม่รองรับ

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

ตรวจสอบสิ่งต่อไปนี้:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` ในบันทึกของ Gateway
- `Established clients:` ใน `openclaw gateway status --deep` หรือ `Gateway clients` ใน `openclaw doctor --deep`: ไคลเอนต์ TCP ที่ใช้งานอยู่และเชื่อมต่อกับพอร์ต Gateway พร้อม PID และบรรทัดคำสั่งเมื่อระบบปฏิบัติการอนุญาต
- กระบวนการไคลเอนต์ที่บรรทัดคำสั่งชี้ไปยังการติดตั้งหรือตัวห่อหุ้ม OpenClaw เวอร์ชันใหม่กว่าที่คุณย้อนกลับมา

วิธีแก้ไข:

1. หยุดหรือเริ่มกระบวนการไคลเอนต์ OpenClaw ที่ล้าสมัยซึ่ง `gateway status --deep` แสดงขึ้นมาใหม่
2. เริ่มแอปหรือตัวห่อหุ้มที่ฝัง OpenClaw ใหม่ ได้แก่ แดชบอร์ดในเครื่อง ตัวแก้ไข ตัวช่วยแอปเซิร์ฟเวอร์ หรือเชลล์ `openclaw logs --follow` ที่ทำงานเป็นเวลานาน
3. เรียกใช้ `openclaw gateway status --deep` หรือ `openclaw doctor --deep` อีกครั้ง และยืนยันว่า PID ของไคลเอนต์ที่ล้าสมัยหายไปแล้ว

อย่าทำให้ Gateway เวอร์ชันเก่ายอมรับโปรโตคอลเวอร์ชันใหม่กว่าที่เข้ากันไม่ได้ การเพิ่มเวอร์ชันโปรโตคอลช่วยปกป้องสัญญาการสื่อสารผ่านสาย ส่วนการกู้คืนหลังย้อนกลับเป็นปัญหาที่ต้องล้างกระบวนการและเวอร์ชัน

## ข้าม symlink ของ Skill เนื่องจากออกนอกขอบเขตพาธ

ใช้เมื่อบันทึกมีข้อความ:

```text
ข้ามพาธ Skill ที่ออกนอกขอบเขตรูทที่กำหนดค่าไว้: ... reason=symlink-escape
```

รูทของ Skill ทุกแห่งเป็นขอบเขตจำกัดพื้นที่ symlink ภายใต้ `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` หรือ `~/.openclaw/skills` จะถูกข้ามเมื่อเป้าหมายจริงชี้ออกนอกรูทนั้น เว้นแต่เป้าหมายดังกล่าวได้รับความเชื่อถืออย่างชัดเจน

ตรวจสอบลิงก์:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

หากตั้งใจใช้เป้าหมายนั้น ให้กำหนดค่าทั้งรูทของ Skill โดยตรงและเป้าหมาย symlink ที่อนุญาต:

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

จากนั้นเริ่มเซสชันใหม่หรือรอให้ตัวเฝ้าดู Skills รีเฟรช เริ่ม Gateway ใหม่หากกระบวนการที่กำลังทำงานเริ่มต้นขึ้นก่อนมีการเปลี่ยนแปลงการกำหนดค่า

อย่าใช้เป้าหมายที่กว้าง เช่น `~`, `/` หรือทั้งโฟลเดอร์โครงการที่ซิงค์ไว้ จำกัดขอบเขต `allowSymlinkTargets` ไว้เฉพาะรูทของ Skill จริงซึ่งมีไดเรกทอรี `SKILL.md` ที่เชื่อถือได้

หากการนำการเปลี่ยนแปลงจาก Skill Workshop ไปใช้ควรเขียนผ่านพาธ Skill ในพื้นที่ทำงานที่เป็น symlink และได้รับความเชื่อถือเหล่านั้นด้วย ให้เปิดใช้ `skills.workshop.allowSymlinkTargetWrites` ปิดไว้สำหรับรูทของ Skill ที่แชร์ร่วมกันแบบอ่านอย่างเดียว

ข้อมูลที่เกี่ยวข้อง:

- [การกำหนดค่า Skills](/th/tools/skills-config#symlinked-skill-roots)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 ต้องใช้สิทธิ์การใช้งานเพิ่มเติมสำหรับบริบทยาว

ใช้เมื่อบันทึกหรือข้อผิดพลาดมีข้อความ: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

ตรวจสอบสิ่งต่อไปนี้:

- โมเดล Anthropic ที่เลือกเป็นโมเดล Claude 4.x ที่รองรับ 1M แบบ GA (Opus 4.6/4.7/4.8, Sonnet 4.6) หรือการกำหนดค่าโมเดลยังคงมี `params.context1m: true` แบบเดิม
- ข้อมูลประจำตัว Anthropic ปัจจุบันไม่มีสิทธิ์ใช้งานบริบทยาว
- คำขอล้มเหลวเฉพาะในเซสชันหรือการเรียกใช้โมเดลที่ยาวและต้องใช้เส้นทางบริบท 1M

ตัวเลือกในการแก้ไข:

<Steps>
  <Step title="ใช้หน้าต่างบริบทมาตรฐาน">
    เปลี่ยนไปใช้โมเดลที่มีหน้าต่างมาตรฐาน หรือนำ `context1m` แบบเดิมออกจาก
    การกำหนดค่าโมเดลเก่าที่ไม่รองรับบริบท 1M แบบ GA
  </Step>
  <Step title="ใช้ข้อมูลประจำตัวที่มีสิทธิ์">
    ใช้ข้อมูลประจำตัว Anthropic ที่มีสิทธิ์ส่งคำขอบริบทยาว หรือเปลี่ยนไปใช้คีย์ API ของ Anthropic
  </Step>
  <Step title="กำหนดค่าโมเดลสำรอง">
    กำหนดค่าโมเดลสำรองเพื่อให้การทำงานดำเนินต่อเมื่อคำขอบริบทยาวของ Anthropic ถูกปฏิเสธ
  </Step>
</Steps>

ข้อมูลที่เกี่ยวข้อง:

- [Anthropic](/th/providers/anthropic)
- [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use)
- [เหตุใดจึงพบ HTTP 429 จาก Anthropic](/th/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## การตอบกลับ 403 ที่ถูกบล็อกจากระบบต้นทาง

ใช้เมื่อผู้ให้บริการ LLM ต้นทางส่งคืน `403` ทั่วไป เช่น `Your request was blocked`

อย่าสันนิษฐานว่านี่เป็นปัญหาการกำหนดค่า OpenClaw เสมอไป การตอบกลับอาจมาจากชั้นความปลอดภัยต้นทาง เช่น CDN, WAF, กฎการจัดการบอต หรือพร็อกซีย้อนกลับที่อยู่หน้าเอ็นด์พอยต์ที่เข้ากันได้กับ OpenAI

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

ตรวจสอบสิ่งต่อไปนี้:

- โมเดลหลายรายการภายใต้ผู้ให้บริการเดียวกันล้มเหลวในลักษณะเดียวกัน
- มี HTML หรือข้อความความปลอดภัยทั่วไปแทนข้อผิดพลาด API ตามปกติของผู้ให้บริการ
- มีเหตุการณ์ด้านความปลอดภัยฝั่งผู้ให้บริการในเวลาเดียวกับคำขอ
- การตรวจสอบ `curl` โดยตรงขนาดเล็กมากสำเร็จ แต่คำขอที่มีรูปแบบตาม SDK ตามปกติล้มเหลว

แก้ไขการกรองฝั่งผู้ให้บริการก่อนเมื่อหลักฐานชี้ว่าเกิดการบล็อกจาก WAF/CDN ควรใช้กฎอนุญาตหรือข้ามที่จำกัดขอบเขตอย่างแคบสำหรับพาธ API ที่ OpenClaw ใช้ และหลีกเลี่ยงการปิดการป้องกันทั้งเว็บไซต์

<Warning>
การทดสอบ `curl` ขั้นต่ำที่สำเร็จไม่ได้รับประกันว่าคำขอรูปแบบ SDK จริงจะผ่านชั้นความปลอดภัยต้นทางเดียวกัน
</Warning>

ข้อมูลที่เกี่ยวข้อง:

- [เอ็นด์พอยต์ที่เข้ากันได้กับ OpenAI](/th/gateway/configuration-reference#openai-compatible-endpoints)
- [การกำหนดค่าผู้ให้บริการ](/th/providers)
- [บันทึก](/th/logging)

## แบ็กเอนด์ในเครื่องที่เข้ากันได้กับ OpenAI ผ่านการตรวจสอบโดยตรง แต่การทำงานของเอเจนต์ล้มเหลว

ใช้เมื่อ:

- `curl ... /v1/models` ทำงานได้
- การเรียก `/v1/chat/completions` โดยตรงขนาดเล็กทำงานได้
- การเรียกใช้โมเดล OpenClaw ล้มเหลวเฉพาะในรอบการทำงานตามปกติของเอเจนต์

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

ตรวจสอบสิ่งต่อไปนี้:

- การเรียกโดยตรงขนาดเล็กสำเร็จ แต่การทำงานของ OpenClaw ล้มเหลวเฉพาะเมื่อใช้พรอมต์ขนาดใหญ่ขึ้น
- `model_not_found` หรือข้อผิดพลาด 404 แม้ว่า `/v1/chat/completions` โดยตรงจะทำงานได้ด้วยรหัสโมเดลเปล่าเดียวกัน
- ข้อผิดพลาดของแบ็กเอนด์ที่ระบุว่า `messages[].content` ต้องเป็นสตริง
- คำเตือน `incomplete turn detected ... stopReason=stop payloads=0` ที่เกิดขึ้นเป็นระยะกับแบ็กเอนด์ในเครื่องที่เข้ากันได้กับ OpenAI
- แบ็กเอนด์ขัดข้องเฉพาะเมื่อมีจำนวนโทเค็นพรอมต์มากขึ้นหรือใช้พรอมต์รันไทม์ของเอเจนต์แบบเต็ม

<AccordionGroup>
  <Accordion title="ลักษณะอาการที่พบบ่อย">
    - `model_not_found` กับเซิร์ฟเวอร์ในเครื่องรูปแบบ MLX/vLLM: ตรวจสอบว่า `baseUrl` มี `/v1`, `api` เป็น `"openai-completions"` สำหรับแบ็กเอนด์ `/v1/chat/completions` และ `models.providers.<provider>.models[].id` เป็นรหัสเฉพาะของผู้ให้บริการแบบเปล่า เลือกโดยใช้คำนำหน้าผู้ให้บริการเพียงครั้งเดียว เช่น `mlx/mlx-community/Qwen3-30B-A3B-6bit`; เก็บรายการแค็ตตาล็อกเป็น `mlx-community/Qwen3-30B-A3B-6bit`
    - `messages[...].content: invalid type: sequence, expected a string`: แบ็กเอนด์ปฏิเสธส่วนเนื้อหา Chat Completions แบบมีโครงสร้าง วิธีแก้ไข: ตั้งค่า `models.providers.<provider>.models[].compat.requiresStringContent: true`
    - `validation.keys` หรือคีย์ข้อความที่อนุญาต เช่น `["role","content"]`: แบ็กเอนด์ปฏิเสธข้อมูลเมตาการเล่นซ้ำแบบ OpenAI ในข้อความ Chat Completions วิธีแก้ไข: ตั้งค่า `models.providers.<provider>.models[].compat.strictMessageKeys: true`
    - `incomplete turn detected ... stopReason=stop payloads=0`: แบ็กเอนด์ประมวลผลคำขอ Chat Completions เสร็จสิ้นแล้ว แต่ไม่ส่งคืนข้อความของผู้ช่วยที่ผู้ใช้มองเห็นได้สำหรับรอบนั้น OpenClaw ลองเล่นซ้ำรอบที่ว่างเปล่าและปลอดภัยต่อการเล่นซ้ำซึ่งเข้ากันได้กับ OpenAI อีกหนึ่งครั้ง ความล้มเหลวที่ยังคงเกิดขึ้นมักหมายความว่าแบ็กเอนด์กำลังส่งเนื้อหาว่าง/ไม่ใช่ข้อความ หรือระงับข้อความคำตอบสุดท้าย
    - คำขอโดยตรงขนาดเล็กสำเร็จ แต่การทำงานของเอเจนต์ OpenClaw ล้มเหลวด้วยการขัดข้องของแบ็กเอนด์/โมเดล (ตัวอย่างเช่น Gemma ในบิลด์ `inferrs` บางรุ่น): การรับส่งข้อมูลของ OpenClaw มีแนวโน้มว่าถูกต้องอยู่แล้ว แต่แบ็กเอนด์ล้มเหลวเมื่อพบรูปแบบพรอมต์รันไทม์ของเอเจนต์ที่มีขนาดใหญ่กว่า
    - ความล้มเหลวลดลงหลังปิดใช้เครื่องมือแต่ไม่หายไป: สคีมาของเครื่องมือเป็นส่วนหนึ่งของภาระ แต่ปัญหาที่เหลือยังคงเป็นความจุของโมเดล/เซิร์ฟเวอร์ต้นทางหรือข้อบกพร่องของแบ็กเอนด์

  </Accordion>
  <Accordion title="ตัวเลือกในการแก้ไข">
    1. ตั้งค่า `compat.requiresStringContent: true` สำหรับแบ็กเอนด์ Chat Completions ที่รองรับเฉพาะสตริง
    2. ตั้งค่า `compat.strictMessageKeys: true` สำหรับแบ็กเอนด์ Chat Completions แบบเข้มงวดที่ยอมรับเฉพาะ `role` และ `content` ในแต่ละข้อความ
    3. ตั้งค่า `compat.supportsTools: false` สำหรับโมเดล/แบ็กเอนด์ที่ไม่สามารถจัดการพื้นผิวสคีมาเครื่องมือของ OpenClaw ได้อย่างน่าเชื่อถือ
    4. ลดภาระของพรอมต์เมื่อทำได้: ใช้การเริ่มต้นพื้นที่ทำงานที่เล็กลง ประวัติเซสชันที่สั้นลง โมเดลในเครื่องที่เบากว่า หรือแบ็กเอนด์ที่รองรับบริบทยาวได้ดีกว่า
    5. หากคำขอโดยตรงขนาดเล็กยังคงสำเร็จ แต่รอบการทำงานของเอเจนต์ OpenClaw ยังทำให้แบ็กเอนด์ขัดข้อง ให้ถือว่าเป็นข้อจำกัดของเซิร์ฟเวอร์/โมเดลต้นทาง และส่งกรณีจำลองปัญหาไปยังโครงการนั้นพร้อมรูปแบบเพย์โหลดที่ระบบยอมรับ
  </Accordion>
</AccordionGroup>

ข้อมูลที่เกี่ยวข้อง:

- [การกำหนดค่า](/th/gateway/configuration)
- [โมเดลภายในเครื่อง](/th/gateway/local-models)
- [เอนด์พอยต์ที่เข้ากันได้กับ OpenAI](/th/gateway/configuration-reference#openai-compatible-endpoints)

## ไม่มีการตอบกลับ

หากช่องทางทำงานอยู่แต่ไม่มีการตอบกลับ ให้ตรวจสอบการกำหนดเส้นทางและนโยบายก่อนเชื่อมต่อสิ่งใดใหม่

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

ตรวจหา:

- การจับคู่ที่รอดำเนินการสำหรับผู้ส่งข้อความส่วนตัว
- การจำกัดด้วยการกล่าวถึงในกลุ่ม (`requireMention`, `mentionPatterns`)
- รายการอนุญาตของช่องทาง/กลุ่มไม่ตรงกัน

รูปแบบที่พบบ่อย:

- `drop guild message (mention required` → ระบบจะเพิกเฉยต่อข้อความกลุ่มจนกว่าจะมีการกล่าวถึง
- `pairing request` → ผู้ส่งต้องได้รับการอนุมัติ
- `blocked` / `allowlist` → ผู้ส่ง/ช่องทางถูกกรองโดยนโยบาย

หัวข้อที่เกี่ยวข้อง:

- [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)
- [กลุ่ม](/th/channels/groups)
- [การจับคู่](/th/channels/pairing)

## การเชื่อมต่อ UI ควบคุมของแดชบอร์ด

เมื่อแดชบอร์ด/UI ควบคุมเชื่อมต่อไม่ได้ ให้ตรวจสอบ URL, โหมดการยืนยันตัวตน และข้อกำหนดเกี่ยวกับบริบทที่ปลอดภัย

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

ตรวจหา:

- URL สำหรับตรวจสอบและ URL ของแดชบอร์ดที่ถูกต้อง
- โหมดการยืนยันตัวตน/โทเค็นระหว่างไคลเอ็นต์กับ Gateway ไม่ตรงกัน
- มีการใช้ HTTP ในกรณีที่ต้องใช้ข้อมูลประจำตัวของอุปกรณ์

หากเบราว์เซอร์ภายในเครื่องเชื่อมต่อกับ `127.0.0.1:18789` ไม่ได้หลังการอัปเดต ให้กู้คืนบริการ Gateway ภายในเครื่องก่อน และยืนยันว่าบริการกำลังให้บริการแดชบอร์ด:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

หาก `curl` ส่งคืน HTML ของ OpenClaw แสดงว่า Gateway ทำงานอยู่ และปัญหาที่เหลือน่าจะเกิดจากแคชของเบราว์เซอร์ ดีปลิงก์เก่า หรือสถานะแท็บที่ค้างอยู่ เปิด `http://127.0.0.1:18789` โดยตรงแล้วนำทางจากแดชบอร์ด หากหลังรีสตาร์ตบริการไม่ทำงานต่อ ให้เรียกใช้ `openclaw gateway start` และตรวจสอบ `openclaw gateway status` อีกครั้ง

<AccordionGroup>
  <Accordion title="รูปแบบการเชื่อมต่อ/การยืนยันตัวตน">
    - `device identity required` → บริบทไม่ปลอดภัยหรือไม่มีการยืนยันตัวตนของอุปกรณ์
    - `origin not allowed` → `Origin` ของเบราว์เซอร์ไม่อยู่ใน `gateway.controlUi.allowedOrigins` (หรือกำลังเชื่อมต่อจากต้นทางเบราว์เซอร์ที่ไม่ใช่ลูปแบ็กโดยไม่มีรายการอนุญาตที่ระบุไว้อย่างชัดเจน)
    - `device nonce required` / `device nonce mismatch` → ไคลเอ็นต์ดำเนินขั้นตอนการยืนยันตัวตนอุปกรณ์แบบใช้คำท้าไม่สมบูรณ์ (`connect.challenge` + `device.nonce`)
    - `device signature invalid` / `device signature expired` → ไคลเอ็นต์ลงนามเพย์โหลดผิด (หรือใช้การประทับเวลาที่ล้าสมัย) สำหรับการจับมือปัจจุบัน
    - `AUTH_TOKEN_MISMATCH` พร้อม `canRetryWithDeviceToken=true` → ไคลเอ็นต์สามารถลองใหม่แบบเชื่อถือได้หนึ่งครั้งโดยใช้โทเค็นอุปกรณ์ที่แคชไว้
    - การลองใหม่ด้วยโทเค็นที่แคชไว้นั้นจะใช้ชุดขอบเขตที่แคชไว้ซึ่งจัดเก็บร่วมกับโทเค็นอุปกรณ์ที่จับคู่แล้วซ้ำ ส่วนผู้เรียกที่ระบุ `deviceToken` / `scopes` อย่างชัดเจนจะคงชุดขอบเขตที่ร้องขอไว้
    - `AUTH_SCOPE_MISMATCH` → ระบบรู้จักโทเค็นอุปกรณ์ แต่ขอบเขตที่ได้รับอนุมัติไม่ครอบคลุมคำขอเชื่อมต่อนี้ ให้จับคู่ใหม่หรืออนุมัติสัญญาขอบเขตที่ร้องขอ แทนการหมุนเวียนโทเค็น Gateway ที่ใช้ร่วมกัน
    - นอกเส้นทางการลองใหม่นั้น ลำดับความสำคัญของการยืนยันตัวตนขณะเชื่อมต่อคือ โทเค็น/รหัสผ่านที่ใช้ร่วมกันซึ่งระบุไว้อย่างชัดเจนก่อน ตามด้วย `deviceToken` ที่ระบุไว้อย่างชัดเจน จากนั้นเป็นโทเค็นอุปกรณ์ที่จัดเก็บไว้ และสุดท้ายเป็นโทเค็นบูตสแตรป
    - ในเส้นทาง UI ควบคุมแบบ Tailscale Serve ที่ทำงานแบบอะซิงโครนัส ความพยายามที่ล้มเหลวสำหรับ `{scope, ip}` เดียวกันจะถูกจัดลำดับก่อนที่ตัวจำกัดจะบันทึกความล้มเหลว ดังนั้นการลองใหม่ที่ผิดพลาดพร้อมกันสองครั้งจากไคลเอ็นต์เดียวกันอาจแสดง `retry later` ในความพยายามครั้งที่สอง แทนที่จะแสดงข้อผิดพลาดไม่ตรงกันแบบธรรมดาสองครั้ง
    - `too many failed authentication attempts (retry later)` จากไคลเอ็นต์ลูปแบ็กที่มีต้นทางเป็นเบราว์เซอร์ → ความล้มเหลวซ้ำจาก `Origin` ที่ปรับรูปแบบแล้วเดียวกันจะถูกล็อกชั่วคราว ส่วนต้นทาง localhost อื่นจะใช้บัคเก็ตแยกต่างหาก
    - เกิด `unauthorized` ซ้ำหลังจากการลองใหม่นั้น → โทเค็นที่ใช้ร่วมกันกับโทเค็นอุปกรณ์ไม่สอดคล้องกัน ให้อัปเดตการกำหนดค่าโทเค็นและอนุมัติใหม่/หมุนเวียนโทเค็นอุปกรณ์หากจำเป็น
    - `gateway connect failed:` → เป้าหมายโฮสต์/พอร์ต/URL ไม่ถูกต้อง

  </Accordion>
</AccordionGroup>

### แผนผังด่วนของรหัสรายละเอียดการยืนยันตัวตน

ใช้ `error.details.code` จากการตอบกลับ `connect` ที่ล้มเหลวเพื่อเลือกการดำเนินการถัดไป:

| รหัสรายละเอียด                  | ความหมาย                                                                                                                                                                                      | การดำเนินการที่แนะนำ                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | ไคลเอ็นต์ไม่ได้ส่งโทเค็นที่ใช้ร่วมกันซึ่งจำเป็น                                                                                                                                                 | วาง/ตั้งค่าโทเค็นในไคลเอ็นต์แล้วลองใหม่ สำหรับเส้นทางแดชบอร์ด: `openclaw config get gateway.auth.token` จากนั้นวางลงในการตั้งค่า UI ควบคุม                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | โทเค็นที่ใช้ร่วมกันไม่ตรงกับโทเค็นยืนยันตัวตนของ Gateway                                                                                                                                               | หาก `canRetryWithDeviceToken=true` ให้อนุญาตการลองใหม่แบบเชื่อถือได้หนึ่งครั้ง การลองใหม่ด้วยโทเค็นที่แคชไว้จะใช้ขอบเขตที่ได้รับอนุมัติและจัดเก็บไว้ซ้ำ ส่วนผู้เรียกที่ระบุ `deviceToken` / `scopes` อย่างชัดเจนจะคงขอบเขตที่ร้องขอ หากยังล้มเหลว ให้ทำตาม [รายการตรวจสอบการกู้คืนโทเค็นที่ไม่สอดคล้องกัน](/th/cli/devices#token-drift-recovery-checklist) |
| `AUTH_DEVICE_TOKEN_MISMATCH` | โทเค็นประจำอุปกรณ์ที่แคชไว้ล้าสมัยหรือถูกเพิกถอน                                                                                                                                                 | หมุนเวียน/อนุมัติโทเค็นอุปกรณ์ใหม่โดยใช้ [CLI สำหรับอุปกรณ์](/th/cli/devices) แล้วเชื่อมต่อใหม่                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | โทเค็นอุปกรณ์ถูกต้อง แต่บทบาท/ขอบเขตที่ได้รับอนุมัติไม่ครอบคลุมคำขอเชื่อมต่อนี้                                                                                                       | จับคู่อุปกรณ์ใหม่หรืออนุมัติสัญญาขอบเขตที่ร้องขอ อย่าถือว่ากรณีนี้เป็นโทเค็นที่ใช้ร่วมกันไม่สอดคล้องกัน                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | ข้อมูลประจำตัวของอุปกรณ์ต้องได้รับการอนุมัติ ตรวจสอบ `error.details.reason` สำหรับ `not-paired`, `scope-upgrade`, `role-upgrade` หรือ `metadata-upgrade` และใช้ `requestId` / `remediationHint` เมื่อมี | อนุมัติคำขอที่รอดำเนินการ: `openclaw devices list` แล้วตามด้วย `openclaw devices approve <requestId>` การอัปเกรดขอบเขต/บทบาทใช้ขั้นตอนเดียวกันหลังจากตรวจสอบสิทธิ์เข้าถึงที่ร้องขอแล้ว                                                                                                               |

<Note>
RPC แบ็กเอนด์ลูปแบ็กโดยตรงที่ยืนยันตัวตนด้วยโทเค็น/รหัสผ่าน Gateway ที่ใช้ร่วมกันไม่ควรขึ้นอยู่กับค่าพื้นฐานของขอบเขตอุปกรณ์ที่จับคู่ของ CLI หากเอเจนต์ย่อยหรือการเรียกใช้ภายในอื่นยังล้มเหลวด้วย `scope-upgrade` ให้ตรวจสอบว่าผู้เรียกกำลังใช้ `client.id: "gateway-client"` และ `client.mode: "backend"` และไม่ได้บังคับใช้ `deviceIdentity` หรือโทเค็นอุปกรณ์อย่างชัดเจน
</Note>

การตรวจสอบการย้ายข้อมูลการยืนยันตัวตนอุปกรณ์ v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

หากบันทึกแสดงข้อผิดพลาด nonce/ลายเซ็น ให้อัปเดตไคลเอ็นต์ที่เชื่อมต่อและตรวจสอบดังนี้:

<Steps>
  <Step title="รอ connect.challenge">
    ไคลเอ็นต์รอ `connect.challenge` ที่ Gateway ออกให้
  </Step>
  <Step title="ลงนามเพย์โหลด">
    ไคลเอ็นต์ลงนามเพย์โหลดที่ผูกกับคำท้า
  </Step>
  <Step title="ส่ง nonce ของอุปกรณ์">
    ไคลเอ็นต์ส่ง `connect.params.device.nonce` พร้อม nonce ของคำท้าเดียวกัน
  </Step>
</Steps>

หาก `openclaw devices rotate` / `revoke` / `remove` ถูกปฏิเสธโดยไม่คาดคิด:

- เซสชันโทเค็นอุปกรณ์ที่จับคู่สามารถจัดการได้เฉพาะอุปกรณ์ **ของตนเอง** เว้นแต่ผู้เรียกจะมี `operator.admin` ด้วย
- `openclaw devices rotate --scope ...` สามารถร้องขอได้เฉพาะขอบเขตผู้ปฏิบัติงานที่เซสชันของผู้เรียกมีอยู่แล้วเท่านั้น

หัวข้อที่เกี่ยวข้อง:

- [การกำหนดค่า](/th/gateway/configuration) (โหมดการยืนยันตัวตนของ Gateway)
- [UI ควบคุม](/th/web/control-ui)
- [อุปกรณ์](/th/cli/devices)
- [การเข้าถึงจากระยะไกล](/th/gateway/remote)
- [การยืนยันตัวตนผ่านพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth)

## บริการ Gateway ไม่ทำงาน

ใช้เมื่อบริการติดตั้งแล้ว แต่กระบวนการทำงานไม่ต่อเนื่อง

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # ตรวจสอบบริการระดับระบบด้วย
```

ตรวจหา:

- `Runtime: stopped` พร้อมคำใบ้เกี่ยวกับการออกจากกระบวนการ
- การกำหนดค่าบริการไม่ตรงกัน (`Config (cli)` กับ `Config (service)`)
- พอร์ต/ตัวรับฟังขัดแย้งกัน
- มีการติดตั้ง launchd/systemd/schtasks เพิ่มเติมเมื่อใช้ `--deep`
- คำใบ้การล้างข้อมูล `Other gateway-like services detected (best effort)`

<AccordionGroup>
  <Accordion title="รูปแบบที่พบบ่อย">
    - `Gateway start blocked: set gateway.mode=local` หรือ `existing config is missing gateway.mode` → ไม่ได้เปิดใช้งานโหมด Gateway ภายในเครื่อง หรือไฟล์การกำหนดค่าถูกเขียนทับจนสูญเสีย `gateway.mode` วิธีแก้ไข: ตั้งค่า `gateway.mode="local"` ในการกำหนดค่า หรือเรียกใช้ `openclaw onboard --mode local` / `openclaw setup` อีกครั้งเพื่อประทับการกำหนดค่าโหมดภายในเครื่องที่คาดไว้ใหม่ หากเรียกใช้ OpenClaw ผ่าน Podman พาธการกำหนดค่าเริ่มต้นคือ `~/.openclaw/openclaw.json`
    - `refusing to bind gateway ... without auth` → ผูกกับที่อยู่ที่ไม่ใช่ลูปแบ็กโดยไม่มีเส้นทางการยืนยันตัวตน Gateway ที่ถูกต้อง (โทเค็น/รหัสผ่าน หรือพร็อกซีที่เชื่อถือได้เมื่อตั้งค่าไว้)
    - `another gateway instance is already listening` / `EADDRINUSE` → พอร์ตขัดแย้งกัน
    - `Other gateway-like services detected (best effort)` → มีหน่วย launchd/systemd/schtasks ที่ล้าสมัยหรือทำงานคู่ขนานอยู่ การตั้งค่าส่วนใหญ่ควรมี Gateway หนึ่งรายการต่อเครื่อง หากจำเป็นต้องมีมากกว่าหนึ่งรายการ ให้แยกพอร์ต + การกำหนดค่า/สถานะ/พื้นที่ทำงาน ดู [/gateway#multiple-gateways-same-host](/th/gateway#multiple-gateways-same-host)
    - `System-level OpenClaw gateway service detected` จาก doctor → มีหน่วยระบบ systemd อยู่ แต่ไม่มีบริการระดับผู้ใช้ ลบหรือปิดใช้งานรายการที่ซ้ำก่อนอนุญาตให้ doctor ติดตั้งบริการผู้ใช้ หรือตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` หากต้องการใช้หน่วยระบบเป็นตัวควบคุมกระบวนการ
    - `Gateway service port does not match current gateway config` → ตัวควบคุมกระบวนการที่ติดตั้งไว้ยังคงตรึง `--port` เก่า เรียกใช้ `openclaw doctor --fix` หรือ `openclaw gateway install --force` แล้วรีสตาร์ตบริการ Gateway

  </Accordion>
</AccordionGroup>

หัวข้อที่เกี่ยวข้อง:

- [การดำเนินการเบื้องหลังและเครื่องมือกระบวนการ](/th/gateway/background-process)
- [การกำหนดค่า](/th/gateway/configuration)
- [Doctor](/th/gateway/doctor)

## Gateway บน macOS หยุดตอบสนองโดยไม่มีข้อความแจ้ง แล้วกลับมาทำงานต่อเมื่อโต้ตอบกับแดชบอร์ด

ใช้เมื่อช่องทางต่าง ๆ (Telegram, WhatsApp เป็นต้น) บนโฮสต์ macOS เงียบหายไปครั้งละหลายนาทีถึงหลายชั่วโมง และดูเหมือนว่า Gateway จะกลับมาทันทีที่เปิด Control UI, เชื่อมต่อผ่าน SSH หรือโต้ตอบกับโฮสต์ด้วยวิธีอื่น โดยปกติจะไม่พบอาการที่ชัดเจนใน `openclaw status` เพราะเมื่อเข้าไปตรวจสอบ Gateway ก็กลับมาทำงานแล้ว

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

ให้มองหาสิ่งต่อไปนี้:

- บันเดิล `*-uncaught_exception.json` อย่างน้อยหนึ่งรายการใน `~/.openclaw/logs/stability/` ซึ่งตั้งค่า `error.code` เป็นรหัสเครือข่ายชั่วคราว เช่น `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` หรือ `ECONNREFUSED`
- บรรทัด `pmset -g log` เช่น `Entering Sleep state due to 'Maintenance Sleep'` หรือ `en0 driver is slow (msg: WillChangeState to 0)` ที่ตรงกับการประทับเวลาของการขัดข้อง Power Nap / Maintenance Sleep จะทำให้ไดรเวอร์ Wi-Fi เข้าสู่สถานะ 0 ชั่วครู่ การเชื่อมต่อ `connect()` ขาออกใด ๆ ที่เกิดขึ้นในช่วงนั้นอาจล้มเหลวด้วย `ENETDOWN` แม้ว่าโดยปกติโฮสต์จะเชื่อมต่อเครือข่ายได้อย่างสมบูรณ์
- เอาต์พุต `launchctl print` ที่แสดง `state = not running` พร้อม `runs` หลายรายการที่เพิ่งเกิดขึ้นและรหัสออก โดยเฉพาะเมื่อช่วงเวลาระหว่างการขัดข้องกับการเริ่มทำงานครั้งถัดไปอยู่ในระดับหนึ่งชั่วโมงแทนที่จะเป็นไม่กี่วินาที launchd ของ macOS ใช้กลไกป้องกันการเกิดซ้ำซึ่งไม่มีการบันทึกไว้หลังจากเกิดการขัดข้องต่อเนื่อง กลไกนี้อาจหยุดทำตาม `KeepAlive=true` จนกว่าทริกเกอร์ภายนอก เช่น การเข้าสู่ระบบแบบโต้ตอบ การเชื่อมต่อแดชบอร์ด หรือ `launchctl kickstart` จะเปิดใช้งานกลไกดังกล่าวอีกครั้ง

ลักษณะที่พบบ่อย:

- บันเดิลความเสถียรที่มี `error.code` เป็น `ENETDOWN` หรือรหัสอื่นในกลุ่มเดียวกัน โดย call stack ชี้ไปที่ Node `net` `lookupAndConnect` / `Socket.connect` OpenClaw `2026.5.26` และรุ่นใหม่กว่าจะจัดประเภทข้อผิดพลาดเหล่านี้เป็นข้อผิดพลาดเครือข่ายชั่วคราวที่ไม่เป็นอันตราย จึงไม่ส่งต่อไปยังตัวจัดการข้อยกเว้นระดับบนสุดอีกต่อไป หากใช้รุ่นเก่ากว่า ให้อัปเกรดก่อน
- ช่วงเวลาที่เงียบหายเป็นเวลานานและสิ้นสุดลงทันทีที่เชื่อมต่อกับ Control UI หรือ SSH เข้าโฮสต์: กิจกรรมที่ผู้ใช้มองเห็นเป็นสิ่งที่เปิดใช้งานกลไกการเกิดซ้ำของ launchd อีกครั้ง ไม่ใช่การกระทำใด ๆ ของแดชบอร์ดต่อ Gateway
- จำนวน `runs` เพิ่มขึ้นตลอดทั้งวันโดยไม่มีบรรทัด `received SIG*; shutting down` ที่สอดคล้องกันใน `~/Library/Logs/openclaw/gateway.log`: การปิดระบบตามปกติจะบันทึกสัญญาณลงในบันทึก แต่การขัดข้องชั่วคราวจะไม่บันทึก

สิ่งที่ต้องทำ:

1. **อัปเกรด Gateway** หากกำลังใช้รุ่นก่อน `2026.5.26` หลังจากอัปเกรดแล้ว ข้อผิดพลาด `ENETDOWN` ที่เกิดขึ้นในอนาคตจะถูกบันทึกเป็นคำเตือนแทนที่จะยุติโพรเซส
2. **ลดกิจกรรมการพักเครื่องเพื่อบำรุงรักษา** บนโฮสต์ Mac mini / เดสก์ท็อปที่มีไว้ให้ทำงานเป็นเซิร์ฟเวอร์แบบเปิดตลอดเวลา:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   วิธีนี้ช่วยลดความผันผวนของไดรเวอร์ที่เป็นสาเหตุพื้นฐานได้อย่างมาก แต่ไม่สามารถกำจัดได้ทั้งหมด ระบบยังอาจพักเครื่องเพื่อบำรุงรักษาบางส่วนสำหรับ TCP keepalive และการดูแลรักษา mDNS โดยไม่ขึ้นกับแฟล็กเหล่านี้

3. **เพิ่มตัวเฝ้าระวังสถานะการทำงาน** เพื่อให้ตรวจพบได้อย่างรวดเร็วหากการขัดข้องต่อเนื่องในอนาคตถูก launchd พักไว้:

   ```bash
   # ตัวอย่างการตรวจสอบสถานะการทำงานที่รองรับ launchd เหมาะสำหรับ Cron หรือ LaunchAgent ที่ทำงานทุก 5 นาที
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   จุดประสงค์คือเปิดใช้งานกลไกการเกิดซ้ำจากภายนอกอีกครั้ง โดย `KeepAlive=true` เพียงอย่างเดียวไม่เพียงพอบน macOS หลังจากเกิดการขัดข้องต่อเนื่อง

เนื้อหาที่เกี่ยวข้อง:

- [หมายเหตุเกี่ยวกับแพลตฟอร์ม macOS](/th/platforms/macos)
- [การบันทึกล็อก](/th/logging)
- [Doctor](/th/gateway/doctor)

## ลูปตัวควบคุม launchd ของ macOS เมื่อมี LaunchAgent สำหรับ Gateway/Node ซ้ำกัน

ใช้เมื่อการติดตั้งบน macOS เริ่มทำงานใหม่ทุก ๆ ไม่กี่วินาที การตรวจสอบสถานะ `openclaw`
สลับไปมาระหว่างพร้อมใช้งานและไม่พร้อมใช้งาน และการส่งข้อมูลผ่านช่องทางหยุดชะงัก
แม้ว่าดูเหมือนว่าบริการกำลังทำงานอยู่ก็ตาม

ปัญหานี้พบในการติดตั้งรุ่นเก่าซึ่งทั้ง `ai.openclaw.gateway` และ
`ai.openclaw.node` LaunchAgent ทำงานอยู่ และแต่ละรายการแทรก
`OPENCLAW_LAUNCHD_LABEL` ในสถานะดังกล่าว OpenClaw อาจตรวจพบการควบคุมโดย launchd
พยายามส่งมอบการเริ่มทำงานใหม่กลับไปให้ launchd และเข้าสู่ลูป
`EADDRINUSE`/การเกิดซ้ำอย่างรวดเร็ว แทนที่จะมีโพรเซส Gateway ที่เสถียรเพียงหนึ่งโพรเซส

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

ให้มองหาสิ่งต่อไปนี้:

- มี PID ของ Gateway มากกว่าหนึ่งรายการในตัวอย่างช่วงเวลา 30 วินาที แทนที่จะมี
  โพรเซสที่เสถียรเพียงหนึ่งโพรเซส
- `EADDRINUSE`, `another gateway instance is already listening` หรือบรรทัด
  การเริ่มทำงานใหม่/การส่งมอบที่เกิดซ้ำใน `gateway.log`
- ทั้ง `~/Library/LaunchAgents/ai.openclaw.gateway.plist` และ
  `~/Library/LaunchAgents/ai.openclaw.node.plist` ถูกโหลดพร้อมกันบน
  โฮสต์ที่ควรเรียกใช้บริการ Gateway ที่มีการจัดการเพียงบริการเดียว

สิ่งที่ต้องทำ:

1. หากโฮสต์นี้ควรเรียกใช้เฉพาะบริการ Gateway ให้ลบบริการ Node ที่มีการจัดการ
   ผ่าน OpenClaw **ข้ามขั้นตอนนี้** หากยังพึ่งพาบริการ Node
   สำหรับฟีเจอร์ Node ระยะไกลอยู่ การถอนการติดตั้งจะหยุดฟีเจอร์เหล่านั้นบน
   โฮสต์นี้:

   ```bash
   openclaw node uninstall
   ```

2. ติดตั้ง Wrapper ของ Gateway แบบถาวร ซึ่งจะล้างตัวทำเครื่องหมาย launchd
   ที่สืบทอดมาก่อนเริ่ม OpenClaw ใช้ตัวเลือก `--wrapper` ที่รองรับ
   ห้ามแก้ไขไฟล์ที่สร้างขึ้นภายใต้ `~/.openclaw/service-env/` เนื่องจากการติดตั้งบริการใหม่
   การอัปเดต และการซ่อมแซมด้วย Doctor จะสร้างไฟล์นั้นขึ้นใหม่:

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

   `gateway install` จะเก็บเส้นทางของ wrapper ไว้แม้มีการติดตั้งใหม่แบบบังคับ
   การอัปเดต และการซ่อมแซมโดย doctor

3. ตรวจสอบว่า Gateway ทำงานได้อย่างเสถียรและให้บริการ RPC ไม่ใช่เพียงแค่รับฟังการเชื่อมต่อ:

   ```bash
   openclaw gateway status --deep --require-rpc

   for i in 1 2 3 4; do
     ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
     sleep 10
   done
   ```

   ตัวอย่าง PID ควรแสดงกระบวนการที่เสถียรหนึ่งกระบวนการ แทนที่จะเป็นชุด
   PID ที่เปลี่ยนวนไปมา และการส่งต่อช่องทางขาเข้าควรกลับมาทำงาน

4. หลังจากอัปเกรดเป็นรุ่นที่แก้ไขลูป LaunchAgent คู่ซึ่งเป็นสาเหตุแล้ว
   ให้นำวิธีแก้ปัญหาชั่วคราวออกและติดตั้งบริการที่มีการจัดการตามปกติใหม่:

   ```bash
   OPENCLAW_WRAPPER= openclaw gateway install --force
   rm ~/.local/bin/openclaw-launchd-workaround
   ```

เนื้อหาที่เกี่ยวข้อง:

- [หมายเหตุเกี่ยวกับแพลตฟอร์ม macOS](/th/platforms/mac/bundled-gateway)
- [Doctor](/th/gateway/doctor)
- [Gateway CLI](/th/cli/gateway)

## Gateway หยุดทำงานระหว่างการใช้หน่วยความจำสูง

ใช้เมื่อ Gateway หายไปขณะมีภาระงานสูง ตัวควบคุมรายงานการรีสตาร์ตในลักษณะ OOM หรือบันทึกกล่าวถึง `critical memory pressure bundle written`

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

มองหา:

- `Reason: diagnostic.memory.pressure.critical` ในชุดข้อมูลความเสถียรล่าสุด
- `Memory pressure:` ที่มี `critical/rss_threshold`, `critical/heap_threshold` หรือ `critical/rss_growth`
- ค่า `V8 heap:` ที่ใกล้ถึงขีดจำกัดฮีป
- รายการ `Largest session files:` เช่น `agents/<agent>/sessions/<session>.jsonl` หรือ `sessions/<session>.jsonl`
- ตัวนับหน่วยความจำ cgroup ของ Linux เมื่อ Gateway ทำงานภายในคอนเทนเนอร์หรือบริการที่จำกัดหน่วยความจำ

ลักษณะที่พบบ่อย:

- `critical memory pressure bundle written` ปรากฏไม่นานก่อนรีสตาร์ต → OpenClaw บันทึกชุดข้อมูลความเสถียรก่อนเกิด OOM ตรวจสอบด้วย `openclaw gateway stability --bundle latest`
- `memory pressure: level=critical` ปรากฏในบันทึกของ Gateway → OpenClaw ตรวจพบภาวะหน่วยความจำตึงตัวขั้นวิกฤตและบันทึกข้อมูลหน่วยความจำภายในกระบวนการที่มีอยู่
- `Largest session files:` ชี้ไปยังพาธทรานสคริปต์ที่ปกปิดข้อมูลและมีขนาดใหญ่มาก → ลดประวัติเซสชันที่เก็บไว้ ตรวจสอบการเติบโตของเซสชัน หรือย้ายทรานสคริปต์เก่าออกจากที่เก็บที่ใช้งานอยู่ก่อนรีสตาร์ต
- จำนวนไบต์ที่ใช้ของ `V8 heap:` ใกล้ถึงขีดจำกัดฮีป → ลดภาระจากพรอมต์/เซสชันหรือลดงานที่ทำพร้อมกันก่อน สำหรับบริการที่มีการจัดการ ให้ตรวจสอบ `Gateway heap:` ใน `openclaw gateway status`; หากระบุว่า `not set` ให้สร้างเมทาดาทาของบริการเก่าใหม่ด้วย `openclaw gateway install --force` ระบบจงใจไม่สนใจ `NODE_OPTIONS` ของเชลล์แวดล้อม ใช้การกำหนดค่าฮีปทับที่ระดับตัวควบคุมดูแลอย่างชัดเจนเฉพาะหลังจากยืนยันภาระงานต่อเนื่องและเหลือพื้นที่สำรองสำหรับหน่วยความจำเนทีฟเพียงพอแล้ว
- `Memory pressure: critical/rss_growth` → หน่วยความจำเพิ่มขึ้นอย่างรวดเร็วภายในช่วงการสุ่มตัวอย่างหนึ่งช่วง ตรวจสอบบันทึกล่าสุดเพื่อหาการนำเข้าขนาดใหญ่ เอาต์พุตเครื่องมือที่เพิ่มขึ้นไม่หยุด การลองซ้ำหลายครั้ง หรือกลุ่มงานเอเจนต์ที่อยู่ในคิว
- ภาวะหน่วยความจำตึงตัวขั้นวิกฤตปรากฏในบันทึกแต่ไม่มีชุดข้อมูล → บันทึก `openclaw gateway diagnostics export` หลังเกิดเหตุการณ์เพื่อเก็บหลักฐานการปฏิบัติงานที่มีอยู่

ชุดข้อมูลความเสถียรไม่มีเพย์โหลด โดยมีหลักฐานหน่วยความจำเชิงปฏิบัติการและพาธไฟล์แบบสัมพัทธ์ที่ปกปิดข้อมูล แต่ไม่มีข้อความ เนื้อหา Webhook ข้อมูลประจำตัว โทเค็น คุกกี้ หรือรหัสเซสชันดิบ ให้แนบไฟล์ส่งออกการวินิจฉัยกับรายงานข้อบกพร่องแทนการคัดลอกบันทึกดิบ

เนื้อหาที่เกี่ยวข้อง:

- [สถานะการทำงานของ Gateway](/th/gateway/health)
- [ไฟล์ส่งออกการวินิจฉัย](/th/gateway/diagnostics)
- [เซสชัน](/th/cli/sessions)

## Gateway ปฏิเสธการกำหนดค่าที่ไม่ถูกต้อง

ใช้เมื่อการเริ่มต้น Gateway ล้มเหลวโดยแสดง `Invalid config` หรือบันทึกการโหลดใหม่แบบทันทีระบุว่าข้ามการแก้ไขที่ไม่ถูกต้อง

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

มองหา:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- ไฟล์ `openclaw.json.rejected.*` ที่มีการประทับเวลาอยู่ข้างการกำหนดค่าที่ใช้งานอยู่
- ไฟล์ `openclaw.json.clobbered.*` ที่มีการประทับเวลา หาก `doctor --fix` ซ่อมแซมการแก้ไขโดยตรงที่เสียหาย
- OpenClaw เก็บไฟล์ `.clobbered.*` ล่าสุด 32 ไฟล์สำหรับแต่ละพาธการกำหนดค่าและหมุนเวียนไฟล์ที่เก่ากว่าออก

<AccordionGroup>
  <Accordion title="สิ่งที่เกิดขึ้น">
    - การกำหนดค่าไม่ผ่านการตรวจสอบระหว่างการเริ่มต้น การโหลดใหม่แบบทันที หรือการเขียนที่ OpenClaw เป็นผู้ดำเนินการ
    - การเริ่มต้น Gateway ล้มเหลวแบบปิดกั้นแทนที่จะเขียน `openclaw.json` ใหม่
    - การโหลดใหม่แบบทันทีจะข้ามการแก้ไขภายนอกที่ไม่ถูกต้องและคงการกำหนดค่ารันไทม์ปัจจุบันให้ทำงานต่อไป
    - การเขียนที่ OpenClaw เป็นผู้ดำเนินการจะปฏิเสธเพย์โหลดที่ไม่ถูกต้องหรือก่อให้เกิดความเสียหายก่อนคอมมิต และบันทึก `.rejected.*`
    - `openclaw doctor --fix` ทำหน้าที่ซ่อมแซม โดยสามารถลบคำนำหน้าที่ไม่ใช่ JSON หรือกู้คืนสำเนาล่าสุดที่ทราบว่าถูกต้อง พร้อมเก็บรักษาเพย์โหลดที่ถูกปฏิเสธเป็น `.clobbered.*`
    - เมื่อมีการซ่อมแซมจำนวนมากสำหรับพาธการกำหนดค่าหนึ่งพาธ OpenClaw จะหมุนเวียนไฟล์ `.clobbered.*` ที่เก่ากว่าออก เพื่อให้เพย์โหลดที่ซ่อมแซมล่าสุดยังคงพร้อมใช้งาน

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
    - `.clobbered.*` มีอยู่ → doctor เก็บการแก้ไขจากภายนอกที่เสียหายไว้ขณะซ่อมแซมการกำหนดค่าที่ใช้งานอยู่
    - `.rejected.*` มีอยู่ → การเขียนการกำหนดค่าที่ OpenClaw เป็นเจ้าของไม่ผ่านการตรวจสอบสคีมาหรือการเขียนทับก่อน commit
    - `Config write rejected:` → การเขียนพยายามตัดโครงสร้างที่จำเป็นออก ลดขนาดไฟล์ลงอย่างมาก หรือบันทึกการกำหนดค่าที่ไม่ถูกต้อง
    - `config reload skipped (invalid config):` → การแก้ไขโดยตรงไม่ผ่านการตรวจสอบความถูกต้องและ Gateway ที่กำลังทำงานอยู่เพิกเฉยต่อการแก้ไขนั้น
    - `Invalid config at ...` → การเริ่มทำงานล้มเหลวก่อนบริการของ Gateway จะเริ่มขึ้น
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` หรือ `size-drop-vs-last-good:*` → การเขียนที่ OpenClaw เป็นเจ้าของถูกปฏิเสธ เนื่องจากมีฟิลด์หรือขนาดลดลงเมื่อเทียบกับข้อมูลสำรองล่าสุดที่ทราบว่าใช้ได้
    - `Config last-known-good promotion skipped` → ข้อมูลที่เสนอมีตัวยึดตำแหน่งข้อมูลลับที่ปกปิดแล้ว เช่น `***`

  </Accordion>
  <Accordion title="ตัวเลือกการแก้ไข">
    1. เรียกใช้ `openclaw doctor --fix` เพื่อให้ doctor ซ่อมแซมการกำหนดค่าที่มีคำนำหน้าหรือถูกเขียนทับ หรือกู้คืนข้อมูลล่าสุดที่ทราบว่าใช้ได้
    2. คัดลอกเฉพาะคีย์ที่ต้องการจาก `.clobbered.*` หรือ `.rejected.*` แล้วนำไปใช้ด้วย `openclaw config set` หรือ `config.patch`
    3. เรียกใช้ `openclaw config validate` ก่อนเริ่มการทำงานใหม่
    4. หากแก้ไขด้วยตนเอง ให้คงการกำหนดค่า JSON5 ไว้ทั้งหมด ไม่ใช่เฉพาะออบเจ็กต์บางส่วนที่ต้องการเปลี่ยน
  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [การกำหนดค่า](/th/cli/config)
- [การกำหนดค่า: การโหลดซ้ำแบบทันที](/th/gateway/configuration#config-hot-reload)
- [การกำหนดค่า: การตรวจสอบความถูกต้องอย่างเข้มงวด](/th/gateway/configuration#strict-validation)
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
- คำเตือนเกี่ยวกับการใช้ SSH สำรอง, Gateway หลายตัว, ขอบเขตสิทธิ์ที่ขาดหายไป หรือการอ้างอิงการยืนยันตัวตนที่ยังแก้ไขไม่ได้หรือไม่

ลักษณะที่พบบ่อย:

- `SSH tunnel failed to start; falling back to direct probes.` → การตั้งค่า SSH ล้มเหลว แต่คำสั่งยังคงลองใช้เป้าหมายที่กำหนดค่าโดยตรงหรือเป้าหมายแบบ loopback
- `multiple reachable gateway identities detected` → Gateway ที่แตกต่างกันตอบกลับ หรือ OpenClaw ไม่สามารถยืนยันได้ว่าเป้าหมายที่เข้าถึงได้นั้นเป็น Gateway เดียวกัน อุโมงค์ SSH, URL พร็อกซี หรือ URL ระยะไกลที่กำหนดค่าไว้ซึ่งชี้ไปยัง Gateway เดียวกัน จะถือว่าเป็น Gateway หนึ่งตัวที่มีการรับส่งข้อมูลหลายแบบ แม้ว่าพอร์ตการรับส่งข้อมูลจะแตกต่างกัน
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → เชื่อมต่อสำเร็จ แต่ RPC รายละเอียดถูกจำกัดด้วยขอบเขตสิทธิ์ ให้จับคู่อัตลักษณ์อุปกรณ์หรือใช้ข้อมูลประจำตัวที่มี `operator.read`
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → เชื่อมต่อสำเร็จ แต่ชุด RPC วินิจฉัยแบบเต็มหมดเวลาหรือล้มเหลว ให้ถือว่านี่คือ Gateway ที่เข้าถึงได้แต่ความสามารถในการวินิจฉัยลดลง โดยเปรียบเทียบ `connect.ok` และ `connect.rpcOk` ในเอาต์พุต `--json`
- `Capability: pairing-pending` หรือ `gateway closed (1008): pairing required` → Gateway ตอบกลับแล้ว แต่ไคลเอนต์นี้ยังต้องจับคู่หรือได้รับอนุมัติก่อนจึงจะเข้าถึงในฐานะผู้ดำเนินการได้ตามปกติ
- ข้อความเตือน SecretRef ของ `gateway.auth.*` / `gateway.remote.*` ที่ยังแก้ไขไม่ได้ → ข้อมูลการยืนยันตัวตนไม่พร้อมใช้งานในเส้นทางคำสั่งนี้สำหรับเป้าหมายที่ล้มเหลว

ที่เกี่ยวข้อง:

- [Gateway](/th/cli/gateway)
- [Gateway หลายตัวบนโฮสต์เดียวกัน](/th/gateway#multiple-gateways-same-host)
- [การเข้าถึงระยะไกล](/th/gateway/remote)

## ช่องทางเชื่อมต่อแล้ว แต่ข้อความไม่ไหลผ่าน

หากสถานะช่องทางเชื่อมต่อแล้วแต่ข้อความไม่ไหลผ่าน ให้มุ่งตรวจสอบนโยบาย สิทธิ์ และกฎการส่งเฉพาะของช่องทาง

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

ตรวจหา:

- นโยบาย DM (`pairing`, `allowlist`, `open`, `disabled`)
- รายการอนุญาตของกลุ่มและข้อกำหนดในการกล่าวถึง
- สิทธิ์หรือขอบเขตสิทธิ์ของ API ช่องทางที่ขาดหายไป

ลักษณะที่พบบ่อย:

- `mention required` → ข้อความถูกเพิกเฉยตามนโยบายการกล่าวถึงในกลุ่ม
- `pairing` / ร่องรอยการรออนุมัติ → ผู้ส่งยังไม่ได้รับอนุมัติ
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → ปัญหาเกี่ยวกับการยืนยันตัวตนหรือสิทธิ์ของช่องทาง

ที่เกี่ยวข้อง:

- [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)
- [Discord](/th/channels/discord)
- [Telegram](/th/channels/telegram)
- [WhatsApp](/th/channels/whatsapp)

## การส่ง Cron และ Heartbeat

หาก Cron หรือ Heartbeat ไม่ทำงานหรือไม่ส่งข้อมูล ให้ตรวจสอบสถานะตัวกำหนดเวลาก่อน แล้วจึงตรวจสอบเป้าหมายการส่ง

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

ตรวจหา:

- Cron เปิดใช้งานอยู่และมีเวลาปลุกครั้งถัดไป
- สถานะประวัติการเรียกใช้งานงาน (`ok`, `skipped`, `error`)
- สาเหตุที่ข้าม Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`)

<AccordionGroup>
  <Accordion title="ลักษณะที่พบบ่อย">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron ถูกปิดใช้งาน
    - `cron: timer tick failed` → รอบการทำงานของตัวกำหนดเวลาล้มเหลว ให้ตรวจสอบข้อผิดพลาดของไฟล์ บันทึก หรือรันไทม์
    - `heartbeat skipped` พร้อม `reason=quiet-hours` → อยู่นอกช่วงเวลาทำงาน
    - `heartbeat skipped` พร้อม `reason=empty-heartbeat-file` → มี `HEARTBEAT.md` อยู่ แต่มีเพียงโครงร่างว่าง ความคิดเห็น ส่วนหัว รั้วโค้ด หรือรายการตรวจสอบว่าง ดังนั้น OpenClaw จึงข้ามการเรียกโมเดล
    - `heartbeat skipped` พร้อม `reason=no-tasks-due` → `HEARTBEAT.md` มีบล็อก `tasks:` แต่ไม่มีงานใดถึงกำหนดในรอบนี้
    - `heartbeat: unknown accountId` → รหัสบัญชีไม่ถูกต้องสำหรับเป้าหมายการส่ง Heartbeat
    - `heartbeat skipped` พร้อม `reason=dm-blocked` → เป้าหมาย Heartbeat ถูกแปลงเป็นปลายทางแบบ DM ขณะที่ตั้งค่า `agents.defaults.heartbeat.directPolicy` (หรือค่าที่แทนที่สำหรับแต่ละเอเจนต์) เป็น `block`

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

- Node ออนไลน์และมีความสามารถตามที่คาดไว้
- การอนุญาตสิทธิ์จากระบบปฏิบัติการสำหรับกล้อง ไมโครโฟน ตำแหน่ง และหน้าจอ
- สถานะการอนุมัติการดำเนินการและรายการอนุญาต

ลักษณะที่พบบ่อย:

- `NODE_BACKGROUND_UNAVAILABLE` → แอป Node ต้องอยู่เบื้องหน้า
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → ขาดสิทธิ์จากระบบปฏิบัติการ
- `SYSTEM_RUN_DENIED: approval required` → การอนุมัติการดำเนินการอยู่ระหว่างรอดำเนินการ
- `SYSTEM_RUN_DENIED: allowlist miss` → คำสั่งถูกบล็อกโดยรายการอนุญาต

ที่เกี่ยวข้อง:

- [การอนุมัติการดำเนินการ](/th/tools/exec-approvals)
- [การแก้ไขปัญหา Node](/th/nodes/troubleshooting)
- [Node](/th/nodes/index)

## เครื่องมือเบราว์เซอร์ล้มเหลว

ใช้เมื่อการทำงานของเครื่องมือเบราว์เซอร์ล้มเหลว แม้ว่า Gateway จะทำงานเป็นปกติ

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

ตรวจหา:

- มีการตั้งค่า `plugins.allow` และมี `browser` อยู่หรือไม่
- พาธของไฟล์ปฏิบัติการเบราว์เซอร์ที่ถูกต้อง
- ความสามารถในการเข้าถึงโปรไฟล์ CDP
- ความพร้อมใช้งานของ Chrome ภายในเครื่องสำหรับโปรไฟล์ `existing-session` / `user`

<AccordionGroup>
  <Accordion title="ลักษณะของ Plugin / ไฟล์ปฏิบัติการ">
    - `unknown command "browser"` หรือ `unknown command 'browser'` → Plugin เบราว์เซอร์แบบรวมถูกยกเว้นโดย `plugins.allow`
    - เครื่องมือเบราว์เซอร์ขาดหายไปหรือไม่พร้อมใช้งานขณะที่ `browser.enabled=true` → `plugins.allow` ยกเว้น `browser` ทำให้ Plugin ไม่เคยโหลด
    - `Failed to start Chrome CDP on port` → กระบวนการเบราว์เซอร์เริ่มทำงานไม่สำเร็จ
    - `browser.executablePath not found` → พาธที่กำหนดค่าไว้ไม่ถูกต้อง
    - `browser.cdpUrl must be http(s) or ws(s)` → URL ของ CDP ที่กำหนดค่าไว้ใช้สคีมาที่ไม่รองรับ เช่น `file:` หรือ `ftp:`
    - `browser.cdpUrl has invalid port` → URL ของ CDP ที่กำหนดค่าไว้มีพอร์ตไม่ถูกต้องหรืออยู่นอกช่วง
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → การติดตั้ง Gateway ปัจจุบันไม่มีการขึ้นต่อกันของรันไทม์เบราว์เซอร์หลัก ให้ติดตั้งใหม่หรืออัปเดต OpenClaw แล้วเริ่ม Gateway ใหม่ สแนปช็อต ARIA และภาพหน้าจอพื้นฐานของหน้ายังคงทำงานได้ แต่การนำทาง สแนปช็อต AI ภาพหน้าจอองค์ประกอบด้วยตัวเลือก CSS และการส่งออก PDF จะยังไม่พร้อมใช้งาน

  </Accordion>
  <Accordion title="ลักษณะของ Chrome MCP / เซสชันที่มีอยู่">
    - `Could not find DevToolsActivePort for chrome` → เซสชันที่มีอยู่ของ Chrome MCP ยังไม่สามารถเชื่อมต่อกับไดเรกทอรีข้อมูลเบราว์เซอร์ที่เลือกได้ เปิดหน้าตรวจสอบของเบราว์เซอร์ เปิดใช้การดีบักระยะไกล เปิดเบราว์เซอร์ค้างไว้ อนุมัติข้อความแจ้งการเชื่อมต่อครั้งแรก แล้วลองอีกครั้ง หากไม่จำเป็นต้องใช้สถานะที่ลงชื่อเข้าใช้ ให้เลือกใช้โปรไฟล์ `openclaw` ที่มีการจัดการ
    - `No browser tabs found for profile="user"` → โปรไฟล์การเชื่อมต่อ Chrome MCP ไม่มีแท็บ Chrome ภายในเครื่องที่เปิดอยู่
    - `Remote CDP for profile "<name>" is not reachable` → ไม่สามารถเข้าถึงปลายทาง CDP ระยะไกลที่กำหนดค่าไว้จากโฮสต์ Gateway
    - `Browser attachOnly is enabled ... not reachable` หรือ `Browser attachOnly is enabled and CDP websocket ... is not reachable` → โปรไฟล์แบบเชื่อมต่อเท่านั้นไม่มีเป้าหมายที่เข้าถึงได้ หรือปลายทาง HTTP ตอบกลับแล้วแต่ยังไม่สามารถเปิด WebSocket ของ CDP ได้

  </Accordion>
  <Accordion title="ลักษณะขององค์ประกอบ / ภาพหน้าจอ / การอัปโหลด">
    - `fullPage is not supported for element screenshots` → คำขอภาพหน้าจอใช้ `--full-page` ร่วมกับ `--ref` หรือ `--element`
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → การเรียกภาพหน้าจอของ Chrome MCP / `existing-session` ต้องใช้การจับภาพหน้าเว็บหรือ `--ref` ของสแนปช็อต ไม่ใช่ `--element` แบบ CSS
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → ฮุกการอัปโหลดของ Chrome MCP ต้องใช้การอ้างอิงสแนปช็อต ไม่ใช่ตัวเลือก CSS
    - `existing-session file uploads currently support one file at a time.` → ส่งการอัปโหลดหนึ่งรายการต่อการเรียกหนึ่งครั้งในโปรไฟล์ Chrome MCP
    - `existing-session dialog handling does not support timeoutMs.` → ฮุกกล่องโต้ตอบในโปรไฟล์ Chrome MCP ไม่รองรับการแทนที่ค่าหมดเวลา
    - `existing-session type does not support timeoutMs overrides.` → ละเว้น `timeoutMs` สำหรับ `act:type` ในโปรไฟล์เซสชันที่มีอยู่ของ `profile="user"` / Chrome MCP หรือใช้โปรไฟล์เบราว์เซอร์แบบมีการจัดการ/CDP เมื่อต้องการค่าหมดเวลาแบบกำหนดเอง
    - `response body is not supported for existing-session profiles yet.` → `responsebody` ยังคงต้องใช้เบราว์เซอร์แบบมีการจัดการหรือโปรไฟล์ CDP แบบดิบ
    - การแทนที่วิวพอร์ต / โหมดมืด / ภาษาและภูมิภาค / ออฟไลน์ที่ค้างอยู่ในโปรไฟล์แบบเชื่อมต่อเท่านั้นหรือ CDP ระยะไกล → เรียกใช้ `openclaw browser stop --browser-profile <name>` เพื่อปิดเซสชันควบคุมที่ใช้งานอยู่และปล่อยสถานะการจำลอง Playwright/CDP โดยไม่ต้องเริ่ม Gateway ใหม่ทั้งหมด

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [เบราว์เซอร์ (จัดการโดย OpenClaw)](/th/tools/browser)
- [การแก้ไขปัญหาเบราว์เซอร์](/th/tools/browser-linux-troubleshooting)

## หากอัปเกรดแล้วมีบางอย่างเสียหายกะทันหัน

ความเสียหายหลังการอัปเกรดส่วนใหญ่เกิดจากการกำหนดค่าคลาดเคลื่อนหรือการเริ่มบังคับใช้ค่าเริ่มต้นที่เข้มงวดยิ่งขึ้นในขณะนี้

<AccordionGroup>
  <Accordion title="1. ลักษณะการทำงานของการยืนยันตัวตนและการแทนที่ URL เปลี่ยนแปลงแล้ว">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    สิ่งที่ต้องตรวจสอบ:

    - หาก `gateway.mode=remote` การเรียกใช้ CLI อาจกำหนดเป้าหมายไปยังระบบระยะไกล ขณะที่บริการภายในเครื่องยังทำงานปกติ
    - การเรียกใช้ `--url` อย่างชัดเจนจะไม่ย้อนกลับไปใช้ข้อมูลประจำตัวที่จัดเก็บไว้

    อาการที่พบบ่อย:

    - `gateway connect failed:` → กำหนด URL เป้าหมายไม่ถูกต้อง
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

    - การผูกกับที่อยู่ที่ไม่ใช่ลูปแบ็ก (`lan`, `tailnet`, `custom`) ต้องมีเส้นทางการยืนยันตัวตนของ Gateway ที่ถูกต้อง ได้แก่ การยืนยันตัวตนด้วยโทเค็น/รหัสผ่านที่ใช้ร่วมกัน หรือการปรับใช้ `trusted-proxy` ที่ไม่ใช่ลูปแบ็กซึ่งกำหนดค่าไว้อย่างถูกต้อง
    - คีย์เดิม เช่น `gateway.token` ไม่สามารถใช้แทน `gateway.auth.token` ได้

    อาการที่พบบ่อย:

    - `refusing to bind gateway ... without auth` → ผูกกับที่อยู่ที่ไม่ใช่ลูปแบ็กโดยไม่มีเส้นทางการยืนยันตัวตนของ Gateway ที่ถูกต้อง
    - `Connectivity probe: failed` ขณะที่รันไทม์กำลังทำงาน → Gateway ทำงานอยู่ แต่ไม่สามารถเข้าถึงได้ด้วยการยืนยันตัวตน/URL ปัจจุบัน

  </Accordion>
  <Accordion title="3. สถานะการจับคู่และข้อมูลประจำตัวของอุปกรณ์เปลี่ยนแปลงแล้ว">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    สิ่งที่ต้องตรวจสอบ:

    - การอนุมัติอุปกรณ์สำหรับแดชบอร์ด/โหนดที่รอดำเนินการ
    - การอนุมัติการจับคู่ DM ที่รอดำเนินการหลังจากมีการเปลี่ยนแปลงนโยบายหรือข้อมูลประจำตัว

    อาการที่พบบ่อย:

    - `device identity required` → ไม่ผ่านข้อกำหนดการยืนยันตัวตนของอุปกรณ์
    - `pairing required` → ต้องอนุมัติผู้ส่ง/อุปกรณ์

  </Accordion>
</AccordionGroup>

หากการกำหนดค่าบริการและรันไทม์ยังไม่ตรงกันหลังจากตรวจสอบแล้ว ให้ติดตั้งเมทาดาทาของบริการอีกครั้งจากไดเรกทอรีโปรไฟล์/สถานะเดียวกัน:

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
- [คู่มือปฏิบัติงาน Gateway](/th/gateway)
