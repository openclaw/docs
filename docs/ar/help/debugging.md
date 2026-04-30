---
read_when:
    - عليك فحص المخرجات الخام للنموذج بحثًا عن تسرب الاستدلال.
    - تريد تشغيل Gateway في وضع المراقبة أثناء إجراء التعديلات التكرارية
    - تحتاج إلى سير عمل قابل للتكرار لتصحيح الأخطاء
summary: 'أدوات تصحيح الأخطاء: وضع المراقبة، وتدفقات النموذج الخام، وتتبع تسرّب الاستدلال'
title: تصحيح الأخطاء
x-i18n:
    generated_at: "2026-04-30T08:04:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3c4ba151cf1ef1dd689077cee93467b7bc77b765665231028941a345b5345ea
    source_path: help/debugging.md
    workflow: 16
---

مساعدات تصحيح الأخطاء لمخرجات البث، خصوصا عندما يخلط موفر التفكير داخل النص العادي.

## تجاوزات تصحيح أخطاء وقت التشغيل

استخدم `/debug` في الدردشة لضبط تجاوزات إعداد **وقت التشغيل فقط** (في الذاكرة، وليس على القرص).
يكون `/debug` معطلا افتراضيا؛ فعله باستخدام `commands.debug: true`.
يفيد هذا عندما تحتاج إلى تبديل إعدادات غامضة من دون تعديل `openclaw.json`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

يمسح `/debug reset` كل التجاوزات ويعود إلى الإعدادات الموجودة على القرص.

## مخرجات تتبع الجلسة

استخدم `/trace` عندما تريد رؤية أسطر التتبع/تصحيح الأخطاء المملوكة للـ Plugin في جلسة واحدة
من دون تشغيل وضع الإسهاب الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

استخدم `/trace` لتشخيصات Plugin مثل ملخصات تصحيح أخطاء Active Memory.
استمر في استخدام `/verbose` لمخرجات الحالة/الأدوات المطولة العادية، واستمر في استخدام
`/debug` لتجاوزات إعداد وقت التشغيل فقط.

## تتبع دورة حياة Plugin

استخدم `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` عندما تبدو أوامر دورة حياة Plugin بطيئة
وتحتاج إلى تفصيل مراحل مدمج لبيانات Plugin الوصفية، والاكتشاف، والسجل،
ومرآة وقت التشغيل، وتعديل الإعدادات، وأعمال التحديث. التتبع اختياري ويكتب
إلى stderr، لذلك تبقى مخرجات أوامر JSON قابلة للتحليل.

مثال:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

مثال على المخرجات:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

استخدم هذا لاستقصاء دورة حياة Plugin قبل اللجوء إلى محلل CPU.
إذا كان الأمر يعمل من checkout للمصدر، ففضل قياس وقت التشغيل المبني
باستخدام `node dist/entry.js ...` بعد `pnpm build`؛ يقيس `pnpm openclaw ...`
أيضا كلفة مشغل المصدر.

## توقيت تصحيح أخطاء CLI المؤقت

يحتفظ OpenClaw بـ `src/cli/debug-timing.ts` كمساعد صغير للاستقصاء المحلي.
وهو غير موصول عمدا ببدء تشغيل CLI، أو توجيه الأوامر،
أو أي أمر افتراضيا. استخدمه فقط أثناء تصحيح أمر بطيء، ثم
أزل الاستيراد والمقاطع قبل إدراج تغيير السلوك.

استخدم هذا عندما يكون أمر ما بطيئا وتحتاج إلى تفصيل سريع للمراحل قبل
تحديد ما إذا كنت ستستخدم محلل CPU أو تصلح نظاما فرعيا محددا.

### إضافة مقاطع مؤقتة

أضف المساعد قرب الشيفرة التي تستقصيها. مثلا، أثناء تصحيح
`openclaw models list`، قد تبدو رقعة مؤقتة في
`src/commands/models/list.list-command.ts` هكذا:

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
- أضف بضع مقاطع فقط حول الأقسام التي يشتبه في بطئها.
- فضل المراحل العامة مثل `registry` أو `auth_store` أو `rows` على أسماء المساعدات.
- استخدم `time()` للعمل المتزامن و`timeAsync()` للوعود.
- أبق stdout نظيفا. يكتب المساعد إلى stderr، لذلك تبقى مخرجات JSON للأمر
  قابلة للتحليل.
- أزل الاستيرادات والمقاطع المؤقتة قبل فتح PR الإصلاح النهائي.
- أدرج مخرجات التوقيت أو ملخصا قصيرا في القضية أو PR يشرح
  التحسين.

### التشغيل بمخرجات مقروءة

الوضع المقروء هو الأفضل لتصحيح الأخطاء المباشر:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

مثال على مخرجات من استقصاء مؤقت لـ `models list`:

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

| المرحلة                                  |       الوقت | ما يعنيه                                                                                              |
| ---------------------------------------- | ---------: | ----------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | تحميل مخزن ملفات تعريف المصادقة هو أكبر كلفة وينبغي استقصاؤه أولا.                                  |
| `debug:models:list:ensure_models_json`   |       5.0s | مزامنة `models.json` مكلفة بما يكفي لفحص التخزين المؤقت أو شروط التخطي.                              |
| `debug:models:list:load_model_registry`  |       5.9s | بناء السجل وعمل توفر الموفرين هما أيضا كلفتان مؤثرتان.                                               |
| `debug:models:list:read_registry_models` |       2.4s | قراءة كل نماذج السجل ليست مجانية وقد تكون مهمة مع `--all`.                                          |
| مراحل إلحاق الصفوف                       | 3.2s إجمالا | ما زال بناء خمسة صفوف معروضة يستغرق عدة ثوان، لذلك يستحق مسار التصفية نظرة أقرب.                   |
| `debug:models:list:print_model_table`    |        0ms | العرض ليس عنق الزجاجة.                                                                                |

هذه الاستنتاجات كافية لتوجيه الرقعة التالية من دون إبقاء شيفرة التوقيت في
مسارات الإنتاج.

### التشغيل بمخرجات JSON

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

ينبغي ألا يعيد الأمر أي مواضع استدعاء لأدوات قياس مؤقتة، ما لم يكن PR
يضيف صراحة سطح تشخيصات دائما. لإصلاحات الأداء العادية،
أبق فقط تغيير السلوك، والاختبارات، وملاحظة قصيرة مع دليل التوقيت.

للنقاط الساخنة الأعمق في CPU، استخدم تحليل Node (`--cpu-prof`) أو محللا
خارجيا بدلا من إضافة المزيد من مغلفات التوقيت.

## وضع مراقبة Gateway

للتكرار السريع، شغل Gateway تحت مراقب الملفات:

```bash
pnpm gateway:watch
```

افتراضيا، يبدأ هذا أو يعيد تشغيل جلسة tmux باسم
`openclaw-gateway-watch-main` (أو متغير خاص بالملف التعريفي/المنفذ مثل
`openclaw-gateway-watch-dev-19001`) ويجري الإرفاق التلقائي من الطرفيات التفاعلية.
تبقى الصدف غير التفاعلية، وCI، واستدعاءات تنفيذ الوكلاء منفصلة وتطبع
تعليمات الإرفاق بدلا من ذلك. أرفق يدويا عند الحاجة:

```bash
tmux attach -t openclaw-gateway-watch-main
```

تشغل لوحة tmux المراقب الخام:

```bash
node scripts/watch-node.mjs gateway --force
```

استخدم وضع المقدمة عندما لا ترغب في tmux:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

عطل الإرفاق التلقائي مع إبقاء إدارة tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

ينقل مغلف tmux محددات وقت التشغيل غير السرية الشائعة مثل
`OPENCLAW_PROFILE` و`OPENCLAW_CONFIG_PATH` و`OPENCLAW_STATE_DIR`
و`OPENCLAW_GATEWAY_PORT` و`OPENCLAW_SKIP_CHANNELS` إلى اللوحة. ضع
اعتمادات الموفر في ملفك التعريفي/إعدادك العادي، أو استخدم وضع المقدمة الخام
لأسرار مؤقتة لمرة واحدة.

يعيد المراقب التشغيل عند تغيير الملفات ذات الصلة بالبناء تحت `src/`، وملفات مصدر Plugin،
وPlugin `package.json` وبيانات `openclaw.plugin.json` الوصفية، و`tsconfig.json`،
و`package.json`، و`tsdown.config.ts`. تؤدي تغييرات بيانات Plugin الوصفية إلى إعادة تشغيل
Gateway من دون فرض إعادة بناء `tsdown`؛ أما تغييرات المصدر والإعدادات فما زالت
تعيد بناء `dist` أولا.

أضف أي أعلام CLI لـ Gateway بعد `gateway:watch` وسيتم تمريرها في
كل إعادة تشغيل. تؤدي إعادة تشغيل أمر المراقبة نفسه إلى إعادة إنشاء لوحة tmux المسماة، وما زال
المراقب الخام يحتفظ بقفل المراقب الواحد بحيث يتم استبدال آباء المراقبين المكررين
بدلا من تراكمهم.

## ملف تعريف التطوير + Gateway التطوير (`--dev`)

استخدم ملف تعريف التطوير لعزل الحالة وتشغيل إعداد آمن وقابل للتخلص منه
للتصحيح. توجد **علامتا** `--dev`:

- **`--dev` العام (ملف التعريف):** يعزل الحالة تحت `~/.openclaw-dev` ويجعل
  منفذ Gateway الافتراضي `19001` (وتتحرك المنافذ المشتقة معه).
- **`gateway --dev`: يطلب من Gateway إنشاء إعداد افتراضي +
  مساحة عمل تلقائيا** عند غيابهما (وتخطي BOOTSTRAP.md).

التدفق الموصى به (ملف تعريف التطوير + تمهيد التطوير):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

إذا لم يكن لديك تثبيت عام بعد، شغل CLI عبر `pnpm openclaw ...`.

ما يفعله هذا:

1. **عزل ملف التعريف** (`--dev` العام)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (يتحرك المتصفح/اللوحة تبعا لذلك)

2. **تمهيد التطوير** (`gateway --dev`)
   - يكتب إعدادا أدنى عند غيابه (`gateway.mode=local`، ربط local loopback).
   - يضبط `agent.workspace` على مساحة عمل التطوير.
   - يضبط `agent.skipBootstrap=true` (بلا BOOTSTRAP.md).
   - يزرع ملفات مساحة العمل عند غيابها:
     `AGENTS.md`، `SOUL.md`، `TOOLS.md`، `IDENTITY.md`، `USER.md`، `HEARTBEAT.md`.
   - الهوية الافتراضية: **C3‑PO** (درويد بروتوكولات).
   - يتخطى موفري القنوات في وضع التطوير (`OPENCLAW_SKIP_CHANNELS=1`).

تدفق إعادة الضبط (بداية جديدة):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` علم ملف تعريف **عام** وتبتلعه بعض المشغلات. إذا احتجت إلى كتابته صراحة، فاستخدم صيغة متغير البيئة:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

يمسح `--reset` الإعدادات، والاعتمادات، والجلسات، ومساحة عمل التطوير (باستخدام
`trash`، وليس `rm`)، ثم يعيد إنشاء إعداد التطوير الافتراضي.

<Tip>
إذا كان Gateway غير تطويري يعمل بالفعل (launchd أو systemd)، فأوقفه أولا:

```bash
openclaw gateway stop
```

</Tip>

## تسجيل البث الخام (OpenClaw)

يمكن لـ OpenClaw تسجيل **بث المساعد الخام** قبل أي تصفية/تنسيق.
هذه هي أفضل طريقة لمعرفة ما إذا كان التفكير يصل كدلتا نصية عادية
(أو ككتل تفكير منفصلة).

فعّله عبر CLI:

```bash
pnpm gateway:watch --raw-stream
```

تجاوز المسار اختياريًا:

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

## تسجيل الأجزاء الخام (pi-mono)

لالتقاط **أجزاء OpenAI المتوافقة الخام** قبل تحليلها إلى كتل،
يوفّر pi-mono مسجّلًا منفصلًا:

```bash
PI_RAW_STREAM=1
```

المسار الاختياري:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

الملف الافتراضي:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> ملاحظة: لا يصدر هذا إلا من العمليات التي تستخدم مزوّد
> `openai-completions` في pi-mono.

## ملاحظات السلامة

- يمكن أن تتضمن سجلات البث الخام المطالبات الكاملة، ومخرجات الأدوات، وبيانات المستخدم.
- أبقِ السجلات محلية واحذفها بعد تصحيح الأخطاء.
- إذا شاركت السجلات، فأزل الأسرار ومعلومات التعريف الشخصية أولًا.

## ذو صلة

- [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting)
- [الأسئلة الشائعة](/ar/help/faq)
