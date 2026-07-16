---
read_when:
    - نشر OpenClaw على Fly.io
    - إعداد وحدات تخزين Fly والأسرار وتهيئة التشغيل الأول
summary: نشر OpenClaw على Fly.io خطوة بخطوة مع تخزين دائم وHTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-16T14:20:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d2b5119c1df8ee077f4db4f44fa92c6ae0e2bf3c355c2117e0fd39146bb49875
    source_path: install/fly.md
    workflow: 16
---

**الهدف:** تشغيل OpenClaw Gateway على جهاز [Fly.io](https://fly.io) مع تخزين دائم، وHTTPS تلقائي، وإمكانية الوصول عبر Discord/القنوات.

## المتطلبات

- تثبيت [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- حساب Fly.io (تعمل الخطة المجانية)
- مصادقة النموذج: مفتاح API لمزوّد النموذج الذي اخترته
- بيانات اعتماد القناة: رمز بوت Discord، ورمز Telegram، وما إلى ذلك.

## المسار السريع للمبتدئين

1. استنسخ المستودع، وخصّص `fly.toml`
2. أنشئ التطبيق ووحدة التخزين، واضبط الأسرار
3. انشر باستخدام `fly deploy`
4. اتصل عبر SSH لإنشاء الإعدادات، أو استخدم واجهة التحكم

<Steps>
  <Step title="إنشاء تطبيق Fly">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # اختر اسمًا خاصًا بك
    fly apps create my-openclaw

    # عادةً ما تكفي سعة 1GB
    fly volumes create openclaw_data --size 1 --region iad
    ```

    اختر منطقة قريبة منك. من الخيارات الشائعة: `lhr` (لندن)، و`iad` (فرجينيا)، و`sjc` (سان خوسيه).

  </Step>

  <Step title="إعداد fly.toml">
    عدّل `fly.toml` ليتوافق مع اسم تطبيقك ومتطلباتك. ملف `fly.toml` المتتبَّع في المستودع هو القالب العام الموضح أدناه؛ أما `deploy/fly.private.toml` فهو النسخة المحصّنة التي لا تستخدم عنوان IP عامًا (راجع [النشر الخاص](#private-deployment-hardened)).

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

    نقطة دخول صورة Docker الخاصة بـ OpenClaw هي `tini`، وتشغّل `node openclaw.mjs gateway` افتراضيًا. يستبدل `[processes]` في Fly تعليمة Docker ‏`CMD` (وهنا يشغّل `node dist/index.js gateway ...` مباشرةً، وهي نقطة الدخول المترجمة نفسها) من دون المساس بـ `ENTRYPOINT`، لذلك تظل العملية تعمل تحت `tini`.

    **الإعدادات الأساسية:**

    | الإعداد                        | السبب                                                                         |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | يربط بـ `0.0.0.0` كي يتمكن وكيل Fly من الوصول إلى Gateway                     |
    | `--allow-unconfigured`         | يبدأ من دون ملف إعدادات (تنشئه لاحقًا)                        |
    | `internal_port = 3000`         | يجب أن يطابق `--port 3000` (أو `OPENCLAW_GATEWAY_PORT`) لعمليات التحقق من السلامة في Fly |
    | `memory = "2048mb"`            | سعة 512MB صغيرة جدًا؛ يُوصى بسعة 2GB                                         |
    | `OPENCLAW_STATE_DIR = "/data"` | يحفظ الحالة بشكل دائم على وحدة التخزين                                                |

  </Step>

  <Step title="ضبط الأسرار">
    ```bash
    # مطلوب: رمز مصادقة Gateway للربط خارج عنوان الاسترجاع
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # مفاتيح API لمزوّدي النماذج
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # اختياري: مزوّدون آخرون
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # رموز القنوات
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    تتطلب عمليات الربط خارج عنوان الاسترجاع (`--bind lan`) مسار مصادقة صالحًا لـ Gateway. يستخدم هذا المثال `OPENCLAW_GATEWAY_TOKEN`، لكن `gateway.auth.password` أو نشر وكيل موثوق خارج عنوان الاسترجاع ومُعدّ إعدادًا صحيحًا يفيان بالمتطلب أيضًا. راجع [إدارة الأسرار](/ar/gateway/secrets) للاطلاع على عقد SecretRef.

    تعامل مع هذه الرموز كما تتعامل مع كلمات المرور. يُفضَّل استخدام متغيرات البيئة/`fly secrets` بدلًا من ملف الإعدادات لمفاتيح API والرموز كي تظل الأسرار خارج `openclaw.json`.

  </Step>

  <Step title="النشر">
    ```bash
    fly deploy
    ```

    يبني النشر الأول صورة Docker. تحقّق بعد النشر:

    ```bash
    fly status
    fly logs
    ```

    تسجّل عملية بدء Gateway الرسالة `gateway ready` بمجرد تشغيل مستمع HTTP/WebSocket. تراقب عملية التحقق من السلامة الخاصة بـ Fly المسار `internal_port = 3000` وفقًا لـ `fly.toml`؛ كما تستطلع تعليمة Docker ‏`HEALTHCHECK` في الصورة المسار `/healthz` على منفذها الافتراضي 18789، وهو غير مستخدم هنا لأن هذا النشر يغيّر منفذ Gateway إلى `--port 3000`.

  </Step>

  <Step title="إنشاء ملف الإعدادات">
    اتصل بالجهاز عبر SSH لإنشاء إعدادات صحيحة:

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

    عند استخدام `OPENCLAW_STATE_DIR=/data`، يكون مسار الإعدادات هو `/data/openclaw.json`.

    استبدل `https://my-openclaw.fly.dev` بالأصل الفعلي لتطبيق Fly الخاص بك. تملأ عملية بدء Gateway أصول واجهة التحكم المحلية أوليًا من قيمتي وقت التشغيل `--bind` و`--port` حتى يمكن إتمام التشغيل الأول قبل وجود الإعدادات، لكن الوصول عبر المتصفح من خلال Fly يظل يتطلب إدراج أصل HTTPS الدقيق في `gateway.controlUi.allowedOrigins`.

    يمكن الحصول على رمز Discord من أيٍّ مما يلي:

    - متغير البيئة `DISCORD_BOT_TOKEN` (موصى به للأسرار)؛ لا حاجة إلى إضافته إلى الإعدادات، إذ يقرأه Gateway تلقائيًا
    - ملف الإعدادات `channels.discord.token`

    أعد التشغيل لتطبيق التغييرات:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="الوصول إلى Gateway">
    ### واجهة التحكم

    ```bash
    fly open
    ```

    أو زُر `https://my-openclaw.fly.dev/`.

    صادِق باستخدام السر المشترك المُعدّ: رمز Gateway من `OPENCLAW_GATEWAY_TOKEN`، أو كلمة مرورك إذا انتقلت إلى المصادقة بكلمة مرور.

    ### السجلات

    ```bash
    fly logs              # سجلات مباشرة
    fly logs --no-tail    # السجلات الأخيرة
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

### فشل عمليات التحقق من السلامة / رفض الاتصال

يتعذر على Fly الوصول إلى Gateway على المنفذ المُعدّ.

**الإصلاح:** تأكد من أن `internal_port` يطابق منفذ Gateway ‏(`--port 3000` أو `OPENCLAW_GATEWAY_PORT=3000`).

### نفاد الذاكرة / مشكلات الذاكرة

تستمر الحاوية في إعادة التشغيل أو تُنهى. من العلامات: `SIGABRT`، أو `v8::internal::Runtime_AllocateInYoungGeneration`، أو عمليات إعادة تشغيل صامتة.

**الإصلاح:** زِد الذاكرة في `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

أو حدّث جهازًا موجودًا:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

سعة 512MB صغيرة جدًا. قد تعمل سعة 1GB، لكنها قد تنفد تحت الحمل أو عند استخدام تسجيل مطوّل. يُوصى بسعة 2GB.

### مشكلات قفل Gateway

يرفض Gateway بدء التشغيل مع أخطاء "قيد التشغيل بالفعل" بعد إعادة تشغيل الحاوية.

توجد ملفات قفل وقت التشغيل في `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock`
و`gateway.state.<hash>.lock` (في Linux:
`/tmp/openclaw-<uid>/gateway.*.lock`)، وليس على وحدة التخزين الدائمة `/data`، ولذلك
تمسح إعادة التشغيل الكاملة للحاوية هذه الملفات عادةً مع بقية نظام ملفات
الحاوية. إذا استمر وجود قفل (مثلًا بسبب `fly machine restart`
يحافظ على نظام ملفات الحاوية) ومنع بدء التشغيل، فأزله
يدويًا:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### عدم قراءة الإعدادات

يتجاوز `--allow-unconfigured` حارس بدء التشغيل فقط. ولا ينشئ `/data/openclaw.json` أو يصلحه، لذا تأكد من وجود إعداداتك الفعلية وتضمينها `"gateway": { "mode": "local" }` لبدء Gateway محلي بصورة طبيعية.

تحقّق من وجود الإعدادات:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### كتابة الإعدادات عبر SSH

لا يدعم `fly ssh console -C` إعادة توجيه الصدفة. لكتابة ملف إعدادات:

```bash
# استخدام echo مع tee (تمرير البيانات من الجهاز المحلي إلى البعيد)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# أو استخدام sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

قد يفشل `fly sftp` إذا كان الملف موجودًا بالفعل؛ احذفه أولًا:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### عدم استمرار الحالة

إذا فقدت ملفات تعريف المصادقة أو حالة القناة/المزوّد أو الجلسات بعد إعادة التشغيل، فهذا يعني أن دليل الحالة يُكتب في نظام ملفات الحاوية بدلًا من وحدة التخزين.

**الإصلاح:** تأكد من ضبط `OPENCLAW_STATE_DIR=/data` في `fly.toml`، ثم أعد النشر.

## التحديث

```bash
git pull
fly deploy
fly status
fly logs
```

يمثّل `git pull` + `fly deploy` المسار المُدار هنا: فهو يعيد بناء الصورة من Dockerfile، ولذلك يتحدّث إصدار CLI/Gateway وصورة نظام التشغيل الأساسية وأي تغييرات في Dockerfile معًا. ليست عملية `openclaw update` داخل الحاوية قيد التشغيل هي العملية نفسها، لأن الصورة تُشحَن كشجرة `dist/` مبنية باستخدام Docker من دون نسخة عمل `.git` ومن دون تثبيت عام يديره npm كي تكتشفه؛ راجع [التحديث](/ar/install/updating) للاطلاع على هذا المسار في عمليات التثبيت المشابهة للأجهزة الافتراضية.

### تحديث أمر الجهاز

لتغيير أمر بدء التشغيل دون إعادة نشر كاملة:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# أو مع زيادة الذاكرة
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

تعيد عملية `fly deploy` اللاحقة أمر الجهاز إلى ما هو موجود في `fly.toml`؛ أعِد تطبيق التغييرات اليدوية بعد إعادة النشر.

## النشر الخاص (المحصّن)

يخصّص Fly عناوين IP عامة افتراضيًا، ولذلك يمكن الوصول إلى Gateway عبر `https://your-app.fly.dev` ويمكن لأدوات فحص الإنترنت اكتشافه (Shodan وCensys وغيرهما).

استخدم `deploy/fly.private.toml` لنشر محصّن **دون عنوان IP عام**: فهو يحذف `[http_service]`، ولذلك لا يُخصّص أي دخول عام.

### متى تستخدم النشر الخاص

- المكالمات/الرسائل الصادرة فقط (دون Webhook واردة)
- تتولى أنفاق ngrok أو Tailscale أي استدعاءات راجعة لـ Webhook
- يتم الوصول إلى Gateway عبر SSH أو وكيل أو WireGuard بدلًا من المتصفح
- يجب إخفاء النشر عن أدوات فحص الإنترنت

### الإعداد

```bash
fly deploy -c deploy/fly.private.toml
```

أو حوّل نشرًا موجودًا:

```bash
# عرض عناوين IP الحالية
fly ips list -a my-openclaw

# تحرير عناوين IP العامة
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# التبديل إلى الإعداد الخاص كي لا تعيد عمليات النشر المستقبلية تخصيص عناوين IP عامة
fly deploy -c deploy/fly.private.toml

# تخصيص IPv6 خاص فقط
fly ips allocate-v6 --private -a my-openclaw
```

بعد ذلك، يجب أن يعرض `fly ips list` عنوان IP من النوع `private` فقط:

```text
الإصدار  عنوان IP              النوع            المنطقة
v6       fdaa:x:x:x:x::x      خاص              عالمي
```

### الوصول إلى عملية نشر خاصة

**الخيار 1: وكيل محلي (الأبسط)**

```bash
fly proxy 3000:3000 -a my-openclaw
# افتح http://localhost:3000 في متصفح
```

**الخيار 2: شبكة WireGuard VPN**

```bash
fly wireguard create
# استورده إلى عميل WireGuard، ثم صِل إليه عبر IPv6 الداخلي
# مثال: http://[fdaa:x:x:x:x::x]:3000
```

**الخيار 3: SSH فقط**

```bash
fly ssh console -a my-openclaw
```

### Webhook مع عملية نشر خاصة

لمعاودات اتصال Webhook ‏(Twilio وTelnyx وغيرهما) من دون إتاحة عامة:

1. **نفق ngrok**: شغّل ngrok داخل الحاوية أو كحاوية جانبية
2. **Tailscale Funnel**: أتِح مسارات محددة عبر Tailscale
3. **الصادر فقط**: يعمل بعض المزوّدين (مثل Twilio) للمكالمات الصادرة من دون Webhook

مثال على إعداد المكالمات الصوتية باستخدام ngrok، ضمن `plugins.entries.voice-call.config`:

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

يعمل نفق ngrok داخل الحاوية ويوفّر عنوان URL عامًا لـ Webhook من دون إتاحة تطبيق Fly نفسه. اضبط `webhookSecurity.allowedHosts` على اسم مضيف النفق للسماح بترويسات المضيف المُعاد توجيهها.

### المفاضلات الأمنية

| الجانب                  | عام                  | خاص              |
| ----------------------- | -------------------- | ---------------- |
| ماسحات الإنترنت         | قابل للاكتشاف        | مخفي             |
| الهجمات المباشرة        | ممكنة                | محظورة           |
| الوصول إلى واجهة التحكم | المتصفح              | وكيل/VPN         |
| تسليم Webhook           | مباشر                | عبر نفق           |

## ملاحظات

- تستخدم Fly.io معمارية x86؛ ويتوافق Dockerfile مع كل من x86 وARM.
- لتهيئة WhatsApp/Telegram، استخدم `fly ssh console`.
- توجد البيانات الدائمة على وحدة التخزين في `/data`.
- يتطلب Signal وجود signal-cli (أداة CLI مبنية على Java) في الصورة؛ استخدم صورة مخصصة وأبقِ الذاكرة عند 2GB أو أكثر.

## التكلفة

مع الإعداد الموصى به (`shared-cpu-2x` وذاكرة RAM بسعة 2GB)، توقّع تكلفة تقارب $10-15 شهريًا حسب الاستخدام؛ وتغطي الخطة المجانية قدرًا أساسيًا من الاستهلاك. راجع [أسعار Fly.io](https://fly.io/docs/about/pricing/) لمعرفة الأسعار الحالية.

## الخطوات التالية

- إعداد قنوات المراسلة: [القنوات](/ar/channels)
- تهيئة Gateway: [تهيئة Gateway](/ar/gateway/configuration)
- الحفاظ على تحديث OpenClaw: [التحديث](/ar/install/updating)

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Hetzner](/ar/install/hetzner)
- [Docker](/ar/install/docker)
- [استضافة VPS](/ar/vps)
