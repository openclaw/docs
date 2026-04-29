---
read_when:
    - ساخت یا اشکال‌زدایی Plugin‌های بومی OpenClaw
    - درک مدل قابلیت Plugin یا مرزهای مالکیت
    - کار روی خط لولهٔ بارگذاری Plugin یا رجیستری
    - پیاده‌سازی قلاب‌های زمان اجرای ارائه‌دهنده یا Plugin‌های کانال
sidebarTitle: Internals
summary: 'جزئیات داخلی Plugin: مدل قابلیت، مالکیت، قراردادها، خط لوله بارگذاری، و کمک‌کارهای زمان اجرا'
title: جزئیات داخلی Plugin
x-i18n:
    generated_at: "2026-04-29T23:13:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1516e0784a005af87a6c081d8027a1e2dc10445e47b6824488e9d9987bb96975
    source_path: plugins/architecture.md
    workflow: 16
---

این **مرجع معماری عمیق** برای سیستم Plugin در OpenClaw است. برای راهنماهای عملی، با یکی از صفحه‌های متمرکز زیر شروع کنید.

<CardGroup cols={2}>
  <Card title="نصب و استفاده از Pluginها" icon="plug" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای افزودن، فعال‌سازی، و عیب‌یابی Pluginها.
  </Card>
  <Card title="ساخت Pluginها" icon="rocket" href="/fa/plugins/building-plugins">
    آموزش اولین Plugin با کوچک‌ترین manifest کاری.
  </Card>
  <Card title="Pluginهای کانال" icon="comments" href="/fa/plugins/sdk-channel-plugins">
    یک Plugin کانال پیام‌رسانی بسازید.
  </Card>
  <Card title="Pluginهای provider" icon="microchip" href="/fa/plugins/sdk-provider-plugins">
    یک Plugin provider مدل بسازید.
  </Card>
  <Card title="نمای کلی SDK" icon="book" href="/fa/plugins/sdk-overview">
    مرجع import map و API ثبت.
  </Card>
</CardGroup>

## مدل قابلیت عمومی

قابلیت‌ها مدل عمومی **Plugin بومی** داخل OpenClaw هستند. هر Plugin بومی OpenClaw در برابر یک یا چند نوع قابلیت ثبت می‌شود:

| قابلیت | روش ثبت | Pluginهای نمونه |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| استنتاج متن | `api.registerProvider(...)` | `openai`, `anthropic` |
| backend استنتاج CLI | `api.registerCliBackend(...)` | `openai`, `anthropic` |
| گفتار | `api.registerSpeechProvider(...)` | `elevenlabs`, `microsoft` |
| رونویسی بلادرنگ | `api.registerRealtimeTranscriptionProvider(...)` | `openai` |
| صدای بلادرنگ | `api.registerRealtimeVoiceProvider(...)` | `openai` |
| درک رسانه | `api.registerMediaUnderstandingProvider(...)` | `openai`, `google` |
| تولید تصویر | `api.registerImageGenerationProvider(...)` | `openai`, `google`, `fal`, `minimax` |
| تولید موسیقی | `api.registerMusicGenerationProvider(...)` | `google`, `minimax` |
| تولید ویدئو | `api.registerVideoGenerationProvider(...)` | `qwen` |
| دریافت Web | `api.registerWebFetchProvider(...)` | `firecrawl` |
| جست‌وجوی Web | `api.registerWebSearchProvider(...)` | `google` |
| کانال / پیام‌رسانی | `api.registerChannel(...)` | `msteams`, `matrix` |
| کشف Gateway | `api.registerGatewayDiscoveryService(...)` | `bonjour` |

<Note>
Pluginی که هیچ قابلیتی ثبت نمی‌کند اما hookها، ابزارها، سرویس‌های کشف، یا سرویس‌های پس‌زمینه ارائه می‌دهد، یک Plugin **قدیمی فقط-hook** است. این الگو همچنان کاملاً پشتیبانی می‌شود.
</Note>

### موضع سازگاری خارجی

مدل قابلیت در core فرود آمده و امروز توسط Pluginهای بسته‌بندی‌شده/بومی استفاده می‌شود، اما سازگاری Plugin خارجی هنوز به معیار محکم‌تری از «صادر شده، پس منجمد است» نیاز دارد.

| وضعیت Plugin | راهنمایی |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Pluginهای خارجی موجود | ادغام‌های مبتنی بر hook را فعال نگه دارید؛ این خط پایه سازگاری است. |
| Pluginهای بسته‌بندی‌شده/بومی جدید | ثبت صریح قابلیت را بر دسترسی‌های vendor-specific یا طراحی‌های جدید فقط-hook ترجیح دهید. |
| Pluginهای خارجی که ثبت قابلیت را می‌پذیرند | مجاز است، اما سطح‌های کمکی مختص قابلیت را در حال تحول در نظر بگیرید مگر اینکه مستندات آن‌ها را پایدار علامت‌گذاری کنند. |

ثبت قابلیت جهت‌گیری مورد نظر است. hookهای قدیمی در دوره گذار همچنان امن‌ترین مسیر بدون شکست برای Pluginهای خارجی هستند. همه subpathهای کمکی صادرشده برابر نیستند — قراردادهای باریک و مستند را بر exportهای کمکی اتفاقی ترجیح دهید.

### شکل‌های Plugin

OpenClaw هر Plugin بارگذاری‌شده را بر اساس رفتار ثبت واقعی آن، نه فقط metadata ایستا، در یک شکل طبقه‌بندی می‌کند:

<AccordionGroup>
  <Accordion title="plain-capability">
    دقیقاً یک نوع قابلیت ثبت می‌کند، برای مثال یک Plugin فقط-provider مانند `mistral`.
  </Accordion>
  <Accordion title="hybrid-capability">
    چند نوع قابلیت ثبت می‌کند، برای مثال `openai` مالک استنتاج متن، گفتار، درک رسانه، و تولید تصویر است.
  </Accordion>
  <Accordion title="hook-only">
    فقط hookها را ثبت می‌کند، چه typed چه سفارشی، بدون قابلیت‌ها، ابزارها، فرمان‌ها، یا سرویس‌ها.
  </Accordion>
  <Accordion title="non-capability">
    ابزارها، فرمان‌ها، سرویس‌ها، یا routeها را ثبت می‌کند اما هیچ قابلیتی ندارد.
  </Accordion>
</AccordionGroup>

برای دیدن شکل و تفکیک قابلیت‌های یک Plugin از `openclaw plugins inspect <id>` استفاده کنید. برای جزئیات، [مرجع CLI](/fa/cli/plugins#inspect) را ببینید.

### hookهای قدیمی

hook با نام `before_agent_start` همچنان به عنوان مسیر سازگاری برای Pluginهای فقط-hook پشتیبانی می‌شود. Pluginهای قدیمی واقعی هنوز به آن وابسته‌اند.

جهت‌گیری:

- آن را فعال نگه دارید
- آن را به عنوان قدیمی مستند کنید
- برای کار override مدل/provider، `before_model_resolve` را ترجیح دهید
- برای کار تغییر prompt، `before_prompt_build` را ترجیح دهید
- فقط پس از کاهش استفاده واقعی و اثبات ایمنی migration توسط پوشش fixture حذف کنید

### سیگنال‌های سازگاری

وقتی `openclaw doctor` یا `openclaw plugins inspect <id>` را اجرا می‌کنید، ممکن است یکی از این برچسب‌ها را ببینید:

| سیگنال | معنا |
| -------------------------- | ------------------------------------------------------------ |
| **config معتبر** | Config به‌درستی parse می‌شود و Pluginها resolve می‌شوند |
| **هشدار سازگاری** | Plugin از الگویی پشتیبانی‌شده اما قدیمی‌تر استفاده می‌کند، مانند `hook-only` |
| **هشدار قدیمی** | Plugin از `before_agent_start` استفاده می‌کند که deprecated است |
| **خطای سخت** | Config نامعتبر است یا Plugin بارگذاری نشد |

نه `hook-only` و نه `before_agent_start` امروز Plugin شما را خراب نمی‌کنند: `hook-only` جنبه advisory دارد، و `before_agent_start` فقط یک هشدار ایجاد می‌کند. این سیگنال‌ها در `openclaw status --all` و `openclaw plugins doctor` هم ظاهر می‌شوند.

## نمای کلی معماری

سیستم Plugin در OpenClaw چهار لایه دارد:

<Steps>
  <Step title="Manifest + کشف">
    OpenClaw Pluginهای candidate را از مسیرهای پیکربندی‌شده، ریشه‌های workspace، ریشه‌های Plugin سراسری، و Pluginهای بسته‌بندی‌شده پیدا می‌کند. کشف ابتدا manifestهای بومی `openclaw.plugin.json` به‌علاوه manifestهای bundle پشتیبانی‌شده را می‌خواند.
  </Step>
  <Step title="فعال‌سازی + اعتبارسنجی">
    Core تصمیم می‌گیرد که آیا یک Plugin کشف‌شده فعال، غیرفعال، مسدود، یا برای یک slot انحصاری مانند memory انتخاب شده است.
  </Step>
  <Step title="بارگذاری runtime">
    Pluginهای بومی OpenClaw به‌صورت in-process از طریق jiti بارگذاری می‌شوند و قابلیت‌ها را در یک registry مرکزی ثبت می‌کنند. bundleهای سازگار بدون import کردن کد runtime به recordهای registry نرمال‌سازی می‌شوند.
  </Step>
  <Step title="مصرف سطح‌ها">
    بقیه OpenClaw برای ارائه ابزارها، کانال‌ها، راه‌اندازی provider، hookها، routeهای HTTP، فرمان‌های CLI، و سرویس‌ها registry را می‌خواند.
  </Step>
</Steps>

به‌طور خاص برای CLI Plugin، کشف فرمان root در دو مرحله تقسیم می‌شود:

- metadata زمان parse از `registerCli(..., { descriptors: [...] })` می‌آید
- ماژول CLI واقعی Plugin می‌تواند lazy بماند و در اولین فراخوانی ثبت شود

این کار کد CLI متعلق به Plugin را داخل Plugin نگه می‌دارد و در عین حال به OpenClaw اجازه می‌دهد نام‌های فرمان root را پیش از parse رزرو کند.

مرز طراحی مهم:

- اعتبارسنجی manifest/config باید از **metadata manifest/schema** بدون اجرای کد Plugin کار کند
- کشف قابلیت بومی ممکن است کد entry Plugin مورد اعتماد را بارگذاری کند تا یک snapshot از registry غیر‌فعال‌ساز بسازد
- رفتار runtime بومی از مسیر `register(api)` ماژول Plugin با `api.registrationMode === "full"` می‌آید

این جداسازی به OpenClaw اجازه می‌دهد پیش از فعال شدن runtime کامل، config را اعتبارسنجی کند، Pluginهای missing/disabled را توضیح دهد، و hintهای UI/schema بسازد.

### snapshot metadata Plugin و جدول lookup

راه‌اندازی Gateway برای snapshot فعلی config یک `PluginMetadataSnapshot` می‌سازد. این snapshot فقط metadata است: فهرست Pluginهای نصب‌شده، registry manifest، diagnostics manifest، owner mapها، یک normalizer شناسه Plugin، و recordهای manifest را ذخیره می‌کند. ماژول‌های Plugin بارگذاری‌شده، SDKهای provider، محتوای package، یا exportهای runtime را نگه نمی‌دارد.

اعتبارسنجی config آگاه از Plugin، auto-enable راه‌اندازی، و bootstrap Plugin در Gateway آن snapshot را مصرف می‌کنند، به‌جای اینکه metadata مربوط به manifest/index را مستقل بازسازی کنند. `PluginLookUpTable` از همان snapshot مشتق می‌شود و plan Plugin راه‌اندازی را برای config runtime فعلی اضافه می‌کند.

پس از راه‌اندازی، Gateway snapshot metadata فعلی را به عنوان یک محصول runtime قابل جایگزینی نگه می‌دارد. کشف مکرر provider در runtime می‌تواند به‌جای بازسازی index نصب‌شده و registry manifest برای هر pass کاتالوگ provider، آن snapshot را قرض بگیرد. snapshot هنگام shutdown Gateway، تغییرات config/inventory Plugin، و نوشتن‌های index نصب‌شده پاک یا جایگزین می‌شود؛ وقتی snapshot فعلی سازگاری وجود ندارد، callerها به مسیر سرد manifest/index برمی‌گردند. بررسی‌های سازگاری باید ریشه‌های کشف Plugin مانند `plugins.load.paths` و workspace پیش‌فرض agent را شامل شوند، چون Pluginهای workspace بخشی از دامنه metadata هستند.

snapshot و جدول lookup تصمیم‌های تکراری راه‌اندازی را روی مسیر سریع نگه می‌دارند:

- مالکیت کانال
- راه‌اندازی deferred کانال
- شناسه‌های Plugin راه‌اندازی
- مالکیت provider و backend CLI
- مالکیت setup provider، alias فرمان، provider کاتالوگ مدل، و قرارداد manifest
- اعتبارسنجی schema مربوط به config Plugin و config کانال
- تصمیم‌های auto-enable راه‌اندازی

مرز ایمنی جایگزینی snapshot است، نه mutation. وقتی config، inventory Plugin، recordهای نصب، یا policy index پایدار تغییر می‌کند، snapshot را دوباره بسازید. آن را به عنوان یک registry سراسری mutable گسترده در نظر نگیرید، و snapshotهای تاریخی نامحدود نگه ندارید. بارگذاری runtime Plugin از snapshotهای metadata جدا می‌ماند تا state قدیمی runtime پشت cache metadata پنهان نشود.

قاعده cache در [جزئیات داخلی معماری Plugin](/fa/plugins/architecture-internals#plugin-cache-boundary) مستند شده است: metadata مربوط به manifest و کشف تازه است مگر اینکه یک caller برای flow فعلی snapshot، جدول lookup، یا registry manifest صریح داشته باشد. cacheهای metadata پنهان و TTLهای مبتنی بر wall-clock بخشی از بارگذاری Plugin نیستند. فقط cacheهای loader runtime، ماژول، و dependency-artifact ممکن است پس از بارگذاری واقعی کد یا artifactهای نصب‌شده پایدار بمانند.

برخی callerهای مسیر سرد هنوز به‌جای دریافت یک `PluginLookUpTable` از Gateway، registryهای manifest را مستقیماً از index پایدار Plugin نصب‌شده بازسازی می‌کنند. آن مسیر اکنون registry را بر حسب نیاز بازسازی می‌کند؛ وقتی caller از قبل یکی دارد، عبور دادن جدول lookup فعلی یا یک registry manifest صریح از میان flowهای runtime را ترجیح دهید.

### برنامه‌ریزی activation

برنامه‌ریزی activation بخشی از control plane است. callerها می‌توانند پیش از بارگذاری registryهای runtime گسترده‌تر بپرسند کدام Pluginها به یک فرمان، provider، کانال، route، agent harness، یا قابلیت مشخص مربوط‌اند.

planner رفتار فعلی manifest را سازگار نگه می‌دارد:

- فیلدهای `activation.*` hintهای صریح planner هستند
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`, و hookها همچنان fallback مالکیت manifest می‌مانند
- API planner فقط-شناسه برای callerهای موجود در دسترس می‌ماند
- API plan برچسب‌های دلیل را گزارش می‌کند تا diagnostics بتواند hintهای صریح را از fallback مالکیت تشخیص دهد

<Warning>
`activation` را به‌عنوان hook چرخهٔ حیات یا جایگزینی برای `register(...)` در نظر نگیرید. این metadata برای محدود کردن loading استفاده می‌شود. وقتی فیلدهای مالکیت از قبل رابطه را توصیف می‌کنند، آن‌ها را ترجیح دهید؛ از `activation` فقط برای hintهای اضافی planner استفاده کنید.
</Warning>

### Pluginهای کانال و ابزار پیام مشترک

Pluginهای کانال برای اقدام‌های عادی chat نیازی ندارند ابزار جداگانه‌ای برای ارسال/ویرایش/واکنش ثبت کنند. OpenClaw یک ابزار مشترک `message` را در هسته نگه می‌دارد، و Pluginهای کانال مالک discovery و اجرای مخصوص کانال در پشت آن هستند.

مرز فعلی این است:

- هسته مالک میزبان ابزار مشترک `message`، اتصال prompt، نگهداری session/thread، و dispatch اجرا است
- Pluginهای کانال مالک discovery اقدام scoped، discovery قابلیت، و هر schema fragment مخصوص کانال هستند
- Pluginهای کانال مالک دستور زبان گفت‌وگوی session مخصوص provider هستند، مثل اینکه conversation idها چگونه thread idها را encode می‌کنند یا از گفت‌وگوهای والد ارث‌بری می‌کنند
- Pluginهای کانال اقدام نهایی را از طریق action adapter خود اجرا می‌کنند

برای Pluginهای کانال، سطح SDK برابر با `ChannelMessageActionAdapter.describeMessageTool(...)` است. آن فراخوانی discovery یکپارچه به Plugin اجازه می‌دهد اقدام‌های قابل مشاهده، قابلیت‌ها، و مشارکت‌های schema خود را با هم برگرداند تا این بخش‌ها از هم فاصله نگیرند.

وقتی یک پارامتر مخصوص کانال در ابزار پیام، منبع رسانه‌ای مانند مسیر local یا URL رسانهٔ remote را حمل می‌کند، Plugin باید `mediaSourceParams` را هم از `describeMessageTool(...)` برگرداند. هسته از آن فهرست صریح برای اعمال نرمال‌سازی مسیر sandbox و hintهای دسترسی outbound به رسانه استفاده می‌کند، بدون اینکه نام پارامترهای متعلق به Plugin را hardcode کند. در آنجا mapهای scoped به action را ترجیح دهید، نه یک فهرست تخت و سراسری برای کل کانال، تا یک پارامتر رسانه‌ای فقط مربوط به profile روی actionهای نامرتبط مثل `send` نرمال‌سازی نشود.

هسته runtime scope را به آن مرحلهٔ discovery پاس می‌دهد. فیلدهای مهم شامل این‌ها هستند:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` ورودی trusted

این برای Pluginهای وابسته به context مهم است. یک کانال می‌تواند actionهای پیام را بر اساس حساب فعال، room/thread/message فعلی، یا هویت trusted درخواست‌کننده مخفی یا آشکار کند، بدون اینکه branchهای مخصوص کانال در ابزار `message` هسته hardcode شوند.

به همین دلیل تغییرات routing برای embedded-runner هنوز کار Plugin است: runner مسئول است هویت chat/session فعلی را به مرز discovery Plugin forward کند تا ابزار مشترک `message` سطح متعلق به کانال درست را برای turn فعلی آشکار کند.

برای helperهای اجرای متعلق به کانال، Pluginهای bundled باید runtime اجرا را داخل moduleهای extension خودشان نگه دارند. هسته دیگر runtimeهای action پیام Discord، Slack، Telegram، یا WhatsApp را زیر `src/agents/tools` مالک نیست. ما subpathهای جداگانهٔ `plugin-sdk/*-action-runtime` منتشر نمی‌کنیم، و Pluginهای bundled باید کد runtime local خودشان را مستقیما از moduleهای متعلق به extension خود import کنند.

همین مرز به طور کلی برای seamهای SDK دارای نام provider هم اعمال می‌شود: هسته نباید barrelهای convenience مخصوص کانال را برای Slack، Discord، Signal، WhatsApp، یا extensionهای مشابه import کند. اگر هسته به رفتاری نیاز دارد، یا barrel خود Plugin bundled یعنی `api.ts` / `runtime-api.ts` را مصرف کنید، یا نیاز را به یک قابلیت narrow generic در SDK مشترک ارتقا دهید.

Pluginهای bundled از همین قاعده پیروی می‌کنند. `runtime-api.ts` یک Plugin bundled نباید facade برنددار خودش یعنی `openclaw/plugin-sdk/<plugin-id>` را دوباره export کند. آن facadeهای برنددار shimهای compatibility برای Pluginهای خارجی و مصرف‌کنندگان قدیمی‌تر باقی می‌مانند، اما Pluginهای bundled باید از exportهای local به‌همراه subpathهای narrow generic SDK مانند `openclaw/plugin-sdk/channel-policy`، `openclaw/plugin-sdk/runtime-store`، یا `openclaw/plugin-sdk/webhook-ingress` استفاده کنند. کد جدید نباید facadeهای SDK مخصوص plugin-id اضافه کند، مگر اینکه مرز compatibility برای یک ecosystem خارجی موجود به آن نیاز داشته باشد.

برای pollها به‌طور مشخص، دو مسیر اجرا وجود دارد:

- `outbound.sendPoll` baseline مشترک برای کانال‌هایی است که با مدل رایج poll سازگارند
- `actions.handleAction("poll")` مسیر ترجیحی برای معناشناسی poll مخصوص کانال یا پارامترهای اضافی poll است

اکنون هسته parsing مشترک poll را تا بعد از اینکه dispatch poll در Plugin اقدام را رد کند به تعویق می‌اندازد، بنابراین handlerهای poll متعلق به Plugin می‌توانند فیلدهای poll مخصوص کانال را بپذیرند، بدون اینکه ابتدا توسط parser generic poll مسدود شوند.

برای توالی کامل startup، [جزئیات معماری Plugin](/fa/plugins/architecture-internals) را ببینید.

## مدل مالکیت قابلیت

OpenClaw یک Plugin بومی را مرز مالکیت برای یک **شرکت** یا یک **قابلیت** می‌داند، نه مجموعه‌ای درهم از integrationهای نامرتبط.

این یعنی:

- یک Plugin شرکت معمولا باید همهٔ سطح‌های رو به OpenClaw آن شرکت را مالک باشد
- یک Plugin قابلیت معمولا باید مالک سطح کامل قابلیتی باشد که معرفی می‌کند
- کانال‌ها باید به‌جای پیاده‌سازی دوبارهٔ رفتار provider به‌صورت ad hoc، قابلیت‌های مشترک هسته را مصرف کنند

<AccordionGroup>
  <Accordion title="چند قابلیتی vendor">
    `openai` مالک text inference، speech، realtime voice، media understanding، و image generation است. `google` مالک text inference به‌همراه media understanding، image generation، و web search است. `qwen` مالک text inference به‌همراه media understanding و video generation است.
  </Accordion>
  <Accordion title="تک قابلیتی vendor">
    `elevenlabs` و `microsoft` مالک speech هستند؛ `firecrawl` مالک web-fetch است؛ `minimax` / `mistral` / `moonshot` / `zai` مالک backendهای media-understanding هستند.
  </Accordion>
  <Accordion title="Plugin قابلیت">
    `voice-call` مالک transport تماس، ابزارها، CLI، routeها، و bridging برای Twilio media-stream است، اما به‌جای import مستقیم Pluginهای vendor، قابلیت‌های مشترک speech، realtime transcription، و realtime voice را مصرف می‌کند.
  </Accordion>
</AccordionGroup>

وضعیت نهایی مورد نظر این است:

- OpenAI در یک Plugin زندگی می‌کند، حتی اگر مدل‌های متنی، speech، imageها، و video آینده را پوشش دهد
- vendor دیگری می‌تواند برای سطح خودش همین کار را انجام دهد
- کانال‌ها اهمیتی نمی‌دهند کدام Plugin vendor مالک provider است؛ آن‌ها contract قابلیت مشترکی را که هسته expose کرده مصرف می‌کنند

تمایز کلیدی این است:

- **Plugin** = مرز مالکیت
- **قابلیت** = contract هسته که چند Plugin می‌توانند آن را پیاده‌سازی یا مصرف کنند

پس اگر OpenClaw یک domain جدید مثل video اضافه کند، پرسش اول این نیست که «کدام provider باید handling ویدئو را hardcode کند؟» پرسش اول این است: «contract قابلیت ویدئوی هسته چیست؟» وقتی آن contract وجود داشته باشد، Pluginهای vendor می‌توانند در برابر آن ثبت شوند و Pluginهای کانال/قابلیت می‌توانند آن را مصرف کنند.

اگر قابلیت هنوز وجود ندارد، حرکت درست معمولا این است:

<Steps>
  <Step title="قابلیت را تعریف کنید">
    قابلیت missing را در هسته تعریف کنید.
  </Step>
  <Step title="از طریق SDK expose کنید">
    آن را به‌شکل typed از طریق plugin API/runtime expose کنید.
  </Step>
  <Step title="مصرف‌کنندگان را wire کنید">
    کانال‌ها/قابلیت‌ها را به آن قابلیت wire کنید.
  </Step>
  <Step title="پیاده‌سازی‌های vendor">
    اجازه دهید Pluginهای vendor پیاده‌سازی‌ها را ثبت کنند.
  </Step>
</Steps>

این کار مالکیت را صریح نگه می‌دارد و در عین حال از رفتار هسته که به یک vendor واحد یا مسیر کد یک‌بارهٔ مخصوص Plugin وابسته است جلوگیری می‌کند.

### لایه‌بندی قابلیت

وقتی تصمیم می‌گیرید کد کجا قرار بگیرد، از این مدل ذهنی استفاده کنید:

<Tabs>
  <Tab title="لایهٔ قابلیت هسته">
    orchestration مشترک، policy، fallback، قواعد merge پیکربندی، معناشناسی delivery، و contractهای typed.
  </Tab>
  <Tab title="لایهٔ Plugin vendor">
    APIهای مخصوص vendor، auth، catalogهای مدل، speech synthesis، image generation، backendهای video آینده، endpointهای usage.
  </Tab>
  <Tab title="لایهٔ Plugin کانال/قابلیت">
    integration برای Slack/Discord/voice-call/etc. که قابلیت‌های هسته را مصرف می‌کند و آن‌ها را روی یک surface ارائه می‌دهد.
  </Tab>
</Tabs>

برای مثال، TTS از این شکل پیروی می‌کند:

- هسته مالک policy مربوط به TTS در زمان reply، ترتیب fallback، prefها، و delivery کانال است
- `openai`، `elevenlabs`، و `microsoft` مالک پیاده‌سازی‌های synthesis هستند
- `voice-call` helper مربوط به runtime تلفنی TTS را مصرف می‌کند

همین الگو باید برای قابلیت‌های آینده ترجیح داده شود.

### نمونهٔ Plugin شرکت چند قابلیتی

یک Plugin شرکت باید از بیرون منسجم به نظر برسد. اگر OpenClaw برای مدل‌ها، speech، realtime transcription، realtime voice، media understanding، image generation، video generation، web fetch، و web search contractهای مشترک داشته باشد، یک vendor می‌تواند همهٔ surfaceهای خودش را در یک مکان مالک باشد:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

آنچه اهمیت دارد نام دقیق helperها نیست. شکل کار مهم است:

- یک Plugin مالک سطح vendor است
- هسته همچنان مالک contractهای قابلیت است
- کانال‌ها و Pluginهای قابلیت، helperهای `api.runtime.*` را مصرف می‌کنند، نه کد vendor را
- تست‌های contract می‌توانند assert کنند که Plugin قابلیت‌هایی را که ادعای مالکیتشان را دارد ثبت کرده است

### نمونهٔ قابلیت: درک ویدئو

OpenClaw از قبل درک image/audio/video را به‌عنوان یک قابلیت مشترک در نظر می‌گیرد. همان مدل مالکیت در آنجا هم اعمال می‌شود:

<Steps>
  <Step title="هسته contract را تعریف می‌کند">
    هسته contract مربوط به media-understanding را تعریف می‌کند.
  </Step>
  <Step title="Pluginهای vendor ثبت می‌کنند">
    Pluginهای vendor، بسته به مورد، `describeImage`، `transcribeAudio`، و `describeVideo` را ثبت می‌کنند.
  </Step>
  <Step title="مصرف‌کنندگان از رفتار مشترک استفاده می‌کنند">
    کانال‌ها و Pluginهای قابلیت به‌جای wire مستقیم به کد vendor، رفتار مشترک هسته را مصرف می‌کنند.
  </Step>
</Steps>

این کار از جاگذاری فرضیات ویدئویی یک provider در هسته جلوگیری می‌کند. Plugin مالک سطح vendor است؛ هسته مالک contract قابلیت و رفتار fallback است.

Video generation از قبل از همین توالی استفاده می‌کند: هسته مالک contract قابلیت typed و helper runtime است، و Pluginهای vendor پیاده‌سازی‌های `api.registerVideoGenerationProvider(...)` را در برابر آن ثبت می‌کنند.

به یک checklist rollout مشخص نیاز دارید؟ [Capability Cookbook](/fa/plugins/architecture) را ببینید.

## Contractها و enforcement

سطح plugin API عمدا typed و در `OpenClawPluginApi` متمرکز است. آن contract نقاط ثبت پشتیبانی‌شده و helperهای runtime را که یک Plugin می‌تواند به آن‌ها تکیه کند تعریف می‌کند.

چرا این مهم است:

- نویسندگان Plugin یک استاندارد داخلی پایدار دریافت می‌کنند
- هسته می‌تواند مالکیت duplicate، مانند ثبت یک provider id یکسان توسط دو Plugin، را رد کند
- startup می‌تواند diagnosticهای actionable برای registration بدشکل surface کند
- تست‌های contract می‌توانند مالکیت Pluginهای bundled را enforce کنند و از drift خاموش جلوگیری کنند

دو لایهٔ enforcement وجود دارد:

<AccordionGroup>
  <Accordion title="اجرای ثبت زمان اجرا">
    رجیستری Plugin هنگام بارگذاری Pluginها، ثبت‌ها را اعتبارسنجی می‌کند. مثال‌ها: شناسه‌های تکراری ارائه‌دهنده، شناسه‌های تکراری ارائه‌دهنده گفتار، و ثبت‌های نادرست، به‌جای رفتار تعریف‌نشده، تشخیص‌های Plugin تولید می‌کنند.
  </Accordion>
  <Accordion title="آزمون‌های قرارداد">
    Pluginهای همراه در طول اجرای آزمون‌ها در رجیستری‌های قرارداد ثبت می‌شوند تا OpenClaw بتواند مالکیت را به‌صراحت بررسی کند. امروز این برای ارائه‌دهندگان مدل، ارائه‌دهندگان گفتار، ارائه‌دهندگان جست‌وجوی وب، و مالکیت ثبت‌های همراه استفاده می‌شود.
  </Accordion>
</AccordionGroup>

اثر عملی این است که OpenClaw از ابتدا می‌داند کدام Plugin مالک کدام سطح است. این باعث می‌شود هسته و کانال‌ها بدون اصطکاک با هم ترکیب شوند، چون مالکیت به‌جای ضمنی بودن، اعلام‌شده، نوع‌دار، و قابل آزمون است.

### چه چیزی به قرارداد تعلق دارد

<Tabs>
  <Tab title="قراردادهای خوب">
    - نوع‌دار
    - کوچک
    - ویژه قابلیت
    - متعلق به هسته
    - قابل استفاده مجدد توسط چندین Plugin
    - قابل مصرف توسط کانال‌ها/قابلیت‌ها بدون دانش فروشنده

  </Tab>
  <Tab title="قراردادهای بد">
    - سیاست ویژه فروشنده که در هسته پنهان شده است
    - راه‌های فرار موردی Plugin که رجیستری را دور می‌زنند
    - کد کانال که مستقیما وارد پیاده‌سازی یک فروشنده می‌شود
    - اشیای زمان اجرای موردی که بخشی از `OpenClawPluginApi` یا `api.runtime` نیستند

  </Tab>
</Tabs>

در صورت تردید، سطح انتزاع را بالاتر ببرید: ابتدا قابلیت را تعریف کنید، سپس اجازه دهید Pluginها به آن متصل شوند.

## مدل اجرا

Pluginهای بومی OpenClaw **درون‌فرایندی** همراه با Gateway اجرا می‌شوند. آن‌ها sandbox نشده‌اند. یک Plugin بومی بارگذاری‌شده همان مرز اعتماد سطح فرایند را دارد که کد هسته دارد.

<Warning>
پیامدهای Plugin بومی: یک Plugin می‌تواند ابزارها، هندلرهای شبکه، hookها، و سرویس‌ها را ثبت کند؛ یک اشکال در Plugin می‌تواند Gateway را از کار بیندازد یا ناپایدار کند؛ و یک Plugin بومی مخرب معادل اجرای کد دلخواه درون فرایند OpenClaw است.
</Warning>

بسته‌های سازگار به‌طور پیش‌فرض امن‌ترند، چون OpenClaw در حال حاضر آن‌ها را به‌عنوان بسته‌های فراداده/محتوا در نظر می‌گیرد. در نسخه‌های فعلی، این بیشتر یعنی Skills همراه.

برای Pluginهای غیرهمراه از فهرست‌های مجاز و مسیرهای صریح نصب/بارگذاری استفاده کنید. Pluginهای workspace را کد زمان توسعه در نظر بگیرید، نه پیش‌فرض‌های تولید.

برای نام‌های بسته workspace همراه، شناسه Plugin را به نام npm متصل نگه دارید: به‌طور پیش‌فرض `@openclaw/<id>`، یا یک پسوند نوع‌دار تاییدشده مانند `-provider`، `-plugin`، `-speech`، `-sandbox`، یا `-media-understanding` وقتی بسته عمدا نقش Plugin محدودتری را ارائه می‌کند.

<Note>
**یادداشت اعتماد:** `plugins.allow` به **شناسه‌های Plugin** اعتماد می‌کند، نه منشأ منبع. یک Plugin workspace با همان شناسه یک Plugin همراه، وقتی آن Plugin workspace فعال/در فهرست مجاز باشد، عمدا نسخه همراه را shadow می‌کند. این برای توسعه محلی، آزمون وصله، و hotfixها عادی و مفید است. اعتماد به Plugin همراه از snapshot منبع تعیین می‌شود — manifest و کد روی دیسک هنگام بارگذاری — نه از فراداده نصب. یک رکورد نصب خراب یا جایگزین‌شده نمی‌تواند بی‌سروصدا سطح اعتماد یک Plugin همراه را فراتر از آنچه منبع واقعی ادعا می‌کند گسترش دهد.
</Note>

## مرز export

OpenClaw قابلیت‌ها را export می‌کند، نه سهولت پیاده‌سازی را.

ثبت قابلیت را عمومی نگه دارید. exportهای کمکی غیرقراردادی را حذف کنید:

- زیربخش‌های کمکی ویژه Pluginهای همراه
- زیربخش‌های لوله‌کشی زمان اجرا که به‌عنوان API عمومی در نظر گرفته نشده‌اند
- کمک‌کننده‌های سهولت ویژه فروشنده
- کمک‌کننده‌های راه‌اندازی/onboarding که جزئیات پیاده‌سازی هستند

زیربخش‌های کمکی رزروشده برای Pluginهای همراه از نقشه export تولیدشده SDK بازنشسته شده‌اند. کمک‌کننده‌های ویژه مالک را درون بسته Plugin مالک نگه دارید؛ فقط رفتار میزبان قابل استفاده مجدد را به قراردادهای عمومی SDK مانند `plugin-sdk/gateway-runtime`، `plugin-sdk/security-runtime`، و `plugin-sdk/plugin-config-runtime` ارتقا دهید.

## بخش‌های داخلی و مرجع

برای خط لوله بارگذاری، مدل رجیستری، hookهای زمان اجرای ارائه‌دهنده، مسیرهای HTTP مربوط به Gateway، schemaهای ابزار پیام، حل هدف کانال، کاتالوگ‌های ارائه‌دهنده، Pluginهای موتور زمینه، و راهنمای افزودن یک قابلیت جدید، [بخش‌های داخلی معماری Plugin](/fa/plugins/architecture-internals) را ببینید.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [manifest Plugin](/fa/plugins/manifest)
- [راه‌اندازی SDK برای Plugin](/fa/plugins/sdk-setup)
