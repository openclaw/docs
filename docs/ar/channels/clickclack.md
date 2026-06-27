---
read_when:
    - ربط OpenClaw بمساحة عمل ClickClack
    - اختبار هويات بوت ClickClack
summary: إعداد قناة bot-token وصياغة الهدف في ClickClack
title: ClickClack
x-i18n:
    generated_at: "2026-06-27T17:09:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 17d5dd79c29122916474a54069306e8e040a68c15c46bd217391bc97dd5d5bb5
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack يربط OpenClaw بمساحة عمل ClickClack مستضافة ذاتيًا عبر رموز بوت ClickClack من الدرجة الأولى.

استخدم هذا عندما تريد أن يظهر وكيل OpenClaw كمستخدم بوت ClickClack. يدعم ClickClack بوتات خدمة مستقلة وبوتات يملكها المستخدمون؛ تحتفظ البوتات المملوكة للمستخدمين بـ `owner_user_id` ولا تتلقى إلا نطاقات الرمز التي تمنحها.

## الإعداد السريع

أنشئ رمز بوت في ClickClack:

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

لبوت مملوك لمستخدم، أضف `--owner <user_id>`.

اضبط OpenClaw:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
      agentId: "clickclack-bot",
      replyMode: "model",
    },
  },
}
```

ثم شغّل:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

إذا كانت `plugins.allow` قائمة تقييدية غير فارغة، فإن تحديد ClickClack صراحةً في إعداد القناة أو تشغيل `openclaw plugins enable clickclack` يضيف `clickclack` إلى تلك القائمة. يستخدم تثبيت الإعداد الأولي سلوك التحديد الصريح نفسه. لا تتجاوز هذه المسارات `plugins.deny` أو إعداد `plugins.enabled: false` العام. يتبع `openclaw plugins install @openclaw/clickclack` المباشر سياسة تثبيت Plugin العادية ويسجّل ClickClack أيضًا في قائمة سماح موجودة.

## بوتات متعددة

يفتح كل حساب اتصال ClickClack فوريًا خاصًا به ويستخدم رمز البوت الخاص به.

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
          replyMode: "model",
        },
        peter: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_PETER_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "peter-bot",
          replyMode: "model",
        },
      },
    },
  },
}
```

يستخدم `replyMode: "model"` ‏`api.runtime.llm.complete` مباشرةً لردود البوت القصيرة.
عندما يعيّن حساب `agentId`، يتطلب OpenClaw بت الثقة الصريح `plugins.entries.clickclack.llm.allowAgentIdOverride` حتى يتمكن Plugin من تشغيل الإكمالات لذلك الوكيل البوت. اتركه معطّلًا إذا كنت تستخدم مسار الوكيل الافتراضي فقط.

## الأهداف

- يرسل `channel:<name-or-id>` إلى قناة في مساحة العمل. تكون الأهداف المجردة افتراضيًا `channel:`.
- ينشئ `dm:<user_id>` محادثة مباشرة مع ذلك المستخدم أو يعيد استخدامها.
- يرد `thread:<message_id>` في سلسلة موجودة.

أمثلة:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## الأذونات

يفرض ClickClack API نطاقات رمز ClickClack.

- `bot:read`: قراءة بيانات مساحة العمل/القناة/الرسالة/السلسلة/الرسائل المباشرة/الاتصال الفوري/الملف الشخصي.
- `bot:write`: `bot:read` بالإضافة إلى رسائل القنوات، وردود السلاسل، والرسائل المباشرة، والتحميلات.
- `bot:admin`: `bot:write` بالإضافة إلى إنشاء القنوات.

لا يحتاج OpenClaw إلا إلى `bot:write` لدردشة الوكيل العادية.

## استكشاف الأخطاء وإصلاحها

- `ClickClack is not configured`: عيّن `channels.clickclack.token` أو `CLICKCLACK_BOT_TOKEN`.
- `workspace not found`: عيّن `workspace` إلى معرّف مساحة العمل أو الاسم المختصر الذي يرجعه ClickClack.
- لا توجد ردود واردة: تأكد من أن الرمز لديه وصول قراءة فوري وأن البوت لا يرد على رسائله الخاصة.
- فشل الإرسال إلى القنوات: تحقق من أن البوت عضو في مساحة العمل ولديه `bot:write`.
