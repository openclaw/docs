---
read_when:
    - Quieres usar Fireworks con OpenClaw
    - Se necesita la variable de entorno de la clave de API de Fireworks o el id. del modelo predeterminado
    - Estás depurando el comportamiento de Kimi con el razonamiento desactivado en Fireworks
summary: Configuración de Fireworks (autenticación + selección de modelo)
title: Fireworks
x-i18n:
    generated_at: "2026-07-19T02:08:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7720b23b69aa716d2e2903f5644bb74f81ca1c5e753f71d72d4d7a25c0747884
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) ofrece modelos de pesos abiertos y enrutados mediante una API compatible con OpenAI. Instale el Plugin oficial del proveedor Fireworks para usar dos modelos Kimi precatalogados y cualquier modelo o id de enrutador de Fireworks en tiempo de ejecución.

| Propiedad                    | Valor                                                  |
| ---------------------------- | ------------------------------------------------------ |
| Id del proveedor             | `fireworks` (alias: `fireworks-ai`)                    |
| Paquete                      | `@openclaw/fireworks-provider`                         |
| Variable de entorno de autenticación | `FIREWORKS_API_KEY`                                    |
| Opción de incorporación      | `--auth-choice fireworks-api-key`                      |
| Opción directa de la CLI     | `--fireworks-api-key <key>`                            |
| API                          | Compatible con OpenAI (`openai-completions`)               |
| URL base                     | `https://api.fireworks.ai/inference/v1`                |
| Modelo predeterminado        | `fireworks/accounts/fireworks/routers/kimi-k2p6-turbo` |
| Alias predeterminado         | `Kimi K2.6 Turbo`                                      |

## Primeros pasos

<Steps>
  <Step title="Instalar el Plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Configurar la clave de API de Fireworks">
    <CodeGroup>

```bash Incorporación
openclaw onboard --auth-choice fireworks-api-key
```

```bash Opción directa
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Solo variable de entorno
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    La incorporación almacena la clave para el proveedor `fireworks` en los perfiles de autenticación y establece el enrutador Kimi K2.6 Turbo **Fire Pass** como modelo predeterminado.

  </Step>
  <Step title="Verificar que el modelo esté disponible">
    ```bash
    openclaw models list --provider fireworks
    ```

    La lista debe incluir `Kimi K2.6` y `Kimi K2.6 Turbo (Fire Pass)`. Si `FIREWORKS_API_KEY` no se resuelve, `openclaw models status --json` informa de la credencial ausente en `auth.unusableProfiles`.

  </Step>
</Steps>

## Configuración no interactiva

Para instalaciones mediante scripts o Pipeline de CI, pase todos los parámetros en la línea de comandos:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catálogo integrado

| Referencia del modelo                                  | Nombre                      | Entrada        | Contexto | Salida máxima | Razonamiento                 |
| ------------------------------------------------------ | --------------------------- | -------------- | -------- | ------------- | ---------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | texto + imagen | 262,144  | 262,144       | Desactivado obligatoriamente |
| `fireworks/accounts/fireworks/routers/kimi-k2p6-turbo` | Kimi K2.6 Turbo (Fire Pass) | texto + imagen | 256,000  | 256,000       | Desactivado obligatoriamente (predeterminado) |

<Note>
  OpenClaw fija todos los modelos Kimi de Fireworks en `thinking: off` porque Kimi en Fireworks puede filtrar la cadena de pensamiento en la respuesta visible, a menos que la solicitud desactive explícitamente el razonamiento. Enrutar el mismo modelo directamente mediante [Moonshot](/es/providers/moonshot) conserva la salida de razonamiento de Kimi. Consulte los [modos de razonamiento](/es/tools/thinking) para cambiar de proveedor.
</Note>

## Id de modelos personalizados de Fireworks

OpenClaw acepta cualquier id de modelo o enrutador de Fireworks en tiempo de ejecución. Use el id exacto que muestra Fireworks y añada el prefijo `fireworks/`. La resolución dinámica clona la plantilla de Fire Pass (entrada de texto + imagen, API compatible con OpenAI y coste predeterminado cero) y desactiva automáticamente el razonamiento cuando el id coincide con el patrón de Kimi. Los id dinámicos de GLM se marcan como solo texto, a menos que se configure una entrada de modelo personalizada con entrada de imagen.

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
  <Accordion title="Cómo funciona el uso de prefijos en los id de modelo">
    Cada referencia de modelo de Fireworks en OpenClaw comienza por `fireworks/`, seguida del id o la ruta del enrutador exactos de la plataforma Fireworks. Por ejemplo:

    - Modelo de enrutador: `fireworks/accounts/fireworks/routers/kimi-k2p6-turbo`
    - Modelo directo: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw elimina el prefijo `fireworks/` al construir la solicitud a la API y envía la ruta restante al endpoint de Fireworks como el campo `model` compatible con OpenAI.

  </Accordion>

  <Accordion title="Por qué se desactiva obligatoriamente el razonamiento para Kimi">
    Fireworks ofrece Kimi sin un canal de razonamiento independiente, por lo que la cadena de pensamiento puede aparecer en el flujo visible `content`. En cada solicitud de Kimi a Fireworks, OpenClaw envía `thinking: { type: "disabled" }` y elimina `reasoning`, `reasoning_effort` y `reasoningEffort` de la carga útil (`extensions/fireworks/stream.ts`). La política del proveedor (`extensions/fireworks/thinking-policy.ts`) anuncia únicamente el nivel de razonamiento `off` para los id de modelos Kimi, de modo que los cambios manuales de `/think` y las superficies de políticas del proveedor se mantengan alineados con el contrato de tiempo de ejecución.

    Para usar el razonamiento de Kimi de extremo a extremo, configure el [proveedor Moonshot](/es/providers/moonshot) y enrute el mismo modelo mediante él.

  </Accordion>

  <Accordion title="Disponibilidad del entorno para el daemon">
    Si el Gateway se ejecuta como servicio gestionado (launchd, systemd, Docker), la clave de Fireworks debe ser visible para ese proceso, no solo para el shell interactivo.

    <Warning>
      Una clave exportada únicamente en un shell interactivo no servirá para un daemon de launchd o systemd, a menos que ese entorno también se importe allí. Configure la clave en `~/.openclaw/.env` o mediante `env.shellEnv` para que el proceso del gateway pueda leerla.
    </Warning>

    OpenClaw carga `~/.openclaw/.env` al cargar la configuración, por lo que las claves almacenadas allí llegan a los servicios gestionados del gateway en todas las plataformas. Reinicie el gateway (o vuelva a ejecutar `openclaw doctor --fix`) después de rotar la clave.

  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Selección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Modos de razonamiento" href="/es/tools/thinking" icon="brain">
    Niveles de `/think`, políticas de proveedores y enrutamiento de modelos con capacidad de razonamiento.
  </Card>
  <Card title="Moonshot" href="/es/providers/moonshot" icon="moon">
    Ejecute Kimi con salida de razonamiento nativa mediante la API propia de Moonshot.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
