---
read_when:
    - كتابة سكربتات لمتصفح الوكيل أو تصحيح أخطائه عبر واجهة API للتحكم المحلي
    - البحث عن مرجع CLI الخاص بـ `openclaw browser`
    - إضافة أتمتة متصفح مخصصة باستخدام اللقطات والمراجع
summary: واجهة برمجة تطبيقات التحكم في المتصفح في OpenClaw ومرجع CLI وإجراءات البرمجة النصية
title: واجهة برمجة تطبيقات التحكم في المتصفح
x-i18n:
    generated_at: "2026-05-02T07:44:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef996319c09bfa8de9b5c3a340c68496ac3698295b62f4f07c79f3e233eda2a2
    source_path: tools/browser-control.md
    workflow: 16
---

لإعداد والتكوين واستكشاف الأخطاء وإصلاحها، راجع [المتصفح](/ar/tools/browser).
هذه الصفحة هي المرجع لواجهة HTTP API المحلية للتحكم، وCLI `openclaw browser`،
وأنماط البرمجة النصية (اللقطات، والمراجع، والانتظار، وتدفقات التصحيح).

## واجهة API للتحكم (اختيارية)

للتكاملات المحلية فقط، يوفّر Gateway واجهة HTTP API صغيرة عبر local loopback:

- الحالة/البدء/الإيقاف: `GET /`, `POST /start`, `POST /stop`
- علامات التبويب: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- اللقطة/لقطة الشاشة: `GET /snapshot`, `POST /screenshot`
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

تقبل جميع نقاط النهاية `?profile=<name>`. يطلب `POST /start?headless=true`
تشغيلاً مؤقتاً لمرة واحدة بلا واجهة رسومية للملفات الشخصية المحلية المُدارة دون تغيير
تكوين المتصفح المحفوظ؛ وترفض الملفات الشخصية الخاصة بالإرفاق فقط، وCDP البعيد،
والجلسات الموجودة ذلك التجاوز لأن OpenClaw لا يشغّل عمليات المتصفح هذه.

إذا تم تكوين مصادقة Gateway بسر مشترك، فستتطلب مسارات HTTP الخاصة بالمتصفح المصادقة أيضاً:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` أو مصادقة HTTP Basic باستخدام كلمة المرور تلك

ملاحظات:

- واجهة متصفح local loopback المستقلة هذه **لا** تستهلك ترويسات الهوية الخاصة بالوكيل الموثوق أو
  Tailscale Serve.
- إذا كانت `gateway.auth.mode` تساوي `none` أو `trusted-proxy`، فلن ترث مسارات متصفح
  local loopback هذه أوضاع حمل الهوية تلك؛ أبقها مقتصرة على local loopback.

### عقد أخطاء `/act`

يستخدم `POST /act` استجابة خطأ منظّمة لفشل التحقق على مستوى المسار
وفشل السياسات:

```json
{ "error": "<message>", "code": "ACT_*" }
```

قيم `code` الحالية:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` مفقود أو غير معروف.
- `ACT_INVALID_REQUEST` (HTTP 400): فشل تطبيع حمولة الإجراء أو التحقق منها.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): تم استخدام `selector` مع نوع إجراء غير مدعوم.
- `ACT_EVALUATE_DISABLED` (HTTP 403): تم تعطيل `evaluate` (أو `wait --fn`) بواسطة التكوين.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): يتعارض `targetId` على المستوى الأعلى أو ضمن دفعة مع هدف الطلب.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): الإجراء غير مدعوم لملفات الجلسات الموجودة.

قد تظل حالات فشل وقت التشغيل الأخرى تُرجع `{ "error": "<message>" }` دون حقل
`code`.

### متطلب Playwright

تتطلب بعض الميزات (التنقل/الإجراء/لقطة AI/لقطة الدور، ولقطات شاشة العناصر،
وPDF) وجود Playwright. إذا لم يكن Playwright مثبتاً، فستُرجع نقاط النهاية هذه
خطأ 501 واضحاً.

ما يظل يعمل دون Playwright:

- لقطات ARIA
- لقطات إمكانية الوصول بنمط الدور (`--interactive`, `--compact`,
  `--depth`, `--efficient`) عند توفر CDP WebSocket لكل علامة تبويب. هذا
  مسار احتياطي للفحص واكتشاف المراجع؛ ويظل Playwright محرك الإجراءات الأساسي.
- لقطات شاشة الصفحة لمتصفح `openclaw` المُدار عند توفر CDP
  WebSocket لكل علامة تبويب
- لقطات شاشة الصفحة لملفات `existing-session` / Chrome MCP الشخصية
- لقطات شاشة `existing-session` المعتمدة على المراجع (`--ref`) من مخرجات اللقطة

ما لا يزال يحتاج إلى Playwright:

- `navigate`
- `act`
- لقطات AI التي تعتمد على تنسيق لقطة AI الأصلي في Playwright
- لقطات شاشة عناصر محددات CSS (`--element`)
- تصدير PDF كامل للمتصفح

ترفض لقطات شاشة العناصر أيضاً `--full-page`؛ ويُرجع المسار `fullPage is
not supported for element screenshots`.

إذا رأيت `Playwright is not available in this gateway build`، فهذا يعني أن حزمة
Gateway تفتقد اعتماد وقت تشغيل المتصفح الأساسي. أعد تثبيت OpenClaw أو حدّثه،
ثم أعد تشغيل Gateway. بالنسبة إلى Docker، ثبّت أيضاً ثنائيات متصفح Chromium
كما هو موضح أدناه.

#### تثبيت Playwright في Docker

إذا كان Gateway لديك يعمل في Docker، فتجنب `npx playwright` (تعارضات تجاوز npm).
استخدم CLI المضمّن بدلاً من ذلك:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

للاحتفاظ بتنزيلات المتصفح، اضبط `PLAYWRIGHT_BROWSERS_PATH` (على سبيل المثال،
`/home/node/.cache/ms-playwright`) وتأكد من الاحتفاظ بـ `/home/node` عبر
`OPENCLAW_HOME_VOLUME` أو ربط تحميل. راجع [Docker](/ar/install/docker).

## كيف يعمل (داخلي)

يقبل خادم تحكم صغير عبر local loopback طلبات HTTP ويتصل بالمتصفحات المستندة إلى Chromium عبر CDP. تمر الإجراءات المتقدمة (النقر/الكتابة/اللقطة/PDF) عبر Playwright فوق CDP؛ وعند غياب Playwright، لا تتوفر إلا العمليات غير المعتمدة على Playwright. يرى الوكيل واجهة مستقرة واحدة بينما تتبدل المتصفحات والملفات الشخصية المحلية/البعيدة بحرية تحتها.

## مرجع CLI سريع

تقبل جميع الأوامر `--browser-profile <name>` لاستهداف ملف شخصي محدد، و`--json` للإخراج القابل للقراءة آلياً.

<AccordionGroup>

<Accordion title="Basics: status, tabs, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # one-shot local managed headless launch
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspection: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
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

<Accordion title="Actions: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
openclaw browser click-coords 120 340        # viewport coordinates
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="State: cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

ملاحظات:

- `upload` و`dialog` هما استدعاءا **تجهيز**؛ شغّلهما قبل النقرة/الضغطة التي تفتح منتقي الملفات/مربع الحوار.
- تتطلب `click`/`type`/إلخ قيمة `ref` من `snapshot` (رقمية `12`، أو مرجع دور `e12`، أو مرجع ARIA قابل للتنفيذ `ax12`). لا تُدعم محددات CSS للإجراءات عمداً. استخدم `click-coords` عندما يكون موضع منفذ العرض المرئي هو الهدف الوحيد الموثوق.
- تقتصر مسارات التنزيل والتتبع والرفع على جذور OpenClaw المؤقتة: `/tmp/openclaw{,/downloads,/uploads}` (المسار الاحتياطي: `${os.tmpdir()}/openclaw/...`).
- يستطيع `upload` أيضاً ضبط مدخلات الملفات مباشرة عبر `--input-ref` أو `--element`.

تظل معرّفات علامات التبويب والتسميات المستقرة صالحة بعد استبدال هدف Chromium الخام عندما يستطيع OpenClaw
إثبات علامة التبويب البديلة، مثل عنوان URL نفسه أو تحوّل علامة تبويب قديمة واحدة إلى
علامة تبويب جديدة واحدة بعد إرسال نموذج. تظل معرّفات الأهداف الخام متقلبة؛ فضّل
`suggestedTargetId` من `tabs` في السكربتات.

نظرة سريعة على أعلام اللقطات:

- `--format ai` (الافتراضي مع Playwright): لقطة AI بمراجع رقمية (`aria-ref="<n>"`).
- `--format aria`: شجرة إمكانية الوصول بمراجع `axN`. عندما يكون Playwright متاحاً، يربط OpenClaw المراجع بمعرّفات DOM الخلفية في الصفحة الحية كي تتمكن الإجراءات اللاحقة من استخدامها؛ وإلا فتعامل مع المخرجات كفحص فقط.
- `--efficient` (أو `--mode efficient`): إعداد مسبق مضغوط للقطة الدور. اضبط `browser.snapshotDefaults.mode: "efficient"` لجعل هذا هو الافتراضي (راجع [تكوين Gateway](/ar/gateway/configuration-reference#browser)).
- يفرض `--interactive` و`--compact` و`--depth` و`--selector` لقطة دور بمراجع `ref=e12`. ويقصر `--frame "<iframe>"` لقطات الدور على iframe.
- يضيف `--labels` لقطة شاشة لمنفذ العرض فقط مع تسميات مراجع متراكبة (يطبع `MEDIA:<path>`).
- يضيف `--urls` وجهات الروابط المكتشفة إلى لقطات AI.

## اللقطات والمراجع

يدعم OpenClaw نمطين من “اللقطات”:

- **لقطة AI (مراجع رقمية)**: `openclaw browser snapshot` (افتراضي؛ `--format ai`)
  - الإخراج: لقطة نصية تتضمن مراجع رقمية.
  - الإجراءات: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - داخلياً، يُحل المرجع عبر `aria-ref` في Playwright.

- **لقطة الدور (مراجع الدور مثل `e12`)**: `openclaw browser snapshot --interactive` (أو `--compact`, `--depth`, `--selector`, `--frame`)
  - الإخراج: قائمة/شجرة مستندة إلى الدور مع `[ref=e12]` (و`[nth=1]` اختياري).
  - الإجراءات: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - داخلياً، يُحل المرجع عبر `getByRole(...)` (مع `nth()` للتكرارات).
  - أضف `--labels` لتضمين لقطة شاشة لمنفذ العرض مع تسميات `e12` متراكبة.
  - أضف `--urls` عندما يكون نص الرابط ملتبساً ويحتاج الوكيل إلى
    أهداف تنقل ملموسة.

- **لقطة ARIA (مراجع ARIA مثل `ax12`)**: `openclaw browser snapshot --format aria`
  - الإخراج: شجرة إمكانية الوصول كعُقد منظّمة.
  - الإجراءات: يعمل `openclaw browser click ax12` عندما يستطيع مسار اللقطة ربط
    المرجع عبر Playwright ومعرّفات DOM الخلفية في Chrome.
- إذا لم يكن Playwright متاحاً، قد تظل لقطات ARIA مفيدة
  للفحص، لكن المراجع قد لا تكون قابلة للتنفيذ. أعد التقاط اللقطة باستخدام `--format ai`
  أو `--interactive` عندما تحتاج إلى مراجع إجراءات.
- إثبات Docker لمسار raw-CDP الاحتياطي: `pnpm test:docker:browser-cdp-snapshot`
  يشغّل Chromium مع CDP، ويشغّل `browser doctor --deep`، ويتحقق من أن لقطات الدور
  تتضمن عناوين URL للروابط، والعناصر القابلة للنقر التي تمت ترقيتها بالمؤشر، وبيانات iframe الوصفية.

سلوك المراجع:

- المراجع **ليست مستقرة عبر عمليات التنقل**؛ إذا فشل شيء ما، أعد تشغيل `snapshot` واستخدم مرجعًا جديدًا.
- يعيد `/act` قيمة `targetId` الخام الحالية بعد الاستبدال الناتج عن الإجراء
  عندما يستطيع إثبات تبويب الاستبدال. واصل استخدام معرّفات/تسميات التبويبات المستقرة
  لأوامر المتابعة.
- إذا أُخذت لقطة الدور باستخدام `--frame`، فستكون مراجع الدور محصورة في ذلك iframe حتى لقطة الدور التالية.
- تفشل مراجع `axN` غير المعروفة أو القديمة بسرعة بدلًا من الرجوع إلى محدد
  `aria-ref` في Playwright. شغّل لقطة جديدة على التبويب نفسه عندما
  يحدث ذلك.

## تحسينات الانتظار

يمكنك الانتظار لأكثر من مجرد الوقت/النص:

- انتظر URL (يدعم Playwright الأنماط العامة):
  - `openclaw browser wait --url "**/dash"`
- انتظر حالة التحميل:
  - `openclaw browser wait --load networkidle`
- انتظر دالة JS شرطية:
  - `openclaw browser wait --fn "window.ready===true"`
- انتظر حتى يصبح المحدد مرئيًا:
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

عندما يفشل إجراء (مثلًا: "غير مرئي"، "انتهاك الوضع الصارم"، "مغطى"):

1. `openclaw browser snapshot --interactive`
2. استخدم `click <ref>` / `type <ref>` (فضّل مراجع الدور في الوضع التفاعلي)
3. إذا استمر الفشل: `openclaw browser highlight <ref>` لمعرفة ما يستهدفه Playwright
4. إذا تصرفت الصفحة بشكل غريب:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. للتصحيح المتعمق: سجّل trace:
   - `openclaw browser trace start`
   - أعد إنتاج المشكلة
   - `openclaw browser trace stop` (يطبع `TRACE:<path>`)

## إخراج JSON

`--json` مخصص للبرمجة النصية والأدوات المنظمة.

أمثلة:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

تتضمن لقطات الدور في JSON الحقل `refs` بالإضافة إلى كتلة `stats` صغيرة (lines/chars/refs/interactive) حتى تتمكن الأدوات من الاستدلال على حجم الحمولة وكثافتها.

## مفاتيح الحالة والبيئة

هذه مفيدة لمسارات عمل "اجعل الموقع يتصرف مثل X":

- ملفات تعريف الارتباط: `cookies`، `cookies set`، `cookies clear`
- التخزين: `storage local|session get|set|clear`
- دون اتصال: `set offline on|off`
- الرؤوس: `set headers --headers-json '{"X-Debug":"1"}'` (لا يزال `set headers --json '{"X-Debug":"1"}'` القديم مدعومًا)
- مصادقة HTTP الأساسية: `set credentials user pass` (أو `--clear`)
- تحديد الموقع الجغرافي: `set geo <lat> <lon> --origin "https://example.com"` (أو `--clear`)
- الوسائط: `set media dark|light|no-preference|none`
- المنطقة الزمنية / اللغة المحلية: `set timezone ...`، `set locale ...`
- الجهاز / إطار العرض:
  - `set device "iPhone 14"` (إعدادات أجهزة Playwright المسبقة)
  - `set viewport 1280 720`

## الأمان والخصوصية

- قد يحتوي ملف تعريف متصفح openclaw على جلسات مسجّل الدخول؛ عامله كمحتوى حساس.
- ينفذ `browser act kind=evaluate` / `openclaw browser evaluate` و `wait --fn`
  JavaScript اعتباطيًا في سياق الصفحة. يمكن لحقن المطالبات أن يوجه
  هذا. عطّله باستخدام `browser.evaluateEnabled=false` إذا لم تكن تحتاج إليه.
- لتسجيل الدخول وملاحظات مكافحة الروبوتات (X/Twitter، إلخ)، راجع [تسجيل دخول المتصفح + النشر على X/Twitter](/ar/tools/browser-login).
- أبقِ مضيف Gateway/node خاصًا (loopback أو tailnet فقط).
- نقاط نهاية CDP البعيدة قوية؛ أنشئ نفقًا لها واحمها.

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

## ذو صلة

- [المتصفح](/ar/tools/browser) — نظرة عامة، التهيئة، الملفات الشخصية، الأمان
- [تسجيل دخول المتصفح](/ar/tools/browser-login) — تسجيل الدخول إلى المواقع
- [استكشاف أخطاء المتصفح على Linux وإصلاحها](/ar/tools/browser-linux-troubleshooting)
- [استكشاف أخطاء المتصفح على WSL2 وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
