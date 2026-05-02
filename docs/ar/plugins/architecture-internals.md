---
read_when:
    - تنفيذ خطافات وقت تشغيل المزوّد، أو دورة حياة القناة، أو حزم الباقات
    - تصحيح أخطاء ترتيب تحميل Plugin أو حالة السجل
    - إضافة قدرة Plugin جديدة أو Plugin لمحرك السياق
summary: 'التفاصيل الداخلية لبنية Plugin: مسار التحميل، والسجل، وخطافات وقت التشغيل، ومسارات HTTP، والجداول المرجعية'
title: داخليات معمارية Plugin
x-i18n:
    generated_at: "2026-05-02T20:49:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec593518e51f68ce617d5bc4e55cede2188e9247f863364a9ea956e50ca2675
    source_path: plugins/architecture-internals.md
    workflow: 16
---

For the public capability model, plugin shapes, and ownership/execution
contracts, see [Plugin architecture](/ar/plugins/architecture). This page is the
reference for the internal mechanics: load pipeline, registry, runtime hooks,
Gateway HTTP routes, import paths, and schema tables.

## Load pipeline

At startup, OpenClaw does roughly this:

1. discover candidate plugin roots
2. read native or compatible bundle manifests and package metadata
3. reject unsafe candidates
4. normalize plugin config (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide enablement for each candidate
6. load enabled native modules: built bundled modules use a native loader;
   third-party local source TypeScript uses the emergency Jiti fallback
7. call native `register(api)` hooks and collect registrations into the plugin registry
8. expose the registry to commands/runtime surfaces

<Note>
`activate` is a legacy alias for `register` — the loader resolves whichever is present (`def.register ?? def.activate`) and calls it at the same point. All bundled plugins use `register`; prefer `register` for new plugins.
</Note>

The safety gates happen **before** runtime execution. Candidates are blocked
when the entry escapes the plugin root, the path is world-writable, or path
ownership looks suspicious for non-bundled plugins.

### Manifest-first behavior

The manifest is the control-plane source of truth. OpenClaw uses it to:

- identify the plugin
- discover declared channels/skills/config schema or bundle capabilities
- validate `plugins.entries.<id>.config`
- augment Control UI labels/placeholders
- show install/catalog metadata
- preserve cheap activation and setup descriptors without loading plugin runtime

For native plugins, the runtime module is the data-plane part. It registers
actual behavior such as hooks, tools, commands, or provider flows.

Optional manifest `activation` and `setup` blocks stay on the control plane.
They are metadata-only descriptors for activation planning and setup discovery;
they do not replace runtime registration, `register(...)`, or `setupEntry`.
The first live activation consumers now use manifest command, channel, and provider hints
to narrow plugin loading before broader registry materialization:

- CLI loading narrows to plugins that own the requested primary command
- channel setup/plugin resolution narrows to plugins that own the requested
  channel id
- explicit provider setup/runtime resolution narrows to plugins that own the
  requested provider id
- Gateway startup planning uses `activation.onStartup` for explicit startup
  imports and startup opt-outs; plugins without startup metadata load only
  through narrower activation triggers

Request-time runtime preloads that ask for the broad `all` scope still derive an
explicit effective plugin id set from config, startup planning, configured
channels, slots, and auto-enable rules. If that derived set is empty, OpenClaw
loads an empty runtime registry instead of widening to every discoverable
plugin.

The activation planner exposes both an ids-only API for existing callers and a
plan API for new diagnostics. Plan entries report why a plugin was selected,
separating explicit `activation.*` planner hints from manifest ownership
fallback such as `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, and hooks. That reason split is the compatibility boundary:
existing plugin metadata keeps working, while new code can detect broad hints
or fallback behavior without changing runtime loading semantics.

Setup discovery now prefers descriptor-owned ids such as `setup.providers` and
`setup.cliBackends` to narrow candidate plugins before it falls back to
`setup-api` for plugins that still need setup-time runtime hooks. Provider
setup lists use manifest `providerAuthChoices`, descriptor-derived setup
choices, and install-catalog metadata without loading provider runtime. Explicit
`setup.requiresRuntime: false` is a descriptor-only cutoff; omitted
`requiresRuntime` keeps the legacy setup-api fallback for compatibility. If more
than one discovered plugin claims the same normalized setup provider or CLI
backend id, setup lookup refuses the ambiguous owner instead of relying on
discovery order. When setup runtime does execute, registry diagnostics report
drift between `setup.providers` / `setup.cliBackends` and the providers or CLI
backends registered by setup-api without blocking legacy plugins.

### Plugin cache boundary

OpenClaw does not cache plugin discovery results or direct manifest registry
data behind wall-clock windows. Installs, manifest edits, and load-path changes
must become visible on the next explicit metadata read or snapshot rebuild.
The manifest file parser may keep a bounded file-signature cache keyed by the
opened manifest path, inode, size, and timestamps; that cache only avoids
re-parsing unchanged bytes and must not cache discovery, registry, owner, or
policy answers.

The safe metadata fast path is explicit object ownership, not a hidden cache.
Gateway startup hot paths should pass the current `PluginMetadataSnapshot`, the
derived `PluginLookUpTable`, or an explicit manifest registry through the call
chain. Config validation, startup auto-enable, plugin bootstrap, and provider
selection can reuse those objects while they represent the current config and
plugin inventory. Setup lookup still reconstructs manifest metadata on demand
unless the specific setup path receives an explicit manifest registry; keep that
as a cold-path fallback rather than adding hidden lookup caches. When the input
changes, rebuild and replace the snapshot instead of mutating it or keeping
historical copies.
Views over the active plugin registry and bundled channel bootstrap helpers
should be recomputed from the current registry/root. Short-lived maps are fine
inside one call to dedupe work or guard reentry; they must not become process
metadata caches.

For plugin loading, the persistent cache layer is runtime loading. It may reuse
loader state when code or installed artifacts are actually loaded, such as:

- `PluginLoaderCacheState` and compatible active runtime registries
- jiti/module caches and public-surface loader caches used to avoid importing
  the same runtime surface repeatedly
- filesystem caches for installed plugin artifacts
- short-lived per-call maps for path normalization or duplicate resolution

Those caches are data-plane implementation details. They must not answer
control-plane questions such as "which plugin owns this provider?" unless the
caller deliberately asked for runtime loading.

Do not add persistent or wall-clock caches for:

- discovery results
- direct manifest registries
- manifest registries reconstructed from the installed plugin index
- provider owner lookup, model suppression, provider policy, or public-artifact
  metadata
- any other manifest-derived answer where a changed manifest, installed index,
  or load path should be visible on the next metadata read

Callers that rebuild manifest metadata from the persisted installed plugin
index reconstruct that registry on demand. The installed index is durable
source-plane state; it is not a hidden in-process metadata cache.

## Registry model

Loaded plugins do not directly mutate random core globals. They register into a
central plugin registry.

The registry tracks:

- plugin records (identity, source, origin, status, diagnostics)
- tools
- legacy hooks and typed hooks
- channels
- providers
- gateway RPC handlers
- HTTP routes
- CLI registrars
- background services
- plugin-owned commands

Core features then read from that registry instead of talking to plugin modules
directly. This keeps loading one-way:

- plugin module -> registry registration
- core runtime -> registry consumption

That separation matters for maintainability. It means most core surfaces only
need one integration point: "read the registry", not "special-case every plugin
module".

## Conversation binding callbacks

Plugins that bind a conversation can react when an approval is resolved.

Use `api.onConversationBindingResolved(...)` to receive a callback after a bind
request is approved or denied:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Callback payload fields:

- `status`: `"approved"` or `"denied"`
- `decision`: `"allow-once"`, `"allow-always"`, or `"deny"`
- `binding`: the resolved binding for approved requests
- `request`: the original request summary, detach hint, sender id, and
  conversation metadata

This callback is notification-only. It does not change who is allowed to bind a
conversation, and it runs after core approval handling finishes.

## Provider runtime hooks

Provider plugins have three layers:

- **Manifest metadata** for cheap pre-runtime lookup:
  `setup.providers[].envVars`, deprecated compatibility `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices`, and `channelEnvVars`.
- **Config-time hooks**: `catalog` (legacy `discovery`) plus
  `applyConfigDefaults`.
- **Runtime hooks**: 40+ optional hooks covering auth, model resolution,
  stream wrapping, thinking levels, replay policy, and usage endpoints. See
  the full list under [Hook order and usage](#hook-order-and-usage).

OpenClaw still owns the generic agent loop, failover, transcript handling, and
tool policy. These hooks are the extension surface for provider-specific
behavior without needing a whole custom inference transport.

Use manifest `setup.providers[].envVars` when the provider has env-based
credentials that generic auth/status/model-picker paths should see without
loading plugin runtime. Deprecated `providerAuthEnvVars` is still read by the
compatibility adapter during the deprecation window, and non-bundled plugins
that use it receive a manifest diagnostic. Use manifest `providerAuthAliases`
when one provider id should reuse another provider id's env vars, auth profiles,
config-backed auth, and API-key onboarding choice. Use manifest
`providerAuthChoices` when onboarding/auth-choice CLI surfaces should know the
provider's choice id, group labels, and simple one-flag auth wiring without
loading provider runtime. Keep provider runtime
`envVars` for operator-facing hints such as onboarding labels or OAuth
client-id/client-secret setup vars.

Use manifest `channelEnvVars` when a channel has env-driven auth or setup that
generic shell-env fallback, config/status checks, or setup prompts should see
without loading channel runtime.

### Hook order and usage

For model/provider plugins, OpenClaw calls hooks in this rough order.
The "When to use" column is the quick decision guide.
Compatibility-only provider fields that OpenClaw no longer calls, such as
`ProviderPlugin.capabilities` and `suppressBuiltInModel`, are intentionally not
listed here.

| #   | الخطاف                            | ما يفعله                                                                                                      | متى يُستخدم                                                                                                                                   |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | نشر إعدادات المزوّد في `models.providers` أثناء توليد `models.json`                                           | عندما يملك المزوّد فهرسًا أو قيمًا افتراضية لعنوان URL الأساسي                                                                                |
| 2   | `applyConfigDefaults`             | تطبيق القيم الافتراضية العامة للإعدادات التي يملكها المزوّد أثناء تجسيد الإعدادات                             | عندما تعتمد القيم الافتراضية على وضع المصادقة أو البيئة أو دلالات عائلة نماذج المزوّد                                                        |
| --  | _(البحث المدمج عن النموذج)_        | يحاول OpenClaw مسار السجل/الفهرس العادي أولًا                                                                 | _(ليس خطاف Plugin)_                                                                                                                           |
| 3   | `normalizeModelId`                | تطبيع الأسماء المستعارة القديمة أو التجريبية لمعرّفات النماذج قبل البحث                                       | عندما يملك المزوّد تنظيف الأسماء المستعارة قبل حل النموذج المعياري                                                                            |
| 4   | `normalizeTransport`              | تطبيع `api` / `baseUrl` لعائلة المزوّد قبل تجميع النموذج العام                                                | عندما يملك المزوّد تنظيف النقل لمعرّفات مزوّد مخصصة ضمن عائلة النقل نفسها                                                                    |
| 5   | `normalizeConfig`                 | تطبيع `models.providers.<id>` قبل حل وقت التشغيل/المزوّد                                                      | عندما يحتاج المزوّد إلى تنظيف إعدادات يجب أن يبقى مع Plugin؛ كما تعمل مساعدات عائلة Google المضمنة كدعم احتياطي لإدخالات إعدادات Google المدعومة |
| 6   | `applyNativeStreamingUsageCompat` | تطبيق إعادة كتابة توافق استخدام البث الأصلي على مزوّدي الإعدادات                                             | عندما يحتاج المزوّد إلى إصلاحات بيانات تعريف استخدام البث الأصلي المعتمدة على نقطة النهاية                                                    |
| 7   | `resolveConfigApiKey`             | حل مصادقة علامة البيئة لمزوّدي الإعدادات قبل تحميل مصادقة وقت التشغيل                                        | عندما يملك المزوّد حل مفتاح API ذي علامة بيئية؛ كما يملك `amazon-bedrock` محللًا مدمجًا لعلامات بيئة AWS هنا                                  |
| 8   | `resolveSyntheticAuth`            | إظهار مصادقة محلية/مستضافة ذاتيًا أو مدعومة بالإعدادات دون حفظ نص صريح                                       | عندما يستطيع المزوّد العمل باستخدام علامة بيانات اعتماد اصطناعية/محلية                                                                       |
| 9   | `resolveExternalAuthProfiles`     | تركيب ملفات تعريف مصادقة خارجية يملكها المزوّد؛ القيمة الافتراضية لـ `persistence` هي `runtime-only` لبيانات الاعتماد التي تملكها CLI/التطبيق | عندما يعيد المزوّد استخدام بيانات اعتماد مصادقة خارجية دون حفظ رموز تحديث منسوخة؛ أعلن `contracts.externalAuthProviders` في البيان |
| 10  | `shouldDeferSyntheticProfileAuth` | خفض أولوية عناصر نائبة محفوظة لملفات تعريف اصطناعية خلف مصادقة مدعومة بالبيئة/الإعدادات                    | عندما يخزن المزوّد ملفات تعريف بعناصر نائبة اصطناعية لا يجب أن تفوز بالأولوية                                                                |
| 11  | `resolveDynamicModel`             | حل احتياطي متزامن لمعرّفات نماذج يملكها المزوّد ولم تدخل السجل المحلي بعد                                    | عندما يقبل المزوّد معرّفات نماذج عشوائية من المصدر الأعلى                                                                                    |
| 12  | `prepareDynamicModel`             | تهيئة غير متزامنة، ثم يعمل `resolveDynamicModel` مرة أخرى                                                     | عندما يحتاج المزوّد إلى بيانات تعريف من الشبكة قبل حل المعرّفات غير المعروفة                                                                 |
| 13  | `normalizeResolvedModel`          | إعادة كتابة نهائية قبل أن يستخدم المشغل المضمن النموذج المحلول                                                | عندما يحتاج المزوّد إلى إعادة كتابة النقل لكنه لا يزال يستخدم نقلًا أساسيًا                                                                  |
| 14  | `contributeResolvedModelCompat`   | المساهمة بأعلام توافق لنماذج البائع خلف نقل آخر متوافق                                                        | عندما يتعرف المزوّد على نماذجه الخاصة على عمليات نقل وسيطة دون السيطرة على المزوّد                                                           |
| 15  | `normalizeToolSchemas`            | تطبيع مخططات الأدوات قبل أن يراها المشغل المضمن                                                               | عندما يحتاج المزوّد إلى تنظيف مخططات عائلة النقل                                                                                             |
| 16  | `inspectToolSchemas`              | إظهار تشخيصات مخططات يملكها المزوّد بعد التطبيع                                                               | عندما يريد المزوّد تحذيرات كلمات مفتاحية دون تعليم النواة قواعد خاصة بالمزوّد                                                                |
| 17  | `resolveReasoningOutputMode`      | اختيار عقد مخرجات الاستدلال الأصلي مقابل الموسوم                                                              | عندما يحتاج المزوّد إلى استدلال/مخرجات نهائية موسومة بدلًا من الحقول الأصلية                                                                 |
| 18  | `prepareExtraParams`              | تطبيع معلمات الطلب قبل أغلفة خيارات البث العامة                                                               | عندما يحتاج المزوّد إلى معلمات طلب افتراضية أو تنظيف معلمات لكل مزوّد                                                                        |
| 19  | `createStreamFn`                  | استبدال مسار البث العادي بالكامل بنقل مخصص                                                                    | عندما يحتاج المزوّد إلى بروتوكول سلكي مخصص، وليس مجرد غلاف                                                                                   |
| 20  | `wrapStreamFn`                    | غلاف بث بعد تطبيق الأغلفة العامة                                                                              | عندما يحتاج المزوّد إلى أغلفة توافق لرؤوس الطلب/الجسم/النموذج دون نقل مخصص                                                                  |
| 21  | `resolveTransportTurnState`       | إرفاق رؤوس نقل أصلية لكل دور أو بيانات تعريف                                                                 | عندما يريد المزوّد من عمليات النقل العامة إرسال هوية دور أصلية للمزوّد                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | إرفاق رؤوس WebSocket أصلية أو سياسة تهدئة للجلسة                                                              | عندما يريد المزوّد من عمليات نقل WS العامة ضبط رؤوس الجلسة أو سياسة الرجوع                                                                   |
| 23  | `formatApiKey`                    | منسق ملف تعريف المصادقة: يصبح الملف المحفوظ سلسلة `apiKey` وقت التشغيل                                       | عندما يخزن المزوّد بيانات تعريف مصادقة إضافية ويحتاج إلى شكل رمز وقت تشغيل مخصص                                                             |
| 24  | `refreshOAuth`                    | تجاوز تحديث OAuth لنقاط نهاية تحديث مخصصة أو سياسة فشل التحديث                                               | عندما لا يناسب المزوّد منعشات `pi-ai` المشتركة                                                                                               |
| 25  | `buildAuthDoctorHint`             | تلميح إصلاح يُلحق عند فشل تحديث OAuth                                                                         | عندما يحتاج المزوّد إلى إرشاد إصلاح مصادقة يملكه المزوّد بعد فشل التحديث                                                                     |
| 26  | `matchesContextOverflowError`     | مطابق يملكه المزوّد لتجاوز نافذة السياق                                                                       | عندما تكون لدى المزوّد أخطاء تجاوز خام قد تفوتها الاستدلالات العامة                                                                          |
| 27  | `classifyFailoverReason`          | تصنيف سبب تجاوز الفشل الذي يملكه المزوّد                                                                      | عندما يستطيع المزوّد ربط أخطاء API/النقل الخام بحد المعدل/التحميل الزائد/إلخ                                                                |
| 28  | `isCacheTtlEligible`              | سياسة ذاكرة التخزين المؤقت للموجه لمزوّدي الوكيل/النقل الخلفي                                                | عندما يحتاج المزوّد إلى بوابة TTL لذاكرة التخزين المؤقت خاصة بالوكيل                                                                         |
| 29  | `buildMissingAuthMessage`         | بديل لرسالة استعادة المصادقة المفقودة العامة                                                                  | عندما يحتاج المزوّد إلى تلميح استعادة مصادقة مفقودة خاص بالمزوّد                                                                             |
| 30  | `augmentModelCatalog`             | صفوف فهرس اصطناعية/نهائية تُلحق بعد الاكتشاف                                                                  | عندما يحتاج المزوّد إلى صفوف توافق أمامي اصطناعية في `models list` وأدوات الاختيار                                                           |
| 31  | `resolveThinkingProfile`          | مجموعة مستويات `/think` الخاصة بالنموذج، وتسميات العرض، والقيمة الافتراضية                                   | عندما يوفّر المزوّد سلم تفكير مخصصًا أو تسمية ثنائية لنماذج مختارة                                                                           |
| 32  | `isBinaryThinking`                | خطاف توافق تبديل الاستدلال تشغيل/إيقاف                                                                        | عندما يوفّر المزوّد تفكيرًا ثنائيًا فقط تشغيل/إيقاف                                                                                          |
| 33  | `supportsXHighThinking`           | خطاف توافق دعم استدلال `xhigh`                                                                                | عندما يريد المزوّد `xhigh` على مجموعة فرعية فقط من النماذج                                                                                   |
| 34  | `resolveDefaultThinkingLevel`     | خطاف توافق مستوى `/think` الافتراضي                                                                           | عندما يملك المزوّد سياسة `/think` الافتراضية لعائلة نماذج                                                                                    |
| 35  | `isModernModelRef`                | مطابق النموذج الحديث لمرشحات الملفات الحية واختيار الاختبار الدخاني                                          | عندما يملك المزوّد مطابقة النموذج المفضل للاختبارات الحية/الدخانية                                                                           |
| 36  | `prepareRuntimeAuth`              | استبدال بيانات اعتماد مهيأة بالرمز/المفتاح الفعلي لوقت التشغيل قبل الاستدلال مباشرة                         | عندما يحتاج المزوّد إلى تبادل رمز أو بيانات اعتماد طلب قصيرة العمر                                                                           |
| 37  | `resolveUsageAuth`                | حل بيانات اعتماد الاستخدام/الفوترة لـ `/usage` وواجهات الحالة ذات الصلة                                     | يحتاج الموفر إلى تحليل مخصص لرمز الاستخدام/الحصة أو إلى بيانات اعتماد استخدام مختلفة                                                               |
| 38  | `fetchUsageSnapshot`              | جلب لقطات الاستخدام/الحصة الخاصة بالموفر وتطبيعها بعد حل المصادقة                             | يحتاج الموفر إلى نقطة نهاية استخدام خاصة بالموفر أو محلل حمولة                                                                           |
| 39  | `createEmbeddingProvider`         | بناء محول تضمين يملكه الموفر للذاكرة/البحث                                                     | ينتمي سلوك تضمين الذاكرة إلى Plugin الموفر                                                                                    |
| 40  | `buildReplayPolicy`               | إرجاع سياسة إعادة تشغيل تتحكم في معالجة النص للموفر                                        | يحتاج الموفر إلى سياسة نص مخصصة (مثل إزالة كتل التفكير)                                                               |
| 41  | `sanitizeReplayHistory`           | إعادة كتابة سجل إعادة التشغيل بعد التنظيف العام للنص                                                        | يحتاج الموفر إلى إعادة كتابات إعادة تشغيل خاصة بالموفر تتجاوز مساعدات Compaction المشتركة                                                             |
| 42  | `validateReplayTurns`             | التحقق النهائي من أدوار إعادة التشغيل أو إعادة تشكيلها قبل المشغل المضمن                                           | يحتاج نقل الموفر إلى تحقق أكثر صرامة من الأدوار بعد التنقية العامة                                                                    |
| 43  | `onModelSelected`                 | تشغيل الآثار الجانبية لما بعد التحديد التي يملكها الموفر                                                                 | يحتاج الموفر إلى قياسات عن بعد أو حالة يملكها الموفر عندما يصبح نموذج نشطًا                                                                  |

يتحقق كل من `normalizeModelId` و`normalizeTransport` و`normalizeConfig` أولاً من
Plugin المزوّد المطابق، ثم يتابع عبر Plugins المزوّدين الآخرين القادرين على استخدام الخطافات
إلى أن يغيّر أحدها فعلياً معرف النموذج أو النقل/الإعدادات. يحافظ ذلك على عمل
حشوات مزوّدي الاسم البديل/التوافق من دون مطالبة المستدعي بمعرفة أي
Plugin مضمّن يملك إعادة الكتابة. إذا لم يُعد أي خطاف مزوّد كتابة إدخال إعدادات
مدعوم من عائلة Google، فسيظل مطبّع إعدادات Google المضمّن يطبّق
تنظيف التوافق ذلك.

إذا كان المزوّد يحتاج إلى بروتوكول سلكي مخصص بالكامل أو منفّذ طلبات مخصص،
فهذا صنف مختلف من الإضافات. هذه الخطافات مخصصة لسلوك المزوّد
الذي لا يزال يعمل ضمن حلقة الاستدلال العادية في OpenClaw.

### مثال مزوّد

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### أمثلة مضمّنة

تجمع Plugins المزوّدين المضمّنة الخطافات أعلاه لتلائم احتياجات كل مورّد من حيث الفهرس،
والمصادقة، والتفكير، وإعادة التشغيل، والاستخدام. تعيش مجموعة الخطافات الموثوقة مع
كل Plugin ضمن `extensions/`؛ توضح هذه الصفحة الأشكال بدلاً من
مطابقة القائمة.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    يسجّل OpenRouter وKilocode وZ.AI وxAI كلاً من `catalog` بالإضافة إلى
    `resolveDynamicModel` / `prepareDynamicModel` حتى تتمكن من عرض
    معرفات النماذج المنبعية قبل الفهرس الثابت في OpenClaw.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    يقرن GitHub Copilot وGemini CLI وChatGPT Codex وMiniMax وXiaomi وz.ai
    كلاً من `prepareRuntimeAuth` أو `formatApiKey` مع `resolveUsageAuth` +
    `fetchUsageSnapshot` لامتلاك تبادل الرموز وتكامل `/usage`.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    تتيح العائلات المسماة المشتركة (`google-gemini` و`passthrough-gemini`
    و`anthropic-by-model` و`hybrid-anthropic-openai`) للمزوّدين الاشتراك في
    سياسة النص عبر `buildReplayPolicy` بدلاً من أن يعيد كل Plugin
    تنفيذ التنظيف.
  </Accordion>
  <Accordion title="Catalog-only providers">
    تسجّل `byteplus` و`cloudflare-ai-gateway` و`huggingface` و`kimi-coding` و`nvidia`
    و`qianfan` و`synthetic` و`together` و`venice` و`vercel-ai-gateway` و
    `volcengine` فقط `catalog` وتستخدم حلقة الاستدلال المشتركة.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    تعيش ترويسات الإصدار التجريبي و`/fast` / `serviceTier` و`context1m` داخل
    سطح `api.ts` / `contract-api.ts` العام الخاص بـ Plugin من Anthropic
    (`wrapAnthropicProviderStream` و`resolveAnthropicBetas`
    و`resolveAnthropicFastMode` و`resolveAnthropicServiceTier`) بدلاً من أن تكون في
    SDK العام.
  </Accordion>
</AccordionGroup>

## مساعدات وقت التشغيل

يمكن أن تصل Plugins إلى مساعدات أساسية مختارة عبر `api.runtime`. بالنسبة إلى TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

ملاحظات:

- يعيد `textToSpeech` حمولة إخراج TTS الأساسية العادية لأسطح الملف/الملاحظة الصوتية.
- يستخدم إعدادات `messages.tts` الأساسية واختيار المزوّد.
- يعيد مخزن صوت PCM المؤقت + معدل العينة. يجب على Plugins إعادة أخذ العينات/الترميز للمزوّدين.
- `listVoices` اختياري لكل مزوّد. استخدمه لاختيارات الأصوات المملوكة للمورّد أو تدفقات الإعداد.
- يمكن أن تتضمن قوائم الأصوات بيانات وصفية أغنى مثل اللغة، والجنس، ووسوم الشخصية للاختيارات الواعية بالمزوّد.
- يدعم OpenAI وElevenLabs المهاتفة اليوم. لا يدعمها Microsoft.

يمكن أن تسجّل Plugins أيضاً مزوّدي الكلام عبر `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

ملاحظات:

- أبقِ سياسة TTS والرجوع الاحتياطي وتسليم الرد في النواة.
- استخدم مزوّدي الكلام لسلوك التركيب المملوك للمورّد.
- تتم مطابقة إدخال Microsoft القديم `edge` مع معرف المزوّد `microsoft`.
- نموذج الملكية المفضل موجه نحو الشركة: يمكن لـ Plugin مورّد واحد أن يملك
  مزوّدي النص، والكلام، والصور، والوسائط المستقبلية مع إضافة OpenClaw
  لعقود القدرات هذه.

لفهم الصور/الصوت/الفيديو، تسجّل Plugins مزوّد فهم وسائط واحداً محدد النوع
بدلاً من حزمة مفاتيح/قيم عامة:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

ملاحظات:

- أبقِ التنسيق، والرجوع الاحتياطي، والإعدادات، وتوصيل القنوات في النواة.
- أبقِ سلوك المورّد في Plugin المزوّد.
- يجب أن يبقى التوسّع الإضافي محدد النوع: أساليب اختيارية جديدة، وحقول نتائج اختيارية جديدة، وقدرات اختيارية جديدة.
- يتبع توليد الفيديو النمط نفسه بالفعل:
  - تمتلك النواة عقد القدرة ومساعد وقت التشغيل
  - تسجّل Plugins المورّدين `api.registerVideoGenerationProvider(...)`
  - تستهلك Plugins الميزات/القنوات `api.runtime.videoGeneration.*`

بالنسبة إلى مساعدات وقت تشغيل فهم الوسائط، يمكن أن تستدعي Plugins:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

بالنسبة إلى نسخ الصوت، يمكن أن تستخدم Plugins إما وقت تشغيل فهم الوسائط
أو الاسم البديل الأقدم STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

ملاحظات:

- `api.runtime.mediaUnderstanding.*` هو السطح المشترك المفضل
  لفهم الصور/الصوت/الفيديو.
- يستخدم إعدادات الصوت الأساسية لفهم الوسائط (`tools.media.audio`) وترتيب الرجوع الاحتياطي للمزوّدين.
- يعيد `{ text: undefined }` عندما لا يتم إنتاج مخرج نسخ (على سبيل المثال إدخال متجاوز/غير مدعوم).
- يبقى `api.runtime.stt.transcribeAudioFile(...)` كاسم بديل للتوافق.

يمكن أن تطلق Plugins أيضاً عمليات تشغيل وكلاء فرعيين في الخلفية عبر `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

ملاحظات:

- `provider` و`model` تجاوزات اختيارية لكل عملية تشغيل، وليست تغييرات جلسة دائمة.
- يحترم OpenClaw حقول التجاوز هذه للمتصلين الموثوقين فقط.
- بالنسبة إلى عمليات الرجوع الاحتياطي المملوكة لـ Plugin، يجب أن يختار المشغّلون الاشتراك عبر `plugins.entries.<id>.subagent.allowModelOverride: true`.
- استخدم `plugins.entries.<id>.subagent.allowedModels` لتقييد Plugins الموثوقة إلى أهداف `provider/model` قانونية محددة، أو `"*"` للسماح صراحة بأي هدف.
- لا تزال عمليات الوكيل الفرعي من Plugins غير الموثوقة تعمل، لكن تُرفض طلبات التجاوز بدلاً من الرجوع بصمت.
- تُوسم جلسات الوكيل الفرعي التي تنشئها Plugins بمعرف Plugin المنشئ. قد يحذف الرجوع الاحتياطي `api.runtime.subagent.deleteSession(...)` تلك الجلسات المملوكة فقط؛ ولا يزال حذف جلسة عشوائية يتطلب طلب Gateway بنطاق مسؤول.

بالنسبة إلى بحث الويب، يمكن أن تستهلك Plugins مساعد وقت التشغيل المشترك بدلاً من
الوصول إلى توصيلات أداة الوكيل:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

يمكن أن تسجّل Plugins أيضاً مزوّدي بحث الويب عبر
`api.registerWebSearchProvider(...)`.

ملاحظات:

- أبقِ اختيار المزوّد، وحل بيانات الاعتماد، ودلالات الطلب المشتركة في النواة.
- استخدم مزوّدي بحث الويب لنقل البحث الخاص بالمورّد.
- `api.runtime.webSearch.*` هو السطح المشترك المفضل لـ Plugins الميزات/القنوات التي تحتاج إلى سلوك بحث من دون الاعتماد على مغلّف أداة الوكيل.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: ولّد صورة باستخدام سلسلة مزوّد توليد الصور المكوّنة.
- `listProviders(...)`: اسرد مزوّدي توليد الصور المتاحين وقدراتهم.

## مسارات HTTP في Gateway

يمكن أن تعرض Plugins نقاط نهاية HTTP باستخدام `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

حقول المسار:

- `path`: مسار التوجيه تحت خادم HTTP الخاص بـ Gateway.
- `auth`: مطلوب. استخدم `"gateway"` لطلب مصادقة Gateway العادية، أو `"plugin"` للمصادقة/التحقق من Webhook المدارين بواسطة Plugin.
- `match`: اختياري. `"exact"` (افتراضي) أو `"prefix"`.
- `replaceExisting`: اختياري. يسمح لـ Plugin نفسه باستبدال تسجيل مساره الموجود.
- `handler`: أعِد `true` عندما يعالج المسار الطلب.

ملاحظات:

- تمت إزالة `api.registerHttpHandler(...)` وسيتسبب ذلك في خطأ تحميل Plugin. استخدم `api.registerHttpRoute(...)` بدلا منه.
- يجب أن تصرح مسارات Plugin عن `auth` بوضوح.
- يتم رفض تعارضات `path + match` الدقيقة ما لم يكن `replaceExisting: true`، ولا يمكن لـ Plugin واحد استبدال مسار Plugin آخر.
- يتم رفض المسارات المتداخلة ذات مستويات `auth` المختلفة. أبق سلاسل التمرير الاحتياطي `exact`/`prefix` على مستوى المصادقة نفسه فقط.
- لا تتلقى مسارات `auth: "plugin"` نطاقات وقت تشغيل المشغل تلقائيا. فهي مخصصة Webhook المدارة بواسطة Plugin/التحقق من التوقيع، وليست لاستدعاءات مساعد Gateway ذات الامتيازات.
- تعمل مسارات `auth: "gateway"` داخل نطاق وقت تشغيل طلب Gateway، لكن هذا النطاق محافظ عمدا:
  - تبقي مصادقة الحامل بالسر المشترك (`gateway.auth.mode = "token"` / `"password"`) نطاقات وقت تشغيل مسارات Plugin مثبتة على `operator.write`، حتى إذا أرسل المستدعي `x-openclaw-scopes`
  - تحترم أوضاع HTTP الموثوقة الحاملة للهوية (مثل `trusted-proxy` أو `gateway.auth.mode = "none"` على مدخل خاص) `x-openclaw-scopes` فقط عندما يكون الترويسة موجودا صراحة
  - إذا كان `x-openclaw-scopes` غائبا في طلبات مسارات Plugin الحاملة للهوية تلك، يعود نطاق وقت التشغيل إلى `operator.write`
- قاعدة عملية: لا تفترض أن مسار Plugin بمصادقة Gateway هو سطح إدارة ضمني. إذا كان مسارك يحتاج إلى سلوك مخصص للمدير فقط، فاشترط وضع مصادقة حامل للهوية ووثق عقد ترويسة `x-openclaw-scopes` الصريح.

## مسارات استيراد Plugin SDK

استخدم المسارات الفرعية الضيقة لـ SDK بدلا من برميل الجذر الأحادي `openclaw/plugin-sdk`
عند تأليف Plugins جديدة. المسارات الفرعية الأساسية:

| المسار الفرعي                       | الغرض                                              |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | بدائيات تسجيل Plugin                              |
| `openclaw/plugin-sdk/channel-core`  | مساعدات إدخال/بناء القنوات                        |
| `openclaw/plugin-sdk/core`          | مساعدات مشتركة عامة وعقد شامل                     |
| `openclaw/plugin-sdk/config-schema` | مخطط Zod الجذري `openclaw.json` (`OpenClawSchema`) |

تختار Plugins القنوات من عائلة من الواجهات الضيقة — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, و`channel-actions`. يجب أن يتوحد سلوك الموافقة
على عقد `approvalCapability` واحد بدلا من الخلط بين حقول Plugin غير ذات صلة.
راجع [Plugins القنوات](/ar/plugins/sdk-channel-plugins).

توجد مساعدات وقت التشغيل والإعدادات تحت مسارات فرعية مركزة مطابقة `*-runtime`
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, إلخ). فضل `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot`, و`config-mutation`
بدلا من برميل التوافق الواسع `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`,
و`openclaw/plugin-sdk/infra-runtime` حشوات توافق مهملة لـ
Plugins الأقدم. يجب أن تستورد الشيفرة الجديدة بدائيات عامة أضيق بدلا من ذلك.
</Info>

نقاط الإدخال الداخلية للمستودع (لكل جذر حزمة Plugin مرفق):

- `index.js` — إدخال Plugin مرفق
- `api.js` — برميل مساعدات/أنواع
- `runtime-api.js` — برميل لوقت التشغيل فقط
- `setup-entry.js` — إدخال Plugin للإعداد

يجب أن تستورد Plugins الخارجية المسارات الفرعية `openclaw/plugin-sdk/*` فقط. لا
تستورد أبدا `src/*` لحزمة Plugin أخرى من القلب أو من Plugin آخر.
تفضل نقاط الإدخال المحملة عبر الواجهة لقطة إعدادات وقت التشغيل النشطة عندما
توجد، ثم تعود إلى ملف الإعدادات المحلول على القرص.

توجد مسارات فرعية خاصة بالقدرات مثل `image-generation`, `media-understanding`,
و`speech` لأن Plugins المرفقة تستخدمها اليوم. وهي ليست
عقودا خارجية مجمدة تلقائيا على المدى الطويل — تحقق من صفحة مرجع SDK
ذات الصلة عند الاعتماد عليها.

## مخططات أداة الرسائل

يجب أن تمتلك Plugins مساهمات مخطط `describeMessageTool(...)` الخاصة بالقناة
للبدائيات غير الرسائلية مثل التفاعلات، والقراءات، والاستطلاعات.
يجب أن يستخدم عرض الإرسال المشترك عقد `MessagePresentation` العام
بدلا من حقول الأزرار أو المكونات أو الكتل أو البطاقات الأصلية للمزود.
راجع [عرض الرسائل](/ar/plugins/message-presentation) للعقد،
وقواعد الرجوع، وتعيين المزود، وقائمة تحقق مؤلف Plugin.

تصرح Plugins القادرة على الإرسال بما يمكنها عرضه عبر قدرات الرسائل:

- `presentation` لكتل العرض الدلالية (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` لطلبات التسليم المثبت

يقرر القلب ما إذا كان سيعرض العرض بشكل أصلي أو يخفضه إلى نص.
لا تكشف منافذ هروب واجهة مستخدم أصلية للمزود من أداة الرسائل العامة.
تبقى مساعدات SDK المهملة للمخططات الأصلية القديمة مصدرة لـ
Plugins الخارجية الحالية، لكن يجب ألا تستخدمها Plugins الجديدة.

## حل أهداف القناة

يجب أن تمتلك Plugins القنوات دلالات الأهداف الخاصة بالقناة. أبق مضيف
الصادر المشترك عاما واستخدم سطح محول الرسائل لقواعد المزود:

- `messaging.inferTargetChatType({ to })` يقرر ما إذا كان ينبغي التعامل مع هدف مطبع
  كـ `direct` أو `group` أو `channel` قبل البحث في الدليل.
- `messaging.targetResolver.looksLikeId(raw, normalized)` يخبر القلب بما إذا كان
  يجب أن يتخطى الإدخال مباشرة إلى حل شبيه بالمعرف بدلا من البحث في الدليل.
- `messaging.targetResolver.resolveTarget(...)` هو رجوع Plugin عندما
  يحتاج القلب إلى حل نهائي مملوك للمزود بعد التطبيع أو بعد
  إخفاق الدليل.
- `messaging.resolveOutboundSessionRoute(...)` يمتلك إنشاء مسار جلسة
  خاص بالمزود بمجرد حل الهدف.

التقسيم الموصى به:

- استخدم `inferTargetChatType` لقرارات الفئة التي يجب أن تحدث قبل
  البحث في الأقران/المجموعات.
- استخدم `looksLikeId` لفحوصات "عامل هذا كمعرف هدف صريح/أصلي".
- استخدم `resolveTarget` كرجوع تطبيع خاص بالمزود، وليس لـ
  بحث واسع في الدليل.
- أبق المعرفات الأصلية للمزود مثل معرفات الدردشة، ومعرفات الخيوط، وJIDs، والمعرّفات، ومعرفات الغرف
  داخل قيم `target` أو المعاملات الخاصة بالمزود، وليس في حقول SDK
  العامة.

## الأدلة المدعومة بالإعدادات

يجب أن تبقي Plugins التي تشتق إدخالات دليل من الإعدادات ذلك المنطق داخل
Plugin وأن تعيد استخدام المساعدات المشتركة من
`openclaw/plugin-sdk/directory-runtime`.

استخدم هذا عندما تحتاج قناة إلى أقران/مجموعات مدعومة بالإعدادات مثل:

- أقران الرسائل المباشرة المدفوعون بقائمة السماح
- خرائط القنوات/المجموعات المعدة
- بدائل دليل ثابتة بنطاق الحساب

تتعامل المساعدات المشتركة في `directory-runtime` مع العمليات العامة فقط:

- ترشيح الاستعلام
- تطبيق الحد
- مساعدات إزالة التكرار/التطبيع
- بناء `ChannelDirectoryEntry[]`

يجب أن يبقى فحص الحساب الخاص بالقناة وتطبيع المعرف داخل
تنفيذ Plugin.

## كتالوجات المزودين

يمكن لـ Plugins المزودين تعريف كتالوجات نماذج للاستدلال باستخدام
`registerProvider({ catalog: { run(...) { ... } } })`.

يعيد `catalog.run(...)` الشكل نفسه الذي يكتبه OpenClaw في
`models.providers`:

- `{ provider }` لإدخال مزود واحد
- `{ providers }` لإدخالات مزودين متعددة

استخدم `catalog` عندما يمتلك Plugin معرفات نماذج خاصة بالمزود، أو قيم URL الأساسية
الافتراضية، أو بيانات تعريف نماذج محكومة بالمصادقة.

يتحكم `catalog.order` في وقت دمج كتالوج Plugin بالنسبة إلى مزودي OpenClaw
الضمنيين المدمجين:

- `simple`: مزودون عاديون مدفوعون بمفتاح API أو env
- `profile`: مزودون يظهرون عند وجود ملفات تعريف مصادقة
- `paired`: مزودون ينشئون عدة إدخالات مزودين ذات صلة
- `late`: آخر تمريرة، بعد المزودين الضمنيين الآخرين

يفوز المزودون اللاحقون عند تصادم المفاتيح، لذلك يمكن لـ Plugins أن تتجاوز عمدا
إدخال مزود مدمج له معرف المزود نفسه.

التوافق:

- لا يزال `discovery` يعمل كاسم مستعار قديم
- إذا تم تسجيل كل من `catalog` و`discovery`، يستخدم OpenClaw `catalog`

## فحص القناة للقراءة فقط

إذا سجل Plugin قناة، ففضل تنفيذ
`plugin.config.inspectAccount(cfg, accountId)` إلى جانب `resolveAccount(...)`.

لماذا:

- `resolveAccount(...)` هو مسار وقت التشغيل. يسمح له بافتراض أن بيانات الاعتماد
  مجسدة بالكامل ويمكنه الفشل بسرعة عند فقدان الأسرار المطلوبة.
- يجب ألا تحتاج مسارات أوامر القراءة فقط مثل `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`، وتدفقات إصلاح doctor/config
  إلى تجسيد بيانات اعتماد وقت التشغيل لمجرد
  وصف الإعدادات.

سلوك `inspectAccount(...)` الموصى به:

- أعد حالة حساب وصفية فقط.
- حافظ على `enabled` و`configured`.
- أدرج حقول مصدر/حالة بيانات الاعتماد عند اللزوم، مثل:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- لا تحتاج إلى إرجاع قيم الرموز الخام لمجرد الإبلاغ عن
  التوافر للقراءة فقط. يكفي إرجاع `tokenStatus: "available"` (وحقل المصدر المطابق)
  لأوامر نمط الحالة.
- استخدم `configured_unavailable` عندما تكون بيانات الاعتماد معدة عبر SecretRef ولكنها
  غير متاحة في مسار الأمر الحالي.

يتيح هذا لأوامر القراءة فقط الإبلاغ عن "معد لكنه غير متاح في مسار هذا الأمر"
بدلا من التعطل أو الإبلاغ خطأ عن أن الحساب غير معد.

## حزم الحزم

قد يتضمن دليل Plugin ملف `package.json` يحتوي على `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

يصبح كل إدخال Plugin. إذا سردت الحزمة عدة extensions، يصبح معرف Plugin
`name/<fileBase>`.

إذا كان Plugin يستورد تبعيات npm، فثبتها في ذلك الدليل حتى
يتاح `node_modules` (`npm install` / `pnpm install`).

حاجز أمان: يجب أن يبقى كل إدخال `openclaw.extensions` داخل دليل Plugin
بعد حل الروابط الرمزية. يتم رفض الإدخالات التي تهرب من دليل الحزمة.

ملاحظة أمنية: يثبت `openclaw plugins install` تبعيات Plugin باستخدام
`npm install --omit=dev --ignore-scripts` محلي للمشروع (بلا سكربتات دورة حياة،
ولا تبعيات تطوير في وقت التشغيل)، متجاهلا إعدادات تثبيت npm العالمية الموروثة.
أبق أشجار تبعيات Plugin "JS/TS نقية" وتجنب الحزم التي تتطلب
بناءات `postinstall`.

اختياري: يمكن أن يشير `openclaw.setupEntry` إلى وحدة خفيفة للإعداد فقط.
عندما يحتاج OpenClaw إلى أسطح إعداد لـ Plugin قناة معطلة، أو
عندما يكون Plugin قناة مفعلا لكنه لا يزال غير معد، فإنه يحمل `setupEntry`
بدلا من إدخال Plugin الكامل. هذا يجعل بدء التشغيل والإعداد أخف
عندما يكون إدخال Plugin الرئيسي لديك يربط أيضا الأدوات أو الخطافات أو شيفرة أخرى
مخصصة لوقت التشغيل فقط.

اختياري: يمكن لـ `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
أن يدخل Plugin قناة في مسار `setupEntry` نفسه أثناء مرحلة بدء تشغيل Gateway
قبل الاستماع، حتى عندما تكون القناة معدة بالفعل.

استخدم هذا فقط عندما يغطي `setupEntry` بالكامل سطح بدء التشغيل الذي يجب أن يوجد
قبل أن يبدأ Gateway بالاستماع. عمليا، يعني ذلك أن إدخال الإعداد
يجب أن يسجل كل قدرة مملوكة للقناة يعتمد عليها بدء التشغيل، مثل:

- تسجيل القناة نفسه
- أي مسارات HTTP يجب أن تكون متاحة قبل أن يبدأ Gateway بالاستماع
- أي طرق أو أدوات أو خدمات Gateway يجب أن توجد خلال تلك النافذة نفسها

إذا كان إدخالك الكامل لا يزال يمتلك أي قدرة بدء تشغيل مطلوبة، فلا تمكن
هذه الراية. أبق Plugin على السلوك الافتراضي ودع OpenClaw يحمل
الإدخال الكامل أثناء بدء التشغيل.

يمكن للقنوات المرفقة أيضا نشر مساعدات سطح عقد للإعداد فقط يمكن للقلب
استشارتها قبل تحميل وقت تشغيل القناة الكامل. سطح ترقية الإعداد الحالي هو:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

يستخدم Core هذا السطح عندما يحتاج إلى ترقية تكوين قناة حساب واحد قديم إلى
`channels.<id>.accounts.*` بدون تحميل إدخال Plugin الكامل.
Matrix هو المثال المضمّن الحالي: ينقل فقط مفاتيح المصادقة/التمهيد إلى حساب
مسمّى تمت ترقيته عندما تكون الحسابات المسمّاة موجودة بالفعل، ويمكنه الحفاظ على
مفتاح حساب افتراضي غير قياسي مكوّن بدلاً من إنشاء
`accounts.default` دائماً.

تحافظ محولات تصحيح الإعداد هذه على كسل اكتشاف سطح العقد المضمّنة. يبقى وقت
الاستيراد خفيفاً؛ إذ لا يُحمّل سطح الترقية إلا عند أول استخدام بدلاً من إعادة
الدخول إلى بدء تشغيل القناة المضمّنة عند استيراد الوحدة.

عندما تتضمن أسطح بدء التشغيل هذه طرق gateway RPC، أبقها على بادئة خاصة
بالـ Plugin. تبقى مساحات أسماء إدارة Core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) محجوزة وتُحل دائماً إلى
`operator.admin`، حتى إذا طلب Plugin نطاقاً أضيق.

مثال:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### بيانات تعريف كتالوج القنوات

يمكن لـ Channel plugins الإعلان عن بيانات تعريف الإعداد/الاكتشاف عبر `openclaw.channel` و
تلميحات التثبيت عبر `openclaw.install`. يُبقي هذا بيانات كتالوج Core خالية.

مثال:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

حقول `openclaw.channel` المفيدة خارج المثال الأدنى:

- `detailLabel`: تسمية ثانوية لأسطح الكتالوج/الحالة الأكثر ثراءً
- `docsLabel`: تجاوز نص رابط الوثائق
- `preferOver`: معرّفات Plugin/القناة ذات الأولوية الأدنى التي يجب أن يتقدم عليها إدخال الكتالوج هذا
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: عناصر تحكم نسخ سطح الاختيار
- `markdownCapable`: يعلّم القناة بأنها قادرة على markdown لقرارات تنسيق الإرسال
- `exposure.configured`: إخفاء القناة من أسطح عرض القنوات المكوّنة عند ضبطه على `false`
- `exposure.setup`: إخفاء القناة من منتقيات الإعداد/التكوين التفاعلية عند ضبطه على `false`
- `exposure.docs`: تعليم القناة بأنها داخلية/خاصة لأسطح تنقل الوثائق
- `showConfigured` / `showInSetup`: أسماء بديلة قديمة لا تزال مقبولة للتوافق؛ فضّل `exposure`
- `quickstartAllowFrom`: إدخال القناة في تدفق البدء السريع القياسي `allowFrom`
- `forceAccountBinding`: طلب ربط حساب صريح حتى عند وجود حساب واحد فقط
- `preferSessionLookupForAnnounceTarget`: تفضيل البحث عن الجلسة عند حل أهداف الإعلان

يمكن لـ OpenClaw أيضاً دمج **كتالوجات قنوات خارجية** (على سبيل المثال، تصدير
سجل MPM). ضع ملف JSON في أحد المواضع التالية:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

أو وجّه `OPENCLAW_PLUGIN_CATALOG_PATHS` (أو `OPENCLAW_MPM_CATALOG_PATHS`) إلى
ملف JSON واحد أو أكثر (مفصولة بفاصلة/فاصلة منقوطة/`PATH`). يجب أن يحتوي كل ملف
على `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. يقبل المحلل أيضاً `"packages"` أو `"plugins"` كأسماء بديلة قديمة لمفتاح `"entries"`.

تعرض إدخالات كتالوج القنوات المولّدة وإدخالات كتالوج تثبيت المزودين
حقائق مصدر التثبيت المطبّعة بجوار كتلة `openclaw.install` الخام. تحدد
الحقائق المطبّعة ما إذا كانت مواصفة npm إصداراً محدداً أم محدد اختيار عائماً،
وما إذا كانت بيانات تعريف السلامة المتوقعة موجودة، وما إذا كان مسار مصدر محلي
متاحاً أيضاً. عندما تكون هوية الكتالوج/الحزمة معروفة، تحذّر الحقائق المطبّعة
إذا انحرف اسم حزمة npm المحلّل عن تلك الهوية.
كما تحذّر عندما يكون `defaultChoice` غير صالح أو يشير إلى مصدر غير متاح،
وعندما تكون بيانات تعريف سلامة npm موجودة بدون مصدر npm صالح. يجب على
المستهلكين التعامل مع `installSource` كحقل اختياري إضافي حتى لا تضطر الإدخالات
المبنية يدوياً ووسائط توافق الكتالوج إلى تركيبه.
يتيح هذا للإعداد التشغيلي والتشخيصات شرح حالة مستوى المصدر دون
استيراد وقت تشغيل Plugin.

يجب أن تفضّل إدخالات npm الخارجية الرسمية `npmSpec` محدداً بالإضافة إلى
`expectedIntegrity`. لا تزال أسماء الحزم المجردة ووسوم التوزيع تعمل للتوافق،
لكنها تعرض تحذيرات مستوى المصدر حتى يمكن للكتالوج الانتقال نحو تثبيتات مثبتة
ومتحقق من سلامتها بدون كسر plugins الحالية.
عندما يثبّت الإعداد التشغيلي من مسار كتالوج محلي، يسجل إدخال فهرس Plugin مُدار
مع `source: "path"` و`sourcePath` نسبي إلى مساحة العمل عندما يكون ذلك ممكناً.
يبقى مسار التحميل التشغيلي المطلق في
`plugins.load.paths`؛ ويتجنب سجل التثبيت تكرار مسارات محطة العمل المحلية
داخل تكوين طويل العمر. يُبقي هذا تثبيتات التطوير المحلية مرئية لتشخيصات مستوى
المصدر دون إضافة سطح ثانٍ خام للإفصاح عن مسار نظام الملفات. فهرس Plugin
المستمر `plugins/installs.json` هو مصدر حقيقة التثبيت ويمكن تحديثه دون تحميل
وحدات وقت تشغيل Plugin.
تكون خريطة `installRecords` الخاصة به دائمة حتى عندما يكون بيان Plugin مفقوداً
أو غير صالح؛ وتكون مصفوفة `plugins` الخاصة به عرض بيان قابلاً لإعادة البناء.

## Plugins محرك السياق

تمتلك Plugins محرك السياق تنسيق سياق الجلسة للإدخال والتجميع وCompaction.
سجّلها من Plugin الخاص بك باستخدام
`api.registerContextEngine(id, factory)`، ثم اختر المحرك النشط باستخدام
`plugins.slots.contextEngine`.

استخدم هذا عندما يحتاج Plugin الخاص بك إلى استبدال أو توسيع مسار السياق
الافتراضي بدلاً من مجرد إضافة بحث ذاكرة أو خطافات.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

يعرض المصنع `ctx` قيماً اختيارية هي `config` و`agentDir` و`workspaceDir`
للتهيئة وقت الإنشاء.

إذا كان محركك **لا** يمتلك خوارزمية Compaction، فأبقِ `compact()`
منفذاً وفوّضها صراحةً:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## إضافة قدرة جديدة

عندما يحتاج Plugin إلى سلوك لا يناسب API الحالية، لا تتجاوز نظام Plugin
بوصول خاص إلى الداخل. أضف القدرة المفقودة.

التسلسل الموصى به:

1. عرّف عقد Core
   قرر ما السلوك المشترك الذي يجب أن يمتلكه Core: السياسة، والرجوع الاحتياطي، ودمج التكوين،
   ودورة الحياة، ودلالات مواجهة القناة، وشكل مساعد وقت التشغيل.
2. أضف أسطح تسجيل/وقت تشغيل Plugin مكتوبة الأنواع
   وسّع `OpenClawPluginApi` و/أو `api.runtime` بأصغر
   سطح قدرة مكتوب الأنواع ومفيد.
3. اربط مستهلكي Core + القناة/الميزة
   يجب أن تستهلك القنوات وfeature plugins القدرة الجديدة عبر Core،
   وليس باستيراد تنفيذ مورّد مباشرةً.
4. سجّل تنفيذات المورّد
   تسجّل Vendor plugins بعدها واجهاتها الخلفية مقابل القدرة.
5. أضف تغطية للعقد
   أضف اختبارات حتى يبقى شكل الملكية والتسجيل صريحاً مع مرور الوقت.

هذه هي الطريقة التي يبقى بها OpenClaw ذا رأي تصميمي دون أن يصبح مضمن الترميز
وفق منظور مزود واحد. راجع [كتاب وصفات القدرات](/ar/plugins/architecture)
للحصول على قائمة تحقق ملفات ملموسة ومثال مطبّق.

### قائمة تحقق القدرة

عندما تضيف قدرة جديدة، يجب أن يلمس التنفيذ عادةً هذه الأسطح معاً:

- أنواع عقد Core في `src/<capability>/types.ts`
- مساعد مشغل/وقت تشغيل Core في `src/<capability>/runtime.ts`
- سطح تسجيل Plugin API في `src/plugins/types.ts`
- ربط سجل Plugin في `src/plugins/registry.ts`
- تعريض وقت تشغيل Plugin في `src/plugins/runtime/*` عندما تحتاج feature/channel
  plugins إلى استهلاكه
- مساعدو الالتقاط/الاختبار في `src/test-utils/plugin-registration.ts`
- تأكيدات الملكية/العقد في `src/plugins/contracts/registry.ts`
- وثائق المشغل/Plugin في `docs/`

إذا كان أحد هذه الأسطح مفقوداً، فعادةً ما يكون ذلك علامة على أن القدرة
لم تُدمج بالكامل بعد.

### قالب القدرة

النمط الأدنى:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

نمط اختبار العقد:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

يُبقي ذلك القاعدة بسيطة:

- يمتلك Core عقد القدرة + التنسيق
- تمتلك Vendor plugins تنفيذات المورّد
- تستهلك feature/channel plugins مساعدي وقت التشغيل
- تُبقي اختبارات العقد الملكية صريحة

## ذو صلة

- [معمارية Plugin](/ar/plugins/architecture) — نموذج القدرات العام وأشكاله
- [مسارات Plugin SDK الفرعية](/ar/plugins/sdk-subpaths)
- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء plugins](/ar/plugins/building-plugins)
