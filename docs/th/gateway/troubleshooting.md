---
read_when:
    - ศูนย์กลางการแก้ไขปัญหาได้ชี้คุณมาที่นี่เพื่อการวินิจฉัยที่ลึกขึ้น
    - คุณต้องมีส่วนของคู่มือปฏิบัติการแบบอิงอาการที่เสถียรพร้อมคำสั่งแบบตรงตัว
sidebarTitle: Troubleshooting
summary: คู่มือปฏิบัติการการแก้ไขปัญหาเชิงลึกสำหรับ gateway, channels, automation, nodes และเบราว์เซอร์
title: การแก้ไขปัญหา
x-i18n:
    generated_at: "2026-04-26T11:32:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc6b2a0e8522a761dcee0a3b9bc024eefbd7a5ab4118fc090401868a571bcf
    source_path: gateway/troubleshooting.md
    workflow: 15
---

หน้านี้คือคู่มือปฏิบัติการเชิงลึก เริ่มที่ [/help/troubleshooting](/th/help/troubleshooting) หากคุณต้องการโฟลว์คัดกรองอย่างรวดเร็วก่อน

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
- `openclaw channels status --probe` แสดงสถานะ transport แบบ live แยกรายบัญชี และในกรณีที่รองรับ จะแสดงผล probe/audit เช่น `works` หรือ `audit ok`

## การติดตั้งแบบ split brain และตัวป้องกัน config ที่ใหม่กว่า

ใช้ส่วนนี้เมื่อ gateway service หยุดทำงานอย่างไม่คาดคิดหลังการอัปเดต หรือ logs แสดงว่าไบนารี `openclaw` ตัวหนึ่งเก่ากว่าเวอร์ชันที่เขียน `openclaw.json` ครั้งล่าสุด

OpenClaw จะประทับการเขียน config ด้วย `meta.lastTouchedVersion` คำสั่งแบบอ่านอย่างเดียวจะยังตรวจสอบ config ที่เขียนโดย OpenClaw รุ่นใหม่กว่าได้ แต่การเปลี่ยนแปลงโปรเซสและบริการจะปฏิเสธการทำงานต่อจากไบนารีที่เก่ากว่า การกระทำที่ถูกบล็อกรวมถึงการเริ่ม หยุด รีสตาร์ต ถอนการติดตั้ง gateway service การติดตั้งบริการใหม่แบบบังคับ การเริ่มต้น gateway ในโหมด service และการล้างพอร์ตด้วย `gateway --force`

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="แก้ไข PATH">
    แก้ไข `PATH` เพื่อให้ `openclaw` resolve ไปยังการติดตั้งที่ใหม่กว่า แล้วรันคำสั่งเดิมอีกครั้ง
  </Step>
  <Step title="ติดตั้ง gateway service ใหม่">
    ติดตั้ง gateway service ที่ตั้งใจใช้ใหม่จากการติดตั้งที่ใหม่กว่า:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="ลบ wrappers ที่ค้างเก่า">
    ลบรายการ system package หรือ wrapper เก่าที่ยังคงชี้ไปยังไบนารี `openclaw` ตัวเก่า
  </Step>
</Steps>

<Warning>
ใช้ `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` สำหรับคำสั่งเดียวเท่านั้น หากตั้งใจลดรุ่นหรือใช้กู้คืนฉุกเฉิน ปล่อยให้ไม่ตั้งค่าไว้สำหรับการทำงานปกติ
</Warning>

## Anthropic 429 ต้องใช้การใช้งานเพิ่มเติมสำหรับบริบทยาว

ใช้ส่วนนี้เมื่อ logs/errors มีข้อความ: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

ให้มองหา:

- โมเดล Anthropic Opus/Sonnet ที่เลือกไว้มี `params.context1m: true`
- ข้อมูลรับรอง Anthropic ปัจจุบันไม่มีสิทธิ์ใช้ long-context
- คำขอล้มเหลวเฉพาะในเซสชันยาวหรือการรันโมเดลที่ต้องใช้เส้นทาง beta แบบ 1M

ตัวเลือกในการแก้ไข:

<Steps>
  <Step title="ปิด context1m">
    ปิด `context1m` สำหรับโมเดลนั้นเพื่อ fallback ไปใช้ context window ปกติ
  </Step>
  <Step title="ใช้ข้อมูลรับรองที่มีสิทธิ์">
    ใช้ข้อมูลรับรอง Anthropic ที่มีสิทธิ์สำหรับคำขอ long-context หรือสลับไปใช้ Anthropic API key
  </Step>
  <Step title="กำหนดค่า fallback models">
    กำหนดค่า fallback models เพื่อให้การรันทำงานต่อได้เมื่อคำขอ long-context ของ Anthropic ถูกปฏิเสธ
  </Step>
</Steps>

ที่เกี่ยวข้อง:

- [Anthropic](/th/providers/anthropic)
- [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use)
- [ทำไมฉันจึงเห็น HTTP 429 จาก Anthropic?](/th/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## backend แบบ OpenAI-compatible ในเครื่องผ่าน direct probes แต่ agent runs ล้มเหลว

ใช้ส่วนนี้เมื่อ:

- `curl ... /v1/models` ใช้งานได้
- การเรียก `/v1/chat/completions` แบบตรงขนาดเล็กใช้งานได้
- การรันโมเดลของ OpenClaw ล้มเหลวเฉพาะใน agent turns ปกติ

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

ให้มองหา:

- direct tiny calls สำเร็จ แต่การรันของ OpenClaw ล้มเหลวเฉพาะกับ prompts ที่ใหญ่กว่า
- backend errors เกี่ยวกับ `messages[].content` ที่คาดหวัง string
- backend crashes ที่เกิดขึ้นเฉพาะเมื่อมีจำนวน prompt-token มากขึ้นหรือใช้ prompts เต็มรูปแบบของ agent runtime

<AccordionGroup>
  <Accordion title="ลายเซ็นที่พบบ่อย">
    - `messages[...].content: invalid type: sequence, expected a string` → backend ปฏิเสธ content parts แบบมีโครงสร้างของ Chat Completions วิธีแก้: ตั้ง `models.providers.<provider>.models[].compat.requiresStringContent: true`
    - direct tiny requests สำเร็จ แต่ OpenClaw agent runs ล้มเหลวด้วย backend/model crashes (เช่น Gemma บนบาง build ของ `inferrs`) → transport ของ OpenClaw น่าจะถูกต้องแล้ว; backend เป็นฝ่ายล้มเหลวกับรูปแบบพรอมป์ต์ที่ใหญ่กว่าของ agent runtime
    - ความล้มเหลวลดลงหลังปิด tools แต่ยังไม่หาย → tool schemas เป็นส่วนหนึ่งของแรงกดดัน แต่ปัญหาที่เหลือยังคงเป็นข้อจำกัดของโมเดล/เซิร์ฟเวอร์ต้นทางหรือเป็นบั๊กของ backend

  </Accordion>
  <Accordion title="ตัวเลือกในการแก้ไข">
    1. ตั้ง `compat.requiresStringContent: true` สำหรับ backends ของ Chat Completions ที่รองรับเฉพาะ string
    2. ตั้ง `compat.supportsTools: false` สำหรับโมเดล/backends ที่ไม่สามารถรองรับพื้นผิว tool schema ของ OpenClaw ได้อย่างน่าเชื่อถือ
    3. ลดแรงกดดันของพรอมป์ต์เท่าที่ทำได้: bootstrap ของ workspace ให้เล็กลง, ประวัติเซสชันสั้นลง, ใช้ local model ที่เบากว่า หรือใช้ backend ที่รองรับ long-context ดีกว่า
    4. หาก tiny direct requests ยังคงผ่าน แต่ OpenClaw agent turns ยัง crash ภายใน backend ให้ถือว่าเป็นข้อจำกัดของเซิร์ฟเวอร์/โมเดลต้นทาง และส่ง repro ไปที่นั่นพร้อมรูปแบบ payload ที่ระบบยอมรับ
  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [การกำหนดค่า](/th/gateway/configuration)
- [Local models](/th/gateway/local-models)
- [endpoints ที่รองรับแบบ OpenAI](/th/gateway/configuration-reference#openai-compatible-endpoints)

## ไม่มีการตอบกลับ

หากช่องทางทำงานอยู่แต่ไม่มีอะไรตอบกลับ ให้ตรวจสอบ routing และ policy ก่อนเชื่อมต่ออะไรใหม่

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

ให้มองหา:

- มี pairing ที่รอดำเนินการสำหรับผู้ส่งข้อความส่วนตัว
- การบังคับ mention ในกลุ่ม (`requireMention`, `mentionPatterns`)
- allowlist ของ channel/group ไม่ตรงกัน

ลายเซ็นที่พบบ่อย:

- `drop guild message (mention required` → ข้อความกลุ่มถูกละเว้นจนกว่าจะมี mention
- `pairing request` → ผู้ส่งต้องได้รับการอนุมัติ
- `blocked` / `allowlist` → ผู้ส่ง/ช่องทางถูกกรองโดย policy

ที่เกี่ยวข้อง:

- [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)
- [Groups](/th/channels/groups)
- [Pairing](/th/channels/pairing)

## การเชื่อมต่อแดชบอร์ด Control UI

เมื่อแดชบอร์ด/Control UI เชื่อมต่อไม่ได้ ให้ตรวจสอบ URL, auth mode และสมมติฐานเรื่อง secure context

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

ให้มองหา:

- probe URL และ dashboard URL ถูกต้อง
- auth mode/token ระหว่างไคลเอนต์กับ gateway ไม่ตรงกัน
- มีการใช้ HTTP ในจุดที่ต้องมี device identity

<AccordionGroup>
  <Accordion title="ลายเซ็น connect / auth">
    - `device identity required` → บริบทไม่ปลอดภัยหรือไม่มี device auth
    - `origin not allowed` → `Origin` ของเบราว์เซอร์ไม่ได้อยู่ใน `gateway.controlUi.allowedOrigins` (หรือคุณกำลังเชื่อมต่อจาก browser origin แบบ non-loopback โดยไม่มี allowlist แบบชัดเจน)
    - `device nonce required` / `device nonce mismatch` → ไคลเอนต์ไม่ได้ทำ challenge-based device auth flow (`connect.challenge` + `device.nonce`) ให้เสร็จ
    - `device signature invalid` / `device signature expired` → ไคลเอนต์เซ็น payload ผิด (หรือใช้ timestamp เก่า) สำหรับ handshake ปัจจุบัน
    - `AUTH_TOKEN_MISMATCH` กับ `canRetryWithDeviceToken=true` → ไคลเอนต์สามารถลองใหม่แบบเชื่อถือได้หนึ่งครั้งด้วย cached device token
    - การลองใหม่ด้วย cached token นี้จะใช้ชุด scope ที่เก็บไว้กับ paired device token ซ้ำ ผู้เรียกที่ใช้ `deviceToken` / `scopes` แบบชัดเจนจะยังคงใช้ชุด scope ที่ร้องขอไว้
    - นอกเหนือจากเส้นทางลองใหม่นี้ ลำดับ auth ของ connect คือ shared token/password แบบชัดเจนก่อน จากนั้น `deviceToken` แบบชัดเจน จากนั้น stored device token แล้วจึง bootstrap token
    - บนเส้นทาง async Tailscale Serve Control UI ความพยายามที่ล้มเหลวสำหรับ `{scope, ip}` เดียวกันจะถูก serialize ก่อนที่ limiter จะบันทึกความล้มเหลว ความพยายามที่ไม่ถูกต้องสองครั้งพร้อมกันจากไคลเอนต์เดียวกันจึงอาจแสดง `retry later` ในครั้งที่สองแทนที่จะเป็น mismatch ปกติสองครั้ง
    - `too many failed authentication attempts (retry later)` จากไคลเอนต์ loopback ที่มี browser origin → ความล้มเหลวซ้ำจาก `Origin` ที่ถูก normalize เดียวกันนั้นจะถูกล็อกชั่วคราว; localhost origin อื่นจะใช้ bucket แยกกัน
    - `unauthorized` ซ้ำหลังจากการลองใหม่นั้น → shared token/device token drift; รีเฟรช config ของ token และอนุมัติใหม่/หมุนเวียน device token หากจำเป็น
    - `gateway connect failed:` → host/port/url เป้าหมายไม่ถูกต้อง

  </Accordion>
</AccordionGroup>

### แผนผังย่อของรหัสรายละเอียด auth

ใช้ `error.details.code` จากการตอบกลับ `connect` ที่ล้มเหลวเพื่อเลือกขั้นตอนถัดไป:

| Detail code                  | ความหมาย | การดำเนินการที่แนะนำ |
| ---------------------------- | -------- | -------------------- |
| `AUTH_TOKEN_MISSING`         | ไคลเอนต์ไม่ได้ส่ง shared token ที่จำเป็น | วาง/ตั้งค่า token ในไคลเอนต์แล้วลองใหม่ สำหรับเส้นทางแดชบอร์ด: `openclaw config get gateway.auth.token` แล้ววางลงในค่าตั้งของ Control UI |
| `AUTH_TOKEN_MISMATCH`        | shared token ไม่ตรงกับ gateway auth token | หาก `canRetryWithDeviceToken=true` ให้ยอมให้ลองใหม่แบบเชื่อถือได้หนึ่งครั้ง การลองใหม่ด้วย cached token จะใช้ scopes ที่ได้รับอนุมัติและเก็บไว้ซ้ำ ผู้เรียกที่ใช้ `deviceToken` / `scopes` แบบชัดเจนจะคง scopes ที่ร้องขอไว้ หากยังล้มเหลว ให้รัน [รายการตรวจสอบการกู้คืน token drift](/th/cli/devices#token-drift-recovery-checklist) |
| `AUTH_DEVICE_TOKEN_MISMATCH` | per-device token ที่แคชไว้เก่าหรือถูกเพิกถอน | หมุนเวียน/อนุมัติ device token ใหม่โดยใช้ [Devices CLI](/th/cli/devices) แล้วเชื่อมต่อใหม่ |
| `PAIRING_REQUIRED`           | device identity ต้องได้รับการอนุมัติ ตรวจสอบ `error.details.reason` สำหรับ `not-paired`, `scope-upgrade`, `role-upgrade` หรือ `metadata-upgrade` และใช้ `requestId` / `remediationHint` เมื่อมี | อนุมัติคำขอที่รอดำเนินการ: `openclaw devices list` แล้ว `openclaw devices approve <requestId>` การอัปเกรด scope/role ใช้โฟลว์เดียวกันหลังจากที่คุณตรวจสอบสิทธิ์เข้าถึงที่ร้องขอแล้ว |

<Note>
backend RPCs แบบ direct loopback ที่ยืนยันตัวตนด้วย shared gateway token/password ไม่ควรขึ้นกับ paired-device scope baseline ของ CLI หาก subagents หรือ internal calls อื่นยังล้มเหลวด้วย `scope-upgrade` ให้ตรวจสอบว่าผู้เรียกใช้ `client.id: "gateway-client"` และ `client.mode: "backend"` และไม่ได้บังคับใช้ `deviceIdentity` หรือ device token แบบชัดเจน
</Note>

การตรวจสอบการย้ายไปใช้ device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

หาก logs แสดงข้อผิดพลาดเกี่ยวกับ nonce/signature ให้อัปเดตไคลเอนต์ที่เชื่อมต่อ แล้วตรวจสอบว่า:

<Steps>
  <Step title="รอ connect.challenge">
    ไคลเอนต์รอ `connect.challenge` ที่ gateway ออกให้
  </Step>
  <Step title="เซ็น payload">
    ไคลเอนต์เซ็น payload ที่ผูกกับ challenge
  </Step>
  <Step title="ส่ง device nonce">
    ไคลเอนต์ส่ง `connect.params.device.nonce` ด้วย challenge nonce เดียวกัน
  </Step>
</Steps>

หาก `openclaw devices rotate` / `revoke` / `remove` ถูกปฏิเสธอย่างไม่คาดคิด:

- เซสชันโทเค็นของ paired-device สามารถจัดการได้เฉพาะอุปกรณ์ **ของตนเอง** เท่านั้น เว้นแต่ผู้เรียกจะมี `operator.admin` ด้วย
- `openclaw devices rotate --scope ...` สามารถร้องขอได้เฉพาะ operator scopes ที่เซสชันของผู้เรียกมีอยู่แล้วเท่านั้น

ที่เกี่ยวข้อง:

- [การกำหนดค่า](/th/gateway/configuration) (โหมด gateway auth)
- [Control UI](/th/web/control-ui)
- [Devices](/th/cli/devices)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [trusted proxy auth](/th/gateway/trusted-proxy-auth)

## Gateway service ไม่ทำงาน

ใช้ส่วนนี้เมื่อมีการติดตั้ง service แล้ว แต่โปรเซสไม่คงอยู่

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # สแกนบริการระดับระบบด้วย
```

ให้มองหา:

- `Runtime: stopped` พร้อมคำใบ้เกี่ยวกับการออกจากระบบ
- service config ไม่ตรงกัน (`Config (cli)` เทียบกับ `Config (service)`)
- ความขัดแย้งของพอร์ต/ตัวฟัง
- มีการติดตั้ง launchd/systemd/schtasks เพิ่มเติมเมื่อใช้ `--deep`
- คำใบ้การ cleanup ของ `Other gateway-like services detected (best effort)`

<AccordionGroup>
  <Accordion title="ลายเซ็นที่พบบ่อย">
    - `Gateway start blocked: set gateway.mode=local` หรือ `existing config is missing gateway.mode` → ไม่ได้เปิดใช้โหมด gateway แบบ local หรือไฟล์ config ถูกทำเสียหายจน `gateway.mode` หายไป วิธีแก้: ตั้ง `gateway.mode="local"` ใน config หรือรัน `openclaw onboard --mode local` / `openclaw setup` ใหม่เพื่อประทับ config ของ local-mode ตามที่คาดไว้ หากคุณรัน OpenClaw ผ่าน Podman พาธ config เริ่มต้นคือ `~/.openclaw/openclaw.json`
    - `refusing to bind gateway ... without auth` → bind แบบ non-loopback โดยไม่มีเส้นทาง gateway auth ที่ถูกต้อง (token/password หรือ trusted-proxy ตามที่กำหนดค่าไว้)
    - `another gateway instance is already listening` / `EADDRINUSE` → พอร์ตชนกัน
    - `Other gateway-like services detected (best effort)` → มี launchd/systemd/schtasks units ที่ค้างเก่าหรือทำงานขนานอยู่ การตั้งค่าส่วนใหญ่ควรมีหนึ่ง gateway ต่อหนึ่งเครื่อง; หากคุณต้องการมากกว่าหนึ่งจริง ๆ ให้แยกพอร์ต + config/state/workspace ดู [/gateway#multiple-gateways-same-host](/th/gateway#multiple-gateways-same-host)

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Background exec และ process tool](/th/gateway/background-process)
- [การกำหนดค่า](/th/gateway/configuration)
- [Doctor](/th/gateway/doctor)

## Gateway กู้คืน last-known-good config

ใช้ส่วนนี้เมื่อ Gateway เริ่มทำงานได้ แต่ logs บอกว่าได้กู้คืน `openclaw.json`

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

ให้มองหา:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- มีไฟล์ `openclaw.json.clobbered.*` ที่มี timestamp อยู่ข้างไฟล์ config ที่ active
- มี main-agent system event ที่ขึ้นต้นด้วย `Config recovery warning`

<AccordionGroup>
  <Accordion title="เกิดอะไรขึ้น">
    - config ที่ถูกปฏิเสธไม่ผ่านการตรวจสอบความถูกต้องระหว่าง startup หรือ hot reload
    - OpenClaw เก็บ payload ที่ถูกปฏิเสธไว้เป็น `.clobbered.*`
    - config ที่ active ถูกกู้คืนจากสำเนา last-known-good ที่ผ่านการตรวจสอบล่าสุด
    - เทิร์นถัดไปของ main-agent จะได้รับคำเตือนไม่ให้เขียนทับ config ที่ถูกปฏิเสธแบบไม่พิจารณา
    - หากปัญหาการตรวจสอบทั้งหมดอยู่ภายใต้ `plugins.entries.<id>...` OpenClaw จะไม่กู้คืนทั้งไฟล์ ความล้มเหลวเฉพาะระดับ Plugin จะยังคงแสดงชัด ขณะที่การตั้งค่าผู้ใช้ส่วนอื่นที่ไม่เกี่ยวข้องยังคงอยู่ใน config ที่ active

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
    - มี `.clobbered.*` → มีการแก้ไขโดยตรงจากภายนอกหรือการอ่านตอน startup ถูกกู้คืน
    - มี `.rejected.*` → การเขียน config ที่ OpenClaw เป็นเจ้าของล้มเหลวเพราะ schema หรือการตรวจ clobber ก่อน commit
    - `Config write rejected:` → การเขียนพยายามตัดรูปแบบที่จำเป็น ทำให้ไฟล์เล็กลงมาก หรือพยายามบันทึก config ที่ไม่ถูกต้อง
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` หรือ `size-drop-vs-last-good:*` → ตอน startup ไฟล์ปัจจุบันถูกมองว่าโดน clobber เพราะสูญเสียฟิลด์หรือขนาดเมื่อเทียบกับสำเนา last-known-good
    - `Config last-known-good promotion skipped` → candidate มี placeholders ของ secret ที่ถูกปกปิดแล้ว เช่น `***`

  </Accordion>
  <Accordion title="ตัวเลือกในการแก้ไข">
    1. คง config ที่ active ซึ่งถูกกู้คืนไว้ หากมันถูกต้องแล้ว
    2. คัดลอกเฉพาะ key ที่ตั้งใจไว้จาก `.clobbered.*` หรือ `.rejected.*` แล้ว apply ด้วย `openclaw config set` หรือ `config.patch`
    3. รัน `openclaw config validate` ก่อนรีสตาร์ต
    4. หากแก้ไขด้วยมือ ให้คง config JSON5 แบบเต็มไว้ ไม่ใช่เฉพาะ object บางส่วนที่คุณต้องการเปลี่ยน
  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Config](/th/cli/config)
- [การกำหนดค่า: hot reload](/th/gateway/configuration#config-hot-reload)
- [การกำหนดค่า: strict validation](/th/gateway/configuration#strict-validation)
- [Doctor](/th/gateway/doctor)

## คำเตือนจาก Gateway probe

ใช้ส่วนนี้เมื่อ `openclaw gateway probe` เข้าถึงบางอย่างได้ แต่ยังพิมพ์บล็อกคำเตือนออกมา

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

ให้มองหา:

- `warnings[].code` และ `primaryTargetId` ในเอาต์พุต JSON
- คำเตือนเกี่ยวกับ SSH fallback, หลาย gateway, scopes ที่ขาด หรือ auth refs ที่ resolve ไม่ได้หรือไม่

ลายเซ็นที่พบบ่อย:

- `SSH tunnel failed to start; falling back to direct probes.` → การตั้งค่า SSH ล้มเหลว แต่คำสั่งยังคงลองเป้าหมายที่กำหนดไว้/loopback แบบ direct
- `multiple reachable gateways detected` → มีมากกว่าหนึ่งเป้าหมายตอบกลับ โดยทั่วไปหมายถึงการตั้งค่า multi-gateway ที่ตั้งใจไว้ หรือมี listeners ซ้ำ/ค้าง
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → connect สำเร็จ แต่ detail RPC ถูกจำกัดด้วย scope; ให้จับคู่ device identity หรือใช้ข้อมูลรับรองที่มี `operator.read`
- `Capability: pairing-pending` หรือ `gateway closed (1008): pairing required` → gateway ตอบกลับแล้ว แต่ไคลเอนต์นี้ยังต้องการ pairing/approval ก่อนเข้าถึง operator ตามปกติ
- ข้อความเตือน SecretRef ของ `gateway.auth.*` / `gateway.remote.*` ที่ resolve ไม่ได้ → วัสดุ auth ไม่พร้อมใช้ในเส้นทางคำสั่งนี้สำหรับเป้าหมายที่ล้มเหลว

ที่เกี่ยวข้อง:

- [Gateway](/th/cli/gateway)
- [หลาย gateway บนโฮสต์เดียวกัน](/th/gateway#multiple-gateways-same-host)
- [การเข้าถึงระยะไกล](/th/gateway/remote)

## ช่องทางเชื่อมต่อแล้ว แต่ข้อความไม่ไหล

หากสถานะช่องทางเป็น connected แต่การไหลของข้อความตาย ให้โฟกัสที่ policy, permissions และกฎการส่งที่เฉพาะของแต่ละช่องทาง

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

ให้มองหา:

- DM policy (`pairing`, `allowlist`, `open`, `disabled`)
- allowlist ของกลุ่มและข้อกำหนดการ mention
- ขาด API permissions/scopes ของช่องทาง

ลายเซ็นที่พบบ่อย:

- `mention required` → ข้อความถูกละเว้นโดยนโยบาย mention ของกลุ่ม
- ร่องรอย `pairing` / pending approval → ผู้ส่งยังไม่ได้รับอนุมัติ
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → ปัญหา auth/permissions ของช่องทาง

ที่เกี่ยวข้อง:

- [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)
- [Discord](/th/channels/discord)
- [Telegram](/th/channels/telegram)
- [WhatsApp](/th/channels/whatsapp)

## การส่ง Cron และ Heartbeat

หาก Cron หรือ Heartbeat ไม่ได้รันหรือไม่ได้ส่ง ให้ตรวจสอบสถานะ scheduler ก่อน จากนั้นค่อยดูเป้าหมายการส่ง

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

ให้มองหา:

- Cron เปิดใช้งานอยู่และมีเวลา wake ครั้งถัดไป
- สถานะประวัติการรันของงาน (`ok`, `skipped`, `error`)
- เหตุผลที่ Heartbeat ถูกข้าม (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`)

<AccordionGroup>
  <Accordion title="ลายเซ็นที่พบบ่อย">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron ถูกปิดใช้งาน
    - `cron: timer tick failed` → scheduler tick ล้มเหลว; ตรวจสอบข้อผิดพลาดของไฟล์/log/runtime
    - `heartbeat skipped` พร้อม `reason=quiet-hours` → อยู่นอกช่วงเวลาที่ active
    - `heartbeat skipped` พร้อม `reason=empty-heartbeat-file` → มี `HEARTBEAT.md` อยู่ แต่มีเพียงบรรทัดว่าง / markdown headers เท่านั้น ดังนั้น OpenClaw จึงข้าม model call
    - `heartbeat skipped` พร้อม `reason=no-tasks-due` → `HEARTBEAT.md` มีบล็อก `tasks:` แต่ไม่มีงานใดถึงกำหนดใน tick นี้
    - `heartbeat: unknown accountId` → account id สำหรับเป้าหมายการส่ง Heartbeat ไม่ถูกต้อง
    - `heartbeat skipped` พร้อม `reason=dm-blocked` → เป้าหมาย Heartbeat resolve ไปยังปลายทางแบบ DM ขณะที่ `agents.defaults.heartbeat.directPolicy` (หรือการแทนที่รายเอเจนต์) ถูกตั้งเป็น `block`

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Heartbeat](/th/gateway/heartbeat)
- [Scheduled tasks](/th/automation/cron-jobs)
- [Scheduled tasks: การแก้ไขปัญหา](/th/automation/cron-jobs#troubleshooting)

## Node จับคู่แล้ว แต่เครื่องมือล้มเหลว

หาก Node จับคู่แล้วแต่เครื่องมือล้มเหลว ให้แยกตรวจสอบสถานะ foreground, permission และ approval

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

ให้มองหา:

- Node ออนไลน์พร้อม capabilities ตามที่คาดไว้
- ได้รับสิทธิ์ระดับระบบปฏิบัติการสำหรับกล้อง/ไมค์/ตำแหน่ง/หน้าจอ
- สถานะ exec approvals และ allowlist

ลายเซ็นที่พบบ่อย:

- `NODE_BACKGROUND_UNAVAILABLE` → แอปของ node ต้องอยู่ใน foreground
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → ขาด permission ของระบบปฏิบัติการ
- `SYSTEM_RUN_DENIED: approval required` → exec approval ยังรออยู่
- `SYSTEM_RUN_DENIED: allowlist miss` → คำสั่งถูกบล็อกโดย allowlist

ที่เกี่ยวข้อง:

- [Exec approvals](/th/tools/exec-approvals)
- [การแก้ไขปัญหา Node](/th/nodes/troubleshooting)
- [Nodes](/th/nodes/index)

## Browser tool ล้มเหลว

ใช้ส่วนนี้เมื่อการกระทำของ browser tool ล้มเหลว แม้ gateway เองจะปกติดี

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

ให้มองหา:

- มีการตั้ง `plugins.allow` และรวม `browser` ไว้หรือไม่
- พาธไปยัง executable ของเบราว์เซอร์ถูกต้อง
- เข้าถึง CDP profile ได้
- มี Chrome ในเครื่องสำหรับ profiles แบบ `existing-session` / `user` หรือไม่

<AccordionGroup>
  <Accordion title="ลายเซ็นของ Plugin / executable">
    - `unknown command "browser"` หรือ `unknown command 'browser'` → bundled browser plugin ถูกตัดออกโดย `plugins.allow`
    - browser tool หายไป / ใช้งานไม่ได้ ทั้งที่ `browser.enabled=true` → `plugins.allow` ตัด `browser` ออก ทำให้ Plugin ไม่เคยถูกโหลด
    - `Failed to start Chrome CDP on port` → โปรเซสเบราว์เซอร์เริ่มทำงานไม่สำเร็จ
    - `browser.executablePath not found` → พาธที่กำหนดค่าไว้ไม่ถูกต้อง
    - `browser.cdpUrl must be http(s) or ws(s)` → CDP URL ที่กำหนดใช้ scheme ที่ไม่รองรับ เช่น `file:` หรือ `ftp:`
    - `browser.cdpUrl has invalid port` → CDP URL ที่กำหนดมีพอร์ตไม่ถูกต้องหรืออยู่นอกช่วง
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → การติดตั้ง gateway ปัจจุบันไม่มี runtime dependency `playwright-core` ของ bundled browser plugin ให้รัน `openclaw doctor --fix` แล้วรีสตาร์ต gateway จากนั้น ARIA snapshots และภาพหน้าจอพื้นฐานของหน้าอาจยังใช้ได้ แต่การนำทาง, AI snapshots, ภาพหน้าจอองค์ประกอบด้วย CSS selector และการส่งออก PDF จะยังใช้งานไม่ได้

  </Accordion>
  <Accordion title="ลายเซ็นของ Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session ยังแนบกับ browser data dir ที่เลือกไม่ได้ ให้เปิดหน้า inspect ของเบราว์เซอร์ เปิดใช้ remote debugging คงเบราว์เซอร์ไว้ อนุมัติพรอมป์ต์การ attach ครั้งแรก แล้วลองใหม่ หากไม่จำเป็นต้องใช้สถานะที่ล็อกอินไว้ ให้ใช้ profile `openclaw` ที่ระบบจัดการให้
    - `No Chrome tabs found for profile="user"` → profile สำหรับการ attach ของ Chrome MCP ไม่มีแท็บ Chrome ในเครื่องที่เปิดอยู่
    - `Remote CDP for profile "<name>" is not reachable` → remote CDP endpoint ที่กำหนดค่าไว้ไม่สามารถเข้าถึงได้จากโฮสต์ของ gateway
    - `Browser attachOnly is enabled ... not reachable` หรือ `Browser attachOnly is enabled and CDP websocket ... is not reachable` → profile แบบ attach-only ไม่มีเป้าหมายที่เข้าถึงได้ หรือ HTTP endpoint ตอบกลับแล้วแต่ยังเปิด CDP WebSocket ไม่ได้

  </Accordion>
  <Accordion title="ลายเซ็นของ element / screenshot / upload">
    - `fullPage is not supported for element screenshots` → คำขอภาพหน้าจอผสม `--full-page` กับ `--ref` หรือ `--element`
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → การเรียกภาพหน้าจอของ Chrome MCP / `existing-session` ต้องใช้ page capture หรือ snapshot `--ref` ไม่ใช่ CSS `--element`
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → hooks สำหรับการอัปโหลดของ Chrome MCP ต้องใช้ snapshot refs ไม่ใช่ CSS selectors
    - `existing-session file uploads currently support one file at a time.` → สำหรับ profiles ของ Chrome MCP ให้ส่งหนึ่งอัปโหลดต่อหนึ่งการเรียก
    - `existing-session dialog handling does not support timeoutMs.` → dialog hooks บน profiles ของ Chrome MCP ไม่รองรับการ override timeout
    - `existing-session type does not support timeoutMs overrides.` → ให้ละ `timeoutMs` สำหรับ `act:type` บน `profile="user"` / Chrome MCP existing-session profiles หรือใช้ managed/CDP browser profile หากต้องการ custom timeout
    - `existing-session evaluate does not support timeoutMs overrides.` → ให้ละ `timeoutMs` สำหรับ `act:evaluate` บน `profile="user"` / Chrome MCP existing-session profiles หรือใช้ managed/CDP browser profile หากต้องการ custom timeout
    - `response body is not supported for existing-session profiles yet.` → `responsebody` ยังต้องใช้ managed browser หรือ raw CDP profile
    - stale viewport / dark-mode / locale / offline overrides บน profiles แบบ attach-only หรือ remote CDP → รัน `openclaw browser stop --browser-profile <name>` เพื่อปิด active control session และปล่อยสถานะ emulation ของ Playwright/CDP โดยไม่ต้องรีสตาร์ต gateway ทั้งหมด

  </Accordion>
</AccordionGroup>

ที่เกี่ยวข้อง:

- [Browser (จัดการโดย OpenClaw)](/th/tools/browser)
- [การแก้ไขปัญหา Browser](/th/tools/browser-linux-troubleshooting)

## หากคุณอัปเกรดแล้วมีบางอย่างพังทันที

ปัญหาหลังอัปเกรดส่วนใหญ่มาจาก config drift หรือมีการบังคับใช้ค่าเริ่มต้นที่เข้มงวดขึ้น

<AccordionGroup>
  <Accordion title="1. พฤติกรรมของ auth และ URL override เปลี่ยนไป">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    สิ่งที่ต้องตรวจสอบ:

    - หาก `gateway.mode=remote` คำสั่ง CLI อาจกำลังกำหนดเป้าหมายไปที่ remote ทั้งที่ service ในเครื่องของคุณปกติดี
    - การเรียกที่ใช้ `--url` แบบชัดเจนจะไม่ fallback ไปใช้ข้อมูลรับรองที่บันทึกไว้

    ลายเซ็นที่พบบ่อย:

    - `gateway connect failed:` → URL เป้าหมายไม่ถูกต้อง
    - `unauthorized` → เข้าถึง endpoint ได้ แต่ auth ไม่ถูกต้อง

  </Accordion>
  <Accordion title="2. ข้อกำหนดเรื่อง bind และ auth เข้มงวดขึ้น">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    สิ่งที่ต้องตรวจสอบ:

    - การ bind แบบ non-loopback (`lan`, `tailnet`, `custom`) ต้องมีเส้นทาง gateway auth ที่ถูกต้อง: shared token/password auth หรือ deployment แบบ `trusted-proxy` ที่เป็น non-loopback และกำหนดค่าไว้อย่างถูกต้อง
    - key แบบเก่าอย่าง `gateway.token` ไม่ได้ใช้แทน `gateway.auth.token`

    ลายเซ็นที่พบบ่อย:

    - `refusing to bind gateway ... without auth` → bind แบบ non-loopback โดยไม่มีเส้นทาง gateway auth ที่ถูกต้อง
    - `Connectivity probe: failed` ทั้งที่ runtime กำลังทำงาน → gateway ยังมีชีวิตอยู่แต่เข้าถึงไม่ได้ด้วย auth/url ปัจจุบัน

  </Accordion>
  <Accordion title="3. สถานะ pairing และ device identity เปลี่ยนไป">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    สิ่งที่ต้องตรวจสอบ:

    - มี device approvals ที่รอดำเนินการสำหรับแดชบอร์ด/Nodes
    - มี DM pairing approvals ที่รอดำเนินการหลังการเปลี่ยนแปลง policy หรือ identity

    ลายเซ็นที่พบบ่อย:

    - `device identity required` → device auth ไม่ครบตามเงื่อนไข
    - `pairing required` → ผู้ส่ง/อุปกรณ์ต้องได้รับการอนุมัติ

  </Accordion>
</AccordionGroup>

หาก service config และ runtime ยังคงไม่ตรงกันหลังการตรวจสอบ ให้ติดตั้ง metadata ของ service ใหม่จาก profile/state directory เดียวกัน:

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
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
