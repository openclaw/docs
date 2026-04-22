---
read_when:
    - تريد استخدام نماذج Tencent Hy مع OpenClaw
    - تحتاج إلى إعداد مفتاح API الخاص بـ TokenHub
summary: إعداد Tencent Cloud TokenHub
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-22T07:18:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04da073973792c55dc0c2d287bfc51187bb2128bbbd5c4a483f850adeea50ab5
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub)

يتيح مزود Tencent Cloud الوصول إلى نماذج Tencent Hy عبر نقطة نهاية TokenHub
(`tencent-tokenhub`).

يستخدم المزود واجهة API متوافقة مع OpenAI.

## البدء السريع

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

## مثال غير تفاعلي

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## المزودون ونقاط النهاية

| المزود             | نقطة النهاية                  | حالة الاستخدام           |
| ------------------ | ----------------------------- | ------------------------ |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Hy عبر Tencent TokenHub |

## النماذج المتاحة

### tencent-tokenhub

- **hy3-preview** — معاينة Hy3 ‏(سياق 256K، reasoning، افتراضي)

## ملاحظات

- تستخدم مراجع نماذج TokenHub الصيغة `tencent-tokenhub/<modelId>`.
- تجاوز بيانات التسعير وبيانات السياق الوصفية في `models.providers` عند الحاجة.

## ملاحظة حول البيئة

إذا كانت Gateway تعمل كخدمة daemon ‏(`launchd/systemd`)، فتأكد من أن `TOKENHUB_API_KEY`
متاح لتلك العملية (على سبيل المثال، في `~/.openclaw/.env` أو عبر
`env.shellEnv`).

## الوثائق ذات الصلة

- [إعدادات OpenClaw](/ar/gateway/configuration)
- [مزودو النماذج](/ar/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
