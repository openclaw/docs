---
read_when:
    - Quieres usar Fireworks con OpenClaw
    - Necesitas la variable de entorno de la clave de API de Fireworks o el id del modelo predeterminado
summary: Configuración de Fireworks (autenticación + selección de modelo)
title: Fireworks
x-i18n:
    generated_at: "2026-04-24T05:44:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66ad831b9a04897c8850f28d246ec6c1efe1006c2a7f59295a8a78746c78e645
    source_path: providers/fireworks.md
    workflow: 15
---

[Fireworks](https://fireworks.ai) expone modelos open-weight y enrutados mediante una API compatible con OpenAI. OpenClaw incluye un Plugin de proveedor de Fireworks integrado.

| Propiedad     | Valor                                                  |
| ------------- | ------------------------------------------------------ |
| Proveedor     | `fireworks`                                            |
| Autenticación | `FIREWORKS_API_KEY`                                    |
| API           | Chat/completions compatible con OpenAI                 |
| URL base      | `https://api.fireworks.ai/inference/v1`                |
| Modelo predeterminado | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## Primeros pasos

<Steps>
  <Step title="Configurar la autenticación de Fireworks mediante la incorporación">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    Esto guarda tu clave de Fireworks en la configuración de OpenClaw y establece el modelo inicial de Fire Pass como predeterminado.

  </Step>
  <Step title="Verificar que el modelo esté disponible">
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

| Referencia de modelo                                   | Nombre                      | Entrada    | Contexto | Salida máxima | Notas                                                                                                                                                 |
| ------------------------------------------------------ | --------------------------- | ---------- | -------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | text,image | 262,144  | 262,144       | Último modelo Kimi en Fireworks. El razonamiento está desactivado para solicitudes Fireworks K2.6; enrútalo directamente mediante Moonshot si necesitas salida de razonamiento de Kimi. |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000  | 256,000       | Modelo inicial integrado predeterminado en Fireworks                                                                                                  |

<Tip>
Si Fireworks publica un modelo más nuevo, como una nueva versión de Qwen o Gemma, puedes cambiar directamente a él usando su id de modelo de Fireworks sin esperar a una actualización del catálogo integrado.
</Tip>

## Ids de modelo personalizados de Fireworks

OpenClaw también acepta ids dinámicos de modelos de Fireworks. Usa el id exacto del modelo o del router mostrado por Fireworks y añádele el prefijo `fireworks/`.

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
  <Accordion title="Cómo funciona el prefijo del id del modelo">
    Cada referencia de modelo de Fireworks en OpenClaw comienza con `fireworks/` seguida del id exacto o la ruta del router de la plataforma Fireworks. Por ejemplo:

    - Modelo de router: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Modelo directo: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw elimina el prefijo `fireworks/` al construir la solicitud de API y envía la ruta restante al endpoint de Fireworks.

  </Accordion>

  <Accordion title="Nota sobre el entorno">
    Si el Gateway se ejecuta fuera de tu shell interactiva, asegúrate de que `FIREWORKS_API_KEY` también esté disponible para ese proceso.

    <Warning>
    Una clave situada solo en `~/.profile` no servirá para un daemon launchd/systemd a menos que ese entorno también se importe allí. Establece la clave en `~/.openclaw/.env` o mediante `env.shellEnv` para garantizar que el proceso del gateway pueda leerla.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de alternativas.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
