---
read_when:
    - تشغيل الاختبارات محليًا أو في CI
    - إضافة اختبارات انحدار لأخطاء النموذج/الموفّر
    - تصحيح أخطاء سلوك Gateway + الوكيل
summary: 'عدة الاختبار: مجموعات unit/e2e/live، ومشغلات Docker، وما الذي يغطيه كل اختبار'
title: الاختبار
x-i18n:
    generated_at: "2026-04-24T07:46:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c88325e0edb49437e7faa2eaf730eb3be59054d8c4bb86e56a42bc39a29a2b1
    source_path: help/testing.md
    workflow: 15
---

يمتلك OpenClaw ثلاث مجموعات Vitest ‏(unit/integration، وe2e، وlive) ومجموعة صغيرة
من مشغلات Docker. وهذا المستند هو دليل "كيف نختبر":

- ما الذي تغطيه كل مجموعة (وما الذي **لا** تغطيه عمدًا).
- الأوامر التي يجب تشغيلها لتدفقات العمل الشائعة (محليًا، وقبل push، وتصحيح الأخطاء).
- كيف تكتشف الاختبارات الحية بيانات الاعتماد وتختار النماذج/الموفّرين.
- كيف تضيف اختبارات انحدار لمشكلات النماذج/الموفّرين في العالم الحقيقي.

## البدء السريع

في معظم الأيام:

- البوابة الكاملة (متوقعة قبل push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- تشغيل أسرع للمجموعة الكاملة محليًا على جهاز واسع الموارد: `pnpm test:max`
- حلقة watch مباشرة لـ Vitest: `pnpm test:watch`
- يستهدف التوجيه المباشر للملفات الآن أيضًا مسارات extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- فضّل أولًا التشغيلات المستهدفة عندما تكون تتكرر على فشل واحد.
- موقع QA مدعوم بـ Docker: `pnpm qa:lab:up`
- مسار QA مدعوم بـ Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

عندما تلمس الاختبارات أو تريد ثقة إضافية:

- بوابة التغطية: `pnpm test:coverage`
- مجموعة E2E: ‏`pnpm test:e2e`

عند تصحيح موفّرين/نماذج حقيقية (يتطلب بيانات اعتماد حقيقية):

- المجموعة الحية (تحققات النماذج + gateway tool/image): ‏`pnpm test:live`
- استهدف ملفًا حيًا واحدًا بهدوء: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- اجتياح نماذج حي داخل Docker: `pnpm test:docker:live-models`
  - يشغّل كل نموذج محدد الآن دورًا نصيًا بالإضافة إلى probe صغير بأسلوب قراءة ملف.
    كما تشغّل النماذج التي تعلن بياناتها الوصفية عن إدخال `image` دور صورة صغيرًا.
    عطّل probes الإضافية عبر `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` أو
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` عند عزل أعطال الموفّر.
  - تغطية CI: كل من `OpenClaw Scheduled Live And E2E Checks` اليومية و
    `OpenClaw Release Checks` اليدوية تستدعيان سير العمل الحي/E2E القابل لإعادة الاستخدام مع
    `include_live_suites: true`، والذي يتضمن وظائف مستقلة ضمن مصفوفة Docker للنماذج الحية
    مجزأة حسب الموفّر.
  - لإعادات تشغيل CI المركزة، شغّل `OpenClaw Live And E2E Checks (Reusable)`
    مع `include_live_suites: true` و`live_models_only: true`.
  - أضف أسرار الموفّرين الجديدة عالية الإشارة إلى `scripts/ci-hydrate-live-auth.sh`
    بالإضافة إلى `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` ومستدعيه
    المجدولين/الخاصين بالإصدار.
- اختبار smoke أصلي لـ Codex في bound-chat: ‏`pnpm test:docker:live-codex-bind`
  - يشغّل مسارًا حيًا داخل Docker مقابل مسار Codex app-server، ويربط
    Slack DM اصطناعيًا باستخدام `/codex bind`، ويختبر `/codex fast` و
    `/codex permissions`، ثم يتحقق من أن الرد العادي ومرفق الصورة
    يمران عبر الربط الأصلي لـ Plugin بدلًا من ACP.
- اختبار smoke لتكلفة Moonshot/Kimi: مع ضبط `MOONSHOT_API_KEY`، شغّل
  `openclaw models list --provider moonshot --json`، ثم شغّل جلسة معزولة
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  مقابل `moonshot/kimi-k2.6`. تحقّق من أن JSON يبلّغ عن Moonshot/K2.6 وأن
  transcript الخاص بالمساعد يخزّن القيمة المطَبَّعة `usage.cost`.

نصيحة: عندما تحتاج فقط إلى حالة فشل واحدة، ففضّل تضييق الاختبارات الحية عبر متغيرات بيئة allowlist الموضحة أدناه.

## مشغلات خاصة بـ QA

توجد هذه الأوامر إلى جانب مجموعات الاختبار الرئيسية عندما تحتاج إلى واقعية QA-lab:

تشغّل CI معمل QA في workflows مخصصة. يعمل `Parity gate` على طلبات السحب المطابقة
ومن خلال التشغيل اليدوي مع موفّرين وهميين. ويعمل `QA-Lab - All Lanes` ليلًا على
`main` ومن خلال التشغيل اليدوي مع parity gate وهمية، ومسار Matrix حي، و
مسار Telegram حي مُدار بواسطة Convex كوظائف متوازية. ويشغّل `OpenClaw Release Checks`
المسارات نفسها قبل الموافقة على الإصدار.

- `pnpm openclaw qa suite`
  - يشغّل سيناريوهات QA المدعومة بالمستودع مباشرةً على المضيف.
  - يشغّل عدة سيناريوهات محددة بالتوازي افتراضيًا مع عمال gateway
    معزولين. ويستخدم `qa-channel` قيمة افتراضية للتوازي تبلغ 4 (مقيدة بعدد
    السيناريوهات المحددة). استخدم `--concurrency <count>` لضبط عدد العمال،
    أو `--concurrency 1` للمسار التسلسلي الأقدم.
  - يخرج بقيمة غير صفرية عندما يفشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد العناصر الناتجة من دون رمز خروج فاشل.
  - يدعم أوضاع الموفّر `live-frontier` و`mock-openai` و`aimock`.
    يقوم `aimock` بتشغيل خادم موفّر محلي مدعوم بـ AIMock من أجل تغطية
    تجريبية للـ fixture ومحاكاة البروتوكول من دون استبدال المسار `mock-openai`
    الواعي بالسيناريو.
- `pnpm openclaw qa suite --runner multipass`
  - يشغّل مجموعة QA نفسها داخل Linux VM مؤقتة باستخدام Multipass.
  - يحتفظ بسلوك اختيار السيناريو نفسه الموجود في `qa suite` على المضيف.
  - يعيد استخدام علامات اختيار الموفّر/النموذج نفسها الموجودة في `qa suite`.
  - تمرّر التشغيلات الحية مدخلات مصادقة QA المدعومة والعملية للضيف:
    مفاتيح الموفّر المعتمدة على env، ومسار إعدادات الموفّر الحي لـ QA، و`CODEX_HOME`
    عند وجوده.
  - يجب أن تبقى أدلة المخرجات تحت جذر المستودع لكي يتمكن الضيف من الكتابة مرة أخرى عبر
    مساحة العمل المركبة.
  - يكتب تقرير QA + الملخص العاديين بالإضافة إلى سجلات Multipass ضمن
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - يبدأ موقع QA المدعوم بـ Docker لأعمال QA على طريقة المشغّل.
- `pnpm test:docker:npm-onboard-channel-agent`
  - يبني npm tarball من النسخة الحالية، ويثبّته عالميًا داخل
    Docker، ويشغّل onboarding غير تفاعلي باستخدام OpenAI API key، ويضبط Telegram
    افتراضيًا، ويتحقق من أن تمكين Plugin يثبّت تبعيات وقت التشغيل عند
    الطلب، ويشغّل doctor، ويشغّل دور وكيل محلي واحد مقابل نقطة
    نهاية OpenAI وهمية.
  - استخدم `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` لتشغيل مسار
    التثبيت المعبأ نفسه مع Discord.
- `pnpm test:docker:npm-telegram-live`
  - يثبّت حزمة OpenClaw منشورة داخل Docker، ويشغّل onboarding
    لحزمة مثبّتة، ويضبط Telegram عبر CLI المثبتة، ثم يعيد استخدام
    مسار Telegram QA الحي مع تلك الحزمة المثبتة بوصفها SUT Gateway.
  - يستخدم افتراضيًا `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - يستخدم بيانات اعتماد Telegram نفسها من env أو مصدر بيانات اعتماد Convex نفسه كما في
    `pnpm openclaw qa telegram`. وبالنسبة إلى أتمتة CI/الإصدار، اضبط
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` بالإضافة إلى
    `OPENCLAW_QA_CONVEX_SITE_URL` وسر الدور. وإذا
    وُجد `OPENCLAW_QA_CONVEX_SITE_URL` وسر دور Convex في CI،
    فإن wrapper الخاص بـ Docker يختار Convex تلقائيًا.
  - يتجاوز `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` القيمة المشتركة
    `OPENCLAW_QA_CREDENTIAL_ROLE` لهذا المسار فقط.
  - تكشف GitHub Actions هذا المسار بوصفه workflow يدوية للمشرف باسم
    `NPM Telegram Beta E2E`. وهو لا يعمل عند الدمج. وتستخدم workflow البيئة
    `qa-live-shared` وعقود إيجار بيانات اعتماد CI الخاصة بـ Convex.
- `pnpm test:docker:bundled-channel-deps`
  - يعبّئ ويثبت بناء OpenClaw الحالي داخل Docker، ويبدأ Gateway
    مع ضبط OpenAI، ثم يمكّن القناة/Plugins المجمعة عبر تعديلات الإعدادات.
  - يتحقق من أن اكتشاف الإعداد يترك تبعيات وقت التشغيل لـ Plugin غير المهيأة
    غائبة، وأن أول تشغيل مهيأ لـ Gateway أو doctor يثبت تبعيات وقت التشغيل لكل Plugin مجمعة
    عند الطلب، وأن إعادة التشغيل الثانية لا تعيد تثبيت التبعيات
    التي كانت قد فُعّلت بالفعل.
  - يثبت أيضًا baseline أقدم معروفة من npm، ويمكّن Telegram قبل تشغيل
    `openclaw update --tag <candidate>`، ثم يتحقق من أن
    post-update doctor الخاصة بالمرشح تصلح تبعيات وقت تشغيل القنوات المجمعة من دون
    إصلاح postinstall من جهة harness.
- `pnpm openclaw qa aimock`
  - يشغّل فقط خادم موفّر AIMock المحلي من أجل اختبارات smoke المباشرة للبروتوكول.
- `pnpm openclaw qa matrix`
  - يشغّل مسار Matrix QA الحي مقابل خادم Tuwunel مؤقت داخل Docker.
  - مضيف QA هذا مخصص حاليًا للمستودع/التطوير فقط. لا تشحن تثبيتات OpenClaw المعبأة
    `qa-lab`، ولذلك لا تكشف `openclaw qa`.
  - تقوم نسخ المستودع المحلية بتحميل المشغّل المجمّع مباشرةً؛ ولا حاجة إلى
    خطوة تثبيت Plugin منفصلة.
  - يوفّر ثلاثة مستخدمين مؤقتين في Matrix ‏(`driver` و`sut` و`observer`) بالإضافة إلى غرفة خاصة واحدة، ثم يبدأ child خاص بـ QA gateway مع Matrix Plugin الحقيقي بوصفه وسيلة النقل لـ SUT.
  - يستخدم افتراضيًا صورة Tuwunel المستقرة المثبتة `ghcr.io/matrix-construct/tuwunel:v1.5.1`. تجاوزها عبر `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` عندما تحتاج إلى اختبار صورة مختلفة.
  - لا يكشف Matrix علامات مصدر بيانات اعتماد مشتركة لأن المسار يوفّر مستخدمين مؤقتين محليًا.
  - يكتب تقرير Matrix QA، والملخص، وعنصر observed-events، وسجل الإخراج
    المدمج stdout/stderr ضمن `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - يشغّل مسار Telegram QA الحي مقابل مجموعة خاصة حقيقية باستخدام رموز driver وSUT bot من env.
  - يتطلب `OPENCLAW_QA_TELEGRAM_GROUP_ID` و`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` و`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ويجب أن يكون معرّف المجموعة هو معرّف دردشة Telegram الرقمي.
  - يدعم `--credential-source convex` لبيانات الاعتماد المشتركة المجمعة. استخدم وضع env افتراضيًا، أو اضبط `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` للاشتراك في عقود الإيجار المجمعة.
  - يخرج بقيمة غير صفرية عندما يفشل أي سيناريو. استخدم `--allow-failures` عندما
    تريد العناصر الناتجة من دون رمز خروج فاشل.
  - يتطلب وجود روبوتين مختلفين في المجموعة الخاصة نفسها، مع كشف SUT bot لاسم مستخدم Telegram.
  - للحصول على ملاحظة مستقرة بين bots، فعّل وضع Bot-to-Bot Communication في `@BotFather` لكلا البوتين وتأكد من أن driver bot يمكنه ملاحظة حركة bots داخل المجموعة.
  - يكتب تقرير Telegram QA، والملخص، وعنصر observed-messages ضمن `.artifacts/qa-e2e/...`. وتتضمن سيناريوهات الرد RTT من طلب إرسال driver إلى الرد المرصود من SUT.

تشترك مسارات النقل الحية في عقد قياسي واحد بحيث لا تنحرف وسائل النقل الجديدة:

يظل `qa-channel` هو مجموعة QA التركيبية الواسعة وليس جزءًا من مصفوفة تغطية
النقل الحي.

| المسار   | Canary | تقييد الإشارات | حظر allowlist | رد من المستوى الأعلى | استئناف بعد إعادة التشغيل | متابعة الخيط | عزل الخيط | ملاحظة التفاعل | أمر المساعدة |
| -------- | ------ | -------------- | ------------- | --------------------- | -------------------------- | ------------ | ---------- | ---------------- | ------------ |
| Matrix   | x      | x              | x             | x                     | x                          | x            | x          | x                |              |
| Telegram | x      |                |               |                       |                            |              |            |                  | x            |

### بيانات اعتماد Telegram المشتركة عبر Convex ‏(v1)

عند تمكين `--credential-source convex` ‏(أو `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) من أجل
`openclaw qa telegram`، يقوم QA lab بالحصول على عقد إيجار حصري من تجمع مدعوم بـ Convex، ويحافظ
على heartbeat لهذا العقد أثناء تشغيل المسار، ويحرر العقد عند الإيقاف.

مرجع مشروع Convex scaffold:

- `qa/convex-credential-broker/`

متغيرات البيئة المطلوبة:

- `OPENCLAW_QA_CONVEX_SITE_URL` ‏(على سبيل المثال `https://your-deployment.convex.site`)
- سر واحد للدور المحدد:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` للدور `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` للدور `ci`
- اختيار دور بيانات الاعتماد:
  - CLI: ‏`--credential-role maintainer|ci`
  - القيمة الافتراضية في env: ‏`OPENCLAW_QA_CREDENTIAL_ROLE` ‏(الافتراضي `ci` في CI، و`maintainer` بخلاف ذلك)

متغيرات البيئة الاختيارية:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` ‏(الافتراضي `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` ‏(الافتراضي `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` ‏(الافتراضي `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` ‏(الافتراضي `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` ‏(الافتراضي `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` ‏(معرّف تتبع اختياري)
- يسمح `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` بعناوين Convex من نوع `http://` على loopback للتطوير المحلي فقط.

يجب أن يستخدم `OPENCLAW_QA_CONVEX_SITE_URL` البروتوكول `https://` في التشغيل العادي.

تتطلب أوامر الإدارة الخاصة بالمشرفين (إضافة/إزالة/سرد التجمع) القيمة
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` تحديدًا.

مساعدات CLI للمشرفين:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

استخدم `--json` للحصول على مخرجات قابلة للقراءة آليًا في البرامج النصية وأدوات CI.

عقد نقطة النهاية الافتراضي (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - الطلب: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - النجاح: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - الاستنفاد/القابل لإعادة المحاولة: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - الطلب: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - النجاح: `{ status: "ok" }` ‏(أو `2xx` فارغة)
- `POST /release`
  - الطلب: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - النجاح: `{ status: "ok" }` ‏(أو `2xx` فارغة)
- `POST /admin/add` ‏(سر maintainer فقط)
  - الطلب: `{ kind, actorId, payload, note?, status? }`
  - النجاح: `{ status: "ok", credential }`
- `POST /admin/remove` ‏(سر maintainer فقط)
  - الطلب: `{ credentialId, actorId }`
  - النجاح: `{ status: "ok", changed, credential }`
  - حارس عقد الإيجار النشط: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` ‏(سر maintainer فقط)
  - الطلب: `{ kind?, status?, includePayload?, limit? }`
  - النجاح: `{ status: "ok", credentials, count }`

شكل الحمولة لنوع Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- يجب أن تكون `groupId` سلسلة معرّف دردشة Telegram رقمية.
- يتحقق `admin/add` من هذا الشكل من أجل `kind: "telegram"` ويرفض الحمولات المشوّهة.

### إضافة قناة إلى QA

تتطلب إضافة قناة إلى نظام QA المعتمد على Markdown أمرين فقط بالضبط:

1. مُحوّل نقل للقناة.
2. حزمة سيناريوهات تختبر عقد القناة.

لا تضف جذر أوامر QA علويًا جديدًا عندما يكون بإمكان مضيف `qa-lab` المشترك
امتلاك التدفق.

يمتلك `qa-lab` آليات المضيف المشتركة:

- جذر الأمر `openclaw qa`
- بدء المجموعة وإنهاؤها
- توازي العمال
- كتابة العناصر الناتجة
- توليد التقارير
- تنفيذ السيناريوهات
- الأسماء المستعارة المتوافقة مع الإصدارات السابقة لسيناريوهات `qa-channel` الأقدم

تمتلك Plugins الخاصة بالمشغّل عقد النقل:

- كيفية تحميل `openclaw qa <runner>` أسفل الجذر المشترك `qa`
- كيفية إعداد gateway من أجل ذلك النقل
- كيفية التحقق من الجاهزية
- كيفية حقن الأحداث الواردة
- كيفية ملاحظة الرسائل الصادرة
- كيفية كشف transcripts وحالة النقل المطَبَّعة
- كيفية تنفيذ الإجراءات المدعومة بالنقل
- كيفية التعامل مع إعادة التعيين أو التنظيف الخاص بالنقل

الحد الأدنى لاعتماد قناة جديدة هو:

1. إبقاء `qa-lab` مالكًا لجذر `qa` المشترك.
2. تنفيذ مشغّل النقل على سطح المضيف المشترك `qa-lab`.
3. إبقاء الآليات الخاصة بالنقل داخل Plugin المشغّل أو harness الخاص بالقناة.
4. تحميل المشغّل بوصفه `openclaw qa <runner>` بدلًا من تسجيل جذر أوامر منافس.
   يجب أن تعلن Plugins الخاصة بالمشغّل `qaRunners` في `openclaw.plugin.json` وتصدّر مصفوفة `qaRunnerCliRegistrations` مطابقة من `runtime-api.ts`.
   أبقِ `runtime-api.ts` خفيفًا؛ ويجب أن يبقى التنفيذ الكسول لـ CLI والمشغّل خلف نقاط دخول منفصلة.
5. تأليف أو تكييف سيناريوهات Markdown ضمن أدلة `qa/scenarios/` الموضوعية.
6. استخدام مساعدات السيناريو العامة للسيناريوهات الجديدة.
7. إبقاء الأسماء المستعارة الحالية المتوافقة عاملة ما لم يكن المستودع يجري ترحيلًا مقصودًا.

قاعدة القرار صارمة:

- إذا أمكن التعبير عن السلوك مرة واحدة في `qa-lab`، فضعه في `qa-lab`.
- إذا كان السلوك يعتمد على وسيلة نقل قناة واحدة، فأبقِه في Plugin المشغّل أو harness الخاص بها.
- إذا احتاج سيناريو إلى قدرة جديدة يمكن لأكثر من قناة استخدامها، فأضف helper عامًا بدلًا من فرع خاص بقناة داخل `suite.ts`.
- إذا كان السلوك ذا معنى لنقل واحد فقط، فأبقِ السيناريو خاصًا بالنقل واجعل ذلك صريحًا في عقد السيناريو.

أسماء المساعدات العامة المفضلة للسيناريوهات الجديدة هي:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

وتظل الأسماء المستعارة المتوافقة متاحة للسيناريوهات الحالية، بما في ذلك:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

يجب أن تستخدم أعمال القنوات الجديدة أسماء المساعدات العامة.
فالأسماء المستعارة المتوافقة موجودة لتجنب ترحيل شامل في يوم واحد، وليست نموذجًا
لتأليف السيناريوهات الجديدة.

## مجموعات الاختبار (ما الذي يعمل وأين)

فكّر في المجموعات على أنها "تزايد في الواقعية" (وفي عدم الاستقرار/التكلفة):

### Unit / integration ‏(الافتراضي)

- الأمر: `pnpm test`
- الإعداد: تستخدم التشغيلات غير المستهدفة مجموعة الشظايا `vitest.full-*.config.ts` وقد توسّع شظايا المشاريع المتعددة إلى إعدادات لكل مشروع من أجل الجدولة المتوازية
- الملفات: مخزونات core/unit ضمن `src/**/*.test.ts` و`packages/**/*.test.ts` و`test/**/*.test.ts` واختبارات `ui` العقدية المدرجة في allowlist والمغطاة بواسطة `vitest.unit.config.ts`
- النطاق:
  - اختبارات unit خالصة
  - اختبارات integration داخل العملية (مصادقة gateway، والتوجيه، والأدوات، والتحليل، والإعدادات)
  - اختبارات انحدار حتمية للأخطاء المعروفة
- التوقعات:
  - تعمل في CI
  - لا تتطلب مفاتيح حقيقية
  - يجب أن تكون سريعة ومستقرة
    <AccordionGroup>
    <Accordion title="المشاريع، والشظايا، والمسارات ذات النطاق"> - تشغّل أوامر `pnpm test` غير المستهدفة اثنتي عشرة إعدادات شظايا أصغر (`core-unit-fast` و`core-unit-src` و`core-unit-security` و`core-unit-ui` و`core-unit-support` و`core-support-boundary` و`core-contracts` و`core-bundled` و`core-runtime` و`agentic` و`auto-reply` و`extensions`) بدلًا من عملية مشروع جذر أصلية ضخمة واحدة. وهذا يقلل ذروة RSS على الأجهزة المحمّلة ويمنع أعمال auto-reply/extensions من تجويع المجموعات غير المرتبطة. - لا يزال `pnpm test --watch` يستخدم رسم المشاريع الجذرية الأصلية `vitest.config.ts`، لأن حلقة watch متعددة الشظايا غير عملية. - تقوم أوامر `pnpm test` و`pnpm test:watch` و`pnpm test:perf:imports` أولًا بتوجيه أهداف الملفات/الأدلة الصريحة عبر المسارات ذات النطاق، لذا فإن `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` يتجنب دفع كلفة بدء المشروع الجذري بالكامل. - يقوم `pnpm test:changed` بتوسيع مسارات git المتغيرة إلى المسارات ذات النطاق نفسها عندما يمس الفرق فقط ملفات المصدر/الاختبار القابلة للتوجيه؛ أما تعديلات الإعداد/التهيئة فتعيد الرجوع إلى إعادة تشغيل المشروع الجذري الواسع. - يُعد `pnpm check:changed` البوابة المحلية الذكية العادية للأعمال الضيقة. فهو يصنّف الفرق إلى core، واختبارات core، وextensions، واختبارات extension، وapps، وdocs، وبيانات الإصدار الوصفية، والأدوات، ثم يشغّل مسارات typecheck/lint/test المطابقة. وتتضمن تغييرات Plugin SDK العامة وعقود Plugin تمريرة تحقق واحدة لـ extension لأن extensions تعتمد على تلك العقود الأساسية. كما تشغّل زيادات الإصدار في بيانات الإصدار الوصفية فقط فحوصات مستهدفة للإصدار/الإعدادات/تبعيات الجذر بدلًا من المجموعة الكاملة، مع حارس يرفض تغييرات الحزم خارج حقل الإصدار الأعلى مستوى. - تُوجَّه اختبارات unit الخفيفة على الاستيراد من الوكلاء، والأوامر، وPlugins، ومساعدات auto-reply، و`plugin-sdk`، والمناطق المشابهة الخالصة إلى مسار `unit-fast`، الذي يتجاوز `test/setup-openclaw-runtime.ts`؛ بينما تبقى الملفات الثقيلة ذات الحالة/وقت التشغيل على المسارات الموجودة. - كما تقوم ملفات المصدر المساعدة المحددة في `plugin-sdk` و`commands` بربط تشغيلات الوضع المتغير باختبارات أشقاء صريحة في تلك المسارات الخفيفة، بحيث تتجنب تعديلات المساعدات إعادة تشغيل المجموعة الثقيلة الكاملة لذلك الدليل. - يملك `auto-reply` ثلاثة دلاء مخصصة: مساعدات core الأعلى مستوى، واختبارات integration العلوية `reply.*`، والشجرة الفرعية `src/auto-reply/reply/**`. وهذا يُبقي أعمال harness الخاصة بالردود الأثقل بعيدة عن اختبارات الحالة/الأجزاء/الرموز الرخيصة.
    </Accordion>

      <Accordion title="تغطية المشغّل المدمج">
        - عندما تغيّر مدخلات اكتشاف أداة الرسائل أو سياق وقت تشغيل
          Compaction، فاحرص على إبقاء كلا مستويي التغطية.
        - أضف اختبارات انحدار مركزة للمساعدات على حدود التوجيه والتطبيع
          الخالصة.
        - حافظ على سلامة مجموعات integration الخاصة بالمشغّل المدمج:
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`،
          و`src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`، و
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
        - تتحقق هذه المجموعات من أن المعرّفات ذات النطاق وسلوك Compaction لا يزالان
          يمران عبر المسارات الحقيقية `run.ts` / `compact.ts`؛ ولا تُعد
          الاختبارات المساعدة فقط بديلًا كافيًا لتلك المسارات التكاملية.
      </Accordion>

      <Accordion title="إعدادات Vitest الافتراضية للتجمع والعزل">
        - يستخدم إعداد Vitest الأساسي القيمة الافتراضية `threads`.
        - يثبت إعداد Vitest المشترك القيمة `isolate: false` ويستخدم
          المشغّل غير المعزول عبر المشاريع الجذرية، وإعدادات e2e، والإعدادات الحية.
        - يحتفظ مسار UI الجذري بإعداده `jsdom` والمُحسِّن الخاص به، لكنه يعمل أيضًا على
          المشغّل المشترك غير المعزول.
        - ترث كل شظية من `pnpm test` القيم الافتراضية نفسها
          `threads` + `isolate: false` من إعداد Vitest المشترك.
        - يضيف `scripts/run-vitest.mjs` الخيار `--no-maglev` افتراضيًا لعمليات Node الفرعية الخاصة بـ Vitest لتقليل اضطراب الترجمة البرمجية في V8 أثناء التشغيلات المحلية الكبيرة.
          اضبط `OPENCLAW_VITEST_ENABLE_MAGLEV=1` للمقارنة مع
          سلوك V8 القياسي.
      </Accordion>

      <Accordion title="التكرار المحلي السريع">
        - يعرض `pnpm changed:lanes` المسارات المعمارية التي يفعّلها الفرق.
        - يقتصر hook قبل الالتزام على التنسيق فقط. فهو يعيد staging للملفات المنسقة
          ولا يشغّل lint أو typecheck أو اختبارات.
        - شغّل `pnpm check:changed` صراحةً قبل التسليم أو push عندما
          تحتاج إلى البوابة المحلية الذكية. وتتضمن تغييرات Plugin SDK العامة وعقود Plugin
          تمريرة تحقق واحدة لـ extension.
        - يوجّه `pnpm test:changed` عبر المسارات ذات النطاق عندما تتطابق المسارات
          المتغيرة بوضوح مع مجموعة أصغر.
        - يحتفظ `pnpm test:max` و`pnpm test:changed:max` بسلوك التوجيه نفسه،
          لكن مع حد أعلى للعمال.
        - إن التوسّع التلقائي للعمال محليًا محافظ عمدًا ويتراجع
          عندما يكون متوسط حمل المضيف مرتفعًا بالفعل، بحيث تسبب تشغيلات
          Vitest المتعددة المتزامنة ضررًا أقل افتراضيًا.
        - يعلّم إعداد Vitest الأساسي المشاريع/ملفات الإعدادات
          كـ `forceRerunTriggers` بحيث تبقى إعادة التشغيل في الوضع المتغير صحيحة عندما
          تتغيّر أسلاك الاختبار.
        - يحتفظ الإعداد بتمكين `OPENCLAW_VITEST_FS_MODULE_CACHE` على
          المضيفين المدعومين؛ اضبط `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` إذا كنت تريد
          موقع ذاكرة مؤقتة صريحًا واحدًا من أجل التحليل المباشر.
      </Accordion>

      <Accordion title="تصحيح الأداء">
        - يفعّل `pnpm test:perf:imports` تقارير مدة الاستيراد في Vitest بالإضافة إلى
          مخرجات تفصيل الاستيراد.
        - يقيّد `pnpm test:perf:imports:changed` عرض التحليل نفسه على
          الملفات المتغيرة منذ `origin/main`.
        - عندما لا يزال اختبار ساخن واحد يقضي معظم وقته في استيرادات بدء التشغيل،
          فأبقِ التبعيات الثقيلة خلف سطح محلي ضيق من نوع `*.runtime.ts` وقم
          بمحاكاة ذلك السطح مباشرة بدلًا من الاستيراد العميق لمساعدات وقت التشغيل
          فقط لتمريرها إلى `vi.mock(...)`.
        - يقارن `pnpm test:perf:changed:bench -- --ref <git-ref>` بين
          `test:changed` الموجّه وبين مسار المشروع الجذري الأصلي لذلك الفرق الملتزم
          ويطبع زمن الجدار بالإضافة إلى macOS max RSS.
        - يختبر `pnpm test:perf:changed:bench -- --worktree` أداء الشجرة المتسخة الحالية
          عبر توجيه قائمة الملفات المتغيرة خلال
          `scripts/test-projects.mjs` وإعداد Vitest الجذري.
        - يكتب `pnpm test:perf:profile:main` ملف تعريف CPU للخيط الرئيسي من أجل
          حمل بدء تشغيل Vitest/Vite والتحويل.
        - يكتب `pnpm test:perf:profile:runner` ملفات تعريف CPU+heap الخاصة بالمشغّل من أجل
          مجموعة unit مع تعطيل التوازي على مستوى الملفات.
      </Accordion>
    </AccordionGroup>

### الثبات (gateway)

- الأمر: `pnpm test:stability:gateway`
- الإعداد: `vitest.gateway.config.ts`، ومجبَر على عامل واحد
- النطاق:
  - يبدأ Gateway حقيقيًا على loopback مع تفعيل التشخيصات افتراضيًا
  - يقود حركة churn اصطناعية لرسائل gateway والذاكرة والحمولات الكبيرة عبر مسار الأحداث التشخيصي
  - يستعلم عن `diagnostics.stability` عبر Gateway WS RPC
  - يغطي مساعدات حفظ حزمة الثبات التشخيصية
  - يؤكد أن المسجل يبقى محدودًا، وأن عينات RSS الاصطناعية تبقى تحت ميزانية الضغط، وأن أعماق الطوابير لكل جلسة تعود لتُصرف إلى الصفر
- التوقعات:
  - آمن لـ CI ومن دون مفاتيح
  - مسار ضيق لمتابعة انحدارات الثبات، وليس بديلًا عن مجموعة Gateway الكاملة

### E2E ‏(اختبار smoke لـ gateway)

- الأمر: `pnpm test:e2e`
- الإعداد: `vitest.e2e.config.ts`
- الملفات: `src/**/*.e2e.test.ts` و`test/**/*.e2e.test.ts` واختبارات E2E الخاصة بـ Plugins المجمعة ضمن `extensions/`
- افتراضيات وقت التشغيل:
  - يستخدم `threads` في Vitest مع `isolate: false`، بما يطابق بقية المستودع.
  - يستخدم عمّالًا متكيفين (CI: حتى 2، المحلي: 1 افتراضيًا).
  - يعمل في الوضع الصامت افتراضيًا لتقليل حمل I/O على وحدة التحكم.
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_WORKERS=<n>` لفرض عدد العمال (بحد أقصى 16).
  - `OPENCLAW_E2E_VERBOSE=1` لإعادة تمكين مخرجات وحدة التحكم التفصيلية.
- النطاق:
  - سلوك gateway من طرف إلى طرف متعدد المثيلات
  - أسطح WebSocket/HTTP، واقتران node، والشبكات الأثقل
- التوقعات:
  - يعمل في CI ‏(عند تمكينه في pipeline)
  - لا يتطلب مفاتيح حقيقية
  - يحتوي على أجزاء متحركة أكثر من اختبارات unit ‏(وقد يكون أبطأ)

### E2E: اختبار smoke لواجهة OpenShell الخلفية

- الأمر: `pnpm test:e2e:openshell`
- الملف: `extensions/openshell/src/backend.e2e.test.ts`
- النطاق:
  - يبدأ OpenShell gateway معزولة على المضيف عبر Docker
  - ينشئ sandbox من Dockerfile محلي مؤقت
  - يختبر واجهة OpenClaw الخلفية لـ OpenShell عبر `sandbox ssh-config` + SSH exec الحقيقيين
  - يتحقق من سلوك نظام الملفات البعيد-المرجعي عبر جسر fs الخاص بـ sandbox
- التوقعات:
  - اشتراك اختياري فقط؛ وليس جزءًا من تشغيل `pnpm test:e2e` الافتراضي
  - يتطلب CLI محليًا لـ `openshell` بالإضافة إلى Docker daemon عاملة
  - يستخدم `HOME` / `XDG_CONFIG_HOME` معزولين، ثم يدمّر gateway وsandbox الخاصة بالاختبار
- تجاوزات مفيدة:
  - `OPENCLAW_E2E_OPENSHELL=1` لتمكين الاختبار عند تشغيل مجموعة e2e الأوسع يدويًا
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` للإشارة إلى ملف CLI ثنائي غير افتراضي أو نص wrapper برمجي

### Live ‏(موفّرون حقيقيون + نماذج حقيقية)

- الأمر: `pnpm test:live`
- الإعداد: `vitest.live.config.ts`
- الملفات: `src/**/*.live.test.ts` و`test/**/*.live.test.ts` واختبارات live الخاصة بـ Plugins المجمعة ضمن `extensions/`
- الافتراضي: **مفعّل** بواسطة `pnpm test:live` ‏(يضبط `OPENCLAW_LIVE_TEST=1`)
- النطاق:
  - "هل يعمل هذا الموفّر/النموذج فعلًا **اليوم** باستخدام بيانات اعتماد حقيقية؟"
  - التقاط تغييرات تنسيق الموفّر، وخصائص استدعاء الأدوات، ومشكلات المصادقة، وسلوك حدود المعدل
- التوقعات:
  - غير مستقرة على CI بطبيعتها (شبكات حقيقية، وسياسات موفّرين حقيقية، وحصص، وانقطاعات)
  - تكلف مالًا / تستخدم حدود المعدل
  - يُفضّل تشغيل مجموعات فرعية مضيقة بدلًا من "كل شيء"
- تستورد التشغيلات الحية `~/.profile` لالتقاط مفاتيح API المفقودة.
- افتراضيًا، لا تزال التشغيلات الحية تعزل `HOME` وتنسخ مواد config/auth إلى home اختبار مؤقتة بحيث لا تتمكن fixtures الخاصة بـ unit من تعديل `~/.openclaw` الحقيقية.
- اضبط `OPENCLAW_LIVE_USE_REAL_HOME=1` فقط عندما تريد عمدًا أن تستخدم الاختبارات الحية دليل المنزل الحقيقي لديك.
- يستخدم `pnpm test:live` الآن افتراضيًا وضعًا أكثر هدوءًا: إذ يحتفظ بمخرجات التقدم `[live] ...`، لكنه يكتم إشعار `~/.profile` الإضافي ويخفت سجلات bootstrap الخاصة بالـ gateway/ضوضاء Bonjour. اضبط `OPENCLAW_LIVE_TEST_QUIET=0` إذا كنت تريد سجلات بدء التشغيل الكاملة مجددًا.
- تدوير مفاتيح API ‏(خاص بكل موفّر): اضبط `*_API_KEYS` بصيغة مفصولة بفواصل/فواصل منقوطة أو `*_API_KEY_1` و`*_API_KEY_2` ‏(مثل `OPENAI_API_KEYS` و`ANTHROPIC_API_KEYS` و`GEMINI_API_KEYS`) أو تجاوزًا حيًا لكل تشغيل عبر `OPENCLAW_LIVE_*_KEY`؛ وتعاد المحاولة في الاختبارات عند استجابات حد المعدل.
- مخرجات التقدم/النبض:
  - تصدر المجموعات الحية الآن أسطر تقدم إلى stderr بحيث تبقى استدعاءات الموفّر الطويلة مرئية النشاط حتى عندما تكون عملية التقاط Vitest لوحدة التحكم هادئة.
  - يقوم `vitest.live.config.ts` بتعطيل اعتراض وحدة التحكم في Vitest بحيث تتدفق أسطر تقدم الموفّر/‏gateway فورًا أثناء التشغيلات الحية.
  - اضبط heartbeats الخاصة بالنموذج المباشر عبر `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - اضبط heartbeats الخاصة بالـ gateway/probe عبر `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## أي مجموعة يجب أن أشغّل؟

استخدم جدول القرار هذا:

- تعديل المنطق/الاختبارات: شغّل `pnpm test` ‏(و`pnpm test:coverage` إذا غيّرت الكثير)
- لمس شبكات gateway / بروتوكول WS / الاقتران: أضف `pnpm test:e2e`
- تصحيح "البوت الخاص بي معطّل" / أعطال خاصة بالموفّر / استدعاء الأدوات: شغّل `pnpm test:live` مضيقًا

## الاختبارات الحية (التي تلامس الشبكة)

بالنسبة إلى مصفوفة النماذج الحية، واختبارات smoke للواجهات الخلفية في CLI، واختبارات ACP smoke، وCodex app-server
harness، وجميع اختبارات موفّري الوسائط الحية (Deepgram، وBytePlus، وComfyUI، والصورة،
والموسيقى، والفيديو، وmedia harness) — بالإضافة إلى التعامل مع بيانات الاعتماد في التشغيلات الحية — راجع
[الاختبار — المجموعات الحية](/ar/help/testing-live).

## مشغلات Docker ‏(اختيارات "يعمل على Linux")

تنقسم مشغلات Docker هذه إلى فئتين:

- مشغلات النماذج الحية: يشغّل `test:docker:live-models` و`test:docker:live-gateway` فقط ملف live المطابق لمفتاح ملف التعريف داخل صورة Docker الخاصة بالمستودع (`src/agents/models.profiles.live.test.ts` و`src/gateway/gateway-models.profiles.live.test.ts`)، مع تحميل bind لدليل الإعدادات المحلي ومساحة العمل لديك (ومع استيراد `~/.profile` إذا تم تحميله). ونقاط الدخول المحلية المطابقة هي `test:live:models-profiles` و`test:live:gateway-profiles`.
- تستخدم مشغلات Docker الحية افتراضيًا حدًا أصغر لاختبارات smoke بحيث يبقى الاجتياح الكامل داخل Docker عمليًا:
  يستخدم `test:docker:live-models` افتراضيًا `OPENCLAW_LIVE_MAX_MODELS=12`، ويستخدم
  `test:docker:live-gateway` افتراضيًا `OPENCLAW_LIVE_GATEWAY_SMOKE=1`،
  و`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`،
  و`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`، و
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. تجاوز متغيرات env هذه عندما
  تريد صراحةً الفحص الأكبر والأشمل.
- يقوم `test:docker:all` ببناء صورة Docker الحية مرة واحدة عبر `test:docker:live-build`، ثم يعيد استخدامها لمساري Docker الحيين. كما يبني صورة مشتركة واحدة `scripts/e2e/Dockerfile` عبر `test:docker:e2e-build` ويعيد استخدامها لمشغلات smoke الخاصة بحاوية E2E التي تختبر التطبيق المبني.
- مشغلات smoke الخاصة بالحاويات: تعمل `test:docker:openwebui` و`test:docker:onboard` و`test:docker:npm-onboard-channel-agent` و`test:docker:gateway-network` و`test:docker:mcp-channels` و`test:docker:pi-bundle-mcp-tools` و`test:docker:cron-mcp-cleanup` و`test:docker:plugins` و`test:docker:plugin-update` و`test:docker:config-reload` على تشغيل حاوية حقيقية واحدة أو أكثر والتحقق من مسارات integration ذات المستوى الأعلى.

كما تقوم مشغلات Docker الخاصة بالنماذج الحية بتحميل bind فقط لأدلة مصادقة CLI المطلوبة (أو جميع الأدلة المدعومة عندما لا يكون التشغيل مضيقًا)، ثم تنسخها إلى home الحاوية قبل التشغيل حتى تتمكن OAuth الخاصة بـ CLI الخارجية من تحديث الرموز من دون تعديل مخزن المصادقة على المضيف:

- النماذج المباشرة: `pnpm test:docker:live-models` ‏(البرنامج النصي: `scripts/test-live-models-docker.sh`)
- اختبار smoke لربط ACP: ‏`pnpm test:docker:live-acp-bind` ‏(البرنامج النصي: `scripts/test-live-acp-bind-docker.sh`)
- اختبار smoke للواجهة الخلفية في CLI: ‏`pnpm test:docker:live-cli-backend` ‏(البرنامج النصي: `scripts/test-live-cli-backend-docker.sh`)
- اختبار smoke لـ Codex app-server harness: ‏`pnpm test:docker:live-codex-harness` ‏(البرنامج النصي: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + وكيل التطوير: `pnpm test:docker:live-gateway` ‏(البرنامج النصي: `scripts/test-live-gateway-models-docker.sh`)
- اختبار smoke حي لـ Open WebUI: ‏`pnpm test:docker:openwebui` ‏(البرنامج النصي: `scripts/e2e/openwebui-docker.sh`)
- معالج onboarding ‏(TTY، وتهيئة كاملة): ‏`pnpm test:docker:onboard` ‏(البرنامج النصي: `scripts/e2e/onboard-docker.sh`)
- اختبار smoke لـ npm tarball onboarding/channel/agent: يقوم `pnpm test:docker:npm-onboard-channel-agent` بتثبيت tarball المعبأ الخاص بـ OpenClaw عالميًا داخل Docker، ويضبط OpenAI عبر onboarding بالإشارة إلى env بالإضافة إلى Telegram افتراضيًا، ويتحقق من أن doctor تصلح تبعيات وقت التشغيل الخاصة بـ Plugin المفعّلة، ويشغّل دور وكيل واحدًا وهميًا لـ OpenAI. أعد استخدام tarball مبنية مسبقًا عبر `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ إعادة بناء المضيف عبر `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`، أو بدّل القناة عبر `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- اختبار smoke للتثبيت العام باستخدام Bun: يقوم `bash scripts/e2e/bun-global-install-smoke.sh` بتعبئة الشجرة الحالية، وتثبيتها باستخدام `bun install -g` داخل home معزولة، والتحقق من أن `openclaw infer image providers --json` يعيد موفّري الصور المجمّعين بدلًا من التعليق. أعد استخدام tarball مبنية مسبقًا عبر `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`، أو تخطَّ بناء المضيف عبر `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`، أو انسخ `dist/` من صورة Docker مبنية عبر `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- اختبار smoke لمُثبّت Docker: يشترك `bash scripts/test-install-sh-docker.sh` في ذاكرة مؤقتة واحدة لـ npm عبر حاويات root، وupdate، وdirect-npm الخاصة به. ويستخدم smoke التحديث افتراضيًا npm ‏`latest` كأساس مستقر قبل الترقية إلى tarball المرشحة. وتحافظ فحوصات المُثبّت غير الجذرية على ذاكرة مؤقتة npm معزولة بحيث لا تحجب إدخالات الذاكرة المؤقتة المملوكة لـ root سلوك التثبيت المحلي للمستخدم. اضبط `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` لإعادة استخدام ذاكرة root/update/direct-npm عبر الإعادات المحلية.
- تتخطى Install Smoke في CI التحديث المباشر global الخاص بـ npm المكرر عبر `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`؛ شغّل البرنامج النصي محليًا من دون هذا env عندما تحتاج إلى تغطية `npm install -g` المباشرة.
- شبكات Gateway ‏(حاويتان، WS auth + health): ‏`pnpm test:docker:gateway-network` ‏(البرنامج النصي: `scripts/e2e/gateway-network-docker.sh`)
- اختبار انحدار OpenAI Responses web_search بأدنى reasoning: ‏`pnpm test:docker:openai-web-search-minimal` ‏(البرنامج النصي: `scripts/e2e/openai-web-search-minimal-docker.sh`) يشغّل خادم OpenAI وهميًا عبر Gateway، ويتحقق من أن `web_search` ترفع `reasoning.effort` من `minimal` إلى `low`، ثم يفرض رفض مخطط الموفّر ويتحقق من ظهور التفاصيل الخام في سجلات Gateway.
- جسر MCP للقنوات (Gateway مزروعة + stdio bridge + اختبار smoke لإطار إشعارات Claude الخام): ‏`pnpm test:docker:mcp-channels` ‏(البرنامج النصي: `scripts/e2e/mcp-channels-docker.sh`)
- أدوات MCP لحزمة Pi ‏(خادم MCP حقيقي عبر stdio + اختبار smoke للسماح/المنع في ملف تعريف Pi المدمج): ‏`pnpm test:docker:pi-bundle-mcp-tools` ‏(البرنامج النصي: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- تنظيف Cron/subagent لـ MCP ‏(Gateway حقيقية + إنهاء child حقيقية لـ stdio MCP بعد isolated cron وتشغيلات one-shot subagent): ‏`pnpm test:docker:cron-mcp-cleanup` ‏(البرنامج النصي: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins ‏(اختبار smoke للتثبيت + الاسم المستعار `/plugin` + دلالات إعادة التشغيل الخاصة بحزمة Claude): ‏`pnpm test:docker:plugins` ‏(البرنامج النصي: `scripts/e2e/plugins-docker.sh`)
- اختبار smoke لعدم تغيّر تحديث Plugin: ‏`pnpm test:docker:plugin-update` ‏(البرنامج النصي: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- اختبار smoke لبيانات تعريف إعادة تحميل الإعدادات: ‏`pnpm test:docker:config-reload` ‏(البرنامج النصي: `scripts/e2e/config-reload-source-docker.sh`)
- تبعيات وقت التشغيل لـ Plugin المجمعة: يقوم `pnpm test:docker:bundled-channel-deps` ببناء صورة مشغّل Docker صغيرة افتراضيًا، ويبني ويعبّئ OpenClaw مرة واحدة على المضيف، ثم يحمّل tarball تلك داخل كل سيناريو تثبيت على Linux. أعد استخدام الصورة عبر `OPENCLAW_SKIP_DOCKER_BUILD=1`، أو تخطَّ إعادة بناء المضيف بعد بناء محلي جديد عبر `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`، أو أشِر إلى tarball موجودة عبر `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- ضيّق تبعيات وقت التشغيل لـ Plugin المجمعة أثناء التكرار عبر تعطيل السيناريوهات غير المرتبطة، على سبيل المثال:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

لبناء صورة التطبيق المبني المشتركة يدويًا وإعادة استخدامها:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

لا تزال تجاوزات الصور الخاصة بالمجموعة مثل `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` تفوز عند تعيينها. وعندما يشير `OPENCLAW_SKIP_DOCKER_BUILD=1` إلى صورة مشتركة بعيدة، تقوم البرامج النصية بسحبها إذا لم تكن محلية بالفعل. وتحتفظ اختبارات QR والمُثبّت داخل Docker بملفات Dockerfile الخاصة بها لأنها تتحقق من سلوك الحزمة/التثبيت بدلًا من وقت تشغيل التطبيق المبني المشترك.

كما تقوم مشغلات Docker الخاصة بالنماذج الحية بتحميل bind للنسخة الحالية من المستودع للقراءة فقط
وتجهيزها داخل workdir مؤقتة داخل الحاوية. وهذا يُبقي صورة وقت التشغيل
خفيفة مع الاستمرار في تشغيل Vitest على المصدر/الإعدادات المحلية الدقيقة لديك.
وتتجاوز خطوة التجهيز الذاكرات المؤقتة المحلية الكبيرة فقط والمخرجات المحلية لبناء التطبيقات مثل
`.pnpm-store` و`.worktrees` و`__openclaw_vitest__` وأدلة `.build` المحلية للتطبيق أو
مخرجات Gradle حتى لا تمضي تشغيلات Docker الحية دقائق في نسخ
عناصر خاصة بالجهاز.
كما تضبط أيضًا `OPENCLAW_SKIP_CHANNELS=1` بحيث لا تبدأ probes الحية الخاصة بالـ gateway
عمال قنوات Telegram/Discord/... الحقيقيين داخل الحاوية.
ولا يزال `test:docker:live-models` يشغّل `pnpm test:live`، لذا مرّر أيضًا
`OPENCLAW_LIVE_GATEWAY_*` عندما تحتاج إلى تضييق أو استبعاد تغطية gateway
الحية من ذلك المسار في Docker.
ويُعد `test:docker:openwebui` اختبار smoke للتوافق على مستوى أعلى: فهو يبدأ
حاوية OpenClaw gateway مع تمكين نقاط نهاية HTTP المتوافقة مع OpenAI،
ثم يبدأ حاوية Open WebUI مثبتة مقابل تلك gateway، ويسجّل الدخول عبر
Open WebUI، ويتحقق من أن `/api/models` تكشف `openclaw/default`، ثم يرسل
طلب دردشة حقيقيًا عبر وكيل `/api/chat/completions` الخاص بـ Open WebUI.
وقد تكون أول مرة أبطأ بشكل ملحوظ لأن Docker قد تحتاج إلى سحب
صورة Open WebUI وقد تحتاج Open WebUI إلى إنهاء إعداد البداية الباردة الخاص بها.
ويتوقع هذا المسار وجود مفتاح نموذج حي قابل للاستخدام، وتكون `OPENCLAW_PROFILE_FILE`
‏(`~/.profile` افتراضيًا) هي الطريقة الأساسية لتوفيره في التشغيلات داخل Docker.
وتطبع التشغيلات الناجحة حمولة JSON صغيرة مثل `{ "ok": true, "model":
"openclaw/default", ... }`.
ويكون `test:docker:mcp-channels` حتميًا عمدًا ولا يحتاج إلى
حساب Telegram أو Discord أو iMessage حقيقي. فهو يقلع حاوية Gateway
مزروعة، ويبدأ حاوية ثانية تشغّل `openclaw mcp serve`، ثم
يتحقق من اكتشاف المحادثات الموجّهة، وقراءات transcript، وبيانات وصفية للمرفقات،
وسلوك طابور الأحداث الحية، وتوجيه الإرسال الصادر، وإشعارات القناة +
الأذونات بنمط Claude عبر جسر MCP حقيقي عبر stdio. وتفحص عملية التحقق من الإشعارات
إطارات MCP الخام على stdio مباشرةً بحيث يتحقق اختبار smoke مما
يخرجه الجسر فعلًا، وليس فقط ما قد تكشفه SDK لعميل بعينه.
ويكون `test:docker:pi-bundle-mcp-tools` حتميًا ولا يحتاج إلى
مفتاح نموذج حي. فهو يبني صورة Docker الخاصة بالمستودع، ويبدأ خادم probe حقيقيًا لـ stdio MCP
داخل الحاوية، ويُجسّد ذلك الخادم عبر وقت تشغيل MCP
المضمن الخاص بحزمة Pi، وينفّذ الأداة، ثم يتحقق من أن `coding` و`messaging` يحتفظان
بأدوات `bundle-mcp` بينما يقوم `minimal` و`tools.deny: ["bundle-mcp"]` بتصفيتها.
ويكون `test:docker:cron-mcp-cleanup` حتميًا ولا يحتاج إلى مفتاح نموذج حي.
فهو يبدأ Gateway مزروعة مع خادم probe حقيقي لـ stdio MCP، ويشغّل
دور cron معزولًا ودور child لمرة واحدة عبر `/subagents spawn`، ثم يتحقق
من خروج عملية child الخاصة بـ MCP بعد كل تشغيل.

اختبار smoke يدوي لسلسلة ACP بلغة طبيعية عادية (ليس في CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- احتفظ بهذا البرنامج النصي لتدفقات الانحدار/تصحيح الأخطاء. فقد نحتاج إليه مرة أخرى من أجل التحقق من توجيه سلاسل ACP، لذا لا تحذفه.

متغيرات env مفيدة:

- `OPENCLAW_CONFIG_DIR=...` ‏(الافتراضي: `~/.openclaw`) ويُحمَّل إلى `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` ‏(الافتراضي: `~/.openclaw/workspace`) ويُحمَّل إلى `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` ‏(الافتراضي: `~/.profile`) ويُحمَّل إلى `/home/node/.profile` ويتم استيراده قبل تشغيل الاختبارات
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` للتحقق من متغيرات env المستوردة فقط من `OPENCLAW_PROFILE_FILE`، باستخدام أدلة إعدادات/مساحة عمل مؤقتة ومن دون تحميلات مصادقة CLI خارجية
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` ‏(الافتراضي: `~/.cache/openclaw/docker-cli-tools`) ويُحمَّل إلى `/home/node/.npm-global` من أجل تثبيتات CLI المخبأة داخل Docker
- يتم تحميل أدلة/ملفات مصادقة CLI الخارجية تحت `$HOME` للقراءة فقط ضمن `/host-auth...`، ثم تُنسخ إلى `/home/node/...` قبل بدء الاختبارات
  - الأدلة الافتراضية: `.minimax`
  - الملفات الافتراضية: `~/.codex/auth.json` و`~/.codex/config.toml` و`.claude.json` و`~/.claude/.credentials.json` و`~/.claude/settings.json` و`~/.claude/settings.local.json`
  - تقوم تشغيلات الموفّرين المضيقة بتحميل الأدلة/الملفات المطلوبة فقط والمستنتجة من `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - تجاوزها يدويًا عبر `OPENCLAW_DOCKER_AUTH_DIRS=all` أو `OPENCLAW_DOCKER_AUTH_DIRS=none` أو قائمة مفصولة بفواصل مثل `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` لتضييق التشغيل
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` لتصفية الموفّرين داخل الحاوية
- `OPENCLAW_SKIP_DOCKER_BUILD=1` لإعادة استخدام صورة `openclaw:local-live` موجودة من أجل الإعادات التي لا تحتاج إلى إعادة بناء
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` لضمان أن تأتي بيانات الاعتماد من مخزن ملفات التعريف (وليس من env)
- `OPENCLAW_OPENWEBUI_MODEL=...` لاختيار النموذج الذي تكشفه gateway من أجل اختبار smoke الخاص بـ Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` لتجاوز مطالبة التحقق من nonce المستخدمة بواسطة اختبار smoke الخاص بـ Open WebUI
- `OPENWEBUI_IMAGE=...` لتجاوز وسم صورة Open WebUI المثبتة

## التحقق السريع من المستندات

شغّل فحوصات المستندات بعد تعديلات الوثائق: `pnpm check:docs`.
وشغّل التحقق الكامل من روابط/مراسي Mintlify عندما تحتاج أيضًا إلى فحوصات العناوين داخل الصفحة: `pnpm docs:check-links:anchors`.

## انحدار دون اتصال (آمن لـ CI)

هذه اختبارات انحدار "لخط أنابيب حقيقي" من دون موفّرين حقيقيين:

- استدعاء أدوات Gateway ‏(OpenAI وهمي، وgateway حقيقية + حلقة وكيل): `src/gateway/gateway.test.ts` ‏(الحالة: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- معالج Gateway ‏(‏WS `wizard.start`/`wizard.next`، وكتابة الإعداد + فرض المصادقة): `src/gateway/gateway.test.ts` ‏(الحالة: "runs wizard over ws and writes auth token config")

## تقييمات موثوقية الوكيل (Skills)

لدينا بالفعل بعض الاختبارات الآمنة لـ CI التي تتصرف مثل "تقييمات موثوقية الوكيل":

- استدعاء أدوات وهمية عبر gateway الحقيقية + حلقة الوكيل (`src/gateway/gateway.test.ts`).
- تدفقات wizard من طرف إلى طرف التي تتحقق من أسلاك الجلسة وتأثيرات الإعداد (`src/gateway/gateway.test.ts`).

ما الذي لا يزال مفقودًا بالنسبة إلى Skills ‏(راجع [Skills](/ar/tools/skills)):

- **اتخاذ القرار:** عندما تُدرج Skills في المطالبة، هل يختار الوكيل Skill الصحيحة (أو يتجنب غير ذات الصلة)؟
- **الامتثال:** هل يقرأ الوكيل `SKILL.md` قبل الاستخدام ويتبع الخطوات/الوسائط المطلوبة؟
- **عقود سير العمل:** سيناريوهات متعددة الأدوار تؤكد ترتيب الأدوات، وترحيل سجل الجلسة، وحدود sandbox.

يجب أن تبقى التقييمات المستقبلية حتمية أولًا:

- مشغّل سيناريوهات يستخدم موفّرين وهميين للتأكد من استدعاءات الأدوات + ترتيبها، وقراءات ملفات Skill، وأسلاك الجلسات.
- مجموعة صغيرة من السيناريوهات المركزة على Skills ‏(الاستخدام مقابل التجنب، والتقييد، وحقن الموجّهات).
- تقييمات حية اختيارية (اشتراك اختياري، ومحكومة عبر env) فقط بعد وضع المجموعة الآمنة لـ CI.

## اختبارات العقد (شكل Plugin والقناة)

تتحقق اختبارات العقد من أن كل Plugin وقناة مسجلين يطابقان
عقد الواجهة الخاص بهما. فهي تتكرر على جميع Plugins المكتشفة وتشغّل مجموعة من
التحققات الخاصة بالشكل والسلوك. ويتجاوز مسار unit الافتراضي `pnpm test`
عمدًا هذه الملفات المشتركة الخاصة بالسطح واختبارات smoke؛ شغّل أوامر العقد صراحةً
عندما تلمس أسطح القنوات أو الموفّرين المشتركة.

### الأوامر

- جميع العقود: `pnpm test:contracts`
- عقود القنوات فقط: `pnpm test:contracts:channels`
- عقود الموفّرين فقط: `pnpm test:contracts:plugins`

### عقود القنوات

تقع في `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - الشكل الأساسي لـ Plugin ‏(المعرّف، والاسم، والقدرات)
- **setup** - عقد معالج الإعداد
- **session-binding** - سلوك ربط الجلسة
- **outbound-payload** - بنية حمولة الرسالة
- **inbound** - التعامل مع الرسائل الواردة
- **actions** - معالجات إجراءات القنوات
- **threading** - التعامل مع معرّف الخيط
- **directory** - واجهة directory/roster البرمجية
- **group-policy** - فرض سياسة المجموعات

### عقود حالة الموفّر

تقع في `src/plugins/contracts/*.contract.test.ts`.

- **status** - فحوصات حالة القناة
- **registry** - شكل سجل Plugin

### عقود الموفّرين

تقع في `src/plugins/contracts/*.contract.test.ts`:

- **auth** - عقد تدفق المصادقة
- **auth-choice** - اختيار/تحديد المصادقة
- **catalog** - واجهة API لفهرس النماذج
- **discovery** - اكتشاف Plugin
- **loader** - تحميل Plugin
- **runtime** - وقت تشغيل الموفّر
- **shape** - شكل/واجهة Plugin
- **wizard** - معالج الإعداد

### متى يجب التشغيل

- بعد تغيير صادرات plugin-sdk أو المسارات الفرعية
- بعد إضافة Plugin قناة أو موفّر أو تعديلها
- بعد إعادة هيكلة تسجيل Plugin أو اكتشافها

تعمل اختبارات العقد في CI ولا تتطلب مفاتيح API حقيقية.

## إضافة اختبارات انحدار (إرشادات)

عندما تصلح مشكلة موفّر/نموذج تم اكتشافها في الاختبارات الحية:

- أضف اختبار انحدار آمنًا لـ CI إن أمكن (موفّر وهمي/مزيف، أو التقاط تحويل شكل الطلب الدقيق)
- إذا كانت المشكلة حية بطبيعتها فقط (حدود المعدل، أو سياسات المصادقة)، فأبقِ الاختبار الحي ضيقًا واشتراكه اختياريًا عبر متغيرات env
- فضّل استهداف أصغر طبقة تلتقط الخطأ:
  - خطأ في تحويل/إعادة تشغيل طلب الموفّر → اختبار نماذج مباشر
  - خطأ في خط جلسة/سجل/أداة في gateway → اختبار smoke حي لـ gateway أو اختبار gateway وهمي وآمن لـ CI
- حاجز حماية عبور SecretRef:
  - يستمد `src/secrets/exec-secret-ref-id-parity.test.ts` هدفًا نموذجيًا واحدًا لكل فئة SecretRef من بيانات وصفية للسجل (`listSecretTargetRegistryEntries()`)، ثم يؤكد رفض معرّفات exec الخاصة بمقاطع العبور.
  - إذا أضفت عائلة أهداف SecretRef جديدة من نوع `includeInPlan` في `src/secrets/target-registry-data.ts`، فحدّث `classifyTargetClass` في ذلك الاختبار. ويفشل الاختبار عمدًا عند وجود معرّفات أهداف غير مصنفة بحيث لا يمكن تخطي الفئات الجديدة بصمت.

## ذو صلة

- [الاختبارات الحية](/ar/help/testing-live)
- [CI](/ar/ci)
