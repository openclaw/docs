---
read_when:
    - Quieres usar Groq con OpenClaw
    - Necesitas la variable de entorno de la clave de API o la opción de autenticación de CLI
summary: Configuración de Groq (autenticación + selección de modelo)
title: Groq
x-i18n:
    generated_at: "2026-05-02T05:33:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf6678047581a438906420894b250bafb68d71254fbaf30ea5dfcfc4799eac7
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) proporciona inferencia ultrarrápida en modelos de código abierto
(Llama, Gemma, Mistral y más) usando hardware LPU personalizado. OpenClaw se conecta
a Groq mediante su API compatible con OpenAI.

| Propiedad | Valor                  |
| --------- | ---------------------- |
| Proveedor | `groq`                 |
| Autenticación | `GROQ_API_KEY`     |
| API       | Compatible con OpenAI  |

## Primeros pasos

<Steps>
  <Step title="Obtén una clave de API">
    Crea una clave de API en [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Configura la clave de API">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Configura un modelo predeterminado">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
</Steps>

### Ejemplo de archivo de configuración

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Catálogo integrado

OpenClaw incluye un catálogo de Groq respaldado por manifiesto para listar modelos
rápidamente con filtro por proveedor. Ejecuta `openclaw models list --all --provider groq` para ver las filas
incluidas, o consulta
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Modelo                      | Notas                              |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Propósito general, contexto amplio |
| **Llama 3.1 8B Instant**    | Rápido, ligero                     |
| **Gemma 2 9B**              | Compacto, eficiente                |
| **Mixtral 8x7B**            | Arquitectura MoE, razonamiento sólido |

<Tip>
Usa `openclaw models list --all --provider groq` para las filas de Groq respaldadas por manifiesto
conocidas por esta versión de OpenClaw.
</Tip>

## Modelos de razonamiento

OpenClaw asigna sus niveles compartidos de `/think` a los valores
`reasoning_effort` específicos del modelo de Groq. Para `qwen/qwen3-32b`, el pensamiento
desactivado envía `none` y el pensamiento activado envía `default`. Para los modelos
de razonamiento GPT-OSS de Groq, OpenClaw envía `low`, `medium` o `high`; el pensamiento desactivado omite
`reasoning_effort` porque esos modelos no admiten un valor desactivado.

## Transcripción de audio

Groq también proporciona transcripción de audio rápida basada en Whisper. Cuando se configura como
proveedor de comprensión multimedia, OpenClaw usa el modelo `whisper-large-v3-turbo`
de Groq para transcribir mensajes de voz mediante la superficie compartida
`tools.media.audio`.

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Detalles de la transcripción de audio">
    | Propiedad | Valor |
    |----------|-------|
    | Ruta de configuración compartida | `tools.media.audio` |
    | URL base predeterminada | `https://api.groq.com/openai/v1` |
    | Modelo predeterminado | `whisper-large-v3-turbo` |
    | Endpoint de API | `/audio/transcriptions` compatible con OpenAI |
  </Accordion>

  <Accordion title="Nota sobre el entorno">
    Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `GROQ_API_KEY` esté
    disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
    `env.shellEnv`).

    <Warning>
    Las claves configuradas solo en tu shell interactivo no son visibles para los procesos de
    Gateway administrados por daemon. Usa `~/.openclaw/.env` o la configuración `env.shellEnv` para
    disponibilidad persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema de configuración completo, incluidos los ajustes de proveedor y audio.
  </Card>
  <Card title="Consola de Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Panel de Groq, documentación de API y precios.
  </Card>
  <Card title="Lista de modelos de Groq" href="https://console.groq.com/docs/models" icon="list">
    Catálogo oficial de modelos de Groq.
  </Card>
</CardGroup>
