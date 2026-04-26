---
read_when:
    - การดีพลอย OpenClaw บน Fly.io
    - การตั้งค่า Fly volumes, secrets และ config สำหรับการรันครั้งแรก
summary: การดีพลอย OpenClaw บน Fly.io แบบทีละขั้นตอน พร้อมพื้นที่จัดเก็บแบบถาวรและ HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-26T11:34:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fe13cb60aff6ee2159e1008d2af660b689d819d38893e9758c23e1edaf32e22
    source_path: install/fly.md
    workflow: 15
---

# การดีพลอยบน Fly.io

**เป้าหมาย:** ให้ OpenClaw Gateway ทำงานบนเครื่อง [Fly.io](https://fly.io) พร้อมพื้นที่จัดเก็บแบบถาวร HTTPS อัตโนมัติ และการเข้าถึง Discord/ช่องทางต่าง ๆ

## สิ่งที่คุณต้องมี

- ติดตั้ง [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) แล้ว
- บัญชี Fly.io (free tier ก็ใช้ได้)
- auth ของโมเดล: API key สำหรับผู้ให้บริการโมเดลที่คุณเลือก
- credentials ของช่องทาง: Discord bot token, Telegram token ฯลฯ

## เส้นทางด่วนสำหรับผู้เริ่มต้น

1. โคลน repo → ปรับแต่ง `fly.toml`
2. สร้าง app + volume → ตั้งค่า secrets
3. ดีพลอยด้วย `fly deploy`
4. SSH เข้าไปสร้าง config หรือใช้ Control UI

<Steps>
  <Step title="สร้าง Fly app">
    ```bash
    # โคลน repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # สร้าง Fly app ใหม่ (ตั้งชื่อเอง)
    fly apps create my-openclaw

    # สร้าง persistent volume (ปกติ 1GB ก็พอ)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **เคล็ดลับ:** เลือก region ที่ใกล้คุณ ตัวเลือกที่พบบ่อย: `lhr` (ลอนดอน), `iad` (เวอร์จิเนีย), `sjc` (ซานโฮเซ)

  </Step>

  <Step title="กำหนดค่า fly.toml">
    แก้ไข `fly.toml` ให้ตรงกับชื่อ app และความต้องการของคุณ

    **หมายเหตุด้านความปลอดภัย:** config เริ่มต้นจะเปิดเผย URL สาธารณะ สำหรับการดีพลอยแบบ hardened ที่ไม่มี public IP ให้ดู [Private Deployment](#private-deployment-hardened) หรือใช้ `fly.private.toml`

    ```toml
    app = "my-openclaw"  # ชื่อ app ของคุณ
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

    **การตั้งค่าหลัก:**

    | Setting                        | เหตุผล |
    | ------------------------------ | ------ |
    | `--bind lan`                   | bind ไปที่ `0.0.0.0` เพื่อให้ proxy ของ Fly เข้าถึง gateway ได้ |
    | `--allow-unconfigured`         | เริ่มต้นได้แม้ยังไม่มีไฟล์ config (คุณจะสร้างภายหลัง) |
    | `internal_port = 3000`         | ต้องตรงกับ `--port 3000` (หรือ `OPENCLAW_GATEWAY_PORT`) สำหรับ health checks ของ Fly |
    | `memory = "2048mb"`            | 512MB น้อยเกินไป; แนะนำ 2GB |
    | `OPENCLAW_STATE_DIR = "/data"` | เก็บ state ไว้บน volume แบบถาวร |

  </Step>

  <Step title="ตั้งค่า secrets">
    ```bash
    # จำเป็น: Gateway token (สำหรับการ bind แบบ non-loopback)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # API keys ของผู้ให้บริการโมเดล
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # ไม่บังคับ: ผู้ให้บริการอื่น
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # tokens ของช่องทาง
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **หมายเหตุ:**

    - การ bind แบบ non-loopback (`--bind lan`) ต้องมีเส้นทาง gateway auth ที่ถูกต้อง ตัวอย่าง Fly.io นี้ใช้ `OPENCLAW_GATEWAY_TOKEN` แต่ `gateway.auth.password` หรือ deployment แบบ `trusted-proxy` ที่เป็น non-loopback และกำหนดค่าไว้อย่างถูกต้องก็ถือว่าใช้ได้เช่นกัน
    - ให้ปฏิบัติต่อโทเค็นเหล่านี้เหมือนรหัสผ่าน
    - **ควรใช้ env vars แทน config file** สำหรับ API keys และ tokens ทั้งหมด วิธีนี้ช่วยเก็บ secrets ไว้นอก `openclaw.json` เพื่อหลีกเลี่ยงการเปิดเผยหรือบันทึกลง log โดยไม่ตั้งใจ

  </Step>

  <Step title="ดีพลอย">
    ```bash
    fly deploy
    ```

    การดีพลอยครั้งแรกจะ build Docker image (~2-3 นาที) การดีพลอยครั้งต่อ ๆ ไปจะเร็วกว่า

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

  <Step title="สร้างไฟล์ config">
    SSH เข้าเครื่องเพื่อสร้าง config ที่ถูกต้อง:

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

    **หมายเหตุ:** เมื่อใช้ `OPENCLAW_STATE_DIR=/data` พาธ config จะเป็น `/data/openclaw.json`

    **หมายเหตุ:** ให้แทนที่ `https://my-openclaw.fly.dev` ด้วย origin
    Fly app จริงของคุณ Gateway startup จะ seed local Control UI origins จาก runtime
    `--bind` และ `--port` เพื่อให้บูตครั้งแรกดำเนินต่อได้ก่อนจะมี config แต่การเข้าถึงผ่านเบราว์เซอร์จาก Fly ยังคงต้องมี HTTPS origin ที่ตรงกันอยู่ใน
    `gateway.controlUi.allowedOrigins`

    **หมายเหตุ:** Discord token สามารถมาจากได้สองทาง:

    - Environment variable: `DISCORD_BOT_TOKEN` (แนะนำสำหรับ secrets)
    - Config file: `channels.discord.token`

    หากใช้ env var ก็ไม่จำเป็นต้องใส่ token ลงใน config gateway จะอ่าน `DISCORD_BOT_TOKEN` โดยอัตโนมัติ

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

    ยืนยันตัวตนด้วย shared secret ที่ตั้งค่าไว้ คู่มือนี้ใช้ gateway
    token จาก `OPENCLAW_GATEWAY_TOKEN`; หากคุณเปลี่ยนไปใช้ password auth ให้ใช้รหัสผ่านนั้นแทน

    ### Logs

    ```bash
    fly logs              # logs แบบสด
    fly logs --no-tail    # logs ล่าสุด
    ```

    ### SSH Console

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## การแก้ไขปัญหา

### "App is not listening on expected address"

gateway กำลัง bind ไปที่ `127.0.0.1` แทน `0.0.0.0`

**วิธีแก้:** เพิ่ม `--bind lan` ในคำสั่ง process ของคุณใน `fly.toml`

### Health checks ล้มเหลว / connection refused

Fly เข้าถึง gateway บนพอร์ตที่กำหนดไม่ได้

**วิธีแก้:** ตรวจสอบว่า `internal_port` ตรงกับพอร์ตของ gateway (ตั้ง `--port 3000` หรือ `OPENCLAW_GATEWAY_PORT=3000`)

### OOM / ปัญหาด้านหน่วยความจำ

Container รีสตาร์ตเองหรือถูก kill อยู่เรื่อย ๆ สัญญาณได้แก่ `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` หรือมีการรีสตาร์ตเงียบ ๆ

**วิธีแก้:** เพิ่มหน่วยความจำใน `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

หรืออัปเดตเครื่องที่มีอยู่:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**หมายเหตุ:** 512MB น้อยเกินไป 1GB อาจใช้ได้แต่มีโอกาส OOM ภายใต้โหลดหรือเมื่อเปิด log แบบละเอียด **แนะนำ 2GB**

### ปัญหา Gateway Lock

Gateway ปฏิเสธการเริ่มต้นพร้อมข้อผิดพลาดลักษณะ "already running"

ปัญหานี้เกิดเมื่อ container รีสตาร์ต แต่ไฟล์ PID lock ยังคงค้างอยู่บน volume

**วิธีแก้:** ลบไฟล์ lock:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

ไฟล์ lock อยู่ที่ `/data/gateway.*.lock` (ไม่ใช่ในไดเรกทอรีย่อย)

### Config ไม่ถูกอ่าน

`--allow-unconfigured` เพียงแค่ข้าม startup guard ไม่ได้สร้างหรือซ่อม `/data/openclaw.json` ดังนั้นต้องแน่ใจว่า config จริงของคุณมีอยู่และมี `gateway.mode="local"` เมื่อต้องการเริ่ม gateway แบบ local ตามปกติ

ตรวจสอบว่า config มีอยู่จริง:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### การเขียน Config ผ่าน SSH

คำสั่ง `fly ssh console -C` ไม่รองรับ shell redirection หากต้องการเขียนไฟล์ config:

```bash
# ใช้ echo + tee (pipe จากเครื่อง local ไปยัง remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# หรือใช้ sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**หมายเหตุ:** `fly sftp` อาจล้มเหลวหากไฟล์มีอยู่แล้ว ให้ลบก่อน:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### State ไม่คงอยู่

หากคุณสูญเสีย auth profiles, สถานะ channel/provider หรือ sessions หลังการรีสตาร์ต
แปลว่า state dir กำลังเขียนลงไปยัง filesystem ของ container

**วิธีแก้:** ตรวจสอบว่าได้ตั้ง `OPENCLAW_STATE_DIR=/data` ใน `fly.toml` แล้วและดีพลอยใหม่

## การอัปเดต

```bash
# ดึงการเปลี่ยนแปลงล่าสุด
git pull

# ดีพลอยใหม่
fly deploy

# ตรวจสอบสุขภาพ
fly status
fly logs
```

### การอัปเดตคำสั่งของเครื่อง

หากคุณต้องการเปลี่ยนคำสั่งเริ่มต้นโดยไม่ต้องดีพลอยใหม่เต็มรูปแบบ:

```bash
# ดู machine ID
fly machines list

# อัปเดตคำสั่ง
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# หรือพร้อมเพิ่มหน่วยความจำ
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**หมายเหตุ:** หลัง `fly deploy` คำสั่งของเครื่องอาจถูกรีเซ็ตกลับเป็นค่าที่อยู่ใน `fly.toml` หากคุณเปลี่ยนด้วยมือ ให้ apply ใหม่หลังดีพลอย

## การดีพลอยแบบ Private (Hardened)

โดยค่าเริ่มต้น Fly จะจัดสรร public IP ทำให้ gateway ของคุณเข้าถึงได้ที่ `https://your-app.fly.dev` ซึ่งสะดวก แต่ก็หมายความว่าการดีพลอยของคุณถูกค้นพบได้โดยอินเทอร์เน็ตสแกนเนอร์ (Shodan, Censys ฯลฯ)

สำหรับการดีพลอยแบบ hardened ที่ **ไม่เปิดเผยสู่สาธารณะเลย** ให้ใช้เทมเพลตแบบ private

### เมื่อใดควรใช้ private deployment

- คุณทำเฉพาะการเรียก/ส่งข้อความ **ขาออก** (ไม่มี inbound webhooks)
- คุณใช้ **ngrok หรือ Tailscale** tunnels สำหรับ webhook callbacks
- คุณเข้าถึง gateway ผ่าน **SSH, proxy หรือ WireGuard** แทนเบราว์เซอร์
- คุณต้องการให้การดีพลอย **ถูกซ่อนจากอินเทอร์เน็ตสแกนเนอร์**

### การตั้งค่า

ใช้ `fly.private.toml` แทน config มาตรฐาน:

```bash
# ดีพลอยด้วย config แบบ private
fly deploy -c fly.private.toml
```

หรือแปลงการดีพลอยที่มีอยู่แล้ว:

```bash
# แสดง IPs ปัจจุบัน
fly ips list -a my-openclaw

# ปล่อย public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# สลับไปใช้ config แบบ private เพื่อให้การดีพลอยในอนาคตไม่จัดสรร public IP ใหม่
# (ลบ [http_service] หรือดีพลอยด้วยเทมเพลตแบบ private)
fly deploy -c fly.private.toml

# จัดสรร private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

หลังจากนั้น `fly ips list` ควรแสดงเพียง IP แบบ `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### การเข้าถึง private deployment

เนื่องจากไม่มี URL สาธารณะ ให้ใช้หนึ่งในวิธีต่อไปนี้:

**ตัวเลือก 1: local proxy (ง่ายที่สุด)**

```bash
# ส่งต่อพอร์ต local 3000 ไปยัง app
fly proxy 3000:3000 -a my-openclaw

# จากนั้นเปิด http://localhost:3000 ในเบราว์เซอร์
```

**ตัวเลือก 2: WireGuard VPN**

```bash
# สร้าง WireGuard config (ครั้งเดียว)
fly wireguard create

# นำเข้าไปยังไคลเอนต์ WireGuard แล้วเข้าถึงผ่าน internal IPv6
# ตัวอย่าง: http://[fdaa:x:x:x:x::x]:3000
```

**ตัวเลือก 3: SSH เท่านั้น**

```bash
fly ssh console -a my-openclaw
```

### Webhooks กับ private deployment

หากคุณต้องการ webhook callbacks (Twilio, Telnyx ฯลฯ) โดยไม่เปิดเผยสู่สาธารณะ:

1. **ngrok tunnel** - รัน ngrok ภายใน container หรือเป็น sidecar
2. **Tailscale Funnel** - เปิดเผยเฉพาะบาง paths ผ่าน Tailscale
3. **ขาออกเท่านั้น** - ผู้ให้บริการบางราย (เช่น Twilio) ใช้งานสายขาออกได้ดีโดยไม่ต้องมี webhooks

ตัวอย่าง config ของ voice-call ที่ใช้ ngrok:

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

ngrok tunnel จะรันภายใน container และให้ public webhook URL โดยไม่ต้องเปิดเผย Fly app เอง ตั้งค่า `webhookSecurity.allowedHosts` เป็นชื่อโฮสต์ของ public tunnel เพื่อให้ระบบยอมรับ forwarded host headers

### ประโยชน์ด้านความปลอดภัย

| Aspect            | Public       | Private |
| ----------------- | ------------ | ------- |
| อินเทอร์เน็ตสแกนเนอร์ | ค้นพบได้ | ซ่อนอยู่ |
| การโจมตีโดยตรง    | เป็นไปได้     | ถูกบล็อก |
| การเข้าถึง Control UI | เบราว์เซอร์ | Proxy/VPN |
| การส่ง Webhook    | โดยตรง        | ผ่าน tunnel |

## หมายเหตุ

- Fly.io ใช้ **สถาปัตยกรรม x86** (ไม่ใช่ ARM)
- Dockerfile เข้ากันได้กับทั้งสองสถาปัตยกรรม
- สำหรับ onboarding ของ WhatsApp/Telegram ให้ใช้ `fly ssh console`
- ข้อมูลถาวรจะอยู่บน volume ที่ `/data`
- Signal ต้องใช้ Java + signal-cli; ให้ใช้ image แบบกำหนดเองและคงหน่วยความจำไว้ที่ 2GB ขึ้นไป

## ค่าใช้จ่าย

ด้วย config ที่แนะนำ (`shared-cpu-2x`, RAM 2GB):

- ประมาณ ~$10-15/เดือน ขึ้นอยู่กับการใช้งาน
- free tier มีโควตาให้บางส่วน

ดูรายละเอียดได้ที่ [Fly.io pricing](https://fly.io/docs/about/pricing/)

## ขั้นตอนถัดไป

- ตั้งค่าช่องทางส่งข้อความ: [Channels](/th/channels)
- กำหนดค่า Gateway: [การกำหนดค่า Gateway](/th/gateway/configuration)
- อัปเดต OpenClaw ให้เป็นปัจจุบัน: [Updating](/th/install/updating)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Hetzner](/th/install/hetzner)
- [Docker](/th/install/docker)
- [VPS hosting](/th/vps)
