---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'توجيه متعدد الوكلاء: وكلاء معزولون وحسابات قنوات وارتباطات'
title: توجيه متعدد الوكلاء
x-i18n:
    generated_at: "2026-06-27T17:30:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c1c55188cd27ea786cf65dcabd356a602e1e6da5f842532b189df59195274db
    source_path: concepts/multi-agent.md
    workflow: 16
---

شغّل عدة وكلاء _معزولين_، لكل واحد مساحة عمل خاصة به، ودليل حالة (`agentDir`)، وسجل جلسات، إلى جانب عدة حسابات قنوات (مثل حسابي WhatsApp) ضمن Gateway واحد قيد التشغيل. تُوجَّه الرسائل الواردة إلى الوكيل الصحيح عبر الارتباطات.

**الوكيل** هنا هو النطاق الكامل لكل شخصية: ملفات مساحة العمل، وملفات تعريف المصادقة، وسجل النماذج، ومخزن الجلسات. `agentDir` هو دليل الحالة على القرص الذي يحتوي على هذا الإعداد الخاص بكل وكيل في `~/.openclaw/agents/<agentId>/`. أما **الارتباط** فيربط حساب قناة (مثل مساحة عمل Slack أو رقم WhatsApp) بأحد هؤلاء الوكلاء.

## ما هو "الوكيل الواحد"؟

**الوكيل** هو عقل محدد النطاق بالكامل وله ما يلي:

- **مساحة العمل** (الملفات، وAGENTS.md/SOUL.md/USER.md، والملاحظات المحلية، وقواعد الشخصية).
- **دليل الحالة** (`agentDir`) لملفات تعريف المصادقة، وسجل النماذج، وإعدادات كل وكيل.
- **مخزن الجلسات** (سجل المحادثات + حالة التوجيه) ضمن `~/.openclaw/agents/<agentId>/sessions`.

ملفات تعريف المصادقة تكون **لكل وكيل**. يقرأ كل وكيل من ملفه الخاص:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` هو مسار الاستدعاء عبر الجلسات الأكثر أمانا هنا أيضا: فهو يعيد عرضا محدودا ومنقحا، وليس تفريغا خاما للنص الكامل. يزيل استدعاء المساعد وسوم التفكير، وبنية `<relevant-memories>`، وحمولات XML النصية الصريحة لاستدعاءات الأدوات (بما في ذلك `<tool_call>...</tool_call>` و`<function_call>...</function_call>` و`<tool_calls>...</tool_calls>` و`<function_calls>...</function_calls>` وكتل استدعاء الأدوات المقتطعة)، وبنية استدعاءات الأدوات المخفضة، ورموز تحكم النموذج المسرّبة بصيغة ASCII أو كاملة العرض، وXML استدعاءات أدوات MiniMax المشوهة قبل التنقيح/الاقتطاع.
</Note>

<Warning>
لا تعِد استخدام `agentDir` عبر الوكلاء أبدا (فذلك يسبب تضاربا في المصادقة/الجلسات). يمكن للوكلاء
القراءة رجوعا إلى ملفات تعريف مصادقة الوكيل الافتراضي/الرئيسي عندما لا تكون لديهم
ملفات تعريف محلية، لكن OpenClaw لا ينسخ رموز تحديث OAuth إلى
مخزن الوكيل الثانوي. إذا أردت حساب OAuth مستقلا، فسجل الدخول من
ذلك الوكيل؛ وإذا نسخت بيانات الاعتماد يدويا، فانسخ فقط ملفات تعريف
`api_key` أو `token` الثابتة والقابلة للنقل.
</Warning>

تُحمَّل Skills من مساحة عمل كل وكيل إضافة إلى الجذور المشتركة مثل `~/.openclaw/skills`، ثم تُصفّى بحسب قائمة Skills المسموح بها للوكيل الفعّال عند إعدادها. استخدم `agents.defaults.skills` كأساس مشترك و`agents.list[].skills` للاستبدال لكل وكيل. راجع [Skills: لكل وكيل مقابل المشتركة](/ar/tools/skills#per-agent-vs-shared-skills) و[Skills: قوائم السماح بمهارات الوكيل](/ar/tools/skills#agent-allowlists).

يمكن لـ Gateway استضافة **وكيل واحد** (افتراضيا) أو **عدة وكلاء** جنبا إلى جنب.

<Note>
**ملاحظة مساحة العمل:** مساحة عمل كل وكيل هي **cwd الافتراضي**، وليست عزلا صارما. تُحل المسارات النسبية داخل مساحة العمل، لكن المسارات المطلقة يمكن أن تصل إلى مواقع أخرى على المضيف ما لم يكن العزل مفعلا. راجع [العزل](/ar/gateway/sandboxing).
</Note>

## المسارات (خريطة سريعة)

- الإعداد: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة: `~/.openclaw` (أو `OPENCLAW_STATE_DIR`)
- مساحة العمل: `~/.openclaw/workspace` (أو `~/.openclaw/workspace-<agentId>`)
- دليل الوكيل: `~/.openclaw/agents/<agentId>/agent` (أو `agents.list[].agentDir`)
- الجلسات: `~/.openclaw/agents/<agentId>/sessions`

### وضع الوكيل الواحد (افتراضي)

إذا لم تفعل شيئا، يشغّل OpenClaw وكيلا واحدا:

- تكون قيمة `agentId` الافتراضية هي **`main`**.
- تُفهرس الجلسات بصيغة `agent:main:<mainKey>`.
- تكون مساحة العمل الافتراضية `~/.openclaw/workspace` (أو `~/.openclaw/workspace-<profile>` عند ضبط `OPENCLAW_PROFILE`).
- تكون الحالة الافتراضية `~/.openclaw/agents/main/agent`.

## مساعد الوكلاء

استخدم معالج الوكلاء لإضافة وكيل معزول جديد:

```bash
openclaw agents add work
```

ثم أضف `bindings` (أو دع المعالج يفعل ذلك) لتوجيه الرسائل الواردة.

تحقق باستخدام:

```bash
openclaw agents list --bindings
```

## بدء سريع

<Steps>
  <Step title="إنشاء مساحة عمل كل وكيل">
    استخدم المعالج أو أنشئ مساحات العمل يدويا:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    يحصل كل وكيل على مساحة عمل خاصة به تتضمن `SOUL.md` و`AGENTS.md` و`USER.md` اختياريا، إضافة إلى `agentDir` مخصص ومخزن جلسات ضمن `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="إنشاء حسابات القنوات">
    أنشئ حسابا واحدا لكل وكيل على قنواتك المفضلة:

    - Discord: روبوت واحد لكل وكيل، فعّل Message Content Intent، وانسخ كل رمز.
    - Telegram: روبوت واحد لكل وكيل عبر BotFather، وانسخ كل رمز.
    - WhatsApp: اربط كل رقم هاتف لكل حساب.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    راجع أدلة القنوات: [Discord](/ar/channels/discord)، [Telegram](/ar/channels/telegram)، [WhatsApp](/ar/channels/whatsapp).

  </Step>
  <Step title="إضافة الوكلاء والحسابات والارتباطات">
    أضف الوكلاء ضمن `agents.list`، وحسابات القنوات ضمن `channels.<channel>.accounts`، واربطها باستخدام `bindings` (الأمثلة أدناه).
  </Step>
  <Step title="إعادة التشغيل والتحقق">
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
- **شخصيات مختلفة** (ملفات مساحة عمل لكل وكيل مثل `AGENTS.md` و`SOUL.md`).
- **مصادقة + جلسات منفصلة** (لا تداخل إلا إذا فُعّل صراحة).

يتيح ذلك لـ **عدة أشخاص** مشاركة خادم Gateway واحد مع إبقاء "عقول" الذكاء الاصطناعي وبياناتهم معزولة.

## بحث ذاكرة QMD عبر الوكلاء

إذا كان على وكيل البحث في نصوص جلسات QMD لوكيل آخر، فأضف مجموعات إضافية ضمن `agents.list[].memorySearch.qmd.extraCollections`. استخدم `agents.defaults.memorySearch.qmd.extraCollections` فقط عندما يجب أن يرث كل وكيل مجموعات النصوص المشتركة نفسها.

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

يمكن مشاركة مسار المجموعة الإضافية عبر الوكلاء، لكن اسم المجموعة يبقى صريحا عندما يكون المسار خارج مساحة عمل الوكيل. تبقى المسارات داخل مساحة العمل محددة النطاق للوكيل بحيث يحتفظ كل وكيل بمجموعة بحث النصوص الخاصة به.

## رقم WhatsApp واحد، عدة أشخاص (تقسيم الرسائل المباشرة)

يمكنك توجيه **رسائل WhatsApp المباشرة المختلفة** إلى وكلاء مختلفين مع البقاء على **حساب WhatsApp واحد**. طابق حسب مرسل E.164 (مثل `+15551234567`) باستخدام `peer.kind: "direct"`. لا تزال الردود تأتي من رقم WhatsApp نفسه (لا توجد هوية مرسل لكل وكيل).

<Note>
تنهار المحادثات المباشرة إلى **مفتاح الجلسة الرئيسي** للوكيل، لذا يتطلب العزل الحقيقي **وكيلا واحدا لكل شخص**.
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

- التحكم في وصول الرسائل المباشرة **عام لكل حساب WhatsApp** (الاقتران/قائمة السماح)، وليس لكل وكيل.
- للمجموعات المشتركة، اربط المجموعة بوكيل واحد أو استخدم [مجموعات البث](/ar/channels/broadcast-groups).

## قواعد التوجيه (كيف تختار الرسائل وكيلا)

الارتباطات **حتمية** و**الأكثر تحديدا يفوز**:

<Steps>
  <Step title="تطابق peer">
    معرّف رسالة مباشرة/مجموعة/قناة مطابق تماما.
  </Step>
  <Step title="تطابق parentPeer">
    وراثة السلسلة.
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
  <Step title="تطابق accountId لقناة">
    مسار احتياطي لكل حساب.
  </Step>
  <Step title="تطابق على مستوى القناة">
    `accountId: "*"`.
  </Step>
  <Step title="الوكيل الافتراضي">
    الرجوع إلى `agents.list[].default`، وإلا أول إدخال في القائمة، والافتراضي: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="كسر التعادل ودلالات AND">
    - إذا طابقت عدة ارتباطات في المستوى نفسه، يفوز الأول حسب ترتيب الإعداد.
    - إذا عيّن ارتباط عدة حقول مطابقة (مثلا `peer` + `guildId`)، فكل الحقول المحددة مطلوبة (دلالات `AND`).

  </Accordion>
  <Accordion title="تفاصيل نطاق الحساب">
    - الارتباط الذي يحذف `accountId` يطابق الحساب الافتراضي فقط. ولا يطابق كل الحسابات.
    - استخدم `accountId: "*"` لمسار احتياطي على مستوى القناة عبر كل الحسابات.
    - استخدم `accountId: "<name>"` لمطابقة حساب واحد.
    - إذا أضفت لاحقا الارتباط نفسه للوكيل نفسه مع معرّف حساب صريح، يرقّي OpenClaw الارتباط الحالي الخاص بالقناة فقط إلى ارتباط محدد النطاق بالحساب بدلا من تكراره.

  </Accordion>
</AccordionGroup>

## عدة حسابات / أرقام هواتف

تستخدم القنوات التي تدعم **عدة حسابات** (مثل WhatsApp) `accountId` لتحديد كل تسجيل دخول. يمكن توجيه كل `accountId` إلى وكيل مختلف، وبذلك يمكن لخادم واحد استضافة عدة أرقام هواتف دون خلط الجلسات.

إذا أردت حسابا افتراضيا على مستوى القناة عندما يُحذف `accountId`، فاضبط `channels.<channel>.defaultAccount` (اختياري). عند عدم ضبطه، يرجع OpenClaw إلى `default` إذا كان موجودا، وإلا إلى أول معرّف حساب مضبوط (مرتبا).

تشمل القنوات الشائعة التي تدعم هذا النمط:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `zalo`, `zalouser`, `nostr`, `feishu`

## المفاهيم

- `agentId`: "عقل" واحد (مساحة عمل، ومصادقة لكل وكيل، ومخزن جلسات لكل وكيل).
- `accountId`: مثيل حساب قناة واحد (مثل حساب WhatsApp `"personal"` مقابل `"biz"`).
- `binding`: يوجّه الرسائل الواردة إلى `agentId` عبر `(channel, accountId, peer)` ومعرّفات guild/team اختياريا.
- تنهار المحادثات المباشرة إلى `agent:<agentId>:<mainKey>` ("الرئيسية" لكل وكيل؛ `session.mainKey`).

## أمثلة المنصات

<AccordionGroup>
  <Accordion title="روبوتات Discord لكل وكيل">
    يرتبط كل حساب روبوت Discord بـ `accountId` فريد. اربط كل حساب بوكيل وأبق قوائم السماح لكل روبوت.

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

    - ادعُ كل روبوت إلى خادم Discord وفعّل Message Content Intent.
    - تعيش الرموز في `channels.discord.accounts.<id>.token` (يمكن للحساب الافتراضي استخدام `DISCORD_BOT_TOKEN`).

  </Accordion>
  <Accordion title="روبوتات Telegram لكل وكيل">
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

    - أنشئ روبوتًا واحدًا لكل وكيل باستخدام BotFather وانسخ كل رمز.
    - تعيش الرموز في `channels.telegram.accounts.<id>.botToken` (يمكن للحساب الافتراضي استخدام `TELEGRAM_BOT_TOKEN`).
    - عند وجود روبوتات متعددة في مجموعة Telegram نفسها، ادعُ كل روبوت واذكر الروبوت الذي يجب أن يجيب.
    - عطّل Privacy Mode في BotFather لكل روبوت مجموعة، ثم أعد إضافة الروبوت حتى يطبق Telegram الإعداد.
    - اسمح بالمجموعات باستخدام `channels.telegram.groups`، أو استخدم `groupPolicy: "open"` فقط لنشرات المجموعات الموثوقة.
    - ضع معرّفات المستخدمين المرسلين في `groupAllowFrom`. تنتمي معرّفات المجموعات والمجموعات الفائقة إلى `channels.telegram.groups`، وليس `groupAllowFrom`.
    - اربط باستخدام `accountId` حتى يوجّه كل روبوت إلى وكيله الخاص.

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
  <Tab title="WhatsApp اليومي + العمل العميق على Telegram">
    اقسم حسب القناة: وجّه WhatsApp إلى وكيل يومي سريع وTelegram إلى وكيل Opus.

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
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
        { agentId: "opus", match: { channel: "telegram", accountId: "*" } },
      ],
    }
    ```

    ملاحظات:

    - تستخدم هذه الأمثلة `accountId: "*"` حتى تستمر الارتباطات في العمل إذا أضفت حسابات لاحقًا.
    - لتوجيه رسالة مباشرة واحدة أو مجموعة واحدة إلى Opus مع إبقاء الباقي على الدردشة، أضف ارتباط `match.peer` لذلك النظير؛ تطابقات النظراء تفوز دائمًا على القواعد على مستوى القناة.

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
          match: { channel: "whatsapp", accountId: "*", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
      ],
    }
    ```

    تفوز ارتباطات النظراء دائمًا، لذا أبقِها فوق القاعدة على مستوى القناة.

  </Tab>
  <Tab title="وكيل عائلة مرتبط بمجموعة WhatsApp">
    اربط وكيل عائلة مخصصًا بمجموعة WhatsApp واحدة، مع بوابة عبر الذكر وسياسة أدوات أشد:

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

    - قوائم السماح/المنع للأدوات هي **أدوات**، وليست Skills. إذا احتاجت Skill إلى تشغيل ملف ثنائي، فتأكد من السماح بـ `exec` ووجود الملف الثنائي في الصندوق المعزول.
    - لبوابة أشد، اضبط `agents.list[].groupChat.mentionPatterns` وأبقِ قوائم السماح للمجموعات مفعلة للقناة.

  </Tab>
</Tabs>

## إعداد الصندوق المعزول والأدوات لكل وكيل

يمكن أن يكون لكل وكيل صندوقه المعزول وقيود أدواته الخاصة:

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
يقع `setupCommand` تحت `sandbox.docker` ويعمل مرة واحدة عند إنشاء الحاوية. يتم تجاهل تجاوزات `sandbox.docker.*` لكل وكيل عندما يكون النطاق المحسوم هو `"shared"`.
</Note>

**الفوائد:**

- **عزل الأمان**: قيّد الأدوات للوكلاء غير الموثوقين.
- **التحكم بالموارد**: اعزل وكلاء محددين مع إبقاء الآخرين على المضيف.
- **سياسات مرنة**: أذونات مختلفة لكل وكيل.

<Note>
`tools.elevated` **عام** ويستند إلى المرسل؛ ولا يمكن إعداده لكل وكيل. إذا كنت تحتاج إلى حدود لكل وكيل، فاستخدم `agents.list[].tools` لمنع `exec`. لاستهداف المجموعات، استخدم `agents.list[].groupChat.mentionPatterns` حتى ترتبط إشارات @mentions بوضوح بالوكيل المقصود.
</Note>

راجع [صندوق وأدوات الوكلاء المتعددين المعزولة](/ar/tools/multi-agent-sandbox-tools) للحصول على أمثلة مفصلة.

## ذات صلة

- [وكلاء ACP](/ar/tools/acp-agents) — تشغيل أحزمة ترميز خارجية
- [توجيه القنوات](/ar/channels/channel-routing) — كيف يتم توجيه الرسائل إلى الوكلاء
- [الحضور](/ar/concepts/presence) — حضور الوكيل وتوافره
- [الجلسة](/ar/concepts/session) — عزل الجلسات وتوجيهها
- [الوكلاء الفرعيون](/ar/tools/subagents) — تشغيل مهام وكلاء في الخلفية
