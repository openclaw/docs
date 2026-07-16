---
read_when:
    - إعداد OpenClaw للمرة الأولى
    - البحث عن أنماط التكوين الشائعة
    - الانتقال إلى أقسام إعدادات محددة
summary: 'نظرة عامة على الإعداد: المهام الشائعة، والإعداد السريع، وروابط إلى المرجع الكامل'
title: التكوين
x-i18n:
    generated_at: "2026-07-16T14:05:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77f45ec71032ad6f651fcb68f9fb37f6677de90ec5ccca33ee84794056c58f89
    source_path: gateway/configuration.md
    workflow: 16
---

يقرأ OpenClaw إعدادًا اختياريًا بتنسيق <Tooltip tip="يدعم JSON5 التعليقات والفواصل اللاحقة">**JSON5**</Tooltip> من `~/.openclaw/openclaw.json`. إذا كان الملف مفقودًا، يستخدم OpenClaw إعدادات افتراضية آمنة.

يجب أن يكون مسار الإعداد النشط ملفًا عاديًا. تستبدل عمليات الكتابة التي يملكها OpenClaw الملف ذريًا (بإعادة التسمية إلى المسار)، ولذلك يُستبدل هدف `openclaw.json` ذي الرابط الرمزي بدلًا من الكتابة عبره — تجنب تخطيطات الإعدادات التي تستخدم روابط رمزية. إذا احتفظت بالإعداد خارج دليل الحالة الافتراضي، فاجعل `OPENCLAW_CONFIG_PATH` يشير مباشرةً إلى الملف الحقيقي.

أسباب شائعة لإضافة إعداد:

- ربط القنوات والتحكم في من يمكنه مراسلة الروبوت
- تعيين النماذج أو الأدوات أو العزل أو الأتمتة (Cron، والخطافات)
- ضبط الجلسات أو الوسائط أو الشبكات أو واجهة المستخدم

راجع [المرجع الكامل](/ar/gateway/configuration-reference) للاطلاع على كل حقل متاح.

ينبغي للوكلاء وعمليات الأتمتة استخدام `config.schema.lookup` للحصول على
توثيق دقيق على مستوى الحقول قبل تعديل الإعداد. استخدم هذه الصفحة للإرشادات الموجّهة نحو المهام، و
[مرجع الإعدادات](/ar/gateway/configuration-reference) للاطلاع على الخريطة الأوسع
للحقول والإعدادات الافتراضية.

<Tip>
**هل أنت جديد على الإعدادات؟** ابدأ باستخدام `openclaw onboard` للإعداد التفاعلي، أو راجع دليل [أمثلة الإعدادات](/ar/gateway/configuration-examples) للحصول على إعدادات كاملة جاهزة للنسخ واللصق.
</Tip>

## إعداد أدنى

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
    openclaw onboard       # مسار الإعداد الأولي الكامل
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
  <Tab title="واجهة التحكم">
    افتح [http://127.0.0.1:18789](http://127.0.0.1:18789) واستخدم علامة تبويب **الإعداد**.
    تعرض واجهة التحكم نموذجًا مستمدًا من مخطط الإعداد المباشر، بما في ذلك بيانات توثيق الحقول
    `title` / `description` بالإضافة إلى مخططات Plugin والقنوات عند
    توفرها، مع محرر **JSON خام** بوصفه مخرجًا بديلًا. ولواجهات المستخدم
    التفصيلية والأدوات الأخرى، يوفّر Gateway أيضًا `config.schema.lookup`
    لجلب عقدة مخطط واحدة محددة النطاق بمسار، مع ملخصات العناصر الفرعية المباشرة.
  </Tab>
  <Tab title="التعديل المباشر">
    عدّل `~/.openclaw/openclaw.json` مباشرةً. يراقب Gateway الملف ويطبّق التغييرات تلقائيًا (راجع [إعادة التحميل الفورية](#config-hot-reload)).
  </Tab>
</Tabs>

## التحقق الصارم

<Warning>
لا يقبل OpenClaw إلا الإعدادات المطابقة للمخطط بالكامل. تؤدي المفاتيح غير المعروفة أو الأنواع المشوهة أو القيم غير الصالحة إلى **رفض Gateway بدء التشغيل**. الاستثناء الوحيد على مستوى الجذر هو `$schema` (سلسلة نصية)، كي تتمكن المحررات من إرفاق بيانات تعريف مخطط JSON.
</Warning>

يطبع `openclaw config schema` مخطط JSON الأساسي الذي تستخدمه واجهة التحكم
والتحقق. يجلب `config.schema.lookup` عقدة واحدة محددة النطاق بمسار، مع
ملخصات العناصر الفرعية للأدوات التفصيلية. تنتقل بيانات توثيق الحقول `title`/`description`
عبر الكائنات المتداخلة، وفروع أحرف البدل (`*`)، وعناصر المصفوفة (`[]`)، و`anyOf`/
`oneOf`/`allOf`. تُدمج مخططات Plugin والقنوات في وقت التشغيل عند
تحميل سجل البيانات الوصفية.

عند فشل التحقق:

- لا يبدأ Gateway
- لا تعمل إلا أوامر التشخيص (`openclaw doctor`، و`openclaw logs`، و`openclaw health`، و`openclaw status`)
- شغّل `openclaw doctor` للاطلاع على المشكلات الدقيقة
- شغّل `openclaw doctor --fix` (`--repair` هو الخيار نفسه؛ ويتخطى `--yes` المطالبات) لتطبيق الإصلاحات

يحتفظ Gateway بنسخة موثوقة من آخر إعداد صالح معروف بعد كل بدء تشغيل ناجح،
لكن بدء التشغيل وإعادة التحميل الفورية لا يستعيدانها تلقائيًا — لا يفعل ذلك إلا `openclaw doctor --fix`.
إذا فشل التحقق من `openclaw.json` (بما في ذلك التحقق المحلي الخاص بـPlugin)، يفشل
بدء تشغيل Gateway أو تُتخطى إعادة التحميل، ويحتفظ وقت التشغيل الحالي بآخر
إعداد مقبول. كما تُحفظ عملية الكتابة المرفوضة باسم `<path>.rejected.<timestamp>` لفحصها.
يحظر Gateway عمليات الكتابة التي تبدو كاستبدال عرضي — مثل إسقاط `gateway.mode`،
أو فقدان كتلة `meta`، أو تقليص الملف بأكثر من النصف — ما لم تسمح عملية الكتابة
صراحةً بإجراء تغييرات إتلافية. يُتخطى اعتماد النسخة بوصفها آخر إعداد صالح معروف عندما
يحتوي الإعداد المرشح على عنصر نائب لسر منقّح، مثل `***` أو `[redacted]`.

## مهام شائعة

<AccordionGroup>
  <Accordion title="إعداد قناة (WhatsApp، وTelegram، وDiscord، وغيرها)">
    لكل قناة قسم إعداد خاص بها ضمن `channels.<provider>`. راجع صفحة القناة المخصصة لمعرفة خطوات الإعداد:

    - [Discord](/ar/channels/discord) - `channels.discord`
    - [Feishu](/ar/channels/feishu) - `channels.feishu`
    - [Google Chat](/ar/channels/googlechat) - `channels.googlechat`
    - [iMessage](/ar/channels/imessage) - `channels.imessage`
    - [Mattermost](/ar/channels/mattermost) - `channels.mattermost`
    - [Microsoft Teams](/ar/channels/msteams) - `channels.msteams`
    - [Signal](/ar/channels/signal) - `channels.signal`
    - [Slack](/ar/channels/slack) - `channels.slack`
    - [Telegram](/ar/channels/telegram) - `channels.telegram`
    - [WhatsApp](/ar/channels/whatsapp) - `channels.whatsapp`

    تشترك جميع القنوات في نمط سياسة الرسائل المباشرة نفسه:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // فقط عند استخدام allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="اختيار النماذج وإعدادها">
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

    - يعرّف `agents.defaults.models` كتالوج النماذج ويعمل بوصفه قائمة السماح لـ`/model`؛ وتصفّي إدخالات `provider/*` كلًا من `/model` و`/models` ومنتقيات النماذج لتقتصر على المزوّدين المحددين مع استمرار استخدام الاكتشاف الديناميكي للنماذج.
    - استخدم `openclaw config set agents.defaults.models '<json>' --strict-json --merge` لإضافة إدخالات إلى قائمة السماح دون إزالة النماذج الموجودة. تُرفض عمليات الاستبدال العادية التي قد تزيل إدخالات ما لم تمرّر `--replace`.
    - تستخدم مراجع النماذج تنسيق `provider/model` (مثل `anthropic/claude-opus-4-6`).
    - يتحكم `agents.defaults.imageMaxDimensionPx` في تصغير صور النصوص المنسوخة/الأدوات (القيمة الافتراضية `1200`)؛ وعادةً ما تقلّل القيم الأدنى استخدام رموز الرؤية في عمليات التشغيل كثيفة لقطات الشاشة.
    - راجع [CLI النماذج](/ar/concepts/models) لتبديل النماذج في المحادثة و[تجاوز فشل النموذج](/ar/concepts/model-failover) لمعرفة سلوك تدوير المصادقة والبدائل.
    - بالنسبة إلى المزوّدين المخصصين/المستضافين ذاتيًا، راجع [المزوّدين المخصصين](/ar/gateway/config-tools#custom-providers-and-base-urls) في المرجع.

  </Accordion>

  <Accordion title="التحكم في من يمكنه مراسلة الروبوت">
    يُتحكم في الوصول عبر الرسائل المباشرة لكل قناة من خلال `dmPolicy` (القيمة الافتراضية `"pairing"`):

    - `"pairing"`: يحصل المرسلون غير المعروفين على رمز اقتران يُستخدم مرة واحدة للموافقة عليهم
    - `"allowlist"`: يُسمح فقط للمرسلين الموجودين في `allowFrom` (أو مخزن السماح للمقترنين)
    - `"open"`: السماح بجميع الرسائل المباشرة الواردة (يتطلب `allowFrom: ["*"]`)
    - `"disabled"`: تجاهل جميع الرسائل المباشرة

    للمجموعات، استخدم `groupPolicy` (`"allowlist" | "open" | "disabled"`) بالإضافة إلى `groupAllowFrom` أو قوائم السماح الخاصة بالقنوات.

    راجع [المرجع الكامل](/ar/gateway/config-channels#dm-and-group-access) لمعرفة التفاصيل الخاصة بكل قناة.

  </Accordion>

  <Accordion title="إعداد اشتراط الإشارة في المحادثات الجماعية">
    تتطلب رسائل المجموعة **الإشارة افتراضيًا**. اضبط أنماط التشغيل لكل وكيل. تُنشر الردود العادية في المجموعات/القنوات تلقائيًا؛ فعّل مسار أداة الرسائل للغرف المشتركة التي ينبغي للوكيل أن يقرر فيها متى يتحدث:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // عيّن "message_tool" لاشتراط الإرسال عبر أداة الرسائل في كل مكان
        groupChat: {
          visibleReplies: "message_tool", // تفعيل اختياري؛ يتطلب الإخراج المرئي message(action=send)
          unmentionedInbound: "room_event", // أحاديث المجموعة الدائمة بلا إشارة سياق صامت
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

    - **إشارات البيانات الوصفية**: إشارات @ الأصلية (النقر للإشارة في WhatsApp، و@bot في Telegram، وغيرها)
    - **أنماط النص**: أنماط تعبيرات نمطية آمنة في `mentionPatterns`
    - **الردود المرئية**: يمكن لـ`messages.visibleReplies` اشتراط الإرسال عبر أداة الرسائل عموميًا؛ ويتجاوز `messages.groupChat.visibleReplies` ذلك للمجموعات/القنوات.
    - راجع [المرجع الكامل](/ar/gateway/config-channels#group-chat-mention-gating) لمعرفة أوضاع الرد المرئي، والتجاوزات الخاصة بكل قناة، ووضع المحادثة الذاتية.

  </Accordion>

  <Accordion title="تقييد Skills لكل وكيل">
    استخدم `agents.defaults.skills` كأساس مشترك، ثم تجاوز إعدادات وكلاء
    محددين باستخدام `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // يرث github وweather
          { id: "docs", skills: ["docs-search"] }, // يستبدل الإعدادات الافتراضية
          { id: "locked-down", skills: [] }, // بلا Skills
        ],
      },
    }
    ```

    - احذف `agents.defaults.skills` للسماح غير المقيّد بـSkills افتراضيًا.
    - احذف `agents.list[].skills` لوراثة الإعدادات الافتراضية.
    - عيّن `agents.list[].skills: []` لعدم استخدام أي Skills.
    - راجع [Skills](/ar/tools/skills)، و[إعداد Skills](/ar/tools/skills-config)، و
      [مرجع الإعدادات](/ar/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="ضبط مراقبة سلامة قنوات Gateway">
    تحكم في مدى قوة إعادة تشغيل Gateway للقنوات التي تبدو قديمة:

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

    - القيم المعروضة هي القيم الافتراضية. عيّن `gateway.channelHealthCheckMinutes: 0` لتعطيل عمليات إعادة التشغيل الناتجة عن مراقبة السلامة عموميًا.
    - ينبغي أن يكون `channelStaleEventThresholdMinutes` أكبر من فاصل الفحص أو مساويًا له.
    - استخدم `channels.<provider>.healthMonitor.enabled` أو `channels.<provider>.accounts.<id>.healthMonitor.enabled` لتعطيل عمليات إعادة التشغيل التلقائية لقناة أو حساب واحد دون تعطيل المراقب العام.
    - راجع [فحوصات السلامة](/ar/gateway/health) لتصحيح المشكلات التشغيلية و[المرجع الكامل](/ar/gateway/configuration-reference#gateway) للاطلاع على جميع الحقول.

  </Accordion>

  <Accordion title="ضبط مهلة مصافحة WebSocket في Gateway">
    امنح العملاء المحليين وقتًا أطول لإكمال مصافحة WebSocket السابقة للمصادقة على
    المضيفات المحمّلة أو منخفضة الطاقة:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - القيمة الافتراضية هي `15000` مللي ثانية.
    - تظل `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ذات أولوية للتجاوزات المؤقتة للخدمة أو الصدفة.
    - يُفضّل إصلاح حالات تعطل بدء التشغيل/حلقة الأحداث أولًا؛ فهذا الضابط مخصص للمضيفات السليمة التي تكون بطيئة أثناء الإحماء.

  </Accordion>

  <Accordion title="تهيئة الجلسات وإعادة الضبط">
    تتحكم الجلسات في استمرارية المحادثة وعزلها:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // موصى به لتعدد المستخدمين
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
    - `threadBindings`: الإعدادات الافتراضية العامة لتوجيه الجلسات المرتبطة بسلاسل المحادثات. تقوم `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` بالربط وإلغاء الربط والسرد والضبط لكل جلسة (يربط Discord سلاسل المحادثات، ويربط Telegram الموضوعات/المحادثات).
    - راجع [إدارة الجلسات](/ar/concepts/session) لمعرفة تحديد النطاق وروابط الهوية وسياسة الإرسال.
    - راجع [المرجع الكامل](/ar/gateway/config-agents#session) للاطلاع على جميع الحقول.

  </Accordion>

  <Accordion title="تمكين العزل">
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

    أنشئ الصورة أولًا - من نسخة مصدر مشحونة شغّل `scripts/sandbox-setup.sh`، أو من تثبيت npm راجع أمر `docker build` المضمّن في [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup).

    راجع [العزل](/ar/gateway/sandboxing) للاطلاع على الدليل الكامل و[المرجع الكامل](/ar/gateway/config-agents#agentsdefaultssandbox) لجميع الخيارات.

  </Accordion>

  <Accordion title="تمكين الدفع المدعوم بالمرحل لإصدارات iOS الرسمية">
    يستخدم الدفع المدعوم بالمرحل لإصدارات App Store العامة مرحل OpenClaw المستضاف: `https://ios-push-relay.openclaw.ai`.

    تتطلب عمليات نشر المرحل المخصص مسارًا منفصلًا عمدًا لبناء iOS ونشره، بحيث يتطابق عنوان URL للمرحل فيه مع عنوان URL لمرحل Gateway. إذا كنت تستخدم إصدار مرحل مخصصًا، فعيّن ما يلي في تهيئة Gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // اختياري. القيمة الافتراضية: 10000
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

    - يتيح لـ Gateway إرسال `push.test` وتنبيهات التنشيط وتنبيهات إعادة الاتصال عبر المرحل الخارجي.
    - يستخدم إذن إرسال مقيّدًا بالتسجيل يمرره تطبيق iOS المقترن. لا يحتاج Gateway إلى رمز مرحل يشمل عملية النشر بأكملها.
    - يربط كل تسجيل مدعوم بالمرحل بهوية Gateway التي اقترن بها تطبيق iOS، بحيث لا يتمكن Gateway آخر من إعادة استخدام التسجيل المخزّن.
    - يُبقي إصدارات iOS المحلية/اليدوية على APNs المباشر. لا تنطبق عمليات الإرسال المدعومة بالمرحل إلا على الإصدارات الرسمية الموزعة التي سجّلت عبر المرحل.
    - يجب أن يتطابق مع عنوان URL الأساسي للمرحل المضمّن في إصدار iOS، حتى تصل حركة التسجيل والإرسال إلى عملية نشر المرحل نفسها.

    التدفق من البداية إلى النهاية:

    1. ثبّت تطبيق iOS الرسمي.
    2. اختياري: هيّئ `gateway.push.apns.relay.baseUrl` على Gateway فقط عند استخدام إصدار مرحل مخصص منفصل عمدًا.
    3. اقرن تطبيق iOS بـ Gateway واترك جلستي Node والمشغّل تتصلان.
    4. يجلب تطبيق iOS هوية Gateway، ويسجّل لدى المرحل باستخدام App Attest بالإضافة إلى إيصال التطبيق، ثم ينشر حمولة `push.apns.register` المدعومة بالمرحل إلى Gateway المقترن.
    5. يخزّن Gateway معرّف المرحل وإذن الإرسال، ثم يستخدمهما من أجل `push.test` وتنبيهات التنشيط وتنبيهات إعادة الاتصال.

    ملاحظات تشغيلية:

    - إذا بدّلت تطبيق iOS إلى Gateway مختلف، فأعد توصيل التطبيق حتى يتمكن من نشر تسجيل مرحل جديد مرتبط بذلك الـ Gateway.
    - إذا شحنت إصدار iOS جديدًا يشير إلى عملية نشر مرحل مختلفة، فسيحدّث التطبيق تسجيل المرحل المخزّن مؤقتًا بدلًا من إعادة استخدام أصل المرحل القديم.

    ملاحظة التوافق:

    - تظل `OPENCLAW_APNS_RELAY_BASE_URL` و`OPENCLAW_APNS_RELAY_TIMEOUT_MS` تعملان كتجاوزات مؤقتة عبر متغيرات البيئة.
    - يجب أن تتطابق عناوين URL المخصصة لمرحل Gateway مع عنوان URL الأساسي للمرحل المضمّن في إصدار iOS؛ ويرفض مسار إصدار App Store العام تجاوزات عنوان URL المخصص لمرحل iOS.
    - تظل `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` منفذًا احتياطيًا للتطوير مقتصرًا على واجهة الاسترجاع؛ لا تحفظ عناوين URL لمرحل HTTP في التهيئة.

    راجع [تطبيق iOS](/ar/platforms/ios#relay-backed-push-for-official-builds) للاطلاع على التدفق من البداية إلى النهاية و[تدفق المصادقة والثقة](/ar/platforms/ios#authentication-and-trust-flow) للاطلاع على نموذج أمان المرحل.

  </Accordion>

  <Accordion title="إعداد Heartbeat (عمليات التحقق الدورية)">
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

    - `every`: سلسلة مدة (`30m`، `2h`). عيّن `0m` للتعطيل. القيمة الافتراضية: `30m`.
    - `target`: `last` | `none` | `<channel-id>` (مثلًا `discord` أو `matrix` أو `telegram` أو `whatsapp`)
    - `directPolicy`: `allow` (الافتراضي) أو `block` لأهداف Heartbeat بنمط الرسائل المباشرة
    - راجع [Heartbeat](/ar/gateway/heartbeat) للاطلاع على الدليل الكامل.

  </Accordion>

  <Accordion title="تهيئة مهام Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // القيمة الافتراضية؛ إرسال cron + تنفيذ دورة وكيل cron معزولة
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`: يحذف جلسات التشغيل المعزولة المكتملة من صفوف جلسات SQLite (القيمة الافتراضية `24h`؛ عيّن `false` للتعطيل).
    - يحتفظ سجل التشغيل تلقائيًا بأحدث 2000 صف نهائي لكل مهمة؛ وتحتفظ الصفوف المفقودة بنافذة التنظيف البالغة 24 ساعة.
    - راجع [مهام Cron](/ar/automation/cron-jobs) للاطلاع على نظرة عامة على الميزة وأمثلة CLI.

  </Accordion>

  <Accordion title="إعداد Webhook (الخطافات)">
    مكّن نقاط نهاية Webhook عبر HTTP على Gateway:

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
    - تعامل مع جميع محتويات حمولات الخطافات/Webhook بوصفها مدخلات غير موثوقة.
    - استخدم `hooks.token` مخصصًا؛ ولا تعِد استخدام أسرار مصادقة Gateway النشطة (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` أو `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - تقتصر مصادقة الخطافات على الترويسة (`Authorization: Bearer ...` أو `x-openclaw-token`)؛ وتُرفض الرموز الموجودة في سلسلة الاستعلام.
    - لا يمكن أن تكون `hooks.path` هي `/`؛ احتفظ بإدخال Webhook في مسار فرعي مخصص مثل `/hooks`.
    - أبقِ علامات تجاوز المحتوى غير الآمن معطّلة (`hooks.gmail.allowUnsafeExternalContent`، `hooks.mappings[].allowUnsafeExternalContent`) إلا عند إجراء تصحيح أخطاء محدود النطاق بدقة.
    - إذا مكّنت `hooks.allowRequestSessionKey`، فعيّن أيضًا `hooks.allowedSessionKeyPrefixes` لتقييد مفاتيح الجلسة التي يحددها المستدعي.
    - بالنسبة إلى الوكلاء المشغّلين بالخطافات، فضّل مستويات النماذج الحديثة القوية وسياسة أدوات صارمة (مثل الاقتصار على المراسلة مع العزل حيثما أمكن).

    راجع [المرجع الكامل](/ar/gateway/configuration-reference#hooks) للاطلاع على جميع خيارات التعيين وتكامل Gmail.

  </Accordion>

  <Accordion title="تهيئة توجيه متعدد الوكلاء">
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

    راجع [تعدد الوكلاء](/ar/concepts/multi-agent) و[المرجع الكامل](/ar/gateway/config-agents#multi-agent-routing) لمعرفة قواعد الربط وملفات تعريف الوصول لكل وكيل.

  </Accordion>

  <Accordion title="تقسيم التهيئة إلى ملفات متعددة ($include)">
    استخدم `$include` لتنظيم ملفات التهيئة الكبيرة:

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

    - **ملف واحد**: يحل محل الكائن الحاوي
    - **مصفوفة ملفات**: تُدمج بعمق حسب الترتيب (تتغلب القيم اللاحقة)، حتى 10 مستويات متداخلة
    - **المفاتيح الشقيقة**: تُدمج بعد عمليات التضمين (وتتجاوز القيم المضمّنة)
    - **المسارات النسبية**: تُحل بالنسبة إلى الملف الذي يجري التضمين
    - **تنسيق المسار**: يجب ألا تحتوي مسارات التضمين على بايتات فارغة، ويجب أن يقل طولها قطعًا عن 4096 حرفًا قبل الحل وبعده
    - **عمليات الكتابة المملوكة لـ OpenClaw**: عندما تغيّر عملية كتابة قسمًا واحدًا فقط من المستوى الأعلى
      تدعمه عملية تضمين لملف واحد مثل `plugins: { $include: "./plugins.json5" }`،
      يحدّث OpenClaw ذلك الملف المضمّن ويترك `openclaw.json` سليمًا
    - **الكتابة العابرة غير المدعومة**: تفشل عمليات تضمين الجذر ومصفوفات التضمين وعمليات التضمين
      ذات التجاوزات الشقيقة بشكل مغلق لعمليات الكتابة المملوكة لـ OpenClaw بدلًا من
      تسطيح التهيئة
    - **الاحتواء**: يجب أن تُحل مسارات `$include` ضمن الدليل الذي يحتوي على
      `openclaw.json`. لمشاركة شجرة عبر عدة أجهزة أو مستخدمين، عيّن
      `OPENCLAW_INCLUDE_ROOTS` إلى قائمة مسارات (`:` على POSIX و`;` على Windows) من
      الأدلة الإضافية التي يمكن لعمليات التضمين الرجوع إليها. تُحل الروابط الرمزية
      ويُعاد التحقق منها، ولذلك يظل المسار الذي يقع نصيًا داخل دليل تهيئة لكن
      هدفه الحقيقي يخرج من كل جذر مسموح به مرفوضًا.
    - **معالجة الأخطاء**: أخطاء واضحة للملفات المفقودة وأخطاء التحليل وعمليات التضمين الدائرية وتنسيق المسار غير الصالح والطول المفرط

  </Accordion>
</AccordionGroup>

## إعادة تحميل التهيئة الفورية

يراقب Gateway ‏`~/.openclaw/openclaw.json` ويطبّق التغييرات تلقائيًا - ولا يلزم إعادة تشغيل يدوية لمعظم الإعدادات.

تُعامل تعديلات الملفات المباشرة بوصفها غير موثوقة حتى تجتاز التحقق. ينتظر المراقب
حتى تستقر تغييرات الكتابة المؤقتة/إعادة التسمية التي يجريها المحرر، ثم يقرأ الملف النهائي ويرفض
التعديلات الخارجية غير الصالحة دون إعادة كتابة `openclaw.json`. تستخدم عمليات كتابة التهيئة
المملوكة لـ OpenClaw بوابة المخطط نفسها قبل الكتابة (راجع [التحقق الصارم](#strict-validation)
لمعرفة قواعد الاستبدال/التراجع التي تنطبق على كل عملية كتابة).

إذا رأيت `config reload skipped (invalid config)` أو أبلغ بدء التشغيل عن `Invalid
config`، فافحص التهيئة وشغّل `openclaw config validate`، ثم شغّل `openclaw
doctor --fix` للإصلاح. راجع [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#gateway-rejected-invalid-config)
للاطلاع على قائمة التحقق.

### أوضاع إعادة التحميل

| الوضع                   | السلوك                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (الافتراضي) | يطبّق التغييرات الآمنة فورًا دون إعادة تشغيل. ويعيد التشغيل تلقائيًا عند التغييرات الحرجة.           |
| **`hot`**              | يطبّق التغييرات الآمنة فقط دون إعادة تشغيل. ويسجّل تحذيرًا عند الحاجة إلى إعادة التشغيل، وتتولى أنت تنفيذها. |
| **`restart`**          | يعيد تشغيل Gateway عند أي تغيير في الإعدادات، سواء أكان آمنًا أم لا.                                 |
| **`off`**              | يعطّل مراقبة الملفات. تسري التغييرات عند إعادة التشغيل اليدوية التالية.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### ما يُطبّق دون إعادة تشغيل وما يتطلب إعادة تشغيل

تُطبّق معظم الحقول دون توقف؛ وتعيد بعض الأقسام التي تُطبّق دون إعادة تشغيل تشغيل ذلك
النظام الفرعي فقط (القناة أو Cron أو Heartbeat أو مراقب السلامة) بدلًا من Gateway بالكامل. في
وضع `hybrid`، تُعالَج تلقائيًا التغييرات التي تتطلب إعادة تشغيل Gateway.

| الفئة            | الحقول                                                                  | هل يلزم إعادة تشغيل Gateway؟      |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| القنوات            | `channels.*`، و`web` (WhatsApp) - جميع القنوات المضمّنة وقنوات Plugin       | لا (يعيد تشغيل تلك القناة)   |
| الوكيل والنماذج      | `agent`، و`agents`، و`models`، و`routing`                                  | لا                           |
| الأتمتة          | `hooks`، و`cron`، و`agent.heartbeat`                                      | لا (يعيد تشغيل ذلك النظام الفرعي) |
| الجلسات والرسائل | `session`، و`messages`                                                   | لا                           |
| الأدوات والوسائط       | `tools`، و`skills`، و`mcp`، و`audio`، و`talk`                               | لا                           |
| إعدادات Plugin       | `plugins.entries.*`، و`plugins.allow`، و`plugins.deny`، و`plugins.enabled` | لا (يعيد تحميل بيئة تشغيل Plugin)  |
| واجهة المستخدم ومتفرقات           | `ui`، و`logging`، و`identity`، و`bindings`                                 | لا                           |
| خادم Gateway      | `gateway.*` (المنفذ، والربط، والمصادقة، وTailscale، وTLS، وHTTP، والدفع)              | **نعم**                      |
| البنية التحتية      | `discovery`، و`browser`، و`plugins.load`، و`plugins.installs`              | **نعم**                      |

<Note>
يُعدّ `gateway.reload` و`gateway.remote` استثناءين ضمن `gateway.*`، فتغييرهما **لا** يؤدي إلى إعادة التشغيل. ويمكن لكل Plugin أيضًا تجاوز هذا الجدول: إذ قد يعلن Plugin محمّل عن بادئات إعدادات خاصة به تؤدي إلى إعادة التشغيل (على سبيل المثال، يعيد Canvas Plugin المضمّن تشغيل Gateway عند تغيير `plugins.enabled` و`plugins.allow` و`plugins.deny`، وليس عند تغيير `plugins.entries.canvas` الخاص به فقط)، ولذلك يعتمد السلوك الفعلي على Plugins النشطة.
</Note>

### تخطيط إعادة التحميل

عند تعديل ملف مصدر مُشار إليه عبر `$include`، يخطط OpenClaw
لإعادة التحميل انطلاقًا من التخطيط المكتوب في المصدر، وليس من العرض المسطّح داخل الذاكرة.
ويحافظ ذلك على قابلية التنبؤ بقرارات إعادة التحميل الفوري (التطبيق دون إعادة تشغيل مقابل إعادة التشغيل)، حتى عندما
يوجد قسم واحد من المستوى الأعلى في ملف مضمّن مستقل مثل
`plugins: { $include: "./plugins.json5" }`. يفشل تخطيط إعادة التحميل بصورة مغلقة وآمنة إذا كان
تخطيط المصدر ملتبسًا.

## RPC للإعدادات (التحديثات البرمجية)

بالنسبة إلى الأدوات التي تكتب الإعدادات عبر واجهة API الخاصة بـ Gateway، يُفضّل اتباع هذا التدفق:

- `config.schema.lookup` لفحص شجرة فرعية واحدة (عقدة مخطط سطحية مع ملخصات
  العناصر التابعة)
- `config.get` لجلب اللقطة الحالية مع `hash`
- `config.patch` للتحديثات الجزئية (رقعة دمج JSON: تُدمج الكائنات، ويحذف `null`
  العناصر، وتستبدل المصفوفات عند التأكيد الصريح باستخدام `replacePaths` إذا
  كان من شأن ذلك إزالة إدخالات)
- `config.apply` فقط عندما تنوي استبدال الإعدادات بالكامل
- `update.run` لإجراء تحديث ذاتي صريح يتبعه إعادة تشغيل؛ ضمّن `continuationMessage` عندما ينبغي لجلسة ما بعد إعادة التشغيل تنفيذ دورة متابعة واحدة
- `update.status` لفحص أحدث علامة لإعادة التشغيل بعد التحديث والتحقق من الإصدار الجاري بعد إعادة التشغيل

ينبغي للوكلاء اعتبار `config.schema.lookup` الوجهة الأولى للحصول على
توثيق الحقول وقيودها بدقة. استخدم [مرجع الإعدادات](/ar/gateway/configuration-reference)
عند الحاجة إلى خريطة الإعدادات الأوسع أو القيم الافتراضية أو الروابط المؤدية إلى
مراجع الأنظمة الفرعية المتخصصة.

<Note>
تخضع عمليات كتابة مستوى التحكم (`config.apply` و`config.patch` و`update.run`)
لحد أقصى للمعدل يبلغ 3 طلبات لكل 60 ثانية لكل `deviceId+clientIp`. تُدمج طلبات إعادة التشغيل
ثم يُفرض فاصل تهدئة مدته 30 ثانية بين دورات إعادة التشغيل.
`update.status` مخصّص للقراءة فقط، لكنه مقيّد بنطاق المسؤول لأن علامة إعادة التشغيل قد
تتضمن ملخصات خطوات التحديث ونهايات مخرجات الأوامر.
</Note>

مثال على رقعة جزئية:

```bash
openclaw gateway call config.get --params '{}'  # التقاط payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

يقبل كل من `config.apply` و`config.patch` القيم `raw`، و`baseHash`، و`sessionKey`،
و`note`، و`restartDelayMs`. ويكون `baseHash` مطلوبًا لكلتا الطريقتين بمجرد
وجود ملف إعدادات بالفعل (أما الكتابة الأولى عند عدم وجود إعدادات فتتجاوز هذا التحقق).

يقبل `config.patch` أيضًا `replacePaths`، وهي مصفوفة من مسارات الإعدادات التي يُقصد
استبدال مصفوفاتها عمدًا. إذا كانت الرقعة ستستبدل مصفوفة موجودة أو تحذفها
بإدخالات أقل، يرفض Gateway الكتابة ما لم يظهر ذلك المسار بعينه
في `replacePaths`؛ وتستخدم المصفوفات المتداخلة داخل إدخالات المصفوفة `[]`، مثل
`agents.list[].skills`. يمنع ذلك لقطات `config.get` المبتورة من
الكتابة فوق مصفوفات التوجيه أو قوائم السماح بصمت. استخدم `config.apply` عندما
تنوي استبدال الإعدادات بالكامل.

## متغيرات البيئة

يقرأ OpenClaw متغيرات البيئة من العملية الأم، بالإضافة إلى:

- `.env` من دليل العمل الحالي (إن وُجد)
- `~/.openclaw/.env` (احتياطي عام)

لا يتجاوز أي من الملفين متغيرات البيئة الموجودة. ويمكن أيضًا تعيين متغيرات البيئة ضمن الإعدادات:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="استيراد بيئة الصدفة (اختياري)">
  إذا كان مفعّلًا ولم تكن المفاتيح المتوقعة معيّنة، يشغّل OpenClaw صدفة تسجيل الدخول ويستورد المفاتيح المفقودة فقط:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

متغير البيئة المكافئ: `OPENCLAW_LOAD_SHELL_ENV=1`. قيمة `timeoutMs` الافتراضية: `15000`.
</Accordion>

<Accordion title="استبدال متغيرات البيئة في قيم الإعدادات">
  أشر إلى متغيرات البيئة في أي قيمة نصية ضمن الإعدادات باستخدام `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

القواعد:

- تُطابق الأسماء المكتوبة بأحرف كبيرة فقط: `[A-Z_][A-Z0-9_]*`
- تؤدي المتغيرات المفقودة أو الفارغة إلى طرح خطأ وقت التحميل
- استخدم `$${VAR}` للإفلات والحصول على مخرجات حرفية
- يعمل داخل ملفات `$include`
- الاستبدال المضمّن: `"${BASE}/v1"` ← `"https://api.example.com/v1"`

</Accordion>

<Accordion title="مراجع الأسرار (البيئة، الملف، التنفيذ)">
  بالنسبة إلى الحقول التي تدعم كائنات SecretRef، يمكن استخدام:

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

ترد تفاصيل SecretRef (بما فيها `secrets.providers` لـ `env`/`file`/`exec`) في [إدارة الأسرار](/ar/gateway/secrets).
وترد مسارات بيانات الاعتماد المدعومة في [نطاق بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Accordion>

راجع [البيئة](/ar/help/environment) للاطلاع على ترتيب الأولوية والمصادر بالكامل.

## المرجع الكامل

للاطلاع على المرجع الكامل لكل حقل، راجع **[مرجع الإعدادات](/ar/gateway/configuration-reference)**.

---

_ذو صلة: [أمثلة الإعدادات](/ar/gateway/configuration-examples) · [مرجع الإعدادات](/ar/gateway/configuration-reference) · [أداة التشخيص](/ar/gateway/doctor)_

## ذو صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference)
- [أمثلة الإعدادات](/ar/gateway/configuration-examples)
- [دليل تشغيل Gateway](/ar/gateway)
