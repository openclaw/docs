---
read_when:
    - تحتاج إلى فحص مخرجات النموذج الخام بسبب تسرب الاستدلال
    - تريد تشغيل Gateway في وضع المراقبة أثناء العمل التكراري
    - تحتاج إلى سير عمل قابل للتكرار لتصحيح الأخطاء
summary: 'أدوات تصحيح الأخطاء: وضع المراقبة، وتدفقات النموذج الخام، وتتبع تسرب الاستدلال'
title: تصحيح الأخطاء
x-i18n:
    generated_at: "2026-04-24T07:44:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d52070204e21cd7e5bff565fadab96fdeee0ad906c4c8601572761a096d9025
    source_path: help/debugging.md
    workflow: 15
---

تغطي هذه الصفحة مساعدات تصحيح الأخطاء لمخرجات البث، خاصةً عندما
يمزج provider الاستدلال داخل النص العادي.

## تجاوزات تصحيح أخطاء وقت التشغيل

استخدم `/debug` في الدردشة لضبط تجاوزات إعدادات **وقت التشغيل فقط** (في الذاكرة، وليس على القرص).
يكون `/debug` معطلًا افتراضيًا؛ فعّله باستخدام `commands.debug: true`.
ويكون هذا مفيدًا عندما تحتاج إلى تبديل إعدادات نادرة من دون تحرير `openclaw.json`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

يؤدي `/debug reset` إلى مسح جميع التجاوزات والعودة إلى الإعدادات الموجودة على القرص.

## مخرجات تتبع الجلسة

استخدم `/trace` عندما تريد رؤية أسطر التتبع/تصحيح الأخطاء المملوكة للـ Plugin في جلسة واحدة
من دون تشغيل الوضع المفصل الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

استخدم `/trace` لتشخيصات Plugins مثل ملخصات تصحيح أخطاء Active Memory.
واستمر في استخدام `/verbose` لمخرجات الحالة/الأدوات المفصلة العادية، واستمر في استخدام
`/debug` لتجاوزات إعدادات وقت التشغيل فقط.

## توقيت تصحيح الأخطاء المؤقت في CLI

يحتفظ OpenClaw بالملف `src/cli/debug-timing.ts` كمساعد صغير للتحقيق المحلي.
وهو غير موصول عمدًا ببدء تشغيل CLI، أو توجيه الأوامر، أو أي أمر افتراضيًا. استخدمه فقط أثناء تصحيح أمر بطيء، ثم
أزل الاستيراد وspans قبل اعتماد تغيير السلوك.

استخدم هذا عندما يكون الأمر بطيئًا وتحتاج إلى تقسيم سريع للمراحل قبل
أن تقرر ما إذا كنت ستستخدم CPU profiler أو تصلح نظامًا فرعيًا محددًا.

### أضف spans مؤقتة

أضف المساعد قرب الكود الذي تتحقق منه. على سبيل المثال، أثناء تصحيح
`openclaw models list`، قد يبدو patch مؤقت في
`src/commands/models/list.list-command.ts` كما يلي:

```ts
// Temporary debugging only. Remove before landing.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

إرشادات:

- ابدأ أسماء المراحل المؤقتة بالبادئة `debug:`.
- أضف فقط عددًا قليلًا من spans حول الأقسام المشتبه في بطئها.
- فضّل المراحل العامة مثل `registry` أو `auth_store` أو `rows` بدلًا من
  أسماء المساعدات.
- استخدم `time()` للعمل المتزامن و`timeAsync()` للوعود.
- حافظ على stdout نظيفًا. يكتب المساعد إلى stderr، لذا يبقى إخراج JSON للأمر
  قابلاً للتحليل.
- أزل الاستيرادات وspans المؤقتة قبل فتح PR للإصلاح النهائي.
- ضمّن مخرجات التوقيت أو ملخصًا قصيرًا في issue أو PR يشرح
  التحسين.

### شغّل مع إخراج قابل للقراءة

يكون الوضع القابل للقراءة الأفضل لتصحيح الأخطاء المباشر:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

مثال على المخرجات من تحقيق مؤقت في `models list`:

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

الاستنتاجات من هذه المخرجات:

| المرحلة | الوقت | ما الذي تعنيه |
| ------- | -----: | ------------- |
| `debug:models:list:auth_store` | 20.3s | تحميل مخزن ملفات تعريف المصادقة هو أكبر تكلفة ويجب التحقيق فيه أولًا. |
| `debug:models:list:ensure_models_json` | 5.0s | مزامنة `models.json` مكلفة بما يكفي لفحص التخزين المؤقت أو شروط التخطي. |
| `debug:models:list:load_model_registry` | 5.9s | بناء السجل وعمل إتاحة provider يمثلان أيضًا تكلفة مهمة. |
| `debug:models:list:read_registry_models` | 2.4s | قراءة كل نماذج السجل ليست مجانية وقد تكون مهمة مع `--all`. |
| مراحل إلحاق الصفوف | 3.2s إجمالًا | لا يزال بناء خمسة صفوف معروضة يستغرق عدة ثوانٍ، لذا فإن مسار التصفية يستحق نظرة أقرب. |
| `debug:models:list:print_model_table` | 0ms | العرض ليس عنق الزجاجة. |

هذه النتائج كافية لتوجيه patch التالية من دون الإبقاء على كود التوقيت في
مسارات الإنتاج.

### شغّل مع إخراج JSON

استخدم وضع JSON عندما تريد حفظ بيانات التوقيت أو مقارنتها:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

كل سطر في stderr هو كائن JSON واحد:

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### نظّف قبل الاعتماد

قبل فتح PR النهائي:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

يجب ألا يعيد الأمر أي مواقع استدعاء مؤقتة للأدوات إلا إذا كان PR
يضيف صراحةً سطح تشخيص دائم. وبالنسبة إلى إصلاحات الأداء العادية،
احتفظ فقط بتغيير السلوك، والاختبارات، وملاحظة قصيرة مع دليل التوقيت.

وبالنسبة إلى النقاط الساخنة الأعمق في CPU، استخدم Node profiling ‏(`--cpu-prof`) أو profiler خارجي
بدلًا من إضافة مزيد من أغلفة التوقيت.

## وضع المراقبة لـ Gateway

للتكرار السريع، شغّل gateway تحت مراقب الملفات:

```bash
pnpm gateway:watch
```

وهذا يُطابق:

```bash
node scripts/watch-node.mjs gateway --force
```

يعيد المراقب التشغيل عند ملفات ذات صلة بالبناء تحت `src/`، وملفات مصدر extension،
و`package.json` الخاصة بالـ extension وبيانات `openclaw.plugin.json`، و`tsconfig.json`،
و`package.json`، و`tsdown.config.ts`. تؤدي تغييرات بيانات تعريف extension إلى إعادة تشغيل
gateway من دون فرض إعادة بناء `tsdown`؛ أما تغييرات المصدر والإعدادات فلا تزال
تعيد بناء `dist` أولًا.

أضف أي علامات CLI لـ gateway بعد `gateway:watch` وسيتم تمريرها
في كل إعادة تشغيل. كما أن إعادة تشغيل أمر المراقبة نفسه للمستودع/مجموعة العلامات نفسها
تستبدل الآن المراقب الأقدم بدلًا من ترك مراقبي آباء مكررِين.

## ملف التطوير الشخصي + gateway التطوير (`--dev`)

استخدم ملف التطوير الشخصي لعزل الحالة وتشغيل إعداد آمن وقابل للتخلص منه من أجل
تصحيح الأخطاء. هناك علامتا `--dev` **اثنتان**:

- **`--dev` العامة (الملف الشخصي):** تعزل الحالة تحت `~/.openclaw-dev` و
  تضبط منفذ gateway الافتراضي إلى `19001` (وتتحرك المنافذ المشتقة معه).
- **`gateway --dev`: تخبر Gateway بإنشاء إعداد + مساحة عمل افتراضيين تلقائيًا** عند غيابهما (وتجاوز `BOOTSTRAP.md`).

التدفق الموصى به (ملف تطوير شخصي + إقلاع تطويري):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

إذا لم يكن لديك تثبيت عام بعد، فشغّل CLI عبر `pnpm openclaw ...`.

ما الذي يفعله هذا:

1. **عزل الملف الشخصي** (`--dev` العامة)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (ويتحرك browser/canvas تبعًا لذلك)

2. **إقلاع التطوير** (`gateway --dev`)
   - يكتب إعدادًا حدّيًا أدنى إذا كان مفقودًا (`gateway.mode=local`، والربط على loopback).
   - يضبط `agent.workspace` على مساحة عمل التطوير.
   - يضبط `agent.skipBootstrap=true` ‏(من دون `BOOTSTRAP.md`).
   - يزرع ملفات مساحة العمل إذا كانت مفقودة:
     `AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md`.
   - الهوية الافتراضية: **C3‑PO** ‏(روبوت البروتوكول).
   - يتخطى مزودي القنوات في وضع التطوير (`OPENCLAW_SKIP_CHANNELS=1`).

تدفق إعادة التعيين (بداية جديدة):

```bash
pnpm gateway:dev:reset
```

ملاحظة: `--dev` هي علامة ملف شخصي **عامة** وقد تلتهمها بعض المشغلات.
إذا احتجت إلى كتابتها صراحةً، فاستخدم صيغة متغير البيئة:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

يؤدي `--reset` إلى مسح الإعدادات، وبيانات الاعتماد، والجلسات، ومساحة عمل التطوير (باستخدام
`trash`، وليس `rm`)، ثم يعيد إنشاء إعداد التطوير الافتراضي.

نصيحة: إذا كان gateway غير تطويري يعمل بالفعل (launchd/systemd)، فأوقفه أولًا:

```bash
openclaw gateway stop
```

## تسجيل البث الخام (OpenClaw)

يمكن لـ OpenClaw تسجيل **بث المساعد الخام** قبل أي تصفية/تنسيق.
وهذه أفضل طريقة لمعرفة ما إذا كان الاستدلال يصل كفروق نصية صريحة
(أو ككتل تفكير منفصلة).

فعّله عبر CLI:

```bash
pnpm gateway:watch --raw-stream
```

تجاوز اختياري للمسار:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

متغيرات البيئة المكافئة:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

الملف الافتراضي:

`~/.openclaw/logs/raw-stream.jsonl`

## تسجيل القطع الخام (pi-mono)

لالتقاط **قطع OpenAI-compat الخام** قبل تحليلها إلى كتل،
يكشف pi-mono عن مسجل منفصل:

```bash
PI_RAW_STREAM=1
```

مسار اختياري:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

الملف الافتراضي:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> ملاحظة: لا يتم إصدار هذا إلا بواسطة العمليات التي تستخدم provider
> `openai-completions` في pi-mono.

## ملاحظات السلامة

- قد تتضمن سجلات البث الخام prompts كاملة، ومخرجات الأدوات، وبيانات المستخدم.
- احتفظ بالسجلات محليًا واحذفها بعد تصحيح الأخطاء.
- إذا شاركت السجلات، فنظّف الأسرار وPII أولًا.

## ذو صلة

- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting)
- [الأسئلة الشائعة](/ar/help/faq)
