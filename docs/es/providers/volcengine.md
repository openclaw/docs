---
read_when:
    - Quieres usar Volcano Engine o modelos Doubao con OpenClaw
    - Necesitas configurar la API key de Volcengine
summary: Configuración de Volcano Engine (modelos Doubao, endpoints generales y de código)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-12T23:33:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: a21f390da719f79c88c6d55a7d952d35c2ce5ff26d910c9f10020132cd7d2f4c
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

El proveedor Volcengine da acceso a modelos Doubao y modelos de terceros
alojados en Volcano Engine, con endpoints separados para cargas de trabajo
generales y de código.

| Detail    | Value                                               |
| --------- | --------------------------------------------------- |
| Proveedores | `volcengine` (general) + `volcengine-plan` (código) |
| Auth      | `VOLCANO_ENGINE_API_KEY`                            |
| API       | Compatible con OpenAI                               |

## Primeros pasos

<Steps>
  <Step title="Configura la API key">
    Ejecuta el onboarding interactivo:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Esto registra tanto los proveedores generales (`volcengine`) como los de código (`volcengine-plan`) con una sola API key.

  </Step>
  <Step title="Configura un modelo predeterminado">
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
  <Step title="Verifica que el modelo esté disponible">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Para configuración no interactiva (CI, scripts), pasa la clave directamente:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Proveedores y endpoints

| Provider          | Endpoint                                  | Use case       |
| ----------------- | ----------------------------------------- | -------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Modelos generales |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Modelos de código  |

<Note>
Ambos proveedores se configuran con una sola API key. La configuración registra ambos automáticamente.
</Note>

## Modelos disponibles

<Tabs>
  <Tab title="General (volcengine)">
    | Model ref                                    | Name                            | Input       | Context |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | text, image | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | text, image | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | text, image | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | text, image | 128,000 |
  </Tab>
  <Tab title="Coding (volcengine-plan)">
    | Model ref                                         | Name                     | Input | Context |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | text  | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | text  | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | text  | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | text  | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | text  | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text  | 256,000 |
  </Tab>
</Tabs>

## Notas avanzadas

<AccordionGroup>
  <Accordion title="Modelo predeterminado después del onboarding">
    `openclaw onboard --auth-choice volcengine-api-key` actualmente configura
    `volcengine-plan/ark-code-latest` como modelo predeterminado, a la vez que registra
    el catálogo general `volcengine`.
  </Accordion>

  <Accordion title="Comportamiento de fallback del selector de modelos">
    Durante la selección de modelo en onboarding/configuración, la opción de autenticación de Volcengine prefiere
    tanto las filas `volcengine/*` como `volcengine-plan/*`. Si esos modelos todavía no
    se han cargado, OpenClaw hace fallback al catálogo sin filtrar en lugar de mostrar un
    selector vacío con ámbito de proveedor.
  </Accordion>

  <Accordion title="Variables de entorno para procesos daemon">
    Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que
    `VOLCANO_ENGINE_API_KEY` esté disponible para ese proceso (por ejemplo, en
    `~/.openclaw/.env` o mediante `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Cuando OpenClaw se ejecuta como servicio en segundo plano, las variables de entorno configuradas en tu
shell interactiva no se heredan automáticamente. Consulta la nota sobre daemons más arriba.
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de failover.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
  <Card title="Resolución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y pasos de depuración.
  </Card>
  <Card title="Preguntas frecuentes" href="/es/help/faq" icon="circle-question">
    Preguntas frecuentes sobre la configuración de OpenClaw.
  </Card>
</CardGroup>
