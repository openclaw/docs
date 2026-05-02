---
read_when:
    - تريد إضافة/إزالة حسابات القنوات (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - تريد التحقق من حالة القناة أو متابعة سجلات القناة
summary: مرجع CLI لـ `openclaw channels` (الحسابات، الحالة، تسجيل الدخول/تسجيل الخروج، السجلات)
title: القنوات
x-i18n:
    generated_at: "2026-05-02T07:20:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3aff374e81e0845805b9baf09d6b63dfe8270cb48606f74f3f1f2dcd56b552c4
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

## الحالة / القدرات / حلّ الأسماء / السجلات

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (فقط مع `--channel`)، `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` هو المسار الحي: على Gateway قابل للوصول، يشغّل فحوصات `probeAccount` لكل حساب وفحوصات `auditAccount` الاختيارية، لذلك يمكن أن يتضمن الإخراج حالة النقل بالإضافة إلى نتائج الفحص مثل `works` أو `probe failed` أو `audit ok` أو `audit failed`.
إذا تعذر الوصول إلى Gateway، يعود `channels status` إلى ملخصات مبنية على الإعدادات فقط بدلًا من إخراج الفحص الحي.

لا تستخدم `openclaw sessions` أو `sessions.list` في Gateway أو أداة الوكيل `sessions_list` كإشارة لصحة مقبس القناة. هذه الأسطح تعرض صفوف المحادثات المخزنة، وليس حالة تشغيل المزوّد. بعد إعادة تشغيل مزوّد Discord، قد يكون الحساب المتصل والهادئ سليمًا حتى لو لم يظهر صف جلسة Discord إلى أن يقع حدث المحادثة الوارد أو الصادر التالي.

## إضافة الحسابات / إزالتها

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
يعرض `openclaw channels add --help` أعلامًا خاصة بكل قناة (الرمز، المفتاح الخاص، رمز التطبيق، مسارات signal-cli، وما إلى ذلك).
</Tip>

يعمل `channels remove` فقط على Plugins القنوات المثبتة/المكوّنة. استخدم `channels add` أولًا لقنوات الكتالوج القابلة للتثبيت.
بالنسبة إلى Plugins القنوات المدعومة بوقت التشغيل، يطلب `channels remove` أيضًا من Gateway العامل إيقاف الحساب المحدد قبل تحديث الإعدادات، بحيث لا يترك تعطيل الحساب أو حذفه المستمع القديم نشطًا حتى إعادة التشغيل.

تشمل أسطح الإضافة غير التفاعلية الشائعة:

- قنوات رمز البوت: `--token`, `--bot-token`, `--app-token`, `--token-file`
- حقول نقل Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- حقول Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- حقول Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- حقول Nostr: `--private-key`, `--relay-urls`
- حقول Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` للمصادقة المدعومة بمتغيرات البيئة لحساب افتراضي حيثما كان ذلك مدعومًا

إذا كان يجب تثبيت Plugin قناة أثناء أمر إضافة موجّه بالأعلام، يستخدم OpenClaw مصدر التثبيت الافتراضي للقناة من دون فتح مطالبة تثبيت Plugin التفاعلية.

عند تشغيل `openclaw channels add` من دون أعلام، يمكن للمعالج التفاعلي أن يطالبك بما يلي:

- معرّفات الحسابات لكل قناة محددة
- أسماء عرض اختيارية لتلك الحسابات
- `Bind configured channel accounts to agents now?`

إذا أكدت الربط الآن، يسألك المعالج أي وكيل يجب أن يملك كل حساب قناة مكوّنًا ويكتب ارتباطات توجيه محددة النطاق بالحساب.

يمكنك أيضًا إدارة قواعد التوجيه نفسها لاحقًا باستخدام `openclaw agents bindings` و`openclaw agents bind` و`openclaw agents unbind` (راجع [الوكلاء](/ar/cli/agents)).

عند إضافة حساب غير افتراضي إلى قناة لا تزال تستخدم إعدادات ذات حساب واحد في المستوى الأعلى، يرقّي OpenClaw القيم ذات الحساب في المستوى الأعلى إلى خريطة حسابات القناة قبل كتابة الحساب الجديد. تصل معظم القنوات بهذه القيم إلى `channels.<channel>.accounts.default`، لكن القنوات المضمّنة يمكنها بدلًا من ذلك الاحتفاظ بحساب موجود مطابق ومُرقّى. Matrix هو المثال الحالي: إذا كان هناك حساب واحد مسمى موجود بالفعل، أو كان `defaultAccount` يشير إلى حساب مسمى موجود، فإن الترقية تحتفظ بذلك الحساب بدلًا من إنشاء `accounts.default` جديد.

يبقى سلوك التوجيه متسقًا:

- تستمر ارتباطات القناة فقط الموجودة (دون `accountId`) في مطابقة الحساب الافتراضي.
- لا ينشئ `channels add` الارتباطات تلقائيًا ولا يعيد كتابتها في الوضع غير التفاعلي.
- يمكن للإعداد التفاعلي أن يضيف اختياريًا ارتباطات محددة النطاق بالحساب.

إذا كانت إعداداتك موجودة بالفعل في حالة مختلطة (حسابات مسماة موجودة وقيم حساب واحد في المستوى الأعلى لا تزال مضبوطة)، فشغّل `openclaw doctor --fix` لنقل القيم محددة النطاق بالحساب إلى الحساب المُرقّى المختار لتلك القناة. تروّج معظم القنوات إلى `accounts.default`؛ يمكن لـ Matrix الاحتفاظ بهدف مسمى/افتراضي موجود بدلًا من ذلك.

## تسجيل الدخول وتسجيل الخروج (تفاعلي)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- يدعم `channels login` الخيار `--verbose`.
- يمكن لـ `channels login` و`logout` استنتاج القناة عندما يكون هناك هدف تسجيل دخول مدعوم واحد فقط مكوّن.
- يفضّل `channels logout` مسار Gateway الحي عندما يكون قابلًا للوصول، بحيث يوقف تسجيل الخروج أي مستمع نشط قبل مسح حالة مصادقة القناة. إذا لم يكن Gateway المحلي قابلًا للوصول، فإنه يعود إلى تنظيف المصادقة المحلي.
- شغّل `channels login` من طرفية على مضيف Gateway. يحظر `exec` الخاص بالوكيل تدفق تسجيل الدخول التفاعلي هذا؛ يجب استخدام أدوات تسجيل دخول الوكيل الأصلية للقناة، مثل `whatsapp_login`، من الدردشة عند توفرها.

## استكشاف الأخطاء وإصلاحها

- شغّل `openclaw status --deep` لإجراء فحص واسع.
- استخدم `openclaw doctor` للإصلاحات الموجّهة.
- يطبع `openclaw channels list` العبارة `Claude: HTTP 403 ... user:profile` ← تحتاج لقطة الاستخدام إلى نطاق `user:profile`. استخدم `--no-usage`، أو وفّر مفتاح جلسة claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`)، أو أعد المصادقة عبر Claude CLI.
- يعود `openclaw channels status` إلى ملخصات مبنية على الإعدادات فقط عندما لا يمكن الوصول إلى Gateway. إذا كانت بيانات اعتماد قناة مدعومة مكوّنة عبر SecretRef لكنها غير متاحة في مسار الأمر الحالي، فإنه يبلّغ عن ذلك الحساب باعتباره مكوّنًا مع ملاحظات تدهور بدلًا من إظهاره كغير مكوّن.

## فحص القدرات

اجلب تلميحات قدرات المزوّد (النوايا/النطاقات حيثما توفرت) بالإضافة إلى دعم الميزات الثابت:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

ملاحظات:

- `--channel` اختياري؛ احذفه لسرد كل قناة (بما في ذلك الامتدادات).
- `--account` صالح فقط مع `--channel`.
- يقبل `--target` القيمة `channel:<id>` أو معرّف قناة رقميًا خامًا، وينطبق فقط على Discord.
- الفحوصات خاصة بالمزوّد: نوايا Discord + أذونات القناة الاختيارية؛ نطاقات بوت Slack والمستخدم؛ أعلام بوت Telegram + Webhook؛ إصدار عفريت Signal؛ رمز تطبيق Microsoft Teams + أدوار/نطاقات Graph (مشروحة حيثما عُرفت). القنوات التي لا تحتوي على فحوصات تعرض `Probe: unavailable`.

## حلّ الأسماء إلى معرّفات

حوّل أسماء القنوات/المستخدمين إلى معرّفات باستخدام دليل المزوّد:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

ملاحظات:

- استخدم `--kind user|group|auto` لفرض نوع الهدف.
- يفضّل الحل المطابقات النشطة عندما تشترك عدة إدخالات في الاسم نفسه.
- `channels resolve` للقراءة فقط. إذا كان حساب محدد مكوّنًا عبر SecretRef لكن بيانات الاعتماد تلك غير متاحة في مسار الأمر الحالي، يعيد الأمر نتائج غير محلولة ومتدهورة مع ملاحظات بدلًا من إيقاف التشغيل بالكامل.
- لا يثبت `channels resolve` Plugins القنوات. استخدم `channels add --channel <name>` قبل حل الأسماء لقناة كتالوج قابلة للتثبيت.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [نظرة عامة على القنوات](/ar/channels)
