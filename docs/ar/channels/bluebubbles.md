---
read_when:
    - إعداد قناة BlueBubbles
    - استكشاف أخطاء اقتران Webhook وإصلاحها
    - تكوين iMessage على macOS
sidebarTitle: BlueBubbles
summary: iMessage عبر خادم BlueBubbles لنظام macOS (إرسال/استقبال عبر REST، مؤشرات الكتابة، التفاعلات، الإقران، الإجراءات المتقدمة).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-30T07:39:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a77b248ed86eb4114f8b7f1fc6bd4cea004d65095a0439a4a8c814bc180082c
    source_path: channels/bluebubbles.md
    workflow: 16
---

الحالة: Plugin مضمّن يتواصل مع خادم BlueBubbles على macOS عبر HTTP. **موصى به لتكامل iMessage** بسبب واجهة API الأغنى وسهولة الإعداد مقارنة بقناة imsg القديمة.

<Note>
تتضمن إصدارات OpenClaw الحالية BlueBubbles، لذلك لا تحتاج البُنى المعبأة العادية إلى خطوة `openclaw plugins install` منفصلة.
</Note>

## نظرة عامة

- يعمل على macOS عبر تطبيق BlueBubbles المساعد ([bluebubbles.app](https://bluebubbles.app)).
- موصى به/مختبَر: macOS Sequoia (15). يعمل macOS Tahoe (26)؛ التحرير معطّل حاليًا على Tahoe، وقد تُبلّغ تحديثات أيقونات المجموعات عن النجاح لكنها لا تتزامن.
- يتواصل OpenClaw معه من خلال REST API الخاصة به (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- تصل الرسائل الواردة عبر Webhook؛ أما الردود الصادرة، ومؤشرات الكتابة، وإيصالات القراءة، وtapbacks فهي استدعاءات REST.
- تُستوعَب المرفقات والملصقات كوسائط واردة (وتُعرض للوكيل عند الإمكان).
- تُسلَّم ردود Auto-TTS التي تُنشئ صوت MP3 أو CAF كفقاعات مذكرة صوتية في iMessage بدلًا من مرفقات ملفات عادية.
- يعمل الاقتران/قائمة السماح بالطريقة نفسها مثل القنوات الأخرى (`/channels/pairing` إلخ) مع `channels.bluebubbles.allowFrom` + رموز الاقتران.
- تُعرض التفاعلات كأحداث نظام تمامًا مثل Slack/Telegram حتى يمكن للوكلاء "ذكرها" قبل الرد.
- الميزات المتقدمة: التحرير، إلغاء الإرسال، تسلسل الردود، تأثيرات الرسائل، إدارة المجموعات.

## البدء السريع

<Steps>
  <Step title="Install BlueBubbles">
    ثبّت خادم BlueBubbles على جهاز Mac لديك (اتبع التعليمات في [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Enable the web API">
    في إعدادات BlueBubbles، فعّل web API وعيّن كلمة مرور.
  </Step>
  <Step title="Configure OpenClaw">
    شغّل `openclaw onboard` واختر BlueBubbles، أو اضبطه يدويًا:

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
  <Step title="Point webhooks at the gateway">
    وجّه BlueBubbles webhooks إلى Gateway لديك (مثال: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Start the gateway">
    ابدأ Gateway؛ سيسجل معالج Webhook ويبدأ الاقتران.
  </Step>
</Steps>

<Warning>
**الأمان**

- عيّن دائمًا كلمة مرور Webhook.
- مصادقة Webhook مطلوبة دائمًا. يرفض OpenClaw طلبات BlueBubbles Webhook ما لم تتضمن كلمة مرور/guid تطابق `channels.bluebubbles.password` (مثلًا `?password=<password>` أو `x-password`)، بغض النظر عن بنية local loopback/الوكيل.
- تُفحص مصادقة كلمة المرور قبل قراءة/تحليل أجسام Webhook كاملة.

</Warning>

## إبقاء Messages.app نشطًا (إعدادات VM / بلا واجهة)

قد تنتهي بعض إعدادات macOS VM / التشغيل الدائم إلى جعل Messages.app في حالة "خمول" (تتوقف الأحداث الواردة حتى يُفتح التطبيق/ينتقل إلى المقدمة). الحل البسيط هو **تنبيه Messages كل 5 دقائق** باستخدام AppleScript + LaunchAgent.

<Steps>
  <Step title="Save the AppleScript">
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
  <Step title="Install a LaunchAgent">
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

    يعمل هذا **كل 300 ثانية** و**عند تسجيل الدخول**. قد يؤدي التشغيل الأول إلى ظهور مطالبات **Automation** في macOS (`osascript` → Messages). وافق عليها في جلسة المستخدم نفسها التي تشغّل LaunchAgent.

  </Step>
  <Step title="Load it">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## الإعداد الأولي

BlueBubbles متاح في الإعداد الأولي التفاعلي:

```
openclaw onboard
```

يطالبك المعالج بما يلي:

<ParamField path="Server URL" type="string" required>
  عنوان خادم BlueBubbles (مثل `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  كلمة مرور API من إعدادات BlueBubbles Server.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  مسار نقطة نهاية Webhook.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open`, أو `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  أرقام الهاتف، أو عناوين البريد الإلكتروني، أو أهداف الدردشة.
</ParamField>

يمكنك أيضًا إضافة BlueBubbles عبر CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## التحكم في الوصول (الرسائل المباشرة + المجموعات)

<Tabs>
  <Tab title="DMs">
    - الافتراضي: `channels.bluebubbles.dmPolicy = "pairing"`.
    - يتلقى المرسلون غير المعروفين رمز اقتران؛ وتُتجاهل الرسائل حتى تتم الموافقة (تنتهي صلاحية الرموز بعد ساعة واحدة).
    - الموافقة عبر:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - الاقتران هو تبادل الرمز الافتراضي. التفاصيل: [الاقتران](/ar/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (الافتراضي: `allowlist`).
    - يتحكم `channels.bluebubbles.groupAllowFrom` في من يمكنه التشغيل داخل المجموعات عند تعيين `allowlist`.

  </Tab>
</Tabs>

### إثراء أسماء جهات الاتصال (macOS، اختياري)

غالبًا ما تتضمن Webhook المجموعات في BlueBubbles عناوين المشاركين الخام فقط. إذا أردت أن يعرض سياق `GroupMembers` أسماء جهات الاتصال المحلية بدلًا من ذلك، يمكنك الاشتراك في إثراء جهات الاتصال المحلية على macOS:

- يفعّل `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` البحث. الافتراضي: `false`.
- لا تعمل عمليات البحث إلا بعد أن يسمح الوصول إلى المجموعة، وتفويض الأوامر، وبوابة الذكر بمرور الرسالة.
- لا تُثرى إلا مشاركو الهاتف غير المسمّين.
- تبقى أرقام الهاتف الخام كخيار احتياطي عند عدم العثور على تطابق محلي.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### بوابة الذكر (المجموعات)

يدعم BlueBubbles بوابة الذكر لدردشات المجموعات، بما يطابق سلوك iMessage/WhatsApp:

- يستخدم `agents.list[].groupChat.mentionPatterns` (أو `messages.groupChat.mentionPatterns`) لاكتشاف الذكر.
- عندما يكون `requireMention` مفعّلًا لمجموعة، لا يرد الوكيل إلا عند ذكره.
- تتجاوز أوامر التحكم من المرسلين المخوّلين بوابة الذكر.

الإعداد لكل مجموعة:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // default for all groups
        "iMessage;-;chat123": { requireMention: false }, // override for specific group
      },
    },
  },
}
```

### بوابة الأوامر

- تتطلب أوامر التحكم (مثل `/config`, `/model`) تفويضًا.
- يستخدم `allowFrom` و`groupAllowFrom` لتحديد تفويض الأوامر.
- يمكن للمرسلين المخوّلين تشغيل أوامر التحكم حتى دون ذكر في المجموعات.

### موجّه النظام لكل مجموعة

يقبل كل إدخال ضمن `channels.bluebubbles.groups.*` سلسلة `systemPrompt` اختيارية. تُحقن القيمة في موجّه نظام الوكيل في كل دورة تتعامل مع رسالة في تلك المجموعة، بحيث يمكنك تعيين شخصية أو قواعد سلوكية لكل مجموعة دون تحرير موجّهات الوكيل:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Keep responses under 3 sentences. Mirror the group's casual tone.",
        },
      },
    },
  },
}
```

يطابق المفتاح أي قيمة يبلّغ عنها BlueBubbles باعتبارها `chatGuid` / `chatIdentifier` / `chatId` رقميًا للمجموعة، ويوفر إدخال البدل `"*"` افتراضيًا لكل مجموعة دون تطابق دقيق (النمط نفسه المستخدم بواسطة `requireMention` وسياسات الأدوات لكل مجموعة). تتغلب المطابقات الدقيقة دائمًا على البدل. تتجاهل الرسائل المباشرة هذا الحقل؛ استخدم تخصيص الموجّه على مستوى الوكيل أو الحساب بدلًا من ذلك.

#### مثال عملي: الردود المتسلسلة وتفاعلات tapback (واجهة API الخاصة)

عند تفعيل واجهة API الخاصة في BlueBubbles، تصل الرسائل الواردة بمعرّفات رسائل قصيرة (مثل `[[reply_to:5]]`) ويمكن للوكيل استدعاء `action=reply` للتسلسل داخل رسالة محددة أو `action=react` لإضافة tapback. تُعد `systemPrompt` لكل مجموعة طريقة موثوقة لإبقاء الوكيل يختار الأداة الصحيحة:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "When replying in this group, always call action=reply with the",
            "[[reply_to:N]] messageId from context so your response threads",
            "under the triggering message. Never send a new unlinked message.",
            "",
            "For short acknowledgements ('ok', 'got it', 'on it'), use",
            "action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓)",
            "instead of sending a text reply.",
          ].join(" "),
        },
      },
    },
  },
}
```

تتطلب تفاعلات tapback والردود المتسلسلة كلاهما واجهة API الخاصة في BlueBubbles؛ راجع [الإجراءات المتقدمة](#advanced-actions) و[معرّفات الرسائل](#message-ids-short-vs-full) للآليات الأساسية.

## ارتباطات محادثات ACP

يمكن تحويل دردشات BlueBubbles إلى مساحات عمل ACP دائمة دون تغيير طبقة النقل.

تدفق المشغّل السريع:

- شغّل `/acp spawn codex --bind here` داخل الرسالة المباشرة أو دردشة المجموعة المسموح بها.
- ستُوجّه الرسائل المستقبلية في محادثة BlueBubbles نفسها إلى جلسة ACP المُنشأة.
- يعيد `/new` و`/reset` ضبط جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الارتباط.

تُدعم أيضًا الارتباطات المستمرة المضبوطة من خلال إدخالات `bindings[]` في المستوى الأعلى مع `type: "acp"` و`match.channel: "bluebubbles"`.

يمكن أن يستخدم `match.peer.id` أي صيغة هدف BlueBubbles مدعومة:

- مقبض رسالة مباشرة مُطبّع مثل `+15555550123` أو `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

لارتباطات المجموعات المستقرة، فضّل `chat_id:*` أو `chat_identifier:*`.

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

راجع [وكلاء ACP](/ar/tools/acp-agents) لمعرفة سلوك ارتباط ACP المشترك.

## الكتابة + إيصالات القراءة

- **مؤشرات الكتابة**: تُرسل تلقائيًا قبل إنشاء الرد وأثناءه.
- **إيصالات القراءة**: يتحكم بها `channels.bluebubbles.sendReadReceipts` (الافتراضي: `true`).
- **مؤشرات الكتابة**: يرسل OpenClaw أحداث بدء الكتابة؛ ويمسح BlueBubbles الكتابة تلقائيًا عند الإرسال أو انتهاء المهلة (الإيقاف اليدوي عبر DELETE غير موثوق).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
    },
  },
}
```

## إجراءات متقدمة

يدعم BlueBubbles إجراءات رسائل متقدمة عند تفعيلها في الإعدادات:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (default: true)
        edit: true, // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true, // unsend messages (macOS 13+)
        reply: true, // reply threading by message GUID
        sendWithEffect: true, // message effects (slam, loud, etc.)
        renameGroup: true, // rename group chats
        setGroupIcon: true, // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true, // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true, // leave group chats
        sendAttachment: true, // send attachments/media
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="الإجراءات المتاحة">
    - **react**: إضافة/إزالة تفاعلات tapback (`messageId`, `emoji`, `remove`). مجموعة tapback الأصلية في iMessage هي `love` و`like` و`dislike` و`laugh` و`emphasize` و`question`. عندما يختار وكيل رمزًا تعبيريًا خارج تلك المجموعة (مثل `👀`)، تعود أداة التفاعل إلى `love` بحيث يستمر عرض tapback بدلًا من فشل الطلب كله. تظل تفاعلات الإقرار المكوّنة تتحقق بصرامة وتُرجع خطأ عند القيم غير المعروفة.
    - **edit**: تعديل رسالة مرسلة (`messageId`, `text`).
    - **unsend**: إلغاء إرسال رسالة (`messageId`).
    - **reply**: الرد على رسالة محددة (`messageId`, `text`, `to`).
    - **sendWithEffect**: الإرسال بتأثير iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: إعادة تسمية دردشة جماعية (`chatGuid`, `displayName`).
    - **setGroupIcon**: تعيين أيقونة/صورة دردشة جماعية (`chatGuid`, `media`) — غير مستقر على macOS 26 Tahoe (قد تُرجع API نجاحًا لكن الأيقونة لا تتزامن).
    - **addParticipant**: إضافة شخص إلى مجموعة (`chatGuid`, `address`).
    - **removeParticipant**: إزالة شخص من مجموعة (`chatGuid`, `address`).
    - **leaveGroup**: مغادرة دردشة جماعية (`chatGuid`).
    - **upload-file**: إرسال وسائط/ملفات (`to`, `buffer`, `filename`, `asVoice`).
      - المذكرات الصوتية: عيّن `asVoice: true` مع صوت **MP3** أو **CAF** للإرسال كرسالة صوتية في iMessage. يحوّل BlueBubbles ‏MP3 → CAF عند إرسال المذكرات الصوتية.
    - الاسم البديل القديم: لا يزال `sendAttachment` يعمل، لكن `upload-file` هو اسم الإجراء المعتمد.

  </Accordion>
</AccordionGroup>

### معرّفات الرسائل (قصيرة مقابل كاملة)

قد يعرض OpenClaw معرّفات رسائل _قصيرة_ (مثل `1`، `2`) لتوفير الرموز.

- يمكن أن تكون `MessageSid` / `ReplyToId` معرّفات قصيرة.
- تحتوي `MessageSidFull` / `ReplyToIdFull` على المعرّفات الكاملة للمزوّد.
- المعرّفات القصيرة موجودة في الذاكرة؛ وقد تنتهي صلاحيتها عند إعادة التشغيل أو إخلاء الذاكرة المؤقتة.
- تقبل الإجراءات `messageId` قصيرًا أو كاملًا، لكن المعرّفات القصيرة ستُرجع خطأ إذا لم تعد متاحة.

استخدم المعرّفات الكاملة للأتمتة والتخزين الدائمين:

- القوالب: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- السياق: `MessageSidFull` / `ReplyToIdFull` في الحمولات الواردة

راجع [الإعدادات](/ar/gateway/configuration) لمتغيرات القوالب.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## دمج الرسائل المباشرة المرسلة على دفعات منفصلة (أمر + عنوان URL في إنشاء واحد)

عندما يكتب المستخدم أمرًا وعنوان URL معًا في iMessage — مثل `Dump https://example.com/article` — يقسم Apple الإرسال إلى **تسليمين منفصلين عبر Webhook**:

1. رسالة نصية (`"Dump"`).
2. فقاعة معاينة عنوان URL (`"https://..."`) مع صور معاينة OG كمرفقات.

تصل عمليتا Webhook إلى OpenClaw بفاصل يقارب 0.8-2.0 ثانية في معظم الإعدادات. من دون الدمج، يتلقى الوكيل الأمر وحده في الدورة 1، ويرد (غالبًا "أرسل لي عنوان URL")، ولا يرى عنوان URL إلا في الدورة 2 — وعندها يكون سياق الأمر قد فُقد بالفعل.

يُدخل `channels.bluebubbles.coalesceSameSenderDms` الرسائل المباشرة في دمج Webhooks المتتالية من المرسل نفسه في دورة وكيل واحدة. تستمر الدردشات الجماعية في استخدام مفتاح لكل رسالة حتى تُحفظ بنية الدورات متعددة المستخدمين.

<Tabs>
  <Tab title="متى تُفعّله">
    فعّله عندما:

    - تشحن Skills تتوقع `command + payload` في رسالة واحدة (تفريغ، لصق، حفظ، إضافة إلى الطابور، إلخ).
    - يلصق المستخدمون عناوين URL أو صورًا أو محتوى طويلًا بجانب الأوامر.
    - يمكنك قبول تأخر دورة الرسائل المباشرة الإضافي (انظر أدناه).

    اتركه معطلًا عندما:

    - تحتاج إلى أقل زمن استجابة للأوامر لمحفزات الرسائل المباشرة ذات الكلمة الواحدة.
    - تكون كل تدفقاتك أوامر تنفيذ مرة واحدة من دون متابعات حمولة.

  </Tab>
  <Tab title="التفعيل">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    عند تفعيل العلم ومن دون `messages.inbound.byChannel.bluebubbles` صريح، تتسع نافذة إزالة الارتداد إلى **2500 ms** (الافتراضي عند عدم الدمج هو 500 ms). هذه النافذة الأوسع مطلوبة — لأن وتيرة الإرسال المنقسم من Apple، 0.8-2.0 ثانية، لا تناسب الافتراضي الأضيق.

    لضبط النافذة بنفسك:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is slow
            // or under memory pressure (observed gap can stretch past 2 s then).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="المفاضلات">
    - **زمن استجابة إضافي لأوامر التحكم في الرسائل المباشرة.** مع تفعيل العلم، تنتظر الآن رسائل أوامر التحكم في الرسائل المباشرة (مثل `Dump` و`Save` وما إلى ذلك) حتى نافذة إزالة الارتداد قبل الإرسال، تحسبًا لوصول Webhook حمولة. تحتفظ أوامر الدردشات الجماعية بالإرسال الفوري.
    - **المخرجات المدمجة محدودة** — النص المدمج محدود عند 4000 حرف مع علامة `…[truncated]` صريحة؛ والمرفقات محدودة عند 20؛ وإدخالات المصدر محدودة عند 10 (مع الاحتفاظ بالأول زائد الأحدث بعد ذلك). لا يزال كل `messageId` مصدر يصل إلى إزالة التكرار الواردة، لذلك يُتعرّف على إعادة تشغيل لاحقة من MessagePoller لأي حدث فردي كتكرار.
    - **تفعيل اختياري لكل قناة.** القنوات الأخرى (Telegram وWhatsApp وSlack و…) لا تتأثر.

  </Tab>
</Tabs>

### السيناريوهات وما يراه الوكيل

| ما ينشئه المستخدم                                                  | ما يسلّمه Apple            | العلم متوقف (افتراضي)                         | العلم مفعل + نافذة 2500 ms                                               |
| ------------------------------------------------------------------ | -------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| `Dump https://example.com` (إرسال واحد)                            | عمليتا Webhook بفاصل ~1 s  | دورتا وكيل: "Dump" وحده، ثم عنوان URL         | دورة واحدة: نص مدمج `Dump https://example.com`                           |
| `Save this 📎image.jpg caption` (مرفق + نص)                        | عمليتا Webhook             | دورتان                                        | دورة واحدة: نص + صورة                                                     |
| `/status` (أمر مستقل)                                              | Webhook واحد               | إرسال فوري                                    | **انتظار حتى النافذة، ثم الإرسال**                                        |
| عنوان URL ملصوق وحده                                               | Webhook واحد               | إرسال فوري                                    | إرسال فوري (إدخال واحد فقط في الحاوية)                                    |
| نص + عنوان URL مرسلان كرسالتين منفصلتين مقصودتين، بينهما دقائق    | عمليتا Webhook خارج النافذة | دورتان                                        | دورتان (تنتهي النافذة بينهما)                                             |
| تدفق سريع (>10 رسائل مباشرة صغيرة داخل النافذة)                   | N من Webhooks              | N من الدورات                                  | دورة واحدة، مخرجات محدودة (الأول + الأحدث، مع تطبيق حدود النص/المرفقات) |

### استكشاف أخطاء دمج الإرسال المنقسم وإصلاحها

إذا كان العلم مفعّلًا ولا تزال الرسائل المنقسمة تصل كدورتين، فتحقق من كل طبقة:

<AccordionGroup>
  <Accordion title="تم تحميل الإعدادات فعليًا">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    ثم `openclaw gateway restart` — يُقرأ العلم عند إنشاء سجل إزالة الارتداد.

  </Accordion>
  <Accordion title="نافذة إزالة الارتداد واسعة بما يكفي لإعدادك">
    انظر إلى سجل خادم BlueBubbles تحت `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    قِس الفجوة بين إرسال النص بنمط `"Dump"` وإرسال `"https://..."; Attachments:` الذي يليه. ارفع `messages.inbound.byChannel.bluebubbles` بحيث يغطي تلك الفجوة بهامش مريح.

  </Accordion>
  <Accordion title="طوابع JSONL الزمنية للجلسة ≠ وصول Webhook">
    تعكس طوابع أحداث الجلسة الزمنية (`~/.openclaw/agents/<id>/sessions/*.jsonl`) وقت تسليم Gateway رسالة إلى الوكيل، **وليس** وقت وصول Webhook. تعني رسالة ثانية في الطابور موسومة `[Queued messages while agent was busy]` أن الدورة الأولى كانت لا تزال قيد التشغيل عندما وصل Webhook الثاني — وكانت حاوية الدمج قد فُرغت بالفعل. اضبط النافذة وفق سجل خادم BB، لا سجل الجلسة.
  </Accordion>
  <Accordion title="ضغط الذاكرة يبطئ إرسال الرد">
    على الأجهزة الأصغر (8 GB)، قد تستغرق دورات الوكيل وقتًا كافيًا لتفريغ حاوية الدمج قبل اكتمال الرد، وينتهي عنوان URL كدورة ثانية في الطابور. تحقق من `memory_pressure` و`ps -o rss -p $(pgrep openclaw-gateway)`؛ إذا كان Gateway يتجاوز ~500 MB RSS وكان الضاغط نشطًا، فأغلق العمليات الثقيلة الأخرى أو انتقل إلى مضيف أكبر.
  </Accordion>
  <Accordion title="إرسال اقتباس الرد مسار مختلف">
    إذا نقر المستخدم على `Dump` كـ **رد** على فقاعة عنوان URL موجودة (يعرض iMessage شارة "1 Reply" على فقاعة Dump)، فإن عنوان URL يكون في `replyToBody`، وليس في Webhook ثانٍ. لا ينطبق الدمج — هذه مسألة Skill/موجه، وليست مسألة إزالة ارتداد.
  </Accordion>
</AccordionGroup>

## البث بالكتل

تحكم فيما إذا كانت الردود تُرسل كرسالة واحدة أو تُبث في كتل:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## الوسائط + الحدود

- تُنزّل المرفقات الواردة وتُخزّن في ذاكرة الوسائط المؤقتة.
- حد الوسائط عبر `channels.bluebubbles.mediaMaxMb` للوسائط الواردة والصادرة (الافتراضي: 8 MB).
- يُقسّم النص الصادر إلى `channels.bluebubbles.textChunkLimit` (الافتراضي: 4000 حرف).

## مرجع الإعدادات

الإعدادات الكاملة: [الإعدادات](/ar/gateway/configuration)

<AccordionGroup>
  <Accordion title="الاتصال وWebhook">
    - `channels.bluebubbles.enabled`: تفعيل/تعطيل القناة.
    - `channels.bluebubbles.serverUrl`: عنوان URL الأساسي لواجهة BlueBubbles REST API.
    - `channels.bluebubbles.password`: كلمة مرور API.
    - `channels.bluebubbles.webhookPath`: مسار نقطة نهاية Webhook (الافتراضي: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="سياسة الوصول">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: `pairing`).
    - `channels.bluebubbles.allowFrom`: قائمة سماح للرسائل المباشرة (معرّفات، رسائل بريد إلكتروني، أرقام E.164، `chat_id:*`، `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (الافتراضي: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: قائمة سماح مرسلي المجموعات.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: على macOS، إثراء مشاركي المجموعة غير المسمّين اختياريًا من جهات الاتصال المحلية بعد اجتياز البوابات. الافتراضي: `false`.
    - `channels.bluebubbles.groups`: إعدادات لكل مجموعة (`requireMention`، إلخ).

  </Accordion>
  <Accordion title="التسليم والتقسيم">
    - `channels.bluebubbles.sendReadReceipts`: إرسال إيصالات القراءة (الافتراضي: `true`).
    - `channels.bluebubbles.blockStreaming`: تفعيل البث الكتلي (الافتراضي: `false`؛ مطلوب للردود المتدفقة).
    - `channels.bluebubbles.textChunkLimit`: حجم الجزء الصادر بالأحرف (الافتراضي: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: مهلة كل طلب بالمللي ثانية لإرسال النصوص الصادرة عبر `/api/v1/message/text` (الافتراضي: 30000). ارفعها في إعدادات macOS 26 حيث يمكن أن تتوقف عمليات إرسال iMessage عبر واجهة API الخاصة لأكثر من 60 ثانية داخل إطار عمل iMessage؛ مثلًا `45000` أو `60000`. تحتفظ المجسات، وعمليات البحث في الدردشة، والتفاعلات، والتعديلات، وفحوصات السلامة حاليًا بالقيمة الافتراضية الأقصر وهي 10 ثوانٍ؛ ومن المخطط توسيع التغطية لتشمل التفاعلات والتعديلات كمتابعة. تجاوز لكل حساب: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: يقسم `length` (الافتراضي) فقط عند تجاوز `textChunkLimit`؛ بينما يقسم `newline` عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.

  </Accordion>
  <Accordion title="الوسائط والسجل">
    - `channels.bluebubbles.mediaMaxMb`: حد الوسائط الواردة/الصادرة بالميغابايت (الافتراضي: 8).
    - `channels.bluebubbles.mediaLocalRoots`: قائمة سماح صريحة للأدلة المحلية المطلقة المسموح بها لمسارات الوسائط المحلية الصادرة. تُرفض عمليات الإرسال عبر المسارات المحلية افتراضيًا ما لم يتم تكوين ذلك. تجاوز لكل حساب: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: دمج Webhookات DM المتتالية من المرسل نفسه في دورة وكيل واحدة بحيث يصل إرسال Apple المقسم بين نص+URL كرسالة واحدة (الافتراضي: `false`). راجع [دمج رسائل DM المقسمة](#coalescing-split-send-dms-command--url-in-one-composition) لمعرفة السيناريوهات وضبط النافذة والمفاضلات. يوسع نافذة إزالة الارتداد الافتراضية للوارد من 500 مللي ثانية إلى 2500 مللي ثانية عند تفعيله دون `messages.inbound.byChannel.bluebubbles` صريح.
    - `channels.bluebubbles.historyLimit`: الحد الأقصى لرسائل المجموعة للسياق (0 يعطل ذلك).
    - `channels.bluebubbles.dmHistoryLimit`: حد سجل DM.

  </Accordion>
  <Accordion title="الإجراءات والحسابات">
    - `channels.bluebubbles.actions`: تفعيل/تعطيل إجراءات محددة.
    - `channels.bluebubbles.accounts`: تكوين متعدد الحسابات.

  </Accordion>
</AccordionGroup>

الخيارات العامة ذات الصلة:

- `agents.list[].groupChat.mentionPatterns` (أو `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## العنونة / أهداف التسليم

فضّل `chat_guid` للتوجيه المستقر:

- `chat_guid:iMessage;-;+15555550123` (مفضل للمجموعات)
- `chat_id:123`
- `chat_identifier:...`
- المعالجات المباشرة: `+15555550123`، `user@example.com`
  - إذا لم يكن للمعالج المباشر دردشة DM موجودة، فسينشئ OpenClaw واحدة عبر `POST /api/v1/chat/new`. يتطلب ذلك تفعيل واجهة API الخاصة في BlueBubbles.

### توجيه iMessage مقابل SMS

عندما يكون للمعالج نفسه دردشة iMessage ودردشة SMS على Mac (على سبيل المثال رقم هاتف مسجل في iMessage لكنه تلقى أيضًا بدائل الفقاعات الخضراء)، يفضل OpenClaw دردشة iMessage ولا يخفضها بصمت إلى SMS أبدًا. لفرض دردشة SMS، استخدم بادئة هدف `sms:` صريحة (مثل `sms:+15555550123`). ما تزال المعالجات التي لا تطابق دردشة iMessage ترسل عبر أي دردشة يبلغ عنها BlueBubbles.

## الأمان

- تتم مصادقة طلبات Webhook بمقارنة معلمات أو ترويسات الاستعلام `guid`/`password` مع `channels.bluebubbles.password`.
- أبقِ كلمة مرور API ونقطة نهاية Webhook سريتين (عاملهما مثل بيانات الاعتماد).
- لا يوجد تجاوز للمضيف المحلي في مصادقة Webhook الخاصة بـ BlueBubbles. إذا كنت تمرر حركة Webhook عبر وكيل، فأبقِ كلمة مرور BlueBubbles على الطلب من طرف إلى طرف. لا يستبدل `gateway.trustedProxies` هنا `channels.bluebubbles.password`. راجع [أمان Gateway](/ar/gateway/security#reverse-proxy-configuration).
- فعّل HTTPS + قواعد جدار الحماية على خادم BlueBubbles إذا كنت تعرضه خارج شبكة LAN الخاصة بك.

## استكشاف الأخطاء وإصلاحها

- إذا توقفت أحداث الكتابة/القراءة عن العمل، فتحقق من سجلات Webhook في BlueBubbles وتأكد من أن مسار Gateway يطابق `channels.bluebubbles.webhookPath`.
- تنتهي صلاحية رموز الاقتران بعد ساعة واحدة؛ استخدم `openclaw pairing list bluebubbles` و`openclaw pairing approve bluebubbles <code>`.
- تتطلب التفاعلات واجهة API الخاصة في BlueBubbles (`POST /api/v1/message/react`)؛ تأكد من أن إصدار الخادم يوفرها.
- يتطلب التعديل/إلغاء الإرسال macOS 13+ وإصدارًا متوافقًا من خادم BlueBubbles. في macOS 26 (Tahoe)، التعديل معطل حاليًا بسبب تغييرات واجهة API الخاصة.
- قد تكون تحديثات أيقونة المجموعة غير مستقرة على macOS 26 (Tahoe): قد تُرجع API نجاحًا لكن الأيقونة الجديدة لا تتم مزامنتها.
- يخفي OpenClaw تلقائيًا الإجراءات المعروفة بأنها معطلة استنادًا إلى إصدار macOS الخاص بخادم BlueBubbles. إذا كان التعديل ما يزال يظهر على macOS 26 (Tahoe)، فعطله يدويًا باستخدام `channels.bluebubbles.actions.edit=false`.
- إذا كان `coalesceSameSenderDms` مفعّلًا لكن الإرسالات المقسمة (مثل `Dump` + URL) ما تزال تصل كدورتين: راجع قائمة [استكشاف أخطاء دمج الإرسال المقسم وإصلاحها](#split-send-coalescing-troubleshooting) — الأسباب الشائعة هي نافذة إزالة ارتداد ضيقة جدًا، أو قراءة طوابع وقت سجل الجلسة خطأً على أنها وصول Webhook، أو إرسال اقتباس رد (والذي يستخدم `replyToBody`، وليس Webhookًا ثانيًا).
- لمعلومات الحالة/السلامة: `openclaw status --all` أو `openclaw status --deep`.

للمرجع العام لسير عمل القنوات، راجع [القنوات](/ar/channels) ودليل [Plugins](/ar/tools/plugin).

## ذات صلة

- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وبوابة الإشارات
- [الاقتران](/ar/channels/pairing) — مصادقة DM وتدفق الاقتران
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
