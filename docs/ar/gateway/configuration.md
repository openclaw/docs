---
read_when:
    - إعداد OpenClaw للمرة الأولى
    - جارٍ البحث عن أنماط التكوين الشائعة
    - الانتقال إلى أقسام تكوين محددة
summary: 'نظرة عامة على التكوين: المهام الشائعة، والإعداد السريع، وروابط إلى المرجع الكامل'
title: التكوين
x-i18n:
    generated_at: "2026-04-30T07:57:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92eaad06dff8ec777adc881edbabc45048a376078d2814f2d3f7e7035abb2e8d
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw يقرأ إعدادًا اختياريًا بصيغة <Tooltip tip="يدعم JSON5 التعليقات والفواصل اللاحقة">**JSON5**</Tooltip> من `~/.openclaw/openclaw.json`.
يجب أن يكون مسار الإعداد النشط ملفًا عاديًا. تخطيطات `openclaw.json`
المرتبطة رمزيًا غير مدعومة لعمليات الكتابة التي يملكها OpenClaw؛ فقد تستبدل الكتابة الذرية
المسار بدلًا من الحفاظ على الرابط الرمزي. إذا كنت تحتفظ بالإعداد خارج
دليل الحالة الافتراضي، فأشر `OPENCLAW_CONFIG_PATH` مباشرة إلى الملف الحقيقي.

إذا كان الملف مفقودًا، يستخدم OpenClaw إعدادات افتراضية آمنة. الأسباب الشائعة لإضافة إعداد:

- توصيل القنوات والتحكم بمن يمكنه مراسلة البوت
- ضبط النماذج، والأدوات، والعزل، أو الأتمتة (cron، hooks)
- ضبط الجلسات، والوسائط، والشبكات، أو واجهة المستخدم

راجع [المرجع الكامل](/ar/gateway/configuration-reference) لكل حقل متاح.

يجب على الوكلاء والأتمتة استخدام `config.schema.lookup` للحصول على
توثيق دقيق على مستوى الحقول قبل تعديل الإعداد. استخدم هذه الصفحة للإرشادات الموجهة للمهام و
[مرجع الإعدادات](/ar/gateway/configuration-reference) لخريطة الحقول الأوسع
والقيم الافتراضية.

<Tip>
**هل أنت جديد على الإعدادات؟** ابدأ بـ `openclaw onboard` للإعداد التفاعلي، أو راجع دليل [أمثلة الإعدادات](/ar/gateway/configuration-examples) للحصول على إعدادات كاملة قابلة للنسخ واللصق.
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
  <Tab title="المعالج التفاعلي">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (أوامر سطر واحد)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="واجهة التحكم">
    افتح [http://127.0.0.1:18789](http://127.0.0.1:18789) واستخدم تبويب **الإعداد**.
    تعرض واجهة التحكم نموذجًا من مخطط الإعداد الحي، بما في ذلك بيانات توثيق الحقول
    `title` / `description` إضافة إلى مخططات Plugin والقنوات عند
    توفرها، مع محرر **Raw JSON** كمخرج بديل. لواجهات المستخدم التفصيلية
    والأدوات الأخرى، يتيح Gateway أيضًا `config.schema.lookup`
    لجلب عقدة مخطط واحدة محددة المسار مع ملخصات الأبناء المباشرين.
  </Tab>
  <Tab title="تعديل مباشر">
    عدّل `~/.openclaw/openclaw.json` مباشرة. يراقب Gateway الملف ويطبق التغييرات تلقائيًا (راجع [إعادة التحميل الساخنة](#config-hot-reload)).
  </Tab>
</Tabs>

## التحقق الصارم

<Warning>
لا يقبل OpenClaw إلا الإعدادات التي تطابق المخطط بالكامل. تتسبب المفاتيح غير المعروفة، أو الأنواع المشوهة، أو القيم غير الصالحة في أن **يرفض Gateway البدء**. الاستثناء الوحيد على مستوى الجذر هو `$schema` (سلسلة نصية)، بحيث يمكن للمحررات إرفاق بيانات تعريف JSON Schema.
</Warning>

يطبع `openclaw config schema` مخطط JSON Schema الأساسي المستخدم من واجهة التحكم
والتحقق. يجلب `config.schema.lookup` عقدة واحدة محددة المسار مع
ملخصات الأبناء لأدوات التعمق. تنتقل بيانات توثيق الحقول `title`/`description`
عبر الكائنات المتداخلة، والبدل (`*`)، وعنصر المصفوفة (`[]`)، وفروع `anyOf`/
`oneOf`/`allOf`. يتم دمج مخططات Plugin والقنوات في وقت التشغيل عند تحميل
سجل البيان.

عند فشل التحقق:

- لا يقلع Gateway
- تعمل أوامر التشخيص فقط (`openclaw doctor`، `openclaw logs`، `openclaw health`، `openclaw status`)
- شغّل `openclaw doctor` لرؤية المشكلات الدقيقة
- شغّل `openclaw doctor --fix` (أو `--yes`) لتطبيق الإصلاحات

يحتفظ Gateway بنسخة موثوقة لآخر إعداد معروف سليم بعد كل بدء تشغيل ناجح.
إذا فشل `openclaw.json` لاحقًا في التحقق (أو حذف `gateway.mode`، أو تقلص
بشكل حاد، أو أضيف إليه سطر سجل عارض في بدايته)، يحافظ OpenClaw على الملف المعطوب
باسم `.clobbered.*`، ويستعيد آخر نسخة معروفة سليمة، ويسجل سبب الاسترداد.
يتلقى دور الوكيل التالي أيضًا تحذير حدث نظام حتى لا يعيد الوكيل الرئيسي
كتابة الإعداد المستعاد دون وعي. يتم تخطي ترقية النسخة إلى آخر نسخة معروفة سليمة
عندما يحتوي المرشح على عناصر نائبة لأسرار منقحة مثل `***`.
عندما تكون كل مشكلة تحقق محصورة ضمن `plugins.entries.<id>...`، لا يجري OpenClaw
استردادًا للملف بأكمله. يبقي الإعداد الحالي نشطًا ويعرض الفشل المحلي للـ Plugin
حتى لا يؤدي عدم تطابق مخطط Plugin أو إصدار المضيف إلى التراجع عن إعدادات المستخدم غير المرتبطة.

## مهام شائعة

<AccordionGroup>
  <Accordion title="إعداد قناة (WhatsApp، Telegram، Discord، وغيرها)">
    لكل قناة قسم إعداد خاص بها تحت `channels.<provider>`. راجع صفحة القناة المخصصة لخطوات الإعداد:

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

    تشترك كل القنوات في نمط سياسة الرسائل المباشرة نفسه:

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

  <Accordion title="اختيار النماذج وإعدادها">
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
    - استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات إلى قائمة السماح دون إزالة النماذج الموجودة. يتم رفض الاستبدالات العادية التي قد تزيل إدخالات ما لم تمرر `--replace`.
    - تستخدم مراجع النماذج تنسيق `provider/model` (مثل `anthropic/claude-opus-4-6`).
    - يتحكم `agents.defaults.imageMaxDimensionPx` في تصغير صور النصوص/الأدوات (الافتراضي `1200`)؛ عادةً ما تقلل القيم الأقل استخدام رموز الرؤية في التشغيلات كثيفة لقطات الشاشة.
    - راجع [Models CLI](/ar/concepts/models) لتبديل النماذج في المحادثة و[تجاوز فشل النموذج](/ar/concepts/model-failover) لدوران المصادقة وسلوك البدائل.
    - للمزودين المخصصين/المستضافين ذاتيًا، راجع [المزودون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls) في المرجع.

  </Accordion>

  <Accordion title="التحكم بمن يمكنه مراسلة البوت">
    يتم التحكم في الوصول إلى الرسائل المباشرة لكل قناة عبر `dmPolicy`:

    - `"pairing"` (الافتراضي): يحصل المرسلون غير المعروفين على رمز إقران لمرة واحدة للموافقة
    - `"allowlist"`: فقط المرسلون في `allowFrom` (أو مخزن السماح المقترن)
    - `"open"`: السماح بكل الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`)
    - `"disabled"`: تجاهل كل الرسائل المباشرة

    للمجموعات، استخدم `groupPolicy` + `groupAllowFrom` أو قوائم سماح خاصة بالقناة.

    راجع [المرجع الكامل](/ar/gateway/config-channels#dm-and-group-access) لتفاصيل كل قناة.

  </Accordion>

  <Accordion title="إعداد بوابة إشارات دردشة المجموعات">
    تتطلب رسائل المجموعات **إشارة** افتراضيًا. اضبط أنماط التشغيل لكل وكيل، وأبقِ ردود الغرف المرئية على مسار أداة الرسائل الافتراضي إلا إذا كنت تريد عمدًا الردود النهائية التلقائية القديمة:

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

    - **إشارات البيانات الوصفية**: إشارات @ الأصلية (إشارة WhatsApp باللمس، Telegram @bot، وغيرها)
    - **أنماط النص**: أنماط تعبيرات منتظمة آمنة في `mentionPatterns`
    - **الردود المرئية**: يمكن أن يفرض `messages.visibleReplies` الإرسال عبر أداة الرسائل عالميًا؛ ويتجاوز `messages.groupChat.visibleReplies` ذلك للمجموعات/القنوات.
    - راجع [المرجع الكامل](/ar/gateway/config-channels#group-chat-mention-gating) لأوضاع الرد المرئي، والتجاوزات لكل قناة، ووضع الدردشة الذاتية.

  </Accordion>

  <Accordion title="تقييد Skills لكل وكيل">
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

    - احذف `agents.defaults.skills` للسماح غير المقيد بالمهارات افتراضيًا.
    - احذف `agents.list[].skills` لوراثة الإعدادات الافتراضية.
    - عيّن `agents.list[].skills: []` لعدم إتاحة أي مهارات.
    - راجع [Skills](/ar/tools/skills)، و[إعدادات Skills](/ar/tools/skills-config)، و
      [مرجع الإعدادات](/ar/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="ضبط مراقبة صحة قنوات Gateway">
    تحكم في مدى صرامة Gateway في إعادة تشغيل القنوات التي تبدو خاملة:

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

    - عيّن `gateway.channelHealthCheckMinutes: 0` لتعطيل عمليات إعادة التشغيل عبر مراقبة الصحة عالميًا.
    - يجب أن تكون `channelStaleEventThresholdMinutes` أكبر من أو مساوية لفاصل الفحص.
    - استخدم `channels.<provider>.healthMonitor.enabled` أو `channels.<provider>.accounts.<id>.healthMonitor.enabled` لتعطيل عمليات إعادة التشغيل التلقائية لقناة أو حساب واحد دون تعطيل المراقب العالمي.
    - راجع [فحوصات الصحة](/ar/gateway/health) لتصحيح الأخطاء التشغيلية و[المرجع الكامل](/ar/gateway/configuration-reference#gateway) لكل الحقول.

  </Accordion>

  <Accordion title="ضبط مهلة مصافحة WebSocket في Gateway">
    امنح العملاء المحليين مزيدًا من الوقت لإكمال مصافحة WebSocket قبل المصادقة على
    المضيفات المحملة أو منخفضة القدرة:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - القيمة الافتراضية هي `15000` ميلي ثانية.
    - ما يزال `OPENCLAW_HANDSHAKE_TIMEOUT_MS` له الأولوية لتجاوزات الخدمة أو الصدفة لمرة واحدة.
    - فضّل إصلاح توقفات بدء التشغيل/حلقة الأحداث أولًا؛ هذا المقبض مخصص للمضيفات السليمة لكنها بطيئة أثناء الإحماء.

  </Accordion>

  <Accordion title="إعداد الجلسات وإعادة الضبط">
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
    - `threadBindings`: الإعدادات الافتراضية العامة لتوجيه الجلسات المرتبطة بسلاسل المحادثات (يدعم Discord أوامر `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`).
    - راجع [إدارة الجلسات](/ar/concepts/session) لمعرفة النطاق، وروابط الهوية، وسياسة الإرسال.
    - راجع [المرجع الكامل](/ar/gateway/config-agents#session) لجميع الحقول.

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

    ابنِ الصورة أولاً: `scripts/sandbox-setup.sh`

    راجع [العزل](/ar/gateway/sandboxing) للدليل الكامل و[المرجع الكامل](/ar/gateway/config-agents#agentsdefaultssandbox) لجميع الخيارات.

  </Accordion>

  <Accordion title="تفعيل الدفع المدعوم بالمرحل للبُنى الرسمية لنظام iOS">
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

    - يتيح لـ Gateway إرسال `push.test`، وتنبيهات الإيقاظ، وإيقاظات إعادة الاتصال عبر المرحل الخارجي.
    - يستخدم منحة إرسال مقيّدة بالتسجيل ويمررها تطبيق iOS المقترن. لا يحتاج Gateway إلى رمز مرحل على مستوى النشر.
    - يربط كل تسجيل مدعوم بالمرحل بهوية Gateway التي اقترن بها تطبيق iOS، بحيث لا يستطيع Gateway آخر إعادة استخدام التسجيل المخزن.
    - يُبقي البُنى المحلية/اليدوية لنظام iOS على APNs المباشر. تنطبق عمليات الإرسال المدعومة بالمرحل فقط على البُنى الموزعة الرسمية التي سجّلت عبر المرحل.
    - يجب أن يطابق عنوان URL الأساسي للمرحل المضمّن في بنية iOS الرسمية/TestFlight، حتى تصل حركة التسجيل والإرسال إلى نشر المرحل نفسه.

    التدفق الكامل:

    1. ثبّت بنية iOS رسمية/TestFlight تم تجميعها باستخدام عنوان URL الأساسي نفسه للمرحل.
    2. كوّن `gateway.push.apns.relay.baseUrl` على Gateway.
    3. أقرن تطبيق iOS مع Gateway ودع جلسات Node والمشغّل تتصل.
    4. يجلب تطبيق iOS هوية Gateway، ويسجل مع المرحل باستخدام App Attest مع إيصال التطبيق، ثم ينشر حمولة `push.apns.register` المدعومة بالمرحل إلى Gateway المقترن.
    5. يخزن Gateway مقبض المرحل ومنحة الإرسال، ثم يستخدمهما لـ `push.test`، وتنبيهات الإيقاظ، وإيقاظات إعادة الاتصال.

    ملاحظات تشغيلية:

    - إذا بدّلت تطبيق iOS إلى Gateway مختلف، فأعد توصيل التطبيق حتى يتمكن من نشر تسجيل مرحل جديد مرتبط بذلك Gateway.
    - إذا أصدرت بنية iOS جديدة تشير إلى نشر مرحل مختلف، يحدّث التطبيق تسجيل المرحل المخزن مؤقتاً بدلاً من إعادة استخدام أصل المرحل القديم.

    ملاحظة توافق:

    - لا يزال `OPENCLAW_APNS_RELAY_BASE_URL` و`OPENCLAW_APNS_RELAY_TIMEOUT_MS` يعملان كتجاوزات مؤقتة عبر env.
    - يظل `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` منفذاً احتياطياً للتطوير مخصصاً لـ local loopback فقط؛ لا تحفظ عناوين URL لمرحلات HTTP في التكوين.

    راجع [تطبيق iOS](/ar/platforms/ios#relay-backed-push-for-official-builds) للتدفق الكامل و[تدفق المصادقة والثقة](/ar/platforms/ios#authentication-and-trust-flow) لنموذج أمان المرحل.

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

    - `every`: سلسلة مدة (`30m`، `2h`). عيّن `0m` للتعطيل.
    - `target`: `last` | `none` | `<channel-id>` (على سبيل المثال `discord` أو `matrix` أو `telegram` أو `whatsapp`)
    - `directPolicy`: `allow` (افتراضي) أو `block` لأهداف Heartbeat بنمط الرسائل المباشرة
    - راجع [Heartbeat](/ar/gateway/heartbeat) للدليل الكامل.

  </Accordion>

  <Accordion title="تكوين وظائف Cron">
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

    - `sessionRetention`: تقليم جلسات التشغيل المعزولة المكتملة من `sessions.json` (الافتراضي `24h`؛ عيّن `false` للتعطيل).
    - `runLog`: تقليم `cron/runs/<jobId>.jsonl` حسب الحجم والأسطر المحتفظ بها.
    - راجع [وظائف Cron](/ar/automation/cron-jobs) للحصول على نظرة عامة على الميزة وأمثلة CLI.

  </Accordion>

  <Accordion title="إعداد Webhooks (hooks)">
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
    - تعامل مع كل محتوى حمولات hook/webhook كإدخال غير موثوق.
    - استخدم `hooks.token` مخصصاً؛ لا تعيد استخدام رمز Gateway المشترك.
    - مصادقة Hook تكون عبر الرأس فقط (`Authorization: Bearer ...` أو `x-openclaw-token`)؛ يتم رفض رموز سلسلة الاستعلام.
    - لا يمكن أن يكون `hooks.path` هو `/`؛ أبقِ دخول Webhook على مسار فرعي مخصص مثل `/hooks`.
    - أبقِ أعلام تجاوز المحتوى غير الآمن معطلة (`hooks.gmail.allowUnsafeExternalContent`، `hooks.mappings[].allowUnsafeExternalContent`) إلا عند إجراء تصحيح أخطاء محدود النطاق بدقة.
    - إذا فعّلت `hooks.allowRequestSessionKey`، فعيّن أيضاً `hooks.allowedSessionKeyPrefixes` لتقييد مفاتيح الجلسة التي يختارها المستدعي.
    - للوكلاء المدفوعين عبر hook، فضّل مستويات نماذج حديثة قوية وسياسة أدوات صارمة (على سبيل المثال المراسلة فقط مع العزل حيثما أمكن).

    راجع [المرجع الكامل](/ar/gateway/configuration-reference#hooks) لجميع خيارات التعيين وتكامل Gmail.

  </Accordion>

  <Accordion title="تكوين التوجيه متعدد الوكلاء">
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
    - **مصفوفة ملفات**: تُدمج بعمق حسب الترتيب (الأحدث يفوز)
    - **المفاتيح الشقيقة**: تُدمج بعد عمليات التضمين (تتجاوز القيم المضمنة)
    - **التضمينات المتداخلة**: مدعومة حتى 10 مستويات عمق
    - **المسارات النسبية**: تُحل نسبةً إلى الملف الذي يتضمنها
    - **الكتابات المملوكة لـ OpenClaw**: عندما تغير كتابة قسماً واحداً فقط من المستوى الأعلى
      مدعوماً بتضمين ملف واحد مثل `plugins: { $include: "./plugins.json5" }`،
      يحدّث OpenClaw ذلك الملف المضمن ويترك `openclaw.json` كما هو
    - **تمرير الكتابة غير المدعوم**: تفشل تضمينات الجذر، ومصفوفات التضمين، والتضمينات
      ذات التجاوزات الشقيقة بشكل مغلق لكتابات OpenClaw بدلاً من
      تسطيح التكوين
    - **معالجة الأخطاء**: أخطاء واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية

  </Accordion>
</AccordionGroup>

## إعادة تحميل التكوين فورياً

يراقب Gateway الملف `~/.openclaw/openclaw.json` ويطبق التغييرات تلقائياً — لا حاجة إلى إعادة تشغيل يدوية لمعظم الإعدادات.

تُعامل تعديلات الملفات المباشرة كغير موثوقة إلى أن تجتاز التحقق. ينتظر المراقب
حتى تهدأ عمليات الكتابة المؤقتة/إعادة التسمية التي يجريها المحرر، ويقرأ الملف النهائي، ويرفض
التعديلات الخارجية غير الصالحة باستعادة آخر تكوين معروف بأنه صالح. تستخدم كتابات التكوين
المملوكة لـ OpenClaw بوابة المخطط نفسها قبل الكتابة؛ وترفض عمليات الاستبدال المدمرة
مثل إسقاط `gateway.mode` أو تقليص حجم الملف بأكثر من النصف
وتُحفظ باسم `.rejected.*` للفحص.

تُعد أعطال التحقق المحلية لـ Plugin هي الاستثناء: إذا كانت كل المشكلات تحت
`plugins.entries.<id>...`، يبقي إعادة التحميل التكوين الحالي ويبلغ عن مشكلة Plugin
بدلاً من استعادة `.last-good`.

إذا رأيت `Config auto-restored from last-known-good` أو
`config reload restored last-known-good config` في السجلات، فافحص ملف
`.clobbered.*` المطابق بجوار `openclaw.json`، وأصلح الحمولة المرفوضة، ثم شغّل
`openclaw config validate`. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-restored-last-known-good-config)
لقائمة تحقق الاسترداد.

### أوضاع إعادة التحميل

| الوضع                   | السلوك                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (افتراضي) | يطبق التغييرات الآمنة فورياً. ويعيد التشغيل تلقائياً للتغييرات الحرجة.           |
| **`hot`**              | يطبق التغييرات الآمنة فقط. يسجل تحذيراً عندما تكون إعادة التشغيل مطلوبة — وتتولى أنت ذلك. |
| **`restart`**          | يعيد تشغيل Gateway عند أي تغيير في التكوين، آمناً كان أم لا.                                 |
| **`off`**              | يعطل مراقبة الملفات. تسري التغييرات عند إعادة التشغيل اليدوية التالية.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ما يُطبق فورياً مقابل ما يحتاج إلى إعادة تشغيل

تُطبق معظم الحقول فورياً دون توقف. في وضع `hybrid`، تُعالج التغييرات التي تتطلب إعادة تشغيل تلقائياً.

| الفئة            | الحقول                                                            | هل يلزم إعادة التشغيل؟ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| القنوات            | `channels.*`، `web` (WhatsApp) — جميع القنوات المدمجة وقنوات Plugin | لا              |
| الوكيل والنماذج      | `agent`، `agents`، `models`، `routing`                            | لا              |
| الأتمتة          | `hooks`، `cron`، `agent.heartbeat`                                | لا              |
| الجلسات والرسائل | `session`، `messages`                                             | لا              |
| الأدوات والوسائط       | `tools`، `browser`، `skills`، `mcp`، `audio`، `talk`              | لا              |
| واجهة المستخدم والمتفرقات           | `ui`، `logging`، `identity`، `bindings`                           | لا              |
| خادم Gateway      | `gateway.*` (المنفذ، الربط، المصادقة، tailscale، TLS، HTTP)              | **نعم**         |
| البنية التحتية      | `discovery`، `canvasHost`، `plugins`                              | **نعم**         |

<Note>
`gateway.reload` و`gateway.remote` استثناءان — تغييرهما **لا** يؤدي إلى إعادة تشغيل.
</Note>

### تخطيط إعادة التحميل

عندما تعدّل ملف مصدر مُشارًا إليه عبر `$include`، يخطط OpenClaw
لإعادة التحميل من التخطيط المكتوب في المصدر، وليس من العرض المفلطح في الذاكرة.
يبقي ذلك قرارات إعادة التحميل الفوري (التطبيق الفوري مقابل إعادة التشغيل) قابلة للتنبؤ حتى عندما
يكون قسم علوي واحد في ملف مُضمَّن خاص به مثل
`plugins: { $include: "./plugins.json5" }`. يفشل تخطيط إعادة التحميل بشكل مغلق إذا كان
تخطيط المصدر ملتبسًا.

## Config RPC (تحديثات برمجية)

بالنسبة للأدوات التي تكتب التهيئة عبر واجهة Gateway API، يُفضَّل هذا التسلسل:

- `config.schema.lookup` لفحص شجرة فرعية واحدة (عقدة مخطط سطحية + ملخصات الأبناء)
- `config.get` لجلب اللقطة الحالية مع `hash`
- `config.patch` للتحديثات الجزئية (تصحيح دمج JSON: تُدمج الكائنات، ويحذف `null`، وتُستبدل المصفوفات)
- `config.apply` فقط عندما تنوي استبدال التهيئة كاملة
- `update.run` للتحديث الذاتي الصريح مع إعادة التشغيل
- `update.status` لفحص أحدث حارس لإعادة تشغيل التحديث والتحقق من النسخة قيد التشغيل بعد إعادة التشغيل

ينبغي للوكلاء اعتبار `config.schema.lookup` المحطة الأولى للحصول على
وثائق وقيود دقيقة على مستوى الحقول. استخدم [مرجع التهيئة](/ar/gateway/configuration-reference)
عند الحاجة إلى خريطة التهيئة الأوسع، أو القيم الافتراضية، أو الروابط إلى مراجع الأنظمة الفرعية
المخصصة.

<Note>
كتابات مستوى التحكم (`config.apply`، و`config.patch`، و`update.run`) 
محدودة المعدل إلى 3 طلبات لكل 60 ثانية لكل `deviceId+clientIp`. تُدمج طلبات
إعادة التشغيل ثم يُفرض تبريد مدته 30 ثانية بين دورات إعادة التشغيل.
`update.status` للقراءة فقط لكنه محصور بنطاق المدير لأن حارس إعادة التشغيل قد
يتضمن ملخصات خطوات التحديث وذيول مخرجات الأوامر.
</Note>

مثال تصحيح جزئي:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

يقبل كل من `config.apply` و`config.patch` القيم `raw` و`baseHash` و`sessionKey`
و`note` و`restartDelayMs`. تكون `baseHash` مطلوبة لكلتا الطريقتين عندما تكون
هناك تهيئة موجودة مسبقًا.

## متغيرات البيئة

يقرأ OpenClaw متغيرات البيئة من العملية الأم بالإضافة إلى:

- `.env` من دليل العمل الحالي (إن وُجد)
- `~/.openclaw/.env` (بديل عام)

لا يتجاوز أي من الملفين متغيرات البيئة الموجودة. يمكنك أيضًا ضبط متغيرات بيئة مضمنة في التهيئة:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="استيراد بيئة الصدفة (اختياري)">
  إذا كان مفعّلًا ولم تكن المفاتيح المتوقعة مضبوطة، يشغّل OpenClaw صدفة تسجيل الدخول ويستورد المفاتيح الناقصة فقط:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

مكافئ متغير البيئة: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="استبدال متغيرات البيئة في قيم التهيئة">
  أشر إلى متغيرات البيئة في أي قيمة نصية ضمن التهيئة باستخدام `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

القواعد:

- تُطابَق الأسماء بالأحرف الكبيرة فقط: `[A-Z_][A-Z0-9_]*`
- المتغيرات المفقودة/الفارغة ترمي خطأ في وقت التحميل
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

توجد تفاصيل SecretRef (بما في ذلك `secrets.providers` لـ `env`/`file`/`exec`) في [إدارة الأسرار](/ar/gateway/secrets).
تُسرد مسارات بيانات الاعتماد المدعومة في [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Accordion>

راجع [البيئة](/ar/help/environment) للاطلاع على الأولوية والمصادر الكاملة.

## المرجع الكامل

للاطلاع على المرجع الكامل لكل حقل، راجع **[مرجع التهيئة](/ar/gateway/configuration-reference)**.

---

_ذو صلة: [أمثلة التهيئة](/ar/gateway/configuration-examples) · [مرجع التهيئة](/ar/gateway/configuration-reference) · [Doctor](/ar/gateway/doctor)_

## ذو صلة

- [مرجع التهيئة](/ar/gateway/configuration-reference)
- [أمثلة التهيئة](/ar/gateway/configuration-examples)
- [دليل تشغيل Gateway](/ar/gateway)
