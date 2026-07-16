---
read_when: You want multiple agents with separate workspaces, auth, and sessions in one Gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'توجيه الوكلاء المتعددين: حدود الوكلاء وحسابات القنوات والارتباطات'
title: توجيه متعدد الوكلاء
x-i18n:
    generated_at: "2026-07-16T13:58:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 265a1f3d9d9b4957c99c71f391ce4f5abba6b70561570f8bbe8cb9964ece1cfc
    source_path: concepts/multi-agent.md
    workflow: 16
---

شغّل عدة وكلاء _معزولين_ في عملية Gateway واحدة، لكل منهم مساحة عمل خاصة به، ودليل حالة (`agentDir`)، وسجل جلسات مدعوم بـ SQLite، بالإضافة إلى عدة حسابات قنوات (مثل رقمي WhatsApp). تُوجَّه الرسائل الواردة إلى الوكيل الصحيح عبر **الارتباطات**.

**الوكيل** هو النطاق الكامل لكل شخصية: ملفات مساحة العمل، وملفات تعريف المصادقة، وسجل النماذج، ومخزن الجلسات. يربط **الارتباط** حساب قناة (مساحة عمل Slack أو رقم WhatsApp، وما إلى ذلك) بأحد هؤلاء الوكلاء.

## ما الوكيل الواحد

لكل وكيل ما يلي:

- **مساحة العمل**: الملفات، و`AGENTS.md`/`SOUL.md`/`USER.md`، والملاحظات المحلية، وقواعد الشخصية.
- **دليل الحالة** (`agentDir`): ملفات تعريف المصادقة، وسجل النماذج، وإعدادات كل وكيل.
- **مخزن الجلسات**: سجل المحادثات وحالة التوجيه في `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.

تكون ملفات تعريف المصادقة خاصة بكل وكيل، وتُقرأ من:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
يُعد `sessions_history` المسار الأكثر أمانًا للاسترجاع عبر الجلسات: فهو يعيد عرضًا محدودًا ومنقحًا، لا تفريغًا خامًا للنص المنسوخ. ويزيل تواقيع كتل التفكير، وتفاصيل حمولات نتائج الأدوات، وبنية `<relevant-memories>`، ووسوم XML لاستدعاءات الأدوات (`<tool_call>` و`<function_call>` وصيغهما الجمعية/المخفّضة)، وXML لاستدعاءات أدوات MiniMax، ثم يقتطع المخرجات ويحدّها حسب حجم البايتات.
</Note>

<Warning>
لا تُعِد استخدام `agentDir` مطلقًا عبر الوكلاء — إذ يسبب ذلك تعارضات في حالة المصادقة/الجلسات. عندما تنتهي صلاحية بيانات اعتماد OAuth المحلية لوكيل ثانوي أو يفشل تحديثها، يقرأ OpenClaw بيانات اعتماد الوكيل الافتراضي/الرئيسي لمعرّف ملف التعريف نفسه ويعتمد الرمز الأحدث، من دون نسخ رمز التحديث إلى مخزن الوكيل الثانوي. إذا أردت حساب OAuth مستقلاً بالكامل، فسجّل الدخول من ذلك الوكيل. وإذا نسخت بيانات الاعتماد يدويًا، فلا تنسخ إلا ملفات تعريف `api_key` أو `token` الثابتة والقابلة للنقل — فبيانات تحديث OAuth غير قابلة للنقل افتراضيًا (يمكن لـ `copyToAgents` تمكين ذلك صراحةً لملف تعريف).
</Warning>

تُحمَّل Skills من مساحة عمل كل وكيل بالإضافة إلى الجذور المشتركة مثل `~/.openclaw/skills`، ثم تُرشَّح وفق قائمة Skills المسموح بها فعليًا للوكيل. استخدم `agents.defaults.skills` لخط أساس مشترك و`agents.list[].skills` لاستبدال خاص بكل وكيل (تحل الإدخالات الصريحة محل الإعداد الافتراضي ولا تُدمج معه). راجع [Skills: الخاصة بكل وكيل مقابل المشتركة](/ar/tools/skills#per-agent-vs-shared-skills) و[Skills: قوائم السماح للوكلاء](/ar/tools/skills#agent-allowlists).

يتبع التخزين المملوك لـ Plugin إعدادات ذلك الـ Plugin؛ وإضافة وكيل ثانٍ
لا تقسّم تلقائيًا كل مخزن عام للـ Plugin. على سبيل المثال، اضبط
[خزائن Memory Wiki الخاصة بكل وكيل](/ar/concepts/multi-agent#per-agent-memory-wiki-vaults)
عندما يجب ألا تشارك الشخصيات معرفة الويكي المجمّعة.

<Note>
**ملاحظة حول مساحة العمل:** مساحة عمل كل وكيل هي **دليل العمل الحالي الافتراضي**، وليست بيئة معزولة صارمة. تُحل المسارات النسبية داخل مساحة العمل، لكن يمكن للمسارات المطلقة الوصول إلى مواقع أخرى على المضيف ما لم يكن العزل مفعّلًا. راجع [العزل](/ar/gateway/sandboxing).
</Note>

## المسارات

| العنصر                           | الافتراضي                                                                              | التجاوز                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| الإعدادات                        | `~/.openclaw/openclaw.json`                                                            | `OPENCLAW_CONFIG_PATH`                                                                   |
| دليل الحالة                     | `~/.openclaw`                                                                          | `OPENCLAW_STATE_DIR`                                                                     |
| مساحة عمل الوكيل الافتراضي      | `~/.openclaw/workspace` (أو `workspace-<profile>` عند ضبط `OPENCLAW_PROFILE`)      | `agents.list[].workspace`، ثم `agents.defaults.workspace`، أو `OPENCLAW_WORKSPACE_DIR` |
| مساحة عمل الوكلاء الآخرين       | `<stateDir>/workspace-<agentId>` (أو `<agents.defaults.workspace>/<agentId>` عند ضبطه) | `agents.list[].workspace`                                                                |
| دليل الوكيل                     | `~/.openclaw/agents/<agentId>/agent`                                                   | `agents.list[].agentDir`                                                                 |
| الجلسات والنصوص المنسوخة         | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`                             | —                                                                                        |
| عناصر الجلسات القديمة/المؤرشفة  | `~/.openclaw/agents/<agentId>/sessions`                                                | —                                                                                        |

### وضع الوكيل الواحد (الافتراضي)

إذا لم تضبط شيئًا، يشغّل OpenClaw وكيلاً واحدًا:

- تكون القيمة الافتراضية لـ `agentId` هي `main`.
- تستخدم الجلسات المفتاح `agent:main:<mainKey>` (القيمة الافتراضية لـ `mainKey` هي `main`).
- تكون مساحة العمل افتراضيًا `~/.openclaw/workspace` (أو `workspace-<profile>` عندما تُضبط `OPENCLAW_PROFILE` على قيمة غير `default`).
- تكون الحالة افتراضيًا `~/.openclaw/agents/main/agent`.

## أداة الوكيل المساعدة

أضف وكيلاً معزولاً جديدًا:

```bash
openclaw agents add work
```

العلامات: `--workspace <dir>`، و`--model <id>`، و`--agent-dir <dir>`، و`--bind <channel[:accountId]>` (قابلة للتكرار)، و`--non-interactive` (تتطلب `--workspace`).

أضف `bindings` لتوجيه الرسائل الواردة (يعرض المعالج تنفيذ ذلك نيابةً عنك)، ثم تحقّق:

```bash
openclaw agents list --bindings
```

## بدء سريع

<Steps>
  <Step title="إنشاء مساحة عمل لكل وكيل">
    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    يحصل كل وكيل على مساحة عمل خاصة به تحتوي على `SOUL.md` و`AGENTS.md` و`USER.md` اختياري، بالإضافة إلى `agentDir` مخصص ومخزن جلسات ضمن `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="إنشاء حسابات القنوات">
    أنشئ حسابًا واحدًا لكل وكيل على القنوات التي تفضّلها:

    - Discord: روبوت واحد لكل وكيل، فعّل Message Content Intent، وانسخ كل رمز.
    - Telegram: روبوت واحد لكل وكيل عبر BotFather، وانسخ كل رمز.
    - WhatsApp: اربط كل رقم هاتف بحساب.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    راجع أدلة القنوات: [Discord](/ar/channels/discord)، و[Telegram](/ar/channels/telegram)، و[WhatsApp](/ar/channels/whatsapp).

  </Step>
  <Step title="إضافة الوكلاء والحسابات والارتباطات">
    أضف الوكلاء ضمن `agents.list`، وحسابات القنوات ضمن `channels.<channel>.accounts`، واربط بينها باستخدام `bindings` (الأمثلة أدناه).
  </Step>
  <Step title="إعادة التشغيل والتحقق">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## عدة وكلاء، وعدة شخصيات

يمثل كل `agentId` مضبوط حدًا مستقلاً للشخصية بالنسبة إلى حالة الوكيل الأساسية:

- حسابات مختلفة لكل قناة (لكل `accountId`).
- شخصيات مختلفة (`AGENTS.md`/`SOUL.md` لكل وكيل).
- مصادقة وجلسات منفصلة، مع تمكين الوصول عبر الوكلاء فقط من خلال ميزات صريحة أو إعدادات Plugin.

يتيح ذلك لعدة أشخاص مشاركة Gateway واحد مع إبقاء حالة كل وكيل الأساسية منفصلة.

## خزائن Memory Wiki الخاصة بكل وكيل

يستخدم Memory Wiki خزينة عامة واحدة افتراضيًا. لإبقاء
المعرفة المجمّعة لوكيل الدعم منفصلة عن معرفة وكيل التسويق، اضبط
`plugins.entries.memory-wiki.config.vault.scope` على `agent`:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
        },
      },
    },
  },
}
```

المسار المضبوط هو الدليل الأب. يضيف OpenClaw معرّف
الوكيل بعد تطبيعه، منتجًا مسارات مثل `~/.openclaw/wiki/support` و
`~/.openclaw/wiki/marketing`. تتطلب عمليات CLI وGateway ضمن نطاق الوكيل
تحديد وكيل صراحةً عند ضبط عدة وكلاء. راجع
[خزائن Memory Wiki الخاصة بكل وكيل](/ar/plugins/memory-wiki#per-agent-vaults) للحصول على تفاصيل
تصفية الجسر والترحيل وحدود الثقة.

## البحث في ذاكرة QMD عبر الوكلاء

للسماح لوكيل بالبحث في نصوص جلسات QMD الخاصة بوكيل آخر، أضف مجموعات إضافية ضمن `agents.list[].memorySearch.qmd.extraCollections`. استخدم `agents.defaults.memorySearch.qmd.extraCollections` عندما ينبغي لجميع الوكلاء مشاركة المجموعات نفسها.

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
            extraCollections: [{ path: "notes" }], // يُحل داخل مساحة العمل -> مجموعة باسم "notes-main"
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

يمكن مشاركة مسار مجموعة إضافية بين الوكلاء، لكن تبقى قيمة `name` الخاصة به صريحة عندما يكون المسار خارج مساحة عمل الوكيل. وتبقى المسارات داخل مساحة العمل ضمن نطاق الوكيل، بحيث يحتفظ كل وكيل بمجموعة البحث الخاصة به في النصوص المنسوخة.

## رقم WhatsApp واحد، وعدة أشخاص (تقسيم الرسائل المباشرة)

وجّه رسائل WhatsApp المباشرة المختلفة إلى وكلاء مختلفين على حساب WhatsApp **واحد** عبر مطابقة المُرسِل بصيغة E.164 (`+15551234567`) باستخدام `peer.kind: "direct"`. تظل الردود صادرة من رقم WhatsApp نفسه — فلا توجد هوية مُرسِل خاصة بكل وكيل.

<Note>
تُدمج المحادثات المباشرة افتراضيًا في مفتاح الجلسة الرئيسية للوكيل، لذا يتطلب العزل الحقيقي وكيلاً واحدًا لكل شخص.
</Note>

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

يكون التحكم في الوصول إلى الرسائل المباشرة (الاقتران/قائمة السماح) عامًا لكل حساب WhatsApp، وليس لكل وكيل. بالنسبة إلى المجموعات المشتركة، اربط المجموعة بوكيل واحد أو استخدم [مجموعات البث](/ar/channels/broadcast-groups).

## قواعد التوجيه

الارتباطات حتمية، وتفوز المطابقة الأكثر تحديدًا. راجع [توجيه القنوات](/ar/channels/channel-routing#routing-rules-how-an-agent-is-chosen) لمعرفة ترتيب الطبقات الكامل (نظير مطابق تمامًا، ونظير أب، ونظير بدل، وخادم+أدوار، وخادم، وفريق، وحساب، وقناة، ووكيل افتراضي). وفيما يلي بعض القواعد الجديرة بالتنبيه:

- إذا طابقت عدة ارتباطات ضمن الطبقة نفسها، يفوز أولها حسب ترتيب الإعدادات.
- إذا حدّد ارتباط عدة حقول مطابقة (مثل `peer` + `guildId`)، فيجب أن تتطابق جميع الحقول المحددة (دلالات `AND`).
- الارتباط الذي يحذف `accountId` يطابق الحساب الافتراضي فقط، وليس كل الحسابات. استخدم `accountId: "*"` كخيار احتياطي على مستوى القناة، أو `accountId: "<name>"` لحساب واحد. تؤدي إضافة الارتباط نفسه مرة أخرى مع معرّف حساب صريح إلى ترقية الارتباط الحالي الخاص بالقناة فقط بدلاً من تكراره.

## حسابات / أرقام هواتف متعددة

تستخدم القنوات التي تدعم حسابات متعددة (مثل WhatsApp) `accountId` لتعريف كل تسجيل دخول. يوجّه كل `accountId` إلى وكيله الخاص، لذا يمكن لخادم واحد استضافة عدة أرقام هواتف من دون خلط الجلسات.

عيّن `channels.<channel>.defaultAccount` لاختيار الحساب المستخدم عند حذف `accountId`. عند عدم تعيينه، يعود OpenClaw إلى `default` إذا كان موجودًا، وإلا فيستخدم معرّف أول حساب مُعدّ (بعد الفرز).

القنوات التي تدعم حسابات متعددة: `discord`، `feishu`، `googlechat`، `imessage`، `irc`، `line`، `mattermost`، `matrix`، `nextcloud-talk`، `nostr`، `signal`، `slack`، `telegram`، `whatsapp`، `zalo`، `zalouser`.

## المفاهيم

- `agentId`: «عقل» واحد (مساحة عمل، ومصادقة لكل وكيل، ومخزن جلسات لكل وكيل).
- `accountId`: مثيل واحد لحساب قناة (مثل حساب WhatsApp ‏`personal` مقارنةً بـ `biz`).
- `binding`: يوجّه الرسائل الواردة إلى `agentId` حسب `(channel, accountId, peer)`، واختياريًا حسب معرّفات النقابة/الفريق.
- تُدمج المحادثات المباشرة في `agent:<agentId>:<mainKey>` (الحساب «الرئيسي» لكل وكيل؛ راجع `session.mainKey`).

## أمثلة المنصات

<AccordionGroup>
  <Accordion title="روبوتات Discord لكل وكيل">
    يُربط كل حساب روبوت Discord بقيمة `accountId` فريدة. اربط كل حساب بوكيل واحتفظ بقوائم السماح منفصلة لكل روبوت.

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

    - ادعُ كل روبوت إلى النقابة وفعّل Message Content Intent.
    - توجد الرموز المميزة في `channels.discord.accounts.<id>.token` (يمكن للحساب الافتراضي استخدام `DISCORD_BOT_TOKEN`).

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

    - أنشئ روبوتًا واحدًا لكل وكيل باستخدام BotFather وانسخ كل رمز مميز.
    - توجد الرموز المميزة في `channels.telegram.accounts.<id>.botToken` (يمكن للحساب الافتراضي استخدام `TELEGRAM_BOT_TOKEN`).
    - عند استخدام عدة روبوتات في مجموعة Telegram نفسها، ادعُ كل روبوت واذكر الروبوت الذي ينبغي أن يجيب.
    - عطّل BotFather Privacy Mode لكل روبوت مجموعة (`/setprivacy` -> Disable)، ثم أزل الروبوت وأعد إضافته لكي يطبّق Telegram الإعداد.
    - اسمح بالمجموعات باستخدام `channels.telegram.groups`، أو استخدم `groupPolicy: "open"` فقط لعمليات نشر المجموعات الموثوقة.
    - ضع معرّفات المستخدمين المرسلين في `groupAllowFrom`. تنتمي معرّفات المجموعات والمجموعات الفائقة إلى `channels.telegram.groups`، وليس إلى `groupAllowFrom`.
    - اربط حسب `accountId` لكي يوجّه كل روبوت الرسائل إلى وكيله الخاص.

  </Accordion>
  <Accordion title="أرقام WhatsApp لكل وكيل">
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
            name: "المنزل",
            workspace: "~/.openclaw/workspace-home",
            agentDir: "~/.openclaw/agents/home/agent",
          },
          {
            id: "work",
            name: "العمل",
            workspace: "~/.openclaw/workspace-work",
            agentDir: "~/.openclaw/agents/work/agent",
          },
        ],
      },

      // توجيه حتمي: يفوز أول تطابق (الأكثر تحديدًا أولًا).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // تجاوز اختياري لكل نظير (مثال: إرسال مجموعة محددة إلى وكيل العمل).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // معطّل افتراضيًا: يجب تمكين المراسلة بين الوكلاء صراحةً وإضافتها إلى قائمة السماح.
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
  <Tab title="WhatsApp للاستخدام اليومي وTelegram للعمل المتعمق">
    قسّم حسب القناة: وجّه WhatsApp إلى وكيل يومي سريع وTelegram إلى وكيل Opus.

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "يومي",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "عمل متعمق",
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

    تستخدم هذه الأمثلة `accountId: "*"` لكي تستمر الروابط في العمل إذا أضفت حسابات لاحقًا. لتوجيه محادثة مباشرة/مجموعة واحدة إلى Opus مع إبقاء البقية على وكيل المحادثة، أضف رابط `match.peer` لذلك النظير — تتغلب مطابقات النظير دائمًا على القواعد الشاملة للقناة.

  </Tab>
  <Tab title="القناة نفسها، ونظير واحد إلى Opus">
    أبقِ WhatsApp على الوكيل السريع، لكن وجّه محادثة مباشرة واحدة إلى Opus:

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "يومي",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "عمل متعمق",
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

    تفوز روابط النظير دائمًا، لذا أبقها فوق القاعدة الشاملة للقناة.

  </Tab>
  <Tab title="وكيل عائلي مرتبط بمجموعة WhatsApp">
    اربط وكيلًا عائليًا مخصصًا بمجموعة WhatsApp واحدة، مع اشتراط الإشارة وسياسة أدوات أكثر تقييدًا:

    ```json5
    {
      agents: {
        list: [
          {
            id: "family",
            name: "العائلة",
            workspace: "~/.openclaw/workspace-family",
            identity: { name: "روبوت العائلة" },
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

    قوائم السماح/الرفض الخاصة بالأدوات هي **أدوات** وليست Skills. إذا احتاجت إحدى Skills إلى تشغيل ملف ثنائي، فتأكد من السماح بـ `exec` ومن وجود الملف الثنائي في صندوق الحماية. لفرض قيود أشد، عيّن `agents.list[].groupChat.mentionPatterns` وأبقِ قوائم السماح للمجموعات مفعّلة للقناة.

  </Tab>
</Tabs>

## إعداد صندوق الحماية والأدوات لكل وكيل

يمكن أن يكون لكل وكيل قيود صندوق حماية وأدوات خاصة به:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // لا يوجد صندوق حماية للوكيل الشخصي
        },
        // لا توجد قيود على الأدوات - جميع الأدوات متاحة
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // يعمل دائمًا داخل صندوق حماية
          scope: "agent",  // حاوية واحدة لكل وكيل
          docker: {
            // إعداد اختياري لمرة واحدة بعد إنشاء الحاوية
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // أداة القراءة فقط
          deny: ["exec", "write", "edit", "apply_patch"],    // رفض الأدوات الأخرى
        },
      },
    ],
  },
}
```

<Note>
يوجد `setupCommand` ضمن `sandbox.docker` ويُشغّل مرة واحدة عند إنشاء الحاوية. تُتجاهل تجاوزات `sandbox.docker.*` الخاصة بكل وكيل عندما يكون النطاق المحسوم هو `"shared"`.
</Note>

يوفّر ذلك:

- **العزل الأمني**: تقييد الأدوات للوكلاء غير الموثوقين.
- **التحكم في الموارد**: تشغيل وكلاء محددين داخل صندوق حماية مع إبقاء الآخرين على المضيف.
- **سياسات مرنة**: أذونات مختلفة لكل وكيل.

<Note>
لدى `tools.elevated` بوابة عامة (`tools.elevated.enabled`/`allowFrom`) وبوابة لكل وكيل (`agents.list[].tools.elevated.enabled`/`allowFrom`). لا يمكن لبوابة كل وكيل إلا زيادة تقييد البوابة العامة — يجب أن تسمح كلتاهما للمرسل لكي تعمل الأوامر ذات الامتيازات المرتفعة. لاستهداف المجموعات، استخدم `agents.list[].groupChat.mentionPatterns` لكي تُربط إشارات @ بالوكيل المقصود بوضوح.
</Note>

راجع [صندوق الحماية والأدوات متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools) للاطلاع على أمثلة تفصيلية.

## ذو صلة

- [وكلاء ACP](/ar/tools/acp-agents) — تشغيل بيئات برمجة خارجية
- [توجيه القنوات](/ar/channels/channel-routing) — كيفية توجيه الرسائل إلى الوكلاء
- [الحضور](/ar/concepts/presence) — حضور الوكيل وتوافره
- [الجلسة](/ar/concepts/session) — عزل الجلسات وتوجيهها
- [الوكلاء الفرعيون](/ar/tools/subagents) — بدء عمليات تشغيل للوكلاء في الخلفية
