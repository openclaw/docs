---
read_when:
    - أنت تغيّر Runtime الوكيل المضمّن أو سجل harnessาคาร่า analysis to=commentary.multi_tool_use.parallel  天天中彩票上_json {"tool_uses":[{"recipient_name":"functions.bash","parameters":{"command":"rg -n \"Experimental SDK surface for plugins that replace the low level embedded agent executor|Agent harness plugins|embedded agent runtime|harness registry\" -S .. -g '!node_modules'","timeout":10}},{"recipient_name":"functions.read","parameters":{"path":"docs/AGENTS.md","offset":1,"limit":120}}]}
    - أنت تسجّل Agent harness من Plugin مضمّن أو موثوق
    - تحتاج إلى فهم كيفية ارتباط Plugin ‏Codex بمزوّدي النماذج
sidebarTitle: Agent Harness
summary: سطح SDK تجريبي للـ Plugins التي تستبدل منفّذ الوكيل المضمّن منخفض المستوى
title: Plugins ‏Agent harness
x-i18n:
    generated_at: "2026-04-24T07:54:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: af76c2a3ebe54c87920954b58126ee59538c0e6d3d1b4ba44890c1f5079fabc2
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

يشير **Agent harness** إلى المنفّذ منخفض المستوى لدور وكيل OpenClaw
المحضَّر الواحد. وهو ليس مزوّد نموذج، وليس قناة، وليس سجل أدوات.

استخدم هذا السطح فقط مع Plugins الأصلية المضمّنة أو الموثوقة. ولا يزال العقد
تجريبيًا لأن أنواع المعاملات تعكس عمدًا المنفّذ المضمّن الحالي.

## متى تستخدم harness

سجّل Agent harness عندما تكون لعائلة نماذج معينة
Runtime جلسة أصلية خاصة بها، ويكون نقل المزوّد العادي في OpenClaw تجريدًا غير مناسب.

أمثلة:

- خادم coding-agent أصلي يمتلك الخيوط وCompaction
- CLI أو daemon محلي يجب أن يبث أحداث الخطة/الاستدلال/الأدوات الأصلية
- Runtime نموذج يحتاج إلى resume id خاص به بالإضافة إلى
  نص جلسة OpenClaw التفريغي

لا **تسجّل** harness لمجرد إضافة واجهة LLM API جديدة. بالنسبة إلى واجهات
HTTP أو WebSocket العادية للنماذج، ابنِ [Plugin مزوّد](/ar/plugins/sdk-provider-plugins).

## ما الذي يظل core يملكه

قبل اختيار harness، يكون OpenClaw قد حل بالفعل ما يلي:

- المزوّد والنموذج
- حالة مصادقة Runtime
- مستوى التفكير وميزانية السياق
- ملف النص التفريغي/الجلسة الخاص بـ OpenClaw
- مساحة العمل، وsandbox، وسياسة الأدوات
- استدعاءات الرد الخاصة بالقنوات واستدعاءات البث
- سياسة احتياط النموذج والتبديل الحي للنموذج

هذا الفصل مقصود. فـ harness يشغّل محاولة محضّرة؛
ولا يختار المزوّدين، ولا يستبدل تسليم القنوات، ولا يبدّل النماذج بصمت.

## سجّل harness

**الاستيراد:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // ابدأ أو استأنف الخيط الأصلي الخاص بك.
    // استخدم params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, وغيرها من حقول المحاولة المحضّرة.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## سياسة الاختيار

يختار OpenClaw harness بعد تحليل المزوّد/النموذج:

1. يفوز معرّف harness المسجل في جلسة موجودة، بحيث لا تؤدي تغييرات config/env إلى
   تبديل ذلك النص التفريغي إلى Runtime آخر أثناء التشغيل.
2. يفرض `OPENCLAW_AGENT_RUNTIME=<id>` استخدام harness مسجل بهذا المعرف
   للجلسات غير المثبّتة بالفعل.
3. يفرض `OPENCLAW_AGENT_RUNTIME=pi` استخدام harness المدمج PI.
4. يطلب `OPENCLAW_AGENT_RUNTIME=auto` من الحِزم المسجلة ما إذا كانت تدعم
   المزوّد/النموذج المحلَّل.
5. إذا لم تطابق أي harness مسجلة، يستخدم OpenClaw ‏PI ما لم يكن احتياط PI
   معطلًا.

تظهر إخفاقات Plugin harness كإخفاقات تشغيل. وفي وضع `auto`، لا يُستخدم احتياط PI
إلا عندما لا تدعم أي Plugin harness مسجلة
المزوّد/النموذج المحلَّل. وبمجرد أن تطالب Plugin harness بتشغيل ما، لا يقوم OpenClaw
بإعادة تشغيل ذلك الدور نفسه عبر PI لأن ذلك قد يغيّر دلالات المصادقة/Runtime
أو يكرر الآثار الجانبية.

يُحفظ معرّف harness المحدد مع معرّف الجلسة بعد تشغيل مضمّن.
وتُعامل الجلسات القديمة التي أُنشئت قبل تثبيت harness على أنها مثبّتة على PI بمجرد
أن يصبح لها سجل نصي تفريغي. استخدم جلسة جديدة/معاد تعيينها عند التبديل بين PI و
Plugin harness أصلي. ويعرض `/status` معرّفات harness غير الافتراضية مثل `codex`
بجوار `Fast`؛ بينما يظل PI مخفيًا لأنه مسار التوافق الافتراضي.
إذا بدا harness المحدد مفاجئًا، ففعّل تسجيل التصحيح `agents/harness` و
افحص السجل المنظم في Gateway بعنوان `agent harness selected`. وهو يتضمن
معرّف harness المحدد، وسبب الاختيار، وسياسة runtime/fallback، ونتيجة دعم كل
مرشح من Plugins في وضع `auto`.

يسجّل Plugin ‏Codex المضمّن `codex` بوصفه معرّف harness الخاص به. ويعامل core ذلك
على أنه معرّف Plugin harness عادي؛ أما الأسماء المستعارة الخاصة بـ Codex فيجب أن تبقى في
Plugin أو في تكوين المشغّل، وليس في محدد Runtime المشترك.

## الاقتران بين المزوّد وharness

ينبغي لمعظم أنظمة harness أيضًا أن تسجّل مزوّدًا. فالمزوّد يجعل مراجع النماذج،
وحالة المصادقة، وبيانات النموذج الوصفية، واختيار `/model` مرئية لبقية
OpenClaw. ثم تطالب harness بذلك المزوّد في `supports(...)`.

يتبع Plugin ‏Codex المضمّن هذا النمط:

- معرّف المزوّد: `codex`
- مراجع النماذج للمستخدم: `openai/gpt-5.5` بالإضافة إلى `embeddedHarness.runtime: "codex"`؛
  وتظل مراجع `codex/gpt-*` القديمة مقبولة للتوافق
- معرّف harness: `codex`
- المصادقة: توافر مزوّد اصطناعي، لأن Codex harness يمتلك
  تسجيل الدخول/الجلسة الأصلية الخاصة بـ Codex
- طلب app-server: يرسل OpenClaw معرّف النموذج الخام إلى Codex ويترك
  لـ harness الحديث مع بروتوكول app-server الأصلي

إضافة Plugin ‏Codex إضافية. فمراجع `openai/gpt-*` العادية تستمر في استخدام
مسار مزوّد OpenClaw العادي ما لم تفرض Codex harness عبر
`embeddedHarness.runtime: "codex"`. وتظل مراجع `codex/gpt-*` القديمة
تحدد مزوّد Codex وharness الخاصة به للتوافق.

بالنسبة إلى إعداد المشغّل، وأمثلة بادئات النماذج، وتكوينات Codex-only، راجع
[Codex Harness](/ar/plugins/codex-harness).

يتطلب OpenClaw إصدار Codex app-server `0.118.0` أو أحدث. ويتحقق Plugin ‏Codex من
Handshake التهيئة الخاص بـ app-server ويمنع الخوادم الأقدم أو غير ذات الإصدار حتى
لا يعمل OpenClaw إلا على سطح البروتوكول الذي تم اختباره معه.

### Middleware نتائج الأدوات في Codex app-server

يمكن للـ Plugins المضمّنة أيضًا إرفاق middleware خاص بـ `tool_result`
في Codex app-server عبر `api.registerCodexAppServerExtensionFactory(...)` عندما
يُعلن البيان الخاص بها `contracts.embeddedExtensionFactories: ["codex-app-server"]`.
وهذا هو السطح الخاص بالـ Plugin الموثوقة لتحويلات نتائج الأدوات غير المتزامنة التي تحتاج إلى
العمل داخل Codex harness الأصلي قبل إسقاط خرج الأداة مرة أخرى
في النص التفريغي لـ OpenClaw.

### وضع Codex harness الأصلي

يمثل `codex` harness المضمّن وضع Codex الأصلي لأدوار
وكلاء OpenClaw المضمّنين. فعّل أولًا Plugin ‏`codex` المضمّن، وأدرج
`codex` في `plugins.allow` إذا كان تكوينك يستخدم قائمة سماح مقيّدة. ينبغي أن تستخدم
تكوينات app-server الأصلية `openai/gpt-*` مع `embeddedHarness.runtime: "codex"`.
واستخدم `openai-codex/*` لــ Codex OAuth عبر PI بدلًا من ذلك. وتظل مراجع
النماذج `codex/*` القديمة أسماء مستعارة متوافقة مع harness الأصلي.

عندما يعمل هذا الوضع، يمتلك Codex معرّف الخيط الأصلي، وسلوك
الاستئناف، وCompaction، وتنفيذ app-server. بينما يظل OpenClaw يمتلك قناة
الدردشة، ومرآة النص التفريغي المرئية، وسياسة الأدوات، والموافقات، وتسليم الوسائط، واختيار
الجلسة. استخدم `embeddedHarness.runtime: "codex"` مع
`embeddedHarness.fallback: "none"` عندما تحتاج إلى إثبات أن
مسار Codex app-server فقط يمكنه المطالبة بالتشغيل. يمثل هذا التكوين
حاجز اختيار فقط: إذ إن إخفاقات Codex app-server تفشل مباشرة بالفعل بدلًا من
إعادة المحاولة عبر PI.

## تعطيل احتياط PI

افتراضيًا، يشغّل OpenClaw الوكلاء المضمّنين باستخدام `agents.defaults.embeddedHarness`
المضبوط على `{ runtime: "auto", fallback: "pi" }`. وفي وضع `auto`، يمكن
لـ Plugin harness المسجلة المطالبة بزوج مزوّد/نموذج. وإذا لم يطابق أي منها،
يعود OpenClaw إلى PI.

اضبط `fallback: "none"` عندما تحتاج إلى أن يؤدي غياب اختيار Plugin harness إلى
فشل بدلًا من استخدام PI. إذ إن إخفاقات Plugin harness المحددة تفشل بالفعل فشلًا صريحًا. وهذا لا يمنع `runtime: "pi"` الصريح أو `OPENCLAW_AGENT_RUNTIME=pi`.

بالنسبة إلى تشغيلات Codex-only المضمّنة:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

إذا كنت تريد أن تتمكن أي Plugin harness مسجلة من المطالبة بالنماذج المطابقة ولكنك لا تريد أبدًا أن يعود OpenClaw بصمت إلى PI، فأبقِ `runtime: "auto"` وعطّل الاحتياط:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
      }
    }
  }
}
```

تستخدم التجاوزات لكل وكيل البنية نفسها:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

لا يزال `OPENCLAW_AGENT_RUNTIME` يتجاوز Runtime المكوّن. استخدم
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` لتعطيل احتياط PI من
البيئة.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

مع تعطيل الاحتياط، تفشل الجلسة مبكرًا عندما لا يكون harness المطلوب
مسجلًا، أو لا يدعم المزوّد/النموذج المحلَّل، أو يفشل قبل
إنتاج آثار جانبية للدور. وهذا مقصود لعمليات النشر من نوع Codex-only و
للاختبارات الحية التي يجب أن تثبت أن مسار Codex app-server مستخدم فعلًا.

يتحكم هذا الإعداد فقط في Agent harness المضمّن. وهو لا يعطّل
توجيه النماذج الخاص بالصور، أو الفيديو، أو الموسيقى، أو TTS، أو PDF، أو غيرها من التوجيهات الخاصة بالمزوّد.

## الجلسات الأصلية ومرآة النص التفريغي

قد تحتفظ harness بمعرّف جلسة أصلي، أو معرّف خيط، أو رمز استئناف من جانب daemon.
احرص على إبقاء هذا الربط مرتبطًا صراحةً بجلسة OpenClaw، وواصل
عكس خرج المساعد/الأداة المرئي للمستخدم إلى النص التفريغي لـ OpenClaw.

يبقى النص التفريغي لـ OpenClaw طبقة التوافق من أجل:

- سجل الجلسة المرئي على مستوى القناة
- البحث في النصوص وفهرستها
- التبديل مرة أخرى إلى PI harness المدمج في دور لاحق
- سلوك `/new` و`/reset` وحذف الجلسة العام

إذا كانت harness الخاصة بك تخزّن ربطًا جانبيًا، فنفّذ `reset(...)` حتى يتمكن OpenClaw من
مسحه عندما تتم إعادة تعيين جلسة OpenClaw المالكة.

## نتائج الأدوات والوسائط

يقوم core ببناء قائمة أدوات OpenClaw ويمررها إلى المحاولة المحضّرة.
وعندما تنفّذ harness استدعاء أداة ديناميكية، فأعد نتيجة الأداة عبر
صيغة نتيجة harness بدلًا من إرسال وسائط القناة بنفسك.

وهذا يحافظ على النصوص، والصور، والفيديو، والموسيقى، وTTS، والموافقات، ومخرجات
أداة الرسائل على مسار التسليم نفسه الذي تستخدمه تشغيلات PI.

## القيود الحالية

- مسار الاستيراد العام عامّ، لكن بعض الأسماء المستعارة لأنواع المحاولة/النتيجة لا تزال
  تحمل أسماء `Pi` للتوافق.
- تثبيت harness من جهات خارجية تجريبي. فضّل Plugins المزوّدين
  إلى أن تحتاج إلى Runtime جلسة أصلي.
- التبديل بين harness مدعوم عبر الأدوار. لا تبدّل harness في
  منتصف الدور بعد أن تبدأ الأدوات الأصلية، أو الموافقات، أو نص المساعد، أو عمليات إرسال الرسائل.

## ذو صلة

- [نظرة عامة على SDK](/ar/plugins/sdk-overview)
- [مساعدات Runtime](/ar/plugins/sdk-runtime)
- [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins)
- [Codex Harness](/ar/plugins/codex-harness)
- [مزوّدو النماذج](/ar/concepts/model-providers)
