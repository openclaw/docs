---
read_when:
    - إعداد جهاز جديد
    - تريد «الأحدث + الأفضل» من دون تعطيل إعدادك الشخصي
summary: الإعداد المتقدم وسير عمل التطوير لـ OpenClaw
title: الإعداد
x-i18n:
    generated_at: "2026-04-30T08:26:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: f96e5e8d46e694f0dfc67eeeb34f4c49498a56e384c3a2a6266c2214afdc0870
    source_path: start/setup.md
    workflow: 16
---

<Note>
إذا كنت تُعدّه لأول مرة، فابدأ بـ [بدء الاستخدام](/ar/start/getting-started).
لتفاصيل التهيئة الأولىية، راجع [التهيئة الأولية (CLI)](/ar/start/wizard).
</Note>

## الخلاصة

اختر مسار إعداد بناءً على مدى رغبتك في تلقي التحديثات، وما إذا كنت تريد تشغيل Gateway بنفسك:

- **يبقى التخصيص خارج المستودع:** احتفظ بالإعدادات ومساحة العمل في `~/.openclaw/openclaw.json` و`~/.openclaw/workspace/` حتى لا تمسّها تحديثات المستودع.
- **المسار المستقر (موصى به لمعظم المستخدمين):** ثبّت تطبيق macOS ودعه يشغّل Gateway المضمّن.
- **مسار أحدث التطويرات (للتطوير):** شغّل Gateway بنفسك عبر `pnpm gateway:watch`، ثم دع تطبيق macOS يتصل في وضع Local.

## المتطلبات المسبقة (من المصدر)

- يوصى بـ Node 24 (لا يزال Node 22 LTS، حاليًا `22.14+`، مدعومًا)
- يفضّل `pnpm` (أو Bun إذا كنت تستخدم عمدًا [مسار Bun](/ar/install/bun))
- Docker (اختياري؛ فقط للإعداد/اختبارات e2e داخل الحاويات — راجع [Docker](/ar/install/docker))

## استراتيجية التخصيص (حتى لا تضرّ التحديثات)

إذا كنت تريد تخصيصًا "100% مناسبًا لي" _مع_ تحديثات سهلة، فاحتفظ بتخصيصاتك في:

- **الإعدادات:** `~/.openclaw/openclaw.json` (يشبه JSON/JSON5)
- **مساحة العمل:** `~/.openclaw/workspace` (Skills، مطالبات، ذاكرات؛ اجعلها مستودع git خاصًا)

مهّد مرة واحدة:

```bash
openclaw setup
```

من داخل هذا المستودع، استخدم مدخل CLI المحلي:

```bash
openclaw setup
```

إذا لم يكن لديك تثبيت عام بعد، فشغّله عبر `pnpm openclaw setup` (أو `bun run openclaw setup` إذا كنت تستخدم مسار Bun).

## تشغيل Gateway من هذا المستودع

بعد `pnpm build`، يمكنك تشغيل CLI المعبّأ مباشرة:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## المسار المستقر (تطبيق macOS أولًا)

1. ثبّت وشغّل **OpenClaw.app** (شريط القوائم).
2. أكمل قائمة التحقق الخاصة بالتهيئة الأولية/الأذونات (مطالبات TCC).
3. تأكد أن Gateway مضبوط على **Local** ويعمل (يديره التطبيق).
4. اربط الواجهات (مثال: WhatsApp):

```bash
openclaw channels login
```

5. تحقق من السلامة:

```bash
openclaw health
```

إذا لم تكن التهيئة الأولية متاحة في إصدارك:

- شغّل `openclaw setup`، ثم `openclaw channels login`، ثم ابدأ Gateway يدويًا (`openclaw gateway`).

## مسار أحدث التطويرات (Gateway في الطرفية)

الهدف: العمل على Gateway المكتوب بـ TypeScript، والحصول على إعادة تحميل فورية، وإبقاء واجهة تطبيق macOS متصلة.

### 0) (اختياري) شغّل تطبيق macOS من المصدر أيضًا

إذا كنت تريد أيضًا أن يكون تطبيق macOS على أحدث التطويرات:

```bash
./scripts/restart-mac.sh
```

### 1) ابدأ Gateway التطويري

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

يبدأ `gateway:watch` عملية مراقبة Gateway أو يعيد تشغيلها داخل جلسة tmux مسماة
ويتصل بها تلقائيًا من الطرفيات التفاعلية. تبقى الأصداف غير التفاعلية
منفصلة وتطبع `tmux attach -t openclaw-gateway-watch-main`؛ استخدم
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` لإبقاء تشغيل تفاعلي
منفصلًا، أو `pnpm gateway:watch:raw` لوضع المراقبة في المقدمة. يعيد المراقب
التحميل عند تغيّر المصدر ذي الصلة، والإعدادات، وبيانات تعريف Plugin المضمّنة.
`pnpm openclaw setup` هو خطوة تهيئة الإعدادات/مساحة العمل المحلية لمرة واحدة عند استخدام نسخة جديدة.
لا يعيد `pnpm gateway:watch` بناء `dist/control-ui`، لذا أعد تشغيل `pnpm ui:build` بعد تغييرات `ui/` أو استخدم `pnpm ui:dev` أثناء تطوير Control UI.

إذا كنت تستخدم مسار Bun عمدًا، فالأوامر المكافئة هي:

```bash
bun install
# First run only (or after resetting local OpenClaw config/workspace)
bun run openclaw setup
bun run gateway:watch
```

### 2) وجّه تطبيق macOS إلى Gateway الجاري تشغيله

في **OpenClaw.app**:

- وضع الاتصال: **Local**
  سيتصل التطبيق بـ Gateway الجاري تشغيله على المنفذ المضبوط.

### 3) التحقق

- يجب أن تعرض حالة Gateway داخل التطبيق **"استخدام Gateway موجود ..."**
- أو عبر CLI:

```bash
openclaw health
```

### أخطاء شائعة

- **منفذ خاطئ:** القيمة الافتراضية لـ Gateway WS هي `ws://127.0.0.1:18789`؛ أبقِ التطبيق وCLI على المنفذ نفسه.
- **مكان حفظ الحالة:**
  - حالة القناة/المزوّد: `~/.openclaw/credentials/`
  - ملفات تعريف مصادقة النموذج: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - الجلسات: `~/.openclaw/agents/<agentId>/sessions/`
  - السجلات: `/tmp/openclaw/`

## خريطة تخزين بيانات الاعتماد

استخدم هذا عند تصحيح المصادقة أو تحديد ما يجب نسخه احتياطيًا:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **رمز بوت Telegram**: الإعدادات/البيئة أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفض الروابط الرمزية)
- **رمز بوت Discord**: الإعدادات/البيئة أو SecretRef (مزوّدو env/file/exec)
- **رموز Slack**: الإعدادات/البيئة (`channels.slack.*`)
- **قوائم السماح بالاقتران**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (الحساب الافتراضي)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (الحسابات غير الافتراضية)
- **ملفات تعريف مصادقة النموذج**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **حمولة أسرار مستندة إلى ملف (اختياري)**: `~/.openclaw/secrets.json`
- **استيراد OAuth القديم**: `~/.openclaw/credentials/oauth.json`
  مزيد من التفاصيل: [الأمان](/ar/gateway/security#credential-storage-map).

## التحديث (دون إفساد إعدادك)

- أبقِ `~/.openclaw/workspace` و`~/.openclaw/` كـ "أشيائك"؛ لا تضع المطالبات/الإعدادات الشخصية داخل مستودع `openclaw`.
- تحديث المصدر: `git pull` + خطوة التثبيت الخاصة بمدير الحزم الذي اخترته (`pnpm install` افتراضيًا؛ `bun install` لمسار Bun) + الاستمرار في استخدام أمر `gateway:watch` المطابق.

## Linux (خدمة مستخدم systemd)

تستخدم تثبيتات Linux خدمة systemd من نوع **مستخدم**. افتراضيًا، يوقف systemd
خدمات المستخدم عند تسجيل الخروج/الخمول، مما يقتل Gateway. تحاول التهيئة الأولية
تمكين البقاء لك (قد تطلب sudo). إذا كان لا يزال معطلًا، فشغّل:

```bash
sudo loginctl enable-linger $USER
```

للخوادم دائمة التشغيل أو متعددة المستخدمين، فكّر في خدمة **نظام** بدلًا من
خدمة مستخدم (لا حاجة إلى البقاء). راجع [دليل تشغيل Gateway](/ar/gateway) لملاحظات systemd.

## مستندات ذات صلة

- [دليل تشغيل Gateway](/ar/gateway) (الرايات، الإشراف، المنافذ)
- [إعدادات Gateway](/ar/gateway/configuration) (مخطط الإعدادات + أمثلة)
- [Discord](/ar/channels/discord) و[Telegram](/ar/channels/telegram) (وسوم الرد + إعدادات replyToMode)
- [إعداد مساعد OpenClaw](/ar/start/openclaw)
- [تطبيق macOS](/ar/platforms/macos) (دورة حياة Gateway)
