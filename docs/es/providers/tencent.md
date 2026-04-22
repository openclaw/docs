---
read_when:
    - Quieres usar modelos Tencent Hy con OpenClaw
    - Necesitas la clave de API de TokenHub o la configuración del plan de tokens (LKEAP)
summary: Configuración de Tencent Cloud TokenHub y del plan de tokens (claves separadas)
title: Tencent Cloud (TokenHub + plan de tokens)
x-i18n:
    generated_at: "2026-04-22T05:11:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0f04fcfcb6e14b17c3bc8f3c7ca3f20f8dabfaa89813a0566c0672439d4afff
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub + plan de tokens)

El proveedor de Tencent Cloud da acceso a los modelos Tencent Hy mediante dos endpoints
con claves de API separadas:

- **TokenHub** (`tencent-tokenhub`) — llama a Hy mediante Tencent TokenHub Gateway
- **Plan de tokens** (`tencent-token-plan`) — llama a Hy mediante el endpoint del
  plan de tokens de LKEAP

Ambos proveedores usan APIs compatibles con OpenAI.

## Inicio rápido

TokenHub:

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

Plan de tokens:

```bash
openclaw onboard --auth-choice tencent-token-plan-api-key
```

## Ejemplo no interactivo

```bash
# TokenHub
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk

# Plan de tokens
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tencent-token-plan-api-key \
  --tencent-token-plan-api-key "$LKEAP_API_KEY" \
  --skip-health \
  --accept-risk
```

## Proveedores y endpoints

| Proveedor            | Endpoint                              | Caso de uso             |
| -------------------- | ------------------------------------- | ----------------------- |
| `tencent-tokenhub`   | `tokenhub.tencentmaas.com/v1`         | Hy mediante Tencent TokenHub |
| `tencent-token-plan` | `api.lkeap.cloud.tencent.com/plan/v3` | Hy mediante el plan de tokens de LKEAP |

Cada proveedor usa su propia clave de API. La configuración registra solo el proveedor seleccionado.

## Modelos disponibles

### tencent-tokenhub

- **hy3-preview** — vista previa de Hy3 (contexto de 256K, razonamiento, predeterminado)

### tencent-token-plan

- **hy3-preview** — vista previa de Hy3 (contexto de 256K, razonamiento, predeterminado)

## Notas

- Las referencias de modelo de TokenHub usan `tencent-tokenhub/<modelId>`. Las referencias de modelo del plan de tokens
  usan `tencent-token-plan/<modelId>`.
- Sobrescribe los metadatos de precios y contexto en `models.providers` si es necesario.

## Nota sobre el entorno

Si el Gateway se ejecuta como un daemon (`launchd`/`systemd`), asegúrate de que `TOKENHUB_API_KEY`
o `LKEAP_API_KEY` esté disponible para ese proceso (por ejemplo, en
`~/.openclaw/.env` o mediante `env.shellEnv`).

## Documentación relacionada

- [Configuración de OpenClaw](/es/gateway/configuration)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
- [API del plan de tokens de Tencent](https://cloud.tencent.com/document/product/1823/130060)
