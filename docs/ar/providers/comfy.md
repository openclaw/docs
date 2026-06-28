---
read_when:
    - تريد استخدام سير عمل ComfyUI المحلية مع OpenClaw
    - تريد استخدام Comfy Cloud مع سير عمل الصور أو الفيديو أو الموسيقى
    - تحتاج إلى مفاتيح إعدادات comfy plugin المضمّنة
summary: إعداد إنشاء الصور والفيديو والموسيقى في سير عمل ComfyUI في OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-25T13:55:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41dda4be24d5b2c283fa499a345cf9f38747ec19b4010163ceffd998307ca086
    source_path: providers/comfy.md
    workflow: 15
    postprocess_version: locale-links-v1
---

يشحن OpenClaw Plugin مضمّنًا باسم `comfy` لتشغيلات ComfyUI المعتمدة على سير العمل. يعتمد Plugin بالكامل على سير العمل، لذلك لا يحاول OpenClaw مواءمة عناصر تحكم عامة مثل `size` أو `aspectRatio` أو `resolution` أو `durationSeconds` أو عناصر تحكم على نمط TTS مع الرسم البياني لديك.

| الخاصية | التفاصيل |
| --------------- | -------------------------------------------------------------------------------- |
| الموفّر | `comfy` |
| النماذج | `comfy/workflow` |
| الواجهات المشتركة | `image_generate`, `video_generate`, `music_generate` |
| المصادقة | لا شيء لـ ComfyUI المحلي؛ أو `COMFY_API_KEY` أو `COMFY_CLOUD_API_KEY` لـ Comfy Cloud |
| API | ComfyUI `/prompt` / `/history` / `/view` وComfy Cloud `/api/*` |

## ما الذي يدعمه

- إنشاء الصور من ملف JSON لسير العمل
- تحرير الصور باستخدام صورة مرجعية واحدة مرفوعة
- إنشاء الفيديو من ملف JSON لسير العمل
- إنشاء الفيديو باستخدام صورة مرجعية واحدة مرفوعة
- إنشاء الموسيقى أو الصوت عبر الأداة المشتركة `music_generate`
- تنزيل المخرجات من Node مُعدّ أو من كل Nodes المخرجات المطابقة

## البدء

اختر بين تشغيل ComfyUI على جهازك أو استخدام Comfy Cloud.

<Tabs>
  <Tab title="Local">
    **الأفضل لـ:** تشغيل مثيل ComfyUI الخاص بك على جهازك أو على شبكة LAN.

    <Steps>
      <Step title="تشغيل ComfyUI محليًا">
        تأكد من أن مثيل ComfyUI المحلي قيد التشغيل (القيمة الافتراضية هي `http://127.0.0.1:8188`).
      </Step>
      <Step title="تحضير JSON الخاص بسير العمل">
        صدّر أو أنشئ ملف JSON لسير عمل ComfyUI. دوّن معرّفات Node الخاصة بعقدة إدخال الموجّه وعقدة الإخراج التي تريد أن يقرأ OpenClaw منها.
      </Step>
      <Step title="إعداد الموفّر">
        اضبط `mode: "local"` ووجّه إلى ملف سير العمل. إليك مثالًا بسيطًا للصور:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
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
          },
        }
        ```
      </Step>
      <Step title="تعيين النموذج الافتراضي">
        وجّه OpenClaw إلى النموذج `comfy/workflow` للإمكانات التي قمت بإعدادها:

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
      <Step title="التحقق">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **الأفضل لـ:** تشغيل سير العمل على Comfy Cloud من دون إدارة موارد GPU محلية.

    <Steps>
      <Step title="الحصول على مفتاح API">
        سجّل في [comfy.org](https://comfy.org) وأنشئ مفتاح API من لوحة حسابك.
      </Step>
      <Step title="تعيين مفتاح API">
        وفّر المفتاح بإحدى الطرق التالية:

        ```bash
        # متغير بيئة (مفضل)
        export COMFY_API_KEY="your-key"

        # متغير بيئة بديل
        export COMFY_CLOUD_API_KEY="your-key"

        # أو مباشرة داخل الإعدادات
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="تحضير JSON الخاص بسير العمل">
        صدّر أو أنشئ ملف JSON لسير عمل ComfyUI. دوّن معرّفات Node الخاصة بعقدة إدخال الموجّه وعقدة الإخراج.
      </Step>
      <Step title="إعداد الموفّر">
        اضبط `mode: "cloud"` ووجّه إلى ملف سير العمل:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "cloud",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```

        <Tip>
        يستخدم وضع cloud القيمة الافتراضية `https://cloud.comfy.org` لـ `baseUrl`. لا تحتاج إلى ضبط `baseUrl` إلا إذا كنت تستخدم نقطة نهاية cloud مخصصة.
        </Tip>
      </Step>
      <Step title="تعيين النموذج الافتراضي">
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
      <Step title="التحقق">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## الإعدادات

يدعم comfy إعدادات اتصال مشتركة على المستوى الأعلى بالإضافة إلى أقسام سير عمل خاصة بكل قدرة (`image` و`video` و`music`):

```json5
{
  plugins: {
    entries: {
      comfy: {
        config: {
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
  },
}
```

### المفاتيح المشتركة

| المفتاح | النوع | الوصف |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode` | `"local"` or `"cloud"` | وضع الاتصال. |
| `baseUrl` | string | القيمة الافتراضية هي `http://127.0.0.1:8188` للوضع المحلي أو `https://cloud.comfy.org` لوضع cloud. |
| `apiKey` | string | مفتاح مضمن اختياري، بديل عن متغيرات البيئة `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | boolean | السماح باستخدام `baseUrl` خاص/على شبكة LAN في وضع cloud. |

### المفاتيح الخاصة بكل قدرة

تنطبق هذه المفاتيح داخل أقسام `image` أو `video` أو `music`:

| المفتاح | مطلوب | الافتراضي | الوصف |
| ---------------------------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `workflow` or `workflowPath` | نعم | -- | مسار ملف JSON لسير عمل ComfyUI. |
| `promptNodeId` | نعم | -- | معرّف Node الذي يستقبل موجّه النص. |
| `promptInputName` | لا | `"text"` | اسم الإدخال على Node الموجّه. |
| `outputNodeId` | لا | -- | معرّف Node الذي تُقرأ منه المخرجات. إذا تم حذفه، تُستخدم كل Nodes المخرجات المطابقة. |
| `pollIntervalMs` | لا | -- | فاصل الاستطلاع بالميلي ثانية لاكتمال المهمة. |
| `timeoutMs` | لا | -- | المهلة بالميلي ثانية لتشغيل سير العمل. |

يدعم قسما `image` و`video` أيضًا ما يلي:

| المفتاح | مطلوب | الافتراضي | الوصف |
| --------------------- | ------------------------------------ | --------- | --------------------------------------------------- |
| `inputImageNodeId` | نعم (عند تمرير صورة مرجعية) | -- | معرّف Node الذي يستقبل الصورة المرجعية المرفوعة. |
| `inputImageInputName` | لا | `"image"` | اسم الإدخال على Node الصورة. |

## تفاصيل سير العمل

<AccordionGroup>
  <Accordion title="Image workflows">
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

    لتمكين تحرير الصور باستخدام صورة مرجعية مرفوعة، أضف `inputImageNodeId` إلى إعدادات الصورة لديك:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
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
      },
    }
    ```

  </Accordion>

  <Accordion title="Video workflows">
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

    تدعم سير عمل الفيديو في Comfy تحويل النص إلى فيديو وتحويل الصورة إلى فيديو عبر الرسم البياني المُعد.

    <Note>
    لا يمرّر OpenClaw مقاطع فيديو الإدخال إلى سير عمل Comfy. المدخلات المدعومة هي موجّهات النصوص والصور المرجعية المفردة فقط.
    </Note>

  </Accordion>

  <Accordion title="Music workflows">
    يسجّل Plugin المضمّن موفّرًا لإنشاء الموسيقى من أجل مخرجات الصوت أو الموسيقى المعرّفة عبر سير العمل، ويتم عرضه عبر الأداة المشتركة `music_generate`:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    استخدم قسم إعدادات `music` للتوجيه إلى JSON الخاص بسير عمل الصوت وعقدة الإخراج.

  </Accordion>

  <Accordion title="Backward compatibility">
    ما زالت إعدادات الصور القديمة على المستوى الأعلى (من دون قسم `image` المتداخل) تعمل:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              workflowPath: "./workflows/flux-api.json",
              promptNodeId: "6",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

    يتعامل OpenClaw مع هذا الشكل القديم باعتباره إعدادات سير عمل الصور. لا تحتاج إلى الترحيل فورًا، لكن يُنصح باستخدام الأقسام المتداخلة `image` / `video` / `music` في الإعدادات الجديدة.

    <Tip>
    إذا كنت تستخدم إنشاء الصور فقط، فإن الإعدادات المسطحة القديمة وقسم `image` المتداخل الجديد متكافئان وظيفيًا.
    </Tip>

  </Accordion>

  <Accordion title="Live tests">
    توجد تغطية live اختيارية لـ Plugin المضمّن:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    يتخطى اختبار live الحالات الفردية للصور أو الفيديو أو الموسيقى ما لم يكن قسم سير عمل Comfy المطابق مُعدًا.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="إنشاء الصور" href="/ar/tools/image-generation" icon="image">
    إعدادات أداة إنشاء الصور وطريقة استخدامها.
  </Card>
  <Card title="إنشاء الفيديو" href="/ar/tools/video-generation" icon="video">
    إعدادات أداة إنشاء الفيديو وطريقة استخدامها.
  </Card>
  <Card title="إنشاء الموسيقى" href="/ar/tools/music-generation" icon="music">
    إعداد أداة إنشاء الموسيقى والصوت.
  </Card>
  <Card title="دليل الموفّرين" href="/ar/providers/index" icon="layers">
    نظرة عامة على جميع الموفّرين ومراجع النماذج.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    مرجع الإعدادات الكامل بما في ذلك الإعدادات الافتراضية للوكيل.
  </Card>
</CardGroup>
