---
read_when:
    - نشر OpenClaw على Fly.io
    - إعداد وحدات تخزين Fly، والأسرار، وتكوين التشغيل الأول
summary: نشر OpenClaw على Fly.io خطوة بخطوة مع تخزين دائم وHTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-24T07:48:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8913b6917c23de69865c57ec6a455f3e615bc65b09334edec0a3fe8ff69cf503
    source_path: install/fly.md
    workflow: 15
---

# النشر على Fly.io

**الهدف:** تشغيل OpenClaw Gateway على جهاز [Fly.io](https://fly.io) مع تخزين دائم، وHTTPS تلقائي، ووصول إلى Discord/القنوات.

## ما الذي تحتاجه

- تثبيت [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- حساب Fly.io ‏(تكفي الخطة المجانية)
- مصادقة النموذج: مفتاح API لمزوّد النموذج الذي اخترته
- بيانات اعتماد القنوات: رمز بوت Discord، ورمز Telegram، وما إلى ذلك

## المسار السريع للمبتدئين

1. انسخ المستودع → خصّص `fly.toml`
2. أنشئ تطبيقًا + وحدة تخزين → اضبط الأسرار
3. انشر باستخدام `fly deploy`
4. استخدم SSH للدخول وإنشاء التكوين أو استخدم Control UI

<Steps>
  <Step title="أنشئ تطبيق Fly">
    ```bash
    # انسخ المستودع
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # أنشئ تطبيق Fly جديدًا (اختر اسمك الخاص)
    fly apps create my-openclaw

    # أنشئ وحدة تخزين دائمة (عادةً تكفي 1GB)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **نصيحة:** اختر منطقة قريبة منك. من الخيارات الشائعة: `lhr` ‏(لندن)، و`iad` ‏(فرجينيا)، و`sjc` ‏(سان خوسيه).

  </Step>

  <Step title="كوّن fly.toml">
    حرّر `fly.toml` ليتوافق مع اسم تطبيقك ومتطلباتك.

    **ملاحظة أمنية:** يكشف التكوين الافتراضي عنوان URL عامًا. للحصول على نشر مُقوّى من دون IP عام، راجع [النشر الخاص](#النشر-الخاص-المقوّى) أو استخدم `fly.private.toml`.

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

    | الإعداد                         | السبب                                                                      |
    | ------------------------------- | -------------------------------------------------------------------------- |
    | `--bind lan`                    | يربط إلى `0.0.0.0` بحيث يستطيع وكيل Fly الوصول إلى Gateway                |
    | `--allow-unconfigured`          | يبدأ من دون ملف تكوين (ستنشئه لاحقًا)                                     |
    | `internal_port = 3000`          | يجب أن يطابق `--port 3000` (أو `OPENCLAW_GATEWAY_PORT`) لفحوصات Fly الصحية |
    | `memory = "2048mb"`             | إن 512MB صغيرة جدًا؛ ويوصى بـ 2GB                                         |
    | `OPENCLAW_STATE_DIR = "/data"`  | يحفظ الحالة على وحدة التخزين                                               |

  </Step>

  <Step title="اضبط الأسرار">
    ```bash
    # مطلوب: رمز Gateway مميز (للربط غير loopback)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # مفاتيح API الخاصة بمزوّد النموذج
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # اختياري: مزوّدون آخرون
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # رموز القنوات المميزة
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **ملاحظات:**

    - تتطلب عمليات الربط غير loopback ‏(`--bind lan`) مسار مصادقة صالحًا لـ Gateway. يستخدم مثال Fly.io هذا `OPENCLAW_GATEWAY_TOKEN`، لكن `gateway.auth.password` أو نشر `trusted-proxy` غير loopback مكوّنًا بشكل صحيح يفيان أيضًا بالمتطلب.
    - تعامل مع هذه الرموز كما تتعامل مع كلمات المرور.
    - **فضّل متغيرات env على ملف التكوين** لجميع مفاتيح API والرموز المميزة. وهذا يُبقي الأسرار خارج `openclaw.json` حيث قد تنكشف أو تُسجّل بالخطأ.

  </Step>

  <Step title="انشر">
    ```bash
    fly deploy
    ```

    يقوم أول نشر ببناء صورة Docker ‏(~2-3 دقائق). وتكون عمليات النشر اللاحقة أسرع.

    بعد النشر، تحقّق:

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

  <Step title="أنشئ ملف التكوين">
    استخدم SSH للدخول إلى الجهاز لإنشاء تكوين مناسب:

    ```bash
    fly ssh console
    ```

    أنشئ دليل التكوين والملف:

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
        "bind": "auto"
      },
      "meta": {}
    }
    EOF
    ```

    **ملاحظة:** عند استخدام `OPENCLAW_STATE_DIR=/data`، يكون مسار التكوين هو `/data/openclaw.json`.

    **ملاحظة:** يمكن أن يأتي رمز Discord المميز من أحد المصدرين التاليين:

    - متغير البيئة: `DISCORD_BOT_TOKEN` ‏(موصى به للأسرار)
    - ملف التكوين: `channels.discord.token`

    إذا كنت تستخدم متغير env، فلا حاجة إلى إضافة الرمز المميز إلى التكوين. يقرأ Gateway ‏`DISCORD_BOT_TOKEN` تلقائيًا.

    أعد التشغيل لتطبيق التغييرات:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="الوصول إلى Gateway">
    ### Control UI

    افتحه في المتصفح:

    ```bash
    fly open
    ```

    أو انتقل إلى `https://my-openclaw.fly.dev/`

    قم بالمصادقة باستخدام السر المشترك المكوّن. يستخدم هذا الدليل
    رمز Gateway المميز من `OPENCLAW_GATEWAY_TOKEN`؛ وإذا انتقلت إلى
    مصادقة كلمة المرور، فاستخدم كلمة المرور تلك بدلًا منه.

    ### السجلات

    ```bash
    fly logs              # سجلات مباشرة
    fly logs --no-tail    # السجلات الحديثة
    ```

    ### وحدة تحكم SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## استكشاف الأخطاء وإصلاحها

### "App is not listening on expected address"

يرتبط Gateway إلى `127.0.0.1` بدلًا من `0.0.0.0`.

**الحل:** أضف `--bind lan` إلى أمر العملية في `fly.toml`.

### فشل الفحوصات الصحية / الاتصال مرفوض

لا يستطيع Fly الوصول إلى Gateway على المنفذ المكوّن.

**الحل:** تأكد من أن `internal_port` يطابق منفذ Gateway ‏(اضبط `--port 3000` أو `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / مشكلات الذاكرة

تستمر الحاوية في إعادة التشغيل أو يتم قتلها. من العلامات: `SIGABRT`، أو `v8::internal::Runtime_AllocateInYoungGeneration`، أو إعادة تشغيل صامتة.

**الحل:** زد الذاكرة في `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

أو حدّث جهازًا موجودًا:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**ملاحظة:** إن 512MB صغيرة جدًا. وقد تعمل 1GB لكن قد تتعرض لـ OOM تحت الحمل أو مع التسجيل المفصل. **يوصى بـ 2GB.**

### مشكلات قفل Gateway

يرفض Gateway البدء مع أخطاء من نوع "already running".

يحدث هذا عندما تعيد الحاوية التشغيل لكن ملف قفل PID يبقى موجودًا على وحدة التخزين.

**الحل:** احذف ملف القفل:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

يوجد ملف القفل في `/data/gateway.*.lock` ‏(وليس في دليل فرعي).

### عدم قراءة التكوين

إن `--allow-unconfigured` يتجاوز حاجز بدء التشغيل فقط. وهو لا ينشئ أو يصلح `/data/openclaw.json`، لذا تأكد من أن التكوين الحقيقي لديك موجود ويتضمن `gateway.mode="local"` عندما تريد بدء Gateway محلي عادي.

تحقق من وجود التكوين:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### كتابة التكوين عبر SSH

لا يدعم الأمر `fly ssh console -C` إعادة التوجيه عبر shell. ولكتابة ملف تكوين:

```bash
# استخدم echo + tee (أنبوب من المحلي إلى البعيد)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# أو استخدم sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**ملاحظة:** قد يفشل `fly sftp` إذا كان الملف موجودًا بالفعل. احذفه أولًا:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### عدم استمرار الحالة

إذا فقدت ملفات تعريف المصادقة، أو حالة القناة/المزوّد، أو الجلسات بعد إعادة التشغيل،
فإن دليل الحالة يكتب إلى نظام ملفات الحاوية.

**الحل:** تأكد من ضبط `OPENCLAW_STATE_DIR=/data` في `fly.toml` ثم أعد النشر.

## التحديثات

```bash
# اسحب أحدث التغييرات
git pull

# أعد النشر
fly deploy

# تحقّق من السلامة
fly status
fly logs
```

### تحديث أمر الجهاز

إذا كنت تحتاج إلى تغيير أمر بدء التشغيل من دون إعادة نشر كاملة:

```bash
# احصل على معرّف الجهاز
fly machines list

# حدّث الأمر
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# أو مع زيادة الذاكرة
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**ملاحظة:** بعد `fly deploy`، قد يُعاد ضبط أمر الجهاز إلى ما هو موجود في `fly.toml`. وإذا أجريت تغييرات يدوية، فأعد تطبيقها بعد النشر.

## النشر الخاص (المقوّى)

افتراضيًا، يخصص Fly عناوين IP عامة، مما يجعل Gateway متاحًا على `https://your-app.fly.dev`. وهذا مناسب، لكنه يعني أن عملية النشر الخاصة بك قابلة للاكتشاف بواسطة ماسحات الإنترنت (Shodan وCensys وما إلى ذلك).

للحصول على نشر مقوّى **من دون تعرّض عام**، استخدم القالب الخاص.

### متى تستخدم النشر الخاص

- عندما تُجري مكالمات/رسائل **صادرة** فقط (من دون Webhooks واردة)
- عندما تستخدم **ngrok أو Tailscale** لأنفاق أي استدعاءات Webhook راجعة
- عندما تصل إلى Gateway عبر **SSH، أو وكيل، أو WireGuard** بدلًا من المتصفح
- عندما تريد أن يكون النشر **مخفيًا عن ماسحات الإنترنت**

### الإعداد

استخدم `fly.private.toml` بدلًا من التكوين القياسي:

```bash
# انشر باستخدام التكوين الخاص
fly deploy -c fly.private.toml
```

أو حوّل نشرًا موجودًا:

```bash
# اعرض عناوين IP الحالية
fly ips list -a my-openclaw

# حرّر عناوين IP العامة
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# انتقل إلى التكوين الخاص حتى لا تعيد عمليات النشر المستقبلية تخصيص عناوين IP عامة
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

لأنه لا يوجد عنوان URL عام، استخدم إحدى هذه الطرق:

**الخيار 1: وكيل محلي (الأبسط)**

```bash
# مرّر المنفذ المحلي 3000 إلى التطبيق
fly proxy 3000:3000 -a my-openclaw

# ثم افتح http://localhost:3000 في المتصفح
```

**الخيار 2: WireGuard VPN**

```bash
# أنشئ تكوين WireGuard (مرة واحدة)
fly wireguard create

# استورده إلى عميل WireGuard، ثم ادخل عبر IPv6 الداخلي
# مثال: http://[fdaa:x:x:x:x::x]:3000
```

**الخيار 3: SSH فقط**

```bash
fly ssh console -a my-openclaw
```

### Webhooks مع النشر الخاص

إذا كنت تحتاج إلى استدعاءات Webhook راجعة (Twilio أو Telnyx أو غيرهما) من دون تعرض عام:

1. **نفق ngrok** - شغّل ngrok داخل الحاوية أو كخدمة جانبية
2. **Tailscale Funnel** - اكشف مسارات محددة عبر Tailscale
3. **صادر فقط** - يعمل بعض المزوّدين (مثل Twilio) بشكل جيد للمكالمات الصادرة من دون Webhooks

مثال على تكوين مكالمات صوتية باستخدام ngrok:

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

يعمل نفق ngrok داخل الحاوية ويوفر عنوان URL عامًا لـ Webhook من دون كشف تطبيق Fly نفسه. اضبط `webhookSecurity.allowedHosts` على اسم مضيف النفق العام حتى يتم قبول ترويسات المضيف المُمررة.

### الفوائد الأمنية

| الجانب             | عام          | خاص        |
| ------------------ | ------------ | ---------- |
| ماسحات الإنترنت    | قابل للاكتشاف | مخفي      |
| الهجمات المباشرة   | ممكنة        | محظورة     |
| الوصول إلى Control UI | المتصفح   | وكيل/VPN   |
| تسليم Webhook      | مباشر        | عبر نفق    |

## ملاحظات

- يستخدم Fly.io **بنية x86** (وليس ARM)
- ملف Dockerfile متوافق مع كلتا البنيتين
- بالنسبة إلى الإعداد الأولي لـ WhatsApp/Telegram، استخدم `fly ssh console`
- تعيش البيانات الدائمة على وحدة التخزين في `/data`
- يتطلب Signal وجود Java + `signal-cli`؛ استخدم صورة مخصصة وأبقِ الذاكرة عند 2GB+.

## التكلفة

مع التكوين الموصى به (`shared-cpu-2x` و2GB RAM):

- نحو $10-15/شهريًا حسب الاستخدام
- تتضمن الخطة المجانية بعض الحصة

راجع [تسعير Fly.io](https://fly.io/docs/about/pricing/) للتفاصيل.

## الخطوات التالية

- اضبط قنوات المراسلة: [القنوات](/ar/channels)
- كوّن Gateway: [تكوين Gateway](/ar/gateway/configuration)
- حافظ على OpenClaw محدثًا: [التحديث](/ar/install/updating)

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Hetzner](/ar/install/hetzner)
- [Docker](/ar/install/docker)
- [استضافة VPS](/ar/vps)
