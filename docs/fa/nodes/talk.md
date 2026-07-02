---
read_when:
    - پیاده‌سازی حالت Talk در macOS/iOS/Android
    - تغییر رفتار صدا/TTS/وقفه
summary: 'حالت گفت‌وگو: مکالمه‌های گفتاری پیوسته در local STT/TTS و صدای بلادرنگ'
title: حالت گفتگو
x-i18n:
    generated_at: "2026-07-02T22:41:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 696e9693cd6b4a18500221230db17c94ffd01fe6f9c7fcf271b74072bb035a82
    source_path: nodes/talk.md
    workflow: 16
---

حالت گفت‌وگو دو شکل اجرایی دارد:

- گفت‌وگوی بومی macOS/iOS/Android از تشخیص گفتار محلی، چت Gateway و TTS با `talk.speak` استفاده می‌کند. گره‌ها قابلیت `talk` را اعلام می‌کنند و فرمان‌های `talk.*` پشتیبانی‌شده را مشخص می‌کنند.
- گفت‌وگوی iOS برای پیکربندی‌های بلادرنگ OpenAI که `webrtc` را انتخاب می‌کنند یا transport را حذف می‌کنند، از WebRTC تحت مالکیت کلاینت استفاده می‌کند. پیکربندی‌های بلادرنگ صریح `gateway-relay`، `provider-websocket` و غیر OpenAI روی relay تحت مالکیت Gateway باقی می‌مانند؛ پیکربندی‌های غیر بلادرنگ از حلقه گفتار بومی استفاده می‌کنند.
- گفت‌وگوی مرورگر از `talk.client.create` برای نشست‌های `webrtc` و `provider-websocket` تحت مالکیت کلاینت، یا از `talk.session.create` برای نشست‌های `gateway-relay` تحت مالکیت Gateway استفاده می‌کند. `managed-room` برای واگذاری Gateway و اتاق‌های بی‌سیم رزرو شده است.
- گفت‌وگوی Android می‌تواند با `talk.realtime.mode: "realtime"` و `talk.realtime.transport: "gateway-relay"` نشست‌های relay بلادرنگ تحت مالکیت Gateway را فعال کند. در غیر این صورت روی تشخیص گفتار بومی، چت Gateway و `talk.speak` باقی می‌ماند.
- کلاینت‌های فقط رونویسی وقتی به زیرنویس یا دیکته بدون پاسخ صوتی دستیار نیاز دارند، از `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })` و سپس `talk.session.appendAudio`، `talk.session.cancelTurn` و `talk.session.close` استفاده می‌کنند.

گفت‌وگوی بومی یک حلقه پیوسته مکالمه صوتی است:

1. گوش دادن به گفتار
2. ارسال رونویسی به مدل از طریق نشست فعال
3. انتظار برای پاسخ
4. گفتن آن از طریق ارائه‌دهنده پیکربندی‌شده گفت‌وگو (`talk.speak`)

گفت‌وگوی بلادرنگ تحت مالکیت کلاینت، فراخوانی‌های ابزار ارائه‌دهنده را از طریق `talk.client.toolCall` عبور می‌دهد؛ این کلاینت‌ها برای مشاوره‌های بلادرنگ مستقیما `chat.send` را فراخوانی نمی‌کنند.
وقتی یک مشاوره بلادرنگ فعال است، کلاینت‌های گفت‌وگو می‌توانند از `talk.client.steer` یا
`talk.session.steer` برای دسته‌بندی ورودی گفتاری به‌عنوان `status`، `steer`، `cancel` یا
`followup` استفاده کنند. هدایت پذیرفته‌شده در اجرای تعبیه‌شده فعال صف می‌شود؛ هدایت ردشده
دلیلی ساختاریافته مانند `no_active_run`، `not_streaming`،
یا `compacting` برمی‌گرداند.

گفت‌وگوی فقط رونویسی همان پاکت رویداد مشترک گفت‌وگو را مثل نشست‌های بلادرنگ و STT/TTS منتشر می‌کند، اما از `mode: "transcription"` و `brain: "none"` استفاده می‌کند. این حالت برای زیرنویس، دیکته و ضبط گفتار فقط برای مشاهده است؛ یادداشت‌های صوتی آپلودشده تک‌مرحله‌ای همچنان از مسیر رسانه/صوت استفاده می‌کنند.

## رفتار (macOS)

- **پوشش همیشه‌روشن** تا زمانی که حالت گفت‌وگو فعال باشد.
- گذارهای مرحله‌ای **گوش دادن → فکر کردن → صحبت کردن**.
- هنگام یک **مکث کوتاه** (پنجره سکوت)، رونویسی فعلی ارسال می‌شود.
- پاسخ‌ها **در WebChat نوشته می‌شوند** (همانند تایپ کردن).
- **وقفه هنگام گفتار** (به‌صورت پیش‌فرض روشن): اگر کاربر هنگام صحبت کردن دستیار شروع به حرف زدن کند، پخش را متوقف می‌کنیم و زمان‌مهر وقفه را برای اعلان بعدی ثبت می‌کنیم.

## دستورهای صوتی در پاسخ‌ها

دستیار می‌تواند برای کنترل صدا، پاسخ خود را با یک **خط JSON واحد** شروع کند:

```json
{ "voice": "<voice-id>", "once": true }
```

قواعد:

- فقط نخستین خط غیرخالی.
- کلیدهای ناشناخته نادیده گرفته می‌شوند.
- `once: true` فقط روی پاسخ فعلی اعمال می‌شود.
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
- `silenceTimeoutMs`: وقتی تنظیم نشده باشد، گفت‌وگو پیش از ارسال رونویسی، پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: ارائه‌دهنده فعال گفت‌وگو را انتخاب می‌کند. برای مسیرهای پخش محلی macOS از `elevenlabs`، `mlx` یا `system` استفاده کنید.
- `providers.<provider>.voiceId`: برای ElevenLabs به `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` بازمی‌گردد (یا وقتی کلید API در دسترس باشد، به نخستین صدای ElevenLabs).
- `providers.elevenlabs.modelId`: وقتی تنظیم نشده باشد، به‌صورت پیش‌فرض `eleven_v3` است.
- `providers.mlx.modelId`: وقتی تنظیم نشده باشد، به‌صورت پیش‌فرض `mlx-community/Soprano-80M-bf16` است.
- `providers.elevenlabs.apiKey`: به `ELEVENLABS_API_KEY` بازمی‌گردد (یا در صورت وجود، پروفایل shell Gateway).
- `consultThinkingLevel`: بازنویسی اختیاری سطح تفکر برای اجرای کامل عامل OpenClaw پشت فراخوانی‌های بلادرنگ `openclaw_agent_consult`.
- `consultFastMode`: بازنویسی اختیاری حالت سریع برای فراخوانی‌های بلادرنگ `openclaw_agent_consult`.
- `realtime.provider`: ارائه‌دهنده فعال صدای بلادرنگ را انتخاب می‌کند. از `openai` برای WebRTC، از `google` برای WebSocket ارائه‌دهنده، یا از یک ارائه‌دهنده فقط پل از طریق relay Gateway استفاده کنید.
- `realtime.providers.<provider>` پیکربندی بلادرنگ تحت مالکیت ارائه‌دهنده را ذخیره می‌کند. مرورگر فقط اعتبارنامه‌های نشست موقت یا محدودشده را دریافت می‌کند، هرگز کلید API استاندارد را نه.
- `realtime.providers.openai.voice`: شناسه صدای داخلی OpenAI Realtime. صداهای فعلی `gpt-realtime-2` عبارت‌اند از `alloy`، `ash`، `ballad`، `coral`، `echo`، `sage`، `shimmer`، `verse`، `marin` و `cedar`؛ `marin` و `cedar` برای بهترین کیفیت توصیه می‌شوند.
- `realtime.transport`: `webrtc` از WebRTC تحت مالکیت کلاینت OpenAI در iOS و مرورگر استفاده می‌کند. `provider-websocket` تحت مالکیت مرورگر است اما در iOS روی relay Gateway باقی می‌ماند. `gateway-relay` صدای ارائه‌دهنده را روی Gateway نگه می‌دارد؛ Android فقط برای این transport از بلادرنگ استفاده می‌کند و در غیر این صورت حلقه STT/TTS بومی خود را نگه می‌دارد.
- `realtime.brain`: `agent-consult` فراخوانی‌های ابزار بلادرنگ را از طریق سیاست Gateway مسیریابی می‌کند؛ `direct-tools` رفتار سازگاری مستقیم با ابزارهای قدیمی است؛ `none` برای رونویسی یا هماهنگ‌سازی خارجی است.
- `realtime.consultRouting`: `provider-direct` پاسخ مستقیم ارائه‌دهنده را وقتی `openclaw_agent_consult` را رد می‌کند حفظ می‌کند؛ `force-agent-consult` باعث می‌شود relay Gateway رونویسی‌های نهایی کاربر را به‌جای آن از طریق OpenClaw مسیریابی کند.
- `realtime.instructions`: دستورهای سیستمی روبه‌روی ارائه‌دهنده را به اعلان بلادرنگ داخلی OpenClaw اضافه می‌کند. از آن برای سبک و لحن صدا استفاده کنید؛ OpenClaw راهنمایی پیش‌فرض `openclaw_agent_consult` را نگه می‌دارد.
- `talk.catalog` حالت‌های معتبر، transportها، راهبردهای brain، قالب‌های صوتی بلادرنگ و پرچم‌های قابلیت هر ارائه‌دهنده را نمایش می‌دهد تا کلاینت‌های گفت‌وگوی رسمی بتوانند از ترکیب‌های پشتیبانی‌نشده اجتناب کنند.
- ارائه‌دهندگان رونویسی جریانی از طریق `talk.catalog.transcription` کشف می‌شوند. relay فعلی Gateway تا زمان اضافه شدن سطح پیکربندی اختصاصی رونویسی گفت‌وگو، از پیکربندی ارائه‌دهنده جریانی Voice Call استفاده می‌کند.
- `speechLocale`: شناسه locale اختیاری BCP 47 برای تشخیص گفتار روی‌دستگاه گفت‌وگو در iOS/macOS. برای استفاده از پیش‌فرض دستگاه، آن را تنظیم‌نشده بگذارید.
- `outputFormat`: به‌صورت پیش‌فرض در macOS/iOS برابر `pcm_44100` و در Android برابر `pcm_24000` است (برای اجبار به پخش جریانی MP3، `mp3_*` را تنظیم کنید)

## رابط کاربری macOS

- کلید نوار منو: **گفت‌وگو**
- زبانه پیکربندی: گروه **حالت گفت‌وگو** (شناسه صدا + کلید وقفه)
- پوشش:
  - **گوش دادن**: ابر با سطح میکروفون تپش می‌کند
  - **فکر کردن**: پویانمایی فرو رفتن
  - **صحبت کردن**: حلقه‌های تابشی
  - کلیک روی ابر: توقف صحبت
  - کلیک روی X: خروج از حالت گفت‌وگو

## رابط کاربری Android

- کلید زبانه صدا: **گفت‌وگو**
- **میکروفون** دستی و **گفت‌وگو** حالت‌های ضبط اجرایی ناسازگار با یکدیگر هستند.
- میکروفون دستی وقتی برنامه از پیش‌زمینه خارج شود یا کاربر زبانه صدا را ترک کند، متوقف می‌شود.
- حالت گفت‌وگو تا خاموش شدن کلید آن یا قطع اتصال گره Android به اجرا ادامه می‌دهد و هنگام فعال بودن، از نوع سرویس پیش‌زمینه میکروفون Android استفاده می‌کند.

## یادداشت‌ها

- به مجوزهای گفتار + میکروفون نیاز دارد.
- گفت‌وگوی بومی از نشست فعال Gateway استفاده می‌کند و فقط وقتی رویدادهای پاسخ در دسترس نباشند، به polling تاریخچه بازمی‌گردد.
- گفت‌وگوی بلادرنگ تحت مالکیت کلاینت برای `openclaw_agent_consult` از `talk.client.toolCall` استفاده می‌کند، به‌جای اینکه `chat.send` را به نشست‌های تحت مالکیت ارائه‌دهنده در معرض بگذارد.
- گفت‌وگوی فقط رونویسی از `talk.session.create`، `talk.session.appendAudio`، `talk.session.cancelTurn` و `talk.session.close` استفاده می‌کند؛ کلاینت‌ها برای به‌روزرسانی‌های جزئی/نهایی رونویسی در `talk.event` مشترک می‌شوند.
- Gateway پخش گفت‌وگو را از طریق `talk.speak` و با استفاده از ارائه‌دهنده فعال گفت‌وگو حل می‌کند. Android فقط وقتی آن RPC در دسترس نباشد، به TTS سیستم محلی بازمی‌گردد.
- پخش محلی MLX در macOS هنگام وجود، از کمک‌برنامه همراه `openclaw-mlx-tts` یا از یک فایل اجرایی در `PATH` استفاده می‌کند. هنگام توسعه، `OPENCLAW_MLX_TTS_BIN` را تنظیم کنید تا به یک باینری کمک‌برنامه سفارشی اشاره کند.
- `stability` برای `eleven_v3` به `0.0`، `0.5` یا `1.0` اعتبارسنجی می‌شود؛ مدل‌های دیگر `0..1` را می‌پذیرند.
- `latency_tier` هنگام تنظیم شدن به `0..4` اعتبارسنجی می‌شود.
- Android از قالب‌های خروجی `pcm_16000`، `pcm_22050`، `pcm_24000` و `pcm_44100` برای پخش جریانی AudioTrack با تاخیر کم پشتیبانی می‌کند.

## مرتبط

- [بیدارباش صوتی](/fa/nodes/voicewake)
- [صوت و یادداشت‌های صوتی](/fa/nodes/audio)
- [درک رسانه](/fa/nodes/media-understanding)
