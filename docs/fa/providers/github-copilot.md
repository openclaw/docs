---
read_when:
    - می‌خواهید از GitHub Copilot به‌عنوان ارائه‌دهندهٔ مدل استفاده کنید
    - شما به جریان `openclaw models auth login-github-copilot` نیاز دارید
    - شما در حال انتخاب بین ارائه‌دهنده داخلی Copilot، چارچوب اجرایی Copilot SDK و Copilot Proxy هستید
summary: با استفاده از جریان دستگاه یا درون‌ریزی توکن غیرتعاملی، از OpenClaw وارد GitHub Copilot شوید
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-12T10:38:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e731d46dd387bbecb0219c4ec3e319fb8d07fd4017da8035561f110501587ad4
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot دستیار کدنویسی هوش مصنوعی GitHub است. این سرویس برای حساب و طرح GitHub شما دسترسی به مدل‌های Copilot را فراهم می‌کند. OpenClaw می‌تواند به سه روش مختلف از Copilot به‌عنوان ارائه‌دهنده مدل یا محیط اجرای عامل استفاده کند.

## سه روش استفاده از Copilot در OpenClaw

<Tabs>
  <Tab title="ارائه‌دهنده داخلی (github-copilot)">
    از جریان بومی ورود با دستگاه برای دریافت توکن GitHub استفاده کنید، سپس هنگام اجرای OpenClaw آن را با توکن‌های API مربوط به Copilot مبادله کنید. این مسیر **پیش‌فرض** و ساده‌ترین گزینه است، زیرا به VS Code نیاز ندارد.

    <Steps>
      <Step title="اجرای فرمان ورود">
        ```bash
        openclaw models auth login-github-copilot
        ```

        از شما خواسته می‌شود به یک نشانی وب مراجعه و یک کد یک‌بارمصرف وارد کنید. تا تکمیل فرایند، پایانه را باز نگه دارید.
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

  <Tab title="Plugin چارچوب Copilot SDK ‏(copilot)">
    زمانی که می‌خواهید Copilot CLI و SDK متعلق به GitHub حلقه سطح پایین عامل را برای مدل‌های انتخاب‌شده `github-copilot/*` مدیریت کنند، Plugin خارجی `@openclaw/copilot` را نصب کنید.

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    سپس یک مدل یا ارائه‌دهنده را برای استفاده از این محیط اجرا فعال کنید:

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

    این گزینه را زمانی انتخاب کنید که برای آن نوبت‌های عامل، نشست‌های بومی Copilot CLI، وضعیت رشته مدیریت‌شده با SDK و Compaction تحت مدیریت Copilot را می‌خواهید. بدون فعال‌سازی صریح `agentRuntime`، مدل‌های `github-copilot/*` همچنان از ارائه‌دهنده داخلی استفاده می‌کنند. برای قرارداد کامل محیط اجرا، به [چارچوب Copilot SDK](/fa/plugins/copilot) مراجعه کنید.

  </Tab>

  <Tab title="Plugin پراکسی Copilot ‏(copilot-proxy)">
    از افزونه VS Code با نام **Copilot Proxy** به‌عنوان یک پل محلی استفاده کنید. OpenClaw با نقطه پایانی `/v1` پراکسی (به‌طور پیش‌فرض `http://localhost:3000/v1`) ارتباط برقرار می‌کند و از فهرست مدل‌هایی که پیکربندی می‌کنید استفاده می‌کند.

    Plugin مربوط به `copilot-proxy` همراه OpenClaw ارائه می‌شود و به‌طور پیش‌فرض فعال است. نشانی پایه و شناسه‌های مدل را با فرمان زیر پیکربندی کنید:

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    این گزینه را زمانی انتخاب کنید که از قبل Copilot Proxy را در VS Code اجرا می‌کنید یا لازم است مسیریابی از طریق آن انجام شود. افزونه VS Code باید در حال اجرا باقی بماند.
    </Note>

  </Tab>
</Tabs>

## GitHub Enterprise ‏(اقامت داده)

اگر سازمان شما از یک مستأجر GitHub Enterprise دارای اقامت داده استفاده می‌کند (میزبانی با الگوی `*.ghe.com` مانند `your-org.ghe.com`)، Copilot به‌جای `github.com` عمومی روی نقاط پایانی محلی همان مستأجر قرار دارد. OpenClaw این حالت را به‌عنوان یک گزینه احراز هویت درجه‌یک ارائه می‌کند تا نیازی به ویرایش دستی نشانی‌ها نداشته باشید.

<Steps>
  <Step title="انتخاب گزینه احراز هویت Enterprise">
    در فرایند راه‌اندازی یا `openclaw models auth`، گزینه **GitHub Copilot (Enterprise / data residency)** را انتخاب کنید. سپس از شما دامنه Enterprise خواسته می‌شود (برای مثال `your-org.ghe.com`) و ورود با دستگاه در همان مستأجر اجرا می‌شود.

    فقط ریشه مستأجر (`your-org.ghe.com`) را وارد کنید. میزبان‌های سرویس مشتق‌شده مانند `api.your-org.ghe.com` یا `copilot-api.your-org.ghe.com` پذیرفته نمی‌شوند؛ OpenClaw این نقاط پایانی را به‌طور خودکار از ریشه مستأجر استخراج می‌کند.

    ```bash
    openclaw models auth login --provider github-copilot --method device-enterprise
    ```

  </Step>
  <Step title="ذخیره دامنه در پیکربندی">
    میزبان انتخاب‌شده در پارامترهای ارائه‌دهنده ذخیره می‌شود تا تازه‌سازی‌های بعدی توکن و تکمیل‌ها به‌طور خودکار مستأجر را هدف بگیرند:

    ```json5
    {
      models: {
        providers: {
          "github-copilot": { params: { githubDomain: "your-org.ghe.com" } },
        },
      },
    }
    ```

  </Step>
</Steps>

جریان دستگاه، مبادله توکن و تکمیل‌ها به‌ترتیب به `https://your-org.ghe.com/login/device/code`،‏ `https://api.your-org.ghe.com/copilot_internal/v2/token` و `https://copilot-api.your-org.ghe.com` نگاشت می‌شوند. توکن‌های اقامت داده دارای مهر مستأجر هستند و هیچ راهنمای پراکسی ندارند؛ بنابراین نشانی پایه تکمیل‌ها به‌جای نقطه پایانی عمومی، از میزبان Copilot مستأجر استفاده می‌کند.

<Note>
تغییر دامنه همیشه ورود با دستگاه را دوباره اجرا می‌کند. اگر از قبل یک توکن Copilot ذخیره‌شده دارید و دامنه دیگری را انتخاب کنید (`github.com` عمومی ↔ یک مستأجر `*.ghe.com` یا تغییر از یک مستأجر به مستأجر دیگر)، OpenClaw توکن موجود را دوباره استفاده نمی‌کند؛ بلکه ورود تازه‌ای را اجباری می‌کند تا محدوده توکن با دامنه‌ای که در پیکربندی نوشته می‌شود منطبق باشد. اجرای دوباره ورود برای *همان* دامنه همچنان امکان استفاده مجدد از توکن فعلی را پیشنهاد می‌دهد. بازگشت به `github.com` عمومی، مقدار ذخیره‌شده `githubDomain` را پاک می‌کند تا پیکربندی به حالت پیش‌فرض بازگردد.
</Note>

<Note>
متغیر محیطی `COPILOT_GITHUB_DOMAIN` دامنه حل‌شده را برای تمام مسیرهای Copilot که دامنه را تعیین می‌کنند بازنویسی می‌کند؛ از جمله ورود با دستگاه Enterprise ‏(`--method device-enterprise`)، میان‌بر مستقل `openclaw models auth login-github-copilot`، تازه‌سازی توکن، بردارسازی‌ها و تکمیل‌ها. برای راه‌اندازی‌های کاملاً بدون رابط یا CI، آن را روی میزبان `*.ghe.com` خود تنظیم کنید. برای استفاده از `github.com` عمومی، آن را تنظیم نکنید و پارامتر پیکربندی را نیز وارد نکنید. فرایندهای ورود دامنه‌ای را که توکن برای آن صادر شده است ذخیره می‌کنند و هنگام ورود از طریق `github.com` عمومی آن را پاک می‌کنند؛ بنابراین حتی پس از حذف متغیر محیطی، مسیریابی درست باقی می‌ماند.
</Note>

## پرچم‌های اختیاری

| فرمان                                                                   | پرچم           | توضیح                                                        |
| ---------------------------------------------------------------------- | --------------- | ------------------------------------------------------------ |
| `openclaw models auth login-github-copilot`                            | `--yes`         | بازنویسی نمایه احراز هویت موجود بدون درخواست تأیید           |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | اعمال مدل پیش‌فرض پیشنهادی ارائه‌دهنده نیز انجام شود         |

```bash
# رد کردن تأیید ورود مجدد
openclaw models auth login-github-copilot --yes

# ورود و تنظیم مدل پیش‌فرض در یک مرحله
openclaw models auth login --provider github-copilot --method device --set-default
```

## راه‌اندازی غیرتعاملی

جریان ورود با دستگاه به یک TTY تعاملی نیاز دارد. برای راه‌اندازی بدون رابط، یک توکن دسترسی OAuth موجود GitHub را با `openclaw onboard --non-interactive` وارد کنید:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

همچنین می‌توانید `--auth-choice` را حذف کنید؛ ارسال `--github-copilot-token` گزینه احراز هویت ارائه‌دهنده GitHub Copilot را استنباط می‌کند. اگر این پرچم حذف شود، راه‌اندازی به‌ترتیب از `COPILOT_GITHUB_TOKEN`،‏ `GH_TOKEN` و سپس `GITHUB_TOKEN` استفاده می‌کند. با تنظیم `COPILOT_GITHUB_TOKEN`، از `--secret-input-mode ref` استفاده کنید تا به‌جای متن ساده در `auth-profiles.json`، یک `tokenRef` مبتنی بر متغیر محیطی ذخیره شود.

<AccordionGroup>
  <Accordion title="TTY تعاملی الزامی است">
    جریان ورود با دستگاه به یک TTY تعاملی نیاز دارد. آن را مستقیماً در یک پایانه اجرا کنید، نه در اسکریپت غیرتعاملی یا خط لوله CI.
  </Accordion>

  <Accordion title="دردسترس‌بودن مدل به طرح شما بستگی دارد">
    دردسترس‌بودن مدل‌های Copilot به طرح GitHub شما بستگی دارد. اگر مدلی رد شد، شناسه دیگری را امتحان کنید (برای مثال `github-copilot/gpt-5.5`). برای مشاهده فهرست فعلی مدل‌ها، به [مدل‌های پشتیبانی‌شده در هر طرح Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan) متعلق به GitHub مراجعه کنید.
  </Accordion>

  <Accordion title="تازه‌سازی زنده فهرست از API مربوط به Copilot">
    پس از آنکه مسیر احراز هویت ورود با دستگاه (یا متغیر محیطی) یک توکن GitHub را تعیین کرد، OpenClaw فهرست مدل‌ها را در صورت نیاز از `${baseUrl}/models` تازه‌سازی می‌کند (همان نقطه پایانی که Copilot در VS Code استفاده می‌کند) تا محیط اجرا بدون تغییر مکرر مانیفست، استحقاق‌های هر حساب و پنجره‌های زمینه دقیق را دنبال کند. مدل‌های تازه منتشرشده Copilot بدون ارتقای OpenClaw قابل مشاهده می‌شوند و پنجره‌های زمینه محدودیت‌های واقعی هر مدل را منعکس می‌کنند (برای مثال ۴۰۰ هزار برای سری gpt-5.x و ۱ میلیون برای گونه‌های داخلی `claude-opus-*-1m`).

    فهرست ایستای همراه محصول زمانی به‌عنوان جایگزین قابل مشاهده باقی می‌ماند که کشف غیرفعال باشد، کاربر نمایه احراز هویت GitHub نداشته باشد، مبادله توکن شکست بخورد یا فراخوانی HTTPS به `/models` خطا دهد. برای انصراف و اتکای کامل به فهرست ایستای مانیفست (در سناریوهای آفلاین یا جدا از شبکه):

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
    شناسه‌های مدل Claude به‌طور خودکار از انتقال Anthropic Messages استفاده می‌کنند. مدل‌های Gemini از انتقال OpenAI Chat Completions استفاده می‌کنند؛ مدل‌های GPT و سری o همچنان از انتقال OpenAI Responses استفاده می‌کنند. OpenClaw انتقال صحیح را بر اساس ارجاع مدل انتخاب می‌کند.
  </Accordion>

  <Accordion title="سازگاری درخواست">
    OpenClaw در انتقال‌های Copilot، سرآیندهای درخواست به سبک محیط توسعه Copilot را ارسال می‌کند (نسخه‌های ویرایشگر/Plugin در VS Code و شناسه یکپارچه‌سازی `vscode-chat`)، نوبت‌های پیگیری نتیجه ابزار را به‌عنوان آغازشده توسط عامل علامت می‌زند و هنگامی که یک نوبت شامل ورودی تصویر باشد، سرآیند بینایی Copilot را تنظیم می‌کند.
  </Accordion>

  <Accordion title="ترتیب تعیین متغیرهای محیطی">
    OpenClaw احراز هویت Copilot را با ترتیب اولویت زیر از متغیرهای محیطی تعیین می‌کند:

    | اولویت | متغیر                  | توضیحات                              |
    | ------ | ---------------------- | ------------------------------------ |
    | ۱      | `COPILOT_GITHUB_TOKEN` | بالاترین اولویت، ویژه Copilot        |
    | ۲      | `GH_TOKEN`             | توکن GitHub CLI ‏(جایگزین)           |
    | ۳      | `GITHUB_TOKEN`         | توکن استاندارد GitHub ‏(کمترین اولویت) |

    وقتی چند متغیر تنظیم شده باشند، OpenClaw از مورد دارای بالاترین اولویت استفاده می‌کند. جریان ورود با دستگاه (`openclaw models auth login-github-copilot`) توکن خود را در مخزن نمایه احراز هویت ذخیره می‌کند و بر همه متغیرهای محیطی اولویت دارد.

  </Accordion>

  <Accordion title="ذخیره‌سازی توکن">
    فرایند ورود یک توکن GitHub را در مخزن نمایه احراز هویت (با شناسه نمایه `github-copilot:github`) ذخیره می‌کند و هنگام اجرای OpenClaw آن را با یک توکن کوتاه‌عمر API مربوط به Copilot مبادله می‌کند. نیازی نیست توکن را به‌صورت دستی مدیریت کنید.
  </Accordion>
</AccordionGroup>

## بردارسازی‌های جست‌وجوی حافظه

GitHub Copilot می‌تواند به‌عنوان ارائه‌دهنده بردارسازی برای [جست‌وجوی حافظه](/fa/concepts/memory-search) نیز عمل کند. اگر اشتراک Copilot دارید و وارد شده‌اید، OpenClaw می‌تواند بدون کلید API جداگانه از آن برای بردارسازی استفاده کند.

### پیکربندی

برای استفاده از بردارسازی‌های GitHub Copilot،‏ `memorySearch.provider` را به‌صراحت تنظیم کنید. اگر توکن GitHub در دسترس باشد، OpenClaw مدل‌های بردارسازی موجود را از API مربوط به Copilot کشف می‌کند و بهترین مورد را به‌طور خودکار انتخاب می‌کند.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // اختیاری: بازنویسی مدل کشف‌شده خودکار
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### نحوه کار

1. OpenClaw توکن GitHub شما را تعیین می‌کند (از متغیرهای محیطی یا نمایه احراز هویت).
2. آن را با یک توکن کوتاه‌عمر API مربوط به Copilot مبادله می‌کند.
3. برای کشف مدل‌های بردارسازی موجود، نقطه پایانی `/models` متعلق به Copilot را پرس‌وجو می‌کند.
4. بهترین مدل را انتخاب می‌کند (ترتیب ترجیح: `text-embedding-3-small`،‏ `text-embedding-3-large`،‏ `text-embedding-ada-002`).
5. درخواست‌های بردارسازی را به نقطه پایانی `/embeddings` متعلق به Copilot ارسال می‌کند.

دردسترس‌بودن مدل به طرح GitHub شما بستگی دارد. اگر هیچ مدل بردارسازی در دسترس نباشد، OpenClaw از Copilot صرف‌نظر می‌کند و ارائه‌دهنده بعدی را امتحان می‌کند.

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="OAuth و احراز هویت" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفادهٔ مجدد از اطلاعات اعتبارسنجی.
  </Card>
</CardGroup>
