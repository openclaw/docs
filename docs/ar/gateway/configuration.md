---
read_when:
    - إعداد OpenClaw للمرة الأولى
    - البحث عن أنماط التكوين الشائعة
    - الانتقال إلى أقسام تكوين محددة
summary: 'نظرة عامة على التكوين: المهام الشائعة، الإعداد السريع، وروابط إلى المرجع الكامل'
title: التكوين
x-i18n:
    generated_at: "2026-04-08T06:01:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 199a1e515bd4003319e71593a2659bb883299a76ff67e273d92583df03c96604
    source_path: gateway/configuration.md
    workflow: 15
---

# التكوين

يقرأ OpenClaw ملف تكوين اختياريًا بتنسيق <Tooltip tip="يدعم JSON5 التعليقات والفواصل اللاحقة">**JSON5**</Tooltip> من `~/.openclaw/openclaw.json`.

إذا كان الملف مفقودًا، يستخدم OpenClaw إعدادات افتراضية آمنة. من الأسباب الشائعة لإضافة ملف تكوين:

- توصيل القنوات والتحكم في من يمكنه مراسلة البوت
- تعيين النماذج، والأدوات، والعزل، أو الأتمتة (cron، وhooks)
- ضبط الجلسات، والوسائط، والشبكات، أو واجهة المستخدم

راجع [المرجع الكامل](/ar/gateway/configuration-reference) لكل حقل متاح.

<Tip>
**هل أنت جديد على التكوين؟** ابدأ باستخدام `openclaw onboard` للإعداد التفاعلي، أو اطّلع على دليل [أمثلة التكوين](/ar/gateway/configuration-examples) للحصول على إعدادات كاملة جاهزة للنسخ واللصق.
</Tip>

## الحد الأدنى للتكوين

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## تحرير التكوين

<Tabs>
  <Tab title="المعالج التفاعلي">
    ```bash
    openclaw onboard       # تدفق الإعداد الكامل
    openclaw configure     # معالج التكوين
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
    افتح [http://127.0.0.1:18789](http://127.0.0.1:18789) واستخدم علامة تبويب **Config**.
    تعرض واجهة التحكم نموذجًا من مخطط التكوين المباشر، بما في ذلك بيانات توثيق الحقول
    `title` / `description` بالإضافة إلى مخططات الإضافات والقنوات عند
    توفرها، مع محرر **Raw JSON** كخيار احتياطي. لواجهات
    التعمق في التفاصيل والأدوات الأخرى، تعرض البوابة أيضًا `config.schema.lookup` من أجل
    جلب عقدة مخطط واحدة محددة المسار مع ملخصات الأبناء المباشرين.
  </Tab>
  <Tab title="تحرير مباشر">
    حرّر `~/.openclaw/openclaw.json` مباشرة. تراقب البوابة الملف وتطبق التغييرات تلقائيًا (راجع [إعادة التحميل السريع](#config-hot-reload)).
  </Tab>
</Tabs>

## التحقق الصارم

<Warning>
يقبل OpenClaw فقط الإعدادات التي تطابق المخطط بالكامل. تؤدي المفاتيح غير المعروفة أو الأنواع غير الصحيحة أو القيم غير الصالحة إلى أن **ترفض البوابة بدء التشغيل**. الاستثناء الوحيد على مستوى الجذر هو `$schema` (سلسلة نصية)، حتى تتمكن المحررات من إرفاق بيانات JSON Schema الوصفية.
</Warning>

ملاحظات أدوات المخطط:

- يطبع `openclaw config schema` عائلة JSON Schema نفسها المستخدمة بواسطة واجهة التحكم
  والتحقق من التكوين.
- اعتبر خرج هذا المخطط العقد المعياري القابل للقراءة آليًا لملف
  `openclaw.json`; وتلخص هذه النظرة العامة ومرجع التكوين هذا العقد.
- تُنقل قيم الحقلين `title` و`description` إلى خرج المخطط من أجل
  أدوات المحرر والنماذج.
- ترث إدخالات الكائنات المتداخلة، وأحرف البدل (`*`)، وعناصر المصفوفات (`[]`) بيانات
  التوثيق نفسها أيضًا عند وجود توثيق حقل مطابق.
- ترث فروع التركيب `anyOf` / `oneOf` / `allOf` بيانات
  التوثيق نفسها أيضًا، بحيث تحتفظ متغيرات الاتحاد/التقاطع بمساعدة الحقول نفسها.
- يعيد `config.schema.lookup` مسار تكوين واحدًا مُطبّعًا مع عقدة
  مخطط سطحية (`title`، `description`، `type`، `enum`، `const`، الحدود الشائعة،
  وحقول تحقق مشابهة)، وبيانات تلميحات واجهة مستخدم مطابقة، وملخصات الأبناء المباشرين
  لأدوات التعمق في التفاصيل.
- تُدمج مخططات الإضافات/القنوات في وقت التشغيل عندما تتمكن البوابة من تحميل
  سجل البيان الحالي.
- يكتشف `pnpm config:docs:check` الانحراف بين
  عناصر baseline الخاصة بالتكوين والموجهة للتوثيق وسطح المخطط الحالي.

عند فشل التحقق:

- لا يتم تشغيل البوابة
- تعمل فقط أوامر التشخيص (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- شغّل `openclaw doctor` لرؤية المشكلات الدقيقة
- شغّل `openclaw doctor --fix` (أو `--yes`) لتطبيق الإصلاحات

## المهام الشائعة

<AccordionGroup>
  <Accordion title="إعداد قناة (WhatsApp أو Telegram أو Discord وما إلى ذلك)">
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

  <Accordion title="اختيار النماذج وتكوينها">
    عيّن النموذج الأساسي وعمليات الرجوع الاختيارية:

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

    - يعرّف `agents.defaults.models` فهرس النماذج ويعمل كقائمة سماح للأمر `/model`.
    - تستخدم مراجع النماذج تنسيق `provider/model` (مثل `anthropic/claude-opus-4-6`).
    - يتحكم `agents.defaults.imageMaxDimensionPx` في تصغير حجم صور النصوص/الأدوات (الافتراضي `1200`); وعادةً ما تقلل القيم الأقل من استهلاك vision-token في التشغيلات الكثيفة باللقطات.
    - راجع [Models CLI](/ar/concepts/models) لتبديل النماذج في المحادثة و[Model Failover](/ar/concepts/model-failover) لسلوك تدوير المصادقة والرجوع الاحتياطي.
    - لموفري الخدمات المخصصين/المستضافين ذاتيًا، راجع [الموفّرون المخصصون](/ar/gateway/configuration-reference#custom-providers-and-base-urls) في المرجع.

  </Accordion>

  <Accordion title="التحكم في من يمكنه مراسلة البوت">
    يتم التحكم في الوصول إلى الرسائل المباشرة لكل قناة عبر `dmPolicy`:

    - `"pairing"` (الافتراضي): يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة للموافقة
    - `"allowlist"`: فقط المرسلون الموجودون في `allowFrom` (أو مخزن السماح المقترن)
    - `"open"`: السماح بكل الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`)
    - `"disabled"`: تجاهل كل الرسائل المباشرة

    بالنسبة للمجموعات، استخدم `groupPolicy` + `groupAllowFrom` أو قوائم السماح الخاصة بالقناة.

    راجع [المرجع الكامل](/ar/gateway/configuration-reference#dm-and-group-access) للحصول على التفاصيل الخاصة بكل قناة.

  </Accordion>

  <Accordion title="إعداد اشتراط الإشارة في الدردشة الجماعية">
    تكون رسائل المجموعات افتراضيًا **تتطلب إشارة**. قم بتكوين الأنماط لكل وكيل:

    ```json5
    {
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

    - **إشارات البيانات الوصفية**: إشارات @ الأصلية (WhatsApp tap-to-mention وTelegram @bot وما إلى ذلك)
    - **أنماط النص**: أنماط regex آمنة في `mentionPatterns`
    - راجع [المرجع الكامل](/ar/gateway/configuration-reference#group-chat-mention-gating) للحصول على التبديلات الخاصة بكل قناة ووضع الدردشة الذاتية.

  </Accordion>

  <Accordion title="تقييد Skills لكل وكيل">
    استخدم `agents.defaults.skills` كأساس مشترك، ثم تجاوز
    وكلاء محددين باستخدام `agents.list[].skills`:

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

    - احذف `agents.defaults.skills` للحصول على Skills غير مقيّدة افتراضيًا.
    - احذف `agents.list[].skills` لوراثة القيم الافتراضية.
    - عيّن `agents.list[].skills: []` لعدم استخدام أي Skills.
    - راجع [Skills](/ar/tools/skills)، و[تكوين Skills](/ar/tools/skills-config)، و
      [مرجع التكوين](/ar/gateway/configuration-reference#agentsdefaultsskills).

  </Accordion>

  <Accordion title="ضبط مراقبة سلامة قنوات البوابة">
    تحكم في مدى شدة إعادة تشغيل البوابة للقنوات التي تبدو خاملة:

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

    - عيّن `gateway.channelHealthCheckMinutes: 0` لتعطيل إعادة التشغيل لمراقبة السلامة عالميًا.
    - يجب أن يكون `channelStaleEventThresholdMinutes` أكبر من أو يساوي فترة الفحص.
    - استخدم `channels.<provider>.healthMonitor.enabled` أو `channels.<provider>.accounts.<id>.healthMonitor.enabled` لتعطيل إعادة التشغيل التلقائية لقناة واحدة أو حساب واحد دون تعطيل المراقب العام.
    - راجع [Health Checks](/ar/gateway/health) لتصحيح الأخطاء التشغيلية و[المرجع الكامل](/ar/gateway/configuration-reference#gateway) لكل الحقول.

  </Accordion>

  <Accordion title="تكوين الجلسات وإعادة التعيين">
    تتحكم الجلسات في استمرارية المحادثة والعزل:

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

    - `dmScope`: ‏`main` (مشترك) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: إعدادات افتراضية عامة لتوجيه الجلسات المرتبط بالمحادثات (يدعم Discord الأوامر `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`).
    - راجع [إدارة الجلسات](/ar/concepts/session) لمعرفة النطاق، وروابط الهوية، وسياسة الإرسال.
    - راجع [المرجع الكامل](/ar/gateway/configuration-reference#session) لكل الحقول.

  </Accordion>

  <Accordion title="تمكين العزل">
    شغّل جلسات الوكيل داخل حاويات Docker معزولة:

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

    أنشئ الصورة أولاً: `scripts/sandbox-setup.sh`

    راجع [العزل](/ar/gateway/sandboxing) للدليل الكامل و[المرجع الكامل](/ar/gateway/configuration-reference#agentsdefaultssandbox) لكل الخيارات.

  </Accordion>

  <Accordion title="تمكين push المدعوم بالترحيل لإصدارات iOS الرسمية">
    يتم تكوين push المدعوم بالترحيل في `openclaw.json`.

    عيّن هذا في تكوين البوابة:

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

    ما الذي يفعله هذا:

    - يتيح للبوابة إرسال `push.test`، وتنبيهات الاستيقاظ، وعمليات الاستيقاظ لإعادة الاتصال عبر الترحيل الخارجي.
    - يستخدم إذن إرسال بنطاق التسجيل يتم تمريره من تطبيق iOS المقترن. لا تحتاج البوابة إلى رمز relay على مستوى النشر بالكامل.
    - يربط كل تسجيل مدعوم بالترحيل بهوية البوابة التي اقترن بها تطبيق iOS، بحيث لا يمكن لبوابة أخرى إعادة استخدام التسجيل المخزن.
    - يُبقي إصدارات iOS المحلية/اليدوية على APNs المباشر. لا تنطبق الإرسالات المدعومة بالترحيل إلا على الإصدارات الرسمية الموزعة التي سجلت عبر relay.
    - يجب أن يتطابق مع عنوان URL الأساسي للترحيل المضمّن في إصدار iOS الرسمي/TestFlight، حتى تصل حركة التسجيل والإرسال إلى عملية نشر relay نفسها.

    التدفق الكامل من البداية إلى النهاية:

    1. ثبّت إصدار iOS رسميًا/TestFlight تم تجميعه بعنوان URL أساسي للترحيل نفسه.
    2. قم بتكوين `gateway.push.apns.relay.baseUrl` على البوابة.
    3. اقترن بتطبيق iOS مع البوابة ودع جلسات العقدة والمشغل تتصل.
    4. يجلب تطبيق iOS هوية البوابة، ويسجل لدى relay باستخدام App Attest بالإضافة إلى إيصال التطبيق، ثم ينشر حمولة `push.apns.register` المدعومة بالترحيل إلى البوابة المقترنة.
    5. تخزن البوابة مقبض الترحيل وإذن الإرسال، ثم تستخدمهما من أجل `push.test`، وتنبيهات الاستيقاظ، وعمليات الاستيقاظ لإعادة الاتصال.

    ملاحظات تشغيلية:

    - إذا بدّلت تطبيق iOS إلى بوابة مختلفة، فأعد توصيل التطبيق حتى يتمكن من نشر تسجيل relay جديد مرتبط بتلك البوابة.
    - إذا أصدرت إصدار iOS جديدًا يشير إلى عملية نشر relay مختلفة، فسيقوم التطبيق بتحديث تسجيل relay المخزن مؤقتًا بدلًا من إعادة استخدام أصل relay القديم.

    ملاحظة التوافق:

    - لا يزال `OPENCLAW_APNS_RELAY_BASE_URL` و`OPENCLAW_APNS_RELAY_TIMEOUT_MS` يعملان كتجاوزات مؤقتة عبر متغيرات البيئة.
    - يبقى `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` منفذ تطوير خاصًا بالـ loopback فقط؛ لا تحفظ عناوين relay من نوع HTTP في التكوين.

    راجع [تطبيق iOS](/ar/platforms/ios#relay-backed-push-for-official-builds) للتدفق الكامل من البداية إلى النهاية و[تدفق المصادقة والثقة](/ar/platforms/ios#authentication-and-trust-flow) لنموذج أمان relay.

  </Accordion>

  <Accordion title="إعداد heartbeat (عمليات تحقق دورية)">
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
    - `target`: ‏`last` | `none` | `<channel-id>` (على سبيل المثال `discord` أو `matrix` أو `telegram` أو `whatsapp`)
    - `directPolicy`: ‏`allow` (الافتراضي) أو `block` لأهداف heartbeat بأسلوب الرسائل المباشرة
    - راجع [Heartbeat](/ar/gateway/heartbeat) للدليل الكامل.

  </Accordion>

  <Accordion title="تكوين وظائف cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: إزالة جلسات التشغيل المعزولة المكتملة من `sessions.json` (الافتراضي `24h`; عيّنه إلى `false` للتعطيل).
    - `runLog`: تقليم `cron/runs/<jobId>.jsonl` حسب الحجم وعدد الأسطر المحتفظ بها.
    - راجع [وظائف Cron](/ar/automation/cron-jobs) للحصول على نظرة عامة على الميزة وأمثلة CLI.

  </Accordion>

  <Accordion title="إعداد webhooks (hooks)">
    قم بتمكين نقاط نهاية HTTP webhook على البوابة:

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
    - تعامل مع كل محتوى حمولة hook/webhook على أنه إدخال غير موثوق.
    - استخدم `hooks.token` مخصصًا؛ ولا تعِد استخدام رمز Gateway المشترك.
    - مصادقة Hook تعتمد على الترويسة فقط (`Authorization: Bearer ...` أو `x-openclaw-token`); ويتم رفض الرموز المميزة في سلسلة الاستعلام.
    - لا يمكن أن يكون `hooks.path` مساويًا لـ `/`; حافظ على دخول webhook عبر مسار فرعي مخصص مثل `/hooks`.
    - أبقِ علامات تجاوز المحتوى غير الآمن معطلة (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) ما لم تكن تجري تصحيح أخطاء محدود النطاق للغاية.
    - إذا فعّلت `hooks.allowRequestSessionKey`، فقم أيضًا بتعيين `hooks.allowedSessionKeyPrefixes` لتقييد مفاتيح الجلسات التي يحددها المستدعي.
    - بالنسبة للوكلاء المعتمدين على hook، فضّل طبقات النماذج الحديثة القوية وسياسة أدوات صارمة (على سبيل المثال المراسلة فقط مع العزل حيثما أمكن).

    راجع [المرجع الكامل](/ar/gateway/configuration-reference#hooks) لكل خيارات التعيين وتكامل Gmail.

  </Accordion>

  <Accordion title="تكوين التوجيه متعدد الوكلاء">
    شغّل عدة وكلاء معزولين مع مساحات عمل وجلسات منفصلة:

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

    راجع [Multi-Agent](/ar/concepts/multi-agent) و[المرجع الكامل](/ar/gateway/configuration-reference#multi-agent-routing) لمعرفة قواعد الربط وملفات الوصول الخاصة بكل وكيل.

  </Accordion>

  <Accordion title="تقسيم التكوين إلى ملفات متعددة ($include)">
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
    - **مصفوفة ملفات**: دمج عميق بالترتيب (اللاحق يتغلب)
    - **المفاتيح المجاورة**: تُدمج بعد التضمينات (تتجاوز القيم المضمنة)
    - **تضمينات متداخلة**: مدعومة حتى عمق 10 مستويات
    - **المسارات النسبية**: تُحل نسبةً إلى الملف المضمِّن
    - **معالجة الأخطاء**: أخطاء واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية

  </Accordion>
</AccordionGroup>

## إعادة التحميل السريع للتكوين

تراقب البوابة الملف `~/.openclaw/openclaw.json` وتطبّق التغييرات تلقائيًا — ولا حاجة إلى إعادة تشغيل يدوية لمعظم الإعدادات.

### أوضاع إعادة التحميل

| الوضع                   | السلوك                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (الافتراضي) | يطبّق التغييرات الآمنة فورًا. ويعيد التشغيل تلقائيًا للتغييرات الحرجة.                |
| **`hot`**              | يطبّق التغييرات الآمنة فقط. ويسجل تحذيرًا عند الحاجة إلى إعادة تشغيل — وتتولى أنت ذلك. |
| **`restart`**          | يعيد تشغيل البوابة عند أي تغيير في التكوين، سواء كان آمنًا أم لا.                      |
| **`off`**              | يعطّل مراقبة الملفات. تسري التغييرات عند إعادة التشغيل اليدوية التالية.               |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ما الذي يُطبَّق سريعًا وما الذي يحتاج إلى إعادة تشغيل

تُطبَّق معظم الحقول سريعًا دون توقف. وفي وضع `hybrid`، تتم معالجة التغييرات التي تتطلب إعادة تشغيل تلقائيًا.

| الفئة              | الحقول                                                               | هل يلزم إعادة تشغيل؟ |
| ------------------ | -------------------------------------------------------------------- | -------------------- |
| القنوات            | `channels.*`, `web` (WhatsApp) — جميع القنوات المدمجة وقنوات الإضافات | لا                   |
| الوكيل والنماذج    | `agent`, `agents`, `models`, `routing`                               | لا                   |
| الأتمتة            | `hooks`, `cron`, `agent.heartbeat`                                   | لا                   |
| الجلسات والرسائل   | `session`, `messages`                                                | لا                   |
| الأدوات والوسائط   | `tools`, `browser`, `skills`, `audio`, `talk`                        | لا                   |
| واجهة المستخدم ومتفرقات | `ui`, `logging`, `identity`, `bindings`                              | لا                   |
| خادم البوابة       | `gateway.*` (المنفذ، والربط، والمصادقة، وtailscale، وTLS، وHTTP)      | **نعم**              |
| البنية التحتية     | `discovery`, `canvasHost`, `plugins`                                 | **نعم**              |

<Note>
`gateway.reload` و`gateway.remote` استثناءان — تغييرهما **لا** يؤدي إلى إعادة تشغيل.
</Note>

## Config RPC (تحديثات برمجية)

<Note>
عمليات RPC الخاصة بالكتابة على مستوى control-plane (`config.apply`, `config.patch`, `update.run`) محددة المعدل إلى **3 طلبات كل 60 ثانية** لكل `deviceId+clientIp`. وعند بلوغ الحد، يعيد RPC القيمة `UNAVAILABLE` مع `retryAfterMs`.
</Note>

التدفق الآمن/الافتراضي:

- `config.schema.lookup`: فحص شجرة فرعية واحدة من التكوين محددة المسار مع عقدة
  مخطط سطحية، وبيانات تلميحات مطابقة، وملخصات الأبناء المباشرين
- `config.get`: جلب اللقطة الحالية + hash
- `config.patch`: المسار المفضل للتحديث الجزئي
- `config.apply`: استبدال التكوين بالكامل فقط
- `update.run`: تحديث ذاتي صريح + إعادة تشغيل

عندما لا تستبدل التكوين بالكامل، ففضّل `config.schema.lookup`
ثم `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (استبدال كامل)">
    يتحقق من التكوين الكامل ويكتبه ثم يعيد تشغيل البوابة في خطوة واحدة.

    <Warning>
    يقوم `config.apply` باستبدال **التكوين بالكامل**. استخدم `config.patch` للتحديثات الجزئية، أو `openclaw config set` للمفاتيح الفردية.
    </Warning>

    المعلمات:

    - `raw` (string) — حمولة JSON5 للتكوين بالكامل
    - `baseHash` (اختياري) — hash التكوين من `config.get` (مطلوب عندما يكون التكوين موجودًا)
    - `sessionKey` (اختياري) — مفتاح الجلسة لتنبيه الإيقاظ بعد إعادة التشغيل
    - `note` (اختياري) — ملاحظة للحارس الخاص بإعادة التشغيل
    - `restartDelayMs` (اختياري) — التأخير قبل إعادة التشغيل (الافتراضي 2000)

    تُدمج طلبات إعادة التشغيل بينما يكون أحدها معلقًا/قيد التنفيذ بالفعل، ويتم تطبيق فترة تهدئة مدتها 30 ثانية بين دورات إعادة التشغيل.

    ```bash
    openclaw gateway call config.get --params '{}'  # capture payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (تحديث جزئي)">
    يدمج تحديثًا جزئيًا في التكوين الحالي (وفق دلالات JSON merge patch):

    - تُدمج الكائنات بشكل递归
    - `null` يحذف مفتاحًا
    - تستبدل المصفوفات

    المعلمات:

    - `raw` (string) — JSON5 بالمفاتيح التي يجب تغييرها فقط
    - `baseHash` (مطلوب) — hash التكوين من `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — نفسها كما في `config.apply`

    يتطابق سلوك إعادة التشغيل مع `config.apply`: دمج عمليات إعادة التشغيل المعلقة بالإضافة إلى فترة تهدئة مدتها 30 ثانية بين دورات إعادة التشغيل.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## متغيرات البيئة

يقرأ OpenClaw متغيرات البيئة من العملية الأب بالإضافة إلى:

- `.env` من دليل العمل الحالي (إن وجد)
- `~/.openclaw/.env` (بديل عام)

لا يقوم أي من الملفين بتجاوز متغيرات البيئة الموجودة بالفعل. يمكنك أيضًا تعيين متغيرات بيئة مضمنة داخل التكوين:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="استيراد متغيرات بيئة shell (اختياري)">
  إذا كان مفعّلًا وكانت المفاتيح المتوقعة غير مضبوطة، يشغّل OpenClaw login shell الخاص بك ويستورد المفاتيح المفقودة فقط:

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
  ارجع إلى متغيرات البيئة في أي قيمة سلسلة نصية داخل التكوين باستخدام `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

القواعد:

- تُطابق الأسماء المكتوبة بأحرف كبيرة فقط: `[A-Z_][A-Z0-9_]*`
- تتسبب المتغيرات المفقودة/الفارغة في حدوث خطأ عند التحميل
- استخدم `$${VAR}` للحصول على خرج حرفي
- يعمل داخل ملفات `$include`
- استبدال مضمن: `"${BASE}/v1"` → `"https://api.example.com/v1"`

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

توجد تفاصيل SecretRef (بما في ذلك `secrets.providers` من أجل `env`/`file`/`exec`) في [إدارة الأسرار](/ar/gateway/secrets).
وترد مسارات بيانات الاعتماد المدعومة في [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Accordion>

راجع [البيئة](/ar/help/environment) لمعرفة الأولوية والمصادر الكاملة.

## المرجع الكامل

للحصول على المرجع الكامل حقلًا بحقل، راجع **[مرجع التكوين](/ar/gateway/configuration-reference)**.

---

_ذو صلة: [أمثلة التكوين](/ar/gateway/configuration-examples) · [مرجع التكوين](/ar/gateway/configuration-reference) · [Doctor](/ar/gateway/doctor)_
