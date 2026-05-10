---
read_when:
    - می‌خواهید فهرست کاملی از آنچه OpenClaw پشتیبانی می‌کند داشته باشید
summary: قابلیت‌های OpenClaw در حوزه‌های کانال‌ها، مسیریابی، رسانه و تجربهٔ کاربری.
title: ویژگی‌ها
x-i18n:
    generated_at: "2026-05-10T19:35:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb2e4973ad7f986034e125cd84d9d3f8542ea4821bde28fce2df3fb78c06c34f
    source_path: concepts/features.md
    workflow: 16
---

## نکات برجسته

<Columns>
  <Card title="کانال‌ها" icon="message-square" href="/fa/channels">
    Discord، iMessage، Signal، Slack، Telegram، WhatsApp، WebChat و موارد بیشتر با یک Gateway واحد.
  </Card>
  <Card title="Plugin‌ها" icon="plug" href="/fa/tools/plugin">
    Plugin‌های همراه، Matrix، Nextcloud Talk، Nostr، Twitch، Zalo و موارد بیشتری را بدون نصب جداگانه در نسخه‌های فعلی معمول اضافه می‌کنند.
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
  <Card title="گره‌های موبایل" icon="smartphone" href="/fa/nodes">
    گره‌های iOS و Android با جفت‌سازی، صدا/چت، و فرمان‌های غنی دستگاه.
  </Card>
</Columns>

## فهرست کامل

**کانال‌ها:**

- کانال‌های داخلی شامل Discord، Google Chat، iMessage، IRC، Signal، Slack، Telegram، WebChat و WhatsApp هستند
- کانال‌های Plugin همراه شامل Feishu، LINE، Matrix، Mattermost، Microsoft Teams، Nextcloud Talk، Nostr، QQ Bot، Synology Chat، Tlon، Twitch، Zalo و Zalo Personal هستند
- Plugin‌های کانال اختیاری که جداگانه نصب می‌شوند شامل Voice Call و بسته‌های شخص ثالث مانند WeChat هستند
- Plugin‌های کانال شخص ثالث می‌توانند Gateway را بیشتر گسترش دهند، مانند WeChat
- پشتیبانی از چت گروهی با فعال‌سازی مبتنی بر منشن
- ایمنی پیام مستقیم با فهرست‌های مجاز و جفت‌سازی

**عامل:**

- زمان اجرای عامل تعبیه‌شده با استریم ابزار
- مسیریابی چندعاملی با نشست‌های ایزوله برای هر فضای کاری یا فرستنده
- نشست‌ها: چت‌های مستقیم در `main` مشترک ادغام می‌شوند؛ گروه‌ها ایزوله هستند
- استریم و قطعه‌بندی برای پاسخ‌های طولانی

**احراز هویت و ارائه‌دهندگان:**

- بیش از ۳۵ ارائه‌دهنده مدل (Anthropic، OpenAI، Google و موارد بیشتر)
- احراز هویت اشتراکی از طریق OAuth (مثلاً OpenAI Codex)
- پشتیبانی از ارائه‌دهندگان سفارشی و خودمیزبان (vLLM، SGLang، Ollama، و هر نقطه پایانی سازگار با OpenAI یا سازگار با Anthropic)

**رسانه:**

- تصویر، صدا، ویدئو و سند در ورودی و خروجی
- سطوح قابلیت مشترک برای تولید تصویر و تولید ویدئو
- رونویسی یادداشت صوتی
- تبدیل متن به گفتار با چندین ارائه‌دهنده

**برنامه‌ها و رابط‌ها:**

- WebChat و UI کنترل مرورگر
- برنامه همراه نوار منوی macOS
- گره iOS با جفت‌سازی، Canvas، دوربین، ضبط صفحه، موقعیت مکانی و صدا
- گره Android با جفت‌سازی، چت، صدا، Canvas، دوربین و فرمان‌های دستگاه

**ابزارها و خودکارسازی:**

- خودکارسازی مرورگر، اجرا، سندباکسینگ
- جست‌وجوی وب (Brave، DuckDuckGo، Exa، Firecrawl، Gemini، Grok، Kimi، MiniMax Search، Ollama Web Search، Perplexity، SearXNG، Tavily)
- کارهای Cron و زمان‌بندی Heartbeat
- Skills، Plugin‌ها و خطوط لوله گردش کار (Lobster)

## مرتبط

<CardGroup cols={2}>
  <Card title="ویژگی‌های آزمایشی" href="/fa/concepts/experimental-features" icon="flask">
    ویژگی‌های انتخابی که هنوز به سطح پیش‌فرض عرضه نشده‌اند.
  </Card>
  <Card title="زمان اجرای عامل" href="/fa/concepts/agent" icon="robot">
    مدل زمان اجرای عامل و نحوه ارسال اجراها.
  </Card>
  <Card title="کانال‌ها" href="/fa/channels" icon="message-square">
    Telegram، WhatsApp، Discord، Slack و موارد بیشتر را از یک Gateway متصل کنید.
  </Card>
  <Card title="Plugin‌ها" href="/fa/tools/plugin" icon="plug">
    Plugin‌های همراه و شخص ثالث که OpenClaw را گسترش می‌دهند.
  </Card>
</CardGroup>
