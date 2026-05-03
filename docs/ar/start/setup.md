---
read_when:
    - إعداد جهاز جديد
    - تريد «الأحدث + الأفضل» من دون تعطيل إعدادك الشخصي
summary: الإعداد المتقدم وسير عمل التطوير لـ OpenClaw
title: الإعداد
x-i18n:
    generated_at: "2026-05-03T21:42:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d12f319ab4c60be7ff6538ffd28626f425f7df1a10bbe08cceb59eef3662c75
    source_path: start/setup.md
    workflow: 16
---

<Note>
إذا كنت تقوم بالإعداد للمرة الأولى، فابدأ بـ [بدء الاستخدام](/ar/start/getting-started).
لتفاصيل التهيئة الأولية، راجع [التهيئة الأولية (CLI)](/ar/start/wizard).
</Note>

## الخلاصة

اختر سير عمل الإعداد بناءً على مدى تكرار رغبتك في التحديثات، وما إذا كنت تريد تشغيل Gateway بنفسك:

- **تعيش التخصيصات خارج المستودع:** احتفظ بإعداداتك ومساحة عملك في `~/.openclaw/openclaw.json` و`~/.openclaw/workspace/` حتى لا تمسها تحديثات المستودع.
- **سير العمل المستقر (موصى به لمعظم المستخدمين):** ثبّت تطبيق macOS واتركه يشغّل Gateway المضمّن.
- **سير العمل الأحدث وغير المستقر (للتطوير):** شغّل Gateway بنفسك عبر `pnpm gateway:watch`، ثم دع تطبيق macOS يتصل في الوضع المحلي.

## المتطلبات المسبقة (من المصدر)

- يوصى باستخدام Node 24 (لا يزال Node 22 LTS، حاليًا `22.14+`، مدعومًا)
- يلزم `pnpm` لعمليات السحب من المصدر. يحمّل OpenClaw الـ plugins المضمّنة من حزم مساحة عمل pnpm في
  `extensions/*` في وضع التطوير، لذلك لا يجهّز `npm install` في الجذر شجرة المصدر بالكامل.
- Docker (اختياري؛ فقط للإعداد/الاختبار الشامل داخل الحاويات — راجع [Docker](/ar/install/docker))

## استراتيجية التخصيص (حتى لا تسبب التحديثات ضررًا)

إذا كنت تريد “تخصيصًا بنسبة 100% لي” _مع_ تحديثات سهلة، فاحتفظ بتخصيصك في:

- **الإعدادات:** `~/.openclaw/openclaw.json` (JSON/شبيه بـ JSON5)
- **مساحة العمل:** `~/.openclaw/workspace` (Skills، المطالبات، الذكريات؛ اجعلها مستودع git خاصًا)

قم بالتمهيد مرة واحدة:

```bash
openclaw setup
```

من داخل هذا المستودع، استخدم إدخال CLI المحلي:

```bash
openclaw setup
```

إذا لم يكن لديك تثبيت عام بعد، فشغّله عبر `pnpm openclaw setup`.

## تشغيل Gateway من هذا المستودع

بعد `pnpm build`، يمكنك تشغيل CLI المعبأ مباشرة:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## سير العمل المستقر (تطبيق macOS أولًا)

1. ثبّت وشغّل **OpenClaw.app** (شريط القوائم).
2. أكمل قائمة التحقق الخاصة بالتهيئة الأولية/الأذونات (مطالبات TCC).
3. تأكد من أن Gateway في وضع **محلي** ويعمل (يديره التطبيق).
4. اربط الأسطح (مثال: WhatsApp):

```bash
openclaw channels login
```

5. فحص سريع:

```bash
openclaw health
```

إذا لم تكن التهيئة الأولية متاحة في إصدارك:

- شغّل `openclaw setup`، ثم `openclaw channels login`، ثم ابدأ Gateway يدويًا (`openclaw gateway`).

## سير العمل الأحدث وغير المستقر (Gateway في الطرفية)

الهدف: العمل على TypeScript Gateway، والحصول على إعادة تحميل ساخنة، وإبقاء واجهة تطبيق macOS متصلة.

### 0) (اختياري) شغّل تطبيق macOS من المصدر أيضًا

إذا كنت تريد أيضًا تطبيق macOS على أحدث إصدار غير مستقر:

```bash
./scripts/restart-mac.sh
```

### 1) ابدأ Gateway للتطوير

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

يبدأ `gateway:watch` أو يعيد تشغيل عملية مراقبة Gateway في جلسة tmux مسماة
ويتصل تلقائيًا من الطرفيات التفاعلية. تبقى الصدفات غير التفاعلية منفصلة
وتطبع `tmux attach -t openclaw-gateway-watch-main`؛ استخدم
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` لإبقاء التشغيل التفاعلي
منفصلًا، أو `pnpm gateway:watch:raw` لوضع المراقبة في الواجهة. يعيد المراقب
التحميل عند تغييرات المصدر والإعدادات وبيانات تعريف الـ plugins المضمّنة ذات الصلة. إذا خرج
Gateway المراقَب أثناء بدء التشغيل، يشغّل `gateway:watch`
`openclaw doctor --fix --non-interactive` مرة واحدة ويعيد المحاولة؛ اضبط
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` لتعطيل خطوة الإصلاح الخاصة بالتطوير فقط.
`pnpm openclaw setup` هي خطوة تهيئة الإعدادات/مساحة العمل المحلية لمرة واحدة لعملية سحب جديدة.
لا يعيد `pnpm gateway:watch` بناء `dist/control-ui`، لذلك أعد تشغيل `pnpm ui:build` بعد تغييرات `ui/` أو استخدم `pnpm ui:dev` أثناء تطوير واجهة التحكم.

### 2) وجّه تطبيق macOS إلى Gateway الجاري

في **OpenClaw.app**:

- وضع الاتصال: **محلي**
  سيتصل التطبيق بالـ gateway الجاري على المنفذ المضبوط.

### 3) التحقق

- يجب أن تعرض حالة Gateway داخل التطبيق **“يستخدم gateway موجودًا …”**
- أو عبر CLI:

```bash
openclaw health
```

### الأخطاء الشائعة

- **منفذ خاطئ:** القيمة الافتراضية لـ Gateway WS هي `ws://127.0.0.1:18789`؛ أبقِ التطبيق وCLI على المنفذ نفسه.
- **مكان وجود الحالة:**
  - حالة القناة/المزوّد: `~/.openclaw/credentials/`
  - ملفات تعريف مصادقة النموذج: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - الجلسات: `~/.openclaw/agents/<agentId>/sessions/`
  - السجلات: `/tmp/openclaw/`

## خريطة تخزين بيانات الاعتماد

استخدم هذا عند تصحيح المصادقة أو تحديد ما يجب نسخه احتياطيًا:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **رمز بوت Telegram**: إعدادات/بيئة أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفض الروابط الرمزية)
- **رمز بوت Discord**: إعدادات/بيئة أو SecretRef (مزوّدو env/file/exec)
- **رموز Slack**: إعدادات/بيئة (`channels.slack.*`)
- **قوائم السماح بالاقتران**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (الحساب الافتراضي)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (الحسابات غير الافتراضية)
- **ملفات تعريف مصادقة النموذج**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **حمولة الأسرار المستندة إلى ملف (اختياري)**: `~/.openclaw/secrets.json`
- **استيراد OAuth القديم**: `~/.openclaw/credentials/oauth.json`
  مزيد من التفاصيل: [الأمان](/ar/gateway/security#credential-storage-map).

## التحديث (دون إفساد إعدادك)

- احتفظ بـ `~/.openclaw/workspace` و`~/.openclaw/` بوصفهما “أشياءك الخاصة”؛ لا تضع المطالبات/الإعدادات الشخصية داخل مستودع `openclaw`.
- تحديث المصدر: `git pull` + `pnpm install` + الاستمرار في استخدام `pnpm gateway:watch`.

## Linux (خدمة مستخدم systemd)

تستخدم تثبيتات Linux خدمة **مستخدم** من systemd. افتراضيًا، يوقف systemd خدمات المستخدم
عند تسجيل الخروج/الخمول، مما يوقف Gateway. تحاول التهيئة الأولية تمكين
الاستمرار لك (قد تطلب sudo). إذا كان لا يزال متوقفًا، فشغّل:

```bash
sudo loginctl enable-linger $USER
```

للخوادم الدائمة التشغيل أو متعددة المستخدمين، فكّر في خدمة **نظام** بدلًا من
خدمة مستخدم (لا حاجة إلى الاستمرار). راجع [دليل تشغيل Gateway](/ar/gateway) لملاحظات systemd.

## مستندات ذات صلة

- [دليل تشغيل Gateway](/ar/gateway) (العلامات، الإشراف، المنافذ)
- [إعدادات Gateway](/ar/gateway/configuration) (مخطط الإعدادات + أمثلة)
- [Discord](/ar/channels/discord) و[Telegram](/ar/channels/telegram) (وسوم الرد + إعدادات replyToMode)
- [إعداد مساعد OpenClaw](/ar/start/openclaw)
- [تطبيق macOS](/ar/platforms/macos) (دورة حياة gateway)
