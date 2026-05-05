---
read_when:
    - تريد تثبيت حزمة متوافقة مع Codex أو Claude أو Cursor
    - تحتاج إلى فهم كيفية قيام OpenClaw بربط محتوى الحزمة بالميزات الأصلية
    - تعمل على تصحيح أخطاء اكتشاف الحزمة أو القدرات المفقودة
summary: ثبّت واستخدم حزم Codex وClaude وCursor بوصفها Plugins لـ OpenClaw
title: حزم Plugin
x-i18n:
    generated_at: "2026-05-05T01:48:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bc06300e765e2faaf51800462003e242d29d4102ac9feaa47f86d4ad35bf157
    source_path: plugins/bundles.md
    workflow: 16
---

يمكن لـ OpenClaw تثبيت الحزم من ثلاثة أنظمة بيئية خارجية: **Codex**، **Claude**،
و**Cursor**. تُسمى هذه **حزمًا** — وهي حزم محتوى وبيانات وصفية
يربطها OpenClaw بميزات أصلية مثل Skills والخطّافات وأدوات MCP.

<Info>
  الحزم **ليست** مثل Plugins OpenClaw الأصلية. تعمل Plugins الأصلية
  داخل العملية ويمكنها تسجيل أي قدرة. الحزم هي حزم محتوى ذات
  ربط انتقائي للميزات وحدّ ثقة أضيق.
</Info>

## لماذا توجد الحزم

تُنشر كثير من Plugins المفيدة بتنسيق Codex أو Claude أو Cursor. بدلًا
من مطالبة المؤلفين بإعادة كتابتها كـ Plugins أصلية في OpenClaw، يكتشف OpenClaw
هذه التنسيقات ويربط محتواها المدعوم بمجموعة الميزات الأصلية. يعني هذا أنه يمكنك
تثبيت حزمة أوامر Claude أو حزمة Skills من Codex واستخدامها فورًا.

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

    تظهر الحزم على أنها `Format: bundle` مع نوع فرعي هو `codex` أو `claude` أو `cursor`.

  </Step>

  <Step title="إعادة التشغيل والاستخدام">
    ```bash
    openclaw gateway restart
    ```

    تصبح الميزات المرتبطة (Skills، والخطّافات، وأدوات MCP، وافتراضيات LSP) متاحة في الجلسة التالية.

  </Step>
</Steps>

## ما يربطه OpenClaw من الحزم

لا تعمل كل ميزات الحزم في OpenClaw اليوم. إليك ما يعمل وما
يُكتشف لكنه غير موصول بعد.

### مدعوم الآن

| الميزة        | كيفية ربطها                                                                                 | ينطبق على      |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| محتوى Skills  | تُحمَّل جذور Skills في الحزمة كـ Skills عادية في OpenClaw                                  | كل التنسيقات   |
| الأوامر       | تُعامَل `commands/` و`.cursor/commands/` كجذور Skills                                      | Claude, Cursor |
| حزم الخطّافات | تخطيطات `HOOK.md` + `handler.ts` بنمط OpenClaw                                             | Codex          |
| أدوات MCP     | يُدمج إعداد MCP للحزمة في إعدادات Pi المضمّنة؛ وتُحمَّل خوادم stdio وHTTP المدعومة         | كل التنسيقات   |
| خوادم LSP     | تُدمج `.lsp.json` الخاصة بـ Claude و`lspServers` المعلنة في البيان في افتراضيات LSP لـ Pi المضمّن | Claude         |
| الإعدادات     | يُستورد `settings.json` الخاص بـ Claude كافتراضات Pi المضمّنة                              | Claude         |

#### محتوى Skills

- تُحمَّل جذور Skills في الحزمة كجذور Skills عادية في OpenClaw
- تُعامَل جذور `commands` الخاصة بـ Claude كجذور Skills إضافية
- تُعامَل جذور `.cursor/commands` الخاصة بـ Cursor كجذور Skills إضافية

يعني هذا أن ملفات أوامر Markdown الخاصة بـ Claude تعمل عبر محمّل Skills
العادي في OpenClaw. وتعمل أوامر Markdown الخاصة بـ Cursor عبر المسار نفسه.

#### حزم الخطّافات

- تعمل جذور الخطّافات في الحزمة **فقط** عندما تستخدم تخطيط حزمة الخطّافات
  العادي في OpenClaw. اليوم، هذه هي أساسًا الحالة المتوافقة مع Codex:
  - `HOOK.md`
  - `handler.ts` أو `handler.js`

#### MCP لـ Pi

- يمكن للحزم المفعّلة أن تساهم بإعدادات خادم MCP
- يدمج OpenClaw إعداد MCP للحزمة في إعدادات Pi المضمّنة الفعلية باسم
  `mcpServers`
- يعرض OpenClaw أدوات MCP المدعومة من الحزمة أثناء دورات وكيل Pi المضمّن عبر
  تشغيل خوادم stdio أو الاتصال بخوادم HTTP
- تتضمن ملفات تعريف الأدوات `coding` و`messaging` أدوات MCP الخاصة بالحزم
  افتراضيًا؛ استخدم `tools.deny: ["bundle-mcp"]` لاستبعاد ذلك لوكيل أو Gateway
- تظل إعدادات Pi المحلية للمشروع مطبقة بعد افتراضات الحزمة، لذلك يمكن لإعدادات
  مساحة العمل تجاوز إدخالات MCP الخاصة بالحزمة عند الحاجة
- تُفرز فهارس أدوات MCP الخاصة بالحزم بشكل حتمي قبل التسجيل، بحيث لا تؤدي
  تغييرات ترتيب `listTools()` من المنبع إلى اضطراب كتل أدوات ذاكرة التخزين المؤقت للموجهات

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

يتصل **HTTP** بخادم MCP قيد التشغيل عبر `sse` افتراضيًا، أو عبر `streamable-http` عند طلب ذلك:

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

- يمكن ضبط `transport` على `"streamable-http"` أو `"sse"`؛ عند حذفه، يستخدم OpenClaw `sse`
- `type: "http"` صيغة لاحقة أصلية لـ CLI؛ استخدم `transport: "streamable-http"` في إعداد OpenClaw. يطبّع `openclaw mcp set` و`openclaw doctor --fix` الاسم البديل الشائع.
- يُسمح فقط بمخططات URL من نوع `http:` و`https:`
- تدعم قيم `headers` استيفاء `${ENV_VAR}`
- يُرفض إدخال الخادم الذي يحتوي على كل من `command` و`url`
- تُحجب بيانات اعتماد URL (معلومات المستخدم ومعلمات الاستعلام) من أوصاف الأدوات
  والسجلات
- يتجاوز `connectionTimeoutMs` مهلة الاتصال الافتراضية البالغة 30 ثانية لكل من
  وسائل نقل stdio وHTTP

##### تسمية الأدوات

يسجل OpenClaw أدوات MCP الخاصة بالحزم بأسماء آمنة للمزوّد بالشكل
`serverName__toolName`. على سبيل المثال، يُسجَّل خادم مفتاحه `"vigil-harbor"` ويعرض أداة
`memory_search` باسم `vigil-harbor__memory_search`.

- تُستبدل الأحرف خارج `A-Za-z0-9_-` بـ `-`
- تُحدّ بادئات الخادم بـ 30 حرفًا
- تُحدّ أسماء الأدوات الكاملة بـ 64 حرفًا
- تعود أسماء الخوادم الفارغة إلى `mcp`
- تُميز الأسماء المنظّفة المتصادمة بلاحقات رقمية
- يكون ترتيب الأدوات النهائي المعروض حتميًا حسب الاسم الآمن لإبقاء دورات Pi
  المتكررة مستقرة للذاكرة المؤقتة
- يعامل ترشيح ملفات التعريف كل الأدوات من خادم MCP واحد في الحزمة على أنها مملوكة
  لـ Plugin بواسطة `bundle-mcp`، لذلك يمكن أن تتضمن قوائم السماح والحظر في ملف التعريف
  أسماء أدوات معروضة فردية أو مفتاح Plugin `bundle-mcp`

#### إعدادات Pi المضمّنة

- يُستورد `settings.json` الخاص بـ Claude كإعدادات Pi مضمّنة افتراضية عندما تكون
  الحزمة مفعّلة
- ينظّف OpenClaw مفاتيح تجاوز الصدفة قبل تطبيقها

المفاتيح المنظّفة:

- `shellPath`
- `shellCommandPrefix`

#### LSP لـ Pi المضمّن

- يمكن لحزم Claude المفعّلة أن تساهم بإعدادات خادم LSP
- يحمّل OpenClaw `.lsp.json` بالإضافة إلى أي مسارات `lspServers` معلنة في البيان
- يُدمج إعداد LSP للحزمة في افتراضيات LSP الفعلية لـ Pi المضمّن
- وحدها خوادم LSP المدعومة بالـ stdio قابلة للتشغيل اليوم؛ أما وسائل النقل غير المدعومة
  فلا تزال تظهر في `openclaw plugins inspect <id>`

### مكتشفة لكنها غير منفّذة

هذه العناصر معروفة وتظهر في التشخيصات، لكن OpenClaw لا يشغّلها:

- `agents` الخاصة بـ Claude، وأتمتة `hooks.json`، و`outputStyles`
- `.cursor/agents` و`.cursor/hooks.json` و`.cursor/rules` الخاصة بـ Cursor
- بيانات Codex الوصفية المضمنة/الخاصة بالتطبيق بما يتجاوز الإبلاغ عن القدرات

## تنسيقات الحزم

<AccordionGroup>
  <Accordion title="حزم Codex">
    العلامات: `.codex-plugin/plugin.json`

    المحتوى الاختياري: `skills/`، و`hooks/`، و`.mcp.json`، و`.app.json`

    تلائم حزم Codex OpenClaw بأفضل شكل عندما تستخدم جذور Skills وأدلة حزم خطّافات
    بنمط OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="حزم Claude">
    وضعا اكتشاف:

    - **مستند إلى البيان:** `.claude-plugin/plugin.json`
    - **بلا بيان:** تخطيط Claude الافتراضي (`skills/`، و`commands/`، و`agents/`، و`hooks/`، و`.mcp.json`، و`.lsp.json`، و`settings.json`)

    سلوك خاص بـ Claude:

    - يُعامَل `commands/` كمحتوى Skills
    - يُستورد `settings.json` إلى إعدادات Pi المضمّنة (تُنظَّف مفاتيح تجاوز الصدفة)
    - تعرض `.mcp.json` أدوات stdio المدعومة لـ Pi المضمّن
    - تُحمَّل `.lsp.json` بالإضافة إلى مسارات `lspServers` المعلنة في البيان إلى افتراضيات LSP لـ Pi المضمّن
    - يُكتشف `hooks/hooks.json` لكنه لا يُنفّذ
    - مسارات المكوّنات المخصصة في البيان إضافية (توسّع الافتراضات، ولا تستبدلها)

  </Accordion>

  <Accordion title="حزم Cursor">
    العلامات: `.cursor-plugin/plugin.json`

    المحتوى الاختياري: `skills/`، و`.cursor/commands/`، و`.cursor/agents/`، و`.cursor/rules/`، و`.cursor/hooks.json`، و`.mcp.json`

    - يُعامَل `.cursor/commands/` كمحتوى Skills
    - `.cursor/rules/` و`.cursor/agents/` و`.cursor/hooks.json` للاكتشاف فقط

  </Accordion>
</AccordionGroup>

## أسبقية الاكتشاف

يتحقق OpenClaw أولًا من تنسيق Plugin الأصلي:

1. `openclaw.plugin.json` أو `package.json` صالح يحتوي على `openclaw.extensions` — يُعامل على أنه **Plugin أصلي**
2. علامات الحزمة (`.codex-plugin/` أو `.claude-plugin/` أو تخطيط Claude/Cursor الافتراضي) — تُعامل على أنها **حزمة**

إذا احتوى دليل على كليهما، يستخدم OpenClaw المسار الأصلي. يمنع هذا
تثبيت الحزم ثنائية التنسيق جزئيًا كحزم.

## اعتماديات وقت التشغيل والتنظيف

- لا تحصل الحزم المتوافقة التابعة لجهات خارجية على إصلاح `npm install` عند بدء التشغيل. يجب
  تثبيتها عبر `openclaw plugins install` وأن تشحن كل ما تحتاجه
  داخل دليل Plugin المثبّت.
- تكون Plugins المجمّعة المملوكة لـ OpenClaw إما مشحونة بخفة في النواة أو
  قابلة للتنزيل عبر مثبّت Plugin. لا يشغّل بدء تشغيل Gateway أبدًا
  مدير حزم من أجلها.
- يزيل `openclaw doctor --fix` أدلة الاعتماديات المرحلية القديمة ويمكنه
  استرداد Plugins القابلة للتنزيل التي تكون مفقودة من فهرس Plugin المحلي عندما
  تشير إليها الإعدادات.

## الأمان

للحزم حد ثقة أضيق من Plugins الأصلية:

- لا يحمّل OpenClaw وحدات وقت تشغيل عشوائية للحزمة داخل العملية
- يجب أن تبقى مسارات Skills وحزم الخطّافات داخل جذر Plugin (مع التحقق من الحدود)
- تُقرأ ملفات الإعدادات باستخدام فحوص الحدود نفسها
- قد تُشغَّل خوادم MCP المدعومة بـ stdio كعمليات فرعية

يجعل هذا الحزم أكثر أمانًا افتراضيًا، لكن يجب أن تظل تتعامل مع حزم الجهات الخارجية
كمحتوى موثوق للميزات التي تعرضها فعلًا.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="تم اكتشاف الحزمة لكن القدرات لا تعمل">
    شغّل `openclaw plugins inspect <id>`. إذا كانت القدرة مدرجة لكنها مميّزة بأنها
    غير موصولة، فهذا قيد في المنتج — وليس تثبيتًا معطّلًا.
  </Accordion>

  <Accordion title="ملفات أوامر Claude لا تظهر">
    تأكد من أن الحزمة مفعّلة وأن ملفات Markdown موجودة داخل جذر
    `commands/` أو `skills/` مكتشف.
  </Accordion>

  <Accordion title="إعدادات Claude لا تُطبق">
    لا تُدعم إلا إعدادات Pi المضمّنة من `settings.json`. لا يتعامل OpenClaw
    مع إعدادات الحزمة كتصحيحات إعداد خام.
  </Accordion>

  <Accordion title="خطّافات Claude لا تُنفّذ">
    `hooks/hooks.json` للاكتشاف فقط. إذا كنت تحتاج إلى خطّافات قابلة للتشغيل، فاستخدم
    تخطيط حزمة خطّافات OpenClaw أو اشحن Plugin أصليًا.
  </Accordion>
</AccordionGroup>

## ذات صلة

- [تثبيت Plugins وتكوينها](/ar/tools/plugin)
- [بناء Plugins](/ar/plugins/building-plugins) — إنشاء Plugin أصلي
- [بيان Plugin](/ar/plugins/manifest) — مخطط البيان الأصلي
