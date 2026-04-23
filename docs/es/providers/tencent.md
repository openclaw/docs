---
read_when:
    - Quieres usar modelos Hy de Tencent con OpenClaw
    - Necesitas la configuración de la clave de API de TokenHub
summary: Configuración de Tencent Cloud TokenHub
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-23T05:20:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04da073973792c55dc0c2d287bfc51187bb2128bbbd5c4a483f850adeea50ab5
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub)

El proveedor Tencent Cloud da acceso a modelos Hy mediante el endpoint de TokenHub
(`tencent-tokenhub`).

El proveedor usa una API compatible con OpenAI.

## Inicio rápido

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

## Ejemplo no interactivo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Proveedores y endpoints

| Proveedor          | Endpoint                      | Caso de uso             |
| ------------------ | ----------------------------- | ----------------------- |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Hy mediante Tencent TokenHub |

## Modelos disponibles

### tencent-tokenhub

- **hy3-preview** — Vista previa de Hy3 (contexto de 256K, razonamiento, predeterminado)

## Notas

- Las referencias de modelo de TokenHub usan `tencent-tokenhub/<modelId>`.
- Reemplaza los metadatos de precio y contexto en `models.providers` si es necesario.

## Nota de entorno

Si Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `TOKENHUB_API_KEY`
esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
`env.shellEnv`).

## Documentación relacionada

- [Configuración de OpenClaw](/es/gateway/configuration)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
