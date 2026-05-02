---
read_when:
    - إعداد جهاز جديد
    - تريد «الأحدث والأفضل» دون كسر إعدادك الشخصي
summary: الإعداد المتقدم وسير عمل التطوير لـ OpenClaw
title: الإعداد
x-i18n:
    generated_at: "2026-05-02T07:42:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 101f7911d4a4cba139dd7a464b2ed82e2c80c630ba6ea58486309642c6690ee9
    source_path: start/setup.md
    workflow: 16
---

<Note>
إذا كنت تقوم بالإعداد للمرة الأولى، فابدأ بـ [بدء الاستخدام](/ar/start/getting-started).
للحصول على تفاصيل التهيئة الأولية، راجع [التهيئة الأولية (CLI)](/ar/start/wizard).
</Note>

## المختصر

اختر سير عمل الإعداد بناءً على عدد المرات التي تريد فيها التحديثات وما إذا كنت تريد تشغيل Gateway بنفسك:

- **تبقى التخصيصات خارج المستودع:** احتفظ بإعداداتك ومساحة عملك في `~/.openclaw/openclaw.json` و`~/.openclaw/workspace/` حتى لا تمسها تحديثات المستودع.
- **سير العمل المستقر (موصى به لمعظم المستخدمين):** ثبّت تطبيق macOS واتركه يشغّل Gateway المضمّن.
- **سير عمل الحافة الأحدث (للتطوير):** شغّل Gateway بنفسك عبر `pnpm gateway:watch`، ثم دع تطبيق macOS يتصل في وضع Local.

## المتطلبات المسبقة (من المصدر)

- يوصى بـ Node 24 (لا يزال Node 22 LTS، حاليًا `22.14+`، مدعومًا)
- يتطلب استخراج المصدر `pnpm`. يحمّل OpenClaw plugins المضمّنة من حزم مساحة عمل pnpm في
  `extensions/*` في وضع التطوير، لذلك لا يجهّز تنفيذ `npm install` في الجذر
  شجرة المصدر كاملة.
- Docker (اختياري؛ فقط للإعداد/اختبارات e2e داخل الحاويات — راجع [Docker](/ar/install/docker))

## استراتيجية التخصيص (حتى لا تضرّ التحديثات)

إذا كنت تريد "تخصيصًا 100% لي" _مع_ تحديثات سهلة، فاحتفظ بتخصيصاتك في:

- **الإعدادات:** `~/.openclaw/openclaw.json` (JSON/يشبه JSON5)
- **مساحة العمل:** `~/.openclaw/workspace` (Skills، ومطالبات، وذكريات؛ اجعلها مستودع git خاصًا)

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

بعد `pnpm build`، يمكنك تشغيل CLI المعبّأ مباشرة:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## سير العمل المستقر (تطبيق macOS أولًا)

1. ثبّت وشغّل **OpenClaw.app** (شريط القوائم).
2. أكمل قائمة التحقق الخاصة بالتهيئة الأولية/الأذونات (مطالبات TCC).
3. تأكد من أن Gateway في وضع **Local** ويعمل (يديره التطبيق).
4. اربط الأسطح (مثال: WhatsApp):

```bash
openclaw channels login
```

5. تحقق سريعًا:

```bash
openclaw health
```

إذا لم تكن التهيئة الأولية متاحة في نسختك:

- شغّل `openclaw setup`، ثم `openclaw channels login`، ثم ابدأ Gateway يدويًا (`openclaw gateway`).

## سير عمل الحافة الأحدث (Gateway في الطرفية)

الهدف: العمل على Gateway المكتوب بـ TypeScript، والحصول على إعادة تحميل فورية، وإبقاء واجهة تطبيق macOS متصلة.

### 0) (اختياري) شغّل تطبيق macOS من المصدر أيضًا

إذا كنت تريد أيضًا تطبيق macOS على الحافة الأحدث:

```bash
./scripts/restart-mac.sh
```

### 1) ابدأ Gateway التطويري

```bash
pnpm install
# التشغيل الأول فقط (أو بعد إعادة ضبط إعدادات/مساحة عمل OpenClaw المحلية)
pnpm openclaw setup
pnpm gateway:watch
```

يبدأ `gateway:watch` أو يعيد تشغيل عملية مراقبة Gateway في جلسة tmux
مسمّاة ويتصل بها تلقائيًا من الطرفيات التفاعلية. تبقى الصدفات غير التفاعلية
منفصلة وتطبع `tmux attach -t openclaw-gateway-watch-main`؛ استخدم
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` لإبقاء التشغيل التفاعلي
منفصلًا، أو `pnpm gateway:watch:raw` لوضع المراقبة في الواجهة. يعيد المراقب
التحميل عند تغييرات المصدر والإعدادات وبيانات تعريف plugins المضمّنة ذات الصلة.
`pnpm openclaw setup` هي خطوة تهيئة الإعدادات/مساحة العمل المحلية لمرة واحدة لاستخراج جديد.
لا يعيد `pnpm gateway:watch` بناء `dist/control-ui`، لذلك أعد تشغيل `pnpm ui:build` بعد تغييرات `ui/` أو استخدم `pnpm ui:dev` أثناء تطوير Control UI.

### 2) وجّه تطبيق macOS إلى Gateway العامل لديك

في **OpenClaw.app**:

- وضع الاتصال: **Local**
  سيتصل التطبيق بالـ gateway العامل على المنفذ المضبوط.

### 3) تحقق

- يجب أن تعرض حالة Gateway داخل التطبيق **"استخدام gateway موجود ..."**
- أو عبر CLI:

```bash
openclaw health
```

### مزالق شائعة

- **منفذ خاطئ:** الإعداد الافتراضي لـ Gateway WS هو `ws://127.0.0.1:18789`؛ أبقِ التطبيق وCLI على المنفذ نفسه.
- **مكان وجود الحالة:**
  - حالة القنوات/المزوّدين: `~/.openclaw/credentials/`
  - ملفات تعريف مصادقة النماذج: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - الجلسات: `~/.openclaw/agents/<agentId>/sessions/`
  - السجلات: `/tmp/openclaw/`

## خريطة تخزين بيانات الاعتماد

استخدم هذا عند تصحيح أخطاء المصادقة أو تحديد ما يجب نسخه احتياطيًا:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **رمز بوت Telegram**: الإعدادات/البيئة أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفض الروابط الرمزية)
- **رمز بوت Discord**: الإعدادات/البيئة أو SecretRef (مزوّدو env/file/exec)
- **رموز Slack**: الإعدادات/البيئة (`channels.slack.*`)
- **قوائم السماح بالاقتران**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (الحساب الافتراضي)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (الحسابات غير الافتراضية)
- **ملفات تعريف مصادقة النماذج**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **حمولة الأسرار المدعومة بملف (اختياري)**: `~/.openclaw/secrets.json`
- **استيراد OAuth القديم**: `~/.openclaw/credentials/oauth.json`
  مزيد من التفاصيل: [الأمان](/ar/gateway/security#credential-storage-map).

## التحديث (من دون إفساد إعدادك)

- احتفظ بـ `~/.openclaw/workspace` و`~/.openclaw/` باعتبارهما "أشياءك الخاصة"؛ لا تضع المطالبات/الإعدادات الشخصية في مستودع `openclaw`.
- تحديث المصدر: `git pull` + `pnpm install` + متابعة استخدام `pnpm gateway:watch`.

## Linux (خدمة مستخدم systemd)

تستخدم تثبيتات Linux خدمة systemd خاصة بـ **المستخدم**. افتراضيًا، يوقف systemd خدمات المستخدم
عند تسجيل الخروج/الخمول، ما يقتل Gateway. تحاول التهيئة الأولية تمكين
lingering لك (قد تطلب sudo). إذا كان لا يزال متوقفًا، فشغّل:

```bash
sudo loginctl enable-linger $USER
```

للخوادم التي تعمل دائمًا أو متعددة المستخدمين، فكّر في خدمة **نظام** بدلًا من
خدمة مستخدم (لا حاجة إلى lingering). راجع [دليل تشغيل Gateway](/ar/gateway) لملاحظات systemd.

## مستندات ذات صلة

- [دليل تشغيل Gateway](/ar/gateway) (الأعلام، والإشراف، والمنافذ)
- [إعدادات Gateway](/ar/gateway/configuration) (مخطط الإعدادات + أمثلة)
- [Discord](/ar/channels/discord) و[Telegram](/ar/channels/telegram) (وسوم الرد + إعدادات replyToMode)
- [إعداد مساعد OpenClaw](/ar/start/openclaw)
- [تطبيق macOS](/ar/platforms/macos) (دورة حياة gateway)
