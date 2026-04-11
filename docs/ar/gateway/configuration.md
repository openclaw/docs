---
read_when:
    - إعداد OpenClaw للمرة الأولى
    - البحث عن أنماط الإعداد الشائعة
    - الانتقال إلى أقسام إعداد محددة
summary: 'نظرة عامة على الإعداد: المهام الشائعة، الإعداد السريع، وروابط إلى المرجع الكامل'
title: الإعداد
x-i18n:
    generated_at: "2026-04-11T02:44:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: e874be80d11b9123cac6ce597ec02667fbc798f622a076f68535a1af1f0e399c
    source_path: gateway/configuration.md
    workflow: 15
---

# الإعداد

يقرأ OpenClaw إعدادًا اختياريًا بصيغة <Tooltip tip="تدعم JSON5 التعليقات والفواصل اللاحقة">**JSON5**</Tooltip> من `~/.openclaw/openclaw.json`.

إذا كان الملف مفقودًا، يستخدم OpenClaw إعدادات افتراضية آمنة. من الأسباب الشائعة لإضافة إعداد:

- توصيل القنوات والتحكم في من يمكنه مراسلة البوت
- ضبط النماذج والأدوات والعزل أو الأتمتة (cron، وhooks)
- ضبط الجلسات والوسائط والشبكات أو واجهة المستخدم

راجع [المرجع الكامل](/ar/gateway/configuration-reference) لكل حقل متاح.

<Tip>
**هل أنت جديد على الإعداد؟** ابدأ بـ `openclaw onboard` للإعداد التفاعلي، أو اطّلع على دليل [أمثلة الإعداد](/ar/gateway/configuration-examples) للحصول على إعدادات كاملة جاهزة للنسخ واللصق.
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
    openclaw onboard       # تدفق الإعداد الكامل
    openclaw configure     # معالج الإعداد
    ```
  </Tab>
  <Tab title="CLI (أوامر مختصرة)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="واجهة التحكم">
    افتح [http://127.0.0.1:18789](http://127.0.0.1:18789) واستخدم علامة تبويب **Config**.
    تعرض واجهة التحكم نموذجًا من مخطط الإعداد المباشر، بما في ذلك بيانات توثيق الحقول `title` / `description` بالإضافة إلى مخططات plugins والقنوات عند
    توفرها، مع محرر **Raw JSON** كخيار احتياطي. ولواجهات
    التعمق في التفاصيل وغيرها من الأدوات، تكشف البوابة أيضًا عن `config.schema.lookup`
    لجلب عقدة مخطط واحدة محددة بمسار، بالإضافة إلى ملخصات العناصر الفرعية المباشرة.
  </Tab>
  <Tab title="تعديل مباشر">
    عدّل `~/.openclaw/openclaw.json` مباشرة. تراقب البوابة الملف وتطبّق التغييرات تلقائيًا (راجع [إعادة التحميل السريع](#config-hot-reload)).
  </Tab>
</Tabs>

## التحقق الصارم

<Warning>
لا يقبل OpenClaw إلا الإعدادات التي تطابق المخطط بالكامل. تؤدي المفاتيح غير المعروفة أو الأنواع غير الصحيحة أو القيم غير الصالحة إلى أن **ترفض البوابة البدء**. الاستثناء الوحيد على مستوى الجذر هو `$schema` (سلسلة نصية)، حتى تتمكن المحررات من إرفاق بيانات JSON Schema الوصفية.
</Warning>

ملاحظات أدوات المخطط:

- يطبع `openclaw config schema` نفس عائلة JSON Schema المستخدمة في واجهة التحكم
  والتحقق من الإعداد.
- اعتبر خرج هذا المخطط العقد المقروء آليًا الرسمي لملف
  `openclaw.json`؛ فهذه النظرة العامة ومرجع الإعداد يوجزان محتواه.
- تُنقل قيم الحقلين `title` و`description` إلى خرج المخطط من أجل
  المحررات وأدوات النماذج.
- ترث إدخالات الكائنات المتداخلة، وأحرف البدل (`*`)، وعناصر المصفوفات (`[]`) نفس
  بيانات التوثيق الوصفية حيثما وُجد توثيق للحقل المطابق.
- ترث فروع التركيب `anyOf` / `oneOf` / `allOf` نفس
  بيانات التوثيق الوصفية أيضًا، بحيث تحتفظ متغيرات union/intersection بنفس مساعدة الحقول.
- يعيد `config.schema.lookup` مسار إعداد واحدًا مُطبّعًا مع عقدة مخطط
  سطحية (`title` و`description` و`type` و`enum` و`const` والحدود الشائعة
  وحقول تحقق مشابهة)، وبيانات تلميحات واجهة المستخدم المطابقة، وملخصات العناصر
  الفرعية المباشرة لأدوات التعمق في التفاصيل.
- تُدمج مخططات plugin/channel وقت التشغيل عندما تتمكن البوابة من تحميل
  سجل manifest الحالي.
- يكتشف `pnpm config:docs:check` الانحراف بين
  عناصر baseline الخاصة بالإعداد الموجّهة للتوثيق وسطح المخطط الحالي.

عند فشل التحقق:

- لا تقلع البوابة
- تعمل فقط أوامر التشخيص (`openclaw doctor` و`openclaw logs` و`openclaw health` و`openclaw status`)
- شغّل `openclaw doctor` لرؤية المشكلات الدقيقة
- شغّل `openclaw doctor --fix` (أو `--yes`) لتطبيق الإصلاحات

## المهام الشائعة

<AccordionGroup>
  <Accordion title="إعداد قناة (WhatsApp أو Telegram أو Discord وما إلى ذلك)">
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

    تشترك جميع القنوات في نفس نمط سياسة الرسائل الخاصة:

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

  <Accordion title="اختيار النماذج وضبطها">
    اضبط النموذج الأساسي وبدائل اختيارية:

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

    - يعرّف `agents.defaults.models` فهرس النماذج ويعمل كقائمة سماح لأمر `/model`.
    - تستخدم مراجع النماذج تنسيق `provider/model` (مثل `anthropic/claude-opus-4-6`).
    - يتحكم `agents.defaults.imageMaxDimensionPx` في تصغير صور السجل/الأداة (القيمة الافتراضية `1200`)؛ وعادةً ما تقلل القيم الأقل من استخدام رموز الرؤية في التشغيلات التي تكثر فيها لقطات الشاشة.
    - راجع [Models CLI](/ar/concepts/models) لتبديل النماذج في الدردشة و[Model Failover](/ar/concepts/model-failover) لمعرفة سلوك تدوير المصادقة والبدائل.
    - بالنسبة إلى المزوّدين المخصصين/المستضافين ذاتيًا، راجع [المزوّدون المخصصون](/ar/gateway/configuration-reference#custom-providers-and-base-urls) في المرجع.

  </Accordion>

  <Accordion title="التحكم في من يمكنه مراسلة البوت">
    يُتحكم في الوصول عبر الرسائل الخاصة لكل قناة من خلال `dmPolicy`:

    - `"pairing"` (الافتراضي): يحصل المرسلون غير المعروفين على رمز اقتران لمرة واحدة للموافقة
    - `"allowlist"`: فقط المرسلون الموجودون في `allowFrom` (أو مخزن السماح المقترن)
    - `"open"`: السماح بكل الرسائل الخاصة الواردة (يتطلب `allowFrom: ["*"]`)
    - `"disabled"`: تجاهل كل الرسائل الخاصة

    بالنسبة إلى المجموعات، استخدم `groupPolicy` مع `groupAllowFrom` أو قوائم السماح الخاصة بالقناة.

    راجع [المرجع الكامل](/ar/gateway/configuration-reference#dm-and-group-access) للتفاصيل الخاصة بكل قناة.

  </Accordion>

  <Accordion title="إعداد تقييد الإشارات في الدردشة الجماعية">
    تستخدم رسائل المجموعات افتراضيًا **اشتراط الإشارة**. اضبط الأنماط لكل وكيل:

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

    - **إشارات البيانات الوصفية**: إشارات @ الأصلية (@-mentions) ‏(الإشارة بالنقر في WhatsApp، وTelegram @bot، وما إلى ذلك)
    - **أنماط النص**: أنماط regex آمنة في `mentionPatterns`
    - راجع [المرجع الكامل](/ar/gateway/configuration-reference#group-chat-mention-gating) للتجاوزات الخاصة بكل قناة ووضع الدردشة الذاتية.

  </Accordion>

  <Accordion title="تقييد Skills لكل وكيل">
    استخدم `agents.defaults.skills` كخط أساس مشترك، ثم تجاوز إعدادات
    وكلاء محددين باستخدام `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // يرث github وweather
          { id: "docs", skills: ["docs-search"] }, // يستبدل الإعدادات الافتراضية
          { id: "locked-down", skills: [] }, // بدون Skills
        ],
      },
    }
    ```

    - احذف `agents.defaults.skills` للحصول على Skills غير مقيّدة افتراضيًا.
    - احذف `agents.list[].skills` لوراثة الإعدادات الافتراضية.
    - اضبط `agents.list[].skills: []` لعدم استخدام أي Skills.
    - راجع [Skills](/ar/tools/skills) و[إعداد Skills](/ar/tools/skills-config) و
      [مرجع الإعداد](/ar/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="ضبط مراقبة سلامة قنوات البوابة">
    تحكّم في مدى شدة إعادة تشغيل البوابة للقنوات التي تبدو متوقفة:

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

    - اضبط `gateway.channelHealthCheckMinutes: 0` لتعطيل عمليات إعادة التشغيل الخاصة بمراقبة السلامة عالميًا.
    - يجب أن تكون قيمة `channelStaleEventThresholdMinutes` أكبر من أو تساوي فترة التحقق.
    - استخدم `channels.<provider>.healthMonitor.enabled` أو `channels.<provider>.accounts.<id>.healthMonitor.enabled` لتعطيل إعادة التشغيل التلقائية لقناة أو حساب واحد دون تعطيل المراقبة العامة.
    - راجع [فحوصات السلامة](/ar/gateway/health) لتصحيح الأخطاء التشغيلية و[المرجع الكامل](/ar/gateway/configuration-reference#gateway) لجميع الحقول.

  </Accordion>

  <Accordion title="ضبط الجلسات وإعادة التعيين">
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

    - `dmScope`: ‏`main` (مشترك) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: الإعدادات الافتراضية العامة لتوجيه الجلسات المرتبط بالخيوط (يدعم Discord الأوامر `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`).
    - راجع [إدارة الجلسات](/ar/concepts/session) لمعرفة النطاق وروابط الهوية وسياسة الإرسال.
    - راجع [المرجع الكامل](/ar/gateway/configuration-reference#session) لجميع الحقول.

  </Accordion>

  <Accordion title="تمكين العزل">
    شغّل جلسات الوكلاء داخل حاويات Docker معزولة:

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

    أنشئ الصورة أولًا: `scripts/sandbox-setup.sh`

    راجع [العزل](/ar/gateway/sandboxing) للدليل الكامل و[المرجع الكامل](/ar/gateway/configuration-reference#agentsdefaultssandbox) لكل الخيارات.

  </Accordion>

  <Accordion title="تمكين الإشعارات الفورية المعتمدة على relay لإصدارات iOS الرسمية">
    تُضبط الإشعارات الفورية المعتمدة على relay في `openclaw.json`.

    اضبط ما يلي في إعداد البوابة:

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

    - يتيح للبوابة إرسال `push.test` وتنبيهات التنبيه والاستيقاظات الخاصة بإعادة الاتصال عبر relay خارجي.
- يستخدم تصريح إرسال مرتبطًا بالتسجيل ويمرره تطبيق iOS المقترن. لا تحتاج البوابة إلى رمز relay مخصص على مستوى النشر بالكامل.
- يربط كل تسجيل مدعوم بـ relay بهوية البوابة التي اقترن بها تطبيق iOS، بحيث لا يمكن لبوابة أخرى إعادة استخدام التسجيل المخزن.
- يُبقي إصدارات iOS المحلية/اليدوية على APNs المباشر. تنطبق الإرسالات المعتمدة على relay فقط على الإصدارات الرسمية الموزعة التي سُجلت عبر relay.
- يجب أن يتطابق مع عنوان URL الأساسي لـ relay المضمّن في إصدار iOS الرسمي/TestFlight، حتى تصل حركة التسجيل والإرسال إلى نفس نشر relay.

التدفق الكامل من البداية إلى النهاية:

1. ثبّت إصدار iOS رسميًا/TestFlight تم تجميعه باستخدام نفس عنوان URL الأساسي لـ relay.
2. اضبط `gateway.push.apns.relay.baseUrl` على البوابة.
3. اقترن تطبيق iOS بالبوابة ودع كلًا من جلسات العقدة والمشغّل تتصل.
4. يجلب تطبيق iOS هوية البوابة، ويسجل لدى relay باستخدام App Attest مع إيصال التطبيق، ثم ينشر حمولة `push.apns.register` المعتمدة على relay إلى البوابة المقترنة.
5. تخزن البوابة مقبض relay وتصريح الإرسال، ثم تستخدمهما في `push.test` وتنبيهات التنبيه واستيقاظات إعادة الاتصال.

ملاحظات تشغيلية:

- إذا بدّلت تطبيق iOS إلى بوابة مختلفة، فأعد توصيل التطبيق حتى يتمكن من نشر تسجيل relay جديد مرتبط بتلك البوابة.
- إذا أصدرت إصدار iOS جديدًا يشير إلى نشر relay مختلف، فسيقوم التطبيق بتحديث تسجيل relay المخزن مؤقتًا بدلًا من إعادة استخدام مصدر relay القديم.

ملاحظة التوافق:

- ما زال `OPENCLAW_APNS_RELAY_BASE_URL` و`OPENCLAW_APNS_RELAY_TIMEOUT_MS` يعملان كتجاوزات مؤقتة عبر env.
- يظل `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` منفذ هروب للتطوير مخصصًا لـ loopback فقط؛ لا تحفظ عناوين URL الخاصة بـ HTTP relay في الإعداد.

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

    - `every`: سلسلة مدة (`30m`، `2h`). اضبط `0m` للتعطيل.
    - `target`: ‏`last` | `none` | `<channel-id>` (على سبيل المثال `discord` أو `matrix` أو `telegram` أو `whatsapp`)
    - `directPolicy`: ‏`allow` (الافتراضي) أو `block` لأهداف heartbeat ذات نمط الرسائل الخاصة
    - راجع [Heartbeat](/ar/gateway/heartbeat) للدليل الكامل.

  </Accordion>

  <Accordion title="ضبط مهام cron">
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

    - `sessionRetention`: إزالة جلسات التشغيل المعزولة المكتملة من `sessions.json` (الافتراضي `24h`؛ اضبط `false` للتعطيل).
    - `runLog`: تقليم `cron/runs/<jobId>.jsonl` حسب الحجم وعدد الأسطر المحتفظ بها.
    - راجع [مهام Cron](/ar/automation/cron-jobs) لنظرة عامة على الميزة وأمثلة CLI.

  </Accordion>

  <Accordion title="إعداد webhooks ‏(hooks)">
    فعّل نقاط نهاية HTTP webhook على البوابة:

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
    - مصادقة Hook تعتمد على الترويسة فقط (`Authorization: Bearer ...` أو `x-openclaw-token`)؛ ورموز سلسلة الاستعلام مرفوضة.
    - لا يمكن أن يكون `hooks.path` هو `/`؛ أبقِ إدخال webhook على مسار فرعي مخصص مثل `/hooks`.
    - أبقِ علامات تجاوز المحتوى غير الآمن معطّلة (`hooks.gmail.allowUnsafeExternalContent` و`hooks.mappings[].allowUnsafeExternalContent`) ما لم تكن تجري تصحيح أخطاء محدود النطاق بإحكام.
    - إذا فعّلت `hooks.allowRequestSessionKey`، فاضبط أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد مفاتيح الجلسات التي يحددها المستدعي.
    - بالنسبة إلى الوكلاء المعتمدين على hook، ففضّل طبقات النماذج الحديثة والقوية وسياسة أدوات صارمة (على سبيل المثال، المراسلة فقط مع العزل حيثما أمكن).

    راجع [المرجع الكامل](/ar/gateway/configuration-reference#hooks) لجميع خيارات التعيين وتكامل Gmail.

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

    راجع [Multi-Agent](/ar/concepts/multi-agent) و[المرجع الكامل](/ar/gateway/configuration-reference#multi-agent-routing) لقواعد الربط وملفات تعريف الوصول الخاصة بكل وكيل.

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
    - **مصفوفة من الملفات**: دمج عميق بالترتيب (اللاحق يفوز)
    - **المفاتيح المجاورة**: تُدمج بعد التضمينات (وتتجاوز القيم المضمّنة)
    - **التضمينات المتداخلة**: مدعومة حتى عمق 10 مستويات
    - **المسارات النسبية**: تُحل نسبةً إلى الملف الذي يتضمنها
    - **معالجة الأخطاء**: أخطاء واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية

  </Accordion>
</AccordionGroup>

## إعادة التحميل السريع للإعداد

تراقب البوابة `~/.openclaw/openclaw.json` وتطبّق التغييرات تلقائيًا — ولا حاجة إلى إعادة تشغيل يدوية لمعظم الإعدادات.

### أوضاع إعادة التحميل

| الوضع                  | السلوك                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (الافتراضي) | يطبّق التغييرات الآمنة فورًا. ويعيد التشغيل تلقائيًا للتغييرات الحرجة.                 |
| **`hot`**              | يطبّق التغييرات الآمنة فقط. ويسجل تحذيرًا عند الحاجة إلى إعادة تشغيل — وتتولى ذلك أنت. |
| **`restart`**          | يعيد تشغيل البوابة عند أي تغيير في الإعداد، سواء كان آمنًا أم لا.                      |
| **`off`**              | يعطّل مراقبة الملفات. تصبح التغييرات فعالة عند إعادة التشغيل اليدوية التالية.         |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ما الذي يُطبَّق مباشرة وما الذي يحتاج إلى إعادة تشغيل

تُطبَّق معظم الحقول مباشرة دون توقف. وفي وضع `hybrid`، تُعالَج التغييرات التي تتطلب إعادة تشغيل تلقائيًا.

| الفئة               | الحقول                                                               | هل يلزم إعادة تشغيل؟ |
| ------------------- | -------------------------------------------------------------------- | -------------------- |
| القنوات             | `channels.*`، `web` ‏(WhatsApp) — جميع القنوات المضمنة وقنوات extension | لا                   |
| الوكيل والنماذج     | `agent`، `agents`، `models`، `routing`                               | لا                   |
| الأتمتة             | `hooks`، `cron`، `agent.heartbeat`                                   | لا                   |
| الجلسات والرسائل    | `session`، `messages`                                                | لا                   |
| الأدوات والوسائط    | `tools`، `browser`، `skills`، `audio`، `talk`                        | لا                   |
| واجهة المستخدم ومتفرقات | `ui`، `logging`، `identity`، `bindings`                              | لا                   |
| خادم البوابة        | `gateway.*` ‏(المنفذ، الربط، المصادقة، tailscale، TLS، HTTP)          | **نعم**              |
| البنية التحتية      | `discovery`، `canvasHost`، `plugins`                                 | **نعم**              |

<Note>
`gateway.reload` و`gateway.remote` استثناءان — فتغييرهما **لا** يؤدي إلى إعادة تشغيل.
</Note>

## Config RPC ‏(تحديثات برمجية)

<Note>
تخضع RPC الخاصة بالكتابة على مستوى control-plane ‏(`config.apply` و`config.patch` و`update.run`) لتحديد معدل يبلغ **3 طلبات لكل 60 ثانية** لكل `deviceId+clientIp`. وعند الوصول إلى الحد، تعيد RPC القيمة `UNAVAILABLE` مع `retryAfterMs`.
</Note>

التدفق الآمن/الافتراضي:

- `config.schema.lookup`: فحص شجرة فرعية واحدة من الإعداد محددة بمسار مع عقدة مخطط
  سطحية، وبيانات تلميحات مطابقة، وملخصات العناصر الفرعية المباشرة
- `config.get`: جلب اللقطة الحالية + hash
- `config.patch`: المسار المفضل للتحديث الجزئي
- `config.apply`: استبدال الإعداد بالكامل فقط
- `update.run`: تحديث ذاتي صريح + إعادة تشغيل

عندما لا تستبدل الإعداد بالكامل، ففضّل `config.schema.lookup`
ثم `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (استبدال كامل)">
    يتحقق من الإعداد الكامل ويكتبه ثم يعيد تشغيل البوابة في خطوة واحدة.

    <Warning>
    يستبدل `config.apply` **الإعداد بالكامل**. استخدم `config.patch` للتحديثات الجزئية، أو `openclaw config set` للمفاتيح المفردة.
    </Warning>

    المعلمات:

    - `raw` (string) — حمولة JSON5 للإعداد بالكامل
    - `baseHash` (اختياري) — hash الإعداد من `config.get` (مطلوب عندما يكون الإعداد موجودًا)
    - `sessionKey` (اختياري) — مفتاح جلسة لتنبيه الاستيقاظ بعد إعادة التشغيل
    - `note` (اختياري) — ملاحظة لـ restart sentinel
    - `restartDelayMs` (اختياري) — التأخير قبل إعادة التشغيل (الافتراضي 2000)

    تُدمج طلبات إعادة التشغيل عندما يكون أحدها معلقًا/قيد التنفيذ بالفعل، ويُطبَّق تبريد لمدة 30 ثانية بين دورات إعادة التشغيل.

    ```bash
    openclaw gateway call config.get --params '{}'  # التقط payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (تحديث جزئي)">
    يدمج تحديثًا جزئيًا في الإعداد الحالي (بدلالات JSON merge patch):

    - تُدمج الكائنات بشكل تكراري
    - تحذف `null` مفتاحًا
    - تستبدل المصفوفات

    المعلمات:

    - `raw` (string) — JSON5 يحتوي فقط على المفاتيح المراد تغييرها
    - `baseHash` (مطلوب) — hash الإعداد من `config.get`
    - `sessionKey` و`note` و`restartDelayMs` — مثل `config.apply`

    سلوك إعادة التشغيل يطابق `config.apply`: دمج لعمليات إعادة التشغيل المعلقة، بالإضافة إلى تبريد لمدة 30 ثانية بين دورات إعادة التشغيل.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## متغيرات البيئة

يقرأ OpenClaw متغيرات env من العملية الأب إضافة إلى:

- `.env` من دليل العمل الحالي (إن وجد)
- `~/.openclaw/.env` ‏(احتياطي عام)

لا يتجاوز أي من الملفين متغيرات env الموجودة. يمكنك أيضًا تعيين متغيرات env مضمنة في الإعداد:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="استيراد env من الصدفة (اختياري)">
  إذا كان مفعّلًا ولم تكن المفاتيح المتوقعة مضبوطة، فسيشغّل OpenClaw صدفة تسجيل الدخول الخاصة بك ويستورد المفاتيح المفقودة فقط:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

المكافئ في متغير env: ‏`OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="استبدال متغيرات env في قيم الإعداد">
  أشر إلى متغيرات env في أي قيمة سلسلة نصية ضمن الإعداد باستخدام `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

القواعد:

- تُطابَق الأسماء المكتوبة بأحرف كبيرة فقط: `[A-Z_][A-Z0-9_]*`
- تؤدي المتغيرات المفقودة/الفارغة إلى خطأ عند وقت التحميل
- استخدم `$${VAR}` للحصول على خرج حرفي
- يعمل داخل ملفات `$include`
- الاستبدال المضمّن: ‏`"${BASE}/v1"` ← `"https://api.example.com/v1"`

</Accordion>

<Accordion title="مراجع الأسرار (env وfile وexec)">
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

توجد تفاصيل SecretRef ‏(بما في ذلك `secrets.providers` لـ `env` و`file` و`exec`) في [إدارة الأسرار](/ar/gateway/secrets).
وترد مسارات بيانات الاعتماد المدعومة في [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Accordion>

راجع [Environment](/ar/help/environment) لمعرفة الأولوية الكاملة والمصادر.

## المرجع الكامل

للاطلاع على المرجع الكامل حقلًا بحقل، راجع **[مرجع الإعداد](/ar/gateway/configuration-reference)**.

---

_ذو صلة: [أمثلة الإعداد](/ar/gateway/configuration-examples) · [مرجع الإعداد](/ar/gateway/configuration-reference) · [Doctor](/ar/gateway/doctor)_
