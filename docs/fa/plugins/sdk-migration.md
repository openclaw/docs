---
read_when:
    - هشدار OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED را مشاهده می‌کنید
    - هشدار OPENCLAW_EXTENSION_API_DEPRECATED را مشاهده می‌کنید
    - شما پیش از OpenClaw 2026.4.25 از api.registerEmbeddedExtensionFactory استفاده کردید
    - شما در حال به‌روزرسانی یک Plugin به معماری مدرن Plugin هستید
    - شما یک Plugin خارجی OpenClaw را نگهداری می‌کنید
sidebarTitle: Migrate to SDK
summary: از لایهٔ قدیمی سازگاری با نسخه‌های پیشین به SDK مدرن Plugin مهاجرت کنید
title: مهاجرت SDK Plugin
x-i18n:
    generated_at: "2026-05-10T19:58:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7595b41c15ce36dd8d2a3faf320cc9847b013b1f4807c02b8b97c6feaee4415
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw از یک لایه‌ی گسترده‌ی سازگاری با نسخه‌های قبلی به معماری مدرن Plugin
با importهای متمرکز و مستند منتقل شده است. اگر Plugin شما پیش از
معماری جدید ساخته شده، این راهنما به شما کمک می‌کند آن را مهاجرت دهید.

## چه چیزی تغییر می‌کند

سیستم قدیمی Plugin دو سطح کاملاً باز فراهم می‌کرد که به Pluginها اجازه می‌داد
هر چیزی را که نیاز داشتند از یک نقطه‌ی ورود واحد import کنند:

- **`openclaw/plugin-sdk/compat`** - یک import واحد که ده‌ها helper را دوباره
  export می‌کرد. این برای فعال نگه داشتن Pluginهای قدیمی مبتنی بر hook معرفی شد
  تا زمانی که معماری جدید Plugin در حال ساخت بود.
- **`openclaw/plugin-sdk/infra-runtime`** - یک barrel گسترده برای helperهای runtime که
  رویدادهای سیستم، وضعیت Heartbeat، صف‌های تحویل، helperهای fetch/proxy،
  helperهای فایل، نوع‌های approval، و utilityهای نامرتبط را با هم ترکیب می‌کرد.
- **`openclaw/plugin-sdk/config-runtime`** - یک barrel گسترده‌ی سازگاری config
  که هنوز helperهای مستقیم load/write منسوخ‌شده را در طول پنجره‌ی مهاجرت نگه می‌دارد.
- **`openclaw/extension-api`** - پلی که به Pluginها دسترسی مستقیم به
  helperهای سمت host مانند runner عامل جاسازی‌شده می‌داد.
- **`api.registerEmbeddedExtensionFactory(...)`** - یک hook حذف‌شده‌ی extension
  فقط برای Pi و bundled که می‌توانست رویدادهای embedded-runner مانند
  `tool_result` را مشاهده کند.

سطح‌های import گسترده اکنون **منسوخ شده‌اند**. آن‌ها هنوز در runtime کار می‌کنند،
اما Pluginهای جدید نباید از آن‌ها استفاده کنند، و Pluginهای موجود باید پیش از
حذف آن‌ها در نسخه‌ی major بعدی مهاجرت کنند. API ثبت factory برای extension
جاسازی‌شده‌ی فقط Pi حذف شده است؛ به‌جای آن از middleware نتیجه‌ی ابزار استفاده کنید.

OpenClaw رفتار مستند Plugin را در همان تغییری که جایگزین معرفی می‌کند حذف یا
باز تفسیر نمی‌کند. تغییرات شکننده‌ی قرارداد ابتدا باید از adapter سازگاری،
diagnostics، docs، و یک پنجره‌ی deprecation عبور کنند. این درباره‌ی importهای SDK،
فیلدهای manifest، APIهای setup، hookها، و رفتار ثبت runtime صدق می‌کند.

<Warning>
  لایه‌ی سازگاری با نسخه‌های قبلی در یک نسخه‌ی major آینده حذف خواهد شد.
  Pluginهایی که هنوز از این سطح‌ها import می‌کنند، وقتی این اتفاق بیفتد خواهند شکست.
  ثبت‌های factory برای extension جاسازی‌شده‌ی فقط Pi از قبل دیگر load نمی‌شوند.
</Warning>

## چرا این تغییر انجام شد

رویکرد قدیمی مشکلاتی ایجاد می‌کرد:

- **راه‌اندازی کند** - import کردن یک helper ده‌ها ماژول نامرتبط را load می‌کرد
- **وابستگی‌های چرخه‌ای** - export مجدد گسترده ایجاد چرخه‌های import را آسان می‌کرد
- **سطح API نامشخص** - راهی برای تشخیص اینکه کدام exportها پایدار و کدام داخلی بودند وجود نداشت

SDK مدرن Plugin این را برطرف می‌کند: هر مسیر import (`openclaw/plugin-sdk/\<subpath\>`)
یک ماژول کوچک، خودبسنده، با هدف روشن و قرارداد مستند است.

seamهای convenience قدیمی provider برای channelهای bundled نیز حذف شده‌اند.
seamهای helper با برند channel میان‌برهای خصوصی mono-repo بودند، نه قراردادهای پایدار
Plugin. به‌جای آن از subpathهای باریک و generic SDK استفاده کنید. داخل workspace
Plugin bundled، helperهای متعلق به provider را در `api.ts` یا `runtime-api.ts`
خود همان Plugin نگه دارید.

نمونه‌های فعلی providerهای bundled:

- Anthropic helperهای stream اختصاصی Claude را در seam خودش یعنی `api.ts` /
  `contract-api.ts` نگه می‌دارد
- OpenAI provider builderها، helperهای مدل پیش‌فرض، و provider builderهای realtime
  را در `api.ts` خودش نگه می‌دارد
- OpenRouter provider builder و helperهای onboarding/config را در `api.ts` خودش
  نگه می‌دارد

## برنامه‌ی مهاجرت Talk و صدای realtime

کد Talk برای صدای realtime، تلفن، جلسه، و مرورگر از bookkeeping نوبت محلیِ سطح
به کنترل‌کننده‌ی مشترک session Talk که توسط
`openclaw/plugin-sdk/realtime-voice` export می‌شود منتقل می‌شود. کنترل‌کننده‌ی جدید
envelope مشترک رویداد Talk، وضعیت نوبت فعال، وضعیت capture، وضعیت audio خروجی،
تاریخچه‌ی رویدادهای اخیر، و رد کردن نوبت‌های stale را در اختیار دارد. Pluginهای
provider باید همچنان مالک sessionهای realtime اختصاصی vendor باشند؛ Pluginهای
surface باید همچنان مالک capture، playback، تلفن، و quirks جلسه باشند.

این مهاجرت Talk عمداً با شکست تمیز طراحی شده است:

1. primitiveهای مشترک controller/runtime را در
   `plugin-sdk/realtime-voice` نگه دارید.
2. سطح‌های bundled را به کنترل‌کننده‌ی مشترک منتقل کنید: browser relay،
   managed-room handoff، voice-call realtime، voice-call streaming STT، Google
   Meet realtime، و native push-to-talk.
3. خانواده‌های قدیمی RPC Talk را با API نهایی `talk.session.*` و
   `talk.client.*` جایگزین کنید.
4. یک channel رویداد live Talk را در Gateway
   `hello-ok.features.events` اعلام کنید: `talk.event`.
5. endpoint قدیمی HTTP realtime و هر مسیر override دستورالعمل در زمان request را حذف کنید.

کد جدید نباید مستقیماً `createTalkEventSequencer(...)` را فراخوانی کند، مگر اینکه
یک adapter سطح پایین یا test fixture پیاده‌سازی کند. کنترل‌کننده‌ی مشترک را ترجیح دهید
تا رویدادهای محدود به نوبت بدون turn id منتشر نشوند، فراخوانی‌های stale `turnEnd` /
`turnCancel` نتوانند نوبت فعال جدیدتر را پاک کنند، و رویدادهای lifecycle مربوط به
audio خروجی در تلفن، جلسات، browser relay، managed-room handoff، و کلاینت‌های native Talk
سازگار بمانند.

شکل هدف API عمومی این است:

```typescript
// Gateway-owned Talk session API.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// Client-owned provider session API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
```

sessionهای WebRTC/provider-websocket متعلق به مرورگر از `talk.client.create`
استفاده می‌کنند، زیرا مرورگر مالک مذاکره‌ی provider و transport رسانه است، در حالی که
Gateway مالک credentials، instructions، و سیاست ابزار است. `talk.session.*` سطح
مشترک مدیریت‌شده توسط Gateway برای gateway-relay realtime، gateway-relay
transcription، و sessionهای native STT/TTS در managed-room است.

configهای قدیمی که selectorهای realtime را کنار `talk.provider` /
`talk.providers` قرار داده‌اند باید با `openclaw doctor --fix` تعمیر شوند؛ Talk در
runtime، config مربوط به speech/TTS provider را به‌عنوان config مربوط به realtime provider
باز تفسیر نمی‌کند.

ترکیب‌های پشتیبانی‌شده‌ی `talk.session.create` عمداً کوچک هستند:

| Mode            | Transport       | Brain           | مالک              | یادداشت‌ها                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | audio تمام‌دوطرفه‌ی provider از طریق Gateway پل زده می‌شود؛ tool callها از طریق ابزار agent-consult مسیریابی می‌شوند.      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | فقط streaming STT؛ callerها audio ورودی می‌فرستند و رویدادهای transcript دریافت می‌کنند.                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | اتاق native/client | اتاق‌هایی به سبک push-to-talk و walkie-talkie که client مالک capture/playback و Gateway مالک وضعیت نوبت است. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | اتاق native/client | حالت اتاق فقط برای admin برای سطح‌های trusted first-party که actionهای ابزار Gateway را مستقیماً اجرا می‌کنند.                  |

نقشه‌ی methodهای حذف‌شده:

| قدیمی                              | جدید                                                      |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` or `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

واژگان کنترل یکپارچه نیز عمداً محدود است:

| Method                          | اعمال می‌شود به                                              | قرارداد                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | یک chunk audio PCM با base64 را به session provider که متعلق به همان اتصال Gateway است اضافه کنید.                                                                                            |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | یک نوبت کاربر managed-room را شروع کنید.                                                                                                                                                          |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | نوبت فعال را پس از اعتبارسنجی stale-turn پایان دهید.                                                                                                                                         |
| `talk.session.cancelTurn`       | همه‌ی sessionهای متعلق به Gateway                              | کار فعال capture/provider/agent/TTS برای یک نوبت را لغو کنید.                                                                                                                                |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | خروجی audio دستیار را بدون اینکه الزاماً نوبت کاربر پایان یابد متوقف کنید.                                                                                                                    |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | یک tool call provider را که توسط relay منتشر شده کامل کنید؛ برای خروجی interim از `options.willContinue` یا برای satisfy کردن call بدون پاسخ دیگر دستیار از `options.suppressResponse` استفاده کنید. |
| `talk.session.close`            | همه‌ی sessionهای یکپارچه                                    | sessionهای relay را متوقف کنید یا وضعیت managed-room را revoke کنید، سپس unified session id را فراموش کنید.                                                                                                    |

  در core، حالت‌های ویژهٔ provider یا platform را برای کار کردن این قابلیت وارد نکنید.
  core مالک معناشناسی نشست Talk است. Pluginهای provider مالک راه‌اندازی نشست vendor هستند.
  Voice-call و Google Meet مالک سازگارکننده‌های تلفنی/جلسه هستند. مرورگر و برنامه‌های native
  مالک تجربهٔ کاربری ضبط/پخش دستگاه هستند.

  ## سیاست سازگاری

  برای Pluginهای خارجی، کار سازگاری با این ترتیب انجام می‌شود:

  1. قرارداد جدید را اضافه کنید
  2. رفتار قدیمی را از طریق یک سازگارکنندهٔ سازگاری متصل نگه دارید
  3. یک تشخیص یا هشدار منتشر کنید که مسیر قدیمی و جایگزین را نام می‌برد
  4. هر دو مسیر را در آزمون‌ها پوشش دهید
  5. منسوخ‌سازی و مسیر مهاجرت را مستند کنید
  6. فقط پس از پنجرهٔ مهاجرت اعلام‌شده حذف کنید، که معمولاً در یک انتشار major است

  نگه‌دارندگان می‌توانند صف مهاجرت فعلی را با
  `pnpm plugins:boundary-report` بازبینی کنند. برای شمارش‌های فشرده از `pnpm plugins:boundary-report:summary`،
  برای یک Plugin یا مالک سازگاری از `--owner <id>`، و زمانی که یک gate در CI باید روی رکوردهای
  سازگاری سررسیدشده، واردکردن‌های SDK رزرو‌شدهٔ بین‌مالکی، یا زیرمسیرهای SDK رزروشدهٔ استفاده‌نشده
  fail شود، از
  `pnpm plugins:boundary-report:ci` استفاده کنید. گزارش، رکوردهای سازگاری منسوخ‌شده را بر اساس تاریخ حذف گروه‌بندی می‌کند،
  ارجاع‌های کد/مستندات محلی را می‌شمارد، واردکردن‌های SDK رزرو‌شدهٔ بین‌مالکی را آشکار می‌کند،
  و پل خصوصی SDK میزبان حافظه را خلاصه می‌کند تا پاک‌سازی سازگاری صریح باقی بماند، به‌جای اینکه
  به جست‌وجوهای موردی متکی باشد. زیرمسیرهای SDK رزروشده باید استفادهٔ مالکِ رهگیری‌شده داشته باشند؛
  exportهای helper رزروشدهٔ استفاده‌نشده باید از SDK عمومی حذف شوند.

  اگر یک فیلد manifest هنوز پذیرفته می‌شود، نویسندگان Plugin می‌توانند تا زمانی که
  مستندات و تشخیص‌ها چیز دیگری نگفته‌اند، به استفاده از آن ادامه دهند. کد جدید باید جایگزین مستندشده را ترجیح دهد،
  اما Pluginهای موجود نباید در انتشارهای minor عادی خراب شوند.

  ## روش مهاجرت

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Pluginهای bundled باید فراخوانی مستقیم
    `api.runtime.config.loadConfig()` و
    `api.runtime.config.writeConfigFile(...)` را متوقف کنند. configای را ترجیح دهید که
    از قبل به مسیر فراخوانی فعال پاس داده شده است. handlerهای بلندمدتی که به snapshot فرایند فعلی نیاز دارند
    می‌توانند از `api.runtime.config.current()` استفاده کنند. ابزارهای agent بلندمدت باید داخل
    `execute` از `ctx.getRuntimeConfig()` در context ابزار استفاده کنند تا ابزاری که پیش از نوشتن config ساخته شده است
    همچنان config زمان اجرای refreshشده را ببیند.

    نوشتن‌های config باید از طریق helperهای تراکنشی انجام شوند و یک سیاست پس از نوشتن انتخاب کنند:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    زمانی از `afterWrite: { mode: "restart", reason: "..." }` استفاده کنید که فراخواننده می‌داند
    تغییر به restart تمیز gateway نیاز دارد، و
    `afterWrite: { mode: "none", reason: "..." }` را فقط زمانی به کار ببرید که فراخواننده مالک
    اقدام بعدی است و عمداً می‌خواهد reload planner را سرکوب کند.
    نتیجه‌های Mutation شامل یک خلاصهٔ typed به نام `followUp` برای آزمون‌ها و logging هستند؛
    gateway همچنان مسئول اعمال یا زمان‌بندی restart باقی می‌ماند.
    `loadConfig` و `writeConfigFile` در طول پنجرهٔ مهاجرت به‌عنوان helperهای سازگاری منسوخ‌شده
    برای Pluginهای خارجی باقی می‌مانند و یک‌بار با
    کد سازگاری `runtime-config-load-write` هشدار می‌دهند. Pluginهای bundled و کد runtime مخزن
    با guardrailهای scanner در
    `pnpm check:deprecated-api-usage` و
    `pnpm check:no-runtime-action-load-config` محافظت می‌شوند: استفادهٔ جدید Plugin تولیدی
    مستقیماً fail می‌شود، نوشتن مستقیم config fail می‌شود، methodهای gateway server باید از
    snapshot زمان اجرای request استفاده کنند، helperهای runtime channel send/action/client
    باید config را از boundary خود دریافت کنند، و ماژول‌های runtime بلندمدت
    هیچ فراخوانی محیطی مجاز `loadConfig()` ندارند.

    کد Plugin جدید همچنین باید از وارد کردن barrel سازگاری گستردهٔ
    `openclaw/plugin-sdk/config-runtime` پرهیز کند. از زیرمسیر باریک SDK که با کار منطبق است استفاده کنید:

    | نیاز | وارد کردن |
    | --- | --- |
    | نوع‌های Config مانند `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | assertionهای config ازپیش‌بارگذاری‌شده و lookup config ورودی Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | خواندن snapshot زمان اجرای فعلی | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | نوشتن‌های Config | `openclaw/plugin-sdk/config-mutation` |
    | helperهای session store | `openclaw/plugin-sdk/session-store-runtime` |
    | config جدول Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | helperهای runtime سیاست گروه | `openclaw/plugin-sdk/runtime-group-policy` |
    | resolution ورودی secret | `openclaw/plugin-sdk/secret-input-runtime` |
    | overrideهای model/session | `openclaw/plugin-sdk/model-session-runtime` |

    Pluginهای bundled و آزمون‌های آن‌ها در برابر barrel گسترده با scanner محافظت می‌شوند
    تا importها و mockها محلیِ رفتاری بمانند که به آن نیاز دارند. barrel گسترده
    همچنان برای سازگاری خارجی وجود دارد، اما کد جدید نباید
    به آن وابسته باشد.

  </Step>

  <Step title="Migrate Pi tool-result extensions to middleware">
    Pluginهای bundled باید handlerهای نتیجهٔ ابزار
    `api.registerEmbeddedExtensionFactory(...)` مخصوص Pi را با
    middleware خنثی نسبت به runtime جایگزین کنند.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    هم‌زمان manifest Plugin را به‌روزرسانی کنید:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Pluginهای خارجی نمی‌توانند middleware نتیجهٔ ابزار ثبت کنند، زیرا می‌تواند
    خروجی ابزار با اعتماد بالا را پیش از اینکه model آن را ببیند بازنویسی کند.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Pluginهای channel دارای قابلیت approval اکنون رفتار approval بومی را از طریق
    `approvalCapability.nativeRuntime` به‌علاوهٔ رجیستری مشترک runtime-context ارائه می‌کنند.

    تغییرات کلیدی:

    - `approvalCapability.handler.loadRuntime(...)` را با
      `approvalCapability.nativeRuntime` جایگزین کنید
    - auth/delivery مخصوص approval را از wiring قدیمی `plugin.auth` /
      `plugin.approvals` به `approvalCapability` منتقل کنید
    - `ChannelPlugin.approvals` از قرارداد عمومی channel-plugin حذف شده است؛
      فیلدهای delivery/native/render را به `approvalCapability` منتقل کنید
    - `plugin.auth` فقط برای جریان‌های login/logout کانال باقی می‌ماند؛ hookهای auth مربوط به approval
      در آن دیگر توسط core خوانده نمی‌شوند
    - شیءهای runtime متعلق به channel مانند clientها، tokenها، یا برنامه‌های Bolt
      را از طریق `openclaw/plugin-sdk/channel-runtime-context` ثبت کنید
    - از handlerهای approval بومی، اعلان‌های reroute متعلق به Plugin ارسال نکنید؛
      اکنون core مالک اعلان‌های routed-elsewhere بر اساس نتیجه‌های واقعی delivery است
    - هنگام پاس دادن `channelRuntime` به `createChannelManager(...)`، یک سطح واقعی
      `createPluginRuntime().channel` ارائه کنید. stubهای جزئی رد می‌شوند.

    برای چینش فعلی capability مربوط به approval، `/plugins/sdk-channel-plugins` را ببینید.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    اگر Plugin شما از `openclaw/plugin-sdk/windows-spawn` استفاده می‌کند، wrapperهای Windows
    `.cmd`/`.bat` resolveنشده اکنون fail closed می‌شوند، مگر اینکه صراحتاً
    `allowShellFallback: true` را پاس بدهید.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    اگر فراخوانندهٔ شما عمداً به shell fallback متکی نیست،
    `allowShellFallback` را تنظیم نکنید و در عوض error پرتاب‌شده را مدیریت کنید.

  </Step>

  <Step title="Find deprecated imports">
    در Plugin خود برای importها از هر یک از سطح‌های منسوخ‌شده جست‌وجو کنید:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    هر export از سطح قدیمی به یک مسیر import مدرن و مشخص نگاشت می‌شود:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    برای helperهای سمت host، به‌جای import مستقیم، از runtime تزریق‌شدهٔ Plugin استفاده کنید:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    همین الگو برای helperهای bridge قدیمی دیگر هم اعمال می‌شود:

    | import قدیمی | معادل مدرن |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helperهای session store | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` همچنان برای سازگاری خارجی وجود دارد،
    اما کد جدید باید سطح helper متمرکزی را import کند که واقعاً به آن نیاز دارد:

    | نیاز | وارد کردن |
    | --- | --- |
    | helperهای صف رویداد سیستم | `openclaw/plugin-sdk/system-event-runtime` |
    | helperهای wake، event و visibility مربوط به Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | drain صف delivery معلق | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | telemetry فعالیت channel | `openclaw/plugin-sdk/channel-activity-runtime` |
    | cacheهای dedupe درون‌حافظه‌ای | `openclaw/plugin-sdk/dedupe-runtime` |
    | helperهای امن مسیر local-file/media | `openclaw/plugin-sdk/file-access-runtime` |
    | fetch آگاه از dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | helperهای proxy و fetch محافظت‌شده | `openclaw/plugin-sdk/fetch-runtime` |
    | نوع‌های سیاست dispatcher مربوط به SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | نوع‌های request/resolution مربوط به Approval | `openclaw/plugin-sdk/approval-runtime` |
    | payload پاسخ Approval و helperهای command | `openclaw/plugin-sdk/approval-reply-runtime` |
    | helperهای قالب‌بندی error | `openclaw/plugin-sdk/error-runtime` |
    | انتظارهای آماده‌بودن transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | helperهای token امن | `openclaw/plugin-sdk/secure-random-runtime` |
    | هم‌زمانی task ناهمگام محدود | `openclaw/plugin-sdk/concurrency-runtime` |
    | اجبار نوع عددی | `openclaw/plugin-sdk/number-runtime` |
    | lock ناهمگام process-local | `openclaw/plugin-sdk/async-lock-runtime` |
    | lockهای فایل | `openclaw/plugin-sdk/file-lock` |

    Pluginهای bundled در برابر `infra-runtime` با scanner محافظت می‌شوند، بنابراین کد مخزن
    نمی‌تواند دوباره به barrel گسترده برگردد.

  </Step>

  <Step title="Migrate channel route helpers">
    کد route جدید channel باید از `openclaw/plugin-sdk/channel-route` استفاده کند.
    نام‌های قدیمی‌تر route-key و comparable-target در طول پنجرهٔ مهاجرت به‌عنوان aliasهای سازگاری
    باقی می‌مانند، اما Pluginهای جدید باید از نام‌های route
    استفاده کنند که رفتار را مستقیماً توصیف می‌کنند:

    | کمک‌کننده قدیمی | کمک‌کننده مدرن |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    کمک‌کننده‌های مدرن مسیر، `{ channel, to, accountId, threadId }` را
    به‌طور سازگار در تأییدهای بومی، جلوگیری از پاسخ، حذف تکراری ورودی،
    تحویل Cron، و مسیریابی نشست عادی‌سازی می‌کنند. اگر Plugin شما مالک دستور زبان هدف
    سفارشی است، از `resolveChannelRouteTargetWithParser(...)` استفاده کنید تا آن
    parser را با همان قرارداد هدف مسیر سازگار کنید.

  </Step>

  <Step title="ساخت و آزمون">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## مرجع مسیر import

  <Accordion title="Common import path table">
  | مسیر واردسازی | هدف | خروجی‌های کلیدی |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | کمک‌تابع ورودی مرجع Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | بازصادرات چتری قدیمی برای تعریف‌ها/سازنده‌های ورودی کانال | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | خروجی شِمای پیکربندی ریشه | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | کمک‌تابع ورودی تک‌ارائه‌دهنده | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعریف‌ها و سازنده‌های متمرکز ورودی کانال | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | کمک‌تابع‌های مشترک جادوگر راه‌اندازی | اعلان‌های allowlist، سازنده‌های وضعیت راه‌اندازی |
  | `plugin-sdk/setup-runtime` | کمک‌تابع‌های runtime زمان راه‌اندازی | آداپتورهای وصله راه‌اندازی ایمن برای واردسازی، کمک‌تابع‌های یادداشت جست‌وجو، `promptResolvedAllowFrom`, `splitSetupEntries`، پراکسی‌های راه‌اندازی تفویض‌شده |
  | `plugin-sdk/setup-adapter-runtime` | نام مستعار آداپتور راه‌اندازی منسوخ | از `plugin-sdk/setup-runtime` استفاده کنید |
  | `plugin-sdk/setup-tools` | کمک‌تابع‌های ابزاردهی راه‌اندازی | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | کمک‌تابع‌های چندحسابی | کمک‌تابع‌های فهرست حساب/پیکربندی/دروازه اقدام |
  | `plugin-sdk/account-id` | کمک‌تابع‌های شناسه حساب | `DEFAULT_ACCOUNT_ID`، نرمال‌سازی شناسه حساب |
  | `plugin-sdk/account-resolution` | کمک‌تابع‌های جست‌وجوی حساب | کمک‌تابع‌های جست‌وجوی حساب + بازگشت به مقدار پیش‌فرض |
  | `plugin-sdk/account-helpers` | کمک‌تابع‌های محدود حساب | کمک‌تابع‌های فهرست حساب/اقدام حساب |
  | `plugin-sdk/channel-setup` | آداپتورهای جادوگر راه‌اندازی | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، به‌علاوه `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | مؤلفه‌های پایه جفت‌سازی DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | سیم‌کشی پیشوند پاسخ، تایپ کردن، و تحویل منبع | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | کارخانه‌های آداپتور پیکربندی و کمک‌تابع‌های دسترسی DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | سازنده‌های شِمای پیکربندی | فقط مؤلفه‌های پایه مشترک شِمای پیکربندی کانال و سازنده عمومی |
  | `plugin-sdk/bundled-channel-config-schema` | شِماهای پیکربندی باندل‌شده | فقط Pluginهای باندل‌شده نگه‌داری‌شده توسط OpenClaw؛ Pluginهای جدید باید شِماهای محلیِ Plugin را تعریف کنند |
  | `plugin-sdk/channel-config-schema-legacy` | شِماهای پیکربندی باندل‌شده منسوخ | فقط نام مستعار سازگاری؛ برای Pluginهای باندل‌شده نگه‌داری‌شده از `plugin-sdk/bundled-channel-config-schema` استفاده کنید |
  | `plugin-sdk/telegram-command-config` | کمک‌تابع‌های پیکربندی فرمان Telegram | نرمال‌سازی نام فرمان، کوتاه‌سازی توضیح، اعتبارسنجی تکرار/تداخل |
  | `plugin-sdk/channel-policy` | حل سیاست گروه/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | کمک‌تابع‌های وضعیت حساب و چرخه عمر جریان پیش‌نویس | `createAccountStatusSink`، کمک‌تابع‌های نهایی‌سازی پیش‌نمایش پیش‌نویس |
  | `plugin-sdk/inbound-envelope` | کمک‌تابع‌های پوشش ورودی | کمک‌تابع‌های مسیر مشترک + سازنده پوشش |
  | `plugin-sdk/inbound-reply-dispatch` | کمک‌تابع‌های پاسخ ورودی | کمک‌تابع‌های مشترک ثبت و ارسال |
  | `plugin-sdk/messaging-targets` | تجزیه مقصد پیام‌رسانی | کمک‌تابع‌های تجزیه/تطبیق مقصد |
  | `plugin-sdk/outbound-media` | کمک‌تابع‌های رسانه خروجی | بارگذاری رسانه خروجی مشترک |
  | `plugin-sdk/outbound-send-deps` | کمک‌تابع‌های وابستگی ارسال خروجی | جست‌وجوی سبک `resolveOutboundSendDep` بدون وارد کردن runtime کامل خروجی |
  | `plugin-sdk/outbound-runtime` | کمک‌تابع‌های runtime خروجی | کمک‌تابع‌های تحویل خروجی، نماینده هویت/ارسال، نشست، قالب‌بندی، و برنامه‌ریزی payload |
  | `plugin-sdk/thread-bindings-runtime` | کمک‌تابع‌های اتصال thread | کمک‌تابع‌های چرخه عمر اتصال thread و آداپتور |
  | `plugin-sdk/agent-media-payload` | کمک‌تابع‌های payload رسانه قدیمی | سازنده payload رسانه عامل برای چیدمان‌های فیلد قدیمی |
  | `plugin-sdk/channel-runtime` | لایه سازگاری منسوخ | فقط ابزارهای runtime کانال قدیمی |
  | `plugin-sdk/channel-send-result` | انواع نتیجه ارسال | انواع نتیجه پاسخ |
  | `plugin-sdk/runtime-store` | ذخیره‌سازی پایدار Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | کمک‌تابع‌های گسترده runtime | کمک‌تابع‌های runtime/ثبت گزارش/پشتیبان‌گیری/نصب Plugin |
  | `plugin-sdk/runtime-env` | کمک‌تابع‌های محدود محیط runtime | کمک‌تابع‌های ثبت‌کننده/محیط runtime، timeout، تلاش مجدد، و backoff |
  | `plugin-sdk/plugin-runtime` | کمک‌تابع‌های مشترک runtime Plugin | کمک‌تابع‌های فرمان‌ها/hookها/http/تعاملیِ Plugin |
  | `plugin-sdk/hook-runtime` | کمک‌تابع‌های pipeline مربوط به hook | کمک‌تابع‌های pipeline مشترک Webhook/hook داخلی |
  | `plugin-sdk/lazy-runtime` | کمک‌تابع‌های runtime تنبل | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | کمک‌تابع‌های فرایند | کمک‌تابع‌های مشترک اجرا |
  | `plugin-sdk/cli-runtime` | کمک‌تابع‌های runtime مربوط به CLI | قالب‌بندی فرمان، انتظارها، کمک‌تابع‌های نسخه |
  | `plugin-sdk/gateway-runtime` | کمک‌تابع‌های Gateway | کلاینت Gateway، کمک‌تابع شروع آماده برای حلقه رویداد، و کمک‌تابع‌های وصله وضعیت کانال |
  | `plugin-sdk/config-runtime` | لایه سازگاری پیکربندی منسوخ | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`، و `config-mutation` را ترجیح دهید |
  | `plugin-sdk/telegram-command-config` | کمک‌تابع‌های فرمان Telegram | کمک‌تابع‌های اعتبارسنجی فرمان Telegram با fallback پایدار وقتی سطح قرارداد Telegram باندل‌شده در دسترس نیست |
  | `plugin-sdk/approval-runtime` | کمک‌تابع‌های اعلان تأیید | payload تأیید اجرا/Plugin، کمک‌تابع‌های قابلیت/پروفایل تأیید، کمک‌تابع‌های مسیریابی/runtime تأیید بومی، و قالب‌بندی مسیر نمایش تأیید ساختاریافته |
  | `plugin-sdk/approval-auth-runtime` | کمک‌تابع‌های احراز هویت تأیید | حل تأییدکننده، احراز هویت اقدام در همان چت |
  | `plugin-sdk/approval-client-runtime` | کمک‌تابع‌های کلاینت تأیید | کمک‌تابع‌های پروفایل/فیلتر تأیید اجرای بومی |
  | `plugin-sdk/approval-delivery-runtime` | کمک‌تابع‌های تحویل تأیید | آداپتورهای قابلیت/تحویل تأیید بومی |
  | `plugin-sdk/approval-gateway-runtime` | کمک‌تابع‌های Gateway تأیید | کمک‌تابع مشترک حل Gateway تأیید |
  | `plugin-sdk/approval-handler-adapter-runtime` | کمک‌تابع‌های آداپتور تأیید | کمک‌تابع‌های سبک بارگذاری آداپتور تأیید بومی برای entrypointهای داغ کانال |
  | `plugin-sdk/approval-handler-runtime` | کمک‌تابع‌های handler تأیید | کمک‌تابع‌های گسترده‌تر runtime مربوط به handler تأیید؛ وقتی seamهای محدودتر آداپتور/Gateway کافی هستند، آن‌ها را ترجیح دهید |
  | `plugin-sdk/approval-native-runtime` | کمک‌تابع‌های مقصد تأیید | کمک‌تابع‌های اتصال مقصد/حساب تأیید بومی |
  | `plugin-sdk/approval-reply-runtime` | کمک‌تابع‌های پاسخ تأیید | کمک‌تابع‌های payload پاسخ تأیید اجرا/Plugin |
  | `plugin-sdk/channel-runtime-context` | کمک‌تابع‌های زمینه runtime کانال | کمک‌تابع‌های عمومی ثبت/دریافت/نظارت زمینه runtime کانال |
  | `plugin-sdk/security-runtime` | کمک‌تابع‌های امنیت | کمک‌تابع‌های مشترک اعتماد، gating مربوط به DM، فایل/مسیر محدود به ریشه، محتوای خارجی، و گردآوری راز |
  | `plugin-sdk/ssrf-policy` | کمک‌تابع‌های سیاست SSRF | کمک‌تابع‌های allowlist میزبان و سیاست شبکه خصوصی |
  | `plugin-sdk/ssrf-runtime` | کمک‌تابع‌های runtime مربوط به SSRF | dispatchکننده pinشده، fetch محافظت‌شده، کمک‌تابع‌های سیاست SSRF |
  | `plugin-sdk/system-event-runtime` | کمک‌تابع‌های رویداد سیستم | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | کمک‌تابع‌های Heartbeat | کمک‌تابع‌های بیدارباش، رویداد، و قابلیت مشاهده Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | کمک‌تابع‌های صف تحویل | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | کمک‌تابع‌های فعالیت کانال | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | کمک‌تابع‌های حذف موارد تکراری | کش‌های حذف موارد تکراری در حافظه |
  | `plugin-sdk/file-access-runtime` | کمک‌تابع‌های دسترسی فایل | کمک‌تابع‌های امن مسیر فایل/رسانه محلی |
  | `plugin-sdk/transport-ready-runtime` | کمک‌تابع‌های آمادگی transport | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | کمک‌تابع‌های کش محدود | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | کمک‌تابع‌های gating تشخیصی | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | کمک‌تابع‌های قالب‌بندی خطا | `formatUncaughtError`, `isApprovalNotFoundError`، کمک‌تابع‌های گراف خطا |
  | `plugin-sdk/fetch-runtime` | کمک‌تابع‌های fetch/پراکسی بسته‌بندی‌شده | `resolveFetch`، کمک‌تابع‌های پراکسی، کمک‌تابع‌های گزینه EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | کمک‌تابع‌های نرمال‌سازی میزبان | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | کمک‌تابع‌های تلاش مجدد | `RetryConfig`, `retryAsync`، اجراکننده‌های سیاست |
  | `plugin-sdk/allow-from` | قالب‌بندی allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | نگاشت ورودی allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | کمک‌تابع‌های gating فرمان و سطح فرمان | `resolveControlCommandGate`، کمک‌تابع‌های مجوزدهی فرستنده، کمک‌تابع‌های رجیستری فرمان شامل قالب‌بندی منوی آرگومان پویا |
  | `plugin-sdk/command-status` | رندرکننده‌های وضعیت/راهنمای فرمان | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | تجزیه ورودی راز | کمک‌تابع‌های ورودی راز |
  | `plugin-sdk/webhook-ingress` | کمک‌تابع‌های درخواست Webhook | ابزارهای مقصد Webhook |
  | `plugin-sdk/webhook-request-guards` | کمک‌تابع‌های محافظ body مربوط به Webhook | کمک‌تابع‌های خواندن/محدودسازی body درخواست |
  | `plugin-sdk/reply-runtime` | runtime مشترک پاسخ | ارسال ورودی، heartbeat، برنامه‌ریز پاسخ، تکه‌بندی |
  | `plugin-sdk/reply-dispatch-runtime` | کمک‌تابع‌های محدود ارسال پاسخ | نهایی‌سازی، ارسال ارائه‌دهنده، و کمک‌تابع‌های برچسب مکالمه |
  | `plugin-sdk/reply-history` | کمک‌تابع‌های تاریخچه پاسخ | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | برنامه‌ریزی ارجاع پاسخ | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | کمک‌تابع‌های تکه پاسخ | کمک‌تابع‌های تکه‌بندی متن/markdown |
  | `plugin-sdk/session-store-runtime` | کمک‌تابع‌های ذخیره نشست | کمک‌تابع‌های مسیر ذخیره + updated-at |
  | `plugin-sdk/state-paths` | کمک‌تابع‌های مسیر وضعیت | کمک‌تابع‌های dir مربوط به وضعیت و OAuth |
  | `plugin-sdk/routing` | کمک‌تابع‌های مسیریابی/کلید نشست | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`، کمک‌تابع‌های نرمال‌سازی کلید نشست |
  | `plugin-sdk/status-helpers` | کمک‌تابع‌های وضعیت کانال | سازنده‌های خلاصه وضعیت کانال/حساب، پیش‌فرض‌های وضعیت runtime، کمک‌تابع‌های فراداده issue |
  | `plugin-sdk/target-resolver-runtime` | کمک‌تابع‌های حل‌کننده مقصد | کمک‌تابع‌های مشترک حل‌کننده مقصد |
  | `plugin-sdk/string-normalization-runtime` | کمک‌تابع‌های نرمال‌سازی رشته | کمک‌تابع‌های نرمال‌سازی slug/رشته |
  | `plugin-sdk/request-url` | کمک‌تابع‌های URL درخواست | استخراج URLهای رشته‌ای از ورودی‌های شبیه درخواست |
  | `plugin-sdk/run-command` | کمک‌تابع‌های فرمان زمان‌دار | اجراکننده فرمان زمان‌دار با stdout/stderr نرمال‌شده |
  | `plugin-sdk/param-readers` | خواننده‌های پارامتر | خواننده‌های رایج پارامتر ابزار/CLI |
  | `plugin-sdk/tool-payload` | استخراج بار مفید ابزار | بارهای مفید نرمال‌شده را از اشیای نتیجه ابزار استخراج کنید |
  | `plugin-sdk/tool-send` | استخراج ارسال ابزار | فیلدهای هدف ارسال معیار را از آرگومان‌های ابزار استخراج کنید |
  | `plugin-sdk/temp-path` | راهنماهای مسیر موقت | راهنماهای مشترک مسیر دانلود موقت |
  | `plugin-sdk/logging-core` | راهنماهای ثبت گزارش | راهنماهای ثبت‌گر زیرسامانه و پوشاندن داده‌ها |
  | `plugin-sdk/markdown-table-runtime` | راهنماهای جدول Markdown | راهنماهای حالت جدول Markdown |
  | `plugin-sdk/reply-payload` | انواع پاسخ پیام | انواع بار مفید پاسخ |
  | `plugin-sdk/provider-setup` | راهنماهای گزینش‌شده راه‌اندازی ارائه‌دهنده محلی/خودمیزبان | راهنماهای کشف/پیکربندی ارائه‌دهنده خودمیزبان |
  | `plugin-sdk/self-hosted-provider-setup` | راهنماهای متمرکز راه‌اندازی ارائه‌دهنده خودمیزبان سازگار با OpenAI | همان راهنماهای کشف/پیکربندی ارائه‌دهنده خودمیزبان |
  | `plugin-sdk/provider-auth-runtime` | راهنماهای احراز هویت زمان اجرای ارائه‌دهنده | راهنماهای حل API-key در زمان اجرا |
  | `plugin-sdk/provider-auth-api-key` | راهنماهای راه‌اندازی API-key ارائه‌دهنده | راهنماهای آماده‌سازی اولیه/نوشتن پروفایل API-key |
  | `plugin-sdk/provider-auth-result` | راهنماهای نتیجه احراز هویت ارائه‌دهنده | سازنده استاندارد نتیجه احراز هویت OAuth |
  | `plugin-sdk/provider-selection-runtime` | راهنماهای انتخاب ارائه‌دهنده | انتخاب ارائه‌دهنده پیکربندی‌شده یا خودکار و ادغام پیکربندی خام ارائه‌دهنده |
  | `plugin-sdk/provider-env-vars` | راهنماهای متغیر محیطی ارائه‌دهنده | راهنماهای جست‌وجوی متغیر محیطی احراز هویت ارائه‌دهنده |
  | `plugin-sdk/provider-model-shared` | راهنماهای مشترک مدل/بازپخش ارائه‌دهنده | `ProviderReplayFamily`، `buildProviderReplayFamilyHooks`، `normalizeModelCompat`، سازنده‌های مشترک سیاست بازپخش، راهنماهای نقطه پایانی ارائه‌دهنده، و راهنماهای نرمال‌سازی شناسه مدل |
  | `plugin-sdk/provider-catalog-shared` | راهنماهای مشترک کاتالوگ ارائه‌دهنده | `findCatalogTemplate`، `buildSingleProviderApiKeyCatalog`، `buildManifestModelProviderConfig`، `supportsNativeStreamingUsageCompat`، `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | وصله‌های آماده‌سازی اولیه ارائه‌دهنده | راهنماهای پیکربندی آماده‌سازی اولیه |
  | `plugin-sdk/provider-http` | راهنماهای HTTP ارائه‌دهنده | راهنماهای عمومی قابلیت HTTP/نقطه پایانی ارائه‌دهنده، از جمله راهنماهای فرم چندبخشی رونویسی صوتی |
  | `plugin-sdk/provider-web-fetch` | راهنماهای واکشی وب ارائه‌دهنده | راهنماهای ثبت/کش ارائه‌دهنده واکشی وب |
  | `plugin-sdk/provider-web-search-config-contract` | راهنماهای پیکربندی جست‌وجوی وب ارائه‌دهنده | راهنماهای محدود پیکربندی/اعتبارنامه جست‌وجوی وب برای ارائه‌دهندگانی که به سیم‌کشی فعال‌سازی Plugin نیاز ندارند |
  | `plugin-sdk/provider-web-search-contract` | راهنماهای قرارداد جست‌وجوی وب ارائه‌دهنده | راهنماهای محدود قرارداد پیکربندی/اعتبارنامه جست‌وجوی وب مانند `createWebSearchProviderContractFields`، `enablePluginInConfig`، `resolveProviderWebSearchPluginConfig`، و تنظیم‌کننده‌ها/گیرنده‌های اعتبارنامه با دامنه مشخص |
  | `plugin-sdk/provider-web-search` | راهنماهای جست‌وجوی وب ارائه‌دهنده | راهنماهای ثبت/کش/زمان اجرای ارائه‌دهنده جست‌وجوی وب |
  | `plugin-sdk/provider-tools` | راهنماهای سازگاری ابزار/طرحواره ارائه‌دهنده | `ProviderToolCompatFamily`، `buildProviderToolCompatFamilyHooks`، و پاک‌سازی طرحواره Gemini + عیب‌یابی |
  | `plugin-sdk/provider-usage` | راهنماهای مصرف ارائه‌دهنده | `fetchClaudeUsage`، `fetchGeminiUsage`، `fetchGithubCopilotUsage`، و دیگر راهنماهای مصرف ارائه‌دهنده |
  | `plugin-sdk/provider-stream` | راهنماهای پوشش‌دهنده جریان ارائه‌دهنده | `ProviderStreamFamily`، `buildProviderStreamFamilyHooks`، `composeProviderStreamWrappers`، انواع پوشش‌دهنده جریان، و راهنماهای مشترک پوشش‌دهنده Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | راهنماهای انتقال ارائه‌دهنده | راهنماهای انتقال بومی ارائه‌دهنده مانند واکشی محافظت‌شده، تبدیل‌های پیام انتقال، و جریان‌های رویداد انتقال قابل نوشتن |
  | `plugin-sdk/keyed-async-queue` | صف ناهمگام مرتب | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | راهنماهای مشترک رسانه | راهنماهای واکشی/تبدیل/ذخیره رسانه، بررسی ابعاد ویدئو با پشتوانه ffprobe، و سازنده‌های بار مفید رسانه |
  | `plugin-sdk/media-generation-runtime` | راهنماهای مشترک تولید رسانه | راهنماهای مشترک جایگزینی در خرابی، انتخاب نامزد، و پیام‌رسانی مدل گم‌شده برای تولید تصویر/ویدئو/موسیقی |
  | `plugin-sdk/media-understanding` | راهنماهای فهم رسانه | انواع ارائه‌دهنده فهم رسانه به‌علاوه خروجی‌های کمکی تصویر/صوت برای ارائه‌دهنده |
  | `plugin-sdk/text-runtime` | خروجی سازگاری متنی گسترده منسوخ | از `string-coerce-runtime`، `text-chunking`، `text-utility-runtime`، و `logging-core` استفاده کنید |
  | `plugin-sdk/text-chunking` | راهنماهای قطعه‌بندی متن | راهنمای قطعه‌بندی متن خروجی |
  | `plugin-sdk/speech` | راهنماهای گفتار | انواع ارائه‌دهنده گفتار به‌علاوه راهنماهای دستورالعمل، رجیستری، اعتبارسنجی برای ارائه‌دهنده، و سازنده TTS سازگار با OpenAI |
  | `plugin-sdk/speech-core` | هسته گفتار مشترک | انواع ارائه‌دهنده گفتار، رجیستری، دستورالعمل‌ها، نرمال‌سازی |
  | `plugin-sdk/realtime-transcription` | راهنماهای رونویسی بلادرنگ | انواع ارائه‌دهنده، راهنماهای رجیستری، و راهنمای مشترک نشست WebSocket |
  | `plugin-sdk/realtime-voice` | راهنماهای صدای بلادرنگ | انواع ارائه‌دهنده، راهنماهای رجیستری/حل، راهنماهای نشست پل، صف‌های مشترک پاسخ‌گویی گفتاری عامل، سلامت رونوشت/رویداد، سرکوب اکو، و راهنماهای سریع مشورت با زمینه |
  | `plugin-sdk/image-generation` | راهنماهای تولید تصویر | انواع ارائه‌دهنده تولید تصویر به‌علاوه راهنماهای URL داده/دارایی تصویر و سازنده ارائه‌دهنده تصویر سازگار با OpenAI |
  | `plugin-sdk/image-generation-core` | هسته مشترک تولید تصویر | انواع تولید تصویر، جایگزینی در خرابی، احراز هویت، و راهنماهای رجیستری |
  | `plugin-sdk/music-generation` | راهنماهای تولید موسیقی | انواع ارائه‌دهنده/درخواست/نتیجه تولید موسیقی |
  | `plugin-sdk/music-generation-core` | هسته مشترک تولید موسیقی | انواع تولید موسیقی، راهنماهای جایگزینی در خرابی، جست‌وجوی ارائه‌دهنده، و تحلیل model-ref |
  | `plugin-sdk/video-generation` | راهنماهای تولید ویدئو | انواع ارائه‌دهنده/درخواست/نتیجه تولید ویدئو |
  | `plugin-sdk/video-generation-core` | هسته مشترک تولید ویدئو | انواع تولید ویدئو، راهنماهای جایگزینی در خرابی، جست‌وجوی ارائه‌دهنده، و تحلیل model-ref |
  | `plugin-sdk/interactive-runtime` | راهنماهای پاسخ تعاملی | نرمال‌سازی/کاهش بار مفید پاسخ تعاملی |
  | `plugin-sdk/channel-config-primitives` | اولیه‌های پیکربندی کانال | اولیه‌های محدود طرحواره پیکربندی کانال |
  | `plugin-sdk/channel-config-writes` | راهنماهای نوشتن پیکربندی کانال | راهنماهای مجوزدهی نوشتن پیکربندی کانال |
  | `plugin-sdk/channel-plugin-common` | پیش‌درآمد مشترک کانال | خروجی‌های پیش‌درآمد مشترک Plugin کانال |
  | `plugin-sdk/channel-status` | راهنماهای وضعیت کانال | راهنماهای مشترک تصویر لحظه‌ای/خلاصه وضعیت کانال |
  | `plugin-sdk/allowlist-config-edit` | راهنماهای پیکربندی فهرست مجاز | راهنماهای ویرایش/خواندن پیکربندی فهرست مجاز |
  | `plugin-sdk/group-access` | راهنماهای دسترسی گروه | راهنماهای مشترک تصمیم‌گیری دسترسی گروه |
  | `plugin-sdk/direct-dm` | راهنماهای پیام مستقیم | راهنماهای مشترک احراز هویت/محافظ پیام مستقیم |
  | `plugin-sdk/extension-shared` | راهنماهای مشترک افزونه | اولیه‌های راهنمای کانال غیرفعال/وضعیت و پروکسی محیطی |
  | `plugin-sdk/webhook-targets` | راهنماهای هدف Webhook | راهنماهای رجیستری هدف Webhook و نصب مسیر |
  | `plugin-sdk/webhook-path` | نام مستعار منسوخ مسیر Webhook | از `plugin-sdk/webhook-ingress` استفاده کنید |
  | `plugin-sdk/web-media` | راهنماهای مشترک رسانه وب | راهنماهای بارگذاری رسانه دوردست/محلی |
  | `plugin-sdk/zod` | بازصدور منسوخ سازگاری Zod | `zod` را مستقیم از `zod` وارد کنید |
  | `plugin-sdk/memory-core` | راهنماهای memory-core همراه | سطح راهنمای مدیر/پیکربندی/فایل/CLI حافظه |
  | `plugin-sdk/memory-core-engine-runtime` | نمای زمان اجرای موتور حافظه | نمای زمان اجرای نمایه‌سازی/جست‌وجوی حافظه |
  | `plugin-sdk/memory-core-host-engine-foundation` | موتور بنیاد میزبان حافظه | خروجی‌های موتور بنیاد میزبان حافظه |
  | `plugin-sdk/memory-core-host-engine-embeddings` | موتور تعبیه میزبان حافظه | قراردادهای تعبیه حافظه، دسترسی رجیستری، ارائه‌دهنده محلی، و راهنماهای عمومی دسته‌ای/دوردست؛ ارائه‌دهندگان دوردست مشخص در Pluginهای مالک خود قرار دارند |
  | `plugin-sdk/memory-core-host-engine-qmd` | موتور QMD میزبان حافظه | خروجی‌های موتور QMD میزبان حافظه |
  | `plugin-sdk/memory-core-host-engine-storage` | موتور ذخیره‌سازی میزبان حافظه | خروجی‌های موتور ذخیره‌سازی میزبان حافظه |
  | `plugin-sdk/memory-core-host-multimodal` | راهنماهای چندوجهی میزبان حافظه | راهنماهای چندوجهی میزبان حافظه |
  | `plugin-sdk/memory-core-host-query` | راهنماهای پرس‌وجوی میزبان حافظه | راهنماهای پرس‌وجوی میزبان حافظه |
  | `plugin-sdk/memory-core-host-secret` | راهنماهای راز میزبان حافظه | راهنماهای راز میزبان حافظه |
  | `plugin-sdk/memory-core-host-events` | نام مستعار منسوخ رویداد حافظه | از `plugin-sdk/memory-host-events` استفاده کنید |
  | `plugin-sdk/memory-core-host-status` | راهنماهای وضعیت میزبان حافظه | راهنماهای وضعیت میزبان حافظه |
  | `plugin-sdk/memory-core-host-runtime-cli` | زمان اجرای CLI میزبان حافظه | راهنماهای زمان اجرای CLI میزبان حافظه |
  | `plugin-sdk/memory-core-host-runtime-core` | زمان اجرای هسته میزبان حافظه | راهنماهای زمان اجرای هسته میزبان حافظه |
  | `plugin-sdk/memory-core-host-runtime-files` | راهنماهای فایل/زمان اجرای میزبان حافظه | راهنماهای فایل/زمان اجرای میزبان حافظه |
  | `plugin-sdk/memory-host-core` | نام مستعار زمان اجرای هسته میزبان حافظه | نام مستعار خنثی نسبت به فروشنده برای راهنماهای زمان اجرای هسته میزبان حافظه |
  | `plugin-sdk/memory-host-events` | نام مستعار دفتر رویداد میزبان حافظه | نام مستعار خنثی نسبت به فروشنده برای راهنماهای دفتر رویداد میزبان حافظه |
  | `plugin-sdk/memory-host-files` | نام مستعار منسوخ فایل/زمان اجرای حافظه | از `plugin-sdk/memory-core-host-runtime-files` استفاده کنید |
  | `plugin-sdk/memory-host-markdown` | راهنماهای markdown مدیریت‌شده | راهنماهای مشترک markdown مدیریت‌شده برای Pluginهای مجاور حافظه |
  | `plugin-sdk/memory-host-search` | نمای جست‌وجوی Active Memory | نمای زمان اجرای تنبل مدیر جست‌وجوی active-memory |
  | `plugin-sdk/memory-host-status` | نام مستعار منسوخ وضعیت میزبان حافظه | از `plugin-sdk/memory-core-host-status` استفاده کنید |
  | `plugin-sdk/testing` | ابزارهای کمکی آزمون | barrel سازگاری منسوخ محلی مخزن؛ از زیرمسیرهای آزمون متمرکز محلی مخزن مانند `plugin-sdk/plugin-test-runtime`، `plugin-sdk/channel-test-helpers`، `plugin-sdk/channel-target-testing`، `plugin-sdk/test-env`، و `plugin-sdk/test-fixtures` استفاده کنید |
</Accordion>

این جدول عمداً زیرمجموعهٔ مشترک مهاجرت است، نه کل سطح SDK.
فهرست نقطه‌های ورود کامپایلر در
`scripts/lib/plugin-sdk-entrypoints.json` قرار دارد؛ خروجی‌های package از
زیرمجموعهٔ عمومی تولید می‌شوند.

درزهای کمکی رزرو‌شدهٔ Pluginهای همراه، از نقشهٔ خروجی SDK عمومی بازنشسته
شده‌اند، به‌جز facadeهای سازگاری که صراحتاً مستند شده‌اند؛ مانند shim منسوخ
`plugin-sdk/discord` که برای package منتشرشدهٔ
`@openclaw/discord@2026.3.13` حفظ شده است. کمک‌کننده‌های مخصوص مالک داخل
package همان Plugin مالک قرار دارند؛ رفتار مشترک میزبان باید از طریق قراردادهای
عمومی SDK مانند `plugin-sdk/gateway-runtime`، `plugin-sdk/security-runtime`،
و `plugin-sdk/plugin-config-runtime` منتقل شود.

از محدودترین import متناسب با کار استفاده کنید. اگر خروجی‌ای پیدا نمی‌کنید،
منبع را در `src/plugin-sdk/` بررسی کنید یا از نگه‌دارندگان بپرسید کدام قرارداد
عمومی باید مالک آن باشد.

## منسوخ‌سازی‌های فعال

منسوخ‌سازی‌های محدودتری که در سراسر SDK Plugin، قرارداد provider، سطح runtime،
و manifest اعمال می‌شوند. هرکدام امروز هنوز کار می‌کنند اما در یک انتشار major
آینده حذف خواهند شد. ورودی زیر هر مورد، API قدیمی را به جایگزین canonical آن
نگاشت می‌کند.

<AccordionGroup>
  <Accordion title="سازنده‌های راهنمای command-auth → command-status">
    **قدیمی (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **جدید (`openclaw/plugin-sdk/command-status`)**: همان امضاها، همان
    خروجی‌ها - فقط از subpath محدودتر import می‌شوند. `command-auth`
    آن‌ها را به‌عنوان stubهای سازگاری دوباره export می‌کند.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="کمک‌کننده‌های گیت‌گذاری mention → resolveInboundMentionDecision">
    **قدیمی**: `resolveInboundMentionRequirement({ facts, policy })` و
    `shouldDropInboundForMention(...)` از
    `openclaw/plugin-sdk/channel-inbound` یا
    `openclaw/plugin-sdk/channel-mention-gating`.

    **جدید**: `resolveInboundMentionDecision({ facts, policy })` - به‌جای دو
    فراخوانی جدا، یک شیء تصمیم واحد برمی‌گرداند.

    Pluginهای channel پایین‌دستی (Slack، Discord، Matrix، MS Teams) قبلاً
    جابه‌جا شده‌اند.

  </Accordion>

  <Accordion title="shim runtime کانال و کمک‌کننده‌های action کانال">
    `openclaw/plugin-sdk/channel-runtime` یک shim سازگاری برای Pluginهای channel
    قدیمی‌تر است. از کد جدید آن را import نکنید؛ برای ثبت شیءهای runtime از
    `openclaw/plugin-sdk/channel-runtime-context` استفاده کنید.

    کمک‌کننده‌های `channelActions*` در `openclaw/plugin-sdk/channel-actions`
    همراه با خروجی‌های خام channel با نام "actions" منسوخ شده‌اند. قابلیت‌ها را
    به‌جای آن از طریق سطح معنایی `presentation` ارائه کنید - Pluginهای channel
    اعلام می‌کنند چه چیزی را render می‌کنند (cards، buttons، selects)، نه اینکه
    کدام نام‌های action خام را می‌پذیرند.

  </Accordion>

  <Accordion title="کمک‌کنندهٔ tool() برای provider جست‌وجوی وب → createTool() روی Plugin">
    **قدیمی**: factory با نام `tool()` از `openclaw/plugin-sdk/provider-web-search`.

    **جدید**: `createTool(...)` را مستقیماً روی provider Plugin پیاده‌سازی کنید.
    OpenClaw دیگر برای ثبت wrapper ابزار به کمک‌کنندهٔ SDK نیاز ندارد.

  </Accordion>

  <Accordion title="envelopeهای متن سادهٔ channel → BodyForAgent">
    **قدیمی**: `formatInboundEnvelope(...)` (و
    `ChannelMessageForAgent.channelEnvelope`) برای ساخت یک envelope prompt متن
    سادهٔ تخت از پیام‌های channel ورودی.

    **جدید**: `BodyForAgent` به‌همراه بلوک‌های ساختاریافتهٔ زمینهٔ کاربر.
    Pluginهای channel، metadata مسیریابی (thread، topic، reply-to، reactions)
    را به‌جای چسباندن به رشتهٔ prompt، به‌صورت فیلدهای typed متصل می‌کنند.
    کمک‌کنندهٔ `formatAgentEnvelope(...)` همچنان برای envelopeهای ساخته‌شدهٔ
    رو‌به‌دستیار پشتیبانی می‌شود، اما envelopeهای متن سادهٔ ورودی در مسیر حذف
    هستند.

    ناحیه‌های تحت تأثیر: `inbound_claim`، `message_received`، و هر Plugin
    channel سفارشی که متن `channelEnvelope` را پس‌پردازش می‌کرد.

  </Accordion>

  <Accordion title="نوع‌های کشف provider → نوع‌های catalog provider">
    چهار alias نوع کشف اکنون wrapperهای نازکی روی نوع‌های دورهٔ catalog هستند:

    | alias قدیمی              | نوع جدید                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    به‌علاوهٔ بستهٔ ایستای قدیمی `ProviderCapabilities` - Pluginهای provider
    باید به‌جای یک شیء ایستا، از hookهای صریح provider مانند
    `buildReplayPolicy`، `normalizeToolSchemas`، و `wrapStreamFn` استفاده کنند.

  </Accordion>

  <Accordion title="hookهای سیاست thinking → resolveThinkingProfile">
    **قدیمی** (سه hook جدا روی `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`، `supportsXHighThinking(ctx)`، و
    `resolveDefaultThinkingLevel(ctx)`.

    **جدید**: یک `resolveThinkingProfile(ctx)` واحد که یک
    `ProviderThinkingProfile` با `id` canonical، `label` اختیاری، و فهرست
    رتبه‌بندی‌شدهٔ سطح‌ها برمی‌گرداند. OpenClaw مقدارهای ذخیره‌شدهٔ کهنه را به
    طور خودکار بر اساس رتبهٔ profile تنزل می‌دهد.

    به‌جای سه hook، یک hook پیاده‌سازی کنید. hookهای قدیمی در بازهٔ
    منسوخ‌سازی همچنان کار می‌کنند، اما با نتیجهٔ profile ترکیب نمی‌شوند.

  </Accordion>

  <Accordion title="fallback provider احراز هویت OAuth خارجی → contracts.externalAuthProviders">
    **قدیمی**: پیاده‌سازی `resolveExternalOAuthProfiles(...)` بدون اعلام provider
    در manifest Plugin.

    **جدید**: `contracts.externalAuthProviders` را در manifest Plugin اعلام کنید
    **و** `resolveExternalAuthProfiles(...)` را پیاده‌سازی کنید. مسیر قدیمی
    "auth fallback" در runtime هشدار منتشر می‌کند و حذف خواهد شد.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="جست‌وجوی env-var برای provider → setup.providers[].envVars">
    فیلد manifest **قدیمی**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **جدید**: همان جست‌وجوی env-var را در `setup.providers[].envVars` روی
    manifest بازتاب دهید. این کار metadata محیط setup/status را در یک جا
    یکپارچه می‌کند و از راه‌اندازی runtime Plugin فقط برای پاسخ به جست‌وجوهای
    env-var جلوگیری می‌کند.

    `providerAuthEnvVars` تا پایان بازهٔ منسوخ‌سازی از طریق adapter سازگاری
    همچنان پشتیبانی می‌شود.

  </Accordion>

  <Accordion title="ثبت Plugin حافظه → registerMemoryCapability">
    **قدیمی**: سه فراخوانی جدا -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **جدید**: یک فراخوانی روی API وضعیت حافظه -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    همان slotها، یک فراخوانی ثبت واحد. کمک‌کننده‌های افزایشی حافظه
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) تحت تأثیر نیستند.

  </Accordion>

  <Accordion title="نوع‌های پیام session زیرعامل تغییر نام داده‌اند">
    دو alias نوع قدیمی هنوز از `src/plugins/runtime/types.ts` export می‌شوند:

    | قدیمی                         | جدید                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    متد runtime با نام `readSession` به نفع `getSessionMessages` منسوخ شده است.
    همان امضا؛ متد قدیمی به متد جدید فراخوانی را عبور می‌دهد.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **قدیمی**: `runtime.tasks.flow` (مفرد) یک accessor زندهٔ task-flow برمی‌گرداند.

    **جدید**: `runtime.tasks.managedFlows`، runtime جهش TaskFlow مدیریت‌شده را
    برای Pluginهایی نگه می‌دارد که از یک flow، taskهای فرزند را ایجاد، به‌روزرسانی،
    لغو، یا اجرا می‌کنند. وقتی Plugin فقط به خواندن‌های مبتنی بر DTO نیاز دارد،
    از `runtime.tasks.flows` استفاده کنید.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="factoryهای extension جاسازی‌شده → middleware نتیجهٔ ابزار عامل">
    در بخش «چگونگی مهاجرت → مهاجرت extensionهای نتیجهٔ ابزار Pi به middleware»
    در بالا پوشش داده شده است. برای کامل بودن اینجا هم آمده است: مسیر حذف‌شدهٔ
    فقط مخصوص Pi با نام `api.registerEmbeddedExtensionFactory(...)` با
    `api.registerAgentToolResultMiddleware(...)` جایگزین شده است، همراه با
    فهرست runtime صریح در `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="alias با نام OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` که از `openclaw/plugin-sdk` دوباره export می‌شود اکنون
    یک alias تک‌خطی برای `OpenClawConfig` است. نام canonical را ترجیح دهید.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
منسوخ‌سازی‌های سطح extension (داخل Pluginهای channel/provider همراه در
`extensions/`) داخل barrelهای `api.ts` و `runtime-api.ts` خودشان رهگیری
می‌شوند. آن‌ها بر قراردادهای Pluginهای شخص ثالث اثر نمی‌گذارند و اینجا فهرست
نشده‌اند. اگر barrel محلی یک Plugin همراه را مستقیماً مصرف می‌کنید، پیش از
ارتقا، commentهای منسوخ‌سازی را در همان barrel بخوانید.
</Note>

## زمان‌بندی حذف

| زمان                   | رخداد                                                                  |
| ---------------------- | ----------------------------------------------------------------------- |
| **اکنون**              | سطح‌های منسوخ‌شده هشدارهای runtime منتشر می‌کنند                       |
| **انتشار major بعدی**  | سطح‌های منسوخ‌شده حذف خواهند شد؛ Pluginهایی که هنوز از آن‌ها استفاده می‌کنند شکست می‌خورند |

همهٔ Pluginهای core قبلاً مهاجرت داده شده‌اند. Pluginهای خارجی باید پیش از
انتشار major بعدی مهاجرت کنند.

## غیرفعال کردن موقت هشدارها

هنگام کار روی مهاجرت، این متغیرهای محیطی را تنظیم کنید:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

این یک راه فرار موقت است، نه یک راه‌حل دائمی.

## مرتبط

- [شروع کار](/fa/plugins/building-plugins) - نخستین Plugin خود را بسازید
- [نمای کلی SDK](/fa/plugins/sdk-overview) - مرجع کامل importهای subpath
- [Pluginهای channel](/fa/plugins/sdk-channel-plugins) - ساخت Pluginهای channel
- [Pluginهای provider](/fa/plugins/sdk-provider-plugins) - ساخت Pluginهای provider
- [جزئیات داخلی Plugin](/fa/plugins/architecture) - بررسی عمیق معماری
- [manifest Plugin](/fa/plugins/manifest) - مرجع schema manifest
