---
read_when:
    - ฮับการแก้ไขปัญหาได้ชี้คุณมาที่นี่เพื่อการวินิจฉัยที่ลึกขึ้น
    - คุณต้องมีส่วนของรันบุ๊กตามอาการที่มีความเสถียร พร้อมคำสั่งที่แน่นอน
summary: รันบุ๊กการแก้ไขปัญหาเชิงลึกสำหรับ Gateway, ช่องทาง, การทำงานอัตโนมัติ, Nodes และเบราว์เซอร์
title: การแก้ไขปัญหา
x-i18n:
    generated_at: "2026-04-25T13:49:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2270f05cf34592269894278e1eb75b8d47c02a4ff1c74bf62afb3d8f4fc4640
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# การแก้ไขปัญหา Gateway

หน้านี้คือรันบุ๊กเชิงลึก
เริ่มที่ [/help/troubleshooting](/th/help/troubleshooting) หากคุณต้องการ flow การคัดแยกปัญหาแบบเร็วก่อน

## ลำดับคำสั่ง

ให้รันคำสั่งเหล่านี้ก่อน ตามลำดับนี้:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

สัญญาณปกติที่ควรพบ:

- `openclaw gateway status` แสดง `Runtime: running`, `Connectivity probe: ok` และบรรทัด `Capability: ...`
- `openclaw doctor` รายงานว่าไม่มีปัญหา config/service ที่ขัดขวางการทำงาน
- `openclaw channels status --probe` แสดงสถานะ transport แบบ live แยกตามบัญชี และ
  ในจุดที่รองรับ จะแสดงผล probe/audit เช่น `works` หรือ `audit ok`

## Anthropic 429 ต้องใช้การใช้งานเพิ่มเติมสำหรับ long context

ใช้หัวข้อนี้เมื่อ logs/errors มีข้อความ:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

สิ่งที่ต้องมองหา:

- โมเดล Anthropic Opus/Sonnet ที่เลือกไว้มี `params.context1m: true`
- ข้อมูลรับรอง Anthropic ปัจจุบันไม่มีสิทธิ์สำหรับการใช้งาน long-context
- คำขอล้มเหลวเฉพาะในเซสชันยาวหรือการรันโมเดลที่ต้องใช้เส้นทางเบต้า 1M

วิธีแก้ที่เป็นไปได้:

1. ปิด `context1m` สำหรับโมเดลนั้นเพื่อ fallback ไปยัง context window ปกติ
2. ใช้ข้อมูลรับรอง Anthropic ที่มีสิทธิ์สำหรับคำขอ long-context หรือสลับไปใช้ Anthropic API key
3. กำหนด fallback models เพื่อให้การรันดำเนินต่อได้เมื่อคำขอ long-context ของ Anthropic ถูกปฏิเสธ

ที่เกี่ยวข้อง:

- [Anthropic](/th/providers/anthropic)
- [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use)
- [ทำไมฉันจึงเห็น HTTP 429 จาก Anthropic?](/th/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## backend ในเครื่องที่เข้ากันได้กับ OpenAI ผ่าน direct probes แต่การรัน agent ล้มเหลว

ใช้หัวข้อนี้เมื่อ:

- `curl ... /v1/models` ใช้งานได้
- การเรียก `/v1/chat/completions` โดยตรงแบบเล็กมากใช้งานได้
- การรันโมเดลของ OpenClaw ล้มเหลวเฉพาะใน agent turns ปกติ

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

สิ่งที่ต้องมองหา:

- การเรียกโดยตรงแบบเล็กมากสำเร็จ แต่การรันของ OpenClaw ล้มเหลวเฉพาะกับ prompt ที่ใหญ่กว่า
- backend errors เกี่ยวกับ `messages[].content` ที่คาดว่าเป็นสตริง
- backend crashes ที่เกิดขึ้นเฉพาะกับจำนวน prompt-token ที่มากขึ้นหรือ prompt ของ agent runtime แบบเต็ม

ลักษณะที่พบบ่อย:

- `messages[...].content: invalid type: sequence, expected a string` → backend
  ปฏิเสธ structured content parts ของ Chat Completions วิธีแก้: ตั้ง
  `models.providers.<provider>.models[].compat.requiresStringContent: true`
- คำขอขนาดเล็กโดยตรงสำเร็จ แต่การรัน agent ของ OpenClaw ล้มเหลวด้วย backend/model
  crashes (เช่น Gemma บนบางรุ่นของ `inferrs`) → transport ของ OpenClaw
  น่าจะถูกต้องแล้ว; ปัญหาอยู่ที่ backend ซึ่งล้มเหลวกับรูปร่างของ prompt
  ขนาดใหญ่จาก agent runtime
- ความล้มเหลวลดลงหลังปิด tools แต่ไม่หายไป → tool schemas เป็นส่วนหนึ่งของแรงกดดัน
  แต่ปัญหาที่เหลือยังคงเป็นข้อจำกัดของโมเดล/เซิร์ฟเวอร์ upstream หรือเป็น backend bug

วิธีแก้ที่เป็นไปได้:

1. ตั้ง `compat.requiresStringContent: true` สำหรับ backends ของ Chat Completions ที่รองรับเฉพาะสตริง
2. ตั้ง `compat.supportsTools: false` สำหรับ models/backends ที่ไม่สามารถรองรับ
   พื้นผิว schema ของ tool ของ OpenClaw ได้อย่างน่าเชื่อถือ
3. ลดแรงกดดันของ prompt เท่าที่ทำได้: bootstrap ของ workspace ที่เล็กลง ประวัติเซสชันที่สั้นลง
   local model ที่เบากว่า หรือ backend ที่รองรับ long-context ได้ดีกว่า
4. หากคำขอขนาดเล็กโดยตรงยังผ่าน แต่ agent turns ของ OpenClaw ยังคง crash ภายใน backend
   ให้ถือว่าเป็นข้อจำกัดของเซิร์ฟเวอร์/โมเดล upstream และส่ง repro ไปที่นั่นพร้อม payload shape ที่ยอมรับได้

ที่เกี่ยวข้อง:

- [โมเดลในเครื่อง](/th/gateway/local-models)
- [การกำหนดค่า](/th/gateway/configuration)
- [OpenAI-compatible endpoints](/th/gateway/configuration-reference#openai-compatible-endpoints)

## ไม่มีการตอบกลับ

หากช่องทางทำงานอยู่แต่ไม่มีอะไรตอบกลับ ให้ตรวจสอบการกำหนดเส้นทางและนโยบายก่อนจะเชื่อมต่อใหม่ใด ๆ

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

สิ่งที่ต้องมองหา:

- DM senders ยังรอ Pairing
- การกั้นด้วย mention ในกลุ่ม (`requireMention`, `mentionPatterns`)
- ความไม่ตรงกันของ allowlist ระหว่างช่องทาง/กลุ่ม

ลักษณะที่พบบ่อย:

- `drop guild message (mention required` → ข้อความกลุ่มถูกละเลยจนกว่าจะมี mention
- `pairing request` → ผู้ส่งต้องได้รับการอนุมัติ
- `blocked` / `allowlist` → ผู้ส่ง/ช่องทางถูกกรองโดยนโยบาย

ที่เกี่ยวข้อง:

- [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)
- [Pairing](/th/channels/pairing)
- [Groups](/th/channels/groups)

## การเชื่อมต่อของ Dashboard control ui

เมื่อ dashboard/control UI ไม่สามารถเชื่อมต่อได้ ให้ตรวจสอบ URL, โหมด auth และสมมติฐาน secure context

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

สิ่งที่ต้องมองหา:

- probe URL และ dashboard URL ที่ถูกต้อง
- auth mode/token ไม่ตรงกันระหว่างไคลเอนต์กับ gateway
- การใช้ HTTP ในกรณีที่ต้องใช้ device identity

ลักษณะที่พบบ่อย:

- `device identity required` → เป็น non-secure context หรือไม่มี device auth
- `origin not allowed` → browser `Origin` ไม่อยู่ใน `gateway.controlUi.allowedOrigins`
  (หรือคุณกำลังเชื่อมต่อจาก browser origin ที่ไม่ใช่ loopback โดยไม่มี
  allowlist แบบ explicit)
- `device nonce required` / `device nonce mismatch` → ไคลเอนต์ไม่ได้ทำ
  challenge-based device auth flow ให้ครบ (`connect.challenge` + `device.nonce`)
- `device signature invalid` / `device signature expired` → ไคลเอนต์เซ็น payload ผิด
  (หรือใช้ timestamp เก่า) สำหรับ handshake ปัจจุบัน
- `AUTH_TOKEN_MISMATCH` พร้อม `canRetryWithDeviceToken=true` → ไคลเอนต์สามารถ retry แบบเชื่อถือได้หนึ่งครั้งด้วย cached device token
- การ retry ด้วย cached-token นั้นจะใช้ชุด scopes ที่เก็บไว้พร้อมกับ paired
  device token ซ้ำ ส่วนผู้เรียกที่ใช้ `deviceToken` แบบ explicit / `scopes` แบบ explicit จะยังใช้ชุด scope ที่ร้องขอไว้เอง
- นอกเหนือจากเส้นทาง retry นั้น ลำดับความสำคัญของ connect auth คือ shared
  token/password แบบ explicit ก่อน จากนั้นจึง explicit `deviceToken`, then stored device token,
  แล้วจึง bootstrap token
- บนเส้นทาง Control UI แบบ async ของ Tailscale Serve ความพยายามที่ล้มเหลวสำหรับ `{scope, ip}` เดียวกันจะถูกทำให้เป็นลำดับก่อนที่ limiter จะบันทึกความล้มเหลว ดังนั้น bad concurrent retries สองครั้งจากไคลเอนต์เดียวกันอาจแสดง `retry later` ในความพยายามครั้งที่สองแทนที่จะเป็น mismatch ธรรมดาสองครั้ง
- `too many failed authentication attempts (retry later)` จากไคลเอนต์ loopback ที่มี browser-origin → ความล้มเหลวซ้ำ ๆ จาก `Origin` ที่ถูกทำให้เป็นมาตรฐานเดียวกันนั้นจะถูกล็อกชั่วคราว; localhost origin อื่นจะใช้บัคเก็ตแยก
- `unauthorized` ซ้ำ ๆ หลังจาก retry นั้น → shared token/device token ไม่ตรงกัน; รีเฟรช token config และอนุมัติใหม่/หมุน device token หากจำเป็น
- `gateway connect failed:` → host/port/url เป้าหมายไม่ถูกต้อง

### แผนที่ detail codes ของ Auth แบบรวดเร็ว

ใช้ `error.details.code` จาก `connect` response ที่ล้มเหลวเพื่อเลือกการดำเนินการถัดไป:

| Detail code                  | ความหมาย                                                                                                                                                                                        | การดำเนินการที่แนะนำ                                                                                                                                                                                                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | ไคลเอนต์ไม่ได้ส่ง shared token ที่จำเป็นมา                                                                                                                                                      | วาง/ตั้งค่า token ในไคลเอนต์แล้วลองใหม่ สำหรับเส้นทาง dashboard: `openclaw config get gateway.auth.token` แล้ววางลงใน Control UI settings                                                                                                                                                 |
| `AUTH_TOKEN_MISMATCH`        | shared token ไม่ตรงกับ gateway auth token                                                                                                                                                       | หาก `canRetryWithDeviceToken=true` ให้อนุญาต trusted retry หนึ่งครั้ง การ retry ด้วย cached-token จะใช้ approved scopes ที่เก็บไว้ซ้ำ ผู้เรียกที่ใช้ `deviceToken` / `scopes` แบบ explicit จะคง scope ที่ร้องขอไว้ หากยังล้มเหลว ให้รัน [เช็กลิสต์การกู้คืน token drift](/th/cli/devices#token-drift-recovery-checklist) |
| `AUTH_DEVICE_TOKEN_MISMATCH` | cached per-device token เก่าหรือถูกเพิกถอน                                                                                                                                                      | หมุน/อนุมัติ device token ใหม่โดยใช้ [devices CLI](/th/cli/devices) แล้วเชื่อมต่อใหม่                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | device identity ต้องได้รับการอนุมัติ ตรวจสอบ `error.details.reason` สำหรับ `not-paired`, `scope-upgrade`, `role-upgrade` หรือ `metadata-upgrade` และใช้ `requestId` / `remediationHint` หากมี | อนุมัติ pending request: `openclaw devices list` แล้ว `openclaw devices approve <requestId>` การอัปเกรด scope/role ใช้ flow เดียวกันหลังจากคุณตรวจสอบการเข้าถึงที่ร้องขอแล้ว                                                                                                              |

การตรวจสอบการย้ายไปใช้ device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

หาก logs แสดง nonce/signature errors ให้อัปเดตไคลเอนต์ที่เชื่อมต่อและตรวจสอบว่ามัน:

1. รอ `connect.challenge`
2. เซ็น payload ที่ผูกกับ challenge
3. ส่ง `connect.params.device.nonce` พร้อม challenge nonce เดียวกัน

หาก `openclaw devices rotate` / `revoke` / `remove` ถูกปฏิเสธโดยไม่คาดคิด:

- เซสชัน paired-device token สามารถจัดการได้เฉพาะ **อุปกรณ์ของตนเอง**
  เว้นแต่ผู้เรียกจะมี `operator.admin` ด้วย
- `openclaw devices rotate --scope ...` สามารถร้องขอ operator scopes ได้เฉพาะ
  ที่เซสชันของผู้เรียกถืออยู่แล้ว

ที่เกี่ยวข้อง:

- [Control UI](/th/web/control-ui)
- [การกำหนดค่า](/th/gateway/configuration) (โหมด auth ของ gateway)
- [Trusted proxy auth](/th/gateway/trusted-proxy-auth)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [Devices](/th/cli/devices)

## บริการ Gateway ไม่ทำงาน

ใช้หัวข้อนี้เมื่อมีการติดตั้ง service แล้ว แต่ process ไม่คงอยู่

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # สแกน system-level services ด้วย
```

สิ่งที่ต้องมองหา:

- `Runtime: stopped` พร้อมคำใบ้เกี่ยวกับการออกจากระบบ
- service config ไม่ตรงกัน (`Config (cli)` เทียบกับ `Config (service)`)
- พอร์ต/listener ขัดกัน
- มีการติดตั้ง launchd/systemd/schtasks เพิ่มเติมเมื่อใช้ `--deep`
- คำแนะนำการ cleanup ของ `Other gateway-like services detected (best effort)`

ลักษณะที่พบบ่อย:

- `Gateway start blocked: set gateway.mode=local` หรือ `existing config is missing gateway.mode` → ยังไม่ได้เปิด local gateway mode หรือไฟล์ config ถูกเขียนทับจนทำให้ `gateway.mode` หายไป วิธีแก้: ตั้ง `gateway.mode="local"` ใน config ของคุณ หรือรัน `openclaw onboard --mode local` / `openclaw setup` อีกครั้งเพื่อประทับ config โหมด local ตามที่คาดไว้ใหม่ หากคุณรัน OpenClaw ผ่าน Podman พาธ config ค่าเริ่มต้นคือ `~/.openclaw/openclaw.json`
- `refusing to bind gateway ... without auth` → มีการ bind แบบ non-loopback โดยไม่มีเส้นทาง auth ของ gateway ที่ถูกต้อง (token/password หรือ trusted-proxy หากมีการกำหนดค่าไว้)
- `another gateway instance is already listening` / `EADDRINUSE` → พอร์ตชนกัน
- `Other gateway-like services detected (best effort)` → มีหน่วย launchd/systemd/schtasks ที่ค้างอยู่หรือทำงานขนานกันอยู่ ส่วนใหญ่ควรมี gateway เพียงหนึ่งตัวต่อเครื่อง; หากคุณจำเป็นต้องมีมากกว่าหนึ่งตัว ให้แยกพอร์ต + config/state/workspace ออกจากกัน ดู [/gateway#multiple-gateways-same-host](/th/gateway#multiple-gateways-same-host)

ที่เกี่ยวข้อง:

- [Background exec and process tool](/th/gateway/background-process)
- [Configuration](/th/gateway/configuration)
- [Doctor](/th/gateway/doctor)

## Gateway กู้คืน config ล่าสุดที่ใช้งานได้

ใช้หัวข้อนี้เมื่อ Gateway เริ่มทำงานได้ แต่ใน logs ระบุว่ามีการกู้คืน `openclaw.json`

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

สิ่งที่ต้องมองหา:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- ไฟล์ `openclaw.json.clobbered.*` ที่มี timestamp อยู่ข้างไฟล์ config ที่ใช้งานอยู่
- main-agent system event ที่ขึ้นต้นด้วย `Config recovery warning`

สิ่งที่เกิดขึ้น:

- config ที่ถูกปฏิเสธไม่ผ่านการ validate ระหว่าง startup หรือ hot reload
- OpenClaw เก็บ payload ที่ถูกปฏิเสธไว้เป็น `.clobbered.*`
- active config ถูกกู้คืนจากสำเนา last-known-good ล่าสุดที่ผ่านการ validate แล้ว
- main-agent turn ถัดไปจะได้รับคำเตือนไม่ให้เขียนทับ config ที่ถูกปฏิเสธนั้นแบบไม่ตรวจสอบ
- หากปัญหา validation ทั้งหมดอยู่ใต้ `plugins.entries.<id>...` OpenClaw จะ
  ไม่กู้คืนทั้งไฟล์ ความล้มเหลวเฉพาะใน plugin จะยังคงแสดงอย่างชัดเจน ขณะที่การตั้งค่าผู้ใช้ส่วนอื่นที่ไม่เกี่ยวข้องยังคงอยู่ใน active config

การตรวจสอบและซ่อมแซม:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

ลักษณะที่พบบ่อย:

- มี `.clobbered.*` อยู่ → การแก้ไขโดยตรงจากภายนอกหรือการอ่านตอน startup ถูกกู้คืน
- มี `.rejected.*` อยู่ → การเขียน config ที่ OpenClaw เป็นเจ้าของล้มเหลวจาก schema หรือการตรวจจับ clobber ก่อน commit
- `Config write rejected:` → การเขียนพยายามลบโครงสร้างที่จำเป็น ทำให้ไฟล์เล็กลงอย่างมาก หรือพยายามบันทึก config ที่ไม่ถูกต้อง
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` หรือ `size-drop-vs-last-good:*` → startup ถือว่าไฟล์ปัจจุบันถูก clobbered เพราะสูญเสียฟิลด์หรือขนาดเมื่อเทียบกับสำเนา last-known-good
- `Config last-known-good promotion skipped` → candidate มี placeholders ของ secret ที่ถูกปิดบังไว้ เช่น `***`

วิธีแก้ที่เป็นไปได้:

1. คง active config ที่กู้คืนแล้วไว้ หากมันถูกต้อง
2. คัดลอกเฉพาะคีย์ที่ตั้งใจจาก `.clobbered.*` หรือ `.rejected.*` แล้วนำไปใช้ด้วย `openclaw config set` หรือ `config.patch`
3. รัน `openclaw config validate` ก่อนรีสตาร์ต
4. หากคุณแก้ไขด้วยมือ ให้คง JSON5 config ทั้งไฟล์ไว้ ไม่ใช่เฉพาะออบเจ็กต์บางส่วนที่คุณต้องการเปลี่ยน

ที่เกี่ยวข้อง:

- [Configuration: strict validation](/th/gateway/configuration#strict-validation)
- [Configuration: hot reload](/th/gateway/configuration#config-hot-reload)
- [Config](/th/cli/config)
- [Doctor](/th/gateway/doctor)

## คำเตือนจาก Gateway probe

ใช้หัวข้อนี้เมื่อ `openclaw gateway probe` เข้าถึงบางอย่างได้ แต่ยังคงพิมพ์บล็อกคำเตือน

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

สิ่งที่ต้องมองหา:

- `warnings[].code` และ `primaryTargetId` ในเอาต์พุต JSON
- คำเตือนนั้นเกี่ยวกับ SSH fallback, หลาย gateway, scopes ที่หายไป หรือ auth refs ที่ยัง resolve ไม่ได้หรือไม่

ลักษณะที่พบบ่อย:

- `SSH tunnel failed to start; falling back to direct probes.` → การตั้งค่า SSH ล้มเหลว แต่คำสั่งยังคงลองใช้เป้าหมาย configured/loopback แบบ direct
- `multiple reachable gateways detected` → มีมากกว่าหนึ่งเป้าหมายที่ตอบกลับ โดยปกติหมายความว่ามีการตั้งค่าหลาย gateway โดยตั้งใจ หรือมี listeners ซ้ำ/ค้างอยู่
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → connect สำเร็จแล้ว แต่รายละเอียด RPC ถูกจำกัดด้วย scope; ให้ pair device identity หรือใช้ข้อมูลรับรองที่มี `operator.read`
- `Capability: pairing-pending` หรือ `gateway closed (1008): pairing required` → gateway ตอบกลับแล้ว แต่ไคลเอนต์นี้ยังต้อง pair/ได้รับการอนุมัติก่อนจึงจะมี operator access ตามปกติ
- ข้อความเตือน SecretRef ที่ยัง resolve ไม่ได้ใน `gateway.auth.*` / `gateway.remote.*` → ข้อมูล auth ไม่พร้อมใช้งานในเส้นทางคำสั่งนี้สำหรับเป้าหมายที่ล้มเหลว

ที่เกี่ยวข้อง:

- [Gateway](/th/cli/gateway)
- [Multiple gateways on the same host](/th/gateway#multiple-gateways-same-host)
- [Remote access](/th/gateway/remote)

## ช่องทางเชื่อมต่อแล้วแต่ข้อความไม่ไหลผ่าน

หากสถานะของช่องทางเป็น connected แต่การไหลของข้อความหยุดทำงาน ให้โฟกัสที่ policy, permissions และกฎการส่งเฉพาะช่องทาง

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

สิ่งที่ต้องมองหา:

- นโยบาย DM (`pairing`, `allowlist`, `open`, `disabled`)
- allowlist ของกลุ่มและข้อกำหนดเรื่อง mention
- สิทธิ์/scopes ของ API ช่องทางที่ขาดหาย

ลักษณะที่พบบ่อย:

- `mention required` → ข้อความถูกละเลยโดยนโยบาย mention ของกลุ่ม
- `pairing` / traces ของการอนุมัติที่รอดำเนินการ → ผู้ส่งยังไม่ได้รับอนุมัติ
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → ปัญหา auth/permissions ของช่องทาง

ที่เกี่ยวข้อง:

- [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)
- [WhatsApp](/th/channels/whatsapp)
- [Telegram](/th/channels/telegram)
- [Discord](/th/channels/discord)

## การส่ง Cron และ Heartbeat

หาก cron หรือ Heartbeat ไม่รันหรือไม่ส่งผลลัพธ์ ให้ตรวจสอบสถานะ scheduler ก่อน จากนั้นจึงตรวจสอบ delivery target

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

สิ่งที่ต้องมองหา:

- Cron เปิดใช้งานอยู่และมีเวลาปลุกครั้งถัดไป
- สถานะประวัติการรันของงาน (`ok`, `skipped`, `error`)
- เหตุผลที่ Heartbeat ถูกข้าม (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`)

ลักษณะที่พบบ่อย:

- `cron: scheduler disabled; jobs will not run automatically` → cron ถูกปิดใช้งาน
- `cron: timer tick failed` → scheduler tick ล้มเหลว; ตรวจสอบ errors ของไฟล์/log/runtime
- `heartbeat skipped` พร้อม `reason=quiet-hours` → อยู่นอกช่วงเวลาทำงาน
- `heartbeat skipped` พร้อม `reason=empty-heartbeat-file` → มี `HEARTBEAT.md` อยู่ แต่มีเพียงบรรทัดว่าง / markdown headers เท่านั้น ดังนั้น OpenClaw จึงข้าม model call
- `heartbeat skipped` พร้อม `reason=no-tasks-due` → `HEARTBEAT.md` มีบล็อก `tasks:` แต่ไม่มีงานใดถึงกำหนดใน tick นี้
- `heartbeat: unknown accountId` → account id ไม่ถูกต้องสำหรับเป้าหมายการส่งของ Heartbeat
- `heartbeat skipped` พร้อม `reason=dm-blocked` → เป้าหมายของ Heartbeat resolve ไปเป็นปลายทางสไตล์ DM ขณะที่ `agents.defaults.heartbeat.directPolicy` (หรือ override แยกตาม agent) ถูกตั้งเป็น `block`

ที่เกี่ยวข้อง:

- [Scheduled tasks: troubleshooting](/th/automation/cron-jobs#troubleshooting)
- [Scheduled tasks](/th/automation/cron-jobs)
- [Heartbeat](/th/gateway/heartbeat)

## tool ของ node ที่จับคู่แล้วล้มเหลว

หาก node จับคู่แล้วแต่ tools ล้มเหลว ให้แยกตรวจสอบสถานะ foreground, permission และ approval

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

สิ่งที่ต้องมองหา:

- Node ออนไลน์พร้อม capabilities ตามที่คาดไว้
- การอนุญาตระดับ OS สำหรับกล้อง/ไมค์/ตำแหน่ง/หน้าจอ
- สถานะ exec approvals และ allowlist

ลักษณะที่พบบ่อย:

- `NODE_BACKGROUND_UNAVAILABLE` → แอป node ต้องอยู่เบื้องหน้า
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → ขาด permission ระดับ OS
- `SYSTEM_RUN_DENIED: approval required` → กำลังรอ exec approval
- `SYSTEM_RUN_DENIED: allowlist miss` → คำสั่งถูกบล็อกโดย allowlist

ที่เกี่ยวข้อง:

- [การแก้ไขปัญหา Node](/th/nodes/troubleshooting)
- [Nodes](/th/nodes/index)
- [Exec approvals](/th/tools/exec-approvals)

## tool ของเบราว์เซอร์ล้มเหลว

ใช้หัวข้อนี้เมื่อการกระทำของ browser tool ล้มเหลว แม้ว่า gateway เองจะปกติดี

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

สิ่งที่ต้องมองหา:

- มีการตั้ง `plugins.allow` และรวม `browser` ไว้หรือไม่
- พาธของ executable ของเบราว์เซอร์ถูกต้องหรือไม่
- เข้าถึง CDP profile ได้หรือไม่
- มี Chrome ในเครื่องพร้อมใช้งานสำหรับ profiles แบบ `existing-session` / `user` หรือไม่

ลักษณะที่พบบ่อย:

- `unknown command "browser"` หรือ `unknown command 'browser'` → bundled browser Plugin ถูกตัดออกโดย `plugins.allow`
- browser tool หายไป / ใช้งานไม่ได้ ขณะที่ `browser.enabled=true` → `plugins.allow` ไม่รวม `browser` ดังนั้น Plugin จึงไม่ถูกโหลด
- `Failed to start Chrome CDP on port` → process ของเบราว์เซอร์เริ่มทำงานไม่สำเร็จ
- `browser.executablePath not found` → พาธที่กำหนดค่าไว้ไม่ถูกต้อง
- `browser.cdpUrl must be http(s) or ws(s)` → CDP URL ที่กำหนดค่าไว้ใช้ scheme ที่ไม่รองรับ เช่น `file:` หรือ `ftp:`
- `browser.cdpUrl has invalid port` → CDP URL ที่กำหนดค่าไว้มีพอร์ตไม่ถูกต้องหรืออยู่นอกช่วง
- `Could not find DevToolsActivePort for chrome` → existing-session ของ Chrome MCP ยังไม่สามารถ attach ไปยัง data dir ของเบราว์เซอร์ที่เลือกได้ ให้เปิดหน้า inspect ของเบราว์เซอร์ เปิด remote debugging คงเบราว์เซอร์ไว้ อนุมัติ prompt การ attach ครั้งแรก แล้วลองใหม่ หากไม่จำเป็นต้องใช้สถานะที่ล็อกอินไว้ ให้ใช้ profile `openclaw` ที่จัดการให้แทน
- `No Chrome tabs found for profile="user"` → profile แบบ attach ของ Chrome MCP ไม่มีแท็บ Chrome ในเครื่องที่เปิดอยู่
- `Remote CDP for profile "<name>" is not reachable` → endpoint ของ remote CDP ที่กำหนดค่าไว้เข้าถึงไม่ได้จากโฮสต์ของ gateway
- `Browser attachOnly is enabled ... not reachable` หรือ `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profile แบบ attach-only ไม่มี target ที่เข้าถึงได้ หรือ endpoint แบบ HTTP ตอบกลับแล้วแต่ยังเปิด CDP WebSocket ไม่ได้
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → การติดตั้ง gateway ปัจจุบันไม่มี dependency runtime `playwright-core` ของ bundled browser Plugin ให้รัน `openclaw doctor --fix` แล้วรีสตาร์ต gateway หลังจากนั้น ARIA snapshots และภาพหน้าจอพื้นฐานของหน้าอาจยังทำงานได้ แต่การนำทาง, AI snapshots, ภาพหน้าจอขององค์ประกอบด้วย CSS selector และการ export PDF จะยังไม่พร้อมใช้งาน
- `fullPage is not supported for element screenshots` → คำขอ screenshot ผสม `--full-page` กับ `--ref` หรือ `--element`
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → การเรียก screenshot ของ Chrome MCP / `existing-session` ต้องใช้การจับภาพทั้งหน้าหรือ `--ref` จาก snapshot ไม่ใช่ CSS `--element`
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooks สำหรับอัปโหลดของ Chrome MCP ต้องใช้ snapshot refs ไม่ใช่ CSS selectors
- `existing-session file uploads currently support one file at a time.` → สำหรับ Chrome MCP profiles ให้ส่งการอัปโหลดหนึ่งไฟล์ต่อหนึ่งคำสั่ง
- `existing-session dialog handling does not support timeoutMs.` → dialog hooks บน Chrome MCP profiles ไม่รองรับการ override timeout
- `existing-session type does not support timeoutMs overrides.` → ให้ละ `timeoutMs` สำหรับ `act:type` บน `profile="user"` / Chrome MCP existing-session profiles หรือใช้ managed/CDP browser profile เมื่อจำเป็นต้องใช้ timeout แบบกำหนดเอง
- `existing-session evaluate does not support timeoutMs overrides.` → ให้ละ `timeoutMs` สำหรับ `act:evaluate` บน `profile="user"` / Chrome MCP existing-session profiles หรือใช้ managed/CDP browser profile เมื่อจำเป็นต้องใช้ timeout แบบกำหนดเอง
- `response body is not supported for existing-session profiles yet.` → `responsebody` ยังคงต้องใช้ managed browser หรือ raw CDP profile
- ค่าการ override ที่ค้างอยู่ของ viewport / dark-mode / locale / offline บน profiles แบบ attach-only หรือ remote CDP → รัน `openclaw browser stop --browser-profile <name>` เพื่อปิด active control session และปล่อยสถานะ emulation ของ Playwright/CDP โดยไม่ต้องรีสตาร์ต gateway ทั้งหมด

ที่เกี่ยวข้อง:

- [การแก้ไขปัญหาเบราว์เซอร์](/th/tools/browser-linux-troubleshooting)
- [Browser (OpenClaw-managed)](/th/tools/browser)

## หากคุณอัปเกรดแล้วมีบางอย่างพังทันที

ปัญหาหลังการอัปเกรดส่วนใหญ่มาจาก config drift หรือมีการบังคับใช้ค่าเริ่มต้นที่เข้มงวดขึ้น

### 1) พฤติกรรมของ auth และ URL override เปลี่ยนไป

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

สิ่งที่ต้องตรวจสอบ:

- หาก `gateway.mode=remote` คำสั่ง CLI อาจกำลังชี้ไปยัง remote ขณะที่ service ในเครื่องของคุณยังทำงานปกติ
- การเรียกด้วย `--url` แบบ explicit จะไม่ fallback ไปใช้ข้อมูลรับรองที่เก็บไว้

ลักษณะที่พบบ่อย:

- `gateway connect failed:` → URL เป้าหมายไม่ถูกต้อง
- `unauthorized` → endpoint เข้าถึงได้ แต่ auth ไม่ถูกต้อง

### 2) Guardrails สำหรับ bind และ auth เข้มงวดขึ้น

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

สิ่งที่ต้องตรวจสอบ:

- การ bind แบบ non-loopback (`lan`, `tailnet`, `custom`) ต้องมีเส้นทาง auth ของ gateway ที่ถูกต้อง: shared token/password auth หรือ deployment แบบ `trusted-proxy` ที่กำหนดค่า non-loopback อย่างถูกต้อง
- คีย์แบบเก่าเช่น `gateway.token` ไม่สามารถแทนที่ `gateway.auth.token` ได้

ลักษณะที่พบบ่อย:

- `refusing to bind gateway ... without auth` → มีการ bind แบบ non-loopback โดยไม่มีเส้นทาง auth ของ gateway ที่ถูกต้อง
- `Connectivity probe: failed` ขณะที่ runtime กำลังทำงาน → gateway ยังมีชีวิตอยู่แต่เข้าถึงไม่ได้ด้วย auth/url ปัจจุบัน

### 3) สถานะของ Pairing และ device identity เปลี่ยนไป

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

สิ่งที่ต้องตรวจสอบ:

- มี device approvals ที่รอดำเนินการสำหรับ dashboard/nodes หรือไม่
- มี DM pairing approvals ที่รอดำเนินการหลังจากมีการเปลี่ยนแปลง policy หรือ identity หรือไม่

ลักษณะที่พบบ่อย:

- `device identity required` → ยังไม่ผ่าน device auth
- `pairing required` → ผู้ส่ง/อุปกรณ์ต้องได้รับการอนุมัติ

หาก service config และ runtime ยังไม่ตรงกันหลังจากตรวจสอบแล้ว ให้ติดตั้ง service metadata ใหม่จาก profile/state directory เดียวกัน:

```bash
openclaw gateway install --force
openclaw gateway restart
```

ที่เกี่ยวข้อง:

- [การจับคู่ที่ Gateway เป็นเจ้าของ](/th/gateway/pairing)
- [การยืนยันตัวตน](/th/gateway/authentication)
- [Background exec and process tool](/th/gateway/background-process)

## ที่เกี่ยวข้อง

- [Gateway runbook](/th/gateway)
- [Doctor](/th/gateway/doctor)
- [FAQ](/th/help/faq)
