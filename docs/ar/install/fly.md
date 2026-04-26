---
read_when:
    - نشر OpenClaw على Fly.io
    - Setting up Fly volumes, secrets, and first-run config
summary: نشر OpenClaw على Fly.io خطوة بخطوة مع تخزين دائم وHTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-26T11:33:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fe13cb60aff6ee2159e1008d2af660b689d819d38893e9758c23e1edaf32e22
    source_path: install/fly.md
    workflow: 15
---

# نشر Fly.io

**الهدف:** تشغيل OpenClaw Gateway على جهاز [Fly.io](https://fly.io) مع تخزين دائم، وHTTPS تلقائي، ووصول Discord/القنوات.

## ما تحتاج إليه

- تثبيت [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- حساب Fly.io (تعمل الطبقة المجانية)
- مصادقة النموذج: مفتاح API لموفر النموذج الذي اخترته
- بيانات اعتماد القناة: Discord bot token، وTelegram token، وغير ذلك

## المسار السريع للمبتدئين

1. استنسخ المستودع ← خصص `fly.toml`
2. أنشئ التطبيق + وحدة التخزين ← اضبط الأسرار
3. انشر باستخدام `fly deploy`
4. ادخل عبر SSH لإنشاء الإعداد أو استخدم Control UI

<Steps>
  <Step title="أنشئ تطبيق Fly">
    ```bash
    # استنسخ المستودع
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # أنشئ تطبيق Fly جديدًا (اختر اسمك الخاص)
    fly apps create my-openclaw

    # أنشئ وحدة تخزين دائمة (عادةً ما يكون 1GB كافيًا)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **نصيحة:** اختر منطقة قريبة منك. من الخيارات الشائعة: `lhr` (لندن)، و`iad` (فيرجينيا)، و`sjc` (سان خوسيه).

  </Step>

  <Step title="اضبط fly.toml">
    عدّل `fly.toml` ليتوافق مع اسم تطبيقك ومتطلباتك.

    **ملاحظة أمنية:** يعرّض الإعداد الافتراضي عنوان URL عامًا. وللنشر المقوّى بدون عنوان IP عام، راجع [النشر الخاص](#private-deployment-hardened) أو استخدم `fly.private.toml`.

    ```toml
    app = "my-openclaw"  # اسم تطبيقك
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

    | الإعداد                        | السبب                                                                      |
    | ------------------------------ | -------------------------------------------------------------------------- |
    | `--bind lan`                   | يربط إلى `0.0.0.0` حتى يتمكن Proxy الخاص بـ Fly من الوصول إلى gateway      |
    | `--allow-unconfigured`         | يبدأ بدون ملف إعداد (ستنشئه بعد ذلك)                                       |
    | `internal_port = 3000`         | يجب أن يطابق `--port 3000` (أو `OPENCLAW_GATEWAY_PORT`) لفحوصات سلامة Fly |
    | `memory = "2048mb"`            | 512MB صغيرة جدًا؛ يوصى بـ 2GB                                              |
    | `OPENCLAW_STATE_DIR = "/data"` | يحفظ الحالة على وحدة التخزين                                               |

  </Step>

  <Step title="اضبط الأسرار">
    ```bash
    # مطلوب: Gateway token (للربط غير loopback)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # مفاتيح API لموفر النموذج
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # اختياري: موفرون آخرون
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # رموز القنوات
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **ملاحظات:**

    - تتطلب عمليات الربط غير loopback (`--bind lan`) مسار مصادقة صالحًا لـ gateway. يستخدم مثال Fly.io هذا `OPENCLAW_GATEWAY_TOKEN`، لكن `gateway.auth.password` أو نشر `trusted-proxy` غير loopback مضبوطًا بشكل صحيح يلبّيان المتطلب أيضًا.
    - تعامل مع هذه الرموز كما لو كانت كلمات مرور.
    - **فضّل متغيرات البيئة على ملف الإعداد** لجميع مفاتيح API والرموز. فهذا يُبقي الأسرار خارج `openclaw.json` حيث يمكن كشفها أو تسجيلها بالخطأ.

  </Step>

  <Step title="انشر">
    ```bash
    fly deploy
    ```

    يبني أول نشر صورة Docker (حوالي 2-3 دقائق). وتكون عمليات النشر اللاحقة أسرع.

    بعد النشر، تحقّق باستخدام:

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

  <Step title="أنشئ ملف الإعداد">
    ادخل عبر SSH إلى الجهاز لإنشاء إعداد صحيح:

    ```bash
    fly ssh console
    ```

    أنشئ دليل الإعداد والملف:

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

    **ملاحظة:** مع `OPENCLAW_STATE_DIR=/data`، يكون مسار الإعداد هو `/data/openclaw.json`.

    **ملاحظة:** استبدل `https://my-openclaw.fly.dev` بعنوان
    الأصل الحقيقي لتطبيق Fly الخاص بك. يزرع بدء تشغيل Gateway أصول Control UI المحلية من قيم
    `--bind` و`--port` في وقت التشغيل بحيث يمكن أن يستمر الإقلاع الأول قبل وجود الإعداد،
    لكن الوصول من المتصفح عبر Fly لا يزال يحتاج إلى إدراج أصل HTTPS الدقيق في
    `gateway.controlUi.allowedOrigins`.

    **ملاحظة:** يمكن أن يأتي Discord token من أحد المصدرين التاليين:

    - متغير البيئة: `DISCORD_BOT_TOKEN` (موصى به للأسرار)
    - ملف الإعداد: `channels.discord.token`

    إذا كنت تستخدم متغير البيئة، فلا حاجة لإضافة الرمز إلى الإعداد. تقرأ gateway القيمة `DISCORD_BOT_TOKEN` تلقائيًا.

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

    صادِق باستخدام السر المشترك المضبوط. يستخدم هذا الدليل
    gateway token من `OPENCLAW_GATEWAY_TOKEN`؛ وإذا انتقلت إلى
    مصادقة كلمة المرور، فاستخدم تلك الكلمة بدلًا منه.

    ### السجلات

    ```bash
    fly logs              # سجلات مباشرة
    fly logs --no-tail    # السجلات الحديثة
    ```

    ### وحدة SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## استكشاف الأخطاء وإصلاحها

### "App is not listening on expected address"

تربط gateway إلى `127.0.0.1` بدلًا من `0.0.0.0`.

**الإصلاح:** أضف `--bind lan` إلى أمر العملية في `fly.toml`.

### فشل فحوصات السلامة / رفض الاتصال

لا يستطيع Fly الوصول إلى gateway على المنفذ المضبوط.

**الإصلاح:** تأكد من أن `internal_port` يطابق منفذ gateway (اضبط `--port 3000` أو `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / مشكلات الذاكرة

تستمر الحاوية في إعادة التشغيل أو تُقتل. العلامات: `SIGABRT`، أو `v8::internal::Runtime_AllocateInYoungGeneration`، أو إعادة تشغيل صامتة.

**الإصلاح:** زِد الذاكرة في `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

أو حدّث جهازًا موجودًا:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**ملاحظة:** 512MB صغيرة جدًا. وقد تعمل 1GB لكنها قد تتعرض لـ OOM تحت الحمل أو مع التسجيل المفصل. **يوصى بـ 2GB.**

### مشكلات قفل Gateway

ترفض Gateway البدء مع أخطاء من نوع "already running".

يحدث هذا عندما تُعاد الحاوية للتشغيل لكن يبقى ملف قفل PID على وحدة التخزين.

**الإصلاح:** احذف ملف القفل:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

يوجد ملف القفل في `/data/gateway.*.lock` (وليس في دليل فرعي).

### عدم قراءة الإعداد

يتجاوز `--allow-unconfigured` حارس بدء التشغيل فقط. وهو لا ينشئ أو يصلح `/data/openclaw.json`، لذا تأكد من وجود إعدادك الفعلي وأنه يتضمن `gateway.mode="local"` عندما تريد بدء gateway محلية عاديًا.

تحقق من وجود الإعداد:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### كتابة الإعداد عبر SSH

لا يدعم الأمر `fly ssh console -C` إعادة توجيه shell. ولكتابة ملف إعداد:

```bash
# استخدم echo + tee (مرّر من المحلي إلى البعيد)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# أو استخدم sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**ملاحظة:** قد يفشل `fly sftp` إذا كان الملف موجودًا بالفعل. احذفه أولًا:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### عدم حفظ الحالة

إذا فقدت ملفات auth profiles، أو حالة القناة/الموفّر، أو الجلسات بعد إعادة التشغيل،
فإن دليل الحالة يكتب إلى نظام ملفات الحاوية.

**الإصلاح:** تأكد من ضبط `OPENCLAW_STATE_DIR=/data` في `fly.toml` ثم أعد النشر.

## التحديثات

```bash
# اسحب آخر التغييرات
git pull

# أعد النشر
fly deploy

# تحقق من السلامة
fly status
fly logs
```

### تحديث أمر الجهاز

إذا كنت بحاجة إلى تغيير أمر بدء التشغيل دون إعادة نشر كاملة:

```bash
# احصل على معرّف الجهاز
fly machines list

# حدّث الأمر
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# أو مع زيادة الذاكرة
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**ملاحظة:** بعد `fly deploy`، قد يُعاد تعيين أمر الجهاز إلى ما هو موجود في `fly.toml`. إذا أجريت تغييرات يدوية، فأعد تطبيقها بعد النشر.

## النشر الخاص (مقوّى)

افتراضيًا، يخصص Fly عناوين IP عامة، مما يجعل gateway الخاصة بك متاحة على `https://your-app.fly.dev`. وهذا مناسب، لكنه يعني أن نشرَك قابل للاكتشاف بواسطة ماسحات الإنترنت (Shodan وCensys وغيرهما).

ولنشر مقوّى **بدون أي تعرض عام**، استخدم القالب الخاص.

### متى تستخدم النشر الخاص

- عندما تجري اتصالات **صادرة** فقط/ترسل رسائل فقط (ولا توجد Webhooks واردة)
- عندما تستخدم **ngrok أو Tailscale** لأي نداءات Webhook راجعة
- عندما تصل إلى gateway عبر **SSH، أو Proxy، أو WireGuard** بدلًا من المتصفح
- عندما تريد أن يكون النشر **مخفيًا عن ماسحات الإنترنت**

### الإعداد

استخدم `fly.private.toml` بدلًا من الإعداد القياسي:

```bash
# انشر باستخدام الإعداد الخاص
fly deploy -c fly.private.toml
```

أو حوّل نشرًا موجودًا:

```bash
# اعرض عناوين IP الحالية
fly ips list -a my-openclaw

# حرر عناوين IP العامة
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# انتقل إلى الإعداد الخاص حتى لا تعيد عمليات النشر المستقبلية تخصيص عناوين IP عامة
# (أزل [http_service] أو انشر باستخدام القالب الخاص)
fly deploy -c fly.private.toml

# خصص IPv6 خاصًا فقط
fly ips allocate-v6 --private -a my-openclaw
```

بعد ذلك، يجب أن يُظهر `fly ips list` عنوان IP من النوع `private` فقط:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### الوصول إلى نشر خاص

بما أنه لا يوجد عنوان URL عام، فاستخدم إحدى الطرق التالية:

**الخيار 1: Proxy محلي (الأبسط)**

```bash
# مرّر المنفذ المحلي 3000 إلى التطبيق
fly proxy 3000:3000 -a my-openclaw

# ثم افتح http://localhost:3000 في المتصفح
```

**الخيار 2: VPN عبر WireGuard**

```bash
# أنشئ إعداد WireGuard (مرة واحدة)
fly wireguard create

# استورده إلى عميل WireGuard، ثم ادخل عبر IPv6 الداخلي
# مثال: http://[fdaa:x:x:x:x::x]:3000
```

**الخيار 3: SSH فقط**

```bash
fly ssh console -a my-openclaw
```

### Webhooks مع النشر الخاص

إذا كنت تحتاج إلى نداءات Webhook راجعة (Twilio، وTelnyx، وغيرهما) من دون تعرّض عام:

1. **نفق ngrok** - شغّل ngrok داخل الحاوية أو كحاوية جانبية
2. **Tailscale Funnel** - عرّض مسارات محددة عبر Tailscale
3. **صادر فقط** - يعمل بعض الموفّرين (مثل Twilio) بشكل جيد للمكالمات الصادرة من دون Webhooks

مثال على إعداد voice-call مع ngrok:

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

يعمل نفق ngrok داخل الحاوية ويوفّر عنوان URL عامًا لـ Webhook من دون تعريض تطبيق Fly نفسه. اضبط `webhookSecurity.allowedHosts` على اسم مضيف النفق العام حتى يتم قبول رؤوس المضيف المُمرّرة.

### الفوائد الأمنية

| الجانب             | عام          | خاص        |
| ------------------ | ------------ | ---------- |
| ماسحات الإنترنت    | قابل للاكتشاف | مخفي       |
| الهجمات المباشرة   | ممكنة        | محجوبة     |
| وصول Control UI    | المتصفح      | Proxy/VPN  |
| تسليم Webhook      | مباشر        | عبر نفق    |

## ملاحظات

- يستخدم Fly.io **بنية x86** (وليس ARM)
- ملف Dockerfile متوافق مع كلتا البنيتين
- لإعداد WhatsApp/Telegram الأولي، استخدم `fly ssh console`
- توجد البيانات الدائمة على وحدة التخزين في `/data`
- يتطلب Signal وجود Java + signal-cli؛ استخدم صورة مخصصة وأبقِ الذاكرة عند 2GB أو أكثر.

## التكلفة

مع الإعداد الموصى به (`shared-cpu-2x`، وذاكرة RAM بحجم 2GB):

- نحو 10-15 دولارًا شهريًا حسب الاستخدام
- تتضمن الطبقة المجانية قدرًا معينًا من الاستخدام

راجع [تسعير Fly.io](https://fly.io/docs/about/pricing/) للتفاصيل.

## الخطوات التالية

- اضبط قنوات المراسلة: [القنوات](/ar/channels)
- اضبط Gateway: [إعداد Gateway](/ar/gateway/configuration)
- أبقِ OpenClaw محدثًا: [التحديث](/ar/install/updating)

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Hetzner](/ar/install/hetzner)
- [Docker](/ar/install/docker)
- [استضافة VPS](/ar/vps)
