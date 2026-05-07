---
read_when:
    - إعداد جهاز جديد
    - تريد "الأحدث + الأفضل" دون إفساد إعدادك الشخصي
summary: الإعداد المتقدم وسير عمل التطوير لـ OpenClaw
title: الإعداد
x-i18n:
    generated_at: "2026-05-07T13:29:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9325ebfc2c5868e44fba18b75ca27cd9333a8bc7072e933468e1608dde487a8e
    source_path: start/setup.md
    workflow: 16
---

<Note>
إذا كنت تُعدّه للمرة الأولى، فابدأ بـ [بدء الاستخدام](/ar/start/getting-started).
لتفاصيل الإعداد الأولي، راجع [الإعداد الأولي (CLI)](/ar/start/wizard).
</Note>

## الخلاصة

اختر مسار إعداد بناءً على مدى رغبتك في تلقي التحديثات، وما إذا كنت تريد تشغيل Gateway بنفسك:

- **التخصيص يبقى خارج المستودع:** أبقِ إعداداتك ومساحة عملك في `~/.openclaw/openclaw.json` و`~/.openclaw/workspace/` حتى لا تمسّها تحديثات المستودع.
- **مسار مستقر (موصى به لمعظم المستخدمين):** ثبّت تطبيق macOS واتركه يشغّل Gateway المضمّن.
- **مسار الإصدارات الأحدث (للتطوير):** شغّل Gateway بنفسك عبر `pnpm gateway:watch`، ثم دع تطبيق macOS يتصل في وضع Local.

## المتطلبات المسبقة (من المصدر)

- يوصى باستخدام Node 24 (ما زال Node 22 LTS، حاليًا `22.16+`، مدعومًا)
- `pnpm` مطلوب لنسخ المصدر. يحمّل OpenClaw المكوّنات الإضافية المضمّنة من حزم مساحة عمل pnpm
  `extensions/*` في وضع التطوير، لذلك لا يجهّز `npm install` في الجذر شجرة المصدر الكاملة.
- Docker (اختياري؛ فقط للإعداد/اختبارات e2e داخل حاويات - راجع [Docker](/ar/install/docker))

## استراتيجية التخصيص (حتى لا تضرّك التحديثات)

إذا أردت "تخصيصًا بنسبة 100% يناسبني" _مع_ تحديثات سهلة، فأبقِ تخصيصك في:

- **الإعدادات:** `~/.openclaw/openclaw.json` (على نمط JSON/JSON5)
- **مساحة العمل:** `~/.openclaw/workspace` (Skills، مطالبات، ذاكرات؛ اجعلها مستودع git خاصًا)

مهّد مرة واحدة:

```bash
openclaw setup
```

من داخل هذا المستودع، استخدم مدخل CLI المحلي:

```bash
openclaw setup
```

إذا لم يكن لديك تثبيت عام بعد، فشغّله عبر `pnpm openclaw setup`.

## تشغيل Gateway من هذا المستودع

بعد `pnpm build`، يمكنك تشغيل CLI المحزّم مباشرة:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## المسار المستقر (تطبيق macOS أولًا)

1. ثبّت وشغّل **OpenClaw.app** (شريط القوائم).
2. أكمل قائمة التحقق الخاصة بالإعداد الأولي/الأذونات (مطالبات TCC).
3. تأكد أن Gateway في وضع **Local** وقيد التشغيل (يديره التطبيق).
4. اربط الواجهات (مثال: WhatsApp):

```bash
openclaw channels login
```

5. تحقق من السلامة:

```bash
openclaw health
```

إذا لم يكن الإعداد الأولي متاحًا في البنية لديك:

- شغّل `openclaw setup`، ثم `openclaw channels login`، ثم ابدأ Gateway يدويًا (`openclaw gateway`).

## مسار الإصدارات الأحدث (Gateway في طرفية)

الهدف: العمل على Gateway المكتوب بـ TypeScript، والحصول على إعادة تحميل ساخنة، وإبقاء واجهة تطبيق macOS متصلة.

### 0) (اختياري) شغّل تطبيق macOS من المصدر أيضًا

إذا كنت تريد تطبيق macOS على الإصدارات الأحدث أيضًا:

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

يبدأ `gateway:watch` عملية مراقبة Gateway أو يعيد تشغيلها داخل جلسة tmux
مسمّاة، ويتصل تلقائيًا من الطرفيات التفاعلية. تبقى الأصداف غير التفاعلية
منفصلة وتطبع `tmux attach -t openclaw-gateway-watch-main`؛ استخدم
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` لإبقاء التشغيل التفاعلي
منفصلًا، أو `pnpm gateway:watch:raw` لوضع المراقبة في الواجهة. يعيد المراقب
التحميل عند تغييرات المصدر والإعدادات وبيانات وصف المكوّنات الإضافية المضمّنة ذات الصلة. إذا خرج
Gateway المراقَب أثناء بدء التشغيل، يشغّل `gateway:watch`
`openclaw doctor --fix --non-interactive` مرة واحدة ثم يعيد المحاولة؛ عيّن
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` لتعطيل خطوة الإصلاح الخاصة بالتطوير فقط.
`pnpm openclaw setup` هي خطوة تهيئة الإعدادات/مساحة العمل المحلية لمرة واحدة لنسخة مصدر جديدة.
لا يعيد `pnpm gateway:watch` بناء `dist/control-ui`، لذلك أعد تشغيل `pnpm ui:build` بعد تغييرات `ui/` أو استخدم `pnpm ui:dev` أثناء تطوير Control UI.

### 2) وجّه تطبيق macOS إلى Gateway العامل لديك

في **OpenClaw.app**:

- وضع الاتصال: **Local**
  سيتصل التطبيق بـ Gateway العامل على المنفذ المضبوط.

### 3) تحقق

- يجب أن تعرض حالة Gateway داخل التطبيق **"Using existing gateway …"**
- أو عبر CLI:

```bash
openclaw health
```

### مشكلات شائعة

- **منفذ خاطئ:** الإعداد الافتراضي لـ Gateway WS هو `ws://127.0.0.1:18789`؛ أبقِ التطبيق وCLI على المنفذ نفسه.
- **مكان وجود الحالة:**
  - حالة القناة/المزوّد: `~/.openclaw/credentials/`
  - ملفات تعريف مصادقة النموذج: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - الجلسات: `~/.openclaw/agents/<agentId>/sessions/`
  - السجلات: `/tmp/openclaw/`

## خريطة تخزين بيانات الاعتماد

استخدم هذا عند تصحيح المصادقة أو تحديد ما يجب نسخه احتياطيًا:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **رمز Telegram للبوت**: الإعدادات/env أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفض الروابط الرمزية)
- **رمز Discord للبوت**: الإعدادات/env أو SecretRef (مزوّدو env/file/exec)
- **رموز Slack**: الإعدادات/env (`channels.slack.*`)
- **قوائم السماح للاقتران**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (الحساب الافتراضي)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (الحسابات غير الافتراضية)
- **ملفات تعريف مصادقة النموذج**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **حمولة الأسرار المدعومة بملف (اختياري)**: `~/.openclaw/secrets.json`
- **استيراد OAuth القديم**: `~/.openclaw/credentials/oauth.json`
  تفاصيل أكثر: [الأمان](/ar/gateway/security#credential-storage-map).

## التحديث (من دون إتلاف إعدادك)

- أبقِ `~/.openclaw/workspace` و`~/.openclaw/` باعتبارهما "أشياءك الخاصة"؛ لا تضع المطالبات/الإعدادات الشخصية داخل مستودع `openclaw`.
- تحديث المصدر: `git pull` + `pnpm install` + الاستمرار في استخدام `pnpm gateway:watch`.

## Linux (خدمة systemd للمستخدم)

تستخدم تثبيتات Linux خدمة systemd **للمستخدم**. افتراضيًا، يوقف systemd خدمات المستخدم
عند تسجيل الخروج/الخمول، ما يقتل Gateway. يحاول الإعداد الأولي تفعيل
الاستبقاء نيابةً عنك (قد يطلب sudo). إذا بقي متوقفًا، فشغّل:

```bash
sudo loginctl enable-linger $USER
```

للخوادم التي تعمل دائمًا أو متعددة المستخدمين، فكّر في خدمة **نظام** بدلًا من
خدمة مستخدم (لا حاجة للاستبقاء). راجع [دليل تشغيل Gateway](/ar/gateway) لملاحظات systemd.

## مستندات ذات صلة

- [دليل تشغيل Gateway](/ar/gateway) (الأعلام، الإشراف، المنافذ)
- [إعدادات Gateway](/ar/gateway/configuration) (مخطط الإعدادات + أمثلة)
- [Discord](/ar/channels/discord) و[Telegram](/ar/channels/telegram) (وسوم الرد + إعدادات replyToMode)
- [إعداد مساعد OpenClaw](/ar/start/openclaw)
- [تطبيق macOS](/ar/platforms/macos) (دورة حياة Gateway)
