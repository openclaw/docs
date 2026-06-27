---
read_when:
    - نشر OpenClaw على Fly.io
    - إعداد وحدات تخزين Fly والأسرار وتهيئة التشغيل الأول
summary: نشر OpenClaw على Fly.io خطوة بخطوة مع تخزين دائم وHTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-06-27T17:50:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d74dbda6177ab279a59de720cf4e88a15aa90798e5f04e87712c99093282a1e
    source_path: install/fly.md
    workflow: 16
---

**الهدف:** تشغيل OpenClaw Gateway على جهاز [Fly.io](https://fly.io) مع تخزين دائم، وHTTPS تلقائي، ووصول Discord/القنوات.

## ما تحتاجه

- تثبيت [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- حساب Fly.io (تعمل الخطة المجانية)
- مصادقة النموذج: مفتاح API لمزوّد النموذج الذي تختاره
- بيانات اعتماد القناة: رمز بوت Discord، رمز Telegram، إلخ.

## المسار السريع للمبتدئين

1. استنسخ المستودع ← خصّص `fly.toml`
2. أنشئ التطبيق + وحدة التخزين ← اضبط الأسرار
3. انشر باستخدام `fly deploy`
4. ادخل عبر SSH لإنشاء الإعدادات أو استخدم واجهة Control UI

<Steps>
  <Step title="إنشاء تطبيق Fly">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **نصيحة:** اختر منطقة قريبة منك. خيارات شائعة: `lhr` (لندن)، `iad` (فيرجينيا)، `sjc` (سان خوسيه).

  </Step>

  <Step title="إعداد fly.toml">
    عدّل `fly.toml` ليطابق اسم تطبيقك ومتطلباتك.

    **ملاحظة أمان:** يكشف الإعداد الافتراضي عنوان URL عامًا. لنشر معزّز بلا IP عام، راجع [النشر الخاص](#private-deployment-hardened) أو استخدم `deploy/fly.private.toml`.

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

    تستخدم صورة Docker الخاصة بـ OpenClaw‏ `tini` كنقطة دخول. تستبدل أوامر عمليات Fly أمر Docker `CMD` من دون استبدال `ENTRYPOINT`، لذلك تبقى العملية عاملة تحت `tini`.

    **الإعدادات الأساسية:**

    | الإعداد                        | السبب                                                                         |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | يربط بـ `0.0.0.0` حتى يتمكن وكيل Fly من الوصول إلى Gateway                     |
    | `--allow-unconfigured`         | يبدأ من دون ملف إعدادات (ستنشئ واحدًا لاحقًا)                      |
    | `internal_port = 3000`         | يجب أن يطابق `--port 3000` (أو `OPENCLAW_GATEWAY_PORT`) لفحوصات صحة Fly |
    | `memory = "2048mb"`            | 512MB صغيرة جدًا؛ يوصى بـ 2GB                                         |
    | `OPENCLAW_STATE_DIR = "/data"` | يحفظ الحالة على وحدة التخزين                                                |

  </Step>

  <Step title="ضبط الأسرار">
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

    **ملاحظات:**

    - تتطلب عمليات الربط غير local loopback‏ (`--bind lan`) مسار مصادقة صالحًا لـ Gateway. يستخدم مثال Fly.io هذا `OPENCLAW_GATEWAY_TOKEN`، لكن `gateway.auth.password` أو نشر `trusted-proxy` غير local loopback والمُعد بشكل صحيح يفيان بالمتطلب أيضًا.
    - تعامل مع هذه الرموز مثل كلمات المرور.
    - **فضّل متغيرات البيئة على ملف الإعدادات** لجميع مفاتيح API والرموز. هذا يبقي الأسرار خارج `openclaw.json` حيث يمكن أن تُكشف أو تُسجّل بالخطأ.

  </Step>

  <Step title="النشر">
    ```bash
    fly deploy
    ```

    يبني أول نشر صورة Docker (نحو 2-3 دقائق). تكون عمليات النشر اللاحقة أسرع.

    بعد النشر، تحقق:

    ```bash
    fly status
    fly logs
    ```

    يجب أن ترى:

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="إنشاء ملف الإعدادات">
    ادخل إلى الجهاز عبر SSH لإنشاء إعدادات مناسبة:

    ```bash
    fly ssh console
    ```

    أنشئ دليل الإعدادات والملف:

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

    **ملاحظة:** مع `OPENCLAW_STATE_DIR=/data`، يكون مسار الإعدادات هو `/data/openclaw.json`.

    **ملاحظة:** استبدل `https://my-openclaw.fly.dev` بالأصل الحقيقي لتطبيق Fly لديك. يزرع بدء تشغيل Gateway أصول Control UI المحلية من قيم التشغيل `--bind` و`--port` حتى يمكن للإقلاع الأول المتابعة قبل وجود الإعدادات، لكن الوصول عبر المتصفح من خلال Fly لا يزال يحتاج إلى إدراج أصل HTTPS الدقيق في `gateway.controlUi.allowedOrigins`.

    **ملاحظة:** يمكن أن يأتي رمز Discord من أي من الآتي:

    - متغير البيئة: `DISCORD_BOT_TOKEN` (موصى به للأسرار)
    - ملف الإعدادات: `channels.discord.token`

    إذا كنت تستخدم متغير البيئة، فلا حاجة لإضافة الرمز إلى الإعدادات. يقرأ Gateway‏ `DISCORD_BOT_TOKEN` تلقائيًا.

    أعد التشغيل للتطبيق:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="الوصول إلى Gateway">
    ### Control UI

    افتح في المتصفح:

    ```bash
    fly open
    ```

    أو زر `https://my-openclaw.fly.dev/`

    صادِق باستخدام السر المشترك المُعد. يستخدم هذا الدليل رمز Gateway من `OPENCLAW_GATEWAY_TOKEN`؛ إذا تحولت إلى مصادقة كلمة المرور، فاستخدم تلك كلمة المرور بدلًا من ذلك.

    ### السجلات

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### وحدة تحكم SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## استكشاف الأخطاء وإصلاحها

### "App is not listening on expected address"

يرتبط Gateway بـ `127.0.0.1` بدلًا من `0.0.0.0`.

**الإصلاح:** أضف `--bind lan` إلى أمر العملية في `fly.toml`.

### فشل فحوصات الصحة / رفض الاتصال

لا يستطيع Fly الوصول إلى Gateway على المنفذ المُعد.

**الإصلاح:** تأكد من أن `internal_port` يطابق منفذ Gateway (اضبط `--port 3000` أو `OPENCLAW_GATEWAY_PORT=3000`).

### نفاد الذاكرة / مشكلات الذاكرة

تستمر الحاوية في إعادة التشغيل أو تتعرض للقتل. العلامات: `SIGABRT`، أو `v8::internal::Runtime_AllocateInYoungGeneration`، أو عمليات إعادة تشغيل صامتة.

**الإصلاح:** زد الذاكرة في `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

أو حدّث جهازًا موجودًا:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**ملاحظة:** 512MB صغيرة جدًا. قد تعمل 1GB لكنها قد تواجه نفادًا للذاكرة تحت الحمل أو مع التسجيل المطوّل. **يوصى بـ 2GB.**

### مشكلات قفل Gateway

يرفض Gateway البدء مع أخطاء "already running".

يحدث هذا عندما تعيد الحاوية التشغيل لكن ملف قفل PID يبقى على وحدة التخزين.

**الإصلاح:** احذف ملف القفل:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

يوجد ملف القفل في `/data/gateway.*.lock` (وليس في دليل فرعي).

### عدم قراءة الإعدادات

يتجاوز `--allow-unconfigured` حارس بدء التشغيل فقط. لا ينشئ أو يصلح `/data/openclaw.json`، لذلك تأكد من وجود إعداداتك الحقيقية وأنها تتضمن `gateway.mode="local"` عندما تريد بدء Gateway محلي عادي.

تحقق من وجود الإعدادات:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### كتابة الإعدادات عبر SSH

لا يدعم الأمر `fly ssh console -C` إعادة توجيه الصدفة. لكتابة ملف إعدادات:

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**ملاحظة:** قد يفشل `fly sftp` إذا كان الملف موجودًا بالفعل. احذفه أولًا:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### عدم استمرار الحالة

إذا فقدت ملفات تعريف المصادقة، أو حالة القناة/المزوّد، أو الجلسات بعد إعادة التشغيل، فإن دليل الحالة يكتب إلى نظام ملفات الحاوية.

**الإصلاح:** تأكد من ضبط `OPENCLAW_STATE_DIR=/data` في `fly.toml` وأعد النشر.

## التحديثات

```bash
# Pull latest changes
git pull

# Redeploy
fly deploy

# Check health
fly status
fly logs
```

### تحديث أمر الجهاز

إذا كنت بحاجة إلى تغيير أمر بدء التشغيل من دون إعادة نشر كاملة:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**ملاحظة:** بعد `fly deploy`، قد يُعاد ضبط أمر الجهاز إلى ما هو موجود في `fly.toml`. إذا أجريت تغييرات يدوية، فأعد تطبيقها بعد النشر.

## النشر الخاص (المعزّز)

افتراضيًا، يخصص Fly عناوين IP عامة، مما يجعل Gateway متاحًا على `https://your-app.fly.dev`. هذا مريح لكنه يعني أن نشرك قابل للاكتشاف بواسطة ماسحات الإنترنت (Shodan وCensys وغيرها).

لنشر معزّز **بلا تعرض عام**، استخدم القالب الخاص.

### متى تستخدم النشر الخاص

- تجري مكالمات/رسائل **صادرة** فقط (لا Webhook واردة)
- تستخدم أنفاق **ngrok أو Tailscale** لأي عمليات رد Webhook
- تصل إلى Gateway عبر **SSH أو وكيل أو WireGuard** بدلًا من المتصفح
- تريد أن يكون النشر **مخفيًا عن ماسحات الإنترنت**

### الإعداد

استخدم `deploy/fly.private.toml` بدلًا من الإعداد القياسي:

```bash
# Deploy with private config
fly deploy -c deploy/fly.private.toml
```

أو حوّل نشرًا موجودًا:

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

بعد ذلك، يجب أن يعرض `fly ips list` عنوان IP واحدًا فقط من النوع `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### الوصول إلى نشر خاص

بما أنه لا يوجد عنوان URL عام، استخدم إحدى هذه الطرق:

**الخيار 1: وكيل محلي (الأبسط)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**الخيار 2: شبكة WireGuard VPN**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**الخيار 3: SSH فقط**

```bash
fly ssh console -a my-openclaw
```

### Webhooks مع النشر الخاص

إذا كنت تحتاج إلى استدعاءات Webhook راجعة (Twilio، Telnyx، وما إلى ذلك) من دون تعريض عام:

1. **نفق ngrok** - شغّل ngrok داخل الحاوية أو كحاوية جانبية
2. **Tailscale Funnel** - عرّض مسارات محددة عبر Tailscale
3. **صادر فقط** - يعمل بعض المزوّدين (Twilio) بشكل جيد للمكالمات الصادرة من دون Webhooks

مثال على إعداد مكالمات صوتية باستخدام ngrok:

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

يعمل نفق ngrok داخل الحاوية ويوفّر عنوان URL عامًا للـ Webhook من دون تعريض تطبيق Fly نفسه. اضبط `webhookSecurity.allowedHosts` على اسم مضيف النفق العام حتى تُقبَل ترويسات المضيف المُمرَّرة.

### فوائد الأمان

| الجانب            | عام          | خاص        |
| ----------------- | ------------ | ---------- |
| أدوات فحص الإنترنت | قابل للاكتشاف | مخفي       |
| الهجمات المباشرة  | ممكنة        | محظورة     |
| الوصول إلى واجهة التحكم | متصفح        | وكيل/VPN   |
| تسليم Webhook     | مباشر        | عبر نفق    |

## ملاحظات

- يستخدم Fly.io **معمارية x86** (وليس ARM)
- ملف Dockerfile متوافق مع كلتا المعماريتين
- لإعداد WhatsApp/Telegram، استخدم `fly ssh console`
- تعيش البيانات الدائمة على وحدة التخزين في `/data`
- يتطلب Signal Java + signal-cli؛ استخدم صورة مخصصة وأبقِ الذاكرة عند 2GB+.

## التكلفة

مع الإعداد الموصى به (`shared-cpu-2x`، وذاكرة 2GB RAM):

- نحو 10-15 دولارًا أمريكيًا/شهرًا حسب الاستخدام
- تتضمن الطبقة المجانية قدرًا من الحصة

راجع [تسعير Fly.io](https://fly.io/docs/about/pricing/) للاطلاع على التفاصيل.

## الخطوات التالية

- إعداد قنوات المراسلة: [القنوات](/ar/channels)
- تهيئة Gateway: [تهيئة Gateway](/ar/gateway/configuration)
- إبقاء OpenClaw محدّثًا: [التحديث](/ar/install/updating)

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Hetzner](/ar/install/hetzner)
- [Docker](/ar/install/docker)
- [استضافة VPS](/ar/vps)
