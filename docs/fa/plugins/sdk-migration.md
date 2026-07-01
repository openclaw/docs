---
read_when:
    - هشدار OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED را می‌بینید
    - هشدار OPENCLAW_EXTENSION_API_DEPRECATED را می‌بینید
    - شما پیش از OpenClaw 2026.4.25 از api.registerEmbeddedExtensionFactory استفاده کرده‌اید.
    - شما در حال به‌روزرسانی یک Plugin به معماری مدرن Plugin هستید
    - شما یک Plugin خارجی OpenClaw را نگهداری می‌کنید
sidebarTitle: Migrate to SDK
summary: از لایهٔ قدیمیِ سازگاری با نسخه‌های پیشین به SDK مدرن Plugin مهاجرت کنید
title: مهاجرت SDK مربوط به Plugin
x-i18n:
    generated_at: "2026-07-01T13:13:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9f6f9b4334ca3bdbcc6602cfe2bb1499d5758de95a9163e0ef75619a712a1c3
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw از یک لایه گسترده سازگاری با نسخه‌های پیشین به یک معماری مدرن Plugin
با importهای متمرکز و مستند منتقل شده است. اگر Plugin شما پیش از معماری
جدید ساخته شده است، این راهنما به مهاجرت شما کمک می‌کند.

## چه چیزی در حال تغییر است

سامانه قدیمی Plugin دو سطح بسیار باز ارائه می‌کرد که به Pluginها اجازه می‌داد
هر چیزی را که نیاز داشتند از یک نقطه ورود واحد import کنند:

- **`openclaw/plugin-sdk/compat`** - یک import واحد که ده‌ها helper را دوباره
  export می‌کرد. این مورد معرفی شد تا Pluginهای قدیمی مبتنی بر hook، در زمانی
  که معماری جدید Plugin در حال ساخته‌شدن بود، همچنان کار کنند.
- **`openclaw/plugin-sdk/infra-runtime`** - یک barrel گسترده برای helperهای runtime که
  رویدادهای سامانه، وضعیت Heartbeat، صف‌های تحویل، helperهای fetch/proxy،
  helperهای فایل، انواع approval، و utilityهای نامرتبط را با هم ترکیب می‌کرد.
- **`openclaw/plugin-sdk/config-runtime`** - یک barrel گسترده سازگاری config
  که هنوز helperهای مستقیم load/write منسوخ‌شده را در بازه مهاجرت همراه دارد.
- **`openclaw/extension-api`** - پلی که به Pluginها دسترسی مستقیم به
  helperهای سمت میزبان مانند اجراکننده agent تعبیه‌شده می‌داد.
- **`api.registerEmbeddedExtensionFactory(...)`** - یک hook حذف‌شده برای extension
  bundled فقط مخصوص embedded-runner که می‌توانست رویدادهای embedded-runner مانند
  `tool_result` را مشاهده کند.

سطوح import گسترده اکنون **منسوخ** شده‌اند. آن‌ها هنوز در runtime کار می‌کنند،
اما Pluginهای جدید نباید از آن‌ها استفاده کنند، و Pluginهای موجود باید پیش از
اینکه نسخه major بعدی آن‌ها را حذف کند مهاجرت کنند. API ثبت کارخانه extension
فقط مخصوص embedded-runner حذف شده است؛ به‌جای آن از middleware نتیجه ابزار استفاده کنید.

OpenClaw رفتار مستند Plugin را در همان تغییری که جایگزین را معرفی می‌کند
حذف یا بازتفسیر نمی‌کند. تغییرات شکننده قرارداد ابتدا باید از مسیر
adapter سازگاری، diagnostics، مستندات، و یک بازه deprecation عبور کنند.
این موضوع برای importهای SDK، فیلدهای manifest، APIهای setup، hookها، و رفتار
ثبت runtime اعمال می‌شود.

<Warning>
  لایه سازگاری با نسخه‌های پیشین در یک نسخه major آینده حذف خواهد شد.
  Pluginهایی که همچنان از این سطوح import می‌کنند، هنگام وقوع آن دچار شکست خواهند شد.
  ثبت‌های قدیمی کارخانه extension تعبیه‌شده از همین حالا دیگر load نمی‌شوند.
</Warning>

## چرا این تغییر انجام شد

رویکرد قدیمی مشکلاتی ایجاد می‌کرد:

- **راه‌اندازی کند** - import کردن یک helper ده‌ها ماژول نامرتبط را load می‌کرد
- **وابستگی‌های چرخشی** - re-exportهای گسترده ایجاد چرخه‌های import را آسان می‌کردند
- **سطح API نامشخص** - راهی برای تشخیص exportهای پایدار از exportهای داخلی وجود نداشت

SDK مدرن Plugin این مشکل را برطرف می‌کند: هر مسیر import (`openclaw/plugin-sdk/\<subpath\>`)
یک ماژول کوچک و مستقل با هدف روشن و قرارداد مستند است.

درزهای convenience قدیمی provider برای کانال‌های bundled نیز حذف شده‌اند.
درزهای helper با برند channel میانبرهای خصوصی mono-repo بودند، نه قراردادهای پایدار
Plugin. به‌جای آن از subpathهای عمومی و باریک SDK استفاده کنید. درون workspace
Plugin bundled، helperهای تحت مالکیت provider را در `api.ts` یا
`runtime-api.ts` همان Plugin نگه دارید.

نمونه‌های provider bundled فعلی:

- Anthropic helperهای stream مخصوص Claude را در درز `api.ts` /
  `contract-api.ts` خودش نگه می‌دارد
- OpenAI سازنده‌های provider، helperهای مدل پیش‌فرض، و سازنده‌های provider
  realtime را در `api.ts` خودش نگه می‌دارد
- OpenRouter سازنده provider و helperهای onboarding/config را در
  `api.ts` خودش نگه می‌دارد

## برنامه مهاجرت Talk و صدای realtime

کد realtime voice، تلفن، meeting، و browser Talk از bookkeeping محلی هر سطح برای turn
به یک کنترلر مشترک session Talk منتقل می‌شود که توسط
`openclaw/plugin-sdk/realtime-voice` export می‌شود. کنترلر جدید مالک envelope
مشترک رویداد Talk، وضعیت turn فعال، وضعیت capture، وضعیت output-audio، تاریخچه
رویدادهای اخیر، و رد turnهای stale است. Pluginهای provider باید همچنان مالک
sessionهای realtime مخصوص vendor باشند؛ Pluginهای surface باید همچنان مالک capture،
playback، تلفن، و ویژگی‌های خاص meeting باشند.

این مهاجرت Talk عمداً با شکست تمیز انجام می‌شود:

1. primitiveهای مشترک controller/runtime را در
   `plugin-sdk/realtime-voice` نگه دارید.
2. سطح‌های bundled را به کنترلر مشترک منتقل کنید: browser relay،
   managed-room handoff، voice-call realtime، voice-call streaming STT، Google
   Meet realtime، و native push-to-talk.
3. خانواده‌های RPC قدیمی Talk را با API نهایی `talk.session.*` و
   `talk.client.*` جایگزین کنید.
4. یک channel زنده رویداد Talk را در
   `hello-ok.features.events` مربوط به Gateway اعلام کنید: `talk.event`.
5. endpoint قدیمی realtime HTTP و هر مسیر override دستورالعمل در زمان request را حذف کنید.

کد جدید نباید مستقیماً `createTalkEventSequencer(...)` را فراخوانی کند، مگر اینکه
در حال پیاده‌سازی یک adapter سطح پایین یا fixture تست باشد. کنترلر مشترک را ترجیح دهید
تا رویدادهای محدود به turn بدون turn id منتشر نشوند، فراخوانی‌های stale `turnEnd` /
`turnCancel` نتوانند turn فعال جدیدتر را پاک کنند، و رویدادهای چرخه عمر
output-audio در تلفن، meetingها، browser relay، managed-room handoff، و clientهای
native Talk سازگار بمانند.

شکل API عمومی هدف این است:

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
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

sessionهای WebRTC/provider-websocket تحت مالکیت browser از `talk.client.create`
استفاده می‌کنند، زیرا browser مالک negotiation با provider و transport رسانه است، در حالی که
Gateway مالک credentials، instructions، و policy ابزار است. `talk.session.*`
سطح مشترک مدیریت‌شده توسط Gateway برای gateway-relay realtime، gateway-relay
transcription، و sessionهای managed-room native STT/TTS است.

configهای قدیمی که selectorهای realtime را کنار `talk.provider` /
`talk.providers` قرار داده‌اند باید با `openclaw doctor --fix` تعمیر شوند؛ runtime Talk
config مربوط به provider گفتار/TTS را به‌عنوان config مربوط به provider realtime بازتفسیر نمی‌کند.

ترکیب‌های پشتیبانی‌شده `talk.session.create` عمداً کوچک هستند:

| حالت            | Transport       | Brain           | مالک              | یادداشت‌ها                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | صدای تمام‌دوطرفه provider از طریق Gateway پل می‌شود؛ فراخوانی‌های ابزار از طریق ابزار agent-consult مسیریابی می‌شوند.      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | فقط STT جریانی؛ فراخوان‌ها صدای ورودی می‌فرستند و رویدادهای transcript دریافت می‌کنند.                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | اتاق native/client | اتاق‌هایی به سبک push-to-talk و walkie-talkie که client مالک capture/playback است و Gateway مالک وضعیت turn است. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | اتاق native/client | حالت اتاق فقط مخصوص admin برای سطح‌های first-party مورد اعتماد که actionهای ابزار Gateway را مستقیماً اجرا می‌کنند.                  |

نگاشت methodهای حذف‌شده:

| قدیمی                              | جدید                                                      |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` یا `talk.session.cancelTurn` |
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

  | روش                            | اعمال می‌شود بر                                      | قرارداد                                                                                                                                                                                   |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | یک قطعه صوتی PCM با کدگذاری base64 را به نشست ارائه‌دهنده‌ای اضافه کنید که متعلق به همان اتصال Gateway است.                                                                              |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | یک نوبت کاربر در اتاق مدیریت‌شده را شروع کنید.                                                                                                                                           |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | نوبت فعال را پس از اعتبارسنجی نوبت منقضی‌شده پایان دهید.                                                                                                                                |
  | `talk.session.cancelTurn`       | همه نشست‌های متعلق به Gateway                          | کار فعال capture/ارائه‌دهنده/عامل/TTS را برای یک نوبت لغو کنید.                                                                                                                          |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | خروجی صوتی دستیار را بدون اینکه لزوماً نوبت کاربر پایان یابد متوقف کنید.                                                                                                                |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | یک فراخوانی ابزار ارائه‌دهنده را که relay منتشر کرده کامل کنید؛ برای خروجی موقت `options.willContinue` یا برای برآورده کردن فراخوانی بدون پاسخ دیگر از دستیار `options.suppressResponse` را پاس دهید. |
  | `talk.session.steer`            | نشست‌های Talk با پشتوانه عامل                          | کنترل گفتاری `status`، `steer`، `cancel`، یا `followup` را به اجرای جاسازی‌شده فعالی بفرستید که از نشست Talk resolve شده است.                                                           |
  | `talk.session.close`            | همه نشست‌های یکپارچه                                  | نشست‌های relay را متوقف کنید یا وضعیت اتاق مدیریت‌شده را لغو کنید، سپس شناسه نشست یکپارچه را فراموش کنید.                                                                              |

  برای کار کردن این قابلیت، موارد خاص ارائه‌دهنده یا پلتفرم را در هسته وارد نکنید.
  هسته مالک معناشناسی نشست Talk است. Pluginهای ارائه‌دهنده مالک راه‌اندازی نشست فروشنده هستند.
  تماس صوتی و Google Meet مالک آداپترهای تلفنی/جلسه هستند. مرورگر و برنامه‌های native
  مالک تجربه کاربری capture/playback دستگاه هستند.

  ## سیاست سازگاری

  برای Pluginهای خارجی، کار سازگاری به این ترتیب انجام می‌شود:

  1. قرارداد جدید را اضافه کنید
  2. رفتار قدیمی را از طریق یک آداپتر سازگاری متصل نگه دارید
  3. یک diagnostic یا هشدار منتشر کنید که مسیر قدیمی و جایگزین را نام می‌برد
  4. هر دو مسیر را در آزمون‌ها پوشش دهید
  5. deprecation و مسیر مهاجرت را مستند کنید
  6. فقط پس از بازه مهاجرت اعلام‌شده حذف کنید، معمولاً در یک انتشار اصلی

  نگه‌دارندگان می‌توانند صف مهاجرت فعلی را با
  `pnpm plugins:boundary-report` audit کنند. برای شمارش‌های فشرده از `pnpm plugins:boundary-report:summary`،
  برای یک Plugin یا مالک سازگاری از `--owner <id>`، و زمانی که یک gate CI باید روی رکوردهای
  سازگاری سررسیدشده، importهای SDK رزروشده میان‌مالک، یا زیرمسیرهای SDK رزروشده استفاده‌نشده fail شود از
  `pnpm plugins:boundary-report:ci` استفاده کنید. گزارش، رکوردهای deprecated
  سازگاری را بر اساس تاریخ حذف گروه‌بندی می‌کند، ارجاع‌های کد/مستندات محلی را می‌شمارد،
  importهای SDK رزروشده میان‌مالک را آشکار می‌کند، و پل خصوصی
  memory-host SDK را خلاصه می‌کند تا پاکسازی سازگاری به جای تکیه بر
  جست‌وجوهای موردی، صریح باقی بماند. زیرمسیرهای SDK رزروشده باید استفاده مالک ردیابی‌شده داشته باشند؛
  exportهای helper رزروشده استفاده‌نشده باید از SDK عمومی حذف شوند.

  اگر یک فیلد manifest هنوز پذیرفته می‌شود، نویسندگان Plugin می‌توانند تا زمانی که
  مستندات و diagnosticها چیز دیگری بگویند به استفاده از آن ادامه دهند. کد جدید باید جایگزین مستندشده را
  ترجیح دهد، اما Pluginهای موجود نباید در انتشارهای minor عادی
  خراب شوند.

  ## روش مهاجرت

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Pluginهای bundled باید فراخوانی مستقیم
    `api.runtime.config.loadConfig()` و
    `api.runtime.config.writeConfigFile(...)` را متوقف کنند. کانفیگی را ترجیح دهید که
    از قبل به مسیر فراخوانی فعال پاس داده شده است. handlerهای long-lived که به
    snapshot فعلی فرایند نیاز دارند می‌توانند از `api.runtime.config.current()` استفاده کنند. ابزارهای
    عامل long-lived باید داخل
    `execute` از `ctx.getRuntimeConfig()` مربوط به context ابزار استفاده کنند تا ابزاری که پیش از نوشتن کانفیگ ساخته شده، همچنان
    کانفیگ runtime تازه‌شده را ببیند.

    نوشتن کانفیگ باید از طریق helperهای transactional انجام شود و یک
    سیاست after-write انتخاب کند:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    وقتی caller می‌داند تغییر به restart تمیز gateway نیاز دارد از `afterWrite: { mode: "restart", reason: "..." }` استفاده کنید، و
    فقط وقتی caller مالک follow-up است و عمداً می‌خواهد reload planner را سرکوب کند از
    `afterWrite: { mode: "none", reason: "..." }` استفاده کنید.
    نتایج mutation شامل یک خلاصه typed به نام `followUp` برای آزمون‌ها و logging است؛
    gateway همچنان مسئول اعمال یا زمان‌بندی restart می‌ماند.
    `loadConfig` و `writeConfigFile` در بازه مهاجرت به عنوان helperهای deprecated سازگاری
    برای Pluginهای خارجی باقی می‌مانند و یک‌بار با
    کد سازگاری `runtime-config-load-write` هشدار می‌دهند. Pluginهای bundled و کد runtime
    repo با guardrailهای scanner در
    `pnpm check:deprecated-api-usage` و
    `pnpm check:no-runtime-action-load-config` محافظت می‌شوند: استفاده جدید production Plugin
    بی‌درنگ fail می‌شود، نوشتن مستقیم کانفیگ fail می‌شود، متدهای gateway server باید از
    snapshot runtime درخواست استفاده کنند، helperهای runtime channel send/action/client
    باید کانفیگ را از boundary خود دریافت کنند، و ماژول‌های runtime long-lived هیچ
    فراخوانی ambient مجاز `loadConfig()` ندارند.

    کد جدید Plugin همچنین باید از import کردن barrel گسترده سازگاری
    `openclaw/plugin-sdk/config-runtime` خودداری کند. از زیرمسیر narrow
    SDK متناسب با کار استفاده کنید:

    | نیاز | Import |
    | --- | --- |
    | نوع‌های کانفیگ مانند `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | assertionهای کانفیگ از پیش بارگذاری‌شده و lookup کانفیگ plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | خواندن snapshot فعلی runtime | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | نوشتن کانفیگ | `openclaw/plugin-sdk/config-mutation` |
    | helperهای session store | `openclaw/plugin-sdk/session-store-runtime` |
    | کانفیگ جدول Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | helperهای runtime سیاست گروه | `openclaw/plugin-sdk/runtime-group-policy` |
    | resolve کردن secret input | `openclaw/plugin-sdk/secret-input-runtime` |
    | overrideهای مدل/نشست | `openclaw/plugin-sdk/model-session-runtime` |

    Pluginهای bundled و آزمون‌هایشان با scanner در برابر barrel گسترده guard شده‌اند
    تا importها و mockها محلی و محدود به رفتاری بمانند که نیاز دارند. barrel گسترده
    هنوز برای سازگاری خارجی وجود دارد، اما کد جدید نباید
    به آن وابسته باشد.

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    Pluginهای bundled باید handlerهای tool-result
    `api.registerEmbeddedExtensionFactory(...)` مخصوص embedded-runner را با
    middleware مستقل از runtime جایگزین کنند.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    هم‌زمان manifest Plugin را به‌روزرسانی کنید:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Pluginهای نصب‌شده نیز زمانی می‌توانند middleware نتیجه ابزار را ثبت کنند که
    صراحتاً فعال شده باشند و هر runtime هدف‌گذاری‌شده را در
    `contracts.agentToolResultMiddleware` declare کنند. ثبت middleware نصب‌شده declare نشده
    رد می‌شود.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Pluginهای channel دارای قابلیت approval اکنون رفتار native approval را از طریق
    `approvalCapability.nativeRuntime` به‌همراه registry مشترک runtime-context ارائه می‌کنند.

    تغییرات کلیدی:

    - `approvalCapability.handler.loadRuntime(...)` را با
      `approvalCapability.nativeRuntime` جایگزین کنید
    - auth/delivery مخصوص approval را از wiring قدیمی `plugin.auth` /
      `plugin.approvals` به `approvalCapability` منتقل کنید
    - `ChannelPlugin.approvals` از قرارداد عمومی channel-plugin
      حذف شده است؛ فیلدهای delivery/native/render را به `approvalCapability` منتقل کنید
    - `plugin.auth` فقط برای جریان‌های login/logout channel باقی می‌ماند؛ hookهای approval auth
      آنجا دیگر توسط هسته خوانده نمی‌شوند
    - objectهای runtime متعلق به channel مانند clientها، tokenها، یا برنامه‌های Bolt
      را از طریق `openclaw/plugin-sdk/channel-runtime-context` ثبت کنید
    - از handlerهای native approval، noticeهای reroute متعلق به Plugin ارسال نکنید؛
      هسته اکنون مالک noticeهای routed-elsewhere بر اساس نتایج واقعی delivery است
    - هنگام پاس دادن `channelRuntime` به `createChannelManager(...)`، یک
      سطح واقعی `createPluginRuntime().channel` ارائه دهید. stubهای partial رد می‌شوند.

    برای layout فعلی قابلیت approval، `/plugins/sdk-channel-plugins` را ببینید.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    اگر Plugin شما از `openclaw/plugin-sdk/windows-spawn` استفاده می‌کند، wrapperهای Windows
    `.cmd`/`.bat` resolve نشده اکنون fail-closed می‌شوند مگر اینکه صراحتاً
    `allowShellFallback: true` را پاس دهید.

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

    اگر caller شما عمداً به shell fallback تکیه ندارد،
    `allowShellFallback` را تنظیم نکنید و در عوض error پرتاب‌شده را handle کنید.

  </Step>

  <Step title="Find deprecated imports">
    Plugin خود را برای import از هر یک از سطح‌های deprecated جست‌وجو کنید:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    هر export از سطح قدیمی به یک مسیر import مدرن مشخص map می‌شود:

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

    برای helperهای سمت host، به جای import مستقیم از runtime تزریق‌شده Plugin استفاده کنید:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    همین الگو برای دیگر کمک‌کننده‌های پل قدیمی هم صدق می‌کند:

    | ایمپورت قدیمی | معادل مدرن |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | کمک‌کننده‌های ذخیره‌گاه نشست | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` همچنان برای سازگاری بیرونی وجود دارد،
    اما کد جدید باید سطح کمک‌کننده‌ی متمرکزی را ایمپورت کند که واقعا به آن
    نیاز دارد:

    | نیاز | ایمپورت |
    | --- | --- |
    | کمک‌کننده‌های صف رویداد سیستم | `openclaw/plugin-sdk/system-event-runtime` |
    | کمک‌کننده‌های بیدارسازی، رویداد، و نمایانی Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | تخلیه‌ی صف تحویل‌های معلق | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | تله‌متری فعالیت کانال | `openclaw/plugin-sdk/channel-activity-runtime` |
    | کش‌های حذف تکرار در حافظه | `openclaw/plugin-sdk/dedupe-runtime` |
    | کمک‌کننده‌های امن مسیر فایل/رسانه‌ی محلی | `openclaw/plugin-sdk/file-access-runtime` |
    | fetch آگاه از dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | کمک‌کننده‌های proxy و fetch محافظت‌شده | `openclaw/plugin-sdk/fetch-runtime` |
    | انواع سیاست dispatcher برای SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | انواع درخواست/حل‌وفصل تایید | `openclaw/plugin-sdk/approval-runtime` |
    | کمک‌کننده‌های payload و فرمان پاسخ تایید | `openclaw/plugin-sdk/approval-reply-runtime` |
    | کمک‌کننده‌های قالب‌بندی خطا | `openclaw/plugin-sdk/error-runtime` |
    | انتظار برای آمادگی transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | کمک‌کننده‌های توکن امن | `openclaw/plugin-sdk/secure-random-runtime` |
    | هم‌روندی محدودشده‌ی taskهای async | `openclaw/plugin-sdk/concurrency-runtime` |
    | تبدیل عددی | `openclaw/plugin-sdk/number-runtime` |
    | قفل async محلی فرایند | `openclaw/plugin-sdk/async-lock-runtime` |
    | قفل‌های فایل | `openclaw/plugin-sdk/file-lock` |

    Pluginهای همراه با اسکنر در برابر `infra-runtime` محافظت می‌شوند، بنابراین کد repo
    نمی‌تواند دوباره به barrel گسترده برگردد.

  </Step>

  <Step title="Migrate channel route helpers">
    کد جدید route کانال باید از `openclaw/plugin-sdk/channel-route` استفاده کند.
    نام‌های قدیمی route-key و comparable-target در بازه‌ی مهاجرت به‌عنوان
    aliasهای سازگاری باقی می‌مانند، اما Pluginهای جدید باید از نام‌های route
    استفاده کنند که رفتار را مستقیم توصیف می‌کنند:

    | کمک‌کننده‌ی قدیمی | کمک‌کننده‌ی مدرن |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    کمک‌کننده‌های مدرن route، `{ channel, to, accountId, threadId }` را
    در تاییدهای native، سرکوب پاسخ، حذف تکرار ورودی، تحویل Cron، و مسیریابی
    نشست به‌صورت سازگار نرمال‌سازی می‌کنند.

    کاربردهای جدیدی از `ChannelMessagingAdapter.parseExplicitTarget` یا
    کمک‌کننده‌های loaded-route مبتنی بر parser (`parseExplicitTargetForLoadedChannel`
    یا `resolveRouteTargetForLoadedChannel`) یا
    `resolveChannelRouteTargetWithParser(...)` از `plugin-sdk/channel-route`
    اضافه نکنید. این hookها منسوخ شده‌اند و فقط برای Pluginهای قدیمی در بازه‌ی
    مهاجرت باقی می‌مانند. Pluginهای کانال جدید باید از
    `messaging.targetResolver.resolveTarget(...)` برای نرمال‌سازی شناسه‌ی target
    و fallback در نبود directory، از `messaging.inferTargetChatType(...)` زمانی
    که core به نوع peer زودهنگام نیاز دارد، و از `messaging.resolveOutboundSessionRoute(...)`
    برای هویت نشست و thread بومی provider استفاده کنند.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## مرجع مسیر ایمپورت

  <Accordion title="Common import path table">
  | مسیر import | هدف | exportهای کلیدی |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | راهنمای ورودی متعارف Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | re-export چتری قدیمی برای تعریف‌ها/سازنده‌های ورودی کانال | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | export شمای پیکربندی ریشه | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | راهنمای ورودی تک‌ارائه‌دهنده | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعریف‌ها و سازنده‌های متمرکز ورودی کانال | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | راهنماهای مشترک جادوگر راه‌اندازی | مترجم راه‌اندازی، اعلان‌های فهرست مجاز، سازنده‌های وضعیت راه‌اندازی |
  | `plugin-sdk/setup-runtime` | راهنماهای runtime هنگام راه‌اندازی | `createSetupTranslator`, آداپتورهای وصله راه‌اندازی امن برای import، راهنماهای یادداشت lookup، `promptResolvedAllowFrom`, `splitSetupEntries`, پراکسی‌های راه‌اندازی واگذارشده |
  | `plugin-sdk/setup-adapter-runtime` | نام مستعار منسوخ آداپتور راه‌اندازی | از `plugin-sdk/setup-runtime` استفاده کنید |
  | `plugin-sdk/setup-tools` | راهنماهای ابزارسازی راه‌اندازی | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | راهنماهای چندحسابی | راهنماهای فهرست حساب/پیکربندی/دروازه اقدام |
  | `plugin-sdk/account-id` | راهنماهای شناسه حساب | `DEFAULT_ACCOUNT_ID`, نرمال‌سازی شناسه حساب |
  | `plugin-sdk/account-resolution` | راهنماهای lookup حساب | راهنماهای lookup حساب + fallback پیش‌فرض |
  | `plugin-sdk/account-helpers` | راهنماهای محدود حساب | راهنماهای فهرست حساب/اقدام حساب |
  | `plugin-sdk/channel-setup` | آداپتورهای جادوگر راه‌اندازی | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, به‌علاوه `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | سازه‌های پایه جفت‌سازی DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | سیم‌کشی پیشوند پاسخ، تایپ‌کردن، و تحویل منبع | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | factoryهای آداپتور پیکربندی و راهنماهای دسترسی DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | سازنده‌های شمای پیکربندی | فقط سازه‌های پایه مشترک شمای پیکربندی کانال و سازنده عمومی |
  | `plugin-sdk/bundled-channel-config-schema` | شمای پیکربندی‌های بسته‌بندی‌شده | فقط Pluginهای بسته‌بندی‌شده نگه‌داری‌شده توسط OpenClaw؛ Pluginهای جدید باید شمای محلی Plugin را تعریف کنند |
  | `plugin-sdk/channel-config-schema-legacy` | شمای پیکربندی‌های بسته‌بندی‌شده منسوخ | فقط نام مستعار سازگاری؛ برای Pluginهای بسته‌بندی‌شده نگه‌داری‌شده از `plugin-sdk/bundled-channel-config-schema` استفاده کنید |
  | `plugin-sdk/telegram-command-config` | راهنماهای پیکربندی فرمان Telegram | نرمال‌سازی نام فرمان، کوتاه‌سازی توضیح، اعتبارسنجی تکرار/تعارض |
  | `plugin-sdk/channel-policy` | حل سیاست گروه/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | facade سازگاری منسوخ | از `plugin-sdk/channel-outbound` استفاده کنید |
  | `plugin-sdk/inbound-envelope` | راهنماهای envelope ورودی | راهنماهای مشترک route + سازنده envelope |
  | `plugin-sdk/channel-inbound` | راهنماهای دریافت ورودی | ساخت context، قالب‌بندی، ریشه‌ها، runnerها، ارسال پاسخ آماده، و گزاره‌های dispatch |
  | `plugin-sdk/messaging-targets` | مسیر import منسوخ برای parse کردن هدف | برای راهنماهای عمومی parse کردن هدف از `plugin-sdk/channel-targets`، برای مقایسه route از `plugin-sdk/channel-route`، و برای حل هدف ویژه ارائه‌دهنده از `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` متعلق به Plugin استفاده کنید |
  | `plugin-sdk/outbound-media` | راهنماهای رسانه خروجی | بارگذاری مشترک رسانه خروجی |
  | `plugin-sdk/outbound-send-deps` | facade سازگاری منسوخ | از `plugin-sdk/channel-outbound` استفاده کنید |
  | `plugin-sdk/channel-outbound` | راهنماهای چرخه عمر پیام خروجی | آداپتورهای پیام، رسیدها، راهنماهای ارسال پایدار، راهنماهای پیش‌نمایش/streaming زنده، گزینه‌های پاسخ، راهنماهای چرخه عمر، هویت خروجی، و برنامه‌ریزی payload |
  | `plugin-sdk/channel-streaming` | facade سازگاری منسوخ | از `plugin-sdk/channel-outbound` استفاده کنید |
  | `plugin-sdk/outbound-runtime` | facade سازگاری منسوخ | از `plugin-sdk/channel-outbound` استفاده کنید |
  | `plugin-sdk/thread-bindings-runtime` | راهنماهای اتصال thread | چرخه عمر اتصال thread و راهنماهای آداپتور |
  | `plugin-sdk/agent-media-payload` | راهنماهای قدیمی payload رسانه | سازنده payload رسانه agent برای چینش‌های فیلد قدیمی |
  | `plugin-sdk/channel-runtime` | shim سازگاری منسوخ | فقط ابزارهای runtime قدیمی کانال |
  | `plugin-sdk/channel-send-result` | نوع‌های نتیجه ارسال | نوع‌های نتیجه پاسخ |
  | `plugin-sdk/runtime-store` | ذخیره‌سازی پایدار Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | راهنماهای گسترده runtime | راهنماهای runtime/ثبت گزارش/پشتیبان‌گیری/نصب Plugin |
  | `plugin-sdk/runtime-env` | راهنماهای محدود env برای runtime | راهنماهای logger/env runtime، timeout، تلاش دوباره، و backoff |
  | `plugin-sdk/plugin-runtime` | راهنماهای مشترک runtime Plugin | راهنماهای فرمان‌ها/hookها/http/تعاملی Plugin |
  | `plugin-sdk/hook-runtime` | راهنماهای خط لوله hook | راهنماهای خط لوله مشترک webhook/hook داخلی |
  | `plugin-sdk/lazy-runtime` | راهنماهای runtime تنبل | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | راهنماهای فرایند | راهنماهای مشترک exec |
  | `plugin-sdk/cli-runtime` | راهنماهای runtime CLI | قالب‌بندی فرمان، waitها، راهنماهای نسخه |
  | `plugin-sdk/gateway-runtime` | راهنماهای Gateway | کلاینت Gateway، راهنمای شروع آماده برای event-loop، حل میزبان LAN اعلام‌شده، و راهنماهای وصله وضعیت کانال |
  | `plugin-sdk/config-runtime` | shim سازگاری پیکربندی منسوخ | `config-contracts`، `plugin-config-runtime`، `runtime-config-snapshot`، و `config-mutation` را ترجیح دهید |
  | `plugin-sdk/telegram-command-config` | راهنماهای فرمان Telegram | راهنماهای اعتبارسنجی فرمان Telegram با fallback پایدار، وقتی سطح قرارداد Telegram بسته‌بندی‌شده در دسترس نیست |
  | `plugin-sdk/approval-runtime` | راهنماهای اعلان تأیید | payload تأیید exec/Plugin، راهنماهای قابلیت/نمایه تأیید، راهنماهای مسیریابی/runtime تأیید بومی، و قالب‌بندی ساختاریافته مسیر نمایش تأیید |
  | `plugin-sdk/approval-auth-runtime` | راهنماهای احراز هویت تأیید | حل‌کننده تأییدکننده، احراز هویت اقدام در همان chat |
  | `plugin-sdk/approval-client-runtime` | راهنماهای کلاینت تأیید | راهنماهای نمایه/filter تأیید exec بومی |
  | `plugin-sdk/approval-delivery-runtime` | راهنماهای تحویل تأیید | آداپتورهای قابلیت/تحویل تأیید بومی |
  | `plugin-sdk/approval-gateway-runtime` | راهنماهای Gateway تأیید | راهنمای مشترک حل Gateway تأیید |
  | `plugin-sdk/approval-handler-adapter-runtime` | راهنماهای آداپتور تأیید | راهنماهای سبک‌وزن بارگذاری آداپتور تأیید بومی برای نقطه‌های ورودی داغ کانال |
  | `plugin-sdk/approval-handler-runtime` | راهنماهای handler تأیید | راهنماهای گسترده‌تر runtime برای handler تأیید؛ وقتی seamهای محدودتر آداپتور/Gateway کافی هستند، آن‌ها را ترجیح دهید |
  | `plugin-sdk/approval-native-runtime` | راهنماهای هدف تأیید | راهنماهای اتصال هدف/حساب تأیید بومی |
  | `plugin-sdk/approval-reply-runtime` | راهنماهای پاسخ تأیید | راهنماهای payload پاسخ تأیید exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | راهنماهای context runtime کانال | راهنماهای عمومی ثبت/دریافت/watch context runtime کانال |
  | `plugin-sdk/security-runtime` | راهنماهای امنیت | راهنماهای مشترک اعتماد، دروازه‌گذاری DM، فایل/مسیر محدود به ریشه، محتوای خارجی، و گردآوری secret |
  | `plugin-sdk/ssrf-policy` | راهنماهای سیاست SSRF | راهنماهای فهرست مجاز میزبان و سیاست شبکه خصوصی |
  | `plugin-sdk/ssrf-runtime` | راهنماهای runtime برای SSRF | dispatcher پین‌شده، fetch محافظت‌شده، راهنماهای سیاست SSRF |
  | `plugin-sdk/system-event-runtime` | راهنماهای رویداد سیستم | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | راهنماهای Heartbeat | راهنماهای wake، رویداد، و visibility برای Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | راهنماهای صف تحویل | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | راهنماهای فعالیت کانال | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | راهنماهای dedupe | cacheهای dedupe درون حافظه |
  | `plugin-sdk/file-access-runtime` | راهنماهای دسترسی فایل | راهنماهای امن مسیر فایل/رسانه محلی |
  | `plugin-sdk/transport-ready-runtime` | راهنماهای آمادگی transport | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | راهنماهای سیاست تأیید exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | راهنماهای cache کران‌دار | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | راهنماهای دروازه‌گذاری تشخیصی | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | راهنماهای قالب‌بندی خطا | `formatUncaughtError`, `isApprovalNotFoundError`, راهنماهای گراف خطا |
  | `plugin-sdk/fetch-runtime` | راهنماهای fetch/proxy پوشش‌داده‌شده | `resolveFetch`, راهنماهای proxy، راهنماهای گزینه EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | راهنماهای نرمال‌سازی میزبان | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | راهنماهای تلاش دوباره | `RetryConfig`, `retryAsync`, اجراکننده‌های سیاست |
  | `plugin-sdk/allow-from` | قالب‌بندی فهرست مجاز و نگاشت ورودی | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | راهنماهای دروازه‌گذاری فرمان و سطح فرمان | `resolveControlCommandGate`, راهنماهای مجوزدهی فرستنده، راهنماهای رجیستری فرمان شامل قالب‌بندی منوی آرگومان پویا |
  | `plugin-sdk/command-status` | rendererهای وضعیت/راهنمای فرمان | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | parse کردن ورودی secret | راهنماهای ورودی secret |
  | `plugin-sdk/webhook-ingress` | راهنماهای درخواست Webhook | ابزارهای هدف Webhook |
  | `plugin-sdk/webhook-request-guards` | راهنماهای guard بدنه Webhook | راهنماهای خواندن/محدودیت بدنه درخواست |
  | `plugin-sdk/reply-runtime` | runtime مشترک پاسخ | dispatch ورودی، Heartbeat، برنامه‌ریز پاسخ، chunking |
  | `plugin-sdk/reply-dispatch-runtime` | راهنماهای محدود dispatch پاسخ | نهایی‌سازی، dispatch ارائه‌دهنده، و راهنماهای برچسب مکالمه |
  | `plugin-sdk/reply-history` | راهنماهای تاریخچه پاسخ | `createChannelHistoryWindow`؛ exportهای سازگاری منسوخ راهنمای map مانند `buildPendingHistoryContextFromMap`، `recordPendingHistoryEntry`، و `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | برنامه‌ریزی ارجاع پاسخ | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | راهنماهای chunk پاسخ | راهنماهای chunking متن/markdown |
  | `plugin-sdk/session-store-runtime` | راهنماهای store نشست | راهنماهای مسیر store + updated-at |
  | `plugin-sdk/state-paths` | راهنماهای مسیر state | راهنماهای دایرکتوری state و OAuth |
  | `plugin-sdk/routing` | ابزارهای کمکی مسیریابی/کلید نشست | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`، ابزارهای کمکی نرمال‌سازی کلید نشست |
  | `plugin-sdk/status-helpers` | ابزارهای کمکی وضعیت کانال | سازنده‌های خلاصه وضعیت کانال/حساب، پیش‌فرض‌های وضعیت زمان اجرا، ابزارهای کمکی فراداده مسئله |
  | `plugin-sdk/target-resolver-runtime` | ابزارهای کمکی حل‌کننده هدف | ابزارهای کمکی مشترک حل‌کننده هدف |
  | `plugin-sdk/string-normalization-runtime` | ابزارهای کمکی نرمال‌سازی رشته | ابزارهای کمکی نرمال‌سازی slug/رشته |
  | `plugin-sdk/request-url` | ابزارهای کمکی URL درخواست | استخراج URLهای رشته‌ای از ورودی‌های شبیه درخواست |
  | `plugin-sdk/run-command` | ابزارهای کمکی فرمان زمان‌دار | اجراکننده فرمان زمان‌دار با stdout/stderr نرمال‌شده |
  | `plugin-sdk/param-readers` | خواننده‌های پارامتر | خواننده‌های رایج پارامتر ابزار/CLI |
  | `plugin-sdk/tool-payload` | استخراج بار ابزار | استخراج بارهای نرمال‌شده از اشیای نتیجه ابزار |
  | `plugin-sdk/tool-send` | استخراج ارسال ابزار | استخراج فیلدهای متعارف هدف ارسال از آرگومان‌های ابزار |
  | `plugin-sdk/temp-path` | ابزارهای کمکی مسیر موقت | ابزارهای کمکی مشترک مسیر دانلود موقت |
  | `plugin-sdk/logging-core` | ابزارهای کمکی ثبت لاگ | ثبت‌کننده زیرسامانه و ابزارهای کمکی پوشاندن داده‌های حساس |
  | `plugin-sdk/markdown-table-runtime` | ابزارهای کمکی جدول Markdown | ابزارهای کمکی حالت جدول Markdown |
  | `plugin-sdk/reply-payload` | نوع‌های پاسخ پیام | نوع‌های بار پاسخ |
  | `plugin-sdk/provider-setup` | ابزارهای کمکی گزینش‌شده راه‌اندازی ارائه‌دهنده محلی/خودمیزبان | ابزارهای کمکی کشف/پیکربندی ارائه‌دهنده خودمیزبان |
  | `plugin-sdk/self-hosted-provider-setup` | ابزارهای کمکی متمرکز راه‌اندازی ارائه‌دهنده خودمیزبان سازگار با OpenAI | همان ابزارهای کمکی کشف/پیکربندی ارائه‌دهنده خودمیزبان |
  | `plugin-sdk/provider-auth-runtime` | ابزارهای کمکی احراز هویت زمان اجرای ارائه‌دهنده | ابزارهای کمکی حل کلید API در زمان اجرا |
  | `plugin-sdk/provider-auth-api-key` | ابزارهای کمکی راه‌اندازی کلید API ارائه‌دهنده | ابزارهای کمکی راه‌اندازی اولیه/نوشتن پروفایل کلید API |
  | `plugin-sdk/provider-auth-result` | ابزارهای کمکی نتیجه احراز هویت ارائه‌دهنده | سازنده استاندارد نتیجه احراز هویت OAuth |
  | `plugin-sdk/provider-selection-runtime` | ابزارهای کمکی انتخاب ارائه‌دهنده | انتخاب ارائه‌دهنده پیکربندی‌شده یا خودکار و ادغام پیکربندی خام ارائه‌دهنده |
  | `plugin-sdk/provider-env-vars` | ابزارهای کمکی متغیرهای محیطی ارائه‌دهنده | ابزارهای کمکی جست‌وجوی متغیر محیطی احراز هویت ارائه‌دهنده |
  | `plugin-sdk/provider-model-shared` | ابزارهای کمکی مشترک مدل/بازپخش ارائه‌دهنده | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`، سازنده‌های مشترک سیاست بازپخش، ابزارهای کمکی نقطه پایانی ارائه‌دهنده، و ابزارهای کمکی نرمال‌سازی شناسه مدل |
  | `plugin-sdk/provider-catalog-shared` | ابزارهای کمکی مشترک کاتالوگ ارائه‌دهنده | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | وصله‌های راه‌اندازی اولیه ارائه‌دهنده | ابزارهای کمکی پیکربندی راه‌اندازی اولیه |
  | `plugin-sdk/provider-http` | ابزارهای کمکی HTTP ارائه‌دهنده | ابزارهای کمکی عمومی قابلیت HTTP/نقطه پایانی ارائه‌دهنده، شامل ابزارهای کمکی فرم multipart رونویسی صوتی |
  | `plugin-sdk/provider-web-fetch` | ابزارهای کمکی web-fetch ارائه‌دهنده | ابزارهای کمکی ثبت/کش ارائه‌دهنده web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | ابزارهای کمکی پیکربندی جست‌وجوی وب ارائه‌دهنده | ابزارهای کمکی محدود پیکربندی/اعتبارنامه جست‌وجوی وب برای ارائه‌دهندگانی که به اتصال‌دهی فعال‌سازی Plugin نیاز ندارند |
  | `plugin-sdk/provider-web-search-contract` | ابزارهای کمکی قرارداد جست‌وجوی وب ارائه‌دهنده | ابزارهای کمکی محدود قرارداد پیکربندی/اعتبارنامه جست‌وجوی وب مانند `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، و تنظیم‌کننده‌ها/گیرنده‌های اعتبارنامه با دامنه مشخص |
  | `plugin-sdk/provider-web-search` | ابزارهای کمکی جست‌وجوی وب ارائه‌دهنده | ابزارهای کمکی ثبت/کش/زمان اجرای ارائه‌دهنده جست‌وجوی وب |
  | `plugin-sdk/provider-tools` | ابزارهای کمکی سازگاری ابزار/اسکیمای ارائه‌دهنده | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، و پاک‌سازی اسکیمای DeepSeek/Gemini/OpenAI همراه با عیب‌یابی |
  | `plugin-sdk/provider-usage` | ابزارهای کمکی مصرف ارائه‌دهنده | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`، و دیگر ابزارهای کمکی مصرف ارائه‌دهنده |
  | `plugin-sdk/provider-stream` | ابزارهای کمکی پوشاننده جریان ارائه‌دهنده | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، نوع‌های پوشاننده جریان، و ابزارهای کمکی مشترک پوشاننده Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | ابزارهای کمکی انتقال ارائه‌دهنده | ابزارهای کمکی انتقال بومی ارائه‌دهنده مانند fetch محافظت‌شده، استخراج متن نتیجه ابزار، تبدیل‌های پیام انتقال، و جریان‌های رویداد انتقال قابل‌نوشتن |
  | `plugin-sdk/keyed-async-queue` | صف async مرتب | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | ابزارهای کمکی مشترک رسانه | ابزارهای کمکی دریافت/تبدیل/ذخیره رسانه، بررسی ابعاد ویدئو با پشتوانه ffprobe، و سازنده‌های بار رسانه |
  | `plugin-sdk/media-generation-runtime` | ابزارهای کمکی مشترک تولید رسانه | ابزارهای کمکی مشترک failover، انتخاب نامزد، و پیام‌رسانی مدلِ ازدست‌رفته برای تولید تصویر/ویدئو/موسیقی |
  | `plugin-sdk/media-understanding` | ابزارهای کمکی فهم رسانه | نوع‌های ارائه‌دهنده فهم رسانه به‌همراه خروجی‌های ابزار کمکی تصویر/صوت برای ارائه‌دهنده |
  | `plugin-sdk/text-runtime` | خروجی گسترده منسوخ سازگاری متن | از `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`، و `logging-core` استفاده کنید |
  | `plugin-sdk/text-chunking` | ابزارهای کمکی تکه‌بندی متن | ابزار کمکی تکه‌بندی متن خروجی |
  | `plugin-sdk/speech` | ابزارهای کمکی گفتار | نوع‌های ارائه‌دهنده گفتار به‌همراه ابزارهای کمکی دستورالعمل، رجیستری، اعتبارسنجی برای ارائه‌دهنده، و سازنده TTS سازگار با OpenAI |
  | `plugin-sdk/speech-core` | هسته مشترک گفتار | نوع‌های ارائه‌دهنده گفتار، رجیستری، دستورالعمل‌ها، نرمال‌سازی |
  | `plugin-sdk/realtime-transcription` | ابزارهای کمکی رونویسی بی‌درنگ | نوع‌های ارائه‌دهنده، ابزارهای کمکی رجیستری، و ابزار کمکی مشترک نشست WebSocket |
  | `plugin-sdk/realtime-voice` | ابزارهای کمکی صدای بی‌درنگ | نوع‌های ارائه‌دهنده، ابزارهای کمکی رجیستری/حل، ابزارهای کمکی نشست پل، صف‌های مشترک پاسخ‌گویی صوتی عامل، کنترل صوتی اجرای فعال، سلامت رونوشت/رویداد، سرکوب اکو، تطبیق پرسش مشاوره، هماهنگی مشاوره اجباری، ردیابی زمینه نوبت، ردیابی فعالیت خروجی، و ابزارهای کمکی سریع مشاوره زمینه |
  | `plugin-sdk/image-generation` | ابزارهای کمکی تولید تصویر | نوع‌های ارائه‌دهنده تولید تصویر به‌همراه ابزارهای کمکی URL داده/دارایی تصویر و سازنده ارائه‌دهنده تصویر سازگار با OpenAI |
  | `plugin-sdk/image-generation-core` | هسته مشترک تولید تصویر | نوع‌های تولید تصویر، failover، احراز هویت، و ابزارهای کمکی رجیستری |
  | `plugin-sdk/music-generation` | ابزارهای کمکی تولید موسیقی | نوع‌های ارائه‌دهنده/درخواست/نتیجه تولید موسیقی |
  | `plugin-sdk/music-generation-core` | هسته مشترک تولید موسیقی | نوع‌های تولید موسیقی، ابزارهای کمکی failover، جست‌وجوی ارائه‌دهنده، و تجزیه ارجاع مدل |
  | `plugin-sdk/video-generation` | ابزارهای کمکی تولید ویدئو | نوع‌های ارائه‌دهنده/درخواست/نتیجه تولید ویدئو |
  | `plugin-sdk/video-generation-core` | هسته مشترک تولید ویدئو | نوع‌های تولید ویدئو، ابزارهای کمکی failover، جست‌وجوی ارائه‌دهنده، و تجزیه ارجاع مدل |
  | `plugin-sdk/interactive-runtime` | ابزارهای کمکی پاسخ تعاملی | نرمال‌سازی/کاهش بار پاسخ تعاملی |
  | `plugin-sdk/channel-config-primitives` | اجزای پایه پیکربندی کانال | اجزای پایه محدود اسکیمای پیکربندی کانال |
  | `plugin-sdk/channel-config-writes` | ابزارهای کمکی نوشتن پیکربندی کانال | ابزارهای کمکی مجوزدهی نوشتن پیکربندی کانال |
  | `plugin-sdk/channel-plugin-common` | پیش‌درآمد مشترک کانال | خروجی‌های مشترک پیش‌درآمد Plugin کانال |
  | `plugin-sdk/channel-status` | ابزارهای کمکی وضعیت کانال | ابزارهای کمکی مشترک تصویر لحظه‌ای/خلاصه وضعیت کانال |
  | `plugin-sdk/allowlist-config-edit` | ابزارهای کمکی پیکربندی allowlist | ابزارهای کمکی ویرایش/خواندن پیکربندی allowlist |
  | `plugin-sdk/group-access` | ابزارهای کمکی دسترسی گروه | ابزارهای کمکی مشترک تصمیم‌گیری دسترسی گروه |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | نماهای سازگاری منسوخ | از `plugin-sdk/channel-inbound` استفاده کنید |
  | `plugin-sdk/direct-dm-guard-policy` | ابزارهای کمکی محافظ Direct-DM | ابزارهای کمکی محدود سیاست محافظ پیش از رمزنگاری |
  | `plugin-sdk/extension-shared` | ابزارهای کمکی مشترک افزونه | اجزای پایه کانال منفعل/وضعیت و ابزار کمکی پراکسی محیطی |
  | `plugin-sdk/webhook-targets` | ابزارهای کمکی هدف Webhook | رجیستری هدف Webhook و ابزارهای کمکی نصب مسیر |
  | `plugin-sdk/webhook-path` | نام مستعار منسوخ مسیر Webhook | از `plugin-sdk/webhook-ingress` استفاده کنید |
  | `plugin-sdk/web-media` | ابزارهای کمکی مشترک رسانه وب | ابزارهای کمکی بارگذاری رسانه راه‌دور/محلی |
  | `plugin-sdk/zod` | بازصدور منسوخ سازگاری Zod | `zod` را مستقیما از `zod` وارد کنید |
  | `plugin-sdk/memory-core` | ابزارهای کمکی همراه memory-core | سطح ابزار کمکی مدیر حافظه/پیکربندی/فایل/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | نمای زمان اجرای موتور حافظه | نمای زمان اجرای نمایه‌سازی/جست‌وجوی حافظه |
  | `plugin-sdk/memory-core-host-embedding-registry` | رجیستری embedding حافظه | ابزارهای کمکی سبک رجیستری ارائه‌دهنده embedding حافظه |
  | `plugin-sdk/memory-core-host-engine-foundation` | موتور بنیاد میزبان حافظه | خروجی‌های موتور بنیاد میزبان حافظه |
  | `plugin-sdk/memory-core-host-engine-embeddings` | موتور embedding میزبان حافظه | قراردادهای embedding حافظه، دسترسی رجیستری، ارائه‌دهنده محلی، و ابزارهای کمکی عمومی دسته‌ای/راه‌دور؛ ارائه‌دهندگان راه‌دور مشخص در Pluginهای مالک خودشان قرار دارند |
  | `plugin-sdk/memory-core-host-engine-qmd` | موتور QMD میزبان حافظه | خروجی‌های موتور QMD میزبان حافظه |
  | `plugin-sdk/memory-core-host-engine-storage` | موتور ذخیره‌سازی میزبان حافظه | خروجی‌های موتور ذخیره‌سازی میزبان حافظه |
  | `plugin-sdk/memory-core-host-multimodal` | ابزارهای کمکی چندوجهی میزبان حافظه | ابزارهای کمکی چندوجهی میزبان حافظه |
  | `plugin-sdk/memory-core-host-query` | ابزارهای کمکی پرس‌وجوی میزبان حافظه | ابزارهای کمکی پرس‌وجوی میزبان حافظه |
  | `plugin-sdk/memory-core-host-secret` | ابزارهای کمکی محرمانه میزبان حافظه | ابزارهای کمکی محرمانه میزبان حافظه |
  | `plugin-sdk/memory-core-host-events` | نام مستعار منسوخ رویداد حافظه | از `plugin-sdk/memory-host-events` استفاده کنید |
  | `plugin-sdk/memory-core-host-status` | ابزارهای کمکی وضعیت میزبان حافظه | ابزارهای کمکی وضعیت میزبان حافظه |
  | `plugin-sdk/memory-core-host-runtime-cli` | زمان اجرای CLI میزبان حافظه | ابزارهای کمکی زمان اجرای CLI میزبان حافظه |
  | `plugin-sdk/memory-core-host-runtime-core` | زمان اجرای هسته میزبان حافظه | ابزارهای کمکی زمان اجرای هسته میزبان حافظه |
  | `plugin-sdk/memory-core-host-runtime-files` | ابزارهای کمکی فایل/زمان اجرای میزبان حافظه | ابزارهای کمکی فایل/زمان اجرای میزبان حافظه |
  | `plugin-sdk/memory-host-core` | نام مستعار زمان اجرای هسته میزبان حافظه | نام مستعار بی‌طرف نسبت به فروشنده برای ابزارهای کمکی زمان اجرای هسته میزبان حافظه |
  | `plugin-sdk/memory-host-events` | نام مستعار ژورنال رویداد میزبان حافظه | نام مستعار بی‌طرف نسبت به فروشنده برای ابزارهای کمکی ژورنال رویداد میزبان حافظه |
  | `plugin-sdk/memory-host-files` | نام مستعار منسوخ فایل/زمان اجرای حافظه | از `plugin-sdk/memory-core-host-runtime-files` استفاده کنید |
  | `plugin-sdk/memory-host-markdown` | ابزارهای کمکی markdown مدیریت‌شده | ابزارهای کمکی مشترک markdown مدیریت‌شده برای Pluginهای مجاور حافظه |
  | `plugin-sdk/memory-host-search` | نمای جست‌وجوی Active Memory | نمای زمان اجرای تنبل مدیر جست‌وجوی Active Memory |
  | `plugin-sdk/memory-host-status` | نام مستعار منسوخ وضعیت میزبان حافظه | از `plugin-sdk/memory-core-host-status` استفاده کنید |
  | `plugin-sdk/testing` | ابزارهای آزمایش | barrel سازگاری منسوخ محلی repo؛ از زیرمسیرهای آزمایشی متمرکز و محلی repo مانند `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`، و `plugin-sdk/test-fixtures` استفاده کنید |
</Accordion>

این جدول عمداً زیرمجموعهٔ مشترک مهاجرت است، نه کل سطح SDK.
فهرست entrypoint کامپایلر در
`scripts/lib/plugin-sdk-entrypoints.json` قرار دارد؛ خروجی‌های بسته از
زیرمجموعهٔ عمومی تولید می‌شوند.

درزهای کمکی رزروشده برای Pluginهای بسته‌بندی‌شده، به‌جز نماهای سازگاری
مستندشدهٔ صریح مانند shim منسوخ‌شدهٔ `plugin-sdk/discord` که برای بستهٔ منتشرشدهٔ
`@openclaw/discord@2026.3.13` نگه داشته شده، از نقشهٔ خروجی عمومی SDK
بازنشسته شده‌اند. کمک‌رسان‌های ویژهٔ مالک داخل بستهٔ Plugin مالک قرار دارند؛
رفتار مشترک میزبان باید از طریق قراردادهای عمومی SDK مانند
`plugin-sdk/gateway-runtime`، `plugin-sdk/security-runtime` و
`plugin-sdk/plugin-config-runtime` منتقل شود.

باریک‌ترین import متناسب با کار را به‌کار ببرید. اگر خروجی‌ای پیدا نمی‌کنید،
منبع را در `src/plugin-sdk/` بررسی کنید یا از نگه‌دارندگان بپرسید کدام قرارداد
عمومی باید مالک آن باشد.

## منسوخ‌سازی‌های فعال

منسوخ‌سازی‌های محدودتری که در سراسر SDK Plugin، قرارداد ارائه‌دهنده،
سطح زمان اجرا و مانیفست اعمال می‌شوند. هرکدام امروز هنوز کار می‌کنند اما در
یک انتشار major آینده حذف خواهند شد. ورودی زیر هر مورد API قدیمی را به
جایگزین canonical آن نگاشت می‌کند.

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **قدیمی (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`، `buildHelpMessage`.

    **جدید (`openclaw/plugin-sdk/command-status`)**: همان امضاها، همان
    خروجی‌ها - فقط از زیرمسیر باریک‌تر import می‌شوند. `command-auth`
    آن‌ها را به‌عنوان stubهای سازگاری دوباره export می‌کند.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helpers → resolveInboundMentionDecision">
    **قدیمی**: `resolveInboundMentionRequirement({ facts, policy })` و
    `shouldDropInboundForMention(...)` از
    `openclaw/plugin-sdk/channel-inbound` یا
    `openclaw/plugin-sdk/channel-mention-gating`.

    **جدید**: `resolveInboundMentionDecision({ facts, policy })` - به‌جای دو
    فراخوانی جدا، یک شیء تصمیم واحد برمی‌گرداند.

    Pluginهای کانال پایین‌دستی (Slack، Discord، Matrix، MS Teams) پیش‌تر
    مهاجرت کرده‌اند.

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` یک shim سازگاری برای Pluginهای کانال
    قدیمی‌تر است. آن را از کد جدید import نکنید؛ برای ثبت اشیای زمان اجرا از
    `openclaw/plugin-sdk/channel-runtime-context` استفاده کنید.

    کمک‌رسان‌های `channelActions*` در `openclaw/plugin-sdk/channel-actions`
    همراه با خروجی‌های خام «actions» کانال منسوخ شده‌اند. قابلیت‌ها را به‌جای
    آن از طریق سطح معنایی `presentation` ارائه کنید - Pluginهای کانال اعلام
    می‌کنند چه چیزهایی را رندر می‌کنند (کارت‌ها، دکمه‌ها، انتخاب‌گرها)، نه
    اینکه کدام نام‌های action خام را می‌پذیرند.

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **قدیمی**: factory `tool()` از `openclaw/plugin-sdk/provider-web-search`.

    **جدید**: `createTool(...)` را مستقیماً روی Plugin ارائه‌دهنده پیاده‌سازی
    کنید. OpenClaw دیگر برای ثبت wrapper ابزار به کمک‌رسان SDK نیاز ندارد.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **قدیمی**: `formatInboundEnvelope(...)` (و
    `ChannelMessageForAgent.channelEnvelope`) برای ساختن یک envelope prompt
    متن سادهٔ تخت از پیام‌های ورودی کانال.

    **جدید**: `BodyForAgent` به‌همراه بلوک‌های ساختاریافتهٔ زمینهٔ کاربر.
    Pluginهای کانال فرادادهٔ مسیریابی (رشته، موضوع، پاسخ‌به، واکنش‌ها) را
    به‌جای چسباندن آن‌ها به یک رشتهٔ prompt، به‌صورت فیلدهای typed پیوست
    می‌کنند. کمک‌رسان `formatAgentEnvelope(...)` همچنان برای envelopeهای
    ساخته‌شدهٔ رو به دستیار پشتیبانی می‌شود، اما envelopeهای ورودی متن ساده
    در مسیر حذف هستند.

    نواحی تحت تأثیر: `inbound_claim`، `message_received`، و هر Plugin کانال
    سفارشی که متن `channelEnvelope` را پس‌پردازش می‌کرد.

  </Accordion>

  <Accordion title="deactivate hook → gateway_stop">
    **قدیمی**: `api.on("deactivate", handler)`.

    **جدید**: `api.on("gateway_stop", handler)`. رویداد و زمینه همان قرارداد
    پاک‌سازی هنگام خاموشی هستند؛ فقط نام قلاب تغییر می‌کند.

    ```typescript
    // Before
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // After
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` تا پس از 2026-08-16 به‌عنوان alias سازگاری منسوخ‌شده متصل
    باقی می‌ماند.

  </Accordion>

  <Accordion title="subagent_spawning hook → core thread binding">
    **قدیمی**: `api.on("subagent_spawning", handler)` که
    `threadBindingReady` یا `deliveryOrigin` برمی‌گرداند.

    **جدید**: اجازه دهید هسته bindingهای زیرعامل `thread: true` را از طریق
    adapter اتصال نشست کانال آماده کند. از
    `api.on("subagent_spawned", handler)` فقط برای مشاهدهٔ پس از راه‌اندازی
    استفاده کنید.

    ```typescript
    // Before
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // After
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`، `PluginHookSubagentSpawningEvent`،
    `PluginHookSubagentSpawningResult` و
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` فقط به‌عنوان
    سطوح سازگاری منسوخ‌شده باقی می‌مانند تا Pluginهای خارجی مهاجرت کنند.

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    چهار alias نوع discovery اکنون wrapperهای نازکی روی نوع‌های دورهٔ catalog
    هستند:

    | alias قدیمی               | نوع جدید                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    به‌علاوهٔ کیسهٔ static قدیمی `ProviderCapabilities` - Pluginهای ارائه‌دهنده
    باید به‌جای یک شیء static، از قلاب‌های صریح ارائه‌دهنده مانند
    `buildReplayPolicy`، `normalizeToolSchemas` و `wrapStreamFn` استفاده کنند.

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **قدیمی** (سه قلاب جداگانه روی `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`، `supportsXHighThinking(ctx)` و
    `resolveDefaultThinkingLevel(ctx)`.

    **جدید**: یک `resolveThinkingProfile(ctx)` واحد که یک
    `ProviderThinkingProfile` با `id` canonical، `label` اختیاری و فهرست
    سطح‌های رتبه‌بندی‌شده برمی‌گرداند. OpenClaw مقدارهای ذخیره‌شدهٔ کهنه را
    به‌صورت خودکار بر اساس رتبهٔ profile تنزل می‌دهد.

    زمینه شامل `provider`، `modelId`، `reasoning` ادغام‌شدهٔ اختیاری و
    واقعیت‌های `compat` مدل ادغام‌شدهٔ اختیاری است. Pluginهای ارائه‌دهنده
    می‌توانند از آن واقعیت‌های catalog استفاده کنند تا فقط وقتی قرارداد
    درخواست پیکربندی‌شده پشتیبانی می‌کند، profile ویژهٔ مدل را ارائه دهند.

    به‌جای سه قلاب، یک قلاب پیاده‌سازی کنید. قلاب‌های قدیمی در طول بازهٔ
    منسوخ‌سازی همچنان کار می‌کنند اما با نتیجهٔ profile ترکیب نمی‌شوند.

  </Accordion>

  <Accordion title="External auth providers → contracts.externalAuthProviders">
    **قدیمی**: پیاده‌سازی قلاب‌های احراز هویت خارجی بدون اعلام ارائه‌دهنده
    در مانیفست Plugin.

    **جدید**: `contracts.externalAuthProviders` را در مانیفست Plugin اعلام
    کنید **و** `resolveExternalAuthProfiles(...)` را پیاده‌سازی کنید.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    فیلد مانیفست **قدیمی**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **جدید**: همان lookup متغیر محیطی را در `setup.providers[].envVars`
    روی مانیفست بازتاب دهید. این کار فرادادهٔ محیط setup/status را در یک
    مکان تجمیع می‌کند و از راه‌اندازی زمان اجرای Plugin فقط برای پاسخ به
    lookupهای متغیر محیطی جلوگیری می‌کند.

    `providerAuthEnvVars` تا بسته‌شدن بازهٔ منسوخ‌سازی از طریق یک adapter
    سازگاری پشتیبانی می‌شود.

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **قدیمی**: سه فراخوانی جداگانه -
    `api.registerMemoryPromptSection(...)`،
    `api.registerMemoryFlushPlan(...)`،
    `api.registerMemoryRuntime(...)`.

    **جدید**: یک فراخوانی روی API وضعیت حافظه -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    همان slotها، یک فراخوانی ثبت. کمک‌رسان‌های افزایشی prompt و corpus
    (`registerMemoryPromptSupplement`، `registerMemoryCorpusSupplement`)
    تحت تأثیر نیستند.

  </Accordion>

  <Accordion title="Memory embedding provider API">
    **قدیمی**: `api.registerMemoryEmbeddingProvider(...)` به‌همراه
    `contracts.memoryEmbeddingProviders`.

    **جدید**: `api.registerEmbeddingProvider(...)` به‌همراه
    `contracts.embeddingProviders`.

    قرارداد عمومی ارائه‌دهندهٔ embedding بیرون از memory هم قابل استفادهٔ
    دوباره است و مسیر پشتیبانی‌شده برای ارائه‌دهندگان جدید محسوب می‌شود.
    API ثبت ویژهٔ memory تا زمان مهاجرت ارائه‌دهندگان موجود، به‌عنوان
    سازگاری منسوخ‌شده همچنان متصل باقی می‌ماند. گزارش‌های بازرسی Plugin
    استفادهٔ غیربسته‌بندی‌شده را به‌عنوان بدهی سازگاری گزارش می‌کنند.

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    دو alias نوع legacy که همچنان از `src/plugins/runtime/types.ts` صادر
    می‌شوند:

    | قدیمی                         | جدید                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    متد زمان اجرای `readSession` به نفع `getSessionMessages` منسوخ شده است.
    همان امضا را دارد؛ متد قدیمی فراخوانی را به متد جدید عبور می‌دهد.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **قدیمی**: `runtime.tasks.flow` (مفرد) یک accessor زندهٔ task-flow
    برمی‌گرداند.

    **جدید**: `runtime.tasks.managedFlows` زمان اجرای mutation مدیریت‌شدهٔ
    TaskFlow را برای Pluginهایی نگه می‌دارد که taskهای فرزند را از یک flow
    ایجاد، به‌روزرسانی، لغو یا اجرا می‌کنند. وقتی Plugin فقط به خواندن‌های
    مبتنی بر DTO نیاز دارد، از `runtime.tasks.flows` استفاده کنید.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    در بخش «نحوهٔ مهاجرت → مهاجرت extensionهای tool-result جاسازی‌شده به
    middleware» در بالا پوشش داده شده است. برای کامل‌بودن در اینجا هم آمده:
    مسیر حذف‌شدهٔ فقط مخصوص runner جاسازی‌شده
    `api.registerEmbeddedExtensionFactory(...)` با
    `api.registerAgentToolResultMiddleware(...)` و یک فهرست زمان اجرای صریح
    در `contracts.agentToolResultMiddleware` جایگزین شده است.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `OpenClawSchemaType` که از `openclaw/plugin-sdk` دوباره صادر می‌شود،
    اکنون یک alias تک‌خطی برای `OpenClawConfig` است. نام canonical را ترجیح
    دهید.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
منسوخ‌سازی‌های سطح extension (داخل Pluginهای کانال/ارائه‌دهندهٔ بسته‌بندی‌شده
زیر `extensions/`) داخل barrelهای `api.ts` و `runtime-api.ts` خودشان ردیابی
می‌شوند. آن‌ها روی قراردادهای Plugin شخص ثالث اثر نمی‌گذارند و اینجا فهرست
نشده‌اند. اگر barrel محلی یک Plugin بسته‌بندی‌شده را مستقیماً مصرف می‌کنید،
پیش از ارتقا، توضیح‌های منسوخ‌سازی را در همان barrel بخوانید.
</Note>

## جدول زمانی حذف

| چه زمانی               | چه اتفاقی می‌افتد                                                        |
| ---------------------- | ----------------------------------------------------------------------- |
| **اکنون**              | سطوح منسوخ‌شده هشدارهای زمان اجرا صادر می‌کنند                          |
| **انتشار اصلی بعدی**   | سطوح منسوخ‌شده حذف خواهند شد؛ Pluginهایی که همچنان از آن‌ها استفاده می‌کنند شکست خواهند خورد |

همه Pluginهای هسته از قبل مهاجرت داده شده‌اند. Pluginهای خارجی باید
پیش از انتشار اصلی بعدی مهاجرت کنند.

## غیرفعال کردن موقت هشدارها

هنگام کار روی مهاجرت، این متغیرهای محیطی را تنظیم کنید:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

این یک راه گریز موقت است، نه یک راه‌حل دائمی.

## مرتبط

- [شروع کار](/fa/plugins/building-plugins) - نخستین Plugin خود را بسازید
- [نمای کلی SDK](/fa/plugins/sdk-overview) - مرجع کامل import زیرمسیرها
- [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) - ساخت Pluginهای کانال
- [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) - ساخت Pluginهای ارائه‌دهنده
- [درون‌ساخت Plugin](/fa/plugins/architecture) - بررسی عمیق معماری
- [مانیفست Plugin](/fa/plugins/manifest) - مرجع طرح‌واره مانیفست
