---
read_when:
    - Quieres usar modelos abiertos en OpenClaw gratis
    - Necesitas configurar `NVIDIA_API_KEY`
summary: Usa la API compatible con OpenAI de NVIDIA en OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-24T05:45:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2d056be5be012be537ba5c4d5812ea15ec440e5a552b235854e2078064376192
    source_path: providers/nvidia.md
    workflow: 15
---

NVIDIA ofrece una API compatible con OpenAI en `https://integrate.api.nvidia.com/v1` para
modelos abiertos de forma gratuita. Autentícate con una clave API de
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Primeros pasos

<Steps>
  <Step title="Obtén tu clave API">
    Crea una clave API en [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Exporta la clave y ejecuta la incorporación">
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
en la salida de `ps`. Prefiere la variable de entorno `NVIDIA_API_KEY` siempre que sea posible.
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

## Catálogo incluido

| Model ref                                  | Name                         | Context | Max output |
| ------------------------------------------ | ---------------------------- | ------- | ---------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192      |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192      |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192      |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192      |

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Comportamiento de autoactivación">
    El proveedor se activa automáticamente cuando la variable de entorno `NVIDIA_API_KEY` está configurada.
    No se requiere configuración explícita adicional del proveedor más allá de la clave.
  </Accordion>

  <Accordion title="Catálogo y precios">
    El catálogo incluido es estático. Los costos se establecen en `0` de forma predeterminada en el código fuente, ya que NVIDIA
    ofrece actualmente acceso gratuito a la API para los modelos listados.
  </Accordion>

  <Accordion title="Endpoint compatible con OpenAI">
    NVIDIA usa el endpoint estándar `/v1` de completions. Cualquier herramienta
    compatible con OpenAI debería funcionar inmediatamente con la base URL de NVIDIA.
  </Accordion>
</AccordionGroup>

<Tip>
Los modelos de NVIDIA son actualmente gratuitos. Consulta
[build.nvidia.com](https://build.nvidia.com/) para ver la disponibilidad más reciente y
los detalles de límites de tasa.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
