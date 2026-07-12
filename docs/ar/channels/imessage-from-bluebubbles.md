---
read_when:
    - التخطيط للانتقال من BlueBubbles إلى Plugin ‏iMessage المضمّن
    - ترجمة مفاتيح إعداد BlueBubbles إلى نظيراتها في iMessage
    - التحقق من `imsg` قبل تمكين Plugin ‏iMessage
summary: 'ترحيل إعدادات BlueBubbles القديمة إلى Plugin ‏iMessage المضمّن: تعيين المفاتيح، وضوابط قائمة السماح للمجموعات، والتحقق من الانتقال.'
title: الانتقال من BlueBubbles
x-i18n:
    generated_at: "2026-07-12T05:33:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9d1533c356d3901358c25f0b90e6850124f66d3c14f056d90d5723242076d22
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

أُزيل دعم BlueBubbles. لا يدعم OpenClaw ‏iMessage إلا من خلال Plugin ‏`imessage` المضمّن، الذي يشغّل [`steipete/imsg`](https://github.com/steipete/imsg) عبر JSON-RPC ويصل إلى واجهة API الخاصة نفسها التي كان يصل إليها BlueBubbles (`react` و`edit` و`unsend` و`reply` و`sendWithEffect` والاستطلاعات الأصلية وإدارة المجموعات والمرفقات). يحل ملف CLI تنفيذي واحد محل خادم BlueBubbles + تطبيق العميل + توصيلات Webhook: لا توجد نقطة نهاية REST ولا مصادقة Webhook.

يرشدك هذا الدليل إلى ترحيل إعدادات `channels.bluebubbles` القديمة إلى `channels.imessage`. لا يوجد مسار ترحيل آخر مدعوم. في الإصدار الحالي من OpenClaw، تكون أي كتلة `channels.bluebubbles` متبقية خاملة — إذ لا يقرأها أي مكوّن في وقت التشغيل.

<Note>
للاطلاع على الإعلان المختصر وملخص المشغّل، راجع [إزالة BlueBubbles ومسار imsg لـ iMessage](/ar/announcements/bluebubbles-imessage).
</Note>

## قائمة التحقق للترحيل

أقصر مسار آمن عندما تكون على دراية بإعداد BlueBubbles القديم:

1. تحقّق من `imsg` مباشرةً على جهاز Mac الذي يشغّل Messages.app (`imsg chats` و`imsg history` و`imsg send` و`imsg rpc --help`).
2. انسخ مفاتيح السلوك من `channels.bluebubbles` إلى `channels.imessage`: ‏`dmPolicy` و`allowFrom` و`groupPolicy` و`groupAllowFrom` و`groups` و`includeAttachments` و`attachmentRoots` و`mediaMaxMb` و`textChunkLimit` و`coalesceSameSenderDms` و`actions`.
3. احذف مفاتيح النقل التي لم تعد موجودة: `serverUrl` و`password` وعناوين URL الخاصة بـ Webhook وإعداد خادم BlueBubbles.
4. إذا لم يكن Gateway يعمل على جهاز Mac الخاص بـ Messages، فاضبط `channels.imessage.cliPath` على مغلّف SSH واضبط `remoteHost` لجلب المرفقات عن بُعد.
5. فعّل `channels.imessage`، وأعد تشغيل Gateway، ثم شغّل `openclaw channels status --probe --channel imessage`.
6. اختبر رسالة مباشرة واحدة، ومجموعة واحدة مسموحًا بها، والمرفقات إذا كانت مفعّلة، وكل إجراء من إجراءات واجهة API الخاصة تتوقع أن يستخدمه الوكيل.
7. احذف خادم BlueBubbles وإعداد `channels.bluebubbles` القديم بعد التحقق من مسار iMessage.

## ما يفعله imsg

`imsg` هو CLI محلي لنظام macOS خاص بتطبيق Messages. يبدأ OpenClaw تشغيل `imsg rpc` كعملية فرعية ويتواصل معه عبر JSON-RPC من خلال الإدخال القياسي/الإخراج القياسي. لا يوجد خادم HTTP أو عنوان URL لـ Webhook أو برنامج خفي في الخلفية أو وكيل تشغيل أو منفذ يجب كشفه.

- تأتي عمليات القراءة من `~/Library/Messages/chat.db` باستخدام معالج SQLite للقراءة فقط.
- تأتي الرسائل الواردة المباشرة من `imsg watch` / `watch.subscribe`، الذي يتتبع أحداث نظام الملفات الخاصة بـ `chat.db` مع استخدام الاستقصاء كخيار احتياطي.
- تستخدم عمليات الإرسال أتمتة Messages.app لإرسال النصوص والملفات العادية.
- تستخدم الإجراءات المتقدمة `imsg launch` لحقن مساعد `imsg` في Messages.app. وهذا ما يتيح إيصالات القراءة ومؤشرات الكتابة وعمليات الإرسال المنسّقة والتحرير وإلغاء الإرسال والردود المتسلسلة وردود tapback والاستطلاعات وإدارة المجموعات.
- يمكن لإصدارات Linux فحص نسخة من `chat.db`، لكنها لا تستطيع الإرسال أو مراقبة قاعدة بيانات Mac المباشرة أو التحكم في Messages.app. لاستخدام iMessage مع OpenClaw، شغّل `imsg` على جهاز Mac الذي تم تسجيل الدخول إليه أو من خلال مغلّف SSH متصل بذلك الجهاز.

## قبل البدء

1. ثبّت `imsg` على جهاز Mac الذي يشغّل Messages.app:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg chats --limit 3
   ```

   في الإعداد المحلي المعتاد، يمكن لإعداد OpenClaw أن يعرض تثبيت `imsg` أو تحديثه عبر Homebrew على جهاز Mac المسجّل دخوله إلى Messages، بعد تأكيد المستخدم. تظل الإعدادات اليدوية والبُنى التي تستخدم مغلّف SSH تحت إدارة المشغّل: كرّر تحديث Homebrew ضمن سياق المستخدم المحلي أو البعيد نفسه الذي سيشغّل `imsg`. إذا فشل `imsg chats` برسالة `unable to open database file` أو أعاد ناتجًا فارغًا أو رسالة `authorization denied`، فامنح صلاحية الوصول الكامل إلى القرص للطرفية أو المحرر أو عملية Node أو خدمة Gateway أو عملية SSH الأصل التي تشغّل `imsg`، ثم أعد فتح تلك العملية الأصل.

2. تحقّق من واجهات القراءة والمراقبة والإرسال وRPC قبل تغيير إعداد OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   استبدل `42` بمعرّف محادثة حقيقي من `imsg chats`. يتطلب الإرسال إذن Automation لتطبيق Messages.app. إذا كان OpenClaw سيعمل عبر SSH، فشغّل هذه الأوامر من خلال مغلّف SSH نفسه أو ضمن سياق المستخدم نفسه الذي سيستخدمه OpenClaw. إذا نجحت عمليات القراءة لكن فشل الإرسال بسبب خطأ AppleEvents ‏`-1743`، فتحقّق مما إذا كان إذن Automation قد أُسنِد إلى `/usr/libexec/sshd-keygen-wrapper`؛ راجع [فشل الإرسال عبر مغلّف SSH بسبب AppleEvents -1743](/ar/channels/imessage#requirements-and-permissions-macos).

3. فعّل جسر واجهة API الخاصة. يوصى به بشدة لاستخدام iMessage مع OpenClaw لأن الردود وردود tapback والتأثيرات والاستطلاعات والردود على المرفقات وإجراءات المجموعات تعتمد عليه:

   ```bash
   imsg launch
   imsg status --json
   ```

   يتطلب `imsg launch` تعطيل SIP (وفي إصدارات macOS الحديثة، تخفيف التحقق من صحة المكتبات — راجع [تمكين واجهة API الخاصة بـ imsg](/ar/channels/imessage#enabling-the-imsg-private-api)). تعمل وظائف الإرسال الأساسية والسجل والمراقبة دون `imsg launch`؛ أما مجموعة إجراءات iMessage الكاملة في OpenClaw فلا تعمل بدونه.

4. بعد تفعيل `channels.imessage` وتشغيل Gateway، تحقّق من الجسر عبر OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   يجب أن يعرض حساب iMessage الحالة `works`؛ وعند استخدام `--json`، تتضمن حمولة الفحص `privateApi.available: true`. إذا عرضت `false`، فأصلح ذلك أولًا — راجع [اكتشاف القدرات](/ar/channels/imessage#private-api-actions). يتطلب الفحص Gateway يمكن الوصول إليه (وإلا يعود CLI إلى ناتج يستند إلى الإعداد فقط)، ولا يفحص إلا الحسابات المضبوطة والمفعّلة.

5. أنشئ نسخة احتياطية من إعدادك:

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## تحويل الإعداد

يشترك iMessage وBlueBubbles في معظم مفاتيح السلوك على مستوى القناة. ما يتغير هو وسيلة النقل (خادم REST مقابل CLI محلي) وتنسيق مفتاح سجل المجموعات.

| BlueBubbles                                                | iMessage المضمّن                          | ملاحظات                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | الدلالات نفسها (القيمة الافتراضية `true` بمجرد وجود الكتلة).                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.serverUrl`                           | _(أُزيل)_                                 | لا يوجد خادم REST — يشغّل Plugin الأمر `imsg rpc` عبر الإدخال/الإخراج القياسي.                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.password`                            | _(أُزيل)_                                 | لا حاجة إلى مصادقة Webhook.                                                                                                                                                                                                                                                                                     |
| _(ضمني)_                                               | `channels.imessage.cliPath`               | المسار إلى `imsg` (الافتراضي `imsg`)؛ استخدم برنامجًا نصيًا مغلّفًا لـ SSH.                                                                                                                                                                                                                                                        |
| _(ضمني)_                                               | `channels.imessage.dbPath`                | تجاوز اختياري لملف `chat.db` الخاص بـ Messages.app؛ يُكتشف تلقائيًا عند حذفه.                                                                                                                                                                                                                                                 |
| _(ضمني)_                                               | `channels.imessage.remoteHost`            | ‏`host` أو `user@host` — لا يلزم إلا عندما يكون `cliPath` مغلّف SSH وتريد جلب المرفقات عبر SCP.                                                                                                                                                                                                             |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | القيم نفسها (`pairing` / `allowlist` / `open` / `disabled`)؛ الافتراضي `pairing`.                                                                                                                                                                                                                                       |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | تنسيقات المعرّفات نفسها (`+15555550123`، `user@example.com`). لا تنتقل موافقات مخزن الاقتران — انظر أدناه.                                                                                                                                                                                                        |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | القيم نفسها (`allowlist` / `open` / `disabled`)؛ الافتراضي `allowlist`.                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | مماثل. عند عدم تعيينه، يعود iMessage إلى `allowFrom`؛ وتحظر القيمة الفارغة صراحةً `groupAllowFrom: []` جميع المجموعات ضمن `groupPolicy: "allowlist"`.                                                                                                                                                                    |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | انسخ مُدخل حرف البدل `"*"` حرفيًا؛ وأعد تعيين مفاتيح مُدخلات كل مجموعة باستخدام قيمة iMessage الرقمية `chat_id` — راجع «مأزق سجل المجموعات». تنتقل `requireMention` و`tools` و`toolsBySender` و`systemPrompt` كما هي.                                                                                                                 |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | الافتراضي `true`. مع Plugin المضمّن، لا يعمل هذا إلا عندما يكون فحص واجهة API الخاصة ناجحًا.                                                                                                                                                                                                                             |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | البنية نفسها، ومعطّل افتراضيًا كذلك. إذا كانت المرفقات تمر عبر BlueBubbles، فعيّن هذا صراحةً — تُسقط الصور/الوسائط الواردة بصمت (من دون سطر سجل `Inbound message`) حتى تفعل ذلك.                                                                                                                                  |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | الجذور المحلية؛ قواعد أحرف البدل نفسها.                                                                                                                                                                                                                                                                                     |
| _(غير منطبق)_                                                    | `channels.imessage.remoteAttachmentRoots` | يُستخدم فقط عند تعيين `remoteHost` لعمليات الجلب عبر SCP.                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | الافتراضي 16 ميغابايت على iMessage (كان افتراضي BlueBubbles‏ 8 ميغابايت). عيّنه صراحةً للإبقاء على الحد الأدنى.                                                                                                                                                                                                                       |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | الافتراضي 4000 في كليهما.                                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | خيار الاشتراك نفسه. للرسائل الخاصة فقط — تحتفظ المجموعات بالإرسال لكل رسالة. يوسّع مهلة إزالة ارتداد الوارد الافتراضية إلى 7000 مللي ثانية، ما لم يُعيّن `messages.inbound.byChannel.imessage` أو الإعداد العام `messages.inbound.debounceMs`. راجع [دمج الرسائل الخاصة المرسلة على أجزاء](/ar/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(غير منطبق)_                                   | يعرض `imsg` بالفعل أسماء العرض للمرسلين من `chat.db`.                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | مفاتيح التبديل نفسها لكل إجراء (`reactions`، `edit`، `unsend`، `reply`، `sendWithEffect`، `renameGroup`، `setGroupIcon`، `addParticipant`، `removeParticipant`، `leaveGroup`، `sendAttachment`) بالإضافة إلى `polls` الجديد. جميعها مفعّلة افتراضيًا؛ ولا تزال إجراءات واجهة API الخاصة تتطلب الجسر.                                      |

تُحوَّل إعدادات الحسابات المتعددة (`channels.bluebubbles.accounts.*`) واحدًا إلى واحد إلى `channels.imessage.accounts.*`.

## مأزق سجل المجموعات

يشغّل Plugin ‏iMessage المضمّن بوابتي تحقق للمجموعات بالتتابع. يجب أن تجتاز رسالة المجموعة كلتيهما لتصل إلى الوكيل:

1. **قائمة السماح للمرسل / وجهة المحادثة** (`channels.imessage.groupAllowFrom`) — تطابق معرّف المرسل أو وجهة المحادثة (مُدخلات `chat_id:` و`chat_guid:` و`chat_identifier:`). عند عدم تعيين `groupAllowFrom`، تعود هذه البوابة إلى `allowFrom`؛ وتعطّل القيمة الصريحة `groupAllowFrom: []` هذا الرجوع وتُسقط كل رسالة مجموعة ضمن `groupPolicy: "allowlist"`.
2. **سجل المجموعات** (`channels.imessage.groups`) — مفاتيحه قيم iMessage الرقمية `chat_id`:
   - لا توجد كتلة `groups` (أو كانت فارغة): تجتاز المجموعات هذه البوابة ما دامت قائمة السماح الفعلية للمرسلين في البوابة 1 غير فارغة؛ تتحكم تصفية المرسلين في الوصول ولا يظهر تحذير إسقاط الجميع عند بدء التشغيل.
   - يحتوي `groups` على مُدخلات لكن بلا `"*"`: لا تجتاز سوى مفاتيح `chat_id` المدرجة. يؤدي إدراج أي مجموعة إلى تحويل السجل إلى قائمة سماح حتى ضمن `groupPolicy: "open"`.
   - ‏`groups: { "*": { ... } }`: تجتاز كل مجموعة هذه البوابة.

مأزق الترحيل: استخدم BlueBubbles معرّف GUID للمحادثة / معرّف المحادثة كمفاتيح لمُدخلات `groups`، بينما يستخدم سجل iMessage القيمة الرقمية `chat_id` كمفاتيح. يؤدي نسخ مُدخلات كل مجموعة حرفيًا إلى إنشاء سجل غير فارغ لا تتطابق مفاتيحه مطلقًا، ولذلك تُسقط كل رسالة مجموعة عند البوابة 2. انسخ حرف البدل `"*"` حرفيًا؛ وأعد تعيين مفاتيح مُدخلات المجموعات المحددة باستخدام قيم `chat_id` من `imsg chats`.

يظهر مسارا الإسقاط كلاهما عند مستوى السجل الافتراضي عبر أسطر `warn`:

- مرة واحدة لكل حساب عند بدء التشغيل، عندما يكون `groupPolicy: "allowlist"` معينًا وتكون قائمة السماح الفعلية لمرسلي المجموعات فارغة: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`. عيّن `groupAllowFrom` (أو `allowFrom`) للسماح للمرسلين؛ لا تؤدي إضافة `groups` وحدها إلى استيفاء بوابة المرسل.
- مرة واحدة لكل `chat_id` في وقت التشغيل، عندما يُسقط السجل مجموعة: `imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`، مع تسمية المفتاح الدقيق المطلوب إضافته.

تستمر الرسائل الخاصة في العمل في الحالتين — فهي تسلك مسارًا برمجيًا مختلفًا، لذلك لا يثبت نجاح الرسائل الخاصة صحة توجيه المجموعات.

الحد الأدنى للإعداد المقيّد بالمرسل مع `groupPolicy: "allowlist"`:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
    },
  },
}
```

يسمح هذا للمرسلين المُعدّين في أي مجموعة. أضف مُدخلات `groups` لتقييد المحادثات المسموح بها أو لتعيين خيارات لكل محادثة مثل `requireMention`؛ انسخ مُدخل `"*"` الخاص بـ BlueBubbles حرفيًا، لكن أعد تعيين مفاتيح المُدخلات المحددة باستخدام قيم iMessage الرقمية `chat_id`.

## خطوة بخطوة

1. ترجم الإعدادات. أبقِ الكتلة الجديدة معطّلة أثناء التحرير؛ يتجاهل الإصدار الحالي من OpenClaw كتلة `channels.bluebubbles` القديمة، ويمكن إبقاؤها بجانبها كمرجع:

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // flip to true when ready to cut over
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // wildcard copies verbatim; re-key per-chat entries by chat_id
         // actions default to enabled; set individual toggles false to disable
       },
     },
   }
   ```

2. **حوّل المسار واختبره.** اضبط `channels.imessage.enabled: true`، وأعد تشغيل Gateway، ثم تأكد من أن القناة تُبلغ عن حالة سليمة:

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # expect "works"; --json shows privateApi.available: true
   ```

   يتطلب الاختبار إمكانية الوصول إلى Gateway، ولا يختبر إلا الحسابات المُعدّة والمفعّلة. استخدم أوامر `imsg` المباشرة الواردة في [قبل البدء](#before-you-start) للتحقق من جهاز Mac نفسه.

3. **تحقق من الرسائل المباشرة.** أرسل رسالة مباشرة إلى الوكيل، وتأكد من وصول الرد.

4. **تحقق من المجموعات بصورة منفصلة.** تسلك الرسائل المباشرة والمجموعات مسارات برمجية مختلفة — فنجاح الرسائل المباشرة لا يثبت توجيه رسائل المجموعات. أرسل رسالة في محادثة جماعية مسموح بها وتأكد من وصول الرد. إذا صمتت المجموعة (لا رد من الوكيل ولا خطأ)، فتحقق من سجل Gateway بحثًا عن سطري `warn` الواردين في قسم "مأزق سجل المجموعات" أعلاه. يعني تحذير بدء التشغيل أن قائمة السماح الفعلية للمرسلين فارغة؛ ويعني التحذير الخاص بقيمة `chat_id` أن سجل `groups` المعبأ لا يحتوي على تلك المحادثة.

5. **تحقق من مجموعة الإجراءات المتاحة.** من رسالة مباشرة مقترنة، اطلب من الوكيل إضافة تفاعل، وتعديل رسالة، والتراجع عن إرسالها، والرد عليها، وإرسال صورة، واطلب منه (داخل مجموعة) إعادة تسمية المجموعة أو إضافة مشارك أو إزالته. يجب أن يظهر كل إجراء بصورة أصلية في Messages.app. إذا ألقى أي إجراء الخطأ `iMessage <action> requires the imsg private API bridge`، فشغّل `imsg launch` مرة أخرى وحدّث الحالة باستخدام `openclaw channels status --probe`.

6. **أزل خادم BlueBubbles وكتلة `channels.bluebubbles`** بعد التحقق من الرسائل المباشرة والمجموعات والإجراءات في iMessage. لا يقرأ OpenClaw الإعداد `channels.bluebubbles`.

## نظرة سريعة على تكافؤ الإجراءات

| الإجراء                                              | BlueBubbles القديم | iMessage المضمّن                                                              |
| --------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| إرسال نص / الرجوع إلى SMS                            | ✅                 | ✅                                                                            |
| إرسال وسائط (صورة، فيديو، ملف، رسالة صوتية)          | ✅                 | ✅                                                                            |
| رد مترابط (`reply_to_guid`)                          | ✅                 | ✅ (يُغلق [#51892](https://github.com/openclaw/openclaw/issues/51892))       |
| تفاعل Tapback (`react`)                              | ✅                 | ✅                                                                            |
| التعديل / التراجع عن الإرسال (المستلمون على macOS 13+) | ✅                 | ✅                                                                            |
| الإرسال مع تأثير شاشة                                | ✅                 | ✅ (يُغلق جزءًا من [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| نص منسق عريض / مائل / مسطر / يتوسطه خط              | ✅                 | ✅ (تنسيق نطاقات محددة الأنواع عبر attributedBody)                            |
| استطلاعات Messages الأصلية (الإنشاء والتصويت)        | ❌                 | ✅ (`actions.polls`؛ يحتاج المستلمون إلى iOS/macOS 26+ للعرض الأصلي)          |
| إعادة تسمية المجموعة / تعيين أيقونتها                | ✅                 | ✅                                                                            |
| إضافة مشارك / إزالته، مغادرة المجموعة                | ✅                 | ✅                                                                            |
| إيصالات القراءة ومؤشر الكتابة                        | ✅                 | ✅ (مشروط بنجاح اختبار واجهة API الخاصة)                                      |
| دمج الرسائل المباشرة من المرسل نفسه                  | ✅                 | ✅ (للرسائل المباشرة فقط؛ يُفعّل اختياريًا عبر `channels.imessage.coalesceSameSenderDms`) |
| استعادة الرسائل الواردة بعد إعادة التشغيل            | ✅                 | ✅ (تلقائي: إعادة تشغيل `since_rowid` + إزالة التكرار بحسب GUID؛ نافذة أوسع محليًا) |

يستعيد iMessage الرسائل التي فاتت أثناء توقف Gateway: عند بدء التشغيل، يعيد تشغيل الرسائل بدءًا من آخر معرّف صف أُرسل عبر `imsg watch.subscribe` و`since_rowid`، ويزيل التكرارات بحسب GUID، كما يمنع حاجز عمر التراكم القديم "قنبلة التراكم" الناتجة عن تفريغ Push. يجري ذلك عبر اتصال RPC الخاص بـ`imsg`، ولذلك يعمل أيضًا مع إعدادات `cliPath` البعيدة عبر SSH؛ وتحصل الإعدادات المحلية على نافذة استعادة أوسع لأنها تستطيع قراءة `chat.db`. راجع [استعادة الرسائل الواردة بعد إعادة تشغيل الجسر أو Gateway](/ar/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## الاقتران والجلسات وارتباطات ACP

- **تنتقل قوائم السماح بحسب المعرّف.** يتعرف `channels.imessage.allowFrom` على سلاسل `+15555550123` / `user@example.com` نفسها التي استخدمها BlueBubbles — انسخها حرفيًا.
- **لا تنتقل موافقات مخزن الاقتران.** مخزن الاقتران خاص بكل قناة، ولا تُرحّل أي آلية مخزن BlueBubbles القديم. يجب على المرسلين الذين تمت الموافقة عليهم عبر الاقتران فقط إجراء الاقتران مرة أخرى ضمن iMessage، أو يمكنك إضافة معرّفاتهم إلى `allowFrom`.
- **تبقى الجلسات** محددة النطاق لكل وكيل + محادثة. تُدمج الرسائل المباشرة في الجلسة الرئيسية للوكيل وفق الإعداد الافتراضي `session.dmScope=main`؛ وتبقى جلسات المجموعات معزولة لكل `chat_id` (`agent:<agentId>:imessage:group:<chat_id>`). لا ينتقل سجل المحادثات القديم المخزن تحت مفاتيح جلسات BlueBubbles إلى جلسات iMessage.
- **يجب تغيير ارتباطات ACP** التي تشير إلى `match.channel: "bluebubbles"` لتستخدم `"imessage"`. أشكال `match.peer.id` (`chat_id:` و`chat_guid:` و`chat_identifier:` والمعرّف المجرد) متطابقة.

## لا توجد قناة للرجوع

لا توجد بيئة تشغيل BlueBubbles مدعومة يمكن الرجوع إليها. إذا فشل التحقق من iMessage، فاضبط `channels.imessage.enabled: false`، وأعد تشغيل Gateway، وأصلح العائق المتعلق بـ`imsg`، ثم أعد محاولة التحويل.

توجد ذاكرة الردود المؤقتة في حالة Plugin ضمن SQLite. يستورد `openclaw doctor --fix` الملف الجانبي القديم `imessage/reply-cache.jsonl` ويؤرشفه عند وجوده.

## موضوعات ذات صلة

- [إزالة BlueBubbles ومسار imsg الخاص بـiMessage](/ar/announcements/bluebubbles-imessage) — إعلان موجز وملخص للمشغّل.
- [iMessage](/ar/channels/imessage) — المرجع الكامل لقناة iMessage، بما في ذلك إعداد `imsg launch` واكتشاف الإمكانات.
- `/channels/bluebubbles` — عنوان URL قديم يعيد التوجيه إلى دليل الترحيل هذا.
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران.
- [توجيه القنوات](/ar/channels/channel-routing) — كيفية اختيار Gateway لقناة الردود الصادرة.
