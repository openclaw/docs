---
read_when:
    - إعداد OpenClaw لأول مرة
    - البحث عن أنماط التكوين الشائعة
    - الانتقال إلى أقسام تكوين محددة
summary: 'نظرة عامة على الإعداد: المهام الشائعة، والإعداد السريع، وروابط إلى المرجع الكامل'
title: التكوين
x-i18n:
    generated_at: "2026-07-02T08:22:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0044dd771effee8e11d5dfd99e6f14f105089328dcca23f5794ddff4995bca7
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw يقرأ إعدادًا اختياريًا بصيغة <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> من `~/.openclaw/openclaw.json`.
يجب أن يكون مسار الإعداد النشط ملفًا عاديًا. تخطيطات `openclaw.json`
المرتبطة رمزيًا غير مدعومة لعمليات الكتابة المملوكة لـ OpenClaw؛ فقد تستبدل
الكتابة الذرية المسار بدلًا من الحفاظ على الرابط الرمزي. إذا كنت تحتفظ بالإعداد خارج
دليل الحالة الافتراضي، فوجّه `OPENCLAW_CONFIG_PATH` مباشرة إلى الملف الحقيقي.

إذا كان الملف مفقودًا، يستخدم OpenClaw إعدادات افتراضية آمنة. الأسباب الشائعة لإضافة إعداد:

- ربط القنوات والتحكم بمن يمكنه مراسلة البوت
- تعيين النماذج والأدوات والعزل أو الأتمتة (cron، الخطافات)
- ضبط الجلسات والوسائط والشبكات أو واجهة المستخدم

راجع [المرجع الكامل](/ar/gateway/configuration-reference) لكل حقل متاح.

ينبغي للوكلاء والأتمتة استخدام `config.schema.lookup` للحصول على توثيق دقيق
على مستوى الحقول قبل تعديل الإعداد. استخدم هذه الصفحة للإرشاد الموجّه للمهام و
[مرجع الإعداد](/ar/gateway/configuration-reference) لخريطة الحقول الأوسع
والقيم الافتراضية.

<Tip>
**هل أنت جديد على الإعداد؟** ابدأ بـ `openclaw onboard` للإعداد التفاعلي، أو راجع دليل [أمثلة الإعداد](/ar/gateway/configuration-examples) للحصول على إعدادات كاملة جاهزة للنسخ واللصق.
</Tip>

## الحد الأدنى للإعداد

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## تعديل الإعداد

<Tabs>
  <Tab title="Interactive wizard">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (one-liners)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    افتح [http://127.0.0.1:18789](http://127.0.0.1:18789) واستخدم تبويب **Config**.
    تعرض Control UI نموذجًا من مخطط الإعداد الحي، بما في ذلك بيانات تعريف
    توثيق الحقول `title` / `description` بالإضافة إلى مخططات Plugin والقنوات عند
    توفرها، مع محرر **Raw JSON** كمخرج بديل. لواجهات التنقل التفصيلي
    والأدوات الأخرى، يوفّر Gateway أيضًا `config.schema.lookup` لجلب
    عقدة مخطط واحدة محددة بالمسار مع ملخصات الأبناء المباشرين.
  </Tab>
  <Tab title="Direct edit">
    عدّل `~/.openclaw/openclaw.json` مباشرة. يراقب Gateway الملف ويطبّق التغييرات تلقائيًا (راجع [إعادة التحميل الساخنة](#config-hot-reload)).
  </Tab>
</Tabs>

## التحقق الصارم

<Warning>
لا يقبل OpenClaw إلا الإعدادات التي تطابق المخطط بالكامل. المفاتيح غير المعروفة أو الأنواع غير الصحيحة أو القيم غير الصالحة تجعل Gateway **يرفض بدء التشغيل**. الاستثناء الوحيد على مستوى الجذر هو `$schema` (سلسلة نصية)، لكي تتمكن المحررات من إرفاق بيانات تعريف JSON Schema.
</Warning>

يطبع `openclaw config schema` مخطط JSON Schema المعياري المستخدم من Control UI
والتحقق. يجلب `config.schema.lookup` عقدة واحدة محددة بالمسار مع
ملخصات الأبناء لأدوات التنقل التفصيلي. تنتقل بيانات تعريف توثيق الحقول
`title`/`description` عبر الكائنات المتداخلة، وفروع wildcard (`*`) وعناصر المصفوفة (`[]`) و `anyOf`/
`oneOf`/`allOf`. تندمج مخططات Plugin والقنوات وقت التشغيل عند تحميل
سجل البيان.

عند فشل التحقق:

- لا يبدأ Gateway
- تعمل أوامر التشخيص فقط (`openclaw doctor`، `openclaw logs`، `openclaw health`، `openclaw status`)
- شغّل `openclaw doctor` لرؤية المشكلات الدقيقة
- شغّل `openclaw doctor --fix` (أو `--yes`) لتطبيق الإصلاحات

يحتفظ Gateway بنسخة موثوقة من آخر إعداد سليم معروف بعد كل بدء تشغيل ناجح،
لكن بدء التشغيل وإعادة التحميل الساخنة لا يستعيدانها تلقائيًا. إذا فشل `openclaw.json`
في التحقق (بما في ذلك التحقق المحلي الخاص بـ Plugin)، يفشل بدء Gateway أو
يتم تخطي إعادة التحميل ويحتفظ وقت التشغيل الحالي بآخر إعداد مقبول.
شغّل `openclaw doctor --fix` (أو `--yes`) لإصلاح الإعداد ذي البادئة/المتضرر أو
استعادة نسخة آخر إعداد سليم معروف. يتم تخطي الترقية إلى آخر إعداد سليم معروف عندما
يحتوي المرشح على عناصر نائبة لأسرار منقّحة مثل `***`.

## المهام الشائعة

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    لكل قناة قسم إعداد خاص بها تحت `channels.<provider>`. راجع صفحة القناة المخصصة لخطوات الإعداد:

    - [WhatsApp](/ar/channels/whatsapp) - `channels.whatsapp`
    - [Telegram](/ar/channels/telegram) - `channels.telegram`
    - [Discord](/ar/channels/discord) - `channels.discord`
    - [Feishu](/ar/channels/feishu) - `channels.feishu`
    - [Google Chat](/ar/channels/googlechat) - `channels.googlechat`
    - [Microsoft Teams](/ar/channels/msteams) - `channels.msteams`
    - [Slack](/ar/channels/slack) - `channels.slack`
    - [Signal](/ar/channels/signal) - `channels.signal`
    - [iMessage](/ar/channels/imessage) - `channels.imessage`
    - [Mattermost](/ar/channels/mattermost) - `channels.mattermost`

    تشترك جميع القنوات في نمط سياسة الرسائل المباشرة نفسه:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Choose and configure models">
    عيّن النموذج الأساسي والبدائل الاختيارية:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - يعرّف `agents.defaults.models` كتالوج النماذج ويعمل كقائمة سماح لـ `/model`؛ وتقوم إدخالات `provider/*` بتصفية `/model` و `/models` ومنتقيات النماذج إلى المزودين المحددين مع الاستمرار في استخدام اكتشاف النماذج الديناميكي.
    - استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات قائمة السماح دون إزالة النماذج الحالية. يتم رفض الاستبدالات العادية التي قد تزيل إدخالات ما لم تمرر `--replace`.
    - تستخدم مراجع النماذج تنسيق `provider/model` (مثل `anthropic/claude-opus-4-6`).
    - يتحكم `agents.defaults.imageMaxDimensionPx` في تصغير صور النصوص/الأدوات (الافتراضي `1200`)؛ عادةً ما تقلل القيم الأصغر استخدام رموز الرؤية في التشغيلات كثيفة لقطات الشاشة.
    - راجع [CLI النماذج](/ar/concepts/models) لتبديل النماذج في الدردشة و[تجاوز فشل النموذج](/ar/concepts/model-failover) لتدوير المصادقة وسلوك البدائل.
    - للمزودين المخصصين/المستضافين ذاتيًا، راجع [المزودون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls) في المرجع.

  </Accordion>

  <Accordion title="Control who can message the bot">
    يتم التحكم في الوصول إلى الرسائل المباشرة لكل قناة عبر `dmPolicy`:

    - `"pairing"` (افتراضي): يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة للموافقة
    - `"allowlist"`: المرسلون الموجودون في `allowFrom` فقط (أو مخزن السماح المقترن)
    - `"open"`: السماح بكل الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`)
    - `"disabled"`: تجاهل كل الرسائل المباشرة

    للمجموعات، استخدم `groupPolicy` + `groupAllowFrom` أو قوائم السماح الخاصة بالقنوات.

    راجع [المرجع الكامل](/ar/gateway/config-channels#dm-and-group-access) للتفاصيل الخاصة بكل قناة.

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    تتطلب رسائل المجموعات افتراضيًا **وجود إشارة**. اضبط أنماط التشغيل لكل وكيل. تُنشر الردود العادية في المجموعات/القنوات تلقائيًا؛ فعّل مسار أداة الرسائل للغرف المشتركة التي ينبغي للوكيل أن يقرر فيها متى يتحدث:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // opt-in; visible output requires message(action=send)
          unmentionedInbound: "room_event", // unmentioned always-on group chatter is quiet context
        },
      },
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **إشارات البيانات الوصفية**: إشارات @ الأصلية (إشارة WhatsApp باللمس، Telegram @bot، وما إلى ذلك)
    - **أنماط النص**: أنماط regex آمنة في `mentionPatterns`
    - **الردود المرئية**: يمكن لـ `messages.visibleReplies` أن يطلب إرسال أدوات الرسائل عالميًا؛ ويتجاوز `messages.groupChat.visibleReplies` ذلك للمجموعات/القنوات.
    - راجع [المرجع الكامل](/ar/gateway/config-channels#group-chat-mention-gating) لأوضاع الردود المرئية، والتجاوزات لكل قناة، ووضع الدردشة الذاتية.

  </Accordion>

  <Accordion title="Restrict skills per agent">
    استخدم `agents.defaults.skills` كأساس مشترك، ثم تجاوز وكلاء محددين
    باستخدام `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - احذف `agents.defaults.skills` لجعل Skills غير مقيّدة افتراضيًا.
    - احذف `agents.list[].skills` لوراثة الإعدادات الافتراضية.
    - عيّن `agents.list[].skills: []` لعدم وجود Skills.
    - راجع [Skills](/ar/tools/skills)، و[إعداد Skills](/ar/tools/skills-config)، و
      [مرجع الإعداد](/ar/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
    تحكّم في مدى شدة إعادة تشغيل Gateway للقنوات التي تبدو قديمة:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - عيّن `gateway.channelHealthCheckMinutes: 0` لتعطيل عمليات إعادة تشغيل مراقبة الصحة عالميًا.
    - ينبغي أن يكون `channelStaleEventThresholdMinutes` أكبر من أو مساويًا لفاصل الفحص.
    - استخدم `channels.<provider>.healthMonitor.enabled` أو `channels.<provider>.accounts.<id>.healthMonitor.enabled` لتعطيل إعادة التشغيل التلقائي لقناة أو حساب واحد دون تعطيل المراقبة العالمية.
    - راجع [فحوصات الصحة](/ar/gateway/health) لتصحيح التشغيل و[المرجع الكامل](/ar/gateway/configuration-reference#gateway) لكل الحقول.

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    امنح العملاء المحليين وقتًا أطول لإكمال مصافحة WebSocket قبل المصادقة على
    المضيفات المحمّلة أو منخفضة القدرة:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - القيمة الافتراضية هي `15000` مللي ثانية.
    - لا يزال `OPENCLAW_HANDSHAKE_TIMEOUT_MS` له الأولوية لتجاوزات الخدمة أو الصدفة لمرة واحدة.
    - يفضّل إصلاح توقفات بدء التشغيل/حلقة الأحداث أولًا؛ هذا المقبض للمضيفات السليمة لكنها بطيئة أثناء الإحماء.

  </Accordion>

  <Accordion title="Configure sessions and resets">
    تتحكم الجلسات في استمرارية المحادثة وعزلها:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (مشترك) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: الإعدادات الافتراضية العامة لتوجيه الجلسات المرتبطة بالسلاسل (يدعم Discord أوامر `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`).
    - راجع [إدارة الجلسات](/ar/concepts/session) لمعرفة النطاق، وروابط الهوية، وسياسة الإرسال.
    - راجع [المرجع الكامل](/ar/gateway/config-agents#session) للاطلاع على جميع الحقول.

  </Accordion>

  <Accordion title="تفعيل وضع العزل">
    شغّل جلسات الوكيل في أوقات تشغيل معزولة داخل صندوق عزل:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    ابنِ الصورة أولاً - من نسخة مصدرية شغّل `scripts/sandbox-setup.sh`، أو من تثبيت npm راجع أمر `docker build` المضمّن في [وضع العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup).

    راجع [وضع العزل](/ar/gateway/sandboxing) للدليل الكامل و[المرجع الكامل](/ar/gateway/config-agents#agentsdefaultssandbox) لكل الخيارات.

  </Accordion>

  <Accordion title="تفعيل الدفع المدعوم بالمرحل لبُنى iOS الرسمية">
    يستخدم الدفع المدعوم بالمرحل لبُنى App Store العامة مرحل OpenClaw المستضاف: `https://ios-push-relay.openclaw.ai`.

    تتطلب عمليات نشر المرحل المخصصة مسار بناء/نشر iOS منفصلاً عمداً يكون فيه عنوان URL للمرحل مطابقاً لعنوان URL لمرحل Gateway. إذا كنت تستخدم بنية مرحل مخصصة، فاضبط هذا في تكوين Gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Default: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    مكافئ CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    ما يفعله هذا:

    - يسمح لـ Gateway بإرسال `push.test` وتنبيهات الإيقاظ وإيقاظات إعادة الاتصال عبر المرحل الخارجي.
    - يستخدم منحة إرسال محددة بنطاق التسجيل يمررها تطبيق iOS المقترن. لا يحتاج Gateway إلى رمز مرحل على مستوى النشر.
    - يربط كل تسجيل مدعوم بالمرحل بهوية Gateway التي اقترن بها تطبيق iOS، حتى لا يتمكن Gateway آخر من إعادة استخدام التسجيل المخزن.
    - يُبقي بُنى iOS المحلية/اليدوية على APNs مباشرة. تنطبق عمليات الإرسال المدعومة بالمرحل فقط على البُنى الموزعة الرسمية التي سجلت عبر المرحل.
    - يجب أن يطابق عنوان URL الأساسي للمرحل المضمّن في بنية iOS، لكي تصل حركة التسجيل والإرسال إلى نشر المرحل نفسه.

    التدفق من البداية إلى النهاية:

    1. ثبّت تطبيق iOS الرسمي.
    2. اختياري: اضبط `gateway.push.apns.relay.baseUrl` على Gateway فقط عند استخدام بنية مرحل مخصصة منفصلة عمداً.
    3. اربط تطبيق iOS بـ Gateway ودع كلاً من جلسات العقدة والمشغل تتصل.
    4. يجلب تطبيق iOS هوية Gateway، ويسجل لدى المرحل باستخدام App Attest مع إيصال التطبيق، ثم ينشر حمولة `push.apns.register` المدعومة بالمرحل إلى Gateway المقترن.
    5. يخزن Gateway مقبض المرحل ومنحة الإرسال، ثم يستخدمهما من أجل `push.test` وتنبيهات الإيقاظ وإيقاظات إعادة الاتصال.

    ملاحظات تشغيلية:

    - إذا بدّلت تطبيق iOS إلى Gateway مختلف، فأعد توصيل التطبيق حتى يتمكن من نشر تسجيل مرحل جديد مرتبط بذلك Gateway.
    - إذا شحنت بنية iOS جديدة تشير إلى نشر مرحل مختلف، فسيحدّث التطبيق تسجيل المرحل المخزن مؤقتاً بدلاً من إعادة استخدام أصل المرحل القديم.

    ملاحظة التوافق:

    - لا يزال `OPENCLAW_APNS_RELAY_BASE_URL` و`OPENCLAW_APNS_RELAY_TIMEOUT_MS` يعملان كتجاوزات مؤقتة عبر متغيرات البيئة.
    - يجب أن تطابق عناوين URL المخصصة لمرحل Gateway عنوان URL الأساسي للمرحل المضمّن في بنية iOS. يرفض مسار إصدار App Store العام تجاوزات عنوان URL لمرحل iOS المخصص.
    - يبقى `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` منفذ هروب تطويرياً مقتصراً على local loopback؛ لا تحفظ عناوين URL لمرحل HTTP في التكوين.

    راجع [تطبيق iOS](/ar/platforms/ios#relay-backed-push-for-official-builds) للتدفق من البداية إلى النهاية و[تدفق المصادقة والثقة](/ar/platforms/ios#authentication-and-trust-flow) لنموذج أمان المرحل.

  </Accordion>

  <Accordion title="إعداد Heartbeat (عمليات تسجيل وصول دورية)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: سلسلة مدة (`30m`، `2h`). اضبط `0m` للتعطيل.
    - `target`: `last` | `none` | `<channel-id>` (مثلاً `discord` أو `matrix` أو `telegram` أو `whatsapp`)
    - `directPolicy`: `allow` (افتراضي) أو `block` لأهداف Heartbeat بأسلوب الرسائل المباشرة
    - راجع [Heartbeat](/ar/gateway/heartbeat) للدليل الكامل.

  </Accordion>

  <Accordion title="تكوين مهام Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: يشذّب جلسات التشغيل المعزولة المكتملة من `sessions.json` (الافتراضي `24h`؛ اضبط `false` للتعطيل).
    - `runLog`: يشذّب صفوف سجل تشغيل Cron المحتفظ بها لكل مهمة. يظل `maxBytes` مقبولاً لسجلات التشغيل القديمة المدعومة بالملفات.
    - راجع [مهام Cron](/ar/automation/cron-jobs) للاطلاع على نظرة عامة على الميزة وأمثلة CLI.

  </Accordion>

  <Accordion title="إعداد Webhook (خطافات)">
    فعّل نقاط نهاية Webhook عبر HTTP على Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    ملاحظة أمنية:
    - تعامل مع كل محتوى حمولات الخطافات/Webhook كمدخلات غير موثوقة.
    - استخدم `hooks.token` مخصصاً؛ لا تعِد استخدام أسرار مصادقة Gateway النشطة (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` أو `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - مصادقة الخطاف عبر الرؤوس فقط (`Authorization: Bearer ...` أو `x-openclaw-token`)؛ تُرفض رموز سلسلة الاستعلام.
    - لا يمكن أن يكون `hooks.path` هو `/`؛ أبقِ دخول Webhook على مسار فرعي مخصص مثل `/hooks`.
    - أبقِ علامات تجاوز المحتوى غير الآمن معطلة (`hooks.gmail.allowUnsafeExternalContent`، `hooks.mappings[].allowUnsafeExternalContent`) إلا عند إجراء تصحيح أخطاء محدود النطاق بإحكام.
    - إذا فعّلت `hooks.allowRequestSessionKey`، فاضبط أيضاً `hooks.allowedSessionKeyPrefixes` لتقييد مفاتيح الجلسة التي يختارها المستدعي.
    - بالنسبة إلى الوكلاء المدفوعين بالخطافات، فضّل مستويات نماذج حديثة قوية وسياسة أدوات صارمة (مثلاً المراسلة فقط مع وضع العزل حيثما أمكن).

    راجع [المرجع الكامل](/ar/gateway/configuration-reference#hooks) لكل خيارات التعيين وتكامل Gmail.

  </Accordion>

  <Accordion title="تكوين توجيه متعدد الوكلاء">
    شغّل عدة وكلاء معزولين بمساحات عمل وجلسات منفصلة:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    راجع [متعدد الوكلاء](/ar/concepts/multi-agent) و[المرجع الكامل](/ar/gateway/config-agents#multi-agent-routing) لقواعد الربط وملفات تعريف الوصول لكل وكيل.

  </Accordion>

  <Accordion title="تقسيم التكوين إلى ملفات متعددة ($include)">
    استخدم `$include` لتنظيم التكوينات الكبيرة:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **ملف واحد**: يستبدل الكائن المحتوي
    - **مصفوفة ملفات**: تُدمج دمجاً عميقاً بالترتيب (اللاحق يفوز)
    - **المفاتيح الشقيقة**: تُدمج بعد التضمينات (تتجاوز القيم المضمّنة)
    - **التضمينات المتداخلة**: مدعومة حتى عمق 10 مستويات
    - **المسارات النسبية**: تُحل نسبةً إلى الملف الذي يتضمنها
    - **تنسيق المسار**: يجب ألا تحتوي مسارات التضمين على بايتات null ويجب أن تكون أقصر بصرامة من 4096 حرفاً قبل الحل وبعده
    - **كتابات مملوكة لـ OpenClaw**: عندما يغير إجراء كتابة قسماً واحداً فقط من المستوى الأعلى
      مدعوماً بتضمين ملف واحد مثل `plugins: { $include: "./plugins.json5" }`،
      يحدّث OpenClaw ذلك الملف المضمّن ويترك `openclaw.json` دون تغيير
    - **تمرير الكتابة غير المدعوم**: التضمينات الجذرية، ومصفوفات التضمين، والتضمينات
      ذات التجاوزات الشقيقة تفشل بشكل مغلق في الكتابات المملوكة لـ OpenClaw بدلاً من
      تسطيح التكوين
    - **الحصر**: يجب أن تُحل مسارات `$include` تحت الدليل الذي يحتوي
      `openclaw.json`. لمشاركة شجرة عبر أجهزة أو مستخدمين، اضبط
      `OPENCLAW_INCLUDE_ROOTS` إلى قائمة مسارات (`:` على POSIX، و`;` على Windows) من
      أدلة إضافية قد تشير إليها التضمينات. تُحل الروابط الرمزية
      وتُفحص مرة أخرى، لذلك لا يزال المسار الذي يقع نصياً داخل دليل تكوين ولكن
      هدفه الحقيقي يخرج من كل جذر مسموح مرفوضاً.
    - **معالجة الأخطاء**: أخطاء واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية، وتنسيق المسار غير الصالح، والطول المفرط

  </Accordion>
</AccordionGroup>

## إعادة تحميل التكوين الفوري

يراقب Gateway الملف `~/.openclaw/openclaw.json` ويطبق التغييرات تلقائياً - لا حاجة إلى إعادة تشغيل يدوية لمعظم الإعدادات.

تُعامل تعديلات الملفات المباشرة كغير موثوقة حتى يتم التحقق من صحتها. ينتظر المراقب
حتى يهدأ اضطراب الكتابة المؤقتة/إعادة التسمية من المحرر، ويقرأ الملف النهائي، ويرفض
التعديلات الخارجية غير الصالحة دون إعادة كتابة `openclaw.json`. تستخدم كتابات التكوين
المملوكة لـ OpenClaw بوابة المخطط نفسها قبل الكتابة؛ تُرفض عمليات الاستبدال المدمرة مثل
إسقاط `gateway.mode` أو تقليص الملف بأكثر من النصف، وتُحفظ كـ `.rejected.*` للفحص.

إذا رأيت `config reload skipped (invalid config)` أو أبلغ بدء التشغيل عن `Invalid
config`، فافحص التكوين، وشغّل `openclaw config validate`، ثم شغّل `openclaw
doctor --fix` للإصلاح. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-rejected-invalid-config)
للحصول على قائمة التحقق.

### أوضاع إعادة التحميل

| الوضع                  | السلوك                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (افتراضي) | يطبق التغييرات الآمنة فورياً دون إعادة تشغيل. يعيد التشغيل تلقائياً للتغييرات الحرجة. |
| **`hot`**              | يطبق التغييرات الآمنة فورياً فقط. يسجل تحذيراً عند الحاجة إلى إعادة تشغيل - تتولاه أنت. |
| **`restart`**          | يعيد تشغيل Gateway عند أي تغيير في التكوين، سواء كان آمناً أم لا.                       |
| **`off`**              | يعطّل مراقبة الملفات. تسري التغييرات عند إعادة التشغيل اليدوية التالية.                |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ما يُطبق فورياً مقابل ما يحتاج إلى إعادة تشغيل

تُطبّق معظم الحقول فورياً دون توقف. في وضع `hybrid`، تُعالَج التغييرات التي تتطلب إعادة تشغيل تلقائياً.

| الفئة              | الحقول                                                            | هل يلزم إعادة التشغيل؟ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| القنوات             | `channels.*`، `web` (WhatsApp) - جميع القنوات المدمجة وقنوات Plugin | لا              |
| الوكيل والنماذج     | `agent`، `agents`، `models`، `routing`                            | لا              |
| الأتمتة             | `hooks`، `cron`، `agent.heartbeat`                                | لا              |
| الجلسات والرسائل    | `session`، `messages`                                             | لا              |
| الأدوات والوسائط    | `tools`، `browser`، `skills`، `mcp`، `audio`، `talk`              | لا              |
| واجهة المستخدم ومتفرقات | `ui`، `logging`، `identity`، `bindings`                           | لا              |
| خادم Gateway        | `gateway.*` (port، bind، auth، tailscale، TLS، HTTP)              | **نعم**         |
| البنية التحتية      | `discovery`، `plugins`                                            | **نعم**         |

<Note>
`gateway.reload` و`gateway.remote` استثناءان - تغييرهما لا يؤدي إلى إعادة التشغيل.
</Note>

### تخطيط إعادة التحميل

عندما تعدل ملف مصدر تتم الإشارة إليه عبر `$include`، يخطط OpenClaw
لإعادة التحميل من التخطيط المؤلف في المصدر، وليس من العرض المسطح في الذاكرة.
هذا يجعل قرارات إعادة التحميل الساخنة (التطبيق الساخن مقابل إعادة التشغيل) قابلة للتوقع حتى عندما
يعيش قسم واحد من المستوى الأعلى في ملف مضمن خاص به مثل
`plugins: { $include: "./plugins.json5" }`. يفشل تخطيط إعادة التحميل بإغلاق آمن إذا كان
تخطيط المصدر ملتبسًا.

## RPC للتكوين (تحديثات برمجية)

بالنسبة للأدوات التي تكتب التكوين عبر واجهة API الخاصة بـ Gateway، فضّل هذا المسار:

- `config.schema.lookup` لفحص شجرة فرعية واحدة (عقدة مخطط سطحية + ملخصات
  الأبناء)
- `config.get` لجلب اللقطة الحالية بالإضافة إلى `hash`
- `config.patch` للتحديثات الجزئية (تصحيح دمج JSON: الكائنات تندمج، و`null`
  يحذف، والمصفوفات تُستبدل عند تأكيد ذلك صراحة باستخدام `replacePaths` إذا
  كانت ستتم إزالة إدخالات)
- `config.apply` فقط عندما تنوي استبدال التكوين بالكامل
- `update.run` للتحديث الذاتي الصريح مع إعادة التشغيل؛ ضمّن `continuationMessage` عندما ينبغي للجلسة بعد إعادة التشغيل تشغيل دور متابعة واحد
- `update.status` لفحص أحدث مؤشر إعادة تشغيل للتحديث والتحقق من النسخة العاملة بعد إعادة التشغيل

ينبغي للوكلاء التعامل مع `config.schema.lookup` باعتباره المحطة الأولى للحصول على
توثيق وقيود دقيقة على مستوى الحقول. استخدم [مرجع التكوين](/ar/gateway/configuration-reference)
عندما يحتاجون إلى خريطة التكوين الأوسع، أو القيم الافتراضية، أو الروابط إلى مراجع
الأنظمة الفرعية المخصصة.

<Note>
عمليات الكتابة في مستوى التحكم (`config.apply`، `config.patch`، `update.run`) محدودة
بمعدل 3 طلبات كل 60 ثانية لكل `deviceId+clientIp`. تتجمع طلبات إعادة التشغيل
ثم تفرض فترة تهدئة مدتها 30 ثانية بين دورات إعادة التشغيل.
`update.status` للقراءة فقط لكنه مخصص للمشرفين لأن مؤشر إعادة التشغيل يمكن أن
يتضمن ملخصات خطوات التحديث وذيول مخرجات الأوامر.
</Note>

مثال على تصحيح جزئي:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

يقبل كل من `config.apply` و`config.patch` الحقول `raw` و`baseHash` و`sessionKey`
و`note` و`restartDelayMs`. يكون `baseHash` مطلوبًا لكلتا الطريقتين عندما يكون
هناك تكوين موجود بالفعل.

يقبل `config.patch` أيضًا `replacePaths`، وهي مصفوفة من مسارات التكوين التي يكون
استبدال مصفوفتها مقصودًا. إذا كان التصحيح سيستبدل أو يحذف مصفوفة موجودة
بإدخالات أقل، يرفض Gateway الكتابة ما لم يظهر ذلك المسار المحدد بالضبط
في `replacePaths`؛ تستخدم المصفوفات المتداخلة ضمن إدخالات المصفوفة `[]`، مثل
`agents.list[].skills`. يمنع هذا لقطات `config.get` المقتطعة من
استبدال مصفوفات التوجيه أو قوائم السماح بصمت. استخدم `config.apply` عندما
تنوي استبدال التكوين الكامل.

## متغيرات البيئة

يقرأ OpenClaw متغيرات البيئة من العملية الأم بالإضافة إلى:

- `.env` من دليل العمل الحالي (إن وجد)
- `~/.openclaw/.env` (بديل عام)

لا يتجاوز أي من الملفين متغيرات البيئة الموجودة. يمكنك أيضًا تعيين متغيرات بيئة مضمنة في التكوين:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="استيراد بيئة Shell (اختياري)">
  إذا كان مفعّلًا ولم تكن المفاتيح المتوقعة معيّنة، يشغل OpenClaw غلاف تسجيل الدخول الخاص بك ويستورد المفاتيح الناقصة فقط:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

مكافئ متغير البيئة: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="استبدال متغيرات البيئة في قيم التكوين">
  ارجع إلى متغيرات البيئة في أي قيمة سلسلة ضمن التكوين باستخدام `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

القواعد:

- تتم مطابقة الأسماء بالأحرف الكبيرة فقط: `[A-Z_][A-Z0-9_]*`
- المتغيرات الناقصة أو الفارغة تطلق خطأ عند وقت التحميل
- استخدم `$${VAR}` للهروب والحصول على مخرج حرفي
- يعمل داخل ملفات `$include`
- الاستبدال المضمن: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="مراجع الأسرار (env، file، exec)">
  بالنسبة للحقول التي تدعم كائنات SecretRef، يمكنك استخدام:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

تفاصيل SecretRef (بما في ذلك `secrets.providers` لـ `env`/`file`/`exec`) موجودة في [إدارة الأسرار](/ar/gateway/secrets).
تُسرد مسارات بيانات الاعتماد المدعومة في [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Accordion>

راجع [البيئة](/ar/help/environment) لمعرفة الأولوية والمصادر الكاملة.

## المرجع الكامل

للمرجع الكامل حقلًا بحقل، راجع **[مرجع التكوين](/ar/gateway/configuration-reference)**.

---

_ذو صلة: [أمثلة التكوين](/ar/gateway/configuration-examples) · [مرجع التكوين](/ar/gateway/configuration-reference) · [Doctor](/ar/gateway/doctor)_

## ذو صلة

- [مرجع التكوين](/ar/gateway/configuration-reference)
- [أمثلة التكوين](/ar/gateway/configuration-examples)
- [دليل تشغيل Gateway](/ar/gateway)
