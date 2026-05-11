---
read_when:
    - تريد إضافة/إزالة حسابات القنوات (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - تريد التحقق من حالة القناة أو متابعة سجلات القناة
summary: مرجع CLI لـ `openclaw channels` (الحسابات، الحالة، تسجيل الدخول/تسجيل الخروج، السجلات)
title: القنوات
x-i18n:
    generated_at: "2026-05-11T20:27:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58a964b4db9526defab6ee47b7a99c11086e345d42c8d20f5262fc134337947f
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

إدارة حسابات قنوات الدردشة وحالة تشغيلها على Gateway.

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

يعرض `channels list` قنوات الدردشة فقط: الحسابات المضبوطة افتراضيًا، مع وسوم حالة `installed` و`configured` و`enabled` لكل حساب. مرّر `--all` لإظهار القنوات المضمّنة التي لا تملك حسابًا مضبوطًا بعد، وقنوات الفهرس القابلة للتثبيت التي لم تصبح موجودة على القرص بعد. لم تعد موفّرات المصادقة (OAuth + مفاتيح API) ولقطات استخدام/حصة موفّر النموذج تُطبع هنا؛ استخدم `openclaw models auth list` لملفات تعريف مصادقة الموفّرين و`openclaw status` أو `openclaw models list` للاستخدام.

## الحالة / الإمكانات / الحل / السجلات

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (فقط مع `--channel`)، `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` هو المسار الحي: على Gateway يمكن الوصول إليه، يشغّل فحوصات `probeAccount` وفحوصات `auditAccount` الاختيارية لكل حساب، لذلك يمكن أن يتضمن الإخراج حالة النقل إضافة إلى نتائج الفحص مثل `works` أو `probe failed` أو `audit ok` أو `audit failed`. إذا تعذر الوصول إلى Gateway، يعود `channels status` إلى ملخصات مبنية على الإعداد فقط بدلًا من إخراج الفحص الحي.

لا تستخدم `openclaw sessions` أو `sessions.list` في Gateway أو أداة `sessions_list` الخاصة بالوكيل كإشارة إلى صحة مقبس القناة. هذه الواجهات تعرض صفوف المحادثات المخزنة، لا حالة تشغيل الموفّر. بعد إعادة تشغيل موفّر Discord، قد يكون الحساب المتصل لكن الهادئ سليمًا بينما لا يظهر صف جلسة Discord حتى حدث المحادثة الواردة أو الصادرة التالي.

## إضافة / إزالة الحسابات

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
يعرض `openclaw channels add --help` أعلامًا خاصة بكل قناة (رمز، مفتاح خاص، رمز التطبيق، مسارات signal-cli، وغير ذلك).
</Tip>

يعمل `channels remove` فقط على Plugins القنوات المثبتة/المضبوطة. استخدم `channels add` أولًا لقنوات الفهرس القابلة للتثبيت.
بالنسبة إلى Plugins القنوات المدعومة بالتشغيل، يطلب `channels remove` أيضًا من Gateway الجاري إيقاف الحساب المحدد قبل أن يحدّث الإعداد، بحيث لا يترك تعطيل حساب أو حذفه المستمع القديم نشطًا حتى إعادة التشغيل.

تشمل واجهات الإضافة غير التفاعلية الشائعة:

- قنوات رمز البوت: `--token`, `--bot-token`, `--app-token`, `--token-file`
- حقول نقل Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- حقول Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- حقول Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- حقول Nostr: `--private-key`, `--relay-urls`
- حقول Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` لمصادقة الحساب الافتراضي المدعومة بالبيئة حيث تكون مدعومة

إذا كان Plugin قناة يحتاج إلى التثبيت أثناء أمر إضافة موجّه بالأعلام، يستخدم OpenClaw مصدر التثبيت الافتراضي للقناة دون فتح موجه تثبيت Plugin التفاعلي.

عند تشغيل `openclaw channels add` دون أعلام، يمكن للمعالج التفاعلي أن يطلب:

- معرّفات الحسابات لكل قناة محددة
- أسماء عرض اختيارية لتلك الحسابات
- `Route these channel accounts to agents now?`

إذا أكدت الربط الآن، يسأل المعالج أي وكيل يجب أن يملك كل حساب قناة مضبوط ويكتب ارتباطات التوجيه محددة الحساب.

يمكنك أيضًا إدارة قواعد التوجيه نفسها لاحقًا باستخدام `openclaw agents bindings` و`openclaw agents bind` و`openclaw agents unbind` (راجع [الوكلاء](/ar/cli/agents)).

عند إضافة حساب غير افتراضي إلى قناة ما زالت تستخدم إعدادات المستوى الأعلى لحساب واحد، يرقّي OpenClaw قيم المستوى الأعلى محددة الحساب إلى خريطة حسابات القناة قبل كتابة الحساب الجديد. تستقر هذه القيم في معظم القنوات في `channels.<channel>.accounts.default`، لكن القنوات المضمّنة يمكنها بدلًا من ذلك الحفاظ على حساب مرقّى مطابق موجود. Matrix هو المثال الحالي: إذا كان هناك حساب مسمّى واحد موجود بالفعل، أو كان `defaultAccount` يشير إلى حساب مسمّى موجود، يحافظ الترقية على ذلك الحساب بدلًا من إنشاء `accounts.default` جديد.

يبقى سلوك التوجيه متسقًا:

- تستمر الارتباطات الحالية الخاصة بالقناة فقط (بدون `accountId`) في مطابقة الحساب الافتراضي.
- لا ينشئ `channels add` ارتباطات تلقائيًا ولا يعيد كتابتها في الوضع غير التفاعلي.
- يمكن للإعداد التفاعلي اختياريًا إضافة ارتباطات محددة الحساب.

إذا كان إعدادك موجودًا بالفعل في حالة مختلطة (حسابات مسماة موجودة وقيم حساب واحد في المستوى الأعلى ما زالت مضبوطة)، شغّل `openclaw doctor --fix` لنقل القيم محددة الحساب إلى الحساب المرقّى المختار لتلك القناة. تترقى معظم القنوات إلى `accounts.default`؛ يمكن لـ Matrix بدلًا من ذلك الحفاظ على هدف مسمّى/افتراضي موجود.

## تسجيل الدخول وتسجيل الخروج (تفاعلي)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- يدعم `channels login` الخيار `--verbose`.
- يمكن لـ `channels login` و`logout` استنتاج القناة عندما يكون هدف تسجيل دخول مدعوم واحد فقط مضبوطًا.
- يفضّل `channels logout` مسار Gateway الحي عندما يكون قابلًا للوصول، لذلك يوقف تسجيل الخروج أي مستمع نشط قبل مسح حالة مصادقة القناة. إذا كان Gateway محلي غير قابل للوصول، يعود إلى تنظيف المصادقة المحلي.
- شغّل `channels login` من طرفية على مضيف Gateway. يحظر `exec` الخاص بالوكيل تدفق تسجيل الدخول التفاعلي هذا؛ يجب استخدام أدوات تسجيل الدخول الأصلية للقناة الخاصة بالوكيل، مثل `whatsapp_login`، من الدردشة عندما تكون متاحة.

## استكشاف الأخطاء وإصلاحها

- شغّل `openclaw status --deep` لفحص واسع.
- استخدم `openclaw doctor` للإصلاحات الموجّهة.
- لم يعد `openclaw channels list` يطبع لقطات استخدام/حصة موفّر النموذج. لذلك، استخدم `openclaw status` (نظرة عامة) أو `openclaw models list` (لكل موفّر).
- يعود `openclaw channels status` إلى ملخصات مبنية على الإعداد فقط عندما يتعذر الوصول إلى Gateway. إذا كان اعتماد قناة مدعومة مضبوطًا عبر SecretRef لكنه غير متاح في مسار الأمر الحالي، فإنه يبلّغ ذلك الحساب كمضبوط مع ملاحظات تدهور بدلًا من إظهاره كغير مضبوط.

## فحص الإمكانات

اجلب تلميحات إمكانات الموفّر (النوايا/النطاقات حيثما توفرت) إضافة إلى دعم الميزات الثابت:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

ملاحظات:

- `--channel` اختياري؛ احذفه لسرد كل قناة (بما في ذلك الامتدادات).
- `--account` صالح فقط مع `--channel`.
- يقبل `--target` القيمة `channel:<id>` أو معرّف قناة رقميًا خامًا وينطبق فقط على Discord. بالنسبة إلى قنوات Discord الصوتية، يعلّم فحص الأذونات الأذونات الناقصة `ViewChannel` و`Connect` و`Speak` و`SendMessages` و`ReadMessageHistory`.
- الفحوصات خاصة بالموفّر: نوايا Discord + أذونات قناة اختيارية؛ نطاقات بوت Slack + المستخدم؛ أعلام بوت Telegram + Webhook؛ إصدار عفريت Signal؛ رمز تطبيق Microsoft Teams + أدوار/نطاقات Graph (مع توضيح حيث تكون معروفة). القنوات التي لا تملك فحوصات تبلّغ `Probe: unavailable`.

## حل الأسماء إلى معرّفات

حل أسماء القنوات/المستخدمين إلى معرّفات باستخدام دليل الموفّر:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

ملاحظات:

- استخدم `--kind user|group|auto` لفرض نوع الهدف.
- يفضّل الحل المطابقات النشطة عندما تتشارك إدخالات متعددة الاسم نفسه.
- `channels resolve` للقراءة فقط. إذا كان الحساب المحدد مضبوطًا عبر SecretRef لكن ذلك الاعتماد غير متاح في مسار الأمر الحالي، يعيد الأمر نتائج غير محلولة متدهورة مع ملاحظات بدلًا من إجهاض التشغيل بالكامل.
- لا يثبّت `channels resolve` Plugins القنوات. استخدم `channels add --channel <name>` قبل حل الأسماء لقناة فهرس قابلة للتثبيت.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [نظرة عامة على القنوات](/ar/channels)
