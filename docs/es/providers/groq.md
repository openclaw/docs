---
read_when:
    - Quieres usar Groq con OpenClaw
    - Necesitas la variable de entorno de la clave de API o la opción de autenticación de CLI
summary: Configuración de Groq (autenticación + selección de modelo)
title: Groq
x-i18n:
    generated_at: "2026-04-30T05:57:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed612471939e7ac5362f8236f179d38ae07f9076709ff55020c1790f7c56a6fa
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) proporciona inferencia ultrarrápida en modelos de código abierto
(Llama, Gemma, Mistral y más) mediante hardware LPU personalizado. OpenClaw se conecta
a Groq a través de su API compatible con OpenAI.

| Propiedad | Valor                  |
| --------- | ---------------------- |
| Proveedor | `groq`                 |
| Autenticación | `GROQ_API_KEY`    |
| API       | compatible con OpenAI  |

## Primeros pasos

<Steps>
  <Step title="Obtener una clave de API">
    Crea una clave de API en [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Configurar la clave de API">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Configurar un modelo predeterminado">
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

El catálogo de modelos de Groq cambia con frecuencia. Ejecuta `openclaw models list | grep groq`
para ver los modelos disponibles actualmente, o consulta
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Modelo                      | Notas                              |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Propósito general, contexto grande |
| **Llama 3.1 8B Instant**    | Rápido, ligero                     |
| **Gemma 2 9B**              | Compacto, eficiente               |
| **Mixtral 8x7B**            | Arquitectura MoE, razonamiento sólido |

<Tip>
Usa `openclaw models list --provider groq` para obtener la lista más actualizada de
modelos disponibles en tu cuenta.
</Tip>

## Modelos de razonamiento

OpenClaw asigna sus niveles compartidos de `/think` a los valores `reasoning_effort`
específicos del modelo de Groq. Para `qwen/qwen3-32b`, el pensamiento deshabilitado envía
`none` y el pensamiento habilitado envía `default`. Para los modelos de razonamiento GPT-OSS de Groq,
OpenClaw envía `low`, `medium` o `high`; el pensamiento deshabilitado omite
`reasoning_effort` porque esos modelos no admiten un valor deshabilitado.

## Transcripción de audio

Groq también proporciona transcripción de audio rápida basada en Whisper. Cuando se configura como
proveedor de comprensión multimedia, OpenClaw usa el modelo `whisper-large-v3-turbo`
de Groq para transcribir mensajes de voz a través de la superficie compartida `tools.media.audio`.

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
    Las claves configuradas solo en tu shell interactiva no son visibles para los procesos de Gateway
    administrados por daemon. Usa la configuración `~/.openclaw/.env` o `env.shellEnv` para
    disponibilidad persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de conmutación por error.
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
