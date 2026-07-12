---
read_when:
    - Quieres una única clave de API para muchos LLM.
    - Necesitas orientación para configurar Baidu Qianfan
summary: Usa la API unificada de Qianfan para acceder a numerosos modelos en OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-07-11T23:27:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31387a53ee4472e2d20ae939ea75cea0d6f6367501becd56a8654fd97fdf0804
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan es la plataforma MaaS de Baidu: una API unificada y compatible con OpenAI que dirige las solicitudes a numerosos modelos mediante un único endpoint y una única clave de API. OpenClaw la distribuye como el plugin externo oficial `@openclaw/qianfan-provider`.

| Propiedad          | Valor                                    |
| ------------------ | ---------------------------------------- |
| Proveedor          | `qianfan`                                |
| Autenticación      | `QIANFAN_API_KEY`                        |
| API                | Compatible con OpenAI (`openai-completions`) |
| URL base           | `https://qianfan.baidubce.com/v2`        |
| Modelo predeterminado | `qianfan/deepseek-v3.2`               |

## Instalar el plugin

Instala el plugin oficial y, a continuación, reinicia el Gateway:

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
    Crea una aplicación nueva o selecciona una existente y, a continuación, genera una clave de API. Las claves de Baidu Cloud utilizan el formato `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Ejecutar la incorporación">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```

    Las ejecuciones no interactivas leen la clave de `--qianfan-api-key <key>` o
    `QIANFAN_API_KEY`. La incorporación escribe la configuración del proveedor, añade el
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

| Referencia del modelo                | Entrada        | Contexto | Salida máxima | Razonamiento | Notas                  |
| ------------------------------------ | -------------- | -------- | ------------- | ------------ | ---------------------- |
| `qianfan/deepseek-v3.2`              | texto          | 98,304   | 32,768        | Sí           | Modelo predeterminado  |
| `qianfan/ernie-5.0-thinking-preview` | texto, imagen  | 119,000  | 64,000        | Sí           | Multimodal             |

El catálogo es estático; no hay detección de modelos en tiempo real.

<Tip>
Solo necesitas sobrescribir `models.providers.qianfan` cuando requieras una URL base personalizada o metadatos de modelo personalizados.
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
Las referencias de modelo utilizan el prefijo `qianfan/` (por ejemplo, `qianfan/deepseek-v3.2`).
</Note>

<AccordionGroup>
  <Accordion title="Transporte y compatibilidad">
    Qianfan funciona mediante la ruta de transporte compatible con OpenAI, no mediante el formato nativo de solicitudes de OpenAI. Las funciones estándar del SDK de OpenAI funcionan, pero es posible que los parámetros específicos del proveedor no se reenvíen.
  </Accordion>

  <Accordion title="Solución de problemas">
    - Asegúrate de que tu clave de API comience por `bce-v3/ALTAK-` y de que tenga habilitado el acceso a la API de Qianfan en la consola de Baidu Cloud.
    - Si los modelos no aparecen en la lista, confirma que el servicio Qianfan esté activado en tu cuenta.
    - Cambia la URL base únicamente si utilizas un endpoint o proxy personalizado.

  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración de OpenClaw.
  </Card>
  <Card title="Configuración del agente" href="/es/concepts/agent" icon="robot">
    Configuración de los valores predeterminados del agente y las asignaciones de modelos.
  </Card>
  <Card title="Documentación de la API de Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Documentación oficial de la API de Qianfan.
  </Card>
</CardGroup>
