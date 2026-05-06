---
read_when:
    - Quieres usar Fireworks con OpenClaw
    - Necesitas la variable de entorno de la clave de API de Fireworks o el identificador del modelo predeterminado
    - Estás depurando el comportamiento de Kimi con el razonamiento desactivado en Fireworks
summary: Configuración de Fireworks (autenticación + selección de modelo)
title: Fuegos artificiales
x-i18n:
    generated_at: "2026-05-06T05:45:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a7dcaf6c7e1c004436213e67bc2262992ee1307cdaa5c290225345782f4cbfa
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) expone modelos de pesos abiertos y enrutados mediante una API compatible con OpenAI. OpenClaw incluye un Plugin de proveedor Fireworks incluido que se distribuye con dos modelos Kimi precatalogados y acepta cualquier ID de modelo o router de Fireworks en tiempo de ejecución.

| Propiedad           | Valor                                                  |
| ------------------- | ------------------------------------------------------ |
| ID del proveedor    | `fireworks` (alias: `fireworks-ai`)                    |
| Plugin              | incluido, `enabledByDefault: true`                     |
| Variable env de auth | `FIREWORKS_API_KEY`                                    |
| Marca de onboarding | `--auth-choice fireworks-api-key`                      |
| Marca CLI directa   | `--fireworks-api-key <key>`                            |
| API                 | compatible con OpenAI (`openai-completions`)           |
| URL base            | `https://api.fireworks.ai/inference/v1`                |
| Modelo predeterminado | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Alias predeterminado | `Kimi K2.5 Turbo`                                      |

## Primeros pasos

<Steps>
  <Step title="Configura la clave de API de Fireworks">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice fireworks-api-key
```

```bash Marca directa
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Solo env
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    El onboarding almacena la clave para el proveedor `fireworks` en tus perfiles de auth y establece el router Kimi K2.5 Turbo de **Fire Pass** como modelo predeterminado.

  </Step>
  <Step title="Verifica que el modelo esté disponible">
    ```bash
    openclaw models list --provider fireworks
    ```

    La lista debería incluir `Kimi K2.6` y `Kimi K2.5 Turbo (Fire Pass)`. Si `FIREWORKS_API_KEY` no se puede resolver, `openclaw models status --json` informa la credencial faltante en `auth.unusableProfiles`.

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

| Ref. de modelo                                         | Nombre                      | Entrada       | Contexto | Salida máx. | Thinking             |
| ------------------------------------------------------ | --------------------------- | ------------- | -------- | ----------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | texto + imagen | 262,144 | 262,144     | Desactivado forzosamente |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | texto + imagen | 256,000 | 256,000     | Desactivado forzosamente (predeterminado) |

<Note>
  OpenClaw fija todos los modelos Kimi de Fireworks en `thinking: off` porque Fireworks rechaza los parámetros de thinking de Kimi en producción. Enrutar el mismo modelo directamente mediante [Moonshot](/es/providers/moonshot) conserva la salida de razonamiento de Kimi. Consulta [modos de thinking](/es/tools/thinking) para cambiar entre proveedores.
</Note>

## IDs de modelo Fireworks personalizados

OpenClaw acepta cualquier ID de modelo o router de Fireworks en tiempo de ejecución. Usa el ID exacto que muestra Fireworks y anteponle `fireworks/`. La resolución dinámica clona la plantilla de Fire Pass (entrada de texto + imagen, API compatible con OpenAI, costo predeterminado cero) y desactiva el thinking automáticamente cuando el ID coincide con el patrón de Kimi.

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
  <Accordion title="Cómo funciona el prefijo de ID de modelo">
    Cada ref. de modelo Fireworks en OpenClaw empieza con `fireworks/` seguido del ID o la ruta de router exactos de la plataforma Fireworks. Por ejemplo:

    - Modelo de router: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Modelo directo: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw elimina el prefijo `fireworks/` al construir la solicitud de API y envía la ruta restante al endpoint de Fireworks como el campo `model` compatible con OpenAI.

  </Accordion>

  <Accordion title="Por qué el thinking se desactiva forzosamente para Kimi">
    Fireworks K2.6 devuelve un 400 si la solicitud lleva parámetros `reasoning_*`, aunque Kimi admite thinking mediante la propia API de Moonshot. La política incluida (`extensions/fireworks/thinking-policy.ts`) anuncia solo el nivel de thinking `off` para los IDs de modelo Kimi, de modo que los cambios manuales con `/think` y las superficies de política de proveedor permanezcan alineados con el contrato de tiempo de ejecución.

    Para usar el razonamiento de Kimi de extremo a extremo, configura el [proveedor Moonshot](/es/providers/moonshot) y enruta el mismo modelo mediante él.

  </Accordion>

  <Accordion title="Disponibilidad del entorno para el daemon">
    Si el Gateway se ejecuta como un servicio administrado (launchd, systemd, Docker), la clave de Fireworks debe ser visible para ese proceso, no solo para tu shell interactiva.

    <Warning>
      Una clave que solo esté en `~/.profile` no ayudará a un daemon de launchd o systemd a menos que ese entorno también se importe allí. Configura la clave en `~/.openclaw/.env` o mediante `env.shellEnv` para que el proceso del Gateway pueda leerla.
    </Warning>

    En macOS, `openclaw gateway install` ya conecta `~/.openclaw/.env` al archivo de entorno del LaunchAgent. Vuelve a ejecutar la instalación (o `openclaw doctor --fix`) después de rotar la clave.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, refs. de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Modos de thinking" href="/es/tools/thinking" icon="brain">
    Niveles de `/think`, políticas de proveedor y enrutamiento de modelos con capacidad de razonamiento.
  </Card>
  <Card title="Moonshot" href="/es/providers/moonshot" icon="moon">
    Ejecuta Kimi con salida de thinking nativa mediante la propia API de Moonshot.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución de problemas general y preguntas frecuentes.
  </Card>
</CardGroup>
