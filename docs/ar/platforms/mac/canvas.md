---
read_when:
    - تنفيذ لوحة Canvas لنظام macOS
    - إضافة عناصر تحكم للوكيل في مساحة العمل المرئية
    - تصحيح أخطاء تحميل لوحة WKWebView
summary: لوحة Canvas يتحكم فيها الوكيل ومضمّنة عبر WKWebView + مخطط URL مخصّص
title: اللوحة الفنية
x-i18n:
    generated_at: "2026-07-16T14:23:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21955803c39debfbc34851a0c40a69c1f3c6ca009526d9929a4c429ad0b09084
    source_path: platforms/mac/canvas.md
    workflow: 16
---

يتضمن تطبيق macOS **لوحة Canvas** يتحكم فيها الوكيل باستخدام `WKWebView`، وهي
مساحة عمل مرئية خفيفة لـ HTML/CSS/JS وA2UI وواجهات UI
تفاعلية صغيرة.

## مكان وجود Canvas

تُخزَّن حالة Canvas ضمن Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

تعرض لوحة Canvas هذه الملفات عبر مخطط URL مخصص،
`openclaw-canvas://<session>/<path>`:

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

إذا لم يكن هناك `index.html` في الجذر، فسيعرض التطبيق صفحة هيكلية مضمّنة.

## سلوك اللوحة

- لوحة بلا حدود قابلة لتغيير الحجم ومثبتة بالقرب من شريط القوائم (أو مؤشر الماوس).
- تتذكر الحجم والموضع لكل جلسة.
- تُعاد تهيئتها تلقائيًا عند تغير ملفات Canvas المحلية.
- لا تظهر سوى لوحة Canvas واحدة في كل مرة (مع تبديل الجلسات حسب الحاجة).

يمكن تعطيل Canvas من Settings -> **Allow Canvas**. وعند تعطيلها،
تُرجع أوامر عقد Canvas القيمة `CANVAS_DISABLED`.

## واجهة API للوكيل

تُتاح Canvas عبر WebSocket الخاص بـ Gateway، بحيث يمكن للوكيل إظهار
اللوحة أو إخفاؤها، والانتقال إلى مسار أو عنوان URL، وتقييم JavaScript، والتقاط
صورة لقطة:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

يقبل `canvas.navigate` مسارات Canvas المحلية وعناوين URL من نوع `http(s)` وعناوين URL من نوع `file://`.
يؤدي تمرير `"/"` إلى إظهار الهيكل المحلي أو `index.html`.

تُحل الأهداف التي يستضيفها Gateway ضمن `/__openclaw__/canvas/` و
`/__openclaw__/a2ui/` من خلال عنوان URL الحالي المحدد النطاق لـ Canvas في جلسة العقدة.
يُحدّث التطبيق تلك الصلاحية قصيرة الأجل قبل الانتقال؛
ولا تحتاج إلى إنشاء عنوان URL للصلاحية أو نسخه بنفسك.

## A2UI في Canvas

يستضيف مضيف Canvas في Gateway واجهة A2UI ويعرضها داخل لوحة
Canvas. عندما يعلن Gateway عن مضيف Canvas، ينتقل تطبيق macOS تلقائيًا
إلى صفحة مضيف A2UI عند الفتح لأول مرة.

يكون عنوان URL المُعلن محدد النطاق بصلاحية، مثل
`http://<gateway-host>:18789/__openclaw__/cap/<token>/__openclaw__/a2ui/?platform=macos`.
تعامل معه باعتباره بيانات اعتماد مؤقتة، لا رابطًا ثابتًا.

### أوامر A2UI ‏(v0.8)

تقبل Canvas رسائل A2UI v0.8 من الخادم إلى العميل: `beginRendering`،
و`surfaceUpdate`، و`dataModelUpdate`، و`deleteSurface`. أما `createSurface` ‏(v0.9)
فغير مدعوم حتى الآن.

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"إذا كنت تستطيع قراءة هذا، فإن دفع A2UI يعمل."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

اختبار تحقق سريع:

```bash
openclaw nodes canvas a2ui push --node <id> --text "مرحبًا من A2UI"
```

## تشغيل عمليات الوكيل من Canvas

يمكن لـ Canvas تشغيل عمليات وكيل جديدة عبر الروابط العميقة `openclaw://agent?...`:

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

معلمات الاستعلام المدعومة:

| المعلمة                    | المعنى                                                |
| -------------------------- | ----------------------------------------------------- |
| `message`                  | مطالبة وكيل معبأة مسبقًا.                             |
| `sessionKey`               | معرّف جلسة ثابت.                                      |
| `thinking`                 | ملف تعريف اختياري للتفكير.                            |
| `deliver`، `to`، `channel` | هدف التسليم.                                          |
| `timeoutSeconds`           | مهلة تشغيل اختيارية.                                  |
| `key`                      | رمز أمان ينشئه التطبيق للجهات المحلية الموثوقة المستدعية. |

يطلب التطبيق التأكيد ما لم يُقدَّم مفتاح صالح. وتعرض
الروابط التي بلا مفتاح الرسالة وعنوان URL قبل الموافقة، وتتجاهل حقول توجيه
التسليم؛ أما الروابط ذات المفتاح فتستخدم مسار التشغيل المعتاد في Gateway.

## ملاحظات أمنية

- يحظر مخطط Canvas اجتياز الأدلة؛ ويجب أن تكون الملفات ضمن جذر الجلسة.
- يستخدم محتوى Canvas المحلي مخططًا مخصصًا (ولا يلزم خادم استرجاع حلقي).
- لا يُسمح بعناوين URL الخارجية من نوع `http(s)` إلا عند الانتقال إليها صراحةً.
- صفحات الويب العادية مخصصة للعرض فقط. لا تُقبل إجراءات الوكيل إلا من
  مخطط Canvas المملوك للتطبيق أو مستند A2UI المحدد النطاق بصلاحية في Gateway
  الذي يختاره التطبيق تحديدًا؛ ولا يمكن للإطارات الفرعية أو عمليات إعادة التوجيه أو الصلاحيات القديمة أو الاستعلامات
  المتغيرة إرسال إجراءات.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [WebChat](/ar/web/webchat)
