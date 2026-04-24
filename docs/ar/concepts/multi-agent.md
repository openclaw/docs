---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 'التوجيه متعدد الوكلاء: الوكلاء المعزولون، وحسابات القنوات، والروابط'
title: التوجيه متعدد الوكلاء
x-i18n:
    generated_at: "2026-04-24T07:38:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef6f91c53a14bf92427f08243930e4aab50ac7853c9b22b0dbdbb853ea1a93d2
    source_path: concepts/multi-agent.md
    workflow: 15
---

شغّل عدة وكلاء _معزولين_ — لكل واحد منهم مساحة العمل الخاصة به، ودليل الحالة الخاص به (`agentDir`)، وسجل الجلسات الخاص به — بالإضافة إلى عدة حسابات قنوات (مثل حسابي WhatsApp) داخل Gateway واحد قيد التشغيل. يتم توجيه الرسائل الواردة إلى الوكيل الصحيح عبر الروابط.

**الوكيل** هنا هو النطاق الكامل لكل شخصية: ملفات مساحة العمل، وملفات تعريف المصادقة، وسجل النماذج، ومخزن الجلسات. و`agentDir` هو دليل الحالة على القرص الذي يحتفظ بهذا التكوين لكل وكيل في `~/.openclaw/agents/<agentId>/`. أما **الربط** فهو يربط حساب قناة (مثل مساحة عمل Slack أو رقم WhatsApp) بأحد هؤلاء الوكلاء.

## ما المقصود بـ "وكيل واحد"؟

**الوكيل** هو عقل محدد النطاق بالكامل وله ما يلي بشكل مستقل:

- **مساحة العمل** (الملفات، وAGENTS.md/SOUL.md/USER.md، والملاحظات المحلية، وقواعد الشخصية).
- **دليل الحالة** (`agentDir`) لملفات تعريف المصادقة، وسجل النماذج، وتكوين كل وكيل.
- **مخزن الجلسات** (سجل الدردشة + حالة التوجيه) تحت `~/.openclaw/agents/<agentId>/sessions`.

تكون ملفات تعريف المصادقة **لكل وكيل**. يقرأ كل وكيل من ملفه الخاص:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

يمثل `sessions_history` أيضًا هنا مسار الاسترجاع العابر للجلسات الأكثر أمانًا: فهو يعيد
عرضًا محدودًا ومنقحًا، وليس تفريغًا خامًا للنصوص. يقوم استرجاع المساعد بإزالة
وسوم التفكير، وبنية `<relevant-memories>`، وحمولات XML النصية الصريحة لاستدعاءات الأدوات
(بما في ذلك `<tool_call>...</tool_call>`،
و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`،
و`<function_calls>...</function_calls>`، وكتل استدعاء الأدوات المقتطعة)،
وبنية استدعاء الأدوات المخفَّضة، ورموز التحكم في النموذج المتسربة بصيغة ASCII/العرض الكامل،
وXML المشوَّه الخاص باستدعاء أدوات MiniMax قبل التنقيح/الاقتطاع.

لا تتم مشاركة بيانات اعتماد الوكيل الرئيسي **تلقائيًا**. لا تعِد استخدام `agentDir`
عبر عدة وكلاء (فهذا يسبب تعارضات في المصادقة/الجلسات). وإذا أردت مشاركة بيانات الاعتماد،
فانسخ `auth-profiles.json` إلى `agentDir` الخاص بالوكيل الآخر.

يتم تحميل Skills من مساحة عمل كل وكيل بالإضافة إلى الجذور المشتركة مثل
`~/.openclaw/skills`، ثم تُرشَّح وفق قائمة السماح الفعالة لـ Skills الخاصة بالوكيل عند
تكوينها. استخدم `agents.defaults.skills` لخط أساس مشترك و
`agents.list[].skills` للاستبدال لكل وكيل. راجع
[Skills: لكل وكيل مقابل المشتركة](/ar/tools/skills#per-agent-vs-shared-skills) و
[Skills: قوائم سماح Skills الخاصة بالوكيل](/ar/tools/skills#agent-skill-allowlists).

يمكن لـ Gateway استضافة **وكيل واحد** (افتراضيًا) أو **عدة وكلاء** جنبًا إلى جنب.

**ملاحظة حول مساحة العمل:** مساحة عمل كل وكيل هي **cwd الافتراضي**، وليست
sandbox صارمًا. تُحل المسارات النسبية داخل مساحة العمل، لكن المسارات المطلقة قد
تصل إلى مواقع أخرى على المضيف ما لم يتم تفعيل sandboxing. راجع
[Sandboxing](/ar/gateway/sandboxing).

## المسارات (خريطة سريعة)

- التكوين: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة: `~/.openclaw` (أو `OPENCLAW_STATE_DIR`)
- مساحة العمل: `~/.openclaw/workspace` (أو `~/.openclaw/workspace-<agentId>`)
- دليل الوكيل: `~/.openclaw/agents/<agentId>/agent` (أو `agents.list[].agentDir`)
- الجلسات: `~/.openclaw/agents/<agentId>/sessions`

### وضع الوكيل الواحد (الافتراضي)

إذا لم تفعل شيئًا، فسيشغّل OpenClaw وكيلًا واحدًا:

- تكون القيمة الافتراضية لـ `agentId` هي **`main`**.
- تُفهرس الجلسات على شكل `agent:main:<mainKey>`.
- تكون مساحة العمل افتراضيًا `~/.openclaw/workspace` (أو `~/.openclaw/workspace-<profile>` عند ضبط `OPENCLAW_PROFILE`).
- تكون الحالة افتراضيًا `~/.openclaw/agents/main/agent`.

## مساعد الوكيل

استخدم معالج الوكيل لإضافة وكيل معزول جديد:

```bash
openclaw agents add work
```

ثم أضف `bindings` (أو دع المعالج يفعل ذلك) لتوجيه الرسائل الواردة.

تحقق باستخدام:

```bash
openclaw agents list --bindings
```

## البدء السريع

<Steps>
  <Step title="أنشئ مساحة عمل كل وكيل">

استخدم المعالج أو أنشئ مساحات العمل يدويًا:

```bash
openclaw agents add coding
openclaw agents add social
```

يحصل كل وكيل على مساحة عمله الخاصة مع `SOUL.md` و`AGENTS.md` و`USER.md` اختياريًا، بالإضافة إلى `agentDir` مخصص ومخزن جلسات تحت `~/.openclaw/agents/<agentId>`.

  </Step>

  <Step title="أنشئ حسابات القنوات">

أنشئ حسابًا واحدًا لكل وكيل على القنوات التي تفضلها:

- Discord: بوت واحد لكل وكيل، فعّل Message Content Intent، وانسخ كل رمز مميز.
- Telegram: بوت واحد لكل وكيل عبر BotFather، وانسخ كل رمز مميز.
- WhatsApp: اربط كل رقم هاتف لكل حساب.

```bash
openclaw channels login --channel whatsapp --account work
```

راجع أدلة القنوات: [Discord](/ar/channels/discord) و[Telegram](/ar/channels/telegram) و[WhatsApp](/ar/channels/whatsapp).

  </Step>

  <Step title="أضف الوكلاء والحسابات والروابط">

أضف الوكلاء تحت `agents.list`، وحسابات القنوات تحت `channels.<channel>.accounts`، ثم صِل بينها باستخدام `bindings` (الأمثلة أدناه).

  </Step>

  <Step title="أعد التشغيل وتحقق">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## عدة وكلاء = عدة أشخاص، عدة شخصيات

مع **عدة وكلاء**، يصبح كل `agentId` **شخصية معزولة بالكامل**:

- **أرقام هواتف/حسابات مختلفة** (لكل قناة `accountId`).
- **شخصيات مختلفة** (عبر ملفات مساحة العمل لكل وكيل مثل `AGENTS.md` و`SOUL.md`).
- **مصادقة + جلسات منفصلة** (من دون تداخل إلا إذا تم تفعيله صراحةً).

وهذا يتيح **لعدة أشخاص** مشاركة خادم Gateway واحد مع الحفاظ على عزل “عقول” الذكاء الاصطناعي الخاصة بهم وبياناتهم.

## بحث ذاكرة QMD عبر الوكلاء

إذا كان ينبغي لوكيل واحد أن يبحث في نصوص جلسات QMD الخاصة بوكيل آخر، فأضف
مجموعات إضافية تحت `agents.list[].memorySearch.qmd.extraCollections`.
استخدم `agents.defaults.memorySearch.qmd.extraCollections` فقط عندما ينبغي لكل الوكلاء
وراثة مجموعات النصوص المشتركة نفسها.

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
      memorySearch: {
        qmd: {
          extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
        },
      },
    },
    list: [
      {
        id: "main",
        workspace: "~/workspaces/main",
        memorySearch: {
          qmd: {
            extraCollections: [{ path: "notes" }], // تُحل داخل مساحة العمل -> مجموعة باسم "notes-main"
          },
        },
      },
      { id: "family", workspace: "~/workspaces/family" },
    ],
  },
  memory: {
    backend: "qmd",
    qmd: { includeDefaultMemory: false },
  },
}
```

يمكن أن يكون مسار المجموعة الإضافية مشتركًا بين الوكلاء، لكن اسم المجموعة
يبقى صريحًا عندما يكون المسار خارج مساحة عمل الوكيل. أما المسارات داخل مساحة
العمل فتبقى ضمن نطاق الوكيل بحيث يحتفظ كل وكيل بمجموعة البحث الخاصة به في النصوص.

## رقم WhatsApp واحد، عدة أشخاص (تقسيم الرسائل الخاصة)

يمكنك توجيه **رسائل WhatsApp الخاصة المختلفة** إلى وكلاء مختلفين مع البقاء على **حساب WhatsApp واحد**. طابق على مُرسل E.164 (مثل `+15551234567`) مع `peer.kind: "direct"`. ستظل الردود صادرة من رقم WhatsApp نفسه (لا توجد هوية مرسل لكل وكيل).

تفصيل مهم: تُدمج الدردشات المباشرة في **مفتاح الجلسة الرئيسية** الخاص بالوكيل، لذلك يتطلب العزل الحقيقي **وكيلًا واحدًا لكل شخص**.

مثال:

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

ملاحظات:

- التحكم في الوصول إلى الرسائل الخاصة يكون **عامًا لكل حساب WhatsApp** (الاقتران/قائمة السماح)، وليس لكل وكيل.
- بالنسبة إلى المجموعات المشتركة، اربط المجموعة بوكيل واحد أو استخدم [مجموعات البث](/ar/channels/broadcast-groups).

## قواعد التوجيه (كيف تختار الرسائل وكيلاً)

تكون الروابط **حتمية** و**الأكثر تحديدًا يفوز**:

1. مطابقة `peer` (معرّف الرسالة الخاصة/المجموعة/القناة المطابق تمامًا)
2. مطابقة `parentPeer` (وراثة سلسلة المحادثة)
3. `guildId + roles` (توجيه أدوار Discord)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. مطابقة `accountId` لقناة
7. مطابقة على مستوى القناة (`accountId: "*"`)
8. الرجوع إلى الوكيل الافتراضي (`agents.list[].default`، وإلا أول إدخال في القائمة، والافتراضي: `main`)

إذا تطابقت عدة روابط في المستوى نفسه، فإن أول رابط حسب ترتيب التكوين هو الذي يفوز.
إذا كان الرابط يضبط عدة حقول مطابقة (مثل `peer` + `guildId`)، فإن جميع الحقول المحددة مطلوبة (دلالات `AND`).

تفصيل مهم حول نطاق الحساب:

- الرابط الذي يحذف `accountId` يطابق الحساب الافتراضي فقط.
- استخدم `accountId: "*"` كبديل احتياطي على مستوى القناة عبر جميع الحسابات.
- إذا أضفت لاحقًا الرابط نفسه للوكيل نفسه مع معرّف حساب صريح، فسيقوم OpenClaw بترقية الرابط الموجود على مستوى القناة فقط إلى نطاق الحساب بدلًا من تكراره.

## عدة حسابات / أرقام هواتف

تستخدم القنوات التي تدعم **عدة حسابات** (مثل WhatsApp) `accountId` لتعريف
كل عملية تسجيل دخول. ويمكن توجيه كل `accountId` إلى وكيل مختلف، بحيث يمكن لخادم واحد استضافة
عدة أرقام هواتف من دون خلط الجلسات.

إذا كنت تريد حسابًا افتراضيًا على مستوى القناة عند حذف `accountId`، فاضبط
`channels.<channel>.defaultAccount` (اختياري). وعندما لا يكون مضبوطًا، يعود OpenClaw
إلى `default` إذا كان موجودًا، وإلا إلى أول معرّف حساب مكوّن (بعد الفرز).

تشمل القنوات الشائعة التي تدعم هذا النمط:

- `whatsapp` و`telegram` و`discord` و`slack` و`signal` و`imessage`
- `irc` و`line` و`googlechat` و`mattermost` و`matrix` و`nextcloud-talk`
- `bluebubbles` و`zalo` و`zalouser` و`nostr` و`feishu`

## المفاهيم

- `agentId`: “عقل” واحد (مساحة العمل، ومصادقة لكل وكيل، ومخزن جلسات لكل وكيل).
- `accountId`: مثيل حساب قناة واحد (مثل حساب WhatsApp `"personal"` مقابل `"biz"`).
- `binding`: يوجّه الرسائل الواردة إلى `agentId` بحسب `(channel, accountId, peer)` واختياريًا معرّفات guild/team.
- تُدمج الدردشات المباشرة في `agent:<agentId>:<mainKey>` (الـ “main” لكل وكيل؛ `session.mainKey`).

## أمثلة المنصات

### بوتات Discord لكل وكيل

يُربط كل حساب بوت Discord بمعرّف `accountId` فريد. اربط كل حساب بوكيل واحتفظ بقوائم السماح لكل بوت.

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "coding", workspace: "~/.openclaw/workspace-coding" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "discord", accountId: "default" } },
    { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
  ],
  channels: {
    discord: {
      groupPolicy: "allowlist",
      accounts: {
        default: {
          token: "DISCORD_BOT_TOKEN_MAIN",
          guilds: {
            "123456789012345678": {
              channels: {
                "222222222222222222": { allow: true, requireMention: false },
              },
            },
          },
        },
        coding: {
          token: "DISCORD_BOT_TOKEN_CODING",
          guilds: {
            "123456789012345678": {
              channels: {
                "333333333333333333": { allow: true, requireMention: false },
              },
            },
          },
        },
      },
    },
  },
}
```

ملاحظات:

- ادعُ كل بوت إلى guild وفعّل Message Content Intent.
- تُخزَّن الرموز المميزة في `channels.discord.accounts.<id>.token` (يمكن للحساب الافتراضي استخدام `DISCORD_BOT_TOKEN`).

### بوتات Telegram لكل وكيل

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "telegram", accountId: "default" } },
    { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
  ],
  channels: {
    telegram: {
      accounts: {
        default: {
          botToken: "123456:ABC...",
          dmPolicy: "pairing",
        },
        alerts: {
          botToken: "987654:XYZ...",
          dmPolicy: "allowlist",
          allowFrom: ["tg:123456789"],
        },
      },
    },
  },
}
```

ملاحظات:

- أنشئ بوتًا واحدًا لكل وكيل عبر BotFather وانسخ كل رمز مميز.
- تُخزَّن الرموز المميزة في `channels.telegram.accounts.<id>.botToken` (يمكن للحساب الافتراضي استخدام `TELEGRAM_BOT_TOKEN`).

### أرقام WhatsApp لكل وكيل

اربط كل حساب قبل بدء Gateway:

```bash
openclaw channels login --channel whatsapp --account personal
openclaw channels login --channel whatsapp --account biz
```

`~/.openclaw/openclaw.json` ‏(JSON5):

```js
{
  agents: {
    list: [
      {
        id: "home",
        default: true,
        name: "Home",
        workspace: "~/.openclaw/workspace-home",
        agentDir: "~/.openclaw/agents/home/agent",
      },
      {
        id: "work",
        name: "Work",
        workspace: "~/.openclaw/workspace-work",
        agentDir: "~/.openclaw/agents/work/agent",
      },
    ],
  },

  // توجيه حتمي: أول تطابق يفوز (الأكثر تحديدًا أولًا).
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // تجاوز اختياري لكل نظير (مثال: إرسال مجموعة محددة إلى وكيل work).
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // معطّل افتراضيًا: يجب تفعيل المراسلة بين الوكلاء صراحةً + إضافتها إلى قائمة السماح.
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },

  channels: {
    whatsapp: {
      accounts: {
        personal: {
          // تجاوز اختياري. الافتراضي: ~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // تجاوز اختياري. الافتراضي: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## مثال: دردشة WhatsApp يومية + عمل عميق على Telegram

قسّم حسب القناة: وجّه WhatsApp إلى وكيل يومي سريع وTelegram إلى وكيل Opus.

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } },
  ],
}
```

ملاحظات:

- إذا كان لديك عدة حسابات لقناة ما، فأضف `accountId` إلى الربط (على سبيل المثال `{ channel: "whatsapp", accountId: "personal" }`).
- لتوجيه رسالة خاصة/مجموعة واحدة إلى Opus مع إبقاء الباقي على chat، أضف ربط `match.peer` لذلك النظير؛ إذ تفوز مطابقة النظير دائمًا على القواعد العامة للقناة.

## مثال: القناة نفسها، نظير واحد إلى Opus

أبقِ WhatsApp على الوكيل السريع، لكن وجّه رسالة خاصة واحدة إلى Opus:

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    {
      agentId: "opus",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
    },
    { agentId: "chat", match: { channel: "whatsapp" } },
  ],
}
```

تفوز روابط النظير دائمًا، لذا أبقها فوق القاعدة العامة للقناة.

## وكيل عائلي مرتبط بمجموعة WhatsApp

اربط وكيلًا عائليًا مخصصًا بمجموعة WhatsApp واحدة، مع تقييد بالإشارات
وسياسة أدوات أكثر صرامة:

```json5
{
  agents: {
    list: [
      {
        id: "family",
        name: "Family",
        workspace: "~/.openclaw/workspace-family",
        identity: { name: "Family Bot" },
        groupChat: {
          mentionPatterns: ["@family", "@familybot", "@Family Bot"],
        },
        sandbox: {
          mode: "all",
          scope: "agent",
        },
        tools: {
          allow: [
            "exec",
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
        },
      },
    ],
  },
  bindings: [
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" },
      },
    },
  ],
}
```

ملاحظات:

- قوائم السماح/المنع الخاصة بالأدوات هي **أدوات** وليست Skills. إذا كانت Skill تحتاج إلى تشغيل
  ملف ثنائي، فتأكد من أن `exec` مسموح به وأن الملف الثنائي موجود داخل sandbox.
- لتقييد أكثر صرامة، اضبط `agents.list[].groupChat.mentionPatterns` وأبقِ
  قوائم سماح المجموعات مفعّلة للقناة.

## إعداد sandbox والأدوات لكل وكيل

يمكن أن يكون لكل وكيل إعداد sandbox وقيود أدوات خاصة به:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // لا يوجد sandbox للوكيل الشخصي
        },
        // لا توجد قيود على الأدوات - جميع الأدوات متاحة
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // دائمًا داخل sandbox
          scope: "agent",  // حاوية واحدة لكل وكيل
          docker: {
            // إعداد اختياري لمرة واحدة بعد إنشاء الحاوية
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // أداة read فقط
          deny: ["exec", "write", "edit", "apply_patch"],    // منع البقية
        },
      },
    ],
  },
}
```

ملاحظة: يوجد `setupCommand` تحت `sandbox.docker` ويُشغَّل مرة واحدة عند إنشاء الحاوية.
يتم تجاهل تجاوزات `sandbox.docker.*` لكل وكيل عندما يكون النطاق المحلَّل هو `"shared"`.

**الفوائد:**

- **عزل أمني**: تقييد الأدوات للوكلاء غير الموثوقين
- **التحكم في الموارد**: وضع وكلاء محددين داخل sandbox مع إبقاء الآخرين على المضيف
- **سياسات مرنة**: أذونات مختلفة لكل وكيل

ملاحظة: `tools.elevated` هو إعداد **عام** وقائم على المرسِل؛ ولا يمكن تكوينه لكل وكيل.
إذا كنت تحتاج إلى حدود لكل وكيل، فاستخدم `agents.list[].tools` لمنع `exec`.
أما للاستهداف الجماعي، فاستخدم `agents.list[].groupChat.mentionPatterns` بحيث ترتبط إشارات @ بوضوح بالوكيل المقصود.

راجع [sandbox والأدوات متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools) للاطلاع على أمثلة مفصلة.

## ذو صلة

- [توجيه القنوات](/ar/channels/channel-routing) — كيفية توجيه الرسائل إلى الوكلاء
- [الوكلاء الفرعيون](/ar/tools/subagents) — تشغيل عمليات وكلاء في الخلفية
- [وكلاء ACP](/ar/tools/acp-agents) — تشغيل حزم ترميز خارجية
- [الحضور](/ar/concepts/presence) — حضور الوكيل وتوفره
- [الجلسة](/ar/concepts/session) — عزل الجلسات والتوجيه
