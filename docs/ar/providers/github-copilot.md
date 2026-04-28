---
read_when:
    - تريد استخدام GitHub Copilot كمزوّد نماذج
    - أنت بحاجة إلى تدفق `openclaw models auth login-github-copilot`
summary: سجّل الدخول إلى GitHub Copilot من OpenClaw باستخدام تدفق الجهاز
title: GitHub Copilot
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-25T13:56:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b5361f196bbb27ba74f281b4665eaaba770d3532eae2d02f76a14f44d3b4618
    source_path: providers/github-copilot.md
    workflow: 15
---

GitHub Copilot هو مساعد GitHub للبرمجة بالذكاء الاصطناعي. ويوفّر الوصول إلى
نماذج Copilot لحساب GitHub والخطة الخاصة بك. ويمكن لـ OpenClaw استخدام Copilot
كمزوّد نماذج بطريقتين مختلفتين.

## طريقتان لاستخدام Copilot في OpenClaw

<Tabs>
  <Tab title="المزوّد المضمّن (github-copilot)">
    استخدم تدفق تسجيل الدخول الأصلي عبر الجهاز للحصول على رمز GitHub، ثم بدّله إلى
    رموز Copilot API المميزة عند تشغيل OpenClaw. وهذا هو المسار **الافتراضي** والأبسط
    لأنه لا يتطلب VS Code.

    <Steps>
      <Step title="شغّل أمر تسجيل الدخول">
        ```bash
        openclaw models auth login-github-copilot
        ```

        سيُطلب منك زيارة عنوان URL وإدخال رمز لمرة واحدة. أبقِ
        الطرفية مفتوحة حتى يكتمل الإجراء.
      </Step>
      <Step title="اضبط نموذجًا افتراضيًا">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        أو في الإعدادات:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Plugin ‏Copilot Proxy ‏(copilot-proxy)">
    استخدم إضافة VS Code المسماة **Copilot Proxy** كجسر محلي. ويتحدث OpenClaw إلى
    نقطة النهاية `/v1` الخاصة بالـ proxy ويستخدم قائمة النماذج التي تضبطها هناك.

    <Note>
    اختر هذا عندما تكون تشغّل Copilot Proxy بالفعل في VS Code أو تحتاج إلى التوجيه
    عبره. يجب عليك تفعيل Plugin والحفاظ على تشغيل إضافة VS Code.
    </Note>

  </Tab>
</Tabs>

## رايات اختيارية

| الراية            | الوصف                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | تخطي مطالبة التأكيد                        |
| `--set-default` | تطبيق النموذج الافتراضي الموصى به من المزوّد أيضًا |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="مطلوب TTY تفاعلي">
    يتطلب تدفق تسجيل الدخول عبر الجهاز TTY تفاعليًا. شغّله مباشرة في
    طرفية، وليس في سكربت غير تفاعلي أو في خط أنابيب CI.
  </Accordion>

  <Accordion title="يعتمد توفر النموذج على خطتك">
    يعتمد توفر نماذج Copilot على خطة GitHub الخاصة بك. وإذا تم رفض نموذج ما،
    فجرّب معرّفًا آخر (مثل `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="اختيار النقل">
    تستخدم معرّفات نماذج Claude نقل Anthropic Messages تلقائيًا. أما نماذج GPT،
    وo-series، وGemini فتبقي على نقل OpenAI Responses. ويقوم OpenClaw
    باختيار النقل الصحيح استنادًا إلى مرجع النموذج.
  </Accordion>

  <Accordion title="توافق الطلب">
    يرسل OpenClaw ترويسات طلبات بنمط Copilot IDE على عمليات نقل Copilot،
    بما في ذلك Compaction المضمّن، ونتائج الأدوات، ودورات المتابعة الخاصة بالصور. وهو
    لا يفعّل الاستمرار على مستوى المزوّد لـ Responses في Copilot إلا إذا
    تم التحقق من هذا السلوك مقابل API الخاصة بـ Copilot.
  </Accordion>

  <Accordion title="ترتيب تحليل متغيرات البيئة">
    يحلل OpenClaw مصادقة Copilot من متغيرات البيئة بالترتيب
    التالي من حيث الأولوية:

    | الأولوية | المتغير              | ملاحظات                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | أعلى أولوية، ومخصص لـ Copilot |
    | 2        | `GH_TOKEN`            | رمز GitHub CLI (رجوع احتياطي)      |
    | 3        | `GITHUB_TOKEN`        | رمز GitHub القياسي (أدنى أولوية)   |

    عند ضبط عدة متغيرات، يستخدم OpenClaw المتغير الأعلى أولوية.
    ويخزّن تدفق تسجيل الدخول عبر الجهاز (`openclaw models auth login-github-copilot`)
    الرمز المميز في مخزن ملفات المصادقة الشخصية ويتقدّم على جميع متغيرات
    البيئة.

  </Accordion>

  <Accordion title="تخزين الرمز المميز">
    يخزّن تسجيل الدخول رمز GitHub في مخزن ملفات المصادقة الشخصية ويبدّله
    إلى رمز Copilot API مميز عند تشغيل OpenClaw. ولا تحتاج إلى إدارة
    الرمز المميز يدويًا.
  </Accordion>
</AccordionGroup>

<Warning>
يتطلب TTY تفاعليًا. شغّل أمر تسجيل الدخول مباشرة في طرفية، وليس
داخل سكربت عديم الواجهة أو مهمة CI.
</Warning>

## Embedding للبحث في الذاكرة

يمكن لـ GitHub Copilot أيضًا أن يعمل كمزوّد embedding من أجل
[بحث الذاكرة](/ar/concepts/memory-search). وإذا كان لديك اشتراك Copilot وكنت
قد سجلت الدخول، فيمكن لـ OpenClaw استخدامه من أجل embedding من دون مفتاح API منفصل.

### الاكتشاف التلقائي

عندما تكون `memorySearch.provider` مساوية لـ `"auto"` (الافتراضي)، تتم تجربة GitHub Copilot
عند الأولوية 15 — بعد embedding المحلية وقبل OpenAI والمزوّدين
المدفوعين الآخرين. وإذا كان رمز GitHub متاحًا، يكتشف OpenClaw
نماذج embedding المتاحة من Copilot API ويختار الأفضل تلقائيًا.

### إعداد صريح

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: override the auto-discovered model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### كيف يعمل

1. يحلل OpenClaw رمز GitHub الخاص بك (من متغيرات البيئة أو ملف المصادقة الشخصي).
2. ويبدّله إلى رمز Copilot API قصير العمر.
3. ويستعلم نقطة النهاية `/models` الخاصة بـ Copilot لاكتشاف نماذج embedding المتاحة.
4. ويختار أفضل نموذج (مع تفضيل `text-embedding-3-small`).
5. ويرسل طلبات embedding إلى نقطة النهاية `/embeddings` الخاصة بـ Copilot.

يعتمد توفر النماذج على خطة GitHub الخاصة بك. وإذا لم تكن أي نماذج embedding
متاحة، فإن OpenClaw يتخطى Copilot ويجرب المزوّد التالي.

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك الرجوع الاحتياطي.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
