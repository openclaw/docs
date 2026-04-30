---
read_when:
    - نشر OpenClaw على Fly.io
    - إعداد وحدات تخزين Fly والأسرار وتكوين التشغيل الأول
summary: نشر OpenClaw على Fly.io خطوة بخطوة مع تخزين دائم وHTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-30T08:07:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 195a77c4cec439dc2b5030f5ee618274df76b16d878b8d16e65a754e4bd8072c
    source_path: install/fly.md
    workflow: 16
---

# نشر Fly.io

**الهدف:** تشغيل OpenClaw Gateway على آلة [Fly.io](https://fly.io) مع تخزين دائم، وHTTPS تلقائي، ووصول Discord/القنوات.

## ما تحتاج إليه

- تثبيت [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- حساب Fly.io (تعمل الخطة المجانية)
- مصادقة النموذج: مفتاح API لموفر النموذج الذي اخترته
- بيانات اعتماد القنوات: رمز Discord bot، رمز Telegram، وما إلى ذلك.

## المسار السريع للمبتدئين

1. استنسخ المستودع ← خصص `fly.toml`
2. أنشئ التطبيق + وحدة التخزين ← عيّن الأسرار
3. انشر باستخدام `fly deploy`
4. ادخل عبر SSH لإنشاء الإعدادات أو استخدم Control UI

<Steps>
  <Step title="أنشئ تطبيق Fly">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **نصيحة:** اختر منطقة قريبة منك. من الخيارات الشائعة: `lhr` (لندن)، `iad` (فرجينيا)، `sjc` (سان خوسيه).

  </Step>

  <Step title="اضبط fly.toml">
    عدّل `fly.toml` ليطابق اسم تطبيقك ومتطلباتك.

    **ملاحظة أمنية:** تكشف الإعدادات الافتراضية عنوان URL عامًا. للحصول على نشر مشدد بلا IP عام، راجع [النشر الخاص](#private-deployment-hardened) أو استخدم `fly.private.toml`.

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

    **الإعدادات الأساسية:**

    | الإعداد                        | السبب                                                                         |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | يرتبط بـ `0.0.0.0` حتى يتمكن وكيل Fly من الوصول إلى Gateway                     |
    | `--allow-unconfigured`         | يبدأ بدون ملف إعدادات (ستنشئ واحدًا بعد ذلك)                      |
    | `internal_port = 3000`         | يجب أن يطابق `--port 3000` (أو `OPENCLAW_GATEWAY_PORT`) لفحوصات صحة Fly |
    | `memory = "2048mb"`            | 512MB صغيرة جدًا؛ يُوصى بـ 2GB                                         |
    | `OPENCLAW_STATE_DIR = "/data"` | يحافظ على الحالة داخل وحدة التخزين                                                |

  </Step>

  <Step title="عيّن الأسرار">
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

    **ملاحظات:**

    - تتطلب ارتباطات غير local loopback (`--bind lan`) مسار مصادقة Gateway صالحًا. يستخدم مثال Fly.io هذا `OPENCLAW_GATEWAY_TOKEN`، لكن `gateway.auth.password` أو نشر `trusted-proxy` غير local loopback مضبوط بشكل صحيح يفي بالمتطلب أيضًا.
    - تعامل مع هذه الرموز ككلمات مرور.
    - **فضّل متغيرات البيئة على ملف الإعدادات** لكل مفاتيح API والرموز. يحافظ ذلك على الأسرار خارج `openclaw.json` حيث قد تُكشف أو تُسجّل بالخطأ.

  </Step>

  <Step title="انشر">
    ```bash
    fly deploy
    ```

    ينشئ النشر الأول صورة Docker (نحو 2-3 دقائق). النشرات اللاحقة أسرع.

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

  <Step title="أنشئ ملف الإعدادات">
    ادخل إلى الآلة عبر SSH لإنشاء إعدادات مناسبة:

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

    **ملاحظة:** استبدل `https://my-openclaw.fly.dev` بمنشأ تطبيق Fly الحقيقي لديك. يزرع بدء تشغيل Gateway مناشئ Control UI المحلية من قيمتي وقت التشغيل `--bind` و`--port` حتى يمكن للتمهيد الأول المتابعة قبل وجود الإعدادات، لكن وصول المتصفح عبر Fly لا يزال يحتاج إلى منشأ HTTPS الدقيق المدرج في `gateway.controlUi.allowedOrigins`.

    **ملاحظة:** يمكن أن يأتي رمز Discord من أحد المصدرين:

    - متغير البيئة: `DISCORD_BOT_TOKEN` (موصى به للأسرار)
    - ملف الإعدادات: `channels.discord.token`

    عند استخدام متغير البيئة، لا حاجة لإضافة الرمز إلى الإعدادات. يقرأ Gateway `DISCORD_BOT_TOKEN` تلقائيًا.

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

    أو زُر `https://my-openclaw.fly.dev/`

    صادق باستخدام السر المشترك المضبوط. يستخدم هذا الدليل رمز Gateway من `OPENCLAW_GATEWAY_TOKEN`؛ إذا انتقلت إلى مصادقة كلمة المرور، فاستخدم تلك كلمة المرور بدلًا من ذلك.

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

### "التطبيق لا يستمع على العنوان المتوقع"

يرتبط Gateway بـ `127.0.0.1` بدلًا من `0.0.0.0`.

**الإصلاح:** أضف `--bind lan` إلى أمر العملية في `fly.toml`.

### فشل فحوصات الصحة / رُفض الاتصال

لا يستطيع Fly الوصول إلى Gateway على المنفذ المضبوط.

**الإصلاح:** تأكد من أن `internal_port` يطابق منفذ Gateway (عيّن `--port 3000` أو `OPENCLAW_GATEWAY_PORT=3000`).

### مشكلات OOM / الذاكرة

تستمر الحاوية في إعادة التشغيل أو تُقتل. العلامات: `SIGABRT` أو `v8::internal::Runtime_AllocateInYoungGeneration` أو عمليات إعادة تشغيل صامتة.

**الإصلاح:** زِد الذاكرة في `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

أو حدّث آلة موجودة:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**ملاحظة:** 512MB صغيرة جدًا. قد يعمل 1GB لكنه قد يتعرض لـ OOM تحت الحمل أو مع التسجيل المطوّل. **يُوصى بـ 2GB.**

### مشكلات قفل Gateway

يرفض Gateway البدء مع أخطاء "قيد التشغيل بالفعل".

يحدث ذلك عندما تُعاد الحاوية للتشغيل لكن ملف قفل PID يبقى موجودًا على وحدة التخزين.

**الإصلاح:** احذف ملف القفل:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

ملف القفل موجود في `/data/gateway.*.lock` (وليس في دليل فرعي).

### لا تتم قراءة الإعدادات

يتجاوز `--allow-unconfigured` حارس بدء التشغيل فقط. لا ينشئ أو يصلح `/data/openclaw.json`، لذا تأكد من وجود إعداداتك الحقيقية وأنها تتضمن `gateway.mode="local"` عندما تريد بدء Gateway محليًا عاديًا.

تحقق من وجود الإعدادات:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### كتابة الإعدادات عبر SSH

لا يدعم أمر `fly ssh console -C` إعادة توجيه الصدفة. لكتابة ملف إعدادات:

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

### الحالة لا تبقى محفوظة

إذا فقدت ملفات تعريف المصادقة، أو حالة القنوات/الموفرين، أو الجلسات بعد إعادة التشغيل، فهذا يعني أن دليل الحالة يكتب إلى نظام ملفات الحاوية.

**الإصلاح:** تأكد من تعيين `OPENCLAW_STATE_DIR=/data` في `fly.toml` وأعد النشر.

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

### تحديث أمر الآلة

إذا احتجت إلى تغيير أمر بدء التشغيل بدون إعادة نشر كاملة:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**ملاحظة:** بعد `fly deploy`، قد يُعاد تعيين أمر الآلة إلى ما هو موجود في `fly.toml`. إذا أجريت تغييرات يدوية، فأعد تطبيقها بعد النشر.

## النشر الخاص (مشدد)

افتراضيًا، يخصص Fly عناوين IP عامة، مما يجعل Gateway متاحًا على `https://your-app.fly.dev`. هذا ملائم، لكنه يعني أن نشرك قابل للاكتشاف بواسطة ماسحات الإنترنت (Shodan وCensys وما إلى ذلك).

للحصول على نشر مشدد **بلا تعرض عام**، استخدم القالب الخاص.

### متى تستخدم النشر الخاص

- تجري فقط مكالمات/رسائل **صادرة** (لا توجد Webhook واردة)
- تستخدم أنفاق **ngrok أو Tailscale** لأي استدعاءات Webhook راجعة
- تصل إلى Gateway عبر **SSH أو وكيل أو WireGuard** بدلًا من المتصفح
- تريد أن يكون النشر **مخفيًا عن ماسحات الإنترنت**

### الإعداد

استخدم `fly.private.toml` بدلًا من الإعدادات القياسية:

```bash
# Deploy with private config
fly deploy -c fly.private.toml
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
fly deploy -c fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

بعد ذلك، يجب أن يعرض `fly ips list` عنوان IP بنوع `private` فقط:

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

**الخيار 2: WireGuard VPN**

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

### عمليات Webhook مع نشر خاص

إذا كنت تحتاج إلى استدعاءات Webhook الراجعة (Twilio وTelnyx وما إلى ذلك) من دون تعريض عام:

1. **نفق ngrok** - شغّل ngrok داخل الحاوية أو كحاوية جانبية
2. **Tailscale Funnel** - اكشف مسارات محددة عبر Tailscale
3. **الصادر فقط** - يعمل بعض المزوّدين (Twilio) بشكل جيد للمكالمات الصادرة من دون Webhooks

مثال على إعداد مكالمة صوتية مع ngrok:

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

يعمل نفق ngrok داخل الحاوية ويوفر عنوان URL عاما لـ Webhook من دون كشف تطبيق Fly نفسه. عيّن `webhookSecurity.allowedHosts` إلى اسم مضيف النفق العام حتى يتم قبول ترويسات المضيف المعاد توجيهها.

### فوائد الأمان

| الجانب            | عام          | خاص        |
| ----------------- | ------------ | ---------- |
| ماسحات الإنترنت   | قابل للاكتشاف | مخفي       |
| الهجمات المباشرة  | ممكنة        | محظورة     |
| الوصول إلى واجهة التحكم | المتصفح | وكيل/VPN   |
| تسليم Webhook     | مباشر        | عبر نفق    |

## ملاحظات

- تستخدم Fly.io **بنية x86** (وليس ARM)
- ملف Dockerfile متوافق مع كلا المعماريتين
- لتهيئة WhatsApp/Telegram، استخدم `fly ssh console`
- توجد البيانات الدائمة على المجلد في `/data`
- يتطلب Signal Java + signal-cli؛ استخدم صورة مخصصة وأبقِ الذاكرة عند 2GB+.

## التكلفة

مع الإعداد الموصى به (`shared-cpu-2x`، ذاكرة RAM بسعة 2GB):

- حوالي 10-15 دولارًا شهريًا حسب الاستخدام
- تتضمن الطبقة المجانية بعض الحصة

راجع [أسعار Fly.io](https://fly.io/docs/about/pricing/) لمزيد من التفاصيل.

## الخطوات التالية

- إعداد قنوات المراسلة: [القنوات](/ar/channels)
- تكوين Gateway: [تكوين Gateway](/ar/gateway/configuration)
- إبقاء OpenClaw محدثًا: [التحديث](/ar/install/updating)

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Hetzner](/ar/install/hetzner)
- [Docker](/ar/install/docker)
- [استضافة VPS](/ar/vps)
