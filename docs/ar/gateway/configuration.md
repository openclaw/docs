---
read_when:
    - إعداد OpenClaw لأول مرة
    - البحث عن أنماط التكوين الشائعة
    - الانتقال إلى أقسام محددة من التكوين
summary: 'نظرة عامة على التكوين: المهام الشائعة، والإعداد السريع، وروابط إلى المرجع الكامل'
title: التكوين
x-i18n:
    generated_at: "2026-05-10T19:39:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023ce17d31ed16e061516a2026ac6c31fd8716548e230d27a7965b9a2d8c59c1
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw يقرأ إعدادًا اختياريًا بصيغة <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> من `~/.openclaw/openclaw.json`.
يجب أن يكون مسار الإعداد النشط ملفًا عاديًا. تخطيطات `openclaw.json`
المربوطة برموز غير مدعومة للكتابات التي يملكها OpenClaw؛ فقد تستبدل الكتابة الذرية
المسار بدلًا من الحفاظ على الرابط الرمزي. إذا أبقيت الإعداد خارج
دليل الحالة الافتراضي، فاجعل `OPENCLAW_CONFIG_PATH` يشير مباشرةً إلى الملف الحقيقي.

إذا كان الملف مفقودًا، يستخدم OpenClaw الإعدادات الافتراضية الآمنة. من الأسباب الشائعة لإضافة إعداد:

- ربط القنوات والتحكم في من يمكنه مراسلة البوت
- ضبط النماذج، والأدوات، والعزل، أو الأتمتة (cron، والخطافات)
- ضبط الجلسات، والوسائط، والشبكات، أو واجهة المستخدم

راجع [المرجع الكامل](/ar/gateway/configuration-reference) لكل حقل متاح.

ينبغي للوكلاء والأتمتة استخدام `config.schema.lookup` للحصول على وثائق دقيقة
على مستوى الحقول قبل تعديل الإعداد. استخدم هذه الصفحة للإرشاد الموجه حسب المهمة و
[مرجع الإعدادات](/ar/gateway/configuration-reference) لخريطة الحقول الأوسع
والقيم الافتراضية.

<Tip>
**هل أنت جديد على الإعداد؟** ابدأ بـ `openclaw onboard` للإعداد التفاعلي، أو اطلع على دليل [أمثلة الإعدادات](/ar/gateway/configuration-examples) للحصول على إعدادات كاملة جاهزة للنسخ واللصق.
</Tip>

## الحد الأدنى من الإعداد

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
  <Tab title="CLI (أوامر بسطر واحد)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="واجهة التحكم">
    افتح [http://127.0.0.1:18789](http://127.0.0.1:18789) واستخدم تبويب **الإعداد**.
    تعرض واجهة التحكم نموذجًا من مخطط الإعداد الحي، بما في ذلك بيانات تعريف
    وثائق الحقلين `title` / `description` إضافةً إلى مخططات Plugin والقنوات عند
    توفرها، مع محرر **JSON خام** كمسار بديل. لواجهات
    التنقل التفصيلي والأدوات الأخرى، يوفّر Gateway أيضًا `config.schema.lookup`
    لجلب عقدة مخطط واحدة محددة المسار مع ملخصات الأبناء المباشرين.
  </Tab>
  <Tab title="تعديل مباشر">
    عدّل `~/.openclaw/openclaw.json` مباشرةً. يراقب Gateway الملف ويطبق التغييرات تلقائيًا (راجع [إعادة التحميل الساخنة](#config-hot-reload)).
  </Tab>
</Tabs>

## التحقق الصارم

<Warning>
لا يقبل OpenClaw إلا الإعدادات التي تطابق المخطط بالكامل. تؤدي المفاتيح غير المعروفة، أو الأنواع المشوهة، أو القيم غير الصالحة إلى أن **يرفض Gateway البدء**. الاستثناء الوحيد على مستوى الجذر هو `$schema` (سلسلة نصية)، حتى تتمكن المحررات من إرفاق بيانات تعريف JSON Schema.
</Warning>

يطبع `openclaw config schema` مخطط JSON Schema الأساسي الذي تستخدمه واجهة التحكم
والتحقق. يجلب `config.schema.lookup` عقدة واحدة محددة المسار مع
ملخصات الأبناء لأدوات التنقل التفصيلي. تنتقل بيانات تعريف وثائق الحقول
`title`/`description` عبر الكائنات المتداخلة، وفروع حرف البدل (`*`)، وعنصر المصفوفة (`[]`)، و`anyOf`/
`oneOf`/`allOf`. تندمج مخططات Plugin والقنوات في وقت التشغيل عند تحميل
سجل البيان.

عند فشل التحقق:

- لا يبدأ Gateway
- تعمل أوامر التشخيص فقط (`openclaw doctor`، و`openclaw logs`، و`openclaw health`، و`openclaw status`)
- شغّل `openclaw doctor` لرؤية المشكلات الدقيقة
- شغّل `openclaw doctor --fix` (أو `--yes`) لتطبيق الإصلاحات

يحتفظ Gateway بنسخة موثوقة من آخر إعداد صالح معروف بعد كل بدء ناجح،
لكن البدء وإعادة التحميل الساخنة لا يستعيدانها تلقائيًا. إذا فشل `openclaw.json`
في التحقق (بما في ذلك التحقق المحلي داخل Plugin)، يفشل بدء Gateway أو
يُتخطى إعادة التحميل ويحتفظ وقت التشغيل الحالي بآخر إعداد مقبول.
شغّل `openclaw doctor --fix` (أو `--yes`) لإصلاح الإعداد ذي البادئة/المطموس أو
استعادة آخر نسخة صالحة معروفة. يتم تخطي الترقية إلى آخر نسخة صالحة معروفة عندما
يحتوي المرشح على عناصر نائبة منقحة للأسرار مثل `***`.

## المهام الشائعة

<AccordionGroup>
  <Accordion title="إعداد قناة (WhatsApp، Telegram، Discord، وما إلى ذلك)">
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

    تشترك كل القنوات في نمط سياسة الرسائل الخاصة نفسه:

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
    عيّن النموذج الأساسي والاحتياطيات الاختيارية:

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

    - يعرّف `agents.defaults.models` كتالوج النماذج ويعمل كقائمة سماح لـ `/model`؛ تعمل إدخالات `provider/*` على تصفية `/model` و`/models` ومنتقيات النماذج إلى مزودين محددين مع الاستمرار في استخدام الاكتشاف الديناميكي للنماذج.
    - استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات قائمة السماح دون إزالة النماذج الموجودة. تُرفض الاستبدالات العادية التي قد تزيل إدخالات ما لم تمرر `--replace`.
    - تستخدم مراجع النماذج صيغة `provider/model` (مثل `anthropic/claude-opus-4-6`).
    - يتحكم `agents.defaults.imageMaxDimensionPx` في تقليل حجم صور النصوص والأدوات (القيمة الافتراضية `1200`)؛ عادةً ما تقلل القيم الأدنى استخدام رموز الرؤية في التشغيلات كثيرة لقطات الشاشة.
    - راجع [CLI النماذج](/ar/concepts/models) للتبديل بين النماذج في الدردشة و[تجاوز فشل النموذج](/ar/concepts/model-failover) لسلوك تدوير المصادقة والاحتياطيات.
    - للمزودين المخصصين/المستضافين ذاتيًا، راجع [المزودون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls) في المرجع.

  </Accordion>

  <Accordion title="التحكم في من يمكنه مراسلة البوت">
    يتم التحكم في الوصول إلى الرسائل الخاصة لكل قناة عبر `dmPolicy`:

    - `"pairing"` (الافتراضي): يحصل المرسلون غير المعروفين على رمز إقران لمرة واحدة للموافقة
    - `"allowlist"`: المرسلون الموجودون في `allowFrom` فقط (أو متجر السماح المقترن)
    - `"open"`: السماح بكل الرسائل الخاصة الواردة (يتطلب `allowFrom: ["*"]`)
    - `"disabled"`: تجاهل كل الرسائل الخاصة

    للمجموعات، استخدم `groupPolicy` + `groupAllowFrom` أو قوائم السماح الخاصة بالقنوات.

    راجع [المرجع الكامل](/ar/gateway/config-channels#dm-and-group-access) للتفاصيل الخاصة بكل قناة.

  </Accordion>

  <Accordion title="إعداد بوابة الإشارات في دردشة المجموعات">
    تتطلب رسائل المجموعات افتراضيًا **إشارة**. اضبط أنماط التشغيل لكل وكيل، وأبقِ ردود الغرف المرئية على مسار أداة الرسائل الافتراضي ما لم تكن تريد عمدًا الردود النهائية التلقائية القديمة:

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

    - **إشارات بيانات التعريف**: إشارات @ الأصلية (الإشارة باللمس في WhatsApp، و@bot في Telegram، وما إلى ذلك)
    - **أنماط النص**: أنماط regex آمنة في `mentionPatterns`
    - **الردود المرئية**: يمكن لـ `messages.visibleReplies` أن يتطلب إرسالًا عبر أداة الرسائل عالميًا؛ ويتجاوز `messages.groupChat.visibleReplies` ذلك للمجموعات/القنوات.
    - راجع [المرجع الكامل](/ar/gateway/config-channels#group-chat-mention-gating) لأوضاع الردود المرئية، والتجاوزات الخاصة بكل قناة، ووضع الدردشة الذاتية.

  </Accordion>

  <Accordion title="تقييد Skills لكل وكيل">
    استخدم `agents.defaults.skills` كأساس مشترك، ثم تجاوز وكلاء
    محددين باستخدام `agents.list[].skills`:

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

    - احذف `agents.defaults.skills` لإتاحة Skills بلا قيود افتراضيًا.
    - احذف `agents.list[].skills` لوراثة القيم الافتراضية.
    - عيّن `agents.list[].skills: []` لعدم إتاحة أي Skills.
    - راجع [Skills](/ar/tools/skills)، و[إعدادات Skills](/ar/tools/skills-config)، و
      [مرجع الإعدادات](/ar/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="ضبط مراقبة صحة قنوات Gateway">
    تحكم في مدى قوة إعادة تشغيل Gateway للقنوات التي تبدو متقادمة:

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
    - يجب أن يكون `channelStaleEventThresholdMinutes` أكبر من أو مساويًا لفاصل الفحص.
    - استخدم `channels.<provider>.healthMonitor.enabled` أو `channels.<provider>.accounts.<id>.healthMonitor.enabled` لتعطيل إعادة التشغيل التلقائية لقناة أو حساب واحد دون تعطيل المراقب العام.
    - راجع [فحوصات الصحة](/ar/gateway/health) لتصحيح التشغيل و[المرجع الكامل](/ar/gateway/configuration-reference#gateway) لكل الحقول.

  </Accordion>

  <Accordion title="ضبط مهلة مصافحة WebSocket في Gateway">
    امنح العملاء المحليين وقتًا أطول لإكمال مصافحة WebSocket قبل المصادقة على
    المضيفات المحملة أو منخفضة القدرة:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - الافتراضي هو `15000` مللي ثانية.
    - لا يزال `OPENCLAW_HANDSHAKE_TIMEOUT_MS` له الأولوية لتجاوزات الخدمة أو الصدفة لمرة واحدة.
    - فضّل إصلاح توقفات بدء التشغيل/حلقة الأحداث أولًا؛ هذا المقبض للمضيفات السليمة لكنها بطيئة أثناء الإحماء.

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
    - `threadBindings`: الإعدادات الافتراضية العامة لتوجيه الجلسات المرتبطة بالسلاسل (يدعم Discord أوامر `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`).
    - راجع [إدارة الجلسات](/ar/concepts/session) لمعرفة تحديد النطاق وروابط الهوية وسياسة الإرسال.
    - راجع [المرجع الكامل](/ar/gateway/config-agents#session) لكل الحقول.

  </Accordion>

  <Accordion title="تفعيل العزل">
    شغّل جلسات الوكيل في بيئات تشغيل عزل منفصلة:

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

    ابنِ الصورة أولاً - من نسخة مصدرية محلية شغّل `scripts/sandbox-setup.sh`، أو من تثبيت npm راجع أمر `docker build` المضمّن في [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup).

    راجع [العزل](/ar/gateway/sandboxing) للدليل الكامل و[المرجع الكامل](/ar/gateway/config-agents#agentsdefaultssandbox) لكل الخيارات.

  </Accordion>

  <Accordion title="تفعيل الدفع المدعوم بالترحيل لإصدارات iOS الرسمية">
    يُضبط الدفع المدعوم بالترحيل في `openclaw.json`.

    عيّن هذا في إعدادات Gateway:

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

    - يتيح لـ Gateway إرسال `push.test`، وتنبيهات الإيقاظ، وإيقاظات إعادة الاتصال عبر المرحّل الخارجي.
    - يستخدم منحة إرسال محددة بنطاق التسجيل يمررها تطبيق iOS المقترن. لا يحتاج Gateway إلى رمز مرحّل على مستوى النشر.
    - يربط كل تسجيل مدعوم بالترحيل بهوية Gateway التي اقترن بها تطبيق iOS، بحيث لا يستطيع Gateway آخر إعادة استخدام التسجيل المخزن.
    - يُبقي إصدارات iOS المحلية/اليدوية على APNs المباشر. لا تنطبق الإرسالات المدعومة بالترحيل إلا على الإصدارات الرسمية الموزعة التي سجلت عبر المرحّل.
    - يجب أن يطابق عنوان URL الأساسي للمرحّل المضمّن في إصدار iOS الرسمي/TestFlight، حتى تصل حركة التسجيل والإرسال إلى نشر المرحّل نفسه.

    التدفق من البداية إلى النهاية:

    1. ثبّت إصدار iOS رسمي/TestFlight جرى تجميعه بعنوان URL الأساسي نفسه للمرحّل.
    2. اضبط `gateway.push.apns.relay.baseUrl` على Gateway.
    3. اقرن تطبيق iOS بـ Gateway ودع جلسات العقدة والمشغّل تتصل.
    4. يجلب تطبيق iOS هوية Gateway، ويسجل لدى المرحّل باستخدام App Attest بالإضافة إلى إيصال التطبيق، ثم ينشر حمولة `push.apns.register` المدعومة بالترحيل إلى Gateway المقترن.
    5. يخزن Gateway مقبض المرحّل ومنحة الإرسال، ثم يستخدمهما لـ `push.test` وتنبيهات الإيقاظ وإيقاظات إعادة الاتصال.

    ملاحظات تشغيلية:

    - إذا بدّلت تطبيق iOS إلى Gateway مختلف، فأعد توصيل التطبيق حتى يتمكن من نشر تسجيل مرحّل جديد مرتبط بذلك Gateway.
    - إذا أصدرت إصدار iOS جديداً يشير إلى نشر مرحّل مختلف، يحدّث التطبيق تسجيل المرحّل المخبأ لديه بدلاً من إعادة استخدام أصل المرحّل القديم.

    ملاحظة توافق:

    - لا يزال `OPENCLAW_APNS_RELAY_BASE_URL` و`OPENCLAW_APNS_RELAY_TIMEOUT_MS` يعملان كتجاوزات مؤقتة عبر متغيرات البيئة.
    - يبقى `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` مخرجاً تطويرياً مقتصراً على local loopback؛ لا تحفظ عناوين URL لمرحّل HTTP في الإعدادات.

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

    - `every`: سلسلة مدة (`30m`، `2h`). عيّن `0m` للتعطيل.
    - `target`: `last` | `none` | `<channel-id>` (على سبيل المثال `discord` أو `matrix` أو `telegram` أو `whatsapp`)
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

    - `sessionRetention`: يزيل جلسات التشغيل المعزولة المكتملة من `sessions.json` (الافتراضي `24h`؛ عيّن `false` للتعطيل).
    - `runLog`: يقلّم `cron/runs/<jobId>.jsonl` حسب الحجم والأسطر المحتفظ بها.
    - راجع [مهام Cron](/ar/automation/cron-jobs) للحصول على نظرة عامة على الميزة وأمثلة CLI.

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
    - تعامل مع كل محتوى حمولات hook/webhook كإدخال غير موثوق.
    - استخدم `hooks.token` مخصصاً؛ لا تعِد استخدام رمز Gateway المشترك.
    - مصادقة hook تكون عبر الترويسة فقط (`Authorization: Bearer ...` أو `x-openclaw-token`)؛ تُرفض رموز سلسلة الاستعلام.
    - لا يمكن أن يكون `hooks.path` هو `/`؛ أبقِ دخول Webhook على مسار فرعي مخصص مثل `/hooks`.
    - أبقِ أعلام تجاوز المحتوى غير الآمن معطلة (`hooks.gmail.allowUnsafeExternalContent`، `hooks.mappings[].allowUnsafeExternalContent`) إلا عند إجراء تصحيح أخطاء محدود النطاق بدقة.
    - إذا فعّلت `hooks.allowRequestSessionKey`، فعيّن أيضاً `hooks.allowedSessionKeyPrefixes` لتقييد مفاتيح الجلسة التي يختارها المستدعي.
    - بالنسبة للوكلاء المدفوعين بـ hook، فضّل طبقات نماذج حديثة قوية وسياسة أدوات صارمة (مثل المراسلة فقط بالإضافة إلى العزل حيثما أمكن).

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

    راجع [تعدد الوكلاء](/ar/concepts/multi-agent) و[المرجع الكامل](/ar/gateway/config-agents#multi-agent-routing) لقواعد الربط وملفات تعريف الوصول لكل وكيل.

  </Accordion>

  <Accordion title="تقسيم الإعدادات إلى ملفات متعددة ($include)">
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
    - **مصفوفة ملفات**: تُدمج بعمق بالترتيب (الأحدث يفوز)
    - **المفاتيح الشقيقة**: تُدمج بعد التضمينات (تتجاوز القيم المضمنة)
    - **التضمينات المتداخلة**: مدعومة حتى عمق 10 مستويات
    - **المسارات النسبية**: تُحل نسبةً إلى الملف الذي يتضمنها
    - **عمليات الكتابة المملوكة لـ OpenClaw**: عندما تغيّر كتابة قسماً علوياً واحداً فقط
      مدعوماً بتضمين ملف واحد مثل `plugins: { $include: "./plugins.json5" }`،
      يحدّث OpenClaw ذلك الملف المضمّن ويترك `openclaw.json` كما هو
    - **الكتابة العبرية غير المدعومة**: تضمينات الجذر، ومصفوفات التضمين، والتضمينات
      ذات التجاوزات الشقيقة تفشل بصورة مغلقة لعمليات الكتابة المملوكة لـ OpenClaw بدلاً من
      تسطيح الإعدادات
    - **الاحتواء**: يجب أن تُحل مسارات `$include` تحت الدليل الذي يحتوي
      `openclaw.json`. لمشاركة شجرة عبر الأجهزة أو المستخدمين، عيّن
      `OPENCLAW_INCLUDE_ROOTS` إلى قائمة مسارات (`:` على POSIX، و`;` على Windows) من
      أدلة إضافية يمكن للتضمينات الرجوع إليها. تُحل الروابط الرمزية
      وتُفحص مجدداً، لذلك يظل المسار الذي يقع نصياً داخل دليل إعدادات لكن
      هدفه الحقيقي يخرج من كل جذر مسموح به مرفوضاً.
    - **معالجة الأخطاء**: أخطاء واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية

  </Accordion>
</AccordionGroup>

## إعادة التحميل الساخن للإعدادات

يراقب Gateway الملف `~/.openclaw/openclaw.json` ويطبق التغييرات تلقائياً - لا حاجة إلى إعادة تشغيل يدوية لمعظم الإعدادات.

تُعامل التعديلات المباشرة على الملفات كغير موثوقة حتى تجتاز التحقق. ينتظر المراقب
حتى تستقر حركات الكتابة المؤقتة/إعادة التسمية من المحرر، ويقرأ الملف النهائي، ويرفض
التعديلات الخارجية غير الصالحة من دون إعادة كتابة `openclaw.json`. تستخدم كتابات الإعدادات
المملوكة لـ OpenClaw بوابة المخطط نفسها قبل الكتابة؛ وتُرفض عمليات الاستبدال التخريبية مثل
إسقاط `gateway.mode` أو تقليص الملف بأكثر من النصف، وتُحفظ بصيغة `.rejected.*` للفحص.

إذا رأيت `config reload skipped (invalid config)` أو أبلغ بدء التشغيل عن `Invalid
config`، فافحص الإعدادات، وشغّل `openclaw config validate`، ثم شغّل `openclaw
doctor --fix` للإصلاح. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-rejected-invalid-config)
للاطلاع على قائمة التحقق.

### أوضاع إعادة التحميل

| الوضع                  | السلوك                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (افتراضي) | يطبق التغييرات الآمنة فوراً على نحو ساخن. يعيد التشغيل تلقائياً للتغييرات الحرجة.      |
| **`hot`**              | يطبق التغييرات الآمنة فقط على نحو ساخن. يسجل تحذيراً عند الحاجة إلى إعادة تشغيل - أنت تتولى ذلك. |
| **`restart`**          | يعيد تشغيل Gateway عند أي تغيير في الإعدادات، سواء كان آمناً أم لا.                    |
| **`off`**              | يعطل مراقبة الملفات. تصبح التغييرات نافذة عند إعادة التشغيل اليدوية التالية.           |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ما يُطبق ساخناً مقابل ما يحتاج إلى إعادة تشغيل

تُطبق معظم الحقول ساخناً من دون توقف. في وضع `hybrid`، تُعالج التغييرات التي تتطلب إعادة تشغيل تلقائياً.

| الفئة               | الحقول                                                            | هل يلزم إعادة تشغيل؟ |
| ------------------- | ----------------------------------------------------------------- | -------------------- |
| القنوات             | `channels.*`، `web` (WhatsApp) - كل القنوات المضمنة وقنوات Plugin | لا                   |
| الوكيل والنماذج     | `agent`، `agents`، `models`، `routing`                            | لا                   |
| الأتمتة             | `hooks`، `cron`، `agent.heartbeat`                                | لا                   |
| الجلسات والرسائل    | `session`، `messages`                                             | لا                   |
| الأدوات والوسائط    | `tools`، `browser`، `skills`، `mcp`، `audio`، `talk`              | لا                   |
| الواجهة ومتفرقات    | `ui`، `logging`، `identity`، `bindings`                           | لا                   |
| خادم Gateway        | `gateway.*` (المنفذ، الربط، المصادقة، Tailscale، TLS، HTTP)       | **نعم**              |
| البنية التحتية      | `discovery`، `plugins`                                            | **نعم**              |

<Note>
`gateway.reload` و`gateway.remote` استثناءان - لا يؤدي تغييرهما إلى تشغيل إعادة تشغيل.
</Note>

### تخطيط إعادة التحميل

عندما تعدل ملف مصدر مُشارًا إليه عبر `$include`، يخطط OpenClaw
لإعادة التحميل من التخطيط المكتوب في المصدر، وليس من العرض المسطح في الذاكرة.
هذا يُبقي قرارات إعادة التحميل الساخن (التطبيق الساخن مقابل إعادة التشغيل) قابلة للتنبؤ حتى عندما
يكون قسم واحد عالي المستوى موجودًا في ملف مُضمَّن خاص به مثل
`plugins: { $include: "./plugins.json5" }`. يفشل تخطيط إعادة التحميل بشكل مغلق إذا كان
تخطيط المصدر ملتبسًا.

## Config RPC (تحديثات برمجية)

بالنسبة إلى الأدوات التي تكتب الإعدادات عبر واجهة Gateway API، يُفضَّل هذا التدفق:

- `config.schema.lookup` لفحص شجرة فرعية واحدة (عقدة مخطط سطحية + ملخصات
  الأبناء)
- `config.get` لجلب اللقطة الحالية مع `hash`
- `config.patch` للتحديثات الجزئية (JSON merge patch: تدمج الكائنات، ويحذف `null`
  العناصر، وتستبدل المصفوفات)
- `config.apply` فقط عندما تنوي استبدال الإعدادات بالكامل
- `update.run` للتحديث الذاتي الصريح مع إعادة التشغيل؛ ضمّن `continuationMessage` عندما يجب أن تُشغِّل جلسة ما بعد إعادة التشغيل دورة متابعة واحدة
- `update.status` لفحص أحدث مؤشر إعادة تشغيل للتحديث والتحقق من الإصدار الجاري تشغيله بعد إعادة التشغيل

يجب أن تتعامل الوكلاء مع `config.schema.lookup` بوصفها المحطة الأولى للحصول على
وثائق وقيود دقيقة على مستوى الحقول. استخدم [مرجع الإعدادات](/ar/gateway/configuration-reference)
عندما يحتاجون إلى خريطة الإعدادات الأوسع، أو القيم الافتراضية، أو الروابط إلى مراجع
الأنظمة الفرعية المخصصة.

<Note>
تخضع كتابات مستوى التحكم (`config.apply`، و`config.patch`، و`update.run`)
لحد معدل يبلغ 3 طلبات لكل 60 ثانية لكل `deviceId+clientIp`. تُدمَج طلبات إعادة التشغيل
ثم تُفرض فترة تهدئة مدتها 30 ثانية بين دورات إعادة التشغيل.
`update.status` للقراءة فقط لكنه مقيد بنطاق الإدارة لأن مؤشر إعادة التشغيل يمكن أن
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
و`note`، و`restartDelayMs`. تكون `baseHash` مطلوبة لكلتا الطريقتين عندما
تكون هناك إعدادات موجودة بالفعل.

## متغيرات البيئة

يقرأ OpenClaw متغيرات البيئة من العملية الأصلية بالإضافة إلى:

- `.env` من دليل العمل الحالي (إذا كان موجودًا)
- `~/.openclaw/.env` (احتياطي عام)

لا يتجاوز أي من الملفين متغيرات البيئة الموجودة. يمكنك أيضًا تعيين متغيرات بيئة مضمنة في الإعدادات:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="استيراد بيئة Shell (اختياري)">
  إذا كان مفعّلًا ولم تكن المفاتيح المتوقعة مضبوطة، يُشغّل OpenClaw shell تسجيل الدخول لديك ويستورد المفاتيح الناقصة فقط:

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
  ارجع إلى متغيرات البيئة في أي قيمة نصية في الإعدادات باستخدام `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

القواعد:

- تتم مطابقة الأسماء بالأحرف الكبيرة فقط: `[A-Z_][A-Z0-9_]*`
- المتغيرات الناقصة/الفارغة تُطلق خطأً عند وقت التحميل
- اهرب باستخدام `$${VAR}` للحصول على مخرجات حرفية
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

توجد تفاصيل SecretRef (بما في ذلك `secrets.providers` لـ `env`/`file`/`exec`) في [إدارة الأسرار](/ar/gateway/secrets).
تُدرج مسارات بيانات الاعتماد المدعومة في [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Accordion>

راجع [البيئة](/ar/help/environment) للحصول على الأولوية والمصادر الكاملتين.

## المرجع الكامل

للاطلاع على المرجع الكامل حقلًا بحقل، راجع **[مرجع الإعدادات](/ar/gateway/configuration-reference)**.

---

_ذات صلة: [أمثلة الإعدادات](/ar/gateway/configuration-examples) · [مرجع الإعدادات](/ar/gateway/configuration-reference) · [Doctor](/ar/gateway/doctor)_

## ذات صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference)
- [أمثلة الإعدادات](/ar/gateway/configuration-examples)
- [دليل تشغيل Gateway](/ar/gateway)
