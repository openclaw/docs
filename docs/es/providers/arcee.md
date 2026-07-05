---
read_when:
    - Quieres usar Arcee AI con OpenClaw
    - Necesitas la variable de entorno de la clave de API o elegir la autenticación de la CLI
summary: Configuración de Arcee AI (autenticación + selección de modelo)
title: Arcee AI
x-i18n:
    generated_at: "2026-07-05T11:38:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe519393db3cf39f1b14b8121603b6f667102ac8c122fb6560d9b73a6ee6b0a3
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) proporciona la familia Trinity de modelos de mezcla de expertos mediante una API compatible con OpenAI. Todos los modelos Trinity tienen licencia Apache 2.0. Arcee es un Plugin oficial de OpenClaw, no incluido en el núcleo, por lo que necesita un paso de instalación antes de la incorporación.

Accede a los modelos de Arcee directamente mediante la plataforma de Arcee o mediante [OpenRouter](/es/providers/openrouter).

| Propiedad | Valor                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Proveedor | `arcee`                                                                               |
| Autenticación     | `ARCEEAI_API_KEY` (directo) o `OPENROUTER_API_KEY` (mediante OpenRouter)                   |
| API      | Compatible con OpenAI                                                                     |
| URL base | `https://api.arcee.ai/api/v1` (directo) o `https://openrouter.ai/api/v1` (OpenRouter) |

## Instalar Plugin

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## Primeros pasos

<Tabs>
  <Tab title="Directo (plataforma de Arcee)">
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

        Las mismas referencias de modelo funcionan tanto para configuraciones directas como de OpenRouter.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuración no interactiva

<Tabs>
  <Tab title="Directo (plataforma de Arcee)">
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

| Ref. de modelo                 | Nombre                 | Entrada | Contexto | Salida máx. | Costo (entrada/salida por 1 M) | Herramientas | Notas                                     |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------- | ----- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | texto  | 256K    | 80K        | $0.25 / $0.90        | No    | Modelo predeterminado; razonamiento extendido          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | texto  | 128K    | 16K        | $0.25 / $1.00        | Sí   | Uso general; 400B parámetros, 13B activos  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | texto  | 128K    | 80K        | $0.045 / $0.15       | Sí   | Rápido y rentable; llamadas a funciones |

<Tip>
El ajuste preestablecido de incorporación define `arcee/trinity-large-thinking` como el modelo predeterminado.
</Tip>

## Funciones compatibles

| Función                                       | Compatible                                    |
| --------------------------------------------- | -------------------------------------------- |
| Streaming                                     | Sí                                          |
| Uso de herramientas / llamadas a funciones                   | Sí (Trinity Mini, Trinity Large Preview)    |
| Salida estructurada (modo JSON y esquema JSON) | Sí                                          |
| Razonamiento extendido                             | Sí (Trinity Large Thinking; herramientas deshabilitadas) |

<AccordionGroup>
  <Accordion title="Nota sobre el entorno">
    Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `ARCEEAI_API_KEY`
    (o `OPENROUTER_API_KEY`) esté disponible para ese proceso, por ejemplo en
    `~/.openclaw/.env` o mediante `env.shellEnv`.
  </Accordion>

  <Accordion title="Enrutamiento de OpenRouter">
    Al usar modelos de Arcee mediante OpenRouter, se aplican las mismas referencias de modelo `arcee/*`.
    OpenClaw enruta de forma transparente según tu opción de autenticación. Consulta la
    [documentación del proveedor OpenRouter](/es/providers/openrouter) para ver detalles de
    configuración específicos de OpenRouter.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/es/providers/openrouter" icon="shuffle">
    Accede a modelos de Arcee y muchos otros mediante una sola clave de API.
  </Card>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
</CardGroup>
