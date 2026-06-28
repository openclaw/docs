---
read_when:
    - می‌خواهید از اشتراک Claude Max با ابزارهای سازگار با OpenAI استفاده کنید
    - شما یک سرور API محلی می‌خواهید که Claude Code CLI را پوشش دهد.
    - می‌خواهید دسترسی Anthropic مبتنی بر اشتراک را در برابر دسترسی مبتنی بر کلید API ارزیابی کنید.
summary: پراکسی جامعه برای ارائهٔ اعتبارنامه‌های اشتراک Claude به‌صورت یک نقطهٔ پایانی سازگار با OpenAI
title: پراکسی API Claude Max
x-i18n:
    generated_at: "2026-06-28T20:46:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d8800f7d5bd7adf9bff4825a45878a1bbde73b4d54afe4b5b4aa2b1b5523bee
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** یک ابزار جامعه‌محور است که اشتراک Claude Max/Pro شما را به‌صورت یک نقطهٔ پایانی API سازگار با OpenAI ارائه می‌کند. این امکان را می‌دهد که اشتراک خود را با هر ابزاری که از قالب OpenAI API پشتیبانی می‌کند استفاده کنید.

<Warning>
این مسیر فقط برای سازگاری فنی است. Anthropic در گذشته برخی استفاده‌ها از اشتراک را
بیرون از Claude Code مسدود کرده است. شما باید خودتان تصمیم بگیرید که آیا از آن
استفاده کنید یا نه، و پیش از تکیه بر آن، قوانین فعلی صورت‌حساب Anthropic را بررسی کنید.

مستندات پشتیبانی فعلی Anthropic می‌گویند `claude -p` استفادهٔ Agent SDK/برنامه‌نویسی است.
به‌روزرسانی پشتیبانی Anthropic در ۱۵ ژوئن ۲۰۲۶ طرح اعتباری جداگانهٔ اعلام‌شده برای Agent SDK
را متوقف کرد. فعلاً Claude Agent SDK، `claude -p`، و استفاده از برنامه‌های شخص ثالث
هنوز از محدودیت‌های مصرف اشتراک واردشده برداشت می‌کنند.

پیش از تکیه بر این مسیر، مقالهٔ Anthropic دربارهٔ [طرح Agent SDK
](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
را به‌همراه مقاله‌های پشتیبانی Claude Code برای حساب‌های
[Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
یا
[Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
بررسی کنید.
</Warning>

## چرا از این استفاده کنیم؟

| رویکرد                  | مسیر هزینه                                      | مناسب برای                                   |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Anthropic API             | پرداخت به‌ازای هر توکن از طریق Claude Console یا ابر   | برنامه‌های تولیدی، خودکارسازی مشترک، حجم بالا |
| پروکسی اشتراک Claude | قوانین طرح و اعتبار Claude Code / `claude -p` | آزمایش‌های شخصی با ابزارهای سازگار |

اگر اشتراک Claude Max یا Pro دارید و می‌خواهید آن را با ابزارهای سازگار با OpenAI
استفاده کنید، این پروکسی ممکن است برای برخی گردش‌کارهای شخصی مناسب باشد. این یک
مسیر نامحدود با نرخ ثابت نیست. کلیدهای API همچنان مسیر شفاف‌تر از نظر سیاست و صورت‌حساب
برای استفادهٔ تولیدی هستند.

## چگونه کار می‌کند

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

این پروکسی:

1. درخواست‌های با قالب OpenAI را در `http://localhost:3456/v1/chat/completions` می‌پذیرد
2. آن‌ها را به فرمان‌های Claude Code CLI تبدیل می‌کند
3. پاسخ‌ها را در قالب OpenAI برمی‌گرداند (جریان‌دهی پشتیبانی می‌شود)

## شروع کار

<Steps>
  <Step title="Install the proxy">
    به Node.js 22+ و Claude Code CLI نیاز دارد.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
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
    # Health check
    curl http://localhost:3456/health

    # List models
    curl http://localhost:3456/v1/models

    # Chat completion
    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="Configure OpenClaw">
    OpenClaw را به‌عنوان یک نقطهٔ پایانی سفارشی سازگار با OpenAI به پروکسی متصل کنید:

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

## کاتالوگ داخلی

| شناسهٔ مدل          | نگاشت می‌شود به         |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Proxy-style OpenAI-compatible notes">
    این مسیر از همان مسیر سازگار با OpenAI به سبک پروکسی استفاده می‌کند که سایر
    بک‌اندهای سفارشی `/v1` استفاده می‌کنند:

    - شکل‌دهی درخواست مخصوص OpenAI بومی اعمال نمی‌شود
    - بدون `service_tier`، بدون `store` در Responses، بدون راهنماهای کش پرامپت، و بدون
      شکل‌دهی payload سازگار با استدلال OpenAI
    - سرآیندهای انتساب پنهان OpenClaw (`originator`، `version`، `User-Agent`)
      روی URL پروکسی تزریق نمی‌شوند

  </Accordion>

  <Accordion title="Auto-start on macOS with LaunchAgent">
    یک LaunchAgent بسازید تا پروکسی به‌صورت خودکار اجرا شود:

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

## نکته‌ها

- این یک **ابزار جامعه‌محور** است و به‌صورت رسمی توسط Anthropic یا OpenClaw پشتیبانی نمی‌شود
- به یک اشتراک فعال Claude Max/Pro نیاز دارد که Claude Code CLI در آن احراز هویت شده باشد
- رفتار صورت‌حساب، اعتبار مصرف، و محدودیت نرخ Claude Code `claude -p` را به ارث می‌برد
- پروکسی به‌صورت محلی اجرا می‌شود و داده‌ها را به هیچ سرور شخص ثالثی ارسال نمی‌کند
- پاسخ‌های جریانی به‌طور کامل پشتیبانی می‌شوند

<Note>
برای یکپارچه‌سازی بومی Anthropic با Claude CLI یا کلیدهای API، [ارائه‌دهندهٔ Anthropic](/fa/providers/anthropic) را ببینید. برای اشتراک‌های OpenAI/Codex، [ارائه‌دهندهٔ OpenAI](/fa/providers/openai) را ببینید.
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/fa/providers/anthropic" icon="bolt">
    یکپارچه‌سازی بومی OpenClaw با Claude CLI یا کلیدهای API.
  </Card>
  <Card title="OpenAI provider" href="/fa/providers/openai" icon="robot">
    برای اشتراک‌های OpenAI/Codex.
  </Card>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    نمای کلی همهٔ ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="Configuration" href="/fa/gateway/configuration" icon="gear">
    مرجع کامل پیکربندی.
  </Card>
</CardGroup>
