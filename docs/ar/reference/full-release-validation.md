---
read_when:
    - تشغيل التحقق الكامل من الإصدار أو إعادة تشغيله
    - مقارنة ملفات تعريف التحقق من الإصدار المستقرة والكاملة
    - تصحيح أخطاء إخفاقات مرحلة التحقق من صحة الإصدار
summary: مراحل التحقق الكامل من الإصدار، وسير العمل الفرعية، وملفات تعريف الإصدار، ومعرّفات إعادة التشغيل، والأدلة
title: التحقق الكامل من الإصدار
x-i18n:
    generated_at: "2026-05-01T07:42:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcbfafd744437c160c09a9c508a639781549193669b300e5249023f9f5dd4afe
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` هو مظلة الإصدار. وهو نقطة الدخول اليدوية الوحيدة
لإثبات ما قبل الإصدار، لكن معظم العمل يحدث في مسارات عمل فرعية بحيث يمكن
إعادة تشغيل صندوق فاشل من دون إعادة بدء الإصدار بالكامل.

شغّله من مرجع مسار عمل موثوق، عادةً `main`، ومرّر فرع الإصدار أو الوسم أو
SHA الكامل للالتزام بوصفه `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

تستخدم مسارات العمل الفرعية مرجع مسار العمل الموثوق للحاضنة، وتستخدم الإدخال
`ref` للمرشح قيد الاختبار. يضمن ذلك إتاحة منطق التحقق الجديد عند التحقق من
فرع إصدار أقدم أو وسم أقدم.

## المراحل ذات المستوى الأعلى

| المرحلة                 | التفاصيل                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| حل الهدف     | **المهمة:** `Resolve target ref`<br />**مسار العمل الفرعي:** لا يوجد<br />**يثبت:** يحل فرع الإصدار أو الوسم أو SHA الكامل للالتزام ويسجل الإدخالات المحددة.<br />**إعادة التشغيل:** أعد تشغيل المظلة إذا فشل هذا.                                                                                                                                                                              |
| Vitest وCI العادي  | **المهمة:** `Run normal full CI`<br />**مسار العمل الفرعي:** `CI`<br />**يثبت:** مخطط CI يدوي كامل مقابل المرجع الهدف، بما في ذلك مسارات Linux Node، وشظايا Plugin المضمّنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، وتجربة البناء، وفحوص المستندات، وPython skills، وWindows، وmacOS، وتدويل Control UI، وAndroid عبر المظلة.<br />**إعادة التشغيل:** `rerun_group=ci`. |
| ما قبل إصدار Plugin     | **المهمة:** `Run plugin prerelease validation`<br />**مسار العمل الفرعي:** `Plugin Prerelease`<br />**يثبت:** فحوص Plugin الثابتة الخاصة بالإصدار، وتغطية Plugin الوكيلية، وشظايا الدُفعات الكاملة للامتدادات، ومسارات Docker لما قبل إصدار Plugin.<br />**إعادة التشغيل:** `rerun_group=plugin-prerelease`.                                                                                                       |
| فحوص الإصدار        | **المهمة:** `Run release/live/Docker/QA validation`<br />**مسار العمل الفرعي:** `OpenClaw Release Checks`<br />**يثبت:** تجربة التثبيت، وفحوص الحزم عبر أنظمة التشغيل، ومجموعات live/E2E، وأجزاء مسار إصدار Docker، وPackage Acceptance، وتكافؤ QA Lab، وMatrix المباشر، وTelegram المباشر.<br />**إعادة التشغيل:** `rerun_group=release-checks` أو معالج أضيق لفحوص الإصدار.                                |
| Telegram بعد النشر | **المهمة:** `Run post-publish Telegram E2E`<br />**مسار العمل الفرعي:** `NPM Telegram Beta E2E`<br />**يثبت:** إثبات Telegram الاختياري للحزمة المنشورة عند تعيين `npm_telegram_package_spec`.<br />**إعادة التشغيل:** `rerun_group=npm-telegram`.                                                                                                                                                     |
| محقق المظلة     | **المهمة:** `Verify full validation`<br />**مسار العمل الفرعي:** لا يوجد<br />**يثبت:** يعيد فحص النتائج المسجلة لتشغيلات المسارات الفرعية ويلحق جداول أبطأ المهام من مسارات العمل الفرعية.<br />**إعادة التشغيل:** أعد تشغيل هذه المهمة فقط بعد إعادة تشغيل مسار فرعي فاشل حتى ينجح.                                                                                                                                   |

بالنسبة إلى `ref=main` و`rerun_group=all`، تحل مظلة أحدث محل مظلة أقدم.
عند إلغاء الأصل، يلغي مراقبه أي مسار عمل فرعي كان قد أرسله بالفعل. لا تلغي
تشغيلات التحقق من فروع الإصدار والوسوم بعضها بعضًا افتراضيًا.

## مراحل فحوص الإصدار

`OpenClaw Release Checks` هو أكبر مسار عمل فرعي. يحل الهدف مرة واحدة
ويحضّر قطعة أثرية مشتركة باسم `release-package-under-test` عندما تحتاجها
المراحل المواجهة للحزم أو Docker.

| المرحلة               | التفاصيل                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| هدف الإصدار      | **المهمة:** `Resolve target ref`<br />**مسار العمل الداعم:** لا يوجد<br />**الاختبارات:** المرجع المحدد، وSHA المتوقع الاختياري، والملف الشخصي، ومجموعة إعادة التشغيل، ومرشح مجموعة live المركّزة.<br />**إعادة التشغيل:** `rerun_group=release-checks`.                                                                                                                                                                           |
| قطعة الحزمة الأثرية    | **المهمة:** `Prepare release package artifact`<br />**مسار العمل الداعم:** لا يوجد<br />**الاختبارات:** يحزم أو يحل كرة tar مرشحة واحدة ويرفع `release-package-under-test` للفحوص اللاحقة المواجهة للحزم.<br />**إعادة التشغيل:** مجموعة الحزمة أو عبر أنظمة التشغيل أو live/E2E المتأثرة.                                                                                                           |
| تجربة التثبيت       | **المهمة:** `Run install smoke`<br />**مسار العمل الداعم:** `Install Smoke`<br />**الاختبارات:** مسار التثبيت الكامل مع إعادة استخدام صورة تجربة Dockerfile الجذرية، وتثبيت حزمة QR، وتجارب Docker للجذر وGateway، واختبارات Docker للمثبت، وتجربة موفر الصور لتثبيت Bun العام، وDocker E2E السريع لـPlugin المضمّنة.<br />**إعادة التشغيل:** `rerun_group=install-smoke`.                                         |
| عبر أنظمة التشغيل            | **المهمة:** `cross_os_release_checks`<br />**مسار العمل الداعم:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**الاختبارات:** مسارات جديدة وترقية على Linux وWindows وmacOS للموفر والوضع المحددين، باستخدام كرة tar المرشحة بالإضافة إلى حزمة أساس.<br />**إعادة التشغيل:** `rerun_group=cross-os`.                                                                               |
| المستودع وlive E2E   | **المهمة:** `Run repo/live E2E validation`<br />**مسار العمل الداعم:** `OpenClaw Live And E2E Checks (Reusable)`<br />**الاختبارات:** E2E للمستودع، وذاكرة التخزين المؤقت المباشرة، وبث websocket من OpenAI، وشظايا الموفر المباشر الأصلي وPlugin، وحاضنات النموذج/الخلفية/Gateway المباشرة المدعومة بـDocker والمحددة بواسطة `release_profile`.<br />**إعادة التشغيل:** `rerun_group=live-e2e`، اختياريًا مع `live_suite_filter`. |
| مسار إصدار Docker | **المهمة:** `Run Docker release-path validation`<br />**مسار العمل الداعم:** `OpenClaw Live And E2E Checks (Reusable)`<br />**الاختبارات:** أجزاء Docker لمسار الإصدار مقابل قطعة الحزمة الأثرية المشتركة.<br />**إعادة التشغيل:** `rerun_group=live-e2e`.                                                                                                                                                      |
| قبول الحزمة  | **المهمة:** `Run package acceptance`<br />**مسار العمل الداعم:** `Package Acceptance`<br />**الاختبارات:** توافق تبعيات القنوات المضمّنة الأصلية للقطعة الأثرية، وتجهيزات حزم Plugin دون اتصال، وقبول حزمة Telegram بمحاكاة OpenAI مقابل كرة tar نفسها.<br />**إعادة التشغيل:** `rerun_group=package`.                                                                                       |
| تكافؤ QA           | **المهمة:** `Run QA Lab parity lane` و`Run QA Lab parity report`<br />**مسار العمل الداعم:** مهام مباشرة<br />**الاختبارات:** حزم التكافؤ الوكيلية للمرشح والأساس، ثم تقرير التكافؤ.<br />**إعادة التشغيل:** `rerun_group=qa-parity` أو `rerun_group=qa`.                                                                                                                                       |
| Matrix مباشر لـQA      | **المهمة:** `Run QA Lab live Matrix lane`<br />**مسار العمل الداعم:** مهمة مباشرة<br />**الاختبارات:** ملف QA سريع لـMatrix المباشر في بيئة `qa-live-shared`.<br />**إعادة التشغيل:** `rerun_group=qa-live` أو `rerun_group=qa`.                                                                                                                                                                        |
| Telegram مباشر لـQA    | **المهمة:** `Run QA Lab live Telegram lane`<br />**مسار العمل الداعم:** مهمة مباشرة<br />**الاختبارات:** QA مباشر لـTelegram مع عقود إيجار بيانات اعتماد Convex CI.<br />**إعادة التشغيل:** `rerun_group=qa-live` أو `rerun_group=qa`.                                                                                                                                                                                    |
| محقق الإصدار    | **المهمة:** `Verify release checks`<br />**مسار العمل الداعم:** لا يوجد<br />**الاختبارات:** مهام فحوص الإصدار المطلوبة لمجموعة إعادة التشغيل المحددة.<br />**إعادة التشغيل:** أعد التشغيل بعد نجاح المهام الفرعية المركّزة.                                                                                                                                                                                                 |

## أجزاء مسار إصدار Docker

تشغّل مرحلة مسار إصدار Docker هذه الأجزاء عندما يكون `live_suite_filter`
فارغًا:

| الجزء                                                                                       | التغطية                                                                |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                                                      | مسارات تجربة مسار إصدار Docker الأساسية.                                   |
| `package-update-openai`                                                                     | سلوك تثبيت حزمة OpenAI وتحديثها.                             |
| `package-update-anthropic`                                                                  | سلوك تثبيت حزمة Anthropic وتحديثها.                          |
| `package-update-core`                                                                       | سلوك الحزمة والتحديث المحايد للموفر.                           |
| `plugins-runtime-plugins`                                                                   | مسارات وقت تشغيل Plugin التي تختبر سلوك Plugin.                     |
| `plugins-runtime-services`                                                                  | مسارات وقت تشغيل Plugin المدعومة بالخدمات؛ تتضمن OpenWebUI عند الطلب. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h`                             | دُفعات تثبيت/وقت تشغيل Plugin مقسمة للتحقق المتوازي من الإصدار.   |
| `bundled-channels-core`                                                                     | سلوك Docker للقنوات المضمّنة.                                        |
| `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` | سلوك تحديث القنوات المضمّنة.                                        |
| `bundled-channels-contracts`                                                                | فحوص عقود القنوات المضمّنة في مسار إصدار Docker.             |

استخدم `docker_lanes=<lane[,lane]>` الموجّه في سير عمل المباشر/E2E القابل لإعادة الاستخدام عندما
يفشل مسار Docker واحد فقط. تتضمن آثار الإصدار أوامر إعادة تشغيل لكل مسار
مع مُدخلات إعادة استخدام أثر الحزمة والصورة عند توفرها.

## ملفات تعريف الإصدار

يتحكم `release_profile` فقط في نطاق المباشر/الموفر داخل فحوصات الإصدار. وهو
لا يزيل CI الكامل المعتاد، أو Plugin Prerelease، أو install smoke، أو قبول الحزمة،
أو QA Lab، أو أجزاء مسار إصدار Docker.

| ملف التعريف | الاستخدام المقصود | تغطية المباشر/الموفر المضمنة |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | أسرع اختبار smoke حرج للإصدار. | مسار OpenAI/core المباشر، ونماذج Docker المباشرة لـ OpenAI، وGateway الأصلي الأساسي، وملف تعريف Gateway الأصلي لـ OpenAI، وPlugin الأصلي لـ OpenAI، وGateway Docker المباشر لـ OpenAI. |
| `stable`  | ملف تعريف اعتماد الإصدار الافتراضي. | `minimum` بالإضافة إلى Anthropic، وGoogle، وMiniMax، والخلفية، وحزمة اختبار المباشر الأصلية، وخلفية CLI المباشرة في Docker، وربط Docker ACP، وحزمة اختبار Docker Codex، وشريحة smoke لـ OpenCode Go. |
| `full`    | مسح استشاري واسع. | `stable` بالإضافة إلى موفري الاستشارة، وشرائح Plugin المباشرة، وشرائح الوسائط المباشرة. |

## إضافات full فقط

تتخطى `stable` هذه الحزم وتضمّنها `full`:

| المجال | تغطية full فقط |
| -------------------------------- | ------------------------------------------------------------------------------- |
| نماذج Docker المباشرة | OpenCode Go، وOpenRouter، وxAI، وZ.ai، وFireworks. |
| Gateway Docker المباشر | شريحة استشارية لـ DeepSeek، وFireworks، وOpenCode Go، وOpenRouter، وxAI، وZ.ai. |
| ملفات تعريف موفر Gateway الأصلي | Fireworks، وDeepSeek، وشرائح نماذج OpenCode Go الكاملة، وOpenRouter، وxAI، وZ.ai. |
| شرائح Plugin الأصلية المباشرة | Plugins A-K، وL-N، وO-Z أخرى، وMoonshot، وxAI. |
| شرائح الوسائط الأصلية المباشرة | الصوت، وموسيقى Google، وموسيقى MiniMax، ومجموعات الفيديو A-D. |

تتضمن `stable` المسار `native-live-src-gateway-profiles-opencode-go-smoke`؛ أما `full`
فتستخدم شرائح نماذج OpenCode Go الأوسع بدلا من ذلك.

## عمليات إعادة تشغيل مركزة

استخدم `rerun_group` لتجنب تكرار صناديق إصدار غير مرتبطة:

| المقبض | النطاق |
| ------------------- | ------------------------------------------------- |
| `all`               | جميع مراحل التحقق الكامل من الإصدار. |
| `ci`                | فرع CI الكامل اليدوي فقط. |
| `plugin-prerelease` | فرع Plugin Prerelease فقط. |
| `release-checks`    | جميع مراحل فحوصات إصدار OpenClaw. |
| `install-smoke`     | Install Smoke عبر فحوصات الإصدار. |
| `cross-os`          | فحوصات إصدار عبر أنظمة التشغيل. |
| `live-e2e`          | التحقق من E2E للمستودع/المباشر ومسار إصدار Docker. |
| `package`           | قبول الحزمة. |
| `qa`                | تكافؤ QA بالإضافة إلى مسارات QA المباشرة. |
| `qa-parity`         | مسارات تكافؤ QA والتقرير فقط. |
| `qa-live`           | مصفوفة QA المباشرة وTelegram فقط. |
| `npm-telegram`      | Telegram E2E الاختياري بعد النشر فقط. |

استخدم `live_suite_filter` مع `rerun_group=live-e2e` عندما تفشل حزمة مباشرة واحدة.
تُعرّف معرّفات التصفية الصالحة في سير عمل المباشر/E2E القابل لإعادة الاستخدام، بما في ذلك
`docker-live-models`، و`live-gateway-docker`،
و`live-gateway-anthropic-docker`، و`live-gateway-google-docker`،
و`live-gateway-minimax-docker`، و`live-gateway-advisory-docker`،
و`live-cli-backend-docker`، و`live-acp-bind-docker`، و
`live-codex-harness-docker`.

## الأدلة التي يجب الاحتفاظ بها

احتفظ بملخص `Full Release Validation` باعتباره فهرس مستوى الإصدار. فهو يربط
معرّفات التشغيل الفرعية ويتضمن جداول أبطأ المهام. عند حدوث إخفاقات، افحص سير العمل
الفرعي أولا، ثم أعد تشغيل أصغر مقبض مطابق أعلاه.

آثار مفيدة:

- `release-package-under-test` من `OpenClaw Release Checks`
- آثار مسار إصدار Docker ضمن `.artifacts/docker-tests/`
- `package-under-test` لقبول الحزمة وآثار قبول Docker
- آثار فحص الإصدار عبر أنظمة التشغيل لكل نظام تشغيل وحزمة
- آثار تكافؤ QA وMatrix وTelegram

## ملفات سير العمل

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
