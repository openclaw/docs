---
read_when:
    - أتمتة متصفح الوكيل أو تصحيحه عبر واجهة API للتحكم المحلي
    - هل تبحث عن مرجع CLI الخاص بـ `openclaw browser`
    - إضافة أتمتة مخصصة للمتصفح باستخدام اللقطات والمراجع
summary: واجهة برمجة تطبيقات التحكم في المتصفح في OpenClaw، ومرجع CLI، وإجراءات البرمجة النصية
title: واجهة برمجة تطبيقات التحكم في المتصفح
x-i18n:
    generated_at: "2026-04-30T08:28:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8bd0c0e5a5be9a8ec865c932d28456ace6a047d15a534a79c0b81a5e8904736f
    source_path: tools/browser-control.md
    workflow: 16
---

لإعداد [Browser](/ar/tools/browser) وتكوينه واستكشاف مشكلاته وإصلاحها، راجع [Browser](/ar/tools/browser).
هذه الصفحة هي المرجع لواجهة HTTP API للتحكم المحلي، وCLI `openclaw browser`
وأنماط البرمجة النصية (اللقطات، والمراجع، والانتظارات، وتدفقات التصحيح).

## واجهة Control API (اختيارية)

للتكاملات المحلية فقط، يعرّض Gateway واجهة HTTP API صغيرة عبر loopback:

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

تقبل جميع نقاط النهاية `?profile=<name>`. يطلب `POST /start?headless=true` تشغيلًا
بلا واجهة headless لمرة واحدة للملفات الشخصية المحلية المُدارة من دون تغيير إعدادات
المتصفح المحفوظة؛ وترفض ملفات التعريف attach-only وremote CDP والجلسات الموجودة
هذا التجاوز لأن OpenClaw لا يشغّل عمليات تلك المتصفحات.

إذا تم تكوين مصادقة Gateway بسر مشترك، فستتطلب مسارات HTTP الخاصة بالمتصفح المصادقة أيضًا:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` أو مصادقة HTTP Basic باستخدام كلمة المرور تلك

ملاحظات:

- لا تستهلك واجهة متصفح loopback المستقلة هذه ترويسات trusted-proxy أو
  هوية Tailscale Serve.
- إذا كان `gateway.auth.mode` هو `none` أو `trusted-proxy`، فإن مسارات متصفح loopback
  هذه لا ترث تلك الأوضاع الحاملة للهوية؛ أبقها مقصورة على loopback فقط.

### عقد خطأ `/act`

يستخدم `POST /act` استجابة خطأ مهيكلة لإخفاقات التحقق على مستوى المسار
وإخفاقات السياسة:

```json
{ "error": "<message>", "code": "ACT_*" }
```

قيم `code` الحالية:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` مفقود أو غير معروف.
- `ACT_INVALID_REQUEST` (HTTP 400): فشلت حمولة الإجراء في التطبيع أو التحقق.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): استُخدم `selector` مع نوع إجراء غير مدعوم.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (أو `wait --fn`) معطل عبر التكوين.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): يتعارض `targetId` في المستوى الأعلى أو الدُفعات مع هدف الطلب.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): الإجراء غير مدعوم لملفات تعريف الجلسة الموجودة.

قد تظل إخفاقات وقت التشغيل الأخرى تُرجع `{ "error": "<message>" }` من دون حقل
`code`.

### متطلب Playwright

تتطلب بعض الميزات (التنقل/الإجراء/لقطة الذكاء الاصطناعي/لقطة الدور، ولقطات شاشة العناصر،
وPDF) وجود Playwright. إذا لم يكن Playwright مثبتًا، فستُرجع نقاط النهاية هذه
خطأ 501 واضحًا.

ما يظل يعمل من دون Playwright:

- لقطات ARIA
- لقطات إمكانية الوصول بنمط الدور (`--interactive`, `--compact`,
  `--depth`, `--efficient`) عندما يكون WebSocket خاص بـCDP لكل علامة تبويب متاحًا. هذا
  بديل للفحص واكتشاف المراجع؛ ويظل Playwright محرك الإجراءات الأساسي.
- لقطات شاشة الصفحة لمتصفح `openclaw` المُدار عندما يكون WebSocket خاص بـCDP
  لكل علامة تبويب متاحًا
- لقطات شاشة الصفحة لملفات تعريف `existing-session` / Chrome MCP
- لقطات شاشة `existing-session` المستندة إلى المراجع (`--ref`) من مخرجات اللقطة

ما يزال يحتاج إلى Playwright:

- `navigate`
- `act`
- لقطات الذكاء الاصطناعي التي تعتمد على تنسيق لقطة الذكاء الاصطناعي الأصلي في Playwright
- لقطات شاشة عناصر محدد CSS (`--element`)
- تصدير PDF كامل للمتصفح

ترفض لقطات شاشة العناصر أيضًا `--full-page`؛ ويُرجع المسار `fullPage is
not supported for element screenshots`.

إذا رأيت `Playwright is not available in this gateway build`، فأصلح تبعيات وقت تشغيل
Plugin المتصفح المضمنة حتى يتم تثبيت `playwright-core`، ثم أعد تشغيل Gateway.
للتثبيتات المعبأة، شغّل `openclaw doctor --fix`.
أما في Docker، فثبّت أيضًا ثنائيات متصفح Chromium كما هو موضح أدناه.

#### تثبيت Playwright في Docker

إذا كان Gateway لديك يعمل في Docker، فتجنب `npx playwright` (تعارضات تجاوز npm).
استخدم CLI المضمن بدلًا من ذلك:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

للاحتفاظ بتنزيلات المتصفح، اضبط `PLAYWRIGHT_BROWSERS_PATH` (على سبيل المثال،
`/home/node/.cache/ms-playwright`) وتأكد من استمرار `/home/node` عبر
`OPENCLAW_HOME_VOLUME` أو bind mount. راجع [Docker](/ar/install/docker).

## كيف يعمل (داخلي)

يقبل خادم تحكم صغير عبر loopback طلبات HTTP ويتصل بمتصفحات مبنية على Chromium عبر CDP. تمر الإجراءات المتقدمة (النقر/الكتابة/اللقطة/PDF) عبر Playwright فوق CDP؛ وعند غياب Playwright، لا تتوفر إلا العمليات غير المعتمدة على Playwright. يرى الوكيل واجهة مستقرة واحدة بينما تتبدل المتصفحات والملفات الشخصية المحلية/البعيدة بحرية تحتها.

## مرجع CLI السريع

تقبل جميع الأوامر `--browser-profile <name>` لاستهداف ملف تعريف محدد، و`--json` لإخراج قابل للقراءة آليًا.

<AccordionGroup>

<Accordion title="الأساسيات: الحالة، علامات التبويب، الفتح/التركيز/الإغلاق">

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

<Accordion title="الفحص: لقطة الشاشة، اللقطة، وحدة التحكم، الأخطاء، الطلبات">

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

<Accordion title="الإجراءات: التنقل، النقر، الكتابة، السحب، الانتظار، التقييم">

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

<Accordion title="الحالة: ملفات تعريف الارتباط، التخزين، دون اتصال، الترويسات، الموقع الجغرافي، الجهاز">

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

- `upload` و`dialog` هما استدعاءان للتحضير؛ شغّلهما قبل النقرة/الضغط الذي يطلق منتقي الملفات/مربع الحوار.
- تتطلب `click`/`type`/إلخ `ref` من `snapshot` (رقمي `12`، أو مرجع دور `e12`، أو مرجع ARIA قابل للإجراء `ax12`). محددات CSS غير مدعومة عمدًا للإجراءات. استخدم `click-coords` عندما يكون موضع الإطار المرئي الظاهر هو الهدف الموثوق الوحيد.
- مسارات التنزيل والتتبع والرفع مقيدة بجذور OpenClaw المؤقتة: `/tmp/openclaw{,/downloads,/uploads}` (البديل: `${os.tmpdir()}/openclaw/...`).
- يمكن لـ`upload` أيضًا تعيين مدخلات الملفات مباشرة عبر `--input-ref` أو `--element`.

تبقى معرّفات علامات التبويب المستقرة والتسميات بعد استبدال هدف Chromium الخام عندما يستطيع OpenClaw
إثبات علامة التبويب البديلة، مثل عنوان URL نفسه أو تحول علامة تبويب قديمة واحدة إلى
علامة تبويب جديدة واحدة بعد إرسال نموذج. تظل معرّفات الأهداف الخام متقلبة؛ فضّل
`suggestedTargetId` من `tabs` في السكربتات.

نظرة سريعة على أعلام اللقطات:

- `--format ai` (الافتراضي مع Playwright): لقطة ذكاء اصطناعي بمراجع رقمية (`aria-ref="<n>"`).
- `--format aria`: شجرة إمكانية الوصول بمراجع `axN`. عندما يكون Playwright متاحًا، يربط OpenClaw المراجع بمعرّفات DOM الخلفية إلى الصفحة الحية حتى تتمكن الإجراءات اللاحقة من استخدامها؛ وإلا فتعامل مع المخرجات على أنها للفحص فقط.
- `--efficient` (أو `--mode efficient`): إعداد مسبق مضغوط للقطة الدور. اضبط `browser.snapshotDefaults.mode: "efficient"` لجعل هذا هو الافتراضي (راجع [تكوين Gateway](/ar/gateway/configuration-reference#browser)).
- تجبر `--interactive` و`--compact` و`--depth` و`--selector` لقطة دور بمراجع `ref=e12`. يقيّد `--frame "<iframe>"` لقطات الدور بإطار iframe.
- تضيف `--labels` لقطة شاشة للإطار المرئي فقط مع تسميات مراجع متراكبة (يطبع `MEDIA:<path>`).
- تضيف `--urls` وجهات الروابط المكتشفة إلى لقطات الذكاء الاصطناعي.

## اللقطات والمراجع

يدعم OpenClaw نمطين من “اللقطات”:

- **لقطة الذكاء الاصطناعي (مراجع رقمية)**: `openclaw browser snapshot` (افتراضي؛ `--format ai`)
  - الإخراج: لقطة نصية تتضمن مراجع رقمية.
  - الإجراءات: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - داخليًا، يُحل المرجع عبر `aria-ref` في Playwright.

- **لقطة الدور (مراجع الدور مثل `e12`)**: `openclaw browser snapshot --interactive` (أو `--compact`, `--depth`, `--selector`, `--frame`)
  - الإخراج: قائمة/شجرة مستندة إلى الأدوار مع `[ref=e12]` (و`[nth=1]` اختياريًا).
  - الإجراءات: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - داخليًا، يُحل المرجع عبر `getByRole(...)` (مع `nth()` للتكرارات).
  - أضف `--labels` لتضمين لقطة شاشة للإطار المرئي مع تسميات `e12` متراكبة.
  - أضف `--urls` عندما يكون نص الرابط ملتبسًا ويحتاج الوكيل إلى
    أهداف تنقل ملموسة.

- **لقطة ARIA (مراجع ARIA مثل `ax12`)**: `openclaw browser snapshot --format aria`
  - الإخراج: شجرة إمكانية الوصول كعُقد مهيكلة.
  - الإجراءات: يعمل `openclaw browser click ax12` عندما يستطيع مسار اللقطة ربط
    المرجع عبر Playwright ومعرّفات DOM الخلفية في Chrome.
- إذا لم يكن Playwright متاحًا، فقد تظل لقطات ARIA مفيدة
  للفحص، لكن المراجع قد لا تكون قابلة للإجراء. أعد أخذ اللقطة باستخدام `--format ai`
  أو `--interactive` عندما تحتاج إلى مراجع إجراءات.
- إثبات Docker لمسار بديل raw-CDP: يبدأ `pnpm test:docker:browser-cdp-snapshot`
  Chromium مع CDP، ويشغّل `browser doctor --deep`، ويتحقق من أن لقطات الدور
  تتضمن عناوين URL للروابط، وعناصر قابلة للنقر مرفوعة من المؤشر، وبيانات iframe الوصفية.

سلوك المراجع:

- المراجع **ليست مستقرة عبر عمليات التنقل**؛ إذا فشل شيء ما، فأعد تشغيل `snapshot` واستخدم مرجعًا جديدًا.
- يعيد `/act` قيمة `targetId` الخام الحالية بعد الاستبدال الذي يسببه الإجراء
  عندما يستطيع إثبات علامة التبويب البديلة. استمر في استخدام معرفات/تسميات علامات التبويب المستقرة
  للأوامر اللاحقة.
- إذا أُخذت لقطة الدور باستخدام `--frame`، فستكون مراجع الدور محصورة في iframe ذلك حتى لقطة الدور التالية.
- تفشل مراجع `axN` غير المعروفة أو القديمة بسرعة بدلًا من السقوط إلى
  محدد `aria-ref` في Playwright. شغّل لقطة جديدة على علامة التبويب نفسها عندما
  يحدث ذلك.

## تعزيزات الانتظار

يمكنك الانتظار لأكثر من مجرد الوقت/النص:

- انتظر URL (يدعم Playwright الأنماط الشاملة):
  - `openclaw browser wait --url "**/dash"`
- انتظر حالة التحميل:
  - `openclaw browser wait --load networkidle`
- انتظر شرط JS:
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

## سير عمل التصحيح

عندما يفشل إجراء (مثل “غير مرئي”، “انتهاك الوضع الصارم”، “محجوب”):

1. `openclaw browser snapshot --interactive`
2. استخدم `click <ref>` / `type <ref>` (فضّل مراجع الدور في الوضع التفاعلي)
3. إذا استمر الفشل: `openclaw browser highlight <ref>` لرؤية ما يستهدفه Playwright
4. إذا تصرفت الصفحة بغرابة:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. للتصحيح العميق: سجّل trace:
   - `openclaw browser trace start`
   - أعد إنتاج المشكلة
   - `openclaw browser trace stop` (يطبع `TRACE:<path>`)

## مخرجات JSON

`--json` مخصص للبرمجة النصية والأدوات المهيكلة.

أمثلة:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

تتضمن لقطات الدور في JSON ‏`refs` إضافة إلى كتلة `stats` صغيرة (lines/chars/refs/interactive) حتى تتمكن الأدوات من الاستدلال على حجم الحمولة وكثافتها.

## مفاتيح الحالة والبيئة

هذه مفيدة لسير عمل “اجعل الموقع يتصرف مثل X”:

- ملفات تعريف الارتباط: `cookies`, `cookies set`, `cookies clear`
- التخزين: `storage local|session get|set|clear`
- دون اتصال: `set offline on|off`
- الرؤوس: `set headers --headers-json '{"X-Debug":"1"}'` (لا يزال `set headers --json '{"X-Debug":"1"}'` القديم مدعومًا)
- مصادقة HTTP الأساسية: `set credentials user pass` (أو `--clear`)
- الموقع الجغرافي: `set geo <lat> <lon> --origin "https://example.com"` (أو `--clear`)
- الوسائط: `set media dark|light|no-preference|none`
- المنطقة الزمنية / اللغة المحلية: `set timezone ...`, `set locale ...`
- الجهاز / منفذ العرض:
  - `set device "iPhone 14"` (إعدادات أجهزة Playwright الجاهزة)
  - `set viewport 1280 720`

## الأمان والخصوصية

- قد يحتوي ملف تعريف متصفح openclaw على جلسات مسجلة الدخول؛ عامله كبيانات حساسة.
- يقوم `browser act kind=evaluate` / `openclaw browser evaluate` و`wait --fn`
  بتنفيذ JavaScript عشوائي في سياق الصفحة. يمكن لحقن التعليمات توجيه
  ذلك. عطّله باستخدام `browser.evaluateEnabled=false` إذا لم تكن بحاجة إليه.
- لملاحظات تسجيل الدخول ومكافحة الروبوتات (X/Twitter، وغيرها)، راجع [تسجيل دخول المتصفح + النشر على X/Twitter](/ar/tools/browser-login).
- أبقِ مضيف Gateway/node خاصًا (loopback أو tailnet فقط).
- نقاط نهاية CDP البعيدة قوية؛ مررها عبر نفق واحمها.

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
- [استكشاف مشكلات متصفح Linux وإصلاحها](/ar/tools/browser-linux-troubleshooting)
- [استكشاف مشكلات متصفح WSL2 وإصلاحها مع CDP البعيد في Windows](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
