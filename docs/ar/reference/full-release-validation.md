---
read_when:
    - تشغيل التحقق الكامل من الإصدار أو إعادة تشغيله
    - مقارنة ملفات تعريف التحقق من الإصدار المستقر والكامل
    - استكشاف أخطاء إخفاقات مراحل التحقق من صحة الإصدار وإصلاحها
summary: مراحل التحقق الكامل من الإصدار، وسير العمل الفرعية، وملفات تعريف الإصدار، ومراجع إعادة التشغيل، والأدلة
title: التحقق الكامل من الإصدار
x-i18n:
    generated_at: "2026-05-05T01:51:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cf696761f516fc7f8e9606a2a06fab61a644731330eb484a388f276767a9e0d
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` هي المظلة الخاصة بالإصدار. وهي نقطة الدخول اليدوية الوحيدة لإثبات ما قبل الإصدار، لكن معظم العمل يحدث في سير عمل فرعية بحيث يمكن إعادة تشغيل الصندوق الفاشل دون إعادة بدء الإصدار بالكامل.

شغّلها من مرجع سير عمل موثوق، عادةً `main`، ومرّر فرع الإصدار أو الوسم أو SHA الكامل للالتزام كـ `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

تستخدم سير العمل الفرعية مرجع سير العمل الموثوق لحزمة الاختبار، وتستخدم قيمة الإدخال `ref` للمرشح قيد الاختبار. يتيح ذلك توفر منطق التحقق الجديد عند التحقق من فرع إصدار أو وسم أقدم.

افتراضيًا، يشغّل `release_profile=stable` المسارات الحاجبة للإصدار ويتخطى اختبار التحمل الحي/Docker الشامل. مرّر `run_release_soak=true` لتضمين مسارات التحمل في تشغيل مستقر. يفعّل `release_profile=full` دائمًا مسارات التحمل بحيث لا يفقد ملف التعريف الاستشاري الواسع التغطية بصمت.

يبني قبول الحزمة عادةً أرشيف tarball المرشح من `ref` المحلول، بما في ذلك تشغيلات SHA الكامل التي تُطلق باستخدام `pnpm ci:full-release`. بعد النشر، مرّر `package_acceptance_package_spec=openclaw@YYYY.M.D` (أو `openclaw@beta`/`openclaw@latest`) لتشغيل مصفوفة الحزمة/التحديث نفسها ضد حزمة npm المشحونة بدلًا من ذلك.

## المراحل العليا

| المرحلة             | التفاصيل                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| حل الهدف            | **المهمة:** `Resolve target ref`<br />**سير العمل الفرعي:** لا يوجد<br />**يثبت:** يحل فرع الإصدار أو الوسم أو SHA الكامل للالتزام ويسجّل المدخلات المحددة.<br />**إعادة التشغيل:** أعد تشغيل المظلة إذا فشل هذا.                                                                                                                                                                                                                                                         |
| Vitest وCI العادي    | **المهمة:** `Run normal full CI`<br />**سير العمل الفرعي:** `CI`<br />**يثبت:** مخطط CI الكامل اليدوي ضد مرجع الهدف، بما في ذلك مسارات Linux Node، وأجزاء Plugin المضمّنة، وعقود القنوات، وتوافق Node 22، و`check`، و`check-additional`، وفحص البناء السريع، وفحوصات الوثائق، وPython Skills، وWindows، وmacOS، وControl UI i18n، وAndroid عبر المظلة.<br />**إعادة التشغيل:** `rerun_group=ci`.                                       |
| ما قبل إصدار Plugin | **المهمة:** `Run plugin prerelease validation`<br />**سير العمل الفرعي:** `Plugin Prerelease`<br />**يثبت:** فحوصات Plugin الثابتة الخاصة بالإصدار، وتغطية Plugin الوكيلية، وأجزاء دفعات الامتدادات الكاملة، ومسارات Docker لما قبل إصدار Plugin.<br />**إعادة التشغيل:** `rerun_group=plugin-prerelease`.                                                                                                                                                                 |
| فحوصات الإصدار      | **المهمة:** `Run release/live/Docker/QA validation`<br />**سير العمل الفرعي:** `OpenClaw Release Checks`<br />**يثبت:** فحص التثبيت السريع، وفحوصات الحزم عبر أنظمة التشغيل، وقبول الحزمة، وتكافؤ QA Lab، وMatrix الحي، وTelegram الحي. مع `run_release_soak=true` أو `release_profile=full`، يشغّل أيضًا مجموعات live/E2E الشاملة وأجزاء مسار إصدار Docker.<br />**إعادة التشغيل:** `rerun_group=release-checks` أو معالج release-checks أضيق. |
| أداة الحزمة          | **المهمة:** `Prepare release package artifact`<br />**سير العمل الفرعي:** لا يوجد<br />**يثبت:** ينشئ أرشيف tarball الأب `release-package-under-test` مبكرًا بما يكفي للفحوصات المواجهة للحزمة التي لا تحتاج إلى انتظار `OpenClaw Release Checks`.<br />**إعادة التشغيل:** أعد تشغيل المظلة أو وفّر `npm_telegram_package_spec` لـ `rerun_group=npm-telegram`.                                                                                                         |
| حزمة Telegram        | **المهمة:** `Run package Telegram E2E`<br />**سير العمل الفرعي:** `NPM Telegram Beta E2E`<br />**يثبت:** إثبات حزمة Telegram المدعوم بأداة الأب لـ `rerun_group=all` مع `release_profile=full`، أو إثبات Telegram للحزمة المنشورة عند تعيين `npm_telegram_package_spec`.<br />**إعادة التشغيل:** `rerun_group=npm-telegram` مع `npm_telegram_package_spec`.                                                                                                          |
| متحقق المظلة         | **المهمة:** `Verify full validation`<br />**سير العمل الفرعي:** لا يوجد<br />**يثبت:** يعيد فحص نتائج تشغيلات سير العمل الفرعية المسجلة ويضيف جداول أبطأ المهام من سير العمل الفرعية.<br />**إعادة التشغيل:** أعد تشغيل هذه المهمة فقط بعد إعادة تشغيل سير عمل فرعي فاشل حتى يصبح أخضر.                                                                                                                                                                                 |

بالنسبة إلى `ref=main` و`rerun_group=all`، تحل مظلة أحدث محل مظلة أقدم. عند إلغاء الأب، يلغي مراقبه أي سير عمل فرعي كان قد أطلقه بالفعل. لا تلغي تشغيلات التحقق من فروع الإصدار والوسوم بعضها بعضًا افتراضيًا.

## مراحل فحوصات الإصدار

`OpenClaw Release Checks` هو أكبر سير عمل فرعي. يحل الهدف مرة واحدة ويحضّر أداة `release-package-under-test` مشتركة عندما تحتاجها المراحل المواجهة للحزمة أو Docker.

| المرحلة               | التفاصيل                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| هدف الإصدار      | **المهمة:** `Resolve target ref`<br />**سير العمل الداعم:** لا يوجد<br />**الاختبارات:** المرجع المحدد، وSHA المتوقع الاختياري، والملف التعريفي، ومجموعة إعادة التشغيل، ومرشح مجموعة الاختبارات الحية المركزة.<br />**إعادة التشغيل:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                              |
| أثر الحزمة    | **المهمة:** `Prepare release package artifact`<br />**سير العمل الداعم:** لا يوجد<br />**الاختبارات:** يحزم أو يحل كرة tar مرشحة واحدة ويرفع `release-package-under-test` لفحوصات الحزمة اللاحقة.<br />**إعادة التشغيل:** الحزمة المتأثرة، أو مجموعة أنظمة التشغيل المتعددة، أو مجموعة الحي/E2E.                                                                                                                                                                                                              |
| اختبار تثبيت سريع       | **المهمة:** `Run install smoke`<br />**سير العمل الداعم:** `Install Smoke`<br />**الاختبارات:** مسار التثبيت الكامل مع إعادة استخدام صورة اختبار Dockerfile السريع من الجذر، وتثبيت حزمة QR، واختبارات Docker السريعة للجذر وGateway، واختبارات Docker للمثبّت، واختبار سريع لموفر الصور عبر تثبيت Bun العام، وE2E سريع لتثبيت/إلغاء تثبيت Plugin المضمن.<br />**إعادة التشغيل:** `rerun_group=install-smoke`.                                                                                                                                 |
| أنظمة التشغيل المتعددة            | **المهمة:** `cross_os_release_checks`<br />**سير العمل الداعم:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**الاختبارات:** مسارات التثبيت الجديد والترقية على Linux وWindows وmacOS للموفر والوضع المحددين، باستخدام كرة tar المرشحة بالإضافة إلى حزمة أساس.<br />**إعادة التشغيل:** `rerun_group=cross-os`.                                                                                                                                                                                  |
| المستودع وE2E الحي   | **المهمة:** `Run repo/live E2E validation`<br />**سير العمل الداعم:** `OpenClaw Live And E2E Checks (Reusable)`<br />**الاختبارات:** E2E للمستودع، والذاكرة المخبأة الحية، وبث WebSocket من OpenAI، وأجزاء الموفر وPlugin الحية الأصلية، وحزم اختبار النموذج/الخلفية/Gateway الحية المدعومة من Docker والمحددة بواسطة `release_profile`.<br />**التشغيل:** `run_release_soak=true`، أو `release_profile=full`، أو `rerun_group=live-e2e` المركزة.<br />**إعادة التشغيل:** `rerun_group=live-e2e`، اختياريًا مع `live_suite_filter`. |
| مسار إصدار Docker | **المهمة:** `Run Docker release-path validation`<br />**سير العمل الداعم:** `OpenClaw Live And E2E Checks (Reusable)`<br />**الاختبارات:** أجزاء Docker لمسار الإصدار مقابل أثر الحزمة المشترك.<br />**التشغيل:** `run_release_soak=true`، أو `release_profile=full`، أو `rerun_group=live-e2e` المركزة.<br />**إعادة التشغيل:** `rerun_group=live-e2e`.                                                                                                                                                      |
| قبول الحزمة  | **المهمة:** `Run package acceptance`<br />**سير العمل الداعم:** `Package Acceptance`<br />**الاختبارات:** تجهيزات حزمة Plugin غير المتصلة، وتحديث Plugin، وقبول حزمة Telegram مع OpenAI وهمي، وفحوصات بقاء الترقية المنشورة مقابل كرة tar نفسها. تستخدم فحوصات الإصدار الحاجزة الأساس المنشور الأحدث الافتراضي؛ وتوسّع فحوصات التحمل النطاق إلى كل إصدار npm مستقر عند `2026.4.23` أو بعده بالإضافة إلى تجهيزات المشكلات المبلغ عنها.<br />**إعادة التشغيل:** `rerun_group=package`.                          |
| تكافؤ QA           | **المهمة:** `Run QA Lab parity lane` و`Run QA Lab parity report`<br />**سير العمل الداعم:** مهام مباشرة<br />**الاختبارات:** حزم تكافؤ agentic للمرشح والأساس، ثم تقرير التكافؤ.<br />**إعادة التشغيل:** `rerun_group=qa-parity` أو `rerun_group=qa`.                                                                                                                                                                                                                                          |
| Matrix حي لـQA      | **المهمة:** `Run QA Lab live Matrix lane`<br />**سير العمل الداعم:** مهمة مباشرة<br />**الاختبارات:** ملف QA تعريفي سريع حي لـMatrix في بيئة `qa-live-shared`.<br />**إعادة التشغيل:** `rerun_group=qa-live` أو `rerun_group=qa`.                                                                                                                                                                                                                                                                           |
| Telegram حي لـQA    | **المهمة:** `Run QA Lab live Telegram lane`<br />**سير العمل الداعم:** مهمة مباشرة<br />**الاختبارات:** QA حي لـTelegram مع إيجارات بيانات اعتماد Convex CI.<br />**إعادة التشغيل:** `rerun_group=qa-live` أو `rerun_group=qa`.                                                                                                                                                                                                                                                                                       |
| مدقق الإصدار    | **المهمة:** `Verify release checks`<br />**سير العمل الداعم:** لا يوجد<br />**الاختبارات:** مهام فحص الإصدار المطلوبة لمجموعة إعادة التشغيل المحددة.<br />**إعادة التشغيل:** أعد التشغيل بعد نجاح المهام الفرعية المركزة.                                                                                                                                                                                                                                                                                                    |

## أجزاء مسار إصدار Docker

تشغّل مرحلة مسار إصدار Docker هذه الأجزاء عندما يكون `live_suite_filter`
فارغًا:

| الجزء                                                           | التغطية                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | مسارات اختبار سريعة أساسية لمسار إصدار Docker.                                   |
| `package-update-openai`                                         | سلوك تثبيت حزمة OpenAI وتحديثها.                             |
| `package-update-anthropic`                                      | سلوك تثبيت حزمة Anthropic وتحديثها.                          |
| `package-update-core`                                           | سلوك الحزمة والتحديث المحايد تجاه الموفر.                           |
| `plugins-runtime-plugins`                                       | مسارات وقت تشغيل Plugin التي تختبر سلوك Plugin.                     |
| `plugins-runtime-services`                                      | مسارات وقت تشغيل Plugin المدعومة بخدمات؛ تتضمن OpenWebUI عند الطلب. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | دفعات تثبيت/وقت تشغيل Plugin مقسمة للتحقق المتوازي من الإصدار.   |

استخدم `docker_lanes=<lane[,lane]>` موجهًا على سير العمل الحي/E2E القابل لإعادة الاستخدام عندما
يفشل مسار Docker واحد فقط. تتضمن آثار الإصدار أوامر إعادة تشغيل لكل مسار
مع مدخلات أثر الحزمة وإعادة استخدام الصورة عندما تكون متاحة.

## ملفات الإصدار التعريفية

يتحكم `release_profile` غالبًا في اتساع الحي/الموفر داخل فحوصات الإصدار.
لا يزيل CI الكامل العادي، أو Plugin Prerelease، أو اختبار التثبيت السريع، أو قبول الحزمة،
أو QA Lab. بالنسبة إلى `stable`، تكون E2E الشاملة للمستودع/الحي وأجزاء
مسار إصدار Docker تغطية تحمل وتعمل عندما يكون `run_release_soak=true`.
يفرض `full` تشغيل تغطية التحمل ويجعل التشغيل الشامل أيضًا يشغّل E2E لحزمة Telegram
مقابل أثر حزمة الإصدار الأصل عندما يكون `rerun_group=all`، بحيث لا يتخطى
مرشح ما قبل النشر الكامل مسار حزمة Telegram ذلك بصمت.

| الملف التعريفي   | الاستخدام المقصود                      | تغطية الحي/الموفر المضمنة                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | أسرع اختبار سريع حاسم للإصدار.   | مسار OpenAI/أساسي حي، ونماذج Docker الحية لـOpenAI، وGateway أصلي أساسي، وملف Gateway أصلي لـOpenAI، وPlugin أصلي لـOpenAI، وGateway حي لـOpenAI عبر Docker.                     |
| `stable`  | ملف اعتماد الإصدار الافتراضي. | `minimum` بالإضافة إلى اختبار سريع لـAnthropic، وGoogle، وMiniMax، والخلفية، وحزمة اختبار حية أصلية، وخلفية CLI حية عبر Docker، وربط Docker ACP، وحزمة اختبار Docker Codex، وجزء اختبار سريع لـOpenCode Go. |
| `full`    | مسح استشاري واسع.             | `stable` بالإضافة إلى الموفرين الاستشاريين، وأجزاء Plugin الحية، وأجزاء الوسائط الحية.                                                                                                        |

## إضافات `full` فقط

تتخطى `stable` هذه المجموعات وتضمّنها `full`:

| المجال                             | تغطية `full` فقط                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| نماذج Docker الحية               | OpenCode Go، وOpenRouter، وxAI، وZ.ai، وFireworks.                                                                          |
| Gateway حي عبر Docker              | الموفرون الاستشاريون مقسمون إلى أجزاء DeepSeek/Fireworks، وOpenCode Go/OpenRouter، وxAI/Z.ai.                              |
| ملفات موفر Gateway الأصلية | أجزاء Anthropic Opus وSonnet/Haiku الكاملة، وFireworks، وDeepSeek، وأجزاء نموذج OpenCode Go الكاملة، وOpenRouter، وxAI، وZ.ai. |
| أجزاء Plugin الأصلية الحية        | Plugins A-K، وL-N، وO-Z أخرى، وMoonshot، وxAI.                                                                             |
| أجزاء الوسائط الأصلية الحية         | الصوت، وموسيقى Google، وموسيقى MiniMax، ومجموعات الفيديو A-D.                                                                   |

تتضمن `stable` كلًا من `native-live-src-gateway-profiles-anthropic-smoke` و
`native-live-src-gateway-profiles-opencode-go-smoke`؛ وتستخدم `full` أجزاء
نماذج Anthropic وOpenCode Go الأوسع بدلًا من ذلك. يمكن لعمليات إعادة التشغيل المركزة أن تظل تستخدم
معالجات `native-live-src-gateway-profiles-anthropic` أو
`native-live-src-gateway-profiles-opencode-go` التجميعية.

## إعادة التشغيل المركزة

استخدم `rerun_group` لتجنب تكرار صناديق إصدار غير ذات صلة:

| المعرّف              | النطاق                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | كل مراحل التحقق الكامل من الإصدار.                                   |
| `ci`                | فرع CI الكامل اليدوي فقط.                                            |
| `plugin-prerelease` | فرع الإصدار التجريبي المسبق للـ Plugin فقط.                                         |
| `release-checks`    | كل مراحل فحوصات إصدار OpenClaw.                                   |
| `install-smoke`     | Install Smoke عبر فحوصات الإصدار.                                 |
| `cross-os`          | فحوصات الإصدار عبر أنظمة التشغيل.                                              |
| `live-e2e`          | تحقق E2E الحي للمستودع ومسار إصدار Docker.                     |
| `package`           | قبول الحزمة.                                                   |
| `qa`                | تكافؤ QA بالإضافة إلى مسارات QA الحية.                                         |
| `qa-parity`         | مسارات تكافؤ QA والتقرير فقط.                                      |
| `qa-live`           | Matrix الحية وTelegram فقط في QA.                                     |
| `npm-telegram`      | E2E لـ Telegram للحزمة المنشورة؛ يتطلب `npm_telegram_package_spec`. |

استخدم `live_suite_filter` مع `rerun_group=live-e2e` عندما تفشل مجموعة حية واحدة.
تُعرَّف معرّفات الفلاتر الصالحة في سير عمل live/E2E القابل لإعادة الاستخدام، بما في ذلك
`docker-live-models`، و`live-gateway-docker`،
و`live-gateway-anthropic-docker`، و`live-gateway-google-docker`،
و`live-gateway-minimax-docker`، و`live-gateway-advisory-docker`،
و`live-cli-backend-docker`، و`live-acp-bind-docker`، و
`live-codex-harness-docker`.

المعرّف `live-gateway-advisory-docker` هو معرّف إعادة تشغيل تجميعي للأجزاء الثلاثة
الخاصة بالموفّرين، لذلك لا يزال يتفرع إلى كل مهام Gateway الاستشارية في Docker.

استخدم `cross_os_suite_filter` مع `rerun_group=cross-os` عندما يفشل مسار واحد
عبر أنظمة التشغيل. يقبل الفلتر معرّف نظام تشغيل أو معرّف مجموعة أو زوج نظام تشغيل/مجموعة، مثل
`windows/packaged-upgrade` أو `windows` أو `packaged-fresh`. تتضمن ملخصات أنظمة التشغيل المتعددة
توقيتات لكل مرحلة لمسارات الترقية المعبأة، وتطبع الأوامر الطويلة أسطر Heartbeat بحيث يكون تحديث Windows العالق مرئيا قبل
انتهاء مهلة المهمة.

مسارات فحوصات إصدار QA استشارية. يُبلّغ عن الفشل المحصور في QA كتحذير
ولا يحظر مدقّق فحوصات الإصدار؛ أعد تشغيل `rerun_group=qa`،
أو `qa-parity`، أو `qa-live` عندما تحتاج إلى أدلة QA جديدة.

## الأدلة التي يجب الاحتفاظ بها

احتفظ بملخص `Full Release Validation` كفهرس على مستوى الإصدار. فهو يربط
معرّفات التشغيل الفرعية ويتضمن جداول أبطأ المهام. عند حدوث إخفاقات، افحص سير العمل
الفرعي أولا، ثم أعد تشغيل أصغر معرّف مطابق أعلاه.

عناصر أثرية مفيدة:

- `release-package-under-test` من أصل Full Release Validation و`OpenClaw Release Checks`
- عناصر مسار إصدار Docker الأثرية ضمن `.artifacts/docker-tests/`
- `package-under-test` لقبول الحزمة وعناصر قبول Docker الأثرية
- عناصر فحوصات الإصدار عبر أنظمة التشغيل الأثرية لكل نظام تشغيل ومجموعة
- عناصر تكافؤ QA وMatrix وTelegram الأثرية

## ملفات سير العمل

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
