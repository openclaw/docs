---
read_when:
    - Quieres usar Fireworks con OpenClaw
    - Necesitas la variable de entorno de la clave de API de Fireworks o el id del modelo predeterminado
    - Estás depurando el comportamiento de Kimi con razonamiento desactivado en Fireworks
summary: Configuración de Fireworks (autenticación + selección de modelo)
title: Fireworks
x-i18n:
    generated_at: "2026-06-27T12:36:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7413ec9ea192921ce9b9ec51da5b0b9ff1030feeef192afbefc938ed200e192e
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) expone modelos de pesos abiertos y modelos enrutados mediante una API compatible con OpenAI. Instala el plugin oficial del proveedor Fireworks para usar dos modelos Kimi precatalogados y cualquier modelo o id de enrutador de Fireworks en tiempo de ejecución.

| Propiedad              | Valor                                                  |
| ---------------------- | ------------------------------------------------------ |
| Id del proveedor       | `fireworks` (alias: `fireworks-ai`)                    |
| Paquete                | `@openclaw/fireworks-provider`                         |
| Variable env de auth   | `FIREWORKS_API_KEY`                                    |
| Flag de onboarding     | `--auth-choice fireworks-api-key`                      |
| Flag directo de CLI    | `--fireworks-api-key <key>`                            |
| API                    | compatible con OpenAI (`openai-completions`)           |
| URL base               | `https://api.fireworks.ai/inference/v1`                |
| Modelo predeterminado  | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Alias predeterminado   | `Kimi K2.5 Turbo`                                      |

## Primeros pasos

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Set the Fireworks API key">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice fireworks-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Env only
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    El onboarding almacena la clave para el proveedor `fireworks` en tus perfiles de autenticación y establece el enrutador **Fire Pass** Kimi K2.5 Turbo como modelo predeterminado.

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider fireworks
    ```

    La lista debería incluir `Kimi K2.6` y `Kimi K2.5 Turbo (Fire Pass)`. Si `FIREWORKS_API_KEY` no se resuelve, `openclaw models status --json` informa la credencial faltante en `auth.unusableProfiles`.

  </Step>
</Steps>

## Configuración no interactiva

Para instalaciones con scripts o en CI, pasa todo por la línea de comandos:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catálogo integrado

| Ref del modelo                                         | Nombre                      | Entrada        | Contexto | Salida máx. | Thinking                      |
| ------------------------------------------------------ | --------------------------- | -------------- | -------- | ----------- | ----------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | texto + imagen | 262,144  | 262,144     | Forzado a desactivado         |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | texto + imagen | 256,000  | 256,000     | Forzado a desactivado (pred.) |

<Note>
  OpenClaw fija todos los modelos Kimi de Fireworks en `thinking: off` porque Fireworks rechaza los parámetros de thinking de Kimi en producción. Enrutar el mismo modelo directamente mediante [Moonshot](/es/providers/moonshot) conserva la salida de razonamiento de Kimi. Consulta [modos de thinking](/es/tools/thinking) para cambiar entre proveedores.
</Note>

## Ids de modelo personalizados de Fireworks

OpenClaw acepta cualquier id de modelo o enrutador de Fireworks en tiempo de ejecución. Usa el id exacto que muestra Fireworks y antepónle `fireworks/`. La resolución dinámica clona la plantilla de Fire Pass (entrada de texto + imagen, API compatible con OpenAI, coste predeterminado cero) y desactiva thinking automáticamente cuando el id coincide con el patrón de Kimi. Los ids dinámicos de GLM se marcan como solo texto a menos que configures una entrada de modelo personalizada con entrada de imagen.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/models/<your-model-id>",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="How model id prefixing works">
    Cada ref de modelo de Fireworks en OpenClaw empieza con `fireworks/`, seguido del id exacto o la ruta del enrutador de la plataforma Fireworks. Por ejemplo:

    - Modelo de enrutador: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Modelo directo: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw elimina el prefijo `fireworks/` al construir la solicitud de API y envía la ruta restante al endpoint de Fireworks como el campo `model` compatible con OpenAI.

  </Accordion>

  <Accordion title="Why thinking is forced off for Kimi">
    Fireworks K2.6 devuelve un 400 si la solicitud contiene parámetros `reasoning_*`, aunque Kimi admite thinking mediante la propia API de Moonshot. La política del proveedor (`extensions/fireworks/thinking-policy.ts`) anuncia solo el nivel de thinking `off` para los ids de modelo Kimi, de modo que los cambios manuales `/think` y las superficies de política del proveedor permanezcan alineados con el contrato de tiempo de ejecución.

    Para usar el razonamiento de Kimi de extremo a extremo, configura el [proveedor Moonshot](/es/providers/moonshot) y enruta el mismo modelo mediante él.

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    Si el Gateway se ejecuta como un servicio gestionado (launchd, systemd, Docker), la clave de Fireworks debe ser visible para ese proceso, no solo para tu shell interactivo.

    <Warning>
      Una clave exportada solo en un shell interactivo no ayudará a un demonio launchd o systemd a menos que ese entorno también se importe allí. Define la clave en `~/.openclaw/.env` o mediante `env.shellEnv` para que pueda leerse desde el proceso del gateway.
    </Warning>

    En macOS, `openclaw gateway install` ya conecta `~/.openclaw/.env` al archivo de entorno de LaunchAgent. Vuelve a ejecutar la instalación (o `openclaw doctor --fix`) después de rotar la clave.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model providers" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, refs de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Thinking modes" href="/es/tools/thinking" icon="brain">
    Niveles de `/think`, políticas de proveedor y enrutamiento de modelos capaces de razonar.
  </Card>
  <Card title="Moonshot" href="/es/providers/moonshot" icon="moon">
    Ejecuta Kimi con salida nativa de thinking mediante la propia API de Moonshot.
  </Card>
  <Card title="Troubleshooting" href="/es/help/troubleshooting" icon="wrench">
    Solución de problemas general y preguntas frecuentes.
  </Card>
</CardGroup>
