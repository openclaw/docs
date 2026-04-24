---
read_when:
    - تريد استخدام اشتراك Claude Max مع أدوات متوافقة مع OpenAI
    - تريد خادم API محليًا يغلّف Claude Code CLI
    - تريد تقييم الوصول إلى Anthropic المعتمد على الاشتراك مقابل الوصول المعتمد على مفتاح API
summary: وكيل مجتمعي لكشف بيانات اعتماد اشتراك Claude كنقطة نهاية متوافقة مع OpenAI
title: وكيل Claude Max API
x-i18n:
    generated_at: "2026-04-24T07:58:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06c685c2f42f462a319ef404e4980f769e00654afb9637d873b98144e6a41c87
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

**claude-max-api-proxy** هي أداة مجتمعية تكشف اشتراك Claude Max/Pro الخاص بك كنقطة نهاية API متوافقة مع OpenAI. يتيح لك ذلك استخدام اشتراكك مع أي أداة تدعم تنسيق OpenAI API.

<Warning>
هذا المسار هو توافق تقني فقط. لقد حظرت Anthropic في الماضي بعض استخدامات الاشتراك
خارج Claude Code. يجب أن تقرر بنفسك ما إذا كنت ستستخدمه
وتتحقق من شروط Anthropic الحالية قبل الاعتماد عليه.
</Warning>

## لماذا تستخدم هذا؟

| النهج                  | التكلفة                                               | الأفضل لـ                                  |
| --------------------- | ----------------------------------------------------- | ------------------------------------------ |
| Anthropic API         | الدفع لكل رمز (~$15/M للإدخال، $75/M للإخراج لـ Opus) | تطبيقات الإنتاج، الأحجام الكبيرة           |
| اشتراك Claude Max     | $200/شهر ثابتة                                        | الاستخدام الشخصي، التطوير، الاستخدام غير المحدود |

إذا كان لديك اشتراك Claude Max وتريد استخدامه مع أدوات متوافقة مع OpenAI، فقد يقلل هذا الوكيل التكلفة لبعض سير العمل. وتظل مفاتيح API هي المسار الأوضح من ناحية السياسة للاستخدام الإنتاجي.

## كيف يعمل

```
Your App → claude-max-api-proxy → Claude Code CLI → Anthropic (via subscription)
     (OpenAI format)              (converts format)      (uses your login)
```

يقوم الوكيل بما يلي:

1. يقبل الطلبات بتنسيق OpenAI عند `http://localhost:3456/v1/chat/completions`
2. يحولها إلى أوامر Claude Code CLI
3. يعيد الاستجابات بتنسيق OpenAI ‏(مع دعم البث)

## البدء

<Steps>
  <Step title="تثبيت الوكيل">
    يتطلب Node.js 20+ وClaude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="بدء الخادم">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="اختبار الوكيل">
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
  <Step title="إعداد OpenClaw">
    وجّه OpenClaw إلى الوكيل كنقطة نهاية مخصصة متوافقة مع OpenAI:

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

## الكتالوج المضمّن

| معرّف النموذج       | يربط إلى         |
| ------------------- | ---------------- |
| `claude-opus-4`     | Claude Opus 4    |
| `claude-sonnet-4`   | Claude Sonnet 4  |
| `claude-haiku-4`    | Claude Haiku 4   |

## إعداد متقدم

<AccordionGroup>
  <Accordion title="ملاحظات التوافق مع OpenAI على نمط الوكيل">
    يستخدم هذا المسار الطريق نفسه على نمط الوكيل المتوافق مع OpenAI كما في
    الواجهات الخلفية المخصصة الأخرى عند `/v1`:

    - لا ينطبق تشكيل الطلبات الأصلي الخاص بـ OpenAI فقط
    - لا يوجد `service_tier`، ولا `store` في Responses، ولا تلميحات prompt-cache، ولا
      تشكيل حمولة التوافق الخاصة بالتفكير في OpenAI
    - لا يتم حقن رؤوس الإسناد المخفية الخاصة بـ OpenClaw ‏(`originator`, `version`, `User-Agent`)
      على عنوان URL الخاص بالوكيل

  </Accordion>

  <Accordion title="البدء التلقائي على macOS باستخدام LaunchAgent">
    أنشئ LaunchAgent لتشغيل الوكيل تلقائيًا:

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

## الروابط

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **المشكلات:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## ملاحظات

- هذه **أداة مجتمعية**، وليست مدعومة رسميًا من Anthropic أو OpenClaw
- تتطلب اشتراك Claude Max/Pro نشطًا مع Claude Code CLI موثَّقة
- يعمل الوكيل محليًا ولا يرسل البيانات إلى أي خوادم طرف ثالث
- الاستجابات المتدفقة مدعومة بالكامل

<Note>
للتكامل الأصلي مع Anthropic باستخدام Claude CLI أو مفاتيح API، راجع [موفر Anthropic](/ar/providers/anthropic). وبالنسبة إلى اشتراكات OpenAI/Codex، راجع [موفر OpenAI](/ar/providers/openai).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="موفر Anthropic" href="/ar/providers/anthropic" icon="bolt">
    تكامل OpenClaw أصلي مع Claude CLI أو مفاتيح API.
  </Card>
  <Card title="موفر OpenAI" href="/ar/providers/openai" icon="robot">
    لاشتراكات OpenAI/Codex.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع الموفّرين ومراجع النماذج وسلوك failover.
  </Card>
  <Card title="الإعداد" href="/ar/gateway/configuration" icon="gear">
    مرجع الإعدادات الكامل.
  </Card>
</CardGroup>
