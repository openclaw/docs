---
read_when:
    - ساخت یا اشکال‌زدایی Pluginهای بومی OpenClaw
    - درک مدل قابلیت Plugin یا مرزهای مالکیت
    - کار روی خط لولهٔ بارگذاری Plugin یا رجیستری
    - پیاده‌سازی هوک‌های زمان اجرای ارائه‌دهنده یا Pluginهای کانال
sidebarTitle: Internals
summary: 'درون‌ساخت‌های Plugin: مدل قابلیت، مالکیت، قراردادها، خط لوله بارگذاری، و ابزارهای کمکی زمان اجرا'
title: جزئیات داخلی Plugin
x-i18n:
    generated_at: "2026-06-27T18:09:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e36f77594f16d7f03e31be81a241a15fb15c0b160f22a4dce863f6da184dfe3
    source_path: plugins/architecture.md
    workflow: 16
---

این **مرجع معماری عمیق** برای سیستم Plugin در OpenClaw است. برای راهنماهای عملی، از یکی از صفحه‌های متمرکز زیر شروع کنید.

<CardGroup cols={2}>
  <Card title="Install and use plugins" icon="plug" href="/fa/tools/plugin">
    راهنمای کاربر نهایی برای افزودن، فعال‌سازی، و عیب‌یابی Pluginها.
  </Card>
  <Card title="Building plugins" icon="rocket" href="/fa/plugins/building-plugins">
    آموزش نخستین Plugin با کوچک‌ترین manifest قابل‌اجرا.
  </Card>
  <Card title="Channel plugins" icon="comments" href="/fa/plugins/sdk-channel-plugins">
    یک Plugin کانال پیام‌رسانی بسازید.
  </Card>
  <Card title="Provider plugins" icon="microchip" href="/fa/plugins/sdk-provider-plugins">
    یک Plugin ارائه‌دهنده مدل بسازید.
  </Card>
  <Card title="SDK overview" icon="book" href="/fa/plugins/sdk-overview">
    مرجع import map و API ثبت‌نام.
  </Card>
</CardGroup>

## مدل قابلیت عمومی

قابلیت‌ها مدل عمومی **Plugin بومی** در OpenClaw هستند. هر Plugin بومی OpenClaw در برابر یک یا چند نوع قابلیت ثبت می‌شود:

| قابلیت                | روش ثبت‌نام                                      | Pluginهای نمونه                       |
| --------------------- | ------------------------------------------------ | ------------------------------------- |
| استنتاج متن           | `api.registerProvider(...)`                      | `openai`, `anthropic`                 |
| بک‌اند استنتاج CLI    | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                 |
| تعبیه‌ها              | `api.registerEmbeddingProvider(...)`             | Pluginهای برداری متعلق به ارائه‌دهنده |
| گفتار                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`             |
| رونویسی بلادرنگ       | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                              |
| صدای بلادرنگ          | `api.registerRealtimeVoiceProvider(...)`         | `openai`                              |
| درک رسانه             | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                    |
| منبع رونوشت‌ها        | `api.registerTranscriptSourceProvider(...)`      | `discord`                             |
| تولید تصویر           | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax`  |
| تولید موسیقی          | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                   |
| تولید ویدیو           | `api.registerVideoGenerationProvider(...)`       | `qwen`                                |
| واکشی وب              | `api.registerWebFetchProvider(...)`              | `firecrawl`                           |
| جست‌وجوی وب           | `api.registerWebSearchProvider(...)`             | `google`                              |
| کانال / پیام‌رسانی    | `api.registerChannel(...)`                       | `msteams`, `matrix`                   |
| کشف Gateway           | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                             |

<Note>
Pluginی که هیچ قابلیتی ثبت نمی‌کند اما hookها، ابزارها، سرویس‌های کشف، یا سرویس‌های پس‌زمینه ارائه می‌دهد، یک Plugin **فقط-hook قدیمی** است. این الگو همچنان به‌طور کامل پشتیبانی می‌شود.
</Note>

### موضع سازگاری خارجی

مدل قابلیت در هسته مستقر شده و امروز توسط Pluginهای باندل‌شده/بومی استفاده می‌شود، اما سازگاری Plugin خارجی هنوز به معیاری سخت‌گیرانه‌تر از «صادر شده، پس منجمد است» نیاز دارد.

| وضعیت Plugin خارجی                            | راهنما                                                                                               |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Pluginهای خارجی موجود                         | ادغام‌های مبتنی بر hook را فعال نگه دارید؛ این خط مبنای سازگاری است.                                |
| Pluginهای باندل‌شده/بومی جدید                 | ثبت قابلیت صریح را به دسترسی‌های اختصاصی فروشنده یا طراحی‌های جدید فقط-hook ترجیح دهید.             |
| Pluginهای خارجی که ثبت قابلیت را می‌پذیرند     | مجاز است، اما سطح‌های کمکی ویژه قابلیت را در حال تکامل بدانید مگر اینکه مستندات آن‌ها را پایدار بدانند. |

ثبت قابلیت مسیر موردنظر است. hookهای قدیمی در دوره گذار همچنان امن‌ترین مسیر بدون شکست برای Pluginهای خارجی هستند. زیرمسیرهای کمکی صادرشده همگی یکسان نیستند — قراردادهای مستند و محدود را به خروجی‌های کمکی اتفاقی ترجیح دهید.

### شکل‌های Plugin

OpenClaw هر Plugin بارگذاری‌شده را بر اساس رفتار ثبت‌نام واقعی آن، و نه فقط فراداده ایستا، در یک شکل طبقه‌بندی می‌کند:

<AccordionGroup>
  <Accordion title="plain-capability">
    دقیقاً یک نوع قابلیت ثبت می‌کند، برای مثال یک Plugin فقط ارائه‌دهنده مانند `mistral`.
  </Accordion>
  <Accordion title="hybrid-capability">
    چند نوع قابلیت ثبت می‌کند، برای مثال `openai` مالک استنتاج متن، گفتار، درک رسانه، و تولید تصویر است.
  </Accordion>
  <Accordion title="hook-only">
    فقط hookها را ثبت می‌کند، چه تایپ‌شده چه سفارشی؛ بدون قابلیت، ابزار، فرمان، یا سرویس.
  </Accordion>
  <Accordion title="non-capability">
    ابزارها، فرمان‌ها، سرویس‌ها، یا routeها را ثبت می‌کند اما هیچ قابلیتی ندارد.
  </Accordion>
</AccordionGroup>

برای دیدن شکل و تفکیک قابلیت‌های یک Plugin از `openclaw plugins inspect <id>` استفاده کنید. برای جزئیات، [مرجع CLI](/fa/cli/plugins#inspect) را ببینید.

### hookهای قدیمی

hook با نام `before_agent_start` همچنان به‌عنوان مسیر سازگاری برای Pluginهای فقط-hook پشتیبانی می‌شود. Pluginهای قدیمی واقعی هنوز به آن وابسته‌اند.

مسیر:

- آن را فعال نگه دارید
- آن را به‌عنوان قدیمی مستند کنید
- برای کارهای override مدل/ارائه‌دهنده، `before_model_resolve` را ترجیح دهید
- برای کارهای تغییر prompt، `before_prompt_build` را ترجیح دهید
- فقط پس از کاهش استفاده واقعی و اثبات ایمنی مهاجرت با پوشش fixture حذف کنید

### سیگنال‌های سازگاری

وقتی `openclaw doctor` یا `openclaw plugins inspect <id>` را اجرا می‌کنید، ممکن است یکی از این برچسب‌ها را ببینید:

| سیگنال                    | معنا                                                          |
| ------------------------- | ------------------------------------------------------------- |
| **config valid**          | Config بدون مشکل parse می‌شود و Pluginها resolve می‌شوند      |
| **compatibility advisory** | Plugin از الگویی پشتیبانی‌شده اما قدیمی‌تر استفاده می‌کند، مانند `hook-only` |
| **legacy warning**        | Plugin از `before_agent_start` استفاده می‌کند که منسوخ شده است |
| **hard error**            | Config نامعتبر است یا Plugin بارگذاری نشده است                |

نه `hook-only` و نه `before_agent_start` امروز Plugin شما را خراب نمی‌کنند: `hook-only` صرفاً توصیه‌ای است، و `before_agent_start` فقط هشدار ایجاد می‌کند. این سیگنال‌ها همچنین در `openclaw status --all` و `openclaw plugins doctor` ظاهر می‌شوند.

## نمای کلی معماری

سیستم Plugin در OpenClaw چهار لایه دارد:

<Steps>
  <Step title="Manifest + discovery">
    OpenClaw Pluginهای نامزد را از مسیرهای پیکربندی‌شده، ریشه‌های workspace، ریشه‌های Plugin سراسری، و Pluginهای باندل‌شده پیدا می‌کند. کشف، ابتدا manifestهای بومی `openclaw.plugin.json` و سپس manifestهای باندل پشتیبانی‌شده را می‌خواند.
  </Step>
  <Step title="Enablement + validation">
    هسته تصمیم می‌گیرد که یک Plugin کشف‌شده فعال، غیرفعال، مسدود، یا برای یک slot انحصاری مانند حافظه انتخاب شده باشد.
  </Step>
  <Step title="Runtime loading">
    Pluginهای بومی OpenClaw درون فرایند بارگذاری می‌شوند و قابلیت‌ها را در یک رجیستری مرکزی ثبت می‌کنند. JavaScript بسته‌بندی‌شده از طریق `require` بومی بارگذاری می‌شود؛ TypeScript منبع محلی شخص ثالث، fallback اضطراری Jiti است. باندل‌های سازگار بدون import کردن کد runtime به رکوردهای رجیستری نرمال‌سازی می‌شوند.
  </Step>
  <Step title="Surface consumption">
    بقیه OpenClaw رجیستری را می‌خواند تا ابزارها، کانال‌ها، راه‌اندازی ارائه‌دهنده، hookها، routeهای HTTP، فرمان‌های CLI، و سرویس‌ها را ارائه کند.
  </Step>
</Steps>

به‌طور ویژه برای CLI مربوط به Plugin، کشف فرمان ریشه به دو فاز تقسیم می‌شود:

- فراداده زمان parse از `registerCli(..., { descriptors: [...] })` می‌آید
- ماژول واقعی CLI مربوط به Plugin می‌تواند lazy بماند و در نخستین فراخوانی ثبت شود

این کار کد CLI متعلق به Plugin را داخل همان Plugin نگه می‌دارد، در حالی که همچنان به OpenClaw اجازه می‌دهد نام فرمان‌های ریشه را پیش از parse رزرو کند.

مرز طراحی مهم:

- اعتبارسنجی manifest/config باید از **فراداده manifest/schema** بدون اجرای کد Plugin کار کند
- کشف قابلیت بومی ممکن است کد ورودی Plugin مورداعتماد را برای ساخت snapshot رجیستری غیر‌فعال‌ساز بارگذاری کند
- رفتار runtime بومی از مسیر `register(api)` در ماژول Plugin با `api.registrationMode === "full"` می‌آید

این تفکیک به OpenClaw اجازه می‌دهد پیش از فعال شدن runtime کامل، config را اعتبارسنجی کند، Pluginهای گم‌شده/غیرفعال را توضیح دهد، و راهنماهای UI/schema بسازد.

### snapshot فراداده Plugin و جدول lookup

راه‌اندازی Gateway برای snapshot پیکربندی فعلی یک `PluginMetadataSnapshot` می‌سازد. این snapshot فقط فراداده است: ایندکس Pluginهای نصب‌شده، رجیستری manifest، عیب‌یابی‌های manifest، mapهای مالک، نرمال‌ساز id Plugin، و رکوردهای manifest را ذخیره می‌کند. این snapshot ماژول‌های Plugin بارگذاری‌شده، SDKهای ارائه‌دهنده، محتوای package، یا exportهای runtime را نگه نمی‌دارد.

اعتبارسنجی config آگاه از Plugin، فعال‌سازی خودکار هنگام راه‌اندازی، و bootstrap Plugin در Gateway به‌جای بازسازی مستقل فراداده manifest/index، از همان snapshot استفاده می‌کنند. `PluginLookUpTable` از همان snapshot مشتق می‌شود و برنامه Plugin راه‌اندازی را برای config runtime فعلی اضافه می‌کند.

پس از راه‌اندازی، Gateway snapshot فراداده فعلی را به‌عنوان یک محصول runtime قابل‌جایگزینی نگه می‌دارد. کشف مکرر ارائه‌دهنده در runtime می‌تواند به‌جای بازسازی ایندکس نصب‌شده و رجیستری manifest برای هر گذر catalog ارائه‌دهنده، از آن snapshot استفاده کند. snapshot هنگام خاموش شدن Gateway، تغییرات config/فهرست Plugin، و نوشتن‌های ایندکس نصب‌شده پاک یا جایگزین می‌شود؛ وقتی snapshot فعلی سازگار وجود ندارد، فراخوان‌ها به مسیر سرد manifest/index برمی‌گردند. بررسی‌های سازگاری باید ریشه‌های کشف Plugin مانند `plugins.load.paths` و workspace پیش‌فرض agent را دربر بگیرند، چون Pluginهای workspace بخشی از دامنه فراداده هستند.

snapshot و جدول lookup تصمیم‌های تکراری راه‌اندازی را در مسیر سریع نگه می‌دارند:

- مالکیت کانال
- راه‌اندازی تعویق‌افتاده کانال
- idهای Plugin راه‌اندازی
- مالکیت ارائه‌دهنده و بک‌اند CLI
- مالکیت ارائه‌دهنده setup، alias فرمان، ارائه‌دهنده catalog مدل، و قرارداد manifest
- اعتبارسنجی schema پیکربندی Plugin و schema پیکربندی کانال
- تصمیم‌های فعال‌سازی خودکار هنگام راه‌اندازی

مرز ایمنی جایگزینی snapshot است، نه mutation. وقتی config، فهرست Plugin، رکوردهای نصب، یا سیاست ایندکس پایدار تغییر می‌کند، snapshot را بازسازی کنید. آن را به‌عنوان یک رجیستری سراسری mutable گسترده در نظر نگیرید، و snapshotهای تاریخی نامحدود نگه ندارید. بارگذاری Plugin در runtime از snapshotهای فراداده جدا می‌ماند تا وضعیت runtime کهنه پشت cache فراداده پنهان نشود.

قاعده cache در [جزئیات داخلی معماری Plugin](/fa/plugins/architecture-internals#plugin-cache-boundary) مستند شده است: فراداده manifest و کشف تازه‌اند مگر اینکه فراخوان برای جریان فعلی snapshot، جدول lookup، یا رجیستری manifest صریح داشته باشد. cacheهای فراداده پنهان و TTLهای مبتنی بر ساعت دیواری بخشی از بارگذاری Plugin نیستند. فقط cacheهای runtime loader، ماژول، و artifact وابستگی ممکن است پس از بارگذاری واقعی کد یا artifactهای نصب‌شده پایدار بمانند.

برخی فراخوان‌های مسیر سرد هنوز به‌جای دریافت `PluginLookUpTable` از Gateway، رجیستری‌های manifest را مستقیماً از ایندکس پایدار Plugin نصب‌شده بازسازی می‌کنند. اکنون آن مسیر رجیستری را هنگام نیاز بازسازی می‌کند؛ وقتی فراخوان از قبل یکی دارد، عبور دادن جدول lookup فعلی یا یک رجیستری manifest صریح از طریق جریان‌های runtime را ترجیح دهید.

### برنامه‌ریزی فعال‌سازی

برنامه‌ریزی فعال‌سازی بخشی از control plane است. فراخوان‌ها می‌توانند پیش از بارگذاری رجیستری‌های runtime گسترده‌تر بپرسند کدام Pluginها به یک فرمان، ارائه‌دهنده، کانال، route، harness agent، یا قابلیت مشخص مربوط‌اند.

برنامه‌ریز رفتار فعلی manifest را سازگار نگه می‌دارد:

- فیلدهای `activation.*` راهنمایی‌های صریح برای planner هستند
- `providers`، `channels`، `commandAliases`، `setup.providers`، `contracts.tools` و hookها همچنان fallback مالکیت manifest باقی می‌مانند
- API مخصوص planner با فقط شناسه‌ها برای callerهای موجود همچنان در دسترس می‌ماند
- API برنامه‌ریزی برچسب‌های دلیل را گزارش می‌کند تا diagnosticها بتوانند راهنمایی‌های صریح را از fallback مالکیت تشخیص دهند

<Warning>
`activation` را به‌عنوان lifecycle hook یا جایگزینی برای `register(...)` در نظر نگیرید. این metadata برای محدود کردن بارگذاری استفاده می‌شود. وقتی فیلدهای مالکیت از قبل رابطه را توصیف می‌کنند، آن‌ها را ترجیح دهید؛ از `activation` فقط برای راهنمایی‌های اضافی planner استفاده کنید.
</Warning>

### Pluginهای کانال و ابزار پیام مشترک

Pluginهای کانال برای کنش‌های عادی چت نیازی ندارند ابزار جداگانه‌ای برای ارسال/ویرایش/واکنش ثبت کنند. OpenClaw یک ابزار مشترک `message` را در core نگه می‌دارد، و Pluginهای کانال مالک discovery و اجرای مخصوص کانال در پشت آن هستند.

مرز فعلی این است:

- core مالک host ابزار مشترک `message`، اتصال prompt، حسابداری session/thread و dispatch اجرا است
- Pluginهای کانال مالک discovery کنش scoped، discovery قابلیت و هر قطعه schema مخصوص کانال هستند
- Pluginهای کانال مالک دستور زبان مکالمه session مخصوص provider هستند، مانند اینکه شناسه‌های مکالمه چگونه شناسه‌های thread را encode می‌کنند یا از مکالمه‌های والد ارث می‌برند
- Pluginهای کانال کنش نهایی را از طریق adapter کنش خود اجرا می‌کنند

برای Pluginهای کانال، سطح SDK برابر با `ChannelMessageActionAdapter.describeMessageTool(...)` است. آن فراخوانی discovery یکپارچه به Plugin اجازه می‌دهد کنش‌های قابل مشاهده، قابلیت‌ها و مشارکت‌های schema خود را با هم برگرداند تا این قطعات از هم جدا نشوند.

وقتی یک پارامتر message-tool مخصوص کانال یک منبع media مانند مسیر local یا URL رسانه remote حمل می‌کند، Plugin باید `mediaSourceParams` را نیز از `describeMessageTool(...)` برگرداند. Core از آن فهرست صریح استفاده می‌کند تا normalization مسیر sandbox و راهنمایی‌های دسترسی رسانه خروجی را بدون hardcode کردن نام پارامترهای متعلق به Plugin اعمال کند. در آنجا mapهای scoped به کنش را ترجیح دهید، نه یک فهرست تخت در سطح کل کانال، تا پارامتر media فقط مخصوص profile روی کنش‌های نامرتبطی مانند `send` normalize نشود.

Core محدوده runtime را وارد آن مرحله discovery می‌کند. فیلدهای مهم شامل این‌ها هستند:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` ورودی قابل اعتماد

این برای Pluginهای حساس به context مهم است. یک کانال می‌تواند بر اساس account فعال، room/thread/message فعلی، یا هویت requester قابل اعتماد، کنش‌های پیام را پنهان یا آشکار کند، بدون hardcode کردن branchهای مخصوص کانال در ابزار core `message`.

به همین دلیل تغییرات routing برای embedded-runner همچنان کار Plugin است: runner مسئول است هویت chat/session فعلی را به مرز discovery Plugin forward کند تا ابزار مشترک `message` سطح درستِ متعلق به کانال را برای turn فعلی آشکار کند.

برای helperهای اجرای متعلق به کانال، Pluginهای bundled باید runtime اجرا را داخل ماژول‌های extension خودشان نگه دارند. Core دیگر مالک runtimeهای کنش پیام Discord، Slack، Telegram یا WhatsApp زیر `src/agents/tools` نیست. ما subpathهای جداگانه `plugin-sdk/*-action-runtime` منتشر نمی‌کنیم، و Pluginهای bundled باید کد runtime محلی خودشان را مستقیماً از ماژول‌های متعلق به extension خود import کنند.

همین مرز به seamهای SDK با نام provider به‌طور کلی اعمال می‌شود: core نباید barrelهای convenience مخصوص کانال را برای Slack، Discord، Signal، WhatsApp یا extensionهای مشابه import کند. اگر core به رفتاری نیاز دارد، یا barrel خود Plugin bundled یعنی `api.ts` / `runtime-api.ts` را مصرف کنید، یا نیاز را به یک قابلیت generic باریک در SDK مشترک ارتقا دهید.

Pluginهای bundled از همین قانون پیروی می‌کنند. `runtime-api.ts` یک Plugin bundled نباید facade برنددار خودش با مسیر `openclaw/plugin-sdk/<plugin-id>` را دوباره export کند. آن facadeهای برنددار به‌عنوان shimهای compatibility برای Pluginهای خارجی و مصرف‌کنندگان قدیمی‌تر باقی می‌مانند، اما Pluginهای bundled باید از exportهای local به‌همراه subpathهای generic باریک SDK مانند `openclaw/plugin-sdk/channel-policy`، `openclaw/plugin-sdk/runtime-store` یا `openclaw/plugin-sdk/webhook-ingress` استفاده کنند. کد جدید نباید facadeهای SDK مخصوص plugin-id اضافه کند، مگر اینکه مرز compatibility برای یک ecosystem خارجی موجود به آن نیاز داشته باشد.

به‌طور مشخص برای pollها، دو مسیر اجرا وجود دارد:

- `outbound.sendPoll` baseline مشترک برای کانال‌هایی است که با مدل poll رایج سازگارند
- `actions.handleAction("poll")` مسیر ترجیحی برای semantics مخصوص کانال یا پارامترهای poll اضافی است

Core اکنون parse مشترک poll را تا پس از رد شدن کنش توسط dispatch poll Plugin به تعویق می‌اندازد، بنابراین handlerهای poll متعلق به Plugin می‌توانند فیلدهای poll مخصوص کانال را بپذیرند بدون اینکه ابتدا توسط parser عمومی poll مسدود شوند.

برای توالی کامل startup، [جزئیات داخلی معماری Plugin](/fa/plugins/architecture-internals) را ببینید.

## مدل مالکیت قابلیت

OpenClaw با یک Plugin native به‌عنوان مرز مالکیت برای یک **شرکت** یا یک **ویژگی** رفتار می‌کند، نه به‌عنوان مجموعه‌ای تصادفی از integrationهای نامرتبط.

یعنی:

- یک Plugin شرکتی معمولاً باید همه سطح‌های روبه‌روی OpenClaw آن شرکت را مالک باشد
- یک Plugin ویژگی معمولاً باید مالک کل سطح ویژگی‌ای باشد که معرفی می‌کند
- کانال‌ها باید به‌جای پیاده‌سازی ad hoc رفتار provider، قابلیت‌های مشترک core را مصرف کنند

<AccordionGroup>
  <Accordion title="چند قابلیتی vendor">
    `openai` مالک inference متن، speech، voice realtime، درک رسانه و تولید تصویر است. `google` مالک inference متن به‌همراه درک رسانه، تولید تصویر و جست‌وجوی وب است. `qwen` مالک inference متن به‌همراه درک رسانه و تولید ویدیو است.
  </Accordion>
  <Accordion title="تک قابلیتی vendor">
    `elevenlabs` و `microsoft` مالک speech هستند؛ `firecrawl` مالک web-fetch است؛ `minimax` / `mistral` / `moonshot` / `zai` مالک backendهای media-understanding هستند.
  </Accordion>
  <Accordion title="Plugin ویژگی">
    `voice-call` مالک transport تماس، tools، CLI، routeها و bridging برای media-stream در Twilio است، اما به‌جای import مستقیم Pluginهای vendor، قابلیت‌های مشترک speech، transcription realtime و voice realtime را مصرف می‌کند.
  </Accordion>
</AccordionGroup>

وضعیت نهایی مورد نظر این است:

- OpenAI در یک Plugin زندگی می‌کند، حتی اگر modelهای متن، speech، imageها و video آینده را پوشش دهد
- vendor دیگر می‌تواند همین کار را برای سطح خودش انجام دهد
- کانال‌ها اهمیت نمی‌دهند کدام Plugin vendor مالک provider است؛ آن‌ها contract قابلیت مشترک ارائه‌شده توسط core را مصرف می‌کنند

تمایز کلیدی این است:

- **plugin** = مرز مالکیت
- **capability** = contract در core که چند Plugin می‌توانند آن را پیاده‌سازی یا مصرف کنند

پس اگر OpenClaw دامنه جدیدی مانند video اضافه کند، پرسش نخست این نیست که «کدام provider باید video handling را hardcode کند؟» پرسش نخست این است: «contract قابلیت video در core چیست؟» وقتی آن contract وجود داشته باشد، Pluginهای vendor می‌توانند در برابر آن ثبت شوند و Pluginهای کانال/ویژگی می‌توانند آن را مصرف کنند.

اگر آن قابلیت هنوز وجود ندارد، حرکت درست معمولاً این است:

<Steps>
  <Step title="تعریف قابلیت">
    قابلیت مفقود را در core تعریف کنید.
  </Step>
  <Step title="ارائه از طریق SDK">
    آن را به‌شکل typed از طریق API/runtime Plugin ارائه کنید.
  </Step>
  <Step title="اتصال مصرف‌کنندگان">
    کانال‌ها/ویژگی‌ها را به آن قابلیت وصل کنید.
  </Step>
  <Step title="پیاده‌سازی‌های vendor">
    اجازه دهید Pluginهای vendor پیاده‌سازی‌ها را ثبت کنند.
  </Step>
</Steps>

این کار مالکیت را صریح نگه می‌دارد و هم‌زمان از رفتار core که به یک vendor واحد یا مسیر کد یک‌باره مخصوص Plugin وابسته باشد جلوگیری می‌کند.

### لایه‌بندی قابلیت

هنگام تصمیم‌گیری درباره اینکه کد کجا تعلق دارد، از این مدل ذهنی استفاده کنید:

<Tabs>
  <Tab title="لایه قابلیت core">
    orchestration، policy، fallback، قوانین merge پیکربندی، semantics تحویل و contractهای typed مشترک.
  </Tab>
  <Tab title="لایه Plugin vendor">
    APIهای مخصوص vendor، auth، catalogهای model، synthesis گفتار، تولید تصویر، backendهای video آینده، endpointهای usage.
  </Tab>
  <Tab title="لایه Plugin کانال/ویژگی">
    integration مربوط به Slack/Discord/voice-call/etc. که قابلیت‌های core را مصرف می‌کند و آن‌ها را روی یک سطح ارائه می‌دهد.
  </Tab>
</Tabs>

برای مثال، TTS از این شکل پیروی می‌کند:

- core مالک policy مربوط به TTS در زمان پاسخ، ترتیب fallback، prefs و تحویل کانال است
- `openai`، `elevenlabs` و `microsoft` مالک پیاده‌سازی‌های synthesis هستند
- `voice-call` helper runtime مربوط به telephony TTS را مصرف می‌کند

همین الگو باید برای قابلیت‌های آینده ترجیح داده شود.

### مثال Plugin شرکتی چندقابلیتی

یک Plugin شرکتی باید از بیرون منسجم به نظر برسد. اگر OpenClaw contractهای مشترکی برای modelها، speech، transcription realtime، voice realtime، درک رسانه، تولید تصویر، تولید video، web fetch و web search داشته باشد، یک vendor می‌تواند همه سطح‌های خودش را در یک جا مالک باشد:

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
- core همچنان مالک contractهای قابلیت است
- کانال‌ها و Pluginهای ویژگی helperهای `api.runtime.*` را مصرف می‌کنند، نه کد vendor را
- تست‌های contract می‌توانند assert کنند که Plugin قابلیت‌هایی را که ادعای مالکیتشان را دارد ثبت کرده است

### مثال قابلیت: درک video

OpenClaw از قبل با درک image/audio/video به‌عنوان یک قابلیت مشترک رفتار می‌کند. همان مدل مالکیت در آنجا هم اعمال می‌شود:

<Steps>
  <Step title="Core contract را تعریف می‌کند">
    Core contract مربوط به media-understanding را تعریف می‌کند.
  </Step>
  <Step title="Pluginهای vendor ثبت می‌کنند">
    Pluginهای vendor در صورت کاربرد، `describeImage`، `transcribeAudio` و `describeVideo` را ثبت می‌کنند.
  </Step>
  <Step title="مصرف‌کنندگان از رفتار مشترک استفاده می‌کنند">
    کانال‌ها و Pluginهای ویژگی به‌جای اتصال مستقیم به کد vendor، رفتار مشترک core را مصرف می‌کنند.
  </Step>
</Steps>

این کار از bake شدن فرضیات video یک provider در core جلوگیری می‌کند. Plugin مالک سطح vendor است؛ core مالک contract قابلیت و رفتار fallback است.

تولید video هم از قبل از همین توالی استفاده می‌کند: core مالک contract قابلیت typed و helper runtime است، و Pluginهای vendor پیاده‌سازی‌های `api.registerVideoGenerationProvider(...)` را در برابر آن ثبت می‌کنند.

به یک checklist rollout مشخص نیاز دارید؟ [Capability Cookbook](/fa/plugins/adding-capabilities) را ببینید.

## Contractها و enforcement

سطح API Plugin عمداً در `OpenClawPluginApi` typed و متمرکز است. آن contract نقاط registration پشتیبانی‌شده و helperهای runtime را که یک Plugin می‌تواند به آن‌ها تکیه کند تعریف می‌کند.

چرا این مهم است:

- نویسندگان Plugin یک standard داخلی پایدار دریافت می‌کنند
- core می‌تواند مالکیت duplicate مانند ثبت همان provider id توسط دو Plugin را reject کند
- startup می‌تواند diagnosticهای actionable برای registration بدشکل نمایش دهد
- تست‌های contract می‌توانند مالکیت Plugin bundled را enforce کنند و از drift خاموش جلوگیری کنند

دو لایه enforcement وجود دارد:

<AccordionGroup>
  <Accordion title="اجرای ثبت در زمان اجرا">
    رجیستری Plugin ثبت‌ها را هنگام بارگذاری Pluginها اعتبارسنجی می‌کند. نمونه‌ها: شناسه‌های تکراری ارائه‌دهنده، شناسه‌های تکراری ارائه‌دهنده گفتار، و ثبت‌های بدشکل به‌جای رفتار تعریف‌نشده، عیب‌یابی‌های Plugin تولید می‌کنند.
  </Accordion>
  <Accordion title="آزمون‌های قرارداد">
    Pluginهای همراه هنگام اجرای آزمون‌ها در رجیستری‌های قرارداد ثبت می‌شوند تا OpenClaw بتواند مالکیت را به‌صراحت بررسی کند. امروز این برای ارائه‌دهندگان مدل، ارائه‌دهندگان گفتار، ارائه‌دهندگان جست‌وجوی وب، و مالکیت ثبت همراه استفاده می‌شود.
  </Accordion>
</AccordionGroup>

اثر عملی این است که OpenClaw از ابتدا می‌داند کدام Plugin مالک کدام سطح است. این به هسته و کانال‌ها امکان می‌دهد بی‌وقفه با هم ترکیب شوند، چون مالکیت به‌جای ضمنی بودن، اعلام‌شده، نوع‌دار، و آزمون‌پذیر است.

### چه چیزی به یک قرارداد تعلق دارد

<Tabs>
  <Tab title="قراردادهای خوب">
    - نوع‌دار
    - کوچک
    - مختص قابلیت
    - متعلق به هسته
    - قابل استفاده مجدد توسط چند Plugin
    - قابل مصرف توسط کانال‌ها/قابلیت‌ها بدون دانش فروشنده

  </Tab>
  <Tab title="قراردادهای بد">
    - سیاست مختص فروشنده که در هسته پنهان شده است
    - راه‌های فرار تک‌موردی Plugin که رجیستری را دور می‌زنند
    - کد کانال که مستقیماً به پیاده‌سازی فروشنده دسترسی پیدا می‌کند
    - اشیای موردی زمان اجرا که بخشی از `OpenClawPluginApi` یا `api.runtime` نیستند

  </Tab>
</Tabs>

هنگام تردید، سطح انتزاع را بالاتر ببرید: ابتدا قابلیت را تعریف کنید، سپس اجازه دهید Pluginها به آن متصل شوند.

## مدل اجرا

Pluginهای بومی OpenClaw به‌صورت **درون‌فرایندی** همراه با Gateway اجرا می‌شوند. آن‌ها در sandbox نیستند. یک Plugin بومی بارگذاری‌شده همان مرز اعتماد در سطح فرایند را دارد که کد هسته دارد.

<Warning>
پیامدهای Plugin بومی: یک Plugin می‌تواند ابزارها، مدیریت‌کننده‌های شبکه، قلاب‌ها، و سرویس‌ها را ثبت کند؛ باگ در Plugin می‌تواند Gateway را از کار بیندازد یا ناپایدار کند؛ و یک Plugin بومی مخرب معادل اجرای کد دلخواه داخل فرایند OpenClaw است.
</Warning>

بسته‌های سازگار به‌صورت پیش‌فرض امن‌ترند، زیرا OpenClaw در حال حاضر آن‌ها را به‌عنوان بسته‌های فراداده/محتوا در نظر می‌گیرد. در نسخه‌های فعلی، این عمدتاً به‌معنای Skills همراه است.

برای Pluginهای غیرهمراه از فهرست‌های مجاز و مسیرهای نصب/بارگذاری صریح استفاده کنید. Pluginهای فضای کاری را کد زمان توسعه در نظر بگیرید، نه پیش‌فرض‌های تولید.

برای نام بسته‌های فضای کاری همراه، شناسه Plugin را به نام npm متصل نگه دارید: به‌صورت پیش‌فرض `@openclaw/<id>`، یا پسوند نوع‌دار تأییدشده‌ای مانند `-provider`، `-plugin`، `-speech`، `-sandbox`، یا `-media-understanding` وقتی بسته عمداً نقش محدودتری از Plugin را ارائه می‌کند.

<Note>
**یادداشت اعتماد:** `plugins.allow` به **شناسه‌های Plugin** اعتماد می‌کند، نه به منشأ منبع. یک Plugin فضای کاری با همان شناسه یک Plugin همراه، وقتی آن Plugin فضای کاری فعال/در فهرست مجاز باشد، عمداً نسخه همراه را تحت‌الشعاع قرار می‌دهد. این برای توسعه محلی، آزمون وصله، و hotfixها عادی و مفید است. اعتماد Plugin همراه از snapshot منبع حل می‌شود، یعنی manifest و کد روی دیسک در زمان بارگذاری، نه از فراداده نصب. یک رکورد نصب خراب یا جایگزین‌شده نمی‌تواند بی‌سروصدا سطح اعتماد یک Plugin همراه را فراتر از ادعای منبع واقعی گسترش دهد.
</Note>

## مرز خروجی

OpenClaw قابلیت‌ها را صادر می‌کند، نه سهولت پیاده‌سازی را.

ثبت قابلیت را عمومی نگه دارید. خروجی‌های کمکی غیرقراردادی را کاهش دهید:

- زیرمسیرهای کمکی مختص Plugin همراه
- زیرمسیرهای لوله‌کشی زمان اجرا که به‌عنوان API عمومی در نظر گرفته نشده‌اند
- کمک‌گرهای راحتی مختص فروشنده
- کمک‌گرهای راه‌اندازی/onboarding که جزئیات پیاده‌سازی هستند

زیرمسیرهای کمکی رزروشده Plugin همراه از نقشه خروجی SDK تولیدشده بازنشسته شده‌اند. کمک‌گرهای مختص مالک را داخل بسته Plugin مالک نگه دارید؛ فقط رفتار میزبان قابل استفاده مجدد را به قراردادهای عمومی SDK مانند `plugin-sdk/gateway-runtime`، `plugin-sdk/security-runtime`، و `plugin-sdk/plugin-config-runtime` ارتقا دهید.

## جزئیات داخلی و مرجع

برای خط لوله بارگذاری، مدل رجیستری، قلاب‌های زمان اجرای ارائه‌دهنده، مسیرهای HTTP Gateway، schemaهای ابزار پیام، حل هدف کانال، کاتالوگ‌های ارائه‌دهنده، Pluginهای موتور زمینه، و راهنمای افزودن یک قابلیت جدید، [جزئیات داخلی معماری Plugin](/fa/plugins/architecture-internals) را ببینید.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [manifest Plugin](/fa/plugins/manifest)
- [راه‌اندازی SDK Plugin](/fa/plugins/sdk-setup)
