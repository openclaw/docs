---
read_when:
    - تريد استخدام اشتراك Claude Max مع أدوات متوافقة مع OpenAI
    - تريد خادم API محليًا يغلّف Claude Code CLI
    - تريد تقييم الوصول إلى Anthropic القائم على الاشتراك مقابل الوصول القائم على مفتاح API
summary: وكيل مجتمعي لعرض بيانات اعتماد اشتراك Claude كنقطة نهاية متوافقة مع OpenAI
title: وكيل Claude Max API
x-i18n:
    generated_at: "2026-06-27T18:23:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24bd2b4b56e4b8829e67f248d0e0a6bad53ccbd9ce98ee288bfa4de93508ef27
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** هي أداة مجتمعية تعرض اشتراك Claude Max/Pro الخاص بك كنقطة نهاية API متوافقة مع OpenAI. يتيح لك ذلك استخدام اشتراكك مع أي أداة تدعم تنسيق OpenAI API.

<Warning>
هذا المسار مخصص للتوافق التقني فقط. سبق أن حظرت Anthropic بعض استخدامات الاشتراك
خارج Claude Code في الماضي. عليك أن تقرر بنفسك ما إذا كنت ستستخدمه
وأن تتحقق من قواعد الفوترة الحالية لدى Anthropic قبل الاعتماد عليه.

تقول مستندات الدعم الحالية لدى Anthropic إن `claude -p` هو استخدام Agent SDK/برمجي.
ابتداء من 15 يونيو 2026، سيستهلك استخدام `claude -p` ضمن خطة الاشتراك أولا من رصيد
Agent SDK الشهري المنفصل، ثم من أرصدة الاستخدام بأسعار API القياسية إذا كانت
أرصدة الاستخدام مفعلة.
</Warning>

## لماذا تستخدم هذا؟

| النهج                     | مسار التكلفة                                      | الأنسب لـ                                      |
| ------------------------- | ----------------------------------------------- | --------------------------------------------- |
| Anthropic API             | الدفع لكل رمز عبر Claude Console أو السحابة      | تطبيقات الإنتاج، الأتمتة المشتركة، الحجم الكبير |
| وكيل اشتراك Claude        | قواعد خطة ورصيد Claude Code / `claude -p`        | التجارب الشخصية مع الأدوات المتوافقة           |

إذا كان لديك اشتراك Claude Max أو Pro وتريد استخدامه مع
أدوات متوافقة مع OpenAI، فقد يناسب هذا الوكيل بعض سير العمل الشخصية. لكنه ليس
مسارا غير محدود بسعر ثابت. تظل مفاتيح API المسار الأوضح من حيث السياسة والفوترة
لاستخدام الإنتاج.

## كيف يعمل

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

يقوم الوكيل بما يلي:

1. يقبل طلبات بتنسيق OpenAI على `http://localhost:3456/v1/chat/completions`
2. يحولها إلى أوامر Claude Code CLI
3. يعيد الاستجابات بتنسيق OpenAI (مع دعم البث)

## البدء

<Steps>
  <Step title="Install the proxy">
    يتطلب Node.js 22+ وClaude Code CLI.

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

## الكتالوج المدمج

| معرّف النموذج       | يتم ربطه بـ       |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="Proxy-style OpenAI-compatible notes">
    يستخدم هذا المسار نفس مسار OpenAI المتوافق بأسلوب الوكيل مثل الواجهات الخلفية
    المخصصة الأخرى لـ `/v1`:

    - لا ينطبق تشكيل الطلبات الأصلي الخاص بـ OpenAI فقط
    - لا يوجد `service_tier`، ولا Responses `store`، ولا تلميحات لذاكرة التخزين المؤقت للمطالبات، ولا
      تشكيل حمولة متوافق مع استدلال OpenAI
    - لا يتم حقن ترويسات إسناد OpenClaw المخفية (`originator`، `version`، `User-Agent`)
      على عنوان URL الخاص بالوكيل

  </Accordion>

  <Accordion title="Auto-start on macOS with LaunchAgent">
    أنشئ LaunchAgent لتشغيل الوكيل تلقائيا:

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

## ملاحظات

- هذه **أداة مجتمعية**، وليست مدعومة رسميا من Anthropic أو OpenClaw
- تتطلب اشتراكا نشطا في Claude Max/Pro مع مصادقة Claude Code CLI
- ترث سلوك الفوترة وأرصدة الاستخدام وحدود المعدل الخاصة بـ Claude Code `claude -p`
- يعمل الوكيل محليا ولا يرسل البيانات إلى أي خوادم تابعة لطرف ثالث
- استجابات البث مدعومة بالكامل

<Note>
للتكامل الأصلي مع Anthropic باستخدام Claude CLI أو مفاتيح API، راجع [مزود Anthropic](/ar/providers/anthropic). لاشتراكات OpenAI/Codex، راجع [مزود OpenAI](/ar/providers/openai).
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/ar/providers/anthropic" icon="bolt">
    تكامل OpenClaw أصلي مع Claude CLI أو مفاتيح API.
  </Card>
  <Card title="OpenAI provider" href="/ar/providers/openai" icon="robot">
    لاشتراكات OpenAI/Codex.
  </Card>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع المزودين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="Configuration" href="/ar/gateway/configuration" icon="gear">
    مرجع الإعداد الكامل.
  </Card>
</CardGroup>
