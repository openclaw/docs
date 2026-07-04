---
read_when:
    - هشدار OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED را می‌بینید
    - هشدار OPENCLAW_EXTENSION_API_DEPRECATED را می‌بینید
    - شما پیش از OpenClaw 2026.4.25 از api.registerEmbeddedExtensionFactory استفاده کرده‌اید
    - شما در حال به‌روزرسانی یک plugin به معماری مدرن plugin هستید
    - شما یک Plugin خارجی OpenClaw را نگهداری می‌کنید.
sidebarTitle: Migrate to SDK
summary: از لایهٔ سازگاری با نسخه‌های قدیمی به SDK مدرن Plugin مهاجرت کنید
title: مهاجرت SDK Plugin
x-i18n:
    generated_at: "2026-07-04T10:52:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7873de40aea56f456781ecf8ac9a4705c958030f7c68f8a112ad3f0fce62f078
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw از یک لایه گسترده سازگاری با نسخه‌های پیشین به معماری مدرن Plugin
با importهای متمرکز و مستند منتقل شده است. اگر Plugin شما پیش از معماری
جدید ساخته شده، این راهنما به شما کمک می‌کند مهاجرت کنید.

## چه چیزی تغییر می‌کند

سیستم قدیمی Plugin دو سطح بسیار باز فراهم می‌کرد که به Pluginها اجازه می‌داد
هر چیزی را که نیاز داشتند از یک نقطه ورود واحد import کنند:

- **`openclaw/plugin-sdk/compat`** - یک import واحد که ده‌ها
  کمک‌کننده را دوباره export می‌کرد. این برای فعال نگه داشتن Pluginهای قدیمی مبتنی بر hook
  در زمانی معرفی شد که معماری جدید Plugin در حال ساخت بود.
- **`openclaw/plugin-sdk/infra-runtime`** - یک barrel گسترده کمک‌کننده runtime که
  رویدادهای سیستم، وضعیت Heartbeat، صف‌های تحویل، کمک‌کننده‌های fetch/proxy،
  کمک‌کننده‌های فایل، نوع‌های approval و ابزارهای نامرتبط را با هم مخلوط می‌کرد.
- **`openclaw/plugin-sdk/config-runtime`** - یک barrel گسترده سازگاری config
  که هنوز در بازه مهاجرت، کمک‌کننده‌های منسوخ‌شده بارگذاری/نوشتن مستقیم را حمل می‌کند.
- **`openclaw/extension-api`** - پلی که به Pluginها دسترسی مستقیم به
  کمک‌کننده‌های سمت میزبان مانند اجراکننده agent تعبیه‌شده می‌داد.
- **`api.registerEmbeddedExtensionFactory(...)`** - یک hook حذف‌شده فقط مخصوص embedded-runner برای
  افزونه‌های bundled که می‌توانست رویدادهای embedded-runner مانند
  `tool_result` را مشاهده کند.

سطح‌های import گسترده اکنون **منسوخ شده‌اند**. آن‌ها هنوز در runtime کار می‌کنند،
اما Pluginهای جدید نباید از آن‌ها استفاده کنند، و Pluginهای موجود باید پیش از
حذف آن‌ها در انتشار major بعدی مهاجرت کنند. API ثبت کارخانه افزونه فقط مخصوص embedded-runner
حذف شده است؛ به‌جای آن از middleware نتیجه ابزار استفاده کنید.

OpenClaw رفتار مستند Plugin را در همان تغییری که جایگزین را معرفی می‌کند
حذف یا بازتفسیر نمی‌کند. تغییرات شکننده قرارداد باید ابتدا از
adapter سازگاری، diagnostics، مستندات، و یک بازه deprecation عبور کنند.
این موضوع درباره importهای SDK، فیلدهای manifest، APIهای setup، hookها، و رفتار
ثبت runtime صدق می‌کند.

<Warning>
  لایه سازگاری با نسخه‌های پیشین در یک انتشار major آینده حذف خواهد شد.
  Pluginهایی که همچنان از این سطح‌ها import می‌کنند، هنگام رخ دادن آن تغییر خواهند شکست.
  ثبت‌های legacy برای embedded extension factory از قبل دیگر بارگذاری نمی‌شوند.
</Warning>

## چرا این تغییر انجام شد

رویکرد قدیمی مشکلاتی ایجاد می‌کرد:

- **راه‌اندازی کند** - import کردن یک کمک‌کننده ده‌ها ماژول نامرتبط را بارگذاری می‌کرد
- **وابستگی‌های چرخه‌ای** - re-exportهای گسترده ساختن چرخه‌های import را آسان می‌کردند
- **سطح API نامشخص** - راهی برای تشخیص exportهای پایدار از داخلی وجود نداشت

SDK مدرن Plugin این مشکل را حل می‌کند: هر مسیر import (`openclaw/plugin-sdk/\<subpath\>`)
یک ماژول کوچک، خودبسنده، با هدف روشن و قرارداد مستند است.

درزهای راحتی legacy provider برای کانال‌های bundled نیز حذف شده‌اند.
درزهای کمک‌کننده با برند کانال shortcutهای خصوصی mono-repo بودند، نه
قراردادهای پایدار Plugin. به‌جای آن از زیرمسیرهای باریک و عمومی SDK استفاده کنید. داخل workspace
Pluginهای bundled، کمک‌کننده‌های متعلق به provider را در `api.ts` یا
`runtime-api.ts` خود همان Plugin نگه دارید.

نمونه‌های فعلی providerهای bundled:

- Anthropic کمک‌کننده‌های stream مخصوص Claude را در درز `api.ts` /
  `contract-api.ts` خودش نگه می‌دارد
- OpenAI سازنده‌های provider، کمک‌کننده‌های default-model، و سازنده‌های realtime provider
  را در `api.ts` خودش نگه می‌دارد
- OpenRouter سازنده provider و کمک‌کننده‌های onboarding/config را در
  `api.ts` خودش نگه می‌دارد

## برنامه مهاجرت Talk و صدای realtime

کد صدای realtime، تلفنی، جلسه، و Talk مرورگر از
حسابداری turn محلی هر سطح به کنترلر مشترک نشست Talk منتقل می‌شود که توسط
`openclaw/plugin-sdk/realtime-voice` export می‌شود. کنترلر جدید envelope مشترک رویداد Talk،
وضعیت turn فعال، وضعیت capture، وضعیت output-audio، تاریخچه رویدادهای اخیر،
و رد stale-turn را مالکیت می‌کند. Pluginهای provider باید همچنان مالک
نشست‌های realtime مخصوص vendor باشند؛ Pluginهای سطح باید همچنان مالک capture،
playback، تلفن، و ظرافت‌های جلسه باشند.

این مهاجرت Talk عمداً به‌صورت شکستن تمیز انجام می‌شود:

1. primitiveهای مشترک controller/runtime را در
   `plugin-sdk/realtime-voice` نگه دارید.
2. سطح‌های bundled را به کنترلر مشترک منتقل کنید: browser relay،
   managed-room handoff، voice-call realtime، voice-call streaming STT، Google
   Meet realtime، و native push-to-talk.
3. خانواده‌های قدیمی RPC Talk را با API نهایی `talk.session.*` و
   `talk.client.*` جایگزین کنید.
4. یک کانال رویداد زنده Talk را در Gateway
   `hello-ok.features.events` اعلام کنید: `talk.event`.
5. endpoint قدیمی HTTP realtime و هر مسیر override دستورالعمل در زمان درخواست را حذف کنید.

کد جدید نباید مستقیماً `createTalkEventSequencer(...)` را فراخوانی کند مگر اینکه
در حال پیاده‌سازی یک adapter سطح پایین یا fixture تست باشد. کنترلر مشترک را ترجیح دهید
تا رویدادهای محدود به turn نتوانند بدون شناسه turn منتشر شوند، فراخوانی‌های stale `turnEnd` /
`turnCancel` نتوانند turn فعال جدیدتر را پاک کنند، و رویدادهای lifecycle مربوط به output-audio
در تلفن، جلسات، browser relay، managed-room
handoff، و کلاینت‌های native Talk سازگار بمانند.

شکل API عمومی هدف چنین است:

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

نشست‌های WebRTC/provider-websocket متعلق به مرورگر از `talk.client.create` استفاده می‌کنند،
زیرا مرورگر مالک مذاکره provider و انتقال media است، در حالی که
Gateway مالک credentials، دستورالعمل‌ها، و policy ابزار است. `talk.session.*`
سطح مشترک مدیریت‌شده توسط Gateway برای gateway-relay realtime، gateway-relay
transcription، و نشست‌های native STT/TTS در managed-room است.

configهای legacy که selectorهای realtime را کنار `talk.provider` /
`talk.providers` قرار داده‌اند باید با `openclaw doctor --fix` تعمیر شوند؛ runtime Talk
config provider مربوط به speech/TTS را به‌عنوان config provider realtime بازتفسیر نمی‌کند.

ترکیب‌های پشتیبانی‌شده `talk.session.create` عمداً کوچک هستند:

| حالت            | انتقال          | Brain           | مالک               | یادداشت‌ها                                                                                                            |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | صدای full-duplex provider از طریق Gateway پل می‌شود؛ فراخوانی‌های ابزار از طریق ابزار agent-consult مسیریابی می‌شوند. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | فقط streaming STT؛ فراخوان‌ها صدای ورودی می‌فرستند و رویدادهای transcript دریافت می‌کنند.                         |
| `stt-tts`       | `managed-room`  | `agent-consult` | اتاق native/client | اتاق‌های سبک push-to-talk و walkie-talkie که کلاینت مالک capture/playback و Gateway مالک وضعیت turn است.         |
| `stt-tts`       | `managed-room`  | `direct-tools`  | اتاق native/client | حالت اتاق فقط برای admin برای سطح‌های first-party مورداعتماد که actionهای ابزار Gateway را مستقیماً اجرا می‌کنند. |

نگاشت methodهای حذف‌شده:

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

واژگان کنترل یکپارچه نیز عمداً باریک است:

  | روش                          | اعمال می‌شود به                                              | قرارداد                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | یک قطعه صوتی PCM با کدگذاری base64 را به نشست ارائه‌دهنده که متعلق به همان اتصال Gateway است اضافه می‌کند.                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | یک نوبت کاربر در اتاق مدیریت‌شده را شروع می‌کند.                                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | پس از اعتبارسنجی نوبت کهنه، نوبت فعال را پایان می‌دهد.                                                                                                                                         |
  | `talk.session.cancelTurn`       | همه نشست‌های متعلق به Gateway                              | کار فعال ضبط/ارائه‌دهنده/عامل/TTS را برای یک نوبت لغو می‌کند.                                                                                                                                |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | خروجی صوتی دستیار را بدون اینکه لزوماً نوبت کاربر پایان یابد متوقف می‌کند.                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | یک فراخوانی ابزار ارائه‌دهنده را که توسط رله منتشر شده کامل می‌کند؛ برای خروجی موقت `options.willContinue` یا برای برآورده کردن فراخوانی بدون پاسخ دیگری از دستیار، `options.suppressResponse` را ارسال کنید. |
  | `talk.session.steer`            | نشست‌های Talk پشتیبانی‌شده با عامل                              | کنترل گفتاری `status`، `steer`، `cancel` یا `followup` را به اجرای تعبیه‌شده فعال که از نشست Talk تعیین شده است ارسال می‌کند.                                                                |
  | `talk.session.close`            | همه نشست‌های یکپارچه                                    | نشست‌های رله را متوقف می‌کند یا وضعیت اتاق مدیریت‌شده را لغو می‌کند، سپس شناسه نشست یکپارچه را فراموش می‌کند.                                                                                                    |

  برای کار کردن این قابلیت، موارد ویژه ارائه‌دهنده یا پلتفرم را وارد هسته نکنید.
  هسته مالک معناشناسی نشست Talk است. Pluginهای ارائه‌دهنده مالک راه‌اندازی نشست فروشنده هستند.
  تماس صوتی و Google Meet مالک آداپتورهای تلفنی/جلسه هستند. مرورگر و برنامه‌های بومی
  مالک تجربه کاربری ضبط/پخش دستگاه هستند.

  ## سیاست سازگاری

  برای Pluginهای خارجی، کار سازگاری به این ترتیب انجام می‌شود:

  1. قرارداد جدید را اضافه کنید
  2. رفتار قدیمی را از طریق یک آداپتور سازگاری متصل نگه دارید
  3. یک عیب‌یابی یا هشدار منتشر کنید که مسیر قدیمی و جایگزین را نام می‌برد
  4. هر دو مسیر را در آزمون‌ها پوشش دهید
  5. مسیر منسوخ‌سازی و مهاجرت را مستند کنید
  6. فقط پس از پنجره مهاجرت اعلام‌شده، معمولاً در یک انتشار اصلی، حذف کنید

  نگه‌دارندگان می‌توانند صف مهاجرت فعلی را با
  `pnpm plugins:boundary-report` بررسی کنند. برای شمارش‌های فشرده از `pnpm plugins:boundary-report:summary`،
  برای یک Plugin یا مالک سازگاری از `--owner <id>`، و زمانی که یک دروازه CI باید روی رکوردهای
  سازگاری موعددار، واردسازی‌های SDK رزروشده میان‌مالکی، یا زیرمسیرهای SDK رزروشده استفاده‌نشده شکست بخورد از
  `pnpm plugins:boundary-report:ci` استفاده کنید. گزارش، رکوردهای سازگاری منسوخ‌شده را بر اساس تاریخ حذف گروه‌بندی می‌کند، ارجاع‌های کد/مستندات محلی را می‌شمارد،
  واردسازی‌های SDK رزروشده میان‌مالکی را آشکار می‌کند، و پل SDK خصوصی میزبان حافظه را خلاصه می‌کند تا پاک‌سازی سازگاری به‌جای
  تکیه بر جست‌وجوهای موردی، صریح باقی بماند. زیرمسیرهای SDK رزروشده باید استفاده مالک ردیابی‌شده داشته باشند؛
  خروجی‌های کمکی رزروشده استفاده‌نشده باید از SDK عمومی حذف شوند.

  اگر یک فیلد مانیفست همچنان پذیرفته می‌شود، نویسندگان Plugin می‌توانند تا زمانی که
  مستندات و عیب‌یابی‌ها خلاف آن را بگویند به استفاده از آن ادامه دهند. کد جدید باید جایگزین مستندشده را ترجیح دهد،
  اما Pluginهای موجود نباید در طول انتشارهای جزئی عادی خراب شوند.

  ## شیوه مهاجرت

  <Steps>
  <Step title="مهاجرت helperهای بارگذاری/نوشتن پیکربندی زمان اجرا">
    Pluginهای همراه باید فراخوانی مستقیم
    `api.runtime.config.loadConfig()` و
    `api.runtime.config.writeConfigFile(...)` را متوقف کنند. پیکربندی‌ای را ترجیح دهید که
    از قبل به مسیر فراخوانی فعال ارسال شده است. handlerهای بلندمدتی که به snapshot فرایند فعلی نیاز دارند
    می‌توانند از `api.runtime.config.current()` استفاده کنند. ابزارهای عامل بلندمدت باید از `ctx.getRuntimeConfig()` متن ابزار درون
    `execute` استفاده کنند تا ابزاری که قبل از نوشتن پیکربندی ساخته شده همچنان پیکربندی زمان اجرای تازه‌شده را ببیند.

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

    هنگامی که فراخواننده می‌داند تغییر به راه‌اندازی مجدد تمیز Gateway نیاز دارد از `afterWrite: { mode: "restart", reason: "..." }` استفاده کنید، و
    فقط هنگامی از `afterWrite: { mode: "none", reason: "..." }` استفاده کنید که فراخواننده مالک
    پیگیری است و عمداً می‌خواهد برنامه‌ریز بارگذاری مجدد را سرکوب کند.
    نتایج mutation شامل یک خلاصه `followUp` تایپ‌شده برای آزمون‌ها و ثبت رویدادها است؛
    Gateway همچنان مسئول اعمال یا زمان‌بندی راه‌اندازی مجدد است.
    `loadConfig` و `writeConfigFile` در طول پنجره مهاجرت به‌عنوان
    helperهای سازگاری منسوخ‌شده برای Pluginهای خارجی باقی می‌مانند و یک‌بار با
    کد سازگاری `runtime-config-load-write` هشدار می‌دهند. Pluginهای همراه و کد زمان اجرای repo
    با guardrailهای پویشگر در
    `pnpm check:deprecated-api-usage` و
    `pnpm check:no-runtime-action-load-config` محافظت می‌شوند: استفاده جدید Plugin تولیدی
    کاملاً شکست می‌خورد، نوشتن مستقیم پیکربندی شکست می‌خورد، متدهای سرور Gateway باید از
    snapshot زمان اجرای درخواست استفاده کنند، helperهای ارسال/اقدام/کلاینت کانال زمان اجرا
    باید پیکربندی را از مرز خود دریافت کنند، و ماژول‌های زمان اجرای بلندمدت
    هیچ فراخوانی محیطی مجاز `loadConfig()` ندارند.

    کد Plugin جدید باید همچنین از وارد کردن barrel سازگاری گسترده
    `openclaw/plugin-sdk/config-runtime` پرهیز کند. از زیرمسیر محدود
    SDK که با کار مطابقت دارد استفاده کنید:

    | نیاز | واردسازی |
    | --- | --- |
    | نوع‌های پیکربندی مانند `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | assertionهای پیکربندی ازپیش‌بارگذاری‌شده و جست‌وجوی پیکربندی ورودی Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | خواندن snapshot زمان اجرای فعلی | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | نوشتن پیکربندی | `openclaw/plugin-sdk/config-mutation` |
    | helperهای ذخیره نشست | `openclaw/plugin-sdk/session-store-runtime` |
    | پیکربندی جدول Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | helperهای زمان اجرای سیاست گروه | `openclaw/plugin-sdk/runtime-group-policy` |
    | حل ورودی محرمانه | `openclaw/plugin-sdk/secret-input-runtime` |
    | بازنویسی‌های مدل/نشست | `openclaw/plugin-sdk/model-session-runtime` |

    Pluginهای همراه و آزمون‌هایشان با پویشگر در برابر barrel گسترده محافظت می‌شوند
    تا واردسازی‌ها و mockها نسبت به رفتار موردنیازشان محلی بمانند. barrel گسترده
    همچنان برای سازگاری خارجی وجود دارد، اما کد جدید نباید
    به آن وابسته باشد.

  </Step>

  <Step title="مهاجرت افزونه‌های نتیجه ابزار تعبیه‌شده به middleware">
    Pluginهای همراه باید handlerهای نتیجه ابزار
    `api.registerEmbeddedExtensionFactory(...)` مخصوص runner تعبیه‌شده را با
    middleware خنثی نسبت به زمان اجرا جایگزین کنند.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    هم‌زمان مانیفست Plugin را به‌روزرسانی کنید:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Pluginهای نصب‌شده نیز می‌توانند middleware نتیجه ابزار را ثبت کنند، زمانی که
    صریحاً فعال شده باشند و هر زمان اجرای هدف‌گذاری‌شده را در
    `contracts.agentToolResultMiddleware` اعلام کنند. ثبت‌های middleware نصب‌شده اعلام‌نشده
    رد می‌شوند.

  </Step>

  <Step title="مهاجرت handlerهای بومی تأیید به factهای قابلیت">
    Pluginهای کانال دارای قابلیت تأیید اکنون رفتار تأیید بومی را از طریق
    `approvalCapability.nativeRuntime` به‌علاوه رجیستری مشترک runtime-context آشکار می‌کنند.

    تغییرات کلیدی:

    - `approvalCapability.handler.loadRuntime(...)` را با
      `approvalCapability.nativeRuntime` جایگزین کنید
    - auth/delivery مخصوص تأیید را از سیم‌کشی قدیمی `plugin.auth` /
      `plugin.approvals` به `approvalCapability` منتقل کنید
    - `ChannelPlugin.approvals` از قرارداد عمومی channel-plugin
      حذف شده است؛ فیلدهای delivery/native/render را به `approvalCapability` منتقل کنید
    - `plugin.auth` فقط برای جریان‌های ورود/خروج کانال باقی می‌ماند؛ hookهای auth تأیید
      دیگر در آنجا توسط هسته خوانده نمی‌شوند
    - اشیای زمان اجرای متعلق به کانال مانند کلاینت‌ها، tokenها، یا برنامه‌های Bolt را از طریق `openclaw/plugin-sdk/channel-runtime-context` ثبت کنید
    - اعلان‌های reroute متعلق به Plugin را از handlerهای تأیید بومی ارسال نکنید؛
      هسته اکنون مالک اعلان‌های routed-elsewhere از نتایج واقعی تحویل است
    - هنگام ارسال `channelRuntime` به `createChannelManager(...)`، یک
      سطح واقعی `createPluginRuntime().channel` ارائه کنید. stubهای جزئی رد می‌شوند.

    برای چیدمان فعلی قابلیت تأیید، `/plugins/sdk-channel-plugins` را ببینید.

  </Step>

  <Step title="بازرسی رفتار fallback wrapper ویندوز">
    اگر Plugin شما از `openclaw/plugin-sdk/windows-spawn` استفاده می‌کند، wrapperهای `.cmd`/`.bat` حل‌نشده ویندوز
    اکنون به‌صورت fail closed شکست می‌خورند مگر اینکه صریحاً
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

    اگر فراخواننده شما عمداً به shell fallback متکی نیست،
    `allowShellFallback` را تنظیم نکنید و در عوض خطای پرتاب‌شده را مدیریت کنید.

  </Step>

  <Step title="یافتن واردسازی‌های منسوخ‌شده">
    Plugin خود را برای واردسازی از هر یک از سطح‌های منسوخ‌شده جست‌وجو کنید:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="جایگزینی با واردسازی‌های متمرکز">
    هر export از سطح قدیمی به یک مسیر واردسازی مدرن مشخص نگاشت می‌شود:

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

    برای helperهای سمت میزبان، به‌جای واردسازی مستقیم از زمان اجرای Plugin تزریق‌شده استفاده کنید:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    همین الگو برای سایر کمک‌کننده‌های bridge قدیمی نیز اعمال می‌شود:

    | ایمپورت قدیمی | معادل مدرن |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | کمک‌کننده‌های ذخیره‌سازی نشست | `api.runtime.agent.session.*` |

  </Step>

  <Step title="جایگزینی ایمپورت‌های گسترده infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` همچنان برای سازگاری خارجی وجود دارد،
    اما کد جدید باید سطح کمک‌کننده متمرکزی را ایمپورت کند که واقعا به آن نیاز دارد:

    | نیاز | ایمپورت |
    | --- | --- |
    | کمک‌کننده‌های صف رویداد سیستم | `openclaw/plugin-sdk/system-event-runtime` |
    | کمک‌کننده‌های بیدارسازی، رویداد، و مشاهده‌پذیری Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | تخلیه صف تحویل در انتظار | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | تله‌متری فعالیت کانال | `openclaw/plugin-sdk/channel-activity-runtime` |
    | کش‌های حذف تکراری درون‌حافظه‌ای و مبتنی بر پایداری | `openclaw/plugin-sdk/dedupe-runtime` |
    | کمک‌کننده‌های امن مسیر فایل/رسانه محلی | `openclaw/plugin-sdk/file-access-runtime` |
    | fetch آگاه از dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | کمک‌کننده‌های پروکسی و fetch محافظت‌شده | `openclaw/plugin-sdk/fetch-runtime` |
    | انواع سیاست dispatcher برای SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | انواع درخواست/حل تأیید | `openclaw/plugin-sdk/approval-runtime` |
    | کمک‌کننده‌های payload پاسخ تأیید و فرمان | `openclaw/plugin-sdk/approval-reply-runtime` |
    | کمک‌کننده‌های قالب‌بندی خطا | `openclaw/plugin-sdk/error-runtime` |
    | انتظارهای آماده‌بودن ترابری | `openclaw/plugin-sdk/transport-ready-runtime` |
    | کمک‌کننده‌های token امن | `openclaw/plugin-sdk/secure-random-runtime` |
    | همزمانی محدودشده وظیفه async | `openclaw/plugin-sdk/concurrency-runtime` |
    | تبدیل عددی | `openclaw/plugin-sdk/number-runtime` |
    | قفل async محلی فرایند | `openclaw/plugin-sdk/async-lock-runtime` |
    | قفل‌های فایل | `openclaw/plugin-sdk/file-lock` |

    Pluginهای همراه در برابر `infra-runtime` با اسکنر محافظت می‌شوند، بنابراین کد مخزن
    نمی‌تواند دوباره به barrel گسترده برگردد.

  </Step>

  <Step title="مهاجرت کمک‌کننده‌های مسیر کانال">
    کد جدید مسیر کانال باید از `openclaw/plugin-sdk/channel-route` استفاده کند.
    نام‌های قدیمی‌تر route-key و comparable-target در طول بازه مهاجرت به‌عنوان aliasهای
    سازگاری باقی می‌مانند، اما Pluginهای جدید باید از نام‌های مسیر استفاده کنند
    که رفتار را مستقیما توصیف می‌کنند:

    | کمک‌کننده قدیمی | کمک‌کننده مدرن |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    کمک‌کننده‌های مدرن مسیر، `{ channel, to, accountId, threadId }` را
    در تأییدهای native، سرکوب پاسخ، حذف تکراری ورودی،
    تحویل Cron، و مسیریابی نشست به‌صورت سازگار نرمال‌سازی می‌کنند.

    کاربردهای جدیدی از `ChannelMessagingAdapter.parseExplicitTarget` یا
    کمک‌کننده‌های loaded-route مبتنی بر parser (`parseExplicitTargetForLoadedChannel`
    یا `resolveRouteTargetForLoadedChannel`) یا
    `resolveChannelRouteTargetWithParser(...)` از `plugin-sdk/channel-route` اضافه نکنید.
    این hookها منسوخ شده‌اند و فقط برای Pluginهای قدیمی‌تر در طول بازه
    مهاجرت باقی می‌مانند. Pluginهای کانال جدید باید از
    `messaging.targetResolver.resolveTarget(...)` برای نرمال‌سازی شناسه هدف
    و fallback در صورت نبودن دایرکتوری، از `messaging.inferTargetChatType(...)` زمانی که core
    به نوع peer زودهنگام نیاز دارد، و از `messaging.resolveOutboundSessionRoute(...)`
    برای نشست provider-native و هویت thread استفاده کنند.

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
  | مسیر import | هدف | exportهای کلیدی |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | کمکی ورودی رسمی Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | re-export چتری قدیمی برای تعریف‌ها/سازنده‌های ورودی کانال | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | export اسکیما پیکربندی ریشه | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | کمکی ورودی تک‌ارائه‌دهنده | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعریف‌ها و سازنده‌های متمرکز ورودی کانال | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | کمکی‌های مشترک جادوگر راه‌اندازی | مترجم راه‌اندازی، اعلان‌های فهرست مجاز، سازنده‌های وضعیت راه‌اندازی |
  | `plugin-sdk/setup-runtime` | کمکی‌های زمان اجرای زمان راه‌اندازی | `createSetupTranslator`, آداپتورهای وصله راه‌اندازی ایمن برای import، کمکی‌های یادداشت جست‌وجو، `promptResolvedAllowFrom`, `splitSetupEntries`, پروکسی‌های راه‌اندازی واگذارشده |
  | `plugin-sdk/setup-adapter-runtime` | نام مستعار آداپتور راه‌اندازی منسوخ‌شده | از `plugin-sdk/setup-runtime` استفاده کنید |
  | `plugin-sdk/setup-tools` | کمکی‌های ابزارسازی راه‌اندازی | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | کمکی‌های چندحسابی | کمکی‌های فهرست حساب/پیکربندی/گیت اقدام |
  | `plugin-sdk/account-id` | کمکی‌های شناسه حساب | `DEFAULT_ACCOUNT_ID`, عادی‌سازی شناسه حساب |
  | `plugin-sdk/account-resolution` | کمکی‌های جست‌وجوی حساب | کمکی‌های جست‌وجوی حساب + پشتیبان پیش‌فرض |
  | `plugin-sdk/account-helpers` | کمکی‌های محدود حساب | کمکی‌های فهرست حساب/اقدام حساب |
  | `plugin-sdk/channel-setup` | آداپتورهای جادوگر راه‌اندازی | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, به‌علاوه `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | پایه‌های جفت‌سازی DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | سیم‌کشی پیشوند پاسخ، تایپ، و تحویل منبع | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | کارخانه‌های آداپتور پیکربندی و کمکی‌های دسترسی DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | سازنده‌های اسکیما پیکربندی | فقط پایه‌های اسکیما پیکربندی مشترک کانال و سازنده عمومی |
  | `plugin-sdk/bundled-channel-config-schema` | اسکیماهای پیکربندی باندل‌شده | فقط Pluginهای باندل‌شده نگه‌داری‌شده توسط OpenClaw؛ Pluginهای جدید باید اسکیماهای محلی Plugin را تعریف کنند |
  | `plugin-sdk/channel-config-schema-legacy` | اسکیماهای پیکربندی باندل‌شده منسوخ‌شده | فقط نام مستعار سازگاری؛ برای Pluginهای باندل‌شده نگه‌داری‌شده از `plugin-sdk/bundled-channel-config-schema` استفاده کنید |
  | `plugin-sdk/telegram-command-config` | کمکی‌های پیکربندی فرمان Telegram | عادی‌سازی نام فرمان، کوتاه‌سازی توضیح، اعتبارسنجی تکرار/تداخل |
  | `plugin-sdk/channel-policy` | حل سیاست گروه/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | نمای سازگاری منسوخ‌شده | از `plugin-sdk/channel-outbound` استفاده کنید |
  | `plugin-sdk/inbound-envelope` | کمکی‌های پاکت ورودی | کمکی‌های مشترک سازنده مسیر + پاکت |
  | `plugin-sdk/channel-inbound` | کمکی‌های دریافت ورودی | ساخت زمینه، قالب‌بندی، ریشه‌ها، اجراکننده‌ها، ارسال پاسخ آماده، و گزاره‌های ارسال |
  | `plugin-sdk/messaging-targets` | مسیر import منسوخ‌شده برای تجزیه هدف | برای کمکی‌های عمومی تجزیه هدف از `plugin-sdk/channel-targets`، برای مقایسه مسیر از `plugin-sdk/channel-route`، و برای حل هدف ویژه ارائه‌دهنده از `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` متعلق به Plugin استفاده کنید |
  | `plugin-sdk/outbound-media` | کمکی‌های رسانه خروجی | بارگذاری رسانه خروجی مشترک |
  | `plugin-sdk/outbound-send-deps` | نمای سازگاری منسوخ‌شده | از `plugin-sdk/channel-outbound` استفاده کنید |
  | `plugin-sdk/channel-outbound` | کمکی‌های چرخه عمر پیام خروجی | آداپتورهای پیام، رسیدها، کمکی‌های ارسال بادوام، کمکی‌های پیش‌نمایش زنده/استریم، گزینه‌های پاسخ، کمکی‌های چرخه عمر، هویت خروجی، و برنامه‌ریزی payload |
  | `plugin-sdk/channel-streaming` | نمای سازگاری منسوخ‌شده | از `plugin-sdk/channel-outbound` استفاده کنید |
  | `plugin-sdk/outbound-runtime` | نمای سازگاری منسوخ‌شده | از `plugin-sdk/channel-outbound` استفاده کنید |
  | `plugin-sdk/thread-bindings-runtime` | کمکی‌های اتصال رشته | کمکی‌های چرخه عمر و آداپتور اتصال رشته |
  | `plugin-sdk/agent-media-payload` | کمکی‌های payload رسانه قدیمی | سازنده payload رسانه عامل برای چیدمان‌های فیلد قدیمی |
  | `plugin-sdk/channel-runtime` | لایه سازگاری منسوخ‌شده | فقط ابزارهای زمان اجرای کانال قدیمی |
  | `plugin-sdk/channel-send-result` | انواع نتیجه ارسال | انواع نتیجه پاسخ |
  | `plugin-sdk/runtime-store` | ذخیره‌سازی پایدار Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | کمکی‌های گسترده زمان اجرا | کمکی‌های زمان اجرا/لاگ‌گیری/پشتیبان‌گیری/نصب Plugin |
  | `plugin-sdk/runtime-env` | کمکی‌های محدود محیط زمان اجرا | کمکی‌های لاگر/محیط زمان اجرا، مهلت زمانی، تلاش مجدد، و عقب‌نشینی |
  | `plugin-sdk/plugin-runtime` | کمکی‌های مشترک زمان اجرای Plugin | کمکی‌های فرمان‌ها/هوک‌ها/http/تعاملی Plugin |
  | `plugin-sdk/hook-runtime` | کمکی‌های خط لوله هوک | کمکی‌های مشترک خط لوله Webhook/هوک داخلی |
  | `plugin-sdk/lazy-runtime` | کمکی‌های زمان اجرای تنبل | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | کمکی‌های فرایند | کمکی‌های مشترک exec |
  | `plugin-sdk/cli-runtime` | کمکی‌های زمان اجرای CLI | قالب‌بندی فرمان، انتظارها، کمکی‌های نسخه |
  | `plugin-sdk/gateway-runtime` | کمکی‌های Gateway | کلاینت Gateway، کمکی شروع آماده حلقه رویداد، حل میزبان LAN اعلام‌شده، و کمکی‌های وصله وضعیت کانال |
  | `plugin-sdk/config-runtime` | لایه سازگاری پیکربندی منسوخ‌شده | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, و `config-mutation` را ترجیح دهید |
  | `plugin-sdk/telegram-command-config` | کمکی‌های فرمان Telegram | کمکی‌های اعتبارسنجی فرمان Telegram پایدار با پشتیبان، زمانی که سطح قرارداد Telegram باندل‌شده در دسترس نیست |
  | `plugin-sdk/approval-runtime` | کمکی‌های اعلان تأیید | payload تأیید Exec/Plugin، کمکی‌های قابلیت/نمایه تأیید، کمکی‌های مسیریابی/زمان اجرای تأیید بومی، و قالب‌بندی مسیر نمایش تأیید ساختاریافته |
  | `plugin-sdk/approval-auth-runtime` | کمکی‌های احراز هویت تأیید | حل تأییدکننده، احراز هویت اقدام در همان چت |
  | `plugin-sdk/approval-client-runtime` | کمکی‌های کلاینت تأیید | کمکی‌های نمایه/فیلتر تأیید Exec بومی |
  | `plugin-sdk/approval-delivery-runtime` | کمکی‌های تحویل تأیید | آداپتورهای قابلیت/تحویل تأیید بومی |
  | `plugin-sdk/approval-gateway-runtime` | کمکی‌های Gateway تأیید | کمکی مشترک حل Gateway تأیید |
  | `plugin-sdk/approval-handler-adapter-runtime` | کمکی‌های آداپتور تأیید | کمکی‌های سبک بارگذاری آداپتور تأیید بومی برای نقطه‌های ورود داغ کانال |
  | `plugin-sdk/approval-handler-runtime` | کمکی‌های هندلر تأیید | کمکی‌های گسترده‌تر زمان اجرای هندلر تأیید؛ وقتی آستانه‌های محدودتر آداپتور/Gateway کافی هستند آن‌ها را ترجیح دهید |
  | `plugin-sdk/approval-native-runtime` | کمکی‌های هدف تأیید | کمکی‌های اتصال هدف/حساب تأیید بومی |
  | `plugin-sdk/approval-reply-runtime` | کمکی‌های پاسخ تأیید | کمکی‌های payload پاسخ تأیید Exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | کمکی‌های زمینه زمان اجرای کانال | کمکی‌های عمومی ثبت/دریافت/تماشای زمینه زمان اجرای کانال |
  | `plugin-sdk/security-runtime` | کمکی‌های امنیت | کمکی‌های مشترک اعتماد، گیت‌گذاری DM، فایل/مسیر محدود به ریشه، محتوای خارجی، و گردآوری secret |
  | `plugin-sdk/ssrf-policy` | کمکی‌های سیاست SSRF | کمکی‌های فهرست مجاز میزبان و سیاست شبکه خصوصی |
  | `plugin-sdk/ssrf-runtime` | کمکی‌های زمان اجرای SSRF | کمکی‌های دیسپچر سنجاق‌شده، fetch محافظت‌شده، سیاست SSRF |
  | `plugin-sdk/system-event-runtime` | کمکی‌های رویداد سیستم | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | کمکی‌های Heartbeat | کمکی‌های بیدارسازی، رویداد، و مشاهده‌پذیری Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | کمکی‌های صف تحویل | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | کمکی‌های فعالیت کانال | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | کمکی‌های حذف تکراری | کش‌های حذف تکراری درون‌حافظه‌ای و پشتوانه‌دار با ذخیره‌سازی پایدار |
  | `plugin-sdk/file-access-runtime` | کمکی‌های دسترسی فایل | کمکی‌های ایمن مسیر فایل/رسانه محلی |
  | `plugin-sdk/transport-ready-runtime` | کمکی‌های آمادگی انتقال | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | کمکی‌های سیاست تأیید Exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | کمکی‌های کش محدود | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | کمکی‌های گیت‌گذاری عیب‌یابی | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | کمکی‌های قالب‌بندی خطا | `formatUncaughtError`, `isApprovalNotFoundError`, کمکی‌های گراف خطا |
  | `plugin-sdk/fetch-runtime` | کمکی‌های fetch/proxy پوشش‌دار | `resolveFetch`, کمکی‌های proxy، کمکی‌های گزینه EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | کمکی‌های عادی‌سازی میزبان | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | کمکی‌های تلاش مجدد | `RetryConfig`, `retryAsync`, اجراکننده‌های سیاست |
  | `plugin-sdk/allow-from` | قالب‌بندی فهرست مجاز و نگاشت ورودی | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | کمکی‌های گیت‌گذاری فرمان و سطح فرمان | `resolveControlCommandGate`, کمکی‌های مجوزدهی فرستنده، کمکی‌های رجیستری فرمان شامل قالب‌بندی منوی آرگومان پویا |
  | `plugin-sdk/command-status` | رندرکننده‌های وضعیت/راهنمای فرمان | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | تجزیه ورودی secret | کمکی‌های ورودی secret |
  | `plugin-sdk/webhook-ingress` | کمکی‌های درخواست Webhook | ابزارهای هدف Webhook |
  | `plugin-sdk/webhook-request-guards` | کمکی‌های محافظ بدنه Webhook | کمکی‌های خواندن/محدودسازی بدنه درخواست |
  | `plugin-sdk/reply-runtime` | زمان اجرای مشترک پاسخ | ارسال ورودی، Heartbeat، برنامه‌ریز پاسخ، قطعه‌بندی |
  | `plugin-sdk/reply-dispatch-runtime` | کمکی‌های محدود ارسال پاسخ | نهایی‌سازی، ارسال ارائه‌دهنده، و کمکی‌های برچسب مکالمه |
  | `plugin-sdk/reply-history` | کمکی‌های تاریخچه پاسخ | `createChannelHistoryWindow`; exportهای سازگاری منسوخ‌شده کمکی map مانند `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, و `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | برنامه‌ریزی مرجع پاسخ | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | کمکی‌های قطعه پاسخ | کمکی‌های قطعه‌بندی متن/markdown |
  | `plugin-sdk/session-store-runtime` | کمکی‌های ذخیره نشست | کمکی‌های مسیر ذخیره + به‌روزرسانی‌شده در |
  | `plugin-sdk/state-paths` | کمکی‌های مسیر وضعیت | کمکی‌های دایرکتوری وضعیت و OAuth |
  | `plugin-sdk/routing` | کمک‌کننده‌های مسیریابی/کلید نشست | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`، کمک‌کننده‌های عادی‌سازی کلید نشست |
  | `plugin-sdk/status-helpers` | کمک‌کننده‌های وضعیت کانال | سازنده‌های خلاصه وضعیت کانال/حساب، پیش‌فرض‌های وضعیت زمان اجرا، کمک‌کننده‌های فراداده مسئله |
  | `plugin-sdk/target-resolver-runtime` | کمک‌کننده‌های حل‌کننده هدف | کمک‌کننده‌های مشترک حل‌کننده هدف |
  | `plugin-sdk/string-normalization-runtime` | کمک‌کننده‌های عادی‌سازی رشته | کمک‌کننده‌های عادی‌سازی اسلاگ/رشته |
  | `plugin-sdk/request-url` | کمک‌کننده‌های URL درخواست | استخراج URLهای رشته‌ای از ورودی‌های شبیه درخواست |
  | `plugin-sdk/run-command` | کمک‌کننده‌های فرمان زمان‌دار | اجراکننده فرمان زمان‌دار با stdout/stderr عادی‌شده |
  | `plugin-sdk/param-readers` | خواننده‌های پارامتر | خواننده‌های مشترک پارامتر ابزار/CLI |
  | `plugin-sdk/tool-payload` | استخراج محموله ابزار | استخراج محموله‌های عادی‌شده از اشیای نتیجه ابزار |
  | `plugin-sdk/tool-send` | استخراج ارسال ابزار | استخراج فیلدهای متعارف هدف ارسال از آرگومان‌های ابزار |
  | `plugin-sdk/temp-path` | کمک‌کننده‌های مسیر موقت | کمک‌کننده‌های مشترک مسیر بارگیری موقت |
  | `plugin-sdk/logging-core` | کمک‌کننده‌های ثبت گزارش | کمک‌کننده‌های ثبت‌گر زیرسامانه و پنهان‌سازی |
  | `plugin-sdk/markdown-table-runtime` | کمک‌کننده‌های جدول Markdown | کمک‌کننده‌های حالت جدول Markdown |
  | `plugin-sdk/reply-payload` | انواع پاسخ پیام | انواع محموله پاسخ |
  | `plugin-sdk/provider-setup` | کمک‌کننده‌های گزینش‌شده راه‌اندازی تامین‌کننده محلی/خودمیزبان | کمک‌کننده‌های کشف/پیکربندی تامین‌کننده خودمیزبان |
  | `plugin-sdk/self-hosted-provider-setup` | کمک‌کننده‌های متمرکز راه‌اندازی تامین‌کننده خودمیزبان سازگار با OpenAI | همان کمک‌کننده‌های کشف/پیکربندی تامین‌کننده خودمیزبان |
  | `plugin-sdk/provider-auth-runtime` | کمک‌کننده‌های احراز هویت زمان اجرای تامین‌کننده | کمک‌کننده‌های رفع API-key در زمان اجرا |
  | `plugin-sdk/provider-auth-api-key` | کمک‌کننده‌های راه‌اندازی API-key تامین‌کننده | کمک‌کننده‌های ورود اولیه/نوشتن پروفایل API-key |
  | `plugin-sdk/provider-auth-result` | کمک‌کننده‌های نتیجه احراز هویت تامین‌کننده | سازنده استاندارد نتیجه احراز هویت OAuth |
  | `plugin-sdk/provider-selection-runtime` | کمک‌کننده‌های انتخاب تامین‌کننده | انتخاب تامین‌کننده پیکربندی‌شده یا خودکار و ادغام پیکربندی خام تامین‌کننده |
  | `plugin-sdk/provider-env-vars` | کمک‌کننده‌های متغیرهای محیطی تامین‌کننده | کمک‌کننده‌های جست‌وجوی متغیر محیطی احراز هویت تامین‌کننده |
  | `plugin-sdk/provider-model-shared` | کمک‌کننده‌های مشترک مدل/بازپخش تامین‌کننده | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`، سازنده‌های مشترک سیاست بازپخش، کمک‌کننده‌های نقطه پایانی تامین‌کننده، و کمک‌کننده‌های عادی‌سازی شناسه مدل |
  | `plugin-sdk/provider-catalog-shared` | کمک‌کننده‌های مشترک کاتالوگ تامین‌کننده | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | وصله‌های ورود اولیه تامین‌کننده | کمک‌کننده‌های پیکربندی ورود اولیه |
  | `plugin-sdk/provider-http` | کمک‌کننده‌های HTTP تامین‌کننده | کمک‌کننده‌های عمومی قابلیت HTTP/نقطه پایانی تامین‌کننده، شامل کمک‌کننده‌های فرم چندبخشی رونویسی صوت |
  | `plugin-sdk/provider-web-fetch` | کمک‌کننده‌های web-fetch تامین‌کننده | کمک‌کننده‌های ثبت/کش تامین‌کننده web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | کمک‌کننده‌های پیکربندی web-search تامین‌کننده | کمک‌کننده‌های محدود پیکربندی/اعتبارنامه web-search برای تامین‌کنندگانی که به سیم‌کشی فعال‌سازی plugin نیاز ندارند |
  | `plugin-sdk/provider-web-search-contract` | کمک‌کننده‌های قرارداد web-search تامین‌کننده | کمک‌کننده‌های محدود قرارداد پیکربندی/اعتبارنامه web-search مانند `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، و تنظیم‌کننده‌ها/گیرنده‌های اعتبارنامه با دامنه مشخص |
  | `plugin-sdk/provider-web-search` | کمک‌کننده‌های web-search تامین‌کننده | کمک‌کننده‌های ثبت/کش/زمان اجرای تامین‌کننده web-search |
  | `plugin-sdk/provider-tools` | کمک‌کننده‌های سازگاری ابزار/اسکیمای تامین‌کننده | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، و پاک‌سازی + عیب‌یابی اسکیمای DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | کمک‌کننده‌های مصرف تامین‌کننده | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`، و دیگر کمک‌کننده‌های مصرف تامین‌کننده |
  | `plugin-sdk/provider-stream` | کمک‌کننده‌های پوشش‌دهنده استریم تامین‌کننده | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، انواع پوشش‌دهنده استریم، و کمک‌کننده‌های مشترک پوشش‌دهنده Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | کمک‌کننده‌های ترابری تامین‌کننده | کمک‌کننده‌های ترابری بومی تامین‌کننده مانند fetch محافظت‌شده، استخراج متن نتیجه ابزار، تبدیل‌های پیام ترابری، و استریم‌های رویداد ترابری نوشتنی |
  | `plugin-sdk/keyed-async-queue` | صف ناهمگام مرتب | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | کمک‌کننده‌های مشترک رسانه | کمک‌کننده‌های دریافت/تبدیل/ذخیره رسانه، بررسی ابعاد ویدئو مبتنی بر ffprobe، و سازنده‌های محموله رسانه |
  | `plugin-sdk/media-generation-runtime` | کمک‌کننده‌های مشترک تولید رسانه | کمک‌کننده‌های مشترک جایگزینی در خرابی، انتخاب نامزد، و پیام‌رسانی مدل مفقود برای تولید تصویر/ویدئو/موسیقی |
  | `plugin-sdk/media-understanding` | کمک‌کننده‌های درک رسانه | انواع تامین‌کننده درک رسانه به‌همراه خروجی‌های کمکی تصویر/صوت برای تامین‌کننده |
  | `plugin-sdk/text-runtime` | خروجی گسترده منسوخ سازگاری متن | از `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`، و `logging-core` استفاده کنید |
  | `plugin-sdk/text-chunking` | کمک‌کننده‌های قطعه‌بندی متن | کمک‌کننده قطعه‌بندی متن خروجی |
  | `plugin-sdk/speech` | کمک‌کننده‌های گفتار | انواع تامین‌کننده گفتار به‌همراه کمک‌کننده‌های دستورالعمل، رجیستری و اعتبارسنجی برای تامین‌کننده، و سازنده TTS سازگار با OpenAI |
  | `plugin-sdk/speech-core` | هسته مشترک گفتار | انواع تامین‌کننده گفتار، رجیستری، دستورالعمل‌ها، عادی‌سازی |
  | `plugin-sdk/realtime-transcription` | کمک‌کننده‌های رونویسی بلادرنگ | انواع تامین‌کننده، کمک‌کننده‌های رجیستری، و کمک‌کننده مشترک نشست WebSocket |
  | `plugin-sdk/realtime-voice` | کمک‌کننده‌های صدای بلادرنگ | انواع تامین‌کننده، کمک‌کننده‌های رجیستری/رفع، کمک‌کننده‌های نشست پل، صف‌های مشترک پاسخ گفتاری عامل، کنترل صوتی اجرای فعال، سلامت رونوشت/رویداد، سرکوب اکو، تطبیق پرسش مشاوره، هماهنگی مشاوره اجباری، ردیابی زمینه نوبت، ردیابی فعالیت خروجی، و کمک‌کننده‌های سریع مشاوره زمینه |
  | `plugin-sdk/image-generation` | کمک‌کننده‌های تولید تصویر | انواع تامین‌کننده تولید تصویر به‌همراه کمک‌کننده‌های URL داده/دارایی تصویر و سازنده تامین‌کننده تصویر سازگار با OpenAI |
  | `plugin-sdk/image-generation-core` | هسته مشترک تولید تصویر | انواع تولید تصویر، جایگزینی در خرابی، احراز هویت، و کمک‌کننده‌های رجیستری |
  | `plugin-sdk/music-generation` | کمک‌کننده‌های تولید موسیقی | انواع تامین‌کننده/درخواست/نتیجه تولید موسیقی |
  | `plugin-sdk/music-generation-core` | هسته مشترک تولید موسیقی | انواع تولید موسیقی، کمک‌کننده‌های جایگزینی در خرابی، جست‌وجوی تامین‌کننده، و تجزیه ارجاع مدل |
  | `plugin-sdk/video-generation` | کمک‌کننده‌های تولید ویدئو | انواع تامین‌کننده/درخواست/نتیجه تولید ویدئو |
  | `plugin-sdk/video-generation-core` | هسته مشترک تولید ویدئو | انواع تولید ویدئو، کمک‌کننده‌های جایگزینی در خرابی، جست‌وجوی تامین‌کننده، و تجزیه ارجاع مدل |
  | `plugin-sdk/interactive-runtime` | کمک‌کننده‌های پاسخ تعاملی | عادی‌سازی/کاهش محموله پاسخ تعاملی |
  | `plugin-sdk/channel-config-primitives` | بنیان‌های پیکربندی کانال | بنیان‌های محدود اسکیمای پیکربندی کانال |
  | `plugin-sdk/channel-config-writes` | کمک‌کننده‌های نوشتن پیکربندی کانال | کمک‌کننده‌های مجوزدهی نوشتن پیکربندی کانال |
  | `plugin-sdk/channel-plugin-common` | پیش‌درآمد مشترک کانال | خروجی‌های پیش‌درآمد مشترک Plugin کانال |
  | `plugin-sdk/channel-status` | کمک‌کننده‌های وضعیت کانال | کمک‌کننده‌های مشترک نما/خلاصه وضعیت کانال |
  | `plugin-sdk/allowlist-config-edit` | کمک‌کننده‌های پیکربندی فهرست مجاز | کمک‌کننده‌های ویرایش/خواندن پیکربندی فهرست مجاز |
  | `plugin-sdk/group-access` | کمک‌کننده‌های دسترسی گروه | کمک‌کننده‌های مشترک تصمیم‌گیری دسترسی گروه |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | نماهای سازگاری منسوخ | از `plugin-sdk/channel-inbound` استفاده کنید |
  | `plugin-sdk/direct-dm-guard-policy` | کمک‌کننده‌های محافظ Direct-DM | کمک‌کننده‌های محدود سیاست محافظ پیش از رمزنگاری |
  | `plugin-sdk/extension-shared` | کمک‌کننده‌های مشترک افزونه | بنیان‌های کمکی کانال غیرفعال/وضعیت و پروکسی محیطی |
  | `plugin-sdk/webhook-targets` | کمک‌کننده‌های هدف Webhook | رجیستری هدف Webhook و کمک‌کننده‌های نصب مسیر |
  | `plugin-sdk/webhook-path` | نام مستعار منسوخ مسیر webhook | از `plugin-sdk/webhook-ingress` استفاده کنید |
  | `plugin-sdk/web-media` | کمک‌کننده‌های مشترک رسانه وب | کمک‌کننده‌های بارگذاری رسانه راه‌دور/محلی |
  | `plugin-sdk/zod` | بازصادرات منسوخ سازگاری Zod | `zod` را مستقیما از `zod` وارد کنید |
  | `plugin-sdk/memory-core` | کمک‌کننده‌های memory-core بسته‌بندی‌شده | سطح کمکی مدیر/پیکربندی/فایل/CLI حافظه |
  | `plugin-sdk/memory-core-engine-runtime` | نمای زمان اجرای موتور حافظه | نمای زمان اجرای نمایه/جست‌وجوی حافظه |
  | `plugin-sdk/memory-core-host-embedding-registry` | رجیستری جاسازی حافظه | کمک‌کننده‌های سبک رجیستری تامین‌کننده جاسازی حافظه |
  | `plugin-sdk/memory-core-host-engine-foundation` | موتور بنیاد میزبان حافظه | خروجی‌های موتور بنیاد میزبان حافظه |
  | `plugin-sdk/memory-core-host-engine-embeddings` | موتور جاسازی میزبان حافظه | قراردادهای جاسازی حافظه، دسترسی رجیستری، تامین‌کننده محلی، و کمک‌کننده‌های عمومی دسته‌ای/راه‌دور؛ تامین‌کنندگان راه‌دور مشخص در pluginهای مالک خود قرار دارند |
  | `plugin-sdk/memory-core-host-engine-qmd` | موتور QMD میزبان حافظه | خروجی‌های موتور QMD میزبان حافظه |
  | `plugin-sdk/memory-core-host-engine-storage` | موتور ذخیره‌سازی میزبان حافظه | خروجی‌های موتور ذخیره‌سازی میزبان حافظه |
  | `plugin-sdk/memory-core-host-multimodal` | کمک‌کننده‌های چندوجهی میزبان حافظه | کمک‌کننده‌های چندوجهی میزبان حافظه |
  | `plugin-sdk/memory-core-host-query` | کمک‌کننده‌های پرس‌وجوی میزبان حافظه | کمک‌کننده‌های پرس‌وجوی میزبان حافظه |
  | `plugin-sdk/memory-core-host-secret` | کمک‌کننده‌های راز میزبان حافظه | کمک‌کننده‌های راز میزبان حافظه |
  | `plugin-sdk/memory-core-host-events` | نام مستعار منسوخ رویداد حافظه | از `plugin-sdk/memory-host-events` استفاده کنید |
  | `plugin-sdk/memory-core-host-status` | کمک‌کننده‌های وضعیت میزبان حافظه | کمک‌کننده‌های وضعیت میزبان حافظه |
  | `plugin-sdk/memory-core-host-runtime-cli` | زمان اجرای CLI میزبان حافظه | کمک‌کننده‌های زمان اجرای CLI میزبان حافظه |
  | `plugin-sdk/memory-core-host-runtime-core` | زمان اجرای هسته میزبان حافظه | کمک‌کننده‌های زمان اجرای هسته میزبان حافظه |
  | `plugin-sdk/memory-core-host-runtime-files` | کمک‌کننده‌های فایل/زمان اجرای میزبان حافظه | کمک‌کننده‌های فایل/زمان اجرای میزبان حافظه |
  | `plugin-sdk/memory-host-core` | نام مستعار زمان اجرای هسته میزبان حافظه | نام مستعار بی‌طرف از نظر فروشنده برای کمک‌کننده‌های زمان اجرای هسته میزبان حافظه |
  | `plugin-sdk/memory-host-events` | نام مستعار دفتر رویداد میزبان حافظه | نام مستعار بی‌طرف از نظر فروشنده برای کمک‌کننده‌های دفتر رویداد میزبان حافظه |
  | `plugin-sdk/memory-host-files` | نام مستعار منسوخ فایل/زمان اجرای حافظه | از `plugin-sdk/memory-core-host-runtime-files` استفاده کنید |
  | `plugin-sdk/memory-host-markdown` | کمک‌کننده‌های markdown مدیریت‌شده | کمک‌کننده‌های مشترک markdown مدیریت‌شده برای pluginهای مجاور حافظه |
  | `plugin-sdk/memory-host-search` | نمای جست‌وجوی حافظه فعال | نمای زمان اجرای تنبل مدیر جست‌وجوی حافظه فعال |
  | `plugin-sdk/memory-host-status` | نام مستعار منسوخ وضعیت میزبان حافظه | از `plugin-sdk/memory-core-host-status` استفاده کنید |
  | `plugin-sdk/testing` | ابزارهای تست | barrel سازگاری منسوخ محلی مخزن؛ از زیربخش‌های تست متمرکز محلی مخزن مانند `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`، و `plugin-sdk/test-fixtures` استفاده کنید |
</Accordion>

این جدول عمداً زیرمجموعهٔ مشترک مهاجرت است، نه سطح کامل SDK.
فهرست نقطهٔ ورود کامپایلر در
`scripts/lib/plugin-sdk-entrypoints.json` قرار دارد؛ exportهای package از
زیرمجموعهٔ عمومی تولید می‌شوند.

درزهای کمکی رزروشدهٔ bundled-plugin از export map عمومی SDK بازنشسته شده‌اند،
به‌جز facadeهای سازگاری که صراحتاً مستند شده‌اند، مانند shim منسوخ‌شدهٔ
`plugin-sdk/discord` که برای package منتشرشدهٔ
`@openclaw/discord@2026.3.13` حفظ شده است. کمک‌کننده‌های owner-specific داخل
package مالک Plugin قرار دارند؛ رفتار میزبان مشترک باید از طریق قراردادهای
عمومی SDK مانند `plugin-sdk/gateway-runtime`، `plugin-sdk/security-runtime` و
`plugin-sdk/plugin-config-runtime` منتقل شود.

باریک‌ترین import متناسب با کار را استفاده کنید. اگر exportی پیدا نکردید،
source را در `src/plugin-sdk/` بررسی کنید یا از نگه‌دارندگان بپرسید کدام
قرارداد عمومی باید مالک آن باشد.

## منسوخ‌سازی‌های فعال

منسوخ‌سازی‌های محدودتری که در سراسر plugin SDK، قرارداد ارائه‌دهنده، سطح زمان
اجرا و مانیفست اعمال می‌شوند. هر کدام امروز هنوز کار می‌کند، اما در یک major
release آینده حذف خواهد شد. ورودی زیر هر مورد API قدیمی را به جایگزین canonical
آن نگاشت می‌کند.

<AccordionGroup>
  <Accordion title="سازنده‌های راهنمای command-auth → command-status">
    **قدیمی (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **جدید (`openclaw/plugin-sdk/command-status`)**: همان signatureها، همان
    exportها - فقط از subpath باریک‌تر import می‌شوند. `command-auth`
    آن‌ها را به‌عنوان stubهای سازگاری re-export می‌کند.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="کمک‌کننده‌های دروازه‌گذاری Mention → resolveInboundMentionDecision">
    **قدیمی**: `resolveInboundMentionRequirement({ facts, policy })` و
    `shouldDropInboundForMention(...)` از
    `openclaw/plugin-sdk/channel-inbound` یا
    `openclaw/plugin-sdk/channel-mention-gating`.

    **جدید**: `resolveInboundMentionDecision({ facts, policy })` - به‌جای دو
    فراخوانی جدا، یک شیء تصمیم واحد برمی‌گرداند.

    Pluginهای کانال پایین‌دستی (Slack، Discord، Matrix، MS Teams) قبلاً
    جابه‌جا شده‌اند.

  </Accordion>

  <Accordion title="shim زمان اجرای کانال و کمک‌کننده‌های کنش‌های کانال">
    `openclaw/plugin-sdk/channel-runtime` یک shim سازگاری برای Pluginهای کانال
    قدیمی‌تر است. آن را از کد جدید import نکنید؛ برای ثبت اشیای زمان اجرا از
    `openclaw/plugin-sdk/channel-runtime-context` استفاده کنید.

    کمک‌کننده‌های `channelActions*` در `openclaw/plugin-sdk/channel-actions`
    همراه با exportهای خام کانال "actions" منسوخ شده‌اند. قابلیت‌ها را به‌جای
    آن از طریق سطح معنایی `presentation` عرضه کنید - Pluginهای کانال اعلام
    می‌کنند چه چیزی را render می‌کنند (کارت‌ها، دکمه‌ها، selectها)، نه اینکه چه
    نام‌های خام action را می‌پذیرند.

  </Accordion>

  <Accordion title="کمک‌کنندهٔ tool() ارائه‌دهندهٔ جست‌وجوی وب → createTool() روی Plugin">
    **قدیمی**: factory `tool()` از `openclaw/plugin-sdk/provider-web-search`.

    **جدید**: `createTool(...)` را مستقیماً روی Plugin ارائه‌دهنده پیاده‌سازی
    کنید. OpenClaw دیگر برای ثبت wrapper ابزار به کمک‌کنندهٔ SDK نیاز ندارد.

  </Accordion>

  <Accordion title="envelopeهای کانال plaintext → BodyForAgent">
    **قدیمی**: `formatInboundEnvelope(...)` (و
    `ChannelMessageForAgent.channelEnvelope`) برای ساخت یک envelope prompt
    plaintext و تخت از پیام‌های کانال ورودی.

    **جدید**: `BodyForAgent` به‌همراه بلوک‌های ساختاریافتهٔ user-context.
    Pluginهای کانال metadata مسیریابی (thread، topic، reply-to، reactionها) را
    به‌جای الحاق آن‌ها به یک رشتهٔ prompt، به‌صورت fieldهای typed پیوست
    می‌کنند. کمک‌کنندهٔ `formatAgentEnvelope(...)` همچنان برای envelopeهای
    ساخته‌شدهٔ رو به assistant پشتیبانی می‌شود، اما envelopeهای plaintext
    ورودی در مسیر حذف هستند.

    نواحی متاثر: `inbound_claim`، `message_received`، و هر Plugin کانال سفارشی
    که متن `channelEnvelope` را post-process می‌کرد.

  </Accordion>

  <Accordion title="hook deactivate → gateway_stop">
    **قدیمی**: `api.on("deactivate", handler)`.

    **جدید**: `api.on("gateway_stop", handler)`. رویداد و context همان قرارداد
    cleanup خاموش‌سازی هستند؛ فقط نام hook تغییر می‌کند.

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

    `deactivate` تا پس از 2026-08-16 به‌عنوان alias سازگاری منسوخ‌شده
    سیم‌کشی‌شده باقی می‌ماند.

  </Accordion>

  <Accordion title="hook subagent_spawning → اتصال thread در core">
    **قدیمی**: `api.on("subagent_spawning", handler)` که
    `threadBindingReady` یا `deliveryOrigin` برمی‌گرداند.

    **جدید**: اجازه دهید core اتصال‌های subagent با `thread: true` را از طریق
    adapter اتصال session کانال آماده کند. از
    `api.on("subagent_spawned", handler)` فقط برای مشاهدهٔ پس از launch استفاده
    کنید.

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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` فقط به‌عنوان سطوح
    سازگاری منسوخ‌شده باقی می‌مانند تا زمانی که Pluginهای خارجی مهاجرت کنند.

  </Accordion>

  <Accordion title="typeهای کشف ارائه‌دهنده → typeهای کاتالوگ ارائه‌دهنده">
    چهار type alias کشف اکنون wrapperهای نازکی روی typeهای دورهٔ کاتالوگ هستند:

    | alias قدیمی                 | type جدید                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    به‌علاوهٔ bag ایستای legacy `ProviderCapabilities` - Pluginهای
    ارائه‌دهنده باید به‌جای یک شیء ایستا از hookهای صریح ارائه‌دهنده مانند
    `buildReplayPolicy`، `normalizeToolSchemas`، و `wrapStreamFn` استفاده کنند.

  </Accordion>

  <Accordion title="hookهای سیاست Thinking → resolveThinkingProfile">
    **قدیمی** (سه hook جداگانه روی `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`، `supportsXHighThinking(ctx)`، و
    `resolveDefaultThinkingLevel(ctx)`.

    **جدید**: یک `resolveThinkingProfile(ctx)` واحد که یک
    `ProviderThinkingProfile` با `id` canonical، `label` اختیاری، و فهرست
    رتبه‌بندی‌شدهٔ levelها برمی‌گرداند. OpenClaw مقادیر ذخیره‌شدهٔ stale را
    به‌صورت خودکار بر اساس رتبهٔ profile downgrade می‌کند.

    context شامل `provider`، `modelId`، `reasoning` ادغام‌شدهٔ اختیاری، و facts
    اختیاری `compat` مدل ادغام‌شده است. Pluginهای ارائه‌دهنده می‌توانند از این
    facts کاتالوگ برای عرضهٔ profile ویژهٔ مدل فقط زمانی استفاده کنند که قرارداد
    request پیکربندی‌شده از آن پشتیبانی کند.

    به‌جای سه hook، یک hook پیاده‌سازی کنید. hookهای legacy در طول پنجرهٔ
    منسوخ‌سازی همچنان کار می‌کنند، اما با نتیجهٔ profile ترکیب نمی‌شوند.

  </Accordion>

  <Accordion title="ارائه‌دهندگان auth خارجی → contracts.externalAuthProviders">
    **قدیمی**: پیاده‌سازی hookهای auth خارجی بدون اعلام ارائه‌دهنده در مانیفست
    Plugin.

    **جدید**: `contracts.externalAuthProviders` را در مانیفست Plugin اعلام کنید
    **و** `resolveExternalAuthProfiles(...)` را پیاده‌سازی کنید.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="جست‌وجوی env-var ارائه‌دهنده → setup.providers[].envVars">
    field مانیفست **قدیمی**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **جدید**: همان جست‌وجوی env-var را در `setup.providers[].envVars` روی
    مانیفست mirror کنید. این کار metadata مربوط به env برای setup/status را در
    یک جا یکپارچه می‌کند و از boot کردن زمان اجرای Plugin فقط برای پاسخ‌دادن به
    جست‌وجوهای env-var جلوگیری می‌کند.

    `providerAuthEnvVars` تا زمان بسته‌شدن پنجرهٔ منسوخ‌سازی از طریق یک adapter
    سازگاری پشتیبانی می‌شود.

  </Accordion>

  <Accordion title="ثبت Plugin حافظه → registerMemoryCapability">
    **قدیمی**: سه فراخوانی جداگانه -
    `api.registerMemoryPromptSection(...)`،
    `api.registerMemoryFlushPlan(...)`،
    `api.registerMemoryRuntime(...)`.

    **جدید**: یک فراخوانی روی API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    همان slotها، یک فراخوانی ثبت واحد. کمک‌کننده‌های prompt و corpus افزایشی
    (`registerMemoryPromptSupplement`، `registerMemoryCorpusSupplement`) متاثر
    نیستند.

  </Accordion>

  <Accordion title="API ارائه‌دهندهٔ embedding حافظه">
    **قدیمی**: `api.registerMemoryEmbeddingProvider(...)` به‌علاوهٔ
    `contracts.memoryEmbeddingProviders`.

    **جدید**: `api.registerEmbeddingProvider(...)` به‌علاوهٔ
    `contracts.embeddingProviders`.

    قرارداد عمومی ارائه‌دهندهٔ embedding خارج از memory هم قابل استفادهٔ مجدد
    است و مسیر پشتیبانی‌شده برای ارائه‌دهندگان جدید محسوب می‌شود. API ثبت
    ویژهٔ memory به‌عنوان سازگاری منسوخ‌شده همچنان سیم‌کشی‌شده می‌ماند تا
    ارائه‌دهندگان موجود مهاجرت کنند. گزارش‌های بازرسی Plugin استفادهٔ
    non-bundled را به‌عنوان بدهی سازگاری گزارش می‌کنند.

  </Accordion>

  <Accordion title="typeهای پیام‌های session مربوط به Subagent تغییر نام داده شدند">
    دو type alias legacy که هنوز از `src/plugins/runtime/types.ts` export
    می‌شوند:

    | قدیمی                           | جدید                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    method زمان اجرای `readSession` به نفع `getSessionMessages` منسوخ شده است.
    همان signature؛ method قدیمی به method جدید فراخوانی را عبور می‌دهد.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **قدیمی**: `runtime.tasks.flow` (مفرد) یک accessor زندهٔ task-flow
    برمی‌گرداند.

    **جدید**: `runtime.tasks.managedFlows` زمان اجرای mutation مدیریت‌شدهٔ
    TaskFlow را برای Pluginهایی نگه می‌دارد که taskهای فرزند را از یک flow
    ایجاد، به‌روزرسانی، لغو یا اجرا می‌کنند. زمانی از `runtime.tasks.flows`
    استفاده کنید که Plugin فقط به خواندن‌های مبتنی بر DTO نیاز دارد.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="factoryهای extension تعبیه‌شده → middleware نتیجهٔ ابزار agent">
    در بخش «چگونه مهاجرت کنیم → extensionهای تعبیه‌شدهٔ tool-result را به
    middleware مهاجرت دهید» در بالا پوشش داده شده است. برای کامل‌بودن اینجا هم
    آمده است: مسیر حذف‌شدهٔ فقط embedded-runner
    `api.registerEmbeddedExtensionFactory(...)` با
    `api.registerAgentToolResultMiddleware(...)` و یک فهرست صریح runtime در
    `contracts.agentToolResultMiddleware` جایگزین شده است.
  </Accordion>

  <Accordion title="alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` که از `openclaw/plugin-sdk` re-export می‌شود اکنون یک
    alias تک‌خطی برای `OpenClawConfig` است. نام canonical را ترجیح دهید.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
منسوخ‌سازی‌های سطح extension (داخل Pluginهای کانال/ارائه‌دهندهٔ bundled زیر
`extensions/`) داخل barrelهای `api.ts` و `runtime-api.ts` خودشان پیگیری
می‌شوند. آن‌ها روی قراردادهای Plugin شخص ثالث اثر نمی‌گذارند و اینجا فهرست
نشده‌اند. اگر barrel محلی یک Plugin bundled را مستقیم مصرف می‌کنید، پیش از
ارتقا، کامنت‌های منسوخ‌سازی را در همان barrel بخوانید.
</Note>

## جدول زمانی حذف

| زمان | چه اتفاقی می‌افتد |
| ---------------------- | ----------------------------------------------------------------------- |
| **اکنون** | سطح‌های منسوخ‌شده هشدارهای زمان اجرا صادر می‌کنند |
| **انتشار اصلی بعدی** | سطح‌های منسوخ‌شده حذف خواهند شد؛ Pluginهایی که همچنان از آن‌ها استفاده می‌کنند شکست خواهند خورد |

همه Pluginهای هسته از قبل مهاجرت داده شده‌اند. Pluginهای خارجی باید
پیش از انتشار اصلی بعدی مهاجرت کنند.

## سرکوب موقت هشدارها

هنگام کار روی مهاجرت، این متغیرهای محیطی را تنظیم کنید:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

این یک راه فرار موقت است، نه یک راه‌حل دائمی.

## مرتبط

- [شروع به کار](/fa/plugins/building-plugins) - نخستین plugin خود را بسازید
- [نمای کلی SDK](/fa/plugins/sdk-overview) - مرجع کامل import زیرفرازها
- [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) - ساخت pluginهای کانال
- [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) - ساخت pluginهای ارائه‌دهنده
- [درون‌سازه‌های Plugin](/fa/plugins/architecture) - بررسی عمیق معماری
- [مانیفست Plugin](/fa/plugins/manifest) - مرجع شِمای مانیفست
