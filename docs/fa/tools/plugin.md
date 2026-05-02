---
read_when:
    - نصب یا پیکربندی Pluginها
    - آشنایی با قواعد کشف و بارگذاری Plugin
    - کار با بسته‌های Plugin سازگار با Codex/Claude
sidebarTitle: Install and Configure
summary: Pluginهای OpenClaw را نصب، پیکربندی و مدیریت کنید
title: Plugin‌ها
x-i18n:
    generated_at: "2026-05-02T12:06:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 97ec11a601445fa948d5639a6d461bcf3846a3c70d3eb304a66243a3d8ce810a
    source_path: tools/plugin.md
    workflow: 16
---

Pluginها OpenClaw را با قابلیت‌های جدید گسترش می‌دهند: کانال‌ها، ارائه‌دهندگان مدل،
چارچوب‌های اجرای عامل، ابزارها، Skills، گفتار، رونویسی بی‌درنگ، صدای بی‌درنگ،
درک رسانه، تولید تصویر، تولید ویدئو، واکشی وب، جست‌وجوی وب، و موارد دیگر. برخی
Pluginها **هسته‌ای** هستند (همراه OpenClaw ارائه می‌شوند)، و برخی دیگر
**خارجی** هستند. بیشتر Pluginهای خارجی از طریق
[ClawHub](/fa/tools/clawhub) منتشر و کشف می‌شوند. npm همچنان برای نصب مستقیم و برای
مجموعه‌ای موقت از بسته‌های Plugin متعلق به OpenClaw تا پایان این مهاجرت پشتیبانی می‌شود.

## شروع سریع

<Steps>
  <Step title="ببینید چه چیزهایی بارگذاری شده‌اند">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="نصب یک Plugin">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="راه‌اندازی مجدد Gateway">
    ```bash
    openclaw gateway restart
    ```

    سپس در فایل پیکربندی خود، زیر `plugins.entries.\<id\>.config` پیکربندی کنید.

  </Step>

  <Step title="تأیید Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    وقتی لازم است ابزارهای ثبت‌شده، سرویس‌ها، متدهای Gateway، قلاب‌ها، یا دستورهای
    CLI متعلق به Plugin را اثبات کنید، از `--runtime` استفاده کنید. اجرای ساده‌ی
    `inspect` یک بررسی سرد مانیفست/رجیستری است و عمداً از وارد کردن زمان اجرای
    Plugin خودداری می‌کند.

  </Step>
</Steps>

اگر کنترل بومیِ چت را ترجیح می‌دهید، `commands.plugins: true` را فعال کنید و از این‌ها استفاده کنید:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

مسیر نصب از همان resolver مربوط به CLI استفاده می‌کند: مسیر/آرشیو محلی، مقدار
صریح `clawhub:<pkg>`، مقدار صریح `npm:<pkg>`، مقدار صریح `git:<repo>`، یا
مشخصات بسته بدون پیشوند (ابتدا ClawHub، سپس بازگشت به npm).

اگر پیکربندی نامعتبر باشد، نصب معمولاً به‌صورت بسته شکست می‌خورد و شما را به
`openclaw doctor --fix` ارجاع می‌دهد. تنها استثنای بازیابی، یک مسیر محدود برای
نصب دوباره Plugin همراه است، برای Pluginهایی که
`openclaw.install.allowInvalidConfigRecovery` را انتخاب می‌کنند.
در زمان شروع Gateway، پیکربندی نامعتبر برای یک Plugin به همان Plugin محدود می‌شود:
شروع، مشکل `plugins.entries.<id>.config` را در گزارش‌ها ثبت می‌کند، آن Plugin را هنگام
بارگذاری نادیده می‌گیرد، و سایر Pluginها و کانال‌ها را آنلاین نگه می‌دارد. برای قرنطینه
کردن پیکربندی خراب Plugin با غیرفعال کردن ورودی آن Plugin و حذف payload نامعتبر
پیکربندی آن، `openclaw doctor --fix` را اجرا کنید؛ نسخه پشتیبان عادی پیکربندی،
مقادیر قبلی را نگه می‌دارد.
وقتی پیکربندی یک کانال به Pluginی ارجاع می‌دهد که دیگر قابل کشف نیست اما همان
شناسه قدیمی Plugin در پیکربندی Plugin یا رکوردهای نصب باقی مانده است، شروع Gateway
هشدارها را ثبت می‌کند و آن کانال را نادیده می‌گیرد، به‌جای اینکه هر کانال دیگری را
مسدود کند. برای حذف ورودی‌های قدیمی کانال/Plugin، `openclaw doctor --fix` را اجرا
کنید؛ کلیدهای ناشناخته کانال بدون شواهد Plugin قدیمی همچنان اعتبارسنجی را ناموفق
می‌کنند تا غلط‌های تایپی قابل مشاهده بمانند.
اگر `plugins.enabled: false` تنظیم شده باشد، ارجاع‌های قدیمی Plugin بی‌اثر تلقی
می‌شوند: شروع Gateway کار کشف/بارگذاری Plugin را نادیده می‌گیرد و `openclaw doctor`
به‌جای حذف خودکار، پیکربندی غیرفعال Plugin را حفظ می‌کند. اگر می‌خواهید شناسه‌های
قدیمی Plugin حذف شوند، پیش از اجرای پاک‌سازی doctor، Pluginها را دوباره فعال کنید.

نصب وابستگی‌های Plugin فقط در جریان‌های صریح نصب/به‌روزرسانی یا تعمیر doctor انجام
می‌شود. شروع Gateway، بارگذاری دوباره پیکربندی، و بازرسی زمان اجرا، package managerها
را اجرا نمی‌کنند و درخت‌های وابستگی را تعمیر نمی‌کنند. Pluginهای محلی باید از قبل
وابستگی‌هایشان را نصب‌شده داشته باشند، درحالی‌که Pluginهای npm، git، و ClawHub زیر
ریشه‌های Plugin مدیریت‌شده OpenClaw نصب می‌شوند. وابستگی‌های npm ممکن است در ریشه
npm مدیریت‌شده OpenClaw به سطح بالاتر منتقل شوند؛ نصب/به‌روزرسانی پیش از اعتماد،
آن ریشه مدیریت‌شده را اسکن می‌کند و حذف نصب، بسته‌های مدیریت‌شده با npm را از طریق
npm حذف می‌کند. Pluginهای خارجی و مسیرهای بارگذاری سفارشی همچنان باید از طریق
`openclaw plugins install` نصب شوند. برای چرخه عمر زمان نصب، [حل وابستگی Plugin](/fa/plugins/dependency-resolution)
را ببینید.

نسخه‌های کد منبع، workspaceهای pnpm هستند. اگر OpenClaw را برای کار روی Pluginهای
همراه clone می‌کنید، `pnpm install` را اجرا کنید؛ سپس OpenClaw، Pluginهای همراه را از
`extensions/<id>` بارگذاری می‌کند تا ویرایش‌ها و وابستگی‌های محلی بسته مستقیماً استفاده
شوند. نصب‌های ساده در ریشه npm برای OpenClaw بسته‌بندی‌شده هستند، نه توسعه روی
نسخه کد منبع.

## انواع Plugin

OpenClaw دو قالب Plugin را می‌شناسد:

| قالب | نحوه کار | نمونه‌ها |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **بومی** | `openclaw.plugin.json` + ماژول زمان اجرا؛ درون فرایند اجرا می‌شود | Pluginهای رسمی، بسته‌های npm جامعه |
| **بسته** | چیدمان سازگار با Codex/Claude/Cursor؛ به قابلیت‌های OpenClaw نگاشت می‌شود | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

هر دو زیر `openclaw plugins list` نمایش داده می‌شوند. برای جزئیات بسته، [بسته‌های Plugin](/fa/plugins/bundles) را ببینید.

اگر در حال نوشتن یک Plugin بومی هستید، با [ساخت Pluginها](/fa/plugins/building-plugins)
و [نمای کلی SDK Plugin](/fa/plugins/sdk-overview) شروع کنید.

## نقاط ورود بسته

بسته‌های npm مربوط به Pluginهای بومی باید `openclaw.extensions` را در `package.json`
اعلام کنند. هر ورودی باید داخل دایرکتوری بسته بماند و به یک فایل زمان اجرای خواندنی
resolve شود، یا به یک فایل منبع TypeScript با همتای JavaScript ساخته‌شده‌ی استنباط‌شده،
مانند `src/index.ts` به `dist/index.js`.

وقتی فایل‌های زمان اجرای منتشرشده در همان مسیرهای ورودی‌های منبع قرار ندارند، از
`openclaw.runtimeExtensions` استفاده کنید. وقتی `runtimeExtensions` وجود داشته باشد،
باید دقیقاً برای هر ورودی `extensions` یک ورودی داشته باشد. فهرست‌های ناسازگار باعث
شکست نصب و کشف Plugin می‌شوند، نه اینکه بی‌صدا به مسیرهای منبع برگردند. اگر
`openclaw.setupEntry` را هم منتشر می‌کنید، برای همتای JavaScript ساخته‌شده‌ی آن از
`openclaw.runtimeSetupEntry` استفاده کنید؛ وقتی اعلام شود، آن فایل الزامی است.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Pluginهای رسمی

### بسته‌های npm متعلق به OpenClaw در طول مهاجرت

ClawHub مسیر اصلی توزیع برای بیشتر Pluginها است. انتشارهای بسته‌بندی‌شده فعلی
OpenClaw از قبل بسیاری از Pluginهای رسمی را همراه خود دارند، بنابراین آن‌ها در
راه‌اندازی‌های عادی به نصب npm جداگانه نیاز ندارند. تا زمانی که هر Plugin متعلق به
OpenClaw به ClawHub مهاجرت کند، OpenClaw همچنان برخی بسته‌های Plugin با نام
`@openclaw/*` را برای نصب‌های قدیمی/سفارشی و workflowهای مستقیم npm روی npm منتشر
می‌کند.

اگر npm یک بسته Plugin از `@openclaw/*` را منسوخ گزارش کرد، آن نسخه بسته متعلق به
یک قطار قدیمی‌تر بسته خارجی است. تا زمانی که بسته npm جدیدتری منتشر شود، از Plugin
همراه در OpenClaw فعلی یا یک checkout محلی استفاده کنید.

| Plugin | بسته | مستندات |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles | `@openclaw/bluebubbles` | [BlueBubbles](/fa/channels/bluebubbles) |
| Discord | `@openclaw/discord` | [Discord](/fa/channels/discord) |
| Feishu | `@openclaw/feishu` | [Feishu](/fa/channels/feishu) |
| Matrix | `@openclaw/matrix` | [Matrix](/fa/channels/matrix) |
| Mattermost | `@openclaw/mattermost` | [Mattermost](/fa/channels/mattermost) |
| Microsoft Teams | `@openclaw/msteams` | [Microsoft Teams](/fa/channels/msteams) |
| Nextcloud Talk | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/fa/channels/nextcloud-talk) |
| Nostr | `@openclaw/nostr` | [Nostr](/fa/channels/nostr) |
| Synology Chat | `@openclaw/synology-chat` | [Synology Chat](/fa/channels/synology-chat) |
| Tlon | `@openclaw/tlon` | [Tlon](/fa/channels/tlon) |
| WhatsApp | `@openclaw/whatsapp` | [WhatsApp](/fa/channels/whatsapp) |
| Zalo | `@openclaw/zalo` | [Zalo](/fa/channels/zalo) |
| Zalo Personal | `@openclaw/zalouser` | [Zalo Personal](/fa/plugins/zalouser) |

### هسته (همراه OpenClaw ارائه می‌شود)

<AccordionGroup>
  <Accordion title="ارائه‌دهندگان مدل (به‌صورت پیش‌فرض فعال)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Pluginهای حافظه">
    - `memory-core` — جست‌وجوی حافظه همراه (پیش‌فرض از طریق `plugins.slots.memory`)
    - `memory-lancedb` — حافظه بلندمدت مبتنی بر LanceDB با فراخوانی/ثبت خودکار (`plugins.slots.memory = "memory-lancedb"` را تنظیم کنید)

    برای راه‌اندازی embedding سازگار با OpenAI، نمونه‌های Ollama، محدودیت‌های فراخوانی،
    و عیب‌یابی، [Memory LanceDB](/fa/plugins/memory-lancedb) را ببینید.

  </Accordion>

  <Accordion title="ارائه‌دهندگان گفتار (به‌صورت پیش‌فرض فعال)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="سایر موارد">
    - `browser` — Plugin مرورگر همراه برای ابزار مرورگر، CLI مربوط به `openclaw browser`، متد Gateway به نام `browser.request`، زمان اجرای مرورگر، و سرویس کنترل مرورگر پیش‌فرض (به‌صورت پیش‌فرض فعال است؛ پیش از جایگزین کردن آن غیرفعالش کنید)
    - `copilot-proxy` — پل VS Code Copilot Proxy (به‌صورت پیش‌فرض غیرفعال)

  </Accordion>
</AccordionGroup>

دنبال Pluginهای شخص ثالث هستید؟ [Pluginهای جامعه](/fa/plugins/community) را ببینید.

## پیکربندی

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| فیلد | توضیح |
| ---------------- | --------------------------------------------------------- |
| `enabled` | سوییچ اصلی (پیش‌فرض: `true`) |
| `allow` | فهرست مجاز Plugin (اختیاری) |
| `deny` | فهرست منع Plugin (اختیاری؛ منع غالب است) |
| `load.paths` | فایل‌ها/دایرکتوری‌های اضافی Plugin |
| `slots` | گزینشگرهای slot انحصاری (مثلاً `memory`، `contextEngine`) |
| `entries.\<id\>` | سوییچ‌ها + پیکربندی به‌ازای هر Plugin |

`plugins.allow` انحصاری است. وقتی خالی نباشد، فقط Pluginهای فهرست‌شده می‌توانند
بارگذاری شوند یا ابزارها را در معرض استفاده قرار دهند، حتی اگر `tools.allow` شامل
`"*"` یا نام یک ابزار خاص متعلق به Plugin باشد. اگر فهرست مجاز ابزار به ابزارهای
Plugin ارجاع می‌دهد، شناسه‌های Plugin مالک را به `plugins.allow` اضافه کنید یا
`plugins.allow` را حذف کنید؛ `openclaw doctor` درباره این الگو هشدار می‌دهد.

تغییرات پیکربندی **به راه‌اندازی مجدد Gateway نیاز دارند**. اگر Gateway با پایش
پیکربندی + راه‌اندازی مجدد درون‌فرایندی فعال اجرا می‌شود (مسیر پیش‌فرض
`openclaw gateway`)، آن راه‌اندازی مجدد معمولاً کمی پس از ثبت شدن نوشتن پیکربندی
به‌صورت خودکار انجام می‌شود. هیچ مسیر پشتیبانی‌شده‌ای برای بازبارگذاری داغ کد زمان
اجرای Plugin بومی یا قلاب‌های چرخه عمر وجود ندارد؛ پیش از اینکه انتظار داشته باشید
کد به‌روزشده‌ی `register(api)`، قلاب‌های `api.on(...)`، ابزارها، سرویس‌ها، یا
قلاب‌های ارائه‌دهنده/زمان اجرا اجرا شوند، فرایند Gateway را که کانال زنده را
سرویس‌دهی می‌کند راه‌اندازی مجدد کنید.

`openclaw plugins list` یک اسنپ‌شات محلی از رجیستری/پیکربندی Plugin است. یک
Plugin با وضعیت `enabled` در آنجا یعنی رجیستری پایدارشده و پیکربندی فعلی اجازه می‌دهند آن
Plugin مشارکت کند. این ثابت نمی‌کند که یک فرزند Gateway راه‌دور که از قبل در حال اجراست
با همان کد Plugin دوباره راه‌اندازی شده باشد. در راه‌اندازی‌های VPS/کانتینر با
فرایندهای پوشاننده، راه‌اندازی‌های دوباره را به فرایند واقعی `openclaw gateway run` بفرستید،
یا از `openclaw gateway restart` روی Gateway در حال اجرا استفاده کنید.

<Accordion title="وضعیت‌های Plugin: غیرفعال در برابر گمشده در برابر نامعتبر">
  - **غیرفعال**: Plugin وجود دارد، اما قواعد فعال‌سازی آن را خاموش کرده‌اند. پیکربندی حفظ می‌شود.
  - **گمشده**: پیکربندی به یک شناسه Plugin ارجاع می‌دهد که کشف آن را پیدا نکرده است.
  - **نامعتبر**: Plugin وجود دارد، اما پیکربندی آن با شِمای اعلام‌شده مطابقت ندارد. راه‌اندازی Gateway فقط همان Plugin را رد می‌کند؛ `openclaw doctor --fix` می‌تواند ورودی نامعتبر را با غیرفعال‌کردن آن و حذف payload پیکربندی‌اش قرنطینه کند.

</Accordion>

## کشف و اولویت

OpenClaw به این ترتیب به‌دنبال Pluginها می‌گردد (اولین تطابق برنده است):

<Steps>
  <Step title="مسیرهای پیکربندی">
    `plugins.load.paths` — مسیرهای صریح فایل یا دایرکتوری. مسیرهایی که به
    دایرکتوری‌های Plugin بسته‌بندی‌شده و همراه خود OpenClaw برمی‌گردند نادیده گرفته می‌شوند؛
    برای حذف آن aliasهای قدیمی `openclaw doctor --fix` را اجرا کنید.
  </Step>

  <Step title="Pluginهای workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Pluginهای سراسری">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Pluginهای همراه">
    همراه OpenClaw عرضه می‌شوند. بسیاری به‌صورت پیش‌فرض فعال‌اند (ارائه‌دهندگان مدل، گفتار).
    برخی دیگر به فعال‌سازی صریح نیاز دارند.
  </Step>
</Steps>

نصب‌های بسته‌بندی‌شده و imageهای Docker معمولاً Pluginهای همراه را از درخت
کامپایل‌شده `dist/extensions` resolve می‌کنند. اگر یک دایرکتوری منبع Plugin همراه
روی مسیر منبع بسته‌بندی‌شده متناظر bind-mount شود، برای مثال
`/app/extensions/synology-chat`، OpenClaw آن دایرکتوری منبع mountشده را
به‌عنوان یک overlay منبع همراه در نظر می‌گیرد و آن را پیش از bundle بسته‌بندی‌شده
`/app/dist/extensions/synology-chat` کشف می‌کند. این باعث می‌شود loopهای کانتینری
نگه‌دارنده بدون برگرداندن هر Plugin همراه به منبع TypeScript کار کنند.
برای اجبار به استفاده از bundleهای dist بسته‌بندی‌شده حتی وقتی mountهای overlay منبع حاضرند،
`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` را تنظیم کنید.

### قواعد فعال‌سازی

- `plugins.enabled: false` همه Pluginها را غیرفعال می‌کند و کار کشف/بارگذاری Plugin را رد می‌کند
- `plugins.deny` همیشه بر allow پیروز است
- `plugins.entries.\<id\>.enabled: false` آن Plugin را غیرفعال می‌کند
- Pluginهای با منشأ workspace به‌صورت **پیش‌فرض غیرفعال‌اند** (باید صراحتاً فعال شوند)
- Pluginهای همراه، مگر اینکه override شوند، از مجموعه داخلی پیش‌فرض-روشن پیروی می‌کنند
- slotهای انحصاری می‌توانند Plugin انتخاب‌شده برای آن slot را به‌اجبار فعال کنند
- برخی Pluginهای همراه opt-in وقتی پیکربندی یک سطح متعلق به Plugin را نام‌گذاری کند، خودکار فعال می‌شوند؛
  مانند ref مدل ارائه‌دهنده، پیکربندی channel، یا runtime harness
- پیکربندی قدیمی Plugin تا وقتی `plugins.enabled: false` فعال است حفظ می‌شود؛
  اگر می‌خواهید شناسه‌های قدیمی حذف شوند، پیش از اجرای پاک‌سازی doctor، Pluginها را دوباره فعال کنید
- مسیرهای Codex خانواده OpenAI مرزهای Plugin جداگانه را حفظ می‌کنند:
  `openai-codex/*` متعلق به Plugin OpenAI است، درحالی‌که Plugin همراه app-server برای Codex
  با `agentRuntime.id: "codex"` یا refهای مدل قدیمی
  `codex/*` انتخاب می‌شود

## عیب‌یابی hookهای runtime

اگر یک Plugin در `plugins list` ظاهر می‌شود اما اثرهای جانبی یا hookهای
`register(api)` در ترافیک گفت‌وگوی زنده اجرا نمی‌شوند، ابتدا این‌ها را بررسی کنید:

- `openclaw gateway status --deep --require-rpc` را اجرا کنید و تأیید کنید URL،
  پروفایل، مسیر پیکربندی، و فرایند Gateway فعال همان‌هایی هستند که دارید ویرایش می‌کنید.
- پس از تغییرات نصب/پیکربندی/کد Plugin، Gateway زنده را دوباره راه‌اندازی کنید. در کانتینرهای پوشاننده،
  PID 1 ممکن است فقط یک supervisor باشد؛ فرزند
  `openclaw gateway run` را دوباره راه‌اندازی کنید یا به آن signal بفرستید.
- برای تأیید ثبت hookها و diagnostics از `openclaw plugins inspect <id> --runtime --json` استفاده کنید.
  hookهای مکالمه غیرهمراه مانند `llm_input`,
  `llm_output`, `before_agent_finalize`, و `agent_end` به
  `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.
- برای تغییر مدل، `before_model_resolve` را ترجیح دهید. این hook پیش از resolve شدن مدل
  برای نوبت‌های agent اجرا می‌شود؛ `llm_output` فقط پس از آن اجرا می‌شود که یک تلاش مدل
  خروجی assistant تولید کند.
- برای اثبات مدل مؤثر session، از `openclaw sessions` یا سطح‌های
  session/status در Gateway استفاده کنید و هنگام دیباگ payloadهای ارائه‌دهنده، Gateway را با
  `--raw-stream --raw-stream-path <path>` شروع کنید.

### آماده‌سازی کند ابزار Plugin

اگر به‌نظر می‌رسد نوبت‌های agent هنگام آماده‌سازی ابزارها متوقف می‌شوند، trace logging را فعال کنید و
خطوط زمان‌بندی factory ابزار Plugin را بررسی کنید:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

به‌دنبال این بگردید:

```text
[trace:plugin-tools] factory timings ...
```

خلاصه، زمان کل factory و کندترین factoryهای ابزار Plugin را فهرست می‌کند،
از جمله شناسه Plugin، نام‌های ابزار اعلام‌شده، شکل نتیجه، و اینکه ابزار
اختیاری است یا نه. وقتی یک factory دست‌کم 1s طول بکشد یا کل آماده‌سازی factory ابزار Plugin
دست‌کم 5s طول بکشد، خطوط کند به هشدار ارتقا می‌یابند.

OpenClaw نتیجه‌های موفق factory ابزار Plugin را برای resolveهای تکراری
با همان context درخواست مؤثر cache می‌کند. کلید cache شامل پیکربندی runtime مؤثر،
workspace، شناسه‌های agent/session، سیاست sandbox، تنظیمات browser،
context تحویل، هویت requester، و وضعیت مالکیت است؛ بنابراین factoryهایی که
به آن فیلدهای مورد اعتماد وابسته‌اند وقتی context تغییر کند دوباره اجرا می‌شوند.

اگر یک Plugin بر زمان‌بندی غالب است، ثبت‌های runtime آن را بررسی کنید:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

سپس آن Plugin را به‌روزرسانی، دوباره نصب، یا غیرفعال کنید. نویسندگان Plugin باید بارگذاری
وابستگی‌های پرهزینه را به پشت مسیر اجرای ابزار منتقل کنند، نه اینکه آن را
داخل factory ابزار انجام دهند.

### مالکیت تکراری channel یا ابزار

نشانه‌ها:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

این‌ها یعنی بیش از یک Plugin فعال تلاش می‌کند مالک همان channel،
جریان setup، یا نام ابزار باشد. رایج‌ترین علت، نصب یک Plugin channel خارجی
در کنار یک Plugin همراه است که اکنون همان شناسه channel را فراهم می‌کند.

گام‌های دیباگ:

- برای دیدن همه Pluginهای فعال و منشأ آن‌ها `openclaw plugins list --enabled --verbose` را اجرا کنید.
- برای هر Plugin مشکوک `openclaw plugins inspect <id> --runtime --json` را اجرا کنید و
  `channels`، `channelConfigs`، `tools`، و diagnostics را مقایسه کنید.
- پس از نصب یا حذف بسته‌های Plugin، `openclaw plugins registry --refresh` را اجرا کنید
  تا metadata پایدارشده وضعیت نصب فعلی را بازتاب دهد.
- پس از تغییرات نصب، رجیستری، یا پیکربندی، Gateway را دوباره راه‌اندازی کنید.

گزینه‌های رفع:

- اگر یک Plugin عمداً Plugin دیگری را برای همان شناسه channel جایگزین می‌کند، Plugin
  ترجیحی باید `channelConfigs.<channel-id>.preferOver` را با شناسه Plugin کم‌اولویت‌تر
  اعلام کند. [/plugins/manifest#replacing-another-channel-plugin](/fa/plugins/manifest#replacing-another-channel-plugin) را ببینید.
- اگر تکراری‌شدن تصادفی است، یک طرف را با
  `plugins.entries.<plugin-id>.enabled: false` غیرفعال کنید یا نصب قدیمی Plugin را
  حذف کنید.
- اگر هر دو Plugin را صراحتاً فعال کرده‌اید، OpenClaw آن درخواست را حفظ می‌کند و
  تعارض را گزارش می‌دهد. یک مالک برای channel انتخاب کنید یا ابزارهای متعلق به Plugin را
  تغییر نام دهید تا سطح runtime بدون ابهام باشد.

## slotهای Plugin (دسته‌های انحصاری)

برخی دسته‌ها انحصاری‌اند (در هر زمان فقط یکی فعال است):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| Slot            | چیزی که کنترل می‌کند | پیش‌فرض             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin حافظه فعال     | `memory-core`       |
| `contextEngine` | موتور context فعال    | `legacy` (داخلی)   |

## مرجع CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install (ClawHub first, then npm)
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Pluginهای همراه با OpenClaw عرضه می‌شوند. بسیاری به‌صورت پیش‌فرض فعال‌اند (برای مثال
ارائه‌دهندگان مدل همراه، ارائه‌دهندگان گفتار همراه، و Plugin مرورگر همراه).
Pluginهای همراه دیگر همچنان به `openclaw plugins enable <id>` نیاز دارند.

`--force` یک Plugin نصب‌شده یا hook pack موجود را در همان‌جا overwrite می‌کند. برای
ارتقاهای معمول Pluginهای npm ردیابی‌شده از
`openclaw plugins update <id-or-npm-spec>` استفاده کنید. این گزینه با `--link` پشتیبانی نمی‌شود،
چون `--link` به‌جای کپی‌کردن روی یک هدف نصب مدیریت‌شده، از مسیر منبع دوباره استفاده می‌کند.

وقتی `plugins.allow` از قبل تنظیم شده باشد، `openclaw plugins install` شناسه Plugin
نصب‌شده را پیش از فعال‌کردن به آن allowlist اضافه می‌کند. اگر همان شناسه Plugin
در `plugins.deny` حاضر باشد، install آن ورودی deny قدیمی را حذف می‌کند تا
نصب صریح بلافاصله پس از راه‌اندازی دوباره قابل بارگذاری باشد.

OpenClaw یک رجیستری محلی پایدارشدهٔ Plugin را به‌عنوان مدل خواندن سرد برای
موجودی Plugin، مالکیت مشارکت‌ها، و برنامه‌ریزی راه‌اندازی نگه می‌دارد. جریان‌های نصب، به‌روزرسانی،
حذف نصب، فعال‌سازی، و غیرفعال‌سازی پس از تغییر وضعیت Plugin
آن رجیستری را تازه‌سازی می‌کنند. همان فایل `plugins/installs.json` فرادادهٔ نصب پایدار را در
`installRecords` سطح بالا و فرادادهٔ manifest قابل بازسازی را در `plugins` نگه می‌دارد. اگر
رجیستری وجود نداشته باشد، قدیمی باشد، یا نامعتبر باشد، `openclaw plugins registry
--refresh` نمای manifest آن را از رکوردهای نصب، سیاست پیکربندی، و
فرادادهٔ manifest/package بدون بارگذاری ماژول‌های runtime مربوط به Plugin بازسازی می‌کند.
`openclaw plugins update <id-or-npm-spec>` روی نصب‌های ردیابی‌شده اعمال می‌شود. دادن
یک مشخصهٔ npm package با dist-tag یا نسخهٔ دقیق، نام package را
دوباره به رکورد Plugin ردیابی‌شده نگاشت می‌کند و مشخصهٔ جدید را برای به‌روزرسانی‌های آینده ثبت می‌کند.
دادن نام package بدون نسخه، نصب دقیقاً pinشده را دوباره به
خط انتشار پیش‌فرض رجیستری منتقل می‌کند. اگر Plugin نصب‌شدهٔ npm از قبل با
نسخهٔ resolveشده و هویت artifact ثبت‌شده مطابقت داشته باشد، OpenClaw به‌روزرسانی را
بدون دانلود، نصب دوباره، یا بازنویسی config رد می‌کند.

`--pin` فقط برای npm است. با `--marketplace` پشتیبانی نمی‌شود، چون
نصب‌های marketplace به‌جای مشخصهٔ npm، فرادادهٔ منبع marketplace را پایدار می‌کنند.

`--dangerously-force-unsafe-install` یک override اضطراری برای مثبت‌های کاذب
اسکنر داخلی کد خطرناک است. این گزینه اجازه می‌دهد نصب‌های Plugin
و به‌روزرسانی‌های Plugin از یافته‌های داخلی `critical` عبور کنند، اما همچنان
مسدودسازی‌های سیاست `before_install` مربوط به Plugin یا مسدودسازی ناشی از شکست اسکن را دور نمی‌زند.
اسکن‌های نصب، فایل‌ها و دایرکتوری‌های رایج تست مانند `tests/`,
`__tests__/`, `*.test.*`, و `*.spec.*` را نادیده می‌گیرند تا mockهای تست بسته‌بندی‌شده مسدود نشوند؛
entrypointهای runtime اعلام‌شدهٔ Plugin همچنان اسکن می‌شوند حتی اگر از یکی از
این نام‌ها استفاده کنند.

این پرچم CLI فقط برای جریان‌های نصب/به‌روزرسانی Plugin اعمال می‌شود. نصب‌های وابستگی Skills
با پشتیبانی Gateway به‌جای آن از override درخواست متناظر
`dangerouslyForceUnsafeInstall` استفاده می‌کنند، درحالی‌که `openclaw skills install` همچنان
جریان جداگانهٔ دانلود/نصب Skills از ClawHub است.

اگر Pluginای که روی ClawHub منتشر کرده‌اید توسط یک اسکن پنهان یا مسدود شده است، داشبورد
ClawHub را باز کنید یا `clawhub package rescan <name>` را اجرا کنید تا از ClawHub بخواهید
دوباره آن را بررسی کند. `--dangerously-force-unsafe-install` فقط روی نصب‌ها در دستگاه خودتان اثر می‌گذارد؛
از ClawHub نمی‌خواهد Plugin را دوباره اسکن کند یا یک انتشار مسدودشده را
عمومی کند.

بسته‌های سازگار در همان جریان فهرست/بازرسی/فعال‌سازی/غیرفعال‌سازی Plugin
شرکت می‌کنند. پشتیبانی runtime فعلی شامل bundle skills، command-skills کلود،
پیش‌فرض‌های Claude `settings.json`، پیش‌فرض‌های Claude `.lsp.json` و
`lspServers` اعلام‌شده در manifest، command-skills مربوط به Cursor، و دایرکتوری‌های hook
سازگار Codex است.

`openclaw plugins inspect <id>` همچنین قابلیت‌های bundle تشخیص‌داده‌شده به‌علاوهٔ
ورودی‌های پشتیبانی‌شده یا پشتیبانی‌نشدهٔ سرور MCP و LSP را برای Pluginهای مبتنی بر bundle گزارش می‌دهد.

منابع Marketplace می‌توانند یک نام known-marketplace کلود از
`~/.claude/plugins/known_marketplaces.json`، یک root محلی marketplace یا
مسیر `marketplace.json`، یک shorthand گیت‌هاب مانند `owner/repo`، یک URL ریپازیتوری گیت‌هاب،
یا یک URL گیت باشند. برای marketplaceهای راه‌دور، ورودی‌های Plugin باید داخل
ریپازیتوری marketplace کلون‌شده بمانند و فقط از منابع مسیر نسبی استفاده کنند.

برای جزئیات کامل، [مرجع CLI `openclaw plugins`](/fa/cli/plugins) را ببینید.

## نمای کلی API مربوط به Plugin

Pluginهای native یک شیء entry صادر می‌کنند که `register(api)` را ارائه می‌دهد. Pluginهای قدیمی‌تر
ممکن است همچنان از `activate(api)` به‌عنوان alias قدیمی استفاده کنند، اما Pluginهای جدید باید
از `register` استفاده کنند.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw شیء entry را بارگذاری می‌کند و هنگام فعال‌سازی Plugin
`register(api)` را فراخوانی می‌کند. loader همچنان برای Pluginهای قدیمی‌تر به `activate(api)` fallback می‌کند،
اما Pluginهای bundleشده و Pluginهای خارجی جدید باید `register` را به‌عنوان
قرارداد عمومی در نظر بگیرند.

`api.registrationMode` به یک Plugin می‌گوید چرا entry آن در حال بارگذاری است:

| حالت | معنی |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | فعال‌سازی runtime. ابزارها، hookها، سرویس‌ها، commandها، routeها، و دیگر side effectهای زنده را ثبت کنید. |
| `discovery`     | کشف قابلیت فقط‌خواندنی. providerها و فراداده را ثبت کنید؛ کد entry مربوط به Plugin مورد اعتماد ممکن است بارگذاری شود، اما side effectهای زنده را رد کنید. |
| `setup-only`    | بارگذاری فرادادهٔ setup کانال از طریق یک entry سبک setup. |
| `setup-runtime` | بارگذاری setup کانال که به entry مربوط به runtime هم نیاز دارد. |
| `cli-metadata`  | فقط گردآوری فرادادهٔ command مربوط به CLI. |

entryهای Plugin که socket، database، worker پس‌زمینه، یا clientهای بلندمدت
باز می‌کنند باید آن side effectها را با `api.registrationMode === "full"` guard کنند.
بارگذاری‌های discovery جدا از بارگذاری‌های فعال‌سازی cache می‌شوند و
جایگزین رجیستری Gateway در حال اجرا نمی‌شوند. discovery غیرفعال‌کننده است، نه بدون import:
OpenClaw ممکن است entry مورد اعتماد Plugin یا ماژول Plugin کانال را برای ساخت
snapshot ارزیابی کند. سطح بالای ماژول‌ها را سبک و بدون side effect نگه دارید، و
clientهای شبکه، subprocessها، listenerها، خواندن credentialها، و راه‌اندازی service را
پشت مسیرهای full-runtime منتقل کنید.

روش‌های رایج ثبت:

| روش | آنچه ثبت می‌کند |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | provider مدل (LLM) |
| `registerChannel`                       | کانال chat |
| `registerTool`                          | ابزار agent |
| `registerHook` / `on(...)`              | hookهای lifecycle |
| `registerSpeechProvider`                | تبدیل متن به گفتار / STT |
| `registerRealtimeTranscriptionProvider` | STT جریانی |
| `registerRealtimeVoiceProvider`         | صدای realtime دوطرفه |
| `registerMediaUnderstandingProvider`    | تحلیل تصویر/صدا |
| `registerImageGenerationProvider`       | تولید تصویر |
| `registerMusicGenerationProvider`       | تولید موسیقی |
| `registerVideoGenerationProvider`       | تولید ویدئو |
| `registerWebFetchProvider`              | provider واکشی / scrape وب |
| `registerWebSearchProvider`             | جست‌وجوی وب |
| `registerHttpRoute`                     | endpoint مربوط به HTTP |
| `registerCommand` / `registerCli`       | commandهای CLI |
| `registerContextEngine`                 | موتور context |
| `registerService`                       | service پس‌زمینه |

رفتار guard مربوط به hook برای hookهای lifecycle نوع‌دار:

- `before_tool_call`: ‏`{ block: true }` نهایی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_tool_call`: ‏`{ block: false }` یک no-op است و block قبلی را پاک نمی‌کند.
- `before_install`: ‏`{ block: true }` نهایی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_install`: ‏`{ block: false }` یک no-op است و block قبلی را پاک نمی‌کند.
- `message_sending`: ‏`{ cancel: true }` نهایی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `message_sending`: ‏`{ cancel: false }` یک no-op است و cancel قبلی را پاک نمی‌کند.

app-server بومی Codex، eventهای ابزار بومی Codex را به این
سطح hook bridge می‌کند. Pluginها می‌توانند ابزارهای بومی Codex را از طریق `before_tool_call` مسدود کنند،
نتایج را از طریق `after_tool_call` مشاهده کنند، و در تأییدهای
`PermissionRequest` مربوط به Codex مشارکت کنند. bridge هنوز argumentهای ابزار بومی Codex را
بازنویسی نمی‌کند. مرز دقیق پشتیبانی runtime مربوط به Codex در
[قرارداد پشتیبانی v1 هارنس Codex](/fa/plugins/codex-harness#v1-support-contract) قرار دارد.

برای رفتار کامل hook نوع‌دار، [نمای کلی SDK](/fa/plugins/sdk-overview#hook-decision-semantics) را ببینید.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins) — Plugin خودتان را بسازید
- [bundleهای Plugin](/fa/plugins/bundles) — سازگاری bundle مربوط به Codex/Claude/Cursor
- [manifest مربوط به Plugin](/fa/plugins/manifest) — schema مربوط به manifest
- [ثبت ابزارها](/fa/plugins/building-plugins#registering-agent-tools) — افزودن ابزارهای agent در یک Plugin
- [جزئیات داخلی Plugin](/fa/plugins/architecture) — مدل قابلیت و pipeline بارگذاری
- [Pluginهای جامعه](/fa/plugins/community) — فهرست‌های شخص ثالث
