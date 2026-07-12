---
read_when:
    - الإعداد للمرة الأولى من الصفر
    - تريد أسرع طريقة للحصول على دردشة تعمل
summary: ثبّت OpenClaw وابدأ محادثتك الأولى خلال دقائق.
title: بدء الاستخدام
x-i18n:
    generated_at: "2026-07-12T06:29:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 308ca58b8a11832b5a4c0d4634d1c88ef44681ef755a18d675bcff60b5aba929
    source_path: start/getting-started.md
    workflow: 16
---

ثبّت OpenClaw، وشغّل الإعداد الأولي، وابدأ الدردشة مع مساعد الذكاء الاصطناعي خلال نحو 5
دقائق. عند الانتهاء، سيكون لديك Gateway قيد التشغيل، ومصادقة مهيأة، وجلسة
دردشة عاملة.

## ما تحتاج إليه

- **Node.js 22.19+ أو 23.11+ أو 24+** (الإصدار 24 هو الخيار الافتراضي الموصى به)
- **مفتاح API** من موفّر نماذج (Anthropic أو OpenAI أو Google أو غيرها) — سيطلبه منك الإعداد الأولي

<Tip>
تحقق من إصدار Node باستخدام `node --version`.
**مستخدمو Windows:** يُعد تطبيق Windows Hub الأصلي أسهل خيار لسطح المكتب. كما أن
مساري مثبّت PowerShell وGateway عبر WSL2 مدعومان أيضًا. راجع [Windows](/ar/platforms/windows).
هل تحتاج إلى تثبيت Node؟ راجع [إعداد Node](/ar/install/node).
</Tip>

## الإعداد السريع

<Steps>
  <Step title="تثبيت OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="عملية برنامج التثبيت النصي"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    طرق تثبيت أخرى (Docker وNix وnpm): [التثبيت](/ar/install).
    </Note>

  </Step>
  <Step title="تشغيل الإعداد الأولي">
    ```bash
    openclaw onboard --install-daemon
    ```

    يرشدك المعالج خلال اختيار موفّر نماذج، وتعيين مفتاح API،
    وتهيئة Gateway. لا تستغرق البداية السريعة عادةً سوى بضع دقائق، لكن
    تسجيل الدخول إلى الموفّر، وإقران القنوات، وتثبيت الخدمة الخفية، والتنزيلات الشبكية، وSkills،
    أو Plugins الاختيارية قد تجعل الإعداد الأولي الكامل يستغرق وقتًا أطول. تخطَّ الخطوات
    الاختيارية وعُد إليها لاحقًا باستخدام `openclaw configure`.

    راجع [الإعداد الأولي (CLI)](/ar/start/wizard) للاطلاع على المرجع الكامل.

  </Step>
  <Step title="التحقق من تشغيل Gateway">
    ```bash
    openclaw gateway status
    ```

    ينبغي أن ترى Gateway يستمع على المنفذ 18789.

  </Step>
  <Step title="فتح لوحة المعلومات">
    ```bash
    openclaw dashboard
    ```

    يؤدي هذا إلى فتح واجهة التحكم في متصفحك. إذا حُمّلت، فكل شيء يعمل.

  </Step>
  <Step title="إرسال رسالتك الأولى">
    اكتب رسالة في دردشة واجهة التحكم، وينبغي أن تتلقى ردًا من الذكاء الاصطناعي.

    هل تريد الدردشة من هاتفك بدلًا من ذلك؟ أسرع قناة يمكن إعدادها هي
    [Telegram](/ar/channels/telegram) (لا تتطلب سوى رمز بوت). راجع [القنوات](/ar/channels)
    للاطلاع على جميع الخيارات.

  </Step>
</Steps>

<Accordion title="متقدم: تحميل إصدار مخصص من واجهة التحكم">
  إذا كنت تدير إصدارًا مترجمًا أو مخصصًا من لوحة المعلومات، فاضبط
  `gateway.controlUi.root` على دليل يحتوي على الأصول الثابتة المبنية
  و`index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# انسخ ملفاتك الثابتة المبنية إلى ذلك الدليل.
```

ثم عيّن ما يلي:

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

أعد تشغيل Gateway وافتح لوحة المعلومات مجددًا:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## ما الذي ينبغي فعله بعد ذلك

<Columns>
  <Card title="ربط قناة" href="/ar/channels" icon="message-square">
    Discord وFeishu وiMessage وMatrix وMicrosoft Teams وSignal وSlack وTelegram وWhatsApp وZalo وغيرها.
  </Card>
  <Card title="الإقران والأمان" href="/ar/channels/pairing" icon="shield">
    تحكّم في من يمكنه مراسلة وكيلك.
  </Card>
  <Card title="تهيئة Gateway" href="/ar/gateway/configuration" icon="settings">
    النماذج والأدوات وبيئة العزل والإعدادات المتقدمة.
  </Card>
  <Card title="استعراض الأدوات" href="/ar/tools" icon="wrench">
    المتصفح والتنفيذ والبحث على الويب وSkills وPlugins.
  </Card>
</Columns>

<Accordion title="متقدم: متغيرات البيئة">
  إذا كنت تشغّل OpenClaw باستخدام حساب خدمة أو تريد مسارات مخصصة:

- `OPENCLAW_HOME` — الدليل الرئيسي لحل المسارات الداخلية
- `OPENCLAW_STATE_DIR` — تجاوز دليل الحالة
- `OPENCLAW_CONFIG_PATH` — تجاوز مسار ملف الإعدادات

المرجع الكامل: [متغيرات البيئة](/ar/help/environment).
</Accordion>

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [نظرة عامة على القنوات](/ar/channels)
- [الإعداد](/ar/start/setup)
