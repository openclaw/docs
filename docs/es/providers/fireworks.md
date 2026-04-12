---
read_when:
    - Quieres usar Fireworks con OpenClaw
    - Necesitas la variable de entorno de la clave de API de Fireworks o el id del modelo predeterminado
summary: Configuración de Fireworks (autenticación + selección de modelo)
title: Fireworks
x-i18n:
    generated_at: "2026-04-12T23:30:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a85d9507c19e275fdd846a303d844eda8045d008774d4dde1eae408e8716b6f
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) expone modelos de peso abierto y enrutados mediante una API compatible con OpenAI. OpenClaw incluye un Plugin de proveedor Fireworks integrado.

| Property      | Value                                                  |
| ------------- | ------------------------------------------------------ |
| Provider      | `fireworks`                                            |
| Auth          | `FIREWORKS_API_KEY`                                    |
| API           | chat/completions compatible con OpenAI                 |
| Base URL      | `https://api.fireworks.ai/inference/v1`                |
| Default model | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## Primeros pasos

<Steps>
  <Step title="Set up Fireworks auth through onboarding">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    Esto almacena tu clave de Fireworks en la configuración de OpenClaw y establece el modelo inicial Fire Pass como predeterminado.

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## Ejemplo no interactivo

Para configuraciones automatizadas o de CI, pasa todos los valores en la línea de comandos:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catálogo integrado

| Model ref                                              | Name                        | Input      | Context | Max output | Notes                                      |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | ---------- | ------------------------------------------ |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000    | Modelo inicial integrado predeterminado en Fireworks |

<Tip>
Si Fireworks publica un modelo más reciente, como una nueva versión de Qwen o Gemma, puedes cambiar directamente a él usando su id de modelo de Fireworks sin esperar una actualización del catálogo integrado.
</Tip>

## Ids de modelo personalizados de Fireworks

OpenClaw también acepta ids de modelo dinámicos de Fireworks. Usa el id exacto del modelo o router que muestra Fireworks y antepón `fireworks/`.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="How model id prefixing works">
    Toda referencia de modelo de Fireworks en OpenClaw comienza con `fireworks/` seguida del id exacto o la ruta del router de la plataforma Fireworks. Por ejemplo:

    - Modelo de router: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Modelo directo: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw elimina el prefijo `fireworks/` al construir la solicitud a la API y envía la ruta restante al endpoint de Fireworks.

  </Accordion>

  <Accordion title="Nota sobre el entorno">
    Si el Gateway se ejecuta fuera de tu shell interactiva, asegúrate de que `FIREWORKS_API_KEY` también esté disponible para ese proceso.

    <Warning>
    Una clave ubicada solo en `~/.profile` no ayudará a un daemon de launchd/systemd a menos que ese entorno también se importe allí. Establece la clave en `~/.openclaw/.env` o mediante `env.shellEnv` para asegurarte de que el proceso del gateway pueda leerla.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
