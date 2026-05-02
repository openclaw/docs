---
read_when:
    - تشغيل التحقق الكامل من الإصدار أو إعادة تشغيله
    - مقارنة ملفي تعريف التحقق من الإصدار المستقر والكامل
    - تصحيح أخطاء إخفاقات مراحل التحقق من صحة الإصدار
summary: مراحل التحقق الكامل من الإصدار، وسير العمل الفرعية، وملفات تعريف الإصدار، ومعرّفات إعادة التشغيل، والأدلة
title: التحقق الكامل من الإصدار
x-i18n:
    generated_at: "2026-05-02T21:02:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce1e5a72227ca202335fe68b537491a0b68a0bb2af431aa56c41cf20989e88c
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` هي المظلة الخاصة بالإصدار. وهي نقطة الدخول اليدوية الوحيدة لإثبات ما قبل الإصدار، لكن معظم العمل يحدث في سير عمل فرعية بحيث يمكن إعادة تشغيل صندوق فاشل من دون إعادة بدء الإصدار كله.

شغّلها من مرجع سير عمل موثوق، عادةً `main`، ومرّر فرع الإصدار أو الوسم أو SHA الكامل للالتزام بوصفه `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

تستخدم سير العمل الفرعية مرجع سير العمل الموثوق للحاضنة وتستخدم الإدخال `ref` للمرشح قيد الاختبار. وهذا يُبقي منطق التحقق الجديد متاحًا عند التحقق من فرع إصدار أو وسم أقدم.

يبني قبول الحزمة عادةً أرشيف tarball المرشح من `ref` الذي تم حله، بما في ذلك تشغيلات SHA الكامل المُرسلة باستخدام `pnpm ci:full-release`. بعد النشر، مرّر `package_acceptance_package_spec=openclaw@YYYY.M.D` (أو `openclaw@beta`/`openclaw@latest`) لتشغيل مصفوفة الحزمة/التحديث نفسها مقابل حزمة npm المشحونة بدلًا من ذلك.

## المراحل ذات المستوى الأعلى

| المرحلة                | التفاصيل                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| حل الهدف    | **المهمة:** `Resolve target ref`<br />**سير العمل الفرعي:** لا يوجد<br />**يثبت:** يحل فرع الإصدار أو الوسم أو SHA الكامل للالتزام ويسجل الإدخالات المحددة.<br />**إعادة التشغيل:** أعد تشغيل المظلة إذا فشل هذا.                                                                                                                                                                              |
| Vitest وCI العادي | **المهمة:** `Run normal full CI`<br />**سير العمل الفرعي:** `CI`<br />**يثبت:** مخطط CI كامل يدويًا مقابل مرجع الهدف، بما في ذلك مسارات Linux Node، وأجزاء Plugin المضمّنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، واختبار بناء سريع، وفحوصات التوثيق، وSkills في Python، وWindows، وmacOS، وControl UI i18n، وAndroid عبر المظلة.<br />**إعادة التشغيل:** `rerun_group=ci`. |
| ما قبل إصدار Plugin    | **المهمة:** `Run plugin prerelease validation`<br />**سير العمل الفرعي:** `Plugin Prerelease`<br />**يثبت:** فحوصات Plugin الساكنة الخاصة بالإصدار، وتغطية Plugin الوكيلة، وأجزاء الدُفعات الكاملة للإضافات، ومسارات Docker لما قبل إصدار Plugin.<br />**إعادة التشغيل:** `rerun_group=plugin-prerelease`.                                                                                                       |
| فحوصات الإصدار       | **المهمة:** `Run release/live/Docker/QA validation`<br />**سير العمل الفرعي:** `OpenClaw Release Checks`<br />**يثبت:** اختبار التثبيت السريع، وفحوصات الحزم عبر أنظمة التشغيل، ومجموعات live/E2E، وأجزاء مسار إصدار Docker، وقبول الحزمة، وتكافؤ QA Lab، وMatrix الحي، وTelegram الحي.<br />**إعادة التشغيل:** `rerun_group=release-checks` أو مقبض أضيق لفحوصات الإصدار.                                |
| حزمة Telegram     | **المهمة:** `Run package Telegram E2E`<br />**سير العمل الفرعي:** `NPM Telegram Beta E2E`<br />**يثبت:** إثبات حزمة Telegram المدعوم بالعنصر لـ `rerun_group=all` مع `release_profile=full`، أو إثبات Telegram للحزمة المنشورة عند ضبط `npm_telegram_package_spec`.<br />**إعادة التشغيل:** `rerun_group=npm-telegram` مع `npm_telegram_package_spec`.                                     |
| متحقق المظلة    | **المهمة:** `Verify full validation`<br />**سير العمل الفرعي:** لا يوجد<br />**يثبت:** يعيد فحص نتائج تشغيلات الأبناء المسجلة ويلحق جداول أبطأ المهام من سير العمل الفرعية.<br />**إعادة التشغيل:** أعد تشغيل هذه المهمة فقط بعد إعادة تشغيل ابن فاشل حتى ينجح.                                                                                                                                   |

بالنسبة إلى `ref=main` و`rerun_group=all`، تحل مظلة أحدث محل مظلة أقدم. عندما يُلغى الأصل، يلغي المراقب الخاص به أي سير عمل فرعي كان قد أرسله بالفعل. لا تلغي تشغيلات التحقق من فروع الإصدار والوسوم بعضها بعضًا افتراضيًا.

## مراحل فحوصات الإصدار

`OpenClaw Release Checks` هو أكبر سير عمل فرعي. يحل الهدف مرة واحدة ويُحضّر عنصرًا مشتركًا باسم `release-package-under-test` عندما تحتاجه المراحل المواجهة للحزم أو Docker.

| المرحلة               | التفاصيل                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| هدف الإصدار      | **المهمة:** `Resolve target ref`<br />**سير العمل الداعم:** لا يوجد<br />**الاختبارات:** المرجع المحدد، وSHA المتوقع الاختياري، والملف الشخصي، ومجموعة إعادة التشغيل، ومرشح مجموعة live المركّزة.<br />**إعادة التشغيل:** `rerun_group=release-checks`.                                                                                                                                                                           |
| عنصر الحزمة    | **المهمة:** `Prepare release package artifact`<br />**سير العمل الداعم:** لا يوجد<br />**الاختبارات:** يحزم أو يحل أرشيف tarball مرشحًا واحدًا ويرفع `release-package-under-test` للفحوصات اللاحقة المواجهة للحزم.<br />**إعادة التشغيل:** مجموعة الحزمة أو عبر أنظمة التشغيل أو live/E2E المتأثرة.                                                                                                           |
| اختبار التثبيت السريع       | **المهمة:** `Run install smoke`<br />**سير العمل الداعم:** `Install Smoke`<br />**الاختبارات:** مسار التثبيت الكامل مع إعادة استخدام صورة اختبار Dockerfile السريع في الجذر، وتثبيت حزمة QR، واختبارات Docker السريعة للجذر وGateway، واختبارات Docker للمثبّت، واختبار سريع لمزوّد الصور بتثبيت Bun عمومي، واختبار E2E سريع لتثبيت/إلغاء تثبيت Plugin المضمّنة.<br />**إعادة التشغيل:** `rerun_group=install-smoke`.                              |
| عبر أنظمة التشغيل            | **المهمة:** `cross_os_release_checks`<br />**سير العمل الداعم:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**الاختبارات:** مسارات جديدة وترقية على Linux وWindows وmacOS للمزوّد والوضع المحددين، باستخدام أرشيف tarball المرشح إضافةً إلى حزمة أساس.<br />**إعادة التشغيل:** `rerun_group=cross-os`.                                                                               |
| المستودع وlive E2E   | **المهمة:** `Run repo/live E2E validation`<br />**سير العمل الداعم:** `OpenClaw Live And E2E Checks (Reusable)`<br />**الاختبارات:** E2E للمستودع، وذاكرة التخزين المؤقت الحية، وبث OpenAI عبر websocket، ومزوّد live الأصلي وأجزاء Plugin، وحاضنات النموذج/الخلفية/Gateway الحية المدعومة بـ Docker والمحددة بواسطة `release_profile`.<br />**إعادة التشغيل:** `rerun_group=live-e2e`، اختياريًا مع `live_suite_filter`. |
| مسار إصدار Docker | **المهمة:** `Run Docker release-path validation`<br />**سير العمل الداعم:** `OpenClaw Live And E2E Checks (Reusable)`<br />**الاختبارات:** أجزاء Docker لمسار الإصدار مقابل عنصر الحزمة المشترك.<br />**إعادة التشغيل:** `rerun_group=live-e2e`.                                                                                                                                                      |
| قبول الحزمة  | **المهمة:** `Run package acceptance`<br />**سير العمل الداعم:** `Package Acceptance`<br />**الاختبارات:** تجهيزات حزمة Plugin دون اتصال، وتحديث Plugin، وقبول حزمة Telegram مع mock-OpenAI، وفحوصات البقاء بعد الترقية المنشورة من كل إصدار npm مستقر عند `2026.4.23` أو بعده مقابل أرشيف tarball نفسه.<br />**إعادة التشغيل:** `rerun_group=package`.                                         |
| تكافؤ QA           | **المهمة:** `Run QA Lab parity lane` و`Run QA Lab parity report`<br />**سير العمل الداعم:** مهام مباشرة<br />**الاختبارات:** حزم تكافؤ وكيلة للمرشح والأساس، ثم تقرير التكافؤ.<br />**إعادة التشغيل:** `rerun_group=qa-parity` أو `rerun_group=qa`.                                                                                                                                       |
| Matrix حي لـ QA      | **المهمة:** `Run QA Lab live Matrix lane`<br />**سير العمل الداعم:** مهمة مباشرة<br />**الاختبارات:** ملف QA سريع لـ Matrix الحي في بيئة `qa-live-shared`.<br />**إعادة التشغيل:** `rerun_group=qa-live` أو `rerun_group=qa`.                                                                                                                                                                        |
| Telegram حي لـ QA    | **المهمة:** `Run QA Lab live Telegram lane`<br />**سير العمل الداعم:** مهمة مباشرة<br />**الاختبارات:** QA حي لـ Telegram مع إيجارات بيانات اعتماد Convex CI.<br />**إعادة التشغيل:** `rerun_group=qa-live` أو `rerun_group=qa`.                                                                                                                                                                                    |
| متحقق الإصدار    | **المهمة:** `Verify release checks`<br />**سير العمل الداعم:** لا يوجد<br />**الاختبارات:** مهام فحوصات الإصدار المطلوبة لمجموعة إعادة التشغيل المحددة.<br />**إعادة التشغيل:** أعد التشغيل بعد نجاح المهام الفرعية المركّزة.                                                                                                                                                                                                 |

## أجزاء مسار إصدار Docker

تشغّل مرحلة مسار إصدار Docker هذه الأجزاء عندما يكون `live_suite_filter` فارغًا:

| الجزء                                                           | التغطية                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | مسارات اختبار سريعة لمسار إصدار Docker الأساسي.                                   |
| `package-update-openai`                                         | سلوك تثبيت وتحديث حزمة OpenAI.                             |
| `package-update-anthropic`                                      | سلوك تثبيت وتحديث حزمة Anthropic.                          |
| `package-update-core`                                           | سلوك الحزمة والتحديث المحايد للمزوّد.                           |
| `plugins-runtime-plugins`                                       | مسارات وقت تشغيل Plugin التي تمارس سلوك Plugin.                     |
| `plugins-runtime-services`                                      | مسارات وقت تشغيل Plugin المدعومة بخدمات؛ تتضمن OpenWebUI عند الطلب. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | دُفعات تثبيت/وقت تشغيل Plugin مقسمة للتحقق المتوازي من الإصدار.   |

استخدم `docker_lanes=<lane[,lane]>` مستهدفًا في سير العمل القابل لإعادة الاستخدام live/E2E عندما يفشل مسار Docker واحد فقط. تتضمن عناصر الإصدار أوامر إعادة تشغيل لكل مسار مع إدخالات عنصر الحزمة وإعادة استخدام الصورة عند توفرها.

## ملفات تعريف الإصدار

يتحكم `release_profile` غالبا في نطاق live/المزوّد داخل فحوصات الإصدار.
لا يزيل CI الكامل العادي أو Plugin Prerelease أو اختبار التثبيت السريع أو قبول الحزمة أو QA Lab أو أجزاء مسار إصدار Docker. كما يجعل `full`
تشغيل المظلة ينفذ Telegram E2E للحزمة مقابل أرتيفاكت حزمة الإصدار عندما تكون
`rerun_group=all`، بحيث لا يتخطى مرشح ما قبل النشر الكامل مسار حزمة
Telegram ذلك بصمت.

| الملف الشخصي | الاستخدام المقصود                 | تغطية live/المزوّد المضمنة                                                                                                                                                  |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | أسرع اختبار سريع حرج للإصدار.      | مسار OpenAI/core المباشر، ونماذج Docker المباشرة لـ OpenAI، وGateway الأساسي الأصلي، وملف تعريف Gateway الأصلي لـ OpenAI، وPlugin OpenAI الأصلي، وGateway OpenAI المباشر في Docker. |
| `stable`  | ملف تعريف اعتماد الإصدار الافتراضي. | `minimum` بالإضافة إلى Anthropic وGoogle وMiniMax والخلفية وحزمة اختبار live الأصلية وخلفية CLI المباشرة في Docker وربط Docker ACP وحزمة اختبار Docker Codex وجزء اختبار سريع لـ OpenCode Go. |
| `full`    | مسح استشاري واسع.                 | `stable` بالإضافة إلى المزوّدين الاستشاريين وأجزاء Plugin المباشرة وأجزاء الوسائط المباشرة.                                                                                  |

## إضافات full فقط

تتخطى `stable` هذه المجموعات وتضمنها `full`:

| المجال                           | تغطية full فقط                                                               |
| -------------------------------- | ------------------------------------------------------------------------------- |
| نماذج Docker المباشرة             | OpenCode Go وOpenRouter وxAI وZ.ai وFireworks.                              |
| Gateway Docker المباشر            | جزء استشاري لـ DeepSeek وFireworks وOpenCode Go وOpenRouter وxAI وZ.ai. |
| ملفات تعريف مزوّدي Gateway الأصلية | Fireworks وDeepSeek وأجزاء نماذج OpenCode Go الكاملة وOpenRouter وxAI وZ.ai.  |
| أجزاء Plugin الأصلية المباشرة      | Plugins A-K وL-N وO-Z other وMoonshot وxAI.                                 |
| أجزاء الوسائط الأصلية المباشرة     | الصوت وموسيقى Google وموسيقى MiniMax ومجموعات الفيديو A-D.                       |

تتضمن `stable` المسار `native-live-src-gateway-profiles-opencode-go-smoke`؛ وتستخدم `full`
أجزاء نماذج OpenCode Go الأوسع بدلا من ذلك.

## إعادات التشغيل المركزة

استخدم `rerun_group` لتجنب تكرار مربعات إصدار غير ذات صلة:

| المعرف              | النطاق                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | جميع مراحل Full Release Validation.                                   |
| `ci`                | فرع CI الكامل اليدوي فقط.                                             |
| `plugin-prerelease` | فرع Plugin Prerelease فقط.                                            |
| `release-checks`    | جميع مراحل OpenClaw Release Checks.                                   |
| `install-smoke`     | اختبار التثبيت السريع عبر فحوصات الإصدار.                              |
| `cross-os`          | فحوصات إصدار Cross-OS.                                                |
| `live-e2e`          | تحقق E2E للمستودع/live ومسار إصدار Docker.                            |
| `package`           | قبول الحزمة.                                                          |
| `qa`                | تكافؤ QA بالإضافة إلى مسارات QA المباشرة.                              |
| `qa-parity`         | مسارات تكافؤ QA والتقرير فقط.                                         |
| `qa-live`           | مصفوفة QA المباشرة وTelegram فقط.                                     |
| `npm-telegram`      | Telegram E2E للحزمة المنشورة؛ يتطلب `npm_telegram_package_spec`. |

استخدم `live_suite_filter` مع `rerun_group=live-e2e` عندما تفشل مجموعة live واحدة.
تُعرّف معرفات المرشح الصالحة في سير عمل live/E2E القابل لإعادة الاستخدام، بما في ذلك
`docker-live-models` و`live-gateway-docker` و
`live-gateway-anthropic-docker` و`live-gateway-google-docker` و
`live-gateway-minimax-docker` و`live-gateway-advisory-docker` و
`live-cli-backend-docker` و`live-acp-bind-docker` و
`live-codex-harness-docker`.

## الأدلة المطلوب الاحتفاظ بها

احتفظ بملخص `Full Release Validation` كفهرس على مستوى الإصدار. فهو يربط
معرفات التشغيل الفرعية ويتضمن جداول أبطأ المهام. عند حدوث إخفاقات، افحص سير العمل الفرعي
أولا، ثم أعد تشغيل أصغر معرف مطابق أعلاه.

أرتيفاكتات مفيدة:

- `release-package-under-test` من `OpenClaw Release Checks`
- أرتيفاكتات مسار إصدار Docker تحت `.artifacts/docker-tests/`
- أرتيفاكتات قبول الحزمة `package-under-test` وقبول Docker
- أرتيفاكتات فحص إصدار Cross-OS لكل نظام تشغيل ومجموعة
- أرتيفاكتات تكافؤ QA وMatrix وTelegram

## ملفات سير العمل

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
