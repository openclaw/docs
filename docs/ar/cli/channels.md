---
read_when:
    - تريد إضافة/إزالة حسابات القنوات (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - تريد التحقق من حالة القناة أو متابعة سجلات القناة
summary: مرجع CLI لـ `openclaw channels` (الحسابات، الحالة، تسجيل الدخول/تسجيل الخروج، السجلات)
title: القنوات
x-i18n:
    generated_at: "2026-04-30T07:46:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc3c5983114c17e0e7284450aa161b658312c05864db65e09d6d764e357cd1f
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

إدارة حسابات قنوات الدردشة وحالة تشغيلها على Gateway.

المستندات ذات الصلة:

- أدلة القنوات: [القنوات](/ar/channels)
- إعدادات Gateway: [الإعدادات](/ar/gateway/configuration)

## الأوامر الشائعة

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## الحالة / القدرات / التحويل / السجلات

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (فقط مع `--channel`)، `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` هو المسار المباشر: على Gateway يمكن الوصول إليه، يشغّل فحوصات `probeAccount` لكل حساب وفحوصات `auditAccount` الاختيارية، لذلك يمكن أن يتضمن الخرج حالة النقل إضافة إلى نتائج الفحص مثل `works` أو `probe failed` أو `audit ok` أو `audit failed`. إذا تعذّر الوصول إلى Gateway، يعود `channels status` إلى ملخصات قائمة على الإعدادات فقط بدلا من خرج الفحص المباشر.

## إضافة الحسابات / إزالتها

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
يعرض `openclaw channels add --help` أعلاما خاصة بكل قناة (رمز، مفتاح خاص، رمز تطبيق، مسارات signal-cli، وما إلى ذلك).
</Tip>

تشمل أسطح الإضافة غير التفاعلية الشائعة:

- قنوات رمز البوت: `--token`, `--bot-token`, `--app-token`, `--token-file`
- حقول نقل Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- حقول Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- حقول Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- حقول Nostr: `--private-key`, `--relay-urls`
- حقول Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` للمصادقة المدعومة بالبيئة للحساب الافتراضي حيث تكون مدعومة

إذا احتاج Plugin قناة إلى التثبيت أثناء أمر إضافة موجّه بالأعلام، يستخدم OpenClaw مصدر التثبيت الافتراضي للقناة دون فتح مطالبة تثبيت Plugin التفاعلية.

عند تشغيل `openclaw channels add` دون أعلام، يمكن للمعالج التفاعلي أن يطلب:

- معرّفات الحسابات لكل قناة محددة
- أسماء عرض اختيارية لتلك الحسابات
- `Bind configured channel accounts to agents now?`

إذا أكدت الربط الآن، يسأل المعالج أي وكيل يجب أن يمتلك كل حساب قناة مضبوط، ويكتب ارتباطات التوجيه على نطاق الحساب.

يمكنك أيضا إدارة قواعد التوجيه نفسها لاحقا باستخدام `openclaw agents bindings` و`openclaw agents bind` و`openclaw agents unbind` (انظر [الوكلاء](/ar/cli/agents)).

عند إضافة حساب غير افتراضي إلى قناة لا تزال تستخدم إعدادات المستوى الأعلى للحساب الواحد، يرقّي OpenClaw قيم المستوى الأعلى ذات نطاق الحساب إلى خريطة حسابات القناة قبل كتابة الحساب الجديد. تستقر هذه القيم في معظم القنوات داخل `channels.<channel>.accounts.default`، لكن القنوات المضمّنة يمكنها الحفاظ على حساب مرقّى مطابق موجود بدلا من ذلك. Matrix هو المثال الحالي: إذا كان حساب واحد مسمى موجودا بالفعل، أو كان `defaultAccount` يشير إلى حساب مسمى موجود، فإن الترقية تحافظ على ذلك الحساب بدلا من إنشاء `accounts.default` جديد.

يبقى سلوك التوجيه متسقا:

- تستمر الارتباطات الحالية الخاصة بالقناة فقط (دون `accountId`) في مطابقة الحساب الافتراضي.
- لا ينشئ `channels add` الارتباطات تلقائيا ولا يعيد كتابتها في الوضع غير التفاعلي.
- يمكن للإعداد التفاعلي اختياريا إضافة ارتباطات ذات نطاق حساب.

إذا كانت إعداداتك موجودة بالفعل في حالة مختلطة (حسابات مسماة موجودة وقيم حساب واحد في المستوى الأعلى لا تزال مضبوطة)، شغّل `openclaw doctor --fix` لنقل القيم ذات نطاق الحساب إلى الحساب المرقّى المختار لتلك القناة. ترقّي معظم القنوات إلى `accounts.default`؛ ويمكن لـ Matrix الحفاظ على هدف مسمى/افتراضي موجود بدلا من ذلك.

## تسجيل الدخول وتسجيل الخروج (تفاعلي)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- يدعم `channels login` الخيار `--verbose`.
- يمكن لـ `channels login` و`logout` استنتاج القناة عند ضبط هدف تسجيل دخول مدعوم واحد فقط.
- شغّل `channels login` من طرفية على مضيف Gateway. يحظر `exec` الخاص بالوكيل مسار تسجيل الدخول التفاعلي هذا؛ ويجب استخدام أدوات تسجيل الدخول الأصلية للقناة الخاصة بالوكيل، مثل `whatsapp_login`، من الدردشة عند توفرها.

## استكشاف الأخطاء وإصلاحها

- شغّل `openclaw status --deep` لإجراء فحص واسع.
- استخدم `openclaw doctor` للإصلاحات الموجّهة.
- يطبع `openclaw channels list` السطر `Claude: HTTP 403 ... user:profile` ← تحتاج لقطة الاستخدام إلى نطاق `user:profile`. استخدم `--no-usage`، أو وفّر مفتاح جلسة claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`)، أو أعد المصادقة عبر Claude CLI.
- يعود `openclaw channels status` إلى ملخصات قائمة على الإعدادات فقط عندما يتعذر الوصول إلى Gateway. إذا كانت بيانات اعتماد قناة مدعومة مضبوطة عبر SecretRef لكنها غير متاحة في مسار الأمر الحالي، فإنه يبلّغ عن ذلك الحساب كحساب مضبوط مع ملاحظات تدهور بدلا من إظهاره كغير مضبوط.

## فحص القدرات

اجلب تلميحات قدرات المزوّد (النوايا/النطاقات حيثما توفرت) إضافة إلى دعم الميزات الثابتة:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

ملاحظات:

- `--channel` اختياري؛ احذفه لسرد كل قناة (بما في ذلك الإضافات).
- `--account` صالح فقط مع `--channel`.
- يقبل `--target` القيمة `channel:<id>` أو معرّف قناة رقمي خام، وينطبق فقط على Discord.
- الفحوصات خاصة بالمزوّد: نوايا Discord + أذونات قناة اختيارية؛ نطاقات بوت Slack + المستخدم؛ أعلام بوت Telegram + Webhook؛ إصدار عفريت Signal؛ رمز تطبيق Microsoft Teams + أدوار/نطاقات Graph (مع التعليق حيثما عُرفت). القنوات التي لا تحتوي على فحوصات تبلّغ `Probe: unavailable`.

## تحويل الأسماء إلى معرّفات

حوّل أسماء القنوات/المستخدمين إلى معرّفات باستخدام دليل المزوّد:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

ملاحظات:

- استخدم `--kind user|group|auto` لفرض نوع الهدف.
- يفضّل التحويل التطابقات النشطة عندما تشترك عدة إدخالات في الاسم نفسه.
- `channels resolve` للقراءة فقط. إذا كان حساب محدد مضبوطا عبر SecretRef لكن بيانات الاعتماد تلك غير متاحة في مسار الأمر الحالي، يعيد الأمر نتائج غير محلولة متدهورة مع ملاحظات بدلا من إيقاف التشغيل بالكامل.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [نظرة عامة على القنوات](/ar/channels)
