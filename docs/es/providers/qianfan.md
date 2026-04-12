---
read_when:
    - Quieres una sola clave de API para muchos LLM
    - Necesitas una guía de configuración de Baidu Qianfan
summary: Usa la API unificada de Qianfan para acceder a muchos modelos en OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-12T23:32:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d0eeee9ec24b335c2fb8ac5e985a9edc35cfc5b2641c545cb295dd2de619f50
    source_path: providers/qianfan.md
    workflow: 15
---

# Qianfan

Qianfan es la plataforma MaaS de Baidu, que ofrece una **API unificada** que enruta solicitudes a muchos modelos detrás de un único
endpoint y una sola clave de API. Es compatible con OpenAI, por lo que la mayoría de los SDK de OpenAI funcionan cambiando la URL base.

| Property | Value                             |
| -------- | --------------------------------- |
| Provider | `qianfan`                         |
| Auth     | `QIANFAN_API_KEY`                 |
| API      | Compatible con OpenAI             |
| Base URL | `https://qianfan.baidubce.com/v2` |

## Primeros pasos

<Steps>
  <Step title="Create a Baidu Cloud account">
    Regístrate o inicia sesión en la [Consola de Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) y asegúrate de tener habilitado el acceso a la API de Qianfan.
  </Step>
  <Step title="Generate an API key">
    Crea una nueva aplicación o selecciona una existente y luego genera una clave de API. El formato de la clave es `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Modelos disponibles

| Model ref                            | Input       | Context | Max output | Reasoning | Notes           |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | --------------- |
| `qianfan/deepseek-v3.2`              | text        | 98,304  | 32,768     | Sí        | Modelo predeterminado |
| `qianfan/ernie-5.0-thinking-preview` | text, image | 119,000 | 64,000     | Sí        | Multimodal      |

<Tip>
La referencia de modelo integrada predeterminada es `qianfan/deepseek-v3.2`. Solo necesitas sobrescribir `models.providers.qianfan` cuando necesites una URL base personalizada o metadatos de modelo personalizados.
</Tip>

## Ejemplo de configuración

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transporte y compatibilidad">
    Qianfan se ejecuta a través de la ruta de transporte compatible con OpenAI, no mediante el modelado nativo de solicitudes de OpenAI. Esto significa que las funciones estándar de los SDK de OpenAI funcionan, pero puede que los parámetros específicos del proveedor no se reenvíen.
  </Accordion>

  <Accordion title="Catálogo y sobrescrituras">
    El catálogo integrado actualmente incluye `deepseek-v3.2` y `ernie-5.0-thinking-preview`. Agrega o sobrescribe `models.providers.qianfan` solo cuando necesites una URL base personalizada o metadatos de modelo personalizados.

    <Note>
    Las referencias de modelo usan el prefijo `qianfan/` (por ejemplo `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Solución de problemas">
    - Asegúrate de que tu clave de API empiece con `bce-v3/ALTAK-` y tenga habilitado el acceso a la API de Qianfan en la consola de Baidu Cloud.
    - Si los modelos no aparecen en la lista, confirma que tu cuenta tenga activado el servicio Qianfan.
    - La URL base predeterminada es `https://qianfan.baidubce.com/v2`. Cámbiala solo si usas un endpoint o proxy personalizados.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración de OpenClaw.
  </Card>
  <Card title="Configuración de agente" href="/es/concepts/agent" icon="robot">
    Configurar valores predeterminados del agente y asignaciones de modelos.
  </Card>
  <Card title="Documentación de la API de Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Documentación oficial de la API de Qianfan.
  </Card>
</CardGroup>
