---
read_when:
    - كتابة نصوص برمجية لمتصفح الوكيل أو تصحيح أخطائه عبر واجهة API التحكم المحلية
    - البحث عن مرجع CLI الخاص بـ `openclaw browser`
    - إضافة أتمتة متصفح مخصصة باستخدام اللقطات والمراجع
summary: واجهة برمجة تطبيقات التحكم في المتصفح في OpenClaw، ومرجع CLI، وإجراءات البرمجة النصية
title: واجهة برمجة تطبيقات التحكم في المتصفح
x-i18n:
    generated_at: "2026-05-10T20:03:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: eec952e6befed8911b83fc554b1c08cc5f20d3deff9c6cc791cb8a009bb9e7f3
    source_path: tools/browser-control.md
    workflow: 16
---

للإعداد والتهيئة واستكشاف الأخطاء وإصلاحها، راجع [المتصفح](/ar/tools/browser).
هذه الصفحة هي مرجع واجهة HTTP API للتحكم المحلي، وواجهة `openclaw browser`
CLI، وأنماط البرمجة النصية (اللقطات، والمراجع، والانتظارات، وتدفقات التصحيح).

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

تقبل كل نقاط النهاية `?profile=<name>`. يطلب `POST /start?headless=true` تشغيلاً
headless لمرة واحدة للملفات الشخصية المحلية المُدارة من دون تغيير تهيئة
المتصفح المحفوظة؛ وترفض الملفات الشخصية المخصّصة للإرفاق فقط، وCDP البعيد،
والجلسات الحالية هذا التجاوز لأن OpenClaw لا يشغّل عمليات المتصفح تلك.

إذا كانت مصادقة Gateway بسرّ مشترك مهيأة، فإن مسارات HTTP للمتصفح تتطلب المصادقة أيضاً:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` أو مصادقة HTTP Basic بذلك password

ملاحظات:

- واجهة API المستقلة هذه لمتصفح local loopback لا تستهلك ترويسات هوية الوكيل
  الموثوق أو Tailscale Serve.
- إذا كانت `gateway.auth.mode` هي `none` أو `trusted-proxy`، فإن مسارات متصفح
  local loopback هذه لا ترث تلك الأوضاع الحاملة للهوية؛ أبقها محصورة في local loopback فقط.

### عقد أخطاء `/act`

يستخدم `POST /act` استجابة أخطاء منظمة لفشل التحقق على مستوى المسار
وفشل السياسات:

```json
{ "error": "<message>", "code": "ACT_*" }
```

قيم `code` الحالية:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` مفقود أو غير معروف.
- `ACT_INVALID_REQUEST` (HTTP 400): فشلت حمولة الإجراء في التطبيع أو التحقق.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): استُخدم `selector` مع نوع إجراء غير مدعوم.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (أو `wait --fn`) معطّل بواسطة التهيئة.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): يتعارض `targetId` على المستوى الأعلى أو ضمن دفعة مع هدف الطلب.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): الإجراء غير مدعوم للملفات الشخصية ذات الجلسة الحالية.

قد تظل حالات فشل وقت التشغيل الأخرى تُرجع `{ "error": "<message>" }` من دون
حقل `code`.

### متطلب Playwright

تتطلب بعض الميزات (التنقل/الإجراء/لقطة الذكاء الاصطناعي/لقطة الدور، ولقطات شاشة العناصر،
وPDF) وجود Playwright. إذا لم يكن Playwright مثبتاً، تُرجع نقاط النهاية هذه
خطأ 501 واضحاً.

ما يظل يعمل من دون Playwright:

- لقطات ARIA
- لقطات إمكانية الوصول بأسلوب الدور (`--interactive`, `--compact`,
  `--depth`, `--efficient`) عند توفر WebSocket لكل علامة تبويب عبر CDP. هذا
  مسار احتياطي للفحص واكتشاف المراجع؛ يبقى Playwright محرك الإجراءات الأساسي.
- لقطات شاشة الصفحة لمتصفح `openclaw` المُدار عند توفر WebSocket لكل علامة تبويب
  عبر CDP
- لقطات شاشة الصفحة لملفات `existing-session` / Chrome MCP الشخصية
- لقطات الشاشة المستندة إلى المراجع (`--ref`) لـ `existing-session` من مخرجات اللقطة

ما لا يزال يحتاج إلى Playwright:

- `navigate`
- `act`
- لقطات الذكاء الاصطناعي التي تعتمد على تنسيق لقطة الذكاء الاصطناعي الأصلي في Playwright
- لقطات شاشة العناصر بمحدد CSS (`--element`)
- تصدير PDF كامل للمتصفح

ترفض لقطات شاشة العناصر أيضاً `--full-page`؛ ويُرجع المسار `fullPage is
not supported for element screenshots`.

إذا رأيت `Playwright is not available in this gateway build`، فإن Gateway
المعبأ يفتقد تبعية وقت تشغيل المتصفح الأساسية. أعد تثبيت OpenClaw أو حدّثه،
ثم أعد تشغيل Gateway. بالنسبة إلى Docker، ثبّت أيضاً ثنائيات متصفح Chromium
كما هو موضح أدناه.

#### تثبيت Docker Playwright

إذا كان Gateway يعمل داخل Docker، فتجنب `npx playwright` (تعارضات تجاوز npm).
استخدم CLI المضمنة بدلاً من ذلك:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

للاحتفاظ بتنزيلات المتصفح، عيّن `PLAYWRIGHT_BROWSERS_PATH` (على سبيل المثال،
`/home/node/.cache/ms-playwright`) وتأكد من بقاء `/home/node` محفوظاً عبر
`OPENCLAW_HOME_VOLUME` أو ربط bind mount. يكتشف OpenClaw تلقائياً Chromium
المحفوظ على Linux. راجع [Docker](/ar/install/docker).

## كيف يعمل (داخلي)

يقبل خادم تحكم صغير عبر local loopback طلبات HTTP ويتصل بالمتصفحات المستندة إلى Chromium عبر CDP. تمر الإجراءات المتقدمة (النقر/الكتابة/اللقطة/PDF) عبر Playwright فوق CDP؛ وعند غياب Playwright، لا تتوفر إلا العمليات غير المعتمدة على Playwright. يرى الوكيل واجهة مستقرة واحدة بينما تتبدل المتصفحات والملفات الشخصية المحلية/البعيدة بحرية تحتها.

## مرجع CLI سريع

تقبل كل الأوامر `--browser-profile <name>` لاستهداف ملف شخصي محدد، و`--json` للمخرجات القابلة للقراءة آلياً.

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

<Accordion title="الحالة: ملفات تعريف الارتباط، التخزين، وضع عدم الاتصال، الترويسات، الموقع الجغرافي، الجهاز">

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

- `upload` و`dialog` هما استدعاءان للتهيئة؛ شغّلهما قبل النقر/الضغط الذي يطلق منتقي الملفات/مربع الحوار.
- تتطلب `click`/`type`/وما شابه مرجع `ref` من `snapshot` (رقمياً مثل `12`، أو مرجع دور `e12`، أو مرجع ARIA قابل للتنفيذ مثل `ax12`). محددات CSS غير مدعومة عمداً للإجراءات. استخدم `click-coords` عندما يكون موضع إطار العرض المرئي هو الهدف الموثوق الوحيد.
- مسارات التنزيل والتتبع والرفع مقيدة بجذور OpenClaw المؤقتة: `/tmp/openclaw{,/downloads,/uploads}` (الاحتياطي: `${os.tmpdir()}/openclaw/...`).
- يمكن لـ `upload` أيضاً تعيين مدخلات الملفات مباشرة عبر `--input-ref` أو `--element`.

تبقى معرّفات علامات التبويب والتسميات المستقرة بعد استبدال الهدف الخام في Chromium عندما يستطيع OpenClaw
إثبات علامة التبويب البديلة، مثل نفس URL أو تحوّل علامة تبويب قديمة واحدة إلى
علامة تبويب جديدة واحدة بعد إرسال نموذج. تظل معرّفات الأهداف الخام متقلبة؛ فضّل
`suggestedTargetId` من `tabs` في السكربتات.

لمحة عن أعلام اللقطات:

- `--format ai` (الافتراضي مع Playwright): لقطة ذكاء اصطناعي بمراجع رقمية (`aria-ref="<n>"`).
- `--format aria`: شجرة إمكانية الوصول بمراجع `axN`. عندما يكون Playwright متوفراً، يربط OpenClaw المراجع بمعرّفات DOM الخلفية في الصفحة الحية بحيث يمكن لإجراءات المتابعة استخدامها؛ وإلا فتعامل مع المخرجات كفحص فقط.
- `--efficient` (أو `--mode efficient`): إعداد مسبق مضغوط للقطة الدور. عيّن `browser.snapshotDefaults.mode: "efficient"` لجعل هذا هو الافتراضي (راجع [تهيئة Gateway](/ar/gateway/configuration-reference#browser)).
- يفرض `--interactive`, `--compact`, `--depth`, `--selector` لقطة دور بمراجع `ref=e12`. يقيّد `--frame "<iframe>"` لقطات الدور إلى iframe.
- يضيف `--labels` لقطة شاشة لإطار العرض فقط مع تسميات المراجع فوقها (يطبع `MEDIA:<path>`).
- يضيف `--urls` وجهات الروابط المكتشفة إلى لقطات الذكاء الاصطناعي.

## اللقطات والمراجع

يدعم OpenClaw نمطين من "اللقطات":

- **لقطة الذكاء الاصطناعي (مراجع رقمية)**: `openclaw browser snapshot` (افتراضي؛ `--format ai`)
  - المخرجات: لقطة نصية تتضمن مراجع رقمية.
  - الإجراءات: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - داخلياً، يُحل المرجع عبر `aria-ref` في Playwright.

- **لقطة الدور (مراجع أدوار مثل `e12`)**: `openclaw browser snapshot --interactive` (أو `--compact`, `--depth`, `--selector`, `--frame`)
  - المخرجات: قائمة/شجرة قائمة على الدور مع `[ref=e12]` (و`[nth=1]` اختيارية).
  - الإجراءات: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - داخلياً، يُحل المرجع عبر `getByRole(...)` (مع `nth()` للتكرارات).
  - أضف `--labels` لتضمين لقطة شاشة لإطار العرض مع تسميات `e12` فوقها.
  - أضف `--urls` عندما يكون نص الرابط ملتبساً ويحتاج الوكيل إلى
    أهداف تنقل ملموسة.

- **لقطة ARIA (مراجع ARIA مثل `ax12`)**: `openclaw browser snapshot --format aria`
  - المخرجات: شجرة إمكانية الوصول كعُقد منظمة.
  - الإجراءات: يعمل `openclaw browser click ax12` عندما يستطيع مسار اللقطة ربط
    المرجع عبر Playwright ومعرّفات DOM الخلفية في Chrome.
- إذا لم يكن Playwright متاحاً، يمكن أن تظل لقطات ARIA مفيدة
  للفحص، لكن قد لا تكون المراجع قابلة للتنفيذ. أعد أخذ اللقطة باستخدام `--format ai`
  أو `--interactive` عندما تحتاج إلى مراجع إجراءات.
- إثبات Docker لمسار الاحتياطي الخام عبر CDP: يبدأ `pnpm test:docker:browser-cdp-snapshot`
  تشغيل Chromium مع CDP، ويشغّل `browser doctor --deep`، ويتحقق من أن لقطات الدور
  تتضمن عناوين URL للروابط، وعناصر قابلة للنقر تمت ترقيتها بالمؤشر، وبيانات iframe الوصفية.

سلوك المراجع:

- المراجع **ليست مستقرة عبر عمليات التنقل**؛ إذا فشل شيء ما، فأعد تشغيل `snapshot` واستخدم مرجعًا جديدًا.
- يعيد `/act` قيمة `targetId` الخام الحالية بعد الاستبدال الناتج عن إجراء
  عندما يستطيع إثبات التبويب البديل. واصل استخدام معرّفات/تسميات التبويبات المستقرة
  لأوامر المتابعة.
- إذا أُخذت لقطة الدور باستخدام `--frame`، فستكون مراجع الدور محصورة بذلك iframe حتى لقطة الدور التالية.
- تفشل مراجع `axN` غير المعروفة أو القديمة بسرعة بدلًا من الانتقال إلى
  محدِّد `aria-ref` الخاص بـ Playwright. شغّل لقطة جديدة على التبويب نفسه عندما
  يحدث ذلك.

## تحسينات الانتظار

يمكنك الانتظار لأكثر من مجرد الوقت/النص:

- الانتظار لعنوان URL (تدعم أنماط glob الخاصة بـ Playwright):
  - `openclaw browser wait --url "**/dash"`
- الانتظار لحالة التحميل:
  - `openclaw browser wait --load networkidle`
- الانتظار لشرط JS:
  - `openclaw browser wait --fn "window.ready===true"`
- الانتظار حتى يصبح محدِّد مرئيًا:
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

عندما يفشل إجراء (مثل "not visible" أو "strict mode violation" أو "covered"):

1. `openclaw browser snapshot --interactive`
2. استخدم `click <ref>` / `type <ref>` (فضّل مراجع الدور في الوضع التفاعلي)
3. إذا ظل يفشل: `openclaw browser highlight <ref>` لمعرفة ما يستهدفه Playwright
4. إذا تصرفت الصفحة على نحو غريب:
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

تتضمن لقطات الدور في JSON‏ `refs` بالإضافة إلى كتلة `stats` صغيرة (lines/chars/refs/interactive) حتى تتمكن الأدوات من التفكير في حجم الحمولة وكثافتها.

## الحالة وعناصر ضبط البيئة

هذه مفيدة لسير عمل "اجعل الموقع يتصرف مثل X":

- ملفات تعريف الارتباط: `cookies`، `cookies set`، `cookies clear`
- التخزين: `storage local|session get|set|clear`
- عدم الاتصال: `set offline on|off`
- الترويسات: `set headers --headers-json '{"X-Debug":"1"}'` (لا يزال `set headers --json '{"X-Debug":"1"}'` القديم مدعومًا)
- مصادقة HTTP الأساسية: `set credentials user pass` (أو `--clear`)
- الموقع الجغرافي: `set geo <lat> <lon> --origin "https://example.com"` (أو `--clear`)
- الوسائط: `set media dark|light|no-preference|none`
- المنطقة الزمنية / اللغة المحلية: `set timezone ...`، `set locale ...`
- الجهاز / إطار العرض:
  - `set device "iPhone 14"` (إعدادات أجهزة Playwright المسبقة)
  - `set viewport 1280 720`

## الأمان والخصوصية

- قد يحتوي ملف تعريف متصفح openclaw على جلسات مسجّل دخولها؛ عامله كبيانات حساسة.
- ينفّذ `browser act kind=evaluate` / `openclaw browser evaluate` و`wait --fn`
  JavaScript عشوائيًا في سياق الصفحة. يمكن لحقن المطالبات توجيه
  ذلك. عطّله باستخدام `browser.evaluateEnabled=false` إذا لم تكن بحاجة إليه.
- لملاحظات تسجيل الدخول ومكافحة الروبوتات (X/Twitter، إلخ)، راجع [تسجيل الدخول عبر المتصفح + النشر على X/Twitter](/ar/tools/browser-login).
- اجعل مضيف Gateway/Node خاصًا (local loopback أو tailnet-only).
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

## ذات صلة

- [المتصفح](/ar/tools/browser) - نظرة عامة، التهيئة، الملفات التعريفية، الأمان
- [تسجيل الدخول عبر المتصفح](/ar/tools/browser-login) - تسجيل الدخول إلى المواقع
- [استكشاف أخطاء المتصفح على Linux وإصلاحها](/ar/tools/browser-linux-troubleshooting)
- [استكشاف أخطاء المتصفح على WSL2 وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
