---
read_when:
    - Quieres una sola clave API para muchos LLM@endsection to=final
    - Necesitas guía de configuración de Baidu Qianfan
summary: Usa la API unificada de Qianfan para acceder a muchos modelos en OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-24T05:45:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 727236394f6581f5bdb2f557092c31ff7904e4a80b06f8adc07a1c51dcfb2ff1
    source_path: providers/qianfan.md
    workflow: 15
---

Qianfan es la plataforma MaaS de Baidu, que proporciona una **API unificada** que enruta solicitudes a muchos modelos detrás de un único
endpoint y una sola clave API. Es compatible con OpenAI, así que la mayoría de los SDK de OpenAI funcionan cambiando la URL base.

| Propiedad | Valor                             |
| --------- | --------------------------------- |
| Proveedor | `qianfan`                         |
| Autenticación | `QIANFAN_API_KEY`             |
| API       | Compatible con OpenAI             |
| URL base  | `https://qianfan.baidubce.com/v2` |

## Primeros pasos

<Steps>
  <Step title="Crear una cuenta de Baidu Cloud">
    Regístrate o inicia sesión en la [Consola de Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) y asegúrate de tener habilitado el acceso a la API de Qianfan.
  </Step>
  <Step title="Generar una clave API">
    Crea una nueva aplicación o selecciona una existente, y luego genera una clave API. El formato de la clave es `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Ejecutar la incorporación">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Verificar que el modelo está disponible">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Catálogo integrado

| Referencia de modelo                 | Entrada     | Contexto | Salida máxima | Razonamiento | Notas         |
| ------------------------------------ | ----------- | -------- | ------------- | ------------ | ------------- |
| `qianfan/deepseek-v3.2`              | text        | 98,304   | 32,768        | Sí           | Modelo predeterminado |
| `qianfan/ernie-5.0-thinking-preview` | text, image | 119,000  | 64,000        | Sí           | Multimodal    |

<Tip>
La referencia de modelo integrado predeterminada es `qianfan/deepseek-v3.2`. Solo necesitas sobrescribir `models.providers.qianfan` cuando necesites una URL base personalizada o metadatos de modelo personalizados.
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
    El catálogo integrado actualmente incluye `deepseek-v3.2` y `ernie-5.0-thinking-preview`. Añade o sobrescribe `models.providers.qianfan` solo cuando necesites una URL base personalizada o metadatos de modelo personalizados.

    <Note>
    Las referencias de modelo usan el prefijo `qianfan/` (por ejemplo `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Solución de problemas">
    - Asegúrate de que tu clave API comience con `bce-v3/ALTAK-` y tenga habilitado el acceso a la API de Qianfan en la consola de Baidu Cloud.
    - Si no se listan modelos, confirma que tu cuenta tenga activado el servicio Qianfan.
    - La URL base predeterminada es `https://qianfan.baidubce.com/v2`. Cámbiala solo si usas un endpoint o proxy personalizado.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de failover.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración de OpenClaw.
  </Card>
  <Card title="Configuración del agente" href="/es/concepts/agent" icon="robot">
    Configurar valores predeterminados del agente y asignaciones de modelos.
  </Card>
  <Card title="Documentación de la API de Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Documentación oficial de la API de Qianfan.
  </Card>
</CardGroup>
