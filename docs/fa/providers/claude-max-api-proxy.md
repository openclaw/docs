---
read_when:
    - می‌خواهید از اشتراک Claude Max با ابزارهای سازگار با OpenAI استفاده کنید
    - شما یک سرور API محلی می‌خواهید که Claude Code CLI را پوشش دهد
    - می‌خواهید دسترسی Anthropic مبتنی بر اشتراک را در برابر دسترسی مبتنی بر کلید API ارزیابی کنید.
summary: پروکسی جامعه برای در دسترس قرار دادن اعتبارنامه‌های اشتراک Claude به‌عنوان یک نقطهٔ پایانی سازگار با OpenAI
title: پروکسی API Claude Max
x-i18n:
    generated_at: "2026-06-27T18:38:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24bd2b4b56e4b8829e67f248d0e0a6bad53ccbd9ce98ee288bfa4de93508ef27
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** یک ابزار جامعه‌محور است که اشتراک Claude Max/Pro شما را به‌صورت یک نقطه پایانی API سازگار با OpenAI ارائه می‌کند. این کار به شما امکان می‌دهد اشتراک خود را با هر ابزاری که از قالب OpenAI API پشتیبانی می‌کند استفاده کنید.

<Warning>
این مسیر فقط برای سازگاری فنی است. Anthropic در گذشته برخی استفاده‌های اشتراک
خارج از Claude Code را مسدود کرده است. باید خودتان تصمیم بگیرید که آیا از آن
استفاده کنید یا نه و پیش از اتکا به آن، قوانین فعلی صورت‌حساب Anthropic را بررسی کنید.

مستندات پشتیبانی فعلی Anthropic می‌گویند `claude -p` استفاده Agent SDK/برنامه‌نویسی است.
از 15 ژوئن 2026، استفاده از `claude -p` در طرح اشتراک ابتدا از یک اعتبار ماهانه جداگانه
Agent SDK کسر می‌شود، سپس اگر اعتبارهای استفاده فعال باشند، با نرخ‌های استاندارد API از
اعتبارهای استفاده کسر می‌شود.
</Warning>

## چرا از این استفاده کنیم؟

| رویکرد                    | مسیر هزینه                                      | مناسب برای                                  |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Anthropic API             | پرداخت به‌ازای هر توکن از طریق Claude Console یا ابر | اپلیکیشن‌های تولیدی، خودکارسازی مشترک، حجم بالا |
| پراکسی اشتراک Claude | قوانین طرح و اعتبار Claude Code / `claude -p` | آزمایش‌های شخصی با ابزارهای سازگار |

اگر اشتراک Claude Max یا Pro دارید و می‌خواهید آن را با ابزارهای سازگار با
OpenAI استفاده کنید، این پراکسی ممکن است برای برخی گردش‌کارهای شخصی مناسب باشد. این یک
مسیر نامحدود با نرخ ثابت نیست. کلیدهای API همچنان مسیر روشن‌تر سیاست و صورت‌حساب برای
استفاده تولیدی هستند.

## چگونه کار می‌کند

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

پراکسی:

1. درخواست‌های قالب OpenAI را در `http://localhost:3456/v1/chat/completions` می‌پذیرد
2. آن‌ها را به فرمان‌های Claude Code CLI تبدیل می‌کند
3. پاسخ‌ها را در قالب OpenAI برمی‌گرداند (پخش جریانی پشتیبانی می‌شود)

## شروع به کار

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
    OpenClaw را به‌عنوان یک نقطه پایانی سفارشی سازگار با OpenAI به پراکسی متصل کنید:

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

| شناسه مدل          | نگاشت به         |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Proxy-style OpenAI-compatible notes">
    این مسیر از همان مسیر پراکسی‌گونه سازگار با OpenAI استفاده می‌کند که دیگر بک‌اندهای سفارشی
    `/v1` از آن استفاده می‌کنند:

    - شکل‌دهی درخواست مخصوص OpenAI بومی اعمال نمی‌شود
    - نه `service_tier`، نه `store` در Responses، نه راهنماهای prompt-cache، و نه
      شکل‌دهی payload سازگار با استدلال OpenAI وجود دارد
    - هدرهای پنهان انتساب OpenClaw (`originator`، `version`، `User-Agent`)
      روی URL پراکسی تزریق نمی‌شوند

  </Accordion>

  <Accordion title="Auto-start on macOS with LaunchAgent">
    یک LaunchAgent بسازید تا پراکسی به‌صورت خودکار اجرا شود:

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

## یادداشت‌ها

- این یک **ابزار جامعه‌محور** است و به‌صورت رسمی توسط Anthropic یا OpenClaw پشتیبانی نمی‌شود
- به یک اشتراک فعال Claude Max/Pro با Claude Code CLI احراز هویت‌شده نیاز دارد
- رفتار صورت‌حساب، اعتبار استفاده، و محدودیت نرخ Claude Code `claude -p` را به ارث می‌برد
- پراکسی به‌صورت محلی اجرا می‌شود و داده‌ها را به هیچ سرور شخص ثالثی ارسال نمی‌کند
- پاسخ‌های پخش جریانی به‌طور کامل پشتیبانی می‌شوند

<Note>
برای یکپارچه‌سازی بومی Anthropic با Claude CLI یا کلیدهای API، [ارائه‌دهنده Anthropic](/fa/providers/anthropic) را ببینید. برای اشتراک‌های OpenAI/Codex، [ارائه‌دهنده OpenAI](/fa/providers/openai) را ببینید.
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
    نمای کلی همه ارائه‌دهنده‌ها، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="Configuration" href="/fa/gateway/configuration" icon="gear">
    مرجع کامل پیکربندی.
  </Card>
</CardGroup>
