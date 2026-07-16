---
read_when:
    - إعداد Slack أو تصحيح أخطاء وضع المقبس أو HTTP أو الترحيل في Slack
summary: إعداد Slack وسلوك وقت التشغيل (وضع Socket، وعناوين URL لطلبات HTTP، ووضع الترحيل)
title: Slack
x-i18n:
    generated_at: "2026-07-16T13:26:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b0b3c4ddcd4ea46448bf4fcba4713a92cd487a3ab69077f6b808fbcc65608c7f
    source_path: channels/slack.md
    workflow: 16
---

يغطي دعم Slack الرسائل المباشرة والقنوات عبر تكاملات تطبيق Slack. وسيلة النقل الافتراضية هي Socket Mode؛ كما تُدعَم عناوين URL لطلبات HTTP. أما وضع الترحيل فهو مخصص لعمليات النشر المُدارة التي يتولى فيها موجّه موثوق استقبال حركة Slack الواردة.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تستخدم رسائل Slack المباشرة وضع الاقتران افتراضيًا.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلية ودليل الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    إجراءات تشخيص المشكلات وإصلاحها عبر القنوات.
  </Card>
</CardGroup>

## اختيار وسيلة النقل

يوفر Socket Mode وعناوين URL لطلبات HTTP تكافؤًا في الميزات للمراسلة وأوامر الشرطة المائلة وApp Home والتفاعلات. اختر وفقًا لبنية النشر، لا وفقًا للميزات.

| الاعتبار                      | Socket Mode (الافتراضي)                                                                                                                                | عناوين URL لطلبات HTTP                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| عنوان URL العام للـ Gateway           | غير مطلوب                                                                                                                                         | مطلوب (DNS أو TLS أو وكيل عكسي أو نفق)                                                                   |
| الشبكة الصادرة             | يجب أن يكون اتصال WSS الصادر إلى `wss-primary.slack.com` متاحًا                                                                                            | لا يوجد WS صادر؛ HTTPS وارد فقط                                                                             |
| الرموز المطلوبة                | رمز البوت + App-Level Token مع `connections:write`                                                                                                 | رمز البوت + Signing Secret                                                                                     |
| حاسوب التطوير المحمول / خلف جدار حماية | يعمل كما هو                                                                                                                                          | يحتاج إلى نفق عام (ngrok أو Cloudflare Tunnel أو Tailscale Funnel) أو Gateway مرحلي                          |
| التوسع الأفقي           | جلسة Socket Mode واحدة لكل تطبيق على كل مضيف؛ تحتاج وحدات Gateway المتعددة إلى تطبيقات Slack منفصلة                                                                 | معالج POST عديم الحالة؛ يمكن لنسخ Gateway المتعددة مشاركة تطبيق واحد خلف موازن تحميل                     |
| حسابات متعددة على Gateway واحد | مدعوم؛ يفتح كل حساب اتصال WS خاصًا به                                                                                                             | مدعوم؛ يحتاج كل حساب إلى `webhookPath` فريد (الافتراضي `/slack/events`) كي لا تتعارض عمليات التسجيل |
| نقل أوامر الشرطة المائلة      | تُسلَّم عبر اتصال WS؛ ويُتجاهل `slash_commands[].url`                                                                                  | يرسل Slack طلبات POST إلى `slash_commands[].url`؛ والحقل مطلوب لتوجيه الأمر                           |
| توقيع الطلبات              | غير مستخدم (المصادقة عبر App-Level Token)                                                                                                               | يوقّع Slack كل طلب؛ ويتحقق OpenClaw منه باستخدام `signingSecret`                                              |
| الاسترداد عند انقطاع الاتصال  | تكون إعادة الاتصال التلقائية في Slack SDK مفعّلة؛ كما يعيد OpenClaw تشغيل جلسات Socket Mode الفاشلة باستخدام تراجع متزايد محدود. ويُطبّق ضبط وسيلة النقل الخاص بانتهاء مهلة Pong. | لا يوجد اتصال دائم لينقطع؛ تتم إعادة المحاولة لكل طلب من Slack                                           |

<Note>
  **اختر Socket Mode** للمضيفين ذوي Gateway واحد، وحواسيب التطوير المحمولة، والشبكات المحلية التي يمكنها الوصول إلى `*.slack.com` باتجاه صادر، لكنها لا تستطيع قبول HTTPS الوارد.

**اختر عناوين URL لطلبات HTTP** عند تشغيل نسخ متعددة من Gateway خلف موازن تحميل، أو عندما يكون WSS الصادر محظورًا بينما يُسمح بـ HTTPS الوارد، أو عندما تنهي بالفعل Webhooks الخاصة بـ Slack عند وكيل عكسي.
</Note>

<Warning>
  يمكن لـ Slack الحفاظ على اتصالات Socket Mode متعددة لتطبيق واحد، وقد يسلّم كل حمولة إلى أي اتصال منها. لذلك تحتاج وحدات Gateway المنفصلة لـ OpenClaw التي تشترك في تطبيق Slack واحد إلى إعدادات توجيه وتخويل متكافئة. وإلا فاستخدم تطبيق Slack منفصلًا لكل Gateway، أو نقطة استقبال ترحيل واحدة، أو عناوين URL لطلبات HTTP خلف موازن تحميل. راجع [استخدام Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections).
</Warning>

### وضع الترحيل

يفصل وضع الترحيل استقبال حركة Slack الواردة عن Gateway الخاص بـ OpenClaw. يتولى موجّه موثوق اتصال Slack Socket Mode الوحيد، ويختار Gateway وجهة، ويمرر حدثًا محدد النوع عبر websocket موثَّق. ويظل Gateway يستخدم رمز البوت الخاص به لاستدعاءات Slack Web API الصادرة.

```json5
{
  channels: {
    slack: {
      mode: "relay",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      relay: {
        url: "wss://router.example.com/gateway/ws",
        authToken: { source: "env", provider: "default", id: "SLACK_RELAY_AUTH_TOKEN" },
        gatewayId: "team-gateway",
      },
    },
  },
}
```

يجب أن يستخدم عنوان URL للترحيل `wss://` ما لم يكن يستهدف localhost. تعامل مع رمز الحامل وجدول مسارات الموجّه بوصفهما جزءًا من حدود تخويل Slack: تدخل الأحداث الموجّهة إلى معالج رسائل Slack المعتاد كتفعيلات مخوّلة. يمكن أن يضبط `slack_identity` المقدم من الموجّه في إطار websocket من نوع `hello` اسم المستخدم والأيقونة الافتراضيين للإرسال؛ وتظل الأولوية لهوية صريحة يقدمها المستدعي. يعيد اتصال الترحيل الاتصال باستخدام توقيت التراجع المتزايد المحدود نفسه المستخدم في Socket Mode، ويمسح الهوية المقدمة من الموجّه كلما انقطع الاتصال.

### عمليات التثبيت على مستوى مؤسسة Enterprise Grid

يمكن لحساب Slack واحد استقبال الرسائل من كل مساحة عمل يشملها تثبيت على مستوى مؤسسة Enterprise Grid. اختر Socket Mode المباشر أو عناوين URL لطلبات HTTP؛ فالوضع المرحّل غير مدعوم لحسابات المؤسسات. لا يفعّل كلا بياني الحد الأدنى من الامتيازات أدناه سوى مسار أحداث V1 من نوع `message` و`app_mention`، والردود الفورية، وتفاعلات الحالة التي يملكها المستمع.

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "موصل Slack لـ OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

اطلب من Enterprise Grid Org Admin أو Org Owner الموافقة على التطبيق وتثبيته على مستوى المؤسسة واختيار مساحات العمل التي يشملها التثبيت. تأكد من توفر التطبيق في كل مساحة عمل مقصودة قبل بدء OpenClaw. أنشئ رمزًا على مستوى التطبيق مع `connections:write` لـ Socket Mode، ثم انسخ رمز البوت من تثبيت المؤسسة. اضبط الحساب الذي يستخدم رمز البوت المثبّت على مستوى المؤسسة:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      enterpriseOrgInstall: true,
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

#### عناوين URL لطلبات HTTP

استخدم وضع HTTP عندما تكون لدى Gateway نقطة نهاية HTTPS عامة ولا تفتح اتصال Socket Mode. استبدل عنوان URL في المثال بعنوان URL العام `webhookPath` للـ Gateway (الافتراضي `/slack/events`):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "موصل Slack لـ OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

اطلب من Enterprise Grid Org Admin أو Org Owner الموافقة على التطبيق وتثبيته على مستوى المؤسسة واختيار مساحات العمل التي يشملها التثبيت. بعد أن يتحقق Slack من Request URL، انسخ رمز البوت الخاص بتثبيت المؤسسة و**Basic Information -> App Credentials -> Signing Secret** الخاص بالتطبيق. اضبط حساب المؤسسة باستخدام مسار Request URL نفسه:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      enterpriseOrgInstall: true,
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: {
        source: "env",
        provider: "default",
        id: "SLACK_SIGNING_SECRET",
      },
      webhookPath: "/slack/events",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

عند بدء التشغيل، يتحقق OpenClaw من `enterpriseOrgInstall` باستخدام `auth.test` الخاص بـ Slack. يفشل بدء التشغيل عند استخدام رمز مثبّت على مستوى المؤسسة من دون العلامة، أو رمز مساحة عمل مع العلامة. يظل Slack مصدر الحقيقة بشأن مساحات العمل التي منحت التثبيت؛ ثم يطبق OpenClaw سياسات القنوات والمستخدمين والرسائل المباشرة والإشارات المضبوطة على كل حدث يتم تسليمه. يرفض Enterprise V1 جميع أحداث `message` و`app_mention` التي أنشأها البوت قبل التوجيه، بصرف النظر عن `allowBots`، لأن عمليات التثبيت على مستوى المؤسسة لا توفر هوية بوت مستقرة مؤهلة بمساحة العمل لمنع الحلقات.

يقتصر دعم المؤسسات عمدًا على أحداث `message` و`app_mention` عبر Socket Mode المباشر أو HTTP وردودها الفورية. لا يتوفر للحساب المؤسسي وضع الترحيل، أو أوامر الشرطة المائلة، أو التفاعلات، أو App Home، أو مستمعو أحداث التفاعلات، أو التثبيتات، أو أدوات إجراءات Slack، أو الموافقات الأصلية في Slack، أو الارتباطات، أو التسليم في قائمة انتظار أو المجدول، أو عمليات الإرسال الاستباقية. تُدعَم تفاعلات الإقرار والكتابة والحالة الصادرة عبر عميل Slack الذي يملكه المستمع، وتتطلب `reactions:write`؛ بينما تظل إشعارات التفاعلات الواردة وأدوات إجراءات التفاعلات غير متاحة.

تعيد الردود الفورية استخدام سلوك التسليم القياسي في Slack للمقاطع،
والوسائط، والبيانات الوصفية، والرجوع الاحتياطي للهوية، ومعاينات الروابط، وإيصالات الاستلام، ولكن فقط ما دام
العميل الذي يملكه المستمع بعد التحقق منه ضمن دورة الحدث النشطة. يُقسَّم
صف الإرسال في الذاكرة وسجلات المشاركة في سلاسل المحادثات بحسب مساحة عمل ذلك
الحدث؛ ولا يُسلسَل العميل نفسه أو يُحفَظ مطلقًا.

يجب أن تستخدم مفاتيح سياسة القنوات وإدخالات `dm.groupChannels` معرّفات قنوات Slack الثابتة الخام أو
صيغة `channel:<id>`. يطبّع OpenClaw كلتا الصيغتين إلى معرّف القناة الخام من أجل
المطابقة في وقت التشغيل؛ وتتسبب البادئات `slack:` و`group:` و`mpim:` في فشل بدء التشغيل.
يجب أن تستخدم إدخالات سياسة المستخدمين معرّفات مستخدمي Slack الثابتة؛ وتتسبب الأسماء والأسماء المختصرة وأسماء العرض
وعناوين البريد الإلكتروني في فشل بدء التشغيل. يجب أن تستخدم المعرّفات بادئة Slack الأساسية بالأحرف الكبيرة
ومتنها (على سبيل المثال، `C0123456789` أو `U0123456789`)؛ وتتسبب الأحرف الصغيرة
والمعرّفات القصيرة المشابهة في فشل بدء التشغيل. لا يمكن لحسابات المؤسسة تمكين
`dangerouslyAllowNameMatching`. يمكن لحسابات المؤسسة تعيين
`mentionPatterns.mode` العام، لكن `mentionPatterns.allowIn` و
`mentionPatterns.denyIn` يتسببان في فشل بدء التشغيل لأن معرّفات قنوات Slack المجرّدة غير
مؤهلة بمساحة العمل ويمكن إعادة استخدامها عبر مساحات العمل. تحتفظ عمليات التثبيت في مساحات العمل
بسلوك نمط الإشارة المحدد النطاق الحالي. تحصل كل مساحة عمل مقبولة
على هوية منفصلة للتوجيه والجلسة والنص المنسوخ وإزالة التكرار والسجل وذاكرة التخزين المؤقت،
حتى عندما تتداخل معرّفات Slack. ضمن تدفق `message`، تُدعَم رسائل المستخدمين العادية
وأحداث `file_share` التي أنشأها المستخدمون؛ وتُرفض الأنواع الفرعية الأخرى للرسائل
قبل التفويض أو معالجة أحداث النظام.

يجب إما تعطيل الرسائل المباشرة للمؤسسة (`dm.enabled=false` أو
`dmPolicy="disabled"`) أو فتحها صراحةً باستخدام `dmPolicy="open"` و
قيمة `allowFrom` فعالة للحساب تحتوي على القيمة الحرفية `"*"`. تؤدي
قائمة سماح فارغة أو معرّفات خاصة بمستخدمين من دون `"*"` إلى فشل بدء التشغيل. يُرفض الاقتران
وقوائم السماح للرسائل المباشرة لكل مستخدم لأن معرّفات مستخدمي Slack غير
مؤهلة بمساحة العمل في مخازن التفويض تلك. يستمر تطبيق سياسة القناة والمرسل
على رسائل القنوات.

## التثبيت

```bash
openclaw plugins install @openclaw/slack
```

يسجّل `plugins install` الـ Plugin ويمكّنه. ولا يفعل شيئًا حتى تهيئ تطبيق Slack وإعدادات القناة أدناه. راجع [Plugins](/ar/tools/plugin) للاطلاع على القواعد العامة لتثبيت الـ Plugin.

## الإعداد السريع

تنشئ ملفات البيان في هذا القسم عملية تثبيت محددة النطاق بمساحة العمل. بالنسبة إلى
عملية تثبيت على مستوى مؤسسة Enterprise Grid، استخدم بدلًا من ذلك
[ملف البيان وسير العمل على مستوى المؤسسة](#enterprise-grid-org-wide-installs) المخصصين.

<Tabs>
  <Tab title="وضع المقبس (الافتراضي)">
    <Steps>
      <Step title="إنشاء تطبيق Slack جديد">
        افتح [api.slack.com/apps](https://api.slack.com/apps/new) ← **Create New App** ← **From a manifest** ← حدّد مساحة عملك ← الصق أحد ملفّي البيان أدناه ← **Next** ← **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "موصل Slack لـ OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "يربط OpenClaw سلاسل محادثات مساعد Slack بوكلاء OpenClaw.",
      "suggested_prompts": [
        { "title": "ما الذي يمكنك فعله؟", "message": "بماذا يمكنك مساعدتي؟" },
        {
          "title": "تلخيص هذه القناة",
          "message": "لخّص النشاط الأخير في هذه القناة."
        },
        { "title": "صياغة رد", "message": "ساعدني في صياغة رد." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "إرسال رسالة إلى OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

```json Minimal
{
  "display_information": {
    "name": "OpenClaw",
    "description": "موصل Slack لـ OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "يربط OpenClaw سلاسل محادثات مساعد Slack بوكلاء OpenClaw.",
      "suggested_prompts": [
        { "title": "ما الذي يمكنك فعله؟", "message": "بماذا يمكنك مساعدتي؟" },
        {
          "title": "تلخيص هذه القناة",
          "message": "لخّص النشاط الأخير في هذه القناة."
        },
        { "title": "صياغة رد", "message": "ساعدني في صياغة رد." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "إرسال رسالة إلى OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    }
  }
}
```

        </CodeGroup>

        <Note>
          يطابق الخيار **Recommended** مجموعة الميزات الكاملة لـ Plugin Slack: App Home، والأوامر المائلة، والملفات، والتفاعلات، والعناصر المثبتة، والرسائل المباشرة الجماعية، وقراءة الرموز التعبيرية/مجموعات المستخدمين. اختر **Minimal** عندما تقيّد سياسة مساحة العمل النطاقات — فهو يغطي الرسائل المباشرة، وسجل القنوات/المجموعات، والإشارات، والأوامر المائلة، لكنه يستبعد الملفات والتفاعلات والعناصر المثبتة والرسائل المباشرة الجماعية (`mpim:*`) و`emoji:read` و`usergroups:read`. راجع [قائمة التحقق من ملف البيان والنطاقات](#manifest-and-scope-checklist) لمعرفة مبررات كل نطاق والخيارات الإضافية مثل الأوامر المائلة الإضافية.
        </Note>

        بعد أن ينشئ Slack التطبيق:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: أضف `connections:write`، ثم احفظ وانسخ App-Level Token.
        - **Install App -> Install to Workspace**: انسخ Bot User OAuth Token.

      </Step>

      <Step title="تهيئة OpenClaw">

        إعداد SecretRef الموصى به:

```bash
export SLACK_APP_TOKEN=slack-app-token-example
export SLACK_BOT_TOKEN=slack-bot-token-example
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        الرجوع الاحتياطي إلى متغيرات البيئة (الحساب الافتراضي فقط):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="بدء Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="عناوين URL لطلبات HTTP">
    <Steps>
      <Step title="إنشاء تطبيق Slack جديد">
        افتح [api.slack.com/apps](https://api.slack.com/apps/new) ← **Create New App** ← **From a manifest** ← حدّد مساحة عملك ← الصق أحد ملفّي البيان أدناه ← استبدل `https://gateway-host.example.com/slack/events` بعنوان URL العام لـ Gateway لديك ← **Next** ← **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "موصل Slack لـ OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "يربط OpenClaw سلاسل محادثات مساعد Slack بوكلاء OpenClaw.",
      "suggested_prompts": [
        { "title": "ما الذي يمكنك فعله؟", "message": "بماذا يمكنك مساعدتي؟" },
        {
          "title": "تلخيص هذه القناة",
          "message": "لخّص النشاط الأخير في هذه القناة."
        },
        { "title": "صياغة رد", "message": "ساعدني في صياغة رد." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "إرسال رسالة إلى OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

```json Minimal
{
  "display_information": {
    "name": "OpenClaw",
    "description": "موصل Slack لـ OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "يربط OpenClaw سلاسل مساعد Slack بوكلاء OpenClaw.",
      "suggested_prompts": [
        { "title": "ما الذي يمكنك فعله؟", "message": "بماذا يمكنك مساعدتي؟" },
        {
          "title": "لخّص هذه القناة",
          "message": "لخّص النشاط الأخير في هذه القناة."
        },
        { "title": "صياغة رد", "message": "ساعدني في صياغة رد." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "إرسال رسالة إلى OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

        </CodeGroup>

        <Note>
          يطابق الخيار **الموصى به** مجموعة الميزات الكاملة لـ Plugin ‏Slack؛ بينما يستبعد الخيار **الحد الأدنى** الملفات والتفاعلات والدبابيس والرسائل المباشرة الجماعية (`mpim:*`) و`emoji:read` و`usergroups:read` لمساحات العمل المقيّدة. راجع [قائمة التحقق من البيان والنطاقات](#manifest-and-scope-checklist) لمعرفة مبررات كل نطاق.
        </Note>

        <Info>
          تشير حقول URL الثلاثة (`slash_commands[].url` و`event_subscriptions.request_url` و`interactivity.request_url` / `message_menu_options_url`) جميعها إلى نقطة نهاية OpenClaw نفسها. يتطلب مخطط بيان Slack تسميتها على نحو منفصل، لكن OpenClaw يوجّهها حسب نوع الحمولة، لذا يكفي `webhookPath` واحد (القيمة الافتراضية `/slack/events`). لا تنفّذ أوامر الشرطة المائلة التي لا تحتوي على `slash_commands[].url` أي إجراء بصمت في وضع HTTP.
        </Info>

        بعد أن ينشئ Slack التطبيق:

        - **Basic Information → App Credentials**: انسخ **Signing Secret** للتحقق من الطلبات.
        - **Install App -> Install to Workspace**: انسخ Bot User OAuth Token.

      </Step>

      <Step title="تهيئة OpenClaw">

        إعداد SecretRef الموصى به:

```bash
export SLACK_BOT_TOKEN=slack-bot-token-example
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        استخدم مسارات Webhook فريدة لوضع HTTP متعدد الحسابات

        امنح كل حساب `webhookPath` مميزًا (القيمة الافتراضية `/slack/events`) حتى لا تتعارض التسجيلات.
        </Note>

      </Step>

      <Step title="تشغيل Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## ضبط نقل وضع Socket

يضبط OpenClaw مهلة انتظار pong لعميل Slack SDK على 15 ثانية افتراضيًا في وضع Socket. لا تتجاوز إعدادات النقل إلا عند الحاجة إلى ضبط خاص بمساحة العمل أو المضيف:

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

استخدم هذا فقط لمساحات العمل في وضع Socket التي تسجّل انتهاء مهلات pong أو server-ping لاتصال Slack عبر websocket، أو التي تعمل على مضيفين يعانون من تجويع معروف لحلقة الأحداث. يمثّل `clientPingTimeout` مدة انتظار pong بعد أن يرسل SDK اختبار اتصال من العميل؛ ويمثّل `serverPingTimeout` مدة انتظار اختبارات الاتصال من خادم Slack. تظل رسائل التطبيق وأحداثه حالةً للتطبيق، وليست إشارات لحيوية النقل.

ملاحظات:

- يتم تجاهل `socketMode` في وضع HTTP Request URL.
- تنطبق إعدادات `channels.slack.socketMode` الأساسية على جميع حسابات Slack ما لم يتم تجاوزها. تستخدم التجاوزات الخاصة بكل حساب `channels.slack.accounts.<accountId>.socketMode`؛ ونظرًا إلى أن هذا تجاوز كائن، فأدرج كل حقل من حقول ضبط Socket الذي تريده لذلك الحساب.
- لا يملك قيمة OpenClaw افتراضية (`15000`) سوى `clientPingTimeout`. لا يتم تمرير `serverPingTimeout` و`pingPongLoggingEnabled` إلى Slack SDK إلا عند تهيئتهما.
- يبدأ التراجع بين محاولات إعادة تشغيل وضع Socket من نحو 2 ثانية ويبلغ حده الأقصى عند نحو 30 ثانية. تُعاد محاولة إخفاقات البدء وانتظار البدء وانقطاع الاتصال القابلة للاسترداد حتى تتوقف القناة. أما أخطاء الحساب وبيانات الاعتماد الدائمة، مثل المصادقة غير الصالحة أو الرموز المميزة الملغاة أو النطاقات المفقودة، فتفشل سريعًا بدلًا من إعادة المحاولة إلى الأبد.

## قائمة التحقق من البيان والنطاقات

بيان تطبيق Slack الأساسي هو نفسه لوضع Socket وعناوين URL لطلبات HTTP. لا يختلف سوى مقطع `settings` (و`url` لأمر الشرطة المائلة).

البيان الأساسي (وضع Socket افتراضيًا):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "موصل Slack لـ OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "يربط OpenClaw سلاسل مساعد Slack بوكلاء OpenClaw.",
      "suggested_prompts": [
        { "title": "ما الذي يمكنك فعله؟", "message": "بماذا يمكنك مساعدتي؟" },
        {
          "title": "لخّص هذه القناة",
          "message": "لخّص النشاط الأخير في هذه القناة."
        },
        { "title": "صياغة رد", "message": "ساعدني في صياغة رد." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "إرسال رسالة إلى OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

بالنسبة إلى **وضع عناوين URL لطلبات HTTP**، استبدل `settings` بنسخة HTTP وأضف `url` إلى كل أمر شرطة مائلة. يلزم عنوان URL عام:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "إرسال رسالة إلى OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### إعدادات إضافية للبيان

اعرض ميزات مختلفة توسّع الإعدادات الافتراضية المذكورة أعلاه.

يفعّل البيان الافتراضي علامة تبويب **Home** في Slack App Home ويشترك في `app_home_opened`. عندما يفتح عضو في مساحة العمل علامة التبويب Home، ينشر OpenClaw عرض Home افتراضيًا آمنًا باستخدام `views.publish`؛ ولا يتم تضمين أي حمولة محادثة أو تهيئة خاصة. عند تفعيل وضع أمر الشرطة المائلة الواحد، يستخدم تلميح الأمر `channels.slack.slashCommand.name`؛ أما عمليات التثبيت التي تستخدم أوامر أصلية أو لا تستخدم أوامر شرطة مائلة فتحذف ذلك التلميح. تظل علامة التبويب **Messages** مفعّلة لرسائل Slack المباشرة. يفعّل البيان أيضًا سلاسل مساعد Slack باستخدام `features.assistant_view` و`assistant:write` و`assistant_thread_started` و`assistant_thread_context_changed`؛ وتُوجَّه سلاسل المساعد إلى جلسات سلاسل OpenClaw الخاصة بها، مع إبقاء سياق السلسلة الذي يوفّره Slack متاحًا للوكيل.

<AccordionGroup>
  <Accordion title="أوامر شرطة مائلة أصلية اختيارية">

    يمكن استخدام عدة [أوامر شرطة مائلة أصلية](#commands-and-slash-behavior) بدلًا من أمر واحد مهيأ، مع بعض التفاصيل:

    - استخدم `/agentstatus` بدلًا من `/status` لأن الأمر `/status` محجوز.
    - لا يمكن تسجيل أكثر من 25 أمر شرطة مائلة في تطبيق Slack واحد في الوقت نفسه (حد منصة Slack).

    استبدل مقطع `features.slash_commands` الحالي لديك بمجموعة فرعية من [الأوامر المتاحة](/ar/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="وضع Socket (الافتراضي)">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "بدء جلسة جديدة",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "إعادة تعيين الجلسة الحالية"
    },
    {
      "command": "/compact",
      "description": "ضغط سياق الجلسة",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "إيقاف التشغيل الحالي"
    },
    {
      "command": "/session",
      "description": "إدارة انتهاء صلاحية ربط سلسلة المحادثة",
      "usage_hint": "خمول <duration|off> أو أقصى عمر <duration|off>"
    },
    {
      "command": "/think",
      "description": "تعيين مستوى التفكير",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "تبديل الإخراج المفصّل",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "عرض الوضع السريع أو تعيينه",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "تبديل ظهور الاستدلال",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "تبديل الوضع ذي الصلاحيات المرتفعة",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "عرض الإعدادات الافتراضية للتنفيذ أو تعيينها",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/approve",
      "description": "الموافقة على طلبات الموافقة المعلّقة أو رفضها",
      "usage_hint": "<id> <decision>"
    },
    {
      "command": "/model",
      "description": "عرض النموذج أو تعيينه",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "إدراج الموفّرين/النماذج",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "عرض ملخص المساعدة القصير"
    },
    {
      "command": "/commands",
      "description": "عرض دليل الأوامر المُنشأ"
    },
    {
      "command": "/tools",
      "description": "عرض ما يمكن للوكيل الحالي استخدامه الآن",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "عرض حالة وقت التشغيل، بما في ذلك استخدام الموفّر/الحصة عند توفرهما"
    },
    {
      "command": "/tasks",
      "description": "إدراج مهام الخلفية النشطة/الحديثة للجلسة الحالية"
    },
    {
      "command": "/context",
      "description": "شرح كيفية تجميع السياق",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "عرض هوية المُرسِل الخاصة بك"
    },
    {
      "command": "/skill",
      "description": "تشغيل مهارة بالاسم",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "طرح سؤال جانبي دون تغيير سياق الجلسة",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "طرح سؤال جانبي دون تغيير سياق الجلسة",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "التحكم في تذييل الاستخدام أو عرض ملخص التكلفة",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="عناوين URL لطلبات HTTP">
        استخدم قائمة `slash_commands` نفسها كما في Socket Mode أعلاه، وأضف `"url": "https://gateway-host.example.com/slack/events"` إلى كل إدخال. مثال:

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "بدء جلسة جديدة",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "عرض ملخص المساعدة القصير",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        كرّر قيمة `url` هذه في كل أمر في القائمة.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="نطاقات التأليف الاختيارية (عمليات الكتابة)">
    أضف نطاق البوت `chat:write.customize` إذا أردت أن تستخدم الرسائل الصادرة هوية الوكيل النشط (اسم مستخدم وأيقونة مخصصان) بدلًا من هوية تطبيق Slack الافتراضية.

    إذا استخدمت أيقونة رمز تعبيري، فإن Slack يتوقع صيغة `:emoji_name:`.

  </Accordion>
  <Accordion title="نطاقات رمز المستخدم الاختيارية (عمليات القراءة)">
    إذا ضبطت `channels.slack.userToken`، فإن نطاقات القراءة المعتادة هي:

    - `channels:history`، `groups:history`، `im:history`، `mpim:history`
    - `channels:read`، `groups:read`، `im:read`، `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (إذا كنت تعتمد على عمليات قراءة البحث في Slack)

  </Accordion>
</AccordionGroup>

## نموذج الرموز

- `botToken` + `appToken` مطلوبان لـ Socket Mode.
- يتطلب وضع HTTP ‏`botToken` + `signingSecret`.
- يتطلب وضع الترحيل `botToken` بالإضافة إلى `relay.url` و`relay.authToken` و`relay.gatewayId`؛ ولا يستخدم رمز تطبيق أو سر توقيع.
- تقبل `botToken` و`appToken` و`signingSecret` و`relay.authToken` و`userToken` سلاسل نصية
  عادية أو كائنات SecretRef.
- تتجاوز رموز الإعدادات القيم الاحتياطية لمتغيرات البيئة.
- تنطبق القيم الاحتياطية لمتغيرات البيئة `SLACK_BOT_TOKEN` و`SLACK_APP_TOKEN` و`SLACK_USER_TOKEN` كلٌّ منها على الحساب الافتراضي فقط.
- تكون القيمة الافتراضية لـ `userToken` سلوك القراءة فقط (`userTokenReadOnly: true`).

سلوك لقطة الحالة:

- يتتبع فحص حساب Slack حقلي `*Source` و`*Status` لكل بيانات اعتماد
  (`botToken`، `appToken`، `signingSecret`، `userToken`).
- تكون الحالة `available` أو `configured_unavailable` أو `missing`.
- تعني `configured_unavailable` أن الحساب مضبوط عبر SecretRef
  أو مصدر أسرار آخر غير مضمّن، لكن مسار الأمر/وقت التشغيل الحالي
  تعذّر عليه تحليل القيمة الفعلية.
- في وضع HTTP، تُضمَّن `signingSecretStatus`؛ أما في Socket Mode، فالزوج
  المطلوب هو `botTokenStatus` + `appTokenStatus`.

<Tip>
بالنسبة إلى الإجراءات/قراءات الدليل، يمكن تفضيل رمز المستخدم عند ضبطه. أما للكتابة، فيظل رمز البوت هو المفضّل؛ ولا يُسمح بالكتابة باستخدام رمز المستخدم إلا عندما تكون `userTokenReadOnly: false` ويكون رمز البوت غير متاح.
</Tip>

## الإجراءات والبوابات

تتحكم `channels.slack.actions.*` في إجراءات Slack.

مجموعات الإجراءات المتاحة في أدوات Slack الحالية:

| المجموعة   | الإعداد الافتراضي |
| ---------- | ------- |
| messages   | مفعّلة |
| reactions  | مفعّلة |
| pins       | مفعّلة |
| memberInfo | مفعّلة |
| emojiList  | مفعّلة |

تتضمن إجراءات رسائل Slack الحالية `send` و`upload-file` و`download-file` و`read` و`edit` و`delete` و`pin` و`unpin` و`list-pins` و`member-info` و`emoji-list`. تقبل `download-file` معرّفات ملفات Slack المعروضة في العناصر النائبة للملفات الواردة، وتعيد معاينات للصور أو بيانات وصفية للملف المحلي للأنواع الأخرى من الملفات.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    تتحكم `channels.slack.dmPolicy` في الوصول إلى الرسائل المباشرة. وتمثل `channels.slack.allowFrom` قائمة السماح الأساسية للرسائل المباشرة.

    - `pairing` (الإعداد الافتراضي)
    - `allowlist`
    - `open` (تتطلب أن تتضمن `channels.slack.allowFrom` القيمة `"*"`)
    - `disabled`

    علامات الرسائل المباشرة:

    - `dm.enabled` (القيمة الافتراضية true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (قديمة)
    - `dm.groupEnabled` (القيمة الافتراضية للرسائل المباشرة الجماعية false)
    - `dm.groupChannels` (قائمة سماح اختيارية لـ MPIM)

    أولوية الحسابات المتعددة:

    - تنطبق `channels.slack.accounts.default.allowFrom` على حساب `default` فقط.
    - ترث الحسابات المسماة `channels.slack.allowFrom` عندما لا تكون `allowFrom` الخاصة بها معيّنة.
    - لا ترث الحسابات المسماة `channels.slack.accounts.default.allowFrom`.

    لا تزال `channels.slack.dm.policy` و`channels.slack.dm.allowFrom` القديمتان تُقرآن لأغراض التوافق. تنقلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يمكنها فعل ذلك دون تغيير الوصول.

    يستخدم الاقتران في الرسائل المباشرة `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="سياسة القنوات">
    تتحكم `channels.slack.groupPolicy` في معالجة القنوات:

    - `open`
    - `allowlist`
    - `disabled`

    توجد قائمة السماح للقنوات ضمن `channels.slack.channels`، و**يجب أن تستخدم معرّفات قنوات Slack الثابتة** (مثل `C12345678`) كمفاتيح للإعدادات.

    ملاحظة حول وقت التشغيل: إذا كانت `channels.slack` مفقودة تمامًا (إعداد يعتمد على متغيرات البيئة فقط)، يعود وقت التشغيل إلى `groupPolicy="allowlist"` ويسجّل تحذيرًا (حتى إذا كانت `channels.defaults.groupPolicy` معيّنة).

    تحليل الاسم/المعرّف:

    - يتم تحليل إدخالات قائمة السماح للقنوات وإدخالات قائمة السماح للرسائل المباشرة عند بدء التشغيل عندما يسمح الوصول إلى الرمز بذلك
    - تُحتفظ بإدخالات أسماء القنوات التي تعذّر تحليلها كما ضُبطت، لكنها تُتجاهل في التوجيه افتراضيًا
    - تعطي مصادقة الرسائل الواردة وتوجيه القنوات الأولوية للمعرّف افتراضيًا؛ وتتطلب المطابقة المباشرة لاسم المستخدم/الاسم المختصر `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    لا تتطابق المفاتيح المستندة إلى الاسم (`#channel-name` أو `channel-name`) ضمن `groupPolicy: "allowlist"`. يعطي البحث عن القناة الأولوية للمعرّف افتراضيًا، لذلك لن ينجح توجيه مفتاح مستند إلى الاسم أبدًا، وستُحظر جميع الرسائل في تلك القناة بصمت. يختلف هذا عن `groupPolicy: "open"`، حيث لا يكون مفتاح القناة مطلوبًا للتوجيه ويبدو أن المفتاح المستند إلى الاسم يعمل.

    استخدم دائمًا معرّف قناة Slack بوصفه المفتاح. للعثور عليه: انقر بزر الماوس الأيمن على القناة في Slack ← **Copy link** — يظهر المعرّف (`C...`) في نهاية عنوان URL.

    صحيح:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```

    غير صحيح (يُحظر بصمت ضمن `groupPolicy: "allowlist"`):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="الإشارات ومستخدمو القنوات">
    تتطلب رسائل القنوات إشارة افتراضيًا.

    مصادر الإشارات:

    - إشارة صريحة إلى التطبيق (`<@botId>`)
    - إشارة إلى مجموعة مستخدمي Slack ‏(`<!subteam^S...>`) عندما يكون مستخدم البوت عضوًا في مجموعة المستخدمين تلك؛ وتتطلب `usergroups:read`
    - أنماط التعبيرات النمطية للإشارات (`agents.list[].groupChat.mentionPatterns`، والقيمة الاحتياطية `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني على سلسلة محادثة البوت (يُعطّل عندما تكون `thread.requireExplicitMention` هي `true`)

    عناصر التحكم لكل قناة (`channels.slack.channels.<id>`؛ الأسماء فقط عبر التحليل عند بدء التشغيل أو `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode` (`off|first|all|batched`؛ تتجاوز وضع الرد للحساب/نوع المحادثة لهذه القناة)
    - `users` (قائمة السماح)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`، `toolsBySender`
    - تنسيق مفتاح `toolsBySender`:‏ `channel:` أو `id:` أو `e164:` أو `username:` أو `name:` أو حرف البدل `"*"`
      (لا تزال المفاتيح القديمة غير المسبوقة ببادئة تُعيَّن إلى `id:` فقط)

    `ignoreOtherMentions` (الافتراضي `false`) يُسقط رسائل القنوات التي تشير إلى مستخدم آخر أو مجموعة مستخدمين أخرى دون الإشارة إلى هذا البوت. لا تتأثر الرسائل المباشرة والرسائل المباشرة الجماعية (MPIMs). يتطلب عامل التصفية معرّف مستخدم بوت تم حله من `auth.test`؛ وإذا لم تكن تلك الهوية متاحة (مثل هوية تعتمد على رمز مستخدم فقط)، تُفتح البوابة عند الفشل وتمر الرسائل دون تغيير.

    يتسم `allowBots` بالتحفظ في القنوات والقنوات الخاصة: لا تُقبل رسائل الغرفة التي أنشأها بوت إلا عندما يكون البوت المرسِل مدرجًا صراحةً في قائمة السماح `users` لتلك الغرفة، أو عندما يكون معرّف مالك Slack صريح واحد على الأقل من `channels.slack.allowFrom` عضوًا حاليًا في الغرفة. لا تفي أحرف البدل وإدخالات المالك المستندة إلى اسم العرض بشرط وجود المالك. يستخدم وجود المالك `conversations.members` في Slack؛ تأكد من أن التطبيق لديه نطاق القراءة المطابق لنوع الغرفة (`channels:read` للقنوات العامة، و`groups:read` للقنوات الخاصة). إذا فشل البحث عن الأعضاء، يُسقط OpenClaw رسالة الغرفة التي أنشأها البوت.

    تستخدم رسائل Slack المقبولة التي أنشأها بوت [الحماية المشتركة من حلقات البوت](/ar/channels/bot-loop-protection). اضبط `channels.defaults.botLoopProtection` للميزانية الافتراضية، ثم تجاوزها باستخدام `channels.slack.botLoopProtection` أو `channels.slack.channels.<id>.botLoopProtection` عندما تحتاج مساحة عمل أو قناة إلى حد مختلف.

  </Tab>
</Tabs>

## سلاسل المحادثات والجلسات ووسوم الرد

- تُوجَّه الرسائل المباشرة بصيغة `direct`؛ والقنوات بصيغة `channel`؛ والرسائل المباشرة الجماعية بصيغة `group`.
- تقبل ارتباطات مسارات Slack معرّفات النظراء الأولية، بالإضافة إلى صيغ أهداف Slack مثل `channel:C12345678` و`user:U12345678` و`<@U12345678>`.
- مع القيمة الافتراضية `session.dmScope=main`، تُدمج رسائل Slack المباشرة في جلسة الوكيل الرئيسية.
- جلسات القنوات: `agent:<agentId>:slack:channel:<channelId>`.
- تظل رسائل القناة العادية ذات المستوى الأعلى في جلسة كل قناة، حتى عندما تكون `replyToMode` بقيمة غير `off`.
- تستخدم ردود سلاسل محادثات Slack قيمة `thread_ts` الأصلية في Slack للواحق الجلسات (`:thread:<threadTs>`)، حتى عند تعطيل تسلسل الردود الصادرة باستخدام `replyToMode="off"`.
- يُدخل OpenClaw جذر قناة مؤهلًا ذا مستوى أعلى في `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` عندما يُتوقع أن يبدأ ذلك الجذر سلسلة محادثات مرئية في Slack، لكي يتشارك الجذر وردود السلسلة اللاحقة جلسة OpenClaw واحدة. ينطبق هذا على أحداث `app_mention`، والمطابقات الصريحة لإشارة البوت أو نمط الإشارة المضبوط، وقنوات `requireMention: false` ذات `replyToMode` بقيمة غير `off`.
- القيمة الافتراضية لـ `channels.slack.thread.historyScope` هي `thread`؛ والقيمة الافتراضية لـ `thread.inheritParent` هي `false`.
- يتحكم `channels.slack.thread.initialHistoryLimit` في عدد رسائل سلسلة المحادثات الحالية التي تُجلب عند بدء جلسة سلسلة جديدة (الافتراضي `20`؛ اضبطه على `0` للتعطيل).
- `channels.slack.thread.requireExplicitMention` (الافتراضي `false`): عندما تكون القيمة `true`، تُمنع إشارات سلسلة المحادثات الضمنية لكي يستجيب البوت فقط لإشارات `@bot` الصريحة داخل السلاسل، حتى عندما يكون البوت قد شارك بالفعل في السلسلة. من دون ذلك، تتجاوز الردود في سلسلة شارك فيها البوت بوابة `requireMention`.

عناصر التحكم في تسلسل الردود:

- `channels.slack.channels.<id>.replyToMode`: تجاوز لكل قناة لرسائل قنوات Slack والقنوات الخاصة
- `channels.slack.replyToMode`: `off|first|all|batched` (الافتراضي `off`)
- `channels.slack.replyToModeByChatType`: لكل `direct|group|channel`
- البديل الاحتياطي القديم للمحادثات المباشرة: `channels.slack.dm.replyToMode`

وسوم الرد اليدوية مدعومة:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

للردود الصريحة على سلاسل Slack من أداة `message`، اضبط `replyBroadcast: true` مع `action: "send"` و`threadId` أو `replyTo` لطلب أن يبث Slack أيضًا رد السلسلة إلى القناة الأصلية. يُطابق هذا علامة `reply_broadcast` في `chat.postMessage` لدى Slack، ولا يُدعم إلا لعمليات إرسال النص أو Block Kit، وليس لرفع الوسائط.

عندما تُنفَّذ استدعاءة أداة `message` داخل سلسلة Slack وتستهدف القناة نفسها، يرث OpenClaw عادةً سلسلة Slack الحالية وفقًا لـ `replyToMode` الفعالة للحساب أو نوع المحادثة أو لكل قناة. تستخدم الردود التلقائية واستدعاءات `send` أو `upload-file` في القناة نفسها التجاوز ذاته لكل قناة. اضبط `topLevel: true` على `action: "send"` أو `action: "upload-file"` لفرض رسالة جديدة في القناة الأصلية بدلًا من ذلك. تُقبل `threadId: null` باعتبارها إلغاء الاشتراك نفسه على المستوى الأعلى.

<Note>
يعطّل `replyToMode="off"` تسلسل ردود Slack الصادرة، بما في ذلك وسوم `[[reply_to_*]]` الصريحة. ولا يسطّح جلسات سلاسل Slack الواردة: تظل الرسائل المنشورة بالفعل داخل سلسلة Slack موجّهة إلى جلسة `:thread:<threadTs>`. يختلف هذا عن Telegram، حيث تظل الوسوم الصريحة معتمدة في وضع `"off"`. تخفي سلاسل Slack الرسائل من القناة، بينما تظل ردود Telegram مرئية ضمن السياق.
</Note>

## تفاعلات الإقرار

يرسل `ackReaction` رمزًا تعبيريًا للإقرار بينما يعالج OpenClaw رسالة واردة. ويحدد `ackReactionScope` _متى_ يُرسل ذلك الرمز فعليًا.

افتراضيًا، يظل الإقرار ثابتًا بينما تعرض حالة سلسلة المساعد الأصلية في Slack التقدم باستخدام رسائل تحميل متناوبة. اضبط `messages.statusReactions.enabled: true` للاشتراك بدلًا من ذلك في دورة حياة تفاعلات الانتظار/التفكير/الأداة/الاكتمال/الخطأ.

### الرمز التعبيري (`ackReaction`)

ترتيب الحل:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- البديل الاحتياطي للرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا `"eyes"` / 👀)

ملاحظات:

- يتوقع Slack رموزًا مختصرة (مثل `"eyes"`).
- استخدم `""` لتعطيل التفاعل لحساب Slack أو على المستوى العام.

### النطاق (`messages.ackReactionScope`)

يقرأ موفر Slack النطاق من `messages.ackReactionScope` (الافتراضي `"group-mentions"`). لا يوجد حاليًا تجاوز على مستوى حساب Slack أو قناة Slack؛ فالقيمة عامة على مستوى Gateway.

القيم:

- `"all"`: التفاعل في الرسائل المباشرة والمجموعات، بما في ذلك أحداث الغرف المحيطة.
- `"direct"`: التفاعل في الرسائل المباشرة فقط.
- `"group-all"`: التفاعل مع كل رسالة جماعية باستثناء أحداث الغرف المحيطة (من دون رسائل مباشرة).
- `"group-mentions"` (الافتراضي): التفاعل في المجموعات، ولكن فقط عند الإشارة إلى البوت (أو في العناصر القابلة للإشارة الجماعية التي اشتركت). **تُستبعد الرسائل المباشرة.**
- `"off"` / `"none"`: عدم التفاعل مطلقًا.

<Note>
لا يُطلق النطاق الافتراضي (`"group-mentions"`) تفاعلات الإقرار في الرسائل المباشرة أو أحداث الغرف المحيطة. لرؤية `ackReaction` المضبوط (مثل `"eyes"`) في رسائل Slack المباشرة الواردة وأحداث الغرف الهادئة، اضبط `messages.ackReactionScope` على `"all"`. تُقرأ `messages.ackReactionScope` عند بدء تشغيل موفر Slack، لذا يلزم إعادة تشغيل Gateway لكي يسري التغيير.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // التفاعل في الرسائل المباشرة والمجموعات
  },
}
```

## بث النص

يتحكم `channels.slack.streaming` في سلوك المعاينة المباشرة:

- `off`: تعطيل بث المعاينة المباشرة.
- `partial` (الافتراضي): استبدال نص المعاينة بأحدث مخرجات جزئية.
- `block`: إلحاق تحديثات المعاينة المجزأة.
- `progress`: عرض نص حالة التقدم أثناء الإنشاء، ثم إرسال النص النهائي.
- `streaming.preview.toolProgress`: عندما تكون معاينة المسودة نشطة، توجيه تحديثات الأداة/التقدم إلى رسالة المعاينة المعدّلة نفسها (الافتراضي: `true`). اضبط `false` للاحتفاظ برسائل منفصلة للأداة/التقدم.
- `streaming.preview.commandText` / `streaming.progress.commandText`: اضبطها على `status` للاحتفاظ بأسطر تقدم الأداة الموجزة مع إخفاء نص الأمر/التنفيذ الأولي (الافتراضي: `raw`).

إخفاء نص الأمر/التنفيذ الأولي مع الاحتفاظ بأسطر التقدم الموجزة:

```json
{
  "channels": {
    "slack": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

يتحكم `channels.slack.streaming.nativeTransport` في بث النص الأصلي في Slack عندما تكون `channels.slack.streaming.mode` بقيمة `partial` (الافتراضي: `true`).

بطاقات مهام التقدم الأصلية في Slack اختيارية لوضع التقدم. اضبط `channels.slack.streaming.progress.nativeTaskCards` على `true` مع `channels.slack.streaming.mode="progress"` لإرسال بطاقة خطة/مهمة أصلية في Slack أثناء تنفيذ العمل، ثم تحديث بطاقة المهمة نفسها عند الاكتمال. من دون هذه العلامة، يحتفظ وضع التقدم بسلوك معاينة المسودة القابل للنقل.

- يجب أن تكون سلسلة رد متاحة لكي يظهر بث النص الأصلي وحالة سلسلة مساعد Slack. ويظل اختيار السلسلة متبعًا لـ `replyToMode`.
- لا يزال بإمكان القنوات والمحادثات الجماعية وجذور الرسائل المباشرة ذات المستوى الأعلى استخدام معاينة المسودة العادية عندما لا يتوفر البث الأصلي أو لا توجد سلسلة رد.
- تظل رسائل Slack المباشرة ذات المستوى الأعلى خارج السلسلة افتراضيًا، لذا لا تعرض معاينة البث/الحالة الأصلية بنمط سلاسل Slack؛ وينشر OpenClaw معاينة مسودة في الرسالة المباشرة ويعدّلها بدلًا من ذلك.
- تعود الوسائط والحمولات غير النصية إلى التسليم العادي.
- تلغي النتائج النهائية للوسائط/الأخطاء تعديلات المعاينة المعلقة؛ ولا تُفرغ النتائج النهائية المؤهلة للنص/الكتل إلا عندما يمكنها تعديل المعاينة في موضعها.
- إذا فشل البث في منتصف الرد، يعود OpenClaw إلى التسليم العادي للحمولات المتبقية.

استخدام معاينة المسودة بدلًا من بث النص الأصلي في Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

الاشتراك في بطاقات مهام التقدم الأصلية في Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          nativeTaskCards: true,
          render: "rich",
        },
      },
    },
  },
}
```

المفاتيح القديمة:

- `channels.slack.streamMode` (`replace | status_final | append`) اسم مستعار قديم لـ `channels.slack.streaming.mode`.
- القيمة المنطقية `channels.slack.streaming` اسم مستعار قديم لـ `channels.slack.streaming.mode` و`channels.slack.streaming.nativeTransport`.
- القيمتان `channels.slack.chunkMode` و`channels.slack.nativeStreaming` على المستوى الأعلى اسمان مستعاران قديمان لـ `channels.slack.streaming.chunkMode` و`channels.slack.streaming.nativeTransport`.
- لا تُقرأ الأسماء المستعارة القديمة في وقت التشغيل؛ شغّل `openclaw doctor --fix` لإعادة كتابة إعدادات بث Slack المحفوظة باستخدام المفاتيح القياسية.

## البديل الاحتياطي لتفاعل الكتابة

يضيف `typingReaction` تفاعلًا مؤقتًا إلى رسالة Slack الواردة بينما يعالج OpenClaw ردًا، ثم يزيله عند انتهاء التشغيل. يكون هذا أكثر فائدة خارج ردود السلاسل، التي تستخدم مؤشر حالة افتراضيًا يفيد بأن المستخدم "يكتب...".

ترتيب الحل:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

ملاحظات:

- يتوقع Slack رموزًا مختصرة (مثل `"hourglass_flowing_sand"`).
- يُنفّذ التفاعل على أساس بذل أفضل جهد، وتُحاول إزالته تلقائيًا بعد اكتمال مسار الرد أو الفشل.

## الإدخال الصوتي

للتحدث إلى OpenClaw في Slack حاليًا، أرسل مقطعًا صوتيًا من Slack إلى تطبيق OpenClaw. ميكروفون الإملاء في Slackbot ميزة منفصلة مملوكة لـ Slack، وليس واجهة API للتطبيق.

- يعمل **[الإملاء الصوتي في Slackbot](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** داخل محادثة Slackbot الخاصة بالمستخدم. يحوّل Slack التسجيل إلى مطالبة في Slackbot، لكنه لا يرسل ملفًا صوتيًا أو حدث إملاء أو مطالبة أو علامة لمصدر الإدخال إلى تطبيقات Slack التابعة لجهات خارجية عبر Events API. لا يمكن لـ Plugin Slack في OpenClaw تمكينه أو استقباله.
- **[مقاطع Slack الصوتية](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** هي ملفات مخزنة في Slack يمكن نشرها في رسالة خاصة أو قناة أو سلسلة محادثات في OpenClaw. ينزّل OpenClaw المقطع القابل للوصول باستخدام رمز البوت، ويوحّد بيانات MIME الوصفية للمقطع في Slack، ثم يرسله عبر [مسار تحويل الصوت إلى نص المشترك](/ar/nodes/audio). يتضمن بيان التطبيق الموصى به نطاق `files:read` المطلوب.

تختلف دلالات الخصوصية بين المقاطع الصوتية والإملاء في Slackbot: تخضع المقاطع لسياسة الاحتفاظ بالملفات في Slack وينزّلها OpenClaw لتحويلها إلى نص، بينما يفيد Slack بأن صوت الإملاء لا يُخزَّن.

في قناة تستخدم `requireMention: true`، يمكن لمقطع صوتي بلا تسمية توضيحية اجتياز البوابة عبر نطق نمط إشارة مُعدّ (`agents.list[].groupChat.mentionPatterns`، مع الرجوع إلى `messages.groupChat.mentionPatterns`). يتحقق OpenClaw من صلاحية المرسل قبل تنزيل المقطع أو تحويله إلى نص، ثم لا يقبله إلا إذا طابق النص الناتج النمط. يُتخلّص من النص الاستباقي الفاشل أو غير المطابق مع المقطع المنزّل، ولا يُحتفظ به في سجل القناة. لا يمكن استنتاج هوية `@bot` الأصلية في Slack من الكلام، لذا يجب إعداد نمط للاسم المنطوق أو تضمين إشارة مكتوبة. إذا فُعّل تكرار النص الناتج، فلا يُرسل التكرار إلا بعد القبول.

## الوسائط والتقسيم والتسليم

<AccordionGroup>
  <Accordion title="المرفقات الواردة">
    تُنزّل مرفقات ملفات Slack من عناوين URL خاصة مستضافة على Slack (عبر تدفق طلبات موثّق بالرمز)، وتُكتب في مخزن الوسائط عند نجاح الجلب وسماح حدود الحجم بذلك. تتضمن العناصر النائبة للملفات `fileId` الخاص بـ Slack كي تتمكن الوكلاء من جلب الملف الأصلي باستخدام `download-file`.

    تستخدم التنزيلات مدد انتهاء مهلة محدودة للخمول والوقت الإجمالي. إذا تعطل استرداد ملف Slack أو فشل، يواصل OpenClaw معالجة الرسالة ويرجع إلى العنصر النائب للملف.

    يكون الحد الأقصى الافتراضي لحجم البيانات الواردة وقت التشغيل هو `20MB` ما لم يتجاوزه `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="النصوص والملفات الصادرة">
    - تستخدم أجزاء النص `channels.slack.textChunkLimit` (القيمة الافتراضية `8000`، بحد أقصى يساوي حد طول الرسائل في Slack)
    - يفعّل `channels.slack.streaming.chunkMode="newline"` التقسيم حسب الفقرات أولًا
    - تستخدم عمليات إرسال الملفات واجهات رفع Slack، ويمكن أن تتضمن ردودًا ضمن سلاسل المحادثات (`thread_ts`)
    - تستخدم تسميات الملفات الطويلة أول جزء نصي آمن في Slack تعليقًا للرفع، وترسل الأجزاء المتبقية رسائل متابعة
    - يتبع الحد الأقصى للوسائط الصادرة `channels.slack.mediaMaxMb` عند إعداده؛ وإلا فتستخدم عمليات الإرسال إلى القنوات القيم الافتراضية لنوع MIME من مسار الوسائط

  </Accordion>

  <Accordion title="وجهات التسليم">
    الوجهات الصريحة المفضلة:

    - `user:<id>` للرسائل الخاصة
    - `channel:<id>` للقنوات

    يمكن لرسائل Slack الخاصة التي تحتوي على نص أو كتل فقط النشر مباشرة إلى معرّفات المستخدمين؛ أما عمليات رفع الملفات والإرسال ضمن سلاسل المحادثات فتفتح الرسالة الخاصة أولًا عبر واجهات محادثات Slack، لأن هذه المسارات تتطلب معرّف محادثة محددًا.

  </Accordion>
</AccordionGroup>

## الأوامر وسلوك أوامر الشرطة المائلة

تظهر أوامر الشرطة المائلة في Slack إما كأمر واحد مُعدّ أو كعدة أوامر أصلية. اضبط `channels.slack.slashCommand` لتغيير القيم الافتراضية للأوامر:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

تتطلب الأوامر الأصلية [إعدادات إضافية للبيان](#additional-manifest-settings) في تطبيق Slack، وتُفعّل باستخدام `channels.slack.commands.native: true` أو `commands.native: true` في الإعدادات العامة بدلًا من ذلك.

- الوضع التلقائي للأوامر الأصلية **معطّل** في Slack، لذلك لا يفعّل `commands.native: "auto"` أوامر Slack الأصلية.

```txt
/help
```

تُعرض قوائم وسيطات الأوامر الأصلية بإحدى الصور التالية، حسب ترتيب الأولوية:

- من 3 إلى 5 خيارات قصيرة بما يكفي: قائمة تجاوز ("...")
- أكثر من 100 خيار، مع توفر تصفية غير متزامنة للخيارات: تحديد خارجي
- خيار واحد أو خياران، أو أي خيار تكون قيمته المشفرة أطول مما يسمح به عنصر التحديد: كتل أزرار
- خلاف ذلك (من 6 إلى 100 خيار، أو أكثر من 100 دون تصفية غير متزامنة): قائمة تحديد ثابتة، مقسمة إلى 100 خيار لكل قائمة

```txt
/think
```

تستخدم جلسات أوامر الشرطة المائلة مفاتيح معزولة مثل `agent:<agentId>:slack:slash:<userId>`، وتظل توجّه تنفيذ الأوامر إلى جلسة المحادثة المستهدفة باستخدام `CommandTargetSessionKey`.

## المخططات الأصلية

تعرض كتلة Block Kit العامة [`data_visualization`](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/)
في Slack مخططات خطية وشريطية ومساحية ودائرية في الرسائل. يربط OpenClaw كتلة
`presentation` `chart` المحمولة بتلك البنية الأصلية؛ ولا يلزم أي نطاق OAuth إضافي
أو رفع ملفات أو عارض صور أو إعداد في Slack بخلاف صلاحية الوصول العادية إلى رسائل
`chat:write`.

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "الإيرادات الفصلية",
      "categories": ["الربع الأول", "الربع الثاني"],
      "series": [{ "name": "الإيرادات", "values": [120, 145] }],
      "xLabel": "الربع"
    }
  ]
}
```

تُفرض حدود Slack قبل العرض الأصلي:

- العنوان وتسميات المحاور الاختيارية: 50 حرفًا
- المخطط الدائري: من 1 إلى 12 قطاعًا موجبًا
- المخطط الخطي أو الشريطي أو المساحي: من 1 إلى 12 سلسلة ذات أسماء فريدة ومن 1 إلى 20 فئة مشتركة
- تسميات القطاعات والفئات والسلاسل: 20 حرفًا
- يجب أن تحتوي كل سلسلة على قيمة محدودة واحدة لكل فئة؛ ويمكن أن تكون قيم
  المخططات غير الدائرية سالبة

يحمل كل مخطط أصلي أيضًا تمثيلًا نصيًا على المستوى الأعلى لقارئات الشاشة
والإشعارات ونسخ الجلسات والعملاء الذين لا يمكنهم عرض الكتلة.
تتلقى عمليات إرسال العروض القياسية إلى قنوات OpenClaw الأخرى بيانات المخطط
الحتمية نفسها كنص، ما لم تعلن تلك القنوات دعمها الأصلي للمخططات. إذا رفض
Slack المخطط باستخدام `invalid_blocks` أثناء طرح مرحلي، يزيل OpenClaw
كتل البيانات الأصلية المرفوضة، ويُبقي عناصر التحكم الشقيقة، ويرسل
تمثيل المخطط الكامل كنص مرئي.

يقبل Slack حاليًا ما يصل إلى كتلتين من `data_visualization` لكل رسالة. عندما
يحتوي العرض على أكثر من مخططين صالحين، يحافظ OpenClaw على ترتيبها
ويتابع العرض الأصلي في رسائل متابعة، بما لا يزيد على مخططين
في كل رسالة.

يوثّق [إطلاق المطورين](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
في Slack الكتلة باعتبارها ميزة Block Kit موجهة للتطبيقات، ولا ينشر أي قيد
على الخطط المدفوعة. تنطبق صياغة أهلية Business+/Enterprise على
إنشاء المخططات التلقائي بالذكاء الاصطناعي في Slackbot، وهو أمر منفصل عن إرسال تطبيق
لمخطط Block Kit منظم مسبقًا. المخططات كتل مخصصة للرسائل فقط، وليست محتوى في App
Home أو النوافذ المشروطة أو Canvas.

## الجداول الأصلية

تعرض كتلة Block Kit الحالية [`data_table`](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/)
في Slack صفوفًا وأعمدة منظمة داخل الرسائل. يربط OpenClaw كتلة
`presentation` `table` المحمولة والصريحة بـ `data_table`؛ ولا يستخدم كتلة Slack
القديمة [`table`](https://docs.slack.dev/reference/block-kit/blocks/table-block/).
لا يلزم أي نطاق OAuth إضافي أو إعداد في Slack بخلاف صلاحية الوصول العادية
إلى رسائل `chat:write`.

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "مسار المبيعات المفتوح",
      "headers": ["الحساب", "المرحلة", "الإيراد السنوي المتكرر"],
      "rows": [
        ["Acme", "تم الفوز", 125000],
        ["Globex", "قيد المراجعة", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

يربط OpenClaw خلايا العناوين والسلاسل النصية بخلايا `raw_text` في Slack. وتُربط الخلايا الرقمية
بـ `raw_number`، مع الحفاظ على القيمة الرقمية المحدودة للفرز
والتصفية الأصليين. يحدد `rowHeaderColumnIndex`، عند وجوده، ذلك
العمود ذي الفهرسة الصفرية بوصفه عناوين صفوف Slack.

تُفرض حدود `data_table` المنشورة من Slack قبل العرض الأصلي:

- من 1 إلى 20 عمودًا
- من 1 إلى 100 صف بيانات، بالإضافة إلى صف العنوان
- العدد نفسه من الخلايا في كل صف
- بحد أقصى 10,000 حرف إجمالًا عبر جميع خلايا الجدول في رسالة واحدة

يمكن عرض عدة كتل جداول صالحة عرضًا أصليًا ما دامت الرسالة
ضمن الحد الإجمالي للأحرف. يتحول الجدول الذي لا يمكن عرضه ضمن
الحدود الأصلية إلى نص حتمي كامل بدلًا من فقدان صفوف أو
خلايا. إذا تجاوز ذلك النص سعة رسالة واحدة في Slack، تستخدم عمليات الإرسال وردود أوامر الشرطة المائلة
أجزاء نصية مرتبة. تفشل تعديلات الجداول بخطأ صريح في الحجم بدلًا من
اقتطاع صفوف من رسالة موجودة دون تنبيه.

يحمل كل جدول أصلي ناتج من عرض محمول أيضًا تمثيلًا نصيًا
على المستوى الأعلى لقارئات الشاشة والإشعارات ونسخ الجلسات والعملاء
الذين لا يمكنهم عرض الكتلة. تبقى قيم المخططات والجداول الخام
حرفية في البديل، فلا تتحول بيانات الخلايا مثل `<@U123>` إلى إشارة في Slack.
إذا رفض Slack كتل المخططات أو الجداول الأصلية باستخدام `invalid_blocks`، فإن OpenClaw
يزيل كل كتل البيانات الأصلية في خطوة استرداد واحدة محدودة، ويحتفظ
بالكتل الشقيقة الصالحة مثل الأزرار وعناصر التحديد، ويرسل النص الكامل المرئي
للمخططات والجداول مع تعطيل تنسيق Slack. يتتبع تسليم أوامر الشرطة المائلة
ميزانية `response_url` ذات الاستدعاءات الخمسة في Slack طوال الأمر. وقبل كل
دفعة ردود، يختار خطة كاملة تناسب الاستدعاءات المتبقية أو يفشل
قبل نشر تلك الدفعة.

لا تُرقّى إلى جداول أصلية إلا كتل الجداول الصريحة `presentation`.
تبقى جداول Markdown ذات الأنابيب نصًا كما أُلّفت؛ ولا يخمّن OpenClaw
بنية الجدول أو أنواع الخلايا. يمكن للمنتجين الحاليين الموثوقين الذين يستخدمون بنية Slack الأصلية
الاستمرار في تمرير الكتل الخام عبر `channelData.slack.blocks`؛ ويستخرج OpenClaw نصًا
بديلًا من خلايا `data_table` الخام الصالحة، بينما قد تتراجع الكتل المخصصة
غير الصحيحة إلى تسميتها التوضيحية أو إلى بديل Block Kit العام. ينبغي أن تستخدم مخرجات
الوكلاء وCLI والإضافات المحمولة `presentation`.

## الردود التفاعلية

يمكن لـ Slack عرض عناصر تحكم تفاعلية في الردود ينشئها الوكلاء، لكن هذه الميزة معطلة افتراضيًا.
بالنسبة إلى المخرجات الجديدة من الوكلاء وCLI والإضافات، يُفضّل استخدام أزرار
`presentation` المشتركة أو كتل التحديد. فهي تستخدم مسار تفاعل Slack
نفسه، مع إمكانية التراجع أيضًا على القنوات الأخرى.

فعّلها عموميًا:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

أو فعّلها لحساب Slack واحد فقط:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

عند تفعيلها، يظل بإمكان الوكلاء إصدار توجيهات رد مهملة خاصة بـ Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

تُترجم هذه التوجيهات إلى Slack Block Kit، وتوجّه النقرات أو عمليات التحديد
عبر مسار أحداث التفاعل الحالي في Slack. احتفظ بها للمطالبات القديمة
ولمخارج الطوارئ الخاصة بـ Slack؛ واستخدم العرض المشترك لعناصر التحكم
المحمولة الجديدة.

واجهات API الخاصة بمترجم التوجيهات مهملة أيضًا في شيفرة المنتجين الجديدة:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

استخدم حمولات `presentation` و`buildSlackPresentationBlocks(...)` لعناصر التحكم الجديدة
المعروضة في Slack.

ملاحظات:

- هذه واجهة مستخدم قديمة خاصة بـ Slack. لا تحوّل القنوات الأخرى توجيهات Slack Block
  Kit إلى أنظمة الأزرار الخاصة بها.
- قيم الاستدعاء التفاعلي هي رموز مبهمة ينشئها OpenClaw، وليست قيمًا خامًا أنشأها الوكيل.
- إذا كانت الكتل التفاعلية المُنشأة ستتجاوز حدود Slack Block Kit، يعود OpenClaw إلى الرد النصي الأصلي بدلًا من إرسال حمولة كتل غير صالحة.

### عمليات إرسال النماذج المشروطة المملوكة للـ Plugin

يمكن أيضًا لـ Plugins الخاصة بـ Slack التي تسجّل معالجًا تفاعليًا تلقي أحداث دورة حياة
`view_submission` و`view_closed` قبل أن ينفّذ OpenClaw عملية Compaction
للحمولة ضمن حدث النظام المرئي للوكيل. استخدم أحد أنماط التوجيه
التالية عند فتح نموذج مشروط في Slack:

- اضبط `callback_id` على `openclaw:<namespace>:<payload>`.
- أو احتفظ بـ `callback_id` موجود وضع `pluginInteractiveData:
"<namespace>:<payload>"` في `private_metadata` الخاص بالنموذج المشروط.

يتلقى المعالج `ctx.interaction.kind` بوصفه `view_submission` أو
`view_closed`، و`inputs` بعد تسويته، وكائن `stateValues` الخام الكامل من
Slack. يكفي التوجيه باستخدام معرّف الاستدعاء فقط لاستدعاء معالج الـ Plugin؛ أدرج
حقول توجيه المستخدم/الجلسة `private_metadata` الموجودة في النموذج المشروط عندما
ينبغي للنموذج المشروط أيضًا إنشاء حدث نظام مرئي للوكيل. يتلقى الوكيل
حدث نظام `Slack interaction: ...` موجزًا ومنقّحًا. إذا أعاد المعالج
`systemEvent.summary` أو `systemEvent.reference` أو `systemEvent.data`، فستُدرج
هذه الحقول في ذلك الحدث الموجز كي يتمكن الوكيل من الإشارة إلى
التخزين المملوك للـ Plugin من دون رؤية حمولة النموذج الكاملة.

## الموافقات الأصلية في Slack

يمكن أن يعمل Slack كعميل موافقات أصلي باستخدام الأزرار والتفاعلات، بدلًا من الرجوع إلى واجهة الويب أو الطرفية.

- يمكن عرض موافقات التنفيذ والـ Plugin كمطالبات Slack Block Kit أصلية.
- يظل `channels.slack.execApprovals.*` إعداد تمكين عميل موافقات التنفيذ الأصلي وتوجيه الرسائل المباشرة/القنوات.
- تستخدم الرسائل المباشرة لموافقة التنفيذ `channels.slack.execApprovals.approvers` أو `commands.ownerAllowFrom`.
- تستخدم موافقات الـ Plugin أزرار Slack الأصلية عندما يكون Slack مفعّلًا كعميل موافقات أصلي للجلسة المنشئة، أو عندما يوجّه `approvals.plugin` إلى جلسة Slack المنشئة أو إلى هدف Slack.
- تستخدم الرسائل المباشرة لموافقة الـ Plugin معتمدي Slack Plugin من `channels.slack.allowFrom`، أو `allowFrom` للحساب المسمّى، أو مسار الحساب الافتراضي.
- يظل تفويض المعتمد مفروضًا: لا يمكن للمعتمدين المخوّلين للتنفيذ فقط الموافقة على طلبات الـ Plugin ما لم يكونوا أيضًا من معتمدي الـ Plugin.

يستخدم هذا سطح أزرار الموافقات المشترك نفسه الذي تستخدمه القنوات الأخرى. عندما يكون `interactivity` مفعّلًا في إعدادات تطبيق Slack، تظهر مطالبات الموافقة كأزرار Block Kit مباشرةً في المحادثة.
عند وجود هذه الأزرار، تكون هي تجربة الموافقة الأساسية؛ ولا ينبغي لـ OpenClaw
تضمين أمر `/approve` يدوي إلا عندما تشير نتيجة الأداة إلى أن
موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

مسار الإعداد:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `agentFilter`، `sessionFilter`

يفعّل Slack موافقات التنفيذ الأصلية تلقائيًا عندما لا يكون `enabled` مضبوطًا أو يكون `"auto"`، وعندما يتحدد
معتمد تنفيذ واحد على الأقل. يمكن لـ Slack أيضًا معالجة موافقات الـ Plugin الأصلية عبر مسار العميل
الأصلي هذا عندما يتحدد معتمدو Slack Plugin ويطابق الطلب مرشحات العميل الأصلي. اضبط
`enabled: false` لتعطيل Slack صراحةً بوصفه عميل موافقات أصليًا. اضبط `enabled: true`
لفرض تشغيل الموافقات الأصلية عند تحديد المعتمدين. لا يؤدي تعطيل موافقات تنفيذ Slack إلى تعطيل
تسليم موافقات Slack Plugin الأصلية المفعّل عبر `approvals.plugin`؛ إذ يستخدم تسليم موافقة الـ Plugin
معتمدي Slack Plugin بدلًا من ذلك.

السلوك الافتراضي عند عدم وجود إعداد صريح لموافقة تنفيذ Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

لا يلزم إعداد Slack الأصلي الصريح إلا عندما تريد تجاوز المعتمدين، أو إضافة مرشحات، أو
الاشتراك في التسليم إلى دردشة المنشأ:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

إعادة توجيه `approvals.exec` المشتركة منفصلة. استخدمها فقط عندما يجب أيضًا
توجيه مطالبات موافقة التنفيذ إلى دردشات أخرى أو أهداف صريحة خارج النطاق. كما أن إعادة توجيه `approvals.plugin` المشتركة
منفصلة؛ ولا يمنع التسليم الأصلي في Slack هذا المسار الاحتياطي إلا عندما يستطيع Slack معالجة طلب موافقة الـ Plugin
أصليًا.

يعمل أيضًا `/approve` ضمن الدردشة نفسها في قنوات Slack والرسائل المباشرة التي تدعم الأوامر بالفعل. راجع [موافقات التنفيذ](/ar/tools/exec-approvals) للاطلاع على نموذج إعادة توجيه الموافقات الكامل.

## الأحداث والسلوك التشغيلي

- تُحوّل تعديلات الرسائل وعمليات حذفها إلى أحداث نظام.
- تُعالَج عمليات بث سلاسل المحادثات (ردود السلسلة عبر "Also send to channel") كرسائل مستخدم عادية.
- تُحوّل أحداث إضافة التفاعلات وإزالتها إلى أحداث نظام.
- تُحوّل أحداث انضمام الأعضاء ومغادرتهم، وإنشاء القنوات وإعادة تسميتها، وإضافة التثبيت وإزالته إلى أحداث نظام.
- يمكن لاستقصاء الحضور الاختياري تحويل انتقال `away` إلى `active` لأحد المشاركين البشر الذين جرت ملاحظتهم إلى أحدث جلسة Slack مؤهلة ونشطة لذلك المشارك. يكون هذا معطلًا افتراضيًا.
- يمكن لـ `channel_id_changed` ترحيل مفاتيح إعداد القناة عندما يكون `configWrites` مفعّلًا.
- تُعامل البيانات الوصفية لموضوع القناة وغرضها كسياق غير موثوق ويمكن حقنها في سياق التوجيه.
- تُرشّح بادرة سلسلة المحادثات وبذر سياق السجل الأولي للسلسلة وفق قوائم السماح للمرسلين المضبوطة عند انطباقها.
- تصدر إجراءات الكتل والاختصارات وتفاعلات النماذج المشروطة أحداث نظام `Slack interaction: ...` منظّمة تتضمن حقول حمولة غنية:
  - إجراءات الكتل: القيم المحددة، والتسميات، وقيم أدوات الاختيار، والبيانات الوصفية لـ `workflow_*`
  - الاختصارات العامة: البيانات الوصفية للاستدعاء والفاعل، وتُوجّه إلى جلسة الفاعل المباشرة
  - اختصارات الرسائل: سياق الاستدعاء والفاعل والقناة والسلسلة والرسالة المحددة
  - أحداث النموذج المشروط `view_submission` و`view_closed` مع البيانات الوصفية للقناة الموجّهة ومدخلات النموذج

عرّف اختصارات عامة أو اختصارات رسائل في إعداد تطبيق Slack واستخدم أي معرّف استدعاء غير فارغ. يقرّ OpenClaw باستلام حمولات الاختصارات المطابقة، ويطبّق سياسة مرسل الرسائل المباشرة/القنوات نفسها المطبّقة على تفاعلات Slack الأخرى، ويضع الحدث المنقّى في قائمة انتظار جلسة الوكيل الموجّهة. تُنقّح معرّفات المشغّلات وعناوين URL للاستجابة من سياق الوكيل.

### أحداث الحضور

لا يرسل Slack تغييرات الحضور عبر Events API أو Socket Mode. وبدلًا من ذلك، يمكن لـ OpenClaw استقصاء [`users.getPresence`](https://docs.slack.dev/reference/methods/users.getPresence/) للمشاركين البشر الذين اجتازت رسائلهم عمليات التحقق العادية للوصول والتوجيه في Slack.

```json5
{
  channels: {
    slack: {
      presenceEvents: { mode: "auto" },
      channels: {
        C0123456789: { presenceEvents: { mode: "on" } },
        C0987654321: { presenceEvents: { mode: "off" } },
      },
    },
  },
}
```

- `off` (الافتراضي): لا يوجد مؤقت حضور أو استدعاءات Slack API.
- `auto`: راقب الرسائل المباشرة وMPIMs وسلاسل Slack النشطة خلال آخر 24 ساعة، بحد أقصى 8 مشاركين بشر تمت ملاحظتهم. تُستبعد جلسات القنوات ذات المستوى الأعلى.
- `on`: راقب المحادثات نفسها من دون حد للمشاركين، وأدرج جلسات القنوات ذات المستوى الأعلى. استخدم تجاوزًا خاصًا بكل قناة لفرض مراقبة قناة واحدة أو منعها.

يستقصي OpenClaw بحد أقصى 45 مستخدمًا فريدًا في الدقيقة لكل حساب Slack، ويستخدم النتيجة الأولى كبذرة من دون إيقاظ الوكيل، ولا يوقظه إلا عند ملاحظة انتقال من `away` إلى `active`. تُطبّق فترة تهدئة دائمة مدتها 8 ساعات لكل حساب Slack ومستخدم، حتى إذا شارك ذلك الشخص في عدة سلاسل. لا يُوجّه الحدث إلا إلى أحدث محادثة مؤهلة ونشطة لذلك الشخص، ويطلب من الوكيل الرجوع إلى الذاكرة/الويكي وسياق المنطقة الزمنية المعروف قبل أن يقرر ما إذا كان سيرسل تحية قصيرة واحدة. ويمكن للوكيل التزام الصمت.

يحتاج رمز البوت إلى `users:read`، وهو مُدرج بالفعل في البيان الموصى به. لا تتوفر أحداث الحضور لعمليات التثبيت على مستوى مؤسسة Enterprise Grid بأكملها.

## مرجع الإعداد

المرجع الأساسي: [مرجع الإعداد - Slack](/ar/gateway/config-channels#slack).

<Accordion title="حقول Slack عالية الأهمية">

- الوضع/المصادقة: `mode`، `enterpriseOrgInstall`، `botToken`، `appToken`، `signingSecret`، `webhookPath`، `accounts.*`
- الوصول إلى الرسائل المباشرة: `dm.enabled`، `dmPolicy`، `allowFrom` (قديم: `dm.policy`، `dm.allowFrom`)، `dm.groupEnabled`، `dm.groupChannels`
- مفتاح تبديل التوافق: `dangerouslyAllowNameMatching` (للطوارئ؛ أبقه معطلًا ما لم تكن هناك حاجة إليه)
- الوصول إلى القناة: `groupPolicy`، `channels.*`، `channels.*.users`، `channels.*.requireMention`
- سلاسل المحادثات/السجل: `replyToMode`، `replyToModeByChatType`، `thread.*`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`
- الإيقاظ عبر الحضور: `presenceEvents.mode`، `channels.*.presenceEvents.mode` (`off|auto|on`؛ الافتراضي `off`)
- التسليم: `textChunkLimit`، `streaming.chunkMode`، `mediaMaxMb`، `streaming`، `streaming.nativeTransport`، `streaming.preview.toolProgress`
- المعاينات الموسّعة: `unfurlLinks` (الافتراضي: `false`)، و`unfurlMedia` للتحكم في معاينة الروابط/الوسائط لـ `chat.postMessage`؛ اضبط `unfurlLinks: true` لإعادة الاشتراك في معاينات الروابط
- التشغيل/الميزات: `configWrites`، `commands.native`، `slashCommand.*`، `actions.*`، `userToken`، `userTokenReadOnly`

</Accordion>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لا توجد ردود في القنوات">
    تحقّق بالترتيب:

    - `groupPolicy`
    - قائمة السماح للقنوات (`channels.slack.channels`) — **يجب أن تكون المفاتيح معرّفات قنوات** (`C12345678`)، وليست أسماء (`#channel-name`). تفشل المفاتيح المستندة إلى الأسماء بصمت عند استخدام `groupPolicy: "allowlist"` لأن توجيه القنوات يعتمد على المعرّفات أولًا افتراضيًا. للعثور على المعرّف: انقر بزر الماوس الأيمن على القناة في Slack ← **Copy link** — قيمة `C...` في نهاية عنوان URL هي معرّف القناة.
    - `requireMention`
    - قائمة السماح `users` الخاصة بكل قناة
    - `messages.groupChat.visibleReplies`: تستخدم طلبات المجموعات/القنوات العادية `"automatic"` افتراضيًا. إذا اشتركت في `"message_tool"` وأظهرت السجلات نص المساعد من دون استدعاء `message(action=send)`، فقد أخفق النموذج في استخدام مسار أداة الرسائل المرئي. يظل النص النهائي خاصًا في هذا الوضع؛ افحص سجل Gateway المفصّل بحثًا عن البيانات الوصفية للحمولة المحجوبة، أو اضبطه على `"automatic"` إذا كنت تريد نشر كل رد نهائي عادي للمساعد عبر المسار القديم.
    - `messages.groupChat.unmentionedInbound`: إذا كان `"room_event"`، فإن حديث القناة المسموح به الذي لا يتضمن إشارة يُعد سياقًا محيطًا ويظل صامتًا ما لم يستدعِ الوكيل أداة `message`. راجع [أحداث الغرف المحيطة](/ar/channels/ambient-room-events).

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

    أوامر مفيدة:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="يتم تجاهل الرسائل المباشرة">
    تحقّق:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (أو `channels.slack.dm.policy` القديم)
    - موافقات الاقتران / إدخالات قائمة السماح (لا يزال `dmPolicy: "open"` يتطلب `channels.slack.allowFrom: ["*"]`)
    - تستخدم الرسائل المباشرة الجماعية معالجة MPIM؛ فعّل `channels.slack.dm.groupEnabled`، وإذا كانت مُعدّة، فأدرج MPIM في `channels.slack.dm.groupChannels`
    - أحداث الرسائل المباشرة لمساعد Slack: السجلات التفصيلية التي تذكر `drop message_changed`
      تعني عادةً أن Slack أرسل حدثًا معدّلًا لسلسلة محادثات المساعد من دون
      مرسل بشري يمكن استعادته في بيانات الرسالة الوصفية

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="وضع المقبس لا يتصل">
    تحقّق من رمزي البوت والتطبيق ومن تفعيل Socket Mode في إعدادات تطبيق Slack.
    يحتاج App-Level Token إلى `connections:write`، ويجب أن ينتمي رمز
    Bot User OAuth Token الخاص بالبوت إلى تطبيق Slack ومساحة العمل نفسيهما اللذين ينتمي إليهما رمز التطبيق.

    إذا عرض `openclaw channels status --probe --json` القيمة `botTokenStatus` أو
    `appTokenStatus: "configured_unavailable"`، فهذا يعني أن حساب Slack
    مُعدّ، لكن بيئة التشغيل الحالية لم تتمكن من حل القيمة المدعومة بـ SecretRef.

    تُعد السجلات مثل `slack socket mode failed to start; retry ...` إخفاقات بدء
    قابلة للاسترداد. أما النطاقات المفقودة والرموز الملغاة والمصادقة غير الصالحة فتؤدي إلى فشل فوري.
    ويعني سجل `slack token mismatch ...` أن رمز البوت ورمز التطبيق
    يبدوان تابعين لتطبيقي Slack مختلفين؛ أصلح بيانات اعتماد تطبيق Slack.

  </Accordion>

  <Accordion title="وضع HTTP لا يستقبل الأحداث">
    تحقّق مما يلي:

    - سر التوقيع
    - مسار Webhook
    - عناوين URL لطلبات Slack (الأحداث + التفاعلية + أوامر الشرطة المائلة)
    - قيمة `webhookPath` فريدة لكل حساب HTTP
    - أن عنوان URL العام ينهي TLS ويمرّر الطلبات إلى مسار Gateway
    - أن مسار `request_url` في تطبيق Slack يطابق `channels.slack.webhookPath` تمامًا (القيمة الافتراضية `/slack/events`)

    إذا ظهر `signingSecretStatus: "configured_unavailable"` في لقطات الحساب،
    فهذا يعني أن حساب HTTP مُعدّ، لكن بيئة التشغيل الحالية لم تتمكن من
    حل سر التوقيع المدعوم بـ SecretRef.

    يعني تكرار سجل `slack: webhook path ... already registered` أن حسابي HTTP
    يستخدمان قيمة `webhookPath` نفسها؛ امنح كل حساب مسارًا مميزًا.

  </Accordion>

  <Accordion title="الأوامر الأصلية/أوامر الشرطة المائلة لا تعمل">
    تحقّق مما إذا كنت تقصد:

    - وضع الأوامر الأصلية (`channels.slack.commands.native: true`) مع تسجيل أوامر الشرطة المائلة المطابقة في Slack
    - أو وضع أمر الشرطة المائلة الواحد (`channels.slack.slashCommand.enabled: true`)

    لا ينشئ Slack أوامر الشرطة المائلة أو يزيلها تلقائيًا. لا يفعّل `commands.native: "auto"` أوامر Slack الأصلية؛ استخدم `true` وأنشئ الأوامر المطابقة في تطبيق Slack. في وضع HTTP، يجب أن يتضمن كل أمر شرطة مائلة في Slack عنوان URL الخاص بـ Gateway. في Socket Mode، تصل حمولات الأوامر عبر websocket ويتجاهل Slack القيمة `slash_commands[].url`.

    تحقّق أيضًا من `commands.useAccessGroups`، وتخويل الرسائل المباشرة، وقوائم السماح للقنوات،
    وقوائم السماح `users` لكل قناة. يعيد Slack أخطاء مؤقتة
    لمرسلي أوامر الشرطة المائلة المحظورين، ومنها:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## مرجع وسائط المرفقات

يمكن لـ Slack إرفاق الوسائط المنزّلة بدورة الوكيل عند نجاح تنزيل ملفات Slack وسماح حدود الحجم بذلك. يمكن نسخ المقاطع الصوتية نصيًا، ويمكن تمرير ملفات الصور عبر مسار فهم الوسائط أو مباشرةً إلى نموذج رد يدعم الرؤية، بينما تظل الملفات الأخرى متاحة كسياق ملفات قابل للتنزيل.

### أنواع الوسائط المدعومة

| نوع الوسائط                    | المصدر               | السلوك الحالي                                                                    | ملاحظات                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| مقاطع Slack الصوتية            | عنوان URL لملف Slack | تُنزّل وتُوجّه عبر النسخ الصوتي المشترك                                           | يتطلب `files:read` ونموذج `tools.media.audio` أو CLI يعمل بصورة صحيحة      |
| صور JPEG / PNG / GIF / WebP    | عنوان URL لملف Slack | تُنزّل وتُرفق بالدورة لمعالجتها بقدرات الرؤية                                     | الحد الأقصى لكل ملف: `channels.slack.mediaMaxMb` (الافتراضي 20 MB)                 |
| ملفات PDF                      | عنوان URL لملف Slack | تُنزّل وتُتاح كسياق ملفات لأدوات مثل `download-file` أو `pdf` | لا يحوّل الإدخال الوارد من Slack ملفات PDF تلقائيًا إلى إدخال صور للرؤية |
| ملفات أخرى                     | عنوان URL لملف Slack | تُنزّل عند الإمكان وتُتاح كسياق ملفات                                             | لا تُعامل الملفات الثنائية كإدخال صور                                     |
| ردود سلاسل المحادثات           | ملفات بادئ السلسلة   | يمكن تحميل ملفات الرسالة الجذرية كسياق عندما لا يحتوي الرد على وسائط مباشرة       | تستخدم الرسائل البادئة التي تحتوي ملفات فقط عنصرًا نائبًا للمرفق          |
| رسائل متعددة الملفات          | ملفات Slack متعددة   | يُقيّم كل ملف بصورة مستقلة                                                        | تقتصر معالجة Slack على ثمانية ملفات لكل رسالة                              |

### مسار المعالجة الواردة

عند وصول رسالة Slack تحتوي على مرفقات ملفات:

1. ينزّل OpenClaw الملف من عنوان URL الخاص في Slack باستخدام رمز البوت.
2. يُكتب الملف في مخزن الوسائط عند النجاح.
3. تُضاف مسارات الوسائط المنزّلة وأنواع محتواها إلى السياق الوارد.
4. تُوجّه المقاطع الصوتية إلى مسار النسخ المشترك؛ ويمكن لمسارات النماذج/الأدوات الداعمة للصور استخدام مرفقات الصور من السياق نفسه.
5. تظل الملفات الأخرى متاحة كبيانات وصفية للملفات أو مراجع وسائط للأدوات القادرة على التعامل معها.

### توارث مرفقات جذر سلسلة المحادثة

عند وصول رسالة ضمن سلسلة محادثات (لها أصل `thread_ts`):

- إذا لم يحتوِ الرد نفسه على وسائط مباشرة وكانت الرسالة الجذرية المضمّنة تحتوي على ملفات، فيمكن لـ Slack تحميل ملفات الجذر كسياق لبادئ سلسلة المحادثات.
- تُحمّل ملفات الجذر فقط عند تهيئة جلسة سلسلة محادثات جديدة أو معاد ضبطها. تعيد الردود النصية اللاحقة استخدام سياق الجلسة الحالي ولا تعيد إرفاق ملفات الجذر كوسائط جديدة.
- تأخذ مرفقات الرد المباشرة الأولوية على مرفقات الرسالة الجذرية.
- تُمثّل الرسالة الجذرية التي تحتوي ملفات فقط ولا تحتوي نصًا بعنصر نائب للمرفق، بحيث يمكن للخيار الاحتياطي تضمين ملفاتها مع ذلك.

### معالجة المرفقات المتعددة

عندما تحتوي رسالة Slack واحدة على عدة مرفقات ملفات:

- يُعالج كل مرفق بصورة مستقلة عبر مسار الوسائط.
- تُجمّع مراجع الوسائط المنزّلة في سياق الرسالة.
- يتبع ترتيب المعالجة ترتيب ملفات Slack في حمولة الحدث.
- لا يمنع فشل تنزيل أحد المرفقات معالجة المرفقات الأخرى.

### حدود الحجم والتنزيل والنموذج

- **حد الحجم**: الافتراضي 20 MB لكل ملف. قابل للتهيئة عبر `channels.slack.mediaMaxMb`.
- **حد النسخ الصوتي**: ينطبق `tools.media.audio.maxBytes` أيضًا عند إرسال الملف المنزّل إلى موفّر نسخ أو CLI.
- **إخفاقات التنزيل**: تُتخطى الملفات التي يتعذر على Slack توفيرها، وعناوين URL المنتهية الصلاحية، والملفات التي يتعذر الوصول إليها، والملفات التي تتجاوز الحجم، واستجابات HTML الخاصة بمصادقة/تسجيل دخول Slack، بدلًا من الإبلاغ عنها كتنسيقات غير مدعومة.
- **نموذج الرؤية**: يستخدم تحليل الصور نموذج الرد النشط عندما يدعم الرؤية، أو نموذج الصور المُعدّ في `agents.defaults.imageModel`.

### القيود المعروفة

| السيناريو                                     | السلوك الحالي                                                                      | الحل البديل                                                                  |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| انتهاء صلاحية عنوان URL لملف Slack            | يُتخطى الملف؛ ولا يظهر خطأ                                                         | أعد رفع الملف في Slack                                                        |
| عدم توفر النسخ الصوتي                         | يظل المقطع مرفقًا، لكن لا يُنتج نص منسوخ                                           | أعدّ `tools.media.audio` أو ثبّت CLI محليًا مدعومًا للنسخ الصوتي  |
| مقطع بلا تعليق لا يجتاز بوابة الإشارة         | يُسقط بعد نسخ توقعي خاص؛ ويُحذف النص المنسوخ والتنزيل                              | أعدّ نمط إشارة لاسم منطوق، أو أضف إشارة مكتوبة إلى البوت، أو استخدم رسالة مباشرة |
| عدم إعداد نموذج الرؤية                        | تُخزّن مرفقات الصور كمراجع وسائط، لكن لا تُحلل كصور                                | أعدّ `agents.defaults.imageModel` أو استخدم نموذج رد يدعم الرؤية    |
| صور كبيرة جدًا (> 20 MB افتراضيًا)            | تُتخطى وفق حد الحجم                                                                | زد `channels.slack.mediaMaxMb` إذا سمح Slack بذلك                          |
| المرفقات المعاد توجيهها/المشتركة             | يُتعامل مع النص ووسائط الصور/الملفات المستضافة في Slack بأفضل جهد ممكن             | أعد مشاركتها مباشرةً في سلسلة محادثات OpenClaw                               |
| مرفقات PDF                                    | تُخزّن كسياق ملفات/وسائط، ولا تُوجّه تلقائيًا عبر رؤية الصور                       | استخدم `download-file` لبيانات الملف الوصفية أو أداة `pdf` لتحليل PDF      |

### الوثائق ذات الصلة

- [مسار فهم الوسائط](/ar/nodes/media-understanding)
- [الصوت والملاحظات الصوتية](/ar/nodes/audio)
- [أداة PDF](/ar/tools/pdf)

## ذات صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    اقرن مستخدم Slack بـ Gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك القنوات والرسائل المباشرة الجماعية.
  </Card>
  <Card title="توجيه القنوات" icon="route" href="/ar/channels/channel-routing">
    وجّه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="الأمان" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية الأمنية.
  </Card>
  <Card title="التهيئة" icon="sliders" href="/ar/gateway/configuration">
    بنية الإعدادات وأسبقيتها.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    فهرس الأوامر وسلوكها.
  </Card>
</CardGroup>
