---
read_when:
    - تحتاج إلى فهم سبب تشغيل مهمة CI أو عدم تشغيلها.
    - أنت تقوم بتصحيح فحوصات GitHub Actions الفاشلة.
summary: رسم بياني لمهام CI، وبوابات النطاق، ومعادلات الأوامر المحلية
title: مسار CI
x-i18n:
    generated_at: "2026-04-11T02:44:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca7e355b7f73bfe8ea8c6971e78164b8b2e68cbb27966964955e267fed89fce6
    source_path: ci.md
    workflow: 15
---

# مسار CI

يعمل CI عند كل عملية دفع إلى `main` وعند كل طلب سحب. ويستخدم تحديد نطاق ذكيًا لتخطي المهام المكلفة عندما تكون التغييرات محصورة في أجزاء غير ذات صلة.

## نظرة عامة على المهام

| المهمة                     | الغرض                                                                                 | متى تعمل                          |
| -------------------------- | ------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                | اكتشاف تغييرات الوثائق فقط، والنطاقات المتغيرة، والإضافات المتغيرة، وبناء بيان CI    | دائمًا في عمليات الدفع وطلبات السحب غير المسودة |
| `security-fast`            | اكتشاف المفاتيح الخاصة، وتدقيق سير العمل عبر `zizmor`، وتدقيق تبعيات الإنتاج         | دائمًا في عمليات الدفع وطلبات السحب غير المسودة |
| `build-artifacts`          | بناء `dist/` وواجهة Control UI مرة واحدة، ورفع عناصر قابلة لإعادة الاستخدام للمهام اللاحقة | التغييرات المرتبطة بـ Node       |
| `checks-fast-core`         | مسارات تحقق Linux السريعة مثل فحوصات bundled/plugin-contract/protocol                | التغييرات المرتبطة بـ Node       |
| `checks-node-extensions`   | شرائح اختبار bundled-plugin الكاملة عبر مجموعة الإضافات                              | التغييرات المرتبطة بـ Node       |
| `checks-node-core-test`    | شرائح اختبارات Node الأساسية، باستثناء مسارات القنوات وbundled والعقود والإضافات     | التغييرات المرتبطة بـ Node       |
| `extension-fast`           | اختبارات مركزة فقط للإضافات المجمعة التي تغيّرت                                      | عند اكتشاف تغييرات في الإضافات   |
| `check`                    | البوابة المحلية الرئيسية في CI: `pnpm check` بالإضافة إلى `pnpm build:strict-smoke`  | التغييرات المرتبطة بـ Node       |
| `check-additional`         | حواجز البنية والحدود ودورات الاستيراد بالإضافة إلى حزمة اختبار تراجع gateway watch   | التغييرات المرتبطة بـ Node       |
| `build-smoke`              | اختبارات smoke للـ CLI المبني واختبار smoke لذاكرة بدء التشغيل                        | التغييرات المرتبطة بـ Node       |
| `checks`                   | مسارات Linux Node المتبقية: اختبارات القنوات وتوافق Node 22 الخاص بعمليات الدفع فقط  | التغييرات المرتبطة بـ Node       |
| `check-docs`               | تنسيق الوثائق وفحصها واختبار الروابط المعطلة                                         | عند تغيّر الوثائق                |
| `skills-python`            | `Ruff` + `pytest` للمهارات المعتمدة على Python                                       | التغييرات ذات الصلة بمهارات Python |
| `checks-windows`           | مسارات اختبار خاصة بـ Windows                                                        | التغييرات ذات الصلة بـ Windows   |
| `macos-node`               | مسار اختبارات TypeScript على macOS باستخدام عناصر البناء المشتركة                    | التغييرات ذات الصلة بـ macOS     |
| `macos-swift`              | فحص Swift وبناؤه واختباراته لتطبيق macOS                                             | التغييرات ذات الصلة بـ macOS     |
| `android`                  | مصفوفة بناء Android واختباراته                                                       | التغييرات ذات الصلة بـ Android   |

## ترتيب الإخفاق السريع

تُرتَّب المهام بحيث تفشل الفحوصات الرخيصة قبل تشغيل المهام المكلفة:

1. تحدد `preflight` أي المسارات ستوجد أصلًا. منطق `docs-scope` و`changed-scope` هما خطوتان داخل هذه المهمة، وليسا مهمتين مستقلتين.
2. تفشل `security-fast` و`check` و`check-additional` و`check-docs` و`skills-python` بسرعة من دون انتظار مهام العناصر والمصفوفات الخاصة بالمنصات الأثقل.
3. تعمل `build-artifacts` بالتوازي مع مسارات Linux السريعة حتى تتمكن المهام اللاحقة من البدء فور جاهزية البناء المشترك.
4. بعد ذلك تتفرع مسارات المنصات ووقت التشغيل الأثقل: `checks-fast-core` و`checks-node-extensions` و`checks-node-core-test` و`extension-fast` و`checks` و`checks-windows` و`macos-node` و`macos-swift` و`android`.

يوجد منطق النطاق في `scripts/ci-changed-scope.mjs` وتغطيه اختبارات وحدات في `src/scripts/ci-changed-scope.test.ts`.
يعيد سير عمل `install-smoke` المنفصل استخدام نص النطاق نفسه عبر مهمة `preflight` الخاصة به. وهو يحسب `run_install_smoke` من إشارة changed-smoke الأضيق، لذلك لا يعمل Docker/install smoke إلا للتغييرات المرتبطة بالتثبيت والتغليف والحاويات.

في عمليات الدفع، تضيف مصفوفة `checks` مسار `compat-node22` الخاص بعمليات الدفع فقط. أما في طلبات السحب، فيتم تخطي ذلك المسار وتبقى المصفوفة مركزة على مسارات الاختبار/القنوات العادية.

## المشغلات

| المشغل                           | المهام                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight` و`security-fast` و`build-artifacts` وفحوصات Linux وفحوصات الوثائق ومهارات Python و`android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                       |
| `macos-latest`                   | `macos-node` و`macos-swift`                                                                            |

## المعادلات المحلية

```bash
pnpm check          # الأنواع + lint + format
pnpm build:strict-smoke
pnpm check:import-cycles
pnpm test:gateway:watch-regression
pnpm test           # اختبارات vitest
pnpm test:channels
pnpm check:docs     # تنسيق الوثائق + فحصها + الروابط المعطلة
pnpm build          # بناء dist عندما تكون مسارات عناصر CI أو build-smoke مهمة
```
