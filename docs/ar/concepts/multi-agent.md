---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'التوجيه متعدد الوكلاء: وكلاء معزولون، وحسابات القنوات، وbindings'
title: التوجيه متعدد الوكلاء
x-i18n:
    generated_at: "2026-04-26T11:27:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 845149ac1076d4746cc5038bd4444c2fc6117710f724b8cabdc31dc9ef6abbe8
    source_path: concepts/multi-agent.md
    workflow: 15
---

شغّل عدة وكلاء **معزولين** — لكل واحد منهم مساحة عمل خاصة به، ودليل حالة (`agentDir`) خاص به، وسجل جلسات مستقل — بالإضافة إلى عدة حسابات قنوات (مثل حسابَي WhatsApp) داخل Gateway واحد قيد التشغيل. تُوجَّه الرسائل الواردة إلى الوكيل الصحيح من خلال bindings.

الـ **agent** هنا هو النطاق الكامل لكل شخصية: ملفات مساحة العمل، وملفات تعريف المصادقة، وسجل النماذج، ومخزن الجلسات. و`agentDir` هو دليل الحالة على القرص الذي يحتفظ بهذا الإعداد الخاص بكل وكيل في `~/.openclaw/agents/<agentId>/`. أما **binding** فهو يربط حساب قناة (مثل مساحة عمل Slack أو رقم WhatsApp) بأحد هؤلاء الوكلاء.

## ما المقصود بـ "وكيل واحد"؟

الـ **agent** هو عقل محدد النطاق بالكامل وله ما يلي بشكل مستقل:

- **مساحة العمل** (الملفات، وAGENTS.md/SOUL.md/USER.md، والملاحظات المحلية، وقواعد الشخصية).
- **دليل الحالة** (`agentDir`) لملفات تعريف المصادقة، وسجل النماذج، والإعدادات الخاصة بكل وكيل.
- **مخزن الجلسات** (سجل الدردشة + حالة التوجيه) ضمن `~/.openclaw/agents/<agentId>/sessions`.

ملفات تعريف المصادقة تكون **لكل وكيل**. يقرأ كل وكيل من ملفه الخاص:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
يظل `sessions_history` هنا أيضًا هو المسار الأكثر أمانًا للاستدعاء عبر الجلسات: فهو يعيد عرضًا محدودًا ومنقحًا، وليس تفريغًا خامًا للسجل. يزيل استدعاء المساعد وسوم التفكير، وهياكل `<relevant-memories>`، وحمولات XML النصية العادية الخاصة باستدعاءات الأدوات (بما في ذلك `<tool_call>...</tool_call>` و`<function_call>...</function_call>` و`<tool_calls>...</tool_calls>` و`<function_calls>...</function_calls>` وكتل استدعاء الأدوات المقتطعة)، وهياكل استدعاء الأدوات المخفّضة، ورموز تحكم النموذج المتسربة بنمط ASCII/العرض الكامل، وXML المشوّه الخاص باستدعاء أدوات MiniMax قبل التنقيح/الاقتطاع.
</Note>

<Warning>
لا تتم مشاركة بيانات اعتماد الوكيل الرئيسي **تلقائيًا**. لا تعِد استخدام `agentDir` بين الوكلاء مطلقًا (لأنه يسبب تصادمات في المصادقة/الجلسات). وإذا أردت مشاركة بيانات الاعتماد، فانسخ `auth-profiles.json` إلى `agentDir` الخاص بالوكيل الآخر.
</Warning>

يتم تحميل Skills من مساحة عمل كل وكيل بالإضافة إلى الجذور المشتركة مثل `~/.openclaw/skills`، ثم تُرشَّح بواسطة allowlist الفعّال للـ Skills الخاص بالوكيل عند تكوينه. استخدم `agents.defaults.skills` كخط أساس مشترك، و`agents.list[].skills` كبديل لكل وكيل. راجع [Skills: per-agent vs shared](/ar/tools/skills#per-agent-vs-shared-skills) و[Skills: agent skill allowlists](/ar/tools/skills#agent-skill-allowlists).

يمكن لـ Gateway استضافة **وكيل واحد** (افتراضيًا) أو **عدة وكلاء** جنبًا إلى جنب.

<Note>
**ملاحظة مساحة العمل:** مساحة عمل كل وكيل هي **cwd الافتراضي**، وليست sandbox صارمة. تُحل المسارات النسبية داخل مساحة العمل، لكن يمكن للمسارات المطلقة الوصول إلى مواقع أخرى على المضيف ما لم يكن sandboxing مفعّلًا. راجع [Sandboxing](/ar/gateway/sandboxing).
</Note>

## المسارات (خريطة سريعة)

- الإعدادات: `~/.openclaw/openclaw.json` (أو `OPENCLAW_CONFIG_PATH`)
- دليل الحالة: `~/.openclaw` (أو `OPENCLAW_STATE_DIR`)
- مساحة العمل: `~/.openclaw/workspace` (أو `~/.openclaw/workspace-<agentId>`)
- Agent dir: `~/.openclaw/agents/<agentId>/agent` (أو `agents.list[].agentDir`)
- الجلسات: `~/.openclaw/agents/<agentId>/sessions`

### وضع الوكيل الواحد (الافتراضي)

إذا لم تفعل شيئًا، فسيشغّل OpenClaw وكيلًا واحدًا:

- تكون القيمة الافتراضية لـ `agentId` هي **`main`**.
- تُفهرس الجلسات على شكل `agent:main:<mainKey>`.
- تكون مساحة العمل افتراضيًا `~/.openclaw/workspace` (أو `~/.openclaw/workspace-<profile>` عند ضبط `OPENCLAW_PROFILE`).
- تكون الحالة افتراضيًا `~/.openclaw/agents/main/agent`.

## مساعد الوكلاء

استخدم معالج الوكلاء لإضافة وكيل جديد معزول:

```bash
openclaw agents add work
```

ثم أضف `bindings` (أو دع المعالج يقوم بذلك) لتوجيه الرسائل الواردة.

تحقّق باستخدام:

```bash
openclaw agents list --bindings
```

## بدء سريع

<Steps>
  <Step title="أنشئ مساحة عمل لكل وكيل">
    استخدم المعالج أو أنشئ مساحات العمل يدويًا:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    يحصل كل وكيل على مساحة عمل خاصة به تتضمن `SOUL.md` و`AGENTS.md` و`USER.md` اختياريًا، بالإضافة إلى `agentDir` مخصص ومخزن جلسات ضمن `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="أنشئ حسابات القنوات">
    أنشئ حسابًا واحدًا لكل وكيل على القنوات المفضلة لديك:

    - Discord: bot واحد لكل وكيل، فعّل Message Content Intent، وانسخ كل token.
    - Telegram: bot واحد لكل وكيل عبر BotFather، وانسخ كل token.
    - WhatsApp: اربط كل رقم هاتف لكل حساب.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    راجع أدلة القنوات: [Discord](/ar/channels/discord)، [Telegram](/ar/channels/telegram)، [WhatsApp](/ar/channels/whatsapp).

  </Step>
  <Step title="أضف الوكلاء والحسابات وbindings">
    أضف الوكلاء ضمن `agents.list`، وحسابات القنوات ضمن `channels.<channel>.accounts`، ثم اربطهم عبر `bindings` (انظر الأمثلة أدناه).
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

عند استخدام **عدة وكلاء**، يصبح كل `agentId` **شخصية معزولة بالكامل**:

- **أرقام هواتف/حسابات مختلفة** (لكل قناة `accountId`).
- **شخصيات مختلفة** (من خلال ملفات مساحة العمل الخاصة بكل وكيل مثل `AGENTS.md` و`SOUL.md`).
- **مصادقة + جلسات منفصلة** (من دون تداخل إلا إذا تم تمكين ذلك صراحةً).

يسمح ذلك لـ **عدة أشخاص** بمشاركة خادم Gateway واحد مع إبقاء "عقول" الذكاء الاصطناعي وبياناتهم معزولة.

## بحث ذاكرة QMD عبر الوكلاء

إذا كان يجب على أحد الوكلاء البحث في نصوص جلسات QMD الخاصة بوكيل آخر، فأضف مجموعات إضافية ضمن `agents.list[].memorySearch.qmd.extraCollections`. استخدم `agents.defaults.memorySearch.qmd.extraCollections` فقط عندما يجب أن يرث كل وكيل مجموعات النصوص المشتركة نفسها.

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

يمكن مشاركة مسار المجموعة الإضافية بين الوكلاء، لكن يظل اسم المجموعة صريحًا عندما يكون المسار خارج مساحة عمل الوكيل. وتبقى المسارات داخل مساحة العمل مرتبطة بالوكيل بحيث يحتفظ كل وكيل بمجموعة البحث في النصوص الخاصة به.

## رقم WhatsApp واحد، عدة أشخاص (تقسيم DM)

يمكنك توجيه **رسائل WhatsApp الخاصة DM المختلفة** إلى وكلاء مختلفين مع البقاء على **حساب WhatsApp واحد**. طابق على E.164 الخاص بالمرسل (مثل `+15551234567`) باستخدام `peer.kind: "direct"`. وتظل الردود تأتي من رقم WhatsApp نفسه (من دون هوية مرسل منفصلة لكل وكيل).

<Note>
تنهار الدردشات المباشرة إلى **مفتاح الجلسة الرئيسي** الخاص بالوكيل، لذا يتطلب العزل الحقيقي **وكيلًا واحدًا لكل شخص**.
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

- التحكم في وصول الرسائل الخاصة DM هو **عام على مستوى حساب WhatsApp** (إقران/allowlist)، وليس لكل وكيل.
- بالنسبة إلى المجموعات المشتركة، اربط المجموعة بوكيل واحد أو استخدم [Broadcast groups](/ar/channels/broadcast-groups).

## قواعد التوجيه (كيف تختار الرسائل وكيلًا)

تكون bindings **حتمية** و**الأكثر تحديدًا هو الذي يفوز**:

<Steps>
  <Step title="peer match">
    معرّف DM/group/channel مطابق تمامًا.
  </Step>
  <Step title="parentPeer match">
    وراثة الخيوط.
  </Step>
  <Step title="guildId + roles">
    توجيه الأدوار في Discord.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="accountId match for a channel">
    بديل احتياطي لكل حساب.
  </Step>
  <Step title="Channel-level match">
    `accountId: "*"`.
  </Step>
  <Step title="Default agent">
    بديل احتياطي إلى `agents.list[].default`، وإلا أول إدخال في القائمة، والافتراضي: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="فك التعادل ودلالات AND">
    - إذا طابقت عدة bindings في المستوى نفسه، فالأولى حسب ترتيب config هي التي تفوز.
    - إذا ضبط binding عدة حقول مطابقة (مثل `peer` + `guildId`)، فكل الحقول المحددة مطلوبة (دلالات `AND`).
  </Accordion>
  <Accordion title="تفاصيل نطاق الحساب">
    - يطابق binding الذي يحذف `accountId` الحساب الافتراضي فقط.
    - استخدم `accountId: "*"` كبديل احتياطي على مستوى القناة عبر جميع الحسابات.
    - إذا أضفت لاحقًا binding نفسها للوكيل نفسه مع معرّف حساب صريح، فسيقوم OpenClaw بترقية binding الحالية الخاصة بالقناة فقط إلى نطاق خاص بالحساب بدلًا من تكرارها.
  </Accordion>
</AccordionGroup>

## عدة حسابات / عدة أرقام هاتف

تستخدم القنوات التي تدعم **عدة حسابات** (مثل WhatsApp) القيمة `accountId` لتحديد كل تسجيل دخول. ويمكن توجيه كل `accountId` إلى وكيل مختلف، بحيث يمكن لخادم واحد استضافة عدة أرقام هواتف من دون خلط الجلسات.

إذا كنت تريد حسابًا افتراضيًا على مستوى القناة عندما يتم حذف `accountId`، فاضبط `channels.<channel>.defaultAccount` (اختياري). وعند عدم ضبطه، يعود OpenClaw إلى `default` إذا كانت موجودة، وإلا إلى أول معرّف حساب مُكوَّن (بعد الفرز).

تشمل القنوات الشائعة التي تدعم هذا النمط ما يلي:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## المفاهيم

- `agentId`: "عقل" واحد (مساحة عمل، ومصادقة لكل وكيل، ومخزن جلسات لكل وكيل).
- `accountId`: مثيل حساب قناة واحد (مثل حساب WhatsApp `"personal"` مقابل `"biz"`).
- `binding`: يوجّه الرسائل الواردة إلى `agentId` بواسطة `(channel, accountId, peer)` واختياريًا معرّفات guild/team.
- تنهار الدردشات المباشرة إلى `agent:<agentId>:<mainKey>` (الجلسة "الرئيسية" لكل وكيل؛ `session.mainKey`).

## أمثلة المنصات

<AccordionGroup>
  <Accordion title="Discord bots لكل وكيل">
    يُعيَّن كل حساب Discord bot إلى `accountId` فريد. اربط كل حساب بوكيل واحتفظ بـ allowlists لكل bot.

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

    - ادعُ كل bot إلى guild وفعّل Message Content Intent.
    - تعيش الـ tokens في `channels.discord.accounts.<id>.token` (ويمكن للحساب الافتراضي استخدام `DISCORD_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Telegram bots لكل وكيل">
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

    - أنشئ bot واحدًا لكل وكيل باستخدام BotFather وانسخ كل token.
    - توجد الـ tokens في `channels.telegram.accounts.<id>.botToken` (ويمكن للحساب الافتراضي استخدام `TELEGRAM_BOT_TOKEN`).

  </Accordion>
  <Accordion title="أرقام WhatsApp لكل وكيل">
    اربط كل حساب قبل بدء gateway:

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

      // توجيه حتمي: أول مطابقة تفوز (الأكثر تحديدًا أولًا).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // تجاوز اختياري لكل peer (مثال: أرسل مجموعة محددة إلى وكيل العمل).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // معطّل افتراضيًا: يجب تمكين المراسلة بين الوكلاء بشكل صريح + إدراجها في allowlist.
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

  </Accordion>
</AccordionGroup>

## الأنماط الشائعة

<Tabs>
  <Tab title="WhatsApp يومي + عمل عميق على Telegram">
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

    - إذا كانت لديك حسابات متعددة للقناة، فأضف `accountId` إلى binding (مثل `{ channel: "whatsapp", accountId: "personal" }`).
    - لتوجيه DM/group واحدة إلى Opus مع إبقاء الباقي على وكيل chat، أضف binding من نوع `match.peer` لذلك الـ peer؛ إذ تفوز مطابقة الـ peer دائمًا على القواعد العامة للقناة.

  </Tab>
  <Tab title="القناة نفسها، peer واحد إلى Opus">
    أبقِ WhatsApp على الوكيل السريع، لكن وجّه DM واحدة إلى Opus:

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

    تفوز bindings الخاصة بالـ peer دائمًا، لذا أبقها فوق القاعدة العامة للقناة.

  </Tab>
  <Tab title="وكيل عائلي مرتبط بمجموعة WhatsApp">
    اربط وكيلًا عائليًا مخصصًا بمجموعة WhatsApp واحدة، مع تقييد الإشارات وسياسة أدوات أكثر صرامة:

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

    - قوائم السماح/المنع للأدوات هي **أدوات** وليست Skills. إذا كانت Skill تحتاج إلى تشغيل binary، فتأكد من أن `exec` مسموح وأن الـ binary موجود داخل sandbox.
    - لتقييد أكثر صرامة، اضبط `agents.list[].groupChat.mentionPatterns` وأبقِ allowlists الخاصة بالمجموعات مفعّلة للقناة.

  </Tab>
</Tabs>

## إعداد sandbox والأدوات لكل وكيل

يمكن لكل وكيل أن يملك sandbox وقيود أدوات خاصة به:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // بدون sandbox للوكيل الشخصي
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

<Note>
يوجد `setupCommand` ضمن `sandbox.docker` ويعمل مرة واحدة عند إنشاء الحاوية. يتم تجاهل تجاوزات `sandbox.docker.*` لكل وكيل عندما يكون `scope` المحلول هو `"shared"`.
</Note>

**الفوائد:**

- **عزل أمني**: تقييد الأدوات للوكلاء غير الموثوقين.
- **التحكم في الموارد**: وضع وكلاء محددين داخل sandbox مع إبقاء الآخرين على المضيف.
- **سياسات مرنة**: أذونات مختلفة لكل وكيل.

<Note>
إن `tools.elevated` **عام** ويعتمد على المرسل؛ ولا يمكن ضبطه لكل وكيل. إذا كنت تحتاج إلى حدود لكل وكيل، فاستخدم `agents.list[].tools` لمنع `exec`. ولاستهداف المجموعات، استخدم `agents.list[].groupChat.mentionPatterns` حتى تُطابق @mentions الوكيل المقصود بشكل نظيف.
</Note>

راجع [Multi-agent sandbox and tools](/ar/tools/multi-agent-sandbox-tools) للاطلاع على أمثلة مفصلة.

## ذو صلة

- [ACP agents](/ar/tools/acp-agents) — تشغيل harnesses ترميز خارجية
- [Channel routing](/ar/channels/channel-routing) — كيفية توجيه الرسائل إلى الوكلاء
- [Presence](/ar/concepts/presence) — حضور الوكيل وتوفّره
- [Session](/ar/concepts/session) — عزل الجلسات والتوجيه
- [Sub-agents](/ar/tools/subagents) — إنشاء عمليات وكلاء خلفية
