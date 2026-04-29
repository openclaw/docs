---
read_when:
    - شما در حال ایجاد یک مهارت سفارشی جدید در فضای کاری خود هستید
    - شما به یک گردش‌کار شروع سریع برای Skills مبتنی بر SKILL.md نیاز دارید
summary: ساخت و آزمایش Skills سفارشی فضای کاری با SKILL.md
title: ایجاد Skills
x-i18n:
    generated_at: "2026-04-29T23:41:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201718f4088f4243b0dabe12fb4fce4b8a7e64df9a4b7d651356ab4ae0dd3579
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills به عامل می‌آموزند چگونه و چه زمانی از ابزارها استفاده کند. هر skill یک دایرکتوری است
که شامل یک فایل `SKILL.md` با frontmatter در قالب YAML و دستورالعمل‌های markdown است.

برای اینکه skillها چگونه بارگذاری و اولویت‌بندی می‌شوند، [Skills](/fa/tools/skills) را ببینید.

## نخستین skill خود را بسازید

<Steps>
  <Step title="ساخت دایرکتوری skill">
    Skills در workspace شما قرار می‌گیرند. یک پوشه جدید بسازید:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="نوشتن SKILL.md">
    داخل آن دایرکتوری `SKILL.md` بسازید. frontmatter فراداده را تعریف می‌کند،
    و بدنه markdown شامل دستورالعمل‌ها برای عامل است.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

    برای `name` مربوط به skill از حالت hyphen-case با حروف کوچک، رقم‌ها، و خط تیره استفاده کنید.
    نام پوشه و `name` در frontmatter را هم‌راستا نگه دارید.

  </Step>

  <Step title="افزودن ابزارها (اختیاری)">
    می‌توانید schemaهای ابزار سفارشی را در frontmatter تعریف کنید یا به عامل دستور دهید
    از ابزارهای سیستمی موجود (مانند `exec` یا `browser`) استفاده کند. Skills همچنین می‌توانند
    داخل plugins همراه با ابزارهایی که مستند می‌کنند عرضه شوند.

  </Step>

  <Step title="بارگذاری skill">
    یک session جدید شروع کنید تا OpenClaw، skill را دریافت کند:

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    بررسی کنید که skill بارگذاری شده باشد:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="آزمایش آن">
    پیامی بفرستید که باید skill را فعال کند:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    یا فقط با عامل chat کنید و از او یک greeting بخواهید.

  </Step>
</Steps>

## مرجع فراداده skill

frontmatter در YAML از این فیلدها پشتیبانی می‌کند:

| فیلد                                | الزامی | توضیح                                                          |
| ----------------------------------- | ------ | -------------------------------------------------------------- |
| `name`                              | بله    | شناسه یکتا با استفاده از حروف کوچک، رقم‌ها، و خط تیره‌ها      |
| `description`                       | بله    | توضیح تک‌خطی که به عامل نشان داده می‌شود                      |
| `metadata.openclaw.os`              | خیر    | فیلتر OS (`["darwin"]`, `["linux"]`, و غیره)                   |
| `metadata.openclaw.requires.bins`   | خیر    | binaryهای الزامی روی PATH                                      |
| `metadata.openclaw.requires.config` | خیر    | کلیدهای config الزامی                                          |

## بهترین روش‌ها

- **مختصر باشید** — به مدل بگویید _چه کاری_ انجام دهد، نه اینکه چگونه یک AI باشد
- **ایمنی در اولویت** — اگر skill شما از `exec` استفاده می‌کند، مطمئن شوید promptها اجازه تزریق دستور دلخواه از ورودی نامطمئن را نمی‌دهند
- **به‌صورت محلی آزمایش کنید** — پیش از اشتراک‌گذاری، با `openclaw agent --message "..."` آزمایش کنید
- **از ClawHub استفاده کنید** — skillها را در [ClawHub](https://clawhub.ai) مرور کنید و مشارکت کنید

## محل قرارگیری skillها

| مکان                            | اولویت       | دامنه                    |
| ------------------------------- | ------------ | ------------------------ |
| `\<workspace\>/skills/`         | بالاترین     | برای هر عامل             |
| `\<workspace\>/.agents/skills/` | بالا         | عامل برای هر workspace   |
| `~/.agents/skills/`             | متوسط        | پروفایل عامل مشترک       |
| `~/.openclaw/skills/`           | متوسط        | مشترک (همه عامل‌ها)      |
| Bundled (shipped with OpenClaw) | پایین        | سراسری                   |
| `skills.load.extraDirs`         | پایین‌ترین   | پوشه‌های مشترک سفارشی    |

## مرتبط

- [مرجع Skills](/fa/tools/skills) — قواعد بارگذاری، اولویت، و gating
- [config مربوط به Skills](/fa/tools/skills-config) — schema پیکربندی `skills.*`
- [ClawHub](/fa/tools/clawhub) — registry عمومی skill
- [ساخت Plugins](/fa/plugins/building-plugins) — plugins می‌توانند skills را عرضه کنند
