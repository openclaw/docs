---
read_when:
    - تريد استخدام اشتراك Claude Max مع أدوات متوافقة مع OpenAI
    - تريد خادم API محليًا يغلّف Claude Code CLI
    - تريد تقييم الوصول إلى Anthropic القائم على الاشتراك مقابل الوصول القائم على مفتاح API
summary: وكيل مجتمعي لعرض بيانات اعتماد اشتراك Claude كنقطة نهاية متوافقة مع OpenAI
title: وكيل Claude Max API
x-i18n:
    generated_at: "2026-06-28T20:46:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d8800f7d5bd7adf9bff4825a45878a1bbde73b4d54afe4b5b4aa2b1b5523bee
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** هي أداة مجتمعية تتيح عرض اشتراكك في Claude Max/Pro كنقطة نهاية API متوافقة مع OpenAI. يتيح لك ذلك استخدام اشتراكك مع أي أداة تدعم تنسيق OpenAI API.

<Warning>
هذا المسار مخصص للتوافق التقني فقط. حظرت Anthropic في الماضي بعض استخدامات الاشتراكات
خارج Claude Code. يجب أن تقرر بنفسك ما إذا كنت ستستخدمه
وأن تتحقق من قواعد الفوترة الحالية لدى Anthropic قبل الاعتماد عليه.

تقول مستندات الدعم الحالية لدى Anthropic إن `claude -p` هو استخدام Agent SDK/برمجي.
أوقف تحديث دعم Anthropic في 15 يونيو 2026 خطة أرصدة Agent SDK
المنفصلة التي كانت معلنة. في الوقت الحالي، لا يزال استخدام Claude Agent SDK و`claude -p` وتطبيقات الجهات الخارجية
يُحتسب من حدود الاستخدام لاشتراك الحساب المسجّل دخوله.

قبل الاعتماد على هذا المسار، راجع [مقالة خطة Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
لدى Anthropic، بالإضافة إلى مقالات دعم Claude Code لحسابات
[Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
أو
[Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).
</Warning>

## لماذا تستخدم هذا؟

| النهج                     | مسار التكلفة                                      | الأنسب لـ                                  |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Anthropic API             | الدفع لكل رمز عبر Claude Console أو السحابة      | تطبيقات الإنتاج، والأتمتة المشتركة، والحجم |
| وكيل اشتراك Claude        | قواعد خطة وأرصدة Claude Code / `claude -p`       | التجارب الشخصية مع الأدوات المتوافقة       |

إذا كان لديك اشتراك Claude Max أو Pro وتريد استخدامه مع
أدوات متوافقة مع OpenAI، فقد يناسب هذا الوكيل بعض سير العمل الشخصية. إنه ليس مسارًا
غير محدود بسعر ثابت. تظل مفاتيح API المسار الأوضح من ناحية السياسات والفوترة
لاستخدام الإنتاج.

## كيف يعمل

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

الوكيل:

1. يقبل طلبات بتنسيق OpenAI على `http://localhost:3456/v1/chat/completions`
2. يحوّلها إلى أوامر Claude Code CLI
3. يعيد الاستجابات بتنسيق OpenAI (مع دعم البث)

## البدء

<Steps>
  <Step title="تثبيت الوكيل">
    يتطلب Node.js 22+ وClaude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="تشغيل الخادم">
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
  <Step title="تهيئة OpenClaw">
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

| معرّف النموذج     | يُطابق          |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## التهيئة المتقدمة

<AccordionGroup>
  <Accordion title="ملاحظات متوافقة مع OpenAI بنمط الوكيل">
    يستخدم هذا المسار نفس المسار المتوافق مع OpenAI بنمط الوكيل مثل واجهات الخلفية
    المخصصة الأخرى ضمن `/v1`:

    - لا ينطبق تشكيل الطلبات الأصلي الخاص بـ OpenAI فقط
    - لا يوجد `service_tier`، ولا Responses `store`، ولا تلميحات لذاكرة التخزين المؤقت للمطالبات، ولا
      تشكيل حمولة متوافق مع استدلال OpenAI
    - لا تُحقن ترويسات إسناد OpenClaw المخفية (`originator` و`version` و`User-Agent`)
      في عنوان URL الخاص بالوكيل

  </Accordion>

  <Accordion title="التشغيل التلقائي على macOS باستخدام LaunchAgent">
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

## ملاحظات

- هذه **أداة مجتمعية**، وليست مدعومة رسميًا من Anthropic أو OpenClaw
- تتطلب اشتراك Claude Max/Pro نشطًا مع مصادقة Claude Code CLI
- ترث سلوك الفوترة وأرصدة الاستخدام وحدود المعدّل من Claude Code `claude -p`
- يعمل الوكيل محليًا ولا يرسل البيانات إلى أي خوادم تابعة لجهات خارجية
- استجابات البث مدعومة بالكامل

<Note>
للتكامل الأصلي مع Anthropic باستخدام Claude CLI أو مفاتيح API، راجع [موفر Anthropic](/ar/providers/anthropic). لاشتراكات OpenAI/Codex، راجع [موفر OpenAI](/ar/providers/openai).
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="موفر Anthropic" href="/ar/providers/anthropic" icon="bolt">
    تكامل OpenClaw أصلي مع Claude CLI أو مفاتيح API.
  </Card>
  <Card title="موفر OpenAI" href="/ar/providers/openai" icon="robot">
    لاشتراكات OpenAI/Codex.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع الموفرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="التهيئة" href="/ar/gateway/configuration" icon="gear">
    مرجع التهيئة الكامل.
  </Card>
</CardGroup>
