---
read_when:
    - إعداد جهاز جديد
    - تريد «الأحدث + الأفضل» من دون تعطيل إعدادك الشخصي
summary: الإعداد المتقدم ومسارات عمل التطوير لـ OpenClaw
title: الإعداد
x-i18n:
    generated_at: "2026-05-06T08:14:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99b65443deac92ed74d2fb0d8db9a00bf81b37d60ce25c0c38c1f8d9a7c0cfd3
    source_path: start/setup.md
    workflow: 16
---

<Note>
إذا كنت تُعدّه للمرة الأولى، فابدأ بـ [البدء](/ar/start/getting-started).
لتفاصيل الإعداد الأولي، راجع [الإعداد الأولي (CLI)](/ar/start/wizard).
</Note>

## الخلاصة

اختر سير عمل الإعداد بناءً على مدى رغبتك في تلقي التحديثات وما إذا كنت تريد تشغيل Gateway بنفسك:

- **التخصيصات تبقى خارج المستودع:** احتفظ بالتهيئة ومساحة العمل في `~/.openclaw/openclaw.json` و`~/.openclaw/workspace/` حتى لا تمسّها تحديثات المستودع.
- **سير العمل المستقر (موصى به لمعظم المستخدمين):** ثبّت تطبيق macOS ودعه يشغّل Gateway المضمّن.
- **سير عمل الحافة الأحدث (للتطوير):** شغّل Gateway بنفسك عبر `pnpm gateway:watch`، ثم دع تطبيق macOS يتصل في الوضع المحلي.

## المتطلبات المسبقة (من المصدر)

- يوصى باستخدام Node 24 (ما زال Node 22 LTS، وحاليًا `22.14+`، مدعومًا)
- `pnpm` مطلوب لنسخ المصدر. يحمّل OpenClaw الـ plugins المضمّنة من حزم مساحة عمل pnpm ضمن
  `extensions/*` في وضع التطوير، لذلك لا يجهّز `npm install` من الجذر
  شجرة المصدر الكاملة.
- Docker (اختياري؛ لإعداد الحاويات/e2e فقط - راجع [Docker](/ar/install/docker))

## استراتيجية التخصيص (حتى لا تضرّ التحديثات)

إذا كنت تريد "تخصيصًا 100% لي" _وتحديثات سهلة_، فاحتفظ بتخصيصك في:

- **التهيئة:** `~/.openclaw/openclaw.json` (JSON/شبيه بـ JSON5)
- **مساحة العمل:** `~/.openclaw/workspace` (Skills، المطالبات، الذكريات؛ اجعلها مستودع git خاصًا)

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

بعد `pnpm build`، يمكنك تشغيل CLI المعبأ مباشرة:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## سير العمل المستقر (تطبيق macOS أولًا)

1. ثبّت وشغّل **OpenClaw.app** (شريط القوائم).
2. أكمل قائمة تحقق الإعداد الأولي/الأذونات (مطالبات TCC).
3. تأكد أن Gateway في الوضع **المحلي** ويعمل (التطبيق يديره).
4. اربط الأسطح (مثال: WhatsApp):

```bash
openclaw channels login
```

5. تحقق من السلامة:

```bash
openclaw health
```

إذا لم يكن الإعداد الأولي متاحًا في بنائك:

- شغّل `openclaw setup`، ثم `openclaw channels login`، ثم ابدأ Gateway يدويًا (`openclaw gateway`).

## سير عمل الحافة الأحدث (Gateway في طرفية)

الهدف: العمل على TypeScript Gateway، والحصول على إعادة تحميل ساخنة، وإبقاء واجهة تطبيق macOS متصلة.

### 0) (اختياري) شغّل تطبيق macOS من المصدر أيضًا

إذا كنت تريد تطبيق macOS على الحافة الأحدث أيضًا:

```bash
./scripts/restart-mac.sh
```

### 1) ابدأ Gateway التطويري

```bash
pnpm install
# التشغيل الأول فقط (أو بعد إعادة ضبط تهيئة/مساحة عمل OpenClaw المحلية)
pnpm openclaw setup
pnpm gateway:watch
```

يبدأ `gateway:watch` أو يعيد تشغيل عملية مراقبة Gateway في جلسة tmux
مسمّاة ويتصل بها تلقائيًا من الطرفيات التفاعلية. تبقى الأصداف غير التفاعلية
منفصلة وتطبع `tmux attach -t openclaw-gateway-watch-main`؛ استخدم
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` لإبقاء تشغيل تفاعلي
منفصلًا، أو `pnpm gateway:watch:raw` لوضع المراقبة في الواجهة. يعيد المراقب
التحميل عند تغييرات المصدر والتهيئة وبيانات metadata الخاصة بالـ plugin المضمّن ذات الصلة. إذا خرج
Gateway المُراقَب أثناء بدء التشغيل، يشغّل `gateway:watch`
`openclaw doctor --fix --non-interactive` مرة واحدة ويعيد المحاولة؛ عيّن
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` لتعطيل تمريرة الإصلاح الخاصة بالتطوير فقط.
`pnpm openclaw setup` هي خطوة تهيئة الإعداد المحلي/مساحة العمل لمرة واحدة لنسخة مصدر جديدة.
لا يعيد `pnpm gateway:watch` بناء `dist/control-ui`، لذلك أعد تشغيل `pnpm ui:build` بعد تغييرات `ui/` أو استخدم `pnpm ui:dev` أثناء تطوير Control UI.

### 2) وجّه تطبيق macOS إلى Gateway العامل لديك

في **OpenClaw.app**:

- وضع الاتصال: **محلي**
  سيتصل التطبيق بالـ gateway العامل على المنفذ المهيأ.

### 3) تحقق

- يجب أن تعرض حالة Gateway داخل التطبيق **"استخدام gateway موجود …"**
- أو عبر CLI:

```bash
openclaw health
```

### الأخطاء الشائعة

- **منفذ خاطئ:** افتراضي Gateway WS هو `ws://127.0.0.1:18789`؛ أبقِ التطبيق وCLI على المنفذ نفسه.
- **أين توجد الحالة:**
  - حالة القناة/المزوّد: `~/.openclaw/credentials/`
  - ملفات تعريف مصادقة النموذج: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - الجلسات: `~/.openclaw/agents/<agentId>/sessions/`
  - السجلات: `/tmp/openclaw/`

## خريطة تخزين بيانات الاعتماد

استخدم هذا عند تصحيح المصادقة أو تحديد ما يجب نسخه احتياطيًا:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **رمز Telegram bot**: التهيئة/البيئة أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفض الروابط الرمزية)
- **رمز Discord bot**: التهيئة/البيئة أو SecretRef (مزوّدو env/file/exec)
- **رموز Slack**: التهيئة/البيئة (`channels.slack.*`)
- **قوائم السماح بالاقتران**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (الحساب الافتراضي)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (الحسابات غير الافتراضية)
- **ملفات تعريف مصادقة النموذج**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **حمولة الأسرار المستندة إلى ملف (اختياري)**: `~/.openclaw/secrets.json`
- **استيراد OAuth القديم**: `~/.openclaw/credentials/oauth.json`
  مزيد من التفاصيل: [الأمان](/ar/gateway/security#credential-storage-map).

## التحديث (من دون إفساد إعدادك)

- احتفظ بـ `~/.openclaw/workspace` و`~/.openclaw/` كـ "أغراضك"؛ لا تضع المطالبات/التهيئة الشخصية داخل مستودع `openclaw`.
- تحديث المصدر: `git pull` + `pnpm install` + الاستمرار في استخدام `pnpm gateway:watch`.

## Linux (خدمة مستخدم systemd)

تستخدم تثبيتات Linux خدمة systemd **للمستخدم**. افتراضيًا، يوقف systemd خدمات
المستخدم عند تسجيل الخروج/الخمول، ما يقتل Gateway. يحاول الإعداد الأولي تمكين
البقاء لك (قد يطلب sudo). إذا كان ما زال متوقفًا، فشغّل:

```bash
sudo loginctl enable-linger $USER
```

للخوادم العاملة دائمًا أو متعددة المستخدمين، ضع في اعتبارك خدمة **نظام** بدلًا من
خدمة مستخدم (لا حاجة إلى البقاء). راجع [دليل تشغيل Gateway](/ar/gateway) لملاحظات systemd.

## مستندات ذات صلة

- [دليل تشغيل Gateway](/ar/gateway) (الرايات، الإشراف، المنافذ)
- [تهيئة Gateway](/ar/gateway/configuration) (مخطط التهيئة + أمثلة)
- [Discord](/ar/channels/discord) و[Telegram](/ar/channels/telegram) (وسوم الرد + إعدادات replyToMode)
- [إعداد مساعد OpenClaw](/ar/start/openclaw)
- [تطبيق macOS](/ar/platforms/macos) (دورة حياة gateway)
