---
read_when:
    - می‌خواهید از GitHub Copilot به‌عنوان ارائه‌دهندهٔ مدل استفاده کنید
    - به جریان `openclaw models auth login-github-copilot` نیاز دارید
    - شما در حال انتخاب میان ارائه‌دهندهٔ داخلی Copilot، چارچوب اجرای Copilot SDK و Copilot Proxy هستید
summary: ورود به GitHub Copilot از OpenClaw با استفاده از جریان دستگاه یا وارد کردن توکن به‌صورت غیرتعاملی
title: GitHub Copilot
x-i18n:
    generated_at: "2026-06-27T18:40:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0cd7103ec880592b1f4506ed844abe788f53040f3751e7034daf9aafedc2f94
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot دستیار کدنویسی هوش مصنوعی GitHub است. این ابزار برای حساب و پلن GitHub شما دسترسی به مدل‌های Copilot را فراهم می‌کند. OpenClaw می‌تواند از Copilot به‌عنوان ارائه‌دهندهٔ مدل یا زمان‌اجرای عامل به سه روش متفاوت استفاده کند.

## سه روش برای استفاده از Copilot در OpenClaw

<Tabs>
  <Tab title="ارائه‌دهندهٔ داخلی (github-copilot)">
    از جریان ورود بومی دستگاه برای دریافت توکن GitHub استفاده کنید، سپس هنگام اجرای OpenClaw آن را با توکن‌های API مربوط به Copilot مبادله کنید. این مسیر **پیش‌فرض** و ساده‌ترین گزینه است، چون به VS Code نیاز ندارد.

    <Steps>
      <Step title="اجرای دستور ورود">
        ```bash
        openclaw models auth login-github-copilot
        ```

        از شما خواسته می‌شود به یک URL مراجعه کنید و یک کد یک‌بارمصرف وارد کنید. ترمینال را تا پایان فرایند باز نگه دارید.
      </Step>
      <Step title="تنظیم یک مدل پیش‌فرض">
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

  <Tab title="Plugin مهار SDK مربوط به Copilot (copilot)">
    زمانی Plugin خارجی `@openclaw/copilot` را نصب کنید که می‌خواهید CLI و SDK مربوط به Copilot در GitHub مالک حلقهٔ سطح پایین عامل برای مدل‌های منتخب `github-copilot/*` باشند.

    ```bash
    openclaw plugins install clawhub:@openclaw/copilot
    ```

    سپس یک مدل یا ارائه‌دهنده را برای زمان‌اجرا فعال کنید:

    ```json5
    {
      agents: {
        defaults: {
          model: "github-copilot/gpt-5.5",
          models: {
            "github-copilot/gpt-5.5": {
              agentRuntime: { id: "copilot" },
            },
          },
        },
      },
    }
    ```

    این گزینه را زمانی انتخاب کنید که نشست‌های بومی CLI مربوط به Copilot، وضعیت رشتهٔ مدیریت‌شده توسط SDK، و Compaction تحت مالکیت Copilot را برای آن نوبت‌های عامل می‌خواهید. برای قرارداد کامل زمان‌اجرا، [مهار SDK مربوط به Copilot](/fa/plugins/copilot) را ببینید.

  </Tab>

  <Tab title="Plugin پروکسی Copilot (copilot-proxy)">
    از افزونهٔ VS Code با نام **پروکسی Copilot** به‌عنوان یک پل محلی استفاده کنید. OpenClaw با نقطهٔ پایانی `/v1` پروکسی ارتباط می‌گیرد و از فهرست مدل‌هایی که آنجا پیکربندی می‌کنید استفاده می‌کند.

    <Note>
    این گزینه را زمانی انتخاب کنید که از قبل پروکسی Copilot را در VS Code اجرا می‌کنید یا باید مسیر را از آن عبور دهید. باید Plugin را فعال کنید و افزونهٔ VS Code را در حال اجرا نگه دارید.
    </Note>

  </Tab>
</Tabs>

## پرچم‌های اختیاری

| پرچم            | توضیح                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | عبور از اعلان تأیید                        |
| `--set-default` | مدل پیش‌فرض توصیه‌شدهٔ ارائه‌دهنده را نیز اعمال می‌کند |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## آماده‌سازی غیرتعاملی

اگر از قبل یک توکن دسترسی OAuth مربوط به GitHub برای Copilot دارید، آن را هنگام راه‌اندازی بدون رابط تعاملی با `openclaw onboard --non-interactive` وارد کنید:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

همچنین می‌توانید `--auth-choice` را حذف کنید؛ ارسال `--github-copilot-token` گزینهٔ احراز هویت ارائه‌دهندهٔ GitHub Copilot را استنباط می‌کند. اگر این پرچم حذف شود، آماده‌سازی به‌ترتیب به `COPILOT_GITHUB_TOKEN`، سپس `GH_TOKEN`، و سپس `GITHUB_TOKEN` برمی‌گردد. برای ذخیرهٔ `tokenRef` مبتنی بر env به‌جای متن ساده در `auth-profiles.json`، از `--secret-input-mode ref` در حالی استفاده کنید که `COPILOT_GITHUB_TOKEN` تنظیم شده است.

<AccordionGroup>
  <Accordion title="TTY تعاملی الزامی است">
    جریان ورود دستگاه به TTY تعاملی نیاز دارد. آن را مستقیماً در ترمینال اجرا کنید، نه در یک اسکریپت غیرتعاملی یا خط لولهٔ CI.
  </Accordion>

  <Accordion title="دسترس‌پذیری مدل به پلن شما بستگی دارد">
    دسترس‌پذیری مدل‌های Copilot به پلن GitHub شما بستگی دارد. اگر یک مدل رد شد، شناسهٔ دیگری را امتحان کنید (برای مثال `github-copilot/gpt-5.5`). برای فهرست فعلی مدل‌ها، [مدل‌های پشتیبانی‌شده به‌ازای هر پلن Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan) در GitHub را ببینید.
  </Accordion>

  <Accordion title="بازآوری کاتالوگ زنده از API مربوط به Copilot">
    پس از اینکه مسیر احراز هویت ورود دستگاه (یا env-var) یک توکن GitHub را حل کرد، OpenClaw کاتالوگ مدل را در صورت نیاز از `${baseUrl}/models` بازآوری می‌کند (همان نقطهٔ پایانی که VS Code Copilot استفاده می‌کند) تا زمان‌اجرا، مجوزهای هر حساب و پنجره‌های زمینهٔ دقیق را بدون تغییر مداوم manifest دنبال کند. مدل‌های تازه‌منتشرشدهٔ Copilot بدون ارتقای OpenClaw قابل مشاهده می‌شوند، و پنجره‌های زمینه محدودیت‌های واقعی هر مدل را بازتاب می‌دهند (مثلاً 400k برای سری gpt-5.x، و 1M برای گونه‌های داخلی `claude-opus-*-1m`).

    کاتالوگ ایستای همراه، زمانی به‌عنوان جایگزین قابل مشاهده باقی می‌ماند که کشف غیرفعال باشد، کاربر هیچ پروفایل احراز هویت GitHub نداشته باشد، تبادل توکن شکست بخورد، یا فراخوانی HTTPS به `/models` خطا بدهد. برای انصراف و اتکا کامل به کاتالوگ manifest ایستا (سناریوهای آفلاین / air-gapped):

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
    شناسه‌های مدل Claude به‌صورت خودکار از انتقال Anthropic Messages استفاده می‌کنند. مدل‌های GPT، o-series و Gemini انتقال OpenAI Responses را حفظ می‌کنند. OpenClaw انتقال درست را بر اساس ارجاع مدل انتخاب می‌کند.
  </Accordion>

  <Accordion title="سازگاری درخواست">
    OpenClaw سرآیندهای درخواست به سبک IDE مربوط به Copilot را روی انتقال‌های Copilot ارسال می‌کند، از جمله نوبت‌های پیگیری Compaction داخلی، نتیجهٔ ابزار، و تصویر. OpenClaw ادامهٔ Responses در سطح ارائه‌دهنده را برای Copilot فعال نمی‌کند، مگر اینکه آن رفتار در برابر API مربوط به Copilot راستی‌آزمایی شده باشد.
  </Accordion>

  <Accordion title="ترتیب حل متغیرهای محیطی">
    OpenClaw احراز هویت Copilot را از متغیرهای محیطی با ترتیب اولویت زیر حل می‌کند:

    | اولویت | متغیر              | یادداشت‌ها                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | بالاترین اولویت، ویژهٔ Copilot |
    | 2        | `GH_TOKEN`            | توکن CLI مربوط به GitHub (جایگزین)      |
    | 3        | `GITHUB_TOKEN`        | توکن استاندارد GitHub (پایین‌ترین)   |

    وقتی چند متغیر تنظیم شده باشند، OpenClaw از موردی با بالاترین اولویت استفاده می‌کند. جریان ورود دستگاه (`openclaw models auth login-github-copilot`) توکن خود را در محل ذخیرهٔ پروفایل احراز هویت ذخیره می‌کند و بر همهٔ متغیرهای محیطی تقدم دارد.

  </Accordion>

  <Accordion title="ذخیره‌سازی توکن">
    ورود، یک توکن GitHub را در محل ذخیرهٔ پروفایل احراز هویت ذخیره می‌کند و هنگام اجرای OpenClaw آن را با یک توکن API مربوط به Copilot مبادله می‌کند. نیازی نیست توکن را به‌صورت دستی مدیریت کنید.
  </Accordion>
</AccordionGroup>

<Warning>
دستور ورود دستگاه به TTY تعاملی نیاز دارد. هنگامی که به راه‌اندازی بدون رابط تعاملی نیاز دارید، از آماده‌سازی غیرتعاملی استفاده کنید.
</Warning>

## embeddingهای جست‌وجوی حافظه

GitHub Copilot همچنین می‌تواند به‌عنوان ارائه‌دهندهٔ embedding برای [جست‌وجوی حافظه](/fa/concepts/memory-search) عمل کند. اگر اشتراک Copilot دارید و وارد شده‌اید، OpenClaw می‌تواند بدون کلید API جداگانه از آن برای embeddingها استفاده کند.

### پیکربندی

برای استفاده از embeddingهای GitHub Copilot، `memorySearch.provider` را صریحاً تنظیم کنید. اگر توکن GitHub در دسترس باشد، OpenClaw مدل‌های embedding موجود را از API مربوط به Copilot کشف می‌کند و بهترین گزینه را به‌صورت خودکار انتخاب می‌کند.

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

### سازوکار

1. OpenClaw توکن GitHub شما را حل می‌کند (از env vars یا پروفایل احراز هویت).
2. آن را با یک توکن API کوتاه‌عمر مربوط به Copilot مبادله می‌کند.
3. از نقطهٔ پایانی `/models` مربوط به Copilot برای کشف مدل‌های embedding موجود پرس‌وجو می‌کند.
4. بهترین مدل را انتخاب می‌کند (ترجیحاً `text-embedding-3-small`).
5. درخواست‌های embedding را به نقطهٔ پایانی `/embeddings` مربوط به Copilot ارسال می‌کند.

دسترس‌پذیری مدل به پلن GitHub شما بستگی دارد. اگر هیچ مدل embedding در دسترس نباشد، OpenClaw از Copilot عبور می‌کند و ارائه‌دهندهٔ بعدی را امتحان می‌کند.

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="OAuth و احراز هویت" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفادهٔ دوباره از اعتبارنامه.
  </Card>
</CardGroup>
