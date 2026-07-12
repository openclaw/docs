---
read_when:
    - การปรับใช้ OpenClaw บน Fly.io
    - การตั้งค่าโวลุ่มของ Fly, ข้อมูลลับ และการกำหนดค่าสำหรับการเรียกใช้ครั้งแรก
summary: การปรับใช้ OpenClaw บน Fly.io แบบทีละขั้นตอน พร้อมพื้นที่จัดเก็บข้อมูลถาวรและ HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-12T16:15:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2cb4203cdea9db2fa76ed60de01da67d550a75d538895b06732446d0f70e2f4
    source_path: install/fly.md
    workflow: 16
---

**เป้าหมาย:** เรียกใช้ OpenClaw Gateway บนเครื่อง [Fly.io](https://fly.io) พร้อมพื้นที่จัดเก็บข้อมูลถาวร, HTTPS อัตโนมัติ และการเข้าถึง Discord/ช่องทาง

## สิ่งที่คุณต้องมี

- ติดตั้ง [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) แล้ว
- บัญชี Fly.io (แพ็กเกจฟรีใช้งานได้)
- การยืนยันตัวตนของโมเดล: คีย์ API สำหรับผู้ให้บริการโมเดลที่คุณเลือก
- ข้อมูลประจำตัวของช่องทาง: โทเค็นบอต Discord, โทเค็น Telegram เป็นต้น

## วิธีเริ่มต้นอย่างรวดเร็วสำหรับผู้เริ่มต้น

1. โคลนที่เก็บโค้ดและปรับแต่ง `fly.toml`
2. สร้างแอปและวอลุ่ม แล้วตั้งค่าข้อมูลลับ
3. ปรับใช้ด้วย `fly deploy`
4. เชื่อมต่อผ่าน SSH เพื่อสร้างการกำหนดค่า หรือใช้ส่วนติดต่อผู้ใช้สำหรับควบคุม

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

    เลือกภูมิภาคที่อยู่ใกล้คุณ ตัวเลือกที่ใช้กันทั่วไป ได้แก่ `lhr` (ลอนดอน), `iad` (เวอร์จิเนีย), `sjc` (ซานโฮเซ)

  </Step>

  <Step title="กำหนดค่า fly.toml">
    แก้ไข `fly.toml` ให้ตรงกับชื่อแอปและข้อกำหนดของคุณ ไฟล์ `fly.toml` ที่ติดตามอยู่ในที่เก็บโค้ดคือแม่แบบสาธารณะที่แสดงด้านล่าง ส่วน `deploy/fly.private.toml` เป็นรูปแบบที่เพิ่มความปลอดภัยและไม่มี IP สาธารณะ (ดู [การปรับใช้แบบส่วนตัว](#private-deployment-hardened))

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

    จุดเริ่มต้นของอิมเมจ Docker ของ OpenClaw คือ `tini` ซึ่งโดยค่าเริ่มต้นจะเรียกใช้ `node openclaw.mjs gateway` ส่วน `[processes]` ของ Fly จะแทนที่ `CMD` ของ Docker (ในที่นี้เรียกใช้ `node dist/index.js gateway ...` โดยตรง ซึ่งเป็นจุดเริ่มต้นที่คอมไพล์แล้วรายการเดียวกัน) โดยไม่แก้ไข `ENTRYPOINT` ดังนั้นกระบวนการจึงยังคงทำงานภายใต้ `tini`

    **การตั้งค่าที่สำคัญ:**

    | การตั้งค่า                     | เหตุผล                                                                                 |
    | ------------------------------ | -------------------------------------------------------------------------------------- |
    | `--bind lan`                   | ผูกกับ `0.0.0.0` เพื่อให้พร็อกซีของ Fly เข้าถึง Gateway ได้                            |
    | `--allow-unconfigured`         | เริ่มทำงานโดยไม่มีไฟล์การกำหนดค่า (คุณจะสร้างภายหลัง)                                  |
    | `internal_port = 3000`         | ต้องตรงกับ `--port 3000` (หรือ `OPENCLAW_GATEWAY_PORT`) สำหรับการตรวจสอบสถานะของ Fly |
    | `memory = "2048mb"`            | 512MB น้อยเกินไป แนะนำให้ใช้ 2GB                                                       |
    | `OPENCLAW_STATE_DIR = "/data"` | เก็บสถานะแบบถาวรไว้ในวอลุ่ม                                                           |

  </Step>

  <Step title="ตั้งค่าข้อมูลลับ">
    ```bash
    # จำเป็น: โทเค็นยืนยันตัวตนของ Gateway สำหรับการผูกแบบไม่ใช่ local loopback
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # คีย์ API ของผู้ให้บริการโมเดล
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # ไม่บังคับ: ผู้ให้บริการรายอื่น
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # โทเค็นของช่องทาง
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    การผูกแบบไม่ใช่ local loopback (`--bind lan`) ต้องมีช่องทางยืนยันตัวตนของ Gateway ที่ถูกต้อง ตัวอย่างนี้ใช้ `OPENCLAW_GATEWAY_TOKEN` แต่ `gateway.auth.password` หรือการปรับใช้พร็อกซีที่เชื่อถือได้แบบไม่ใช่ local loopback ซึ่งกำหนดค่าอย่างถูกต้องก็เป็นไปตามข้อกำหนดเช่นกัน ดูสัญญา SecretRef ที่ [การจัดการข้อมูลลับ](/th/gateway/secrets)

    จัดการโทเค็นเหล่านี้เช่นเดียวกับรหัสผ่าน สำหรับคีย์ API และโทเค็น ควรใช้ตัวแปรสภาพแวดล้อม/`fly secrets` แทนไฟล์การกำหนดค่า เพื่อไม่ให้ข้อมูลลับอยู่ใน `openclaw.json`

  </Step>

  <Step title="ปรับใช้">
    ```bash
    fly deploy
    ```

    การปรับใช้ครั้งแรกจะสร้างอิมเมจ Docker หลังปรับใช้แล้วให้ตรวจสอบดังนี้:

    ```bash
    fly status
    fly logs
    ```

    บันทึกการเริ่มต้นของ Gateway จะแสดง `gateway ready` เมื่อตัวรับฟัง HTTP/WebSocket พร้อมทำงาน การตรวจสอบสถานะของ Fly จะเฝ้าดู `internal_port = 3000` ตาม `fly.toml` ส่วนคำสั่ง `HEALTHCHECK` ของ Docker ในอิมเมจจะสำรวจ `/healthz` เพิ่มเติมบนพอร์ตเริ่มต้น 18789 ซึ่งไม่ได้ใช้ในที่นี้ เนื่องจากการปรับใช้นี้กำหนดให้ Gateway ใช้ `--port 3000`

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

    เมื่อใช้ `OPENCLAW_STATE_DIR=/data` พาธของการกำหนดค่าคือ `/data/openclaw.json`

    แทนที่ `https://my-openclaw.fly.dev` ด้วยต้นทางจริงของแอป Fly ของคุณ ระหว่างเริ่มต้น Gateway ระบบจะเพิ่มต้นทางของส่วนติดต่อผู้ใช้สำหรับควบคุมในเครื่องจากค่า `--bind` และ `--port` ขณะทำงาน เพื่อให้การเริ่มต้นครั้งแรกดำเนินต่อได้ก่อนมีการกำหนดค่า แต่การเข้าถึงผ่านเบราว์เซอร์โดยผ่าน Fly ยังคงต้องระบุต้นทาง HTTPS ที่ตรงกันทุกประการใน `gateway.controlUi.allowedOrigins`

    โทเค็น Discord สามารถมาจากแหล่งใดแหล่งหนึ่งต่อไปนี้:

    - ตัวแปรสภาพแวดล้อม `DISCORD_BOT_TOKEN` (แนะนำสำหรับข้อมูลลับ) ไม่จำเป็นต้องเพิ่มลงในการกำหนดค่า เพราะ Gateway จะอ่านโดยอัตโนมัติ
    - ไฟล์การกำหนดค่า `channels.discord.token`

    เริ่มระบบใหม่เพื่อใช้การเปลี่ยนแปลง:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="เข้าถึง Gateway">
    ### ส่วนติดต่อผู้ใช้สำหรับควบคุม

    ```bash
    fly open
    ```

    หรือไปที่ `https://my-openclaw.fly.dev/`

    ยืนยันตัวตนด้วยข้อมูลลับที่ใช้ร่วมกันซึ่งกำหนดไว้ ได้แก่ โทเค็น Gateway จาก `OPENCLAW_GATEWAY_TOKEN` หรือรหัสผ่านของคุณหากเปลี่ยนไปใช้การยืนยันตัวตนด้วยรหัสผ่าน

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

**วิธีแก้:** เพิ่ม `--bind lan` ลงในคำสั่งกระบวนการของคุณใน `fly.toml`

### การตรวจสอบสถานะล้มเหลว / การเชื่อมต่อถูกปฏิเสธ

Fly ไม่สามารถเข้าถึง Gateway บนพอร์ตที่กำหนดค่าไว้

**วิธีแก้:** ตรวจสอบให้แน่ใจว่า `internal_port` ตรงกับพอร์ตของ Gateway (`--port 3000` หรือ `OPENCLAW_GATEWAY_PORT=3000`)

### ปัญหา OOM / หน่วยความจำ

คอนเทนเนอร์เริ่มระบบใหม่ซ้ำ ๆ หรือถูกยุติ สัญญาณที่พบ ได้แก่ `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` หรือการเริ่มระบบใหม่โดยไม่มีข้อความแจ้ง

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

### ปัญหาไฟล์ล็อกของ Gateway

Gateway ปฏิเสธการเริ่มทำงานพร้อมข้อผิดพลาด "กำลังทำงานอยู่แล้ว" หลังคอนเทนเนอร์เริ่มระบบใหม่

ไฟล์ล็อกสำหรับอินสแตนซ์เดียวอยู่ที่ `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock` (Linux: `/tmp/openclaw-<uid>/gateway.<hash>.lock`) ไม่ได้อยู่ในวอลุ่มถาวร `/data` ดังนั้นโดยปกติการเริ่มคอนเทนเนอร์ใหม่ทั้งหมดจะล้างไฟล์นี้พร้อมกับระบบไฟล์ส่วนที่เหลือของคอนเทนเนอร์ หากไฟล์ล็อกยังคงอยู่ (ตัวอย่างเช่น `fly machine restart` ที่รักษาระบบไฟล์ของคอนเทนเนอร์ไว้) และขัดขวางการเริ่มทำงาน ให้ลบด้วยตนเอง:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### ระบบไม่อ่านการกำหนดค่า

`--allow-unconfigured` จะข้ามเฉพาะตัวป้องกันระหว่างเริ่มต้นเท่านั้น โดยจะไม่สร้างหรือซ่อมแซม `/data/openclaw.json` ดังนั้นตรวจสอบให้แน่ใจว่าการกำหนดค่าจริงของคุณมีอยู่ และมี `"gateway": { "mode": "local" }` สำหรับการเริ่มต้น Gateway ในเครื่องตามปกติ

ตรวจสอบว่าการกำหนดค่ามีอยู่:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### การเขียนการกำหนดค่าผ่าน SSH

`fly ssh console -C` ไม่รองรับการเปลี่ยนทิศทางเอาต์พุตของเชลล์ หากต้องการเขียนไฟล์การกำหนดค่า:

```bash
# echo + tee (ส่งผ่านไปป์จากเครื่องภายในไปยังเครื่องระยะไกล)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# หรือใช้ sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

`fly sftp` อาจล้มเหลวหากมีไฟล์อยู่แล้ว ให้ลบไฟล์ก่อน:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### สถานะไม่ถูกเก็บไว้อย่างถาวร

หากโปรไฟล์การยืนยันตัวตน สถานะของช่องทาง/ผู้ให้บริการ หรือเซสชันสูญหายหลังเริ่มระบบใหม่ แสดงว่าไดเรกทอรีสถานะกำลังเขียนลงในระบบไฟล์ของคอนเทนเนอร์แทนวอลุ่ม

**วิธีแก้:** ตรวจสอบให้แน่ใจว่าได้ตั้งค่า `OPENCLAW_STATE_DIR=/data` ใน `fly.toml` แล้วปรับใช้อีกครั้ง

## การอัปเดต

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` คือวิธีดำเนินการภายใต้การควบคุมในที่นี้ โดยจะสร้างอิมเมจใหม่จาก Dockerfile ดังนั้นเวอร์ชัน CLI/Gateway, อิมเมจระบบปฏิบัติการพื้นฐาน และการเปลี่ยนแปลงใด ๆ ใน Dockerfile จะอัปเดตพร้อมกันทั้งหมด การใช้ `openclaw update` ภายในคอนเทนเนอร์ที่กำลังทำงานไม่ใช่การดำเนินการเดียวกัน เนื่องจากอิมเมจจัดส่งเป็นโครงสร้าง `dist/` ที่สร้างด้วย Docker โดยไม่มีการเช็กเอาต์ `.git` และไม่มีการติดตั้งส่วนกลางที่จัดการโดย npm ให้ตรวจพบ ดูขั้นตอนดังกล่าวสำหรับการติดตั้งแบบ VM ได้ที่ [การอัปเดต](/th/install/updating)

### การอัปเดตคำสั่งของเครื่อง

หากต้องการเปลี่ยนคำสั่งเริ่มต้นโดยไม่ต้องปรับใช้ใหม่ทั้งหมด:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# หรือเพิ่มหน่วยความจำด้วย
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

การเรียกใช้ `fly deploy` ในภายหลังจะรีเซ็ตคำสั่งของเครื่องกลับเป็นค่าที่อยู่ใน `fly.toml` ให้ใช้การเปลี่ยนแปลงด้วยตนเองอีกครั้งหลังปรับใช้ใหม่

## การปรับใช้แบบส่วนตัว (เพิ่มความปลอดภัย)

โดยค่าเริ่มต้น Fly จะจัดสรร IP สาธารณะ ดังนั้น Gateway ของคุณจึงเข้าถึงได้ที่ `https://your-app.fly.dev` และเครื่องมือสแกนอินเทอร์เน็ต (Shodan, Censys เป็นต้น) สามารถค้นพบได้

ใช้ `deploy/fly.private.toml` สำหรับการปรับใช้ที่เพิ่มความปลอดภัยโดย **ไม่มี IP สาธารณะ** ซึ่งจะไม่รวม `[http_service]` จึงไม่มีการจัดสรรการรับส่งข้อมูลขาเข้าสาธารณะ

### เมื่อใดควรใช้การปรับใช้แบบส่วนตัว

- มีเฉพาะการเรียก/ข้อความขาออก (ไม่มี Webhook ขาเข้า)
- ทันเนล ngrok หรือ Tailscale จัดการการเรียกกลับของ Webhook
- เข้าถึง Gateway ผ่าน SSH, พร็อกซี หรือ WireGuard แทนเบราว์เซอร์
- ต้องการซ่อนการปรับใช้จากเครื่องมือสแกนอินเทอร์เน็ต

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

# เปลี่ยนไปใช้การกำหนดค่าแบบส่วนตัว เพื่อไม่ให้การปรับใช้ในอนาคตจัดสรร IP สาธารณะอีก
fly deploy -c deploy/fly.private.toml

# จัดสรร IPv6 แบบส่วนตัวเท่านั้น
fly ips allocate-v6 --private -a my-openclaw
```

หลังจากนี้ `fly ips list` ควรแสดงเฉพาะ IP ประเภท `private`:

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

**ตัวเลือกที่ 2: VPN แบบ WireGuard**

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

สำหรับการเรียกกลับของ Webhook (Twilio, Telnyx เป็นต้น) โดยไม่เปิดเผยต่อสาธารณะ:

1. **อุโมงค์ ngrok**: เรียกใช้ ngrok ภายในคอนเทนเนอร์หรือเป็นไซด์คาร์
2. **Tailscale Funnel**: เปิดเผยเฉพาะพาธที่กำหนดผ่าน Tailscale
3. **ขาออกเท่านั้น**: ผู้ให้บริการบางราย (Twilio) รองรับการโทรขาออกโดยไม่ต้องใช้ Webhook

ตัวอย่างการกำหนดค่าการโทรด้วยเสียงด้วย ngrok ภายใต้ `plugins.entries.voice-call.config`:

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

อุโมงค์ ngrok ทำงานภายในคอนเทนเนอร์และให้ URL ของ Webhook สาธารณะโดยไม่เปิดเผยตัวแอป Fly เอง ตั้งค่า `webhookSecurity.allowedHosts` เป็นชื่อโฮสต์ของอุโมงค์ เพื่อให้ยอมรับส่วนหัวโฮสต์ที่ส่งต่อมา

### ข้อแลกเปลี่ยนด้านความปลอดภัย

| ด้าน                       | สาธารณะ         | ส่วนตัว          |
| -------------------------- | ---------------- | ---------------- |
| เครื่องสแกนจากอินเทอร์เน็ต | ค้นพบได้         | ซ่อนไว้           |
| การโจมตีโดยตรง             | เป็นไปได้        | ถูกปิดกั้น        |
| การเข้าถึง UI ควบคุม       | เบราว์เซอร์      | พร็อกซี/VPN       |
| การส่ง Webhook             | โดยตรง           | ผ่านอุโมงค์       |

## หมายเหตุ

- Fly.io ใช้สถาปัตยกรรม x86 โดย Dockerfile รองรับทั้ง x86 และ ARM
- สำหรับการเริ่มต้นใช้งาน WhatsApp/Telegram ให้ใช้ `fly ssh console`
- ข้อมูลถาวรอยู่ในโวลุ่มที่ `/data`
- Signal ต้องใช้ signal-cli (CLI ที่ทำงานบน Java) ในอิมเมจ ให้ใช้อิมเมจแบบกำหนดเองและจัดสรรหน่วยความจำอย่างน้อย 2GB

## ค่าใช้จ่าย

เมื่อใช้การกำหนดค่าที่แนะนำ (`shared-cpu-2x`, RAM 2GB) ค่าใช้จ่ายจะอยู่ที่ประมาณ $10-15 ต่อเดือน ขึ้นอยู่กับการใช้งาน โดยแพ็กเกจฟรีครอบคลุมโควตาพื้นฐานบางส่วน ดูอัตราปัจจุบันได้ที่ [ราคาของ Fly.io](https://fly.io/docs/about/pricing/)

## ขั้นตอนถัดไป

- ตั้งค่าช่องทางการรับส่งข้อความ: [ช่องทาง](/th/channels)
- กำหนดค่า Gateway: [การกำหนดค่า Gateway](/th/gateway/configuration)
- อัปเดต OpenClaw ให้เป็นเวอร์ชันล่าสุดเสมอ: [การอัปเดต](/th/install/updating)

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Hetzner](/th/install/hetzner)
- [Docker](/th/install/docker)
- [การโฮสต์บน VPS](/th/vps)
