---
read_when:
    - أنت تبني Plugin محليًا للواجهة الخلفية للذكاء الاصطناعي عبر CLI
    - تريد تسجيل واجهة خلفية لمراجع النماذج مثل acme-cli/model
    - تحتاج إلى ربط CLI تابع لجهة خارجية بمشغّل الرجوع الاحتياطي النصي في OpenClaw
sidebarTitle: CLI backend plugins
summary: أنشئ Plugin يسجّل واجهة CLI محلية للذكاء الاصطناعي كواجهة خلفية
title: إنشاء Plugins للواجهة الخلفية لـ CLI
x-i18n:
    generated_at: "2026-07-12T06:07:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6448cdac02a03e5fdf0d802a54189998d97c08769b1b85c8d9963301fa2c5b79
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

تتيح Plugins الخاصة بواجهات CLI الخلفية لـ OpenClaw استدعاء واجهة CLI محلية للذكاء الاصطناعي بوصفها
واجهة خلفية للاستدلال النصي. تظهر الواجهة الخلفية كبادئة موفّر في مراجع النماذج:

```text
acme-cli/acme-large
```

استخدم واجهة CLI خلفية عندما يكون التكامل العلوي متاحًا بالفعل كأمر محلي،
أو عندما تدير واجهة CLI حالة تسجيل الدخول المحلية، أو كخيار احتياطي عندما لا
تكون موفّرات API متاحة.

<Info>
  إذا كانت الخدمة العلوية توفّر API عادية لنموذج عبر HTTP، فاكتب
  [Plugin للموفّر](/ar/plugins/sdk-provider-plugins) بدلًا من ذلك. وإذا كانت بيئة
  التشغيل العلوية تدير جلسات الوكيل الكاملة، أو أحداث الأدوات، أو Compaction، أو حالة
  المهام في الخلفية، فاستخدم [إطار تشغيل للوكيل](/ar/plugins/sdk-agent-harness).
</Info>

## ما الذي يديره Plugin

لـ Plugin الخاص بواجهة CLI الخلفية ثلاثة عقود:

| العقد                | الملف                  | الغرض                                                       |
| -------------------- | ---------------------- | ----------------------------------------------------------- |
| مدخل الحزمة          | `package.json`         | يوجّه OpenClaw إلى وحدة تشغيل Plugin                        |
| ملكية البيان         | `openclaw.plugin.json` | يعلن معرّف الواجهة الخلفية قبل تحميل بيئة التشغيل           |
| التسجيل وقت التشغيل | `index.ts`             | يستدعي `api.registerCliBackend(...)` مع الإعدادات الافتراضية للأمر |

البيان هو بيانات وصفية للاكتشاف: فهو لا ينفّذ واجهة CLI ولا يسجّل
سلوك وقت التشغيل. يبدأ سلوك وقت التشغيل عندما يستدعي مدخل Plugin الدالة
`api.registerCliBackend(...)`.

## Plugin أدنى لواجهة خلفية

<Steps>
  <Step title="إنشاء البيانات الوصفية للحزمة">
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

    يجب أن تتضمن الحزم المنشورة ملفات JavaScript المبنية الخاصة بوقت التشغيل. إذا كان مدخل
    المصدر لديك هو `./src/index.ts`، فأضف `openclaw.runtimeExtensions` ليشير إلى
    ملف JavaScript المبني المناظر. راجع [نقاط الدخول](/ar/plugins/sdk-entrypoints).

  </Step>

  <Step title="إعلان ملكية الواجهة الخلفية">
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

    تمثّل `cliBackends` قائمة ملكية وقت التشغيل؛ وهي تتيح لـ OpenClaw تحميل
    Plugin تلقائيًا عندما تشير الإعدادات أو عملية اختيار النموذج إلى `acme-cli/...`.

    تمثّل `setup.cliBackends` سطح الإعداد المعتمد أولًا على الواصفات. أضفها عندما
    ينبغي لاكتشاف النماذج أو الإعداد الأولي أو الحالة التعرّف على الواجهة الخلفية
    دون تحميل بيئة تشغيل Plugin. استخدم `requiresRuntime: false` فقط عندما
    تكون تلك الواصفات الثابتة كافية للإعداد.

  </Step>

  <Step title="تسجيل الواجهة الخلفية">
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

    يجب أن يطابق معرّف الواجهة الخلفية مدخل `cliBackends` في البيان. تمثّل
    `config` المسجّلة الإعداد الافتراضي فقط؛ إذ تُدمج إعدادات المستخدم ضمن
    `agents.defaults.cliBackends.acme-cli` فوقها في وقت التشغيل.

  </Step>
</Steps>

## بنية الإعدادات

يصف `CliBackendConfig` كيفية تشغيل OpenClaw لواجهة CLI وتحليل مخرجاتها:

| الحقل                                                     | الاستخدام                                                                           |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `command`                                                 | اسم الملف التنفيذي أو المسار المطلق للأمر                                           |
| `args`                                                    | وسيطات argv الأساسية لعمليات التشغيل الجديدة                                       |
| `resumeArgs`                                              | وسيطات argv بديلة للجلسات المستأنفة؛ تدعم `{sessionId}`                             |
| `output` / `resumeOutput`                                 | المحلّل: `json` أو `jsonl` أو `text`                                                |
| `jsonlDialect`                                            | لهجة أحداث JSONL: ‏`claude-stream-json` أو `gemini-stream-json`                     |
| `liveSession`                                             | وضع عملية CLI طويلة الأمد (`claude-stdio`)                                          |
| `input`                                                   | نقل الموجّه: `arg` أو `stdin`                                                       |
| `maxPromptArgChars`                                       | الحد الأقصى لطول الموجّه في وضع `arg` قبل الرجوع إلى stdin                          |
| `env` / `clearEnv`                                        | متغيرات بيئة إضافية لحقنها، أو أسماء لإزالتها قبل التشغيل                          |
| `modelArg`                                                | العلامة المستخدمة قبل معرّف النموذج                                                |
| `modelAliases`                                            | ربط معرّفات نماذج OpenClaw بالمعرّفات الأصلية لواجهة CLI                           |
| `sessionArg` / `sessionArgs`                              | كيفية تمرير معرّف الجلسة                                                           |
| `sessionMode`                                             | `always` أو `existing` أو `none`                                                    |
| `sessionIdFields`                                         | حقول JSON التي يقرأها OpenClaw من مخرجات CLI                                        |
| `systemPromptArg` / `systemPromptFileArg`                 | نقل موجّه النظام                                                                    |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | نقل تجاوز الإعدادات لملف موجّه النظام (مثل `-c`)                                   |
| `systemPromptMode`                                        | `append` أو `replace`                                                               |
| `systemPromptWhen`                                        | `first` أو `always` أو `never`                                                      |
| `imageArg` / `imageMode`                                  | علامة مسار الصورة وكيفية تمرير صور متعددة (`repeat` أو `list`)                     |
| `imagePathScope`                                          | مكان وجود ملفات الصور المرحّلية قبل التسليم: `temp` أو `workspace`                 |
| `serialize`                                               | إبقاء عمليات التشغيل التابعة للواجهة الخلفية نفسها مرتّبة                          |
| `reseedFromRawTranscriptWhenUncompacted`                  | الاشتراك في إعادة تزويد محدودة من النص الخام قبل Compaction لإعادة ضبط الجلسة بأمان |
| `reliability.outputLimits`                                | أقصى عدد من محارف/أسطر JSONL الخام المحتفظ بها لدورة CLI حية واحدة (للواجهات الخلفية ذات الجلسات الحية) |
| `reliability.watchdog`                                    | ضبط مهلة انعدام المخرجات، بشكل منفصل لعمليات التشغيل الجديدة والمستأنفة            |

فضّل أصغر إعداد ثابت يطابق واجهة CLI. لا تضف استدعاءات رجوع خاصة بـ Plugin
إلا للسلوك الذي ينتمي فعلًا إلى الواجهة الخلفية.

## خطافات الواجهة الخلفية المتقدمة

يمكن لـ `CliBackendPlugin` أيضًا تعريف ما يلي:

| الخطاف                            | الاستخدام                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | إعادة كتابة إعدادات المستخدم القديمة بعد الدمج                              |
| `resolveExecutionArgs(ctx)`        | إضافة علامات خاصة بالطلب، مثل مقدار التفكير أو عزل الأسئلة الجانبية         |
| `prepareExecution(ctx)`            | إنشاء جسور مؤقتة للمصادقة أو الإعدادات قبل التشغيل                          |
| `transformSystemPrompt(ctx)`       | تطبيق تحويل نهائي خاص بواجهة CLI على موجّه النظام                            |
| `textTransforms`                   | استبدالات ثنائية الاتجاه للموجّه/المخرجات                                    |
| `defaultAuthProfileId`             | تفضيل ملف تعريف مصادقة محدد في OpenClaw                                      |
| `authEpochMode`                    | تحديد كيفية إبطال تغييرات المصادقة لجلسات CLI المخزّنة                       |
| `nativeToolMode`                   | إعلان ما إذا كانت الأدوات الأصلية غائبة، أو مفعّلة دائمًا، أو قابلة لاختيار المضيف |
| `sideQuestionToolMode`             | إعلان الأدوات الأصلية المعطّلة للأسئلة الجانبية عبر `/btw`                  |
| `bundleMcp` / `bundleMcpMode`      | الاشتراك في جسر أدوات MCP ذي local loopback الخاص بـ OpenClaw                |
| `ownsNativeCompaction`             | الواجهة الخلفية تدير Compaction الخاص بها — ويؤجل OpenClaw المعالجة          |
| `runtimeArtifact`                  | ربط مشغّل برنامج نصي بشجرة الحزمة المضمّنة الكاملة الخاصة به                 |

أبقِ هذه الخطافات ضمن ملكية الموفّر. لا تضف فروعًا خاصة بواجهة CLI إلى النواة عندما
يستطيع خطاف للواجهة الخلفية التعبير عن السلوك.

يكون `runtimeArtifact` مملوكًا لـ Plugin ولا يمكن للمستخدم تجاوزه. ولا يُرجع إليه
إلا عندما تُنشئ دورة استدلال حية صلاحية إعداد موثّقة أو تعيد التحقق منها؛
ولا تتطلبه عمليات تشغيل CLI العادية. لا تستطيع واجهة خلفية لا تتضمن هذا الإعلان
إنشاء صلاحية إعداد CLI موثّقة. يحدّد إعلان `bundled-package-tree`
مالك `package.json` الدقيق، ويشترط أن تكون نقطة دخول الحزمة هي
الأمر. يحسب OpenClaw تجزئة شجرة الحزمة المثبّتة الكاملة والمحدودة، بما في ذلك
التبعيات المتداخلة، ويرفض التشغيل افتراضيًا عند وجود روابط رمزية تعيد التوجيه،
أو مشغّلات خارج الحزمة المعلنة، أو إعلانات لتبعيات خارجية مطلوبة،
أو أشجار تتجاوز الحجم المسموح، أو برامج نصية مجهولة. لا تعلن ذلك إلا عندما
تحتوي تلك الشجرة على تنفيذ الاستدلال الكامل؛ فتكاملات الأدوات الاختيارية
لا تجعل مخطط تنفيذ خارجي آمنًا.

إذا كانت الواجهة الخلفية نفسها توفّر أيضًا ملفًا تنفيذيًا أصليًا مكتفيًا ذاتيًا، فأدرج
أسماءه الأساسية القياسية في `nativeExecutableNames`. تظل الأوامر الأصلية الأخرى
غير موثّقة حتى عندما يتجاوز المستخدم أمر الواجهة الخلفية.

`ctx.executionMode` هو `"agent"` للجولات العادية و`"side-question"` لاستدعاءات
`/btw` المؤقتة. استخدمه عندما تحتاج CLI إلى أعلام تشغيل لمرة واحدة مختلفة،
مثل تعطيل الأدوات الأصلية أو استمرارية الجلسة أو سلوك الاستئناف لـ
BTW. إذا كانت الواجهة الخلفية تستخدم عادةً `nativeToolMode: "always-on"` لكن
وسائط argv الخاصة بالسؤال الجانبي تعطل تلك الأدوات بصورة موثوقة، فعيّن أيضًا
`sideQuestionToolMode: "disabled"`؛ وإلا فإن OpenClaw يفشل بوضع مغلق عندما يتطلب BTW
تشغيل CLI بلا أدوات.

عيّن `nativeToolMode: "selectable"` فقط عندما تستطيع `resolveExecutionArgs` تعطيل
كل أداة أصلية للواجهة الخلفية في تشغيل منفرد. في عمليات التشغيل المقيّدة هذه،
تكون `ctx.toolAvailability.native` صفًا فارغًا، وتكون
`ctx.toolAvailability.mcp` قائمة السماح الدقيقة لـ MCP والمعزولة عن المضيف. يجب على الخطاف
استبدال أعلام الأدوات المتعارضة وإرجاع argv تفرض القيمتين؛
يستدعيه OpenClaw مرة واحدة مع وسائط argv النهائية لبدء جديد أو للاستئناف، ويفشل بوضع مغلق عندما
تعجز الواجهة الخلفية عن فرض القيد. تكون أسماء MCP في هذا السياق آمنة
للموافقة التلقائية فقط لأن المضيف سبق أن قيّد إعداد MCP المُنشأ
بهذه الخوادم والأدوات.

### `ownsNativeCompaction`: إلغاء الاشتراك في Compaction الخاص بـ OpenClaw

إذا كانت واجهتك الخلفية تشغّل وكيلًا يضغط سجل المحادثة **الخاص به**، فعيّن
`ownsNativeCompaction: true` كي لا يعمل مُلخّص الحماية في OpenClaw أبدًا
على جلساته؛ إذ تعيد دورة حياة Compaction في CLI عملية بلا تأثير وتستمر
الجولة. يصرّح `claude-cli` بذلك لأن Claude Code ينفّذ Compaction
داخليًا من دون نقطة نهاية في إطار التشغيل. أما جلسات إطار التشغيل الأصلية مثل Codex
فتستمر في التوجيه إلى نقطة نهاية Compaction الخاصة بإطار تشغيلها.

**لا تصرّح به إلا عند تحقق كل ما يلي**، وإلا فقد تظل جلسة مؤجلة
متجاوزة للميزانية كذلك أو تصبح قديمة (إذ لن ينقذها OpenClaw بعد الآن):

- تنفّذ الواجهة الخلفية Compaction لسجلها أو تقيّد حجمه بموثوقية عند اقترابه من
  حد النافذة؛
- تحفظ جلسة قابلة للاستئناف كي تبقى الحالة المضغوطة بين الجولات
  (مثل `--resume` / `--session-id`)؛
- ليست جلسة Compaction لإطار تشغيل أصلي؛ إذ تُوجَّه الجلسات المطابقة لـ `agentHarnessId`
  إلى نقطة نهاية إطار التشغيل بدلًا من ذلك.

## جسر أدوات MCP

لا تتلقى واجهات CLI الخلفية أدوات OpenClaw افتراضيًا. إذا كانت CLI تستطيع استهلاك
إعداد MCP، فاشترك صراحةً:

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

أوضاع الجسر المدعومة:

| الوضع                    | الاستخدام                                                        |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | واجهات CLI التي تقبل ملف إعداد MCP                               |
| `codex-config-overrides` | واجهات CLI التي تقبل تجاوزات الإعداد ضمن argv                    |
| `gemini-system-settings` | واجهات CLI التي تقرأ إعدادات MCP من دليل إعدادات النظام الخاص بها |

لا تفعّل الجسر إلا عندما تستطيع CLI استهلاكه فعليًا. إذا كانت CLI تملك
طبقة أدوات مضمّنة خاصة بها ولا يمكن تعطيلها، فعيّن `nativeToolMode:
"always-on"` كي يتمكن OpenClaw من الفشل بوضع مغلق عندما يطلب المستدعي عدم استخدام أدوات
أصلية. وإذا أمكنها تعطيل كل أداة أصلية لكل تشغيل، فاستخدم `"selectable"` مع
عقد `resolveExecutionArgs` الموضح أعلاه.

## إعداد المستخدم

يمكن للمستخدمين تجاوز أي قيمة افتراضية للواجهة الخلفية:

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
        primary: "openai/gpt-5.6-sol",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

وثّق الحد الأدنى من التجاوزات التي يُرجح أن يحتاج إليها المستخدمون، وعادةً لا يتعدى
`command` عندما يكون الملف التنفيذي خارج `PATH`.

## التحقق

بالنسبة إلى Plugins المضمّنة، أضف اختبارًا مركّزًا حول المُنشئ وتسجيل
الإعداد، ثم شغّل مسار الاختبار المستهدف للـ Plugin:

```bash
pnpm test extensions/acme-cli
```

بالنسبة إلى Plugins المحلية أو المثبّتة، تحقّق من الاكتشاف ومن تشغيل حقيقي واحد للنموذج:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

إذا كانت الواجهة الخلفية تدعم الصور أو MCP، فأضف اختبارًا حيًا سريعًا يثبت تلك
المسارات باستخدام CLI الحقيقية. لا تعتمد على الفحص الساكن للتحقق من سلوك الموجّه أو الصور أو
MCP أو استئناف الجلسة.

## قائمة التحقق

<Check>يحتوي `package.json` على `openclaw.extensions` وإدخالات وقت تشغيل مبنية للحزم المنشورة</Check>
<Check>يصرّح `openclaw.plugin.json` بـ `cliBackends` وبقيمة مقصودة لـ `activation.onStartup`</Check>
<Check>يكون `setup.cliBackends` موجودًا عندما ينبغي للإعداد أو اكتشاف النموذج رؤية الواجهة الخلفية قبل تشغيلها</Check>
<Check>تستخدم `api.registerCliBackend(...)` معرّف الواجهة الخلفية نفسه الموجود في البيان</Check>
<Check>تظل تجاوزات المستخدم ضمن `agents.defaults.cliBackends.<id>` ذات الأولوية</Check>
<Check>تطابق إعدادات الجلسة وموجّه النظام والصور ومحلّل المخرجات عقد CLI الحقيقي</Check>
<Check>تثبت الاختبارات المستهدفة واختبار حي واحد على الأقل لـ CLI مسار الواجهة الخلفية</Check>

## ذو صلة

- [واجهات CLI الخلفية](/ar/gateway/cli-backends) - إعداد المستخدم وسلوك وقت التشغيل
- [بناء Plugins](/ar/plugins/building-plugins) - أساسيات الحزمة والبيان
- [نظرة عامة على SDK الخاص بالـ Plugin](/ar/plugins/sdk-overview) - مرجع واجهة API للتسجيل
- [بيان الـ Plugin](/ar/plugins/manifest) - `cliBackends` وواصفات الإعداد
- [إطار تشغيل الوكيل](/ar/plugins/sdk-agent-harness) - أوقات تشغيل الوكلاء الخارجية الكاملة
