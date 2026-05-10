---
read_when:
    - می‌خواهید از GitHub Copilot به‌عنوان ارائه‌دهندهٔ مدل استفاده کنید
    - به جریان `openclaw models auth login-github-copilot` نیاز دارید
summary: با استفاده از جریان دستگاه یا واردسازی توکن غیرتعاملی، از OpenClaw به GitHub Copilot وارد شوید
title: GitHub Copilot
x-i18n:
    generated_at: "2026-05-10T20:02:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 32268f86bc3e9d4f4d09d105c78c0fc9527aaebd8251865899711e86b25391e5
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot دستیار کدنویسی هوش مصنوعی GitHub است. این ابزار برای حساب و طرح GitHub شما به مدل‌های Copilot دسترسی فراهم می‌کند. OpenClaw می‌تواند از Copilot به‌عنوان ارائه‌دهنده مدل به دو روش متفاوت استفاده کند.

## دو روش برای استفاده از Copilot در OpenClaw

<Tabs>
  <Tab title="ارائه‌دهنده داخلی (github-copilot)">
    از جریان بومی ورود با دستگاه برای دریافت توکن GitHub استفاده کنید، سپس هنگام اجرای OpenClaw آن را با
    توکن‌های API Copilot مبادله کنید. این مسیر **پیش‌فرض** و ساده‌ترین راه است،
    چون به VS Code نیاز ندارد.

    <Steps>
      <Step title="اجرای فرمان ورود">
        ```bash
        openclaw models auth login-github-copilot
        ```

        از شما خواسته می‌شود به یک URL بروید و یک کد یک‌بارمصرف وارد کنید. تا زمان تکمیل،
        ترمینال را باز نگه دارید.
      </Step>
      <Step title="تنظیم مدل پیش‌فرض">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        یا در پیکربندی:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Plugin پروکسی Copilot (copilot-proxy)">
    از افزونه VS Code **Copilot Proxy** به‌عنوان یک پل محلی استفاده کنید. OpenClaw با
    نقطه پایانی `/v1` پروکسی ارتباط برقرار می‌کند و از فهرست مدل‌هایی استفاده می‌کند که آنجا پیکربندی می‌کنید.

    <Note>
    زمانی این گزینه را انتخاب کنید که از قبل Copilot Proxy را در VS Code اجرا می‌کنید یا باید
    ترافیک را از طریق آن مسیریابی کنید. باید Plugin را فعال کنید و افزونه VS Code را در حال اجرا نگه دارید.
    </Note>

  </Tab>
</Tabs>

## پرچم‌های اختیاری

| پرچم            | توضیح                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | رد کردن اعلان تأیید                        |
| `--set-default` | همچنین مدل پیش‌فرض پیشنهادی ارائه‌دهنده را اعمال می‌کند |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## راه‌اندازی غیرتعاملی

اگر از قبل یک توکن دسترسی GitHub OAuth برای Copilot دارید، آن را در هنگام
راه‌اندازی بدون رابط تعاملی با `openclaw onboard --non-interactive` وارد کنید:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

همچنین می‌توانید `--auth-choice` را حذف کنید؛ ارسال `--github-copilot-token` گزینه احراز هویت
ارائه‌دهنده GitHub Copilot را استنتاج می‌کند. اگر این پرچم حذف شود، راه‌اندازی به‌ترتیب به
`COPILOT_GITHUB_TOKEN`، سپس `GH_TOKEN` و بعد `GITHUB_TOKEN` بازمی‌گردد. از
`--secret-input-mode ref` همراه با تنظیم `COPILOT_GITHUB_TOKEN` استفاده کنید تا به‌جای متن آشکار در
`auth-profiles.json` یک `tokenRef` مبتنی بر متغیر محیطی ذخیره شود.

<AccordionGroup>
  <Accordion title="TTY تعاملی لازم است">
    جریان ورود با دستگاه به یک TTY تعاملی نیاز دارد. آن را مستقیماً در
    ترمینال اجرا کنید، نه در اسکریپت غیرتعاملی یا خط لوله CI.
  </Accordion>

  <Accordion title="دسترس‌پذیری مدل به طرح شما بستگی دارد">
    دسترس‌پذیری مدل‌های Copilot به طرح GitHub شما بستگی دارد. اگر مدلی
    رد شد، شناسه دیگری را امتحان کنید (برای مثال `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="تازه‌سازی زنده کاتالوگ از API Copilot">
    پس از اینکه مسیر احراز هویت ورود با دستگاه (یا متغیر محیطی) یک توکن GitHub را حل کرد،
    OpenClaw کاتالوگ مدل را برحسب تقاضا از `${baseUrl}/models`
    (همان نقطه پایانی که VS Code Copilot استفاده می‌کند) تازه‌سازی می‌کند تا زمان اجرا
    استحقاق هر حساب و پنجره‌های زمینه دقیق را بدون تغییر مانیفست دنبال کند.
    مدل‌های Copilot تازه منتشرشده بدون ارتقای OpenClaw قابل مشاهده می‌شوند،
    و پنجره‌های زمینه محدودیت‌های واقعی هر مدل را بازتاب می‌دهند
    (مثلاً 400k برای سری gpt-5.x و 1M برای گونه‌های داخلی
    `claude-opus-*-1m`).

    کاتالوگ ایستای همراه، زمانی که کشف غیرفعال است، کاربر پروفایل احراز هویت GitHub ندارد،
    مبادله توکن شکست می‌خورد، یا فراخوانی HTTPS به `/models` خطا می‌دهد،
    به‌عنوان پشتیبان قابل مشاهده باقی می‌ماند. برای انصراف و اتکای کامل
    به کاتالوگ مانیفست ایستا (سناریوهای آفلاین / جدا از شبکه):

    ```json5
    {
      plugins: {
        entries: {
          "github-copilot": {
            config: { discovery: { enabled: false } },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="انتخاب انتقال">
    شناسه‌های مدل Claude به‌صورت خودکار از انتقال Anthropic Messages استفاده می‌کنند. مدل‌های GPT،
    سری o و Gemini انتقال OpenAI Responses را نگه می‌دارند. OpenClaw
    انتقال درست را براساس ارجاع مدل انتخاب می‌کند.
  </Accordion>

  <Accordion title="سازگاری درخواست">
    OpenClaw سرآیندهای درخواست به سبک IDE Copilot را روی انتقال‌های Copilot ارسال می‌کند،
    از جمله نوبت‌های داخلی Compaction، نتیجه ابزار، و پیگیری تصویر. این ابزار
    ادامه Responses در سطح ارائه‌دهنده را برای Copilot فعال نمی‌کند، مگر اینکه
    آن رفتار در برابر API Copilot تأیید شده باشد.
  </Accordion>

  <Accordion title="ترتیب حل متغیرهای محیطی">
    OpenClaw احراز هویت Copilot را از متغیرهای محیطی با ترتیب اولویت زیر
    حل می‌کند:

    | اولویت | متغیر              | یادداشت‌ها                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | بالاترین اولویت، مخصوص Copilot |
    | 2        | `GH_TOKEN`            | توکن GitHub CLI (پشتیبان)      |
    | 3        | `GITHUB_TOKEN`        | توکن استاندارد GitHub (پایین‌ترین)   |

    وقتی چند متغیر تنظیم شده باشد، OpenClaw از موردی با بالاترین اولویت استفاده می‌کند.
    جریان ورود با دستگاه (`openclaw models auth login-github-copilot`) توکن خود را
    در مخزن پروفایل احراز هویت ذخیره می‌کند و بر همه متغیرهای محیطی
    اولویت دارد.

  </Accordion>

  <Accordion title="ذخیره‌سازی توکن">
    ورود، یک توکن GitHub را در مخزن پروفایل احراز هویت ذخیره می‌کند و هنگام اجرای OpenClaw
    آن را با یک توکن API Copilot مبادله می‌کند. نیازی نیست توکن را به‌صورت دستی
    مدیریت کنید.
  </Accordion>
</AccordionGroup>

<Warning>
فرمان ورود با دستگاه به یک TTY تعاملی نیاز دارد. وقتی به راه‌اندازی بدون رابط تعاملی
نیاز دارید، از راه‌اندازی غیرتعاملی استفاده کنید.
</Warning>

## تعبیه‌های جست‌وجوی حافظه

GitHub Copilot همچنین می‌تواند به‌عنوان ارائه‌دهنده تعبیه برای
[جست‌وجوی حافظه](/fa/concepts/memory-search) عمل کند. اگر اشتراک Copilot دارید و
وارد شده‌اید، OpenClaw می‌تواند بدون کلید API جداگانه از آن برای تعبیه‌ها استفاده کند.

### تشخیص خودکار

وقتی `memorySearch.provider` برابر `"auto"` باشد (پیش‌فرض)، GitHub Copilot
با اولویت 15 امتحان می‌شود -- بعد از تعبیه‌های محلی اما قبل از OpenAI و سایر
ارائه‌دهندگان پولی. اگر توکن GitHub در دسترس باشد، OpenClaw مدل‌های
تعبیه موجود را از API Copilot کشف می‌کند و بهترین مورد را به‌صورت خودکار انتخاب می‌کند.

### پیکربندی صریح

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: override the auto-discovered model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### نحوه کار

1. OpenClaw توکن GitHub شما را حل می‌کند (از متغیرهای محیطی یا پروفایل احراز هویت).
2. آن را با یک توکن کوتاه‌مدت API Copilot مبادله می‌کند.
3. نقطه پایانی `/models` در Copilot را برای کشف مدل‌های تعبیه موجود پرس‌وجو می‌کند.
4. بهترین مدل را انتخاب می‌کند (ترجیحاً `text-embedding-3-small`).
5. درخواست‌های تعبیه را به نقطه پایانی `/embeddings` در Copilot ارسال می‌کند.

دسترس‌پذیری مدل به طرح GitHub شما بستگی دارد. اگر هیچ مدل تعبیه‌ای
در دسترس نباشد، OpenClaw از Copilot عبور می‌کند و ارائه‌دهنده بعدی را امتحان می‌کند.

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="OAuth و احراز هویت" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفاده مجدد از اعتبارنامه.
  </Card>
</CardGroup>
