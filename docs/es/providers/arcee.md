---
read_when:
    - Quieres usar Arcee AI con OpenClaw
    - Necesitas la variable de entorno de la clave de API o la opción de autenticación de la CLI
summary: Configuración de Arcee AI (autenticación + selección de modelo)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-07T15:08:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c3775ac2783da0833988c68621bd81c73a3b3e8240c26b4c1b590c1e9df2a8f
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) proporciona acceso a la familia Trinity de modelos de mezcla de expertos mediante una API compatible con OpenAI. Todos los modelos Trinity tienen licencia Apache 2.0.

Se puede acceder a los modelos de Arcee AI directamente mediante la plataforma Arcee o a través de [OpenRouter](/es/providers/openrouter).

| Propiedad | Valor                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Proveedor | `arcee`                                                                               |
| Autenticación     | `ARCEEAI_API_KEY` (directa) o `OPENROUTER_API_KEY` (mediante OpenRouter)                   |
| API      | Compatible con OpenAI                                                                     |
| URL base | `https://api.arcee.ai/api/v1` (directa) o `https://openrouter.ai/api/v1` (OpenRouter) |

## Primeros pasos

<Tabs>
  <Tab title="Directo (plataforma Arcee)">
    <Steps>
      <Step title="Obtén una clave de API">
        Crea una clave de API en [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Define un modelo predeterminado">
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
      <Step title="Obtén una clave de API">
        Crea una clave de API en [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Define un modelo predeterminado">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Las mismas referencias de modelo funcionan para configuraciones directas y con OpenRouter (por ejemplo, `arcee/trinity-large-thinking`).
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

OpenClaw incluye actualmente este catálogo Arcee incluido:

| Referencia de modelo                      | Nombre                   | Entrada | Contexto | Costo (entrada/salida por 1M) | Notas                                     |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | Modelo predeterminado; razonamiento activado          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | De propósito general; 400B parámetros, 13B activos  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | Rápido y rentable; llamada a funciones |

<Tip>
El ajuste preestablecido de incorporación define `arcee/trinity-large-thinking` como modelo predeterminado.
</Tip>

## Funciones admitidas

| Función                                       | Admitida                                    |
| --------------------------------------------- | -------------------------------------------- |
| Streaming                                     | Sí                                          |
| Uso de herramientas / llamada a funciones                   | Sí (Trinity Mini, Trinity Large Preview)    |
| Salida estructurada (modo JSON y esquema JSON) | Sí                                          |
| Pensamiento extendido                             | Sí (Trinity Large Thinking; herramientas deshabilitadas) |

<AccordionGroup>
  <Accordion title="Nota sobre el entorno">
    Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `ARCEEAI_API_KEY`
    (o `OPENROUTER_API_KEY`) esté disponible para ese proceso (por ejemplo, en
    `~/.openclaw/.env` o mediante `env.shellEnv`).
  </Accordion>

  <Accordion title="Enrutamiento de OpenRouter">
    Al usar modelos Arcee mediante OpenRouter, se aplican las mismas referencias de modelo `arcee/*`.
    OpenClaw gestiona el enrutamiento de forma transparente según tu opción de autenticación. Consulta la
    [documentación del proveedor OpenRouter](/es/providers/openrouter) para ver detalles de configuración
    específicos de OpenRouter.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/es/providers/openrouter" icon="shuffle">
    Accede a los modelos Arcee y a muchos otros mediante una sola clave de API.
  </Card>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
</CardGroup>
