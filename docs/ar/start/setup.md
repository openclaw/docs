---
read_when:
    - إعداد جهاز جديد
    - تريد الحصول على «أحدث وأفضل» إصدار من دون تعطيل إعدادك الشخصي.
summary: إعدادات متقدمة وسير عمل التطوير لـ OpenClaw
title: الإعداد
x-i18n:
    generated_at: "2026-04-19T07:16:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 773cdbef5f38b069303b5e13fca5fcdc28f082746869f17b8b92aab1610b95a8
    source_path: start/setup.md
    workflow: 15
---

# الإعداد

<Note>
إذا كنت تُجري الإعداد لأول مرة، فابدأ من [البدء](/ar/start/getting-started).
للاطلاع على تفاصيل التهيئة الأولية، راجع [التهيئة الأولية (CLI)](/ar/start/wizard).
</Note>

## الخلاصة

- **التخصيص يوجد خارج المستودع:** `~/.openclaw/workspace` (مساحة العمل) + `~/.openclaw/openclaw.json` (الإعدادات).
- **سير العمل المستقر:** ثبّت تطبيق macOS ودعه يشغّل Gateway المضمّن.
- **سير عمل أحدث الإصدارات:** شغّل Gateway بنفسك عبر `pnpm gateway:watch`، ثم دع تطبيق macOS يتصل به في وضع Local.

## المتطلبات المسبقة (من المصدر)

- يُوصى باستخدام Node 24 (ولا يزال Node 22 LTS، حاليًا `22.14+`، مدعومًا)
- يُفضَّل `pnpm` (أو Bun إذا كنت تستخدم عمدًا [سير عمل Bun](/ar/install/bun))
- Docker (اختياري؛ فقط للإعداد داخل الحاويات/اختبارات e2e — راجع [Docker](/ar/install/docker))

## استراتيجية التخصيص (حتى لا تضرّك التحديثات)

إذا كنت تريد إعدادًا «مخصصًا لي 100%» _وفي الوقت نفسه_ تحديثات سهلة، فاحتفظ بتخصيصاتك في:

- **الإعدادات:** `~/.openclaw/openclaw.json` (بصيغة JSON/مشابهة لـ JSON5)
- **مساحة العمل:** `~/.openclaw/workspace` (Skills، وprompts، وmemories؛ اجعلها مستودع git خاصًا)

هيّئ مرة واحدة:

```bash
openclaw setup
```

من داخل هذا المستودع، استخدم مدخل CLI المحلي:

```bash
openclaw setup
```

إذا لم يكن لديك تثبيت عام بعد، فشغّله عبر `pnpm openclaw setup` (أو `bun run openclaw setup` إذا كنت تستخدم سير عمل Bun).

## شغّل Gateway من هذا المستودع

بعد `pnpm build`، يمكنك تشغيل CLI المجمّع مباشرة:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## سير العمل المستقر (تطبيق macOS أولًا)

1. ثبّت وشغّل **OpenClaw.app** (شريط القوائم).
2. أكمل قائمة التحقق الخاصة بالتهيئة الأولية/الأذونات (مطالبات TCC).
3. تأكد من أن Gateway مضبوط على **Local** ويعمل (التطبيق يديره).
4. اربط الواجهات (مثال: WhatsApp):

```bash
openclaw channels login
```

5. تحقق سريعًا:

```bash
openclaw health
```

إذا لم تكن التهيئة الأولية متاحة في نسختك:

- شغّل `openclaw setup`، ثم `openclaw channels login`، ثم ابدأ Gateway يدويًا (`openclaw gateway`).

## سير عمل أحدث الإصدارات (Gateway في الطرفية)

الهدف: العمل على Gateway المكتوب بـ TypeScript، والحصول على إعادة تحميل فورية، مع إبقاء واجهة تطبيق macOS متصلة.

### 0) (اختياري) شغّل تطبيق macOS من المصدر أيضًا

إذا كنت تريد أيضًا أن يكون تطبيق macOS على أحدث إصدار:

```bash
./scripts/restart-mac.sh
```

### 1) ابدأ Gateway الخاص بالتطوير

```bash
pnpm install
# التشغيل الأول فقط (أو بعد إعادة تعيين إعدادات/مساحة عمل OpenClaw المحلية)
pnpm openclaw setup
pnpm gateway:watch
```

يشغّل `gateway:watch` البوابة في وضع المراقبة ويعيد تحميلها عند تغيّر المصدر ذي الصلة،
أو الإعدادات، أو بيانات Plugin المضمّنة.
وتُعد `pnpm openclaw setup` خطوة تهيئة محلية تُنفَّذ مرة واحدة لإعداد الإعدادات/مساحة العمل في نسخة checkout جديدة.
ولا يعيد `pnpm gateway:watch` بناء `dist/control-ui`، لذا أعد تشغيل `pnpm ui:build` بعد تغييرات `ui/` أو استخدم `pnpm ui:dev` أثناء تطوير Control UI.

إذا كنت تستخدم عمدًا سير عمل Bun، فالأوامر المكافئة هي:

```bash
bun install
# التشغيل الأول فقط (أو بعد إعادة تعيين إعدادات/مساحة عمل OpenClaw المحلية)
bun run openclaw setup
bun run gateway:watch
```

### 2) وجّه تطبيق macOS إلى Gateway الذي تعمل عليه

في **OpenClaw.app**:

- وضع الاتصال: **Local**
  سيتصل التطبيق بالبوابة العاملة على المنفذ المُعَد.

### 3) تحقّق

- يجب أن تظهر حالة Gateway داخل التطبيق على أنها **«استخدام بوابة موجودة …»**
- أو عبر CLI:

```bash
openclaw health
```

### أخطاء شائعة

- **منفذ خاطئ:** يستخدم Gateway WS افتراضيًا `ws://127.0.0.1:18789`؛ احرص على أن يستخدم التطبيق وCLI المنفذ نفسه.
- **مكان وجود الحالة:**
  - حالة القنوات/المزوّدين: `~/.openclaw/credentials/`
  - ملفات تعريف مصادقة النماذج: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - الجلسات: `~/.openclaw/agents/<agentId>/sessions/`
  - السجلات: `/tmp/openclaw/`

## خريطة تخزين بيانات الاعتماد

استخدم هذا عند تصحيح أخطاء المصادقة أو عند تقرير ما ينبغي نسخه احتياطيًا:

- **WhatsApp**: ‏`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **رمز bot الخاص بـ Telegram**: الإعدادات/المتغيرات البيئية أو `channels.telegram.tokenFile` (ملف عادي فقط؛ تُرفَض الروابط الرمزية)
- **رمز bot الخاص بـ Discord**: الإعدادات/المتغيرات البيئية أو SecretRef (موفرو env/file/exec)
- **رموز Slack**: الإعدادات/المتغيرات البيئية (`channels.slack.*`)
- **قوائم السماح بالاقتران**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (الحساب الافتراضي)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (الحسابات غير الافتراضية)
- **ملفات تعريف مصادقة النماذج**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **حمولة الأسرار المخزنة في ملف (اختياري)**: `~/.openclaw/secrets.json`
- **استيراد OAuth القديم**: `~/.openclaw/credentials/oauth.json`
  مزيد من التفاصيل: [الأمان](/ar/gateway/security#credential-storage-map).

## التحديث (من دون إفساد إعدادك)

- احتفظ بـ `~/.openclaw/workspace` و`~/.openclaw/` باعتبارهما «أشياءك الخاصة»؛ لا تضع prompts أو إعداداتك الشخصية داخل مستودع `openclaw`.
- لتحديث المصدر: `git pull` + خطوة تثبيت مدير الحزم التي اخترتها (`pnpm install` افتراضيًا؛ أو `bun install` لسير عمل Bun) + واصل استخدام أمر `gateway:watch` المطابق.

## Linux (خدمة systemd للمستخدم)

تستخدم عمليات التثبيت على Linux خدمة systemd **للمستخدم**. افتراضيًا، يوقف systemd
خدمات المستخدم عند تسجيل الخروج/الخمول، مما يؤدي إلى إيقاف Gateway. تحاول
التهيئة الأولية تفعيل خاصية الاستمرار لك (وقد تطلب sudo). إذا كانت لا تزال معطلة، فشغّل:

```bash
sudo loginctl enable-linger $USER
```

بالنسبة إلى الخوادم التي تعمل دائمًا أو متعددة المستخدمين، فكّر في استخدام خدمة **نظام**
بدلًا من خدمة مستخدم (ولا حاجة عندها إلى خاصية الاستمرار). راجع [دليل تشغيل Gateway](/ar/gateway) للاطلاع على ملاحظات systemd.

## مستندات ذات صلة

- [دليل تشغيل Gateway](/ar/gateway) (الخيارات، والإشراف، والمنافذ)
- [إعدادات Gateway](/ar/gateway/configuration) (مخطط الإعدادات + أمثلة)
- [Discord](/ar/channels/discord) و[Telegram](/ar/channels/telegram) (وسوم الرد + إعدادات replyToMode)
- [إعداد مساعد OpenClaw](/ar/start/openclaw)
- [تطبيق macOS](/ar/platforms/macos) (دورة حياة البوابة)
