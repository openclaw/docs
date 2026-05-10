---
read_when:
    - پیاده‌سازی حالت گفت‌وگو در macOS/iOS/Android
    - تغییر رفتار صدا/TTS/وقفه
summary: 'حالت گفت‌وگو: مکالمه‌های گفتاری پیوسته در STT/TTS محلی و صدای بلادرنگ'
title: حالت گفتگو
x-i18n:
    generated_at: "2026-05-10T19:50:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 28e5feae8af8ff89472dfb73c44c590b2f7fab3c0ca335b67603c7fd9d50dfe7
    source_path: nodes/talk.md
    workflow: 16
---

حالت Talk دو شکل اجرایی دارد:

- Talk بومی macOS/iOS/Android از تشخیص گفتار محلی، گفت‌وگوی Gateway و TTS با `talk.speak` استفاده می‌کند. Nodeها قابلیت `talk` را اعلام می‌کنند و فرمان‌های `talk.*` پشتیبانی‌شده را مشخص می‌کنند.
- Talk مرورگر از `talk.client.create` برای نشست‌های `webrtc` و `provider-websocket` تحت مالکیت کلاینت، یا از `talk.session.create` برای نشست‌های `gateway-relay` تحت مالکیت Gateway استفاده می‌کند. `managed-room` برای تحویل به Gateway و اتاق‌های واکی‌تاکی رزرو شده است.
- کلاینت‌های فقط رونویسی از `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })` و سپس در صورت نیاز به زیرنویس یا دیکته بدون پاسخ صوتی دستیار، از `talk.session.appendAudio`، `talk.session.cancelTurn` و `talk.session.close` استفاده می‌کنند.

Talk بومی یک حلقه گفت‌وگوی صوتی پیوسته است:

1. گوش دادن به گفتار
2. ارسال رونویسی به مدل از طریق نشست فعال
3. انتظار برای پاسخ
4. پخش آن از طریق ارائه‌دهنده Talk پیکربندی‌شده (`talk.speak`)

Talk بلادرنگ مرورگر فراخوانی‌های ابزار ارائه‌دهنده را از طریق `talk.client.toolCall` عبور می‌دهد؛ کلاینت‌های مرورگر برای مشاوره‌های بلادرنگ مستقیما `chat.send` را فراخوانی نمی‌کنند.

Talk فقط رونویسی همان پوشش رویداد مشترک Talk را مانند نشست‌های بلادرنگ و STT/TTS منتشر می‌کند، اما از `mode: "transcription"` و `brain: "none"` استفاده می‌کند. این حالت برای زیرنویس، دیکته و ضبط گفتار فقط‌مشاهده است؛ یادداشت‌های صوتی بارگذاری‌شده تک‌مرحله‌ای همچنان از مسیر رسانه/صوت استفاده می‌کنند.

## رفتار (macOS)

- **همپوشان همیشه‌روشن** تا زمانی که حالت Talk فعال است.
- گذارهای مرحله‌ای **در حال گوش دادن → در حال فکر کردن → در حال صحبت کردن**.
- در یک **مکث کوتاه** (پنجره سکوت)، رونویسی فعلی ارسال می‌شود.
- پاسخ‌ها **در WebChat نوشته می‌شوند** (همانند تایپ کردن).
- **وقفه هنگام گفتار** (به‌صورت پیش‌فرض روشن): اگر کاربر هنگام صحبت کردن دستیار شروع به صحبت کند، پخش را متوقف می‌کنیم و زمان وقفه را برای اعلان بعدی ثبت می‌کنیم.

## دستورهای صوتی در پاسخ‌ها

دستیار می‌تواند برای کنترل صدا، پاسخ خود را با یک **خط JSON تکی** آغاز کند:

```json
{ "voice": "<voice-id>", "once": true }
```

قواعد:

- فقط نخستین خط غیرخالی.
- کلیدهای ناشناخته نادیده گرفته می‌شوند.
- `once: true` فقط برای پاسخ فعلی اعمال می‌شود.
- بدون `once`، صدا به پیش‌فرض جدید حالت Talk تبدیل می‌شود.
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
- `silenceTimeoutMs`: وقتی تنظیم نشده باشد، Talk پیش از ارسال رونویسی، پنجره مکث پیش‌فرض پلتفرم را نگه می‌دارد (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: ارائه‌دهنده فعال Talk را انتخاب می‌کند. برای مسیرهای پخش محلی macOS از `elevenlabs`، `mlx` یا `system` استفاده کنید.
- `providers.<provider>.voiceId`: برای ElevenLabs به `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` برمی‌گردد (یا اگر کلید API در دسترس باشد، به نخستین صدای ElevenLabs).
- `providers.elevenlabs.modelId`: وقتی تنظیم نشده باشد به‌صورت پیش‌فرض `eleven_v3` است.
- `providers.mlx.modelId`: وقتی تنظیم نشده باشد به‌صورت پیش‌فرض `mlx-community/Soprano-80M-bf16` است.
- `providers.elevenlabs.apiKey`: به `ELEVENLABS_API_KEY` برمی‌گردد (یا در صورت دسترس بودن، پروفایل شل Gateway).
- `consultThinkingLevel`: بازنویسی اختیاری سطح فکر برای اجرای کامل عامل OpenClaw پشت فراخوانی‌های بلادرنگ `openclaw_agent_consult`.
- `consultFastMode`: بازنویسی اختیاری حالت سریع برای فراخوانی‌های بلادرنگ `openclaw_agent_consult`.
- `realtime.provider`: ارائه‌دهنده صدای بلادرنگ فعال مرورگر/سرور را انتخاب می‌کند. از `openai` برای WebRTC، از `google` برای WebSocket ارائه‌دهنده، یا از یک ارائه‌دهنده فقط‌پل از طریق رله Gateway استفاده کنید.
- `realtime.providers.<provider>` پیکربندی بلادرنگ تحت مالکیت ارائه‌دهنده را ذخیره می‌کند. مرورگر فقط اعتبارنامه‌های نشست موقت یا محدودشده را دریافت می‌کند، هرگز یک کلید API استاندارد را دریافت نمی‌کند.
- `realtime.providers.openai.voice`: شناسه صدای بلادرنگ داخلی OpenAI. صداهای فعلی `gpt-realtime-2` عبارت‌اند از `alloy`، `ash`، `ballad`، `coral`، `echo`، `sage`، `shimmer`، `verse`، `marin` و `cedar`؛ برای بهترین کیفیت، `marin` و `cedar` توصیه می‌شوند.
- `realtime.brain`: `agent-consult` فراخوانی‌های ابزار بلادرنگ را از طریق سیاست Gateway مسیریابی می‌کند؛ `direct-tools` رفتار سازگاری فقط‌مالک است؛ `none` برای رونویسی یا ارکستراسیون خارجی است.
- `realtime.instructions`: دستورهای سیستمی روبه‌روی ارائه‌دهنده را به اعلان بلادرنگ داخلی OpenClaw اضافه می‌کند. از آن برای سبک و لحن صدا استفاده کنید؛ OpenClaw راهنمای پیش‌فرض `openclaw_agent_consult` را حفظ می‌کند.
- `talk.catalog` حالت‌های معتبر، انتقال‌ها، راهبردهای brain، قالب‌های صوتی بلادرنگ و پرچم‌های قابلیت هر ارائه‌دهنده را نمایش می‌دهد تا کلاینت‌های Talk فرست‌پارتی بتوانند از ترکیب‌های پشتیبانی‌نشده پرهیز کنند.
- ارائه‌دهندگان رونویسی جریانی از طریق `talk.catalog.transcription` کشف می‌شوند. رله Gateway فعلی تا زمان افزوده شدن سطح پیکربندی اختصاصی رونویسی Talk، از پیکربندی ارائه‌دهنده جریانی Voice Call استفاده می‌کند.
- `speechLocale`: شناسه محلی اختیاری BCP 47 برای تشخیص گفتار روی‌دستگاه Talk در iOS/macOS. برای استفاده از پیش‌فرض دستگاه، آن را تنظیم‌نشده بگذارید.
- `outputFormat`: در macOS/iOS به‌صورت پیش‌فرض `pcm_44100` و در Android به‌صورت پیش‌فرض `pcm_24000` است (برای اجبار به پخش جریانی MP3، `mp3_*` را تنظیم کنید)

## رابط کاربری macOS

- کلید نوار منو: **Talk**
- زبانه پیکربندی: گروه **حالت Talk** (شناسه صدا + کلید وقفه)
- همپوشان:
  - **در حال گوش دادن**: ابر با سطح میکروفون تپش می‌کند
  - **در حال فکر کردن**: پویانمایی فرورونده
  - **در حال صحبت کردن**: حلقه‌های تابشی
  - کلیک روی ابر: توقف صحبت
  - کلیک روی X: خروج از حالت Talk

## رابط کاربری Android

- کلید زبانه صوت: **Talk**
- **Mic** دستی و **Talk** حالت‌های ضبط اجرایی ناسازگار با هم هستند.
- Mic دستی وقتی برنامه از پیش‌زمینه خارج شود یا کاربر زبانه Voice را ترک کند متوقف می‌شود.
- حالت Talk تا زمانی که خاموش شود یا Node اندروید قطع شود به اجرا ادامه می‌دهد و هنگام فعال بودن از نوع سرویس پیش‌زمینه میکروفون Android استفاده می‌کند.

## نکته‌ها

- به مجوزهای Speech + Microphone نیاز دارد.
- Talk بومی از نشست Gateway فعال استفاده می‌کند و فقط وقتی رویدادهای پاسخ در دسترس نباشند به نظرسنجی تاریخچه برمی‌گردد.
- Talk بلادرنگ مرورگر برای `openclaw_agent_consult` از `talk.client.toolCall` استفاده می‌کند، نه اینکه `chat.send` را در معرض نشست‌های مرورگر تحت مالکیت ارائه‌دهنده قرار دهد.
- Talk فقط رونویسی از `talk.session.create`، `talk.session.appendAudio`، `talk.session.cancelTurn` و `talk.session.close` استفاده می‌کند؛ کلاینت‌ها برای به‌روزرسانی‌های رونویسی جزئی/نهایی در `talk.event` مشترک می‌شوند.
- Gateway پخش Talk را با استفاده از ارائه‌دهنده فعال Talk از طریق `talk.speak` حل می‌کند. Android فقط وقتی آن RPC در دسترس نباشد به TTS محلی سیستم برمی‌گردد.
- پخش محلی MLX در macOS وقتی راهنمای همراه `openclaw-mlx-tts` حاضر باشد از آن، وگرنه از یک فایل اجرایی روی `PATH` استفاده می‌کند. در زمان توسعه، `OPENCLAW_MLX_TTS_BIN` را تنظیم کنید تا به یک باینری راهنمای سفارشی اشاره کند.
- `stability` برای `eleven_v3` به `0.0`، `0.5` یا `1.0` اعتبارسنجی می‌شود؛ مدل‌های دیگر `0..1` را می‌پذیرند.
- `latency_tier` وقتی تنظیم شده باشد به `0..4` اعتبارسنجی می‌شود.
- Android از قالب‌های خروجی `pcm_16000`، `pcm_22050`، `pcm_24000` و `pcm_44100` برای پخش جریانی کم‌تاخیر AudioTrack پشتیبانی می‌کند.

## مرتبط

- [بیدارباش صوتی](/fa/nodes/voicewake)
- [یادداشت‌های صوتی و صدا](/fa/nodes/audio)
- [درک رسانه](/fa/nodes/media-understanding)
