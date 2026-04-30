---
read_when:
    - باید فضای کاری عامل یا ساختار فایل‌های آن را توضیح دهید
    - می‌خواهید از فضای کاری یک عامل نسخهٔ پشتیبان تهیه کنید یا آن را مهاجرت دهید
sidebarTitle: Agent workspace
summary: 'فضای کاری عامل: مکان، چیدمان، و راهبرد پشتیبان‌گیری'
title: فضای کاری عامل
x-i18n:
    generated_at: "2026-04-30T20:05:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1ccf74cbec3ff20f4c1c1ce52f099a7ca3365b2536b0aad6ff1d3a5fafcca0a
    source_path: concepts/agent-workspace.md
    workflow: 16
---

فضای کاری خانهٔ عامل است. این تنها دایرکتوری کاری است که برای ابزارهای فایل و برای زمینهٔ فضای کاری استفاده می‌شود. آن را خصوصی نگه دارید و مانند حافظه با آن رفتار کنید.

این از `~/.openclaw/` جداست؛ جایی که پیکربندی، اعتبارنامه‌ها و نشست‌ها را ذخیره می‌کند.

<Warning>
فضای کاری **cwd پیش‌فرض** است، نه یک سندباکس سخت‌گیرانه. ابزارها مسیرهای نسبی را نسبت به فضای کاری resolve می‌کنند، اما مسیرهای مطلق همچنان می‌توانند به جاهای دیگر روی میزبان دسترسی داشته باشند، مگر اینکه سندباکس فعال باشد. اگر به جداسازی نیاز دارید، از [`agents.defaults.sandbox`](/fa/gateway/sandboxing) (و/یا پیکربندی سندباکس برای هر عامل) استفاده کنید.

وقتی سندباکس فعال باشد و `workspaceAccess` برابر `"rw"` نباشد، ابزارها داخل یک فضای کاری سندباکس زیر `~/.openclaw/sandboxes` کار می‌کنند، نه فضای کاری میزبان شما.
</Warning>

## مکان پیش‌فرض

- پیش‌فرض: `~/.openclaw/workspace`
- اگر `OPENCLAW_PROFILE` تنظیم شده باشد و `"default"` نباشد، پیش‌فرض به `~/.openclaw/workspace-<profile>` تبدیل می‌شود.
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

`openclaw onboard`، `openclaw configure` یا `openclaw setup` فضای کاری را ایجاد می‌کند و اگر فایل‌های راه‌انداز اولیه موجود نباشند، آن‌ها را seed می‌کند.

<Note>
کپی‌های seed سندباکس فقط فایل‌های عادی داخل فضای کاری را می‌پذیرند؛ aliasهای symlink/hardlink که به بیرون از فضای کاری مبدا resolve می‌شوند نادیده گرفته می‌شوند.
</Note>

اگر خودتان فایل‌های فضای کاری را مدیریت می‌کنید، می‌توانید ایجاد فایل راه‌انداز اولیه را غیرفعال کنید:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## پوشه‌های فضای کاری اضافی

نصب‌های قدیمی‌تر ممکن است `~/openclaw` را ایجاد کرده باشند. نگه داشتن چندین دایرکتوری فضای کاری می‌تواند باعث سردرگمی در احراز هویت یا drift وضعیت شود، چون در هر زمان فقط یک فضای کاری فعال است.

<Note>
**توصیه:** یک فضای کاری فعال واحد نگه دارید. اگر دیگر از پوشه‌های اضافی استفاده نمی‌کنید، آن‌ها را archive کنید یا به Trash منتقل کنید (برای مثال `trash ~/openclaw`). اگر عمدا چند فضای کاری نگه می‌دارید، مطمئن شوید `agents.defaults.workspace` به فضای کاری فعال اشاره می‌کند.

`openclaw doctor` وقتی دایرکتوری‌های فضای کاری اضافی را تشخیص دهد هشدار می‌دهد.
</Note>

## نقشهٔ فایل‌های فضای کاری

این‌ها فایل‌های استانداردی هستند که OpenClaw انتظار دارد داخل فضای کاری وجود داشته باشند:

<AccordionGroup>
  <Accordion title="AGENTS.md — operating instructions">
    دستورالعمل‌های عملیاتی برای عامل و اینکه چگونه باید از حافظه استفاده کند. در شروع هر نشست بارگذاری می‌شود. جای مناسبی برای قواعد، اولویت‌ها و جزئیات «چگونه رفتار کردن» است.
  </Accordion>
  <Accordion title="SOUL.md — persona and tone">
    پرسونـا، لحن و مرزها. در هر نشست بارگذاری می‌شود. راهنما: [راهنمای شخصیت SOUL.md](/fa/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — who the user is">
    اینکه کاربر کیست و چگونه باید او را خطاب کرد. در هر نشست بارگذاری می‌شود.
  </Accordion>
  <Accordion title="IDENTITY.md — name, vibe, emoji">
    نام، vibe و ایموجی عامل. در آیین راه‌اندازی اولیه ایجاد/به‌روزرسانی می‌شود.
  </Accordion>
  <Accordion title="TOOLS.md — local tool conventions">
    یادداشت‌هایی دربارهٔ ابزارها و قراردادهای محلی شما. دسترس‌پذیری ابزارها را کنترل نمی‌کند؛ فقط راهنماست.
  </Accordion>
  <Accordion title="HEARTBEAT.md — heartbeat checklist">
    چک‌لیست اختیاری و بسیار کوچک برای اجراهای Heartbeat. آن را کوتاه نگه دارید تا مصرف توکن بالا نرود.
  </Accordion>
  <Accordion title="BOOT.md — startup checklist">
    چک‌لیست اختیاری راه‌اندازی که هنگام restart شدن Gateway به طور خودکار اجرا می‌شود (وقتی [hookهای داخلی](/fa/automation/hooks) فعال باشند). آن را کوتاه نگه دارید؛ برای ارسال‌های خروجی از ابزار پیام استفاده کنید.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — first-run ritual">
    آیین یک‌بارهٔ اجرای نخست. فقط برای یک فضای کاری کاملا جدید ایجاد می‌شود. پس از کامل شدن آیین، آن را حذف کنید.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — daily memory log">
    لاگ روزانهٔ حافظه (یک فایل برای هر روز). توصیه می‌شود هنگام شروع نشست، امروز + دیروز خوانده شود.
  </Accordion>
  <Accordion title="MEMORY.md — curated long-term memory (optional)">
    حافظهٔ بلندمدت گزینش‌شده. فقط در نشست اصلی و خصوصی بارگذاری شود (نه در زمینه‌های اشتراکی/گروهی). برای گردش‌کار و flush خودکار حافظه، [حافظه](/fa/concepts/memory) را ببینید.
  </Accordion>
  <Accordion title="skills/ — workspace skills (optional)">
    Skills ویژهٔ فضای کاری. بالاترین مکان اولویت‌دار Skills برای آن فضای کاری. وقتی نام‌ها تداخل داشته باشند، Skills عامل پروژه، Skills عامل شخصی، Skills مدیریت‌شده، Skills همراه‌شده و `skills.load.extraDirs` را بازنویسی می‌کند.
  </Accordion>
  <Accordion title="canvas/ — Canvas UI files (optional)">
    فایل‌های رابط کاربری Canvas برای نمایش‌های node (برای مثال `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
اگر هر فایل راه‌انداز اولیه‌ای وجود نداشته باشد، OpenClaw یک نشانگر «فایل گم‌شده» را به نشست تزریق می‌کند و ادامه می‌دهد. فایل‌های راه‌انداز اولیهٔ بزرگ هنگام تزریق کوتاه می‌شوند؛ محدودیت‌ها را با `agents.defaults.bootstrapMaxChars` (پیش‌فرض: 12000) و `agents.defaults.bootstrapTotalMaxChars` (پیش‌فرض: 60000) تنظیم کنید. `openclaw setup` می‌تواند پیش‌فرض‌های گم‌شده را بدون بازنویسی فایل‌های موجود دوباره ایجاد کند.
</Note>

## چه چیزهایی در فضای کاری نیست

این موارد زیر `~/.openclaw/` قرار دارند و نباید به مخزن فضای کاری commit شوند:

- `~/.openclaw/openclaw.json` (پیکربندی)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (پروفایل‌های احراز هویت مدل: OAuth + کلیدهای API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (حساب runtime مربوط به Codex برای هر عامل، پیکربندی، Skills، plugins و وضعیت native thread)
- `~/.openclaw/credentials/` (وضعیت کانال/ارائه‌دهنده به‌علاوهٔ داده‌های legacy import مربوط به OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (رونوشت‌های نشست + فراداده)
- `~/.openclaw/skills/` (Skills مدیریت‌شده)

اگر لازم است نشست‌ها یا پیکربندی را migrate کنید، آن‌ها را جداگانه کپی کنید و بیرون از version control نگه دارید.

## پشتیبان‌گیری با Git (توصیه‌شده، خصوصی)

با فضای کاری مانند حافظهٔ خصوصی رفتار کنید. آن را در یک مخزن git **خصوصی** قرار دهید تا پشتیبان‌گیری شود و قابل بازیابی باشد.

این مراحل را روی ماشینی اجرا کنید که Gateway روی آن اجرا می‌شود (فضای کاری همان‌جاست).

<Steps>
  <Step title="Initialize the repo">
    اگر git نصب باشد، فضای کاری‌های کاملا جدید به طور خودکار initialize می‌شوند. اگر این فضای کاری هنوز مخزن نیست، اجرا کنید:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Add a private remote">
    <Tabs>
      <Tab title="GitHub web UI">
        1. یک repository **خصوصی** جدید در GitHub ایجاد کنید.
        2. آن را با README initialize نکنید (از merge conflict جلوگیری می‌کند).
        3. URL ریموت HTTPS را کپی کنید.
        4. ریموت را اضافه کنید و push کنید:

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
        2. آن را با README initialize نکنید (از merge conflict جلوگیری می‌کند).
        3. URL ریموت HTTPS را کپی کنید.
        4. ریموت را اضافه کنید و push کنید:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Ongoing updates">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## رازها را commit نکنید

<Warning>
حتی در یک مخزن خصوصی، از ذخیرهٔ رازها در فضای کاری پرهیز کنید:

- کلیدهای API، توکن‌های OAuth، گذرواژه‌ها یا اعتبارنامه‌های خصوصی.
- هر چیزی زیر `~/.openclaw/`.
- dumpهای خام چت‌ها یا پیوست‌های حساس.

اگر باید ارجاع‌های حساس را ذخیره کنید، از placeholderها استفاده کنید و راز واقعی را جای دیگری نگه دارید (مدیر گذرواژه، متغیرهای محیطی، یا `~/.openclaw/`).
</Warning>

شروع پیشنهادی برای `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## انتقال فضای کاری به یک ماشین جدید

<Steps>
  <Step title="Clone the repo">
    مخزن را در مسیر دلخواه clone کنید (پیش‌فرض `~/.openclaw/workspace`).
  </Step>
  <Step title="Update config">
    `agents.defaults.workspace` را در `~/.openclaw/openclaw.json` روی آن مسیر تنظیم کنید.
  </Step>
  <Step title="Seed missing files">
    `openclaw setup --workspace <path>` را اجرا کنید تا هر فایل گم‌شده‌ای seed شود.
  </Step>
  <Step title="Copy sessions (optional)">
    اگر به نشست‌ها نیاز دارید، `~/.openclaw/agents/<agentId>/sessions/` را جداگانه از ماشین قدیمی کپی کنید.
  </Step>
</Steps>

## نکات پیشرفته

- مسیریابی چندعاملی می‌تواند از فضای کاری‌های متفاوت برای هر عامل استفاده کند. برای پیکربندی مسیریابی، [مسیریابی کانال](/fa/channels/channel-routing) را ببینید.
- اگر `agents.defaults.sandbox` فعال باشد، نشست‌های غیر اصلی می‌توانند از فضاهای کاری سندباکس برای هر نشست زیر `agents.defaults.sandbox.workspaceRoot` استفاده کنند.

## مرتبط

- [Heartbeat](/fa/gateway/heartbeat) — فایل فضای کاری HEARTBEAT.md
- [سندباکس‌سازی](/fa/gateway/sandboxing) — دسترسی فضای کاری در محیط‌های سندباکس‌شده
- [نشست](/fa/concepts/session) — مسیرهای ذخیره‌سازی نشست
- [دستورهای پایدار](/fa/automation/standing-orders) — دستورالعمل‌های ماندگار در فایل‌های فضای کاری
