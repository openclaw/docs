---
read_when:
    - ฮับการแก้ไขปัญหานำคุณมาที่นี่เพื่อการวินิจฉัยเชิงลึก
    - คุณต้องมีส่วนคู่มือปฏิบัติการตามอาการที่เสถียรพร้อมคำสั่งที่แน่นอน
sidebarTitle: Troubleshooting
summary: คู่มือปฏิบัติการแก้ไขปัญหาเชิงลึกสำหรับ Gateway, ช่องทาง, ระบบอัตโนมัติ, โหนด และเบราว์เซอร์
title: การแก้ไขปัญหา
x-i18n:
    generated_at: "2026-06-27T17:40:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ce8e8aed5c3e00be5b093875222962c22883472802e164534dae32adc5365c5
    source_path: gateway/troubleshooting.md
    workflow: 16
---

หน้านี้คือ runbook เชิงลึก เริ่มที่ [/help/troubleshooting](/th/help/troubleshooting) หากคุณต้องการใช้โฟลว์คัดแยกปัญหาแบบเร็วก่อน

## ลำดับคำสั่ง

รันคำสั่งเหล่านี้ก่อน ตามลำดับนี้:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

สัญญาณที่คาดหวังเมื่อระบบปกติ:

- `openclaw gateway status` แสดง `Runtime: running`, `Connectivity probe: ok` และบรรทัด `Capability: ...`
- `openclaw doctor` รายงานว่าไม่มีปัญหาการกำหนดค่าหรือบริการที่บล็อกการทำงาน
- `openclaw channels status --probe` แสดงสถานะทรานสปอร์ตแบบสดแยกตามบัญชี และผล probe/audit เช่น `works` หรือ `audit ok` ในที่ที่รองรับ

## หลังการอัปเดต

ใช้ส่วนนี้เมื่อการอัปเดตเสร็จแล้วแต่ Gateway หยุดทำงาน ช่องว่างเปล่า หรือ
การเรียกโมเดลเริ่มล้มเหลวด้วย 401

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

มองหา:

- `Update restart` ใน `openclaw status` / `openclaw status --all` การส่งต่อที่ค้างอยู่หรือ
  ล้มเหลวจะมีคำสั่งถัดไปที่ต้องรัน
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`
  ใต้ Channels หมายความว่าการกำหนดค่าช่องยังมีอยู่ แต่การลงทะเบียน Plugin
  ล้มเหลวก่อนที่ช่องจะโหลดได้
- 401 จากผู้ให้บริการหลังยืนยันตัวตนใหม่ `openclaw doctor --fix` ตรวจหา
  เงาการยืนยันตัวตน OAuth ต่อ agent ที่ล้าสมัย และลบสำเนาเก่าออกเพื่อให้ agent ทั้งหมด resolve
  โปรไฟล์ที่แชร์ปัจจุบัน

## การติดตั้งแบบ split brain และตัวป้องกันการกำหนดค่าที่ใหม่กว่า

ใช้ส่วนนี้เมื่อบริการ gateway หยุดทำงานโดยไม่คาดคิดหลังการอัปเดต หรือบันทึกแสดงว่าไบนารี `openclaw` หนึ่งตัวเก่ากว่าเวอร์ชันที่เขียน `openclaw.json` ล่าสุด

OpenClaw ประทับตราการเขียนการกำหนดค่าด้วย `meta.lastTouchedVersion` คำสั่งแบบอ่านอย่างเดียวยังคงตรวจสอบการกำหนดค่าที่เขียนโดย OpenClaw ที่ใหม่กว่าได้ แต่การเปลี่ยนแปลงกระบวนการและบริการจะปฏิเสธการดำเนินการต่อจากไบนารีที่เก่ากว่า การทำงานที่ถูกบล็อกรวมถึงการเริ่ม หยุด รีสตาร์ท ถอนการติดตั้งบริการ gateway, การติดตั้งบริการใหม่แบบบังคับ, การเริ่ม Gateway ในโหมดบริการ และการล้างพอร์ต `gateway --force`

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    แก้ `PATH` เพื่อให้ `openclaw` resolve ไปยังการติดตั้งที่ใหม่กว่า แล้วรันการทำงานนั้นอีกครั้ง
  </Step>
  <Step title="Reinstall the gateway service">
    ติดตั้งบริการ gateway ที่ต้องการใหม่จากการติดตั้งที่ใหม่กว่า:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    ลบแพ็กเกจระบบที่ล้าสมัยหรือรายการ wrapper เก่าที่ยังชี้ไปยังไบนารี `openclaw` เก่า
  </Step>
</Steps>

<Warning>
สำหรับการดาวน์เกรดโดยตั้งใจหรือการกู้คืนฉุกเฉินเท่านั้น ให้ตั้ง `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` สำหรับคำสั่งเดียว ปล่อยให้ไม่ตั้งค่านี้สำหรับการทำงานปกติ
</Warning>

## โปรโตคอลไม่ตรงกันหลัง rollback

ใช้ส่วนนี้เมื่อบันทึกพิมพ์ `protocol mismatch` ต่อเนื่องหลังคุณดาวน์เกรดหรือ rollback OpenClaw ซึ่งหมายความว่า Gateway ที่เก่ากว่ากำลังทำงานอยู่ แต่กระบวนการไคลเอนต์ภายในเครื่องที่ใหม่กว่ายังคงพยายามเชื่อมต่อใหม่ด้วยช่วงโปรโตคอลที่ Gateway ที่เก่ากว่าไม่สามารถพูดได้

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

มองหา:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` ในบันทึก Gateway
- `Established clients:` ใน `openclaw gateway status --deep` หรือ `Gateway clients` ใน `openclaw doctor --deep` รายการนี้แสดงไคลเอนต์ TCP ที่ใช้งานอยู่ซึ่งเชื่อมต่อกับพอร์ต Gateway รวมถึง PID และ command line เมื่อ OS อนุญาต
- กระบวนการไคลเอนต์ที่ command line ชี้ไปยังการติดตั้งหรือ wrapper ของ OpenClaw ที่ใหม่กว่าซึ่งคุณ rollback กลับมา

วิธีแก้:

1. หยุดหรือรีสตาร์ทกระบวนการไคลเอนต์ OpenClaw ที่ล้าสมัยซึ่งแสดงโดย `gateway status --deep`
2. รีสตาร์ทแอปหรือ wrapper ที่ฝัง OpenClaw เช่น dashboard ภายในเครื่อง, editor, ตัวช่วย app-server หรือเชลล์ `openclaw logs --follow` ที่รันค้างนาน
3. รัน `openclaw gateway status --deep` หรือ `openclaw doctor --deep` อีกครั้ง และยืนยันว่า PID ไคลเอนต์ที่ล้าสมัยหายไปแล้ว

อย่าทำให้ Gateway ที่เก่ากว่ายอมรับโปรโตคอลที่ใหม่กว่าแต่เข้ากันไม่ได้ การ bump โปรโตคอลปกป้องสัญญาบนสายสื่อสาร การกู้คืนจาก rollback เป็นปัญหาการล้างกระบวนการ/เวอร์ชัน

## ข้าม skill symlink เพราะ path escape

ใช้ส่วนนี้เมื่อบันทึกมี:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw ถือว่าทุก skill root เป็นขอบเขตการกักกัน symlink ใต้
`~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` หรือ
`~/.openclaw/skills` จะถูกข้ามเมื่อเป้าหมายจริง resolve ออกนอก root นั้น
เว้นแต่เป้าหมายจะถูกเชื่อถืออย่างชัดเจน

ตรวจสอบลิงก์:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

หากเป้าหมายเป็นสิ่งที่ตั้งใจไว้ ให้กำหนดค่าทั้ง skill root โดยตรงและ
เป้าหมาย symlink ที่อนุญาต:

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

จากนั้นเริ่มเซสชันใหม่หรือรอให้ตัวเฝ้าดู skills รีเฟรช รีสตาร์ท
gateway หากกระบวนการที่กำลังรันอยู่เกิดก่อนการเปลี่ยนการกำหนดค่า

อย่าใช้เป้าหมายกว้าง ๆ เช่น `~`, `/` หรือโฟลเดอร์โปรเจกต์ที่ซิงค์ทั้งโฟลเดอร์
จำกัด `allowSymlinkTargets` ให้ครอบคลุมเฉพาะ skill root จริงที่มีไดเรกทอรี
`SKILL.md` ที่เชื่อถือได้

หาก Skill Workshop apply ควรเขียนผ่าน path skill ใน workspace ที่เป็น symlink
และเชื่อถือได้เหล่านั้นด้วย ให้เปิดใช้ `skills.workshop.allowSymlinkTargetWrites` ปล่อยให้
ปิดไว้สำหรับ skill root ที่แชร์แบบอ่านอย่างเดียว

ที่เกี่ยวข้อง:

- [การกำหนดค่า Skills](/th/tools/skills-config#symlinked-skill-roots)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 ต้องใช้ extra usage สำหรับบริบทยาว

ใช้ส่วนนี้เมื่อบันทึก/ข้อผิดพลาดมี: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

มองหา:

- โมเดล Anthropic ที่เลือกเป็นโมเดล 1M Claude 4.x ที่รองรับ GA หรือโมเดลมี `params.context1m: true` แบบเดิม
- credential Anthropic ปัจจุบันไม่มีสิทธิ์ใช้งานบริบทยาว
- คำขอล้มเหลวเฉพาะในเซสชันยาว/การรันโมเดลที่ต้องใช้เส้นทางบริบท 1M

ตัวเลือกการแก้ไข:

<Steps>
  <Step title="Use a standard context window">
    เปลี่ยนไปใช้โมเดลหน้าต่างบริบทมาตรฐาน หรือลบ `context1m` แบบเดิมออกจาก
    การกำหนดค่าโมเดลเก่าที่ไม่รองรับ GA สำหรับบริบท 1M
  </Step>
  <Step title="Use an eligible credential">
    ใช้ credential Anthropic ที่มีสิทธิ์สำหรับคำขอบริบทยาว หรือเปลี่ยนไปใช้คีย์ API ของ Anthropic
  </Step>
  <Step title="Configure fallback models">
    กำหนดค่าโมเดล fallback เพื่อให้การรันดำเนินต่อเมื่อคำขอบริบทยาวของ Anthropic ถูกปฏิเสธ
  </Step>
</Steps>

ที่เกี่ยวข้อง:

- [Anthropic](/th/providers/anthropic)
- [การใช้โทเคนและค่าใช้จ่าย](/th/reference/token-use)
- [ทำไมฉันจึงเห็น HTTP 429 จาก Anthropic?](/th/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## การตอบกลับ upstream 403 ที่ถูกบล็อก

ใช้ส่วนนี้เมื่อผู้ให้บริการ LLM upstream ส่งคืน `403` แบบทั่วไป เช่น
`Your request was blocked`

อย่าสันนิษฐานว่านี่เป็นปัญหาการกำหนดค่า OpenClaw เสมอไป การตอบกลับอาจ
มาจากชั้นความปลอดภัย upstream เช่น CDN, WAF, กฎการจัดการบอต หรือ
reverse proxy หน้า endpoint ที่เข้ากันได้กับ OpenAI

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

มองหา:

- หลายโมเดลภายใต้ผู้ให้บริการเดียวกันล้มเหลวในแบบเดียวกัน
- HTML หรือข้อความความปลอดภัยทั่วไปแทนข้อผิดพลาด API ของผู้ให้บริการตามปกติ
- เหตุการณ์ความปลอดภัยฝั่งผู้ให้บริการในเวลาเดียวกับคำขอ
- probe `curl` โดยตรงขนาดเล็กสำเร็จ ขณะที่คำขอรูปทรง SDK ตามปกติล้มเหลว

แก้การกรองฝั่งผู้ให้บริการก่อนเมื่อหลักฐานชี้ไปที่การบล็อกของ WAF/CDN
ควรใช้กฎ allow หรือ skip ที่จำกัดขอบเขตเฉพาะ path API ที่ OpenClaw
ใช้ และหลีกเลี่ยงการปิดการป้องกันทั้งไซต์

<Warning>
`curl` ขั้นต่ำที่สำเร็จไม่ได้รับประกันว่าคำขอสไตล์ SDK จริงจะ
ผ่านชั้นความปลอดภัย upstream เดียวกัน
</Warning>

ที่เกี่ยวข้อง:

- [endpoint ที่เข้ากันได้กับ OpenAI](/th/gateway/configuration-reference#openai-compatible-endpoints)
- [การกำหนดค่าผู้ให้บริการ](/th/providers)
- [บันทึก](/th/logging)

## แบ็กเอนด์ภายในเครื่องที่เข้ากันได้กับ OpenAI ผ่าน probe โดยตรง แต่การรัน agent ล้มเหลว

ใช้ส่วนนี้เมื่อ:

- `curl ... /v1/models` ทำงาน
- การเรียก `/v1/chat/completions` โดยตรงขนาดเล็กทำงาน
- การรันโมเดลของ OpenClaw ล้มเหลวเฉพาะใน turn ของ agent ตามปกติ

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

มองหา:

- การเรียกโดยตรงขนาดเล็กสำเร็จ แต่การรัน OpenClaw ล้มเหลวเฉพาะกับ prompt ที่ใหญ่กว่า
- ข้อผิดพลาด `model_not_found` หรือ 404 แม้ว่า `/v1/chat/completions` โดยตรง
  จะทำงานกับ id โมเดลเปล่าเดียวกัน
- ข้อผิดพลาดแบ็กเอนด์เกี่ยวกับ `messages[].content` ที่คาดว่าจะเป็นสตริง
- คำเตือน `incomplete turn detected ... stopReason=stop payloads=0` เป็นครั้งคราวกับแบ็กเอนด์ภายในเครื่องที่เข้ากันได้กับ OpenAI
- แบ็กเอนด์ล่มที่เกิดเฉพาะกับจำนวน prompt-token ที่ใหญ่ขึ้น หรือ prompt runtime ของ agent แบบเต็ม

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` กับเซิร์ฟเวอร์ local สไตล์ MLX/vLLM → ตรวจสอบว่า `baseUrl` มี `/v1`, `api` เป็น `"openai-completions"` สำหรับแบ็กเอนด์ `/v1/chat/completions` และ `models.providers.<provider>.models[].id` เป็น id provider-local แบบเปล่า เลือกด้วย prefix ของผู้ให้บริการหนึ่งครั้ง เช่น `mlx/mlx-community/Qwen3-30B-A3B-6bit`; เก็บรายการ catalog เป็น `mlx-community/Qwen3-30B-A3B-6bit`
    - `messages[...].content: invalid type: sequence, expected a string` → แบ็กเอนด์ปฏิเสธส่วนเนื้อหา Chat Completions แบบมีโครงสร้าง วิธีแก้: ตั้ง `models.providers.<provider>.models[].compat.requiresStringContent: true`
    - `validation.keys` หรือคีย์ข้อความที่อนุญาต เช่น `["role","content"]` → แบ็กเอนด์ปฏิเสธ metadata replay สไตล์ OpenAI บนข้อความ Chat Completions วิธีแก้: ตั้ง `models.providers.<provider>.models[].compat.strictMessageKeys: true`
    - `incomplete turn detected ... stopReason=stop payloads=0` → แบ็กเอนด์ทำคำขอ Chat Completions เสร็จแล้ว แต่ไม่ส่งข้อความ assistant ที่ผู้ใช้เห็นได้สำหรับ turn นั้น OpenClaw retry turn ว่างที่เข้ากันได้กับ OpenAI และ replay-safe หนึ่งครั้ง ความล้มเหลวที่เกิดซ้ำมักหมายความว่าแบ็กเอนด์กำลังส่งเนื้อหาว่าง/ไม่ใช่ข้อความ หรือกดไม่ให้ส่งข้อความคำตอบสุดท้าย
    - คำขอโดยตรงขนาดเล็กสำเร็จ แต่การรัน agent ของ OpenClaw ล้มเหลวด้วยแบ็กเอนด์/โมเดลล่ม (เช่น Gemma บนบาง build ของ `inferrs`) → ทรานสปอร์ตของ OpenClaw น่าจะถูกต้องอยู่แล้ว แบ็กเอนด์ล้มเหลวกับรูปทรง prompt ของ agent-runtime ที่ใหญ่กว่า
    - ความล้มเหลวลดลงหลังปิดใช้ tools แต่ไม่หายไป → schema ของ tool เป็นส่วนหนึ่งของแรงกดดัน แต่ปัญหาที่เหลือยังคงเป็นความจุของโมเดล/เซิร์ฟเวอร์ upstream หรือบั๊กของแบ็กเอนด์

  </Accordion>
  <Accordion title="Fix options">
    1. ตั้ง `compat.requiresStringContent: true` สำหรับแบ็กเอนด์ Chat Completions ที่รับเฉพาะสตริง
    2. ตั้ง `compat.strictMessageKeys: true` สำหรับแบ็กเอนด์ Chat Completions แบบเข้มงวดที่รับเฉพาะ `role` และ `content` ในแต่ละข้อความ
    3. ตั้ง `compat.supportsTools: false` สำหรับโมเดล/แบ็กเอนด์ที่รับมือกับพื้นผิว schema ของ tool ของ OpenClaw ได้ไม่เสถียร
    4. ลดแรงกดดันของ prompt เมื่อทำได้: bootstrap workspace ที่เล็กลง, ประวัติเซสชันที่สั้นลง, โมเดล local ที่เบาลง หรือแบ็กเอนด์ที่รองรับบริบทยาวได้ดีกว่า
    5. หากคำขอโดยตรงขนาดเล็กยังผ่าน แต่ turn ของ agent OpenClaw ยังล่มภายในแบ็กเอนด์ ให้ถือว่าเป็นข้อจำกัดของเซิร์ฟเวอร์/โมเดล upstream และยื่น repro ที่นั่นพร้อมรูปทรง payload ที่ยอมรับได้
  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [การกำหนดค่า](/th/gateway/configuration)
- [โมเดลในเครื่อง](/th/gateway/local-models)
- [เอนด์พอยต์ที่เข้ากันได้กับ OpenAI](/th/gateway/configuration-reference#openai-compatible-endpoints)

## ไม่มีการตอบกลับ

หากช่องทางพร้อมใช้งานแต่ไม่มีอะไรตอบ ให้ตรวจสอบการกำหนดเส้นทางและนโยบายก่อนเชื่อมต่ออะไรใหม่

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

มองหา:

- การจับคู่ที่รอดำเนินการสำหรับผู้ส่ง DM
- การบังคับให้กล่าวถึงในกลุ่ม (`requireMention`, `mentionPatterns`)
- ความไม่ตรงกันของ allowlist ช่องทาง/กลุ่ม

ลายเซ็นที่พบบ่อย:

- `drop guild message (mention required` → ข้อความกลุ่มถูกละเว้นจนกว่าจะมีการกล่าวถึง
- `pairing request` → ผู้ส่งต้องได้รับการอนุมัติ
- `blocked` / `allowlist` → ผู้ส่ง/ช่องทางถูกกรองโดยนโยบาย

ที่เกี่ยวข้อง:

- [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)
- [กลุ่ม](/th/channels/groups)
- [การจับคู่](/th/channels/pairing)

## การเชื่อมต่อ UI ควบคุมของแดชบอร์ด

เมื่อแดชบอร์ด/UI ควบคุมเชื่อมต่อไม่ได้ ให้ตรวจสอบ URL, โหมดการยืนยันตัวตน และสมมติฐานเรื่องบริบทที่ปลอดภัย

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

มองหา:

- URL ตรวจสอบที่ถูกต้องและ URL แดชบอร์ด
- ความไม่ตรงกันของโหมดการยืนยันตัวตน/โทเค็นระหว่างไคลเอนต์กับ Gateway
- การใช้ HTTP ในที่ที่ต้องมีอัตลักษณ์อุปกรณ์

หากเบราว์เซอร์ในเครื่องเชื่อมต่อกับ `127.0.0.1:18789` ไม่ได้หลังอัปเดต ให้กู้คืนบริการ Gateway ในเครื่องก่อน และยืนยันว่ากำลังให้บริการแดชบอร์ด:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

หาก `curl` ส่งคืน HTML ของ OpenClaw แสดงว่า Gateway ทำงานอยู่ และปัญหาที่เหลือน่าจะเป็นแคชเบราว์เซอร์ ลิงก์ลึกเก่า หรือสถานะแท็บค้างอยู่ เปิด `http://127.0.0.1:18789` โดยตรงและนำทางจากแดชบอร์ด หากรีสตาร์ตแล้วบริการไม่คงอยู่ ให้รัน `openclaw gateway start` แล้วตรวจสอบ `openclaw gateway status` อีกครั้ง

<AccordionGroup>
  <Accordion title="ลายเซ็นการเชื่อมต่อ / การยืนยันตัวตน">
    - `device identity required` → บริบทไม่ปลอดภัยหรือไม่มีการยืนยันตัวตนอุปกรณ์
    - `origin not allowed` → `Origin` ของเบราว์เซอร์ไม่อยู่ใน `gateway.controlUi.allowedOrigins` (หรือคุณกำลังเชื่อมต่อจาก origin ของเบราว์เซอร์ที่ไม่ใช่ loopback โดยไม่มี allowlist ที่ระบุชัดเจน)
    - `device nonce required` / `device nonce mismatch` → ไคลเอนต์ไม่ได้ทำโฟลว์การยืนยันตัวตนอุปกรณ์แบบ challenge-based ให้เสร็จ (`connect.challenge` + `device.nonce`)
    - `device signature invalid` / `device signature expired` → ไคลเอนต์ลงนาม payload ผิด (หรือ timestamp ค้าง) สำหรับ handshake ปัจจุบัน
    - `AUTH_TOKEN_MISMATCH` พร้อม `canRetryWithDeviceToken=true` → ไคลเอนต์สามารถลองซ้ำแบบเชื่อถือได้หนึ่งครั้งด้วยโทเค็นอุปกรณ์ที่แคชไว้
    - การลองซ้ำด้วยโทเค็นที่แคชไว้นั้นใช้ชุด scope ที่แคชไว้ซึ่งจัดเก็บพร้อมโทเค็นอุปกรณ์ที่จับคู่แล้ว ผู้เรียกที่ระบุ `deviceToken` / `scopes` ชัดเจนจะคงชุด scope ที่ร้องขอไว้แทน
    - `AUTH_SCOPE_MISMATCH` → โทเค็นอุปกรณ์ถูกรับรู้แล้ว แต่ scope ที่ได้รับอนุมัติไม่ครอบคลุมคำขอเชื่อมต่อนี้ ให้จับคู่ใหม่หรืออนุมัติสัญญา scope ที่ร้องขอแทนการหมุนโทเค็น Gateway ที่ใช้ร่วมกัน
    - นอกเส้นทางการลองซ้ำนั้น ลำดับความสำคัญของการยืนยันตัวตนการเชื่อมต่อคือโทเค็น/รหัสผ่านที่ใช้ร่วมกันแบบระบุชัดเจนก่อน ตามด้วย `deviceToken` ที่ระบุชัดเจน ตามด้วยโทเค็นอุปกรณ์ที่จัดเก็บไว้ แล้วจึงเป็น bootstrap token
    - บนเส้นทาง UI ควบคุม Tailscale Serve แบบ async ความพยายามที่ล้มเหลวสำหรับ `{scope, ip}` เดียวกันจะถูกทำให้เป็นลำดับก่อนที่ตัวจำกัดจะบันทึกความล้มเหลว ดังนั้นการลองซ้ำพร้อมกันที่ไม่ถูกต้องสองครั้งจากไคลเอนต์เดียวกันอาจแสดง `retry later` ในครั้งที่สองแทนที่จะเป็นความไม่ตรงกันธรรมดาสองครั้ง
    - `too many failed authentication attempts (retry later)` จากไคลเอนต์ loopback ที่มี origin จากเบราว์เซอร์ → ความล้มเหลวซ้ำจาก `Origin` ที่ normalize แล้วเดียวกันถูกล็อกชั่วคราว; origin localhost อื่นจะใช้ bucket แยกต่างหาก
    - `unauthorized` ซ้ำหลังการลองซ้ำนั้น → โทเค็นที่ใช้ร่วมกัน/โทเค็นอุปกรณ์คลาดเคลื่อน ให้รีเฟรชการกำหนดค่าโทเค็นและอนุมัติใหม่/หมุนโทเค็นอุปกรณ์หากจำเป็น
    - `gateway connect failed:` → เป้าหมาย host/port/url ผิด

  </Accordion>
</AccordionGroup>

### แผนที่ย่อโค้ดรายละเอียดการยืนยันตัวตน

ใช้ `error.details.code` จากการตอบกลับ `connect` ที่ล้มเหลวเพื่อเลือกการดำเนินการถัดไป:

| โค้ดรายละเอียด                  | ความหมาย                                                                                                                                                                                      | การดำเนินการที่แนะนำ                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | ไคลเอนต์ไม่ได้ส่งโทเค็นที่ใช้ร่วมกันซึ่งจำเป็น                                                                                                                                                 | วาง/ตั้งค่าโทเค็นในไคลเอนต์แล้วลองอีกครั้ง สำหรับเส้นทางแดชบอร์ด: `openclaw config get gateway.auth.token` จากนั้นวางลงในการตั้งค่า UI ควบคุม                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | โทเค็นที่ใช้ร่วมกันไม่ตรงกับโทเค็นยืนยันตัวตนของ Gateway                                                                                                                                               | หาก `canRetryWithDeviceToken=true` ให้ยอมให้ลองซ้ำแบบเชื่อถือได้หนึ่งครั้ง การลองซ้ำด้วยโทเค็นที่แคชไว้จะใช้ scope ที่อนุมัติแล้วที่จัดเก็บไว้; ผู้เรียกที่ระบุ `deviceToken` / `scopes` ชัดเจนจะคง scope ที่ร้องขอไว้ หากยังล้มเหลว ให้รัน [เช็กลิสต์การกู้คืนโทเค็นคลาดเคลื่อน](/th/cli/devices#token-drift-recovery-checklist) |
| `AUTH_DEVICE_TOKEN_MISMATCH` | โทเค็นต่ออุปกรณ์ที่แคชไว้ค้างหรือถูกเพิกถอน                                                                                                                                                 | หมุน/อนุมัติโทเค็นอุปกรณ์ใหม่โดยใช้ [CLI อุปกรณ์](/th/cli/devices) แล้วเชื่อมต่อใหม่                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | โทเค็นอุปกรณ์ถูกต้อง แต่บทบาท/scope ที่ได้รับอนุมัติไม่ครอบคลุมคำขอเชื่อมต่อนี้                                                                                                       | จับคู่อุปกรณ์ใหม่หรืออนุมัติสัญญา scope ที่ร้องขอ; อย่าถือว่านี่เป็นการคลาดเคลื่อนของโทเค็นที่ใช้ร่วมกัน                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | อัตลักษณ์อุปกรณ์ต้องได้รับการอนุมัติ ตรวจสอบ `error.details.reason` สำหรับ `not-paired`, `scope-upgrade`, `role-upgrade` หรือ `metadata-upgrade` และใช้ `requestId` / `remediationHint` เมื่อมี | อนุมัติคำขอที่รอดำเนินการ: `openclaw devices list` จากนั้น `openclaw devices approve <requestId>` การอัปเกรด scope/บทบาทใช้โฟลว์เดียวกันหลังจากคุณตรวจสอบสิทธิ์การเข้าถึงที่ร้องขอแล้ว                                                                                                               |

<Note>
RPC backend loopback โดยตรงที่ยืนยันตัวตนด้วยโทเค็น/รหัสผ่าน Gateway ที่ใช้ร่วมกัน ไม่ควรขึ้นกับ baseline scope ของอุปกรณ์ที่จับคู่ของ CLI หาก subagent หรือการเรียกภายในอื่นยังล้มเหลวด้วย `scope-upgrade` ให้ตรวจสอบว่าผู้เรียกใช้ `client.id: "gateway-client"` และ `client.mode: "backend"` และไม่ได้บังคับ `deviceIdentity` หรือโทเค็นอุปกรณ์แบบระบุชัดเจน
</Note>

การตรวจสอบการย้ายข้อมูล device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

หากล็อกแสดงข้อผิดพลาด nonce/signature ให้อัปเดตไคลเอนต์ที่เชื่อมต่อและตรวจสอบ:

<Steps>
  <Step title="รอ connect.challenge">
    ไคลเอนต์รอ `connect.challenge` ที่ Gateway ออกให้
  </Step>
  <Step title="ลงนาม payload">
    ไคลเอนต์ลงนาม payload ที่ผูกกับ challenge
  </Step>
  <Step title="ส่ง nonce ของอุปกรณ์">
    ไคลเอนต์ส่ง `connect.params.device.nonce` พร้อม challenge nonce เดียวกัน
  </Step>
</Steps>

หาก `openclaw devices rotate` / `revoke` / `remove` ถูกปฏิเสธโดยไม่คาดคิด:

- เซสชันโทเค็นอุปกรณ์ที่จับคู่แล้วสามารถจัดการได้เฉพาะอุปกรณ์ **ของตัวเอง** เท่านั้น เว้นแต่ผู้เรียกจะมี `operator.admin` ด้วย
- `openclaw devices rotate --scope ...` สามารถขอได้เฉพาะ operator scope ที่เซสชันผู้เรียกมีอยู่แล้ว

ที่เกี่ยวข้อง:

- [การกำหนดค่า](/th/gateway/configuration) (โหมดการยืนยันตัวตน Gateway)
- [UI ควบคุม](/th/web/control-ui)
- [อุปกรณ์](/th/cli/devices)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [การยืนยันตัวตน trusted proxy](/th/gateway/trusted-proxy-auth)

## บริการ Gateway ไม่ทำงาน

ใช้กรณีนี้เมื่อบริการติดตั้งแล้วแต่กระบวนการไม่คงอยู่

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

มองหา:

- `Runtime: stopped` พร้อมคำใบ้ exit
- ความไม่ตรงกันของการกำหนดค่าบริการ (`Config (cli)` เทียบกับ `Config (service)`)
- ความขัดแย้งของพอร์ต/listener
- การติดตั้ง launchd/systemd/schtasks เพิ่มเติมเมื่อใช้ `--deep`
- คำใบ้การล้าง `Other gateway-like services detected (best effort)`

<AccordionGroup>
  <Accordion title="ลายเซ็นที่พบบ่อย">
    - `Gateway start blocked: set gateway.mode=local` หรือ `existing config is missing gateway.mode` → โหมด Gateway ในเครื่องไม่ได้เปิดใช้งาน หรือไฟล์กำหนดค่าถูกเขียนทับจน `gateway.mode` หายไป วิธีแก้: ตั้ง `gateway.mode="local"` ในการกำหนดค่าของคุณ หรือรัน `openclaw onboard --mode local` / `openclaw setup` อีกครั้งเพื่อประทับค่าการกำหนดค่าโหมดในเครื่องที่คาดไว้ใหม่ หากคุณรัน OpenClaw ผ่าน Podman เส้นทางการกำหนดค่าเริ่มต้นคือ `~/.openclaw/openclaw.json`
    - `refusing to bind gateway ... without auth` → bind ที่ไม่ใช่ loopback โดยไม่มีเส้นทางการยืนยันตัวตน Gateway ที่ถูกต้อง (โทเค็น/รหัสผ่าน หรือ trusted-proxy เมื่อกำหนดค่าไว้)
    - `another gateway instance is already listening` / `EADDRINUSE` → ความขัดแย้งของพอร์ต
    - `Other gateway-like services detected (best effort)` → มีหน่วย launchd/systemd/schtasks ที่ค้างหรือทำงานขนานกันอยู่ การตั้งค่าส่วนใหญ่ควรมี Gateway หนึ่งตัวต่อเครื่อง; หากคุณจำเป็นต้องมีมากกว่าหนึ่งตัว ให้แยกพอร์ต + config/state/workspace ดู [/gateway#multiple-gateways-same-host](/th/gateway#multiple-gateways-same-host)
    - `System-level OpenClaw gateway service detected` จาก doctor → มี systemd system unit อยู่ในขณะที่บริการระดับผู้ใช้หายไป ลบหรือปิดใช้งานรายการซ้ำก่อนอนุญาตให้ doctor ติดตั้งบริการผู้ใช้ หรือกำหนด `OPENCLAW_SERVICE_REPAIR_POLICY=external` หาก system unit คือ supervisor ที่ต้องการ
    - `Gateway service port does not match current gateway config` → supervisor ที่ติดตั้งไว้ยังคงตรึง `--port` เก่าไว้ รัน `openclaw doctor --fix` หรือ `openclaw gateway install --force` จากนั้นรีสตาร์ตบริการ Gateway

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [การ exec เบื้องหลังและเครื่องมือกระบวนการ](/th/gateway/background-process)
- [การกำหนดค่า](/th/gateway/configuration)
- [Doctor](/th/gateway/doctor)

## Gateway บน macOS หยุดตอบสนองเงียบ ๆ แล้วกลับมาทำงานต่อเมื่อคุณแตะแดชบอร์ด

ใช้กรณีนี้เมื่อช่องทาง (Telegram, WhatsApp ฯลฯ) บนโฮสต์ macOS เงียบไปครั้งละหลายนาทีถึงหลายชั่วโมง และ Gateway ดูเหมือนจะกลับมาทันทีเมื่อคุณเปิด UI ควบคุม, SSH เข้าไป หรือโต้ตอบกับโฮสต์ด้วยวิธีอื่น โดยปกติจะไม่มีอาการที่ชัดเจนใน `openclaw status` เพราะเมื่อคุณตรวจดู Gateway ก็กลับมามีชีวิตอีกครั้งแล้ว

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

ให้มองหา:

- บันเดิล `*-uncaught_exception.json` หนึ่งรายการขึ้นไปใน `~/.openclaw/logs/stability/` ที่มี `error.code` ตั้งเป็นโค้ดเครือข่ายชั่วคราว เช่น `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` หรือ `ECONNREFUSED`
- บรรทัด `pmset -g log` เช่น `Entering Sleep state due to 'Maintenance Sleep'` หรือ `en0 driver is slow (msg: WillChangeState to 0)` ที่ตรงกับเวลาที่เกิดแครช Power Nap / Maintenance Sleep จะทำให้ไดรเวอร์ Wi-Fi เข้าสู่สถานะ 0 ชั่วครู่; การเรียกขาออก `connect()` ใดๆ ที่เกิดขึ้นในช่วงเวลานั้นอาจล้มเหลวด้วย `ENETDOWN` แม้บนโฮสต์ที่โดยปกติมีการเชื่อมต่อเครือข่ายเต็มรูปแบบ
- เอาต์พุต `launchctl print` ที่แสดง `state = not running` พร้อม `runs` ล่าสุดหลายรายการและโค้ดออก โดยเฉพาะเมื่อช่องว่างระหว่างแครชกับการเริ่มครั้งถัดไปอยู่ในระดับประมาณหนึ่งชั่วโมงแทนที่จะเป็นไม่กี่วินาที macOS launchd ใช้กลไกป้องกันการเกิดซ้ำหลังจากเกิดแครชเป็นชุดโดยไม่ได้เอกสารกำกับ ซึ่งอาจหยุดทำตาม `KeepAlive=true` จนกว่าจะมีทริกเกอร์ภายนอก เช่น การเข้าสู่ระบบแบบโต้ตอบ การเชื่อมต่อแดชบอร์ด หรือ `launchctl kickstart` เพื่อเปิดใช้งานใหม่

ลายเซ็นที่พบบ่อย:

- บันเดิลเสถียรภาพที่ `error.code` เป็น `ENETDOWN` หรือโค้ดในกลุ่มเดียวกัน พร้อม call stack ที่ชี้เข้าไปยัง Node `net` `lookupAndConnect` / `Socket.connect` OpenClaw `2026.5.26` และใหม่กว่าจัดประเภทกรณีเหล่านี้เป็นข้อผิดพลาดเครือข่ายชั่วคราวที่ไม่ร้ายแรง จึงไม่ส่งต่อไปยังตัวจัดการ uncaught ระดับบนอีกต่อไป; หากคุณใช้รุ่นเก่ากว่า ให้อัปเกรดก่อน
- ช่วงเงียบยาวที่สิ้นสุดทันทีเมื่อคุณเชื่อมต่อกับ Control UI หรือ SSH เข้าโฮสต์: กิจกรรมที่ผู้ใช้มองเห็นคือสิ่งที่เปิดใช้งาน gate การเกิดซ้ำของ launchd ใหม่ ไม่ใช่สิ่งที่แดชบอร์ดทำกับ Gateway
- จำนวน `runs` เพิ่มขึ้นตลอดวันโดยไม่มีบรรทัด `received SIG*; shutting down` ที่สอดคล้องกันใน `~/Library/Logs/openclaw/gateway.log`: การปิดอย่างสะอาดจะบันทึกสัญญาณ; แครชชั่วคราวจะไม่บันทึก

สิ่งที่ควรทำ:

1. **อัปเกรด Gateway** หากคุณกำลังใช้รุ่นก่อน `2026.5.26` หลังอัปเกรดแล้ว ข้อผิดพลาด `ENETDOWN` ในอนาคตจะถูกบันทึกเป็นคำเตือนแทนการยุติโพรเซส
2. **ลดกิจกรรม maintenance sleep** บนโฮสต์ Mac mini / เดสก์ท็อปที่ตั้งใจให้ทำงานเป็นเซิร์ฟเวอร์เปิดตลอดเวลา:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   วิธีนี้ลดอาการไดรเวอร์กระพือที่เป็นสาเหตุได้อย่างมาก แต่ไม่สามารถกำจัดได้ทั้งหมด ระบบยังอาจทำ maintenance sleep บางส่วนสำหรับ TCP keepalive และการดูแล mDNS ได้โดยไม่ขึ้นกับแฟล็กเหล่านี้

3. **เพิ่ม watchdog ตรวจความพร้อมใช้งาน** เพื่อให้แครชเป็นชุดในอนาคตที่ถูก launchd พักไว้ถูกตรวจพบอย่างรวดเร็ว:

   ```bash
   # Example launchd-aware liveness check, suitable for a 5-minute cron or LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   จุดประสงค์คือการเปิดใช้งาน gate การเกิดซ้ำจากภายนอกอีกครั้ง; `KeepAlive=true` เพียงอย่างเดียวไม่เพียงพอบน macOS หลังจากเกิดแครชเป็นชุด

ที่เกี่ยวข้อง:

- [หมายเหตุแพลตฟอร์ม macOS](/th/platforms/macos)
- [การบันทึกล็อก](/th/logging)
- [Doctor](/th/gateway/doctor)

## Gateway ออกระหว่างการใช้หน่วยความจำสูง

ใช้หัวข้อนี้เมื่อ Gateway หายไประหว่างมีโหลด, supervisor รายงานการรีสตาร์ตลักษณะ OOM หรือล็อกกล่าวถึง `critical memory pressure bundle written`

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

ให้มองหา:

- `Reason: diagnostic.memory.pressure.critical` ในบันเดิลเสถียรภาพล่าสุด
- `Memory pressure:` พร้อม `critical/rss_threshold`, `critical/heap_threshold` หรือ `critical/rss_growth`
- ค่า `V8 heap:` ที่ใกล้ขีดจำกัด heap
- รายการ `Largest session files:` เช่น `agents/<agent>/sessions/<session>.jsonl` หรือ `sessions/<session>.jsonl`
- ตัวนับหน่วยความจำ cgroup ของ Linux เมื่อ Gateway ทำงานภายในคอนเทนเนอร์หรือบริการที่จำกัดหน่วยความจำ

ลายเซ็นที่พบบ่อย:

- `critical memory pressure bundle written` ปรากฏไม่นานก่อนรีสตาร์ต → OpenClaw จับบันเดิลเสถียรภาพก่อน OOM ไว้แล้ว ตรวจสอบด้วย `openclaw gateway stability --bundle latest`
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` ปรากฏในล็อก Gateway → OpenClaw ตรวจพบภาวะหน่วยความจำวิกฤต แต่สแนปช็อตเสถียรภาพก่อน OOM ถูกปิดอยู่
- `Largest session files:` ชี้ไปยังพาธ transcript ที่ถูกปกปิดข้อมูลและมีขนาดใหญ่มาก → ลดประวัติ session ที่เก็บไว้, ตรวจสอบการเติบโตของ session หรือย้าย transcript เก่าออกจาก store ที่ใช้งานอยู่ก่อนรีสตาร์ต
- จำนวนไบต์ที่ใช้ใน `V8 heap:` ใกล้ขีดจำกัด heap → ลดแรงกดดันจากพรอมป์/session, ลดงานพร้อมกัน หรือเพิ่มขีดจำกัด heap ของ Node หลังจากยืนยันแล้วว่า workload เป็นไปตามที่คาด
- `Memory pressure: critical/rss_growth` → หน่วยความจำเพิ่มขึ้นอย่างรวดเร็วภายในหนึ่งช่วงการสุ่มตัวอย่าง ตรวจสอบล็อกล่าสุดเพื่อหา import ขนาดใหญ่, เอาต์พุต tool ที่ runaway, การลองซ้ำซ้ำๆ หรือชุดงาน agent ที่ค้างคิว
- ภาวะหน่วยความจำวิกฤตปรากฏในล็อกแต่ไม่มีบันเดิล → นี่คือค่าเริ่มต้น ตั้งค่า `diagnostics.memoryPressureSnapshot: true` เพื่อจับบันเดิลเสถียรภาพก่อน OOM ในเหตุการณ์หน่วยความจำวิกฤตครั้งต่อไป

บันเดิลเสถียรภาพไม่มี payload ภายใน มีหลักฐานหน่วยความจำเชิงปฏิบัติการและพาธไฟล์สัมพัทธ์ที่ถูกปกปิดข้อมูล ไม่ใช่ข้อความ, เนื้อหา Webhook, ข้อมูลประจำตัว, โทเคน, คุกกี้ หรือ session id ดิบ แนบ diagnostics export ไปกับรายงานบั๊กแทนการคัดลอกล็อกดิบ

ที่เกี่ยวข้อง:

- [สุขภาพ Gateway](/th/gateway/health)
- [Diagnostics export](/th/gateway/diagnostics)
- [Sessions](/th/cli/sessions)

## Gateway ปฏิเสธ config ที่ไม่ถูกต้อง

ใช้หัวข้อนี้เมื่อการเริ่มต้น Gateway ล้มเหลวด้วย `Invalid config` หรือล็อก hot reload ระบุว่า
ข้ามการแก้ไขที่ไม่ถูกต้อง

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

ให้มองหา:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- ไฟล์ `openclaw.json.rejected.*` ที่มี timestamp อยู่ข้าง config ที่ใช้งานอยู่
- ไฟล์ `openclaw.json.clobbered.*` ที่มี timestamp หาก `doctor --fix` ซ่อมการแก้ไขโดยตรงที่เสียหาย
- OpenClaw เก็บไฟล์ `.clobbered.*` ล่าสุด 32 ไฟล์สำหรับแต่ละพาธ config และหมุนเวียนไฟล์เก่ากว่าออก

<AccordionGroup>
  <Accordion title="เกิดอะไรขึ้น">
    - config ไม่ผ่านการ validate ระหว่างการเริ่มต้น, hot reload หรือการเขียนที่ OpenClaw เป็นเจ้าของ
    - การเริ่มต้น Gateway ล้มเหลวแบบ fail closed แทนที่จะเขียน `openclaw.json` ใหม่
    - hot reload ข้ามการแก้ไขภายนอกที่ไม่ถูกต้องและคง config runtime ปัจจุบันไว้
    - การเขียนที่ OpenClaw เป็นเจ้าของปฏิเสธ payload ที่ไม่ถูกต้อง/ทำลายข้อมูลก่อน commit และบันทึก `.rejected.*`
    - `openclaw doctor --fix` เป็นเจ้าของการซ่อมแซม สามารถลบ prefix ที่ไม่ใช่ JSON หรือกู้คืนสำเนา last-known-good พร้อมเก็บ payload ที่ถูกปฏิเสธไว้เป็น `.clobbered.*`
    - เมื่อมีการซ่อมจำนวนมากสำหรับพาธ config เดียว OpenClaw จะหมุนเวียนไฟล์ `.clobbered.*` เก่ากว่าออกเพื่อให้ payload ที่ซ่อมล่าสุดยังพร้อมใช้งาน

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
  <Accordion title="ลายเซ็นที่พบบ่อย">
    - มี `.clobbered.*` → doctor เก็บการแก้ไขภายนอกที่เสียหายไว้ขณะซ่อม config ที่ใช้งานอยู่
    - มี `.rejected.*` → การเขียน config ที่ OpenClaw เป็นเจ้าของล้มเหลวในการตรวจ schema หรือการตรวจ clobber ก่อน commit
    - `Config write rejected:` → การเขียนพยายามลบโครงสร้างที่จำเป็น, ทำให้ไฟล์เล็กลงอย่างมาก หรือคง config ที่ไม่ถูกต้องไว้
    - `config reload skipped (invalid config):` → การแก้ไขโดยตรงไม่ผ่าน validation และถูก Gateway ที่กำลังทำงานอยู่ละเว้น
    - `Invalid config at ...` → การเริ่มต้นล้มเหลวก่อนที่บริการ Gateway จะบูต
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` หรือ `size-drop-vs-last-good:*` → การเขียนที่ OpenClaw เป็นเจ้าของถูกปฏิเสธเพราะสูญเสียฟิลด์หรือขนาดเมื่อเทียบกับข้อมูลสำรอง last-known-good
    - `Config last-known-good promotion skipped` → candidate มี placeholder ความลับที่ถูกปกปิดข้อมูล เช่น `***`

  </Accordion>
  <Accordion title="ตัวเลือกการแก้ไข">
    1. เรียกใช้ `openclaw doctor --fix` เพื่อให้ doctor ซ่อม config ที่มี prefix/ถูก clobber หรือกู้คืน last-known-good
    2. คัดลอกเฉพาะคีย์ที่ต้องการจาก `.clobbered.*` หรือ `.rejected.*` แล้วนำไปใช้ด้วย `openclaw config set` หรือ `config.patch`
    3. เรียกใช้ `openclaw config validate` ก่อนรีสตาร์ต
    4. หากคุณแก้ไขด้วยมือ ให้คง config JSON5 แบบเต็ม ไม่ใช่แค่อ็อบเจกต์บางส่วนที่คุณต้องการเปลี่ยน
  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Config](/th/cli/config)
- [Configuration: hot reload](/th/gateway/configuration#config-hot-reload)
- [Configuration: strict validation](/th/gateway/configuration#strict-validation)
- [Doctor](/th/gateway/doctor)

## คำเตือนของ probe Gateway

ใช้หัวข้อนี้เมื่อ `openclaw gateway probe` เข้าถึงบางอย่างได้ แต่ยังพิมพ์บล็อกคำเตือน

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

ให้มองหา:

- `warnings[].code` และ `primaryTargetId` ในเอาต์พุต JSON
- ว่าคำเตือนเกี่ยวกับ fallback ของ SSH, Gateway หลายตัว, scopes ที่หายไป หรือ auth refs ที่ resolve ไม่ได้

ลายเซ็นที่พบบ่อย:

- `SSH tunnel failed to start; falling back to direct probes.` → การตั้งค่า SSH ล้มเหลว แต่คำสั่งยังลองเป้าหมายที่กำหนดค่าไว้/loopback โดยตรง
- `multiple reachable gateway identities detected` → Gateway คนละตัวตอบกลับ หรือ OpenClaw ไม่สามารถพิสูจน์ได้ว่าเป้าหมายที่เข้าถึงได้เป็น Gateway เดียวกัน SSH tunnel, URL พร็อกซี หรือ URL ระยะไกลที่กำหนดค่าไว้ไปยัง Gateway เดียวกันจะถือเป็น Gateway เดียวที่มีหลาย transport แม้พอร์ต transport จะแตกต่างกัน
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → เชื่อมต่อได้ แต่ RPC รายละเอียดถูกจำกัดด้วย scope; จับคู่อัตลักษณ์อุปกรณ์หรือใช้ข้อมูลประจำตัวที่มี `operator.read`
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → เชื่อมต่อได้ แต่ชุด RPC diagnostic เต็มรูปแบบ timeout หรือล้มเหลว ให้ถือว่านี่เป็น Gateway ที่เข้าถึงได้พร้อม diagnostics ที่ลดระดับ; เปรียบเทียบ `connect.ok` และ `connect.rpcOk` ในเอาต์พุต `--json`
- `Capability: pairing-pending` หรือ `gateway closed (1008): pairing required` → Gateway ตอบกลับแล้ว แต่ client นี้ยังต้อง pairing/approval ก่อนเข้าถึง operator ตามปกติ
- ข้อความเตือน SecretRef ของ `gateway.auth.*` / `gateway.remote.*` ที่ resolve ไม่ได้ → auth material ไม่พร้อมใช้งานในพาธคำสั่งนี้สำหรับเป้าหมายที่ล้มเหลว

ที่เกี่ยวข้อง:

- [Gateway](/th/cli/gateway)
- [Gateway หลายตัวบนโฮสต์เดียวกัน](/th/gateway#multiple-gateways-same-host)
- [การเข้าถึงระยะไกล](/th/gateway/remote)

## Channel เชื่อมต่อแล้ว แต่ข้อความไม่ไหล

หากสถานะ channel เชื่อมต่อแล้วแต่ message flow หยุด ให้โฟกัสที่ policy, permissions และกฎการส่งมอบเฉพาะของ channel

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

ให้มองหา:

- policy ของ DM (`pairing`, `allowlist`, `open`, `disabled`)
- allowlist ของกลุ่มและข้อกำหนดการ mention
- permissions/scopes ของ API channel ที่หายไป

ลายเซ็นที่พบบ่อย:

- `mention required` → ข้อความถูกละเว้นโดย policy การ mention ของกลุ่ม
- ร่องรอย `pairing` / pending approval → ผู้ส่งยังไม่ได้รับอนุมัติ
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → ปัญหา auth/permissions ของ channel

ที่เกี่ยวข้อง:

- [การแก้ไขปัญหา Channel](/th/channels/troubleshooting)
- [Discord](/th/channels/discord)
- [Telegram](/th/channels/telegram)
- [WhatsApp](/th/channels/whatsapp)

## การส่งมอบ Cron และ Heartbeat

หาก Cron หรือ Heartbeat ไม่ได้ทำงานหรือไม่ได้ส่งมอบ ให้ตรวจสอบสถานะ scheduler ก่อน แล้วจึงตรวจสอบเป้าหมายการส่งมอบ

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

มองหา:

- เปิดใช้ Cron แล้วและมีเวลาปลุกครั้งถัดไปอยู่
- สถานะประวัติการรันงาน (`ok`, `skipped`, `error`)
- เหตุผลที่ข้าม Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`)

<AccordionGroup>
  <Accordion title="ลายเซ็นที่พบบ่อย">
    - `cron: scheduler disabled; jobs will not run automatically` → cron ถูกปิดใช้งาน
    - `cron: timer tick failed` → tick ของตัวจัดตารางเวลาล้มเหลว ตรวจสอบไฟล์/ล็อก/ข้อผิดพลาดรันไทม์
    - `heartbeat skipped` พร้อม `reason=quiet-hours` → อยู่นอกช่วงเวลาทำงาน
    - `heartbeat skipped` พร้อม `reason=empty-heartbeat-file` → มี `HEARTBEAT.md` อยู่ แต่มีเฉพาะช่องว่าง ความคิดเห็น ส่วนหัว fence หรือโครงรายการตรวจสอบว่าง OpenClaw จึงข้ามการเรียกโมเดล
    - `heartbeat skipped` พร้อม `reason=no-tasks-due` → `HEARTBEAT.md` มีบล็อก `tasks:` แต่ไม่มีงานใดถึงกำหนดใน tick นี้
    - `heartbeat: unknown accountId` → id บัญชีไม่ถูกต้องสำหรับเป้าหมายการส่ง Heartbeat
    - `heartbeat skipped` พร้อม `reason=dm-blocked` → เป้าหมาย Heartbeat ถูก resolve เป็นปลายทางแบบ DM ขณะที่ `agents.defaults.heartbeat.directPolicy` (หรือ override ราย agent) ถูกตั้งเป็น `block`

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Heartbeat](/th/gateway/heartbeat)
- [งานที่ตั้งเวลาไว้](/th/automation/cron-jobs)
- [งานที่ตั้งเวลาไว้: การแก้ปัญหา](/th/automation/cron-jobs#troubleshooting)

## Node จับคู่แล้ว แต่เครื่องมือล้มเหลว

หาก Node จับคู่แล้วแต่เครื่องมือล้มเหลว ให้แยกสถานะ foreground, permission และ approval ออกจากกัน

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

มองหา:

- Node ออนไลน์พร้อมความสามารถที่คาดไว้
- สิทธิ์ OS สำหรับกล้อง/ไมโครโฟน/ตำแหน่ง/หน้าจอ
- สถานะ exec approvals และ allowlist

ลายเซ็นที่พบบ่อย:

- `NODE_BACKGROUND_UNAVAILABLE` → แอป Node ต้องอยู่ใน foreground
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → ขาดสิทธิ์ OS
- `SYSTEM_RUN_DENIED: approval required` → รอการอนุมัติ exec
- `SYSTEM_RUN_DENIED: allowlist miss` → คำสั่งถูกบล็อกโดย allowlist

ที่เกี่ยวข้อง:

- [การอนุมัติ exec](/th/tools/exec-approvals)
- [การแก้ปัญหา Node](/th/nodes/troubleshooting)
- [Nodes](/th/nodes/index)

## เครื่องมือเบราว์เซอร์ล้มเหลว

ใช้ส่วนนี้เมื่อการกระทำของเครื่องมือเบราว์เซอร์ล้มเหลว แม้ตัว Gateway เองยังปกติ

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

มองหา:

- ว่า `plugins.allow` ถูกตั้งไว้และมี `browser` อยู่หรือไม่
- พาธ executable ของเบราว์เซอร์ที่ถูกต้อง
- การเข้าถึงโปรไฟล์ CDP
- ความพร้อมใช้งานของ Chrome ในเครื่องสำหรับโปรไฟล์ `existing-session` / `user`

<AccordionGroup>
  <Accordion title="ลายเซ็น Plugin / executable">
    - `unknown command "browser"` หรือ `unknown command 'browser'` → Plugin เบราว์เซอร์ที่ bundled มาถูก `plugins.allow` แยกออก
    - เครื่องมือเบราว์เซอร์หายไป / ไม่พร้อมใช้งาน ขณะที่ `browser.enabled=true` → `plugins.allow` แยก `browser` ออก ดังนั้น Plugin จึงไม่เคยโหลด
    - `Failed to start Chrome CDP on port` → โปรเซสเบราว์เซอร์เริ่มทำงานไม่สำเร็จ
    - `browser.executablePath not found` → พาธที่กำหนดค่าไว้ไม่ถูกต้อง
    - `browser.cdpUrl must be http(s) or ws(s)` → URL CDP ที่กำหนดค่าไว้ใช้ scheme ที่ไม่รองรับ เช่น `file:` หรือ `ftp:`
    - `browser.cdpUrl has invalid port` → URL CDP ที่กำหนดค่าไว้มีพอร์ตไม่ถูกต้องหรืออยู่นอกช่วง
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → การติดตั้ง Gateway ปัจจุบันไม่มี dependency รันไทม์เบราว์เซอร์หลัก ให้ติดตั้งใหม่หรืออัปเดต OpenClaw แล้วรีสตาร์ต Gateway สแนปช็อต ARIA และภาพหน้าจอพื้นฐานของหน้าเว็บยังทำงานได้ แต่การนำทาง, สแนปช็อต AI, ภาพหน้าจอองค์ประกอบด้วย CSS-selector และการส่งออก PDF ยังไม่พร้อมใช้งาน

  </Accordion>
  <Accordion title="ลายเซ็น Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session ยังแนบกับ data dir ของเบราว์เซอร์ที่เลือกไม่ได้ เปิดหน้า inspect ของเบราว์เซอร์ เปิดใช้ remote debugging เปิดเบราว์เซอร์ค้างไว้ อนุมัติพรอมป์แนบครั้งแรก แล้วลองใหม่ หากไม่จำเป็นต้องใช้สถานะที่ลงชื่อเข้าใช้ ให้ใช้โปรไฟล์ `openclaw` ที่จัดการให้
    - `No Chrome tabs found for profile="user"` → โปรไฟล์แนบของ Chrome MCP ไม่มีแท็บ Chrome ในเครื่องที่เปิดอยู่
    - `Remote CDP for profile "<name>" is not reachable` → endpoint CDP ระยะไกลที่กำหนดค่าไว้เข้าถึงจากโฮสต์ Gateway ไม่ได้
    - `Browser attachOnly is enabled ... not reachable` หรือ `Browser attachOnly is enabled and CDP websocket ... is not reachable` → โปรไฟล์ attach-only ไม่มีเป้าหมายที่เข้าถึงได้ หรือ endpoint HTTP ตอบกลับแล้ว แต่ CDP WebSocket ยังเปิดไม่ได้

  </Accordion>
  <Accordion title="ลายเซ็นองค์ประกอบ / ภาพหน้าจอ / อัปโหลด">
    - `fullPage is not supported for element screenshots` → คำขอภาพหน้าจอผสม `--full-page` กับ `--ref` หรือ `--element`
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → การเรียกภาพหน้าจอ Chrome MCP / `existing-session` ต้องใช้การจับภาพหน้าเว็บหรือ `--ref` จากสแนปช็อต ไม่ใช่ CSS `--element`
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hook อัปโหลด Chrome MCP ต้องใช้ ref จากสแนปช็อต ไม่ใช่ selector CSS
    - `existing-session file uploads currently support one file at a time.` → ส่งการอัปโหลดครั้งละหนึ่งไฟล์ต่อการเรียกบนโปรไฟล์ Chrome MCP
    - `existing-session dialog handling does not support timeoutMs.` → hook กล่องโต้ตอบบนโปรไฟล์ Chrome MCP ไม่รองรับการ override timeout
    - `existing-session type does not support timeoutMs overrides.` → ละเว้น `timeoutMs` สำหรับ `act:type` บนโปรไฟล์ `profile="user"` / Chrome MCP existing-session หรือใช้โปรไฟล์เบราว์เซอร์ managed/CDP เมื่อต้องใช้ timeout แบบกำหนดเอง
    - `existing-session evaluate does not support timeoutMs overrides.` → ละเว้น `timeoutMs` สำหรับ `act:evaluate` บนโปรไฟล์ `profile="user"` / Chrome MCP existing-session หรือใช้โปรไฟล์เบราว์เซอร์ managed/CDP เมื่อต้องใช้ timeout แบบกำหนดเอง
    - `response body is not supported for existing-session profiles yet.` → `responsebody` ยังต้องใช้เบราว์เซอร์ managed หรือโปรไฟล์ CDP แบบ raw
    - viewport / dark-mode / locale / offline overrides ค้างอยู่บนโปรไฟล์ attach-only หรือ remote CDP → รัน `openclaw browser stop --browser-profile <name>` เพื่อปิดเซสชันควบคุมที่ใช้งานอยู่และปล่อยสถานะการจำลอง Playwright/CDP โดยไม่ต้องรีสตาร์ต Gateway ทั้งหมด

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [เบราว์เซอร์ (จัดการโดย OpenClaw)](/th/tools/browser)
- [การแก้ปัญหาเบราว์เซอร์](/th/tools/browser-linux-troubleshooting)

## หากคุณอัปเกรดแล้วบางอย่างเสียทันที

ปัญหาส่วนใหญ่หลังอัปเกรดเกิดจาก config drift หรือค่าเริ่มต้นที่เข้มงวดขึ้นซึ่งตอนนี้ถูกบังคับใช้

<AccordionGroup>
  <Accordion title="1. พฤติกรรม auth และ URL override เปลี่ยนไป">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    สิ่งที่ต้องตรวจสอบ:

    - หาก `gateway.mode=remote` การเรียก CLI อาจกำลังชี้ไปยัง remote ขณะที่บริการในเครื่องของคุณปกติ
    - การเรียกด้วย `--url` อย่างชัดเจนจะไม่ fallback ไปยัง credentials ที่จัดเก็บไว้

    ลายเซ็นที่พบบ่อย:

    - `gateway connect failed:` → เป้าหมาย URL ผิด
    - `unauthorized` → endpoint เข้าถึงได้แต่ auth ผิด

  </Accordion>
  <Accordion title="2. Guardrail สำหรับ bind และ auth เข้มงวดขึ้น">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    สิ่งที่ต้องตรวจสอบ:

    - การ bind ที่ไม่ใช่ loopback (`lan`, `tailnet`, `custom`) ต้องมีพาธ auth ของ Gateway ที่ถูกต้อง: auth ด้วย token/password ที่ใช้ร่วมกัน หรือ deployment `trusted-proxy` แบบไม่ใช่ loopback ที่กำหนดค่าอย่างถูกต้อง
    - คีย์เก่าเช่น `gateway.token` ไม่ได้แทนที่ `gateway.auth.token`

    ลายเซ็นที่พบบ่อย:

    - `refusing to bind gateway ... without auth` → bind แบบไม่ใช่ loopback โดยไม่มีพาธ auth ของ Gateway ที่ถูกต้อง
    - `Connectivity probe: failed` ขณะที่รันไทม์กำลังทำงาน → Gateway ยังมีชีวิตอยู่แต่เข้าถึงไม่ได้ด้วย auth/url ปัจจุบัน

  </Accordion>
  <Accordion title="3. สถานะการจับคู่และตัวตนอุปกรณ์เปลี่ยนไป">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    สิ่งที่ต้องตรวจสอบ:

    - การอนุมัติอุปกรณ์ที่ค้างอยู่สำหรับแดชบอร์ด/nodes
    - การอนุมัติการจับคู่ DM ที่ค้างอยู่หลังเปลี่ยนนโยบายหรือตัวตน

    ลายเซ็นที่พบบ่อย:

    - `device identity required` → device auth ยังไม่ครบ
    - `pairing required` → sender/device ต้องได้รับอนุมัติ

  </Accordion>
</AccordionGroup>

หาก config ของบริการและรันไทม์ยังไม่ตรงกันหลังตรวจสอบ ให้ติดตั้ง metadata ของบริการใหม่จากโปรไฟล์/ไดเรกทอรีสถานะเดียวกัน:

```bash
openclaw gateway install --force
openclaw gateway restart
```

ที่เกี่ยวข้อง:

- [การยืนยันตัวตน](/th/gateway/authentication)
- [Background exec และเครื่องมือโปรเซส](/th/gateway/background-process)
- [การจับคู่ที่ Gateway เป็นเจ้าของ](/th/gateway/pairing)

## ที่เกี่ยวข้อง

- [Doctor](/th/gateway/doctor)
- [FAQ](/th/help/faq)
- [Runbook ของ Gateway](/th/gateway)
