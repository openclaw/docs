---
read_when:
    - ศูนย์รวมการแก้ไขปัญหานำคุณมาที่นี่เพื่อการวินิจฉัยเชิงลึกยิ่งขึ้น
    - คุณต้องมีส่วนคู่มือปฏิบัติการที่อิงตามอาการอย่างคงที่พร้อมคำสั่งที่แน่นอน
sidebarTitle: Troubleshooting
summary: คู่มือปฏิบัติการแก้ไขปัญหาเชิงลึกสำหรับ Gateway, ช่องทาง, ระบบอัตโนมัติ, โหนด และเบราว์เซอร์
title: การแก้ไขปัญหา
x-i18n:
    generated_at: "2026-05-02T10:17:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 815fbbca4d12b4b9c65b1172e07606d0eaf4c64df7fd6ca23a8f8d104b78c2a9
    source_path: gateway/troubleshooting.md
    workflow: 16
---

หน้านี้เป็นคู่มือปฏิบัติงานเชิงลึก เริ่มที่ [/help/troubleshooting](/th/help/troubleshooting) หากคุณต้องการขั้นตอนคัดแยกปัญหาอย่างรวดเร็วก่อน

## ลำดับคำสั่ง

เรียกใช้คำสั่งเหล่านี้ก่อน ตามลำดับนี้:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

สัญญาณที่คาดว่าเป็นสถานะปกติ:

- `openclaw gateway status` แสดง `Runtime: running`, `Connectivity probe: ok` และบรรทัด `Capability: ...`
- `openclaw doctor` รายงานว่าไม่มีปัญหาการกำหนดค่า/บริการที่บล็อกการทำงาน
- `openclaw channels status --probe` แสดงสถานะทรานสปอร์ตแบบสดรายบัญชี และในจุดที่รองรับ จะแสดงผลลัพธ์ probe/audit เช่น `works` หรือ `audit ok`

## การติดตั้งแบบแยกส่วนและตัวป้องกัน config ที่ใหม่กว่า

ใช้ส่วนนี้เมื่อบริการ Gateway หยุดโดยไม่คาดคิดหลังอัปเดต หรือ logs แสดงว่าไบนารี `openclaw` ตัวหนึ่งเก่ากว่าเวอร์ชันที่เขียน `openclaw.json` ล่าสุด

OpenClaw ประทับการเขียน config ด้วย `meta.lastTouchedVersion` คำสั่งแบบอ่านอย่างเดียวยังสามารถตรวจ config ที่เขียนโดย OpenClaw เวอร์ชันใหม่กว่าได้ แต่การเปลี่ยนแปลง process และ service จะปฏิเสธไม่ดำเนินต่อจากไบนารีที่เก่ากว่า การกระทำที่ถูกบล็อกได้แก่ การ start, stop, restart, uninstall บริการ Gateway, การบังคับติดตั้งบริการใหม่, การเริ่ม Gateway ใน service-mode และการล้างพอร์ตด้วย `gateway --force`

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="แก้ไข PATH">
    แก้ `PATH` เพื่อให้ `openclaw` resolve ไปยังการติดตั้งที่ใหม่กว่า แล้วเรียกใช้การกระทำอีกครั้ง
  </Step>
  <Step title="ติดตั้งบริการ Gateway ใหม่">
    ติดตั้งบริการ Gateway ที่ต้องการใหม่จากการติดตั้งที่ใหม่กว่า:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="ลบ wrapper ที่ค้างอยู่">
    ลบแพ็กเกจระบบหรือรายการ wrapper เก่าที่ค้างอยู่ซึ่งยังชี้ไปยังไบนารี `openclaw` เก่า
  </Step>
</Steps>

<Warning>
สำหรับการดาวน์เกรดโดยตั้งใจหรือการกู้คืนฉุกเฉินเท่านั้น ให้ตั้งค่า `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` สำหรับคำสั่งเดียว ปล่อยให้ไม่ตั้งค่าสำหรับการทำงานปกติ
</Warning>

## Anthropic 429 ต้องใช้โควตาเพิ่มเติมสำหรับบริบทยาว

ใช้ส่วนนี้เมื่อ logs/errors มีข้อความ: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

ตรวจหา:

- โมเดล Anthropic Opus/Sonnet ที่เลือกมี `params.context1m: true`
- credential Anthropic ปัจจุบันไม่มีสิทธิ์ใช้ long-context
- คำขอล้มเหลวเฉพาะกับ session/model run ที่ยาวซึ่งต้องใช้เส้นทาง 1M beta

ตัวเลือกการแก้ไข:

<Steps>
  <Step title="ปิดใช้งาน context1m">
    ปิดใช้งาน `context1m` สำหรับโมเดลนั้นเพื่อย้อนกลับไปใช้หน้าต่างบริบทปกติ
  </Step>
  <Step title="ใช้ credential ที่มีสิทธิ์">
    ใช้ credential Anthropic ที่มีสิทธิ์สำหรับคำขอ long-context หรือเปลี่ยนไปใช้ Anthropic API key
  </Step>
  <Step title="กำหนดค่าโมเดล fallback">
    กำหนดค่าโมเดล fallback เพื่อให้ run ดำเนินต่อได้เมื่อคำขอ long-context ของ Anthropic ถูกปฏิเสธ
  </Step>
</Steps>

ที่เกี่ยวข้อง:

- [Anthropic](/th/providers/anthropic)
- [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use)
- [ทำไมฉันจึงเห็น HTTP 429 จาก Anthropic?](/th/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## backend แบบ local ที่เข้ากันได้กับ OpenAI ผ่าน direct probes แต่ agent runs ล้มเหลว

ใช้ส่วนนี้เมื่อ:

- `curl ... /v1/models` ใช้งานได้
- การเรียก `/v1/chat/completions` โดยตรงขนาดเล็กใช้งานได้
- OpenClaw model runs ล้มเหลวเฉพาะใน agent turns ปกติ

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

ตรวจหา:

- การเรียกโดยตรงขนาดเล็กสำเร็จ แต่ OpenClaw runs ล้มเหลวเฉพาะกับ prompt ที่ใหญ่กว่า
- ข้อผิดพลาด `model_not_found` หรือ 404 แม้ว่า `/v1/chat/completions` โดยตรงจะใช้งานได้ด้วย model id แบบเปล่าเดียวกัน
- ข้อผิดพลาดจาก backend เกี่ยวกับ `messages[].content` ที่คาดว่าจะเป็น string
- คำเตือน `incomplete turn detected ... stopReason=stop payloads=0` เป็นครั้งคราวกับ backend แบบ local ที่เข้ากันได้กับ OpenAI
- backend crash ที่เกิดเฉพาะกับจำนวน prompt-token ที่ใหญ่กว่า หรือ prompt runtime ของ agent แบบเต็ม

<AccordionGroup>
  <Accordion title="ลายเซ็นที่พบบ่อย">
    - `model_not_found` กับเซิร์ฟเวอร์ local แบบ MLX/vLLM → ตรวจว่า `baseUrl` มี `/v1`, `api` เป็น `"openai-completions"` สำหรับ backend `/v1/chat/completions` และ `models.providers.<provider>.models[].id` เป็น id local ของ provider แบบเปล่า เลือกด้วย prefix ของ provider หนึ่งครั้ง เช่น `mlx/mlx-community/Qwen3-30B-A3B-6bit`; เก็บรายการ catalog เป็น `mlx-community/Qwen3-30B-A3B-6bit`
    - `messages[...].content: invalid type: sequence, expected a string` → backend ปฏิเสธส่วนเนื้อหา Chat Completions แบบมีโครงสร้าง วิธีแก้: ตั้งค่า `models.providers.<provider>.models[].compat.requiresStringContent: true`
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend ทำคำขอ Chat Completions เสร็จแล้ว แต่ไม่ได้ส่งข้อความ assistant ที่ผู้ใช้เห็นได้สำหรับ turn นั้น OpenClaw retry turn ว่างที่เข้ากันได้กับ OpenAI และ replay-safe หนึ่งครั้ง; หากล้มเหลวต่อเนื่อง มักหมายความว่า backend ส่งเนื้อหาว่าง/ไม่ใช่ข้อความ หรือ suppress ข้อความ final-answer
    - คำขอโดยตรงขนาดเล็กสำเร็จ แต่ OpenClaw agent runs ล้มเหลวด้วย backend/model crash (เช่น Gemma บน `inferrs` บาง build) → transport ของ OpenClaw มีแนวโน้มว่าถูกต้องอยู่แล้ว; backend ล้มเหลวกับรูปแบบ prompt agent-runtime ที่ใหญ่กว่า
    - ความล้มเหลวลดลงหลังปิดใช้งาน tools แต่ไม่หายไป → tool schemas เป็นส่วนหนึ่งของแรงกดดัน แต่ปัญหาที่เหลือยังคงเป็นขีดความสามารถของ model/server ต้นทางหรือ bug ของ backend

  </Accordion>
  <Accordion title="ตัวเลือกการแก้ไข">
    1. ตั้งค่า `compat.requiresStringContent: true` สำหรับ backend Chat Completions ที่รองรับเฉพาะ string
    2. ตั้งค่า `compat.supportsTools: false` สำหรับ models/backends ที่จัดการ surface ของ tool schema ของ OpenClaw ได้ไม่เสถียร
    3. ลดแรงกดดันของ prompt ในจุดที่ทำได้: workspace bootstrap ที่เล็กลง, session history ที่สั้นลง, local model ที่เบากว่า หรือ backend ที่รองรับ long-context ได้ดีกว่า
    4. หากคำขอโดยตรงขนาดเล็กยังผ่าน แต่ OpenClaw agent turns ยัง crash ภายใน backend ให้ถือว่าเป็นข้อจำกัดของ server/model ต้นทาง และส่ง repro ที่นั่นพร้อมรูปแบบ payload ที่ยอมรับ
  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Configuration](/th/gateway/configuration)
- [โมเดล local](/th/gateway/local-models)
- [endpoint ที่เข้ากันได้กับ OpenAI](/th/gateway/configuration-reference#openai-compatible-endpoints)

## ไม่มีการตอบกลับ

หาก channels ทำงานอยู่แต่ไม่มีอะไรตอบ ให้ตรวจ routing และ policy ก่อน reconnect สิ่งใด

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

ตรวจหา:

- Pairing pending สำหรับผู้ส่ง DM
- การ gating การ mention ของ group (`requireMention`, `mentionPatterns`)
- allowlist ของ channel/group ไม่ตรงกัน

ลายเซ็นที่พบบ่อย:

- `drop guild message (mention required` → ข้อความ group ถูกละเว้นจนกว่าจะ mention
- `pairing request` → ผู้ส่งต้องได้รับการอนุมัติ
- `blocked` / `allowlist` → ผู้ส่ง/channel ถูกกรองโดย policy

ที่เกี่ยวข้อง:

- [การแก้ปัญหา Channel](/th/channels/troubleshooting)
- [Groups](/th/channels/groups)
- [Pairing](/th/channels/pairing)

## การเชื่อมต่อ Dashboard control UI

เมื่อ dashboard/control UI เชื่อมต่อไม่ได้ ให้ตรวจ URL, auth mode และสมมติฐานเรื่อง secure context

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
- การใช้ HTTP ในจุดที่ต้องใช้ device identity

<AccordionGroup>
  <Accordion title="ลายเซ็น connect / auth">
    - `device identity required` → context ไม่ปลอดภัยหรือไม่มี device auth
    - `origin not allowed` → `Origin` ของ browser ไม่อยู่ใน `gateway.controlUi.allowedOrigins` (หรือคุณกำลังเชื่อมต่อจาก browser origin ที่ไม่ใช่ loopback โดยไม่มี allowlist ที่ระบุชัด)
    - `device nonce required` / `device nonce mismatch` → client ไม่ได้ทำ challenge-based device auth flow ให้เสร็จ (`connect.challenge` + `device.nonce`)
    - `device signature invalid` / `device signature expired` → client ลงนาม payload ผิด (หรือ timestamp เก่า) สำหรับ handshake ปัจจุบัน
    - `AUTH_TOKEN_MISMATCH` พร้อม `canRetryWithDeviceToken=true` → client สามารถ retry แบบ trusted หนึ่งครั้งด้วย cached device token
    - retry ด้วย cached-token นั้นจะใช้ cached scope set ที่เก็บไว้กับ paired device token ซ้ำ ผู้เรียกที่ระบุ `deviceToken` ชัดเจน / `scopes` ชัดเจน จะคง scope set ที่ขอไว้แทน
    - นอกเส้นทาง retry นั้น ลำดับความสำคัญของ connect auth คือ shared token/password ที่ระบุชัดก่อน จากนั้น `deviceToken` ที่ระบุชัด จากนั้น stored device token และท้ายสุด bootstrap token
    - บนเส้นทาง async Tailscale Serve Control UI ความพยายามที่ล้มเหลวสำหรับ `{scope, ip}` เดียวกันจะถูกทำแบบ serialized ก่อนที่ limiter จะบันทึกความล้มเหลว ดังนั้น retry ที่ผิดพร้อมกันสองครั้งจาก client เดียวกันจึงอาจแสดง `retry later` ในครั้งที่สองแทนที่จะเป็น mismatch ธรรมดาสองครั้ง
    - `too many failed authentication attempts (retry later)` จาก browser-origin loopback client → ความล้มเหลวซ้ำจาก `Origin` ที่ normalize แล้วเดียวกันนั้นจะถูก lock out ชั่วคราว; origin localhost อื่นใช้ bucket แยกต่างหาก
    - `unauthorized` ซ้ำหลัง retry นั้น → shared token/device token drift; refresh token config และ re-approve/rotate device token หากจำเป็น
    - `gateway connect failed:` → host/port/url target ผิด

  </Accordion>
</AccordionGroup>

### แผนที่ย่อรหัสรายละเอียด auth

ใช้ `error.details.code` จาก response `connect` ที่ล้มเหลวเพื่อเลือกการกระทำถัดไป

| รหัสรายละเอียด              | ความหมาย                                                                                                                                                                                      | การดำเนินการที่แนะนำ                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | ไคลเอนต์ไม่ได้ส่งโทเค็นที่ใช้ร่วมกันซึ่งจำเป็นต้องมีมา                                                                                                                                                 | วาง/ตั้งค่าโทเค็นในไคลเอนต์แล้วลองใหม่ สำหรับเส้นทางแดชบอร์ด: `openclaw config get gateway.auth.token` จากนั้นวางลงในการตั้งค่า Control UI                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | โทเค็นที่ใช้ร่วมกันไม่ตรงกับโทเค็นยืนยันตัวตนของ Gateway                                                                                                                                               | ถ้า `canRetryWithDeviceToken=true` ให้อนุญาตให้ลองใหม่แบบเชื่อถือได้หนึ่งครั้ง การลองใหม่ด้วยโทเค็นที่แคชไว้จะใช้ขอบเขตที่อนุมัติและจัดเก็บไว้ซ้ำ ส่วนผู้เรียก `deviceToken` / `scopes` แบบชัดเจนจะคงขอบเขตที่ร้องขอไว้ หากยังล้มเหลว ให้เรียกใช้ [รายการตรวจสอบการกู้คืน token drift](/th/cli/devices#token-drift-recovery-checklist) |
| `AUTH_DEVICE_TOKEN_MISMATCH` | โทเค็นต่ออุปกรณ์ที่แคชไว้ล้าสมัยหรือถูกเพิกถอนแล้ว                                                                                                                                                 | หมุนเวียน/อนุมัติโทเค็นอุปกรณ์ใหม่โดยใช้ [devices CLI](/th/cli/devices) จากนั้นเชื่อมต่อใหม่                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | ต้องอนุมัติตัวตนอุปกรณ์ ตรวจสอบ `error.details.reason` สำหรับ `not-paired`, `scope-upgrade`, `role-upgrade` หรือ `metadata-upgrade` และใช้ `requestId` / `remediationHint` เมื่อมีให้ | อนุมัติคำขอที่รอดำเนินการ: `openclaw devices list` จากนั้น `openclaw devices approve <requestId>` การอัปเกรดขอบเขต/บทบาทใช้ขั้นตอนเดียวกันหลังจากคุณตรวจสอบสิทธิ์เข้าถึงที่ร้องขอแล้ว                                                                                                               |

<Note>
RPC แบ็กเอนด์แบบลูปแบ็กโดยตรงที่ยืนยันตัวตนด้วยโทเค็น/รหัสผ่าน Gateway ที่ใช้ร่วมกันไม่ควรขึ้นกับ baseline ขอบเขตอุปกรณ์ที่จับคู่ของ CLI หาก subagents หรือการเรียกภายในอื่น ๆ ยังล้มเหลวด้วย `scope-upgrade` ให้ตรวจสอบว่าผู้เรียกใช้ `client.id: "gateway-client"` และ `client.mode: "backend"` และไม่ได้บังคับ `deviceIdentity` หรือโทเค็นอุปกรณ์แบบชัดเจน
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
  <Step title="ส่ง device nonce">
    ไคลเอนต์ส่ง `connect.params.device.nonce` พร้อม challenge nonce เดียวกัน
  </Step>
</Steps>

หาก `openclaw devices rotate` / `revoke` / `remove` ถูกปฏิเสธโดยไม่คาดคิด:

- เซสชันโทเค็นอุปกรณ์ที่จับคู่สามารถจัดการได้เฉพาะอุปกรณ์ของ **ตนเอง** เท่านั้น เว้นแต่ผู้เรียกจะมี `operator.admin` ด้วย
- `openclaw devices rotate --scope ...` สามารถร้องขอได้เฉพาะขอบเขต operator ที่เซสชันผู้เรียกมีอยู่แล้ว

ที่เกี่ยวข้อง:

- [การกำหนดค่า](/th/gateway/configuration) (โหมดการยืนยันตัวตน Gateway)
- [Control UI](/th/web/control-ui)
- [อุปกรณ์](/th/cli/devices)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [การยืนยันตัวตนพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth)

## บริการ Gateway ไม่ได้ทำงานอยู่

ใช้ส่วนนี้เมื่อมีการติดตั้งบริการแล้ว แต่กระบวนการไม่ทำงานค้างไว้

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

มองหา:

- `Runtime: stopped` พร้อมคำใบ้เกี่ยวกับรหัสออก
- ความไม่ตรงกันของการกำหนดค่าบริการ (`Config (cli)` เทียบกับ `Config (service)`)
- ความขัดแย้งของพอร์ต/ตัวรับฟัง
- การติดตั้ง launchd/systemd/schtasks เพิ่มเติมเมื่อใช้ `--deep`
- คำใบ้การล้างข้อมูล `Other gateway-like services detected (best effort)`

<AccordionGroup>
  <Accordion title="ลายเซ็นที่พบบ่อย">
    - `Gateway start blocked: set gateway.mode=local` หรือ `existing config is missing gateway.mode` → โหมด Gateway แบบ local ไม่ได้เปิดใช้งาน หรือไฟล์กำหนดค่าถูกเขียนทับจนสูญเสีย `gateway.mode` วิธีแก้: ตั้งค่า `gateway.mode="local"` ในการกำหนดค่าของคุณ หรือเรียกใช้ `openclaw onboard --mode local` / `openclaw setup` อีกครั้งเพื่อประทับค่ากำหนด local-mode ที่คาดไว้ใหม่ หากคุณเรียกใช้ OpenClaw ผ่าน Podman เส้นทางกำหนดค่าเริ่มต้นคือ `~/.openclaw/openclaw.json`
    - `refusing to bind gateway ... without auth` → การ bind ที่ไม่ใช่ loopback โดยไม่มีเส้นทางยืนยันตัวตน Gateway ที่ถูกต้อง (โทเค็น/รหัสผ่าน หรือ trusted-proxy เมื่อตั้งค่าไว้)
    - `another gateway instance is already listening` / `EADDRINUSE` → ความขัดแย้งของพอร์ต
    - `Other gateway-like services detected (best effort)` → มีหน่วย launchd/systemd/schtasks ที่ค้างอยู่หรือทำงานขนานกัน การตั้งค่าส่วนใหญ่ควรมี Gateway หนึ่งตัวต่อเครื่อง หากคุณจำเป็นต้องมีมากกว่าหนึ่งจริง ๆ ให้แยกพอร์ต + config/state/workspace ดู [/gateway#multiple-gateways-same-host](/th/gateway#multiple-gateways-same-host)
    - `System-level OpenClaw gateway service detected` จาก doctor → มี systemd system unit อยู่ ขณะที่บริการระดับผู้ใช้หายไป ลบหรือปิดใช้งานรายการซ้ำก่อนอนุญาตให้ doctor ติดตั้งบริการผู้ใช้ หรือตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` หาก system unit เป็น supervisor ที่ตั้งใจใช้
    - `Gateway service port does not match current gateway config` → supervisor ที่ติดตั้งไว้ยังคงตรึง `--port` เก่าไว้ เรียกใช้ `openclaw doctor --fix` หรือ `openclaw gateway install --force` จากนั้นรีสตาร์ตบริการ Gateway

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [การเรียกใช้เบื้องหลังและเครื่องมือกระบวนการ](/th/gateway/background-process)
- [การกำหนดค่า](/th/gateway/configuration)
- [Doctor](/th/gateway/doctor)

## Gateway กู้คืนการกำหนดค่าดีล่าสุดที่ทราบ

ใช้ส่วนนี้เมื่อ Gateway เริ่มทำงาน แต่ล็อกระบุว่ากู้คืน `openclaw.json`

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
- ไฟล์ `openclaw.json.clobbered.*` ที่มี timestamp อยู่ข้างการกำหนดค่าที่ใช้งานอยู่
- เหตุการณ์ระบบของ main-agent ที่ขึ้นต้นด้วย `Config recovery warning`

<AccordionGroup>
  <Accordion title="เกิดอะไรขึ้น">
    - การกำหนดค่าที่ถูกปฏิเสธไม่ผ่านการตรวจสอบความถูกต้องระหว่างเริ่มต้นหรือ hot reload
    - OpenClaw เก็บ payload ที่ถูกปฏิเสธไว้เป็น `.clobbered.*`
    - การกำหนดค่าที่ใช้งานอยู่ถูกกู้คืนจากสำเนา last-known-good ที่ผ่านการตรวจสอบล่าสุด
    - เทิร์น main-agent ถัดไปจะได้รับคำเตือนว่าอย่าเขียนทับการกำหนดค่าที่ถูกปฏิเสธแบบไม่พิจารณา
    - หากปัญหาการตรวจสอบทั้งหมดอยู่ใต้ `plugins.entries.<id>...` OpenClaw จะไม่กู้คืนทั้งไฟล์ ความล้มเหลวเฉพาะ Plugin จะยังแสดงชัดเจน ขณะที่การตั้งค่าผู้ใช้อื่นที่ไม่เกี่ยวข้องยังคงอยู่ในการกำหนดค่าที่ใช้งานอยู่

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
    - มี `.clobbered.*` อยู่ → การแก้ไขโดยตรงจากภายนอกหรือการอ่านตอนเริ่มต้นถูกกู้คืน
    - มี `.rejected.*` อยู่ → การเขียนการกำหนดค่าที่ OpenClaw เป็นเจ้าของไม่ผ่าน schema หรือการตรวจ clobber ก่อน commit
    - `Config write rejected:` → การเขียนพยายามลบโครงสร้างที่จำเป็น ลดขนาดไฟล์ลงอย่างมาก หรือบันทึกการกำหนดค่าที่ไม่ถูกต้อง
    - `Rejected validation details:` → ล็อกการกู้คืนหรือประกาศของ main-agent มีเส้นทาง schema ที่ทำให้เกิดการกู้คืน เช่น `agents.defaults.execution` หรือ `gateway.auth.password.source`
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` หรือ `size-drop-vs-last-good:*` → ตอนเริ่มต้นถือว่าไฟล์ปัจจุบันถูก clobber เพราะสูญเสียฟิลด์หรือขนาดเมื่อเทียบกับ backup last-known-good
    - `Config last-known-good promotion skipped` → candidate มี placeholder ความลับที่ถูกปกปิด เช่น `***`

  </Accordion>
  <Accordion title="ตัวเลือกการแก้ไข">
    1. เก็บการกำหนดค่าที่ใช้งานอยู่ที่กู้คืนแล้วไว้ หากถูกต้อง
    2. คัดลอกเฉพาะคีย์ที่ตั้งใจจาก `.clobbered.*` หรือ `.rejected.*` จากนั้นใช้ด้วย `openclaw config set` หรือ `config.patch`
    3. เรียกใช้ `openclaw config validate` ก่อนรีสตาร์ต
    4. หากคุณแก้ไขด้วยมือ ให้เก็บการกำหนดค่า JSON5 แบบเต็ม ไม่ใช่เฉพาะออบเจ็กต์บางส่วนที่คุณต้องการเปลี่ยน
  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Config](/th/cli/config)
- [การกำหนดค่า: hot reload](/th/gateway/configuration#config-hot-reload)
- [การกำหนดค่า: การตรวจสอบแบบเข้มงวด](/th/gateway/configuration#strict-validation)
- [Doctor](/th/gateway/doctor)

## คำเตือนของ Gateway probe

ใช้ส่วนนี้เมื่อ `openclaw gateway probe` เข้าถึงบางอย่างได้ แต่ยังพิมพ์บล็อกคำเตือน

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

มองหา:

- `warnings[].code` และ `primaryTargetId` ในเอาต์พุต JSON
- ว่าคำเตือนเกี่ยวกับ SSH fallback, Gateway หลายตัว, ขอบเขตที่ขาดหาย หรือ auth refs ที่ resolve ไม่ได้

ลายเซ็นที่พบบ่อย:

- `SSH tunnel failed to start; falling back to direct probes.` → การตั้งค่า SSH ล้มเหลว แต่คำสั่งยังลองเป้าหมายที่กำหนดค่าไว้/loopback โดยตรง
- `multiple reachable gateways detected` → มีเป้าหมายมากกว่าหนึ่งตัวตอบกลับ โดยปกติหมายถึงการตั้งค่า Gateway หลายตัวโดยตั้งใจ หรือตัวรับฟังที่ค้าง/ซ้ำ
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → เชื่อมต่อได้ แต่ RPC รายละเอียดถูกจำกัดด้วยขอบเขต จับคู่ตัวตนอุปกรณ์หรือใช้ข้อมูลประจำตัวที่มี `operator.read`
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → เชื่อมต่อได้ แต่ชุด RPC วินิจฉัยเต็มหมดเวลาหรือล้มเหลว ให้ถือว่าเป็น Gateway ที่เข้าถึงได้พร้อมการวินิจฉัยที่ลดระดับลง เปรียบเทียบ `connect.ok` และ `connect.rpcOk` ในเอาต์พุต `--json`
- `Capability: pairing-pending` หรือ `gateway closed (1008): pairing required` → Gateway ตอบกลับแล้ว แต่ไคลเอนต์นี้ยังต้องจับคู่/อนุมัติก่อนเข้าถึง operator ตามปกติ
- ข้อความเตือน SecretRef ของ `gateway.auth.*` / `gateway.remote.*` ที่ resolve ไม่ได้ → วัสดุยืนยันตัวตนไม่พร้อมใช้งานในเส้นทางคำสั่งนี้สำหรับเป้าหมายที่ล้มเหลว

ที่เกี่ยวข้อง:

- [Gateway](/th/cli/gateway)
- [Gateway หลายตัวบนโฮสต์เดียวกัน](/th/gateway#multiple-gateways-same-host)
- [การเข้าถึงระยะไกล](/th/gateway/remote)

## ช่องทางเชื่อมต่อแล้ว แต่ข้อความไม่ไหล

หากสถานะช่องทางเชื่อมต่อแล้ว แต่การไหลของข้อความหยุด ให้เน้นที่นโยบาย สิทธิ์ และกฎการส่งมอบเฉพาะช่องทาง

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

มองหา:

- นโยบาย DM (`pairing`, `allowlist`, `open`, `disabled`)
- allowlist ของกลุ่มและข้อกำหนดการกล่าวถึง
- สิทธิ์/ขอบเขต API ของช่องทางที่ขาดหายไป

ลายเซ็นทั่วไป:

- `mention required` → ข้อความถูกละเว้นโดยนโยบายการกล่าวถึงของกลุ่ม
- `pairing` / ร่องรอยการรออนุมัติ → ผู้ส่งยังไม่ได้รับอนุมัติ
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → ปัญหาการยืนยันตัวตน/สิทธิ์ของช่องทาง

ที่เกี่ยวข้อง:

- [การแก้ปัญหาช่องทาง](/th/channels/troubleshooting)
- [Discord](/th/channels/discord)
- [Telegram](/th/channels/telegram)
- [WhatsApp](/th/channels/whatsapp)

## การส่ง Cron และ Heartbeat

หาก cron หรือ heartbeat ไม่ได้รันหรือไม่ได้ส่ง ให้ตรวจสอบสถานะตัวกำหนดเวลาก่อน แล้วจึงตรวจสอบเป้าหมายการส่ง

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

ตรวจหา:

- Cron เปิดใช้งานอยู่และมีเวลาปลุกถัดไป
- สถานะประวัติการรันงาน (`ok`, `skipped`, `error`)
- เหตุผลที่ข้าม Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`)

<AccordionGroup>
  <Accordion title="ลายเซ็นทั่วไป">
    - `cron: scheduler disabled; jobs will not run automatically` → cron ถูกปิดใช้งาน
    - `cron: timer tick failed` → รอบการทำงานของตัวกำหนดเวลาล้มเหลว ตรวจสอบข้อผิดพลาดของไฟล์/ล็อก/รันไทม์
    - `heartbeat skipped` พร้อม `reason=quiet-hours` → อยู่นอกช่วงเวลาทำงาน
    - `heartbeat skipped` พร้อม `reason=empty-heartbeat-file` → `HEARTBEAT.md` มีอยู่แต่มีเพียงบรรทัดว่าง / หัวข้อ markdown ดังนั้น OpenClaw จึงข้ามการเรียกโมเดล
    - `heartbeat skipped` พร้อม `reason=no-tasks-due` → `HEARTBEAT.md` มีบล็อก `tasks:` แต่ไม่มีงานใดครบกำหนดในรอบนี้
    - `heartbeat: unknown accountId` → id บัญชีไม่ถูกต้องสำหรับเป้าหมายการส่ง heartbeat
    - `heartbeat skipped` พร้อม `reason=dm-blocked` → เป้าหมาย heartbeat ถูกแปลงเป็นปลายทางแบบ DM ขณะที่ `agents.defaults.heartbeat.directPolicy` (หรือการ override ราย agent) ถูกตั้งเป็น `block`

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Heartbeat](/th/gateway/heartbeat)
- [งานตามกำหนดเวลา](/th/automation/cron-jobs)
- [งานตามกำหนดเวลา: การแก้ปัญหา](/th/automation/cron-jobs#troubleshooting)

## Node จับคู่แล้ว แต่เครื่องมือล้มเหลว

หาก node ถูกจับคู่แล้วแต่เครื่องมือล้มเหลว ให้แยกตรวจสอบสถานะเบื้องหน้า สิทธิ์ และการอนุมัติ

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
- การอนุมัติ exec และสถานะ allowlist

ลายเซ็นทั่วไป:

- `NODE_BACKGROUND_UNAVAILABLE` → แอป node ต้องอยู่เบื้องหน้า
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → ขาดสิทธิ์ของ OS
- `SYSTEM_RUN_DENIED: approval required` → exec กำลังรออนุมัติ
- `SYSTEM_RUN_DENIED: allowlist miss` → คำสั่งถูกบล็อกโดย allowlist

ที่เกี่ยวข้อง:

- [การอนุมัติ exec](/th/tools/exec-approvals)
- [การแก้ปัญหา Node](/th/nodes/troubleshooting)
- [Nodes](/th/nodes/index)

## เครื่องมือเบราว์เซอร์ล้มเหลว

ใช้ส่วนนี้เมื่อการทำงานของเครื่องมือเบราว์เซอร์ล้มเหลว แม้ตัว gateway เองจะทำงานปกติ

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

ตรวจหา:

- ตั้งค่า `plugins.allow` ไว้หรือไม่ และมี `browser` รวมอยู่หรือไม่
- พาธ executable ของเบราว์เซอร์ถูกต้อง
- การเข้าถึงโปรไฟล์ CDP
- ความพร้อมใช้งานของ Chrome ในเครื่องสำหรับโปรไฟล์ `existing-session` / `user`

<AccordionGroup>
  <Accordion title="ลายเซ็น Plugin / executable">
    - `unknown command "browser"` หรือ `unknown command 'browser'` → bundled browser plugin ถูกแยกออกโดย `plugins.allow`
    - เครื่องมือเบราว์เซอร์ขาดหาย / ใช้งานไม่ได้ ขณะที่ `browser.enabled=true` → `plugins.allow` ไม่รวม `browser` ดังนั้น plugin จึงไม่เคยโหลด
    - `Failed to start Chrome CDP on port` → โปรเซสเบราว์เซอร์เริ่มทำงานไม่สำเร็จ
    - `browser.executablePath not found` → พาธที่กำหนดค่าไม่ถูกต้อง
    - `browser.cdpUrl must be http(s) or ws(s)` → URL CDP ที่กำหนดค่าใช้ scheme ที่ไม่รองรับ เช่น `file:` หรือ `ftp:`
    - `browser.cdpUrl has invalid port` → URL CDP ที่กำหนดค่ามีพอร์ตไม่ถูกต้องหรืออยู่นอกช่วง
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → gateway ที่ติดตั้งอยู่ขาด dependency รันไทม์เบราว์เซอร์หลัก ให้ติดตั้งใหม่หรืออัปเดต OpenClaw แล้วรีสตาร์ท gateway สแนปช็อต ARIA และภาพหน้าจอพื้นฐานของหน้ายังทำงานได้ แต่การนำทาง, สแนปช็อต AI, ภาพหน้าจอองค์ประกอบด้วย CSS selector และการส่งออก PDF จะยังใช้งานไม่ได้

  </Accordion>
  <Accordion title="ลายเซ็น Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session ยังแนบกับไดเรกทอรีข้อมูลเบราว์เซอร์ที่เลือกไม่ได้ เปิดหน้า inspect ของเบราว์เซอร์ เปิดใช้ remote debugging เปิดเบราว์เซอร์ค้างไว้ อนุมัติพรอมป์แนบครั้งแรก แล้วลองใหม่ หากไม่จำเป็นต้องใช้สถานะลงชื่อเข้าใช้ ให้ใช้โปรไฟล์ `openclaw` ที่จัดการโดยระบบ
    - `No Chrome tabs found for profile="user"` → โปรไฟล์แนบ Chrome MCP ไม่มีแท็บ Chrome ในเครื่องที่เปิดอยู่
    - `Remote CDP for profile "<name>" is not reachable` → endpoint CDP ระยะไกลที่กำหนดค่าไม่สามารถเข้าถึงได้จากโฮสต์ gateway
    - `Browser attachOnly is enabled ... not reachable` หรือ `Browser attachOnly is enabled and CDP websocket ... is not reachable` → โปรไฟล์ attach-only ไม่มีเป้าหมายที่เข้าถึงได้ หรือ endpoint HTTP ตอบกลับแล้วแต่ยังเปิด CDP WebSocket ไม่ได้

  </Accordion>
  <Accordion title="ลายเซ็นองค์ประกอบ / ภาพหน้าจอ / การอัปโหลด">
    - `fullPage is not supported for element screenshots` → คำขอภาพหน้าจอผสม `--full-page` กับ `--ref` หรือ `--element`
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → การเรียกภาพหน้าจอ Chrome MCP / `existing-session` ต้องใช้การจับภาพหน้าเว็บหรือ snapshot `--ref` ไม่ใช่ CSS `--element`
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hook อัปโหลด Chrome MCP ต้องใช้ snapshot refs ไม่ใช่ CSS selectors
    - `existing-session file uploads currently support one file at a time.` → ส่งการอัปโหลดครั้งละหนึ่งไฟล์ต่อการเรียกบนโปรไฟล์ Chrome MCP
    - `existing-session dialog handling does not support timeoutMs.` → dialog hooks บนโปรไฟล์ Chrome MCP ไม่รองรับการ override timeout
    - `existing-session type does not support timeoutMs overrides.` → ละ `timeoutMs` สำหรับ `act:type` บนโปรไฟล์ `profile="user"` / Chrome MCP existing-session หรือใช้โปรไฟล์เบราว์เซอร์ managed/CDP เมื่อจำเป็นต้องกำหนด timeout เอง
    - `existing-session evaluate does not support timeoutMs overrides.` → ละ `timeoutMs` สำหรับ `act:evaluate` บนโปรไฟล์ `profile="user"` / Chrome MCP existing-session หรือใช้โปรไฟล์เบราว์เซอร์ managed/CDP เมื่อจำเป็นต้องกำหนด timeout เอง
    - `response body is not supported for existing-session profiles yet.` → `responsebody` ยังต้องใช้เบราว์เซอร์ที่จัดการโดยระบบหรือโปรไฟล์ CDP ดิบ
    - viewport / dark-mode / locale / offline overrides ที่ค้างบนโปรไฟล์ attach-only หรือ remote CDP → รัน `openclaw browser stop --browser-profile <name>` เพื่อปิดเซสชันควบคุมที่ใช้งานอยู่และปล่อยสถานะ emulation ของ Playwright/CDP โดยไม่ต้องรีสตาร์ท gateway ทั้งหมด

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

    - หาก `gateway.mode=remote` การเรียก CLI อาจกำลังเล็งไปที่ remote ขณะที่บริการในเครื่องของคุณปกติดี
    - การเรียก `--url` แบบระบุชัดเจนจะไม่ fallback ไปใช้ข้อมูลรับรองที่บันทึกไว้

    ลายเซ็นทั่วไป:

    - `gateway connect failed:` → เป้าหมาย URL ผิด
    - `unauthorized` → endpoint เข้าถึงได้แต่การยืนยันตัวตนผิด

  </Accordion>
  <Accordion title="2. guardrail ของ bind และการยืนยันตัวตนเข้มงวดขึ้น">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    สิ่งที่ต้องตรวจสอบ:

    - การ bind ที่ไม่ใช่ loopback (`lan`, `tailnet`, `custom`) ต้องมีพาธการยืนยันตัวตนของ gateway ที่ถูกต้อง: การยืนยันตัวตนด้วย token/password ที่แชร์ หรือ deployment `trusted-proxy` แบบไม่ใช่ loopback ที่กำหนดค่าอย่างถูกต้อง
    - คีย์เก่าอย่าง `gateway.token` ไม่ได้แทนที่ `gateway.auth.token`

    ลายเซ็นทั่วไป:

    - `refusing to bind gateway ... without auth` → bind แบบไม่ใช่ loopback โดยไม่มีพาธการยืนยันตัวตนของ gateway ที่ถูกต้อง
    - `Connectivity probe: failed` ขณะที่รันไทม์กำลังทำงาน → gateway ยังทำงานอยู่แต่เข้าถึงไม่ได้ด้วย auth/url ปัจจุบัน

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
    - การอนุมัติการจับคู่ DM ที่รอดำเนินการหลังการเปลี่ยนนโยบายหรือตัวตน

    ลายเซ็นทั่วไป:

    - `device identity required` → device auth ยังไม่ผ่าน
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
- [exec เบื้องหลังและเครื่องมือโปรเซส](/th/gateway/background-process)
- [การจับคู่ที่ Gateway เป็นเจ้าของ](/th/gateway/pairing)

## ที่เกี่ยวข้อง

- [Doctor](/th/gateway/doctor)
- [FAQ](/th/help/faq)
- [runbook ของ Gateway](/th/gateway)
