---
read_when:
    - إعداد جهاز جديد
    - تريد "أحدث وأفضل" من دون كسر إعدادك الشخصي
summary: إعدادات متقدمة وسير عمل التطوير لـ OpenClaw
title: الإعداد
x-i18n:
    generated_at: "2026-04-24T08:05:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4a965f39a14697a677c89ccadeb2b11b10c8e704e81e00619fffd5abe2ebc83
    source_path: start/setup.md
    workflow: 15
---

<Note>
إذا كنت تُجري الإعداد للمرة الأولى، فابدأ بـ [البدء](/ar/start/getting-started).
ولتفاصيل onboarding، راجع [Onboarding (CLI)](/ar/start/wizard).
</Note>

## الخلاصة

اختر سير عمل للإعداد بناءً على عدد مرات رغبتك في التحديث وما إذا كنت تريد تشغيل Gateway بنفسك:

- **التخصيص يعيش خارج المستودع:** أبقِ إعدادك ومساحة عملك في `~/.openclaw/openclaw.json` و`~/.openclaw/workspace/` حتى لا تلمسهما تحديثات المستودع.
- **سير العمل المستقر (موصى به لمعظم الناس):** ثبّت تطبيق macOS ودعه يشغّل Gateway المجمعة.
- **سير العمل على الحافة (للتطوير):** شغّل Gateway بنفسك عبر `pnpm gateway:watch`، ثم دع تطبيق macOS يرتبط في الوضع Local.

## المتطلبات المسبقة (من المصدر)

- Node 24 موصى به (ولا تزال Node 22 LTS، حاليًا `22.14+`، مدعومة)
- يُفضَّل `pnpm` (أو Bun إذا كنت تستخدم عمدًا [سير عمل Bun](/ar/install/bun))
- Docker (اختياري؛ فقط للإعداد داخل الحاويات/‏e2e — راجع [Docker](/ar/install/docker))

## إستراتيجية التخصيص (حتى لا تؤذيك التحديثات)

إذا كنت تريد "مخصصًا لي 100%" _وفي الوقت نفسه_ تحديثات سهلة، فأبقِ تخصيصك في:

- **الإعداد:** `~/.openclaw/openclaw.json` ‏(JSON/بصيغة تشبه JSON5)
- **مساحة العمل:** `~/.openclaw/workspace` ‏(Skills، والمطالبات، والذكريات؛ اجعلها مستودع git خاصًا)

هيّئ مرة واحدة:

```bash
openclaw setup
```

ومن داخل هذا المستودع، استخدم مدخل CLI المحلي:

```bash
openclaw setup
```

إذا لم يكن لديك تثبيت عام بعد، فشغّله عبر `pnpm openclaw setup` (أو `bun run openclaw setup` إذا كنت تستخدم سير عمل Bun).

## شغّل Gateway من هذا المستودع

بعد `pnpm build`، يمكنك تشغيل CLI المعبأة مباشرة:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## سير العمل المستقر (تطبيق macOS أولًا)

1. ثبّت وشغّل **OpenClaw.app** (شريط القوائم).
2. أكمل قائمة التحقق الخاصة بـ onboarding/الأذونات (مطالبات TCC).
3. تأكد من أن Gateway في وضع **Local** وتعمل (التطبيق يديرها).
4. اربط الأسطح (مثال: WhatsApp):

```bash
openclaw channels login
```

5. تحقق سريعًا من السلامة:

```bash
openclaw health
```

إذا لم تكن onboarding متاحة في نسختك:

- شغّل `openclaw setup`، ثم `openclaw channels login`، ثم ابدأ Gateway يدويًا (`openclaw gateway`).

## سير العمل على الحافة (Gateway داخل طرفية)

الهدف: العمل على TypeScript Gateway، والحصول على إعادة تحميل فورية، مع إبقاء واجهة تطبيق macOS مرتبطة.

### 0) (اختياري) شغّل تطبيق macOS من المصدر أيضًا

إذا كنت تريد أيضًا أن يكون تطبيق macOS على الحافة:

```bash
./scripts/restart-mac.sh
```

### 1) ابدأ Gateway الخاصة بالتطوير

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

يقوم `gateway:watch` بتشغيل gateway في وضع watch ويعيد التحميل عند تغيّر المصدر ذي الصلة،
أو الإعداد، أو بيانات تعريف Plugin المجمّعة.
ويمثل `pnpm openclaw setup` خطوة التهيئة المحلية لمرة واحدة للإعداد/مساحة العمل من أجل نسخة checkout جديدة.
ولا يعيد `pnpm gateway:watch` بناء `dist/control-ui`، لذا أعد تشغيل `pnpm ui:build` بعد تغييرات `ui/` أو استخدم `pnpm ui:dev` أثناء تطوير Control UI.

إذا كنت تستخدم عمدًا سير عمل Bun، فالأوامر المكافئة هي:

```bash
bun install
# First run only (or after resetting local OpenClaw config/workspace)
bun run openclaw setup
bun run gateway:watch
```

### 2) وجّه تطبيق macOS إلى Gateway التي تعمل لديك

في **OpenClaw.app**:

- وضع الاتصال: **Local**
  سيرتبط التطبيق بـ gateway التي تعمل على المنفذ المهيأ.

### 3) تحقّق

- يجب أن تقرأ حالة Gateway داخل التطبيق: **“Using existing gateway …”**
- أو عبر CLI:

```bash
openclaw health
```

### الأخطاء الشائعة

- **المنفذ الخاطئ:** يكون Gateway WS افتراضيًا على `ws://127.0.0.1:18789`؛ أبقِ التطبيق وCLI على المنفذ نفسه.
- **أين تعيش الحالة:**
  - حالة القناة/المزوّد: `~/.openclaw/credentials/`
  - ملفات تعريف مصادقة النموذج: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - الجلسات: `~/.openclaw/agents/<agentId>/sessions/`
  - السجلات: `/tmp/openclaw/`

## خريطة تخزين بيانات الاعتماد

استخدم هذا عند تصحيح المصادقة أو تقرير ما الذي يجب نسخه احتياطيًا:

- **WhatsApp**: ‏`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: الإعداد/env أو `channels.telegram.tokenFile` (ملف عادي فقط؛ ويتم رفض الروابط الرمزية)
- **Discord bot token**: الإعداد/env أو SecretRef (مزودات env/file/exec)
- **رموز Slack**: الإعداد/env (`channels.slack.*`)
- **قوائم سماح الاقتران**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (الحساب الافتراضي)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (الحسابات غير الافتراضية)
- **ملفات تعريف مصادقة النموذج**: ‏`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **حمولة الأسرار المدعومة بالملف (اختيارية)**: ‏`~/.openclaw/secrets.json`
- **استيراد OAuth القديم**: ‏`~/.openclaw/credentials/oauth.json`
  مزيد من التفاصيل: [الأمان](/ar/gateway/security#credential-storage-map).

## التحديث (من دون تخريب إعدادك)

- أبقِ `~/.openclaw/workspace` و`~/.openclaw/` باعتبارهما "أشياءك"؛ ولا تضع مطالباتك/إعدادك الشخصي داخل مستودع `openclaw`.
- تحديث المصدر: ‏`git pull` + خطوة التثبيت الخاصة بمدير الحزم الذي اخترته (`pnpm install` افتراضيًا؛ و`bun install` لسير عمل Bun) + واصل استخدام أمر `gateway:watch` المطابق.

## Linux (خدمة مستخدم systemd)

تستخدم تثبيتات Linux خدمة مستخدم **systemd**. افتراضيًا، يوقف systemd خدمات المستخدم
عند تسجيل الخروج/الخمول، مما يقتل Gateway. ويحاول onboarding تفعيل
lingering لك (وقد يطالبك بـ sudo). وإذا كانت لا تزال معطلة، فشغّل:

```bash
sudo loginctl enable-linger $USER
```

بالنسبة إلى الخوادم الدائمة التشغيل أو متعددة المستخدمين، فكّر في استخدام خدمة **نظام** بدلًا من
خدمة مستخدم (من دون الحاجة إلى lingering). راجع [دليل تشغيل Gateway](/ar/gateway) لمعرفة ملاحظات systemd.

## وثائق ذات صلة

- [دليل تشغيل Gateway](/ar/gateway) (العلامات، والإشراف، والمنافذ)
- [إعداد Gateway](/ar/gateway/configuration) (مخطط الإعداد + أمثلة)
- [Discord](/ar/channels/discord) و[Telegram](/ar/channels/telegram) (وسوم الرد + إعدادات replyToMode)
- [إعداد مساعد OpenClaw](/ar/start/openclaw)
- [تطبيق macOS](/ar/platforms/macos) (دورة حياة gateway)
