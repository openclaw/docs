---
read_when:
    - ساخت یا اشکال‌زدایی Pluginهای بومی OpenClaw
    - درک مدل قابلیت Plugin یا مرزهای مالکیت
    - کار روی خط لولهٔ بارگذاری Plugin یا رجیستری
    - پیاده‌سازی قلاب‌های زمان اجرای ارائه‌دهنده یا Plugin‌های کانال
sidebarTitle: Internals
summary: 'جزئیات داخلی Plugin: مدل قابلیت، مالکیت، قراردادها، خط لولهٔ بارگذاری و ابزارهای کمکی زمان اجرا'
title: جزئیات داخلی Plugin
x-i18n:
    generated_at: "2026-05-02T11:53:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 138fb962c98f71e29e8b2621ce318336c38a317636d090eb315fed806fc6abda
    source_path: plugins/architecture.md
    workflow: 16
---

این **مرجع عمیق معماری** برای سیستم Plugin در OpenClaw است. برای راهنماهای عملی، با یکی از صفحه‌های متمرکز زیر شروع کنید.

<CardGroup cols={2}>
  <Card title="نصب و استفاده از Pluginها" icon="plug" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای افزودن، فعال‌سازی و عیب‌یابی Pluginها.
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

قابلیت‌ها مدل عمومی **Plugin بومی** در داخل OpenClaw هستند. هر Plugin بومی OpenClaw در برابر یک یا چند نوع قابلیت ثبت می‌شود:

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
| واکشی وب | `api.registerWebFetchProvider(...)` | `firecrawl` |
| جست‌وجوی وب | `api.registerWebSearchProvider(...)` | `google` |
| کانال / پیام‌رسانی | `api.registerChannel(...)` | `msteams`, `matrix` |
| کشف Gateway | `api.registerGatewayDiscoveryService(...)` | `bonjour` |

<Note>
Pluginای که هیچ قابلیتی ثبت نمی‌کند اما hookها، ابزارها، سرویس‌های کشف یا سرویس‌های پس‌زمینه ارائه می‌دهد، یک Plugin **قدیمیِ فقط-hook** است. این الگو همچنان به‌طور کامل پشتیبانی می‌شود.
</Note>

### موضع سازگاری خارجی

مدل قابلیت در core پیاده‌سازی شده و امروز توسط Pluginهای همراه/بومی استفاده می‌شود، اما سازگاری Plugin خارجی هنوز به معیاری سخت‌گیرانه‌تر از «صادر شده است، پس ثابت است» نیاز دارد.

| وضعیت Plugin | راهنمایی |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Pluginهای خارجی موجود | یکپارچه‌سازی‌های مبتنی بر hook را فعال نگه دارید؛ این خط پایه سازگاری است. |
| Pluginهای همراه/بومی جدید | ثبت صریح قابلیت را به دسترسی‌های اختصاصی vendor یا طراحی‌های جدید فقط-hook ترجیح دهید. |
| Pluginهای خارجی که ثبت قابلیت را به‌کار می‌گیرند | مجاز است، اما سطوح کمکی ویژه قابلیت را در حال تکامل بدانید مگر اینکه مستندات آن‌ها را پایدار علامت‌گذاری کنند. |

ثبت قابلیت مسیر مورد نظر است. hookهای قدیمی در دوره گذار همچنان امن‌ترین مسیر بدون شکست برای Pluginهای خارجی هستند. زیرمسیرهای کمکی صادرشده همگی برابر نیستند — قراردادهای مستند و محدود را به exportهای کمکی تصادفی ترجیح دهید.

### شکل‌های Plugin

OpenClaw هر Plugin بارگذاری‌شده را بر اساس رفتار ثبت واقعی آن، نه فقط metadata ایستای آن، در یک شکل دسته‌بندی می‌کند:

<AccordionGroup>
  <Accordion title="plain-capability">
    دقیقاً یک نوع قابلیت را ثبت می‌کند (برای مثال یک Plugin فقط-provider مانند `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    چند نوع قابلیت را ثبت می‌کند (برای مثال `openai` مالک استنتاج متن، گفتار، درک رسانه و تولید تصویر است).
  </Accordion>
  <Accordion title="hook-only">
    فقط hookها را ثبت می‌کند (typed یا سفارشی)، بدون قابلیت، ابزار، دستور یا سرویس.
  </Accordion>
  <Accordion title="non-capability">
    ابزارها، دستورها، سرویس‌ها یا routeها را ثبت می‌کند اما قابلیتی ثبت نمی‌کند.
  </Accordion>
</AccordionGroup>

برای دیدن شکل و تفکیک قابلیت‌های یک Plugin از `openclaw plugins inspect <id>` استفاده کنید. برای جزئیات، [مرجع CLI](/fa/cli/plugins#inspect) را ببینید.

### hookهای قدیمی

hook `before_agent_start` همچنان به‌عنوان مسیر سازگاری برای Pluginهای فقط-hook پشتیبانی می‌شود. Pluginهای قدیمی دنیای واقعی هنوز به آن وابسته‌اند.

مسیر:

- فعال نگه داشتن آن
- مستندسازی آن به‌عنوان قدیمی
- ترجیح `before_model_resolve` برای کارهای override مدل/provider
- ترجیح `before_prompt_build` برای کارهای تغییر prompt
- حذف فقط پس از کاهش استفاده واقعی و اثبات ایمنی مهاجرت توسط پوشش fixture

### سیگنال‌های سازگاری

وقتی `openclaw doctor` یا `openclaw plugins inspect <id>` را اجرا می‌کنید، ممکن است یکی از این برچسب‌ها را ببینید:

| سیگنال | معنی |
| -------------------------- | ------------------------------------------------------------ |
| **config معتبر** | config بدون مشکل parse می‌شود و Pluginها resolve می‌شوند |
| **هشدار سازگاری** | Plugin از الگویی پشتیبانی‌شده اما قدیمی‌تر استفاده می‌کند (برای مثال `hook-only`) |
| **هشدار قدیمی** | Plugin از `before_agent_start` استفاده می‌کند که منسوخ شده است |
| **خطای سخت** | config نامعتبر است یا Plugin بارگذاری نشده است |

نه `hook-only` و نه `before_agent_start` امروز Plugin شما را نمی‌شکنند: `hook-only` فقط advisory است، و `before_agent_start` فقط یک هشدار ایجاد می‌کند. این سیگنال‌ها در `openclaw status --all` و `openclaw plugins doctor` نیز ظاهر می‌شوند.

## نمای کلی معماری

سیستم Plugin در OpenClaw چهار لایه دارد:

<Steps>
  <Step title="Manifest + کشف">
    OpenClaw، Pluginهای نامزد را از مسیرهای پیکربندی‌شده، ریشه‌های workspace، ریشه‌های Plugin سراسری و Pluginهای همراه پیدا می‌کند. کشف ابتدا manifestهای بومی `openclaw.plugin.json` به‌همراه manifestهای bundle پشتیبانی‌شده را می‌خواند.
  </Step>
  <Step title="فعال‌سازی + اعتبارسنجی">
    core تصمیم می‌گیرد که یک Plugin کشف‌شده فعال، غیرفعال، مسدود یا برای یک slot انحصاری مانند memory انتخاب شده باشد.
  </Step>
  <Step title="بارگذاری runtime">
    Pluginهای بومی OpenClaw در همان process بارگذاری می‌شوند و قابلیت‌ها را در یک registry مرکزی ثبت می‌کنند. JavaScript بسته‌بندی‌شده از طریق `require` بومی بارگذاری می‌شود؛ TypeScript منبع محلی شخص ثالث fallback اضطراری Jiti است. bundleهای سازگار بدون import کردن کد runtime به recordهای registry نرمال‌سازی می‌شوند.
  </Step>
  <Step title="مصرف سطح‌ها">
    باقی OpenClaw برای در دسترس‌کردن ابزارها، کانال‌ها، تنظیم provider، hookها، routeهای HTTP، دستورهای CLI و سرویس‌ها registry را می‌خواند.
  </Step>
</Steps>

برای CLI مخصوص Plugin، کشف دستور root در دو فاز تقسیم می‌شود:

- metadata زمان parse از `registerCli(..., { descriptors: [...] })` می‌آید
- ماژول واقعی CLI متعلق به Plugin می‌تواند lazy بماند و در اولین فراخوانی ثبت شود

این کار کد CLI متعلق به Plugin را داخل خود Plugin نگه می‌دارد و هم‌زمان به OpenClaw اجازه می‌دهد نام‌های دستور root را پیش از parse رزرو کند.

مرز طراحی مهم:

- اعتبارسنجی manifest/config باید بدون اجرای کد Plugin، از **metadata manifest/schema** کار کند
- کشف قابلیت بومی ممکن است کد entry Plugin مورد اعتماد را برای ساخت یک snapshot غیرفعال‌کننده registry بارگذاری کند
- رفتار runtime بومی از مسیر `register(api)` ماژول Plugin با `api.registrationMode === "full"` می‌آید

این تفکیک به OpenClaw اجازه می‌دهد پیش از فعال شدن runtime کامل، config را اعتبارسنجی کند، Pluginهای گم‌شده/غیرفعال را توضیح دهد و hintهای UI/schema بسازد.

### snapshot metadata Plugin و lookup table

شروع Gateway برای snapshot فعلی config یک `PluginMetadataSnapshot` می‌سازد. snapshot فقط metadata است: index Plugin نصب‌شده، manifest registry، diagnostics manifest، owner mapها، یک نرمال‌ساز id Plugin و recordهای manifest را ذخیره می‌کند. ماژول‌های Plugin بارگذاری‌شده، SDKهای provider، محتوای package یا exportهای runtime را نگه نمی‌دارد.

اعتبارسنجی config آگاه از Plugin، auto-enable هنگام شروع، و bootstrap Plugin در Gateway به‌جای بازسازی مستقل metadata مربوط به manifest/index از آن snapshot استفاده می‌کنند. `PluginLookUpTable` از همان snapshot مشتق می‌شود و plan شروع Plugin را برای config runtime فعلی اضافه می‌کند.

پس از شروع، Gateway snapshot metadata فعلی را به‌عنوان یک محصول runtime قابل جایگزینی نگه می‌دارد. کشف مکرر provider در runtime می‌تواند به‌جای بازسازی index نصب‌شده و manifest registry برای هر pass کاتالوگ provider، آن snapshot را قرض بگیرد. snapshot هنگام خاموشی Gateway، تغییرات config/موجودی Plugin، و نوشتن index نصب‌شده پاک یا جایگزین می‌شود؛ وقتی snapshot فعلی سازگار وجود نداشته باشد، callerها به مسیر سرد manifest/index fallback می‌کنند. بررسی‌های سازگاری باید ریشه‌های کشف Plugin مانند `plugins.load.paths` و workspace پیش‌فرض agent را شامل شوند، چون Pluginهای workspace بخشی از دامنه metadata هستند.

snapshot و lookup table تصمیم‌های تکراری شروع را در مسیر سریع نگه می‌دارند:

- مالکیت کانال
- شروع کانال deferred
- idهای Plugin هنگام شروع
- مالکیت provider و backendهای CLI
- مالکیت setup provider، alias دستور، provider کاتالوگ مدل و قرارداد manifest
- اعتبارسنجی schema config Plugin و schema config کانال
- تصمیم‌های auto-enable هنگام شروع

مرز ایمنی جایگزینی snapshot است، نه mutation. وقتی config، موجودی Plugin، رکوردهای نصب یا سیاست index پایدار تغییر می‌کند، snapshot را دوباره بسازید. با آن مانند یک registry سراسری mutable گسترده برخورد نکنید، و snapshotهای تاریخی نامحدود نگه ندارید. بارگذاری runtime Plugin جدا از snapshotهای metadata باقی می‌ماند تا وضعیت runtime stale پشت cache metadata پنهان نشود.

قاعده cache در [جزئیات داخلی معماری Plugin](/fa/plugins/architecture-internals#plugin-cache-boundary) مستند شده است: metadata مربوط به manifest و کشف fresh هستند مگر اینکه caller یک snapshot صریح، lookup table یا manifest registry برای flow فعلی داشته باشد. cacheهای metadata پنهان و TTLهای wall-clock بخشی از بارگذاری Plugin نیستند. فقط cacheهای runtime loader، module و dependency-artifact ممکن است پس از بارگذاری واقعی کد یا artifactهای نصب‌شده باقی بمانند.

برخی callerهای مسیر سرد هنوز به‌جای دریافت `PluginLookUpTable` از Gateway، manifest registryها را مستقیماً از index پایدار Plugin نصب‌شده بازسازی می‌کنند. آن مسیر اکنون registry را بنا بر نیاز بازسازی می‌کند؛ وقتی caller از قبل lookup table فعلی یا یک manifest registry صریح دارد، عبور دادن آن از flowهای runtime را ترجیح دهید.

### برنامه‌ریزی فعال‌سازی

برنامه‌ریزی فعال‌سازی بخشی از control plane است. callerها می‌توانند پیش از بارگذاری registryهای runtime گسترده‌تر بپرسند کدام Pluginها به یک دستور، provider، کانال، route، agent harness یا قابلیت مشخص مرتبط هستند.

planner رفتار فعلی manifest را سازگار نگه می‌دارد:

- فیلدهای `activation.*` hintهای صریح planner هستند
- `providers`، `channels`، `commandAliases`، `setup.providers`، `contracts.tools` و hookها همچنان fallback مالکیت manifest باقی می‌مانند
- API planner فقط-id برای callerهای موجود در دسترس می‌ماند
- API plan برچسب‌های reason را گزارش می‌کند تا diagnostics بتواند hintهای صریح را از fallback مالکیت تفکیک کند

<Warning>
`activation` را به‌عنوان یک hook چرخه حیات یا جایگزینی برای `register(...)` در نظر نگیرید. این فراداده‌ای است که برای محدود کردن بارگذاری استفاده می‌شود. وقتی فیلدهای مالکیت از قبل رابطه را توصیف می‌کنند، آن‌ها را ترجیح دهید؛ از `activation` فقط برای راهنمایی‌های اضافی planner استفاده کنید.
</Warning>

### Pluginهای کانال و ابزار پیام مشترک

Pluginهای کانال برای اقدام‌های عادی چت لازم نیست ابزار جداگانه‌ای برای ارسال/ویرایش/واکنش ثبت کنند. OpenClaw یک ابزار مشترک `message` را در هسته نگه می‌دارد، و Pluginهای کانال مالک کشف و اجرای مخصوص کانال پشت آن هستند.

مرز فعلی این است:

- هسته مالک میزبان ابزار مشترک `message`، سیم‌کشی prompt، نگهداری session/thread، و dispatch اجرا است
- Pluginهای کانال مالک کشف اقدام محدوده‌دار، کشف قابلیت، و هر fragment شِمای مخصوص کانال هستند
- Pluginهای کانال مالک گرامر گفت‌وگوی session مخصوص provider هستند، مانند اینکه شناسه‌های گفت‌وگو چگونه شناسه‌های thread را کدگذاری می‌کنند یا از گفت‌وگوهای والد ارث می‌برند
- Pluginهای کانال اقدام نهایی را از طریق adapter اقدام خود اجرا می‌کنند

برای Pluginهای کانال، سطح SDK برابر با `ChannelMessageActionAdapter.describeMessageTool(...)` است. آن فراخوانی کشف یکپارچه به Plugin اجازه می‌دهد اقدام‌های قابل مشاهده، قابلیت‌ها، و مشارکت‌های شِما را با هم برگرداند تا این قطعات از هم واگرا نشوند.

وقتی یک پارامتر ابزار پیام مخصوص کانال یک منبع رسانه مانند مسیر محلی یا URL رسانه راه‌دور حمل می‌کند، Plugin باید `mediaSourceParams` را نیز از `describeMessageTool(...)` برگرداند. هسته از آن فهرست صریح استفاده می‌کند تا بدون hardcode کردن نام پارامترهای متعلق به Plugin، نرمال‌سازی مسیر sandbox و راهنمایی‌های دسترسی رسانه خروجی را اعمال کند. در آنجا mapهای محدوده‌دار به اقدام را ترجیح دهید، نه یک فهرست تخت در سطح کل کانال، تا یک پارامتر رسانه فقط مخصوص profile روی اقدام‌های نامرتبط مانند `send` نرمال‌سازی نشود.

هسته scope زمان اجرا را به آن مرحله کشف پاس می‌دهد. فیلدهای مهم شامل این‌ها هستند:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` ورودی مورد اعتماد

این برای Pluginهای حساس به context مهم است. یک کانال می‌تواند اقدام‌های پیام را بر اساس حساب فعال، room/thread/message فعلی، یا هویت requester مورد اعتماد پنهان یا آشکار کند، بدون اینکه شاخه‌های مخصوص کانال در ابزار `message` هسته hardcode شوند.

به همین دلیل تغییرات مسیریابی embedded-runner هنوز کار Plugin هستند: runner مسئول است هویت چت/session فعلی را به مرز کشف Plugin forward کند تا ابزار مشترک `message` سطح متعلق به کانال مناسب را برای نوبت فعلی آشکار کند.

برای helperهای اجرای متعلق به کانال، Pluginهای bundled باید runtime اجرا را داخل ماژول‌های extension خودشان نگه دارند. هسته دیگر runtimeهای اقدام پیام Discord، Slack، Telegram، یا WhatsApp را زیر `src/agents/tools` مالکیت نمی‌کند. ما subpathهای جداگانه `plugin-sdk/*-action-runtime` منتشر نمی‌کنیم، و Pluginهای bundled باید کد runtime محلی خودشان را مستقیم از ماژول‌های متعلق به extension خود import کنند.

همین مرز به‌طور کلی برای seamهای SDK نام‌گذاری‌شده به‌نام provider نیز اعمال می‌شود: هسته نباید barrelهای راحتی مخصوص کانال را برای Slack، Discord، Signal، WhatsApp، یا extensionهای مشابه import کند. اگر هسته به رفتاری نیاز دارد، یا barrel `api.ts` / `runtime-api.ts` خود Plugin bundled را مصرف کنید یا نیاز را به یک قابلیت عمومی محدود در SDK مشترک ارتقا دهید.

Pluginهای bundled از همین قاعده پیروی می‌کنند. `runtime-api.ts` یک Plugin bundled نباید facade برنددار خودش `openclaw/plugin-sdk/<plugin-id>` را دوباره export کند. آن facadeهای برنددار shimهای سازگاری برای Pluginهای بیرونی و مصرف‌کنندگان قدیمی‌تر باقی می‌مانند، اما Pluginهای bundled باید از exportهای محلی به‌علاوه subpathهای عمومی محدود SDK مانند `openclaw/plugin-sdk/channel-policy`، `openclaw/plugin-sdk/runtime-store`، یا `openclaw/plugin-sdk/webhook-ingress` استفاده کنند. کد جدید نباید facadeهای SDK مخصوص plugin-id اضافه کند مگر اینکه مرز سازگاری برای یک اکوسیستم بیرونی موجود به آن نیاز داشته باشد.

به‌طور خاص برای نظرسنجی‌ها، دو مسیر اجرا وجود دارد:

- `outbound.sendPoll` پایه مشترک برای کانال‌هایی است که با مدل نظرسنجی عمومی سازگارند
- `actions.handleAction("poll")` مسیر ترجیحی برای معناشناسی نظرسنجی مخصوص کانال یا پارامترهای اضافی نظرسنجی است

هسته اکنون parsing نظرسنجی مشترک را تا بعد از اینکه dispatch نظرسنجی Plugin اقدام را رد کند به تعویق می‌اندازد، بنابراین handlerهای نظرسنجی متعلق به Plugin می‌توانند فیلدهای نظرسنجی مخصوص کانال را بدون اینکه ابتدا توسط parser عمومی نظرسنجی مسدود شوند بپذیرند.

برای توالی کامل startup، [جزئیات داخلی معماری Plugin](/fa/plugins/architecture-internals) را ببینید.

## مدل مالکیت قابلیت

OpenClaw یک Plugin native را مرز مالکیت برای یک **شرکت** یا یک **ویژگی** در نظر می‌گیرد، نه کیسه‌ای از integrationهای نامرتبط.

یعنی:

- یک Plugin شرکتی معمولاً باید مالک همه سطح‌های روبه‌روی OpenClaw آن شرکت باشد
- یک Plugin ویژگی معمولاً باید مالک کل سطح ویژگی‌ای باشد که معرفی می‌کند
- کانال‌ها باید به‌جای پیاده‌سازی موردی رفتار provider، قابلیت‌های مشترک هسته را مصرف کنند

<AccordionGroup>
  <Accordion title="چندقابلیتی vendor">
    `openai` مالک inference متن، speech، صدای بلادرنگ، درک رسانه، و تولید تصویر است. `google` مالک inference متن به‌علاوه درک رسانه، تولید تصویر، و جست‌وجوی وب است. `qwen` مالک inference متن به‌علاوه درک رسانه و تولید ویدئو است.
  </Accordion>
  <Accordion title="تک‌قابلیتی vendor">
    `elevenlabs` و `microsoft` مالک speech هستند؛ `firecrawl` مالک web-fetch است؛ `minimax` / `mistral` / `moonshot` / `zai` مالک backendهای درک رسانه هستند.
  </Accordion>
  <Accordion title="Plugin ویژگی">
    `voice-call` مالک انتقال تماس، ابزارها، CLI، routeها، و bridging media-stream در Twilio است، اما به‌جای import مستقیم Pluginهای vendor، قابلیت‌های مشترک speech، رونویسی بلادرنگ، و صدای بلادرنگ را مصرف می‌کند.
  </Accordion>
</AccordionGroup>

وضعیت نهایی مورد نظر این است:

- OpenAI در یک Plugin زندگی می‌کند، حتی اگر مدل‌های متن، speech، تصاویر، و ویدئوی آینده را پوشش دهد
- vendor دیگری می‌تواند همین کار را برای سطح خودش انجام دهد
- کانال‌ها اهمیتی نمی‌دهند کدام Plugin vendor مالک provider است؛ آن‌ها contract قابلیت مشترک آشکارشده توسط هسته را مصرف می‌کنند

تمایز کلیدی این است:

- **plugin** = مرز مالکیت
- **capability** = contract هسته که چندین Plugin می‌توانند پیاده‌سازی یا مصرف کنند

پس اگر OpenClaw دامنه جدیدی مانند ویدئو اضافه کند، پرسش اول این نیست که «کدام provider باید مدیریت ویدئو را hardcode کند؟» پرسش اول این است که «contract قابلیت ویدئوی هسته چیست؟» وقتی آن contract وجود داشته باشد، Pluginهای vendor می‌توانند در برابر آن ثبت شوند و Pluginهای کانال/ویژگی می‌توانند آن را مصرف کنند.

اگر capability هنوز وجود ندارد، حرکت درست معمولاً این است:

<Steps>
  <Step title="تعریف قابلیت">
    قابلیت مفقود را در هسته تعریف کنید.
  </Step>
  <Step title="آشکارسازی از طریق SDK">
    آن را به‌شکلی typeشده از طریق API/runtime Plugin آشکار کنید.
  </Step>
  <Step title="سیم‌کشی مصرف‌کنندگان">
    کانال‌ها/ویژگی‌ها را به آن قابلیت سیم‌کشی کنید.
  </Step>
  <Step title="پیاده‌سازی‌های vendor">
    بگذارید Pluginهای vendor پیاده‌سازی‌ها را ثبت کنند.
  </Step>
</Steps>

این کار مالکیت را صریح نگه می‌دارد و در عین حال از رفتار هسته‌ای که به یک vendor واحد یا یک مسیر کد موردی مخصوص Plugin وابسته است جلوگیری می‌کند.

### لایه‌بندی قابلیت

هنگام تصمیم‌گیری درباره اینکه کد کجا قرار می‌گیرد، از این مدل ذهنی استفاده کنید:

<Tabs>
  <Tab title="لایه قابلیت هسته">
    orchestration مشترک، policy، fallback، قواعد merge پیکربندی، معناشناسی delivery، و contractهای typeشده.
  </Tab>
  <Tab title="لایه Plugin vendor">
    APIهای مخصوص vendor، auth، کاتالوگ‌های مدل، synthesis گفتار، تولید تصویر، backendهای ویدئوی آینده، endpointهای usage.
  </Tab>
  <Tab title="لایه Plugin کانال/ویژگی">
    integration مربوط به Slack/Discord/voice-call/etc. که قابلیت‌های هسته را مصرف می‌کند و آن‌ها را روی یک سطح ارائه می‌دهد.
  </Tab>
</Tabs>

برای مثال، TTS از این شکل پیروی می‌کند:

- هسته مالک policy مربوط به TTS هنگام پاسخ، ترتیب fallback، prefs، و delivery کانال است
- `openai`، `elevenlabs`، و `microsoft` مالک پیاده‌سازی‌های synthesis هستند
- `voice-call` helper runtime مربوط به TTS تلفنی را مصرف می‌کند

همین الگو باید برای قابلیت‌های آینده ترجیح داده شود.

### نمونه Plugin شرکتی چندقابلیتی

یک Plugin شرکتی باید از بیرون منسجم به نظر برسد. اگر OpenClaw برای مدل‌ها، speech، رونویسی بلادرنگ، صدای بلادرنگ، درک رسانه، تولید تصویر، تولید ویدئو، fetch وب، و جست‌وجوی وب contractهای مشترک داشته باشد، یک vendor می‌تواند همه سطح‌های خود را در یک جا مالک شود:

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

آنچه مهم است نام دقیق helperها نیست. شکل مهم است:

- یک Plugin مالک سطح vendor است
- هسته همچنان مالک contractهای قابلیت است
- کانال‌ها و Pluginهای ویژگی helperهای `api.runtime.*` را مصرف می‌کنند، نه کد vendor را
- تست‌های contract می‌توانند assert کنند که Plugin قابلیت‌هایی را که ادعای مالکیتشان را دارد ثبت کرده است

### نمونه قابلیت: درک ویدئو

OpenClaw از قبل درک تصویر/صوت/ویدئو را یک قابلیت مشترک در نظر می‌گیرد. همان مدل مالکیت در آنجا نیز اعمال می‌شود:

<Steps>
  <Step title="هسته contract را تعریف می‌کند">
    هسته contract درک رسانه را تعریف می‌کند.
  </Step>
  <Step title="Pluginهای vendor ثبت می‌کنند">
    Pluginهای vendor، در صورت کاربرد، `describeImage`، `transcribeAudio`، و `describeVideo` را ثبت می‌کنند.
  </Step>
  <Step title="مصرف‌کنندگان از رفتار مشترک استفاده می‌کنند">
    کانال‌ها و Pluginهای ویژگی به‌جای سیم‌کشی مستقیم به کد vendor، رفتار مشترک هسته را مصرف می‌کنند.
  </Step>
</Steps>

این کار از جا دادن فرضیات ویدئویی یک provider در هسته جلوگیری می‌کند. Plugin مالک سطح vendor است؛ هسته مالک contract قابلیت و رفتار fallback است.

تولید ویدئو از قبل از همین توالی استفاده می‌کند: هسته مالک contract قابلیت typeشده و helper runtime است، و Pluginهای vendor پیاده‌سازی‌های `api.registerVideoGenerationProvider(...)` را در برابر آن ثبت می‌کنند.

به یک چک‌لیست rollout مشخص نیاز دارید؟ [کتابچه آشپزی قابلیت](/fa/plugins/architecture) را ببینید.

## Contractها و enforce کردن

سطح API Plugin عمداً در `OpenClawPluginApi` typeشده و متمرکز است. آن contract نقاط ثبت پشتیبانی‌شده و helperهای runtime را که یک Plugin می‌تواند به آن‌ها تکیه کند تعریف می‌کند.

چرایی اهمیت این موضوع:

- نویسندگان Plugin یک استاندارد داخلی پایدار دریافت می‌کنند
- هسته می‌تواند مالکیت تکراری، مانند ثبت یک provider id یکسان توسط دو Plugin، را رد کند
- startup می‌تواند diagnostics قابل اقدام برای ثبت malformed نشان دهد
- تست‌های contract می‌توانند مالکیت Plugin bundled را enforce کنند و از drift خاموش جلوگیری کنند

دو لایه enforcement وجود دارد:

<AccordionGroup>
  <Accordion title="اجرای ثبت در زمان اجرا">
    رجیستری Plugin هنگام بارگذاری Pluginها، ثبت‌ها را اعتبارسنجی می‌کند. نمونه‌ها: شناسه‌های تکراری ارائه‌دهنده، شناسه‌های تکراری ارائه‌دهنده گفتار، و ثبت‌های بدشکل، به‌جای رفتار تعریف‌نشده، عیب‌یابی Plugin تولید می‌کنند.
  </Accordion>
  <Accordion title="آزمون‌های قرارداد">
    Pluginهای همراه در طول اجرای آزمون در رجیستری‌های قرارداد ثبت می‌شوند تا OpenClaw بتواند مالکیت را به‌صراحت بررسی کند. امروزه این برای ارائه‌دهندگان مدل، ارائه‌دهندگان گفتار، ارائه‌دهندگان جست‌وجوی وب، و مالکیت ثبت همراه استفاده می‌شود.
  </Accordion>
</AccordionGroup>

اثر عملی این است که OpenClaw از ابتدا می‌داند کدام Plugin مالک کدام سطح است. این باعث می‌شود هسته و کانال‌ها بی‌وقفه با هم ترکیب شوند، چون مالکیت به‌جای ضمنی بودن، اعلام‌شده، نوع‌دار، و آزمون‌پذیر است.

### چه چیزی در یک قرارداد جای می‌گیرد

<Tabs>
  <Tab title="قراردادهای خوب">
    - نوع‌دار
    - کوچک
    - ویژه قابلیت
    - متعلق به هسته
    - قابل استفاده مجدد توسط چند Plugin
    - قابل مصرف توسط کانال‌ها/قابلیت‌ها بدون آگاهی از فروشنده

  </Tab>
  <Tab title="قراردادهای بد">
    - سیاست ویژه فروشنده که در هسته پنهان شده است
    - راه‌های فرار تک‌موردی Plugin که رجیستری را دور می‌زنند
    - کد کانال که مستقیم به پیاده‌سازی فروشنده دسترسی پیدا می‌کند
    - اشیای زمان اجرای موردی که بخشی از `OpenClawPluginApi` یا `api.runtime` نیستند

  </Tab>
</Tabs>

وقتی تردید دارید، سطح انتزاع را بالاتر ببرید: ابتدا قابلیت را تعریف کنید، سپس اجازه دهید Pluginها به آن متصل شوند.

## مدل اجرا

Pluginهای بومی OpenClaw **درون‌فرایندی** همراه با Gateway اجرا می‌شوند. آن‌ها سندباکس نشده‌اند. یک Plugin بومی بارگذاری‌شده همان مرز اعتماد در سطح فرایند را دارد که کد هسته دارد.

<Warning>
پیامدهای Plugin بومی: یک Plugin می‌تواند ابزارها، کنترل‌کننده‌های شبکه، hookها، و سرویس‌ها را ثبت کند؛ خطای یک Plugin می‌تواند gateway را از کار بیندازد یا ناپایدار کند؛ و یک Plugin بومی مخرب معادل اجرای کد دلخواه درون فرایند OpenClaw است.
</Warning>

باندل‌های سازگار به‌طور پیش‌فرض امن‌تر هستند، چون OpenClaw در حال حاضر با آن‌ها به‌عنوان بسته‌های فراداده/محتوا رفتار می‌کند. در نسخه‌های فعلی، این عمدتاً به‌معنای Skills همراه است.

برای Pluginهای غیرهمراه از فهرست‌های مجاز و مسیرهای نصب/بارگذاری صریح استفاده کنید. با Pluginهای فضای کاری به‌عنوان کد زمان توسعه رفتار کنید، نه پیش‌فرض‌های تولید.

برای نام‌های بسته فضای کاری همراه، شناسه Plugin را به نام npm متصل نگه دارید: به‌طور پیش‌فرض `@openclaw/<id>`، یا یک پسوند نوع‌دار تأییدشده مانند `-provider`، `-plugin`، `-speech`، `-sandbox`، یا `-media-understanding` وقتی بسته عمداً نقش محدودتری از Plugin را ارائه می‌کند.

<Note>
**یادداشت اعتماد:** `plugins.allow` به **شناسه‌های Plugin** اعتماد می‌کند، نه منشأ منبع. یک Plugin فضای کاری با همان شناسه یک Plugin همراه، وقتی آن Plugin فضای کاری فعال/در فهرست مجاز باشد، عمداً نسخه همراه را تحت‌الشعاع قرار می‌دهد. این برای توسعه محلی، آزمون وصله، و hotfix عادی و مفید است. اعتماد Plugin همراه از snapshot منبع حل می‌شود، یعنی manifest و کد روی دیسک در زمان بارگذاری، نه از فراداده نصب. یک رکورد نصب خراب یا جایگزین‌شده نمی‌تواند بی‌سروصدا سطح اعتماد یک Plugin همراه را فراتر از آنچه منبع واقعی ادعا می‌کند گسترش دهد.
</Note>

## مرز export

OpenClaw قابلیت‌ها را export می‌کند، نه راحتی پیاده‌سازی را.

ثبت قابلیت را عمومی نگه دارید. exportهای کمکی غیرقراردادی را حذف کنید:

- زیرمسیرهای کمکی ویژه Plugin همراه
- زیرمسیرهای لوله‌کشی زمان اجرا که برای API عمومی در نظر گرفته نشده‌اند
- helperهای راحتی ویژه فروشنده
- helperهای setup/onboarding که جزئیات پیاده‌سازی هستند

زیرمسیرهای کمکی رزرو‌شده Plugin همراه از نقشه export تولیدشده SDK بازنشسته شده‌اند. helperهای ویژه مالک را داخل بسته Plugin مالک نگه دارید؛ فقط رفتار میزبان قابل استفاده مجدد را به قراردادهای عمومی SDK مانند `plugin-sdk/gateway-runtime`، `plugin-sdk/security-runtime`، و `plugin-sdk/plugin-config-runtime` ارتقا دهید.

## داخلی‌ها و مرجع

برای خط لوله بارگذاری، مدل رجیستری، hookهای زمان اجرای ارائه‌دهنده، مسیرهای HTTP مربوط به Gateway، schemaهای ابزار پیام، حل هدف کانال، کاتالوگ‌های ارائه‌دهنده، Pluginهای موتور context، و راهنمای افزودن یک قابلیت جدید، [داخلی‌های معماری Plugin](/fa/plugins/architecture-internals) را ببینید.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [manifest مربوط به Plugin](/fa/plugins/manifest)
- [راه‌اندازی SDK مربوط به Plugin](/fa/plugins/sdk-setup)
