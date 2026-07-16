---
read_when:
    - การปรับใช้ OpenClaw บน Fly.io
    - การตั้งค่าโวลุมของ Fly, secrets และการกำหนดค่าสำหรับการเรียกใช้ครั้งแรก
summary: การปรับใช้ OpenClaw บน Fly.io ทีละขั้นตอนพร้อมพื้นที่จัดเก็บถาวรและ HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-16T19:16:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d2b5119c1df8ee077f4db4f44fa92c6ae0e2bf3c355c2117e0fd39146bb49875
    source_path: install/fly.md
    workflow: 16
---

**เป้าหมาย:** ให้ OpenClaw Gateway ทำงานบนเครื่อง [Fly.io](https://fly.io) พร้อมพื้นที่จัดเก็บถาวร, HTTPS อัตโนมัติ และการเข้าถึง Discord/ช่องทาง

## สิ่งที่ต้องมี

- ติดตั้ง [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) แล้ว
- บัญชี Fly.io (ใช้แพ็กเกจฟรีได้)
- การยืนยันตัวตนของโมเดล: API key สำหรับผู้ให้บริการโมเดลที่เลือก
- ข้อมูลประจำตัวของช่องทาง: โทเค็นบอต Discord, โทเค็น Telegram เป็นต้น

## วิธีด่วนสำหรับผู้เริ่มต้น

1. โคลนรีโพซิทอรีและปรับแต่ง `fly.toml`
2. สร้างแอปและโวลุ่ม แล้วตั้งค่าความลับ
3. ปรับใช้ด้วย `fly deploy`
4. เชื่อมต่อผ่าน SSH เพื่อสร้างการกำหนดค่า หรือใช้ Control UI

<Steps>
  <Step title="สร้างแอป Fly">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # เลือกชื่อของคุณเอง
    fly apps create my-openclaw

    # โดยทั่วไป 1GB ก็เพียงพอ
    fly volumes create openclaw_data --size 1 --region iad
    ```

    เลือกภูมิภาคที่อยู่ใกล้คุณ ตัวเลือกทั่วไป ได้แก่ `lhr` (ลอนดอน), `iad` (เวอร์จิเนีย), `sjc` (ซานโฮเซ)

  </Step>

  <Step title="กำหนดค่า fly.toml">
    แก้ไข `fly.toml` ให้ตรงกับชื่อแอปและข้อกำหนดของคุณ ไฟล์ `fly.toml` ที่ติดตามอยู่ในรีโพซิทอรีคือเทมเพลตสาธารณะที่แสดงด้านล่าง ส่วน `deploy/fly.private.toml` คือรูปแบบที่เพิ่มความปลอดภัยและไม่มี IP สาธารณะ (ดู [การปรับใช้แบบส่วนตัว](#private-deployment-hardened))

    ```toml
    app = "my-openclaw"  # ชื่อแอปของคุณ
    primary_region = "iad"

    [build]
      dockerfile = "Dockerfile"

    [env]
      NODE_ENV = "production"
      OPENCLAW_PREFER_PNPM = "1"
      OPENCLAW_STATE_DIR = "/data"
      NODE_OPTIONS = "--max-old-space-size=1536"

    [processes]
      app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

    [http_service]
      internal_port = 3000
      force_https = true
      auto_stop_machines = false
      auto_start_machines = true
      min_machines_running = 1
      processes = ["app"]

    [[vm]]
      size = "shared-cpu-2x"
      memory = "2048mb"

    [mounts]
      source = "openclaw_data"
      destination = "/data"
    ```

    จุดเริ่มต้นของอิมเมจ Docker ของ OpenClaw คือ `tini` ซึ่งเรียกใช้ `node openclaw.mjs gateway` ตามค่าเริ่มต้น `[processes]` ของ Fly จะแทนที่ `CMD` ของ Docker (ในที่นี้จะเรียกใช้ `node dist/index.js gateway ...` โดยตรง ซึ่งเป็นจุดเริ่มต้นที่คอมไพล์แล้วเดียวกัน) โดยไม่แตะต้อง `ENTRYPOINT` ดังนั้นโปรเซสจึงยังคงทำงานภายใต้ `tini`

    **การตั้งค่าหลัก:**

    | การตั้งค่า                        | เหตุผล                                                                         |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | ผูกกับ `0.0.0.0` เพื่อให้พร็อกซีของ Fly เข้าถึง Gateway ได้                     |
    | `--allow-unconfigured`         | เริ่มทำงานโดยไม่มีไฟล์การกำหนดค่า (สร้างภายหลัง)                        |
    | `internal_port = 3000`         | ต้องตรงกับ `--port 3000` (หรือ `OPENCLAW_GATEWAY_PORT`) สำหรับการตรวจสอบสถานะของ Fly |
    | `memory = "2048mb"`            | 512MB น้อยเกินไป แนะนำให้ใช้ 2GB                                         |
    | `OPENCLAW_STATE_DIR = "/data"` | เก็บสถานะไว้บนโวลุ่มอย่างถาวร                                                |

  </Step>

  <Step title="ตั้งค่าความลับ">
    ```bash
    # จำเป็น: โทเค็นยืนยันตัวตนของ Gateway สำหรับการผูกแบบไม่ใช่ลูปแบ็ก
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # API key ของผู้ให้บริการโมเดล
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # ไม่บังคับ: ผู้ให้บริการอื่น
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # โทเค็นของช่องทาง
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    การผูกแบบไม่ใช่ลูปแบ็ก (`--bind lan`) ต้องมีเส้นทางยืนยันตัวตนของ Gateway ที่ถูกต้อง ตัวอย่างนี้ใช้ `OPENCLAW_GATEWAY_TOKEN` แต่ `gateway.auth.password` หรือการปรับใช้พร็อกซีที่เชื่อถือได้แบบไม่ใช่ลูปแบ็กซึ่งกำหนดค่าอย่างถูกต้องก็เป็นไปตามข้อกำหนดเช่นกัน ดูสัญญา SecretRef ที่ [การจัดการความลับ](/th/gateway/secrets)

    ปฏิบัติต่อโทเค็นเหล่านี้เช่นเดียวกับรหัสผ่าน ควรใช้ตัวแปรสภาพแวดล้อม/`fly secrets` แทนไฟล์การกำหนดค่าสำหรับ API key และโทเค็น เพื่อไม่ให้ความลับอยู่ใน `openclaw.json`

  </Step>

  <Step title="ปรับใช้">
    ```bash
    fly deploy
    ```

    การปรับใช้ครั้งแรกจะสร้างอิมเมจ Docker ตรวจสอบหลังการปรับใช้:

    ```bash
    fly status
    fly logs
    ```

    บันทึกการเริ่มต้นของ Gateway จะแสดง `gateway ready` เมื่อตัวรับฟัง HTTP/WebSocket พร้อมทำงานแล้ว การตรวจสอบสถานะของ Fly จะเฝ้าดู `internal_port = 3000` ตาม `fly.toml` ส่วนคำสั่ง `HEALTHCHECK` ของ Docker ในอิมเมจจะสำรวจ `/healthz` เพิ่มเติมบนพอร์ตเริ่มต้น 18789 ซึ่งไม่ได้ใช้ในที่นี้ เนื่องจากการปรับใช้นี้กำหนดให้ Gateway ใช้ `--port 3000` แทน

  </Step>

  <Step title="สร้างไฟล์การกำหนดค่า">
    เชื่อมต่อเครื่องผ่าน SSH เพื่อสร้างการกำหนดค่าที่เหมาะสม:

    ```bash
    fly ssh console
    ```

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.4"]
          },
          "maxConcurrent": 4
        },
        "list": [
          {
            "id": "main",
            "default": true
          }
        ]
      },
      "auth": {
        "profiles": {
          "anthropic:default": { "mode": "token", "provider": "anthropic" },
          "openai:default": { "mode": "token", "provider": "openai" }
        }
      },
      "bindings": [
        {
          "agentId": "main",
          "match": { "channel": "discord" }
        }
      ],
      "channels": {
        "discord": {
          "enabled": true,
          "groupPolicy": "allowlist",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": { "general": { "allow": true } },
              "requireMention": false
            }
          }
        }
      },
      "gateway": {
        "mode": "local",
        "bind": "auto",
        "controlUi": {
          "allowedOrigins": [
            "https://my-openclaw.fly.dev",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
          ]
        }
      },
      "meta": {}
    }
    EOF
    ```

    เมื่อใช้ `OPENCLAW_STATE_DIR=/data` พาธการกำหนดค่าคือ `/data/openclaw.json`

    แทนที่ `https://my-openclaw.fly.dev` ด้วยต้นทางจริงของแอป Fly ของคุณ การเริ่มต้น Gateway จะตั้งต้นต้นทางของ Control UI ภายในเครื่องจากค่า `--bind` และ `--port` ขณะรันไทม์ เพื่อให้การบูตครั้งแรกดำเนินต่อได้ก่อนมีการกำหนดค่า แต่การเข้าถึงผ่านเบราว์เซอร์โดยใช้ Fly ยังคงต้องระบุต้นทาง HTTPS ที่ตรงกันทุกประการไว้ใน `gateway.controlUi.allowedOrigins`

    โทเค็น Discord สามารถมาจากแหล่งใดแหล่งหนึ่งต่อไปนี้:

    - ตัวแปรสภาพแวดล้อม `DISCORD_BOT_TOKEN` (แนะนำสำหรับความลับ) ไม่จำเป็นต้องเพิ่มลงในการกำหนดค่า เพราะ Gateway จะอ่านโดยอัตโนมัติ
    - ไฟล์การกำหนดค่า `channels.discord.token`

    เริ่มการทำงานใหม่เพื่อใช้การเปลี่ยนแปลง:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="เข้าถึง Gateway">
    ### Control UI

    ```bash
    fly open
    ```

    หรือไปที่ `https://my-openclaw.fly.dev/`

    ยืนยันตัวตนด้วยความลับที่ใช้ร่วมกันซึ่งกำหนดค่าไว้ ได้แก่ โทเค็น Gateway จาก `OPENCLAW_GATEWAY_TOKEN` หรือรหัสผ่านของคุณหากเปลี่ยนไปใช้การยืนยันตัวตนด้วยรหัสผ่าน

    ### บันทึก

    ```bash
    fly logs              # บันทึกแบบสด
    fly logs --no-tail    # บันทึกล่าสุด
    ```

    ### คอนโซล SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## การแก้ไขปัญหา

### "แอปไม่ได้รับฟังบนที่อยู่ที่คาดไว้"

Gateway กำลังผูกกับ `127.0.0.1` แทน `0.0.0.0`

**วิธีแก้:** เพิ่ม `--bind lan` ลงในคำสั่งโปรเซสใน `fly.toml`

### การตรวจสอบสถานะล้มเหลว / การเชื่อมต่อถูกปฏิเสธ

Fly ไม่สามารถเข้าถึง Gateway บนพอร์ตที่กำหนดค่าไว้

**วิธีแก้:** ตรวจสอบว่า `internal_port` ตรงกับพอร์ตของ Gateway (`--port 3000` หรือ `OPENCLAW_GATEWAY_PORT=3000`)

### OOM / ปัญหาหน่วยความจำ

คอนเทนเนอร์เริ่มการทำงานใหม่อย่างต่อเนื่องหรือถูกยุติ สัญญาณ ได้แก่ `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` หรือการเริ่มการทำงานใหม่โดยไม่มีข้อความแจ้ง

**วิธีแก้:** เพิ่มหน่วยความจำใน `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

หรืออัปเดตเครื่องที่มีอยู่:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512MB น้อยเกินไป 1GB อาจใช้งานได้ แต่อาจเกิด OOM เมื่อมีภาระงานสูงหรือเปิดใช้การบันทึกแบบละเอียด แนะนำให้ใช้ 2GB

### ปัญหาล็อกของ Gateway

Gateway ปฏิเสธที่จะเริ่มทำงานพร้อมข้อผิดพลาด "ทำงานอยู่แล้ว" หลังจากคอนเทนเนอร์เริ่มการทำงานใหม่

ไฟล์ล็อกขณะรันไทม์อยู่ที่ `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock`
และ `gateway.state.<hash>.lock` (Linux:
`/tmp/openclaw-<uid>/gateway.*.lock`) ไม่ได้อยู่บนโวลุ่มถาวร `/data` ดังนั้น
โดยปกติการเริ่มคอนเทนเนอร์ใหม่ทั้งหมดจะล้างไฟล์เหล่านี้พร้อมกับระบบไฟล์
ส่วนที่เหลือของคอนเทนเนอร์ หากล็อกยังคงอยู่ (ตัวอย่างเช่น `fly machine restart`
ที่เก็บรักษาระบบไฟล์ของคอนเทนเนอร์ไว้) และขัดขวางการเริ่มต้น ให้ลบ
ด้วยตนเอง:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### ไม่มีการอ่านการกำหนดค่า

`--allow-unconfigured` เพียงข้ามตัวป้องกันการเริ่มต้นเท่านั้น ไม่ได้สร้างหรือซ่อมแซม `/data/openclaw.json` ดังนั้นโปรดตรวจสอบว่าการกำหนดค่าจริงมีอยู่และมี `"gateway": { "mode": "local" }` สำหรับการเริ่ม Gateway ภายในเครื่องตามปกติ

ตรวจสอบว่าไฟล์การกำหนดค่ามีอยู่:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### การเขียนการกำหนดค่าผ่าน SSH

`fly ssh console -C` ไม่รองรับการเปลี่ยนเส้นทางเชลล์ หากต้องการเขียนไฟล์การกำหนดค่า:

```bash
# echo + tee (ส่งผ่านไปป์จากเครื่องภายในไปยังเครื่องระยะไกล)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# หรือ sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

`fly sftp` อาจล้มเหลวหากไฟล์มีอยู่แล้ว ให้ลบก่อน:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### สถานะไม่ถูกเก็บไว้อย่างถาวร

หากโปรไฟล์การยืนยันตัวตน สถานะช่องทาง/ผู้ให้บริการ หรือเซสชันสูญหายหลังเริ่มการทำงานใหม่ แสดงว่าไดเรกทอรีสถานะกำลังเขียนลงในระบบไฟล์ของคอนเทนเนอร์แทนโวลุ่ม

**วิธีแก้:** ตรวจสอบว่าได้ตั้งค่า `OPENCLAW_STATE_DIR=/data` ใน `fly.toml` แล้วปรับใช้อีกครั้ง

## การอัปเดต

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` คือวิธีที่มีการควบคุมดูแลในที่นี้ โดยจะสร้างอิมเมจใหม่จาก Dockerfile ทำให้เวอร์ชัน CLI/Gateway, อิมเมจระบบปฏิบัติการพื้นฐาน และการเปลี่ยนแปลงใด ๆ ใน Dockerfile อัปเดตพร้อมกันทั้งหมด การใช้ `openclaw update` ภายในคอนเทนเนอร์ที่กำลังทำงานไม่ใช่การดำเนินการเดียวกัน เนื่องจากอิมเมจจัดส่งเป็นแผนผัง `dist/` ที่สร้างด้วย Docker โดยไม่มีการเช็กเอาต์ `.git` และไม่มีการติดตั้งส่วนกลางที่จัดการด้วย npm ให้ตรวจพบ ดูขั้นตอนดังกล่าวสำหรับการติดตั้งแบบ VM ที่ [การอัปเดต](/th/install/updating)

### การอัปเดตคำสั่งของเครื่อง

หากต้องการเปลี่ยนคำสั่งเริ่มต้นโดยไม่ปรับใช้ใหม่ทั้งหมด:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# หรือเพิ่มหน่วยความจำด้วย
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

การเรียก `fly deploy` ในภายหลังจะรีเซ็ตคำสั่งของเครื่องกลับเป็นค่าที่อยู่ใน `fly.toml` ให้ใช้การเปลี่ยนแปลงด้วยตนเองอีกครั้งหลังปรับใช้ใหม่

## การปรับใช้แบบส่วนตัว (เพิ่มความปลอดภัย)

ตามค่าเริ่มต้น Fly จะจัดสรร IP สาธารณะ ดังนั้น Gateway ของคุณจะเข้าถึงได้ที่ `https://your-app.fly.dev` และเครื่องสแกนอินเทอร์เน็ต (Shodan, Censys เป็นต้น) สามารถค้นพบได้

ใช้ `deploy/fly.private.toml` สำหรับการปรับใช้ที่เพิ่มความปลอดภัยและ **ไม่มี IP สาธารณะ** โดยจะละเว้น `[http_service]` จึงไม่มีการจัดสรรทางเข้าจากสาธารณะ

### กรณีที่ควรใช้การปรับใช้แบบส่วนตัว

- มีเฉพาะการเรียก/ข้อความขาออก (ไม่มี Webhook ขาเข้า)
- ทันเนล ngrok หรือ Tailscale จัดการการเรียกกลับของ Webhook
- เข้าถึง Gateway ผ่าน SSH, พร็อกซี หรือ WireGuard แทนเบราว์เซอร์
- ควรซ่อนการปรับใช้จากเครื่องสแกนอินเทอร์เน็ต

### การตั้งค่า

```bash
fly deploy -c deploy/fly.private.toml
```

หรือแปลงการปรับใช้ที่มีอยู่:

```bash
# แสดงรายการ IP ปัจจุบัน
fly ips list -a my-openclaw

# คืน IP สาธารณะ
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# เปลี่ยนไปใช้การกำหนดค่าส่วนตัว เพื่อไม่ให้การปรับใช้งานครั้งต่อไปจัดสรร IP สาธารณะใหม่
fly deploy -c deploy/fly.private.toml

# จัดสรร IPv6 แบบส่วนตัวเท่านั้น
fly ips allocate-v6 --private -a my-openclaw
```

หลังจากนี้ `fly ips list` ควรแสดงเฉพาะ IP ชนิด `private`:

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### การเข้าถึงการปรับใช้แบบส่วนตัว

**ตัวเลือกที่ 1: พร็อกซีภายในเครื่อง (ง่ายที่สุด)**

```bash
fly proxy 3000:3000 -a my-openclaw
# เปิด http://localhost:3000 ในเบราว์เซอร์
```

**ตัวเลือกที่ 2: WireGuard VPN**

```bash
fly wireguard create
# นำเข้าไปยังไคลเอนต์ WireGuard แล้วเข้าถึงผ่าน IPv6 ภายใน
# ตัวอย่าง: http://[fdaa:x:x:x:x::x]:3000
```

**ตัวเลือกที่ 3: SSH เท่านั้น**

```bash
fly ssh console -a my-openclaw
```

### Webhook กับการปรับใช้แบบส่วนตัว

สำหรับการเรียกกลับของ Webhook (Twilio, Telnyx เป็นต้น) โดยไม่เปิดให้สาธารณะเข้าถึง:

1. **อุโมงค์ ngrok**: เรียกใช้ ngrok ภายในคอนเทนเนอร์หรือเป็นไซด์คาร์
2. **Tailscale Funnel**: เปิดให้เข้าถึงเฉพาะพาธที่กำหนดผ่าน Tailscale
3. **ขาออกเท่านั้น**: ผู้ให้บริการบางราย (Twilio) รองรับการโทรขาออกโดยไม่ต้องใช้ Webhook

ตัวอย่างการกำหนดค่าการโทรด้วยเสียงโดยใช้ ngrok ภายใต้ `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          tunnel: { provider: "ngrok" },
          webhookSecurity: {
            allowedHosts: ["example.ngrok.app"],
          },
        },
      },
    },
  },
}
```

อุโมงค์ ngrok ทำงานภายในคอนเทนเนอร์และให้ URL ของ Webhook สาธารณะโดยไม่เปิดเผยตัวแอป Fly ตั้งค่า `webhookSecurity.allowedHosts` เป็นชื่อโฮสต์ของอุโมงค์เพื่อยอมรับส่วนหัวโฮสต์ที่ส่งต่อมา

### ข้อแลกเปลี่ยนด้านความปลอดภัย

| ด้าน                 | สาธารณะ              | ส่วนตัว          |
| -------------------- | --------------------- | ---------------- |
| เครื่องสแกนอินเทอร์เน็ต | ตรวจพบได้             | ซ่อนอยู่          |
| การโจมตีโดยตรง       | เป็นไปได้              | ถูกปิดกั้น         |
| การเข้าถึง UI ควบคุม | เบราว์เซอร์            | พร็อกซี/VPN       |
| การส่ง Webhook       | โดยตรง                | ผ่านอุโมงค์        |

## หมายเหตุ

- Fly.io ใช้สถาปัตยกรรม x86 โดย Dockerfile รองรับทั้ง x86 และ ARM
- สำหรับการเริ่มต้นใช้งาน WhatsApp/Telegram ให้ใช้ `fly ssh console`
- ข้อมูลถาวรอยู่ในวอลุ่มที่ `/data`
- Signal ต้องใช้ signal-cli (CLI ที่ใช้ Java) ในอิมเมจ ให้ใช้อิมเมจแบบกำหนดเองและกำหนดหน่วยความจำอย่างน้อย 2GB

## ค่าใช้จ่าย

เมื่อใช้การกำหนดค่าที่แนะนำ (`shared-cpu-2x`, RAM 2GB) ค่าใช้จ่ายโดยประมาณอยู่ที่ $10-15/เดือน ขึ้นอยู่กับการใช้งาน โดยระดับฟรีครอบคลุมโควตาพื้นฐานบางส่วน ดูอัตราปัจจุบันได้ที่ [ราคาของ Fly.io](https://fly.io/docs/about/pricing/)

## ขั้นตอนถัดไป

- ตั้งค่าช่องทางการรับส่งข้อความ: [ช่องทาง](/th/channels)
- กำหนดค่า Gateway: [การกำหนดค่า Gateway](/th/gateway/configuration)
- อัปเดต OpenClaw ให้เป็นเวอร์ชันล่าสุดอยู่เสมอ: [การอัปเดต](/th/install/updating)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Hetzner](/th/install/hetzner)
- [Docker](/th/install/docker)
- [การโฮสต์บน VPS](/th/vps)
