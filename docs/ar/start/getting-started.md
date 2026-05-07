---
read_when:
    - الإعداد لأول مرة من الصفر
    - تريد أسرع مسار للوصول إلى دردشة تعمل
summary: ثبّت OpenClaw وابدأ أول محادثة لك خلال دقائق.
title: بدء الاستخدام
x-i18n:
    generated_at: "2026-05-07T13:29:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 295ce8fd03320027a77a3aef494f785f0fe58e0f57c72ee63f6f9aca68626c20
    source_path: start/getting-started.md
    workflow: 16
---

ثبّت OpenClaw، وشغّل الإعداد الأولي، وتحدث مع مساعد الذكاء الاصطناعي الخاص بك — كل ذلك في
نحو 5 دقائق. في النهاية سيكون لديك Gateway قيد التشغيل، ومصادقة مهيّأة،
وجلسة دردشة عاملة.

## ما تحتاجه

- **Node.js** — يُوصى باستخدام Node 24 (Node 22.16+ مدعوم أيضًا)
- **مفتاح API** من مزوّد نماذج (Anthropic أو OpenAI أو Google أو غيرها) — سيطلبه منك الإعداد الأولي

<Tip>
تحقق من إصدار Node لديك باستخدام `node --version`.
**مستخدمو Windows:** كل من Windows الأصلي وWSL2 مدعومان. WSL2 أكثر
استقرارًا ويُوصى به للتجربة الكاملة. راجع [Windows](/ar/platforms/windows).
هل تحتاج إلى تثبيت Node؟ راجع [إعداد Node](/ar/install/node).
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
    طرق تثبيت أخرى (Docker وNix وnpm): [التثبيت](/ar/install).
    </Note>

  </Step>
  <Step title="شغّل الإعداد الأولي">
    ```bash
    openclaw onboard --install-daemon
    ```

    يرشدك المعالج خلال اختيار مزوّد نماذج، وتعيين مفتاح API،
    وتهيئة Gateway. يستغرق ذلك نحو دقيقتين.

    راجع [الإعداد الأولي (CLI)](/ar/start/wizard) للاطلاع على المرجع الكامل.

  </Step>
  <Step title="تحقق من أن Gateway قيد التشغيل">
    ```bash
    openclaw gateway status
    ```

    ينبغي أن ترى Gateway يستمع على المنفذ 18789.

  </Step>
  <Step title="افتح لوحة التحكم">
    ```bash
    openclaw dashboard
    ```

    يفتح هذا واجهة التحكم في متصفحك. إذا تم تحميلها، فكل شيء يعمل.

  </Step>
  <Step title="أرسل رسالتك الأولى">
    اكتب رسالة في دردشة واجهة التحكم، وينبغي أن تتلقى ردًا من الذكاء الاصطناعي.

    هل تريد الدردشة من هاتفك بدلًا من ذلك؟ أسرع قناة يمكن إعدادها هي
    [Telegram](/ar/channels/telegram) (مجرد رمز بوت). راجع [القنوات](/ar/channels)
    للاطلاع على كل الخيارات.

  </Step>
</Steps>

<Accordion title="متقدم: تثبيت إصدار مخصص من واجهة التحكم">
  إذا كنت تدير إصدارًا مترجمًا أو مخصصًا من لوحة التحكم، فاجعل
  `gateway.controlUi.root` يشير إلى دليل يحتوي على الأصول الثابتة
  المبنية لديك و`index.html`.

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

أعد تشغيل Gateway وافتح لوحة التحكم من جديد:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## ما الخطوة التالية

<Columns>
  <Card title="وصّل قناة" href="/ar/channels" icon="message-square">
    Discord وFeishu وiMessage وMatrix وMicrosoft Teams وSignal وSlack وTelegram وWhatsApp وZalo والمزيد.
  </Card>
  <Card title="الاقتران والسلامة" href="/ar/channels/pairing" icon="shield">
    تحكّم في من يمكنه مراسلة وكيلك.
  </Card>
  <Card title="هيّئ Gateway" href="/ar/gateway/configuration" icon="settings">
    النماذج والأدوات وبيئة العزل والإعدادات المتقدمة.
  </Card>
  <Card title="تصفّح الأدوات" href="/ar/tools" icon="wrench">
    المتصفح وexec وبحث الويب وSkills وPlugins.
  </Card>
</Columns>

<Accordion title="متقدم: متغيرات البيئة">
  إذا كنت تشغّل OpenClaw كحساب خدمة أو تريد مسارات مخصصة:

- `OPENCLAW_HOME` — الدليل الرئيسي لحلّ المسارات الداخلية
- `OPENCLAW_STATE_DIR` — تجاوز دليل الحالة
- `OPENCLAW_CONFIG_PATH` — تجاوز مسار ملف الإعدادات

المرجع الكامل: [متغيرات البيئة](/ar/help/environment).
</Accordion>

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [نظرة عامة على القنوات](/ar/channels)
- [الإعداد](/ar/start/setup)
