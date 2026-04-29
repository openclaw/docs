---
read_when:
    - نصب یا پیکربندی Pluginها
    - آشنایی با قواعد کشف و بارگذاری Plugin
    - کار با بسته‌های Plugin سازگار با Codex/Claude
sidebarTitle: Install and Configure
summary: Pluginهای OpenClaw را نصب، پیکربندی و مدیریت کنید
title: Plugin‌ها
x-i18n:
    generated_at: "2026-04-29T23:45:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a12d158053c13b47a56d8d6b382818962e9b5109fdf8ededd3ecf92b83089e6
    source_path: tools/plugin.md
    workflow: 16
---

Pluginها OpenClaw را با قابلیت‌های جدید گسترش می‌دهند: کانال‌ها، ارائه‌دهندگان مدل،
مهارهای عامل، ابزارها، Skills، گفتار، رونویسی بی‌درنگ، صدای بی‌درنگ،
درک رسانه، تولید تصویر، تولید ویدئو، واکشی وب، جست‌وجوی وب،
و موارد دیگر. برخی Pluginها **هسته‌ای** هستند (همراه OpenClaw عرضه می‌شوند)، برخی دیگر
**خارجی** هستند. بیشتر Pluginهای خارجی از طریق
[ClawHub](/fa/tools/clawhub) منتشر و کشف می‌شوند. Npm همچنان برای نصب‌های مستقیم و برای
مجموعه‌ای موقت از بسته‌های Plugin متعلق به OpenClaw تا پایان این مهاجرت پشتیبانی می‌شود.

## شروع سریع

<Steps>
  <Step title="ببینید چه چیزی بارگذاری شده است">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="نصب یک Plugin">
    ```bash
    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="راه‌اندازی دوباره Gateway">
    ```bash
    openclaw gateway restart
    ```

    سپس در فایل پیکربندی خود، زیر `plugins.entries.\<id\>.config` پیکربندی کنید.

  </Step>
</Steps>

اگر کنترل بومیِ چت را ترجیح می‌دهید، `commands.plugins: true` را فعال کنید و از این‌ها استفاده کنید:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

مسیر نصب از همان حل‌کننده‌ی CLI استفاده می‌کند: مسیر/آرشیو محلی، `clawhub:<pkg>` صریح،
`npm:<pkg>` صریح، یا مشخصات بسته‌ی ساده (اول ClawHub، سپس
بازگشت به npm).

اگر پیکربندی نامعتبر باشد، نصب معمولاً بسته شکست می‌خورد و شما را به
`openclaw doctor --fix` ارجاع می‌دهد. تنها استثنای بازیابی، مسیر باریکِ نصب دوباره‌ی bundled-plugin
برای Pluginهایی است که `openclaw.install.allowInvalidConfigRecovery` را انتخاب می‌کنند.
هنگام شروع به کار Gateway، پیکربندی نامعتبر برای یک Plugin به همان Plugin محدود می‌شود:
شروع به کار، مشکل `plugins.entries.<id>.config` را در لاگ ثبت می‌کند، آن Plugin را هنگام
بارگذاری رد می‌کند، و Pluginها و کانال‌های دیگر را آنلاین نگه می‌دارد. `openclaw doctor --fix` را اجرا کنید
تا با غیرفعال‌کردن آن ورودی Plugin و حذف محموله‌ی پیکربندی نامعتبرش، پیکربندی بد Plugin را قرنطینه کنید؛ پشتیبان‌گیری عادی پیکربندی، مقادیر قبلی را نگه می‌دارد.
وقتی پیکربندی کانال به Pluginی ارجاع می‌دهد که دیگر قابل کشف نیست، اما همان شناسه‌ی کهنه‌ی Plugin در پیکربندی Plugin یا رکوردهای نصب باقی مانده است، شروع به کار Gateway
هشدارها را ثبت می‌کند و آن کانال را رد می‌کند، به‌جای اینکه همه‌ی کانال‌های دیگر را مسدود کند.
`openclaw doctor --fix` را اجرا کنید تا ورودی‌های کهنه‌ی کانال/Plugin حذف شوند؛ کلیدهای ناشناخته‌ی
کانال بدون شواهد Plugin کهنه همچنان اعتبارسنجی را ناموفق می‌کنند تا غلط‌های تایپی
قابل مشاهده بمانند.
اگر `plugins.enabled: false` تنظیم شده باشد، ارجاع‌های کهنه‌ی Plugin بی‌اثر در نظر گرفته می‌شوند:
شروع به کار Gateway کار کشف/بارگذاری Plugin را رد می‌کند و `openclaw doctor`
پیکربندی Plugin غیرفعال‌شده را به‌جای حذف خودکار آن حفظ می‌کند. اگر می‌خواهید شناسه‌های کهنه‌ی Plugin حذف شوند، پیش از اجرای پاک‌سازی doctor،
Pluginها را دوباره فعال کنید.

نصب‌های بسته‌بندی‌شده‌ی OpenClaw مشتاقانه کل درخت وابستگی‌های زمان اجرای هر Plugin همراه را نصب نمی‌کنند. وقتی یک Plugin متعلق به OpenClaw و همراه، از
پیکربندی Plugin، پیکربندی قدیمی کانال، یا manifest فعال‌شده به‌صورت پیش‌فرض فعال باشد، شروع به کار
فقط وابستگی‌های زمان اجرای اعلام‌شده‌ی همان Plugin را پیش از import کردن آن تعمیر می‌کند.
وضعیت احراز هویت کانالِ پایدارشده به‌تنهایی یک کانال همراه را برای
تعمیر وابستگی زمان اجرای Gateway هنگام شروع فعال نمی‌کند.
غیرفعال‌سازی صریح همچنان اولویت دارد: `plugins.entries.<id>.enabled: false`،
`plugins.deny`، `plugins.enabled: false`، و `channels.<id>.enabled: false`
از تعمیر خودکار وابستگی زمان اجرای همراه برای آن Plugin/کانال جلوگیری می‌کنند.
یک `plugins.allow` غیرخالی نیز تعمیر وابستگی زمان اجرای همراهِ فعال‌شده به‌صورت پیش‌فرض را محدود می‌کند؛ فعال‌سازی صریح کانال همراه (`channels.<id>.enabled: true`) همچنان می‌تواند
وابستگی‌های Plugin آن کانال را تعمیر کند.
Pluginهای خارجی و مسیرهای بارگذاری سفارشی همچنان باید از طریق
`openclaw plugins install` نصب شوند.

## انواع Plugin

OpenClaw دو قالب Plugin را می‌شناسد:

| قالب       | نحوه‌ی کار                                                       | نمونه‌ها                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + ماژول زمان اجرا؛ درون‌فرایندی اجرا می‌شود       | Pluginهای رسمی، بسته‌های npm جامعه               |
| **Bundle** | چیدمان سازگار با Codex/Claude/Cursor؛ به قابلیت‌های OpenClaw نگاشت می‌شود | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

هر دو زیر `openclaw plugins list` نمایش داده می‌شوند. برای جزئیات bundle، [Plugin Bundles](/fa/plugins/bundles) را ببینید.

اگر در حال نوشتن یک Plugin native هستید، با [Building Plugins](/fa/plugins/building-plugins)
و [Plugin SDK Overview](/fa/plugins/sdk-overview) شروع کنید.

## نقطه‌های ورود بسته

بسته‌های npm مربوط به Pluginهای native باید `openclaw.extensions` را در `package.json` اعلام کنند.
هر ورودی باید داخل دایرکتوری بسته بماند و به یک فایل زمان اجرای خواندنی
یا به یک فایل منبع TypeScript با همتای JavaScript ساخته‌شده‌ی استنتاج‌شده
مانند `src/index.ts` به `dist/index.js` resolve شود.

وقتی فایل‌های زمان اجرای منتشرشده در همان مسیرهای ورودی‌های منبع قرار ندارند، از `openclaw.runtimeExtensions` استفاده کنید. وقتی وجود داشته باشد، `runtimeExtensions` باید
دقیقاً برای هر ورودی `extensions` یک ورودی داشته باشد. فهرست‌های نامنطبق باعث شکست نصب و
کشف Plugin می‌شوند، نه اینکه بی‌صدا به مسیرهای منبع بازگردند.

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

### بسته‌های npm متعلق به OpenClaw در دوره‌ی مهاجرت

ClawHub مسیر اصلی توزیع برای بیشتر Pluginها است. انتشارهای بسته‌بندی‌شده‌ی فعلی
OpenClaw از قبل بسیاری از Pluginهای رسمی را همراه دارند، بنابراین در راه‌اندازی‌های معمول
به نصب جداگانه‌ی npm نیاز ندارند. تا زمانی که همه‌ی Pluginهای متعلق به OpenClaw
به ClawHub مهاجرت کنند، OpenClaw همچنان برخی بسته‌های Plugin با نام `@openclaw/*` را روی
npm برای نصب‌های قدیمی‌تر/سفارشی و گردش‌کارهای مستقیم npm عرضه می‌کند.

اگر npm یک بسته‌ی Plugin با نام `@openclaw/*` را deprecated گزارش کند، آن نسخه‌ی بسته
از یک قطار بسته‌ی خارجی قدیمی‌تر است. تا زمانی که بسته‌ی npm جدیدتری منتشر شود، از Plugin همراهِ
OpenClaw فعلی یا یک checkout محلی استفاده کنید.

| Plugin          | بسته                       | مستندات                                    |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/fa/channels/bluebubbles)       |
| Discord         | `@openclaw/discord`        | [Discord](/fa/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/fa/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/fa/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/fa/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/fa/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/fa/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/fa/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/fa/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/fa/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/fa/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/fa/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/fa/plugins/zalouser)         |

### هسته (همراه OpenClaw عرضه می‌شود)

<AccordionGroup>
  <Accordion title="ارائه‌دهندگان مدل (به‌صورت پیش‌فرض فعال)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Pluginهای حافظه">
    - `memory-core` — جست‌وجوی حافظه‌ی همراه (پیش‌فرض از طریق `plugins.slots.memory`)
    - `memory-lancedb` — حافظه‌ی بلندمدت نصب‌شونده هنگام نیاز با یادآوری/ثبت خودکار (`plugins.slots.memory = "memory-lancedb"` را تنظیم کنید)

    برای راه‌اندازی embedding سازگار با OpenAI، نمونه‌های Ollama، محدودیت‌های یادآوری، و عیب‌یابی، [Memory LanceDB](/fa/plugins/memory-lancedb) را ببینید.

  </Accordion>

  <Accordion title="ارائه‌دهندگان گفتار (به‌صورت پیش‌فرض فعال)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="سایر موارد">
    - `browser` — Plugin مرورگر همراه برای ابزار مرورگر، CLI ‏`openclaw browser`، متد gateway ‏`browser.request`، زمان اجرای مرورگر، و سرویس کنترل مرورگر پیش‌فرض (به‌صورت پیش‌فرض فعال؛ پیش از جایگزینی آن را غیرفعال کنید)
    - `copilot-proxy` — پل VS Code Copilot Proxy (به‌صورت پیش‌فرض غیرفعال)

  </Accordion>
</AccordionGroup>

دنبال Pluginهای شخص ثالث هستید؟ [Community Plugins](/fa/plugins/community) را ببینید.

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

| فیلد            | توضیح                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | کلید اصلی فعال/غیرفعال (پیش‌فرض: `true`)                           |
| `allow`          | فهرست مجاز Pluginها (اختیاری)                               |
| `deny`           | فهرست ممنوع Pluginها (اختیاری؛ deny اولویت دارد)                     |
| `load.paths`     | فایل‌ها/دایرکتوری‌های اضافی Plugin                            |
| `slots`          | انتخاب‌گرهای slot انحصاری (مثلاً `memory`، `contextEngine`) |
| `entries.\<id\>` | کلیدهای فعال/غیرفعال و پیکربندی برای هر Plugin                               |

تغییرات پیکربندی **به راه‌اندازی دوباره‌ی gateway نیاز دارند**. اگر Gateway با watch پیکربندی
و راه‌اندازی دوباره‌ی درون‌فرایندی فعال اجرا می‌شود (مسیر پیش‌فرض `openclaw gateway`)، آن
راه‌اندازی دوباره معمولاً اندکی پس از نوشته‌شدن پیکربندی به‌صورت خودکار انجام می‌شود.
هیچ مسیر hot-reload پشتیبانی‌شده‌ای برای کد زمان اجرای Plugin native یا hookهای چرخه‌ی عمر
وجود ندارد؛ پیش از انتظار اجرای کد `register(api)` به‌روزشده، hookهای `api.on(...)`، ابزارها، سرویس‌ها، یا
hookهای provider/runtime، فرایند Gatewayی را که کانال زنده را سرویس می‌دهد دوباره راه‌اندازی کنید.

`openclaw plugins list` یک snapshot محلی از رجیستری/پیکربندی Plugin است. یک Plugin
`enabled` در آنجا یعنی رجیستری پایدارشده و پیکربندی فعلی اجازه می‌دهند
Plugin مشارکت کند. این ثابت نمی‌کند که فرزند Gateway دوردستِ از قبل در حال اجرا
با همان کد Plugin دوباره راه‌اندازی شده است. در راه‌اندازی‌های VPS/container با
فرایندهای wrapper، راه‌اندازی دوباره را به فرایند واقعی `openclaw gateway run` بفرستید،
یا از `openclaw gateway restart` روی Gateway در حال اجرا استفاده کنید.

<Accordion title="وضعیت‌های Plugin: غیرفعال در برابر مفقود در برابر نامعتبر">
  - **غیرفعال**: Plugin وجود دارد اما قواعد فعال‌سازی آن را خاموش کرده‌اند. پیکربندی حفظ می‌شود.
  - **مفقود**: پیکربندی به شناسه‌ی Pluginی ارجاع می‌دهد که discovery آن را پیدا نکرده است.
  - **نامعتبر**: Plugin وجود دارد اما پیکربندی آن با schema اعلام‌شده سازگار نیست. شروع به کار Gateway فقط همان Plugin را رد می‌کند؛ `openclaw doctor --fix` می‌تواند با غیرفعال‌کردن آن و حذف محموله‌ی پیکربندی‌اش، ورودی نامعتبر را قرنطینه کند.

</Accordion>

## کشف و اولویت

OpenClaw برای Pluginها به این ترتیب اسکن می‌کند (اولین تطبیق برنده است):

<Steps>
  <Step title="مسیرهای پیکربندی">
    `plugins.load.paths` — مسیرهای صریح فایل یا دایرکتوری. مسیرهایی که به
    دایرکتوری‌های Plugin همراهِ بسته‌بندی‌شده‌ی خود OpenClaw برمی‌گردند نادیده گرفته می‌شوند؛
    برای حذف آن aliasهای کهنه، `openclaw doctor --fix` را اجرا کنید.
  </Step>

  <Step title="Pluginهای workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Pluginهای سراسری">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Pluginهای همراه">
    همراه OpenClaw عرضه می‌شوند. بسیاری به‌صورت پیش‌فرض فعال هستند (ارائه‌دهندگان مدل، گفتار).
    برخی دیگر نیازمند فعال‌سازی صریح هستند.
  </Step>
</Steps>

نصب‌های بسته‌بندی‌شده و تصویرهای Docker معمولاً Pluginهای همراه را از درخت
کامپایل‌شده‌ی `dist/extensions` resolve می‌کنند. اگر یک دایرکتوری منبع Plugin همراه
روی مسیر منبع بسته‌بندی‌شده‌ی متناظر bind-mount شود، برای مثال
`/app/extensions/synology-chat`، OpenClaw آن دایرکتوری منبع mount‌شده را
به‌عنوان یک overlay منبع همراه در نظر می‌گیرد و آن را پیش از bundle بسته‌بندی‌شده‌ی
`/app/dist/extensions/synology-chat` کشف می‌کند. این کار loopهای container مربوط به
نگه‌دارندگان را بدون برگرداندن هر Plugin همراه به منبع TypeScript فعال نگه می‌دارد.
`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` را تنظیم کنید تا حتی وقتی mountهای
source overlay وجود دارند، dist bundleهای بسته‌بندی‌شده اجباراً استفاده شوند.

### قواعد فعال‌سازی

- `plugins.enabled: false` همه‌ی Pluginها را غیرفعال می‌کند و کار کشف/بارگذاری Plugin را رد می‌کند
- `plugins.deny` همیشه بر allow غلبه دارد
- `plugins.entries.\<id\>.enabled: false` آن Plugin را غیرفعال می‌کند
- Pluginهای با خاستگاه Workspace به‌صورت **پیش‌فرض غیرفعال** هستند (باید صریحاً فعال شوند)
- Pluginهای همراه، مگر اینکه override شوند، از مجموعه‌ی built-in پیش‌فرض-روشن پیروی می‌کنند
- slotهای انحصاری می‌توانند Plugin انتخاب‌شده برای آن slot را force-enable کنند
- برخی Pluginهای همراه opt-in وقتی config یک سطح متعلق به Plugin را نام می‌برد، مانند ref مدل provider، config کانال، یا runtime harness، به‌صورت خودکار فعال می‌شوند
- config کهنه‌ی Plugin تا وقتی `plugins.enabled: false` فعال است حفظ می‌شود؛ اگر می‌خواهید idهای کهنه حذف شوند، پیش از اجرای پاک‌سازی doctor دوباره Pluginها را فعال کنید
- routeهای Codex خانواده‌ی OpenAI مرزهای Plugin جداگانه را نگه می‌دارند:
  `openai-codex/*` متعلق به Plugin OpenAI است، در حالی که Plugin app-server همراه Codex
  با `agentRuntime.id: "codex"` یا refهای مدل legacy
  `codex/*` انتخاب می‌شود

## عیب‌یابی hookهای runtime

اگر یک Plugin در `plugins list` دیده می‌شود اما side effectها یا hookهای
`register(api)` در traffic چت زنده اجرا نمی‌شوند، ابتدا این موارد را بررسی کنید:

- `openclaw gateway status --deep --require-rpc` را اجرا کنید و تأیید کنید URL فعال
  Gateway، profile، مسیر config، و process همان‌هایی هستند که ویرایش می‌کنید.
- پس از تغییرات نصب/config/code مربوط به Plugin، Gateway زنده را restart کنید. در containerهای wrapper،
  PID 1 ممکن است فقط supervisor باشد؛ process فرزند
  `openclaw gateway run` را restart یا signal کنید.
- از `openclaw plugins inspect <id> --json` برای تأیید ثبت hookها و
  diagnostics استفاده کنید. hookهای conversation غیرهمراه مانند `llm_input`,
  `llm_output`, `before_agent_finalize`, و `agent_end` به
  `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.
- برای تعویض مدل، `before_model_resolve` را ترجیح دهید. این hook پیش از
  resolution مدل برای turnهای agent اجرا می‌شود؛ `llm_output` فقط پس از آن اجرا می‌شود
  که تلاش مدل output دستیار تولید کرده باشد.
- برای اثبات مدل session مؤثر، از `openclaw sessions` یا سطح‌های session/status در
  Gateway استفاده کنید و، هنگام debug کردن payloadهای provider، Gateway را با
  `--raw-stream --raw-stream-path <path>` شروع کنید.

### مالکیت تکراری کانال یا tool

نشانه‌ها:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

این‌ها یعنی بیش از یک Plugin فعال تلاش می‌کند مالک همان کانال،
flow setup، یا نام tool باشد. رایج‌ترین علت، نصب یک Plugin کانال خارجی
در کنار یک Plugin همراه است که اکنون همان channel id را ارائه می‌کند.

گام‌های debug:

- `openclaw plugins list --enabled --verbose` را اجرا کنید تا همه‌ی Pluginهای فعال
  و خاستگاه آن‌ها را ببینید.
- برای هر Plugin مشکوک `openclaw plugins inspect <id> --json` را اجرا کنید و
  `channels`, `channelConfigs`, `tools`, و diagnostics را مقایسه کنید.
- پس از نصب یا حذف packageهای Plugin، `openclaw plugins registry --refresh` را اجرا کنید
  تا metadata ماندگار وضعیت نصب فعلی را بازتاب دهد.
- پس از تغییرات نصب، registry، یا config، Gateway را restart کنید.

گزینه‌های رفع:

- اگر یک Plugin عمداً دیگری را برای همان channel id جایگزین می‌کند، Plugin
  ترجیحی باید `channelConfigs.<channel-id>.preferOver` را با
  id مربوط به Plugin کم‌اولویت‌تر declare کند. [/plugins/manifest#replacing-another-channel-plugin](/fa/plugins/manifest#replacing-another-channel-plugin) را ببینید.
- اگر تکرار تصادفی است، یک طرف را با
  `plugins.entries.<plugin-id>.enabled: false` غیرفعال کنید یا نصب Plugin
  کهنه را حذف کنید.
- اگر هر دو Plugin را صریحاً فعال کرده‌اید، OpenClaw آن درخواست را نگه می‌دارد و
  conflict را گزارش می‌کند. یک مالک برای کانال انتخاب کنید یا toolهای متعلق به Plugin را
  تغییر نام دهید تا سطح runtime ابهام نداشته باشد.

## slotهای Plugin (دسته‌های انحصاری)

برخی دسته‌ها انحصاری هستند (در هر زمان فقط یکی فعال است):

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
| `memory`        | Plugin حافظه‌ی فعال  | `memory-core`       |
| `contextEngine` | موتور context فعال | `legacy` (built-in) |

## مرجع CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # deep detail
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

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Pluginهای همراه با OpenClaw عرضه می‌شوند. بسیاری به‌صورت پیش‌فرض فعال هستند (برای مثال
ارائه‌دهندگان مدل همراه، ارائه‌دهندگان گفتار همراه، و Plugin مرورگر همراه).
سایر Pluginهای همراه همچنان به `openclaw plugins enable <id>` نیاز دارند.

`--force` یک Plugin نصب‌شده یا hook pack موجود را درجا overwrite می‌کند. برای
ارتقاهای معمول Pluginهای npm ردیابی‌شده از
`openclaw plugins update <id-or-npm-spec>` استفاده کنید. این گزینه با `--link` پشتیبانی نمی‌شود،
چون `--link` به‌جای کپی‌کردن روی target نصب managed، از مسیر منبع دوباره استفاده می‌کند.

وقتی `plugins.allow` از قبل تنظیم شده باشد، `openclaw plugins install` id مربوط به
Plugin نصب‌شده را پیش از فعال‌کردن آن به آن allowlist اضافه می‌کند. اگر همان Plugin id
در `plugins.deny` وجود داشته باشد، install آن entry کهنه‌ی deny را حذف می‌کند تا نصب صریح
بلافاصله پس از restart قابل بارگذاری باشد.

OpenClaw یک registry محلی ماندگار Plugin را به‌عنوان مدل cold read برای
inventory Plugin، مالکیت contribution، و برنامه‌ریزی startup نگه می‌دارد. flowهای install، update،
uninstall، enable، و disable پس از تغییر وضعیت Plugin آن registry را refresh می‌کنند.
همان فایل `plugins/installs.json` metadata نصب بادوام را در
`installRecords` سطح بالا و metadata قابل rebuild مربوط به manifest را در `plugins` نگه می‌دارد. اگر
registry وجود نداشته باشد، کهنه باشد، یا invalid باشد، `openclaw plugins registry
--refresh` نمای manifest آن را از install recordها، policy config، و
metadata manifest/package بدون بارگذاری moduleهای runtime Plugin بازسازی می‌کند.
`openclaw plugins update <id-or-npm-spec>` برای نصب‌های ردیابی‌شده اعمال می‌شود. ارسال
یک spec package npm با dist-tag یا version دقیق، نام package را
به record ردیابی‌شده‌ی Plugin resolve می‌کند و spec جدید را برای updateهای آینده ثبت می‌کند.
ارسال نام package بدون version، نصب دقیق pinned را به
release line پیش‌فرض registry برمی‌گرداند. اگر Plugin npm نصب‌شده از قبل با
version resolve‌شده و هویت artifact ثبت‌شده مطابقت داشته باشد، OpenClaw update را
بدون download، reinstall، یا بازنویسی config رد می‌کند.

`--pin` فقط برای npm است. با `--marketplace` پشتیبانی نمی‌شود، چون
نصب‌های marketplace به‌جای spec npm، metadata منبع marketplace را ماندگار می‌کنند.

`--dangerously-force-unsafe-install` یک override اضطراری برای false positiveهای
scanner داخلی dangerous-code است. این اجازه می‌دهد installهای Plugin
و updateهای Plugin از findingهای built-in با شدت `critical` عبور کنند، اما همچنان
blockهای policy مربوط به `before_install` در Plugin یا blocking ناشی از scan-failure را bypass نمی‌کند.
scanهای install فایل‌ها و دایرکتوری‌های رایج test مانند `tests/`,
`__tests__/`, `*.test.*`, و `*.spec.*` را ignore می‌کنند تا test mockهای package‌شده مانع نشوند؛
entrypointهای runtime اعلام‌شده‌ی Plugin همچنان scan می‌شوند حتی اگر از یکی از
آن نام‌ها استفاده کنند.

این flag در CLI فقط برای flowهای install/update مربوط به Plugin اعمال می‌شود. نصب‌های dependency مربوط به skill
که پشتوانه‌ی Gateway دارند به‌جای آن از override درخواست متناظر
`dangerouslyForceUnsafeInstall` استفاده می‌کنند، در حالی که `openclaw skills install` همچنان flow جداگانه‌ی
download/install مربوط به skill در ClawHub باقی می‌ماند.

اگر Pluginی که روی ClawHub منتشر کرده‌اید توسط scan پنهان یا block شده است، dashboard
ClawHub را باز کنید یا `clawhub package rescan <name>` را اجرا کنید تا از ClawHub بخواهید
آن را دوباره بررسی کند. `--dangerously-force-unsafe-install` فقط روی نصب‌ها در ماشین خودتان اثر می‌گذارد؛
از ClawHub نمی‌خواهد Plugin را دوباره scan کند یا یک release مسدودشده را
عمومی کند.

bundleهای سازگار در همان flowهای list/inspect/enable/disable مربوط به Plugin شرکت می‌کنند.
پشتیبانی runtime فعلی شامل Skills مربوط به bundle، command-skillهای Claude،
پیش‌فرض‌های `settings.json` مربوط به Claude، پیش‌فرض‌های Claude `.lsp.json` و
`lspServers` اعلام‌شده در manifest، command-skillهای Cursor، و دایرکتوری‌های hook
سازگار Codex است.

`openclaw plugins inspect <id>` همچنین capabilityهای شناسایی‌شده‌ی bundle به‌علاوه
entryهای پشتیبانی‌شده یا پشتیبانی‌نشده‌ی server مربوط به MCP و LSP را برای Pluginهای پشتوانه‌شده با bundle گزارش می‌کند.

منبع‌های Marketplace می‌توانند یک نام marketplace شناخته‌شده‌ی Claude از
`~/.claude/plugins/known_marketplaces.json`، یک root marketplace محلی یا
مسیر `marketplace.json`، یک shorthand گیت‌هاب مانند `owner/repo`، یک URL repo در
GitHub، یا یک git URL باشند. برای marketplaceهای remote، entryهای Plugin باید داخل
repo marketplace clone‌شده باقی بمانند و فقط از منبع‌های path نسبی استفاده کنند.

برای جزئیات کامل، [مرجع CLI مربوط به `openclaw plugins`](/fa/cli/plugins) را ببینید.

## مرور کلی API مربوط به Plugin

Pluginهای native یک object ورودی export می‌کنند که `register(api)` را expose می‌کند. Pluginهای قدیمی‌تر
ممکن است همچنان از `activate(api)` به‌عنوان alias legacy استفاده کنند، اما Pluginهای جدید باید
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

OpenClaw object ورودی را بارگذاری می‌کند و هنگام activation Plugin،
`register(api)` را فراخوانی می‌کند. loader همچنان برای Pluginهای قدیمی‌تر به
`activate(api)` fallback می‌کند، اما Pluginهای همراه و Pluginهای خارجی جدید باید
`register` را قرارداد عمومی بدانند.

`api.registrationMode` به یک Plugin می‌گوید چرا entry آن در حال بارگذاری است:

| حالت            | معنا                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | فعال‌سازی زمان اجرا. ابزارها، hookها، سرویس‌ها، commandها، routeها و دیگر اثرات جانبی زنده را ثبت می‌کند.                              |
| `discovery`     | کشف قابلیت فقط‌خواندنی. providerها و فراداده را ثبت می‌کند؛ کد ورودی Plugin معتمد ممکن است بارگذاری شود، اما اثرات جانبی زنده نادیده گرفته می‌شوند. |
| `setup-only`    | بارگذاری فراداده راه‌اندازی channel از طریق یک ورودی راه‌اندازی سبک.                                                                |
| `setup-runtime` | بارگذاری راه‌اندازی channel که به ورودی زمان اجرا نیز نیاز دارد.                                                                         |
| `cli-metadata`  | فقط گردآوری فراداده commandهای CLI.                                                                                            |

ورودی‌های Plugin که socketها، databaseها، workerهای پس‌زمینه یا clientهای دیرپا را باز می‌کنند باید آن اثرات جانبی را با `api.registrationMode === "full"` محافظت کنند.
بارگذاری‌های discovery جدا از بارگذاری‌های فعال‌سازی cache می‌شوند و registry در حال اجرای Gateway را جایگزین نمی‌کنند. discovery غیرفعال‌کننده است، اما بدون واردسازی نیست:
OpenClaw ممکن است ورودی Plugin معتمد یا ماژول Plugin مربوط به channel را برای ساخت snapshot ارزیابی کند. سطح بالای ماژول‌ها را سبک و بدون اثر جانبی نگه دارید و clientهای شبکه، subprocessها، listenerها، خواندن credentialها و راه‌اندازی سرویس را پشت مسیرهای زمان اجرای کامل منتقل کنید.

روش‌های رایج ثبت:

| روش                                  | آنچه ثبت می‌کند           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | provider مدل (LLM)        |
| `registerChannel`                       | channel چت                |
| `registerTool`                          | ابزار agent                  |
| `registerHook` / `on(...)`              | hookهای چرخه عمر             |
| `registerSpeechProvider`                | تبدیل متن به گفتار / STT        |
| `registerRealtimeTranscriptionProvider` | STT استریمینگ               |
| `registerRealtimeVoiceProvider`         | صدای realtime دوطرفه       |
| `registerMediaUnderstandingProvider`    | تحلیل تصویر/صدا        |
| `registerImageGenerationProvider`       | تولید تصویر            |
| `registerMusicGenerationProvider`       | تولید موسیقی            |
| `registerVideoGenerationProvider`       | تولید ویدئو            |
| `registerWebFetchProvider`              | provider دریافت / scrape وب |
| `registerWebSearchProvider`             | جست‌وجوی وب                  |
| `registerHttpRoute`                     | endpoint HTTP               |
| `registerCommand` / `registerCli`       | commandهای CLI                |
| `registerContextEngine`                 | موتور context              |
| `registerService`                       | سرویس پس‌زمینه          |

رفتار guard مربوط به hook برای hookهای چرخه عمر typeدار:

- `before_tool_call`: `{ block: true }` پایانی است؛ handlerهای با اولویت پایین‌تر نادیده گرفته می‌شوند.
- `before_tool_call`: `{ block: false }` بدون اثر است و block قبلی را پاک نمی‌کند.
- `before_install`: `{ block: true }` پایانی است؛ handlerهای با اولویت پایین‌تر نادیده گرفته می‌شوند.
- `before_install`: `{ block: false }` بدون اثر است و block قبلی را پاک نمی‌کند.
- `message_sending`: `{ cancel: true }` پایانی است؛ handlerهای با اولویت پایین‌تر نادیده گرفته می‌شوند.
- `message_sending`: `{ cancel: false }` بدون اثر است و cancel قبلی را پاک نمی‌کند.

app-server بومی Codex، eventهای ابزار بومی Codex را از طریق bridge به این سطح hook برمی‌گرداند. Pluginها می‌توانند ابزارهای بومی Codex را از طریق `before_tool_call` مسدود کنند، نتایج را از طریق `after_tool_call` مشاهده کنند و در تأییدیه‌های `PermissionRequest` مربوط به Codex مشارکت داشته باشند. bridge هنوز argumentهای ابزار بومی Codex را بازنویسی نمی‌کند. مرز دقیق پشتیبانی زمان اجرای Codex در [قرارداد پشتیبانی harness v1 Codex](/fa/plugins/codex-harness#v1-support-contract) قرار دارد.

برای رفتار کامل hookهای typeدار، [مرور کلی SDK](/fa/plugins/sdk-overview#hook-decision-semantics) را ببینید.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins) — Plugin خودتان را ایجاد کنید
- [بسته‌های Plugin](/fa/plugins/bundles) — سازگاری bundleهای Codex/Claude/Cursor
- [manifest Plugin](/fa/plugins/manifest) — schema مربوط به manifest
- [ثبت ابزارها](/fa/plugins/building-plugins#registering-agent-tools) — ابزارهای agent را در یک Plugin اضافه کنید
- [جزئیات داخلی Plugin](/fa/plugins/architecture) — مدل قابلیت و pipeline بارگذاری
- [Pluginهای جامعه](/fa/plugins/community) — فهرست‌های شخص ثالث
