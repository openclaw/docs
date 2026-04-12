---
read_when:
    - Quieres usar Arcee AI con OpenClaw
    - Necesitas la variable de entorno de la clave de API o la opción de autenticación de la CLI
summary: Configuración de Arcee AI (autenticación + selección de modelo)
title: Arcee AI
x-i18n:
    generated_at: "2026-04-12T23:29:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68c5fddbe272c69611257ceff319c4de7ad21134aaf64582d60720a6f3b853cc
    source_path: providers/arcee.md
    workflow: 15
---

# Arcee AI

[Arcee AI](https://arcee.ai) proporciona acceso a la familia Trinity de modelos de mezcla de expertos mediante una API compatible con OpenAI. Todos los modelos Trinity tienen licencia Apache 2.0.

Se puede acceder directamente a los modelos de Arcee AI mediante la plataforma Arcee o a través de [OpenRouter](/es/providers/openrouter).

| Property | Value                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Proveedor | `arcee`                                                                               |
| Autenticación | `ARCEEAI_API_KEY` (directo) o `OPENROUTER_API_KEY` (mediante OpenRouter)                   |
| API      | Compatible con OpenAI                                                                     |
| URL base | `https://api.arcee.ai/api/v1` (directo) o `https://openrouter.ai/api/v1` (OpenRouter) |

## Primeros pasos

<Tabs>
  <Tab title="Directo (plataforma Arcee)">
    <Steps>
      <Step title="Obtener una clave de API">
        Crea una clave de API en [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Ejecutar onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Establecer un modelo predeterminado">
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

  <Tab title="Mediante OpenRouter">
    <Steps>
      <Step title="Obtener una clave de API">
        Crea una clave de API en [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Ejecutar onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Establecer un modelo predeterminado">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Las mismas referencias de modelo funcionan tanto para configuraciones directas como con OpenRouter (por ejemplo, `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuración no interactiva

<Tabs>
  <Tab title="Directo (plataforma Arcee)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Mediante OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## Catálogo integrado

OpenClaw actualmente incluye este catálogo integrado de Arcee:

| Referencia de modelo           | Nombre                 | Entrada | Contexto | Costo (ent./sal. por 1M) | Notas                                     |
| ------------------------------ | ---------------------- | ------- | -------- | ------------------------ | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text    | 256K     | $0.25 / $0.90            | Modelo predeterminado; razonamiento habilitado |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text    | 128K     | $0.25 / $1.00            | Propósito general; 400B parámetros, 13B activos |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text    | 128K     | $0.045 / $0.15           | Rápido y rentable; llamada de funciones |

<Tip>
El preajuste de onboarding establece `arcee/trinity-large-thinking` como modelo predeterminado.
</Tip>

## Funcionalidades compatibles

| Feature                                       | Compatible                    |
| --------------------------------------------- | ---------------------------- |
| Streaming                                     | Sí                           |
| Uso de herramientas / llamada de funciones    | Sí                           |
| Salida estructurada (modo JSON y esquema JSON) | Sí                          |
| Pensamiento extendido                         | Sí (Trinity Large Thinking)  |

<AccordionGroup>
  <Accordion title="Nota sobre el entorno">
    Si Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `ARCEEAI_API_KEY`
    (o `OPENROUTER_API_KEY`) esté disponible para ese proceso (por ejemplo, en
    `~/.openclaw/.env` o mediante `env.shellEnv`).
  </Accordion>

  <Accordion title="Enrutamiento de OpenRouter">
    Al usar modelos de Arcee mediante OpenRouter, se aplican las mismas referencias de modelo `arcee/*`.
    OpenClaw maneja el enrutamiento de forma transparente según tu elección de autenticación. Consulta la
    [documentación del proveedor OpenRouter](/es/providers/openrouter) para ver detalles de configuración
    específicos de OpenRouter.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/es/providers/openrouter" icon="shuffle">
    Accede a los modelos de Arcee y a muchos otros mediante una sola clave de API.
  </Card>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de failover.
  </Card>
</CardGroup>
