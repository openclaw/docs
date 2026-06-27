---
read_when:
    - برمجة متصفح الوكيل أو تصحيحه عبر واجهة API المحلية للتحكم
    - تبحث عن مرجع CLI الخاص بـ `openclaw browser`
    - إضافة أتمتة متصفح مخصّصة باستخدام اللقطات والمراجع
summary: واجهة برمجة تطبيقات التحكم بالمتصفح في OpenClaw ومرجع CLI وإجراءات البرمجة النصية
title: واجهة برمجة تطبيقات التحكم في المتصفح
x-i18n:
    generated_at: "2026-06-27T18:38:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ccfd1ec996b0fc211e2aefa0554e0fa5c7b0899ca981836134a3741b38bf7600
    source_path: tools/browser-control.md
    workflow: 16
---

للإعداد والتهيئة واستكشاف الأخطاء وإصلاحها، راجع [المتصفح](/ar/tools/browser).
هذه الصفحة هي المرجع لواجهة HTTP API للتحكم المحلي، وCLI ‏`openclaw browser`،
وأنماط البرمجة النصية (اللقطات، والمراجع، والانتظار، وتدفقات التصحيح).

## واجهة API للتحكم (اختيارية)

للتكاملات المحلية فقط، يوفّر Gateway واجهة HTTP API صغيرة عبر local loopback.
هذا الخادم المستقل اختياري — اضبط متغير البيئة
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` في بيئة خدمة Gateway
وأعد تشغيل Gateway قبل أن تصبح نقاط نهاية HTTP متاحة. من دون
هذا المتغير، يظل تشغيل التحكم في المتصفح يعمل عبر CLI
وأدوات الوكيل، لكن لا شيء يستمع على منفذ تحكم loopback.

- الحالة/البدء/الإيقاف: `GET /`, `POST /start`, `POST /stop`
- علامات التبويب: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- لقطة/لقطة شاشة: `GET /snapshot`, `POST /screenshot`
- الإجراءات: `POST /navigate`, `POST /act`
- الخطافات: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- التنزيلات: `POST /download`, `POST /wait/download`
- الأذونات: `POST /permissions/grant`
- التصحيح: `GET /console`, `POST /pdf`
- التصحيح: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- الشبكة: `POST /response/body`
- الحالة: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- الحالة: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- الإعدادات: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

تقبل كل نقاط النهاية `?profile=<name>`. يطلب `POST /start?headless=true`
تشغيلاً لمرة واحدة بلا واجهة رسومية للملفات الشخصية المحلية المُدارة من دون تغيير
تهيئة المتصفح المحفوظة؛ وترفض ملفات التعريف من نوع الإرفاق فقط وCDP البعيد والجلسات القائمة
هذا التجاوز لأن OpenClaw لا يشغّل عمليات تلك المتصفحات.

بالنسبة إلى نقاط نهاية علامات التبويب، `targetId` هو اسم حقل التوافق. يُفضّل تمرير
`suggestedTargetId` من `GET /tabs` أو `POST /tabs/open`؛ كما تُقبل التسميات ومقابض `tabId`
مثل `t1`. ما تزال معرفات أهداف CDP الخام وبادئات معرف الهدف الخام الفريدة
تعمل، لكنها مقابض تشخيصية متقلبة.

إذا كانت مصادقة Gateway بالسر المشترك مهيأة، فإن مسارات HTTP للمتصفح تتطلب المصادقة أيضاً:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` أو مصادقة HTTP Basic باستخدام كلمة المرور تلك

ملاحظات:

- لا تستهلك واجهة API المستقلة هذه لمتصفح loopback ترويسات هوية الوكيل الموثوق أو
  Tailscale Serve.
- إذا كان `gateway.auth.mode` هو `none` أو `trusted-proxy`، فإن مسارات متصفح loopback هذه
  لا ترث تلك الأوضاع الحاملة للهوية؛ أبقها مقتصرة على loopback فقط.

### عقد أخطاء `/act`

يستخدم `POST /act` استجابة خطأ منظمة لإخفاقات التحقق على مستوى المسار
والسياسة:

```json
{ "error": "<message>", "code": "ACT_*" }
```

قيم `code` الحالية:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` مفقود أو غير معروف.
- `ACT_INVALID_REQUEST` (HTTP 400): فشلت حمولة الإجراء في التطبيع أو التحقق.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): استُخدم `selector` مع نوع إجراء غير مدعوم.
- `ACT_EVALUATE_DISABLED` (HTTP 403): تم تعطيل `evaluate` (أو `wait --fn`) عبر التهيئة.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): يتعارض `targetId` عالي المستوى أو المجمع مع هدف الطلب.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): الإجراء غير مدعوم لملفات تعريف الجلسات القائمة.

قد تظل إخفاقات التشغيل الأخرى تُرجع `{ "error": "<message>" }` من دون حقل
`code`.

### متطلب Playwright

تتطلب بعض الميزات (التنقل/الإجراء/لقطة الذكاء الاصطناعي/لقطة الدور، ولقطات شاشة العناصر،
وPDF) وجود Playwright. إذا لم يكن Playwright مثبتاً، تُرجع تلك النقاط
خطأ 501 واضحاً.

ما يزال يعمل من دون Playwright:

- لقطات ARIA
- لقطات إمكانية الوصول بنمط الدور (`--interactive`, `--compact`,
  `--depth`, `--efficient`) عند توفر WebSocket لكل علامة تبويب عبر CDP. هذا
  بديل للفحص واكتشاف المراجع؛ ويظل Playwright محرك الإجراءات الأساسي.
- لقطات شاشة الصفحة لمتصفح `openclaw` المُدار عند توفر WebSocket لكل علامة تبويب
  عبر CDP
- لقطات شاشة الصفحة لملفات تعريف `existing-session` / Chrome MCP
- لقطات شاشة `existing-session` المستندة إلى المراجع (`--ref`) من ناتج اللقطة

ما يزال يحتاج إلى Playwright:

- `navigate`
- `act`
- لقطات الذكاء الاصطناعي التي تعتمد على تنسيق لقطة الذكاء الاصطناعي الأصلي في Playwright
- لقطات شاشة العناصر بمحدد CSS ‏(`--element`)
- تصدير PDF كامل للمتصفح

ترفض لقطات شاشة العناصر أيضاً `--full-page`؛ يُرجع المسار `fullPage is
not supported for element screenshots`.

إذا رأيت `Playwright is not available in this gateway build`، فإن حزمة
Gateway تفتقد اعتماد تشغيل المتصفح الأساسي. أعد تثبيت OpenClaw أو حدّثه،
ثم أعد تشغيل Gateway. بالنسبة إلى Docker، ثبّت أيضاً ثنائيات متصفح Chromium
كما هو موضح أدناه.

#### تثبيت Docker Playwright

إذا كان Gateway لديك يعمل في Docker، فتجنب `npx playwright` (تعارضات تجاوز npm).
بالنسبة إلى الصور المخصصة، ادمج Chromium داخل الصورة:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

بالنسبة إلى صورة موجودة، ثبّت عبر CLI المضمن بدلاً من ذلك:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

للاحتفاظ بتنزيلات المتصفح، اضبط `PLAYWRIGHT_BROWSERS_PATH` (على سبيل المثال،
`/home/node/.cache/ms-playwright`) وتأكد من أن `/home/node` محفوظ عبر
`OPENCLAW_HOME_VOLUME` أو ربط تحميل. يكتشف OpenClaw تلقائياً Chromium المحفوظ
على Linux. راجع [Docker](/ar/install/docker).

## كيف يعمل (داخلي)

يقبل خادم تحكم loopback صغير طلبات HTTP ويتصل بالمتصفحات المستندة إلى Chromium عبر CDP. تمر الإجراءات المتقدمة (النقر/الكتابة/اللقطة/PDF) عبر Playwright فوق CDP؛ وعند غياب Playwright، لا تتوفر إلا العمليات غير المعتمدة على Playwright. يرى الوكيل واجهة مستقرة واحدة بينما تتبدل المتصفحات والملفات الشخصية المحلية/البعيدة بحرية تحتها.

## مرجع CLI السريع

تقبل كل الأوامر `--browser-profile <name>` لاستهداف ملف تعريف محدد، و`--json` للحصول على إخراج قابل للقراءة آلياً.

<AccordionGroup>

<Accordion title="الأساسيات: الحالة، علامات التبويب، الفتح/التركيز/الإغلاق">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # تشغيل محلي مُدار بلا واجهة رسومية لمرة واحدة
openclaw browser stop            # يمسح أيضاً المحاكاة في الإرفاق فقط/CDP البعيد
openclaw browser tabs
openclaw browser tab             # اختصار لعلامة التبويب الحالية
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="الفحص: لقطة شاشة، لقطة، وحدة التحكم، الأخطاء، الطلبات">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # أو --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="الإجراءات: التنقل، النقر، الكتابة، السحب، الانتظار، التقييم">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # أو e12 لمراجع الدور
openclaw browser click-coords 120 340        # إحداثيات إطار العرض
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload media://inbound/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="الحالة: ملفات تعريف الارتباط، التخزين، عدم الاتصال، الترويسات، الموقع الجغرافي، الجهاز">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear للإزالة
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

ملاحظات:

- `upload` و`dialog` هما استدعاءان **للتهيئة**؛ شغّلهما قبل النقرة/الضغط الذي يفعّل منتقي الملفات/مربع الحوار. إذا فتح إجراء نافذة مشروطة، تتضمن استجابة الإجراء `blockedByDialog` و`browserState.dialogs.pending`؛ مرّر ذلك `dialogId` للرد مباشرة. تظهر مربعات الحوار التي عولجت خارج OpenClaw تحت `browserState.dialogs.recent`.
- تتطلب `click`/`type`/إلخ وجود `ref` من `snapshot` (رقمي `12`، أو مرجع دور `e12`، أو مرجع ARIA قابل للإجراء `ax12`). محددات CSS غير مدعومة عمداً للإجراءات. استخدم `click-coords` عندما يكون موضع إطار العرض المرئي هو الهدف الموثوق الوحيد.
- مسارات التنزيل والتتبع مقيدة بجذور OpenClaw المؤقتة: `/tmp/openclaw{,/downloads}` (البديل: `${os.tmpdir()}/openclaw/...`).
- يقبل `upload` الملفات من جذر التحميلات المؤقت في OpenClaw والوسائط الواردة المُدارة من
  OpenClaw. يمكن الإشارة إلى الوسائط الواردة المُدارة بصيغة
  `media://inbound/<id>`، أو `media/inbound/<id>` نسبةً إلى صندوق العزل، أو مسار محلول
  داخل دليل الوسائط الواردة المُدار. ما تزال مراجع الوسائط المتداخلة،
  والتنقل عبر المسارات، والروابط الرمزية، والروابط الصلبة، والمسارات المحلية العشوائية مرفوضة.
- يمكن لـ`upload` أيضاً ضبط مدخلات الملفات مباشرة عبر `--input-ref` أو `--element`.

تظل معرفات علامات التبويب والتسميات المستقرة صالحة بعد استبدال هدف Chromium الخام عندما يستطيع OpenClaw
إثبات علامة التبويب البديلة، مثل عنوان URL نفسه أو تحول علامة تبويب قديمة واحدة إلى
علامة تبويب جديدة واحدة بعد إرسال نموذج. ما تزال معرفات الأهداف الخام متقلبة؛ ويفضل استخدام
`suggestedTargetId` من `tabs` في النصوص البرمجية.

نظرة سريعة على أعلام اللقطات:

- `--format ai` (الافتراضي مع Playwright): لقطة ذكاء اصطناعي بمراجع رقمية (`aria-ref="<n>"`).
- `--format aria`: شجرة إمكانية الوصول بمراجع `axN`. عند توفر Playwright، يربط OpenClaw المراجع بمعرفات DOM الخلفية في الصفحة الحية حتى تتمكن الإجراءات اللاحقة من استخدامها؛ وإلا فتعامل مع المخرجات على أنها للفحص فقط.
- `--efficient` (أو `--mode efficient`): إعداد مسبق مدمج للقطة الأدوار. عيّن `browser.snapshotDefaults.mode: "efficient"` لجعل هذا هو الإعداد الافتراضي (انظر [تكوين Gateway](/ar/gateway/configuration-reference#browser)).
- تفرض `--interactive` و`--compact` و`--depth` و`--selector` لقطة أدوار بمراجع `ref=e12`. يقيّد `--frame "<iframe>"` لقطات الأدوار إلى iframe.
- مع Playwright، يضيف `--labels` لقطة شاشة بتسميات مراجع متراكبة
  (يطبع `MEDIA:<path>`) بالإضافة إلى مصفوفة `annotations` تحتوي على مربع
  الإحاطة لكل مرجع. في `screenshot`، تعمل التسميات المدعومة من Playwright مع
  `--full-page` و`--ref` و`--element`؛ وفي `snapshot`، تظل لقطة الشاشة المرافقة
  مقتصرة على منفذ العرض فقط. تعرض ملفات تعريف existing-session/chrome-mcp
  تسميات متراكبة على لقطات شاشة الصفحة، لكنها لا تعيد `annotations` ولا تستخدم مساعد
  إسقاط الصفحة الكاملة/المرجع/العنصر في Playwright. من دون Playwright أو chrome-mcp،
  لا تتوفر لقطات الشاشة الموسومة.
- يضيف `--urls` وجهات الروابط المكتشفة إلى لقطات الذكاء الاصطناعي.

## اللقطات والمراجع

يدعم OpenClaw نمطين من "اللقطات":

- **لقطة الذكاء الاصطناعي (مراجع رقمية)**: `openclaw browser snapshot` (الافتراضي؛ `--format ai`)
  - المخرجات: لقطة نصية تتضمن مراجع رقمية.
  - الإجراءات: `openclaw browser click 12`، `openclaw browser type 23 "hello"`.
  - داخليًا، يتم حل المرجع عبر `aria-ref` في Playwright.

- **لقطة الأدوار (مراجع أدوار مثل `e12`)**: `openclaw browser snapshot --interactive` (أو `--compact` أو `--depth` أو `--selector` أو `--frame`)
  - المخرجات: قائمة/شجرة قائمة على الأدوار مع `[ref=e12]` (واختياريًا `[nth=1]`).
  - الإجراءات: `openclaw browser click e12`، `openclaw browser highlight e12`.
  - داخليًا، يتم حل المرجع عبر `getByRole(...)` (بالإضافة إلى `nth()` للتكرارات).
  - أضف `--labels` لتضمين لقطة شاشة بتسميات `e12` متراكبة. في ملفات التعريف
    المدعومة من Playwright، يعيد هذا أيضًا بيانات وصفية لمربعات الإحاطة لكل مرجع
    (`annotations[]`).
  - أضف `--urls` عندما يكون نص الرابط ملتبسًا ويحتاج الوكيل إلى أهداف
    تنقل ملموسة.

- **لقطة ARIA (مراجع ARIA مثل `ax12`)**: `openclaw browser snapshot --format aria`
  - المخرجات: شجرة إمكانية الوصول كعقد منظمة.
  - الإجراءات: يعمل `openclaw browser click ax12` عندما يستطيع مسار اللقطة ربط
    المرجع عبر Playwright ومعرفات DOM الخلفية في Chrome.
- إذا لم يكن Playwright متوفرًا، يمكن أن تظل لقطات ARIA مفيدة
  للفحص، لكن قد لا تكون المراجع قابلة للتنفيذ. أعد أخذ اللقطة باستخدام `--format ai`
  أو `--interactive` عندما تحتاج إلى مراجع إجراءات.
- إثبات Docker لمسار الرجوع raw-CDP: يبدأ `pnpm test:docker:browser-cdp-snapshot`
  Chromium مع CDP، ويشغّل `browser doctor --deep`، ويتحقق من أن لقطات الأدوار
  تتضمن عناوين URL للروابط، والعناصر القابلة للنقر المرفوعة بالمؤشر، وبيانات iframe الوصفية.

سلوك المراجع:

- المراجع **ليست ثابتة عبر عمليات التنقل**؛ إذا فشل شيء ما، أعد تشغيل `snapshot` واستخدم مرجعًا جديدًا.
- يعيد `/act` قيمة `targetId` الخام الحالية بعد الاستبدال الناتج عن الإجراء
  عندما يستطيع إثبات علامة التبويب البديلة. استمر في استخدام معرفات/تسميات علامات التبويب الثابتة
  للأوامر اللاحقة.
- إذا أُخذت لقطة الأدوار باستخدام `--frame`، فستكون مراجع الأدوار مقيّدة بذلك iframe حتى لقطة الأدوار التالية.
- تفشل مراجع `axN` المجهولة أو القديمة سريعًا بدلًا من السقوط إلى
  محدد `aria-ref` في Playwright. شغّل لقطة جديدة على علامة التبويب نفسها عندما
  يحدث ذلك.

## تعزيزات الانتظار

يمكنك الانتظار لأكثر من مجرد الوقت/النص:

- انتظر عنوان URL (يدعم Playwright أنماط glob):
  - `openclaw browser wait --url "**/dash"`
- انتظر حالة التحميل:
  - `openclaw browser wait --load networkidle`
  - مدعوم في ملفات تعريف `openclaw` المُدارة وملفات تعريف CDP الخام/البعيدة. ترفض ملفات تعريف `user` و`existing-session` قيمة `networkidle`؛ استخدم `--url` أو `--text` أو محددًا أو عمليات انتظار `--fn` هناك.
- انتظر شرط JS:
  - `openclaw browser wait --fn "window.ready===true"`
- انتظر حتى يصبح محدد مرئيًا:
  - `openclaw browser wait "#main"`

يمكن دمج هذه الخيارات:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## مسارات عمل التصحيح

عندما يفشل إجراء (مثلًا "not visible" أو "strict mode violation" أو "covered"):

1. `openclaw browser snapshot --interactive`
2. استخدم `click <ref>` / `type <ref>` (فضّل مراجع الأدوار في الوضع التفاعلي)
3. إذا ظل يفشل: استخدم `openclaw browser highlight <ref>` لمعرفة ما يستهدفه Playwright
4. إذا تصرفت الصفحة بشكل غريب:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. للتصحيح العميق: سجّل تتبعًا:
   - `openclaw browser trace start`
   - أعد إنتاج المشكلة
   - `openclaw browser trace stop` (يطبع `TRACE:<path>`)

## مخرجات JSON

`--json` مخصص للبرمجة النصية والأدوات المنظمة.

أمثلة:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

تتضمن لقطات الأدوار في JSON قيمة `refs` بالإضافة إلى كتلة `stats` صغيرة (lines/chars/refs/interactive) حتى تتمكن الأدوات من الاستدلال على حجم الحمولة وكثافتها.

## مفاتيح الحالة والبيئة

هذه مفيدة لمسارات عمل "اجعل الموقع يتصرف مثل X":

- ملفات تعريف الارتباط: `cookies`، `cookies set`، `cookies clear`
- التخزين: `storage local|session get|set|clear`
- عدم الاتصال: `set offline on|off`
- الرؤوس: `set headers --headers-json '{"X-Debug":"1"}'` (لا يزال `set headers --json '{"X-Debug":"1"}'` القديم مدعومًا)
- مصادقة HTTP الأساسية: `set credentials user pass` (أو `--clear`)
- الموقع الجغرافي: `set geo <lat> <lon> --origin "https://example.com"` (أو `--clear`)
- الوسائط: `set media dark|light|no-preference|none`
- المنطقة الزمنية / الإعدادات المحلية: `set timezone ...`، `set locale ...`
- الجهاز / منفذ العرض:
  - `set device "iPhone 14"` (إعدادات Playwright المسبقة للأجهزة)
  - `set viewport 1280 720`

## الأمان والخصوصية

- قد يحتوي ملف تعريف متصفح openclaw على جلسات مسجلة الدخول؛ تعامل معه كبيانات حساسة.
- ينفذ `browser act kind=evaluate` / `openclaw browser evaluate` و`wait --fn`
  JavaScript عشوائيًا في سياق الصفحة. يمكن أن يوجه حقن المطالبات
  هذا السلوك. عطّله باستخدام `browser.evaluateEnabled=false` إذا لم تكن بحاجة إليه.
- يقبل `openclaw browser evaluate --fn` مصدر دالة، أو تعبيرًا، أو
  جسم عبارة. تُغلّف أجسام العبارات كدوال غير متزامنة، لذا استخدم
  `return` للقيمة التي تريد استعادتها. استخدم `--timeout-ms <ms>` عندما قد تحتاج
  الدالة في جانب الصفحة إلى وقت أطول من مهلة التقييم الافتراضية.
- لتسجيلات الدخول وملاحظات مكافحة الروبوتات (X/Twitter، وما إلى ذلك)، راجع [تسجيل الدخول عبر المتصفح + النشر على X/Twitter](/ar/tools/browser-login).
- أبقِ مضيف Gateway/node خاصًا (loopback أو tailnet-only).
- نقاط نهاية CDP البعيدة قوية؛ أنشئ لها نفقًا واحمها.

مثال الوضع الصارم (حظر الوجهات الخاصة/الداخلية افتراضيًا):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## ذات صلة

- [المتصفح](/ar/tools/browser) - نظرة عامة، التكوين، ملفات التعريف، الأمان
- [تسجيل الدخول عبر المتصفح](/ar/tools/browser-login) - تسجيل الدخول إلى المواقع
- [استكشاف أخطاء المتصفح على Linux وإصلاحها](/ar/tools/browser-linux-troubleshooting)
- [استكشاف أخطاء المتصفح على WSL2 وإصلاحها عبر CDP البعيد في Windows](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
