---
read_when:
    - تشغيل التحقق الكامل من الإصدار أو إعادة تشغيله
    - مقارنة ملفات تعريف التحقق من الإصدارات المستقرة والكاملة
    - فشل مراحل التحقق من إصدار التصحيح
summary: مراحل التحقق الكامل من الإصدار، وسير العمل الفرعية، وملفات تعريف الإصدار، ومعرّفات إعادة التشغيل، والأدلة
title: التحقق الكامل من الإصدار
x-i18n:
    generated_at: "2026-06-27T18:30:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 791930254e3cac7da101d809cfc9b56773225159574d3727189f67cf85bd3fce
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` هو مظلة الإصدار. إنه نقطة الدخول اليدوية الوحيدة
لإثبات ما قبل الإصدار، لكن معظم العمل يحدث في سير عمل فرعية بحيث يمكن إعادة
تشغيل صندوق فاشل دون إعادة بدء الإصدار كله.

شغّله من مرجع سير عمل موثوق، عادةً `main`، ومرّر فرع الإصدار
أو الوسم أو SHA الكامل للالتزام باعتباره `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

تستخدم سير العمل الفرعية مرجع سير العمل الموثوق للحزمة الاختبارية، وتستخدم
`ref` المُدخل للمرشح قيد الاختبار. يتيح ذلك توفر منطق التحقق الجديد
عند التحقق من فرع إصدار أو وسم أقدم.

يشغّل `release_profile=stable` و`release_profile=full` دائمًا اختبار التحمل
الحي/Docker الشامل. مرّر `run_release_soak=true` لتضمين مسارات التحمل نفسها
مع ملف تعريف البيتا. يرفض النشر المستقر بيان تحقق لا يحتوي على هذا
التحمل ودليل أداء المنتج الحاجب.

يبني قبول الحزمة عادةً أرشيف tarball للمرشح من
`ref` المحلول، بما في ذلك تشغيلات SHA الكامل المرسلة باستخدام `pnpm ci:full-release`. بعد
نشر بيتا، مرّر `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` لإعادة استخدام
حزمة npm المنشورة عبر فحوصات الإصدار، وقبول الحزمة، والأنظمة المتعددة،
وDocker لمسار الإصدار، وحزمة Telegram. استخدم `package_acceptance_package_spec`
فقط عندما يجب أن يثبت قبول الحزمة عمدًا حزمة مختلفة.
يتبع مسار حزمة Codex Plugin الحي الحالة نفسها: قيم
`release_package_spec` المنشورة تشتق `codex_plugin_spec=npm:@openclaw/codex@<version>`؛
وتشغيلات SHA/الأثرية تحزم `extensions/codex` من المرجع المحدد؛ ويمكن للمشغلين
تعيين `codex_plugin_spec` مباشرةً لمصادر Plugin من نوع
`npm:` أو `npm-pack:` أو `git:`. يمنح المسار موافقة تثبيت Codex CLI الصريحة المطلوبة من
ذلك Plugin، ثم يشغّل فحص Codex CLI التمهيدي ودورات وكيل OpenAI في الجلسة نفسها.

## المراحل العليا

| المرحلة                | التفاصيل                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| حل الهدف    | **المهمة:** `Resolve target ref`<br />**سير العمل الفرعي:** لا يوجد<br />**يثبت:** يحل فرع الإصدار أو الوسم أو SHA الكامل للالتزام ويسجل المُدخلات المحددة.<br />**إعادة التشغيل:** أعد تشغيل المظلة إذا فشل هذا.                                                                                                                                                                                                                                             |
| Vitest وCI العادي | **المهمة:** `Run normal full CI`<br />**سير العمل الفرعي:** `CI`<br />**يثبت:** مخطط CI كامل يدوي مقابل المرجع الهدف، بما في ذلك مسارات Linux Node، وشظايا Plugin المضمّنة، وشظايا عقود Plugin والقنوات، وتوافق Node 22، و`check-*`، و`check-additional-*`، وفحوصات smoke للأثرية المبنية، وفحوصات المستندات، وPython skills، وWindows، وmacOS، وتدويل Control UI، وAndroid عبر المظلة.<br />**إعادة التشغيل:** `rerun_group=ci`.                           |
| ما قبل إصدار Plugin    | **المهمة:** `Run plugin prerelease validation`<br />**سير العمل الفرعي:** `Plugin Prerelease`<br />**يثبت:** فحوصات Plugin الثابتة الخاصة بالإصدار، وتغطية Plugin الوكيلة، وشظايا دفعات الامتدادات الكاملة، ومسارات Docker لما قبل إصدار Plugin، وأثرية `plugin-inspector-advisory` غير حاجبة لفرز التوافق.<br />**إعادة التشغيل:** `rerun_group=plugin-prerelease`.                                                                                        |
| فحوصات الإصدار       | **المهمة:** `Run release/live/Docker/QA validation`<br />**سير العمل الفرعي:** `OpenClaw Release Checks`<br />**يثبت:** smoke للتثبيت، وفحوصات الحزمة عبر الأنظمة، وقبول الحزمة، وتكافؤ QA Lab، وMatrix الحية، وTelegram الحي. تشغّل ملفات التعريف المستقرة والكاملة أيضًا مجموعات live/E2E الشاملة وأجزاء Docker لمسار الإصدار؛ ويمكن للبيتا الاشتراك باستخدام `run_release_soak=true`.<br />**إعادة التشغيل:** `rerun_group=release-checks` أو معالج release-checks أضيق. |
| حزمة Telegram     | **المهمة:** `Run package Telegram E2E`<br />**سير العمل الفرعي:** `NPM Telegram Beta E2E`<br />**يثبت:** E2E مركزًا لحزمة Telegram المنشورة عند تعيين `release_package_spec` أو `npm_telegram_package_spec`. يستخدم تحقق المرشح الكامل E2E القانوني لقبول حزمة Telegram بدلًا من ذلك.<br />**إعادة التشغيل:** `rerun_group=npm-telegram` مع `release_package_spec` أو `npm_telegram_package_spec`.                                               |
| مدقق المظلة    | **المهمة:** `Verify full validation`<br />**سير العمل الفرعي:** لا يوجد<br />**يثبت:** يعيد فحص نتائج تشغيلات الطفل المسجلة ويضيف جداول أبطأ المهام من سير العمل الفرعية.<br />**إعادة التشغيل:** أعد تشغيل هذه المهمة فقط بعد إعادة تشغيل طفل فاشل حتى يصبح أخضر.                                                                                                                                                                                                  |

بالنسبة إلى `ref=main` و`rerun_group=all`، تحل مظلة أحدث محل مظلة أقدم.
عند إلغاء الأصل، يلغي مراقبه أي سير عمل فرعي كان قد أرسله بالفعل.
لا تلغي تشغيلات التحقق من فرع الإصدار والوسم بعضها بعضًا
افتراضيًا.

## مراحل فحوصات الإصدار

`OpenClaw Release Checks` هو أكبر سير عمل فرعي. يحل الهدف
مرة واحدة ويحضّر أثرية `release-package-under-test` مشتركة عندما تحتاج إليها مراحل
الحزمة أو المراحل المواجهة لـ Docker.

| المرحلة               | التفاصيل                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| هدف الإصدار      | **المهمة:** `Resolve target ref`<br />**سير العمل الداعم:** لا يوجد<br />**الاختبارات:** المرجع المحدد، وSHA المتوقع الاختياري، والملف التعريفي، ومجموعة إعادة التشغيل، ومرشح مجموعة الاختبارات الحية المركزة.<br />**إعادة التشغيل:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                              |
| قطعة الحزمة    | **المهمة:** `Prepare release package artifact`<br />**سير العمل الداعم:** لا يوجد<br />**الاختبارات:** يحزم أو يحل كرة tar مرشحة واحدة ويرفع `release-package-under-test` لفحوصات الحزمة اللاحقة.<br />**إعادة التشغيل:** مجموعة الحزمة أو الأنظمة المتعددة أو live/E2E المتأثرة.                                                                                                                                                                                                              |
| اختبار تثبيت سريع       | **المهمة:** `Run install smoke`<br />**سير العمل الداعم:** `Install Smoke`<br />**الاختبارات:** مسار التثبيت الكامل مع إعادة استخدام صورة اختبار Docker السريع من Dockerfile الجذري، وتثبيت حزمة QR، واختبارات Docker السريعة للجذر وGateway، واختبارات Docker للمثبت، واختبار تثبيت Bun العام السريع لموفر الصور، واختبار E2E سريع لتثبيت/إزالة تثبيت Plugin المضمن.<br />**إعادة التشغيل:** `rerun_group=install-smoke`.                                                                                                                                 |
| الأنظمة المتعددة            | **المهمة:** `cross_os_release_checks`<br />**سير العمل الداعم:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**الاختبارات:** مسارات جديدة ومسارات ترقية على Linux وWindows وmacOS للموفر والوضع المحددين، باستخدام كرة tar المرشحة وحزمة أساس.<br />**إعادة التشغيل:** `rerun_group=cross-os`.                                                                                                                                                                                  |
| المستودع وlive E2E   | **المهمة:** `Run repo/live E2E validation`<br />**سير العمل الداعم:** `OpenClaw Live And E2E Checks (Reusable)`<br />**الاختبارات:** E2E للمستودع، وذاكرة التخزين المؤقت الحية، وبث OpenAI websocket، وشرائح الموفر الحي الأصلي وPlugin، وأدوات اختبار النموذج/الخلفية/Gateway الحية المدعومة بـ Docker التي يحددها `release_profile`.<br />**التشغيل:** `run_release_soak=true`، أو `release_profile=full`، أو `rerun_group=live-e2e` مركز.<br />**إعادة التشغيل:** `rerun_group=live-e2e`، اختياريًا مع `live_suite_filter`. |
| مسار إصدار Docker | **المهمة:** `Run Docker release-path validation`<br />**سير العمل الداعم:** `OpenClaw Live And E2E Checks (Reusable)`<br />**الاختبارات:** أجزاء Docker لمسار الإصدار مقابل قطعة الحزمة المشتركة.<br />**التشغيل:** `run_release_soak=true`، أو `release_profile=full`، أو `rerun_group=live-e2e` مركز.<br />**إعادة التشغيل:** `rerun_group=live-e2e`.                                                                                                                                                      |
| قبول الحزمة  | **المهمة:** `Run package acceptance`<br />**سير العمل الداعم:** `Package Acceptance`<br />**الاختبارات:** تجهيزات حزم Plugin غير المتصلة، وتحديث Plugin، وE2E لحزمة Telegram القياسية مع mock-OpenAI، وفحوصات نجاة الترقية المنشورة مقابل كرة tar نفسها. تستخدم فحوصات الإصدار الحاجبة أساس أحدث إصدار منشور افتراضي؛ وتتوسع فحوصات النقع لتشمل كل إصدار npm مستقر عند `2026.4.23` أو بعده، إضافة إلى تجهيزات المشكلات المبلغ عنها.<br />**إعادة التشغيل:** `rerun_group=package`.                   |
| تكافؤ QA           | **المهمة:** `Run QA Lab parity lane` و`Run QA Lab parity report`<br />**سير العمل الداعم:** مهام مباشرة<br />**الاختبارات:** حزم تكافؤ وكيلية للمرشح والأساس، ثم تقرير التكافؤ.<br />**إعادة التشغيل:** `rerun_group=qa-parity` أو `rerun_group=qa`.                                                                                                                                                                                                                                          |
| مصفوفة QA الحية      | **المهمة:** `Run QA Lab live Matrix lane`<br />**سير العمل الداعم:** مهمة مباشرة<br />**الاختبارات:** ملف QA تعريفي حي وسريع لـ Matrix في بيئة `qa-live-shared`.<br />**إعادة التشغيل:** `rerun_group=qa-live` أو `rerun_group=qa`.                                                                                                                                                                                                                                                                           |
| QA الحية لـ Telegram    | **المهمة:** `Run QA Lab live Telegram lane`<br />**سير العمل الداعم:** مهمة مباشرة<br />**الاختبارات:** QA حية لـ Telegram مع عقود تأجير بيانات اعتماد Convex CI.<br />**إعادة التشغيل:** `rerun_group=qa-live` أو `rerun_group=qa`.                                                                                                                                                                                                                                                                                       |
| مدقق الإصدار    | **المهمة:** `Verify release checks`<br />**سير العمل الداعم:** لا يوجد<br />**الاختبارات:** مهام فحص الإصدار المطلوبة لمجموعة إعادة التشغيل المحددة.<br />**إعادة التشغيل:** أعد التشغيل بعد نجاح المهام الفرعية المركزة.                                                                                                                                                                                                                                                                                                    |

## أجزاء مسار إصدار Docker

تشغل مرحلة مسار إصدار Docker هذه الأجزاء عندما يكون `live_suite_filter`
فارغًا:

| الجزء                                                           | التغطية                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | مسارات اختبار Docker السريع لمسار إصدار Core.                                                                                      |
| `package-update-openai`                                         | سلوك تثبيت/تحديث حزمة OpenAI، وتثبيت Codex عند الطلب، ودورات Codex Plugin الحية، واستدعاءات أدوات Chat Completions. |
| `package-update-anthropic`                                      | سلوك تثبيت وتحديث حزمة Anthropic.                                                                             |
| `package-update-core`                                           | سلوك الحزمة والتحديث المحايد للموفر.                                                                              |
| `plugins-runtime-plugins`                                       | مسارات وقت تشغيل Plugin التي تمرن سلوك Plugin.                                                                        |
| `plugins-runtime-services`                                      | مسارات وقت تشغيل Plugin المدعومة بالخدمات والحية؛ تتضمن OpenWebUI عند طلبها.                                           |
| `plugins-runtime-install-a` حتى `plugins-runtime-install-h` | دفعات تثبيت/وقت تشغيل Plugin مقسمة للتحقق المتوازي من الإصدار.                                                      |

استخدم `docker_lanes=<lane[,lane]>` الموجه في سير العمل القابل لإعادة الاستخدام live/E2E عندما
يفشل مسار Docker واحد فقط. تتضمن قطع الإصدار أوامر إعادة تشغيل لكل مسار
مع مدخلات قطعة الحزمة وإعادة استخدام الصورة عند توفرها.

## ملفات الإصدار التعريفية

يتحكم `release_profile` في الغالب في اتساع النطاق الحي/الموفر داخل فحوصات الإصدار.
ولا يزيل CI الكامل العادي، أو Plugin Prerelease، أو اختبار التثبيت السريع، أو قبول الحزمة،
أو QA Lab. تشغل الملفات التعريفية المستقرة والكاملة دائمًا تغطية نقع شاملة لـ E2E المستودع/live
ومسار إصدار Docker. يمكن لملف beta التعريفي الاشتراك باستخدام
`run_release_soak=true`. يوفر قبول الحزمة
E2E القياسي لحزمة Telegram لكل مرشح كامل، لذلك لا تكرر المظلة ذلك
المستطلع الحي.

| الملف التعريفي   | الاستخدام المقصود                      | تغطية live/الموفر المضمنة                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | أسرع اختبار سريع حرج للإصدار.   | مسار OpenAI/core الحي، ونماذج Docker الحية لـ OpenAI، وGateway core الأصلي، وملف Gateway التعريفي الأصلي لـ OpenAI، وOpenAI Plugin الأصلي، وDocker live gateway OpenAI.                     |
| `stable`  | ملف الاعتماد الافتراضي للإصدار. | `minimum` إضافة إلى اختبار Anthropic السريع، وGoogle، وMiniMax، والخلفية، وأداة اختبار live الأصلية، وخلفية Docker live CLI، وربط Docker ACP، وأداة اختبار Docker Codex، وشريحة اختبار OpenCode Go سريع. |
| `full`    | مسح استشاري واسع.             | `stable` إضافة إلى الموفرين الاستشاريين، وشرائح Plugin الحية، وشرائح الوسائط الحية.                                                                                                        |

## الإضافات المخصصة لـ full فقط

تتخطى `stable` هذه المجموعات وتدرجها `full`:

| المنطقة                             | تغطية full فقط                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| نماذج Docker الحية               | OpenCode Go، وOpenRouter، وxAI، وZ.ai، وFireworks.                                                                          |
| Docker live gateway              | الموفرون الاستشاريون مقسمون إلى شرائح DeepSeek/Fireworks، وOpenCode Go/OpenRouter، وxAI/Z.ai.                              |
| ملفات موفر Gateway الأصلي التعريفية | شرائح Anthropic Opus وSonnet/Haiku الكاملة، وFireworks، وDeepSeek، وشرائح نماذج OpenCode Go الكاملة، وOpenRouter، وxAI، وZ.ai. |
| شرائح Plugin الأصلية الحية        | Plugins A-K، وL-N، وO-Z أخرى، وMoonshot، وxAI.                                                                             |
| شرائح الوسائط الأصلية الحية         | الصوت، وموسيقى Google، وموسيقى MiniMax، ومجموعات الفيديو A-D.                                                                   |

تتضمن `stable` كلا من `native-live-src-gateway-profiles-anthropic-smoke` و
`native-live-src-gateway-profiles-opencode-go-smoke`؛ وتستخدم `full` شرائح نماذج
Anthropic وOpenCode Go الأوسع بدلًا من ذلك. لا يزال بإمكان عمليات إعادة التشغيل المركزة استخدام مقابض
`native-live-src-gateway-profiles-anthropic` أو
`native-live-src-gateway-profiles-opencode-go` المجمعة.

## عمليات إعادة التشغيل المركزة

استخدم `rerun_group` لتجنب تكرار مربعات إصدار غير ذات صلة:

| المعالج              | النطاق                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | كل مراحل التحقق الكامل من الإصدار.                                                             |
| `ci`                | فرع CI الكامل اليدوي فقط.                                                                      |
| `plugin-prerelease` | فرع ما قبل إصدار Plugin فقط.                                                                   |
| `release-checks`    | كل مراحل فحوصات إصدار OpenClaw.                                                             |
| `install-smoke`     | Install Smoke عبر فحوصات الإصدار.                                                           |
| `cross-os`          | فحوصات الإصدار عبر أنظمة التشغيل.                                                                        |
| `live-e2e`          | تحقق E2E للمستودع/المباشر ومسار إصدار Docker.                                               |
| `package`           | قبول الحزمة.                                                                             |
| `qa`                | تكافؤ QA إضافة إلى مسارات QA المباشرة.                                                                   |
| `qa-parity`         | مسارات تكافؤ QA والتقرير فقط.                                                                |
| `qa-live`           | Matrix/Telegram المباشران لـ QA إضافة إلى مسارات Discord وWhatsApp وSlack المقيّدة عند تمكينها.             |
| `npm-telegram`      | E2E لـ Telegram للحزمة المنشورة؛ يتطلب `release_package_spec` أو `npm_telegram_package_spec`. |

استخدم `live_suite_filter` مع `rerun_group=live-e2e` عندما تفشل حزمة مباشرة واحدة.
تُعرَّف معرّفات المرشحات الصالحة في سير عمل live/E2E القابل لإعادة الاستخدام، بما في ذلك
`docker-live-models` و`live-gateway-docker` و
`live-gateway-anthropic-docker` و`live-gateway-google-docker` و
`live-gateway-minimax-docker` و`live-gateway-advisory-docker` و
`live-cli-backend-docker` و`live-acp-bind-docker` و
`live-codex-harness-docker`.

معالج `live-gateway-advisory-docker` هو معالج إعادة تشغيل تجميعي لأجزائه
الثلاثة الخاصة بالمزوّدين، لذلك لا يزال يتفرع إلى كل مهام Gateway الاستشارية في Docker.

استخدم `cross_os_suite_filter` مع `rerun_group=cross-os` عندما يفشل مسار واحد عبر أنظمة التشغيل.
يقبل المرشح معرّف نظام تشغيل، أو معرّف حزمة، أو زوج نظام تشغيل/حزمة، مثل
`windows/packaged-upgrade` أو `windows` أو `packaged-fresh`. تتضمن ملخصات Cross-OS
توقيتات لكل مرحلة لمسارات الترقية المعبأة، وتطبع الأوامر طويلة التشغيل أسطر Heartbeat
حتى يكون تحديث Windows العالق مرئيًا قبل انتهاء مهلة المهمة.

تمنع إخفاقات فحوصات إصدار QA التحقق العادي من الإصدار. كما يمنع الانحراف المطلوب
في أدوات OpenClaw الديناميكية ضمن المستوى القياسي محقق فحوصات الإصدار.
قد تظل تشغيلات Tideclaw alpha تتعامل مع مسارات فحوصات الإصدار غير المتعلقة بسلامة الحزمة
كاستشارية. عندما يطلب `live_suite_filter` صراحة مسار QA مباشرًا مقيّدًا مثل
Discord أو WhatsApp أو Slack، يجب تمكين متغير المستودع المطابق
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED`؛ وإلا يفشل التقاط الإدخال بدلًا من
تخطي المسار بصمت. أعد تشغيل `rerun_group=qa` أو
`qa-parity` أو `qa-live` عندما تحتاج إلى أدلة QA حديثة.

## الأدلة التي يجب الاحتفاظ بها

احتفظ بملخص `Full Release Validation` كفهرس على مستوى الإصدار. فهو يربط
معرّفات التشغيل الفرعية ويتضمن جداول أبطأ المهام. عند حدوث إخفاقات، افحص سير العمل
الفرعي أولًا، ثم أعد تشغيل أصغر معالج مطابق أعلاه.

القطع الأثرية المفيدة:

- `release-package-under-test` من `OpenClaw Release Checks`
- قطع أثرية لمسار إصدار Docker تحت `.artifacts/docker-tests/`
- `package-under-test` لقبول الحزمة وقطع أثرية لقبول Docker
- قطع أثرية لفحوصات الإصدار عبر أنظمة التشغيل لكل نظام تشغيل وحزمة
- قطع أثرية لتكافؤ QA وMatrix وTelegram

## ملفات سير العمل

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
