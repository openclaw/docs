---
read_when:
    - تريد استخدام اشتراك Claude Max مع أدوات متوافقة مع OpenAI
    - تريد خادم API محليًا يغلّف Claude Code CLI
    - تريد تقييم الوصول إلى Anthropic القائم على الاشتراك مقارنةً بالوصول القائم على مفتاح API
summary: وكيل مجتمعي لإتاحة بيانات اعتماد اشتراك Claude كنقطة نهاية متوافقة مع OpenAI
title: وكيل API لـ Claude Max
x-i18n:
    generated_at: "2026-07-12T06:26:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** هي حزمة npm مجتمعية (وليست Plugin لـ OpenClaw) تتيح
اشتراك Claude Max/Pro كنقطة نهاية API متوافقة مع OpenAI، بحيث يمكنك توجيه
أي أداة متوافقة مع OpenAI إلى اشتراكك بدلًا من مفتاح Anthropic API.

<Warning>
هذا مسار متوافق تقنيًا فقط، وليس مسارًا معتمدًا رسميًا. سبق أن حظرت Anthropic
بعض استخدامات الاشتراك خارج Claude Code؛ تحقّق من قواعد الفوترة الحالية لدى
Anthropic قبل الاعتماد على هذا المسار.

تصف وثائق Claude Code من Anthropic الأمر `claude -p` بأنه استخدام برمجي أو
عبر Agent SDK. ووفقًا لتحديث دعم Anthropic الصادر في 15 يونيو 2026، فإن
استخدام Claude Agent SDK و`claude -p` وتطبيقات الجهات الخارجية يُحتسب ضمن
حدود استخدام الاشتراك المسجّل الدخول إليه (وقد عُلّقت خطة الرصيد المنفصلة
لـ Agent SDK التي أُعلن عنها سابقًا). راجع [مقالة خطة Agent SDK
من Anthropic](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)،
ومقالتَي خطط [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
و[Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)،
و[موفّر Anthropic](/ar/providers/anthropic) للاطلاع على ملاحظات OpenClaw الخاصة
بفوترة Claude CLI.
</Warning>

## لماذا تستخدم هذا

| النهج                     | مسار التكلفة                                     | الأنسب لـ                                      |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| مفتاح Anthropic API       | الدفع لكل رمز عبر Claude Console                 | تطبيقات الإنتاج والأتمتة المشتركة والأحجام الكبيرة |
| وكيل اشتراك Claude        | قواعد الخطة والرصيد في Claude Code / `claude -p` | التجارب الشخصية باستخدام أدوات متوافقة          |

يتيح هذا الوكيل لاشتراك Claude Max أو Pro العمل مع الأدوات المتوافقة مع
OpenAI. وهو ليس مسارًا غير محدود بسعر ثابت، بل يرث حدود استخدام Claude Code.
تظل مفاتيح API مسار الفوترة الأوضح للاستخدام في بيئات الإنتاج.

## آلية العمل

```text
Your App -> claude-max-api-proxy -> Claude Code CLI / claude -p -> Anthropic
     (OpenAI format)                (converts format)              (uses your login)
```

يشغّل الوكيل Claude Code CLI كعملية فرعية لكل طلب، ويحوّل طلبات المحادثة
بتنسيق OpenAI إلى مطالبات CLI، ثم يبث الاستجابة (أو يعيدها) بتنسيق OpenAI.

## بدء الاستخدام

<Steps>
  <Step title="Install the proxy">
    يتطلب Node.js 20 أو أحدث وClaude Code CLI تمت مصادقته.

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
    وجّه OpenClaw إلى الوكيل بوصفه نقطة نهاية مخصصة متوافقة مع OpenAI:

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
معرّفات النماذج أدناه تخص كتالوج الوكيل نفسه، وليست مراجع نماذج Anthropic
في OpenClaw. يرتبط كل معرّف باسم مستعار لنموذج Claude Code CLI (`opus` أو
`sonnet` أو `haiku`)، ولذلك يتغير النموذج الأساسي كلما حدّثت Anthropic ذلك
الاسم المستعار في CLI. تحقّق من ملف README الحالي للوكيل قبل الاعتماد على
تعيين محدد.
</Note>

| معرّف النموذج       | الاسم المستعار في CLI | التعيين الحالي    |
| ----------------- | --------- | --------------- |
| `claude-opus-4`   | `opus`    | Claude Opus 4.5 |
| `claude-sonnet-4` | `sonnet`  | Claude Sonnet 4 |
| `claude-haiku-4`  | `haiku`   | Claude Haiku 4  |

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="Proxy-style OpenAI-compatible notes">
    يستخدم هذا المسار العام المخصص `/v1` والمتوافق مع OpenAI في OpenClaw،
    وهو المسار نفسه الذي تستخدمه أي واجهة خلفية أخرى مستضافة ذاتيًا ومتوافقة
    مع OpenAI:

    - لا ينطبق تشكيل الطلبات الأصلي الخاص بـ OpenAI فقط.
    - لا ينطبق `/fast` و`service_tier` إلا على حركة البيانات المباشرة إلى
      `api.anthropic.com`؛ وتترك مسارات الوكيل `service_tier` دون تغيير
      (راجع [الوضع السريع لموفّر Anthropic](/ar/providers/anthropic#advanced-configuration)).
    - لا يتوفر `store` الخاص بواجهة Responses، ولا تلميحات ذاكرة التخزين
      المؤقت للمطالبات، ولا تشكيل حمولات توافق الاستدلال في OpenAI.
    - لا تُرسل ترويسات الإسناد الخاصة بـ OpenAI/Codex في OpenClaw
      (`originator` و`version` و`User-Agent`) إلا مع حركة OAuth الأصلية إلى
      `api.openai.com`، ولا تُرسل إلى أهداف `OPENAI_BASE_URL` المخصصة مثل
      هذا الوكيل.

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

## ملاحظات

- يرث سلوك الفوترة ورصيد الاستخدام وحدود المعدل الخاص بـ `claude -p` في Claude Code.
- يرتبط بـ `127.0.0.1` فقط، ولا يرسل البيانات إلى أي خادم تابع لجهة خارجية بخلاف اتصال CLI نفسه بـ Anthropic.
- يدعم بث الاستجابات.
- لا يجري التحقق من إخفاقات المصادقة عند بدء التشغيل، ولا تظهر إلا عند تنفيذ طلب محادثة فعليًا؛ إذا لم تتم مصادقة CLI، فتوقّع إخفاق الطلب الأول بدلًا من رفض الخادم بدء التشغيل.

<Note>
للتكامل الأصلي مع Anthropic باستخدام Claude CLI أو مفاتيح API، راجع [موفّر Anthropic](/ar/providers/anthropic). ولاشتراكات OpenAI/Codex، راجع [موفّر OpenAI](/ar/providers/openai).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/ar/providers/anthropic" icon="bolt">
    تكامل OpenClaw الأصلي مع Claude CLI أو مفاتيح API.
  </Card>
  <Card title="OpenAI provider" href="/ar/providers/openai" icon="robot">
    لاشتراكات OpenAI/Codex.
  </Card>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع الموفّرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="Configuration" href="/ar/gateway/configuration" icon="gear">
    مرجع الإعداد الكامل.
  </Card>
</CardGroup>
