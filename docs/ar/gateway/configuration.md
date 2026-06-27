---
read_when:
    - إعداد OpenClaw للمرة الأولى
    - البحث عن أنماط التكوين الشائعة
    - الانتقال إلى أقسام إعدادات محددة
summary: 'نظرة عامة على التهيئة: المهام الشائعة، والإعداد السريع، وروابط إلى المرجع الكامل'
title: الإعدادات
x-i18n:
    generated_at: "2026-06-27T17:35:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53ab0299aca69dafd240550bac1407356b0b3f5f35ef0171ea961c36346d3cab
    source_path: gateway/configuration.md
    workflow: 16
---

يقرأ OpenClaw تهيئة اختيارية بصيغة <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> من `~/.openclaw/openclaw.json`.
يجب أن يكون مسار التهيئة النشط ملفًا عاديًا. تخطيطات `openclaw.json` المرتبطة رمزيًا
غير مدعومة لعمليات الكتابة التي يملكها OpenClaw؛ فقد تستبدل الكتابة الذرية
المسار بدلًا من الحفاظ على الرابط الرمزي. إذا أبقيت التهيئة خارج دليل الحالة
الافتراضي، فاجعل `OPENCLAW_CONFIG_PATH` يشير مباشرة إلى الملف الحقيقي.

إذا كان الملف مفقودًا، يستخدم OpenClaw الإعدادات الافتراضية الآمنة. من الأسباب الشائعة لإضافة تهيئة:

- توصيل القنوات والتحكم في من يمكنه مراسلة البوت
- تعيين النماذج، والأدوات، والعزل، أو الأتمتة (Cron، الخطافات)
- ضبط الجلسات، والوسائط، والشبكات، أو واجهة المستخدم

راجع [المرجع الكامل](/ar/gateway/configuration-reference) لكل حقل متاح.

يجب على الوكلاء والأتمتة استخدام `config.schema.lookup` للحصول على
وثائق دقيقة على مستوى الحقل قبل تعديل التهيئة. استخدم هذه الصفحة للإرشاد الموجّه للمهام و
[مرجع التهيئة](/ar/gateway/configuration-reference) لخريطة الحقول الأوسع
والإعدادات الافتراضية.

<Tip>
**هل أنت جديد على التهيئة؟** ابدأ بـ `openclaw onboard` للإعداد التفاعلي، أو راجع دليل [أمثلة التهيئة](/ar/gateway/configuration-examples) للحصول على تهيئات كاملة جاهزة للنسخ واللصق.
</Tip>

## الحد الأدنى من التهيئة

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## تعديل التهيئة

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
    افتح [http://127.0.0.1:18789](http://127.0.0.1:18789) واستخدم تبويب **التهيئة**.
    تعرض واجهة التحكم نموذجًا من مخطط التهيئة الحي، بما في ذلك بيانات
    وثائق `title` / `description` الوصفية على مستوى الحقول، إضافة إلى مخططات Plugin والقنوات عندما
    تكون متاحة، مع محرر **Raw JSON** كمخرج بديل. لواجهات التنقل التفصيلي
    والأدوات الأخرى، يوفّر Gateway أيضًا `config.schema.lookup`
    لجلب عقدة مخطط واحدة مقيّدة بالمسار مع ملخصات الأبناء المباشرين.
  </Tab>
  <Tab title="Direct edit">
    عدّل `~/.openclaw/openclaw.json` مباشرة. يراقب Gateway الملف ويطبّق التغييرات تلقائيًا (راجع [إعادة التحميل الساخنة](#config-hot-reload)).
  </Tab>
</Tabs>

## التحقق الصارم

<Warning>
لا يقبل OpenClaw إلا التهيئات التي تطابق المخطط بالكامل. تؤدي المفاتيح غير المعروفة، أو الأنواع المشوهة، أو القيم غير الصالحة إلى جعل Gateway **يرفض بدء التشغيل**. الاستثناء الوحيد على مستوى الجذر هو `$schema` (سلسلة نصية)، حتى تتمكن المحررات من إرفاق بيانات JSON Schema الوصفية.
</Warning>

يطبع `openclaw config schema` مخطط JSON Schema المعتمد الذي تستخدمه واجهة التحكم
والتحقق. يجلب `config.schema.lookup` عقدة واحدة مقيّدة بالمسار مع
ملخصات الأبناء لأدوات التنقل التفصيلي. تنتقل بيانات وثائق `title`/`description` الوصفية
عبر الكائنات المتداخلة، وفروع البدل (`*`)، وعنصر المصفوفة (`[]`)، و `anyOf`/
`oneOf`/`allOf`. تندمج مخططات Plugin والقنوات وقت التشغيل عندما يتم تحميل
سجل البيان.

عند فشل التحقق:

- لا يبدأ Gateway التشغيل
- تعمل أوامر التشخيص فقط (`openclaw doctor`، `openclaw logs`، `openclaw health`، `openclaw status`)
- شغّل `openclaw doctor` لرؤية المشكلات الدقيقة
- شغّل `openclaw doctor --fix` (أو `--yes`) لتطبيق الإصلاحات

يحتفظ Gateway بنسخة موثوقة من آخر تهيئة سليمة معروفة بعد كل بدء تشغيل ناجح،
لكن بدء التشغيل وإعادة التحميل الساخنة لا يستعيدانها تلقائيًا. إذا فشل `openclaw.json`
في التحقق (بما في ذلك التحقق المحلي الخاص بـ Plugin)، يفشل بدء تشغيل Gateway أو
يتم تخطي إعادة التحميل ويحتفظ وقت التشغيل الحالي بآخر تهيئة مقبولة.
شغّل `openclaw doctor --fix` (أو `--yes`) لإصلاح التهيئة ذات البادئات/المطموسة أو
استعادة آخر نسخة سليمة معروفة. يتم تخطي الترقية إلى آخر نسخة سليمة معروفة عندما
يحتوي المرشح على عناصر نائبة منقحة للأسرار مثل `***`.

## مهام شائعة

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    لكل قناة قسم تهيئة خاص بها تحت `channels.<provider>`. راجع صفحة القناة المخصصة لخطوات الإعداد:

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

    - يعرّف `agents.defaults.models` كتالوج النماذج ويعمل كقائمة سماح لـ `/model`؛ وتقوم إدخالات `provider/*` بتصفية `/model` و`/models` ومنتقيات النماذج إلى مزودين محددين مع الاستمرار في استخدام الاكتشاف الديناميكي للنماذج.
    - استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات إلى قائمة السماح دون إزالة النماذج الموجودة. يتم رفض عمليات الاستبدال العادية التي قد تزيل إدخالات ما لم تمرر `--replace`.
    - تستخدم مراجع النماذج تنسيق `provider/model` (مثل `anthropic/claude-opus-4-6`).
    - يتحكم `agents.defaults.imageMaxDimensionPx` في تصغير صور النصوص/الأدوات (الافتراضي `1200`)؛ عادةً ما تقلل القيم الأقل استخدام رموز الرؤية في التشغيلات كثيفة لقطات الشاشة.
    - راجع [CLI النماذج](/ar/concepts/models) لتبديل النماذج في الدردشة و[تجاوز فشل النموذج](/ar/concepts/model-failover) لتدوير المصادقة وسلوك الرجوع.
    - للمزودين المخصصين/المستضافين ذاتيًا، راجع [المزودون المخصصون](/ar/gateway/config-tools#custom-providers-and-base-urls) في المرجع.

  </Accordion>

  <Accordion title="Control who can message the bot">
    يتم التحكم في وصول الرسائل المباشرة لكل قناة عبر `dmPolicy`:

    - `"pairing"` (الافتراضي): يحصل المرسلون غير المعروفين على رمز إقران لمرة واحدة للموافقة
    - `"allowlist"`: المرسلون الموجودون في `allowFrom` فقط (أو مخزن السماح المقترن)
    - `"open"`: السماح بكل الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`)
    - `"disabled"`: تجاهل كل الرسائل المباشرة

    للمجموعات، استخدم `groupPolicy` + `groupAllowFrom` أو قوائم السماح الخاصة بالقناة.

    راجع [المرجع الكامل](/ar/gateway/config-channels#dm-and-group-access) للحصول على تفاصيل كل قناة.

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    تتطلب رسائل المجموعات افتراضيًا **إشارة**. اضبط أنماط التشغيل لكل وكيل. تُنشر الردود العادية في المجموعة/القناة تلقائيًا؛ فعّل مسار أداة الرسائل للغرف المشتركة حيث ينبغي أن يقرر الوكيل متى يتحدث:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // opt-in; visible output requires message(action=send)
          unmentionedInbound: "room_event", // unmentioned always-on group chatter is quiet context
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

    - **إشارات البيانات الوصفية**: إشارات @ الأصلية (إشارة باللمس في WhatsApp، و@bot في Telegram، وما إلى ذلك)
    - **أنماط النص**: أنماط regex آمنة في `mentionPatterns`
    - **الردود المرئية**: يمكن أن يطلب `messages.visibleReplies` إرسالًا عبر أداة الرسائل عموميًا؛ ويتجاوز `messages.groupChat.visibleReplies` ذلك للمجموعات/القنوات.
    - راجع [المرجع الكامل](/ar/gateway/config-channels#group-chat-mention-gating) لأوضاع الرد المرئية، والتجاوزات لكل قناة، ووضع الدردشة الذاتية.

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

    - احذف `agents.defaults.skills` لإتاحة Skills بلا قيود افتراضيًا.
    - احذف `agents.list[].skills` لوراثة الإعدادات الافتراضية.
    - عيّن `agents.list[].skills: []` لعدم إتاحة أي Skills.
    - راجع [Skills](/ar/tools/skills)، و[تهيئة Skills](/ar/tools/skills-config)، و
      [مرجع التهيئة](/ar/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
    تحكم في مدى قوة إعادة تشغيل Gateway للقنوات التي تبدو متوقفة:

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

    - عيّن `gateway.channelHealthCheckMinutes: 0` لتعطيل عمليات إعادة التشغيل بواسطة مراقبة الصحة عموميًا.
    - يجب أن يكون `channelStaleEventThresholdMinutes` أكبر من فاصل الفحص أو مساويًا له.
    - استخدم `channels.<provider>.healthMonitor.enabled` أو `channels.<provider>.accounts.<id>.healthMonitor.enabled` لتعطيل عمليات إعادة التشغيل التلقائية لقناة أو حساب واحد دون تعطيل المراقبة العامة.
    - راجع [فحوصات الصحة](/ar/gateway/health) لتصحيح الأخطاء التشغيلية و[المرجع الكامل](/ar/gateway/configuration-reference#gateway) لكل الحقول.

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    امنح العملاء المحليين وقتًا أطول لإكمال مصافحة WebSocket قبل المصادقة على
    المضيفين المزدحمين أو منخفضي القدرة:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - القيمة الافتراضية هي `15000` مللي ثانية.
    - لا يزال `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ذا أسبقية لتجاوزات الخدمة أو الصدفة لمرة واحدة.
    - يُفضّل إصلاح توقفات بدء التشغيل/حلقة الأحداث أولًا؛ فهذا المقبض مخصص للمضيفين السليمين لكن البطيئين أثناء الإحماء.

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
    - `threadBindings`: الإعدادات الافتراضية العامة لتوجيه الجلسات المرتبطة بالمحادثات (يدعم Discord أوامر `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`).
    - راجع [إدارة الجلسات](/ar/concepts/session) لمعرفة النطاق، وروابط الهوية، وسياسة الإرسال.
    - راجع [المرجع الكامل](/ar/gateway/config-agents#session) لجميع الحقول.

  </Accordion>

  <Accordion title="تفعيل العزل الرملي">
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

    ابنِ الصورة أولاً - من نسخة مصدرية شغّل `scripts/sandbox-setup.sh`، أو من تثبيت npm راجع أمر `docker build` المضمّن في [العزل الرملي § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup).

    راجع [العزل الرملي](/ar/gateway/sandboxing) للدليل الكامل و[المرجع الكامل](/ar/gateway/config-agents#agentsdefaultssandbox) لجميع الخيارات.

  </Accordion>

  <Accordion title="تفعيل الدفع المدعوم بالترحيل لإصدارات iOS الرسمية">
    يستخدم الدفع المدعوم بالترحيل لإصدارات App Store/TestFlight العامة ترحيل OpenClaw المستضاف: `https://ios-push-relay.openclaw.ai`.

    تتطلب عمليات نشر الترحيل المخصصة مسار بناء/نشر iOS منفصلاً عمداً، بحيث يطابق عنوان URL الخاص بالترحيل عنوان URL لترحيل Gateway. إذا كنت تستخدم بناء ترحيل مخصصاً، فاضبط ذلك في تكوين Gateway:

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

    - يتيح لـ Gateway إرسال `push.test`، وتنبيهات الإيقاظ، وإيقاظات إعادة الاتصال عبر الترحيل الخارجي.
    - يستخدم منحة إرسال محددة بنطاق التسجيل يمررها تطبيق iOS المقترن. لا يحتاج Gateway إلى رمز ترحيل شامل للنشر.
    - يربط كل تسجيل مدعوم بالترحيل بهوية Gateway التي اقترن بها تطبيق iOS، بحيث لا يستطيع Gateway آخر إعادة استخدام التسجيل المخزن.
    - يُبقي إصدارات iOS المحلية/اليدوية على APNs المباشر. تنطبق الإرسالات المدعومة بالترحيل فقط على الإصدارات الرسمية الموزعة التي سجلت عبر الترحيل.
    - يجب أن يطابق عنوان URL الأساسي للترحيل المضمّن في بناء iOS، بحيث تصل حركة التسجيل والإرسال إلى نشر الترحيل نفسه.

    التدفق من البداية إلى النهاية:

    1. ثبّت إصدار iOS رسمي/من TestFlight.
    2. اختياري: اضبط `gateway.push.apns.relay.baseUrl` على Gateway فقط عند استخدام بناء ترحيل مخصص منفصل عمداً.
    3. اقرن تطبيق iOS مع Gateway ودع جلسات العقدة والمشغل تتصل.
    4. يجلب تطبيق iOS هوية Gateway، ويسجل مع الترحيل باستخدام App Attest بالإضافة إلى إيصال التطبيق، ثم ينشر حمولة `push.apns.register` المدعومة بالترحيل إلى Gateway المقترن.
    5. يخزن Gateway معرّف الترحيل ومنحة الإرسال، ثم يستخدمهما لـ `push.test` وتنبيهات الإيقاظ وإيقاظات إعادة الاتصال.

    ملاحظات تشغيلية:

    - إذا بدّلت تطبيق iOS إلى Gateway مختلف، فأعد توصيل التطبيق حتى يتمكن من نشر تسجيل ترحيل جديد مرتبط بذلك Gateway.
    - إذا شحنت بناء iOS جديداً يشير إلى نشر ترحيل مختلف، فسيحدّث التطبيق تسجيل الترحيل المخزن مؤقتاً بدلاً من إعادة استخدام أصل الترحيل القديم.

    ملاحظة التوافق:

    - لا يزال `OPENCLAW_APNS_RELAY_BASE_URL` و`OPENCLAW_APNS_RELAY_TIMEOUT_MS` يعملان كتجاوزات مؤقتة عبر متغيرات البيئة.
    - يجب أن تطابق عناوين URL المخصصة لترحيل Gateway عنوان URL الأساسي للترحيل المضمّن في بناء iOS. يرفض مسار إصدار App Store العام تجاوزات عنوان URL المخصصة لترحيل iOS.
    - يظل `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` منفذاً مخصصاً للتطوير عبر local loopback فقط؛ لا تحفظ عناوين URL لترحيل HTTP في التكوين.

    راجع [تطبيق iOS](/ar/platforms/ios#relay-backed-push-for-official-builds) للتدفق من البداية إلى النهاية و[تدفق المصادقة والثقة](/ar/platforms/ios#authentication-and-trust-flow) لنموذج أمان الترحيل.

  </Accordion>

  <Accordion title="إعداد Heartbeat (عمليات تسجيل الوصول الدورية)">
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

    - `every`: سلسلة مدة (`30m`، `2h`). اضبطها على `0m` للتعطيل.
    - `target`: `last` | `none` | `<channel-id>` (على سبيل المثال `discord` أو `matrix` أو `telegram` أو `whatsapp`)
    - `directPolicy`: `allow` (الافتراضي) أو `block` لأهداف Heartbeat بنمط الرسائل المباشرة
    - راجع [Heartbeat](/ar/gateway/heartbeat) للدليل الكامل.

  </Accordion>

  <Accordion title="تكوين مهام Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: إزالة جلسات التشغيل المعزولة المكتملة من `sessions.json` (الافتراضي `24h`؛ اضبطها على `false` للتعطيل).
    - `runLog`: إزالة صفوف سجل تشغيل Cron المحتفظ بها لكل مهمة. يظل `maxBytes` مقبولاً لسجلات التشغيل القديمة المدعومة بالملفات.
    - راجع [مهام Cron](/ar/automation/cron-jobs) لنظرة عامة على الميزة وأمثلة CLI.

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
    - تعامل مع كل محتوى حمولات hook/webhook كإدخال غير موثوق.
    - استخدم `hooks.token` مخصصاً؛ لا تعِد استخدام أسرار مصادقة Gateway النشطة (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` أو `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - مصادقة الخطاف عبر الرؤوس فقط (`Authorization: Bearer ...` أو `x-openclaw-token`)؛ يتم رفض رموز سلسلة الاستعلام.
    - لا يمكن أن يكون `hooks.path` هو `/`؛ أبقِ دخول Webhook على مسار فرعي مخصص مثل `/hooks`.
    - أبقِ أعلام تجاوز المحتوى غير الآمن معطلة (`hooks.gmail.allowUnsafeExternalContent`، `hooks.mappings[].allowUnsafeExternalContent`) إلا عند إجراء تصحيح أخطاء محدود النطاق بدقة.
    - إذا فعّلت `hooks.allowRequestSessionKey`، فاضبط أيضاً `hooks.allowedSessionKeyPrefixes` لتقييد مفاتيح الجلسة التي يختارها المستدعي.
    - للوكلاء الذين تقودهم الخطافات، فضّل طبقات النماذج الحديثة القوية وسياسة أدوات صارمة (على سبيل المثال المراسلة فقط بالإضافة إلى العزل الرملي حيثما أمكن).

    راجع [المرجع الكامل](/ar/gateway/configuration-reference#hooks) لجميع خيارات الربط وتكامل Gmail.

  </Accordion>

  <Accordion title="تكوين توجيه الوكلاء المتعددين">
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
    - **مصفوفة ملفات**: تُدمج بعمق وفق الترتيب (اللاحق يتغلب)
    - **المفاتيح الشقيقة**: تُدمج بعد التضمينات (تتجاوز القيم المضمّنة)
    - **التضمينات المتداخلة**: مدعومة حتى عمق 10 مستويات
    - **المسارات النسبية**: تُحل بالنسبة إلى الملف الذي يحتوي التضمين
    - **تنسيق المسار**: يجب ألا تحتوي مسارات التضمين على بايتات فارغة ويجب أن تكون أقصر بشكل صارم من 4096 حرفاً قبل الحل وبعده
    - **كتابات مملوكة لـ OpenClaw**: عندما تغيّر كتابة قسماً واحداً فقط من المستوى الأعلى
      مدعوماً بتضمين ملف واحد مثل `plugins: { $include: "./plugins.json5" }`،
      يحدّث OpenClaw ذلك الملف المضمّن ويترك `openclaw.json` كما هو
    - **الكتابة عبر التضمين غير المدعومة**: تفشل تضمينات الجذر ومصفوفات التضمين والتضمينات
      ذات التجاوزات الشقيقة بإغلاق آمن لكتابات OpenClaw بدلاً من
      تسطيح التكوين
    - **الحصر**: يجب أن تُحل مسارات `$include` تحت الدليل الذي يحتوي
      `openclaw.json`. لمشاركة شجرة عبر الأجهزة أو المستخدمين، اضبط
      `OPENCLAW_INCLUDE_ROOTS` على قائمة مسارات (`:` على POSIX، و`;` على Windows) من
      أدلة إضافية قد تشير إليها التضمينات. تُحل الروابط الرمزية
      ويُعاد فحصها، لذلك يظل المسار الذي يعيش نصياً داخل دليل تكوين لكن
      هدفه الحقيقي يخرج من كل جذر مسموح مرفوضاً.
    - **معالجة الأخطاء**: أخطاء واضحة للملفات المفقودة، وأخطاء التحليل، والتضمينات الدائرية، وتنسيق المسار غير الصالح، والطول الزائد

  </Accordion>
</AccordionGroup>

## إعادة تحميل التكوين الساخنة

يراقب Gateway ملف `~/.openclaw/openclaw.json` ويطبق التغييرات تلقائياً - لا حاجة إلى إعادة تشغيل يدوية لمعظم الإعدادات.

تُعامل تعديلات الملفات المباشرة كغير موثوقة حتى تجتاز التحقق. ينتظر المراقب
حتى تستقر عمليات الكتابة المؤقتة/إعادة التسمية من المحرر، ثم يقرأ الملف النهائي، ويرفض
التعديلات الخارجية غير الصالحة دون إعادة كتابة `openclaw.json`. تستخدم كتابات التكوين
المملوكة لـ OpenClaw بوابة المخطط نفسها قبل الكتابة؛ يتم رفض عمليات الكتابة التخريبية مثل
إسقاط `gateway.mode` أو تقليص الملف بأكثر من النصف وحفظها كـ
`.rejected.*` للفحص.

إذا رأيت `config reload skipped (invalid config)` أو أبلغ بدء التشغيل عن `Invalid
config`، فافحص التكوين، وشغّل `openclaw config validate`، ثم شغّل `openclaw
doctor --fix` للإصلاح. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-rejected-invalid-config)
للاطلاع على قائمة التحقق.

### أوضاع إعادة التحميل

| الوضع                 | السلوك                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (افتراضي) | يطبق التغييرات الآمنة فوراً بشكل ساخن. يعيد التشغيل تلقائياً للتغييرات الحرجة.          |
| **`hot`**             | يطبق التغييرات الآمنة فقط بشكل ساخن. يسجل تحذيراً عند الحاجة إلى إعادة تشغيل - وتتولى أنت ذلك. |
| **`restart`**         | يعيد تشغيل Gateway عند أي تغيير في التكوين، سواء كان آمناً أم لا.                       |
| **`off`**             | يعطل مراقبة الملفات. تصبح التغييرات نافذة عند إعادة التشغيل اليدوية التالية.            |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ما يُطبّق ساخناً مقابل ما يحتاج إلى إعادة تشغيل

تُطبّق معظم الحقول ساخناً دون توقف. في وضع `hybrid`، تُعالج التغييرات التي تتطلب إعادة تشغيل تلقائياً.

| الفئة | الحقول | هل إعادة التشغيل مطلوبة؟ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| القنوات | `channels.*`، `web` (WhatsApp) - كل القنوات المدمجة وقنوات Plugin | لا |
| الوكيل والنماذج | `agent`، `agents`، `models`، `routing` | لا |
| الأتمتة | `hooks`، `cron`، `agent.heartbeat` | لا |
| الجلسات والرسائل | `session`، `messages` | لا |
| الأدوات والوسائط | `tools`، `browser`، `skills`، `mcp`، `audio`، `talk` | لا |
| الواجهة ومتفرقات | `ui`، `logging`، `identity`، `bindings` | لا |
| خادم Gateway | `gateway.*` (المنفذ، الربط، المصادقة، tailscale، TLS، HTTP) | **نعم** |
| البنية التحتية | `discovery`، `plugins` | **نعم** |

<Note>
`gateway.reload` و`gateway.remote` استثناءان - لا يؤدي تغييرهما إلى إعادة تشغيل.
</Note>

### التخطيط لإعادة التحميل

عند تحرير ملف مصدر تتم الإشارة إليه عبر `$include`، يخطط OpenClaw
لإعادة التحميل من التخطيط المؤلف في المصدر، لا من العرض المسطح في الذاكرة.
يحافظ ذلك على قابلية توقع قرارات إعادة التحميل الساخن (التطبيق الساخن مقابل إعادة التشغيل) حتى عندما
يكون قسم واحد من المستوى الأعلى موجودا في ملف مضمن خاص به مثل
`plugins: { $include: "./plugins.json5" }`. يفشل التخطيط لإعادة التحميل بشكل مغلق إذا كان
تخطيط المصدر ملتبسا.

## RPC التكوين (تحديثات برمجية)

بالنسبة للأدوات التي تكتب التكوين عبر واجهة برمجة تطبيقات Gateway، فضل هذا التدفق:

- `config.schema.lookup` لفحص شجرة فرعية واحدة (عقدة مخطط سطحية + ملخصات
  الأبناء)
- `config.get` لجلب اللقطة الحالية بالإضافة إلى `hash`
- `config.patch` للتحديثات الجزئية (تصحيح دمج JSON: تدمج الكائنات، وتحذف `null`،
  وتستبدل المصفوفات عند التأكيد الصريح باستخدام `replacePaths` إذا
  كانت هناك إدخالات ستزال)
- `config.apply` فقط عندما تنوي استبدال التكوين بأكمله
- `update.run` للتحديث الذاتي الصريح مع إعادة التشغيل؛ أدرج `continuationMessage` عندما يجب أن تشغل جلسة ما بعد إعادة التشغيل دورة متابعة واحدة
- `update.status` لفحص أحدث علامة حارسة لإعادة تشغيل التحديث والتحقق من الإصدار الجاري بعد إعادة التشغيل

يجب أن يتعامل الوكلاء مع `config.schema.lookup` باعتبارها المحطة الأولى للحصول على
توثيق وقيود دقيقة على مستوى الحقول. استخدم [مرجع التكوين](/ar/gateway/configuration-reference)
عندما يحتاجون إلى خريطة التكوين الأوسع، أو القيم الافتراضية، أو الروابط إلى مراجع
الأنظمة الفرعية المخصصة.

<Note>
عمليات الكتابة في مستوى التحكم (`config.apply`، `config.patch`، `update.run`) محدودة
بمعدل 3 طلبات لكل 60 ثانية لكل `deviceId+clientIp`. تتجمع طلبات إعادة التشغيل
ثم تفرض فترة تهدئة مدتها 30 ثانية بين دورات إعادة التشغيل.
`update.status` للقراءة فقط لكنه ضمن نطاق المسؤول لأن علامة إعادة التشغيل الحارسة يمكن أن
تتضمن ملخصات خطوات التحديث وذيول مخرجات الأوامر.
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
و`note` و`restartDelayMs`. تكون `baseHash` مطلوبة للطريقتين كلتيهما عندما يكون
هناك تكوين موجود بالفعل.

يقبل `config.patch` أيضا `replacePaths`، وهي مصفوفة من مسارات التكوين التي يكون
استبدال المصفوفات فيها مقصودا. إذا كان التصحيح سيستبدل أو يحذف مصفوفة موجودة
بعدد إدخالات أقل، يرفض Gateway الكتابة ما لم يظهر ذلك المسار المحدد
في `replacePaths`؛ تستخدم المصفوفات المتداخلة تحت إدخالات المصفوفة `[]`، مثل
`agents.list[].skills`. يمنع هذا لقطات `config.get` المقتطعة من
الكتابة فوق مصفوفات التوجيه أو قوائم السماح بصمت. استخدم `config.apply` عندما
تنوي استبدال التكوين الكامل.

## متغيرات البيئة

يقرأ OpenClaw متغيرات البيئة من العملية الأصلية بالإضافة إلى:

- `.env` من دليل العمل الحالي (إن وجد)
- `~/.openclaw/.env` (احتياطي عام)

لا يتجاوز أي من الملفين متغيرات البيئة الموجودة. يمكنك أيضا تعيين متغيرات بيئة مضمنة في التكوين:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="استيراد بيئة الصدفة (اختياري)">
  إذا كان مفعلا ولم تكن المفاتيح المتوقعة معينة، يشغل OpenClaw صدفة تسجيل الدخول الخاصة بك ويستورد المفاتيح الناقصة فقط:

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

- الأسماء ذات الأحرف الكبيرة فقط تطابق: `[A-Z_][A-Z0-9_]*`
- المتغيرات الناقصة/الفارغة ترمي خطأ عند وقت التحميل
- استخدم الهروب بـ `$${VAR}` للإخراج الحرفي
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

تفاصيل SecretRef (بما في ذلك `secrets.providers` لـ `env`/`file`/`exec`) موجودة في [إدارة الأسرار](/ar/gateway/secrets).
مسارات بيانات الاعتماد المدعومة مدرجة في [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Accordion>

راجع [البيئة](/ar/help/environment) لمعرفة الأسبقية والمصادر الكاملة.

## المرجع الكامل

للمرجع الكامل حقلا بحقل، راجع **[مرجع التكوين](/ar/gateway/configuration-reference)**.

---

_ذات صلة: [أمثلة التكوين](/ar/gateway/configuration-examples) · [مرجع التكوين](/ar/gateway/configuration-reference) · [Doctor](/ar/gateway/doctor)_

## ذات صلة

- [مرجع التكوين](/ar/gateway/configuration-reference)
- [أمثلة التكوين](/ar/gateway/configuration-examples)
- [دليل تشغيل Gateway](/ar/gateway)
