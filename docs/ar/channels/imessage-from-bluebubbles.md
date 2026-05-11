---
read_when:
    - التخطيط للانتقال من BlueBubbles إلى Plugin iMessage المضمّن
    - ترجمة مفاتيح تكوين BlueBubbles إلى مكافئاتها في iMessage
    - التحقق من imsg قبل تمكين Plugin iMessage
summary: رحّل إعدادات BlueBubbles القديمة إلى Plugin iMessage المضمّن دون فقدان الإقران أو قوائم السماح أو ارتباطات المجموعات.
title: الانتقال من BlueBubbles
x-i18n:
    generated_at: "2026-05-11T20:20:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 255bb79faf8e19215728c0401e6cac530f7bf4bfc8577df33518ab21a1597e90
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

يصل Plugin `imessage` المضمّن الآن إلى سطح API الخاص نفسه مثل BlueBubbles (`react`، و`edit`، و`unsend`، و`reply`، و`sendWithEffect`، وإدارة المجموعات، والمرفقات) عبر تشغيل [`steipete/imsg`](https://github.com/steipete/imsg) باستخدام JSON-RPC. إذا كنت تشغّل بالفعل جهاز Mac مثبتًا عليه `imsg`، فيمكنك الاستغناء عن خادم BlueBubbles وجعل Plugin يتحدث إلى Messages.app مباشرة.

أُزيل دعم BlueBubbles. يدعم OpenClaw iMessage عبر `imsg` فقط. هذا الدليل مخصص لترحيل إعدادات `channels.bluebubbles` القديمة إلى `channels.imessage`؛ ولا يوجد أي مسار ترحيل آخر مدعوم.

<Note>
للاطلاع على الإعلان المختصر وملخص المشغّل، راجع [إزالة BlueBubbles ومسار imsg لـ iMessage](/ar/announcements/bluebubbles-imessage).
</Note>

## قائمة تحقق الترحيل

استخدم قائمة التحقق هذه عندما تكون تعرف إعدادات BlueBubbles القديمة وتريد أقصر مسار آمن:

1. تحقّق من `imsg` مباشرة على جهاز Mac الذي يشغّل Messages.app (`imsg chats`، و`imsg history`، و`imsg send`، و`imsg rpc --help`).
2. انسخ مفاتيح السلوك من `channels.bluebubbles` إلى `channels.imessage`: `dmPolicy`، و`allowFrom`، و`groupPolicy`، و`groupAllowFrom`، و`groups`، و`includeAttachments`، و`attachmentRoots`، و`mediaMaxMb`، و`textChunkLimit`، و`coalesceSameSenderDms`، و`actions`.
3. احذف مفاتيح النقل التي لم تعد موجودة: `serverUrl`، و`password`، وعناوين Webhook URL، وإعداد خادم BlueBubbles.
4. إذا كان Gateway لا يعمل على جهاز Mac الخاص بالرسائل، فاضبط `channels.imessage.cliPath` على مغلّف SSH واضبط `remoteHost` لجلب المرفقات عن بُعد.
5. مع إيقاف Gateway، فعّل `channels.imessage`، ثم شغّل `openclaw channels status --probe --channel imessage`.
6. اختبر رسالة DM واحدة، ومجموعة واحدة مسموحًا بها، والمرفقات إذا كانت مفعّلة، وكل إجراء API خاص تتوقع أن يستخدمه الوكيل.
7. احذف خادم BlueBubbles وإعدادات `channels.bluebubbles` القديمة بعد التحقق من مسار iMessage.

## متى يكون هذا الترحيل منطقيًا

- أنت تشغّل `imsg` بالفعل على جهاز Mac نفسه (أو جهاز يمكن الوصول إليه عبر SSH) حيث يكون Messages.app مسجّل الدخول.
- تريد تقليل جزء متحرك واحد — لا خادم BlueBubbles منفصل، ولا REST endpoint للمصادقة، ولا توصيل Webhook. ملف CLI ثنائي واحد بدلًا من خادم + تطبيق عميل + مساعد.
- تستخدم [إصدار macOS / `imsg` مدعومًا](/ar/channels/imessage#requirements-and-permissions-macos) حيث يعرض فحص API الخاص `available: true`.

## ما الذي يفعله imsg

`imsg` هو CLI محلي على macOS للرسائل. يبدأ OpenClaw تشغيل `imsg rpc` كعملية فرعية ويتحدث JSON-RPC عبر stdin/stdout. لا يوجد خادم HTTP، ولا عنوان Webhook URL، ولا daemon في الخلفية، ولا launch agent، ولا منفذ يجب كشفه.

- تأتي عمليات القراءة من `~/Library/Messages/chat.db` باستخدام مقبض SQLite للقراءة فقط.
- تأتي الرسائل الواردة الحية من `imsg watch` / `watch.subscribe`، الذي يتابع أحداث نظام الملفات لـ `chat.db` مع بديل polling.
- تستخدم عمليات الإرسال أتمتة Messages.app لإرسال النصوص والملفات العادية.
- تستخدم الإجراءات المتقدمة `imsg launch` لحقن مساعد `imsg` داخل Messages.app. هذا هو ما يفتح إيصالات القراءة، ومؤشرات الكتابة، والإرسال الغني، والتعديل، وإلغاء الإرسال، والرد المترابط، وtapbacks، وإدارة المجموعات.
- يمكن لإصدارات Linux فحص نسخة من `chat.db`، لكنها لا تستطيع الإرسال، أو مراقبة قاعدة بيانات Mac الحية، أو تشغيل Messages.app. لاستخدام OpenClaw iMessage، شغّل `imsg` على جهاز Mac المسجّل الدخول أو من خلال مغلّف SSH إلى ذلك الجهاز.

## قبل أن تبدأ

1. ثبّت `imsg` على جهاز Mac الذي يشغّل Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   إذا فشل `imsg chats` مع `unable to open database file`، أو خرج فارغ، أو `authorization denied`، فامنح Full Disk Access للطرفية، أو المحرر، أو عملية Node، أو خدمة Gateway، أو عملية SSH الأصلية التي تطلق `imsg`، ثم أعد فتح تلك العملية الأصلية.

2. تحقّق من أسطح القراءة، والمراقبة، والإرسال، وRPC قبل تغيير إعدادات OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   استبدل `42` بمعرّف محادثة حقيقي من `imsg chats`. يتطلب الإرسال إذن Automation لـ Messages.app. إذا كان OpenClaw سيعمل عبر SSH، فشغّل هذه الأوامر من خلال مغلّف SSH نفسه أو سياق المستخدم نفسه الذي سيستخدمه OpenClaw.

3. فعّل جسر API الخاص عندما تحتاج إلى إجراءات متقدمة:

   ```bash
   imsg launch
   imsg status --json
   ```

   يتطلب `imsg launch` تعطيل SIP. تعمل عمليات الإرسال الأساسي، والسجل، والمراقبة دون `imsg launch`؛ أما الإجراءات المتقدمة فلا تعمل.

4. بعد إضافة إعداد `channels.imessage` مفعّل، تحقّق من الجسر عبر OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   تريد `imessage.privateApi.available: true`. إذا أبلغ عن `false`، فأصلح ذلك أولًا — راجع [اكتشاف القدرات](/ar/channels/imessage#private-api-actions). لا يفحص `channels status --probe` إلا الحسابات المضبوطة والمفعّلة.

5. خذ لقطة من إعداداتك:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## ترجمة الإعدادات

يشترك iMessage وBlueBubbles في قدر كبير من إعدادات مستوى القناة. المفاتيح التي تتغير تكون في الغالب خاصة بالنقل (خادم REST مقابل CLI محلي). تحتفظ مفاتيح السلوك (`dmPolicy`، و`groupPolicy`، و`allowFrom`، وغيرها) بالمعنى نفسه.

| BlueBubbles                                                | iMessage المضمّن                          | ملاحظات                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | نفس الدلالات.                                                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.serverUrl`                           | _(أُزيل)_                               | لا يوجد خادم REST — يشغّل الـ Plugin الأمر `imsg rpc` عبر stdio.                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.password`                            | _(أُزيل)_                               | لا حاجة إلى مصادقة webhook.                                                                                                                                                                                                                                                                                                            |
| _(ضمني)_                                               | `channels.imessage.cliPath`               | المسار إلى `imsg` (الافتراضي `imsg`)؛ استخدم سكربت غلاف لـ SSH.                                                                                                                                                                                                                                                                               |
| _(ضمني)_                                               | `channels.imessage.dbPath`                | تجاوز اختياري لملف Messages.app `chat.db`؛ يُكتشف تلقائيًا عند حذفه.                                                                                                                                                                                                                                                                        |
| _(ضمني)_                                               | `channels.imessage.remoteHost`            | `host` أو `user@host` — مطلوب فقط عندما يكون `cliPath` غلاف SSH وتريد جلب مرفقات SCP.                                                                                                                                                                                                                                    |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | نفس القيم (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | تنتقل موافقات الاقتران حسب المعرّف، لا حسب الرمز.                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | نفس القيم (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | نفسها.                                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **انسخ هذا حرفيًا، بما في ذلك أي إدخال بدل شامل `groups: { "*": { ... } }`.** تنتقل إعدادات كل مجموعة مثل `requireMention` و`tools` و`toolsBySender`. مع `groupPolicy: "allowlist"`، يؤدي وجود كتلة `groups` فارغة أو مفقودة إلى إسقاط كل رسالة مجموعة بصمت — راجع "الفخ في سجل المجموعات" أدناه.                                               |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | الافتراضي `true`. مع الـ Plugin المضمّن، لا يعمل هذا إلا عندما يكون مسبار API الخاص قيد التشغيل.                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | نفس الشكل، **ونفس الإيقاف افتراضيًا**. إذا كانت المرفقات تعمل لديك على BlueBubbles، فيجب أن تعيد ضبط هذا صراحة في كتلة iMessage — فهو لا ينتقل ضمنيًا، وستُسقط الصور/الوسائط الواردة بصمت بلا سطر سجل `Inbound message` إلى أن تفعل ذلك.                                                             |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | الجذور المحلية؛ نفس قواعد البدل الشامل.                                                                                                                                                                                                                                                                                                            |
| _(غير منطبق)_                                                    | `channels.imessage.remoteAttachmentRoots` | يُستخدم فقط عندما يكون `remoteHost` مضبوطًا لجلب SCP.                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | الافتراضي 16 MB على iMessage (كان افتراضي BlueBubbles هو 8 MB). اضبطه صراحة إذا أردت إبقاء الحد الأدنى.                                                                                                                                                                                                                                  |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | الافتراضي 4000 على كليهما.                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | نفس خيار الاشتراك. للرسائل المباشرة فقط — تحتفظ محادثات المجموعات بالإرسال الفوري لكل رسالة على كلتا القناتين. يوسّع مهلة إزالة الارتداد الافتراضية للوارد إلى 2500 ms عند تفعيله من دون `messages.inbound.byChannel.imessage` صريح. راجع [وثائق iMessage § دمج الرسائل المباشرة المرسلة على دفعات](/ar/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(غير منطبق)_                                   | يقرأ iMessage أسماء عرض المرسلين بالفعل من `chat.db`.                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | مفاتيح تفعيل لكل إجراء: `reactions`، `edit`، `unsend`، `reply`، `sendWithEffect`، `renameGroup`، `setGroupIcon`، `addParticipant`، `removeParticipant`، `leaveGroup`، `sendAttachment`.                                                                                                                                                          |

تُترجم إعدادات الحسابات المتعددة (`channels.bluebubbles.accounts.*`) واحدًا لواحد إلى `channels.imessage.accounts.*`.

## الفخ في سجل المجموعات

يشغّل Plugin iMessage المضمّن بوابتي قائمة سماح منفصلتين للمجموعات، الواحدة تلو الأخرى. يجب أن تجتازهما كلتاهما كي تصل رسالة المجموعة إلى الوكيل:

1. **قائمة سماح المرسل / هدف المحادثة** (`channels.imessage.groupAllowFrom`) — يفحصها `isAllowedIMessageSender`. تطابق الرسائل الواردة حسب معرّف المرسل أو `chat_guid` أو `chat_identifier` أو `chat_id`. لها نفس شكل BlueBubbles.
2. **سجل المجموعات** (`channels.imessage.groups`) — يفحصه `resolveChannelGroupPolicy` من `inbound-processing.ts:199`. مع `groupPolicy: "allowlist"`، تتطلب هذه البوابة أحد الأمرين:
   - إدخال بدل شامل `groups: { "*": { ... } }` (يضبط `allowAll = true`)، أو
   - إدخالًا صريحًا لكل `chat_id` ضمن `groups`.

إذا نجحت البوابة 1 وفشلت البوابة 2، تُسقط الرسالة. يصدر الـ Plugin إشارتين بمستوى `warn` كي لا يبقى ذلك صامتًا عند مستوى السجل الافتراضي:

- `warn` لمرة واحدة عند بدء التشغيل لكل حساب عندما يكون `groupPolicy: "allowlist"` مضبوطًا لكن `channels.imessage.groups` فارغ (لا بدل شامل `"*"` ولا إدخالات لكل `chat_id`) — ينطلق قبل وصول أي رسائل.
- `warn` لمرة واحدة لكل `chat_id` في أول مرة تُسقط فيها مجموعة محددة وقت التشغيل، مع تسمية chat_id والمفتاح الدقيق الذي يجب إضافته إلى `groups` للسماح بها.

تواصل الرسائل المباشرة العمل لأنها تسلك مسار كود مختلفًا.

هذا هو نمط الفشل الأكثر شيوعًا في الترحيل من BlueBubbles إلى iMessage المضمّن: ينسخ المشغّلون `groupAllowFrom` و`groupPolicy` لكن يتجاوزون كتلة `groups`، لأن `groups: { "*": { "requireMention": true } }` في BlueBubbles تبدو كإعداد إشارة غير ذي صلة. لكنها في الواقع عنصر أساسي لبوابة السجل.

الحد الأدنى من الإعدادات لإبقاء رسائل المجموعات متدفقة بعد `groupPolicy: "allowlist"`:

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

`requireMention: true` ضمن `*` غير ضار عند عدم تكوين أي أنماط ذكر: يضبط وقت التشغيل `canDetectMention = false` ويتجاوز إسقاط الذكر عند `inbound-processing.ts:512`. عند تكوين أنماط الذكر (`agents.list[].groupChat.mentionPatterns`)، يعمل كما هو متوقع.

إذا سجّلت Gateway السطر `imessage: dropping group message from chat_id=<id>` أو سطر بدء التشغيل `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`، فالمرحلة 2 تُسقِط الرسالة — أضف كتلة `groups`.

## خطوة بخطوة

1. أضف كتلة iMessage إلى جانب كتلة BlueBubbles الحالية. أبقها معطّلة بينما لا تزال Gateway توجّه حركة BlueBubbles:

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

2. **اختبر قبل أن تصبح حركة المرور مهمة** — أوقف Gateway، وفعّل كتلة iMessage مؤقتًا، وتأكد من أن iMessage يبلّغ بحالة سليمة من CLI:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   لا يفحص `channels status --probe` إلا الحسابات المكوّنة والمفعّلة. لا تعِد تشغيل Gateway مع تفعيل كل من BlueBubbles وiMessage إلا إذا كنت تريد عمدًا تشغيل مراقبي القناتين معًا. إذا لم تكن ستنتقل فورًا، فأعد ضبط `channels.imessage.enabled` إلى `false` قبل إعادة تشغيل Gateway. استخدم أوامر `imsg` المباشرة في [قبل أن تبدأ](#before-you-start) للتحقق من جهاز Mac قبل تفعيل حركة OpenClaw.

3. **انتقل.** بعد أن يبلّغ حساب iMessage المفعّل بحالة سليمة، أزل تكوين BlueBubbles وأبقِ iMessage مفعّلًا:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   أعد تشغيل Gateway. تمر حركة iMessage الواردة الآن عبر Plugin المضمّن.

4. **تحقق من الرسائل المباشرة.** أرسل رسالة مباشرة إلى الوكيل؛ وتأكد من وصول الرد.

5. **تحقق من المجموعات بشكل منفصل.** تسلك الرسائل المباشرة والمجموعات مسارات برمجية مختلفة — نجاح الرسائل المباشرة لا يثبت أن المجموعات تُوجَّه. أرسل إلى الوكيل رسالة في دردشة جماعية مقترنة وتأكد من وصول الرد. إذا صمتت المجموعة (لا رد من الوكيل، ولا خطأ)، فتحقق من سجل Gateway بحثًا عن `imessage: dropping group message from chat_id=<id>` أو سطر بدء التشغيل `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — يظهر كلاهما عند مستوى السجل الافتراضي. إذا ظهر أي منهما، فكتلة `groups` مفقودة أو فارغة — راجع "مشكلة سجلّ المجموعات الخفية" أعلاه.

6. **تحقق من سطح الإجراءات** — من رسالة مباشرة مقترنة، اطلب من الوكيل إضافة تفاعل، وتعديل رسالة، وإلغاء إرسالها، والرد، وإرسال صورة، و(في مجموعة) إعادة تسمية المجموعة / إضافة مشارك أو إزالته. يجب أن يظهر كل إجراء أصليًا في Messages.app. إذا ألقى أي إجراء الخطأ "iMessage `<action>` requires the imsg private API bridge"، فشغّل `imsg launch` مرة أخرى وحدّث `channels status --probe`.

7. **أزل خادم BlueBubbles وتكوينه** بعد التحقق من رسائل iMessage المباشرة والمجموعات والإجراءات. لن يستخدم OpenClaw `channels.bluebubbles`.

## تكافؤ الإجراءات بنظرة سريعة

| الإجراء                                                     | BlueBubbles القديم                  | iMessage المضمّن                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| إرسال نص / رجوع احتياطي إلى SMS                                   | ✅                                  | ✅                                                                                                                      |
| إرسال وسائط (صورة، فيديو، ملف، صوت)                     | ✅                                  | ✅                                                                                                                      |
| رد ضمن سلسلة (`reply_to_guid`)                           | ✅                                  | ✅ (يغلق [#51892](https://github.com/openclaw/openclaw/issues/51892))                                                 |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| تعديل / إلغاء إرسال (مستلمو macOS 13+)                       | ✅                                  | ✅                                                                                                                      |
| إرسال مع تأثير شاشة                                    | ✅                                  | ✅ (يغلق جزءًا من [#9394](https://github.com/openclaw/openclaw/issues/9394))                                           |
| نص منسق عريض / مائل / مسطر / يتوسطه خط        | ✅                                  | ✅ (تنسيق typed-run عبر attributedBody)                                                                            |
| إعادة تسمية مجموعة / تعيين أيقونة المجموعة                              | ✅                                  | ✅                                                                                                                      |
| إضافة / إزالة مشارك، مغادرة المجموعة                      | ✅                                  | ✅                                                                                                                      |
| إيصالات القراءة ومؤشر الكتابة                         | ✅                                  | ✅ (مشروط بفحص private API)                                                                                         |
| دمج الرسائل المباشرة من المرسل نفسه                                  | ✅                                  | ✅ (للرسائل المباشرة فقط؛ تفعيل اختياري عبر `channels.imessage.coalesceSameSenderDms`)                                                      |
| استدراك الرسائل الواردة المستلمة أثناء تعطل Gateway | ✅ (إعادة تشغيل Webhook + جلب السجل) | ✅ (تفعيل اختياري عبر `channels.imessage.catchup.enabled`؛ يغلق [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

استدراك iMessage متاح الآن كميزة اختيارية في Plugin المضمّن. عند بدء Gateway، إذا كان `channels.imessage.catchup.enabled` مضبوطًا على `true`، تشغّل Gateway تمريرة `chats.list` واحدة + تمريرة `messages.history` لكل دردشة مقابل عميل JSON-RPC نفسه الذي يستخدمه `imsg watch`، وتعيد تشغيل كل صف وارد فائت عبر مسار الإرسال الحي (قوائم السماح، سياسة المجموعة، مزيل الارتداد، ذاكرة صدى الرسائل)، وتحفظ مؤشرًا لكل حساب بحيث تتابع عمليات بدء التشغيل اللاحقة من حيث توقفت. راجع [الاستدراك بعد توقف Gateway](/ar/channels/imessage#catching-up-after-gateway-downtime) للضبط.

## الاقتران، والجلسات، وارتباطات ACP

- **موافقات الاقتران** تنتقل حسب المعرّف. لا تحتاج إلى إعادة الموافقة على المرسلين المعروفين — يتعرف `channels.imessage.allowFrom` على سلاسل `+15555550123` / `user@example.com` نفسها التي استخدمها BlueBubbles.
- **الجلسات** تبقى محددة النطاق لكل وكيل + دردشة. تُدمج الرسائل المباشرة في الجلسة الرئيسية للوكيل ضمن الإعداد الافتراضي `session.dmScope=main`؛ وتبقى جلسات المجموعات معزولة لكل `chat_id`. تختلف مفاتيح الجلسات (`agent:<id>:imessage:group:<chat_id>` مقابل مكافئ BlueBubbles) — لا ينتقل سجل المحادثات القديم ضمن مفاتيح جلسات BlueBubbles إلى جلسات iMessage.
- **ارتباطات ACP** التي تشير إلى `match.channel: "bluebubbles"` يجب تحديثها إلى `"imessage"`. أشكال `match.peer.id` (`chat_id:`، `chat_guid:`، `chat_identifier:`، المعرّف المجرد) متطابقة.

## لا قناة تراجع

لا يوجد وقت تشغيل BlueBubbles مدعوم للعودة إليه. إذا فشل التحقق من iMessage، فاضبط `channels.imessage.enabled: false`، وأعد تشغيل Gateway، وأصلح عائق `imsg`، ثم أعد محاولة الانتقال.

توجد ذاكرة التخزين المؤقت للردود في `~/.openclaw/state/imessage/reply-cache.jsonl` (الوضع `0600`، والدليل الأصل `0700`). يمكن حذفها بأمان إذا أردت بداية نظيفة.

## ذو صلة

- [إزالة BlueBubbles ومسار imsg في iMessage](/ar/announcements/bluebubbles-imessage) — إعلان قصير وملخص للمشغّل.
- [iMessage](/ar/channels/imessage) — مرجع قناة iMessage الكامل، بما في ذلك إعداد `imsg launch` واكتشاف القدرات.
- `/channels/bluebubbles` — عنوان URL قديم يعيد التوجيه إلى دليل الترحيل هذا.
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران.
- [توجيه القنوات](/ar/channels/channel-routing) — كيف تختار Gateway قناة للردود الصادرة.
