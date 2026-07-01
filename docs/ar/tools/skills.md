---
read_when:
    - إضافة Skills أو تعديلها
    - تغيير بوابات Skills أو قوائم السماح أو قواعد التحميل
    - فهم أسبقية Skills وسلوك اللقطات
sidebarTitle: Skills
summary: Skills تعلّم وكيلك كيفية استخدام الأدوات. تعرّف على كيفية تحميلها، وكيف تعمل الأسبقية، وكيفية تكوين التحكّم في الوصول، وقوائم السماح، وحقن البيئة.
title: Skills
x-i18n:
    generated_at: "2026-07-01T08:08:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278a83bcd92e8c24ad0e01ec8fbf462450556493453ca1152e317727be34400
    source_path: tools/skills.md
    workflow: 16
---

Skills هي ملفات تعليمات Markdown تعلّم الوكيل كيف ومتى يستخدم
الأدوات. تعيش كل Skill في دليل يحتوي على ملف `SKILL.md` مع
frontmatter بصيغة YAML ومتن Markdown. يحمّل OpenClaw Skills المضمّنة إضافة إلى أي
تجاوزات محلية، ويرشحها وقت التحميل بناء على البيئة، والإعدادات، ووجود
الملفات الثنائية.

<CardGroup cols={2}>
  <Card title="Creating skills" href="/ar/tools/creating-skills" icon="hammer">
    ابنِ واختبر Skill مخصصة من الصفر.
  </Card>
  <Card title="Skill Workshop" href="/ar/tools/skill-workshop" icon="flask">
    راجع واعتمد مقترحات Skills التي صاغها الوكيل.
  </Card>
  <Card title="Skills config" href="/ar/tools/skills-config" icon="gear">
    مخطط إعدادات `skills.*` الكامل وقوائم السماح للوكلاء.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    تصفح وثبّت Skills المجتمع.
  </Card>
</CardGroup>

## ترتيب التحميل

يحمّل OpenClaw من هذه المصادر، **بأعلى أولوية أولا**. عندما يظهر اسم
Skill نفسه في عدة أماكن، يفوز المصدر الأعلى.

| الأولوية       | المصدر                 | المسار                                  |
| -------------- | ---------------------- | --------------------------------------- |
| 1 — الأعلى     | Workspace skills       | `<workspace>/skills`                    |
| 2              | Project agent skills   | `<workspace>/.agents/skills`            |
| 3              | Personal agent skills  | `~/.agents/skills`                      |
| 4              | Managed / local skills | `~/.openclaw/skills`                    |
| 5              | Bundled skills         | مشحونة مع التثبيت                       |
| 6 — الأدنى     | أدلة إضافية            | `skills.load.extraDirs` + plugin skills |

تدعم جذور Skills التخطيطات المجمعة. يكتشف OpenClaw أي Skill كلما ظهر
`SKILL.md` في أي مكان تحت جذر مضبوط:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

مسار المجلد للتنظيم فقط. يأتي اسم Skill، وأمر الشرطة المائلة، ومفتاح
قائمة السماح كلها من حقل frontmatter المسمى `name` (أو من اسم الدليل
عند غياب `name`).

<Note>
  دليل `$CODEX_HOME/skills` الأصلي في Codex CLI **ليس** جذر Skill في OpenClaw.
  استخدم `openclaw migrate plan codex` لجرد تلك Skills، ثم
  `openclaw migrate codex` لنسخها إلى مساحة عمل OpenClaw لديك.
</Note>

## Skills لكل وكيل مقابل Skills المشتركة

في إعدادات الوكلاء المتعددين، لكل وكيل مساحة عمل خاصة به. استخدم المسار الذي
يطابق مستوى الظهور المطلوب:

| النطاق         | المسار                       | مرئي لـ                       |
| -------------- | ---------------------------- | ----------------------------- |
| لكل وكيل       | `<workspace>/skills`         | ذلك الوكيل فقط                |
| وكيل المشروع   | `<workspace>/.agents/skills` | وكيل مساحة العمل تلك فقط      |
| وكيل شخصي      | `~/.agents/skills`           | كل الوكلاء على هذا الجهاز     |
| مُدار مشترك    | `~/.openclaw/skills`         | كل الوكلاء على هذا الجهاز     |
| أدلة إضافية    | `skills.load.extraDirs`      | كل الوكلاء على هذا الجهاز     |

## قوائم السماح للوكلاء

**موقع** Skill (الأولوية) و**ظهور** Skill (أي وكيل يمكنه استخدامها)
عنصران منفصلان للتحكم. استخدم قوائم السماح لتقييد Skills التي يراها الوكيل،
بغض النظر عن مصدر تحميلها.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Allowlist rules">
    - احذف `agents.defaults.skills` لترك كل Skills غير مقيدة افتراضيا.
    - احذف `agents.list[].skills` لوراثة `agents.defaults.skills`.
    - عيّن `agents.list[].skills: []` لعدم إظهار أي Skills لذلك الوكيل.
    - قائمة `agents.list[].skills` غير الفارغة هي المجموعة **النهائية** — ولا
      تندمج مع الافتراضيات.
    - تنطبق قائمة السماح الفعلية عبر بناء الموجهات، واكتشاف أوامر الشرطة المائلة،
      ومزامنة sandbox، ولقطات Skills.
    - هذا ليس حد تفويض لقشرة المضيف. إذا كان الوكيل نفسه يستطيع
      استخدام `exec`، فقيّد تلك القشرة بشكل منفصل عبر sandboxing، وعزل مستخدم نظام التشغيل،
      وقوائم منع/سماح exec، وبيانات اعتماد لكل مورد.
  </Accordion>
</AccordionGroup>

## Plugins وSkills

يمكن لـ Plugins شحن Skills الخاصة بها عبر إدراج أدلة `skills` في
`openclaw.plugin.json` (مسارات نسبية إلى جذر Plugin). تتحمل Skills الخاصة بـ Plugin
عند تمكين Plugin — على سبيل المثال، يشحن Plugin المتصفح
Skill باسم `browser-automation` للتحكم متعدد الخطوات في المتصفح.

تندمج أدلة Skills الخاصة بـ Plugin في مستوى الأولوية المنخفض نفسه مثل
`skills.load.extraDirs`، لذلك تتجاوزها أي Skill مضمّنة أو مُدارة أو خاصة بوكيل أو بمساحة عمل
لها الاسم نفسه. بوّبها عبر `metadata.openclaw.requires.config` في
إدخال إعدادات Plugin.

راجع [Plugins](/ar/tools/plugin) و[الأدوات](/ar/tools) للاطلاع على نظام Plugins الكامل.

## ورشة Skills

[ورشة Skills](/ar/tools/skill-workshop) هي طابور مقترحات بين الوكيل
وملفات Skills النشطة لديك. عندما يرصد الوكيل عملا قابلا لإعادة الاستخدام، يصوغ
مقترحا بدلا من الكتابة مباشرة إلى `SKILL.md`. تراجعه وتعتمده
قبل أن يتغير أي شيء.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

راجع [ورشة Skills](/ar/tools/skill-workshop) للاطلاع على دورة الحياة الكاملة، ومرجع CLI،
والإعدادات.

## التثبيت من ClawHub

[ClawHub](https://clawhub.ai) هو سجل Skills العام. استخدم أوامر
`openclaw skills` للتثبيت والتحديث، أو CLI `clawhub` للنشر
والمزامنة.

| الإجراء                           | الأمر                                                  |
| --------------------------------- | ------------------------------------------------------ |
| تثبيت Skill في مساحة العمل        | `openclaw skills install @owner/<slug>`                |
| التثبيت من مستودع Git             | `openclaw skills install git:owner/repo@ref`           |
| تثبيت دليل Skill محلي             | `openclaw skills install ./path/to/skill --as my-tool` |
| التثبيت لكل الوكلاء المحليين      | `openclaw skills install @owner/<slug> --global`       |
| تحديث كل Skills مساحة العمل       | `openclaw skills update --all`                         |
| تحديث Skill مشتركة مُدارة         | `openclaw skills update @owner/<slug> --global`        |
| تحديث كل Skills المشتركة المُدارة | `openclaw skills update --all --global`                |
| التحقق من غلاف الثقة الخاص بـ Skill | `openclaw skills verify @owner/<slug>`               |
| طباعة Skill Card المولّدة         | `openclaw skills verify @owner/<slug> --card`          |
| النشر / المزامنة عبر ClawHub CLI  | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Install details">
    يثبّت `openclaw skills install` في دليل `skills/` ضمن مساحة العمل النشطة
    افتراضيا. أضف `--global` للتثبيت في دليل
    `~/.openclaw/skills` المشترك، المرئي لكل الوكلاء المحليين ما لم تضيق
    قوائم سماح الوكلاء ذلك.

    تتوقع تثبيتات Git والتثبيتات المحلية وجود `SKILL.md` في جذر المصدر. يأتي slug
    من frontmatter `name` في `SKILL.md` عندما يكون صالحا، ثم يرجع إلى
    اسم الدليل أو المستودع. استخدم `--as <slug>` للتجاوز.
    يتتبع `openclaw skills update` تثبيتات ClawHub فقط — أعد تثبيت مصادر Git أو
    المصادر المحلية لتحديثها.

  </Accordion>
  <Accordion title="Verification and security scanning">
    يطلب `openclaw skills verify @owner/<slug>` من ClawHub غلاف الثقة
    `clawhub.skill.verify.v1` الخاص بـ Skill. تتحقق Skills المثبتة من ClawHub
    مقابل الإصدار والسجل المسجلين في `.clawhub/origin.json`.
    تبقى slugs المجردة مقبولة لـ Skills المثبتة الحالية أو غير الملتبسة، لكن
    المراجع المؤهلة بالمالك تتجنب غموض الناشر.

    تعرض صفحات Skills في ClawHub أحدث حالة فحص أمني قبل التثبيت،
    مع صفحات تفصيلية لـ VirusTotal، وClawScan، والتحليل الساكن. يخرج
    الأمر بقيمة غير صفرية عندما يضع ClawHub علامة فشل على التحقق. يستعيد الناشرون
    الإيجابيات الكاذبة عبر لوحة تحكم ClawHub أو
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Private archive installs">
    يمكن لعملاء Gateway الذين يحتاجون إلى تسليم غير ClawHub تجهيز أرشيف Skill بصيغة zip
    باستخدام `skills.upload.begin`، و`skills.upload.chunk`، و`skills.upload.commit`،
    ثم التثبيت عبر `skills.install({ source: "upload", ... })`. هذا المسار
    معطل افتراضيا ويتطلب `skills.install.allowUploadedArchives: true` في
    `openclaw.json`. لا تحتاج تثبيتات ClawHub العادية إلى هذا الإعداد أبدا.
  </Accordion>
</AccordionGroup>

## الأمان

<Warning>
  تعامل مع Skills الجهات الخارجية كـ **تعليمات برمجية غير موثوقة**. اقرأها قبل التمكين.
  فضّل التشغيل داخل sandbox للمدخلات غير الموثوقة والأدوات الخطرة. راجع
  [Sandboxing](/ar/gateway/sandboxing) لعناصر التحكم من جهة الوكيل.
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    لا يقبل اكتشاف Skills في مساحة العمل، ووكيل المشروع، والدليل الإضافي إلا جذور Skills
    التي يبقى realpath المحلول لها داخل الجذر المضبوط، ما لم
    يثق `skills.load.allowSymlinkTargets` صراحة بجذر هدف.
    تكتب ورشة Skills عبر تلك الأهداف الموثوقة فقط عندما يكون
    `skills.workshop.allowSymlinkTargetWrites` مفعلا.
    قد يحتوي `~/.openclaw/skills` المُدار و`~/.agents/skills` الشخصي
    على مجلدات Skills مرتبطة رمزيا، لكن يجب أن يبقى realpath لكل `SKILL.md`
    داخل دليل Skill المحلول الخاص به.
  </Accordion>
  <Accordion title="Operator install policy">
    اضبط `security.installPolicy` لتشغيل أمر سياسة محلي موثوق
    قبل متابعة تثبيت Skills. تتلقى السياسة البيانات الوصفية ومسار المصدر المجهز،
    وتنطبق على مسارات ClawHub، والمرفوعة، وGit، والمحلية، والتحديث،
    ومثبت الاعتماديات، وتفشل بإغلاق عندما لا يستطيع الأمر إرجاع
    قرار صالح.
  </Accordion>
  <Accordion title="Secret injection scope">
    يحقن `skills.entries.*.env` و`skills.entries.*.apiKey` الأسرار في
    عملية **المضيف** لدورة ذلك الوكيل فقط — وليس في sandbox. أبقِ
    الأسرار خارج الموجهات والسجلات.
  </Accordion>
</AccordionGroup>

للاطلاع على نموذج التهديد الأوسع وقوائم التحقق الأمنية، راجع
[الأمان](/ar/gateway/security).

## تنسيق SKILL.md

تحتاج كل Skill في الحد الأدنى إلى `name` و`description` في frontmatter:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  يتبع OpenClaw مواصفة [AgentSkills](https://agentskills.io). يدعم
  محلل frontmatter **المفاتيح أحادية السطر فقط** — يجب أن تكون `metadata`
  كائن JSON أحادي السطر. استخدم `{baseDir}` في المتن للإشارة إلى مسار
  مجلد Skill.
</Note>

### مفاتيح frontmatter الاختيارية

<ParamField path="homepage" type="string">
  URL معروض باسم "Website" في واجهة Skills على macOS. مدعوم أيضا عبر
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  عندما تكون `true`، تُعرض Skill كأمر شرطة مائلة يمكن للمستخدم استدعاؤه.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  عندما تكون `true`، يبقي OpenClaw تعليمات Skill خارج الموجه العادي
  للوكيل. تبقى Skill متاحة كأمر شرطة مائلة عندما تكون `user-invocable`
  أيضا `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  عند ضبطها إلى `tool`، يتجاوز أمر الشرطة المائلة النموذج ويرسل
  مباشرة إلى أداة مسجلة.
</ParamField>

<ParamField path="command-tool" type="string">
  اسم الأداة المراد استدعاؤها عند ضبط `command-dispatch: tool`.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  لتوجيه الأدوات، يمرّر سلسلة الوسائط الخام إلى الأداة من دون
  تحليل من النواة. تتلقى الأداة
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## البوابات

يرشّح OpenClaw Skills عند وقت التحميل باستخدام `metadata.openclaw` (JSON بسطر واحد
في بيانات المقدمة). تكون Skill التي لا تحتوي على كتلة `metadata.openclaw` مؤهلة دائمًا
ما لم تُعطّل صراحةً.

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

<ParamField path="always" type="boolean">
  عند `true`، أدرج Skill دائمًا وتجاوز كل البوابات الأخرى.
</ParamField>

<ParamField path="emoji" type="string">
  رمز تعبيري اختياري يظهر في واجهة Skills على macOS.
</ParamField>

<ParamField path="homepage" type="string">
  عنوان URL اختياري يظهر باسم "موقع الويب" في واجهة Skills على macOS.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  مرشح المنصة. عند ضبطه، تكون Skill مؤهلة فقط على أنظمة التشغيل المدرجة.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  يجب أن يوجد كل ملف ثنائي على `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  يجب أن يوجد ملف ثنائي واحد على الأقل على `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  يجب أن يوجد كل متغير بيئة في العملية أو أن يوفَّر عبر الإعدادات.
</ParamField>

<ParamField path="requires.config" type="string[]">
  يجب أن يكون كل مسار `openclaw.json` ذا قيمة truthy.
</ParamField>

<ParamField path="primaryEnv" type="string">
  اسم متغير البيئة المرتبط بـ `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  مواصفات مُثبّت اختيارية تستخدمها واجهة Skills على macOS (brew / node / go / uv / download).
</ParamField>

<Note>
  لا تزال كتل `metadata.clawdbot` القديمة مقبولة عندما تكون
  `metadata.openclaw` غير موجودة، بحيث تحتفظ Skills الأقدم المثبتة
  ببوابات الاعتماد وتلميحات المُثبّت الخاصة بها. يجب أن تستخدم Skills الجديدة
  `metadata.openclaw`.
</Note>

### مواصفات المُثبّت

تخبر مواصفات المُثبّت واجهة Skills على macOS بكيفية تثبيت اعتماد:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="قواعد اختيار المُثبّت">
    - عند إدراج عدة مُثبّتات، يختار Gateway خيارًا مفضّلًا واحدًا
      (brew عند توفره، وإلا node).
    - إذا كانت كل المُثبّتات `download`، يعرض OpenClaw كل إدخال لكي تتمكن من
      رؤية كل القطع الأثرية المتاحة.
    - يمكن أن تتضمن المواصفات `os: ["darwin"|"linux"|"win32"]` للتصفية حسب المنصة.
    - تلتزم عمليات تثبيت Node بـ `skills.install.nodeManager` في `openclaw.json`
      (الافتراضي: npm؛ الخيارات: npm / pnpm / yarn / bun). يؤثر هذا فقط في تثبيت
      Skills؛ يجب أن يظل وقت تشغيل Gateway هو Node.
    - تفضيل مُثبّت Gateway: Homebrew → uv → مدير node المضبوط →
      go → download.
  </Accordion>
  <Accordion title="تفاصيل كل مُثبّت">
    - **Homebrew:** لا يثبّت OpenClaw Homebrew تلقائيًا ولا يترجم صيغ brew
      إلى أوامر حزم النظام. في حاويات Linux التي لا تحتوي على
      `brew`، تُخفى المُثبّتات المعتمدة على brew فقط؛ استخدم صورة مخصصة أو ثبّت
      الاعتماد يدويًا.
    - **Go:** إذا كان `go` مفقودًا وكان `brew` متاحًا، يثبّت Gateway
      Go عبر Homebrew أولًا ويضبط `GOBIN` إلى `bin` الخاص بـ Homebrew.
    - **Download:** `url` (مطلوب)، `archive` (`tar.gz` | `tar.bz2` | `zip`)،
      `extract` (الافتراضي: تلقائي عند اكتشاف أرشيف)، `stripComponents`،
      `targetDir` (الافتراضي: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="ملاحظات العزل">
    يُفحص `requires.bins` على **المضيف** عند وقت تحميل Skill. إذا كان agent
    يعمل في عزل، فيجب أن يوجد الملف الثنائي أيضًا **داخل الحاوية**.
    ثبّته عبر `agents.defaults.sandbox.docker.setupCommand` أو صورة مخصصة.
    يعمل `setupCommand` مرة واحدة بعد إنشاء الحاوية ويتطلب
    خروجًا إلى الشبكة، ونظام ملفات جذر قابلًا للكتابة، ومستخدم root في العزل.
  </Accordion>
</AccordionGroup>

## تجاوزات الإعدادات

بدّل واضبط Skills المضمّنة أو المُدارة ضمن `skills.entries` في
`~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<ParamField path="enabled" type="boolean">
  يعطّل `false` الـ Skill حتى عندما تكون مضمّنة أو مثبتة. Skill المضمّنة `coding-agent`
  اختيارية التفعيل — اضبط `skills.entries.coding-agent.enabled: true`
  وتأكد من أن أحد `claude` أو `codex` أو `opencode` أو CLI آخر مدعوم
  مثبت ومصادق عليه.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  حقل تسهيلي لـ Skills التي تعلن `metadata.openclaw.primaryEnv`.
  يدعم سلسلة نصية صريحة أو كائن SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  متغيرات بيئة تُحقن لتشغيل agent. تُحقن فقط عندما لا يكون
  المتغير مضبوطًا مسبقًا في العملية.
</ParamField>

<ParamField path="config" type="object">
  حاوية اختيارية لحقول الإعدادات المخصصة لكل Skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  قائمة سماح اختيارية لـ Skills **المضمّنة** فقط. عند ضبطها، تكون Skills المضمّنة
  الموجودة في القائمة فقط مؤهلة. لا تتأثر Skills المُدارة وSkills مساحة العمل.
</ParamField>

<Note>
  تطابق مفاتيح الإعدادات **اسم Skill** افتراضيًا. إذا عرّفت Skill
  `metadata.openclaw.skillKey`، فاستخدم ذلك المفتاح ضمن `skills.entries`. ضع
  الأسماء التي تحتوي واصلات بين علامات اقتباس: يسمح JSON5 بالمفاتيح المقتبسة.
</Note>

## حقن البيئة

عندما يبدأ تشغيل agent، يقوم OpenClaw بما يلي:

<Steps>
  <Step title="قراءة بيانات Skill الوصفية">
    يحل OpenClaw قائمة Skills الفعالة للـ agent، مع تطبيق قواعد البوابات
    وقوائم السماح وتجاوزات الإعدادات.
  </Step>
  <Step title="حقن env ومفاتيح API">
    تُطبّق `skills.entries.<key>.env` و `skills.entries.<key>.apiKey` على
    `process.env` طوال مدة التشغيل.
  </Step>
  <Step title="بناء موجه النظام">
    تُجمّع Skills المؤهلة في كتلة XML مضغوطة وتُحقن في
    موجه النظام.
  </Step>
  <Step title="استعادة البيئة">
    بعد انتهاء التشغيل، تُستعاد البيئة الأصلية.
  </Step>
</Steps>

<Warning>
  حقن env محصور في تشغيل agent على **المضيف**، وليس العزل. داخل
  العزل، لا يكون لـ `env` و `apiKey` أي تأثير. راجع
  [إعدادات Skills](/ar/tools/skills-config#sandboxed-skills-and-env-vars) لمعرفة كيفية
  تمرير الأسرار إلى التشغيلات المعزولة.
</Warning>

بالنسبة إلى الواجهة الخلفية المضمّنة `claude-cli`، ينشئ OpenClaw أيضًا لقطة
Skill المؤهلة نفسها كـ Claude Code plugin مؤقت ويمررها عبر
`--plugin-dir`. تستخدم واجهات CLI الخلفية الأخرى كتالوج الموجه فقط.

## اللقطات والتحديث

يلتقط OpenClaw Skills المؤهلة **عند بدء الجلسة** ويعيد استخدام تلك
القائمة لكل الأدوار اللاحقة في الجلسة. تصبح تغييرات Skills أو الإعدادات
سارية في الجلسة الجديدة التالية.

تُحدّث Skills في منتصف الجلسة في حالتين:

- يكتشف مراقب Skills تغييرًا في `SKILL.md`.
- تتصل عقدة بعيدة مؤهلة جديدة.

تُستخدم القائمة المُحدّثة في دور agent التالي. إذا تغيّرت قائمة السماح الفعالة للـ agent،
يحدّث OpenClaw اللقطة للحفاظ على اتساق Skills المرئية.

<AccordionGroup>
  <Accordion title="مراقب Skills">
    افتراضيًا، يراقب OpenClaw مجلدات Skills ويزيد اللقطة عندما
    تتغير ملفات `SKILL.md`. اضبط ذلك ضمن `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true,
          watchDebounceMs: 250,
        },
      },
    }
    ```

    استخدم `allowSymlinkTargets` للتخطيطات المرتبطة رمزيًا عن قصد حيث يشير رابط رمزي
    لجذر Skill إلى خارج الجذر المضبوط، على سبيل المثال
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    فعّل `skills.workshop.allowSymlinkTargetWrites` فقط عندما يجب على Skill Workshop
    تطبيق المقترحات أيضًا عبر تلك المسارات المرتبطة رمزيًا والموثوقة.

  </Accordion>
  <Accordion title="عقد macOS البعيدة (Linux gateway)">
    إذا كان Gateway يعمل على Linux لكن **عقدة macOS** متصلة مع
    السماح بـ `system.run`، يمكن أن يتعامل OpenClaw مع Skills المخصصة لـ macOS فقط كمؤهلة عندما
    تكون الملفات الثنائية المطلوبة موجودة على تلك العقدة. يجب أن يشغّل agent تلك
    Skills عبر أداة `exec` مع `host=node`.

    لا تجعل العقد غير المتصلة Skills البعيدة فقط مرئية. إذا توقفت عقدة عن
    الرد على فحوصات الملفات الثنائية، يمسح OpenClaw مطابقات الملفات الثنائية المخزنة مؤقتًا لها.

  </Accordion>
</AccordionGroup>

## تأثير الرموز

عندما تكون Skills مؤهلة، يحقن OpenClaw كتلة XML مضغوطة في
موجه النظام. التكلفة حتمية:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **العبء الأساسي** (فقط عند وجود ≥ 1 Skill): نحو 195 حرفًا
- **لكل Skill:** نحو 97 حرفًا + أطوال حقول `name` و`description` و`location` لديك
- يوسّع تهريب XML الرموز `& < > " '` إلى كيانات، ما يضيف بضعة أحرف لكل ظهور
- عند نحو 4 أحرف/رمز، 97 حرفًا ≈ 24 رمزًا لكل Skill قبل أطوال الحقول

اجعل الأوصاف قصيرة ووصفية لتقليل عبء الموجه.

## ذات صلة

<CardGroup cols={2}>
  <Card title="إنشاء Skills" href="/ar/tools/creating-skills" icon="hammer">
    دليل خطوة بخطوة لتأليف Skill مخصصة.
  </Card>
  <Card title="Skill Workshop" href="/ar/tools/skill-workshop" icon="flask">
    قائمة انتظار المقترحات لـ Skills التي يصوغها agent.
  </Card>
  <Card title="إعدادات Skills" href="/ar/tools/skills-config" icon="gear">
    مخطط إعدادات `skills.*` الكامل وقوائم السماح للـ agent.
  </Card>
  <Card title="أوامر الشرطة المائلة" href="/ar/tools/slash-commands" icon="terminal">
    كيفية تسجيل أوامر الشرطة المائلة الخاصة بـ Skill وتوجيهها.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    تصفح Skills وانشرها في السجل العام.
  </Card>
  <Card title="Plugins" href="/ar/tools/plugin" icon="plug">
    يمكن أن تشحن Plugins الـ Skills جنبًا إلى جنب مع الأدوات التي توثقها.
  </Card>
</CardGroup>
