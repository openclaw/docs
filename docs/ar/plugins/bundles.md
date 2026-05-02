---
read_when:
    - تريد تثبيت حزمة متوافقة مع Codex أو Claude أو Cursor
    - تحتاج إلى فهم كيفية ربط OpenClaw محتوى الحزمة بالميزات الأصلية
    - أنت تصحح أخطاء اكتشاف الحزمة أو الإمكانات المفقودة
summary: ثبّت واستخدم حِزم Codex وClaude وCursor كـ Plugins في OpenClaw
title: حزم Plugin
x-i18n:
    generated_at: "2026-05-02T07:35:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b949ad70881714a30ab136261441687b439e39b516638ffa052efeab6b75bd4
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw يمكنه تثبيت الحزم من ثلاثة أنظمة بيئية خارجية: **Codex** و**Claude**
و**Cursor**. تُسمى هذه **حزمًا** — وهي حزم محتوى وبيانات وصفية
يربطها OpenClaw بميزات أصلية مثل Skills والخطافات وأدوات MCP.

<Info>
  الحزم **ليست** مثل Plugins OpenClaw الأصلية. تعمل Plugins الأصلية
  داخل العملية ويمكنها تسجيل أي قدرة. الحزم هي حزم محتوى مع
  ربط انتقائي للميزات وحدّ ثقة أضيق.
</Info>

## لماذا توجد الحزم

تُنشر العديد من Plugins المفيدة بتنسيق Codex أو Claude أو Cursor. بدلًا
من مطالبة المؤلفين بإعادة كتابتها كـ Plugins OpenClaw أصلية، يكتشف OpenClaw
هذه التنسيقات ويربط محتواها المدعوم بمجموعة الميزات الأصلية. هذا يعني أنه يمكنك تثبيت حزمة أوامر Claude أو حزمة Skills من Codex
واستخدامها فورًا.

## تثبيت حزمة

<Steps>
  <Step title="التثبيت من دليل أو أرشيف أو سوق">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="التحقق من الاكتشاف">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    تظهر الحزم كـ `Format: bundle` مع نوع فرعي هو `codex` أو `claude` أو `cursor`.

  </Step>

  <Step title="إعادة التشغيل والاستخدام">
    ```bash
    openclaw gateway restart
    ```

    تصبح الميزات المرتبطة (Skills والخطافات وأدوات MCP وافتراضات LSP) متاحة في الجلسة التالية.

  </Step>
</Steps>

## ما الذي يربطه OpenClaw من الحزم

لا تعمل كل ميزة في الحزم داخل OpenClaw اليوم. إليك ما يعمل وما
يُكتشف لكنه لم يُوصَل بعد.

### مدعوم الآن

| الميزة        | كيف تُربط                                                                                   | ينطبق على      |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| محتوى Skills | تُحمّل جذور Skills في الحزمة كـ Skills عادية في OpenClaw                                    | كل التنسيقات   |
| الأوامر       | تُعامل `commands/` و`.cursor/commands/` كجذور Skills                                        | Claude، Cursor |
| حزم الخطافات  | تخطيطات OpenClaw-style لـ `HOOK.md` + `handler.ts`                                          | Codex          |
| أدوات MCP     | يُدمج إعداد MCP الخاص بالحزمة في إعدادات Pi المضمنة؛ وتُحمّل خوادم stdio وHTTP المدعومة     | كل التنسيقات   |
| خوادم LSP     | تُدمج ` .lsp.json` الخاصة بـ Claude و`lspServers` المعلنة في البيان ضمن افتراضات LSP في Pi المضمنة | Claude         |
| الإعدادات     | يُستورد `settings.json` الخاص بـ Claude كافتراضات Pi مضمنة                                  | Claude         |

#### محتوى Skills

- تُحمّل جذور Skills في الحزمة كجذور Skills عادية في OpenClaw
- تُعامل جذور `commands` في Claude كجذور Skills إضافية
- تُعامل جذور `.cursor/commands` في Cursor كجذور Skills إضافية

يعني هذا أن ملفات أوامر Claude بصيغة Markdown تعمل عبر محمّل Skills
العادي في OpenClaw. وتعمل أوامر Cursor بصيغة Markdown عبر المسار نفسه.

#### حزم الخطافات

- تعمل جذور الخطافات في الحزم **فقط** عندما تستخدم تخطيط حزمة الخطافات العادي
  في OpenClaw. اليوم، هذه هي أساسًا الحالة المتوافقة مع Codex:
  - `HOOK.md`
  - `handler.ts` أو `handler.js`

#### MCP لـ Pi

- يمكن للحزم المفعّلة أن تساهم بإعداد خادم MCP
- يدمج OpenClaw إعداد MCP الخاص بالحزمة في إعدادات Pi المضمنة الفعالة باسم
  `mcpServers`
- يتيح OpenClaw أدوات MCP المدعومة من الحزم أثناء دورات وكيل Pi المضمنة عبر
  تشغيل خوادم stdio أو الاتصال بخوادم HTTP
- تتضمن ملفات تعريف الأدوات `coding` و`messaging` أدوات MCP من الحزم
  افتراضيًا؛ استخدم `tools.deny: ["bundle-mcp"]` لإلغاء الاشتراك لوكيل أو Gateway
- تظل إعدادات Pi المحلية للمشروع مطبقة بعد افتراضات الحزمة، لذلك يمكن لإعدادات
  مساحة العمل تجاوز مُدخلات MCP الخاصة بالحزمة عند الحاجة
- تُرتّب فهارس أدوات MCP الخاصة بالحزم ترتيبًا حتميًا قبل التسجيل، حتى لا تؤدي
  تغييرات ترتيب `listTools()` من المصدر إلى اضطراب كتل أدوات ذاكرة التخزين المؤقت للمطالبات

##### وسائل النقل

يمكن لخوادم MCP استخدام نقل stdio أو HTTP:

**Stdio** يشغّل عملية فرعية:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** يتصل بخادم MCP قيد التشغيل عبر `sse` افتراضيًا، أو `streamable-http` عند الطلب:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- يمكن تعيين `transport` إلى `"streamable-http"` أو `"sse"`؛ وعند حذفه، يستخدم OpenClaw `sse`
- `type: "http"` هو شكل لاحق أصلي لـ CLI؛ استخدم `transport: "streamable-http"` في إعداد OpenClaw. يقوم `openclaw mcp set` و`openclaw doctor --fix` بتطبيع الاسم البديل الشائع.
- يُسمح فقط بمخططات URL من نوع `http:` و`https:`
- تدعم قيم `headers` استيفاء `${ENV_VAR}`
- يُرفض مُدخل الخادم الذي يحتوي على كل من `command` و`url`
- تُنقّح بيانات اعتماد URL (معلومات المستخدم ومعاملات الاستعلام) من أوصاف الأدوات
  والسجلات
- يتجاوز `connectionTimeoutMs` مهلة الاتصال الافتراضية البالغة 30 ثانية لكل من
  نقل stdio وHTTP

##### تسمية الأدوات

يسجل OpenClaw أدوات MCP الخاصة بالحزم بأسماء آمنة للمزوّدين على الشكل
`serverName__toolName`. على سبيل المثال، خادم مفتاحه `"vigil-harbor"` ويعرض أداة
`memory_search` يُسجل باسم `vigil-harbor__memory_search`.

- تُستبدل الأحرف خارج `A-Za-z0-9_-` بـ `-`
- تُحد بادئات الخادم بـ 30 حرفًا
- تُحد أسماء الأدوات الكاملة بـ 64 حرفًا
- تعود أسماء الخوادم الفارغة إلى `mcp`
- تُزال الالتباسات بين الأسماء المنقحة المتصادمة باستخدام لواحق رقمية
- يكون ترتيب الأدوات المعروضة النهائي حتميًا حسب الاسم الآمن للحفاظ على استقرار ذاكرة التخزين المؤقت
  في دورات Pi المتكررة
- يعامل ترشيح ملف التعريف كل الأدوات من خادم MCP واحد في الحزمة كأنها مملوكة لـ Plugin
  بواسطة `bundle-mcp`، لذلك يمكن لقوائم السماح والمنع في ملف التعريف تضمين إما
  أسماء أدوات معروضة فردية أو مفتاح Plugin `bundle-mcp`

#### إعدادات Pi المضمنة

- يُستورد `settings.json` الخاص بـ Claude كإعدادات Pi مضمنة افتراضية عندما تكون
  الحزمة مفعّلة
- ينقح OpenClaw مفاتيح تجاوز الصدفة قبل تطبيقها

المفاتيح المنقحة:

- `shellPath`
- `shellCommandPrefix`

#### LSP في Pi المضمنة

- يمكن لحزم Claude المفعّلة أن تساهم بإعداد خادم LSP
- يحمّل OpenClaw ملف `.lsp.json` إضافة إلى أي مسارات `lspServers` معلنة في البيان
- يُدمج إعداد LSP الخاص بالحزمة في افتراضات LSP الفعالة في Pi المضمنة
- لا يمكن تشغيل سوى خوادم LSP المدعومة والمسنودة بـ stdio اليوم؛ أما وسائل النقل غير المدعومة
  فما زالت تظهر في `openclaw plugins inspect <id>`

### مكتشف لكنه غير منفذ

هذه العناصر معروفة وتظهر في التشخيصات، لكن OpenClaw لا يشغلها:

- `agents` و`hooks.json` automation و`outputStyles` في Claude
- `.cursor/agents` و`.cursor/hooks.json` و`.cursor/rules` في Cursor
- بيانات Codex الوصفية المضمنة/الخاصة بالتطبيق بما يتجاوز الإبلاغ عن القدرات

## تنسيقات الحزم

<AccordionGroup>
  <Accordion title="حزم Codex">
    العلامات: `.codex-plugin/plugin.json`

    محتوى اختياري: `skills/`، `hooks/`، `.mcp.json`، `.app.json`

    تتوافق حزم Codex مع OpenClaw بأفضل شكل عندما تستخدم جذور Skills وأدلة
    حزم خطافات OpenClaw-style (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="حزم Claude">
    وضعا اكتشاف:

    - **مستند إلى البيان:** `.claude-plugin/plugin.json`
    - **بلا بيان:** تخطيط Claude الافتراضي (`skills/`، `commands/`، `agents/`، `hooks/`، `.mcp.json`، `.lsp.json`، `settings.json`)

    سلوك خاص بـ Claude:

    - يُعامل `commands/` كمحتوى Skills
    - يُستورد `settings.json` إلى إعدادات Pi المضمنة (تُنقّح مفاتيح تجاوز الصدفة)
    - يعرض `.mcp.json` أدوات stdio المدعومة لـ Pi المضمنة
    - يُحمّل `.lsp.json` إضافة إلى مسارات `lspServers` المعلنة في البيان ضمن افتراضات LSP في Pi المضمنة
    - يُكتشف `hooks/hooks.json` لكنه لا يُنفذ
    - مسارات المكونات المخصصة في البيان إضافية (توسّع الافتراضات ولا تستبدلها)

  </Accordion>

  <Accordion title="حزم Cursor">
    العلامات: `.cursor-plugin/plugin.json`

    محتوى اختياري: `skills/`، `.cursor/commands/`، `.cursor/agents/`، `.cursor/rules/`، `.cursor/hooks.json`، `.mcp.json`

    - يُعامل `.cursor/commands/` كمحتوى Skills
    - تُكتشف `.cursor/rules/` و`.cursor/agents/` و`.cursor/hooks.json` فقط

  </Accordion>
</AccordionGroup>

## أسبقية الاكتشاف

يتحقق OpenClaw أولًا من تنسيق Plugin الأصلي:

1. `openclaw.plugin.json` أو `package.json` صالح يحتوي على `openclaw.extensions` — يُعامل كـ **Plugin أصلي**
2. علامات الحزمة (`.codex-plugin/` أو `.claude-plugin/` أو تخطيط Claude/Cursor الافتراضي) — تُعامل كـ **حزمة**

إذا احتوى دليل على كليهما، يستخدم OpenClaw المسار الأصلي. يمنع هذا
تثبيت الحزم مزدوجة التنسيق جزئيًا كحزم.

## تبعيات وقت التشغيل والتنظيف

- لا تحصل الحزم المتوافقة التابعة لجهات خارجية على إصلاح `npm install` عند بدء التشغيل. يجب
  تثبيتها عبر `openclaw plugins install` وأن تشحن كل ما
  تحتاج إليه داخل دليل Plugin المثبت.
- Plugins الحزم المملوكة لـ OpenClaw إما تُشحن خفيفة داخل النواة أو
  قابلة للتنزيل عبر مثبّت Plugin. لا يشغّل بدء Gateway أبدًا
  مدير حزم لها.
- يزيل `openclaw doctor --fix` أدلة التبعيات المرحلية القديمة ويمكنه
  تثبيت Plugins القابلة للتنزيل والمضبوطة إذا كانت مفقودة من فهرس
  Plugin المحلي.

## الأمان

للحزم حد ثقة أضيق من Plugins الأصلية:

- لا يحمّل OpenClaw وحدات وقت تشغيل عشوائية من الحزم داخل العملية
- يجب أن تبقى مسارات Skills وحزم الخطافات داخل جذر Plugin (مع فحص الحدود)
- تُقرأ ملفات الإعدادات باستخدام فحوص الحدود نفسها
- قد تُشغل خوادم MCP المدعومة عبر stdio كعمليات فرعية

يجعل هذا الحزم أكثر أمانًا افتراضيًا، لكن يجب عليك مع ذلك التعامل مع حزم الجهات الخارجية
كمحتوى موثوق للميزات التي تعرضها.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الحزمة مكتشفة لكن القدرات لا تعمل">
    شغّل `openclaw plugins inspect <id>`. إذا كانت قدرة مدرجة لكنها مميزة بأنها
    غير موصلة، فهذا حد في المنتج — وليس تثبيتًا معطّلًا.
  </Accordion>

  <Accordion title="ملفات أوامر Claude لا تظهر">
    تأكد من أن الحزمة مفعّلة وأن ملفات Markdown موجودة داخل جذر
    `commands/` أو `skills/` مكتشف.
  </Accordion>

  <Accordion title="إعدادات Claude لا تُطبق">
    لا تُدعم سوى إعدادات Pi المضمنة من `settings.json`. لا يعامل OpenClaw
    إعدادات الحزمة كتصحيحات إعداد خامة.
  </Accordion>

  <Accordion title="خطافات Claude لا تُنفذ">
    `hooks/hooks.json` للاكتشاف فقط. إذا كنت تحتاج إلى خطافات قابلة للتشغيل، فاستخدم
    تخطيط حزمة الخطافات في OpenClaw أو اشحن Plugin أصليًا.
  </Accordion>
</AccordionGroup>

## ذات صلة

- [تثبيت Plugins وتكوينها](/ar/tools/plugin)
- [بناء Plugins](/ar/plugins/building-plugins) — إنشاء Plugin أصلي
- [بيان Plugin](/ar/plugins/manifest) — مخطط البيان الأصلي
