---
read_when:
    - برمجة أو تصحيح متصفح الوكيل عبر واجهة التحكم المحلية API
    - تبحث عن مرجع CLI الخاص بـ `openclaw browser`
    - إضافة أتمتة مخصصة للمتصفح باستخدام اللقطات وrefs
summary: واجهة API للتحكم في المتصفح في OpenClaw، ومرجع CLI، وإجراءات البرمجة النصية
title: واجهة API للتحكم في المتصفح
x-i18n:
    generated_at: "2026-04-24T08:07:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: e29ad295085e2c36a6c2ce01366a4186e45a7ecfe1d3c3072353c55794b05b5f
    source_path: tools/browser-control.md
    workflow: 15
---

للحصول على الإعداد، والتهيئة، واستكشاف الأخطاء وإصلاحها، راجع [المتصفح](/ar/tools/browser).
هذه الصفحة هي المرجع الخاص بواجهة HTTP API المحلية للتحكم، وCLI للأمر `openclaw browser`،
وأنماط البرمجة النصية (اللقطات، وrefs، والانتظارات، وتدفقات التصحيح).

## واجهة Control API ‏(اختيارية)

بالنسبة إلى التكاملات المحلية فقط، يكشف Gateway عن واجهة HTTP API صغيرة على loopback:

- الحالة/البدء/الإيقاف: ‏`GET /` و`POST /start` و`POST /stop`
- علامات التبويب: ‏`GET /tabs` و`POST /tabs/open` و`POST /tabs/focus` و`DELETE /tabs/:targetId`
- اللقطة/لقطة الشاشة: ‏`GET /snapshot` و`POST /screenshot`
- الإجراءات: ‏`POST /navigate` و`POST /act`
- الخطافات: ‏`POST /hooks/file-chooser` و`POST /hooks/dialog`
- التنزيلات: ‏`POST /download` و`POST /wait/download`
- تصحيح الأخطاء: ‏`GET /console` و`POST /pdf`
- تصحيح الأخطاء: ‏`GET /errors` و`GET /requests` و`POST /trace/start` و`POST /trace/stop` و`POST /highlight`
- الشبكة: ‏`POST /response/body`
- الحالة: ‏`GET /cookies` و`POST /cookies/set` و`POST /cookies/clear`
- الحالة: ‏`GET /storage/:kind` و`POST /storage/:kind/set` و`POST /storage/:kind/clear`
- الإعدادات: ‏`POST /set/offline` و`POST /set/headers` و`POST /set/credentials` و`POST /set/geolocation` و`POST /set/media` و`POST /set/timezone` و`POST /set/locale` و`POST /set/device`

تقبل جميع نقاط النهاية ‎`?profile=<name>`.

إذا كانت مصادقة gateway ذات السر المشترك مضبوطة، فإن مسارات HTTP الخاصة بالمتصفح تتطلب المصادقة أيضًا:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` أو HTTP Basic auth باستخدام تلك الكلمة

ملاحظات:

- لا تستهلك واجهة API المستقلة هذه الخاصة بالمتصفح على loopback
  رؤوس trusted-proxy أو رؤوس الهوية الخاصة بـ Tailscale Serve.
- إذا كانت `gateway.auth.mode` مساوية لـ `none` أو `trusted-proxy`، فإن مسارات المتصفح هذه على loopback
  لا ترث أوضاع الهوية الحاملة هذه؛ لذا أبقها على loopback فقط.

### عقد الأخطاء في `/act`

يستخدم `POST /act` استجابة خطأ منظمة للتحقق على مستوى المسار
ولإخفاقات السياسة:

```json
{ "error": "<message>", "code": "ACT_*" }
```

القيم الحالية لـ `code`:

- `ACT_KIND_REQUIRED` ‏(HTTP 400): `kind` مفقود أو غير معروف.
- `ACT_INVALID_REQUEST` ‏(HTTP 400): فشل تطبيع أو التحقق من حمولة الإجراء.
- `ACT_SELECTOR_UNSUPPORTED` ‏(HTTP 400): تم استخدام `selector` مع نوع إجراء غير مدعوم.
- `ACT_EVALUATE_DISABLED` ‏(HTTP 403): تم تعطيل `evaluate` ‏(أو `wait --fn`) عبر الإعدادات.
- `ACT_TARGET_ID_MISMATCH` ‏(HTTP 403): يتعارض `targetId` الأعلى مستوى أو المجمع مع هدف الطلب.
- `ACT_EXISTING_SESSION_UNSUPPORTED` ‏(HTTP 501): الإجراء غير مدعوم لملفات existing-session.

قد تستمر إخفاقات وقت التشغيل الأخرى في إعادة `{ "error": "<message>" }` من دون
حقل `code`.

### متطلب Playwright

تتطلب بعض الميزات (navigate/act/AI snapshot/role snapshot، ولقطات شاشة العناصر،
وPDF) وجود Playwright. وإذا لم يكن Playwright مثبتًا، فستعيد تلك النقاط
النهاية خطأ 501 واضحًا.

ما الذي لا يزال يعمل من دون Playwright:

- لقطات ARIA
- لقطات الصفحة لمتصفح `openclaw` المُدار عندما يكون WebSocket
  لكل علامة تبويب عبر CDP متاحًا
- لقطات الصفحة لملفات `existing-session` / ‏Chrome MCP
- لقطات `--ref` القائمة على existing-session من مخرجات snapshot

ما الذي لا يزال يحتاج إلى Playwright:

- `navigate`
- `act`
- لقطات AI / لقطات الأدوار
- لقطات عناصر CSS selector ‏(`--element`)
- تصدير PDF الكامل للمتصفح

كما أن لقطات العناصر ترفض أيضًا `--full-page`; إذ يعيد المسار رسالة أن `fullPage is
not supported for element screenshots`.

إذا رأيت `Playwright is not available in this gateway build`، فأصلح تبعيات وقت تشغيل
Plugin المتصفح المضمّنة بحيث يتم تثبيت `playwright-core`،
ثم أعد تشغيل gateway. وبالنسبة إلى التثبيتات المعلبة، شغّل `openclaw doctor --fix`.
أما في Docker، فثبّت أيضًا ملفات Chromium التنفيذية كما هو موضح أدناه.

#### تثبيت Playwright في Docker

إذا كانت Gateway تعمل داخل Docker، فتجنب `npx playwright` ‏(بسبب تعارضات تجاوز npm).
واستخدم CLI المضمّنة بدلًا من ذلك:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

ولحفظ تنزيلات المتصفح، اضبط `PLAYWRIGHT_BROWSERS_PATH` ‏(مثلًا،
`/home/node/.cache/ms-playwright`) وتأكد من أن `/home/node` محفوظ عبر
`OPENCLAW_HOME_VOLUME` أو عبر bind mount. راجع [Docker](/ar/install/docker).

## كيف يعمل (داخليًا)

يقبل خادم تحكم صغير على loopback طلبات HTTP ويتصل بالمتصفحات المعتمدة على Chromium عبر CDP. وتعمل الإجراءات المتقدمة (click/type/snapshot/PDF) عبر Playwright فوق CDP؛ وعندما يكون Playwright مفقودًا، لا تتوفر إلا العمليات غير المعتمدة على Playwright. ويرى الوكيل واجهة مستقرة واحدة بينما تتبدل المتصفحات والملفات المحلية/البعيدة تحتها بحرية.

## مرجع CLI سريع

تقبل جميع الأوامر `--browser-profile <name>` لاستهداف ملف شخصي محدد، و`--json` للإخراج القابل للقراءة آليًا.

<AccordionGroup>

<Accordion title="الأساسيات: الحالة، وعلامات التبويب، وopen/focus/close">

```bash
openclaw browser status
openclaw browser start
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

<Accordion title="الفحص: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="الإجراءات: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
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

<Accordion title="الحالة: cookies, storage, offline, headers, geo, device">

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

- `upload` و`dialog` هما استدعاءان من نوع **arming**؛ شغّلهما قبل النقر/الضغط الذي يفتح منتقي الملفات/مربع الحوار.
- تتطلب `click`/`type`/إلخ وجود `ref` من `snapshot` ‏(رقمي `12` أو مرجع دور `e12`). ولا يتم دعم محددات CSS عمدًا للإجراءات.
- تكون مسارات التنزيل، والتتبع، والرفع مقيّدة إلى جذور temp الخاصة بـ OpenClaw: ‏`/tmp/openclaw{,/downloads,/uploads}` ‏(والرجوع الاحتياطي: `${os.tmpdir()}/openclaw/...`).
- يمكن لـ `upload` أيضًا ضبط مدخلات الملفات مباشرة عبر `--input-ref` أو `--element`.

أعلام snapshot باختصار:

- `--format ai` ‏(الافتراضي مع Playwright): لقطة AI مع refs رقمية (`aria-ref="<n>"`).
- `--format aria`: شجرة إمكانية الوصول، من دون refs؛ للفحص فقط.
- `--efficient` ‏(أو `--mode efficient`): إعداد مسبق مضغوط للقطات الأدوار. اضبط `browser.snapshotDefaults.mode: "efficient"` لجعل هذا هو الافتراضي (راجع [إعدادات Gateway](/ar/gateway/configuration-reference#browser)).
- تؤدي `--interactive` و`--compact` و`--depth` و`--selector` إلى فرض لقطة أدوار مع refs من الشكل `ref=e12`. وتقيّد `--frame "<iframe>"` لقطات الأدوار داخل iframe.
- تضيف `--labels` لقطة شاشة داخل viewport مع وسوم refs متراكبة (وتطبع `MEDIA:<path>`).

## اللقطات وrefs

يدعم OpenClaw نمطين من “snapshot”:

- **AI snapshot ‏(refs رقمية):** ‏`openclaw browser snapshot` ‏(الافتراضي؛ `--format ai`)
  - المخرجات: لقطة نصية تتضمن refs رقمية.
  - الإجراءات: ‏`openclaw browser click 12`، ‏`openclaw browser type 23 "hello"`.
  - داخليًا، يتم حلّ المرجع عبر `aria-ref` الخاصة بـ Playwright.

- **Role snapshot ‏(refs أدوار مثل `e12`):** ‏`openclaw browser snapshot --interactive` ‏(أو `--compact` أو `--depth` أو `--selector` أو `--frame`)
  - المخرجات: قائمة/شجرة قائمة على الأدوار مع `[ref=e12]` ‏(واختياريًا `[nth=1]`).
  - الإجراءات: ‏`openclaw browser click e12`، ‏`openclaw browser highlight e12`.
  - داخليًا، يتم حلّ المرجع عبر `getByRole(...)` ‏(بالإضافة إلى `nth()` عند التكرارات).
  - أضف `--labels` لتضمين لقطة شاشة داخل viewport مع وسوم `e12` متراكبة.

سلوك refs:

- ليست refs **ثابتة عبر التنقلات**؛ فإذا فشل شيء ما، فأعد تشغيل `snapshot` واستخدم ref جديدة.
- إذا تم التقاط role snapshot باستخدام `--frame`، فسيتم تقييد refs الأدوار إلى ذلك iframe حتى role snapshot التالية.

## تحسينات الانتظار

يمكنك الانتظار لأكثر من مجرد الزمن/النص:

- الانتظار لعنوان URL ‏(مع دعم globs بواسطة Playwright):
  - `openclaw browser wait --url "**/dash"`
- الانتظار لحالة التحميل:
  - `openclaw browser wait --load networkidle`
- الانتظار لشرط JS:
  - `openclaw browser wait --fn "window.ready===true"`
- الانتظار حتى يصبح selector مرئيًا:
  - `openclaw browser wait "#main"`

يمكن دمجها:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## تدفقات تصحيح الأخطاء

عندما يفشل إجراء ما (مثل “not visible”، أو “strict mode violation”، أو “covered”):

1. `openclaw browser snapshot --interactive`
2. استخدم `click <ref>` / `type <ref>` ‏(وفضّل refs الأدوار في الوضع التفاعلي)
3. إذا استمر الفشل: استخدم `openclaw browser highlight <ref>` لرؤية ما الذي تستهدفه Playwright
4. إذا تصرفت الصفحة بشكل غريب:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. من أجل تصحيح أعمق: سجّل trace:
   - `openclaw browser trace start`
   - أعد إنتاج المشكلة
   - `openclaw browser trace stop` ‏(يطبع `TRACE:<path>`)

## إخراج JSON

يُستخدم `--json` للبرمجة النصية والأدوات المنظمة.

أمثلة:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

تتضمن role snapshots في JSON الحقل `refs` بالإضافة إلى كتلة `stats` صغيرة ‏(lines/chars/refs/interactive) حتى تتمكن الأدوات من التفكير في حجم الحمولة وكثافتها.

## عناصر التحكم في الحالة والبيئة

هذه مفيدة في تدفقات عمل “اجعل الموقع يتصرف مثل X”:

- Cookies: ‏`cookies` و`cookies set` و`cookies clear`
- Storage: ‏`storage local|session get|set|clear`
- Offline: ‏`set offline on|off`
- Headers: ‏`set headers --headers-json '{"X-Debug":"1"}'` ‏(لا يزال الصياغة القديمة `set headers --json '{"X-Debug":"1"}'` مدعومة)
- مصادقة HTTP basic: ‏`set credentials user pass` ‏(أو `--clear`)
- Geolocation: ‏`set geo <lat> <lon> --origin "https://example.com"` ‏(أو `--clear`)
- Media: ‏`set media dark|light|no-preference|none`
- Timezone / locale: ‏`set timezone ...`، ‏`set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` ‏(إعدادات أجهزة Playwright المسبقة)
  - `set viewport 1280 720`

## الأمان والخصوصية

- قد يحتوي ملف المتصفح الشخصي `openclaw` على جلسات مسجّل الدخول؛ لذا تعامل معه على أنه حساس.
- إن `browser act kind=evaluate` / ‏`openclaw browser evaluate` و`wait --fn`
  تنفذ JavaScript عشوائيًا في سياق الصفحة. ويمكن لحقن prompt
  توجيه ذلك. عطّله باستخدام `browser.evaluateEnabled=false` إذا لم تكن بحاجة إليه.
- لتسجيلات الدخول وملاحظات مكافحة الروبوتات (X/Twitter، إلخ)، راجع [تسجيل الدخول في المتصفح + النشر على X/Twitter](/ar/tools/browser-login).
- أبقِ Gateway/node host خاصًا (على loopback أو tailnet فقط).
- نقاط نهاية CDP البعيدة قوية؛ قم بإنشاء نفق لها واحمها.

مثال على الوضع الصارم (حظر الوجهات الخاصة/الداخلية افتراضيًا):

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

- [المتصفح](/ar/tools/browser) — نظرة عامة، والإعدادات، والملفات الشخصية، والأمان
- [تسجيل الدخول في المتصفح](/ar/tools/browser-login) — تسجيل الدخول إلى المواقع
- [استكشاف أخطاء المتصفح على Linux وإصلاحها](/ar/tools/browser-linux-troubleshooting)
- [استكشاف أخطاء المتصفح على WSL2 وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
