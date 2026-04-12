---
read_when:
    - Quieres usar modelos abiertos en OpenClaw gratis
    - Necesitas configurar `NVIDIA_API_KEY`
summary: Usa la API compatible con OpenAI de NVIDIA en OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-12T23:32:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45048037365138141ee82cefa0c0daaf073a1c2ae3aa7b23815f6ca676fc0d3e
    source_path: providers/nvidia.md
    workflow: 15
---

# NVIDIA

NVIDIA ofrece una API compatible con OpenAI en `https://integrate.api.nvidia.com/v1` para
modelos abiertos de forma gratuita. Autentícate con una API key de
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Primeros pasos

<Steps>
  <Step title="Obtén tu API key">
    Crea una API key en [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Exporta la clave y ejecuta el onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice skip
    ```
  </Step>
  <Step title="Establece un modelo de NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Si pasas `--token` en lugar de la variable de entorno, el valor queda en el historial del shell y
en la salida de `ps`. Siempre que sea posible, usa la variable de entorno `NVIDIA_API_KEY`.
</Warning>

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

| Referencia del modelo                      | Nombre                       | Contexto | Salida máxima |
| ------------------------------------------ | ---------------------------- | -------- | ------------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144  | 8,192         |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144  | 8,192         |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608  | 8,192         |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752  | 8,192         |

## Notas avanzadas

<AccordionGroup>
  <Accordion title="Comportamiento de habilitación automática">
    El proveedor se habilita automáticamente cuando se establece la variable de entorno `NVIDIA_API_KEY`.
    No se requiere ninguna configuración explícita del proveedor más allá de la clave.
  </Accordion>

  <Accordion title="Catálogo y precios">
    El catálogo integrado es estático. Los costos usan `0` de forma predeterminada en el código fuente, ya que NVIDIA
    actualmente ofrece acceso gratuito a la API para los modelos listados.
  </Accordion>

  <Accordion title="Endpoint compatible con OpenAI">
    NVIDIA usa el endpoint estándar de completions `/v1`. Cualquier herramienta compatible con OpenAI
    debería funcionar de inmediato con la URL base de NVIDIA.
  </Accordion>
</AccordionGroup>

<Tip>
Los modelos de NVIDIA actualmente son gratuitos. Consulta
[build.nvidia.com](https://build.nvidia.com/) para obtener la disponibilidad más reciente y
los detalles de límite de velocidad.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
