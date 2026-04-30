---
read_when:
    - Quieres usar modelos abiertos en OpenClaw gratis
    - Debes configurar NVIDIA_API_KEY
summary: Usa la API compatible con OpenAI de NVIDIA en OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-30T05:58:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 297cc25cf5235bb51f3962c2a1b8799ca6544d57e701c42e9b1e1c7d881ad32b
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA proporciona una API compatible con OpenAI en `https://integrate.api.nvidia.com/v1` para
modelos abiertos de forma gratuita. Autentícate con una clave de API de
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Primeros pasos

<Steps>
  <Step title="Get your API key">
    Crea una clave de API en [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Export the key and run onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Set an NVIDIA model">
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

| Referencia del modelo                       | Nombre                       | Contexto | Salida máxima |
| ------------------------------------------ | ---------------------------- | -------- | ------------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144  | 8,192         |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144  | 8,192         |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608  | 8,192         |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752  | 8,192         |

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Auto-enable behavior">
    El proveedor se habilita automáticamente cuando está definida la variable de entorno `NVIDIA_API_KEY`.
    No se requiere ninguna configuración explícita del proveedor más allá de la clave.
  </Accordion>

  <Accordion title="Catalog and pricing">
    El catálogo incluido es estático. Los costos tienen `0` como valor predeterminado en el código fuente, ya que NVIDIA
    actualmente ofrece acceso gratuito a la API para los modelos enumerados.
  </Accordion>

  <Accordion title="OpenAI-compatible endpoint">
    NVIDIA usa el endpoint estándar de completions `/v1`. Cualquier herramienta compatible con OpenAI
    debería funcionar directamente con la URL base de NVIDIA.
  </Accordion>
</AccordionGroup>

<Tip>
Actualmente, los modelos de NVIDIA son gratuitos. Consulta
[build.nvidia.com](https://build.nvidia.com/) para conocer la disponibilidad más reciente y
los detalles de los límites de tasa.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Configuration reference" href="/es/gateway/configuration-reference" icon="gear">
    Referencia de configuración completa para agentes, modelos y proveedores.
  </Card>
</CardGroup>
