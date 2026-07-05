---
read_when:
    - Quieres usar Fireworks con OpenClaw
    - Necesitas la variable de entorno de la clave de API de Fireworks o el id de modelo predeterminado
    - Estás depurando el comportamiento de Kimi con razonamiento desactivado en Fireworks
summary: Configuración de Fireworks (autenticación + selección de modelo)
title: Fuegos artificiales
x-i18n:
    generated_at: "2026-07-05T11:35:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15feed0730ec65d943f103824468490be6616478ece80bedfeb9ad8137506180
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) expone modelos de pesos abiertos y enrutados mediante una API compatible con OpenAI. Instala el Plugin oficial de proveedor Fireworks para usar dos modelos Kimi precatalogados y cualquier modelo o id de enrutador de Fireworks en tiempo de ejecución.

| Propiedad              | Valor                                                  |
| ---------------------- | ------------------------------------------------------ |
| Id de proveedor        | `fireworks` (alias: `fireworks-ai`)                    |
| Paquete                | `@openclaw/fireworks-provider`                         |
| Variable env de auth   | `FIREWORKS_API_KEY`                                    |
| Flag de incorporación  | `--auth-choice fireworks-api-key`                      |
| Flag directa de CLI    | `--fireworks-api-key <key>`                            |
| API                    | Compatible con OpenAI (`openai-completions`)           |
| URL base               | `https://api.fireworks.ai/inference/v1`                |
| Modelo predeterminado  | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Alias predeterminado   | `Kimi K2.5 Turbo`                                      |

## Primeros pasos

<Steps>
  <Step title="Instala el Plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Configura la clave de API de Fireworks">
    <CodeGroup>

```bash Incorporación
openclaw onboard --auth-choice fireworks-api-key
```

```bash Flag directa
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Solo env
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    La incorporación guarda la clave para el proveedor `fireworks` en tus perfiles de autenticación y establece el enrutador **Fire Pass** Kimi K2.5 Turbo como modelo predeterminado.

  </Step>
  <Step title="Verifica que el modelo esté disponible">
    ```bash
    openclaw models list --provider fireworks
    ```

    La lista debería incluir `Kimi K2.6` y `Kimi K2.5 Turbo (Fire Pass)`. Si `FIREWORKS_API_KEY` no se resuelve, `openclaw models status --json` informa la credencial faltante en `auth.unusableProfiles`.

  </Step>
</Steps>

## Configuración no interactiva

Para instalaciones con scripts o CI, pasa todo en la línea de comandos:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catálogo integrado

| Ref. de modelo                                         | Nombre                      | Entrada        | Contexto | Salida máx. | Razonamiento                 |
| ------------------------------------------------------ | --------------------------- | -------------- | -------- | ----------- | ---------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | texto + imagen | 262,144  | 262,144     | Forzado a desactivado        |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | texto + imagen | 256,000  | 256,000     | Forzado a desactivado (predeterminado) |

<Note>
  OpenClaw fija todos los modelos Kimi de Fireworks en `thinking: off` porque Kimi en Fireworks puede filtrar la cadena de pensamiento en la respuesta visible a menos que la solicitud desactive explícitamente el razonamiento. Enrutar el mismo modelo directamente mediante [Moonshot](/es/providers/moonshot) conserva la salida de razonamiento de Kimi. Consulta los [modos de razonamiento](/es/tools/thinking) para cambiar entre proveedores.
</Note>

## Ids de modelos personalizados de Fireworks

OpenClaw acepta cualquier modelo o id de enrutador de Fireworks en tiempo de ejecución. Usa el id exacto que muestra Fireworks y antepón `fireworks/`. La resolución dinámica clona la plantilla Fire Pass (entrada de texto + imagen, API compatible con OpenAI, costo predeterminado cero) y desactiva el razonamiento automáticamente cuando el id coincide con el patrón de Kimi. Los ids dinámicos de GLM se marcan como solo texto a menos que configures una entrada de modelo personalizada con entrada de imagen.

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
  <Accordion title="Cómo funciona el prefijo de id de modelo">
    Cada ref. de modelo de Fireworks en OpenClaw empieza con `fireworks/`, seguido del id exacto o la ruta de enrutador de la plataforma Fireworks. Por ejemplo:

    - Modelo de enrutador: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Modelo directo: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw elimina el prefijo `fireworks/` al construir la solicitud de API y envía la ruta restante al endpoint de Fireworks como el campo `model` compatible con OpenAI.

  </Accordion>

  <Accordion title="Por qué el razonamiento se fuerza a desactivado para Kimi">
    Fireworks sirve Kimi sin un canal de razonamiento separado, por lo que la cadena de pensamiento puede aparecer en el flujo visible de `content`. En cada solicitud Kimi de Fireworks, OpenClaw envía `thinking: { type: "disabled" }` y elimina `reasoning`, `reasoning_effort` y `reasoningEffort` del payload (`extensions/fireworks/stream.ts`). La política del proveedor (`extensions/fireworks/thinking-policy.ts`) anuncia solo el nivel de razonamiento `off` para ids de modelos Kimi, de modo que los cambios manuales de `/think` y las superficies de política del proveedor permanezcan alineados con el contrato de tiempo de ejecución.

    Para usar el razonamiento de Kimi de extremo a extremo, configura el [proveedor Moonshot](/es/providers/moonshot) y enruta el mismo modelo a través de él.

  </Accordion>

  <Accordion title="Disponibilidad del entorno para el daemon">
    Si el Gateway se ejecuta como un servicio administrado (launchd, systemd, Docker), la clave de Fireworks debe ser visible para ese proceso, no solo para tu shell interactiva.

    <Warning>
      Una clave exportada solo en una shell interactiva no ayudará a un daemon launchd o systemd a menos que ese entorno también se importe allí. Configura la clave en `~/.openclaw/.env` o mediante `env.shellEnv` para que el proceso del gateway pueda leerla.
    </Warning>

    OpenClaw carga `~/.openclaw/.env` cuando carga la configuración, por lo que las claves guardadas allí llegan a los servicios de gateway administrados en todas las plataformas. Reinicia el gateway (o vuelve a ejecutar `openclaw doctor --fix`) después de rotar la clave.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, refs. de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Modos de razonamiento" href="/es/tools/thinking" icon="brain">
    Niveles de `/think`, políticas de proveedor y enrutamiento de modelos con capacidad de razonamiento.
  </Card>
  <Card title="Moonshot" href="/es/providers/moonshot" icon="moon">
    Ejecuta Kimi con salida de razonamiento nativa mediante la propia API de Moonshot.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
