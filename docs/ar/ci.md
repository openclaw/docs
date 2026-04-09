---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها
    - أنت تقوم بتصحيح أعطال فحوصات GitHub Actions
summary: مخطط مهام CI، وبوابات النطاق، والمكافئات المحلية للأوامر
title: مسار CI
x-i18n:
    generated_at: "2026-04-09T07:17:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: d104f2510fadd674d7952aa08ad73e10f685afebea8d7f19adc1d428e2bdc908
    source_path: ci.md
    workflow: 15
---

# مسار CI

يعمل CI عند كل دفع إلى `main` وكل طلب سحب. ويستخدم تحديد نطاق ذكيًا لتخطي المهام المكلفة عندما تكون التغييرات مقتصرة على أجزاء غير ذات صلة.

## نظرة عامة على المهام

| Job                      | Purpose                                                                                  | When it runs                        |
| ------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`              | اكتشاف التغييرات التي تخص الوثائق فقط، والنطاقات المتغيرة، والإضافات المتغيرة، وبناء بيان CI | دائمًا في عمليات الدفع وطلبات السحب غير المسودة |
| `security-fast`          | اكتشاف المفاتيح الخاصة، وتدقيق سير العمل عبر `zizmor`، وتدقيق تبعيات الإنتاج          | دائمًا في عمليات الدفع وطلبات السحب غير المسودة |
| `build-artifacts`        | بناء `dist/` وواجهة Control UI مرة واحدة، ورفع القطع الأثرية القابلة لإعادة الاستخدام للمهام التابعة     | التغييرات ذات الصلة بـ Node               |
| `checks-fast-core`       | مسارات تحقق Linux السريعة مثل فحوصات الحِزم المضمنة/عقد الإضافات/البروتوكول             | التغييرات ذات الصلة بـ Node               |
| `checks-fast-extensions` | تجميع مسارات شرائح الإضافات بعد اكتمال `checks-fast-extensions-shard`       | التغييرات ذات الصلة بـ Node               |
| `extension-fast`         | اختبارات مركزة للإضافات المضمنة التي تغيرت فقط                                       | عند اكتشاف تغييرات في الإضافات |
| `check`                  | البوابة المحلية الرئيسية في CI: `pnpm check` بالإضافة إلى `pnpm build:strict-smoke`                       | التغييرات ذات الصلة بـ Node               |
| `check-additional`       | حواجز البنية والحدود ودورات الاستيراد بالإضافة إلى حزمة انحدار مراقبة البوابة    | التغييرات ذات الصلة بـ Node               |
| `build-smoke`            | اختبارات smoke لواجهة CLI المبنية واختبار smoke لذاكرة بدء التشغيل                                           | التغييرات ذات الصلة بـ Node               |
| `checks`                 | مسارات Linux Node الأثقل: اختبارات كاملة، واختبارات القنوات، وتوافق Node 22 المخصص للدفع | التغييرات ذات الصلة بـ Node               |
| `check-docs`             | تنسيق الوثائق، وlint، وفحوصات الروابط المعطلة                                            | عند تغيير الوثائق                        |
| `skills-python`          | `Ruff` + `pytest` للمهارات المعتمدة على Python                                                   | التغييرات ذات الصلة بمهارات Python       |
| `checks-windows`         | مسارات اختبارات خاصة بـ Windows                                                              | التغييرات ذات الصلة بـ Windows            |
| `macos-node`             | مسار اختبارات TypeScript على macOS باستخدام القطع الأثرية المبنية المشتركة                              | التغييرات ذات الصلة بـ macOS              |
| `macos-swift`            | lint وبناء واختبارات Swift لتطبيق macOS                                           | التغييرات ذات الصلة بـ macOS              |
| `android`                | مصفوفة بناء Android واختباراته                                                            | التغييرات ذات الصلة بـ Android            |

## ترتيب الإخفاق السريع

تُرتَّب المهام بحيث تُظهر الفحوصات الرخيصة الإخفاقات قبل تشغيل المهام المكلفة:

1. يقرر `preflight` أي المسارات يجب أن توجد أصلًا. ويكون منطق `docs-scope` و`changed-scope` خطوات داخل هذه المهمة، وليس مهمات مستقلة.
2. تُظهر `security-fast` و`check` و`check-additional` و`check-docs` و`skills-python` الإخفاقات بسرعة من دون انتظار المهام الأثقل الخاصة بالقطع الأثرية ومصفوفة المنصات.
3. يعمل `build-artifacts` بالتوازي مع مسارات Linux السريعة حتى تتمكن المهام التابعة من البدء فور جاهزية البناء المشترك.
4. بعد ذلك تتفرع مسارات المنصات وبيئة التشغيل الأثقل: `checks-fast-core` و`checks-fast-extensions` و`extension-fast` و`checks` و`checks-windows` و`macos-node` و`macos-swift` و`android`.

يوجد منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات الوحدة في `src/scripts/ci-changed-scope.test.ts`.
يعيد سير عمل `install-smoke` المنفصل استخدام نص النطاق نفسه عبر مهمة `preflight` الخاصة به. وهو يحسب `run_install_smoke` من إشارة changed-smoke الأضيق، لذلك لا يعمل Docker/install smoke إلا للتغييرات ذات الصلة بالتثبيت والتغليف والحاويات.

في عمليات الدفع، تضيف مصفوفة `checks` مسار `compat-node22` المخصص للدفع فقط. وفي طلبات السحب، يتم تخطي ذلك المسار وتبقى المصفوفة مركزة على مسارات الاختبارات/القنوات العادية.

## المشغلات

| Runner                           | Jobs                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight` و`security-fast` و`build-artifacts` وفحوصات Linux وفحوصات الوثائق ومهارات Python و`android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                     |
| `macos-latest`                   | `macos-node` و`macos-swift`                                                                          |

## المكافئات المحلية

```bash
pnpm check          # الأنواع + lint + التنسيق
pnpm build:strict-smoke
pnpm check:import-cycles
pnpm test:gateway:watch-regression
pnpm test           # اختبارات vitest
pnpm test:channels
pnpm check:docs     # تنسيق الوثائق + lint + الروابط المعطلة
pnpm build          # بناء dist عندما تكون مسارات CI للقطع الأثرية/build-smoke مهمة
```
