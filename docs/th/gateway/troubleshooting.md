---
read_when:
    - ศูนย์รวมการแก้ไขปัญหาได้นำคุณมาที่นี่เพื่อวินิจฉัยเชิงลึกยิ่งขึ้น
    - คุณต้องมีส่วนคู่มือปฏิบัติการที่เสถียรตามอาการ พร้อมคำสั่งที่แน่นอน
sidebarTitle: Troubleshooting
summary: คู่มือปฏิบัติการแก้ไขปัญหาเชิงลึกสำหรับ Gateway, ช่องทาง, ระบบอัตโนมัติ, Node และเบราว์เซอร์
title: การแก้ไขปัญหา
x-i18n:
    generated_at: "2026-05-01T10:17:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: a808dcfd8527b041f629cff24308550f961e9eeb4d7d4ce6f1ce84dff6bbef89
    source_path: gateway/troubleshooting.md
    workflow: 16
---

หน้านี้คือ runbook เชิงลึก เริ่มที่ [/help/troubleshooting](/th/help/troubleshooting) หากคุณต้องการลำดับ triage แบบเร็วก่อน

## ลำดับคำสั่ง

เรียกใช้คำสั่งเหล่านี้ก่อน ตามลำดับนี้:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

สัญญาณสุขภาพที่คาดหวัง:

- `openclaw gateway status` แสดง `Runtime: running`, `Connectivity probe: ok` และบรรทัด `Capability: ...`
- `openclaw doctor` รายงานว่าไม่มีปัญหา config/service ที่บล็อกการทำงาน
- `openclaw channels status --probe` แสดงสถานะ transport แบบสดต่อบัญชี และในส่วนที่รองรับจะแสดงผลลัพธ์ probe/audit เช่น `works` หรือ `audit ok`

## การติดตั้งแบบ split brain และตัวป้องกัน config ที่ใหม่กว่า

ใช้ส่วนนี้เมื่อ gateway service หยุดโดยไม่คาดคิดหลังอัปเดต หรือ log แสดงว่า binary `openclaw` ตัวหนึ่งเก่ากว่าเวอร์ชันที่เขียน `openclaw.json` ล่าสุด

OpenClaw ประทับตราการเขียน config ด้วย `meta.lastTouchedVersion` คำสั่งแบบอ่านอย่างเดียวยังสามารถตรวจดู config ที่เขียนโดย OpenClaw รุ่นใหม่กว่าได้ แต่การเปลี่ยนแปลง process และ service จะปฏิเสธไม่ให้ดำเนินต่อจาก binary ที่เก่ากว่า การกระทำที่ถูกบล็อกได้แก่ การ start, stop, restart, uninstall gateway service, การ reinstall service แบบบังคับ, การเริ่ม gateway ใน service-mode และการล้างพอร์ตด้วย `gateway --force`

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="แก้ไข PATH">
    แก้ไข `PATH` เพื่อให้ `openclaw` resolve ไปยังการติดตั้งที่ใหม่กว่า จากนั้นเรียกใช้การกระทำนั้นอีกครั้ง
  </Step>
  <Step title="ติดตั้ง gateway service ใหม่">
    ติดตั้ง gateway service ที่ตั้งใจใช้ใหม่จากการติดตั้งที่ใหม่กว่า:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="ลบ wrapper ที่ค้างเก่า">
    ลบ system package หรือรายการ wrapper เก่าที่ยังชี้ไปยัง binary `openclaw` ตัวเก่า
  </Step>
</Steps>

<Warning>
สำหรับการ downgrade โดยตั้งใจหรือการกู้คืนฉุกเฉินเท่านั้น ให้ตั้ง `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` สำหรับคำสั่งเดียว ปล่อยไว้ไม่ต้องตั้งค่าสำหรับการใช้งานปกติ
</Warning>

## Anthropic 429 ต้องมีการใช้งานเพิ่มเติมสำหรับ context ยาว

ใช้ส่วนนี้เมื่อ log/error มีข้อความ: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

มองหา:

- โมเดล Anthropic Opus/Sonnet ที่เลือกมี `params.context1m: true`
- credential Anthropic ปัจจุบันไม่มีสิทธิ์ใช้งาน long-context
- คำขอล้มเหลวเฉพาะกับ session/model run ที่ยาวซึ่งต้องใช้เส้นทาง 1M beta

ตัวเลือกการแก้ไข:

<Steps>
  <Step title="ปิดใช้งาน context1m">
    ปิดใช้งาน `context1m` สำหรับโมเดลนั้นเพื่อย้อนกลับไปใช้หน้าต่าง context ปกติ
  </Step>
  <Step title="ใช้ credential ที่มีสิทธิ์">
    ใช้ credential Anthropic ที่มีสิทธิ์สำหรับคำขอ long-context หรือเปลี่ยนไปใช้ Anthropic API key
  </Step>
  <Step title="กำหนดค่าโมเดลสำรอง">
    กำหนดค่าโมเดลสำรองเพื่อให้ run ดำเนินต่อได้เมื่อคำขอ long-context ของ Anthropic ถูกปฏิเสธ
  </Step>
</Steps>

ที่เกี่ยวข้อง:

- [Anthropic](/th/providers/anthropic)
- [การใช้ token และค่าใช้จ่าย](/th/reference/token-use)
- [ทำไมฉันถึงเห็น HTTP 429 จาก Anthropic?](/th/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Backend ในเครื่องที่เข้ากันได้กับ OpenAI ผ่านการ probe โดยตรง แต่ agent run ล้มเหลว

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
- error `model_not_found` หรือ 404 แม้ว่า `/v1/chat/completions` โดยตรง
  จะใช้งานได้กับ bare model id เดียวกัน
- error ของ backend เกี่ยวกับ `messages[].content` ที่คาดหวัง string
- คำเตือน `incomplete turn detected ... stopReason=stop payloads=0` เป็นครั้งคราวกับ backend ในเครื่องที่เข้ากันได้กับ OpenAI
- backend crash ที่ปรากฏเฉพาะเมื่อจำนวน prompt-token ใหญ่ขึ้นหรือใช้ prompt ของ agent runtime เต็มรูปแบบ

<AccordionGroup>
  <Accordion title="ลายเซ็นที่พบบ่อย">
    - `model_not_found` กับเซิร์ฟเวอร์สไตล์ MLX/vLLM ในเครื่อง → ตรวจสอบว่า `baseUrl` มี `/v1`, `api` เป็น `"openai-completions"` สำหรับ backend `/v1/chat/completions` และ `models.providers.<provider>.models[].id` เป็น bare provider-local id เลือกด้วย provider prefix หนึ่งครั้ง เช่น `mlx/mlx-community/Qwen3-30B-A3B-6bit`; เก็บรายการ catalog เป็น `mlx-community/Qwen3-30B-A3B-6bit`
    - `messages[...].content: invalid type: sequence, expected a string` → backend ปฏิเสธ structured Chat Completions content parts วิธีแก้: ตั้ง `models.providers.<provider>.models[].compat.requiresStringContent: true`
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend ทำคำขอ Chat Completions เสร็จแล้ว แต่ไม่คืนข้อความ assistant ที่ผู้ใช้เห็นได้สำหรับ turn นั้น OpenClaw จะลองซ้ำ turn ว่างของ OpenAI-compatible ที่ replay-safe หนึ่งครั้ง; ความล้มเหลวที่คงอยู่มักหมายความว่า backend กำลังปล่อย content ว่าง/ไม่ใช่ข้อความ หรือ suppress ข้อความ final-answer
    - คำขอโดยตรงขนาดเล็กสำเร็จ แต่ OpenClaw agent run ล้มเหลวด้วย backend/model crash (เช่น Gemma ในบาง build ของ `inferrs`) → transport ของ OpenClaw น่าจะถูกต้องอยู่แล้ว; backend ล้มเหลวกับรูปแบบ prompt ของ agent-runtime ที่ใหญ่กว่า
    - ความล้มเหลวลดลงหลังปิดใช้งาน tools แต่ไม่หายไป → tool schema เป็นส่วนหนึ่งของแรงกดดัน แต่ปัญหาที่เหลือยังเป็นข้อจำกัดด้านความจุของโมเดล/เซิร์ฟเวอร์ upstream หรือ bug ของ backend

  </Accordion>
  <Accordion title="ตัวเลือกการแก้ไข">
    1. ตั้ง `compat.requiresStringContent: true` สำหรับ backend Chat Completions ที่รองรับเฉพาะ string
    2. ตั้ง `compat.supportsTools: false` สำหรับโมเดล/backend ที่ไม่สามารถจัดการพื้นผิว tool schema ของ OpenClaw ได้อย่างน่าเชื่อถือ
    3. ลดแรงกดดันของ prompt เท่าที่ทำได้: workspace bootstrap ที่เล็กลง, session history ที่สั้นลง, โมเดลในเครื่องที่เบาลง หรือ backend ที่รองรับ long-context ได้แข็งแรงกว่า
    4. หากคำขอโดยตรงขนาดเล็กยังผ่าน แต่ OpenClaw agent turn ยัง crash ภายใน backend ให้ถือว่าเป็นข้อจำกัดของเซิร์ฟเวอร์/โมเดล upstream และส่ง repro ที่นั่นพร้อมรูปแบบ payload ที่รับได้
  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [การกำหนดค่า](/th/gateway/configuration)
- [โมเดลในเครื่อง](/th/gateway/local-models)
- [endpoint ที่เข้ากันได้กับ OpenAI](/th/gateway/configuration-reference#openai-compatible-endpoints)

## ไม่มีการตอบกลับ

หาก channel ใช้งานได้แต่ไม่มีอะไรตอบ ให้ตรวจสอบ routing และ policy ก่อนเชื่อมต่อใหม่

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

มองหา:

- การ pairing ที่ pending สำหรับผู้ส่ง DM
- การ gating การ mention ใน group (`requireMention`, `mentionPatterns`)
- allowlist ของ channel/group ไม่ตรงกัน

ลายเซ็นที่พบบ่อย:

- `drop guild message (mention required` → ข้อความ group ถูกละเว้นจนกว่าจะมีการ mention
- `pairing request` → ผู้ส่งต้องได้รับการอนุมัติ
- `blocked` / `allowlist` → ผู้ส่ง/channel ถูกกรองโดย policy

ที่เกี่ยวข้อง:

- [การแก้ปัญหา channel](/th/channels/troubleshooting)
- [Group](/th/channels/groups)
- [Pairing](/th/channels/pairing)

## การเชื่อมต่อ dashboard control UI

เมื่อ dashboard/control UI ไม่เชื่อมต่อ ให้ตรวจสอบ URL, auth mode และสมมติฐานเรื่อง secure context

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

มองหา:

- Probe URL และ dashboard URL ที่ถูกต้อง
- Auth mode/token ไม่ตรงกันระหว่าง client และ gateway
- การใช้ HTTP ในจุดที่ต้องมี device identity

<AccordionGroup>
  <Accordion title="ลายเซ็น connect / auth">
    - `device identity required` → context ไม่ปลอดภัยหรือขาด device auth
    - `origin not allowed` → `Origin` ของ browser ไม่อยู่ใน `gateway.controlUi.allowedOrigins` (หรือคุณกำลังเชื่อมต่อจาก browser origin ที่ไม่ใช่ loopback โดยไม่มี allowlist ที่ระบุชัดเจน)
    - `device nonce required` / `device nonce mismatch` → client ไม่ได้ทำ challenge-based device auth flow ให้เสร็จ (`connect.challenge` + `device.nonce`)
    - `device signature invalid` / `device signature expired` → client ลงนาม payload ผิด (หรือ timestamp เก่า) สำหรับ handshake ปัจจุบัน
    - `AUTH_TOKEN_MISMATCH` พร้อม `canRetryWithDeviceToken=true` → client สามารถ trusted retry หนึ่งครั้งด้วย cached device token
    - การ retry ด้วย cached-token นั้นใช้ชุด scope ที่ cache ไว้ซึ่งเก็บร่วมกับ paired device token ซ้ำ ผู้เรียกที่ระบุ `deviceToken` / `scopes` อย่างชัดเจนจะยังคงใช้ชุด scope ที่ขอไว้แทน
    - นอกเส้นทาง retry นั้น ลำดับความสำคัญของ connect auth คือ shared token/password ที่ระบุชัดเจนก่อน จากนั้น `deviceToken` ที่ระบุชัดเจน จากนั้น stored device token แล้วจึงเป็น bootstrap token
    - บนเส้นทาง async Tailscale Serve Control UI ความพยายามที่ล้มเหลวสำหรับ `{scope, ip}` เดียวกันจะถูก serialize ก่อนที่ limiter จะบันทึกความล้มเหลว ดังนั้นการ retry พร้อมกันที่ไม่ถูกต้องสองครั้งจาก client เดียวกันอาจแสดง `retry later` ในความพยายามครั้งที่สองแทนที่จะเป็น mismatch ธรรมดาสองครั้ง
    - `too many failed authentication attempts (retry later)` จาก browser-origin loopback client → ความล้มเหลวซ้ำจาก `Origin` เดียวกันที่ normalize แล้วจะถูก lock out ชั่วคราว; origin localhost อื่นใช้ bucket แยกต่างหาก
    - `unauthorized` ซ้ำหลัง retry นั้น → shared token/device token drift; รีเฟรช token config และอนุมัติใหม่/หมุนเวียน device token หากจำเป็น
    - `gateway connect failed:` → host/port/url เป้าหมายผิด

  </Accordion>
</AccordionGroup>

### แผนที่ด่วนของ auth detail codes

ใช้ `error.details.code` จากการตอบกลับ `connect` ที่ล้มเหลวเพื่อเลือกการกระทำถัดไป

| รหัสรายละเอียด                 | ความหมาย                                                                                                                                                                                      | การดำเนินการที่แนะนำ                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Client ไม่ได้ส่ง shared token ที่จำเป็นมา                                                                                                                                                 | วาง/ตั้งค่า token ใน client แล้วลองอีกครั้ง สำหรับเส้นทาง dashboard: `openclaw config get gateway.auth.token` จากนั้นวางลงในการตั้งค่า Control UI                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | shared token ไม่ตรงกับ gateway auth token                                                                                                                                               | หาก `canRetryWithDeviceToken=true` ให้อนุญาตการลองซ้ำที่เชื่อถือได้หนึ่งครั้ง การลองซ้ำด้วย cached-token จะใช้ approved scopes ที่จัดเก็บไว้ซ้ำ ส่วนผู้เรียกที่ระบุ `deviceToken` / `scopes` อย่างชัดเจนจะคง scopes ที่ร้องขอไว้ หากยังล้มเหลว ให้เรียกใช้ [รายการตรวจสอบการกู้คืน token drift](/th/cli/devices#token-drift-recovery-checklist) |
| `AUTH_DEVICE_TOKEN_MISMATCH` | cached per-device token เก่าหรือถูกเพิกถอนแล้ว                                                                                                                                                 | หมุนเวียน/อนุมัติ device token อีกครั้งโดยใช้ [devices CLI](/th/cli/devices) จากนั้นเชื่อมต่อใหม่                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | ต้องอนุมัติข้อมูลประจำตัวของอุปกรณ์ ตรวจสอบ `error.details.reason` สำหรับ `not-paired`, `scope-upgrade`, `role-upgrade` หรือ `metadata-upgrade` และใช้ `requestId` / `remediationHint` เมื่อมีอยู่ | อนุมัติคำขอที่รอดำเนินการ: `openclaw devices list` จากนั้น `openclaw devices approve <requestId>` การอัปเกรด scope/role ใช้ขั้นตอนเดียวกันหลังจากคุณตรวจสอบสิทธิ์การเข้าถึงที่ร้องขอแล้ว                                                                                                               |

<Note>
backend RPC แบบ Direct loopback ที่ยืนยันตัวตนด้วย shared gateway token/password ไม่ควรขึ้นกับ paired-device scope baseline ของ CLI หาก subagents หรือการเรียกภายในอื่น ๆ ยังล้มเหลวด้วย `scope-upgrade` ให้ตรวจสอบว่าผู้เรียกใช้ `client.id: "gateway-client"` และ `client.mode: "backend"` และไม่ได้บังคับใช้ `deviceIdentity` หรือ device token อย่างชัดเจน
</Note>

การตรวจสอบการย้ายข้อมูล Device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

หาก logs แสดงข้อผิดพลาด nonce/signature ให้อัปเดต client ที่เชื่อมต่อและตรวจสอบดังนี้:

<Steps>
  <Step title="รอ connect.challenge">
    Client รอ `connect.challenge` ที่ Gateway ออกให้
  </Step>
  <Step title="ลงนาม payload">
    Client ลงนาม payload ที่ผูกกับ challenge
  </Step>
  <Step title="ส่ง device nonce">
    Client ส่ง `connect.params.device.nonce` พร้อม challenge nonce เดียวกัน
  </Step>
</Steps>

หาก `openclaw devices rotate` / `revoke` / `remove` ถูกปฏิเสธโดยไม่คาดคิด:

- เซสชัน paired-device token สามารถจัดการได้เฉพาะอุปกรณ์ **ของตัวเอง** เท่านั้น เว้นแต่ผู้เรียกจะมี `operator.admin` ด้วย
- `openclaw devices rotate --scope ...` สามารถร้องขอ operator scopes ได้เฉพาะ scopes ที่เซสชันผู้เรียกมีอยู่แล้วเท่านั้น

ที่เกี่ยวข้อง:

- [การกำหนดค่า](/th/gateway/configuration) (โหมด gateway auth)
- [Control UI](/th/web/control-ui)
- [อุปกรณ์](/th/cli/devices)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [Trusted proxy auth](/th/gateway/trusted-proxy-auth)

## บริการ Gateway ไม่ได้ทำงาน

ใช้ส่วนนี้เมื่อบริการติดตั้งแล้วแต่ process ไม่คงสถานะทำงาน

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # สแกนบริการระดับระบบด้วย
```

มองหา:

- `Runtime: stopped` พร้อมคำใบ้ exit
- การตั้งค่า service ไม่ตรงกัน (`Config (cli)` เทียบกับ `Config (service)`)
- ความขัดแย้งของ port/listener
- การติดตั้ง launchd/systemd/schtasks เพิ่มเติมเมื่อใช้ `--deep`
- คำใบ้การล้างข้อมูล `Other gateway-like services detected (best effort)`

<AccordionGroup>
  <Accordion title="รูปแบบที่พบบ่อย">
    - `Gateway start blocked: set gateway.mode=local` หรือ `existing config is missing gateway.mode` → โหมด local Gateway ไม่ได้เปิดใช้งาน หรือไฟล์ config ถูกเขียนทับและสูญเสีย `gateway.mode` วิธีแก้: ตั้งค่า `gateway.mode="local"` ใน config ของคุณ หรือเรียกใช้ `openclaw onboard --mode local` / `openclaw setup` อีกครั้งเพื่อประทับ config โหมด local ที่คาดไว้ใหม่ หากคุณกำลังเรียกใช้ OpenClaw ผ่าน Podman เส้นทาง config เริ่มต้นคือ `~/.openclaw/openclaw.json`
    - `refusing to bind gateway ... without auth` → bind แบบ non-loopback โดยไม่มีเส้นทาง gateway auth ที่ถูกต้อง (token/password หรือ trusted-proxy เมื่อกำหนดค่าไว้)
    - `another gateway instance is already listening` / `EADDRINUSE` → port ขัดแย้งกัน
    - `Other gateway-like services detected (best effort)` → มีหน่วย launchd/systemd/schtasks ที่ค้างหรือทำงานคู่ขนานอยู่ การตั้งค่าส่วนใหญ่ควรมี Gateway หนึ่งตัวต่อเครื่อง หากคุณจำเป็นต้องมีมากกว่าหนึ่งจริง ๆ ให้แยก ports + config/state/workspace ดู [/gateway#multiple-gateways-same-host](/th/gateway#multiple-gateways-same-host)
    - `System-level OpenClaw gateway service detected` จาก doctor → มี systemd system unit อยู่ในขณะที่ user-level service หายไป ลบหรือปิดใช้งานตัวซ้ำก่อนอนุญาตให้ doctor ติดตั้ง user service หรือตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` หาก system unit เป็น supervisor ที่ตั้งใจใช้
    - `Gateway service port does not match current gateway config` → supervisor ที่ติดตั้งไว้ยังคงตรึง `--port` เก่าไว้ เรียกใช้ `openclaw doctor --fix` หรือ `openclaw gateway install --force` จากนั้นรีสตาร์ตบริการ Gateway

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Background exec และ process tool](/th/gateway/background-process)
- [การกำหนดค่า](/th/gateway/configuration)
- [Doctor](/th/gateway/doctor)

## Gateway กู้คืน config last-known-good

ใช้ส่วนนี้เมื่อ Gateway เริ่มทำงาน แต่ logs บอกว่ากู้คืน `openclaw.json`

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
- main-agent system event ที่เริ่มด้วย `Config recovery warning`

<AccordionGroup>
  <Accordion title="เกิดอะไรขึ้น">
    - config ที่ถูกปฏิเสธไม่ผ่านการตรวจสอบระหว่าง startup หรือ hot reload
    - OpenClaw เก็บ payload ที่ถูกปฏิเสธไว้เป็น `.clobbered.*`
    - config ที่ใช้งานอยู่ถูกกู้คืนจากสำเนา last-known-good ที่ตรวจสอบผ่านครั้งล่าสุด
    - turn ถัดไปของ main-agent จะถูกเตือนไม่ให้เขียน config ที่ถูกปฏิเสธซ้ำแบบไม่ตรวจสอบ
    - หากปัญหาการตรวจสอบทั้งหมดอยู่ภายใต้ `plugins.entries.<id>...` OpenClaw จะไม่กู้คืนทั้งไฟล์ ความล้มเหลวเฉพาะ Plugin จะยังคงแจ้งชัด ขณะที่การตั้งค่าผู้ใช้ที่ไม่เกี่ยวข้องยังอยู่ใน config ที่ใช้งานอยู่

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
  <Accordion title="รูปแบบที่พบบ่อย">
    - มี `.clobbered.*` → การแก้ไขโดยตรงจากภายนอกหรือการอ่านตอน startup ถูกกู้คืน
    - มี `.rejected.*` → การเขียน config ที่ OpenClaw เป็นเจ้าของล้มเหลวจาก schema หรือการตรวจสอบ clobber ก่อน commit
    - `Config write rejected:` → การเขียนพยายามลบ shape ที่จำเป็น ลดขนาดไฟล์อย่างมาก หรือบันทึก config ที่ไม่ถูกต้อง
    - `Rejected validation details:` → recovery log หรือประกาศ main-agent รวม schema path ที่ทำให้เกิดการกู้คืน เช่น `agents.defaults.execution` หรือ `gateway.auth.password.source`
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` หรือ `size-drop-vs-last-good:*` → startup ถือว่าไฟล์ปัจจุบันถูก clobber เพราะสูญเสีย fields หรือขนาดเมื่อเทียบกับ backup last-known-good
    - `Config last-known-good promotion skipped` → candidate มี placeholder ความลับที่ถูก redact เช่น `***`

  </Accordion>
  <Accordion title="ตัวเลือกการแก้ไข">
    1. เก็บ config ที่ใช้งานอยู่ซึ่งถูกกู้คืนไว้ หากถูกต้องแล้ว
    2. คัดลอกเฉพาะ keys ที่ตั้งใจจาก `.clobbered.*` หรือ `.rejected.*` จากนั้นใช้กับ `openclaw config set` หรือ `config.patch`
    3. เรียกใช้ `openclaw config validate` ก่อนรีสตาร์ต
    4. หากคุณแก้ไขด้วยมือ ให้เก็บ config JSON5 แบบเต็ม ไม่ใช่แค่ partial object ที่ต้องการเปลี่ยน
  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Config](/th/cli/config)
- [การกำหนดค่า: hot reload](/th/gateway/configuration#config-hot-reload)
- [การกำหนดค่า: strict validation](/th/gateway/configuration#strict-validation)
- [Doctor](/th/gateway/doctor)

## คำเตือน Gateway probe

ใช้ส่วนนี้เมื่อ `openclaw gateway probe` เข้าถึงบางอย่างได้ แต่ยังพิมพ์บล็อกคำเตือน

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

มองหา:

- `warnings[].code` และ `primaryTargetId` ในเอาต์พุต JSON
- ว่าคำเตือนเกี่ยวกับ SSH fallback, Gateway หลายตัว, scopes ที่ขาดหาย หรือ auth refs ที่แก้ค่าไม่ได้

รูปแบบที่พบบ่อย:

- `SSH tunnel failed to start; falling back to direct probes.` → การตั้งค่า SSH ล้มเหลว แต่คำสั่งยังคงลอง targets ที่กำหนดค่าไว้/loopback โดยตรง
- `multiple reachable gateways detected` → มี target มากกว่าหนึ่งตัวตอบกลับ โดยปกติหมายถึงการตั้งค่า multi-gateway ที่ตั้งใจไว้ หรือ listeners ที่ค้าง/ซ้ำ
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → เชื่อมต่อสำเร็จ แต่ RPC รายละเอียดถูกจำกัดด้วย scope; จับคู่ device identity หรือใช้ credentials ที่มี `operator.read`
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → เชื่อมต่อสำเร็จ แต่ชุด diagnostic RPC เต็ม timed out หรือล้มเหลว ให้ถือว่านี่คือ Gateway ที่เข้าถึงได้พร้อม diagnostics ที่ลดระดับ; เปรียบเทียบ `connect.ok` และ `connect.rpcOk` ในเอาต์พุต `--json`
- `Capability: pairing-pending` หรือ `gateway closed (1008): pairing required` → Gateway ตอบกลับแล้ว แต่ client นี้ยังต้อง pairing/approval ก่อนเข้าถึง operator ตามปกติ
- ข้อความเตือน SecretRef ของ `gateway.auth.*` / `gateway.remote.*` ที่แก้ค่าไม่ได้ → auth material ไม่พร้อมใช้งานในเส้นทางคำสั่งนี้สำหรับ target ที่ล้มเหลว

ที่เกี่ยวข้อง:

- [Gateway](/th/cli/gateway)
- [Gateway หลายตัวบน host เดียวกัน](/th/gateway#multiple-gateways-same-host)
- [การเข้าถึงระยะไกล](/th/gateway/remote)

## Channel เชื่อมต่อแล้ว แต่ข้อความไม่ไหล

หากสถานะ channel เป็น connected แต่การไหลของข้อความหยุดทำงาน ให้เน้นที่ policy, permissions และกฎการส่งมอบเฉพาะ channel

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

มองหา:

- นโยบาย DM (`pairing`, `allowlist`, `open`, `disabled`).
- รายการอนุญาตของกลุ่มและข้อกำหนดการเมนชัน.
- สิทธิ์/ขอบเขต Channel API ที่ขาดหาย.

ลายเซ็นที่พบบ่อย:

- `mention required` → ข้อความถูกละเว้นโดยนโยบายการเมนชันของกลุ่ม.
- `pairing` / ร่องรอยการรออนุมัติ → ผู้ส่งยังไม่ได้รับอนุมัติ.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → ปัญหาการยืนยันตัวตน/สิทธิ์ของช่องทาง.

ที่เกี่ยวข้อง:

- [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)
- [Discord](/th/channels/discord)
- [Telegram](/th/channels/telegram)
- [WhatsApp](/th/channels/whatsapp)

## การส่ง Cron และ Heartbeat

หาก Cron หรือ Heartbeat ไม่ได้รันหรือไม่ได้ส่ง ให้ตรวจสอบสถานะตัวจัดกำหนดการก่อน แล้วจึงตรวจสอบเป้าหมายการส่ง.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

มองหา:

- Cron เปิดใช้งานอยู่และมีการปลุกครั้งถัดไป.
- สถานะประวัติการรันงาน (`ok`, `skipped`, `error`).
- เหตุผลที่ข้าม Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="ลายเซ็นที่พบบ่อย">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron ถูกปิดใช้งาน.
    - `cron: timer tick failed` → รอบตัวจับเวลาของตัวจัดกำหนดการล้มเหลว; ตรวจสอบข้อผิดพลาดของไฟล์/บันทึก/runtime.
    - `heartbeat skipped` พร้อม `reason=quiet-hours` → อยู่นอกช่วงเวลาทำงาน.
    - `heartbeat skipped` พร้อม `reason=empty-heartbeat-file` → มี `HEARTBEAT.md` อยู่ แต่มีเพียงบรรทัดว่าง / หัวข้อ Markdown ดังนั้น OpenClaw จึงข้ามการเรียกโมเดล.
    - `heartbeat skipped` พร้อม `reason=no-tasks-due` → `HEARTBEAT.md` มีบล็อก `tasks:` แต่ไม่มีงานใดถึงกำหนดในรอบนี้.
    - `heartbeat: unknown accountId` → id บัญชีไม่ถูกต้องสำหรับเป้าหมายการส่ง Heartbeat.
    - `heartbeat skipped` พร้อม `reason=dm-blocked` → เป้าหมาย Heartbeat ถูกแปลงเป็นปลายทางลักษณะ DM ขณะที่ `agents.defaults.heartbeat.directPolicy` (หรือการแทนที่ต่อเอเจนต์) ถูกตั้งเป็น `block`.

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Heartbeat](/th/gateway/heartbeat)
- [งานที่ตั้งเวลาไว้](/th/automation/cron-jobs)
- [งานที่ตั้งเวลาไว้: การแก้ไขปัญหา](/th/automation/cron-jobs#troubleshooting)

## Node จับคู่แล้ว แต่เครื่องมือล้มเหลว

หาก Node จับคู่แล้วแต่เครื่องมือล้มเหลว ให้แยกตรวจสถานะ foreground, สิทธิ์ และการอนุมัติ.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

มองหา:

- Node ออนไลน์พร้อมความสามารถที่คาดไว้.
- การให้สิทธิ์ของ OS สำหรับกล้อง/ไมค์/ตำแหน่ง/หน้าจอ.
- การอนุมัติ exec และสถานะรายการอนุญาต.

ลายเซ็นที่พบบ่อย:

- `NODE_BACKGROUND_UNAVAILABLE` → แอป Node ต้องอยู่ใน foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → ขาดสิทธิ์ของ OS.
- `SYSTEM_RUN_DENIED: approval required` → รอการอนุมัติ exec.
- `SYSTEM_RUN_DENIED: allowlist miss` → คำสั่งถูกบล็อกโดยรายการอนุญาต.

ที่เกี่ยวข้อง:

- [การอนุมัติ exec](/th/tools/exec-approvals)
- [การแก้ไขปัญหา Node](/th/nodes/troubleshooting)
- [Nodes](/th/nodes/index)

## เครื่องมือ Browser ล้มเหลว

ใช้ส่วนนี้เมื่อการทำงานของเครื่องมือ Browser ล้มเหลว แม้ว่า Gateway เองจะทำงานปกติ.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

มองหา:

- ว่า `plugins.allow` ถูกตั้งค่าไว้และมี `browser` รวมอยู่หรือไม่.
- เส้นทาง executable ของเบราว์เซอร์ที่ถูกต้อง.
- การเข้าถึงโปรไฟล์ CDP.
- ความพร้อมใช้งานของ Chrome ในเครื่องสำหรับโปรไฟล์ `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="ลายเซ็น Plugin / executable">
    - `unknown command "browser"` หรือ `unknown command 'browser'` → Plugin browser ที่มาพร้อมชุดถูกตัดออกโดย `plugins.allow`.
    - เครื่องมือ browser หายไป / ไม่พร้อมใช้งาน ขณะที่ `browser.enabled=true` → `plugins.allow` ไม่รวม `browser` ดังนั้น Plugin จึงไม่เคยโหลด.
    - `Failed to start Chrome CDP on port` → โปรเซสเบราว์เซอร์เริ่มทำงานไม่สำเร็จ.
    - `browser.executablePath not found` → เส้นทางที่กำหนดค่าไว้ไม่ถูกต้อง.
    - `browser.cdpUrl must be http(s) or ws(s)` → CDP URL ที่กำหนดค่าไว้ใช้ scheme ที่ไม่รองรับ เช่น `file:` หรือ `ftp:`.
    - `browser.cdpUrl has invalid port` → CDP URL ที่กำหนดค่าไว้มีพอร์ตผิดหรืออยู่นอกช่วง.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → การติดตั้ง Gateway ปัจจุบันไม่มี dependency runtime `playwright-core` ของ Plugin browser ที่มาพร้อมชุด; รัน `openclaw doctor --fix` แล้วรีสตาร์ท Gateway. สแนปช็อต ARIA และภาพหน้าจอพื้นฐานของหน้าเว็บยังทำงานได้ แต่การนำทาง, สแนปช็อต AI, ภาพหน้าจอ element ด้วย CSS selector และการส่งออก PDF ยังไม่พร้อมใช้งาน.

  </Accordion>
  <Accordion title="ลายเซ็น Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → existing-session ของ Chrome MCP ยังแนบกับไดเรกทอรีข้อมูลเบราว์เซอร์ที่เลือกไม่ได้. เปิดหน้า inspect ของเบราว์เซอร์, เปิดใช้ remote debugging, เปิดเบราว์เซอร์ค้างไว้, อนุมัติพรอมป์การแนบครั้งแรก แล้วลองใหม่. หากไม่ต้องใช้สถานะลงชื่อเข้าใช้ ให้ใช้โปรไฟล์ `openclaw` ที่จัดการให้.
    - `No Chrome tabs found for profile="user"` → โปรไฟล์แนบ Chrome MCP ไม่มีแท็บ Chrome ในเครื่องที่เปิดอยู่.
    - `Remote CDP for profile "<name>" is not reachable` → ปลายทาง CDP ระยะไกลที่กำหนดค่าไว้เข้าถึงไม่ได้จากโฮสต์ Gateway.
    - `Browser attachOnly is enabled ... not reachable` หรือ `Browser attachOnly is enabled and CDP websocket ... is not reachable` → โปรไฟล์ attach-only ไม่มีเป้าหมายที่เข้าถึงได้ หรือปลายทาง HTTP ตอบกลับแล้วแต่ยังเปิด CDP WebSocket ไม่ได้.

  </Accordion>
  <Accordion title="ลายเซ็น Element / screenshot / upload">
    - `fullPage is not supported for element screenshots` → คำขอภาพหน้าจอผสม `--full-page` กับ `--ref` หรือ `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → การเรียกภาพหน้าจอของ Chrome MCP / `existing-session` ต้องใช้การจับภาพหน้าเว็บหรือ `--ref` จากสแนปช็อต ไม่ใช่ CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hook การอัปโหลดของ Chrome MCP ต้องใช้ ref จากสแนปช็อต ไม่ใช่ CSS selector.
    - `existing-session file uploads currently support one file at a time.` → ส่งอัปโหลดหนึ่งไฟล์ต่อการเรียกหนึ่งครั้งบนโปรไฟล์ Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → hook กล่องโต้ตอบบนโปรไฟล์ Chrome MCP ไม่รองรับการแทนที่ timeout.
    - `existing-session type does not support timeoutMs overrides.` → ละ `timeoutMs` สำหรับ `act:type` บนโปรไฟล์ existing-session ของ `profile="user"` / Chrome MCP หรือใช้โปรไฟล์เบราว์เซอร์ managed/CDP เมื่อต้องใช้ timeout แบบกำหนดเอง.
    - `existing-session evaluate does not support timeoutMs overrides.` → ละ `timeoutMs` สำหรับ `act:evaluate` บนโปรไฟล์ existing-session ของ `profile="user"` / Chrome MCP หรือใช้โปรไฟล์เบราว์เซอร์ managed/CDP เมื่อต้องใช้ timeout แบบกำหนดเอง.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` ยังต้องใช้เบราว์เซอร์ managed หรือโปรไฟล์ CDP ดิบ.
    - stale viewport / dark-mode / locale / offline overrides บนโปรไฟล์ attach-only หรือ remote CDP → รัน `openclaw browser stop --browser-profile <name>` เพื่อปิดเซสชันควบคุมที่ใช้งานอยู่และปล่อยสถานะการจำลองของ Playwright/CDP โดยไม่ต้องรีสตาร์ท Gateway ทั้งหมด.

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Browser (จัดการโดย OpenClaw)](/th/tools/browser)
- [การแก้ไขปัญหา Browser](/th/tools/browser-linux-troubleshooting)

## หากคุณอัปเกรดแล้วบางอย่างเสียกะทันหัน

ปัญหาหลังอัปเกรดส่วนใหญ่คือ config drift หรือค่าเริ่มต้นที่เข้มงวดขึ้นซึ่งตอนนี้ถูกบังคับใช้.

<AccordionGroup>
  <Accordion title="1. ลักษณะการทำงานของ Auth และการแทนที่ URL เปลี่ยนไป">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    สิ่งที่ต้องตรวจสอบ:

    - หาก `gateway.mode=remote` การเรียก CLI อาจกำลังชี้ไปที่ระยะไกล ขณะที่บริการในเครื่องของคุณทำงานปกติ.
    - การเรียกด้วย `--url` แบบชัดเจนจะไม่ fallback ไปใช้ข้อมูลรับรองที่เก็บไว้.

    ลายเซ็นที่พบบ่อย:

    - `gateway connect failed:` → เป้าหมาย URL ผิด.
    - `unauthorized` → ปลายทางเข้าถึงได้ แต่ auth ผิด.

  </Accordion>
  <Accordion title="2. Guardrail ของ bind และ auth เข้มงวดขึ้น">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    สิ่งที่ต้องตรวจสอบ:

    - การ bind แบบไม่ใช่ loopback (`lan`, `tailnet`, `custom`) ต้องมีเส้นทาง auth ของ Gateway ที่ถูกต้อง: auth ด้วย token/password ร่วมกัน หรือ deployment `trusted-proxy` แบบไม่ใช่ loopback ที่กำหนดค่าอย่างถูกต้อง.
    - คีย์เก่าอย่าง `gateway.token` ไม่ได้แทนที่ `gateway.auth.token`.

    ลายเซ็นที่พบบ่อย:

    - `refusing to bind gateway ... without auth` → bind แบบไม่ใช่ loopback โดยไม่มีเส้นทาง auth ของ Gateway ที่ถูกต้อง.
    - `Connectivity probe: failed` ขณะที่ runtime กำลังทำงาน → Gateway ทำงานอยู่แต่เข้าถึงไม่ได้ด้วย auth/url ปัจจุบัน.

  </Accordion>
  <Accordion title="3. สถานะการจับคู่และตัวตนอุปกรณ์เปลี่ยนไป">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    สิ่งที่ต้องตรวจสอบ:

    - การอนุมัติอุปกรณ์ที่รอดำเนินการสำหรับแดชบอร์ด/Nodes.
    - การอนุมัติการจับคู่ DM ที่รอดำเนินการหลังการเปลี่ยนแปลงนโยบายหรือตัวตน.

    ลายเซ็นที่พบบ่อย:

    - `device identity required` → device auth ยังไม่ผ่าน.
    - `pairing required` → ผู้ส่ง/อุปกรณ์ต้องได้รับอนุมัติ.

  </Accordion>
</AccordionGroup>

หาก config ของบริการและ runtime ยังไม่ตรงกันหลังตรวจสอบแล้ว ให้ติดตั้ง metadata ของบริการใหม่จากไดเรกทอรีโปรไฟล์/สถานะเดียวกัน:

```bash
openclaw gateway install --force
openclaw gateway restart
```

ที่เกี่ยวข้อง:

- [Authentication](/th/gateway/authentication)
- [Exec เบื้องหลังและเครื่องมือโปรเซส](/th/gateway/background-process)
- [การจับคู่ที่ Gateway เป็นเจ้าของ](/th/gateway/pairing)

## ที่เกี่ยวข้อง

- [Doctor](/th/gateway/doctor)
- [FAQ](/th/help/faq)
- [Runbook ของ Gateway](/th/gateway)
