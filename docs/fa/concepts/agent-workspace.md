---
read_when:
    - باید فضای کاری عامل یا چیدمان فایل‌های آن را توضیح دهید
    - می‌خواهید از فضای کاری یک عامل نسخهٔ پشتیبان تهیه کنید یا آن را مهاجرت دهید
sidebarTitle: Agent workspace
summary: 'فضای کاری عامل: مکان، چیدمان، و راهبرد پشتیبان‌گیری'
title: فضای کاری عامل
x-i18n:
    generated_at: "2026-04-29T22:40:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35d59d1f0dec05db30f9166a43bfa519d7299b08d093bbeb905d8f83e5cd022a
    source_path: concepts/agent-workspace.md
    workflow: 16
---

فضای کاری خانهٔ عامل است. این تنها دایرکتوری کاری است که برای ابزارهای فایل و زمینهٔ فضای کاری استفاده می‌شود. آن را خصوصی نگه دارید و مانند حافظه با آن رفتار کنید.

این جدا از `~/.openclaw/` است که پیکربندی، اعتبارنامه‌ها و نشست‌ها را ذخیره می‌کند.

<Warning>
فضای کاری **cwd پیش‌فرض** است، نه یک sandbox سخت‌گیرانه. ابزارها مسیرهای نسبی را نسبت به فضای کاری resolve می‌کنند، اما مسیرهای مطلق همچنان می‌توانند به بخش‌های دیگر میزبان دسترسی داشته باشند مگر اینکه sandboxing فعال باشد. اگر به جداسازی نیاز دارید، از [`agents.defaults.sandbox`](/fa/gateway/sandboxing) (و/یا پیکربندی sandbox جداگانه برای هر عامل) استفاده کنید.

وقتی sandboxing فعال است و `workspaceAccess` برابر `"rw"` نیست، ابزارها داخل یک فضای کاری sandbox زیر `~/.openclaw/sandboxes` اجرا می‌شوند، نه فضای کاری میزبان شما.
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

`openclaw onboard`، `openclaw configure` یا `openclaw setup` اگر فضای کاری و فایل‌های bootstrap وجود نداشته باشند، آن‌ها را ایجاد و مقداردهی اولیه می‌کند.

<Note>
کپی‌های seed برای sandbox فقط فایل‌های معمولی داخل فضای کاری را می‌پذیرند؛ aliasهای symlink/hardlink که به بیرون از فضای کاری منبع resolve می‌شوند نادیده گرفته می‌شوند.
</Note>

اگر خودتان فایل‌های فضای کاری را مدیریت می‌کنید، می‌توانید ایجاد فایل‌های bootstrap را غیرفعال کنید:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## پوشه‌های اضافی فضای کاری

نصب‌های قدیمی‌تر ممکن است `~/openclaw` را ایجاد کرده باشند. نگه داشتن چند دایرکتوری فضای کاری می‌تواند باعث سردرگمی در auth یا drift وضعیت شود، چون در هر زمان فقط یک فضای کاری فعال است.

<Note>
**توصیه:** یک فضای کاری فعال واحد نگه دارید. اگر دیگر از پوشه‌های اضافی استفاده نمی‌کنید، آن‌ها را بایگانی کنید یا به Trash منتقل کنید (برای مثال `trash ~/openclaw`). اگر عمداً چند فضای کاری نگه می‌دارید، مطمئن شوید `agents.defaults.workspace` به فضای کاری فعال اشاره می‌کند.

`openclaw doctor` وقتی دایرکتوری‌های اضافی فضای کاری را تشخیص دهد هشدار می‌دهد.
</Note>

## نقشهٔ فایل‌های فضای کاری

این‌ها فایل‌های استانداردی هستند که OpenClaw انتظار دارد داخل فضای کاری وجود داشته باشند:

<AccordionGroup>
  <Accordion title="AGENTS.md — دستورالعمل‌های عملیاتی">
    دستورالعمل‌های عملیاتی برای عامل و نحوهٔ استفادهٔ آن از حافظه. در شروع هر نشست بارگذاری می‌شود. جای مناسبی برای قوانین، اولویت‌ها و جزئیات «چگونه رفتار کند» است.
  </Accordion>
  <Accordion title="SOUL.md — شخصیت و لحن">
    شخصیت، لحن و مرزها. در هر نشست بارگذاری می‌شود. راهنما: [راهنمای شخصیت SOUL.md](/fa/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — کاربر کیست">
    کاربر کیست و چگونه باید او را خطاب کرد. در هر نشست بارگذاری می‌شود.
  </Accordion>
  <Accordion title="IDENTITY.md — نام، حس‌وحال، ایموجی">
    نام، حس‌وحال و ایموجی عامل. در طول آیین bootstrap ایجاد/به‌روزرسانی می‌شود.
  </Accordion>
  <Accordion title="TOOLS.md — قراردادهای ابزارهای محلی">
    یادداشت‌هایی دربارهٔ ابزارها و قراردادهای محلی شما. دسترس‌پذیری ابزارها را کنترل نمی‌کند؛ فقط راهنماست.
  </Accordion>
  <Accordion title="HEARTBEAT.md — چک‌لیست Heartbeat">
    چک‌لیست کوچک اختیاری برای اجرای Heartbeat. آن را کوتاه نگه دارید تا مصرف توکن زیاد نشود.
  </Accordion>
  <Accordion title="BOOT.md — چک‌لیست راه‌اندازی">
    چک‌لیست اختیاری راه‌اندازی که هنگام راه‌اندازی دوبارهٔ Gateway به‌صورت خودکار اجرا می‌شود (وقتی [hookهای داخلی](/fa/automation/hooks) فعال باشند). آن را کوتاه نگه دارید؛ برای ارسال‌های خروجی از ابزار پیام استفاده کنید.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — آیین اجرای نخستین">
    آیین یک‌بارهٔ اجرای نخستین. فقط برای یک فضای کاری کاملاً جدید ایجاد می‌شود. پس از کامل شدن آیین، آن را حذف کنید.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — گزارش روزانهٔ حافظه">
    گزارش روزانهٔ حافظه (یک فایل برای هر روز). توصیه می‌شود هنگام شروع نشست، امروز + دیروز را بخوانید.
  </Accordion>
  <Accordion title="MEMORY.md — حافظهٔ بلندمدت گزینش‌شده (اختیاری)">
    حافظهٔ بلندمدت گزینش‌شده. فقط در نشست اصلی و خصوصی بارگذاری شود (نه زمینه‌های مشترک/گروهی). برای گردش‌کار و flush خودکار حافظه، [Memory](/fa/concepts/memory) را ببینید.
  </Accordion>
  <Accordion title="skills/ — Skills فضای کاری (اختیاری)">
    Skills اختصاصی فضای کاری. مکان Skill با بالاترین اولویت برای آن فضای کاری. هنگام تداخل نام‌ها، Skills عامل پروژه، Skills عامل شخصی، Skills مدیریت‌شده، Skills بسته‌بندی‌شده و `skills.load.extraDirs` را بازنویسی می‌کند.
  </Accordion>
  <Accordion title="canvas/ — فایل‌های Canvas UI (اختیاری)">
    فایل‌های Canvas UI برای نمایش‌های node (برای مثال `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
اگر هر فایل bootstrap وجود نداشته باشد، OpenClaw یک نشانگر «فایل موجود نیست» را به نشست تزریق می‌کند و ادامه می‌دهد. فایل‌های بزرگ bootstrap هنگام تزریق کوتاه می‌شوند؛ محدودیت‌ها را با `agents.defaults.bootstrapMaxChars` (پیش‌فرض: 12000) و `agents.defaults.bootstrapTotalMaxChars` (پیش‌فرض: 60000) تنظیم کنید. `openclaw setup` می‌تواند پیش‌فرض‌های موجود نیست را بدون بازنویسی فایل‌های موجود دوباره ایجاد کند.
</Note>

## چه چیزی در فضای کاری نیست

این موارد زیر `~/.openclaw/` قرار دارند و نباید به repo فضای کاری commit شوند:

- `~/.openclaw/openclaw.json` (پیکربندی)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (پروفایل‌های auth مدل: OAuth + کلیدهای API)
- `~/.openclaw/credentials/` (وضعیت کانال/ارائه‌دهنده به‌علاوهٔ داده‌های import قدیمی OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (متن نشست‌ها + فراداده)
- `~/.openclaw/skills/` (Skills مدیریت‌شده)

اگر لازم است نشست‌ها یا پیکربندی را migrate کنید، آن‌ها را جداگانه کپی کنید و بیرون از version control نگه دارید.

## پشتیبان‌گیری Git (توصیه‌شده، خصوصی)

با فضای کاری مانند حافظهٔ خصوصی رفتار کنید. آن را در یک repo **خصوصی** git قرار دهید تا پشتیبان‌گیری شود و قابل بازیابی باشد.

این مراحل را روی ماشینی اجرا کنید که Gateway روی آن اجرا می‌شود (فضای کاری همان‌جا قرار دارد).

<Steps>
  <Step title="راه‌اندازی repo">
    اگر git نصب باشد، فضای کاری کاملاً جدید به‌صورت خودکار راه‌اندازی می‌شود. اگر این فضای کاری هنوز repo نیست، اجرا کنید:

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
        2. با README مقداردهی اولیه نکنید (برای جلوگیری از merge conflict).
        3. URL remote از نوع HTTPS را کپی کنید.
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
        2. با README مقداردهی اولیه نکنید (برای جلوگیری از merge conflict).
        3. URL remote از نوع HTTPS را کپی کنید.
        4. remote را اضافه کنید و push کنید:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="به‌روزرسانی‌های مستمر">
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
حتی در یک repo خصوصی، از ذخیرهٔ رازها در فضای کاری خودداری کنید:

- کلیدهای API، توکن‌های OAuth، گذرواژه‌ها یا اعتبارنامه‌های خصوصی.
- هر چیزی زیر `~/.openclaw/`.
- dump خام گفت‌وگوها یا پیوست‌های حساس.

اگر مجبورید ارجاع‌های حساس را ذخیره کنید، از placeholderها استفاده کنید و راز واقعی را جای دیگری نگه دارید (password manager، متغیرهای محیطی، یا `~/.openclaw/`).
</Warning>

شروع پیشنهادی برای `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## انتقال فضای کاری به ماشین جدید

<Steps>
  <Step title="Clone کردن repo">
    repo را در مسیر دلخواه clone کنید (پیش‌فرض `~/.openclaw/workspace`).
  </Step>
  <Step title="به‌روزرسانی پیکربندی">
    `agents.defaults.workspace` را در `~/.openclaw/openclaw.json` روی آن مسیر تنظیم کنید.
  </Step>
  <Step title="Seed کردن فایل‌های موجود نیست">
    `openclaw setup --workspace <path>` را اجرا کنید تا هر فایل موجود نیست seed شود.
  </Step>
  <Step title="کپی نشست‌ها (اختیاری)">
    اگر به نشست‌ها نیاز دارید، `~/.openclaw/agents/<agentId>/sessions/` را جداگانه از ماشین قدیمی کپی کنید.
  </Step>
</Steps>

## یادداشت‌های پیشرفته

- مسیریابی چندعاملی می‌تواند برای هر عامل از فضای کاری متفاوت استفاده کند. برای پیکربندی مسیریابی، [Channel routing](/fa/channels/channel-routing) را ببینید.
- اگر `agents.defaults.sandbox` فعال باشد، نشست‌های غیر اصلی می‌توانند از فضاهای کاری sandbox جداگانه برای هر نشست زیر `agents.defaults.sandbox.workspaceRoot` استفاده کنند.

## مرتبط

- [Heartbeat](/fa/gateway/heartbeat) — فایل فضای کاری HEARTBEAT.md
- [Sandboxing](/fa/gateway/sandboxing) — دسترسی به فضای کاری در محیط‌های sandbox شده
- [Session](/fa/concepts/session) — مسیرهای ذخیره‌سازی نشست
- [دستورهای پایدار](/fa/automation/standing-orders) — دستورالعمل‌های ماندگار در فایل‌های فضای کاری
