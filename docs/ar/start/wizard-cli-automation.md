---
read_when:
    - أنت تقوم بأتمتة الإعداد الأولي في البرامج النصية أو CI
    - أنت بحاجة إلى أمثلة غير تفاعلية لمزوّدين محددين
sidebarTitle: CLI automation
summary: الإعداد الأولي البرمجي وإعداد الوكيل لـ CLI الخاص بـ OpenClaw
title: أتمتة CLI
x-i18n:
    generated_at: "2026-04-25T18:23:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 50b6ef35554ec085012a84b8abb8d52013934ada5293d941babea56eaacf4a9f
    source_path: start/wizard-cli-automation.md
    workflow: 15
---

استخدم `--non-interactive` لأتمتة `openclaw onboard`.

<Note>
لا يؤدي `--json` إلى تفعيل الوضع غير التفاعلي تلقائيًا. استخدم `--non-interactive` (و`--workspace`) في البرامج النصية.
</Note>

## مثال أساسي غير تفاعلي

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-bootstrap \
  --skip-skills
```

أضف `--json` للحصول على ملخص قابل للقراءة آليًا.

استخدم `--skip-bootstrap` عندما تكون الأتمتة لديك قد جهّزت ملفات مساحة العمل مسبقًا ولا تريد من الإعداد الأولي إنشاء ملفات bootstrap الافتراضية.

استخدم `--secret-input-mode ref` لتخزين مراجع مدعومة بالبيئة في ملفات تعريف المصادقة بدلًا من القيم النصية الصريحة.
يتوفر الاختيار التفاعلي بين مراجع env ومراجع المزوّد المكوّنة (`file` أو `exec`) في تدفق الإعداد الأولي.

في وضع `ref` غير التفاعلي، يجب ضبط متغيرات البيئة الخاصة بالمزوّد في بيئة العملية.
وأصبح تمرير رايات المفاتيح المضمنة من دون متغير البيئة المطابق يؤدي الآن إلى فشل سريع.

مثال:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## أمثلة خاصة بكل مزوّد

<AccordionGroup>
  <Accordion title="مثال مفتاح Anthropic API">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال Gemini">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال Z.AI">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال Cloudflare AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال Moonshot">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال Mistral">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال Synthetic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال OpenCode">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    بدّل إلى `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` لاستخدام كتالوج Go.
  </Accordion>
  <Accordion title="مثال Ollama">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="مثال مزوّد مخصص">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    القيمة `--custom-api-key` اختيارية. وإذا حُذفت، يتحقق الإعداد الأولي من `CUSTOM_API_KEY`.

    صيغة وضع ref:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    في هذا الوضع، يخزن الإعداد الأولي `apiKey` على هيئة `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.

  </Accordion>
</AccordionGroup>

لا يزال رمز إعداد Anthropic setup-token متاحًا كمسار رمز مدعوم في الإعداد الأولي، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI عند توفره.
وفي الإنتاج، يُفضَّل استخدام مفتاح Anthropic API.

## إضافة وكيل آخر

استخدم `openclaw agents add <name>` لإنشاء وكيل منفصل له مساحة عمله الخاصة،
وجلساته، وملفات تعريف المصادقة الخاصة به. ويؤدي التشغيل من دون `--workspace` إلى فتح المعالج.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

ما الذي يضبطه:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

ملاحظات:

- تتبع مساحات العمل الافتراضية النمط `~/.openclaw/workspace-<agentId>`.
- أضف `bindings` لتوجيه الرسائل الواردة (يمكن للمعالج تنفيذ ذلك).
- الرايات غير التفاعلية: `--model` و`--agent-dir` و`--bind` و`--non-interactive`.

## مستندات ذات صلة

- محور الإعداد الأولي: [الإعداد الأولي (CLI)](/ar/start/wizard)
- المرجع الكامل: [مرجع إعداد CLI](/ar/start/wizard-cli-reference)
- مرجع الأوامر: [`openclaw onboard`](/ar/cli/onboard)
