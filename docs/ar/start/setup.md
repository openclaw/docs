---
read_when:
    - إعداد جهاز جديد
    - تريد «الأحدث والأفضل» دون تعطيل إعدادك الشخصي
summary: إعدادات متقدمة وسير عمل التطوير لـ OpenClaw
title: الإعداد
x-i18n:
    generated_at: "2026-06-27T18:37:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81cad59d4eab731ba548452211bfc578d6f79e38431057c52cc3580d3b9d9944
    source_path: start/setup.md
    workflow: 16
---

<Note>
إذا كنت تُعدّ OpenClaw لأول مرة، فابدأ بـ [بدء الاستخدام](/ar/start/getting-started).
لتفاصيل الإعداد الأولي، راجع [الإعداد الأولي (CLI)](/ar/start/wizard).
</Note>

## الخلاصة

اختر سير عمل الإعداد بناءً على عدد المرات التي تريد فيها التحديثات وما إذا كنت تريد تشغيل Gateway بنفسك:

- **يبقى التخصيص خارج المستودع:** احتفظ بالإعدادات ومساحة العمل في `~/.openclaw/openclaw.json` و`~/.openclaw/workspace/` حتى لا تمسّها تحديثات المستودع.
- **سير العمل المستقر (موصى به لمعظم المستخدمين):** ثبّت تطبيق macOS ودعه يشغّل Gateway المضمّن.
- **سير عمل أحدث التغييرات (للتطوير):** شغّل Gateway بنفسك عبر `pnpm gateway:watch`، ثم دع تطبيق macOS يتصل في الوضع المحلي.

## المتطلبات المسبقة (من المصدر)

- يوصى بـ Node 24 (لا يزال Node 22 LTS، حاليًا `22.19+`، مدعومًا)
- `pnpm` مطلوب لنسخ المصدر. يحمّل OpenClaw Plugins المضمّنة من حزم مساحة عمل pnpm
  `extensions/*` في وضع التطوير، لذلك لا يجهّز `npm install` في الجذر
  شجرة المصدر كاملة.
- Docker (اختياري؛ فقط للإعداد داخل الحاويات/e2e - راجع [Docker](/ar/install/docker))

## استراتيجية التخصيص (حتى لا تؤذيك التحديثات)

إذا كنت تريد "مخصصًا لي 100%" _مع_ تحديثات سهلة، فاحتفظ بتخصيصك في:

- **الإعدادات:** `~/.openclaw/openclaw.json` (بصيغة تشبه JSON/JSON5)
- **مساحة العمل:** `~/.openclaw/workspace` (Skills، مطالبات، ذاكرات؛ اجعلها مستودع git خاصًا)

ابدأ التهيئة مرة واحدة:

```bash
openclaw setup
```

من داخل هذا المستودع، استخدم مدخل CLI المحلي:

```bash
openclaw setup
```

إذا لم يكن لديك تثبيت عام بعد، فشغّله عبر `pnpm openclaw setup`.

## تشغيل Gateway من هذا المستودع

بعد `pnpm build`، يمكنك تشغيل CLI المجمّع مباشرةً:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## سير العمل المستقر (تطبيق macOS أولًا)

1. ثبّت وشغّل **OpenClaw.app** (شريط القوائم).
2. أكمل قائمة تحقق الإعداد الأولي/الأذونات (مطالبات TCC).
3. تأكد أن Gateway في الوضع **محلي** ويعمل (يديره التطبيق).
4. اربط الأسطح (مثال: WhatsApp):

```bash
openclaw channels login
```

5. تحقق سريعًا:

```bash
openclaw health
```

إذا لم يكن الإعداد الأولي متاحًا في إصدارك:

- شغّل `openclaw setup`، ثم `openclaw channels login`، ثم ابدأ Gateway يدويًا (`openclaw gateway`).

## سير عمل أحدث التغييرات (Gateway في طرفية)

الهدف: العمل على Gateway المكتوب بـ TypeScript، والحصول على إعادة تحميل فورية، مع إبقاء واجهة تطبيق macOS متصلة.

### 0) (اختياري) شغّل تطبيق macOS من المصدر أيضًا

إذا كنت تريد تطبيق macOS على أحدث التغييرات أيضًا:

```bash
./scripts/restart-mac.sh
```

### 1) ابدأ Gateway التطوير

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

يبدأ `gateway:watch` أو يعيد تشغيل عملية مراقبة Gateway في جلسة tmux
مسمّاة ويتصل بها تلقائيًا من الطرفيات التفاعلية. تبقى الصدفات غير التفاعلية
منفصلة وتطبع `tmux attach -t openclaw-gateway-watch-main`؛ استخدم
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` لإبقاء تشغيل تفاعلي
منفصلًا، أو `pnpm gateway:watch:raw` لوضع المراقبة في الواجهة. يعيد المراقب
التحميل عند تغييرات المصدر والإعدادات وبيانات تعريف Plugins المضمّنة ذات الصلة. إذا خرج
Gateway المُراقَب أثناء بدء التشغيل، يشغّل `gateway:watch`
`openclaw doctor --fix --non-interactive` مرة واحدة ويعيد المحاولة؛ عيّن
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` لتعطيل تمرير الإصلاح الخاص بالتطوير هذا.
`pnpm openclaw setup` هو خطوة التهيئة المحلية لمرة واحدة للإعدادات/مساحة العمل عند نسخة مصدر جديدة.
لا يعيد `pnpm gateway:watch` بناء `dist/control-ui`، لذلك أعد تشغيل `pnpm ui:build` بعد تغييرات `ui/` أو استخدم `pnpm ui:dev` أثناء تطوير Control UI.

### 2) وجّه تطبيق macOS إلى Gateway الذي يعمل لديك

في **OpenClaw.app**:

- وضع الاتصال: **محلي**
  سيتصل التطبيق بالبوابة العاملة على المنفذ المُعدّ.

### 3) تحقق

- يجب أن تعرض حالة Gateway داخل التطبيق **"استخدام Gateway موجود ..."**
- أو عبر CLI:

```bash
openclaw health
```

### أخطاء شائعة

- **منفذ خاطئ:** القيمة الافتراضية لـ Gateway WS هي `ws://127.0.0.1:18789`؛ أبقِ التطبيق وCLI على المنفذ نفسه.
- **مكان وجود الحالة:**
  - حالة القناة/المزوّد: `~/.openclaw/credentials/`
  - ملفات تعريف مصادقة النموذج: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - الجلسات: `~/.openclaw/agents/<agentId>/sessions/`
  - السجلات: `/tmp/openclaw/`

## خريطة تخزين بيانات الاعتماد

استخدم هذا عند تصحيح المصادقة أو تحديد ما يجب نسخه احتياطيًا:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **رمز بوت Telegram**: الإعدادات/env أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفض الروابط الرمزية)
- **رمز بوت Discord**: الإعدادات/env أو SecretRef (مزوّدو env/file/exec)
- **رموز Slack**: الإعدادات/env (`channels.slack.*`)
- **قوائم السماح بالاقتران**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (الحساب الافتراضي)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (الحسابات غير الافتراضية)
- **ملفات تعريف مصادقة النموذج**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **حمولة الأسرار المدعومة بملف (اختياري)**: `~/.openclaw/secrets.json`
- **استيراد OAuth القديم**: `~/.openclaw/credentials/oauth.json`
  مزيد من التفاصيل: [الأمان](/ar/gateway/security#credential-storage-map).

## التحديث (من دون إفساد إعدادك)

- أبقِ `~/.openclaw/workspace` و`~/.openclaw/` بوصفهما "أشياءك الخاصة"؛ لا تضع المطالبات/الإعدادات الشخصية داخل مستودع `openclaw`.
- تحديث المصدر: `git pull` + `pnpm install` + تابع استخدام `pnpm gateway:watch`.

## Linux (خدمة مستخدم systemd)

تستخدم تثبيتات Linux خدمة **مستخدم** systemd. افتراضيًا، يوقف systemd خدمات
المستخدم عند تسجيل الخروج/الخمول، ما يقتل Gateway. يحاول الإعداد الأولي تفعيل
الإبقاء لك (قد يطلب sudo). إذا كان لا يزال معطلًا، فشغّل:

```bash
sudo loginctl enable-linger $USER
```

للخوادم الدائمة التشغيل أو متعددة المستخدمين، فكّر في خدمة **نظام** بدلًا من
خدمة مستخدم (لا حاجة إلى الإبقاء). راجع [دليل تشغيل Gateway](/ar/gateway) لملاحظات systemd.

## مستندات ذات صلة

- [دليل تشغيل Gateway](/ar/gateway) (الأعلام، الإشراف، المنافذ)
- [إعدادات Gateway](/ar/gateway/configuration) (مخطط الإعدادات + أمثلة)
- [Discord](/ar/channels/discord) و[Telegram](/ar/channels/telegram) (وسوم الرد + إعدادات replyToMode)
- [إعداد مساعد OpenClaw](/ar/start/openclaw)
- [تطبيق macOS](/ar/platforms/macos) (دورة حياة Gateway)
