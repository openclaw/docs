---
read_when:
    - Quieres usar la vista previa de Tencent Hy3 con OpenClaw
    - Necesitas la configuración de la clave API de TokenHub
summary: Configuración de Tencent Cloud TokenHub para vista previa de Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-24T05:46:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: c64afffc66dccca256ec658235ae1fbc18e46608b594bc07875118f54b2a494d
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud TokenHub

Tencent Cloud se distribuye como **Plugin de proveedor incluido** en OpenClaw. Proporciona acceso a la vista previa de Tencent Hy3 mediante el endpoint de TokenHub (`tencent-tokenhub`).

El proveedor usa una API compatible con OpenAI.

| Propiedad     | Valor                                      |
| ------------- | ------------------------------------------ |
| Proveedor     | `tencent-tokenhub`                         |
| Modelo predeterminado | `tencent-tokenhub/hy3-preview`     |
| Autenticación | `TOKENHUB_API_KEY`                         |
| API           | Finalizaciones de chat compatibles con OpenAI |
| URL base      | `https://tokenhub.tencentmaas.com/v1`      |
| URL global    | `https://tokenhub-intl.tencentmaas.com/v1` |

## Inicio rápido

<Steps>
  <Step title="Crear una clave API de TokenHub">
    Crea una clave API en Tencent Cloud TokenHub. Si eliges un alcance de acceso limitado para la clave, incluye **Hy3 preview** en los modelos permitidos.
  </Step>
  <Step title="Ejecutar la incorporación">
    ```bash
    openclaw onboard --auth-choice tokenhub-api-key
    ```
  </Step>
  <Step title="Verificar el modelo">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Configuración no interactiva

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catálogo integrado

| Referencia de modelo             | Nombre                   | Entrada | Contexto | Salida máxima | Notas                         |
| -------------------------------- | ------------------------ | ------- | -------- | ------------- | ----------------------------- |
| `tencent-tokenhub/hy3-preview`   | Vista previa de Hy3 (TokenHub) | text | 256,000  | 64,000        | Predeterminado; razonamiento habilitado |

Hy3 preview es el gran modelo de lenguaje MoE de Tencent Hunyuan para razonamiento, seguimiento de instrucciones de contexto largo, código y flujos de trabajo de agentes. Los ejemplos compatibles con OpenAI de Tencent usan `hy3-preview` como id del modelo y admiten llamadas estándar a herramientas de finalización de chat más `reasoning_effort`.

<Tip>
El id del modelo es `hy3-preview`. No lo confundas con los modelos `HY-3D-*` de Tencent, que son API de generación 3D y no el modelo de chat de OpenClaw configurado por este proveedor.
</Tip>

## Sobrescritura de endpoint

OpenClaw usa por defecto el endpoint `https://tokenhub.tencentmaas.com/v1` de Tencent Cloud. Tencent también documenta un endpoint internacional de TokenHub:

```bash
openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
```

Sobrescribe el endpoint solo cuando tu cuenta o región de TokenHub lo requiera.

## Notas

- Las referencias de modelo de TokenHub usan `tencent-tokenhub/<modelId>`.
- El catálogo incluido actualmente incluye `hy3-preview`.
- El Plugin marca Hy3 preview como compatible con razonamiento y con uso de streaming.
- El Plugin se distribuye con metadatos escalonados de precios de Hy3, por lo que las estimaciones de coste se rellenan sin sobrescrituras manuales de precios.
- Sobrescribe precios, contexto o metadatos de endpoint en `models.providers` solo cuando sea necesario.

## Nota sobre el entorno

Si Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `TOKENHUB_API_KEY`
esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
`env.shellEnv`).

## Documentación relacionada

- [Configuración de OpenClaw](/es/gateway/configuration)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Página del producto Tencent TokenHub](https://cloud.tencent.com/product/tokenhub)
- [Generación de texto de Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130079)
- [Configuración de Tencent TokenHub Cline para Hy3 preview](https://cloud.tencent.com/document/product/1823/130932)
- [Tarjeta del modelo Tencent Hy3 preview](https://huggingface.co/tencent/Hy3-preview)
