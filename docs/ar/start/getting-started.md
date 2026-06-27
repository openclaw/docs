---
read_when:
    - الإعداد لأول مرة من الصفر
    - تريد أسرع مسار إلى دردشة تعمل
summary: ثبّت OpenClaw وابدأ أول محادثة لك خلال دقائق.
title: البدء
x-i18n:
    generated_at: "2026-06-27T18:37:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 769682cfa35a361cc4adc49f010fed18cf897ce66e1404d07b631e4dede64de8
    source_path: start/getting-started.md
    workflow: 16
---

ثبّت OpenClaw، وشغّل الإعداد الأولي، ودردش مع مساعد الذكاء الاصطناعي الخاص بك — كل ذلك في
نحو 5 دقائق. بحلول النهاية سيكون لديك Gateway يعمل، ومصادقة مهيأة،
وجلسة دردشة عاملة.

## ما تحتاج إليه

- **Node.js** — يوصى باستخدام Node 24 (Node 22.19+ مدعوم أيضًا)
- **مفتاح API** من مزود نماذج (Anthropic، OpenAI، Google، وغير ذلك) — سيطلبه منك الإعداد الأولي

<Tip>
تحقق من إصدار Node لديك باستخدام `node --version`.
**مستخدمو Windows:** تطبيق Hub الأصلي على Windows هو أسهل مسار لسطح المكتب. كما أن
مسارات مثبّت PowerShell وGateway عبر WSL2 مدعومة أيضًا. راجع [Windows](/ar/platforms/windows).
تحتاج إلى تثبيت Node؟ راجع [إعداد Node](/ar/install/node).
</Tip>

## الإعداد السريع

<Steps>
  <Step title="ثبّت OpenClaw">
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
    طرق التثبيت الأخرى (Docker، Nix، npm): [التثبيت](/ar/install).
    </Note>

  </Step>
  <Step title="شغّل الإعداد الأولي">
    ```bash
    openclaw onboard --install-daemon
    ```

    يرشدك المعالج خلال اختيار مزود نماذج، وتعيين مفتاح API،
    وتهيئة Gateway. يستغرق ذلك نحو دقيقتين.

    راجع [الإعداد الأولي (CLI)](/ar/start/wizard) للمرجع الكامل.

  </Step>
  <Step title="تحقق من أن Gateway يعمل">
    ```bash
    openclaw gateway status
    ```

    يجب أن ترى Gateway يستمع على المنفذ 18789.

  </Step>
  <Step title="افتح لوحة المعلومات">
    ```bash
    openclaw dashboard
    ```

    يفتح هذا واجهة التحكم في متصفحك. إذا تم تحميلها، فكل شيء يعمل.

  </Step>
  <Step title="أرسل رسالتك الأولى">
    اكتب رسالة في دردشة واجهة التحكم ويجب أن تحصل على رد من الذكاء الاصطناعي.

    تريد الدردشة من هاتفك بدلًا من ذلك؟ أسرع قناة يمكن إعدادها هي
    [Telegram](/ar/channels/telegram) (تحتاج فقط إلى رمز بوت). راجع [القنوات](/ar/channels)
    لكل الخيارات.

  </Step>
</Steps>

<Accordion title="متقدم: تحميل بناء مخصص لواجهة التحكم">
  إذا كنت تحتفظ ببناء لوحة معلومات مترجم أو مخصص، فوجّه
  `gateway.controlUi.root` إلى دليل يحتوي على الأصول الثابتة المبنية
  و`index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
```

ثم اضبط:

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

أعد تشغيل Gateway ثم افتح لوحة المعلومات مرة أخرى:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## ما التالي

<Columns>
  <Card title="وصل قناة" href="/ar/channels" icon="message-square">
    Discord، Feishu، iMessage، Matrix، Microsoft Teams، Signal، Slack، Telegram، WhatsApp، Zalo، والمزيد.
  </Card>
  <Card title="الإقران والسلامة" href="/ar/channels/pairing" icon="shield">
    تحكم في من يمكنه مراسلة وكيلك.
  </Card>
  <Card title="هيّئ Gateway" href="/ar/gateway/configuration" icon="settings">
    النماذج، والأدوات، وبيئة العزل، والإعدادات المتقدمة.
  </Card>
  <Card title="تصفح الأدوات" href="/ar/tools" icon="wrench">
    المتصفح، وexec، وبحث الويب، وSkills، وPlugins.
  </Card>
</Columns>

<Accordion title="متقدم: متغيرات البيئة">
  إذا كنت تشغّل OpenClaw كحساب خدمة أو تريد مسارات مخصصة:

- `OPENCLAW_HOME` — دليل المنزل لحل المسارات الداخلية
- `OPENCLAW_STATE_DIR` — تجاوز دليل الحالة
- `OPENCLAW_CONFIG_PATH` — تجاوز مسار ملف الإعدادات

المرجع الكامل: [متغيرات البيئة](/ar/help/environment).
</Accordion>

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [نظرة عامة على القنوات](/ar/channels)
- [الإعداد](/ar/start/setup)
