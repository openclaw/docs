---
read_when:
    - تريد تثبيت حزمة متوافقة مع Codex أو Claude أو Cursor
    - تحتاج إلى فهم كيفية تحويل OpenClaw لمحتوى الحزمة إلى ميزات أصلية
    - أنت تصحح أخطاء اكتشاف الحزمة أو الإمكانات المفقودة
summary: ثبّت حزم Codex وClaude وCursor واستخدمها بوصفها إضافات OpenClaw
title: حِزم Plugin
x-i18n:
    generated_at: "2026-07-12T06:12:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d44006866238f53ee2e3e8126cc4f7ed6f7413534257775f7904c9b877778c59
    source_path: plugins/bundles.md
    workflow: 16
---

يمكن لـ OpenClaw تثبيت إضافات من ثلاثة أنظمة بيئية خارجية: **Codex** و**Claude**
و**Cursor**. وتُسمى هذه **حزمًا**، وهي حزم من المحتوى والبيانات الوصفية
يحوّلها OpenClaw إلى ميزات أصلية مثل Skills والخطافات وأدوات MCP.

<Info>
  **الحزم** ليست مماثلة لإضافات OpenClaw الأصلية. تعمل الإضافات الأصلية
  داخل العملية ويمكنها تسجيل أي قدرة. أما الحزم فهي حزم محتوى ذات
  ربط انتقائي للميزات وحدود ثقة أضيق.
</Info>

## سبب وجود الحزم

تُنشر إضافات مفيدة عديدة بتنسيق Codex أو Claude أو Cursor. وبدلًا
من مطالبة المؤلفين بإعادة كتابتها كإضافات OpenClaw أصلية، يكتشف OpenClaw
هذه التنسيقات ويحوّل محتواها المدعوم إلى مجموعة الميزات الأصلية.
يمكنك تثبيت حزمة أوامر Claude أو حزمة Skills من Codex واستخدامها فورًا.

## تثبيت حزمة

<Steps>
  <Step title="Install from a directory, archive, or marketplace">
    ```bash
    # دليل محلي
    openclaw plugins install ./my-bundle

    # أرشيف
    openclaw plugins install ./my-bundle.tgz

    # سوق Claude
    openclaw plugins marketplace list <source>
    openclaw plugins install <plugin> --marketplace <source>
    ```

    `<source>` هو مسار أو مستودع سوق محلي، أو مصدر git/GitHub.

  </Step>

  <Step title="Verify detection">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    تعرض الحزم `Format: bundle` بالإضافة إلى قيمة `Bundle format:` تساوي `codex`
    أو `claude` أو `cursor`.

  </Step>

  <Step title="Restart and use">
    ```bash
    openclaw gateway restart
    ```

    تصبح الميزات المحوّلة (Skills والخطافات وأدوات MCP وإعدادات LSP الافتراضية) متاحة في الجلسة التالية.

  </Step>
</Steps>

## ما يحوّله OpenClaw من الحزم

لا تعمل جميع ميزات الحزم في OpenClaw حاليًا. فيما يلي ما يعمل وما
يُكتشف ولكن لم يُوصّل بعد.

### المدعوم حاليًا

| الميزة        | كيفية تحويلها                                                                                     | ينطبق على      |
| ------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| محتوى Skills | تُحمّل جذور Skills في الحزمة كجذور Skills عادية في OpenClaw                                      | جميع التنسيقات |
| الأوامر       | يُتعامل مع `commands/` و`.cursor/commands/` كجذور Skills                                          | Claude، Cursor |
| حزم الخطافات  | تخطيطات OpenClaw من نوع `HOOK.md` + `handler.ts`                                                  | Codex          |
| أدوات MCP     | يُدمج إعداد MCP للحزمة في إعدادات OpenClaw المضمنة؛ وتُحمّل خوادم stdio وHTTP المدعومة            | جميع التنسيقات |
| خوادم LSP     | يُدمج ملف Claude المسمى `.lsp.json` و`lspServers` المعلنة في البيان ضمن إعدادات LSP الافتراضية المضمنة في OpenClaw | Claude         |
| الإعدادات     | يُستورد ملف Claude المسمى `settings.json` كإعدادات OpenClaw افتراضية مضمنة                        | Claude         |

#### محتوى Skills

- تُحمّل جذور Skills في الحزمة كجذور Skills عادية في OpenClaw.
- يُتعامل مع جذور Claude المسماة `commands/` كجذور Skills إضافية.
- يُتعامل مع جذور Cursor المسماة `.cursor/commands/` كجذور Skills إضافية.

تعمل ملفات أوامر Claude بتنسيق Markdown وملفات أوامر Cursor بتنسيق Markdown من خلال
محمّل Skills العادي في OpenClaw.

#### حزم الخطافات

تعمل جذور خطافات الحزمة **فقط** عندما تستخدم تخطيط حزمة الخطافات المعتاد في
OpenClaw: ‏`HOOK.md` بالإضافة إلى `handler.ts` أو `handler.js`. وينطبق هذا حاليًا
بشكل أساسي على الحالة المتوافقة مع Codex.

#### MCP لـ OpenClaw المضمن

- يمكن للحزم المفعّلة تقديم إعداد خادم MCP.
- يدمج OpenClaw إعداد MCP الخاص بالحزمة في إعدادات OpenClaw المضمنة
  الفعلية تحت `mcpServers`.
- يتيح OpenClaw أدوات MCP المدعومة الخاصة بالحزمة أثناء أدوار وكيل
  OpenClaw المضمن، من خلال تشغيل خوادم stdio أو الاتصال بخوادم HTTP.
- يتضمن ملفا تعريف الأدوات `coding` و`messaging` أدوات MCP الخاصة بالحزم
  افتراضيًا؛ استخدم `tools.deny: ["bundle-mcp"]` لتعطيلها لوكيل أو Gateway.
- تظل إعدادات الوكيل المضمن المحلية للمشروع مطبّقة بعد إعدادات الحزمة الافتراضية،
  ولذلك يمكن لإعدادات مساحة العمل تجاوز إدخالات MCP الخاصة بالحزمة عند الحاجة.
- تُرتب كتالوجات أدوات MCP الخاصة بالحزم ترتيبًا حتميًا قبل التسجيل، حتى لا
  تؤدي تغييرات ترتيب `listTools()` في المصدر إلى اضطراب كتل أدوات ذاكرة التخزين المؤقت للمطالبات.

##### وسائل النقل

يمكن لخوادم MCP استخدام نقل stdio أو HTTP.

يشغّل **Stdio** عملية فرعية:

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

يتصل **HTTP** بخادم MCP قيد التشغيل، ويستخدم `sse` افتراضيًا ما لم
يُطلب `streamable-http`:

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

- يقبل `transport` القيمة `"streamable-http"` أو `"sse"`؛ ويكون الافتراضي عند حذفه هو `sse`.
- تمثل `type: "http"` صيغة لاحقة أصلية لـ CLI؛ استخدم `transport: "streamable-http"` في إعداد OpenClaw. يعمل `openclaw mcp set` و`openclaw doctor --fix` على تسوية الاسم البديل الشائع.
- لا يُسمح إلا بمخططي URL ‏`http:` و`https:`.
- تدعم قيم `headers` استبدال `${ENV_VAR}`.
- يُرفض إدخال الخادم الذي يحتوي على كل من `command` و`url`.
- تُحجب بيانات الاعتماد في URL، بما يشمل معلومات المستخدم ومعلمات الاستعلام، من أوصاف الأدوات
  والسجلات.
- تتجاوز `connectionTimeoutMs` مهلة الاتصال الافتراضية البالغة 30 ثانية لكل من
  وسيلتي نقل stdio وHTTP. وتبلغ مهلة الطلب الافتراضية 60 ثانية، ويمكن
  تجاوزها باستخدام `requestTimeoutMs`.

##### تسمية الأدوات

يسجل OpenClaw أدوات MCP الخاصة بالحزم بأسماء آمنة لمزوّد الخدمة على الصيغة
`serverName__toolName`. على سبيل المثال، يُسجّل خادم مفتاحه `"vigil-harbor"` ويعرض
أداة `memory_search` باسم `vigil-harbor__memory_search`.

- تُستبدل المحارف الواقعة خارج `A-Za-z0-9_-` بالمحرف `-`.
- تحصل الأجزاء التي قد تبدأ بمحرف غير حرفي على بادئة حرفية، ولذلك تتحول
  مفاتيح الخوادم الرقمية مثل `12306` إلى بادئات أدوات آمنة لمزوّد الخدمة.
- يقتصر طول بادئات الخوادم على 30 محرفًا.
- يقتصر طول أسماء الأدوات الكاملة على 64 محرفًا.
- تستخدم أسماء الخوادم الفارغة `mcp` كقيمة احتياطية.
- تُميّز الأسماء المطهّرة المتصادمة باستخدام لواحق رقمية.
- يكون الترتيب النهائي للأدوات المعروضة حتميًا حسب الاسم الآمن، ما يحافظ على
  استقرار ذاكرة التخزين المؤقت عبر أدوار الوكيل المضمن المتكررة.
- يتعامل ترشيح ملفات التعريف مع جميع الأدوات الصادرة من خادم MCP واحد تابع لحزمة
  على أنها مملوكة للإضافة `bundle-mcp`، ولذلك يمكن لقوائم السماح والمنع في ملف التعريف الإشارة
  إما إلى أسماء الأدوات المعروضة منفردة أو إلى مفتاح الإضافة `bundle-mcp`.

#### إعدادات OpenClaw المضمنة

يُستورد ملف Claude المسمى `settings.json` كإعدادات OpenClaw مضمنة افتراضية عند
تفعيل الحزمة. يطهّر OpenClaw مفاتيح تجاوز الصدفة قبل تطبيقها:

- `shellPath`
- `shellCommandPrefix`

#### LSP المضمن في OpenClaw

- يمكن لحزم Claude المفعّلة تقديم إعداد خادم LSP.
- يحمّل OpenClaw ملف `.lsp.json` بالإضافة إلى أي مسارات `lspServers` معلنة في البيان.
- يُدمج إعداد LSP الخاص بالحزمة في إعدادات LSP الافتراضية الفعلية
  المضمنة في OpenClaw.
- لا يمكن حاليًا تشغيل سوى خوادم LSP المدعومة والمعتمدة على stdio؛ وتظل
  وسائل النقل غير المدعومة ظاهرة في `openclaw plugins inspect <id>`.

### مُكتشف ولكن غير مُنفّذ

تُكتشف العناصر التالية وتظهر في معلومات التشخيص، لكن OpenClaw لا يشغّلها:

- عناصر Claude المسماة `agents` وأتمتة `hooks/hooks.json` و`outputStyles`
- عناصر Cursor المسماة `.cursor/agents` و`.cursor/hooks.json` و`.cursor/rules`
- بيانات Codex الوصفية في `.app.json` بخلاف الإبلاغ عن القدرات

## تنسيقات الحزم

<AccordionGroup>
  <Accordion title="Codex bundles">
    العلامات: `.codex-plugin/plugin.json`

    المحتوى الاختياري: `skills/` و`hooks/` و`.mcp.json` و`.app.json`

    تتوافق حزم Codex مع OpenClaw على أفضل وجه عندما تستخدم جذور Skills وأدلة
    حزم الخطافات بتخطيط OpenClaw ‏(`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Claude bundles">
    وضعا اكتشاف:

    - **استنادًا إلى البيان:** `.claude-plugin/plugin.json`
    - **من دون بيان:** تخطيط Claude الافتراضي (`skills/` و`commands/` و`agents/` و`hooks/` و`.mcp.json` و`.lsp.json` و`settings.json`)

    السلوك الخاص بـ Claude:

    - يُتعامل مع `commands/` كمحتوى Skills
    - يُستورد `settings.json` إلى إعدادات OpenClaw المضمنة (مع تطهير مفاتيح تجاوز الصدفة)
    - يتيح `.mcp.json` أدوات stdio المدعومة لـ OpenClaw المضمن
    - يُحمّل `.lsp.json` بالإضافة إلى مسارات `lspServers` المعلنة في البيان ضمن إعدادات LSP الافتراضية المضمنة في OpenClaw
    - يُكتشف `hooks/hooks.json` ولكن لا يُنفّذ
    - تكون مسارات المكونات المخصصة في البيان إضافية؛ فهي توسّع الإعدادات الافتراضية ولا تستبدلها

  </Accordion>

  <Accordion title="Cursor bundles">
    العلامات: `.cursor-plugin/plugin.json`

    المحتوى الاختياري: `skills/` و`.cursor/commands/` و`.cursor/agents/` و`.cursor/rules/` و`.cursor/hooks.json` و`.mcp.json`

    - يُتعامل مع `.cursor/commands/` كمحتوى Skills
    - لا تُستخدم `.cursor/rules/` و`.cursor/agents/` و`.cursor/hooks.json` إلا للاكتشاف

  </Accordion>
</AccordionGroup>

## أسبقية الاكتشاف

يتحقق OpenClaw أولًا من تنسيق الإضافة الأصلية:

1. ‏`openclaw.plugin.json` أو ملف `package.json` صالح يحتوي على `openclaw.extensions` — يُعامل على أنه **إضافة أصلية**
2. علامات الحزم (`.codex-plugin/` أو `.claude-plugin/` أو تخطيط Claude/Cursor الافتراضي) — تُعامل على أنها **حزمة**

إذا احتوى دليل على كليهما، يستخدم OpenClaw المسار الأصلي. ويمنع ذلك
تثبيت الحزم متعددة التنسيقات جزئيًا كحزم.

## اعتماديات وقت التشغيل والتنظيف

- لا تحصل الحزم الخارجية المتوافقة على إصلاح `npm install` عند بدء التشغيل. ويجب
  تثبيتها عبر `openclaw plugins install` وأن تتضمن كل ما
  تحتاج إليه داخل دليل الإضافة المثبتة.
- تكون إضافات OpenClaw المجمعة والمملوكة له إما مضمنة بخفة في النواة أو
  قابلة للتنزيل عبر مثبّت الإضافات. ولا يشغّل Gateway مدير حزم لها
  عند بدء التشغيل مطلقًا.
- يزيل `openclaw doctor --fix` سجلات تثبيت الإضافات المجمعة المحلية القديمة،
  ويمكنه استعادة الإضافات القابلة للتنزيل والمفقودة من فهرس الإضافات
  المحلي عندما تظل الإعدادات تشير إليها.

## الأمان

للحزم حدود ثقة أضيق من الإضافات الأصلية:

- لا يحمّل OpenClaw وحدات تشغيل عشوائية من الحزم داخل العملية.
- يجب أن تبقى مسارات Skills وحزم الخطافات داخل جذر الإضافة، مع التحقق من الحدود.
- تُقرأ ملفات الإعدادات باستخدام عمليات التحقق من الحدود نفسها.
- يمكن تشغيل خوادم MCP المدعومة التي تستخدم stdio كعمليات فرعية.

يجعل هذا الحزم أكثر أمانًا افتراضيًا، ولكن يظل عليك التعامل مع الحزم
الخارجية كمحتوى موثوق للميزات التي تتيحها.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="Bundle is detected but capabilities do not run">
    شغّل `openclaw plugins inspect <id>`. إذا كانت إحدى القدرات مدرجة ولكن معلّمة
    على أنها غير موصّلة، فهذا قيد في المنتج وليس تثبيتًا معطّلًا.
  </Accordion>

  <Accordion title="Claude command files do not appear">
    تأكد من تفعيل الحزمة ومن وجود ملفات Markdown داخل جذر
    `commands/` أو `skills/` مُكتشف.
  </Accordion>

  <Accordion title="Claude settings do not apply">
    لا تُدعم إلا إعدادات OpenClaw المضمنة من `settings.json`. ولا يتعامل OpenClaw
    مع إعدادات الحزمة كتصحيحات مباشرة للإعداد.
  </Accordion>

  <Accordion title="Claude hooks do not execute">
    لا يُستخدم `hooks/hooks.json` إلا للاكتشاف. إذا كنت تحتاج إلى خطافات قابلة للتشغيل، فاستخدم
    تخطيط حزمة الخطافات في OpenClaw أو وفّر إضافة أصلية.
  </Accordion>
</AccordionGroup>

## ذو صلة

- [تثبيت الإضافات وإعدادها](/ar/tools/plugin)
- [إنشاء الإضافات](/ar/plugins/building-plugins) — أنشئ إضافة أصلية
- [بيان الإضافة](/ar/plugins/manifest) — مخطط البيان الأصلي
