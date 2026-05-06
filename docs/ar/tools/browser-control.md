---
read_when:
    - كتابة السكربتات أو تصحيح أخطاء متصفح الوكيل عبر واجهة API للتحكم المحلي
    - هل تبحث عن مرجع CLI الخاص بـ `openclaw browser`
    - إضافة أتمتة مخصصة للمتصفح باستخدام اللقطات والمراجع
summary: واجهة برمجة تطبيقات التحكم بالمتصفح في OpenClaw، ومرجع CLI، وإجراءات البرمجة النصية
title: واجهة برمجة تطبيقات التحكم في المتصفح
x-i18n:
    generated_at: "2026-05-06T08:15:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5367561122448fa21037c9125581eb38b7f01413310e9f9ca5880942acfffa5d
    source_path: tools/browser-control.md
    workflow: 16
---

للإعداد والتكوين واستكشاف الأخطاء وإصلاحها، راجع [Browser](/ar/tools/browser).
هذه الصفحة هي المرجع لواجهة HTTP API المحلية للتحكم، وواجهة `openclaw browser`
CLI، وأنماط البرمجة النصية (اللقطات، والمراجع، والانتظار، وتدفقات التصحيح).

## واجهة Control API (اختيارية)

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
تشغيلاً مؤقتاً لمرة واحدة دون واجهة للملفات الشخصية المحلية المُدارة، من دون تغيير تكوين
المتصفح المحفوظ؛ وترفض ملفات التعريف المخصصة للإرفاق فقط، وCDP البعيد، والجلسات الحالية
هذا التجاوز لأن OpenClaw لا يشغّل عمليات المتصفح تلك.

إذا تم تكوين مصادقة Gateway بسر مشترك، فمسارات HTTP الخاصة بالمتصفح تتطلب المصادقة أيضاً:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` أو مصادقة HTTP Basic باستخدام كلمة المرور تلك

ملاحظات:

- واجهة API المستقلة هذه لمتصفح local loopback لا تستهلك ترويسات هوية الوكيل الموثوق أو
  Tailscale Serve.
- إذا كان `gateway.auth.mode` هو `none` أو `trusted-proxy`، فإن مسارات متصفح local loopback
  هذه لا ترث أوضاع الهوية تلك؛ أبقِها مقتصرة على local loopback فقط.

### عقد أخطاء `/act`

يستخدم `POST /act` استجابة خطأ منظمة لإخفاقات التحقق على مستوى المسار
والسياسة:

```json
{ "error": "<message>", "code": "ACT_*" }
```

قيم `code` الحالية:

- `ACT_KIND_REQUIRED` (HTTP 400): قيمة `kind` مفقودة أو غير معروفة.
- `ACT_INVALID_REQUEST` (HTTP 400): فشلت حمولة الإجراء في التطبيع أو التحقق.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): تم استخدام `selector` مع نوع إجراء غير مدعوم.
- `ACT_EVALUATE_DISABLED` (HTTP 403): تم تعطيل `evaluate` (أو `wait --fn`) عبر التكوين.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): يتعارض `targetId` على المستوى الأعلى أو ضمن دفعة مع هدف الطلب.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): الإجراء غير مدعوم لملفات تعريف الجلسات الحالية.

قد تظل إخفاقات وقت التشغيل الأخرى تُرجع `{ "error": "<message>" }` من دون حقل
`code`.

### متطلب Playwright

تتطلب بعض الميزات (التنقل/الإجراء/لقطة AI/لقطة الدور، ولقطات شاشة العناصر،
وPDF) وجود Playwright. إذا لم يكن Playwright مثبتاً، فستُرجع نقاط النهاية هذه
خطأ 501 واضحاً.

ما يظل يعمل من دون Playwright:

- لقطات ARIA
- لقطات إمكانية الوصول بأسلوب الأدوار (`--interactive`, `--compact`,
  `--depth`, `--efficient`) عندما يكون WebSocket لكل علامة تبويب عبر CDP متاحاً. هذا
  مسار احتياطي للفحص واكتشاف المراجع؛ يظل Playwright محرك الإجراءات الأساسي.
- لقطات شاشة الصفحة لمتصفح `openclaw` المُدار عندما يكون WebSocket لكل علامة تبويب عبر CDP
  متاحاً
- لقطات شاشة الصفحة لملفات تعريف `existing-session` / Chrome MCP
- لقطات شاشة `existing-session` المستندة إلى المراجع (`--ref`) من مخرجات اللقطة

ما لا يزال يحتاج إلى Playwright:

- `navigate`
- `act`
- لقطات AI التي تعتمد على تنسيق لقطة AI الأصلي في Playwright
- لقطات شاشة عناصر محدد CSS (`--element`)
- تصدير PDF كامل للمتصفح

ترفض لقطات شاشة العناصر أيضاً `--full-page`؛ يُرجع المسار `fullPage is
not supported for element screenshots`.

إذا رأيت `Playwright is not available in this gateway build`، فهذا يعني أن حزمة
Gateway تفتقد اعتماد وقت تشغيل المتصفح الأساسي. أعد تثبيت OpenClaw أو حدّثه،
ثم أعد تشغيل Gateway. بالنسبة إلى Docker، ثبّت أيضاً ملفات Chromium
الثنائية كما هو موضح أدناه.

#### تثبيت Docker Playwright

إذا كان Gateway يعمل داخل Docker، فتجنب `npx playwright` (لتعارضات تجاوز npm).
استخدم CLI المضمّن بدلاً من ذلك:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

للاحتفاظ بتنزيلات المتصفح، اضبط `PLAYWRIGHT_BROWSERS_PATH` (على سبيل المثال،
`/home/node/.cache/ms-playwright`) وتأكد من أن `/home/node` محفوظ عبر
`OPENCLAW_HOME_VOLUME` أو ربط تحميل. راجع [Docker](/ar/install/docker).

## كيف يعمل (داخلي)

يقبل خادم تحكم صغير عبر local loopback طلبات HTTP ويتصل بالمتصفحات المستندة إلى Chromium عبر CDP. تمر الإجراءات المتقدمة (النقر/الكتابة/اللقطة/PDF) عبر Playwright فوق CDP؛ وعند غياب Playwright، لا تتوفر إلا العمليات غير المعتمدة على Playwright. يرى الوكيل واجهة مستقرة واحدة بينما يمكن تبديل المتصفحات والملفات الشخصية المحلية/البعيدة بحرية تحتها.

## مرجع سريع لـ CLI

تقبل جميع الأوامر `--browser-profile <name>` لاستهداف ملف تعريف محدد، و`--json` لمخرجات قابلة للقراءة آلياً.

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

- `upload` و`dialog` هما استدعاءان **للتهيئة**؛ شغّلهما قبل النقرة/الضغط الذي يفعّل منتقي الملفات/مربع الحوار.
- تتطلب `click`/`type`/وما إلى ذلك قيمة `ref` من `snapshot` (رقمية `12`، أو مرجع دور `e12`، أو مرجع ARIA قابل للإجراء `ax12`). محددات CSS غير مدعومة قصداً للإجراءات. استخدم `click-coords` عندما يكون موضع منفذ العرض المرئي هو الهدف الموثوق الوحيد.
- مسارات التنزيل والتتبع والتحميل مقيدة بجذور OpenClaw المؤقتة: `/tmp/openclaw{,/downloads,/uploads}` (الاحتياطي: `${os.tmpdir()}/openclaw/...`).
- يمكن لـ `upload` أيضاً ضبط مدخلات الملفات مباشرة عبر `--input-ref` أو `--element`.

تبقى معرّفات وعناوين علامات التبويب المستقرة بعد استبدال هدف Chromium الخام عندما يستطيع OpenClaw
إثبات علامة التبويب البديلة، مثل عنوان URL نفسه أو تحوّل علامة تبويب قديمة واحدة إلى
علامة تبويب جديدة واحدة بعد إرسال نموذج. تظل معرّفات الأهداف الخام متقلبة؛ فضّل
`suggestedTargetId` من `tabs` في السكربتات.

نظرة سريعة على أعلام اللقطات:

- `--format ai` (الافتراضي مع Playwright): لقطة AI بمراجع رقمية (`aria-ref="<n>"`).
- `--format aria`: شجرة إمكانية الوصول بمراجع `axN`. عندما يكون Playwright متاحاً، يربط OpenClaw المراجع بمعرّفات DOM الخلفية في الصفحة الحية بحيث يمكن لإجراءات المتابعة استخدامها؛ وإلا فتعامل مع المخرجات على أنها للفحص فقط.
- `--efficient` (أو `--mode efficient`): إعداد مسبق مضغوط للقطة الدور. اضبط `browser.snapshotDefaults.mode: "efficient"` لجعل هذا هو الافتراضي (راجع [تكوين Gateway](/ar/gateway/configuration-reference#browser)).
- تفرض `--interactive`, `--compact`, `--depth`, `--selector` لقطة دور بمراجع `ref=e12`. يقيّد `--frame "<iframe>"` لقطات الأدوار إلى iframe.
- تضيف `--labels` لقطة شاشة لمنفذ العرض فقط مع تسميات مراجع متراكبة (يطبع `MEDIA:<path>`).
- تضيف `--urls` وجهات الروابط المكتشفة إلى لقطات AI.

## اللقطات والمراجع

يدعم OpenClaw نمطين من "اللقطات":

- **لقطة AI (مراجع رقمية)**: `openclaw browser snapshot` (افتراضي؛ `--format ai`)
  - المخرجات: لقطة نصية تتضمن مراجع رقمية.
  - الإجراءات: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - داخلياً، يتم حل المرجع عبر `aria-ref` في Playwright.

- **لقطة الدور (مراجع دور مثل `e12`)**: `openclaw browser snapshot --interactive` (أو `--compact`, `--depth`, `--selector`, `--frame`)
  - المخرجات: قائمة/شجرة قائمة على الأدوار مع `[ref=e12]` (و`[nth=1]` اختيارياً).
  - الإجراءات: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - داخلياً، يتم حل المرجع عبر `getByRole(...)` (إضافة إلى `nth()` للتكرارات).
  - أضف `--labels` لتضمين لقطة شاشة لمنفذ العرض مع تسميات `e12` متراكبة.
  - أضف `--urls` عندما يكون نص الرابط ملتبساً ويحتاج الوكيل إلى
    أهداف تنقل ملموسة.

- **لقطة ARIA (مراجع ARIA مثل `ax12`)**: `openclaw browser snapshot --format aria`
  - المخرجات: شجرة إمكانية الوصول كعُقد منظمة.
  - الإجراءات: يعمل `openclaw browser click ax12` عندما يستطيع مسار اللقطة ربط
    المرجع عبر Playwright ومعرّفات DOM الخلفية في Chrome.
- إذا لم يكن Playwright متاحاً، فقد تظل لقطات ARIA مفيدة
  للفحص، لكن المراجع قد لا تكون قابلة للإجراء. أعد أخذ اللقطة باستخدام `--format ai`
  أو `--interactive` عندما تحتاج إلى مراجع إجراءات.
- إثبات Docker لمسار raw-CDP الاحتياطي: يبدأ `pnpm test:docker:browser-cdp-snapshot`
  تشغيل Chromium مع CDP، ويشغّل `browser doctor --deep`، ويتحقق من أن لقطات الدور
  تتضمن عناوين URL للروابط، والعناصر القابلة للنقر المرقّاة بالمؤشر، وبيانات iframe الوصفية.

سلوك المراجع:

- المراجع **ليست مستقرة عبر التنقلات**؛ إذا فشل شيء ما، فأعد تشغيل `snapshot` واستخدم مرجعًا جديدًا.
- يعيد `/act` قيمة `targetId` الخام الحالية بعد الاستبدال الناتج عن الإجراء
  عندما يمكنه إثبات علامة تبويب الاستبدال. استمر في استخدام معرفات/تسميات علامات التبويب المستقرة
  لأوامر المتابعة.
- إذا أُخذت لقطة الدور باستخدام `--frame`، تكون مراجع الدور محصورة في iframe ذلك حتى لقطة الدور التالية.
- تفشل مراجع `axN` غير المعروفة أو القديمة بسرعة بدلًا من السقوط إلى
  محدد `aria-ref` الخاص بـ Playwright. شغّل لقطة جديدة على علامة التبويب نفسها عندما
  يحدث ذلك.

## إمكانات انتظار معززة

يمكنك الانتظار لأكثر من مجرد الوقت/النص:

- الانتظار حتى URL (يدعم Playwright أنماط glob):
  - `openclaw browser wait --url "**/dash"`
- الانتظار حتى حالة التحميل:
  - `openclaw browser wait --load networkidle`
- الانتظار حتى دالة شرطية في JS:
  - `openclaw browser wait --fn "window.ready===true"`
- الانتظار حتى يصبح محدد مرئيًا:
  - `openclaw browser wait "#main"`

يمكن دمج هذه الخيارات:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## سير عمل تصحيح الأخطاء

عند فشل إجراء ما (مثلًا: "not visible"، "strict mode violation"، "covered"):

1. `openclaw browser snapshot --interactive`
2. استخدم `click <ref>` / `type <ref>` (فضّل مراجع الدور في الوضع التفاعلي)
3. إذا استمر الفشل: `openclaw browser highlight <ref>` لمعرفة ما يستهدفه Playwright
4. إذا تصرفت الصفحة بطريقة غريبة:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. لتصحيح أعمق: سجّل تتبعًا:
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

تتضمن لقطات الدور في JSON قيمة `refs` إضافة إلى كتلة `stats` صغيرة (lines/chars/refs/interactive) حتى تتمكن الأدوات من تحليل حجم الحمولة وكثافتها.

## الحالة وخيارات ضبط البيئة

هذه مفيدة لسير عمل "اجعل الموقع يتصرف مثل X":

- ملفات تعريف الارتباط: `cookies`، و`cookies set`، و`cookies clear`
- التخزين: `storage local|session get|set|clear`
- دون اتصال: `set offline on|off`
- الرؤوس: `set headers --headers-json '{"X-Debug":"1"}'` (لا يزال الشكل القديم `set headers --json '{"X-Debug":"1"}'` مدعومًا)
- مصادقة HTTP الأساسية: `set credentials user pass` (أو `--clear`)
- الموقع الجغرافي: `set geo <lat> <lon> --origin "https://example.com"` (أو `--clear`)
- الوسائط: `set media dark|light|no-preference|none`
- المنطقة الزمنية / اللغة المحلية: `set timezone ...`، و`set locale ...`
- الجهاز / إطار العرض:
  - `set device "iPhone 14"` (إعدادات أجهزة Playwright المسبقة)
  - `set viewport 1280 720`

## الأمان والخصوصية

- قد يحتوي ملف تعريف متصفح openclaw على جلسات مسجّل دخولها؛ عامله كبيانات حساسة.
- ينفذ `browser act kind=evaluate` / `openclaw browser evaluate` و`wait --fn`
  JavaScript عشوائيًا داخل سياق الصفحة. يمكن لحقن التعليمات أن يوجّه
  ذلك. عطّله باستخدام `browser.evaluateEnabled=false` إذا لم تكن بحاجة إليه.
- لملاحظات تسجيل الدخول ومكافحة الروبوتات (X/Twitter، وما إلى ذلك)، راجع [تسجيل الدخول عبر المتصفح + النشر على X/Twitter](/ar/tools/browser-login).
- أبقِ مضيف Gateway/node خاصًا (local loopback أو tailnet فقط).
- نقاط نهاية CDP البعيدة قوية؛ استخدم نفقًا واحمها.

مثال للوضع الصارم (حظر الوجهات الخاصة/الداخلية افتراضيًا):

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

- [المتصفح](/ar/tools/browser) - نظرة عامة، التهيئة، ملفات التعريف، الأمان
- [تسجيل الدخول عبر المتصفح](/ar/tools/browser-login) - تسجيل الدخول إلى المواقع
- [استكشاف أخطاء المتصفح على Linux وإصلاحها](/ar/tools/browser-linux-troubleshooting)
- [استكشاف أخطاء المتصفح على WSL2 وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
