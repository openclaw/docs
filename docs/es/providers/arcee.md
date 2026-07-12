---
read_when:
    - Quieres usar Arcee AI con OpenClaw
    - Necesitas la variable de entorno de la clave de API o la opción de autenticación de la CLI
summary: Configuración de Arcee AI (autenticación + selección del modelo)
title: Arcee AI
x-i18n:
    generated_at: "2026-07-11T23:28:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe519393db3cf39f1b14b8121603b6f667102ac8c122fb6560d9b73a6ee6b0a3
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) ofrece la familia Trinity de modelos de mezcla de expertos mediante una API compatible con OpenAI. Todos los modelos Trinity tienen licencia Apache 2.0. Arcee es un plugin oficial de OpenClaw que no está incluido en el núcleo, por lo que debe instalarse antes de la incorporación.

Accede a los modelos de Arcee directamente mediante la plataforma Arcee o a través de [OpenRouter](/es/providers/openrouter).

| Propiedad | Valor                                                                                  |
| --------- | -------------------------------------------------------------------------------------- |
| Proveedor | `arcee`                                                                                |
| Autenticación | `ARCEEAI_API_KEY` (directa) o `OPENROUTER_API_KEY` (mediante OpenRouter)           |
| API       | Compatible con OpenAI                                                                  |
| URL base  | `https://api.arcee.ai/api/v1` (directa) o `https://openrouter.ai/api/v1` (OpenRouter)  |

## Instalar el plugin

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## Primeros pasos

<Tabs>
  <Tab title="Directo (plataforma Arcee)">
    <Steps>
      <Step title="Obtener una clave de API">
        Crea una clave de API en [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Ejecutar la incorporación">
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
      <Step title="Ejecutar la incorporación">
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

        Las mismas referencias de modelo funcionan tanto para la configuración directa como para la de OpenRouter.
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

| Referencia del modelo           | Nombre                 | Entrada | Contexto | Salida máxima | Coste (entrada/salida por 1 M) | Herramientas | Notas                                              |
| ------------------------------- | ---------------------- | ------- | -------- | ------------- | ----------------------------- | ------------ | -------------------------------------------------- |
| `arcee/trinity-large-thinking`  | Trinity Large Thinking | texto   | 256K     | 80K           | $0.25 / $0.90                 | No           | Modelo predeterminado; razonamiento extendido      |
| `arcee/trinity-large-preview`   | Trinity Large Preview  | texto   | 128K     | 16K           | $0.25 / $1.00                 | Sí           | Uso general; 400B parámetros, 13B activos          |
| `arcee/trinity-mini`            | Trinity Mini 26B       | texto   | 128K     | 80K           | $0.045 / $0.15                | Sí           | Rápido y económico; llamadas a funciones           |

<Tip>
El ajuste preestablecido de incorporación establece `arcee/trinity-large-thinking` como modelo predeterminado.
</Tip>

## Funciones compatibles

| Función                                             | Compatibilidad                                      |
| --------------------------------------------------- | --------------------------------------------------- |
| Transmisión en tiempo real                          | Sí                                                  |
| Uso de herramientas / llamadas a funciones         | Sí (Trinity Mini, Trinity Large Preview)            |
| Salida estructurada (modo JSON y esquema JSON)      | Sí                                                  |
| Razonamiento extendido                              | Sí (Trinity Large Thinking; herramientas desactivadas) |

<AccordionGroup>
  <Accordion title="Nota sobre el entorno">
    Si el Gateway se ejecuta como demonio (launchd/systemd), asegúrate de que `ARCEEAI_API_KEY`
    (o `OPENROUTER_API_KEY`) esté disponible para ese proceso, por ejemplo en
    `~/.openclaw/.env` o mediante `env.shellEnv`.
  </Accordion>

  <Accordion title="Enrutamiento de OpenRouter">
    Al usar modelos de Arcee mediante OpenRouter, se aplican las mismas referencias de modelo `arcee/*`.
    OpenClaw realiza el enrutamiento de forma transparente según la opción de autenticación elegida. Consulta la
    [documentación del proveedor OpenRouter](/es/providers/openrouter) para obtener información específica de OpenRouter
    sobre la configuración.
  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/es/providers/openrouter" icon="shuffle">
    Accede a los modelos de Arcee y a muchos otros mediante una única clave de API.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
</CardGroup>
