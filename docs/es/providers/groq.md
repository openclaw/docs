---
read_when:
    - Quieres usar Groq con OpenClaw
    - Necesitas la variable de entorno de clave de API o la opción de autenticación de la CLI
    - Estás configurando la transcripción de audio de Whisper en Groq
summary: Configuración de Groq (autenticación + selección de modelo + transcripción de Whisper)
title: Groq
x-i18n:
    generated_at: "2026-07-05T11:37:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f04f9365127c72aa2f976f453e5d11657b19d6b4a57de1179b88924744db1dc1
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) proporciona inferencia ultrarrápida en modelos de pesos abiertos (Llama, Gemma, Kimi, Qwen, GPT OSS y más) mediante hardware LPU personalizado. El Plugin de Groq registra tanto un proveedor de chat compatible con OpenAI como un proveedor de comprensión de medios de audio.

| Propiedad              | Valor                                    |
| ---------------------- | ---------------------------------------- |
| Id del proveedor       | `groq`                                   |
| Plugin                 | paquete externo oficial                  |
| Variable de entorno de autenticación | `GROQ_API_KEY`                           |
| API                    | compatible con OpenAI (`openai-completions`) |
| URL base               | `https://api.groq.com/openai/v1`         |
| Transcripción de audio | `whisper-large-v3-turbo` (predeterminado) |
| Valor predeterminado de chat sugerido | `groq/llama-3.3-70b-versatile`           |

## Instalar Plugin

Instala el Plugin oficial y luego reinicia Gateway:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## Primeros pasos

<Steps>
  <Step title="Get an API key">
    Crea una clave de API en [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Set the API key">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="Set a default model">
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
  <Step title="Verify the catalog is reachable">
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

OpenClaw incluye un catálogo de Groq respaldado por manifiesto con entradas tanto de razonamiento como sin razonamiento. Ejecuta `openclaw models list --provider groq` para ver las filas estáticas de tu versión instalada, o consulta [console.groq.com/docs/models](https://console.groq.com/docs/models) para ver la lista oficial de Groq.

| Ref. del modelo                                  | Nombre                  | Razonamiento | Entrada      | Contexto |
| ------------------------------------------------ | ----------------------- | ------------ | ------------ | -------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | no           | texto        | 131,072  |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | no           | texto        | 131,072  |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | no           | texto + imagen | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | sí           | texto        | 131,072  |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | sí           | texto        | 131,072  |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | sí           | texto        | 131,072  |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | sí           | texto        | 131,072  |
| `groq/groq/compound`                             | Compound                | sí           | texto        | 131,072  |
| `groq/groq/compound-mini`                        | Compound Mini           | sí           | texto        | 131,072  |

<Tip>
  El catálogo evoluciona con cada versión de OpenClaw. `openclaw models list --provider groq` muestra las filas conocidas por tu versión instalada; contrástalo con [console.groq.com/docs/models](https://console.groq.com/docs/models) para los modelos recién añadidos o en desuso.
</Tip>

## Modelos de razonamiento

Los modelos de razonamiento de Groq (`reasoning: true` en la tabla anterior) asignan los niveles compartidos de `/think` de OpenClaw a valores de `reasoning_effort` de `low`, `medium` o `high`. `/think off` o `/think none` omite `reasoning_effort` de la solicitud en lugar de enviar un valor deshabilitado.

Consulta [Modos de pensamiento](/es/tools/thinking) para ver los niveles compartidos de `/think` y cómo OpenClaw los traduce por proveedor.

## Transcripción de audio

El Plugin de Groq también registra un **proveedor de comprensión de medios de audio** para que los mensajes de voz puedan transcribirse mediante la superficie compartida `tools.media.audio`.

| Propiedad                  | Valor                                     |
| -------------------------- | ----------------------------------------- |
| Ruta de configuración compartida | `tools.media.audio`                       |
| URL base predeterminada    | `https://api.groq.com/openai/v1`          |
| Modelo predeterminado      | `whisper-large-v3-turbo`                  |
| Prioridad automática       | 20                                        |
| Endpoint de API            | `/audio/transcriptions` compatible con OpenAI |

Para hacer que Groq sea el backend de audio predeterminado:

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
  <Accordion title="Environment availability for the daemon">
    Si Gateway se ejecuta como un servicio gestionado (launchd, systemd, Docker), `GROQ_API_KEY` debe estar visible para ese proceso, no solo para tu shell interactivo.

    <Warning>
      Una clave exportada solo en un shell interactivo no ayudará a un daemon launchd o systemd a menos que ese entorno también se importe allí. Define la clave en `~/.openclaw/.env` o mediante `env.shellEnv` para que el proceso de Gateway pueda leerla.
    </Warning>

  </Accordion>

  <Accordion title="Custom Groq model ids">
    OpenClaw acepta cualquier id de modelo de Groq en tiempo de ejecución. Usa el id exacto mostrado por Groq y anteponle `groq/`. El catálogo estático cubre los casos comunes; los ids que no están en el catálogo pasan a la plantilla predeterminada compatible con OpenAI.

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

## Relacionado

<CardGroup cols={2}>
  <Card title="Model providers" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, refs. de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Thinking modes" href="/es/tools/thinking" icon="brain">
    Niveles de esfuerzo de razonamiento e interacción con la política del proveedor.
  </Card>
  <Card title="Configuration reference" href="/es/gateway/configuration-reference" icon="gear">
    Esquema de configuración completo, incluidos los ajustes de proveedores y audio.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Panel de Groq, documentación de API y precios.
  </Card>
</CardGroup>
