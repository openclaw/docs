---
read_when:
    - การปรับใช้ OpenClaw บน Fly.io
    - การตั้งค่าโวลุ่มของ Fly, ข้อมูลลับ และการกำหนดค่าสำหรับการรันครั้งแรก
summary: การปรับใช้ OpenClaw บน Fly.io แบบทีละขั้นตอน พร้อมพื้นที่จัดเก็บข้อมูลแบบคงอยู่และ HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-05-10T19:43:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2f6f56d22f01fc3729bafc47337e12dfad626a8b0bebb60bc4b49757d6cd1d3
    source_path: install/fly.md
    workflow: 16
---

**เป้าหมาย:** ให้ OpenClaw Gateway ทำงานบนเครื่อง [Fly.io](https://fly.io) พร้อมพื้นที่จัดเก็บถาวร, HTTPS อัตโนมัติ และการเข้าถึง Discord/ช่องทาง

## สิ่งที่ต้องมี

- ติดตั้ง [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- บัญชี Fly.io (ใช้ระดับฟรีได้)
- การยืนยันตัวตนของโมเดล: API key สำหรับผู้ให้บริการโมเดลที่คุณเลือก
- ข้อมูลรับรองช่องทาง: โทเคนบอต Discord, โทเคน Telegram ฯลฯ

## เส้นทางด่วนสำหรับผู้เริ่มต้น

1. โคลนรีโพ → ปรับแต่ง `fly.toml`
2. สร้างแอป + วอลุ่ม → ตั้งค่าความลับ
3. ดีพลอยด้วย `fly deploy`
4. SSH เข้าไปเพื่อสร้างคอนฟิก หรือใช้ Control UI

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

    **เคล็ดลับ:** เลือกภูมิภาคที่อยู่ใกล้คุณ ตัวเลือกที่พบบ่อย: `lhr` (ลอนดอน), `iad` (เวอร์จิเนีย), `sjc` (ซานโฮเซ)

  </Step>

  <Step title="กำหนดค่า fly.toml">
    แก้ไข `fly.toml` ให้ตรงกับชื่อแอปและความต้องการของคุณ

    **หมายเหตุด้านความปลอดภัย:** คอนฟิกเริ่มต้นเปิดเผย URL สาธารณะ สำหรับการดีพลอยที่เสริมความปลอดภัยโดยไม่มี IP สาธารณะ ให้ดู [การดีพลอยแบบส่วนตัว](#private-deployment-hardened) หรือใช้ `deploy/fly.private.toml`

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

    อิมเมจ Docker ของ OpenClaw ใช้ `tini` เป็น entrypoint คำสั่ง process ของ Fly จะแทนที่ Docker `CMD` โดยไม่แทนที่ `ENTRYPOINT` ดังนั้น process ยังทำงานภายใต้ `tini`

    **การตั้งค่าสำคัญ:**

    | การตั้งค่า                      | เหตุผล                                                                       |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | ผูกกับ `0.0.0.0` เพื่อให้พร็อกซีของ Fly เข้าถึง gateway ได้                 |
    | `--allow-unconfigured`         | เริ่มทำงานโดยไม่มีไฟล์คอนฟิก (คุณจะสร้างภายหลัง)                           |
    | `internal_port = 3000`         | ต้องตรงกับ `--port 3000` (หรือ `OPENCLAW_GATEWAY_PORT`) สำหรับ health check ของ Fly |
    | `memory = "2048mb"`            | 512MB เล็กเกินไป แนะนำ 2GB                                                  |
    | `OPENCLAW_STATE_DIR = "/data"` | คงสถานะไว้บนวอลุ่ม                                                          |

  </Step>

  <Step title="ตั้งค่าความลับ">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **หมายเหตุ:**

    - การ bind แบบไม่ใช่ loopback (`--bind lan`) ต้องมีเส้นทางยืนยันตัวตน gateway ที่ถูกต้อง ตัวอย่าง Fly.io นี้ใช้ `OPENCLAW_GATEWAY_TOKEN` แต่ `gateway.auth.password` หรือการดีพลอยแบบ `trusted-proxy` ที่ไม่ใช่ loopback และกำหนดค่าอย่างถูกต้องก็เป็นไปตามข้อกำหนดเช่นกัน
    - ปฏิบัติกับโทเคนเหล่านี้เหมือนรหัสผ่าน
    - **ควรใช้ env vars แทนไฟล์คอนฟิก** สำหรับ API key และโทเคนทั้งหมด วิธีนี้ช่วยกันไม่ให้ความลับอยู่ใน `openclaw.json` ซึ่งอาจถูกเปิดเผยหรือถูกบันทึกลงล็อกโดยไม่ตั้งใจ

  </Step>

  <Step title="ดีพลอย">
    ```bash
    fly deploy
    ```

    การดีพลอยครั้งแรกจะสร้างอิมเมจ Docker (~2-3 นาที) การดีพลอยครั้งถัดไปจะเร็วกว่า

    หลังดีพลอย ให้ตรวจสอบ:

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

  <Step title="สร้างไฟล์คอนฟิก">
    SSH เข้าเครื่องเพื่อสร้างคอนฟิกที่เหมาะสม:

    ```bash
    fly ssh console
    ```

    สร้างไดเรกทอรีและไฟล์คอนฟิก:

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

    **หมายเหตุ:** เมื่อใช้ `OPENCLAW_STATE_DIR=/data` เส้นทางคอนฟิกคือ `/data/openclaw.json`

    **หมายเหตุ:** แทนที่ `https://my-openclaw.fly.dev` ด้วย origin จริงของแอป Fly ของคุณ การเริ่มต้น Gateway จะ seed origin ของ Control UI ภายในจากค่า runtime `--bind` และ `--port` เพื่อให้การบูตครั้งแรกดำเนินต่อได้ก่อนมีคอนฟิก แต่การเข้าถึงผ่านเบราว์เซอร์ทาง Fly ยังต้องมี HTTPS origin ที่ตรงกันระบุไว้ใน `gateway.controlUi.allowedOrigins`

    **หมายเหตุ:** โทเคน Discord สามารถมาจากอย่างใดอย่างหนึ่ง:

    - ตัวแปรสภาพแวดล้อม: `DISCORD_BOT_TOKEN` (แนะนำสำหรับความลับ)
    - ไฟล์คอนฟิก: `channels.discord.token`

    หากใช้ env var ไม่จำเป็นต้องเพิ่มโทเคนในคอนฟิก Gateway จะอ่าน `DISCORD_BOT_TOKEN` โดยอัตโนมัติ

    รีสตาร์ตเพื่อให้มีผล:

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

    ยืนยันตัวตนด้วย shared secret ที่กำหนดค่าไว้ คู่มือนี้ใช้โทเคน Gateway จาก `OPENCLAW_GATEWAY_TOKEN`; หากคุณเปลี่ยนไปใช้การยืนยันตัวตนด้วยรหัสผ่าน ให้ใช้รหัสผ่านนั้นแทน

    ### ล็อก

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

Gateway กำลัง bind กับ `127.0.0.1` แทน `0.0.0.0`

**วิธีแก้:** เพิ่ม `--bind lan` ในคำสั่ง process ของคุณใน `fly.toml`

### Health check ล้มเหลว / connection refused

Fly เข้าถึง Gateway บนพอร์ตที่กำหนดค่าไว้ไม่ได้

**วิธีแก้:** ตรวจสอบให้แน่ใจว่า `internal_port` ตรงกับพอร์ต Gateway (ตั้ง `--port 3000` หรือ `OPENCLAW_GATEWAY_PORT=3000`)

### OOM / ปัญหาหน่วยความจำ

คอนเทนเนอร์รีสตาร์ตซ้ำหรือถูก kill สัญญาณที่พบ: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` หรือรีสตาร์ตเงียบ ๆ

**วิธีแก้:** เพิ่มหน่วยความจำใน `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

หรืออัปเดตเครื่องที่มีอยู่:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**หมายเหตุ:** 512MB เล็กเกินไป 1GB อาจใช้งานได้แต่อาจ OOM เมื่อมีโหลดหรือเปิดล็อกละเอียด **แนะนำ 2GB**

### ปัญหา lock ของ Gateway

Gateway ปฏิเสธการเริ่มต้นพร้อมข้อผิดพลาด "already running"

กรณีนี้เกิดขึ้นเมื่อคอนเทนเนอร์รีสตาร์ตแต่ไฟล์ PID lock ยังคงอยู่บนวอลุ่ม

**วิธีแก้:** ลบไฟล์ lock:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

ไฟล์ lock อยู่ที่ `/data/gateway.*.lock` (ไม่ได้อยู่ในไดเรกทอรีย่อย)

### ไม่อ่านคอนฟิก

`--allow-unconfigured` แค่ข้าม startup guard เท่านั้น ไม่ได้สร้างหรือซ่อมแซม `/data/openclaw.json` ดังนั้นตรวจสอบให้แน่ใจว่าคอนฟิกจริงของคุณมีอยู่และมี `gateway.mode="local"` เมื่อคุณต้องการเริ่ม Gateway แบบ local ตามปกติ

ตรวจสอบว่าคอนฟิกมีอยู่:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### เขียนคอนฟิกผ่าน SSH

คำสั่ง `fly ssh console -C` ไม่รองรับ shell redirection หากต้องการเขียนไฟล์คอนฟิก:

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

หากคุณสูญเสียโปรไฟล์การยืนยันตัวตน สถานะช่องทาง/ผู้ให้บริการ หรือเซสชันหลังรีสตาร์ต แสดงว่า state dir กำลังเขียนไปยังระบบไฟล์ของคอนเทนเนอร์

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

### การอัปเดตคำสั่งของเครื่อง

หากคุณต้องเปลี่ยนคำสั่งเริ่มต้นโดยไม่ดีพลอยใหม่ทั้งหมด:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**หมายเหตุ:** หลัง `fly deploy` คำสั่งของเครื่องอาจรีเซ็ตเป็นสิ่งที่อยู่ใน `fly.toml` หากคุณเปลี่ยนเอง ให้ปรับใช้ซ้ำหลังดีพลอย

## การดีพลอยแบบส่วนตัว (เสริมความปลอดภัย)

โดยค่าเริ่มต้น Fly จะจัดสรร IP สาธารณะ ทำให้ Gateway ของคุณเข้าถึงได้ที่ `https://your-app.fly.dev` วิธีนี้สะดวก แต่หมายความว่าการดีพลอยของคุณถูกค้นพบได้โดยสแกนเนอร์บนอินเทอร์เน็ต (Shodan, Censys ฯลฯ)

สำหรับการดีพลอยที่เสริมความปลอดภัยโดย **ไม่เปิดเผยต่อสาธารณะ** ให้ใช้เทมเพลตส่วนตัว

### เมื่อใดควรใช้การดีพลอยแบบส่วนตัว

- คุณส่งการเรียก/ข้อความแบบ **ขาออก** เท่านั้น (ไม่มี Webhook ขาเข้า)
- คุณใช้ tunnel ของ **ngrok หรือ Tailscale** สำหรับ callback ของ Webhook ใด ๆ
- คุณเข้าถึง Gateway ผ่าน **SSH, proxy หรือ WireGuard** แทนเบราว์เซอร์
- คุณต้องการให้การดีพลอย **ซ่อนจากสแกนเนอร์บนอินเทอร์เน็ต**

### การตั้งค่า

ใช้ `deploy/fly.private.toml` แทนคอนฟิกมาตรฐาน:

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

เนื่องจากไม่มี URL สาธารณะ ให้ใช้วิธีใดวิธีหนึ่งต่อไปนี้:

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

**ตัวเลือกที่ 3: เฉพาะ SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhook กับการปรับใช้แบบส่วนตัว

หากคุณต้องการให้มีการเรียกกลับของ Webhook (Twilio, Telnyx ฯลฯ) โดยไม่เปิดเผยต่อสาธารณะ:

1. **อุโมงค์ ngrok** - เรียกใช้ ngrok ภายในคอนเทนเนอร์หรือเป็น sidecar
2. **Tailscale Funnel** - เปิดเผยเฉพาะเส้นทางที่กำหนดผ่าน Tailscale
3. **ขาออกเท่านั้น** - ผู้ให้บริการบางราย (Twilio) ใช้งานได้ดีสำหรับการโทรขาออกโดยไม่ต้องใช้ Webhook

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

อุโมงค์ ngrok ทำงานภายในคอนเทนเนอร์และให้ URL ของ Webhook สาธารณะโดยไม่เปิดเผยแอป Fly เอง ตั้งค่า `webhookSecurity.allowedHosts` เป็นชื่อโฮสต์อุโมงค์สาธารณะเพื่อให้ยอมรับส่วนหัวโฮสต์ที่ส่งต่อมา

### ประโยชน์ด้านความปลอดภัย

| ด้าน              | สาธารณะ      | ส่วนตัว     |
| ----------------- | ------------ | ---------- |
| ตัวสแกนอินเทอร์เน็ต | ค้นพบได้      | ซ่อนไว้     |
| การโจมตีโดยตรง    | เป็นไปได้     | ถูกบล็อก    |
| การเข้าถึง UI ควบคุม | เบราว์เซอร์   | Proxy/VPN  |
| การส่ง Webhook    | โดยตรง       | ผ่านอุโมงค์ |

## หมายเหตุ

- Fly.io ใช้ **สถาปัตยกรรม x86** (ไม่ใช่ ARM)
- Dockerfile เข้ากันได้กับทั้งสองสถาปัตยกรรม
- สำหรับการเริ่มใช้งาน WhatsApp/Telegram ให้ใช้ `fly ssh console`
- ข้อมูลถาวรอยู่ในวอลุ่มที่ `/data`
- Signal ต้องใช้ Java + signal-cli; ใช้อิมเมจแบบกำหนดเองและคงหน่วยความจำไว้ที่ 2GB ขึ้นไป

## ค่าใช้จ่าย

ด้วยการกำหนดค่าที่แนะนำ (`shared-cpu-2x`, RAM 2GB):

- ประมาณ $10-15/เดือน ขึ้นอยู่กับการใช้งาน
- แผนฟรีมีโควตาบางส่วนรวมอยู่ด้วย

ดูรายละเอียดได้ที่ [ราคาของ Fly.io](https://fly.io/docs/about/pricing/)

## ขั้นตอนถัดไป

- ตั้งค่าช่องทางการส่งข้อความ: [ช่องทาง](/th/channels)
- กำหนดค่า Gateway: [การกำหนดค่า Gateway](/th/gateway/configuration)
- ทำให้ OpenClaw เป็นเวอร์ชันล่าสุดอยู่เสมอ: [การอัปเดต](/th/install/updating)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Hetzner](/th/install/hetzner)
- [Docker](/th/install/docker)
- [โฮสติ้ง VPS](/th/vps)
