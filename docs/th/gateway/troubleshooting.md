---
read_when:
    - ศูนย์รวมการแก้ไขปัญหานำคุณมาที่นี่เพื่อการวินิจฉัยเชิงลึกยิ่งขึ้น
    - คุณต้องมีส่วนคู่มือปฏิบัติการที่อิงตามอาการอย่างคงเส้นคงวา พร้อมคำสั่งที่แน่นอน
sidebarTitle: Troubleshooting
summary: คู่มือปฏิบัติการแก้ไขปัญหาเชิงลึกสำหรับ Gateway, ช่องทาง, ระบบอัตโนมัติ, Node และเบราว์เซอร์
title: การแก้ไขปัญหา
x-i18n:
    generated_at: "2026-04-30T09:56:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48735a68daa92678867a9cafb3ceeb37063bb91dee8c4c94e185f74eb0296fcb
    source_path: gateway/troubleshooting.md
    workflow: 16
---

หน้านี้คือ runbook เชิงลึก เริ่มที่ [/help/troubleshooting](/th/help/troubleshooting) หากคุณต้องการลำดับการคัดแยกปัญหาแบบรวดเร็วก่อน

## ลำดับคำสั่ง

เรียกใช้คำสั่งเหล่านี้ก่อน ตามลำดับนี้:

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
- `openclaw channels status --probe` แสดงสถานะ transport แบบสดแยกตามบัญชี และเมื่อรองรับ จะแสดงผล probe/audit เช่น `works` หรือ `audit ok`

## การติดตั้งแบบ split brain และตัวป้องกัน config ที่ใหม่กว่า

ใช้ส่วนนี้เมื่อบริการ gateway หยุดโดยไม่คาดคิดหลังการอัปเดต หรือ logs แสดงว่า binary `openclaw` ตัวหนึ่งเก่ากว่าเวอร์ชันที่เขียน `openclaw.json` ล่าสุด

OpenClaw ประทับ config ที่เขียนด้วย `meta.lastTouchedVersion` คำสั่งแบบอ่านอย่างเดียวยังสามารถตรวจสอบ config ที่เขียนโดย OpenClaw เวอร์ชันใหม่กว่าได้ แต่การเปลี่ยนแปลง process และ service จะปฏิเสธการดำเนินการต่อจาก binary ที่เก่ากว่า การกระทำที่ถูกบล็อกประกอบด้วยการ start, stop, restart, uninstall บริการ gateway, การติดตั้งบริการใหม่แบบบังคับ, การเริ่ม gateway ใน service-mode และการล้างพอร์ตด้วย `gateway --force`

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="แก้ PATH">
    แก้ `PATH` เพื่อให้ `openclaw` resolve ไปยังการติดตั้งที่ใหม่กว่า แล้วเรียกใช้การกระทำนั้นอีกครั้ง
  </Step>
  <Step title="ติดตั้งบริการ gateway ใหม่">
    ติดตั้งบริการ gateway ที่ต้องการใหม่จากการติดตั้งที่ใหม่กว่า:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="ลบ wrappers ที่ค้างอยู่">
    ลบ system package ที่ค้างอยู่หรือรายการ wrapper เก่าที่ยังชี้ไปยัง binary `openclaw` เก่า
  </Step>
</Steps>

<Warning>
สำหรับการ downgrade โดยตั้งใจหรือการกู้คืนฉุกเฉินเท่านั้น ให้ตั้ง `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` สำหรับคำสั่งเดียวนั้น ปล่อยให้ไม่ได้ตั้งค่าไว้สำหรับการทำงานปกติ
</Warning>

## Anthropic 429 ต้องมีการใช้งานเพิ่มเติมสำหรับ context ยาว

ใช้ส่วนนี้เมื่อ logs/errors มีข้อความ: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

ตรวจหา:

- โมเดล Anthropic Opus/Sonnet ที่เลือกมี `params.context1m: true`
- credential ของ Anthropic ปัจจุบันไม่มีสิทธิ์ใช้งาน long-context
- คำขอล้มเหลวเฉพาะ session/model runs ที่ยาวซึ่งต้องใช้เส้นทาง 1M beta

ตัวเลือกการแก้ไข:

<Steps>
  <Step title="ปิดใช้งาน context1m">
    ปิดใช้งาน `context1m` สำหรับโมเดลนั้นเพื่อ fallback ไปยัง context window ปกติ
  </Step>
  <Step title="ใช้ credential ที่มีสิทธิ์">
    ใช้ credential ของ Anthropic ที่มีสิทธิ์สำหรับคำขอ long-context หรือเปลี่ยนไปใช้ Anthropic API key
  </Step>
  <Step title="กำหนดค่าโมเดล fallback">
    กำหนดค่าโมเดล fallback เพื่อให้ runs ดำเนินต่อได้เมื่อคำขอ long-context ของ Anthropic ถูกปฏิเสธ
  </Step>
</Steps>

ที่เกี่ยวข้อง:

- [Anthropic](/th/providers/anthropic)
- [การใช้ token และค่าใช้จ่าย](/th/reference/token-use)
- [ทำไมฉันจึงเห็น HTTP 429 จาก Anthropic?](/th/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## backend ภายในเครื่องที่เข้ากันได้กับ OpenAI ผ่านการ probe โดยตรงแต่ agent runs ล้มเหลว

ใช้ส่วนนี้เมื่อ:

- `curl ... /v1/models` ใช้งานได้
- การเรียก `/v1/chat/completions` โดยตรงขนาดเล็กใช้งานได้
- การรันโมเดลของ OpenClaw ล้มเหลวเฉพาะใน agent turns ปกติ

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

ตรวจหา:

- การเรียกโดยตรงขนาดเล็กสำเร็จ แต่การรันของ OpenClaw ล้มเหลวเฉพาะกับ prompts ที่ใหญ่กว่า
- ข้อผิดพลาด `model_not_found` หรือ 404 แม้ว่า `/v1/chat/completions` โดยตรง
  จะใช้งานได้กับ model id แบบเปล่าตัวเดียวกัน
- ข้อผิดพลาดจาก backend เกี่ยวกับ `messages[].content` ที่คาดหวัง string
- คำเตือน `incomplete turn detected ... stopReason=stop payloads=0` เป็นครั้งคราวกับ backend ภายในเครื่องที่เข้ากันได้กับ OpenAI
- backend crashes ที่ปรากฏเฉพาะเมื่อจำนวน prompt-token ใหญ่ขึ้นหรือเมื่อใช้ prompts ของ agent runtime แบบเต็ม

<AccordionGroup>
  <Accordion title="ลักษณะทั่วไป">
    - `model_not_found` กับเซิร์ฟเวอร์ภายในเครื่องสไตล์ MLX/vLLM → ตรวจสอบว่า `baseUrl` มี `/v1`, `api` เป็น `"openai-completions"` สำหรับ backend แบบ `/v1/chat/completions` และ `models.providers.<provider>.models[].id` เป็น id ภายใน provider แบบเปล่า เลือกด้วย provider prefix หนึ่งครั้ง เช่น `mlx/mlx-community/Qwen3-30B-A3B-6bit`; เก็บรายการ catalog เป็น `mlx-community/Qwen3-30B-A3B-6bit`
    - `messages[...].content: invalid type: sequence, expected a string` → backend ปฏิเสธ structured Chat Completions content parts วิธีแก้: ตั้ง `models.providers.<provider>.models[].compat.requiresStringContent: true`
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend ทำคำขอ Chat Completions เสร็จแล้ว แต่ไม่ส่งคืนข้อความ assistant ที่ผู้ใช้มองเห็นสำหรับ turn นั้น OpenClaw จะ retry turns ว่างที่เข้ากันได้กับ OpenAI และ replay-safe หนึ่งครั้ง ความล้มเหลวต่อเนื่องมักหมายความว่า backend กำลังส่ง content ว่าง/ไม่ใช่ข้อความ หรือ suppress ข้อความ final-answer
    - คำขอโดยตรงขนาดเล็กสำเร็จ แต่ OpenClaw agent runs ล้มเหลวด้วย backend/model crashes (เช่น Gemma บน build `inferrs` บางรุ่น) → transport ของ OpenClaw น่าจะถูกต้องอยู่แล้ว; backend กำลังล้มเหลวกับรูปทรง prompt ขนาดใหญ่ของ agent-runtime
    - ความล้มเหลวลดลงหลังปิดใช้งาน tools แต่ไม่หายไป → tool schemas เป็นส่วนหนึ่งของแรงกดดัน แต่ปัญหาที่เหลือยังคงเป็นความจุของโมเดล/เซิร์ฟเวอร์ upstream หรือ bug ของ backend

  </Accordion>
  <Accordion title="ตัวเลือกการแก้ไข">
    1. ตั้ง `compat.requiresStringContent: true` สำหรับ backend Chat Completions ที่รองรับเฉพาะ string
    2. ตั้ง `compat.supportsTools: false` สำหรับโมเดล/backend ที่ไม่สามารถจัดการพื้นผิว tool schema ของ OpenClaw ได้อย่างเชื่อถือได้
    3. ลดแรงกดดันของ prompt เมื่อทำได้: workspace bootstrap ที่เล็กลง, ประวัติ session ที่สั้นลง, โมเดลภายในเครื่องที่เบากว่า หรือ backend ที่รองรับ long-context ได้ดีกว่า
    4. หากคำขอโดยตรงขนาดเล็กยังผ่าน แต่ OpenClaw agent turns ยังคง crash ภายใน backend ให้ถือว่าเป็นข้อจำกัดของเซิร์ฟเวอร์/โมเดล upstream และยื่น repro ที่นั่นพร้อมรูปทรง payload ที่รับได้
  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [การกำหนดค่า](/th/gateway/configuration)
- [โมเดลภายในเครื่อง](/th/gateway/local-models)
- [endpoints ที่เข้ากันได้กับ OpenAI](/th/gateway/configuration-reference#openai-compatible-endpoints)

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
- การ gate การ mention ในกลุ่ม (`requireMention`, `mentionPatterns`)
- allowlist ของ Channel/group ไม่ตรงกัน

ลักษณะทั่วไป:

- `drop guild message (mention required` → ข้อความกลุ่มถูกละเว้นจนกว่าจะมี mention
- `pairing request` → ผู้ส่งต้องได้รับการอนุมัติ
- `blocked` / `allowlist` → ผู้ส่ง/channel ถูกกรองโดย policy

ที่เกี่ยวข้อง:

- [การแก้ปัญหา Channel](/th/channels/troubleshooting)
- [กลุ่ม](/th/channels/groups)
- [Pairing](/th/channels/pairing)

## การเชื่อมต่อ UI ควบคุมของแดชบอร์ด

เมื่อ dashboard/control UI ไม่เชื่อมต่อ ให้ตรวจสอบ URL, โหมด auth และสมมติฐานเรื่อง secure context

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

ตรวจหา:

- probe URL และ dashboard URL ที่ถูกต้อง
- โหมด auth/token ไม่ตรงกันระหว่าง client และ gateway
- การใช้ HTTP ในจุดที่ต้องมี device identity

<AccordionGroup>
  <Accordion title="ลักษณะการเชื่อมต่อ / auth">
    - `device identity required` → context ไม่ปลอดภัยหรือไม่มี device auth
    - `origin not allowed` → browser `Origin` ไม่อยู่ใน `gateway.controlUi.allowedOrigins` (หรือคุณกำลังเชื่อมต่อจาก browser origin ที่ไม่ใช่ loopback โดยไม่มี allowlist แบบชัดเจน)
    - `device nonce required` / `device nonce mismatch` → client ไม่ได้ทำ challenge-based device auth flow ให้ครบ (`connect.challenge` + `device.nonce`)
    - `device signature invalid` / `device signature expired` → client ลงนาม payload ผิด (หรือ timestamp เก่า) สำหรับ handshake ปัจจุบัน
    - `AUTH_TOKEN_MISMATCH` พร้อม `canRetryWithDeviceToken=true` → client สามารถ retry แบบ trusted หนึ่งครั้งด้วย device token ที่ cache ไว้
    - การ retry ด้วย cached-token นั้นใช้ชุด scope ที่ cache ไว้ซึ่งจัดเก็บกับ paired device token ผู้เรียกที่ระบุ `deviceToken` / `scopes` แบบชัดเจนจะคงชุด scope ที่ร้องขอไว้แทน
    - นอกเส้นทาง retry นั้น ลำดับความสำคัญของ connect auth คือ shared token/password ที่ระบุชัดเจนก่อน จากนั้น `deviceToken` ที่ระบุชัดเจน จากนั้น stored device token แล้วจึง bootstrap token
    - บนเส้นทาง async Tailscale Serve Control UI ความพยายามที่ล้มเหลวสำหรับ `{scope, ip}` เดียวกันจะถูก serialize ก่อนที่ limiter จะบันทึกความล้มเหลว ดังนั้น retry ที่ผิดพลาดพร้อมกันสองครั้งจาก client เดียวกันอาจแสดง `retry later` ในความพยายามครั้งที่สองแทน mismatches ธรรมดาสองครั้ง
    - `too many failed authentication attempts (retry later)` จาก browser-origin loopback client → ความล้มเหลวซ้ำจาก `Origin` เดียวกันที่ normalize แล้วถูกล็อกชั่วคราว; origin localhost อื่นใช้ bucket แยกต่างหาก
    - `unauthorized` ซ้ำหลัง retry นั้น → shared token/device token drift; refresh config token และ re-approve/rotate device token หากจำเป็น
    - `gateway connect failed:` → เป้าหมาย host/port/url ผิด

  </Accordion>
</AccordionGroup>

### แผนที่ย่อของ auth detail codes

ใช้ `error.details.code` จาก response `connect` ที่ล้มเหลวเพื่อเลือกการกระทำถัดไป:

| รหัสรายละเอียด              | ความหมาย                                                                                                                                                                                      | การดำเนินการที่แนะนำ                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Client ไม่ได้ส่ง shared token ที่จำเป็น                                                                                                                                                 | วาง/ตั้งค่า token ใน client แล้วลองใหม่ สำหรับเส้นทาง dashboard: `openclaw config get gateway.auth.token` แล้ววางลงในการตั้งค่า Control UI                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | shared token ไม่ตรงกับ gateway auth token                                                                                                                                               | หาก `canRetryWithDeviceToken=true` ให้อนุญาตการลองใหม่ที่เชื่อถือได้หนึ่งครั้ง การลองใหม่ด้วย cached-token จะใช้ scopes ที่อนุมัติและจัดเก็บไว้ซ้ำ ส่วนผู้เรียก `deviceToken` / `scopes` แบบชัดเจนจะคง scopes ที่ร้องขอไว้ หากยังล้มเหลว ให้เรียกใช้ [รายการตรวจสอบการกู้คืน token drift](/th/cli/devices#token-drift-recovery-checklist) |
| `AUTH_DEVICE_TOKEN_MISMATCH` | token ต่ออุปกรณ์ที่แคชไว้หมดอายุหรือถูกเพิกถอน                                                                                                                                                 | หมุนเวียน/อนุมัติ device token ใหม่โดยใช้ [devices CLI](/th/cli/devices) แล้วเชื่อมต่อใหม่                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | Device identity ต้องได้รับการอนุมัติ ตรวจสอบ `error.details.reason` สำหรับ `not-paired`, `scope-upgrade`, `role-upgrade` หรือ `metadata-upgrade` และใช้ `requestId` / `remediationHint` เมื่อมี | อนุมัติคำขอที่รอดำเนินการ: `openclaw devices list` แล้ว `openclaw devices approve <requestId>` การอัปเกรด scope/role ใช้ flow เดียวกันหลังจากคุณตรวจสอบสิทธิ์การเข้าถึงที่ร้องขอแล้ว                                                                                                               |

<Note>
RPC backend loopback โดยตรงที่ยืนยันตัวตนด้วย shared gateway token/password ไม่ควรขึ้นกับ paired-device scope baseline ของ CLI หาก subagents หรือการเรียกภายในอื่น ๆ ยังคงล้มเหลวด้วย `scope-upgrade` ให้ตรวจสอบว่าผู้เรียกใช้ `client.id: "gateway-client"` และ `client.mode: "backend"` และไม่ได้บังคับใช้ `deviceIdentity` หรือ device token แบบชัดเจน
</Note>

การตรวจสอบการย้ายข้อมูล Device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

หาก logs แสดงข้อผิดพลาด nonce/signature ให้อัปเดต client ที่เชื่อมต่อและตรวจสอบ:

<Steps>
  <Step title="Wait for connect.challenge">
    Client รอ `connect.challenge` ที่ออกโดย Gateway
  </Step>
  <Step title="Sign the payload">
    Client ลงนาม payload ที่ผูกกับ challenge
  </Step>
  <Step title="Send the device nonce">
    Client ส่ง `connect.params.device.nonce` พร้อม challenge nonce เดียวกัน
  </Step>
</Steps>

หาก `openclaw devices rotate` / `revoke` / `remove` ถูกปฏิเสธโดยไม่คาดคิด:

- session ของ paired-device token สามารถจัดการได้เฉพาะอุปกรณ์ **ของตัวเอง** เว้นแต่ผู้เรียกจะมี `operator.admin` ด้วย
- `openclaw devices rotate --scope ...` สามารถร้องขอ operator scopes ได้เฉพาะที่ session ของผู้เรียกมีอยู่แล้ว

ที่เกี่ยวข้อง:

- [การกำหนดค่า](/th/gateway/configuration) (โหมด gateway auth)
- [Control UI](/th/web/control-ui)
- [Devices](/th/cli/devices)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [Trusted proxy auth](/th/gateway/trusted-proxy-auth)

## Gateway service ไม่ได้ทำงาน

ใช้ส่วนนี้เมื่อ service ถูกติดตั้งแล้ว แต่ process ไม่คงอยู่

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

มองหา:

- `Runtime: stopped` พร้อมคำใบ้ exit
- config ของ service ไม่ตรงกัน (`Config (cli)` เทียบกับ `Config (service)`)
- port/listener ขัดแย้งกัน
- การติดตั้ง launchd/systemd/schtasks เพิ่มเติมเมื่อใช้ `--deep`
- คำใบ้การ cleanup ของ `Other gateway-like services detected (best effort)`

<AccordionGroup>
  <Accordion title="Common signatures">
    - `Gateway start blocked: set gateway.mode=local` หรือ `existing config is missing gateway.mode` → โหมด Gateway local ไม่ได้เปิดใช้งาน หรือไฟล์ config ถูกเขียนทับจนสูญเสีย `gateway.mode` วิธีแก้: ตั้งค่า `gateway.mode="local"` ใน config ของคุณ หรือเรียกใช้ `openclaw onboard --mode local` / `openclaw setup` อีกครั้งเพื่อประทับค่า config โหมด local ที่คาดไว้ใหม่ หากคุณกำลังเรียกใช้ OpenClaw ผ่าน Podman เส้นทาง config เริ่มต้นคือ `~/.openclaw/openclaw.json`
    - `refusing to bind gateway ... without auth` → การ bind ที่ไม่ใช่ loopback โดยไม่มีเส้นทาง gateway auth ที่ถูกต้อง (token/password หรือ trusted-proxy เมื่อกำหนดค่าไว้)
    - `another gateway instance is already listening` / `EADDRINUSE` → port ขัดแย้งกัน
    - `Other gateway-like services detected (best effort)` → มีหน่วย launchd/systemd/schtasks ที่ค้างหรือทำงานคู่ขนานอยู่ การตั้งค่าส่วนใหญ่ควรมี Gateway หนึ่งตัวต่อเครื่อง หากคุณต้องการมากกว่าหนึ่งจริง ๆ ให้แยก ports + config/state/workspace ดู [/gateway#multiple-gateways-same-host](/th/gateway#multiple-gateways-same-host)
    - `System-level OpenClaw gateway service detected` จาก doctor → มี systemd system unit อยู่ขณะที่ user-level service ขาดหาย ลบหรือปิดใช้งานตัวซ้ำก่อนอนุญาตให้ doctor ติดตั้ง user service หรือตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` หาก system unit เป็น supervisor ที่ตั้งใจใช้
    - `Gateway service port does not match current gateway config` → supervisor ที่ติดตั้งไว้ยังคงตรึง `--port` เดิม เรียกใช้ `openclaw doctor --fix` หรือ `openclaw gateway install --force` แล้ว restart gateway service

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Background exec และ process tool](/th/gateway/background-process)
- [การกำหนดค่า](/th/gateway/configuration)
- [Doctor](/th/gateway/doctor)

## Gateway กู้คืน config last-known-good

ใช้ส่วนนี้เมื่อ Gateway เริ่มทำงาน แต่ logs ระบุว่าได้กู้คืน `openclaw.json`

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

มองหา:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- ไฟล์ `openclaw.json.clobbered.*` ที่มี timestamp อยู่ข้าง config ที่ใช้งานอยู่
- system event ของ main-agent ที่ขึ้นต้นด้วย `Config recovery warning`

<AccordionGroup>
  <Accordion title="What happened">
    - config ที่ถูกปฏิเสธไม่ผ่านการ validate ระหว่าง startup หรือ hot reload
    - OpenClaw เก็บ payload ที่ถูกปฏิเสธไว้เป็น `.clobbered.*`
    - config ที่ใช้งานอยู่ถูกกู้คืนจากสำเนา last-known-good ล่าสุดที่ validate แล้ว
    - turn ถัดไปของ main-agent จะได้รับคำเตือนว่าอย่าเขียน config ที่ถูกปฏิเสธใหม่แบบไม่ตรวจสอบ
    - หากปัญหา validation ทั้งหมดอยู่ภายใต้ `plugins.entries.<id>...` OpenClaw จะไม่กู้คืนทั้งไฟล์ ความล้มเหลวเฉพาะ Plugin จะยังคงแจ้งชัด ขณะที่การตั้งค่าผู้ใช้ที่ไม่เกี่ยวข้องยังคงอยู่ใน config ที่ใช้งานอยู่

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
    - มี `.clobbered.*` → การแก้ไขโดยตรงจากภายนอกหรือการอ่านขณะ startup ถูกกู้คืน
    - มี `.rejected.*` → การเขียน config ที่ OpenClaw เป็นเจ้าของไม่ผ่าน schema หรือ clobber checks ก่อน commit
    - `Config write rejected:` → การเขียนพยายามลบ shape ที่จำเป็น ลดขนาดไฟล์ลงอย่างมาก หรือ persist config ที่ไม่ถูกต้อง
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` หรือ `size-drop-vs-last-good:*` → startup ถือว่าไฟล์ปัจจุบันถูก clobber เพราะสูญเสีย fields หรือขนาดเมื่อเทียบกับ backup last-known-good
    - `Config last-known-good promotion skipped` → candidate มี redacted secret placeholders เช่น `***`

  </Accordion>
  <Accordion title="Fix options">
    1. เก็บ config ที่ใช้งานอยู่ซึ่งถูกกู้คืนไว้ หากถูกต้อง
    2. คัดลอกเฉพาะ keys ที่ตั้งใจจาก `.clobbered.*` หรือ `.rejected.*` แล้ว apply ด้วย `openclaw config set` หรือ `config.patch`
    3. เรียกใช้ `openclaw config validate` ก่อน restart
    4. หากคุณแก้ไขด้วยมือ ให้เก็บ config JSON5 แบบเต็ม ไม่ใช่เฉพาะ partial object ที่คุณต้องการเปลี่ยน
  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Config](/th/cli/config)
- [การกำหนดค่า: hot reload](/th/gateway/configuration#config-hot-reload)
- [การกำหนดค่า: strict validation](/th/gateway/configuration#strict-validation)
- [Doctor](/th/gateway/doctor)

## คำเตือนจาก Gateway probe

ใช้ส่วนนี้เมื่อ `openclaw gateway probe` เข้าถึงบางอย่างได้ แต่ยังพิมพ์ warning block

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

มองหา:

- `warnings[].code` และ `primaryTargetId` ใน output JSON
- คำเตือนเกี่ยวกับ SSH fallback, Gateways หลายตัว, scopes ที่ขาดหาย หรือ auth refs ที่ resolve ไม่ได้

signature ทั่วไป:

- `SSH tunnel failed to start; falling back to direct probes.` → การตั้งค่า SSH ล้มเหลว แต่ command ยังคงลอง target แบบ configured/direct loopback
- `multiple reachable gateways detected` → มี target มากกว่าหนึ่งตัวตอบกลับ โดยปกติหมายถึงการตั้งค่า multi-gateway ที่ตั้งใจไว้ หรือ listeners ที่ค้าง/ซ้ำ
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → connect สำเร็จ แต่ detail RPC ถูกจำกัดด้วย scope ให้ pair device identity หรือใช้ credentials ที่มี `operator.read`
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → connect สำเร็จ แต่ชุด diagnostic RPC แบบเต็ม timeout หรือล้มเหลว ให้ถือว่านี่คือ Gateway ที่เข้าถึงได้พร้อม diagnostics ที่ลดระดับลง เปรียบเทียบ `connect.ok` และ `connect.rpcOk` ใน output `--json`
- `Capability: pairing-pending` หรือ `gateway closed (1008): pairing required` → Gateway ตอบกลับแล้ว แต่ client นี้ยังต้องจับคู่/อนุมัติก่อนเข้าถึง operator ตามปกติ
- ข้อความคำเตือน SecretRef ของ `gateway.auth.*` / `gateway.remote.*` ที่ resolve ไม่ได้ → auth material ไม่พร้อมใช้งานใน command path นี้สำหรับ target ที่ล้มเหลว

ที่เกี่ยวข้อง:

- [Gateway](/th/cli/gateway)
- [Gateways หลายตัวบน host เดียวกัน](/th/gateway#multiple-gateways-same-host)
- [การเข้าถึงระยะไกล](/th/gateway/remote)

## Channel เชื่อมต่อแล้ว แต่ messages ไม่ไหล

หากสถานะ channel เชื่อมต่อแล้ว แต่ message flow หยุด ให้เน้นที่ policy, permissions และกฎการส่งมอบเฉพาะ channel

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

มองหา:

- DM policy (`pairing`, `allowlist`, `open`, `disabled`)
- Group allowlist และข้อกำหนดการ mention
- permissions/scopes ของ channel API ที่ขาดหาย

signature ทั่วไป:

- `mention required` → ข้อความถูกละเว้นโดยนโยบายการ mention ของกลุ่ม
- ร่องรอย `pairing` / การอนุมัติที่รอดำเนินการ → ผู้ส่งยังไม่ได้รับการอนุมัติ
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → ปัญหาการยืนยันตัวตน/สิทธิ์ของช่องทาง

ที่เกี่ยวข้อง:

- [การแก้ปัญหาช่องทาง](/th/channels/troubleshooting)
- [Discord](/th/channels/discord)
- [Telegram](/th/channels/telegram)
- [WhatsApp](/th/channels/whatsapp)

## การส่ง Cron และ Heartbeat

หาก cron หรือ heartbeat ไม่ทำงานหรือไม่ส่ง ให้ตรวจสอบสถานะตัวจัดกำหนดการก่อน จากนั้นจึงตรวจสอบเป้าหมายการส่ง

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

มองหา:

- Cron เปิดใช้งานอยู่และมีเวลาปลุกถัดไป
- สถานะประวัติการรันงาน (`ok`, `skipped`, `error`)
- เหตุผลที่ข้าม Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`)

<AccordionGroup>
  <Accordion title="Common signatures">
    - `cron: scheduler disabled; jobs will not run automatically` → cron ถูกปิดใช้งาน
    - `cron: timer tick failed` → tick ของตัวจัดกำหนดการล้มเหลว ให้ตรวจสอบข้อผิดพลาดของไฟล์/บันทึก/runtime
    - `heartbeat skipped` พร้อม `reason=quiet-hours` → อยู่นอกช่วงเวลาที่เปิดใช้งาน
    - `heartbeat skipped` พร้อม `reason=empty-heartbeat-file` → `HEARTBEAT.md` มีอยู่แต่มีเพียงบรรทัดว่าง / หัวข้อ markdown ดังนั้น OpenClaw จึงข้ามการเรียกโมเดล
    - `heartbeat skipped` พร้อม `reason=no-tasks-due` → `HEARTBEAT.md` มีบล็อก `tasks:` แต่ไม่มีงานใดถึงกำหนดใน tick นี้
    - `heartbeat: unknown accountId` → id บัญชีไม่ถูกต้องสำหรับเป้าหมายการส่ง heartbeat
    - `heartbeat skipped` พร้อม `reason=dm-blocked` → เป้าหมาย heartbeat ถูกระบุเป็นปลายทางแบบ DM ขณะที่ `agents.defaults.heartbeat.directPolicy` (หรือการตั้งค่าทับราย agent) ถูกตั้งเป็น `block`

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Heartbeat](/th/gateway/heartbeat)
- [งานตามกำหนดเวลา](/th/automation/cron-jobs)
- [งานตามกำหนดเวลา: การแก้ปัญหา](/th/automation/cron-jobs#troubleshooting)

## Node จับคู่แล้ว แต่เครื่องมือล้มเหลว

หาก node จับคู่แล้วแต่เครื่องมือล้มเหลว ให้แยกตรวจสอบสถานะ foreground, สิทธิ์ และสถานะการอนุมัติ

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
- การอนุมัติ exec และสถานะ allowlist

ลายเซ็นที่พบบ่อย:

- `NODE_BACKGROUND_UNAVAILABLE` → แอป node ต้องอยู่ใน foreground
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → ขาดสิทธิ์ของ OS
- `SYSTEM_RUN_DENIED: approval required` → การอนุมัติ exec รอดำเนินการ
- `SYSTEM_RUN_DENIED: allowlist miss` → คำสั่งถูกบล็อกโดย allowlist

ที่เกี่ยวข้อง:

- [การอนุมัติ exec](/th/tools/exec-approvals)
- [การแก้ปัญหา Node](/th/nodes/troubleshooting)
- [Nodes](/th/nodes/index)

## เครื่องมือเบราว์เซอร์ล้มเหลว

ใช้ส่วนนี้เมื่อการทำงานของเครื่องมือเบราว์เซอร์ล้มเหลว แม้ว่า Gateway เองจะปกติดี

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

มองหา:

- `plugins.allow` ถูกตั้งค่าไว้หรือไม่ และมี `browser` รวมอยู่หรือไม่
- เส้นทาง executable ของเบราว์เซอร์ที่ถูกต้อง
- การเข้าถึงโปรไฟล์ CDP ได้
- Chrome ในเครื่องพร้อมใช้งานสำหรับโปรไฟล์ `existing-session` / `user`

<AccordionGroup>
  <Accordion title="Plugin / executable signatures">
    - `unknown command "browser"` หรือ `unknown command 'browser'` → Plugin เบราว์เซอร์ที่มาพร้อมแพ็กเกจถูกตัดออกโดย `plugins.allow`
    - เครื่องมือเบราว์เซอร์หายไป / ไม่พร้อมใช้งาน ขณะที่ `browser.enabled=true` → `plugins.allow` ตัด `browser` ออก ดังนั้น Plugin จึงไม่เคยถูกโหลด
    - `Failed to start Chrome CDP on port` → โปรเซสเบราว์เซอร์เริ่มทำงานไม่สำเร็จ
    - `browser.executablePath not found` → เส้นทางที่กำหนดค่าไม่ถูกต้อง
    - `browser.cdpUrl must be http(s) or ws(s)` → URL ของ CDP ที่กำหนดค่าใช้ scheme ที่ไม่รองรับ เช่น `file:` หรือ `ftp:`
    - `browser.cdpUrl has invalid port` → URL ของ CDP ที่กำหนดค่ามีพอร์ตไม่ถูกต้องหรืออยู่นอกช่วง
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → การติดตั้ง Gateway ปัจจุบันไม่มี runtime dependency `playwright-core` ของ Plugin เบราว์เซอร์ที่มาพร้อมแพ็กเกจ ให้รัน `openclaw doctor --fix` แล้วรีสตาร์ท Gateway สแนปช็อต ARIA และสกรีนช็อตหน้าพื้นฐานยังทำงานได้ แต่การนำทาง, สแนปช็อต AI, สกรีนช็อตองค์ประกอบด้วย CSS-selector และการส่งออก PDF จะยังไม่พร้อมใช้งาน

  </Accordion>
  <Accordion title="Chrome MCP / existing-session signatures">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session ยังไม่สามารถ attach ไปยัง dir ข้อมูลเบราว์เซอร์ที่เลือกได้ เปิดหน้าตรวจสอบของเบราว์เซอร์ เปิดใช้งาน remote debugging เปิดเบราว์เซอร์ค้างไว้ อนุมัติ prompt การ attach ครั้งแรก แล้วลองใหม่ หากไม่ต้องใช้สถานะ signed-in ให้เลือกโปรไฟล์ `openclaw` ที่จัดการให้
    - `No Chrome tabs found for profile="user"` → โปรไฟล์ attach ของ Chrome MCP ไม่มีแท็บ Chrome ในเครื่องที่เปิดอยู่
    - `Remote CDP for profile "<name>" is not reachable` → endpoint CDP ระยะไกลที่กำหนดค่าไม่สามารถเข้าถึงได้จากโฮสต์ Gateway
    - `Browser attachOnly is enabled ... not reachable` หรือ `Browser attachOnly is enabled and CDP websocket ... is not reachable` → โปรไฟล์ attach-only ไม่มีเป้าหมายที่เข้าถึงได้ หรือ endpoint HTTP ตอบกลับแล้ว แต่ยังเปิด CDP WebSocket ไม่ได้

  </Accordion>
  <Accordion title="Element / screenshot / upload signatures">
    - `fullPage is not supported for element screenshots` → คำขอสกรีนช็อตใช้ `--full-page` ร่วมกับ `--ref` หรือ `--element`
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → การเรียกสกรีนช็อตของ Chrome MCP / `existing-session` ต้องใช้การจับภาพหน้าเว็บหรือ `--ref` จากสแนปช็อต ไม่ใช่ CSS `--element`
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hook อัปโหลดของ Chrome MCP ต้องใช้ snapshot refs ไม่ใช่ CSS selectors
    - `existing-session file uploads currently support one file at a time.` → ส่งอัปโหลดครั้งละหนึ่งไฟล์ต่อการเรียกบนโปรไฟล์ Chrome MCP
    - `existing-session dialog handling does not support timeoutMs.` → hook ของ dialog บนโปรไฟล์ Chrome MCP ไม่รองรับการ override timeout
    - `existing-session type does not support timeoutMs overrides.` → ละเว้น `timeoutMs` สำหรับ `act:type` บนโปรไฟล์ `profile="user"` / Chrome MCP existing-session หรือใช้โปรไฟล์เบราว์เซอร์ managed/CDP เมื่อต้องใช้ timeout แบบกำหนดเอง
    - `existing-session evaluate does not support timeoutMs overrides.` → ละเว้น `timeoutMs` สำหรับ `act:evaluate` บนโปรไฟล์ `profile="user"` / Chrome MCP existing-session หรือใช้โปรไฟล์เบราว์เซอร์ managed/CDP เมื่อต้องใช้ timeout แบบกำหนดเอง
    - `response body is not supported for existing-session profiles yet.` → `responsebody` ยังต้องใช้เบราว์เซอร์ managed หรือโปรไฟล์ CDP ดิบ
    - viewport / dark-mode / locale / offline overrides ที่ค้างเก่าบนโปรไฟล์ attach-only หรือ remote CDP → รัน `openclaw browser stop --browser-profile <name>` เพื่อปิดเซสชันควบคุมที่ใช้งานอยู่และปล่อยสถานะ emulation ของ Playwright/CDP โดยไม่ต้องรีสตาร์ท Gateway ทั้งหมด

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [เบราว์เซอร์ (จัดการโดย OpenClaw)](/th/tools/browser)
- [การแก้ปัญหาเบราว์เซอร์](/th/tools/browser-linux-troubleshooting)

## หากคุณอัปเกรดแล้วบางอย่างเสียกะทันหัน

ความเสียหายหลังอัปเกรดส่วนใหญ่เกิดจาก config drift หรือค่าเริ่มต้นที่เข้มงวดขึ้นซึ่งตอนนี้ถูกบังคับใช้

<AccordionGroup>
  <Accordion title="1. Auth and URL override behavior changed">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    สิ่งที่ต้องตรวจสอบ:

    - หาก `gateway.mode=remote` การเรียก CLI อาจกำลังชี้ไปที่ remote ขณะที่บริการในเครื่องของคุณปกติดี
    - การเรียกที่ระบุ `--url` อย่างชัดเจนจะไม่ fallback ไปใช้ credentials ที่จัดเก็บไว้

    ลายเซ็นที่พบบ่อย:

    - `gateway connect failed:` → เป้าหมาย URL ไม่ถูกต้อง
    - `unauthorized` → endpoint เข้าถึงได้ แต่ auth ไม่ถูกต้อง

  </Accordion>
  <Accordion title="2. Bind and auth guardrails are stricter">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    สิ่งที่ต้องตรวจสอบ:

    - bind ที่ไม่ใช่ loopback (`lan`, `tailnet`, `custom`) ต้องมีเส้นทาง auth ของ Gateway ที่ถูกต้อง: auth ด้วย token/password ที่ใช้ร่วมกัน หรือ deployment `trusted-proxy` แบบไม่ใช่ loopback ที่กำหนดค่าอย่างถูกต้อง
    - คีย์เก่าอย่าง `gateway.token` ไม่ได้แทนที่ `gateway.auth.token`

    ลายเซ็นที่พบบ่อย:

    - `refusing to bind gateway ... without auth` → bind แบบไม่ใช่ loopback โดยไม่มีเส้นทาง auth ของ Gateway ที่ถูกต้อง
    - `Connectivity probe: failed` ขณะที่ runtime กำลังทำงาน → Gateway ยังทำงานอยู่ แต่เข้าถึงไม่ได้ด้วย auth/url ปัจจุบัน

  </Accordion>
  <Accordion title="3. Pairing and device identity state changed">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    สิ่งที่ต้องตรวจสอบ:

    - การอนุมัติอุปกรณ์ที่รอดำเนินการสำหรับ dashboard/nodes
    - การอนุมัติการจับคู่ DM ที่รอดำเนินการหลังจากเปลี่ยนนโยบายหรือ identity

    ลายเซ็นที่พบบ่อย:

    - `device identity required` → ยังไม่ผ่าน auth ของอุปกรณ์
    - `pairing required` → ผู้ส่ง/อุปกรณ์ต้องได้รับการอนุมัติ

  </Accordion>
</AccordionGroup>

หาก config ของบริการและ runtime ยังไม่ตรงกันหลังตรวจสอบ ให้ติดตั้ง metadata ของบริการใหม่จากไดเรกทอรี profile/state เดียวกัน:

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
- [คำถามที่พบบ่อย](/th/help/faq)
- [Runbook ของ Gateway](/th/gateway)
