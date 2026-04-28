---
read_when:
    - إعداد OpenClaw للمرة الأولى
    - البحث عن أنماط التهيئة الشائعة
    - الانتقال إلى أقسام إعدادات محددة
summary: 'نظرة عامة على الإعدادات: المهام الشائعة، والإعداد السريع، وروابط إلى المرجع الكامل'
title: التهيئة
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:29:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc1148b93c00d30e34aad0ffb5e1d4dae5438a195a531f5247bbc9a261142350
    source_path: gateway/configuration.md
    workflow: 15
---

يقرأ OpenClaw إعدادات اختيارية بتنسيق <Tooltip tip="يدعم JSON5 التعليقات والفواصل الختامية">**JSON5**</Tooltip> من `~/.openclaw/openclaw.json`.
يجب أن يكون مسار الإعدادات النشط ملفًا عاديًا. ولا يتم دعم
تخطيطات `openclaw.json` المرتبطة برموز symlink لعمليات الكتابة التي يملكها OpenClaw؛ إذ قد تستبدل الكتابة الذرية
المسار بدلًا من الحفاظ على symlink. وإذا كنت تحتفظ بالإعدادات خارج
دليل الحالة الافتراضي، فوجّه `OPENCLAW_CONFIG_PATH` مباشرةً إلى الملف الحقيقي.

إذا كان الملف مفقودًا، يستخدم OpenClaw إعدادات افتراضية آمنة. ومن الأسباب الشائعة لإضافة إعدادات:

- ربط القنوات والتحكم في من يمكنه مراسلة الروبوت
- تعيين النماذج والأدوات وsandboxing والأتمتة (Cron، الخطافات)
- ضبط الجلسات والوسائط والشبكات أو واجهة المستخدم

راجع [المرجع الكامل](/ar/gateway/configuration-reference) لكل حقل متاح.

يجب على الوكلاء والأتمتة استخدام `config.schema.lookup` للحصول على
توثيق دقيق على مستوى الحقول قبل تعديل الإعدادات. استخدم هذه الصفحة
للإرشادات الموجّهة للمهام، واستخدم [مرجع التهيئة](/ar/gateway/configuration-reference) لخريطة
الحقول الأوسع والقيم الافتراضية.

<Tip>
**هل أنت جديد على الإعدادات؟** ابدأ باستخدام `openclaw onboard` للإعداد التفاعلي، أو اطّلع على دليل [أمثلة التهيئة](/ar/gateway/configuration-examples) للحصول على إعدادات كاملة قابلة للنسخ واللصق.
</Tip>

## الحد الأدنى من الإعدادات

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## تعديل الإعدادات

<Tabs>
  <Tab title="المعالج التفاعلي">
    ```bash
    openclaw onboard       # تدفق الإعداد الأولي الكامل
    openclaw configure     # معالج الإعدادات
    ```
  </Tab>
  <Tab title="CLI (أوامر مختصرة)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    افتح [http://127.0.0.1:18789](http://127.0.0.1:18789) واستخدم علامة التبويب **Config**.
    تعرض Control UI نموذجًا من schema الإعدادات الحية، بما في ذلك بيانات
    التوثيق الوصفية `title` / `description` الخاصة بالحقول بالإضافة إلى schemas الخاصة بـ Plugin والقنوات عند
    توفرها، مع محرر **Raw JSON** كخيار احتياطي. أما بالنسبة إلى
    واجهات drill-down وغيرها من الأدوات، فيوفّر Gateway أيضًا `config.schema.lookup` من أجل
    جلب عقدة schema واحدة محصورة بمسار معيّن بالإضافة إلى ملخصات الأبناء المباشرين.
  </Tab>
  <Tab title="تعديل مباشر">
    عدّل `~/.openclaw/openclaw.json` مباشرةً. يراقب Gateway الملف ويطبق التغييرات تلقائيًا (راجع [إعادة التحميل السريع](#config-hot-reload)).
  </Tab>
</Tabs>

## التحقق الصارم

<Warning>
لا يقبل OpenClaw إلا الإعدادات التي تطابق schema بالكامل. تؤدي المفاتيح غير المعروفة أو الأنواع غير الصحيحة أو القيم غير الصالحة إلى أن **يرفض Gateway بدء التشغيل**. والاستثناء الوحيد على مستوى الجذر هو `$schema` (سلسلة نصية)، حتى تتمكن المحررات من إرفاق بيانات JSON Schema الوصفية.
</Warning>

يطبع `openclaw config schema` مخطط JSON Schema القياسي المستخدم من قِبل Control UI
والتحقق. ويجلب `config.schema.lookup` عقدة واحدة محصورة بالمسار بالإضافة إلى
ملخصات الأبناء لأدوات drill-down. كما تنتقل بيانات التوثيق الوصفية `title`/`description` الخاصة بالحقول
عبر الكائنات المتداخلة وwildcard (`*`) وعناصر المصفوفة (`[]`) وفروع `anyOf`/
`oneOf`/`allOf`. ويتم دمج schemas الخاصة بـ Plugin والقنوات أثناء التشغيل عندما
يتم تحميل سجل manifest.

عندما يفشل التحقق:

- لا يقلع Gateway
- لا تعمل إلا أوامر التشخيص (`openclaw doctor` و`openclaw logs` و`openclaw health` و`openclaw status`)
- شغّل `openclaw doctor` لرؤية المشكلات الدقيقة
- شغّل `openclaw doctor --fix` (أو `--yes`) لتطبيق الإصلاحات

يحتفظ Gateway بنسخة موثوقة من آخر حالة سليمة معروفة بعد كل عملية بدء تشغيل ناجحة.
وإذا فشل `openclaw.json` لاحقًا في التحقق (أو أسقط `gateway.mode` أو تقلّص
بشكل حاد، أو احتوى على سطر سجل شارد في بدايته)، فإن OpenClaw يحفظ الملف المعطوب
باسم `.clobbered.*`، ويستعيد النسخة الأخيرة السليمة المعروفة، ويسجل سبب الاستعادة.
كما تتلقى دورة الوكيل التالية تحذيرًا كحدث نظام حتى لا يقوم الوكيل الرئيسي
بإعادة كتابة الإعدادات المستعادة بشكل أعمى. ويتم تجاوز الترقية إلى آخر نسخة سليمة معروفة
عندما يحتوي المرشح على عناصر نائبة منقّحة للأسرار مثل `***`.
وعندما تكون كل مشكلات التحقق محصورة ضمن `plugins.entries.<id>...`، لا يقوم OpenClaw
بإجراء استعادة للملف كاملًا. بل يبقي الإعدادات الحالية نشطة ويعرض الفشل المحلي الخاص بـ Plugin حتى لا يؤدي عدم تطابق schema الخاص بـ Plugin أو إصدار المضيف إلى التراجع عن إعدادات مستخدم أخرى غير ذات صلة.

## المهام الشائعة

<AccordionGroup>
  <Accordion title="إعداد قناة (WhatsApp أو Telegram أو Discord أو غيرها)">
    لكل قناة قسم إعدادات خاص بها تحت `channels.<provider>`. راجع صفحة القناة المخصصة لخطوات الإعداد:

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

    تشترك جميع القنوات في نمط سياسة DM نفسه:

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

  <Accordion title="اختيار النماذج وتهيئتها">
    عيّن النموذج الأساسي وخيارات fallback الاختيارية:

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

    - يعرّف `agents.defaults.models` كتالوج النماذج ويعمل كقائمة سماح لأمر `/model`.
    - استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات إلى قائمة السماح بدون إزالة النماذج الموجودة. ويتم رفض عمليات الاستبدال العادية التي قد تزيل إدخالات ما لم تمرر `--replace`.
    - تستخدم مراجع النماذج تنسيق `provider/model` (مثل `anthropic/claude-opus-4-6`).
    - يتحكم `agents.defaults.imageMaxDimensionPx` في تصغير صور السجل/الأدوات (الافتراضي `1200`)؛ وعادةً ما تقلل القيم الأدنى استخدام vision-token في التشغيلات الثقيلة باللقطات.
    - راجع [CLI الخاصة بالنماذج](/ar/concepts/models) لتبديل النماذج في المحادثة و[Model Failover](/ar/concepts/model-failover) لمعرفة تدوير المصادقة وسلوك fallback.
    - بالنسبة إلى المزوّدين المخصصين/المستضافين ذاتيًا، راجع [المزوّدون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls) في المرجع.

  </Accordion>

  <Accordion title="التحكم في من يمكنه مراسلة الروبوت">
    يتم التحكم في وصول DM لكل قناة عبر `dmPolicy`:

    - `"pairing"` (الافتراضي): يحصل المرسلون غير المعروفين على رمز pairing لمرة واحدة للموافقة
    - `"allowlist"`: يسمح فقط للمرسلين الموجودين في `allowFrom` (أو في مخزن السماح المقترن)
    - `"open"`: السماح بجميع الرسائل الواردة في DM (يتطلب `allowFrom: ["*"]`)
    - `"disabled"`: تجاهل جميع الرسائل الخاصة

    بالنسبة إلى المجموعات، استخدم `groupPolicy` + `groupAllowFrom` أو قوائم السماح الخاصة بالقناة.

    راجع [المرجع الكامل](/ar/gateway/config-channels#dm-and-group-access) للتفاصيل الخاصة بكل قناة.

  </Accordion>

  <Accordion title="إعداد بوابة الإشارة في الدردشات الجماعية">
    تكون رسائل المجموعات افتراضيًا **تتطلب إشارة**. قم بتهيئة الأنماط لكل وكيل:

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

    - **إشارات البيانات الوصفية**: إشارات @ الأصلية (مثل tap-to-mention في WhatsApp، و@bot في Telegram، وما إلى ذلك)
    - **أنماط النص**: أنماط regex آمنة في `mentionPatterns`
    - راجع [المرجع الكامل](/ar/gateway/config-channels#group-chat-mention-gating) لمعرفة التجاوزات الخاصة بكل قناة ووضع self-chat.

  </Accordion>

  <Accordion title="تقييد Skills لكل وكيل">
    استخدم `agents.defaults.skills` كخط أساس مشترك، ثم تجاوز
    وكلاء محددين باستخدام `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // يرث github وweather
          { id: "docs", skills: ["docs-search"] }, // يستبدل القيم الافتراضية
          { id: "locked-down", skills: [] }, // بدون Skills
        ],
      },
    }
    ```

    - احذف `agents.defaults.skills` إذا أردت Skills غير مقيّدة افتراضيًا.
    - احذف `agents.list[].skills` لوراثة القيم الافتراضية.
    - اضبط `agents.list[].skills: []` لعدم السماح بأي Skills.
    - راجع [Skills](/ar/tools/skills) و[إعدادات Skills](/ar/tools/skills-config) و
      [مرجع التهيئة](/ar/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="ضبط مراقبة سلامة القنوات في Gateway">
    تحكم في مدى شدة إعادة تشغيل Gateway للقنوات التي تبدو قديمة:

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

    - اضبط `gateway.channelHealthCheckMinutes: 0` لتعطيل إعادة التشغيل الناتجة عن مراقبة السلامة عالميًا.
    - يجب أن تكون `channelStaleEventThresholdMinutes` أكبر من أو مساوية لفاصل التحقق.
    - استخدم `channels.<provider>.healthMonitor.enabled` أو `channels.<provider>.accounts.<id>.healthMonitor.enabled` لتعطيل إعادة التشغيل التلقائي لقناة أو حساب واحد من دون تعطيل المراقب العام.
    - راجع [فحوصات السلامة](/ar/gateway/health) لتصحيح الأخطاء التشغيلية و[المرجع الكامل](/ar/gateway/configuration-reference#gateway) لجميع الحقول.

  </Accordion>

  <Accordion title="تهيئة الجلسات وعمليات إعادة التعيين">
    تتحكم الجلسات في استمرارية المحادثة وعزلها:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // موصى به للاستخدام متعدد المستخدمين
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
    - `threadBindings`: القيم الافتراضية العامة لتوجيه الجلسات المرتبطة بالخيوط (يدعم Discord الأوامر `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`).
    - راجع [إدارة الجلسات](/ar/concepts/session) لمعرفة النطاق وروابط الهوية وسياسة الإرسال.
    - راجع [المرجع الكامل](/ar/gateway/config-agents#session) لجميع الحقول.

  </Accordion>

  <Accordion title="تمكين sandboxing">
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

  <Accordion title="تمكين push المعتمد على relay لإصدارات iOS الرسمية">
    تتم تهيئة push المعتمد على relay في `openclaw.json`.

    اضبط هذا في إعدادات Gateway:

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

    - يتيح لـ Gateway إرسال `push.test` وتنبيهات الإيقاظ وعمليات إيقاظ إعادة الاتصال عبر relay الخارجي.
    - يستخدم منحة إرسال مرتبطة بالتسجيل يمررها تطبيق iOS المقترن. ولا يحتاج Gateway إلى relay token على مستوى النشر بالكامل.
    - يربط كل تسجيل مدعوم بـ relay بهوية Gateway التي اقترن بها تطبيق iOS، بحيث لا يستطيع Gateway آخر إعادة استخدام التسجيل المخزن.
    - يبقي إصدارات iOS المحلية/اليدوية على APNs المباشر. ولا تنطبق عمليات الإرسال المعتمدة على relay إلا على الإصدارات الرسمية الموزعة التي سُجلت عبر relay.
    - يجب أن يطابق عنوان URL الأساسي لـ relay المضمّن في إصدار iOS الرسمي/TestFlight، حتى تصل حركة التسجيل والإرسال إلى نشر relay نفسه.

    التدفق الكامل من البداية إلى النهاية:

    1. ثبّت إصدار iOS رسميًا/TestFlight تم تجميعه باستخدام عنوان URL الأساسي نفسه لـ relay.
    2. هيّئ `gateway.push.apns.relay.baseUrl` على Gateway.
    3. اقترن تطبيق iOS بـ Gateway ودَع كلًا من جلسات node والمشغّل تتصل.
    4. يجلب تطبيق iOS هوية Gateway، ويسجّل لدى relay باستخدام App Attest بالإضافة إلى app receipt، ثم ينشر حمولة `push.apns.register` المدعومة بـ relay إلى Gateway المقترن.
    5. يخزن Gateway مقبض relay ومنحة الإرسال، ثم يستخدمهما في `push.test` وتنبيهات الإيقاظ وعمليات إيقاظ إعادة الاتصال.

    ملاحظات تشغيلية:

    - إذا بدّلت تطبيق iOS إلى Gateway مختلف، فأعد توصيل التطبيق حتى يتمكن من نشر تسجيل relay جديد مرتبط بذلك Gateway.
    - إذا شحنت إصدار iOS جديدًا يشير إلى نشر relay مختلف، فسيقوم التطبيق بتحديث تسجيل relay المخزن مؤقتًا بدلًا من إعادة استخدام أصل relay القديم.

    ملاحظة التوافق:

    - لا يزال `OPENCLAW_APNS_RELAY_BASE_URL` و`OPENCLAW_APNS_RELAY_TIMEOUT_MS` يعملان كتجاوزات env مؤقتة.
    - يظل `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` منفذًا تطويريًا مخصصًا لـ loopback فقط؛ لا تحفظ عناوين URL الخاصة بـ HTTP relay في الإعدادات.

    راجع [تطبيق iOS](/ar/platforms/ios#relay-backed-push-for-official-builds) للتدفق الكامل من البداية إلى النهاية، و[تدفق المصادقة والثقة](/ar/platforms/ios#authentication-and-trust-flow) لنموذج الأمان الخاص بـ relay.

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

    - `every`: سلسلة مدة (`30m` أو `2h`). اضبط `0m` للتعطيل.
    - `target`: `last` | `none` | `<channel-id>` (مثل `discord` أو `matrix` أو `telegram` أو `whatsapp`)
    - `directPolicy`: `allow` (الافتراضي) أو `block` لأهداف Heartbeat بنمط الرسائل الخاصة
    - راجع [Heartbeat](/ar/gateway/heartbeat) للدليل الكامل.

  </Accordion>

  <Accordion title="تهيئة مهام Cron">
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

    - `sessionRetention`: تقليم جلسات التشغيل المعزولة المكتملة من `sessions.json` (الافتراضي `24h`؛ اضبط `false` للتعطيل).
    - `runLog`: تقليم `cron/runs/<jobId>.jsonl` حسب الحجم والأسطر المحتفَظ بها.
    - راجع [مهام Cron](/ar/automation/cron-jobs) للحصول على نظرة عامة على الميزة وأمثلة CLI.

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
    - تعامل مع كل محتوى حمولة hook/webhook على أنه إدخال غير موثوق.
    - استخدم `hooks.token` مخصصًا؛ ولا تعِد استخدام Gateway token المشتركة.
    - تكون مصادقة Hook عبر الترويسات فقط (`Authorization: Bearer ...` أو `x-openclaw-token`)؛ ويتم رفض الرموز في query string.
    - لا يمكن أن يكون `hooks.path` مساويًا لـ `/`؛ احتفظ بإدخال webhook على مسار فرعي مخصص مثل `/hooks`.
    - أبقِ علامات تجاوز المحتوى غير الآمن معطّلة (`hooks.gmail.allowUnsafeExternalContent` و`hooks.mappings[].allowUnsafeExternalContent`) إلا عند تنفيذ تصحيح أخطاء محصور بإحكام.
    - إذا فعّلت `hooks.allowRequestSessionKey`، فاضبط أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد مفاتيح الجلسة التي يختارها المتصل.
    - بالنسبة إلى الوكلاء المدفوعين بالخطافات، فضّل طبقات النماذج الحديثة القوية وسياسة أدوات صارمة (مثل الرسائل فقط بالإضافة إلى sandboxing حيثما أمكن).

    راجع [المرجع الكامل](/ar/gateway/configuration-reference#hooks) لجميع خيارات mappings وتكامل Gmail.

  </Accordion>

  <Accordion title="تهيئة التوجيه متعدد الوكلاء">
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

    راجع [الوكلاء المتعددون](/ar/concepts/multi-agent) و[المرجع الكامل](/ar/gateway/config-agents#multi-agent-routing) لقواعد الربط وملفات الوصول لكل وكيل.

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

    - **ملف واحد**: يستبدل الكائن الحاوي
    - **مصفوفة ملفات**: تُدمج دمجًا عميقًا بالترتيب (الأخير يغلب)
    - **المفاتيح الشقيقة**: تُدمج بعد عمليات التضمين (وتتجاوز القيم المضمنة)
    - **التضمينات المتداخلة**: مدعومة حتى عمق 10 مستويات
    - **المسارات النسبية**: تُحل نسبةً إلى الملف الذي يتضمنها
    - **الكتابات التي يملكها OpenClaw**: عندما تغيّر الكتابة قسمًا واحدًا فقط من المستوى الأعلى
      مدعومًا بتضمين ملف واحد مثل `plugins: { $include: "./plugins.json5" }`,
      يحدّث OpenClaw ذلك الملف المضمَّن ويترك `openclaw.json` كما هو
    - **الكتابة عبر التضمين غير المدعومة**: تفشل تضمينات الجذر ومصفوفات التضمين والتضمينات
      ذات التجاوزات الشقيقة بشكل مغلق في عمليات الكتابة التي يملكها OpenClaw بدلًا من
      تسطيح الإعدادات
    - **معالجة الأخطاء**: أخطاء واضحة للملفات المفقودة وأخطاء التحليل وعمليات التضمين الدائرية

  </Accordion>
</AccordionGroup>

## إعادة التحميل السريع للإعدادات

يراقب Gateway ملف `~/.openclaw/openclaw.json` ويطبّق التغييرات تلقائيًا — ولا حاجة إلى إعادة تشغيل يدوية لمعظم الإعدادات.

تُعامل تعديلات الملفات المباشرة على أنها غير موثوقة حتى يتم التحقق منها. وينتظر المراقب
حتى تستقر عمليات الكتابة/إعادة التسمية المؤقتة الخاصة بالمحرر، ويقرأ الملف النهائي، ويرفض
التعديلات الخارجية غير الصالحة عبر استعادة آخر إعدادات سليمة معروفة. كما تستخدم
كتابات الإعدادات التي يملكها OpenClaw بوابة schema نفسها قبل الكتابة؛ وتُرفض
الكتابات المدمّرة مثل إسقاط `gateway.mode` أو تقليص الملف بأكثر من النصف
وتُحفَظ باسم `.rejected.*` للفحص.

إخفاقات التحقق المحلية الخاصة بـ Plugin هي الاستثناء: إذا كانت كل المشكلات تحت
`plugins.entries.<id>...`، فستحتفظ إعادة التحميل بالإعدادات الحالية وتبلغ عن مشكلة Plugin
بدلًا من استعادة `.last-good`.

إذا رأيت `Config auto-restored from last-known-good` أو
`config reload restored last-known-good config` في السجلات، فافحص الملف
المطابق `.clobbered.*` بجوار `openclaw.json`، وأصلح الحمولة المرفوضة، ثم شغّل
`openclaw config validate`. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-restored-last-known-good-config)
للحصول على قائمة التحقق الخاصة بالاستعادة.

### أوضاع إعادة التحميل

| الوضع                 | السلوك                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------- |
| **`hybrid`** (الافتراضي) | يطبق التغييرات الآمنة فورًا. ويعيد التشغيل تلقائيًا للتغييرات الحرجة.                  |
| **`hot`**             | يطبق التغييرات الآمنة فقط. ويسجّل تحذيرًا عندما تكون إعادة التشغيل مطلوبة — وتتولاها أنت. |
| **`restart`**         | يعيد تشغيل Gateway عند أي تغيير في الإعدادات، سواء كان آمنًا أم لا.                     |
| **`off`**             | يعطّل مراقبة الملفات. وتصبح التغييرات نافذة عند إعادة التشغيل اليدوية التالية.          |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ما الذي يُطبَّق سريعًا مقابل ما يحتاج إلى إعادة تشغيل

تُطبَّق معظم الحقول سريعًا من دون توقف. وفي وضع `hybrid`، تُعالَج التغييرات التي تتطلب إعادة تشغيل تلقائيًا.

| الفئة               | الحقول                                                            | هل يلزم إعادة تشغيل؟ |
| ------------------- | ----------------------------------------------------------------- | --------------------- |
| القنوات             | `channels.*`، `web` (WhatsApp) — جميع القنوات المضمّنة وقنوات Plugin | لا                    |
| الوكيل والنماذج     | `agent` و`agents` و`models` و`routing`                            | لا                    |
| الأتمتة             | `hooks` و`cron` و`agent.heartbeat`                                | لا                    |
| الجلسات والرسائل    | `session` و`messages`                                             | لا                    |
| الأدوات والوسائط    | `tools` و`browser` و`skills` و`mcp` و`audio` و`talk`              | لا                    |
| واجهة المستخدم والمتفرقات | `ui` و`logging` و`identity` و`bindings`                     | لا                    |
| خادم Gateway        | `gateway.*` (المنفذ، والربط، والمصادقة، وtailscale، وTLS، وHTTP)   | **نعم**               |
| البنية التحتية      | `discovery` و`canvasHost` و`plugins`                              | **نعم**               |

<Note>
`gateway.reload` و`gateway.remote` استثناءان — فتغييرهما **لا** يؤدي إلى إعادة تشغيل.
</Note>

### تخطيط إعادة التحميل

عندما تعدّل ملف مصدر مشارًا إليه عبر `$include`، يخطط OpenClaw
لإعادة التحميل انطلاقًا من التخطيط المؤلف في المصدر، وليس من العرض المسطّح داخل الذاكرة.
وهذا يجعل قرارات إعادة التحميل السريع (تطبيق فوري أم إعادة تشغيل) قابلة للتنبؤ حتى عندما
يعيش قسم واحد من المستوى الأعلى في ملفه المضمّن الخاص مثل
`plugins: { $include: "./plugins.json5" }`. ويفشل تخطيط إعادة التحميل بشكل مغلق إذا كان
تخطيط المصدر ملتبسًا.

## Config RPC (تحديثات برمجية)

بالنسبة إلى الأدوات التي تكتب الإعدادات عبر Gateway API، فالتدفق المفضل هو:

- `config.schema.lookup` لفحص شجرة فرعية واحدة (عقدة schema سطحية + ملخصات
  الأبناء)
- `config.get` لجلب اللقطة الحالية بالإضافة إلى `hash`
- `config.patch` للتحديثات الجزئية (JSON merge patch: تندمج الكائنات، و`null`
  يحذف، والمصفوفات تُستبدل)
- `config.apply` فقط عندما تنوي استبدال الإعدادات بالكامل
- `update.run` لتنفيذ self-update صريح بالإضافة إلى إعادة التشغيل

يجب على الوكلاء التعامل مع `config.schema.lookup` على أنه المحطة الأولى للحصول على
توثيق دقيق وقيود على مستوى الحقول. واستخدم [مرجع التهيئة](/ar/gateway/configuration-reference)
عندما يحتاجون إلى خريطة الإعدادات الأوسع أو القيم الافتراضية أو روابط إلى
مراجع الأنظمة الفرعية المخصصة.

<Note>
تخضع كتابات control-plane (`config.apply` و`config.patch` و`update.run`) إلى
تحديد معدل قدره 3 طلبات لكل 60 ثانية لكل `deviceId+clientIp`. كما تُدمَج
طلبات إعادة التشغيل ثم تُفرَض فترة تهدئة مقدارها 30 ثانية بين دورات إعادة التشغيل.
</Note>

مثال على patch جزئي:

```bash
openclaw gateway call config.get --params '{}'  # التقاط payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

يقبل كل من `config.apply` و`config.patch` الحقول `raw` و`baseHash` و`sessionKey` و`note` و`restartDelayMs`. ويكون `baseHash` مطلوبًا للطريقتين عندما
تكون الإعدادات موجودة مسبقًا.

## متغيرات البيئة

يقرأ OpenClaw متغيرات env من العملية الأم بالإضافة إلى:

- `.env` من دليل العمل الحالي (إن وجد)
- `~/.openclaw/.env` (احتياطي عام)

لا يطغى أي من الملفين على متغيرات env الموجودة مسبقًا. ويمكنك أيضًا تعيين متغيرات env inline في الإعدادات:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="استيراد env من shell (اختياري)">
  إذا كان مفعّلًا ولم تكن المفاتيح المتوقعة مضبوطة، فإن OpenClaw يشغّل login shell الخاصة بك ويستورد المفاتيح الناقصة فقط:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

المكافئ في متغير env: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="استبدال متغيرات env في قيم الإعدادات">
  ارجع إلى متغيرات env في أي قيمة سلسلة نصية داخل الإعدادات باستخدام `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

القواعد:

- تتم مطابقة الأسماء المكتوبة بأحرف كبيرة فقط: `[A-Z_][A-Z0-9_]*`
- تؤدي المتغيرات المفقودة/الفارغة إلى خطأ عند وقت التحميل
- استخدم `$${VAR}` للهروب وإخراج القيمة حرفيًا
- يعمل هذا داخل ملفات `$include`
- الاستبدال inline: `"${BASE}/v1"` ← `"https://api.example.com/v1"`

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

توجد تفاصيل SecretRef (بما في ذلك `secrets.providers` الخاصة بـ `env`/`file`/`exec`) في [إدارة الأسرار](/ar/gateway/secrets).
وتوجد مسارات بيانات الاعتماد المدعومة في [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Accordion>

راجع [البيئة](/ar/help/environment) للاطلاع على الأولوية الكاملة والمصادر.

## المرجع الكامل

للحصول على المرجع الكامل حقلًا بحقل، راجع **[مرجع التهيئة](/ar/gateway/configuration-reference)**.

---

_ذو صلة: [أمثلة التهيئة](/ar/gateway/configuration-examples) · [مرجع التهيئة](/ar/gateway/configuration-reference) · [Doctor](/ar/gateway/doctor)_

## ذو صلة

- [مرجع التهيئة](/ar/gateway/configuration-reference)
- [أمثلة التهيئة](/ar/gateway/configuration-examples)
- [دليل تشغيل Gateway](/ar/gateway)
