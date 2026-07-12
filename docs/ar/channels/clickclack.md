---
read_when:
    - ربط OpenClaw بمساحة عمل ClickClack
    - اختبار هويات روبوت ClickClack
summary: إعداد قناة ClickClack باستخدام رمز البوت وصياغة الهدف
title: ClickClack
x-i18n:
    generated_at: "2026-07-12T05:32:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1fee023fd87a7b00333c18a24edfb028b231540724ba6092cf7d2b663643641
    source_path: channels/clickclack.md
    workflow: 16
---

يربط ClickClack منصة OpenClaw بمساحة عمل ClickClack مستضافة ذاتيًا من خلال رموز بوت ClickClack المدعومة بشكل أصيل.

استخدم هذا عندما تريد أن يظهر وكيل OpenClaw كمستخدم بوت في ClickClack. يدعم ClickClack بوتات خدمة مستقلة وبوتات مملوكة للمستخدمين؛ تحتفظ البوتات المملوكة للمستخدمين بقيمة `owner_user_id` ولا تحصل إلا على نطاقات الرمز التي تمنحها لها.

## الإعداد السريع

أنشئ رمز بوت على خادم ClickClack:

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

لإنشاء بوت مملوك لمستخدم، أضف `--owner <user_id>`.

اضبط OpenClaw:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

ثم شغّل:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

لا يُعد الحساب مضبوطًا إلا عند تعيين `baseUrl` و`token` و`workspace` جميعًا. تقبل `workspace` معرّف مساحة عمل (`wsp_...`) أو اسمًا مختصرًا أو اسمًا؛ ويحوّلها Gateway إلى المعرّف عند بدء التشغيل.

### مفاتيح ضبط الحساب

| المفتاح                 | القيمة الافتراضية       | الملاحظات                                                                                       |
| ----------------------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| `baseUrl`               | لا يوجد (مطلوب)         | عنوان URL لخادم ClickClack.                                                                     |
| `token`                 | لا يوجد (مطلوب)         | سلسلة نصية صريحة أو مرجع سر (`source: "env" \| "file" \| "exec"`).                              |
| `workspace`             | لا يوجد (مطلوب)         | معرّف مساحة العمل أو اسمها المختصر أو اسمها.                                                     |
| `replyMode`             | `"agent"`               | يشغّل `"agent"` مسار الوكيل الكامل؛ ويرسل `"model"` إكمالات قصيرة ومباشرة من النموذج.             |
| `defaultTo`             | `"channel:general"`     | الوجهة المستخدمة عندما لا يحدّد مسار صادر وجهة.                                                  |
| `allowFrom`             | `["*"]`                 | قائمة السماح بمعرّفات المستخدمين للرسائل الخاصة ورسائل القنوات الواردة.                           |
| `botUserId`             | يُكتشف تلقائيًا         | يُستخرج من هوية رمز البوت عند بدء التشغيل.                                                       |
| `agentId`               | الإعداد الافتراضي للمسار | يربط الرسائل الواردة لهذا الحساب بوكيل واحد.                                                     |
| `toolsAllow`            | لا يوجد                 | قائمة السماح بالأدوات لردود الوكيل الصادرة من هذا الحساب.                                         |
| `model`, `systemPrompt` | لا يوجد                 | يُستخدمان لإكمالات `replyMode: "model"`.                                                         |
| `reconnectMs`           | `1500`                  | مهلة إعادة الاتصال في الوقت الفعلي (من 100 إلى 60000).                                           |

إذا كانت `plugins.allow` قائمة تقييدية غير فارغة، فإن تحديد
ClickClack صراحةً في إعداد القناة أو تشغيل `openclaw plugins enable clickclack`
يضيف `clickclack` إلى تلك القائمة. يستخدم التثبيت أثناء الإعداد الأولي سلوك
التحديد الصريح نفسه. لا تتجاوز هذه المسارات `plugins.deny` أو إعداد
`plugins.enabled: false` العام. يتبع الأمر المباشر
`openclaw plugins install @openclaw/clickclack` سياسة تثبيت
الـ Plugin المعتادة، ويسجّل ClickClack أيضًا في قائمة سماح موجودة.

## بوتات متعددة

يفتح كل حساب اتصال ClickClack خاصًا به في الوقت الفعلي ويستخدم رمز البوت الخاص به.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## أوضاع الرد

- يمرّر `replyMode: "agent"` (الافتراضي) الرسائل الواردة عبر مسار الوكيل المعتاد، بما في ذلك تسجيل الجلسة وسياسة الأدوات.
- يتجاوز `replyMode: "model"` مسار الوكيل ويستخدم `llm.complete` الخاص بوقت تشغيل الـ Plugin للحصول على ردود بوت قصيرة ومباشرة (يمكن تشكيلها اختياريًا باستخدام `model` و`systemPrompt`).

يشغّل وضع النموذج الإكمالات باستخدام معرّف وكيل البوت المحلول، ما يتطلب
تفعيل بت الثقة الصريح `plugins.entries.clickclack.llm.allowAgentIdOverride: true`:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
}
```

أبقِ بت الثقة معطّلًا إذا كنت تستخدم وضع الرد الافتراضي `agent` فقط؛ فهو
غير مطلوب فيه.

استخدم وضع `agent` لأدلة الترابط بين الخدمات. بالنسبة إلى معرّف رسالة
ClickClack موثوق بصيغته القياسية `msg_<ulid>`، تستمد القناة معرّف تشغيل
OpenClaw الحتمي `clickclack:<message-id>`. تظهر بعد ذلك كل استدعاءة للنموذج
في بيانات التشخيص بالصيغة `clickclack:<message-id>:model:<n>`؛ وعندما
يستخدم ذلك الدور ClawRouter، يُرسل معرّف استدعاء النموذج نفسه بوصفه `X-Request-ID`.
يتجاوز وضع `model` تشخيصات تشغيل الوكيل والجلسة المعتادة، ولذلك فهو
غير مناسب لمسار الأدلة هذا.

عندما يحتوي حدث في الوقت الفعلي على `payload.correlation_id` متحقق منه،
تمرّره القناة بوصفه `X-Correlation-ID` عند الجلب الموثوق للرسالة وفي
طلبات رد ClickClack الناتجة. تستخدم القيم مجموعة ClickClack الآمنة
المكوّنة من 128 محرفًا (`A-Z` و`a-z` و`0-9` و`.` و`_` و`:` و`-`)؛ وتُحذف
القيم غير الصالحة. لا تحتوي عمليات الربط هذه إلا على معرّفات، ولا تتضمن
أبدًا نصوص الرسائل أو المطالبات أو الإكمالات أو بيانات الاعتماد أو مخرجات الأدوات.

## صفوف نشاط الوكيل

افتراضيًا، لا تعرض قناة ClickClack أي شيء أثناء تنفيذ دور الوكيل؛ ولا يظهر سوى الرد النهائي. عيّن `agentActivity: true` في حساب لنشر صفوف رسائل دائمة من نوعي `agent_commentary` و`agent_tool` أثناء تقدم الدور:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

المتطلبات والسلوك:

- **معطّل افتراضيًا.** لا تتأثر الإعدادات القياسية ولا خوادم ClickClack الأقدم.
- **يتطلب نطاق الرمز `agent_activity:write`.** هذا النطاق منفصل عن `bot:write` ولا يُورث منه؛ أنشئ رمز البوت باستخدام `--scopes bot:write,agent_activity:write` (أو امنح النطاق لرمز موجود) قبل تفعيل الخيار.
- **تدهور بأفضل جهد.** إذا كان الرمز يفتقر إلى `agent_activity:write` أو رفض الخادم كتابة النشاط، تُسجّل حالات الفشل ويظل الرد النهائي يصل بصورة طبيعية؛ ولا تظهر أي صفوف نشاط.
- تُجمّع الصفوف حسب كل دور (`turn_id`)، وتُدمج بحيث تمثل كل خطوة منطقية صفًا واحدًا، وتستخدم صفوف الأدوات تنسيق التقدم نفسه المستخدم في Discord وSlack وTelegram (اسم الأداة بالإضافة إلى تفاصيل الأمر).
- **بيانات الإسناد الوصفية.** تحمل المنشورات التي أنشأها الوكيل (صفوف النشاط والرد النهائي) الحقلين `author_model` و`author_thinking` المستخرجين من النموذج الفعلي المستخدم للدور (بما في ذلك ما بعد الانتقال الاحتياطي). تتجاهل الخوادم التي لا تعرّف هذين العمودين حقول JSON المجهولة؛ ويمكن للخوادم التي تحفظهما الإجابة لكل رسالة عن «أي نموذج قال هذا السطر، وبأي مستوى تفكير».

## الوجهات

- يرسل `channel:<name-or-id>` إلى قناة في مساحة العمل. تستخدم الوجهات المجرّدة `channel:` افتراضيًا.
- ينشئ `dm:<user_id>` محادثة مباشرة مع ذلك المستخدم أو يعيد استخدام محادثة موجودة.
- يرد `thread:<message_id>` ضمن سلسلة الرسائل المتجذرة في تلك الرسالة.

يمكن للوجهات الصادرة الصريحة أيضًا حمل بادئة المزوّد `clickclack:` أو `cc:`.

أمثلة:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## الأذونات

تفرض واجهة ClickClack API نطاقات رموز ClickClack.

- `bot:read`: قراءة بيانات مساحة العمل والقناة والرسالة وسلسلة الرسائل والرسائل الخاصة والوقت الفعلي والملف الشخصي.
- `bot:write`: إمكانات `bot:read` بالإضافة إلى رسائل القنوات والردود ضمن سلاسل الرسائل والرسائل الخاصة وعمليات الرفع.
- `bot:admin`: إمكانات `bot:write` بالإضافة إلى إنشاء القنوات.
- `agent_activity:write`: صفوف نشاط الوكيل الدائمة (`agent_commentary` / `agent_tool`). لا يُورث من `bot:write` أو `bot:admin`؛ ولا يكون مطلوبًا إلا عند تعيين `agentActivity: true`.

لا يحتاج OpenClaw إلا إلى `bot:write` لمحادثة الوكيل العادية. أضف `agent_activity:write` عند تفعيل [صفوف نشاط الوكيل](#agent-activity-rows).

## استكشاف الأخطاء وإصلاحها

- `ClickClack is not configured for account "<id>"`: عيّن `baseUrl` و`token` (على سبيل المثال عبر `CLICKCLACK_BOT_TOKEN`) و`workspace` لذلك الحساب.
- `ClickClack workspace not found: <value>`: عيّن `workspace` إلى معرّف مساحة العمل أو اسمها المختصر أو اسمها الذي يعيده ClickClack.
- لا توجد ردود واردة: تأكد من أن الرمز يملك صلاحية القراءة في الوقت الفعلي، ولاحظ أن البوت يتجاهل رسائله ورسائل البوتات الأخرى.
- تفشل عمليات الإرسال إلى القناة: تحقق من أن البوت عضو في مساحة العمل ويملك `bot:write`.
