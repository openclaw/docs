---
read_when:
    - می‌خواهید از GitHub Copilot به‌عنوان ارائه‌دهندهٔ مدل استفاده کنید
    - به جریان `openclaw models auth login-github-copilot` نیاز دارید
summary: از OpenClaw با استفاده از جریان دستگاه یا وارد کردن توکن غیرتعاملی به GitHub Copilot وارد شوید
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-29T23:25:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ebcee41d4a3fffff8f20072e99e6dbb57baa2d9ec7eddad1d426ee37805597c
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot دستیار کدنویسی هوش مصنوعی GitHub است. این ابزار دسترسی به مدل‌های Copilot
را برای حساب و طرح GitHub شما فراهم می‌کند. OpenClaw می‌تواند از Copilot به‌عنوان ارائه‌دهنده مدل
به دو روش متفاوت استفاده کند.

## دو روش برای استفاده از Copilot در OpenClaw

<Tabs>
  <Tab title="Built-in provider (github-copilot)">
    از جریان ورود بومی دستگاه برای دریافت توکن GitHub استفاده کنید، سپس هنگام اجرای OpenClaw آن را با
    توکن‌های API Copilot مبادله کنید. این مسیر **پیش‌فرض** و ساده‌ترین روش است
    چون به VS Code نیاز ندارد.

    <Steps>
      <Step title="Run the login command">
        ```bash
        openclaw models auth login-github-copilot
        ```

        از شما خواسته می‌شود یک URL را باز کنید و یک کد یک‌بارمصرف وارد کنید. تا زمان
        تکمیل شدن فرایند، ترمینال را باز نگه دارید.
      </Step>
      <Step title="Set a default model">
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

  <Tab title="Copilot Proxy plugin (copilot-proxy)">
    از افزونه VS Code با نام **Copilot Proxy** به‌عنوان یک پل محلی استفاده کنید. OpenClaw با
    نقطه پایانی `/v1` پراکسی صحبت می‌کند و از فهرست مدل‌هایی که آنجا پیکربندی می‌کنید استفاده می‌کند.

    <Note>
    وقتی از قبل Copilot Proxy را در VS Code اجرا می‌کنید یا باید درخواست‌ها را
    از طریق آن مسیریابی کنید، این گزینه را انتخاب کنید. باید Plugin را فعال کنید و افزونه VS Code را در حال اجرا نگه دارید.
    </Note>

  </Tab>
</Tabs>

## پرچم‌های اختیاری

| پرچم            | توضیح                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | اعلان تأیید را رد می‌کند                        |
| `--set-default` | مدل پیش‌فرض پیشنهادی ارائه‌دهنده را نیز اعمال می‌کند |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## راه‌اندازی غیرتعاملی

اگر از قبل یک توکن دسترسی OAuth برای GitHub Copilot دارید، آن را هنگام
راه‌اندازی headless با `openclaw onboard --non-interactive` وارد کنید:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

همچنین می‌توانید `--auth-choice` را حذف کنید؛ ارسال `--github-copilot-token` انتخاب احراز هویت
ارائه‌دهنده GitHub Copilot را استنباط می‌کند. اگر این پرچم حذف شود، راه‌اندازی
به‌ترتیب به `COPILOT_GITHUB_TOKEN`، سپس `GH_TOKEN`، و بعد `GITHUB_TOKEN` برمی‌گردد. از
`--secret-input-mode ref` همراه با تنظیم بودن `COPILOT_GITHUB_TOKEN` استفاده کنید تا به‌جای متن ساده در `auth-profiles.json`، یک
`tokenRef` مبتنی بر متغیر محیطی ذخیره شود.

<AccordionGroup>
  <Accordion title="Interactive TTY required">
    جریان ورود دستگاه به یک TTY تعاملی نیاز دارد. آن را مستقیماً در
    ترمینال اجرا کنید، نه در یک اسکریپت غیرتعاملی یا خط لوله CI.
  </Accordion>

  <Accordion title="Model availability depends on your plan">
    دسترس‌پذیری مدل‌های Copilot به طرح GitHub شما بستگی دارد. اگر یک مدل
    رد شد، شناسه دیگری را امتحان کنید، برای مثال `github-copilot/gpt-4.1`.
  </Accordion>

  <Accordion title="Transport selection">
    شناسه‌های مدل Claude به‌طور خودکار از انتقال Anthropic Messages استفاده می‌کنند. مدل‌های GPT،
    سری o، و Gemini انتقال OpenAI Responses را نگه می‌دارند. OpenClaw
    انتقال درست را بر اساس ارجاع مدل انتخاب می‌کند.
  </Accordion>

  <Accordion title="Request compatibility">
    OpenClaw در انتقال‌های Copilot سرآیندهای درخواست به سبک IDE مربوط به Copilot را ارسال می‌کند،
    از جمله نوبت‌های داخلی Compaction، نتیجه ابزار، و پیگیری تصویر. این ابزار
    ادامه‌دهی Responses در سطح ارائه‌دهنده را برای Copilot فعال نمی‌کند، مگر اینکه
    آن رفتار در برابر API Copilot تأیید شده باشد.
  </Accordion>

  <Accordion title="Environment variable resolution order">
    OpenClaw احراز هویت Copilot را از متغیرهای محیطی با ترتیب اولویت زیر
    حل می‌کند:

    | اولویت | متغیر              | یادداشت‌ها                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | بالاترین اولویت، مخصوص Copilot |
    | 2        | `GH_TOKEN`            | توکن GitHub CLI (جایگزین)      |
    | 3        | `GITHUB_TOKEN`        | توکن استاندارد GitHub (کمترین اولویت)   |

    وقتی چند متغیر تنظیم شده باشند، OpenClaw از موردی با بالاترین اولویت استفاده می‌کند.
    جریان ورود دستگاه (`openclaw models auth login-github-copilot`) توکن
    خود را در مخزن پروفایل احراز هویت ذخیره می‌کند و بر همه متغیرهای محیطی
    مقدم است.

  </Accordion>

  <Accordion title="Token storage">
    ورود، یک توکن GitHub را در مخزن پروفایل احراز هویت ذخیره می‌کند و هنگام اجرای OpenClaw آن را
    با یک توکن API Copilot مبادله می‌کند. لازم نیست توکن را
    دستی مدیریت کنید.
  </Accordion>
</AccordionGroup>

<Warning>
دستور ورود دستگاه به یک TTY تعاملی نیاز دارد. وقتی به راه‌اندازی headless نیاز دارید
از راه‌اندازی غیرتعاملی استفاده کنید.
</Warning>

## embeddingهای جست‌وجوی حافظه

GitHub Copilot همچنین می‌تواند به‌عنوان ارائه‌دهنده embedding برای
[جست‌وجوی حافظه](/fa/concepts/memory-search) عمل کند. اگر اشتراک Copilot دارید و
وارد شده‌اید، OpenClaw می‌تواند بدون کلید API جداگانه از آن برای embeddingها استفاده کند.

### تشخیص خودکار

وقتی `memorySearch.provider` برابر `"auto"` باشد (حالت پیش‌فرض)، GitHub Copilot با
اولویت 15 امتحان می‌شود -- بعد از embeddingهای محلی اما قبل از OpenAI و سایر
ارائه‌دهندگان پولی. اگر توکن GitHub در دسترس باشد، OpenClaw مدل‌های
embedding موجود را از API Copilot کشف می‌کند و بهترین مورد را به‌طور خودکار انتخاب می‌کند.

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
3. از نقطه پایانی `/models` در Copilot پرس‌وجو می‌کند تا مدل‌های embedding موجود را کشف کند.
4. بهترین مدل را انتخاب می‌کند (ترجیحاً `text-embedding-3-small`).
5. درخواست‌های embedding را به نقطه پایانی `/embeddings` در Copilot ارسال می‌کند.

دسترس‌پذیری مدل به طرح GitHub شما بستگی دارد. اگر هیچ مدل embedding در دسترس
نباشد، OpenClaw از Copilot عبور می‌کند و ارائه‌دهنده بعدی را امتحان می‌کند.

## مرتبط

<CardGroup cols={2}>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="OAuth and auth" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفاده مجدد از اعتبارنامه‌ها.
  </Card>
</CardGroup>
