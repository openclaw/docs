---
read_when:
    - Quieres usar Groq con OpenClaw
    - Necesitas la variable de entorno de la API key o la opción de autenticación del CLI
summary: Configuración de Groq (autenticación + selección de modelo)
title: Groq
x-i18n:
    generated_at: "2026-04-12T23:31:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613289efc36fedd002e1ebf9366e0e7119ea1f9e14a1dae773b90ea57100baee
    source_path: providers/groq.md
    workflow: 15
---

# Groq

[Groq](https://groq.com) ofrece inferencia ultrarrápida en modelos de código abierto
(Llama, Gemma, Mistral y más) usando hardware LPU personalizado. OpenClaw se conecta
a Groq a través de su API compatible con OpenAI.

| Propiedad | Valor             |
| --------- | ----------------- |
| Proveedor | `groq`            |
| Autenticación | `GROQ_API_KEY` |
| API       | Compatible con OpenAI |

## Primeros pasos

<Steps>
  <Step title="Obtén una API key">
    Crea una API key en [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Configura la API key">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Establece un modelo predeterminado">
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

## Modelos disponibles

El catálogo de modelos de Groq cambia con frecuencia. Ejecuta `openclaw models list | grep groq`
para ver los modelos disponibles actualmente, o consulta
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Modelo                      | Notas                              |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Propósito general, contexto amplio |
| **Llama 3.1 8B Instant**    | Rápido, ligero                     |
| **Gemma 2 9B**              | Compacto, eficiente                |
| **Mixtral 8x7B**            | Arquitectura MoE, razonamiento sólido |

<Tip>
Usa `openclaw models list --provider groq` para obtener la lista más actualizada de
modelos disponibles en tu cuenta.
</Tip>

## Transcripción de audio

Groq también proporciona transcripción de audio rápida basada en Whisper. Cuando se configura como proveedor de
comprensión de medios, OpenClaw usa el modelo `whisper-large-v3-turbo` de Groq para transcribir mensajes de voz a través de la superficie compartida `tools.media.audio`.

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
    | URL base predeterminada          | `https://api.groq.com/openai/v1` |
    | Modelo predeterminado            | `whisper-large-v3-turbo` |
    | Endpoint de API                  | `/audio/transcriptions` compatible con OpenAI |
  </Accordion>

  <Accordion title="Nota sobre el entorno">
    Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `GROQ_API_KEY` esté
    disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
    `env.shellEnv`).

    <Warning>
    Las claves configuradas solo en tu shell interactivo no son visibles para los procesos del
    Gateway administrados por un daemon. Usa `~/.openclaw/.env` o la configuración `env.shellEnv` para
    disponibilidad persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema completo de configuración, incluidos los ajustes de proveedor y audio.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Panel de Groq, documentación de la API y precios.
  </Card>
  <Card title="Lista de modelos de Groq" href="https://console.groq.com/docs/models" icon="list">
    Catálogo oficial de modelos de Groq.
  </Card>
</CardGroup>
