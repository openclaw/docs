---
read_when:
    - Quieres usar Groq con OpenClaw
    - Necesitas la variable de entorno de la clave de API o la opción de autenticación de la CLI
    - Estás configurando la transcripción de audio con Whisper en Groq
summary: Configuración de Groq (autenticación + selección de modelo + transcripción con Whisper)
title: Groq
x-i18n:
    generated_at: "2026-07-11T23:26:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f04f9365127c72aa2f976f453e5d11657b19d6b4a57de1179b88924744db1dc1
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) proporciona inferencia ultrarrápida en modelos de pesos abiertos (Llama, Gemma, Kimi, Qwen, GPT OSS y más) mediante hardware LPU personalizado. El Plugin de Groq registra tanto un proveedor de chat compatible con OpenAI como un proveedor de comprensión de contenido multimedia de audio.

| Propiedad                       | Valor                                    |
| ------------------------------- | ---------------------------------------- |
| Id. del proveedor               | `groq`                                   |
| Plugin                          | paquete externo oficial                  |
| Variable de entorno de autenticación | `GROQ_API_KEY`                      |
| API                             | compatible con OpenAI (`openai-completions`) |
| URL base                        | `https://api.groq.com/openai/v1`         |
| Transcripción de audio          | `whisper-large-v3-turbo` (predeterminado) |
| Valor predeterminado de chat sugerido | `groq/llama-3.3-70b-versatile`    |

## Instalar el Plugin

Instala el Plugin oficial y, a continuación, reinicia el Gateway:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## Primeros pasos

<Steps>
  <Step title="Obtener una clave de API">
    Crea una clave de API en [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Configurar la clave de API">
    ```bash
export GROQ_API_KEY=gsk_...
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
  <Step title="Comprobar que el catálogo sea accesible">
    ```bash
    openclaw models list --provider groq
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

OpenClaw incluye un catálogo de Groq respaldado por un manifiesto, con entradas tanto de razonamiento como sin razonamiento. Ejecuta `openclaw models list --provider groq` para ver las filas estáticas de tu versión instalada o consulta [console.groq.com/docs/models](https://console.groq.com/docs/models) para conocer la lista oficial de Groq.

| Referencia del modelo                            | Nombre                  | Razonamiento | Entrada         | Contexto |
| ------------------------------------------------ | ----------------------- | ------------ | --------------- | -------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | no           | texto           | 131,072  |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | no           | texto           | 131,072  |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | no           | texto + imagen  | 131,072  |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | sí           | texto           | 131,072  |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | sí           | texto           | 131,072  |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | sí           | texto           | 131,072  |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | sí           | texto           | 131,072  |
| `groq/groq/compound`                             | Compound                | sí           | texto           | 131,072  |
| `groq/groq/compound-mini`                        | Compound Mini           | sí           | texto           | 131,072  |

<Tip>
  El catálogo evoluciona con cada versión de OpenClaw. `openclaw models list --provider groq` muestra las filas conocidas por tu versión instalada; compáralas con [console.groq.com/docs/models](https://console.groq.com/docs/models) para comprobar si hay modelos añadidos recientemente o modelos obsoletos.
</Tip>

## Modelos de razonamiento

Los modelos de razonamiento de Groq (`reasoning: true` en la tabla anterior) asignan los niveles compartidos de `/think` de OpenClaw a valores de `reasoning_effort` de `low`, `medium` o `high`. `/think off` o `/think none` omite `reasoning_effort` de la solicitud en lugar de enviar un valor desactivado.

Consulta [Modos de pensamiento](/es/tools/thinking) para conocer los niveles compartidos de `/think` y cómo OpenClaw los traduce para cada proveedor.

## Transcripción de audio

El Plugin de Groq también registra un **proveedor de comprensión de contenido multimedia de audio** para que los mensajes de voz puedan transcribirse mediante la interfaz compartida `tools.media.audio`.

| Propiedad                         | Valor                                     |
| --------------------------------- | ----------------------------------------- |
| Ruta de configuración compartida  | `tools.media.audio`                       |
| URL base predeterminada           | `https://api.groq.com/openai/v1`          |
| Modelo predeterminado             | `whisper-large-v3-turbo`                  |
| Prioridad automática              | 20                                        |
| Endpoint de la API                | `/audio/transcriptions` compatible con OpenAI |

Para establecer Groq como backend de audio predeterminado:

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
  <Accordion title="Disponibilidad del entorno para el daemon">
    Si el Gateway se ejecuta como servicio administrado (launchd, systemd, Docker), `GROQ_API_KEY` debe ser visible para ese proceso, no solo para tu shell interactivo.

    <Warning>
      Una clave exportada únicamente en un shell interactivo no servirá para un daemon de launchd o systemd, a menos que ese entorno también se importe allí. Configura la clave en `~/.openclaw/.env` o mediante `env.shellEnv` para que el proceso del Gateway pueda leerla.
    </Warning>

  </Accordion>

  <Accordion title="Ids. de modelos personalizados de Groq">
    OpenClaw acepta cualquier id. de modelo de Groq durante la ejecución. Usa el id. exacto que muestra Groq y añádele el prefijo `groq/`. El catálogo estático abarca los casos habituales; los ids. que no aparecen en el catálogo utilizan la plantilla predeterminada compatible con OpenAI.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/<your-model-id>" },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Temas relacionados

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Selección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Modos de pensamiento" href="/es/tools/thinking" icon="brain">
    Niveles de esfuerzo de razonamiento e interacción con las políticas del proveedor.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema de configuración completo, incluidos los ajustes del proveedor y de audio.
  </Card>
  <Card title="Consola de Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Panel de Groq, documentación de la API y precios.
  </Card>
</CardGroup>
