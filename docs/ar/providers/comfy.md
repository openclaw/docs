---
read_when:
    - تريد استخدام سير عمل ComfyUI المحلية مع OpenClaw
    - تريد استخدام Comfy Cloud مع تدفقات عمل الصور أو الفيديو أو الموسيقى
    - تحتاج إلى مفاتيح إعدادات Plugin ‏comfy المضمّن
summary: إعداد سير عمل ComfyUI لتوليد الصور ومقاطع الفيديو والموسيقى في OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-07-12T06:21:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74150d202a422de8e0f4b2b82d5d12bd42eb46991e8ef688832208e1a2ff7793
    source_path: providers/comfy.md
    workflow: 16
---

يأتي OpenClaw مزودًا بـ plugin مضمّن باسم `comfy` لتشغيل ComfyUI المعتمد على تدفقات العمل. يعتمد
الـ plugin بالكامل على تدفقات العمل: لا يربط OpenClaw عناصر التحكم العامة مثل `size` أو
`aspectRatio` أو `resolution` أو `durationSeconds` أو عناصر التحكم المشابهة لـ TTS
بمخططك.

| الخاصية        | التفاصيل                                                                         |
| -------------- | -------------------------------------------------------------------------------- |
| المزوّد        | `comfy`                                                                          |
| النموذج        | `comfy/workflow`                                                                 |
| الأدوات المشتركة | `image_generate`, `video_generate`, `music_generate`                             |
| المصادقة       | لا توجد لـ ComfyUI المحلي؛ `COMFY_API_KEY` أو `COMFY_CLOUD_API_KEY` لـ Comfy Cloud |
| API            | ‏ComfyUI‏ `/prompt` / `/history` / `/view`؛ ‏Comfy Cloud‏ `/api/*`                   |

## الإمكانات المدعومة

- إنشاء الصور وتحريرها من ملف JSON لتدفق العمل (يتطلب التحرير صورة مرجعية واحدة مرفوعة)
- إنشاء الفيديو من ملف JSON لتدفق العمل، إما من نص إلى فيديو أو من صورة إلى فيديو (صورة مرجعية واحدة)
- إنشاء الموسيقى/الصوت عبر الأداة المشتركة `music_generate`، مع صورة مرجعية واحدة اختيارية
- تنزيل المخرجات من Node مُعدّة، أو من جميع Nodes المطابقة للمخرجات عند عدم إعداد أي Node

## بدء الاستخدام

اختر بين تشغيل ComfyUI على جهازك أو استخدام Comfy Cloud.

<Tabs>
  <Tab title="محلي">
    **الأنسب لـ:** تشغيل مثيل ComfyUI خاص بك على جهازك أو شبكتك المحلية.

    <Steps>
      <Step title="تشغيل ComfyUI محليًا">
        تأكد من تشغيل مثيل ComfyUI المحلي لديك (القيمة الافتراضية هي `http://127.0.0.1:8188`).
      </Step>
      <Step title="إعداد ملف JSON لتدفق العمل">
        صدّر أو أنشئ ملف JSON لتدفق عمل ComfyUI. دوّن معرّفات Nodes الخاصة بـ Node إدخال الموجّه وNode المخرجات التي تريد أن يقرأ منها OpenClaw.
      </Step>
      <Step title="إعداد المزوّد">
        اضبط `mode: "local"` وأشر إلى ملف تدفق العمل. مثال أدنى للصور:

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
        وجّه OpenClaw إلى النموذج `comfy/workflow` للإمكانات التي أعددتها:

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
    **الأنسب لـ:** تشغيل تدفقات العمل على Comfy Cloud دون إدارة موارد GPU محلية.

    <Steps>
      <Step title="الحصول على مفتاح API">
        سجّل في [comfy.org](https://comfy.org) وأنشئ مفتاح API من لوحة معلومات حسابك.
      </Step>
      <Step title="تعيين مفتاح API">
        وفّر مفتاحك باستخدام أي من الطرق التالية:

        ```bash
        # Onboarding flag
        openclaw onboard --comfy-api-key "your-key"

        # Environment variable (preferred for daemons)
        export COMFY_API_KEY="your-key"

        # Alternative environment variable
        export COMFY_CLOUD_API_KEY="your-key"

        # Or inline in config
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="إعداد ملف JSON لتدفق العمل">
        صدّر أو أنشئ ملف JSON لتدفق عمل ComfyUI. دوّن معرّفات Nodes الخاصة بـ Node إدخال الموجّه وNode المخرجات.
      </Step>
      <Step title="إعداد المزوّد">
        اضبط `mode: "cloud"` وأشر إلى ملف تدفق العمل:

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
        يعيّن وضع السحابة القيمة الافتراضية لـ `baseUrl` إلى `https://cloud.comfy.org`. عيّن `baseUrl` فقط لنقطة نهاية سحابية مخصصة.
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

## الإعداد

يدعم Comfy إعدادات اتصال مشتركة من المستوى الأعلى، بالإضافة إلى أقسام تدفق عمل خاصة بكل إمكانية (`image` و`video` و`music`):

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

| المفتاح               | النوع                  | الوصف                                                                                  |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` أو `"cloud"` | وضع الاتصال. القيمة الافتراضية هي `"local"`.                                               |
| `baseUrl`             | سلسلة نصية             | القيمة الافتراضية هي `http://127.0.0.1:8188` للوضع المحلي أو `https://cloud.comfy.org` للوضع السحابي. |
| `apiKey`              | سلسلة نصية             | مفتاح مضمن اختياري، بديل لمتغيرَي البيئة `COMFY_API_KEY` و`COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | قيمة منطقية            | السماح بعنوان `baseUrl` خاص/ضمن الشبكة المحلية في الوضع السحابي أو باسم نطاق مؤهل بالكامل عبر DNS خاص محلي. |

<Note>
في الوضع `local`، تعمل عناوين IP الحرفية الخاصة أو الخاصة بـ local loopback وأسماء الخدمات أحادية التسمية مثل `http://comfyui:8188` دون `allowPrivateNetwork`. تتطلب أسماء النطاقات المؤهلة بالكامل التي تبدو عامة لكنها تستخدم DNS خاصًا، مثل `https://comfy.local.example.com`، تعيين `allowPrivateNetwork: true`. تظل الثقة بالمصدر الخاص مقتصرة على المخطط واسم المضيف والمنفذ المُعدّة؛ لا يمكن لعمليات إعادة التوجيه المحلية مغادرة اسم المضيف المُعدّ، بينما تُفحص عمليات إعادة التوجيه السحابية إلى شبكات CDN العامة باستخدام سياسة SSRF الافتراضية.
</Note>

### المفاتيح الخاصة بكل إمكانية

تُطبّق هذه المفاتيح داخل أقسام `image` أو `video` أو `music`:

| المفتاح                      | مطلوب    | الافتراضي | الوصف                                                                       |
| ---------------------------- | -------- | --------- | --------------------------------------------------------------------------- |
| `workflow` أو `workflowPath` | نعم      | --        | ملف JSON مضمن لتدفق العمل، أو مسار ملف JSON لتدفق عمل ComfyUI.             |
| `promptNodeId`               | نعم      | --        | معرّف Node التي تستقبل الموجّه النصي.                                       |
| `promptInputName`            | لا       | `"text"`  | اسم الإدخال في Node الموجّه.                                                |
| `outputNodeId`               | لا       | --        | معرّف Node التي تُقرأ منها المخرجات. إذا حُذف، تُستخدم جميع Nodes المطابقة للمخرجات. |
| `pollIntervalMs`             | لا       | `1500`    | الفاصل الزمني للاستقصاء بالمللي ثانية حتى اكتمال المهمة.                    |
| `timeoutMs`                  | لا       | `300000`  | المهلة بالمللي ثانية لتشغيل تدفق العمل.                                     |

يدعم قسما `image` و`video` أيضًا Node إدخال لصورة مرجعية:

| المفتاح              | مطلوب                                  | الافتراضي | الوصف                                             |
| -------------------- | -------------------------------------- | --------- | ------------------------------------------------- |
| `inputImageNodeId`    | نعم (عند تمرير صورة مرجعية)            | --        | معرّف Node التي تستقبل الصورة المرجعية المرفوعة. |
| `inputImageInputName` | لا                                     | `"image"` | اسم الإدخال في Node الصورة.                       |

يقبل `apiKey` إما سلسلة نصية حرفية أو كائن [مرجع سرّي](/ar/gateway/configuration-reference#secrets).

## تفاصيل تدفق العمل

<AccordionGroup>
  <Accordion title="تدفقات عمل الصور">
    عيّن نموذج الصور الافتراضي إلى `comfy/workflow`:

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

    لتمكين تحرير الصور باستخدام صورة مرجعية مرفوعة، أضف `inputImageNodeId` إلى إعدادات الصور:

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

  <Accordion title="تدفقات عمل الفيديو">
    عيّن نموذج الفيديو الافتراضي إلى `comfy/workflow`:

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

    تدعم تدفقات عمل الفيديو في Comfy التحويل من نص إلى فيديو ومن صورة إلى فيديو عبر المخطط المُعدّ.

    <Note>
    لا يمرر OpenClaw مقاطع فيديو مُدخلة إلى تدفقات عمل Comfy. لا تُدعم كمدخلات سوى الموجّهات النصية والصور المرجعية المفردة.
    </Note>

  </Accordion>

  <Accordion title="تدفقات عمل الموسيقى">
    يسجّل الـ plugin المضمّن مزوّدًا لإنشاء الموسيقى للمخرجات الصوتية أو الموسيقية التي يحددها تدفق العمل، ويُتاح ذلك عبر الأداة المشتركة `music_generate`. يقبل صورة مرجعية اختيارية (بحد أقصى صورة واحدة):

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    استخدم قسم الإعداد `music` للإشارة إلى ملف JSON لتدفق العمل الصوتي وNode المخرجات.

  </Accordion>

  <Accordion title="التوافق مع الإصدارات السابقة">
    تظل إعدادات الصور الحالية من المستوى الأعلى (من دون قسم `image` المتداخل) صالحة:

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

    يتعامل OpenClaw مع هذا الشكل القديم بوصفه إعدادات تدفق عمل الصور. لا تحتاج إلى الترحيل فورًا، لكن يُوصى باستخدام أقسام `image` و`video` و`music` المتداخلة للإعدادات الجديدة. إذا كنت تستخدم إنشاء الصور فقط، فإن الإعداد المسطح القديم وقسم `image` المتداخل الجديد متكافئان وظيفيًا.

  </Accordion>

  <Accordion title="الاختبارات المباشرة">
    تتوفر تغطية مباشرة اختيارية للـ plugin المضمّن:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    يتخطى الاختبار المباشر حالات الصور أو الفيديو أو الموسيقى الفردية ما لم يكن قسم سير عمل Comfy المطابق مهيأً.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="توليد الصور" href="/ar/tools/image-generation" icon="image">
    تهيئة أداة توليد الصور واستخدامها.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    تهيئة أداة توليد الفيديو واستخدامها.
  </Card>
  <Card title="توليد الموسيقى" href="/ar/tools/music-generation" icon="music">
    إعداد أداة توليد الموسيقى والصوت.
  </Card>
  <Card title="دليل المزوّدين" href="/ar/providers/index" icon="layers">
    نظرة عامة على جميع المزوّدين ومراجع النماذج.
  </Card>
  <Card title="مرجع التهيئة" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    مرجع التهيئة الكامل، بما في ذلك الإعدادات الافتراضية للوكلاء.
  </Card>
</CardGroup>
