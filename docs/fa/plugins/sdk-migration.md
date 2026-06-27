---
read_when:
    - هشدار OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED را می‌بینید
    - هشدار OPENCLAW_EXTENSION_API_DEPRECATED را می‌بینید
    - شما پیش از OpenClaw 2026.4.25 از api.registerEmbeddedExtensionFactory استفاده کرده‌اید
    - شما در حال به‌روزرسانی یک Plugin به معماری مدرن Plugin هستید
    - شما یک Plugin خارجی OpenClaw را نگهداری می‌کنید
sidebarTitle: Migrate to SDK
summary: از لایهٔ سازگاری با نسخه‌های قدیمی به SDK Plugin مدرن مهاجرت کنید
title: مهاجرت Plugin SDK
x-i18n:
    generated_at: "2026-06-27T18:31:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9061b31567cbd24196458ecb9af1cb1b0351f789a136ea26951c8fb7e576cf08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw از یک لایهٔ گستردهٔ سازگاری رو به عقب به یک معماری Plugin مدرن با importهای متمرکز و مستند منتقل شده است. اگر Plugin شما پیش از معماری جدید ساخته شده، این راهنما به شما کمک می‌کند مهاجرت کنید.

## چه چیزی در حال تغییر است

سیستم قدیمی Plugin دو سطح کاملاً باز ارائه می‌کرد که به Pluginها اجازه می‌داد هر چیزی را که نیاز داشتند از یک نقطهٔ ورود واحد import کنند:

- **`openclaw/plugin-sdk/compat`** - یک import واحد که ده‌ها helper را دوباره export می‌کرد. این برای فعال نگه داشتن Pluginهای قدیمی مبتنی بر hook در زمانی معرفی شد که معماری جدید Plugin در حال ساخته شدن بود.
- **`openclaw/plugin-sdk/infra-runtime`** - یک barrel گستردهٔ helper زمان اجرا که رویدادهای سیستم، وضعیت Heartbeat، صف‌های تحویل، helperهای fetch/proxy، helperهای فایل، نوع‌های تأیید و ابزارهای نامرتبط را با هم ترکیب می‌کرد.
- **`openclaw/plugin-sdk/config-runtime`** - یک barrel گستردهٔ سازگاری پیکربندی که هنوز در طول پنجرهٔ مهاجرت helperهای مستقیم و منسوخ load/write را حمل می‌کند.
- **`openclaw/extension-api`** - پلی که به Pluginها دسترسی مستقیم به helperهای سمت میزبان مانند اجراکنندهٔ عامل تعبیه‌شده می‌داد.
- **`api.registerEmbeddedExtensionFactory(...)`** - یک hook حذف‌شدهٔ افزونهٔ بسته‌بندی‌شدهٔ فقط برای اجراکنندهٔ تعبیه‌شده که می‌توانست رویدادهای اجراکنندهٔ تعبیه‌شده مانند `tool_result` را مشاهده کند.

سطح‌های import گسترده اکنون **منسوخ** هستند. آن‌ها هنوز در زمان اجرا کار می‌کنند، اما Pluginهای جدید نباید از آن‌ها استفاده کنند، و Pluginهای موجود باید پیش از اینکه نسخهٔ اصلی بعدی آن‌ها را حذف کند مهاجرت کنند. API ثبت factory افزونهٔ فقط برای اجراکنندهٔ تعبیه‌شده حذف شده است؛ به‌جای آن از middleware نتیجهٔ ابزار استفاده کنید.

OpenClaw رفتار مستند Plugin را در همان تغییری که جایگزین را معرفی می‌کند حذف یا بازتفسیر نمی‌کند. تغییرات شکنندهٔ قرارداد ابتدا باید از مسیر adapter سازگاری، diagnostics، مستندات و یک پنجرهٔ deprecation عبور کنند. این شامل importهای SDK، فیلدهای manifest، APIهای setup، hookها و رفتار ثبت زمان اجرا می‌شود.

<Warning>
  لایهٔ سازگاری رو به عقب در یک نسخهٔ اصلی آینده حذف خواهد شد.
  Pluginهایی که هنوز از این سطح‌ها import می‌کنند، وقتی این اتفاق بیفتد خراب خواهند شد.
  ثبت‌های factory افزونهٔ تعبیه‌شدهٔ قدیمی از قبل دیگر load نمی‌شوند.
</Warning>

## چرا این تغییر انجام شد

رویکرد قدیمی مشکل ایجاد می‌کرد:

- **راه‌اندازی کند** - import کردن یک helper ده‌ها ماژول نامرتبط را load می‌کرد
- **وابستگی‌های چرخه‌ای** - re-exportهای گسترده ساختن چرخه‌های import را آسان می‌کردند
- **سطح API نامشخص** - راهی برای تشخیص exportهای پایدار از داخلی وجود نداشت

SDK مدرن Plugin این مشکل را حل می‌کند: هر مسیر import (`openclaw/plugin-sdk/\<subpath\>`) یک ماژول کوچک و خودبسنده با هدف روشن و قرارداد مستند است.

درزهای legacy راحتی provider برای کانال‌های بسته‌بندی‌شده نیز حذف شده‌اند.
درزهای helper با برند کانال میان‌برهای خصوصی mono-repo بودند، نه قراردادهای پایدار Plugin. به‌جای آن از زیرمسیرهای عمومی و باریک SDK استفاده کنید. داخل workspace بسته‌بندی‌شدهٔ Plugin، helperهای متعلق به provider را در `api.ts` یا `runtime-api.ts` خود همان Plugin نگه دارید.

نمونه‌های فعلی providerهای بسته‌بندی‌شده:

- Anthropic helperهای stream مخصوص Claude را در درز `api.ts` / `contract-api.ts` خودش نگه می‌دارد
- OpenAI سازنده‌های provider، helperهای مدل پیش‌فرض و سازنده‌های provider بلادرنگ را در `api.ts` خودش نگه می‌دارد
- OpenRouter سازندهٔ provider و helperهای onboarding/config را در `api.ts` خودش نگه می‌دارد

## برنامهٔ مهاجرت Talk و صدای بلادرنگ

کد Talk بلادرنگ، تلفنی، جلسه و مرورگر از bookkeeping نوبت محلیِ سطح به یک کنترل‌گر مشترک نشست Talk که توسط `openclaw/plugin-sdk/realtime-voice` export می‌شود منتقل می‌شود. کنترل‌گر جدید مالک envelope مشترک رویداد Talk، وضعیت نوبت فعال، وضعیت capture، وضعیت خروجی صوتی، تاریخچهٔ اخیر رویدادها و رد نوبت‌های stale است. Pluginهای provider باید همچنان مالک نشست‌های بلادرنگ مخصوص vendor باشند؛ Pluginهای سطح باید همچنان مالک capture، playback، تلفنی و تفاوت‌های جلسه باشند.

این مهاجرت Talk عمداً breaking-clean است:

1. primitiveهای مشترک controller/runtime را در
   `plugin-sdk/realtime-voice` نگه دارید.
2. سطح‌های بسته‌بندی‌شده را به کنترل‌گر مشترک منتقل کنید: browser relay،
   managed-room handoff، voice-call realtime، voice-call streaming STT، Google
   Meet realtime و native push-to-talk.
3. خانواده‌های RPC قدیمی Talk را با API نهایی `talk.session.*` و
   `talk.client.*` جایگزین کنید.
4. یک کانال زندهٔ رویداد Talk را در Gateway
   `hello-ok.features.events` اعلام کنید: `talk.event`.
5. endpoint قدیمی HTTP بلادرنگ و هر مسیر override دستورالعمل در زمان درخواست را حذف کنید.

کد جدید نباید مستقیماً `createTalkEventSequencer(...)` را فراخوانی کند مگر اینکه در حال پیاده‌سازی یک adapter سطح پایین یا fixture تست باشد. کنترل‌گر مشترک را ترجیح دهید تا رویدادهای محدود به نوبت بدون turn id منتشر نشوند، فراخوانی‌های stale `turnEnd` /
`turnCancel` نتوانند نوبت فعال جدیدتر را پاک کنند، و رویدادهای چرخهٔ عمر خروجی صوتی در تلفنی، جلسات، browser relay، managed-room handoff و clientهای native Talk سازگار بمانند.

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
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

نشست‌های WebRTC/provider-websocket متعلق به مرورگر از `talk.client.create` استفاده می‌کنند، چون مرورگر مالک مذاکرهٔ provider و انتقال رسانه است، در حالی که Gateway مالک credentials، instructions و tool policy است. `talk.session.*` سطح مشترک مدیریت‌شده توسط Gateway برای gateway-relay realtime، gateway-relay transcription و نشست‌های native STT/TTS در managed-room است.

پیکربندی‌های legacy که selectorهای بلادرنگ را کنار `talk.provider` /
`talk.providers` قرار داده‌اند باید با `openclaw doctor --fix` تعمیر شوند؛ Talk زمان اجرا پیکربندی provider گفتار/TTS را به‌عنوان پیکربندی provider بلادرنگ بازتفسیر نمی‌کند.

ترکیب‌های پشتیبانی‌شدهٔ `talk.session.create` عمداً کوچک هستند:

| حالت           | انتقال          | مغز             | مالک               | یادداشت‌ها                                                                                                         |
| -------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | صوت provider تمام‌دوطرفه از طریق Gateway bridge می‌شود؛ فراخوانی‌های ابزار از طریق ابزار agent-consult route می‌شوند. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | فقط streaming STT؛ فراخوان‌ها صوت ورودی را ارسال می‌کنند و رویدادهای transcript را دریافت می‌کنند.                |
| `stt-tts`       | `managed-room`  | `agent-consult` | اتاق native/client | اتاق‌های سبک push-to-talk و walkie-talkie که client مالک capture/playback است و Gateway مالک وضعیت نوبت است.      |
| `stt-tts`       | `managed-room`  | `direct-tools`  | اتاق native/client | حالت اتاق فقط برای admin برای سطح‌های first-party مورد اعتماد که actionهای ابزار Gateway را مستقیماً اجرا می‌کنند. |

نقشهٔ روش‌های حذف‌شده:

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

  | روش                            | شامل                                                   | قرارداد                                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | یک قطعه صوتی PCM با کدگذاری base64 را به نشست ارائه‌دهنده که مالک آن همان اتصال Gateway است اضافه می‌کند.                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | نوبت کاربر در اتاق مدیریت‌شده را شروع می‌کند.                                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | نوبت فعال را پس از اعتبارسنجی نوبت کهنه پایان می‌دهد.                                                                                                                                         |
  | `talk.session.cancelTurn`       | همه نشست‌های تحت مالکیت Gateway                              | کار فعال دریافت/ارائه‌دهنده/عامل/TTS را برای یک نوبت لغو می‌کند.                                                                                                                                |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | خروجی صوتی دستیار را بدون اینکه لزوماً نوبت کاربر پایان یابد متوقف می‌کند.                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | فراخوانی ابزار ارائه‌دهنده را که relay منتشر کرده کامل می‌کند؛ برای خروجی موقت `options.willContinue` یا برای برآورده کردن فراخوانی بدون پاسخ دیگر از دستیار، `options.suppressResponse` را پاس دهید. |
  | `talk.session.steer`            | نشست‌های Talk با پشتوانه عامل                              | کنترل گفتاری `status`، `steer`، `cancel`، یا `followup` را به اجرای جاسازی‌شده فعال که از نشست Talk resolve شده ارسال می‌کند.                                                                |
  | `talk.session.close`            | همه نشست‌های یکپارچه                                    | نشست‌های relay را متوقف می‌کند یا وضعیت اتاق مدیریت‌شده را لغو می‌کند، سپس شناسه نشست یکپارچه را فراموش می‌کند.                                                                                                    |

  برای انجام این کار، موردهای ویژه ارائه‌دهنده یا پلتفرم را در هسته وارد نکنید.
  هسته مالک معناشناسی نشست Talk است. Pluginهای ارائه‌دهنده مالک راه‌اندازی نشست فروشنده هستند.
  تماس صوتی و Google Meet مالک adapterهای تلفنی/جلسه هستند. مرورگر و برنامه‌های بومی
  مالک تجربه کاربری دریافت/پخش دستگاه هستند.

  ## سیاست سازگاری

  برای Pluginهای خارجی، کار سازگاری به این ترتیب انجام می‌شود:

  1. قرارداد جدید را اضافه کنید
  2. رفتار قدیمی را از طریق یک adapter سازگاری متصل نگه دارید
  3. یک diagnostic یا هشدار منتشر کنید که مسیر قدیمی و جایگزین را نام می‌برد
  4. هر دو مسیر را در آزمون‌ها پوشش دهید
  5. deprecation و مسیر مهاجرت را مستند کنید
  6. فقط پس از پنجره مهاجرت اعلام‌شده حذف کنید، معمولاً در یک انتشار major

  نگه‌دارندگان می‌توانند صف مهاجرت فعلی را با
  `pnpm plugins:boundary-report` audit کنند. از `pnpm plugins:boundary-report:summary` برای
  شمارش‌های فشرده، از `--owner <id>` برای یک Plugin یا مالک سازگاری، و از
  `pnpm plugins:boundary-report:ci` زمانی استفاده کنید که یک gate در CI باید روی رکوردهای سازگاری سررسیدشده،
  importهای SDK رزروشده میان‌مالک، یا زیرمسیرهای SDK رزروشده استفاده‌نشده fail شود. این گزارش
  رکوردهای سازگاری deprecated را بر اساس تاریخ حذف گروه‌بندی می‌کند، ارجاع‌های محلی کد/مستندات را می‌شمارد،
  importهای SDK رزروشده میان‌مالک را آشکار می‌کند، و bridge خصوصی SDK میزبان حافظه را خلاصه می‌کند تا پاک‌سازی سازگاری
  به‌جای تکیه بر جست‌وجوهای ad hoc، صریح بماند. زیرمسیرهای SDK رزروشده باید استفاده مالک ردیابی‌شده داشته باشند؛
  exportهای helper رزروشده استفاده‌نشده باید از SDK عمومی حذف شوند.

  اگر یک فیلد manifest هنوز پذیرفته می‌شود، نویسندگان Plugin می‌توانند تا زمانی که
  مستندات و diagnosticها چیز دیگری نگفته‌اند، همچنان از آن استفاده کنند. کد جدید باید جایگزین مستندشده را ترجیح دهد،
  اما Pluginهای موجود نباید در انتشارهای minor عادی خراب شوند.

  ## روش مهاجرت

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Pluginهای bundled باید فراخوانی مستقیم
    `api.runtime.config.loadConfig()` و
    `api.runtime.config.writeConfigFile(...)` را متوقف کنند. configای را ترجیح دهید که
    از قبل به مسیر فراخوانی فعال پاس داده شده است. handlerهای بلندمدتی که به snapshot فرایند فعلی نیاز دارند
    می‌توانند از `api.runtime.config.current()` استفاده کنند. ابزارهای عامل بلندمدت باید داخل
    `execute` از `ctx.getRuntimeConfig()` مربوط به context ابزار استفاده کنند تا ابزاری که پیش از write یک config
    ایجاد شده نیز همچنان config زمان اجرای refresh‌شده را ببیند.

    writeهای config باید از helperهای transaction عبور کنند و یک
    سیاست پس از write انتخاب کنند:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    زمانی که caller می‌داند تغییر به restart تمیز gateway نیاز دارد، از
    `afterWrite: { mode: "restart", reason: "..." }` استفاده کنید، و
    `afterWrite: { mode: "none", reason: "..." }` را فقط زمانی به‌کار ببرید که caller مالک
    پیگیری است و عمداً می‌خواهد برنامه‌ریز reload را suppress کند.
    نتیجه‌های mutation شامل یک خلاصه typed با نام `followUp` برای آزمون‌ها و logging هستند؛
    gateway همچنان مسئول اعمال یا زمان‌بندی restart باقی می‌ماند.
    `loadConfig` و `writeConfigFile` به‌عنوان helperهای سازگاری deprecated
    برای Pluginهای خارجی در طول پنجره مهاجرت باقی می‌مانند و یک‌بار با
    کد سازگاری `runtime-config-load-write` هشدار می‌دهند. Pluginهای bundled و کد زمان اجرای repo
    با guardrailهای scanner در
    `pnpm check:deprecated-api-usage` و
    `pnpm check:no-runtime-action-load-config` محافظت می‌شوند: استفاده جدید Plugin در production
    کاملاً fail می‌شود، writeهای مستقیم config fail می‌شوند، متدهای سرور gateway باید از
    snapshot runtime درخواست استفاده کنند، helperهای send/action/client کانال runtime
    باید config را از مرزشان دریافت کنند، و ماژول‌های runtime بلندمدت
    هیچ فراخوانی ambient مجاز `loadConfig()` ندارند.

    کد جدید Plugin همچنین باید از import کردن compatibility barrel گسترده
    `openclaw/plugin-sdk/config-runtime` پرهیز کند. از زیرمسیر باریک SDK که با کار مطابقت دارد استفاده کنید:

    | نیاز | Import |
    | --- | --- |
    | نوع‌های config مانند `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | assertionهای config از پیش load‌شده و lookup config ورودی Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | خواندن snapshot فعلی runtime | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | writeهای config | `openclaw/plugin-sdk/config-mutation` |
    | helperهای store نشست | `openclaw/plugin-sdk/session-store-runtime` |
    | config جدول Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | helperهای runtime سیاست گروه | `openclaw/plugin-sdk/runtime-group-policy` |
    | resolve ورودی secret | `openclaw/plugin-sdk/secret-input-runtime` |
    | overrideهای مدل/نشست | `openclaw/plugin-sdk/model-session-runtime` |

    Pluginهای bundled و آزمون‌هایشان در برابر barrel گسترده با scanner محافظت می‌شوند
    تا importها و mockها به همان رفتاری که نیاز دارند محلی بمانند. barrel گسترده
    هنوز برای سازگاری خارجی وجود دارد، اما کد جدید نباید
    به آن وابسته باشد.

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    Pluginهای bundled باید handlerهای نتیجه ابزار مخصوص embedded-runner
    `api.registerEmbeddedExtensionFactory(...)` را با middleware خنثی نسبت به runtime
    جایگزین کنند.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    manifest Plugin را هم‌زمان به‌روزرسانی کنید:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Pluginهای نصب‌شده نیز می‌توانند middleware نتیجه ابزار را ثبت کنند، زمانی که
    صراحتاً فعال شده‌اند و هر runtime هدف را در
    `contracts.agentToolResultMiddleware` اعلام کرده‌اند. registrationهای middleware نصب‌شده اعلام‌نشده
    رد می‌شوند.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Pluginهای کانالی دارای قابلیت approval اکنون رفتار approval بومی را از طریق
    `approvalCapability.nativeRuntime` به‌همراه registry مشترک runtime-context expose می‌کنند.

    تغییرات کلیدی:

    - `approvalCapability.handler.loadRuntime(...)` را با
      `approvalCapability.nativeRuntime` جایگزین کنید
    - auth/delivery مخصوص approval را از wiring legacy `plugin.auth` /
      `plugin.approvals` به `approvalCapability` منتقل کنید
    - `ChannelPlugin.approvals` از قرارداد عمومی channel-plugin
      حذف شده است؛ فیلدهای delivery/native/render را به `approvalCapability` منتقل کنید
    - `plugin.auth` فقط برای جریان‌های login/logout کانال باقی می‌ماند؛ hookهای auth مربوط به approval
      در آن دیگر توسط هسته خوانده نمی‌شوند
    - objectهای runtime تحت مالکیت کانال مانند clientها، tokenها، یا برنامه‌های Bolt
      را از طریق `openclaw/plugin-sdk/channel-runtime-context` ثبت کنید
    - noticeهای reroute تحت مالکیت Plugin را از handlerهای approval بومی ارسال نکنید؛
      هسته اکنون مالک noticeهای routed-elsewhere از نتیجه‌های delivery واقعی است
    - هنگام پاس دادن `channelRuntime` به `createChannelManager(...)`، یک
      surface واقعی `createPluginRuntime().channel` ارائه کنید. stubهای جزئی رد می‌شوند.

    برای layout فعلی قابلیت approval، به `/plugins/sdk-channel-plugins` مراجعه کنید.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    اگر Plugin شما از `openclaw/plugin-sdk/windows-spawn` استفاده می‌کند، wrapperهای Windows
    `.cmd`/`.bat` که resolve نمی‌شوند اکنون fail closed می‌شوند مگر اینکه صراحتاً
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

    اگر caller شما عمداً به fallback از طریق shell متکی نیست،
    `allowShellFallback` را تنظیم نکنید و به‌جای آن خطای thrown را handle کنید.

  </Step>

  <Step title="Find deprecated imports">
    Plugin خود را برای import از هرکدام از surfaceهای deprecated جست‌وجو کنید:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    هر export از surface قدیمی به یک مسیر import مدرن مشخص map می‌شود:

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

    برای helperهای سمت host، به‌جای import مستقیم، از runtime تزریق‌شده Plugin استفاده کنید:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    همین الگو برای دیگر کمک‌کننده‌های پل قدیمی نیز کاربرد دارد:

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
    `openclaw/plugin-sdk/infra-runtime` هنوز برای سازگاری بیرونی وجود دارد،
    اما کد جدید باید سطح کمک‌کننده متمرکزی را ایمپورت کند که واقعا به آن
    نیاز دارد:

    | نیاز | ایمپورت |
    | --- | --- |
    | کمک‌کننده‌های صف رویداد سیستم | `openclaw/plugin-sdk/system-event-runtime` |
    | کمک‌کننده‌های بیدارسازی، رویداد و نمایانی Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | تخلیه صف تحویل در انتظار | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | تله‌متری فعالیت کانال | `openclaw/plugin-sdk/channel-activity-runtime` |
    | کش‌های حذف تکراری در حافظه | `openclaw/plugin-sdk/dedupe-runtime` |
    | کمک‌کننده‌های امن مسیر فایل محلی/رسانه | `openclaw/plugin-sdk/file-access-runtime` |
    | واکشی آگاه از dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | کمک‌کننده‌های پروکسی و واکشی محافظت‌شده | `openclaw/plugin-sdk/fetch-runtime` |
    | نوع‌های سیاست dispatcher برای SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | نوع‌های درخواست/حل تأیید | `openclaw/plugin-sdk/approval-runtime` |
    | کمک‌کننده‌های payload پاسخ تأیید و فرمان | `openclaw/plugin-sdk/approval-reply-runtime` |
    | کمک‌کننده‌های قالب‌بندی خطا | `openclaw/plugin-sdk/error-runtime` |
    | انتظارهای آمادگی transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | کمک‌کننده‌های توکن امن | `openclaw/plugin-sdk/secure-random-runtime` |
    | هم‌زمانی محدود برای وظایف async | `openclaw/plugin-sdk/concurrency-runtime` |
    | تبدیل عددی | `openclaw/plugin-sdk/number-runtime` |
    | قفل async محلیِ پردازه | `openclaw/plugin-sdk/async-lock-runtime` |
    | قفل‌های فایل | `openclaw/plugin-sdk/file-lock` |

    Pluginهای bundled با اسکنر در برابر `infra-runtime` محافظت می‌شوند، پس
    کد مخزن نمی‌تواند به barrel گسترده پس‌رفت کند.

  </Step>

  <Step title="Migrate channel route helpers">
    کد جدید مسیر کانال باید از `openclaw/plugin-sdk/channel-route` استفاده کند.
    نام‌های قدیمی route-key و comparable-target در بازه مهاجرت به‌عنوان aliasهای
    سازگاری باقی می‌مانند، اما Pluginهای جدید باید از نام‌های route استفاده
    کنند که رفتار را مستقیما توصیف می‌کنند:

    | کمک‌کننده قدیمی | کمک‌کننده مدرن |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    کمک‌کننده‌های route مدرن، `{ channel, to, accountId, threadId }` را در
    تأییدهای native، سرکوب پاسخ، حذف تکراری ورودی، تحویل cron و مسیریابی
    نشست به‌شکل یکسان normalize می‌کنند.

    کاربرد جدیدی از `ChannelMessagingAdapter.parseExplicitTarget` یا
    کمک‌کننده‌های loaded-route مبتنی بر parser (`parseExplicitTargetForLoadedChannel`
    یا `resolveRouteTargetForLoadedChannel`) یا
    `resolveChannelRouteTargetWithParser(...)` از `plugin-sdk/channel-route`
    اضافه نکنید. این hookها منسوخ شده‌اند و فقط برای Pluginهای قدیمی‌تر در
    بازه مهاجرت باقی مانده‌اند. Pluginهای کانال جدید باید از
    `messaging.targetResolver.resolveTarget(...)` برای normalize کردن شناسه هدف
    و fallback در صورت نبودن directory، از `messaging.inferTargetChatType(...)`
    وقتی core به نوع peer زودهنگام نیاز دارد، و از
    `messaging.resolveOutboundSessionRoute(...)` برای نشست native ارائه‌دهنده و
    هویت thread استفاده کنند.

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
  | `plugin-sdk/plugin-entry` | کمک‌کنندهٔ ورودی متعارف Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | باز-‌export چتری قدیمی برای تعریف‌ها/سازنده‌های ورودی کانال | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | export اسکیمای پیکربندی ریشه | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | کمک‌کنندهٔ ورودی تک‌ارائه‌دهنده | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعریف‌ها و سازنده‌های متمرکز ورودی کانال | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | کمک‌کننده‌های مشترک جادوگر راه‌اندازی | مترجم راه‌اندازی، اعلان‌های allowlist، سازنده‌های وضعیت راه‌اندازی |
  | `plugin-sdk/setup-runtime` | کمک‌کننده‌های runtime زمان راه‌اندازی | `createSetupTranslator`, آداپتورهای وصلهٔ راه‌اندازی امن برای import، کمک‌کننده‌های یادداشت lookup، `promptResolvedAllowFrom`, `splitSetupEntries`, پراکسی‌های راه‌اندازی تفویض‌شده |
  | `plugin-sdk/setup-adapter-runtime` | نام مستعار منسوخ آداپتور راه‌اندازی | از `plugin-sdk/setup-runtime` استفاده کنید |
  | `plugin-sdk/setup-tools` | کمک‌کننده‌های ابزارسازی راه‌اندازی | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | کمک‌کننده‌های چندحسابی | کمک‌کننده‌های فهرست حساب/پیکربندی/دروازهٔ اقدام |
  | `plugin-sdk/account-id` | کمک‌کننده‌های شناسهٔ حساب | `DEFAULT_ACCOUNT_ID`, نرمال‌سازی شناسهٔ حساب |
  | `plugin-sdk/account-resolution` | کمک‌کننده‌های lookup حساب | کمک‌کننده‌های lookup حساب + بازگشت پیش‌فرض |
  | `plugin-sdk/account-helpers` | کمک‌کننده‌های محدود حساب | کمک‌کننده‌های فهرست حساب/اقدام حساب |
  | `plugin-sdk/channel-setup` | آداپتورهای جادوگر راه‌اندازی | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, به‌علاوهٔ `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | مولفه‌های پایه‌ای جفت‌سازی DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | سیم‌کشی پیشوند پاسخ، typing، و تحویل منبع | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | کارخانه‌های آداپتور پیکربندی و کمک‌کننده‌های دسترسی DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | سازنده‌های اسکیمای پیکربندی | فقط مولفه‌های پایه‌ای مشترک اسکیمای پیکربندی کانال و سازندهٔ عمومی |
  | `plugin-sdk/bundled-channel-config-schema` | اسکیماهای پیکربندی bundled | فقط Pluginهای bundled نگه‌داری‌شده توسط OpenClaw؛ Pluginهای جدید باید اسکیماهای محلی Plugin تعریف کنند |
  | `plugin-sdk/channel-config-schema-legacy` | اسکیماهای پیکربندی bundled منسوخ | فقط نام مستعار سازگاری؛ برای Pluginهای bundled نگه‌داری‌شده از `plugin-sdk/bundled-channel-config-schema` استفاده کنید |
  | `plugin-sdk/telegram-command-config` | کمک‌کننده‌های پیکربندی دستور Telegram | نرمال‌سازی نام دستور، کوتاه‌سازی توضیح، اعتبارسنجی تکرار/تعارض |
  | `plugin-sdk/channel-policy` | حل سیاست گروه/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | نمای سازگاری منسوخ | از `plugin-sdk/channel-outbound` استفاده کنید |
  | `plugin-sdk/inbound-envelope` | کمک‌کننده‌های envelope ورودی | کمک‌کننده‌های مشترک سازندهٔ route + envelope |
  | `plugin-sdk/channel-inbound` | کمک‌کننده‌های دریافت ورودی | ساخت context، قالب‌بندی، ریشه‌ها، runnerها، ارسال پاسخ آماده، و predicateهای dispatch |
  | `plugin-sdk/messaging-targets` | مسیر import منسوخ برای تجزیهٔ target | از `plugin-sdk/channel-targets` برای کمک‌کننده‌های عمومی تجزیهٔ target، از `plugin-sdk/channel-route` برای مقایسهٔ route، و از `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` متعلق به Plugin برای حل target ویژهٔ ارائه‌دهنده استفاده کنید |
  | `plugin-sdk/outbound-media` | کمک‌کننده‌های رسانهٔ خروجی | بارگذاری مشترک رسانهٔ خروجی |
  | `plugin-sdk/outbound-send-deps` | نمای سازگاری منسوخ | از `plugin-sdk/channel-outbound` استفاده کنید |
  | `plugin-sdk/channel-outbound` | کمک‌کننده‌های چرخهٔ عمر پیام خروجی | آداپتورهای پیام، رسیدها، کمک‌کننده‌های ارسال پایدار، کمک‌کننده‌های پیش‌نمایش/streaming زنده، گزینه‌های پاسخ، کمک‌کننده‌های چرخهٔ عمر، هویت خروجی، و برنامه‌ریزی payload |
  | `plugin-sdk/channel-streaming` | نمای سازگاری منسوخ | از `plugin-sdk/channel-outbound` استفاده کنید |
  | `plugin-sdk/outbound-runtime` | نمای سازگاری منسوخ | از `plugin-sdk/channel-outbound` استفاده کنید |
  | `plugin-sdk/thread-bindings-runtime` | کمک‌کننده‌های thread-binding | چرخهٔ عمر thread-binding و کمک‌کننده‌های آداپتور |
  | `plugin-sdk/agent-media-payload` | کمک‌کننده‌های قدیمی payload رسانه | سازندهٔ payload رسانهٔ agent برای چیدمان‌های قدیمی field |
  | `plugin-sdk/channel-runtime` | shim سازگاری منسوخ | فقط ابزارهای runtime قدیمی کانال |
  | `plugin-sdk/channel-send-result` | نوع‌های نتیجهٔ ارسال | نوع‌های نتیجهٔ پاسخ |
  | `plugin-sdk/runtime-store` | ذخیره‌سازی پایدار Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | کمک‌کننده‌های گستردهٔ runtime | کمک‌کننده‌های runtime/logging/backup/plugin-install |
  | `plugin-sdk/runtime-env` | کمک‌کننده‌های محدود env runtime | کمک‌کننده‌های logger/runtime env، timeout، retry، و backoff |
  | `plugin-sdk/plugin-runtime` | کمک‌کننده‌های مشترک runtime Plugin | کمک‌کننده‌های دستورها/hooks/http/interactive Plugin |
  | `plugin-sdk/hook-runtime` | کمک‌کننده‌های pipeline hook | کمک‌کننده‌های مشترک pipeline Webhook/internal hook |
  | `plugin-sdk/lazy-runtime` | کمک‌کننده‌های lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | کمک‌کننده‌های فرایند | کمک‌کننده‌های مشترک exec |
  | `plugin-sdk/cli-runtime` | کمک‌کننده‌های runtime CLI | قالب‌بندی دستور، انتظارها، کمک‌کننده‌های نسخه |
  | `plugin-sdk/gateway-runtime` | کمک‌کننده‌های Gateway | کلاینت Gateway، کمک‌کنندهٔ شروع آمادهٔ event-loop، و کمک‌کننده‌های وصلهٔ وضعیت کانال |
  | `plugin-sdk/config-runtime` | shim سازگاری پیکربندی منسوخ | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, و `config-mutation` را ترجیح دهید |
  | `plugin-sdk/telegram-command-config` | کمک‌کننده‌های دستور Telegram | کمک‌کننده‌های اعتبارسنجی دستور Telegram پایدار در fallback وقتی سطح قرارداد Telegram bundled در دسترس نیست |
  | `plugin-sdk/approval-runtime` | کمک‌کننده‌های اعلان تأیید | payload تأیید exec/plugin، کمک‌کننده‌های قابلیت/profile تأیید، کمک‌کننده‌های runtime/مسیریابی تأیید native، و قالب‌بندی مسیر نمایش ساختاریافتهٔ تأیید |
  | `plugin-sdk/approval-auth-runtime` | کمک‌کننده‌های auth تأیید | حل approver، auth اقدام همان چت |
  | `plugin-sdk/approval-client-runtime` | کمک‌کننده‌های کلاینت تأیید | کمک‌کننده‌های profile/filter تأیید native exec |
  | `plugin-sdk/approval-delivery-runtime` | کمک‌کننده‌های تحویل تأیید | آداپتورهای قابلیت/تحویل تأیید native |
  | `plugin-sdk/approval-gateway-runtime` | کمک‌کننده‌های Gateway تأیید | کمک‌کنندهٔ مشترک حل Gateway تأیید |
  | `plugin-sdk/approval-handler-adapter-runtime` | کمک‌کننده‌های آداپتور تأیید | کمک‌کننده‌های سبک بارگذاری آداپتور تأیید native برای entrypointهای داغ کانال |
  | `plugin-sdk/approval-handler-runtime` | کمک‌کننده‌های handler تأیید | کمک‌کننده‌های گسترده‌تر runtime handler تأیید؛ وقتی مرزهای adapter/gateway محدودتر کافی هستند، آن‌ها را ترجیح دهید |
  | `plugin-sdk/approval-native-runtime` | کمک‌کننده‌های target تأیید | کمک‌کننده‌های اتصال target/account تأیید native |
  | `plugin-sdk/approval-reply-runtime` | کمک‌کننده‌های پاسخ تأیید | کمک‌کننده‌های payload پاسخ تأیید exec/plugin |
  | `plugin-sdk/channel-runtime-context` | کمک‌کننده‌های runtime-context کانال | کمک‌کننده‌های عمومی register/get/watch برای runtime-context کانال |
  | `plugin-sdk/security-runtime` | کمک‌کننده‌های امنیت | کمک‌کننده‌های مشترک اعتماد، دروازه‌گذاری DM، فایل/مسیر محدود به ریشه، محتوای خارجی، و گردآوری secret |
  | `plugin-sdk/ssrf-policy` | کمک‌کننده‌های سیاست SSRF | کمک‌کننده‌های allowlist میزبان و سیاست شبکهٔ خصوصی |
  | `plugin-sdk/ssrf-runtime` | کمک‌کننده‌های runtime SSRF | dispatcher پین‌شده، fetch محافظت‌شده، کمک‌کننده‌های سیاست SSRF |
  | `plugin-sdk/system-event-runtime` | کمک‌کننده‌های رویداد سیستم | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | کمک‌کننده‌های Heartbeat | کمک‌کننده‌های بیدارسازی، رویداد، و قابلیت مشاهدهٔ Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | کمک‌کننده‌های صف تحویل | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | کمک‌کننده‌های فعالیت کانال | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | کمک‌کننده‌های حذف تکراری | کش‌های حذف تکراری در حافظه |
  | `plugin-sdk/file-access-runtime` | کمک‌کننده‌های دسترسی فایل | کمک‌کننده‌های امن مسیر فایل/رسانهٔ محلی |
  | `plugin-sdk/transport-ready-runtime` | کمک‌کننده‌های آمادگی transport | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | کمک‌کننده‌های سیاست تأیید exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | کمک‌کننده‌های کش محدود | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | کمک‌کننده‌های دروازه‌گذاری عیب‌یابی | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | کمک‌کننده‌های قالب‌بندی خطا | `formatUncaughtError`, `isApprovalNotFoundError`, کمک‌کننده‌های گراف خطا |
  | `plugin-sdk/fetch-runtime` | کمک‌کننده‌های fetch/proxy پوشش‌داده‌شده | `resolveFetch`, کمک‌کننده‌های proxy، کمک‌کننده‌های گزینهٔ EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | کمک‌کننده‌های نرمال‌سازی میزبان | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | کمک‌کننده‌های retry | `RetryConfig`, `retryAsync`, runnerهای سیاست |
  | `plugin-sdk/allow-from` | قالب‌بندی allowlist و نگاشت ورودی | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | کمک‌کننده‌های دروازه‌گذاری دستور و سطح دستور | `resolveControlCommandGate`, کمک‌کننده‌های authorizaton فرستنده، کمک‌کننده‌های registry دستور شامل قالب‌بندی منوی آرگومان پویا |
  | `plugin-sdk/command-status` | rendererهای وضعیت/راهنمای دستور | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | تجزیهٔ ورودی secret | کمک‌کننده‌های ورودی secret |
  | `plugin-sdk/webhook-ingress` | کمک‌کننده‌های درخواست Webhook | ابزارهای target Webhook |
  | `plugin-sdk/webhook-request-guards` | کمک‌کننده‌های guard بدنهٔ Webhook | کمک‌کننده‌های خواندن/محدودیت بدنهٔ درخواست |
  | `plugin-sdk/reply-runtime` | runtime مشترک پاسخ | dispatch ورودی، heartbeat، برنامه‌ریز پاسخ، chunking |
  | `plugin-sdk/reply-dispatch-runtime` | کمک‌کننده‌های محدود dispatch پاسخ | finalize، dispatch ارائه‌دهنده، و کمک‌کننده‌های برچسب گفتگو |
  | `plugin-sdk/reply-history` | کمک‌کننده‌های تاریخچهٔ پاسخ | `createChannelHistoryWindow`؛ exportهای سازگاری منسوخ map-helper مانند `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, و `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | برنامه‌ریزی مرجع پاسخ | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | کمک‌کننده‌های chunk پاسخ | کمک‌کننده‌های chunking متن/markdown |
  | `plugin-sdk/session-store-runtime` | کمک‌کننده‌های store نشست | کمک‌کننده‌های مسیر store + updated-at |
  | `plugin-sdk/state-paths` | کمک‌کننده‌های مسیر state | کمک‌کننده‌های دایرکتوری state و OAuth |
  | `plugin-sdk/routing` | راهنماهای مسیریابی/کلید نشست | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`، راهنماهای نرمال‌سازی کلید نشست |
  | `plugin-sdk/status-helpers` | راهنماهای وضعیت کانال | سازنده‌های خلاصه وضعیت کانال/حساب، پیش‌فرض‌های وضعیت زمان اجرا، راهنماهای فراداده مسئله |
  | `plugin-sdk/target-resolver-runtime` | راهنماهای حل‌کننده هدف | راهنماهای مشترک حل‌کننده هدف |
  | `plugin-sdk/string-normalization-runtime` | راهنماهای نرمال‌سازی رشته | راهنماهای نرمال‌سازی اسلاگ/رشته |
  | `plugin-sdk/request-url` | راهنماهای URL درخواست | استخراج URLهای رشته‌ای از ورودی‌های شبیه درخواست |
  | `plugin-sdk/run-command` | راهنماهای فرمان زمان‌بندی‌شده | اجراکننده فرمان زمان‌بندی‌شده با stdout/stderr نرمال‌شده |
  | `plugin-sdk/param-readers` | خواننده‌های پارامتر | خواننده‌های رایج پارامتر ابزار/CLI |
  | `plugin-sdk/tool-payload` | استخراج payload ابزار | استخراج payloadهای نرمال‌شده از اشیای نتیجه ابزار |
  | `plugin-sdk/tool-send` | استخراج ارسال ابزار | استخراج فیلدهای هدف ارسال کانونی از آرگومان‌های ابزار |
  | `plugin-sdk/temp-path` | راهنماهای مسیر موقت | راهنماهای مشترک مسیر دانلود موقت |
  | `plugin-sdk/logging-core` | راهنماهای ثبت لاگ | راهنماهای logger زیرسیستم و پنهان‌سازی داده |
  | `plugin-sdk/markdown-table-runtime` | راهنماهای جدول Markdown | راهنماهای حالت جدول Markdown |
  | `plugin-sdk/reply-payload` | انواع پاسخ پیام | انواع payload پاسخ |
  | `plugin-sdk/provider-setup` | راهنماهای گزیده راه‌اندازی provider محلی/خودمیزبان | راهنماهای کشف/پیکربندی provider خودمیزبان |
  | `plugin-sdk/self-hosted-provider-setup` | راهنماهای متمرکز راه‌اندازی provider خودمیزبان سازگار با OpenAI | همان راهنماهای کشف/پیکربندی provider خودمیزبان |
  | `plugin-sdk/provider-auth-runtime` | راهنماهای احراز هویت زمان اجرای provider | راهنماهای رفع API-key در زمان اجرا |
  | `plugin-sdk/provider-auth-api-key` | راهنماهای راه‌اندازی API-key provider | راهنماهای onboarding/نوشتن پروفایل API-key |
  | `plugin-sdk/provider-auth-result` | راهنماهای نتیجه احراز هویت provider | سازنده استاندارد نتیجه احراز هویت OAuth |
  | `plugin-sdk/provider-selection-runtime` | راهنماهای انتخاب provider | انتخاب provider پیکربندی‌شده یا خودکار و ادغام پیکربندی خام provider |
  | `plugin-sdk/provider-env-vars` | راهنماهای متغیر محیطی provider | راهنماهای جست‌وجوی متغیر محیطی احراز هویت provider |
  | `plugin-sdk/provider-model-shared` | راهنماهای مشترک مدل/replay provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`، سازنده‌های مشترک سیاست replay، راهنماهای endpoint provider، و راهنماهای نرمال‌سازی model-id |
  | `plugin-sdk/provider-catalog-shared` | راهنماهای مشترک کاتالوگ provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | وصله‌های onboarding provider | راهنماهای پیکربندی onboarding |
  | `plugin-sdk/provider-http` | راهنماهای HTTP provider | راهنماهای عمومی قابلیت HTTP/endpoint provider، شامل راهنماهای فرم multipart رونویسی صوت |
  | `plugin-sdk/provider-web-fetch` | راهنماهای web-fetch provider | راهنماهای ثبت/کش provider وب‌فچ |
  | `plugin-sdk/provider-web-search-config-contract` | راهنماهای پیکربندی جست‌وجوی وب provider | راهنماهای محدود پیکربندی/اعتبارنامه جست‌وجوی وب برای providerهایی که به سیم‌کشی فعال‌سازی Plugin نیاز ندارند |
  | `plugin-sdk/provider-web-search-contract` | راهنماهای قرارداد جست‌وجوی وب provider | راهنماهای محدود قرارداد پیکربندی/اعتبارنامه جست‌وجوی وب مانند `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`، و setter/getterهای اعتبارنامه scoped |
  | `plugin-sdk/provider-web-search` | راهنماهای جست‌وجوی وب provider | راهنماهای ثبت/کش/زمان اجرای provider جست‌وجوی وب |
  | `plugin-sdk/provider-tools` | راهنماهای سازگاری ابزار/schema provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`، و پاک‌سازی schema و عیب‌یابی DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | راهنماهای مصرف provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`، و دیگر راهنماهای مصرف provider |
  | `plugin-sdk/provider-stream` | راهنماهای wrapper جریان provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`، انواع wrapper جریان، و راهنماهای مشترک wrapper برای Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | راهنماهای transport provider | راهنماهای transport بومی provider مانند fetch محافظت‌شده، تبدیل‌های پیام transport، و جریان‌های رویداد transport قابل نوشتن |
  | `plugin-sdk/keyed-async-queue` | صف ناهمگام مرتب | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | راهنماهای مشترک رسانه | راهنماهای دریافت/تبدیل/ذخیره رسانه، probing ابعاد ویدیو با پشتوانه ffprobe، و سازنده‌های payload رسانه |
  | `plugin-sdk/media-generation-runtime` | راهنماهای مشترک تولید رسانه | راهنماهای مشترک failover، انتخاب candidate، و پیام‌رسانی مدل گم‌شده برای تولید تصویر/ویدیو/موسیقی |
  | `plugin-sdk/media-understanding` | راهنماهای درک رسانه | انواع provider درک رسانه به‌همراه خروجی‌های راهنمای تصویر/صوت برای provider |
  | `plugin-sdk/text-runtime` | خروجی گسترده منسوخ سازگاری متن | از `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`، و `logging-core` استفاده کنید |
  | `plugin-sdk/text-chunking` | راهنماهای قطعه‌بندی متن | راهنمای قطعه‌بندی متن خروجی |
  | `plugin-sdk/speech` | راهنماهای گفتار | انواع provider گفتار به‌همراه راهنماهای directive، registry، اعتبارسنجی برای provider و سازنده TTS سازگار با OpenAI |
  | `plugin-sdk/speech-core` | هسته مشترک گفتار | انواع provider گفتار، registry، directiveها، نرمال‌سازی |
  | `plugin-sdk/realtime-transcription` | راهنماهای رونویسی بلادرنگ | انواع provider، راهنماهای registry، و راهنمای مشترک نشست WebSocket |
  | `plugin-sdk/realtime-voice` | راهنماهای صدای بلادرنگ | انواع provider، راهنماهای registry/رفع، راهنماهای نشست bridge، صف‌های مشترک پاسخ‌گویی صوتی عامل، کنترل صوتی اجرای فعال، سلامت transcript/رویداد، سرکوب echo، تطبیق پرسش مشورتی، هماهنگی مشورت اجباری، ردیابی بافت نوبت، ردیابی فعالیت خروجی، و راهنماهای مشورت سریع بافت |
  | `plugin-sdk/image-generation` | راهنماهای تولید تصویر | انواع provider تولید تصویر به‌همراه راهنماهای asset تصویر/data URL و سازنده provider تصویر سازگار با OpenAI |
  | `plugin-sdk/image-generation-core` | هسته مشترک تولید تصویر | انواع تولید تصویر، failover، احراز هویت، و راهنماهای registry |
  | `plugin-sdk/music-generation` | راهنماهای تولید موسیقی | انواع provider/request/result تولید موسیقی |
  | `plugin-sdk/music-generation-core` | هسته مشترک تولید موسیقی | انواع تولید موسیقی، راهنماهای failover، جست‌وجوی provider، و تجزیه model-ref |
  | `plugin-sdk/video-generation` | راهنماهای تولید ویدیو | انواع provider/request/result تولید ویدیو |
  | `plugin-sdk/video-generation-core` | هسته مشترک تولید ویدیو | انواع تولید ویدیو، راهنماهای failover، جست‌وجوی provider، و تجزیه model-ref |
  | `plugin-sdk/interactive-runtime` | راهنماهای پاسخ تعاملی | نرمال‌سازی/کاهش payload پاسخ تعاملی |
  | `plugin-sdk/channel-config-primitives` | primitiveهای پیکربندی کانال | primitiveهای محدود schema پیکربندی کانال |
  | `plugin-sdk/channel-config-writes` | راهنماهای نوشتن پیکربندی کانال | راهنماهای مجوزدهی نوشتن پیکربندی کانال |
  | `plugin-sdk/channel-plugin-common` | prelude مشترک کانال | خروجی‌های prelude مشترک Plugin کانال |
  | `plugin-sdk/channel-status` | راهنماهای وضعیت کانال | راهنماهای مشترک snapshot/خلاصه وضعیت کانال |
  | `plugin-sdk/allowlist-config-edit` | راهنماهای پیکربندی فهرست مجاز | راهنماهای ویرایش/خواندن پیکربندی فهرست مجاز |
  | `plugin-sdk/group-access` | راهنماهای دسترسی گروه | راهنماهای مشترک تصمیم‌گیری دسترسی گروه |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | facadeهای سازگاری منسوخ | از `plugin-sdk/channel-inbound` استفاده کنید |
  | `plugin-sdk/direct-dm-guard-policy` | راهنماهای محافظ Direct-DM | راهنماهای محدود سیاست محافظ پیش از رمزنگاری |
  | `plugin-sdk/extension-shared` | راهنماهای مشترک افزونه | primitiveهای کانال passive/status و راهنمای پراکسی ambient |
  | `plugin-sdk/webhook-targets` | راهنماهای هدف Webhook | راهنماهای registry هدف Webhook و نصب route |
  | `plugin-sdk/webhook-path` | نام مستعار مسیر webhook منسوخ | از `plugin-sdk/webhook-ingress` استفاده کنید |
  | `plugin-sdk/web-media` | راهنماهای مشترک رسانه وب | راهنماهای بارگذاری رسانه راه‌دور/محلی |
  | `plugin-sdk/zod` | re-export سازگاری Zod منسوخ | `zod` را مستقیما از `zod` وارد کنید |
  | `plugin-sdk/memory-core` | راهنماهای memory-core باندل‌شده | سطح راهنماهای مدیر/پیکربندی/فایل/CLI حافظه |
  | `plugin-sdk/memory-core-engine-runtime` | facade زمان اجرای موتور حافظه | facade زمان اجرای index/search حافظه |
  | `plugin-sdk/memory-core-host-embedding-registry` | registry جاسازی حافظه | راهنماهای سبک registry provider جاسازی حافظه |
  | `plugin-sdk/memory-core-host-engine-foundation` | موتور foundation میزبان حافظه | خروجی‌های موتور foundation میزبان حافظه |
  | `plugin-sdk/memory-core-host-engine-embeddings` | موتور embedding میزبان حافظه | قراردادهای embedding حافظه، دسترسی registry، provider محلی، و راهنماهای عمومی batch/راه‌دور؛ providerهای راه‌دور مشخص در Pluginهای مالک خود قرار دارند |
  | `plugin-sdk/memory-core-host-engine-qmd` | موتور QMD میزبان حافظه | خروجی‌های موتور QMD میزبان حافظه |
  | `plugin-sdk/memory-core-host-engine-storage` | موتور ذخیره‌سازی میزبان حافظه | خروجی‌های موتور ذخیره‌سازی میزبان حافظه |
  | `plugin-sdk/memory-core-host-multimodal` | راهنماهای چندوجهی میزبان حافظه | راهنماهای چندوجهی میزبان حافظه |
  | `plugin-sdk/memory-core-host-query` | راهنماهای query میزبان حافظه | راهنماهای query میزبان حافظه |
  | `plugin-sdk/memory-core-host-secret` | راهنماهای secret میزبان حافظه | راهنماهای secret میزبان حافظه |
  | `plugin-sdk/memory-core-host-events` | نام مستعار رویداد حافظه منسوخ | از `plugin-sdk/memory-host-events` استفاده کنید |
  | `plugin-sdk/memory-core-host-status` | راهنماهای وضعیت میزبان حافظه | راهنماهای وضعیت میزبان حافظه |
  | `plugin-sdk/memory-core-host-runtime-cli` | زمان اجرای CLI میزبان حافظه | راهنماهای زمان اجرای CLI میزبان حافظه |
  | `plugin-sdk/memory-core-host-runtime-core` | زمان اجرای هسته میزبان حافظه | راهنماهای زمان اجرای هسته میزبان حافظه |
  | `plugin-sdk/memory-core-host-runtime-files` | راهنماهای فایل/زمان اجرای میزبان حافظه | راهنماهای فایل/زمان اجرای میزبان حافظه |
  | `plugin-sdk/memory-host-core` | نام مستعار زمان اجرای هسته میزبان حافظه | نام مستعار vendor-neutral برای راهنماهای زمان اجرای هسته میزبان حافظه |
  | `plugin-sdk/memory-host-events` | نام مستعار journal رویداد میزبان حافظه | نام مستعار vendor-neutral برای راهنماهای journal رویداد میزبان حافظه |
  | `plugin-sdk/memory-host-files` | نام مستعار فایل/زمان اجرای حافظه منسوخ | از `plugin-sdk/memory-core-host-runtime-files` استفاده کنید |
  | `plugin-sdk/memory-host-markdown` | راهنماهای markdown مدیریت‌شده | راهنماهای مشترک managed-markdown برای Pluginهای نزدیک به حافظه |
  | `plugin-sdk/memory-host-search` | facade جست‌وجوی Active Memory | facade تنبل زمان اجرای مدیر جست‌وجوی active-memory |
  | `plugin-sdk/memory-host-status` | نام مستعار وضعیت میزبان حافظه منسوخ | از `plugin-sdk/memory-core-host-status` استفاده کنید |
  | `plugin-sdk/testing` | ابزارهای تست | barrel سازگاری منسوخ محلی repo؛ از subpathهای تست متمرکز محلی repo مانند `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`، و `plugin-sdk/test-fixtures` استفاده کنید |
</Accordion>

این جدول عمداً زیرمجموعهٔ مهاجرت رایج است، نه کل سطح SDK.
فهرست نقطه‌های ورود کامپایلر در
`scripts/lib/plugin-sdk-entrypoints.json` قرار دارد؛ خروجی‌های package از
زیرمجموعهٔ عمومی تولید می‌شوند.

seamهای کمکی رزروشده برای bundled-plugin از export map عمومی SDK
بازنشسته شده‌اند، به‌جز facadeهای سازگاری که صراحتاً مستند شده‌اند، مانند
shim منسوخ‌شدهٔ `plugin-sdk/discord` که برای package منتشرشدهٔ
`@openclaw/discord@2026.3.13` نگه داشته شده است. کمک‌کننده‌های مختص مالک
داخل package همان plugin مالک قرار دارند؛ رفتار مشترک میزبان باید از طریق
قراردادهای عمومی SDK مانند `plugin-sdk/gateway-runtime`،
`plugin-sdk/security-runtime`، و `plugin-sdk/plugin-config-runtime` منتقل شود.

از محدودترین importی استفاده کنید که با کار موردنظر سازگار است. اگر exportی
پیدا نمی‌کنید، source را در `src/plugin-sdk/` بررسی کنید یا از نگه‌دارندگان
بپرسید کدام قرارداد عمومی باید مالک آن باشد.

## منسوخ‌سازی‌های فعال

منسوخ‌سازی‌های محدودتری که در سراسر plugin SDK، قرارداد provider، سطح runtime،
و manifest اعمال می‌شوند. هرکدام هنوز امروز کار می‌کنند اما در یک انتشار major
آینده حذف خواهند شد. ورودی زیر هر مورد API قدیمی را به جایگزین canonical آن
نگاشت می‌کند.

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **قدیمی (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **جدید (`openclaw/plugin-sdk/command-status`)**: همان signatureها، همان
    exportها - فقط از subpath محدودتر import می‌شوند. `command-auth` آن‌ها را
    به‌عنوان stubهای سازگاری دوباره export می‌کند.

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

    pluginهای channel پایین‌دستی (Slack، Discord، Matrix، MS Teams) قبلاً
    تغییر کرده‌اند.

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` یک shim سازگاری برای pluginهای channel
    قدیمی‌تر است. آن را از code جدید import نکنید؛ برای ثبت شیءهای runtime از
    `openclaw/plugin-sdk/channel-runtime-context` استفاده کنید.

    کمک‌کننده‌های `channelActions*` در `openclaw/plugin-sdk/channel-actions`
    همراه با exportهای channel خام «actions» منسوخ شده‌اند. قابلیت‌ها را
    به‌جای آن از طریق سطح معنایی `presentation` ارائه کنید - pluginهای channel
    اعلام می‌کنند چه چیزی render می‌کنند (cardها، buttonها، selectها)، نه اینکه
    کدام نام‌های action خام را می‌پذیرند.

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **قدیمی**: factory `tool()` از `openclaw/plugin-sdk/provider-web-search`.

    **جدید**: `createTool(...)` را مستقیماً روی provider plugin پیاده‌سازی کنید.
    OpenClaw دیگر برای ثبت wrapper ابزار به کمک‌کنندهٔ SDK نیاز ندارد.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **قدیمی**: `formatInboundEnvelope(...)` (و
    `ChannelMessageForAgent.channelEnvelope`) برای ساخت یک envelope prompt
    متنی تخت از پیام‌های channel ورودی.

    **جدید**: `BodyForAgent` به‌همراه blockهای ساخت‌یافتهٔ context کاربر.
    pluginهای channel metadata مسیریابی (thread، topic، reply-to، reactionها)
    را به‌جای چسباندن آن‌ها به یک رشتهٔ prompt، به‌صورت fieldهای typed متصل
    می‌کنند. کمک‌کنندهٔ `formatAgentEnvelope(...)` همچنان برای envelopeهای
    synthesized رو به assistant پشتیبانی می‌شود، اما envelopeهای plaintext
    ورودی در مسیر حذف هستند.

    نواحی تحت‌تأثیر: `inbound_claim`، `message_received`، و هر plugin سفارشی
    channel که متن `channelEnvelope` را post-process کرده است.

  </Accordion>

  <Accordion title="deactivate hook → gateway_stop">
    **قدیمی**: `api.on("deactivate", handler)`.

    **جدید**: `api.on("gateway_stop", handler)`. event و context همان قرارداد
    cleanup هنگام shutdown هستند؛ فقط نام hook تغییر می‌کند.

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

    `deactivate` تا بعد از 2026-08-16 همچنان به‌عنوان alias سازگاری منسوخ‌شده
    wire شده باقی می‌ماند.

  </Accordion>

  <Accordion title="subagent_spawning hook → core thread binding">
    **قدیمی**: `api.on("subagent_spawning", handler)` که
    `threadBindingReady` یا `deliveryOrigin` برمی‌گرداند.

    **جدید**: اجازه دهید core اتصال‌های subagent با `thread: true` را از طریق
    adapter اتصال session در channel آماده کند. از
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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` فقط تا زمان مهاجرت
    pluginهای خارجی به‌عنوان سطح‌های سازگاری منسوخ‌شده باقی می‌مانند.

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    چهار alias نوع discovery اکنون wrapperهای نازکی روی نوع‌های دورهٔ catalog
    هستند:

    | alias قدیمی               | نوع جدید                   |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    به‌علاوهٔ bag static قدیمی `ProviderCapabilities` - pluginهای provider باید
    به‌جای یک شیء static از hookهای صریح provider مانند `buildReplayPolicy`،
    `normalizeToolSchemas`، و `wrapStreamFn` استفاده کنند.

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **قدیمی** (سه hook جداگانه روی `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`، `supportsXHighThinking(ctx)`، و
    `resolveDefaultThinkingLevel(ctx)`.

    **جدید**: یک `resolveThinkingProfile(ctx)` واحد که یک
    `ProviderThinkingProfile` با `id` canonical، `label` اختیاری، و فهرست
    رتبه‌بندی‌شدهٔ levelها برمی‌گرداند. OpenClaw مقدارهای ذخیره‌شدهٔ stale را
    به‌صورت خودکار بر اساس رتبهٔ profile پایین می‌آورد.

    context شامل `provider`، `modelId`، `reasoning` ادغام‌شدهٔ اختیاری، و
    factهای `compat` مدل ادغام‌شدهٔ اختیاری است. pluginهای provider می‌توانند
    از این factهای catalog استفاده کنند تا profile مختص مدل را فقط وقتی ارائه
    کنند که قرارداد request پیکربندی‌شده از آن پشتیبانی می‌کند.

    به‌جای سه hook، یک hook پیاده‌سازی کنید. hookهای legacy در طول پنجرهٔ
    منسوخ‌سازی همچنان کار می‌کنند، اما با نتیجهٔ profile ترکیب نمی‌شوند.

  </Accordion>

  <Accordion title="External auth providers → contracts.externalAuthProviders">
    **قدیمی**: پیاده‌سازی hookهای external auth بدون اعلام provider در manifest
    plugin.

    **جدید**: `contracts.externalAuthProviders` را در manifest plugin اعلام کنید
    **و** `resolveExternalAuthProfiles(...)` را پیاده‌سازی کنید.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    field manifest **قدیمی**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **جدید**: همان lookup برای env-var را در `setup.providers[].envVars` روی
    manifest mirror کنید. این کار metadata مربوط به env برای setup/status را در
    یک جا یکپارچه می‌کند و از boot شدن runtime plugin فقط برای پاسخ به lookupهای
    env-var جلوگیری می‌کند.

    `providerAuthEnvVars` تا بسته‌شدن پنجرهٔ منسوخ‌سازی از طریق یک adapter
    سازگاری همچنان پشتیبانی می‌شود.

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **قدیمی**: سه فراخوانی جدا -
    `api.registerMemoryPromptSection(...)`،
    `api.registerMemoryFlushPlan(...)`،
    `api.registerMemoryRuntime(...)`.

    **جدید**: یک فراخوانی روی API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    همان slotها، یک فراخوانی ثبت واحد. کمک‌کننده‌های افزایشی prompt و corpus
    (`registerMemoryPromptSupplement`، `registerMemoryCorpusSupplement`) تحت‌تأثیر
    نیستند.

  </Accordion>

  <Accordion title="Memory embedding provider API">
    **قدیمی**: `api.registerMemoryEmbeddingProvider(...)` به‌علاوهٔ
    `contracts.memoryEmbeddingProviders`.

    **جدید**: `api.registerEmbeddingProvider(...)` به‌علاوهٔ
    `contracts.embeddingProviders`.

    قرارداد عمومی embedding provider بیرون از memory هم قابل استفادهٔ دوباره
    است و مسیر پشتیبانی‌شده برای providerهای جدید محسوب می‌شود. API ثبت
    مختص memory تا زمان مهاجرت providerهای موجود همچنان به‌عنوان سازگاری
    منسوخ‌شده wire شده باقی می‌ماند. گزارش‌های بازرسی plugin، استفادهٔ
    non-bundled را به‌عنوان بدهی سازگاری گزارش می‌کنند.

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    دو alias نوع legacy همچنان از `src/plugins/runtime/types.ts` export می‌شوند:

    | قدیمی                         | جدید                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    متد runtime با نام `readSession` به‌نفع `getSessionMessages` منسوخ شده است.
    همان signature را دارد؛ متد قدیمی به متد جدید call through می‌کند.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **قدیمی**: `runtime.tasks.flow` (مفرد) یک accessor زندهٔ task-flow برمی‌گرداند.

    **جدید**: `runtime.tasks.managedFlows` runtime تغییر managed TaskFlow را برای
    pluginهایی نگه می‌دارد که از یک flow، taskهای child ایجاد، به‌روزرسانی،
    لغو، یا اجرا می‌کنند. وقتی plugin فقط به readهای مبتنی بر DTO نیاز دارد از
    `runtime.tasks.flows` استفاده کنید.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    در بخش «نحوهٔ مهاجرت → مهاجرت extensionهای embedded tool-result به
    middleware» در بالا پوشش داده شده است. برای کامل بودن اینجا هم آمده است:
    مسیر حذف‌شدهٔ فقط embedded-runner با نام
    `api.registerEmbeddedExtensionFactory(...)` با
    `api.registerAgentToolResultMiddleware(...)` و یک فهرست runtime صریح در
    `contracts.agentToolResultMiddleware` جایگزین شده است.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
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
منسوخ‌سازی‌های سطح extension (داخل pluginهای channel/provider bundled زیر
`extensions/`) داخل barrelهای `api.ts` و `runtime-api.ts` خودشان ردیابی می‌شوند.
آن‌ها روی قراردادهای plugin شخص ثالث اثر نمی‌گذارند و اینجا فهرست نشده‌اند. اگر
barrel محلی یک plugin bundled را مستقیماً مصرف می‌کنید، پیش از ارتقا commentهای
منسوخ‌سازی را در همان barrel بخوانید.
</Note>

## جدول زمانی حذف

| زمان | چه اتفاقی می‌افتد |
| ---------------------- | ----------------------------------------------------------------------- |
| **اکنون** | سطوح منسوخ‌شده هشدارهای زمان اجرا صادر می‌کنند |
| **نسخه اصلی بعدی** | سطوح منسوخ‌شده حذف خواهند شد؛ Pluginهایی که هنوز از آن‌ها استفاده می‌کنند شکست خواهند خورد |

همه Pluginهای هسته از قبل مهاجرت داده شده‌اند. Pluginهای خارجی باید
پیش از نسخه اصلی بعدی مهاجرت کنند.

## سرکوب موقت هشدارها

هنگام کار روی مهاجرت، این متغیرهای محیطی را تنظیم کنید:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

این یک راه فرار موقت است، نه یک راه‌حل دائمی.

## مرتبط

- [شروع به کار](/fa/plugins/building-plugins) - نخستین Plugin خود را بسازید
- [نمای کلی SDK](/fa/plugins/sdk-overview) - مرجع کامل وارد کردن زیردامنه مسیر
- [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) - ساخت Pluginهای کانال
- [Pluginهای ارائه‌دهنده](/fa/plugins/sdk-provider-plugins) - ساخت Pluginهای ارائه‌دهنده
- [درون‌ساخت Plugin](/fa/plugins/architecture) - بررسی عمیق معماری
- [مانیفست Plugin](/fa/plugins/manifest) - مرجع طرح‌واره مانیفست
