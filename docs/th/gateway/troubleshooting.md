---
read_when:
    - ศูนย์รวมการแก้ไขปัญหาได้นำคุณมาที่นี่เพื่อการวินิจฉัยเชิงลึกเพิ่มเติม
    - คุณต้องมีส่วนของคู่มือปฏิบัติการที่อิงตามอาการอย่างคงที่ พร้อมคำสั่งที่แน่นอน
sidebarTitle: Troubleshooting
summary: คู่มือปฏิบัติการแก้ไขปัญหาเชิงลึกสำหรับ Gateway, ช่องทาง, ระบบอัตโนมัติ, โหนด และเบราว์เซอร์
title: การแก้ไขปัญหา
x-i18n:
    generated_at: "2026-05-10T19:41:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 798016211b615242abca327295c76223ff2dfd3d83dc8a08e396d9e65b9efed4
    source_path: gateway/troubleshooting.md
    workflow: 16
---

หน้านี้คือ runbook เชิงลึก เริ่มที่ [/help/troubleshooting](/th/help/troubleshooting) หากต้องการโฟลว์การคัดแยกปัญหาแบบรวดเร็วก่อน

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
- `openclaw doctor` รายงานว่าไม่มีปัญหาคอนฟิก/บริการที่เป็นตัวบล็อก
- `openclaw channels status --probe` แสดงสถานะทรานสปอร์ตแบบสดแยกตามบัญชี และเมื่อรองรับ จะแสดงผลการ probe/audit เช่น `works` หรือ `audit ok`

## การติดตั้งแบบ split brain และตัวป้องกันคอนฟิกที่ใหม่กว่า

ใช้ส่วนนี้เมื่อบริการ Gateway หยุดโดยไม่คาดคิดหลังอัปเดต หรือ log แสดงว่าไบนารี `openclaw` หนึ่งตัวเก่ากว่าเวอร์ชันที่เขียน `openclaw.json` ครั้งล่าสุด

OpenClaw ประทับตราการเขียนคอนฟิกด้วย `meta.lastTouchedVersion` คำสั่งแบบอ่านอย่างเดียวยังสามารถตรวจสอบคอนฟิกที่เขียนโดย OpenClaw ที่ใหม่กว่าได้ แต่การเปลี่ยนแปลง process และบริการจะปฏิเสธไม่ดำเนินต่อจากไบนารีที่เก่ากว่า การกระทำที่ถูกบล็อก ได้แก่ การเริ่ม หยุด รีสตาร์ต ถอนการติดตั้ง บังคับติดตั้งบริการใหม่ การเริ่ม Gateway ในโหมดบริการ และการล้างพอร์ตด้วย `gateway --force`

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    แก้ `PATH` ให้ `openclaw` ชี้ไปยังการติดตั้งที่ใหม่กว่า จากนั้นรันการกระทำนั้นอีกครั้ง
  </Step>
  <Step title="Reinstall the gateway service">
    ติดตั้งบริการ Gateway ที่ต้องการใหม่จากการติดตั้งที่ใหม่กว่า:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    ลบแพ็กเกจระบบหรือรายการ wrapper เก่าที่ยังคงชี้ไปยังไบนารี `openclaw` ตัวเก่า
  </Step>
</Steps>

<Warning>
สำหรับการดาวน์เกรดโดยตั้งใจหรือการกู้คืนฉุกเฉินเท่านั้น ให้ตั้ง `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` สำหรับคำสั่งเดียว ปล่อยให้ไม่ได้ตั้งค่าสำหรับการใช้งานปกติ
</Warning>

## Skill symlink ถูกข้ามเนื่องจากออกนอก path

ใช้ส่วนนี้เมื่อ log มีข้อความ:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw ถือว่า skill root ทุกแห่งเป็นขอบเขตการกักกัน symlink ภายใต้
`~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` หรือ
`~/.openclaw/skills` จะถูกข้ามเมื่อ target จริง resolve ออกนอก root นั้น
เว้นแต่ target จะถูก trust อย่างชัดเจน

ตรวจสอบลิงก์:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

หาก target เป็นสิ่งที่ตั้งใจไว้ ให้คอนฟิกทั้ง skill root โดยตรงและ
symlink target ที่อนุญาต:

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

จากนั้นเริ่ม session ใหม่หรือรอให้ตัวเฝ้าดู Skills รีเฟรช รีสตาร์ต
Gateway หาก process ที่กำลังรันอยู่เกิดขึ้นก่อนการเปลี่ยนคอนฟิก

อย่าใช้ target แบบกว้าง เช่น `~`, `/` หรือโฟลเดอร์โปรเจกต์ที่ซิงก์ทั้งโฟลเดอร์
ให้จำกัด `allowSymlinkTargets` อยู่ที่ skill root จริงที่มีไดเรกทอรี
`SKILL.md` ที่ trusted

ที่เกี่ยวข้อง:

- [คอนฟิก Skills](/th/tools/skills-config#symlinked-sibling-repos)
- [ตัวอย่างคอนฟิก](/th/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 ต้องใช้ usage เพิ่มเติมสำหรับ context ยาว

ใช้ส่วนนี้เมื่อ log/ข้อผิดพลาดมี: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

มองหา:

- โมเดล Anthropic Opus/Sonnet ที่เลือกมี `params.context1m: true`
- credential ของ Anthropic ปัจจุบันไม่มีสิทธิ์ใช้ long-context
- request ล้มเหลวเฉพาะกับ session/model run ที่ยาวและต้องใช้เส้นทาง 1M beta

ตัวเลือกการแก้ไข:

<Steps>
  <Step title="Disable context1m">
    ปิดใช้ `context1m` สำหรับโมเดลนั้นเพื่อ fallback ไปยัง context window ปกติ
  </Step>
  <Step title="Use an eligible credential">
    ใช้ credential ของ Anthropic ที่มีสิทธิ์สำหรับ long-context request หรือสลับไปใช้ Anthropic API key
  </Step>
  <Step title="Configure fallback models">
    คอนฟิก fallback models เพื่อให้ run ดำเนินต่อเมื่อ request long-context ของ Anthropic ถูกปฏิเสธ
  </Step>
</Steps>

ที่เกี่ยวข้อง:

- [Anthropic](/th/providers/anthropic)
- [การใช้ token และค่าใช้จ่าย](/th/reference/token-use)
- [ทำไมฉันจึงเห็น HTTP 429 จาก Anthropic?](/th/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## backend แบบ local ที่เข้ากันได้กับ OpenAI ผ่าน probe โดยตรง แต่ agent run ล้มเหลว

ใช้ส่วนนี้เมื่อ:

- `curl ... /v1/models` ใช้งานได้
- การเรียก `/v1/chat/completions` โดยตรงขนาดเล็กใช้งานได้
- OpenClaw model run ล้มเหลวเฉพาะใน agent turn ปกติ

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

มองหา:

- การเรียกโดยตรงขนาดเล็กสำเร็จ แต่ OpenClaw run ล้มเหลวเฉพาะกับ prompt ที่ใหญ่กว่า
- ข้อผิดพลาด `model_not_found` หรือ 404 แม้ว่า `/v1/chat/completions` โดยตรง
  จะใช้งานได้ด้วย bare model id เดียวกัน
- ข้อผิดพลาดจาก backend ว่า `messages[].content` คาดหวัง string
- คำเตือน `incomplete turn detected ... stopReason=stop payloads=0` เป็นครั้งคราวกับ backend แบบ local ที่เข้ากันได้กับ OpenAI
- backend crash ที่เกิดขึ้นเฉพาะกับจำนวน prompt-token ที่มากขึ้นหรือ prompt runtime ของ agent แบบเต็ม

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` กับเซิร์ฟเวอร์ local แบบ MLX/vLLM → ตรวจสอบว่า `baseUrl` มี `/v1`, `api` เป็น `"openai-completions"` สำหรับ backend `/v1/chat/completions` และ `models.providers.<provider>.models[].id` เป็น bare provider-local id เลือกด้วย prefix ของ provider หนึ่งครั้ง เช่น `mlx/mlx-community/Qwen3-30B-A3B-6bit`; เก็บรายการ catalog เป็น `mlx-community/Qwen3-30B-A3B-6bit`
    - `messages[...].content: invalid type: sequence, expected a string` → backend ปฏิเสธ structured Chat Completions content parts วิธีแก้: ตั้ง `models.providers.<provider>.models[].compat.requiresStringContent: true`
    - `validation.keys` หรือ message keys ที่อนุญาต เช่น `["role","content"]` → backend ปฏิเสธ replay metadata แบบ OpenAI-style บนข้อความ Chat Completions วิธีแก้: ตั้ง `models.providers.<provider>.models[].compat.strictMessageKeys: true`
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend ทำ request Chat Completions เสร็จแล้ว แต่ไม่ส่งข้อความ assistant ที่ผู้ใช้มองเห็นสำหรับ turn นั้น OpenClaw จะ retry empty OpenAI-compatible turn ที่ replay ได้อย่างปลอดภัยหนึ่งครั้ง ความล้มเหลวที่ยังคงเกิดมักหมายความว่า backend กำลังส่งเนื้อหาว่าง/ไม่ใช่ข้อความ หรือระงับข้อความ final-answer
    - request โดยตรงขนาดเล็กสำเร็จ แต่ OpenClaw agent run ล้มเหลวพร้อม backend/model crash (เช่น Gemma บนบาง build ของ `inferrs`) → OpenClaw transport น่าจะถูกต้องแล้ว; backend กำลังล้มเหลวกับรูปทรง prompt ของ agent-runtime ที่ใหญ่กว่า
    - ความล้มเหลวลดลงหลังปิดใช้ tools แต่ไม่หายไป → tool schemas เป็นส่วนหนึ่งของแรงกดดัน แต่ปัญหาที่เหลือยังคงเป็นความจุของโมเดล/เซิร์ฟเวอร์ upstream หรือบั๊กของ backend

  </Accordion>
  <Accordion title="Fix options">
    1. ตั้ง `compat.requiresStringContent: true` สำหรับ backend Chat Completions ที่รองรับ string เท่านั้น
    2. ตั้ง `compat.strictMessageKeys: true` สำหรับ backend Chat Completions ที่เข้มงวดและยอมรับเฉพาะ `role` และ `content` ในแต่ละ message
    3. ตั้ง `compat.supportsTools: false` สำหรับโมเดล/backend ที่ไม่สามารถจัดการพื้นผิว tool schema ของ OpenClaw ได้อย่างเสถียร
    4. ลดแรงกดดันของ prompt เมื่อทำได้: workspace bootstrap ที่เล็กลง, session history ที่สั้นลง, local model ที่เบาลง หรือ backend ที่รองรับ long-context ได้ดีกว่า
    5. หาก request โดยตรงขนาดเล็กยังผ่าน แต่ OpenClaw agent turn ยัง crash ภายใน backend ให้ถือว่าเป็นข้อจำกัดของเซิร์ฟเวอร์/โมเดล upstream และเปิด repro ที่นั่นพร้อมรูปทรง payload ที่ยอมรับได้
  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [คอนฟิก](/th/gateway/configuration)
- [โมเดล local](/th/gateway/local-models)
- [endpoint ที่เข้ากันได้กับ OpenAI](/th/gateway/configuration-reference#openai-compatible-endpoints)

## ไม่มีการตอบกลับ

หาก channel พร้อมใช้งานแต่ไม่มีสิ่งใดตอบ ให้ตรวจสอบ routing และ policy ก่อนเชื่อมต่อสิ่งใดใหม่

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

มองหา:

- การจับคู่ที่ pending สำหรับผู้ส่ง DM
- การ gating การ mention ในกลุ่ม (`requireMention`, `mentionPatterns`)
- ความไม่ตรงกันของ allowlist ของ channel/group

สัญญาณที่พบบ่อย:

- `drop guild message (mention required` → ข้อความกลุ่มถูกละเว้นจนกว่าจะมีการ mention
- `pairing request` → ผู้ส่งต้องได้รับอนุมัติ
- `blocked` / `allowlist` → ผู้ส่ง/channel ถูกกรองโดย policy

ที่เกี่ยวข้อง:

- [การแก้ปัญหา channel](/th/channels/troubleshooting)
- [กลุ่ม](/th/channels/groups)
- [การจับคู่](/th/channels/pairing)

## การเชื่อมต่อ UI ควบคุมแดชบอร์ด

เมื่อ dashboard/control UI ไม่เชื่อมต่อ ให้ตรวจสอบ URL, auth mode และสมมติฐานเรื่อง secure context

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

มองหา:

- probe URL และ dashboard URL ที่ถูกต้อง
- auth mode/token ไม่ตรงกันระหว่าง client และ Gateway
- การใช้ HTTP ในจุดที่ต้องใช้ device identity

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → context ไม่ปลอดภัยหรือไม่มี device auth
    - `origin not allowed` → browser `Origin` ไม่อยู่ใน `gateway.controlUi.allowedOrigins` (หรือคุณกำลังเชื่อมต่อจาก browser origin ที่ไม่ใช่ loopback โดยไม่มี allowlist ที่ชัดเจน)
    - `device nonce required` / `device nonce mismatch` → client ไม่ได้ทำ challenge-based device auth flow ให้เสร็จ (`connect.challenge` + `device.nonce`)
    - `device signature invalid` / `device signature expired` → client ลงนาม payload ผิด (หรือ timestamp เก่า) สำหรับ handshake ปัจจุบัน
    - `AUTH_TOKEN_MISMATCH` พร้อม `canRetryWithDeviceToken=true` → client สามารถ retry แบบ trusted หนึ่งครั้งด้วย device token ที่ cache ไว้
    - การ retry ด้วย cached-token นั้นใช้ cached scope set ที่เก็บไว้กับ paired device token ซ้ำ ผู้เรียกแบบ explicit `deviceToken` / explicit `scopes` จะคง scope set ที่ร้องขอไว้แทน
    - นอกเส้นทาง retry นั้น ลำดับความสำคัญของ connect auth คือ explicit shared token/password ก่อน จากนั้น explicit `deviceToken` จากนั้น stored device token และสุดท้าย bootstrap token
    - บนเส้นทาง async Tailscale Serve Control UI ความพยายามที่ล้มเหลวสำหรับ `{scope, ip}` เดียวกันจะถูก serialize ก่อนที่ limiter จะบันทึกความล้มเหลว ดังนั้นการ retry พร้อมกันผิดสองครั้งจาก client เดียวกันอาจแสดง `retry later` ในครั้งที่สองแทน mismatch ธรรมดาสองครั้ง
    - `too many failed authentication attempts (retry later)` จาก browser-origin loopback client → ความล้มเหลวซ้ำจาก `Origin` เดียวกันที่ normalize แล้วจะถูก lock out ชั่วคราว; localhost origin อื่นใช้ bucket แยกต่างหาก
    - `unauthorized` ซ้ำหลัง retry นั้น → shared token/device token drift; รีเฟรชคอนฟิก token และอนุมัติใหม่/rotate device token หากจำเป็น
    - `gateway connect failed:` → host/port/url target ผิด

  </Accordion>
</AccordionGroup>

### แผนที่ย่อ auth detail codes

ใช้ `error.details.code` จาก response `connect` ที่ล้มเหลวเพื่อเลือกการกระทำถัดไป:

| รหัสรายละเอียด                  | ความหมาย                                                                                                                                                                                      | การดำเนินการที่แนะนำ                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | ไคลเอนต์ไม่ได้ส่งโทเค็นที่ใช้ร่วมกันซึ่งจำเป็นมา                                                                                                                                                 | วาง/ตั้งค่าโทเค็นในไคลเอนต์แล้วลองใหม่ สำหรับเส้นทางแดชบอร์ด: `openclaw config get gateway.auth.token` จากนั้นวางลงในการตั้งค่า UI ควบคุม                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | โทเค็นที่ใช้ร่วมกันไม่ตรงกับโทเค็นยืนยันตัวตนของ Gateway                                                                                                                                               | หาก `canRetryWithDeviceToken=true` ให้อนุญาตให้ลองใหม่แบบเชื่อถือได้หนึ่งครั้ง การลองใหม่ด้วยโทเค็นที่แคชไว้จะใช้ขอบเขตที่อนุมัติและจัดเก็บไว้ซ้ำ ผู้เรียกที่ระบุ `deviceToken` / `scopes` อย่างชัดเจนจะคงขอบเขตที่ร้องขอไว้ หากยังล้มเหลว ให้เรียกใช้ [รายการตรวจสอบการกู้คืน token drift](/th/cli/devices#token-drift-recovery-checklist) |
| `AUTH_DEVICE_TOKEN_MISMATCH` | โทเค็นต่ออุปกรณ์ที่แคชไว้ล้าสมัยหรือถูกเพิกถอน                                                                                                                                                 | หมุนเวียน/อนุมัติโทเค็นอุปกรณ์ใหม่โดยใช้ [devices CLI](/th/cli/devices) จากนั้นเชื่อมต่อใหม่                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | ตัวตนอุปกรณ์ต้องได้รับการอนุมัติ ตรวจสอบ `error.details.reason` สำหรับ `not-paired`, `scope-upgrade`, `role-upgrade` หรือ `metadata-upgrade` และใช้ `requestId` / `remediationHint` เมื่อมีให้ | อนุมัติคำขอที่รอดำเนินการ: `openclaw devices list` จากนั้น `openclaw devices approve <requestId>` การอัปเกรดขอบเขต/บทบาทใช้ขั้นตอนเดียวกันหลังจากที่คุณตรวจสอบการเข้าถึงที่ร้องขอแล้ว                                                                                                               |

<Note>
RPC ของแบ็กเอนด์ loopback โดยตรงที่ยืนยันตัวตนด้วยโทเค็น/รหัสผ่าน Gateway ที่ใช้ร่วมกันไม่ควรขึ้นกับค่าพื้นฐานขอบเขตอุปกรณ์ที่จับคู่ของ CLI หาก subagent หรือการเรียกภายในอื่น ๆ ยังล้มเหลวด้วย `scope-upgrade` ให้ตรวจสอบว่าผู้เรียกใช้ `client.id: "gateway-client"` และ `client.mode: "backend"` และไม่ได้บังคับใช้ `deviceIdentity` หรือโทเค็นอุปกรณ์อย่างชัดเจน
</Note>

การตรวจสอบการย้ายข้อมูลการยืนยันตัวตนอุปกรณ์ v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

หากบันทึกแสดงข้อผิดพลาด nonce/signature ให้อัปเดตไคลเอนต์ที่เชื่อมต่อและตรวจสอบดังนี้:

<Steps>
  <Step title="รอ connect.challenge">
    ไคลเอนต์รอ `connect.challenge` ที่ Gateway ออกให้
  </Step>
  <Step title="ลงนาม payload">
    ไคลเอนต์ลงนาม payload ที่ผูกกับ challenge
  </Step>
  <Step title="ส่ง nonce ของอุปกรณ์">
    ไคลเอนต์ส่ง `connect.params.device.nonce` พร้อม nonce ของ challenge เดียวกัน
  </Step>
</Steps>

หาก `openclaw devices rotate` / `revoke` / `remove` ถูกปฏิเสธโดยไม่คาดคิด:

- เซสชันโทเค็นอุปกรณ์ที่จับคู่สามารถจัดการได้เฉพาะอุปกรณ์ **ของตนเอง** เท่านั้น เว้นแต่ผู้เรียกจะมี `operator.admin` ด้วย
- `openclaw devices rotate --scope ...` สามารถร้องขอได้เฉพาะขอบเขต operator ที่เซสชันผู้เรียกมีอยู่แล้วเท่านั้น

ที่เกี่ยวข้อง:

- [การกำหนดค่า](/th/gateway/configuration) (โหมดการยืนยันตัวตนของ Gateway)
- [UI ควบคุม](/th/web/control-ui)
- [อุปกรณ์](/th/cli/devices)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [การยืนยันตัวตนพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth)

## บริการ Gateway ไม่ได้ทำงานอยู่

ใช้ส่วนนี้เมื่อบริการติดตั้งแล้วแต่กระบวนการไม่ทำงานต่อเนื่อง

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

มองหา:

- `Runtime: stopped` พร้อมคำใบ้รหัสออก
- การกำหนดค่าบริการไม่ตรงกัน (`Config (cli)` เทียบกับ `Config (service)`)
- ความขัดแย้งของพอร์ต/ตัวรับฟัง
- การติดตั้ง launchd/systemd/schtasks เพิ่มเติมเมื่อใช้ `--deep`
- คำใบ้การล้างข้อมูล `Other gateway-like services detected (best effort)`

<AccordionGroup>
  <Accordion title="ลายเซ็นที่พบบ่อย">
    - `Gateway start blocked: set gateway.mode=local` หรือ `existing config is missing gateway.mode` → โหมด Gateway แบบ local ไม่ได้เปิดใช้งาน หรือไฟล์กำหนดค่าถูกเขียนทับและสูญเสีย `gateway.mode` วิธีแก้: ตั้งค่า `gateway.mode="local"` ในการกำหนดค่าของคุณ หรือเรียกใช้ `openclaw onboard --mode local` / `openclaw setup` อีกครั้งเพื่อประทับค่าการกำหนดค่า local-mode ที่คาดไว้ใหม่ หากคุณเรียกใช้ OpenClaw ผ่าน Podman เส้นทางกำหนดค่าเริ่มต้นคือ `~/.openclaw/openclaw.json`
    - `refusing to bind gateway ... without auth` → การ bind ที่ไม่ใช่ loopback โดยไม่มีเส้นทางยืนยันตัวตน Gateway ที่ถูกต้อง (โทเค็น/รหัสผ่าน หรือ trusted-proxy เมื่อกำหนดค่าไว้)
    - `another gateway instance is already listening` / `EADDRINUSE` → ความขัดแย้งของพอร์ต
    - `Other gateway-like services detected (best effort)` → มีหน่วย launchd/systemd/schtasks เก่าหรือทำงานคู่ขนานอยู่ การตั้งค่าส่วนใหญ่ควรมี Gateway หนึ่งรายการต่อเครื่อง หากคุณจำเป็นต้องมีมากกว่าหนึ่งจริง ๆ ให้แยกพอร์ต + การกำหนดค่า/สถานะ/พื้นที่ทำงาน ดู [/gateway#multiple-gateways-same-host](/th/gateway#multiple-gateways-same-host)
    - `System-level OpenClaw gateway service detected` จาก doctor → มีหน่วย systemd ระดับระบบอยู่ ในขณะที่บริการระดับผู้ใช้หายไป ลบหรือปิดใช้งานรายการซ้ำก่อนอนุญาตให้ doctor ติดตั้งบริการผู้ใช้ หรือตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` หากหน่วยระบบเป็น supervisor ที่ตั้งใจใช้
    - `Gateway service port does not match current gateway config` → supervisor ที่ติดตั้งไว้ยังปักค่า `--port` เก่า เรียกใช้ `openclaw doctor --fix` หรือ `openclaw gateway install --force` จากนั้นรีสตาร์ตบริการ Gateway

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [การ exec เบื้องหลังและเครื่องมือกระบวนการ](/th/gateway/background-process)
- [การกำหนดค่า](/th/gateway/configuration)
- [Doctor](/th/gateway/doctor)

## Gateway ปฏิเสธการกำหนดค่าที่ไม่ถูกต้อง

ใช้ส่วนนี้เมื่อการเริ่มต้น Gateway ล้มเหลวด้วย `Invalid config` หรือบันทึก hot reload ระบุว่า
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
- ไฟล์ `openclaw.json.rejected.*` ที่มี timestamp อยู่ข้างการกำหนดค่าที่ใช้งานอยู่
- ไฟล์ `openclaw.json.clobbered.*` ที่มี timestamp หาก `doctor --fix` ซ่อมแซมการแก้ไขโดยตรงที่เสียหาย

<AccordionGroup>
  <Accordion title="สิ่งที่เกิดขึ้น">
    - การกำหนดค่าไม่ผ่านการตรวจสอบความถูกต้องระหว่างการเริ่มต้น, hot reload หรือการเขียนที่ OpenClaw เป็นเจ้าของ
    - การเริ่มต้น Gateway ล้มเหลวแบบปิดแทนที่จะเขียน `openclaw.json` ใหม่
    - Hot reload ข้ามการแก้ไขภายนอกที่ไม่ถูกต้องและคงการกำหนดค่ารันไทม์ปัจจุบันไว้
    - การเขียนที่ OpenClaw เป็นเจ้าของปฏิเสธ payload ที่ไม่ถูกต้อง/ทำลายข้อมูลก่อน commit และบันทึก `.rejected.*`
    - `openclaw doctor --fix` เป็นเจ้าของการซ่อมแซม สามารถลบ prefix ที่ไม่ใช่ JSON หรือกู้คืนสำเนา last-known-good พร้อมเก็บ payload ที่ถูกปฏิเสธไว้เป็น `.clobbered.*`

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
    - มี `.clobbered.*` อยู่ → doctor เก็บการแก้ไขภายนอกที่เสียหายไว้ระหว่างซ่อมแซมการกำหนดค่าที่ใช้งานอยู่
    - มี `.rejected.*` อยู่ → การเขียนการกำหนดค่าที่ OpenClaw เป็นเจ้าของล้มเหลวจากการตรวจสอบ schema หรือ clobber ก่อน commit
    - `Config write rejected:` → การเขียนพยายามลบโครงสร้างที่จำเป็น ลดขนาดไฟล์ลงอย่างมาก หรือบันทึกการกำหนดค่าที่ไม่ถูกต้อง
    - `config reload skipped (invalid config):` → การแก้ไขโดยตรงไม่ผ่านการตรวจสอบและถูก Gateway ที่กำลังทำงานอยู่ละเว้น
    - `Invalid config at ...` → การเริ่มต้นล้มเหลวก่อนที่บริการ Gateway จะบูต
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` หรือ `size-drop-vs-last-good:*` → การเขียนที่ OpenClaw เป็นเจ้าของถูกปฏิเสธเพราะสูญเสียฟิลด์หรือขนาดเมื่อเทียบกับข้อมูลสำรอง last-known-good
    - `Config last-known-good promotion skipped` → candidate มี placeholder ความลับที่ถูก redact เช่น `***`

  </Accordion>
  <Accordion title="ตัวเลือกการแก้ไข">
    1. เรียกใช้ `openclaw doctor --fix` เพื่อให้ doctor ซ่อมแซมการกำหนดค่าที่มี prefix/ถูก clobber หรือกู้คืน last-known-good
    2. คัดลอกเฉพาะคีย์ที่ตั้งใจจาก `.clobbered.*` หรือ `.rejected.*` แล้วใช้ด้วย `openclaw config set` หรือ `config.patch`
    3. เรียกใช้ `openclaw config validate` ก่อนรีสตาร์ต
    4. หากคุณแก้ไขด้วยมือ ให้เก็บการกำหนดค่า JSON5 แบบเต็ม ไม่ใช่เฉพาะอ็อบเจกต์บางส่วนที่คุณต้องการเปลี่ยน
  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Config](/th/cli/config)
- [การกำหนดค่า: hot reload](/th/gateway/configuration#config-hot-reload)
- [การกำหนดค่า: การตรวจสอบแบบเข้มงวด](/th/gateway/configuration#strict-validation)
- [Doctor](/th/gateway/doctor)

## คำเตือนจากการ probe Gateway

ใช้ส่วนนี้เมื่อ `openclaw gateway probe` เข้าถึงบางอย่างได้ แต่ยังคงพิมพ์บล็อกคำเตือน

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

มองหา:

- `warnings[].code` และ `primaryTargetId` ในเอาต์พุต JSON
- ว่าคำเตือนเกี่ยวกับ fallback ของ SSH, Gateway หลายรายการ, ขอบเขตที่ขาดหาย หรือ auth refs ที่แก้ไม่ออก

ลายเซ็นที่พบบ่อย:

- `SSH tunnel failed to start; falling back to direct probes.` → การตั้งค่า SSH ล้มเหลว แต่คำสั่งยังลองเป้าหมายที่กำหนดค่าไว้/loopback โดยตรง
- `multiple reachable gateways detected` → มีเป้าหมายมากกว่าหนึ่งตอบกลับ โดยปกติหมายถึงการตั้งค่า Gateway หลายรายการโดยตั้งใจ หรือ listener เก่า/ซ้ำ
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → การเชื่อมต่อสำเร็จ แต่ RPC รายละเอียดถูกจำกัดด้วยขอบเขต จับคู่ตัวตนอุปกรณ์หรือใช้ข้อมูลประจำตัวที่มี `operator.read`
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → การเชื่อมต่อสำเร็จ แต่ชุด RPC วินิจฉัยเต็มรูปแบบหมดเวลาหรือล้มเหลว ให้ถือว่านี่เป็น Gateway ที่เข้าถึงได้พร้อมการวินิจฉัยที่ลดระดับลง เปรียบเทียบ `connect.ok` และ `connect.rpcOk` ในเอาต์พุต `--json`
- `Capability: pairing-pending` หรือ `gateway closed (1008): pairing required` → Gateway ตอบกลับแล้ว แต่ไคลเอนต์นี้ยังต้องจับคู่/อนุมัติก่อนเข้าถึง operator ตามปกติ
- ข้อความเตือน SecretRef ของ `gateway.auth.*` / `gateway.remote.*` ที่แก้ไม่ออก → วัสดุยืนยันตัวตนไม่พร้อมใช้งานในเส้นทางคำสั่งนี้สำหรับเป้าหมายที่ล้มเหลว

ที่เกี่ยวข้อง:

- [Gateway](/th/cli/gateway)
- [Gateway หลายรายการบนโฮสต์เดียวกัน](/th/gateway#multiple-gateways-same-host)
- [การเข้าถึงระยะไกล](/th/gateway/remote)

## ช่องเชื่อมต่อแล้ว แต่ข้อความไม่ไหล

หากสถานะช่องเชื่อมต่อแล้วแต่การไหลของข้อความหยุดทำงาน ให้มุ่งที่นโยบาย สิทธิ์ และกฎการส่งมอบเฉพาะช่อง

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

มองหา:

- นโยบาย DM (`pairing`, `allowlist`, `open`, `disabled`)
- รายการ allowlist ของกลุ่มและข้อกำหนดเรื่องการ mention
- สิทธิ์/ขอบเขตของ API ช่องทางที่ขาดหายไป

ลายเซ็นที่พบบ่อย:

- `mention required` → ข้อความถูกละเว้นโดยนโยบายการ mention ของกลุ่ม
- `pairing` / ร่องรอย pending approval → ผู้ส่งยังไม่ได้รับการอนุมัติ
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → ปัญหา auth/สิทธิ์ของช่องทาง

ที่เกี่ยวข้อง:

- [การแก้ปัญหาช่องทาง](/th/channels/troubleshooting)
- [Discord](/th/channels/discord)
- [Telegram](/th/channels/telegram)
- [WhatsApp](/th/channels/whatsapp)

## การส่ง Cron และ Heartbeat

หาก cron หรือ heartbeat ไม่ได้ทำงานหรือไม่ได้ส่ง ให้ตรวจสอบสถานะตัวจัดกำหนดการก่อน แล้วจึงตรวจสอบเป้าหมายการส่ง

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

มองหา:

- Cron เปิดใช้งานอยู่และมีเวลาปลุกครั้งถัดไป
- สถานะประวัติการรันงาน (`ok`, `skipped`, `error`)
- เหตุผลที่ Heartbeat ถูกข้าม (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`)

<AccordionGroup>
  <Accordion title="ลายเซ็นที่พบบ่อย">
    - `cron: scheduler disabled; jobs will not run automatically` → cron ถูกปิดใช้งาน
    - `cron: timer tick failed` → tick ของตัวจัดกำหนดการล้มเหลว ตรวจสอบข้อผิดพลาดของไฟล์/log/runtime
    - `heartbeat skipped` พร้อม `reason=quiet-hours` → อยู่นอกช่วงเวลาทำงาน
    - `heartbeat skipped` พร้อม `reason=empty-heartbeat-file` → มี `HEARTBEAT.md` อยู่ แต่มีเพียงบรรทัดว่าง / ส่วนหัว markdown ดังนั้น OpenClaw จึงข้ามการเรียกโมเดล
    - `heartbeat skipped` พร้อม `reason=no-tasks-due` → `HEARTBEAT.md` มีบล็อก `tasks:` แต่ไม่มีงานใดถึงกำหนดใน tick นี้
    - `heartbeat: unknown accountId` → id บัญชีไม่ถูกต้องสำหรับเป้าหมายการส่ง heartbeat
    - `heartbeat skipped` พร้อม `reason=dm-blocked` → เป้าหมาย heartbeat ถูก resolve เป็นปลายทางแบบ DM ขณะที่ `agents.defaults.heartbeat.directPolicy` (หรือ override ราย agent) ตั้งค่าเป็น `block`

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Heartbeat](/th/gateway/heartbeat)
- [งานที่ตั้งกำหนดเวลา](/th/automation/cron-jobs)
- [งานที่ตั้งกำหนดเวลา: การแก้ปัญหา](/th/automation/cron-jobs#troubleshooting)

## Node จับคู่แล้ว แต่เครื่องมือล้มเหลว

หาก node จับคู่แล้วแต่เครื่องมือล้มเหลว ให้แยกตรวจสถานะ foreground, สิทธิ์ และการอนุมัติ

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

มองหา:

- Node ออนไลน์พร้อมความสามารถที่คาดไว้
- การให้สิทธิ์ของ OS สำหรับกล้อง/ไมโครโฟน/ตำแหน่งที่ตั้ง/หน้าจอ
- สถานะการอนุมัติ exec และ allowlist

ลายเซ็นที่พบบ่อย:

- `NODE_BACKGROUND_UNAVAILABLE` → แอป node ต้องอยู่ใน foreground
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → ขาดสิทธิ์ของ OS
- `SYSTEM_RUN_DENIED: approval required` → การอนุมัติ exec ยังรอดำเนินการ
- `SYSTEM_RUN_DENIED: allowlist miss` → คำสั่งถูกบล็อกโดย allowlist

ที่เกี่ยวข้อง:

- [การอนุมัติ Exec](/th/tools/exec-approvals)
- [การแก้ปัญหา Node](/th/nodes/troubleshooting)
- [Nodes](/th/nodes/index)

## เครื่องมือเบราว์เซอร์ล้มเหลว

ใช้ส่วนนี้เมื่อการทำงานของเครื่องมือเบราว์เซอร์ล้มเหลว แม้ว่า gateway เองจะปกติ

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

มองหา:

- ว่า `plugins.allow` ถูกตั้งค่าไว้และรวม `browser` หรือไม่
- path ของ executable เบราว์เซอร์ที่ถูกต้อง
- การเข้าถึงโปรไฟล์ CDP
- ความพร้อมใช้งานของ Chrome ในเครื่องสำหรับโปรไฟล์ `existing-session` / `user`

<AccordionGroup>
  <Accordion title="ลายเซ็น Plugin / executable">
    - `unknown command "browser"` หรือ `unknown command 'browser'` → bundled browser plugin ถูกยกเว้นโดย `plugins.allow`
    - เครื่องมือเบราว์เซอร์หายไป / ไม่พร้อมใช้งาน ขณะที่ `browser.enabled=true` → `plugins.allow` ยกเว้น `browser` ดังนั้น plugin จึงไม่เคยถูกโหลด
    - `Failed to start Chrome CDP on port` → process ของเบราว์เซอร์เริ่มทำงานไม่สำเร็จ
    - `browser.executablePath not found` → path ที่กำหนดค่าไม่ถูกต้อง
    - `browser.cdpUrl must be http(s) or ws(s)` → URL ของ CDP ที่กำหนดค่าใช้ scheme ที่ไม่รองรับ เช่น `file:` หรือ `ftp:`
    - `browser.cdpUrl has invalid port` → URL ของ CDP ที่กำหนดค่ามีพอร์ตผิดหรืออยู่นอกช่วง
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → การติดตั้ง gateway ปัจจุบันไม่มี dependency runtime หลักของเบราว์เซอร์ ให้ติดตั้งใหม่หรืออัปเดต OpenClaw แล้ว restart gateway สแนปช็อต ARIA และภาพหน้าจอหน้าเว็บพื้นฐานยังทำงานได้ แต่การนำทาง, สแนปช็อต AI, ภาพหน้าจอ element ด้วย CSS-selector และการ export PDF ยังไม่พร้อมใช้งาน

  </Accordion>
  <Accordion title="ลายเซ็น Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → existing-session ของ Chrome MCP ยัง attach กับไดเรกทอรีข้อมูลเบราว์เซอร์ที่เลือกไม่ได้ เปิดหน้าตรวจสอบของเบราว์เซอร์ เปิด remote debugging เปิดเบราว์เซอร์ค้างไว้ อนุมัติ prompt การ attach ครั้งแรก แล้วลองใหม่ หากไม่จำเป็นต้องใช้สถานะ signed-in ให้ใช้โปรไฟล์ `openclaw` ที่จัดการโดยระบบ
    - `No Chrome tabs found for profile="user"` → โปรไฟล์ attach ของ Chrome MCP ไม่มีแท็บ Chrome ในเครื่องที่เปิดอยู่
    - `Remote CDP for profile "<name>" is not reachable` → endpoint CDP ระยะไกลที่กำหนดค่าไม่สามารถเข้าถึงได้จากโฮสต์ gateway
    - `Browser attachOnly is enabled ... not reachable` หรือ `Browser attachOnly is enabled and CDP websocket ... is not reachable` → โปรไฟล์ attach-only ไม่มีเป้าหมายที่เข้าถึงได้ หรือ endpoint HTTP ตอบกลับแล้ว แต่ยังเปิด CDP WebSocket ไม่ได้

  </Accordion>
  <Accordion title="ลายเซ็น Element / screenshot / upload">
    - `fullPage is not supported for element screenshots` → คำขอ screenshot ผสม `--full-page` กับ `--ref` หรือ `--element`
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → การเรียก screenshot ของ Chrome MCP / `existing-session` ต้องใช้การ capture หน้าเว็บหรือ snapshot `--ref` ไม่ใช่ CSS `--element`
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooks การ upload ของ Chrome MCP ต้องใช้ snapshot refs ไม่ใช่ CSS selectors
    - `existing-session file uploads currently support one file at a time.` → ส่งหนึ่ง upload ต่อหนึ่ง call บนโปรไฟล์ Chrome MCP
    - `existing-session dialog handling does not support timeoutMs.` → hooks dialog บนโปรไฟล์ Chrome MCP ไม่รองรับ timeout overrides
    - `existing-session type does not support timeoutMs overrides.` → ละเว้น `timeoutMs` สำหรับ `act:type` บนโปรไฟล์ `profile="user"` / Chrome MCP existing-session หรือใช้โปรไฟล์เบราว์เซอร์แบบ managed/CDP เมื่อจำเป็นต้องใช้ timeout แบบกำหนดเอง
    - `existing-session evaluate does not support timeoutMs overrides.` → ละเว้น `timeoutMs` สำหรับ `act:evaluate` บนโปรไฟล์ `profile="user"` / Chrome MCP existing-session หรือใช้โปรไฟล์เบราว์เซอร์แบบ managed/CDP เมื่อจำเป็นต้องใช้ timeout แบบกำหนดเอง
    - `response body is not supported for existing-session profiles yet.` → `responsebody` ยังต้องใช้เบราว์เซอร์แบบ managed หรือโปรไฟล์ CDP ดิบ
    - viewport / dark-mode / locale / offline overrides ที่ค้างอยู่บนโปรไฟล์ attach-only หรือ remote CDP → รัน `openclaw browser stop --browser-profile <name>` เพื่อปิด session ควบคุมที่ active และปล่อยสถานะ emulation ของ Playwright/CDP โดยไม่ต้อง restart gateway ทั้งหมด

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [เบราว์เซอร์ (จัดการโดย OpenClaw)](/th/tools/browser)
- [การแก้ปัญหาเบราว์เซอร์](/th/tools/browser-linux-troubleshooting)

## หากคุณอัปเกรดแล้วบางอย่างเสียทันที

ปัญหาหลังอัปเกรดส่วนใหญ่เกิดจาก config drift หรือ defaults ที่เข้มงวดขึ้นซึ่งตอนนี้ถูกบังคับใช้

<AccordionGroup>
  <Accordion title="1. พฤติกรรม Auth และ URL override เปลี่ยนไป">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    สิ่งที่ต้องตรวจสอบ:

    - หาก `gateway.mode=remote` การเรียก CLI อาจกำลังชี้ไปที่ remote ขณะที่บริการในเครื่องของคุณปกติ
    - การเรียกที่ระบุ `--url` อย่างชัดเจนจะไม่ fallback ไปยัง credentials ที่บันทึกไว้

    ลายเซ็นที่พบบ่อย:

    - `gateway connect failed:` → เป้าหมาย URL ผิด
    - `unauthorized` → endpoint เข้าถึงได้ แต่ auth ผิด

  </Accordion>
  <Accordion title="2. Guardrails ของ bind และ auth เข้มงวดขึ้น">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    สิ่งที่ต้องตรวจสอบ:

    - การ bind ที่ไม่ใช่ loopback (`lan`, `tailnet`, `custom`) ต้องมี path auth ของ gateway ที่ถูกต้อง: shared token/password auth หรือ deployment `trusted-proxy` แบบ non-loopback ที่กำหนดค่าอย่างถูกต้อง
    - key เก่าอย่าง `gateway.token` ไม่ได้แทนที่ `gateway.auth.token`

    ลายเซ็นที่พบบ่อย:

    - `refusing to bind gateway ... without auth` → bind แบบ non-loopback โดยไม่มี path auth ของ gateway ที่ถูกต้อง
    - `Connectivity probe: failed` ขณะที่ runtime กำลังทำงาน → gateway ยังทำงานอยู่ แต่เข้าถึงไม่ได้ด้วย auth/url ปัจจุบัน

  </Accordion>
  <Accordion title="3. สถานะการจับคู่และตัวตนอุปกรณ์เปลี่ยนไป">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    สิ่งที่ต้องตรวจสอบ:

    - การอนุมัติอุปกรณ์ที่รอดำเนินการสำหรับ dashboard/nodes
    - การอนุมัติการจับคู่ DM ที่รอดำเนินการหลังจากนโยบายหรือ identity เปลี่ยน

    ลายเซ็นที่พบบ่อย:

    - `device identity required` → device auth ยังไม่สำเร็จ
    - `pairing required` → ผู้ส่ง/อุปกรณ์ต้องได้รับการอนุมัติ

  </Accordion>
</AccordionGroup>

หาก config ของบริการและ runtime ยังไม่ตรงกันหลังตรวจสอบแล้ว ให้ติดตั้ง metadata ของบริการใหม่จาก profile/state directory เดียวกัน:

```bash
openclaw gateway install --force
openclaw gateway restart
```

ที่เกี่ยวข้อง:

- [Authentication](/th/gateway/authentication)
- [Background exec และ process tool](/th/gateway/background-process)
- [การจับคู่ที่ Gateway เป็นเจ้าของ](/th/gateway/pairing)

## ที่เกี่ยวข้อง

- [Doctor](/th/gateway/doctor)
- [FAQ](/th/help/faq)
- [Runbook ของ Gateway](/th/gateway)
