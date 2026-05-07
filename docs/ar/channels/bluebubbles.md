---
read_when:
    - إعداد قناة BlueBubbles
    - استكشاف أخطاء اقتران Webhook وإصلاحها
    - إعداد iMessage على macOS
sidebarTitle: BlueBubbles
summary: دعم iMessage القديم عبر خادم BlueBubbles على macOS (إرسال/استقبال عبر REST، الكتابة، التفاعلات، الإقران، الإجراءات المتقدمة).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-07T01:50:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: e32b35242c7e751b49dcd8d839bc291c80cb4d88c0b4ce6f65635b7ef2ed97c3
    source_path: channels/bluebubbles.md
    workflow: 16
---

الحالة: Plugin قديم مضمّن يتواصل مع خادم BlueBubbles على macOS عبر HTTP. تستمر إعدادات BlueBubbles الحالية في العمل، لكن عمليات نشر OpenClaw iMessage الجديدة يجب أن تفضّل Plugin [iMessage](/ar/channels/imessage) الأصلي عندما تناسب متطلباته مضيفك.

<Warning>
تم إهمال BlueBubbles لإعدادات OpenClaw الجديدة.

لا يزال نظام BlueBubbles العلوي نشطًا، لكن OpenClaw يعتمد على واجهة API لخادم BlueBubbles على macOS. اعتبارًا من 6 مايو 2026، كان آخر تغيير على فرع التطوير الرسمي لـ [`bluebubbles-server`](https://github.com/BlueBubblesApp/bluebubbles-server) في [22 يناير 2026](https://github.com/BlueBubblesApp/bluebubbles-server/commit/88a4921bbd5a8111f1e9582b83715cf877171037)، ونُشر أحدث إصدار للخادم ([`v1.9.9`](https://github.com/BlueBubblesApp/bluebubbles-server/releases/tag/v1.9.9)) في 16 مايو 2025. توجد نشاطات أحدث في تطبيق العميل ومستودعات المساعدة، لذلك فهذا ليس ادعاءً بالتخلي؛ يتعلق الإهمال بتقليل اعتماد OpenClaw على خادم HTTP خارجي، وwebhooks، وسطح توافق واجهات API الخاصة عندما يحافظ مسار `imsg` الأصلي على التكامل ضمن عقد stdio محلي.
</Warning>

<Note>
تتضمن إصدارات OpenClaw الحالية BlueBubbles، لذلك لا تحتاج الحزم المبنية العادية إلى خطوة `openclaw plugins install` منفصلة.
</Note>

## نظرة عامة

- يعمل على macOS عبر تطبيق BlueBubbles المساعد ([bluebubbles.app](https://bluebubbles.app)).
- بديل قديم للمنشآت التي تعتمد بالفعل على معرّفات قناة BlueBubbles، أو حالة Webhook، أو أهداف المجموعات، أو تسليم cron، أو توجيه مساحة العمل.
- موصى به/مختبر: macOS Sequoia (15). يعمل macOS Tahoe (26)؛ التحرير معطّل حاليًا على Tahoe، وقد تُبلغ تحديثات أيقونة المجموعة عن النجاح لكنها لا تتزامن.
- يتواصل OpenClaw معه عبر REST API الخاصة به (`GET /api/v1/ping`، `POST /message/text`، `POST /chat/:id/*`).
- تصل الرسائل الواردة عبر webhooks؛ أما الردود الصادرة، ومؤشرات الكتابة، وإيصالات القراءة، وtapbacks فهي استدعاءات REST.
- تُستوعب المرفقات والملصقات كوسائط واردة (وتُعرض للوكيل عند الإمكان).
- تُسلَّم ردود Auto-TTS التي تُنشئ صوت MP3 أو CAF كفقاعات مذكرة صوتية في iMessage بدلًا من مرفقات ملفات عادية.
- تعمل الاقتران/قائمة السماح بالطريقة نفسها مثل القنوات الأخرى (`/channels/pairing` وما إلى ذلك) مع `channels.bluebubbles.allowFrom` + رموز الاقتران.
- تُعرض التفاعلات كأحداث نظام تمامًا مثل Slack/Telegram حتى يتمكن الوكلاء من "ذكرها" قبل الرد.
- الميزات المتقدمة: التحرير، إلغاء الإرسال، ترابط الردود، تأثيرات الرسائل، إدارة المجموعات.

## البدء السريع

<Steps>
  <Step title="Install BlueBubbles">
    ثبّت خادم BlueBubbles على جهاز Mac الخاص بك (اتبع التعليمات في [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Enable the web API">
    في إعدادات BlueBubbles، فعّل web API واضبط كلمة مرور.
  </Step>
  <Step title="Configure OpenClaw">
    شغّل `openclaw onboard` وحدد BlueBubbles، أو اضبطه يدويًا:

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
    وجّه webhooks الخاصة بـ BlueBubbles إلى Gateway لديك (مثال: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Start the gateway">
    ابدأ Gateway؛ سيسجّل معالج Webhook ويبدأ الاقتران.
  </Step>
</Steps>

<Warning>
**الأمان**

- اضبط دائمًا كلمة مرور Webhook.
- مصادقة Webhook مطلوبة دائمًا. يرفض OpenClaw طلبات Webhook من BlueBubbles ما لم تتضمن كلمة مرور/guid تطابق `channels.bluebubbles.password` (مثلًا `?password=<password>` أو `x-password`)، بغض النظر عن طوبولوجيا local loopback/الوكيل.
- تُفحص مصادقة كلمة المرور قبل قراءة/تحليل أجسام Webhook الكاملة.

</Warning>

## إبقاء Messages.app نشطًا (إعدادات VM / بلا واجهة)

قد تنتهي بعض إعدادات macOS VM / الدائمة التشغيل إلى دخول Messages.app في حالة "خمول" (تتوقف الأحداث الواردة حتى يُفتح التطبيق/يُجلب إلى المقدمة). الحل البسيط هو **تنبيه Messages كل 5 دقائق** باستخدام AppleScript + LaunchAgent.

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

يتوفر BlueBubbles في الإعداد الأولي التفاعلي:

```
openclaw onboard
```

يطالبك المعالج بما يلي:

<ParamField path="Server URL" type="string" required>
  عنوان خادم BlueBubbles (مثل `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  كلمة مرور API من إعدادات خادم BlueBubbles.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  مسار نقطة نهاية Webhook.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`، أو `allowlist`، أو `open`، أو `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  أرقام الهواتف، أو عناوين البريد الإلكتروني، أو أهداف الدردشة.
</ParamField>

يمكنك أيضًا إضافة BlueBubbles عبر CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## التحكم في الوصول (الرسائل المباشرة + المجموعات)

<Tabs>
  <Tab title="DMs">
    - الافتراضي: `channels.bluebubbles.dmPolicy = "pairing"`.
    - يتلقى المرسلون غير المعروفين رمز اقتران؛ ويتم تجاهل الرسائل حتى الموافقة (تنتهي صلاحية الرموز بعد ساعة واحدة).
    - الموافقة عبر:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - الاقتران هو تبادل الرمز الافتراضي. التفاصيل: [الاقتران](/ar/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (الافتراضي: `allowlist`).
    - يتحكم `channels.bluebubbles.groupAllowFrom` في من يمكنه التحفيز داخل المجموعات عند ضبط `allowlist`.

  </Tab>
</Tabs>

### إثراء أسماء جهات الاتصال (macOS، اختياري)

غالبًا ما تتضمن webhooks الخاصة بمجموعات BlueBubbles عناوين المشاركين الخام فقط. إذا كنت تريد أن يعرض سياق `GroupMembers` أسماء جهات الاتصال المحلية بدلًا من ذلك، فيمكنك الاشتراك في إثراء جهات الاتصال المحلية على macOS:

- يفعّل `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` البحث. الافتراضي: `false`.
- لا تعمل عمليات البحث إلا بعد أن تسمح صلاحية الوصول إلى المجموعة، وتفويض الأوامر، وبوابة الذكر بمرور الرسالة.
- يُثري المشاركون ذوو أرقام الهاتف غير المسماة فقط.
- تبقى أرقام الهاتف الخام كبديل احتياطي عند عدم العثور على تطابق محلي.

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

- يستخدم `agents.list[].groupChat.mentionPatterns` (أو `messages.groupChat.mentionPatterns`) لاكتشاف الإشارات.
- عند تفعيل `requireMention` لمجموعة، لا يرد الوكيل إلا عند ذكره.
- تتجاوز أوامر التحكم من المرسلين المصرح لهم بوابة الذكر.

إعداد كل مجموعة:

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

- تتطلب أوامر التحكم (مثل `/config` و`/model`) تفويضًا.
- يستخدم `allowFrom` و`groupAllowFrom` لتحديد تفويض الأوامر.
- يمكن للمرسلين المصرح لهم تشغيل أوامر التحكم حتى من دون ذكر في المجموعات.

### موجّه النظام لكل مجموعة

يقبل كل إدخال ضمن `channels.bluebubbles.groups.*` سلسلة `systemPrompt` اختيارية. تُحقن القيمة في موجّه نظام الوكيل في كل دورة تتعامل مع رسالة في تلك المجموعة، بحيث يمكنك ضبط شخصية أو قواعد سلوكية لكل مجموعة من دون تعديل موجّهات الوكيل:

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

يطابق المفتاح ما يبلّغ عنه BlueBubbles كـ `chatGuid` / `chatIdentifier` / `chatId` رقمي للمجموعة، ويوفر إدخال حرف البدل `"*"` إعدادًا افتراضيًا لكل مجموعة من دون تطابق دقيق (النمط نفسه المستخدم بواسطة `requireMention` وسياسات الأدوات لكل مجموعة). تنتصر المطابقات الدقيقة دائمًا على حرف البدل. تتجاهل الرسائل المباشرة هذا الحقل؛ استخدم تخصيص الموجّه على مستوى الوكيل أو الحساب بدلًا من ذلك.

#### مثال عملي: الردود المترابطة وتفاعلات tapback (API خاصة)

مع تفعيل API الخاصة في BlueBubbles، تصل الرسائل الواردة مع معرّفات رسائل قصيرة (مثل `[[reply_to:5]]`) ويمكن للوكيل استدعاء `action=reply` للترابط مع رسالة محددة أو `action=react` لإسقاط tapback. تُعد `systemPrompt` لكل مجموعة طريقة موثوقة لإبقاء الوكيل يختار الأداة الصحيحة:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: "When replying in this group, always call action=reply with the [[reply_to:N]] messageId from context so your response threads under the triggering message. Never send a new unlinked message. For short acknowledgements ('ok', 'got it', 'on it'), use action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓) instead of sending a text reply.",
        },
      },
    },
  },
}
```

تتطلب كل من تفاعلات tapback والردود المترابطة API الخاصة في BlueBubbles؛ راجع [الإجراءات المتقدمة](#advanced-actions) و[معرّفات الرسائل](#message-ids-short-vs-full) للآليات الأساسية.

## ارتباطات محادثات ACP

يمكن تحويل دردشات BlueBubbles إلى مساحات عمل ACP مستمرة من دون تغيير طبقة النقل.

تدفق المشغّل السريع:

- شغّل `/acp spawn codex --bind here` داخل الرسالة المباشرة أو دردشة المجموعة المسموح بها.
- تُوجّه الرسائل المستقبلية في محادثة BlueBubbles نفسها إلى جلسة ACP المنشأة.
- يعيد `/new` و`/reset` ضبط جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الارتباط.

تُدعم أيضًا الارتباطات المستمرة المضبوطة عبر إدخالات `bindings[]` في المستوى الأعلى مع `type: "acp"` و`match.channel: "bluebubbles"`.

يمكن لـ `match.peer.id` استخدام أي صيغة هدف BlueBubbles مدعومة:

- معرّف DM مُطبّع مثل `+15555550123` أو `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

لربط المجموعات بشكل مستقر، فضّل `chat_id:*` أو `chat_identifier:*`.

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

راجع [وكلاء ACP](/ar/tools/acp-agents) لمعرفة سلوك ربط ACP المشترك.

## مؤشرات الكتابة + إيصالات القراءة

- **مؤشرات الكتابة**: تُرسل تلقائيًا قبل إنشاء الرد وأثناءه.
- **إيصالات القراءة**: يتحكم بها `channels.bluebubbles.sendReadReceipts` (الافتراضي: `true`).
- **مؤشرات الكتابة**: يرسل OpenClaw أحداث بدء الكتابة؛ ويمسح BlueBubbles حالة الكتابة تلقائيًا عند الإرسال أو انتهاء المهلة (الإيقاف اليدوي عبر DELETE غير موثوق).

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
  <Accordion title="Available actions">
    - **react**: إضافة/إزالة تفاعلات tapback (`messageId`، `emoji`، `remove`). مجموعة tapback الأصلية في iMessage هي `love` و`like` و`dislike` و`laugh` و`emphasize` و`question`. عندما يختار الوكيل رمزًا تعبيريًا خارج تلك المجموعة (مثل `👀`)، تعود أداة التفاعل إلى `love` بحيث يظل tapback يظهر بدلًا من فشل الطلب بالكامل. تظل تفاعلات الإقرار المكوّنة تتحقق بصرامة وتُرجع خطأ عند القيم غير المعروفة.
    - **edit**: تحرير رسالة مُرسلة (`messageId`، `text`).
    - **unsend**: إلغاء إرسال رسالة (`messageId`).
    - **reply**: الرد على رسالة محددة (`messageId`، `text`، `to`).
    - **sendWithEffect**: الإرسال مع تأثير iMessage (`text`، `to`، `effectId`).
    - **renameGroup**: إعادة تسمية دردشة جماعية (`chatGuid`، `displayName`).
    - **setGroupIcon**: تعيين أيقونة/صورة دردشة جماعية (`chatGuid`، `media`) - غير مستقر على macOS 26 Tahoe (قد تُرجع API نجاحًا لكن الأيقونة لا تتزامن).
    - **addParticipant**: إضافة شخص إلى مجموعة (`chatGuid`، `address`).
    - **removeParticipant**: إزالة شخص من مجموعة (`chatGuid`، `address`).
    - **leaveGroup**: مغادرة دردشة جماعية (`chatGuid`).
    - **upload-file**: إرسال وسائط/ملفات (`to`، `buffer`، `filename`، `asVoice`).
      - المذكرات الصوتية: عيّن `asVoice: true` مع صوت **MP3** أو **CAF** للإرسال كرسالة صوتية في iMessage. يحوّل BlueBubbles ‏MP3 → CAF عند إرسال المذكرات الصوتية.
    - الاسم المستعار القديم: لا يزال `sendAttachment` يعمل، لكن `upload-file` هو اسم الإجراء القياسي.

  </Accordion>
</AccordionGroup>

### معرّفات الرسائل (قصيرة مقابل كاملة)

قد يعرض OpenClaw معرّفات رسائل _قصيرة_ (مثل `1` و`2`) لتوفير الرموز.

- يمكن أن تكون `MessageSid` / `ReplyToId` معرّفات قصيرة.
- تحتوي `MessageSidFull` / `ReplyToIdFull` على المعرّفات الكاملة للمزوّد.
- المعرّفات القصيرة موجودة في الذاكرة؛ وقد تنتهي صلاحيتها عند إعادة التشغيل أو إخلاء ذاكرة التخزين المؤقت.
- تقبل الإجراءات `messageId` قصيرًا أو كاملًا، لكن المعرّفات القصيرة ستُرجع خطأ إذا لم تعد متاحة.

استخدم المعرّفات الكاملة للأتمتة والتخزين الدائمين:

- القوالب: `{{MessageSidFull}}`، `{{ReplyToIdFull}}`
- السياق: `MessageSidFull` / `ReplyToIdFull` في الحمولات الواردة

راجع [الإعدادات](/ar/gateway/configuration) لمتغيرات القوالب.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## دمج رسائل DM ذات الإرسال المقسّم (أمر + URL في إنشاء واحد)

عندما يكتب مستخدم أمرًا وURL معًا في iMessage - مثل `Dump https://example.com/article` - تقسم Apple الإرسال إلى **تسليمين منفصلين عبر Webhook**:

1. رسالة نصية (`"Dump"`).
2. فقاعة معاينة URL (`"https://..."`) مع صور معاينة OG كمرفقات.

يصل Webhookان إلى OpenClaw بفاصل يقارب 0.8-2.0 ثانية في معظم الإعدادات. بدون الدمج، يتلقى الوكيل الأمر وحده في الدور 1، ويرد (غالبًا "أرسل لي URL")، ولا يرى URL إلا في الدور 2 - وعندها يكون سياق الأمر قد فُقد بالفعل.

يُدخل `channels.bluebubbles.coalesceSameSenderDms` رسالة DM في دمج Webhooks المتتالية من المرسل نفسه في دور وكيل واحد. تستمر الدردشات الجماعية في استخدام مفتاح لكل رسالة للحفاظ على بنية الأدوار متعددة المستخدمين.

<Tabs>
  <Tab title="When to enable">
    فعّل عندما:

    - ترسل Skills تتوقع `command + payload` في رسالة واحدة (dump، paste، save، queue، إلخ).
    - يلصق مستخدموك عناوين URL أو صورًا أو محتوى طويلًا بجانب الأوامر.
    - يمكنك قبول زمن انتقال دور DM الإضافي (انظر أدناه).

    اتركه معطلًا عندما:

    - تحتاج إلى أقل زمن انتقال للأوامر لمحفزات DM ذات الكلمة الواحدة.
    - تكون كل تدفقاتك أوامر لمرة واحدة بدون متابعات حمولة.

  </Tab>
  <Tab title="Enabling">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    عند تشغيل العلامة وعدم وجود `messages.inbound.byChannel.bluebubbles` صريح، تتسع نافذة إزالة الاهتزاز إلى **2500 ms** (الافتراضي لعدم الدمج هو 500 ms). النافذة الأوسع مطلوبة - إيقاع الإرسال المقسّم من Apple البالغ 0.8-2.0 ثانية لا يناسب الافتراضي الأضيق.

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
  <Tab title="Trade-offs">
    - **زمن انتقال إضافي لأوامر التحكم في DM.** عند تشغيل العلامة، تنتظر رسائل أوامر التحكم في DM (مثل `Dump` و`Save` وما إلى ذلك) الآن حتى نافذة إزالة الاهتزاز قبل الإرسال، لاحتمال وصول Webhook حمولة. تحافظ أوامر الدردشة الجماعية على الإرسال الفوري.
    - **المخرجات المدمجة محدودة** - يُحدد النص المدمج عند 4000 حرف مع علامة `…[truncated]` صريحة؛ وتُحدد المرفقات عند 20؛ وتُحدد إدخالات المصدر عند 10 (مع الاحتفاظ بالأول والأحدث بعد ذلك). لا يزال كل `messageId` مصدر يصل إلى إزالة التكرار الوارد، لذا يُتعرّف على إعادة تشغيل لاحقة من MessagePoller لأي حدث فردي كتكرار.
    - **اختياري، لكل قناة.** القنوات الأخرى (Telegram وWhatsApp وSlack و…) غير متأثرة.

  </Tab>
</Tabs>

### السيناريوهات وما يراه الوكيل

| ما ينشئه المستخدم                                                   | ما تسلّمه Apple              | العلامة معطلة (افتراضي)                 | العلامة مفعلة + نافذة 2500 ms                                           |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (إرسال واحد)                             | 2 Webhooks بفاصل ~1 s      | دوران للوكيل: "Dump" وحده، ثم URL      | دور واحد: نص مدمج `Dump https://example.com`                            |
| `Save this 📎image.jpg caption` (مرفق + نص)                         | 2 Webhooks                | دوران                                  | دور واحد: نص + صورة                                                     |
| `/status` (أمر مستقل)                                               | 1 Webhook                 | إرسال فوري                              | **انتظار حتى النافذة، ثم إرسال**                                        |
| URL ملصق وحده                                                       | 1 Webhook                 | إرسال فوري                              | إرسال فوري (إدخال واحد فقط في الحاوية)                                  |
| نص + URL مُرسلان كرسالتين منفصلتين متعمدتين، بينهما دقائق          | 2 Webhooks خارج النافذة   | دوران                                  | دوران (تنتهي النافذة بينهما)                                            |
| تدفق سريع (>10 رسائل DM صغيرة داخل النافذة)                         | N Webhooks                | N أدوار                                | دور واحد، مخرجات محدودة (الأول + الأحدث، مع تطبيق حدود النص/المرفقات) |

### استكشاف أخطاء دمج الإرسال المقسّم وإصلاحها

إذا كانت العلامة مفعلة وما زالت الإرسالات المقسّمة تصل كدورين، فتحقق من كل طبقة:

<AccordionGroup>
  <Accordion title="Config actually loaded">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    ثم `openclaw gateway restart` - تُقرأ العلامة عند إنشاء سجل مزيل الاهتزاز.

  </Accordion>
  <Accordion title="Debounce window wide enough for your setup">
    انظر إلى سجل خادم BlueBubbles ضمن `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    قِس الفجوة بين إرسال النص بأسلوب `"Dump"` وإرسال `"https://..."; Attachments:` الذي يليه. ارفع `messages.inbound.byChannel.bluebubbles` ليغطي تلك الفجوة بشكل مريح.

  </Accordion>
  <Accordion title="Session JSONL timestamps ≠ webhook arrival">
    تعكس طوابع أحداث الجلسة الزمنية (`~/.openclaw/agents/<id>/sessions/*.jsonl`) وقت تسليم Gateway للرسالة إلى الوكيل، **وليس** وقت وصول Webhook. تعني الرسالة الثانية الموضوعة في قائمة الانتظار والموسومة `[Queued messages while agent was busy]` أن الدور الأول كان لا يزال قيد التشغيل عندما وصل Webhook الثاني - وكانت حاوية الدمج قد أُفرغت بالفعل. اضبط النافذة وفق سجل خادم BB، وليس سجل الجلسة.
  </Accordion>
  <Accordion title="Memory pressure slowing reply dispatch">
    على الأجهزة الأصغر (8 GB)، قد تستغرق أدوار الوكيل وقتًا طويلًا بما يكفي لتُفرغ حاوية الدمج قبل اكتمال الرد، ويصل URL كدور ثانٍ في قائمة الانتظار. تحقق من `memory_pressure` و`ps -o rss -p $(pgrep openclaw-gateway)`؛ إذا كان Gateway يتجاوز ~500 MB RSS وكان الضاغط نشطًا، فأغلق العمليات الثقيلة الأخرى أو انتقل إلى مضيف أكبر.
  </Accordion>
  <Accordion title="Reply-quote sends are a different path">
    إذا نقر المستخدم على `Dump` كـ **رد** على فقاعة URL موجودة (يعرض iMessage شارة "1 Reply" على فقاعة Dump)، فإن URL موجود في `replyToBody`، وليس في Webhook ثانٍ. لا ينطبق الدمج - فهذا شأن Skill/المطالبة، وليس شأن مزيل الاهتزاز.
  </Accordion>
</AccordionGroup>

## بث الكتل

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

- تُنزّل المرفقات الواردة وتُخزن في ذاكرة التخزين المؤقت للوسائط.
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
    - `channels.bluebubbles.allowFrom`: قائمة سماح للرسائل المباشرة (المعرّفات، رسائل البريد الإلكتروني، أرقام E.164، و`chat_id:*`، و`chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (الافتراضي: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: قائمة سماح لمرسلي المجموعات.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: على macOS، يمكنك اختيارياً إثراء المشاركين غير المسمّين في المجموعة من جهات الاتصال المحلية بعد اجتياز التحقق. الافتراضي: `false`.
    - `channels.bluebubbles.groups`: إعداد لكل مجموعة (`requireMention`، إلخ).

  </Accordion>
  <Accordion title="التسليم والتقسيم">
    - `channels.bluebubbles.sendReadReceipts`: إرسال إيصالات القراءة (الافتراضي: `true`).
    - `channels.bluebubbles.blockStreaming`: تفعيل بث الكتل (الافتراضي: `false`؛ مطلوب للردود المتدفقة).
    - `channels.bluebubbles.textChunkLimit`: حجم المقطع الصادر بعدد الأحرف (الافتراضي: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: مهلة كل طلب بالمللي ثانية لإرسال النصوص الصادرة عبر `/api/v1/message/text` (الافتراضي: 30000). ارفعها على إعدادات macOS 26 التي قد تتوقف فيها عمليات إرسال iMessage عبر Private API لمدة تتجاوز 60 ثانية داخل إطار عمل iMessage؛ على سبيل المثال `45000` أو `60000`. تبقي المجسّات، وعمليات البحث عن الدردشات، والتفاعلات، والتعديلات، وفحوصات الصحة حالياً على الافتراضي الأقصر البالغ 10 ثوانٍ؛ ومن المخطط توسيع التغطية لتشمل التفاعلات والتعديلات كمتابعة لاحقة. تجاوز لكل حساب: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (الافتراضي) يقسّم فقط عند تجاوز `textChunkLimit`؛ أما `newline` فيقسّم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.

  </Accordion>
  <Accordion title="الوسائط والسجل">
    - `channels.bluebubbles.mediaMaxMb`: حد الوسائط الواردة/الصادرة بالميغابايت (الافتراضي: 8).
    - `channels.bluebubbles.mediaLocalRoots`: قائمة سماح صريحة للأدلة المحلية المطلقة المسموح بها لمسارات الوسائط المحلية الصادرة. يتم رفض إرسال المسارات المحلية افتراضياً ما لم يتم تكوين هذا. تجاوز لكل حساب: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: دمج Webhook الرسائل المباشرة المتتالية من المرسل نفسه في دورة وكيل واحدة حتى يصل إرسال Apple المقسّم للنص+URL كرسالة واحدة (الافتراضي: `false`). راجع [دمج الرسائل المباشرة المقسّمة](#coalescing-split-send-dms-command--url-in-one-composition) للاطلاع على السيناريوهات وضبط النافذة والمفاضلات. يوسّع نافذة إزالة الارتداد الافتراضية للوارد من 500 مللي ثانية إلى 2500 مللي ثانية عند تفعيله بدون `messages.inbound.byChannel.bluebubbles` صريح.
    - `channels.bluebubbles.historyLimit`: الحد الأقصى لرسائل المجموعة للسياق (0 يعطّلها).
    - `channels.bluebubbles.dmHistoryLimit`: حد سجل الرسائل المباشرة.
    - `channels.bluebubbles.replyContextApiFallback`: عندما يصل رد وارد بدون `replyToBody`/`replyToSender` وتفشل ذاكرة التخزين المؤقت لسياق الرد داخل الذاكرة، اجلب الرسالة الأصلية من BlueBubbles HTTP API كخيار احتياطي بأفضل جهد (الافتراضي: `false`). مفيد لعمليات النشر متعددة النسخ التي تشترك في حساب BlueBubbles واحد، أو بعد إعادة تشغيل العملية، أو بعد إخلاء ذاكرة التخزين المؤقت طويلة العمر TTL/LRU. يخضع الجلب لحماية SSRF بالسياسة نفسها المطبقة على كل طلب عميل BlueBubbles آخر، ولا يرمي أخطاء أبداً، ويملأ ذاكرة التخزين المؤقت حتى تُستهلك الردود اللاحقة بكلفة موزعة. تجاوز لكل حساب: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. ينتشر إعداد مستوى القناة إلى الحسابات التي تحذف العلامة.

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
- المعرّفات المباشرة: `+15555550123`، `user@example.com`
  - إذا لم يكن لدى المعرّف المباشر دردشة رسائل مباشرة موجودة، فسينشئ OpenClaw واحدة عبر `POST /api/v1/chat/new`. يتطلب هذا تفعيل BlueBubbles Private API.

### توجيه iMessage مقابل SMS

عندما يكون للمعرّف نفسه دردشة iMessage ودردشة SMS على Mac (على سبيل المثال رقم هاتف مسجّل في iMessage لكنه تلقى أيضاً بدائل الفقاعة الخضراء)، يفضّل OpenClaw دردشة iMessage ولا يخفّض أبداً إلى SMS بصمت. لفرض دردشة SMS، استخدم بادئة هدف صريحة `sms:` (على سبيل المثال `sms:+15555550123`). تستمر المعرّفات التي لا تملك دردشة iMessage مطابقة في الإرسال عبر أي دردشة يبلّغ عنها BlueBubbles.

## الأمان

- تتم مصادقة طلبات Webhook بمقارنة معاملات الاستعلام أو الرؤوس `guid`/`password` مع `channels.bluebubbles.password`.
- أبقِ كلمة مرور API ونقطة نهاية Webhook سرّيتين (تعامل معهما كبيانات اعتماد).
- لا يوجد تجاوز للمضيف المحلي لمصادقة BlueBubbles Webhook. إذا كنت تمرّر حركة Webhook عبر وكيل، فأبقِ كلمة مرور BlueBubbles على الطلب من طرف إلى طرف. لا يحل `gateway.trustedProxies` محل `channels.bluebubbles.password` هنا. راجع [أمان Gateway](/ar/gateway/security#reverse-proxy-configuration).
- فعّل HTTPS + قواعد جدار الحماية على خادم BlueBubbles إذا كنت تعرضه خارج شبكتك المحلية.

## استكشاف الأخطاء وإصلاحها

- إذا توقفت أحداث الكتابة/القراءة عن العمل، فتحقق من سجلات BlueBubbles Webhook وتأكد من أن مسار Gateway يطابق `channels.bluebubbles.webhookPath`.
- تنتهي صلاحية رموز الاقتران بعد ساعة واحدة؛ استخدم `openclaw pairing list bluebubbles` و`openclaw pairing approve bluebubbles <code>`.
- تتطلب التفاعلات BlueBubbles private API (`POST /api/v1/message/react`)؛ تأكد من أن إصدار الخادم يوفّرها.
- يتطلب التعديل/إلغاء الإرسال macOS 13+ وإصدار خادم BlueBubbles متوافقاً. على macOS 26 (Tahoe)، التعديل معطل حالياً بسبب تغييرات private API.
- قد تكون تحديثات أيقونة المجموعة غير مستقرة على macOS 26 (Tahoe): قد تعيد API نجاحاً لكن الأيقونة الجديدة لا تتم مزامنتها.
- يخفي OpenClaw تلقائياً الإجراءات المعروفة بأنها معطلة بناءً على إصدار macOS في خادم BlueBubbles. إذا ظل التعديل ظاهراً على macOS 26 (Tahoe)، فعطّله يدوياً باستخدام `channels.bluebubbles.actions.edit=false`.
- تم تفعيل `coalesceSameSenderDms` لكن الإرسالات المقسّمة (مثل `Dump` + URL) ما زالت تصل كدورتين: راجع قائمة تحقق [استكشاف أخطاء دمج الإرسال المقسّم وإصلاحها](#split-send-coalescing-troubleshooting) - الأسباب الشائعة هي نافذة إزالة ارتداد ضيقة جداً، أو إساءة قراءة الطوابع الزمنية لسجل الجلسة كوقت وصول Webhook، أو إرسال اقتباس رد (الذي يستخدم `replyToBody`، وليس Webhook ثانياً).
- لمعلومات الحالة/الصحة: `openclaw status --all` أو `openclaw status --deep`.

للاطلاع على مرجع عام لسير عمل القنوات، راجع [القنوات](/ar/channels) ودليل [Plugins](/ar/tools/plugin).

## ذات صلة

- [توجيه القنوات](/ar/channels/channel-routing) - توجيه الجلسات للرسائل
- [نظرة عامة على القنوات](/ar/channels) - جميع القنوات المدعومة
- [المجموعات](/ar/channels/groups) - سلوك دردشة المجموعة والتحقق من الإشارات
- [الاقتران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الاقتران
- [الأمان](/ar/gateway/security) - نموذج الوصول والتقوية
