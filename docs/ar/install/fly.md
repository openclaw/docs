---
read_when:
    - نشر OpenClaw على Fly.io
    - إعداد وحدات تخزين Fly والأسرار وتهيئة التشغيل الأول
summary: نشر OpenClaw على Fly.io خطوة بخطوة مع تخزين دائم وHTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-12T05:59:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2cb4203cdea9db2fa76ed60de01da67d550a75d538895b06732446d0f70e2f4
    source_path: install/fly.md
    workflow: 16
---

**الهدف:** تشغيل OpenClaw Gateway على جهاز [Fly.io](https://fly.io) مع تخزين دائم، وHTTPS تلقائي، وإمكانية الوصول إلى Discord/القنوات.

## ما تحتاج إليه

- تثبيت [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- حساب Fly.io (تفي الخطة المجانية بالغرض)
- مصادقة النموذج: مفتاح API لموفّر النموذج الذي اخترته
- بيانات اعتماد القنوات: رمز بوت Discord، ورمز Telegram، وما إلى ذلك.

## المسار السريع للمبتدئين

1. استنسخ المستودع وخصّص `fly.toml`
2. أنشئ التطبيق ووحدة التخزين، واضبط الأسرار
3. انشر باستخدام `fly deploy`
4. ادخل عبر SSH لإنشاء الإعداد، أو استخدم واجهة التحكم

<Steps>
  <Step title="إنشاء تطبيق Fly">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # اختر اسمك الخاص
    fly apps create my-openclaw

    # عادةً ما تكون سعة 1 غيغابايت كافية
    fly volumes create openclaw_data --size 1 --region iad
    ```

    اختر منطقة قريبة منك. من الخيارات الشائعة: `lhr` (لندن)، و`iad` (فيرجينيا)، و`sjc` (سان خوسيه).

  </Step>

  <Step title="تهيئة fly.toml">
    عدّل `fly.toml` ليتوافق مع اسم تطبيقك ومتطلباتك. ملف `fly.toml` المتتبّع في المستودع هو القالب العام الموضّح أدناه؛ أما `deploy/fly.private.toml` فهو البديل المحصّن الذي لا يستخدم عنوان IP عامًا (راجع [النشر الخاص](#private-deployment-hardened)).

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

    نقطة دخول صورة Docker الخاصة بـ OpenClaw هي `tini`، وتشغّل `node openclaw.mjs gateway` افتراضيًا. يستبدل قسم Fly المسمّى `[processes]` تعليمة Docker المسماة `CMD` (وهنا يشغّل `node dist/index.js gateway ...` مباشرةً، وهي نقطة الدخول المترجمة نفسها) دون المساس بـ `ENTRYPOINT`، لذا تظل العملية تعمل تحت `tini`.

    **الإعدادات الرئيسية:**

    | الإعداد                         | السبب                                                                                  |
    | ------------------------------ | -------------------------------------------------------------------------------------- |
    | `--bind lan`                   | يربط بالخادم `0.0.0.0` حتى يتمكن وكيل Fly من الوصول إلى Gateway                       |
    | `--allow-unconfigured`         | يبدأ من دون ملف إعداد (تنشئ واحدًا لاحقًا)                                            |
    | `internal_port = 3000`         | يجب أن يطابق `--port 3000` (أو `OPENCLAW_GATEWAY_PORT`) لاختبارات سلامة Fly            |
    | `memory = "2048mb"`            | سعة 512 ميغابايت صغيرة جدًا؛ ويُنصح بسعة 2 غيغابايت                                   |
    | `OPENCLAW_STATE_DIR = "/data"` | يحتفظ بالحالة بشكل دائم على وحدة التخزين                                               |

  </Step>

  <Step title="ضبط الأسرار">
    ```bash
    # مطلوب: رمز مصادقة Gateway للربط بواجهة غير local loopback
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # مفاتيح API لموفّري النماذج
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # اختياري: موفّرون آخرون
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # رموز القنوات
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    تتطلب عمليات الربط بواجهة غير local loopback (`--bind lan`) مسار مصادقة صالحًا لـ Gateway. يستخدم هذا المثال `OPENCLAW_GATEWAY_TOKEN`، لكن `gateway.auth.password` أو نشر وكيل موثوق مهيأ بشكل صحيح للربط بواجهة غير local loopback يفيان أيضًا بالمتطلب. راجع [إدارة الأسرار](/ar/gateway/secrets) للاطلاع على عقد `SecretRef`.

    تعامل مع هذه الرموز مثل كلمات المرور. فضّل متغيرات البيئة/`fly secrets` على ملف الإعداد لمفاتيح API والرموز حتى تبقى الأسرار خارج `openclaw.json`.

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

    تسجّل عملية بدء Gateway الرسالة `gateway ready` بمجرد تشغيل مستمع HTTP/WebSocket. يراقب اختبار السلامة الخاص بـ Fly القيمة `internal_port = 3000` وفقًا لملف `fly.toml`؛ كما تستطلع تعليمة Docker المسماة `HEALTHCHECK` في الصورة المسار `/healthz` على منفذها الافتراضي 18789، وهو غير مستخدم هنا لأن هذا النشر يتجاوز منفذ Gateway باستخدام `--port 3000`.

  </Step>

  <Step title="إنشاء ملف الإعداد">
    ادخل إلى الجهاز عبر SSH لإنشاء إعداد صحيح:

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

    عند ضبط `OPENCLAW_STATE_DIR=/data`، يكون مسار الإعداد هو `/data/openclaw.json`.

    استبدل `https://my-openclaw.fly.dev` بأصل تطبيق Fly الفعلي. تملأ عملية بدء Gateway أصول واجهة التحكم المحلية أوليًا من قيمتي وقت التشغيل `--bind` و`--port` حتى يمكن متابعة التشغيل الأول قبل وجود الإعداد، لكن الوصول عبر المتصفح من خلال Fly يظل بحاجة إلى إدراج أصل HTTPS الدقيق في `gateway.controlUi.allowedOrigins`.

    يمكن أن يأتي رمز Discord من أحد المصدرين التاليين:

    - متغير البيئة `DISCORD_BOT_TOKEN` (موصى به للأسرار)؛ لا حاجة إلى إضافته إلى الإعداد، إذ يقرأه Gateway تلقائيًا
    - ملف الإعداد `channels.discord.token`

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

    صادِق باستخدام السر المشترك المهيأ: رمز Gateway من `OPENCLAW_GATEWAY_TOKEN`، أو كلمة مرورك إذا انتقلت إلى المصادقة بكلمة مرور.

    ### السجلات

    ```bash
    fly logs              # السجلات المباشرة
    fly logs --no-tail    # السجلات الحديثة
    ```

    ### وحدة تحكم SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## استكشاف الأخطاء وإصلاحها

### "التطبيق لا يستمع على العنوان المتوقع"

يرتبط Gateway بالعنوان `127.0.0.1` بدلًا من `0.0.0.0`.

**الحل:** أضف `--bind lan` إلى أمر العملية في `fly.toml`.

### فشل اختبارات السلامة / رفض الاتصال

يتعذر على Fly الوصول إلى Gateway عبر المنفذ المهيأ.

**الحل:** تأكد من أن `internal_port` يطابق منفذ Gateway (`--port 3000` أو `OPENCLAW_GATEWAY_PORT=3000`).

### نفاد الذاكرة / مشكلات الذاكرة

تستمر الحاوية في إعادة التشغيل أو يجري إنهاؤها. من العلامات: `SIGABRT`، أو `v8::internal::Runtime_AllocateInYoungGeneration`، أو عمليات إعادة تشغيل صامتة.

**الحل:** زِد الذاكرة في `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

أو حدّث جهازًا موجودًا:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

سعة 512 ميغابايت صغيرة جدًا. قد تعمل سعة 1 غيغابايت، لكنها قد تنفد تحت الحمل أو عند استخدام سجلات تفصيلية. يُنصح بسعة 2 غيغابايت.

### مشكلات قفل Gateway

يرفض Gateway البدء مع ظهور أخطاء "قيد التشغيل بالفعل" بعد إعادة تشغيل الحاوية.

يوجد ملف قفل النسخة المنفردة في `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock` (على Linux:‏ `/tmp/openclaw-<uid>/gateway.<hash>.lock`)، وليس على وحدة التخزين الدائمة `/data`، لذا تؤدي إعادة التشغيل الكاملة للحاوية عادةً إلى مسحه مع بقية نظام ملفات الحاوية. إذا استمر القفل (على سبيل المثال، بعد تنفيذ `fly machine restart` مع الحفاظ على نظام ملفات الحاوية) ومنع بدء التشغيل، فأزله يدويًا:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### عدم قراءة الإعداد

لا يفعل `--allow-unconfigured` سوى تجاوز حاجز بدء التشغيل. فهو لا ينشئ `/data/openclaw.json` ولا يصلحه، لذا تأكد من وجود إعدادك الفعلي وتضمّنه `"gateway": { "mode": "local" }` لبدء Gateway محلي عادي.

تحقّق من وجود الإعداد:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### كتابة الإعداد عبر SSH

لا يدعم `fly ssh console -C` إعادة توجيه الصدفة. لكتابة ملف إعداد:

```bash
# استخدام echo مع tee (تمرير من الجهاز المحلي إلى البعيد)
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

إذا فقدت ملفات تعريف المصادقة، أو حالة القنوات/الموفّرين، أو الجلسات بعد إعادة التشغيل، فهذا يعني أن دليل الحالة يُكتب إلى نظام ملفات الحاوية بدلًا من وحدة التخزين.

**الحل:** تأكد من ضبط `OPENCLAW_STATE_DIR=/data` في `fly.toml` ثم أعد النشر.

## التحديث

```bash
git pull
fly deploy
fly status
fly logs
```

يمثل `git pull` مع `fly deploy` المسار الخاضع للإشراف هنا: فهو يعيد بناء الصورة من Dockerfile، لذا يُحدَّث إصدار CLI/Gateway وصورة نظام التشغيل الأساسية وأي تغييرات في Dockerfile معًا. لا يمثّل تنفيذ `openclaw update` داخل الحاوية قيد التشغيل العملية نفسها، لأن الصورة تُشحن على هيئة شجرة `dist/` مبنية باستخدام Docker دون نسخة عمل `.git` ودون تثبيت عام تديره npm لكي يكتشفه؛ راجع [التحديث](/ar/install/updating) للاطلاع على هذا المسار في عمليات التثبيت المشابهة للأجهزة الافتراضية.

### تحديث أمر الجهاز

لتغيير أمر بدء التشغيل دون إعادة نشر كاملة:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# أو مع زيادة الذاكرة
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

تؤدي عملية `fly deploy` لاحقة إلى إعادة تعيين أمر الجهاز إلى ما هو موجود في `fly.toml`؛ أعد تطبيق التغييرات اليدوية بعد إعادة النشر.

## النشر الخاص (المحصّن)

يخصص Fly عناوين IP عامة افتراضيًا، لذا يمكن الوصول إلى Gateway عبر `https://your-app.fly.dev` ويمكن أن تكتشفه أدوات فحص الإنترنت (Shodan وCensys وما إلى ذلك).

استخدم `deploy/fly.private.toml` لنشر محصّن **من دون عنوان IP عام**: فهو يحذف `[http_service]`، لذلك لا يُخصَّص أي دخول عام.

### متى تستخدم النشر الخاص

- للمكالمات/الرسائل الصادرة فقط (من دون Webhook واردة)
- تتولى أنفاق ngrok أو Tailscale معالجة أي استدعاءات Webhook
- يجري الوصول إلى Gateway عبر SSH أو وكيل أو WireGuard بدلًا من المتصفح
- يجب إخفاء النشر عن أدوات فحص الإنترنت

### الإعداد

```bash
fly deploy -c deploy/fly.private.toml
```

أو حوّل نشرًا موجودًا:

```bash
# سرد عناوين IP الحالية
fly ips list -a my-openclaw

# تحرير عناوين IP العامة
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# الانتقال إلى الإعداد الخاص كي لا تعيد عمليات النشر المستقبلية تخصيص عناوين IP عامة
fly deploy -c deploy/fly.private.toml

# تخصيص عنوان IPv6 خاص فقط
fly ips allocate-v6 --private -a my-openclaw
```

بعد ذلك، ينبغي أن يعرض `fly ips list` عنوان IP واحدًا فقط من النوع `private`:

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### الوصول إلى نشر خاص

**الخيار 1: وكيل محلي (الأبسط)**

```bash
fly proxy 3000:3000 -a my-openclaw
# افتح http://localhost:3000 في متصفح
```

**الخيار 2: شبكة VPN عبر WireGuard**

```bash
fly wireguard create
# استورده إلى عميل WireGuard، ثم صِل إليه عبر IPv6 الداخلي
# مثال: http://[fdaa:x:x:x:x::x]:3000
```

**الخيار 3: SSH فقط**

```bash
fly ssh console -a my-openclaw
```

### Webhook مع نشر خاص

لاستدعاءات Webhook الراجعة (Twilio وTelnyx وغيرها) من دون تعريض عام:

1. **نفق ngrok**: شغّل ngrok داخل الحاوية أو كحاوية جانبية
2. **Tailscale Funnel**: اعرض مسارات محددة عبر Tailscale
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

يعمل نفق ngrok داخل الحاوية ويوفر عنوان URL عامًا لـ Webhook من دون تعريض تطبيق Fly نفسه. اضبط `webhookSecurity.allowedHosts` على اسم مضيف النفق لقبول ترويسات المضيف المُعاد توجيهها.

### المفاضلات الأمنية

| الجانب                 | عام             | خاص                |
| ---------------------- | --------------- | ------------------ |
| ماسحات الإنترنت        | قابل للاكتشاف   | مخفي               |
| الهجمات المباشرة       | ممكنة           | محظورة             |
| الوصول إلى واجهة التحكم | المتصفح          | وكيل/شبكة VPN       |
| تسليم Webhook          | مباشر           | عبر نفق             |

## ملاحظات

- تستخدم Fly.io بنية x86؛ ويتوافق Dockerfile مع كل من x86 وARM.
- لإعداد WhatsApp وTelegram أول مرة، استخدم `fly ssh console`.
- توجد البيانات الدائمة على وحدة التخزين في `/data`.
- يتطلب Signal وجود signal-cli (وهو CLI مبني على Java) في الصورة؛ استخدم صورة مخصصة واضبط الذاكرة على 2 غيغابايت أو أكثر.

## التكلفة

باستخدام الإعداد الموصى به (`shared-cpu-2x` وذاكرة RAM بسعة 2 غيغابايت)، توقّع تكلفة تقارب 10 إلى 15 دولارًا شهريًا حسب الاستخدام؛ وتغطي الخطة المجانية جزءًا من الحصة الأساسية. راجع [أسعار Fly.io](https://fly.io/docs/about/pricing/) لمعرفة الأسعار الحالية.

## الخطوات التالية

- إعداد قنوات المراسلة: [القنوات](/ar/channels)
- تهيئة Gateway: [تهيئة Gateway](/ar/gateway/configuration)
- إبقاء OpenClaw محدّثًا: [التحديث](/ar/install/updating)

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Hetzner](/ar/install/hetzner)
- [Docker](/ar/install/docker)
- [استضافة VPS](/ar/vps)
