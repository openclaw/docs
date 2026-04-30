---
read_when:
    - تريد استخدام GitHub Copilot كمزوّد نماذج
    - تحتاج إلى تدفق `openclaw models auth login-github-copilot`
summary: سجّل الدخول إلى GitHub Copilot من OpenClaw باستخدام تدفق الجهاز أو استيراد الرمز المميز غير التفاعلي.
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-30T08:20:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ebcee41d4a3fffff8f20072e99e6dbb57baa2d9ec7eddad1d426ee37805597c
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot هو مساعد GitHub للبرمجة بالذكاء الاصطناعي. يوفّر وصولًا إلى نماذج Copilot
لحسابك وخطتك على GitHub. يمكن لـ OpenClaw استخدام Copilot كموفّر نماذج
بطريقتين مختلفتين.

## طريقتان لاستخدام Copilot في OpenClaw

<Tabs>
  <Tab title="الموفّر المدمج (github-copilot)">
    استخدم تدفق تسجيل الدخول عبر الجهاز الأصلي للحصول على رمز GitHub، ثم استبدله برموز
    Copilot API عندما يعمل OpenClaw. هذا هو المسار **الافتراضي** والأبسط
    لأنه لا يتطلب VS Code.

    <Steps>
      <Step title="تشغيل أمر تسجيل الدخول">
        ```bash
        openclaw models auth login-github-copilot
        ```

        سيُطلب منك زيارة URL وإدخال رمز لمرة واحدة. أبقِ
        الطرفية مفتوحة حتى يكتمل.
      </Step>
      <Step title="تعيين نموذج افتراضي">
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

  <Tab title="Plugin وكيل Copilot (copilot-proxy)">
    استخدم إضافة VS Code الخاصة بـ **Copilot Proxy** كجسر محلي. يتواصل OpenClaw مع
    نقطة نهاية `/v1` الخاصة بالوكيل ويستخدم قائمة النماذج التي تضبطها هناك.

    <Note>
    اختر هذا عندما تكون تشغّل Copilot Proxy بالفعل في VS Code أو تحتاج إلى التوجيه
    عبره. يجب عليك تفعيل Plugin وإبقاء إضافة VS Code قيد التشغيل.
    </Note>

  </Tab>
</Tabs>

## العلامات الاختيارية

| العلامة         | الوصف                                               |
| --------------- | --------------------------------------------------- |
| `--yes`         | تخطّي مطالبة التأكيد                                |
| `--set-default` | تطبيق النموذج الافتراضي الموصى به من الموفّر أيضًا |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## الإعداد الأولي غير التفاعلي

إذا كان لديك بالفعل رمز وصول GitHub OAuth لـ Copilot، فاستورده أثناء
الإعداد بلا واجهة باستخدام `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

يمكنك أيضًا حذف `--auth-choice`؛ فتمرير `--github-copilot-token` يستنتج
خيار مصادقة موفّر GitHub Copilot. إذا حُذفت العلامة، يعود الإعداد الأولي
إلى `COPILOT_GITHUB_TOKEN`، ثم `GH_TOKEN`، ثم `GITHUB_TOKEN`. استخدم
`--secret-input-mode ref` مع ضبط `COPILOT_GITHUB_TOKEN` لتخزين
`tokenRef` مدعوم بمتغير بيئة بدل النص الصريح في `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="مطلوب TTY تفاعلي">
    يتطلب تدفق تسجيل الدخول عبر الجهاز TTY تفاعليًا. شغّله مباشرة في
    الطرفية، وليس في سكربت غير تفاعلي أو خط أنابيب CI.
  </Accordion>

  <Accordion title="يعتمد توفر النماذج على خطتك">
    يعتمد توفر نماذج Copilot على خطة GitHub الخاصة بك. إذا رُفض نموذج،
    فجرّب معرّفًا آخر (مثلًا `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="اختيار وسيلة النقل">
    تستخدم معرّفات نماذج Claude وسيلة نقل Anthropic Messages تلقائيًا. وتحتفظ نماذج GPT
    وسلسلة o ونماذج Gemini بوسيلة نقل OpenAI Responses. يختار OpenClaw
    وسيلة النقل الصحيحة بناءً على مرجع النموذج.
  </Accordion>

  <Accordion title="توافق الطلبات">
    يرسل OpenClaw ترويسات طلبات بأسلوب Copilot IDE على وسائل نقل Copilot،
    بما في ذلك دورات Compaction المدمجة، ونتائج الأدوات، ومتابعة الصور. ولا
    يفعّل متابعة Responses على مستوى الموفّر لـ Copilot إلا إذا
    جرى التحقق من ذلك السلوك مقابل Copilot API.
  </Accordion>

  <Accordion title="ترتيب حل متغيرات البيئة">
    يحل OpenClaw مصادقة Copilot من متغيرات البيئة بترتيب الأولوية
    التالي:

    | الأولوية | المتغير              | الملاحظات                        |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | أعلى أولوية، خاص بـ Copilot     |
    | 2        | `GH_TOKEN`            | رمز GitHub CLI (احتياطي)        |
    | 3        | `GITHUB_TOKEN`        | رمز GitHub القياسي (الأدنى)     |

    عند ضبط عدة متغيرات، يستخدم OpenClaw المتغير الأعلى أولوية.
    يخزّن تدفق تسجيل الدخول عبر الجهاز (`openclaw models auth login-github-copilot`)
    رمزه في مخزن ملفات تعريف المصادقة ويكون له الأسبقية على جميع متغيرات
    البيئة.

  </Accordion>

  <Accordion title="تخزين الرمز">
    يخزّن تسجيل الدخول رمز GitHub في مخزن ملفات تعريف المصادقة ويستبدله
    برمز Copilot API عندما يعمل OpenClaw. لست بحاجة إلى إدارة
    الرمز يدويًا.
  </Accordion>
</AccordionGroup>

<Warning>
يتطلب أمر تسجيل الدخول عبر الجهاز TTY تفاعليًا. استخدم الإعداد الأولي غير التفاعلي
عندما تحتاج إلى إعداد بلا واجهة.
</Warning>

## تضمينات بحث الذاكرة

يمكن لـ GitHub Copilot أيضًا العمل كموفّر تضمينات لـ
[بحث الذاكرة](/ar/concepts/memory-search). إذا كانت لديك اشتراك Copilot وقد
سجّلت الدخول، فيمكن لـ OpenClaw استخدامه للتضمينات دون مفتاح API منفصل.

### الاكتشاف التلقائي

عندما يكون `memorySearch.provider` هو `"auto"` (الافتراضي)، تتم تجربة GitHub Copilot
عند الأولوية 15 -- بعد التضمينات المحلية ولكن قبل OpenAI والموفّرين المدفوعين
الآخرين. إذا كان رمز GitHub متاحًا، يكتشف OpenClaw نماذج
التضمين المتاحة من Copilot API ويختار أفضلها تلقائيًا.

### الإعداد الصريح

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

### آلية العمل

1. يحل OpenClaw رمز GitHub الخاص بك (من متغيرات البيئة أو ملف تعريف المصادقة).
2. يستبدله برمز Copilot API قصير العمر.
3. يستعلم نقطة نهاية `/models` الخاصة بـ Copilot لاكتشاف نماذج التضمين المتاحة.
4. يختار أفضل نموذج (يفضّل `text-embedding-3-small`).
5. يرسل طلبات التضمين إلى نقطة نهاية `/embeddings` الخاصة بـ Copilot.

يعتمد توفر النماذج على خطة GitHub الخاصة بك. إذا لم تكن أي نماذج تضمين
متاحة، يتخطى OpenClaw Copilot ويحاول استخدام الموفّر التالي.

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النماذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
