---
read_when:
    - ربط OpenClaw بمساحة عمل ClickClack
    - اختبار هويات روبوت ClickClack
summary: إعداد قناة bot-token في ClickClack وصياغة الهدف
title: كليك كلاك
x-i18n:
    generated_at: "2026-05-10T19:20:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d4860b5f0a40d38af99bec0b8187f723a30c9b4b78d2d1de50ba8a97954baeb
    source_path: channels/clickclack.md
    workflow: 16
---

يربط ClickClack OpenClaw بمساحة عمل ClickClack مستضافة ذاتيًا عبر رموز روبوت ClickClack من الدرجة الأولى.

استخدم هذا عندما تريد أن يظهر وكيل OpenClaw كمستخدم روبوت ClickClack. يدعم ClickClack روبوتات خدمة مستقلة وروبوتات مملوكة للمستخدمين؛ تحتفظ الروبوتات المملوكة للمستخدمين بـ `owner_user_id` وتتلقى فقط نطاقات الرمز التي تمنحها.

## الإعداد السريع

أنشئ رمز روبوت في ClickClack:

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

لروبوت مملوك لمستخدم، أضف `--owner <user_id>`.

كوّن OpenClaw:

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

## روبوتات متعددة

يفتح كل حساب اتصال ClickClack فوريًا خاصًا به ويستخدم رمز الروبوت الخاص به.

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

يستخدم `replyMode: "model"` ‏`api.runtime.llm.complete` مباشرةً للردود القصيرة من الروبوت.
عندما يضبط حساب `agentId`، يتطلب OpenClaw بت الثقة الصريح
`plugins.entries.clickclack.llm.allowAgentIdOverride` كي يتمكن Plugin
من تشغيل الإكمالات لوكيل الروبوت ذلك. أبقه معطّلًا إذا كنت تستخدم مسار
الوكيل الافتراضي فقط.

## الأهداف

- يرسل `channel:<name-or-id>` إلى قناة مساحة عمل. الأهداف المجردة تستخدم `channel:` افتراضيًا.
- ينشئ `dm:<user_id>` محادثة مباشرة مع ذلك المستخدم أو يعيد استخدامها.
- يرد `thread:<message_id>` في سلسلة موجودة.

أمثلة:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## الأذونات

يفرض ClickClack API نطاقات رموز ClickClack.

- `bot:read`: قراءة بيانات مساحة العمل/القناة/الرسالة/السلسلة/الرسائل المباشرة/الاتصال الفوري/الملف الشخصي.
- `bot:write`: `bot:read` بالإضافة إلى رسائل القنوات، وردود السلاسل، والرسائل المباشرة، والتحميلات.
- `bot:admin`: `bot:write` بالإضافة إلى إنشاء القنوات.

يحتاج OpenClaw فقط إلى `bot:write` لمحادثة الوكيل العادية.

## استكشاف الأخطاء وإصلاحها

- `ClickClack is not configured`: اضبط `channels.clickclack.token` أو `CLICKCLACK_BOT_TOKEN`.
- `workspace not found`: اضبط `workspace` إلى معرّف مساحة العمل أو الاسم المختصر الذي يعيده ClickClack.
- لا توجد ردود واردة: تأكد من أن الرمز لديه صلاحية قراءة فورية وأن الروبوت لا يرد على رسائله الخاصة.
- فشل الإرسال إلى القناة: تحقق من أن الروبوت عضو في مساحة العمل ولديه `bot:write`.
