---
read_when:
    - پیاده‌سازی حالت گفت‌وگو در macOS/iOS/Android
    - تغییر رفتار صدا/TTS/وقفه
summary: 'حالت گفت‌وگو: مکالمه‌های گفتاری پیوسته در STT/TTS محلی و صدای بلادرنگ'
title: حالت گفت‌وگو
x-i18n:
    generated_at: "2026-07-03T09:47:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9c8cdb6ffef7575348e94b36cd73a0613c336d8e811d6ce46d7518ee7c34b14
    source_path: nodes/talk.md
    workflow: 16
---

حالت Talk دو شکل زمان‌اجرایی دارد:

- Talk بومی macOS/iOS/Android از تشخیص گفتار محلی، چت Gateway، و TTS با `talk.speak` استفاده می‌کند. گره‌ها قابلیت `talk` را اعلام می‌کنند و فرمان‌های `talk.*` را که پشتیبانی می‌کنند مشخص می‌کنند.
- iOS Talk برای پیکربندی‌های بی‌درنگ OpenAI که `webrtc` را انتخاب می‌کنند یا transport را حذف می‌کنند، از WebRTC تحت مالکیت کلاینت استفاده می‌کند. پیکربندی‌های بی‌درنگ صریح `gateway-relay`، `provider-websocket`، و غیر OpenAI روی رله تحت مالکیت Gateway می‌مانند؛ پیکربندی‌های غیر بی‌درنگ از حلقه گفتار بومی استفاده می‌کنند.
- Browser Talk از `talk.client.create` برای نشست‌های `webrtc` و `provider-websocket` تحت مالکیت کلاینت، یا از `talk.session.create` برای نشست‌های `gateway-relay` تحت مالکیت Gateway استفاده می‌کند. `managed-room` برای واگذاری Gateway و اتاق‌های واکی‌تاکی رزرو شده است.
- Android Talk می‌تواند با `talk.realtime.mode: "realtime"` و `talk.realtime.transport: "gateway-relay"` به نشست‌های رله بی‌درنگ تحت مالکیت Gateway وارد شود. در غیر این صورت روی تشخیص گفتار بومی، چت Gateway، و `talk.speak` باقی می‌ماند.
- کلاینت‌های فقط رونویسی وقتی به زیرنویس یا دیکته بدون پاسخ صوتی دستیار نیاز دارند، از `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`، سپس `talk.session.appendAudio`، `talk.session.cancelTurn`، و `talk.session.close` استفاده می‌کنند.

Talk بومی یک حلقه پیوسته مکالمه صوتی است:

1. گوش دادن به گفتار
2. ارسال رونویسی به مدل از طریق نشست فعال
3. انتظار برای پاسخ
4. بیان آن از طریق ارائه‌دهنده Talk پیکربندی‌شده (`talk.speak`)

Talk بی‌درنگ تحت مالکیت کلاینت فراخوانی‌های ابزار ارائه‌دهنده را از طریق `talk.client.toolCall` عبور می‌دهد؛ این کلاینت‌ها برای مشورت‌های بی‌درنگ مستقیماً `chat.send` را فراخوانی نمی‌کنند.
در حالی که یک مشورت بی‌درنگ فعال است، کلاینت‌های Talk می‌توانند از `talk.client.steer` یا
`talk.session.steer` استفاده کنند تا ورودی گفتاری را به‌صورت `status`، `steer`، `cancel`، یا
`followup` طبقه‌بندی کنند. هدایت پذیرفته‌شده در اجرای تعبیه‌شده فعال صف می‌شود؛ هدایت
ردشده دلیلی ساختاریافته مانند `no_active_run`، `not_streaming`،
یا `compacting` برمی‌گرداند.

Talk فقط رونویسی همان پاکت رویداد مشترک Talk را مثل نشست‌های بی‌درنگ و STT/TTS منتشر می‌کند، اما از `mode: "transcription"` و `brain: "none"` استفاده می‌کند. این برای زیرنویس، دیکته، و ضبط گفتار فقط-مشاهده است؛ یادداشت‌های صوتی آپلودشده تک‌مرحله‌ای همچنان از مسیر رسانه/صدا استفاده می‌کنند.

## رفتار (macOS)

- **هم‌پوشانی همیشه روشن** تا زمانی که حالت Talk فعال است.
- گذارهای مرحله‌ای **در حال گوش دادن → در حال فکر کردن → در حال صحبت کردن**.
- در یک **مکث کوتاه** (پنجره سکوت)، رونویسی فعلی ارسال می‌شود.
- پاسخ‌ها **در WebChat نوشته می‌شوند** (همانند تایپ کردن).
- **وقفه با گفتار** (به‌طور پیش‌فرض روشن): اگر کاربر هنگام صحبت کردن دستیار شروع به حرف زدن کند، پخش را متوقف می‌کنیم و برچسب زمانی وقفه را برای پرامپت بعدی ثبت می‌کنیم.

## دستورهای صوتی در پاسخ‌ها

دستیار می‌تواند برای کنترل صدا، پاسخ خود را با یک **خط JSON تکی** پیشوند کند:

```json
{ "voice": "<voice-id>", "once": true }
```

قواعد:

- فقط نخستین خط غیرخالی.
- کلیدهای ناشناخته نادیده گرفته می‌شوند.
- `once: true` فقط روی پاسخ فعلی اعمال می‌شود.
- بدون `once`، صدا به پیش‌فرض جدید برای حالت Talk تبدیل می‌شود.
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
- `silenceTimeoutMs`: وقتی تنظیم نشده باشد، Talk پیش از ارسال رونویسی پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms در macOS و Android، 900 ms در iOS`)
- `provider`: ارائه‌دهنده فعال Talk را انتخاب می‌کند. برای مسیرهای پخش محلی macOS از `elevenlabs`، `mlx`، یا `system` استفاده کنید.
- `providers.<provider>.voiceId`: برای ElevenLabs به `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` بازمی‌گردد (یا وقتی کلید API در دسترس است، به نخستین صدای ElevenLabs).
- `providers.elevenlabs.modelId`: وقتی تنظیم نشده باشد، به‌طور پیش‌فرض `eleven_v3` است.
- `providers.mlx.modelId`: وقتی تنظیم نشده باشد، به‌طور پیش‌فرض `mlx-community/Soprano-80M-bf16` است.
- `providers.elevenlabs.apiKey`: به `ELEVENLABS_API_KEY` بازمی‌گردد (یا در صورت دسترسی، پروفایل شل gateway).
- `consultThinkingLevel`: بازنویسی اختیاری سطح فکر برای اجرای کامل عامل OpenClaw پشت فراخوانی‌های بی‌درنگ `openclaw_agent_consult`.
- `consultFastMode`: بازنویسی اختیاری حالت سریع برای فراخوانی‌های بی‌درنگ `openclaw_agent_consult`.
- `realtime.provider`: ارائه‌دهنده فعال صدای بی‌درنگ را انتخاب می‌کند. برای WebRTC از `openai`، برای WebSocket ارائه‌دهنده از `google`، یا از یک ارائه‌دهنده فقط-پل از طریق رله Gateway استفاده کنید.
- `realtime.providers.<provider>` پیکربندی بی‌درنگ تحت مالکیت ارائه‌دهنده را ذخیره می‌کند. مرورگر فقط اعتبارنامه‌های نشست موقت یا محدودشده را دریافت می‌کند، هرگز یک کلید API استاندارد.
- `realtime.providers.openai.voice`: شناسه صدای داخلی OpenAI Realtime. صداهای فعلی `gpt-realtime-2` عبارت‌اند از `alloy`، `ash`، `ballad`، `coral`، `echo`، `sage`، `shimmer`، `verse`، `marin`، و `cedar`؛ `marin` و `cedar` برای بهترین کیفیت توصیه می‌شوند.
- `realtime.transport`: `webrtc` از OpenAI WebRTC تحت مالکیت کلاینت در iOS و مرورگر استفاده می‌کند. `provider-websocket` در مرورگر تحت مالکیت مرورگر است اما در iOS روی رله Gateway می‌ماند. `gateway-relay` صدای ارائه‌دهنده را روی Gateway نگه می‌دارد؛ Android فقط برای این transport از بی‌درنگ استفاده می‌کند و در غیر این صورت حلقه بومی STT/TTS خود را نگه می‌دارد.
- `realtime.brain`: `agent-consult` فراخوانی‌های ابزار بی‌درنگ را از طریق سیاست Gateway مسیریابی می‌کند؛ `direct-tools` رفتار سازگاری ابزار مستقیم legacy است؛ `none` برای رونویسی یا هماهنگ‌سازی خارجی است.
- `realtime.consultRouting`: `provider-direct` وقتی ارائه‌دهنده از `openclaw_agent_consult` عبور می‌کند، پاسخ مستقیم ارائه‌دهنده را حفظ می‌کند؛ `force-agent-consult` باعث می‌شود رله Gateway رونویسی‌های نهایی‌شده کاربر را در عوض از طریق OpenClaw مسیریابی کند.
- `realtime.instructions`: دستورهای سیستمی روبه‌ارائه‌دهنده را به پرامپت بی‌درنگ داخلی OpenClaw اضافه می‌کند. از آن برای سبک و لحن صدا استفاده کنید؛ OpenClaw راهنمایی پیش‌فرض `openclaw_agent_consult` را نگه می‌دارد.
- `talk.catalog` شناسه‌های canonical ارائه‌دهنده و aliasهای رجیستری را در کنار حالت‌های معتبر، transportها، راهبردهای brain، قالب‌های صوتی بی‌درنگ، پرچم‌های قابلیت، و نتیجه آمادگی انتخاب‌شده در زمان اجرا برای هر ارائه‌دهنده در معرض می‌گذارد. کلاینت‌های Talk فرست-پارتی باید به‌جای نگهداری aliasهای ارائه‌دهنده به‌صورت محلی، از آن catalog استفاده کنند؛ Gateway قدیمی‌تری که آمادگی گروه را حذف می‌کند، به‌جای قطعاً پیکربندی‌نشده، تأییدنشده است.
- ارائه‌دهنده‌های رونویسی جریانی از طریق `talk.catalog.transcription` کشف می‌شوند. رله Gateway فعلی تا زمانی که سطح پیکربندی اختصاصی رونویسی Talk اضافه شود، از پیکربندی ارائه‌دهنده جریان Voice Call استفاده می‌کند.
- `speechLocale`: شناسه locale اختیاری BCP 47 برای تشخیص گفتار Talk روی دستگاه در iOS/macOS. برای استفاده از پیش‌فرض دستگاه، آن را تنظیم‌نشده بگذارید.
- `outputFormat`: در macOS/iOS به‌طور پیش‌فرض `pcm_44100` و در Android به‌طور پیش‌فرض `pcm_24000` است (برای اجبار به جریان MP3، `mp3_*` را تنظیم کنید)

## رابط کاربری macOS

- کلید نوار منو: **Talk**
- زبانه پیکربندی: گروه **حالت Talk** (شناسه صدا + کلید وقفه)
- هم‌پوشانی:
  - **در حال گوش دادن**: ابر با سطح میکروفون تپش دارد
  - **در حال فکر کردن**: انیمیشن فرورونده
  - **در حال صحبت کردن**: حلقه‌های تابشی
  - کلیک روی ابر: توقف صحبت
  - کلیک روی X: خروج از حالت Talk

## رابط کاربری Android

- کلید زبانه Voice: **Talk**
- **Mic** دستی و **Talk** حالت‌های ضبط زمان‌اجرایی ناسازگار با هم هستند.
- Mic دستی و Talk بی‌درنگ، میکروفون هدست Bluetooth Classic یا BLE متصل را ترجیح می‌دهند. اگر قطع شود، برنامه ورودی هدست دیگری درخواست می‌کند یا اجازه می‌دهد Android از میکروفون پیش‌فرض استفاده کند؛ توقف ضبط ترجیح میکروفون پیش‌فرض را بازمی‌گرداند.
- Mic دستی وقتی برنامه از پیش‌زمینه خارج می‌شود یا کاربر زبانه Voice را ترک می‌کند، متوقف می‌شود.
- حالت Talk تا وقتی خاموش شود یا گره Android قطع شود به اجرا ادامه می‌دهد، و هنگام فعال بودن از نوع سرویس پیش‌زمینه میکروفون Android استفاده می‌کند.

## یادداشت‌ها

- به مجوزهای Speech + Microphone نیاز دارد.
- Talk بومی از نشست Gateway فعال استفاده می‌کند و فقط وقتی رویدادهای پاسخ در دسترس نباشند به polling تاریخچه بازمی‌گردد.
- Talk بی‌درنگ تحت مالکیت کلاینت برای `openclaw_agent_consult` به‌جای در معرض گذاشتن `chat.send` برای نشست‌های تحت مالکیت ارائه‌دهنده، از `talk.client.toolCall` استفاده می‌کند.
- Talk فقط رونویسی از `talk.session.create`، `talk.session.appendAudio`، `talk.session.cancelTurn`، و `talk.session.close` استفاده می‌کند؛ کلاینت‌ها برای به‌روزرسانی‌های جزئی/نهایی رونویسی در `talk.event` مشترک می‌شوند.
- gateway پخش Talk را از طریق `talk.speak` با استفاده از ارائه‌دهنده فعال Talk resolve می‌کند. Android فقط وقتی آن RPC در دسترس نباشد به TTS سیستم محلی بازمی‌گردد.
- پخش محلی MLX در macOS، وقتی حاضر باشد، از کمک‌برنامه بسته‌بندی‌شده `openclaw-mlx-tts` استفاده می‌کند، یا از یک فایل اجرایی روی `PATH`. در زمان توسعه، `OPENCLAW_MLX_TTS_BIN` را تنظیم کنید تا به یک باینری کمک‌برنامه سفارشی اشاره کند.
- `stability` برای `eleven_v3` به `0.0`، `0.5`، یا `1.0` اعتبارسنجی می‌شود؛ مدل‌های دیگر `0..1` را می‌پذیرند.
- `latency_tier` وقتی تنظیم شود به `0..4` اعتبارسنجی می‌شود.
- Android از قالب‌های خروجی `pcm_16000`، `pcm_22050`، `pcm_24000`، و `pcm_44100` برای جریان کم‌تأخیر AudioTrack پشتیبانی می‌کند.

## مرتبط

- [بیدارباش صوتی](/fa/nodes/voicewake)
- [صدا و یادداشت‌های صوتی](/fa/nodes/audio)
- [درک رسانه](/fa/nodes/media-understanding)
