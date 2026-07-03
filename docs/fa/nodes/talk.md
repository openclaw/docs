---
read_when:
    - پیاده‌سازی حالت Talk در macOS/iOS/Android
    - تغییر رفتار صدا/TTS/وقفه
summary: 'حالت گفت‌وگو: مکالمه‌های گفتاری پیوسته در سراسر STT/TTS محلی و صدای بلادرنگ'
title: حالت گفتگو
x-i18n:
    generated_at: "2026-07-03T01:01:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22e1539de48fea2b1d4f04c2a6935b011c55a9a6d700b6caadc4daf5b038b60d
    source_path: nodes/talk.md
    workflow: 16
---

حالت گفت‌وگو دو شکل اجرایی دارد:

- گفت‌وگوی بومی macOS/iOS/Android از تشخیص گفتار محلی، چت Gateway، و TTS با `talk.speak` استفاده می‌کند. گره‌ها قابلیت `talk` را اعلام می‌کنند و فرمان‌های `talk.*` پشتیبانی‌شده را مشخص می‌کنند.
- گفت‌وگوی iOS برای پیکربندی‌های realtime مربوط به OpenAI که `webrtc` را انتخاب می‌کنند یا ترابری را حذف می‌کنند، از WebRTC تحت مالکیت کلاینت استفاده می‌کند. پیکربندی‌های realtime صریح با `gateway-relay`، `provider-websocket`، و پیکربندی‌های realtime غیر OpenAI روی relay تحت مالکیت Gateway می‌مانند؛ پیکربندی‌های غیر realtime از چرخه گفتار بومی استفاده می‌کنند.
- گفت‌وگوی مرورگر برای نشست‌های `webrtc` و `provider-websocket` تحت مالکیت کلاینت از `talk.client.create` استفاده می‌کند، یا برای نشست‌های `gateway-relay` تحت مالکیت Gateway از `talk.session.create` استفاده می‌کند. `managed-room` برای واگذاری Gateway و اتاق‌های واکی‌تاکی رزرو شده است.
- گفت‌وگوی Android می‌تواند با `talk.realtime.mode: "realtime"` و `talk.realtime.transport: "gateway-relay"` نشست‌های relay realtime تحت مالکیت Gateway را فعال کند. در غیر این صورت روی تشخیص گفتار بومی، چت Gateway، و `talk.speak` می‌ماند.
- کلاینت‌های فقط رونویسی وقتی به زیرنویس یا دیکته بدون پاسخ صوتی دستیار نیاز دارند، از `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`، سپس `talk.session.appendAudio`، `talk.session.cancelTurn`، و `talk.session.close` استفاده می‌کنند.

گفت‌وگوی بومی یک چرخه پیوسته مکالمه صوتی است:

1. گوش دادن به گفتار
2. ارسال رونویس از طریق نشست فعال به مدل
3. انتظار برای پاسخ
4. خواندن آن از طریق ارائه‌دهنده پیکربندی‌شده گفت‌وگو (`talk.speak`)

گفت‌وگوی realtime تحت مالکیت کلاینت، فراخوانی‌های ابزار ارائه‌دهنده را از طریق `talk.client.toolCall` ارسال می‌کند؛ این کلاینت‌ها برای مشاوره‌های realtime مستقیماً `chat.send` را فراخوانی نمی‌کنند.
وقتی یک مشاوره realtime فعال است، کلاینت‌های گفت‌وگو می‌توانند از `talk.client.steer` یا
`talk.session.steer` برای دسته‌بندی ورودی گفتاری به‌عنوان `status`، `steer`، `cancel`، یا
`followup` استفاده کنند. هدایت پذیرفته‌شده در اجرای تعبیه‌شده فعال صف‌بندی می‌شود؛ هدایت ردشده
دلیلی ساختاریافته مانند `no_active_run`، `not_streaming`،
یا `compacting` برمی‌گرداند.

گفت‌وگوی فقط رونویسی همان پاکت رویداد مشترک گفت‌وگو را مانند نشست‌های realtime و STT/TTS منتشر می‌کند، اما از `mode: "transcription"` و `brain: "none"` استفاده می‌کند. این حالت برای زیرنویس، دیکته، و ضبط گفتار فقط برای مشاهده است؛ یادداشت‌های صوتی بارگذاری‌شده یک‌باره همچنان از مسیر رسانه/صدا استفاده می‌کنند.

## رفتار (macOS)

- **هم‌پوشانی همیشه روشن** تا زمانی که حالت گفت‌وگو فعال است.
- گذارهای مرحله‌ای **در حال گوش دادن → در حال فکر کردن → در حال صحبت کردن**.
- هنگام یک **مکث کوتاه** (پنجره سکوت)، رونویس فعلی ارسال می‌شود.
- پاسخ‌ها **در WebChat نوشته می‌شوند** (مانند تایپ کردن).
- **قطع هنگام گفتار** (به‌طور پیش‌فرض روشن): اگر کاربر هنگام صحبت دستیار شروع به صحبت کند، پخش را متوقف می‌کنیم و مُهر زمانی قطع را برای اعلان بعدی ثبت می‌کنیم.

## دستورالعمل‌های صوتی در پاسخ‌ها

دستیار می‌تواند پاسخ خود را با یک **خط JSON واحد** برای کنترل صدا آغاز کند:

```json
{ "voice": "<voice-id>", "once": true }
```

قواعد:

- فقط نخستین خط غیرخالی.
- کلیدهای ناشناخته نادیده گرفته می‌شوند.
- `once: true` فقط برای پاسخ فعلی اعمال می‌شود.
- بدون `once`، صدا به پیش‌فرض جدید حالت گفت‌وگو تبدیل می‌شود.
- خط JSON پیش از پخش TTS حذف می‌شود.

کلیدهای پشتیبانی‌شده:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## پیکربندی (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          apiKey: "openai_api_key",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

پیش‌فرض‌ها:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: وقتی تنظیم نشده باشد، گفت‌وگو پیش از ارسال رونویس، پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: ارائه‌دهنده فعال گفت‌وگو را انتخاب می‌کند. برای مسیرهای پخش محلی macOS از `elevenlabs`، `mlx`، یا `system` استفاده کنید.
- `providers.<provider>.voiceId`: برای ElevenLabs به `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` بازمی‌گردد (یا وقتی کلید API در دسترس باشد، نخستین صدای ElevenLabs).
- `providers.elevenlabs.modelId`: وقتی تنظیم نشده باشد، پیش‌فرض آن `eleven_v3` است.
- `providers.mlx.modelId`: وقتی تنظیم نشده باشد، پیش‌فرض آن `mlx-community/Soprano-80M-bf16` است.
- `providers.elevenlabs.apiKey`: به `ELEVENLABS_API_KEY` بازمی‌گردد (یا اگر در دسترس باشد، پروفایل shell مربوط به gateway).
- `consultThinkingLevel`: بازنویسی اختیاری سطح تفکر برای اجرای کامل عامل OpenClaw پشت فراخوانی‌های realtime `openclaw_agent_consult`.
- `consultFastMode`: بازنویسی اختیاری حالت سریع برای فراخوانی‌های realtime `openclaw_agent_consult`.
- `realtime.provider`: ارائه‌دهنده صوتی realtime فعال را انتخاب می‌کند. برای WebRTC از `openai`، برای WebSocket ارائه‌دهنده از `google`، یا برای ارائه‌دهنده فقط-پل از طریق relay Gateway استفاده کنید.
- `realtime.providers.<provider>` پیکربندی realtime تحت مالکیت ارائه‌دهنده را ذخیره می‌کند. مرورگر فقط اعتبارنامه‌های نشست موقت یا محدودشده را دریافت می‌کند، نه یک کلید API استاندارد.
- `realtime.providers.openai.voice`: شناسه صدای OpenAI Realtime داخلی. صداهای فعلی `gpt-realtime-2` عبارت‌اند از `alloy`، `ash`، `ballad`، `coral`، `echo`، `sage`، `shimmer`، `verse`، `marin`، و `cedar`؛ برای بهترین کیفیت، `marin` و `cedar` توصیه می‌شوند.
- `realtime.transport`: `webrtc` از WebRTC مربوط به OpenAI تحت مالکیت کلاینت در iOS و مرورگر استفاده می‌کند. `provider-websocket` تحت مالکیت مرورگر است اما در iOS روی relay Gateway می‌ماند. `gateway-relay` صدای ارائه‌دهنده را روی Gateway نگه می‌دارد؛ Android فقط برای این ترابری از realtime استفاده می‌کند و در غیر این صورت چرخه بومی STT/TTS خود را نگه می‌دارد.
- `realtime.brain`: `agent-consult` فراخوانی‌های ابزار realtime را از طریق سیاست Gateway مسیریابی می‌کند؛ `direct-tools` رفتار سازگاری قدیمی ابزار مستقیم است؛ `none` برای رونویسی یا هماهنگ‌سازی خارجی است.
- `realtime.consultRouting`: `provider-direct` پاسخ مستقیم ارائه‌دهنده را وقتی `openclaw_agent_consult` را رد می‌کند حفظ می‌کند؛ `force-agent-consult` باعث می‌شود relay Gateway رونویس‌های نهایی کاربر را در عوض از طریق OpenClaw مسیریابی کند.
- `realtime.instructions`: دستورالعمل‌های سیستمی رو به ارائه‌دهنده را به اعلان realtime داخلی OpenClaw اضافه می‌کند. از آن برای سبک و لحن صدا استفاده کنید؛ OpenClaw راهنمای پیش‌فرض `openclaw_agent_consult` را نگه می‌دارد.
- `talk.catalog` حالت‌ها، ترابری‌ها، راهبردهای brain، قالب‌های صوتی realtime، و پرچم‌های قابلیت معتبر هر ارائه‌دهنده را آشکار می‌کند تا کلاینت‌های گفت‌وگوی رسمی بتوانند از ترکیب‌های پشتیبانی‌نشده پرهیز کنند.
- ارائه‌دهندگان رونویسی جریانی از طریق `talk.catalog.transcription` کشف می‌شوند. relay فعلی Gateway تا زمانی که سطح پیکربندی اختصاصی رونویسی گفت‌وگو اضافه شود، از پیکربندی ارائه‌دهنده جریانی تماس صوتی استفاده می‌کند.
- `speechLocale`: شناسه locale اختیاری BCP 47 برای تشخیص گفتار گفت‌وگوی روی دستگاه در iOS/macOS. برای استفاده از پیش‌فرض دستگاه، آن را تنظیم‌نشده بگذارید.
- `outputFormat`: روی macOS/iOS به‌طور پیش‌فرض `pcm_44100` و روی Android به‌طور پیش‌فرض `pcm_24000` است (برای اجبار پخش جریانی MP3، `mp3_*` را تنظیم کنید)

## رابط کاربری macOS

- کلید نوار منو: **گفت‌وگو**
- زبانه پیکربندی: گروه **حالت گفت‌وگو** (شناسه صدا + کلید قطع)
- هم‌پوشانی:
  - **در حال گوش دادن**: ابر همراه با سطح میکروفون می‌تپد
  - **در حال فکر کردن**: پویانمایی فرورونده
  - **در حال صحبت کردن**: حلقه‌های تابشی
  - کلیک روی ابر: توقف صحبت
  - کلیک روی X: خروج از حالت گفت‌وگو

## رابط کاربری Android

- کلید زبانه صدا: **گفت‌وگو**
- **میکروفون** دستی و **گفت‌وگو** حالت‌های ضبط اجرایی ناسازگار با هم هستند.
- میکروفون دستی و گفت‌وگوی realtime یک میکروفون هدست Bluetooth Classic یا BLE متصل را ترجیح می‌دهند. اگر اتصال آن قطع شود، برنامه ورودی هدست دیگری را درخواست می‌کند یا اجازه می‌دهد Android از میکروفون پیش‌فرض استفاده کند؛ توقف ضبط، ترجیح میکروفون پیش‌فرض را بازمی‌گرداند.
- میکروفون دستی وقتی برنامه از پیش‌زمینه خارج شود یا کاربر زبانه صدا را ترک کند، متوقف می‌شود.
- حالت گفت‌وگو تا زمانی که خاموش شود یا گره Android قطع شود، به اجرا ادامه می‌دهد و هنگام فعال بودن از نوع سرویس پیش‌زمینه میکروفون Android استفاده می‌کند.

## یادداشت‌ها

- به مجوزهای گفتار + میکروفون نیاز دارد.
- گفت‌وگوی بومی از نشست Gateway فعال استفاده می‌کند و فقط وقتی رویدادهای پاسخ در دسترس نباشند به polling تاریخچه بازمی‌گردد.
- گفت‌وگوی realtime تحت مالکیت کلاینت برای `openclaw_agent_consult` به‌جای آشکار کردن `chat.send` برای نشست‌های تحت مالکیت ارائه‌دهنده، از `talk.client.toolCall` استفاده می‌کند.
- گفت‌وگوی فقط رونویسی از `talk.session.create`، `talk.session.appendAudio`، `talk.session.cancelTurn`، و `talk.session.close` استفاده می‌کند؛ کلاینت‌ها برای به‌روزرسانی‌های جزئی/نهایی رونویس در `talk.event` مشترک می‌شوند.
- gateway پخش گفت‌وگو را از طریق `talk.speak` با استفاده از ارائه‌دهنده فعال گفت‌وگو resolve می‌کند. Android فقط وقتی آن RPC در دسترس نباشد به TTS سیستم محلی بازمی‌گردد.
- پخش MLX محلی macOS وقتی helper همراه `openclaw-mlx-tts` وجود داشته باشد از آن استفاده می‌کند، یا از یک فایل اجرایی روی `PATH`. در زمان توسعه، `OPENCLAW_MLX_TTS_BIN` را تنظیم کنید تا به یک باینری helper سفارشی اشاره کند.
- `stability` برای `eleven_v3` به `0.0`، `0.5`، یا `1.0` اعتبارسنجی می‌شود؛ مدل‌های دیگر `0..1` را می‌پذیرند.
- `latency_tier` وقتی تنظیم شده باشد، به `0..4` اعتبارسنجی می‌شود.
- Android برای پخش جریانی AudioTrack کم‌تأخیر از قالب‌های خروجی `pcm_16000`، `pcm_22050`، `pcm_24000`، و `pcm_44100` پشتیبانی می‌کند.

## مرتبط

- [بیدارباش صوتی](/fa/nodes/voicewake)
- [صدا و یادداشت‌های صوتی](/fa/nodes/audio)
- [درک رسانه](/fa/nodes/media-understanding)
