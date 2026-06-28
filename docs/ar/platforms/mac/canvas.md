---
read_when:
    - تنفيذ لوحة Canvas في macOS
    - إضافة عناصر تحكم للوكيل لمساحة العمل المرئية
    - تصحيح أخطاء تحميلات canvas في WKWebView
summary: لوحة Canvas يتحكم بها الوكيل ومضمّنة عبر WKWebView + مخطط URL مخصص
title: لوحة الرسم
x-i18n:
    generated_at: "2026-06-28T00:13:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 45f0e1b27fbe58e85d57dbf35a6eb44d47df30569b8b10ed24e8bd240b4b5686
    source_path: platforms/mac/canvas.md
    workflow: 16
---

يدمج تطبيق macOS **لوحة Canvas** يتحكم بها الوكيل باستخدام `WKWebView`. وهي
مساحة عمل مرئية خفيفة لـ HTML/CSS/JS وA2UI وأسطح واجهة مستخدم تفاعلية صغيرة.

## أين توجد Canvas

تُخزَّن حالة Canvas ضمن Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

تقدّم لوحة Canvas هذه الملفات عبر **مخطط URL مخصص**:

- `openclaw-canvas://<session>/<path>`

أمثلة:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

إذا لم يوجد `index.html` في الجذر، يعرض التطبيق **صفحة هيكلية مضمّنة**.

## سلوك اللوحة

- لوحة بلا حدود وقابلة لتغيير الحجم ومثبتة قرب شريط القائمة (أو مؤشر الفأرة).
- تتذكر الحجم/الموضع لكل جلسة.
- تعيد التحميل تلقائيًا عند تغيّر ملفات Canvas المحلية.
- تظهر لوحة Canvas واحدة فقط في كل مرة (تُبدَّل الجلسة حسب الحاجة).

يمكن تعطيل Canvas من الإعدادات → **السماح بـ Canvas**. عند تعطيلها، تعيد
أوامر عقد Canvas القيمة `CANVAS_DISABLED`.

## سطح واجهة API للوكيل

تُعرَض Canvas عبر **Gateway WebSocket**، بحيث يستطيع الوكيل:

- إظهار/إخفاء اللوحة
- الانتقال إلى مسار أو URL
- تقييم JavaScript
- التقاط صورة لقطة

أمثلة CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

ملاحظات:

- يقبل `canvas.navigate` **مسارات Canvas المحلية**، وعناوين URL من نوع `http(s)`، وعناوين URL من نوع `file://`.
- إذا مررت `"/"`، تعرض Canvas الهيكل المحلي أو `index.html`.

## A2UI في Canvas

يستضيف مضيف Canvas في Gateway واجهة A2UI وتُعرَض داخل لوحة Canvas.
عندما يعلن Gateway عن مضيف Canvas، ينتقل تطبيق macOS تلقائيًا إلى صفحة مضيف
A2UI عند الفتح الأول.

عنوان URL الافتراضي لمضيف A2UI:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### أوامر A2UI (v0.8)

تقبل Canvas حاليًا رسائل **A2UI v0.8** من الخادم→العميل:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) غير مدعوم.

مثال CLI:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

اختبار سريع:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## تشغيل عمليات الوكيل من Canvas

يمكن لـ Canvas تشغيل عمليات وكيل جديدة عبر الروابط العميقة:

- `openclaw://agent?...`

مثال (في JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

معلمات الاستعلام المدعومة:

- `message`: مطالبة وكيل معبأة مسبقًا.
- `sessionKey`: معرّف جلسة ثابت.
- `thinking`: ملف تعريف تفكير اختياري.
- `deliver` أو `to` أو `channel`: هدف التسليم.
- `timeoutSeconds`: مهلة تشغيل اختيارية.
- `key`: رمز أمان ينشئه التطبيق للمتصلين المحليين الموثوقين.

يطالب التطبيق بالتأكيد ما لم يُقدَّم مفتاح صالح. تعرض الروابط غير المزودة بمفتاح
الرسالة وURL قبل الموافقة، وتتجاهل حقول توجيه التسليم؛ أما الروابط المزودة بمفتاح
فتستخدم مسار تشغيل Gateway العادي.

## ملاحظات أمنية

- يحظر مخطط Canvas اجتياز الأدلة؛ يجب أن تكون الملفات ضمن جذر الجلسة.
- يستخدم محتوى Canvas المحلي مخططًا مخصصًا (لا يلزم خادم loopback).
- لا يُسمح بعناوين URL الخارجية من نوع `http(s)` إلا عند الانتقال إليها صراحةً.

## ذات صلة

- [تطبيق macOS](/ar/platforms/macos)
- [WebChat](/ar/web/webchat)
