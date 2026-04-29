---
read_when:
    - شما فهرست کاملی از مواردی را می‌خواهید که OpenClaw از آن‌ها پشتیبانی می‌کند
summary: قابلیت‌های OpenClaw در کانال‌ها، مسیریابی، رسانه و تجربه کاربری.
title: ویژگی‌ها
x-i18n:
    generated_at: "2026-04-29T22:42:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: b188d786b06e1a51d42130242e8bef6290a728783f24b2fbce513bf4d6c9ec23
    source_path: concepts/features.md
    workflow: 16
---

## نکات برجسته

<Columns>
  <Card title="کانال‌ها" icon="message-square" href="/fa/channels">
    Discord، iMessage، Signal، Slack، Telegram، WhatsApp، WebChat و موارد بیشتر با یک Gateway واحد.
  </Card>
  <Card title="Pluginها" icon="plug" href="/fa/tools/plugin">
    Pluginهای همراه، Matrix، Nextcloud Talk، Nostr، Twitch، Zalo و موارد بیشتر را بدون نصب جداگانه در نسخه‌های رایج فعلی اضافه می‌کنند.
  </Card>
  <Card title="مسیریابی" icon="route" href="/fa/concepts/multi-agent">
    مسیریابی چندعاملی با نشست‌های ایزوله.
  </Card>
  <Card title="رسانه" icon="image" href="/fa/nodes/images">
    تصویر، صدا، ویدئو، سند، و تولید تصویر/ویدئو.
  </Card>
  <Card title="برنامه‌ها و UI" icon="monitor" href="/fa/web/control-ui">
    UI کنترل وب و برنامه همراه macOS.
  </Card>
  <Card title="Nodeهای موبایل" icon="smartphone" href="/fa/nodes">
    Nodeهای iOS و Android با جفت‌سازی، صوت/چت، و فرمان‌های غنی دستگاه.
  </Card>
</Columns>

## فهرست کامل

**کانال‌ها:**

- کانال‌های داخلی شامل Discord، Google Chat، iMessage (قدیمی)، IRC، Signal، Slack، Telegram، WebChat، و WhatsApp هستند
- کانال‌های Plugin همراه شامل BlueBubbles برای iMessage، Feishu، LINE، Matrix، Mattermost، Microsoft Teams، Nextcloud Talk، Nostr، QQ Bot، Synology Chat، Tlon، Twitch، Zalo، و Zalo Personal هستند
- Pluginهای کانال اختیاری که جداگانه نصب می‌شوند شامل Voice Call و بسته‌های شخص ثالث مانند WeChat هستند
- Pluginهای کانال شخص ثالث می‌توانند Gateway را بیشتر گسترش دهند، مانند WeChat
- پشتیبانی از چت گروهی با فعال‌سازی مبتنی بر اشاره
- ایمنی DM با فهرست‌های مجاز و جفت‌سازی

**عامل:**

- زمان اجرای عامل تعبیه‌شده با استریم‌کردن ابزار
- مسیریابی چندعاملی با نشست‌های ایزوله برای هر فضای کاری یا فرستنده
- نشست‌ها: چت‌های مستقیم در `main` مشترک ادغام می‌شوند؛ گروه‌ها ایزوله هستند
- استریم‌کردن و قطعه‌بندی برای پاسخ‌های طولانی

**احراز هویت و ارائه‌دهندگان:**

- بیش از ۳۵ ارائه‌دهنده مدل (Anthropic، OpenAI، Google، و موارد بیشتر)
- احراز هویت اشتراکی از طریق OAuth (مثلاً OpenAI Codex)
- پشتیبانی از ارائه‌دهنده سفارشی و خودمیزبان (vLLM، SGLang، Ollama، و هر نقطه پایانی سازگار با OpenAI یا سازگار با Anthropic)

**رسانه:**

- ورود و خروج تصویر، صدا، ویدئو، و سند
- سطوح قابلیت مشترک برای تولید تصویر و تولید ویدئو
- رونویسی یادداشت صوتی
- تبدیل متن به گفتار با چندین ارائه‌دهنده

**برنامه‌ها و رابط‌ها:**

- WebChat و UI کنترل مرورگر
- برنامه همراه نوار منوی macOS
- Node iOS با جفت‌سازی، Canvas، دوربین، ضبط صفحه، موقعیت مکانی، و صدا
- Node Android با جفت‌سازی، چت، صدا، Canvas، دوربین، و فرمان‌های دستگاه

**ابزارها و خودکارسازی:**

- خودکارسازی مرورگر، exec، sandboxing
- جستجوی وب (Brave، DuckDuckGo، Exa، Firecrawl، Gemini، Grok، Kimi، MiniMax Search، Ollama Web Search، Perplexity، SearXNG، Tavily)
- کارهای Cron و زمان‌بندی Heartbeat
- Skills، Pluginها، و پایپ‌لاین‌های گردش‌کار (Lobster)

## مرتبط

- [ویژگی‌های آزمایشی](/fa/concepts/experimental-features)
- [زمان اجرای عامل](/fa/concepts/agent)
