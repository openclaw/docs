---
read_when:
    - تريد تثبيت حزمة متوافقة مع Codex أو Claude أو Cursor
    - تحتاج إلى فهم كيفية ربط OpenClaw لمحتوى الحزمة بالميزات الأصلية
    - أنت تقوم بتصحيح أخطاء اكتشاف الحزمة أو القدرات المفقودة
summary: ثبّت واستخدم حزم Codex وClaude وCursor باعتبارها Plugins في OpenClaw
title: حزم Plugin
x-i18n:
    generated_at: "2026-06-27T18:00:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b26915603db9d4d4422f4d1542f033be02eb83c5ffefcf93cac7968f624f4969
    source_path: plugins/bundles.md
    workflow: 16
---

يمكن لـ OpenClaw تثبيت الإضافات من ثلاثة أنظمة بيئية خارجية: **Codex** و**Claude**
و**Cursor**. تُسمّى هذه **حزمًا**، وهي حزم محتوى وبيانات وصفية
يحوّلها OpenClaw إلى ميزات أصلية مثل Skills والخطافات وأدوات MCP.

<Info>
  الحزم **ليست** مثل إضافات OpenClaw الأصلية. تعمل الإضافات الأصلية
  داخل العملية ويمكنها تسجيل أي قدرة. أما الحزم فهي حزم محتوى مع
  تحويل انتقائي للميزات وحد ثقة أضيق.
</Info>

## لماذا توجد الحزم

تُنشر كثير من الإضافات المفيدة بتنسيق Codex أو Claude أو Cursor. وبدلًا
من مطالبة المؤلفين بإعادة كتابتها كإضافات OpenClaw أصلية، يكتشف OpenClaw
هذه التنسيقات ويحوّل محتواها المدعوم إلى مجموعة الميزات الأصلية. يعني هذا
أنه يمكنك تثبيت حزمة أوامر Claude أو حزمة Skills لـ Codex واستخدامها فورًا.

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

    تتوفر الميزات المحوّلة (Skills، والخطافات، وأدوات MCP، وافتراضيات LSP) في الجلسة التالية.

  </Step>
</Steps>

## ما الذي يحوّله OpenClaw من الحزم

لا تعمل كل ميزة في الحزم داخل OpenClaw اليوم. إليك ما يعمل وما
يُكتشف لكنه غير موصول بعد.

### مدعوم الآن

| الميزة       | كيفية تحويلها                                                                                       | ينطبق على     |
| ------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| محتوى Skills | تُحمّل جذور Skills في الحزمة كـ Skills عادية في OpenClaw                                                 | كل التنسيقات    |
| الأوامر      | تُعامل `commands/` و`.cursor/commands/` كجذور Skills                                        | Claude، Cursor |
| حزم الخطافات    | تخطيطات `HOOK.md` + `handler.ts` بأسلوب OpenClaw                                                   | Codex          |
| أدوات MCP     | تُدمج إعدادات MCP الخاصة بالحزمة في إعدادات OpenClaw المضمّنة؛ وتُحمّل خوادم stdio وHTTP المدعومة | كل التنسيقات    |
| خوادم LSP   | تُدمج ملفات Claude `.lsp.json` و`lspServers` المعلنة في البيان في افتراضيات LSP المضمّنة في OpenClaw  | Claude         |
| الإعدادات      | يُستورد `settings.json` الخاص بـ Claude كافتراضيات OpenClaw مضمّنة                                     | Claude         |

#### محتوى Skills

- تُحمّل جذور Skills في الحزمة كجذور Skills عادية في OpenClaw
- تُعامل جذور `commands` في Claude كجذور Skills إضافية
- تُعامل جذور `.cursor/commands` في Cursor كجذور Skills إضافية

يعني هذا أن ملفات أوامر Markdown الخاصة بـ Claude تعمل عبر مُحمّل Skills
العادي في OpenClaw. وتعمل أوامر Markdown الخاصة بـ Cursor عبر المسار نفسه.

#### حزم الخطافات

- تعمل جذور الخطافات في الحزم **فقط** عندما تستخدم تخطيط حزمة الخطافات
  العادي في OpenClaw. حاليًا، هذه هي غالبًا الحالة المتوافقة مع Codex:
  - `HOOK.md`
  - `handler.ts` أو `handler.js`

#### MCP لـ OpenClaw المضمّن

- يمكن للحزم المفعّلة الإسهام بإعدادات خادم MCP
- يدمج OpenClaw إعدادات MCP الخاصة بالحزمة في إعدادات OpenClaw المضمّنة الفعالة باسم
  `mcpServers`
- يعرّض OpenClaw أدوات MCP المدعومة من الحزم أثناء دورات وكيل OpenClaw المضمّن عبر
  تشغيل خوادم stdio أو الاتصال بخوادم HTTP
- تتضمن ملفات تعريف الأدوات `coding` و`messaging` أدوات MCP الخاصة بالحزم
  افتراضيًا؛ استخدم `tools.deny: ["bundle-mcp"]` لإلغاء ذلك لوكيل أو Gateway
- تظل إعدادات الوكيل المضمّن المحلية للمشروع مطبقة بعد افتراضيات الحزمة، لذلك يمكن لإعدادات
  مساحة العمل تجاوز إدخالات MCP الخاصة بالحزمة عند الحاجة
- تُرتب كتالوجات أدوات MCP الخاصة بالحزم ترتيبًا حتميًا قبل التسجيل، بحيث لا
  تؤدي تغييرات ترتيب `listTools()` في المصدر إلى إرباك كتل أدوات ذاكرة التخزين المؤقت للمطالبات

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

**HTTP** يتصل بخادم MCP قيد التشغيل عبر `sse` افتراضيًا، أو `streamable-http` عند طلب ذلك:

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

- يمكن تعيين `transport` إلى `"streamable-http"` أو `"sse"`؛ وعند إغفاله يستخدم OpenClaw `sse`
- `type: "http"` شكل لاحق أصلي للـ CLI؛ استخدم `transport: "streamable-http"` في إعدادات OpenClaw. يقوم `openclaw mcp set` و`openclaw doctor --fix` بتطبيع الاسم البديل الشائع.
- لا يُسمح إلا بمخططات URL من نوع `http:` و`https:`
- تدعم قيم `headers` استيفاء `${ENV_VAR}`
- يُرفض إدخال الخادم الذي يحتوي على كل من `command` و`url`
- تُحجب بيانات اعتماد URL (معلومات المستخدم ومعاملات الاستعلام) من أوصاف
  الأدوات والسجلات
- يتجاوز `connectionTimeoutMs` مهلة الاتصال الافتراضية البالغة 30 ثانية لكل من
  وسائل نقل stdio وHTTP

##### تسمية الأدوات

يسجل OpenClaw أدوات MCP الخاصة بالحزم بأسماء آمنة للمزوّدين بالشكل
`serverName__toolName`. على سبيل المثال، خادم مفتاحه `"vigil-harbor"` ويعرّض أداة
`memory_search` يُسجل باسم `vigil-harbor__memory_search`.

- تُستبدل الأحرف خارج `A-Za-z0-9_-` بـ `-`
- تُضاف بادئة حرفية إلى الأجزاء التي قد تبدأ بغير حرف، لذلك تتحول
  مفاتيح الخوادم الرقمية مثل `12306` إلى بادئات أدوات آمنة للمزوّدين
- تُحد بادئات الخوادم عند 30 حرفًا
- تُحد أسماء الأدوات الكاملة عند 64 حرفًا
- تعود أسماء الخوادم الفارغة إلى `mcp`
- تُميّز الأسماء المنقّاة المتصادمة بلاحقات رقمية
- يكون ترتيب الأدوات النهائي المعروض حتميًا حسب الاسم الآمن للحفاظ على استقرار ذاكرة التخزين المؤقت
  في دورات الوكيل المضمّن المتكررة
- يعامل ترشيح ملف التعريف كل الأدوات من خادم MCP واحد في الحزمة على أنها مملوكة لإضافة
  باسم `bundle-mcp`، لذلك يمكن أن تتضمن قوائم السماح والمنع في ملفات التعريف إما
  أسماء الأدوات المعروضة الفردية أو مفتاح الإضافة `bundle-mcp`

#### إعدادات OpenClaw المضمّنة

- يُستورد `settings.json` الخاص بـ Claude كإعدادات OpenClaw مضمّنة افتراضية عندما تكون
  الحزمة مفعّلة
- ينقّي OpenClaw مفاتيح تجاوز الصدفة قبل تطبيقها

المفاتيح المنقّاة:

- `shellPath`
- `shellCommandPrefix`

#### LSP المضمّن في OpenClaw

- يمكن لحزم Claude المفعّلة الإسهام بإعدادات خادم LSP
- يحمّل OpenClaw ملف `.lsp.json` إضافة إلى أي مسارات `lspServers` معلنة في البيان
- تُدمج إعدادات LSP الخاصة بالحزمة في افتراضيات LSP الفعالة المضمّنة في OpenClaw
- لا يمكن تشغيل سوى خوادم LSP المدعومة والمعتمدة على stdio اليوم؛ أما وسائل النقل
  غير المدعومة فتظل ظاهرة في `openclaw plugins inspect <id>`

### مكتشف لكنه غير منفّذ

تُتعرف هذه العناصر وتظهر في التشخيصات، لكن OpenClaw لا يشغّلها:

- `agents` و`hooks.json` automation و`outputStyles` في Claude
- `.cursor/agents` و`.cursor/hooks.json` و`.cursor/rules` في Cursor
- البيانات الوصفية المضمّنة/الخاصة بالتطبيق في Codex بما يتجاوز الإبلاغ عن القدرات

## تنسيقات الحزم

<AccordionGroup>
  <Accordion title="حزم Codex">
    العلامات: `.codex-plugin/plugin.json`

    محتوى اختياري: `skills/` و`hooks/` و`.mcp.json` و`.app.json`

    تناسب حزم Codex OpenClaw على أفضل وجه عندما تستخدم جذور Skills وأدلة
    حزم خطافات بأسلوب OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="حزم Claude">
    وضعا اكتشاف:

    - **معتمدة على البيان:** `.claude-plugin/plugin.json`
    - **بلا بيان:** تخطيط Claude الافتراضي (`skills/`، `commands/`، `agents/`، `hooks/`، `.mcp.json`، `.lsp.json`، `settings.json`)

    سلوك خاص بـ Claude:

    - يُعامل `commands/` كمحتوى Skills
    - يُستورد `settings.json` إلى إعدادات OpenClaw المضمّنة (تُنقّى مفاتيح تجاوز الصدفة)
    - يعرّض `.mcp.json` أدوات stdio المدعومة إلى OpenClaw المضمّن
    - تُحمّل `.lsp.json` إضافة إلى مسارات `lspServers` المعلنة في البيان إلى افتراضيات LSP المضمّنة في OpenClaw
    - يُكتشف `hooks/hooks.json` لكنه لا يُنفّذ
    - مسارات المكونات المخصصة في البيان إضافية (توسّع الافتراضيات ولا تستبدلها)

  </Accordion>

  <Accordion title="حزم Cursor">
    العلامات: `.cursor-plugin/plugin.json`

    محتوى اختياري: `skills/` و`.cursor/commands/` و`.cursor/agents/` و`.cursor/rules/` و`.cursor/hooks.json` و`.mcp.json`

    - يُعامل `.cursor/commands/` كمحتوى Skills
    - `.cursor/rules/` و`.cursor/agents/` و`.cursor/hooks.json` مخصصة للاكتشاف فقط

  </Accordion>
</AccordionGroup>

## أسبقية الاكتشاف

يتحقق OpenClaw من تنسيق الإضافة الأصلية أولًا:

1. `openclaw.plugin.json` أو `package.json` صالح مع `openclaw.extensions` — يُعامل كـ **إضافة أصلية**
2. علامات الحزمة (`.codex-plugin/` أو `.claude-plugin/` أو تخطيط Claude/Cursor الافتراضي) — تُعامل كـ **حزمة**

إذا احتوى دليل على الاثنين معًا، يستخدم OpenClaw المسار الأصلي. يمنع هذا
تثبيت الحزم ثنائية التنسيق جزئيًا كحزم.

## تبعيات وقت التشغيل والتنظيف

- لا تحصل الحزم المتوافقة من جهات خارجية على إصلاح `npm install` عند بدء التشغيل. يجب
  تثبيتها عبر `openclaw plugins install` وأن تشحن كل ما تحتاج إليه
  داخل دليل الإضافة المثبّتة.
- تكون الإضافات المجمّعة المملوكة لـ OpenClaw إما مشحونة بشكل خفيف داخل النواة أو
  قابلة للتنزيل عبر مثبت الإضافات. لا يشغّل بدء تشغيل Gateway أبدًا
  مدير حزم لها.
- يزيل `openclaw doctor --fix` أدلة التبعيات المرحلية القديمة ويمكنه
  استرداد الإضافات القابلة للتنزيل المفقودة من فهرس الإضافات المحلي عندما
  تشير إليها الإعدادات.

## الأمان

للحزم حد ثقة أضيق من الإضافات الأصلية:

- لا يحمّل OpenClaw وحدات وقت تشغيل عشوائية من الحزم داخل العملية
- يجب أن تبقى مسارات Skills وحزم الخطافات داخل جذر الإضافة (مع فحص الحدود)
- تُقرأ ملفات الإعدادات بفحوصات الحدود نفسها
- قد تُشغّل خوادم MCP المدعومة عبر stdio كعمليات فرعية

يجعل هذا الحزم أكثر أمانًا افتراضيًا، لكن يجب عليك مع ذلك التعامل مع
حزم الجهات الخارجية كمحتوى موثوق للميزات التي تعرّضها.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الحزمة مكتشفة لكن القدرات لا تعمل">
    شغّل `openclaw plugins inspect <id>`. إذا كانت قدرة مدرجة لكنها مميزة على أنها
    غير موصولة، فهذا حد في المنتج، وليس تثبيتًا معطّلًا.
  </Accordion>

  <Accordion title="ملفات أوامر Claude لا تظهر">
    تأكد من أن الحزمة مفعّلة وأن ملفات Markdown موجودة داخل جذر
    `commands/` أو `skills/` مكتشف.
  </Accordion>

  <Accordion title="إعدادات Claude لا تُطبّق">
    لا يُدعم إلا إعدادات OpenClaw المضمّنة من `settings.json`. لا يتعامل OpenClaw
    مع إعدادات الحزمة كتصحيحات إعدادات خام.
  </Accordion>

  <Accordion title="خطافات Claude لا تُنفّذ">
    `hooks/hooks.json` مخصص للاكتشاف فقط. إذا كنت تحتاج إلى خطافات قابلة للتشغيل، فاستخدم
    تخطيط حزم الخطافات في OpenClaw أو اشحن إضافة أصلية.
  </Accordion>
</AccordionGroup>

## ذات صلة

- [تثبيت الإضافات وتهيئتها](/ar/tools/plugin)
- [بناء الإضافات](/ar/plugins/building-plugins) — أنشئ إضافة أصلية
- [بيان الإضافة](/ar/plugins/manifest) — مخطط البيان الأصلي
