---
read_when:
    - إعداد OpenClaw لأول مرة
    - البحث عن أنماط التكوين الشائعة
    - الانتقال إلى أقسام إعدادات محددة
summary: 'نظرة عامة على التكوين: المهام الشائعة، والإعداد السريع، وروابط إلى المرجع الكامل'
title: التكوين
x-i18n:
    generated_at: "2026-05-07T13:18:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: b64a49882b8649280fc4f4e39bf025ccc1bdf6a813b7940a6d57ee857aea5a77
    source_path: gateway/configuration.md
    workflow: 16
---

يقرأ OpenClaw إعدادًا اختياريًا بصيغة <Tooltip tip="تدعم JSON5 التعليقات والفواصل اللاحقة">**JSON5**</Tooltip> من `~/.openclaw/openclaw.json`.
يجب أن يكون مسار الإعداد النشط ملفًا عاديًا. تخطيطات `openclaw.json`
المربوطة رمزيًا غير مدعومة لعمليات الكتابة التي يملكها OpenClaw؛ فقد تستبدل الكتابة الذرية
المسار بدلًا من الحفاظ على الرابط الرمزي. إذا كنت تحتفظ بالإعداد خارج
دليل الحالة الافتراضي، فاجعل `OPENCLAW_CONFIG_PATH` يشير مباشرةً إلى الملف الحقيقي.

إذا كان الملف مفقودًا، يستخدم OpenClaw الإعدادات الافتراضية الآمنة. الأسباب الشائعة لإضافة إعداد:

- ربط القنوات والتحكم في من يمكنه مراسلة البوت
- ضبط النماذج، والأدوات، والعزل، أو الأتمتة (cron، والخطافات)
- ضبط الجلسات، والوسائط، والشبكات، أو واجهة المستخدم

راجع [المرجع الكامل](/ar/gateway/configuration-reference) لكل حقل متاح.

ينبغي للوكلاء والأتمتة استخدام `config.schema.lookup` للحصول على توثيق دقيق على مستوى الحقل
قبل تعديل الإعداد. استخدم هذه الصفحة للحصول على إرشادات موجّهة للمهام و
[مرجع الإعدادات](/ar/gateway/configuration-reference) للحصول على خريطة الحقول الأوسع
والإعدادات الافتراضية.

<Tip>
**هل أنت جديد على الإعداد؟** ابدأ باستخدام `openclaw onboard` للإعداد التفاعلي، أو راجع دليل [أمثلة الإعدادات](/ar/gateway/configuration-examples) للحصول على إعدادات كاملة قابلة للنسخ واللصق.
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
  <Tab title="معالج تفاعلي">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (أوامر من سطر واحد)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="واجهة التحكم">
    افتح [http://127.0.0.1:18789](http://127.0.0.1:18789) واستخدم تبويب **الإعداد**.
    تعرض واجهة التحكم نموذجًا من مخطط الإعداد المباشر، بما في ذلك بيانات توثيق
    `title` / `description` الوصفية للحقول إضافةً إلى مخططات Plugins والقنوات عند
    توفرها، مع محرر **Raw JSON** كمخرج احتياطي. لواجهات التنقل التفصيلي
    والأدوات الأخرى، يوفّر Gateway أيضًا `config.schema.lookup`
    لجلب عقدة مخطط واحدة محددة بالمسار مع ملخصات الأبناء المباشرين.
  </Tab>
  <Tab title="تعديل مباشر">
    عدّل `~/.openclaw/openclaw.json` مباشرةً. يراقب Gateway الملف ويطبق التغييرات تلقائيًا (راجع [إعادة التحميل الساخنة](#config-hot-reload)).
  </Tab>
</Tabs>

## تحقق صارم

<Warning>
لا يقبل OpenClaw إلا الإعدادات التي تطابق المخطط بالكامل. تؤدي المفاتيح غير المعروفة، أو الأنواع المشوهة، أو القيم غير الصالحة إلى أن **يرفض Gateway البدء**. الاستثناء الوحيد على مستوى الجذر هو `$schema` (سلسلة نصية)، حتى تتمكن المحررات من إرفاق بيانات JSON Schema الوصفية.
</Warning>

يطبع `openclaw config schema` مخطط JSON Schema الرسمي المستخدم بواسطة واجهة التحكم
والتحقق. يجلب `config.schema.lookup` عقدة واحدة محددة بالمسار مع
ملخصات الأبناء لأدوات التنقل التفصيلي. تنتقل بيانات توثيق `title`/`description`
الوصفية للحقول عبر الكائنات المتداخلة، والحرف الشامل (`*`)، وعنصر المصفوفة (`[]`)، وتفرعات `anyOf`/
`oneOf`/`allOf`. تُدمج مخططات Plugins والقنوات وقت التشغيل عند تحميل
سجل البيان.

عند فشل التحقق:

- لا يبدأ Gateway
- تعمل أوامر التشخيص فقط (`openclaw doctor`، `openclaw logs`، `openclaw health`، `openclaw status`)
- شغّل `openclaw doctor` لمعرفة المشكلات الدقيقة
- شغّل `openclaw doctor --fix` (أو `--yes`) لتطبيق الإصلاحات

يحتفظ Gateway بنسخة موثوقة من آخر إعداد سليم معروف بعد كل بدء تشغيل ناجح،
لكن بدء التشغيل وإعادة التحميل الساخنة لا يستعيدانها تلقائيًا. إذا فشل
`openclaw.json` في التحقق (بما في ذلك التحقق المحلي الخاص بـ Plugin)، يفشل بدء تشغيل Gateway أو
يتم تخطي إعادة التحميل ويحتفظ وقت التشغيل الحالي بآخر إعداد مقبول.
شغّل `openclaw doctor --fix` (أو `--yes`) لإصلاح الإعداد ذي البادئة/المطموس أو
استعادة نسخة آخر إعداد سليم معروف. يتم تخطي الترقية إلى آخر إعداد سليم معروف عندما
يحتوي المرشح على عناصر نائبة لأسرار منقحة مثل `***`.

## مهام شائعة

<AccordionGroup>
  <Accordion title="إعداد قناة (WhatsApp، Telegram، Discord، وغيرها)">
    لكل قناة قسم إعداد خاص بها ضمن `channels.<provider>`. راجع صفحة القناة المخصصة لمعرفة خطوات الإعداد:

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
    - استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات إلى قائمة السماح دون إزالة النماذج الموجودة. تُرفض الاستبدالات العادية التي قد تزيل إدخالات ما لم تمرر `--replace`.
    - تستخدم مراجع النماذج صيغة `provider/model` (مثل `anthropic/claude-opus-4-6`).
    - يتحكم `agents.defaults.imageMaxDimensionPx` في تصغير صور النصوص/الأدوات (الافتراضي `1200`)؛ عادةً ما تقلل القيم الأقل استخدام رموز الرؤية في التشغيلات الكثيفة بلقطات الشاشة.
    - راجع [Models CLI](/ar/concepts/models) لتبديل النماذج في الدردشة و[تجاوز فشل النموذج](/ar/concepts/model-failover) لتدوير المصادقة وسلوك البدائل.
    - للموفرين المخصصين/المستضافين ذاتيًا، راجع [الموفرون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls) في المرجع.

  </Accordion>

  <Accordion title="التحكم في من يمكنه مراسلة البوت">
    يتم التحكم في وصول الرسائل المباشرة لكل قناة عبر `dmPolicy`:

    - `"pairing"` (افتراضي): يتلقى المرسلون غير المعروفين رمز اقتران لمرة واحدة للموافقة
    - `"allowlist"`: المرسلون فقط في `allowFrom` (أو مخزن السماح المقترن)
    - `"open"`: السماح بكل الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`)
    - `"disabled"`: تجاهل كل الرسائل المباشرة

    للمجموعات، استخدم `groupPolicy` + `groupAllowFrom` أو قوائم السماح الخاصة بالقناة.

    راجع [المرجع الكامل](/ar/gateway/config-channels#dm-and-group-access) للحصول على تفاصيل كل قناة.

  </Accordion>

  <Accordion title="إعداد بوابة الإشارات في دردشة المجموعة">
    تتطلب رسائل المجموعة افتراضيًا **إشارة**. اضبط أنماط التشغيل لكل وكيل، وأبقِ ردود الغرفة المرئية على مسار أداة الرسائل الافتراضي ما لم تكن تريد عمدًا الردود النهائية التلقائية القديمة:

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

    - **إشارات البيانات الوصفية**: إشارات @ الأصلية (إشارة WhatsApp بالنقر، Telegram @bot، وغيرها)
    - **أنماط النص**: أنماط regex آمنة في `mentionPatterns`
    - **الردود المرئية**: يمكن لـ `messages.visibleReplies` أن يتطلب إرسال أداة الرسائل عالميًا؛ ويتجاوز `messages.groupChat.visibleReplies` ذلك للمجموعات/القنوات.
    - راجع [المرجع الكامل](/ar/gateway/config-channels#group-chat-mention-gating) لأوضاع الردود المرئية، والتجاوزات لكل قناة، ووضع الدردشة الذاتية.

  </Accordion>

  <Accordion title="تقييد Skills لكل وكيل">
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

    - احذف `agents.defaults.skills` للحصول على Skills غير مقيدة افتراضيًا.
    - احذف `agents.list[].skills` لوراثة الإعدادات الافتراضية.
    - اضبط `agents.list[].skills: []` لعدم استخدام أي Skills.
    - راجع [Skills](/ar/tools/skills)، و[إعدادات Skills](/ar/tools/skills-config)، و
      [مرجع الإعدادات](/ar/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="ضبط مراقبة صحة قنوات Gateway">
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

    - اضبط `gateway.channelHealthCheckMinutes: 0` لتعطيل عمليات إعادة تشغيل مراقب الصحة عالميًا.
    - يجب أن يكون `channelStaleEventThresholdMinutes` أكبر من أو مساويًا لفاصل الفحص.
    - استخدم `channels.<provider>.healthMonitor.enabled` أو `channels.<provider>.accounts.<id>.healthMonitor.enabled` لتعطيل عمليات إعادة التشغيل التلقائية لقناة أو حساب واحد دون تعطيل المراقب العام.
    - راجع [فحوصات الصحة](/ar/gateway/health) لتصحيح الأخطاء التشغيلية و[المرجع الكامل](/ar/gateway/configuration-reference#gateway) لكل الحقول.

  </Accordion>

  <Accordion title="ضبط مهلة مصافحة WebSocket في Gateway">
    امنح العملاء المحليين وقتًا أطول لإكمال مصافحة WebSocket السابقة للمصادقة على
    المضيفات المحملة أو منخفضة القدرة:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - الافتراضي هو `15000` مللي ثانية.
    - يظل `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ذا أولوية للتجاوزات المؤقتة للخدمة أو الصدفة.
    - يفضل إصلاح توقفات بدء التشغيل/حلقة الأحداث أولًا؛ هذا المقبض مخصص للمضيفات السليمة لكنها بطيئة أثناء الإحماء.

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

    - `dmScope`: `main` (مشتركة) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: الإعدادات الافتراضية العامة لتوجيه الجلسات المرتبطة بالسلاسل (يدعم Discord أوامر `/focus`، و`/unfocus`، و`/agents`، و`/session idle`، و`/session max-age`).
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

    ابنِ الصورة أولاً - من نسخة مصدرية مستخرجة شغّل `scripts/sandbox-setup.sh`، أو من تثبيت npm راجع أمر `docker build` المضمن في [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup).

    راجع [العزل](/ar/gateway/sandboxing) للدليل الكامل و[المرجع الكامل](/ar/gateway/config-agents#agentsdefaultssandbox) لجميع الخيارات.

  </Accordion>

  <Accordion title="تفعيل الدفع المدعوم بالمرحل لبُنى iOS الرسمية">
    يُضبط الدفع المدعوم بالمرحل في `openclaw.json`.

    اضبط هذا في إعداد Gateway:

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

    - يتيح للـ Gateway إرسال `push.test`، وتنبيهات الإيقاظ، وإيقاظات إعادة الاتصال عبر المرحل الخارجي.
    - يستخدم منحة إرسال محددة بنطاق التسجيل يمررها تطبيق iOS المقترن. لا يحتاج Gateway إلى رمز مرحل على مستوى النشر.
    - يربط كل تسجيل مدعوم بالمرحل بهوية Gateway التي اقترن بها تطبيق iOS، بحيث لا يستطيع Gateway آخر إعادة استخدام التسجيل المخزن.
    - يُبقي بُنى iOS المحلية/اليدوية على APNs المباشر. تنطبق الإرسالات المدعومة بالمرحل فقط على البُنى الموزعة الرسمية التي سجلت عبر المرحل.
    - يجب أن يطابق عنوان URL الأساسي للمرحل المضمن في بناء iOS الرسمي/TestFlight، حتى تصل حركة التسجيل والإرسال إلى نشر المرحل نفسه.

    التدفق من البداية إلى النهاية:

    1. ثبّت بناء iOS رسمي/TestFlight جرى تجميعه بعنوان URL الأساسي للمرحل نفسه.
    2. اضبط `gateway.push.apns.relay.baseUrl` على Gateway.
    3. اقرن تطبيق iOS بالـ Gateway واترك جلسات العقدة والمشغّل تتصل.
    4. يجلب تطبيق iOS هوية Gateway، ويسجل مع المرحل باستخدام App Attest بالإضافة إلى إيصال التطبيق، ثم ينشر حمولة `push.apns.register` المدعومة بالمرحل إلى Gateway المقترن.
    5. يخزن Gateway مقبض المرحل ومنحة الإرسال، ثم يستخدمهما لـ `push.test`، وتنبيهات الإيقاظ، وإيقاظات إعادة الاتصال.

    ملاحظات تشغيلية:

    - إذا بدّلت تطبيق iOS إلى Gateway مختلف، فأعد توصيل التطبيق حتى يتمكن من نشر تسجيل مرحل جديد مرتبط بذلك الـ Gateway.
    - إذا شحنت بناء iOS جديداً يشير إلى نشر مرحل مختلف، فسيحدّث التطبيق تسجيل المرحل المخبأ لديه بدلاً من إعادة استخدام أصل المرحل القديم.

    ملاحظة توافق:

    - لا يزال `OPENCLAW_APNS_RELAY_BASE_URL` و`OPENCLAW_APNS_RELAY_TIMEOUT_MS` يعملان كتجاوزات مؤقتة عبر متغيرات البيئة.
    - يبقى `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` مخرجاً تطويرياً مخصصاً لـ local loopback فقط؛ لا تحفظ عناوين URL لمرحل HTTP في الإعداد.

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

    - `every`: سلسلة مدة (`30m`، `2h`). اضبط `0m` للتعطيل.
    - `target`: `last` | `none` | `<channel-id>` (على سبيل المثال `discord` أو `matrix` أو `telegram` أو `whatsapp`)
    - `directPolicy`: `allow` (الافتراضي) أو `block` لأهداف Heartbeat بنمط الرسائل المباشرة
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
    - راجع [مهام Cron](/ar/automation/cron-jobs) للاطلاع على نظرة عامة على الميزة وأمثلة CLI.

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

    ملاحظة أمنية:
    - تعامل مع كل محتوى حمولات الخطافات/Webhook على أنه إدخال غير موثوق.
    - استخدم `hooks.token` مخصصاً؛ لا تعِد استخدام رمز Gateway المشترك.
    - مصادقة الخطافات عبر الرؤوس فقط (`Authorization: Bearer ...` أو `x-openclaw-token`)؛ تُرفض رموز سلسلة الاستعلام.
    - لا يمكن أن يكون `hooks.path` هو `/`؛ أبقِ دخول Webhook على مسار فرعي مخصص مثل `/hooks`.
    - أبقِ أعلام تجاوز المحتوى غير الآمن معطلة (`hooks.gmail.allowUnsafeExternalContent`، `hooks.mappings[].allowUnsafeExternalContent`) إلا عند إجراء تصحيح أخطاء محدود النطاق بإحكام.
    - إذا فعّلت `hooks.allowRequestSessionKey`، فاضبط أيضاً `hooks.allowedSessionKeyPrefixes` لتقييد مفاتيح الجلسات التي يختارها المستدعي.
    - للوكلاء المدفوعين بالخطافات، فضّل مستويات النماذج الحديثة القوية وسياسة أدوات صارمة (على سبيل المثال المراسلة فقط بالإضافة إلى العزل حيثما أمكن).

    راجع [المرجع الكامل](/ar/gateway/configuration-reference#hooks) لجميع خيارات التعيين وتكامل Gmail.

  </Accordion>

  <Accordion title="ضبط توجيه الوكلاء المتعددين">
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

    راجع [الوكيل المتعدد](/ar/concepts/multi-agent) و[المرجع الكامل](/ar/gateway/config-agents#multi-agent-routing) لقواعد الربط وملفات تعريف الوصول لكل وكيل.

  </Accordion>

  <Accordion title="تقسيم الإعداد إلى ملفات متعددة ($include)">
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

    - **ملف واحد**: يستبدل الكائن الحاوي
    - **مصفوفة ملفات**: تُدمج بعمق بالترتيب (الأحدث يفوز)
    - **المفاتيح الشقيقة**: تُدمج بعد التضمينات (تتجاوز القيم المضمنة)
    - **التضمينات المتداخلة**: مدعومة حتى عمق 10 مستويات
    - **المسارات النسبية**: تُحل نسبةً إلى الملف الذي يجري التضمين منه
    - **الكتابات المملوكة لـ OpenClaw**: عندما تغيّر كتابة قسماً واحداً فقط في المستوى الأعلى
      مدعوماً بتضمين ملف واحد مثل `plugins: { $include: "./plugins.json5" }`،
      يحدّث OpenClaw ذلك الملف المضمن ويترك `openclaw.json` سليماً
    - **الكتابة العابرة غير المدعومة**: تفشل تضمينات الجذر، ومصفوفات التضمين، والتضمينات
      ذات التجاوزات الشقيقة بشكل مغلق للكتابات المملوكة لـ OpenClaw بدلاً من
      تسطيح الإعداد
    - **الاحتواء**: يجب أن تُحل مسارات `$include` تحت الدليل الذي يحتوي
      `openclaw.json`. لمشاركة شجرة عبر أجهزة أو مستخدمين، اضبط
      `OPENCLAW_INCLUDE_ROOTS` على قائمة مسارات (`:` على POSIX، و`;` على Windows) من
      أدلة إضافية يمكن للتضمينات الإشارة إليها. تُحل الروابط الرمزية
      ويُعاد فحصها، لذلك يظل المسار الذي يعيش لفظياً داخل دليل إعداد لكن
      هدفه الحقيقي يخرج من كل جذر مسموح به مرفوضاً.
    - **معالجة الأخطاء**: أخطاء واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية

  </Accordion>
</AccordionGroup>

## إعادة تحميل الإعداد دون توقف

يراقب Gateway ملف `~/.openclaw/openclaw.json` ويطبق التغييرات تلقائياً - لا حاجة إلى إعادة تشغيل يدوية لمعظم الإعدادات.

تُعامل تعديلات الملفات المباشرة كغير موثوقة حتى تجتاز التحقق. ينتظر المراقب
حتى تستقر حركة كتابة/إعادة تسمية الملفات المؤقتة من المحرر، ثم يقرأ الملف النهائي، ويرفض
التعديلات الخارجية غير الصالحة دون إعادة كتابة `openclaw.json`. تستخدم كتابات الإعداد
المملوكة لـ OpenClaw بوابة المخطط نفسها قبل الكتابة؛ وتُرفض عمليات الاستبدال المدمرة مثل
إسقاط `gateway.mode` أو تقليص الملف بأكثر من النصف، وتُحفظ بصيغة `.rejected.*` للفحص.

إذا رأيت `config reload skipped (invalid config)` أو أبلغ بدء التشغيل عن `Invalid
config`، فافحص الإعداد، وشغّل `openclaw config validate`، ثم شغّل `openclaw
doctor --fix` للإصلاح. راجع [استكشاف مشكلات Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-rejected-invalid-config)
للقائمة المرجعية.

### أوضاع إعادة التحميل

| الوضع                  | السلوك                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (افتراضي) | يطبق التغييرات الآمنة دون توقف فوراً. يعيد التشغيل تلقائياً للتغييرات الحرجة.          |
| **`hot`**              | يطبق التغييرات الآمنة دون توقف فقط. يسجل تحذيراً عندما تكون إعادة التشغيل مطلوبة - وتتولى أنت ذلك. |
| **`restart`**          | يعيد تشغيل Gateway عند أي تغيير في الإعداد، سواء كان آمناً أم لا.                     |
| **`off`**              | يعطل مراقبة الملفات. تسري التغييرات عند إعادة التشغيل اليدوية التالية.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ما يُطبق دون توقف مقابل ما يحتاج إلى إعادة تشغيل

تُطبق معظم الحقول دون توقف ودون انقطاع. في وضع `hybrid`، تُعالج التغييرات التي تتطلب إعادة تشغيل تلقائياً.

| الفئة               | الحقول                                                            | هل تحتاج إلى إعادة تشغيل؟ |
| ------------------- | ----------------------------------------------------------------- | -------------------------- |
| القنوات             | `channels.*`, `web` (WhatsApp) - كل القنوات المضمنة وقنوات Plugin | لا                         |
| الوكيل والنماذج     | `agent`, `agents`, `models`, `routing`                            | لا                         |
| الأتمتة             | `hooks`, `cron`, `agent.heartbeat`                                | لا                         |
| الجلسات والرسائل    | `session`, `messages`                                             | لا                         |
| الأدوات والوسائط    | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | لا                         |
| الواجهة والمتنوعات  | `ui`, `logging`, `identity`, `bindings`                           | لا                         |
| خادم Gateway        | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **نعم**                    |
| البنية التحتية      | `discovery`, `plugins`                                            | **نعم**                    |

<Note>
`gateway.reload` و`gateway.remote` استثناءان - لا يؤدي تغييرهما إلى إعادة تشغيل.
</Note>

### تخطيط إعادة التحميل

عندما تعدل ملف مصدر مشارًا إليه عبر `$include`، يخطط OpenClaw لإعادة التحميل من التخطيط المؤلف في المصدر، وليس من العرض المسطح في الذاكرة. يحافظ ذلك على قابلية التنبؤ بقرارات إعادة التحميل الساخن (التطبيق الساخن مقابل إعادة التشغيل)، حتى عندما يعيش قسم علوي واحد في ملف مضمن خاص به مثل `plugins: { $include: "./plugins.json5" }`. يفشل تخطيط إعادة التحميل بإغلاق آمن إذا كان تخطيط المصدر ملتبسًا.

## استدعاءات RPC للتكوين (تحديثات برمجية)

بالنسبة إلى الأدوات التي تكتب التكوين عبر واجهة Gateway API، فضّل هذا التدفق:

- `config.schema.lookup` لفحص شجرة فرعية واحدة (عقدة مخطط سطحية + ملخصات الأبناء)
- `config.get` لجلب اللقطة الحالية مع `hash`
- `config.patch` للتحديثات الجزئية (رقعة دمج JSON: تُدمج الكائنات، ويحذف `null`، وتُستبدل المصفوفات)
- `config.apply` فقط عندما تنوي استبدال التكوين بأكمله
- `update.run` للتحديث الذاتي الصريح مع إعادة التشغيل؛ ضمّن `continuationMessage` عندما يجب أن تشغّل الجلسة بعد إعادة التشغيل دورة متابعة واحدة
- `update.status` لفحص أحدث حارس لإعادة تشغيل التحديث والتحقق من الإصدار الجاري بعد إعادة التشغيل

يجب أن تتعامل الوكلاء مع `config.schema.lookup` بوصفها المحطة الأولى للتوثيق والقيود الدقيقة على مستوى الحقول. استخدم [مرجع التكوين](/ar/gateway/configuration-reference) عندما يحتاجون إلى خريطة التكوين الأوسع، أو القيم الافتراضية، أو الروابط إلى مراجع الأنظمة الفرعية المخصصة.

<Note>
عمليات الكتابة على مستوى التحكم (`config.apply`، `config.patch`، `update.run`) محدودة المعدل إلى 3 طلبات لكل 60 ثانية لكل `deviceId+clientIp`. تُدمج طلبات إعادة التشغيل ثم تفرض فترة تهدئة مدتها 30 ثانية بين دورات إعادة التشغيل. `update.status` للقراءة فقط، لكنه ضمن نطاق المدير لأن حارس إعادة التشغيل يمكن أن يتضمن ملخصات خطوات التحديث وذيول مخرجات الأوامر.
</Note>

مثال على رقعة جزئية:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

يقبل كل من `config.apply` و`config.patch` القيم `raw` و`baseHash` و`sessionKey` و`note` و`restartDelayMs`. تكون `baseHash` مطلوبة لكلا الأسلوبين عندما يكون هناك تكوين موجود مسبقًا.

## متغيرات البيئة

يقرأ OpenClaw متغيرات البيئة من العملية الأصلية إضافة إلى:

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
  إذا كان مفعّلًا ولم تكن المفاتيح المتوقعة معيّنة، يشغّل OpenClaw غلاف تسجيل الدخول لديك ويستورد المفاتيح المفقودة فقط:

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
  أشر إلى متغيرات البيئة في أي قيمة سلسلة نصية في التكوين باستخدام `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

القواعد:

- تُطابق الأسماء ذات الأحرف الكبيرة فقط: `[A-Z_][A-Z0-9_]*`
- تتسبب المتغيرات المفقودة/الفارغة في طرح خطأ عند وقت التحميل
- استخدم `$${VAR}` للهروب من أجل إخراج حرفي
- يعمل داخل ملفات `$include`
- الاستبدال المضمن: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="مراجع الأسرار (env، file، exec)">
  بالنسبة إلى الحقول التي تدعم كائنات SecretRef، يمكنك استخدام:

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

تفاصيل SecretRef (بما في ذلك `secrets.providers` لـ `env`/`file`/`exec`) موجودة في [إدارة الأسرار](/ar/gateway/secrets). مسارات بيانات الاعتماد المدعومة مدرجة في [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Accordion>

راجع [البيئة](/ar/help/environment) لمعرفة الأولوية والمصادر الكاملة.

## المرجع الكامل

للحصول على المرجع الكامل حقلًا بحقل، راجع **[مرجع التكوين](/ar/gateway/configuration-reference)**.

---

_ذو صلة: [أمثلة التكوين](/ar/gateway/configuration-examples) · [مرجع التكوين](/ar/gateway/configuration-reference) · [Doctor](/ar/gateway/doctor)_

## ذو صلة

- [مرجع التكوين](/ar/gateway/configuration-reference)
- [أمثلة التكوين](/ar/gateway/configuration-examples)
- [دليل تشغيل Gateway](/ar/gateway)
