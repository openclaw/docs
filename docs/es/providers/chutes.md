---
read_when:
    - Desea usar Chutes con OpenClaw
    - Necesitas la ruta de configuración de OAuth o de la clave de API
    - Quieres el modelo predeterminado, los alias o el comportamiento de descubrimiento
summary: Configuración de Chutes (OAuth o clave de API, descubrimiento de modelos, alias)
title: Chutes
x-i18n:
    generated_at: "2026-04-30T05:57:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52e2c767604ff50cc7fe1a5fcfac03c35345facf2225e80f62476bbc3852199a
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) expone catálogos de modelos de código abierto mediante una
API compatible con OpenAI. OpenClaw admite tanto OAuth en navegador como autenticación directa con clave de API
para el proveedor `chutes` incluido.

| Propiedad | Valor                        |
| -------- | ---------------------------- |
| Proveedor | `chutes`                     |
| API      | Compatible con OpenAI        |
| URL base | `https://llm.chutes.ai/v1`   |
| Autenticación | OAuth o clave de API (consulta abajo) |

## Primeros pasos

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Run the OAuth onboarding flow">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw inicia el flujo del navegador localmente, o muestra una URL + un flujo de
        redirección y pegado en hosts remotos/sin interfaz. Los tokens de OAuth se actualizan automáticamente mediante los perfiles de
        autenticación de OpenClaw.
      </Step>
      <Step title="Verify the default model">
        Después de la incorporación, el modelo predeterminado se establece en
        `chutes/zai-org/GLM-4.7-TEE` y se registra el catálogo Chutes incluido.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="Get an API key">
        Crea una clave en
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Run the API key onboarding flow">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Verify the default model">
        Después de la incorporación, el modelo predeterminado se establece en
        `chutes/zai-org/GLM-4.7-TEE` y se registra el catálogo Chutes incluido.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Ambas rutas de autenticación registran el catálogo Chutes incluido y establecen el modelo predeterminado en
`chutes/zai-org/GLM-4.7-TEE`. Variables de entorno de tiempo de ejecución: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## Comportamiento de descubrimiento

Cuando la autenticación de Chutes está disponible, OpenClaw consulta el catálogo Chutes con esa
credencial y usa los modelos descubiertos. Si el descubrimiento falla, OpenClaw recurre
a un catálogo estático incluido para que la incorporación y el inicio sigan funcionando.

## Alias predeterminados

OpenClaw registra tres alias prácticos para el catálogo Chutes incluido:

| Alias           | Modelo de destino                                    |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Catálogo inicial integrado

El catálogo de respaldo incluido contiene referencias actuales de Chutes:

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
  <Accordion title="OAuth overrides">
    Puedes personalizar el flujo de OAuth con variables de entorno opcionales:

    | Variable | Propósito |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | ID de cliente OAuth personalizado |
    | `CHUTES_CLIENT_SECRET` | Secreto de cliente OAuth personalizado |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI de redirección personalizada |
    | `CHUTES_OAUTH_SCOPES` | Ámbitos OAuth personalizados |

    Consulta la [documentación de OAuth de Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    para conocer los requisitos de la aplicación de redirección y obtener ayuda.

  </Accordion>

  <Accordion title="Notes">
    - Tanto el descubrimiento con clave de API como con OAuth usan el mismo id de proveedor `chutes`.
    - Los modelos de Chutes se registran como `chutes/<model-id>`.
    - Si el descubrimiento falla durante el inicio, se usa automáticamente el catálogo estático incluido.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Reglas de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Configuration reference" href="/es/gateway/configuration-reference" icon="gear">
    Esquema de configuración completo, incluida la configuración de proveedores.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Panel de Chutes y documentación de la API.
  </Card>
  <Card title="Chutes API keys" href="https://chutes.ai/settings/api-keys" icon="key">
    Crea y administra claves de API de Chutes.
  </Card>
</CardGroup>
