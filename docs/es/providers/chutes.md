---
read_when:
    - Quieres usar Chutes con OpenClaw
    - Necesitas la ruta de configuración de OAuth o de la clave de API
    - Quieres el modelo predeterminado, los alias o el comportamiento de detección
summary: Configuración de Chutes (OAuth o clave de API, detección de modelos, alias)
title: Conductos
x-i18n:
    generated_at: "2026-07-11T23:25:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) expone catálogos de modelos de código abierto mediante una API compatible con OpenAI. OpenClaw admite tanto OAuth mediante navegador como autenticación con clave de API.

| Propiedad                | Valor                                                   |
| ------------------------ | ------------------------------------------------------- |
| Proveedor                | `chutes`                                                |
| Plugin                   | paquete externo oficial (`@openclaw/chutes-provider`)   |
| API                      | compatible con OpenAI                                   |
| URL base                 | `https://llm.chutes.ai/v1`                              |
| Autenticación            | OAuth o clave de API (consulte más abajo)               |
| Variables de entorno de ejecución | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`         |

`CHUTES_OAUTH_TOKEN` proporciona directamente un token de acceso OAuth ya obtenido
(por ejemplo, en CI), omitiendo el flujo interactivo del navegador descrito a continuación.

## Instalar el Plugin

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Primeros pasos

Ambas opciones establecen el modelo predeterminado en `chutes/zai-org/GLM-4.7-TEE` y registran
el catálogo de Chutes.

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Ejecutar el flujo de incorporación de OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw inicia localmente el flujo del navegador o muestra un flujo con una URL y
        pegado de la redirección en hosts remotos o sin interfaz gráfica. Los tokens OAuth se
        renuevan automáticamente mediante los perfiles de autenticación de OpenClaw.
      </Step>
    </Steps>
  </Tab>
  <Tab title="Clave de API">
    <Steps>
      <Step title="Obtener una clave de API">
        Cree una clave en
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Ejecutar el flujo de incorporación con clave de API">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Comportamiento de detección

Cuando la autenticación de Chutes está disponible, OpenClaw consulta `GET /v1/models` con esa
credencial y utiliza los modelos detectados, almacenados en caché durante 5 minutos por
credencial. Si una clave ha caducado o no está autorizada (HTTP 401), OpenClaw vuelve a
intentarlo una vez sin credenciales. Si la detección sigue sin devolver filas, falla o devuelve
cualquier otro estado distinto de 2xx, se recurre al catálogo estático incluido (tanto la
detección mediante clave de API como la realizada mediante OAuth utilizan esta misma ruta).
Si la detección falla durante el inicio, el catálogo estático se utiliza automáticamente.

## Alias predeterminados

OpenClaw registra tres alias prácticos para el catálogo de Chutes:

| Alias           | Modelo de destino                                      |
| --------------- | ------------------------------------------------------ |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                           |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                 |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`  |

## Catálogo inicial integrado

El catálogo alternativo incluido contiene 47 modelos. A continuación se muestra una selección representativa de las referencias actuales:

| Referencia del modelo                                 |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

Ejecute `openclaw models list --all --provider chutes` para ver la lista completa.

## Ejemplo de configuración

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Personalizaciones de OAuth">
    Personalice el flujo de OAuth con variables de entorno opcionales:

    | Variable | Finalidad |
    | -------- | --------- |
    | `CHUTES_CLIENT_ID` | Identificador del cliente OAuth (se solicita si no está definido) |
    | `CHUTES_CLIENT_SECRET` | Secreto del cliente OAuth |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI de redirección (valor predeterminado: `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | Ámbitos separados por espacios (valor predeterminado: `openid profile chutes:invoke`) |

    Consulte la [documentación de OAuth de Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    para conocer los requisitos de la aplicación de redirección y obtener ayuda.

  </Accordion>

  <Accordion title="Notas">
    - Los modelos de Chutes se registran como `chutes/<model-id>`.
    - Chutes no informa del uso de tokens durante la transmisión (`supportsUsageInStreaming: false`); los totales de uso se muestran cuando finaliza la transmisión.

  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Reglas del proveedor, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema de configuración completo, incluidos los ajustes del proveedor.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Panel de Chutes y documentación de la API.
  </Card>
  <Card title="Claves de API de Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Cree y administre claves de API de Chutes.
  </Card>
</CardGroup>
