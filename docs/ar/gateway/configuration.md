---
read_when:
    - إعداد OpenClaw للمرة الأولى
    - جارٍ البحث عن أنماط التكوين الشائعة
    - الانتقال إلى أقسام تكوين محددة
summary: 'نظرة عامة على التكوين: المهام الشائعة، والإعداد السريع، وروابط إلى المرجع الكامل'
title: التكوين
x-i18n:
    generated_at: "2026-05-06T07:53:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 42de21fc7e113feffe38fe1a748430f7e59e7abaf2c18ef6f388533b1aca5c0e
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw يقرأ إعدادًا اختياريًا بصيغة <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> من `~/.openclaw/openclaw.json`.
يجب أن يكون مسار الإعداد النشط ملفًا عاديًا. تخطيطات `openclaw.json` المرتبطة رمزيًا
غير مدعومة لعمليات الكتابة التي يملكها OpenClaw؛ فقد تستبدل كتابة ذرية
المسار بدلًا من الحفاظ على الرابط الرمزي. إذا أبقيت الإعداد خارج
دليل الحالة الافتراضي، فوجّه `OPENCLAW_CONFIG_PATH` مباشرة إلى الملف الحقيقي.

إذا كان الملف مفقودًا، يستخدم OpenClaw الإعدادات الافتراضية الآمنة. من الأسباب الشائعة لإضافة إعداد:

- ربط القنوات والتحكم بمن يمكنه مراسلة البوت
- تعيين النماذج والأدوات والعزل أو الأتمتة (cron، الخطافات)
- ضبط الجلسات والوسائط والشبكات أو واجهة المستخدم

راجع [المرجع الكامل](/ar/gateway/configuration-reference) لكل حقل متاح.

ينبغي للوكلاء والأتمتة استخدام `config.schema.lookup` للحصول على
توثيق دقيق على مستوى الحقل قبل تعديل الإعداد. استخدم هذه الصفحة للإرشادات الموجهة للمهام و
[مرجع الإعداد](/ar/gateway/configuration-reference) لخريطة الحقول الأوسع
والإعدادات الافتراضية.

<Tip>
**هل أنت جديد على الإعداد؟** ابدأ بـ `openclaw onboard` للإعداد التفاعلي، أو اطّلع على دليل [أمثلة الإعداد](/ar/gateway/configuration-examples) للحصول على إعدادات كاملة قابلة للنسخ واللصق.
</Tip>

## إعداد بسيط

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
    افتح [http://127.0.0.1:18789](http://127.0.0.1:18789) واستخدم تبويب **الإعداد**.
    تعرض واجهة التحكم نموذجًا من مخطط الإعداد الحي، بما في ذلك بيانات وصفية لتوثيق الحقول
    `title` / `description` إضافة إلى مخططات Plugin والقنوات عند
    توفرها، مع محرر **Raw JSON** كمخرج بديل. لواجهات التعمق
    والأدوات الأخرى، يوفّر Gateway أيضًا `config.schema.lookup`
    لجلب عقدة مخطط واحدة محددة بالمسار مع ملخصات الأبناء المباشرين.
  </Tab>
  <Tab title="Direct edit">
    عدّل `~/.openclaw/openclaw.json` مباشرة. يراقب Gateway الملف ويطبق التغييرات تلقائيًا (راجع [إعادة التحميل الساخنة](#config-hot-reload)).
  </Tab>
</Tabs>

## التحقق الصارم

<Warning>
لا يقبل OpenClaw إلا الإعدادات التي تطابق المخطط بالكامل. المفاتيح غير المعروفة أو الأنواع المشوهة أو القيم غير الصالحة تجعل Gateway **يرفض بدء التشغيل**. الاستثناء الوحيد على مستوى الجذر هو `$schema` (سلسلة نصية)، لكي تتمكن المحررات من إرفاق بيانات JSON Schema الوصفية.
</Warning>

يطبع `openclaw config schema` مخطط JSON Schema القياسي المستخدم بواسطة واجهة التحكم
والتحقق. يجلب `config.schema.lookup` عقدة واحدة محددة بالمسار مع
ملخصات الأبناء لأدوات التعمق. تنتقل بيانات توثيق الحقول الوصفية `title`/`description`
عبر الكائنات المتداخلة، والبدل (`*`)، وعنصر المصفوفة (`[]`)، وفروع `anyOf`/
`oneOf`/`allOf`. تُدمج مخططات Plugin والقنوات وقت التشغيل عندما
يتم تحميل سجل البيان.

عند فشل التحقق:

- لا يقلع Gateway
- تعمل أوامر التشخيص فقط (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- شغّل `openclaw doctor` لمعرفة المشكلات الدقيقة
- شغّل `openclaw doctor --fix` (أو `--yes`) لتطبيق الإصلاحات

يحتفظ Gateway بنسخة موثوقة من آخر إعداد صالح معروف بعد كل بدء تشغيل ناجح،
لكن بدء التشغيل وإعادة التحميل الساخنة لا يستعيدانها تلقائيًا. إذا فشل `openclaw.json`
في التحقق (بما في ذلك التحقق المحلي لـ Plugin)، يفشل بدء تشغيل Gateway أو
يتم تخطي إعادة التحميل ويحتفظ وقت التشغيل الحالي بآخر إعداد مقبول.
شغّل `openclaw doctor --fix` (أو `--yes`) لإصلاح إعدادات ذات بادئة/مطموعة أو
استعادة آخر نسخة صالحة معروفة. يتم تخطي الترقية إلى آخر نسخة صالحة معروفة عندما يحتوي
مرشح على عناصر نائبة لأسرار منقحة مثل `***`.

## مهام شائعة

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    لكل قناة قسم إعداد خاص بها ضمن `channels.<provider>`. راجع صفحة القناة المخصصة لخطوات الإعداد:

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

    - يعرّف `agents.defaults.models` كتالوج النماذج ويعمل كقائمة سماح لـ `/model`.
    - استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة مدخلات قائمة السماح دون إزالة النماذج الموجودة. يتم رفض الاستبدالات العادية التي قد تزيل مدخلات ما لم تمرر `--replace`.
    - تستخدم مراجع النماذج صيغة `provider/model` (مثل `anthropic/claude-opus-4-6`).
    - يتحكم `agents.defaults.imageMaxDimensionPx` في تصغير صور النص المنسوخ/الأداة (الافتراضي `1200`)؛ عادةً ما تقلل القيم الأدنى استخدام رموز الرؤية في التشغيلات كثيرة لقطات الشاشة.
    - راجع [Models CLI](/ar/concepts/models) لتبديل النماذج في الدردشة و[تجاوز فشل النموذج](/ar/concepts/model-failover) لتدوير المصادقة وسلوك البدائل.
    - للموفرين المخصصين/المستضافين ذاتيًا، راجع [الموفرون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls) في المرجع.

  </Accordion>

  <Accordion title="Control who can message the bot">
    يتم التحكم في الوصول إلى الرسائل المباشرة لكل قناة عبر `dmPolicy`:

    - `"pairing"` (افتراضي): يحصل المرسلون غير المعروفين على رمز إقران لمرة واحدة للموافقة
    - `"allowlist"`: المرسلون الموجودون في `allowFrom` فقط (أو مخزن السماح المقترن)
    - `"open"`: السماح بكل الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`)
    - `"disabled"`: تجاهل كل الرسائل المباشرة

    للمجموعات، استخدم `groupPolicy` + `groupAllowFrom` أو قوائم السماح الخاصة بالقنوات.

    راجع [المرجع الكامل](/ar/gateway/config-channels#dm-and-group-access) للحصول على تفاصيل كل قناة.

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    تتطلب رسائل المجموعات افتراضيًا **ذكرًا**. اضبط أنماط التشغيل لكل وكيل، وأبقِ ردود الغرف المرئية على مسار أداة الرسائل الافتراضي ما لم تكن تريد عمدًا الردود النهائية التلقائية القديمة:

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

    - **إشارات البيانات الوصفية**: إشارات @ الأصلية (ذكر WhatsApp بالضغط، Telegram @bot، إلخ)
    - **أنماط النص**: أنماط regex آمنة في `mentionPatterns`
    - **الردود المرئية**: يمكن لـ `messages.visibleReplies` فرض الإرسال عبر أداة الرسائل عالميًا؛ ويتجاوز `messages.groupChat.visibleReplies` ذلك للمجموعات/القنوات.
    - راجع [المرجع الكامل](/ar/gateway/config-channels#group-chat-mention-gating) لأوضاع الرد المرئي، والتجاوزات لكل قناة، ووضع الدردشة الذاتية.

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

    - احذف `agents.defaults.skills` للسماح غير المقيد بالـ Skills افتراضيًا.
    - احذف `agents.list[].skills` لوراثة الإعدادات الافتراضية.
    - اضبط `agents.list[].skills: []` لعدم وجود Skills.
    - راجع [Skills](/ar/tools/skills)، و[إعداد Skills](/ar/tools/skills-config)، و
      [مرجع الإعداد](/ar/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
    تحكم في مدى شدة إعادة تشغيل Gateway للقنوات التي تبدو خاملة:

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

    - اضبط `gateway.channelHealthCheckMinutes: 0` لتعطيل إعادات تشغيل مراقبة الصحة عالميًا.
    - ينبغي أن تكون `channelStaleEventThresholdMinutes` أكبر من أو مساوية لفاصل الفحص.
    - استخدم `channels.<provider>.healthMonitor.enabled` أو `channels.<provider>.accounts.<id>.healthMonitor.enabled` لتعطيل إعادة التشغيل التلقائي لقناة أو حساب واحد دون تعطيل المراقب العام.
    - راجع [فحوصات الصحة](/ar/gateway/health) لتصحيح التشغيل، و[المرجع الكامل](/ar/gateway/configuration-reference#gateway) لكل الحقول.

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

    - الافتراضي هو `15000` مللي ثانية.
    - لا يزال `OPENCLAW_HANDSHAKE_TIMEOUT_MS` له الأولوية لتجاوزات الخدمة أو الصدفة لمرة واحدة.
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
    - `threadBindings`: الإعدادات الافتراضية العامة لتوجيه الجلسات المرتبطة بالخيوط (يدعم Discord أوامر `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`).
    - راجع [إدارة الجلسات](/ar/concepts/session) للنطاق، وروابط الهوية، وسياسة الإرسال.
    - راجع [المرجع الكامل](/ar/gateway/config-agents#session) لكل الحقول.

  </Accordion>

  <Accordion title="تفعيل العزل">
    شغّل جلسات الوكيل في بيئات تشغيل معزولة:

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

    ابنِ الصورة أولًا - من نسخة مصدرية محلية شغّل `scripts/sandbox-setup.sh`، أو من تثبيت npm راجع أمر `docker build` المضمّن في [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup).

    راجع [العزل](/ar/gateway/sandboxing) للدليل الكامل و[المرجع الكامل](/ar/gateway/config-agents#agentsdefaultssandbox) لكل الخيارات.

  </Accordion>

  <Accordion title="تفعيل الدفع المدعوم بالترحيل للإصدارات الرسمية من iOS">
    يُضبط الدفع المدعوم بالترحيل في `openclaw.json`.

    اضبط هذا في إعدادات Gateway:

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

    - يتيح لـ Gateway إرسال `push.test`، وتنبيهات الإيقاظ، وإيقاظات إعادة الاتصال عبر المرحّل الخارجي.
    - يستخدم منحة إرسال بنطاق التسجيل يمررها تطبيق iOS المقترن. لا يحتاج Gateway إلى رمز ترحيل شامل للنشر.
    - يربط كل تسجيل مدعوم بالترحيل بهوية Gateway التي اقترن بها تطبيق iOS، بحيث لا يستطيع Gateway آخر إعادة استخدام التسجيل المخزّن.
    - يبقي إصدارات iOS المحلية/اليدوية على APNs المباشر. تنطبق الإرسالات المدعومة بالترحيل فقط على الإصدارات الرسمية الموزعة التي سجلت عبر المرحّل.
    - يجب أن يطابق عنوان URL الأساسي للمرحّل المضمّن في إصدار iOS الرسمي/TestFlight، حتى تصل حركة التسجيل والإرسال إلى نشر المرحّل نفسه.

    التدفق من البداية إلى النهاية:

    1. ثبّت إصدار iOS رسميًا/TestFlight تم تجميعه باستخدام عنوان URL الأساسي نفسه للمرحّل.
    2. اضبط `gateway.push.apns.relay.baseUrl` على Gateway.
    3. اقترن تطبيق iOS بـ Gateway ودع جلستي Node والمشغّل تتصلان.
    4. يجلب تطبيق iOS هوية Gateway، ويسجل لدى المرحّل باستخدام App Attest مع إيصال التطبيق، ثم ينشر حمولة `push.apns.register` المدعومة بالترحيل إلى Gateway المقترن.
    5. يخزّن Gateway معرّف المرحّل ومنحة الإرسال، ثم يستخدمهما لـ `push.test`، وتنبيهات الإيقاظ، وإيقاظات إعادة الاتصال.

    ملاحظات تشغيلية:

    - إذا بدّلت تطبيق iOS إلى Gateway مختلف، فأعد توصيل التطبيق حتى يتمكن من نشر تسجيل ترحيل جديد مرتبط بذلك Gateway.
    - إذا أصدرت إصدار iOS جديدًا يشير إلى نشر ترحيل مختلف، يحدّث التطبيق تسجيل الترحيل المخزّن مؤقتًا بدلًا من إعادة استخدام أصل الترحيل القديم.

    ملاحظة توافق:

    - لا يزال `OPENCLAW_APNS_RELAY_BASE_URL` و`OPENCLAW_APNS_RELAY_TIMEOUT_MS` يعملان كتجاوزات بيئية مؤقتة.
    - يبقى `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` منفذًا للتطوير على local loopback فقط؛ لا تحفظ عناوين URL لمرحّل HTTP في الإعدادات.

    راجع [تطبيق iOS](/ar/platforms/ios#relay-backed-push-for-official-builds) للتدفق من البداية إلى النهاية و[تدفق المصادقة والثقة](/ar/platforms/ios#authentication-and-trust-flow) لنموذج أمان المرحّل.

  </Accordion>

  <Accordion title="إعداد Heartbeat (تسجيلات وصول دورية)">
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
    - `target`: `last` | `none` | `<channel-id>` (على سبيل المثال `discord` أو `matrix` أو `telegram` أو `whatsapp`)
    - `directPolicy`: `allow` (افتراضي) أو `block` لأهداف Heartbeat بنمط الرسائل المباشرة
    - راجع [Heartbeat](/ar/gateway/heartbeat) للدليل الكامل.

  </Accordion>

  <Accordion title="ضبط مهام Cron">
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

    - `sessionRetention`: تقليم جلسات التشغيل المعزولة المكتملة من `sessions.json` (الافتراضي `24h`؛ اضبط `false` للتعطيل).
    - `runLog`: تقليم `cron/runs/<jobId>.jsonl` حسب الحجم والأسطر المحتفظ بها.
    - راجع [مهام Cron](/ar/automation/cron-jobs) لنظرة عامة على الميزة وأمثلة CLI.

  </Accordion>

  <Accordion title="إعداد Webhook (hooks)">
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
    - استخدم `hooks.token` مخصصًا؛ لا تعد استخدام رمز Gateway المشترك.
    - مصادقة Hook عبر الرؤوس فقط (`Authorization: Bearer ...` أو `x-openclaw-token`)؛ تُرفض رموز سلاسل الاستعلام.
    - لا يمكن أن يكون `hooks.path` هو `/`؛ أبقِ دخول Webhook على مسار فرعي مخصص مثل `/hooks`.
    - أبقِ علامات تجاوز المحتوى غير الآمن معطلة (`hooks.gmail.allowUnsafeExternalContent`، `hooks.mappings[].allowUnsafeExternalContent`) إلا عند إجراء تصحيح أخطاء محدود النطاق بدقة.
    - إذا فعّلت `hooks.allowRequestSessionKey`، فاضبط أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد مفاتيح الجلسات التي يختارها المستدعي.
    - للوكلاء المعتمدين على hook، فضّل طبقات نماذج حديثة قوية وسياسة أدوات صارمة (على سبيل المثال المراسلة فقط مع العزل حيثما أمكن).

    راجع [المرجع الكامل](/ar/gateway/configuration-reference#hooks) لكل خيارات التعيين وتكامل Gmail.

  </Accordion>

  <Accordion title="ضبط التوجيه متعدد الوكلاء">
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

  <Accordion title="تقسيم الإعدادات إلى عدة ملفات ($include)">
    استخدم `$include` لتنظيم الإعدادات الكبيرة:

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
    - **مصفوفة ملفات**: تُدمج دمجًا عميقًا بالترتيب (اللاحق يفوز)
    - **مفاتيح شقيقة**: تُدمج بعد عمليات التضمين (تتجاوز القيم المضمنة)
    - **تضمينات متداخلة**: مدعومة حتى عمق 10 مستويات
    - **مسارات نسبية**: تُحل نسبةً إلى الملف الذي يتضمنها
    - **كتابات مملوكة لـ OpenClaw**: عندما تغيّر كتابة قسمًا واحدًا فقط من المستوى الأعلى
      مدعومًا بتضمين ملف واحد مثل `plugins: { $include: "./plugins.json5" }`،
      يحدّث OpenClaw ذلك الملف المضمن ويترك `openclaw.json` كما هو
    - **الكتابة عبر التضمين غير المدعومة**: تفشل تضمينات الجذر ومصفوفات التضمين والتضمينات
      ذات التجاوزات الشقيقة بإغلاق آمن لكتابات OpenClaw بدلًا من
      تسطيح الإعدادات
    - **الحصر**: يجب أن تُحل مسارات `$include` تحت الدليل الذي يحتوي على
      `openclaw.json`. لمشاركة شجرة عبر أجهزة أو مستخدمين، اضبط
      `OPENCLAW_INCLUDE_ROOTS` على قائمة مسارات (`:` على POSIX، و`;` على Windows) من
      أدلة إضافية قد تشير إليها التضمينات. تُحل الروابط الرمزية
      وتُفحص مرة أخرى، لذلك يظل المسار الذي يوجد لفظيًا في دليل إعدادات لكن
      هدفه الحقيقي يخرج من كل جذر مسموح مرفوضًا.
    - **معالجة الأخطاء**: أخطاء واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية

  </Accordion>
</AccordionGroup>

## إعادة التحميل الساخن للإعدادات

يراقب Gateway الملف `~/.openclaw/openclaw.json` ويطبّق التغييرات تلقائيًا - لا حاجة إلى إعادة تشغيل يدوية لمعظم الإعدادات.

تُعامل تعديلات الملفات المباشرة كغير موثوقة حتى تجتاز التحقق. ينتظر المراقب
حتى تهدأ عمليات الكتابة المؤقتة/إعادة التسمية من المحرر، ويقرأ الملف النهائي، ويرفض
التعديلات الخارجية غير الصالحة دون إعادة كتابة `openclaw.json`. تستخدم كتابات الإعدادات
المملوكة لـ OpenClaw بوابة المخطط نفسها قبل الكتابة؛ وتُرفض عمليات الاستبدال المدمرة مثل
إسقاط `gateway.mode` أو تقليص الملف بأكثر من النصف، وتُحفظ
كـ `.rejected.*` للفحص.

إذا رأيت `config reload skipped (invalid config)` أو أبلغ بدء التشغيل عن `Invalid
config`، فافحص الإعدادات، وشغّل `openclaw config validate`، ثم شغّل `openclaw
doctor --fix` للإصلاح. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-rejected-invalid-config)
لقائمة التحقق.

### أوضاع إعادة التحميل

| الوضع                   | السلوك                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (افتراضي) | يطبّق التغييرات الآمنة فورًا بشكل ساخن. يعيد التشغيل تلقائيًا للتغييرات الحرجة.           |
| **`hot`**              | يطبّق التغييرات الآمنة فقط بشكل ساخن. يسجّل تحذيرًا عند الحاجة إلى إعادة تشغيل - تتولى أنت ذلك. |
| **`restart`**          | يعيد تشغيل Gateway عند أي تغيير في الإعدادات، سواء كان آمنًا أم لا.                                 |
| **`off`**              | يعطّل مراقبة الملفات. تسري التغييرات عند إعادة التشغيل اليدوية التالية.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ما يُطبّق ساخنًا مقابل ما يحتاج إلى إعادة تشغيل

تُطبّق معظم الحقول ساخنًا دون توقف. في وضع `hybrid`، تُعالج التغييرات التي تتطلب إعادة تشغيل تلقائيًا.

| الفئة            | الحقول                                                            | هل يلزم إعادة تشغيل؟ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| القنوات            | `channels.*`، `web` (WhatsApp) - كل القنوات المدمجة وقنوات Plugin | لا              |
| الوكيل والنماذج      | `agent`، `agents`، `models`، `routing`                            | لا              |
| الأتمتة          | `hooks`، `cron`، `agent.heartbeat`                                | لا              |
| الجلسات والرسائل | `session`، `messages`                                             | لا              |
| الأدوات والوسائط       | `tools`، `browser`، `skills`، `mcp`، `audio`، `talk`              | لا              |
| واجهة المستخدم ومتفرقات           | `ui`، `logging`، `identity`، `bindings`                           | لا              |
| خادم Gateway      | `gateway.*` (المنفذ، الربط، المصادقة، tailscale، TLS، HTTP)              | **نعم**         |
| البنية التحتية      | `discovery`، `canvasHost`، `plugins`                              | **نعم**         |

<Note>
`gateway.reload` و`gateway.remote` استثناءان - تغييرهما **لا** يؤدي إلى إعادة تشغيل.
</Note>

### تخطيط إعادة التحميل

عند تعديل ملف مصدر مشار إليه عبر `$include`، يخطط OpenClaw لإعادة التحميل من تخطيط المصدر كما كُتب، وليس من العرض المسطّح في الذاكرة. يحافظ ذلك على قابلية التنبؤ بقرارات إعادة التحميل الفوري (التطبيق الفوري مقابل إعادة التشغيل)، حتى عندما يعيش قسم علوي واحد في ملف مُضمّن مستقل مثل `plugins: { $include: "./plugins.json5" }`. يفشل تخطيط إعادة التحميل على نحو مغلق إذا كان تخطيط المصدر ملتبسًا.

## استدعاءات RPC للتكوين (تحديثات برمجية)

بالنسبة للأدوات التي تكتب التكوين عبر واجهة API الخاصة بالـ Gateway، يُفضّل هذا التدفق:

- `config.schema.lookup` لفحص شجرة فرعية واحدة (عقدة مخطط سطحية + ملخصات الأبناء)
- `config.get` لجلب اللقطة الحالية مع `hash`
- `config.patch` للتحديثات الجزئية (تصحيح دمج JSON: تُدمج الكائنات، ويحذف `null`، وتستبدل المصفوفات)
- `config.apply` فقط عندما تنوي استبدال التكوين بالكامل
- `update.run` للتحديث الذاتي الصريح مع إعادة التشغيل؛ ضمّن `continuationMessage` عندما ينبغي لجلسة ما بعد إعادة التشغيل تشغيل دورة متابعة واحدة
- `update.status` لفحص أحدث مؤشر إعادة تشغيل للتحديث والتحقق من الإصدار الجاري بعد إعادة التشغيل

ينبغي للوكلاء التعامل مع `config.schema.lookup` كنقطة التوقف الأولى للحصول على الوثائق والقيود الدقيقة على مستوى الحقول. استخدم [مرجع التكوين](/ar/gateway/configuration-reference) عندما يحتاجون إلى خريطة التكوين الأوسع، أو القيم الافتراضية، أو الروابط إلى مراجع الأنظمة الفرعية المخصصة.

<Note>
عمليات الكتابة في مستوى التحكم (`config.apply`، `config.patch`، `update.run`) محدودة المعدل إلى 3 طلبات كل 60 ثانية لكل `deviceId+clientIp`. تُدمج طلبات إعادة التشغيل ثم يُفرض بينها تبريد مدته 30 ثانية بين دورات إعادة التشغيل. `update.status` للقراءة فقط، لكنه ضمن نطاق الإدارة لأن مؤشر إعادة التشغيل يمكن أن يتضمن ملخصات خطوات التحديث وذيول مخرجات الأوامر.
</Note>

مثال على تصحيح جزئي:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

يقبل كل من `config.apply` و`config.patch` القيم `raw` و`baseHash` و`sessionKey` و`note` و`restartDelayMs`. تكون `baseHash` مطلوبة لكلتا الطريقتين عندما يكون هناك تكوين موجود بالفعل.

## متغيرات البيئة

يقرأ OpenClaw متغيرات البيئة من العملية الأصلية بالإضافة إلى:

- `.env` من دليل العمل الحالي (إن وُجد)
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

<Accordion title="استيراد بيئة الصدفة (اختياري)">
  إذا كان مفعّلًا ولم تكن المفاتيح المتوقعة معيّنة، يشغّل OpenClaw صدفة تسجيل الدخول لديك ويستورد المفاتيح الناقصة فقط:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

ما يعادله كمتغير بيئة: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="استبدال متغيرات البيئة في قيم التكوين">
  ارجع إلى متغيرات البيئة في أي قيمة نصية في التكوين باستخدام `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

القواعد:

- تُطابق الأسماء ذات الأحرف الكبيرة فقط: `[A-Z_][A-Z0-9_]*`
- المتغيرات الناقصة/الفارغة ترمي خطأ عند وقت التحميل
- استخدم `$${VAR}` للإخراج الحرفي
- يعمل داخل ملفات `$include`
- الاستبدال المضمّن: `"${BASE}/v1"` → `"https://api.example.com/v1"`

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

تفاصيل SecretRef (بما في ذلك `secrets.providers` لـ `env`/`file`/`exec`) موجودة في [إدارة الأسرار](/ar/gateway/secrets). مسارات بيانات الاعتماد المدعومة مذكورة في [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Accordion>

راجع [البيئة](/ar/help/environment) للاطلاع على الأولوية والمصادر بالكامل.

## المرجع الكامل

للاطلاع على المرجع الكامل حقلًا بحقل، راجع **[مرجع التكوين](/ar/gateway/configuration-reference)**.

---

_ذو صلة: [أمثلة التكوين](/ar/gateway/configuration-examples) · [مرجع التكوين](/ar/gateway/configuration-reference) · [Doctor](/ar/gateway/doctor)_

## ذو صلة

- [مرجع التكوين](/ar/gateway/configuration-reference)
- [أمثلة التكوين](/ar/gateway/configuration-examples)
- [دليل تشغيل Gateway](/ar/gateway)
