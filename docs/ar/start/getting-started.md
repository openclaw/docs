---
read_when:
    - الإعداد الأولي لأول مرة من الصفر
    - تريد أسرع طريق إلى دردشة تعمل بالفعل
summary: ثبّت OpenClaw وشغّل أول دردشة لك خلال دقائق.
title: البدء
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T08:05:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe3f92b1464ebf0a5b631c293fa4a3e4b686fdb35c1152663428025dd3c01259
    source_path: start/getting-started.md
    workflow: 15
---

ثبّت OpenClaw، وشغّل الإعداد الأولي، وابدأ الدردشة مع مساعدك الذكي — كل ذلك
في نحو 5 دقائق. وبحلول النهاية سيكون لديك Gateway قيد التشغيل، ومصادقة
مهيأة، وجلسة دردشة تعمل.

## ما الذي تحتاج إليه

- **Node.js** — يوصى باستخدام Node 24 ‏(ويدعم أيضًا Node 22.14+)
- **مفتاح API** من أحد موفّري النماذج (Anthropic أو OpenAI أو Google وغيرها) — سيطلبه الإعداد الأولي

<Tip>
تحقق من إصدار Node لديك باستخدام `node --version`.
**لمستخدمي Windows:** كل من Windows الأصلي وWSL2 مدعومان. ويعد WSL2 أكثر
استقرارًا ويوصى به للحصول على التجربة الكاملة. راجع [Windows](/ar/platforms/windows).
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
  alt="Install Script Process"
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
    طرق التثبيت الأخرى (Docker وNix وnpm): ‏[التثبيت](/ar/install).
    </Note>

  </Step>
  <Step title="شغّل الإعداد الأولي">
    ```bash
    openclaw onboard --install-daemon
    ```

    يرشدك المعالج خلال اختيار موفّر نموذج، وتعيين مفتاح API،
    وتهيئة Gateway. ويستغرق ذلك نحو دقيقتين.

    راجع [الإعداد الأولي (CLI)](/ar/start/wizard) للحصول على المرجع الكامل.

  </Step>
  <Step title="تحقق من أن Gateway يعمل">
    ```bash
    openclaw gateway status
    ```

    يجب أن ترى أن Gateway يستمع على المنفذ 18789.

  </Step>
  <Step title="افتح لوحة المعلومات">
    ```bash
    openclaw dashboard
    ```

    سيؤدي هذا إلى فتح Control UI في المتصفح لديك. وإذا تم تحميلها، فكل شيء يعمل.

  </Step>
  <Step title="أرسل رسالتك الأولى">
    اكتب رسالة في دردشة Control UI ويجب أن تتلقى ردًا من الذكاء الاصطناعي.

    هل تريد الدردشة من هاتفك بدلًا من ذلك؟ أسرع قناة يمكن إعدادها هي
    [Telegram](/ar/channels/telegram) (فقط رمز bot مميز). راجع [القنوات](/ar/channels)
    للاطلاع على جميع الخيارات.

  </Step>
</Steps>

<Accordion title="متقدم: ربط نسخة مخصصة من Control UI">
  إذا كنت تدير نسخة مترجمة أو مخصصة من لوحة المعلومات، فاجعل
  `gateway.controlUi.root` يشير إلى دليل يحتوي على الأصول الثابتة المبنية
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

أعد تشغيل gateway ثم أعد فتح لوحة المعلومات:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## ما الذي ينبغي فعله بعد ذلك

<Columns>
  <Card title="اربط قناة" href="/ar/channels" icon="message-square">
    Discord وFeishu وiMessage وMatrix وMicrosoft Teams وSignal وSlack وTelegram وWhatsApp وZalo وغير ذلك.
  </Card>
  <Card title="الإقران والأمان" href="/ar/channels/pairing" icon="shield">
    تحكم في من يمكنه مراسلة الوكيل الخاص بك.
  </Card>
  <Card title="هيئ Gateway" href="/ar/gateway/configuration" icon="settings">
    النماذج، والأدوات، وsandbox، والإعدادات المتقدمة.
  </Card>
  <Card title="تصفح الأدوات" href="/ar/tools" icon="wrench">
    المتصفح، وexec، والبحث على الويب، وSkills، وPlugins.
  </Card>
</Columns>

<Accordion title="متقدم: متغيرات البيئة">
  إذا كنت تشغّل OpenClaw كحساب خدمة أو تريد مسارات مخصصة:

- `OPENCLAW_HOME` — الدليل الرئيسي لحل المسارات الداخلية
- `OPENCLAW_STATE_DIR` — تجاوز دليل الحالة
- `OPENCLAW_CONFIG_PATH` — تجاوز مسار ملف التهيئة

المرجع الكامل: [متغيرات البيئة](/ar/help/environment).
</Accordion>

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [نظرة عامة على القنوات](/ar/channels)
- [الإعداد](/ar/start/setup)
