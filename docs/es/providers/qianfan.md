---
read_when:
    - Quieres una única clave de API para muchos LLMs
    - Necesitas orientación para configurar Baidu Qianfan
summary: Usa la API unificada de Qianfan para acceder a muchos modelos en OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-07-05T11:37:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31387a53ee4472e2d20ae939ea75cea0d6f6367501becd56a8654fd97fdf0804
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan es la plataforma MaaS de Baidu: una API unificada y compatible con OpenAI que enruta solicitudes a muchos modelos detrás de un único endpoint y clave de API. OpenClaw la distribuye como el Plugin externo oficial `@openclaw/qianfan-provider`.

| Propiedad              | Valor                                    |
| ---------------------- | ---------------------------------------- |
| Proveedor              | `qianfan`                                |
| Autenticación          | `QIANFAN_API_KEY`                        |
| API                    | Compatible con OpenAI (`openai-completions`) |
| URL base               | `https://qianfan.baidubce.com/v2`        |
| Modelo predeterminado  | `qianfan/deepseek-v3.2`                  |

## Instalar Plugin

Instala el Plugin oficial y luego reinicia Gateway:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## Primeros pasos

<Steps>
  <Step title="Crear una cuenta de Baidu Cloud">
    Regístrate o inicia sesión en la [consola de Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) y asegúrate de tener habilitado el acceso a la API de Qianfan.
  </Step>
  <Step title="Generar una clave de API">
    Crea una aplicación nueva o selecciona una existente y luego genera una clave de API. Las claves de Baidu Cloud usan el formato `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Ejecutar onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```

    Las ejecuciones no interactivas leen la clave desde `--qianfan-api-key <key>` o
    `QIANFAN_API_KEY`. El onboarding escribe la configuración del proveedor, agrega el
    alias `QIANFAN` para el modelo predeterminado y establece `qianfan/deepseek-v3.2`
    como modelo predeterminado cuando no hay ninguno configurado.

  </Step>
  <Step title="Verificar que el modelo esté disponible">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Catálogo integrado

| Ref. de modelo                       | Entrada        | Contexto | Salida máxima | Razonamiento | Notas                  |
| ------------------------------------ | -------------- | -------- | ------------- | ------------ | ---------------------- |
| `qianfan/deepseek-v3.2`              | texto          | 98,304   | 32,768        | Sí           | Modelo predeterminado  |
| `qianfan/ernie-5.0-thinking-preview` | texto, imagen  | 119,000  | 64,000        | Sí           | Multimodal             |

El catálogo es estático; no hay descubrimiento de modelos en vivo.

<Tip>
Solo necesitas sobrescribir `models.providers.qianfan` cuando necesitas una URL base personalizada o metadatos de modelo personalizados.
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

<Note>
Las refs. de modelo usan el prefijo `qianfan/` (por ejemplo, `qianfan/deepseek-v3.2`).
</Note>

<AccordionGroup>
  <Accordion title="Transporte y compatibilidad">
    Qianfan se ejecuta a través de la ruta de transporte compatible con OpenAI, no mediante el formato nativo de solicitudes de OpenAI. Las funciones estándar del SDK de OpenAI funcionan, pero es posible que los parámetros específicos del proveedor no se reenvíen.
  </Accordion>

  <Accordion title="Solución de problemas">
    - Asegúrate de que tu clave de API empiece con `bce-v3/ALTAK-` y tenga habilitado el acceso a la API de Qianfan en la consola de Baidu Cloud.
    - Si los modelos no aparecen, confirma que tu cuenta tenga activado el servicio Qianfan.
    - Cambia la URL base solo si usas un endpoint o proxy personalizado.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, refs. de modelo y comportamiento de failover.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración de OpenClaw.
  </Card>
  <Card title="Configuración de agente" href="/es/concepts/agent" icon="robot">
    Configurar valores predeterminados de agentes y asignaciones de modelos.
  </Card>
  <Card title="Documentación de la API de Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Documentación oficial de la API de Qianfan.
  </Card>
</CardGroup>
