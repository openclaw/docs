---
read_when:
    - إعداد OpenClaw للمرة الأولى
    - جارٍ البحث عن أنماط التكوين الشائعة
    - الانتقال إلى أقسام محددة في التكوين
summary: 'نظرة عامة على التكوين: المهام الشائعة، والإعداد السريع، وروابط إلى المرجع الكامل'
title: التكوين
x-i18n:
    generated_at: "2026-05-02T07:26:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: d5ad1685170923f26166fb2f74891468d16c6f86af5cc5f5f1da7a6dce65eb98
    source_path: gateway/configuration.md
    workflow: 16
---

يقرأ OpenClaw تكوينًا اختياريًا بتنسيق <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> من `~/.openclaw/openclaw.json`.
يجب أن يكون مسار التكوين النشط ملفًا عاديًا. تخطيطات `openclaw.json`
المبنية على روابط رمزية غير مدعومة لعمليات الكتابة التي يملكها OpenClaw؛ فقد تستبدل الكتابة الذرية
المسار بدلًا من الحفاظ على الرابط الرمزي. إذا احتفظت بالتكوين خارج
دليل الحالة الافتراضي، فاجعل `OPENCLAW_CONFIG_PATH` يشير مباشرةً إلى الملف الحقيقي.

إذا كان الملف مفقودًا، يستخدم OpenClaw إعدادات افتراضية آمنة. من الأسباب الشائعة لإضافة تكوين:

- توصيل القنوات والتحكم في من يمكنه مراسلة البوت
- ضبط النماذج، والأدوات، والعزل، أو الأتمتة (cron، والخطافات)
- ضبط الجلسات، والوسائط، والشبكات، أو واجهة المستخدم

راجع [المرجع الكامل](/ar/gateway/configuration-reference) لكل حقل متاح.

يجب على الوكلاء والأتمتة استخدام `config.schema.lookup` للحصول على
توثيق دقيق على مستوى الحقل قبل تعديل التكوين. استخدم هذه الصفحة للإرشادات الموجهة حسب المهمة و
[مرجع التكوين](/ar/gateway/configuration-reference) لخريطة الحقول الأوسع
والإعدادات الافتراضية.

<Tip>
**هل أنت جديد على التكوين؟** ابدأ بـ `openclaw onboard` للإعداد التفاعلي، أو راجع دليل [أمثلة التكوين](/ar/gateway/configuration-examples) لتكوينات كاملة جاهزة للنسخ واللصق.
</Tip>

## الحد الأدنى من التكوين

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## تعديل التكوين

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
    افتح [http://127.0.0.1:18789](http://127.0.0.1:18789) واستخدم تبويب **التكوين**.
    تعرض واجهة التحكم نموذجًا من مخطط التكوين الحي، بما في ذلك بيانات التوثيق الوصفية للحقول
    `title` / `description` إضافةً إلى مخططات Plugin والقنوات عند
    توفرها، مع محرر **Raw JSON** كمخرج طوارئ. لواجهات
    التنقل التفصيلي والأدوات الأخرى، يوفّر Gateway أيضًا `config.schema.lookup`
    لجلب عقدة مخطط واحدة محددة بالمسار مع ملخصات الأبناء المباشرين.
  </Tab>
  <Tab title="Direct edit">
    عدّل `~/.openclaw/openclaw.json` مباشرةً. يراقب Gateway الملف ويطبق التغييرات تلقائيًا (راجع [إعادة التحميل الساخنة](#config-hot-reload)).
  </Tab>
</Tabs>

## التحقق الصارم

<Warning>
لا يقبل OpenClaw إلا التكوينات التي تطابق المخطط بالكامل. المفاتيح غير المعروفة، أو الأنواع غير الصحيحة، أو القيم غير الصالحة تجعل Gateway **يرفض بدء التشغيل**. الاستثناء الوحيد على مستوى الجذر هو `$schema` (نص)، حتى تتمكن المحررات من إرفاق بيانات JSON Schema الوصفية.
</Warning>

يطبع `openclaw config schema` مخطط JSON Schema القانوني المستخدم بواسطة واجهة التحكم
والتحقق. يجلب `config.schema.lookup` عقدة واحدة محددة بالمسار مع
ملخصات الأبناء لأدوات التنقل التفصيلي. تنتقل بيانات توثيق الحقول الوصفية `title`/`description`
عبر الكائنات المتداخلة، والبدل (`*`)، وعنصر المصفوفة (`[]`)، وفروع `anyOf`/
`oneOf`/`allOf`. تندمج مخططات Plugin والقنوات وقت التشغيل عند تحميل
سجل البيان.

عند فشل التحقق:

- لا يقلع Gateway
- تعمل أوامر التشخيص فقط (`openclaw doctor`، `openclaw logs`، `openclaw health`، `openclaw status`)
- شغّل `openclaw doctor` لرؤية المشكلات الدقيقة
- شغّل `openclaw doctor --fix` (أو `--yes`) لتطبيق الإصلاحات

يحتفظ Gateway بنسخة موثوقة من آخر تكوين صالح معروف بعد كل بدء تشغيل ناجح.
إذا فشل `openclaw.json` لاحقًا في التحقق (أو أسقط `gateway.mode`، أو انكمش
بشكل حاد، أو أضيف إليه سطر سجل شارد في بدايته)، يحافظ OpenClaw على الملف المعطوب
باسم `.clobbered.*`، ويستعيد آخر نسخة صالحة معروفة، ويسجل سبب
الاسترداد. يتلقى دور الوكيل التالي أيضًا تحذير حدث نظام حتى لا يعيد الوكيل
الرئيسي كتابة التكوين المستعاد دون قصد. يتم تخطي الترقية إلى آخر تكوين صالح معروف
عندما يحتوي المرشح على عناصر نائبة لأسرار منقحة مثل `***`.
عندما تكون كل مشكلات التحقق محصورة في `plugins.entries.<id>...`، لا ينفذ OpenClaw
استردادًا للملف بالكامل. فهو يبقي التكوين الحالي نشطًا ويعرض الفشل المحلي الخاص بـ Plugin
حتى لا يؤدي عدم تطابق مخطط Plugin أو إصدار المضيف إلى التراجع عن إعدادات مستخدم غير مرتبطة.

## المهام الشائعة

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    لكل قناة قسم تكوين خاص بها ضمن `channels.<provider>`. راجع صفحة القناة المخصصة لمعرفة خطوات الإعداد:

    - [WhatsApp](/ar/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/ar/channels/telegram) — `channels.telegram`
    - [Discord](/ar/channels/discord) — `channels.discord`
    - [Feishu](/ar/channels/feishu) — `channels.feishu`
    - [Google Chat](/ar/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/ar/channels/msteams) — `channels.msteams`
    - [Slack](/ar/channels/slack) — `channels.slack`
    - [Signal](/ar/channels/signal) — `channels.signal`
    - [iMessage](/ar/channels/imessage) — `channels.imessage`
    - [Mattermost](/ar/channels/mattermost) — `channels.mattermost`

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
    اضبط النموذج الأساسي والبدائل الاختيارية:

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

    - يعرّف `agents.defaults.models` كتالوج النماذج ويعمل كقائمة السماح لـ `/model`.
    - استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات قائمة السماح دون إزالة النماذج الحالية. تُرفض الاستبدالات الصريحة التي قد تزيل إدخالات ما لم تمرر `--replace`.
    - تستخدم مراجع النماذج صيغة `provider/model` (مثل `anthropic/claude-opus-4-6`).
    - يتحكم `agents.defaults.imageMaxDimensionPx` في تصغير صور المحادثة/الأداة (الافتراضي `1200`)؛ عادةً ما تقلل القيم الأصغر استخدام رموز الرؤية في التشغيلات كثيفة لقطات الشاشة.
    - راجع [CLI النماذج](/ar/concepts/models) للتبديل بين النماذج في الدردشة و[تجاوز فشل النماذج](/ar/concepts/model-failover) لسلوك تدوير المصادقة والبدائل.
    - لموفري الخدمات المخصصين/المستضافين ذاتيًا، راجع [الموفرون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls) في المرجع.

  </Accordion>

  <Accordion title="Control who can message the bot">
    يتم التحكم في الوصول إلى الرسائل المباشرة لكل قناة عبر `dmPolicy`:

    - `"pairing"` (الافتراضي): يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة للموافقة
    - `"allowlist"`: المرسلون الموجودون في `allowFrom` فقط (أو مخزن السماح المقترن)
    - `"open"`: السماح بكل الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`)
    - `"disabled"`: تجاهل كل الرسائل المباشرة

    للمجموعات، استخدم `groupPolicy` + `groupAllowFrom` أو قوائم السماح الخاصة بالقنوات.

    راجع [المرجع الكامل](/ar/gateway/config-channels#dm-and-group-access) لمعرفة التفاصيل الخاصة بكل قناة.

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    تتطلب رسائل المجموعات افتراضيًا **الإشارة**. اضبط أنماط التشغيل لكل وكيل، وأبقِ الردود المرئية في الغرفة على مسار أداة الرسائل الافتراضي ما لم تكن تريد عمدًا الردود النهائية التلقائية القديمة:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // default; use "automatic" for legacy room replies
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

    - **إشارات البيانات الوصفية**: إشارات @ الأصلية (الإشارة بالضغط في WhatsApp، أو Telegram @bot، إلخ)
    - **أنماط النص**: أنماط regex آمنة في `mentionPatterns`
    - **الردود المرئية**: يمكن لـ `messages.visibleReplies` أن يتطلب إرسالًا عبر أداة الرسائل عمومًا؛ ويتجاوز `messages.groupChat.visibleReplies` ذلك للمجموعات/القنوات.
    - راجع [المرجع الكامل](/ar/gateway/config-channels#group-chat-mention-gating) لأوضاع الرد المرئي، والتجاوزات الخاصة بكل قناة، ووضع الدردشة مع الذات.

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

    - احذف `agents.defaults.skills` لجعل Skills غير مقيدة افتراضيًا.
    - احذف `agents.list[].skills` لوراثة الإعدادات الافتراضية.
    - اضبط `agents.list[].skills: []` لعدم استخدام Skills.
    - راجع [Skills](/ar/tools/skills)، و[تكوين Skills](/ar/tools/skills-config)، و
      [مرجع التكوين](/ar/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
    تحكم في مدى شدة قيام Gateway بإعادة تشغيل القنوات التي تبدو قديمة:

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

    - اضبط `gateway.channelHealthCheckMinutes: 0` لتعطيل عمليات إعادة التشغيل الخاصة بمراقبة الصحة عمومًا.
    - ينبغي أن يكون `channelStaleEventThresholdMinutes` أكبر من فاصل الفحص أو مساويًا له.
    - استخدم `channels.<provider>.healthMonitor.enabled` أو `channels.<provider>.accounts.<id>.healthMonitor.enabled` لتعطيل عمليات إعادة التشغيل التلقائية لقناة أو حساب واحد دون تعطيل المراقب العام.
    - راجع [فحوصات الصحة](/ar/gateway/health) لتصحيح الأخطاء التشغيلية و[المرجع الكامل](/ar/gateway/configuration-reference#gateway) لكل الحقول.

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    امنح العملاء المحليين وقتًا أطول لإكمال مصافحة WebSocket قبل المصادقة على
    المضيفات المحملة أو منخفضة القدرة:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - القيمة الافتراضية هي `15000` ميلي ثانية.
    - ما زال `OPENCLAW_HANDSHAKE_TIMEOUT_MS` له الأولوية لتجاوزات الخدمة أو الطرفية لمرة واحدة.
    - فضّل إصلاح توقفات بدء التشغيل/حلقة الأحداث أولًا؛ فهذا المقبض مخصص للمضيفات السليمة لكنها بطيئة أثناء الإحماء.

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

    - `dmScope`: `main` (مشتركة) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: الإعدادات الافتراضية العامة لتوجيه الجلسات المرتبطة بالسلاسل (يدعم Discord أوامر `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`).
    - راجع [إدارة الجلسات](/ar/concepts/session) للاطلاع على تحديد النطاق، وروابط الهوية، وسياسة الإرسال.
    - راجع [المرجع الكامل](/ar/gateway/config-agents#session) لجميع الحقول.

  </Accordion>

  <Accordion title="تفعيل العزل">
    شغّل جلسات الوكلاء في بيئات تشغيل عزل منفصلة:

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

    ابنِ الصورة أولاً — من نسخة مصدرية شغّل `scripts/sandbox-setup.sh`، أو من تثبيت npm راجع أمر `docker build` المضمّن في [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup).

    راجع [العزل](/ar/gateway/sandboxing) للدليل الكامل و[المرجع الكامل](/ar/gateway/config-agents#agentsdefaultssandbox) لجميع الخيارات.

  </Accordion>

  <Accordion title="تفعيل الدفع المدعوم بالمرحل لإصدارات iOS الرسمية">
    يتم تكوين الدفع المدعوم بالمرحل في `openclaw.json`.

    عيّن هذا في تكوين Gateway:

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

    المكافئ في CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    ما يفعله هذا:

    - يسمح لـ Gateway بإرسال `push.test`، وتنبيهات الإيقاظ، وإيقاظات إعادة الاتصال عبر المرحل الخارجي.
    - يستخدم إذن إرسال محدد النطاق بالتسجيل يمرره تطبيق iOS المقترن. لا يحتاج Gateway إلى رمز مرحل على مستوى النشر.
    - يربط كل تسجيل مدعوم بالمرحل بهوية Gateway التي اقترن بها تطبيق iOS، بحيث لا يستطيع Gateway آخر إعادة استخدام التسجيل المخزن.
    - يبقي إصدارات iOS المحلية/اليدوية على APNs المباشر. تنطبق الإرسالات المدعومة بالمرحل فقط على الإصدارات الرسمية الموزعة التي سجلت عبر المرحل.
    - يجب أن يطابق عنوان URL الأساسي للمرحل المضمّن في إصدار iOS الرسمي/TestFlight، حتى تصل حركة التسجيل والإرسال إلى نشر المرحل نفسه.

    التدفق من البداية إلى النهاية:

    1. ثبّت إصدار iOS رسمي/TestFlight تم تجميعه باستخدام عنوان URL الأساسي نفسه للمرحل.
    2. كوّن `gateway.push.apns.relay.baseUrl` على Gateway.
    3. اقرن تطبيق iOS مع Gateway ودع جلستي العقدة والمشغّل تتصلان.
    4. يجلب تطبيق iOS هوية Gateway، ويسجل مع المرحل باستخدام App Attest بالإضافة إلى إيصال التطبيق، ثم ينشر حمولة `push.apns.register` المدعومة بالمرحل إلى Gateway المقترن.
    5. يخزن Gateway مقبض المرحل وإذن الإرسال، ثم يستخدمهما لـ `push.test`، وتنبيهات الإيقاظ، وإيقاظات إعادة الاتصال.

    ملاحظات تشغيلية:

    - إذا بدّلت تطبيق iOS إلى Gateway مختلف، فأعد توصيل التطبيق حتى يتمكن من نشر تسجيل مرحل جديد مرتبط بذلك Gateway.
    - إذا شحنت إصدار iOS جديداً يشير إلى نشر مرحل مختلف، فسيحدّث التطبيق تسجيل المرحل المخزن مؤقتاً بدلاً من إعادة استخدام أصل المرحل القديم.

    ملاحظة توافق:

    - لا يزال `OPENCLAW_APNS_RELAY_BASE_URL` و`OPENCLAW_APNS_RELAY_TIMEOUT_MS` يعملان كتجاوزات بيئة مؤقتة.
    - يبقى `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` مخرجاً تطويرياً مخصصاً لـ local loopback فقط؛ لا تحفظ عناوين URL لمرحل HTTP في التكوين.

    راجع [تطبيق iOS](/ar/platforms/ios#relay-backed-push-for-official-builds) للتدفق من البداية إلى النهاية و[تدفق المصادقة والثقة](/ar/platforms/ios#authentication-and-trust-flow) لنموذج أمان المرحل.

  </Accordion>

  <Accordion title="إعداد Heartbeat (عمليات تحقق دورية)">
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

    - `every`: سلسلة مدة (`30m`، `2h`). عيّن `0m` للتعطيل.
    - `target`: `last` | `none` | `<channel-id>` (مثلاً `discord` أو `matrix` أو `telegram` أو `whatsapp`)
    - `directPolicy`: `allow` (الافتراضي) أو `block` لأهداف Heartbeat بنمط الرسائل المباشرة
    - راجع [Heartbeat](/ar/gateway/heartbeat) للدليل الكامل.

  </Accordion>

  <Accordion title="تكوين مهام Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: حذف جلسات التشغيل المعزولة المكتملة من `sessions.json` (الافتراضي `24h`؛ عيّن `false` للتعطيل).
    - `runLog`: حذف `cron/runs/<jobId>.jsonl` حسب الحجم والأسطر المحتفظ بها.
    - راجع [مهام Cron](/ar/automation/cron-jobs) لنظرة عامة على الميزة وأمثلة CLI.

  </Accordion>

  <Accordion title="إعداد Webhook (الخطافات)">
    فعّل نقاط نهاية HTTP Webhook على Gateway:

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

    ملاحظة أمان:
    - تعامل مع كل محتوى حمولات hook/webhook كمدخلات غير موثوقة.
    - استخدم `hooks.token` مخصصاً؛ لا تعِد استخدام رمز Gateway المشترك.
    - مصادقة Hook تكون عبر الترويسة فقط (`Authorization: Bearer ...` أو `x-openclaw-token`)؛ يتم رفض رموز سلسلة الاستعلام.
    - لا يمكن أن يكون `hooks.path` هو `/`؛ أبقِ دخول Webhook على مسار فرعي مخصص مثل `/hooks`.
    - أبقِ أعلام تجاوز المحتوى غير الآمن معطلة (`hooks.gmail.allowUnsafeExternalContent`، `hooks.mappings[].allowUnsafeExternalContent`) إلا عند إجراء تصحيح أخطاء محدود النطاق بإحكام.
    - إذا فعّلت `hooks.allowRequestSessionKey`، فعيّن أيضاً `hooks.allowedSessionKeyPrefixes` لتقييد مفاتيح الجلسات التي يختارها المستدعي.
    - للوكلاء المشغّلين بواسطة الخطافات، فضّل مستويات النماذج الحديثة القوية وسياسة أدوات صارمة (مثلاً المراسلة فقط بالإضافة إلى العزل حيثما أمكن).

    راجع [المرجع الكامل](/ar/gateway/configuration-reference#hooks) لجميع خيارات التعيين وتكامل Gmail.

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

    راجع [الوكلاء المتعددون](/ar/concepts/multi-agent) و[المرجع الكامل](/ar/gateway/config-agents#multi-agent-routing) لقواعد الربط وملفات تعريف الوصول لكل وكيل.

  </Accordion>

  <Accordion title="تقسيم التكوين إلى عدة ملفات ($include)">
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
    - **مصفوفة ملفات**: تُدمج بعمق حسب الترتيب (الأحدث يغلب)
    - **المفاتيح الشقيقة**: تُدمج بعد التضمينات (تتجاوز القيم المضمّنة)
    - **التضمينات المتداخلة**: مدعومة حتى 10 مستويات عمق
    - **المسارات النسبية**: تُحل نسبة إلى الملف الذي يتضمنها
    - **كتابات OpenClaw المملوكة**: عندما تغيّر كتابة قسماً واحداً فقط على المستوى الأعلى
      مدعوماً بتضمين ملف واحد مثل `plugins: { $include: "./plugins.json5" }`،
      يحدّث OpenClaw ذلك الملف المضمّن ويترك `openclaw.json` سليماً
    - **الكتابة عبر التضمين غير المدعومة**: تفشل تضمينات الجذر، ومصفوفات التضمين، والتضمينات
      ذات التجاوزات الشقيقة بإغلاق آمن لكتابات OpenClaw المملوكة بدلاً من
      تسطيح التكوين
    - **الحصر**: يجب أن تُحل مسارات `$include` تحت الدليل الذي يحتوي
      `openclaw.json`. لمشاركة شجرة عبر أجهزة أو مستخدمين، عيّن
      `OPENCLAW_INCLUDE_ROOTS` إلى قائمة مسارات (`:` على POSIX، و`;` على Windows) من
      أدلة إضافية يمكن أن تشير إليها التضمينات. تُحل الروابط الرمزية
      ويعاد فحصها، لذلك يظل المسار الذي يقع نصياً داخل دليل تكوين لكن
      هدفه الحقيقي يخرج من كل جذر مسموح به مرفوضاً.
    - **معالجة الأخطاء**: أخطاء واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية

  </Accordion>
</AccordionGroup>

## إعادة تحميل التكوين فورياً

يراقب Gateway ملف `~/.openclaw/openclaw.json` ويطبق التغييرات تلقائياً — لا حاجة إلى إعادة تشغيل يدوية لمعظم الإعدادات.

تُعامل تعديلات الملفات المباشرة كغير موثوقة حتى تجتاز التحقق. ينتظر المراقب
حتى تهدأ عمليات الكتابة المؤقتة/إعادة التسمية من المحرر، ثم يقرأ الملف النهائي، ويرفض
التعديلات الخارجية غير الصالحة عبر استعادة آخر تكوين معروف صالح. تستخدم
كتابات التكوين المملوكة لـ OpenClaw بوابة المخطط نفسها قبل الكتابة؛ وتُرفض عمليات الاستبدال المدمرة
مثل إسقاط `gateway.mode` أو تقليص الملف بأكثر من النصف
وتُحفظ بصيغة `.rejected.*` للفحص.

إخفاقات التحقق المحلية للـ Plugin هي الاستثناء: إذا كانت كل المشكلات تحت
`plugins.entries.<id>...`، تبقي إعادة التحميل التكوين الحالي وتبلّغ عن مشكلة Plugin
بدلاً من استعادة `.last-good`.

إذا رأيت `Config auto-restored from last-known-good` أو
`config reload restored last-known-good config` في السجلات، فافحص ملف
`.clobbered.*` المطابق بجوار `openclaw.json`، وأصلح الحمولة المرفوضة، ثم شغّل
`openclaw config validate`. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-restored-last-known-good-config)
لقائمة التحقق الخاصة بالاسترداد.

### أوضاع إعادة التحميل

| الوضع                   | السلوك                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (الافتراضي) | يطبق التغييرات الآمنة فورياً. يعيد التشغيل تلقائياً للتغييرات الحرجة.           |
| **`hot`**              | يطبق التغييرات الآمنة فقط فورياً. يسجل تحذيراً عندما تكون إعادة التشغيل مطلوبة — تتولى أنت ذلك. |
| **`restart`**          | يعيد تشغيل Gateway عند أي تغيير في التكوين، آمناً كان أم لا.                                 |
| **`off`**              | يعطّل مراقبة الملفات. تدخل التغييرات حيز التنفيذ عند إعادة التشغيل اليدوية التالية.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ما يُطبّق فورياً مقابل ما يحتاج إلى إعادة تشغيل

تُطبّق معظم الحقول فورياً من دون توقف. في وضع `hybrid`، تتم معالجة التغييرات التي تتطلب إعادة تشغيل تلقائياً.

| الفئة | الحقول | هل يلزم إعادة التشغيل؟ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| القنوات | `channels.*`، `web` (WhatsApp) — كل القنوات المضمنة وقنوات Plugin | لا |
| الوكيل والنماذج | `agent`، `agents`، `models`، `routing` | لا |
| الأتمتة | `hooks`، `cron`، `agent.heartbeat` | لا |
| الجلسات والرسائل | `session`، `messages` | لا |
| الأدوات والوسائط | `tools`، `browser`، `skills`، `mcp`، `audio`، `talk` | لا |
| الواجهة ومتفرقات | `ui`، `logging`، `identity`، `bindings` | لا |
| خادم Gateway | `gateway.*` (المنفذ، الربط، المصادقة، Tailscale، TLS، HTTP) | **نعم** |
| البنية التحتية | `discovery`، `canvasHost`، `plugins` | **نعم** |

<Note>
`gateway.reload` و`gateway.remote` استثناءان — لا يؤدي تغييرهما إلى تشغيل إعادة التشغيل.
</Note>

### تخطيط إعادة التحميل

عندما تعدل ملف مصدر تتم الإشارة إليه عبر `$include`، يخطط OpenClaw
لإعادة التحميل من التخطيط المكتوب في المصدر، وليس من العرض المسطح الموجود في الذاكرة.
يبقي ذلك قرارات إعادة التحميل الساخن (التطبيق الساخن مقابل إعادة التشغيل) قابلة للتوقع حتى عندما
يوجد قسم علوي واحد في ملف مضمن خاص به مثل
`plugins: { $include: "./plugins.json5" }`. يفشل تخطيط إعادة التحميل بشكل مغلق إذا كان
تخطيط المصدر ملتبسًا.

## Config RPC (تحديثات برمجية)

بالنسبة للأدوات التي تكتب التكوين عبر واجهة API الخاصة بـ Gateway، يفضل هذا المسار:

- `config.schema.lookup` لفحص شجرة فرعية واحدة (عقدة مخطط سطحية + ملخصات
  الأبناء)
- `config.get` لجلب اللقطة الحالية مع `hash`
- `config.patch` للتحديثات الجزئية (تصحيح دمج JSON: الكائنات تندمج، و`null`
  يحذف، والمصفوفات تستبدل)
- `config.apply` فقط عندما تنوي استبدال التكوين بالكامل
- `update.run` للتحديث الذاتي الصريح مع إعادة التشغيل
- `update.status` لفحص أحدث علامة إعادة تشغيل للتحديث والتحقق من الإصدار الجاري بعد إعادة التشغيل

يجب أن تتعامل الوكلاء مع `config.schema.lookup` كنقطة البداية الأولى للحصول على
وثائق وقيود دقيقة على مستوى الحقل. استخدم [مرجع التكوين](/ar/gateway/configuration-reference)
عندما تحتاج إلى خريطة التكوين الأوسع أو القيم الافتراضية أو روابط إلى مراجع
الأنظمة الفرعية المخصصة.

<Note>
عمليات الكتابة على مستوى التحكم (`config.apply`، `config.patch`، `update.run`) تكون
محدودة المعدل إلى 3 طلبات لكل 60 ثانية لكل `deviceId+clientIp`. تُدمج طلبات
إعادة التشغيل ثم تفرض فترة تهدئة مدتها 30 ثانية بين دورات إعادة التشغيل.
`update.status` للقراءة فقط، لكنه مقيد بالمسؤول لأن علامة إعادة التشغيل يمكن أن
تتضمن ملخصات خطوات التحديث ونهايات مخرجات الأوامر.
</Note>

مثال على تصحيح جزئي:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

يقبل كل من `config.apply` و`config.patch` القيم `raw` و`baseHash` و`sessionKey`
و`note` و`restartDelayMs`. تكون `baseHash` مطلوبة لكلا الطريقتين عندما يكون
هناك تكوين موجود بالفعل.

## متغيرات البيئة

يقرأ OpenClaw متغيرات البيئة من العملية الأصلية بالإضافة إلى:

- `.env` من دليل العمل الحالي (إن وجد)
- `~/.openclaw/.env` (احتياطي عام)

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
  إذا كان مفعّلًا ولم تكن المفاتيح المتوقعة مضبوطة، يشغّل OpenClaw Shell تسجيل الدخول لديك ويستورد المفاتيح الناقصة فقط:

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
  أشر إلى متغيرات البيئة في أي قيمة نصية للتكوين باستخدام `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

القواعد:

- تطابق الأسماء الكبيرة فقط: `[A-Z_][A-Z0-9_]*`
- المتغيرات الناقصة/الفارغة ترمي خطأ عند وقت التحميل
- استخدم `$${VAR}` للهروب وإخراج قيمة حرفية
- يعمل داخل ملفات `$include`
- الاستبدال المضمن: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="مراجع الأسرار (env، file، exec)">
  للحقول التي تدعم كائنات SecretRef، يمكنك استخدام:

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

توجد تفاصيل SecretRef (بما في ذلك `secrets.providers` لـ `env`/`file`/`exec`) في [إدارة الأسرار](/ar/gateway/secrets).
تُدرج مسارات بيانات الاعتماد المدعومة في [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Accordion>

راجع [البيئة](/ar/help/environment) للاطلاع على الأولوية والمصادر بالكامل.

## المرجع الكامل

للحصول على المرجع الكامل لكل حقل على حدة، راجع **[مرجع التكوين](/ar/gateway/configuration-reference)**.

---

_ذات صلة: [أمثلة التكوين](/ar/gateway/configuration-examples) · [مرجع التكوين](/ar/gateway/configuration-reference) · [Doctor](/ar/gateway/doctor)_

## ذات صلة

- [مرجع التكوين](/ar/gateway/configuration-reference)
- [أمثلة التكوين](/ar/gateway/configuration-examples)
- [دليل تشغيل Gateway](/ar/gateway)
