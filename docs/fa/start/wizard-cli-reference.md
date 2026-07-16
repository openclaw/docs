---
read_when:
    - برای یک مرحلهٔ مشخص از `openclaw onboard` به رفتار دقیق نیاز دارید
    - در حال اشکال‌زدایی نتایج راه‌اندازی اولیه یا یکپارچه‌سازی کلاینت‌های راه‌اندازی اولیه هستید
sidebarTitle: CLI reference
summary: 'رفتار گام‌به‌گام `openclaw onboard`: کارکرد هر گام، پیکربندی‌ای که می‌نویسد و سازوکارهای داخلی'
title: مرجع راه‌اندازی CLI
x-i18n:
    generated_at: "2026-07-16T17:28:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 96c1469c6b64f08fd9105c8b737df164d39d27d051bbb9bb4f76b9e1e057785d
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

این صفحه رفتار، خروجی‌ها و سازوکارهای داخلی راه‌اندازی اولیه را به‌صورت گام‌به‌گام پوشش می‌دهد.
برای راهنمای مرحله‌به‌مرحله، به [راه‌اندازی اولیه (CLI)](/fa/start/wizard) مراجعه کنید. برای مرجع کامل پرچم‌های CLI
(همهٔ `--flag`، نمونه‌های غیرتعاملی، فرمان‌های مختص ارائه‌دهنده)،
به [`openclaw onboard`](/fa/cli/onboard) مراجعه کنید.

## ویزارد چه کاری انجام می‌دهد

حالت محلی (پیش‌فرض) شما را در مراحل زیر راهنمایی می‌کند:

- راه‌اندازی مدل و احراز هویت (Anthropic، OAuth اشتراک OpenAI Code، xAI، OpenCode، نقاط پایانی سفارشی و دیگر جریان‌های احراز هویت متعلق به ارائه‌دهندگان)
- مکان فضای کاری و فایل‌های راه‌اندازی اولیه
- تنظیمات Gateway (درگاه، اتصال، احراز هویت، Tailscale)
- کانال‌ها و ارائه‌دهندگان (Discord، Feishu، Google Chat، iMessage، Mattermost، Microsoft Teams، QQ Bot، Signal، Slack، Telegram، WhatsApp و دیگر کانال‌های همراه یا Plugin)
- ارائه‌دهندهٔ جست‌وجوی وب (اختیاری)
- نصب سرویس پس‌زمینه (LaunchAgent، واحد کاربری systemd یا Windows Scheduled Task بومی با بازگشت به پوشهٔ Startup)
- بررسی سلامت
- راه‌اندازی Skills

حالت راه‌دور این دستگاه را برای اتصال به یک Gateway در مکانی دیگر پیکربندی می‌کند. این حالت
هیچ‌چیز را روی میزبان راه‌دور نصب یا تغییر نمی‌دهد.

## جزئیات جریان محلی

<Steps>
  <Step title="تشخیص پیکربندی موجود">
    - اگر `~/.openclaw/openclaw.json` وجود دارد، **حفظ مقادیر فعلی**، **بازبینی و به‌روزرسانی** یا **بازنشانی پیش از راه‌اندازی** را انتخاب کنید.
    - اجرای مجدد ویزارد چیزی را پاک نمی‌کند، مگر اینکه صریحاً بازنشانی را انتخاب کنید (یا `--reset` را ارسال کنید).
    - `--reset` در CLI به‌طور پیش‌فرض روی `config+creds+sessions` است؛ برای حذف فضای کاری نیز از `--reset-scope full` استفاده کنید.
    - اگر پیکربندی نامعتبر باشد یا کلیدهای قدیمی داشته باشد، ویزارد متوقف می‌شود و از شما می‌خواهد پیش از ادامه `openclaw doctor` را اجرا کنید.
    - بازنشانی، وضعیت را به سطل زباله منتقل می‌کند (هرگز مستقیماً حذف نمی‌کند) و محدوده‌های زیر را ارائه می‌دهد:
      - فقط پیکربندی
      - پیکربندی + اعتبارنامه‌ها + نشست‌ها
      - بازنشانی کامل (فضای کاری را نیز حذف می‌کند)

  </Step>
  <Step title="مدل و احراز هویت">
    - ماتریس کامل گزینه‌ها در [گزینه‌های احراز هویت و مدل](#auth-and-model-options) آمده است.

  </Step>
  <Step title="فضای کاری">
    - پیش‌فرض `~/.openclaw/workspace` است (قابل پیکربندی).
    - فایل‌های فضای کاری موردنیاز برای راه‌اندازی اولیه در نخستین اجرا را ایجاد می‌کند.
    - چیدمان فضای کاری: [فضای کاری عامل](/fa/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - درگاه، اتصال، حالت احراز هویت و نحوهٔ دسترسی از طریق Tailscale را درخواست می‌کند.
    - توصیه می‌شود احراز هویت با توکن را حتی برای loopback فعال نگه دارید تا کلاینت‌های محلی WS ملزم به احراز هویت باشند.
    - در حالت توکن، راه‌اندازی تعاملی گزینه‌های زیر را ارائه می‌دهد:
      - **تولید/ذخیرهٔ توکن متن ساده** (پیش‌فرض)
      - **استفاده از SecretRef** (انتخابی)
    - در حالت گذرواژه، راه‌اندازی تعاملی از ذخیره‌سازی متن ساده یا SecretRef نیز پشتیبانی می‌کند.
    - مسیر SecretRef توکن در حالت غیرتعاملی: `--gateway-token-ref-env <ENV_VAR>`.
      - به یک متغیر محیطی غیرخالی در محیط فرایند راه‌اندازی اولیه نیاز دارد.
      - نمی‌توان آن را با `--gateway-token` ترکیب کرد.
    - احراز هویت را فقط زمانی غیرفعال کنید که به همهٔ فرایندهای محلی کاملاً اعتماد دارید.
    - اتصال‌های غیر-loopback همچنان به احراز هویت نیاز دارند.

  </Step>
  <Step title="کانال‌ها">
    - [WhatsApp](/fa/channels/whatsapp): ورود اختیاری با کد QR
    - [Telegram](/fa/channels/telegram): توکن بات
    - [Discord](/fa/channels/discord): توکن بات
    - [Google Chat](/fa/channels/googlechat): JSON حساب سرویس + مخاطب Webhook
    - [Mattermost](/fa/channels/mattermost): توکن بات + URL پایه
    - [Signal](/fa/channels/signal): نصب اختیاری `signal-cli` + پیکربندی حساب
    - [iMessage](/fa/channels/imessage): مسیر CLI مربوط به `imsg` + دسترسی به پایگاه دادهٔ Messages؛ وقتی Gateway خارج از Mac اجرا می‌شود، از یک پوشش SSH استفاده کنید
    - امنیت پیام خصوصی: حالت پیش‌فرض جفت‌سازی است. نخستین پیام خصوصی یک کد ارسال می‌کند؛ آن را از طریق
      `openclaw pairing approve <channel> <code>` تأیید کنید یا از فهرست‌های مجاز استفاده کنید.
  </Step>
  <Step title="جست‌وجوی وب">
    - یک ارائه‌دهنده (Brave، DuckDuckGo، Exa، Firecrawl، Gemini، Grok، Kimi، MiniMax Search، Ollama Web Search، Perplexity، SearXNG، Tavily) را انتخاب کنید یا از این مرحله بگذرید.
    - با `--skip-search` از این مرحله بگذرید؛ بعداً با `openclaw configure --section web` دوباره آن را پیکربندی کنید.

  </Step>
  <Step title="نصب سرویس پس‌زمینه">
    - macOS: LaunchAgent
      - به نشست فعال کاربر نیاز دارد؛ برای حالت بدون رابط، از LaunchDaemon سفارشی استفاده کنید (ارائه نمی‌شود).
    - Linux و Windows از طریق WSL2: واحد کاربری systemd
      - ویزارد تلاش می‌کند `loginctl enable-linger <user>` را اجرا کند تا Gateway پس از خروج کاربر همچنان فعال بماند.
      - ممکن است برای sudo درخواست تأیید کند (`/var/lib/systemd/linger` را می‌نویسد)؛ ابتدا بدون sudo تلاش می‌کند.
    - Windows بومی: ابتدا Scheduled Task
      - اگر ایجاد وظیفه رد شود، OpenClaw به یک مورد ورود مختص کاربر در پوشهٔ Startup بازمی‌گردد و Gateway را بلافاصله راه‌اندازی می‌کند.
      - Scheduled Taskها همچنان ترجیح داده می‌شوند، زیرا وضعیت ناظر بهتری ارائه می‌کنند.
    - انتخاب محیط اجرا: Node الزامی است، زیرا ذخیره‌گاه متعارف وضعیت زمان اجرای OpenClaw از `node:sqlite` استفاده می‌کند.

  </Step>
  <Step title="بررسی سلامت">
    - Gateway را در صورت نیاز راه‌اندازی می‌کند و `openclaw health` را اجرا می‌کند.
    - `openclaw status --deep` بررسی زندهٔ سلامت Gateway را به خروجی وضعیت اضافه می‌کند و در صورت پشتیبانی، بررسی کانال‌ها را نیز شامل می‌شود.

  </Step>
  <Step title="Skills">
    - Skills موجود را می‌خواند و پیش‌نیازها را بررسی می‌کند.
    - به شما امکان می‌دهد مدیر Node را انتخاب کنید: npm، pnpm یا bun.
    - در صورت موجود بودن نصب‌کنندهٔ لازم، وابستگی‌های اختیاری Skills همراه و مورداعتماد را
      نصب می‌کند.
    - نصب‌کننده‌های ناموجود Homebrew، uv و Go را نادیده می‌گیرد، سپس Skills متأثر را همراه با
      راهنمای راه‌اندازی دستی گروه‌بندی می‌کند. پس از نصب پیش‌نیازهای
      مفقود، `openclaw doctor` را اجرا کنید.

  </Step>
  <Step title="پایان">
    - خلاصه و گام‌های بعدی، شامل گزینه‌های برنامهٔ iOS، Android و macOS.

  </Step>
</Steps>

<Note>
اگر هیچ رابط گرافیکی شناسایی نشود، ویزارد به‌جای باز کردن مرورگر، دستورالعمل‌های انتقال درگاه SSH را برای رابط کنترل چاپ می‌کند.
اگر دارایی‌های رابط کنترل موجود نباشند، ویزارد برای ساخت آن‌ها تلاش می‌کند؛ مسیر جایگزین `pnpm ui:build` است (وابستگی‌های رابط کاربری را به‌طور خودکار نصب می‌کند).
</Note>

## جزئیات حالت راه‌دور

حالت راه‌دور این دستگاه را برای اتصال به یک Gateway در مکانی دیگر پیکربندی می‌کند. این حالت
هیچ‌چیز را روی میزبان راه‌دور نصب یا تغییر نمی‌دهد.

مواردی که تنظیم می‌کنید:

- URL مربوط به Gateway راه‌دور (`ws://...` یا `wss://...`)
- توکن، گذرواژه یا بدون احراز هویت، مطابق با پیکربندی Gateway راه‌دور

<Steps>
  <Step title="کشف (اختیاری)">
    اگر `dns-sd` (macOS) یا `avahi-browse` (Linux) موجود باشد، راه‌اندازی اولیه
    پیش از بازگشت به ورود دستی URL، امکان جست‌وجوی اعلان‌های Gateway مبتنی بر Bonjour/mDNS
    را ارائه می‌دهد. در صورت پیکربندی، کشف DNS-SD در شبکهٔ گسترده نیز
    امتحان می‌شود. مستندات: [کشف Gateway](/fa/gateway/discovery)، [Bonjour](/fa/gateway/bonjour).
  </Step>
  <Step title="روش اتصال">
    وقتی یک اعلان انتخاب می‌شود، WebSocket مستقیم یا تونل SSH را انتخاب کنید:
    - **مستقیم**: از طریق `wss://` متصل می‌شود و از شما می‌خواهد به اثر انگشت TLS کشف‌شده
      اعتماد کنید (سنجاق‌کردن بر پایهٔ اعتماد در نخستین استفاده؛ فقط در صورت پذیرش شما سنجاق می‌شود).
    - **تونل SSH**: فرمان `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>` را
      چاپ می‌کند تا ابتدا اجرا شود، سپس به نقطهٔ پایانی تونل محلی متصل می‌شود.
  </Step>
  <Step title="احراز هویت">
    توکن (توصیه‌شده)، گذرواژه یا بدون احراز هویت را انتخاب کنید، سپس در صورت تمایل آن را
    به‌جای متن ساده به‌صورت SecretRef ذخیره کنید.
  </Step>
</Steps>

<Note>
اگر Gateway فقط روی loopback در دسترس است و قابل کشف نیست، از تونل SSH یا یک tailnet به‌صورت دستی استفاده کنید.
`ws://` متن ساده برای loopback، نشانی‌های IP خصوصی، `.local` و URLهای Tailnet با `*.ts.net` پذیرفته می‌شود؛ دیگر نام‌های DNS خصوصی به `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` نیاز دارند.
</Note>

## گزینه‌های احراز هویت و مدل

اگر یکی از مراحل راه‌اندازی ارائه‌دهنده در راه‌اندازی اولیهٔ تعاملی ناموفق باشد (برای نمونه، گزینهٔ استفادهٔ مجدد از CLI
بدون ورود محلی)، ویزارد خطا را نمایش می‌دهد و به‌جای خروج، به انتخابگر ارائه‌دهنده
بازمی‌گردد. اجرای صریح `--auth-choice` همچنان برای خودکارسازی بلافاصله ناموفق می‌شود.

<AccordionGroup>
  <Accordion title="کلید API Anthropic">
    اگر `ANTHROPIC_API_KEY` موجود باشد از آن استفاده می‌کند؛ در غیر این صورت کلید را درخواست می‌کند و سپس آن را برای استفادهٔ سرویس پس‌زمینه ذخیره می‌کند.
  </Accordion>
  <Accordion title="CLI مربوط به Anthropic Claude">
    مسیر محلی ترجیحی در راه‌اندازی اولیه/پیکربندی تعاملی؛ در صورت وجود، از ورود فعلی Claude CLI دوباره استفاده می‌کند.
  </Accordion>
  <Accordion title="اشتراک OpenAI Code ‏(OAuth)">
    جریان مرورگر؛ `code#state` را جای‌گذاری کنید.

    در راه‌اندازی تازه و بدون مدل اصلی، `agents.defaults.model` را از طریق محیط اجرای Codex روی
    `openai/gpt-5.6-sol` تنظیم می‌کند.

  </Accordion>
  <Accordion title="اشتراک OpenAI Code (جفت‌سازی دستگاه)">
    جریان جفت‌سازی مرورگر با یک کد دستگاه کوتاه‌عمر.

    در راه‌اندازی تازه و بدون مدل اصلی، `agents.defaults.model` را از طریق محیط اجرای Codex روی
    `openai/gpt-5.6-sol` تنظیم می‌کند.

  </Accordion>
  <Accordion title="کلید API OpenAI">
    اگر `OPENAI_API_KEY` موجود باشد از آن استفاده می‌کند؛ در غیر این صورت کلید را درخواست می‌کند و سپس اعتبارنامه را در نمایه‌های احراز هویت ذخیره می‌کند.

    در راه‌اندازی تازه و بدون مدل اصلی، `agents.defaults.model` را روی
    `openai/gpt-5.6` تنظیم می‌کند؛ شناسهٔ مدل API مستقیم و بدون پیشوند به سطح Sol نگاشت می‌شود.

    افزودن OpenAI یا احراز هویت مجدد آن، مدل اصلی صریح موجود را،
    از جمله `openai/gpt-5.5`، حفظ می‌کند. اگر حساب GPT-5.6 را ارائه نمی‌دهد،
    `openai/gpt-5.5` را صریحاً انتخاب کنید؛ OpenClaw آن را بی‌سروصدا تنزل نمی‌دهد.

  </Accordion>
  <Accordion title="OAuth ‏xAI ‏(Grok)">
    ورود از طریق مرورگر برای حساب‌های واجد شرایط SuperGrok یا X Premium. این
    مسیر پیشنهادی xAI برای بیشتر کاربران است. OpenClaw نمایه احراز هویت حاصل را
    برای مدل‌های Grok، ‏Grok `web_search`، ‏`x_search` و `code_execution` ذخیره می‌کند.
  </Accordion>
  <Accordion title="کد دستگاه xAI ‏(Grok)">
    ورود مرورگر مناسب برای محیط‌های راه دور با یک کد کوتاه به‌جای فراخوانی برگشتی
    localhost. از این روش در میزبان‌های SSH، ‏Docker یا VPS استفاده کنید.
  </Accordion>
  <Accordion title="کلید API ‏xAI ‏(Grok)">
    مقدار `XAI_API_KEY` را درخواست و xAI را به‌عنوان ارائه‌دهنده مدل پیکربندی می‌کند. هنگامی از این
    روش استفاده کنید که به‌جای OAuth اشتراک، کلید API کنسول xAI را می‌خواهید.
  </Accordion>
  <Accordion title="OpenCode">
    مقدار `OPENCODE_API_KEY` (یا `OPENCODE_ZEN_API_KEY`) را درخواست می‌کند و امکان انتخاب کاتالوگ Zen یا Go را می‌دهد (یک کلید API هر دو را پوشش می‌دهد).
    نشانی راه‌اندازی: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="کلید API (عمومی)">
    کلید را برای شما ذخیره می‌کند.
  </Accordion>
  <Accordion title="Gateway هوش مصنوعی Vercel">
    مقدار `AI_GATEWAY_API_KEY` را درخواست می‌کند.
    جزئیات بیشتر: [Gateway هوش مصنوعی Vercel](/fa/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Gateway هوش مصنوعی Cloudflare">
    شناسه حساب، شناسه Gateway و `CLOUDFLARE_AI_GATEWAY_API_KEY` را درخواست می‌کند.
    جزئیات بیشتر: [Gateway هوش مصنوعی Cloudflare](/fa/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    پیکربندی به‌طور خودکار نوشته می‌شود. پیش‌فرض میزبانی‌شده `MiniMax-M3` است؛ راه‌اندازی با کلید API از
    `minimax/...` و راه‌اندازی OAuth از `minimax-portal/...` استفاده می‌کند.
    جزئیات بیشتر: [MiniMax](/fa/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    پیکربندی برای StepFun استاندارد یا Step Plan روی نقاط پایانی چین یا جهانی به‌طور خودکار نوشته می‌شود.
    نسخه استاندارد در حال حاضر شامل `step-3.5-flash` است و Step Plan نیز `step-3.5-flash-2603` را شامل می‌شود.
    جزئیات بیشتر: [StepFun](/fa/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (سازگار با Anthropic)">
    مقدار `SYNTHETIC_API_KEY` را درخواست می‌کند.
    جزئیات بیشتر: [Synthetic](/fa/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (مدل‌های باز ابری و محلی)">
    ابتدا `Cloud + Local`، ‏`Cloud only` یا `Local only` را درخواست می‌کند.
    ‏`Cloud only` از `OLLAMA_API_KEY` به‌همراه `https://ollama.com` استفاده می‌کند.
    حالت‌های متکی به میزبان، نشانی پایه (پیش‌فرض `http://127.0.0.1:11434`) را درخواست می‌کنند، مدل‌های موجود را می‌یابند و پیش‌فرض‌هایی پیشنهاد می‌دهند.
    ‏`Cloud + Local` همچنین بررسی می‌کند که آیا آن میزبان Ollama برای دسترسی ابری وارد حساب شده است یا خیر.
    جزئیات بیشتر: [Ollama](/fa/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot و Kimi Coding">
    پیکربندی‌های Moonshot ‏(Kimi K2) و Kimi Coding به‌طور خودکار نوشته می‌شوند.
    جزئیات بیشتر: [Moonshot AI ‏(Kimi + Kimi Coding)](/fa/providers/moonshot).
  </Accordion>
  <Accordion title="ارائه‌دهنده سفارشی">
    با نقاط پایانی سازگار با OpenAI، سازگار با OpenAI Responses و سازگار با Anthropic کار می‌کند.

    راه‌اندازی تعاملی از همان گزینه‌های ذخیره‌سازی کلید API در جریان‌های کلید API سایر ارائه‌دهندگان پشتیبانی می‌کند:
    - **هم‌اکنون کلید API را جای‌گذاری کنید** (متن ساده)
    - **استفاده از ارجاع راز** (ارجاع متغیر محیطی یا ارجاع ارائه‌دهنده پیکربندی‌شده، همراه با اعتبارسنجی پیش از اجرا)

    راه‌اندازی، پشتیبانی از تصویر را برای شناسه‌های رایج مدل‌های بینایی (GPT-4o/4.1/5.x، ‏Claude 3/4، ‏Gemini، ‏Qwen-VL، ‏LLaVA، ‏Pixtral و موارد مشابه) استنباط می‌کند و فقط زمانی سؤال می‌پرسد که نام مدل ناشناخته باشد.

    پرچم‌های غیرتعاملی:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (اختیاری؛ در صورت نبود، از `CUSTOM_API_KEY` استفاده می‌کند)
    - `--custom-provider-id` (اختیاری)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (اختیاری؛ پیش‌فرض `openai`)
    - `--custom-image-input` / `--custom-text-input` (اختیاری؛ قابلیت ورودی مدلِ استنباط‌شده را بازنویسی می‌کند)

  </Accordion>
  <Accordion title="رد کردن">
    احراز هویت را بدون پیکربندی باقی می‌گذارد.
  </Accordion>
</AccordionGroup>

رفتار مدل:

- مدل پیش‌فرض را از میان گزینه‌های شناسایی‌شده انتخاب کنید یا ارائه‌دهنده و مدل را دستی وارد کنید.
- هنگامی که راه‌اندازی از انتخاب احراز هویت یک ارائه‌دهنده آغاز می‌شود، انتخابگر مدل به‌طور خودکار
  آن ارائه‌دهنده را ترجیح می‌دهد. برای Volcengine و BytePlus، همین ترجیح
  گونه‌های طرح برنامه‌نویسی آن‌ها (`volcengine-plan/*`،
  `byteplus-plan/*`) را نیز تطبیق می‌دهد.
- اگر فیلتر ارائه‌دهنده ترجیحی هیچ نتیجه‌ای نداشته باشد، انتخابگر به‌جای نمایش ندادن مدل‌ها،
  به کاتالوگ کامل بازمی‌گردد.
- ویزارد مدل را بررسی می‌کند و در صورت ناشناخته بودن مدل پیکربندی‌شده یا نبود احراز هویت هشدار می‌دهد.

مسیرهای اطلاعات احراز هویت و نمایه:

- نمایه‌های احراز هویت (کلیدهای API + OAuth): ‏`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- درون‌ریزی OAuth قدیمی: `~/.openclaw/credentials/oauth.json`

حالت ذخیره‌سازی اطلاعات احراز هویت:

- رفتار پیش‌فرض راه‌اندازی، کلیدهای API را به‌صورت مقادیر متن ساده در نمایه‌های احراز هویت نگه‌داری می‌کند.
- `--secret-input-mode ref` به‌جای ذخیره‌سازی کلید به‌صورت متن ساده، حالت ارجاع را فعال می‌کند.
  در راه‌اندازی تعاملی می‌توانید یکی از این موارد را انتخاب کنید:
  - ارجاع متغیر محیطی (برای مثال `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - ارجاع ارائه‌دهنده پیکربندی‌شده (`file` یا `exec`) همراه با نام مستعار ارائه‌دهنده + شناسه
- حالت ارجاع تعاملی پیش از ذخیره‌سازی، یک اعتبارسنجی سریع پیش از اجرا انجام می‌دهد.
  - ارجاع‌های محیطی: نام متغیر + مقدار غیرخالی آن را در محیط فعلی راه‌اندازی اعتبارسنجی می‌کند.
  - ارجاع‌های ارائه‌دهنده: پیکربندی ارائه‌دهنده را اعتبارسنجی و شناسه درخواستی را برطرف می‌کند.
  - اگر بررسی پیش از اجرا ناموفق باشد، راه‌اندازی خطا را نمایش می‌دهد و اجازه تلاش دوباره می‌دهد.
- در حالت غیرتعاملی، `--secret-input-mode ref` فقط متکی به محیط است.
  - متغیر محیطی ارائه‌دهنده را در محیط فرایند راه‌اندازی تنظیم کنید.
  - پرچم‌های کلید درون‌خطی (برای مثال `--openai-api-key`) مستلزم تنظیم آن متغیر محیطی هستند؛ در غیر این صورت، راه‌اندازی فوراً ناموفق می‌شود.
  - برای ارائه‌دهندگان سفارشی، حالت غیرتعاملی `ref` مقدار `models.providers.<id>.apiKey` را به‌صورت `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` ذخیره می‌کند.
  - در این حالت ارائه‌دهنده سفارشی، `--custom-api-key` مستلزم تنظیم `CUSTOM_API_KEY` است؛ در غیر این صورت، راه‌اندازی فوراً ناموفق می‌شود.
- اطلاعات احراز هویت Gateway در راه‌اندازی تعاملی از گزینه‌های متن ساده و SecretRef پشتیبانی می‌کند:
  - حالت توکن: **تولید/ذخیره توکن متن ساده** (پیش‌فرض) یا **استفاده از SecretRef**.
  - حالت گذرواژه: متن ساده یا SecretRef.
- مسیر غیرتعاملی SecretRef توکن: `--gateway-token-ref-env <ENV_VAR>`.
- راه‌اندازی‌های موجود با متن ساده بدون تغییر به کار ادامه می‌دهند.

<Note>
نکته برای محیط‌های بدون رابط و سرورها: OAuth را روی دستگاهی دارای مرورگر تکمیل کنید، سپس
مقدار `auth-profiles.json` آن عامل را (برای مثال
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` یا مسیر متناظر
`$OPENCLAW_STATE_DIR/...`) به میزبان Gateway کپی کنید. `credentials/oauth.json`
فقط یک منبع درون‌ریزی قدیمی است.
</Note>

## خروجی‌ها و جزئیات داخلی

فیلدهای معمول در `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` هنگامی که `--skip-bootstrap` ارسال شود
- `agents.defaults.model` / `models.providers` (اگر Minimax انتخاب شده باشد)
- `tools.profile` (در صورت تنظیم نبودن، راه‌اندازی محلی به‌طور پیش‌فرض از `"coding"` استفاده می‌کند؛ مقادیر صریح موجود حفظ می‌شوند)
- `gateway.*` (حالت، اتصال، احراز هویت، Tailscale)
- `session.dmScope` (در صورت تنظیم نبودن، راه‌اندازی محلی این مقدار را به‌طور پیش‌فرض روی `per-channel-peer` قرار می‌دهد؛ مقادیر صریح موجود حفظ می‌شوند)
- `channels.telegram.botToken`، ‏`channels.discord.token`، ‏`channels.matrix.*`، ‏`channels.signal.*`، ‏`channels.imessage.*`
- فهرست‌های مجاز کانال‌ها (Discord، ‏iMessage، ‏Signal، ‏Slack، ‏Telegram، ‏WhatsApp) هنگامی که حین درخواست‌ها آن‌ها را فعال می‌کنید؛ Discord و Slack همچنین نام‌های واردشده را به شناسه تبدیل می‌کنند
- `skills.install.nodeManager`
  - پرچم `setup --node-manager` مقادیر `npm`، ‏`pnpm` یا `bun` را می‌پذیرد.
  - پیکربندی دستی همچنان می‌تواند بعداً `skills.install.nodeManager: "yarn"` را تنظیم کند.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` مقدار `agents.list[]` و مقدار اختیاری `bindings` را می‌نویسد.

اطلاعات احراز هویت WhatsApp در `~/.openclaw/credentials/whatsapp/<accountId>/` قرار می‌گیرد.
نشست‌ها و رونوشت‌های فعال در
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` ذخیره می‌شوند. پوشه
`~/.openclaw/agents/<agentId>/sessions/` برای ورودی‌های مهاجرت قدیمی
و آثار بایگانی/پشتیبانی استفاده می‌شود.

<Note>
برخی کانال‌ها به‌شکل Plugin ارائه می‌شوند. هنگامی که در راه‌اندازی انتخاب شوند، ویزارد
پیش از پیکربندی کانال، نصب Plugin را (از npm یا مسیر محلی) درخواست می‌کند.
</Note>

## راه‌اندازی غیرتعاملی

`--non-interactive` به `--accept-risk` نیاز دارد (تأیید می‌کند که عامل‌ها
قدرتمند هستند و دسترسی کامل به سیستم خطرناک است):

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY"
```

مرجع کامل پرچم‌ها و نمونه‌های مختص ارائه‌دهنده: [`openclaw onboard`](/fa/cli/onboard)، [خودکارسازی CLI](/fa/start/wizard-cli-automation).

## ‏RPC ویزارد Gateway

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

کلاینت‌ها (برنامه macOS و رابط کاربری کنترل) می‌توانند مراحل را بدون پیاده‌سازی دوباره منطق راه‌اندازی نمایش دهند.

## رفتار راه‌اندازی Signal

- دارایی انتشار مناسب را از انتشارهای رسمی GitHub مربوط به `signal-cli` دریافت می‌کند (ساخت بومی، فقط Linux x86-64)
- در پلتفرم‌های دیگر (macOS و Linux غیر x64)، به‌جای آن از طریق Homebrew نصب می‌کند
- نصب دارایی انتشار را در `~/.openclaw/tools/signal-cli/<version>/` ذخیره می‌کند
- مقدار `channels.signal.cliPath` را در پیکربندی می‌نویسد
- هنوز از Windows بومی پشتیبانی نمی‌شود؛ برای دریافت مسیر نصب Linux، راه‌اندازی را در WSL2 اجرا کنید

## مستندات مرتبط

- مرکز راه‌اندازی: [راه‌اندازی (CLI)](/fa/start/wizard)
- خودکارسازی و اسکریپت‌ها: [خودکارسازی CLI](/fa/start/wizard-cli-automation)
- مرجع فرمان: [`openclaw onboard`](/fa/cli/onboard)
