---
read_when:
    - تحتاج إلى معرفة متغيرات البيئة التي يتم تحميلها، وبأي ترتيب
    - أنت تقوم بتصحيح أخطاء مفاتيح API المفقودة في Gateway
    - أنت توثّق مصادقة الموفّر أو بيئات النشر
summary: من أين يحمّل OpenClaw متغيرات البيئة وترتيب الأولوية بينها
title: متغيرات البيئة
x-i18n:
    generated_at: "2026-04-24T07:45:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0538e07cc2f785224b5f061bdaee982c4c849838e9d637defcc86a5121710df
    source_path: help/environment.md
    workflow: 15
---

يسحب OpenClaw متغيرات البيئة من عدة مصادر. والقاعدة هي **عدم تجاوز القيم الموجودة أبدًا**.

## الأولوية (من الأعلى → إلى الأدنى)

1. **بيئة العملية** (ما تملكه عملية Gateway بالفعل من shell/daemon الأصلية).
2. **`.env` في دليل العمل الحالي** (الافتراضي في dotenv؛ ولا يتجاوز القيم).
3. **`.env` العام** في `~/.openclaw/.env` ‏(أيضًا `$OPENCLAW_STATE_DIR/.env`؛ ولا يتجاوز القيم).
4. **كتلة `env` في الإعدادات** ضمن `~/.openclaw/openclaw.json` ‏(تُطبَّق فقط إذا كانت القيمة مفقودة).
5. **استيراد shell لتسجيل الدخول الاختياري** ‏(`env.shellEnv.enabled` أو `OPENCLAW_LOAD_SHELL_ENV=1`) ويُطبَّق فقط على المفاتيح المتوقعة المفقودة.

في تثبيتات Ubuntu الجديدة التي تستخدم دليل الحالة الافتراضي، يتعامل OpenClaw أيضًا مع `~/.config/openclaw/gateway.env` كرجوع احتياطي للتوافق بعد `.env` العام. وإذا وُجد الملفان معًا وكانا مختلفين، يحتفظ OpenClaw بالقيمة الموجودة في `~/.openclaw/.env` ويطبع تحذيرًا.

إذا كان ملف الإعدادات مفقودًا بالكامل، يتم تخطي الخطوة 4؛ ويستمر استيراد shell إذا كان مفعّلًا.

## كتلة `env` في الإعدادات

هناك طريقتان متكافئتان لتعيين متغيرات env مضمنة (كلتاهما لا تتجاوز القيم الموجودة):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

## استيراد env من shell

يقوم `env.shellEnv` بتشغيل shell تسجيل الدخول لديك ويستورد فقط المفاتيح المتوقعة **المفقودة**:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

المتغيرات البيئية المكافئة:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## متغيرات env المحقونة في وقت التشغيل

يحقن OpenClaw أيضًا علامات سياقية داخل العمليات الفرعية التي يتم تشغيلها:

- `OPENCLAW_SHELL=exec`: تُضبط للأوامر التي يتم تشغيلها عبر أداة `exec`.
- `OPENCLAW_SHELL=acp`: تُضبط لعمليات تشغيل الواجهة الخلفية لوقت تشغيل ACP ‏(مثل `acpx`).
- `OPENCLAW_SHELL=acp-client`: تُضبط للأمر `openclaw acp client` عندما يشغّل عملية جسر ACP.
- `OPENCLAW_SHELL=tui-local`: تُضبط لأوامر shell المحلية `!` داخل TUI.

هذه علامات وقت تشغيل (وليست إعدادات مطلوبة من المستخدم). ويمكن استخدامها في منطق shell/profile
لتطبيق قواعد خاصة بالسياق.

## متغيرات env الخاصة بواجهة المستخدم

- `OPENCLAW_THEME=light`: فرض لوحة TUI الفاتحة عندما تكون خلفية الطرفية فاتحة.
- `OPENCLAW_THEME=dark`: فرض لوحة TUI الداكنة.
- `COLORFGBG`: إذا كانت الطرفية تصدّره، يستخدم OpenClaw تلميح لون الخلفية لاختيار لوحة TUI تلقائيًا.

## استبدال متغيرات env في الإعدادات

يمكنك الإشارة إلى متغيرات env مباشرةً داخل قيم السلاسل النصية في الإعدادات باستخدام الصيغة `${VAR_NAME}`:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

راجع [الإعدادات: استبدال متغيرات env](/ar/gateway/configuration-reference#env-var-substitution) للحصول على التفاصيل الكاملة.

## Secret refs مقابل سلاسل `${ENV}`

يدعم OpenClaw نمطين معتمدين على env:

- استبدال السلاسل `${VAR}` داخل قيم الإعدادات.
- كائنات SecretRef ‏(`{ source: "env", provider: "default", id: "VAR" }`) للحقول التي تدعم مراجع الأسرار.

يتم حل كلاهما من بيئة العملية وقت التفعيل. وتُوثّق تفاصيل SecretRef في [إدارة الأسرار](/ar/gateway/secrets).

## متغيرات env المتعلقة بالمسارات

| المتغير               | الغرض                                                                                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`      | تجاوز دليل المنزل المستخدم في جميع عمليات حل المسارات الداخلية (`~/.openclaw/`، وأدلة الوكلاء، والجلسات، وبيانات الاعتماد). وهو مفيد عند تشغيل OpenClaw كمستخدم خدمة مخصص. |
| `OPENCLAW_STATE_DIR` | تجاوز دليل الحالة (الافتراضي `~/.openclaw`).                                                                                                                                   |
| `OPENCLAW_CONFIG_PATH` | تجاوز مسار ملف الإعدادات (الافتراضي `~/.openclaw/openclaw.json`).                                                                                                            |

## التسجيلات

| المتغير              | الغرض                                                                                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | تجاوز مستوى التسجيل لكل من الملف ووحدة التحكم (مثل `debug` و`trace`). وله أولوية على `logging.level` و`logging.consoleLevel` في الإعدادات. ويتم تجاهل القيم غير الصالحة مع تحذير. |

### `OPENCLAW_HOME`

عند تعيينه، يستبدل `OPENCLAW_HOME` دليل المنزل الخاص بالنظام (`$HOME` / `os.homedir()`) في جميع عمليات حل المسارات الداخلية. ويتيح ذلك عزلًا كاملًا لنظام الملفات لحسابات الخدمة بلا واجهة.

**الأولوية:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**مثال** ‏(macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

يمكن أيضًا تعيين `OPENCLAW_HOME` إلى مسار يحتوي على tilde ‏(مثل `~/svc`) ثم يُوسَّع باستخدام `$HOME` قبل الاستخدام.

## مستخدمو nvm: أعطال TLS في web_fetch

إذا تم تثبيت Node.js عبر **nvm** ‏(وليس عبر مدير الحزم الخاص بالنظام)، فإن الدالة المدمجة `fetch()`
تستخدم مخزن الشهادات CA المجمّع مع nvm، والذي قد يفتقد شهادات الجذر الحديثة (ISRG Root X1/X2 الخاصة بـ Let's Encrypt،
وDigiCert Global Root G2، وما إلى ذلك). وهذا يتسبب في فشل `web_fetch` برسالة `"fetch failed"` على معظم مواقع HTTPS.

على Linux، يكتشف OpenClaw استخدام nvm تلقائيًا ويطبّق الإصلاح في بيئة بدء التشغيل الفعلية:

- يكتب `openclaw gateway install` المتغير `NODE_EXTRA_CA_CERTS` داخل بيئة خدمة systemd
- يعيد مدخل CLI الخاص بـ `openclaw` تنفيذ نفسه مع تعيين `NODE_EXTRA_CA_CERTS` قبل بدء Node

**إصلاح يدوي (للإصدارات الأقدم أو تشغيلات `node ...` المباشرة):**

صدّر المتغير قبل بدء OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

لا تعتمد على الكتابة فقط إلى `~/.openclaw/.env` لهذا المتغير؛ إذ يقرأ Node
`NODE_EXTRA_CA_CERTS` عند بدء العملية.

## ذو صلة

- [إعدادات Gateway](/ar/gateway/configuration)
- [الأسئلة الشائعة: متغيرات env وتحميل .env](/ar/help/faq#env-vars-and-env-loading)
- [نظرة عامة على النماذج](/ar/concepts/models)
