---
read_when:
    - تحتاج إلى نقطة ربط في Plugin أو أداة للسؤال قبل تنفيذ تأثير جانبي.
    - تحتاج إلى تهيئة مكان تسليم مطالبات الموافقة على Plugin
    - أنت تقرر بين الأدوات الاختيارية، وموافقات exec، وموافقات Plugin
sidebarTitle: Permission requests
summary: اطلب من المستخدمين الموافقة على استدعاءات أدوات Plugin ومطالبات الأذونات المملوكة لـ Plugin
title: طلبات أذونات Plugin
x-i18n:
    generated_at: "2026-06-27T18:09:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72b860e9f8ddef80c70e943ec05353cbc0a917577382289649432a58c3ce6bd0
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

تتيح طلبات أذونات Plugin لتعليمات Plugin البرمجية إيقاف استدعاء أداة أو عملية مملوكة لـ Plugin مؤقتًا حتى يوافق المستخدم عليها أو يرفضها. تستخدم هذه الطلبات تدفق Gateway
`plugin.approval.*` وأسطح واجهة الموافقة نفسها التي تتعامل مع أزرار الموافقة في الدردشة وأوامر `/approve`.

استخدم طلبات أذونات Plugin لأذونات Plugin/التطبيق. فهي لا تستبدل موافقات تنفيذ المضيف، أو قوائم السماح الاختيارية للأدوات، أو مراجعة الأذونات الأصلية في Codex.

## اختر البوابة الصحيحة

اختر البوابة التي تطابق نقطة القرار التي تحتاجها:

| البوابة                             | استخدمها عندما                                                              | ما الذي تتحكم فيه                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| الأدوات الاختيارية                   | يجب ألا تكون الأداة مرئية للنموذج حتى يختار المستخدم تفعيلها.        | إظهار الأدوات عبر `tools.allow`.                                                                              |
| طلبات أذونات Plugin       | يجب أن يطلب خطاف Plugin أو عملية مملوكة لـ Plugin الإذن قبل تشغيل إجراء واحد. | الموافقة وقت التشغيل عبر `plugin.approval.*`.                                                                     |
| موافقات التنفيذ                   | يحتاج أمر مضيف أو أداة تشبه الصدفة إلى موافقة المشغّل.               | سياسة تنفيذ المضيف وقوائم السماح الدائمة للتنفيذ.                                                                     |
| طلبات الأذونات الأصلية في Codex | يطلب Codex الإذن قبل إجراءات الصدفة الأصلية أو الملفات أو MCP أو خادم التطبيق.        | معالجة موافقة خادم تطبيق Codex أو الخطاف الأصلي، مع توجيهها عبر موافقات Plugin عندما يملك OpenClaw المطالبة. |
| استدعاءات موافقة MCP        | يطلب خادم MCP في Codex الموافقة على استدعاء أداة.                    | استجابات موافقة MCP الموصولة عبر موافقات Plugin في OpenClaw.                                                 |

الأدوات الاختيارية هي بوابة وقت الاكتشاف. طلبات أذونات Plugin هي بوابة لكل استدعاء. استخدمهما معًا عندما يجب أن تتطلب أداة حساسة اختيارًا صريحًا قبل أن يتمكن النموذج من رؤيتها وموافقة قبل تشغيل الإجراء.

## اطلب الموافقة قبل استدعاء أداة

يجب أن تبدأ معظم المطالبات التي يؤلفها Plugin في خطاف `before_tool_call`. يعمل الخطاف بعد أن يختار النموذج أداة وقبل أن ينفذها OpenClaw:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "deploy-policy",
  name: "Deploy Policy",
  register(api) {
    api.on("before_tool_call", async (event) => {
      if (event.toolName !== "deploy_service") {
        return;
      }

      const environment =
        typeof event.params.environment === "string" ? event.params.environment : "unknown";

      return {
        requireApproval: {
          title: "Deploy service",
          description: `Deploy service to ${environment}.`,
          severity: environment === "production" ? "critical" : "warning",
          allowedDecisions:
            environment === "production"
              ? ["allow-once", "deny"]
              : ["allow-once", "allow-always", "deny"],
          timeoutMs: 120_000,
          timeoutBehavior: "deny",
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

اكتب نص المطالبة للشخص الذي سيوافق على الإجراء:

- اجعل `title` قصيرًا ومركّزًا على الإجراء. يقبل Gateway حتى 80
  حرفًا.
- اجعل `description` محددًا ومحدود النطاق. يقبل Gateway حتى 256
  حرفًا.
- ضمّن الإجراء والهدف والمخاطر. لا تدرج الأسرار أو الرموز المميزة أو
  الحمولات الخاصة التي يجب ألا تظهر في أسطح موافقة الدردشة.
- استخدم `severity: "critical"` فقط للإجراءات التي قد يؤدي فيها القرار الخاطئ إلى
  إتلاف بيئة الإنتاج أو فقدان البيانات.
- استخدم `allowedDecisions: ["allow-once", "deny"]` عندما تكون الثقة المستمرة
  غير آمنة لذلك الإجراء.

## سلوك القرار

ينشئ OpenClaw موافقة معلّقة بمعرّف يبدأ بـ `plugin:`، ويسلّمها إلى
أسطح الموافقة المتاحة، وينتظر القرار.

| القرار          | النتيجة                                                                    |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | يستمر الاستدعاء الحالي.                                               |
| `allow-always`    | يستمر الاستدعاء الحالي ويُمرَّر القرار إلى Plugin.      |
| `deny`            | يُحظر الاستدعاء بنتيجة أداة مرفوضة.                            |
| انتهاء المهلة           | يُحظر الاستدعاء ما لم يكن `timeoutBehavior` هو `"allow"`.                |
| الإلغاء      | يُحظر الاستدعاء عند إجهاض التشغيل.                              |
| لا يوجد مسار موافقة | يُحظر الاستدعاء لأنه لا توجد أي واجهة موافقة متصلة قادرة على حله. |

تكون `allow-always` دائمة فقط عندما ينفذ Plugin أو وقت التشغيل الذي يطلبها
هذا الاستمرار. بالنسبة إلى خطافات `before_tool_call.requireApproval` العادية،
يعامل OpenClaw كلاً من `allow-once` و`allow-always` كقرارات موافقة للاستدعاء
الحالي ويمرر القيمة المحلولة إلى `onResolution`. إذا كان Plugin لديك
يوفر `allow-always`، فوثّق ونفّذ بدقة ما هي الاستدعاءات المستقبلية التي
يثق بها.

إذا أعاد الخطاف أيضًا `params`، يطبق OpenClaw تغييرات المعاملات هذه فقط
بعد نجاح الموافقة. لا يزال بإمكان خطاف ذي أولوية أقل أن يحظر بعد أن
طلب خطاف ذو أولوية أعلى الموافقة.

يحد `allowedDecisions` من الأزرار والأوامر المعروضة للمستخدم. يرفض
Gateway محاولة الحل لأي قرار لم يقدمه الطلب.

## وجّه مطالبات الموافقة

يمكن حل مطالبات الموافقة في أسطح واجهة محلية أو في قنوات دردشة تدعم
معالجة الموافقات. لإعادة توجيه مطالبات موافقة Plugin إلى أهداف دردشة
صريحة، اضبط `approvals.plugin`:

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [{ channel: "slack", to: "U12345678" }],
    },
  },
}
```

`approvals.plugin` مستقلة عن `approvals.exec`. لا يؤدي تفعيل إعادة توجيه
موافقة التنفيذ إلى توجيه مطالبات موافقة Plugin، ولا يؤدي تفعيل إعادة توجيه
موافقة Plugin إلى تغيير سياسة تنفيذ المضيف.

عندما تتضمن المطالبة نص موافقة يدويًا، فقم بحلها بأحد القرارات المعروضة:

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

راجع [موافقات التنفيذ المتقدمة](/ar/tools/exec-approvals-advanced#plugin-approval-forwarding)
للاطلاع على نموذج إعادة التوجيه الكامل، وسلوك الموافقة في الدردشة نفسها،
والتسليم الأصلي للقنوات، وقواعد الموافقين الخاصة بكل قناة.

## أذونات Codex الأصلية

يمكن أيضًا أن تنتقل مطالبات الأذونات الأصلية في Codex عبر موافقات Plugin، لكن
ملكيتها تختلف عن الخطافات التي يؤلفها Plugin.

- يتم توجيه طلبات موافقة خادم تطبيق Codex عبر OpenClaw بعد مراجعة Codex.
- يمكن لترحيل الخطاف الأصلي `permission_request` أن يطلب عبر
  `plugin.approval.request` عندما يكون ذلك الترحيل مفعّلًا.
- يتم توجيه استدعاءات موافقة أداة MCP عبر موافقات Plugin عندما يعيّن Codex
  `_meta.codex_approval_kind` إلى `"mcp_tool_call"`.

راجع [وقت تشغيل حاضنة Codex](/ar/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
للاطلاع على السلوك الخاص بـ Codex وقواعد الرجوع الاحتياطي.

## استكشاف الأخطاء وإصلاحها

**تقول الأداة إن موافقات Plugin غير متاحة.** لم تقبل أي واجهة موافقة أو مسار
موافقة مضبوط الطلب. صِل عميلاً قادرًا على الموافقة، أو استخدم قناة تدعم
`/approve` في الدردشة نفسها، أو اضبط `approvals.plugin`.

**تظهر `allow-always` لكن الاستدعاء التالي يطلب الموافقة مرة أخرى.** لا يقوم
تدفق موافقة Plugin العام تلقائيًا بحفظ الثقة للخطافات العشوائية. احفظ
الثقة المملوكة لـ Plugin في Plugin الخاص بك بعد `onResolution("allow-always")`، أو
اعرض فقط `allow-once` و`deny`.

**يرفض `/approve` القرار.** قيّد الطلب
`allowedDecisions`. استخدم أحد القرارات المطبوعة في المطالبة.

**تُوجَّه مطالبة Slack أو Discord أو Telegram أو Matrix بطريقة مختلفة عن موافقات
التنفيذ.** تستخدم موافقات Plugin وموافقات التنفيذ إعدادات منفصلة وقد تستخدم
فحوص تفويض مختلفة. تحقق من `approvals.plugin` ودعم القناة لموافقة Plugin بدلاً من الاكتفاء بالتحقق من `approvals.exec`.

## ذات صلة

- [خطافات Plugin](/ar/plugins/hooks#tool-call-policy)
- [بناء Plugins](/ar/plugins/building-plugins#registering-agent-tools)
- [موافقات التنفيذ المتقدمة](/ar/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [بروتوكول Gateway](/ar/gateway/protocol)
- [وقت تشغيل حاضنة Codex](/ar/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
