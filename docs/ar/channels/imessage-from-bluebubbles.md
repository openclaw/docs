---
read_when:
    - التخطيط للانتقال من BlueBubbles إلى Plugin iMessage المضمّن
    - ترجمة مفاتيح إعدادات BlueBubbles إلى مكافئاتها في iMessage
    - التحقق من imsg قبل تمكين Plugin iMessage
summary: رحّل إعدادات BlueBubbles القديمة إلى Plugin iMessage المضمّن من دون فقدان الاقتران أو قوائم السماح أو ارتباطات المجموعات.
title: الانتقال من BlueBubbles
x-i18n:
    generated_at: "2026-05-10T19:21:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 81ce77d7fe2d6fe054c1457e14624ebd2aba02f69ed7bc2cfb242cdb1de38a1e
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

أصبح `imessage` Plugin المضمّن يصل الآن إلى سطح API الخاص نفسه الذي تستخدمه BlueBubbles (`react`، `edit`، `unsend`، `reply`، `sendWithEffect`، إدارة المجموعات، المرفقات) عبر تشغيل [`steipete/imsg`](https://github.com/steipete/imsg) باستخدام JSON-RPC. إذا كنت تشغّل بالفعل جهاز Mac مثبّتًا عليه `imsg`، يمكنك الاستغناء عن خادم BlueBubbles وترك Plugin يتواصل مع Messages.app مباشرة.

أُزيل دعم BlueBubbles. يدعم OpenClaw iMessage عبر `imsg` فقط. هذا الدليل مخصص لترحيل إعدادات `channels.bluebubbles` القديمة إلى `channels.imessage`؛ ولا يوجد مسار ترحيل آخر مدعوم.

## متى يكون هذا الترحيل مناسبًا

- أنت تشغّل بالفعل `imsg` على جهاز Mac نفسه (أو جهاز يمكن الوصول إليه عبر SSH) حيث يكون Messages.app مسجّل الدخول.
- تريد تقليل جزء متحرك واحد — لا خادم BlueBubbles منفصل، ولا نقطة نهاية REST للمصادقة، ولا توصيل Webhook. ملف CLI ثنائي واحد بدلًا من خادم + تطبيق عميل + مساعد.
- أنت تستخدم [إصدار macOS / `imsg` مدعومًا](/ar/channels/imessage#requirements-and-permissions-macos) حيث يبلّغ فحص API الخاص عن `available: true`.

## ما الذي يفعله imsg

`imsg` هو CLI محلي على macOS لتطبيق Messages. يبدأ OpenClaw تشغيل `imsg rpc` كعملية فرعية ويتواصل عبر JSON-RPC باستخدام stdin/stdout. لا يوجد خادم HTTP، ولا عنوان URL لـ Webhook، ولا عفريت خلفي، ولا وكيل تشغيل، ولا منفذ يجب كشفه.

- تأتي القراءات من `~/Library/Messages/chat.db` باستخدام مقبض SQLite للقراءة فقط.
- تأتي الرسائل الواردة المباشرة من `imsg watch` / `watch.subscribe`، والذي يتابع أحداث نظام ملفات `chat.db` مع بديل يعتمد على الاستقصاء.
- تستخدم عمليات الإرسال أتمتة Messages.app لإرسال النصوص والملفات العادية.
- تستخدم الإجراءات المتقدمة `imsg launch` لحقن مساعد `imsg` في Messages.app. هذا هو ما يفتح إيصالات القراءة، ومؤشرات الكتابة، والإرسال الغني، والتعديل، والتراجع عن الإرسال، والرد ضمن سلسلة، وtapbacks، وإدارة المجموعات.
- يمكن لإصدارات Linux فحص نسخة من `chat.db`، لكنها لا تستطيع الإرسال، أو مراقبة قاعدة بيانات Mac المباشرة، أو تشغيل Messages.app. بالنسبة إلى OpenClaw iMessage، شغّل `imsg` على جهاز Mac المسجّل الدخول أو عبر غلاف SSH إلى ذلك الجهاز.

## قبل أن تبدأ

1. ثبّت `imsg` على جهاز Mac الذي يشغّل Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   إذا فشل `imsg chats` مع `unable to open database file`، أو مخرجات فارغة، أو `authorization denied`، فامنح Full Disk Access للطرفية أو المحرر أو عملية Node أو خدمة Gateway أو عملية SSH الأصلية التي تشغّل `imsg`، ثم أعد فتح تلك العملية الأصلية.

2. تحقّق من أسطح القراءة والمراقبة والإرسال وRPC قبل تغيير إعدادات OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   استبدل `42` بمعرّف محادثة حقيقي من `imsg chats`. يتطلب الإرسال إذن Automation لـ Messages.app. إذا كان OpenClaw سيعمل عبر SSH، فشغّل هذه الأوامر من خلال غلاف SSH نفسه أو سياق المستخدم نفسه الذي سيستخدمه OpenClaw.

3. فعّل جسر API الخاص عندما تحتاج إلى إجراءات متقدمة:

   ```bash
   imsg launch
   imsg status --json
   ```

   يتطلب `imsg launch` تعطيل SIP. يعمل الإرسال الأساسي، والسجل، والمراقبة بدون `imsg launch`؛ أما الإجراءات المتقدمة فلا تعمل.

4. تحقّق من الجسر عبر OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   تريد `imessage.privateApi.available: true`. إذا أبلغ عن `false`، فأصلح ذلك أولًا — راجع [اكتشاف القدرات](/ar/channels/imessage#private-api-actions).

5. خذ لقطة من إعداداتك:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## ترجمة الإعدادات

يشترك iMessage وBlueBubbles في قدر كبير من إعدادات مستوى القناة. المفاتيح التي تتغير هي غالبًا مفاتيح النقل (خادم REST مقابل CLI محلي). تحتفظ مفاتيح السلوك (`dmPolicy`، `groupPolicy`، `allowFrom`، إلخ) بالمعنى نفسه.

| BlueBubbles                                                | iMessage المضمّن                          | ملاحظات                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | نفس الدلالات.                                                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.serverUrl`                           | _(أُزيل)_                               | لا يوجد خادم REST — يشغّل Plugin ‏`imsg rpc` عبر stdio.                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.password`                            | _(أُزيل)_                               | لا حاجة إلى مصادقة Webhook.                                                                                                                                                                                                                                                                                                            |
| _(ضمني)_                                               | `channels.imessage.cliPath`               | المسار إلى `imsg` (الافتراضي `imsg`)؛ استخدم سكربت تغليف لـ SSH.                                                                                                                                                                                                                                                                               |
| _(ضمني)_                                               | `channels.imessage.dbPath`                | تجاوز اختياري لـ Messages.app ‏`chat.db`؛ يُكتشف تلقائيًا عند حذفه.                                                                                                                                                                                                                                                                        |
| _(ضمني)_                                               | `channels.imessage.remoteHost`            | ‏`host` أو `user@host` — لا يلزم إلا عندما يكون `cliPath` سكربت تغليف لـ SSH وتريد جلب مرفقات SCP.                                                                                                                                                                                                                                    |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | نفس القيم (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | تنتقل موافقات الإقران حسب المعرّف، لا حسب الرمز.                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | نفس القيم (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | نفسها.                                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **انسخ هذا حرفيًا، بما في ذلك أي إدخال بدل `groups: { "*": { ... } }`.** تنتقل إعدادات `requireMention` و`tools` و`toolsBySender` لكل مجموعة. مع `groupPolicy: "allowlist"`، تؤدي كتلة `groups` الفارغة أو المفقودة إلى إسقاط كل رسالة مجموعة بصمت — انظر "فخ سجل المجموعات" أدناه.                                               |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | الافتراضي `true`. مع Plugin المضمّن، لا ينطلق هذا إلا عندما يكون مسبار واجهة API الخاصة قيد التشغيل.                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | نفس الشكل، **ونفس التعطيل افتراضيًا**. إذا كانت المرفقات تتدفق لديك على BlueBubbles، فيجب أن تعيد ضبط هذا صراحةً في كتلة iMessage — فهو لا ينتقل ضمنيًا، وستُسقط الصور/الوسائط الواردة بصمت من دون سطر سجل `Inbound message` إلى أن تفعل ذلك.                                                             |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | الجذور المحلية؛ نفس قواعد البدل.                                                                                                                                                                                                                                                                                                            |
| _(غير متاح)_                                                    | `channels.imessage.remoteAttachmentRoots` | لا يُستخدم إلا عند ضبط `remoteHost` لجلب SCP.                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | الافتراضي 16 ميغابايت في iMessage (كان افتراضي BlueBubbles هو 8 ميغابايت). اضبطه صراحةً إذا أردت الإبقاء على الحد الأدنى.                                                                                                                                                                                                                                  |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | الافتراضي 4000 في كليهما.                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | نفس الاشتراك الصريح. للرسائل المباشرة فقط — تحتفظ محادثات المجموعات بالإرسال الفوري لكل رسالة على القناتين. يوسّع تأخير إزالة الارتداد الافتراضي للوارد إلى 2500 مللي ثانية عند تفعيله من دون `messages.inbound.byChannel.imessage` صريح. انظر [مستندات iMessage § دمج الرسائل المباشرة المرسلة على أجزاء](/ar/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(غير متاح)_                                   | يقرأ iMessage أسماء عرض المرسلين بالفعل من `chat.db`.                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | مفاتيح تبديل لكل إجراء: `reactions` و`edit` و`unsend` و`reply` و`sendWithEffect` و`renameGroup` و`setGroupIcon` و`addParticipant` و`removeParticipant` و`leaveGroup` و`sendAttachment`.                                                                                                                                                          |

تُترجم إعدادات الحسابات المتعددة (`channels.bluebubbles.accounts.*`) واحدًا لواحد إلى `channels.imessage.accounts.*`.

## فخ سجل المجموعات

يشغّل Plugin ‏iMessage المضمّن بوابتي قائمة سماح منفصلتين للمجموعات بالتتابع. يجب أن تنجح كلتاهما حتى تصل رسالة المجموعة إلى الوكيل:

1. **قائمة سماح المرسل / هدف المحادثة** (`channels.imessage.groupAllowFrom`) — يفحصها `isAllowedIMessageSender`. تطابق الرسائل الواردة حسب معرّف المرسل أو `chat_guid` أو `chat_identifier` أو `chat_id`. نفس شكل BlueBubbles.
2. **سجل المجموعات** (`channels.imessage.groups`) — يفحصه `resolveChannelGroupPolicy` من `inbound-processing.ts:199`. مع `groupPolicy: "allowlist"`، تتطلب هذه البوابة أحد الأمرين:
   - إدخال بدل `groups: { "*": { ... } }` (يضبط `allowAll = true`)، أو
   - إدخالًا صريحًا لكل `chat_id` ضمن `groups`.

إذا نجحت البوابة 1 وفشلت البوابة 2، تُسقط الرسالة. يصدر Plugin إشارتين بمستوى `warn` حتى لا يبقى هذا صامتًا عند مستوى السجل الافتراضي:

- تحذير `warn` لمرة واحدة عند بدء التشغيل لكل حساب عندما يُضبط `groupPolicy: "allowlist"` لكن `channels.imessage.groups` يكون فارغًا (لا بدل `"*"`، ولا إدخالات لكل `chat_id`) — ينطلق قبل وصول أي رسائل.
- تحذير `warn` لمرة واحدة لكل `chat_id` عند إسقاط مجموعة محددة لأول مرة في وقت التشغيل، مع تسمية chat_id والمفتاح الدقيق الذي يجب إضافته إلى `groups` للسماح بها.

تستمر الرسائل المباشرة بالعمل لأنها تسلك مسارًا برمجيًا مختلفًا.

هذا هو نمط الفشل الأكثر شيوعًا في الترحيل من BlueBubbles إلى iMessage المضمّن: ينسخ المشغّلون `groupAllowFrom` و`groupPolicy` لكن يتخطون كتلة `groups`، لأن `groups: { "*": { "requireMention": true } }` في BlueBubbles يبدو كإعداد إشارة غير ذي صلة. لكنه في الحقيقة ضروري لبوابة السجل.

الحد الأدنى من الإعداد للحفاظ على تدفق رسائل المجموعات بعد `groupPolicy: "allowlist"`:

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

`requireMention: true` ضمن `*` غير ضار عندما لا تكون أنماط الإشارة مهيأة: يضبط وقت التشغيل `canDetectMention = false` ويتجاوز إسقاط الإشارة عند `inbound-processing.ts:512`. عند تهيئة أنماط الإشارة (`agents.list[].groupChat.mentionPatterns`)، يعمل كما هو متوقع.

إذا سجّل Gateway الرسالة `imessage: dropping group message from chat_id=<id>` أو سطر بدء التشغيل `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`، فهذا يعني أن البوابة 2 تسقط الرسائل — أضف كتلة `groups`.

## خطوة بخطوة

1. أضف كتلة iMessage بجانب كتلة BlueBubbles الحالية. أبقِ الكتلة القديمة كمصدر نسخ فقط حتى يتم التحقق من المسار الجديد:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false, // turn on after the dry run below
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

2. **فحص تجريبي** — شغّل Gateway وتأكد من أن iMessage يبلغ عن حالة سليمة:

   ```bash
   openclaw gateway
   openclaw channels status
   openclaw channels status --probe   # expect imessage.privateApi.available: true
   ```

   بما أن `imessage.enabled` لا يزال `false`، فلن يتم توجيه أي حركة iMessage واردة بعد — لكن `--probe` يختبر الجسر حتى تكتشف مشكلات الأذونات/التثبيت قبل التحويل.

3. **حوّل المسار.** أزل تهيئة BlueBubbles وفعّل iMessage في تعديل تهيئة واحد:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   أعد تشغيل Gateway. ستتدفق حركة iMessage الواردة الآن عبر الـ Plugin المضمّن.

4. **تحقق من الرسائل المباشرة.** أرسل رسالة مباشرة إلى الوكيل؛ تأكد من وصول الرد.

5. **تحقق من المجموعات بشكل منفصل.** الرسائل المباشرة والمجموعات تسلك مسارات كود مختلفة — نجاح الرسائل المباشرة لا يثبت أن المجموعات تُوجَّه. أرسل رسالة إلى الوكيل في دردشة جماعية مقترنة وتأكد من وصول الرد. إذا أصبحت المجموعة صامتة (لا رد من الوكيل، ولا خطأ)، فتحقق من سجل Gateway بحثًا عن `imessage: dropping group message from chat_id=<id>` أو سطر بدء التشغيل `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — كلاهما يظهر عند مستوى السجل الافتراضي. إذا ظهر أي منهما، فإن كتلة `groups` مفقودة أو فارغة — راجع "مشكلة سجل المجموعات الخفية" أعلاه.

6. **تحقق من سطح الإجراءات** — من رسالة مباشرة مقترنة، اطلب من الوكيل أن يتفاعل، ويعدل، ويلغي الإرسال، ويرد، ويرسل صورة، و(في مجموعة) يعيد تسمية المجموعة / يضيف مشاركًا أو يزيله. يجب أن يصل كل إجراء محليًا في Messages.app. إذا ألقى أي إجراء "iMessage `<action>` requires the imsg private API bridge"، فشغّل `imsg launch` مرة أخرى وحدّث `channels status --probe`.

7. **أزل خادم BlueBubbles وتهيئته** بعد التحقق من رسائل iMessage المباشرة والمجموعات والإجراءات. لن يستخدم OpenClaw `channels.bluebubbles`.

## تكافؤ الإجراءات بنظرة سريعة

| الإجراء                                                     | BlueBubbles القديم                  | iMessage المضمّن                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| إرسال نص / رجوع إلى SMS                                   | ✅                                  | ✅                                                                                                                      |
| إرسال وسائط (صورة، فيديو، ملف، صوت)                     | ✅                                  | ✅                                                                                                                      |
| رد ضمن سلسلة (`reply_to_guid`)                           | ✅                                  | ✅ (يغلق [#51892](https://github.com/openclaw/openclaw/issues/51892))                                                 |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| تعديل / إلغاء إرسال (مستلمو macOS 13+)                       | ✅                                  | ✅                                                                                                                      |
| إرسال مع تأثير شاشة                                    | ✅                                  | ✅ (يغلق جزءًا من [#9394](https://github.com/openclaw/openclaw/issues/9394))                                           |
| نص منسق عريض / مائل / مسطر / يتوسطه خط        | ✅                                  | ✅ (تنسيق typed-run عبر attributedBody)                                                                            |
| إعادة تسمية مجموعة / تعيين أيقونة مجموعة                              | ✅                                  | ✅                                                                                                                      |
| إضافة / إزالة مشارك، مغادرة مجموعة                      | ✅                                  | ✅                                                                                                                      |
| إيصالات القراءة ومؤشر الكتابة                         | ✅                                  | ✅ (محكوم بفحص API الخاص)                                                                                         |
| دمج الرسائل المباشرة من المرسل نفسه                                  | ✅                                  | ✅ (للرسائل المباشرة فقط؛ تفعيل اختياري عبر `channels.imessage.coalesceSameSenderDms`)                                                      |
| استدراك الرسائل الواردة المستلمة أثناء تعطل Gateway | ✅ (إعادة تشغيل Webhook + جلب السجل) | ✅ (تفعيل اختياري عبر `channels.imessage.catchup.enabled`؛ يغلق [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

أصبح استدراك iMessage متاحًا الآن كميزة تفعيل اختياري في الـ Plugin المضمّن. عند بدء Gateway، إذا كان `channels.imessage.catchup.enabled` يساوي `true`، يشغّل Gateway مرورًا واحدًا من `chats.list` + `messages.history` لكل دردشة مقابل عميل JSON-RPC نفسه المستخدم بواسطة `imsg watch`، ويعيد تشغيل كل صف وارد فائت عبر مسار الإرسال الحي (قوائم السماح، سياسة المجموعات، مزيل الارتداد، ذاكرة صدى الرسائل)، ويحفظ مؤشرًا لكل حساب حتى تتابع عمليات بدء التشغيل اللاحقة من حيث توقفت. راجع [الاستدراك بعد توقف Gateway](/ar/channels/imessage#catching-up-after-gateway-downtime) للضبط.

## الاقتران، والجلسات، وارتباطات ACP

- **موافقات الاقتران** تنتقل حسب المعرّف. لا تحتاج إلى إعادة الموافقة على المرسلين المعروفين — يتعرف `channels.imessage.allowFrom` على سلاسل `+15555550123` / `user@example.com` نفسها التي استخدمها BlueBubbles.
- **الجلسات** تبقى محددة النطاق لكل وكيل + دردشة. تُدمج الرسائل المباشرة في الجلسة الرئيسية للوكيل تحت `session.dmScope=main` الافتراضي؛ وتبقى جلسات المجموعات معزولة لكل `chat_id`. تختلف مفاتيح الجلسات (`agent:<id>:imessage:group:<chat_id>` مقابل مكافئ BlueBubbles) — لا ينتقل سجل المحادثات القديم تحت مفاتيح جلسات BlueBubbles إلى جلسات iMessage.
- **ارتباطات ACP** التي تشير إلى `match.channel: "bluebubbles"` يجب تحديثها إلى `"imessage"`. أشكال `match.peer.id` (`chat_id:`، و`chat_guid:`، و`chat_identifier:`، والمعرّف المجرّد) متطابقة.

## لا توجد قناة للرجوع

لا يوجد وقت تشغيل BlueBubbles مدعوم يمكن الرجوع إليه. إذا فشل التحقق من iMessage، فاضبط `channels.imessage.enabled: false`، وأعد تشغيل Gateway، وأصلح عائق `imsg`، ثم أعد محاولة التحويل.

توجد ذاكرة الرد المؤقتة في `~/.openclaw/state/imessage/reply-cache.jsonl` (الوضع `0600`، والدليل الأصل `0700`). من الآمن حذفها إذا أردت بداية نظيفة.

## ذات صلة

- [iMessage](/ar/channels/imessage) — مرجع قناة iMessage الكامل، بما في ذلك إعداد `imsg launch` واكتشاف القدرات.
- `/channels/bluebubbles` — عنوان URL قديم يعيد التوجيه إلى دليل الترحيل هذا.
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران.
- [توجيه القنوات](/ar/channels/channel-routing) — كيف يختار Gateway قناة للردود الصادرة.
