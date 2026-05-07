---
read_when:
    - تريد إضافة/إزالة حسابات القنوات (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - تريد التحقق من حالة القناة أو تتبّع سجلات القناة
summary: مرجع CLI لـ `openclaw channels` (الحسابات، الحالة، تسجيل الدخول/تسجيل الخروج، السجلات)
title: القنوات
x-i18n:
    generated_at: "2026-05-07T13:13:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: a78d7a5306c822314052151e0a9aa8bed347481f59d9a19f92240dfa562e4b23
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
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

يعرض `channels list` قنوات الدردشة فقط: الحسابات المضبوطة افتراضيا، مع وسوم حالة `installed` و`configured` و`enabled` لكل حساب. مرر `--all` لإظهار القنوات المضمّنة التي لا تملك حسابا مضبوطا بعد، وقنوات الكتالوج القابلة للتثبيت غير الموجودة على القرص بعد. لم تعد موفّرات المصادقة (OAuth + مفاتيح API) ولقطات استخدام/حصة موفّر النماذج تُطبع هنا؛ استخدم `openclaw models auth list` لملفات مصادقة الموفّر، و`openclaw status` أو `openclaw models list` للاستخدام.

## الحالة / الإمكانات / الحل / السجلات

- `channels status`: `--probe`، `--timeout <ms>`، `--json`
- `channels capabilities`: `--channel <name>`، `--account <id>` (فقط مع `--channel`)، `--target <dest>`، `--timeout <ms>`، `--json`
- `channels resolve`: `<entries...>`، `--channel <name>`، `--account <id>`، `--kind <auto|user|group>`، `--json`
- `channels logs`: `--channel <name|all>`، `--lines <n>`، `--json`

يمثّل `channels status --probe` المسار الحي: على Gateway قابل للوصول، يشغّل فحوص `probeAccount` و`auditAccount` الاختيارية لكل حساب، لذلك يمكن أن تتضمن المخرجات حالة النقل إضافة إلى نتائج الفحص مثل `works` أو `probe failed` أو `audit ok` أو `audit failed`. إذا تعذر الوصول إلى Gateway، يعود `channels status` إلى ملخصات تعتمد على الإعدادات فقط بدلا من مخرجات الفحص الحي.

لا تستخدم `openclaw sessions` أو `sessions.list` في Gateway أو أداة الوكيل `sessions_list` كإشارة لصحة مقبس القناة. هذه الأسطح تعرض صفوف المحادثات المخزنة، لا حالة تشغيل الموفّر. بعد إعادة تشغيل موفّر Discord، قد يكون الحساب المتصل لكنه هادئ سليما مع عدم ظهور أي صف جلسة Discord حتى حدث المحادثة الوارد أو الصادر التالي.

## إضافة / إزالة الحسابات

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
يعرض `openclaw channels add --help` أعلام كل قناة (الرمز، المفتاح الخاص، رمز التطبيق، مسارات signal-cli، وغير ذلك).
</Tip>

يعمل `channels remove` فقط على Plugins القنوات المثبتة/المضبوطة. استخدم `channels add` أولا لقنوات الكتالوج القابلة للتثبيت. بالنسبة إلى Plugins القنوات المدعومة بوقت التشغيل، يطلب `channels remove` أيضا من Gateway الجاري إيقاف الحساب المحدد قبل تحديث الإعدادات، لذلك لا يترك تعطيل حساب أو حذفه المستمع القديم نشطا حتى إعادة التشغيل.

تشمل أسطح الإضافة غير التفاعلية الشائعة:

- قنوات bot-token: `--token`، `--bot-token`، `--app-token`، `--token-file`
- حقول نقل Signal/iMessage: `--signal-number`، `--cli-path`، `--http-url`، `--http-host`، `--http-port`، `--db-path`، `--service`، `--region`
- حقول Google Chat: `--webhook-path`، `--webhook-url`، `--audience-type`، `--audience`
- حقول Matrix: `--homeserver`، `--user-id`، `--access-token`، `--password`، `--device-name`، `--initial-sync-limit`
- حقول Nostr: `--private-key`، `--relay-urls`
- حقول Tlon: `--ship`، `--url`، `--code`، `--group-channels`، `--dm-allowlist`، `--auto-discover-channels`
- `--use-env` للمصادقة المدعومة بالبيئة للحساب الافتراضي حيث تكون مدعومة

إذا احتاج Plugin قناة إلى التثبيت أثناء أمر إضافة مدفوع بالأعلام، يستخدم OpenClaw مصدر التثبيت الافتراضي للقناة بدون فتح مطالبة تثبيت Plugin التفاعلية.

عند تشغيل `openclaw channels add` بدون أعلام، يمكن للمعالج التفاعلي أن يطلب:

- معرّفات الحسابات لكل قناة محددة
- أسماء عرض اختيارية لتلك الحسابات
- `Bind configured channel accounts to agents now?`

إذا أكدت الربط الآن، يسأل المعالج أي وكيل يجب أن يملك كل حساب قناة مضبوط، ويكتب ربطات التوجيه المحددة بنطاق الحساب.

يمكنك أيضا إدارة قواعد التوجيه نفسها لاحقا باستخدام `openclaw agents bindings` و`openclaw agents bind` و`openclaw agents unbind` (راجع [الوكلاء](/ar/cli/agents)).

عند إضافة حساب غير افتراضي إلى قناة ما زالت تستخدم إعدادات علوية لحساب واحد، يرقّي OpenClaw القيم العلوية المحددة بنطاق الحساب إلى خريطة حسابات القناة قبل كتابة الحساب الجديد. تهبط معظم القنوات بهذه القيم في `channels.<channel>.accounts.default`، لكن يمكن للقنوات المضمّنة الحفاظ على حساب مرقّى مطابق موجود بدلا من ذلك. Matrix هو المثال الحالي: إذا كان حساب واحد مسمى موجودا بالفعل، أو كان `defaultAccount` يشير إلى حساب مسمى موجود، فإن الترقية تحفظ ذلك الحساب بدلا من إنشاء `accounts.default` جديد.

يبقى سلوك التوجيه متسقا:

- تستمر ربطات القناة فقط الموجودة (بدون `accountId`) في مطابقة الحساب الافتراضي.
- لا ينشئ `channels add` الربطات تلقائيا ولا يعيد كتابتها في الوضع غير التفاعلي.
- يمكن للإعداد التفاعلي أن يضيف اختياريا ربطات محددة بنطاق الحساب.

إذا كانت إعداداتك في حالة مختلطة مسبقا (حسابات مسماة موجودة وقيم علوية لحساب واحد ما زالت مضبوطة)، شغّل `openclaw doctor --fix` لنقل القيم المحددة بنطاق الحساب إلى الحساب المرقّى المختار لتلك القناة. ترقّي معظم القنوات إلى `accounts.default`؛ ويمكن لـ Matrix الحفاظ على هدف مسمى/افتراضي موجود بدلا من ذلك.

## تسجيل الدخول وتسجيل الخروج (تفاعلي)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- يدعم `channels login` الخيار `--verbose`.
- يستطيع `channels login` و`logout` استنتاج القناة عندما يكون هدف تسجيل دخول واحد مدعوم فقط مضبوطا.
- يفضّل `channels logout` مسار Gateway الحي عندما يكون قابلا للوصول، بحيث يوقف تسجيل الخروج أي مستمع نشط قبل مسح حالة مصادقة القناة. إذا لم يكن Gateway المحلي قابلا للوصول، فإنه يعود إلى تنظيف المصادقة محليا.
- شغّل `channels login` من طرفية على مضيف Gateway. يحجب `exec` الخاص بالوكيل تدفق تسجيل الدخول التفاعلي هذا؛ يجب استخدام أدوات تسجيل الدخول الأصلية للقناة الخاصة بالوكيل، مثل `whatsapp_login`، من الدردشة عندما تكون متاحة.

## استكشاف الأخطاء وإصلاحها

- شغّل `openclaw status --deep` لفحص واسع.
- استخدم `openclaw doctor` لإصلاحات موجهة.
- لم يعد `openclaw channels list` يطبع لقطات استخدام/حصة موفّر النماذج. لهذه، استخدم `openclaw status` (نظرة عامة) أو `openclaw models list` (لكل موفّر).
- يعود `openclaw channels status` إلى ملخصات تعتمد على الإعدادات فقط عندما يتعذر الوصول إلى Gateway. إذا كانت بيانات اعتماد قناة مدعومة مضبوطة عبر SecretRef لكنها غير متاحة في مسار الأمر الحالي، فإنه يبلّغ عن ذلك الحساب كحساب مضبوط مع ملاحظات تدهور بدلا من إظهاره كغير مضبوط.

## فحص الإمكانات

اجلب تلميحات إمكانات الموفّر (النوايا/النطاقات حيثما تكون متاحة) إضافة إلى دعم الميزات الثابت:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

ملاحظات:

- `--channel` اختياري؛ احذفه لسرد كل قناة (بما في ذلك الإضافات).
- `--account` صالح فقط مع `--channel`.
- يقبل `--target` الصيغة `channel:<id>` أو معرّف قناة رقمي خام، ولا ينطبق إلا على Discord. بالنسبة إلى قنوات الصوت في Discord، يعلّم فحص الأذونات النواقص في `ViewChannel` و`Connect` و`Speak` و`SendMessages` و`ReadMessageHistory`.
- الفحوص خاصة بالموفّر: نوايا Discord + أذونات قناة اختيارية؛ نطاقات بوت Slack + المستخدم؛ أعلام بوت Telegram + Webhook؛ إصدار عفريت Signal؛ رمز تطبيق Microsoft Teams + أدوار/نطاقات Graph (معلّمة حيثما تكون معروفة). القنوات التي لا تملك فحوصا تبلّغ `Probe: unavailable`.

## حل الأسماء إلى معرّفات

حل أسماء القنوات/المستخدمين إلى معرّفات باستخدام دليل الموفّر:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

ملاحظات:

- استخدم `--kind user|group|auto` لفرض نوع الهدف.
- يفضّل الحل المطابقات النشطة عندما تتشارك عدة إدخالات الاسم نفسه.
- `channels resolve` للقراءة فقط. إذا كان حساب محدد مضبوطا عبر SecretRef لكن بيانات الاعتماد تلك غير متاحة في مسار الأمر الحالي، يرجع الأمر نتائج غير محلولة متدهورة مع ملاحظات بدلا من إجهاض التشغيل بأكمله.
- لا يثبّت `channels resolve` Plugins القنوات. استخدم `channels add --channel <name>` قبل حل الأسماء لقناة كتالوج قابلة للتثبيت.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [نظرة عامة على القنوات](/ar/channels)
