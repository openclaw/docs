---
read_when:
    - إعداد جهاز جديد
    - تريد «الأحدث والأفضل» من دون تعطيل إعدادك الشخصي
summary: إعدادات متقدمة وسير عمل تطوير OpenClaw
title: الإعداد
x-i18n:
    generated_at: "2026-07-16T15:09:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c40d6d2bf2814465f3cc49c65d4c1498671420af728ce8012d13af3fba67025a
    source_path: start/setup.md
    workflow: 16
---

<Note>
إذا كنت تُجري الإعداد للمرة الأولى، فابدأ بـ[بدء الاستخدام](/ar/start/getting-started).
للاطلاع على تفاصيل التهيئة الأولية، راجع [التهيئة الأولية (CLI)](/ar/start/wizard).
</Note>

## الخلاصة

اختر سير عمل للإعداد بناءً على مدى تكرار التحديثات التي تريدها وما إذا كنت تريد تشغيل Gateway بنفسك:

- **توجد التخصيصات خارج المستودع:** احتفظ بإعداداتك ومساحة عملك في `~/.openclaw/openclaw.json` و`~/.openclaw/workspace/` حتى لا تؤثر فيهما تحديثات المستودع.
- **سير العمل المستقر (موصى به لمعظم المستخدمين):** ثبّت تطبيق macOS ودعه يشغّل Gateway المضمّن.
- **سير عمل أحدث الميزات (للتطوير):** شغّل Gateway بنفسك عبر `pnpm gateway:watch`، ثم دع تطبيق macOS يتصل به في الوضع المحلي.

## المتطلبات الأساسية (من المصدر)

- يوصى باستخدام Node 24.15+ (لا يزال Node 22 LTS، حاليًا `22.22.3+`، مدعومًا)
- يلزم `pnpm` لعمليات سحب الشيفرة المصدرية. يحمّل OpenClaw الـ plugins المضمّنة من حزم مساحة عمل pnpm في
  `extensions/*` ضمن وضع التطوير، ولذلك لا يُعِدّ `npm install` في الجذر
  شجرة المصدر كاملة.
- Docker (اختياري؛ للإعداد ضمن حاويات/اختبارات e2e فقط — راجع [Docker](/ar/install/docker))

## استراتيجية التخصيص (حتى لا تتسبب التحديثات في مشكلات)

إذا كنت تريد إعدادًا «مخصصًا لي بنسبة 100%» _مع_ سهولة التحديث، فاحتفظ بتخصيصاتك في:

- **الإعدادات:** `~/.openclaw/openclaw.json` (JSON/شبيه بـ JSON5)
- **مساحة العمل:** `~/.openclaw/workspace` (Skills والموجّهات والذكريات؛ اجعلها مستودع git خاصًا)

هيّئ مجلدَي الإعدادات ومساحة العمل مرة واحدة، من دون تشغيل معالج التهيئة الأولية الكامل:

```bash
openclaw setup --baseline
```

لم تُجرِ تثبيتًا عامًا بعد؟ شغّله من هذا المستودع بدلًا من ذلك:

```bash
pnpm openclaw setup --baseline
```

(يُعدّ `openclaw setup` المجرّد، من دون `--baseline`، اسمًا بديلًا لـ `openclaw onboard` ويشغّل المعالج التفاعلي الكامل.)

## تشغيل Gateway من هذا المستودع

بعد `pnpm build`، يمكنك تشغيل CLI المضمّن في الحزمة مباشرةً:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## سير العمل المستقر (تطبيق macOS أولًا)

1. ثبّت **OpenClaw.app** وشغّله (شريط القوائم).
2. أكمل قائمة التحقق الخاصة بالتهيئة الأولية/الأذونات (مطالبات TCC).
3. تأكد من أن Gateway في الوضع **Local** وقيد التشغيل (يديره التطبيق).
4. اربط قنوات الاتصال (مثال: WhatsApp):

```bash
openclaw channels login
```

5. تحقق سريع:

```bash
openclaw health
```

إذا لم تكن التهيئة الأولية متاحة في نسختك:

- شغّل `openclaw setup`، ثم `openclaw channels login`، ثم ابدأ Gateway يدويًا (`openclaw gateway`).

## سير عمل أحدث الميزات (Gateway في نافذة طرفية)

الهدف: العمل على Gateway المكتوب بلغة TypeScript، والحصول على إعادة تحميل فورية، وإبقاء واجهة تطبيق macOS متصلة.

### 0) (اختياري) تشغيل تطبيق macOS من المصدر أيضًا

إذا كنت تريد أيضًا استخدام أحدث نسخة تطويرية من تطبيق macOS:

```bash
./scripts/restart-mac.sh
```

### 1) بدء Gateway الخاص بالتطوير

```bash
pnpm install
# التشغيل الأول فقط (أو بعد إعادة ضبط إعدادات/مساحة عمل OpenClaw المحلية)
pnpm openclaw setup
pnpm gateway:watch
```

يبدأ `gateway:watch` عملية مراقبة Gateway أو يعيد تشغيلها ضمن جلسة tmux
مُسمّاة (`openclaw-gateway-watch-main`)، ويتصل بها تلقائيًا من النوافذ الطرفية
التفاعلية. تبقى واجهات الأوامر غير التفاعلية منفصلة وتطبع
`tmux attach -t openclaw-gateway-watch-main`؛ استخدم
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` لإبقاء التشغيل التفاعلي
منفصلًا، أو `pnpm gateway:watch:raw` لوضع المراقبة في الواجهة الأمامية. يوقف المراقب
خدمة Gateway المثبّتة للملف الشخصي النشط قبل تولّي
المنفذ المضبوط/الافتراضي، ما يمنع مشرف الخدمة من استبدال
عملية المصدر. تظل الخدمة مثبّتة؛ شغّل `pnpm openclaw gateway start`
عند الانتهاء من المراقبة. يظل جزء tmux متاحًا بعد فشل بدء التشغيل
حتى تتمكن نافذة طرفية أخرى أو وكيل آخر من الاتصال به أو التقاط سجلاته. يعيد المراقب
التحميل عند حدوث تغييرات ذات صلة في المصدر والإعدادات والبيانات الوصفية للـ plugins المضمّنة. إذا خرج
Gateway المراقَب أثناء بدء التشغيل، يشغّل `gateway:watch`
الأمر `openclaw doctor --fix --non-interactive` مرة واحدة ثم يعيد المحاولة؛ اضبط
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` لتعطيل مرحلة الإصلاح المخصصة للتطوير فقط.
لا يعيد `pnpm gateway:watch` بناء `dist/control-ui`، لذا أعد تشغيل `pnpm ui:build` بعد تغييرات `ui/` أو استخدم `pnpm ui:dev` أثناء تطوير واجهة التحكم.

### 2) توجيه تطبيق macOS إلى Gateway قيد التشغيل

في **OpenClaw.app**:

- Connection Mode: **Local**
  سيتصل التطبيق بـ Gateway قيد التشغيل على المنفذ المضبوط.

### 3) التحقق

- يجب أن تعرض حالة Gateway داخل التطبيق **"Using existing gateway …"**
- أو عبر CLI:

```bash
openclaw health
```

### الأخطاء الشائعة

- **المنفذ الخاطئ:** يستخدم اتصال WS الخاص بـ Gateway المنفذ `ws://127.0.0.1:18789` افتراضيًا؛ أبقِ التطبيق وCLI على المنفذ نفسه.
- **أماكن تخزين الحالة:**
  - حالة القناة/المزوّد: `~/.openclaw/credentials/`
  - ملفات تعريف مصادقة النموذج: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - الجلسات والنصوص المفرّغة: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  - آثار الجلسات القديمة/المؤرشفة: `~/.openclaw/agents/<agentId>/sessions/`
  - السجلات: `/tmp/openclaw/`

## خريطة تخزين بيانات الاعتماد

استخدم هذه الخريطة عند تصحيح مشكلات المصادقة أو تحديد ما ينبغي نسخه احتياطيًا:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **رمز بوت Telegram**: الإعدادات/متغيرات البيئة أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفض الروابط الرمزية)
- **رمز بوت Discord**: الإعدادات/متغيرات البيئة أو SecretRef (مزوّدو env/file/exec)
- **رموز Slack**: الإعدادات/متغيرات البيئة (`channels.slack.*`)
- **قوائم السماح بالاقتران**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (الحساب الافتراضي)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (الحسابات غير الافتراضية)
- **ملفات تعريف مصادقة النموذج**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **حمولة الأسرار المخزّنة في ملف (اختياري)**: `~/.openclaw/secrets.json`
- **استيراد OAuth القديم**: `~/.openclaw/credentials/oauth.json`
  مزيد من التفاصيل: [الأمان](/ar/gateway/security#credential-storage-map).

## التحديث (من دون إفساد إعدادك)

- احتفظ بـ `~/.openclaw/workspace` و`~/.openclaw/` بوصفهما «ملفاتك الخاصة»؛ لا تضع موجّهاتك أو إعداداتك الشخصية في مستودع `openclaw`.
- تحديث المصدر: `git pull` + `pnpm install` + واصل استخدام `pnpm gateway:watch`.

## Linux (خدمة مستخدم systemd)

تستخدم عمليات التثبيت على Linux خدمة **مستخدم** تابعة لـ systemd. يوقف systemd افتراضيًا
خدمات المستخدم عند تسجيل الخروج/الخمول، ما يؤدي إلى إيقاف Gateway. تحاول التهيئة الأولية تمكين
استمرار الخدمة نيابةً عنك (وقد تطلب sudo). إذا ظل معطّلًا، فشغّل:

```bash
sudo loginctl enable-linger $USER
```

بالنسبة إلى الخوادم دائمة التشغيل أو متعددة المستخدمين، فكّر في استخدام خدمة **نظام**
بدلًا من خدمة مستخدم (لا حاجة إلى استمرار الخدمة). راجع [دليل تشغيل Gateway](/ar/gateway) للاطلاع على ملاحظات systemd.

## مستندات ذات صلة

- [دليل تشغيل Gateway](/ar/gateway) (العلامات والإشراف والمنافذ)
- [إعداد Gateway](/ar/gateway/configuration) (مخطط الإعدادات + أمثلة)
- [Discord](/ar/channels/discord) و[Telegram](/ar/channels/telegram) (وسوم الرد + إعدادات replyToMode)
- [إعداد مساعد OpenClaw](/ar/start/openclaw)
- [تطبيق macOS](/ar/platforms/macos) (دورة حياة Gateway)
