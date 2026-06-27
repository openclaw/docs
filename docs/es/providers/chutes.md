---
read_when:
    - Quieres usar Chutes con OpenClaw
    - Necesitas la ruta de configuración de OAuth o de la clave de API
    - Quieres el modelo predeterminado, los alias o el comportamiento de descubrimiento
summary: Configuración de Chutes (OAuth o clave de API, descubrimiento de modelos, alias)
title: Chutes
x-i18n:
    generated_at: "2026-06-27T12:34:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f1898c568fd664303a8bb5c2e46228c75f9c217bec5a65e752d9c7e10b980bb
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) expone catálogos de modelos de código abierto mediante una
API compatible con OpenAI. OpenClaw admite tanto OAuth en el navegador como autenticación
directa con clave de API para el proveedor `chutes`.

| Propiedad | Valor                        |
| -------- | ---------------------------- |
| Proveedor | `chutes`                     |
| API      | Compatible con OpenAI        |
| URL base | `https://llm.chutes.ai/v1`   |
| Autenticación | OAuth o clave de API (ver abajo) |

## Instalar Plugin

Instala el Plugin oficial y luego reinicia Gateway:

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Primeros pasos

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Ejecutar el flujo de incorporación de OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw inicia el flujo del navegador localmente, o muestra un flujo con URL y pegado
        de redirección en hosts remotos o sin interfaz gráfica. Los tokens de OAuth se actualizan
        automáticamente mediante los perfiles de autenticación de OpenClaw.
      </Step>
      <Step title="Verificar el modelo predeterminado">
        Después de la incorporación, el modelo predeterminado se establece en
        `chutes/zai-org/GLM-4.7-TEE` y se registra el catálogo estático de Chutes.
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
      <Step title="Verificar el modelo predeterminado">
        Después de la incorporación, el modelo predeterminado se establece en
        `chutes/zai-org/GLM-4.7-TEE` y se registra el catálogo estático de Chutes.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Ambas rutas de autenticación registran el catálogo estático de Chutes y establecen el modelo predeterminado en
`chutes/zai-org/GLM-4.7-TEE`. Variables de entorno de ejecución: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## Comportamiento de descubrimiento

Cuando la autenticación de Chutes está disponible, OpenClaw consulta el catálogo de Chutes con esa
credencial y usa los modelos descubiertos. Si el descubrimiento falla, OpenClaw recurre
a un catálogo estático para que la incorporación y el inicio sigan funcionando.

## Alias predeterminados

OpenClaw registra tres alias prácticos para el catálogo estático de Chutes:

| Alias           | Modelo de destino                                     |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Catálogo inicial integrado

El catálogo estático de respaldo incluye las referencias actuales de Chutes:

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
    Puedes personalizar el flujo de OAuth con variables de entorno opcionales:

    | Variable | Propósito |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | ID de cliente de OAuth personalizado |
    | `CHUTES_CLIENT_SECRET` | Secreto de cliente de OAuth personalizado |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI de redirección personalizada |
    | `CHUTES_OAUTH_SCOPES` | Ámbitos de OAuth personalizados |

    Consulta la [documentación de OAuth de Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    para ver los requisitos de la aplicación de redirección y obtener ayuda.

  </Accordion>

  <Accordion title="Notas">
    - La clave de API y el descubrimiento de OAuth usan el mismo id de proveedor `chutes`.
    - Los modelos de Chutes se registran como `chutes/<model-id>`.
    - Si el descubrimiento falla al iniciar, se usa automáticamente el catálogo estático.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Reglas de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Esquema de configuración completo, incluidos los ajustes de proveedores.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Panel de Chutes y documentación de la API.
  </Card>
  <Card title="Claves de API de Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Crea y administra claves de API de Chutes.
  </Card>
</CardGroup>
