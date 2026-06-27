---
read_when:
    - پیاده‌سازی حالت گفت‌وگو در macOS/iOS/Android
    - تغییر رفتار صدا/TTS/وقفه
summary: 'حالت گفت‌وگو: مکالمات گفتاری پیوسته از طریق STT/TTS محلی و صدای بلادرنگ'
title: حالت گفت‌وگو
x-i18n:
    generated_at: "2026-06-27T18:03:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47ae6c1abc763688ab5bbea1c23c9f4f27fe2f4b13cfade61917f5a1a912f057
    source_path: nodes/talk.md
    workflow: 16
---

حالت گفت‌وگو دو شکل اجرایی دارد:

- گفت‌وگوی بومی macOS/iOS/Android از تشخیص گفتار محلی، گفت‌وگوی Gateway و TTS با `talk.speak` استفاده می‌کند. گره‌ها قابلیت `talk` را اعلام می‌کنند و فرمان‌های `talk.*` پشتیبانی‌شده را مشخص می‌کنند.
- گفت‌وگوی مرورگر از `talk.client.create` برای نشست‌های `webrtc` و `provider-websocket` تحت مالکیت کلاینت، یا از `talk.session.create` برای نشست‌های `gateway-relay` تحت مالکیت Gateway استفاده می‌کند. `managed-room` برای واگذاری Gateway و اتاق‌های بی‌سیم‌مانند رزرو شده است.
- گفت‌وگوی Android می‌تواند با `talk.realtime.mode: "realtime"` و `talk.realtime.transport: "gateway-relay"` به نشست‌های رله بلادرنگ تحت مالکیت Gateway وارد شود. در غیر این صورت، روی تشخیص گفتار بومی، گفت‌وگوی Gateway و `talk.speak` باقی می‌ماند.
- کلاینت‌های فقط رونویسی از `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })` استفاده می‌کنند، سپس وقتی زیرنویس یا دیکته بدون پاسخ صوتی دستیار لازم دارند، `talk.session.appendAudio`، `talk.session.cancelTurn` و `talk.session.close` را به کار می‌برند.

گفت‌وگوی بومی یک حلقه مکالمه صوتی پیوسته است:

1. گوش دادن به گفتار
2. ارسال رونویس به مدل از طریق نشست فعال
3. انتظار برای پاسخ
4. پخش آن از طریق ارائه‌دهنده پیکربندی‌شده گفت‌وگو (`talk.speak`)

گفت‌وگوی بلادرنگ مرورگر فراخوانی‌های ابزار ارائه‌دهنده را از طریق `talk.client.toolCall` ارسال می‌کند؛ کلاینت‌های مرورگر برای مشورت‌های بلادرنگ مستقیما `chat.send` را فراخوانی نمی‌کنند.
تا وقتی یک مشورت بلادرنگ فعال است، کلاینت‌های گفت‌وگو می‌توانند از `talk.client.steer` یا
`talk.session.steer` برای طبقه‌بندی ورودی گفتاری به‌عنوان `status`، `steer`، `cancel` یا
`followup` استفاده کنند. هدایت پذیرفته‌شده در اجرای嵌 فعال صف می‌شود؛ هدایت ردشده
دلیلی ساختاریافته مانند `no_active_run`، `not_streaming` یا
`compacting` برمی‌گرداند.

گفت‌وگوی فقط رونویسی همان پاکت رویداد مشترک گفت‌وگو را مثل نشست‌های بلادرنگ و STT/TTS منتشر می‌کند، اما از `mode: "transcription"` و `brain: "none"` استفاده می‌کند. این حالت برای زیرنویس، دیکته و ضبط گفتار صرفا مشاهده‌ای است؛ یادداشت‌های صوتی بارگذاری‌شده تک‌مرحله‌ای همچنان از مسیر رسانه/صدا استفاده می‌کنند.

## رفتار (macOS)

- **پوشش همیشه‌روشن** وقتی حالت گفت‌وگو فعال است.
- گذارهای مرحله‌ای **گوش دادن ← فکر کردن ← صحبت کردن**.
- در یک **مکث کوتاه** (پنجره سکوت)، رونویس فعلی ارسال می‌شود.
- پاسخ‌ها **در WebChat نوشته می‌شوند** (همانند تایپ کردن).
- **وقفه با گفتار** (به‌صورت پیش‌فرض روشن): اگر کاربر هنگام صحبت کردن دستیار شروع به صحبت کند، پخش را متوقف می‌کنیم و مهرزمان وقفه را برای پرامپت بعدی ثبت می‌کنیم.

## دستورالعمل‌های صوتی در پاسخ‌ها

دستیار می‌تواند برای کنترل صدا، پاسخ خود را با یک **خط JSON تکی** آغاز کند:

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
- `speed`، `rate` (WPM)، `stability`، `similarity`، `style`، `speakerBoost`
- `seed`، `normalize`، `lang`، `output_format`، `latency_tier`
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
- `provider`: ارائه‌دهنده فعال گفت‌وگو را انتخاب می‌کند. برای مسیرهای پخش محلی macOS از `elevenlabs`، `mlx` یا `system` استفاده کنید.
- `providers.<provider>.voiceId`: برای ElevenLabs به `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` بازمی‌گردد (یا وقتی کلید API موجود است، به نخستین صدای ElevenLabs).
- `providers.elevenlabs.modelId`: وقتی تنظیم نشده باشد، به‌صورت پیش‌فرض `eleven_v3` است.
- `providers.mlx.modelId`: وقتی تنظیم نشده باشد، به‌صورت پیش‌فرض `mlx-community/Soprano-80M-bf16` است.
- `providers.elevenlabs.apiKey`: به `ELEVENLABS_API_KEY` بازمی‌گردد (یا اگر موجود باشد، به پروفایل شل Gateway).
- `consultThinkingLevel`: بازنویسی اختیاری سطح تفکر برای اجرای کامل عامل OpenClaw پشت فراخوانی‌های بلادرنگ `openclaw_agent_consult`.
- `consultFastMode`: بازنویسی اختیاری حالت سریع برای فراخوانی‌های بلادرنگ `openclaw_agent_consult`.
- `realtime.provider`: ارائه‌دهنده فعال صدای بلادرنگ مرورگر/سرور را انتخاب می‌کند. برای WebRTC از `openai`، برای WebSocket ارائه‌دهنده از `google`، یا برای رله Gateway از یک ارائه‌دهنده فقط-پل استفاده کنید.
- `realtime.providers.<provider>` پیکربندی بلادرنگ تحت مالکیت ارائه‌دهنده را ذخیره می‌کند. مرورگر فقط اعتبارنامه‌های نشست موقت یا محدودشده را دریافت می‌کند، هرگز کلید API استاندارد را.
- `realtime.providers.openai.voice`: شناسه صدای داخلی OpenAI Realtime. صداهای فعلی `gpt-realtime-2` عبارت‌اند از `alloy`، `ash`، `ballad`، `coral`، `echo`، `sage`، `shimmer`، `verse`، `marin` و `cedar`؛ `marin` و `cedar` برای بهترین کیفیت توصیه می‌شوند.
- `realtime.transport`: `webrtc` و `provider-websocket` انتقال‌های بلادرنگ مرورگر هستند. Android فقط وقتی این مقدار `gateway-relay` باشد از رله بلادرنگ استفاده می‌کند؛ در غیر این صورت گفت‌وگوی Android از حلقه بومی STT/TTS خود استفاده می‌کند.
- `realtime.brain`: `agent-consult` فراخوانی‌های ابزار بلادرنگ را از مسیر سیاست Gateway عبور می‌دهد؛ `direct-tools` رفتار سازگاری ابزار مستقیم قدیمی است؛ `none` برای رونویسی یا هماهنگ‌سازی بیرونی است.
- `realtime.consultRouting`: `provider-direct` پاسخ مستقیم ارائه‌دهنده را وقتی `openclaw_agent_consult` را رد می‌کند حفظ می‌کند؛ `force-agent-consult` باعث می‌شود رله Gateway رونویس‌های نهایی‌شده کاربر را به‌جای آن از طریق OpenClaw مسیریابی کند.
- `realtime.instructions`: دستورالعمل‌های سیستمی رو به ارائه‌دهنده را به پرامپت بلادرنگ داخلی OpenClaw اضافه می‌کند. از آن برای سبک و لحن صدا استفاده کنید؛ OpenClaw راهنمای پیش‌فرض `openclaw_agent_consult` را حفظ می‌کند.
- `talk.catalog` حالت‌های معتبر، انتقال‌ها، راهبردهای مغز، قالب‌های صوتی بلادرنگ و پرچم‌های قابلیت هر ارائه‌دهنده را ارائه می‌کند تا کلاینت‌های گفت‌وگوی فرست‌پارتی بتوانند از ترکیب‌های پشتیبانی‌نشده اجتناب کنند.
- ارائه‌دهندگان رونویسی جریانی از طریق `talk.catalog.transcription` کشف می‌شوند. رله فعلی Gateway تا وقتی سطح پیکربندی اختصاصی رونویسی گفت‌وگو اضافه شود، از پیکربندی ارائه‌دهنده جریان تماس صوتی استفاده می‌کند.
- `speechLocale`: شناسه محلی اختیاری BCP 47 برای تشخیص گفتار روی‌دستگاه در گفت‌وگوی iOS/macOS. برای استفاده از پیش‌فرض دستگاه، آن را تنظیم نکنید.
- `outputFormat`: روی macOS/iOS به‌صورت پیش‌فرض `pcm_44100` و روی Android به‌صورت پیش‌فرض `pcm_24000` است (برای اجبار جریان‌دهی MP3، `mp3_*` را تنظیم کنید)

## رابط کاربری macOS

- کلید نوار منو: **گفت‌وگو**
- زبانه پیکربندی: گروه **حالت گفت‌وگو** (شناسه صدا + کلید وقفه)
- پوشش:
  - **گوش دادن**: ابر با سطح میکروفون تپش می‌کند
  - **فکر کردن**: پویانمایی فرورفتن
  - **صحبت کردن**: حلقه‌های تابشی
  - کلیک روی ابر: توقف صحبت کردن
  - کلیک روی X: خروج از حالت گفت‌وگو

## رابط کاربری Android

- کلید زبانه صدا: **گفت‌وگو**
- **میکروفون** دستی و **گفت‌وگو** حالت‌های ضبط اجرایی ناسازگار با هم هستند.
- میکروفون دستی وقتی برنامه از پیش‌زمینه خارج شود یا کاربر زبانه صدا را ترک کند، متوقف می‌شود.
- حالت گفت‌وگو تا زمان خاموش شدن یا قطع اتصال گره Android به اجرا ادامه می‌دهد و هنگام فعال بودن از نوع سرویس پیش‌زمینه میکروفون Android استفاده می‌کند.

## نکات

- به مجوزهای گفتار + میکروفون نیاز دارد.
- گفت‌وگوی بومی از نشست فعال Gateway استفاده می‌کند و فقط وقتی رویدادهای پاسخ در دسترس نباشند، به نظرسنجی تاریخچه بازمی‌گردد.
- گفت‌وگوی بلادرنگ مرورگر به‌جای آشکار کردن `chat.send` برای نشست‌های مرورگر تحت مالکیت ارائه‌دهنده، از `talk.client.toolCall` برای `openclaw_agent_consult` استفاده می‌کند.
- گفت‌وگوی فقط رونویسی از `talk.session.create`، `talk.session.appendAudio`، `talk.session.cancelTurn` و `talk.session.close` استفاده می‌کند؛ کلاینت‌ها برای به‌روزرسانی‌های رونویس جزئی/نهایی در `talk.event` مشترک می‌شوند.
- Gateway پخش گفت‌وگو را از طریق `talk.speak` و با استفاده از ارائه‌دهنده فعال گفت‌وگو حل می‌کند. Android فقط وقتی آن RPC در دسترس نباشد، به TTS سامانه محلی بازمی‌گردد.
- پخش محلی MLX در macOS هنگام وجود از کمک‌کننده همراه `openclaw-mlx-tts` استفاده می‌کند، یا از یک فایل اجرایی روی `PATH`. در زمان توسعه، `OPENCLAW_MLX_TTS_BIN` را طوری تنظیم کنید که به باینری کمک‌کننده سفارشی اشاره کند.
- `stability` برای `eleven_v3` به `0.0`، `0.5` یا `1.0` اعتبارسنجی می‌شود؛ مدل‌های دیگر `0..1` را می‌پذیرند.
- `latency_tier` وقتی تنظیم شده باشد، به `0..4` اعتبارسنجی می‌شود.
- Android از قالب‌های خروجی `pcm_16000`، `pcm_22050`، `pcm_24000` و `pcm_44100` برای جریان‌دهی کم‌تاخیر AudioTrack پشتیبانی می‌کند.

## مرتبط

- [بیدارباش صوتی](/fa/nodes/voicewake)
- [صدا و یادداشت‌های صوتی](/fa/nodes/audio)
- [درک رسانه](/fa/nodes/media-understanding)
