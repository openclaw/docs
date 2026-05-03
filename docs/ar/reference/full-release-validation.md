---
read_when:
    - تشغيل التحقق الكامل من الإصدار أو إعادة تشغيله
    - مقارنة ملفي تعريف التحقق من الإصدار المستقر والكامل
    - استكشاف أخطاء إخفاقات مرحلة التحقق من الإصدار وإصلاحها
summary: مراحل التحقق الكامل من الإصدار، وسير العمل الفرعية، وملفات تعريف الإصدار، ومعرّفات إعادة التشغيل، والأدلة
title: التحقق الكامل من الإصدار
x-i18n:
    generated_at: "2026-05-03T21:41:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 038901ad751c00b35f69d7ec5caf74e577dcf2350d7658037c3ecc9ff5fab6d7
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` هي مظلة الإصدار. وهي نقطة الدخول اليدوية الوحيدة لإثبات ما قبل الإصدار، لكن معظم العمل يحدث في مسارات عمل فرعية بحيث يمكن إعادة تشغيل صندوق فاشل دون إعادة بدء الإصدار بأكمله.

شغّلها من مرجع مسار عمل موثوق، عادةً `main`، ومرّر فرع الإصدار أو الوسم أو SHA الالتزام الكامل كقيمة `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

تستخدم مسارات العمل الفرعية مرجع مسار العمل الموثوق للتجهيز، وتستخدم قيمة الإدخال `ref` للمرشح قيد الاختبار. هذا يبقي منطق التحقق الجديد متاحًا عند التحقق من فرع إصدار أو وسم أقدم.

عادةً يبني Package Acceptance حزمة tarball المرشحة من `ref` بعد حلّه، بما في ذلك عمليات التشغيل ذات SHA الكامل المرسلة باستخدام `pnpm ci:full-release`. بعد النشر، مرّر `package_acceptance_package_spec=openclaw@YYYY.M.D` (أو `openclaw@beta`/`openclaw@latest`) لتشغيل مصفوفة الحزمة/التحديث نفسها على حزمة npm المشحونة بدلًا من ذلك.

## المراحل العليا

| المرحلة                | التفاصيل                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| حل الهدف    | **المهمة:** `Resolve target ref`<br />**مسار العمل الفرعي:** لا يوجد<br />**يثبت:** يحل فرع الإصدار أو الوسم أو SHA الالتزام الكامل ويسجل المدخلات المحددة.<br />**إعادة التشغيل:** أعد تشغيل المظلة إذا فشل هذا.                                                                                                                                                                              |
| Vitest وCI العادي | **المهمة:** `Run normal full CI`<br />**مسار العمل الفرعي:** `CI`<br />**يثبت:** مخطط CI كامل يدوي مقابل المرجع الهدف، بما في ذلك مسارات Linux Node، وشظايا Plugin المضمنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، ودخان البناء، وفحوصات المستندات، وSkills Python، وWindows، وmacOS، وتدويل Control UI، وAndroid عبر المظلة.<br />**إعادة التشغيل:** `rerun_group=ci`. |
| ما قبل إصدار Plugin    | **المهمة:** `Run plugin prerelease validation`<br />**مسار العمل الفرعي:** `Plugin Prerelease`<br />**يثبت:** فحوصات Plugin الثابتة الخاصة بالإصدار، وتغطية Plugin العاملية، وشظايا دفعات الامتدادات الكاملة، ومسارات Docker لما قبل إصدار Plugin.<br />**إعادة التشغيل:** `rerun_group=plugin-prerelease`.                                                                                                       |
| فحوصات الإصدار       | **المهمة:** `Run release/live/Docker/QA validation`<br />**مسار العمل الفرعي:** `OpenClaw Release Checks`<br />**يثبت:** دخان التثبيت، وفحوصات الحزم عبر أنظمة التشغيل، ومجموعات live/E2E، وأجزاء مسار إصدار Docker، وPackage Acceptance، وتكافؤ QA Lab، وMatrix المباشر، وTelegram المباشر.<br />**إعادة التشغيل:** `rerun_group=release-checks` أو مقبض أضيق لفحوصات الإصدار.                                |
| أثر الحزمة     | **المهمة:** `Prepare release package artifact`<br />**مسار العمل الفرعي:** لا يوجد<br />**يثبت:** ينشئ حزمة tarball الأصلية `release-package-under-test` مبكرًا بما يكفي للفحوصات المواجهة للحزم التي لا تحتاج إلى انتظار `OpenClaw Release Checks`.<br />**إعادة التشغيل:** أعد تشغيل المظلة أو وفّر `npm_telegram_package_spec` لـ `rerun_group=npm-telegram`.                                   |
| حزمة Telegram     | **المهمة:** `Run package Telegram E2E`<br />**مسار العمل الفرعي:** `NPM Telegram Beta E2E`<br />**يثبت:** إثبات حزمة Telegram المدعوم بالأثر الأصلي لـ `rerun_group=all` مع `release_profile=full`، أو إثبات Telegram للحزمة المنشورة عند تعيين `npm_telegram_package_spec`.<br />**إعادة التشغيل:** `rerun_group=npm-telegram` مع `npm_telegram_package_spec`.                              |
| متحقق المظلة    | **المهمة:** `Verify full validation`<br />**مسار العمل الفرعي:** لا يوجد<br />**يثبت:** يعيد فحص نتائج تشغيل المسارات الفرعية المسجلة ويلحق جداول أبطأ المهام من مسارات العمل الفرعية.<br />**إعادة التشغيل:** أعد تشغيل هذه المهمة فقط بعد إعادة تشغيل مسار فرعي فاشل حتى ينجح.                                                                                                                                   |

بالنسبة إلى `ref=main` و`rerun_group=all`، تحل مظلة أحدث محل مظلة أقدم. عند إلغاء الأصل، يلغي مراقبه أي مسار عمل فرعي أرسله بالفعل. لا تلغي عمليات التحقق من فروع الإصدار والوسوم بعضها افتراضيًا.

## مراحل فحوصات الإصدار

`OpenClaw Release Checks` هو أكبر مسار عمل فرعي. يحل الهدف مرة واحدة ويجهز أثرًا مشتركًا باسم `release-package-under-test` عندما تحتاج إليه مراحل موجهة للحزم أو Docker.

| المرحلة               | التفاصيل                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| هدف الإصدار      | **المهمة:** `Resolve target ref`<br />**مسار العمل الداعم:** لا يوجد<br />**الاختبارات:** المرجع المحدد، وSHA المتوقع الاختياري، والملف الشخصي، ومجموعة إعادة التشغيل، ومرشح مجموعة live المركزة.<br />**إعادة التشغيل:** `rerun_group=release-checks`.                                                                                                                                                                           |
| أثر الحزمة    | **المهمة:** `Prepare release package artifact`<br />**مسار العمل الداعم:** لا يوجد<br />**الاختبارات:** يحزم أو يحل حزمة tarball مرشحة واحدة ويرفع `release-package-under-test` للفحوصات اللاحقة المواجهة للحزم.<br />**إعادة التشغيل:** مجموعة الحزمة أو عبر أنظمة التشغيل أو live/E2E المتأثرة.                                                                                                           |
| دخان التثبيت       | **المهمة:** `Run install smoke`<br />**مسار العمل الداعم:** `Install Smoke`<br />**الاختبارات:** مسار التثبيت الكامل مع إعادة استخدام صورة دخان Dockerfile الجذرية، وتثبيت حزمة QR، ودخان Docker للجذر وGateway، واختبارات Docker للمثبت، ودخان مزود صور التثبيت العام عبر Bun، وتثبيت/إلغاء تثبيت E2E سريع لـ Plugin المضمنة.<br />**إعادة التشغيل:** `rerun_group=install-smoke`.                              |
| عبر أنظمة التشغيل            | **المهمة:** `cross_os_release_checks`<br />**مسار العمل الداعم:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**الاختبارات:** مسارات جديدة وترقية على Linux وWindows وmacOS للمزود والوضع المحددين، باستخدام حزمة tarball المرشحة بالإضافة إلى حزمة خط أساس.<br />**إعادة التشغيل:** `rerun_group=cross-os`.                                                                               |
| Repo وlive E2E   | **المهمة:** `Run repo/live E2E validation`<br />**مسار العمل الداعم:** `OpenClaw Live And E2E Checks (Reusable)`<br />**الاختبارات:** E2E للمستودع، وذاكرة التخزين المؤقت live، وتدفق OpenAI websocket، ومزود live الأصلي وشظايا Plugin، وتجهيزات النموذج/الخلفية/Gateway المباشرة المدعومة بـDocker والمحددة بواسطة `release_profile`.<br />**إعادة التشغيل:** `rerun_group=live-e2e`، اختياريًا مع `live_suite_filter`. |
| مسار إصدار Docker | **المهمة:** `Run Docker release-path validation`<br />**مسار العمل الداعم:** `OpenClaw Live And E2E Checks (Reusable)`<br />**الاختبارات:** أجزاء Docker لمسار الإصدار مقابل أثر الحزمة المشترك.<br />**إعادة التشغيل:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **المهمة:** `Run package acceptance`<br />**مسار العمل الداعم:** `Package Acceptance`<br />**الاختبارات:** تجهيزات حزمة Plugin دون اتصال، وتحديث Plugin، وقبول حزمة Telegram مع OpenAI وهمي، وفحوصات الناجين من الترقية المنشورة من كل إصدار npm مستقر عند أو بعد `2026.4.23` مقابل حزمة tarball نفسها.<br />**إعادة التشغيل:** `rerun_group=package`.                                         |
| تكافؤ QA           | **المهمة:** `Run QA Lab parity lane` و`Run QA Lab parity report`<br />**مسار العمل الداعم:** مهام مباشرة<br />**الاختبارات:** حزم تكافؤ عاملية للمرشح وخط الأساس، ثم تقرير التكافؤ.<br />**إعادة التشغيل:** `rerun_group=qa-parity` أو `rerun_group=qa`.                                                                                                                                       |
| QA live Matrix      | **المهمة:** `Run QA Lab live Matrix lane`<br />**مسار العمل الداعم:** مهمة مباشرة<br />**الاختبارات:** ملف QA سريع لـ live Matrix في بيئة `qa-live-shared`.<br />**إعادة التشغيل:** `rerun_group=qa-live` أو `rerun_group=qa`.                                                                                                                                                                        |
| QA live Telegram    | **المهمة:** `Run QA Lab live Telegram lane`<br />**مسار العمل الداعم:** مهمة مباشرة<br />**الاختبارات:** QA مباشر لـTelegram مع إيجارات بيانات اعتماد Convex CI.<br />**إعادة التشغيل:** `rerun_group=qa-live` أو `rerun_group=qa`.                                                                                                                                                                                    |
| متحقق الإصدار    | **المهمة:** `Verify release checks`<br />**مسار العمل الداعم:** لا يوجد<br />**الاختبارات:** مهام فحوصات الإصدار المطلوبة لمجموعة إعادة التشغيل المحددة.<br />**إعادة التشغيل:** أعد التشغيل بعد نجاح المهام الفرعية المركزة.                                                                                                                                                                                                 |

## أجزاء مسار إصدار Docker

تشغّل مرحلة مسار إصدار Docker هذه الأجزاء عندما يكون `live_suite_filter` فارغًا:

| الجزء                                                           | التغطية                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | مسارات دخان مسار إصدار Docker الأساسية.                                   |
| `package-update-openai`                                         | سلوك تثبيت وتحديث حزمة OpenAI.                             |
| `package-update-anthropic`                                      | سلوك تثبيت وتحديث حزمة Anthropic.                          |
| `package-update-core`                                           | سلوك الحزمة والتحديث المحايد للمزود.                           |
| `plugins-runtime-plugins`                                       | مسارات وقت تشغيل Plugin التي تمارس سلوك Plugin.                     |
| `plugins-runtime-services`                                      | مسارات وقت تشغيل Plugin المدعومة بخدمة؛ تتضمن OpenWebUI عند طلبه. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | دفعات تثبيت/وقت تشغيل Plugin مقسمة للتحقق المتوازي من الإصدار.   |

استخدم `docker_lanes=<lane[,lane]>` مستهدفًا في سير عمل live/E2E القابل لإعادة الاستخدام عندما
يفشل مسار Docker واحد فقط. تتضمن مخرجات الإصدار أوامر إعادة تشغيل لكل مسار
مع مُدخلات إعادة استخدام أرتيفاكت الحزمة والصورة عند توفرها.

## ملفات تعريف الإصدار

يتحكم `release_profile` غالبًا في اتساع live/provider داخل فحوصات الإصدار.
ولا يزيل CI الكامل العادي، أو Plugin Prerelease، أو install smoke، أو package
acceptance، أو QA Lab، أو أجزاء مسار إصدار Docker. يجعل `full` أيضًا
التشغيل الشامل يشغل Telegram E2E للحزمة مقابل أرتيفاكت حزمة الإصدار الأصلية عندما
تكون `rerun_group=all`، بحيث لا يتخطى مرشح ما قبل النشر الكامل مسار
حزمة Telegram بصمت.

| الملف التعريفي | الاستخدام المقصود                | تغطية live/provider المضمنة                                                                                                                                          |
| -------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum`      | أسرع smoke حرج للإصدار.          | مسار OpenAI/core live، ونماذج Docker live لـ OpenAI، وGateway الأساسي الأصلي، وملف تعريف Gateway الأصلي لـ OpenAI، وPlugin الأصلي لـ OpenAI، وDocker live gateway OpenAI. |
| `stable`       | ملف تعريف اعتماد الإصدار الافتراضي. | `minimum` إضافة إلى Anthropic smoke، وGoogle، وMiniMax، والواجهة الخلفية، وحزمة اختبار native live، وواجهة Docker live CLI الخلفية، وربط Docker ACP، وحزمة Docker Codex، وجزء smoke من OpenCode Go. |
| `full`         | فحص استشاري واسع.                | `stable` إضافة إلى المزوّدين الاستشاريين، وأجزاء plugin live، وأجزاء media live.                                                                                      |

## إضافات `full` فقط

يتم تخطي هذه الحزم بواسطة `stable` وتضمينها بواسطة `full`:

| المجال                           | تغطية `full` فقط                                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| نماذج Docker live                | OpenCode Go، وOpenRouter، وxAI، وZ.ai، وFireworks.                                                                          |
| Docker live gateway              | المزوّدون الاستشاريون مقسّمون إلى أجزاء DeepSeek/Fireworks، وOpenCode Go/OpenRouter، وxAI/Z.ai.                             |
| ملفات تعريف مزوّدي Gateway الأصلي | أجزاء Anthropic Opus الكاملة وSonnet/Haiku، وFireworks، وDeepSeek، وأجزاء نماذج OpenCode Go الكاملة، وOpenRouter، وxAI، وZ.ai. |
| أجزاء Native plugin live         | Plugins A-K، وL-N، وO-Z الأخرى، وMoonshot، وxAI.                                                                            |
| أجزاء Native media live          | Audio، وموسيقى Google، وموسيقى MiniMax، ومجموعات الفيديو A-D.                                                               |

يتضمن `stable` كلًا من `native-live-src-gateway-profiles-anthropic-smoke` و
`native-live-src-gateway-profiles-opencode-go-smoke`؛ ويستخدم `full` أجزاء
نماذج Anthropic وOpenCode Go الأوسع بدلًا من ذلك. ما زالت عمليات إعادة التشغيل المركزة تستطيع استخدام
مقابض التجميع `native-live-src-gateway-profiles-anthropic` أو
`native-live-src-gateway-profiles-opencode-go`.

## عمليات إعادة التشغيل المركزة

استخدم `rerun_group` لتجنب تكرار صناديق إصدار غير مرتبطة:

| المقبض             | النطاق                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `all`              | جميع مراحل Full Release Validation.                                   |
| `ci`               | ابن CI الكامل اليدوي فقط.                                             |
| `plugin-prerelease` | ابن Plugin Prerelease فقط.                                            |
| `release-checks`   | جميع مراحل OpenClaw Release Checks.                                   |
| `install-smoke`    | Install Smoke عبر فحوصات الإصدار.                                     |
| `cross-os`         | فحوصات إصدار Cross-OS.                                                |
| `live-e2e`         | تحقق Repo/live E2E ومسار إصدار Docker.                                |
| `package`          | Package Acceptance.                                                   |
| `qa`               | تكافؤ QA إضافة إلى مسارات QA live.                                    |
| `qa-parity`        | مسارات تكافؤ QA والتقرير فقط.                                         |
| `qa-live`          | QA live Matrix وTelegram فقط.                                         |
| `npm-telegram`     | Telegram E2E للحزمة المنشورة؛ يتطلب `npm_telegram_package_spec`.       |

استخدم `live_suite_filter` مع `rerun_group=live-e2e` عندما تفشل حزمة live واحدة.
تُعرّف معرفات المرشح الصالحة في سير عمل live/E2E القابل لإعادة الاستخدام، بما في ذلك
`docker-live-models`، و`live-gateway-docker`،
و`live-gateway-anthropic-docker`، و`live-gateway-google-docker`،
و`live-gateway-minimax-docker`، و`live-gateway-advisory-docker`،
و`live-cli-backend-docker`، و`live-acp-bind-docker`، و
`live-codex-harness-docker`.

مقبض `live-gateway-advisory-docker` هو مقبض إعادة تشغيل تجميعي لأجزاء
المزوّدين الثلاثة الخاصة به، لذلك ما زال يتوسع إلى جميع مهام Docker Gateway الاستشارية.

## الأدلة التي يجب الاحتفاظ بها

احتفظ بملخص `Full Release Validation` كفهرس على مستوى الإصدار. فهو يربط
معرّفات التشغيل الأبناء ويتضمن جداول أبطأ المهام. عند حدوث إخفاقات، افحص سير العمل
الابن أولًا، ثم أعد تشغيل أصغر مقبض مطابق أعلاه.

أرتيفاكتات مفيدة:

- `release-package-under-test` من أصل Full Release Validation و`OpenClaw Release Checks`
- أرتيفاكتات مسار إصدار Docker ضمن `.artifacts/docker-tests/`
- `package-under-test` من Package Acceptance وأرتيفاكتات قبول Docker
- أرتيفاكتات فحص إصدار Cross-OS لكل نظام تشغيل وحزمة
- أرتيفاكتات تكافؤ QA، وMatrix، وTelegram

## ملفات سير العمل

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
