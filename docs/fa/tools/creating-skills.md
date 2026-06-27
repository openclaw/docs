---
read_when:
    - شما در حال ایجاد یک مهارت سفارشی جدید هستید
    - به یک گردش‌کار شروع سریع برای Skills مبتنی بر SKILL.md نیاز دارید
    - می‌خواهید از Skill Workshop برای پیشنهاد یک مهارت جهت بازبینی عامل استفاده کنید
sidebarTitle: Creating skills
summary: مهارت‌های سفارشی فضای کاری SKILL.md را برای عامل‌های OpenClaw خود بسازید، آزمایش کنید و منتشر کنید.
title: ایجاد Skills
x-i18n:
    generated_at: "2026-06-27T18:56:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a744e9010c66b8465449d24430520473717edde86711bbb59774519189b9e72
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills به عامل یاد می‌دهند چگونه و چه زمانی از ابزارها استفاده کند. هر مهارت یک دایرکتوری است
که شامل یک فایل `SKILL.md` با frontmatter از نوع YAML و دستورالعمل‌های markdown است.
OpenClaw مهارت‌ها را از چندین ریشه، طبق یک [ترتیب تقدم](/fa/tools/skills#loading-order) مشخص بارگذاری می‌کند.

## نخستین مهارت خود را بسازید

<Steps>
  <Step title="دایرکتوری مهارت را بسازید">
    Skills در پوشه `skills/` فضای کاری شما قرار می‌گیرند. برای
    مهارت جدید خود یک دایرکتوری بسازید:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    می‌توانید برای سازمان‌دهی، مهارت‌ها را در زیرپوشه‌ها گروه‌بندی کنید — مهارت همچنان
    با frontmatter فایل `SKILL.md` نام‌گذاری می‌شود، نه با مسیر پوشه:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="نوشتن SKILL.md">
    فایل `SKILL.md` را داخل دایرکتوری بسازید. frontmatter فراداده را تعریف می‌کند؛
    بدنه، دستورالعمل‌ها را به عامل می‌دهد.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that prints a greeting.
    ---

    # Hello World

    When the user asks for a greeting, use the `exec` tool to run:

    ```bash
    echo "Hello from your custom skill!"
    ```
    ```

    قواعد نام‌گذاری:
    - برای `name` از حروف کوچک، رقم‌ها و خط تیره استفاده کنید.
    - نام دایرکتوری و `name` در frontmatter را هم‌راستا نگه دارید.
    - `description` به عامل و در کشف دستورهای اسلش نمایش داده می‌شود —
      آن را یک‌خطی و کمتر از 160 نویسه نگه دارید.

  </Step>

  <Step title="تأیید بارگذاری مهارت">
    ```bash
    openclaw skills list
    ```

    OpenClaw به‌طور پیش‌فرض فایل‌های `SKILL.md` زیر ریشه‌های مهارت‌ها را پایش می‌کند. اگر
    پایشگر غیرفعال است یا در حال ادامه دادن یک نشست موجود هستید، یک نشست جدید
    شروع کنید تا عامل فهرست به‌روزشده را دریافت کند:

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="آزمایش آن">
    پیامی بفرستید که باید مهارت را فعال کند:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    یا یک گفت‌وگو باز کنید و مستقیم از عامل بپرسید. برای
    فراخوانی صریح آن با نام، از `/skill hello-world` استفاده کنید.

  </Step>
</Steps>

## مرجع SKILL.md

### فیلدهای الزامی

| فیلد         | توضیح                                                     |
| ------------- | --------------------------------------------------------------- |
| `name`        | نامک یکتا با حروف کوچک، رقم‌ها و خط تیره        |
| `description` | توضیح یک‌خطی که به عامل و در خروجی کشف نمایش داده می‌شود |

### کلیدهای اختیاری frontmatter

| فیلد                      | پیش‌فرض | توضیح                                                                      |
| -------------------------- | ------- | -------------------------------------------------------------------------------- |
| `user-invocable`           | `true`  | مهارت را به‌عنوان دستور اسلش کاربر عرضه می‌کند                                         |
| `disable-model-invocation` | `false` | مهارت را از اعلان سیستم عامل بیرون نگه می‌دارد؛ همچنان از طریق `/skill` اجرا می‌شود        |
| `command-dispatch`         | —       | برای مسیریابی مستقیم دستور اسلش به یک ابزار و دور زدن مدل، روی `tool` تنظیم کنید |
| `command-tool`             | —       | نام ابزاری که وقتی `command-dispatch: tool` تنظیم شده است فراخوانی می‌شود                         |
| `command-arg-mode`         | `raw`   | برای dispatch ابزار، رشته خام args را به ابزار ارسال می‌کند                      |
| `homepage`                 | —       | URL که در رابط کاربری macOS Skills به‌عنوان "Website" نمایش داده می‌شود                                    |

برای فیلدهای دروازه‌گذاری (`requires.bins`، `requires.env` و غیره) به
[Skills — دروازه‌گذاری](/fa/tools/skills#gating) مراجعه کنید.

### استفاده از `{baseDir}`

برای ارجاع به فایل‌های داخل دایرکتوری مهارت بدون hardcode کردن مسیرها،
از `{baseDir}` در بدنه مهارت استفاده کنید:

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## افزودن فعال‌سازی شرطی

مهارت خود را دروازه‌گذاری کنید تا فقط وقتی وابستگی‌هایش در دسترس هستند بارگذاری شود:

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="گزینه‌های دروازه‌گذاری">
    | کلید | توضیح |
    | --- | --- |
    | `requires.bins` | همه باینری‌ها باید روی `PATH` وجود داشته باشند |
    | `requires.anyBins` | حداقل یک باینری باید روی `PATH` وجود داشته باشد |
    | `requires.env` | هر متغیر env باید در فرایند یا پیکربندی وجود داشته باشد |
    | `requires.config` | هر مسیر `openclaw.json` باید truthy باشد |
    | `os` | فیلتر پلتفرم: `["darwin"]`، `["linux"]`، `["win32"]` |
    | `always` | برای رد کردن همه دروازه‌ها و همیشه شامل کردن مهارت، `true` تنظیم کنید |

    مرجع کامل: [Skills — دروازه‌گذاری](/fa/tools/skills#gating).

  </Accordion>
  <Accordion title="محیط و کلیدهای API">
    یک کلید API را به ورودی مهارت در `openclaw.json` وصل کنید:

    ```json5
    {
      skills: {
        entries: {
          "gemini-search": {
            enabled: true,
            apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
          },
        },
      },
    }
    ```

    کلید فقط برای همان نوبت عامل به فرایند میزبان تزریق می‌شود.
    به sandbox نمی‌رسد — به
    [متغیرهای env در sandbox](/fa/tools/skills-config#sandboxed-skills-and-env-vars) مراجعه کنید.

  </Accordion>
</AccordionGroup>

## پیشنهاد از طریق Skill Workshop

برای مهارت‌هایی که عامل پیش‌نویس کرده است، یا وقتی می‌خواهید پیش از زنده شدن یک مهارت
بازبینی اپراتور انجام شود، به‌جای نوشتن مستقیم
`SKILL.md` از پیشنهادهای [Skill Workshop](/fa/tools/skill-workshop) استفاده کنید.

```bash
# Propose a brand-new skill
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal ./PROPOSAL.md

# Propose an update to an existing skill
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Updated greeting skill"
```

وقتی پیشنهاد شامل فایل‌های پشتیبان است، از `--proposal-dir` استفاده کنید:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

دایرکتوری باید شامل `PROPOSAL.md` باشد. فایل‌های پشتیبان می‌توانند در `assets/`،
`examples/`، `references/`، `scripts/` یا `templates/` قرار بگیرند.

پس از بازبینی:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

برای چرخه کامل عمر پیشنهاد، به [Skill Workshop](/fa/tools/skill-workshop) مراجعه کنید.

## انتشار در ClawHub

<Steps>
  <Step title="کامل بودن SKILL.md خود را مطمئن کنید">
    مطمئن شوید `name`، `description` و هر فیلد دروازه‌گذاری `metadata.openclaw`
    تنظیم شده‌اند. اگر صفحه پروژه دارید، یک URL برای `homepage` اضافه کنید.
  </Step>
  <Step title="نصب مهارت ClawHub">
    مهارت ClawHub شکل فعلی دستور انتشار و فراداده الزامی را مستند می‌کند:

    ```bash
    openclaw skills install @openclaw/clawhub-publish
    ```

  </Step>
  <Step title="انتشار">
    ```bash
    clawhub publish
    ```

    برای جریان کامل، به [ClawHub — انتشار](/fa/clawhub/publishing) مراجعه کنید.

  </Step>
</Steps>

## بهترین رویه‌ها

<Tip>
  - **مختصر باشید** — به مدل بگویید *چه کاری* انجام دهد، نه اینکه چگونه یک AI باشد.
  - **اول ایمنی** — اگر مهارت شما از `exec` استفاده می‌کند، مطمئن شوید اعلان‌ها اجازه
    تزریق دستور دلخواه از ورودی غیرقابل اعتماد را نمی‌دهند.
  - **محلی آزمایش کنید** — پیش از اشتراک‌گذاری، از `openclaw agent --message "..."` استفاده کنید.
  - **از ClawHub استفاده کنید** — پیش از ساختن از ابتدا، مهارت‌های جامعه را در [clawhub.ai](https://clawhub.ai)
    مرور کنید.
</Tip>

## مرتبط

<CardGroup cols={2}>
  <Card title="مرجع Skills" href="/fa/tools/skills" icon="puzzle-piece">
    ترتیب بارگذاری، دروازه‌گذاری، allowlistها و قالب SKILL.md.
  </Card>
  <Card title="Skill Workshop" href="/fa/tools/skill-workshop" icon="flask">
    صف پیشنهاد برای مهارت‌هایی که عامل پیش‌نویس کرده است.
  </Card>
  <Card title="پیکربندی Skills" href="/fa/tools/skills-config" icon="gear">
    طرح‌واره کامل پیکربندی `skills.*`.
  </Card>
  <Card title="ClawHub" href="/fa/clawhub" icon="cloud">
    مهارت‌ها را در رجیستری عمومی مرور و منتشر کنید.
  </Card>
  <Card title="ساخت Pluginها" href="/fa/plugins/building-plugins" icon="plug">
    Pluginها می‌توانند Skills را همراه ابزارهایی که مستند می‌کنند عرضه کنند.
  </Card>
</CardGroup>
