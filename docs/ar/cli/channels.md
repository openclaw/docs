---
read_when:
    - تريد إضافة/إزالة حسابات القنوات (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - تريد التحقق من حالة القناة أو متابعة سجلات القناة
summary: مرجع CLI لـ `openclaw channels` (الحسابات، الحالة، تسجيل الدخول/تسجيل الخروج، السجلات)
title: القنوات
x-i18n:
    generated_at: "2026-05-10T19:29:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: e860f2863e148a46b9beb7f855eb9f30addc1b012f1430bf33c544c5e321821d
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

إدارة حسابات قنوات الدردشة وحالة وقت تشغيلها على Gateway.

المستندات ذات الصلة:

- أدلة القنوات: [القنوات](/ar/channels)
- إعداد Gateway: [الإعداد](/ar/gateway/configuration)

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

يعرض `channels list` قنوات الدردشة فقط: الحسابات المهيأة افتراضيًا، مع وسوم حالة `installed` و`configured` و`enabled` لكل حساب. مرّر `--all` لإظهار القنوات المضمنة التي لم يُهيأ لها حساب بعد، وقنوات الكتالوج القابلة للتثبيت التي لم توضع على القرص بعد. لم تعد موفّرات المصادقة (OAuth + مفاتيح API) ولقطات استخدام/حصة موفّر النماذج تُطبع هنا؛ استخدم `openclaw models auth list` لملفات تعريف مصادقة الموفّر و`openclaw status` أو `openclaw models list` للاستخدام.

## الحالة / الإمكانات / الحل / السجلات

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (فقط مع `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` هو المسار الحي: على Gateway يمكن الوصول إليه، يشغّل فحوصات
`probeAccount` لكل حساب وفحوصات `auditAccount` الاختيارية، لذلك يمكن أن يتضمن الخرج حالة
النقل بالإضافة إلى نتائج الفحص مثل `works` أو `probe failed` أو `audit ok` أو `audit failed`.
إذا تعذّر الوصول إلى Gateway، يعود `channels status` إلى ملخصات تعتمد على الإعداد فقط
بدلًا من خرج الفحص الحي.

لا تستخدم `openclaw sessions` أو `sessions.list` في Gateway أو أداة الوكيل
`sessions_list` كإشارة لصحة مقبس القناة. تُبلغ هذه الأسطح عن
صفوف المحادثات المخزنة، لا حالة وقت تشغيل الموفّر. بعد إعادة تشغيل موفّر Discord،
قد يكون حساب متصل لكنه هادئ سليمًا بينما لا يظهر أي صف جلسة Discord
حتى حدث المحادثة الوارد أو الصادر التالي.

## إضافة / إزالة الحسابات

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
يعرض `openclaw channels add --help` أعلام كل قناة (الرمز، المفتاح الخاص، رمز التطبيق، مسارات signal-cli، إلخ).
</Tip>

لا يعمل `channels remove` إلا على Plugin القنوات المثبتة/المهيأة. استخدم `channels add` أولًا لقنوات الكتالوج القابلة للتثبيت.
بالنسبة إلى Plugin القنوات المدعومة بوقت التشغيل، يطلب `channels remove` أيضًا من Gateway العامل إيقاف الحساب المحدد قبل أن يحدّث الإعداد، لذلك لا يترك تعطيل حساب أو حذفه المستمع القديم نشطًا حتى إعادة التشغيل.

تشمل أسطح الإضافة غير التفاعلية الشائعة:

- قنوات bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- حقول نقل Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- حقول Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- حقول Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- حقول Nostr: `--private-key`, `--relay-urls`
- حقول Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` لمصادقة الحساب الافتراضي المدعومة بمتغيرات البيئة حيثما تكون مدعومة

إذا احتاج Plugin قناة إلى التثبيت أثناء أمر إضافة مدفوع بالأعلام، يستخدم OpenClaw مصدر التثبيت الافتراضي للقناة من دون فتح مطالبة تثبيت Plugin التفاعلية.

عندما تشغّل `openclaw channels add` من دون أعلام، يمكن للمعالج التفاعلي أن يطالب بما يلي:

- معرّفات الحسابات لكل قناة محددة
- أسماء عرض اختيارية لتلك الحسابات
- `Route these channel accounts to agents now?`

إذا أكدت الربط الآن، يسأل المعالج أي وكيل يجب أن يملك كل حساب قناة مهيأ، ويكتب ربطات توجيه على نطاق الحساب.

يمكنك أيضًا إدارة قواعد التوجيه نفسها لاحقًا باستخدام `openclaw agents bindings` و`openclaw agents bind` و`openclaw agents unbind` (راجع [الوكلاء](/ar/cli/agents)).

عندما تضيف حسابًا غير افتراضي إلى قناة لا تزال تستخدم إعدادات المستوى الأعلى لحساب واحد، يرقّي OpenClaw قيم المستوى الأعلى على نطاق الحساب إلى خريطة حسابات القناة قبل كتابة الحساب الجديد. تصل هذه القيم في معظم القنوات إلى `channels.<channel>.accounts.default`، لكن يمكن للقنوات المضمنة أن تحتفظ بحساب مرقّى مطابق موجود بدلًا من ذلك. Matrix هو المثال الحالي: إذا كان هناك حساب مسمى واحد موجود بالفعل، أو كان `defaultAccount` يشير إلى حساب مسمى موجود، يحافظ الترقية على ذلك الحساب بدلًا من إنشاء `accounts.default` جديد.

يبقى سلوك التوجيه متسقًا:

- تستمر الربطات الحالية الخاصة بالقناة فقط (بلا `accountId`) في مطابقة الحساب الافتراضي.
- لا ينشئ `channels add` الربطات تلقائيًا ولا يعيد كتابتها في الوضع غير التفاعلي.
- يمكن للإعداد التفاعلي اختياريًا إضافة ربطات على نطاق الحساب.

إذا كان إعدادك بالفعل في حالة مختلطة (حسابات مسماة موجودة وقيم حساب واحد على المستوى الأعلى لا تزال مضبوطة)، شغّل `openclaw doctor --fix` لنقل القيم على نطاق الحساب إلى الحساب المرقّى المختار لتلك القناة. ترقّي معظم القنوات إلى `accounts.default`؛ يمكن لـ Matrix أن يحافظ على هدف مسمى/افتراضي موجود بدلًا من ذلك.

## تسجيل الدخول وتسجيل الخروج (تفاعلي)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- يدعم `channels login` الخيار `--verbose`.
- يمكن لـ `channels login` و`logout` استنتاج القناة عندما يكون هدف تسجيل دخول مدعوم واحد فقط مهيأ.
- يفضّل `channels logout` مسار Gateway الحي عندما يكون قابلًا للوصول، لذلك يوقف تسجيل الخروج أي مستمع نشط قبل مسح حالة مصادقة القناة. إذا تعذّر الوصول إلى Gateway محلي، يعود إلى تنظيف المصادقة المحلي.
- شغّل `channels login` من طرفية على مضيف Gateway. يحظر `exec` الخاص بالوكيل تدفق تسجيل الدخول التفاعلي هذا؛ ينبغي استخدام أدوات تسجيل الدخول الأصلية للقناة من الدردشة عند توفرها، مثل `whatsapp_login`.

## استكشاف الأخطاء وإصلاحها

- شغّل `openclaw status --deep` لإجراء فحص واسع.
- استخدم `openclaw doctor` للإصلاحات الموجّهة.
- لم يعد `openclaw channels list` يطبع لقطات استخدام/حصة موفّر النماذج. لذلك، استخدم `openclaw status` (نظرة عامة) أو `openclaw models list` (لكل موفّر).
- يعود `openclaw channels status` إلى ملخصات تعتمد على الإعداد فقط عندما يتعذر الوصول إلى Gateway. إذا كانت بيانات اعتماد قناة مدعومة مهيأة عبر SecretRef لكنها غير متاحة في مسار الأمر الحالي، فإنه يبلّغ عن ذلك الحساب كمهيأ مع ملاحظات تدهور بدلًا من إظهاره كغير مهيأ.

## فحص الإمكانات

اجلب تلميحات إمكانات الموفّر (النوايا/النطاقات حيثما تكون متاحة) بالإضافة إلى دعم الميزات الثابت:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

ملاحظات:

- `--channel` اختياري؛ احذفه لسرد كل قناة (بما في ذلك الامتدادات).
- `--account` صالح فقط مع `--channel`.
- يقبل `--target` القيمة `channel:<id>` أو معرّف قناة رقميًا خامًا، ولا ينطبق إلا على Discord. بالنسبة إلى قنوات Discord الصوتية، يضع فحص الأذونات علامة على `ViewChannel` و`Connect` و`Speak` و`SendMessages` و`ReadMessageHistory` المفقودة.
- الفحوصات خاصة بالموفّر: نوايا Discord + أذونات قناة اختيارية؛ نطاقات Slack للبوت + المستخدم؛ أعلام بوت Telegram + Webhook؛ إصدار عفريت Signal؛ رمز تطبيق Microsoft Teams + أدوار/نطاقات Graph (مع التعليق حيثما تكون معروفة). القنوات التي لا تملك فحوصات تُبلغ بـ `Probe: unavailable`.

## حل الأسماء إلى معرّفات

حل أسماء القنوات/المستخدمين إلى معرّفات باستخدام دليل الموفّر:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

ملاحظات:

- استخدم `--kind user|group|auto` لفرض نوع الهدف.
- يفضّل الحل المطابقات النشطة عندما تشترك عدة إدخالات في الاسم نفسه.
- `channels resolve` للقراءة فقط. إذا كان حساب محدد مهيأ عبر SecretRef لكن بيانات الاعتماد تلك غير متاحة في مسار الأمر الحالي، يعيد الأمر نتائج غير محلولة متدهورة مع ملاحظات بدلًا من إيقاف التشغيل بأكمله.
- لا يثبّت `channels resolve` Plugin القنوات. استخدم `channels add --channel <name>` قبل حل أسماء قناة كتالوج قابلة للتثبيت.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [نظرة عامة على القنوات](/ar/channels)
