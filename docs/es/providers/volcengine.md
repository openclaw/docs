---
read_when:
    - Quieres usar Volcano Engine o modelos Doubao con OpenClaw
    - Necesitas la configuración de la clave API de Volcengine
summary: Configuración de Volcano Engine (modelos Doubao, endpoints generales + de coding)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-24T05:47:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6091da50fbab3a01cdc4337a496f361987f1991a2e2b7764e7a9c8c464e9757a
    source_path: providers/volcengine.md
    workflow: 15
---

El proveedor de Volcengine da acceso a modelos Doubao y a modelos de terceros
alojados en Volcano Engine, con endpoints separados para cargas de trabajo
generales y de coding.

| Detalle   | Valor                                               |
| --------- | --------------------------------------------------- |
| Proveedores | `volcengine` (general) + `volcengine-plan` (coding) |
| Autenticación | `VOLCANO_ENGINE_API_KEY`                         |
| API       | Compatible con OpenAI                               |

## Primeros pasos

<Steps>
  <Step title="Establecer la clave API">
    Ejecuta la incorporación interactiva:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Esto registra tanto los proveedores general (`volcengine`) como de coding (`volcengine-plan`) a partir de una sola clave API.

  </Step>
  <Step title="Establecer un modelo predeterminado">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Verificar que el modelo esté disponible">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Para configuración no interactiva (CI, scripting), pasa la clave directamente:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Proveedores y endpoints

| Proveedor         | Endpoint                                  | Caso de uso     |
| ----------------- | ----------------------------------------- | --------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Modelos generales |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Modelos de coding |

<Note>
Ambos proveedores se configuran a partir de una única clave API. La configuración registra ambos automáticamente.
</Note>

## Catálogo integrado

<Tabs>
  <Tab title="General (volcengine)">
    | Referencia de modelo                           | Nombre                          | Entrada     | Contexto |
    | ---------------------------------------------- | ------------------------------- | ----------- | -------- |
    | `volcengine/doubao-seed-1-8-251228`            | Doubao Seed 1.8                 | texto, imagen | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028`   | doubao-seed-code-preview-251028 | texto, imagen | 256,000 |
    | `volcengine/kimi-k2-5-260127`                  | Kimi K2.5                       | texto, imagen | 256,000 |
    | `volcengine/glm-4-7-251222`                    | GLM 4.7                         | texto, imagen | 200,000 |
    | `volcengine/deepseek-v3-2-251201`              | DeepSeek V3.2                   | texto, imagen | 128,000 |
  </Tab>
  <Tab title="Coding (volcengine-plan)">
    | Referencia de modelo                                | Nombre                   | Entrada | Contexto |
    | --------------------------------------------------- | ------------------------ | ------- | -------- |
    | `volcengine-plan/ark-code-latest`                   | Ark Coding Plan          | texto   | 256,000  |
    | `volcengine-plan/doubao-seed-code`                  | Doubao Seed Code         | texto   | 256,000  |
    | `volcengine-plan/glm-4.7`                           | GLM 4.7 Coding           | texto   | 200,000  |
    | `volcengine-plan/kimi-k2-thinking`                  | Kimi K2 Thinking         | texto   | 256,000  |
    | `volcengine-plan/kimi-k2.5`                         | Kimi K2.5 Coding         | texto   | 256,000  |
    | `volcengine-plan/doubao-seed-code-preview-251028`   | Doubao Seed Code Preview | texto   | 256,000  |
  </Tab>
</Tabs>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modelo predeterminado después de la incorporación">
    `openclaw onboard --auth-choice volcengine-api-key` actualmente establece
    `volcengine-plan/ark-code-latest` como modelo predeterminado, al tiempo que también registra
    el catálogo general `volcengine`.
  </Accordion>

  <Accordion title="Comportamiento de fallback del selector de modelos">
    Durante la incorporación/configuración de selección de modelos, la opción de autenticación de Volcengine prefiere
    tanto las filas `volcengine/*` como `volcengine-plan/*`. Si esos modelos no están
    cargados aún, OpenClaw recurre al catálogo sin filtrar en lugar de mostrar un
    selector vacío limitado al proveedor.
  </Accordion>

  <Accordion title="Variables de entorno para procesos daemon">
    Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que
    `VOLCANO_ENGINE_API_KEY` esté disponible para ese proceso (por ejemplo, en
    `~/.openclaw/.env` o mediante `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Al ejecutar OpenClaw como servicio en segundo plano, las variables de entorno establecidas en tu
shell interactivo no se heredan automáticamente. Consulta la nota sobre daemon anterior.
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y pasos de depuración.
  </Card>
  <Card title="Preguntas frecuentes" href="/es/help/faq" icon="circle-question">
    Preguntas frecuentes sobre la configuración de OpenClaw.
  </Card>
</CardGroup>
