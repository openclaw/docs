---
read_when:
    - تنفيذ لوحة Canvas على macOS
    - إضافة عناصر تحكم الوكيل لمساحة العمل المرئية
    - تصحيح أخطاء تحميلات لوحة الرسم في WKWebView
summary: لوحة الرسم التي يتحكم بها الوكيل، مضمّنة عبر WKWebView + مخطط URL مخصص
title: لوحة الرسم
x-i18n:
    generated_at: "2026-05-06T08:04:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8e53f5d1c2e5b3b46e77cb74632e56123f3312dfcc395aa5ac8182c8d58b6cf
    source_path: platforms/mac/canvas.md
    workflow: 16
---

يتضمن تطبيق macOS لوحة **Canvas** يتحكم بها الوكيل باستخدام `WKWebView`. وهي
مساحة عمل مرئية خفيفة لـ HTML/CSS/JS وA2UI وأسطح UI تفاعلية صغيرة.

## مكان وجود Canvas

تُخزَّن حالة Canvas ضمن Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

تقدم لوحة Canvas هذه الملفات عبر **مخطط URL مخصص**:

- `openclaw-canvas://<session>/<path>`

أمثلة:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

إذا لم يوجد `index.html` في الجذر، يعرض التطبيق **صفحة هيكلية مدمجة**.

## سلوك اللوحة

- لوحة بلا حدود، قابلة لتغيير الحجم، ومثبتة بالقرب من شريط القائمة (أو مؤشر الفأرة).
- تتذكر الحجم/الموضع لكل جلسة.
- تعيد التحميل تلقائيًا عند تغيّر ملفات Canvas المحلية.
- تظهر لوحة Canvas واحدة فقط في كل مرة (وتُبدَّل الجلسة حسب الحاجة).

يمكن تعطيل Canvas من الإعدادات → **السماح بـ Canvas**. عند تعطيله، تُرجع أوامر
node الخاصة بـ canvas القيمة `CANVAS_DISABLED`.

## سطح API للوكيل

تُعرَض Canvas عبر **Gateway WebSocket**، لذا يمكن للوكيل:

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

تستضيف Gateway مضيف canvas الخاص بـ A2UI ويُعرَض داخل لوحة Canvas.
عندما تعلن Gateway عن مضيف Canvas، ينتقل تطبيق macOS تلقائيًا إلى صفحة مضيف
A2UI عند أول فتح.

URL مضيف A2UI الافتراضي:

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

يطالب التطبيق بالتأكيد ما لم يتم توفير مفتاح صالح.

## ملاحظات الأمان

- يمنع مخطط Canvas اجتياز الأدلة؛ يجب أن تكون الملفات ضمن جذر الجلسة.
- يستخدم محتوى Canvas المحلي مخططًا مخصصًا (لا يلزم خادم loopback).
- لا يُسمح بعناوين URL الخارجية من نوع `http(s)` إلا عند الانتقال إليها صراحةً.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [WebChat](/ar/web/webchat)
