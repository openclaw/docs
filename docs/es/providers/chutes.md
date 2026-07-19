---
read_when:
    - Quieres usar Chutes con OpenClaw
    - Necesita la ruta de configuración de OAuth o de la clave de API
    - Se desea configurar el modelo predeterminado, los alias o el comportamiento de detección
summary: Configuración de Chutes (OAuth o clave de API, descubrimiento de modelos, alias)
title: Chutes
x-i18n:
    generated_at: "2026-07-19T02:09:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 57ea5112105f19028c1a348b4d7fec4cf7ef12de00b1b2de9c152057bf5033a9
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) expone catálogos de modelos de código abierto mediante una
API compatible con OpenAI. OpenClaw admite tanto OAuth mediante navegador como autenticación con clave de API.

| Propiedad        | Valor                                                   |
| ---------------- | ------------------------------------------------------- |
| Proveedor        | `chutes`                                      |
| Plugin           | paquete externo oficial (`@openclaw/chutes-provider`)            |
| API              | compatible con OpenAI                                   |
| URL base         | `https://llm.chutes.ai/v1`                                      |
| Autenticación    | OAuth o clave de API (véase a continuación)             |
| Variables de entorno del entorno de ejecución | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN` |

`CHUTES_OAUTH_TOKEN` proporciona directamente un token de acceso OAuth ya obtenido
(por ejemplo, en CI), lo que omite el flujo interactivo mediante navegador descrito a continuación.

## Instalar el plugin

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Primeros pasos

Ambas vías establecen el modelo predeterminado en `chutes/zai-org/GLM-5-TEE` y registran
el catálogo de Chutes.

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Ejecutar el flujo de incorporación de OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw inicia el flujo mediante navegador de forma local o muestra una URL y un flujo
        para pegar la redirección en hosts remotos o sin interfaz gráfica. Los tokens OAuth se actualizan
        automáticamente mediante los perfiles de autenticación de OpenClaw.
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
credencial y utiliza los modelos detectados, que se almacenan en caché durante 5 minutos por
credencial. Si una clave ha caducado o no está autorizada (HTTP 401), OpenClaw vuelve a intentarlo una vez
sin credenciales. Si la detección sigue sin devolver filas, falla o devuelve cualquier
otro estado distinto de 2xx, recurre al catálogo estático incluido (tanto la detección
con clave de API como con OAuth utiliza esta misma vía). Si la detección falla durante el inicio,
el catálogo estático se utiliza automáticamente.

## Alias predeterminados

OpenClaw registra dos alias prácticos para el catálogo de Chutes:

| Alias           | Modelo de destino                      |
| --------------- | -------------------------------------- |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE` |
| `chutes-vision` | `chutes/moonshotai/Kimi-K2.5-TEE`      |

## Catálogo inicial integrado

El catálogo alternativo incluido contiene estos cinco modelos disponibles actualmente:

| Referencia del modelo                  |
| -------------------------------------- |
| `chutes/zai-org/GLM-5-TEE`             |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE` |
| `chutes/moonshotai/Kimi-K2.5-TEE`      |
| `chutes/MiniMaxAI/MiniMax-M2.5-TEE`    |
| `chutes/Qwen/Qwen3.5-397B-A17B-TEE`    |

Ejecute `openclaw models list --all --provider chutes` para consultar la lista completa.

## Ejemplo de configuración

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-5-TEE" },
      models: {
        "chutes/zai-org/GLM-5-TEE": { alias: "Chutes GLM 5" },
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
    | `CHUTES_CLIENT_ID` | Id. de cliente de OAuth (se solicita si no se ha definido) |
    | `CHUTES_CLIENT_SECRET` | Secreto de cliente de OAuth |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI de redirección (valor predeterminado: `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | Ámbitos separados por espacios (valor predeterminado: `openid profile chutes:invoke`) |

    Consulte la [documentación de OAuth de Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    para conocer los requisitos de las aplicaciones de redirección y obtener ayuda.

  </Accordion>

  <Accordion title="Notas">
    - Los modelos de Chutes se registran como `chutes/<model-id>`.
    - Chutes no informa del uso de tokens durante la transmisión (`supportsUsageInStreaming: false`); los totales de uso se muestran cuando se completa la transmisión.

  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Reglas de los proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema de configuración completo, incluida la configuración de los proveedores.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Panel de control y documentación de la API de Chutes.
  </Card>
  <Card title="Claves de API de Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Cree y gestione claves de API de Chutes.
  </Card>
</CardGroup>
