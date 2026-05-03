---
read_when:
    - إعداد OpenClaw لأول مرة
    - البحث عن أنماط التهيئة الشائعة
    - الانتقال إلى أقسام محددة في التكوين
summary: 'نظرة عامة على التكوين: المهام الشائعة، والإعداد السريع، وروابط إلى المرجع الكامل'
title: التكوين
x-i18n:
    generated_at: "2026-05-03T21:33:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: e27ef442d6375d8c22715f20194fb9ce50130204377c9ba4652c2949de28967c
    source_path: gateway/configuration.md
    workflow: 16
---

يقرأ OpenClaw تكوينًا اختياريًا بصيغة <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> من `~/.openclaw/openclaw.json`.
يجب أن يكون مسار التكوين النشط ملفًا عاديًا. لا تُدعم تخطيطات `openclaw.json`
المرتبطة رمزيًا لعمليات الكتابة التي يملكها OpenClaw؛ فقد تستبدل الكتابة الذرية
المسار بدلًا من الحفاظ على الرابط الرمزي. إذا احتفظت بالتكوين خارج دليل الحالة
الافتراضي، فوجّه `OPENCLAW_CONFIG_PATH` مباشرةً إلى الملف الحقيقي.

إذا كان الملف مفقودًا، يستخدم OpenClaw إعدادات افتراضية آمنة. من الأسباب الشائعة لإضافة تكوين:

- ربط القنوات والتحكم في من يمكنه مراسلة الروبوت
- ضبط النماذج والأدوات والعزل أو الأتمتة (cron، الخطافات)
- ضبط الجلسات والوسائط والشبكات أو واجهة المستخدم

راجع [المرجع الكامل](/ar/gateway/configuration-reference) لكل حقل متاح.

يجب أن تستخدم الوكلاء والأتمتة `config.schema.lookup` للحصول على وثائق دقيقة
على مستوى الحقل قبل تعديل التكوين. استخدم هذه الصفحة للإرشادات الموجهة للمهام و
[مرجع التكوين](/ar/gateway/configuration-reference) لخريطة الحقول الأوسع
والإعدادات الافتراضية.

<Tip>
**هل أنت جديد على التكوين؟** ابدأ بـ `openclaw onboard` للإعداد التفاعلي، أو اطّلع على دليل [أمثلة التكوين](/ar/gateway/configuration-examples) للحصول على تكوينات كاملة قابلة للنسخ واللصق.
</Tip>

## الحد الأدنى للتكوين

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
    تعرض واجهة التحكم نموذجًا من مخطط التكوين الحي، بما في ذلك بيانات تعريف وثائق
    الحقلين `title` / `description` بالإضافة إلى مخططات Plugin والقنوات عند
    توفرها، مع محرر **Raw JSON** كمخرج احتياطي. لواجهات المستخدم التفصيلية
    والأدوات الأخرى، يوفّر Gateway أيضًا `config.schema.lookup` لجلب
    عقدة مخطط واحدة محددة بالمسار مع ملخصات الأبناء المباشرين.
  </Tab>
  <Tab title="Direct edit">
    عدّل `~/.openclaw/openclaw.json` مباشرةً. يراقب Gateway الملف ويطبق التغييرات تلقائيًا (راجع [إعادة التحميل الساخنة](#config-hot-reload)).
  </Tab>
</Tabs>

## التحقق الصارم

<Warning>
لا يقبل OpenClaw إلا التكوينات التي تطابق المخطط بالكامل. تتسبب المفاتيح غير المعروفة أو الأنواع المشوهة أو القيم غير الصالحة في أن **يرفض Gateway البدء**. الاستثناء الوحيد على مستوى الجذر هو `$schema` (سلسلة نصية)، بحيث يمكن للمحررات إرفاق بيانات تعريف JSON Schema.
</Warning>

يطبع `openclaw config schema` مخطط JSON Schema المعياري المستخدم بواسطة واجهة التحكم
والتحقق. يجلب `config.schema.lookup` عقدة واحدة محددة بالمسار مع
ملخصات الأبناء لأدوات التنقل التفصيلي. تنتقل بيانات تعريف وثائق الحقول `title`/`description`
عبر الكائنات المتداخلة، والفروع ذات حرف البدل (`*`)، وعنصر المصفوفة (`[]`)، و
`anyOf`/
`oneOf`/`allOf`. تُدمج مخططات Plugin والقنوات وقت التشغيل عندما يتم تحميل
سجل البيان.

عند فشل التحقق:

- لا يقلع Gateway
- تعمل أوامر التشخيص فقط (`openclaw doctor`، `openclaw logs`، `openclaw health`، `openclaw status`)
- شغّل `openclaw doctor` لرؤية المشكلات الدقيقة
- شغّل `openclaw doctor --fix` (أو `--yes`) لتطبيق الإصلاحات

يحتفظ Gateway بنسخة موثوقة لآخر تكوين صالح معروف بعد كل بدء ناجح،
لكن بدء التشغيل وإعادة التحميل الساخنة لا يستعيدانها تلقائيًا. إذا فشل `openclaw.json`
في التحقق (بما في ذلك التحقق المحلي للـ Plugin)، يفشل بدء Gateway أو
يتم تخطي إعادة التحميل ويحتفظ وقت التشغيل الحالي بآخر تكوين مقبول.
شغّل `openclaw doctor --fix` (أو `--yes`) لإصلاح التكوين ذي البادئات/المطموس أو
استعادة نسخة آخر تكوين صالح معروف. يتم تخطي الترقية إلى آخر تكوين صالح معروف عندما يحتوي
مرشح على عناصر نائبة لأسرار منقحة مثل `***`.

## مهام شائعة

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    لكل قناة قسم تكوين خاص بها ضمن `channels.<provider>`. راجع صفحة القناة المخصصة لخطوات الإعداد:

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

    - يعرّف `agents.defaults.models` كتالوج النماذج ويعمل كقائمة سماح لـ `/model`.
    - استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات إلى قائمة السماح دون إزالة النماذج الموجودة. تُرفض الاستبدالات العادية التي قد تزيل إدخالات ما لم تمرر `--replace`.
    - تستخدم مراجع النماذج تنسيق `provider/model` (مثل `anthropic/claude-opus-4-6`).
    - يتحكم `agents.defaults.imageMaxDimensionPx` في تصغير صور النصوص/الأدوات (الافتراضي `1200`)؛ تقلل القيم المنخفضة عادةً استخدام رموز الرؤية في التشغيلات كثيفة لقطات الشاشة.
    - راجع [CLI النماذج](/ar/concepts/models) لتبديل النماذج في الدردشة و[تجاوز فشل النموذج](/ar/concepts/model-failover) لدوران المصادقة وسلوك البدائل.
    - للموفرين المخصصين/المستضافين ذاتيًا، راجع [الموفرون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls) في المرجع.

  </Accordion>

  <Accordion title="Control who can message the bot">
    يتم التحكم في وصول الرسائل المباشرة لكل قناة عبر `dmPolicy`:

    - `"pairing"` (افتراضي): يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة للموافقة
    - `"allowlist"`: المرسلون الموجودون في `allowFrom` فقط (أو مخزن السماح المقترن)
    - `"open"`: السماح بكل الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`)
    - `"disabled"`: تجاهل كل الرسائل المباشرة

    للمجموعات، استخدم `groupPolicy` + `groupAllowFrom` أو قوائم السماح الخاصة بالقناة.

    راجع [المرجع الكامل](/ar/gateway/config-channels#dm-and-group-access) للاطلاع على التفاصيل الخاصة بكل قناة.

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    تتطلب رسائل المجموعات افتراضيًا **ذكرًا**. اضبط أنماط التشغيل لكل وكيل، وأبقِ ردود الغرفة المرئية على مسار أداة الرسائل الافتراضي ما لم تكن تريد عمدًا الردود النهائية التلقائية القديمة:

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

    - **إشارات البيانات الوصفية**: إشارات @ الأصلية (ذكر بالنقر في WhatsApp، و@bot في Telegram، وما إلى ذلك)
    - **أنماط النص**: أنماط regex آمنة في `mentionPatterns`
    - **الردود المرئية**: يمكن لـ `messages.visibleReplies` فرض الإرسال عبر أداة الرسائل عمومًا؛ ويتجاوز `messages.groupChat.visibleReplies` ذلك للمجموعات/القنوات.
    - راجع [المرجع الكامل](/ar/gateway/config-channels#group-chat-mention-gating) لأوضاع الرد المرئي، والتجاوزات لكل قناة، ووضع الدردشة الذاتية.

  </Accordion>

  <Accordion title="Restrict skills per agent">
    استخدم `agents.defaults.skills` كخط أساس مشترك، ثم تجاوز وكلاء محددين
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
    - عيّن `agents.list[].skills: []` لعدم إتاحة أي Skills.
    - راجع [Skills](/ar/tools/skills)، و[تكوين Skills](/ar/tools/skills-config)، و
      [مرجع التكوين](/ar/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
    تحكم في مدى قوة إعادة تشغيل gateway للقنوات التي تبدو قديمة:

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

    - عيّن `gateway.channelHealthCheckMinutes: 0` لتعطيل عمليات إعادة التشغيل الخاصة بمراقبة الصحة عمومًا.
    - يجب أن يكون `channelStaleEventThresholdMinutes` أكبر من أو مساويًا لفاصل الفحص.
    - استخدم `channels.<provider>.healthMonitor.enabled` أو `channels.<provider>.accounts.<id>.healthMonitor.enabled` لتعطيل عمليات إعادة التشغيل التلقائية لقناة واحدة أو حساب واحد دون تعطيل المراقب العام.
    - راجع [فحوصات الصحة](/ar/gateway/health) لتصحيح التشغيل، و[المرجع الكامل](/ar/gateway/configuration-reference#gateway) لكل الحقول.

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

    - القيمة الافتراضية هي `15000` مللي ثانية.
    - لا يزال `OPENCLAW_HANDSHAKE_TIMEOUT_MS` له الأسبقية لتجاوزات الخدمة أو الصدفة لمرة واحدة.
    - فضّل إصلاح توقفات بدء التشغيل/حلقة الأحداث أولًا؛ هذا المقبض مخصص للمضيفات السليمة لكنها بطيئة أثناء الإحماء.

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
    - `threadBindings`: الإعدادات الافتراضية العامة لتوجيه الجلسات المرتبطة بالخيوط (يدعم Discord الأوامر `/focus`، و`/unfocus`، و`/agents`، و`/session idle`، و`/session max-age`).
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

    ابنِ الصورة أولًا — من نسخة مصدرية محلية شغّل `scripts/sandbox-setup.sh`، أو من تثبيت npm راجع أمر `docker build` المضمّن في [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup).

    راجع [العزل](/ar/gateway/sandboxing) للدليل الكامل و[المرجع الكامل](/ar/gateway/config-agents#agentsdefaultssandbox) لكل الخيارات.

  </Accordion>

  <Accordion title="تفعيل الدفع المدعوم بالترحيل لإصدارات iOS الرسمية">
    يتم تكوين الدفع المدعوم بالترحيل في `openclaw.json`.

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

    - يسمح لـ Gateway بإرسال `push.test`، وتنبيهات الإيقاظ، وإيقاظات إعادة الاتصال عبر المرحّل الخارجي.
    - يستخدم منحة إرسال محددة بنطاق التسجيل يمررها تطبيق iOS المقترن. لا يحتاج Gateway إلى رمز ترحيل على مستوى النشر.
    - يربط كل تسجيل مدعوم بالترحيل بهوية Gateway التي اقترن بها تطبيق iOS، بحيث لا يمكن لـ Gateway آخر إعادة استخدام التسجيل المخزن.
    - يُبقي إصدارات iOS المحلية/اليدوية على APNs المباشر. لا تنطبق الإرسالات المدعومة بالترحيل إلا على الإصدارات الرسمية الموزعة التي سجلت عبر المرحّل.
    - يجب أن يطابق عنوان URL الأساسي للمرحّل المضمّن في إصدار iOS الرسمي/TestFlight، حتى تصل حركة التسجيل والإرسال إلى نشر المرحّل نفسه.

    التدفق من البداية إلى النهاية:

    1. ثبّت إصدار iOS رسميًا/TestFlight جُمّع باستخدام عنوان URL الأساسي نفسه للمرحّل.
    2. كوّن `gateway.push.apns.relay.baseUrl` على Gateway.
    3. اقرن تطبيق iOS بـ Gateway ودع جلسات العقدة والمشغل تتصل.
    4. يجلب تطبيق iOS هوية Gateway، ويسجل لدى المرحّل باستخدام App Attest مع إيصال التطبيق، ثم ينشر حمولة `push.apns.register` المدعومة بالترحيل إلى Gateway المقترن.
    5. يخزن Gateway مقبض المرحّل ومنحة الإرسال، ثم يستخدمهما لـ `push.test`، وتنبيهات الإيقاظ، وإيقاظات إعادة الاتصال.

    ملاحظات تشغيلية:

    - إذا نقلت تطبيق iOS إلى Gateway مختلف، فأعد توصيل التطبيق حتى يتمكن من نشر تسجيل ترحيل جديد مرتبط بذلك الـ Gateway.
    - إذا أصدرت إصدار iOS جديدًا يشير إلى نشر ترحيل مختلف، يحدّث التطبيق تسجيل الترحيل المخزن مؤقتًا بدلًا من إعادة استخدام أصل الترحيل القديم.

    ملاحظة توافق:

    - لا يزال `OPENCLAW_APNS_RELAY_BASE_URL` و`OPENCLAW_APNS_RELAY_TIMEOUT_MS` يعملان كتجاوزات مؤقتة عبر متغيرات البيئة.
    - يظل `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` مخرجًا تطويريًا مخصصًا لـ local loopback فقط؛ لا تحفظ عناوين URL لمرحّل HTTP في التكوين.

    راجع [تطبيق iOS](/ar/platforms/ios#relay-backed-push-for-official-builds) للتدفق من البداية إلى النهاية و[تدفق المصادقة والثقة](/ar/platforms/ios#authentication-and-trust-flow) لنموذج أمان المرحّل.

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
    - `target`: `last` | `none` | `<channel-id>` (مثلًا `discord`، أو `matrix`، أو `telegram`، أو `whatsapp`)
    - `directPolicy`: `allow` (الافتراضي) أو `block` لأهداف Heartbeat بأسلوب الرسائل المباشرة
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

    - `sessionRetention`: إزالة جلسات التشغيل المعزولة المكتملة من `sessions.json` (الافتراضي `24h`؛ عيّن `false` للتعطيل).
    - `runLog`: تقليم `cron/runs/<jobId>.jsonl` حسب الحجم والأسطر المحتفظ بها.
    - راجع [مهام Cron](/ar/automation/cron-jobs) للاطلاع على نظرة عامة على الميزة وأمثلة CLI.

  </Accordion>

  <Accordion title="إعداد Webhook (الخطافات)">
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
    - تعامل مع كل محتوى حمولات الخطاف/Webhook كإدخال غير موثوق.
    - استخدم `hooks.token` مخصصًا؛ لا تعِد استخدام رمز Gateway المشترك.
    - مصادقة الخطاف تعتمد على الترويسة فقط (`Authorization: Bearer ...` أو `x-openclaw-token`)؛ يتم رفض رموز سلسلة الاستعلام.
    - لا يمكن أن يكون `hooks.path` هو `/`؛ أبقِ دخول Webhook على مسار فرعي مخصص مثل `/hooks`.
    - أبقِ أعلام تجاوز المحتوى غير الآمن معطلة (`hooks.gmail.allowUnsafeExternalContent`، `hooks.mappings[].allowUnsafeExternalContent`) إلا عند إجراء تصحيح أخطاء محدود النطاق بإحكام.
    - إذا فعّلت `hooks.allowRequestSessionKey`، فعيّن أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد مفاتيح الجلسات التي يختارها المستدعي.
    - للوكلاء المدفوعين بالخطافات، فضّل مستويات نماذج حديثة قوية وسياسة أدوات صارمة (مثل المراسلة فقط مع العزل حيثما أمكن).

    راجع [المرجع الكامل](/ar/gateway/configuration-reference#hooks) لكل خيارات الربط وتكامل Gmail.

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

    - **ملف واحد**: يستبدل الكائن الحاوي
    - **مصفوفة ملفات**: تُدمج دمجًا عميقًا بالترتيب (اللاحق يفوز)
    - **المفاتيح الشقيقة**: تُدمج بعد التضمينات (تتجاوز القيم المضمنة)
    - **التضمينات المتداخلة**: مدعومة حتى عمق 10 مستويات
    - **المسارات النسبية**: تُحل نسبةً إلى الملف الذي يتضمنها
    - **الكتابات المملوكة لـ OpenClaw**: عندما يغيّر تنفيذ كتابة قسمًا علويًا واحدًا فقط
      مدعومًا بتضمين ملف واحد مثل `plugins: { $include: "./plugins.json5" }`،
      يحدّث OpenClaw ذلك الملف المضمن ويترك `openclaw.json` كما هو
    - **الكتابة العابرة غير المدعومة**: تفشل تضمينات الجذر ومصفوفات التضمين والتضمينات
      ذات التجاوزات الشقيقة بإغلاق آمن لكتابات OpenClaw بدلًا من
      تسطيح التكوين
    - **الاحتواء**: يجب أن تُحل مسارات `$include` تحت الدليل الذي يحتوي
      `openclaw.json`. لمشاركة شجرة عبر أجهزة أو مستخدمين، عيّن
      `OPENCLAW_INCLUDE_ROOTS` إلى قائمة مسارات (`:` على POSIX، و`;` على Windows) من
      الأدلة الإضافية التي قد تشير إليها التضمينات. تُحل الروابط الرمزية
      ويُعاد فحصها، لذلك يظل المسار الذي يبدو نصيًا داخل دليل تكوين لكن
      هدفه الحقيقي يخرج من كل جذر مسموح مرفوضًا.
    - **معالجة الأخطاء**: أخطاء واضحة للملفات المفقودة وأخطاء التحليل والتضمينات الدائرية

  </Accordion>
</AccordionGroup>

## إعادة تحميل التكوين أثناء التشغيل

يراقب Gateway الملف `~/.openclaw/openclaw.json` ويطبق التغييرات تلقائيًا — لا حاجة لإعادة تشغيل يدوية لمعظم الإعدادات.

تُعامل تعديلات الملفات المباشرة كغير موثوقة حتى يتم التحقق منها. ينتظر المراقب
حتى تستقر عمليات الكتابة المؤقتة/إعادة التسمية من المحرر، ويقرأ الملف النهائي، ويرفض
التعديلات الخارجية غير الصالحة دون إعادة كتابة `openclaw.json`. تستخدم كتابات التكوين
المملوكة لـ OpenClaw بوابة المخطط نفسها قبل الكتابة؛ يتم رفض عمليات الاستبدال الهدامة مثل
إسقاط `gateway.mode` أو تقليص الملف بأكثر من النصف، وتُحفظ كـ `.rejected.*` للفحص.

إذا رأيت `config reload skipped (invalid config)` أو أبلغ بدء التشغيل عن `Invalid
config`، فافحص التكوين، وشغّل `openclaw config validate`، ثم شغّل `openclaw
doctor --fix` للإصلاح. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-rejected-invalid-config)
للحصول على قائمة التحقق.

### أوضاع إعادة التحميل

| الوضع                   | السلوك                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (الافتراضي) | يطبق التغييرات الآمنة فورًا أثناء التشغيل. يعيد التشغيل تلقائيًا للتغييرات الحرجة.           |
| **`hot`**              | يطبق التغييرات الآمنة فقط أثناء التشغيل. يسجل تحذيرًا عندما تكون إعادة التشغيل مطلوبة — وتتولى أنت ذلك. |
| **`restart`**          | يعيد تشغيل Gateway عند أي تغيير في التكوين، سواء كان آمنًا أم لا.                                 |
| **`off`**              | يعطل مراقبة الملفات. تسري التغييرات عند إعادة التشغيل اليدوية التالية.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ما يُطبق أثناء التشغيل مقابل ما يحتاج إلى إعادة تشغيل

تُطبق معظم الحقول أثناء التشغيل دون توقف. في وضع `hybrid`، تُدار التغييرات التي تتطلب إعادة تشغيل تلقائيًا.

| الفئة            | الحقول                                                            | هل يلزم إعادة تشغيل؟ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| القنوات            | `channels.*`، `web` (WhatsApp) — كل القنوات المدمجة وقنوات Plugin | لا              |
| الوكيل والنماذج      | `agent`، `agents`، `models`، `routing`                            | لا              |
| الأتمتة          | `hooks`، `cron`، `agent.heartbeat`                                | لا              |
| الجلسات والرسائل | `session`، `messages`                                             | لا              |
| الأدوات والوسائط       | `tools`، `browser`، `skills`، `mcp`، `audio`، `talk`              | لا              |
| الواجهة ومتفرقات           | `ui`، `logging`، `identity`، `bindings`                           | لا              |
| خادم Gateway      | `gateway.*` (المنفذ، الربط، المصادقة، tailscale، TLS، HTTP)              | **نعم**         |
| البنية التحتية      | `discovery`، `canvasHost`، `plugins`                              | **نعم**         |

<Note>
`gateway.reload` و`gateway.remote` استثناءان — لا يؤدي تغييرهما إلى إعادة تشغيل.
</Note>

### تخطيط إعادة التحميل

عندما تعدّل ملف مصدر مشارًا إليه عبر `$include`، يخطط OpenClaw
لإعادة التحميل انطلاقًا من التخطيط المؤلَّف في المصدر، لا من العرض المسطّح داخل الذاكرة.
يحافظ ذلك على قابلية التنبؤ بقرارات إعادة التحميل الساخنة (التطبيق الساخن مقابل إعادة التشغيل) حتى عندما
يكون قسم علوي واحد موجودًا في ملف مضمَّن خاص به مثل
`plugins: { $include: "./plugins.json5" }`. يفشل تخطيط إعادة التحميل بشكل مغلق إذا كان
تخطيط المصدر ملتبسًا.

## Config RPC (تحديثات برمجية)

بالنسبة للأدوات التي تكتب الإعدادات عبر واجهة Gateway API، فضّل هذا التدفق:

- `config.schema.lookup` لفحص شجرة فرعية واحدة (عقدة مخطط سطحية + ملخصات الأبناء)
- `config.get` لجلب اللقطة الحالية مع `hash`
- `config.patch` للتحديثات الجزئية (تصحيح دمج JSON: تدمج الكائنات، ويحذف `null`، وتستبدل المصفوفات)
- `config.apply` فقط عندما تنوي استبدال الإعدادات بالكامل
- `update.run` للتحديث الذاتي الصريح مع إعادة التشغيل؛ أدرج `continuationMessage` عندما ينبغي للجلسة بعد إعادة التشغيل تشغيل دورة متابعة واحدة
- `update.status` لفحص أحدث مؤشر إعادة تشغيل للتحديث والتحقق من الإصدار الجاري بعد إعادة التشغيل

ينبغي للوكلاء اعتبار `config.schema.lookup` المحطة الأولى لوثائق وقيود
مستوى الحقل الدقيقة. استخدم [مرجع الإعدادات](/ar/gateway/configuration-reference)
عندما يحتاجون إلى خريطة الإعدادات الأوسع، أو القيم الافتراضية، أو الروابط إلى مراجع
الأنظمة الفرعية المخصصة.

<Note>
عمليات الكتابة في مستوى التحكم (`config.apply`، و`config.patch`، و`update.run`) تكون
محدودة المعدل إلى 3 طلبات كل 60 ثانية لكل `deviceId+clientIp`. تندمج طلبات إعادة التشغيل
ثم تفرض فترة تهدئة مدتها 30 ثانية بين دورات إعادة التشغيل.
`update.status` للقراءة فقط لكنه محدود بنطاق المسؤول لأن مؤشر إعادة التشغيل يمكن أن
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

يقبل كل من `config.apply` و`config.patch` القيم `raw`، و`baseHash`، و`sessionKey`،
و`note`، و`restartDelayMs`. تكون `baseHash` مطلوبة للطريقتين عندما تكون
إعدادات موجودة بالفعل.

## متغيرات البيئة

يقرأ OpenClaw متغيرات البيئة من العملية الأب بالإضافة إلى:

- `.env` من دليل العمل الحالي (إن وجد)
- `~/.openclaw/.env` (احتياطي عام)

لا يتجاوز أي من الملفين متغيرات البيئة الموجودة. يمكنك أيضًا تعيين متغيرات بيئة ضمنية في الإعدادات:

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

مكافئ متغير البيئة: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="استبدال متغيرات البيئة في قيم الإعدادات">
  أشر إلى متغيرات البيئة في أي قيمة سلسلة نصية ضمن الإعدادات باستخدام `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

القواعد:

- لا تُطابق إلا الأسماء بالأحرف الكبيرة: `[A-Z_][A-Z0-9_]*`
- المتغيرات الناقصة/الفارغة ترمي خطأً وقت التحميل
- اهرب باستخدام `$${VAR}` لإخراج حرفي
- يعمل داخل ملفات `$include`
- استبدال ضمني: `"${BASE}/v1"` → `"https://api.example.com/v1"`

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
مسارات بيانات الاعتماد المدعومة مذكورة في [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Accordion>

راجع [البيئة](/ar/help/environment) للحصول على الأسبقية والمصادر بالكامل.

## المرجع الكامل

للحصول على المرجع الكامل حقلًا بحقل، راجع **[مرجع الإعدادات](/ar/gateway/configuration-reference)**.

---

_ذات صلة: [أمثلة الإعدادات](/ar/gateway/configuration-examples) · [مرجع الإعدادات](/ar/gateway/configuration-reference) · [Doctor](/ar/gateway/doctor)_

## ذات صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference)
- [أمثلة الإعدادات](/ar/gateway/configuration-examples)
- [دليل تشغيل Gateway](/ar/gateway)
