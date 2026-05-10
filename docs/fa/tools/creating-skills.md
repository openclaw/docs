---
read_when:
    - شما در حال ایجاد یک مهارت سفارشی جدید در فضای کاری خود هستید
    - به یک گردش‌کار شروع سریع برای Skills مبتنی بر SKILL.md نیاز دارید
summary: Skills سفارشی فضای کاری را با SKILL.md بسازید و آزمایش کنید
title: ایجاد Skills
x-i18n:
    generated_at: "2026-05-10T20:09:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: a468a0b21f4e43542b175b8acb8ad8b19dbbea06ce8e0b97c48206bf88a661c5
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills به عامل می‌آموزد چگونه و چه زمانی از ابزارها استفاده کند. هر مهارت یک دایرکتوری است
که شامل یک فایل `SKILL.md` با فرانت‌متر YAML و دستورالعمل‌های markdown است.

برای نحوه بارگذاری و اولویت‌بندی مهارت‌ها، [Skills](/fa/tools/skills) را ببینید.

## نخستین مهارت خود را بسازید

<Steps>
  <Step title="Create the skill directory">
    Skills در فضای کاری شما قرار دارد. یک پوشه جدید بسازید:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Write SKILL.md">
    در آن دایرکتوری `SKILL.md` بسازید. فرانت‌متر، فراداده را تعریف می‌کند،
    و بدنه markdown شامل دستورالعمل‌هایی برای عامل است.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

    برای `name` مهارت، از قالب خط‌تیره‌ای با حروف کوچک، رقم‌ها و خط‌تیره‌ها
    استفاده کنید. نام پوشه و `name` در فرانت‌متر را هماهنگ نگه دارید.

  </Step>

  <Step title="Add tools (optional)">
    می‌توانید طرح‌واره‌های ابزار سفارشی را در فرانت‌متر تعریف کنید یا به عامل دستور دهید
    از ابزارهای سیستمی موجود (مانند `exec` یا `browser`) استفاده کند. Skills همچنین می‌تواند
    داخل plugins و همراه ابزارهایی که مستند می‌کند ارائه شود.

  </Step>

  <Step title="Load the skill">
    یک نشست جدید شروع کنید تا OpenClaw مهارت را شناسایی کند:

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    بررسی کنید که مهارت بارگذاری شده باشد:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Test it">
    پیامی بفرستید که باید مهارت را فعال کند:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    یا فقط با عامل گفت‌وگو کنید و درخواست یک احوال‌پرسی بدهید.

  </Step>
</Steps>

## مرجع فراداده مهارت

فرانت‌متر YAML از این فیلدها پشتیبانی می‌کند:

| فیلد                                | الزامی | توضیح                                                            |
| ----------------------------------- | ------ | ---------------------------------------------------------------- |
| `name`                              | بله    | شناسه یکتا با استفاده از حروف کوچک، رقم‌ها و خط‌تیره‌ها         |
| `description`                       | بله    | توضیح یک‌خطی که به عامل نشان داده می‌شود                        |
| `metadata.openclaw.os`              | خیر    | فیلتر سیستم‌عامل (`["darwin"]`، `["linux"]` و غیره)             |
| `metadata.openclaw.requires.bins`   | خیر    | باینری‌های لازم در PATH                                          |
| `metadata.openclaw.requires.config` | خیر    | کلیدهای پیکربندی لازم                                            |

## بهترین روش‌ها

- **مختصر باشید** — به مدل بگویید _چه کاری_ انجام دهد، نه اینکه چگونه یک هوش مصنوعی باشد
- **اول ایمنی** — اگر مهارت شما از `exec` استفاده می‌کند، مطمئن شوید پرامپت‌ها اجازه تزریق فرمان دلخواه از ورودی نامعتبر را نمی‌دهند
- **محلی آزمایش کنید** — پیش از اشتراک‌گذاری، با `openclaw agent --message "..."` آزمایش کنید
- **از ClawHub استفاده کنید** — مهارت‌ها را در [ClawHub](https://clawhub.ai) مرور کنید و مشارکت داشته باشید

## محل قرارگیری مهارت‌ها

| مکان                            | اولویت       | دامنه                        |
| ------------------------------- | ------------ | ---------------------------- |
| `\<workspace\>/skills/`         | بالاترین     | برای هر عامل                 |
| `\<workspace\>/.agents/skills/` | بالا         | عاملِ هر فضای کاری           |
| `~/.agents/skills/`             | متوسط        | پروفایل عامل مشترک           |
| `~/.openclaw/skills/`           | متوسط        | مشترک (همه عامل‌ها)          |
| همراه بسته (ارائه‌شده با OpenClaw) | پایین      | سراسری                       |
| `skills.load.extraDirs`         | پایین‌ترین   | پوشه‌های مشترک سفارشی        |

## مرتبط

- [مرجع Skills](/fa/tools/skills) — قواعد بارگذاری، اولویت و دروازه‌گذاری
- [پیکربندی Skills](/fa/tools/skills-config) — طرح‌واره پیکربندی `skills.*`
- [ClawHub](/fa/clawhub) — رجیستری عمومی مهارت‌ها
- [ساخت Plugins](/fa/plugins/building-plugins) — plugins می‌توانند Skills ارائه کنند
