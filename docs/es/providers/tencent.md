---
read_when:
    - Quieres usar la versión preliminar de Tencent Hy3 con OpenClaw
    - Necesitas la configuración de la clave de API de TokenHub
summary: Configuración de Tencent Cloud TokenHub para la vista previa de Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-07-05T11:39:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d9d0b046ba7f28035048f3b9cd42efa6c1bb7977c67e15fe4a957a8d2c5872c
    source_path: providers/tencent.md
    workflow: 16
---

Instala el plugin proveedor oficial de Tencent Cloud para acceder a la vista previa de Tencent Hy3 mediante el endpoint de TokenHub (`tencent-tokenhub`) usando una API compatible con OpenAI.

| Propiedad        | Valor                                    |
| --------------- | ---------------------------------------- |
| Id. del proveedor | `tencent-tokenhub`                     |
| Paquete         | `@openclaw/tencent-provider`             |
| Variable de entorno de autenticación | `TOKENHUB_API_KEY`     |
| Flag de incorporación | `--auth-choice tokenhub-api-key`    |
| Flag directo de CLI | `--tokenhub-api-key <key>`            |
| API             | Compatible con OpenAI (`openai-completions`) |
| URL base        | `https://tokenhub.tencentmaas.com/v1`    |
| Modelo predeterminado | `tencent-tokenhub/hy3-preview`      |

## Inicio rápido

<Steps>
  <Step title="Instala el plugin">
    ```bash
    openclaw plugins install @openclaw/tencent-provider
    ```
  </Step>
  <Step title="Crea una clave de API de TokenHub">
    Crea una clave de API en Tencent Cloud TokenHub. Si eliges un alcance de acceso limitado para la clave, incluye **Hy3 preview** en los modelos permitidos.
  </Step>
  <Step title="Ejecuta la incorporación">
    <CodeGroup>

```bash Incorporación
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

<Note>
`--accept-risk` es obligatorio junto con `--non-interactive`.
</Note>

## Catálogo integrado

| Ref. del modelo                 | Nombre                 | Entrada | Contexto | Salida máxima | Notas                      |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | texto | 256,000 | 64,000     | Predeterminado; con razonamiento habilitado |

Hy3 preview es el modelo de lenguaje MoE grande de Tencent Hunyuan para razonamiento, seguimiento de instrucciones con contexto largo, código y flujos de trabajo de agentes. Admite llamadas a herramientas estándar de chat completions además de `reasoning_effort`.

<Tip>
  El id. del modelo es `hy3-preview`. No lo confundas con los modelos `HY-3D-*` de Tencent, que son API de generación 3D y no son el modelo de chat de OpenClaw configurado por este proveedor.
</Tip>

## Precios por tramos

El catálogo del proveedor incluye metadatos de coste por tramos que escalan con la longitud de la ventana de entrada, de modo que las estimaciones de coste se rellenan sin anulaciones manuales.

| Rango de tokens de entrada | Tarifa de entrada | Tarifa de salida | Lectura de caché |
| ------------------ | ---------- | ----------- | ---------- |
| 0 - 16,000         | 0.176      | 0.587       | 0.059      |
| 16,000 - 32,000    | 0.235      | 0.939       | 0.088      |
| 32,000+            | 0.293      | 1.173       | 0.117      |

Las tarifas son por millón de tokens en USD, según lo anunciado por Tencent. Anula los precios en `models.providers.tencent-tokenhub` solo cuando necesites una superficie distinta.

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Anulación del endpoint">
    El catálogo integrado de OpenClaw usa el endpoint `https://tokenhub.tencentmaas.com/v1` de Tencent Cloud. Anúlalo solo si tu cuenta o región de TokenHub requiere uno diferente:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="Disponibilidad del entorno para el daemon">
    Si el Gateway se ejecuta como un servicio gestionado (launchd, systemd, Docker), `TOKENHUB_API_KEY` debe ser visible para ese proceso. Configúralo en `~/.openclaw/.env` o mediante `env.shellEnv` para que los entornos de launchd, systemd o Docker exec puedan leerlo.

    <Warning>
      Las claves exportadas solo en una shell interactiva no son visibles para los procesos de gateway gestionados. Usa el archivo env o la unión de configuración para disponibilidad persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema de configuración completo, incluidos los ajustes de proveedores.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Página del producto TokenHub de Tencent Cloud.
  </Card>
  <Card title="Ficha del modelo Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Detalles y benchmarks de Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
