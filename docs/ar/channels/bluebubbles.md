---
read_when:
    - إعداد قناة BlueBubbles
    - استكشاف أخطاء اقتران Webhook وإصلاحها
    - تهيئة iMessage على macOS
sidebarTitle: BlueBubbles
summary: iMessage عبر خادم BlueBubbles على macOS (إرسال/استقبال عبر REST، الكتابة، التفاعلات، الاقتران، الإجراءات المتقدمة).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-26T11:23:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9a9eef02110f9e40f60c0bbd413c7ad7e33c377a7cf9ca2ae43aa170100ff77
    source_path: channels/bluebubbles.md
    workflow: 15
---

الحالة: Plugin مضمّن يتواصل مع خادم BlueBubbles على macOS عبر HTTP. **موصى به لتكامل iMessage** بسبب واجهته البرمجية الأكثر ثراءً وسهولة إعداده مقارنةً بقناة imsg القديمة.

<Note>
تتضمن إصدارات OpenClaw الحالية BlueBubbles، لذلك لا تحتاج الإصدارات المعبأة العادية إلى خطوة `openclaw plugins install` منفصلة.
</Note>

## نظرة عامة

- يعمل على macOS عبر تطبيق BlueBubbles المساعد ([bluebubbles.app](https://bluebubbles.app)).
- الموصى به/المختبَر: macOS Sequoia (15). يعمل macOS Tahoe (26)؛ لكن التعديل معطّل حاليًا على Tahoe، وقد تُبلغ تحديثات أيقونة المجموعة عن النجاح لكنها لا تتم مزامنتها.
- يتواصل OpenClaw معه عبر واجهة REST API الخاصة به (`GET /api/v1/ping` و`POST /message/text` و`POST /chat/:id/*`).
- تصل الرسائل الواردة عبر Webhook؛ أما الردود الصادرة ومؤشرات الكتابة وإيصالات القراءة وtapbacks فتُرسل عبر استدعاءات REST.
- تُستوعب المرفقات والملصقات كوسائط واردة (وتُعرض على الوكيل عند الإمكان).
- تُسلَّم الردود التلقائية عبر تحويل النص إلى كلام التي تُنشئ صوت MP3 أو CAF على شكل فقاعات مذكرة صوتية في iMessage بدلًا من مرفقات ملفات عادية.
- يعمل الاقتران/قائمة السماح بالطريقة نفسها كما في القنوات الأخرى (`/channels/pairing` وغيرها) باستخدام `channels.bluebubbles.allowFrom` + رموز الاقتران.
- تظهر التفاعلات كأحداث نظام تمامًا مثل Slack/Telegram بحيث يمكن للوكلاء "الإشارة" إليها قبل الرد.
- الميزات المتقدمة: التعديل، التراجع عن الإرسال، ترابط الردود، تأثيرات الرسائل، وإدارة المجموعات.

## البدء السريع

<Steps>
  <Step title="تثبيت BlueBubbles">
    ثبّت خادم BlueBubbles على جهاز Mac الخاص بك (اتبع التعليمات على [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="تمكين web API">
    في إعدادات BlueBubbles، فعّل web API وعيّن كلمة مرور.
  </Step>
  <Step title="تهيئة OpenClaw">
    شغّل `openclaw onboard` واختر BlueBubbles، أو قم بالتهيئة يدويًا:

    ```json5
    {
      channels: {
        bluebubbles: {
          enabled: true,
          serverUrl: "http://192.168.1.100:1234",
          password: "example-password",
          webhookPath: "/bluebubbles-webhook",
        },
      },
    }
    ```

  </Step>
  <Step title="توجيه Webhook إلى Gateway">
    وجّه Webhook في BlueBubbles إلى Gateway الخاص بك (مثال: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="بدء تشغيل Gateway">
    ابدأ تشغيل Gateway؛ وسيقوم بتسجيل معالج Webhook وبدء الاقتران.
  </Step>
</Steps>

<Warning>
**الأمان**

- احرص دائمًا على تعيين كلمة مرور لـ Webhook.
- تكون مصادقة Webhook مطلوبة دائمًا. يرفض OpenClaw طلبات Webhook الخاصة بـ BlueBubbles ما لم تتضمن كلمة مرور/guid يطابق `channels.bluebubbles.password` (مثلًا `?password=<password>` أو `x-password`)، بغض النظر عن بنية loopback/proxy.
- يتم التحقق من مصادقة كلمة المرور قبل قراءة/تحليل أجسام Webhook كاملة.
</Warning>

## إبقاء Messages.app نشطًا (إعدادات VM / بدون واجهة)

قد تنتهي بعض إعدادات macOS VM / التشغيل الدائم إلى دخول Messages.app في حالة "خمول" (تتوقف الأحداث الواردة حتى يتم فتح التطبيق/جعله في الواجهة). يوجد حل بديل بسيط يتمثل في **تنبيه Messages كل 5 دقائق** باستخدام AppleScript + LaunchAgent.

<Steps>
  <Step title="حفظ AppleScript">
    احفظ هذا باسم `~/Scripts/poke-messages.scpt`:

    ```applescript
    try
      tell application "Messages"
        if not running then
          launch
        end if

        -- Touch the scripting interface to keep the process responsive.
        set _chatCount to (count of chats)
      end tell
    on error
      -- Ignore transient failures (first-run prompts, locked session, etc).
    end try
    ```

  </Step>
  <Step title="تثبيت LaunchAgent">
    احفظ هذا باسم `~/Library/LaunchAgents/com.user.poke-messages.plist`:

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
      <dict>
        <key>Label</key>
        <string>com.user.poke-messages</string>

        <key>ProgramArguments</key>
        <array>
          <string>/bin/bash</string>
          <string>-lc</string>
          <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
        </array>

        <key>RunAtLoad</key>
        <true/>

        <key>StartInterval</key>
        <integer>300</integer>

        <key>StandardOutPath</key>
        <string>/tmp/poke-messages.log</string>
        <key>StandardErrorPath</key>
        <string>/tmp/poke-messages.err</string>
      </dict>
    </plist>
    ```

    يعمل هذا **كل 300 ثانية** و**عند تسجيل الدخول**. قد يؤدي التشغيل الأول إلى ظهور مطالبات macOS الخاصة بـ **Automation** (`osascript` ← Messages). وافق عليها ضمن جلسة المستخدم نفسها التي تشغّل LaunchAgent.

  </Step>
  <Step title="تحميله">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## الإعداد الأولي

يتوفر BlueBubbles ضمن الإعداد التفاعلي الأولي:

```
openclaw onboard
```

يعرض المعالج طلبات لما يلي:

<ParamField path="عنوان URL للخادم" type="string" required>
  عنوان خادم BlueBubbles (مثلًا `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="كلمة المرور" type="string" required>
  كلمة مرور API من إعدادات خادم BlueBubbles.
</ParamField>
<ParamField path="مسار Webhook" type="string" default="/bluebubbles-webhook">
  مسار نقطة نهاية Webhook.
</ParamField>
<ParamField path="سياسة الرسائل الخاصة" type="string">
  `pairing` أو `allowlist` أو `open` أو `disabled`.
</ParamField>
<ParamField path="قائمة السماح" type="string[]">
  أرقام الهواتف أو رسائل البريد الإلكتروني أو أهداف الدردشة.
</ParamField>

يمكنك أيضًا إضافة BlueBubbles عبر CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## التحكم في الوصول (الرسائل الخاصة + المجموعات)

<Tabs>
  <Tab title="الرسائل الخاصة">
    - الافتراضي: `channels.bluebubbles.dmPolicy = "pairing"`.
    - يتلقى المرسلون غير المعروفين رمز اقتران؛ ويتم تجاهل الرسائل حتى الموافقة عليهم (تنتهي صلاحية الرموز بعد ساعة واحدة).
    - الموافقة عبر:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - الاقتران هو تبادل الرموز الافتراضي. التفاصيل: [الاقتران](/ar/channels/pairing)
  </Tab>
  <Tab title="المجموعات">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (الافتراضي: `allowlist`).
    - يتحكم `channels.bluebubbles.groupAllowFrom` بمن يمكنه التفعيل داخل المجموعات عند ضبط `allowlist`.
  </Tab>
</Tabs>

### إثراء أسماء جهات الاتصال (macOS، اختياري)

غالبًا ما تتضمن Webhook مجموعات BlueBubbles عناوين المشاركين الخام فقط. إذا كنت تريد أن يعرض سياق `GroupMembers` أسماء جهات الاتصال المحلية بدلًا من ذلك، فيمكنك تفعيل إثراء جهات الاتصال المحلية على macOS:

- يفعّل `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` عملية البحث. الافتراضي: `false`.
- لا تُجرى عمليات البحث إلا بعد أن تسمح صلاحيات وصول المجموعة وتفويض الأوامر وبوابة الإشارة بمرور الرسالة.
- لا يتم الإثراء إلا للمشاركين الهاتفيين غير المسمّين.
- تبقى أرقام الهواتف الخام هي البديل الاحتياطي إذا لم يتم العثور على تطابق محلي.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### بوابة الإشارة (المجموعات)

يدعم BlueBubbles بوابة الإشارة في دردشات المجموعات بما يتوافق مع سلوك iMessage/WhatsApp:

- يستخدم `agents.list[].groupChat.mentionPatterns` (أو `messages.groupChat.mentionPatterns`) لاكتشاف الإشارات.
- عند تفعيل `requireMention` لمجموعة ما، لا يرد الوكيل إلا عند الإشارة إليه.
- تتجاوز أوامر التحكم الصادرة من مرسلين مخوّلين بوابة الإشارة.

تهيئة لكل مجموعة:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // الافتراضي لكل المجموعات
        "iMessage;-;chat123": { requireMention: false }, // تجاوز لمجموعة محددة
      },
    },
  },
}
```

### بوابة الأوامر

- تتطلب أوامر التحكم (مثل `/config` و`/model`) تخويلًا.
- تستخدم `allowFrom` و`groupAllowFrom` لتحديد تخويل الأوامر.
- يمكن للمرسلين المخوّلين تشغيل أوامر التحكم حتى من دون إشارة داخل المجموعات.

### موجه نظام لكل مجموعة

يقبل كل إدخال ضمن `channels.bluebubbles.groups.*` سلسلة `systemPrompt` اختيارية. تُحقن هذه القيمة في موجه النظام الخاص بالوكيل في كل دورة تعالج رسالة في تلك المجموعة، بحيث يمكنك ضبط شخصية أو قواعد سلوكية لكل مجموعة بدون تعديل موجهات الوكيل:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "اجعل الردود أقل من 3 جمل. وحاكِ النبرة غير الرسمية للمجموعة.",
        },
      },
    },
  },
}
```

يطابق المفتاح أي قيمة يُبلغ عنها BlueBubbles بوصفها `chatGuid` / `chatIdentifier` / `chatId` الرقمي للمجموعة، ويوفر إدخال wildcard `"*"` قيمة افتراضية لكل مجموعة لا تملك تطابقًا دقيقًا (وهو النمط نفسه المستخدم بواسطة `requireMention` وسياسات الأدوات لكل مجموعة). تتغلب التطابقات الدقيقة دائمًا على wildcard. تتجاهل الرسائل الخاصة هذا الحقل؛ استخدم بدلًا من ذلك تخصيص الموجه على مستوى الوكيل أو الحساب.

#### مثال عملي: الردود المترابطة وتفاعلات tapback (Private API)

عند تمكين BlueBubbles Private API، تصل الرسائل الواردة مع معرّفات رسائل قصيرة (مثل `[[reply_to:5]]`) ويمكن للوكيل استدعاء `action=reply` للربط برسالة محددة أو `action=react` لإضافة tapback. ويُعد `systemPrompt` لكل مجموعة طريقة موثوقة لإبقاء الوكيل يختار الأداة الصحيحة:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "عند الرد في هذه المجموعة، استخدم دائمًا action=reply مع",
            "معرّف الرسالة [[reply_to:N]] من السياق حتى يُربط ردك",
            "أسفل الرسالة المحفِّزة. لا ترسل أبدًا رسالة جديدة غير مرتبطة.",
            "",
            "بالنسبة لرسائل التأكيد القصيرة ('ok' أو 'got it' أو 'on it')، استخدم",
            "action=react مع emoji tapback مناسب (❤️ أو 👍 أو 😂 أو ‼️ أو ❓)",
            "بدلًا من إرسال رد نصي.",
          ].join(" "),
        },
      },
    },
  },
}
```

تتطلب تفاعلات tapback والردود المترابطة كلاهما BlueBubbles Private API؛ راجع [الإجراءات المتقدمة](#advanced-actions) و[معرّفات الرسائل](#message-ids-short-vs-full) لمعرفة الآليات الأساسية.

## روابط محادثات ACP

يمكن تحويل دردشات BlueBubbles إلى مساحات عمل ACP دائمة من دون تغيير طبقة النقل.

تدفق المشغّل السريع:

- شغّل `/acp spawn codex --bind here` داخل الرسالة الخاصة أو دردشة المجموعة المسموح بها.
- تُوجَّه الرسائل المستقبلية في محادثة BlueBubbles نفسها إلى جلسة ACP التي تم إنشاؤها.
- يعيد `/new` و`/reset` تعيين جلسة ACP المرتبطة نفسها في مكانها.
- يُغلق `/acp close` جلسة ACP ويزيل الربط.

يتم أيضًا دعم الروابط الدائمة المُهيأة عبر إدخالات `bindings[]` ذات المستوى الأعلى باستخدام `type: "acp"` و`match.channel: "bluebubbles"`.

يمكن أن يستخدم `match.peer.id` أي صيغة هدف BlueBubbles مدعومة:

- معرّف DM مُطبَّع مثل `+15555550123` أو `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

للحصول على روابط مجموعات مستقرة، يُفضّل استخدام `chat_id:*` أو `chat_identifier:*`.

مثال:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

راجع [وكلاء ACP](/ar/tools/acp-agents) للاطلاع على سلوك روابط ACP المشتركة.

## الكتابة + إيصالات القراءة

- **مؤشرات الكتابة**: تُرسل تلقائيًا قبل وأثناء إنشاء الرد.
- **إيصالات القراءة**: يتحكم بها `channels.bluebubbles.sendReadReceipts` (الافتراضي: `true`).
- **مؤشرات الكتابة**: يرسل OpenClaw أحداث بدء الكتابة؛ ويقوم BlueBubbles بمسح حالة الكتابة تلقائيًا عند الإرسال أو انتهاء المهلة (الإيقاف اليدوي عبر DELETE غير موثوق).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // تعطيل إيصالات القراءة
    },
  },
}
```

## الإجراءات المتقدمة

يدعم BlueBubbles إجراءات الرسائل المتقدمة عند تمكينها في الإعدادات:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (الافتراضي: true)
        edit: true, // تعديل الرسائل المرسلة (macOS 13+، معطّل على macOS 26 Tahoe)
        unsend: true, // التراجع عن إرسال الرسائل (macOS 13+)
        reply: true, // ترابط الردود حسب GUID الرسالة
        sendWithEffect: true, // تأثيرات الرسائل (slam وloud وما إلى ذلك)
        renameGroup: true, // إعادة تسمية الدردشات الجماعية
        setGroupIcon: true, // تعيين أيقونة/صورة الدردشة الجماعية (غير مستقر على macOS 26 Tahoe)
        addParticipant: true, // إضافة مشاركين إلى المجموعات
        removeParticipant: true, // إزالة مشاركين من المجموعات
        leaveGroup: true, // مغادرة الدردشات الجماعية
        sendAttachment: true, // إرسال المرفقات/الوسائط
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="الإجراءات المتاحة">
    - **react**: إضافة/إزالة تفاعلات tapback (`messageId` و`emoji` و`remove`). مجموعة tapback الأصلية في iMessage هي `love` و`like` و`dislike` و`laugh` و`emphasize` و`question`. عندما يختار الوكيل emoji خارج هذه المجموعة (مثل `👀`)، تعود أداة التفاعل إلى `love` بحيث يستمر عرض tapback بدلًا من فشل الطلب بالكامل. أما تفاعلات التأكيد المُهيأة فتظل تتحقق بشكل صارم وتُرجع خطأ عند القيم غير المعروفة.
    - **edit**: تعديل رسالة مرسلة (`messageId` و`text`).
    - **unsend**: التراجع عن إرسال رسالة (`messageId`).
    - **reply**: الرد على رسالة محددة (`messageId` و`text` و`to`).
    - **sendWithEffect**: الإرسال مع تأثير iMessage (`text` و`to` و`effectId`).
    - **renameGroup**: إعادة تسمية دردشة جماعية (`chatGuid` و`displayName`).
    - **setGroupIcon**: تعيين أيقونة/صورة دردشة جماعية (`chatGuid` و`media`) — غير مستقر على macOS 26 Tahoe (قد تُرجع API نجاحًا لكن الأيقونة لا تتم مزامنتها).
    - **addParticipant**: إضافة شخص إلى مجموعة (`chatGuid` و`address`).
    - **removeParticipant**: إزالة شخص من مجموعة (`chatGuid` و`address`).
    - **leaveGroup**: مغادرة دردشة جماعية (`chatGuid`).
    - **upload-file**: إرسال وسائط/ملفات (`to` و`buffer` و`filename` و`asVoice`).
      - المذكرات الصوتية: اضبط `asVoice: true` مع صوت **MP3** أو **CAF** للإرسال كرسالة صوتية في iMessage. يحوّل BlueBubbles ملفات MP3 إلى CAF عند إرسال المذكرات الصوتية.
    - الاسم البديل القديم: لا يزال `sendAttachment` يعمل، لكن `upload-file` هو اسم الإجراء القياسي.
  </Accordion>
</AccordionGroup>

### معرّفات الرسائل (القصيرة مقابل الكاملة)

قد يعرض OpenClaw معرّفات رسائل _قصيرة_ (مثل `1` و`2`) لتوفير الرموز.

- يمكن أن يكون `MessageSid` / `ReplyToId` معرّفات قصيرة.
- يحتوي `MessageSidFull` / `ReplyToIdFull` على المعرّفات الكاملة لدى المزوّد.
- المعرفات القصيرة تكون داخل الذاكرة؛ وقد تنتهي صلاحيتها عند إعادة التشغيل أو تفريغ ذاكرة التخزين المؤقت.
- تقبل الإجراءات `messageId` القصير أو الكامل، لكن المعرّفات القصيرة ستُرجع خطأ إذا لم تعد متاحة.

استخدم المعرّفات الكاملة للأتمتة والتخزين الدائمين:

- القوالب: `{{MessageSidFull}}` و`{{ReplyToIdFull}}`
- السياق: `MessageSidFull` / `ReplyToIdFull` في الحمولات الواردة

راجع [التهيئة](/ar/gateway/configuration) لمتغيرات القوالب.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## دمج الرسائل الخاصة المقسّمة عند الإرسال (أمر + URL في تركيب واحد)

عندما يكتب المستخدم أمرًا وURL معًا في iMessage — مثل `Dump https://example.com/article` — يقوم Apple بتقسيم الإرسال إلى **عمليتَي تسليم Webhook منفصلتَين**:

1. رسالة نصية (`"Dump"`).
2. فقاعة معاينة URL (`"https://..."`) مع صور معاينة OG كمرفقات.

تصل عمليتا Webhook إلى OpenClaw بفارق يقارب ~0.8-2.0 ثانية في معظم الإعدادات. من دون الدمج، يتلقى الوكيل الأمر وحده في الدورة الأولى، ويرد (غالبًا بـ "أرسل لي الرابط")، ثم لا يرى URL إلا في الدورة الثانية — وعندها يكون سياق الأمر قد فُقد بالفعل.

يؤدي `channels.bluebubbles.coalesceSameSenderDms` إلى اشتراك الرسالة الخاصة في دمج Webhook المتتالية من المرسل نفسه في دورة وكيل واحدة. وتستمر دردشات المجموعات في الاعتماد على كل رسالة على حدة بحيث يتم الحفاظ على بنية الأدوار متعددة المستخدمين.

<Tabs>
  <Tab title="متى يجب التمكين">
    قم بالتمكين عندما:

    - تنشر Skills تتوقع `أمر + حمولة` في رسالة واحدة (dump أو paste أو save أو queue وما إلى ذلك).
    - يقوم المستخدمون بلصق URL أو صور أو محتوى طويل إلى جانب الأوامر.
    - يمكنك تقبّل زمن الانتظار الإضافي في دورة الرسائل الخاصة (انظر أدناه).

    اتركه معطّلًا عندما:

    - تحتاج إلى أقل زمن استجابة ممكن لأوامر الرسائل الخاصة القصيرة.
    - تكون جميع التدفقات لديك أوامر أحادية من دون حمولات متابعة.

  </Tab>
  <Tab title="التمكين">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // تفعيل اختياري (الافتراضي: false)
        },
      },
    }
    ```

    عند تفعيل هذا الخيار ومن دون ضبط `messages.inbound.byChannel.bluebubbles` صراحةً، تتسع نافذة إزالة الارتداد إلى **2500 ms** (الافتراضي في حالة عدم الدمج هو 500 ms). هذه النافذة الأوسع مطلوبة — إذ إن إيقاع الإرسال المقسّم في Apple والبالغ 0.8-2.0 ثانية لا يتناسب مع الافتراضي الأضيق.

    لضبط النافذة بنفسك:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // تعمل 2500 ms في معظم الإعدادات؛ ارفعها إلى 4000 ms إذا كان جهاز Mac بطيئًا
            // أو تحت ضغط ذاكرة (قد يتمدد الفارق الملاحظ حينها إلى ما بعد ثانيتين).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="المفاضلات">
    - **زمن انتظار إضافي لأوامر التحكم في الرسائل الخاصة.** عند تفعيل هذا الخيار، تنتظر رسائل أوامر التحكم في الرسائل الخاصة (مثل `Dump` و`Save` وما إلى ذلك) الآن حتى نافذة إزالة الارتداد قبل الإرسال، تحسبًا لوصول Webhook تحمل حمولة. أما أوامر دردشات المجموعات فتبقى فورية.
    - **الناتج المدمج محدود** — يُحدَّد النص المدمج بسقف 4000 حرف مع علامة `…[truncated]` صريحة؛ وتُحدَّد المرفقات بسقف 20؛ وتُحدَّد إدخالات المصدر بسقف 10 (يتم الاحتفاظ بالأول والأحدث بعد ذلك). لا يزال كل `messageId` من المصدر يصل إلى إزالة تكرار الوارد، بحيث يُتعرّف على أي إعادة تشغيل لاحقة من MessagePoller لأي حدث فردي على أنها مكررة.
    - **اشتراك اختياري، لكل قناة.** لا تتأثر القنوات الأخرى (Telegram وWhatsApp وSlack و…).
  </Tab>
</Tabs>

### السيناريوهات وما يراه الوكيل

| ما يكتبه المستخدم                                                   | ما يسلّمه Apple          | مع تعطيل الخيار (الافتراضي)             | مع تفعيل الخيار + نافذة 2500 ms                                         |
| ------------------------------------------------------------------ | ------------------------ | ---------------------------------------- | ------------------------------------------------------------------------ |
| `Dump https://example.com` (إرسال واحد)                            | عمليتا Webhook بفارق ~1 ث | دورتا وكيل: `"Dump"` وحدها، ثم URL       | دورة واحدة: نص مدمج `Dump https://example.com`                          |
| `Save this 📎image.jpg caption` (مرفق + نص)                         | عمليتا Webhook           | دورتان                                   | دورة واحدة: نص + صورة                                                   |
| `/status` (أمر مستقل)                                              | Webhook واحدة            | إرسال فوري                               | **انتظار حتى النافذة، ثم الإرسال**                                      |
| لصق URL وحده                                                       | Webhook واحدة            | إرسال فوري                               | إرسال فوري (يوجد إدخال واحد فقط في الحاوية)                            |
| إرسال نص + URL على شكل رسالتين منفصلتين متعمدتين، بينهما دقائق     | عمليتا Webhook خارج النافذة | دورتان                                | دورتان (تنتهي النافذة بينهما)                                           |
| سيل سريع (>10 رسائل خاصة صغيرة داخل النافذة)                      | N من Webhook             | N من الدورات                             | دورة واحدة، ناتج محدود (الأول + الأحدث، مع تطبيق حدود النص/المرفقات)   |

### استكشاف أخطاء دمج الإرسال المقسّم وإصلاحها

إذا كان الخيار مفعّلًا وما زالت الإرسالات المقسّمة تصل على شكل دورتين، فتحقق من كل طبقة:

<AccordionGroup>
  <Accordion title="تم تحميل الإعدادات فعليًا">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    ثم نفّذ `openclaw gateway restart` — إذ تتم قراءة الخيار عند إنشاء سجل إزالة الارتداد.

  </Accordion>
  <Accordion title="نافذة إزالة الارتداد واسعة بما يكفي لإعدادك">
    انظر إلى سجل خادم BlueBubbles ضمن `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    قِس الفارق بين إرسال النص بنمط `"Dump"` والإرسال اللاحق بنمط `"https://..."; Attachments:`. ارفع `messages.inbound.byChannel.bluebubbles` بحيث يغطي هذا الفارق بهامش مريح.

  </Accordion>
  <Accordion title="طوابع JSONL الزمنية للجلسة ≠ وقت وصول Webhook">
    تعكس طوابع وقت أحداث الجلسة (`~/.openclaw/agents/<id>/sessions/*.jsonl`) وقت تسليم Gateway الرسالة إلى الوكيل، **وليس** وقت وصول Webhook. إذا ظهرت رسالة ثانية في الطابور مع الوسم `[Queued messages while agent was busy]`، فهذا يعني أن الدورة الأولى كانت لا تزال قيد التنفيذ عند وصول Webhook الثانية — وكانت حاوية الدمج قد أفرغت بالفعل. اضبط النافذة بالاعتماد على سجل خادم BB، لا سجل الجلسة.
  </Accordion>
  <Accordion title="ضغط الذاكرة يبطئ إرسال الرد">
    على الأجهزة الأصغر (8 GB)، قد تستغرق دورات الوكيل وقتًا كافيًا بحيث تُفرغ حاوية الدمج قبل اكتمال الرد، ويصل URL كدورة ثانية في الطابور. تحقق من `memory_pressure` و`ps -o rss -p $(pgrep openclaw-gateway)`؛ وإذا تجاوز Gateway نحو ~500 MB RSS وكان الضاغط نشطًا، فأغلق العمليات الثقيلة الأخرى أو انتقل إلى مضيف أكبر.
  </Accordion>
  <Accordion title="إرسالات reply-quote تسلك مسارًا مختلفًا">
    إذا نقر المستخدم على `Dump` باعتبارها **ردًا** على فقاعة URL موجودة مسبقًا (ويُظهر iMessage شارة "1 Reply" على فقاعة Dump)، فإن URL تكون في `replyToBody`، وليس في Webhook ثانية. لا ينطبق الدمج هنا — فهذه مسألة تخص Skill/الموجه، وليست مسألة تخص إزالة الارتداد.
  </Accordion>
</AccordionGroup>

## البث على شكل كتل

تحكم فيما إذا كانت الردود تُرسل كرسالة واحدة أو تُبث على شكل كتل:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // تمكين البث على شكل كتل (معطّل افتراضيًا)
    },
  },
}
```

## الوسائط + الحدود

- يتم تنزيل المرفقات الواردة وتخزينها في ذاكرة التخزين المؤقت للوسائط.
- حد الوسائط عبر `channels.bluebubbles.mediaMaxMb` للوسائط الواردة والصادرة (الافتراضي: 8 MB).
- يُقسَّم النص الصادر إلى أجزاء وفق `channels.bluebubbles.textChunkLimit` (الافتراضي: 4000 حرف).

## مرجع التهيئة

التهيئة الكاملة: [التهيئة](/ar/gateway/configuration)

<AccordionGroup>
  <Accordion title="الاتصال وWebhook">
    - `channels.bluebubbles.enabled`: تمكين/تعطيل القناة.
    - `channels.bluebubbles.serverUrl`: عنوان URL الأساسي لـ REST API في BlueBubbles.
    - `channels.bluebubbles.password`: كلمة مرور API.
    - `channels.bluebubbles.webhookPath`: مسار نقطة نهاية Webhook (الافتراضي: `/bluebubbles-webhook`).
  </Accordion>
  <Accordion title="سياسة الوصول">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: `pairing`).
    - `channels.bluebubbles.allowFrom`: قائمة السماح للرسائل الخاصة (المعرّفات، ورسائل البريد الإلكتروني، وأرقام E.164، و`chat_id:*`، و`chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (الافتراضي: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: قائمة السماح لمرسلي المجموعات.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: على macOS، إثراء اختياري للمشاركين غير المسمّين في المجموعات من جهات الاتصال المحلية بعد اجتياز البوابات. الافتراضي: `false`.
    - `channels.bluebubbles.groups`: إعدادات لكل مجموعة (`requireMention` وغيرها).
  </Accordion>
  <Accordion title="التسليم والتقسيم">
    - `channels.bluebubbles.sendReadReceipts`: إرسال إيصالات القراءة (الافتراضي: `true`).
    - `channels.bluebubbles.blockStreaming`: تمكين البث على شكل كتل (الافتراضي: `false`؛ مطلوب للردود المتدفقة).
    - `channels.bluebubbles.textChunkLimit`: حجم الجزء الصادر بالأحرف (الافتراضي: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: مهلة كل طلب بالمللي ثانية لإرسال النصوص الصادرة عبر `/api/v1/message/text` (الافتراضي: 30000). ارفع القيمة على إعدادات macOS 26 حيث قد تتوقف عمليات إرسال iMessage عبر Private API لأكثر من 60 ثانية داخل إطار عمل iMessage؛ مثلًا `45000` أو `60000`. تحافظ عمليات الفحص والاستعلام عن الدردشات والتفاعلات والتعديلات وفحوصات السلامة حاليًا على الافتراضي الأقصر البالغ 10 ثوانٍ؛ ومن المخطط لاحقًا توسيع التغطية لتشمل التفاعلات والتعديلات. تجاوز لكل حساب: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: تؤدي `length` (الافتراضي) إلى التقسيم فقط عند تجاوز `textChunkLimit`؛ أما `newline` فتقسّم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
  </Accordion>
  <Accordion title="الوسائط والسجل">
    - `channels.bluebubbles.mediaMaxMb`: الحد الأقصى للوسائط الواردة/الصادرة بالميغابايت (الافتراضي: 8).
    - `channels.bluebubbles.mediaLocalRoots`: قائمة سماح صريحة بالأدلة المحلية المطلقة المسموح بها لمسارات الوسائط المحلية الصادرة. تُرفض عمليات إرسال المسارات المحلية افتراضيًا ما لم يتم ضبط هذا الخيار. تجاوز لكل حساب: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: دمج Webhook المتتالية للرسائل الخاصة من المرسل نفسه في دورة وكيل واحدة بحيث يصل الإرسال المقسّم من Apple للنص + URL كرسالة واحدة (الافتراضي: `false`). راجع [دمج الرسائل الخاصة المقسّمة عند الإرسال](#coalescing-split-send-dms-command--url-in-one-composition) للاطلاع على السيناريوهات وضبط النافذة والمفاضلات. يوسّع نافذة إزالة الارتداد الافتراضية للرسائل الواردة من 500 ms إلى 2500 ms عند التمكين من دون ضبط `messages.inbound.byChannel.bluebubbles` صراحةً.
    - `channels.bluebubbles.historyLimit`: الحد الأقصى لرسائل المجموعات للسياق (تعطّل القيمة 0 هذا الخيار).
    - `channels.bluebubbles.dmHistoryLimit`: حد سجل الرسائل الخاصة.
  </Accordion>
  <Accordion title="الإجراءات والحسابات">
    - `channels.bluebubbles.actions`: تمكين/تعطيل إجراءات محددة.
    - `channels.bluebubbles.accounts`: إعدادات متعددة الحسابات.
  </Accordion>
</AccordionGroup>

الخيارات العامة ذات الصلة:

- `agents.list[].groupChat.mentionPatterns` (أو `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## العناوين / أهداف التسليم

يُفضَّل `chat_guid` من أجل توجيه ثابت:

- `chat_guid:iMessage;-;+15555550123` (مفضّل للمجموعات)
- `chat_id:123`
- `chat_identifier:...`
- المعرّفات المباشرة: `+15555550123`، `user@example.com`
  - إذا لم يكن لدى معرّف مباشر دردشة DM موجودة، فسينشئ OpenClaw واحدة عبر `POST /api/v1/chat/new`. ويتطلب ذلك تمكين BlueBubbles Private API.

### توجيه iMessage مقابل SMS

عندما يكون للمعرّف نفسه دردشة iMessage ودردشة SMS على جهاز Mac (مثل رقم هاتف مسجّل في iMessage لكنه استقبل أيضًا رسائل fallback بفقاعات خضراء)، يفضّل OpenClaw دردشة iMessage ولا يُجري خفضًا صامتًا إلى SMS. لفرض دردشة SMS، استخدم بادئة هدف `sms:` صريحة (مثل `sms:+15555550123`). أما المعرّفات التي لا تملك دردشة iMessage مطابقة فسيتم إرسالها عبر أي دردشة يُبلغ عنها BlueBubbles.

## الأمان

- تتم مصادقة طلبات Webhook عبر مقارنة معامِلات الاستعلام `guid`/`password` أو الترويسات مع `channels.bluebubbles.password`.
- حافظ على سرية كلمة مرور API ونقطة نهاية Webhook (وتعامل معهما كبيانات اعتماد).
- لا يوجد تجاوز لـ localhost لمصادقة Webhook في BlueBubbles. إذا كنت تمرّر حركة Webhook عبر proxy، فأبقِ كلمة مرور BlueBubbles ضمن الطلب من البداية إلى النهاية. لا يحل `gateway.trustedProxies` محل `channels.bluebubbles.password` هنا. راجع [أمان Gateway](/ar/gateway/security#reverse-proxy-configuration).
- فعّل HTTPS + قواعد الجدار الناري على خادم BlueBubbles إذا كنت ستكشفه خارج شبكة LAN الخاصة بك.

## استكشاف الأخطاء وإصلاحها

- إذا توقفت أحداث الكتابة/القراءة عن العمل، فتحقق من سجلات Webhook في BlueBubbles وتأكد من أن مسار Gateway يطابق `channels.bluebubbles.webhookPath`.
- تنتهي صلاحية رموز الاقتران بعد ساعة واحدة؛ استخدم `openclaw pairing list bluebubbles` و`openclaw pairing approve bluebubbles <code>`.
- تتطلب التفاعلات BlueBubbles private API (`POST /api/v1/message/react`)؛ تأكد من أن إصدار الخادم يوفّرها.
- يتطلب edit/unsend نظام macOS 13+ وإصدارًا متوافقًا من خادم BlueBubbles. على macOS 26 (Tahoe)، يكون edit معطّلًا حاليًا بسبب تغييرات في private API.
- قد تكون تحديثات أيقونات المجموعات غير مستقرة على macOS 26 (Tahoe): قد تُرجع API نجاحًا لكن الأيقونة الجديدة لا تتم مزامنتها.
- يُخفي OpenClaw تلقائيًا الإجراءات المعروفة بأنها معطّلة استنادًا إلى إصدار macOS الخاص بخادم BlueBubbles. إذا كان edit لا يزال يظهر على macOS 26 (Tahoe)، فعطّله يدويًا باستخدام `channels.bluebubbles.actions.edit=false`.
- إذا كان `coalesceSameSenderDms` مفعّلًا لكن الإرسالات المقسّمة (مثل `Dump` + URL) لا تزال تصل على شكل دورتين: راجع قائمة [استكشاف أخطاء دمج الإرسال المقسّم وإصلاحها](#split-send-coalescing-troubleshooting) — تشمل الأسباب الشائعة نافذة إزالة ارتداد ضيقة جدًا، أو إساءة قراءة طوابع وقت سجل الجلسة على أنها وقت وصول Webhook، أو إرسال reply-quote (الذي يستخدم `replyToBody`، وليس Webhook ثانية).
- للحصول على معلومات الحالة/السلامة: `openclaw status --all` أو `openclaw status --deep`.

للاطلاع على مرجع عام لسير عمل القنوات، راجع [القنوات](/ar/channels) ودليل [Plugins](/ar/tools/plugin).

## ذو صلة

- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [المجموعات](/ar/channels/groups) — سلوك الدردشات الجماعية وبوابة الإشارة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل الخاصة وتدفق الاقتران
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
