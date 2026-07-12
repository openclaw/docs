---
read_when:
    - نقل ملكية مضيف Canvas أو الأدوات أو الأوامر أو الوثائق أو البروتوكول
    - التدقيق فيما إذا كان Canvas لا يزال مملوكًا للنواة
    - إعداد أو مراجعة طلب سحب Plugin ‏Canvas التجريبي
summary: خطة وقائمة تدقيق لنقل Canvas من النواة إلى Plugin تجريبي مضمّن.
title: إعادة هيكلة Plugin الخاص بـ Canvas
x-i18n:
    generated_at: "2026-07-12T06:30:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# إعادة هيكلة Plugin ‏Canvas

يُستخدم Canvas قليلًا وهو تجريبي. تعامل معه بوصفه Plugin مضمنًا، لا ميزة أساسية. يمكن للنواة الاحتفاظ بالبنية التحتية العامة لـ Gateway وNode وHTTP والمصادقة والإعداد والعميل الأصلي، لكن ينبغي أن يوجد السلوك الخاص بـ Canvas ضمن `extensions/canvas`.

## الهدف

نقل ملكية Canvas إلى `extensions/canvas` مع الحفاظ على السلوك الحالي للعقدة المقترنة:

- تُسجَّل أداة `canvas` الموجّهة إلى الوكيل بواسطة Plugin ‏Canvas
- لا يُسمح بأوامر عقدة Canvas إلا عندما يسجّلها Plugin ‏Canvas
- توجد ملفات مضيف/مصدر A2UI ضمن Plugin ‏Canvas
- تتم عملية تجسيد مستندات Canvas ضمن Plugin ‏Canvas
- يوجد تنفيذ أمر CLI ضمن Plugin ‏Canvas، أو يفوّض عبر ملف تصدير وقت تشغيل يملكه Plugin
- تصف الوثائق وقائمة Plugins ‏Canvas بأنه تجريبي ومدعوم بواسطة Plugin

## ما لا يشمله العمل

- لا تُعِد تصميم واجهة مستخدم Canvas في التطبيق الأصلي ضمن إعادة الهيكلة هذه.
- لا تزل دعم بروتوكول/عميل Canvas من iOS أو Android أو macOS ما لم ينص قرار منتج منفصل على ضرورة حذف Canvas.
- لا تنشئ إطار عمل واسعًا لخدمات Plugins من أجل Canvas وحده، ما لم يحتج Plugin مضمن آخر على الأقل إلى الواجهة نفسها.

## حالة الفرع الحالية

تم:

- إضافة حزمة Plugin مضمنة في `extensions/canvas`.
- إضافة `extensions/canvas/openclaw.plugin.json`.
- نقل أداة الوكيل `canvas` من `src/agents/tools/canvas-tool.ts` إلى `extensions/canvas/src/tool.ts`.
- إزالة التسجيل الأساسي لـ `createCanvasTool` من `src/agents/openclaw-tools.ts`.
- نقل تنفيذ مضيف Canvas من `src/canvas-host` إلى `extensions/canvas/src/host`.
- الإبقاء على `extensions/canvas/runtime-api.ts` بوصفه ملف تصدير التوافق المملوك لـ Plugin للاختبارات والحزم والمساعدات العامة الخارجية لـ Canvas.
- نقل تجسيد مستندات Canvas من `src/gateway/canvas-documents.ts` إلى `extensions/canvas/src/documents.ts`.
- نقل تنفيذ CLI الخاص بـ Canvas ومساعدات JSONL الخاصة بـ A2UI إلى `extensions/canvas/src/cli.ts`.
- نقل عنوان URL لمضيف Canvas ومساعدات الإمكانات محددة النطاق إلى `extensions/canvas/src`.
- نقل الإعدادات الافتراضية لأوامر عقدة Canvas من القوائم الأساسية المضمّنة إلى `nodeInvokePolicies` الخاصة بـ Plugin.
- إضافة إعداد مضيف Canvas مملوك لـ Plugin في `plugins.entries.canvas.config.host`.
- نقل تقديم Canvas وA2UI عبر HTTP ليصبح خلف تسجيل مسارات HTTP في Plugin ‏Canvas.
- إضافة توجيه عام لترقية WebSocket الخاصة بـ Plugin لمسارات HTTP المملوكة لـ Plugin.
- استبدال عنوان URL لمضيف Gateway والمصادقة على إمكانات العقدة الخاصين بـ Canvas بسطح Plugin مستضاف عام ومساعدات عامة لإمكانات العقدة.
- إضافة محللات وسائط مستضافة يملكها Plugin كي تُحل عناوين URL لمستندات Canvas عبر Plugin ‏Canvas بدلًا من استيراد النواة للتفاصيل الداخلية لمستندات Canvas.
- إضافة `api.registerNodeCliFeature(...)` كي يتمكن Canvas من إعلان `openclaw nodes canvas` بوصفه ميزة عقدة مملوكة لـ Plugin دون كتابة مسار الأمر الأب يدويًا.
- إزالة استيرادات الإنتاج ضمن `src/**` لـ `extensions/canvas/runtime-api.js`.
- نقل مصدر حزمة A2UI من `apps/shared/OpenClawKit/Tools/CanvasA2UI` إلى `extensions/canvas/src/host/a2ui-app`.
- نقل تنفيذ بناء/نسخ A2UI إلى `extensions/canvas/scripts` واستبدال ربط البناء الجذري بخطافات أصول عامة لـ Plugins المضمنة.
- إزالة الاسم البديل القديم لإعداد المستوى الأعلى `canvasHost` من وقت التشغيل.
- الإبقاء على ترحيل Canvas في أداة الفحص كي يعيد `openclaw doctor --fix` كتابة إعدادات `canvasHost` القديمة إلى `plugins.entries.canvas.config.host`.
- إزالة توافق بروتوكول Canvas للوكلاء القدامى خلف الإصدار 4 من بروتوكول Gateway. تستخدم الآن العملاء الأصلية وGateway فقط `pluginSurfaceUrls.canvas` بالإضافة إلى `node.pluginSurface.refresh`؛ أما مسار `canvasHostUrl` و`canvasCapability` و`node.canvas.capability.refresh` المهمل، فهو غير مدعوم عمدًا في إعادة الهيكلة التجريبية هذه.
- تحديث قائمة Plugins المولّدة لتتضمن Canvas.
- إضافة وثائق مرجعية لـ Plugin في `docs/plugins/reference/canvas.md`.

أسطح Canvas المتبقية المعروفة والمملوكة للنواة:

- لا تزال معالجات Canvas في التطبيقات الأصلية ضمن `apps/` تستهلك عمدًا سطح Plugin ‏Canvas
- معالجات بروتوكول/عميل Canvas في التطبيقات الأصلية ضمن `apps/`
- لا يزال ناتج العنصر المنشور يستخدم `dist/canvas-host/a2ui` للبحث المتوافق مع الإصدارات السابقة في وقت التشغيل، لكن خطوة النسخ أصبحت الآن مملوكة لـ Plugin

## الشكل المستهدف

ينبغي أن يملك `extensions/canvas` ما يلي:

- بيان Plugin والبيانات الوصفية للحزمة
- تسجيل أداة الوكيل
- سياسة أمر استدعاء العقدة
- مضيف Canvas ووقت تشغيل A2UI
- مصدر حزمة Canvas ‏A2UI وبرامج بناء/نسخ الأصول النصية
- إنشاء مستندات Canvas وحل الأصول
- تنفيذ CLI الخاص بـ Canvas
- صفحة وثائق Canvas وإدخال قائمة Plugins

ينبغي أن تملك النواة الواجهات العامة فقط:

- اكتشاف Plugins وتسجيلها
- سجل أدوات الوكيل العام
- سجل سياسات استدعاء العقدة العام
- توجيه HTTP/المصادقة في Gateway وترقية WebSocket بصورة عامة
- حل عناوين URL لأسطح Plugins المستضافة بصورة عامة
- تسجيل محللات الوسائط المستضافة بصورة عامة
- نقل إمكانات العقدة بصورة عامة
- البنية التحتية العامة للإعداد
- اكتشاف خطافات أصول Plugins المضمنة بصورة عامة

يجوز للتطبيقات الأصلية الاحتفاظ بمعالجات أوامر Canvas بوصفها عملاء للبروتوكول. وهي ليست مالكة وقت تشغيل Plugin.

## خطوات الترحيل

1. تعامل مع `plugins.entries.canvas.config.host` بوصفه سطح الإعداد المملوك لـ Plugin.
2. حدّث الوثائق بحيث تصف Canvas بأنه Plugin مضمن تجريبي.
3. شغّل اختبارات Canvas المركّزة، وفحوصات قائمة Plugins، وفحوصات API الخاصة بـ SDK ‏Plugin، وبوابات البناء/الأنواع المتأثرة بحدود وقت التشغيل.

## قائمة تدقيق المراجعة

قبل اعتبار إعادة الهيكلة مكتملة:

- لا يعيد `rg "src/canvas-host|../canvas-host"` أي استيرادات مصدر حية.
- لا يعثر `rg "canvas-tool|createCanvasTool" src` على أي تنفيذ لأداة Canvas تملكه النواة.
- لا يعثر `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` على أي إعدادات افتراضية مضمنة لقائمة السماح خارج اختبارات سياسة Plugin العامة.
- تكون نتيجة `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` فارغة.
- تكون نتيجة `rg "canvas-documents" src` فارغة.
- تكون نتيجة `rg "registerNodesCanvasCommands|nodes-canvas" src` فارغة؛ يسجّل Plugin ‏Canvas الأمر `openclaw nodes canvas` عبر البيانات الوصفية المتداخلة لـ CLI الخاص بـ Plugin.
- لا يعيد `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` أي ملكية لوقت تشغيل Gateway.
- لا يعثر `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` إلا على أغلفة التوافق أو المسارات المملوكة لـ Plugin.
- ينجح `pnpm plugins:inventory:check`.
- ينجح `pnpm plugin-sdk:api:check`، أو تُحدَّث الخطوط الأساسية المولّدة لـ API وتُراجع عمدًا.
- تنجح اختبارات Canvas المستهدفة.
- تنجح اختبارات المسارات المتغيرة لمسارات مضيف Canvas وA2UI.
- ينص متن طلب السحب صراحةً على أن Canvas تجريبي ومدعوم بواسطة Plugin.

## أوامر التحقق

استخدم فحوصات محلية مستهدفة أثناء التكرار:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

شغّل `pnpm build` قبل الدفع إذا تغيّر ملف تصدير وقت التشغيل أو الاستيراد الكسول أو الحزم أو أسطح Plugin المنشورة.
