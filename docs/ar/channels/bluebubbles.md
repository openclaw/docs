---
read_when:
    - إعداد قناة BlueBubbles
    - استكشاف أخطاء إقران Webhook وإصلاحها
    - إعداد iMessage على macOS
sidebarTitle: BlueBubbles
summary: iMessage عبر خادم BlueBubbles على macOS (الإرسال/الاستقبال عبر REST، مؤشرات الكتابة، التفاعلات، الاقتران، الإجراءات المتقدمة).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-06T07:42:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f2308a016826addc1098937d764b753ee08f3e86f39b0657c930a12b486793f
    source_path: channels/bluebubbles.md
    workflow: 16
---

الحالة: Plugin مضمّن يتواصل مع خادم BlueBubbles على macOS عبر HTTP. **موصى به لتكامل iMessage** بسبب API الأغنى لديه وسهولة إعداده مقارنة بقناة imsg القديمة.

<Note>
تضمّن إصدارات OpenClaw الحالية BlueBubbles، لذلك لا تحتاج البُنى المعبأة العادية إلى خطوة `openclaw plugins install` منفصلة.
</Note>

## نظرة عامة

- يعمل على macOS عبر تطبيق BlueBubbles المساعد ([bluebubbles.app](https://bluebubbles.app)).
- موصى به/مختبر: macOS Sequoia (15). يعمل macOS Tahoe (26)؛ ميزة التحرير معطلة حاليًا على Tahoe، وقد تُبلّغ تحديثات أيقونة المجموعة عن النجاح لكنها لا تتزامن.
- يتواصل OpenClaw معه من خلال REST API الخاصة به (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- تصل الرسائل الواردة عبر Webhook؛ أما الردود الصادرة، ومؤشرات الكتابة، وإيصالات القراءة، وردود tapback فهي استدعاءات REST.
- تُستوعب المرفقات والملصقات كوسائط واردة (وتُعرَض على الوكيل عند الإمكان).
- تُسلَّم ردود TTS التلقائية التي تولّد صوت MP3 أو CAF كفقاعات مذكرة صوتية في iMessage بدلًا من مرفقات ملفات عادية.
- تعمل المزاوجة/قائمة السماح بالطريقة نفسها مثل القنوات الأخرى (`/channels/pairing` إلخ) باستخدام `channels.bluebubbles.allowFrom` + رموز المزاوجة.
- تُعرَض التفاعلات كأحداث نظام مثل Slack/Telegram تمامًا حتى تتمكن الوكلاء من "ذكرها" قبل الرد.
- ميزات متقدمة: التحرير، إلغاء الإرسال، سلاسل الردود، تأثيرات الرسائل، إدارة المجموعات.

## البدء السريع

<Steps>
  <Step title="ثبّت BlueBubbles">
    ثبّت خادم BlueBubbles على جهاز Mac الخاص بك (اتبع التعليمات في [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="فعّل Web API">
    في إعدادات BlueBubbles، فعّل Web API واضبط كلمة مرور.
  </Step>
  <Step title="اضبط OpenClaw">
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
  <Step title="وجّه Webhook إلى Gateway">
    وجّه Webhook الخاصة بـ BlueBubbles إلى Gateway لديك (مثال: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="ابدأ Gateway">
    ابدأ Gateway؛ سيسجل معالج Webhook ويبدأ المزاوجة.
  </Step>
</Steps>

<Warning>
**الأمان**

- اضبط دائمًا كلمة مرور Webhook.
- مصادقة Webhook مطلوبة دائمًا. يرفض OpenClaw طلبات Webhook من BlueBubbles ما لم تتضمن كلمة مرور/guid تطابق `channels.bluebubbles.password` (مثل `?password=<password>` أو `x-password`)، بغض النظر عن بنية loopback/الوكيل.
- يتم التحقق من مصادقة كلمة المرور قبل قراءة/تحليل أجسام Webhook الكاملة.

</Warning>

## إبقاء Messages.app نشطًا (إعدادات VM / بلا واجهة)

قد تنتهي بعض إعدادات VM على macOS / التشغيل الدائم إلى دخول Messages.app في حالة "خمول" (تتوقف الأحداث الواردة حتى يتم فتح التطبيق/إحضاره إلى المقدمة). حل بسيط هو **تنبيه Messages كل 5 دقائق** باستخدام AppleScript + LaunchAgent.

<Steps>
  <Step title="احفظ AppleScript">
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
  <Step title="ثبّت LaunchAgent">
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
  <Step title="حمّله">
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

يطالب المعالج بما يلي:

<ParamField path="عنوان URL للخادم" type="string" required>
  عنوان خادم BlueBubbles (مثل `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="كلمة المرور" type="string" required>
  كلمة مرور API من إعدادات خادم BlueBubbles.
</ParamField>
<ParamField path="مسار Webhook" type="string" default="/bluebubbles-webhook">
  مسار نقطة نهاية Webhook.
</ParamField>
<ParamField path="سياسة الرسائل المباشرة" type="string">
  `pairing`, `allowlist`, `open`, أو `disabled`.
</ParamField>
<ParamField path="قائمة السماح" type="string[]">
  أرقام الهاتف، أو عناوين البريد الإلكتروني، أو أهداف الدردشة.
</ParamField>

يمكنك أيضًا إضافة BlueBubbles عبر CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## التحكم في الوصول (الرسائل المباشرة + المجموعات)

<Tabs>
  <Tab title="الرسائل المباشرة">
    - الافتراضي: `channels.bluebubbles.dmPolicy = "pairing"`.
    - يتلقى المرسلون غير المعروفين رمز مزاوجة؛ تُتجاهل الرسائل حتى تتم الموافقة (تنتهي صلاحية الرموز بعد ساعة واحدة).
    - وافق عبر:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - المزاوجة هي تبادل الرمز الافتراضي. التفاصيل: [المزاوجة](/ar/channels/pairing)

  </Tab>
  <Tab title="المجموعات">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (الافتراضي: `allowlist`).
    - يتحكم `channels.bluebubbles.groupAllowFrom` في من يمكنه التشغيل داخل المجموعات عند ضبط `allowlist`.

  </Tab>
</Tabs>

### إثراء أسماء جهات الاتصال (macOS، اختياري)

غالبًا ما تتضمن Webhook الخاصة بمجموعات BlueBubbles عناوين المشاركين الخام فقط. إذا أردت أن يعرض سياق `GroupMembers` أسماء جهات الاتصال المحلية بدلًا من ذلك، يمكنك الاشتراك في إثراء جهات الاتصال المحلية على macOS:

- يفعّل `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` البحث. الافتراضي: `false`.
- لا تعمل عمليات البحث إلا بعد أن تسمح قواعد الوصول إلى المجموعة، وتخويل الأوامر، وبوابة الذكر بمرور الرسالة.
- يتم إثراء المشاركين الهاتفيين غير المسمّين فقط.
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
- عند تمكين `requireMention` لمجموعة، لا يرد الوكيل إلا عند ذكره.
- تتجاوز أوامر التحكم من المرسلين المخولين بوابة الذكر.

إعداد كل مجموعة على حدة:

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

- تتطلب أوامر التحكم (مثل `/config`, `/model`) التخويل.
- يستخدم `allowFrom` و`groupAllowFrom` لتحديد تخويل الأوامر.
- يمكن للمرسلين المخولين تشغيل أوامر التحكم حتى من دون الذكر داخل المجموعات.

### موجه النظام لكل مجموعة

يقبل كل إدخال ضمن `channels.bluebubbles.groups.*` سلسلة `systemPrompt` اختيارية. تُحقن القيمة في موجه نظام الوكيل في كل دورة تتعامل مع رسالة في تلك المجموعة، بحيث يمكنك ضبط شخصية أو قواعد سلوكية لكل مجموعة من دون تعديل موجهات الوكيل:

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

يطابق المفتاح أي قيمة يبلّغ عنها BlueBubbles باسم `chatGuid` / `chatIdentifier` / `chatId` الرقمي للمجموعة، ويوفر إدخال البدل `"*"` افتراضيًا لكل مجموعة بلا تطابق دقيق (النمط نفسه المستخدم بواسطة `requireMention` وسياسات الأدوات لكل مجموعة). تفوز التطابقات الدقيقة دائمًا على البدل. تتجاهل الرسائل المباشرة هذا الحقل؛ استخدم تخصيص الموجه على مستوى الوكيل أو الحساب بدلًا من ذلك.

#### مثال عملي: الردود المتسلسلة وتفاعلات tapback (Private API)

عند تمكين BlueBubbles Private API، تصل الرسائل الواردة بمعرّفات رسائل قصيرة (مثل `[[reply_to:5]]`) ويمكن للوكيل استدعاء `action=reply` للرد ضمن سلسلة رسالة محددة أو `action=react` لإضافة tapback. يُعد `systemPrompt` لكل مجموعة طريقة موثوقة لإبقاء الوكيل يختار الأداة الصحيحة:

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

تتطلب كل من تفاعلات tapback والردود المتسلسلة BlueBubbles Private API؛ راجع [الإجراءات المتقدمة](#advanced-actions) و[معرّفات الرسائل](#message-ids-short-vs-full) للآليات الأساسية.

## ارتباطات محادثات ACP

يمكن تحويل دردشات BlueBubbles إلى مساحات عمل ACP دائمة من دون تغيير طبقة النقل.

تدفق سريع للمشغّل:

- شغّل `/acp spawn codex --bind here` داخل الرسالة المباشرة أو دردشة المجموعة المسموح بها.
- تُوجَّه الرسائل المستقبلية في محادثة BlueBubbles نفسها إلى جلسة ACP المُنشأة.
- يعيد `/new` و`/reset` ضبط جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الارتباط.

تُدعم أيضًا الارتباطات الدائمة المضبوطة من خلال إدخالات `bindings[]` على المستوى الأعلى باستخدام `type: "acp"` و`match.channel: "bluebubbles"`.

يمكن أن يستخدم `match.peer.id` أي صيغة هدف BlueBubbles مدعومة:

- معرّف رسالة مباشرة مطبّع مثل `+15555550123` أو `user@example.com`
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

راجع [وكلاء ACP](/ar/tools/acp-agents) لسلوك ارتباط ACP المشترك.

## الكتابة + إيصالات القراءة

- **مؤشرات الكتابة**: تُرسل تلقائيًا قبل إنشاء الرد وأثناءه.
- **إيصالات القراءة**: يتحكم بها `channels.bluebubbles.sendReadReceipts` (الافتراضي: `true`).
- **مؤشرات الكتابة**: يرسل OpenClaw أحداث بدء الكتابة؛ يمسح BlueBubbles الكتابة تلقائيًا عند الإرسال أو انتهاء المهلة (الإيقاف اليدوي عبر DELETE غير موثوق).

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
    - **react**: إضافة/إزالة تفاعلات النقر الخلفي (`messageId`، `emoji`، `remove`). مجموعة النقر الخلفي الأصلية في iMessage هي `love` و`like` و`dislike` و`laugh` و`emphasize` و`question`. عندما يختار وكيل رمزا تعبيريا خارج تلك المجموعة (مثل `👀`)، تعود أداة التفاعل إلى `love` حتى يظل النقر الخلفي يظهر بدلا من فشل الطلب بأكمله. لا تزال تفاعلات الإقرار المهيأة تتحقق بصرامة وتصدر خطأ عند القيم غير المعروفة.
    - **edit**: تعديل رسالة مرسلة (`messageId`، `text`).
    - **unsend**: إلغاء إرسال رسالة (`messageId`).
    - **reply**: الرد على رسالة محددة (`messageId`، `text`، `to`).
    - **sendWithEffect**: الإرسال مع تأثير iMessage (`text`، `to`، `effectId`).
    - **renameGroup**: إعادة تسمية محادثة جماعية (`chatGuid`، `displayName`).
    - **setGroupIcon**: تعيين أيقونة/صورة محادثة جماعية (`chatGuid`، `media`) - غير مستقر على macOS 26 Tahoe (قد تعيد API نجاحا لكن الأيقونة لا تتزامن).
    - **addParticipant**: إضافة شخص إلى مجموعة (`chatGuid`، `address`).
    - **removeParticipant**: إزالة شخص من مجموعة (`chatGuid`، `address`).
    - **leaveGroup**: مغادرة محادثة جماعية (`chatGuid`).
    - **upload-file**: إرسال وسائط/ملفات (`to`، `buffer`، `filename`، `asVoice`).
      - المذكرات الصوتية: عيّن `asVoice: true` مع صوت **MP3** أو **CAF** للإرسال كرسالة صوتية في iMessage. يحول BlueBubbles ‏MP3 → CAF عند إرسال المذكرات الصوتية.
    - الاسم البديل القديم: لا يزال `sendAttachment` يعمل، لكن `upload-file` هو اسم الإجراء المعتمد.

  </Accordion>
</AccordionGroup>

### معرّفات الرسائل (قصيرة مقابل كاملة)

قد يعرض OpenClaw معرّفات رسائل _قصيرة_ (مثل `1`، `2`) لتوفير الرموز.

- يمكن أن تكون `MessageSid` / `ReplyToId` معرّفات قصيرة.
- تحتوي `MessageSidFull` / `ReplyToIdFull` على المعرّفات الكاملة للمزوّد.
- المعرّفات القصيرة موجودة في الذاكرة؛ ويمكن أن تنتهي صلاحيتها عند إعادة التشغيل أو إخلاء ذاكرة التخزين المؤقت.
- تقبل الإجراءات `messageId` قصيرا أو كاملا، لكن المعرّفات القصيرة ستصدر خطأ إذا لم تعد متاحة.

استخدم المعرّفات الكاملة للأتمتة والتخزين الدائمين:

- القوالب: `{{MessageSidFull}}`، `{{ReplyToIdFull}}`
- السياق: `MessageSidFull` / `ReplyToIdFull` في الحمولات الواردة

راجع [الإعدادات](/ar/gateway/configuration) لمتغيرات القوالب.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## دمج الرسائل المباشرة ذات الإرسال المنقسم (أمر + عنوان URL في تركيب واحد)

عندما يكتب مستخدم أمرا وعنوان URL معا في iMessage - مثلا `Dump https://example.com/article` - تقسم Apple الإرسال إلى **تسليمين منفصلين عبر Webhook**:

1. رسالة نصية (`"Dump"`).
2. فقاعة معاينة عنوان URL (`"https://..."`) مع صور معاينة OG كمرفقات.

يصل الـ Webhookان إلى OpenClaw بفاصل يقارب 0.8-2.0 ثانية في معظم الإعدادات. من دون الدمج، يتلقى الوكيل الأمر وحده في الدور 1، ويرد (غالبا "أرسل لي عنوان URL")، ولا يرى عنوان URL إلا في الدور 2 - وعندها يكون سياق الأمر قد فُقد بالفعل.

يتيح `channels.bluebubbles.coalesceSameSenderDms` للرسالة المباشرة دمج Webhookات متتالية من المرسل نفسه في دور وكيل واحد. تستمر المحادثات الجماعية في استخدام مفتاح لكل رسالة حتى تبقى بنية أدوار المستخدمين المتعددين محفوظة.

<Tabs>
  <Tab title="When to enable">
    فعّل ذلك عندما:

    - تشحن Skills تتوقع `command + payload` في رسالة واحدة (dump، paste، save، queue، إلخ).
    - يلصق مستخدموك عناوين URL أو صورا أو محتوى طويلا بجانب الأوامر.
    - يمكنك قبول زمن التأخير الإضافي لدور الرسالة المباشرة (انظر أدناه).

    اتركه معطلا عندما:

    - تحتاج إلى أدنى زمن تأخير للأوامر عند مشغلات الرسائل المباشرة المكونة من كلمة واحدة.
    - تكون كل تدفقاتك أوامر لمرة واحدة من دون متابعات حمولة.

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

    مع تفعيل العلم ومن دون `messages.inbound.byChannel.bluebubbles` صريح، تتسع نافذة إزالة الارتداد إلى **2500 ms** (الافتراضي عند عدم الدمج هو 500 ms). النافذة الأوسع مطلوبة - إيقاع Apple للإرسال المنقسم، 0.8-2.0 ثانية، لا يناسب الافتراضي الأضيق.

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
    - **زمن تأخير إضافي لأوامر التحكم في الرسائل المباشرة.** مع تفعيل العلم، تنتظر رسائل أوامر التحكم في الرسائل المباشرة (مثل `Dump` و`Save` وما إلى ذلك) الآن حتى نافذة إزالة الارتداد قبل الإرسال، تحسبا لوصول Webhook حمولة. تحافظ أوامر المحادثات الجماعية على الإرسال الفوري.
    - **المخرج المدمج محدود** - يقتصر النص المدمج على 4000 حرف مع علامة `…[truncated]` صريحة؛ وتقتصر المرفقات على 20؛ وتقتصر إدخالات المصدر على 10 (مع الاحتفاظ بالأول والأحدث بعد ذلك). لا يزال كل `messageId` مصدر يصل إلى إزالة التكرار للوارد حتى تتم معرفة أي إعادة تشغيل لاحقة من MessagePoller لأي حدث فردي على أنها تكرار.
    - **اشتراك اختياري، لكل قناة.** لا تتأثر القنوات الأخرى (Telegram، WhatsApp، Slack، …).

  </Tab>
</Tabs>

### السيناريوهات وما يراه الوكيل

| ما يؤلفه المستخدم                                                  | ما تسلمه Apple             | العلم متوقف (افتراضي)                  | العلم مفعّل + نافذة 2500 ms                                             |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (إرسال واحد)                            | Webhookان بفاصل ~1 ثانية  | دوران للوكيل: "Dump" وحدها، ثم URL     | دور واحد: نص مدمج `Dump https://example.com`                            |
| `Save this 📎image.jpg caption` (مرفق + نص)                        | Webhookان                 | دوران                                  | دور واحد: نص + صورة                                                     |
| `/status` (أمر مستقل)                                             | Webhook واحد              | إرسال فوري                              | **انتظار حتى النافذة، ثم إرسال**                                        |
| عنوان URL ملصوق وحده                                               | Webhook واحد              | إرسال فوري                              | إرسال فوري (إدخال واحد فقط في الحاوية)                                  |
| نص + عنوان URL مرسلان كرسالتين منفصلتين مقصودتين، بفاصل دقائق      | Webhookان خارج النافذة    | دوران                                  | دوران (تنتهي النافذة بينهما)                                            |
| تدفق سريع (>10 رسائل مباشرة صغيرة داخل النافذة)                    | N Webhookات               | N أدوار                                | دور واحد، مخرج محدود (الأول + الأحدث، مع تطبيق حدود النص/المرفقات)      |

### استكشاف أخطاء دمج الإرسال المنقسم وإصلاحها

إذا كان العلم مفعلا ولا تزال الإرسالات المنقسمة تصل كدورين، فتحقق من كل طبقة:

<AccordionGroup>
  <Accordion title="Config actually loaded">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    ثم `openclaw gateway restart` - يُقرأ العلم عند إنشاء سجل إزالة الارتداد.

  </Accordion>
  <Accordion title="Debounce window wide enough for your setup">
    انظر إلى سجل خادم BlueBubbles ضمن `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    قِس الفجوة بين إرسال النص على نمط `"Dump"` وإرسال `"https://..."; Attachments:` الذي يليه. ارفع `messages.inbound.byChannel.bluebubbles` ليغطي تلك الفجوة براحة.

  </Accordion>
  <Accordion title="Session JSONL timestamps ≠ webhook arrival">
    تعكس طوابع أحداث الجلسة الزمنية (`~/.openclaw/agents/<id>/sessions/*.jsonl`) الوقت الذي يسلّم فيه Gateway رسالة إلى الوكيل، **وليس** وقت وصول Webhook. الرسالة الثانية الموضوعة في قائمة انتظار والموسومة بـ `[Queued messages while agent was busy]` تعني أن الدور الأول كان لا يزال قيد التشغيل عند وصول Webhook الثاني - وكانت حاوية الدمج قد أُفرغت بالفعل. اضبط النافذة بحسب سجل خادم BB، وليس سجل الجلسة.
  </Accordion>
  <Accordion title="Memory pressure slowing reply dispatch">
    على الأجهزة الأصغر (8 GB)، يمكن أن تستغرق أدوار الوكيل وقتا طويلا بما يكفي لتفريغ حاوية الدمج قبل اكتمال الرد، فيهبط عنوان URL كدور ثان في قائمة الانتظار. تحقق من `memory_pressure` و`ps -o rss -p $(pgrep openclaw-gateway)`؛ إذا كان Gateway يتجاوز ~500 MB RSS وكان الضاغط نشطا، فأغلق العمليات الثقيلة الأخرى أو انتقل إلى مضيف أكبر.
  </Accordion>
  <Accordion title="Reply-quote sends are a different path">
    إذا نقر المستخدم `Dump` كـ **رد** على فقاعة عنوان URL موجودة (يعرض iMessage شارة "1 Reply" على فقاعة Dump)، فإن عنوان URL يكون في `replyToBody`، وليس في Webhook ثان. لا ينطبق الدمج - فهذا شأن Skill/موجّه، وليس شأن أداة إزالة الارتداد.
  </Accordion>
</AccordionGroup>

## تدفق الكتل

تحكم فيما إذا كانت الردود تُرسل كرسالة واحدة أو تُدفق في كتل:

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
- يُجزأ النص الصادر إلى `channels.bluebubbles.textChunkLimit` (الافتراضي: 4000 حرف).

## مرجع الإعدادات

الإعدادات الكاملة: [الإعدادات](/ar/gateway/configuration)

<AccordionGroup>
  <Accordion title="Connection and webhook">
    - `channels.bluebubbles.enabled`: تفعيل/تعطيل القناة.
    - `channels.bluebubbles.serverUrl`: عنوان URL الأساسي لـ BlueBubbles REST API.
    - `channels.bluebubbles.password`: كلمة مرور API.
    - `channels.bluebubbles.webhookPath`: مسار نقطة نهاية Webhook (الافتراضي: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Access policy">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: `pairing`).
    - `channels.bluebubbles.allowFrom`: قائمة السماح للرسائل المباشرة (المعرّفات، عناوين البريد الإلكتروني، أرقام E.164، `chat_id:*`، `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (الافتراضي: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: قائمة السماح لمرسلي المجموعة.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: على macOS، إثراء المشاركين غير المسمّين في المجموعة اختياريا من جهات الاتصال المحلية بعد اجتياز البوابة. الافتراضي: `false`.
    - `channels.bluebubbles.groups`: إعدادات لكل مجموعة (`requireMention`، إلخ).

  </Accordion>
  <Accordion title="التسليم والتجزئة">
    - `channels.bluebubbles.sendReadReceipts`: إرسال إيصالات القراءة (الافتراضي: `true`).
    - `channels.bluebubbles.blockStreaming`: تمكين البث الكتلي (الافتراضي: `false`؛ مطلوب للردود المتدفقة).
    - `channels.bluebubbles.textChunkLimit`: حجم الجزء الصادر بالأحرف (الافتراضي: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: مهلة كل طلب بالمللي ثانية لإرسال النص الصادر عبر `/api/v1/message/text` (الافتراضي: 30000). ارفعها في إعدادات macOS 26 حيث يمكن أن تتوقف عمليات إرسال Private API iMessage لأكثر من 60 ثانية داخل إطار عمل iMessage؛ على سبيل المثال `45000` أو `60000`. تحتفظ المجسات وعمليات البحث في الدردشة والتفاعلات والتعديلات وفحوصات الصحة حاليًا بالافتراضي الأقصر وهو 10 ثوانٍ؛ ومن المخطط توسيع التغطية لتشمل التفاعلات والتعديلات كمتابعة. تجاوز على مستوى الحساب: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (الافتراضي) يقسم فقط عند تجاوز `textChunkLimit`؛ أما `newline` فيقسم عند الأسطر الفارغة (حدود الفقرات) قبل التجزئة بحسب الطول.

  </Accordion>
  <Accordion title="الوسائط والسجل">
    - `channels.bluebubbles.mediaMaxMb`: حد الوسائط الواردة/الصادرة بالميغابايت (الافتراضي: 8).
    - `channels.bluebubbles.mediaLocalRoots`: قائمة سماح صريحة بالأدلة المحلية المطلقة المسموح بها لمسارات الوسائط المحلية الصادرة. تُرفض عمليات الإرسال عبر المسارات المحلية افتراضيًا ما لم يُضبط هذا الخيار. تجاوز على مستوى الحساب: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: دمج Webhooks الرسائل المباشرة المتتالية من المرسل نفسه في دورة وكيل واحدة بحيث يصل إرسال Apple المقسم إلى نص+URL كرسالة واحدة (الافتراضي: `false`). راجع [دمج الرسائل المباشرة المقسمة الإرسال](#coalescing-split-send-dms-command--url-in-one-composition) لمعرفة السيناريوهات وضبط النافذة والمفاضلات. يوسع نافذة تقليل التذبذب الافتراضية للرسائل الواردة من 500 مللي ثانية إلى 2500 مللي ثانية عند تمكينه دون `messages.inbound.byChannel.bluebubbles` صريح.
    - `channels.bluebubbles.historyLimit`: الحد الأقصى لرسائل المجموعة للسياق (0 يعطلها).
    - `channels.bluebubbles.dmHistoryLimit`: حد سجل الرسائل المباشرة.
    - `channels.bluebubbles.replyContextApiFallback`: عندما تصل رسالة رد واردة دون `replyToBody`/`replyToSender` ويفشل العثور عليها في ذاكرة التخزين المؤقت لسياق الرد داخل الذاكرة، اجلب الرسالة الأصلية من BlueBubbles HTTP API كحل احتياطي بأفضل جهد (الافتراضي: `false`). مفيد لعمليات النشر متعددة المثيلات التي تشترك في حساب BlueBubbles واحد، أو بعد إعادة تشغيل العملية، أو بعد طرد ذاكرة تخزين مؤقت طويلة العمر بنظام TTL/LRU. يخضع الجلب لحماية SSRF وفق السياسة نفسها المطبقة على كل طلب آخر من عميل BlueBubbles، ولا يرمي أخطاء أبدًا، ويملأ ذاكرة التخزين المؤقت بحيث تُوزع تكلفة الردود اللاحقة. تجاوز على مستوى الحساب: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. ينتقل إعداد على مستوى القناة إلى الحسابات التي تحذف هذا العلم.

  </Accordion>
  <Accordion title="الإجراءات والحسابات">
    - `channels.bluebubbles.actions`: تمكين/تعطيل إجراءات محددة.
    - `channels.bluebubbles.accounts`: إعداد متعدد الحسابات.

  </Accordion>
</AccordionGroup>

الخيارات العامة ذات الصلة:

- `agents.list[].groupChat.mentionPatterns` (أو `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## العناوين / أهداف التسليم

يفضل استخدام `chat_guid` للتوجيه المستقر:

- `chat_guid:iMessage;-;+15555550123` (مفضل للمجموعات)
- `chat_id:123`
- `chat_identifier:...`
- المعرفات المباشرة: `+15555550123`، `user@example.com`
  - إذا لم يكن للمعرف المباشر دردشة رسالة مباشرة موجودة، فسينشئ OpenClaw واحدة عبر `POST /api/v1/chat/new`. يتطلب ذلك تمكين BlueBubbles Private API.

### توجيه iMessage مقابل SMS

عندما يكون للمعرف نفسه دردشة iMessage ودردشة SMS على Mac (مثل رقم هاتف مسجل في iMessage لكنه تلقى أيضًا بدائل الفقاعة الخضراء)، يفضل OpenClaw دردشة iMessage ولا يخفضها صامتًا إلى SMS أبدًا. لفرض دردشة SMS، استخدم بادئة هدف `sms:` صريحة (مثل `sms:+15555550123`). لا تزال المعرفات التي لا تملك دردشة iMessage مطابقة تُرسل عبر أي دردشة يبلغ عنها BlueBubbles.

## الأمان

- تُصادق طلبات Webhook عبر مقارنة معاملات أو ترويسات الاستعلام `guid`/`password` مع `channels.bluebubbles.password`.
- أبقِ كلمة مرور API ونقطة نهاية Webhook سريتين (عاملهما مثل بيانات الاعتماد).
- لا يوجد تجاوز localhost لمصادقة Webhook في BlueBubbles. إذا كنت تمرر حركة Webhook عبر وكيل، فأبقِ كلمة مرور BlueBubbles على الطلب من طرف إلى طرف. لا يحل `gateway.trustedProxies` محل `channels.bluebubbles.password` هنا. راجع [أمان Gateway](/ar/gateway/security#reverse-proxy-configuration).
- مكّن HTTPS + قواعد جدار الحماية على خادم BlueBubbles إذا كنت تكشفه خارج شبكتك المحلية.

## استكشاف الأخطاء وإصلاحها

- إذا توقفت أحداث الكتابة/القراءة عن العمل، فتحقق من سجلات Webhook في BlueBubbles وتأكد أن مسار Gateway يطابق `channels.bluebubbles.webhookPath`.
- تنتهي صلاحية رموز الاقتران بعد ساعة واحدة؛ استخدم `openclaw pairing list bluebubbles` و`openclaw pairing approve bluebubbles <code>`.
- تتطلب التفاعلات BlueBubbles private API (`POST /api/v1/message/react`)؛ تأكد من أن إصدار الخادم يوفرها.
- يتطلب التعديل/إلغاء الإرسال macOS 13+ وإصدار خادم BlueBubbles متوافقًا. على macOS 26 (Tahoe)، التعديل معطل حاليًا بسبب تغييرات private API.
- قد تكون تحديثات أيقونة المجموعة غير مستقرة على macOS 26 (Tahoe): قد تعيد API نجاحًا لكن الأيقونة الجديدة لا تتزامن.
- يخفي OpenClaw تلقائيًا الإجراءات المعروفة بأنها معطلة بناءً على إصدار macOS في خادم BlueBubbles. إذا ظل التعديل ظاهرًا على macOS 26 (Tahoe)، فعطله يدويًا باستخدام `channels.bluebubbles.actions.edit=false`.
- تم تمكين `coalesceSameSenderDms` لكن الرسائل المقسمة الإرسال (مثل `Dump` + URL) ما زالت تصل كدورتين: راجع قائمة تحقق [استكشاف أخطاء دمج الإرسال المقسم وإصلاحها](#split-send-coalescing-troubleshooting) - الأسباب الشائعة هي نافذة تقليل تذبذب ضيقة جدًا، أو قراءة طوابع سجل الجلسة الزمنية خطأً على أنها وقت وصول Webhook، أو إرسال اقتباس رد (يستخدم `replyToBody` وليس Webhook ثانيًا).
- لمعلومات الحالة/الصحة: `openclaw status --all` أو `openclaw status --deep`.

لمرجع عام عن سير عمل القنوات، راجع [القنوات](/ar/channels) ودليل [Plugins](/ar/tools/plugin).

## ذو صلة

- [توجيه القنوات](/ar/channels/channel-routing) - توجيه الجلسات للرسائل
- [نظرة عامة على القنوات](/ar/channels) - جميع القنوات المدعومة
- [المجموعات](/ar/channels/groups) - سلوك دردشة المجموعات وحراسة الإشارات
- [الاقتران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الاقتران
- [الأمان](/ar/gateway/security) - نموذج الوصول والتقوية
