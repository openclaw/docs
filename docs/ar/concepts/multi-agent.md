---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'التوجيه متعدد الوكلاء: وكلاء معزولون، وحسابات القنوات، والارتباطات'
title: توجيه متعدد الوكلاء
x-i18n:
    generated_at: "2026-04-30T07:53:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67adea74d5f97feff3f816cc4c34c9429e7659289013e5a7c7623bd185a50a31
    source_path: concepts/multi-agent.md
    workflow: 16
---

شغّل عدة وكلاء _معزولين_، لكل منهم مساحة عمل خاصة به، ودليل حالة (`agentDir`)، وسجل جلسة، إلى جانب حسابات قناة متعددة (مثل حسابي WhatsApp) داخل Gateway واحد قيد التشغيل. تُوجَّه الرسائل الواردة إلى الوكيل الصحيح عبر عمليات الربط.

الـ **وكيل** هنا هو النطاق الكامل لكل شخصية: ملفات مساحة العمل، وملفات تعريف المصادقة، وسجل النماذج، ومخزن الجلسات. `agentDir` هو دليل الحالة على القرص الذي يحتوي على هذا الإعداد الخاص بكل وكيل في `~/.openclaw/agents/<agentId>/`. يربط **الربط** حساب قناة (مثل مساحة عمل Slack أو رقم WhatsApp) بأحد هؤلاء الوكلاء.

## ما هو "وكيل واحد"؟

الـ **وكيل** هو عقل محدد النطاق بالكامل وله ما يلي:

- **مساحة العمل** (الملفات، وAGENTS.md/SOUL.md/USER.md، والملاحظات المحلية، وقواعد الشخصية).
- **دليل الحالة** (`agentDir`) لملفات تعريف المصادقة، وسجل النماذج، وإعدادات كل وكيل.
- **مخزن الجلسات** (سجل المحادثة + حالة التوجيه) تحت `~/.openclaw/agents/<agentId>/sessions`.

ملفات تعريف المصادقة **خاصة بكل وكيل**. يقرأ كل وكيل من ملفه الخاص:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` هو مسار الاسترجاع عبر الجلسات الأكثر أمانا هنا أيضا: فهو يعيد عرضا محدودا ومنقحا، وليس تفريغا خاما للنص الكامل. يزيل استرجاع المساعد وسوم التفكير، وبنية `<relevant-memories>`، وحمولات XML النصية الصرفة لاستدعاءات الأدوات (بما في ذلك `<tool_call>...</tool_call>`، و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`، و`<function_calls>...</function_calls>`، وكتل استدعاء الأدوات المقتطعة)، وبنية استدعاء الأدوات المخفّضة، ورموز تحكم النماذج ASCII/كاملة العرض المسرّبة، وXML استدعاء أدوات MiniMax غير السليم قبل التنقيح/الاقتطاع.
</Note>

<Warning>
لا تعد استخدام `agentDir` عبر وكلاء متعددين أبدا (فذلك يسبب تصادمات في المصادقة/الجلسات). يمكن للوكلاء القراءة من ملفات تعريف المصادقة الخاصة بالوكيل الافتراضي/الرئيسي عندما لا يكون لديهم ملف تعريف محلي، لكن OpenClaw لا ينسخ رموز تحديث OAuth إلى مخزن الوكيل الثانوي. إذا أردت حساب OAuth مستقلا، فسجّل الدخول من ذلك الوكيل؛ وإذا نسخت بيانات الاعتماد يدويا، فانسخ فقط ملفات تعريف `api_key` أو `token` الثابتة والقابلة للنقل.
</Warning>

تُحمَّل Skills من مساحة عمل كل وكيل إضافة إلى الجذور المشتركة مثل `~/.openclaw/skills`، ثم تُرشَّح حسب قائمة السماح الفعالة لمهارات الوكيل عند إعدادها. استخدم `agents.defaults.skills` لخط أساس مشترك و`agents.list[].skills` لاستبدال خاص بكل وكيل. راجع [Skills: لكل وكيل مقابل مشتركة](/ar/tools/skills#per-agent-vs-shared-skills) و[Skills: قوائم سماح مهارات الوكيل](/ar/tools/skills#agent-skill-allowlists).

يمكن لـ Gateway استضافة **وكيل واحد** (افتراضيا) أو **عدة وكلاء** جنبا إلى جنب.

<Note>
**ملاحظة مساحة العمل:** مساحة عمل كل وكيل هي **دليل العمل الحالي الافتراضي**، وليست صندوق عزل صارما. تُحل المسارات النسبية داخل مساحة العمل، لكن المسارات المطلقة يمكن أن تصل إلى مواقع أخرى على المضيف ما لم يكن العزل مفعلا. راجع [العزل](/ar/gateway/sandboxing).
</Note>

## المسارات (خريطة سريعة)

- الإعداد: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة: `~/.openclaw` (أو `OPENCLAW_STATE_DIR`)
- مساحة العمل: `~/.openclaw/workspace` (أو `~/.openclaw/workspace-<agentId>`)
- دليل الوكيل: `~/.openclaw/agents/<agentId>/agent` (أو `agents.list[].agentDir`)
- الجلسات: `~/.openclaw/agents/<agentId>/sessions`

### وضع الوكيل الواحد (افتراضي)

إذا لم تفعل شيئا، يشغل OpenClaw وكيلا واحدا:

- تكون القيمة الافتراضية لـ `agentId` هي **`main`**.
- تُفهرس الجلسات بصيغة `agent:main:<mainKey>`.
- تكون مساحة العمل افتراضيا `~/.openclaw/workspace` (أو `~/.openclaw/workspace-<profile>` عند ضبط `OPENCLAW_PROFILE`).
- تكون الحالة افتراضيا `~/.openclaw/agents/main/agent`.

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
  <Step title="Create each agent workspace">
    استخدم المعالج أو أنشئ مساحات العمل يدويا:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    يحصل كل وكيل على مساحة عمل خاصة به تحتوي على `SOUL.md` و`AGENTS.md` و`USER.md` اختياري، إضافة إلى `agentDir` مخصص ومخزن جلسات تحت `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Create channel accounts">
    أنشئ حسابا واحدا لكل وكيل على قنواتك المفضلة:

    - Discord: روبوت واحد لكل وكيل، فعّل Message Content Intent، وانسخ كل رمز.
    - Telegram: روبوت واحد لكل وكيل عبر BotFather، وانسخ كل رمز.
    - WhatsApp: اربط كل رقم هاتف بكل حساب.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    راجع أدلة القنوات: [Discord](/ar/channels/discord)، [Telegram](/ar/channels/telegram)، [WhatsApp](/ar/channels/whatsapp).

  </Step>
  <Step title="Add agents, accounts, and bindings">
    أضف الوكلاء تحت `agents.list`، وحسابات القنوات تحت `channels.<channel>.accounts`، واربطها باستخدام `bindings` (الأمثلة أدناه).
  </Step>
  <Step title="Restart and verify">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## عدة وكلاء = عدة أشخاص، عدة شخصيات

مع **عدة وكلاء**، يصبح كل `agentId` **شخصية معزولة بالكامل**:

- **أرقام هاتف/حسابات مختلفة** (لكل قناة `accountId`).
- **شخصيات مختلفة** (ملفات مساحة عمل خاصة بكل وكيل مثل `AGENTS.md` و`SOUL.md`).
- **مصادقة + جلسات منفصلة** (لا تداخل ما لم يُفعّل صراحة).

يتيح هذا لـ **عدة أشخاص** مشاركة خادم Gateway واحد مع إبقاء "عقول" الذكاء الاصطناعي وبياناتهم معزولة.

## بحث ذاكرة QMD عبر الوكلاء

إذا كان يجب على وكيل البحث في نصوص جلسات QMD لوكيل آخر، فأضف مجموعات إضافية تحت `agents.list[].memorySearch.qmd.extraCollections`. استخدم `agents.defaults.memorySearch.qmd.extraCollections` فقط عندما يجب أن يرث كل وكيل مجموعات النصوص المشتركة نفسها.

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
            extraCollections: [{ path: "notes" }], // resolves inside workspace -> collection named "notes-main"
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

يمكن مشاركة مسار المجموعة الإضافية عبر الوكلاء، لكن يبقى اسم المجموعة صريحا عندما يكون المسار خارج مساحة عمل الوكيل. تظل المسارات داخل مساحة العمل محددة النطاق للوكيل كي يحتفظ كل وكيل بمجموعة بحث النصوص الخاصة به.

## رقم WhatsApp واحد، عدة أشخاص (تقسيم الرسائل المباشرة)

يمكنك توجيه **رسائل WhatsApp مباشرة مختلفة** إلى وكلاء مختلفين مع البقاء على **حساب WhatsApp واحد**. طابق حسب مرسل E.164 (مثل `+15551234567`) مع `peer.kind: "direct"`. ستظل الردود صادرة من رقم WhatsApp نفسه (لا توجد هوية مرسل خاصة بكل وكيل).

<Note>
تنهار المحادثات المباشرة إلى **مفتاح الجلسة الرئيسي** للوكيل، لذلك يتطلب العزل الحقيقي **وكيلا واحدا لكل شخص**.
</Note>

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

- التحكم في الوصول إلى الرسائل المباشرة **عام لكل حساب WhatsApp** (الاقتران/قائمة السماح)، وليس لكل وكيل.
- للمجموعات المشتركة، اربط المجموعة بوكيل واحد أو استخدم [مجموعات البث](/ar/channels/broadcast-groups).

## قواعد التوجيه (كيف تختار الرسائل وكيلا)

عمليات الربط **حتمية** و**الأكثر تحديدا يفوز**:

<Steps>
  <Step title="peer match">
    معرّف رسالة مباشرة/مجموعة/قناة مطابق تماما.
  </Step>
  <Step title="parentPeer match">
    وراثة الخيط.
  </Step>
  <Step title="guildId + roles">
    توجيه أدوار Discord.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="accountId match for a channel">
    مسار احتياطي لكل حساب.
  </Step>
  <Step title="Channel-level match">
    `accountId: "*"`.
  </Step>
  <Step title="Default agent">
    مسار احتياطي إلى `agents.list[].default`، وإلا أول إدخال في القائمة، الافتراضي: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Tie-breaking and AND semantics">
    - إذا طابقت عدة عمليات ربط في المستوى نفسه، تفوز أول واحدة حسب ترتيب الإعداد.
    - إذا ضبط ربط عدة حقول مطابقة (مثلا `peer` + `guildId`)، فكل الحقول المحددة مطلوبة (دلالات `AND`).

  </Accordion>
  <Accordion title="Account-scope detail">
    - الربط الذي يحذف `accountId` يطابق الحساب الافتراضي فقط.
    - استخدم `accountId: "*"` لمسار احتياطي على مستوى القناة عبر كل الحسابات.
    - إذا أضفت لاحقا الربط نفسه للوكيل نفسه مع معرّف حساب صريح، يرقي OpenClaw الربط الحالي الخاص بالقناة فقط إلى ربط محدد النطاق بالحساب بدلا من تكراره.

  </Accordion>
</AccordionGroup>

## حسابات / أرقام هاتف متعددة

تستخدم القنوات التي تدعم **حسابات متعددة** (مثل WhatsApp) `accountId` لتحديد كل تسجيل دخول. يمكن توجيه كل `accountId` إلى وكيل مختلف، لذلك يمكن لخادم واحد استضافة أرقام هاتف متعددة دون خلط الجلسات.

إذا أردت حسابا افتراضيا على مستوى القناة عند حذف `accountId`، فاضبط `channels.<channel>.defaultAccount` (اختياري). عند عدم ضبطه، يعود OpenClaw إلى `default` إذا كان موجودا، وإلا إلى أول معرّف حساب مضبوط (مرتّب).

تشمل القنوات الشائعة التي تدعم هذا النمط:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## المفاهيم

- `agentId`: "عقل" واحد (مساحة عمل، مصادقة خاصة بكل وكيل، مخزن جلسات خاص بكل وكيل).
- `accountId`: نسخة حساب قناة واحدة (مثلا حساب WhatsApp `"personal"` مقابل `"biz"`).
- `binding`: يوجه الرسائل الواردة إلى `agentId` حسب `(channel, accountId, peer)` واختياريا معرّفات النقابة/الفريق.
- تنهار المحادثات المباشرة إلى `agent:<agentId>:<mainKey>` ("الرئيسية" لكل وكيل؛ `session.mainKey`).

## أمثلة المنصات

<AccordionGroup>
  <Accordion title="Discord bots per agent">
    يرتبط كل حساب روبوت Discord بـ `accountId` فريد. اربط كل حساب بوكيل، واحتفظ بقوائم السماح لكل روبوت.

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

    - ادعُ كل بوت إلى الخادم وفعّل Message Content Intent.
    - توجد الرموز المميزة في `channels.discord.accounts.<id>.token` (يمكن للحساب الافتراضي استخدام `DISCORD_BOT_TOKEN`).

  </Accordion>
  <Accordion title="بوتات Telegram لكل وكيل">
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

    - أنشئ بوتًا واحدًا لكل وكيل باستخدام BotFather وانسخ كل رمز مميز.
    - توجد الرموز المميزة في `channels.telegram.accounts.<id>.botToken` (يمكن للحساب الافتراضي استخدام `TELEGRAM_BOT_TOKEN`).

  </Accordion>
  <Accordion title="أرقام WhatsApp لكل وكيل">
    اربط كل حساب قبل بدء Gateway:

    ```bash
    openclaw channels login --channel whatsapp --account personal
    openclaw channels login --channel whatsapp --account biz
    ```

    `~/.openclaw/openclaw.json` (JSON5):

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

      // Deterministic routing: first match wins (most-specific first).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Optional per-peer override (example: send a specific group to work agent).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Off by default: agent-to-agent messaging must be explicitly enabled + allowlisted.
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
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/biz
              // authDir: "~/.openclaw/credentials/whatsapp/biz",
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## الأنماط الشائعة

<Tabs>
  <Tab title="WhatsApp يومي + عمل معمّق عبر Telegram">
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

    - إذا كانت لديك حسابات متعددة لقناة ما، فأضف `accountId` إلى الربط (على سبيل المثال `{ channel: "whatsapp", accountId: "personal" }`).
    - لتوجيه رسالة مباشرة/مجموعة واحدة إلى Opus مع إبقاء البقية على وكيل المحادثة، أضف ربط `match.peer` لذلك النظير؛ تطابقات النظير تفوز دائمًا على القواعد الشاملة للقناة.

  </Tab>
  <Tab title="القناة نفسها، نظير واحد إلى Opus">
    أبقِ WhatsApp على الوكيل السريع، لكن وجّه رسالة مباشرة واحدة إلى Opus:

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

    تفوز روابط النظير دائمًا، لذلك أبقِها فوق القاعدة الشاملة للقناة.

  </Tab>
  <Tab title="وكيل العائلة المرتبط بمجموعة WhatsApp">
    اربط وكيلًا مخصصًا للعائلة بمجموعة WhatsApp واحدة، مع بوابة الإشارات وسياسة أدوات أكثر تشددًا:

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

    - قوائم السماح/الرفض للأدوات هي **أدوات**، وليست Skills. إذا احتاجت Skill إلى تشغيل ملف ثنائي، فتأكد من السماح بـ `exec` ومن وجود الملف الثنائي في صندوق العزل.
    - لبوابة أكثر تشددًا، اضبط `agents.list[].groupChat.mentionPatterns` وأبقِ قوائم السماح للمجموعات مفعّلة للقناة.

  </Tab>
</Tabs>

## صندوق العزل وتكوين الأدوات لكل وكيل

يمكن أن يكون لكل وكيل صندوق عزل وقيود أدوات خاصة به:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // No sandbox for personal agent
        },
        // No tool restrictions - all tools available
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Always sandboxed
          scope: "agent",  // One container per agent
          docker: {
            // Optional one-time setup after container creation
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Only read tool
          deny: ["exec", "write", "edit", "apply_patch"],    // Deny others
        },
      },
    ],
  },
}
```

<Note>
يوجد `setupCommand` تحت `sandbox.docker` ويُشغّل مرة واحدة عند إنشاء الحاوية. تُتجاهل تجاوزات `sandbox.docker.*` لكل وكيل عندما يكون النطاق المحسوم هو `"shared"`.
</Note>

**الفوائد:**

- **عزل أمني**: قيّد الأدوات للوكلاء غير الموثوقين.
- **التحكم في الموارد**: اعزل وكلاء محددين مع إبقاء آخرين على المضيف.
- **سياسات مرنة**: أذونات مختلفة لكل وكيل.

<Note>
`tools.elevated` عام **وشامل** ويعتمد على المُرسل؛ ولا يمكن تكوينه لكل وكيل. إذا كنت تحتاج إلى حدود لكل وكيل، فاستخدم `agents.list[].tools` لرفض `exec`. لاستهداف المجموعات، استخدم `agents.list[].groupChat.mentionPatterns` حتى تُربط إشارات @ بوضوح بالوكيل المقصود.
</Note>

راجع [صندوق العزل والأدوات متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools) للحصول على أمثلة تفصيلية.

## ذات صلة

- [وكلاء ACP](/ar/tools/acp-agents) — تشغيل أدوات ترميز خارجية
- [توجيه القنوات](/ar/channels/channel-routing) — كيفية توجيه الرسائل إلى الوكلاء
- [الحضور](/ar/concepts/presence) — حضور الوكيل وتوفره
- [الجلسة](/ar/concepts/session) — عزل الجلسات وتوجيهها
- [الوكلاء الفرعيون](/ar/tools/subagents) — إنشاء تشغيلات وكلاء في الخلفية
