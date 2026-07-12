---
read_when:
    - تريد إضافة حسابات القنوات أو إزالتها (Discord وGoogle Chat وiMessage وMatrix وSignal وSlack وTelegram وWhatsApp وغيرها)
    - تريد التحقق من حالة القناة أو متابعة سجلاتها مباشرةً
summary: مرجع CLI لـ `openclaw channels` (الحسابات، الحالة، الإمكانات، التحليل، السجلات، تسجيل الدخول/تسجيل الخروج)
title: القنوات
x-i18n:
    generated_at: "2026-07-12T05:39:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41220535917d645e87dca82bc5c27319eff0035fe14a8cb18f001192b3aad5bd
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

إدارة حسابات قنوات الدردشة وحالة تشغيلها على Gateway.

وثائق ذات صلة:

- أدلة القنوات: [القنوات](/ar/channels)
- إعداد Gateway: [الإعداد](/ar/gateway/configuration)

## الأوامر الشائعة

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

يعرض `channels list` قنوات الدردشة فقط: الحسابات المُعدّة افتراضيًا، مع وسوم الحالة `installed` و`configured` و`enabled` لكل حساب (`--json` لإخراج قابل للمعالجة آليًا). مرّر `--all` لإظهار القنوات المضمّنة التي لم يُعَدّ لها حساب بعد، وكذلك قنوات الكتالوج القابلة للتثبيت التي لم تُثبّت على القرص بعد. توجد مصادقة المزوّد واستخدام النماذج في مواضع أخرى: استخدم `openclaw models auth list` لملفات تعريف مصادقة المزوّد، و`openclaw status` أو `openclaw models list` للاستخدام والحصة.

## الحالة / الإمكانات / الحل / السجلات

- `channels status`:‏ `--channel <name>`، و`--probe`، و`--timeout <ms>` (القيمة الافتراضية `10000`)، و`--json`
- `channels capabilities`:‏ `--channel <name>`، و`--account <id>` (يتطلب `--channel`)، و`--target <dest>` (يتطلب `--channel`)، و`--timeout <ms>` (القيمة الافتراضية `10000`، وبحد أقصى `30000`)، و`--json`
- `channels resolve <entries...>`:‏ `--channel <name>`، و`--account <id>`، و`--kind <auto|user|group>` (القيمة الافتراضية `auto`)، و`--json`
- `channels logs`:‏ `--channel <name|all>` (القيمة الافتراضية `all`)، و`--lines <n>` (القيمة الافتراضية `200`)، و`--json`

يمثّل `channels status --probe` مسار الفحص المباشر: فعندما يكون Gateway متاحًا، يشغّل فحوصات
`probeAccount` وفحوصات `auditAccount` الاختيارية لكل حساب، لذلك قد يتضمن الإخراج حالة
النقل ونتائج الفحص مثل `works` أو `probe failed` أو `audit ok` أو `audit failed`.
إذا تعذر الوصول إلى Gateway، يعود `channels status` إلى ملخصات مستندة إلى الإعداد فقط
بدلًا من إخراج الفحص المباشر.

لا تستخدم `openclaw sessions` أو `sessions.list` في Gateway أو أداة الوكيل
`sessions_list` كمؤشر على سلامة مقبس القناة. تعرض هذه الأسطح
صفوف المحادثات المخزنة، لا حالة تشغيل المزوّد. بعد إعادة تشغيل مزوّد Discord،
قد يكون الحساب المتصل والساكن سليمًا رغم عدم ظهور أي صف جلسة Discord
حتى حدث المحادثة الوارد أو الصادر التالي.

## إضافة الحسابات / إزالتها

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
يعرض `openclaw channels add --help` الخيارات الخاصة بكل قناة (الرمز المميز والمفتاح الخاص ورمز التطبيق المميز ومسارات signal-cli وغير ذلك).
</Tip>

لا يعمل `channels remove` إلا على Plugins القنوات المثبتة أو المُعدّة. استخدم `channels add` أولًا لقنوات الكتالوج القابلة للتثبيت. من دون `--delete`، يطلب تعطيل الحساب ويحتفظ بإعداده؛ أما `--delete` فيزيل إدخالات الإعداد من دون مطالبة.
وبالنسبة إلى Plugins القنوات المدعومة بوقت التشغيل، يطلب `channels remove` أيضًا من Gateway قيد التشغيل إيقاف الحساب المحدد قبل تحديث الإعداد، بحيث لا يؤدي تعطيل حساب أو حذفه إلى إبقاء المستمع القديم نشطًا حتى إعادة التشغيل.

خيارات الإضافة غير التفاعلية المشتركة بين القنوات: `--account <id>`، و`--name <name>`، و`--token`، و`--token-file`، و`--bot-token`، و`--app-token`، و`--secret`، و`--secret-file`، و`--password`، و`--cli-path`، و`--url`، و`--base-url`، و`--http-url`، و`--auth-dir`، و`--use-env` (مصادقة مدعومة بمتغيرات البيئة، للحساب الافتراضي فقط، حيثما تكون مدعومة). تشمل الخيارات الخاصة بالقنوات ما يلي:

| القناة       | الخيارات                                                                                             |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| Google Chat  | `--webhook-path`، و`--webhook-url`، و`--audience-type`، و`--audience`                                |
| iMessage     | `--cli-path`، و`--db-path`، و`--service`، و`--region`                                                |
| Matrix       | `--homeserver`، و`--user-id`، و`--access-token`، و`--password`، و`--device-name`، و`--initial-sync-limit` |
| Nostr        | `--private-key`، و`--relay-urls`                                                                     |
| Signal       | `--signal-number`، و`--cli-path`، و`--http-url`، و`--http-host`، و`--http-port`                       |
| Tlon         | `--ship`، و`--url`، و`--code`، و`--group-channels`، و`--dm-allowlist`، و`--auto-discover-channels`   |
| WhatsApp     | `--auth-dir`                                                                                         |

إذا احتاج Plugin قناة إلى التثبيت أثناء أمر إضافة يعتمد على الخيارات، يستخدم OpenClaw مصدر التثبيت الافتراضي للقناة من دون فتح مطالبة تثبيت Plugin التفاعلية.

عند تشغيل `openclaw channels add` من دون خيارات، يمكن للمعالج التفاعلي طلب ما يلي:

- معرّفات الحسابات لكل قناة محددة
- أسماء عرض اختيارية لتلك الحسابات
- `هل تريد توجيه حسابات القنوات هذه إلى الوكلاء الآن؟`

إذا أكدت الربط الآن، يسأل المعالج عن الوكيل الذي يجب أن يمتلك كل حساب قناة مُعَدّ، ثم يكتب ارتباطات توجيه محددة النطاق بالحساب.

يمكنك أيضًا إدارة قواعد التوجيه نفسها لاحقًا باستخدام `openclaw agents bindings` و`openclaw agents bind` و`openclaw agents unbind` (راجع [الوكلاء](/ar/cli/agents)).

عند إضافة حساب غير افتراضي إلى قناة ما زالت تستخدم إعدادات المستوى الأعلى الخاصة بحساب واحد، يرفع OpenClaw قيم المستوى الأعلى تلك إلى خريطة حسابات القناة قبل كتابة الحساب الجديد. تعيد عملية الرفع استخدام حساب مسمّى موجود عندما يكون للقناة حساب واحد بالضبط، أو عندما يشير `defaultAccount` إلى حساب؛ وإلا فتُخزّن القيم في `channels.<channel>.accounts.default`.

يظل سلوك التوجيه متسقًا:

- تستمر الارتباطات الحالية الخاصة بالقناة فقط (من دون `accountId`) في مطابقة الحساب الافتراضي.
- لا ينشئ `channels add` الارتباطات أو يعيد كتابتها تلقائيًا في الوضع غير التفاعلي.
- يمكن للإعداد التفاعلي إضافة ارتباطات محددة النطاق بالحساب اختياريًا.

إذا كان إعدادك في حالة مختلطة بالفعل (توجد حسابات مسمّاة وما زالت قيم الحساب الواحد في المستوى الأعلى معيّنة)، فشغّل `openclaw doctor --fix` لنقل القيم محددة النطاق بالحساب إلى الحساب المرفوع المختار لتلك القناة.

## تسجيل الدخول والخروج (تفاعلي)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- يدعم `channels login` الخيارين `--account <id>` و`--verbose`؛ ويدعم `channels logout` الخيار `--account <id>`.
- يمكن لـ`channels login` و`logout` استنتاج القناة عندما تدعم قناة مُعدّة واحدة فقط هذا الإجراء؛ وعند وجود عدة قنوات، مرّر `--channel`.
- يفضّل `channels logout` مسار Gateway المباشر عندما يكون متاحًا، بحيث يوقف تسجيل الخروج أي مستمع نشط قبل مسح حالة مصادقة القناة. إذا تعذر الوصول إلى Gateway محلي، فإنه يعود إلى تنظيف المصادقة محليًا؛ أما مع `gateway.mode: "remote"` فيؤدي خطأ Gateway إلى فشل الأمر بدلًا من ذلك.
- بعد نجاح تسجيل الدخول، تطلب CLI من Gateway محلي متاح بدء الحساب؛ وفي الوضع البعيد تحفظ المصادقة محليًا وتوضح أن وقت التشغيل البعيد لم يُعَد تشغيله.
- شغّل `channels login` من طرفية على مضيف Gateway. يحظر `exec` الخاص بالوكيل تدفق تسجيل الدخول التفاعلي هذا؛ ويجب استخدام أدوات تسجيل دخول الوكيل الأصلية للقناة، مثل `whatsapp_login`، من الدردشة عند توفرها.

## استكشاف الأخطاء وإصلاحها

- شغّل `openclaw status --deep` لإجراء فحص واسع.
- استخدم `openclaw doctor` للإصلاحات الموجّهة.
- يعود `openclaw channels status` إلى ملخصات مستندة إلى الإعداد فقط عندما يتعذر الوصول إلى Gateway. إذا كانت بيانات اعتماد قناة مدعومة مُعدّة عبر SecretRef لكنها غير متاحة في مسار الأمر الحالي، فسيبلّغ عن ذلك الحساب باعتباره مُعدًا مع ملاحظات تفيد بتدهور الحالة بدلًا من إظهاره على أنه غير مُعَدّ.

## فحص الإمكانات

اجلب تلميحات إمكانات المزوّد (الأغراض/النطاقات حيثما توفرت) بالإضافة إلى دعم الميزات الثابت:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

ملاحظات:

- الخيار `--channel` اختياري؛ احذفه لسرد كل قناة (بما فيها القنوات التي توفرها Plugins).
- لا يكون `--account` صالحًا إلا مع `--channel`.
- يقبل `--target` القيمة `channel:<id>` أو معرّف قناة رقميًا خامًا، ولا ينطبق إلا على Discord. بالنسبة إلى قنوات Discord الصوتية، يشير فحص الأذونات إلى غياب `ViewChannel` و`Connect` و`Speak` و`SendMessages` و`ReadMessageHistory`.
- تعتمد الفحوصات على المزوّد: هوية روبوت Discord وأغراضه، إضافة إلى أذونات القناة الاختيارية؛ وروبوت Slack ونطاقات المستخدم؛ وخيارات روبوت Telegram وWebhook؛ وإصدار برنامج Signal الخدمي؛ ورمز تطبيق Microsoft Teams المميز وأدوار/نطاقات Graph (مع تعليقات توضيحية حيثما كانت معروفة). تعرض القنوات التي لا تتوفر لها فحوصات `Probe: unavailable`.

## تحويل الأسماء إلى معرّفات

حوّل أسماء القنوات/المستخدمين إلى معرّفات باستخدام دليل المزوّد:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

ملاحظات:

- استخدم `--kind user|group|auto` لفرض نوع الهدف.
- تفضّل عملية الحل المطابقات النشطة عندما تشترك عدة إدخالات في الاسم نفسه.
- `channels resolve` للقراءة فقط. إذا كان حساب محدد مُعدًا عبر SecretRef لكن بيانات الاعتماد تلك غير متاحة في مسار الأمر الحالي، يعيد الأمر نتائج غير محلولة متدهورة مع ملاحظات بدلًا من إيقاف التشغيل بالكامل.
- لا يثبّت `channels resolve` Plugins القنوات. استخدم `channels add --channel <name>` قبل حل الأسماء لقناة كتالوج قابلة للتثبيت.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [نظرة عامة على القنوات](/ar/channels)
