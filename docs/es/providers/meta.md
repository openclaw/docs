---
read_when:
    - Quieres usar Meta con OpenClaw
    - Necesitas la variable de entorno MODEL_API_KEY o elegir la autenticación de la CLI
summary: Configuración de Meta (autenticación + selección del modelo muse-spark-1.1)
title: Metadatos
x-i18n:
    generated_at: "2026-07-11T23:26:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2ce7616d9abc14a2d15ee53ea7725d3e70059af1a38bb61dbfe5b3969106432
    source_path: providers/meta.md
    workflow: 16
---

La **API de Meta** utiliza la **API Responses** compatible con OpenAI (`POST /v1/responses`)
para el modelo de razonamiento `muse-spark-1.1`. El proveedor se distribuye como un
Plugin incluido con OpenClaw.

| Propiedad                | Valor                              |
| ------------------------ | ---------------------------------- |
| Id. del proveedor        | `meta`                             |
| Plugin                   | proveedor incluido                 |
| Variable de entorno de autenticación | `MODEL_API_KEY`          |
| Opción de incorporación  | `--auth-choice meta-api-key`       |
| Opción directa de la CLI | `--meta-api-key <key>`             |
| API                      | API Responses (`openai-responses`) |
| URL base                 | `https://api.meta.ai/v1`           |
| Modelo predeterminado    | `meta/muse-spark-1.1`              |
| Razonamiento predeterminado | `high` (`reasoning.effort`)     |

## Primeros pasos

<Steps>
  <Step title="Configurar la clave de API">
    <CodeGroup>

```bash Incorporación
openclaw onboard --auth-choice meta-api-key
```

```bash Opción directa
openclaw onboard --non-interactive --accept-risk \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

```bash Solo variable de entorno
export MODEL_API_KEY=<key>
```

    </CodeGroup>

  </Step>
  <Step title="Verificar que los modelos estén disponibles">
    ```bash
    openclaw models list --provider meta
    ```

    Muestra la entrada estática `muse-spark-1.1` del catálogo. Si `MODEL_API_KEY` no se puede resolver,
    `openclaw models status --json` informa de la credencial que falta en
    `auth.unusableProfiles`.

  </Step>
</Steps>

## Configuración no interactiva

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

## Catálogo integrado

| Referencia del modelo    | Nombre         | Razonamiento | Ventana de contexto | Salida máxima |
| ------------------------ | -------------- | ------------ | ------------------- | ------------- |
| `meta/muse-spark-1.1`    | Muse Spark 1.1 | sí           | 1,048,576           | 131,072       |

Capacidades:

- Entrada de texto e imágenes
- Llamadas a herramientas y transmisión
- Nivel de razonamiento: `minimal`, `low`, `medium`, `high`, `xhigh` (predeterminado: `high`)
- Reproducción cifrada y sin estado del razonamiento (`store: false`, `include: ["reasoning.encrypted_content"]`)

<Warning>
`muse-spark-1.1` no acepta `reasoning.effort: "none"`. OpenClaw convierte
`--thinking off` en `minimal` para este proveedor.
</Warning>

## Configuración manual

```json5
{
  env: { MODEL_API_KEY: "<key>" },
  agents: {
    defaults: {
      model: { primary: "meta/muse-spark-1.1" },
      models: {
        "meta/muse-spark-1.1": { alias: "Muse Spark 1.1" },
      },
    },
  },
}
```

<Note>
Si el Gateway se ejecuta como demonio (launchd, systemd, Docker), asegúrese de que
`MODEL_API_KEY` esté disponible para ese proceso; por ejemplo, en
`~/.openclaw/.env` o mediante `env.shellEnv`. Una clave exportada únicamente en un
shell interactivo no servirá para un servicio administrado, salvo que el entorno se importe
por separado.
</Note>

## Prueba de humo

```bash
export MODEL_API_KEY=<key>
pnpm test:live -- extensions/meta/meta.live.test.ts
```

Las pruebas en vivo utilizan `muse-spark-1.1` con `POST /v1/responses`.

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Modos de pensamiento" href="/es/tools/thinking" icon="brain">
    Niveles de razonamiento para muse-spark-1.1.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/config-agents#agent-defaults" icon="gear">
    Valores predeterminados de los agentes y configuración de modelos.
  </Card>
</CardGroup>
