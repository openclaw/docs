---
read_when:
    - تريد إضافة/إزالة حسابات القنوات (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - تريد التحقق من حالة القناة أو متابعة سجلات القناة مباشرةً
summary: مرجع CLI لـ `openclaw channels` (الحسابات، الحالة، تسجيل الدخول/تسجيل الخروج، السجلات)
title: القنوات
x-i18n:
    generated_at: "2026-04-24T07:33:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31c0f3b830f12e8561ba52f70a599d8b572fcb0a9f9c25e5608860bb7e8661de
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

إدارة حسابات قنوات الدردشة وحالة تشغيلها على Gateway.

الوثائق ذات الصلة:

- أدلة القنوات: [القنوات](/ar/channels/index)
- إعداد Gateway: [الإعداد](/ar/gateway/configuration)

## الأوامر الشائعة

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## الحالة / الإمكانات / الحل / السجلات

- `channels status`: ‏`--probe`، و`--timeout <ms>`، و`--json`
- `channels capabilities`: ‏`--channel <name>`، و`--account <id>` (فقط مع `--channel`)، و`--target <dest>`، و`--timeout <ms>`، و`--json`
- `channels resolve`: ‏`<entries...>`، و`--channel <name>`، و`--account <id>`، و`--kind <auto|user|group>`، و`--json`
- `channels logs`: ‏`--channel <name|all>`، و`--lines <n>`، و`--json`

يمثل `channels status --probe` المسار الحي: على بوابة يمكن الوصول إليها، يشغّل لكل حساب
عمليات `probeAccount` وفحوصات `auditAccount` الاختيارية، لذلك يمكن أن يتضمن الناتج حالة
النقل بالإضافة إلى نتائج الفحص مثل `works` أو `probe failed` أو `audit ok` أو `audit failed`.
إذا تعذر الوصول إلى Gateway، يعود `channels status` إلى ملخصات تعتمد على الإعدادات فقط
بدلًا من ناتج الفحص الحي.

## إضافة / إزالة الحسابات

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

نصيحة: يعرض `openclaw channels add --help` العلامات الخاصة بكل قناة (token، والمفتاح الخاص، وapp token، ومسارات signal-cli، وغيرها).

تشمل أسطح الإضافة الشائعة غير التفاعلية ما يلي:

- قنوات bot-token: ‏`--token`، و`--bot-token`، و`--app-token`، و`--token-file`
- حقول نقل Signal/iMessage: ‏`--signal-number`، و`--cli-path`، و`--http-url`، و`--http-host`، و`--http-port`، و`--db-path`، و`--service`، و`--region`
- حقول Google Chat: ‏`--webhook-path`، و`--webhook-url`، و`--audience-type`، و`--audience`
- حقول Matrix: ‏`--homeserver`، و`--user-id`، و`--access-token`، و`--password`، و`--device-name`، و`--initial-sync-limit`
- حقول Nostr: ‏`--private-key`، و`--relay-urls`
- حقول Tlon: ‏`--ship`، و`--url`، و`--code`، و`--group-channels`، و`--dm-allowlist`، و`--auto-discover-channels`
- `--use-env` لمصادقة الحساب الافتراضي المدعومة عبر env حيثما كانت مدعومة

عند تشغيل `openclaw channels add` من دون علامات، يمكن أن يطالبك المعالج التفاعلي بما يلي:

- معرّفات الحسابات لكل قناة محددة
- أسماء عرض اختيارية لتلك الحسابات
- `Bind configured channel accounts to agents now?`

إذا أكدت الربط الآن، فسيسألك المعالج أي وكيل يجب أن يملك كل حساب قناة مُهيأ وسيكتب روابط توجيه بنطاق الحساب.

يمكنك أيضًا إدارة قواعد التوجيه نفسها لاحقًا باستخدام `openclaw agents bindings` و`openclaw agents bind` و`openclaw agents unbind` (راجع [agents](/ar/cli/agents)).

عندما تضيف حسابًا غير افتراضي إلى قناة لا تزال تستخدم إعدادات أحادية الحساب في المستوى الأعلى، يقوم OpenClaw بترقية القيم العليا ذات نطاق الحساب إلى خريطة حسابات القناة قبل كتابة الحساب الجديد. تنقل معظم القنوات هذه القيم إلى `channels.<channel>.accounts.default`، لكن يمكن للقنوات المضمّنة الحفاظ على حساب مُرقّى مطابق موجود بدلًا من ذلك. Matrix هو المثال الحالي: إذا كان هناك حساب مسمى واحد موجود بالفعل، أو كان `defaultAccount` يشير إلى حساب مسمى موجود، فإن الترقية تحافظ على ذلك الحساب بدلًا من إنشاء `accounts.default` جديد.

يبقى سلوك التوجيه متسقًا:

- تستمر الروابط الحالية الخاصة بالقناة فقط (من دون `accountId`) في مطابقة الحساب الافتراضي.
- لا يقوم `channels add` بإنشاء الروابط أو إعادة كتابتها تلقائيًا في الوضع غير التفاعلي.
- يمكن للإعداد التفاعلي إضافة روابط بنطاق الحساب اختياريًا.

إذا كانت إعداداتك في حالة مختلطة بالفعل (وجود حسابات مسماة مع بقاء قيم أحادية الحساب في المستوى الأعلى)، فشغّل `openclaw doctor --fix` لنقل القيم ذات نطاق الحساب إلى الحساب المرقّى المختار لتلك القناة. تقوم معظم القنوات بالترقية إلى `accounts.default`؛ ويمكن لـ Matrix الحفاظ على هدف مسمى/افتراضي موجود بدلًا من ذلك.

## تسجيل الدخول / تسجيل الخروج (تفاعلي)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

ملاحظات:

- يدعم `channels login` الخيار `--verbose`.
- يمكن لكل من `channels login` و`logout` استنتاج القناة عندما يكون هدف تسجيل دخول مدعوم واحد فقط مهيأ.

## استكشاف الأخطاء وإصلاحها

- شغّل `openclaw status --deep` لإجراء فحص واسع.
- استخدم `openclaw doctor` للحصول على إصلاحات موجّهة.
- يطبع `openclaw channels list` القيمة `Claude: HTTP 403 ... user:profile` ← تحتاج لقطة الاستخدام إلى النطاق `user:profile`. استخدم `--no-usage`، أو وفّر مفتاح جلسة claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`)، أو أعد المصادقة عبر Claude CLI.
- يعود `openclaw channels status` إلى ملخصات تعتمد على الإعدادات فقط عندما يتعذر الوصول إلى Gateway. إذا كانت بيانات اعتماد قناة مدعومة مهيأة عبر SecretRef لكنها غير متاحة في مسار الأمر الحالي، فإنه يبلّغ عن ذلك الحساب على أنه مُهيأ مع ملاحظات تدهور بدلًا من إظهاره على أنه غير مُهيأ.

## فحص الإمكانات

اجلب تلميحات إمكانات المزوّد (intents/scopes حيثما كانت متاحة) بالإضافة إلى دعم الميزات الثابت:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

ملاحظات:

- `--channel` اختياري؛ احذفه لسرد كل قناة (بما في ذلك الإضافات).
- لا يكون `--account` صالحًا إلا مع `--channel`.
- يقبل `--target` القيمة `channel:<id>` أو معرّف قناة رقمي خام، ولا ينطبق إلا على Discord.
- تكون الفحوصات خاصة بالمزوّد: Discord intents + أذونات القناة الاختيارية؛ Slack bot + user scopes؛ Telegram bot flags + Webhook؛ إصدار Signal daemon؛ Microsoft Teams app token + أدوار/نطاقات Graph (مع توضيحها عند المعرفة). القنوات التي لا تحتوي على فحوصات تعرض `Probe: unavailable`.

## حل الأسماء إلى معرّفات

حل أسماء القنوات/المستخدمين إلى معرّفات باستخدام دليل المزوّد:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

ملاحظات:

- استخدم `--kind user|group|auto` لفرض نوع الهدف.
- يفضّل الحل التطابقات النشطة عندما تشترك عدة إدخالات في الاسم نفسه.
- `channels resolve` للقراءة فقط. إذا كان حساب محدد مهيأ عبر SecretRef لكن بيانات الاعتماد تلك غير متاحة في مسار الأمر الحالي، فإن الأمر يعيد نتائج غير محلولة متدهورة مع ملاحظات بدلًا من إيقاف التشغيل بالكامل.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [نظرة عامة على القنوات](/ar/channels)
