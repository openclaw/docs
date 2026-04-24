---
read_when:
    - إعداد OpenClaw لأول مرة
    - البحث عن أنماط إعداد شائعة
    - الانتقال إلى أقسام إعداد محددة
summary: 'نظرة عامة على الإعداد: المهام الشائعة، والإعداد السريع، وروابط إلى المرجع الكامل'
title: الإعداد
x-i18n:
    generated_at: "2026-04-24T07:40:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a47a2c02c37b012a8d8222d3f160634343090b633be722393bac2ebd6adc91c
    source_path: gateway/configuration.md
    workflow: 15
---

يقرأ OpenClaw إعدادًا اختياريًا بصيغة <Tooltip tip="JSON5 تدعم التعليقات والفواصل اللاحقة">**JSON5**</Tooltip> من `~/.openclaw/openclaw.json`.
يجب أن يكون مسار الإعداد النشط ملفًا عاديًا. تخطيطات `openclaw.json` المعتمدة على
الروابط الرمزية غير مدعومة لعمليات الكتابة التي يملكها OpenClaw؛ فقد تستبدل الكتابة
الذرية المسار بدلًا من الحفاظ على الرابط الرمزي. إذا كنت تحتفظ بالإعداد خارج
دليل الحالة الافتراضي، فاجعل `OPENCLAW_CONFIG_PATH` يشير مباشرة إلى الملف الحقيقي.

إذا كان الملف مفقودًا، يستخدم OpenClaw قيمًا افتراضية آمنة. ومن الأسباب الشائعة لإضافة إعداد:

- ربط القنوات والتحكم في من يمكنه مراسلة البوت
- ضبط النماذج، والأدوات، وsandboxing، والأتمتة (Cron، وHooks)
- ضبط الجلسات، والوسائط، والشبكات، أو UI

راجع [المرجع الكامل](/ar/gateway/configuration-reference) لكل الحقول المتاحة.

<Tip>
**هل أنت جديد على الإعداد؟** ابدأ بـ `openclaw onboard` من أجل الإعداد التفاعلي، أو اطّلع على دليل [أمثلة الإعداد](/ar/gateway/configuration-examples) للحصول على إعدادات كاملة قابلة للنسخ واللصق.
</Tip>

## الحد الأدنى من الإعداد

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## تحرير الإعداد

<Tabs>
  <Tab title="المعالج التفاعلي">
    ```bash
    openclaw onboard       # تدفق الإعداد الأولي الكامل
    openclaw configure     # معالج الإعداد
    ```
  </Tab>
  <Tab title="CLI (أوامر من سطر واحد)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    افتح [http://127.0.0.1:18789](http://127.0.0.1:18789) واستخدم علامة التبويب **Config**.
    تقوم Control UI بعرض نموذج من مخطط الإعداد الحي، بما في ذلك بيانات التوثيق الوصفية
    `title` / `description` بالإضافة إلى مخططات Plugin والقنوات عند
    توفرها، مع محرر **Raw JSON** كخيار احتياطي. ومن أجل واجهات
    التعمق والأدوات الأخرى، تكشف gateway أيضًا عن `config.schema.lookup`
    لجلب عقدة مخطط واحدة محددة بالمسار بالإضافة إلى ملخصات الأبناء المباشرين.
  </Tab>
  <Tab title="تحرير مباشر">
    حرر `~/.openclaw/openclaw.json` مباشرة. تراقب Gateway الملف وتطبق التغييرات تلقائيًا (راجع [إعادة التحميل الساخنة](#config-hot-reload)).
  </Tab>
</Tabs>

## التحقق الصارم

<Warning>
لا يقبل OpenClaw إلا الإعدادات التي تطابق المخطط بالكامل. تؤدي المفاتيح غير المعروفة، أو الأنواع المشوهة، أو القيم غير الصالحة إلى أن **ترفض Gateway البدء**. والاستثناء الوحيد على مستوى الجذر هو `$schema` (سلسلة نصية)، حتى تتمكن المحررات من إرفاق بيانات JSON Schema الوصفية.
</Warning>

يطبع `openclaw config schema` مخطط JSON Schema الرسمي المستخدم من قِبل Control UI
والتحقق. ويجلب `config.schema.lookup` عقدة واحدة محددة بالمسار بالإضافة إلى
ملخصات الأبناء لأدوات التعمق. وتنتقل بيانات التوثيق الوصفية `title`/`description`
عبر الكائنات المتداخلة، و`*`، وعناصر المصفوفة `[]`، وفروع `anyOf`/
`oneOf`/`allOf`. كما تُدمج مخططات Plugin والقنوات وقت التشغيل عندما
يُحمّل سجل manifest.

عند فشل التحقق:

- لا تقلع Gateway
- لا تعمل إلا الأوامر التشخيصية (`openclaw doctor` و`openclaw logs` و`openclaw health` و`openclaw status`)
- شغّل `openclaw doctor` لرؤية المشكلات الدقيقة
- شغّل `openclaw doctor --fix` (أو `--yes`) لتطبيق الإصلاحات

تحتفظ Gateway بنسخة موثوقة من آخر إعداد صالح بعد كل بدء تشغيل ناجح.
إذا فشل `openclaw.json` لاحقًا في التحقق (أو فقد `gateway.mode`، أو تقلص
بشكل حاد، أو سبقته سطر سجل عارض)، فإن OpenClaw يحتفظ بالملف المعطوب
باسم `.clobbered.*`، ويستعيد آخر نسخة صالحة معروفة، ويسجل سبب الاستعادة.
كما يتلقى دور الوكيل التالي أيضًا تحذير حدث نظام بحيث لا يقوم الوكيل الرئيسي
بإعادة كتابة الإعداد المستعاد بشكل أعمى. ويتم تخطي ترقية النسخة إلى آخر نسخة صالحة معروفة
عندما يحتوي المرشح على عناصر نائبة لأسرار محجوبة مثل `***`.

## المهام الشائعة

<AccordionGroup>
  <Accordion title="إعداد قناة (WhatsApp، Telegram، Discord، إلخ)">
    لكل قناة قسم إعداد خاص بها تحت `channels.<provider>`. راجع الصفحة المخصصة للقناة لمعرفة خطوات الإعداد:

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

    تشترك جميع القنوات في نمط سياسة الرسائل الخاصة نفسه:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // فقط لـ allowlist/open
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

    - يعرّف `agents.defaults.models` كتالوج النماذج ويعمل كقائمة سماح للأمر `/model`.
    - استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات إلى قائمة السماح دون إزالة النماذج الموجودة. ويتم رفض الاستبدالات العادية التي قد تزيل إدخالات ما لم تمرر `--replace`.
    - تستخدم مراجع النماذج تنسيق `provider/model` (مثل `anthropic/claude-opus-4-6`).
    - يتحكم `agents.defaults.imageMaxDimensionPx` في تصغير صور transcript/الأدوات (الافتراضي `1200`)؛ وعادةً ما تقلل القيم الأدنى استخدام رموز الرؤية في التشغيلات الثقيلة بلقطات الشاشة.
    - راجع [CLI الخاصة بالنماذج](/ar/concepts/models) لتبديل النماذج في الدردشة و[Model Failover](/ar/concepts/model-failover) لمعرفة سلوك دوران المصادقة والبدائل.
    - بالنسبة إلى المزوّدين المخصصين/المستضافين ذاتيًا، راجع [المزوّدون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls) في المرجع.

  </Accordion>

  <Accordion title="التحكم في من يمكنه مراسلة البوت">
    يتم التحكم في الوصول إلى الرسائل الخاصة لكل قناة عبر `dmPolicy`:

    - `"pairing"` (الافتراضي): يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة للموافقة
    - `"allowlist"`: فقط المرسلون الموجودون في `allowFrom` (أو مخزن السماح المقترن)
    - `"open"`: السماح بجميع الرسائل الخاصة الواردة (يتطلب `allowFrom: ["*"]`)
    - `"disabled"`: تجاهل جميع الرسائل الخاصة

    بالنسبة إلى المجموعات، استخدم `groupPolicy` + `groupAllowFrom` أو قوائم السماح الخاصة بالقناة.

    راجع [المرجع الكامل](/ar/gateway/config-channels#dm-and-group-access) للحصول على التفاصيل الخاصة بكل قناة.

  </Accordion>

  <Accordion title="إعداد ضبط الإشارات في الدردشة الجماعية">
    تكون رسائل المجموعات افتراضيًا في وضع **تتطلب إشارة**. اضبط الأنماط لكل وكيل:

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

    - **الإشارات الوصفية**: إشارات @ الأصلية (الضغط للإشارة في WhatsApp، و@bot في Telegram، وما إلى ذلك)
    - **أنماط النص**: أنماط regex الآمنة في `mentionPatterns`
    - راجع [المرجع الكامل](/ar/gateway/config-channels#group-chat-mention-gating) لمعرفة التجاوزات الخاصة بكل قناة ووضع self-chat.

  </Accordion>

  <Accordion title="تقييد Skills لكل وكيل">
    استخدم `agents.defaults.skills` لخط أساس مشترك، ثم تجاوز
    وكلاء محددين عبر `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // يرث github, weather
          { id: "docs", skills: ["docs-search"] }, // يستبدل القيم الافتراضية
          { id: "locked-down", skills: [] }, // بدون Skills
        ],
      },
    }
    ```

    - احذف `agents.defaults.skills` للحصول على Skills غير مقيّدة افتراضيًا.
    - احذف `agents.list[].skills` للوراثة من القيم الافتراضية.
    - اضبط `agents.list[].skills: []` لعدم وجود أي Skills.
    - راجع [Skills](/ar/tools/skills)، و[إعداد Skills](/ar/tools/skills-config)،
      و[مرجع الإعداد](/ar/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="ضبط مراقبة صحة قنوات gateway">
    تحكم في مدى شدة إعادة تشغيل gateway للقنوات التي تبدو راكدة:

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

    - اضبط `gateway.channelHealthCheckMinutes: 0` لتعطيل إعادة التشغيل عبر مراقبة الصحة عالميًا.
    - يجب أن تكون `channelStaleEventThresholdMinutes` أكبر من أو مساوية لفاصل التحقق.
    - استخدم `channels.<provider>.healthMonitor.enabled` أو `channels.<provider>.accounts.<id>.healthMonitor.enabled` لتعطيل إعادة التشغيل التلقائي لقناة أو حساب واحد دون تعطيل المراقب العام.
    - راجع [الفحوصات الصحية](/ar/gateway/health) لتصحيح أخطاء التشغيل و[المرجع الكامل](/ar/gateway/configuration-reference#gateway) لجميع الحقول.

  </Accordion>

  <Accordion title="إعداد الجلسات وعمليات إعادة الضبط">
    تتحكم الجلسات في استمرارية المحادثة وعزلها:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // موصى به لعدة مستخدمين
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
    - `threadBindings`: القيم الافتراضية العامة لتوجيه الجلسات المرتبط بالخيوط (يدعم Discord الأوامر `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`).
    - راجع [إدارة الجلسات](/ar/concepts/session) لمعرفة النطاق، وروابط الهوية، وسياسة الإرسال.
    - راجع [المرجع الكامل](/ar/gateway/config-agents#session) لجميع الحقول.

  </Accordion>

  <Accordion title="تفعيل sandboxing">
    شغّل جلسات الوكيل داخل بيئات sandbox معزولة:

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

    ابنِ الصورة أولًا: `scripts/sandbox-setup.sh`

    راجع [Sandboxing](/ar/gateway/sandboxing) للدليل الكامل و[المرجع الكامل](/ar/gateway/config-agents#agentsdefaultssandbox) لجميع الخيارات.

  </Accordion>

  <Accordion title="تفعيل push المدعوم بـ relay لإصدارات iOS الرسمية">
    يتم إعداد push المدعوم بـ relay في `openclaw.json`.

    اضبط هذا في إعداد gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // اختياري. الافتراضي: 10000
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

    - يسمح للـ gateway بإرسال `push.test` وتنبيهات الإيقاظ وإيقاظات إعادة الاتصال عبر relay الخارجي.
    - يستخدم إذن إرسال محدد النطاق للتسجيل يتم تمريره من تطبيق iOS المقترن. لا تحتاج gateway إلى رمز relay على مستوى النشر بالكامل.
    - يربط كل تسجيل مدعوم بـ relay بهوية gateway التي اقترن بها تطبيق iOS، بحيث لا يمكن لـ gateway أخرى إعادة استخدام التسجيل المخزن.
    - يُبقي الإصدارات المحلية/اليدوية من iOS على APNs المباشر. ولا ينطبق الإرسال المدعوم بـ relay إلا على الإصدارات الرسمية الموزعة التي سُجلت عبر relay.
    - يجب أن يطابق عنوان URL الأساسي لـ relay المضمَّن في إصدار iOS الرسمي/TestFlight، بحيث يصل تسجيل التطبيق وحركة الإرسال إلى نشر relay نفسه.

    التدفق الكامل من البداية إلى النهاية:

    1. ثبّت إصدار iOS رسميًا/TestFlight تم تجميعه باستخدام عنوان URL الأساسي نفسه لـ relay.
    2. اضبط `gateway.push.apns.relay.baseUrl` على gateway.
    3. اقترن تطبيق iOS مع gateway واترك جلسات node وoperator تتصلان كلتاهما.
    4. يجلب تطبيق iOS هوية gateway، ويسجل مع relay باستخدام App Attest بالإضافة إلى إيصال التطبيق، ثم ينشر بعد ذلك حمولة `push.apns.register` المدعومة بـ relay إلى gateway المقترنة.
    5. تخزّن gateway معرّف relay وإذن الإرسال، ثم تستخدمهما في `push.test` وتنبيهات الإيقاظ وإيقاظات إعادة الاتصال.

    ملاحظات تشغيلية:

    - إذا بدّلت تطبيق iOS إلى gateway مختلفة، فأعد توصيل التطبيق حتى يتمكن من نشر تسجيل relay جديد مرتبط بتلك gateway.
    - إذا أصدرت نسخة iOS جديدة تشير إلى نشر relay مختلف، فسيقوم التطبيق بتحديث تسجيل relay المخزن مؤقتًا بدلًا من إعادة استخدام مصدر relay القديم.

    ملاحظة التوافق:

    - لا يزال `OPENCLAW_APNS_RELAY_BASE_URL` و`OPENCLAW_APNS_RELAY_TIMEOUT_MS` يعملان كتجاوزات env مؤقتة.
    - يظل `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` منفذًا تطويريًا خاصًا بـ loopback فقط؛ لا تحتفظ بعناوين URL من نوع HTTP لـ relay داخل الإعداد.

    راجع [تطبيق iOS](/ar/platforms/ios#relay-backed-push-for-official-builds) لمعرفة التدفق الكامل و[تدفق المصادقة والثقة](/ar/platforms/ios#authentication-and-trust-flow) لمعرفة نموذج الأمان الخاص بـ relay.

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
    - `target`: `last` | `none` | `<channel-id>` (مثل `discord` أو `matrix` أو `telegram` أو `whatsapp`)
    - `directPolicy`: `allow` (الافتراضي) أو `block` لأهداف Heartbeat ذات نمط الرسائل الخاصة
    - راجع [Heartbeat](/ar/gateway/heartbeat) للدليل الكامل.

  </Accordion>

  <Accordion title="إعداد وظائف Cron">
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

    - `sessionRetention`: تشذيب جلسات التشغيل المعزولة المكتملة من `sessions.json` (الافتراضي `24h`؛ اضبط `false` للتعطيل).
    - `runLog`: تشذيب `cron/runs/<jobId>.jsonl` حسب الحجم وعدد الأسطر المحتفَظ بها.
    - راجع [وظائف Cron](/ar/automation/cron-jobs) للاطلاع على نظرة عامة على الميزة وأمثلة CLI.

  </Accordion>

  <Accordion title="إعداد Webhooks (Hooks)">
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
    - تعامل مع كل محتوى حمولات hook/webhook على أنه إدخال غير موثوق.
    - استخدم `hooks.token` مخصصًا؛ لا تعِد استخدام رمز Gateway المشترك.
    - تكون مصادقة Hook عبر الرؤوس فقط (`Authorization: Bearer ...` أو `x-openclaw-token`)؛ ويتم رفض الرموز في سلاسل الاستعلام.
    - لا يمكن أن يكون `hooks.path` هو `/`؛ أبقِ إدخال webhook على مسار فرعي مخصص مثل `/hooks`.
    - أبقِ أعلام تجاوز المحتوى غير الآمن معطّلة (`hooks.gmail.allowUnsafeExternalContent` و`hooks.mappings[].allowUnsafeExternalContent`) ما لم تكن تقوم بتصحيح أخطاء محكم النطاق.
    - إذا فعّلت `hooks.allowRequestSessionKey`، فاضبط أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد مفاتيح الجلسات التي يختارها المستدعي.
    - بالنسبة إلى الوكلاء المعتمدين على hook، فضّل مستويات النماذج الحديثة القوية وسياسة أدوات صارمة (مثل المراسلة فقط مع sandboxing كلما أمكن).

    راجع [المرجع الكامل](/ar/gateway/configuration-reference#hooks) لجميع خيارات mapping وتكامل Gmail.

  </Accordion>

  <Accordion title="إعداد التوجيه متعدد الوكلاء">
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

    راجع [Multi-Agent](/ar/concepts/multi-agent) و[المرجع الكامل](/ar/gateway/config-agents#multi-agent-routing) لمعرفة قواعد الربط وملفات الوصول الخاصة بكل وكيل.

  </Accordion>

  <Accordion title="تقسيم الإعداد إلى عدة ملفات ($include)">
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
    - **مصفوفة ملفات**: تُدمج دمجًا عميقًا بالترتيب (والأخير يفوز)
    - **المفاتيح الشقيقة**: تُدمج بعد include (وتتجاوز القيم المضمّنة)
    - **الـ includes المتداخلة**: مدعومة حتى عمق 10 مستويات
    - **المسارات النسبية**: تُحل نسبةً إلى الملف الذي يتضمنها
    - **عمليات الكتابة التي يملكها OpenClaw**: عندما يغيّر أحد عمليات الكتابة قسمًا واحدًا فقط من المستوى الأعلى
      مدعومًا بـ include من ملف واحد مثل `plugins: { $include: "./plugins.json5" }`,
      يقوم OpenClaw بتحديث ذلك الملف المضمّن ويترك `openclaw.json` كما هو
    - **الكتابة العابرة غير المدعومة**: تؤدي include الجذرية، ومصفوفات include، وعمليات include
      ذات التجاوزات الشقيقة إلى الفشل بشكل مغلق في عمليات الكتابة التي يملكها OpenClaw بدلًا من
      تسطيح الإعداد
    - **معالجة الأخطاء**: أخطاء واضحة للملفات المفقودة، وأخطاء التحليل، وعمليات include الدائرية

  </Accordion>
</AccordionGroup>

## إعادة التحميل الساخنة للإعداد

تراقب Gateway الملف `~/.openclaw/openclaw.json` وتطبّق التغييرات تلقائيًا — لا حاجة إلى إعادة تشغيل يدوية لمعظم الإعدادات.

تُعامل تعديلات الملفات المباشرة على أنها غير موثوقة إلى أن تجتاز التحقق. ينتظر المراقب
حتى تهدأ فوضى الكتابة المؤقتة/إعادة التسمية الخاصة بالمحرر، ثم يقرأ الملف النهائي، ويرفض
التعديلات الخارجية غير الصالحة عبر استعادة آخر إعداد صالح معروف. وتستخدم عمليات كتابة الإعداد
التي يملكها OpenClaw بوابة المخطط نفسها قبل الكتابة؛ كما تُرفض عمليات الإتلاف
مثل إسقاط `gateway.mode` أو تقليص الملف بأكثر من النصف
وتُحفظ باسم `.rejected.*` للفحص.

إذا رأيت `Config auto-restored from last-known-good` أو
`config reload restored last-known-good config` في السجلات، فافحص
الملف المطابق `.clobbered.*` بجانب `openclaw.json`، ثم أصلح الحمولة المرفوضة، وبعدها شغّل
`openclaw config validate`. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-restored-last-known-good-config)
للاطلاع على قائمة التحقق الخاصة بالاستعادة.

### أوضاع إعادة التحميل

| الوضع                  | السلوك                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (الافتراضي) | يطبّق التغييرات الآمنة فورًا. ويعيد التشغيل تلقائيًا للتغييرات الحرجة.                |
| **`hot`**              | يطبّق التغييرات الآمنة فقط. ويسجل تحذيرًا عند الحاجة إلى إعادة التشغيل — وأنت تتولى ذلك. |
| **`restart`**          | يعيد تشغيل Gateway عند أي تغيير في الإعداد، سواء كان آمنًا أم لا.                      |
| **`off`**              | يعطل مراقبة الملفات. وتصبح التغييرات فعالة عند إعادة التشغيل اليدوية التالية.         |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ما الذي يطبَّق ساخنًا وما الذي يحتاج إلى إعادة تشغيل

تُطبَّق معظم الحقول ساخنًا من دون توقف. في وضع `hybrid`، تتم معالجة التغييرات التي تتطلب إعادة تشغيل تلقائيًا.

| الفئة             | الحقول                                                            | هل يلزم إعادة تشغيل؟ |
| ----------------- | ----------------------------------------------------------------- | -------------------- |
| القنوات           | `channels.*`, `web` (WhatsApp) — جميع القنوات المضمّنة وقنوات Plugin | لا                   |
| الوكيل والنماذج   | `agent`, `agents`, `models`, `routing`                            | لا                   |
| الأتمتة           | `hooks`, `cron`, `agent.heartbeat`                                | لا                   |
| الجلسات والرسائل  | `session`, `messages`                                             | لا                   |
| الأدوات والوسائط  | `tools`, `browser`, `skills`, `audio`, `talk`                     | لا                   |
| UI ومتفرقات       | `ui`, `logging`, `identity`, `bindings`                           | لا                   |
| خادم Gateway      | `gateway.*` (المنفذ، والربط، والمصادقة، وTailscale، وTLS، وHTTP)   | **نعم**             |
| البنية التحتية    | `discovery`, `canvasHost`, `plugins`                              | **نعم**             |

<Note>
يُعد `gateway.reload` و`gateway.remote` استثناءين — فتغييرهما **لا** يؤدي إلى إعادة تشغيل.
</Note>

### تخطيط إعادة التحميل

عندما تحرر ملف مصدر مشارًا إليه عبر `$include`، يخطط OpenClaw
إعادة التحميل انطلاقًا من التخطيط المؤلَّف في المصدر، لا من العرض المسطّح داخل الذاكرة.
وهذا يبقي قرارات إعادة التحميل الساخنة (تطبيق ساخن مقابل إعادة تشغيل) قابلة للتوقع حتى عندما
يعيش قسم واحد من المستوى الأعلى في ملف مضمَّن خاص به مثل
`plugins: { $include: "./plugins.json5" }`. ويفشل تخطيط إعادة التحميل بشكل مغلق إذا كان
تخطيط المصدر ملتبسًا.

## RPC الخاصة بالإعداد (تحديثات برمجية)

بالنسبة إلى الأدوات التي تكتب الإعداد عبر واجهة API الخاصة بـ gateway، فالأفضل استخدام هذا التدفق:

- `config.schema.lookup` لفحص شجرة فرعية واحدة (عقدة مخطط سطحية + ملخصات
  الأبناء)
- `config.get` لجلب اللقطة الحالية مع `hash`
- `config.patch` للتحديثات الجزئية (JSON merge patch: تندمج الكائنات، و`null`
  يحذف، والمصفوفات تُستبدل)
- استخدم `config.apply` فقط عندما تنوي استبدال الإعداد بالكامل
- `update.run` لتنفيذ التحديث الذاتي الصريح + إعادة التشغيل

<Note>
تخضع كتابات control-plane (`config.apply` و`config.patch` و`update.run`) لتحديد معدل
بواقع 3 طلبات لكل 60 ثانية لكل `deviceId+clientIp`. كما تُدمج طلبات إعادة التشغيل
ثم تفرض فترة تهدئة مقدارها 30 ثانية بين دورات إعادة التشغيل.
</Note>

مثال على patch جزئي:

```bash
openclaw gateway call config.get --params '{}'  # التقاط payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

يقبل كل من `config.apply` و`config.patch` الوسائط `raw` و`baseHash` و`sessionKey`,
و`note`، و`restartDelayMs`. ويكون `baseHash` مطلوبًا للطريقتين عندما
يكون هناك إعداد موجود بالفعل.

## متغيرات البيئة

يقرأ OpenClaw متغيرات env من العملية الأب بالإضافة إلى:

- `.env` من دليل العمل الحالي (إن وجد)
- `~/.openclaw/.env` (بديل احتياطي عام)

لا يقوم أي من الملفين بتجاوز متغيرات env الموجودة بالفعل. ويمكنك أيضًا ضبط متغيرات env داخل الإعداد:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="استيراد env الخاصة بالـ shell (اختياري)">
  إذا كان هذا مفعّلًا ولم تكن المفاتيح المتوقعة مضبوطة، فسيقوم OpenClaw بتشغيل shell تسجيل الدخول لديك واستيراد المفاتيح المفقودة فقط:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

المكافئ في متغيرات env: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="استبدال متغيرات env في قيم الإعداد">
  أشر إلى متغيرات env في أي قيمة سلسلة داخل الإعداد باستخدام `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

القواعد:

- لا تُطابَق إلا الأسماء المكتوبة بأحرف كبيرة: `[A-Z_][A-Z0-9_]*`
- تؤدي المتغيرات المفقودة/الفارغة إلى إطلاق خطأ وقت التحميل
- استخدم `$${VAR}` للحصول على خرج حرفي
- يعمل هذا داخل ملفات `$include`
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
كما تُسرد مسارات بيانات الاعتماد المدعومة في [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Accordion>

راجع [البيئة](/ar/help/environment) لمعرفة الترتيب الكامل للأولوية والمصادر.

## المرجع الكامل

للحصول على المرجع الكامل لكل الحقول واحدًا واحدًا، راجع **[مرجع الإعداد](/ar/gateway/configuration-reference)**.

---

_ذو صلة: [أمثلة الإعداد](/ar/gateway/configuration-examples) · [مرجع الإعداد](/ar/gateway/configuration-reference) · [Doctor](/ar/gateway/doctor)_

## ذو صلة

- [مرجع الإعداد](/ar/gateway/configuration-reference)
- [أمثلة الإعداد](/ar/gateway/configuration-examples)
- [دليل تشغيل Gateway](/ar/gateway)
