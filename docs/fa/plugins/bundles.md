---
read_when:
    - می‌خواهید یک بستهٔ سازگار با Codex، Claude یا Cursor نصب کنید
    - باید درک کنید که OpenClaw چگونه محتوای بسته را به قابلیت‌های بومی نگاشت می‌کند
    - در حال عیب‌یابی تشخیص باندل یا قابلیت‌های مفقود هستید
summary: بسته‌های Codex، Claude و Cursor را به‌عنوان Pluginهای OpenClaw نصب کنید و به‌کار ببرید
title: بسته‌های Plugin
x-i18n:
    generated_at: "2026-06-27T18:10:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b26915603db9d4d4422f4d1542f033be02eb83c5ffefcf93cac7968f624f4969
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw می‌تواند Pluginها را از سه زیست‌بوم خارجی نصب کند: **Codex**، **Claude**،
و **Cursor**. به این‌ها **باندل** گفته می‌شود — بسته‌های محتوا و فراداده که
OpenClaw آن‌ها را به قابلیت‌های بومی مانند skills، hooks، و ابزارهای MCP نگاشت می‌کند.

<Info>
  باندل‌ها همان Pluginهای بومی OpenClaw **نیستند**. Pluginهای بومی درون‌پردازه‌ای اجرا می‌شوند
  و می‌توانند هر قابلیتی را ثبت کنند. باندل‌ها بسته‌های محتوایی با نگاشت گزینشی قابلیت‌ها
  و مرز اعتماد محدودتر هستند.
</Info>

## چرا باندل‌ها وجود دارند

بسیاری از Pluginهای مفید با قالب Codex، Claude، یا Cursor منتشر می‌شوند. به‌جای
اینکه از نویسندگان بخواهد آن‌ها را به‌صورت Pluginهای بومی OpenClaw بازنویسی کنند، OpenClaw
این قالب‌ها را شناسایی می‌کند و محتوای پشتیبانی‌شده آن‌ها را به مجموعه قابلیت‌های بومی نگاشت می‌کند.
این یعنی می‌توانید یک بسته فرمان Claude یا یک باندل skill از Codex را نصب کنید
و بلافاصله از آن استفاده کنید.

## نصب یک باندل

<Steps>
  <Step title="نصب از یک پوشه، آرشیو، یا بازارچه">
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

  <Step title="تأیید شناسایی">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    باندل‌ها با `Format: bundle` و یک زیرگونه از `codex`، `claude`، یا `cursor` نمایش داده می‌شوند.

  </Step>

  <Step title="راه‌اندازی دوباره و استفاده">
    ```bash
    openclaw gateway restart
    ```

    قابلیت‌های نگاشت‌شده (skills، hooks، ابزارهای MCP، پیش‌فرض‌های LSP) در نشست بعدی در دسترس هستند.

  </Step>
</Steps>

## OpenClaw چه چیزهایی را از باندل‌ها نگاشت می‌کند

امروز همه قابلیت‌های باندل در OpenClaw اجرا نمی‌شوند. در ادامه آمده است چه چیزی کار می‌کند و چه چیزی
شناسایی می‌شود اما هنوز متصل نشده است.

### اکنون پشتیبانی می‌شود

| قابلیت       | نحوه نگاشت                                                                                       | اعمال می‌شود به     |
| ------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| محتوای Skill | ریشه‌های skill باندل به‌عنوان skillهای عادی OpenClaw بارگذاری می‌شوند                                                 | همه قالب‌ها    |
| فرمان‌ها      | `commands/` و `.cursor/commands/` به‌عنوان ریشه‌های skill در نظر گرفته می‌شوند                                        | Claude، Cursor |
| بسته‌های Hook    | چیدمان‌های سبک OpenClaw شامل `HOOK.md` + `handler.ts`                                                   | Codex          |
| ابزارهای MCP     | پیکربندی MCP باندل در تنظیمات OpenClaw توکار ادغام می‌شود؛ سرورهای stdio و HTTP پشتیبانی‌شده بارگذاری می‌شوند | همه قالب‌ها    |
| سرورهای LSP   | فایل `.lsp.json` در Claude و `lspServers` اعلام‌شده در manifest در پیش‌فرض‌های LSP توکار OpenClaw ادغام می‌شوند  | Claude         |
| تنظیمات      | فایل `settings.json` در Claude به‌عنوان پیش‌فرض‌های OpenClaw توکار وارد می‌شود                                     | Claude         |

#### محتوای Skill

- ریشه‌های skill باندل به‌عنوان ریشه‌های skill عادی OpenClaw بارگذاری می‌شوند
- ریشه‌های `commands` در Claude به‌عنوان ریشه‌های skill اضافی در نظر گرفته می‌شوند
- ریشه‌های `.cursor/commands` در Cursor به‌عنوان ریشه‌های skill اضافی در نظر گرفته می‌شوند

این یعنی فایل‌های فرمان Markdown در Claude از طریق بارگذار skill عادی OpenClaw
کار می‌کنند. Markdown فرمان Cursor نیز از همان مسیر کار می‌کند.

#### بسته‌های Hook

- ریشه‌های hook باندل **فقط** زمانی کار می‌کنند که از چیدمان عادی بسته hook
  OpenClaw استفاده کنند. امروز این عمدتاً حالت سازگار با Codex است:
  - `HOOK.md`
  - `handler.ts` یا `handler.js`

#### MCP برای OpenClaw توکار

- باندل‌های فعال‌شده می‌توانند پیکربندی سرور MCP اضافه کنند
- OpenClaw پیکربندی MCP باندل را در تنظیمات مؤثر OpenClaw توکار به‌صورت
  `mcpServers` ادغام می‌کند
- OpenClaw ابزارهای MCP باندل پشتیبانی‌شده را هنگام نوبت‌های عامل OpenClaw توکار از طریق
  راه‌اندازی سرورهای stdio یا اتصال به سرورهای HTTP در دسترس می‌گذارد
- پروفایل‌های ابزار `coding` و `messaging` به‌صورت پیش‌فرض ابزارهای MCP باندل را شامل می‌شوند؛
  برای خارج شدن برای یک عامل یا gateway از `tools.deny: ["bundle-mcp"]` استفاده کنید
- تنظیمات عامل توکار محلی پروژه همچنان پس از پیش‌فرض‌های باندل اعمال می‌شوند، بنابراین تنظیمات
  workspace می‌توانند در صورت نیاز ورودی‌های MCP باندل را بازنویسی کنند
- کاتالوگ‌های ابزار MCP باندل پیش از ثبت به‌صورت قطعی مرتب می‌شوند، بنابراین
  تغییرات ترتیب `listTools()` در بالادست باعث بی‌ثباتی بلوک‌های ابزار prompt-cache نمی‌شود

##### ترابری‌ها

سرورهای MCP می‌توانند از ترابری stdio یا HTTP استفاده کنند:

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

**HTTP** به‌صورت پیش‌فرض از طریق `sse`، یا در صورت درخواست با `streamable-http`، به یک سرور MCP در حال اجرا متصل می‌شود:

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

- `transport` می‌تواند روی `"streamable-http"` یا `"sse"` تنظیم شود؛ اگر حذف شود، OpenClaw از `sse` استفاده می‌کند
- `type: "http"` یک شکل پایین‌دستی بومی CLI است؛ در پیکربندی OpenClaw از `transport: "streamable-http"` استفاده کنید. `openclaw mcp set` و `openclaw doctor --fix` نام مستعار رایج را نرمال‌سازی می‌کنند.
- فقط schemeهای URL شامل `http:` و `https:` مجاز هستند
- مقادیر `headers` از درون‌یابی `${ENV_VAR}` پشتیبانی می‌کنند
- ورودی سروری که هم `command` و هم `url` داشته باشد رد می‌شود
- اعتبارنامه‌های URL (userinfo و پارامترهای query) از توضیحات ابزار
  و گزارش‌ها حذف می‌شوند
- `connectionTimeoutMs` زمان انتظار اتصال پیش‌فرض ۳۰ ثانیه‌ای را برای
  هر دو ترابری stdio و HTTP بازنویسی می‌کند

##### نام‌گذاری ابزار

OpenClaw ابزارهای MCP باندل را با نام‌های ایمن برای provider در قالب
`serverName__toolName` ثبت می‌کند. برای مثال، سروری با کلید `"vigil-harbor"` که یک
ابزار `memory_search` ارائه می‌کند، به‌صورت `vigil-harbor__memory_search` ثبت می‌شود.

- نویسه‌های خارج از `A-Za-z0-9_-` با `-` جایگزین می‌شوند
- قطعه‌هایی که با حرف شروع نمی‌شوند یک پیشوند حرفی می‌گیرند، بنابراین کلیدهای عددی
  سرور مانند `12306` به پیشوندهای ابزار ایمن برای provider تبدیل می‌شوند
- پیشوندهای سرور به ۳۰ نویسه محدود می‌شوند
- نام کامل ابزارها به ۶۴ نویسه محدود می‌شود
- نام‌های خالی سرور به `mcp` برمی‌گردند
- نام‌های پاک‌سازی‌شده برخوردکننده با پسوندهای عددی از هم متمایز می‌شوند
- ترتیب نهایی ابزارهای ارائه‌شده بر اساس نام ایمن قطعی است تا نوبت‌های تکراری embedded-agent
  از نظر کش پایدار بمانند
- فیلتر پروفایل همه ابزارهای یک سرور MCP باندل را متعلق به Plugin
  با کلید `bundle-mcp` در نظر می‌گیرد، بنابراین allowlistها و deny listهای پروفایل می‌توانند هم
  نام‌های ابزار ارائه‌شده منفرد و هم کلید Plugin یعنی `bundle-mcp` را شامل شوند

#### تنظیمات OpenClaw توکار

- فایل `settings.json` در Claude هنگام فعال بودن باندل به‌عنوان تنظیمات پیش‌فرض OpenClaw توکار وارد می‌شود
- OpenClaw پیش از اعمال، کلیدهای بازنویسی shell را پاک‌سازی می‌کند

کلیدهای پاک‌سازی‌شده:

- `shellPath`
- `shellCommandPrefix`

#### LSP توکار OpenClaw

- باندل‌های فعال‌شده Claude می‌توانند پیکربندی سرور LSP اضافه کنند
- OpenClaw فایل `.lsp.json` به‌همراه هر مسیر `lspServers` اعلام‌شده در manifest را بارگذاری می‌کند
- پیکربندی LSP باندل در پیش‌فرض‌های مؤثر LSP توکار OpenClaw ادغام می‌شود
- امروز فقط سرورهای LSP پشتیبانی‌شده مبتنی بر stdio قابل اجرا هستند؛ ترابری‌های
  پشتیبانی‌نشده همچنان در `openclaw plugins inspect <id>` نمایش داده می‌شوند

### شناسایی‌شده اما اجرا نمی‌شود

این موارد تشخیص داده می‌شوند و در عیب‌یابی‌ها نمایش داده می‌شوند، اما OpenClaw آن‌ها را اجرا نمی‌کند:

- `agents`، اتوماسیون `hooks.json`، و `outputStyles` در Claude
- `.cursor/agents`، `.cursor/hooks.json`، و `.cursor/rules` در Cursor
- فراداده درون‌خطی/برنامه Codex فراتر از گزارش قابلیت

## قالب‌های باندل

<AccordionGroup>
  <Accordion title="باندل‌های Codex">
    نشانگرها: `.codex-plugin/plugin.json`

    محتوای اختیاری: `skills/`، `hooks/`، `.mcp.json`، `.app.json`

    باندل‌های Codex زمانی بهترین تناسب را با OpenClaw دارند که از ریشه‌های skill و پوشه‌های
    بسته hook سبک OpenClaw (`HOOK.md` + `handler.ts`) استفاده کنند.

  </Accordion>

  <Accordion title="باندل‌های Claude">
    دو حالت شناسایی:

    - **مبتنی بر Manifest:** `.claude-plugin/plugin.json`
    - **بدون Manifest:** چیدمان پیش‌فرض Claude (`skills/`، `commands/`، `agents/`، `hooks/`، `.mcp.json`، `.lsp.json`، `settings.json`)

    رفتار اختصاصی Claude:

    - `commands/` به‌عنوان محتوای skill در نظر گرفته می‌شود
    - `settings.json` به تنظیمات OpenClaw توکار وارد می‌شود (کلیدهای بازنویسی shell پاک‌سازی می‌شوند)
    - `.mcp.json` ابزارهای stdio پشتیبانی‌شده را برای OpenClaw توکار ارائه می‌کند
    - فایل `.lsp.json` به‌همراه مسیرهای `lspServers` اعلام‌شده در manifest در پیش‌فرض‌های LSP توکار OpenClaw بارگذاری می‌شوند
    - `hooks/hooks.json` شناسایی می‌شود اما اجرا نمی‌شود
    - مسیرهای مؤلفه سفارشی در manifest افزایشی هستند (پیش‌فرض‌ها را گسترش می‌دهند، نه جایگزین آن‌ها)

  </Accordion>

  <Accordion title="باندل‌های Cursor">
    نشانگرها: `.cursor-plugin/plugin.json`

    محتوای اختیاری: `skills/`، `.cursor/commands/`، `.cursor/agents/`، `.cursor/rules/`، `.cursor/hooks.json`، `.mcp.json`

    - `.cursor/commands/` به‌عنوان محتوای skill در نظر گرفته می‌شود
    - `.cursor/rules/`، `.cursor/agents/`، و `.cursor/hooks.json` فقط شناسایی می‌شوند

  </Accordion>
</AccordionGroup>

## تقدم شناسایی

OpenClaw ابتدا قالب Plugin بومی را بررسی می‌کند:

1. `openclaw.plugin.json` یا `package.json` معتبر با `openclaw.extensions` — به‌عنوان **Plugin بومی** در نظر گرفته می‌شود
2. نشانگرهای باندل (`.codex-plugin/`، `.claude-plugin/`، یا چیدمان پیش‌فرض Claude/Cursor) — به‌عنوان **باندل** در نظر گرفته می‌شود

اگر یک پوشه هر دو را داشته باشد، OpenClaw از مسیر بومی استفاده می‌کند. این کار مانع می‌شود
بسته‌های دو قالبی به‌صورت ناقص به‌عنوان باندل نصب شوند.

## وابستگی‌های زمان اجرا و پاک‌سازی

- باندل‌های سازگار شخص ثالث تعمیر `npm install` هنگام راه‌اندازی دریافت نمی‌کنند. آن‌ها
  باید از طریق `openclaw plugins install` نصب شوند و هر چیزی را که
  نیاز دارند در پوشه Plugin نصب‌شده همراه داشته باشند.
- Pluginهای باندل‌شده متعلق به OpenClaw یا به‌صورت سبک در core ارسال می‌شوند یا
  از طریق نصب‌کننده Plugin قابل دانلود هستند. راه‌اندازی Gateway هرگز برای آن‌ها
  package manager اجرا نمی‌کند.
- `openclaw doctor --fix` پوشه‌های وابستگی staged قدیمی را حذف می‌کند و می‌تواند
  Pluginهای قابل دانلودی را که در نمایه Plugin محلی وجود ندارند اما
  config به آن‌ها ارجاع می‌دهد بازیابی کند.

## امنیت

باندل‌ها مرز اعتماد محدودتری نسبت به Pluginهای بومی دارند:

- OpenClaw ماژول‌های زمان اجرای دلخواه باندل را درون‌پردازه‌ای بارگذاری **نمی‌کند**
- مسیرهای Skills و hook-pack باید داخل ریشه Plugin بمانند (با بررسی مرز)
- فایل‌های تنظیمات با همان بررسی‌های مرزی خوانده می‌شوند
- سرورهای MCP مبتنی بر stdio پشتیبانی‌شده ممکن است به‌عنوان subprocess راه‌اندازی شوند

این باعث می‌شود باندل‌ها به‌صورت پیش‌فرض ایمن‌تر باشند، اما همچنان باید باندل‌های
شخص ثالث را برای قابلیت‌هایی که ارائه می‌کنند به‌عنوان محتوای مورد اعتماد در نظر بگیرید.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="باندل شناسایی می‌شود اما قابلیت‌ها اجرا نمی‌شوند">
    `openclaw plugins inspect <id>` را اجرا کنید. اگر قابلیتی فهرست شده اما به‌عنوان
    متصل‌نشده علامت‌گذاری شده است، این یک محدودیت محصول است — نه نصب خراب.
  </Accordion>

  <Accordion title="فایل‌های فرمان Claude ظاهر نمی‌شوند">
    مطمئن شوید باندل فعال است و فایل‌های Markdown داخل یک ریشه
    `commands/` یا `skills/` شناسایی‌شده قرار دارند.
  </Accordion>

  <Accordion title="تنظیمات Claude اعمال نمی‌شوند">
    فقط تنظیمات OpenClaw توکار از `settings.json` پشتیبانی می‌شوند. OpenClaw
    تنظیمات باندل را به‌عنوان وصله‌های خام config در نظر نمی‌گیرد.
  </Accordion>

  <Accordion title="Hookهای Claude اجرا نمی‌شوند">
    `hooks/hooks.json` فقط شناسایی می‌شود. اگر به hookهای قابل اجرا نیاز دارید، از چیدمان
    بسته hook OpenClaw استفاده کنید یا یک Plugin بومی ارائه دهید.
  </Accordion>
</AccordionGroup>

## مرتبط

- [نصب و پیکربندی Pluginها](/fa/tools/plugin)
- [ساخت Pluginها](/fa/plugins/building-plugins) — ایجاد یک Plugin بومی
- [Manifest Plugin](/fa/plugins/manifest) — schema مربوط به manifest بومی
