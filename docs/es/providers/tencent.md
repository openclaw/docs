---
read_when:
    - Quieres usar la versión preliminar de Tencent Hy3 con OpenClaw
    - Necesitas configurar la clave de API de TokenHub
summary: Configuración de Tencent Cloud TokenHub para la vista previa de Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-06-27T12:44:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62bcdd795cc0334f409405fa7c369ed9966854616a89dbc7153f91ee349895ad
    source_path: providers/tencent.md
    workflow: 16
---

Instala el Plugin de proveedor oficial de Tencent Cloud para acceder a Tencent Hy3 preview mediante el endpoint TokenHub (`tencent-tokenhub`) usando una API compatible con OpenAI.

| Propiedad        | Valor                                                 |
| ---------------- | ----------------------------------------------------- |
| Id. de proveedor | `tencent-tokenhub`                                    |
| Paquete          | `@openclaw/tencent-provider`                          |
| Var. de entorno de autenticación | `TOKENHUB_API_KEY`                    |
| Opción de incorporación | `--auth-choice tokenhub-api-key`                |
| Opción directa de CLI | `--tokenhub-api-key <key>`                       |
| API              | Compatible con OpenAI (`openai-completions`)          |
| URL base predeterminada | `https://tokenhub.tencentmaas.com/v1`           |
| URL base global  | `https://tokenhub-intl.tencentmaas.com/v1` (sobrescritura) |
| Modelo predeterminado | `tencent-tokenhub/hy3-preview`                   |

## Inicio rápido

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/tencent-provider
    ```
  </Step>
  <Step title="Create a TokenHub API key">
    Crea una clave de API en Tencent Cloud TokenHub. Si eliges un alcance de acceso limitado para la clave, incluye **Hy3 preview** en los modelos permitidos.
  </Step>
  <Step title="Run onboarding">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Env only
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Verify the model">
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

| Ref. de modelo                  | Nombre                 | Entrada | Contexto | Salida máx. | Notas                      |
| ------------------------------ | ---------------------- | ------- | -------- | ----------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text    | 256,000  | 64,000      | Predeterminado; con razonamiento habilitado |

Hy3 preview es el gran modelo de lenguaje MoE Tencent Hunyuan para razonamiento, seguimiento de instrucciones de contexto largo, código y flujos de trabajo de agentes. Los ejemplos compatibles con OpenAI de Tencent usan `hy3-preview` como id. de modelo y admiten llamadas a herramientas estándar de chat-completions además de `reasoning_effort`.

<Tip>
  El id. de modelo es `hy3-preview`. No lo confundas con los modelos `HY-3D-*` de Tencent, que son API de generación 3D y no son el modelo de chat de OpenClaw configurado por este proveedor.
</Tip>

## Precios por niveles

El catálogo del proveedor incluye metadatos de coste por niveles que escalan con la longitud de la ventana de entrada, por lo que las estimaciones de coste se completan sin sobrescrituras manuales.

| Rango de tokens de entrada | Tarifa de entrada | Tarifa de salida | Lectura de caché |
| -------------------------- | ----------------- | ---------------- | ---------------- |
| 0 - 16,000                 | 0.176             | 0.587            | 0.059            |
| 16,000 - 32,000            | 0.235             | 0.939            | 0.088            |
| 32,000+                    | 0.293             | 1.173            | 0.117            |

Las tarifas son por millón de tokens en USD, según lo anunciado por Tencent. Sobrescribe los precios en `models.providers.tencent-tokenhub` solo cuando necesites una superficie diferente.

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Endpoint override">
    OpenClaw usa de forma predeterminada el endpoint de Tencent Cloud `https://tokenhub.tencentmaas.com/v1`. Tencent también documenta un endpoint internacional de TokenHub:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    Sobrescribe el endpoint solo cuando tu cuenta o región de TokenHub lo requiera.

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    Si el Gateway se ejecuta como un servicio administrado (launchd, systemd, Docker), `TOKENHUB_API_KEY` debe estar visible para ese proceso. Defínelo en `~/.openclaw/.env` o mediante `env.shellEnv` para que los entornos de ejecución de launchd, systemd o Docker puedan leerlo.

    <Warning>
      Las claves exportadas solo en una shell interactiva no son visibles para los procesos de gateway administrados. Usa el archivo de entorno o la vía de configuración para disponibilidad persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model providers" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, refs. de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Configuration reference" href="/es/gateway/configuration" icon="gear">
    Esquema de configuración completo, incluidos los ajustes de proveedor.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Página del producto TokenHub de Tencent Cloud.
  </Card>
  <Card title="Hy3 preview model card" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Detalles y benchmarks de Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
