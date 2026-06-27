---
read_when:
    - التخطيط للانتقال من BlueBubbles إلى Plugin iMessage المضمّن
    - ترجمة مفاتيح تكوين BlueBubbles إلى مكافئات iMessage
    - التحقق من imsg قبل تمكين Plugin iMessage
summary: انقل إعدادات BlueBubbles القديمة إلى Plugin iMessage المضمّن من دون فقدان الاقتران أو قوائم السماح أو ارتباطات المجموعات.
title: الانتقال من BlueBubbles
x-i18n:
    generated_at: "2026-06-27T17:11:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dae45911686697a064b19265b11acb87d377992f762256c44a22dd3f1b4c4b08
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

أصبح Plugin `imessage` المضمّن يصل الآن إلى سطح API الخاص نفسه الذي يستخدمه BlueBubbles (`react` و`edit` و`unsend` و`reply` و`sendWithEffect` وإدارة المجموعات والمرفقات) عبر تشغيل [`steipete/imsg`](https://github.com/steipete/imsg) من خلال JSON-RPC. إذا كنت تشغّل بالفعل جهاز Mac مثبتًا عليه `imsg`، يمكنك الاستغناء عن خادم BlueBubbles والسماح للـ Plugin بالتواصل مع Messages.app مباشرة.

تمت إزالة دعم BlueBubbles. يدعم OpenClaw خدمة iMessage عبر `imsg` فقط. هذا الدليل مخصص لترحيل إعدادات `channels.bluebubbles` القديمة إلى `channels.imessage`؛ ولا يوجد مسار ترحيل آخر مدعوم.

<Note>
للاطلاع على الإعلان القصير وملخص المشغّل، راجع [إزالة BlueBubbles ومسار imsg لـ iMessage](/ar/announcements/bluebubbles-imessage).
</Note>

## قائمة تحقق الترحيل

استخدم قائمة التحقق هذه عندما تكون تعرف بالفعل إعداد BlueBubbles القديم لديك وتريد أقصر مسار آمن:

1. تحقق من `imsg` مباشرة على جهاز Mac الذي يشغّل Messages.app (`imsg chats` و`imsg history` و`imsg send` و`imsg rpc --help`).
2. انسخ مفاتيح السلوك من `channels.bluebubbles` إلى `channels.imessage`: `dmPolicy` و`allowFrom` و`groupPolicy` و`groupAllowFrom` و`groups` و`includeAttachments` و`attachmentRoots` و`mediaMaxMb` و`textChunkLimit` و`coalesceSameSenderDms` و`actions`.
3. احذف مفاتيح النقل التي لم تعد موجودة: `serverUrl` و`password` وعناوين URL الخاصة بالـ Webhook وإعداد خادم BlueBubbles.
4. إذا لم يكن Gateway يعمل على جهاز Mac الخاص بالرسائل، فاضبط `channels.imessage.cliPath` على غلاف SSH واضبط `remoteHost` لجلب المرفقات عن بعد.
5. مع إيقاف Gateway، فعّل `channels.imessage`، ثم شغّل `openclaw channels status --probe --channel imessage`.
6. اختبر رسالة مباشرة واحدة، ومجموعة واحدة مسموحًا بها، والمرفقات إذا كانت مفعّلة، وكل إجراء API خاص تتوقع أن يستخدمه الوكيل.
7. احذف خادم BlueBubbles وإعداد `channels.bluebubbles` القديم بعد التحقق من مسار iMessage.

## متى يكون هذا الترحيل مناسبًا

- أنت تشغّل `imsg` بالفعل على جهاز Mac نفسه (أو على جهاز يمكن الوصول إليه عبر SSH) حيث تم تسجيل الدخول إلى Messages.app.
- تريد جزءًا متحركًا أقل — لا خادم BlueBubbles منفصل، ولا نقطة نهاية REST للمصادقة، ولا توصيل Webhook. ملف CLI تنفيذي واحد بدلًا من خادم + تطبيق عميل + مساعد.
- أنت تستخدم [إصدار macOS / `imsg` مدعومًا](/ar/channels/imessage#requirements-and-permissions-macos) حيث يعرض فحص API الخاص `available: true`.

## ما الذي يفعله imsg

`imsg` هو CLI محلي لنظام macOS مخصص للرسائل. يبدأ OpenClaw تشغيل `imsg rpc` كعملية فرعية ويتواصل عبر JSON-RPC من خلال stdin/stdout. لا يوجد خادم HTTP، ولا عنوان URL للـ Webhook، ولا عفريت خلفية، ولا وكيل تشغيل، ولا منفذ يحتاج إلى كشفه.

- تأتي القراءات من `~/Library/Messages/chat.db` باستخدام مقبض SQLite للقراءة فقط.
- تأتي الرسائل الواردة الحية من `imsg watch` / `watch.subscribe`، الذي يتتبع أحداث نظام الملفات في `chat.db` مع رجوع احتياطي إلى الاستقصاء.
- تستخدم عمليات الإرسال أتمتة Messages.app لإرسال النصوص والملفات العادية.
- تستخدم الإجراءات المتقدمة `imsg launch` لحقن مساعد `imsg` في Messages.app. هذا ما يتيح إيصالات القراءة، ومؤشرات الكتابة، والإرسال الغني، والتحرير، والتراجع عن الإرسال، والردود المتسلسلة، وtapbacks، وإدارة المجموعات.
- يمكن لإصدارات Linux فحص نسخة من `chat.db`، لكنها لا تستطيع الإرسال، أو مراقبة قاعدة بيانات Mac الحية، أو تشغيل Messages.app. بالنسبة إلى iMessage في OpenClaw، شغّل `imsg` على جهاز Mac الذي تم تسجيل الدخول عليه أو من خلال غلاف SSH إلى ذلك الجهاز.

## قبل أن تبدأ

1. ثبّت `imsg` على جهاز Mac الذي يشغّل Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   إذا فشل `imsg chats` برسالة `unable to open database file`، أو بإخراج فارغ، أو `authorization denied`، فامنح وصول القرص الكامل للطرفية، أو المحرر، أو عملية Node، أو خدمة Gateway، أو عملية SSH الأصلية التي تطلق `imsg`، ثم أعد فتح تلك العملية الأصلية.

2. تحقق من أسطح القراءة والمراقبة والإرسال وRPC قبل تغيير إعداد OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   استبدل `42` بمعرّف محادثة حقيقي من `imsg chats`. يتطلب الإرسال إذن Automation لـ Messages.app. إذا كان OpenClaw سيعمل عبر SSH، فشغّل هذه الأوامر من خلال غلاف SSH نفسه أو سياق المستخدم نفسه الذي سيستخدمه OpenClaw. إذا نجحت القراءات/الفحوصات لكن فشل الإرسال مع AppleEvents `-1743`، فتحقق مما إذا كان إذن Automation قد وصل إلى `/usr/libexec/sshd-keygen-wrapper`؛ راجع [فشل إرسال غلاف SSH مع AppleEvents -1743](/ar/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

3. فعّل جسر API الخاص عندما تحتاج إلى الإجراءات المتقدمة:

   ```bash
   imsg launch
   imsg status --json
   ```

   يتطلب `imsg launch` تعطيل SIP. تعمل وظائف الإرسال الأساسي والسجل والمراقبة بدون `imsg launch`؛ أما الإجراءات المتقدمة فلا تعمل بدونه.

4. بعد إضافة إعداد `channels.imessage` مفعّل، تحقق من الجسر عبر OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   تحتاج إلى `imessage.privateApi.available: true`. إذا أبلغ عن `false`، فأصلح ذلك أولًا — راجع [اكتشاف الإمكانات](/ar/channels/imessage#private-api-actions). لا يفحص `channels status --probe` إلا الحسابات المهيأة والمفعّلة.

5. خذ لقطة من إعدادك:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## ترجمة الإعداد

تشترك iMessage وBlueBubbles في كثير من إعدادات مستوى القناة. المفاتيح التي تتغير هي في معظمها مفاتيح نقل (خادم REST مقابل CLI محلي). تحافظ مفاتيح السلوك (`dmPolicy` و`groupPolicy` و`allowFrom` وما إلى ذلك) على المعنى نفسه.

| BlueBubbles                                                | iMessage المضمّن                          | ملاحظات                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | الدلالات نفسها.                                                                                                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.serverUrl`                           | _(أزيل)_                               | لا يوجد خادم REST؛ فالـ Plugin يشغّل `imsg rpc` عبر stdio.                                                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.password`                            | _(أزيل)_                               | لا حاجة إلى مصادقة Webhook.                                                                                                                                                                                                                                                                                                                                                    |
| _(ضمني)_                                               | `channels.imessage.cliPath`               | المسار إلى `imsg` (الافتراضي `imsg`)؛ استخدم سكربت غلاف لـ SSH.                                                                                                                                                                                                                                                                                                                       |
| _(ضمني)_                                               | `channels.imessage.dbPath`                | تجاوز اختياري لـ Messages.app `chat.db`؛ يُكتشف تلقائياً عند إغفاله.                                                                                                                                                                                                                                                                                                                |
| _(ضمني)_                                               | `channels.imessage.remoteHost`            | `host` أو `user@host`؛ لا يلزم إلا عندما يكون `cliPath` غلاف SSH وتريد جلب مرفقات SCP.                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | القيم نفسها (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | تنتقل موافقات الاقتران حسب المعرف، لا حسب الرمز.                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | القيم نفسها (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | نفسه.                                                                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **انسخ هذا حرفياً، بما في ذلك أي إدخال بدل `groups: { "*": { ... } }`.** تنتقل إعدادات `requireMention` و`tools` و`toolsBySender` لكل مجموعة. مع `groupPolicy: "allowlist"`، يؤدي غياب كتلة `groups` أو كونها فارغة إلى إسقاط كل رسالة مجموعة بصمت؛ راجع "مطب سجل المجموعات" أدناه.                                                                                       |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | الافتراضي `true`. مع الـ Plugin المضمّن، لا يعمل هذا إلا عندما يكون فحص API الخاص قيد التشغيل.                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | البنية نفسها، **ومعطّل افتراضياً أيضاً**. إذا كانت المرفقات تعمل لديك على BlueBubbles فيجب إعادة ضبط هذا صراحة في كتلة iMessage؛ فهو لا ينتقل ضمنياً، وستُسقط الصور/الوسائط الواردة بصمت من دون سطر سجل `Inbound message` إلى أن تفعل ذلك.                                                                                                     |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | الجذور المحلية؛ قواعد البدل نفسها.                                                                                                                                                                                                                                                                                                                                                    |
| _(غير منطبق)_                                                    | `channels.imessage.remoteAttachmentRoots` | لا يُستخدم إلا عند ضبط `remoteHost` لجلب SCP.                                                                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | الافتراضي 16 ميغابايت على iMessage (كان افتراضي BlueBubbles هو 8 ميغابايت). اضبطه صراحة إذا أردت الإبقاء على الحد الأدنى.                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | الافتراضي 4000 في كليهما.                                                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | نفس خيار التفعيل الصريح. لرسائل DM فقط؛ تحتفظ محادثات المجموعات بالإرسال الفوري لكل رسالة على القناتين. يوسّع مهلة إزالة الارتداد الافتراضية للوارد إلى 7000 مللي ثانية عند تفعيله من دون `messages.inbound.byChannel.imessage` صريح أو `messages.inbound.debounceMs` عام. راجع [وثائق iMessage § تجميع رسائل DM المقسّمة الإرسال](/ar/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(غير منطبق)_                                   | يقرأ iMessage أسماء عرض المرسلين من `chat.db` مسبقاً.                                                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | مفاتيح تفعيل لكل إجراء: `reactions` و`edit` و`unsend` و`reply` و`sendWithEffect` و`renameGroup` و`setGroupIcon` و`addParticipant` و`removeParticipant` و`leaveGroup` و`sendAttachment`.                                                                                                                                                                                                  |

تُترجم إعدادات الحسابات المتعددة (`channels.bluebubbles.accounts.*`) واحداً لواحد إلى `channels.imessage.accounts.*`.

## مطب سجل المجموعات

يشغّل Plugin iMessage المضمّن بوابتي قائمة سماح منفصلتين للمجموعات، الواحدة تلو الأخرى. يجب أن تنجح كلتاهما كي تصل رسالة المجموعة إلى الوكيل:

1. **قائمة سماح المرسل / هدف المحادثة** (`channels.imessage.groupAllowFrom`) — يتحقق منها `isAllowedIMessageSender`. تطابق الرسائل الواردة حسب معرف المرسل أو `chat_guid` أو `chat_identifier` أو `chat_id`. لها بنية BlueBubbles نفسها.
2. **سجل المجموعات** (`channels.imessage.groups`) — يتحقق منه `resolveChannelGroupPolicy` من `inbound-processing.ts:199`. مع `groupPolicy: "allowlist"`، تتطلب هذه البوابة أحد الأمرين:
   - إدخال بدل `groups: { "*": { ... } }` (يضبط `allowAll = true`)، أو
   - إدخالاً صريحاً لكل `chat_id` تحت `groups`.

إذا نجحت البوابة 1 وفشلت البوابة 2، تُسقط الرسالة. يصدر الـ Plugin إشارتين بمستوى `warn` كي لا يبقى هذا صامتاً عند مستوى السجل الافتراضي:

- تحذير بدء تشغيل `warn` مرة واحدة لكل حساب عندما يكون `groupPolicy: "allowlist"` مضبوطاً لكن `channels.imessage.groups` فارغ (لا يوجد بدل `"*"` ولا إدخالات لكل `chat_id`)؛ يُطلق قبل وصول أي رسائل.
- تحذير `warn` مرة واحدة لكل `chat_id` في أول مرة تُسقط فيها مجموعة محددة وقت التشغيل، مع تسمية chat_id والمفتاح الدقيق المطلوب إضافته إلى `groups` للسماح بها.

تستمر الرسائل المباشرة في العمل لأنها تسلك مسارًا برمجيًا مختلفًا.

هذا هو نمط الفشل الأكثر شيوعًا في ترحيل BlueBubbles → iMessage المضمّن: ينسخ المشغّلون `groupAllowFrom` و`groupPolicy` لكن يتجاوزون كتلة `groups`، لأن `groups: { "*": { "requireMention": true } }` في BlueBubbles تبدو كإعداد إشارة غير ذي صلة. لكنها في الواقع ضرورية لبوابة السجل.

الحد الأدنى من الإعدادات اللازمة لإبقاء رسائل المجموعات متدفقة بعد `groupPolicy: "allowlist"`:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
}
```

`requireMention: true` ضمن `*` غير ضار عندما لا تكون أنماط الإشارة مضبوطة: يعيّن وقت التشغيل `canDetectMention = false` ويتجاوز إسقاط الإشارة عند `inbound-processing.ts:512`. وعند ضبط أنماط الإشارة (`agents.list[].groupChat.mentionPatterns`)، يعمل كما هو متوقع.

إذا سجّل Gateway الرسالة `imessage: dropping group message from chat_id=<id>` أو سطر بدء التشغيل `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`، فهذا يعني أن البوابة 2 تسقط الرسائل — أضف كتلة `groups`.

## خطوة بخطوة

1. أضف كتلة iMessage إلى جانب كتلة BlueBubbles الحالية. أبقها معطلة ما دام Gateway لا يزال يوجّه حركة BlueBubbles:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // copy from bluebubbles.groups — silently drops groups if missing, see "Group registry footgun" above
         actions: {
           reactions: true,
           edit: true,
           unsend: true,
           reply: true,
           sendWithEffect: true,
           sendAttachment: true,
         },
       },
     },
   }
   ```

2. **اختبر قبل أن تصبح حركة الرسائل مهمة** — أوقف Gateway، وفعّل كتلة iMessage مؤقتًا، وتأكد من أن iMessage يبلّغ عن حالة سليمة من CLI:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   لا يفحص `channels status --probe` إلا الحسابات المضبوطة والمفعلة. لا تُعد تشغيل Gateway مع تفعيل كل من BlueBubbles وiMessage إلا إذا كنت تقصد تشغيل مراقبي القناتين معًا. إذا لم تكن ستنتقل فورًا، فأعد ضبط `channels.imessage.enabled` إلى `false` قبل إعادة تشغيل Gateway. استخدم أوامر `imsg` المباشرة في [قبل أن تبدأ](#before-you-start) للتحقق من Mac قبل تفعيل حركة OpenClaw.

3. **انتقل.** بعد أن يبلّغ حساب iMessage المفعّل عن حالة سليمة، أزل إعدادات BlueBubbles وأبق iMessage مفعّلًا:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   أعد تشغيل Gateway. ستتدفق حركة iMessage الواردة الآن عبر Plugin المضمّن.

4. **تحقق من الرسائل المباشرة.** أرسل إلى الوكيل رسالة مباشرة؛ وتأكد من وصول الرد.

5. **تحقق من المجموعات بشكل منفصل.** الرسائل المباشرة والمجموعات تسلك مسارات برمجية مختلفة — نجاح الرسائل المباشرة لا يثبت أن المجموعات موجّهة. أرسل إلى الوكيل رسالة في دردشة جماعية مقترنة وتأكد من وصول الرد. إذا صمتت المجموعة (لا رد من الوكيل، ولا خطأ)، فتحقق من سجل Gateway بحثًا عن `imessage: dropping group message from chat_id=<id>` أو سطر بدء التشغيل `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — كلاهما يظهر عند مستوى السجل الافتراضي. إذا ظهر أي منهما، فكتلة `groups` مفقودة أو فارغة — راجع "فخ سجل المجموعات" أعلاه.

6. **تحقق من سطح الإجراءات** — من رسالة مباشرة مقترنة، اطلب من الوكيل إضافة تفاعل، أو تعديل رسالة، أو إلغاء إرسالها، أو الرد عليها، أو إرسال صورة، و(في مجموعة) إعادة تسمية المجموعة / إضافة مشارك أو إزالته. يجب أن يظهر كل إجراء أصليًا في Messages.app. إذا ألقى أي إجراء الخطأ "iMessage `<action>` requires the imsg private API bridge"، فشغّل `imsg launch` مرة أخرى وحدّث `channels status --probe`.

7. **أزل خادم BlueBubbles وإعداداته** بعد التحقق من رسائل iMessage المباشرة والمجموعات والإجراءات. لن يستخدم OpenClaw `channels.bluebubbles`.

## تكافؤ الإجراءات بنظرة سريعة

| الإجراء                                              | BlueBubbles القديم                  | iMessage المضمّن                                                              |
| --------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| إرسال نص / احتياطي SMS                            | ✅                                  | ✅                                                                            |
| إرسال وسائط (صورة، فيديو، ملف، صوت)              | ✅                                  | ✅                                                                            |
| رد مترابط (`reply_to_guid`)                    | ✅                                  | ✅ (يغلق [#51892](https://github.com/openclaw/openclaw/issues/51892))       |
| Tapback (`react`)                                   | ✅                                  | ✅                                                                            |
| تعديل / إلغاء الإرسال (مستلمو macOS 13+)                | ✅                                  | ✅                                                                            |
| إرسال مع تأثير شاشة                             | ✅                                  | ✅ (يغلق جزءًا من [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| نص غني عريض / مائل / مسطر / مشطوب | ✅                                  | ✅ (تنسيق typed-run عبر attributedBody)                                  |
| إعادة تسمية المجموعة / تعيين أيقونة المجموعة                       | ✅                                  | ✅                                                                            |
| إضافة / إزالة مشارك، مغادرة المجموعة               | ✅                                  | ✅                                                                            |
| إيصالات القراءة ومؤشر الكتابة                  | ✅                                  | ✅ (مقيّد بفحص API الخاص)                                               |
| دمج الرسائل المباشرة من المرسل نفسه                           | ✅                                  | ✅ (للرسائل المباشرة فقط؛ تفعيل اختياري عبر `channels.imessage.coalesceSameSenderDms`)            |
| الاسترداد الوارد بعد إعادة التشغيل                    | ✅ (إعادة تشغيل Webhook + جلب السجل) | ✅ (تلقائي: إعادة تشغيل الفائت عبر since_rowid + إزالة التكرار؛ نافذة أوسع محليًا) |

يستعيد iMessage الرسائل الفائتة أثناء توقف Gateway: عند بدء التشغيل، يعيد تشغيلها من آخر rowid مُرسل عبر `since_rowid` في `imsg watch.subscribe` ويزيل التكرار حسب GUID، بينما يمنع حاجز عمر السجل القديم "قنبلة السجل" الناتجة عن Push-flush. يتم ذلك عبر اتصال RPC الخاص بـ `imsg`، لذلك يعمل أيضًا مع إعدادات `cliPath` عبر SSH عن بعد؛ وتحصل الإعدادات المحلية على نافذة استرداد أوسع لأنها تستطيع قراءة `chat.db`. راجع [الاسترداد الوارد بعد إعادة تشغيل الجسر أو Gateway](/ar/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## الاقتران والجلسات وارتباطات ACP

- **موافقات الاقتران** تنتقل حسب المعرف. لا تحتاج إلى إعادة الموافقة على المرسلين المعروفين — يتعرف `channels.imessage.allowFrom` على سلاسل `+15555550123` / `user@example.com` نفسها التي استخدمها BlueBubbles.
- **الجلسات** تبقى محددة النطاق لكل وكيل + دردشة. تُدمج الرسائل المباشرة في الجلسة الرئيسية للوكيل وفق الإعداد الافتراضي `session.dmScope=main`؛ وتبقى جلسات المجموعات معزولة لكل `chat_id`. تختلف مفاتيح الجلسات (`agent:<id>:imessage:group:<chat_id>` مقابل مكافئ BlueBubbles) — لا ينتقل سجل المحادثات القديم ضمن مفاتيح جلسات BlueBubbles إلى جلسات iMessage.
- **ارتباطات ACP** التي تشير إلى `match.channel: "bluebubbles"` يجب تحديثها إلى `"imessage"`. أشكال `match.peer.id` (`chat_id:`، و`chat_guid:`، و`chat_identifier:`، والمعرف المجرد) متطابقة.

## لا قناة رجوع

لا يوجد وقت تشغيل BlueBubbles مدعوم للرجوع إليه. إذا فشل التحقق من iMessage، فاضبط `channels.imessage.enabled: false`، وأعد تشغيل Gateway، وأصلح عائق `imsg`، ثم أعد محاولة الانتقال.

توجد ذاكرة التخزين المؤقت للردود في حالة Plugin ضمن SQLite. يستورد `openclaw doctor --fix` ملف `imessage/reply-cache.jsonl` الجانبي القديم ويؤرشفه عند وجوده.

## ذات صلة

- [إزالة BlueBubbles ومسار imsg iMessage](/ar/announcements/bluebubbles-imessage) — إعلان قصير وملخص للمشغّلين.
- [iMessage](/ar/channels/imessage) — مرجع قناة iMessage الكامل، بما في ذلك إعداد `imsg launch` واكتشاف القدرات.
- `/channels/bluebubbles` — عنوان URL قديم يعيد التوجيه إلى دليل الترحيل هذا.
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران.
- [توجيه القنوات](/ar/channels/channel-routing) — كيف يختار Gateway قناة للردود الصادرة.
