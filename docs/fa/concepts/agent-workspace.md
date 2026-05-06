---
read_when:
    - باید فضای کاری عامل یا ساختار فایل‌های آن را توضیح دهید
    - می‌خواهید از فضای کاری یک عامل پشتیبان‌گیری کنید یا آن را مهاجرت دهید
sidebarTitle: Agent workspace
summary: 'فضای کاری عامل: مکان، چیدمان، و راهبرد پشتیبان‌گیری'
title: فضای کاری عامل
x-i18n:
    generated_at: "2026-05-06T09:08:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5c4c55f3cda5dcf6b763f8e59fa926283cee18270a58dbd62593947a55e67c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

فضای کاری خانه‌ی عامل است. این تنها دایرکتوری کاری است که برای ابزارهای فایل و برای زمینه‌ی فضای کاری استفاده می‌شود. آن را خصوصی نگه دارید و مانند حافظه با آن رفتار کنید.

این از `~/.openclaw/` جداست؛ جایی که پیکربندی، اعتبارنامه‌ها، و نشست‌ها را ذخیره می‌کند.

<Warning>
فضای کاری **cwd پیش‌فرض** است، نه یک سندباکس سخت‌گیرانه. ابزارها مسیرهای نسبی را نسبت به فضای کاری resolve می‌کنند، اما مسیرهای مطلق همچنان می‌توانند به جاهای دیگر میزبان دسترسی پیدا کنند، مگر اینکه sandboxing فعال شده باشد. اگر به ایزوله‌سازی نیاز دارید، از [`agents.defaults.sandbox`](/fa/gateway/sandboxing) (و/یا پیکربندی sandbox برای هر عامل) استفاده کنید.

وقتی sandboxing فعال است و `workspaceAccess` برابر `"rw"` نیست، ابزارها داخل یک فضای کاری sandbox زیر `~/.openclaw/sandboxes` کار می‌کنند، نه فضای کاری میزبان شما.
</Warning>

## مکان پیش‌فرض

- پیش‌فرض: `~/.openclaw/workspace`
- اگر `OPENCLAW_PROFILE` تنظیم شده باشد و برابر `"default"` نباشد، پیش‌فرض به `~/.openclaw/workspace-<profile>` تبدیل می‌شود.
- بازنویسی در `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`، `openclaw configure`، یا `openclaw setup` فضای کاری را ایجاد می‌کند و اگر فایل‌های bootstrap وجود نداشته باشند، آن‌ها را seed می‌کند.

<Note>
کپی‌های seed مربوط به Sandbox فقط فایل‌های معمولی داخل فضای کاری را می‌پذیرند؛ aliasهای symlink/hardlink که بیرون از فضای کاری مبدأ resolve می‌شوند نادیده گرفته می‌شوند.
</Note>

اگر خودتان از قبل فایل‌های فضای کاری را مدیریت می‌کنید، می‌توانید ایجاد فایل bootstrap را غیرفعال کنید:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## پوشه‌های فضای کاری اضافی

نصب‌های قدیمی‌تر ممکن است `~/openclaw` را ایجاد کرده باشند. نگه داشتن چند دایرکتوری فضای کاری می‌تواند باعث auth گیج‌کننده یا drift در وضعیت شود، چون در هر لحظه فقط یک فضای کاری فعال است.

<Note>
**توصیه:** یک فضای کاری فعال نگه دارید. اگر دیگر از پوشه‌های اضافی استفاده نمی‌کنید، آن‌ها را archive کنید یا به Trash منتقل کنید (برای مثال `trash ~/openclaw`). اگر عمداً چند فضای کاری نگه می‌دارید، مطمئن شوید `agents.defaults.workspace` به فضای کاری فعال اشاره می‌کند.

`openclaw doctor` وقتی دایرکتوری‌های فضای کاری اضافی را تشخیص دهد هشدار می‌دهد.
</Note>

## نقشه‌ی فایل‌های فضای کاری

این‌ها فایل‌های استانداردی هستند که OpenClaw انتظار دارد داخل فضای کاری وجود داشته باشند:

<AccordionGroup>
  <Accordion title="AGENTS.md - دستورالعمل‌های عملیاتی">
    دستورالعمل‌های عملیاتی برای عامل و اینکه چگونه باید از حافظه استفاده کند. در آغاز هر نشست بارگذاری می‌شود. جای خوبی برای قوانین، اولویت‌ها، و جزئیات «چگونه رفتار کردن» است.
  </Accordion>
  <Accordion title="SOUL.md - پرسونا و لحن">
    پرسونا، لحن، و مرزها. در هر نشست بارگذاری می‌شود. راهنما: [راهنمای شخصیت SOUL.md](/fa/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - کاربر کیست">
    کاربر کیست و چگونه باید او را خطاب کرد. در هر نشست بارگذاری می‌شود.
  </Accordion>
  <Accordion title="IDENTITY.md - نام، حس‌وحال، ایموجی">
    نام، حس‌وحال، و ایموجی عامل. در طول مراسم bootstrap ایجاد/به‌روزرسانی می‌شود.
  </Accordion>
  <Accordion title="TOOLS.md - قراردادهای ابزار محلی">
    یادداشت‌هایی درباره‌ی ابزارها و قراردادهای محلی شما. دسترس‌پذیری ابزارها را کنترل نمی‌کند؛ فقط راهنماست.
  </Accordion>
  <Accordion title="HEARTBEAT.md - چک‌لیست Heartbeat">
    چک‌لیست کوچک اختیاری برای اجرای Heartbeat. آن را کوتاه نگه دارید تا از مصرف توکن جلوگیری شود.
  </Accordion>
  <Accordion title="BOOT.md - چک‌لیست راه‌اندازی">
    چک‌لیست راه‌اندازی اختیاری که هنگام restart شدن Gateway به‌طور خودکار اجرا می‌شود (وقتی [hookهای داخلی](/fa/automation/hooks) فعال باشند). آن را کوتاه نگه دارید؛ برای ارسال‌های خروجی از ابزار message استفاده کنید.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - مراسم اجرای نخست">
    مراسم یک‌باره‌ی اجرای نخست. فقط برای یک فضای کاری کاملاً جدید ایجاد می‌شود. پس از کامل شدن مراسم، آن را حذف کنید.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - گزارش حافظه‌ی روزانه">
    گزارش حافظه‌ی روزانه (یک فایل برای هر روز). توصیه می‌شود هنگام شروع نشست، امروز + دیروز را بخوانید.
  </Accordion>
  <Accordion title="MEMORY.md - حافظه‌ی بلندمدت گزینش‌شده (اختیاری)">
    حافظه‌ی بلندمدت گزینش‌شده. فقط در نشست اصلی و خصوصی بارگذاری کنید (نه زمینه‌های مشترک/گروهی). برای workflow و flush خودکار حافظه، [حافظه](/fa/concepts/memory) را ببینید.
  </Accordion>
  <Accordion title="skills/ - Skills فضای کاری (اختیاری)">
    Skills اختصاصی فضای کاری. مکان Skill با بالاترین اولویت برای آن فضای کاری. وقتی نام‌ها تداخل داشته باشند، Skills عامل پروژه، Skills عامل شخصی، Skills مدیریت‌شده، Skills bundled، و `skills.load.extraDirs` را override می‌کند.
  </Accordion>
  <Accordion title="canvas/ - فایل‌های Canvas UI (اختیاری)">
    فایل‌های Canvas UI برای نمایش‌های node (برای مثال `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
اگر هر فایل bootstrap مفقود باشد، OpenClaw یک نشانگر «فایل مفقود» را به نشست تزریق می‌کند و ادامه می‌دهد. فایل‌های bootstrap بزرگ هنگام تزریق کوتاه می‌شوند؛ محدودیت‌ها را با `agents.defaults.bootstrapMaxChars` (پیش‌فرض: 12000) و `agents.defaults.bootstrapTotalMaxChars` (پیش‌فرض: 60000) تنظیم کنید. `openclaw setup` می‌تواند پیش‌فرض‌های مفقود را بدون overwrite کردن فایل‌های موجود دوباره ایجاد کند.
</Note>

## چه چیزی در فضای کاری نیست

این‌ها زیر `~/.openclaw/` قرار دارند و نباید به repo فضای کاری commit شوند:

- `~/.openclaw/openclaw.json` (پیکربندی)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (پروفایل‌های auth مدل: OAuth + کلیدهای API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (حساب runtime مخصوص هر عامل برای Codex، پیکربندی، skills، plugins، و وضعیت thread بومی)
- `~/.openclaw/credentials/` (وضعیت channel/provider به‌همراه داده‌های import قدیمی OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (transcriptهای نشست + metadata)
- `~/.openclaw/skills/` (skills مدیریت‌شده)

اگر لازم است نشست‌ها یا پیکربندی را migrate کنید، آن‌ها را جداگانه کپی کنید و بیرون از version control نگه دارید.

## پشتیبان‌گیری Git (توصیه‌شده، خصوصی)

با فضای کاری مانند حافظه‌ی خصوصی رفتار کنید. آن را در یک repo git **خصوصی** قرار دهید تا پشتیبان‌گیری شود و قابل بازیابی باشد.

این مراحل را روی ماشینی اجرا کنید که Gateway روی آن اجرا می‌شود (یعنی همان جایی که فضای کاری قرار دارد).

<Steps>
  <Step title="Initialize کردن repo">
    اگر git نصب باشد، فضاهای کاری کاملاً جدید به‌طور خودکار initialize می‌شوند. اگر این فضای کاری از قبل repo نیست، اجرا کنید:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="افزودن remote خصوصی">
    <Tabs>
      <Tab title="GitHub web UI">
        1. یک repository **خصوصی** جدید در GitHub ایجاد کنید.
        2. با README initialize نکنید (از merge conflict جلوگیری می‌کند).
        3. URL مربوط به HTTPS remote را کپی کنید.
        4. remote را اضافه کنید و push کنید:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="GitLab web UI">
        1. یک repository **خصوصی** جدید در GitLab ایجاد کنید.
        2. با README initialize نکنید (از merge conflict جلوگیری می‌کند).
        3. URL مربوط به HTTPS remote را کپی کنید.
        4. remote را اضافه کنید و push کنید:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="به‌روزرسانی‌های مداوم">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## اسرار را commit نکنید

<Warning>
حتی در یک repo خصوصی، از ذخیره کردن secrets در فضای کاری خودداری کنید:

- کلیدهای API، توکن‌های OAuth، گذرواژه‌ها، یا اعتبارنامه‌های خصوصی.
- هر چیزی زیر `~/.openclaw/`.
- dumpهای خام از chatها یا attachmentهای حساس.

اگر باید referenceهای حساس را ذخیره کنید، از placeholders استفاده کنید و secret واقعی را جای دیگری نگه دارید (password manager، environment variables، یا `~/.openclaw/`).
</Warning>

شروع‌کننده‌ی پیشنهادی `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## انتقال فضای کاری به یک ماشین جدید

<Steps>
  <Step title="Clone کردن repo">
    repo را در مسیر دلخواه clone کنید (پیش‌فرض `~/.openclaw/workspace`).
  </Step>
  <Step title="به‌روزرسانی پیکربندی">
    `agents.defaults.workspace` را در `~/.openclaw/openclaw.json` روی آن مسیر تنظیم کنید.
  </Step>
  <Step title="Seed کردن فایل‌های مفقود">
    `openclaw setup --workspace <path>` را اجرا کنید تا هر فایل مفقودی seed شود.
  </Step>
  <Step title="کپی کردن نشست‌ها (اختیاری)">
    اگر به نشست‌ها نیاز دارید، `~/.openclaw/agents/<agentId>/sessions/` را جداگانه از ماشین قدیمی کپی کنید.
  </Step>
</Steps>

## نکات پیشرفته

- routing چندعاملی می‌تواند برای هر عامل از فضای کاری متفاوتی استفاده کند. برای پیکربندی routing، [Routing کانال](/fa/channels/channel-routing) را ببینید.
- اگر `agents.defaults.sandbox` فعال باشد، نشست‌های غیر اصلی می‌توانند از فضاهای کاری sandbox مخصوص هر نشست زیر `agents.defaults.sandbox.workspaceRoot` استفاده کنند.

## مرتبط

- [Heartbeat](/fa/gateway/heartbeat) - فایل فضای کاری HEARTBEAT.md
- [Sandboxing](/fa/gateway/sandboxing) - دسترسی به فضای کاری در محیط‌های sandbox شده
- [نشست](/fa/concepts/session) - مسیرهای ذخیره‌سازی نشست
- [دستورهای پایدار](/fa/automation/standing-orders) - دستورالعمل‌های پایدار در فایل‌های فضای کاری
