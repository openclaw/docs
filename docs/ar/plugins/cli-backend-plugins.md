---
read_when:
    - أنت تبني Plugin خلفية CLI محلي للذكاء الاصطناعي
    - تريد تسجيل واجهة خلفية لمراجع النماذج مثل acme-cli/model
    - تحتاج إلى تعيين CLI تابع لجهة خارجية إلى مشغّل الرجوع النصي في OpenClaw
sidebarTitle: CLI backend plugins
summary: أنشئ Plugin يسجّل واجهة خلفية محلية لواجهة AI CLI
title: بناء Plugins خلفية CLI
x-i18n:
    generated_at: "2026-06-27T18:01:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d91c2b712a821005303c6cbb0ccbd8f263c8c30c5dbd6ed05b842c47c63f0542
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

تتيح Plugins الخلفيات الخاصة بـ CLI لـ OpenClaw استدعاء CLI محلي للذكاء الاصطناعي كخلفية لاستدلال النصوص. تظهر الخلفية كبادئة موفّر في مراجع النماذج:

```text
acme-cli/acme-large
```

استخدم خلفية CLI عندما يكون التكامل العلوي متاحًا بالفعل كأمر محلي، أو عندما يمتلك CLI حالة تسجيل الدخول المحلية، أو عندما يكون CLI بديلًا مفيدًا إذا لم تكن موفّرات API متاحة.

<Info>
  إذا كانت الخدمة العلوية تعرض API نماذج HTTP عادية، فاكتب
  [provider plugin](/ar/plugins/sdk-provider-plugins) بدلًا من ذلك. إذا كان وقت التشغيل العلوي يمتلك جلسات الوكيل الكاملة، أو أحداث الأدوات، أو Compaction، أو حالة المهام الخلفية، فاستخدم [agent harness](/ar/plugins/sdk-agent-harness).
</Info>

## ما يملكه Plugin

يمتلك Plugin خلفية CLI ثلاثة عقود:

| العقد                 | الملف                  | الغرض                                                    |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| مدخل الحزمة           | `package.json`         | يوجّه OpenClaw إلى وحدة وقت تشغيل Plugin                 |
| ملكية البيان          | `openclaw.plugin.json` | يعلن معرّف الخلفية قبل تحميل وقت التشغيل                 |
| تسجيل وقت التشغيل     | `index.ts`             | يستدعي `api.registerCliBackend(...)` مع افتراضيات الأمر |

البيان هو بيانات وصفية للاكتشاف. لا ينفّذ CLI ولا يسجّل سلوك وقت التشغيل. يبدأ سلوك وقت التشغيل عندما يستدعي مدخل Plugin `api.registerCliBackend(...)`.

## Plugin خلفية بسيط بالحد الأدنى

<Steps>
  <Step title="Create package metadata">
    ```json package.json
    {
      "name": "@acme/openclaw-acme-cli",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      },
      "dependencies": {
        "openclaw": "^2026.3.24"
      },
      "devDependencies": {
        "typescript": "^5.9.0"
      }
    }
    ```

    يجب أن تشحن الحزم المنشورة ملفات وقت تشغيل JavaScript مبنية. إذا كان مدخل المصدر لديك هو `./src/index.ts`، فأضف `openclaw.runtimeExtensions` يشير إلى نظير JavaScript المبني. راجع [Entry points](/ar/plugins/sdk-entrypoints).

  </Step>

  <Step title="Declare backend ownership">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "Run Acme's local AI CLI through OpenClaw",
      "cliBackends": ["acme-cli"],
      "setup": {
        "cliBackends": ["acme-cli"],
        "requiresRuntime": false
      },
      "activation": {
        "onStartup": false
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```

    `cliBackends` هي قائمة ملكية وقت التشغيل. تسمح لـ OpenClaw بتحميل Plugin تلقائيًا عندما يذكر الإعداد أو اختيار النموذج `acme-cli/...`.

    `setup.cliBackends` هو سطح الإعداد المعتمد على الواصفات أولًا. أضفه عندما ينبغي لاكتشاف النماذج، أو الإعداد الأولي، أو الحالة أن يتعرّف على الخلفية من دون تحميل وقت تشغيل Plugin. استخدم `requiresRuntime: false` فقط عندما تكون هذه الواصفات الثابتة كافية للإعداد.

  </Step>

  <Step title="Register the backend">
    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      CLI_FRESH_WATCHDOG_DEFAULTS,
      CLI_RESUME_WATCHDOG_DEFAULTS,
      type CliBackendPlugin,
    } from "openclaw/plugin-sdk/cli-backend";

    function buildAcmeCliBackend(): CliBackendPlugin {
      return {
        id: "acme-cli",
        liveTest: {
          defaultModelRef: "acme-cli/acme-large",
          defaultImageProbe: false,
          defaultMcpProbe: false,
          docker: {
            npmPackage: "@acme/acme-cli",
            binaryName: "acme",
          },
        },
        config: {
          command: "acme",
          args: ["chat", "--json"],
          output: "json",
          input: "stdin",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptFileArg: "--system-file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          reliability: {
            watchdog: {
              fresh: { ...CLI_FRESH_WATCHDOG_DEFAULTS },
              resume: { ...CLI_RESUME_WATCHDOG_DEFAULTS },
            },
          },
          serialize: true,
        },
      };
    }

    export default definePluginEntry({
      id: "acme-cli",
      name: "Acme CLI",
      description: "Run Acme's local AI CLI through OpenClaw",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    يجب أن يطابق معرّف الخلفية إدخال `cliBackends` في البيان. `config` المسجّل هو الافتراضي فقط؛ ويُدمج إعداد المستخدم ضمن `agents.defaults.cliBackends.acme-cli` فوقه في وقت التشغيل.

  </Step>
</Steps>

## شكل الإعداد

يصف `CliBackendConfig` كيف ينبغي لـ OpenClaw تشغيل CLI وتحليل مخرجاته:

| الحقل                                     | الاستخدام                                                   |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | اسم الملف الثنائي أو مسار الأمر المطلق                     |
| `args`                                    | argv الأساسية لعمليات التشغيل الجديدة                      |
| `resumeArgs`                              | argv بديلة للجلسات المستأنفة؛ تدعم `{sessionId}`            |
| `output` / `resumeOutput`                 | المحلّل: `json` أو `jsonl` أو `text`                        |
| `input`                                   | نقل الموجّه: `arg` أو `stdin`                               |
| `modelArg`                                | العلم المستخدم قبل معرّف النموذج                           |
| `modelAliases`                            | يربط معرّفات نماذج OpenClaw بمعرّفات CLI الأصلية           |
| `sessionArg` / `sessionArgs`              | كيفية تمرير معرّف الجلسة                                    |
| `sessionMode`                             | `always` أو `existing` أو `none`                            |
| `sessionIdFields`                         | حقول JSON التي يقرأها OpenClaw من مخرجات CLI               |
| `systemPromptArg` / `systemPromptFileArg` | نقل موجّه النظام                                            |
| `systemPromptWhen`                        | `first` أو `always` أو `never`                              |
| `imageArg` / `imageMode`                  | دعم مسار الصورة                                             |
| `serialize`                               | إبقاء عمليات تشغيل الخلفية نفسها مرتبة                     |
| `reliability.watchdog`                    | ضبط مهلة عدم وجود مخرجات                                    |

فضّل أصغر إعداد ثابت يطابق CLI. أضف استدعاءات Plugin الراجعة فقط للسلوك الذي ينتمي فعلًا إلى الخلفية.

## خطافات الخلفية المتقدمة

يمكن لـ `CliBackendPlugin` أيضًا تعريف:

| الخطاف                             | الاستخدام                                                                  |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | يعيد كتابة إعدادات المستخدم القديمة بعد الدمج                              |
| `resolveExecutionArgs(ctx)`        | يضيف أعلامًا مقيّدة بالطلب مثل جهد التفكير أو عزل السؤال الجانبي           |
| `prepareExecution(ctx)`            | ينشئ جسور مصادقة أو إعداد مؤقتة قبل التشغيل                                |
| `transformSystemPrompt(ctx)`       | يطبّق تحويلًا نهائيًا خاصًا بـ CLI لموجّه النظام                            |
| `textTransforms`                   | استبدالات ثنائية الاتجاه للموجّه/المخرجات                                  |
| `defaultAuthProfileId`             | يفضّل ملف تعريف مصادقة محددًا في OpenClaw                                  |
| `authEpochMode`                    | يقرر كيف تؤدي تغييرات المصادقة إلى إبطال جلسات CLI المخزنة                |
| `nativeToolMode`                   | يعلن ما إذا كان CLI يملك أدوات أصلية مفعّلة دائمًا                         |
| `sideQuestionToolMode`             | يعلن الأدوات الأصلية المعطلة لأسئلة `/btw` الجانبية                        |
| `bundleMcp` / `bundleMcpMode`      | يختار استخدام جسر أدوات MCP المحلي من OpenClaw                             |
| `ownsNativeCompaction`             | الخلفية تمتلك Compaction الخاصة بها - يؤجل OpenClaw                         |

أبقِ هذه الخطافات مملوكة للموفّر. لا تضف فروعًا خاصة بـ CLI إلى النواة عندما يستطيع خطاف خلفية التعبير عن السلوك.

`ctx.executionMode` تكون `"agent"` للدورات العادية و`"side-question"` لاستدعاءات `/btw` المؤقتة. استخدمها عندما يحتاج CLI إلى أعلام مختلفة لمرة واحدة، مثل تعطيل الأدوات الأصلية، أو استمرارية الجلسة، أو سلوك الاستئناف لـ BTW. إذا كانت الخلفية عادة تحتوي على `nativeToolMode: "always-on"` لكن argv الخاصة بالسؤال الجانبي لديها تعطل تلك الأدوات بشكل موثوق، فعيّن أيضًا `sideQuestionToolMode: "disabled"`؛ وإلا يفشل OpenClaw مغلقًا عندما يتطلب BTW تشغيل CLI بلا أدوات.

### `ownsNativeCompaction`: إلغاء استخدام Compaction في OpenClaw

إذا كانت خلفيتك تشغّل وكيلًا يضغط سجلّه **الخاص**، فعيّن `ownsNativeCompaction: true` حتى لا يعمل ملخّص الحماية في OpenClaw أبدًا على جلساته - تعيد دورة حياة Compaction في CLI عملية بلا تأثير وتستمر الدورة. يعلن `claude-cli` ذلك لأن Claude Code يجري Compaction داخليًا بلا نقطة نهاية harness. أما جلسات native-harness مثل Codex فتستمر في التوجيه إلى نقطة نهاية Compaction الخاصة بـ harness بدلًا من ذلك.

**لا تعلن ذلك إلا عندما تنطبق كل الشروط التالية**، وإلا يمكن لجلسة مؤجلة متجاوزة للميزانية أن تبقى فوق الميزانية / تصبح قديمة (لن ينقذها OpenClaw بعد الآن):

- تضغط الخلفية سجلّها أو تحدّه بشكل موثوق عندما يقترب من نافذته؛
- تحتفظ بجلسة قابلة للاستئناف حتى تبقى الحالة المضغوطة عبر الدورات
  (مثل `--resume` / `--session-id`)؛
- ليست جلسة Compaction من native-harness - فالجلسات المطابقة لـ `agentHarnessId` تُوجّه إلى نقطة نهاية harness بدلًا من ذلك.

## جسر أدوات MCP

لا تتلقى خلفيات CLI أدوات OpenClaw افتراضيًا. إذا كان CLI يستطيع استهلاك إعداد MCP، فاختر ذلك صراحة:

```typescript
return {
  id: "acme-cli",
  bundleMcp: true,
  bundleMcpMode: "codex-config-overrides",
  config: {
    command: "acme",
    args: ["chat", "--json"],
    output: "json",
  },
};
```

أوضاع الجسر المدعومة هي:

| الوضع                    | الاستخدام                                            |
| ------------------------ | ---------------------------------------------------- |
| `claude-config-file`     | أدوات CLI التي تقبل ملف إعداد MCP                   |
| `codex-config-overrides` | أدوات CLI التي تقبل تجاوزات الإعداد على argv        |
| `gemini-system-settings` | أدوات CLI التي تقرأ إعدادات MCP من دليل إعدادات النظام الخاص بها |

فعّل الجسر فقط عندما يستطيع CLI استهلاكه فعليًا. إذا كان CLI لديه طبقة أدوات مدمجة خاصة به لا يمكن تعطيلها، فعيّن `nativeToolMode:
"always-on"` حتى يستطيع OpenClaw الفشل مغلقًا عندما يتطلب المستدعي عدم وجود أدوات أصلية.

## إعداد المستخدم

يمكن للمستخدمين تجاوز أي افتراضي للخلفية:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "acme-cli": {
          command: "/opt/acme/bin/acme",
          args: ["chat", "--json", "--profile", "work"],
          modelAliases: {
            large: "acme-large-2026",
          },
        },
      },
      model: {
        primary: "openai/gpt-5.5",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

وثّق الحد الأدنى من التجاوز الذي يُرجّح أن يحتاجه المستخدمون. عادةً ما يكون ذلك `command` فقط عندما يكون الملف الثنائي خارج `PATH`.

## التحقق

بالنسبة إلى Plugins المضمّنة، أضف اختبارًا مركّزًا حول أداة البناء وتسجيل
الإعداد، ثم شغّل مسار الاختبار المستهدف للـ Plugin:

```bash
pnpm test extensions/acme-cli
```

بالنسبة إلى Plugins المحلية أو المثبّتة، تحقّق من الاكتشاف ومن تشغيل نموذج حقيقي واحد:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

إذا كانت الخلفية تدعم الصور أو MCP، فأضف اختبار دخان حيًا يثبت تلك المسارات
باستخدام CLI الحقيقي. لا تعتمد على الفحص الثابت لسلوك الموجّه أو الصورة أو MCP أو
استئناف الجلسة.

## قائمة التحقق

<Check>يحتوي `package.json` على `openclaw.extensions` ومدخلات وقت تشغيل مبنية للحزم المنشورة</Check>
<Check>يعلن `openclaw.plugin.json` عن `cliBackends` و`activation.onStartup` المقصود</Check>
<Check>يكون `setup.cliBackends` موجودًا عندما ينبغي للإعداد/اكتشاف النماذج رؤية الخلفية وهي باردة</Check>
<Check>يستخدم `api.registerCliBackend(...)` معرّف الخلفية نفسه الموجود في البيان</Check>
<Check>تظل تجاوزات المستخدم ضمن `agents.defaults.cliBackends.<id>` هي الغالبة</Check>
<Check>تطابق إعدادات الجلسة وموجّه النظام والصورة ومحلّل الإخراج عقد CLI الحقيقي</Check>
<Check>تثبت الاختبارات المستهدفة واختبار دخان CLI حي واحد على الأقل مسار الخلفية</Check>

## ذو صلة

- [خلفيات CLI](/ar/gateway/cli-backends) - إعدادات المستخدم وسلوك وقت التشغيل
- [بناء Plugins](/ar/plugins/building-plugins) - أساسيات الحزمة والبيان
- [نظرة عامة على Plugin SDK](/ar/plugins/sdk-overview) - مرجع واجهة API للتسجيل
- [بيان Plugin](/ar/plugins/manifest) - `cliBackends` وواصفات الإعداد
- [مشغّل الوكيل](/ar/plugins/sdk-agent-harness) - أوقات تشغيل كاملة للوكلاء الخارجيين
