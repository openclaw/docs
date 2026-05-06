---
read_when:
    - Quieres usar la versión preliminar de Tencent Hy3 con OpenClaw
    - Necesitas configurar la clave de API de TokenHub
summary: Configuración de Tencent Cloud TokenHub para la vista previa de Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-05-06T05:47:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: a194e10b0e77e2567e6835f08d1cc0fa2a32fa8d37b1851fb83024b172a03fe3
    source_path: providers/tencent.md
    workflow: 16
---

Tencent Cloud se distribuye como un Plugin proveedor incluido en OpenClaw. Proporciona acceso a Tencent Hy3 preview mediante el endpoint TokenHub (`tencent-tokenhub`) usando una API compatible con OpenAI.

| Propiedad        | Valor                                                 |
| ---------------- | ----------------------------------------------------- |
| ID de proveedor  | `tencent-tokenhub`                                    |
| Plugin           | incluido, `enabledByDefault: true`                    |
| Variable env de autenticación | `TOKENHUB_API_KEY`                        |
| Flag de onboarding | `--auth-choice tokenhub-api-key`                    |
| Flag directo de CLI | `--tokenhub-api-key <key>`                         |
| API              | compatible con OpenAI (`openai-completions`)          |
| URL base predeterminada | `https://tokenhub.tencentmaas.com/v1`          |
| URL base global  | `https://tokenhub-intl.tencentmaas.com/v1` (sobrescritura) |
| Modelo predeterminado | `tencent-tokenhub/hy3-preview`                   |

## Inicio rápido

<Steps>
  <Step title="Crea una clave de API de TokenHub">
    Crea una clave de API en Tencent Cloud TokenHub. Si eliges un ámbito de acceso limitado para la clave, incluye **Hy3 preview** en los modelos permitidos.
  </Step>
  <Step title="Ejecuta el onboarding">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Flag directo
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Solo env
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Verifica el modelo">
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

| Ref. de modelo                  | Nombre                 | Entrada | Contexto | Salida máxima | Notas                      |
| ------------------------------ | ---------------------- | ------- | -------- | ------------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | texto   | 256,000  | 64,000        | Predeterminado; con razonamiento habilitado |

Hy3 preview es el modelo de lenguaje MoE grande de Tencent Hunyuan para razonamiento, seguimiento de instrucciones con contexto largo, código y flujos de trabajo de agentes. Los ejemplos compatibles con OpenAI de Tencent usan `hy3-preview` como ID de modelo y admiten llamadas a herramientas estándar de chat completions, además de `reasoning_effort`.

<Tip>
  El ID del modelo es `hy3-preview`. No lo confundas con los modelos `HY-3D-*` de Tencent, que son API de generación 3D y no son el modelo de chat de OpenClaw configurado por este proveedor.
</Tip>

## Precios por niveles

El catálogo incluido se distribuye con metadatos de coste por niveles que escalan con la longitud de la ventana de entrada, por lo que las estimaciones de coste se completan sin sobrescrituras manuales.

| Rango de tokens de entrada | Tarifa de entrada | Tarifa de salida | Lectura de caché |
| ------------------------- | ----------------- | ---------------- | ---------------- |
| 0 - 16,000                | 0.176             | 0.587            | 0.059            |
| 16,000 - 32,000           | 0.235             | 0.939            | 0.088            |
| 32,000+                   | 0.293             | 1.173            | 0.117            |

Las tarifas son por millón de tokens en USD, según lo anunciado por Tencent. Sobrescribe los precios en `models.providers.tencent-tokenhub` solo cuando necesites una superficie diferente.

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Sobrescritura de endpoint">
    OpenClaw usa de forma predeterminada el endpoint de Tencent Cloud `https://tokenhub.tencentmaas.com/v1`. Tencent también documenta un endpoint internacional de TokenHub:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    Sobrescribe el endpoint solo cuando tu cuenta o región de TokenHub lo requiera.

  </Accordion>

  <Accordion title="Disponibilidad del entorno para el daemon">
    Si el Gateway se ejecuta como un servicio administrado (launchd, systemd, Docker), `TOKENHUB_API_KEY` debe ser visible para ese proceso. Configúralo en `~/.openclaw/.env` o mediante `env.shellEnv` para que los entornos de launchd, systemd o Docker exec puedan leerlo.

    <Warning>
      Las claves configuradas solo en `~/.profile` no son visibles para los procesos de Gateway administrados. Usa el archivo env o la vía de configuración para una disponibilidad persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, refs. de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration" icon="gear">
    Esquema de configuración completo, incluidos los ajustes de proveedor.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Página de producto TokenHub de Tencent Cloud.
  </Card>
  <Card title="Ficha del modelo Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Detalles y benchmarks de Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
