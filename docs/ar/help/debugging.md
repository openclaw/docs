---
read_when:
    - تحتاج إلى فحص مخرجات النموذج الخام بحثًا عن تسرب الاستدلال
    - تريد تشغيل Gateway في وضع المراقبة أثناء التكرار
    - تحتاج إلى سير عمل قابل للتكرار لتصحيح الأخطاء
summary: 'أدوات تصحيح الأخطاء: وضع المراقبة، وتدفقات النموذج الخام، وتتبع تسرّب الاستدلال'
title: تصحيح الأخطاء
x-i18n:
    generated_at: "2026-05-02T20:47:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: de4bd994079f5463f4734404d1ba0768cb003609e16113f5f8f14179a190e917
    source_path: help/debugging.md
    workflow: 16
---

مساعدات تصحيح الأخطاء لإخراج البث، خصوصًا عندما يمزج مزوّد الاستدلال داخل النص العادي.

## تجاوزات تصحيح أخطاء وقت التشغيل

استخدم `/debug` في المحادثة لضبط تجاوزات إعدادات **وقت التشغيل فقط** (في الذاكرة، وليس على القرص).
يكون `/debug` معطّلًا افتراضيًا؛ فعّله باستخدام `commands.debug: true`.
هذا مفيد عندما تحتاج إلى تبديل إعدادات غامضة دون تعديل `openclaw.json`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

يمسح `/debug reset` كل التجاوزات ويعود إلى الإعدادات الموجودة على القرص.

## إخراج تتبّع الجلسة

استخدم `/trace` عندما تريد رؤية أسطر التتبّع/تصحيح الأخطاء المملوكة لـ Plugin في جلسة واحدة
دون تشغيل الوضع المفصّل الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

استخدم `/trace` لتشخيصات Plugin مثل ملخصات تصحيح أخطاء Active Memory.
واصل استخدام `/verbose` لإخراج الحالة/الأدوات المفصّل العادي، وواصل استخدام
`/debug` لتجاوزات إعدادات وقت التشغيل فقط.

## تتبّع دورة حياة Plugin

استخدم `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` عندما تبدو أوامر دورة حياة Plugin بطيئة
وتحتاج إلى تفصيل مراحل مدمج لبيانات Plugin الوصفية، والاكتشاف، والسجل،
ومرآة وقت التشغيل، وتعديل الإعدادات، وأعمال التحديث. التتبّع اختياري ويكتب
إلى stderr، لذلك يبقى إخراج أوامر JSON قابلًا للتحليل.

مثال:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

مثال على الإخراج:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

استخدم هذا للتحقيق في دورة حياة Plugin قبل اللجوء إلى محلّل أداء CPU.
إذا كان الأمر يعمل من نسخة مصدرية، ففضّل قياس وقت التشغيل المبني
باستخدام `node dist/entry.js ...` بعد `pnpm build`؛ كما أن `pnpm openclaw ...`
يقيس عبء مشغّل المصدر أيضًا.

## توقيت تصحيح أخطاء CLI المؤقت

يحتفظ OpenClaw بـ `src/cli/debug-timing.ts` كمساعد صغير للتحقيق المحلي.
وهو غير موصول عمدًا ببدء تشغيل CLI، أو توجيه الأوامر،
أو أي أمر افتراضيًا. استخدمه فقط أثناء تصحيح أمر بطيء، ثم
أزل الاستيراد والمقاطع قبل إدراج تغيير السلوك.

استخدم هذا عندما يكون أحد الأوامر بطيئًا وتحتاج إلى تفصيل سريع للمراحل قبل
تحديد ما إذا كنت ستستخدم محلّل أداء CPU أو تصلح نظامًا فرعيًا محددًا.

### إضافة مقاطع مؤقتة

أضف المساعد قرب الشيفرة التي تحقق فيها. على سبيل المثال، أثناء تصحيح
`openclaw models list`، قد يبدو تصحيح مؤقت في
`src/commands/models/list.list-command.ts` بهذا الشكل:

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

- ابدأ أسماء المراحل المؤقتة بـ `debug:`.
- أضف بضعة مقاطع فقط حول الأقسام المشتبه في بطئها.
- فضّل المراحل العامة مثل `registry`، أو `auth_store`، أو `rows` بدلًا من أسماء المساعدات.
- استخدم `time()` للعمل المتزامن و`timeAsync()` للوعود.
- حافظ على نظافة stdout. يكتب المساعد إلى stderr، لذلك يبقى إخراج JSON للأمر
  قابلًا للتحليل.
- أزل الاستيرادات والمقاطع المؤقتة قبل فتح PR الإصلاح النهائي.
- ضمّن إخراج التوقيت أو ملخصًا قصيرًا في القضية أو PR يشرح
  التحسين.

### التشغيل بإخراج مقروء

الوضع المقروء هو الأفضل لتصحيح الأخطاء الحي:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

مثال إخراج من تحقيق مؤقت في `models list`:

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

الاستنتاجات من هذا الإخراج:

| المرحلة                                  |      الوقت | ما يعنيه                                                                                           |
| ---------------------------------------- | ---------: | -------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | تحميل مخزن ملفات تعريف المصادقة هو أكبر تكلفة وينبغي التحقيق فيه أولًا.                           |
| `debug:models:list:ensure_models_json`   |       5.0s | مزامنة `models.json` مكلفة بما يكفي لفحص التخزين المؤقت أو شروط التخطي.                           |
| `debug:models:list:load_model_registry`  |       5.9s | بناء السجل وعمل إتاحة المزوّد تكاليف مهمة أيضًا.                                                   |
| `debug:models:list:read_registry_models` |       2.4s | قراءة كل نماذج السجل ليست مجانية وقد تهم عند استخدام `--all`.                                     |
| مراحل إلحاق الصفوف                      | 3.2s إجمالًا | لا يزال بناء خمسة صفوف معروضة يستغرق عدة ثوانٍ، لذا يستحق مسار التصفية فحصًا أدق.                 |
| `debug:models:list:print_model_table`    |        0ms | العرض ليس عنق الزجاجة.                                                                             |

هذه الاستنتاجات كافية لتوجيه التصحيح التالي دون إبقاء شيفرة التوقيت في
مسارات الإنتاج.

### التشغيل بإخراج JSON

استخدم وضع JSON عندما تريد حفظ بيانات التوقيت أو مقارنتها:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

كل سطر stderr هو كائن JSON واحد:

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

### التنظيف قبل الإدراج

قبل فتح PR النهائي:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

ينبغي ألا يعيد الأمر أي مواضع استدعاء أدوات قياس مؤقتة ما لم يكن PR
يضيف صراحةً سطح تشخيص دائمًا. لإصلاحات الأداء العادية،
أبقِ فقط تغيير السلوك، والاختبارات، وملاحظة قصيرة تتضمن دليل
التوقيت.

للنقاط الساخنة الأعمق في CPU، استخدم توصيف Node (`--cpu-prof`) أو
محلّل أداء خارجيًا بدلًا من إضافة المزيد من مغلفات التوقيت.

## وضع مراقبة Gateway

للتكرار السريع، شغّل Gateway تحت مراقب الملفات:

```bash
pnpm gateway:watch
```

افتراضيًا، يبدأ هذا أو يعيد تشغيل جلسة tmux باسم
`openclaw-gateway-watch-main` (أو متغيرًا خاصًا بملف تعريف/منفذ مثل
`openclaw-gateway-watch-dev-19001`) ويرفق تلقائيًا من الطرفيات التفاعلية.
تبقى الصدف غير التفاعلية، وCI، واستدعاءات تنفيذ الوكيل منفصلة وتطبع
تعليمات الإرفاق بدلًا من ذلك. أرفق يدويًا عند الحاجة:

```bash
tmux attach -t openclaw-gateway-watch-main
```

يشغّل جزء tmux المراقب الخام:

```bash
node scripts/watch-node.mjs gateway --force
```

استخدم وضع المقدمة عندما لا يكون tmux مطلوبًا:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

عطّل الإرفاق التلقائي مع إبقاء إدارة tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

قِس وقت CPU الخاص بـ Gateway المُراقب عند تصحيح نقاط بدء التشغيل/وقت التشغيل الساخنة:

```bash
pnpm gateway:watch --benchmark
```

يستهلك غلاف المراقبة `--benchmark` قبل استدعاء Gateway ويكتب
ملف V8 واحدًا بصيغة `.cpuprofile` لكل خروج ابن Gateway ضمن
`.artifacts/gateway-watch-profiles/`. أوقف Gateway المُراقب أو أعد تشغيله
لتفريغ ملف التعريف الحالي، ثم افتحه باستخدام Chrome DevTools أو Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

استخدم `--benchmark-dir <path>` عندما تريد ملفات التعريف في مكان آخر.

ينقل غلاف tmux محددات وقت التشغيل غير السرية الشائعة مثل
`OPENCLAW_PROFILE`، و`OPENCLAW_CONFIG_PATH`، و`OPENCLAW_STATE_DIR`،
و`OPENCLAW_GATEWAY_PORT`، و`OPENCLAW_SKIP_CHANNELS` إلى الجزء. ضع
بيانات اعتماد المزوّد في ملفك الشخصي/إعداداتك العادية، أو استخدم وضع المقدمة الخام
للأسرار المؤقتة التي تُستخدم مرة واحدة.
كما يضبط جزء tmux المُدار افتراضيًا سجلات Gateway ملوّنة لتحسين القراءة؛
اضبط `FORCE_COLOR=0` عند بدء `pnpm gateway:watch` لتعطيل إخراج ANSI.

يعيد المراقب التشغيل عند تغيّر الملفات ذات الصلة بالبناء ضمن `src/`، وملفات مصدر Plugin،
وبيانات `package.json` و`openclaw.plugin.json` الوصفية الخاصة بـ Plugin، و`tsconfig.json`،
و`package.json`، و`tsdown.config.ts`. تعيد تغييرات بيانات Plugin الوصفية تشغيل
Gateway دون فرض إعادة بناء `tsdown`؛ أما تغييرات المصدر والإعدادات فلا تزال
تعيد بناء `dist` أولًا.

أضف أي أعلام CLI خاصة بـ Gateway بعد `gateway:watch` وسيتم تمريرها في
كل إعادة تشغيل. تؤدي إعادة تشغيل أمر المراقبة نفسه إلى إعادة إنشاء جزء tmux المسمّى، ولا يزال
المراقب الخام يحافظ على قفل مراقبه الوحيد بحيث تُستبدل عمليات المراقبة الأصلية المكررة
بدلًا من تراكمها.

## ملف تعريف التطوير + Gateway التطوير (`--dev`)

استخدم ملف تعريف التطوير لعزل الحالة وتشغيل إعداد آمن وقابل للتخلص منه
للتصحيح. هناك علما `--dev` **اثنان**:

- **`--dev` عام (ملف تعريف):** يعزل الحالة ضمن `~/.openclaw-dev` ويضبط
  منفذ Gateway افتراضيًا على `19001` (وتتحرك المنافذ المشتقة معه).
- **`gateway --dev`: يطلب من Gateway إنشاء إعدادات + مساحة عمل افتراضية تلقائيًا** عند غيابها (ويتخطى BOOTSTRAP.md).

التدفق الموصى به (ملف تعريف التطوير + تمهيد التطوير):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

إذا لم يكن لديك تثبيت عام بعد، فشغّل CLI عبر `pnpm openclaw ...`.

ما يفعله هذا:

1. **عزل ملف التعريف** (`--dev` عام)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (ينتقل المتصفح/canvas وفقًا لذلك)

2. **تمهيد التطوير** (`gateway --dev`)
   - يكتب إعدادات دنيا إذا كانت مفقودة (`gateway.mode=local`، وربط loopback).
   - يضبط `agent.workspace` على مساحة عمل التطوير.
   - يضبط `agent.skipBootstrap=true` (لا يوجد BOOTSTRAP.md).
   - يزرع ملفات مساحة العمل إذا كانت مفقودة:
     `AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`.
   - الهوية الافتراضية: **C3‑PO** (روبوت بروتوكول).
   - يتخطى مزوّدي القنوات في وضع التطوير (`OPENCLAW_SKIP_CHANNELS=1`).

تدفق إعادة الضبط (بداية جديدة):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` هي علامة ملف تعريف **عامة** وقد تبتلعها بعض المشغّلات. إذا احتجت إلى كتابتها صراحةً، فاستخدم صيغة متغير البيئة:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

يمسح `--reset` الإعدادات وبيانات الاعتماد والجلسات ومساحة عمل التطوير (باستخدام
`trash`، وليس `rm`)، ثم يعيد إنشاء إعداد التطوير الافتراضي.

<Tip>
إذا كان Gateway غير خاص بالتطوير قيد التشغيل بالفعل (launchd أو systemd)، فأوقفه أولاً:

```bash
openclaw gateway stop
```

</Tip>

## تسجيل البث الخام (OpenClaw)

يمكن لـ OpenClaw تسجيل **بث المساعد الخام** قبل أي تصفية/تنسيق.
هذه هي أفضل طريقة لمعرفة ما إذا كان الاستدلال يصل على شكل دلتا نصية عادية
(أو على شكل كتل تفكير منفصلة).

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

## تسجيل المقاطع الخام (pi-mono)

لالتقاط **مقاطع OpenAI-compat الخام** قبل تحليلها إلى كتل،
يوفّر pi-mono مسجلاً منفصلاً:

```bash
PI_RAW_STREAM=1
```

مسار اختياري:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

الملف الافتراضي:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> ملاحظة: لا يُصدر هذا إلا العمليات التي تستخدم موفّر
> `openai-completions` الخاص بـ pi-mono.

## ملاحظات السلامة

- يمكن أن تتضمن سجلات البث الخام المطالبات الكاملة، ومخرجات الأدوات، وبيانات المستخدم.
- احتفظ بالسجلات محليًا واحذفها بعد التصحيح.
- إذا شاركت السجلات، فاحذف الأسرار ومعلومات التعريف الشخصية أولاً.

## ذات صلة

- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting)
- [الأسئلة الشائعة](/ar/help/faq)
