---
read_when:
    - ศูนย์รวมการแก้ไขปัญหาแนะนำให้คุณมาที่นี่เพื่อวินิจฉัยในเชิงลึกยิ่งขึ้น
    - คุณต้องมีส่วนคู่มือปฏิบัติการที่อิงตามอาการและมีความเสถียร พร้อมคำสั่งที่แน่นอน
sidebarTitle: Troubleshooting
summary: คู่มือปฏิบัติการแก้ไขปัญหาเชิงลึกสำหรับ Gateway, ช่องทาง, ระบบอัตโนมัติ, Node และเบราว์เซอร์
title: การแก้ไขปัญหา
x-i18n:
    generated_at: "2026-05-03T21:33:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19422615706ca09124b19dd3e21b2c13391d6daf2b1807e01b4ce2047d02e522
    source_path: gateway/troubleshooting.md
    workflow: 16
---

หน้านี้คือ runbook แบบละเอียด เริ่มที่ [/help/troubleshooting](/th/help/troubleshooting) หากคุณต้องการ flow การ triage แบบรวดเร็วก่อน

## ลำดับคำสั่ง

รันคำสั่งเหล่านี้ก่อนตามลำดับนี้:

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
- `openclaw channels status --probe` แสดงสถานะ transport แบบสดแยกตามบัญชี และในที่ที่รองรับ จะแสดงผล probe/audit เช่น `works` หรือ `audit ok`

## การติดตั้งแบบ split brain และตัวป้องกัน config รุ่นใหม่กว่า

ใช้ส่วนนี้เมื่อบริการ gateway หยุดโดยไม่คาดคิดหลังอัปเดต หรือ logs แสดงว่า binary `openclaw` ตัวหนึ่งเก่ากว่าเวอร์ชันที่เขียน `openclaw.json` ล่าสุด

OpenClaw ประทับตราการเขียน config ด้วย `meta.lastTouchedVersion` คำสั่งอ่านอย่างเดียวยังสามารถตรวจสอบ config ที่เขียนโดย OpenClaw รุ่นใหม่กว่าได้ แต่การเปลี่ยนแปลง process และ service จะปฏิเสธการดำเนินการต่อจาก binary รุ่นเก่ากว่า การกระทำที่ถูกบล็อกรวมถึงการ start, stop, restart, uninstall ของบริการ gateway, การบังคับติดตั้งบริการใหม่, การเริ่ม gateway ใน service-mode และการ cleanup port ด้วย `gateway --force`

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    แก้ `PATH` ให้ `openclaw` ชี้ไปยังการติดตั้งรุ่นใหม่กว่า แล้วรันการกระทำนั้นอีกครั้ง
  </Step>
  <Step title="Reinstall the gateway service">
    ติดตั้งบริการ gateway ที่ต้องการใหม่จากการติดตั้งรุ่นใหม่กว่า:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    ลบแพ็กเกจระบบเก่าหรือรายการ wrapper เก่าที่ยังชี้ไปยัง binary `openclaw` ตัวเก่า
  </Step>
</Steps>

<Warning>
สำหรับการ downgrade โดยตั้งใจหรือการกู้คืนฉุกเฉินเท่านั้น ให้ตั้ง `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` สำหรับคำสั่งเดียว ปล่อยให้ unset สำหรับการทำงานปกติ
</Warning>

## Anthropic 429 ต้องการ extra usage สำหรับ long context

ใช้ส่วนนี้เมื่อ logs/errors มีข้อความ: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

ตรวจหา:

- โมเดล Anthropic Opus/Sonnet ที่เลือกมี `params.context1m: true`
- credential Anthropic ปัจจุบันไม่มีสิทธิ์ใช้ long-context
- คำขอล้มเหลวเฉพาะใน session/model run ที่ยาวซึ่งต้องใช้ path เบต้า 1M

ตัวเลือกการแก้ไข:

<Steps>
  <Step title="Disable context1m">
    ปิด `context1m` สำหรับโมเดลนั้นเพื่อ fallback ไปยัง context window ปกติ
  </Step>
  <Step title="Use an eligible credential">
    ใช้ credential Anthropic ที่มีสิทธิ์สำหรับคำขอ long-context หรือเปลี่ยนไปใช้ Anthropic API key
  </Step>
  <Step title="Configure fallback models">
    กำหนดค่าโมเดล fallback เพื่อให้ run ดำเนินต่อได้เมื่อคำขอ long-context ของ Anthropic ถูกปฏิเสธ
  </Step>
</Steps>

เกี่ยวข้อง:

- [Anthropic](/th/providers/anthropic)
- [การใช้ token และค่าใช้จ่าย](/th/reference/token-use)
- [ทำไมฉันเห็น HTTP 429 จาก Anthropic?](/th/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## backend ที่เข้ากันได้กับ OpenAI แบบ local ผ่าน probe ตรง แต่ agent run ล้มเหลว

ใช้ส่วนนี้เมื่อ:

- `curl ... /v1/models` ทำงาน
- การเรียก `/v1/chat/completions` ตรงแบบเล็กมากทำงาน
- การรันโมเดลของ OpenClaw ล้มเหลวเฉพาะใน turn agent ปกติ

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

ตรวจหา:

- การเรียกตรงแบบเล็กมากสำเร็จ แต่การรัน OpenClaw ล้มเหลวเฉพาะกับ prompt ที่ใหญ่กว่า
- ข้อผิดพลาด `model_not_found` หรือ 404 แม้ว่า `/v1/chat/completions` ตรง
  จะทำงานกับ bare model id เดียวกัน
- ข้อผิดพลาดจาก backend เกี่ยวกับ `messages[].content` ที่คาดหวัง string
- คำเตือน `incomplete turn detected ... stopReason=stop payloads=0` เป็นครั้งคราวกับ backend local ที่เข้ากันได้กับ OpenAI
- backend crash ที่เกิดเฉพาะกับจำนวน prompt-token ที่มากขึ้นหรือ prompt runtime agent แบบเต็ม

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` กับเซิร์ฟเวอร์ local สไตล์ MLX/vLLM → ตรวจสอบว่า `baseUrl` มี `/v1`, `api` เป็น `"openai-completions"` สำหรับ backend `/v1/chat/completions` และ `models.providers.<provider>.models[].id` เป็น bare provider-local id เลือกด้วย provider prefix ครั้งเดียว เช่น `mlx/mlx-community/Qwen3-30B-A3B-6bit`; เก็บรายการ catalog เป็น `mlx-community/Qwen3-30B-A3B-6bit`
    - `messages[...].content: invalid type: sequence, expected a string` → backend ปฏิเสธ structured Chat Completions content parts การแก้ไข: ตั้ง `models.providers.<provider>.models[].compat.requiresStringContent: true`
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend ทำคำขอ Chat Completions เสร็จแล้ว แต่ไม่ส่งข้อความ assistant ที่ผู้ใช้มองเห็นได้สำหรับ turn นั้น OpenClaw retry turn ว่างที่เข้ากันได้กับ OpenAI และ replay-safe หนึ่งครั้ง; หากยังล้มเหลวซ้ำมักหมายความว่า backend กำลังส่ง content ว่าง/ไม่ใช่ข้อความ หรือ suppress ข้อความ final-answer
    - คำขอเล็กมากแบบตรงสำเร็จ แต่การรัน agent ของ OpenClaw ล้มเหลวด้วย backend/model crash (เช่น Gemma บน build `inferrs` บางตัว) → transport ของ OpenClaw มีแนวโน้มว่าถูกต้องแล้ว; backend ล้มเหลวกับรูปแบบ prompt agent-runtime ที่ใหญ่กว่า
    - ความล้มเหลวลดลงหลังปิด tools แต่ไม่หายไป → tool schemas เป็นส่วนหนึ่งของแรงกดดัน แต่ปัญหาที่เหลือยังเป็นความจุของ upstream model/server หรือ bug ของ backend

  </Accordion>
  <Accordion title="Fix options">
    1. ตั้ง `compat.requiresStringContent: true` สำหรับ backend Chat Completions ที่รับเฉพาะ string
    2. ตั้ง `compat.supportsTools: false` สำหรับโมเดล/backend ที่จัดการ tool schema surface ของ OpenClaw ได้ไม่น่าเชื่อถือ
    3. ลดแรงกดดันของ prompt เมื่อทำได้: workspace bootstrap ที่เล็กลง, ประวัติ session ที่สั้นลง, โมเดล local ที่เบากว่า หรือ backend ที่รองรับ long-context ได้ดีกว่า
    4. หากคำขอเล็กมากแบบตรงยังผ่าน แต่ turn agent ของ OpenClaw ยัง crash ภายใน backend ให้ถือว่าเป็นข้อจำกัดของ upstream server/model และส่ง repro ที่นั่นพร้อมรูปแบบ payload ที่ backend ยอมรับ
  </Accordion>
</AccordionGroup>

เกี่ยวข้อง:

- [การกำหนดค่า](/th/gateway/configuration)
- [โมเดล local](/th/gateway/local-models)
- [endpoint ที่เข้ากันได้กับ OpenAI](/th/gateway/configuration-reference#openai-compatible-endpoints)

## ไม่มีการตอบกลับ

หาก channels ทำงานอยู่แต่ไม่มีอะไรตอบ ให้ตรวจสอบ routing และ policy ก่อนเชื่อมต่ออะไรใหม่

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

ตรวจหา:

- Pairing pending สำหรับผู้ส่ง DM
- การ gating การ mention ในกลุ่ม (`requireMention`, `mentionPatterns`)
- ความไม่ตรงกันของ allowlist สำหรับ channel/group

รูปแบบที่พบบ่อย:

- `drop guild message (mention required` → ข้อความกลุ่มถูกละเว้นจนกว่าจะมีการ mention
- `pairing request` → ผู้ส่งต้องได้รับการอนุมัติ
- `blocked` / `allowlist` → ผู้ส่ง/channel ถูกกรองโดย policy

เกี่ยวข้อง:

- [การแก้ไขปัญหา channel](/th/channels/troubleshooting)
- [กลุ่ม](/th/channels/groups)
- [Pairing](/th/channels/pairing)

## การเชื่อมต่อ Dashboard control UI

เมื่อ dashboard/control UI เชื่อมต่อไม่ได้ ให้ตรวจสอบ URL, auth mode และสมมติฐานเรื่อง secure context

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

ตรวจหา:

- probe URL และ dashboard URL ที่ถูกต้อง
- auth mode/token ไม่ตรงกันระหว่าง client และ gateway
- การใช้ HTTP ในที่ที่ต้องใช้ device identity

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → context ไม่ secure หรือขาด device auth
    - `origin not allowed` → browser `Origin` ไม่อยู่ใน `gateway.controlUi.allowedOrigins` (หรือคุณกำลังเชื่อมต่อจาก browser origin ที่ไม่ใช่ loopback โดยไม่มี allowlist ที่ระบุชัดเจน)
    - `device nonce required` / `device nonce mismatch` → client ไม่ได้ทำ flow device auth แบบ challenge-based ให้เสร็จ (`connect.challenge` + `device.nonce`)
    - `device signature invalid` / `device signature expired` → client ลงนาม payload ผิด (หรือ timestamp เก่า) สำหรับ handshake ปัจจุบัน
    - `AUTH_TOKEN_MISMATCH` พร้อม `canRetryWithDeviceToken=true` → client สามารถ retry แบบ trusted ได้หนึ่งครั้งด้วย device token ที่ cache ไว้
    - การ retry ด้วย cached-token นั้นใช้ชุด scope ที่ cache ไว้ซึ่งเก็บพร้อมกับ paired device token ผู้เรียกที่ส่ง `deviceToken` ชัดเจน / `scopes` ชัดเจน จะคงชุด scope ที่ร้องขอไว้แทน
    - นอก path retry นั้น ลำดับความสำคัญของ connect auth คือ shared token/password ที่ระบุชัดเจนก่อน จากนั้น `deviceToken` ที่ระบุชัดเจน จากนั้น stored device token แล้วจึงเป็น bootstrap token
    - บน path async Tailscale Serve Control UI ความพยายามที่ล้มเหลวสำหรับ `{scope, ip}` เดียวกันจะถูก serialize ก่อนที่ limiter จะบันทึกความล้มเหลว ดังนั้นการ retry พร้อมกันที่ผิดสองครั้งจาก client เดียวกันอาจแสดง `retry later` ในครั้งที่สองแทนที่จะเป็น mismatch ธรรมดาสองครั้ง
    - `too many failed authentication attempts (retry later)` จาก browser-origin local loopback client → ความล้มเหลวซ้ำจาก normalized `Origin` เดียวกันนั้นถูก lock out ชั่วคราว; origin localhost อื่นใช้ bucket แยกกัน
    - `unauthorized` ซ้ำหลัง retry นั้น → shared token/device token drift; refresh การกำหนดค่า token และ re-approve/rotate device token หากจำเป็น
    - `gateway connect failed:` → เป้าหมาย host/port/url ผิด

  </Accordion>
</AccordionGroup>

### แผนที่ด่วนสำหรับ auth detail codes

ใช้ `error.details.code` จาก response `connect` ที่ล้มเหลวเพื่อเลือกการกระทำถัดไป

| รหัสรายละเอียด                 | ความหมาย                                                                                                                                                                                      | การดำเนินการที่แนะนำ                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | ไคลเอนต์ไม่ได้ส่งโทเค็นที่ใช้ร่วมกันที่จำเป็น                                                                                                                                                 | วาง/ตั้งค่าโทเค็นในไคลเอนต์แล้วลองใหม่ สำหรับพาธแดชบอร์ด: `openclaw config get gateway.auth.token` จากนั้นวางลงในการตั้งค่า Control UI                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | โทเค็นที่ใช้ร่วมกันไม่ตรงกับโทเค็นยืนยันตัวตนของ Gateway                                                                                                                                               | หาก `canRetryWithDeviceToken=true` ให้อนุญาตการลองใหม่ที่เชื่อถือได้หนึ่งครั้ง การลองใหม่ด้วยโทเค็นที่แคชไว้จะใช้ขอบเขตที่อนุมัติและจัดเก็บไว้ซ้ำ ผู้เรียกที่ระบุ `deviceToken` / `scopes` โดยตรงจะคงขอบเขตที่ร้องขอไว้ หากยังล้มเหลว ให้รัน[เช็กลิสต์กู้คืนความคลาดเคลื่อนของโทเค็น](/th/cli/devices#token-drift-recovery-checklist) |
| `AUTH_DEVICE_TOKEN_MISMATCH` | โทเค็นต่ออุปกรณ์ที่แคชไว้ล้าสมัยหรือถูกเพิกถอน                                                                                                                                                 | หมุนเวียน/อนุมัติโทเค็นอุปกรณ์อีกครั้งโดยใช้ [CLI อุปกรณ์](/th/cli/devices) จากนั้นเชื่อมต่อใหม่                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | ต้องอนุมัติตัวตนอุปกรณ์ ตรวจสอบ `error.details.reason` สำหรับ `not-paired`, `scope-upgrade`, `role-upgrade` หรือ `metadata-upgrade` และใช้ `requestId` / `remediationHint` เมื่อมีอยู่ | อนุมัติคำขอที่รอดำเนินการ: `openclaw devices list` จากนั้น `openclaw devices approve <requestId>` การอัปเกรดขอบเขต/บทบาทใช้ขั้นตอนเดียวกันหลังจากคุณตรวจสอบสิทธิ์เข้าถึงที่ร้องขอแล้ว                                                                                                               |

<Note>
RPC แบ็กเอนด์แบบลูปแบ็กโดยตรงที่ยืนยันตัวตนด้วยโทเค็น/รหัสผ่าน Gateway ที่ใช้ร่วมกันไม่ควรขึ้นกับขอบเขตพื้นฐานของอุปกรณ์ที่จับคู่แล้วของ CLI หาก subagent หรือการเรียกภายในอื่นๆ ยังล้มเหลวด้วย `scope-upgrade` ให้ตรวจสอบว่าผู้เรียกใช้ `client.id: "gateway-client"` และ `client.mode: "backend"` และไม่ได้บังคับ `deviceIdentity` หรือโทเค็นอุปกรณ์อย่างชัดเจน
</Note>

การตรวจสอบการย้ายข้อมูลการยืนยันตัวตนอุปกรณ์ v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

หากบันทึกแสดงข้อผิดพลาด nonce/signature ให้อัปเดตไคลเอนต์ที่เชื่อมต่อและตรวจสอบ:

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

- เซสชันโทเค็นอุปกรณ์ที่จับคู่แล้วสามารถจัดการได้เฉพาะอุปกรณ์ **ของตนเอง** เว้นแต่ว่าผู้เรียกจะมี `operator.admin` ด้วย
- `openclaw devices rotate --scope ...` สามารถร้องขอได้เฉพาะขอบเขต operator ที่เซสชันผู้เรียกมีอยู่แล้ว

ที่เกี่ยวข้อง:

- [การกำหนดค่า](/th/gateway/configuration) (โหมดการยืนยันตัวตน Gateway)
- [Control UI](/th/web/control-ui)
- [อุปกรณ์](/th/cli/devices)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [การยืนยันตัวตนพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth)

## บริการ Gateway ไม่ได้ทำงาน

ใช้ส่วนนี้เมื่อบริการติดตั้งแล้ว แต่โปรเซสไม่คงสถานะทำงาน

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

ตรวจหา:

- `Runtime: stopped` พร้อมคำใบ้การออก
- การกำหนดค่าบริการไม่ตรงกัน (`Config (cli)` เทียบกับ `Config (service)`)
- ความขัดแย้งของพอร์ต/listener
- การติดตั้ง launchd/systemd/schtasks เพิ่มเติมเมื่อใช้ `--deep`
- คำใบ้การล้างข้อมูล `Other gateway-like services detected (best effort)`

<AccordionGroup>
  <Accordion title="Common signatures">
    - `Gateway start blocked: set gateway.mode=local` หรือ `existing config is missing gateway.mode` → ยังไม่ได้เปิดใช้โหมด Gateway แบบโลคัล หรือไฟล์ config ถูกเขียนทับจนสูญเสีย `gateway.mode` วิธีแก้: ตั้งค่า `gateway.mode="local"` ใน config ของคุณ หรือรัน `openclaw onboard --mode local` / `openclaw setup` อีกครั้งเพื่อประทับ config โหมดโลคัลที่คาดไว้ใหม่ หากคุณรัน OpenClaw ผ่าน Podman พาธ config เริ่มต้นคือ `~/.openclaw/openclaw.json`
    - `refusing to bind gateway ... without auth` → การ bind ที่ไม่ใช่ loopback โดยไม่มีพาธการยืนยันตัวตน Gateway ที่ถูกต้อง (โทเค็น/รหัสผ่าน หรือ trusted-proxy เมื่อกำหนดค่าไว้)
    - `another gateway instance is already listening` / `EADDRINUSE` → พอร์ตขัดแย้ง
    - `Other gateway-like services detected (best effort)` → มีหน่วย launchd/systemd/schtasks ที่ค้างอยู่หรือทำงานขนานกัน การตั้งค่าส่วนใหญ่ควรมี Gateway หนึ่งตัวต่อเครื่อง หากคุณจำเป็นต้องมีมากกว่าหนึ่งจริงๆ ให้แยกพอร์ต + config/state/workspace ดู [/gateway#multiple-gateways-same-host](/th/gateway#multiple-gateways-same-host)
    - `System-level OpenClaw gateway service detected` จาก doctor → มี systemd system unit อยู่ขณะที่บริการระดับผู้ใช้หายไป ลบหรือปิดใช้งานตัวซ้ำก่อนอนุญาตให้ doctor ติดตั้งบริการผู้ใช้ หรือตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` หาก system unit เป็น supervisor ที่ตั้งใจใช้
    - `Gateway service port does not match current gateway config` → supervisor ที่ติดตั้งไว้ยังคงตรึง `--port` เก่าไว้ รัน `openclaw doctor --fix` หรือ `openclaw gateway install --force` จากนั้นรีสตาร์ตบริการ Gateway

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [การ exec เบื้องหลังและเครื่องมือโปรเซส](/th/gateway/background-process)
- [การกำหนดค่า](/th/gateway/configuration)
- [Doctor](/th/gateway/doctor)

## Gateway ปฏิเสธ config ที่ไม่ถูกต้อง

ใช้ส่วนนี้เมื่อการเริ่มต้น Gateway ล้มเหลวด้วย `Invalid config` หรือบันทึก hot reload ระบุว่า
ข้ามการแก้ไขที่ไม่ถูกต้อง

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
- ไฟล์ `openclaw.json.rejected.*` ที่มี timestamp อยู่ข้าง config ที่ใช้งานอยู่
- ไฟล์ `openclaw.json.clobbered.*` ที่มี timestamp หาก `doctor --fix` ซ่อมการแก้ไขโดยตรงที่เสียหาย

<AccordionGroup>
  <Accordion title="What happened">
    - config ไม่ผ่านการตรวจสอบระหว่างเริ่มต้น, hot reload หรือการเขียนที่ OpenClaw เป็นเจ้าของ
    - การเริ่มต้น Gateway ล้มเหลวแบบปิดแทนที่จะเขียน `openclaw.json` ใหม่
    - Hot reload ข้ามการแก้ไขภายนอกที่ไม่ถูกต้องและคง config runtime ปัจจุบันไว้
    - การเขียนที่ OpenClaw เป็นเจ้าของปฏิเสธ payload ที่ไม่ถูกต้อง/ทำลายข้อมูลก่อน commit และบันทึก `.rejected.*`
    - `openclaw doctor --fix` เป็นเจ้าของการซ่อมแซม โดยสามารถลบ prefix ที่ไม่ใช่ JSON หรือกู้คืนสำเนา last-known-good พร้อมเก็บ payload ที่ถูกปฏิเสธไว้เป็น `.clobbered.*`

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
    - มี `.clobbered.*` → doctor เก็บการแก้ไขภายนอกที่เสียหายไว้ขณะซ่อม config ที่ใช้งานอยู่
    - มี `.rejected.*` → การเขียน config ที่ OpenClaw เป็นเจ้าของล้มเหลวจาก schema หรือการตรวจสอบการเขียนทับก่อน commit
    - `Config write rejected:` → การเขียนพยายามลดรูปทรงที่จำเป็น ลดขนาดไฟล์อย่างมาก หรือคง config ที่ไม่ถูกต้อง
    - `config reload skipped (invalid config):` → การแก้ไขโดยตรงไม่ผ่านการตรวจสอบและถูก Gateway ที่กำลังทำงานละเว้น
    - `Invalid config at ...` → การเริ่มต้นล้มเหลวก่อนบริการ Gateway บูต
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` หรือ `size-drop-vs-last-good:*` → การเขียนที่ OpenClaw เป็นเจ้าของถูกปฏิเสธเพราะสูญเสียฟิลด์หรือขนาดเมื่อเทียบกับข้อมูลสำรอง last-known-good
    - `Config last-known-good promotion skipped` → candidate มี placeholder ความลับที่ถูกปกปิด เช่น `***`

  </Accordion>
  <Accordion title="Fix options">
    1. รัน `openclaw doctor --fix` เพื่อให้ doctor ซ่อม config ที่มี prefix/ถูกเขียนทับ หรือกู้คืน last-known-good
    2. คัดลอกเฉพาะคีย์ที่ตั้งใจจาก `.clobbered.*` หรือ `.rejected.*` จากนั้นนำไปใช้ด้วย `openclaw config set` หรือ `config.patch`
    3. รัน `openclaw config validate` ก่อนรีสตาร์ต
    4. หากคุณแก้ไขด้วยมือ ให้คง config JSON5 แบบเต็มไว้ ไม่ใช่แค่วัตถุบางส่วนที่คุณต้องการเปลี่ยน
  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Config](/th/cli/config)
- [การกำหนดค่า: hot reload](/th/gateway/configuration#config-hot-reload)
- [การกำหนดค่า: การตรวจสอบแบบเข้มงวด](/th/gateway/configuration#strict-validation)
- [Doctor](/th/gateway/doctor)

## คำเตือนจากการ probe Gateway

ใช้ส่วนนี้เมื่อ `openclaw gateway probe` เข้าถึงบางอย่างได้ แต่ยังพิมพ์บล็อกคำเตือน

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

ตรวจหา:

- `warnings[].code` และ `primaryTargetId` ในเอาต์พุต JSON
- ว่าคำเตือนเกี่ยวกับ fallback ของ SSH, Gateway หลายตัว, ขอบเขตที่ขาดหาย หรือ auth refs ที่ resolve ไม่ได้

ลายเซ็นทั่วไป:

- `SSH tunnel failed to start; falling back to direct probes.` → การตั้งค่า SSH ล้มเหลว แต่คำสั่งยังลอง target ที่กำหนดค่าไว้/loopback โดยตรง
- `multiple reachable gateways detected` → มี target มากกว่าหนึ่งตอบกลับ โดยปกติหมายถึงการตั้งค่า Gateway หลายตัวโดยตั้งใจ หรือ listener ที่ค้าง/ซ้ำ
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → การเชื่อมต่อสำเร็จ แต่ RPC รายละเอียดถูกจำกัดด้วยขอบเขต จับคู่ตัวตนอุปกรณ์หรือใช้ข้อมูลประจำตัวที่มี `operator.read`
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → การเชื่อมต่อสำเร็จ แต่ชุด RPC วินิจฉัยเต็มหมดเวลาหรือล้มเหลว ให้ถือว่าเป็น Gateway ที่เข้าถึงได้พร้อมการวินิจฉัยที่ลดระดับลง เปรียบเทียบ `connect.ok` และ `connect.rpcOk` ในเอาต์พุต `--json`
- `Capability: pairing-pending` หรือ `gateway closed (1008): pairing required` → Gateway ตอบกลับแล้ว แต่ไคลเอนต์นี้ยังต้องจับคู่/อนุมัติก่อนเข้าถึง operator ตามปกติ
- ข้อความเตือน SecretRef ของ `gateway.auth.*` / `gateway.remote.*` ที่ resolve ไม่ได้ → วัสดุยืนยันตัวตนไม่พร้อมใช้งานในพาธคำสั่งนี้สำหรับ target ที่ล้มเหลว

ที่เกี่ยวข้อง:

- [Gateway](/th/cli/gateway)
- [Gateway หลายตัวบนโฮสต์เดียวกัน](/th/gateway#multiple-gateways-same-host)
- [การเข้าถึงระยะไกล](/th/gateway/remote)

## ช่องเชื่อมต่อแล้ว แต่ข้อความไม่ไหล

หากสถานะช่องเชื่อมต่อแล้วแต่การไหลของข้อความหยุด ให้เน้นที่นโยบาย สิทธิ์ และกฎการส่งเฉพาะช่อง

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

ลายเซ็นที่พบบ่อย:

- `mention required` → ข้อความถูกละเว้นโดยนโยบายการกล่าวถึงในกลุ่ม
- `pairing` / ร่องรอยการรออนุมัติ → ผู้ส่งยังไม่ได้รับอนุมัติ
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → ปัญหาการยืนยันตัวตน/สิทธิ์ของช่องทาง

ที่เกี่ยวข้อง:

- [การแก้ปัญหาช่องทาง](/th/channels/troubleshooting)
- [Discord](/th/channels/discord)
- [Telegram](/th/channels/telegram)
- [WhatsApp](/th/channels/whatsapp)

## การส่ง Cron และ Heartbeat

หาก Cron หรือ Heartbeat ไม่ทำงานหรือไม่ได้ส่ง ให้ตรวจสอบสถานะตัวจัดตารางเวลาก่อน แล้วจึงตรวจสอบปลายทางการส่ง

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

มองหา:

- เปิดใช้งาน Cron แล้วและมีเวลาปลุกครั้งถัดไป
- สถานะประวัติการรันงาน (`ok`, `skipped`, `error`)
- เหตุผลที่ Heartbeat ถูกข้าม (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`)

<AccordionGroup>
  <Accordion title="ลายเซ็นที่พบบ่อย">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron ถูกปิดใช้งาน
    - `cron: timer tick failed` → จังหวะเวลาของตัวจัดตารางเวลาล้มเหลว ให้ตรวจสอบข้อผิดพลาดของไฟล์/ล็อก/รันไทม์
    - `heartbeat skipped` พร้อม `reason=quiet-hours` → อยู่นอกช่วงเวลาทำงาน
    - `heartbeat skipped` พร้อม `reason=empty-heartbeat-file` → มี `HEARTBEAT.md` อยู่ แต่มีเฉพาะบรรทัดว่าง / หัวข้อ markdown ดังนั้น OpenClaw จึงข้ามการเรียกโมเดล
    - `heartbeat skipped` พร้อม `reason=no-tasks-due` → `HEARTBEAT.md` มีบล็อก `tasks:` แต่ไม่มีงานใดถึงกำหนดในจังหวะนี้
    - `heartbeat: unknown accountId` → รหัสบัญชีไม่ถูกต้องสำหรับปลายทางการส่ง Heartbeat
    - `heartbeat skipped` พร้อม `reason=dm-blocked` → เป้าหมาย Heartbeat ถูก resolve เป็นปลายทางแบบ DM ขณะที่ `agents.defaults.heartbeat.directPolicy` (หรือ override ต่อเอเจนต์) ถูกตั้งค่าเป็น `block`

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Heartbeat](/th/gateway/heartbeat)
- [งานตามกำหนดเวลา](/th/automation/cron-jobs)
- [งานตามกำหนดเวลา: การแก้ปัญหา](/th/automation/cron-jobs#troubleshooting)

## Node จับคู่แล้ว แต่เครื่องมือล้มเหลว

หาก Node จับคู่แล้วแต่เครื่องมือล้มเหลว ให้แยกตรวจสอบสถานะ foreground, สิทธิ์ และการอนุมัติ

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

มองหา:

- Node ออนไลน์พร้อมความสามารถที่คาดไว้
- การอนุญาตสิทธิ์ของ OS สำหรับกล้อง/ไมโครโฟน/ตำแหน่ง/หน้าจอ
- การอนุมัติ exec และสถานะรายการอนุญาต

ลายเซ็นที่พบบ่อย:

- `NODE_BACKGROUND_UNAVAILABLE` → แอป Node ต้องอยู่ foreground
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → ขาดสิทธิ์ของ OS
- `SYSTEM_RUN_DENIED: approval required` → การอนุมัติ exec ยังรอดำเนินการ
- `SYSTEM_RUN_DENIED: allowlist miss` → คำสั่งถูกบล็อกโดยรายการอนุญาต

ที่เกี่ยวข้อง:

- [การอนุมัติ exec](/th/tools/exec-approvals)
- [การแก้ปัญหา Node](/th/nodes/troubleshooting)
- [Nodes](/th/nodes/index)

## เครื่องมือเบราว์เซอร์ล้มเหลว

ใช้ส่วนนี้เมื่อการทำงานของเครื่องมือเบราว์เซอร์ล้มเหลว แม้ตัว Gateway เองจะทำงานปกติ

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

มองหา:

- มีการตั้งค่า `plugins.allow` หรือไม่ และรวม `browser` ไว้หรือไม่
- เส้นทางไฟล์ปฏิบัติการของเบราว์เซอร์ที่ถูกต้อง
- การเข้าถึงโปรไฟล์ CDP
- ความพร้อมใช้งานของ Chrome ในเครื่องสำหรับโปรไฟล์ `existing-session` / `user`

<AccordionGroup>
  <Accordion title="ลายเซ็น Plugin / ไฟล์ปฏิบัติการ">
    - `unknown command "browser"` หรือ `unknown command 'browser'` → Plugin เบราว์เซอร์ที่บันเดิลมาถูกยกเว้นโดย `plugins.allow`
    - เครื่องมือเบราว์เซอร์ขาดหาย / ไม่พร้อมใช้งานขณะที่ `browser.enabled=true` → `plugins.allow` ไม่รวม `browser` ดังนั้น Plugin จึงไม่เคยโหลด
    - `Failed to start Chrome CDP on port` → กระบวนการเบราว์เซอร์เริ่มทำงานไม่สำเร็จ
    - `browser.executablePath not found` → เส้นทางที่กำหนดค่าไม่ถูกต้อง
    - `browser.cdpUrl must be http(s) or ws(s)` → URL ของ CDP ที่กำหนดค่าใช้ scheme ที่ไม่รองรับ เช่น `file:` หรือ `ftp:`
    - `browser.cdpUrl has invalid port` → URL ของ CDP ที่กำหนดค่ามีพอร์ตไม่ถูกต้องหรืออยู่นอกช่วง
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → การติดตั้ง Gateway ปัจจุบันขาด dependency รันไทม์เบราว์เซอร์หลัก ให้ติดตั้งใหม่หรืออัปเดต OpenClaw แล้วรีสตาร์ท Gateway สแนปช็อต ARIA และภาพหน้าจอพื้นฐานของหน้าเว็บยังคงทำงานได้ แต่การนำทาง, สแนปช็อต AI, ภาพหน้าจอองค์ประกอบด้วย CSS-selector และการส่งออก PDF ยังคงไม่พร้อมใช้งาน

  </Accordion>
  <Accordion title="ลายเซ็น Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → existing-session ของ Chrome MCP ยังไม่สามารถแนบกับไดเรกทอรีข้อมูลเบราว์เซอร์ที่เลือกได้ เปิดหน้าตรวจสอบของเบราว์เซอร์ เปิดใช้ remote debugging เปิดเบราว์เซอร์ค้างไว้ อนุมัติพรอมป์แนบครั้งแรก แล้วลองใหม่ หากไม่ต้องใช้สถานะการลงชื่อเข้าใช้ ให้ใช้โปรไฟล์ `openclaw` ที่จัดการให้แทน
    - `No Chrome tabs found for profile="user"` → โปรไฟล์แนบของ Chrome MCP ไม่มีแท็บ Chrome ในเครื่องที่เปิดอยู่
    - `Remote CDP for profile "<name>" is not reachable` → ปลายทาง remote CDP ที่กำหนดค่าไม่สามารถเข้าถึงได้จากโฮสต์ Gateway
    - `Browser attachOnly is enabled ... not reachable` หรือ `Browser attachOnly is enabled and CDP websocket ... is not reachable` → โปรไฟล์ attach-only ไม่มีเป้าหมายที่เข้าถึงได้ หรือ HTTP endpoint ตอบกลับแล้วแต่ยังไม่สามารถเปิด CDP WebSocket ได้

  </Accordion>
  <Accordion title="ลายเซ็นองค์ประกอบ / ภาพหน้าจอ / อัปโหลด">
    - `fullPage is not supported for element screenshots` → คำขอภาพหน้าจอผสม `--full-page` กับ `--ref` หรือ `--element`
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → การเรียกภาพหน้าจอของ Chrome MCP / `existing-session` ต้องใช้การจับภาพหน้าเว็บหรือ `--ref` จากสแนปช็อต ไม่ใช่ CSS `--element`
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → ฮุกอัปโหลดของ Chrome MCP ต้องใช้ refs จากสแนปช็อต ไม่ใช่ CSS selectors
    - `existing-session file uploads currently support one file at a time.` → ส่งไฟล์อัปโหลดหนึ่งไฟล์ต่อหนึ่งการเรียกบนโปรไฟล์ Chrome MCP
    - `existing-session dialog handling does not support timeoutMs.` → ฮุกกล่องโต้ตอบบนโปรไฟล์ Chrome MCP ไม่รองรับการ override timeout
    - `existing-session type does not support timeoutMs overrides.` → ละเว้น `timeoutMs` สำหรับ `act:type` บน `profile="user"` / โปรไฟล์ existing-session ของ Chrome MCP หรือใช้โปรไฟล์เบราว์เซอร์แบบ managed/CDP เมื่อต้องกำหนด timeout เอง
    - `existing-session evaluate does not support timeoutMs overrides.` → ละเว้น `timeoutMs` สำหรับ `act:evaluate` บน `profile="user"` / โปรไฟล์ existing-session ของ Chrome MCP หรือใช้โปรไฟล์เบราว์เซอร์แบบ managed/CDP เมื่อต้องกำหนด timeout เอง
    - `response body is not supported for existing-session profiles yet.` → `responsebody` ยังต้องใช้เบราว์เซอร์ที่จัดการให้หรือโปรไฟล์ CDP แบบ raw
    - viewport / dark-mode / locale / offline overrides ที่ค้างอยู่บนโปรไฟล์ attach-only หรือ remote CDP → รัน `openclaw browser stop --browser-profile <name>` เพื่อปิดเซสชันควบคุมที่ใช้งานอยู่และปล่อยสถานะ emulation ของ Playwright/CDP โดยไม่ต้องรีสตาร์ท Gateway ทั้งหมด

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [เบราว์เซอร์ (จัดการโดย OpenClaw)](/th/tools/browser)
- [การแก้ปัญหาเบราว์เซอร์](/th/tools/browser-linux-troubleshooting)

## หากคุณอัปเกรดแล้วบางอย่างเสียกะทันหัน

ปัญหาส่วนใหญ่หลังอัปเกรดคือ config drift หรือค่าเริ่มต้นที่เข้มงวดขึ้นซึ่งตอนนี้ถูกบังคับใช้

<AccordionGroup>
  <Accordion title="1. พฤติกรรมการยืนยันตัวตนและการ override URL เปลี่ยนไป">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    สิ่งที่ต้องตรวจสอบ:

    - หาก `gateway.mode=remote` การเรียก CLI อาจกำลังชี้ไปที่ remote ขณะที่บริการในเครื่องของคุณปกติ
    - การเรียก `--url` แบบระบุชัดเจนจะไม่ fallback ไปใช้ข้อมูลประจำตัวที่เก็บไว้

    ลายเซ็นที่พบบ่อย:

    - `gateway connect failed:` → เป้าหมาย URL ไม่ถูกต้อง
    - `unauthorized` → endpoint เข้าถึงได้แต่การยืนยันตัวตนไม่ถูกต้อง

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

    - การ bind ที่ไม่ใช่ loopback (`lan`, `tailnet`, `custom`) ต้องมีเส้นทางยืนยันตัวตนของ Gateway ที่ถูกต้อง: การยืนยันตัวตนด้วย token/password ที่ใช้ร่วมกัน หรือ deployment `trusted-proxy` แบบไม่ใช่ loopback ที่กำหนดค่าอย่างถูกต้อง
    - คีย์เก่าอย่าง `gateway.token` ไม่ได้แทนที่ `gateway.auth.token`

    ลายเซ็นที่พบบ่อย:

    - `refusing to bind gateway ... without auth` → bind แบบไม่ใช่ loopback โดยไม่มีเส้นทางยืนยันตัวตนของ Gateway ที่ถูกต้อง
    - `Connectivity probe: failed` ขณะที่รันไทม์กำลังทำงาน → Gateway ยังทำงานอยู่แต่เข้าถึงไม่ได้ด้วย auth/url ปัจจุบัน

  </Accordion>
  <Accordion title="3. สถานะการจับคู่และตัวตนอุปกรณ์เปลี่ยนไป">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    สิ่งที่ต้องตรวจสอบ:

    - การอนุมัติอุปกรณ์ที่รอดำเนินการสำหรับแดชบอร์ด/Nodes
    - การอนุมัติการจับคู่ DM ที่รอดำเนินการหลังเปลี่ยนนโยบายหรือตัวตน

    ลายเซ็นที่พบบ่อย:

    - `device identity required` → ยังไม่ผ่านการยืนยันตัวตนอุปกรณ์
    - `pairing required` → ผู้ส่ง/อุปกรณ์ต้องได้รับอนุมัติ

  </Accordion>
</AccordionGroup>

หาก config ของบริการและรันไทม์ยังไม่ตรงกันหลังตรวจสอบแล้ว ให้ติดตั้ง metadata ของบริการใหม่จากไดเรกทอรีโปรไฟล์/สถานะเดียวกัน:

```bash
openclaw gateway install --force
openclaw gateway restart
```

ที่เกี่ยวข้อง:

- [การยืนยันตัวตน](/th/gateway/authentication)
- [Background exec และเครื่องมือ process](/th/gateway/background-process)
- [การจับคู่ที่ Gateway เป็นเจ้าของ](/th/gateway/pairing)

## ที่เกี่ยวข้อง

- [Doctor](/th/gateway/doctor)
- [FAQ](/th/help/faq)
- [รันบุ๊ก Gateway](/th/gateway)
