---
read_when:
    - تريد استخدام مهام سير ComfyUI المحلية مع OpenClaw
    - تريد استخدام Comfy Cloud مع مهام سير الصور أو الفيديو أو الموسيقى
    - تحتاج إلى مفاتيح إعدادات Plugin ‏comfy المضمّنة
summary: إعداد توليد الصور والفيديو والموسيقى عبر ComfyUI workflow في OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-24T07:58:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8b39c49df3ad23018372b481681ce89deac3271da5dbdf94580712ace7fef7f
    source_path: providers/comfy.md
    workflow: 15
---

يشحن OpenClaw Plugin مضمّنة باسم `comfy` لتشغيلات ComfyUI المعتمدة على workflow. وتعتمد Plugin بالكامل على workflow، لذلك لا يحاول OpenClaw تعيين عناصر تحكم عامة مثل `size` أو `aspectRatio` أو `resolution` أو `durationSeconds` أو عناصر تحكم على نمط TTS إلى الرسم البياني الخاص بك.

| الخاصية | التفاصيل |
| ------- | --------- |
| Provider | `comfy` |
| النماذج | `comfy/workflow` |
| الأسطح المشتركة | `image_generate` و`video_generate` و`music_generate` |
| المصادقة | لا شيء لـ ComfyUI المحلي؛ و`COMFY_API_KEY` أو `COMFY_CLOUD_API_KEY` لـ Comfy Cloud |
| API | ‏ComfyUI ‏`/prompt` / `/history` / `/view` وComfy Cloud ‏`/api/*` |

## ما الذي يدعمه

- توليد الصور من ملف workflow JSON
- تحرير الصور مع صورة مرجعية مرفوعة واحدة
- توليد الفيديو من ملف workflow JSON
- توليد الفيديو مع صورة مرجعية مرفوعة واحدة
- توليد الموسيقى أو الصوت عبر الأداة المشتركة `music_generate`
- تنزيل المخرجات من node مضبوطة أو من جميع عقد المخرجات المطابقة

## البدء

اختر بين تشغيل ComfyUI على جهازك أو استخدام Comfy Cloud.

<Tabs>
  <Tab title="محلي">
    **الأفضل لـ:** تشغيل مثيل ComfyUI الخاص بك على جهازك أو شبكتك المحلية.

    <Steps>
      <Step title="ابدأ ComfyUI محليًا">
        تأكد من أن مثيل ComfyUI المحلي يعمل (الافتراضي `http://127.0.0.1:8188`).
      </Step>
      <Step title="جهّز workflow JSON الخاصة بك">
        صدّر أو أنشئ ملف workflow JSON لـ ComfyUI. دوّن معرّفات node الخاصة بعقدة إدخال prompt وعقدة الإخراج التي تريد أن يقرأ منها OpenClaw.
      </Step>
      <Step title="اضبط provider">
        اضبط `mode: "local"` وأشر إلى ملف workflow الخاص بك. إليك مثالًا حدّيًا أدنى للصور:

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "local",
                baseUrl: "http://127.0.0.1:8188",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="اضبط النموذج الافتراضي">
        وجّه OpenClaw إلى نموذج `comfy/workflow` للقدرة التي ضبطتها:

        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="تحقق">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **الأفضل لـ:** تشغيل workflows على Comfy Cloud من دون إدارة موارد GPU محلية.

    <Steps>
      <Step title="احصل على مفتاح API">
        سجّل في [comfy.org](https://comfy.org) وأنشئ مفتاح API من لوحة حسابك.
      </Step>
      <Step title="اضبط مفتاح API">
        قدّم مفتاحك بإحدى هذه الطرق:

        ```bash
        # Environment variable (preferred)
        export COMFY_API_KEY="your-key"

        # Alternative environment variable
        export COMFY_CLOUD_API_KEY="your-key"

        # Or inline in config
        openclaw config set models.providers.comfy.apiKey "your-key"
        ```
      </Step>
      <Step title="جهّز workflow JSON الخاصة بك">
        صدّر أو أنشئ ملف workflow JSON لـ ComfyUI. دوّن معرّفات node الخاصة بعقدة إدخال prompt وعقدة الإخراج.
      </Step>
      <Step title="اضبط provider">
        اضبط `mode: "cloud"` وأشر إلى ملف workflow الخاص بك:

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "cloud",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```

        <Tip>
        يستخدم وضع Cloud افتراضيًا `baseUrl` بالقيمة `https://cloud.comfy.org`. ولا تحتاج إلى ضبط `baseUrl` إلا إذا كنت تستخدم نقطة نهاية سحابية مخصصة.
        </Tip>
      </Step>
      <Step title="اضبط النموذج الافتراضي">
        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="تحقق">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## الإعدادات

يدعم Comfy إعدادات اتصال مشتركة من المستوى الأعلى بالإضافة إلى أقسام workflow لكل قدرة (`image` و`video` و`music`):

```json5
{
  models: {
    providers: {
      comfy: {
        mode: "local",
        baseUrl: "http://127.0.0.1:8188",
        image: {
          workflowPath: "./workflows/flux-api.json",
          promptNodeId: "6",
          outputNodeId: "9",
        },
        video: {
          workflowPath: "./workflows/video-api.json",
          promptNodeId: "12",
          outputNodeId: "21",
        },
        music: {
          workflowPath: "./workflows/music-api.json",
          promptNodeId: "3",
          outputNodeId: "18",
        },
      },
    },
  },
}
```

### المفاتيح المشتركة

| المفتاح | النوع | الوصف |
| ------- | ------ | ------ |
| `mode` | `"local"` أو `"cloud"` | وضع الاتصال. |
| `baseUrl` | string | القيمة الافتراضية هي `http://127.0.0.1:8188` للوضع المحلي أو `https://cloud.comfy.org` للوضع السحابي. |
| `apiKey` | string | مفتاح مضمّن اختياري، بديل عن متغيرات البيئة `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | boolean | السماح باستخدام `baseUrl` خاصة/محلية في وضع cloud. |

### مفاتيح كل قدرة

تنطبق هذه المفاتيح داخل أقسام `image` أو `video` أو `music`:

| المفتاح | مطلوب | الافتراضي | الوصف |
| ------- | ------ | ---------- | ------ |
| `workflow` أو `workflowPath` | نعم | -- | المسار إلى ملف workflow JSON الخاص بـ ComfyUI. |
| `promptNodeId` | نعم | -- | معرّف node التي تستقبل prompt النصية. |
| `promptInputName` | لا | `"text"` | اسم الإدخال على عقدة prompt. |
| `outputNodeId` | لا | -- | معرّف node التي تُقرأ منها المخرجات. وإذا حُذفت، تُستخدم جميع عقد الإخراج المطابقة. |
| `pollIntervalMs` | لا | -- | فترة الاستطلاع بالمللي ثانية لاكتمال المهمة. |
| `timeoutMs` | لا | -- | المهلة بالمللي ثانية لتشغيل workflow. |

كما يدعم قسمَا `image` و`video` ما يلي:

| المفتاح | مطلوب | الافتراضي | الوصف |
| ------- | ------ | ---------- | ------ |
| `inputImageNodeId` | نعم (عند تمرير صورة مرجعية) | -- | معرّف node التي تستقبل الصورة المرجعية المرفوعة. |
| `inputImageInputName` | لا | `"image"` | اسم الإدخال على عقدة الصورة. |

## تفاصيل workflow

<AccordionGroup>
  <Accordion title="مهام سير الصور">
    اضبط نموذج الصور الافتراضي على `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    **مثال على التحرير باستخدام صورة مرجعية:**

    لتفعيل تحرير الصور باستخدام صورة مرجعية مرفوعة، أضف `inputImageNodeId` إلى إعدادات الصور لديك:

    ```json5
    {
      models: {
        providers: {
          comfy: {
            image: {
              workflowPath: "./workflows/edit-api.json",
              promptNodeId: "6",
              inputImageNodeId: "7",
              inputImageInputName: "image",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="مهام سير الفيديو">
    اضبط نموذج الفيديو الافتراضي على `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    تدعم مهام سير الفيديو في Comfy كلاً من text-to-video وimage-to-video عبر الرسم البياني المضبوط.

    <Note>
    لا يمرر OpenClaw مقاطع الفيديو المدخلة إلى مهام سير Comfy. فالمَدخَلات المدعومة هي prompts النصية والصور المرجعية المفردة فقط.
    </Note>

  </Accordion>

  <Accordion title="مهام سير الموسيقى">
    تسجل Plugin المضمنة مزودًا لتوليد الموسيقى لنتائج الصوت أو الموسيقى المحددة بواسطة workflow، ويتم كشفه عبر الأداة المشتركة `music_generate`:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    استخدم قسم إعدادات `music` للإشارة إلى workflow JSON الخاصة بالصوت وعقدة الإخراج.

  </Accordion>

  <Accordion title="التوافق مع الإصدارات السابقة">
    لا تزال إعدادات الصور القديمة ذات المستوى الأعلى (من دون القسم المتداخل `image`) تعمل:

    ```json5
    {
      models: {
        providers: {
          comfy: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
        },
      },
    }
    ```

    يعامل OpenClaw هذا الشكل القديم على أنه إعدادات workflow للصور. ولا تحتاج إلى الترحيل فورًا، لكن الأقسام المتداخلة `image` / `video` / `music` موصى بها للإعدادات الجديدة.

    <Tip>
    إذا كنت تستخدم توليد الصور فقط، فإن الإعدادات المسطحة القديمة والقسم المتداخل `image` الجديد متكافئان وظيفيًا.
    </Tip>

  </Accordion>

  <Accordion title="الاختبارات المباشرة">
    توجد تغطية مباشرة اختيارية لـ Plugin المضمنة:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    يتجاوز الاختبار المباشر حالات الصور أو الفيديو أو الموسيقى الفردية ما لم يكن قسم workflow المطابق في Comfy مضبوطًا.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="توليد الصور" href="/ar/tools/image-generation" icon="image">
    إعدادات واستخدام أداة توليد الصور.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    إعدادات واستخدام أداة توليد الفيديو.
  </Card>
  <Card title="توليد الموسيقى" href="/ar/tools/music-generation" icon="music">
    إعداد أداة توليد الموسيقى والصوت.
  </Card>
  <Card title="دليل Providers" href="/ar/providers/index" icon="layers">
    نظرة عامة على جميع providers ومراجع النماذج.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    مرجع الإعدادات الكامل بما في ذلك الإعدادات الافتراضية للوكلاء.
  </Card>
</CardGroup>
