---
read_when:
    - إعداد قناة BlueBubbles
    - استكشاف أخطاء إقران Webhook وإصلاحها
    - تكوين iMessage على macOS
sidebarTitle: BlueBubbles
summary: iMessage عبر خادم BlueBubbles على macOS (الإرسال/الاستقبال عبر REST، الكتابة، التفاعلات، الإقران، الإجراءات المتقدمة).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-01T07:37:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 499cc2a46db6e0eddfb897e96ec4b3e4a39ba9f2f6da8e7485c1c46562de4145
    source_path: channels/bluebubbles.md
    workflow: 16
---

الحالة: Plugin مضمن يتواصل مع خادم BlueBubbles على macOS عبر HTTP. **موصى به لتكامل iMessage** بفضل API الأغنى والإعداد الأسهل مقارنة بقناة imsg القديمة.

<Note>
تضم إصدارات OpenClaw الحالية BlueBubbles، لذلك لا تحتاج البنيات المعبأة العادية إلى خطوة `openclaw plugins install` منفصلة.
</Note>

## نظرة عامة

- يعمل على macOS عبر تطبيق BlueBubbles المساعد ([bluebubbles.app](https://bluebubbles.app)).
- موصى به/مختبر: macOS Sequoia (15). يعمل macOS Tahoe (26)؛ التحرير معطل حاليا على Tahoe، وقد تبلغ تحديثات أيقونة المجموعة عن النجاح لكنها لا تتزامن.
- يتواصل OpenClaw معه عبر REST API الخاص به (`GET /api/v1/ping`، `POST /message/text`، `POST /chat/:id/*`).
- تصل الرسائل الواردة عبر Webhook؛ أما الردود الصادرة، ومؤشرات الكتابة، وإيصالات القراءة، وتفاعلات tapback فهي استدعاءات REST.
- يتم استيعاب المرفقات والملصقات كوسائط واردة (وتعرض على الوكيل عند الإمكان).
- يتم تسليم ردود Auto-TTS التي تنشئ صوت MP3 أو CAF كفقاعات مذكرة صوتية في iMessage بدلا من مرفقات ملفات عادية.
- يعمل الاقتران/قائمة السماح بالطريقة نفسها مثل القنوات الأخرى (`/channels/pairing` وما إلى ذلك) مع `channels.bluebubbles.allowFrom` + رموز الاقتران.
- تعرض التفاعلات كأحداث نظام تماما مثل Slack/Telegram حتى تتمكن الوكلاء من "ذكرها" قبل الرد.
- الميزات المتقدمة: التحرير، إلغاء الإرسال، تسلسل الردود، تأثيرات الرسائل، إدارة المجموعات.

## البدء السريع

<Steps>
  <Step title="Install BlueBubbles">
    ثبت خادم BlueBubbles على جهاز Mac لديك (اتبع التعليمات في [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Enable the web API">
    في إعداد BlueBubbles، فعل web API واضبط كلمة مرور.
  </Step>
  <Step title="Configure OpenClaw">
    شغل `openclaw onboard` واختر BlueBubbles، أو اضبطه يدويا:

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
    وجه Webhook الخاصة بـ BlueBubbles إلى Gateway لديك (مثال: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Start the gateway">
    ابدأ Gateway؛ سيسجل معالج Webhook ويبدأ الاقتران.
  </Step>
</Steps>

<Warning>
**الأمان**

- اضبط كلمة مرور Webhook دائما.
- مصادقة Webhook مطلوبة دائما. يرفض OpenClaw طلبات Webhook من BlueBubbles ما لم تتضمن كلمة مرور/guid تطابق `channels.bluebubbles.password` (على سبيل المثال `?password=<password>` أو `x-password`)، بغض النظر عن بنية loopback/proxy.
- يتم التحقق من مصادقة كلمة المرور قبل قراءة/تحليل أجسام Webhook الكاملة.

</Warning>

## إبقاء Messages.app نشطا (إعدادات VM / بلا واجهة)

قد تنتهي بعض إعدادات macOS VM / التشغيل الدائم إلى انتقال Messages.app إلى حالة "خمول" (تتوقف الأحداث الواردة حتى يتم فتح التطبيق/إحضاره إلى المقدمة). حل بديل بسيط هو **تنبيه Messages كل 5 دقائق** باستخدام AppleScript + LaunchAgent.

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

    يعمل هذا **كل 300 ثانية** و**عند تسجيل الدخول**. قد يؤدي التشغيل الأول إلى ظهور مطالبات **Automation** في macOS (`osascript` → Messages). وافق عليها في جلسة المستخدم نفسها التي تشغل LaunchAgent.

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

يطالب المعالج بما يلي:

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
  `pairing`، أو `allowlist`، أو `open`، أو `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  أرقام الهاتف، أو عناوين البريد الإلكتروني، أو أهداف الدردشة.
</ParamField>

يمكنك أيضا إضافة BlueBubbles عبر CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## التحكم في الوصول (الرسائل المباشرة + المجموعات)

<Tabs>
  <Tab title="DMs">
    - الافتراضي: `channels.bluebubbles.dmPolicy = "pairing"`.
    - يتلقى المرسلون غير المعروفين رمز اقتران؛ يتم تجاهل الرسائل حتى تتم الموافقة عليها (تنتهي صلاحية الرموز بعد ساعة واحدة).
    - وافق عبر:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - الاقتران هو تبادل الرمز الافتراضي. التفاصيل: [الاقتران](/ar/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (الافتراضي: `allowlist`).
    - يتحكم `channels.bluebubbles.groupAllowFrom` في من يمكنه التشغيل داخل المجموعات عند ضبط `allowlist`.

  </Tab>
</Tabs>

### إثراء أسماء جهات الاتصال (macOS، اختياري)

غالبا ما تتضمن Webhook مجموعات BlueBubbles عناوين المشاركين الخام فقط. إذا أردت أن يعرض سياق `GroupMembers` أسماء جهات الاتصال المحلية بدلا من ذلك، يمكنك الاشتراك في إثراء Contacts المحلي على macOS:

- يفعل `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` البحث. الافتراضي: `false`.
- لا تعمل عمليات البحث إلا بعد أن تسمح صلاحية وصول المجموعة، وتفويض الأوامر، وبوابة الذكر بمرور الرسالة.
- يتم إثراء المشاركين الهاتفيين غير المسمين فقط.
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
- عند تفعيل `requireMention` لمجموعة، لا يرد الوكيل إلا عند ذكره.
- تتجاوز أوامر التحكم من المرسلين المفوضين بوابة الذكر.

إعداد لكل مجموعة:

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

- تتطلب أوامر التحكم (مثلا، `/config`، `/model`) تفويضا.
- يستخدم `allowFrom` و`groupAllowFrom` لتحديد تفويض الأوامر.
- يمكن للمرسلين المفوضين تشغيل أوامر التحكم حتى من دون ذكر في المجموعات.

### مطالبة نظام لكل مجموعة

يقبل كل إدخال ضمن `channels.bluebubbles.groups.*` سلسلة `systemPrompt` اختيارية. يتم حقن القيمة في مطالبة نظام الوكيل في كل دورة تتعامل مع رسالة في تلك المجموعة، بحيث يمكنك ضبط شخصية أو قواعد سلوكية لكل مجموعة من دون تعديل مطالبات الوكيل:

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

يطابق المفتاح ما يبلغ عنه BlueBubbles باعتباره `chatGuid` / `chatIdentifier` / `chatId` رقمي للمجموعة، ويوفر إدخال البدل `"*"` افتراضيا لكل مجموعة لا تملك تطابقا دقيقا (النمط نفسه المستخدم بواسطة `requireMention` وسياسات الأدوات لكل مجموعة). تتفوق التطابقات الدقيقة دائما على البدل. تتجاهل الرسائل المباشرة هذا الحقل؛ استخدم تخصيص المطالبة على مستوى الوكيل أو الحساب بدلا من ذلك.

#### مثال عملي: الردود المتسلسلة وتفاعلات tapback (Private API)

مع تفعيل BlueBubbles Private API، تصل الرسائل الواردة مع معرفات رسائل قصيرة (على سبيل المثال `[[reply_to:5]]`) ويمكن للوكيل استدعاء `action=reply` للرد ضمن رسالة محددة أو `action=react` لإضافة tapback. تعد `systemPrompt` لكل مجموعة طريقة موثوقة لإبقاء الوكيل يختار الأداة الصحيحة:

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

تتطلب تفاعلات tapback والردود المتسلسلة كلاهما BlueBubbles Private API؛ راجع [الإجراءات المتقدمة](#advanced-actions) و[معرفات الرسائل](#message-ids-short-vs-full) لمعرفة الآليات الأساسية.

## روابط محادثات ACP

يمكن تحويل دردشات BlueBubbles إلى مساحات عمل ACP دائمة من دون تغيير طبقة النقل.

تدفق سريع للمشغل:

- شغل `/acp spawn codex --bind here` داخل الرسالة المباشرة أو دردشة المجموعة المسموح بها.
- ستوجه الرسائل المستقبلية في محادثة BlueBubbles نفسها إلى جلسة ACP التي تم إنشاؤها.
- يعيد `/new` و`/reset` ضبط جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الربط.

تدعم أيضا الروابط الدائمة المضبوطة عبر إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` و`match.channel: "bluebubbles"`.

يمكن أن يستخدم `match.peer.id` أي صيغة هدف مدعومة في BlueBubbles:

- مقبض رسالة مباشرة مطبع مثل `+15555550123` أو `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

للروابط المستقرة للمجموعات، فضل `chat_id:*` أو `chat_identifier:*`.

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

- **مؤشرات الكتابة**: تُرسل تلقائياً قبل إنشاء الرد وأثناءه.
- **إيصالات القراءة**: يتحكم بها `channels.bluebubbles.sendReadReceipts` (الافتراضي: `true`).
- **مؤشرات الكتابة**: يرسل OpenClaw أحداث بدء الكتابة؛ ويمسح BlueBubbles حالة الكتابة تلقائياً عند الإرسال أو انتهاء المهلة (الإيقاف اليدوي عبر DELETE غير موثوق).

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
  <Accordion title="الإجراءات المتاحة">
    - **react**: أضف/أزل تفاعلات tapback (`messageId`، `emoji`، `remove`). مجموعة tapback الأصلية في iMessage هي `love`، و`like`، و`dislike`، و`laugh`، و`emphasize`، و`question`. عندما يختار وكيل رمزاً تعبيرياً خارج تلك المجموعة (مثلاً `👀`)، تعود أداة التفاعل إلى `love` كي يستمر عرض tapback بدلاً من فشل الطلب بالكامل. لا تزال تفاعلات الإقرار المكوّنة تتحقق بصرامة وتُرجع خطأ عند القيم غير المعروفة.
    - **edit**: عدّل رسالة مرسلة (`messageId`، `text`).
    - **unsend**: ألغِ إرسال رسالة (`messageId`).
    - **reply**: رد على رسالة محددة (`messageId`، `text`، `to`).
    - **sendWithEffect**: أرسل مع تأثير iMessage (`text`، `to`، `effectId`).
    - **renameGroup**: أعد تسمية دردشة جماعية (`chatGuid`، `displayName`).
    - **setGroupIcon**: عيّن أيقونة/صورة دردشة جماعية (`chatGuid`، `media`) — غير مستقرة على macOS 26 Tahoe (قد تُرجع API نجاحاً لكن الأيقونة لا تتزامن).
    - **addParticipant**: أضف شخصاً إلى مجموعة (`chatGuid`، `address`).
    - **removeParticipant**: أزل شخصاً من مجموعة (`chatGuid`، `address`).
    - **leaveGroup**: غادر دردشة جماعية (`chatGuid`).
    - **upload-file**: أرسل وسائط/ملفات (`to`، `buffer`، `filename`، `asVoice`).
      - المذكرات الصوتية: اضبط `asVoice: true` مع صوت **MP3** أو **CAF** للإرسال كرسالة صوتية في iMessage. يحوّل BlueBubbles ‏MP3 → CAF عند إرسال المذكرات الصوتية.
    - الاسم المستعار القديم: لا يزال `sendAttachment` يعمل، لكن `upload-file` هو اسم الإجراء المعتمد.

  </Accordion>
</AccordionGroup>

### معرّفات الرسائل (قصيرة مقابل كاملة)

قد يعرض OpenClaw معرّفات رسائل _قصيرة_ (مثل `1`، `2`) لتوفير الرموز.

- يمكن أن تكون `MessageSid` / `ReplyToId` معرّفات قصيرة.
- تحتوي `MessageSidFull` / `ReplyToIdFull` على المعرّفات الكاملة للمزوّد.
- المعرّفات القصيرة موجودة في الذاكرة؛ يمكن أن تنتهي صلاحيتها عند إعادة التشغيل أو إخلاء ذاكرة التخزين المؤقت.
- تقبل الإجراءات `messageId` قصيراً أو كاملاً، لكن المعرّفات القصيرة ستُرجع خطأ إذا لم تعد متاحة.

استخدم المعرّفات الكاملة للأتمتة والتخزين الدائمين:

- القوالب: `{{MessageSidFull}}`، `{{ReplyToIdFull}}`
- السياق: `MessageSidFull` / `ReplyToIdFull` في الحمولات الواردة

راجع [الإعدادات](/ar/gateway/configuration) لمتغيرات القوالب.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## دمج الرسائل المباشرة المقسّمة عند الإرسال (أمر + URL في تركيب واحد)

عندما يكتب مستخدم أمراً وURL معاً في iMessage — مثل `Dump https://example.com/article` — تقسّم Apple الإرسال إلى **تسليمين منفصلين عبر Webhook**:

1. رسالة نصية (`"Dump"`).
2. فقاعة معاينة URL (`"https://..."`) مع صور معاينة OG كمرفقات.

يصل Webhookان إلى OpenClaw بفاصل يقارب 0.8-2.0 ثانية في معظم الإعدادات. من دون الدمج، يتلقى الوكيل الأمر وحده في الدور 1، ويرد (غالباً "أرسل لي URL")، ولا يرى URL إلا في الدور 2 — وعندها يكون سياق الأمر قد فُقد بالفعل.

يختار `channels.bluebubbles.coalesceSameSenderDms` دمج Webhookات متتالية من المرسل نفسه في الرسائل المباشرة ضمن دور وكيل واحد. تستمر الدردشات الجماعية في استخدام مفتاح لكل رسالة كي تُحفظ بنية الأدوار متعددة المستخدمين.

<Tabs>
  <Tab title="متى تفعّله">
    فعّله عندما:

    - توفر Skills تتوقع `command + payload` في رسالة واحدة (تفريغ، لصق، حفظ، صف انتظار، إلخ).
    - يلصق مستخدموك URLات أو صوراً أو محتوى طويلاً إلى جانب الأوامر.
    - يمكنك قبول زمن انتظار إضافي في دور الرسالة المباشرة (انظر أدناه).

    اتركه معطلاً عندما:

    - تحتاج إلى أقل زمن انتظار للأوامر في مشغلات الرسائل المباشرة ذات الكلمة الواحدة.
    - تكون كل تدفقاتك أوامر لمرة واحدة بلا متابعات حمولة.

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

    عند تشغيل الراية وعدم وجود `messages.inbound.byChannel.bluebubbles` صريح، تتسع نافذة debounce إلى **2500 ms** (الافتراضي لعدم الدمج هو 500 ms). النافذة الأوسع مطلوبة — وتيرة الإرسال المقسّم لدى Apple التي تبلغ 0.8-2.0 ثانية لا تناسب الافتراضي الأضيق.

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
    - **زمن انتظار إضافي لأوامر التحكم في الرسائل المباشرة.** عند تشغيل الراية، تنتظر رسائل أوامر التحكم في الرسائل المباشرة (مثل `Dump` و`Save` وغيرهما) الآن حتى نافذة debounce قبل الإرسال، تحسباً لوصول Webhook حمولة. تحتفظ أوامر الدردشات الجماعية بالإرسال الفوري.
    - **المخرجات المدمجة محدودة** — النص المدمج محدود بـ 4000 حرف مع علامة `…[truncated]` صريحة؛ والمرفقات محدودة بـ 20؛ وإدخالات المصدر محدودة بـ 10 (يُحتفظ بالأول زائد الأحدث بعد ذلك). لا يزال كل `messageId` مصدر يصل إلى إزالة التكرار الواردة، لذلك يُتعرّف على أي إعادة تشغيل لاحقة من MessagePoller لأي حدث فردي كتكرار.
    - **اختياري، لكل قناة.** لا تتأثر القنوات الأخرى (Telegram، WhatsApp، Slack، …).

  </Tab>
</Tabs>

### السيناريوهات وما يراه الوكيل

| ما يركّبه المستخدم                                                 | ما تسلّمه Apple           | الراية متوقفة (الافتراضي)              | الراية مفعلة + نافذة 2500 ms                                             |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (إرسال واحد)                            | Webhookان بفاصل ~1 ثانية  | دورا وكيل: "Dump" وحدها، ثم URL        | دور واحد: نص مدمج `Dump https://example.com`                            |
| `Save this 📎image.jpg caption` (مرفق + نص)                        | Webhookان                 | دوران                                  | دور واحد: نص + صورة                                                     |
| `/status` (أمر مستقل)                                             | Webhook واحد              | إرسال فوري                             | **انتظار حتى النافذة، ثم إرسال**                                        |
| URL ملصق وحده                                                      | Webhook واحد              | إرسال فوري                             | إرسال فوري (إدخال واحد فقط في الحاوية)                                  |
| نص + URL أُرسلا كرسالتين منفصلتين مقصودتين، بفاصل دقائق          | Webhookان خارج النافذة    | دوران                                  | دوران (تنتهي النافذة بينهما)                                            |
| تدفق سريع (>10 رسائل مباشرة صغيرة داخل النافذة)                   | N Webhookات               | N أدوار                                | دور واحد، مخرجات محدودة (الأول + الأحدث، مع تطبيق حدود النص/المرفقات) |

### استكشاف أخطاء دمج الإرسال المقسّم وإصلاحها

إذا كانت الراية مفعلة ولا تزال عمليات الإرسال المقسّم تصل كدورين، فتحقق من كل طبقة:

<AccordionGroup>
  <Accordion title="تم تحميل الإعدادات فعلاً">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    ثم `openclaw gateway restart` — تُقرأ الراية عند إنشاء سجل debouncer.

  </Accordion>
  <Accordion title="نافذة debounce واسعة بما يكفي لإعدادك">
    انظر إلى سجل خادم BlueBubbles ضمن `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    قِس الفاصل بين إرسال النص بنمط `"Dump"` وإرسال `"https://..."; Attachments:` الذي يليه. ارفع `messages.inbound.byChannel.bluebubbles` ليغطي ذلك الفاصل براحة.

  </Accordion>
  <Accordion title="طوابع JSONL الزمنية للجلسة ≠ وصول Webhook">
    تعكس طوابع أحداث الجلسة الزمنية (`~/.openclaw/agents/<id>/sessions/*.jsonl`) الوقت الذي يسلّم فيه Gateway رسالة إلى الوكيل، **وليس** وقت وصول Webhook. تعني رسالة ثانية موضوعة في الصف وموسومة بـ `[Queued messages while agent was busy]` أن الدور الأول كان لا يزال جارياً عند وصول Webhook الثاني — وكانت حاوية الدمج قد فُرغت بالفعل. اضبط النافذة مقابل سجل خادم BB، وليس سجل الجلسة.
  </Accordion>
  <Accordion title="ضغط الذاكرة يبطئ إرسال الرد">
    على الأجهزة الأصغر (8 GB)، قد تستغرق أدوار الوكيل وقتاً كافياً لتُفرغ حاوية الدمج قبل اكتمال الرد، وينتهي URL كدور ثانٍ في الصف. تحقق من `memory_pressure` و`ps -o rss -p $(pgrep openclaw-gateway)`؛ إذا كان Gateway يتجاوز ~500 MB RSS وكان الضاغط نشطاً، فأغلق العمليات الثقيلة الأخرى أو انتقل إلى مضيف أكبر.
  </Accordion>
  <Accordion title="إرسالات اقتباس الرد مسار مختلف">
    إذا نقر المستخدم على `Dump` كـ **رد** على فقاعة URL موجودة (يعرض iMessage شارة "1 Reply" على فقاعة Dump)، فإن URL موجود في `replyToBody`، وليس في Webhook ثانٍ. لا ينطبق الدمج — فهذا شأن Skill/المطالبة، وليس شأن debouncer.
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

- تُنزّل المرفقات الواردة وتُخزّن في ذاكرة التخزين المؤقت للوسائط.
- حد الوسائط عبر `channels.bluebubbles.mediaMaxMb` للوسائط الواردة والصادرة (الافتراضي: 8 MB).
- يُقسّم النص الصادر إلى `channels.bluebubbles.textChunkLimit` (الافتراضي: 4000 حرف).

## مرجع الإعدادات

الإعدادات الكاملة: [الإعدادات](/ar/gateway/configuration)

<AccordionGroup>
  <Accordion title="الاتصال وWebhook">
    - `channels.bluebubbles.enabled`: فعّل/عطّل القناة.
    - `channels.bluebubbles.serverUrl`: عنوان URL الأساسي لـ BlueBubbles REST API.
    - `channels.bluebubbles.password`: كلمة مرور API.
    - `channels.bluebubbles.webhookPath`: مسار نقطة نهاية Webhook (الافتراضي: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="سياسة الوصول">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: `pairing`).
    - `channels.bluebubbles.allowFrom`: قائمة سماح الرسائل المباشرة (المعرّفات، عناوين البريد الإلكتروني، أرقام E.164، `chat_id:*`، `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (الافتراضي: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: قائمة سماح مرسلي المجموعات.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: على macOS، إثراء مشاركي المجموعات غير المسمّين اختيارياً من جهات الاتصال المحلية بعد اجتياز بوابات السماح. الافتراضي: `false`.
    - `channels.bluebubbles.groups`: إعدادات لكل مجموعة (`requireMention`، إلخ).

  </Accordion>
  <Accordion title="التسليم والتقسيم إلى أجزاء">
    - `channels.bluebubbles.sendReadReceipts`: إرسال إيصالات القراءة (الافتراضي: `true`).
    - `channels.bluebubbles.blockStreaming`: تفعيل البث على شكل كتل (الافتراضي: `false`؛ مطلوب للردود المتدفقة).
    - `channels.bluebubbles.textChunkLimit`: حجم الجزء الصادر بالأحرف (الافتراضي: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: مهلة كل طلب بالمللي ثانية لإرسال النصوص الصادرة عبر `/api/v1/message/text` (الافتراضي: 30000). ارفعها في إعدادات macOS 26 حيث يمكن أن تتوقف عمليات إرسال iMessage عبر Private API لمدة تزيد عن 60 ثانية داخل إطار عمل iMessage؛ مثلًا `45000` أو `60000`. تحافظ المجسات، وعمليات البحث في الدردشات، والتفاعلات، والتعديلات، وفحوصات السلامة حاليًا على الافتراضي الأقصر البالغ 10 ثوانٍ؛ ومن المخطط توسيع التغطية لتشمل التفاعلات والتعديلات في متابعة لاحقة. تجاوز لكل حساب: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: يقسم `length` (الافتراضي) فقط عند تجاوز `textChunkLimit`؛ ويقسم `newline` عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.

  </Accordion>
  <Accordion title="الوسائط والسجل">
    - `channels.bluebubbles.mediaMaxMb`: حد الوسائط الواردة/الصادرة بالميغابايت (الافتراضي: 8).
    - `channels.bluebubbles.mediaLocalRoots`: قائمة سماح صريحة للأدلة المحلية المطلقة المسموح بها لمسارات الوسائط المحلية الصادرة. يتم رفض إرسال المسارات المحلية افتراضيًا ما لم يتم تكوين هذا. تجاوز لكل حساب: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: دمج Webhook للرسائل المباشرة المتتالية من المرسل نفسه في دورة وكيل واحدة، بحيث تصل عملية الإرسال المقسمة من Apple للنص+عنوان URL كرسالة واحدة (الافتراضي: `false`). راجع [دمج الرسائل المباشرة المقسمة](#coalescing-split-send-dms-command--url-in-one-composition) للاطلاع على السيناريوهات، وضبط النافذة، والمفاضلات. يوسع نافذة إزالة الارتداد الافتراضية للوارد من 500 مللي ثانية إلى 2500 مللي ثانية عند التفعيل بدون `messages.inbound.byChannel.bluebubbles` صريح.
    - `channels.bluebubbles.historyLimit`: الحد الأقصى لرسائل المجموعة للسياق (0 يعطلها).
    - `channels.bluebubbles.dmHistoryLimit`: حد سجل الرسائل المباشرة.
    - `channels.bluebubbles.replyContextApiFallback`: عندما يصل رد وارد بدون `replyToBody`/`replyToSender` ولا يجد مخبأ سياق الرد في الذاكرة نتيجة، اجلب الرسالة الأصلية من BlueBubbles HTTP API كخيار احتياطي بأفضل جهد (الافتراضي: `false`). مفيد لعمليات النشر متعددة المثيلات التي تشارك حساب BlueBubbles واحدًا، أو بعد إعادة تشغيل العملية، أو بعد طرد مخبأ TTL/LRU طويل العمر. يخضع الجلب لحماية SSRF بالسياسة نفسها مثل كل طلب عميل BlueBubbles آخر، ولا يرمي خطأ أبدًا، ويملأ المخبأ بحيث تستفيد الردود اللاحقة من ذلك. تجاوز لكل حساب: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. ينتشر إعداد مستوى القناة إلى الحسابات التي تحذف العلم.

  </Accordion>
  <Accordion title="الإجراءات والحسابات">
    - `channels.bluebubbles.actions`: تفعيل/تعطيل إجراءات محددة.
    - `channels.bluebubbles.accounts`: تكوين متعدد الحسابات.

  </Accordion>
</AccordionGroup>

الخيارات العامة ذات الصلة:

- `agents.list[].groupChat.mentionPatterns` (أو `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## العناوين / أهداف التسليم

فضّل `chat_guid` للتوجيه المستقر:

- `chat_guid:iMessage;-;+15555550123` (مفضّل للمجموعات)
- `chat_id:123`
- `chat_identifier:...`
- المعرفات المباشرة: `+15555550123`، `user@example.com`
  - إذا لم يكن للمعرف المباشر دردشة رسائل مباشرة موجودة، فسينشئ OpenClaw واحدة عبر `POST /api/v1/chat/new`. يتطلب ذلك تفعيل BlueBubbles Private API.

### توجيه iMessage مقابل SMS

عندما يكون للمعرف نفسه دردشة iMessage ودردشة SMS على Mac (مثل رقم هاتف مسجل في iMessage لكنه تلقى أيضًا بدائل الفقاعة الخضراء)، يفضّل OpenClaw دردشة iMessage ولا يخفضها بصمت إلى SMS أبدًا. لفرض دردشة SMS، استخدم بادئة هدف `sms:` صريحة (مثل `sms:+15555550123`). لا تزال المعرفات التي لا تملك دردشة iMessage مطابقة تُرسل عبر أي دردشة يبلّغ عنها BlueBubbles.

## الأمان

- تتم مصادقة طلبات Webhook بمقارنة معاملات الاستعلام أو الترويسات `guid`/`password` مع `channels.bluebubbles.password`.
- أبقِ كلمة مرور API ونقطة نهاية Webhook سريتين (عاملها كبيانات اعتماد).
- لا يوجد تجاوز localhost لمصادقة Webhook في BlueBubbles. إذا كنت تمرر حركة Webhook عبر وكيل، فأبقِ كلمة مرور BlueBubbles على الطلب من الطرف إلى الطرف. لا يستبدل `gateway.trustedProxies` هنا `channels.bluebubbles.password`. راجع [أمان Gateway](/ar/gateway/security#reverse-proxy-configuration).
- فعّل HTTPS + قواعد جدار الحماية على خادم BlueBubbles إذا كنت تعرضه خارج شبكة LAN لديك.

## استكشاف الأخطاء وإصلاحها

- إذا توقفت أحداث الكتابة/القراءة عن العمل، فتحقق من سجلات Webhook في BlueBubbles وتأكد من أن مسار Gateway يطابق `channels.bluebubbles.webhookPath`.
- تنتهي صلاحية رموز الاقتران بعد ساعة واحدة؛ استخدم `openclaw pairing list bluebubbles` و`openclaw pairing approve bluebubbles <code>`.
- تتطلب التفاعلات BlueBubbles private API (`POST /api/v1/message/react`)؛ تأكد من أن إصدار الخادم يعرّضها.
- يتطلب التعديل/إلغاء الإرسال macOS 13+ وإصدار خادم BlueBubbles متوافقًا. على macOS 26 (Tahoe)، التعديل معطل حاليًا بسبب تغييرات private API.
- قد تكون تحديثات أيقونة المجموعة غير مستقرة على macOS 26 (Tahoe): قد تعيد API نجاحًا لكن الأيقونة الجديدة لا تتم مزامنتها.
- يخفي OpenClaw تلقائيًا الإجراءات المعروفة بأنها معطلة بناءً على إصدار macOS لخادم BlueBubbles. إذا كان التعديل لا يزال يظهر على macOS 26 (Tahoe)، فعطله يدويًا باستخدام `channels.bluebubbles.actions.edit=false`.
- إذا كان `coalesceSameSenderDms` مفعّلًا لكن عمليات الإرسال المقسمة (مثل `Dump` + URL) لا تزال تصل كدورتين: راجع قائمة تحقق [استكشاف أخطاء دمج الإرسال المقسم وإصلاحها](#split-send-coalescing-troubleshooting) — الأسباب الشائعة هي نافذة إزالة ارتداد ضيقة جدًا، أو قراءة طوابع سجل الجلسة الزمنية خطأً كوقت وصول Webhook، أو إرسال اقتباس رد (والذي يستخدم `replyToBody`، وليس Webhook ثانيًا).
- لمعلومات الحالة/السلامة: `openclaw status --all` أو `openclaw status --deep`.

للمرجع العام لسير عمل القنوات، راجع [القنوات](/ar/channels) ودليل [Plugins](/ar/tools/plugin).

## ذات صلة

- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعة وبوابة الإشارات
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
