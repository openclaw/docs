---
read_when:
    - Quieres usar Arcee AI con OpenClaw
    - Necesitas la variable de entorno de la clave de API o la opción de autenticación de la CLI
summary: Configuración de Arcee AI (autenticación + selección de modelo)
title: Arcee AI
x-i18n:
    generated_at: "2026-06-27T12:34:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15570c1d018104377a473fe5f9b556d9a6ffd2dea6db5d55d46ca3702e237101
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) proporciona acceso a la familia Trinity de modelos de mezcla de expertos mediante una API compatible con OpenAI. Todos los modelos Trinity tienen licencia Apache 2.0.

Se puede acceder a los modelos de Arcee AI directamente mediante la plataforma Arcee o a través de [OpenRouter](/es/providers/openrouter).

| Propiedad | Valor                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Proveedor | `arcee`                                                                               |
| Autenticación     | `ARCEEAI_API_KEY` (directo) o `OPENROUTER_API_KEY` (mediante OpenRouter)                   |
| API      | Compatible con OpenAI                                                                     |
| URL base | `https://api.arcee.ai/api/v1` (directo) o `https://openrouter.ai/api/v1` (OpenRouter) |

## Instalar Plugin

Instala el Plugin oficial y luego reinicia Gateway:

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## Primeros pasos

<Tabs>
  <Tab title="Direct (Arcee platform)">
    <Steps>
      <Step title="Get an API key">
        Crea una clave de API en [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Via OpenRouter">
    <Steps>
      <Step title="Get an API key">
        Crea una clave de API en [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Las mismas referencias de modelo funcionan tanto para las configuraciones directas como para las de OpenRouter (por ejemplo, `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuración no interactiva

<Tabs>
  <Tab title="Direct (Arcee platform)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Via OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## Catálogo integrado

OpenClaw incluye actualmente este catálogo estático de Arcee:

| Referencia de modelo                      | Nombre                   | Entrada | Contexto | Costo (entrada/salida por 1M) | Notas                                     |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | texto  | 256K    | $0.25 / $0.90        | Modelo predeterminado; razonamiento habilitado          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | texto  | 128K    | $0.25 / $1.00        | De propósito general; 400B parámetros, 13B activos  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | texto  | 128K    | $0.045 / $0.15       | Rápido y rentable; llamada a funciones |

<Tip>
El preajuste de incorporación establece `arcee/trinity-large-thinking` como modelo predeterminado.
</Tip>

## Funciones compatibles

| Función                                       | Compatible                                    |
| --------------------------------------------- | -------------------------------------------- |
| Streaming                                     | Sí                                          |
| Uso de herramientas / llamada a funciones                   | Sí (Trinity Mini, Trinity Large Preview)    |
| Salida estructurada (modo JSON y esquema JSON) | Sí                                          |
| Razonamiento extendido                             | Sí (Trinity Large Thinking; herramientas deshabilitadas) |

<AccordionGroup>
  <Accordion title="Environment note">
    Si Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `ARCEEAI_API_KEY`
    (o `OPENROUTER_API_KEY`) esté disponible para ese proceso (por ejemplo, en
    `~/.openclaw/.env` o mediante `env.shellEnv`).
  </Accordion>

  <Accordion title="OpenRouter routing">
    Al usar modelos de Arcee mediante OpenRouter, se aplican las mismas referencias de modelo `arcee/*`.
    OpenClaw gestiona el enrutamiento de forma transparente según tu opción de autenticación. Consulta la
    [documentación del proveedor OpenRouter](/es/providers/openrouter) para obtener detalles de configuración
    específicos de OpenRouter.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/es/providers/openrouter" icon="shuffle">
    Accede a modelos de Arcee y muchos otros mediante una sola clave de API.
  </Card>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
</CardGroup>
