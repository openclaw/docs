---
read_when:
    - نصب یا پیکربندی Pluginها
    - آشنایی با قواعد کشف و بارگذاری Plugin
    - کار با بسته‌های Plugin سازگار با Codex/Claude
sidebarTitle: Install and Configure
summary: Pluginهای OpenClaw را نصب، پیکربندی و مدیریت کنید
title: Pluginها
x-i18n:
    generated_at: "2026-05-01T11:54:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1efa91ac4d78c6707a1e9e5cd5a5958642128a61b5873e169f66c7c2b954adb9
    source_path: tools/plugin.md
    workflow: 16
---

Plugin‌ها OpenClaw را با قابلیت‌های جدید گسترش می‌دهند: کانال‌ها، ارائه‌دهندگان مدل،
هارنس‌های عامل، ابزارها، Skills، گفتار، رونویسی بی‌درنگ، صدای بی‌درنگ،
درک رسانه، تولید تصویر، تولید ویدئو، دریافت وب، جست‌وجوی وب، و موارد دیگر.
برخی Plugin‌ها **هسته‌ای** هستند (همراه OpenClaw عرضه می‌شوند)، و برخی دیگر
**خارجی** هستند. بیشتر Plugin‌های خارجی از طریق
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

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

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

  <Step title="اعتبارسنجی Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    وقتی لازم است ابزارهای ثبت‌شده، سرویس‌ها، متدهای Gateway،
    هوک‌ها، یا فرمان‌های CLI متعلق به Plugin را اثبات کنید، از `--runtime` استفاده کنید.
    `inspect` ساده یک بررسی سرد manifest/registry است و عمدا از وارد کردن runtime Plugin
    پرهیز می‌کند.

  </Step>
</Steps>

اگر کنترل بومیِ چت را ترجیح می‌دهید، `commands.plugins: true` را فعال کنید و از این‌ها استفاده کنید:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

مسیر نصب از همان resolver مربوط به CLI استفاده می‌کند: مسیر/آرشیو محلی، مقدار صریح
`clawhub:<pkg>`، مقدار صریح `npm:<pkg>`، مقدار صریح `git:<repo>`، یا مشخصه بسته بدون پیشوند
(ابتدا ClawHub، سپس بازگشت به npm).

اگر پیکربندی نامعتبر باشد، نصب معمولا به‌صورت بسته شکست می‌خورد و شما را به
`openclaw doctor --fix` راهنمایی می‌کند. تنها استثنای بازیابی، یک مسیر باریک نصب دوباره
Plugin همراه برای Plugin‌هایی است که `openclaw.install.allowInvalidConfigRecovery` را فعال می‌کنند.
در هنگام راه‌اندازی Gateway، پیکربندی نامعتبر برای یک Plugin به همان Plugin محدود می‌شود:
راه‌اندازی، مشکل `plugins.entries.<id>.config` را در لاگ ثبت می‌کند، آن Plugin را هنگام
بارگذاری رد می‌کند، و سایر Plugin‌ها و کانال‌ها را آنلاین نگه می‌دارد. `openclaw doctor --fix`
را اجرا کنید تا پیکربندی بد Plugin با غیرفعال کردن آن ورودی Plugin و حذف محموله پیکربندی
نامعتبرش قرنطینه شود؛ نسخه پشتیبان عادی پیکربندی، مقادیر قبلی را نگه می‌دارد.
وقتی پیکربندی کانال به Pluginی ارجاع می‌دهد که دیگر قابل کشف نیست اما همان شناسه قدیمی
Plugin در پیکربندی Plugin یا سوابق نصب باقی مانده است، راه‌اندازی Gateway هشدارها را ثبت می‌کند
و به‌جای مسدود کردن همه کانال‌های دیگر، آن کانال را رد می‌کند. `openclaw doctor --fix`
را اجرا کنید تا ورودی‌های قدیمی کانال/Plugin حذف شوند؛ کلیدهای ناشناخته کانال بدون شواهد
Plugin قدیمی همچنان در اعتبارسنجی شکست می‌خورند تا خطاهای تایپی قابل مشاهده بمانند.
اگر `plugins.enabled: false` تنظیم شده باشد، ارجاع‌های قدیمی Plugin بی‌اثر در نظر گرفته می‌شوند:
راه‌اندازی Gateway کار کشف/بارگذاری Plugin را رد می‌کند و `openclaw doctor` به‌جای حذف خودکار،
پیکربندی Plugin غیرفعال را حفظ می‌کند. اگر می‌خواهید شناسه‌های قدیمی Plugin حذف شوند، پیش از
اجرای پاکسازی doctor، Plugin‌ها را دوباره فعال کنید.

نصب‌های بسته‌بندی‌شده OpenClaw درخت وابستگی runtime همه Plugin‌های همراه را مشتاقانه نصب نمی‌کنند.
وقتی یک Plugin همراه متعلق به OpenClaw از طریق پیکربندی Plugin، پیکربندی کانال قدیمی، یا یک
manifest فعال به‌صورت پیش‌فرض فعال باشد، راه‌اندازی فقط وابستگی‌های runtime اعلام‌شده همان
Plugin را پیش از وارد کردن آن تعمیر می‌کند. وضعیت احراز هویت کانال که به‌تنهایی پایدار شده باشد،
کانال همراه را برای تعمیر وابستگی runtime هنگام راه‌اندازی Gateway فعال نمی‌کند.
غیرفعال‌سازی صریح همچنان اولویت دارد: `plugins.entries.<id>.enabled: false`،
`plugins.deny`، `plugins.enabled: false`، و `channels.<id>.enabled: false`
از تعمیر خودکار وابستگی runtime همراه برای آن Plugin/کانال جلوگیری می‌کنند.
یک `plugins.allow` غیرخالی نیز تعمیر وابستگی runtime همراه فعال به‌صورت پیش‌فرض را محدود می‌کند؛
فعال‌سازی صریح کانال همراه (`channels.<id>.enabled: true`) همچنان می‌تواند وابستگی‌های Plugin
آن کانال را تعمیر کند.
Plugin‌های خارجی و مسیرهای بارگذاری سفارشی همچنان باید از طریق
`openclaw plugins install` نصب شوند.
برای چرخه کامل برنامه‌ریزی و مرحله‌بندی، [حل وابستگی Plugin](/fa/plugins/dependency-resolution) را ببینید.

## انواع Plugin

OpenClaw دو قالب Plugin را تشخیص می‌دهد:

| قالب       | نحوه کارکرد                                                       | نمونه‌ها                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **بومی** | `openclaw.plugin.json` + ماژول runtime؛ درون فرایند اجرا می‌شود       | Plugin‌های رسمی، بسته‌های npm جامعه               |
| **باندل** | چیدمان سازگار با Codex/Claude/Cursor؛ به قابلیت‌های OpenClaw نگاشت می‌شود | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

هر دو زیر `openclaw plugins list` نمایش داده می‌شوند. برای جزئیات باندل، [باندل‌های Plugin](/fa/plugins/bundles) را ببینید.

اگر در حال نوشتن یک Plugin بومی هستید، با [ساخت Plugin‌ها](/fa/plugins/building-plugins)
و [نمای کلی Plugin SDK](/fa/plugins/sdk-overview) شروع کنید.

## نقاط ورود بسته

بسته‌های npm مربوط به Plugin بومی باید `openclaw.extensions` را در `package.json` اعلام کنند.
هر ورودی باید داخل دایرکتوری بسته باقی بماند و به یک فایل runtime خواندنی
یا به یک فایل منبع TypeScript با همتای JavaScript ساخته‌شده و استنتاج‌شده، مانند `src/index.ts` به `dist/index.js`، resolve شود.

وقتی فایل‌های runtime منتشرشده در همان مسیرهای ورودی‌های منبع قرار ندارند، از
`openclaw.runtimeExtensions` استفاده کنید. وقتی وجود داشته باشد، `runtimeExtensions` باید
دقیقا برای هر ورودی `extensions` یک ورودی داشته باشد. فهرست‌های ناسازگار به‌جای بازگشت بی‌صدا
به مسیرهای منبع، نصب و کشف Plugin را با شکست مواجه می‌کنند.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Plugin‌های رسمی

### بسته‌های npm متعلق به OpenClaw در طول مهاجرت

ClawHub مسیر اصلی توزیع برای بیشتر Plugin‌ها است. انتشارهای بسته‌بندی‌شده فعلی OpenClaw
هم‌اکنون بسیاری از Plugin‌های رسمی را همراه خود دارند، بنابراین در راه‌اندازی‌های عادی به
نصب جداگانه npm نیاز ندارند. تا زمانی که هر Plugin متعلق به OpenClaw به ClawHub مهاجرت نکرده است،
OpenClaw همچنان برخی بسته‌های Plugin با نام `@openclaw/*` را برای نصب‌های قدیمی/سفارشی و
گردش‌کارهای مستقیم npm روی npm عرضه می‌کند.

اگر npm یک بسته Plugin با نام `@openclaw/*` را deprecated گزارش کند، آن نسخه بسته مربوط به
یک قطار بسته خارجی قدیمی‌تر است. تا زمانی که بسته npm جدیدتری منتشر شود، از Plugin همراه
در OpenClaw فعلی یا یک checkout محلی استفاده کنید.

| Plugin          | بسته                    | مستندات                                       |
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

  <Accordion title="Plugin‌های حافظه">
    - `memory-core` — جست‌وجوی حافظه همراه (پیش‌فرض از طریق `plugins.slots.memory`)
    - `memory-lancedb` — حافظه بلندمدت نصب‌شونده در زمان نیاز با یادآوری/ثبت خودکار (`plugins.slots.memory = "memory-lancedb"` را تنظیم کنید)

    برای راه‌اندازی embedding سازگار با OpenAI، نمونه‌های Ollama، محدودیت‌های یادآوری، و عیب‌یابی،
    [Memory LanceDB](/fa/plugins/memory-lancedb) را ببینید.

  </Accordion>

  <Accordion title="ارائه‌دهندگان گفتار (به‌صورت پیش‌فرض فعال)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="موارد دیگر">
    - `browser` — Plugin مرورگر همراه برای ابزار مرورگر، CLI مربوط به `openclaw browser`، متد Gateway به نام `browser.request`، runtime مرورگر، و سرویس پیش‌فرض کنترل مرورگر (به‌صورت پیش‌فرض فعال؛ پیش از جایگزینی آن را غیرفعال کنید)
    - `copilot-proxy` — پل VS Code Copilot Proxy (به‌صورت پیش‌فرض غیرفعال)

  </Accordion>
</AccordionGroup>

دنبال Plugin‌های شخص ثالث هستید؟ [Plugin‌های جامعه](/fa/plugins/community) را ببینید.

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
| `enabled`        | کلید اصلی فعال/غیرفعال‌سازی (پیش‌فرض: `true`)                           |
| `allow`          | فهرست مجاز Plugin‌ها (اختیاری)                               |
| `deny`           | فهرست ممنوع Plugin‌ها (اختیاری؛ ممنوعیت اولویت دارد)                     |
| `load.paths`     | فایل‌ها/دایرکتوری‌های اضافی Plugin                            |
| `slots`          | انتخاب‌گرهای اسلات انحصاری (مثلا `memory`، `contextEngine`) |
| `entries.\<id\>` | کلیدهای فعال/غیرفعال‌سازی + پیکربندی برای هر Plugin                               |

`plugins.allow` انحصاری است. وقتی غیرخالی باشد، فقط Plugin‌های فهرست‌شده می‌توانند بارگذاری شوند
یا ابزارها را عرضه کنند، حتی اگر `tools.allow` شامل `"*"` یا نام یک ابزار مشخص متعلق به Plugin باشد.
اگر فهرست مجاز ابزار به ابزارهای Plugin ارجاع می‌دهد، شناسه‌های Plugin مالک را به
`plugins.allow` اضافه کنید یا `plugins.allow` را حذف کنید؛ `openclaw doctor` درباره این شکل هشدار می‌دهد.

تغییرات پیکربندی **به راه‌اندازی دوباره Gateway نیاز دارند**. اگر Gateway با پایش پیکربندی
+ راه‌اندازی دوباره درون‌فرایندی فعال اجرا شود (مسیر پیش‌فرض `openclaw gateway`)، آن
راه‌اندازی دوباره معمولا کمی پس از نوشته شدن پیکربندی به‌صورت خودکار انجام می‌شود.
هیچ مسیر hot-reload پشتیبانی‌شده‌ای برای کد runtime بومی Plugin یا هوک‌های چرخه عمر وجود ندارد؛
پیش از انتظار برای اجرای کد به‌روزشده `register(api)`، هوک‌های `api.on(...)`، ابزارها، سرویس‌ها،
یا هوک‌های provider/runtime، فرایند Gateway را که کانال زنده را سرویس می‌دهد راه‌اندازی دوباره کنید.

`openclaw plugins list` یک snapshot محلی از registry/پیکربندی Plugin است. یک Plugin با وضعیت
`enabled` در آن‌جا یعنی registry پایدارشده و پیکربندی فعلی اجازه مشارکت به Plugin می‌دهند.
این ثابت نمی‌کند که فرزند Gateway راه‌دور که از قبل در حال اجراست، با همان کد Plugin دوباره
راه‌اندازی شده است. در راه‌اندازی‌های VPS/container با فرایندهای wrapper، راه‌اندازی دوباره را
به فرایند واقعی `openclaw gateway run` ارسال کنید، یا از `openclaw gateway restart` در برابر
Gateway در حال اجرا استفاده کنید.

<Accordion title="وضعیت‌های Plugin: غیرفعال در برابر مفقود در برابر نامعتبر">
  - **غیرفعال**: Plugin وجود دارد، اما قواعد فعال‌سازی آن را خاموش کرده‌اند. پیکربندی حفظ می‌شود.
  - **مفقود**: پیکربندی به شناسهٔ Plugin اشاره می‌کند که کشف آن را پیدا نکرده است.
  - **نامعتبر**: Plugin وجود دارد، اما پیکربندی آن با شِمای اعلام‌شده مطابقت ندارد. راه‌اندازی Gateway فقط همان Plugin را رد می‌کند؛ `openclaw doctor --fix` می‌تواند ورودی نامعتبر را با غیرفعال‌کردن آن و حذف بار پیکربندی‌اش قرنطینه کند.

</Accordion>

## کشف و اولویت

OpenClaw به این ترتیب برای یافتن Pluginها اسکن می‌کند (اولین تطابق برنده است):

<Steps>
  <Step title="مسیرهای پیکربندی">
    `plugins.load.paths` — مسیرهای صریح فایل یا پوشه. مسیرهایی که دوباره
    به پوشه‌های Plugin همراهِ بسته‌بندی‌شدهٔ خود OpenClaw اشاره کنند نادیده گرفته می‌شوند؛
    برای حذف آن aliasهای کهنه، `openclaw doctor --fix` را اجرا کنید.
  </Step>

  <Step title="Pluginهای فضای کاری">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` و `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Pluginهای سراسری">
    `~/.openclaw/<plugin-root>/*.ts` و `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Pluginهای همراه">
    همراه OpenClaw عرضه می‌شوند. بسیاری به‌طور پیش‌فرض فعال هستند (ارائه‌دهندگان مدل، گفتار).
    بقیه به فعال‌سازی صریح نیاز دارند.
  </Step>
</Steps>

نصب‌های بسته‌بندی‌شده و تصویرهای Docker معمولاً Pluginهای همراه را از درخت
کامپایل‌شدهٔ `dist/extensions` resolve می‌کنند. اگر یک پوشهٔ منبع Plugin همراه
روی مسیر منبع بسته‌بندی‌شدهٔ متناظر bind-mounted شود، برای مثال
`/app/extensions/synology-chat`، OpenClaw آن پوشهٔ منبع mount‌شده را
به‌عنوان overlay منبع همراه در نظر می‌گیرد و آن را پیش از بستهٔ
`/app/dist/extensions/synology-chat` کشف می‌کند. این کار چرخه‌های کانتینری
نگه‌دارندگان را بدون برگرداندن هر Plugin همراه به منبع TypeScript فعال نگه می‌دارد.
برای اجبار به استفاده از بسته‌های dist بسته‌بندی‌شده، حتی وقتی mountهای overlay منبع حاضرند،
`OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` را تنظیم کنید.

### قواعد فعال‌سازی

- `plugins.enabled: false` همهٔ Pluginها را غیرفعال می‌کند و کار کشف/بارگذاری Plugin را رد می‌کند
- `plugins.deny` همیشه بر allow غلبه می‌کند
- `plugins.entries.\<id\>.enabled: false` آن Plugin را غیرفعال می‌کند
- Pluginهای با مبدأ فضای کاری **به‌طور پیش‌فرض غیرفعال** هستند (باید صریحاً فعال شوند)
- Pluginهای همراه، مگر اینکه override شوند، از مجموعهٔ پیش‌فرض داخلیِ روشن پیروی می‌کنند
- slotهای انحصاری می‌توانند Plugin انتخاب‌شده برای آن slot را اجباری فعال کنند
- برخی Pluginهای همراهِ opt-in وقتی پیکربندی یک سطح متعلق به Plugin را نام ببرد،
  مانند ref مدل ارائه‌دهنده، پیکربندی channel، یا runtime harness،
  به‌طور خودکار فعال می‌شوند
- پیکربندی کهنهٔ Plugin تا وقتی `plugins.enabled: false` فعال است حفظ می‌شود؛
  اگر می‌خواهید شناسه‌های کهنه حذف شوند، پیش از اجرای پاک‌سازی doctor، Pluginها را دوباره فعال کنید
- مسیرهای Codex از خانوادهٔ OpenAI مرزهای جداگانهٔ Plugin را حفظ می‌کنند:
  `openai-codex/*` متعلق به Plugin OpenAI است، درحالی‌که Plugin همراه app-server مربوط به Codex
  با `agentRuntime.id: "codex"` یا refهای مدل legacy
  `codex/*` انتخاب می‌شود

## عیب‌یابی hookهای runtime

اگر یک Plugin در `plugins list` ظاهر می‌شود اما اثرهای جانبی یا hookهای `register(api)`
در ترافیک گفت‌وگوی زنده اجرا نمی‌شوند، ابتدا این موارد را بررسی کنید:

- `openclaw gateway status --deep --require-rpc` را اجرا کنید و تأیید کنید URL فعال
  Gateway، profile، مسیر پیکربندی، و process همان‌هایی هستند که ویرایش می‌کنید.
- پس از تغییرات نصب/پیکربندی/کد Plugin، Gateway زنده را restart کنید. در کانتینرهای wrapper،
  PID 1 ممکن است فقط یک supervisor باشد؛ process فرزند
  `openclaw gateway run` را restart یا signal کنید.
- از `openclaw plugins inspect <id> --runtime --json` برای تأیید ثبت hookها و
  diagnostics استفاده کنید. hookهای گفت‌وگوی غیرهمراه مانند `llm_input`,
  `llm_output`, `before_agent_finalize`, و `agent_end` به
  `plugins.entries.<id>.hooks.allowConversationAccess=true` نیاز دارند.
- برای تعویض مدل، `before_model_resolve` را ترجیح دهید. این hook پیش از
  resolution مدل برای turnهای agent اجرا می‌شود؛ `llm_output` فقط پس از آن اجرا می‌شود
  که یک تلاش مدل خروجی assistant تولید کند.
- برای اثبات مدل مؤثر session، از `openclaw sessions` یا سطح‌های
  session/status در Gateway استفاده کنید و هنگام debugging بارهای provider،
  Gateway را با `--raw-stream --raw-stream-path <path>` شروع کنید.

### مالکیت تکراری channel یا tool

نشانه‌ها:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

این‌ها یعنی بیش از یک Plugin فعال تلاش می‌کند مالک همان channel،
setup flow، یا نام tool باشد. رایج‌ترین علت، نصب یک Plugin خارجی channel
کنار یک Plugin همراه است که اکنون همان شناسهٔ channel را ارائه می‌دهد.

مراحل debugging:

- `openclaw plugins list --enabled --verbose` را اجرا کنید تا همهٔ Pluginهای فعال
  و مبدأ آن‌ها را ببینید.
- برای هر Plugin مشکوک، `openclaw plugins inspect <id> --runtime --json` را اجرا کنید و
  `channels`, `channelConfigs`, `tools`, و diagnostics را مقایسه کنید.
- پس از نصب یا حذف بسته‌های Plugin، `openclaw plugins registry --refresh` را اجرا کنید
  تا metadata پایدار، نصب فعلی را بازتاب دهد.
- پس از تغییرات نصب، registry، یا پیکربندی، Gateway را restart کنید.

گزینه‌های رفع:

- اگر یک Plugin عمداً جایگزین دیگری برای همان شناسهٔ channel می‌شود، Plugin
  ترجیحی باید `channelConfigs.<channel-id>.preferOver` را با
  شناسهٔ Plugin کم‌اولویت‌تر اعلام کند. [/plugins/manifest#replacing-another-channel-plugin](/fa/plugins/manifest#replacing-another-channel-plugin) را ببینید.
- اگر تکرار تصادفی است، یک طرف را با
  `plugins.entries.<plugin-id>.enabled: false` غیرفعال کنید یا نصب Plugin کهنه را
  حذف کنید.
- اگر هر دو Plugin را صریحاً فعال کرده‌اید، OpenClaw آن درخواست را نگه می‌دارد و
  تعارض را گزارش می‌کند. یک مالک برای channel انتخاب کنید یا toolهای متعلق به Plugin را
  تغییر نام دهید تا سطح runtime مبهم نباشد.

## slotهای Plugin (دسته‌های انحصاری)

برخی دسته‌ها انحصاری هستند (هر بار فقط یکی فعال است):

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

| Slot            | آنچه کنترل می‌کند      | پیش‌فرض             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin حافظهٔ فعال  | `memory-core`       |
| `contextEngine` | موتور context فعال | `legacy` (داخلی) |

## مرجع CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
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

Pluginهای همراه با OpenClaw عرضه می‌شوند. بسیاری به‌طور پیش‌فرض فعال هستند (برای مثال
ارائه‌دهندگان مدل همراه، ارائه‌دهندگان گفتار همراه، و Plugin مرورگر همراه).
Pluginهای همراه دیگر همچنان به `openclaw plugins enable <id>` نیاز دارند.

`--force` یک Plugin نصب‌شده یا hook pack موجود را در همان محل overwrite می‌کند. از
`openclaw plugins update <id-or-npm-spec>` برای ارتقاهای معمول Pluginهای npm
ردیابی‌شده استفاده کنید. این گزینه با `--link` پشتیبانی نمی‌شود، چون `--link` به‌جای
کپی روی یک هدف نصب مدیریت‌شده، مسیر منبع را دوباره استفاده می‌کند.

وقتی `plugins.allow` از قبل تنظیم شده باشد، `openclaw plugins install` شناسهٔ
Plugin نصب‌شده را پیش از فعال‌کردن آن به آن allowlist اضافه می‌کند. اگر همان شناسهٔ Plugin
در `plugins.deny` حاضر باشد، install آن ورودی deny کهنه را حذف می‌کند تا
نصب صریح پس از restart بلافاصله قابل بارگذاری باشد.

OpenClaw یک registry محلی پایدار برای Plugin نگه می‌دارد که مدل خواندن سرد برای
inventory Plugin، مالکیت contribution، و planning راه‌اندازی است. جریان‌های install، update،
uninstall، enable، و disable پس از تغییر وضعیت Plugin، آن registry را refresh می‌کنند.
همان فایل `plugins/installs.json` metadata پایدار install را در
`installRecords` سطح بالا و metadata بازساختنی manifest را در `plugins` نگه می‌دارد. اگر
registry مفقود، کهنه، یا نامعتبر باشد، `openclaw plugins registry
--refresh` نمای manifest آن را از رکوردهای install، policy پیکربندی، و
metadata مربوط به manifest/package بدون بارگذاری moduleهای runtime Plugin بازسازی می‌کند.
`openclaw plugins update <id-or-npm-spec>` روی installهای ردیابی‌شده اعمال می‌شود. دادن
یک npm package spec با dist-tag یا نسخهٔ دقیق، نام package را به رکورد Plugin ردیابی‌شده
resolve می‌کند و spec جدید را برای updateهای آینده ثبت می‌کند.
دادن نام package بدون نسخه، یک نصب دقیقاً pinned را به خط release پیش‌فرض
registry برمی‌گرداند. اگر Plugin نصب‌شدهٔ npm از قبل با نسخهٔ resolve‌شده
و هویت artifact ثبت‌شده مطابقت داشته باشد، OpenClaw بدون دانلود،
نصب دوباره، یا بازنویسی پیکربندی، update را رد می‌کند.

`--pin` فقط مخصوص npm است. با `--marketplace` پشتیبانی نمی‌شود، چون
installهای marketplace به‌جای npm spec، metadata منبع marketplace را پایدار می‌کنند.

`--dangerously-force-unsafe-install` یک override اضطراری برای positiveهای کاذب
scanner داخلی کد خطرناک است. این گزینه اجازه می‌دهد installهای Plugin
و updateهای Plugin از یافته‌های داخلی `critical` عبور کنند، اما همچنان
blockهای policy مربوط به `before_install` در Plugin یا blocking ناشی از شکست scan را دور نمی‌زند.
scanهای install برای جلوگیری از block شدن mockهای test بسته‌بندی‌شده، فایل‌ها و پوشه‌های رایج test
مانند `tests/`,
`__tests__/`, `*.test.*`, و `*.spec.*` را نادیده می‌گیرند؛
entrypointهای runtime اعلام‌شدهٔ Plugin همچنان scan می‌شوند، حتی اگر یکی از
آن نام‌ها را داشته باشند.

این flag در CLI فقط به جریان‌های install/update Plugin اعمال می‌شود. installهای وابستگی Skill
با پشتوانهٔ Gateway به‌جای آن از override درخواست متناظر `dangerouslyForceUnsafeInstall`
استفاده می‌کنند، درحالی‌که `openclaw skills install` همچنان جریان جداگانهٔ
دانلود/install Skill از ClawHub است.

اگر Pluginی که روی ClawHub منتشر کرده‌اید به‌خاطر scan پنهان یا block شده است، dashboard
ClawHub را باز کنید یا `clawhub package rescan <name>` را اجرا کنید تا از ClawHub بخواهید
دوباره آن را بررسی کند. `--dangerously-force-unsafe-install` فقط روی installها در دستگاه خودتان
اثر می‌گذارد؛ از ClawHub نمی‌خواهد Plugin را دوباره scan کند یا یک release مسدود را
عمومی کند.

باندل‌های سازگار در همان جریان فهرست/بازرسی/فعال‌سازی/غیرفعال‌سازی Plugin شرکت می‌کنند. پشتیبانی فعلی زمان اجرا شامل Skills باندل، command-skills در Claude، پیش‌فرض‌های `settings.json` در Claude، پیش‌فرض‌های `.lsp.json` در Claude و `lspServers` اعلام‌شده در manifest، command-skills در Cursor، و دایرکتوری‌های hook سازگار Codex است.

`openclaw plugins inspect <id>` همچنین قابلیت‌های باندل شناسایی‌شده به‌همراه ورودی‌های پشتیبانی‌شده یا پشتیبانی‌نشده سرورهای MCP و LSP را برای Pluginهای مبتنی بر باندل گزارش می‌کند.

منابع Marketplace می‌توانند یک نام marketplace شناخته‌شده Claude از `~/.claude/plugins/known_marketplaces.json`، یک ریشه marketplace محلی یا مسیر `marketplace.json`، یک کوتاه‌نویسی GitHub مانند `owner/repo`، یک URL مخزن GitHub، یا یک URL git باشند. برای marketplaceهای راه‌دور، ورودی‌های Plugin باید داخل مخزن marketplace کلون‌شده باقی بمانند و فقط از منابع مسیر نسبی استفاده کنند.

برای جزئیات کامل، [مرجع CLI ‏`openclaw plugins`](/fa/cli/plugins) را ببینید.

## نمای کلی API ‏Plugin

Pluginهای بومی یک شیء ورودی export می‌کنند که `register(api)` را در دسترس می‌گذارد. Pluginهای قدیمی‌تر ممکن است هنوز از `activate(api)` به‌عنوان نام مستعار legacy استفاده کنند، اما Pluginهای جدید باید از `register` استفاده کنند.

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

OpenClaw شیء ورودی را load می‌کند و هنگام فعال‌سازی Plugin، `register(api)` را فراخوانی می‌کند. loader همچنان برای Pluginهای قدیمی‌تر به `activate(api)` fallback می‌کند، اما Pluginهای همراه و Pluginهای خارجی جدید باید `register` را قرارداد عمومی بدانند.

`api.registrationMode` به Plugin می‌گوید چرا ورودی آن load شده است:

| حالت            | معنی                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | فعال‌سازی زمان اجرا. ابزارها، hookها، سرویس‌ها، فرمان‌ها، routeها، و دیگر اثرات جانبی زنده را ثبت کنید.                              |
| `discovery`     | کشف قابلیت فقط‌خواندنی. providerها و metadata را ثبت کنید؛ کد ورودی Plugin مورد اعتماد ممکن است load شود، اما اثرات جانبی زنده را رد کنید. |
| `setup-only`    | load کردن metadata راه‌اندازی کانال از طریق یک ورودی راه‌اندازی سبک.                                                                |
| `setup-runtime` | load کردن راه‌اندازی کانال که به ورودی زمان اجرا نیز نیاز دارد.                                                                         |
| `cli-metadata`  | فقط گردآوری metadata فرمان CLI.                                                                                            |

ورودی‌های Plugin که socket، database، workerهای پس‌زمینه، یا clientهای بلندمدت باز می‌کنند، باید آن اثرات جانبی را با `api.registrationMode === "full"` محافظت کنند. loadهای discovery جدا از loadهای فعال‌سازی cache می‌شوند و جایگزین registry در حال اجرای Gateway نمی‌شوند. discovery غیرفعال‌کننده است، نه بدون import: OpenClaw ممکن است ورودی Plugin مورد اعتماد یا ماژول Plugin کانال را برای ساخت snapshot ارزیابی کند. سطح‌های بالای ماژول را سبک و بدون اثر جانبی نگه دارید، و clientهای شبکه، subprocessها، listenerها، خواندن credentialها، و شروع سرویس را پشت مسیرهای full-runtime منتقل کنید.

روش‌های ثبت رایج:

| روش                                  | چه چیزی را ثبت می‌کند           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | provider مدل (LLM)        |
| `registerChannel`                       | کانال chat                |
| `registerTool`                          | ابزار agent                  |
| `registerHook` / `on(...)`              | hookهای چرخه عمر             |
| `registerSpeechProvider`                | متن‌به‌گفتار / STT        |
| `registerRealtimeTranscriptionProvider` | STT استریمینگ               |
| `registerRealtimeVoiceProvider`         | صدای realtime دوطرفه       |
| `registerMediaUnderstandingProvider`    | تحلیل تصویر/صدا        |
| `registerImageGenerationProvider`       | تولید تصویر            |
| `registerMusicGenerationProvider`       | تولید موسیقی            |
| `registerVideoGenerationProvider`       | تولید ویدئو            |
| `registerWebFetchProvider`              | provider دریافت / scrape وب |
| `registerWebSearchProvider`             | جست‌وجوی وب                  |
| `registerHttpRoute`                     | endpoint ‏HTTP               |
| `registerCommand` / `registerCli`       | فرمان‌های CLI                |
| `registerContextEngine`                 | موتور context              |
| `registerService`                       | سرویس پس‌زمینه          |

رفتار guard مربوط به hook برای hookهای چرخه عمر typed:

- `before_tool_call`: ‏`{ block: true }` نهایی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_tool_call`: ‏`{ block: false }` یک no-op است و block قبلی را پاک نمی‌کند.
- `before_install`: ‏`{ block: true }` نهایی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `before_install`: ‏`{ block: false }` یک no-op است و block قبلی را پاک نمی‌کند.
- `message_sending`: ‏`{ cancel: true }` نهایی است؛ handlerهای با اولویت پایین‌تر رد می‌شوند.
- `message_sending`: ‏`{ cancel: false }` یک no-op است و cancel قبلی را پاک نمی‌کند.

اجرای app-server بومی Codex، eventهای ابزار Codex-native را به این سطح hook bridge می‌کند. Pluginها می‌توانند ابزارهای بومی Codex را از طریق `before_tool_call` block کنند، نتایج را از طریق `after_tool_call` مشاهده کنند، و در approvalهای `PermissionRequest` در Codex مشارکت کنند. این bridge هنوز argumentهای ابزار Codex-native را بازنویسی نمی‌کند. مرز دقیق پشتیبانی زمان اجرای Codex در [قرارداد پشتیبانی v1 برای harness Codex](/fa/plugins/codex-harness#v1-support-contract) قرار دارد.

برای رفتار کامل hookهای typed، [نمای کلی SDK](/fa/plugins/sdk-overview#hook-decision-semantics) را ببینید.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins) — Plugin خودتان را بسازید
- [باندل‌های Plugin](/fa/plugins/bundles) — سازگاری باندل‌های Codex/Claude/Cursor
- [manifest ‏Plugin](/fa/plugins/manifest) — schema مربوط به manifest
- [ثبت ابزارها](/fa/plugins/building-plugins#registering-agent-tools) — افزودن ابزارهای agent در یک Plugin
- [درون‌ساخت Plugin](/fa/plugins/architecture) — مدل قابلیت و pipeline بارگذاری
- [Pluginهای جامعه](/fa/plugins/community) — فهرست‌های شخص ثالث
