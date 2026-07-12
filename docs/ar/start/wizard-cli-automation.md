---
read_when:
    - أنت تؤتمت الإعداد الأولي في البرامج النصية أو بيئة CI
    - تحتاج إلى أمثلة غير تفاعلية لموفّرين محددين
sidebarTitle: CLI automation
summary: الإعداد الموجّه بالبرامج وإعداد الوكيل لواجهة OpenClaw CLI
title: أتمتة CLI
x-i18n:
    generated_at: "2026-07-12T06:30:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de3115fd0c675b92f22cf9c44ddd307a854e499c6f163235f991368429b2c152
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

استخدم `openclaw onboard --non-interactive` لبرمجة الإعداد نصيًا. يتطلب هذا الخيار `--accept-risk`: إذ يمكن للإعداد غير التفاعلي كتابة بيانات الاعتماد وتهيئة البرنامج الخفي من دون مطالبة بالتأكيد، ولذلك تمثل هذه العلامة إقرارًا صريحًا بالمخاطر.

<Note>
لا يعني `--json` تفعيل الوضع غير التفاعلي. مرّر `--non-interactive --accept-risk` صراحةً في البرامج النصية.
</Note>

## مثال أساسي للإعداد غير التفاعلي

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-bootstrap \
  --skip-skills
```

أضف `--json` للحصول على ملخص قابل للقراءة آليًا.

- القيمة الافتراضية للخيار `--gateway-port` هي `18789`؛ لا تمرّره إلا لتجاوزها.
- يتخطى `--skip-bootstrap` إنشاء ملفات مساحة العمل الافتراضية، وذلك للأتمتة التي تجهّز مساحة عملها مسبقًا.
- يخزّن `--secret-input-mode ref` مرجعًا مدعومًا بمتغير بيئة (`{ source: "env", provider: "default", id: "<ENV_VAR>" }`) في ملف تعريف المصادقة بدلًا من المفتاح بنص صريح. في وضع `ref` غير التفاعلي، يجب أن يكون متغير بيئة المزوّد معيّنًا مسبقًا في بيئة العملية؛ إذ يفشل تمرير علامة مفتاح مضمّن دون متغير البيئة المطابق له فورًا.

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## أمثلة خاصة بالمزوّدين

<AccordionGroup>
  <Accordion title="مثال على مفتاح Anthropic API">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال على Cloudflare AI Gateway">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال على Gemini">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال على Mistral">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال على Moonshot">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال على Ollama">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال على OpenCode">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-bind loopback
    ```
    استبدله بـ `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` لاستخدام كتالوج Go.
  </Accordion>
  <Accordion title="مثال على Synthetic">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال على Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال على Z.AI">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال على مزوّد مخصص">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

    الخيار `--custom-api-key` اختياري؛ فبعض نقاط النهاية لا تتطلب مصادقة. عند حذفه، يتحقق الإعداد الأولي من `CUSTOM_API_KEY` في متغيرات البيئة. الخيار `--custom-provider-id` اختياري ويُشتق تلقائيًا من عنوان URL الأساسي عند حذفه. القيمة الافتراضية للخيار `--custom-compatibility` هي `openai` (القيم الأخرى: `openai-responses`، و`anthropic`).

    يستنتج OpenClaw دعم إدخال الصور من أنماط معرّفات نماذج الرؤية المعروفة (`gpt-4o`، و`claude-3/4`، و`gemini`، واللواحق `-vl`/`vision`، وما شابهها). أضف `--custom-image-input` لفرض تفعيله لنموذج رؤية غير معروف، أو `--custom-text-input` لفرض الإدخال النصي فقط.

    صيغة وضع المرجع، التي تخزّن `apiKey` بالشكل `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

  </Accordion>
</AccordionGroup>

تظل مصادقة رمز إعداد Anthropic مدعومة، لكن OpenClaw يفضّل إعادة استخدام Claude CLI عند توفر تسجيل دخول محلي إلى Claude CLI. للاستخدام الإنتاجي، يُفضّل استخدام مفتاح Anthropic API.

## إضافة وكيل آخر

ينشئ `openclaw agents add <name>` وكيلًا منفصلًا له مساحة عمل وجلسات وملفات تعريف مصادقة خاصة به. يؤدي تشغيله دون `--workspace` (ومن دون أي علامات أخرى) إلى بدء المعالج التفاعلي؛ أما تمرير أي من `--workspace` أو `--model` أو `--agent-dir` أو `--bind` أو `--non-interactive` فيشغّله بصورة غير تفاعلية، وعندئذ يصبح `--workspace` مطلوبًا.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

مفاتيح التهيئة التي يكتبها (إدخال `agents.list[]` لمعرّف الوكيل الجديد):

- `name`
- `workspace`
- `agentDir`
- `model` (فقط عند تمرير `--model`)

ملاحظات:

- مساحة العمل الافتراضية (عند حذف `--workspace` في المعالج التفاعلي): `~/.openclaw/workspace-<agentId>`.
- يمكن تكرار `--bind <channel[:accountId]>`؛ أضف ارتباطات لتوجيه الرسائل الواردة إلى الوكيل الجديد (ويمكن للمعالج أيضًا تنفيذ ذلك تفاعليًا).
- يُطبّع اسم الوكيل إلى معرّف وكيل صالح؛ والاسم `main` محجوز.

## مستندات ذات صلة

- مركز الإعداد الأولي: [الإعداد الأولي (CLI)](/ar/start/wizard)
- المرجع الكامل: [مرجع إعداد CLI](/ar/start/wizard-cli-reference)
- مرجع الأمر: [`openclaw onboard`](/ar/cli/onboard)
