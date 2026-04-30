---
read_when:
    - می‌خواهید یک بستهٔ سازگار با Codex، Claude یا Cursor نصب کنید
    - باید بدانید OpenClaw چگونه محتوای بسته را به قابلیت‌های بومی نگاشت می‌کند
    - در حال اشکال‌زدایی تشخیص باندل یا قابلیت‌های مفقود هستید
summary: نصب و استفاده از بسته‌های Codex، Claude و Cursor به‌عنوان Pluginهای OpenClaw
title: بسته‌های Plugin
x-i18n:
    generated_at: "2026-04-30T00:06:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d03643c3029f5c6c81fab3aa1c00accba94da64a834e381b29db8f405d6bdee
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw می‌تواند Pluginها را از سه زیست‌بوم خارجی نصب کند: **Codex**، **Claude**،
و **Cursor**. این‌ها **باندل** نامیده می‌شوند؛ بسته‌های محتوا و فراداده که
OpenClaw آن‌ها را به قابلیت‌های بومی مانند Skills، هوک‌ها، و ابزارهای MCP نگاشت می‌کند.

<Info>
  باندل‌ها همان Pluginهای بومی OpenClaw نیستند. Pluginهای بومی درون‌پردازه اجرا می‌شوند
  و می‌توانند هر قابلیتی را ثبت کنند. باندل‌ها بسته‌های محتوایی با
  نگاشت انتخابی قابلیت‌ها و مرز اعتماد محدودتر هستند.
</Info>

## چرا باندل‌ها وجود دارند

بسیاری از Pluginهای مفید در قالب Codex، Claude، یا Cursor منتشر می‌شوند. به‌جای
اینکه از نویسندگان خواسته شود آن‌ها را به‌صورت Pluginهای بومی OpenClaw بازنویسی کنند، OpenClaw
این قالب‌ها را تشخیص می‌دهد و محتوای پشتیبانی‌شده آن‌ها را به مجموعه قابلیت‌های بومی
نگاشت می‌کند. یعنی می‌توانید یک بسته دستور Claude یا یک باندل Skills از Codex را
نصب کنید و بلافاصله از آن استفاده کنید.

## نصب یک باندل

<Steps>
  <Step title="Install from a directory, archive, or marketplace">
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

  <Step title="Verify detection">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    باندل‌ها با `Format: bundle` و یک زیرنوع از `codex`، `claude`، یا `cursor` نمایش داده می‌شوند.

  </Step>

  <Step title="Restart and use">
    ```bash
    openclaw gateway restart
    ```

    قابلیت‌های نگاشت‌شده (Skills، هوک‌ها، ابزارهای MCP، پیش‌فرض‌های LSP) در نشست بعدی در دسترس هستند.

  </Step>
</Steps>

## OpenClaw چه چیزهایی را از باندل‌ها نگاشت می‌کند

امروز همه قابلیت‌های باندل در OpenClaw اجرا نمی‌شوند. اینجا نشان می‌دهد چه چیزهایی کار می‌کنند و چه چیزهایی
تشخیص داده می‌شوند اما هنوز متصل نشده‌اند.

### اکنون پشتیبانی می‌شود

| قابلیت       | نحوه نگاشت                                                                                 | شامل می‌شود برای     |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| محتوای Skills | ریشه‌های Skills باندل به‌عنوان Skills عادی OpenClaw بارگذاری می‌شوند                                           | همه قالب‌ها    |
| دستورها      | `commands/` و `.cursor/commands/` به‌عنوان ریشه‌های Skills در نظر گرفته می‌شوند                                  | Claude، Cursor |
| بسته‌های هوک    | چیدمان‌های سبک OpenClaw شامل `HOOK.md` + `handler.ts`                                             | Codex          |
| ابزارهای MCP     | پیکربندی MCP باندل در تنظیمات Pi تعبیه‌شده ادغام می‌شود؛ سرورهای stdio و HTTP پشتیبانی‌شده بارگذاری می‌شوند | همه قالب‌ها    |
| سرورهای LSP   | فایل `.lsp.json` مربوط به Claude و `lspServers` اعلام‌شده در manifest در پیش‌فرض‌های LSP مربوط به Pi تعبیه‌شده ادغام می‌شوند  | Claude         |
| تنظیمات      | فایل `settings.json` مربوط به Claude به‌عنوان پیش‌فرض‌های Pi تعبیه‌شده وارد می‌شود                                     | Claude         |

#### محتوای Skills

- ریشه‌های Skills باندل به‌عنوان ریشه‌های عادی Skills در OpenClaw بارگذاری می‌شوند
- ریشه‌های `commands` مربوط به Claude به‌عنوان ریشه‌های اضافی Skills در نظر گرفته می‌شوند
- ریشه‌های `.cursor/commands` مربوط به Cursor به‌عنوان ریشه‌های اضافی Skills در نظر گرفته می‌شوند

یعنی فایل‌های دستور Markdown مربوط به Claude از مسیر بارگذار عادی Skills در
OpenClaw کار می‌کنند. Markdown دستورهای Cursor هم از همان مسیر کار می‌کند.

#### بسته‌های هوک

- ریشه‌های هوک باندل **فقط** زمانی کار می‌کنند که از چیدمان عادی بسته هوک
  OpenClaw استفاده کنند. امروز این مورد عمدتاً حالت سازگار با Codex است:
  - `HOOK.md`
  - `handler.ts` یا `handler.js`

#### MCP برای Pi

- باندل‌های فعال می‌توانند در پیکربندی سرور MCP مشارکت کنند
- OpenClaw پیکربندی MCP باندل را به‌عنوان
  `mcpServers` در تنظیمات مؤثر Pi تعبیه‌شده ادغام می‌کند
- OpenClaw ابزارهای MCP پشتیبانی‌شده باندل را در طول نوبت‌های agent مربوط به Pi تعبیه‌شده، با
  راه‌اندازی سرورهای stdio یا اتصال به سرورهای HTTP در دسترس قرار می‌دهد
- نمایه‌های ابزار `coding` و `messaging` به‌صورت پیش‌فرض ابزارهای MCP باندل را شامل می‌شوند؛
  برای انصراف برای یک agent یا gateway از `tools.deny: ["bundle-mcp"]` استفاده کنید
- تنظیمات Pi محلی پروژه همچنان پس از پیش‌فرض‌های باندل اعمال می‌شوند، بنابراین تنظیمات
  workspace می‌توانند در صورت نیاز ورودی‌های MCP باندل را بازنویسی کنند
- فهرست ابزارهای MCP باندل پیش از ثبت به‌صورت قطعی مرتب می‌شود، بنابراین
  تغییرات ترتیب `listTools()` در بالادست باعث به‌هم‌ریختگی بلوک‌های ابزار prompt-cache نمی‌شود

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

**HTTP** به‌صورت پیش‌فرض از طریق `sse`، یا در صورت درخواست از طریق `streamable-http`، به یک سرور MCP در حال اجرا متصل می‌شود:

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
- `type: "http"` یک شکل پایین‌دستی بومی CLI است؛ در پیکربندی OpenClaw از `transport: "streamable-http"` استفاده کنید. `openclaw mcp set` و `openclaw doctor --fix` نام مستعار رایج را عادی‌سازی می‌کنند.
- فقط شِمای URL از نوع `http:` و `https:` مجاز است
- مقادیر `headers` از درون‌یابی `${ENV_VAR}` پشتیبانی می‌کنند
- ورودی سروری که هم `command` و هم `url` داشته باشد رد می‌شود
- اطلاعات هویتی URL (userinfo و پارامترهای query) از توضیحات ابزار
  و لاگ‌ها حذف می‌شوند
- `connectionTimeoutMs` مهلت اتصال پیش‌فرض ۳۰ ثانیه‌ای را برای
  هر دو انتقال stdio و HTTP بازنویسی می‌کند

##### نام‌گذاری ابزار

OpenClaw ابزارهای MCP باندل را با نام‌های امن برای provider به شکل
`serverName__toolName` ثبت می‌کند. برای مثال، سروری با کلید `"vigil-harbor"` که یک ابزار
`memory_search` ارائه می‌کند، با نام `vigil-harbor__memory_search` ثبت می‌شود.

- نویسه‌های خارج از `A-Za-z0-9_-` با `-` جایگزین می‌شوند
- پیشوندهای سرور حداکثر ۳۰ نویسه هستند
- نام کامل ابزارها حداکثر ۶۴ نویسه است
- نام‌های خالی سرور به `mcp` برمی‌گردند
- نام‌های پاک‌سازی‌شده متداخل با پسوندهای عددی از هم متمایز می‌شوند
- ترتیب نهایی ابزارهای در معرض‌قرارگرفته بر اساس نام امن قطعی است تا نوبت‌های تکراری Pi
  از نظر cache پایدار بمانند
- فیلتر کردن نمایه، همه ابزارهای یک سرور MCP باندل را متعلق به Plugin
  `bundle-mcp` در نظر می‌گیرد، بنابراین allowlist و deny listهای نمایه می‌توانند یا
  نام تک‌تک ابزارهای در معرض‌قرارگرفته یا کلید Plugin یعنی `bundle-mcp` را شامل شوند

#### تنظیمات Pi تعبیه‌شده

- فایل `settings.json` مربوط به Claude، وقتی باندل فعال باشد، به‌عنوان تنظیمات پیش‌فرض Pi تعبیه‌شده
  وارد می‌شود
- OpenClaw کلیدهای بازنویسی shell را پیش از اعمال پاک‌سازی می‌کند

کلیدهای پاک‌سازی‌شده:

- `shellPath`
- `shellCommandPrefix`

#### Pi LSP جاسازی‌شده

- بسته‌های Claude فعال‌شده می‌توانند پیکربندی سرور LSP را اضافه کنند
- OpenClaw فایل `.lsp.json` را به‌همراه هر مسیر `lspServers` اعلام‌شده در manifest بارگذاری می‌کند
- پیکربندی LSP بسته در پیش‌فرض‌های مؤثر Pi LSP جاسازی‌شده ادغام می‌شود
- امروزه فقط سرورهای LSP پشتیبانی‌شده مبتنی بر stdio قابل اجرا هستند؛ transportهای پشتیبانی‌نشده همچنان در `openclaw plugins inspect <id>` نمایش داده می‌شوند

### شناسایی‌شده اما اجرا نشده

این موارد شناسایی می‌شوند و در diagnostics نمایش داده می‌شوند، اما OpenClaw آن‌ها را اجرا نمی‌کند:

- `agents` مربوط به Claude، خودکارسازی `hooks.json`، `outputStyles`
- `.cursor/agents`، `.cursor/hooks.json`، `.cursor/rules` مربوط به Cursor
- فراداده inline/app مربوط به Codex فراتر از گزارش قابلیت‌ها

## قالب‌های بسته

<AccordionGroup>
  <Accordion title="بسته‌های Codex">
    نشانگرها: `.codex-plugin/plugin.json`

    محتوای اختیاری: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    بسته‌های Codex زمانی بهترین سازگاری را با OpenClaw دارند که از ریشه‌های skill و دایرکتوری‌های hook-pack به سبک OpenClaw (`HOOK.md` + `handler.ts`) استفاده کنند.

  </Accordion>

  <Accordion title="بسته‌های Claude">
    دو حالت شناسایی:

    - **مبتنی بر Manifest:** `.claude-plugin/plugin.json`
    - **بدون Manifest:** چیدمان پیش‌فرض Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    رفتار اختصاصی Claude:

    - `commands/` به‌عنوان محتوای skill در نظر گرفته می‌شود
    - `settings.json` به تنظیمات Pi جاسازی‌شده وارد می‌شود (کلیدهای بازنویسی shell پاک‌سازی می‌شوند)
    - `.mcp.json` ابزارهای stdio پشتیبانی‌شده را در اختیار Pi جاسازی‌شده قرار می‌دهد
    - `.lsp.json` به‌همراه مسیرهای `lspServers` اعلام‌شده در manifest در پیش‌فرض‌های Pi LSP جاسازی‌شده بارگذاری می‌شوند
    - `hooks/hooks.json` شناسایی می‌شود اما اجرا نمی‌شود
    - مسیرهای مؤلفه سفارشی در manifest افزایشی هستند (پیش‌فرض‌ها را گسترش می‌دهند، نه اینکه جایگزینشان کنند)

  </Accordion>

  <Accordion title="بسته‌های Cursor">
    نشانگرها: `.cursor-plugin/plugin.json`

    محتوای اختیاری: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` به‌عنوان محتوای skill در نظر گرفته می‌شود
    - `.cursor/rules/`، `.cursor/agents/`، و `.cursor/hooks.json` فقط شناسایی می‌شوند

  </Accordion>
</AccordionGroup>

## اولویت شناسایی

OpenClaw ابتدا قالب Plugin بومی را بررسی می‌کند:

1. `openclaw.plugin.json` یا `package.json` معتبر با `openclaw.extensions` — به‌عنوان **Plugin بومی** در نظر گرفته می‌شود
2. نشانگرهای بسته (`.codex-plugin/`، `.claude-plugin/`، یا چیدمان پیش‌فرض Claude/Cursor) — به‌عنوان **بسته** در نظر گرفته می‌شود

اگر یک دایرکتوری هر دو را داشته باشد، OpenClaw از مسیر بومی استفاده می‌کند. این کار از نصب جزئی بسته‌های دوفرمتی به‌عنوان بسته جلوگیری می‌کند.

## وابستگی‌های زمان اجرا و پاک‌سازی

- بسته‌های سازگار شخص ثالث تعمیر `npm install` در زمان راه‌اندازی دریافت نمی‌کنند. آن‌ها باید از طریق `openclaw plugins install` نصب شوند و هرچه نیاز دارند را در دایرکتوری Plugin نصب‌شده همراه داشته باشند.
- Pluginهای بسته‌بندی‌شده و متعلق به OpenClaw یک استثنای محدود دارند: وقتی یکی از آن‌ها فعال باشد، راه‌اندازی Gateway می‌تواند وابستگی‌های زمان اجرای اعلام‌شده و مفقود را پیش از import تعمیر کند. اپراتورها می‌توانند آن مرحله را با `openclaw plugins deps` بررسی یا تعمیر کنند.
- خط لوله انتشار همچنان مسئول ارسال payload کامل وابستگی‌های بسته‌شده در صورت امکان است (قاعده تأیید پس از انتشار را در [انتشار](/fa/reference/RELEASING) ببینید).

## امنیت

بسته‌ها نسبت به Pluginهای بومی مرز اعتماد محدودتری دارند:

- OpenClaw ماژول‌های زمان اجرای دلخواه بسته را درون فرایند بارگذاری **نمی‌کند**
- مسیرهای Skills و hook-pack باید داخل ریشه Plugin باقی بمانند (با بررسی مرزی)
- فایل‌های تنظیمات با همان بررسی‌های مرزی خوانده می‌شوند
- سرورهای stdio MCP پشتیبانی‌شده ممکن است به‌عنوان subprocess راه‌اندازی شوند

این باعث می‌شود بسته‌ها به‌طور پیش‌فرض ایمن‌تر باشند، اما همچنان باید بسته‌های شخص ثالث را برای قابلیت‌هایی که ارائه می‌کنند محتوای مورد اعتماد بدانید.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="بسته شناسایی شده اما قابلیت‌ها اجرا نمی‌شوند">
    `openclaw plugins inspect <id>` را اجرا کنید. اگر قابلیتی فهرست شده اما به‌عنوان متصل‌نشده علامت‌گذاری شده باشد، این یک محدودیت محصول است — نه نصب خراب.
  </Accordion>

  <Accordion title="فایل‌های فرمان Claude ظاهر نمی‌شوند">
    مطمئن شوید بسته فعال است و فایل‌های markdown داخل یک ریشه `commands/` یا `skills/` شناسایی‌شده قرار دارند.
  </Accordion>

  <Accordion title="تنظیمات Claude اعمال نمی‌شوند">
    فقط تنظیمات Pi جاسازی‌شده از `settings.json` پشتیبانی می‌شوند. OpenClaw تنظیمات بسته را به‌عنوان وصله‌های خام config در نظر نمی‌گیرد.
  </Accordion>

  <Accordion title="hookهای Claude اجرا نمی‌شوند">
    `hooks/hooks.json` فقط شناسایی می‌شود. اگر به hookهای قابل اجرا نیاز دارید، از چیدمان hook-pack مربوط به OpenClaw استفاده کنید یا یک Plugin بومی ارائه دهید.
  </Accordion>
</AccordionGroup>

## مرتبط

- [نصب و پیکربندی Pluginها](/fa/tools/plugin)
- [ساخت Pluginها](/fa/plugins/building-plugins) — ایجاد یک Plugin بومی
- [Manifest Plugin](/fa/plugins/manifest) — schema مربوط به manifest بومی
