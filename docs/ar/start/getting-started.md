---
read_when:
    - الإعداد لأول مرة من الصفر
    - تريد أسرع مسار إلى دردشة تعمل
summary: ثبّت OpenClaw وابدأ أول محادثة لك خلال دقائق.
title: بدء الاستخدام
x-i18n:
    generated_at: "2026-06-28T20:46:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 579ed2b4797dc851b0293b96a4177cc356641b6842fe45c4d48f4e8c224eef75
    source_path: start/getting-started.md
    workflow: 16
---

ثبّت OpenClaw، وشغّل الإعداد الأولي، ودردش مع مساعد الذكاء الاصطناعي لديك — كل ذلك في
نحو 5 دقائق. في النهاية سيكون لديك Gateway قيد التشغيل، ومصادقة مهيأة،
وجلسة دردشة عاملة.

## ما تحتاج إليه

- **Node.js** — يُوصى باستخدام Node 24 (ويدعم أيضًا Node 22.19+)
- **مفتاح API** من موفّر نماذج (Anthropic، OpenAI، Google، إلخ.) — سيطلبه منك الإعداد الأولي

<Tip>
تحقق من إصدار Node لديك باستخدام `node --version`.
**مستخدمو Windows:** تطبيق Windows Hub الأصلي هو أسهل مسار لسطح المكتب. كما أن
مسارات مثبّت PowerShell وGateway عبر WSL2 مدعومة أيضًا. راجع [Windows](/ar/platforms/windows).
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
  alt="عملية سكربت التثبيت"
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
    طرق تثبيت أخرى (Docker، Nix، npm): [التثبيت](/ar/install).
    </Note>

  </Step>
  <Step title="تشغيل الإعداد الأولي">
    ```bash
    openclaw onboard --install-daemon
    ```

    يرشدك المعالج خلال اختيار موفّر نماذج، وتعيين مفتاح API،
    وتهيئة Gateway. لا يستغرق QuickStart عادةً سوى بضع دقائق، لكن
    تسجيل الدخول لدى الموفّر، أو إقران القنوات، أو تثبيت البرنامج الخفي، أو تنزيلات الشبكة، أو Skills،
    أو Plugins الاختيارية قد تجعل الإعداد الأولي الكامل يستغرق وقتًا أطول. يمكنك تخطي الخطوات الاختيارية
    والعودة لاحقًا باستخدام `openclaw configure`.

    راجع [الإعداد الأولي (CLI)](/ar/start/wizard) للاطلاع على المرجع الكامل.

  </Step>
  <Step title="التحقق من أن Gateway قيد التشغيل">
    ```bash
    openclaw gateway status
    ```

    يجب أن ترى أن Gateway يستمع على المنفذ 18789.

  </Step>
  <Step title="فتح لوحة المعلومات">
    ```bash
    openclaw dashboard
    ```

    يفتح هذا Control UI في متصفحك. إذا تم تحميله، فكل شيء يعمل.

  </Step>
  <Step title="إرسال رسالتك الأولى">
    اكتب رسالة في دردشة Control UI، وينبغي أن تحصل على رد من الذكاء الاصطناعي.

    هل تريد الدردشة من هاتفك بدلًا من ذلك؟ أسرع قناة يمكن إعدادها هي
    [Telegram](/ar/channels/telegram) (مجرد رمز بوت). راجع [القنوات](/ar/channels)
    للاطلاع على جميع الخيارات.

  </Step>
</Steps>

<Accordion title="متقدم: تركيب بناء Control UI مخصص">
  إذا كنت تدير بناء لوحة معلومات مترجمًا أو مخصصًا، فاجعل
  `gateway.controlUi.root` يشير إلى دليل يحتوي على الأصول الثابتة
  المبنية و`index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
```

ثم عيّن:

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

## ما الخطوة التالية

<Columns>
  <Card title="ربط قناة" href="/ar/channels" icon="message-square">
    Discord وFeishu وiMessage وMatrix وMicrosoft Teams وSignal وSlack وTelegram وWhatsApp وZalo والمزيد.
  </Card>
  <Card title="الإقران والسلامة" href="/ar/channels/pairing" icon="shield">
    تحكّم في من يستطيع مراسلة وكيلك.
  </Card>
  <Card title="تهيئة Gateway" href="/ar/gateway/configuration" icon="settings">
    النماذج، والأدوات، وبيئة الاختبار المعزولة، والإعدادات المتقدمة.
  </Card>
  <Card title="تصفح الأدوات" href="/ar/tools" icon="wrench">
    المتصفح، وexec، وبحث الويب، وSkills، وPlugins.
  </Card>
</Columns>

<Accordion title="متقدم: متغيرات البيئة">
  إذا كنت تشغّل OpenClaw كحساب خدمة أو تريد مسارات مخصصة:

- `OPENCLAW_HOME` — الدليل الرئيسي لحل المسارات الداخلية
- `OPENCLAW_STATE_DIR` — تجاوز دليل الحالة
- `OPENCLAW_CONFIG_PATH` — تجاوز مسار ملف التهيئة

المرجع الكامل: [متغيرات البيئة](/ar/help/environment).
</Accordion>

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [نظرة عامة على القنوات](/ar/channels)
- [الإعداد](/ar/start/setup)
