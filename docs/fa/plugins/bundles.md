---
read_when:
    - می‌خواهید یک بستهٔ سازگار با Codex، Claude یا Cursor نصب کنید
    - باید بدانید OpenClaw چگونه محتوای باندل را به قابلیت‌های بومی نگاشت می‌کند
    - در حال اشکال‌زداییِ تشخیص باندل یا قابلیت‌های مفقود هستید
summary: بسته‌های Codex، Claude و Cursor را به‌عنوان Plugin‌های OpenClaw نصب کنید و به کار ببرید
title: بسته‌های Plugin
x-i18n:
    generated_at: "2026-05-05T01:49:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bc06300e765e2faaf51800462003e242d29d4102ac9feaa47f86d4ad35bf157
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw می‌تواند Pluginها را از سه اکوسیستم خارجی نصب کند: **Codex**، **Claude** و **Cursor**. به این‌ها **باندل‌ها** گفته می‌شود، یعنی بسته‌های محتوا و فراداده‌ای که OpenClaw آن‌ها را به قابلیت‌های بومی مانند Skills، hookها و ابزارهای MCP نگاشت می‌کند.

<Info>
  باندل‌ها همان Pluginهای بومی OpenClaw **نیستند**. Pluginهای بومی درون پردازش اجرا می‌شوند و می‌توانند هر قابلیتی را ثبت کنند. باندل‌ها بسته‌های محتوا هستند با نگاشت گزینشی قابلیت‌ها و مرز اعتماد محدودتر.
</Info>

## چرا باندل‌ها وجود دارند

بسیاری از Pluginهای مفید در قالب Codex، Claude یا Cursor منتشر می‌شوند. OpenClaw به‌جای اینکه از نویسندگان بخواهد آن‌ها را به‌صورت Pluginهای بومی OpenClaw بازنویسی کنند، این قالب‌ها را تشخیص می‌دهد و محتوای پشتیبانی‌شده آن‌ها را به مجموعه قابلیت‌های بومی نگاشت می‌کند. یعنی می‌توانید یک بسته فرمان Claude یا یک باندل Skill برای Codex را نصب کنید و بلافاصله از آن استفاده کنید.

## نصب یک باندل

<Steps>
  <Step title="نصب از یک پوشه، آرشیو یا marketplace">
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

    باندل‌ها با `Format: bundle` و یک زیرنوع از `codex`، `claude` یا `cursor` نمایش داده می‌شوند.

  </Step>

  <Step title="راه‌اندازی دوباره و استفاده">
    ```bash
    openclaw gateway restart
    ```

    قابلیت‌های نگاشت‌شده (Skills، hookها، ابزارهای MCP، پیش‌فرض‌های LSP) در نشست بعدی در دسترس هستند.

  </Step>
</Steps>

## OpenClaw چه چیزهایی را از باندل‌ها نگاشت می‌کند

امروز همه قابلیت‌های باندل در OpenClaw اجرا نمی‌شوند. اینجا آمده که چه چیزهایی کار می‌کنند و چه چیزهایی تشخیص داده می‌شوند اما هنوز متصل نشده‌اند.

### در حال حاضر پشتیبانی می‌شود

| قابلیت       | نحوه نگاشت                                                                                 | قابل اعمال به     |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| محتوای Skill | ریشه‌های Skill باندل مانند Skills عادی OpenClaw بارگذاری می‌شوند                                           | همه قالب‌ها    |
| فرمان‌ها      | `commands/` و `.cursor/commands/` به‌عنوان ریشه‌های Skill در نظر گرفته می‌شوند                                  | Claude، Cursor |
| بسته‌های hook    | چیدمان‌های سبک OpenClaw شامل `HOOK.md` + `handler.ts`                                             | Codex          |
| ابزارهای MCP     | پیکربندی MCP باندل در تنظیمات Pi تعبیه‌شده ادغام می‌شود؛ سرورهای stdio و HTTP پشتیبانی‌شده بارگذاری می‌شوند | همه قالب‌ها    |
| سرورهای LSP   | فایل Claude `.lsp.json` و `lspServers` اعلام‌شده در manifest در پیش‌فرض‌های LSP برای Pi تعبیه‌شده ادغام می‌شوند  | Claude         |
| تنظیمات      | فایل Claude `settings.json` به‌عنوان پیش‌فرض‌های Pi تعبیه‌شده وارد می‌شود                                     | Claude         |

#### محتوای Skill

- ریشه‌های Skill باندل مانند ریشه‌های Skill عادی OpenClaw بارگذاری می‌شوند
- ریشه‌های Claude `commands` به‌عنوان ریشه‌های Skill اضافی در نظر گرفته می‌شوند
- ریشه‌های Cursor `.cursor/commands` به‌عنوان ریشه‌های Skill اضافی در نظر گرفته می‌شوند

یعنی فایل‌های فرمان markdown مربوط به Claude از مسیر بارگذار عادی Skill در OpenClaw کار می‌کنند. markdown فرمان‌های Cursor نیز از همان مسیر کار می‌کند.

#### بسته‌های hook

- ریشه‌های hook باندل **فقط** زمانی کار می‌کنند که از چیدمان عادی بسته hook در OpenClaw استفاده کنند. امروز این عمدتاً حالت سازگار با Codex است:
  - `HOOK.md`
  - `handler.ts` یا `handler.js`

#### MCP برای Pi

- باندل‌های فعال می‌توانند در پیکربندی سرور MCP مشارکت کنند
- OpenClaw پیکربندی MCP باندل را به‌عنوان `mcpServers` در تنظیمات مؤثر Pi تعبیه‌شده ادغام می‌کند
- OpenClaw ابزارهای MCP پشتیبانی‌شده باندل را در طول نوبت‌های عامل Pi تعبیه‌شده، با راه‌اندازی سرورهای stdio یا اتصال به سرورهای HTTP، ارائه می‌کند
- پروفایل‌های ابزار `coding` و `messaging` به‌صورت پیش‌فرض شامل ابزارهای MCP باندل هستند؛ برای انصراف یک عامل یا Gateway از `tools.deny: ["bundle-mcp"]` استفاده کنید
- تنظیمات Pi محلی پروژه همچنان پس از پیش‌فرض‌های باندل اعمال می‌شوند، بنابراین تنظیمات workspace می‌توانند در صورت نیاز ورودی‌های MCP باندل را بازنویسی کنند
- کاتالوگ‌های ابزار MCP باندل پیش از ثبت، به‌صورت قطعی مرتب می‌شوند، بنابراین تغییر ترتیب `listTools()` در بالادست، بلوک‌های ابزار prompt-cache را بی‌ثبات نمی‌کند

##### انتقال‌ها

سرورهای MCP می‌توانند از انتقال stdio یا HTTP استفاده کنند:

**Stdio** یک فرایند فرزند راه‌اندازی می‌کند:

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

**HTTP** به‌صورت پیش‌فرض از طریق `sse` به یک سرور MCP در حال اجرا وصل می‌شود، یا وقتی درخواست شده باشد از `streamable-http` استفاده می‌کند:

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
- `type: "http"` یک شکل پایین‌دستی بومی CLI است؛ در پیکربندی OpenClaw از `transport: "streamable-http"` استفاده کنید. `openclaw mcp set` و `openclaw doctor --fix` نام مستعار رایج را نرمال‌سازی می‌کنند.
- فقط طرح‌های URL با `http:` و `https:` مجاز هستند
- مقدارهای `headers` از درون‌یابی `${ENV_VAR}` پشتیبانی می‌کنند
- ورودی سروری که هم `command` و هم `url` داشته باشد رد می‌شود
- اعتبارنامه‌های URL (userinfo و پارامترهای query) از توضیحات ابزار و logها حذف می‌شوند
- `connectionTimeoutMs` زمان انتظار اتصال پیش‌فرض ۳۰ ثانیه‌ای را برای هر دو انتقال stdio و HTTP بازنویسی می‌کند

##### نام‌گذاری ابزار

OpenClaw ابزارهای MCP باندل را با نام‌های امن برای provider در قالب `serverName__toolName` ثبت می‌کند. برای مثال، سروری با کلید `"vigil-harbor"` که ابزار `memory_search` را ارائه می‌کند، با نام `vigil-harbor__memory_search` ثبت می‌شود.

- نویسه‌های خارج از `A-Za-z0-9_-` با `-` جایگزین می‌شوند
- پیشوندهای سرور حداکثر ۳۰ نویسه هستند
- نام کامل ابزارها حداکثر ۶۴ نویسه است
- نام‌های خالی سرور به `mcp` برمی‌گردند
- نام‌های پاک‌سازی‌شده متداخل با پسوندهای عددی متمایز می‌شوند
- ترتیب نهایی ابزارهای ارائه‌شده براساس نام امن قطعی است تا نوبت‌های تکراری Pi از نظر cache پایدار بمانند
- فیلتر کردن پروفایل، همه ابزارهای یک سرور MCP باندل را متعلق به Plugin با کلید `bundle-mcp` در نظر می‌گیرد، بنابراین allowlistها و deny listهای پروفایل می‌توانند نام‌های منفرد ابزار ارائه‌شده یا کلید Plugin یعنی `bundle-mcp` را شامل شوند

#### تنظیمات Pi تعبیه‌شده

- فایل Claude `settings.json` وقتی باندل فعال باشد، به‌عنوان تنظیمات پیش‌فرض Pi تعبیه‌شده وارد می‌شود
- OpenClaw کلیدهای بازنویسی shell را پیش از اعمال پاک‌سازی می‌کند

کلیدهای پاک‌سازی‌شده:

- `shellPath`
- `shellCommandPrefix`

#### LSP برای Pi تعبیه‌شده

- باندل‌های فعال Claude می‌توانند در پیکربندی سرور LSP مشارکت کنند
- OpenClaw فایل `.lsp.json` به‌علاوه هر مسیر `lspServers` اعلام‌شده در manifest را بارگذاری می‌کند
- پیکربندی LSP باندل در پیش‌فرض‌های مؤثر LSP برای Pi تعبیه‌شده ادغام می‌شود
- امروز فقط سرورهای LSP پشتیبانی‌شده مبتنی بر stdio قابل اجرا هستند؛ انتقال‌های پشتیبانی‌نشده همچنان در `openclaw plugins inspect <id>` نمایش داده می‌شوند

### تشخیص داده می‌شود اما اجرا نمی‌شود

این موارد شناسایی می‌شوند و در diagnostics نمایش داده می‌شوند، اما OpenClaw آن‌ها را اجرا نمی‌کند:

- موارد Claude شامل `agents`، خودکارسازی `hooks.json` و `outputStyles`
- موارد Cursor شامل `.cursor/agents`، `.cursor/hooks.json` و `.cursor/rules`
- فراداده درون‌خطی/برنامه‌ای Codex فراتر از گزارش قابلیت

## قالب‌های باندل

<AccordionGroup>
  <Accordion title="باندل‌های Codex">
    نشانگرها: `.codex-plugin/plugin.json`

    محتوای اختیاری: `skills/`، `hooks/`، `.mcp.json`، `.app.json`

    باندل‌های Codex وقتی از ریشه‌های Skill و پوشه‌های بسته hook سبک OpenClaw (`HOOK.md` + `handler.ts`) استفاده کنند، بهترین سازگاری را با OpenClaw دارند.

  </Accordion>

  <Accordion title="باندل‌های Claude">
    دو حالت تشخیص:

    - **مبتنی بر manifest:** `.claude-plugin/plugin.json`
    - **بدون manifest:** چیدمان پیش‌فرض Claude (`skills/`، `commands/`، `agents/`، `hooks/`، `.mcp.json`، `.lsp.json`، `settings.json`)

    رفتارهای ویژه Claude:

    - `commands/` به‌عنوان محتوای Skill در نظر گرفته می‌شود
    - `settings.json` به تنظیمات Pi تعبیه‌شده وارد می‌شود (کلیدهای بازنویسی shell پاک‌سازی می‌شوند)
    - `.mcp.json` ابزارهای stdio پشتیبانی‌شده را برای Pi تعبیه‌شده ارائه می‌کند
    - `.lsp.json` به‌علاوه مسیرهای `lspServers` اعلام‌شده در manifest در پیش‌فرض‌های LSP برای Pi تعبیه‌شده بارگذاری می‌شوند
    - `hooks/hooks.json` تشخیص داده می‌شود اما اجرا نمی‌شود
    - مسیرهای مؤلفه سفارشی در manifest افزایشی هستند (پیش‌فرض‌ها را گسترش می‌دهند، نه اینکه جایگزین آن‌ها شوند)

  </Accordion>

  <Accordion title="باندل‌های Cursor">
    نشانگرها: `.cursor-plugin/plugin.json`

    محتوای اختیاری: `skills/`، `.cursor/commands/`، `.cursor/agents/`، `.cursor/rules/`، `.cursor/hooks.json`، `.mcp.json`

    - `.cursor/commands/` به‌عنوان محتوای Skill در نظر گرفته می‌شود
    - `.cursor/rules/`، `.cursor/agents/` و `.cursor/hooks.json` فقط تشخیص داده می‌شوند

  </Accordion>
</AccordionGroup>

## اولویت تشخیص

OpenClaw ابتدا قالب Plugin بومی را بررسی می‌کند:

1. `openclaw.plugin.json` یا `package.json` معتبر با `openclaw.extensions` — به‌عنوان **Plugin بومی** در نظر گرفته می‌شود
2. نشانگرهای باندل (`.codex-plugin/`، `.claude-plugin/` یا چیدمان پیش‌فرض Claude/Cursor) — به‌عنوان **باندل** در نظر گرفته می‌شود

اگر یک پوشه هر دو را داشته باشد، OpenClaw از مسیر بومی استفاده می‌کند. این کار از نصب ناقص بسته‌های دو‌قالبی به‌عنوان باندل جلوگیری می‌کند.

## وابستگی‌های زمان اجرا و پاک‌سازی

- باندل‌های سازگار شخص ثالث، repair مربوط به `npm install` هنگام راه‌اندازی دریافت نمی‌کنند. آن‌ها باید از طریق `openclaw plugins install` نصب شوند و هرآنچه نیاز دارند را در پوشه Plugin نصب‌شده همراه داشته باشند.
- Pluginهای باندل‌شده تحت مالکیت OpenClaw یا به‌صورت سبک در core عرضه می‌شوند یا از طریق نصب‌کننده Plugin قابل دانلود هستند. راه‌اندازی Gateway هرگز برای آن‌ها package manager اجرا نمی‌کند.
- `openclaw doctor --fix` پوشه‌های وابستگی staged قدیمی را حذف می‌کند و می‌تواند Pluginهای قابل دانلودی را که در index محلی Plugin وجود ندارند اما config به آن‌ها ارجاع می‌دهد بازیابی کند.

## امنیت

باندل‌ها نسبت به Pluginهای بومی مرز اعتماد محدودتری دارند:

- OpenClaw ماژول‌های دلخواه زمان اجرای باندل را درون پردازش بارگذاری **نمی‌کند**
- مسیرهای Skills و بسته hook باید داخل ریشه Plugin باقی بمانند (با بررسی مرز)
- فایل‌های تنظیمات با همان بررسی‌های مرزی خوانده می‌شوند
- سرورهای MCP پشتیبانی‌شده مبتنی بر stdio ممکن است به‌عنوان subprocess راه‌اندازی شوند

این باعث می‌شود باندل‌ها به‌صورت پیش‌فرض امن‌تر باشند، اما همچنان باید باندل‌های شخص ثالث را برای قابلیت‌هایی که ارائه می‌کنند به‌عنوان محتوای مورد اعتماد در نظر بگیرید.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="باندل تشخیص داده می‌شود اما قابلیت‌ها اجرا نمی‌شوند">
    `openclaw plugins inspect <id>` را اجرا کنید. اگر قابلیتی فهرست شده اما با عنوان متصل‌نشده علامت‌گذاری شده باشد، این یک محدودیت محصول است، نه نصب خراب.
  </Accordion>

  <Accordion title="فایل‌های فرمان Claude ظاهر نمی‌شوند">
    مطمئن شوید باندل فعال است و فایل‌های markdown داخل یک ریشه تشخیص‌داده‌شده `commands/` یا `skills/` قرار دارند.
  </Accordion>

  <Accordion title="تنظیمات Claude اعمال نمی‌شوند">
    فقط تنظیمات Pi تعبیه‌شده از `settings.json` پشتیبانی می‌شوند. OpenClaw تنظیمات باندل را به‌عنوان patchهای خام config در نظر نمی‌گیرد.
  </Accordion>

  <Accordion title="hookهای Claude اجرا نمی‌شوند">
    `hooks/hooks.json` فقط تشخیص داده می‌شود. اگر به hookهای قابل اجرا نیاز دارید، از چیدمان بسته hook در OpenClaw استفاده کنید یا یک Plugin بومی عرضه کنید.
  </Accordion>
</AccordionGroup>

## مرتبط

- [نصب و پیکربندی Pluginها](/fa/tools/plugin)
- [ساخت Pluginها](/fa/plugins/building-plugins) — ایجاد یک Plugin بومی
- [manifest مربوط به Plugin](/fa/plugins/manifest) — schema بومی manifest
