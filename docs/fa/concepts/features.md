---
read_when:
    - شما فهرست کاملی از مواردی می‌خواهید که OpenClaw پشتیبانی می‌کند
summary: قابلیت‌های OpenClaw در کانال‌ها، مسیریابی، رسانه و تجربه کاربری.
title: ویژگی‌ها
x-i18n:
    generated_at: "2026-05-06T09:10:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: d46085b326dd1e5f0d5531bdf8d7d84ac8c22b7fb4637b7183be2bd9d556c500
    source_path: concepts/features.md
    workflow: 16
---

## نکات برجسته

<Columns>
  <Card title="کانال‌ها" icon="message-square" href="/fa/channels">
    Discord، iMessage، Signal، Slack، Telegram، WhatsApp، WebChat و موارد بیشتر با یک Gateway واحد.
  </Card>
  <Card title="Pluginها" icon="plug" href="/fa/tools/plugin">
    Pluginهای همراه، Matrix، Nextcloud Talk، Nostr، Twitch، Zalo و موارد بیشتری را بدون نصب جداگانه در نسخه‌های جاری معمول اضافه می‌کنند.
  </Card>
  <Card title="مسیریابی" icon="route" href="/fa/concepts/multi-agent">
    مسیریابی چندعامله با نشست‌های ایزوله.
  </Card>
  <Card title="رسانه" icon="image" href="/fa/nodes/images">
    تصویرها، صدا، ویدیو، سندها، و تولید تصویر/ویدیو.
  </Card>
  <Card title="برنامه‌ها و UI" icon="monitor" href="/fa/web/control-ui">
    UI کنترل وب و برنامه همراه macOS.
  </Card>
  <Card title="Nodeهای موبایل" icon="smartphone" href="/fa/nodes">
    Nodeهای iOS و Android با جفت‌سازی، صدا/چت، و فرمان‌های غنی دستگاه.
  </Card>
</Columns>

## فهرست کامل

**کانال‌ها:**

- کانال‌های داخلی شامل Discord، Google Chat، iMessage (قدیمی)، IRC، Signal، Slack، Telegram، WebChat و WhatsApp هستند
- کانال‌های Plugin همراه شامل BlueBubbles برای iMessage، Feishu، LINE، Matrix، Mattermost، Microsoft Teams، Nextcloud Talk، Nostr، QQ Bot، Synology Chat، Tlon، Twitch، Zalo و Zalo Personal هستند
- Pluginهای کانال اختیاری که جداگانه نصب می‌شوند شامل Voice Call و بسته‌های شخص ثالث مانند WeChat هستند
- Pluginهای کانال شخص ثالث می‌توانند Gateway را بیشتر گسترش دهند، مانند WeChat
- پشتیبانی از چت گروهی با فعال‌سازی مبتنی بر منشن
- ایمنی DM با فهرست‌های مجاز و جفت‌سازی

**عامل:**

- زمان‌اجرای عامل تعبیه‌شده با جریان‌دهی ابزار
- مسیریابی چندعامله با نشست‌های ایزوله برای هر فضای کاری یا فرستنده
- نشست‌ها: چت‌های مستقیم در `main` مشترک جمع می‌شوند؛ گروه‌ها ایزوله هستند
- جریان‌دهی و قطعه‌بندی برای پاسخ‌های طولانی

**احراز هویت و ارائه‌دهنده‌ها:**

- بیش از ۳۵ ارائه‌دهنده مدل (Anthropic، OpenAI، Google و موارد بیشتر)
- احراز هویت اشتراکی از طریق OAuth (مثلاً OpenAI Codex)
- پشتیبانی از ارائه‌دهنده‌های سفارشی و خودمیزبان (vLLM، SGLang، Ollama، و هر نقطه پایانی سازگار با OpenAI یا سازگار با Anthropic)

**رسانه:**

- ورود و خروج تصویرها، صدا، ویدیو و سندها
- سطح‌های قابلیت مشترک تولید تصویر و تولید ویدیو
- رونویسی یادداشت صوتی
- تبدیل متن به گفتار با چند ارائه‌دهنده

**برنامه‌ها و رابط‌ها:**

- WebChat و UI کنترل مرورگر
- برنامه همراه نوار منوی macOS
- Node iOS با جفت‌سازی، Canvas، دوربین، ضبط صفحه، مکان و صدا
- Node Android با جفت‌سازی، چت، صدا، Canvas، دوربین و فرمان‌های دستگاه

**ابزارها و اتوماسیون:**

- اتوماسیون مرورگر، exec، sandboxing
- جست‌وجوی وب (Brave، DuckDuckGo، Exa، Firecrawl، Gemini، Grok، Kimi، MiniMax Search، Ollama Web Search، Perplexity، SearXNG، Tavily)
- کارهای Cron و زمان‌بندی Heartbeat
- Skills، Pluginها و خط لوله‌های گردش کار (Lobster)

## مرتبط

<CardGroup cols={2}>
  <Card title="قابلیت‌های آزمایشی" href="/fa/concepts/experimental-features" icon="flask">
    قابلیت‌های انتخابی که هنوز به سطح پیش‌فرض عرضه نشده‌اند.
  </Card>
  <Card title="زمان‌اجرای عامل" href="/fa/concepts/agent" icon="robot">
    مدل زمان‌اجرای عامل و نحوه اعزام اجراها.
  </Card>
  <Card title="کانال‌ها" href="/fa/channels" icon="message-square">
    Telegram، WhatsApp، Discord، Slack و موارد بیشتر را از یک Gateway وصل کنید.
  </Card>
  <Card title="Pluginها" href="/fa/tools/plugin" icon="plug">
    Pluginهای همراه و شخص ثالث که OpenClaw را گسترش می‌دهند.
  </Card>
</CardGroup>
