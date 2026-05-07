---
read_when:
    - Quieres usar modelos abiertos en OpenClaw de forma gratuita
    - Debes configurar NVIDIA_API_KEY
summary: Usa la API compatible con OpenAI de NVIDIA en OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-05-07T13:23:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8846c51b056e05f8552b3804d4dac73ff34aa874ec3d5d6fb13fad5a4112bc7f
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA proporciona una API compatible con OpenAI en `https://integrate.api.nvidia.com/v1` para
modelos abiertos de forma gratuita. Autentícate con una clave de API de
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Primeros pasos

<Steps>
  <Step title="Obtén tu clave de API">
    Crea una clave de API en [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Exporta la clave y ejecuta la incorporación">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Configura un modelo de NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Si pasas `--nvidia-api-key` en lugar de la variable de entorno, el valor queda en el historial
del shell y en la salida de `ps`. Prefiere la variable de entorno `NVIDIA_API_KEY` cuando
sea posible.
</Warning>

Para una configuración no interactiva, también puedes pasar la clave directamente:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

## Ejemplo de configuración

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## Catálogo integrado

| Referencia de modelo                       | Nombre                       | Contexto | Salida máxima |
| ------------------------------------------ | ---------------------------- | -------- | ------------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144  | 8,192         |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144  | 8,192         |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608  | 8,192         |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752  | 8,192         |

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Comportamiento de activación automática">
    El proveedor se activa automáticamente cuando la variable de entorno `NVIDIA_API_KEY` está configurada.
    No se requiere configuración explícita del proveedor más allá de la clave.
  </Accordion>

  <Accordion title="Catálogo y precios">
    El catálogo incluido es estático. Los costos se establecen de forma predeterminada en `0` en el código fuente, ya que NVIDIA
    actualmente ofrece acceso gratuito a la API para los modelos listados.
  </Accordion>

  <Accordion title="Endpoint compatible con OpenAI">
    NVIDIA usa el endpoint estándar de finalizaciones `/v1`. Cualquier herramienta compatible con OpenAI
    debería funcionar de inmediato con la URL base de NVIDIA.
  </Accordion>

  <Accordion title="Respuestas lentas de proveedores personalizados">
    Algunos modelos personalizados alojados por NVIDIA pueden tardar más que el watchdog de inactividad
    predeterminado del modelo antes de emitir el primer fragmento de respuesta. Para entradas personalizadas del proveedor NVIDIA,
    aumenta el tiempo de espera del proveedor en lugar de aumentar el tiempo de espera de ejecución
    de todo el agente:

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
Actualmente, los modelos de NVIDIA son gratuitos. Consulta
[build.nvidia.com](https://build.nvidia.com/) para conocer la disponibilidad más reciente y los
detalles de límites de frecuencia.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
