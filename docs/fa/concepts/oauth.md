---
read_when:
    - می‌خواهید OpenClaw OAuth را به‌صورت سرتاسری درک کنید
    - با مشکلات نامعتبر شدن توکن / خروج از حساب مواجه می‌شوید
    - شما جریان‌های احراز هویت Claude CLI یا OAuth را می‌خواهید
    - شما به چندین حساب یا مسیریابی پروفایل نیاز دارید
summary: 'OAuth در OpenClaw: تبادل توکن، ذخیره‌سازی، و الگوهای چندحسابی'
title: OAuth
x-i18n:
    generated_at: "2026-06-27T17:36:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4aa48fd468a541ed72935833a3196105798380799fa6135fe1dd9f68838307b6
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw از «احراز هویت اشتراکی» از طریق OAuth برای ارائه‌دهندگانی که آن را ارائه می‌کنند پشتیبانی می‌کند
(به‌ویژه **OpenAI Codex (ChatGPT OAuth)**). برای Anthropic، تقسیم عملی
اکنون چنین است:

- **کلید API Anthropic**: صورتحساب معمول API Anthropic
- **Anthropic Claude CLI / احراز هویت اشتراکی داخل OpenClaw**: کارکنان Anthropic
  به ما گفتند این استفاده دوباره مجاز است

OpenAI Codex OAuth به‌صراحت برای استفاده در ابزارهای خارجی مانند
OpenClaw پشتیبانی می‌شود.

OpenClaw هم احراز هویت با کلید API OpenAI و هم ChatGPT/Codex OAuth را زیر
شناسه ارائه‌دهنده canonical یعنی `openai` ذخیره می‌کند. شناسه‌های پروفایل قدیمی‌تر `openai-codex:*` و
ورودی‌های `auth.order.openai-codex` وضعیت legacy هستند که توسط
`openclaw doctor --fix` اصلاح می‌شوند؛ برای پیکربندی جدید از شناسه‌های پروفایل `openai:*` و `auth.order.openai` استفاده کنید.

برای Anthropic در محیط production، احراز هویت با کلید API مسیر ایمن‌تر و توصیه‌شده است.

این صفحه توضیح می‌دهد:

- **تبادل توکن** OAuth چگونه کار می‌کند (PKCE)
- توکن‌ها کجا **ذخیره** می‌شوند (و چرا)
- چگونه **چند حساب** را مدیریت کنید (پروفایل‌ها + بازنویسی‌های هر نشست)

OpenClaw همچنین از **Pluginهای ارائه‌دهنده** پشتیبانی می‌کند که جریان‌های OAuth یا کلید API
خودشان را همراه دارند. آن‌ها را از این طریق اجرا کنید:

```bash
openclaw models auth login --provider <id>
```

## مخزن توکن (چرا وجود دارد)

ارائه‌دهندگان OAuth معمولاً در جریان‌های ورود/refresh یک **refresh token جدید** صادر می‌کنند. برخی ارائه‌دهندگان (یا کلاینت‌های OAuth) می‌توانند هنگام صدور توکن جدید برای همان کاربر/برنامه، refresh tokenهای قدیمی‌تر را باطل کنند.

نشانه عملی:

- از طریق OpenClaw _و_ از طریق Claude Code / Codex CLI وارد می‌شوید → یکی از آن‌ها بعداً به‌صورت تصادفی «خارج از حساب» می‌شود

برای کاهش این مشکل، OpenClaw با `auth-profiles.json` مانند یک **مخزن توکن** رفتار می‌کند:

- runtime اعتبارنامه‌ها را از **یک جا** می‌خواند
- می‌توانیم چند پروفایل را نگه داریم و آن‌ها را به‌صورت قطعی مسیر‌دهی کنیم
- استفاده مجدد از CLI خارجی وابسته به ارائه‌دهنده است: Codex CLI می‌تواند یک پروفایل خالی
  `openai:default` را bootstrap کند، اما وقتی OpenClaw یک پروفایل OAuth محلی داشته باشد،
  refresh token محلی canonical است. اگر آن refresh token محلی رد شود،
  OpenClaw می‌تواند از یک توکن قابل استفاده Codex CLI برای همان حساب به‌عنوان fallback
  فقط در runtime استفاده کند؛ ادغام‌های دیگر می‌توانند بیرونی مدیریت شوند و
  فروشگاه احراز هویت CLI خود را دوباره بخوانند
- مسیرهای وضعیت و راه‌اندازی که از قبل مجموعه ارائه‌دهندگان پیکربندی‌شده را می‌شناسند،
  کشف CLI خارجی را به همان مجموعه محدود می‌کنند، بنابراین فروشگاه ورود CLI نامرتبط برای
  راه‌اندازی تک‌ارائه‌دهنده بررسی نمی‌شود

## ذخیره‌سازی (توکن‌ها کجا قرار می‌گیرند)

اسرار در فروشگاه‌های احراز هویت agent ذخیره می‌شوند:

- پروفایل‌های احراز هویت (OAuth + کلیدهای API + ارجاع‌های اختیاری در سطح مقدار): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- فایل سازگاری legacy: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (ورودی‌های ثابت `api_key` هنگام کشف پاک‌سازی می‌شوند)

فایل legacy فقط برای واردسازی (هنوز پشتیبانی می‌شود، اما فروشگاه اصلی نیست):

- `~/.openclaw/credentials/oauth.json` (در اولین استفاده به `auth-profiles.json` وارد می‌شود)

همه موارد بالا از `$OPENCLAW_STATE_DIR` (بازنویسی دایرکتوری state) نیز پیروی می‌کنند. مرجع کامل: [/gateway/configuration](/fa/gateway/configuration-reference#auth-storage)

برای ارجاع‌های secret ثابت و رفتار فعال‌سازی snapshot در runtime، [مدیریت اسرار](/fa/gateway/secrets) را ببینید.

وقتی یک agent ثانویه پروفایل احراز هویت محلی ندارد، OpenClaw از وراثت read-through
از فروشگاه agent پیش‌فرض/اصلی استفاده می‌کند. هنگام خواندن، `auth-profiles.json` مربوط به agent اصلی را clone نمی‌کند.
OAuth refresh tokenها به‌ویژه حساس هستند: جریان‌های کپی معمولی به‌صورت پیش‌فرض از آن‌ها عبور می‌کنند، چون برخی ارائه‌دهندگان پس از استفاده، refresh tokenها را rotate
یا باطل می‌کنند. وقتی یک agent به حساب مستقل نیاز دارد، برای آن یک ورود OAuth جداگانه پیکربندی کنید.

## سازگاری توکن legacy Anthropic

<Warning>
مستندات عمومی Claude Code متعلق به Anthropic می‌گویند استفاده مستقیم از Claude Code در محدوده
محدودیت‌های اشتراک Claude باقی می‌ماند، و کارکنان Anthropic به ما گفتند استفاده Claude
CLI به سبک OpenClaw دوباره مجاز است. بنابراین OpenClaw استفاده مجدد از Claude CLI و
استفاده از `claude -p` را برای این ادغام مجاز در نظر می‌گیرد، مگر اینکه Anthropic
سیاست جدیدی منتشر کند.

برای مستندات فعلی طرح مستقیم Claude Code مربوط به Anthropic، [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
و [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/) را ببینید.

اگر گزینه‌های دیگر به سبک اشتراک را در OpenClaw می‌خواهید، [OpenAI
Codex](/fa/providers/openai)، [Qwen Cloud Coding
Plan](/fa/providers/qwen)، [MiniMax Coding Plan](/fa/providers/minimax)،
و [Z.AI / GLM Coding Plan](/fa/providers/zai) را ببینید.
</Warning>

OpenClaw همچنین setup-token مربوط به Anthropic را به‌عنوان مسیر پشتیبانی‌شده احراز هویت با توکن ارائه می‌کند، اما اکنون هنگام در دسترس بودن، استفاده مجدد از Claude CLI و `claude -p` را ترجیح می‌دهد.

## مهاجرت Anthropic Claude CLI

OpenClaw دوباره از استفاده مجدد Anthropic Claude CLI پشتیبانی می‌کند. اگر از قبل روی میزبان
ورود محلی Claude دارید، onboarding/configure می‌تواند مستقیماً از آن استفاده مجدد کند.

## تبادل OAuth (ورود چگونه کار می‌کند)

جریان‌های ورود تعاملی OpenClaw در `openclaw/plugin-sdk/llm` پیاده‌سازی شده‌اند و به wizardها/دستورها متصل شده‌اند.

### setup-token Anthropic

شکل جریان:

1. setup-token یا paste-token Anthropic را از OpenClaw شروع کنید
2. OpenClaw اعتبارنامه Anthropic حاصل را در یک پروفایل احراز هویت ذخیره می‌کند
3. انتخاب مدل روی `anthropic/...` باقی می‌ماند
4. پروفایل‌های احراز هویت Anthropic موجود برای rollback/کنترل ترتیب همچنان در دسترس می‌مانند

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth به‌صراحت برای استفاده خارج از Codex CLI، از جمله workflowهای OpenClaw، پشتیبانی می‌شود.

دستور ورود همچنان از شناسه canonical ارائه‌دهنده OpenAI استفاده می‌کند:

```bash
openclaw models auth login --provider openai
```

برای چند حساب ChatGPT/Codex OAuth در یک agent از `--profile-id openai:<name>` استفاده کنید.
برای پروفایل‌های جدید از `openai-codex:<name>` استفاده نکنید. Doctor آن پیشوند قدیمی‌تر را به یک شناسه پروفایل `openai:*` بدون برخورد مهاجرت می‌دهد؛ پس از اصلاح، پیش از کپی کردن
شناسه‌های پروفایل در `auth.order` یا `/model ...@<profileId>`، دستور
`openclaw models auth list --provider openai` را اجرا کنید.

شکل جریان (PKCE):

1. تولید PKCE verifier/challenge + `state` تصادفی
2. باز کردن `https://auth.openai.com/oauth/authorize?...`
3. تلاش برای دریافت callback روی `http://127.0.0.1:1455/auth/callback`
4. اگر callback نتواند bind شود (یا remote/headless هستید)، URL/code تغییرمسیر را paste کنید
5. تبادل در `https://auth.openai.com/oauth/token`
6. استخراج `accountId` از access token و ذخیره `{ access, refresh, expires, accountId }`

مسیر wizard برابر است با `openclaw onboard` → انتخاب احراز هویت `openai`.

## Refresh + انقضا

پروفایل‌ها یک timestamp به نام `expires` ذخیره می‌کنند.

در runtime:

- اگر `expires` در آینده باشد → از access token ذخیره‌شده استفاده می‌شود
- اگر منقضی شده باشد → refresh انجام می‌شود (زیر file lock) و اعتبارنامه‌های ذخیره‌شده بازنویسی می‌شوند
- اگر یک agent ثانویه یک پروفایل OAuth ارث‌بری‌شده از agent اصلی را بخواند، refresh
  به‌جای کپی کردن refresh token در فروشگاه agent ثانویه، به فروشگاه agent اصلی
  برمی‌گردد
- استثنا: برخی اعتبارنامه‌های CLI خارجی بیرونی مدیریت می‌شوند؛ OpenClaw
  به‌جای مصرف refresh tokenهای کپی‌شده، آن فروشگاه‌های احراز هویت CLI را دوباره می‌خواند.
  bootstrap در Codex CLI عمداً محدودتر است: یک پروفایل خالی
  `openai:default` را seed می‌کند، سپس refreshهای تحت مالکیت OpenClaw پروفایل محلی را
  canonical نگه می‌دارند. اگر refresh محلی Codex شکست بخورد و Codex CLI یک
  توکن قابل استفاده برای همان حساب داشته باشد، OpenClaw ممکن است از آن توکن برای درخواست runtime فعلی
  بدون نوشتن دوباره آن در `auth-profiles.json` استفاده کند.

جریان refresh خودکار است؛ معمولاً لازم نیست توکن‌ها را دستی مدیریت کنید.

## چند حساب (پروفایل‌ها) + مسیر‌دهی

دو الگو:

### 1) ترجیحی: agentهای جداگانه

اگر می‌خواهید «شخصی» و «کاری» هرگز با هم تعامل نداشته باشند، از agentهای ایزوله استفاده کنید (نشست‌های جداگانه + اعتبارنامه‌ها + workspace):

```bash
openclaw agents add work
openclaw agents add personal
```

سپس احراز هویت را برای هر agent پیکربندی کنید (wizard) و chatها را به agent درست مسیر‌دهی کنید.

### 2) پیشرفته: چند پروفایل در یک agent

`auth-profiles.json` از چند شناسه پروفایل برای یک ارائه‌دهنده پشتیبانی می‌کند.

انتخاب کنید کدام پروفایل استفاده شود:

- به‌صورت سراسری از طریق ترتیب پیکربندی (`auth.order`)
- برای هر نشست از طریق `/model ...@<profileId>`

مثال (بازنویسی نشست):

- `/model Opus@anthropic:work`

چگونه ببینید چه شناسه‌های پروفایلی وجود دارند:

- `openclaw channels list --json` (`auth[]` را نشان می‌دهد)

مستندات مرتبط:

- [failover مدل](/fa/concepts/model-failover) (قواعد rotation + cooldown)
- [دستورهای Slash](/fa/tools/slash-commands) (سطح دستور)

## مرتبط

- [احراز هویت](/fa/gateway/authentication) - نمای کلی احراز هویت ارائه‌دهنده مدل
- [Secrets](/fa/gateway/secrets) - ذخیره‌سازی اعتبارنامه و SecretRef
- [مرجع پیکربندی](/fa/gateway/configuration-reference#auth-storage) - کلیدهای پیکربندی احراز هویت
