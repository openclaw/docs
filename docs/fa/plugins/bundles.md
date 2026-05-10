---
read_when:
    - می‌خواهید یک بستهٔ سازگار با Codex، Claude یا Cursor نصب کنید
    - باید بدانید که OpenClaw چگونه محتوای بسته را به ویژگی‌های بومی نگاشت می‌کند
    - در حال اشکال‌زدایی شناسایی باندل یا قابلیت‌های مفقود هستید
summary: نصب و استفاده از بسته‌های Codex، Claude و Cursor به‌عنوان Plugin‌های OpenClaw
title: بسته‌های Plugin
x-i18n:
    generated_at: "2026-05-10T19:52:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f92bb91369f0f5ddd8d960962e875323bb53173b4faebe4ef453d2f2a08826
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw می‌تواند Pluginها را از سه اکوسیستم خارجی نصب کند: **Codex**، **Claude**،
و **Cursor**. به این‌ها **بسته‌ها** گفته می‌شود — بسته‌های محتوا و فراداده‌ای که
OpenClaw آن‌ها را به قابلیت‌های بومی مانند skills، hookها و ابزارهای MCP نگاشت می‌کند.

<Info>
  بسته‌ها همان Pluginهای بومی OpenClaw نیستند. Pluginهای بومی درون‌پردازه‌ای اجرا می‌شوند
  و می‌توانند هر قابلیتی را ثبت کنند. بسته‌ها بسته‌های محتوایی با نگاشت انتخابی قابلیت‌ها
  و مرز اعتماد محدودتر هستند.
</Info>

## چرا بسته‌ها وجود دارند

بسیاری از Pluginهای مفید با قالب Codex، Claude یا Cursor منتشر می‌شوند. به‌جای
اینکه از نویسندگان خواسته شود آن‌ها را به‌صورت Pluginهای بومی OpenClaw بازنویسی کنند،
OpenClaw این قالب‌ها را تشخیص می‌دهد و محتوای پشتیبانی‌شده آن‌ها را به مجموعه قابلیت‌های
بومی نگاشت می‌کند. یعنی می‌توانید یک بسته فرمان Claude یا یک بسته Skills مربوط به Codex را
نصب کنید و بلافاصله از آن استفاده کنید.

## نصب یک بسته

<Steps>
  <Step title="نصب از یک دایرکتوری، آرشیو یا بازارچه">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="تأیید تشخیص">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    بسته‌ها با `Format: bundle` و زیرنوعی از `codex`، `claude` یا `cursor` نمایش داده می‌شوند.

  </Step>

  <Step title="راه‌اندازی مجدد و استفاده">
    ```bash
    openclaw gateway restart
    ```

    قابلیت‌های نگاشت‌شده (skills، hookها، ابزارهای MCP، پیش‌فرض‌های LSP) در نشست بعدی در دسترس هستند.

  </Step>
</Steps>

## OpenClaw چه چیزهایی را از بسته‌ها نگاشت می‌کند

امروز همه قابلیت‌های بسته‌ها در OpenClaw اجرا نمی‌شوند. در ادامه آمده است چه چیزهایی
کار می‌کنند و چه چیزهایی تشخیص داده می‌شوند اما هنوز وصل نشده‌اند.

### اکنون پشتیبانی می‌شود

| قابلیت       | نحوه نگاشت                                                                                 | اعمال می‌شود روی     |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| محتوای skill | ریشه‌های skill بسته‌ها به‌عنوان skills عادی OpenClaw بارگذاری می‌شوند                                           | همه قالب‌ها    |
| فرمان‌ها      | `commands/` و `.cursor/commands/` به‌عنوان ریشه‌های skill در نظر گرفته می‌شوند                                  | Claude، Cursor |
| بسته‌های hook    | چیدمان‌های سبک OpenClaw شامل `HOOK.md` + `handler.ts`                                             | Codex          |
| ابزارهای MCP     | پیکربندی MCP بسته با تنظیمات Pi تعبیه‌شده ادغام می‌شود؛ سرورهای stdio و HTTP پشتیبانی‌شده بارگذاری می‌شوند | همه قالب‌ها    |
| سرورهای LSP   | فایل `.lsp.json` در Claude و `lspServers` اعلام‌شده در manifest با پیش‌فرض‌های LSP مربوط به Pi تعبیه‌شده ادغام می‌شوند  | Claude         |
| تنظیمات      | فایل `settings.json` در Claude به‌عنوان پیش‌فرض‌های Pi تعبیه‌شده وارد می‌شود                                     | Claude         |

#### محتوای skill

- ریشه‌های skill بسته‌ها به‌عنوان ریشه‌های skill عادی OpenClaw بارگذاری می‌شوند
- ریشه‌های `commands` در Claude به‌عنوان ریشه‌های skill اضافی در نظر گرفته می‌شوند
- ریشه‌های `.cursor/commands` در Cursor به‌عنوان ریشه‌های skill اضافی در نظر گرفته می‌شوند

یعنی فایل‌های فرمان markdown در Claude از طریق بارگذار skill عادی OpenClaw کار می‌کنند.
markdown فرمان‌های Cursor نیز از همان مسیر کار می‌کند.

#### بسته‌های hook

- ریشه‌های hook بسته‌ها **فقط** زمانی کار می‌کنند که از چیدمان عادی بسته hook
  در OpenClaw استفاده کنند. امروز این مورد عمدتاً حالت سازگار با Codex است:
  - `HOOK.md`
  - `handler.ts` یا `handler.js`

#### MCP برای Pi

- بسته‌های فعال‌شده می‌توانند پیکربندی سرور MCP ارائه کنند
- OpenClaw پیکربندی MCP بسته را با تنظیمات مؤثر Pi تعبیه‌شده به‌صورت
  `mcpServers` ادغام می‌کند
- OpenClaw ابزارهای MCP پشتیبانی‌شده بسته‌ها را هنگام نوبت‌های عامل Pi تعبیه‌شده با
  راه‌اندازی سرورهای stdio یا اتصال به سرورهای HTTP ارائه می‌کند
- پروفایل‌های ابزار `coding` و `messaging` به‌طور پیش‌فرض ابزارهای MCP بسته را شامل می‌شوند؛
  برای انصراف در یک agent یا Gateway از `tools.deny: ["bundle-mcp"]` استفاده کنید
- تنظیمات محلی پروژه برای Pi همچنان پس از پیش‌فرض‌های بسته اعمال می‌شوند، بنابراین تنظیمات
  فضای کاری می‌توانند در صورت نیاز ورودی‌های MCP بسته را بازنویسی کنند
- فهرست ابزارهای MCP بسته پیش از ثبت به‌صورت قطعی مرتب می‌شود، بنابراین تغییر ترتیب
  `listTools()` در بالادست باعث آشفتگی بلوک‌های ابزار prompt-cache نمی‌شود

##### انتقال‌ها

سرورهای MCP می‌توانند از انتقال stdio یا HTTP استفاده کنند:

**Stdio** یک فرایند فرزند را راه‌اندازی می‌کند:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** به‌طور پیش‌فرض از طریق `sse`، یا در صورت درخواست از طریق `streamable-http`، به یک سرور MCP در حال اجرا وصل می‌شود:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` می‌تواند روی `"streamable-http"` یا `"sse"` تنظیم شود؛ وقتی حذف شود، OpenClaw از `sse` استفاده می‌کند
- `type: "http"` یک شکل پایین‌دستی بومی CLI است؛ در پیکربندی OpenClaw از `transport: "streamable-http"` استفاده کنید. `openclaw mcp set` و `openclaw doctor --fix` نام مستعار رایج را نرمال می‌کنند.
- فقط طرح‌های URL با `http:` و `https:` مجاز هستند
- مقادیر `headers` از درون‌یابی `${ENV_VAR}` پشتیبانی می‌کنند
- ورودی سروری که هم `command` و هم `url` داشته باشد رد می‌شود
- اطلاعات اعتبارسنجی URL (userinfo و پارامترهای query) از توضیحات ابزار
  و گزارش‌ها حذف می‌شوند
- `connectionTimeoutMs` مهلت اتصال پیش‌فرض ۳۰ ثانیه‌ای را برای
  هر دو انتقال stdio و HTTP بازنویسی می‌کند

##### نام‌گذاری ابزار

OpenClaw ابزارهای MCP بسته را با نام‌های امن برای provider و در قالب
`serverName__toolName` ثبت می‌کند. برای مثال، سروری با کلید `"vigil-harbor"` که یک
ابزار `memory_search` ارائه می‌کند، به‌صورت `vigil-harbor__memory_search` ثبت می‌شود.

- نویسه‌های خارج از `A-Za-z0-9_-` با `-` جایگزین می‌شوند
- قطعه‌هایی که با یک حرف غیرالفبایی شروع می‌شوند یک پیشوند حرفی می‌گیرند، بنابراین کلیدهای
  عددی سرور مانند `12306` به پیشوندهای ابزار امن برای provider تبدیل می‌شوند
- پیشوندهای سرور به ۳۰ نویسه محدود می‌شوند
- نام‌های کامل ابزار به ۶۴ نویسه محدود می‌شوند
- نام‌های خالی سرور به `mcp` برمی‌گردند
- نام‌های پاک‌سازی‌شده متداخل با پسوندهای عددی از هم متمایز می‌شوند
- ترتیب نهایی ابزارهای ارائه‌شده بر اساس نام امن قطعی است تا نوبت‌های تکراری Pi
  از نظر کش پایدار بمانند
- فیلترکردن پروفایل، همه ابزارهای یک سرور MCP بسته را متعلق به Plugin
  `bundle-mcp` در نظر می‌گیرد، بنابراین allowlistها و deny listهای پروفایل می‌توانند هم
  نام ابزارهای ارائه‌شده منفرد و هم کلید Plugin یعنی `bundle-mcp` را شامل شوند

#### تنظیمات Pi تعبیه‌شده

- وقتی بسته فعال باشد، فایل `settings.json` در Claude به‌عنوان تنظیمات پیش‌فرض Pi تعبیه‌شده وارد می‌شود
- OpenClaw کلیدهای بازنویسی shell را پیش از اعمال پاک‌سازی می‌کند

کلیدهای پاک‌سازی‌شده:

- `shellPath`
- `shellCommandPrefix`

#### LSP تعبیه‌شده Pi

- بسته‌های فعال‌شده Claude می‌توانند پیکربندی سرور LSP ارائه کنند
- OpenClaw فایل `.lsp.json` به‌علاوه هر مسیر `lspServers` اعلام‌شده در manifest را بارگذاری می‌کند
- پیکربندی LSP بسته با پیش‌فرض‌های مؤثر LSP مربوط به Pi تعبیه‌شده ادغام می‌شود
- امروز فقط سرورهای LSP پشتیبانی‌شده مبتنی بر stdio قابل اجرا هستند؛ انتقال‌های پشتیبانی‌نشده
  همچنان در `openclaw plugins inspect <id>` نمایش داده می‌شوند

### تشخیص داده می‌شود اما اجرا نمی‌شود

این موارد شناسایی و در diagnostics نمایش داده می‌شوند، اما OpenClaw آن‌ها را اجرا نمی‌کند:

- `agents`، خودکارسازی `hooks.json`، `outputStyles` در Claude
- `.cursor/agents`، `.cursor/hooks.json`، `.cursor/rules` در Cursor
- فراداده inline/app در Codex فراتر از گزارش قابلیت

## قالب‌های بسته

<AccordionGroup>
  <Accordion title="بسته‌های Codex">
    نشانگرها: `.codex-plugin/plugin.json`

    محتوای اختیاری: `skills/`، `hooks/`، `.mcp.json`، `.app.json`

    بسته‌های Codex زمانی بهترین سازگاری را با OpenClaw دارند که از ریشه‌های skill و دایرکتوری‌های
    بسته hook سبک OpenClaw (`HOOK.md` + `handler.ts`) استفاده کنند.

  </Accordion>

  <Accordion title="بسته‌های Claude">
    دو حالت تشخیص:

    - **مبتنی بر manifest:** `.claude-plugin/plugin.json`
    - **بدون manifest:** چیدمان پیش‌فرض Claude (`skills/`، `commands/`، `agents/`، `hooks/`، `.mcp.json`، `.lsp.json`، `settings.json`)

    رفتار اختصاصی Claude:

    - `commands/` به‌عنوان محتوای skill در نظر گرفته می‌شود
    - `settings.json` به تنظیمات Pi تعبیه‌شده وارد می‌شود (کلیدهای بازنویسی shell پاک‌سازی می‌شوند)
    - `.mcp.json` ابزارهای stdio پشتیبانی‌شده را برای Pi تعبیه‌شده ارائه می‌کند
    - `.lsp.json` به‌علاوه مسیرهای `lspServers` اعلام‌شده در manifest در پیش‌فرض‌های LSP مربوط به Pi تعبیه‌شده بارگذاری می‌شوند
    - `hooks/hooks.json` تشخیص داده می‌شود اما اجرا نمی‌شود
    - مسیرهای مؤلفه سفارشی در manifest افزایشی هستند (پیش‌فرض‌ها را گسترش می‌دهند، جایگزین آن‌ها نمی‌شوند)

  </Accordion>

  <Accordion title="بسته‌های Cursor">
    نشانگرها: `.cursor-plugin/plugin.json`

    محتوای اختیاری: `skills/`، `.cursor/commands/`، `.cursor/agents/`، `.cursor/rules/`، `.cursor/hooks.json`، `.mcp.json`

    - `.cursor/commands/` به‌عنوان محتوای skill در نظر گرفته می‌شود
    - `.cursor/rules/`، `.cursor/agents/` و `.cursor/hooks.json` فقط تشخیص داده می‌شوند

  </Accordion>
</AccordionGroup>

## اولویت تشخیص

OpenClaw ابتدا قالب Plugin بومی را بررسی می‌کند:

1. `openclaw.plugin.json` یا `package.json` معتبر با `openclaw.extensions` — به‌عنوان **Plugin بومی** در نظر گرفته می‌شود
2. نشانگرهای بسته (`.codex-plugin/`، `.claude-plugin/`، یا چیدمان پیش‌فرض Claude/Cursor) — به‌عنوان **بسته** در نظر گرفته می‌شود

اگر یک دایرکتوری شامل هر دو باشد، OpenClaw از مسیر بومی استفاده می‌کند. این کار از
نصب ناقص بسته‌های دو-قالبی به‌عنوان بسته جلوگیری می‌کند.

## وابستگی‌های زمان اجرا و پاک‌سازی

- بسته‌های سازگار شخص ثالث تعمیر `npm install` هنگام شروع را دریافت نمی‌کنند. آن‌ها
  باید از طریق `openclaw plugins install` نصب شوند و هر آنچه لازم دارند را
  در دایرکتوری Plugin نصب‌شده همراه داشته باشند.
- Pluginهای بسته‌بندی‌شده متعلق به OpenClaw یا به‌صورت سبک همراه core ارائه می‌شوند یا
  از طریق نصب‌کننده Plugin قابل دانلود هستند. شروع Gateway هرگز برای آن‌ها
  package manager اجرا نمی‌کند.
- `openclaw doctor --fix` دایرکتوری‌های وابستگی stage‌شده قدیمی را حذف می‌کند و می‌تواند
  Pluginهای قابل دانلودی را که هنگام ارجاع پیکربندی به آن‌ها از نمایه Plugin محلی
  گم شده‌اند بازیابی کند.

## امنیت

بسته‌ها مرز اعتماد محدودتری نسبت به Pluginهای بومی دارند:

- OpenClaw ماژول‌های runtime دلخواه بسته را درون‌پردازه‌ای بارگذاری نمی‌کند
- مسیرهای Skills و بسته hook باید داخل ریشه Plugin باقی بمانند (با بررسی مرزی)
- فایل‌های تنظیمات با همان بررسی‌های مرزی خوانده می‌شوند
- سرورهای stdio MCP پشتیبانی‌شده ممکن است به‌عنوان زیرفرایند راه‌اندازی شوند

این باعث می‌شود بسته‌ها به‌طور پیش‌فرض امن‌تر باشند، اما همچنان باید بسته‌های شخص ثالث را
برای قابلیت‌هایی که ارائه می‌کنند به‌عنوان محتوای مورد اعتماد در نظر بگیرید.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="بسته تشخیص داده می‌شود اما قابلیت‌ها اجرا نمی‌شوند">
    `openclaw plugins inspect <id>` را اجرا کنید. اگر قابلیتی فهرست شده اما با وضعیت
    وصل‌نشده علامت‌گذاری شده است، این یک محدودیت محصول است — نه نصب خراب.
  </Accordion>

  <Accordion title="فایل‌های فرمان Claude ظاهر نمی‌شوند">
    مطمئن شوید بسته فعال است و فایل‌های markdown داخل یک ریشه تشخیص‌داده‌شده
    `commands/` یا `skills/` قرار دارند.
  </Accordion>

  <Accordion title="تنظیمات Claude اعمال نمی‌شوند">
    فقط تنظیمات Pi تعبیه‌شده از `settings.json` پشتیبانی می‌شوند. OpenClaw
    تنظیمات بسته را به‌عنوان patchهای خام پیکربندی در نظر نمی‌گیرد.
  </Accordion>

  <Accordion title="hookهای Claude اجرا نمی‌شوند">
    `hooks/hooks.json` فقط تشخیص داده می‌شود. اگر به hookهای قابل اجرا نیاز دارید، از
    چیدمان بسته hook در OpenClaw استفاده کنید یا یک Plugin بومی ارائه دهید.
  </Accordion>
</AccordionGroup>

## مرتبط

- [نصب و پیکربندی Pluginها](/fa/tools/plugin)
- [ساخت Pluginها](/fa/plugins/building-plugins) — ساخت یک Plugin بومی
- [manifest مربوط به Plugin](/fa/plugins/manifest) — schema بومی manifest
