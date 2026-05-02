---
read_when:
    - تشغيل التحقق الكامل من الإصدار أو إعادة تشغيله
    - مقارنة ملفات تعريف التحقق من الإصدار المستقر والكامل
    - تصحيح أخطاء حالات فشل مرحلة التحقق من صحة الإصدار
summary: مراحل التحقق الكامل من الإصدار، وسير العمل الفرعية، وملفات تعريف الإصدار، ومعرّفات إعادة التشغيل، والأدلة
title: التحقق الكامل من الإصدار
x-i18n:
    generated_at: "2026-05-02T07:42:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: feb4edec850fb97405575c869547b4851bc773507321690670553e6faafc8b0b
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` هي المظلة الخاصة بالإصدار. وهي نقطة الدخول اليدوية الوحيدة
لإثبات ما قبل الإصدار، لكن معظم العمل يحدث في سير عمل فرعية حتى يمكن إعادة تشغيل
صندوق فشل بدون إعادة بدء الإصدار كله.

شغّلها من مرجع سير عمل موثوق، عادةً `main`، ومرّر فرع الإصدار أو الوسم أو SHA
الالتزام الكامل باعتباره `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

تستخدم سير العمل الفرعية مرجع سير العمل الموثوق للحزمة الاختبارية ووسيط الإدخال
`ref` للمرشح قيد الاختبار. وهذا يبقي منطق التحقق الجديد متاحًا عند التحقق من فرع
إصدار أو وسم أقدم.

## المراحل العليا

| المرحلة                | التفاصيل                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| حل الهدف    | **المهمة:** `Resolve target ref`<br />**سير العمل الفرعي:** لا يوجد<br />**يثبت:** يحل فرع الإصدار أو الوسم أو SHA الالتزام الكامل ويسجل المدخلات المحددة.<br />**إعادة التشغيل:** أعد تشغيل المظلة إذا فشل هذا.                                                                                                                                                                              |
| Vitest وCI العادي | **المهمة:** `Run normal full CI`<br />**سير العمل الفرعي:** `CI`<br />**يثبت:** مخطط CI يدوي كامل مقابل المرجع الهدف، بما في ذلك مسارات Linux Node، وأجزاء Plugin المضمنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، وفحص البناء السريع، وفحوصات الوثائق، وSkills الخاصة بـPython، وWindows، وmacOS، وتدويل واجهة Control UI، وAndroid عبر المظلة.<br />**إعادة التشغيل:** `rerun_group=ci`. |
| الإصدار التمهيدي لـ Plugin    | **المهمة:** `Run plugin prerelease validation`<br />**سير العمل الفرعي:** `Plugin Prerelease`<br />**يثبت:** فحوصات ثابتة خاصة بالإصدار لـ Plugin، وتغطية Plugin الوكيل، وأجزاء دفعات الإضافات الكاملة، ومسارات Docker للإصدار التمهيدي لـ Plugin.<br />**إعادة التشغيل:** `rerun_group=plugin-prerelease`.                                                                                                       |
| فحوصات الإصدار       | **المهمة:** `Run release/live/Docker/QA validation`<br />**سير العمل الفرعي:** `OpenClaw Release Checks`<br />**يثبت:** فحص التثبيت السريع، وفحوصات الحزم عبر أنظمة التشغيل، ومجموعات live/E2E، وأجزاء مسار إصدار Docker، وPackage Acceptance، وتكافؤ QA Lab، وMatrix الحي، وTelegram الحي.<br />**إعادة التشغيل:** `rerun_group=release-checks` أو مقبض أضيق لفحوصات الإصدار.                                |
| حزمة Telegram     | **المهمة:** `Run package Telegram E2E`<br />**سير العمل الفرعي:** `NPM Telegram Beta E2E`<br />**يثبت:** إثبات حزمة Telegram المدعوم بالقطعة الأثرية لـ`rerun_group=all` مع `release_profile=full`، أو إثبات Telegram للحزمة المنشورة عند تعيين `npm_telegram_package_spec`.<br />**إعادة التشغيل:** `rerun_group=npm-telegram` مع `npm_telegram_package_spec`.                                     |
| متحقق المظلة    | **المهمة:** `Verify full validation`<br />**سير العمل الفرعي:** لا يوجد<br />**يثبت:** يعيد فحص نتائج تشغيل سير العمل الفرعية المسجلة ويضيف جداول أبطأ المهام من سير العمل الفرعية.<br />**إعادة التشغيل:** أعد تشغيل هذه المهمة فقط بعد إعادة تشغيل سير فرعي فاشل ليصبح أخضر.                                                                                                                                   |

بالنسبة إلى `ref=main` و`rerun_group=all`، تحل مظلة أحدث محل مظلة أقدم.
عند إلغاء الأصل، يلغي المراقب الخاص به أي سير عمل فرعي كان قد أرسله بالفعل.
لا تلغي عمليات التحقق من فروع الإصدار والوسوم بعضها بعضًا افتراضيًا.

## مراحل فحوصات الإصدار

`OpenClaw Release Checks` هو أكبر سير عمل فرعي. يحل الهدف مرة واحدة
ويحضّر قطعة أثرية مشتركة باسم `release-package-under-test` عندما تحتاجها
المراحل المواجهة للحزم أو Docker.

| المرحلة               | التفاصيل                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| هدف الإصدار      | **المهمة:** `Resolve target ref`<br />**سير العمل الداعم:** لا يوجد<br />**الاختبارات:** المرجع المحدد، وSHA المتوقع الاختياري، والملف الشخصي، ومجموعة إعادة التشغيل، ومرشح مجموعة live المركزة.<br />**إعادة التشغيل:** `rerun_group=release-checks`.                                                                                                                                                                           |
| قطعة الحزمة الأثرية    | **المهمة:** `Prepare release package artifact`<br />**سير العمل الداعم:** لا يوجد<br />**الاختبارات:** يحزم أو يحل كرة tar مرشحة واحدة ويرفع `release-package-under-test` للفحوصات اللاحقة المواجهة للحزم.<br />**إعادة التشغيل:** مجموعة الحزمة أو الأنظمة المتعددة أو live/E2E المتأثرة.                                                                                                           |
| فحص التثبيت السريع       | **المهمة:** `Run install smoke`<br />**سير العمل الداعم:** `Install Smoke`<br />**الاختبارات:** مسار التثبيت الكامل مع إعادة استخدام صورة فحص Dockerfile الجذر السريع، وتثبيت حزمة QR، وفحوصات Docker السريعة للجذر وGateway، واختبارات Docker للمثبّت، وفحص موفر صورة التثبيت العام عبر Bun، وE2E سريع لتثبيت/إلغاء تثبيت Plugin المضمنة.<br />**إعادة التشغيل:** `rerun_group=install-smoke`.                              |
| عبر أنظمة التشغيل            | **المهمة:** `cross_os_release_checks`<br />**سير العمل الداعم:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**الاختبارات:** مسارات جديدة ومسارات ترقية على Linux وWindows وmacOS للموفر والوضع المحددين، باستخدام كرة tar المرشحة مع حزمة أساس.<br />**إعادة التشغيل:** `rerun_group=cross-os`.                                                                               |
| المستودع وlive E2E   | **المهمة:** `Run repo/live E2E validation`<br />**سير العمل الداعم:** `OpenClaw Live And E2E Checks (Reusable)`<br />**الاختبارات:** E2E للمستودع، وذاكرة التخزين المؤقت live، وبث websocket الخاص بـOpenAI، وأجزاء موفر live الأصلي وPlugin، وحزم اختبار النموذج/الخلفية/Gateway الحية المدعومة بـDocker والمحددة بواسطة `release_profile`.<br />**إعادة التشغيل:** `rerun_group=live-e2e`، اختياريًا مع `live_suite_filter`. |
| مسار إصدار Docker | **المهمة:** `Run Docker release-path validation`<br />**سير العمل الداعم:** `OpenClaw Live And E2E Checks (Reusable)`<br />**الاختبارات:** أجزاء Docker لمسار الإصدار مقابل قطعة الحزمة المشتركة.<br />**إعادة التشغيل:** `rerun_group=live-e2e`.                                                                                                                                                      |
| قبول الحزمة  | **المهمة:** `Run package acceptance`<br />**سير العمل الداعم:** `Package Acceptance`<br />**الاختبارات:** تجهيزات حزمة Plugin دون اتصال، وتحديث Plugin، وقبول حزمة Telegram مع OpenAI وهمي مقابل كرة tar نفسها.<br />**إعادة التشغيل:** `rerun_group=package`.                                                                                                                                  |
| تكافؤ QA           | **المهمة:** `Run QA Lab parity lane` و`Run QA Lab parity report`<br />**سير العمل الداعم:** مهام مباشرة<br />**الاختبارات:** حزم تكافؤ وكيلة للمرشح والأساس، ثم تقرير التكافؤ.<br />**إعادة التشغيل:** `rerun_group=qa-parity` أو `rerun_group=qa`.                                                                                                                                       |
| Matrix حي لـQA      | **المهمة:** `Run QA Lab live Matrix lane`<br />**سير العمل الداعم:** مهمة مباشرة<br />**الاختبارات:** ملف QA حي وسريع لـMatrix في بيئة `qa-live-shared`.<br />**إعادة التشغيل:** `rerun_group=qa-live` أو `rerun_group=qa`.                                                                                                                                                                        |
| Telegram حي لـQA    | **المهمة:** `Run QA Lab live Telegram lane`<br />**سير العمل الداعم:** مهمة مباشرة<br />**الاختبارات:** QA حي لـTelegram مع إيجارات بيانات اعتماد Convex CI.<br />**إعادة التشغيل:** `rerun_group=qa-live` أو `rerun_group=qa`.                                                                                                                                                                                    |
| متحقق الإصدار    | **المهمة:** `Verify release checks`<br />**سير العمل الداعم:** لا يوجد<br />**الاختبارات:** مهام فحوصات الإصدار المطلوبة لمجموعة إعادة التشغيل المحددة.<br />**إعادة التشغيل:** أعد التشغيل بعد نجاح المهام الفرعية المركزة.                                                                                                                                                                                                 |

## أجزاء مسار إصدار Docker

تشغّل مرحلة مسار إصدار Docker هذه الأجزاء عندما يكون `live_suite_filter`
فارغًا:

| الجزء                                                           | التغطية                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | مسارات فحص سريعة لمسار إصدار Docker الأساسي.                                   |
| `package-update-openai`                                         | سلوك تثبيت حزمة OpenAI وتحديثها.                             |
| `package-update-anthropic`                                      | سلوك تثبيت حزمة Anthropic وتحديثها.                          |
| `package-update-core`                                           | سلوك الحزمة والتحديث المحايد للموفر.                           |
| `plugins-runtime-plugins`                                       | مسارات وقت تشغيل Plugin التي تمرّن سلوك Plugin.                     |
| `plugins-runtime-services`                                      | مسارات وقت تشغيل Plugin المدعومة بالخدمات؛ تشمل OpenWebUI عند طلبها. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | دفعات تثبيت/وقت تشغيل Plugin مقسمة للتحقق الموازي من الإصدار.   |

استخدم `docker_lanes=<lane[,lane]>` المستهدف على سير عمل live/E2E القابل لإعادة الاستخدام عندما
يفشل مسار Docker واحد فقط. تتضمن قطع الإصدار الأثرية أوامر إعادة تشغيل لكل مسار
مع مدخلات قطعة الحزمة الأثرية وإعادة استخدام الصورة عند توفرها.

## ملفات تعريف الإصدار

يتحكم `release_profile` غالبًا في اتساع live/الموفر داخل فحوصات الإصدار.
ولا يزيل CI الكامل العادي أو Plugin Prerelease أو فحص التثبيت السريع أو قبول الحزمة
أو QA Lab أو أجزاء مسار إصدار Docker. كما يجعل `full`
المظلة تشغّل E2E لحزمة Telegram مقابل قطعة حزمة الإصدار عندما يكون
`rerun_group=all`، حتى لا يتخطى مرشح ما قبل النشر الكامل مسار حزمة
Telegram ذلك بصمت.

| الملف التعريفي | الاستخدام المقصود | تغطية التشغيل المباشر/المزوّد المضمّنة |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | أسرع اختبار دخان حرج للإصدار. | مسار OpenAI/النواة المباشر، ونماذج Docker المباشرة لـ OpenAI، ونواة Gateway الأصلية، وملف Gateway التعريفي الأصلي لـ OpenAI، وPlugin الأصلي لـ OpenAI، وGateway المباشر لـ OpenAI على Docker. |
| `stable`  | ملف الموافقة الافتراضي للإصدار. | `minimum` إضافة إلى Anthropic وGoogle وMiniMax والواجهة الخلفية، وحزمة اختبارات التشغيل المباشر الأصلية، وواجهة CLI الخلفية المباشرة على Docker، وربط ACP على Docker، وحزمة اختبارات Codex على Docker، وجزء اختبار دخان لـ OpenCode Go. |
| `full`    | فحص استشاري واسع. | `stable` إضافة إلى المزوّدين الاستشاريين، وأجزاء التشغيل المباشر للـPlugin، وأجزاء تشغيل الوسائط المباشر. |

## إضافات مخصّصة لـ Full فقط

تتخطى `stable` هذه الحِزم وتضمّنها `full`:

| المجال | تغطية Full فقط |
| -------------------------------- | ------------------------------------------------------------------------------- |
| نماذج Docker المباشرة | OpenCode Go وOpenRouter وxAI وZ.ai وFireworks. |
| Gateway المباشر على Docker | جزء استشاري لـ DeepSeek وFireworks وOpenCode Go وOpenRouter وxAI وZ.ai. |
| ملفات مزوّدي Gateway التعريفية الأصلية | Fireworks وDeepSeek وأجزاء نماذج OpenCode Go الكاملة وOpenRouter وxAI وZ.ai. |
| أجزاء التشغيل المباشر للـPlugin الأصلية | Plugins A-K وL-N وO-Z أخرى وMoonshot وxAI. |
| أجزاء تشغيل الوسائط المباشر الأصلية | الصوت، وموسيقى Google، وموسيقى MiniMax، ومجموعات الفيديو A-D. |

تتضمن `stable` ‏`native-live-src-gateway-profiles-opencode-go-smoke`؛ بينما تستخدم `full`
أجزاء نماذج OpenCode Go الأوسع بدلاً من ذلك.

## عمليات إعادة تشغيل مركّزة

استخدم `rerun_group` لتجنّب تكرار صناديق الإصدار غير ذات الصلة:

| المقبض | النطاق |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | جميع مراحل Full Release Validation. |
| `ci`                | فرع CI الكامل اليدوي فقط. |
| `plugin-prerelease` | فرع Plugin Prerelease فقط. |
| `release-checks`    | جميع مراحل OpenClaw Release Checks. |
| `install-smoke`     | Install Smoke عبر فحوصات الإصدار. |
| `cross-os`          | فحوصات الإصدار عبر أنظمة التشغيل. |
| `live-e2e`          | تحقق E2E للمستودع/التشغيل المباشر ومسار إصدار Docker. |
| `package`           | Package Acceptance. |
| `qa`                | تكافؤ QA إضافة إلى مسارات QA المباشرة. |
| `qa-parity`         | مسارات تكافؤ QA والتقرير فقط. |
| `qa-live`           | مصفوفة QA المباشرة وTelegram فقط. |
| `npm-telegram`      | E2E لـTelegram للحزمة المنشورة؛ يتطلب `npm_telegram_package_spec`. |

استخدم `live_suite_filter` مع `rerun_group=live-e2e` عند فشل حزمة تشغيل مباشر واحدة.
تُعرَّف معرّفات المرشحات الصالحة في سير عمل التشغيل المباشر/E2E القابل لإعادة الاستخدام، بما في ذلك
`docker-live-models` و`live-gateway-docker`
و`live-gateway-anthropic-docker` و`live-gateway-google-docker`
و`live-gateway-minimax-docker` و`live-gateway-advisory-docker`
و`live-cli-backend-docker` و`live-acp-bind-docker` و
`live-codex-harness-docker`.

## الأدلة المطلوب الاحتفاظ بها

احتفظ بملخّص `Full Release Validation` كفهرس على مستوى الإصدار. فهو يربط
معرّفات التشغيل الفرعية ويتضمن جداول أبطأ المهام. عند حدوث إخفاقات، افحص سير العمل
الفرعي أولاً، ثم أعد تشغيل أصغر مقبض مطابق أعلاه.

القطع الأثرية المفيدة:

- `release-package-under-test` من `OpenClaw Release Checks`
- قطع مسار إصدار Docker الأثرية ضمن `.artifacts/docker-tests/`
- `package-under-test` من Package Acceptance وقطع قبول Docker الأثرية
- قطع فحص الإصدار عبر أنظمة التشغيل لكل نظام تشغيل وحزمة
- قطع تكافؤ QA وMatrix وTelegram الأثرية

## ملفات سير العمل

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
