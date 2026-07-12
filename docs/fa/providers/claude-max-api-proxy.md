---
read_when:
    - می‌خواهید از اشتراک Claude Max با ابزارهای سازگار با OpenAI استفاده کنید
    - شما یک سرور API محلی می‌خواهید که Claude Code CLI را دربر بگیرد
    - می‌خواهید دسترسی به Anthropic مبتنی بر اشتراک را در مقایسه با دسترسی مبتنی بر کلید API ارزیابی کنید
summary: پروکسی جامعه‌محور برای ارائهٔ اعتبارنامه‌های اشتراک Claude به‌صورت یک نقطهٔ پایانی سازگار با OpenAI
title: پروکسی API کلود مکس
x-i18n:
    generated_at: "2026-07-12T10:42:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** یک بستهٔ npm ساخته‌شده توسط جامعه است (نه یک Plugin برای OpenClaw) که اشتراک Claude Max/Pro را به‌صورت یک نقطهٔ پایانی API سازگار با OpenAI ارائه می‌کند؛ بنابراین می‌توانید به‌جای کلید API متعلق به Anthropic، هر ابزار سازگار با OpenAI را به اشتراک خود متصل کنید.

<Warning>
این فقط از نظر فنی سازگار است و روشی نیست که رسماً تأیید شده باشد. Anthropic در گذشته برخی استفاده‌ها از اشتراک در خارج از Claude Code را مسدود کرده است؛ پیش از اتکا به این روش، قوانین فعلی صورت‌حساب Anthropic را بررسی کنید.

مستندات Claude Code متعلق به Anthropic، دستور `claude -p` را به‌عنوان استفادهٔ برنامه‌نویسی‌شده/SDK عامل توصیف می‌کنند. طبق به‌روزرسانی پشتیبانی Anthropic در ۱۵ ژوئن ۲۰۲۶، استفاده از Claude Agent SDK، دستور `claude -p` و برنامه‌های شخص ثالث از محدودیت‌های استفادهٔ اشتراک واردشده کسر می‌شود (طرح اعتبار جداگانهٔ Agent SDK که پیش‌تر اعلام شده بود، متوقف شده است). برای اطلاعات بیشتر، [مقالهٔ طرح Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)، مقاله‌های طرح [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan) و [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan) متعلق به Anthropic و همچنین [ارائه‌دهندهٔ Anthropic](/fa/providers/anthropic) را برای یادداشت‌های صورت‌حساب خود OpenClaw دربارهٔ CLI متعلق به Claude ببینید.
</Warning>

## چرا از این استفاده کنیم

| روش                       | مسیر هزینه                                      | مناسب برای                                    |
| ------------------------- | ----------------------------------------------- | --------------------------------------------- |
| کلید API متعلق به Anthropic | پرداخت به‌ازای هر توکن از طریق Claude Console | برنامه‌های عملیاتی، خودکارسازی مشترک، حجم بالا |
| پروکسی اشتراک Claude      | قوانین طرح و اعتبار Claude Code / `claude -p`  | آزمایش‌های شخصی با ابزارهای سازگار             |

این پروکسی امکان استفاده از اشتراک Claude Max یا Pro را با ابزارهای سازگار با OpenAI فراهم می‌کند. این روشی نامحدود با نرخ ثابت نیست؛ بلکه محدودیت‌های استفادهٔ Claude Code را به ارث می‌برد. برای استفادهٔ عملیاتی، کلیدهای API همچنان مسیر شفاف‌تری برای صورت‌حساب هستند.

## نحوهٔ کار

```text
برنامهٔ شما -> claude-max-api-proxy -> Claude Code CLI / claude -p -> Anthropic
     (قالب OpenAI)                  (تبدیل قالب)                    (استفاده از ورود شما)
```

پروکسی برای هر درخواست، Claude Code CLI را به‌صورت یک زیرفرایند اجرا می‌کند، درخواست‌های گفت‌وگو با قالب OpenAI را به اعلان‌های CLI تبدیل می‌کند و پاسخ را به‌صورت جریانی (یا یک‌جا) با قالب OpenAI بازمی‌گرداند.

## شروع به کار

<Steps>
  <Step title="Install the proxy">
    به Node.js 20+ و یک Claude Code CLI احراز هویت‌شده نیاز دارد.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    claude auth login   # if not already authenticated
    ```

  </Step>
  <Step title="Start the server">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="Test the proxy">
    ```bash
    curl http://localhost:3456/health
    curl http://localhost:3456/v1/models

    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="Configure OpenClaw">
    OpenClaw را طوری تنظیم کنید که از پروکسی به‌عنوان یک نقطهٔ پایانی سفارشی سازگار با OpenAI استفاده کند:

    ```json5
    {
      env: {
        OPENAI_API_KEY: "not-needed",
        OPENAI_BASE_URL: "http://localhost:3456/v1",
      },
      agents: {
        defaults: {
          model: { primary: "openai/claude-opus-4" },
        },
      },
    }
    ```

  </Step>
</Steps>

<Note>
شناسه‌های مدل زیر متعلق به فهرست خود پروکسی هستند، نه ارجاع‌های مدل Anthropic در OpenClaw. هر شناسه به یک نام مستعار مدل در Claude Code CLI (`opus`، `sonnet`، `haiku`) نگاشت می‌شود؛ بنابراین هر زمان Anthropic آن نام مستعار را در CLI به‌روزرسانی کند، مدل زیربنایی نیز تغییر می‌کند. پیش از اتکا به یک نگاشت مشخص، README فعلی پروکسی را بررسی کنید.
</Note>

| شناسهٔ مدل        | نام مستعار CLI | نگاشت فعلی       |
| ----------------- | -------------- | ---------------- |
| `claude-opus-4`   | `opus`         | Claude Opus 4.5  |
| `claude-sonnet-4` | `sonnet`       | Claude Sonnet 4  |
| `claude-haiku-4`  | `haiku`        | Claude Haiku 4   |

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Proxy-style OpenAI-compatible notes">
    این روش از مسیر عمومی و سفارشی `/v1` سازگار با OpenAI در OpenClaw استفاده می‌کند؛ همان مسیری که برای هر بک‌اند خودمیزبانِ سازگار با OpenAI به‌کار می‌رود:

    - شکل‌دهی درخواست که فقط مختص OpenAI بومی است، اعمال نمی‌شود.
    - `/fast` و `service_tier` فقط برای ترافیک مستقیم `api.anthropic.com` اعمال می‌شوند؛ مسیرهای پروکسی `service_tier` را بدون تغییر باقی می‌گذارند (به [حالت سریع ارائه‌دهندهٔ Anthropic](/fa/providers/anthropic#advanced-configuration) مراجعه کنید).
    - شکل‌دهی بار داده برای `store` در Responses، راهنمایی‌های کش اعلان یا سازگاری استدلال OpenAI انجام نمی‌شود.
    - سرآیندهای انتساب OpenAI/Codex متعلق به OpenClaw (`originator`، `version`، `User-Agent`) فقط در ترافیک OAuth بومی `api.openai.com` ارسال می‌شوند، نه برای مقصدهای سفارشی `OPENAI_BASE_URL` مانند این پروکسی.

  </Accordion>

  <Accordion title="Auto-start on macOS with LaunchAgent">
    ```bash
    cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>Label</key>
      <string>com.claude-max-api</string>
      <key>RunAtLoad</key>
      <true/>
      <key>KeepAlive</key>
      <true/>
      <key>ProgramArguments</key>
      <array>
        <string>/usr/local/bin/node</string>
        <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
      </array>
      <key>EnvironmentVariables</key>
      <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
      </dict>
    </dict>
    </plist>
    EOF

    launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
    ```

  </Accordion>
</AccordionGroup>

## نکات

- رفتار صورت‌حساب، اعتبار استفاده و محدودیت نرخ `claude -p` در Claude Code را به ارث می‌برد.
- فقط به `127.0.0.1` متصل می‌شود و به‌جز فراخوانی خود CLI به Anthropic، داده‌ای به هیچ سرور شخص ثالثی ارسال نمی‌کند.
- پاسخ‌های جریانی پشتیبانی می‌شوند.
- خطاهای احراز هویت هنگام راه‌اندازی بررسی نمی‌شوند و فقط پس از اجرای واقعی یک درخواست گفت‌وگو ظاهر می‌شوند؛ اگر CLI احراز هویت نشده باشد، انتظار داشته باشید نخستین درخواست ناموفق شود، نه اینکه سرور از راه‌اندازی خودداری کند.

<Note>
برای یکپارچه‌سازی بومی Anthropic با Claude CLI یا کلیدهای API، به [ارائه‌دهندهٔ Anthropic](/fa/providers/anthropic) مراجعه کنید. برای اشتراک‌های OpenAI/Codex، [ارائه‌دهندهٔ OpenAI](/fa/providers/openai) را ببینید.
</Note>

## موارد مرتبط

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/fa/providers/anthropic" icon="bolt">
    یکپارچه‌سازی بومی OpenClaw با Claude CLI یا کلیدهای API.
  </Card>
  <Card title="OpenAI provider" href="/fa/providers/openai" icon="robot">
    برای اشتراک‌های OpenAI/Codex.
  </Card>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    نمایی کلی از همهٔ ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="Configuration" href="/fa/gateway/configuration" icon="gear">
    مرجع کامل پیکربندی.
  </Card>
</CardGroup>
