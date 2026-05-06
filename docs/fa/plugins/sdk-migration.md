---
read_when:
    - هشدار OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED را مشاهده می‌کنید
    - هشدار OPENCLAW_EXTENSION_API_DEPRECATED را مشاهده می‌کنید
    - شما پیش از OpenClaw 2026.4.25 از api.registerEmbeddedExtensionFactory استفاده کرده‌اید
    - شما در حال به‌روزرسانی یک Plugin به معماری مدرن Plugin هستید
    - شما یک Plugin خارجی OpenClaw را نگهداری می‌کنید.
sidebarTitle: Migrate to SDK
summary: از لایهٔ قدیمی سازگاری با نسخه‌های پیشین به SDK مدرن Plugin مهاجرت کنید
title: مهاجرت Plugin SDK
x-i18n:
    generated_at: "2026-05-06T09:34:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: f629f6e3f9a0c122f3065d9b0b6b418e1c1ba29d42aff9ed025d61189be3e42a
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw از یک لایه گسترده سازگاری با نسخه‌های قبلی به معماری مدرن Plugin
با importهای متمرکز و مستند مهاجرت کرده است. اگر Plugin شما پیش از
معماری جدید ساخته شده، این راهنما به شما برای مهاجرت کمک می‌کند.

## چه چیزی تغییر می‌کند

سیستم قدیمی Plugin دو سطح بسیار باز فراهم می‌کرد که به Pluginها اجازه می‌داد
هر چیزی را که نیاز داشتند از یک نقطه ورود واحد import کنند:

- **`openclaw/plugin-sdk/compat`** - یک import واحد که ده‌ها
  helper را دوباره export می‌کرد. این مسیر معرفی شد تا Pluginهای قدیمی مبتنی بر hook
  در زمان ساخت معماری جدید Plugin همچنان کار کنند.
- **`openclaw/plugin-sdk/infra-runtime`** - یک barrel گسترده از helperهای runtime که
  رویدادهای سیستم، وضعیت Heartbeat، صف‌های تحویل، helperهای fetch/proxy،
  helperهای فایل، نوع‌های تأیید، و utilityهای نامرتبط را با هم مخلوط می‌کرد.
- **`openclaw/plugin-sdk/config-runtime`** - یک barrel گسترده سازگاری config
  که هنوز در بازه مهاجرت، helperهای مستقیم منسوخ‌شده برای load/write را نگه می‌دارد.
- **`openclaw/extension-api`** - پلی که به Pluginها دسترسی مستقیم به
  helperهای سمت host مانند runner عامل تعبیه‌شده می‌داد.
- **`api.registerEmbeddedExtensionFactory(...)`** - یک hook حذف‌شده مخصوص Pi برای
  extension بسته‌بندی‌شده که می‌توانست رویدادهای embedded-runner مانند
  `tool_result` را مشاهده کند.

سطح‌های گسترده import اکنون **منسوخ** هستند. آن‌ها هنوز در runtime کار می‌کنند،
اما Pluginهای جدید نباید از آن‌ها استفاده کنند، و Pluginهای موجود باید پیش از
انتشار major بعدی که آن‌ها را حذف می‌کند مهاجرت کنند. API ثبت factory مخصوص Pi
برای extension تعبیه‌شده حذف شده است؛ به جای آن از middleware نتیجه ابزار استفاده کنید.

OpenClaw رفتار مستند Plugin را در همان تغییری که جایگزینی معرفی می‌کند حذف یا
بازتعریف نمی‌کند. تغییرات شکننده contract باید ابتدا از مسیر adapter سازگاری،
diagnosticها، docs، و بازه منسوخ‌سازی عبور کنند. این برای importهای SDK، فیلدهای
manifest، APIهای setup، hookها، و رفتار ثبت runtime اعمال می‌شود.

<Warning>
  لایه سازگاری با نسخه‌های قبلی در یک انتشار major آینده حذف خواهد شد.
  Pluginهایی که همچنان از این سطح‌ها import می‌کنند، وقتی این اتفاق بیفتد خراب خواهند شد.
  ثبت‌های factory برای extension تعبیه‌شده مخصوص Pi همین حالا دیگر load نمی‌شوند.
</Warning>

## چرا این تغییر انجام شد

رویکرد قدیمی مشکل‌ساز بود:

- **راه‌اندازی کند** - import کردن یک helper ده‌ها ماژول نامرتبط را load می‌کرد
- **وابستگی‌های چرخه‌ای** - re-exportهای گسترده ایجاد چرخه‌های import را آسان می‌کرد
- **سطح API نامشخص** - راهی برای تشخیص exportهای پایدار از داخلی وجود نداشت

SDK مدرن Plugin این را اصلاح می‌کند: هر مسیر import (`openclaw/plugin-sdk/\<subpath\>`)
یک ماژول کوچک و خودبسنده با هدف روشن و contract مستند است.

seamهای convenience قدیمی provider برای channelهای بسته‌بندی‌شده نیز حذف شده‌اند.
seamهای helper با برند channel، میان‌برهای خصوصی mono-repo بودند، نه
contractهای پایدار Plugin. به جای آن از subpathهای باریک و عمومی SDK استفاده کنید. داخل workspace
Plugin بسته‌بندی‌شده، helperهای متعلق به provider را در `api.ts` یا
`runtime-api.ts` خود همان Plugin نگه دارید.

نمونه‌های فعلی providerهای بسته‌بندی‌شده:

- Anthropic helperهای stream مخصوص Claude را در seam خودش یعنی `api.ts` /
  `contract-api.ts` نگه می‌دارد
- OpenAI builderهای provider، helperهای مدل پیش‌فرض، و builderهای provider
  realtime را در `api.ts` خودش نگه می‌دارد
- OpenRouter builder provider و helperهای onboarding/config را در `api.ts` خودش نگه می‌دارد

## برنامه مهاجرت Talk و صدای realtime

کد صدای realtime، تلفنی، جلسه، و Talk مرورگر از bookkeeping نوبت محلیِ سطح
به یک کنترل‌کننده مشترک session Talk منتقل می‌شود که توسط
`openclaw/plugin-sdk/realtime-voice` export می‌شود. کنترل‌کننده جدید envelope مشترک
رویداد Talk، وضعیت نوبت فعال، وضعیت capture، وضعیت audio خروجی، تاریخچه رویدادهای اخیر،
و رد نوبت‌های stale را مالک است. Pluginهای provider باید همچنان sessionهای realtime
مخصوص vendor را مالک باشند؛ Pluginهای سطح باید همچنان capture،
playback، quirks تلفنی، و quirks جلسه را مالک باشند.

این مهاجرت Talk عمداً breaking-clean است:

1. primitiveهای runtime/کنترل‌کننده مشترک را در
   `plugin-sdk/realtime-voice` نگه دارید.
2. سطح‌های بسته‌بندی‌شده را به کنترل‌کننده مشترک منتقل کنید: browser relay،
   managed-room handoff، voice-call realtime، voice-call streaming STT، Google
   Meet realtime، و native push-to-talk.
3. خانواده‌های RPC قدیمی Talk را با API نهایی `talk.session.*` و
   `talk.client.*` جایگزین کنید.
4. یک channel رویداد زنده Talk را در Gateway
   `hello-ok.features.events` تبلیغ کنید: `talk.event`.
5. endpoint قدیمی HTTP realtime و هر مسیر override دستورالعمل در زمان request را حذف کنید.

کد جدید نباید مستقیماً `createTalkEventSequencer(...)` را صدا بزند، مگر اینکه در حال
پیاده‌سازی یک adapter سطح پایین یا fixture تست باشد. کنترل‌کننده مشترک را ترجیح دهید
تا رویدادهای scoped به نوبت بدون turn id صادر نشوند، فراخوانی‌های stale `turnEnd` /
`turnCancel` نتوانند یک نوبت فعال جدیدتر را پاک کنند، و رویدادهای lifecycle
audio خروجی در telephony، meetings، browser relay، managed-room
handoff، و clientهای native Talk سازگار بمانند.

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

sessionهای WebRTC/provider-websocket متعلق به مرورگر از `talk.client.create` استفاده می‌کنند،
زیرا مرورگر مالک negotiation provider و transport رسانه است، در حالی که
Gateway مالک credentials، instructions، و policy ابزار است. `talk.session.*`
سطح مشترک مدیریت‌شده توسط Gateway برای gateway-relay realtime، gateway-relay
transcription، و sessionهای native STT/TTS مربوط به managed-room است.

configهای قدیمی که selectorهای realtime را کنار `talk.provider` /
`talk.providers` قرار داده‌اند باید با `openclaw doctor --fix` repair شوند؛ runtime Talk
config provider speech/TTS را به عنوان config provider realtime بازتفسیر نمی‌کند.

ترکیب‌های پشتیبانی‌شده `talk.session.create` عمداً محدود هستند:

| Mode            | Transport       | Brain           | مالک              | یادداشت‌ها                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | audio تمام‌دوطرفه provider از طریق Gateway bridge می‌شود؛ tool callها از طریق ابزار agent-consult route می‌شوند.      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | فقط streaming STT؛ callerها audio ورودی ارسال می‌کنند و رویدادهای transcript دریافت می‌کنند.                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | native/client room | اتاق‌های سبک push-to-talk و walkie-talkie که در آن client مالک capture/playback و Gateway مالک وضعیت نوبت است. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | native/client room | حالت اتاق فقط برای admin برای سطح‌های first-party مورد اعتماد که actionهای ابزار Gateway را مستقیماً اجرا می‌کنند.                  |

نقشه methodهای حذف‌شده:

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

| Method                          | اعمال می‌شود به                                              | Contract                                                                                      |
| ------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | یک chunk audio PCM با base64 را به session provider متعلق به همان connection Gateway append کنید. |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | یک نوبت کاربر managed-room را شروع کنید.                                                               |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | نوبت فعال را پس از اعتبارسنجی stale-turn پایان دهید.                                              |
| `talk.session.cancelTurn`       | همه sessionهای متعلق به Gateway                              | کار فعال capture/provider/agent/TTS را برای یک نوبت cancel کنید.                                     |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | خروجی audio دستیار را بدون الزاماً پایان دادن به نوبت کاربر متوقف کنید.                         |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | یک tool call مربوط به provider را که relay صادر کرده کامل کنید.                                           |
| `talk.session.close`            | همه sessionهای یکپارچه                                    | sessionهای relay را متوقف یا وضعیت managed-room را revoke کنید، سپس unified session id را فراموش کنید.         |

برای کار کردن این موضوع، special caseهای provider یا platform را در core معرفی نکنید.
core مالک semantics session Talk است. Pluginهای provider مالک setup session vendor هستند.
voice-call و Google Meet مالک adapterهای telephony/meeting هستند. مرورگر و appهای native
مالک UX مربوط به capture/playback دستگاه هستند.

## policy سازگاری

برای Pluginهای خارجی، کار سازگاری با این ترتیب انجام می‌شود:

1. contract جدید را اضافه کنید
2. رفتار قدیمی را از طریق یک adapter سازگاری wired نگه دارید
3. یک diagnostic یا هشدار صادر کنید که مسیر قدیمی و جایگزین را نام می‌برد
4. هر دو مسیر را در تست‌ها پوشش دهید
5. منسوخ‌سازی و مسیر مهاجرت را مستند کنید
6. فقط پس از بازه مهاجرت اعلام‌شده، معمولاً در یک انتشار major، حذف کنید

  نگه‌دارندگان می‌توانند صف مهاجرت فعلی را با
  `pnpm plugins:boundary-report` بازبینی کنند. برای شمارش‌های
  فشرده از `pnpm plugins:boundary-report:summary`، برای یک Plugin یا مالک سازگاری
  از `--owner <id>`، و زمانی که یک گیت CI باید روی رکوردهای سازگاری
  سررسیدشده، ایمپورت‌های SDK رزروشده میان‌مالکی، یا زیرمسیرهای SDK رزروشده
  استفاده‌نشده fail شود، از
  `pnpm plugins:boundary-report:ci` استفاده کنید. گزارش، رکوردهای
  سازگاری منسوخ‌شده را بر اساس تاریخ حذف گروه‌بندی می‌کند، ارجاع‌های کد/مستندات
  محلی را می‌شمارد، ایمپورت‌های SDK رزروشده میان‌مالکی را آشکار می‌کند، و پل SDK
  خصوصی میزبان حافظه را خلاصه می‌کند تا پاک‌سازی سازگاری به‌جای تکیه بر
  جست‌وجوهای موردی، صریح باقی بماند. زیرمسیرهای SDK رزروشده باید استفاده مالک
  ردیابی‌شده داشته باشند؛ exportهای helper رزروشده استفاده‌نشده باید از SDK عمومی
  حذف شوند.

  اگر یک فیلد manifest هنوز پذیرفته می‌شود، نویسندگان Plugin می‌توانند تا زمانی
  که مستندات و diagnostics خلاف آن را نگفته‌اند، به استفاده از آن ادامه دهند. کد
  جدید باید جایگزین مستندشده را ترجیح دهد، اما Pluginهای موجود نباید در طول
  انتشارهای minor معمولی خراب شوند.

  ## نحوه مهاجرت

  <Steps>
  <Step title="مهاجرت helperهای بارگذاری/نوشتن پیکربندی زمان اجرا">
    Pluginهای bundled باید فراخوانی مستقیم
    `api.runtime.config.loadConfig()` و
    `api.runtime.config.writeConfigFile(...)` را متوقف کنند. پیکربندی‌ای را ترجیح
    دهید که از قبل به مسیر فراخوانی فعال پاس داده شده است. handlerهای ماندگار که
    به snapshot فرایند فعلی نیاز دارند می‌توانند از
    `api.runtime.config.current()` استفاده کنند. ابزارهای agent ماندگار باید داخل
    `execute` از `ctx.getRuntimeConfig()` متعلق به context ابزار استفاده کنند تا
    ابزاری که پیش از نوشتن پیکربندی ساخته شده است همچنان پیکربندی زمان اجرای
    تازه‌شده را ببیند.

    نوشتن پیکربندی باید از طریق helperهای transactional انجام شود و یک سیاست
    پس از نوشتن انتخاب کند:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    وقتی فراخواننده می‌داند تغییر به restart تمیز Gateway نیاز دارد از
    `afterWrite: { mode: "restart", reason: "..." }` استفاده کنید، و فقط زمانی از
    `afterWrite: { mode: "none", reason: "..." }` استفاده کنید که فراخواننده مالک
    پیگیری است و عمدا می‌خواهد برنامه‌ریز reload را سرکوب کند.
    نتایج mutation شامل یک خلاصه typed به نام `followUp` برای تست‌ها و logging
    هستند؛ Gateway همچنان مسئول اعمال یا زمان‌بندی restart باقی می‌ماند.
    `loadConfig` و `writeConfigFile` در طول بازه مهاجرت به‌عنوان helperهای
    سازگاری منسوخ‌شده برای Pluginهای خارجی باقی می‌مانند و یک‌بار با کد سازگاری
    `runtime-config-load-write` هشدار می‌دهند. Pluginهای bundled و کد زمان اجرای
    repo با guardrailهای scanner در
    `pnpm check:deprecated-internal-config-api` و
    `pnpm check:no-runtime-action-load-config` محافظت می‌شوند: استفاده جدید
    Plugin تولیدی کاملا fail می‌شود، نوشتن مستقیم پیکربندی fail می‌شود، متدهای
    سرور Gateway باید از snapshot زمان اجرای request استفاده کنند، helperهای
    runtime channel send/action/client باید پیکربندی را از مرز خود دریافت کنند، و
    ماژول‌های زمان اجرای ماندگار هیچ فراخوانی ambient مجاز `loadConfig()` ندارند.

    کد جدید Plugin همچنین باید از ایمپورت barrel سازگاری گسترده
    `openclaw/plugin-sdk/config-runtime` پرهیز کند. از زیرمسیر باریک SDK که با کار
    مطابقت دارد استفاده کنید:

    | نیاز | ایمپورت |
    | --- | --- |
    | نوع‌های پیکربندی مانند `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | assertionهای پیکربندی ازپیش‌بارگذاری‌شده و lookup پیکربندی plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | خواندن snapshot زمان اجرای فعلی | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | نوشتن پیکربندی | `openclaw/plugin-sdk/config-mutation` |
    | helperهای session store | `openclaw/plugin-sdk/session-store-runtime` |
    | پیکربندی جدول Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | helperهای زمان اجرای سیاست گروه | `openclaw/plugin-sdk/runtime-group-policy` |
    | resolution ورودی secret | `openclaw/plugin-sdk/secret-input-runtime` |
    | overrideهای مدل/session | `openclaw/plugin-sdk/model-session-runtime` |

    Pluginهای bundled و تست‌هایشان با scanner در برابر barrel گسترده محافظت
    می‌شوند تا ایمپورت‌ها و mockها محلیِ همان رفتاری بمانند که به آن نیاز دارند.
    barrel گسترده همچنان برای سازگاری خارجی وجود دارد، اما کد جدید نباید به آن
    وابسته باشد.

  </Step>

  <Step title="مهاجرت extensionهای نتیجه ابزار Pi به middleware">
    Pluginهای bundled باید handlerهای نتیجه ابزار مخصوص Pi در
    `api.registerEmbeddedExtensionFactory(...)` را با middleware خنثی نسبت به زمان
    اجرا جایگزین کنند.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    هم‌زمان manifest مربوط به Plugin را به‌روزرسانی کنید:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Pluginهای خارجی نمی‌توانند middleware نتیجه ابزار ثبت کنند، چون می‌تواند
    خروجی ابزار با اعتماد بالا را پیش از دیده‌شدن توسط مدل بازنویسی کند.

  </Step>

  <Step title="مهاجرت handlerهای بومی approval به factهای capability">
    Pluginهای channel دارای قابلیت approval اکنون رفتار approval بومی را از طریق
    `approvalCapability.nativeRuntime` به‌همراه رجیستری مشترک runtime-context
    ارائه می‌کنند.

    تغییرات کلیدی:

    - `approvalCapability.handler.loadRuntime(...)` را با
      `approvalCapability.nativeRuntime` جایگزین کنید
    - auth/delivery مخصوص approval را از wiring قدیمی `plugin.auth` /
      `plugin.approvals` بردارید و به `approvalCapability` منتقل کنید
    - `ChannelPlugin.approvals` از contract عمومی channel-plugin حذف شده است؛ فیلدهای delivery/native/render را به `approvalCapability` منتقل کنید
    - `plugin.auth` فقط برای جریان‌های login/logout channel باقی می‌ماند؛ hookهای auth مربوط به approval در آن دیگر توسط core خوانده نمی‌شوند
    - objectهای زمان اجرای متعلق به channel مانند clientها، tokenها، یا appهای Bolt را از طریق `openclaw/plugin-sdk/channel-runtime-context` ثبت کنید
    - از handlerهای approval بومی، noticeهای reroute متعلق به Plugin ارسال نکنید؛ core اکنون مالک noticeهای routed-elsewhere بر اساس نتایج واقعی delivery است
    - هنگام پاس دادن `channelRuntime` به `createChannelManager(...)`، یک سطح واقعی `createPluginRuntime().channel` ارائه کنید. stubهای جزئی رد می‌شوند.

    برای چیدمان فعلی approval capability به `/plugins/sdk-channel-plugins` مراجعه کنید.

  </Step>

  <Step title="بازبینی رفتار fallback wrapper ویندوز">
    اگر Plugin شما از `openclaw/plugin-sdk/windows-spawn` استفاده می‌کند، wrapperهای
    ویندوزی `.cmd`/`.bat` حل‌نشده اکنون fail closed می‌شوند مگر اینکه صراحتا
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

    اگر فراخواننده شما عمدا به shell fallback متکی نیست، `allowShellFallback` را
    تنظیم نکنید و به‌جای آن خطای thrown را مدیریت کنید.

  </Step>

  <Step title="یافتن ایمپورت‌های منسوخ‌شده">
    Plugin خود را برای ایمپورت از هر یک از سطح‌های منسوخ‌شده جست‌وجو کنید:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="جایگزینی با ایمپورت‌های متمرکز">
    هر export از سطح قدیمی به یک مسیر ایمپورت مدرن مشخص نگاشت می‌شود:

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

    برای helperهای سمت host، به‌جای ایمپورت مستقیم از runtime تزریق‌شده Plugin
    استفاده کنید:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    همین الگو برای دیگر helperهای bridge قدیمی نیز اعمال می‌شود:

    | ایمپورت قدیمی | معادل مدرن |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helperهای session store | `api.runtime.agent.session.*` |

  </Step>

  <Step title="جایگزینی ایمپورت‌های infra-runtime گسترده">
    `openclaw/plugin-sdk/infra-runtime` همچنان برای سازگاری خارجی وجود دارد، اما
    کد جدید باید سطح helper متمرکزی را ایمپورت کند که واقعا به آن نیاز دارد:

    | نیاز | ایمپورت |
    | --- | --- |
    | helperهای صف رویداد سیستم | `openclaw/plugin-sdk/system-event-runtime` |
    | helperهای رویداد Heartbeat و visibility | `openclaw/plugin-sdk/heartbeat-runtime` |
    | drain صف delivery معلق | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | telemetry فعالیت channel | `openclaw/plugin-sdk/channel-activity-runtime` |
    | cacheهای dedupe در حافظه | `openclaw/plugin-sdk/dedupe-runtime` |
    | helperهای امن مسیر فایل/رسانه محلی | `openclaw/plugin-sdk/file-access-runtime` |
    | fetch آگاه از dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | helperهای proxy و fetch محافظت‌شده | `openclaw/plugin-sdk/fetch-runtime` |
    | نوع‌های سیاست dispatcher مربوط به SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | نوع‌های request/resolution مربوط به approval | `openclaw/plugin-sdk/approval-runtime` |
    | helperهای payload پاسخ approval و command | `openclaw/plugin-sdk/approval-reply-runtime` |
    | helperهای قالب‌بندی خطا | `openclaw/plugin-sdk/error-runtime` |
    | انتظارهای آمادگی transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | helperهای token امن | `openclaw/plugin-sdk/secure-random-runtime` |
    | هم‌زمانی task async کران‌دار | `openclaw/plugin-sdk/concurrency-runtime` |
    | coercion عددی | `openclaw/plugin-sdk/number-runtime` |
    | lock async محلی فرایند | `openclaw/plugin-sdk/async-lock-runtime` |
    | lockهای فایل | `openclaw/plugin-sdk/file-lock` |

    Pluginهای bundled با scanner در برابر `infra-runtime` محافظت می‌شوند، بنابراین
    کد repo نمی‌تواند به barrel گسترده عقب‌گرد کند.

  </Step>

  <Step title="مهاجرت helperهای route مربوط به channel">
    کد جدید route مربوط به channel باید از `openclaw/plugin-sdk/channel-route`
    استفاده کند. نام‌های قدیمی route-key و comparable-target در طول بازه مهاجرت
    به‌عنوان aliasهای سازگاری باقی می‌مانند، اما Pluginهای جدید باید از نام‌های
    route استفاده کنند که رفتار را مستقیما توصیف می‌کنند:

    | helper قدیمی | helper مدرن |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    راهنماهای مدرن مسیر، `{ channel, to, accountId, threadId }` را به‌طور یکسان در تأییدهای بومی، سرکوب پاسخ، حذف تکرار ورودی، تحویل Cron و مسیریابی نشست نرمال‌سازی می‌کنند. اگر Plugin شما دستور زبان هدف سفارشی خودش را دارد، از `resolveChannelRouteTargetWithParser(...)` استفاده کنید تا آن parser را با همان قرارداد هدف مسیر سازگار کنید.

  </Step>

  <Step title="بسازید و آزمایش کنید">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## مرجع مسیر import

  <Accordion title="Common import path table">
  | مسیر import | هدف | exportهای کلیدی |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | helper رسمی ورودی Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | re-export چتری قدیمی برای تعریف‌ها/سازنده‌های ورودی کانال | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | export طرح‌واره پیکربندی ریشه | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | helper ورودی تک‌ارائه‌دهنده | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | تعریف‌ها و سازنده‌های متمرکز ورودی کانال | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | helperهای مشترک جادوگر راه‌اندازی | اعلان‌های فهرست مجاز، سازنده‌های وضعیت راه‌اندازی |
  | `plugin-sdk/setup-runtime` | helperهای runtime زمان راه‌اندازی | آداپتورهای وصله راه‌اندازی امن برای import، helperهای یادداشت جست‌وجو، `promptResolvedAllowFrom`, `splitSetupEntries`, proxyهای راه‌اندازی واگذارشده |
  | `plugin-sdk/setup-adapter-runtime` | helperهای آداپتور راه‌اندازی | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | helperهای ابزارسازی راه‌اندازی | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | helperهای چندحسابی | helperهای فهرست حساب/پیکربندی/دروازه اقدام |
  | `plugin-sdk/account-id` | helperهای شناسه حساب | `DEFAULT_ACCOUNT_ID`, نرمال‌سازی شناسه حساب |
  | `plugin-sdk/account-resolution` | helperهای جست‌وجوی حساب | helperهای جست‌وجوی حساب + بازگشت پیش‌فرض |
  | `plugin-sdk/account-helpers` | helperهای محدود حساب | helperهای فهرست حساب/اقدام حساب |
  | `plugin-sdk/channel-setup` | آداپتورهای جادوگر راه‌اندازی | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, به‌علاوه `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | اجزای پایه جفت‌سازی DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | سیم‌کشی پیشوند پاسخ، در حال تایپ بودن، و تحویل منبع | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | کارخانه‌های آداپتور پیکربندی و helperهای دسترسی DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | سازنده‌های طرح‌واره پیکربندی | فقط اجزای پایه طرح‌واره پیکربندی کانال مشترک و سازنده عمومی |
  | `plugin-sdk/bundled-channel-config-schema` | طرح‌واره‌های پیکربندی همراه | فقط Pluginهای همراه نگهداری‌شده توسط OpenClaw؛ Pluginهای جدید باید طرح‌واره‌های محلی Plugin را تعریف کنند |
  | `plugin-sdk/channel-config-schema-legacy` | طرح‌واره‌های پیکربندی همراه منسوخ‌شده | فقط alias سازگاری؛ برای Pluginهای همراه نگهداری‌شده از `plugin-sdk/bundled-channel-config-schema` استفاده کنید |
  | `plugin-sdk/telegram-command-config` | helperهای پیکربندی فرمان Telegram | نرمال‌سازی نام فرمان، کوتاه‌سازی توضیح، اعتبارسنجی تکرار/تعارض |
  | `plugin-sdk/channel-policy` | حل سیاست گروه/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | helperهای چرخه عمر وضعیت حساب و جریان پیش‌نویس | `createAccountStatusSink`, helperهای نهایی‌سازی پیش‌نمایش پیش‌نویس |
  | `plugin-sdk/inbound-envelope` | helperهای پاکت ورودی | helperهای مشترک مسیر + سازنده پاکت |
  | `plugin-sdk/inbound-reply-dispatch` | helperهای پاسخ ورودی | helperهای مشترک ثبت و dispatch |
  | `plugin-sdk/messaging-targets` | تجزیه هدف پیام‌رسانی | helperهای تجزیه/تطبیق هدف |
  | `plugin-sdk/outbound-media` | helperهای رسانه خروجی | بارگذاری مشترک رسانه خروجی |
  | `plugin-sdk/outbound-send-deps` | helperهای وابستگی ارسال خروجی | جست‌وجوی سبک `resolveOutboundSendDep` بدون import کردن runtime کامل خروجی |
  | `plugin-sdk/outbound-runtime` | helperهای runtime خروجی | helperهای تحویل خروجی، نماینده هویت/ارسال، نشست، قالب‌بندی، و برنامه‌ریزی payload |
  | `plugin-sdk/thread-bindings-runtime` | helperهای اتصال رشته گفتگو | چرخه عمر اتصال رشته گفتگو و helperهای آداپتور |
  | `plugin-sdk/agent-media-payload` | helperهای قدیمی payload رسانه | سازنده payload رسانه عامل برای چیدمان‌های فیلد قدیمی |
  | `plugin-sdk/channel-runtime` | shim سازگاری منسوخ‌شده | فقط ابزارهای runtime کانال قدیمی |
  | `plugin-sdk/channel-send-result` | نوع‌های نتیجه ارسال | نوع‌های نتیجه پاسخ |
  | `plugin-sdk/runtime-store` | ذخیره‌سازی پایدار Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | helperهای گسترده runtime | helperهای runtime/لاگ‌گیری/پشتیبان‌گیری/نصب Plugin |
  | `plugin-sdk/runtime-env` | helperهای محدود env در runtime | helperهای لاگر/env runtime، timeout، retry، و backoff |
  | `plugin-sdk/plugin-runtime` | helperهای مشترک runtime Plugin | helperهای فرمان‌ها/hookها/http/تعاملی Plugin |
  | `plugin-sdk/hook-runtime` | helperهای خط لوله hook | helperهای مشترک خط لوله hook داخلی/Webhook |
  | `plugin-sdk/lazy-runtime` | helperهای runtime تنبل | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | helperهای پردازش | helperهای مشترک exec |
  | `plugin-sdk/cli-runtime` | helperهای runtime CLI | قالب‌بندی فرمان، انتظارها، helperهای نسخه |
  | `plugin-sdk/gateway-runtime` | helperهای Gateway | کلاینت Gateway، helper شروع آماده حلقه رویداد، و helperهای وصله وضعیت کانال |
  | `plugin-sdk/config-runtime` | shim سازگاری پیکربندی منسوخ‌شده | `config-types`, `plugin-config-runtime`, `runtime-config-snapshot`, و `config-mutation` را ترجیح دهید |
  | `plugin-sdk/telegram-command-config` | helperهای فرمان Telegram | helperهای اعتبارسنجی فرمان Telegram با پایداری fallback وقتی سطح قرارداد Telegram همراه در دسترس نیست |
  | `plugin-sdk/approval-runtime` | helperهای اعلان تایید | payload تایید exec/Plugin، helperهای قابلیت/نمایه تایید، helperهای مسیریابی/runtime تایید native، و قالب‌بندی مسیر نمایش ساختاریافته تایید |
  | `plugin-sdk/approval-auth-runtime` | helperهای احراز هویت تایید | حل تاییدکننده، احراز هویت اقدام در همان گفت‌وگو |
  | `plugin-sdk/approval-client-runtime` | helperهای کلاینت تایید | helperهای نمایه/فیلتر تایید native exec |
  | `plugin-sdk/approval-delivery-runtime` | helperهای تحویل تایید | آداپتورهای قابلیت/تحویل تایید native |
  | `plugin-sdk/approval-gateway-runtime` | helperهای Gateway تایید | helper مشترک حل Gateway تایید |
  | `plugin-sdk/approval-handler-adapter-runtime` | helperهای آداپتور تایید | helperهای سبک بارگذاری آداپتور تایید native برای نقاط ورودی داغ کانال |
  | `plugin-sdk/approval-handler-runtime` | helperهای handler تایید | helperهای گسترده‌تر runtime handler تایید؛ وقتی seamهای محدودتر آداپتور/Gateway کافی هستند آن‌ها را ترجیح دهید |
  | `plugin-sdk/approval-native-runtime` | helperهای هدف تایید | helperهای اتصال هدف/حساب تایید native |
  | `plugin-sdk/approval-reply-runtime` | helperهای پاسخ تایید | helperهای payload پاسخ تایید exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | helperهای context runtime کانال | helperهای عمومی ثبت/گرفتن/نظارت context runtime کانال |
  | `plugin-sdk/security-runtime` | helperهای امنیتی | helperهای مشترک اعتماد، دروازه‌گذاری DM، فایل/مسیر محدود به ریشه، محتوای خارجی، و گردآوری secret |
  | `plugin-sdk/ssrf-policy` | helperهای سیاست SSRF | helperهای فهرست مجاز میزبان و سیاست شبکه خصوصی |
  | `plugin-sdk/ssrf-runtime` | helperهای runtime SSRF | dispatcher پین‌شده، fetch محافظت‌شده، helperهای سیاست SSRF |
  | `plugin-sdk/system-event-runtime` | helperهای رویداد سیستم | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | helperهای Heartbeat | helperهای رویداد Heartbeat و قابلیت مشاهده |
  | `plugin-sdk/delivery-queue-runtime` | helperهای صف تحویل | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | helperهای فعالیت کانال | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | helperهای حذف تکراری | کش‌های حذف تکراری در حافظه |
  | `plugin-sdk/file-access-runtime` | helperهای دسترسی فایل | helperهای امن مسیر فایل محلی/رسانه |
  | `plugin-sdk/transport-ready-runtime` | helperهای آمادگی انتقال | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | helperهای کش محدود | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | helperهای دروازه‌گذاری تشخیصی | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | helperهای قالب‌بندی خطا | `formatUncaughtError`, `isApprovalNotFoundError`, helperهای گراف خطا |
  | `plugin-sdk/fetch-runtime` | helperهای fetch/proxy پوشش‌داده‌شده | `resolveFetch`, helperهای proxy، helperهای گزینه EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | helperهای نرمال‌سازی میزبان | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | helperهای تلاش دوباره | `RetryConfig`, `retryAsync`, اجراکننده‌های سیاست |
  | `plugin-sdk/allow-from` | قالب‌بندی فهرست مجاز | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | نگاشت ورودی فهرست مجاز | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | دروازه‌گذاری فرمان و helperهای سطح فرمان | `resolveControlCommandGate`, helperهای مجوزدهی فرستنده، helperهای رجیستری فرمان شامل قالب‌بندی منوی آرگومان پویا |
  | `plugin-sdk/command-status` | rendererهای وضعیت/راهنمای فرمان | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | تجزیه ورودی secret | helperهای ورودی secret |
  | `plugin-sdk/webhook-ingress` | helperهای درخواست Webhook | ابزارهای هدف Webhook |
  | `plugin-sdk/webhook-request-guards` | helperهای محافظ بدنه Webhook | helperهای خواندن/محدودسازی بدنه درخواست |
  | `plugin-sdk/reply-runtime` | runtime مشترک پاسخ | dispatch ورودی، heartbeat، برنامه‌ریز پاسخ، قطعه‌بندی |
  | `plugin-sdk/reply-dispatch-runtime` | helperهای محدود dispatch پاسخ | نهایی‌سازی، dispatch ارائه‌دهنده، و helperهای برچسب گفتگو |
  | `plugin-sdk/reply-history` | helperهای تاریخچه پاسخ | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | برنامه‌ریزی ارجاع پاسخ | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | helperهای قطعه پاسخ | helperهای قطعه‌بندی متن/markdown |
  | `plugin-sdk/session-store-runtime` | helperهای store نشست | helperهای مسیر store + updated-at |
  | `plugin-sdk/state-paths` | helperهای مسیر وضعیت | helperهای پوشه وضعیت و OAuth |
  | `plugin-sdk/routing` | helperهای مسیریابی/کلید نشست | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helperهای نرمال‌سازی کلید نشست |
  | `plugin-sdk/status-helpers` | helperهای وضعیت کانال | سازنده‌های خلاصه وضعیت کانال/حساب، پیش‌فرض‌های وضعیت runtime، helperهای فراداده issue |
  | `plugin-sdk/target-resolver-runtime` | helperهای حل‌کننده هدف | helperهای مشترک حل‌کننده هدف |
  | `plugin-sdk/string-normalization-runtime` | helperهای نرمال‌سازی رشته | helperهای نرمال‌سازی slug/رشته |
  | `plugin-sdk/request-url` | helperهای URL درخواست | استخراج URLهای رشته‌ای از ورودی‌های شبیه درخواست |
  | `plugin-sdk/run-command` | helperهای فرمان زمان‌دار | اجراکننده فرمان زمان‌دار با stdout/stderr نرمال‌شده |
  | `plugin-sdk/param-readers` | خواننده‌های پارامتر | خواننده‌های مشترک پارامتر ابزار/CLI |
  | `plugin-sdk/tool-payload` | استخراج بار ابزار | بارهای نرمال‌سازی‌شده را از اشیای نتیجه ابزار استخراج می‌کند |
  | `plugin-sdk/tool-send` | استخراج ارسال ابزار | فیلدهای استاندارد مقصد ارسال را از آرگومان‌های ابزار استخراج می‌کند |
  | `plugin-sdk/temp-path` | کمک‌گرهای مسیر موقت | کمک‌گرهای مشترک مسیر دانلود موقت |
  | `plugin-sdk/logging-core` | کمک‌گرهای ثبت گزارش | کمک‌گرهای ثبت‌گر زیرسامانه و حذف اطلاعات حساس |
  | `plugin-sdk/markdown-table-runtime` | کمک‌گرهای جدول Markdown | کمک‌گرهای حالت جدول Markdown |
  | `plugin-sdk/reply-payload` | نوع‌های پاسخ پیام | نوع‌های بار پاسخ |
  | `plugin-sdk/provider-setup` | کمک‌گرهای گزینش‌شده راه‌اندازی ارائه‌دهنده محلی/خودمیزبان | کمک‌گرهای کشف/پیکربندی ارائه‌دهنده خودمیزبان |
  | `plugin-sdk/self-hosted-provider-setup` | کمک‌گرهای متمرکز راه‌اندازی ارائه‌دهنده خودمیزبان سازگار با OpenAI | همان کمک‌گرهای کشف/پیکربندی ارائه‌دهنده خودمیزبان |
  | `plugin-sdk/provider-auth-runtime` | کمک‌گرهای احراز هویت زمان اجرای ارائه‌دهنده | کمک‌گرهای حل کلید API در زمان اجرا |
  | `plugin-sdk/provider-auth-api-key` | کمک‌گرهای راه‌اندازی کلید API ارائه‌دهنده | کمک‌گرهای آماده‌سازی اولیه/نوشتن پروفایل کلید API |
  | `plugin-sdk/provider-auth-result` | کمک‌گرهای نتیجه احراز هویت ارائه‌دهنده | سازنده استاندارد نتیجه احراز هویت OAuth |
  | `plugin-sdk/provider-auth-login` | کمک‌گرهای ورود تعاملی ارائه‌دهنده | کمک‌گرهای مشترک ورود تعاملی |
  | `plugin-sdk/provider-selection-runtime` | کمک‌گرهای انتخاب ارائه‌دهنده | انتخاب ارائه‌دهنده پیکربندی‌شده یا خودکار و ادغام پیکربندی خام ارائه‌دهنده |
  | `plugin-sdk/provider-env-vars` | کمک‌گرهای متغیرهای محیطی ارائه‌دهنده | کمک‌گرهای جست‌وجوی متغیر محیطی احراز هویت ارائه‌دهنده |
  | `plugin-sdk/provider-model-shared` | کمک‌گرهای مشترک مدل/بازپخش ارائه‌دهنده | `ProviderReplayFamily`، `buildProviderReplayFamilyHooks`، `normalizeModelCompat`، سازنده‌های مشترک سیاست بازپخش، کمک‌گرهای endpoint ارائه‌دهنده، و کمک‌گرهای نرمال‌سازی شناسه مدل |
  | `plugin-sdk/provider-catalog-shared` | کمک‌گرهای مشترک کاتالوگ ارائه‌دهنده | `findCatalogTemplate`، `buildSingleProviderApiKeyCatalog`، `buildManifestModelProviderConfig`، `supportsNativeStreamingUsageCompat`، `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | وصله‌های آماده‌سازی اولیه ارائه‌دهنده | کمک‌گرهای پیکربندی آماده‌سازی اولیه |
  | `plugin-sdk/provider-http` | کمک‌گرهای HTTP ارائه‌دهنده | کمک‌گرهای عمومی قابلیت HTTP/endpoint ارائه‌دهنده، شامل کمک‌گرهای فرم چندبخشی رونویسی صوتی |
  | `plugin-sdk/provider-web-fetch` | کمک‌گرهای web-fetch ارائه‌دهنده | کمک‌گرهای ثبت/کش ارائه‌دهنده web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | کمک‌گرهای پیکربندی web-search ارائه‌دهنده | کمک‌گرهای محدود پیکربندی/اعتبارنامه web-search برای ارائه‌دهندگانی که به سیم‌کشی فعال‌سازی Plugin نیاز ندارند |
  | `plugin-sdk/provider-web-search-contract` | کمک‌گرهای قرارداد web-search ارائه‌دهنده | کمک‌گرهای محدود قرارداد پیکربندی/اعتبارنامه web-search مانند `createWebSearchProviderContractFields`، `enablePluginInConfig`، `resolveProviderWebSearchPluginConfig`، و تنظیم‌کننده‌ها/گیرنده‌های اعتبارنامه با دامنه محدود |
  | `plugin-sdk/provider-web-search` | کمک‌گرهای web-search ارائه‌دهنده | کمک‌گرهای ثبت/کش/زمان اجرای ارائه‌دهنده web-search |
  | `plugin-sdk/provider-tools` | کمک‌گرهای سازگاری ابزار/اسکیما ارائه‌دهنده | `ProviderToolCompatFamily`، `buildProviderToolCompatFamilyHooks`، پاک‌سازی اسکیما و تشخیص Gemini، و کمک‌گرهای سازگاری xAI مانند `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | کمک‌گرهای مصرف ارائه‌دهنده | `fetchClaudeUsage`، `fetchGeminiUsage`، `fetchGithubCopilotUsage`، و کمک‌گرهای دیگر مصرف ارائه‌دهنده |
  | `plugin-sdk/provider-stream` | کمک‌گرهای پوشاننده جریان ارائه‌دهنده | `ProviderStreamFamily`، `buildProviderStreamFamilyHooks`، `composeProviderStreamWrappers`، نوع‌های پوشاننده جریان، و کمک‌گرهای مشترک پوشاننده Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | کمک‌گرهای انتقال ارائه‌دهنده | کمک‌گرهای انتقال بومی ارائه‌دهنده مانند fetch محافظت‌شده، تبدیل‌های پیام انتقال، و جریان‌های رویداد انتقال قابل نوشتن |
  | `plugin-sdk/keyed-async-queue` | صف ناهمگام مرتب | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | کمک‌گرهای مشترک رسانه | کمک‌گرهای واکشی/تبدیل/ذخیره رسانه، بررسی ابعاد ویدئو با پشتوانه ffprobe، و سازنده‌های بار رسانه |
  | `plugin-sdk/media-generation-runtime` | کمک‌گرهای مشترک تولید رسانه | کمک‌گرهای مشترک failover، انتخاب نامزد، و پیام‌رسانی مدلِ گمشده برای تولید تصویر/ویدئو/موسیقی |
  | `plugin-sdk/media-understanding` | کمک‌گرهای درک رسانه | نوع‌های ارائه‌دهنده درک رسانه به‌همراه خروجی‌های کمک‌گر تصویر/صوت برای ارائه‌دهنده |
  | `plugin-sdk/text-runtime` | کمک‌گرهای مشترک متن | حذف متن قابل مشاهده برای دستیار، کمک‌گرهای رندر/قطعه‌بندی/جدول Markdown، کمک‌گرهای حذف اطلاعات حساس، کمک‌گرهای تگ دستور، ابزارهای متن امن، و کمک‌گرهای مرتبط متن/ثبت گزارش |
  | `plugin-sdk/text-chunking` | کمک‌گرهای قطعه‌بندی متن | کمک‌گر قطعه‌بندی متن خروجی |
  | `plugin-sdk/speech` | کمک‌گرهای گفتار | نوع‌های ارائه‌دهنده گفتار به‌همراه کمک‌گرهای دستور، رجیستری، اعتبارسنجی برای ارائه‌دهنده، و سازنده TTS سازگار با OpenAI |
  | `plugin-sdk/speech-core` | هسته مشترک گفتار | نوع‌های ارائه‌دهنده گفتار، رجیستری، دستورها، نرمال‌سازی |
  | `plugin-sdk/realtime-transcription` | کمک‌گرهای رونویسی بلادرنگ | نوع‌های ارائه‌دهنده، کمک‌گرهای رجیستری، و کمک‌گر مشترک نشست WebSocket |
  | `plugin-sdk/realtime-voice` | کمک‌گرهای صدای بلادرنگ | نوع‌های ارائه‌دهنده، کمک‌گرهای رجیستری/حل، کمک‌گرهای نشست پل، صف‌های مشترک پاسخ گفتاری عامل، سلامت رونوشت/رویداد، سرکوب echo، و کمک‌گرهای سریع مشاوره زمینه |
  | `plugin-sdk/image-generation` | کمک‌گرهای تولید تصویر | نوع‌های ارائه‌دهنده تولید تصویر به‌همراه کمک‌گرهای دارایی تصویر/data URL و سازنده ارائه‌دهنده تصویر سازگار با OpenAI |
  | `plugin-sdk/image-generation-core` | هسته مشترک تولید تصویر | نوع‌های تولید تصویر، failover، احراز هویت، و کمک‌گرهای رجیستری |
  | `plugin-sdk/music-generation` | کمک‌گرهای تولید موسیقی | نوع‌های ارائه‌دهنده/درخواست/نتیجه تولید موسیقی |
  | `plugin-sdk/music-generation-core` | هسته مشترک تولید موسیقی | نوع‌های تولید موسیقی، کمک‌گرهای failover، جست‌وجوی ارائه‌دهنده، و تجزیه model-ref |
  | `plugin-sdk/video-generation` | کمک‌گرهای تولید ویدئو | نوع‌های ارائه‌دهنده/درخواست/نتیجه تولید ویدئو |
  | `plugin-sdk/video-generation-core` | هسته مشترک تولید ویدئو | نوع‌های تولید ویدئو، کمک‌گرهای failover، جست‌وجوی ارائه‌دهنده، و تجزیه model-ref |
  | `plugin-sdk/interactive-runtime` | کمک‌گرهای پاسخ تعاملی | نرمال‌سازی/کاهش بار پاسخ تعاملی |
  | `plugin-sdk/channel-config-primitives` | سازه‌های اولیه پیکربندی کانال | سازه‌های اولیه محدود اسکیما پیکربندی کانال |
  | `plugin-sdk/channel-config-writes` | کمک‌گرهای نوشتن پیکربندی کانال | کمک‌گرهای مجوزدهی نوشتن پیکربندی کانال |
  | `plugin-sdk/channel-plugin-common` | دیباچه مشترک کانال | خروجی‌های دیباچه مشترک Plugin کانال |
  | `plugin-sdk/channel-status` | کمک‌گرهای وضعیت کانال | کمک‌گرهای مشترک snapshot/خلاصه وضعیت کانال |
  | `plugin-sdk/allowlist-config-edit` | کمک‌گرهای پیکربندی allowlist | کمک‌گرهای ویرایش/خواندن پیکربندی allowlist |
  | `plugin-sdk/group-access` | کمک‌گرهای دسترسی گروهی | کمک‌گرهای مشترک تصمیم‌گیری دسترسی گروهی |
  | `plugin-sdk/direct-dm` | کمک‌گرهای DM مستقیم | کمک‌گرهای مشترک احراز هویت/محافظ DM مستقیم |
  | `plugin-sdk/extension-shared` | کمک‌گرهای مشترک افزونه | سازه‌های اولیه کمک‌گر کانال/وضعیت منفعل و پراکسی محیطی |
  | `plugin-sdk/webhook-targets` | کمک‌گرهای هدف Webhook | رجیستری هدف Webhook و کمک‌گرهای نصب مسیر |
  | `plugin-sdk/webhook-path` | کمک‌گرهای مسیر Webhook | کمک‌گرهای نرمال‌سازی مسیر Webhook |
  | `plugin-sdk/web-media` | کمک‌گرهای مشترک رسانه وب | کمک‌گرهای بارگذاری رسانه محلی/دور |
  | `plugin-sdk/zod` | بازخروجی Zod | `zod` بازخروجی‌شده برای مصرف‌کنندگان SDK Plugin |
  | `plugin-sdk/memory-core` | کمک‌گرهای همراه memory-core | سطح کمک‌گر مدیر/پیکربندی/فایل/CLI حافظه |
  | `plugin-sdk/memory-core-engine-runtime` | نمای زمان اجرای موتور حافظه | نمای زمان اجرای ایندکس/جست‌وجوی حافظه |
  | `plugin-sdk/memory-core-host-engine-foundation` | موتور بنیاد میزبان حافظه | خروجی‌های موتور بنیاد میزبان حافظه |
  | `plugin-sdk/memory-core-host-engine-embeddings` | موتور embedding میزبان حافظه | قراردادهای embedding حافظه، دسترسی رجیستری، ارائه‌دهنده محلی، و کمک‌گرهای عمومی دسته‌ای/دور؛ ارائه‌دهندگان دور مشخص در Pluginهای مالک خود قرار دارند |
  | `plugin-sdk/memory-core-host-engine-qmd` | موتور QMD میزبان حافظه | خروجی‌های موتور QMD میزبان حافظه |
  | `plugin-sdk/memory-core-host-engine-storage` | موتور ذخیره‌سازی میزبان حافظه | خروجی‌های موتور ذخیره‌سازی میزبان حافظه |
  | `plugin-sdk/memory-core-host-multimodal` | کمک‌گرهای چندوجهی میزبان حافظه | کمک‌گرهای چندوجهی میزبان حافظه |
  | `plugin-sdk/memory-core-host-query` | کمک‌گرهای پرس‌وجوی میزبان حافظه | کمک‌گرهای پرس‌وجوی میزبان حافظه |
  | `plugin-sdk/memory-core-host-secret` | کمک‌گرهای محرمانه میزبان حافظه | کمک‌گرهای محرمانه میزبان حافظه |
  | `plugin-sdk/memory-core-host-events` | کمک‌گرهای ژورنال رویداد میزبان حافظه | کمک‌گرهای ژورنال رویداد میزبان حافظه |
  | `plugin-sdk/memory-core-host-status` | کمک‌گرهای وضعیت میزبان حافظه | کمک‌گرهای وضعیت میزبان حافظه |
  | `plugin-sdk/memory-core-host-runtime-cli` | زمان اجرای CLI میزبان حافظه | کمک‌گرهای زمان اجرای CLI میزبان حافظه |
  | `plugin-sdk/memory-core-host-runtime-core` | زمان اجرای هسته میزبان حافظه | کمک‌گرهای زمان اجرای هسته میزبان حافظه |
  | `plugin-sdk/memory-core-host-runtime-files` | کمک‌گرهای فایل/زمان اجرای میزبان حافظه | کمک‌گرهای فایل/زمان اجرای میزبان حافظه |
  | `plugin-sdk/memory-host-core` | نام مستعار زمان اجرای هسته میزبان حافظه | نام مستعار بی‌طرف از نظر فروشنده برای کمک‌گرهای زمان اجرای هسته میزبان حافظه |
  | `plugin-sdk/memory-host-events` | نام مستعار ژورنال رویداد میزبان حافظه | نام مستعار بی‌طرف از نظر فروشنده برای کمک‌گرهای ژورنال رویداد میزبان حافظه |
  | `plugin-sdk/memory-host-files` | نام مستعار فایل/زمان اجرای میزبان حافظه | نام مستعار بی‌طرف از نظر فروشنده برای کمک‌گرهای فایل/زمان اجرای میزبان حافظه |
  | `plugin-sdk/memory-host-markdown` | کمک‌گرهای Markdown مدیریت‌شده | کمک‌گرهای مشترک Markdown مدیریت‌شده برای Pluginهای مجاور حافظه |
  | `plugin-sdk/memory-host-search` | نمای جست‌وجوی حافظه فعال | نمای زمان اجرای lazy مدیر جست‌وجوی حافظه فعال |
  | `plugin-sdk/memory-host-status` | نام مستعار وضعیت میزبان حافظه | نام مستعار بی‌طرف از نظر فروشنده برای کمک‌گرهای وضعیت میزبان حافظه |
  | `plugin-sdk/testing` | ابزارهای آزمون | بشکه سازگاری گسترده قدیمی؛ زیرمسیرهای آزمون متمرکز مانند `plugin-sdk/plugin-test-runtime`، `plugin-sdk/channel-test-helpers`، `plugin-sdk/channel-target-testing`، `plugin-sdk/test-env`، و `plugin-sdk/test-fixtures` را ترجیح دهید |
</Accordion>

این جدول عمداً زیرمجموعهٔ مهاجرت مشترک است، نه سطح کامل SDK. فهرست کامل بیش از ۲۰۰ نقطهٔ ورود در
`scripts/lib/plugin-sdk-entrypoints.json` قرار دارد.

seamهای کمکی رزروشدهٔ Pluginهای بسته‌بندی‌شده از نگاشت export عمومی SDK بازنشسته شده‌اند، به‌جز facadeهای سازگاری که صراحتاً مستند شده‌اند؛ مانند shim منسوخ‌شدهٔ `plugin-sdk/discord` که برای بستهٔ منتشرشدهٔ `@openclaw/discord@2026.3.13` نگه داشته شده است. helperهای ویژهٔ مالک داخل بستهٔ Plugin مالک قرار دارند؛ رفتار مشترک میزبان باید از طریق قراردادهای عمومی SDK مانند `plugin-sdk/gateway-runtime`،‏ `plugin-sdk/security-runtime` و `plugin-sdk/plugin-config-runtime` منتقل شود.

از محدودترین import متناسب با کار استفاده کنید. اگر exportی پیدا نمی‌کنید، منبع را در `src/plugin-sdk/` بررسی کنید یا از نگه‌دارندگان بپرسید کدام قرارداد عمومی باید مالک آن باشد.

## منسوخ‌سازی‌های فعال

منسوخ‌سازی‌های محدودتری که در سراسر SDK مربوط به Plugin، قرارداد provider، سطح runtime و manifest اعمال می‌شوند. هرکدام هنوز امروز کار می‌کنند اما در یک انتشار major آینده حذف خواهند شد. ورودی زیر هر مورد API قدیمی را به جایگزین رسمی آن نگاشت می‌کند.

<AccordionGroup>
  <Accordion title="سازنده‌های راهنمای command-auth → command-status">
    **قدیمی (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **جدید (`openclaw/plugin-sdk/command-status`)**: همان signatureها، همان
    exportها - فقط از subpath محدودتر import می‌شوند. `command-auth`
    آن‌ها را به‌عنوان stubهای سازگاری دوباره export می‌کند.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="helperهای gating برای mention → resolveInboundMentionDecision">
    **قدیمی**: `resolveInboundMentionRequirement({ facts, policy })` و
    `shouldDropInboundForMention(...)` از
    `openclaw/plugin-sdk/channel-inbound` یا
    `openclaw/plugin-sdk/channel-mention-gating`.

    **جدید**: `resolveInboundMentionDecision({ facts, policy })` - به‌جای دو فراخوانی جدا، یک شیء تصمیم واحد برمی‌گرداند.

    Pluginهای کانال پایین‌دستی (Slack، Discord، Matrix، MS Teams) قبلاً
    مهاجرت کرده‌اند.

  </Accordion>

  <Accordion title="shim runtime کانال و helperهای action کانال">
    `openclaw/plugin-sdk/channel-runtime` یک shim سازگاری برای Pluginهای کانال قدیمی‌تر است. در کد جدید از آن import نکنید؛ برای ثبت شیءهای runtime از
    `openclaw/plugin-sdk/channel-runtime-context` استفاده کنید.

    helperهای `channelActions*` در `openclaw/plugin-sdk/channel-actions` همراه با exportهای خام «actions» کانال منسوخ شده‌اند. قابلیت‌ها را به‌جای آن از طریق سطح معنایی `presentation` ارائه کنید - Pluginهای کانال اعلام می‌کنند چه چیزی render می‌کنند (cardها، buttonها، selectها)، نه اینکه کدام نام‌های action خام را می‌پذیرند.

  </Accordion>

  <Accordion title="helper مربوط به tool() در provider جست‌وجوی وب → createTool() روی Plugin">
    **قدیمی**: factory‏ `tool()` از `openclaw/plugin-sdk/provider-web-search`.

    **جدید**: `createTool(...)` را مستقیماً روی Plugin مربوط به provider پیاده‌سازی کنید.
    OpenClaw دیگر برای ثبت wrapper ابزار به helper SDK نیاز ندارد.

  </Accordion>

  <Accordion title="envelopeهای متنی سادهٔ کانال → BodyForAgent">
    **قدیمی**: `formatInboundEnvelope(...)` (و
    `ChannelMessageForAgent.channelEnvelope`) برای ساخت یک envelope prompt متنی ساده و تخت از پیام‌های ورودی کانال.

    **جدید**: `BodyForAgent` به‌همراه blockهای ساختاریافتهٔ context کاربر. Pluginهای کانال metadata مسیریابی (thread، topic، reply-to، reactionها) را به‌جای الحاق به یک رشتهٔ prompt، به‌صورت fieldهای typed وصل می‌کنند. helper‏
    `formatAgentEnvelope(...)` همچنان برای envelopeهای ساخته‌شده برای دستیار پشتیبانی می‌شود، اما envelopeهای متنی سادهٔ ورودی در مسیر حذف هستند.

    بخش‌های تحت‌تأثیر: `inbound_claim`،‏ `message_received` و هر Plugin کانال سفارشی که متن `channelEnvelope` را پس‌پردازش می‌کرد.

  </Accordion>

  <Accordion title="typeهای کشف provider → typeهای catalog provider">
    چهار alias مربوط به typeهای کشف اکنون wrapperهای نازکی روی typeهای دورهٔ catalog هستند:

    | alias قدیمی              | type جدید                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    به‌علاوهٔ bag ایستای قدیمی `ProviderCapabilities` - Pluginهای provider باید به‌جای یک شیء ایستا، از hookهای صریح provider مانند `buildReplayPolicy`،
    `normalizeToolSchemas` و `wrapStreamFn` استفاده کنند.

  </Accordion>

  <Accordion title="hookهای policy مربوط به thinking → resolveThinkingProfile">
    **قدیمی** (سه hook جدا روی `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`،‏ `supportsXHighThinking(ctx)` و
    `resolveDefaultThinkingLevel(ctx)`.

    **جدید**: یک `resolveThinkingProfile(ctx)` واحد که یک
    `ProviderThinkingProfile` با `id` رسمی، `label` اختیاری و فهرست رتبه‌بندی‌شدهٔ levelها برمی‌گرداند. OpenClaw مقدارهای ذخیره‌شدهٔ قدیمی را به‌صورت خودکار بر اساس رتبهٔ profile پایین می‌آورد.

    به‌جای سه hook، یک hook پیاده‌سازی کنید. hookهای legacy در بازهٔ منسوخ‌سازی همچنان کار می‌کنند اما با نتیجهٔ profile ترکیب نمی‌شوند.

  </Accordion>

  <Accordion title="fallback provider برای OAuth خارجی → contracts.externalAuthProviders">
    **قدیمی**: پیاده‌سازی `resolveExternalOAuthProfiles(...)` بدون اعلام provider در manifest مربوط به Plugin.

    **جدید**: `contracts.externalAuthProviders` را در manifest مربوط به Plugin اعلام کنید
    **و** `resolveExternalAuthProfiles(...)` را پیاده‌سازی کنید. مسیر قدیمی «auth fallback» در runtime هشدار emit می‌کند و حذف خواهد شد.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="lookup متغیر محیطی provider → setup.providers[].envVars">
    field قدیمی manifest: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **جدید**: همان lookup متغیر محیطی را در manifest به `setup.providers[].envVars` منعکس کنید. این کار metadata مربوط به setup/status env را در یک محل تجمیع می‌کند و از راه‌اندازی runtime مربوط به Plugin فقط برای پاسخ به lookupهای متغیر محیطی جلوگیری می‌کند.

    `providerAuthEnvVars` تا پایان بازهٔ منسوخ‌سازی از طریق adapter سازگاری پشتیبانی می‌شود.

  </Accordion>

  <Accordion title="ثبت Plugin حافظه → registerMemoryCapability">
    **قدیمی**: سه فراخوانی جدا -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **جدید**: یک فراخوانی روی API وضعیت حافظه -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    همان slotها، یک فراخوانی ثبت واحد. helperهای حافظهٔ افزایشی
    (`registerMemoryPromptSupplement`،‏ `registerMemoryCorpusSupplement`،
    `registerMemoryEmbeddingProvider`) تحت‌تأثیر نیستند.

  </Accordion>

  <Accordion title="typeهای پیام‌های session مربوط به subagent تغییر نام داده‌اند">
    دو alias قدیمی type همچنان از `src/plugins/runtime/types.ts` export می‌شوند:

    | قدیمی                         | جدید                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    متد runtime‏ `readSession` به نفع `getSessionMessages` منسوخ شده است. همان signature؛ متد قدیمی به متد جدید فراخوانی را عبور می‌دهد.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **قدیمی**: `runtime.tasks.flow` (مفرد) یک accessor زندهٔ task-flow برمی‌گرداند.

    **جدید**: `runtime.tasks.managedFlows`، runtime جهش TaskFlow مدیریت‌شده را برای Pluginهایی نگه می‌دارد که از یک flow، taskهای فرزند ایجاد، به‌روزرسانی، لغو یا اجرا می‌کنند. وقتی Plugin فقط به خواندن‌های مبتنی بر DTO نیاز دارد از `runtime.tasks.flows` استفاده کنید.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="factoryهای extension تعبیه‌شده → middleware نتیجهٔ ابزار agent">
    در بخش «چگونه مهاجرت کنیم → extensionهای نتیجهٔ ابزار Pi را به
    middleware مهاجرت دهید» در بالا پوشش داده شده است. برای کامل بودن اینجا هم آمده است: مسیر حذف‌شدهٔ فقط مخصوص Pi یعنی
    `api.registerEmbeddedExtensionFactory(...)` با
    `api.registerAgentToolResultMiddleware(...)` و یک فهرست صریح runtime در `contracts.agentToolResultMiddleware` جایگزین شده است.
  </Accordion>

  <Accordion title="alias ‏OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` که از `openclaw/plugin-sdk` دوباره export می‌شود اکنون یک alias تک‌خطی برای `OpenClawConfig` است. نام رسمی را ترجیح دهید.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
منسوخ‌سازی‌های سطح extension (داخل Pluginهای کانال/provider بسته‌بندی‌شده زیر
`extensions/`) داخل barrelهای `api.ts` و `runtime-api.ts` خودشان ردیابی می‌شوند. آن‌ها روی قراردادهای Plugin شخص ثالث اثر نمی‌گذارند و اینجا فهرست نشده‌اند. اگر barrel محلی یک Plugin بسته‌بندی‌شده را مستقیماً مصرف می‌کنید، پیش از ارتقا commentهای منسوخ‌سازی را در همان barrel بخوانید.
</Note>

## زمان‌بندی حذف

| زمان                   | چه اتفاقی می‌افتد                                                     |
| ---------------------- | ----------------------------------------------------------------------- |
| **اکنون**              | سطح‌های منسوخ‌شده هشدارهای runtime emit می‌کنند                       |
| **انتشار major بعدی** | سطح‌های منسوخ‌شده حذف خواهند شد؛ Pluginهایی که هنوز از آن‌ها استفاده می‌کنند fail خواهند شد |

همهٔ Pluginهای core قبلاً مهاجرت کرده‌اند. Pluginهای خارجی باید پیش از انتشار major بعدی مهاجرت کنند.

## سرکوب موقت هشدارها

هنگام کار روی مهاجرت، این متغیرهای محیطی را تنظیم کنید:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

این یک راه خروج موقت است، نه یک راه‌حل دائمی.

## مرتبط

- [شروع به کار](/fa/plugins/building-plugins) - نخستین Plugin خود را بسازید
- [نمای کلی SDK](/fa/plugins/sdk-overview) - مرجع کامل importهای subpath
- [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) - ساخت Pluginهای کانال
- [Pluginهای provider](/fa/plugins/sdk-provider-plugins) - ساخت Pluginهای provider
- [جزئیات داخلی Plugin](/fa/plugins/architecture) - بررسی عمیق معماری
- [Manifest مربوط به Plugin](/fa/plugins/manifest) - مرجع schema مربوط به manifest
