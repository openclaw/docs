---
read_when:
    - برمجة متصفح الوكيل نصيًا أو تصحيح أخطائه عبر واجهة API المحلية للتحكم
    - هل تبحث عن مرجع CLI الخاص بـ `openclaw browser`؟
    - إضافة أتمتة مخصصة للمتصفح باستخدام اللقطات والمراجع
summary: واجهة API للتحكم في المتصفح في OpenClaw، ومرجع CLI، وإجراءات البرمجة النصية
title: واجهة API للتحكم في المتصفح
x-i18n:
    generated_at: "2026-07-16T14:58:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8063f55c9881e45e65492dc40e2902bf05feb08ae9a74986ba2d7621e0dbe71a
    source_path: tools/browser-control.md
    workflow: 16
---

للإعداد والتهيئة واستكشاف الأخطاء وإصلاحها، راجع [المتصفح](/ar/tools/browser).
هذه الصفحة هي المرجع لواجهة HTTP API المحلية للتحكم، وواجهة `openclaw browser`
CLI، وأنماط البرمجة النصية (اللقطات، والمراجع، والانتظار، ومسارات تصحيح الأخطاء).

## واجهة التحكم API (اختيارية)

لعمليات التكامل المحلية فقط، يوفّر Gateway واجهة HTTP API صغيرة عبر عنوان الاسترجاع.
هذا الخادم المستقل اختياري — عيّن متغير البيئة
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` في بيئة خدمة Gateway
وأعد تشغيل Gateway قبل أن تصبح نقاط نهاية HTTP متاحة. من دون
هذا المتغير، يظل وقت تشغيل التحكم بالمتصفح يعمل عبر CLI وأدوات
الوكيل، لكن لا تستمع أي خدمة على منفذ التحكم عبر عنوان الاسترجاع.

- الحالة/البدء/الإيقاف: `GET /`، `GET /doctor`، `POST /start`، `POST /stop`، `POST /reset-profile`
- الملفات الشخصية: `GET /profiles`، `POST /profiles/create`، `DELETE /profiles/:name`
- علامات التبويب: `GET /tabs`، `POST /tabs/open`، `POST /tabs/focus`، `DELETE /tabs/:targetId`، `POST /tabs/action`
- اللقطة/لقطة الشاشة: `GET /snapshot`، `POST /screenshot`
- الإجراءات: `POST /navigate`، `POST /act`
- الخطافات: `POST /hooks/file-chooser`، `POST /hooks/dialog`
- التنزيلات: `POST /download`، `POST /wait/download`
- الأذونات: `POST /permissions/grant`
- تصحيح الأخطاء: `GET /console`، `POST /pdf`
- تصحيح الأخطاء: `GET /errors`، `GET /requests`، `GET /dialogs`، `POST /trace/start`، `POST /trace/stop`، `POST /highlight`
- الشبكة: `POST /response/body`
- الحالة: `GET /cookies`، `POST /cookies/set`، `POST /cookies/clear`
- الحالة: `GET /storage/:kind`، `POST /storage/:kind/set`، `POST /storage/:kind/clear`
- الإعدادات: `POST /set/offline`، `POST /set/headers`، `POST /set/credentials`، `POST /set/geolocation`، `POST /set/media`، `POST /set/timezone`، `POST /set/locale`، `POST /set/device`

`POST /tabs/action` هو النموذج المجمّع الذي تستخدمه CLI داخليًا للأوامر الفرعية
`browser tab` ‏(`{"action":"new"|"label"|"select"|"close"|"list", ...}`)؛
ويُفضّل استخدام مسارات علامات التبويب أحادية الغرض أعلاه عند البرمجة النصية المباشرة.

تقبل جميع نقاط النهاية `?profile=<name>`. يطلب `POST /start?headless=true`
تشغيلًا لمرة واحدة من دون واجهة رسومية للملفات الشخصية المحلية المُدارة من دون تغيير تهيئة
المتصفح المحفوظة؛ وترفض الملفات الشخصية المخصصة للاتصال فقط، وCDP البعيد، والجلسات القائمة
هذا التجاوز لأن OpenClaw لا يشغّل عمليات المتصفح هذه.

بالنسبة إلى نقاط نهاية علامات التبويب، فإن `targetId` هو اسم حقل التوافق. يُفضّل تمرير
`suggestedTargetId` من `GET /tabs` أو `POST /tabs/open`؛ كما تُقبل التسميات ومقابض `tabId`
مثل `t1`. وتظل معرّفات أهداف CDP الأولية والبادئات الفريدة لمعرّفات
الأهداف الأولية صالحة، لكنها مقابض تشخيصية متقلبة.

إذا كانت مصادقة Gateway بالسر المشترك مهيأة، فتتطلب مسارات HTTP للمتصفح المصادقة أيضًا:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` أو مصادقة HTTP الأساسية باستخدام كلمة المرور هذه

ملاحظات:

- واجهة المتصفح المستقلة هذه عبر عنوان الاسترجاع **لا** تستهلك ترويسات هوية الوكيل الموثوق أو
  Tailscale Serve.
- إذا كانت `gateway.auth.mode` هي `none` أو `trusted-proxy`، فإن مسارات المتصفح عبر عنوان الاسترجاع هذه
  لا ترث أوضاع حمل الهوية تلك؛ أبقها مقتصرة على عنوان الاسترجاع.

### عقد أخطاء `/act`

يستخدم `POST /act` استجابة خطأ منظّمة لإخفاقات التحقق على مستوى المسار
وإخفاقات السياسة:

```json
{ "error": "<message>", "code": "ACT_*" }
```

قيم `code` الحالية:

- `ACT_KIND_REQUIRED` ‏(HTTP 400): ‏`kind` مفقود أو غير معروف.
- `ACT_INVALID_REQUEST` ‏(HTTP 400): فشلت تسوية حمولة الإجراء أو التحقق منها.
- `ACT_SELECTOR_UNSUPPORTED` ‏(HTTP 400): استُخدم `selector` مع نوع إجراء غير مدعوم.
- `ACT_EVALUATE_DISABLED` ‏(HTTP 403): ‏`evaluate` (أو `wait --fn`) معطّل بواسطة التهيئة.
- `ACT_TARGET_ID_MISMATCH` ‏(HTTP 403): يتعارض `targetId` عالي المستوى أو المجمّع مع هدف الطلب.
- `ACT_EXISTING_SESSION_UNSUPPORTED` ‏(HTTP 501): الإجراء غير مدعوم للملفات الشخصية ذات الجلسات القائمة.

قد تستمر إخفاقات وقت التشغيل الأخرى في إرجاع `{ "error": "<message>" }` من دون
حقل `code`.

### متطلب Playwright

تتطلب بعض الميزات (التنقل/الإجراء/لقطة AI/لقطة الدور، ولقطات شاشة العناصر،
وPDF) وجود Playwright. إذا لم يكن Playwright مثبتًا، فتعيد نقاط النهاية هذه
خطأ 501 واضحًا.

ما يظل يعمل من دون Playwright:

- لقطات ARIA
- لقطات إمكانية الوصول بنمط الدور (`--interactive`، `--compact`،
  `--depth`، `--efficient`) عند توفر WebSocket لـ CDP لكل علامة تبويب. وهذا
  مسار احتياطي للفحص واكتشاف المراجع؛ ويظل Playwright محرك
  الإجراءات الأساسي.
- لقطات شاشة الصفحة لمتصفح `openclaw` المُدار عند توفر WebSocket لـ CDP
  لكل علامة تبويب
- لقطات شاشة الصفحة لملفات `existing-session` / Chrome MCP الشخصية
- لقطات الشاشة المستندة إلى مراجع `existing-session` ‏(`--ref`) من مخرجات اللقطة

ما لا يزال يحتاج إلى Playwright:

- `navigate`
- `act`
- لقطات AI التي تعتمد على تنسيق لقطة AI الأصلي في Playwright
- لقطات شاشة العناصر باستخدام محددات CSS ‏(`--element`)
- تصدير PDF كامل للمتصفح

ترفض لقطات شاشة العناصر أيضًا `--full-page`؛ ويعيد المسار `fullPage is
not supported for element screenshots`.

إذا ظهر `Playwright is not available in this gateway build`، فإن حزمة
Gateway تفتقد تبعية وقت تشغيل المتصفح الأساسية. أعد تثبيت OpenClaw أو حدّثه،
ثم أعد تشغيل Gateway. وبالنسبة إلى Docker، ثبّت أيضًا ملفات متصفح Chromium
الثنائية كما هو موضح أدناه.

#### تثبيت Playwright في Docker

إذا كان Gateway يعمل في Docker، فتجنب `npx playwright` (تعارضات تجاوز npm).
بالنسبة إلى الصور المخصصة، ضمّن Chromium داخل الصورة:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

بالنسبة إلى صورة قائمة، ثبّته عبر CLI المضمّنة بدلًا من ذلك:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

للاحتفاظ بتنزيلات المتصفح، عيّن `PLAYWRIGHT_BROWSERS_PATH` (على سبيل المثال،
`/home/node/.cache/ms-playwright`) وتأكد من الاحتفاظ بـ `/home/node` عبر
`OPENCLAW_HOME_VOLUME` أو نقطة تحميل ربط. يكتشف OpenClaw تلقائيًا
Chromium المحتفَظ به على Linux. راجع [Docker](/ar/install/docker).

## آلية العمل (داخليًا)

يقبل خادم تحكم صغير عبر عنوان الاسترجاع طلبات HTTP ويتصل بالمتصفحات المستندة إلى Chromium عبر CDP. تمر الإجراءات المتقدمة (النقر/الكتابة/اللقطة/PDF) عبر Playwright فوق CDP؛ وعند غياب Playwright، لا تتوفر إلا العمليات التي لا تعتمد عليه. يرى الوكيل واجهة واحدة مستقرة بينما يمكن تبديل المتصفحات والملفات الشخصية المحلية والبعيدة بحرية في الطبقات الداخلية.

## مرجع CLI السريع

تقبل جميع الأوامر `--browser-profile <name>` لاستهداف ملف شخصي محدد، و`--json` لإخراج قابل للقراءة آليًا.

<AccordionGroup>

<Accordion title="الأساسيات: الحالة، علامات التبويب، الفتح/التركيز/الإغلاق">

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep    # إضافة فحص لقطة مباشر
openclaw browser start
openclaw browser start --headless # تشغيل محلي مُدار من دون واجهة رسومية لمرة واحدة
openclaw browser stop            # يمسح أيضًا المحاكاة في الاتصال فقط/CDP البعيد
openclaw browser reset-profile   # ينقل بيانات متصفح الملف الشخصي إلى سلة المهملات
openclaw browser tabs
openclaw browser tab             # اختصار لعلامة التبويب الحالية
openclaw browser tab new
openclaw browser tab new --label research
openclaw browser tab label abcd1234 research
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="الملفات الشخصية: العرض، الإنشاء، الحذف">

```bash
openclaw browser profiles
openclaw browser create-profile --name research --color "#0066CC"
openclaw browser create-profile --name attach --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser delete-profile --name research
```

</Accordion>

<Accordion title="الفحص: لقطة الشاشة، اللقطة، وحدة التحكم، الأخطاء، الطلبات">

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
openclaw browser snapshot --out snapshot.txt
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
openclaw browser click 12 --double           # أو e12 لمراجع الأدوار
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
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref e12
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

- تتيح أداة `browser` الموجّهة إلى الوكيل `action=download` (يتطلب `ref` و
  `path`) و`action=waitfordownload` (مع `path` اختياري). ويُرجع كلاهما عنوان URL
  المحفوظ للتنزيل، واسم الملف المقترح، والمسار المحلي المحمي. يتوفر اعتراض التنزيل
  الصريح لملفات تعريف Playwright المُدارة؛ أما ملفات تعريف الجلسات الحالية
  فتُرجع خطأ عملية غير مدعومة.
- يُفضّل استخدام عمليات رفع منتقي الملفات الذرّية: مرّر المشغّل `--ref` مع عملية الرفع كي يجهّز OpenClaw النقرة وينفّذها في طلب واحد. يظل `upload` الذي يقتصر على المسارات مدعومًا عندما يكون استخدام مشغّل لاحق مقصودًا. استخدم `--input-ref` أو `--element` لتعيين حقل إدخال ملف مباشرةً. يُعد `dialog` استدعاءً للتهيئة؛ شغّله قبل النقرة/الضغطة التي تُظهر مربع الحوار. إذا فتح إجراء نافذة مشروطة، فستتضمن استجابة الإجراء `blockedByDialog` و`browserState.dialogs.pending`؛ مرّر ذلك `dialogId` للاستجابة مباشرةً. تظهر مربعات الحوار التي جرت معالجتها خارج OpenClaw ضمن `browserState.dialogs.recent`.
- يتطلب `click`/`type`/وما إلى ذلك قيمة `ref` من `snapshot` (قيمة `12` رقمية، أو مرجع دور `e12`، أو مرجع ARIA قابل للتنفيذ `ax12`). لا تُدعم محددات CSS للإجراءات عن قصد. استخدم `click-coords` عندما يكون الموضع المرئي ضمن إطار العرض هو الهدف الموثوق الوحيد.
- تُقيّد مسارات التنزيل والتتبّع بالجذور المؤقتة لـ OpenClaw: `/tmp/openclaw{,/downloads}` (البديل الاحتياطي: `${os.tmpdir()}/openclaw/...`).
- يقبل `upload` الملفات من جذر عمليات الرفع المؤقتة في OpenClaw
  والوسائط الواردة التي يديرها OpenClaw. ويمكن الإشارة إلى الوسائط الواردة المُدارة بصيغة
  `media://inbound/<id>`، أو `media/inbound/<id>` نسبةً إلى صندوق العزل، أو باستخدام مسار
  محلول داخل دليل الوسائط الواردة المُدارة. ولا تزال مراجع الوسائط المتداخلة،
  واجتياز المسارات، والروابط الرمزية، والروابط الصلبة، والمسارات المحلية العشوائية مرفوضة.
- يمكن لـ `upload` أيضًا تعيين حقول إدخال الملفات مباشرةً عبر `--input-ref` أو `--element`.

تظل معرّفات علامات التبويب وتسمياتها الثابتة محفوظة عند استبدال الهدف الخام في Chromium إذا استطاع OpenClaw
إثبات علامة التبويب البديلة، مثل وجود زوج قديم/جديد فريد لعنوان URL نفسه أو
تحوّل علامة تبويب قديمة واحدة إلى علامة تبويب جديدة واحدة بعد إرسال نموذج. وتحصل
الاستبدالات الملتبسة ذات عناوين URL المكررة على مقابض جديدة. وتظل معرّفات الأهداف الخام
متقلبة؛ لذا يُفضّل استخدام `suggestedTargetId` من `tabs` في البرامج النصية.

نظرة سريعة على علامات اللقطات:

- `--format ai` (الافتراضي مع Playwright): لقطة للذكاء الاصطناعي تتضمن مراجع رقمية (`aria-ref="<n>"`).
- `--format aria`: شجرة إمكانية الوصول مع مراجع `axN`. عند توفر Playwright، يربط OpenClaw المراجع بمعرّفات DOM الخلفية في الصفحة الحية لكي تتمكن الإجراءات اللاحقة من استخدامها؛ وإلا فتعامل مع المخرجات على أنها مخصصة للفحص فقط.
- `--efficient` (أو `--mode efficient`): إعداد مسبق مضغوط للقطة الأدوار. عيّن `browser.snapshotDefaults.mode: "efficient"` لجعل هذا الإعداد افتراضيًا (راجع [تهيئة Gateway](/ar/gateway/configuration-reference#browser)).
- تفرض `--interactive` و`--compact` و`--depth` و`--selector` لقطة أدوار تحتوي على مراجع `ref=e12`. ويقصر `--frame "<iframe>"` لقطات الأدوار على إطار iframe.
- مع Playwright، يضيف `--labels` لقطة شاشة تتراكب عليها تسميات المراجع
  (ويطبع `MEDIA:<path>`) بالإضافة إلى مصفوفة `annotations` تحتوي على المربع المحيط
  بكل مرجع. في `screenshot`، تعمل التسميات المدعومة من Playwright مع `--full-page`
  و`--ref` و`--element`؛ أما في `snapshot`، فتظل لقطة الشاشة المصاحبة
  مقتصرة على إطار العرض. تعرض ملفات تعريف الجلسات الحالية/chrome-mcp تسميات متراكبة على
  لقطات شاشة الصفحة، لكنها لا تُرجع `annotations` ولا تستخدم مساعد Playwright
  لعرض الصفحة الكاملة/المرجع/العنصر. ومن دون Playwright أو chrome-mcp،
  لا تتوفر لقطات الشاشة ذات التسميات.
- يلحق `--urls` وجهات الروابط المكتشفة بلقطات الذكاء الاصطناعي.

## اللقطات والمراجع

يدعم OpenClaw نمطين من «اللقطات»:

- **لقطة الذكاء الاصطناعي (مراجع رقمية)**: `openclaw browser snapshot` (الافتراضي؛ `--format ai`)
  - المخرجات: لقطة نصية تتضمن مراجع رقمية.
  - الإجراءات: `openclaw browser click 12`، `openclaw browser type 23 "hello"`.
  - داخليًا، يُحل المرجع عبر `aria-ref` في Playwright.

- **لقطة الأدوار (مراجع أدوار مثل `e12`)**: `openclaw browser snapshot --interactive` (أو `--compact`، `--depth`، `--selector`، `--frame`)
  - المخرجات: قائمة/شجرة قائمة على الأدوار تحتوي على `[ref=e12]` (و`[nth=1]` اختياري).
  - الإجراءات: `openclaw browser click e12`، `openclaw browser highlight e12`.
  - داخليًا، يُحل المرجع عبر `getByRole(...)` (بالإضافة إلى `nth()` للتكرارات).
  - أضف `--labels` لتضمين لقطة شاشة تتراكب عليها تسميات `e12`. في
    ملفات التعريف المدعومة من Playwright، يؤدي هذا أيضًا إلى إرجاع بيانات المربع المحيط لكل مرجع
    (`annotations[]`).
  - أضف `--urls` عندما يكون نص الرابط ملتبسًا ويحتاج الوكيل إلى
    أهداف تنقّل محددة.

- **لقطة ARIA (مراجع ARIA مثل `ax12`)**: `openclaw browser snapshot --format aria`
  - المخرجات: شجرة إمكانية الوصول على هيئة عُقد منظّمة.
  - الإجراءات: يعمل `openclaw browser click ax12` عندما يستطيع مسار اللقطة ربط
    المرجع عبر Playwright ومعرّفات DOM الخلفية في Chrome.
- إذا لم يتوفر Playwright، فقد تظل لقطات ARIA مفيدة
  للفحص، لكن قد لا تكون المراجع قابلة للتنفيذ. التقط لقطة جديدة باستخدام `--format ai`
  أو `--interactive` عندما تحتاج إلى مراجع إجراءات.
- إثبات Docker لمسار الرجوع الاحتياطي لـ CDP الخام: يشغّل `pnpm test:docker:browser-cdp-snapshot`
  Chromium مع CDP، وينفّذ `browser doctor --deep`، ويتحقق من أن لقطات الأدوار
  تتضمن عناوين URL للروابط، والعناصر القابلة للنقر التي رُقّيت بواسطة المؤشر، وبيانات iframe الوصفية.

سلوك المراجع:

- المراجع **ليست ثابتة عبر عمليات التنقّل**؛ إذا فشل شيء ما، فأعد تشغيل `snapshot` واستخدم مرجعًا جديدًا.
- يُرجع `/act` قيمة `targetId` الخام الحالية بعد الاستبدال الناتج عن إجراء
  عندما يستطيع إثبات علامة التبويب البديلة. واصل استخدام معرّفات علامات التبويب/تسمياتها الثابتة
  للأوامر اللاحقة.
- إذا أُخذت لقطة الأدوار باستخدام `--frame`، فتظل مراجع الأدوار مقصورة على إطار iframe ذلك حتى لقطة الأدوار التالية.
- تفشل مراجع `axN` المجهولة أو القديمة بسرعة بدلًا من الانتقال احتياطيًا إلى
  محدد `aria-ref` في Playwright. التقط لقطة جديدة في علامة التبويب نفسها عندما
  يحدث ذلك.

## إمكانات الانتظار الإضافية

يمكن الانتظار لأكثر من مجرد الوقت/النص:

- انتظار عنوان URL (يدعم Playwright أنماط glob):
  - `openclaw browser wait --url "**/dash"`
- انتظار حالة التحميل:
  - `openclaw browser wait --load networkidle`
  - مدعوم في ملفات تعريف `openclaw` المُدارة وملفات تعريف CDP الخام/البعيدة. ترفض ملفات التعريف التي تستخدم برنامج التشغيل `existing-session` (بما فيها ملف التعريف الافتراضي `user`) القيمة `networkidle`؛ استخدم هناك `--url` أو `--text` أو محددًا أو عمليات انتظار `--fn`.
- انتظار تحقق شرط JavaScript:
  - `openclaw browser wait --fn "window.ready===true"`
- انتظار ظهور محدد:
  - `openclaw browser wait "#main"`

يمكن الجمع بينها:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## سير عمل تصحيح الأخطاء

عند فشل إجراء (مثل «غير مرئي» أو «انتهاك الوضع الصارم» أو «محجوب»):

1. `openclaw browser snapshot --interactive`
2. استخدم `click <ref>` / `type <ref>` (يُفضّل استخدام مراجع الأدوار في الوضع التفاعلي)
3. إذا استمر الفشل: استخدم `openclaw browser highlight <ref>` لمعرفة ما يستهدفه Playwright
4. إذا تصرفت الصفحة على نحو غير معتاد:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. للتصحيح المتعمق: سجّل تتبّعًا:
   - `openclaw browser trace start`
   - أعد إنتاج المشكلة
   - `openclaw browser trace stop` (يطبع `TRACE:<path>`)

## مخرجات JSON

يُستخدم `--json` للبرمجة النصية والأدوات المنظّمة.

أمثلة:

```bash
openclaw browser --json status
openclaw browser --json snapshot --interactive
openclaw browser --json requests --filter api
openclaw browser --json cookies
```

تتضمن لقطات الأدوار في JSON القيمة `refs` بالإضافة إلى كتلة `stats` صغيرة (الأسطر/المحارف/المراجع/التفاعلية) لكي تتمكن الأدوات من تحليل حجم الحمولة وكثافتها.

## عناصر التحكم في الحالة والبيئة

تفيد هذه العناصر في سير عمل «اجعل الموقع يتصرف مثل X»:

- ملفات تعريف الارتباط: `cookies`، `cookies set`، `cookies clear`
- التخزين: `storage local|session get|set|clear`
- وضع عدم الاتصال: `set offline on|off`
- الرؤوس: `set headers --headers-json '{"X-Debug":"1"}'` (أو الصيغة الموضعية `set headers '{"X-Debug":"1"}'`)
- مصادقة HTTP الأساسية: `set credentials user pass` (أو `--clear`)
- الموقع الجغرافي: `set geo <lat> <lon> --origin "https://example.com"` (أو `--clear`)
- الوسائط: `set media dark|light|no-preference|none`
- المنطقة الزمنية / الإعدادات المحلية: `set timezone ...`، `set locale ...`
- الجهاز / إطار العرض:
  - `set device "iPhone 14"` (إعدادات أجهزة Playwright المسبقة)
  - `set viewport 1280 720`

## الأمان والخصوصية

- قد يحتوي ملف تعريف متصفح openclaw على جلسات مسجّل دخولها؛ فتعامَل معه على أنه حساس.
- ينفّذ `browser act kind=evaluate` / `openclaw browser evaluate` و`wait --fn`
  تعليمات JavaScript برمجية عشوائية في سياق الصفحة. وقد يوجّه حقن المطالبات
  هذا السلوك. عطّله باستخدام `browser.evaluateEnabled=false` إذا لم تكن بحاجة إليه.
- يقبل `openclaw browser evaluate --fn` مصدر دالة، أو تعبيرًا، أو
  متن عبارة. تُغلّف متون العبارات كدوال غير متزامنة، لذا استخدم
  `return` للقيمة التي تريد إرجاعها. استخدم `--timeout-ms <ms>` عندما
  تحتاج الدالة العاملة داخل الصفحة إلى وقت أطول من مهلة التقييم الافتراضية.
- لتسجيلات الدخول وملاحظات مكافحة الروبوتات (X/Twitter وما إلى ذلك)، راجع [تسجيل الدخول في المتصفح + النشر على X/Twitter](/ar/tools/browser-login).
- أبقِ مضيف Gateway/node خاصًا (عبر loopback أو tailnet فقط).
- نقاط نهاية CDP البعيدة قوية؛ استخدم نفقًا للوصول إليها واحمِها.

مثال على الوضع الصارم (حظر الوجهات الخاصة/الداخلية افتراضيًا):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // سماح مطابق تمامًا اختياري
    },
  },
}
```

## ذو صلة

- [المتصفح](/ar/tools/browser) - نظرة عامة، والتهيئة، وملفات التعريف، والأمان
- [تسجيل الدخول في المتصفح](/ar/tools/browser-login) - تسجيل الدخول إلى المواقع
- [استكشاف أخطاء المتصفح على Linux وإصلاحها](/ar/tools/browser-linux-troubleshooting)
- [استكشاف أخطاء المتصفح على WSL2 وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
