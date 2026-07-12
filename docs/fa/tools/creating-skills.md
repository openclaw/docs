---
read_when:
    - شما در حال ایجاد یک Skill سفارشی جدید هستید
    - به یک گردش‌کار شروع سریع برای Skills مبتنی بر SKILL.md نیاز دارید
    - می‌خواهید از کارگاه Skills برای پیشنهاد یک Skills جهت بازبینی توسط عامل استفاده کنید
sidebarTitle: Creating skills
summary: Skills سفارشی فضای کاری در `SKILL.md` را برای عامل‌های OpenClaw خود بسازید، آزمایش و منتشر کنید.
title: ایجاد Skills
x-i18n:
    generated_at: "2026-07-12T10:51:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills به عامل می‌آموزند چگونه و چه زمانی از ابزارها استفاده کند. هر Skill یک پوشه است
که شامل فایل `SKILL.md` با فرانت‌متر YAML و دستورالعمل‌های Markdown می‌شود.
OpenClaw، Skills را از چندین ریشه و طبق یک [ترتیب تقدم](/fa/tools/skills#loading-order) مشخص بارگیری می‌کند.

## نخستین Skill خود را ایجاد کنید

<Steps>
  <Step title="پوشه Skill را ایجاد کنید">
    Skills در پوشه `skills/` فضای کاری شما قرار می‌گیرند:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    برای سازمان‌دهی می‌توانید Skills را در زیرپوشه‌ها گروه‌بندی کنید — نام Skill همچنان
    از فرانت‌متر `SKILL.md` گرفته می‌شود، نه از مسیر پوشه:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # نام Skill همچنان "hello-world" است و به‌شکل /hello-world فراخوانی می‌شود
    ```

  </Step>

  <Step title="فایل SKILL.md را بنویسید">
    فرانت‌متر، فراداده را تعریف می‌کند؛ بدنه، دستورالعمل‌ها را در اختیار عامل قرار می‌دهد.

    ```markdown
    ---
    name: hello-world
    description: یک Skill ساده که پیام خوشامدگویی را چاپ می‌کند.
    ---

    # سلام دنیا

    هنگامی که کاربر پیام خوشامدگویی می‌خواهد، از ابزار `exec` برای اجرای دستور زیر استفاده کنید:

    ```bash
    echo "سلام از Skill سفارشی شما!"
    ```
    ```

    قواعد نام‌گذاری:
    - برای `name` از حروف کوچک، ارقام و خط تیره استفاده کنید.
    - نام پوشه و `name` موجود در فرانت‌متر را هماهنگ نگه دارید.
    - مقدار `description` به عامل و در بخش کشف فرمان‌های اسلش نمایش داده می‌شود —
      آن را در یک خط و کمتر از ۱۶۰ نویسه نگه دارید.

  </Step>

  <Step title="بارگیری Skill را بررسی کنید">
    ```bash
    openclaw skills list
    ```

    OpenClaw به‌طور پیش‌فرض فایل‌های `SKILL.md` زیر ریشه‌های Skills را پایش می‌کند. اگر
    پایشگر غیرفعال است یا در حال ادامه‌دادن یک نشست موجود هستید، نشست جدیدی
    آغاز کنید تا عامل فهرست به‌روزشده را دریافت کند:

    ```bash
    # از داخل گفت‌وگو — نشست فعلی را بایگانی کنید و نشستی تازه آغاز کنید
    /new

    # یا Gateway را راه‌اندازی مجدد کنید
    openclaw gateway restart
    ```

  </Step>

  <Step title="آن را آزمایش کنید">
    ```bash
    openclaw agent --message "یک پیام خوشامدگویی به من بده"
    ```

    یا یک گفت‌وگو باز کنید و مستقیماً از عامل بخواهید. برای فراخوانی صریح آن
    با نام، از `/skill hello-world` استفاده کنید.

  </Step>
</Steps>

## مرجع SKILL.md

### فیلدهای الزامی

| فیلد          | توضیحات                                                           |
| ------------- | ----------------------------------------------------------------- |
| `name`        | نامک یکتا با استفاده از حروف کوچک، ارقام و خط تیره                |
| `description` | توضیحی یک‌خطی که به عامل و در خروجی بخش کشف نمایش داده می‌شود     |

### کلیدهای اختیاری فرانت‌متر

| فیلد                       | پیش‌فرض | توضیحات                                                                                   |
| -------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| `user-invocable`           | `true`  | Skill را به‌عنوان فرمان اسلش کاربر در دسترس قرار می‌دهد                                   |
| `disable-model-invocation` | `false` | Skill را از اعلان سیستمی عامل حذف می‌کند (همچنان از طریق `/skill` اجرا می‌شود)            |
| `command-dispatch`         | —       | برای هدایت مستقیم فرمان اسلش به ابزار و دورزدن مدل، روی `tool` تنظیم کنید                 |
| `command-tool`             | —       | نام ابزاری که هنگام تنظیم‌بودن `command-dispatch: tool` فراخوانی می‌شود                   |
| `command-arg-mode`         | `raw`   | برای هدایت به ابزار، رشته آرگومان‌های خام را به ابزار ارسال می‌کند                        |
| `homepage`                 | —       | نشانی اینترنتی که با عنوان «وب‌سایت» در رابط کاربری Skills در macOS نمایش داده می‌شود     |

برای فیلدهای دروازه‌گذاری (`requires.bins`، `requires.env` و غیره)، به
[Skills — دروازه‌گذاری](/fa/tools/skills#gating) مراجعه کنید.

### استفاده از `{baseDir}`

بدون کدنویسی ثابت مسیرها، به فایل‌های داخل پوشه Skill ارجاع دهید —
عامل `{baseDir}` را نسبت به پوشه خود Skill تفکیک می‌کند:

```markdown
اسکریپت کمکی موجود در `{baseDir}/scripts/run.sh` را اجرا کنید.
```

## افزودن فعال‌سازی مشروط

Skill خود را دروازه‌گذاری کنید تا تنها زمانی بارگیری شود که وابستگی‌های آن در دسترس باشند:

```markdown
---
name: gemini-search
description: جست‌وجو با استفاده از Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="گزینه‌های دروازه‌گذاری">
    | کلید | توضیحات |
    | --- | --- |
    | `requires.bins` | همه فایل‌های اجرایی باید در `PATH` موجود باشند |
    | `requires.anyBins` | دست‌کم یک فایل اجرایی باید در `PATH` موجود باشد |
    | `requires.env` | هر متغیر محیطی باید در فرایند یا پیکربندی موجود باشد |
    | `requires.config` | هر مسیر `openclaw.json` باید دارای مقدار درست‌نما باشد |
    | `os` | فیلتر سکو: `["darwin"]`، `["linux"]`، `["win32"]` |
    | `always` | برای نادیده‌گرفتن همه دروازه‌ها و گنجاندن همیشگی Skill، روی `true` تنظیم کنید |

    مرجع کامل: [Skills — دروازه‌گذاری](/fa/tools/skills#gating).

  </Accordion>
  <Accordion title="محیط و کلیدهای API">
    در `openclaw.json` یک کلید API را به ورودی Skill متصل کنید:

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

    کلید تنها برای همان نوبت عامل به فرایند میزبان تزریق می‌شود.
    این کلید به محیط ایزوله نمی‌رسد — به
    [متغیرهای محیطی در محیط ایزوله](/fa/tools/skills-config#sandboxed-skills-and-env-vars) مراجعه کنید.

  </Accordion>
</AccordionGroup>

## پیشنهاد از طریق کارگاه Skill

برای Skills پیش‌نویس‌شده توسط عامل یا زمانی که می‌خواهید پیش از عملیاتی‌شدن یک Skill،
اپراتور آن را بررسی کند، به‌جای نوشتن مستقیم `SKILL.md` از پیشنهادهای
[کارگاه Skill](/fa/tools/skill-workshop) استفاده کنید.

```bash
# پیشنهاد یک Skill کاملاً جدید
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "یک Skill ساده که پیام خوشامدگویی را چاپ می‌کند." \
  --proposal ./PROPOSAL.md

# پیشنهاد به‌روزرسانی یک Skill موجود
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Skill خوشامدگویی به‌روزشده"
```

هنگامی که پیشنهاد شامل فایل‌های پشتیبان است، از `--proposal-dir` استفاده کنید:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "یک Skill ساده که پیام خوشامدگویی را چاپ می‌کند." \
  --proposal-dir ./hello-world-proposal/
```

پوشه باید در ریشه خود دارای `PROPOSAL.md` باشد. فایل‌های پشتیبان در
`assets/`، `examples/`، `references/`، `scripts/` یا `templates/` قرار می‌گیرند.

پس از بررسی:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

برای چرخه کامل پیشنهاد، به [کارگاه Skill](/fa/tools/skill-workshop) مراجعه کنید.

## انتشار در ClawHub

<Steps>
  <Step title="از کامل‌بودن SKILL.md خود اطمینان حاصل کنید">
    مطمئن شوید `name`، `description` و هر فیلد دروازه‌گذاری `metadata.openclaw`
    تنظیم شده‌اند. اگر صفحه پروژه دارید، نشانی اینترنتی `homepage` را اضافه کنید.
  </Step>
  <Step title="CLI مستقل ClawHub را نصب کنید و وارد شوید">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="منتشر کنید">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    برای بازنویسی نسخه استنباط‌شده یا انتشار تحت مالک مشخص، به‌ترتیب
    `--version <version>` یا `--owner <owner>` را اضافه کنید. برای گردش کار کامل،
    محدوده مالک و دیگر فرمان‌های نگه‌داری (`clawhub sync`، `clawhub skill rename`، ...)
    به [ClawHub — انتشار](/fa/clawhub/publishing) و
    [CLI ‏ClawHub](/fa/clawhub/cli) مراجعه کنید.

  </Step>
</Steps>

## بهترین شیوه‌ها

<Tip>
  - **مختصر باشید** — به مدل بگویید *چه کاری* انجام دهد، نه اینکه چگونه یک هوش مصنوعی باشد.
  - **ایمنی در اولویت است** — اگر Skill شما از `exec` استفاده می‌کند، مطمئن شوید اعلان‌ها
    امکان تزریق فرمان دلخواه از ورودی نامعتبر را فراهم نمی‌کنند.
  - **به‌صورت محلی آزمایش کنید** — پیش از اشتراک‌گذاری، از `openclaw agent --message "..."` استفاده کنید.
  - **از ClawHub استفاده کنید** — پیش از ساخت از ابتدا، Skills جامعه را در [clawhub.ai](https://clawhub.ai)
    مرور کنید.
</Tip>

## مطالب مرتبط

<CardGroup cols={2}>
  <Card title="مرجع Skills" href="/fa/tools/skills" icon="puzzle-piece">
    ترتیب بارگیری، دروازه‌گذاری، فهرست‌های مجاز و قالب SKILL.md.
  </Card>
  <Card title="کارگاه Skill" href="/fa/tools/skill-workshop" icon="flask">
    صف پیشنهاد برای Skills پیش‌نویس‌شده توسط عامل.
  </Card>
  <Card title="پیکربندی Skills" href="/fa/tools/skills-config" icon="gear">
    شِمای کامل پیکربندی `skills.*`.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Skills را در رجیستری عمومی مرور و منتشر کنید.
  </Card>
  <Card title="ساخت Pluginها" href="/fa/plugins/building-plugins" icon="plug">
    Pluginها می‌توانند Skills را در کنار ابزارهایی که مستند می‌کنند ارائه دهند.
  </Card>
</CardGroup>
