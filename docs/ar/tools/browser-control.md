---
read_when:
    - برمجة المتصفح الخاص بالوكيل نصيًا أو تصحيح أخطائه عبر local control API
    - أبحث عن مرجع CLI الخاص بـ `openclaw browser`
    - إضافة أتمتة متصفح مخصصة باستخدام اللقطات والمراجع
summary: OpenClaw API للتحكم في المتصفح، ومرجع CLI، وإجراءات البرمجة النصية
title: API التحكم في المتصفح
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:40:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: bdaaff3d218aeee4c9a01478b3a3380b813ad4578d7eb74120e0745c87af66f6
    source_path: tools/browser-control.md
    workflow: 15
---

لأغراض الإعداد، والتهيئة، واستكشاف الأخطاء وإصلاحها، راجع [Browser](/ar/tools/browser).
هذه الصفحة هي المرجع لـ local control HTTP API، وCLI `openclaw browser`،
وأنماط البرمجة النصية (اللقطات، والمراجع، وعمليات الانتظار، وتدفقات التصحيح).

## Control API (اختياري)

للتكاملات المحلية فقط، يكشف Gateway عن loopback HTTP API صغير:

- الحالة/البدء/الإيقاف: `GET /`، و`POST /start`، و`POST /stop`
- علامات التبويب: `GET /tabs`، و`POST /tabs/open`، و`POST /tabs/focus`، و`DELETE /tabs/:targetId`
- اللقطة/لقطة الشاشة: `GET /snapshot`، و`POST /screenshot`
- الإجراءات: `POST /navigate`، و`POST /act`
- hooks: `POST /hooks/file-chooser`، و`POST /hooks/dialog`
- التنزيلات: `POST /download`، و`POST /wait/download`
- التصحيح: `GET /console`، و`POST /pdf`
- التصحيح: `GET /errors`، و`GET /requests`، و`POST /trace/start`، و`POST /trace/stop`، و`POST /highlight`
- الشبكة: `POST /response/body`
- الحالة: `GET /cookies`، و`POST /cookies/set`، و`POST /cookies/clear`
- الحالة: `GET /storage/:kind`، و`POST /storage/:kind/set`، و`POST /storage/:kind/clear`
- الإعدادات: `POST /set/offline`، و`POST /set/headers`، و`POST /set/credentials`، و`POST /set/geolocation`، و`POST /set/media`، و`POST /set/timezone`، و`POST /set/locale`، و`POST /set/device`

تقبل جميع نقاط النهاية `?profile=<name>`. يطلب `POST /start?headless=true`
تشغيلًا أحادي المرة بوضع headless لملفات التعريف المحلية المُدارة من دون تغيير
إعدادات المتصفح المخزّنة؛ أما attach-only وremote CDP وملفات التعريف ذات الجلسات القائمة
فترفض هذا التجاوز لأن OpenClaw لا يشغّل عمليات المتصفح تلك.

إذا كانت مصادقة Gateway بالسر المشترك مهيأة، فإن مسارات HTTP الخاصة بالمتصفح تتطلب المصادقة أيضًا:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` أو HTTP Basic auth باستخدام كلمة المرور تلك

ملاحظات:

- إن loopback browser API المستقل هذا **لا** يستهلك trusted-proxy أو
  headers هوية Tailscale Serve.
- إذا كان `gateway.auth.mode` هو `none` أو `trusted-proxy`، فإن مسارات المتصفح
  هذه عبر loopback لا ترث أوضاع الهوية الحاملة تلك؛ أبقها على loopback فقط.

### تعاقد الخطأ في `/act`

يستخدم `POST /act` استجابة خطأ منظَّمة للتحقق على مستوى المسار
ولإخفاقات السياسة:

```json
{ "error": "<message>", "code": "ACT_*" }
```

قيم `code` الحالية:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` مفقود أو غير معروف.
- `ACT_INVALID_REQUEST` (HTTP 400): فشلت حمولة الإجراء في التطبيع أو التحقق.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): استُخدم `selector` مع نوع إجراء غير مدعوم.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (أو `wait --fn`) معطّل بالإعدادات.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): يتعارض `targetId` على المستوى الأعلى أو داخل الدفعات مع هدف الطلب.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): الإجراء غير مدعوم لملفات تعريف الجلسات القائمة.

قد تظل إخفاقات وقت التشغيل الأخرى تُرجع `{ "error": "<message>" }` من دون
حقل `code`.

### متطلب Playwright

تتطلب بعض الميزات (navigate/act/AI snapshot/role snapshot، ولقطات شاشة العناصر،
وPDF) وجود Playwright. إذا لم يكن Playwright مثبّتًا، فإن نقاط النهاية تلك تُرجع
خطأ 501 واضحًا.

ما الذي يظل يعمل من دون Playwright:

- لقطات ARIA
- لقطات إمكانية الوصول بأسلوب role (`--interactive`، و`--compact`،
  و`--depth`، و`--efficient`) عندما يكون WebSocket لكل علامة تبويب عبر CDP متاحًا. هذا
  مسار احتياطي للفحص واكتشاف المراجع؛ ويظل Playwright هو محرك الإجراءات الأساسي.
- لقطات شاشة الصفحة للمتصفح `openclaw` المُدار عندما يكون WebSocket
  لكل علامة تبويب عبر CDP متاحًا
- لقطات شاشة الصفحة لملفات تعريف `existing-session` / Chrome MCP
- لقطات الشاشة المعتمدة على المراجع (`--ref`) في `existing-session` من خرج اللقطات

ما الذي ما يزال يحتاج إلى Playwright:

- `navigate`
- `act`
- لقطات AI التي تعتمد على تنسيق AI snapshot الأصلي في Playwright
- لقطات شاشة العناصر بمحددات CSS (`--element`)
- تصدير PDF الكامل للمتصفح

كما ترفض لقطات شاشة العناصر أيضًا `--full-page`؛ ويُرجع المسار
`fullPage is not supported for element screenshots`.

إذا رأيت `Playwright is not available in this gateway build`، فأصلح تبعيات
وقت تشغيل Plugin المتصفح المضمّن بحيث يكون `playwright-core` مثبّتًا،
ثم أعد تشغيل Gateway. وبالنسبة إلى عمليات التثبيت المعبأة، شغّل `openclaw doctor --fix`.
وبالنسبة إلى Docker، ثبّت أيضًا ثنائيات متصفح Chromium كما هو موضح أدناه.

#### تثبيت Playwright في Docker

إذا كان Gateway يعمل داخل Docker، فتجنب `npx playwright` (تعارضات npm override).
استخدم CLI المضمّن بدلًا من ذلك:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

للاحتفاظ بتنزيلات المتصفح، اضبط `PLAYWRIGHT_BROWSERS_PATH` (على سبيل المثال،
`/home/node/.cache/ms-playwright`) وتأكد من أن `/home/node` محفوظة عبر
`OPENCLAW_HOME_VOLUME` أو bind mount. راجع [Docker](/ar/install/docker).

## كيف يعمل (داخليًا)

يقبل خادم تحكم صغير عبر loopback طلبات HTTP ويتصل بالمتصفحات المستندة إلى Chromium عبر CDP. تمر الإجراءات المتقدمة (click/type/snapshot/PDF) عبر Playwright فوق CDP؛ وعند غياب Playwright، لا تتوفر إلا العمليات غير المعتمدة على Playwright. يرى الوكيل واجهة مستقرة واحدة بينما تتبدّل المتصفحات المحلية/البعيدة وملفات التعريف بحرية تحتها.

## مرجع CLI السريع

تقبل جميع الأوامر `--browser-profile <name>` لاستهداف ملف تعريف محدد، و`--json` من أجل خرج قابل للقراءة آليًا.

<AccordionGroup>

<Accordion title="الأساسيات: الحالة، وعلامات التبويب، والفتح/التركيز/الإغلاق">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # تشغيل محلي مُدار أحادي المرة بوضع headless
openclaw browser stop            # يمسح أيضًا المحاكاة في attach-only/remote CDP
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

<Accordion title="الفحص: لقطة الشاشة، واللقطة، ووحدة التحكم، والأخطاء، والطلبات">

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

<Accordion title="الإجراءات: التنقل، والنقر، والكتابة، والسحب، والانتظار، والتقييم">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # أو e12 لمراجع role
openclaw browser click-coords 120 340        # إحداثيات viewport
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

<Accordion title="الحالة: cookies، وstorage، ووضع عدم الاتصال، وheaders، والموقع الجغرافي، والجهاز">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # استخدم --clear للإزالة
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

ملاحظات:

- `upload` و`dialog` هما استدعاءا **تهيئة**؛ شغّلهما قبل النقر/الضغط الذي يفعّل chooser/dialog.
- تتطلب `click`/`type`/إلخ وجود `ref` من `snapshot` (`12` رقمي، أو `e12` لمراجع role، أو `ax12` لمراجع ARIA القابلة للتنفيذ). لا تُدعَم محددات CSS عمدًا للإجراءات. استخدم `click-coords` عندما يكون موضع viewport المرئي هو الهدف الموثوق الوحيد.
- تكون مسارات download وtrace وupload مقيّدة بجذور temp الخاصة بـ OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (البديل: `${os.tmpdir()}/openclaw/...`).
- يمكن لـ `upload` أيضًا تعيين مدخلات الملفات مباشرة عبر `--input-ref` أو `--element`.

تنجو معرّفات وعلامات علامات التبويب المستقرة من استبدال Chromium للهدف الخام عندما يستطيع OpenClaw
إثبات علامة التبويب البديلة، مثل نفس URL أو تحوّل علامة تبويب قديمة واحدة إلى
علامة تبويب جديدة واحدة بعد إرسال نموذج. تظل معرّفات الأهداف الخام متقلبة؛ ويفضَّل
استخدام `suggestedTargetId` من `tabs` في البرمجيات النصية.

نظرة سريعة على أعلام اللقطات:

- `--format ai` (الافتراضي مع Playwright): AI snapshot مع مراجع رقمية (`aria-ref="<n>"`).
- `--format aria`: شجرة إمكانية الوصول مع مراجع `axN`. عند توفر Playwright، يربط OpenClaw المراجع بمعرّفات DOM الخلفية إلى الصفحة الحية بحيث يمكن للإجراءات اللاحقة استخدامها؛ وإلا فاعتبر الخرج للفحص فقط.
- `--efficient` (أو `--mode efficient`): إعداد مسبق مدمج للقطات role. اضبط `browser.snapshotDefaults.mode: "efficient"` لجعله الافتراضي (راجع [إعدادات Gateway](/ar/gateway/configuration-reference#browser)).
- تفرض `--interactive` و`--compact` و`--depth` و`--selector` لقطة role مع مراجع `ref=e12`. ويجعل `--frame "<iframe>"` لقطات role محصورة في iframe.
- يضيف `--labels` لقطة شاشة للـ viewport فقط مع تسميات مراجع مركّبة فوقها (يطبع `MEDIA:<path>`).
- يضيف `--urls` وجهات الروابط المكتشفة إلى AI snapshots.

## اللقطات والمراجع

يدعم OpenClaw نمطين من “اللقطات”:

- **AI snapshot (مراجع رقمية)**: `openclaw browser snapshot` (الافتراضي؛ `--format ai`)
  - الخرج: لقطة نصية تتضمن مراجع رقمية.
  - الإجراءات: `openclaw browser click 12`، و`openclaw browser type 23 "hello"`.
  - داخليًا، يُحل المرجع عبر `aria-ref` في Playwright.

- **Role snapshot (مراجع role مثل `e12`)**: `openclaw browser snapshot --interactive` (أو `--compact`، أو `--depth`، أو `--selector`، أو `--frame`)
  - الخرج: قائمة/شجرة قائمة على role مع `[ref=e12]` (ومع `[nth=1]` اختياريًا).
  - الإجراءات: `openclaw browser click e12`، و`openclaw browser highlight e12`.
  - داخليًا، يُحل المرجع عبر `getByRole(...)` (بالإضافة إلى `nth()` للمكررات).
  - أضف `--labels` لتضمين لقطة شاشة للـ viewport مع تسميات `e12` مركّبة فوقها.
  - أضف `--urls` عندما يكون نص الرابط ملتبسًا ويحتاج الوكيل إلى
    أهداف تنقل ملموسة.

- **ARIA snapshot (مراجع ARIA مثل `ax12`)**: `openclaw browser snapshot --format aria`
  - الخرج: شجرة إمكانية الوصول على شكل عقد منظَّمة.
  - الإجراءات: يعمل `openclaw browser click ax12` عندما يستطيع مسار اللقطة ربط
    المرجع عبر Playwright ومعرّفات DOM الخلفية في Chrome.
- إذا لم يكن Playwright متاحًا، فقد تبقى لقطات ARIA مفيدة
  للفحص، لكن قد لا تكون المراجع قابلة للتنفيذ. أعد أخذ اللقطة باستخدام `--format ai`
  أو `--interactive` عندما تحتاج إلى مراجع قابلة للتنفيذ.
- دليل Docker لمسار الرجوع الاحتياطي raw-CDP: يبدأ `pnpm test:docker:browser-cdp-snapshot`
  Chromium مع CDP، ويشغّل `browser doctor --deep`، ويتحقق من أن
  لقطات role تتضمن URLs الروابط، والعناصر القابلة للنقر المرفوعة بالمؤشر، وبيانات iframe التعريفية.

سلوك المراجع:

- المراجع **ليست ثابتة عبر عمليات التنقل**؛ إذا فشل شيء ما، فأعد تشغيل `snapshot` واستخدم مرجعًا جديدًا.
- يعيد `/act` قيمة `targetId` الخام الحالية بعد الاستبدال الناتج عن الإجراء
  عندما يستطيع إثبات علامة التبويب البديلة. واصل استخدام معرّفات/تسميات علامات التبويب
  المستقرة في الأوامر اللاحقة.
- إذا أُخذت role snapshot باستخدام `--frame`، فإن مراجع role تُحصر في ذلك iframe حتى role snapshot التالية.
- تفشل مراجع `axN` غير المعروفة أو القديمة سريعًا بدلًا من الانتقال إلى
  محدد `aria-ref` الخاص بـ Playwright. شغّل snapshot جديدة على علامة التبويب نفسها عند
  حدوث ذلك.

## تحسينات الانتظار

يمكنك الانتظار على أكثر من مجرد الوقت/النص:

- الانتظار لعنوان URL (تُدعَم globs بواسطة Playwright):
  - `openclaw browser wait --url "**/dash"`
- الانتظار لحالة التحميل:
  - `openclaw browser wait --load networkidle`
- الانتظار لمحمول JS شرطي:
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

## تدفقات التصحيح

عندما يفشل إجراء ما (مثل “not visible” أو “strict mode violation” أو “covered”):

1. `openclaw browser snapshot --interactive`
2. استخدم `click <ref>` / `type <ref>` (وفضّل مراجع role في الوضع التفاعلي)
3. إذا استمر الفشل: استخدم `openclaw browser highlight <ref>` لمعرفة ما الذي يستهدفه Playwright
4. إذا كان سلوك الصفحة غريبًا:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. من أجل التصحيح المتعمق: سجّل trace:
   - `openclaw browser trace start`
   - أعد إنتاج المشكلة
   - `openclaw browser trace stop` (يطبع `TRACE:<path>`)

## خرج JSON

الوسيط `--json` مخصّص للبرمجة النصية والأدوات المنظَّمة.

أمثلة:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

تتضمن role snapshots في JSON قيمة `refs` بالإضافة إلى كتلة `stats` صغيرة (أسطر/محارف/مراجع/تفاعلي) حتى تتمكن الأدوات من الاستدلال على حجم الحمولة وكثافتها.

## مقابض الحالة والبيئة

هذه مفيدة لتدفقات “اجعل الموقع يتصرف مثل X”:

- Cookies: `cookies`، و`cookies set`، و`cookies clear`
- Storage: `storage local|session get|set|clear`
- عدم الاتصال: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (لا يزال `set headers --json '{"X-Debug":"1"}'` القديم مدعومًا)
- HTTP basic auth: `set credentials user pass` (أو `--clear`)
- الموقع الجغرافي: `set geo <lat> <lon> --origin "https://example.com"` (أو `--clear`)
- الوسائط: `set media dark|light|no-preference|none`
- المنطقة الزمنية / اللغة المحلية: `set timezone ...`، و`set locale ...`
- الجهاز / viewport:
  - `set device "iPhone 14"` (إعدادات أجهزة Playwright المسبقة)
  - `set viewport 1280 720`

## الأمان والخصوصية

- قد يحتوي ملف تعريف متصفح openclaw على جلسات مسجّل دخول فيها؛ تعامل معه على أنه حساس.
- ينفّذ `browser act kind=evaluate` / `openclaw browser evaluate` و`wait --fn`
  JavaScript عشوائيًا في سياق الصفحة. يمكن لحقن prompt
  توجيه ذلك. عطّله باستخدام `browser.evaluateEnabled=false` إذا لم تكن بحاجة إليه.
- لتسجيلات الدخول وملاحظات مكافحة الروبوتات (X/Twitter، إلخ)، راجع [تسجيل دخول Browser + النشر على X/Twitter](/ar/tools/browser-login).
- أبقِ مضيف Gateway/node خاصًا (loopback أو tailnet-only).
- نقاط نهاية remote CDP قوية؛ مرّرها عبر نفق واحمها.

مثال الوضع الصارم (حظر الوجهات الخاصة/الداخلية افتراضيًا):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // سماح دقيق اختياري
    },
  },
}
```

## ذو صلة

- [Browser](/ar/tools/browser) — نظرة عامة، والإعدادات، وملفات التعريف، والأمان
- [تسجيل دخول Browser](/ar/tools/browser-login) — تسجيل الدخول إلى المواقع
- [استكشاف أخطاء Browser على Linux وإصلاحها](/ar/tools/browser-linux-troubleshooting)
- [استكشاف أخطاء Browser على WSL2 وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
