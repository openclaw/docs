---
read_when:
    - ศูนย์รวมการแก้ไขปัญหาชี้ให้คุณมาที่นี่เพื่อการวินิจฉัยที่ลึกขึ้น
    - คุณต้องมีหัวข้อคู่มือปฏิบัติการตามอาการที่เสถียรพร้อมคำสั่งที่แน่นอน
sidebarTitle: Troubleshooting
summary: คู่มือปฏิบัติการแก้ไขปัญหาเชิงลึกสำหรับ Gateway, ช่องทาง, ระบบอัตโนมัติ, โหนด และเบราว์เซอร์
title: การแก้ไขปัญหา
x-i18n:
    generated_at: "2026-05-11T20:31:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 146a593493ce265da9a24660e8a9fc2effa25cae16cf00bf77cc1f2fec84275d
    source_path: gateway/troubleshooting.md
    workflow: 16
---

หน้านี้คือคู่มือปฏิบัติการเชิงลึก เริ่มที่ [/help/troubleshooting](/th/help/troubleshooting) หากคุณต้องการขั้นตอนคัดแยกปัญหาอย่างรวดเร็วก่อน

## ลำดับคำสั่ง

ให้รันคำสั่งเหล่านี้ก่อน ตามลำดับนี้:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

สัญญาณที่คาดหวังเมื่อระบบปกติ:

- `openclaw gateway status` แสดง `Runtime: running`, `Connectivity probe: ok` และบรรทัด `Capability: ...`
- `openclaw doctor` รายงานว่าไม่มีปัญหา config/service ที่บล็อกการทำงาน
- `openclaw channels status --probe` แสดงสถานะ transport สดแยกตามบัญชี และเมื่อรองรับ จะแสดงผลลัพธ์ probe/audit เช่น `works` หรือ `audit ok`

## การติดตั้งที่แยกสถานะกันและตัวป้องกันการกำหนดค่าที่ใหม่กว่า

ใช้ส่วนนี้เมื่อบริการ Gateway หยุดโดยไม่คาดคิดหลังอัปเดต หรือ log แสดงว่า binary ของ `openclaw` ตัวหนึ่งเก่ากว่าเวอร์ชันที่เขียน `openclaw.json` ล่าสุด

OpenClaw ประทับตราการเขียนการกำหนดค่าด้วย `meta.lastTouchedVersion` คำสั่งแบบอ่านอย่างเดียวยังตรวจสอบการกำหนดค่าที่เขียนโดย OpenClaw เวอร์ชันใหม่กว่าได้ แต่การเปลี่ยนแปลง process และ service จะปฏิเสธที่จะดำเนินต่อจาก binary ที่เก่ากว่า การกระทำที่ถูกบล็อกได้แก่ การเริ่ม หยุด รีสตาร์ต ถอนการติดตั้งบริการ Gateway, การติดตั้งบริการซ้ำแบบบังคับ, การเริ่ม Gateway ในโหมด service และการล้างพอร์ตด้วย `gateway --force`

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    แก้ `PATH` เพื่อให้ `openclaw` ชี้ไปยังการติดตั้งที่ใหม่กว่า แล้วรันการกระทำนั้นอีกครั้ง
  </Step>
  <Step title="Reinstall the gateway service">
    ติดตั้งบริการ Gateway ที่ต้องการซ้ำจากการติดตั้งที่ใหม่กว่า:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    ลบแพ็กเกจระบบที่ค้างอยู่หรือรายการ wrapper เก่าที่ยังชี้ไปยัง binary `openclaw` เก่า
  </Step>
</Steps>

<Warning>
สำหรับการดาวน์เกรดโดยตั้งใจหรือการกู้คืนฉุกเฉินเท่านั้น ให้ตั้ง `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` สำหรับคำสั่งเดียว ปล่อยให้ไม่ได้ตั้งค่าไว้สำหรับการใช้งานปกติ
</Warning>

## symlink ของ Skills ถูกข้ามเนื่องจาก path escape

ใช้ส่วนนี้เมื่อ log มี:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw ถือว่า skill root ทุกตัวเป็นขอบเขตการกักกัน symlink ใต้
`~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` หรือ
`~/.openclaw/skills` จะถูกข้ามเมื่อเป้าหมายจริง resolve ออกไปนอก root นั้น
เว้นแต่เป้าหมายจะได้รับความไว้วางใจอย่างชัดเจน

ตรวจสอบลิงก์:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

หากเป้าหมายนั้นตั้งใจไว้ ให้กำหนดค่าทั้ง skill root โดยตรงและ
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

จากนั้นเริ่ม session ใหม่หรือรอให้ watcher ของ Skills รีเฟรช รีสตาร์ต
Gateway หาก process ที่กำลังรันอยู่เกิดขึ้นก่อนการเปลี่ยนแปลงการกำหนดค่า

อย่าใช้เป้าหมายแบบกว้าง เช่น `~`, `/` หรือทั้งโฟลเดอร์โปรเจกต์ที่ซิงก์อยู่
จำกัด `allowSymlinkTargets` ให้อยู่เฉพาะ skill root จริงที่มีไดเรกทอรี
`SKILL.md` ที่เชื่อถือได้

ที่เกี่ยวข้อง:

- [การกำหนดค่า Skills](/th/tools/skills-config#symlinked-sibling-repos)
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 ต้องใช้สิทธิ์การใช้งานเพิ่มเติมสำหรับบริบทยาว

ใช้ส่วนนี้เมื่อ log/ข้อผิดพลาดมี: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

มองหา:

- โมเดล Anthropic Opus/Sonnet ที่เลือกมี `params.context1m: true`
- ข้อมูลรับรอง Anthropic ปัจจุบันไม่มีสิทธิ์ใช้บริบทยาว
- คำขอล้มเหลวเฉพาะใน session/การรันโมเดลที่ยาวซึ่งต้องใช้เส้นทาง 1M beta

ตัวเลือกการแก้ไข:

<Steps>
  <Step title="Disable context1m">
    ปิดใช้ `context1m` สำหรับโมเดลนั้นเพื่อย้อนกลับไปใช้หน้าต่างบริบทปกติ
  </Step>
  <Step title="Use an eligible credential">
    ใช้ข้อมูลรับรอง Anthropic ที่มีสิทธิ์สำหรับคำขอบริบทยาว หรือเปลี่ยนไปใช้ Anthropic API key
  </Step>
  <Step title="Configure fallback models">
    กำหนดค่าโมเดลสำรองเพื่อให้การรันดำเนินต่อได้เมื่อคำขอบริบทยาวของ Anthropic ถูกปฏิเสธ
  </Step>
</Steps>

ที่เกี่ยวข้อง:

- [Anthropic](/th/providers/anthropic)
- [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use)
- [ทำไมฉันจึงเห็น HTTP 429 จาก Anthropic?](/th/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## แบ็กเอนด์ภายในเครื่องที่เข้ากันได้กับ OpenAI ผ่าน probe โดยตรง แต่การรัน agent ล้มเหลว

ใช้ส่วนนี้เมื่อ:

- `curl ... /v1/models` ใช้งานได้
- การเรียก `/v1/chat/completions` โดยตรงขนาดเล็กใช้งานได้
- การรันโมเดลของ OpenClaw ล้มเหลวเฉพาะใน turn ปกติของ agent

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
  จะใช้งานได้กับ id โมเดลแบบเปล่าเดียวกัน
- ข้อผิดพลาดของแบ็กเอนด์เกี่ยวกับ `messages[].content` ที่คาดหวัง string
- คำเตือน `incomplete turn detected ... stopReason=stop payloads=0` เป็นครั้งคราวกับแบ็กเอนด์ภายในเครื่องที่เข้ากันได้กับ OpenAI
- แบ็กเอนด์ crash ที่เกิดขึ้นเฉพาะกับจำนวน prompt-token ที่มากขึ้นหรือ prompt runtime agent แบบเต็ม

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` กับเซิร์ฟเวอร์ภายในเครื่องสไตล์ MLX/vLLM → ตรวจสอบว่า `baseUrl` มี `/v1`, `api` เป็น `"openai-completions"` สำหรับแบ็กเอนด์ `/v1/chat/completions` และ `models.providers.<provider>.models[].id` เป็น id แบบเปล่าภายใน provider เลือกด้วย prefix ของ provider หนึ่งครั้ง เช่น `mlx/mlx-community/Qwen3-30B-A3B-6bit`; เก็บรายการ catalog เป็น `mlx-community/Qwen3-30B-A3B-6bit`
    - `messages[...].content: invalid type: sequence, expected a string` → แบ็กเอนด์ปฏิเสธส่วน content ของ Chat Completions แบบมีโครงสร้าง วิธีแก้: ตั้ง `models.providers.<provider>.models[].compat.requiresStringContent: true`
    - `validation.keys` หรือ key ของข้อความที่อนุญาต เช่น `["role","content"]` → แบ็กเอนด์ปฏิเสธ metadata replay สไตล์ OpenAI บนข้อความ Chat Completions วิธีแก้: ตั้ง `models.providers.<provider>.models[].compat.strictMessageKeys: true`
    - `incomplete turn detected ... stopReason=stop payloads=0` → แบ็กเอนด์ทำคำขอ Chat Completions เสร็จแล้วแต่ไม่ส่งคืนข้อความผู้ช่วยที่ผู้ใช้มองเห็นสำหรับ turn นั้น OpenClaw จะลอง turn ว่างเปล่าที่เข้ากันได้กับ OpenAI และปลอดภัยต่อการ replay อีกครั้งหนึ่ง ความล้มเหลวที่ยังเกิดซ้ำมักหมายความว่าแบ็กเอนด์กำลังส่ง content ว่าง/ไม่ใช่ข้อความ หรือระงับข้อความคำตอบสุดท้าย
    - คำขอโดยตรงขนาดเล็กสำเร็จ แต่การรัน agent ของ OpenClaw ล้มเหลวพร้อมการ crash ของแบ็กเอนด์/โมเดล (เช่น Gemma บนบาง build ของ `inferrs`) → transport ของ OpenClaw น่าจะถูกต้องแล้ว แบ็กเอนด์กำลังล้มเหลวกับรูปแบบ prompt ของ runtime agent ที่ใหญ่กว่า
    - ความล้มเหลวลดลงหลังปิดใช้งานเครื่องมือแต่ไม่หายไป → tool schema เป็นส่วนหนึ่งของแรงกด แต่ปัญหาที่เหลือยังอยู่ที่ความจุของโมเดล/เซิร์ฟเวอร์ upstream หรือบั๊กของแบ็กเอนด์

  </Accordion>
  <Accordion title="Fix options">
    1. ตั้ง `compat.requiresStringContent: true` สำหรับแบ็กเอนด์ Chat Completions ที่รับเฉพาะ string
    2. ตั้ง `compat.strictMessageKeys: true` สำหรับแบ็กเอนด์ Chat Completions แบบเข้มงวดที่รับเฉพาะ `role` และ `content` ในแต่ละข้อความ
    3. ตั้ง `compat.supportsTools: false` สำหรับโมเดล/แบ็กเอนด์ที่จัดการพื้นผิว tool schema ของ OpenClaw ได้ไม่น่าเชื่อถือ
    4. ลดแรงกดของ prompt เมื่อทำได้: workspace bootstrap ที่เล็กลง, ประวัติ session ที่สั้นลง, โมเดลภายในเครื่องที่เบากว่า หรือแบ็กเอนด์ที่รองรับบริบทยาวได้ดีกว่า
    5. หากคำขอโดยตรงขนาดเล็กยังผ่าน แต่ turn ของ agent ของ OpenClaw ยัง crash ภายในแบ็กเอนด์ ให้ถือว่าเป็นข้อจำกัดของเซิร์ฟเวอร์/โมเดล upstream และส่ง repro ที่นั่นพร้อมรูปแบบ payload ที่ยอมรับแล้ว
  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [การกำหนดค่า](/th/gateway/configuration)
- [โมเดลภายในเครื่อง](/th/gateway/local-models)
- [endpoint ที่เข้ากันได้กับ OpenAI](/th/gateway/configuration-reference#openai-compatible-endpoints)

## ไม่มีการตอบกลับ

หากช่องทางทำงานอยู่แต่ไม่มีสิ่งใดตอบกลับ ให้ตรวจสอบการกำหนดเส้นทางและนโยบายก่อนเชื่อมต่ออะไรใหม่

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

มองหา:

- การจับคู่ค้างอยู่สำหรับผู้ส่ง DM
- เงื่อนไข mention ในกลุ่ม (`requireMention`, `mentionPatterns`)
- allowlist ของช่องทาง/กลุ่มไม่ตรงกัน

รูปแบบที่พบบ่อย:

- `drop guild message (mention required` → ข้อความกลุ่มถูกละเว้นจนกว่าจะมี mention
- `pairing request` → ผู้ส่งต้องได้รับการอนุมัติ
- `blocked` / `allowlist` → ผู้ส่ง/ช่องทางถูกกรองโดยนโยบาย

ที่เกี่ยวข้อง:

- [การแก้ปัญหาช่องทาง](/th/channels/troubleshooting)
- [กลุ่ม](/th/channels/groups)
- [การจับคู่](/th/channels/pairing)

## การเชื่อมต่อ UI ควบคุมของแดชบอร์ด

เมื่อ dashboard/control UI เชื่อมต่อไม่ได้ ให้ตรวจสอบ URL, โหมด auth และสมมติฐานเกี่ยวกับ secure context

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

มองหา:

- probe URL และ dashboard URL ที่ถูกต้อง
- โหมด auth/token ระหว่าง client และ Gateway ไม่ตรงกัน
- การใช้ HTTP ในที่ที่ต้องใช้ identity ของอุปกรณ์

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → context ที่ไม่ปลอดภัยหรือขาด auth ของอุปกรณ์
    - `origin not allowed` → `Origin` ของเบราว์เซอร์ไม่อยู่ใน `gateway.controlUi.allowedOrigins` (หรือคุณกำลังเชื่อมต่อจาก origin ของเบราว์เซอร์ที่ไม่ใช่ loopback โดยไม่มี allowlist ชัดเจน)
    - `device nonce required` / `device nonce mismatch` → client ไม่ได้ทำ flow auth ของอุปกรณ์แบบ challenge-based ให้เสร็จ (`connect.challenge` + `device.nonce`)
    - `device signature invalid` / `device signature expired` → client ลงนาม payload ผิด (หรือ timestamp เก่า) สำหรับ handshake ปัจจุบัน
    - `AUTH_TOKEN_MISMATCH` พร้อม `canRetryWithDeviceToken=true` → client สามารถ retry ที่เชื่อถือได้หนึ่งครั้งด้วย device token ที่ cache ไว้
    - การ retry ด้วย token ที่ cache ไว้นั้นใช้ชุด scope ที่ cache ไว้ซึ่งจัดเก็บพร้อม device token ที่จับคู่แล้วซ้ำ ผู้เรียกที่ใช้ `deviceToken` ชัดเจน / `scopes` ชัดเจนจะคงชุด scope ที่ขอไว้แทน
    - `AUTH_SCOPE_MISMATCH` → device token ถูกจดจำแล้ว แต่ scope ที่อนุมัติไม่ครอบคลุมคำขอ connect นี้ ให้จับคู่ใหม่หรืออนุมัติสัญญา scope ที่ขอ แทนการหมุน shared gateway token
    - นอกเส้นทาง retry นั้น ลำดับความสำคัญของ auth สำหรับ connect คือ shared token/password ที่ระบุชัดเจนก่อน ตามด้วย `deviceToken` ที่ระบุชัดเจน ตามด้วย device token ที่จัดเก็บไว้ แล้วจึงเป็น bootstrap token
    - บนเส้นทาง async ของ Tailscale Serve Control UI ความพยายามที่ล้มเหลวสำหรับ `{scope, ip}` เดียวกันจะถูกจัดลำดับก่อน limiter บันทึกความล้มเหลว ดังนั้นการ retry พร้อมกันที่ผิดสองครั้งจาก client เดียวกันอาจแสดง `retry later` ในครั้งที่สองแทน mismatch ธรรมดาสองครั้ง
    - `too many failed authentication attempts (retry later)` จาก client loopback ที่มี origin จากเบราว์เซอร์ → ความล้มเหลวซ้ำจาก `Origin` เดียวกันที่ normalize แล้วจะถูกล็อกชั่วคราว; origin localhost อื่นใช้ bucket แยก
    - `unauthorized` ซ้ำหลัง retry นั้น → shared token/device token drift; รีเฟรชการกำหนดค่า token และอนุมัติซ้ำ/หมุน device token หากจำเป็น
    - `gateway connect failed:` → เป้าหมาย host/port/url ผิด

  </Accordion>
</AccordionGroup>

### แผนที่ด่วนของรหัสรายละเอียด auth

ใช้ `error.details.code` จาก response `connect` ที่ล้มเหลวเพื่อเลือกการกระทำถัดไป:

| รหัสรายละเอียด                  | ความหมาย                                                                                                                                                                                      | การดำเนินการที่แนะนำ                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | ไคลเอนต์ไม่ได้ส่งโทเค็นที่ใช้ร่วมกันซึ่งจำเป็น                                                                                                                                                 | วาง/ตั้งค่าโทเค็นในไคลเอนต์แล้วลองอีกครั้ง สำหรับพาธแดชบอร์ด: `openclaw config get gateway.auth.token` จากนั้นวางลงในการตั้งค่า Control UI                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | โทเค็นที่ใช้ร่วมกันไม่ตรงกับโทเค็นยืนยันตัวตนของ gateway                                                                                                                                               | หาก `canRetryWithDeviceToken=true` ให้อนุญาตให้ลองใหม่แบบเชื่อถือได้หนึ่งครั้ง การลองใหม่ด้วยโทเค็นที่แคชไว้จะใช้ scope ที่อนุมัติและจัดเก็บไว้ซ้ำ ผู้เรียกที่ระบุ `deviceToken` / `scopes` ชัดเจนจะคง scope ที่ร้องขอไว้ หากยังล้มเหลว ให้รัน[เช็กลิสต์กู้คืน token drift](/th/cli/devices#token-drift-recovery-checklist) |
| `AUTH_DEVICE_TOKEN_MISMATCH` | โทเค็นรายอุปกรณ์ที่แคชไว้ล้าสมัยหรือถูกเพิกถอน                                                                                                                                                 | หมุนเวียน/อนุมัติโทเค็นอุปกรณ์อีกครั้งโดยใช้ [CLI อุปกรณ์](/th/cli/devices) จากนั้นเชื่อมต่อใหม่                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | โทเค็นอุปกรณ์ถูกต้อง แต่บทบาท/scope ที่อนุมัติไม่ครอบคลุมคำขอเชื่อมต่อนี้                                                                                                       | จับคู่อุปกรณ์ใหม่หรืออนุมัติสัญญา scope ที่ร้องขอ อย่าถือว่านี่เป็น shared-token drift                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | ตัวตนอุปกรณ์ต้องได้รับการอนุมัติ ตรวจสอบ `error.details.reason` สำหรับ `not-paired`, `scope-upgrade`, `role-upgrade` หรือ `metadata-upgrade` และใช้ `requestId` / `remediationHint` เมื่อมีอยู่ | อนุมัติคำขอที่รอดำเนินการ: `openclaw devices list` จากนั้น `openclaw devices approve <requestId>` การอัปเกรด scope/บทบาทใช้ flow เดียวกันหลังจากที่คุณตรวจสอบสิทธิ์เข้าถึงที่ร้องขอแล้ว                                                                                                               |

<Note>
RPC แบ็กเอนด์แบบลูปแบ็กโดยตรงที่ยืนยันตัวตนด้วยโทเค็น/รหัสผ่าน Gateway ที่ใช้ร่วมกันไม่ควรขึ้นกับ baseline scope ของอุปกรณ์ที่จับคู่ผ่าน CLI หาก subagent หรือการเรียกภายในอื่นๆ ยังล้มเหลวด้วย `scope-upgrade` ให้ตรวจสอบว่าผู้เรียกใช้ `client.id: "gateway-client"` และ `client.mode: "backend"` และไม่ได้บังคับ `deviceIdentity` หรือโทเค็นอุปกรณ์แบบชัดเจน
</Note>

การตรวจสอบการย้ายข้อมูล auth อุปกรณ์ v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

หาก log แสดงข้อผิดพลาด nonce/signature ให้อัปเดตไคลเอนต์ที่เชื่อมต่อและตรวจสอบดังนี้:

<Steps>
  <Step title="Wait for connect.challenge">
    ไคลเอนต์รอ `connect.challenge` ที่ Gateway ออกให้
  </Step>
  <Step title="Sign the payload">
    ไคลเอนต์ลงนาม payload ที่ผูกกับ challenge
  </Step>
  <Step title="Send the device nonce">
    ไคลเอนต์ส่ง `connect.params.device.nonce` พร้อม nonce ของ challenge เดียวกัน
  </Step>
</Steps>

หาก `openclaw devices rotate` / `revoke` / `remove` ถูกปฏิเสธโดยไม่คาดคิด:

- เซสชันโทเค็นอุปกรณ์ที่จับคู่สามารถจัดการได้เฉพาะอุปกรณ์ของ**ตนเอง**เท่านั้น เว้นแต่ผู้เรียกจะมี `operator.admin` ด้วย
- `openclaw devices rotate --scope ...` สามารถร้องขอ operator scope ได้เฉพาะที่เซสชันผู้เรียกมีอยู่แล้วเท่านั้น

ที่เกี่ยวข้อง:

- [การกำหนดค่า](/th/gateway/configuration) (โหมด auth ของ gateway)
- [Control UI](/th/web/control-ui)
- [อุปกรณ์](/th/cli/devices)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [auth พร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth)

## บริการ Gateway ไม่ทำงาน

ใช้กรณีนี้เมื่อมีการติดตั้งบริการแล้ว แต่กระบวนการไม่คงอยู่

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

มองหา:

- `Runtime: stopped` พร้อมคำใบ้ exit
- การกำหนดค่าบริการไม่ตรงกัน (`Config (cli)` เทียบกับ `Config (service)`)
- พอร์ต/listener ขัดแย้งกัน
- การติดตั้ง launchd/systemd/schtasks เพิ่มเติมเมื่อใช้ `--deep`
- คำใบ้ cleanup ของ `Other gateway-like services detected (best effort)`

<AccordionGroup>
  <Accordion title="Common signatures">
    - `Gateway start blocked: set gateway.mode=local` หรือ `existing config is missing gateway.mode` → ไม่ได้เปิดใช้งานโหมด gateway ภายในเครื่อง หรือไฟล์ config ถูกเขียนทับจนเสียและสูญเสีย `gateway.mode` วิธีแก้: ตั้งค่า `gateway.mode="local"` ใน config ของคุณ หรือรัน `openclaw onboard --mode local` / `openclaw setup` อีกครั้งเพื่อประทับ config โหมดภายในเครื่องที่คาดไว้ใหม่ หากคุณรัน OpenClaw ผ่าน Podman พาธ config เริ่มต้นคือ `~/.openclaw/openclaw.json`
    - `refusing to bind gateway ... without auth` → การ bind ที่ไม่ใช่ลูปแบ็กโดยไม่มีพาธ auth ของ gateway ที่ถูกต้อง (โทเค็น/รหัสผ่าน หรือ trusted-proxy เมื่อกำหนดค่าไว้)
    - `another gateway instance is already listening` / `EADDRINUSE` → พอร์ตขัดแย้ง
    - `Other gateway-like services detected (best effort)` → มีหน่วย launchd/systemd/schtasks ที่ค้างหรือทำงานขนานกันอยู่ การตั้งค่าส่วนใหญ่ควรมี gateway หนึ่งตัวต่อเครื่อง หากคุณจำเป็นต้องมีมากกว่าหนึ่งจริงๆ ให้แยกพอร์ต + config/state/workspace ดู [/gateway#multiple-gateways-same-host](/th/gateway#multiple-gateways-same-host)
    - `System-level OpenClaw gateway service detected` จาก doctor → มี unit ระดับระบบของ systemd อยู่ ขณะที่บริการระดับผู้ใช้หายไป ลบหรือปิดใช้งานรายการซ้ำก่อนอนุญาตให้ doctor ติดตั้งบริการผู้ใช้ หรือตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` หาก unit ระบบเป็น supervisor ที่ตั้งใจใช้
    - `Gateway service port does not match current gateway config` → supervisor ที่ติดตั้งไว้ยังคงตรึง `--port` เก่า รัน `openclaw doctor --fix` หรือ `openclaw gateway install --force` แล้วรีสตาร์ตบริการ gateway

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Background exec และเครื่องมือ process](/th/gateway/background-process)
- [การกำหนดค่า](/th/gateway/configuration)
- [Doctor](/th/gateway/doctor)

## Gateway ปฏิเสธ config ที่ไม่ถูกต้อง

ใช้กรณีนี้เมื่อการเริ่มต้น Gateway ล้มเหลวด้วย `Invalid config` หรือ log hot reload บอกว่า
ข้ามการแก้ไขที่ไม่ถูกต้อง

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
- ไฟล์ `openclaw.json.rejected.*` ที่มี timestamp ข้าง config ที่ใช้งานอยู่
- ไฟล์ `openclaw.json.clobbered.*` ที่มี timestamp หาก `doctor --fix` ซ่อมแซมการแก้ไขโดยตรงที่เสียหาย

<AccordionGroup>
  <Accordion title="What happened">
    - config ไม่ผ่านการตรวจสอบระหว่าง startup, hot reload หรือการเขียนที่ OpenClaw เป็นเจ้าของ
    - การเริ่มต้น Gateway ล้มเหลวแบบ fail closed แทนที่จะเขียน `openclaw.json` ใหม่
    - Hot reload ข้ามการแก้ไขภายนอกที่ไม่ถูกต้องและคง config runtime ปัจจุบันให้ใช้งานต่อ
    - การเขียนที่ OpenClaw เป็นเจ้าของจะปฏิเสธ payload ที่ไม่ถูกต้อง/ทำลายข้อมูลก่อน commit และบันทึก `.rejected.*`
    - `openclaw doctor --fix` เป็นเจ้าของการซ่อมแซม สามารถลบ prefix ที่ไม่ใช่ JSON หรือกู้คืนสำเนา last-known-good พร้อมเก็บ payload ที่ถูกปฏิเสธไว้เป็น `.clobbered.*`

  </Accordion>
  <Accordion title="Inspect and repair">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Common signatures">
    - มี `.clobbered.*` อยู่ → doctor เก็บการแก้ไขภายนอกที่เสียหายไว้ระหว่างซ่อมแซม config ที่ใช้งานอยู่
    - มี `.rejected.*` อยู่ → การเขียน config ที่ OpenClaw เป็นเจ้าของล้มเหลวในการตรวจ schema หรือ clobber ก่อน commit
    - `Config write rejected:` → การเขียนพยายามทิ้ง shape ที่จำเป็น ลดขนาดไฟล์อย่างมาก หรือ persist config ที่ไม่ถูกต้อง
    - `config reload skipped (invalid config):` → การแก้ไขโดยตรงไม่ผ่าน validation และถูก Gateway ที่กำลังรันอยู่เพิกเฉย
    - `Invalid config at ...` → startup ล้มเหลวก่อนที่บริการ Gateway จะบูต
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` หรือ `size-drop-vs-last-good:*` → การเขียนที่ OpenClaw เป็นเจ้าของถูกปฏิเสธเพราะสูญเสียฟิลด์หรือขนาดเมื่อเทียบกับ backup last-known-good
    - `Config last-known-good promotion skipped` → candidate มี placeholder ความลับที่ถูก redacted เช่น `***`

  </Accordion>
  <Accordion title="Fix options">
    1. รัน `openclaw doctor --fix` เพื่อให้ doctor ซ่อม config ที่มี prefix/ถูก clobber หรือกู้คืน last-known-good
    2. คัดลอกเฉพาะ key ที่ตั้งใจจาก `.clobbered.*` หรือ `.rejected.*` จากนั้นใช้กับ `openclaw config set` หรือ `config.patch`
    3. รัน `openclaw config validate` ก่อนรีสตาร์ต
    4. หากคุณแก้ไขด้วยมือ ให้คง config JSON5 แบบเต็มไว้ ไม่ใช่แค่อ็อบเจ็กต์บางส่วนที่คุณต้องการเปลี่ยน
  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Config](/th/cli/config)
- [การกำหนดค่า: hot reload](/th/gateway/configuration#config-hot-reload)
- [การกำหนดค่า: strict validation](/th/gateway/configuration#strict-validation)
- [Doctor](/th/gateway/doctor)

## คำเตือนของ probe Gateway

ใช้กรณีนี้เมื่อ `openclaw gateway probe` เข้าถึงบางอย่างได้ แต่ยังพิมพ์บล็อกคำเตือน

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

มองหา:

- `warnings[].code` และ `primaryTargetId` ในเอาต์พุต JSON
- คำเตือนเกี่ยวกับ SSH fallback, gateway หลายตัว, scope ที่ขาดหาย หรือ auth refs ที่แก้ไม่ได้หรือไม่

ลายเซ็นทั่วไป:

- `SSH tunnel failed to start; falling back to direct probes.` → การตั้งค่า SSH ล้มเหลว แต่คำสั่งยังลอง target ที่กำหนดค่าไว้/ลูปแบ็กโดยตรง
- `multiple reachable gateways detected` → มี target มากกว่าหนึ่งรายการตอบกลับ โดยปกติหมายถึงการตั้งค่า multi-gateway โดยตั้งใจ หรือ listener ที่ค้าง/ซ้ำ
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → เชื่อมต่อได้ แต่ RPC รายละเอียดถูกจำกัดด้วย scope จับคู่ตัวตนอุปกรณ์หรือใช้ credential ที่มี `operator.read`
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → เชื่อมต่อได้ แต่ชุด RPC วินิจฉัยเต็มหมดเวลาหรือล้มเหลว ให้ถือว่านี่คือ Gateway ที่เข้าถึงได้แต่ diagnostics ลดระดับลง เปรียบเทียบ `connect.ok` และ `connect.rpcOk` ในเอาต์พุต `--json`
- `Capability: pairing-pending` หรือ `gateway closed (1008): pairing required` → gateway ตอบกลับแล้ว แต่ไคลเอนต์นี้ยังต้องจับคู่/อนุมัติก่อนเข้าถึงแบบ operator ปกติ
- ข้อความคำเตือน SecretRef ของ `gateway.auth.*` / `gateway.remote.*` ที่แก้ไม่ได้ → วัสดุ auth ไม่พร้อมใช้งานในพาธคำสั่งนี้สำหรับ target ที่ล้มเหลว

ที่เกี่ยวข้อง:

- [Gateway](/th/cli/gateway)
- [Gateway หลายรายการบนโฮสต์เดียวกัน](/th/gateway#multiple-gateways-same-host)
- [การเข้าถึงระยะไกล](/th/gateway/remote)

## เชื่อมต่อช่องทางแล้ว แต่ข้อความไม่ไหล

หากสถานะช่องทางเชื่อมต่ออยู่ แต่การไหลของข้อความหยุดทำงาน ให้มุ่งเน้นที่นโยบาย สิทธิ์ และกฎการส่งเฉพาะของช่องทาง

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
- สิทธิ์/ขอบเขต API ของช่องทางที่ขาดหายไป

ลักษณะที่พบบ่อย:

- `mention required` → ข้อความถูกละเว้นโดยนโยบายการกล่าวถึงของกลุ่ม
- ร่องรอย `pairing` / การอนุมัติที่รอดำเนินการ → ผู้ส่งยังไม่ได้รับการอนุมัติ
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → ปัญหาการยืนยันตัวตน/สิทธิ์ของช่องทาง

ที่เกี่ยวข้อง:

- [การแก้ปัญหาช่องทาง](/th/channels/troubleshooting)
- [Discord](/th/channels/discord)
- [Telegram](/th/channels/telegram)
- [WhatsApp](/th/channels/whatsapp)

## การส่ง Cron และ Heartbeat

หาก Cron หรือ Heartbeat ไม่ทำงานหรือไม่ส่ง ให้ตรวจสอบสถานะตัวจัดกำหนดการก่อน จากนั้นตรวจสอบเป้าหมายการส่ง

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

ตรวจหา:

- Cron เปิดใช้งานอยู่และมีเวลาปลุกครั้งถัดไป
- สถานะประวัติการรันงาน (`ok`, `skipped`, `error`)
- เหตุผลที่ข้าม Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`)

<AccordionGroup>
  <Accordion title="ลักษณะที่พบบ่อย">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron ถูกปิดใช้งาน
    - `cron: timer tick failed` → การเดินจังหวะของตัวจัดกำหนดการล้มเหลว ให้ตรวจสอบข้อผิดพลาดในไฟล์/ล็อก/รันไทม์
    - `heartbeat skipped` พร้อม `reason=quiet-hours` → อยู่นอกช่วงเวลาทำงาน
    - `heartbeat skipped` พร้อม `reason=empty-heartbeat-file` → `HEARTBEAT.md` มีอยู่แต่มีเพียงบรรทัดว่าง / หัวข้อ Markdown ดังนั้น OpenClaw จึงข้ามการเรียกโมเดล
    - `heartbeat skipped` พร้อม `reason=no-tasks-due` → `HEARTBEAT.md` มีบล็อก `tasks:` แต่ไม่มีงานใดถึงกำหนดในจังหวะนี้
    - `heartbeat: unknown accountId` → ID บัญชีไม่ถูกต้องสำหรับเป้าหมายการส่ง Heartbeat
    - `heartbeat skipped` พร้อม `reason=dm-blocked` → เป้าหมาย Heartbeat ถูกแปลงเป็นปลายทางแบบ DM ในขณะที่ `agents.defaults.heartbeat.directPolicy` (หรือการแทนที่รายเอเจนต์) ถูกตั้งเป็น `block`

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Heartbeat](/th/gateway/heartbeat)
- [งานตามกำหนดเวลา](/th/automation/cron-jobs)
- [งานตามกำหนดเวลา: การแก้ปัญหา](/th/automation/cron-jobs#troubleshooting)

## จับคู่ Node แล้ว แต่เครื่องมือล้มเหลว

หากจับคู่ Node แล้วแต่เครื่องมือล้มเหลว ให้แยกสถานะเบื้องหน้า สิทธิ์ และการอนุมัติออกจากกัน

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

ตรวจหา:

- Node ออนไลน์พร้อมความสามารถที่คาดไว้
- การให้สิทธิ์ของ OS สำหรับกล้อง/ไมโครโฟน/ตำแหน่ง/หน้าจอ
- การอนุมัติ Exec และสถานะรายการอนุญาต

ลักษณะที่พบบ่อย:

- `NODE_BACKGROUND_UNAVAILABLE` → แอป Node ต้องอยู่เบื้องหน้า
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → ขาดสิทธิ์ของ OS
- `SYSTEM_RUN_DENIED: approval required` → การอนุมัติ Exec รอดำเนินการ
- `SYSTEM_RUN_DENIED: allowlist miss` → คำสั่งถูกบล็อกโดยรายการอนุญาต

ที่เกี่ยวข้อง:

- [การอนุมัติ Exec](/th/tools/exec-approvals)
- [การแก้ปัญหา Node](/th/nodes/troubleshooting)
- [Nodes](/th/nodes/index)

## เครื่องมือเบราว์เซอร์ล้มเหลว

ใช้ส่วนนี้เมื่อการทำงานของเครื่องมือเบราว์เซอร์ล้มเหลว แม้ตัว Gateway เองจะปกติดี

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

ตรวจหา:

- ว่า `plugins.allow` ถูกตั้งค่าไว้และรวม `browser` หรือไม่
- พาธไฟล์ปฏิบัติการของเบราว์เซอร์ถูกต้อง
- การเข้าถึงโปรไฟล์ CDP ได้
- Chrome ในเครื่องพร้อมใช้งานสำหรับโปรไฟล์ `existing-session` / `user`

<AccordionGroup>
  <Accordion title="ลักษณะของ Plugin / ไฟล์ปฏิบัติการ">
    - `unknown command "browser"` หรือ `unknown command 'browser'` → Plugin เบราว์เซอร์ที่มาพร้อมกันถูกยกเว้นโดย `plugins.allow`
    - เครื่องมือเบราว์เซอร์หายไป / ไม่พร้อมใช้งานในขณะที่ `browser.enabled=true` → `plugins.allow` ยกเว้น `browser` ดังนั้น Plugin จึงไม่เคยถูกโหลด
    - `Failed to start Chrome CDP on port` → กระบวนการเบราว์เซอร์เปิดไม่สำเร็จ
    - `browser.executablePath not found` → พาธที่กำหนดค่าไว้ไม่ถูกต้อง
    - `browser.cdpUrl must be http(s) or ws(s)` → URL CDP ที่กำหนดค่าไว้ใช้ scheme ที่ไม่รองรับ เช่น `file:` หรือ `ftp:`
    - `browser.cdpUrl has invalid port` → URL CDP ที่กำหนดค่าไว้มีพอร์ตไม่ถูกต้องหรืออยู่นอกช่วง
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → การติดตั้ง Gateway ปัจจุบันไม่มี dependency รันไทม์เบราว์เซอร์หลัก ให้ติดตั้งใหม่หรืออัปเดต OpenClaw แล้วรีสตาร์ท Gateway สแนปช็อต ARIA และภาพหน้าจอพื้นฐานของหน้ายังทำงานได้ แต่การนำทาง สแนปช็อต AI ภาพหน้าจอองค์ประกอบด้วยตัวเลือก CSS และการส่งออก PDF ยังไม่พร้อมใช้งาน

  </Accordion>
  <Accordion title="ลักษณะของ Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → existing-session ของ Chrome MCP ยังแนบกับไดเรกทอรีข้อมูลเบราว์เซอร์ที่เลือกไม่ได้ เปิดหน้าตรวจสอบของเบราว์เซอร์ เปิดใช้งานการดีบักระยะไกล เปิดเบราว์เซอร์ค้างไว้ อนุมัติพรอมป์การแนบครั้งแรก แล้วลองอีกครั้ง หากไม่จำเป็นต้องมีสถานะลงชื่อเข้าใช้ ให้ใช้โปรไฟล์ `openclaw` ที่จัดการให้แทน
    - `No Chrome tabs found for profile="user"` → โปรไฟล์แนบของ Chrome MCP ไม่มีแท็บ Chrome ในเครื่องที่เปิดอยู่
    - `Remote CDP for profile "<name>" is not reachable` → Endpoint CDP ระยะไกลที่กำหนดค่าไว้เข้าถึงไม่ได้จากโฮสต์ Gateway
    - `Browser attachOnly is enabled ... not reachable` หรือ `Browser attachOnly is enabled and CDP websocket ... is not reachable` → โปรไฟล์แบบแนบอย่างเดียวไม่มีเป้าหมายที่เข้าถึงได้ หรือ endpoint HTTP ตอบกลับแล้วแต่ CDP WebSocket ยังเปิดไม่ได้

  </Accordion>
  <Accordion title="ลักษณะขององค์ประกอบ / ภาพหน้าจอ / การอัปโหลด">
    - `fullPage is not supported for element screenshots` → คำขอภาพหน้าจอผสม `--full-page` กับ `--ref` หรือ `--element`
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → การเรียกภาพหน้าจอของ Chrome MCP / `existing-session` ต้องใช้การจับภาพหน้าเว็บหรือ `--ref` ของสแนปช็อต ไม่ใช่ CSS `--element`
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hook การอัปโหลดของ Chrome MCP ต้องใช้ ref ของสแนปช็อต ไม่ใช่ตัวเลือก CSS
    - `existing-session file uploads currently support one file at a time.` → ส่งการอัปโหลดหนึ่งไฟล์ต่อหนึ่งการเรียกบนโปรไฟล์ Chrome MCP
    - `existing-session dialog handling does not support timeoutMs.` → hook กล่องโต้ตอบบนโปรไฟล์ Chrome MCP ไม่รองรับการแทนที่ timeout
    - `existing-session type does not support timeoutMs overrides.` → ละ `timeoutMs` สำหรับ `act:type` บนโปรไฟล์ `profile="user"` / existing-session ของ Chrome MCP หรือใช้โปรไฟล์เบราว์เซอร์ที่จัดการให้/CDP เมื่อจำเป็นต้องใช้ timeout แบบกำหนดเอง
    - `existing-session evaluate does not support timeoutMs overrides.` → ละ `timeoutMs` สำหรับ `act:evaluate` บนโปรไฟล์ `profile="user"` / existing-session ของ Chrome MCP หรือใช้โปรไฟล์เบราว์เซอร์ที่จัดการให้/CDP เมื่อจำเป็นต้องใช้ timeout แบบกำหนดเอง
    - `response body is not supported for existing-session profiles yet.` → `responsebody` ยังต้องใช้เบราว์เซอร์ที่จัดการให้หรือโปรไฟล์ CDP ดิบ
    - การแทนที่ viewport / dark-mode / locale / offline ที่ค้างอยู่บนโปรไฟล์แบบแนบอย่างเดียวหรือ CDP ระยะไกล → รัน `openclaw browser stop --browser-profile <name>` เพื่อปิดเซสชันควบคุมที่ทำงานอยู่และปล่อยสถานะการจำลองของ Playwright/CDP โดยไม่ต้องรีสตาร์ท Gateway ทั้งหมด

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [เบราว์เซอร์ (จัดการโดย OpenClaw)](/th/tools/browser)
- [การแก้ปัญหาเบราว์เซอร์](/th/tools/browser-linux-troubleshooting)

## หากคุณอัปเกรดแล้วบางอย่างเสียกะทันหัน

ปัญหาส่วนใหญ่หลังอัปเกรดมาจาก config ที่คลาดเคลื่อน หรือค่าเริ่มต้นที่เข้มงวดขึ้นซึ่งตอนนี้ถูกบังคับใช้แล้ว

<AccordionGroup>
  <Accordion title="1. พฤติกรรมการยืนยันตัวตนและการแทนที่ URL เปลี่ยนไป">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    สิ่งที่ต้องตรวจสอบ:

    - หาก `gateway.mode=remote` การเรียก CLI อาจกำลังมุ่งไปที่ระยะไกล ในขณะที่บริการในเครื่องของคุณยังปกติดี
    - การเรียก `--url` แบบชัดเจนจะไม่ย้อนกลับไปใช้ข้อมูลประจำตัวที่บันทึกไว้

    ลักษณะที่พบบ่อย:

    - `gateway connect failed:` → เป้าหมาย URL ผิด
    - `unauthorized` → endpoint เข้าถึงได้แต่การยืนยันตัวตนผิด

  </Accordion>
  <Accordion title="2. ข้อป้องกันสำหรับ bind และ auth เข้มงวดขึ้น">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    สิ่งที่ต้องตรวจสอบ:

    - การ bind ที่ไม่ใช่ loopback (`lan`, `tailnet`, `custom`) ต้องมีพาธการยืนยันตัวตน Gateway ที่ถูกต้อง: การยืนยันตัวตนด้วยโทเค็น/รหัสผ่านที่ใช้ร่วมกัน หรือการ deploy `trusted-proxy` แบบไม่ใช่ loopback ที่กำหนดค่าไว้อย่างถูกต้อง
    - คีย์เก่าอย่าง `gateway.token` ไม่ได้แทนที่ `gateway.auth.token`

    ลักษณะที่พบบ่อย:

    - `refusing to bind gateway ... without auth` → bind แบบไม่ใช่ loopback โดยไม่มีพาธการยืนยันตัวตน Gateway ที่ถูกต้อง
    - `Connectivity probe: failed` ในขณะที่รันไทม์กำลังทำงาน → Gateway ยังทำงานอยู่แต่เข้าถึงไม่ได้ด้วย auth/url ปัจจุบัน

  </Accordion>
  <Accordion title="3. สถานะการจับคู่และตัวตนอุปกรณ์เปลี่ยนไป">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    สิ่งที่ต้องตรวจสอบ:

    - การอนุมัติอุปกรณ์ที่รอดำเนินการสำหรับแดชบอร์ด/โหนด
    - การอนุมัติการจับคู่ DM ที่รอดำเนินการหลังจากเปลี่ยนนโยบายหรือตัวตน

    ลักษณะที่พบบ่อย:

    - `device identity required` → การยืนยันตัวตนอุปกรณ์ยังไม่เป็นไปตามข้อกำหนด
    - `pairing required` → ผู้ส่ง/อุปกรณ์ต้องได้รับการอนุมัติ

  </Accordion>
</AccordionGroup>

หาก config ของบริการและรันไทม์ยังไม่ตรงกันหลังตรวจสอบแล้ว ให้ติดตั้ง metadata ของบริการใหม่จากไดเรกทอรีโปรไฟล์/สถานะเดียวกัน:

```bash
openclaw gateway install --force
openclaw gateway restart
```

ที่เกี่ยวข้อง:

- [การยืนยันตัวตน](/th/gateway/authentication)
- [Exec เบื้องหลังและเครื่องมือกระบวนการ](/th/gateway/background-process)
- [การจับคู่ที่ Gateway เป็นเจ้าของ](/th/gateway/pairing)

## ที่เกี่ยวข้อง

- [Doctor](/th/gateway/doctor)
- [FAQ](/th/help/faq)
- [รันบุ๊ก Gateway](/th/gateway)
