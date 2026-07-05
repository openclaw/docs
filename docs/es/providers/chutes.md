---
read_when:
    - Quieres usar Chutes con OpenClaw
    - Necesitas la ruta de configuración de OAuth o de la clave de API
    - Quieres el modelo predeterminado, los alias o el comportamiento de descubrimiento
summary: Configuración de Chutes (OAuth o clave de API, descubrimiento de modelos, alias)
title: Toboganes
x-i18n:
    generated_at: "2026-07-05T11:35:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) expone catálogos de modelos de código abierto mediante una
API compatible con OpenAI. OpenClaw admite autenticación OAuth en navegador y con clave de API.

| Propiedad         | Valor                                                   |
| ----------------- | ------------------------------------------------------- |
| Proveedor         | `chutes`                                                |
| Plugin            | paquete externo oficial (`@openclaw/chutes-provider`) |
| API               | compatible con OpenAI                                  |
| URL base          | `https://llm.chutes.ai/v1`                              |
| Autenticación     | OAuth o clave de API (consulta abajo)                  |
| Variables de entorno de runtime | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`                  |

`CHUTES_OAUTH_TOKEN` proporciona directamente un token de acceso OAuth ya obtenido
(por ejemplo, en CI), omitiendo el flujo interactivo de navegador de abajo.

## Instalar Plugin

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Primeros pasos

Ambas rutas establecen el modelo predeterminado en `chutes/zai-org/GLM-4.7-TEE` y registran
el catálogo de Chutes.

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Ejecutar el flujo de incorporación OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw inicia el flujo de navegador localmente, o muestra un flujo de URL + pegar redirección
        en hosts remotos/sin interfaz. Los tokens OAuth se actualizan automáticamente mediante los perfiles
        de autenticación de OpenClaw.
      </Step>
    </Steps>
  </Tab>
  <Tab title="Clave de API">
    <Steps>
      <Step title="Obtener una clave de API">
        Crea una clave en
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
credencial y usa los modelos detectados, almacenados en caché durante 5 minutos por cada
credencial. Si una clave caducó/no está autorizada (HTTP 401), OpenClaw reintenta una vez
sin credenciales. Si la detección aún no devuelve filas, falla o devuelve cualquier
otro estado que no sea 2xx, recurre al catálogo estático incluido (la detección con clave de API
y con OAuth usan esta misma ruta). Si la detección falla al iniciar, el
catálogo estático se usa automáticamente.

## Alias predeterminados

OpenClaw registra tres alias prácticos para el catálogo de Chutes:

| Alias           | Modelo de destino                                      |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Catálogo inicial integrado

El catálogo de respaldo incluido tiene 47 modelos. Una muestra representativa de las referencias actuales:

| Referencia de modelo                                  |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

Ejecuta `openclaw models list --all --provider chutes` para obtener la lista completa.

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
  <Accordion title="Anulaciones de OAuth">
    Personaliza el flujo OAuth con variables de entorno opcionales:

    | Variable | Propósito |
    | -------- | --------- |
    | `CHUTES_CLIENT_ID` | id de cliente OAuth (se solicita si no está definido) |
    | `CHUTES_CLIENT_SECRET` | secreto de cliente OAuth |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI de redirección (predeterminada `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | Ámbitos separados por espacios (predeterminado `openid profile chutes:invoke`) |

    Consulta la [documentación OAuth de Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    para ver los requisitos de la aplicación de redirección y obtener ayuda.

  </Accordion>

  <Accordion title="Notas">
    - Los modelos de Chutes se registran como `chutes/<model-id>`.
    - Chutes no informa el uso de tokens durante la transmisión (`supportsUsageInStreaming: false`); los totales de uso se muestran igualmente cuando se completa la transmisión.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Reglas de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema completo de configuración, incluidos los ajustes de proveedores.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Panel de Chutes y documentación de la API.
  </Card>
  <Card title="Claves de API de Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Crea y administra claves de API de Chutes.
  </Card>
</CardGroup>
