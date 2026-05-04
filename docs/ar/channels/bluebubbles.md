---
read_when:
    - إعداد قناة BlueBubbles
    - استكشاف أخطاء اقتران Webhook وإصلاحها
    - إعداد iMessage على macOS
sidebarTitle: BlueBubbles
summary: iMessage عبر خادم BlueBubbles على macOS (الإرسال/الاستقبال عبر REST، الكتابة، التفاعلات، الاقتران، الإجراءات المتقدمة).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-04T02:21:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78a054da0c7c32b161997acd05914896259dd1a050e736a4c9e438a452ab6a51
    source_path: channels/bluebubbles.md
    workflow: 16
---

الحالة: Plugin مضمّن يتواصل مع خادم BlueBubbles على macOS عبر HTTP. **موصى به لتكامل iMessage** بسبب واجهة API الأغنى وسهولة الإعداد مقارنة بقناة imsg القديمة.

<Note>
تضمّن إصدارات OpenClaw الحالية BlueBubbles، لذلك لا تحتاج البنى المعبأة العادية إلى خطوة `openclaw plugins install` منفصلة.
</Note>

## نظرة عامة

- يعمل على macOS عبر تطبيق BlueBubbles المساعد ([bluebubbles.app](https://bluebubbles.app)).
- موصى به/مختبر: macOS Sequoia (15). يعمل macOS Tahoe (26)؛ التحرير معطل حاليا على Tahoe، وقد تبلغ تحديثات أيقونة المجموعة عن النجاح لكنها لا تتم مزامنتها.
- يتواصل OpenClaw معه عبر REST API الخاصة به (`GET /api/v1/ping`، `POST /message/text`، `POST /chat/:id/*`).
- تصل الرسائل الواردة عبر Webhook؛ أما الردود الصادرة ومؤشرات الكتابة وإيصالات القراءة وtapbacks فهي استدعاءات REST.
- تُستوعب المرفقات والملصقات كوسائط واردة (وتُعرض على الوكيل عندما يكون ذلك ممكنا).
- تُسلّم ردود Auto-TTS التي تنشئ صوت MP3 أو CAF كفقاعات مذكرة صوتية في iMessage بدلا من مرفقات ملفات عادية.
- يعمل الاقتران/قائمة السماح بالطريقة نفسها مثل القنوات الأخرى (`/channels/pairing` وما إلى ذلك) مع `channels.bluebubbles.allowFrom` + رموز الاقتران.
- تُعرض التفاعلات كأحداث نظام تماما مثل Slack/Telegram لكي يتمكن الوكلاء من "ذكرها" قبل الرد.
- ميزات متقدمة: التحرير، إلغاء الإرسال، تسلسل الردود، تأثيرات الرسائل، إدارة المجموعات.

## البدء السريع

<Steps>
  <Step title="Install BlueBubbles">
    ثبّت خادم BlueBubbles على جهاز Mac الخاص بك (اتبع التعليمات في [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Enable the web API">
    في إعدادات BlueBubbles، فعّل web API واضبط كلمة مرور.
  </Step>
  <Step title="Configure OpenClaw">
    شغّل `openclaw onboard` واختر BlueBubbles، أو اضبطه يدويا:

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
    وجّه Webhook الخاصة بـ BlueBubbles إلى Gateway لديك (مثال: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Start the gateway">
    ابدأ Gateway؛ سيسجّل معالج Webhook ويبدأ الاقتران.
  </Step>
</Steps>

<Warning>
**الأمان**

- اضبط دائما كلمة مرور Webhook.
- مصادقة Webhook مطلوبة دائما. يرفض OpenClaw طلبات Webhook من BlueBubbles ما لم تتضمن كلمة مرور/guid تطابق `channels.bluebubbles.password` (على سبيل المثال `?password=<password>` أو `x-password`)، بغض النظر عن بنية local loopback/الوكيل.
- يتم التحقق من مصادقة كلمة المرور قبل قراءة/تحليل أجسام Webhook الكاملة.

</Warning>

## إبقاء Messages.app نشطا (إعدادات VM / دون واجهة)

قد تنتهي بعض إعدادات VM على macOS / الدائمة التشغيل إلى جعل Messages.app في حالة "خمول" (تتوقف الأحداث الواردة حتى يتم فتح التطبيق/إحضاره إلى المقدمة). حل بسيط هو **تنبيه Messages كل 5 دقائق** باستخدام AppleScript + LaunchAgent.

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

## التهيئة الأولية

يتوفر BlueBubbles في التهيئة الأولية التفاعلية:

```
openclaw onboard
```

يطالبك المعالج بما يلي:

<ParamField path="Server URL" type="string" required>
  عنوان خادم BlueBubbles (مثلا، `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  كلمة مرور API من إعدادات BlueBubbles Server.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  مسار نقطة نهاية Webhook.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing` أو `allowlist` أو `open` أو `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  أرقام الهاتف أو عناوين البريد الإلكتروني أو أهداف الدردشة.
</ParamField>

يمكنك أيضا إضافة BlueBubbles عبر CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## التحكم في الوصول (الرسائل المباشرة + المجموعات)

<Tabs>
  <Tab title="DMs">
    - الافتراضي: `channels.bluebubbles.dmPolicy = "pairing"`.
    - يتلقى المرسلون المجهولون رمز اقتران؛ ويتم تجاهل الرسائل حتى تتم الموافقة (تنتهي صلاحية الرموز بعد ساعة واحدة).
    - الموافقة عبر:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - الاقتران هو تبادل الرمز الافتراضي. التفاصيل: [الاقتران](/ar/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (الافتراضي: `allowlist`).
    - يتحكم `channels.bluebubbles.groupAllowFrom` في من يمكنه التحفيز في المجموعات عندما يكون `allowlist` مضبوطا.

  </Tab>
</Tabs>

### إثراء أسماء جهات الاتصال (macOS، اختياري)

غالبا ما تتضمن Webhook الخاصة بمجموعات BlueBubbles عناوين المشاركين الخام فقط. إذا أردت أن يعرض سياق `GroupMembers` أسماء جهات الاتصال المحلية بدلا من ذلك، يمكنك الاشتراك في إثراء Contacts المحلي على macOS:

- يفعّل `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` البحث. الافتراضي: `false`.
- لا تعمل عمليات البحث إلا بعد أن يسمح وصول المجموعة وتفويض الأوامر وبوابة الذكر بمرور الرسالة.
- يتم إثراء المشاركين عبر الهاتف الذين لا يحملون أسماء فقط.
- تبقى أرقام الهاتف الخام كبديل عند عدم العثور على تطابق محلي.

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
- عندما يتم تفعيل `requireMention` لمجموعة، لا يستجيب الوكيل إلا عند ذكره.
- تتجاوز أوامر التحكم من المرسلين المخولين بوابة الذكر.

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

- تتطلب أوامر التحكم (مثلا، `/config`، `/model`) التفويض.
- يستخدم `allowFrom` و`groupAllowFrom` لتحديد تفويض الأوامر.
- يمكن للمرسلين المخولين تشغيل أوامر التحكم حتى دون ذكر في المجموعات.

### موجّه النظام لكل مجموعة

يقبل كل إدخال ضمن `channels.bluebubbles.groups.*` سلسلة `systemPrompt` اختيارية. تُحقن القيمة في موجّه نظام الوكيل في كل دورة تتعامل مع رسالة في تلك المجموعة، بحيث يمكنك ضبط شخصية أو قواعد سلوك لكل مجموعة دون تعديل موجّهات الوكيل:

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

يطابق المفتاح أيا كان ما يبلّغ عنه BlueBubbles كـ `chatGuid` / `chatIdentifier` / `chatId` رقمي للمجموعة، ويوفر إدخال البدل `"*"` قيمة افتراضية لكل مجموعة دون تطابق دقيق (النمط نفسه المستخدم بواسطة `requireMention` وسياسات الأدوات لكل مجموعة). تتغلب المطابقات الدقيقة دائما على البدل. تتجاهل الرسائل المباشرة هذا الحقل؛ استخدم تخصيص الموجّه على مستوى الوكيل أو الحساب بدلا من ذلك.

#### مثال عملي: الردود المتسلسلة وتفاعلات tapback (Private API)

مع تفعيل BlueBubbles Private API، تصل الرسائل الواردة بمعرّفات رسائل قصيرة (على سبيل المثال `[[reply_to:5]]`) ويمكن للوكيل استدعاء `action=reply` لإدراج رد ضمن رسالة محددة أو `action=react` لإضافة tapback. تعد `systemPrompt` لكل مجموعة طريقة موثوقة لإبقاء الوكيل يختار الأداة الصحيحة:

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

تتطلب كل من تفاعلات tapback والردود المتسلسلة BlueBubbles Private API؛ راجع [الإجراءات المتقدمة](#advanced-actions) و[معرّفات الرسائل](#message-ids-short-vs-full) لمعرفة الآليات الأساسية.

## روابط محادثات ACP

يمكن تحويل دردشات BlueBubbles إلى مساحات عمل ACP دائمة دون تغيير طبقة النقل.

تدفق سريع للمشغل:

- شغّل `/acp spawn codex --bind here` داخل الرسالة المباشرة أو دردشة المجموعة المسموح بها.
- تُوجّه الرسائل المستقبلية في محادثة BlueBubbles نفسها إلى جلسة ACP المنشأة.
- يعيد `/new` و`/reset` ضبط جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الرابط.

تُدعم الروابط الدائمة المضبوطة أيضا عبر إدخالات `bindings[]` في المستوى الأعلى مع `type: "acp"` و`match.channel: "bluebubbles"`.

يمكن أن يستخدم `match.peer.id` أي صيغة هدف مدعومة في BlueBubbles:

- معرّف DM مطبّع مثل `+15555550123` أو `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

لروابط المجموعات المستقرة، فضّل `chat_id:*` أو `chat_identifier:*`.

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

راجع [وكلاء ACP](/ar/tools/acp-agents) لسلوك ربط ACP المشترك.

## الكتابة + إيصالات القراءة

- **مؤشرات الكتابة**: تُرسل تلقائيا قبل وأثناء إنشاء الرد.
- **إيصالات القراءة**: يتحكم بها `channels.bluebubbles.sendReadReceipts` (الافتراضي: `true`).
- **مؤشرات الكتابة**: يرسل OpenClaw أحداث بدء الكتابة؛ يمسح BlueBubbles الكتابة تلقائيا عند الإرسال أو انتهاء المهلة (الإيقاف اليدوي عبر DELETE غير موثوق).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
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
    - **react**: أضف/أزل تفاعلات tapback (`messageId`، `emoji`، `remove`). مجموعة tapback الأصلية في iMessage هي `love` و`like` و`dislike` و`laugh` و`emphasize` و`question`. عندما يختار الوكيل رمزًا تعبيريًا خارج هذه المجموعة (مثل `👀`)، تعود أداة التفاعل إلى `love` بحيث يظل tapback معروضًا بدلًا من فشل الطلب بالكامل. تظل تفاعلات الإقرار المكوّنة تتحقق بصرامة وتعرض خطأ عند القيم غير المعروفة.
    - **edit**: عدّل رسالة مرسلة (`messageId`، `text`).
    - **unsend**: ألغِ إرسال رسالة (`messageId`).
    - **reply**: رد على رسالة محددة (`messageId`، `text`، `to`).
    - **sendWithEffect**: أرسل مع تأثير iMessage (`text`، `to`، `effectId`).
    - **renameGroup**: أعد تسمية محادثة جماعية (`chatGuid`، `displayName`).
    - **setGroupIcon**: عيّن أيقونة/صورة محادثة جماعية (`chatGuid`، `media`) — غير مستقر على macOS 26 Tahoe (قد تعيد API نجاحًا لكن الأيقونة لا تتزامن).
    - **addParticipant**: أضف شخصًا إلى مجموعة (`chatGuid`، `address`).
    - **removeParticipant**: أزل شخصًا من مجموعة (`chatGuid`، `address`).
    - **leaveGroup**: غادر محادثة جماعية (`chatGuid`).
    - **upload-file**: أرسل وسائط/ملفات (`to`، `buffer`، `filename`، `asVoice`).
      - المذكرات الصوتية: عيّن `asVoice: true` مع صوت **MP3** أو **CAF** للإرسال كرسالة صوتية في iMessage. يحوّل BlueBubbles ‏MP3 → CAF عند إرسال المذكرات الصوتية.
    - الاسم المستعار القديم: لا يزال `sendAttachment` يعمل، لكن `upload-file` هو اسم الإجراء المعتمد.

  </Accordion>
</AccordionGroup>

### معرّفات الرسائل (قصيرة أم كاملة)

قد يعرض OpenClaw معرّفات رسائل _قصيرة_ (مثل `1`، `2`) لتوفير الرموز.

- يمكن أن تكون `MessageSid` / `ReplyToId` معرّفات قصيرة.
- تحتوي `MessageSidFull` / `ReplyToIdFull` على المعرّفات الكاملة من المزوّد.
- المعرّفات القصيرة موجودة في الذاكرة؛ ويمكن أن تنتهي صلاحيتها عند إعادة التشغيل أو إخراجها من ذاكرة التخزين المؤقت.
- تقبل الإجراءات `messageId` قصيرًا أو كاملًا، لكن المعرّفات القصيرة ستعرض خطأ إذا لم تعد متاحة.

استخدم المعرّفات الكاملة للأتمتات والتخزين الدائمين:

- القوالب: `{{MessageSidFull}}`، `{{ReplyToIdFull}}`
- السياق: `MessageSidFull` / `ReplyToIdFull` في الحمولات الواردة

راجع [الإعدادات](/ar/gateway/configuration) لمتغيرات القوالب.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## دمج الرسائل المباشرة المقسّمة عند الإرسال (أمر + URL في تركيب واحد)

عندما يكتب مستخدم أمرًا وURL معًا في iMessage — مثل `Dump https://example.com/article` — تقسّم Apple الإرسال إلى **تسليمين منفصلين عبر Webhook**:

1. رسالة نصية (`"Dump"`).
2. فقاعة معاينة URL ‏(`"https://..."`) مع صور معاينة OG كمرفقات.

يصل Webhookان إلى OpenClaw بفاصل يقارب 0.8-2.0 ثانية في معظم الإعدادات. من دون الدمج، يتلقى الوكيل الأمر وحده في الجولة 1، ويرد (غالبًا "أرسل لي URL")، ولا يرى URL إلا في الجولة 2 — وعندها يكون سياق الأمر قد فُقد بالفعل.

يتيح `channels.bluebubbles.coalesceSameSenderDms` دمج Webhooks المتتابعة من المرسل نفسه في رسالة مباشرة ضمن جولة وكيل واحدة. تستمر المحادثات الجماعية في استخدام مفتاح لكل رسالة بحيث يُحافظ على بنية الجولات متعددة المستخدمين.

<Tabs>
  <Tab title="When to enable">
    فعّله عندما:

    - تشحن Skills تتوقع `command + payload` في رسالة واحدة (dump، paste، save، queue، وما إلى ذلك).
    - يلصق مستخدموك عناوين URL أو صورًا أو محتوى طويلًا إلى جانب الأوامر.
    - يمكنك قبول التأخير الإضافي في جولة الرسائل المباشرة (انظر أدناه).

    اتركه معطّلًا عندما:

    - تحتاج إلى أدنى زمن استجابة للأوامر لمشغلات الرسائل المباشرة ذات الكلمة الواحدة.
    - تكون كل تدفقاتك أوامر من خطوة واحدة من دون متابعات حمولة.

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

    عند تشغيل العلامة وعدم وجود `messages.inbound.byChannel.bluebubbles` صريح، تتسع نافذة debounce إلى **2500 ms** (الافتراضي لعدم الدمج هو 500 ms). النافذة الأوسع مطلوبة — إيقاع الإرسال المقسّم من Apple البالغ 0.8-2.0 ثانية لا يتناسب مع الافتراضي الأضيق.

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
    - **تأخير إضافي لأوامر التحكم في الرسائل المباشرة.** عند تشغيل العلامة، تنتظر رسائل أوامر التحكم في الرسائل المباشرة (مثل `Dump` و`Save` وما إلى ذلك) الآن حتى نافذة debounce قبل الإرسال، تحسبًا لوصول Webhook للحمولة. تحافظ أوامر المحادثات الجماعية على الإرسال الفوري.
    - **المخرجات المدمجة محدودة** — النص المدمج محدد عند 4000 حرف مع علامة `…[truncated]` صريحة؛ والمرفقات محددة عند 20؛ وإدخالات المصدر محددة عند 10 (يُحتفظ بالأول زائد الأحدث بعد ذلك). لا يزال كل `messageId` للمصدر يصل إلى إزالة التكرار الواردة بحيث يُعرَف أي تكرار لاحق من MessagePoller لأي حدث فردي كتكرار.
    - **اختياري، لكل قناة.** لا تتأثر القنوات الأخرى (Telegram وWhatsApp وSlack و…).

  </Tab>
</Tabs>

### السيناريوهات وما يراه الوكيل

| ما يؤلفه المستخدم                                                  | ما تسلمه Apple            | العلامة متوقفة (افتراضي)                | العلامة مشغلة + نافذة 2500 ms                                           |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (إرسال واحد)                            | 2 Webhooks بفاصل ~1 ثانية | جولتا وكيل: "Dump" وحدها، ثم URL        | جولة واحدة: نص مدمج `Dump https://example.com`                          |
| `Save this 📎image.jpg caption` (مرفق + نص)                        | 2 Webhooks                | جولتان                                 | جولة واحدة: نص + صورة                                                   |
| `/status` (أمر مستقل)                                              | 1 Webhook                 | إرسال فوري                              | **انتظر حتى النافذة، ثم أرسل**                                          |
| URL ملصوق وحده                                                     | 1 Webhook                 | إرسال فوري                              | إرسال فوري (إدخال واحد فقط في الحاوية)                                  |
| نص + URL أُرسلا كرسالتين منفصلتين عمدًا، بفاصل دقائق              | 2 Webhooks خارج النافذة   | جولتان                                 | جولتان (تنتهي النافذة بينهما)                                           |
| تدفق سريع (>10 رسائل مباشرة صغيرة داخل النافذة)                   | N Webhooks                | N جولات                                | جولة واحدة، مخرجات محدودة (الأول + الأحدث، مع تطبيق حدود النص/المرفقات) |

### استكشاف أخطاء دمج الإرسال المقسّم وإصلاحها

إذا كانت العلامة مشغلة ولا تزال الإرسالات المقسّمة تصل كجولتين، فتحقق من كل طبقة:

<AccordionGroup>
  <Accordion title="Config actually loaded">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    ثم `openclaw gateway restart` — تُقرأ العلامة عند إنشاء سجل debouncer.

  </Accordion>
  <Accordion title="Debounce window wide enough for your setup">
    انظر إلى سجل خادم BlueBubbles تحت `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    قِس الفجوة بين إرسال النص بنمط `"Dump"` وإرسال `"https://..."; Attachments:` الذي يليه. ارفع `messages.inbound.byChannel.bluebubbles` ليغطي تلك الفجوة بشكل مريح.

  </Accordion>
  <Accordion title="Session JSONL timestamps ≠ webhook arrival">
    تعكس طوابع وقت أحداث الجلسة (`~/.openclaw/agents/<id>/sessions/*.jsonl`) وقت تسليم Gateway رسالة إلى الوكيل، **وليس** وقت وصول Webhook. تعني الرسالة الثانية في الطابور والموسومة `[Queued messages while agent was busy]` أن الجولة الأولى كانت لا تزال قيد التشغيل عندما وصل Webhook الثاني — وكانت حاوية الدمج قد أُفرغت بالفعل. اضبط النافذة مقابل سجل خادم BB، وليس سجل الجلسة.
  </Accordion>
  <Accordion title="Memory pressure slowing reply dispatch">
    على الأجهزة الأصغر (8 GB)، يمكن أن تستغرق جولات الوكيل وقتًا كافيًا بحيث تُفرغ حاوية الدمج قبل اكتمال الرد، ويصل URL كجولة ثانية في الطابور. تحقق من `memory_pressure` و`ps -o rss -p $(pgrep openclaw-gateway)`؛ إذا كان Gateway فوق ~500 MB RSS وكان الضاغط نشطًا، فأغلق العمليات الثقيلة الأخرى أو انتقل إلى مضيف أكبر.
  </Accordion>
  <Accordion title="Reply-quote sends are a different path">
    إذا نقر المستخدم على `Dump` كـ **رد** على فقاعة URL موجودة (يعرض iMessage شارة "1 Reply" على فقاعة Dump)، فإن URL يعيش في `replyToBody`، وليس في Webhook ثانٍ. لا ينطبق الدمج — هذه مسألة skill/موجه، وليست مسألة debouncer.
  </Accordion>
</AccordionGroup>

## بث الكتل

تحكم في ما إذا كانت الردود تُرسل كرسالة واحدة أم تُبث في كتل:

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

- تُنزّل المرفقات الواردة وتُخزّن في ذاكرة التخزين المؤقت للوسائط.
- حد الوسائط عبر `channels.bluebubbles.mediaMaxMb` للوسائط الواردة والصادرة (افتراضيًا: 8 MB).
- يُقسّم النص الصادر إلى `channels.bluebubbles.textChunkLimit` (افتراضيًا: 4000 حرف).

## مرجع الإعدادات

الإعدادات الكاملة: [الإعدادات](/ar/gateway/configuration)

<AccordionGroup>
  <Accordion title="Connection and webhook">
    - `channels.bluebubbles.enabled`: تمكين/تعطيل القناة.
    - `channels.bluebubbles.serverUrl`: عنوان URL الأساسي لـ REST API في BlueBubbles.
    - `channels.bluebubbles.password`: كلمة مرور API.
    - `channels.bluebubbles.webhookPath`: مسار نقطة نهاية Webhook (افتراضيًا: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Access policy">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (افتراضيًا: `pairing`).
    - `channels.bluebubbles.allowFrom`: قائمة سماح الرسائل المباشرة (المعرّفات، رسائل البريد الإلكتروني، أرقام E.164، `chat_id:*`، `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (افتراضيًا: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: قائمة سماح مرسلي المجموعة.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: على macOS، إثراء اختياري للمشاركين غير المسمّين في المجموعة من جهات الاتصال المحلية بعد اجتياز البوابات. الافتراضي: `false`.
    - `channels.bluebubbles.groups`: إعداد لكل مجموعة (`requireMention`، وما إلى ذلك).

  </Accordion>
  <Accordion title="التسليم والتقسيم">
    - `channels.bluebubbles.sendReadReceipts`: إرسال إيصالات القراءة (الافتراضي: `true`).
    - `channels.bluebubbles.blockStreaming`: تفعيل البث الكتلي (الافتراضي: `false`؛ مطلوب للردود المتدفقة).
    - `channels.bluebubbles.textChunkLimit`: حجم الجزء الصادر بالأحرف (الافتراضي: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: مهلة كل طلب بالمللي ثانية لإرسال النصوص الصادرة عبر `/api/v1/message/text` (الافتراضي: 30000). ارفعها في إعدادات macOS 26 حيث يمكن أن تتوقف عمليات إرسال iMessage عبر Private API لأكثر من 60 ثانية داخل إطار عمل iMessage؛ على سبيل المثال `45000` أو `60000`. تحتفظ المجسات وعمليات البحث في الدردشة والتفاعلات والتعديلات وفحوصات السلامة حاليًا بالمهلة الافتراضية الأقصر وهي 10 ثوانٍ؛ ومن المخطط توسيع التغطية لتشمل التفاعلات والتعديلات كمتابعة. تجاوز لكل حساب: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: يقسّم `length` (الافتراضي) فقط عند تجاوز `textChunkLimit`؛ ويقسّم `newline` عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.

  </Accordion>
  <Accordion title="الوسائط والسجل">
    - `channels.bluebubbles.mediaMaxMb`: حد الوسائط الواردة/الصادرة بالميغابايت (الافتراضي: 8).
    - `channels.bluebubbles.mediaLocalRoots`: قائمة سماح صريحة بالأدلة المحلية المطلقة المسموح بها لمسارات الوسائط المحلية الصادرة. تُرفض عمليات الإرسال عبر المسارات المحلية افتراضيًا ما لم يُضبط هذا الخيار. تجاوز لكل حساب: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: دمج Webhook رسائل DM المتتالية من المرسل نفسه في دورة وكيل واحدة حتى يصل إرسال Apple المقسّم إلى نص+عنوان URL كرسالة واحدة (الافتراضي: `false`). راجع [دمج رسائل DM المقسّمة الإرسال](#coalescing-split-send-dms-command--url-in-one-composition) لمعرفة السيناريوهات وضبط النافذة والمفاضلات. يوسّع نافذة إزالة الارتداد الافتراضية للوارد من 500 مللي ثانية إلى 2500 مللي ثانية عند تفعيله دون `messages.inbound.byChannel.bluebubbles` صريح.
    - `channels.bluebubbles.historyLimit`: الحد الأقصى لرسائل المجموعة للسياق (0 يعطّلها).
    - `channels.bluebubbles.dmHistoryLimit`: حد سجل رسائل DM.
    - `channels.bluebubbles.replyContextApiFallback`: عند وصول رد وارد دون `replyToBody`/`replyToSender` وفشل العثور في ذاكرة التخزين المؤقت لسياق الرد في الذاكرة، اجلب الرسالة الأصلية من BlueBubbles HTTP API كخيار احتياطي بأفضل جهد (الافتراضي: `false`). مفيد لعمليات النشر متعددة المثيلات التي تشارك حساب BlueBubbles واحدًا، أو بعد إعادة تشغيل العملية، أو بعد إخلاء ذاكرة التخزين المؤقت طويلة العمر TTL/LRU. الجلب محمي من SSRF بالسياسة نفسها مثل كل طلب عميل BlueBubbles آخر، ولا يرمي استثناءات أبدًا، ويملأ ذاكرة التخزين المؤقت حتى تُستهلك الردود اللاحقة بكلفة موزعة. تجاوز لكل حساب: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. ينتشر إعداد مستوى القناة إلى الحسابات التي تحذف العلامة.

  </Accordion>
  <Accordion title="الإجراءات والحسابات">
    - `channels.bluebubbles.actions`: تفعيل/تعطيل إجراءات محددة.
    - `channels.bluebubbles.accounts`: إعداد متعدد الحسابات.

  </Accordion>
</AccordionGroup>

الخيارات العامة ذات الصلة:

- `agents.list[].groupChat.mentionPatterns` (أو `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## عناوين / أهداف التسليم

فضّل `chat_guid` للتوجيه المستقر:

- `chat_guid:iMessage;-;+15555550123` (مفضّل للمجموعات)
- `chat_id:123`
- `chat_identifier:...`
- المعالجات المباشرة: `+15555550123`، `user@example.com`
  - إذا لم يكن للمعالج المباشر دردشة DM موجودة، فسينشئ OpenClaw واحدة عبر `POST /api/v1/chat/new`. يتطلب هذا تفعيل BlueBubbles Private API.

### توجيه iMessage مقابل SMS

عندما يكون للمعالج نفسه دردشة iMessage ودردشة SMS على Mac (على سبيل المثال رقم هاتف مسجل في iMessage لكنه تلقى أيضًا رسائل احتياطية ذات فقاعات خضراء)، يفضّل OpenClaw دردشة iMessage ولا يخفضها بصمت إلى SMS أبدًا. لفرض دردشة SMS، استخدم بادئة هدف صريحة `sms:` (على سبيل المثال `sms:+15555550123`). لا تزال المعالجات التي لا تملك دردشة iMessage مطابقة تُرسل عبر أي دردشة يبلغ عنها BlueBubbles.

## الأمان

- تُصادق طلبات Webhook بمقارنة معاملات الاستعلام أو الترويسات `guid`/`password` مع `channels.bluebubbles.password`.
- أبقِ كلمة مرور API ونقطة نهاية Webhook سريتين (تعامل معهما مثل بيانات الاعتماد).
- لا يوجد تجاوز localhost لمصادقة BlueBubbles Webhook. إذا كنت تمرر حركة Webhook عبر وكيل، فاحتفظ بكلمة مرور BlueBubbles في الطلب من البداية إلى النهاية. لا يستبدل `gateway.trustedProxies` هنا `channels.bluebubbles.password`. راجع [أمان Gateway](/ar/gateway/security#reverse-proxy-configuration).
- فعّل HTTPS + قواعد جدار الحماية على خادم BlueBubbles إذا كنت تعرضه خارج شبكة LAN لديك.

## استكشاف الأخطاء وإصلاحها

- إذا توقفت أحداث الكتابة/القراءة عن العمل، فتحقق من سجلات BlueBubbles Webhook وتأكد أن مسار Gateway يطابق `channels.bluebubbles.webhookPath`.
- تنتهي صلاحية رموز الاقتران بعد ساعة واحدة؛ استخدم `openclaw pairing list bluebubbles` و`openclaw pairing approve bluebubbles <code>`.
- تتطلب التفاعلات BlueBubbles private API (`POST /api/v1/message/react`)؛ تأكد أن إصدار الخادم يوفّرها.
- يتطلب التعديل/إلغاء الإرسال macOS 13+ وإصدار خادم BlueBubbles متوافقًا. على macOS 26 (Tahoe)، التعديل معطل حاليًا بسبب تغييرات Private API.
- قد تكون تحديثات أيقونات المجموعات غير مستقرة على macOS 26 (Tahoe): قد تُرجع API نجاحًا لكن الأيقونة الجديدة لا تتزامن.
- يخفي OpenClaw تلقائيًا الإجراءات المعروفة بأنها معطلة بناءً على إصدار macOS لخادم BlueBubbles. إذا كان التعديل لا يزال يظهر على macOS 26 (Tahoe)، فعطّله يدويًا باستخدام `channels.bluebubbles.actions.edit=false`.
- إذا كان `coalesceSameSenderDms` مفعّلًا لكن الرسائل المقسّمة الإرسال (مثل `Dump` + عنوان URL) لا تزال تصل كدورتين: راجع قائمة تحقق [استكشاف أخطاء دمج الرسائل المقسّمة الإرسال وإصلاحها](#split-send-coalescing-troubleshooting) — الأسباب الشائعة هي نافذة إزالة ارتداد ضيقة جدًا، أو قراءة الطوابع الزمنية لسجل الجلسة خطأً كوقت وصول Webhook، أو إرسال اقتباس رد (الذي يستخدم `replyToBody`، وليس Webhook ثانيًا).
- لمعلومات الحالة/السلامة: `openclaw status --all` أو `openclaw status --deep`.

للمرجع العام لسير عمل القنوات، راجع [القنوات](/ar/channels) ودليل [Plugins](/ar/tools/plugin).

## ذات صلة

- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وبوابة الإشارات
- [الاقتران](/ar/channels/pairing) — مصادقة DM وتدفق الاقتران
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
