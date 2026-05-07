---
read_when:
    - نقل ملكية مضيف Canvas أو الأدوات أو الأوامر أو الوثائق أو البروتوكول
    - تدقيق ما إذا كان Canvas لا يزال مملوكًا للنواة
    - إعداد طلب سحب Plugin Canvas التجريبي أو مراجعته
summary: خطة وقائمة تدقيق لنقل Canvas خارج النواة وإلى Plugin تجريبي مضمّن.
title: إعادة هيكلة Plugin Canvas
x-i18n:
    generated_at: "2026-05-07T13:29:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# إعادة هيكلة Plugin Canvas

Canvas قليل الاستخدام وتجريبي. عامله باعتباره Plugin مضمّنًا، وليس ميزة أساسية. يمكن للنواة الاحتفاظ بالبنية العامة الخاصة بـ Gateway وNode وHTTP والمصادقة والإعدادات والعميل الأصلي، لكن السلوك الخاص بـ Canvas يجب أن يكون تحت `extensions/canvas`.

## الهدف

نقل ملكية Canvas إلى `extensions/canvas` مع الحفاظ على سلوك العقدة المقترنة الحالي:

- أداة `canvas` الموجهة للوكيل يتم تسجيلها بواسطة Plugin Canvas
- لا يُسمح بأوامر عقد Canvas إلا عندما يسجلها Plugin Canvas
- ملفات مضيف/مصدر A2UI تكون ضمن Plugin Canvas
- تجسيد مستندات Canvas يكون ضمن Plugin Canvas
- تنفيذ أمر CLI يكون ضمن Plugin Canvas، أو يفوض عبر runtime barrel مملوك للـ Plugin
- تصف الوثائق ومخزون Plugins‏ Canvas بأنه تجريبي ومدعوم بـ Plugin

## غير مستهدف

- لا تُعد تصميم واجهة مستخدم Canvas في التطبيق الأصلي ضمن إعادة الهيكلة هذه.
- لا تُزل دعم بروتوكول/عميل Canvas من iOS أو Android أو macOS إلا إذا نص قرار منتج منفصل على حذف Canvas.
- لا تبنِ إطار خدمة Plugin واسعًا لأجل Canvas فقط، إلا إذا احتاج Plugin مضمّن آخر على الأقل إلى نفس الوصلة.

## حالة الفرع الحالية

تم:

- تمت إضافة حزمة Plugin مضمّنة في `extensions/canvas`.
- تمت إضافة `extensions/canvas/openclaw.plugin.json`.
- نُقلت أداة الوكيل `canvas` من `src/agents/tools/canvas-tool.ts` إلى `extensions/canvas/src/tool.ts`.
- أُزيل تسجيل النواة لـ `createCanvasTool` من `src/agents/openclaw-tools.ts`.
- نُقل تنفيذ مضيف Canvas من `src/canvas-host` إلى `extensions/canvas/src/host`.
- أُبقي على `extensions/canvas/runtime-api.ts` باعتباره runtime barrel للتوافق مملوكًا للـ Plugin للاختبارات والحزم ومساعدات Canvas العامة الخارجية.
- نُقل تجسيد مستندات Canvas من `src/gateway/canvas-documents.ts` إلى `extensions/canvas/src/documents.ts`.
- نُقل تنفيذ Canvas CLI ومساعدات A2UI JSONL إلى `extensions/canvas/src/cli.ts`.
- نُقلت مساعدات عنوان URL لمضيف Canvas والإمكانات محددة النطاق إلى `extensions/canvas/src`.
- نُقلت افتراضات أوامر عقد Canvas من قوائم النواة الثابتة إلى `nodeInvokePolicies` الخاصة بالـ Plugin.
- أُضيف إعداد مضيف Canvas مملوك للـ Plugin عند `plugins.entries.canvas.config.host`.
- نُقل تقديم Canvas وA2UI عبر HTTP خلف تسجيل مسار HTTP الخاص بـ Plugin Canvas.
- أُضيف توزيع ترقية WebSocket عام للـ Plugin لمسارات HTTP المملوكة للـ Plugin.
- استُبدلت مصادقة عنوان URL لمضيف Gateway الخاص بـ Canvas وإمكانات العقدة بمساعدات عامة لسطح Plugin مستضاف وإمكانات العقدة.
- أُضيفت محللات وسائط مستضافة مملوكة للـ Plugin بحيث تُحل عناوين URL لمستندات Canvas عبر Plugin Canvas بدلًا من استيراد النواة للداخليات الخاصة بمستندات Canvas.
- أُضيف `api.registerNodeCliFeature(...)` بحيث يمكن لـ Canvas إعلان `openclaw nodes canvas` كميزة عقدة مملوكة للـ Plugin دون كتابة مسار الأمر الأب يدويًا.
- أُزيلت استيرادات الإنتاج `src/**` من `extensions/canvas/runtime-api.js`.
- نُقل مصدر حزمة A2UI من `apps/shared/OpenClawKit/Tools/CanvasA2UI` إلى `extensions/canvas/src/host/a2ui-app`.
- نُقل تنفيذ بناء/نسخ A2UI إلى `extensions/canvas/scripts` واستُبدل ربط البناء الجذري بخطافات أصول عامة للـ Plugin المضمّن.
- أُزيل الاسم المستعار القديم في runtime لإعداد `canvasHost` ذي المستوى الأعلى.
- أُبقي على ترحيل الطبيب الخاص بـ Canvas بحيث يعيد `openclaw doctor --fix` كتابة إعدادات `canvasHost` القديمة إلى `plugins.entries.canvas.config.host`.
- أُزيل توافق بروتوكول Canvas للوكلاء القدامى خلف بروتوكول Gateway v4. يستخدم العملاء الأصليون وGateways الآن فقط `pluginSurfaceUrls.canvas` مع `node.pluginSurface.refresh`؛ المسار المهمل `canvasHostUrl` و`canvasCapability` و`node.canvas.capability.refresh` غير مدعوم عمدًا في إعادة الهيكلة التجريبية هذه.
- حُدّث مخزون Plugins المولّد ليشمل Canvas.
- أُضيفت وثائق مرجعية للـ Plugin في `docs/plugins/reference/canvas.md`.

أسطح Canvas المعروفة المتبقية المملوكة للنواة:

- ما زالت معالجات Canvas في التطبيق الأصلي ضمن `apps/` تستهلك سطح Plugin Canvas عمدًا
- معالجات بروتوكول/عميل Canvas في التطبيق الأصلي ضمن `apps/`
- ما زال ناتج الأثر المنشور يستخدم `dist/canvas-host/a2ui` للبحث المتوافق مع الإصدارات السابقة في runtime، لكن خطوة النسخ أصبحت الآن مملوكة للـ Plugin

## الشكل المستهدف

يجب أن يملك `extensions/canvas` ما يلي:

- بيان Plugin وبيانات تعريف الحزمة
- تسجيل أداة الوكيل
- سياسة أمر استدعاء العقدة
- مضيف Canvas وruntime الخاص بـ A2UI
- مصدر حزمة Canvas A2UI وسكربتات بناء/نسخ الأصول
- إنشاء مستندات Canvas وحل الأصول
- تنفيذ Canvas CLI
- صفحة وثائق Canvas ومدخل مخزون Plugins

يجب أن تملك النواة وصلات عامة فقط:

- اكتشاف Plugins وتسجيلها
- سجل أدوات الوكيل العام
- سجل سياسة استدعاء العقد العام
- HTTP/مصادقة Gateway العامة وتوزيع ترقية WebSocket
- حل عناوين URL لسطح Plugin المستضاف العام
- تسجيل محلل الوسائط المستضافة العام
- نقل إمكانات العقدة العام
- توصيل الإعدادات العام
- اكتشاف خطافات أصول Plugin المضمّنة العامة

يمكن للتطبيقات الأصلية الاحتفاظ بمعالجات أوامر Canvas كعملاء للبروتوكول. فهي ليست مالكة runtime الخاص بالـ Plugin.

## خطوات الترحيل

1. عامل `plugins.entries.canvas.config.host` باعتباره سطح الإعدادات المملوك للـ Plugin.
2. حدّث الوثائق بحيث توصف Canvas بأنها Plugin مضمّنة وتجريبية.
3. شغّل اختبارات Canvas المركزة، وفحوصات مخزون Plugins، وفحوصات API الخاصة بـ Plugin SDK، وبوابات البناء/الأنواع المتأثرة بحدود runtime.

## قائمة تدقيق المراجعة

قبل اعتبار إعادة الهيكلة مكتملة:

- يعيد `rg "src/canvas-host|../canvas-host"` عدم وجود أي استيرادات مصدر حية.
- لا يجد `rg "canvas-tool|createCanvasTool" src` أي تنفيذ لأداة Canvas مملوك للنواة.
- لا يجد `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` أي افتراضات قائمة سماح ثابتة خارج اختبارات سياسة Plugin العامة.
- يكون `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` فارغًا.
- يكون `rg "canvas-documents" src` فارغًا.
- يكون `rg "registerNodesCanvasCommands|nodes-canvas" src` فارغًا؛ يسجل Plugin Canvas‏ `openclaw nodes canvas` عبر بيانات تعريف CLI المتداخلة الخاصة بالـ Plugin.
- يعيد `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` عدم وجود ملكية runtime في Gateway.
- لا يجد `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` إلا مغلفات توافق أو مسارات مملوكة للـ Plugin.
- ينجح `pnpm plugins:inventory:check`.
- ينجح `pnpm plugin-sdk:api:check`، أو يتم تحديث ومراجعة خطوط أساس API المولّدة عمدًا.
- تنجح اختبارات Canvas المستهدفة.
- تنجح اختبارات changed-lanes لمسارات مضيف Canvas/A2UI.
- يصرح نص PR بوضوح بأن Canvas تجريبي ومدعوم بـ Plugin.

## أوامر التحقق

استخدم الفحوصات المحلية المستهدفة أثناء التكرار:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

شغّل `pnpm build` قبل الدفع إذا تغيّرت runtime barrel أو الاستيراد الكسول أو الحزم أو أسطح Plugin المنشورة.
