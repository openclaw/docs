---
read_when:
    - การปรับใช้ OpenClaw บน Fly.io
    - การตั้งค่าวอลุ่ม ข้อมูลลับ และการกำหนดค่าการรันครั้งแรกของ Fly
summary: การปรับใช้ OpenClaw บน Fly.io แบบทีละขั้นตอน พร้อมพื้นที่จัดเก็บแบบถาวรและ HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-06-27T17:43:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d74dbda6177ab279a59de720cf4e88a15aa90798e5f04e87712c99093282a1e
    source_path: install/fly.md
    workflow: 16
---

**เป้าหมาย:** OpenClaw Gateway ทำงานบนเครื่อง [Fly.io](https://fly.io) พร้อมพื้นที่จัดเก็บถาวร, HTTPS อัตโนมัติ และการเข้าถึง Discord/ช่องทาง

## สิ่งที่ต้องมี

- ติดตั้ง [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) แล้ว
- บัญชี Fly.io (ใช้ระดับฟรีได้)
- การยืนยันตัวตนโมเดล: คีย์ API สำหรับผู้ให้บริการโมเดลที่คุณเลือก
- ข้อมูลรับรองช่องทาง: โทเค็นบอต Discord, โทเค็น Telegram ฯลฯ

## เส้นทางด่วนสำหรับผู้เริ่มต้น

1. โคลน repo → ปรับแต่ง `fly.toml`
2. สร้างแอป + โวลุ่ม → ตั้งค่า secrets
3. ดีพลอยด้วย `fly deploy`
4. SSH เข้าไปเพื่อสร้าง config หรือใช้ Control UI

<Steps>
  <Step title="สร้างแอป Fly">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **เคล็ดลับ:** เลือกภูมิภาคที่อยู่ใกล้คุณ ตัวเลือกทั่วไป: `lhr` (ลอนดอน), `iad` (เวอร์จิเนีย), `sjc` (ซานโฮเซ)

  </Step>

  <Step title="กำหนดค่า fly.toml">
    แก้ไข `fly.toml` ให้ตรงกับชื่อแอปและข้อกำหนดของคุณ

    **หมายเหตุด้านความปลอดภัย:** config เริ่มต้นเปิดเผย URL สาธารณะ สำหรับการดีพลอยที่แข็งแกร่งขึ้นโดยไม่มี IP สาธารณะ โปรดดู [การดีพลอยแบบส่วนตัว](#private-deployment-hardened) หรือใช้ `deploy/fly.private.toml`

    ```toml
    app = "my-openclaw"  # Your app name
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

    อิมเมจ Docker ของ OpenClaw ใช้ `tini` เป็น entrypoint คำสั่งโปรเซสของ Fly จะแทนที่ Docker `CMD` โดยไม่แทนที่ `ENTRYPOINT` ดังนั้นโปรเซสจึงยังคงทำงานภายใต้ `tini`

    **การตั้งค่าหลัก:**

    | การตั้งค่า                    | เหตุผล                                                                      |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | ผูกกับ `0.0.0.0` เพื่อให้พร็อกซีของ Fly เข้าถึง Gateway ได้                 |
    | `--allow-unconfigured`         | เริ่มทำงานโดยไม่มีไฟล์ config (คุณจะสร้างไฟล์ภายหลัง)                      |
    | `internal_port = 3000`         | ต้องตรงกับ `--port 3000` (หรือ `OPENCLAW_GATEWAY_PORT`) สำหรับ health checks ของ Fly |
    | `memory = "2048mb"`            | 512MB น้อยเกินไป; แนะนำ 2GB                                                |
    | `OPENCLAW_STATE_DIR = "/data"` | เก็บสถานะถาวรบนโวลุ่ม                                                       |

  </Step>

  <Step title="ตั้งค่า secrets">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    **หมายเหตุ:**

    - การผูกแบบไม่ใช่ loopback (`--bind lan`) ต้องมีเส้นทางยืนยันตัวตน Gateway ที่ถูกต้อง ตัวอย่าง Fly.io นี้ใช้ `OPENCLAW_GATEWAY_TOKEN` แต่ `gateway.auth.password` หรือการดีพลอย `trusted-proxy` แบบไม่ใช่ loopback ที่กำหนดค่าอย่างถูกต้องก็เป็นไปตามข้อกำหนดเช่นกัน
    - ปฏิบัติกับโทเค็นเหล่านี้เหมือนรหัสผ่าน
    - **ควรใช้ env vars แทนไฟล์ config** สำหรับคีย์ API และโทเค็นทั้งหมด วิธีนี้จะกัน secrets ออกจาก `openclaw.json` ซึ่งอาจถูกเปิดเผยหรือบันทึกลง log โดยไม่ตั้งใจ

  </Step>

  <Step title="ดีพลอย">
    ```bash
    fly deploy
    ```

    การดีพลอยครั้งแรกจะสร้างอิมเมจ Docker (ประมาณ 2-3 นาที) การดีพลอยครั้งถัดไปจะเร็วขึ้น

    หลังดีพลอยแล้ว ให้ตรวจสอบ:

    ```bash
    fly status
    fly logs
    ```

    คุณควรเห็น:

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="สร้างไฟล์ config">
    SSH เข้าเครื่องเพื่อสร้าง config ที่เหมาะสม:

    ```bash
    fly ssh console
    ```

    สร้างไดเรกทอรีและไฟล์ config:

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

    **หมายเหตุ:** เมื่อใช้ `OPENCLAW_STATE_DIR=/data` เส้นทาง config คือ `/data/openclaw.json`

    **หมายเหตุ:** แทนที่ `https://my-openclaw.fly.dev` ด้วย origin ของแอป Fly จริงของคุณ การเริ่มทำงานของ Gateway จะ seed origin ของ Control UI ในเครื่องจากค่า runtime `--bind` และ `--port` เพื่อให้การบูตครั้งแรกดำเนินต่อได้ก่อนที่ config จะมีอยู่ แต่การเข้าถึงผ่านเบราว์เซอร์ผ่าน Fly ยังต้องมี origin HTTPS ที่ถูกต้องระบุไว้ใน `gateway.controlUi.allowedOrigins`

    **หมายเหตุ:** โทเค็น Discord มาจากที่ใดที่หนึ่งต่อไปนี้ได้:

    - ตัวแปรสภาพแวดล้อม: `DISCORD_BOT_TOKEN` (แนะนำสำหรับ secrets)
    - ไฟล์ config: `channels.discord.token`

    หากใช้ env var ไม่จำเป็นต้องเพิ่มโทเค็นลงใน config Gateway จะอ่าน `DISCORD_BOT_TOKEN` โดยอัตโนมัติ

    รีสตาร์ตเพื่อปรับใช้:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="เข้าถึง Gateway">
    ### Control UI

    เปิดในเบราว์เซอร์:

    ```bash
    fly open
    ```

    หรือไปที่ `https://my-openclaw.fly.dev/`

    ยืนยันตัวตนด้วย shared secret ที่กำหนดค่าไว้ คู่มือนี้ใช้โทเค็น Gateway จาก `OPENCLAW_GATEWAY_TOKEN`; หากคุณเปลี่ยนไปใช้การยืนยันตัวตนด้วยรหัสผ่าน ให้ใช้รหัสผ่านนั้นแทน

    ### Logs

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### คอนโซล SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## การแก้ไขปัญหา

### "App is not listening on expected address"

Gateway กำลังผูกกับ `127.0.0.1` แทนที่จะเป็น `0.0.0.0`

**วิธีแก้:** เพิ่ม `--bind lan` ไปยังคำสั่งโปรเซสใน `fly.toml`

### Health checks ล้มเหลว / การเชื่อมต่อถูกปฏิเสธ

Fly เข้าถึง Gateway บนพอร์ตที่กำหนดค่าไว้ไม่ได้

**วิธีแก้:** ตรวจสอบให้แน่ใจว่า `internal_port` ตรงกับพอร์ต Gateway (ตั้งค่า `--port 3000` หรือ `OPENCLAW_GATEWAY_PORT=3000`)

### OOM / ปัญหาหน่วยความจำ

คอนเทนเนอร์รีสตาร์ตซ้ำหรือถูกยุติ สัญญาณที่พบ: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` หรือการรีสตาร์ตเงียบ

**วิธีแก้:** เพิ่มหน่วยความจำใน `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

หรืออัปเดตเครื่องที่มีอยู่:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**หมายเหตุ:** 512MB น้อยเกินไป 1GB อาจใช้งานได้ แต่อาจเกิด OOM เมื่อมีโหลดหรือเมื่อเปิด logging แบบละเอียด **แนะนำ 2GB**

### ปัญหา lock ของ Gateway

Gateway ปฏิเสธการเริ่มทำงานพร้อมข้อผิดพลาด "already running"

สิ่งนี้เกิดขึ้นเมื่อคอนเทนเนอร์รีสตาร์ต แต่ไฟล์ PID lock ยังคงอยู่บนโวลุ่ม

**วิธีแก้:** ลบไฟล์ lock:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

ไฟล์ lock อยู่ที่ `/data/gateway.*.lock` (ไม่ได้อยู่ในไดเรกทอรีย่อย)

### Config ไม่ถูกอ่าน

`--allow-unconfigured` เพียงข้าม startup guard เท่านั้น มันไม่ได้สร้างหรือซ่อมแซม `/data/openclaw.json` ดังนั้นตรวจสอบให้แน่ใจว่า config จริงของคุณมีอยู่และมี `gateway.mode="local"` เมื่อคุณต้องการเริ่ม Gateway แบบ local ปกติ

ตรวจสอบว่า config มีอยู่:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### เขียน config ผ่าน SSH

คำสั่ง `fly ssh console -C` ไม่รองรับการ redirect ของเชลล์ หากต้องการเขียนไฟล์ config:

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**หมายเหตุ:** `fly sftp` อาจล้มเหลวหากไฟล์มีอยู่แล้ว ให้ลบก่อน:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### สถานะไม่คงอยู่

หากคุณสูญเสียโปรไฟล์การยืนยันตัวตน, สถานะช่องทาง/ผู้ให้บริการ หรือเซสชันหลังรีสตาร์ต แสดงว่า state dir กำลังเขียนลง filesystem ของคอนเทนเนอร์

**วิธีแก้:** ตรวจสอบให้แน่ใจว่าตั้งค่า `OPENCLAW_STATE_DIR=/data` ใน `fly.toml` แล้วดีพลอยใหม่

## การอัปเดต

```bash
# Pull latest changes
git pull

# Redeploy
fly deploy

# Check health
fly status
fly logs
```

### อัปเดตคำสั่งของเครื่อง

หากคุณต้องเปลี่ยนคำสั่งเริ่มต้นโดยไม่ดีพลอยเต็มรูปแบบ:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**หมายเหตุ:** หลังจาก `fly deploy` คำสั่งของเครื่องอาจรีเซ็ตกลับเป็นค่าที่อยู่ใน `fly.toml` หากคุณเปลี่ยนแปลงด้วยตนเอง ให้ปรับใช้อีกครั้งหลังดีพลอย

## การดีพลอยแบบส่วนตัว (แข็งแกร่งขึ้น)

โดยค่าเริ่มต้น Fly จะจัดสรร IP สาธารณะ ทำให้ Gateway ของคุณเข้าถึงได้ที่ `https://your-app.fly.dev` วิธีนี้สะดวก แต่หมายความว่าการดีพลอยของคุณถูกค้นพบได้โดยตัวสแกนอินเทอร์เน็ต (Shodan, Censys ฯลฯ)

สำหรับการดีพลอยที่แข็งแกร่งขึ้นโดย **ไม่มีการเปิดเผยสาธารณะ** ให้ใช้เทมเพลตส่วนตัว

### เมื่อใดควรใช้การดีพลอยแบบส่วนตัว

- คุณเรียก/ส่งข้อความแบบ **ขาออก** เท่านั้น (ไม่มี Webhook ขาเข้า)
- คุณใช้ทันเนล **ngrok หรือ Tailscale** สำหรับ callback ของ Webhook ใดๆ
- คุณเข้าถึง Gateway ผ่าน **SSH, พร็อกซี หรือ WireGuard** แทนเบราว์เซอร์
- คุณต้องการให้การดีพลอย **ซ่อนจากตัวสแกนอินเทอร์เน็ต**

### การตั้งค่า

ใช้ `deploy/fly.private.toml` แทน config มาตรฐาน:

```bash
# Deploy with private config
fly deploy -c deploy/fly.private.toml
```

หรือแปลงการดีพลอยที่มีอยู่:

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c deploy/fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

หลังจากนี้ `fly ips list` ควรแสดงเฉพาะ IP ประเภท `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### การเข้าถึงการดีพลอยแบบส่วนตัว

เนื่องจากไม่มี URL สาธารณะ ให้ใช้หนึ่งในวิธีต่อไปนี้:

**ตัวเลือก 1: พร็อกซี local (ง่ายที่สุด)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**ตัวเลือก 2: WireGuard VPN**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**ตัวเลือก 3: SSH เท่านั้น**

```bash
fly ssh console -a my-openclaw
```

### Webhook กับการปรับใช้แบบส่วนตัว

หากคุณต้องการคอลแบ็ก Webhook (Twilio, Telnyx ฯลฯ) โดยไม่เปิดเผยต่อสาธารณะ:

1. **ngrok tunnel** - รัน ngrok ภายในคอนเทนเนอร์หรือเป็น sidecar
2. **Tailscale Funnel** - เปิดเผยพาธเฉพาะผ่าน Tailscale
3. **เฉพาะขาออก** - ผู้ให้บริการบางราย (Twilio) ทำงานได้ดีสำหรับการโทรขาออกโดยไม่ต้องใช้ Webhook

ตัวอย่างการกำหนดค่าการโทรเสียงด้วย ngrok:

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

ngrok tunnel รันภายในคอนเทนเนอร์และให้ URL Webhook สาธารณะโดยไม่เปิดเผยแอป Fly เอง ตั้งค่า `webhookSecurity.allowedHosts` เป็นชื่อโฮสต์ tunnel สาธารณะเพื่อให้ยอมรับ forwarded host headers

### ประโยชน์ด้านความปลอดภัย

| แง่มุม            | สาธารณะ       | ส่วนตัว    |
| ----------------- | ------------ | ---------- |
| สแกนเนอร์อินเทอร์เน็ต | ค้นพบได้ | ซ่อนอยู่     |
| การโจมตีโดยตรง    | เป็นไปได้     | ถูกบล็อก    |
| การเข้าถึง Control UI | เบราว์เซอร์      | Proxy/VPN  |
| การส่ง Webhook  | โดยตรง       | ผ่าน tunnel |

## หมายเหตุ

- Fly.io ใช้ **สถาปัตยกรรม x86** (ไม่ใช่ ARM)
- Dockerfile เข้ากันได้กับทั้งสองสถาปัตยกรรม
- สำหรับการเริ่มใช้งาน WhatsApp/Telegram ให้ใช้ `fly ssh console`
- ข้อมูลถาวรอยู่บนโวลุ่มที่ `/data`
- Signal ต้องใช้ Java + signal-cli; ใช้อิมเมจแบบกำหนดเองและคงหน่วยความจำไว้ที่ 2GB+

## ค่าใช้จ่าย

ด้วยการกำหนดค่าที่แนะนำ (`shared-cpu-2x`, RAM 2GB):

- ประมาณ $10-15/เดือน ขึ้นอยู่กับการใช้งาน
- ระดับฟรีมีโควตาบางส่วนรวมอยู่ด้วย

ดูรายละเอียดที่ [ราคาของ Fly.io](https://fly.io/docs/about/pricing/)

## ขั้นตอนถัดไป

- ตั้งค่าช่องทางการส่งข้อความ: [ช่องทาง](/th/channels)
- กำหนดค่า Gateway: [การกำหนดค่า Gateway](/th/gateway/configuration)
- ดูแลให้ OpenClaw เป็นเวอร์ชันล่าสุดเสมอ: [การอัปเดต](/th/install/updating)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Hetzner](/th/install/hetzner)
- [Docker](/th/install/docker)
- [การโฮสต์ VPS](/th/vps)
