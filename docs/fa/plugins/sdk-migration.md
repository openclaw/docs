---
read_when:
    - هشدار OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED را مشاهده می‌کنید
    - هشدار OPENCLAW_EXTENSION_API_DEPRECATED را می‌بینید
    - پیش از OpenClaw 2026.4.25 از api.registerEmbeddedExtensionFactory استفاده می‌کردید
    - شما در حال به‌روزرسانی یک Plugin به معماری مدرن Plugin هستید
    - شما یک Plugin خارجی OpenClaw را نگهداری می‌کنید
sidebarTitle: Migrate to SDK
summary: از لایهٔ قدیمی سازگاری عقب‌رو به SDK مدرن Plugin مهاجرت کنید
title: مهاجرت Plugin SDK
x-i18n:
    generated_at: "2026-07-01T08:23:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f05bd42cc0a6fc53f6670377b4330bb452b2a06f4d0542a494875970ee81e08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw از یک لایه گسترده سازگاری با نسخه‌های قبلی به یک معماری مدرن Plugin
با importهای متمرکز و مستند منتقل شده است. اگر Plugin شما پیش از معماری
جدید ساخته شده، این راهنما به شما کمک می‌کند آن را مهاجرت دهید.

## چه چیزی تغییر می‌کند

سیستم قدیمی Plugin دو سطح بسیار باز فراهم می‌کرد که به Pluginها اجازه می‌داد
هر چیزی را که نیاز داشتند از یک نقطه ورود واحد import کنند:

- **`openclaw/plugin-sdk/compat`** - یک import واحد که ده‌ها helper را دوباره
  export می‌کرد. این سطح برای فعال نگه داشتن Pluginهای قدیمی مبتنی بر hook
  در زمانی معرفی شد که معماری جدید Plugin در حال ساخت بود.
- **`openclaw/plugin-sdk/infra-runtime`** - یک barrel گسترده از helperهای runtime
  که رویدادهای سیستم، وضعیت heartbeat، صف‌های تحویل، helperهای fetch/proxy،
  helperهای فایل، نوع‌های تأیید، و ابزارهای نامرتبط را با هم ترکیب می‌کرد.
- **`openclaw/plugin-sdk/config-runtime`** - یک barrel گسترده سازگاری config
  که هنوز در طول بازه مهاجرت، helperهای مستقیم load/write منسوخ‌شده را همراه دارد.
- **`openclaw/extension-api`** - پلی که به Pluginها دسترسی مستقیم به
  helperهای سمت میزبان، مانند اجراکننده agent تعبیه‌شده، می‌داد.
- **`api.registerEmbeddedExtensionFactory(...)`** - یک hook افزونه bundled
  مخصوص embedded-runner که حذف شده و می‌توانست رویدادهای embedded-runner مانند
  `tool_result` را مشاهده کند.

سطوح گسترده import اکنون **منسوخ** شده‌اند. آن‌ها هنوز در runtime کار می‌کنند،
اما Pluginهای جدید نباید از آن‌ها استفاده کنند، و Pluginهای موجود باید پیش از
آنکه نسخه major بعدی آن‌ها را حذف کند مهاجرت کنند. API ثبت factory افزونه
مخصوص embedded-runner حذف شده است؛ به‌جای آن از middleware نتیجه ابزار استفاده کنید.

OpenClaw رفتار مستند Plugin را در همان تغییری که جایگزین معرفی می‌کند حذف یا
بازتعریف نمی‌کند. تغییرات شکننده در قرارداد باید ابتدا از مسیر adapter سازگاری،
diagnostics، docs، و یک بازه deprecation عبور کنند. این موضوع برای importهای SDK،
فیلدهای manifest، APIهای setup، hookها، و رفتار ثبت runtime صدق می‌کند.

<Warning>
  لایه سازگاری با نسخه‌های قبلی در یک نسخه major آینده حذف خواهد شد.
  Pluginهایی که هنوز از این سطوح import می‌کنند، هنگام وقوع آن تغییر خواهند شکست.
  ثبت‌های قدیمی factory افزونه embedded دیگر از همین حالا load نمی‌شوند.
</Warning>

## چرا این تغییر انجام شد

رویکرد قدیمی مشکلاتی ایجاد می‌کرد:

- **راه‌اندازی کند** - import کردن یک helper ده‌ها ماژول نامرتبط را load می‌کرد
- **وابستگی‌های چرخه‌ای** - re-exportهای گسترده ایجاد چرخه‌های import را آسان می‌کردند
- **سطح API نامشخص** - راهی برای تشخیص exportهای پایدار از داخلی وجود نداشت

SDK مدرن Plugin این مشکل را حل می‌کند: هر مسیر import (`openclaw/plugin-sdk/\<subpath\>`)
یک ماژول کوچک، خودبسنده، با هدف روشن و قرارداد مستند است.

seamهای convenience قدیمی provider برای channelهای bundled نیز حذف شده‌اند.
seamهای helper با برند channel میان‌برهای خصوصی mono-repo بودند، نه قراردادهای
پایدار Plugin. به‌جای آن از subpathهای SDK عمومی و محدود استفاده کنید. درون
workspace Pluginهای bundled، helperهای متعلق به provider را در `api.ts` یا
`runtime-api.ts` همان Plugin نگه دارید.

نمونه‌های فعلی providerهای bundled:

- Anthropic helperهای stream مخصوص Claude را در seam خودش یعنی `api.ts` /
  `contract-api.ts` نگه می‌دارد
- OpenAI سازنده‌های provider، helperهای مدل پیش‌فرض، و سازنده‌های provider
  realtime را در `api.ts` خودش نگه می‌دارد
- OpenRouter سازنده provider و helperهای onboarding/config را در `api.ts`
  خودش نگه می‌دارد

## برنامه مهاجرت Talk و صدای بلادرنگ

کد صدای بلادرنگ، تلفن، جلسه، و Talk مرورگر از bookkeeping محلی سطح برای turn
به یک controller مشترک session Talk منتقل می‌شود که توسط
`openclaw/plugin-sdk/realtime-voice` export می‌شود. controller جدید envelope
مشترک رویداد Talk، وضعیت turn فعال، وضعیت capture، وضعیت output-audio، تاریخچه
رویدادهای اخیر، و رد turnهای stale را در اختیار دارد. Pluginهای provider باید
همچنان مالک sessionهای realtime خاص vendor باشند؛ Pluginهای سطح باید همچنان
مالک capture، playback، تلفن، و جزئیات خاص جلسه باشند.

این مهاجرت Talk عمداً breaking-clean است:

1. primitiveهای controller/runtime مشترک را در
   `plugin-sdk/realtime-voice` نگه دارید.
2. سطح‌های bundled را به controller مشترک منتقل کنید: browser relay،
   managed-room handoff، voice-call realtime، voice-call streaming STT، Google
   Meet realtime، و native push-to-talk.
3. خانواده‌های قدیمی RPC مربوط به Talk را با API نهایی `talk.session.*` و
   `talk.client.*` جایگزین کنید.
4. یک channel زنده رویداد Talk را در Gateway
   `hello-ok.features.events` تبلیغ کنید: `talk.event`.
5. endpoint قدیمی realtime HTTP و هر مسیر override دستورالعمل در زمان request
   را حذف کنید.

کد جدید نباید مستقیماً `createTalkEventSequencer(...)` را فراخوانی کند، مگر
اینکه در حال پیاده‌سازی یک adapter سطح پایین یا fixture تست باشد. controller
مشترک را ترجیح دهید تا رویدادهای scoped به turn بدون turn id منتشر نشوند،
فراخوانی‌های stale `turnEnd` / `turnCancel` نتوانند turn فعال جدیدتر را پاک
کنند، و رویدادهای lifecycle مربوط به output-audio در تلفن، جلسات، browser relay،
managed-room handoff، و کلاینت‌های native Talk سازگار بمانند.

شکل هدف API عمومی چنین است:

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

sessionهای WebRTC/provider-websocket متعلق به مرورگر از `talk.client.create`
استفاده می‌کنند، چون مرورگر مالک negotiation با provider و transport رسانه است،
در حالی که Gateway مالک credentials، instructions، و tool policy است.
`talk.session.*` سطح مشترک مدیریت‌شده توسط Gateway برای gateway-relay realtime،
gateway-relay transcription، و sessionهای managed-room native STT/TTS است.

configهای قدیمی که selectorهای realtime را کنار `talk.provider` /
`talk.providers` قرار می‌دادند باید با `openclaw doctor --fix` اصلاح شوند؛
Talk در runtime، config provider مربوط به speech/TTS را به‌عنوان config provider
realtime بازتفسیر نمی‌کند.

ترکیب‌های پشتیبانی‌شده `talk.session.create` عمداً محدود هستند:

| Mode            | Transport       | Brain           | مالک               | یادداشت‌ها                                                                                                         |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | صدای full-duplex provider از طریق Gateway bridge می‌شود؛ tool callها از طریق ابزار agent-consult مسیریابی می‌شوند. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | فقط streaming STT؛ callerها input audio ارسال می‌کنند و رویدادهای transcript دریافت می‌کنند.                       |
| `stt-tts`       | `managed-room`  | `agent-consult` | اتاق native/client | اتاق‌های سبک push-to-talk و walkie-talkie که در آن client مالک capture/playback و Gateway مالک وضعیت turn است.     |
| `stt-tts`       | `managed-room`  | `direct-tools`  | اتاق native/client | حالت اتاق فقط-admin برای سطح‌های first-party قابل اعتماد که actionهای ابزار Gateway را مستقیماً اجرا می‌کنند.     |

نقشه methodهای حذف‌شده:

| قدیمی                            | جدید                                                     |
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

  | روش                          | اعمال می‌شود به                                              | قرارداد                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | یک قطعه صوتی PCM با کدگذاری base64 را به نشست ارائه‌دهنده که متعلق به همان اتصال Gateway است اضافه کنید.                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | یک نوبت کاربر در اتاق مدیریت‌شده را شروع کنید.                                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | نوبت فعال را پس از اعتبارسنجی نوبت منقضی‌شده پایان دهید.                                                                                                                                         |
  | `talk.session.cancelTurn`       | همه نشست‌های متعلق به Gateway                              | کار فعال ضبط/ارائه‌دهنده/عامل/TTS را برای یک نوبت لغو کنید.                                                                                                                                |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | خروجی صوتی دستیار را بدون اینکه لزوماً نوبت کاربر پایان یابد متوقف کنید.                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | یک فراخوانی ابزار ارائه‌دهنده را که توسط رله منتشر شده کامل کنید؛ برای خروجی موقت `options.willContinue` یا برای برآورده کردن فراخوانی بدون پاسخ دستیار دیگر `options.suppressResponse` را ارسال کنید. |
  | `talk.session.steer`            | نشست‌های Talk پشتیبانی‌شده با عامل                              | کنترل گفتاری `status`، `steer`، `cancel` یا `followup` را به اجرای تعبیه‌شده فعال که از نشست Talk حل شده ارسال کنید.                                                                |
  | `talk.session.close`            | همه نشست‌های یکپارچه                                    | نشست‌های رله را متوقف کنید یا وضعیت اتاق مدیریت‌شده را لغو اعتبار کنید، سپس شناسه نشست یکپارچه را فراموش کنید.                                                                                                    |

  برای کارکردن این قابلیت، موارد خاص ارائه‌دهنده یا پلتفرم را در هسته معرفی نکنید.
  هسته مالک معناشناسی نشست Talk است. Pluginهای ارائه‌دهنده مالک راه‌اندازی نشست فروشنده هستند.
  تماس صوتی و Google Meet مالک آداپتورهای تلفنی/جلسه هستند. مرورگر و برنامه‌های بومی
  مالک تجربه کاربری ضبط/پخش دستگاه هستند.

  ## سیاست سازگاری

  برای Pluginهای خارجی، کار سازگاری با این ترتیب انجام می‌شود:

  1. قرارداد جدید را اضافه کنید
  2. رفتار قدیمی را از طریق یک آداپتور سازگاری متصل نگه دارید
  3. یک تشخیص یا هشدار منتشر کنید که مسیر قدیمی و جایگزین را نام می‌برد
  4. هر دو مسیر را در آزمون‌ها پوشش دهید
  5. منسوخ‌سازی و مسیر مهاجرت را مستند کنید
  6. فقط پس از پنجره مهاجرت اعلام‌شده، معمولاً در یک انتشار اصلی، حذف کنید

  نگه‌دارندگان می‌توانند صف مهاجرت فعلی را با
  `pnpm plugins:boundary-report` ممیزی کنند. برای شمارش‌های فشرده از `pnpm plugins:boundary-report:summary`، برای یک Plugin یا مالک سازگاری از `--owner <id>`، و
  زمانی که یک دروازه CI باید روی رکوردهای سازگاری سررسیدشده، importهای SDK رزروشده بین‌مالکی، یا زیرمسیرهای SDK رزروشده استفاده‌نشده شکست بخورد از
  `pnpm plugins:boundary-report:ci` استفاده کنید. این گزارش رکوردهای
  سازگاری منسوخ‌شده را بر اساس تاریخ حذف گروه‌بندی می‌کند، ارجاع‌های کد/مستندات محلی را می‌شمارد،
  importهای SDK رزروشده بین‌مالکی را نمایان می‌کند، و پل SDK خصوصی
  میزبان حافظه را خلاصه می‌کند تا پاک‌سازی سازگاری به‌جای
  تکیه بر جست‌وجوهای موردی، صریح باقی بماند. زیرمسیرهای SDK رزروشده باید استفاده مالک ردیابی‌شده داشته باشند؛
  exportهای کمکی رزروشده استفاده‌نشده باید از SDK عمومی حذف شوند.

  اگر یک فیلد manifest هنوز پذیرفته می‌شود، نویسندگان Plugin می‌توانند تا زمانی که
  مستندات و تشخیص‌ها خلاف آن را بگویند به استفاده از آن ادامه دهند. کد جدید باید جایگزین مستندشده را ترجیح دهد،
  اما Pluginهای موجود نباید در طول انتشارهای جزئی عادی خراب شوند.

  ## روش مهاجرت

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Pluginهای باندل‌شده باید فراخوانی مستقیم
    `api.runtime.config.loadConfig()` و
    `api.runtime.config.writeConfigFile(...)` را متوقف کنند. پیکربندی‌ای را ترجیح دهید که
    از قبل به مسیر فراخوانی فعال ارسال شده است. handlerهای بلندمدتی که به
    snapshot فعلی فرایند نیاز دارند می‌توانند از `api.runtime.config.current()` استفاده کنند. ابزارهای عامل بلندمدت باید داخل
    `execute` از `ctx.getRuntimeConfig()` متعلق به context ابزار استفاده کنند تا ابزاری که قبل از نوشتن پیکربندی ایجاد شده هنوز پیکربندی runtime تازه‌سازی‌شده را ببیند.

    نوشتن پیکربندی باید از طریق helperهای تراکنشی انجام شود و یک
    سیاست پس از نوشتن انتخاب کند:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    وقتی فراخواننده می‌داند تغییر به restart تمیز Gateway نیاز دارد از `afterWrite: { mode: "restart", reason: "..." }` استفاده کنید، و
    فقط زمانی از `afterWrite: { mode: "none", reason: "..." }` استفاده کنید که فراخواننده مالک
    پیگیری است و عمداً می‌خواهد برنامه‌ریز reload را سرکوب کند.
    نتایج mutation شامل یک خلاصه typed `followUp` برای آزمون‌ها و logging هستند؛
    Gateway همچنان مسئول اعمال یا زمان‌بندی restart باقی می‌ماند.
    `loadConfig` و `writeConfigFile` در طول پنجره مهاجرت به‌عنوان helperهای سازگاری منسوخ‌شده برای Pluginهای خارجی باقی می‌مانند و یک‌بار با
    کد سازگاری `runtime-config-load-write` هشدار می‌دهند. Pluginهای باندل‌شده و کد runtime مخزن
    با حفاظ‌های scanner در
    `pnpm check:deprecated-api-usage` و
    `pnpm check:no-runtime-action-load-config` محافظت می‌شوند: استفاده جدید Plugin تولیدی
    بی‌درنگ شکست می‌خورد، نوشتن مستقیم پیکربندی شکست می‌خورد، methodهای سرور Gateway باید از
    snapshot runtime درخواست استفاده کنند، helperهای ارسال/action/client کانال runtime
    باید پیکربندی را از مرز خود دریافت کنند، و ماژول‌های runtime بلندمدت
    هیچ فراخوانی محیطی مجاز `loadConfig()` ندارند.

    کد جدید Plugin همچنین باید از import کردن barrel سازگاری گسترده
    `openclaw/plugin-sdk/config-runtime` پرهیز کند. از زیرمسیر باریک
    SDK که با کار مطابقت دارد استفاده کنید:

    | نیاز | Import |
    | --- | --- |
    | انواع پیکربندی مانند `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | assertionهای پیکربندی ازپیش‌بارگذاری‌شده و lookup پیکربندی ورودی Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | خواندن snapshot فعلی runtime | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | نوشتن پیکربندی | `openclaw/plugin-sdk/config-mutation` |
    | helperهای ذخیره نشست | `openclaw/plugin-sdk/session-store-runtime` |
    | پیکربندی جدول Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | helperهای runtime سیاست گروه | `openclaw/plugin-sdk/runtime-group-policy` |
    | حل ورودی secret | `openclaw/plugin-sdk/secret-input-runtime` |
    | overrideهای مدل/نشست | `openclaw/plugin-sdk/model-session-runtime` |

    Pluginهای باندل‌شده و آزمون‌هایشان با scanner در برابر barrel گسترده محافظت می‌شوند
    تا importها و mockها محلی و محدود به رفتاری بمانند که نیاز دارند. barrel گسترده
    همچنان برای سازگاری خارجی وجود دارد، اما کد جدید نباید
    به آن وابسته باشد.

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    Pluginهای باندل‌شده باید handlerهای نتیجه ابزار
    `api.registerEmbeddedExtensionFactory(...)` مخصوص embedded-runner را با
    middleware بی‌طرف نسبت به runtime جایگزین کنند.

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

    Pluginهای نصب‌شده نیز وقتی صراحتاً فعال باشند و هر runtime هدف را در
    `contracts.agentToolResultMiddleware` اعلام کنند می‌توانند middleware نتیجه ابزار ثبت کنند. ثبت‌های middleware نصب‌شده اعلام‌نشده
    رد می‌شوند.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Pluginهای کانال دارای قابلیت approval اکنون رفتار approval بومی را از طریق
    `approvalCapability.nativeRuntime` به‌علاوه registry مشترک runtime-context ارائه می‌کنند.

    تغییرات کلیدی:

    - `approvalCapability.handler.loadRuntime(...)` را با
      `approvalCapability.nativeRuntime` جایگزین کنید
    - auth/delivery مخصوص approval را از سیم‌کشی legacy `plugin.auth` /
      `plugin.approvals` خارج کنید و به `approvalCapability` منتقل کنید
    - `ChannelPlugin.approvals` از قرارداد عمومی channel-plugin
      حذف شده است؛ فیلدهای delivery/native/render را به `approvalCapability` منتقل کنید
    - `plugin.auth` فقط برای جریان‌های login/logout کانال باقی می‌ماند؛ hookهای auth مربوط به approval
      در آن دیگر توسط هسته خوانده نمی‌شوند
    - اشیای runtime متعلق به کانال مانند clientها، tokenها یا appهای Bolt را از طریق `openclaw/plugin-sdk/channel-runtime-context` ثبت کنید
    - از handlerهای approval بومی، اعلان‌های reroute متعلق به Plugin ارسال نکنید؛
      هسته اکنون مالک اعلان‌های routed-elsewhere بر اساس نتایج delivery واقعی است
    - هنگام ارسال `channelRuntime` به `createChannelManager(...)`، یک
      سطح واقعی `createPluginRuntime().channel` ارائه کنید. stubهای ناقص رد می‌شوند.

    برای چیدمان فعلی capability مربوط به approval، `/plugins/sdk-channel-plugins` را ببینید.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    اگر Plugin شما از `openclaw/plugin-sdk/windows-spawn` استفاده می‌کند، wrapperهای Windows
    `.cmd`/`.bat` حل‌نشده اکنون به‌صورت fail closed عمل می‌کنند مگر اینکه صراحتاً
    `allowShellFallback: true` را ارسال کنید.

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

    اگر فراخواننده شما عمداً به shell fallback متکی نیست، `allowShellFallback` را تنظیم نکنید
    و در عوض خطای پرتاب‌شده را مدیریت کنید.

  </Step>

  <Step title="Find deprecated imports">
    Plugin خود را برای import از هر یک از سطح‌های منسوخ‌شده جست‌وجو کنید:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    هر export از سطح قدیمی به یک مسیر import مدرن مشخص نگاشت می‌شود:

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

    برای helperهای سمت host، به‌جای import مستقیم از runtime تزریق‌شده Plugin استفاده کنید:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    همین الگو برای سایر راهنماهای پل قدیمی نیز اعمال می‌شود:

    | ایمپورت قدیمی | معادل مدرن |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | راهنماهای ذخیره‌سازی نشست | `api.runtime.agent.session.*` |

  </Step>

  <Step title="جایگزینی ایمپورت‌های گسترده infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` همچنان برای سازگاری خارجی
    وجود دارد، اما کد جدید باید سطح راهنمای متمرکزی را ایمپورت کند که
    واقعا به آن نیاز دارد:

    | نیاز | ایمپورت |
    | --- | --- |
    | راهنماهای صف رویداد سیستم | `openclaw/plugin-sdk/system-event-runtime` |
    | راهنماهای بیدارسازی Heartbeat، رویداد، و مشاهده‌پذیری | `openclaw/plugin-sdk/heartbeat-runtime` |
    | تخلیه صف تحویل معلق | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | تله‌متری فعالیت کانال | `openclaw/plugin-sdk/channel-activity-runtime` |
    | کش‌های حذف تکرار در حافظه | `openclaw/plugin-sdk/dedupe-runtime` |
    | راهنماهای امن مسیر فایل/رسانه محلی | `openclaw/plugin-sdk/file-access-runtime` |
    | واکشی آگاه از توزیع‌کننده | `openclaw/plugin-sdk/runtime-fetch` |
    | راهنماهای پروکسی و واکشی محافظت‌شده | `openclaw/plugin-sdk/fetch-runtime` |
    | انواع خط‌مشی توزیع‌کننده SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | انواع درخواست/حل‌وفصل تایید | `openclaw/plugin-sdk/approval-runtime` |
    | بار داده پاسخ تایید و راهنماهای فرمان | `openclaw/plugin-sdk/approval-reply-runtime` |
    | راهنماهای قالب‌بندی خطا | `openclaw/plugin-sdk/error-runtime` |
    | انتظارهای آماده‌بودن ترابری | `openclaw/plugin-sdk/transport-ready-runtime` |
    | راهنماهای توکن امن | `openclaw/plugin-sdk/secure-random-runtime` |
    | همزمانی محدود برای وظایف ناهمگام | `openclaw/plugin-sdk/concurrency-runtime` |
    | تبدیل عددی | `openclaw/plugin-sdk/number-runtime` |
    | قفل ناهمگام محلیِ فرایند | `openclaw/plugin-sdk/async-lock-runtime` |
    | قفل‌های فایل | `openclaw/plugin-sdk/file-lock` |

    Pluginهای همراه در برابر `infra-runtime` با اسکنر محافظت می‌شوند، بنابراین کد مخزن
    نمی‌تواند دوباره به بشکه گسترده بازگردد.

  </Step>

  <Step title="مهاجرت راهنماهای مسیر کانال">
    کد جدید مسیر کانال باید از `openclaw/plugin-sdk/channel-route` استفاده کند.
    نام‌های قدیمی کلید مسیر و هدف قابل‌مقایسه در بازه مهاجرت به‌عنوان نام‌های مستعار
    سازگاری باقی می‌مانند، اما Pluginهای جدید باید از نام‌های مسیری استفاده کنند
    که رفتار را مستقیما توصیف می‌کنند:

    | راهنمای قدیمی | راهنمای مدرن |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    راهنماهای مدرن مسیر، `{ channel, to, accountId, threadId }`
    را در تاییدهای بومی، سرکوب پاسخ، حذف تکرار ورودی،
    تحویل Cron، و مسیریابی نشست به‌صورت سازگار نرمال‌سازی می‌کنند.

    استفاده جدید از `ChannelMessagingAdapter.parseExplicitTarget` یا
    راهنماهای مسیر بارگذاری‌شده مبتنی بر تجزیه‌گر (`parseExplicitTargetForLoadedChannel`
    یا `resolveRouteTargetForLoadedChannel`) یا
    `resolveChannelRouteTargetWithParser(...)` از `plugin-sdk/channel-route` اضافه نکنید.
    این قلاب‌ها منسوخ شده‌اند و فقط برای Pluginهای قدیمی‌تر در
    بازه مهاجرت باقی می‌مانند. Pluginهای جدید کانال باید از
    `messaging.targetResolver.resolveTarget(...)` برای نرمال‌سازی شناسه هدف
    و جایگزینِ نبودِ مسیر در دایرکتوری، از `messaging.inferTargetChatType(...)` هنگامی که هسته
    به نوع همتای اولیه نیاز دارد، و از `messaging.resolveOutboundSessionRoute(...)`
    برای نشست بومی ارائه‌دهنده و هویت رشته استفاده کنند.

  </Step>

  <Step title="ساخت و آزمون">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## مرجع مسیر ایمپورت

  <Accordion title="Common import path table">
  | مسیر واردسازی | هدف | خروجی‌های کلیدی |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | کمک‌گیرنده متعارف ورودی Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | بازخروجی چتری قدیمی برای تعریف‌ها/سازنده‌های ورودی کانال | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | خروجی اسکیمای پیکربندی ریشه | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | کمک‌گیرنده ورودی تک‌ارائه‌دهنده | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعریف‌ها و سازنده‌های متمرکز ورودی کانال | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | کمک‌گیرنده‌های مشترک جادوگر راه‌اندازی | مترجم راه‌اندازی، پرسش‌های فهرست مجاز، سازنده‌های وضعیت راه‌اندازی |
  | `plugin-sdk/setup-runtime` | کمک‌گیرنده‌های زمان اجرای هنگام راه‌اندازی | `createSetupTranslator`، آداپتورهای وصله راه‌اندازی ایمن برای import، کمک‌گیرنده‌های یادداشت جست‌وجو، `promptResolvedAllowFrom`، `splitSetupEntries`، پراکسی‌های راه‌اندازی واگذارشده |
  | `plugin-sdk/setup-adapter-runtime` | نام مستعار منسوخ آداپتور راه‌اندازی | از `plugin-sdk/setup-runtime` استفاده کنید |
  | `plugin-sdk/setup-tools` | کمک‌گیرنده‌های ابزاردهی راه‌اندازی | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | کمک‌گیرنده‌های چندحسابی | کمک‌گیرنده‌های فهرست حساب/پیکربندی/دروازه اقدام |
  | `plugin-sdk/account-id` | کمک‌گیرنده‌های شناسه حساب | `DEFAULT_ACCOUNT_ID`، نرمال‌سازی شناسه حساب |
  | `plugin-sdk/account-resolution` | کمک‌گیرنده‌های جست‌وجوی حساب | کمک‌گیرنده‌های جست‌وجوی حساب + جایگزین پیش‌فرض |
  | `plugin-sdk/account-helpers` | کمک‌گیرنده‌های محدود حساب | کمک‌گیرنده‌های فهرست حساب/اقدام حساب |
  | `plugin-sdk/channel-setup` | آداپتورهای جادوگر راه‌اندازی | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`، به‌علاوه `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | سازه‌های اولیه جفت‌سازی DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | پیشوند پاسخ، تایپ، و سیم‌کشی تحویل منبع | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | کارخانه‌های آداپتور پیکربندی و کمک‌گیرنده‌های دسترسی DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | سازنده‌های اسکیمای پیکربندی | فقط سازه‌های اولیه اسکیمای پیکربندی کانال مشترک و سازنده عمومی |
  | `plugin-sdk/bundled-channel-config-schema` | اسکیماهای پیکربندی بسته‌بندی‌شده | فقط Pluginهای بسته‌بندی‌شده تحت نگه‌داری OpenClaw؛ Pluginهای جدید باید اسکیماهای محلی خود Plugin را تعریف کنند |
  | `plugin-sdk/channel-config-schema-legacy` | اسکیماهای پیکربندی بسته‌بندی‌شده منسوخ | فقط نام مستعار سازگاری؛ برای Pluginهای بسته‌بندی‌شده تحت نگه‌داری از `plugin-sdk/bundled-channel-config-schema` استفاده کنید |
  | `plugin-sdk/telegram-command-config` | کمک‌گیرنده‌های پیکربندی فرمان Telegram | نرمال‌سازی نام فرمان، کوتاه‌سازی توضیح، اعتبارسنجی تکرار/تداخل |
  | `plugin-sdk/channel-policy` | حل‌وفصل سیاست گروه/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | نمای سازگاری منسوخ | از `plugin-sdk/channel-outbound` استفاده کنید |
  | `plugin-sdk/inbound-envelope` | کمک‌گیرنده‌های پاکت ورودی | کمک‌گیرنده‌های مشترک سازنده مسیر + پاکت |
  | `plugin-sdk/channel-inbound` | کمک‌گیرنده‌های دریافت ورودی | ساخت زمینه، قالب‌بندی، ریشه‌ها، اجراکننده‌ها، ارسال پاسخ آماده، و گزاره‌های ارسال |
  | `plugin-sdk/messaging-targets` | مسیر واردسازی منسوخ تجزیه هدف | برای کمک‌گیرنده‌های عمومی تجزیه هدف از `plugin-sdk/channel-targets`، برای مقایسه مسیر از `plugin-sdk/channel-route`، و برای حل‌وفصل هدف ویژه ارائه‌دهنده از `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` متعلق به Plugin استفاده کنید |
  | `plugin-sdk/outbound-media` | کمک‌گیرنده‌های رسانه خروجی | بارگذاری مشترک رسانه خروجی |
  | `plugin-sdk/outbound-send-deps` | نمای سازگاری منسوخ | از `plugin-sdk/channel-outbound` استفاده کنید |
  | `plugin-sdk/channel-outbound` | کمک‌گیرنده‌های چرخه عمر پیام خروجی | آداپتورهای پیام، رسیدها، کمک‌گیرنده‌های ارسال پایدار، کمک‌گیرنده‌های پیش‌نمایش زنده/جریان‌دهی، گزینه‌های پاسخ، کمک‌گیرنده‌های چرخه عمر، هویت خروجی، و برنامه‌ریزی بار داده |
  | `plugin-sdk/channel-streaming` | نمای سازگاری منسوخ | از `plugin-sdk/channel-outbound` استفاده کنید |
  | `plugin-sdk/outbound-runtime` | نمای سازگاری منسوخ | از `plugin-sdk/channel-outbound` استفاده کنید |
  | `plugin-sdk/thread-bindings-runtime` | کمک‌گیرنده‌های اتصال نخ | چرخه عمر اتصال نخ و کمک‌گیرنده‌های آداپتور |
  | `plugin-sdk/agent-media-payload` | کمک‌گیرنده‌های قدیمی بار داده رسانه | سازنده بار داده رسانه عامل برای چیدمان‌های فیلد قدیمی |
  | `plugin-sdk/channel-runtime` | شیم سازگاری منسوخ | فقط ابزارهای زمان اجرای کانال قدیمی |
  | `plugin-sdk/channel-send-result` | انواع نتیجه ارسال | انواع نتیجه پاسخ |
  | `plugin-sdk/runtime-store` | ذخیره‌سازی پایدار Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | کمک‌گیرنده‌های گسترده زمان اجرا | کمک‌گیرنده‌های زمان اجرا/لاگ‌گیری/پشتیبان‌گیری/نصب Plugin |
  | `plugin-sdk/runtime-env` | کمک‌گیرنده‌های محدود محیط زمان اجرا | کمک‌گیرنده‌های لاگر/محیط زمان اجرا، مهلت زمانی، تلاش مجدد، و backoff |
  | `plugin-sdk/plugin-runtime` | کمک‌گیرنده‌های مشترک زمان اجرای Plugin | کمک‌گیرنده‌های فرمان‌ها/قلاب‌ها/http/تعاملی Plugin |
  | `plugin-sdk/hook-runtime` | کمک‌گیرنده‌های خط لوله قلاب | کمک‌گیرنده‌های مشترک خط لوله قلاب Webhook/داخلی |
  | `plugin-sdk/lazy-runtime` | کمک‌گیرنده‌های زمان اجرای تنبل | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | کمک‌گیرنده‌های فرایند | کمک‌گیرنده‌های مشترک exec |
  | `plugin-sdk/cli-runtime` | کمک‌گیرنده‌های زمان اجرای CLI | قالب‌بندی فرمان، انتظارها، کمک‌گیرنده‌های نسخه |
  | `plugin-sdk/gateway-runtime` | کمک‌گیرنده‌های Gateway | کلاینت Gateway، کمک‌گیرنده شروع آماده حلقه رویداد، و کمک‌گیرنده‌های وصله وضعیت کانال |
  | `plugin-sdk/config-runtime` | شیم سازگاری پیکربندی منسوخ | `config-contracts`، `plugin-config-runtime`، `runtime-config-snapshot`، و `config-mutation` را ترجیح دهید |
  | `plugin-sdk/telegram-command-config` | کمک‌گیرنده‌های فرمان Telegram | کمک‌گیرنده‌های اعتبارسنجی فرمان Telegram پایدار در جایگزینی، وقتی سطح قرارداد Telegram بسته‌بندی‌شده در دسترس نیست |
  | `plugin-sdk/approval-runtime` | کمک‌گیرنده‌های درخواست تأیید | بار داده تأیید exec/Plugin، کمک‌گیرنده‌های قابلیت/پروفایل تأیید، کمک‌گیرنده‌های مسیریابی/زمان اجرای تأیید بومی، و قالب‌بندی مسیر نمایش تأیید ساختاریافته |
  | `plugin-sdk/approval-auth-runtime` | کمک‌گیرنده‌های احراز هویت تأیید | حل‌وفصل تأییدکننده، احراز هویت اقدام همان گفت‌وگو |
  | `plugin-sdk/approval-client-runtime` | کمک‌گیرنده‌های کلاینت تأیید | کمک‌گیرنده‌های پروفایل/فیلتر تأیید exec بومی |
  | `plugin-sdk/approval-delivery-runtime` | کمک‌گیرنده‌های تحویل تأیید | آداپتورهای قابلیت/تحویل تأیید بومی |
  | `plugin-sdk/approval-gateway-runtime` | کمک‌گیرنده‌های Gateway تأیید | کمک‌گیرنده مشترک حل‌وفصل Gateway تأیید |
  | `plugin-sdk/approval-handler-adapter-runtime` | کمک‌گیرنده‌های آداپتور تأیید | کمک‌گیرنده‌های سبک بارگذاری آداپتور تأیید بومی برای نقطه‌های ورودی داغ کانال |
  | `plugin-sdk/approval-handler-runtime` | کمک‌گیرنده‌های هندلر تأیید | کمک‌گیرنده‌های گسترده‌تر زمان اجرای هندلر تأیید؛ وقتی درزهای محدودتر آداپتور/Gateway کافی هستند، آن‌ها را ترجیح دهید |
  | `plugin-sdk/approval-native-runtime` | کمک‌گیرنده‌های هدف تأیید | کمک‌گیرنده‌های اتصال هدف/حساب تأیید بومی |
  | `plugin-sdk/approval-reply-runtime` | کمک‌گیرنده‌های پاسخ تأیید | کمک‌گیرنده‌های بار داده پاسخ تأیید exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | کمک‌گیرنده‌های زمینه زمان اجرای کانال | کمک‌گیرنده‌های عمومی ثبت/دریافت/پایش زمینه زمان اجرای کانال |
  | `plugin-sdk/security-runtime` | کمک‌گیرنده‌های امنیت | اعتماد مشترک، دروازه‌گذاری DM، کمک‌گیرنده‌های فایل/مسیر محدود به ریشه، محتوای خارجی، و گردآوری محرمانه‌ها |
  | `plugin-sdk/ssrf-policy` | کمک‌گیرنده‌های سیاست SSRF | کمک‌گیرنده‌های فهرست مجاز میزبان و سیاست شبکه خصوصی |
  | `plugin-sdk/ssrf-runtime` | کمک‌گیرنده‌های زمان اجرای SSRF | توزیع‌کننده پین‌شده، fetch محافظت‌شده، کمک‌گیرنده‌های سیاست SSRF |
  | `plugin-sdk/system-event-runtime` | کمک‌گیرنده‌های رویداد سیستم | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | کمک‌گیرنده‌های Heartbeat | بیدارسازی، رویداد، و کمک‌گیرنده‌های نمایش‌پذیری Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | کمک‌گیرنده‌های صف تحویل | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | کمک‌گیرنده‌های فعالیت کانال | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | کمک‌گیرنده‌های حذف تکراری | کش‌های حذف تکراری درون‌حافظه‌ای |
  | `plugin-sdk/file-access-runtime` | کمک‌گیرنده‌های دسترسی فایل | کمک‌گیرنده‌های ایمن مسیر فایل محلی/رسانه |
  | `plugin-sdk/transport-ready-runtime` | کمک‌گیرنده‌های آمادگی انتقال | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | کمک‌گیرنده‌های سیاست تأیید exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | کمک‌گیرنده‌های کش محدود | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | کمک‌گیرنده‌های دروازه‌گذاری تشخیص | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | کمک‌گیرنده‌های قالب‌بندی خطا | `formatUncaughtError`, `isApprovalNotFoundError`، کمک‌گیرنده‌های گراف خطا |
  | `plugin-sdk/fetch-runtime` | کمک‌گیرنده‌های fetch/پراکسی پوشش‌داده‌شده | `resolveFetch`، کمک‌گیرنده‌های پراکسی، کمک‌گیرنده‌های گزینه EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | کمک‌گیرنده‌های نرمال‌سازی میزبان | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | کمک‌گیرنده‌های تلاش مجدد | `RetryConfig`, `retryAsync`، اجراکننده‌های سیاست |
  | `plugin-sdk/allow-from` | قالب‌بندی فهرست مجاز و نگاشت ورودی | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | دروازه‌گذاری فرمان و کمک‌گیرنده‌های سطح فرمان | `resolveControlCommandGate`، کمک‌گیرنده‌های مجوزدهی فرستنده، کمک‌گیرنده‌های رجیستری فرمان شامل قالب‌بندی منوی آرگومان پویا |
  | `plugin-sdk/command-status` | رندرکننده‌های وضعیت/راهنمای فرمان | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | تجزیه ورودی محرمانه | کمک‌گیرنده‌های ورودی محرمانه |
  | `plugin-sdk/webhook-ingress` | کمک‌گیرنده‌های درخواست Webhook | ابزارهای هدف Webhook |
  | `plugin-sdk/webhook-request-guards` | کمک‌گیرنده‌های محافظ بدنه Webhook | کمک‌گیرنده‌های خواندن/محدودسازی بدنه درخواست |
  | `plugin-sdk/reply-runtime` | زمان اجرای مشترک پاسخ | ارسال ورودی، Heartbeat، برنامه‌ریز پاسخ، قطعه‌بندی |
  | `plugin-sdk/reply-dispatch-runtime` | کمک‌گیرنده‌های محدود ارسال پاسخ | نهایی‌سازی، ارسال ارائه‌دهنده، و کمک‌گیرنده‌های برچسب گفت‌وگو |
  | `plugin-sdk/reply-history` | کمک‌گیرنده‌های تاریخچه پاسخ | `createChannelHistoryWindow`؛ خروجی‌های سازگاری منسوخ کمک‌گیرنده نقشه مانند `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, و `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | برنامه‌ریزی ارجاع پاسخ | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | کمک‌گیرنده‌های قطعه پاسخ | کمک‌گیرنده‌های قطعه‌بندی متن/markdown |
  | `plugin-sdk/session-store-runtime` | کمک‌گیرنده‌های ذخیره نشست | کمک‌گیرنده‌های مسیر ذخیره + به‌روزشده-در |
  | `plugin-sdk/state-paths` | کمک‌گیرنده‌های مسیر وضعیت | کمک‌گیرنده‌های پوشه وضعیت و OAuth |
  | `plugin-sdk/routing` | کمک‌کننده‌های مسیریابی/کلید نشست | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, کمک‌کننده‌های عادی‌سازی کلید نشست |
  | `plugin-sdk/status-helpers` | کمک‌کننده‌های وضعیت کانال | سازنده‌های خلاصه وضعیت کانال/حساب، پیش‌فرض‌های وضعیت زمان اجرا، کمک‌کننده‌های فراداده مسئله |
  | `plugin-sdk/target-resolver-runtime` | کمک‌کننده‌های حل‌کننده هدف | کمک‌کننده‌های مشترک حل‌کننده هدف |
  | `plugin-sdk/string-normalization-runtime` | کمک‌کننده‌های عادی‌سازی رشته | کمک‌کننده‌های عادی‌سازی slug/رشته |
  | `plugin-sdk/request-url` | کمک‌کننده‌های URL درخواست | استخراج URLهای رشته‌ای از ورودی‌های شبیه درخواست |
  | `plugin-sdk/run-command` | کمک‌کننده‌های فرمان زمان‌دار | اجراکننده فرمان زمان‌دار با stdout/stderr عادی‌سازی‌شده |
  | `plugin-sdk/param-readers` | خواننده‌های پارامتر | خواننده‌های رایج پارامتر ابزار/CLI |
  | `plugin-sdk/tool-payload` | استخراج payload ابزار | استخراج payloadهای عادی‌سازی‌شده از اشیای نتیجه ابزار |
  | `plugin-sdk/tool-send` | استخراج ارسال ابزار | استخراج فیلدهای هدف ارسال canonical از آرگومان‌های ابزار |
  | `plugin-sdk/temp-path` | کمک‌کننده‌های مسیر موقت | کمک‌کننده‌های مشترک مسیر temp-download |
  | `plugin-sdk/logging-core` | کمک‌کننده‌های ثبت لاگ | کمک‌کننده‌های logger زیرسیستم و redaction |
  | `plugin-sdk/markdown-table-runtime` | کمک‌کننده‌های جدول Markdown | کمک‌کننده‌های حالت جدول Markdown |
  | `plugin-sdk/reply-payload` | انواع پاسخ پیام | انواع payload پاسخ |
  | `plugin-sdk/provider-setup` | کمک‌کننده‌های گزیده راه‌اندازی ارائه‌دهنده محلی/خودمیزبان | کمک‌کننده‌های کشف/پیکربندی ارائه‌دهنده خودمیزبان |
  | `plugin-sdk/self-hosted-provider-setup` | کمک‌کننده‌های متمرکز راه‌اندازی ارائه‌دهنده خودمیزبان سازگار با OpenAI | همان کمک‌کننده‌های کشف/پیکربندی ارائه‌دهنده خودمیزبان |
  | `plugin-sdk/provider-auth-runtime` | کمک‌کننده‌های احراز هویت زمان اجرای ارائه‌دهنده | کمک‌کننده‌های حل‌کردن کلید API در زمان اجرا |
  | `plugin-sdk/provider-auth-api-key` | کمک‌کننده‌های راه‌اندازی کلید API ارائه‌دهنده | کمک‌کننده‌های onboarding/نوشتن پروفایل برای کلید API |
  | `plugin-sdk/provider-auth-result` | کمک‌کننده‌های نتیجه احراز هویت ارائه‌دهنده | سازنده استاندارد نتیجه احراز هویت OAuth |
  | `plugin-sdk/provider-selection-runtime` | کمک‌کننده‌های انتخاب ارائه‌دهنده | انتخاب ارائه‌دهنده پیکربندی‌شده یا خودکار و ادغام پیکربندی خام ارائه‌دهنده |
  | `plugin-sdk/provider-env-vars` | کمک‌کننده‌های env-var ارائه‌دهنده | کمک‌کننده‌های جست‌وجوی env-var احراز هویت ارائه‌دهنده |
  | `plugin-sdk/provider-model-shared` | کمک‌کننده‌های مشترک مدل/بازپخش ارائه‌دهنده | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, سازنده‌های مشترک سیاست بازپخش، کمک‌کننده‌های endpoint ارائه‌دهنده، و کمک‌کننده‌های عادی‌سازی model-id |
  | `plugin-sdk/provider-catalog-shared` | کمک‌کننده‌های مشترک کاتالوگ ارائه‌دهنده | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | وصله‌های onboarding ارائه‌دهنده | کمک‌کننده‌های پیکربندی onboarding |
  | `plugin-sdk/provider-http` | کمک‌کننده‌های HTTP ارائه‌دهنده | کمک‌کننده‌های عمومی قابلیت HTTP/endpoint ارائه‌دهنده، از جمله کمک‌کننده‌های فرم چندبخشی رونویسی صوت |
  | `plugin-sdk/provider-web-fetch` | کمک‌کننده‌های web-fetch ارائه‌دهنده | کمک‌کننده‌های ثبت/کش ارائه‌دهنده web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | کمک‌کننده‌های پیکربندی جست‌وجوی وب ارائه‌دهنده | کمک‌کننده‌های محدود پیکربندی/credential جست‌وجوی وب برای ارائه‌دهندگانی که به سیم‌کشی فعال‌سازی Plugin نیاز ندارند |
  | `plugin-sdk/provider-web-search-contract` | کمک‌کننده‌های قرارداد جست‌وجوی وب ارائه‌دهنده | کمک‌کننده‌های محدود قرارداد پیکربندی/credential جست‌وجوی وب مانند `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، و setter/getterهای credential با scope مشخص |
  | `plugin-sdk/provider-web-search` | کمک‌کننده‌های جست‌وجوی وب ارائه‌دهنده | کمک‌کننده‌های ثبت/کش/زمان اجرای ارائه‌دهنده جست‌وجوی وب |
  | `plugin-sdk/provider-tools` | کمک‌کننده‌های سازگاری ابزار/ schema ارائه‌دهنده | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، و پاک‌سازی schema + عیب‌یابی DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | کمک‌کننده‌های مصرف ارائه‌دهنده | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`، و سایر کمک‌کننده‌های مصرف ارائه‌دهنده |
  | `plugin-sdk/provider-stream` | کمک‌کننده‌های wrapper جریان ارائه‌دهنده | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, انواع wrapper جریان، و کمک‌کننده‌های مشترک wrapper برای Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | کمک‌کننده‌های transport ارائه‌دهنده | کمک‌کننده‌های transport بومی ارائه‌دهنده مانند fetch محافظت‌شده، استخراج متن نتیجه ابزار، تبدیل‌های پیام transport، و جریان‌های رویداد transport قابل نوشتن |
  | `plugin-sdk/keyed-async-queue` | صف async مرتب | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | کمک‌کننده‌های مشترک رسانه | کمک‌کننده‌های دریافت/تبدیل/ذخیره رسانه، بررسی ابعاد ویدئو با پشتوانه ffprobe، و سازنده‌های payload رسانه |
  | `plugin-sdk/media-generation-runtime` | کمک‌کننده‌های مشترک تولید رسانه | کمک‌کننده‌های مشترک failover، انتخاب candidate، و پیام‌رسانی مدلِ موجود نیست برای تولید تصویر/ویدئو/موسیقی |
  | `plugin-sdk/media-understanding` | کمک‌کننده‌های فهم رسانه | انواع ارائه‌دهنده فهم رسانه به‌همراه exportهای کمک‌کننده تصویر/صوت رو به ارائه‌دهنده |
  | `plugin-sdk/text-runtime` | export گسترده منسوخ سازگاری متن | از `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`، و `logging-core` استفاده کنید |
  | `plugin-sdk/text-chunking` | کمک‌کننده‌های تکه‌بندی متن | کمک‌کننده تکه‌بندی متن خروجی |
  | `plugin-sdk/speech` | کمک‌کننده‌های گفتار | انواع ارائه‌دهنده گفتار به‌همراه کمک‌کننده‌های directive، registry، اعتبارسنجی رو به ارائه‌دهنده، و سازنده TTS سازگار با OpenAI |
  | `plugin-sdk/speech-core` | هسته مشترک گفتار | انواع ارائه‌دهنده گفتار، registry، directiveها، عادی‌سازی |
  | `plugin-sdk/realtime-transcription` | کمک‌کننده‌های رونویسی بلادرنگ | انواع ارائه‌دهنده، کمک‌کننده‌های registry، و کمک‌کننده مشترک نشست WebSocket |
  | `plugin-sdk/realtime-voice` | کمک‌کننده‌های صدای بلادرنگ | انواع ارائه‌دهنده، کمک‌کننده‌های registry/حل‌کردن، کمک‌کننده‌های نشست bridge، صف‌های مشترک پاسخ گفتاری agent، کنترل صدای اجرای فعال، سلامت transcript/رویداد، سرکوب echo، تطبیق پرسش consult، هماهنگی forced-consult، ردیابی turn-context، ردیابی فعالیت خروجی، و کمک‌کننده‌های سریع consult زمینه |
  | `plugin-sdk/image-generation` | کمک‌کننده‌های تولید تصویر | انواع ارائه‌دهنده تولید تصویر به‌همراه کمک‌کننده‌های asset تصویر/data URL و سازنده ارائه‌دهنده تصویر سازگار با OpenAI |
  | `plugin-sdk/image-generation-core` | هسته مشترک تولید تصویر | انواع تولید تصویر، failover، احراز هویت، و کمک‌کننده‌های registry |
  | `plugin-sdk/music-generation` | کمک‌کننده‌های تولید موسیقی | انواع ارائه‌دهنده/درخواست/نتیجه تولید موسیقی |
  | `plugin-sdk/music-generation-core` | هسته مشترک تولید موسیقی | انواع تولید موسیقی، کمک‌کننده‌های failover، جست‌وجوی ارائه‌دهنده، و parse کردن model-ref |
  | `plugin-sdk/video-generation` | کمک‌کننده‌های تولید ویدئو | انواع ارائه‌دهنده/درخواست/نتیجه تولید ویدئو |
  | `plugin-sdk/video-generation-core` | هسته مشترک تولید ویدئو | انواع تولید ویدئو، کمک‌کننده‌های failover، جست‌وجوی ارائه‌دهنده، و parse کردن model-ref |
  | `plugin-sdk/interactive-runtime` | کمک‌کننده‌های پاسخ تعاملی | عادی‌سازی/کاهش payload پاسخ تعاملی |
  | `plugin-sdk/channel-config-primitives` | primitiveهای پیکربندی کانال | primitiveهای محدود schema پیکربندی کانال |
  | `plugin-sdk/channel-config-writes` | کمک‌کننده‌های نوشتن پیکربندی کانال | کمک‌کننده‌های مجوزدهی نوشتن پیکربندی کانال |
  | `plugin-sdk/channel-plugin-common` | prelude مشترک کانال | exportهای prelude مشترک Plugin کانال |
  | `plugin-sdk/channel-status` | کمک‌کننده‌های وضعیت کانال | کمک‌کننده‌های مشترک snapshot/خلاصه وضعیت کانال |
  | `plugin-sdk/allowlist-config-edit` | کمک‌کننده‌های پیکربندی allowlist | کمک‌کننده‌های ویرایش/خواندن پیکربندی allowlist |
  | `plugin-sdk/group-access` | کمک‌کننده‌های دسترسی گروه | کمک‌کننده‌های مشترک تصمیم‌گیری دسترسی گروه |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | facadeهای منسوخ سازگاری | از `plugin-sdk/channel-inbound` استفاده کنید |
  | `plugin-sdk/direct-dm-guard-policy` | کمک‌کننده‌های guard برای Direct-DM | کمک‌کننده‌های محدود سیاست guard پیش از رمزنگاری |
  | `plugin-sdk/extension-shared` | کمک‌کننده‌های مشترک extension | primitiveهای کمک‌کننده کانال منفعل/وضعیت و ambient proxy |
  | `plugin-sdk/webhook-targets` | کمک‌کننده‌های هدف Webhook | کمک‌کننده‌های registry هدف Webhook و نصب route |
  | `plugin-sdk/webhook-path` | alias منسوخ مسیر Webhook | از `plugin-sdk/webhook-ingress` استفاده کنید |
  | `plugin-sdk/web-media` | کمک‌کننده‌های مشترک رسانه وب | کمک‌کننده‌های بارگذاری رسانه دور/محلی |
  | `plugin-sdk/zod` | re-export منسوخ سازگاری Zod | `zod` را مستقیما از `zod` import کنید |
  | `plugin-sdk/memory-core` | کمک‌کننده‌های memory-core بسته‌بندی‌شده | سطح کمک‌کننده مدیریت حافظه/پیکربندی/فایل/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | facade زمان اجرای موتور حافظه | facade زمان اجرای index/search حافظه |
  | `plugin-sdk/memory-core-host-embedding-registry` | registry embedding حافظه | کمک‌کننده‌های سبک registry ارائه‌دهنده embedding حافظه |
  | `plugin-sdk/memory-core-host-engine-foundation` | موتور foundation میزبان حافظه | exportهای موتور foundation میزبان حافظه |
  | `plugin-sdk/memory-core-host-engine-embeddings` | موتور embedding میزبان حافظه | قراردادهای embedding حافظه، دسترسی registry، ارائه‌دهنده محلی، و کمک‌کننده‌های عمومی batch/remote؛ ارائه‌دهندگان remote مشخص در Pluginهای مالک خودشان قرار دارند |
  | `plugin-sdk/memory-core-host-engine-qmd` | موتور QMD میزبان حافظه | exportهای موتور QMD میزبان حافظه |
  | `plugin-sdk/memory-core-host-engine-storage` | موتور storage میزبان حافظه | exportهای موتور storage میزبان حافظه |
  | `plugin-sdk/memory-core-host-multimodal` | کمک‌کننده‌های multimodal میزبان حافظه | کمک‌کننده‌های multimodal میزبان حافظه |
  | `plugin-sdk/memory-core-host-query` | کمک‌کننده‌های query میزبان حافظه | کمک‌کننده‌های query میزبان حافظه |
  | `plugin-sdk/memory-core-host-secret` | کمک‌کننده‌های secret میزبان حافظه | کمک‌کننده‌های secret میزبان حافظه |
  | `plugin-sdk/memory-core-host-events` | alias منسوخ رویداد حافظه | از `plugin-sdk/memory-host-events` استفاده کنید |
  | `plugin-sdk/memory-core-host-status` | کمک‌کننده‌های وضعیت میزبان حافظه | کمک‌کننده‌های وضعیت میزبان حافظه |
  | `plugin-sdk/memory-core-host-runtime-cli` | زمان اجرای CLI میزبان حافظه | کمک‌کننده‌های زمان اجرای CLI میزبان حافظه |
  | `plugin-sdk/memory-core-host-runtime-core` | زمان اجرای هسته میزبان حافظه | کمک‌کننده‌های زمان اجرای هسته میزبان حافظه |
  | `plugin-sdk/memory-core-host-runtime-files` | کمک‌کننده‌های فایل/زمان اجرای میزبان حافظه | کمک‌کننده‌های فایل/زمان اجرای میزبان حافظه |
  | `plugin-sdk/memory-host-core` | alias زمان اجرای هسته میزبان حافظه | alias بی‌طرف نسبت به vendor برای کمک‌کننده‌های زمان اجرای هسته میزبان حافظه |
  | `plugin-sdk/memory-host-events` | alias ژورنال رویداد میزبان حافظه | alias بی‌طرف نسبت به vendor برای کمک‌کننده‌های ژورنال رویداد میزبان حافظه |
  | `plugin-sdk/memory-host-files` | alias منسوخ فایل/زمان اجرای حافظه | از `plugin-sdk/memory-core-host-runtime-files` استفاده کنید |
  | `plugin-sdk/memory-host-markdown` | کمک‌کننده‌های Markdown مدیریت‌شده | کمک‌کننده‌های مشترک managed-markdown برای Pluginهای نزدیک به حافظه |
  | `plugin-sdk/memory-host-search` | facade جست‌وجوی Active Memory | facade زمان اجرای lazy برای search-manager Active Memory |
  | `plugin-sdk/memory-host-status` | alias منسوخ وضعیت میزبان حافظه | از `plugin-sdk/memory-core-host-status` استفاده کنید |
  | `plugin-sdk/testing` | ابزارهای تست | barrel منسوخ سازگاری محلی repo؛ از زیرمسیرهای تست متمرکز محلی repo مانند `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`، و `plugin-sdk/test-fixtures` استفاده کنید |
</Accordion>

  این جدول عمداً زیرمجموعه مشترک مهاجرت است، نه سطح کامل SDK.
  فهرست نقاط ورود کامپایلر در
  `scripts/lib/plugin-sdk-entrypoints.json` قرار دارد؛ exportهای بسته از
  زیرمجموعه عمومی تولید می‌شوند.

  درزهای کمکی رزروشده برای Pluginهای باندل‌شده، به‌جز نماهای سازگاری که صراحتاً مستند شده‌اند، مانند شیم منسوخ‌شده `plugin-sdk/discord` که برای بسته منتشرشده
  `@openclaw/discord@2026.3.13` نگه داشته شده است، از نقشه export عمومی SDK
  بازنشسته شده‌اند. کمک‌کننده‌های ویژه مالک درون بسته Plugin مالک قرار می‌گیرند؛
  رفتار میزبان مشترک باید از طریق قراردادهای عمومی SDK مانند
  `plugin-sdk/gateway-runtime`، `plugin-sdk/security-runtime`،
  و `plugin-sdk/plugin-config-runtime` عبور کند.

  از محدودترین importی استفاده کنید که با کار مطابقت دارد. اگر exportی پیدا نکردید،
  منبع را در `src/plugin-sdk/` بررسی کنید یا از نگه‌دارندگان بپرسید کدام قرارداد عمومی
  باید مالک آن باشد.

  ## استهلاک‌های فعال

  استهلاک‌های محدودتری که در سراسر SDK Plugin، قرارداد ارائه‌دهنده،
  سطح زمان اجرا، و manifest اعمال می‌شوند. هرکدام امروز هنوز کار می‌کنند اما
  در یک انتشار major آینده حذف خواهند شد. ورودی زیر هر مورد، API قدیمی را به
  جایگزین canonical آن نگاشت می‌کند.

  <AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **قدیمی (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **جدید (`openclaw/plugin-sdk/command-status`)**: همان امضاها، همان
    exportها - فقط از subpath محدودتر import می‌شوند. `command-auth`
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

    Pluginهای کانال پایین‌دستی (Slack، Discord، Matrix، MS Teams) از قبل
    تغییر داده‌اند.

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` یک شیم سازگاری برای Pluginهای کانال قدیمی‌تر است.
    آن را از کد جدید import نکنید؛ برای ثبت شیءهای زمان اجرا از
    `openclaw/plugin-sdk/channel-runtime-context` استفاده کنید.

    کمک‌کننده‌های `channelActions*` در `openclaw/plugin-sdk/channel-actions` هم‌زمان با
    exportهای کانال خام "actions" منسوخ شده‌اند. قابلیت‌ها را در عوض از طریق سطح معنایی
    `presentation` ارائه کنید - Pluginهای کانال اعلام می‌کنند چه چیزی render می‌کنند
    (کارت‌ها، دکمه‌ها، selectها)، نه اینکه کدام نام‌های action خام را می‌پذیرند.

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **قدیمی**: کارخانه `tool()` از `openclaw/plugin-sdk/provider-web-search`.

    **جدید**: `createTool(...)` را مستقیماً روی Plugin ارائه‌دهنده پیاده‌سازی کنید.
    OpenClaw دیگر برای ثبت wrapper ابزار به کمک‌کننده SDK نیاز ندارد.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **قدیمی**: `formatInboundEnvelope(...)` (و
    `ChannelMessageForAgent.channelEnvelope`) برای ساخت یک envelope prompt متن ساده و تخت
    از پیام‌های ورودی کانال.

    **جدید**: `BodyForAgent` به‌همراه بلوک‌های ساختاریافته زمینه کاربر. Pluginهای کانال
    فراداده مسیریابی (thread، topic، reply-to، reactions) را به‌جای الحاق آن‌ها به یک
    رشته prompt، به‌صورت فیلدهای typed پیوست می‌کنند. کمک‌کننده
    `formatAgentEnvelope(...)` همچنان برای envelopeهای ساخته‌شده رو به assistant پشتیبانی می‌شود،
    اما envelopeهای متن ساده ورودی در مسیر حذف هستند.

    حوزه‌های تحت تأثیر: `inbound_claim`، `message_received`، و هر Plugin کانال سفارشی
    که متن `channelEnvelope` را post-process می‌کرد.

  </Accordion>

  <Accordion title="deactivate hook → gateway_stop">
    **قدیمی**: `api.on("deactivate", handler)`.

    **جدید**: `api.on("gateway_stop", handler)`. رویداد و context همان قرارداد پاک‌سازی
    هنگام shutdown هستند؛ فقط نام hook تغییر می‌کند.

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

    `deactivate` تا پس از 2026-08-16 به‌عنوان alias سازگاری منسوخ‌شده متصل باقی می‌ماند.

  </Accordion>

  <Accordion title="subagent_spawning hook → core thread binding">
    **قدیمی**: `api.on("subagent_spawning", handler)` که
    `threadBindingReady` یا `deliveryOrigin` برمی‌گرداند.

    **جدید**: اجازه دهید core اتصال‌های subagent با `thread: true` را از طریق
    adapter اتصال session کانال آماده کند. از `api.on("subagent_spawned", handler)`
    فقط برای مشاهده پس از launch استفاده کنید.

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
    `PluginHookSubagentSpawningResult`، و
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` فقط تا زمانی که Pluginهای خارجی مهاجرت کنند
    به‌عنوان سطوح سازگاری منسوخ‌شده باقی می‌مانند.

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    چهار alias نوع discovery اکنون wrapperهای نازکی روی
    نوع‌های دوره catalog هستند:

    | alias قدیمی              | نوع جدید                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    به‌علاوه bag ایستای قدیمی `ProviderCapabilities` - Pluginهای ارائه‌دهنده
    باید به‌جای یک شیء ایستا از hookهای صریح ارائه‌دهنده مانند `buildReplayPolicy`،
    `normalizeToolSchemas`، و `wrapStreamFn` استفاده کنند.

  </Accordion>

  <Accordion title="قلاب‌های سیاست تفکر → resolveThinkingProfile">
    **قدیمی** (سه قلاب جداگانه روی `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`، `supportsXHighThinking(ctx)`، و
    `resolveDefaultThinkingLevel(ctx)`.

    **جدید**: یک `resolveThinkingProfile(ctx)` واحد که یک
    `ProviderThinkingProfile` را با `id` رسمی، `label` اختیاری، و
    فهرست رتبه‌بندی‌شده سطح‌ها برمی‌گرداند. OpenClaw مقدارهای ذخیره‌شده قدیمی را به‌صورت خودکار بر اساس رتبه
    پروفایل تنزل می‌دهد.

    زمینه شامل `provider`، `modelId`، `reasoning` ادغام‌شده اختیاری،
    و دانسته‌های `compat` مدل ادغام‌شده اختیاری است. Pluginهای ارائه‌دهنده می‌توانند از این
    دانسته‌های کاتالوگ استفاده کنند تا فقط وقتی قرارداد درخواست پیکربندی‌شده از آن پشتیبانی می‌کند،
    یک پروفایل ویژه مدل را آشکار کنند.

    به‌جای سه قلاب، یک قلاب پیاده‌سازی کنید. قلاب‌های قدیمی در طول
    پنجره منسوخ‌سازی همچنان کار می‌کنند، اما با نتیجه پروفایل ترکیب نمی‌شوند.

  </Accordion>

  <Accordion title="ارائه‌دهندگان احراز هویت خارجی → contracts.externalAuthProviders">
    **قدیمی**: پیاده‌سازی قلاب‌های احراز هویت خارجی بدون اعلام ارائه‌دهنده
    در مانیفست Plugin.

    **جدید**: `contracts.externalAuthProviders` را در مانیفست Plugin
    اعلام کنید **و** `resolveExternalAuthProfiles(...)` را پیاده‌سازی کنید.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="جست‌وجوی متغیر محیطی ارائه‌دهنده → setup.providers[].envVars">
    فیلد مانیفست **قدیمی**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **جدید**: همان جست‌وجوی متغیر محیطی را در `setup.providers[].envVars`
    روی مانیفست بازتاب دهید. این کار فراداده محیطی راه‌اندازی/وضعیت را در یک
    مکان یکپارچه می‌کند و از راه‌اندازی runtime Plugin فقط برای پاسخ‌دادن به جست‌وجوهای
    متغیر محیطی جلوگیری می‌کند.

    `providerAuthEnvVars` از طریق یک سازگارکننده سازگاری تا زمان بسته‌شدن
    پنجره منسوخ‌سازی همچنان پشتیبانی می‌شود.

  </Accordion>

  <Accordion title="ثبت Plugin حافظه → registerMemoryCapability">
    **قدیمی**: سه فراخوانی جداگانه -
    `api.registerMemoryPromptSection(...)`،
    `api.registerMemoryFlushPlan(...)`،
    `api.registerMemoryRuntime(...)`.

    **جدید**: یک فراخوانی روی API وضعیت حافظه -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    همان جایگاه‌ها، یک فراخوانی ثبت واحد. کمک‌کننده‌های افزایشی prompt و corpus
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)
    تحت تأثیر قرار نمی‌گیرند.

  </Accordion>

  <Accordion title="API ارائه‌دهنده embedding حافظه">
    **قدیمی**: `api.registerMemoryEmbeddingProvider(...)` به‌همراه
    `contracts.memoryEmbeddingProviders`.

    **جدید**: `api.registerEmbeddingProvider(...)` به‌همراه
    `contracts.embeddingProviders`.

    قرارداد عمومی ارائه‌دهنده embedding بیرون از حافظه نیز قابل استفاده مجدد است و
    مسیر پشتیبانی‌شده برای ارائه‌دهندگان جدید است. API ثبت ویژه حافظه
    در قالب سازگاری منسوخ‌شده همچنان متصل می‌ماند تا ارائه‌دهندگان موجود مهاجرت کنند.
    گزارش‌های بازرسی Plugin استفاده غیر bundled را به‌عنوان بدهی سازگاری گزارش می‌کنند.

  </Accordion>

  <Accordion title="نام انواع پیام‌های نشست subagent تغییر کرده است">
    دو نام مستعار نوع قدیمی همچنان از `src/plugins/runtime/types.ts` صادر می‌شوند:

    | قدیمی                           | جدید                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    متد runtime با نام `readSession` به نفع
    `getSessionMessages` منسوخ شده است. همان امضا؛ متد قدیمی فراخوانی را به
    متد جدید عبور می‌دهد.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **قدیمی**: `runtime.tasks.flow` (مفرد) یک دسترسی‌دهنده task-flow زنده برمی‌گرداند.

    **جدید**: `runtime.tasks.managedFlows` runtime جهش TaskFlow مدیریت‌شده را
    برای Pluginهایی نگه می‌دارد که از یک flow، وظیفه‌های فرزند ایجاد، به‌روزرسانی،
    لغو، یا اجرا می‌کنند. وقتی Plugin فقط به خواندن‌های مبتنی بر DTO نیاز دارد،
    از `runtime.tasks.flows` استفاده کنید.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="کارخانه‌های extension توکار → میان‌افزار نتیجه ابزار agent">
    در بخش «روش مهاجرت → مهاجرت extensionهای نتیجه ابزار توکار به
    middleware» در بالا پوشش داده شده است. برای کامل‌بودن اینجا نیز آمده است: مسیر حذف‌شده
    `api.registerEmbeddedExtensionFactory(...)` که فقط مخصوص embedded-runner بود، با
    `api.registerAgentToolResultMiddleware(...)` به‌همراه یک فهرست runtime
    صریح در `contracts.agentToolResultMiddleware` جایگزین شده است.
  </Accordion>

  <Accordion title="نام مستعار OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` که از `openclaw/plugin-sdk` دوباره صادر می‌شود، اکنون یک
    نام مستعار تک‌خطی برای `OpenClawConfig` است. نام رسمی را ترجیح دهید.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
منسوخ‌سازی‌های سطح extension (داخل Pluginهای bundled کانال/ارائه‌دهنده در زیر
`extensions/`) داخل barrelهای `api.ts` و `runtime-api.ts`
خودشان رهگیری می‌شوند. آن‌ها روی قراردادهای Pluginهای شخص ثالث اثر نمی‌گذارند و در اینجا
فهرست نشده‌اند. اگر barrel محلی یک Plugin bundled را مستقیما مصرف می‌کنید، پیش از
ارتقا، توضیح‌های منسوخ‌سازی را در همان barrel بخوانید.
</Note>

## زمان‌بندی حذف

| زمان                   | چه اتفاقی می‌افتد                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **اکنون**                | سطوح منسوخ‌شده هشدارهای زمان اجرا صادر می‌کنند                               |
| **انتشار اصلی بعدی** | سطوح منسوخ‌شده حذف خواهند شد؛ Pluginهایی که همچنان از آن‌ها استفاده می‌کنند با خطا مواجه خواهند شد |

همه Pluginهای هسته از قبل مهاجرت داده شده‌اند. Pluginهای خارجی باید
پیش از انتشار اصلی بعدی مهاجرت کنند.

## غیرفعال‌کردن موقت هشدارها

هنگام کار روی مهاجرت، این متغیرهای محیطی را تنظیم کنید:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

این یک راه گریز موقت است، نه یک راه‌حل دائمی.

## مرتبط

- [شروع به کار](/fa/plugins/building-plugins) - نخستین plugin خود را بسازید
- [نمای کلی SDK](/fa/plugins/sdk-overview) - مرجع کامل import زیرمسیرها
- [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) - ساخت Pluginهای کانال
- [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) - ساخت Pluginهای ارائه‌دهنده
- [جزئیات داخلی Plugin](/fa/plugins/architecture) - بررسی عمیق معماری
- [مانیفست Plugin](/fa/plugins/manifest) - مرجع طرح‌واره مانیفست
