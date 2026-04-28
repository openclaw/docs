---
read_when:
    - تنفيذ لوحة Canvas على macOS
    - إضافة عناصر تحكم الوكيل لمساحة العمل المرئية
    - تصحيح تحميلات Canvas في WKWebView
summary: لوحة Canvas يتحكم بها الوكيل ومضمنة عبر WKWebView + مخطط URL مخصص
title: Canvas
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T07:52:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a791f7841193a55b7f9cc5cc26168258d72d972279bba4c68fd1b15ef16f1c4
    source_path: platforms/mac/canvas.md
    workflow: 15
---

يضمّن تطبيق macOS **لوحة Canvas** يتحكم بها الوكيل باستخدام `WKWebView`. وهي
مساحة عمل مرئية خفيفة لـ HTML/CSS/JS وA2UI وأس surfaces واجهة مستخدم تفاعلية صغيرة.

## مكان وجود Canvas

تُخزَّن حالة Canvas تحت Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

وتخدم لوحة Canvas هذه الملفات عبر **مخطط URL مخصص**:

- `openclaw-canvas://<session>/<path>`

أمثلة:

- `openclaw-canvas://main/` ← `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` ← `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` ← `<canvasRoot>/main/widgets/todo/index.html`

إذا لم يوجد `index.html` في الجذر، يعرض التطبيق **صفحة هيكلية مدمجة**.

## سلوك اللوحة

- لوحة بلا حدود وقابلة لتغيير الحجم ومرتكزة قرب شريط القوائم (أو مؤشر الفأرة).
- تتذكر الحجم/الموضع لكل جلسة.
- تعيد التحميل تلقائيًا عندما تتغير ملفات Canvas المحلية.
- تظهر لوحة Canvas واحدة فقط في كل مرة (ويتم تبديل الجلسة حسب الحاجة).

يمكن تعطيل Canvas من Settings ← **Allow Canvas**. وعند تعطيلها، تعيد أوامر
العقدة الخاصة بـ canvas القيمة `CANVAS_DISABLED`.

## سطح API الخاص بالوكيل

يتم كشف Canvas عبر **Gateway WebSocket**، بحيث يمكن للوكيل:

- إظهار/إخفاء اللوحة
- الانتقال إلى مسار أو URL
- تقييم JavaScript
- التقاط صورة snapshot

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

تتم استضافة A2UI بواسطة مضيف canvas في Gateway وتُعرض داخل لوحة Canvas.
وعندما يعلن Gateway عن مضيف Canvas، ينتقل تطبيق macOS تلقائيًا إلى
صفحة مضيف A2UI عند أول فتح.

عنوان URL الافتراضي لمضيف A2UI:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### أوامر A2UI ‏(v0.8)

تقبل Canvas حاليًا رسائل A2UI ‏v0.8 من الخادم إلى العميل:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

أما `createSurface` ‏(v0.9) فغير مدعوم.

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

## تشغيل عمليات وكيل من Canvas

يمكن لـ Canvas تشغيل عمليات وكيل جديدة عبر روابط عميقة:

- `openclaw://agent?...`

مثال (في JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

يطالب التطبيق بالتأكيد ما لم يتم توفير مفتاح صالح.

## ملاحظات أمنية

- يحظر مخطط Canvas اجتياز الأدلة؛ ويجب أن تعيش الملفات تحت جذر الجلسة.
- يستخدم محتوى Canvas المحلي مخططًا مخصصًا (من دون الحاجة إلى خادم local loopback).
- لا يُسمح بعناوين URL الخارجية من نوع `http(s)` إلا عند الانتقال إليها صراحةً.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [WebChat](/ar/web/webchat)
